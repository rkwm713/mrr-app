/**
 * SPIDAcalc specific parsing functions
 * 
 * This file contains functions for extracting data from SPIDAcalc JSON structure
 * according to the mapping requirements.
 */

/**
 * Gets the owner of a pole from SPIDAcalc data
 * 
 * @param {Object} spidaPoleDesignStructure - The structure.pole object from the Measured design
 * @returns {string} - The pole owner or "Unknown" if not found
 */
function getSpidaPoleOwner(spidaPoleDesignStructure) {
    try {
        // Extract owner.id from the pole in the structure
        return getNestedValue(spidaPoleDesignStructure, ['owner', 'id'], 'Unknown');
    } catch (error) {
        console.error('Error extracting pole owner:', error);
        return 'Unknown';
    }
}

/**
 * Gets the pole number from SPIDAcalc data, using various possible sources
 * 
 * @param {Object} spidaLocationData - The SPIDAcalc location object
 * @returns {string} - The pole number or "Unknown" if not found
 */
function getSpidaPoleNumber(spidaLocationData) {
    try {
        // Check location label first (primary identifier)
        const label = getNestedValue(spidaLocationData, ['label'], null);
        if (label) return label;
        
        // Check clientItemAlias as a secondary source
        const designStructure = getNestedValue(spidaLocationData, ['designs'], [])
            .find(design => design.layerType === 'Measured');
            
        const clientItemAlias = getNestedValue(designStructure, 
            ['structure', 'pole', 'clientItemAlias'], null);
        if (clientItemAlias) return clientItemAlias;
        
        // Check poleTags as a tertiary source
        const poleTags = getNestedValue(spidaLocationData, ['poleTags'], []);
        if (Array.isArray(poleTags) && poleTags.length > 0) {
            // Try to find a tag that seems like a pole number
            for (const tag of poleTags) {
                if (tag.name === 'pole_number' || tag.name === 'pole_id') {
                    return tag.value;
                }
            }
            // If no specific tag found, just return the first one
            return getNestedValue(poleTags, [0, 'value'], 'Unknown');
        }
        
        return 'Unknown';
    } catch (error) {
        console.error('Error extracting pole number:', error);
        return 'Unknown';
    }
}

/**
 * Gets the pole definition from SPIDAcalc clientData by reference ID
 * 
 * @param {string} poleStructureRef - The reference ID from structure.pole.clientItem.id
 * @param {Array} clientDataPolesList - The array of pole definitions from clientData.poles
 * @returns {Object|null} - The pole definition or null if not found
 */
function getSpidaPoleDefinitionByRef(poleStructureRef, clientDataPolesList) {
    try {
        if (!poleStructureRef || !clientDataPolesList || !Array.isArray(clientDataPolesList)) {
            return null;
        }
        
        // Find the pole definition by matching its alias.id to the reference
        return clientDataPolesList.find(pole => {
            if (pole.aliases && Array.isArray(pole.aliases)) {
                return pole.aliases.some(alias => alias.id === poleStructureRef);
            }
            return false;
        }) || null;
    } catch (error) {
        console.error('Error finding pole definition:', error);
        return null;
    }
}

/**
 * Creates a formatted string describing pole structure (species and class)
 * 
 * @param {Object} spidaPoleDefEntry - The pole definition from clientData.poles
 * @returns {string} - Formatted string like "Southern Pine 3" or partial if missing data
 */
function getSpidaPoleStructureString(spidaPoleDefEntry) {
    try {
        if (!spidaPoleDefEntry) return 'Unknown';
        
        const species = getNestedValue(spidaPoleDefEntry, ['species'], '');
        const classOfPole = getNestedValue(spidaPoleDefEntry, ['classOfPole'], '');
        
        if (species && classOfPole) {
            return `${species} ${classOfPole}`;
        } else if (species) {
            return species;
        } else if (classOfPole) {
            return `Class ${classOfPole}`;
        } else {
            return 'Unknown';
        }
    } catch (error) {
        console.error('Error formatting pole structure:', error);
        return 'Unknown';
    }
}

/**
 * Determines if SPIDAcalc data indicates a proposed riser
 * 
 * @param {Object} spidaRecommendedDesignStructure - The structure object from Recommended design
 * @param {Array} clientDataEquipments - The equipments array from clientData
 * @returns {boolean} - True if a riser is proposed
 */
function getSpidaProposedRiser(spidaRecommendedDesignStructure, clientDataEquipments) {
    try {
        // Get equipment items from the recommended design
        const equipments = getNestedValue(spidaRecommendedDesignStructure, ['equipments'], []);
        
        // Check each equipment item
        for (const equipment of equipments) {
            const equipmentRefId = getNestedValue(equipment, ['clientItem', 'id'], null);
            
            // Find the equipment definition in clientData
            const equipmentDef = clientDataEquipments.find(eq => {
                if (eq.aliases && Array.isArray(eq.aliases)) {
                    return eq.aliases.some(alias => alias.id === equipmentRefId);
                }
                return false;
            });
            
            // Check if the equipment type is RISER
            if (equipmentDef && 
                getNestedValue(equipmentDef, ['type', 'name'], '').toUpperCase() === 'RISER') {
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error checking for proposed riser:', error);
        return false;
    }
}

/**
 * Determines if SPIDAcalc data indicates a proposed guy
 * 
 * @param {Object} spidaRecommendedDesignStructure - The structure object from Recommended design
 * @returns {boolean} - True if a guy is proposed
 */
function getSpidaProposedGuy(spidaRecommendedDesignStructure) {
    try {
        // Check if there are any guys in the recommended design
        const guys = getNestedValue(spidaRecommendedDesignStructure, ['guys'], []);
        if (Array.isArray(guys) && guys.length > 0) {
            return true;
        }
        
        // Also check spanGuys if needed
        const spanGuys = getNestedValue(spidaRecommendedDesignStructure, ['spanGuys'], []);
        if (Array.isArray(spanGuys) && spanGuys.length > 0) {
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking for proposed guy:', error);
        return false;
    }
}

/**
 * Gets the PLA (Percent Loading Analysis) value from the recommended design
 * 
 * @param {Object} spidaRecommendedDesign - The recommended design object
 * @returns {number|null} - PLA value as a percentage or null if not found
 */
function getSpidaPlaRecommended(spidaRecommendedDesign) {
    try {
        // Try to get stressRatio directly from the pole
        const stressRatio = getNestedValue(
            spidaRecommendedDesign, 
            ['structure', 'pole', 'stressRatio'], 
            null
        );
        
        if (stressRatio !== null) {
            // Convert from ratio to percentage
            return stressRatio * 100;
        }
        
        // If no direct stressRatio, check analysis results
        const analysisArray = getNestedValue(spidaRecommendedDesign, ['analysis'], []);
        
        // Find a relevant analysis case (there might be multiple)
        for (const analysis of analysisArray) {
            const results = getNestedValue(analysis, ['results'], []);
            
            // Look for a pole component with PERCENT unit
            const poleResult = results.find(result => 
                (result.component && result.component.includes('Pole')) && 
                result.unit === 'PERCENT'
            );
            
            if (poleResult) {
                return poleResult.actual;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting PLA:', error);
        return null;
    }
}

/**
 * Gets the construction grade from the analysis
 * 
 * @param {Array} spidaRecommendedDesignAnalysis - The analysis array from the recommended design
 * @returns {string} - Construction grade or "Unknown" if not found
 */
function getSpidaConstructionGrade(spidaRecommendedDesignAnalysis) {
    try {
        if (!Array.isArray(spidaRecommendedDesignAnalysis) || 
            spidaRecommendedDesignAnalysis.length === 0) {
            return 'Unknown';
        }
        
        // Look for construction grade in each analysis case
        for (const analysis of spidaRecommendedDesignAnalysis) {
            const constructionGrade = getNestedValue(
                analysis, 
                ['analysisCaseDetails', 'constructionGrade'], 
                null
            );
            
            if (constructionGrade) {
                return constructionGrade;
            }
        }
        
        return 'Unknown';
    } catch (error) {
        console.error('Error extracting construction grade:', error);
        return 'Unknown';
    }
}

/**
 * Gets height of the lowest communication wire in mid-span
 * 
 * @param {Array} spidaMeasuredDesignStructureWires - The wires array from measured design
 * @param {Array} clientDataWires - The wires array from clientData for lookups
 * @returns {number|null} - Height in feet or null if not found
 */
function getSpidaLowestCommMidspanHeight(spidaMeasuredDesignStructureWires, clientDataWires) {
    try {
        if (!Array.isArray(spidaMeasuredDesignStructureWires) || 
            spidaMeasuredDesignStructureWires.length === 0) {
            return null;
        }
        
        let minCommHeight = Number.POSITIVE_INFINITY;
        let commWireFound = false;
        
        // Examine each wire
        for (const wire of spidaMeasuredDesignStructureWires) {
            // Get wire reference to check against clientData
            const wireRefId = getNestedValue(wire, ['clientItem', 'id'], null);
            
            if (!wireRefId) continue;
            
            // Find wire definition in clientData
            const wireDef = clientDataWires.find(w => {
                if (w.aliases && Array.isArray(w.aliases)) {
                    return w.aliases.some(alias => alias.id === wireRefId);
                }
                return false;
            });
            
            // Check if this is a communication wire
            const usageGroups = getNestedValue(wireDef, ['usageGroups'], []);
            const isComm = Array.isArray(usageGroups) && 
                (usageGroups.includes('COMMUNICATION') || 
                usageGroups.includes('COMMUNICATION_BUNDLE'));
            
            if (isComm) {
                // Get midspan height
                let midspanHeight = null;
                
                // The path might be direct or have a .value property
                const directHeight = getNestedValue(wire, ['midspanHeight'], null);
                
                if (directHeight !== null && typeof directHeight === 'number') {
                    midspanHeight = directHeight;
                } else {
                    midspanHeight = getNestedValue(wire, ['midspanHeight', 'value'], null);
                }
                
                if (midspanHeight !== null && typeof midspanHeight === 'number') {
                    // Convert from meters to feet
                    const heightFeet = convertMetersToFeet(midspanHeight);
                    
                    if (heightFeet !== null && heightFeet < minCommHeight) {
                        minCommHeight = heightFeet;
                        commWireFound = true;
                    }
                }
            }
        }
        
        return commWireFound ? minCommHeight : null;
    } catch (error) {
        console.error('Error extracting lowest communication midspan height:', error);
        return null;
    }
}

/**
 * Gets height of the lowest CPS electrical wire in mid-span
 * 
 * @param {Array} spidaMeasuredDesignStructureWires - The wires array from measured design
 * @param {Array} clientDataWires - The wires array from clientData for lookups
 * @returns {number|null} - Height in feet or null if not found
 */
function getSpidaLowestCpsElectricalMidspanHeight(spidaMeasuredDesignStructureWires, clientDataWires) {
    try {
        if (!Array.isArray(spidaMeasuredDesignStructureWires) || 
            spidaMeasuredDesignStructureWires.length === 0) {
            return null;
        }
        
        let minElecHeight = Number.POSITIVE_INFINITY;
        let elecWireFound = false;
        
        // Examine each wire
        for (const wire of spidaMeasuredDesignStructureWires) {
            // Check owner to see if it's CPS
            const owner = getNestedValue(wire, ['owner', 'id'], '');
            if (!owner.toLowerCase().includes('cps')) continue;
            
            // Get wire reference to check against clientData
            const wireRefId = getNestedValue(wire, ['clientItem', 'id'], null);
            
            if (!wireRefId) continue;
            
            // Find wire definition in clientData
            const wireDef = clientDataWires.find(w => {
                if (w.aliases && Array.isArray(w.aliases)) {
                    return w.aliases.some(alias => alias.id === wireRefId);
                }
                return false;
            });
            
            // Check if this is an electrical wire
            const usageGroups = getNestedValue(wireDef, ['usageGroups'], []);
            const isElectrical = Array.isArray(usageGroups) && 
                (usageGroups.includes('PRIMARY') || 
                usageGroups.includes('SECONDARY') || 
                usageGroups.includes('NEUTRAL') ||
                usageGroups.includes('UTILITY_SERVICE'));
            
            if (isElectrical) {
                // Get midspan height
                let midspanHeight = null;
                
                // The path might be direct or have a .value property
                const directHeight = getNestedValue(wire, ['midspanHeight'], null);
                
                if (directHeight !== null && typeof directHeight === 'number') {
                    midspanHeight = directHeight;
                } else {
                    midspanHeight = getNestedValue(wire, ['midspanHeight', 'value'], null);
                }
                
                if (midspanHeight !== null && typeof midspanHeight === 'number') {
                    // Convert from meters to feet
                    const heightFeet = convertMetersToFeet(midspanHeight);
                    
                    if (heightFeet !== null && heightFeet < minElecHeight) {
                        minElecHeight = heightFeet;
                        elecWireFound = true;
                    }
                }
            }
        }
        
        return elecWireFound ? minElecHeight : null;
    } catch (error) {
        console.error('Error extracting lowest CPS electrical midspan height:', error);
        return null;
    }
}

/**
 * Gets attacher description from client data reference
 * 
 * @param {string} targetItemClientRef - The target item's clientItem.id
 * @param {Array} clientDataWiresOrEquip - The clientData array for wires or equipment
 * @returns {string} - Description of the attachment or "Unknown" if not found
 */
function getSpidaAttacherDescription(targetItemClientRef, clientDataWiresOrEquip) {
    try {
        if (!targetItemClientRef || !Array.isArray(clientDataWiresOrEquip)) {
            return 'Unknown';
        }
        
        // Find the item definition in clientData
        const itemDef = clientDataWiresOrEquip.find(item => {
            if (item.aliases && Array.isArray(item.aliases)) {
                return item.aliases.some(alias => alias.id === targetItemClientRef);
            }
            return false;
        });
        
        if (!itemDef) return 'Unknown';
        
        // For wires, use description or size
        if (itemDef.description) {
            return itemDef.description;
        } else if (itemDef.size) {
            return itemDef.size;
        } else if (itemDef.type && itemDef.type.name) {
            return itemDef.type.name;
        }
        
        return 'Unknown';
    } catch (error) {
        console.error('Error extracting attacher description:', error);
        return 'Unknown';
    }
}

/**
 * Gets existing attachment height at the pole
 * 
 * @param {Object} targetItemMeasuredDesignStructure - The wire/equipment object from measured design
 * @returns {number|null} - Height in feet or null if not found
 */
function getSpidaExistingAttachmentHeight(targetItemMeasuredDesignStructure) {
    try {
        // Get attachment height
        let attachmentHeight = null;
        
        // The path might be direct or have a .value property
        const directHeight = getNestedValue(targetItemMeasuredDesignStructure, ['attachmentHeight'], null);
        
        if (directHeight !== null && typeof directHeight === 'number') {
            attachmentHeight = directHeight;
        } else {
            attachmentHeight = getNestedValue(
                targetItemMeasuredDesignStructure, 
                ['attachmentHeight', 'value'], 
                null
            );
        }
        
        if (attachmentHeight !== null && typeof attachmentHeight === 'number') {
            // Convert from meters to feet
            return convertMetersToFeet(attachmentHeight);
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting existing attachment height:', error);
        return null;
    }
}

/**
 * Gets proposed attachment height at the pole
 * 
 * @param {Object} targetItemRecommendedDesignStructure - The wire/equipment object from recommended design
 * @returns {number|null} - Height in feet or null if not found
 */
function getSpidaProposedAttachmentHeight(targetItemRecommendedDesignStructure) {
    try {
        // Get attachment height
        let attachmentHeight = null;
        
        // The path might be direct or have a .value property
        const directHeight = getNestedValue(targetItemRecommendedDesignStructure, ['attachmentHeight'], null);
        
        if (directHeight !== null && typeof directHeight === 'number') {
            attachmentHeight = directHeight;
        } else {
            attachmentHeight = getNestedValue(
                targetItemRecommendedDesignStructure, 
                ['attachmentHeight', 'value'], 
                null
            );
        }
        
        if (attachmentHeight !== null && typeof attachmentHeight === 'number') {
            // Convert from meters to feet
            return convertMetersToFeet(attachmentHeight);
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting proposed attachment height:', error);
        return null;
    }
}

/**
 * Gets existing midspan height for a specific attacher
 * 
 * @param {Object} targetWireMeasuredDesignStructure - The wire object from measured design
 * @returns {number|null} - Height in feet or null if not found
 */
function getSpidaAttacherExistingMidspan(targetWireMeasuredDesignStructure) {
    try {
        // Get midspan height
        let midspanHeight = null;
        
        // The path might be direct or have a .value property
        const directHeight = getNestedValue(targetWireMeasuredDesignStructure, ['midspanHeight'], null);
        
        if (directHeight !== null && typeof directHeight === 'number') {
            midspanHeight = directHeight;
        } else {
            midspanHeight = getNestedValue(
                targetWireMeasuredDesignStructure, 
                ['midspanHeight', 'value'], 
                null
            );
        }
        
        if (midspanHeight !== null && typeof midspanHeight === 'number') {
            // Convert from meters to feet
            return convertMetersToFeet(midspanHeight);
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting attacher existing midspan height:', error);
        return null;
    }
}

/**
 * Gets proposed midspan height for a specific attacher
 * 
 * @param {Object} targetWireRecommendedDesignStructure - The wire object from recommended design
 * @returns {number|null} - Height in feet or null if not found
 */
function getSpidaAttacherProposedMidspan(targetWireRecommendedDesignStructure) {
    try {
        // Get midspan height
        let midspanHeight = null;
        
        // The path might be direct or have a .value property
        const directHeight = getNestedValue(targetWireRecommendedDesignStructure, ['midspanHeight'], null);
        
        if (directHeight !== null && typeof directHeight === 'number') {
            midspanHeight = directHeight;
        } else {
            midspanHeight = getNestedValue(
                targetWireRecommendedDesignStructure, 
                ['midspanHeight', 'value'], 
                null
            );
        }
        
        if (midspanHeight !== null && typeof midspanHeight === 'number') {
            // Convert from meters to feet
            return convertMetersToFeet(midspanHeight);
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting attacher proposed midspan height:', error);
        return null;
    }
}

/**
 * Determines the attachment action (Install/Relocate/Existing) for Charter/Spectrum
 * 
 * @param {Object} spidaPoleMeasuredDesign - The measured design object
 * @param {Object} spidaPoleRecommendedDesign - The recommended design object
 * @param {Array} clientDataItemsCharterSpectrum - Array of client data items owned by Charter/Spectrum
 * @returns {string} - "I" for Install, "R" for Relocate, "E" for Existing
 */
function getSpidaAttachmentActionDetails(spidaPoleMeasuredDesign, spidaPoleRecommendedDesign, clientDataItemsCharterSpectrum) {
    try {
        if (!spidaPoleMeasuredDesign || !spidaPoleRecommendedDesign) {
            return 'Unknown';
        }
        
        // Get measured and recommended wires and equipment
        const measuredWires = getNestedValue(spidaPoleMeasuredDesign, ['structure', 'wires'], []);
        const recommendedWires = getNestedValue(spidaPoleRecommendedDesign, ['structure', 'wires'], []);
        
        const measuredEquip = getNestedValue(spidaPoleMeasuredDesign, ['structure', 'equipments'], []);
        const recommendedEquip = getNestedValue(spidaPoleRecommendedDesign, ['structure', 'equipments'], []);
        
        // Find Charter/Spectrum items
        const charterMeasuredWires = measuredWires.filter(wire => {
            const owner = getNestedValue(wire, ['owner', 'id'], '');
            return isCharterSpectrum(owner);
        });
        
        const charterRecommendedWires = recommendedWires.filter(wire => {
            const owner = getNestedValue(wire, ['owner', 'id'], '');
            return isCharterSpectrum(owner);
        });
        
        const charterMeasuredEquip = measuredEquip.filter(equip => {
            const owner = getNestedValue(equip, ['owner', 'id'], '');
            return isCharterSpectrum(owner);
        });
        
        const charterRecommendedEquip = recommendedEquip.filter(equip => {
            const owner = getNestedValue(equip, ['owner', 'id'], '');
            return isCharterSpectrum(owner);
        });
        
        // Case 1: Install - Items in recommended but not in measured
        if ((charterRecommendedWires.length > 0 && charterMeasuredWires.length === 0) ||
            (charterRecommendedEquip.length > 0 && charterMeasuredEquip.length === 0)) {
            return 'I';
        }
        
        // Case 2: Check for relocate - Same items but different heights
        if (charterMeasuredWires.length > 0 && charterRecommendedWires.length > 0) {
            // Compare heights for wire attachments
            for (const measuredWire of charterMeasuredWires) {
                const measuredWireId = getNestedValue(measuredWire, ['id'], null);
                
                // Find matching wire in recommended
                const matchingRecommendedWire = charterRecommendedWires.find(wire => 
                    getNestedValue(wire, ['id'], '') === measuredWireId
                );
                
                if (matchingRecommendedWire) {
                    // Get heights
                    const measuredHeight = getSpidaExistingAttachmentHeight(measuredWire);
                    const recommendedHeight = getSpidaProposedAttachmentHeight(matchingRecommendedWire);
                    
                    // If heights differ (by more than a small tolerance), it's a relocate
                    if (measuredHeight !== null && recommendedHeight !== null) {
                        const tolerance = 0.1; // feet
                        if (Math.abs(measuredHeight - recommendedHeight) > tolerance) {
                            return 'R';
                        }
                    }
                }
            }
        }
        
        // Similar check for equipment
        if (charterMeasuredEquip.length > 0 && charterRecommendedEquip.length > 0) {
            for (const measuredEquip of charterMeasuredEquip) {
                const measuredEquipId = getNestedValue(measuredEquip, ['id'], null);
                
                // Find matching equipment in recommended
                const matchingRecommendedEquip = charterRecommendedEquip.find(equip => 
                    getNestedValue(equip, ['id'], '') === measuredEquipId
                );
                
                if (matchingRecommendedEquip) {
                    // Get heights
                    const measuredHeight = getSpidaExistingAttachmentHeight(measuredEquip);
                    const recommendedHeight = getSpidaProposedAttachmentHeight(matchingRecommendedEquip);
                    
                    // If heights differ, it's a relocate
                    if (measuredHeight !== null && recommendedHeight !== null) {
                        const tolerance = 0.1; // feet
                        if (Math.abs(measuredHeight - recommendedHeight) > tolerance) {
                            return 'R';
                        }
                    }
                }
            }
        }
        
        // Case 3: Default to Existing if Charter/Spectrum attachments exist
        if (charterMeasuredWires.length > 0 || charterMeasuredEquip.length > 0) {
            return 'E';
        }
        
        // Case 4: No Charter/Spectrum attachments found
        return 'N/A';
    } catch (error) {
        console.error('Error determining attachment action:', error);
        return 'Unknown';
    }
}

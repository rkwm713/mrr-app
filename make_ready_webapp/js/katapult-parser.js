/**
 * Katapult specific parsing functions
 * 
 * This file contains functions for extracting data from Katapult JSON structure
 * according to the mapping requirements.
 */

/**
 * Gets the owner of a pole from Katapult data
 * 
 * @param {Object} katapultNodeData - The node data object from Katapult
 * @returns {string} - The pole owner or "Unknown" if not found
 */
function getKatapultPoleOwner(katapultNodeData) {
    try {
        // Check various possible attribute paths
        const poleOwner = 
            getNestedValue(katapultNodeData, ['attributes', 'pole_owner', 'multi_added']) ||
            getNestedValue(katapultNodeData, ['attributes', 'pole_owner_name', 'one']) ||
            getNestedValue(katapultNodeData, ['attributes', 'pole_owner', '-Imported', 'one']) ||
            getNestedValue(katapultNodeData, ['attributes', 'pole_owner', 'assessment']);
        
        return poleOwner || 'Unknown';
    } catch (error) {
        console.error('Error extracting Katapult pole owner:', error);
        return 'Unknown';
    }
}

/**
 * Gets the pole number from Katapult data, using various possible sources
 * 
 * @param {Object} katapultNodeData - The node data object from Katapult
 * @returns {string} - The pole number or "Unknown" if not found
 */
function getKatapultPoleNumber(katapultNodeData) {
    try {
        // Check in priority order as defined in mapping document
        const poleNumber = 
            getNestedValue(katapultNodeData, ['attributes', 'PoleNumber', '-Imported']) ||
            getNestedValue(katapultNodeData, ['attributes', 'electric_pole_tag', 'assessment']) ||
            getNestedValue(katapultNodeData, ['attributes', 'DLOC_number', '-Imported']);
            
        return poleNumber || 'Unknown';
    } catch (error) {
        console.error('Error extracting Katapult pole number:', error);
        return 'Unknown';
    }
}

/**
 * Creates a formatted string describing pole structure from Katapult data
 * 
 * @param {Object} katapultNodeData - The node data object from Katapult
 * @returns {string} - Formatted string like "Southern Pine 3" or partial if missing data
 */
function getKatapultPoleStructureString(katapultNodeData) {
    try {
        // Extract species and class from attributes
        let species = 
            getNestedValue(katapultNodeData, ['attributes', 'pole_species', 'assessment']) ||
            getNestedValue(katapultNodeData, ['attributes', 'pole_species', '-Imported']) ||
            getNestedValue(katapultNodeData, ['attributes', 'pole_species', 'one']);
            
        let poleClass = 
            getNestedValue(katapultNodeData, ['attributes', 'pole_class', 'assessment']) ||
            getNestedValue(katapultNodeData, ['attributes', 'pole_class', '-Imported']) ||
            getNestedValue(katapultNodeData, ['attributes', 'pole_class', 'one']);
        
        // Format the result
        if (species && poleClass) {
            return `${species} ${poleClass}`;
        } else if (species) {
            return species;
        } else if (poleClass) {
            return `Class ${poleClass}`;
        } else {
            return 'Unknown';
        }
    } catch (error) {
        console.error('Error formatting Katapult pole structure:', error);
        return 'Unknown';
    }
}

/**
 * Determines if Katapult data indicates a proposed riser
 * 
 * @param {Object} katapultNodeData - The node data object from Katapult
 * @param {Object} katapultTraceData - The trace data object from Katapult
 * @returns {boolean} - True if a riser is proposed
 */
function getKatapultProposedRiser(katapultNodeData, katapultTraceData) {
    try {
        // Check attributes for riser indicator
        const riserAttribute = getNestedValue(katapultNodeData, ['attributes', 'riser', 'button_added']);
        if (riserAttribute === true || riserAttribute === 'YES' || riserAttribute === 'yes') {
            return true;
        }
        
        // Check for proposed riser in trace data
        const nodeId = getNestedValue(katapultNodeData, ['id']);
        if (!nodeId || !katapultTraceData) return false;
        
        // Iterate through traces to find proposed equipment of type "riser"
        for (const traceId in katapultTraceData) {
            const trace = katapultTraceData[traceId];
            
            // Check if trace is associated with this node, is proposed, and is a riser
            if (trace.proposed === true && 
                trace._trace_type === 'equipment' &&
                (trace.label?.toLowerCase().includes('riser') || 
                 trace.cable_type?.toLowerCase().includes('riser'))) {
                
                // Would need to check if this trace is connected to our node
                // This would require traversing the connections array, but for now we'll assume it is
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error checking for Katapult proposed riser:', error);
        return false;
    }
}

/**
 * Determines if Katapult data indicates a proposed guy
 * 
 * @param {Object} katapultNodeData - The node data object from Katapult
 * @param {Object} katapultTraceData - The trace data object from Katapult
 * @param {Object} katapultConnectionData - The connection data object from Katapult
 * @returns {boolean} - True if a guy is proposed
 */
function getKatapultProposedGuy(katapultNodeData, katapultTraceData, katapultConnectionData) {
    try {
        const nodeId = getNestedValue(katapultNodeData, ['id']);
        if (!nodeId || !katapultTraceData) return false;
        
        // Check for proposed guy in trace data
        for (const traceId in katapultTraceData) {
            const trace = katapultTraceData[traceId];
            
            // Check if trace is proposed and is a guy or anchor
            if (trace.proposed === true && 
                (trace._trace_type === 'down_guy' || trace._trace_type === 'anchor')) {
                
                // Would need to check if this trace is connected to our node
                return true;
            }
        }
        
        // Check connections for down_guy or anchor
        if (katapultConnectionData) {
            for (const connId in katapultConnectionData) {
                const connection = katapultConnectionData[connId];
                
                // Check if connection involves this node and is a guy or anchor
                if ((connection.node_id_1 === nodeId || connection.node_id_2 === nodeId) &&
                    (connection.button === 'down_guy' || connection.button === 'anchor')) {
                    
                    // Check if it's proposed (this might require additional logic depending on Katapult structure)
                    // For now, we'll assume any guy/anchor connection is proposed if it exists
                    return true;
                }
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error checking for Katapult proposed guy:', error);
        return false;
    }
}

/**
 * Gets the PLA (Percent Loading Analysis) value from Katapult data
 * 
 * @param {Object} katapultNodeData - The node data object from Katapult
 * @returns {number|null} - PLA value as a percentage or null if not found
 */
function getKatapultPla(katapultNodeData) {
    try {
        // Check various possible attribute paths for PLA value
        const plaValue = 
            getNestedValue(katapultNodeData, ['attributes', 'final_passing_capacity_%', 'auto_calced']) ||
            getNestedValue(katapultNodeData, ['attributes', 'proposed_pla_%', 'auto_calced']) ||
            getNestedValue(katapultNodeData, ['attributes', 'pole_loading_%', 'assessment']);
        
        if (plaValue !== null && plaValue !== undefined) {
            // Convert to number if it's a string
            if (typeof plaValue === 'string') {
                // Remove % sign if present
                const cleanValue = plaValue.replace('%', '');
                return parseFloat(cleanValue);
            }
            return plaValue;
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting Katapult PLA:', error);
        return null;
    }
}

/**
 * Gets height of the lowest communication wire in mid-span from Katapult data
 * 
 * @param {Object} katapultNodeData - The node data object from Katapult
 * @param {Object} katapultTraceData - The trace data object from Katapult
 * @param {Object} katapultPhotoData - The photo data object from Katapult
 * @returns {number|null} - Height in feet or null if not found
 */
function getKatapultLowestCommMidspanHeight(katapultNodeData, katapultTraceData, katapultPhotoData) {
    try {
        if (!katapultNodeData || !katapultNodeData.photos) return null;
        
        let minCommHeight = Number.POSITIVE_INFINITY;
        let commHeightFound = false;
        
        // Iterate through photos to find midspan measurements
        for (const photoUuid in katapultNodeData.photos) {
            const photoData = katapultPhotoData[photoUuid];
            
            // Check if photofirst_data exists and has midspanHeight
            const midspanData = getNestedValue(photoData, ['photofirst_data', 'midspanHeight'], {});
            
            // Iterate through midspan measurements
            for (const measurementId in midspanData) {
                // Get the height and check if it's for communication
                const measurement = midspanData[measurementId];
                const wireId = getNestedValue(measurement, ['_routine_instance_id']);
                
                // If we can't identify which wire this belongs to, skip it
                if (!wireId) continue;
                
                // Try to find the corresponding wire in photofirst_data
                const wireData = getNestedValue(photoData, ['photofirst_data', 'wire', wireId]);
                if (!wireData) continue;
                
                // Get the trace this wire belongs to
                const traceId = getNestedValue(wireData, ['_trace']);
                if (!traceId) continue;
                
                // Check if this trace is a communication wire
                const trace = getNestedValue(katapultTraceData, [traceId]);
                if (!trace) continue;
                
                const isCommunication = 
                    trace.cable_type?.toLowerCase().includes('com') ||
                    trace.cable_type?.toLowerCase().includes('fiber') ||
                    trace.cable_type?.toLowerCase().includes('coax') ||
                    trace.cable_type?.toLowerCase().includes('telco') ||
                    trace.company?.toLowerCase().includes('charter') ||
                    trace.company?.toLowerCase().includes('spectrum') ||
                    trace.company?.toLowerCase().includes('at&t');
                
                if (isCommunication) {
                    // Get height from the measurement
                    // Height might be stored in different formats depending on Katapult implementation
                    let heightValue = getNestedValue(wireData, ['_measured_height']);
                    
                    if (heightValue) {
                        // Convert to number if it's a string with feet/inches format
                        if (typeof heightValue === 'string') {
                            // Parse feet and inches format like "25' 6""
                            const feetInchesMatch = heightValue.match(/(\d+)'?\s*(\d+)?"\s*/);
                            if (feetInchesMatch) {
                                const feet = parseInt(feetInchesMatch[1], 10) || 0;
                                const inches = parseInt(feetInchesMatch[2], 10) || 0;
                                heightValue = feet + (inches / 12);
                            } else {
                                // Just try to parse it as a number
                                heightValue = parseFloat(heightValue);
                            }
                        }
                        
                        if (!isNaN(heightValue) && heightValue < minCommHeight) {
                            minCommHeight = heightValue;
                            commHeightFound = true;
                        }
                    }
                }
            }
        }
        
        return commHeightFound ? minCommHeight : null;
    } catch (error) {
        console.error('Error extracting Katapult lowest communication midspan height:', error);
        return null;
    }
}

/**
 * Gets height of the lowest CPS electrical wire in mid-span from Katapult data
 * 
 * @param {Object} katapultNodeData - The node data object from Katapult
 * @param {Object} katapultTraceData - The trace data object from Katapult
 * @param {Object} katapultPhotoData - The photo data object from Katapult
 * @returns {number|null} - Height in feet or null if not found
 */
function getKatapultLowestCpsElectricalMidspanHeight(katapultNodeData, katapultTraceData, katapultPhotoData) {
    try {
        if (!katapultNodeData || !katapultNodeData.photos) return null;
        
        let minElecHeight = Number.POSITIVE_INFINITY;
        let elecHeightFound = false;
        
        // Iterate through photos to find midspan measurements
        for (const photoUuid in katapultNodeData.photos) {
            const photoData = katapultPhotoData[photoUuid];
            
            // Check if photofirst_data exists and has midspanHeight
            const midspanData = getNestedValue(photoData, ['photofirst_data', 'midspanHeight'], {});
            
            // Iterate through midspan measurements
            for (const measurementId in midspanData) {
                // Get the height and check if it's for electrical
                const measurement = midspanData[measurementId];
                const wireId = getNestedValue(measurement, ['_routine_instance_id']);
                
                // If we can't identify which wire this belongs to, skip it
                if (!wireId) continue;
                
                // Try to find the corresponding wire in photofirst_data
                const wireData = getNestedValue(photoData, ['photofirst_data', 'wire', wireId]);
                if (!wireData) continue;
                
                // Get the trace this wire belongs to
                const traceId = getNestedValue(wireData, ['_trace']);
                if (!traceId) continue;
                
                // Check if this trace is a CPS electrical wire
                const trace = getNestedValue(katapultTraceData, [traceId]);
                if (!trace) continue;
                
                const isCpsElectrical = 
                    trace.company?.toLowerCase().includes('cps') &&
                    (trace.cable_type?.toLowerCase().includes('primary') ||
                    trace.cable_type?.toLowerCase().includes('secondary') ||
                    trace.cable_type?.toLowerCase().includes('neutral') ||
                    trace.cable_type?.toLowerCase().includes('service'));
                
                if (isCpsElectrical) {
                    // Get height from the measurement
                    let heightValue = getNestedValue(wireData, ['_measured_height']);
                    
                    if (heightValue) {
                        // Convert to number if it's a string with feet/inches format
                        if (typeof heightValue === 'string') {
                            // Parse feet and inches format like "25' 6""
                            const feetInchesMatch = heightValue.match(/(\d+)'?\s*(\d+)?"\s*/);
                            if (feetInchesMatch) {
                                const feet = parseInt(feetInchesMatch[1], 10) || 0;
                                const inches = parseInt(feetInchesMatch[2], 10) || 0;
                                heightValue = feet + (inches / 12);
                            } else {
                                // Just try to parse it as a number
                                heightValue = parseFloat(heightValue);
                            }
                        }
                        
                        if (!isNaN(heightValue) && heightValue < minElecHeight) {
                            minElecHeight = heightValue;
                            elecHeightFound = true;
                        }
                    }
                }
            }
        }
        
        return elecHeightFound ? minElecHeight : null;
    } catch (error) {
        console.error('Error extracting Katapult lowest CPS electrical midspan height:', error);
        return null;
    }
}

/**
 * Gets attacher description from Katapult data
 * 
 * @param {Object} targetTraceDataEntry - The trace data object for the target attachment
 * @returns {string} - Description of the attachment or "Unknown" if not found
 */
function getKatapultAttacherDescription(targetTraceDataEntry) {
    try {
        if (!targetTraceDataEntry) return 'Unknown';
        
        // Use label or cable_type as description
        const label = getNestedValue(targetTraceDataEntry, ['label']);
        const cableType = getNestedValue(targetTraceDataEntry, ['cable_type']);
        
        if (label) return label;
        if (cableType) return cableType;
        
        return 'Unknown';
    } catch (error) {
        console.error('Error extracting Katapult attacher description:', error);
        return 'Unknown';
    }
}

/**
 * Gets existing attachment height at the pole from Katapult data
 * 
 * @param {Object} targetTracePhotofirstData - The photofirst_data for the target attachment
 * @returns {number|null} - Height in feet or null if not found
 */
function getKatapultExistingAttachmentHeight(targetTracePhotofirstData) {
    try {
        if (!targetTracePhotofirstData) return null;
        
        // Get measured height
        let heightValue = getNestedValue(targetTracePhotofirstData, ['_measured_height']);
        
        if (heightValue) {
            // Convert to number if it's a string with feet/inches format
            if (typeof heightValue === 'string') {
                // Parse feet and inches format like "25' 6""
                const feetInchesMatch = heightValue.match(/(\d+)'?\s*(\d+)?"\s*/);
                if (feetInchesMatch) {
                    const feet = parseInt(feetInchesMatch[1], 10) || 0;
                    const inches = parseInt(feetInchesMatch[2], 10) || 0;
                    return feet + (inches / 12);
                } else {
                    // Just try to parse it as a number
                    return parseFloat(heightValue);
                }
            }
            
            return heightValue;
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting Katapult existing attachment height:', error);
        return null;
    }
}

/**
 * Gets proposed attachment height at the pole from Katapult data
 * 
 * @param {Object} targetTracePhotofirstData - The photofirst_data for the target attachment
 * @param {number} existingHeightFromL - The existing height (from column L) to use as a base
 * @returns {number|null} - Height in feet or null if not found
 */
function getKatapultProposedAttachmentHeight(targetTracePhotofirstData, existingHeightFromL) {
    try {
        if (!targetTracePhotofirstData) return null;
        
        // Check for mr_move value
        let mrMove = getNestedValue(targetTracePhotofirstData, ['mr_move']);
        
        if (mrMove !== null && mrMove !== undefined && existingHeightFromL !== null) {
            // Convert mr_move to a number if it's a string
            if (typeof mrMove === 'string') {
                mrMove = parseFloat(mrMove);
            }
            
            if (!isNaN(mrMove)) {
                // mr_move is typically in inches, so convert to feet
                const mrMoveInFeet = mrMove / 12;
                
                // Add to existing height to get proposed height
                return existingHeightFromL + mrMoveInFeet;
            }
        }
        
        // If no mr_move or we couldn't calculate, check for direct proposed height
        let proposedHeight = getNestedValue(targetTracePhotofirstData, ['_proposed_height']);
        
        if (proposedHeight) {
            // Convert string format if needed
            if (typeof proposedHeight === 'string') {
                // Parse feet and inches format
                const feetInchesMatch = proposedHeight.match(/(\d+)'?\s*(\d+)?"\s*/);
                if (feetInchesMatch) {
                    const feet = parseInt(feetInchesMatch[1], 10) || 0;
                    const inches = parseInt(feetInchesMatch[2], 10) || 0;
                    return feet + (inches / 12);
                } else {
                    // Just try to parse it as a number
                    return parseFloat(proposedHeight);
                }
            }
            
            return proposedHeight;
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting Katapult proposed attachment height:', error);
        return null;
    }
}

/**
 * Gets existing midspan height for a specific attacher from Katapult data
 * 
 * @param {Object} targetTraceNodeData - The node data for the trace
 * @param {Object} katapultPhotoData - The photo data object from Katapult
 * @returns {number|null} - Height in feet or null if not found
 */
function getKatapultAttacherExistingMidspan(targetTraceNodeData, katapultPhotoData) {
    try {
        // This is a complex function as we need to find the midspan measurement
        // associated with a specific trace
        
        // For now, we'll implement a simplified version just to get the project structure in place
        // A more complete implementation would need to:
        // 1. Identify the trace in question
        // 2. Find the midspan measurement associated with that trace
        // 3. Extract and convert the height value
        
        // Since midspan height in Katapult is complex and the exact data paths would
        // depend on the specific implementation, we'll return null for now
        return null;
    } catch (error) {
        console.error('Error extracting Katapult attacher existing midspan height:', error);
        return null;
    }
}

/**
 * Determines the attachment action (Install/Relocate/Existing) for Charter/Spectrum from Katapult data
 * 
 * @param {Object} katapultNodeData - The node data object from Katapult
 * @param {string} charterCompanyName - The name to use for Charter/Spectrum
 * @returns {string} - "I" for Install, "R" for Relocate, "E" for Existing
 */
function getKatapultAttachmentActionDetails(katapultNodeData, charterCompanyName) {
    try {
        if (!katapultNodeData || !katapultNodeData.photos) {
            return 'Unknown';
        }
        
        // Check if node has photos with photofirst_data
        for (const photoUuid in katapultNodeData.photos) {
            // We need the actual photo data to look at photofirst_data
            // For this structure, we'd need to access through katapult.photos[photoUuid]
            // Since we just want to establish the function signature, we'll return Unknown for now
        }
        
        // We'd also need to check trace_data to see if there's a proposed trace for Charter/Spectrum
        
        // For the completed implementation, we would:
        // 1. Check for proposed traces belonging to Charter/Spectrum
        // 2. Check for existing traces with mr_move values (for relocation)
        // 3. Check for existing traces with no changes (for existing)
        
        return 'Unknown';
    } catch (error) {
        console.error('Error determining Katapult attachment action:', error);
        return 'Unknown';
    }
}

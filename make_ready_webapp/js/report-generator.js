/**
 * Report generation logic for correlating poles and creating Excel report data
 */

// Define Excel column structure
const EXCEL_COLUMNS = [
    { id: 'operationNumber', label: 'Operation Number', width: 15 },
    { id: 'attachmentAction', label: 'Attachment Action (I/R/E)', width: 20 },
    { id: 'poleOwner', label: 'Pole Owner', width: 15 },
    { id: 'poleNumber', label: 'Pole #', width: 15 },
    { id: 'poleStructure', label: 'Pole Structure (Species & Class)', width: 25 },
    { id: 'proposedFeatures', label: 'Proposed Riser/Guy/PLA', width: 25 },
    { id: 'constructionGrade', label: 'Construction Grade of Analysis', width: 25 },
    { id: 'lowestComHeight', label: 'Height Lowest Com (Existing Mid-Span)', width: 25 },
    { id: 'lowestCpsElectricalHeight', label: 'Height Lowest CPS Electrical (Existing Mid-Span)', width: 30 },
    { id: 'midSpanFromToPole', label: 'Mid-Span From Pole / To Pole', width: 25 },
    { id: 'attacherDescription', label: 'Attacher Description', width: 20 },
    { id: 'existingAttachmentHeight', label: 'Existing Attachment Height (at pole)', width: 30 },
    { id: 'proposedAttachmentHeight', label: 'Proposed Attachment Height (at pole)', width: 30 },
    { id: 'existingMidSpan', label: 'Existing Mid-Span (for specific attacher)', width: 35 },
    { id: 'proposedMidSpan', label: 'Proposed Mid-Span (for specific attacher)', width: 35 }
];

// Global variable to store generated report data
let generatedReportData = [];

/**
 * Correlates poles between SPIDAcalc and Katapult data
 * 
 * @param {Object} spidaData - The SPIDAcalc JSON data
 * @param {Object} katapultData - The Katapult JSON data
 * @returns {Object} - Object containing correlatedPoles array and unmatchedSpidaPoles array
 */
function correlatePoles(spidaData, katapultData) {
    try {
        // Initialize result objects
        const correlatedPoles = [];
        const unmatchedSpidaPoles = [];
        
        // Get locations from SPIDAcalc data
        const spidaLocations = [];
        if (spidaData.leads && Array.isArray(spidaData.leads)) {
            spidaData.leads.forEach(lead => {
                if (lead.locations && Array.isArray(lead.locations)) {
                    spidaLocations.push(...lead.locations);
                }
            });
        }
        
        // Create a map of Katapult nodes by pole number for quick lookup
        const katapultNodesByPoleNumber = {};
        
        // Iterate through Katapult nodes
        if (katapultData.nodes) {
            for (const nodeId in katapultData.nodes) {
                const node = katapultData.nodes[nodeId];
                
                // Get pole number from Katapult data (using the function from katapult-parser.js)
                const katapultPoleNumber = getKatapultPoleNumber(node);
                
                // Only include if we found a pole number
                if (katapultPoleNumber && katapultPoleNumber !== 'Unknown') {
                    katapultNodesByPoleNumber[katapultPoleNumber] = {
                        nodeId: nodeId,
                        nodeData: node
                    };
                }
            }
        }
        
        // Now correlate SPIDAcalc locations with Katapult nodes
        spidaLocations.forEach(location => {
            // Get pole number from SPIDAcalc data (using the function from spida-parser.js)
            const spidaPoleNumber = getSpidaPoleNumber(location);
            
            // Try to find a match in Katapult data
            if (spidaPoleNumber && spidaPoleNumber !== 'Unknown' && 
                katapultNodesByPoleNumber[spidaPoleNumber]) {
                
                // We found a match!
                correlatedPoles.push({
                    spidaLocation: location,
                    katapultNodeId: katapultNodesByPoleNumber[spidaPoleNumber].nodeId,
                    katapultNodeData: katapultNodesByPoleNumber[spidaPoleNumber].nodeData,
                    poleNumber: spidaPoleNumber
                });
            } else {
                // No match found - add to unmatched list
                unmatchedSpidaPoles.push({
                    spidaLocation: location,
                    poleNumber: spidaPoleNumber
                });
            }
        });
        
        return {
            correlatedPoles: correlatedPoles,
            unmatchedSpidaPoles: unmatchedSpidaPoles
        };
    } catch (error) {
        console.error('Error correlating poles:', error);
        throw new Error('Failed to correlate poles between SPIDAcalc and Katapult data');
    }
}

/**
 * Generates report data for each correlated pole
 * 
 * @param {Object} spidaData - The SPIDAcalc JSON data
 * @param {Object} katapultData - The Katapult JSON data
 * @param {Array} correlatedPoles - Array of correlated pole objects
 * @param {Array} unmatchedSpidaPoles - Array of unmatched SPIDA pole objects
 * @returns {Array} - Array of report row objects
 */
function generateReport(spidaData, katapultData, correlatedPoles, unmatchedSpidaPoles) {
    try {
        const reportRows = [];
        
        // Process each correlated pole
        correlatedPoles.forEach((correlatedPole, index) => {
            // Get locations with "Measured" and "Recommended" designs
            const spidaLocation = correlatedPole.spidaLocation;
            const katapultNode = correlatedPole.katapultNodeData;
            
            // Find measured and recommended designs
            const measuredDesign = spidaLocation.designs?.find(design => design.layerType === 'Measured');
            const recommendedDesign = spidaLocation.designs?.find(design => design.layerType === 'Recommended');
            
            // Create the row data object
            const rowData = {};
            
            // Column A: Operation Number (manually generated or from external system)
            rowData.operationNumber = (index + 1).toString();
            
            // Column B: Attachment Action (I/R/E)
            rowData.attachmentAction = determineAttachmentAction(
                measuredDesign, 
                recommendedDesign, 
                katapultNode, 
                katapultData.traces?.trace_data,
                'Charter/Spectrum' // Target company name
            );
            
            // Column C: Pole Owner
            // Prefer SPIDAcalc data for pole owner
            if (measuredDesign?.structure?.pole) {
                rowData.poleOwner = getSpidaPoleOwner(measuredDesign.structure.pole);
            } else {
                rowData.poleOwner = getKatapultPoleOwner(katapultNode);
            }
            
            // Column D: Pole Number
            rowData.poleNumber = correlatedPole.poleNumber;
            
            // Column E: Pole Structure (Species & Class)
            rowData.poleStructure = determinePoleStructure(
                measuredDesign,
                spidaData.clientData?.poles,
                katapultNode
            );
            
            // Column F: Proposed Riser/Guy/PLA
            rowData.proposedFeatures = determineProposedFeatures(
                recommendedDesign,
                spidaData.clientData?.equipments,
                katapultNode,
                katapultData.traces?.trace_data,
                katapultData.connections
            );
            
            // Column G: Construction Grade of Analysis
            if (recommendedDesign?.analysis) {
                rowData.constructionGrade = getSpidaConstructionGrade(recommendedDesign.analysis);
            } else {
                rowData.constructionGrade = 'N/A';
            }
            
            // Column H: Height Lowest Com (Existing Mid-Span)
            rowData.lowestComHeight = determineLowestComHeight(
                measuredDesign,
                spidaData.clientData?.wires,
                katapultNode,
                katapultData.traces?.trace_data,
                katapultData.photos
            );
            
            // Column I: Height Lowest CPS Electrical (Existing Mid-Span)
            rowData.lowestCpsElectricalHeight = determineLowestCpsElectricalHeight(
                measuredDesign,
                spidaData.clientData?.wires,
                katapultNode,
                katapultData.traces?.trace_data,
                katapultData.photos
            );
            
            // Column J: Mid-Span From Pole / To Pole
            rowData.midSpanFromToPole = `${correlatedPole.poleNumber} / --`;
            
            // Columns K-O: These depend on the target attachment
            // We'd need to identify the Charter/Spectrum attachment first
            const targetAttachmentInfo = findTargetAttachment(
                measuredDesign,
                recommendedDesign,
                katapultNode,
                katapultData.traces?.trace_data,
                katapultData.photos,
                'Charter/Spectrum'
            );
            
            if (targetAttachmentInfo) {
                // Column K: Attacher Description
                rowData.attacherDescription = targetAttachmentInfo.description || 'N/A';
                
                // Column L: Existing Attachment Height (at pole)
                rowData.existingAttachmentHeight = targetAttachmentInfo.existingHeight !== null ? 
                    formatHeight(targetAttachmentInfo.existingHeight) : 'N/A';
                
                // Column M: Proposed Attachment Height (at pole)
                rowData.proposedAttachmentHeight = targetAttachmentInfo.proposedHeight !== null ? 
                    formatHeight(targetAttachmentInfo.proposedHeight) : 'N/A';
                
                // Column N: Existing Mid-Span (for specific attacher)
                rowData.existingMidSpan = targetAttachmentInfo.existingMidspan !== null ?
                    formatHeight(targetAttachmentInfo.existingMidspan) : 'N/A';
                
                // Column O: Proposed Mid-Span (for specific attacher)
                rowData.proposedMidSpan = targetAttachmentInfo.proposedMidspan !== null ?
                    formatHeight(targetAttachmentInfo.proposedMidspan) : 'N/A';
            } else {
                // No target attachment found
                rowData.attacherDescription = 'N/A';
                rowData.existingAttachmentHeight = 'N/A';
                rowData.proposedAttachmentHeight = 'N/A';
                rowData.existingMidSpan = 'N/A';
                rowData.proposedMidSpan = 'N/A';
            }
            
            reportRows.push(rowData);
        });
        
        // Process unmatched SPIDAcalc poles if needed
        unmatchedSpidaPoles.forEach((unmatchedPole, index) => {
            const spidaLocation = unmatchedPole.spidaLocation;
            
            // Find measured and recommended designs
            const measuredDesign = spidaLocation.designs?.find(design => design.layerType === 'Measured');
            const recommendedDesign = spidaLocation.designs?.find(design => design.layerType === 'Recommended');
            
            // Create row with just SPIDAcalc data
            const rowData = {};
            
            // Column A: Operation Number (continue from where correlated poles left off)
            rowData.operationNumber = (correlatedPoles.length + index + 1).toString();
            
            // For unmatched poles, we can only use SPIDAcalc data
            
            // Column B: Attachment Action (I/R/E)
            rowData.attachmentAction = 'Unknown'; // Would need SPIDAcalc-only logic
            
            // Column C: Pole Owner
            if (measuredDesign?.structure?.pole) {
                rowData.poleOwner = getSpidaPoleOwner(measuredDesign.structure.pole);
            } else {
                rowData.poleOwner = 'Unknown';
            }
            
            // Column D: Pole Number
            rowData.poleNumber = unmatchedPole.poleNumber;
            
            // Column E: Pole Structure (Species & Class)
            if (measuredDesign?.structure?.pole?.clientItem?.id && spidaData.clientData?.poles) {
                const poleRef = measuredDesign.structure.pole.clientItem.id;
                const poleDef = getSpidaPoleDefinitionByRef(poleRef, spidaData.clientData.poles);
                rowData.poleStructure = getSpidaPoleStructureString(poleDef);
            } else {
                rowData.poleStructure = 'Unknown';
            }
            
            // Fill in remaining columns with SPIDA-only data or N/A
            rowData.proposedFeatures = 'N/A';
            rowData.constructionGrade = recommendedDesign?.analysis ? 
                getSpidaConstructionGrade(recommendedDesign.analysis) : 'N/A';
            
            rowData.lowestComHeight = 'N/A';
            rowData.lowestCpsElectricalHeight = 'N/A';
            rowData.midSpanFromToPole = `${unmatchedPole.poleNumber} / --`;
            
            // Fill in attachment-specific columns
            rowData.attacherDescription = 'N/A';
            rowData.existingAttachmentHeight = 'N/A';
            rowData.proposedAttachmentHeight = 'N/A';
            rowData.existingMidSpan = 'N/A';
            rowData.proposedMidSpan = 'N/A';
            
            reportRows.push(rowData);
        });
        
        // Store the generated data for later use when downloading
        generatedReportData = reportRows;
        
        return reportRows;
    } catch (error) {
        console.error('Error generating report:', error);
        throw new Error('Failed to generate make-ready report');
    }
}

/**
 * Determines the attachment action (I/R/E) for a pole
 * 
 * @param {Object} measuredDesign - The measured design object from SPIDAcalc
 * @param {Object} recommendedDesign - The recommended design object from SPIDAcalc
 * @param {Object} katapultNode - The node data object from Katapult
 * @param {Object} katapultTraceData - The trace data object from Katapult
 * @param {string} targetCompany - The target company name (e.g., "Charter/Spectrum")
 * @returns {string} - "I" for Install, "R" for Relocate, "E" for Existing, or "N/A"
 */
function determineAttachmentAction(measuredDesign, recommendedDesign, katapultNode, katapultTraceData, targetCompany) {
    try {
        // Try SPIDAcalc first
        if (measuredDesign && recommendedDesign) {
            const action = getSpidaAttachmentActionDetails(
                measuredDesign, 
                recommendedDesign, 
                [] // We'd need to filter client data items for the target company
            );
            
            if (action !== 'Unknown' && action !== 'N/A') {
                return action;
            }
        }
        
        // If SPIDAcalc doesn't give us a result, try Katapult
        if (katapultNode && katapultTraceData) {
            const action = getKatapultAttachmentActionDetails(
                katapultNode,
                targetCompany
            );
            
            if (action !== 'Unknown') {
                return action;
            }
        }
        
        return 'N/A';
    } catch (error) {
        console.error('Error determining attachment action:', error);
        return 'N/A';
    }
}

/**
 * Determines the pole structure (species and class)
 * 
 * @param {Object} measuredDesign - The measured design object from SPIDAcalc
 * @param {Array} spidaClientDataPoles - The poles array from SPIDAcalc clientData
 * @param {Object} katapultNode - The node data object from Katapult
 * @returns {string} - Formatted string describing pole structure
 */
function determinePoleStructure(measuredDesign, spidaClientDataPoles, katapultNode) {
    try {
        // Try SPIDAcalc first
        if (measuredDesign?.structure?.pole?.clientItem?.id && spidaClientDataPoles) {
            const poleRef = measuredDesign.structure.pole.clientItem.id;
            const poleDef = getSpidaPoleDefinitionByRef(poleRef, spidaClientDataPoles);
            const structureString = getSpidaPoleStructureString(poleDef);
            
            if (structureString !== 'Unknown') {
                return structureString;
            }
        }
        
        // If SPIDAcalc doesn't give us a result, try Katapult
        if (katapultNode) {
            const structureString = getKatapultPoleStructureString(katapultNode);
            if (structureString !== 'Unknown') {
                return structureString;
            }
        }
        
        return 'Unknown';
    } catch (error) {
        console.error('Error determining pole structure:', error);
        return 'Unknown';
    }
}

/**
 * Determines the proposed features (riser, guy, PLA)
 * 
 * @param {Object} recommendedDesign - The recommended design object from SPIDAcalc
 * @param {Array} spidaClientDataEquipments - The equipments array from SPIDAcalc clientData
 * @param {Object} katapultNode - The node data object from Katapult
 * @param {Object} katapultTraceData - The trace data object from Katapult
 * @param {Object} katapultConnectionData - The connection data object from Katapult
 * @returns {string} - Formatted string describing proposed features
 */
function determineProposedFeatures(recommendedDesign, spidaClientDataEquipments, katapultNode, katapultTraceData, katapultConnectionData) {
    try {
        // Check for proposed riser
        let hasRiser = false;
        if (recommendedDesign?.structure && spidaClientDataEquipments) {
            hasRiser = getSpidaProposedRiser(recommendedDesign.structure, spidaClientDataEquipments);
        }
        
        if (!hasRiser && katapultNode && katapultTraceData) {
            hasRiser = getKatapultProposedRiser(katapultNode, katapultTraceData);
        }
        
        // Check for proposed guy
        let hasGuy = false;
        if (recommendedDesign?.structure) {
            hasGuy = getSpidaProposedGuy(recommendedDesign.structure);
        }
        
        if (!hasGuy && katapultNode && katapultTraceData && katapultConnectionData) {
            hasGuy = getKatapultProposedGuy(katapultNode, katapultTraceData, katapultConnectionData);
        }
        
        // Get PLA value
        let plaValue = null;
        if (recommendedDesign) {
            plaValue = getSpidaPlaRecommended(recommendedDesign);
        }
        
        if (plaValue === null && katapultNode) {
            plaValue = getKatapultPla(katapultNode);
        }
        
        // Format the result
        const riserText = hasRiser ? 'Riser: YES' : 'Riser: NO';
        const guyText = hasGuy ? 'Guy: YES' : 'Guy: NO';
        const plaText = plaValue !== null ? `PLA: ${plaValue.toFixed(1)}%` : 'PLA: --';
        
        return `${riserText}, ${guyText}, ${plaText}`;
    } catch (error) {
        console.error('Error determining proposed features:', error);
        return 'Riser: NO, Guy: NO, PLA: --';
    }
}

/**
 * Determines the lowest communication wire height in mid-span
 * 
 * @param {Object} measuredDesign - The measured design object from SPIDAcalc
 * @param {Array} spidaClientDataWires - The wires array from SPIDAcalc clientData
 * @param {Object} katapultNode - The node data object from Katapult
 * @param {Object} katapultTraceData - The trace data object from Katapult
 * @param {Object} katapultPhotoData - The photo data object from Katapult
 * @returns {string} - Formatted height or 'N/A' if not found
 */
function determineLowestComHeight(measuredDesign, spidaClientDataWires, katapultNode, katapultTraceData, katapultPhotoData) {
    try {
        // Try SPIDAcalc first
        let height = null;
        if (measuredDesign?.structure?.wires && spidaClientDataWires) {
            height = getSpidaLowestCommMidspanHeight(measuredDesign.structure.wires, spidaClientDataWires);
        }
        
        // If SPIDAcalc doesn't give us a result, try Katapult
        if (height === null && katapultNode && katapultTraceData && katapultPhotoData) {
            height = getKatapultLowestCommMidspanHeight(katapultNode, katapultTraceData, katapultPhotoData);
        }
        
        return height !== null ? formatHeight(height) : 'N/A';
    } catch (error) {
        console.error('Error determining lowest communication height:', error);
        return 'N/A';
    }
}

/**
 * Determines the lowest CPS electrical wire height in mid-span
 * 
 * @param {Object} measuredDesign - The measured design object from SPIDAcalc
 * @param {Array} spidaClientDataWires - The wires array from SPIDAcalc clientData
 * @param {Object} katapultNode - The node data object from Katapult
 * @param {Object} katapultTraceData - The trace data object from Katapult
 * @param {Object} katapultPhotoData - The photo data object from Katapult
 * @returns {string} - Formatted height or 'N/A' if not found
 */
function determineLowestCpsElectricalHeight(measuredDesign, spidaClientDataWires, katapultNode, katapultTraceData, katapultPhotoData) {
    try {
        // Try SPIDAcalc first
        let height = null;
        if (measuredDesign?.structure?.wires && spidaClientDataWires) {
            height = getSpidaLowestCpsElectricalMidspanHeight(measuredDesign.structure.wires, spidaClientDataWires);
        }
        
        // If SPIDAcalc doesn't give us a result, try Katapult
        if (height === null && katapultNode && katapultTraceData && katapultPhotoData) {
            height = getKatapultLowestCpsElectricalMidspanHeight(katapultNode, katapultTraceData, katapultPhotoData);
        }
        
        return height !== null ? formatHeight(height) : 'N/A';
    } catch (error) {
        console.error('Error determining lowest CPS electrical height:', error);
        return 'N/A';
    }
}

/**
 * Finds the target attachment (e.g., Charter/Spectrum) for a pole
 * 
 * @param {Object} measuredDesign - The measured design object from SPIDAcalc
 * @param {Object} recommendedDesign - The recommended design object from SPIDAcalc
 * @param {Object} katapultNode - The node data object from Katapult
 * @param {Object} katapultTraceData - The trace data object from Katapult
 * @param {Object} katapultPhotoData - The photo data object from Katapult
 * @param {string} targetCompany - The target company name (e.g., "Charter/Spectrum")
 * @returns {Object|null} - Object with attachment details or null if not found
 */
function findTargetAttachment(measuredDesign, recommendedDesign, katapultNode, katapultTraceData, katapultPhotoData, targetCompany) {
    try {
        // This is a simplified placeholder for the actual logic
        // In a complete implementation, we would:
        // 1. Find Charter/Spectrum attachments in SPIDAcalc and/or Katapult
        // 2. Determine which one is being acted upon (installed, relocated, or existing)
        // 3. Extract all the necessary details for columns K-O
        
        // For now, just return null to indicate we couldn't find a target attachment
        return null;
    } catch (error) {
        console.error('Error finding target attachment:', error);
        return null;
    }
}

/**
 * Formats a height value for display
 * 
 * @param {number} height - Height value in feet
 * @returns {string} - Formatted height string (e.g., "25.5'")
 */
function formatHeight(height) {
    if (typeof height !== 'number' || isNaN(height)) {
        return 'N/A';
    }
    
    // Format to 1 decimal place and add foot symbol
    return `${height.toFixed(1)}'`;
}

/**
 * Creates an Excel file from the report data
 * 
 * @param {Array} reportData - Array of report row objects
 */
function createExcelFile(reportData) {
    // This function is just a placeholder
    // The actual implementation will be in excel-writer.js
    console.log('Creating Excel file with', reportData.length, 'rows');
}

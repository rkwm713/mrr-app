/**
 * Make-Ready Report Generator - Pole Data Extraction Example
 * 
 * This example demonstrates core functionality for extracting pole data
 * from SPIDAcalc and Katapult JSON files.
 */

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Safely extracts a nested value from an object using a path array
 * @param {Object} obj - The object to extract from
 * @param {Array<string>} path - Array of keys forming the path
 * @param {*} defaultValue - Value to return if path doesn't exist
 * @returns {*} The extracted value or defaultValue
 */
function getNestedValue(obj, path, defaultValue = null) {
    return path.reduce((current, key) => {
        if (current && typeof current === 'object' && key in current) {
            return current[key];
        }
        return undefined;
    }, obj) ?? defaultValue;
}

/**
 * Converts metres to feet
 * @param {number} metres - Value in metres
 * @returns {number} Value in feet
 */
function metresToFeet(metres) {
    return metres * 3.28084;
}

/**
 * Parses imperial height strings into decimal feet
 * @param {string} heightStr - Height string like "25' 6""
 * @returns {number} Height in decimal feet
 */
function parseImperialHeight(heightStr) {
    if (!heightStr || typeof heightStr !== 'string') return null;
    
    // Parse feet and inches
    const feetMatch = heightStr.match(/(\d+)['′]/);
    const inchesMatch = heightStr.match(/(\d+)[""″]/);
    
    const feet = feetMatch ? parseInt(feetMatch[1], 10) : 0;
    const inches = inchesMatch ? parseInt(inchesMatch[1], 10) : 0;
    
    return feet + (inches / 12);
}

// -----------------------------------------------------------------------------
// SPIDAcalc Data Extraction
// -----------------------------------------------------------------------------

/**
 * Gets the specific design (Measured or Recommended) for a location
 * @param {Object} location - Location object from SPIDAcalc
 * @param {string} type - Design type: "Measured" or "Recommended"
 * @returns {Object|null} The design object or null if not found
 */
function getDesign(location, type) {
    if (!location || !location.designs) return null;
    
    return location.designs.find(design => 
        design.layerType === type
    ) || null;
}

/**
 * Extracts pole owner from SPIDAcalc data
 * @param {Object} spidaData - SPIDAcalc JSON data
 * @param {Object} location - Location object for a specific pole
 * @returns {string} Pole owner name or "Unknown"
 */
function getSpidaPoleOwner(spidaData, location) {
    try {
        const measuredDesign = getDesign(location, "Measured");
        if (!measuredDesign) return "Unknown";
        
        const ownerPath = ['structure', 'pole', 'owner', 'id'];
        return getNestedValue(measuredDesign, ownerPath, "Unknown");
    } catch (error) {
        console.error("Error extracting pole owner:", error);
        return "Unknown";
    }
}

/**
 * Finds a pole definition in clientData using a reference ID
 * @param {Object} spidaData - SPIDAcalc JSON data
 * @param {string} poleRefId - Reference ID for the pole
 * @returns {Object|null} The pole definition or null if not found
 */
function findPoleDefinition(spidaData, poleRefId) {
    if (!spidaData || !spidaData.clientData || !spidaData.clientData.poles) {
        return null;
    }
    
    return spidaData.clientData.poles.find(pole => 
        pole.aliases && pole.aliases.some(alias => alias.id === poleRefId)
    ) || null;
}

/**
 * Extracts pole structure (species and class) from SPIDAcalc
 * @param {Object} spidaData - SPIDAcalc JSON data
 * @param {Object} location - Location object for a specific pole
 * @returns {string} Combined species and class or "Unknown"
 */
function getSpidaPoleStructure(spidaData, location) {
    try {
        const measuredDesign = getDesign(location, "Measured");
        if (!measuredDesign) return "Unknown";
        
        // Get the client item reference
        const poleRefId = getNestedValue(
            measuredDesign, 
            ['structure', 'pole', 'clientItem', 'id'], 
            null
        );
        
        if (!poleRefId) return "Unknown";
        
        // Find the pole definition
        const poleDef = findPoleDefinition(spidaData, poleRefId);
        if (!poleDef) return "Unknown";
        
        // Extract and combine species and class
        const species = poleDef.species || "";
        const classOfPole = poleDef.classOfPole || "";
        
        if (!species && !classOfPole) return "Unknown";
        return `${species} ${classOfPole}`.trim();
    } catch (error) {
        console.error("Error extracting pole structure:", error);
        return "Unknown";
    }
}

/**
 * Extracts PLA (Percent Loading) value from SPIDAcalc data
 * @param {Object} spidaData - SPIDAcalc JSON data
 * @param {Object} location - Location object for a specific pole
 * @returns {string} PLA as percentage string or "N/A"
 */
function getSpidaPLA(spidaData, location) {
    try {
        const recommendedDesign = getDesign(location, "Recommended");
        if (!recommendedDesign) return "N/A";
        
        const stressRatio = getNestedValue(
            recommendedDesign,
            ['structure', 'pole', 'stressRatio'],
            null
        );
        
        if (stressRatio === null) return "N/A";
        
        // Convert decimal to percentage with 2 decimal places
        return (stressRatio * 100).toFixed(2) + "%";
    } catch (error) {
        console.error("Error extracting PLA:", error);
        return "N/A";
    }
}

// -----------------------------------------------------------------------------
// Katapult Data Extraction
// -----------------------------------------------------------------------------

/**
 * Extracts the actual value from an attribute object
 * based on common Katapult patterns
 */
function extractAttributeValue(attrObj) {
    if (!attrObj) return null;
    
    // Common patterns in descending priority
    if (attrObj.assessment !== undefined) return attrObj.assessment;
    if (attrObj.one !== undefined) return attrObj.one;
    if (attrObj['-Imported'] !== undefined) return attrObj['-Imported'];
    if (attrObj.multi_added !== undefined) return attrObj.multi_added;
    if (attrObj.button_added !== undefined) return attrObj.button_added;
    
    // If it's a simple value
    if (typeof attrObj !== 'object') return attrObj;
    
    // Look for any value in the object
    for (const key in attrObj) {
        const val = attrObj[key];
        if (val !== undefined && typeof val !== 'object') return val;
    }
    
    return null;
}

/**
 * Finds a Katapult node attribute using flexible key matching
 * @param {Object} attributes - Node attributes object
 * @param {Array<string>} possibleKeys - Array of possible key patterns in priority order
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Found attribute value or default
 */
function findNodeAttribute(attributes, possibleKeys, defaultValue = null) {
    if (!attributes || !Array.isArray(possibleKeys)) {
        return defaultValue;
    }
    
    try {
        for (const keyPattern of possibleKeys) {
            // Try direct key access first
            if (attributes[keyPattern] !== undefined) {
                const value = extractAttributeValue(attributes[keyPattern]);
                if (value !== null && value !== undefined) {
                    return value;
                }
            }
            
            // Try partial key matching
            for (const key of Object.keys(attributes)) {
                if (key.includes(keyPattern)) {
                    const value = extractAttributeValue(attributes[key]);
                    if (value !== null && value !== undefined) {
                        return value;
                    }
                }
            }
        }
        
        return defaultValue;
    } catch (error) {
        console.error(`Error finding attribute with keys [${possibleKeys.join(', ')}]:`, error);
        return defaultValue;
    }
}

/**
 * Extracts pole number from Katapult node
 * @param {Object} node - Katapult node object
 * @returns {string} Pole number or null
 */
function getKatapultPoleNumber(node) {
    if (!node || !node.attributes) return null;
    
    // Check in priority order
    return findNodeAttribute(
        node.attributes, 
        ['PoleNumber', 'electric_pole_tag', 'DLOC_number'],
        null
    );
}

/**
 * Extracts pole owner from Katapult node
 * @param {Object} node - Katapult node object
 * @returns {string} Pole owner or "Unknown"
 */
function getKatapultPoleOwner(node) {
    if (!node || !node.attributes) return "Unknown";
    
    return findNodeAttribute(
        node.attributes, 
        ['pole_owner'],
        "Unknown"
    );
}

/**
 * Finds Charter/Spectrum traces in Katapult data
 * @param {Object} katapultData - Katapult JSON data
 * @returns {Array} Array of charter trace objects
 */
function findCharterTraces(katapultData) {
    if (!katapultData || !katapultData.traces || !katapultData.traces.trace_data) {
        return [];
    }
    
    const traceData = katapultData.traces.trace_data;
    const charterTraces = [];
    
    for (const traceId in traceData) {
        const trace = traceData[traceId];
        if (isCharterCompany(trace.company)) {
            charterTraces.push({
                id: traceId,
                ...trace
            });
        }
    }
    
    return charterTraces;
}

/**
 * Determines if a company name is Charter/Spectrum
 * @param {string} company - Company name to check
 * @returns {boolean} True if the company is Charter/Spectrum
 */
function isCharterCompany(company) {
    if (!company) return false;
    
    const companyLower = company.toLowerCase();
    return companyLower.includes('charter') || 
           companyLower.includes('spectrum') || 
           companyLower.includes('time warner');
}

// -----------------------------------------------------------------------------
// Pole Correlation
// -----------------------------------------------------------------------------

/**
 * Normalizes a pole number for comparison
 * @param {string} poleNumber - Pole number to normalize
 * @returns {string} Normalized pole number
 */
function normalizePoleNumber(poleNumber) {
    if (!poleNumber) return '';
    
    // Convert to string if not already
    const poleStr = String(poleNumber);
    
    return poleStr
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
        .replace(/^[p]+/, '');      // Remove leading 'P' or 'p'
}

/**
 * Correlates poles between SPIDAcalc and Katapult data
 * @param {Array} spidaLocations - Array of SPIDAcalc locations
 * @param {Array} katapultNodes - Array of Katapult nodes
 * @returns {Object} Correlation results with matched and unmatched poles
 */
function correlatePoles(spidaLocations, katapultNodes) {
    const correlatedPoles = [];
    const unmatchedSpida = [];
    const unmatchedKatapult = [];
    
    // Create lookup map for Katapult nodes
    const katapultMap = new Map();
    for (const node of katapultNodes) {
        const poleNumber = getKatapultPoleNumber(node);
        if (poleNumber) {
            const normalizedNumber = normalizePoleNumber(poleNumber);
            katapultMap.set(normalizedNumber, node);
        } else {
            unmatchedKatapult.push(node);
        }
    }
    
    // Match SPIDAcalc locations
    for (const location of spidaLocations) {
        const spidaPoleNumber = location.label;
        const normalizedNumber = normalizePoleNumber(spidaPoleNumber);
        
        if (katapultMap.has(normalizedNumber)) {
            // Found a match
            const katapultNode = katapultMap.get(normalizedNumber);
            
            correlatedPoles.push({
                spidaLocation: location,
                katapultNode: katapultNode,
                confidence: 1.0,
                matchType: 'exact'
            });
            
            // Remove from map to mark as processed
            katapultMap.delete(normalizedNumber);
        } else {
            // No match found in Katapult
            unmatchedSpida.push(location);
        }
    }
    
    // Add poles that only exist in one system
    for (const location of unmatchedSpida) {
        correlatedPoles.push({
            spidaLocation: location,
            katapultNode: null,
            confidence: 0,
            matchType: 'spida_only'
        });
    }
    
    // Add remaining Katapult nodes
    for (const [normalizedNumber, node] of katapultMap.entries()) {
        correlatedPoles.push({
            spidaLocation: null,
            katapultNode: node,
            confidence: 0,
            matchType: 'katapult_only'
        });
    }
    
    // Add nodes without pole numbers
    for (const node of unmatchedKatapult) {
        correlatedPoles.push({
            spidaLocation: null,
            katapultNode: node,
            confidence: 0,
            matchType: 'katapult_only'
        });
    }
    
    return {
        correlatedPoles,
        stats: {
            total: correlatedPoles.length,
            matched: correlatedPoles.filter(p => p.confidence > 0).length,
            spidaOnly: correlatedPoles.filter(p => p.matchType === 'spida_only').length,
            katapultOnly: correlatedPoles.filter(p => p.matchType === 'katapult_only').length
        }
    };
}

// -----------------------------------------------------------------------------
// Example Usage
// -----------------------------------------------------------------------------

/**
 * Example function to process pole data from both sources
 * @param {Object} spidaData - SPIDAcalc JSON data
 * @param {Object} katapultData - Katapult JSON data
 * @returns {Array} Array of processed pole data objects
 */
function processPolesExample(spidaData, katapultData) {
    // Extract pole locations from SPIDAcalc
    const spidaLocations = [];
    if (spidaData && spidaData.leads) {
        for (const lead of spidaData.leads) {
            if (lead.locations) {
                spidaLocations.push(...lead.locations);
            }
        }
    }
    
    // Extract nodes from Katapult
    const katapultNodes = [];
    if (katapultData && katapultData.nodes) {
        for (const nodeId in katapultData.nodes) {
            katapultNodes.push({
                id: nodeId,
                ...katapultData.nodes[nodeId]
            });
        }
    }
    
    // Correlate poles
    const { correlatedPoles } = correlatePoles(spidaLocations, katapultNodes);
    
    // Process each correlated pole
    const processedPoles = correlatedPoles.map(pole => {
        const result = {
            poleNumber: "Unknown",
            poleOwner: "Unknown",
            poleStructure: "Unknown",
            pla: "N/A",
            source: "Unknown"
        };
        
        // Get pole number
        if (pole.spidaLocation) {
            result.poleNumber = pole.spidaLocation.label || "Unknown";
            result.source = pole.katapultNode ? "Both" : "SPIDAcalc";
        } else if (pole.katapultNode) {
            result.poleNumber = getKatapultPoleNumber(pole.katapultNode) || "Unknown";
            result.source = "Katapult";
        }
        
        // Get pole owner (prefer SPIDAcalc)
        if (pole.spidaLocation) {
            result.poleOwner = getSpidaPoleOwner(spidaData, pole.spidaLocation);
        } else if (pole.katapultNode) {
            result.poleOwner = getKatapultPoleOwner(pole.katapultNode);
        }
        
        // Get pole structure (prefer SPIDAcalc)
        if (pole.spidaLocation) {
            result.poleStructure = getSpidaPoleStructure(spidaData, pole.spidaLocation);
        } else if (pole.katapultNode) {
            // Katapult implementation would be similar to getKatapultPoleOwner
        }
        
        // Get PLA (only from SPIDAcalc)
        if (pole.spidaLocation) {
            result.pla = getSpidaPLA(spidaData, pole.spidaLocation);
        }
        
        return result;
    });
    
    return processedPoles;
}

// Example of how to use the above function:
/*
// Load data from files
const spidaData = JSON.parse(fs.readFileSync('sample_data/spida_sample.json', 'utf8'));
const katapultData = JSON.parse(fs.readFileSync('sample_data/katapult_sample.json', 'utf8'));

// Process poles
const poles = processPolesExample(spidaData, katapultData);

// Display results
console.table(poles);
*/

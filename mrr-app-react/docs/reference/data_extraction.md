# Data Extraction Reference

This document provides detailed information on extracting specific data fields from SPIDAcalc and Katapult JSON structures. It serves as a technical reference for implementation and maintenance.

## Utility Functions

Before implementing specific field extractors, create these utility functions:

```javascript
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
```

## SPIDAcalc Data Extraction

### Finding Design Objects

SPIDAcalc stores "Measured" (existing) and "Recommended" (proposed) designs for each pole:

```javascript
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
 * Gets both Measured and Recommended designs for comparison
 * @param {Object} location - Location object from SPIDAcalc
 * @returns {Object} Object with measured and recommended properties
 */
function getDesignPair(location) {
    return {
        measured: getDesign(location, "Measured"),
        recommended: getDesign(location, "Recommended")
    };
}
```

### Looking Up Client Data References

SPIDAcalc uses references to client data for component definitions:

```javascript
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
 * Similar lookup functions for wires, equipment, etc.
 */
function findWireDefinition(spidaData, wireRefId) {
    // Implementation similar to findPoleDefinition
}

function findEquipmentDefinition(spidaData, equipmentRefId) {
    // Implementation similar to findPoleDefinition
}
```

### Detailed Field Extraction (Examples)

#### Pole Owner (Column C)

```javascript
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
```

#### Pole Structure (Column E)

```javascript
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
```

#### Attachment Action (Column B)

```javascript
/**
 * Determines the attachment action for Charter/Spectrum's attachment
 * @param {Object} spidaData - SPIDAcalc JSON data
 * @param {Object} location - Location object for a specific pole
 * @returns {string} "I" (Install), "R" (Relocate), or "E" (Existing)
 */
function getSpidaAttachmentAction(spidaData, location) {
    try {
        const designs = getDesignPair(location);
        if (!designs.measured || !designs.recommended) return "E"; // Default
        
        // Find Charter/Spectrum attachments in both designs
        const measuredAttachments = findCharterAttachments(designs.measured);
        const recommendedAttachments = findCharterAttachments(designs.recommended);
        
        // No attachments in either design
        if (measuredAttachments.length === 0 && recommendedAttachments.length === 0) {
            return "E";
        }
        
        // Attachments in recommended but not measured = Install
        if (measuredAttachments.length === 0 && recommendedAttachments.length > 0) {
            return "I";
        }
        
        // Compare attachments for changes in height or properties
        const hasChanges = detectAttachmentChanges(
            measuredAttachments, 
            recommendedAttachments
        );
        
        return hasChanges ? "R" : "E";
    } catch (error) {
        console.error("Error determining attachment action:", error);
        return "E"; // Default to Existing on error
    }
}

/**
 * Helper to find Charter/Spectrum attachments in a design
 */
function findCharterAttachments(design) {
    if (!design || !design.structure) return [];
    
    const charterWires = (design.structure.wires || []).filter(wire => 
        isCharterOwner(wire.owner)
    );
    
    const charterEquipment = (design.structure.equipments || []).filter(eq => 
        isCharterOwner(eq.owner)
    );
    
    return [...charterWires, ...charterEquipment];
}

/**
 * Helper to determine if an owner is Charter/Spectrum
 */
function isCharterOwner(owner) {
    if (!owner || !owner.id) return false;
    
    const ownerName = owner.id.toLowerCase();
    return ownerName.includes('charter') || 
           ownerName.includes('spectrum') || 
           ownerName.includes('time warner');
}
```

## Katapult Data Extraction

### Handling Dynamic Keys

Katapult uses dynamic keys for many objects:

```javascript
/**
 * Finds the first attribute value with a specific key pattern
 * @param {Object} attributes - Node attributes object
 * @param {string} keyPattern - Base key to look for
 * @returns {*} The value or null if not found
 */
function findAttributeValue(attributes, keyPattern) {
    if (!attributes) return null;
    
    // Check for the pattern as a direct key first
    if (attributes[keyPattern] !== undefined) {
        return extractAttributeValue(attributes[keyPattern]);
    }
    
    // Look for pattern as part of keys
    for (const key in attributes) {
        if (key.includes(keyPattern)) {
            return extractAttributeValue(attributes[key]);
        }
    }
    
    return null;
}

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
```

### Pole Information

```javascript
/**
 * Extracts pole number from Katapult node
 * @param {Object} node - Katapult node object
 * @returns {string} Pole number or null
 */
function getKatapultPoleNumber(node) {
    if (!node || !node.attributes) return null;
    
    // Check in priority order
    const poleNumber = 
        findAttributeValue(node.attributes, 'PoleNumber') ||
        findAttributeValue(node.attributes, 'electric_pole_tag') ||
        findAttributeValue(node.attributes, 'DLOC_number');
    
    return poleNumber;
}

/**
 * Extracts pole owner from Katapult node
 * @param {Object} node - Katapult node object
 * @returns {string} Pole owner or "Unknown"
 */
function getKatapultPoleOwner(node) {
    if (!node || !node.attributes) return "Unknown";
    
    return findAttributeValue(node.attributes, 'pole_owner') || "Unknown";
}
```

### Trace and Photo Data

```javascript
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
 */
function isCharterCompany(company) {
    if (!company) return false;
    
    const companyLower = company.toLowerCase();
    return companyLower.includes('charter') || 
           companyLower.includes('spectrum') || 
           companyLower.includes('time warner');
}

/**
 * Gets measurement data for a trace from photo data
 * @param {Object} node - Katapult node
 * @param {string} traceId - Trace ID to find
 * @returns {Object|null} Measurement data or null
 */
function getTraceMeasurementData(node, traceId) {
    if (!node || !node.photos) return null;
    
    // Check each photo for the trace
    for (const photoId in node.photos) {
        const photo = node.photos[photoId];
        if (!photo.photofirst_data || !photo.photofirst_data.wire) continue;
        
        // Look for wire with matching trace
        for (const wireId in photo.photofirst_data.wire) {
            const wire = photo.photofirst_data.wire[wireId];
            if (wire._trace === traceId) {
                return wire;
            }
        }
    }
    
    return null;
}
```

## Integration Examples

### Combining SPIDAcalc and Katapult Data

```javascript
/**
 * Gets the pole owner using both data sources
 * @param {Object} spidaData - SPIDAcalc JSON data
 * @param {Object} katapultData - Katapult JSON data
 * @param {Object} correlatedPole - Object with both pole references
 * @returns {string} Pole owner
 */
function getPoleOwner(spidaData, katapultData, correlatedPole) {
    // Prefer SPIDAcalc data
    if (correlatedPole.spidaLocation) {
        const spidaOwner = getSpidaPoleOwner(spidaData, correlatedPole.spidaLocation);
        if (spidaOwner && spidaOwner !== "Unknown") {
            return spidaOwner;
        }
    }
    
    // Fall back to Katapult
    if (correlatedPole.katapultNode) {
        return getKatapultPoleOwner(correlatedPole.katapultNode);
    }
    
    return "Unknown";
}
```

### Determining Make-Ready Actions

```javascript
/**
 * Determines the attachment action using both data sources
 * @param {Object} spidaData - SPIDAcalc JSON data
 * @param {Object} katapultData - Katapult JSON data
 * @param {Object} correlatedPole - Object with both pole references
 * @returns {string} "I", "R", or "E"
 */
function determineAttachmentAction(spidaData, katapultData, correlatedPole) {
    let actionCode = "E"; // Default
    
    // Check Katapult for proposed traces or moves (higher priority)
    if (correlatedPole.katapultNode) {
        const charterTraces = findCharterTraces(katapultData);
        const proposedTrace = charterTraces.find(trace => trace.proposed === true);
        
        if (proposedTrace) {
            actionCode = "I"; // Proposed = Install
        } else {
            // Check for move amount
            const nodeId = correlatedPole.katapultNode.id;
            
            // Find a charter trace with mr_move value
            for (const trace of charterTraces) {
                const measurementData = getTraceMeasurementData(
                    correlatedPole.katapultNode, 
                    trace.id
                );
                
                if (measurementData && measurementData.mr_move) {
                    const moveAmount = parseFloat(measurementData.mr_move);
                    if (!isNaN(moveAmount) && moveAmount !== 0) {
                        actionCode = "R"; // Non-zero move = Relocate
                        break;
                    }
                }
            }
        }
    }
    
    // If no action from Katapult, check SPIDAcalc
    if (actionCode === "E" && correlatedPole.spidaLocation) {
        actionCode = getSpidaAttachmentAction(spidaData, correlatedPole.spidaLocation);
    }
    
    return actionCode;
}
```

## Common Challenges and Solutions

### Missing or Invalid Data

- Always use default values for missing data
- Check array existence before iteration
- Validate numeric values before calculations
- Normalize strings for case-insensitive comparisons

### Asynchronous Loading

JSON files can be large, especially with photos. Use async/await for file loading:

```javascript
async function loadFiles() {
    try {
        const spidaResponse = await fetch('sample_data/spida_sample.json');
        const katapultResponse = await fetch('sample_data/katapult_sample.json');
        
        const spidaData = await spidaResponse.json();
        const katapultData = await katapultResponse.json();
        
        // Process data...
    } catch (error) {
        console.error("Error loading data:", error);
    }
}
```

### Performance Considerations

- Cache lookup results when processing multiple poles
- Create indexes for frequently accessed objects
- Use efficient data structures for correlation (Maps/Sets)

# Error Handling Guide

This document provides detailed guidance on error handling patterns for the Make-Ready Report Generator. Robust error handling is critical for a data-processing application like this, as it must gracefully handle missing, malformed, or unexpected data structures.

## General Error Handling Principles

1. **Defensive Programming**
   - Never assume data exists or has a specific structure
   - Always provide default values
   - Check for null/undefined before accessing properties
   - Validate data before performing operations

2. **Graceful Degradation**
   - When a specific data point is missing, the application should continue processing
   - Missing individual fields should not stop the entire report generation
   - Always fall back to reasonable defaults or placeholders

3. **Transparent Error Reporting**
   - Provide clear error messages that explain what went wrong
   - Include specific details to help debug (field name, object path, etc.)
   - Log errors to console with enough context to understand the issue

## Common Error Scenarios

### 1. Missing or Malformed JSON Data

**Scenario**: User uploads an invalid JSON file or a file with an unexpected structure.

**Solution**:

```javascript
/**
 * Validates and parses JSON data
 * @param {string} jsonString - JSON data as a string
 * @returns {Object} Result object with success flag and data/error
 */
function parseAndValidateJSON(jsonString) {
    try {
        // Attempt to parse the JSON
        const data = JSON.parse(jsonString);
        
        // Basic validation for expected top-level structures
        if (!data) {
            return {
                success: false,
                error: "JSON data is empty or null"
            };
        }
        
        // SPIDAcalc validation
        if (isSpidaCalcFile(data)) {
            if (!data.leads || !data.clientData) {
                return {
                    success: false,
                    error: "Invalid SPIDAcalc file: missing required 'leads' or 'clientData' sections"
                };
            }
            return { success: true, data, fileType: "SPIDAcalc" };
        }
        
        // Katapult validation
        if (isKatapultFile(data)) {
            if (!data.nodes || !data.traces) {
                return {
                    success: false,
                    error: "Invalid Katapult file: missing required 'nodes' or 'traces' sections"
                };
            }
            return { success: true, data, fileType: "Katapult" };
        }
        
        // Unknown file type
        return {
            success: false,
            error: "Unrecognized JSON file format"
        };
    } catch (error) {
        return {
            success: false,
            error: `JSON parsing error: ${error.message}`
        };
    }
}

/**
 * Determines if the JSON data is likely from SPIDAcalc
 */
function isSpidaCalcFile(data) {
    return Boolean(
        data.schema && 
        data.schema.includes("/schema/spidacalc/") ||
        data.clientData && data.leads
    );
}

/**
 * Determines if the JSON data is likely from Katapult
 */
function isKatapultFile(data) {
    return Boolean(
        data.nodes && data.traces ||
        data.job_creator && data.traces
    );
}
```

### 2. Safe Data Access

**Scenario**: Need to access deeply nested properties that might not exist.

**Solution**:

```javascript
/**
 * Safely extracts a nested value from an object using a path array
 * @param {Object} obj - The object to extract from
 * @param {Array<string|number>} path - Array of keys/indices forming the path
 * @param {*} defaultValue - Value to return if path doesn't exist
 * @returns {*} The extracted value or defaultValue
 */
function getNestedValue(obj, path, defaultValue = null) {
    if (!obj || !path || !Array.isArray(path)) {
        return defaultValue;
    }
    
    try {
        return path.reduce((current, key) => {
            if (current === null || current === undefined) {
                return undefined;
            }
            
            if (typeof current !== 'object') {
                return undefined;
            }
            
            return current[key];
        }, obj) ?? defaultValue;
    } catch (error) {
        console.error(`Error accessing path [${path.join('.')}]:`, error);
        return defaultValue;
    }
}

// Enhanced version that handles array indices in path
function getNestedValueEnhanced(obj, path, defaultValue = null) {
    if (!obj || !path || !Array.isArray(path)) {
        return defaultValue;
    }
    
    try {
        let current = obj;
        
        for (const key of path) {
            if (current === null || current === undefined) {
                return defaultValue;
            }
            
            if (typeof current !== 'object') {
                return defaultValue;
            }
            
            // Handle array access with numeric keys or array notation
            if (Array.isArray(current) && (typeof key === 'string' && key.startsWith('[') && key.endsWith(']'))) {
                const index = parseInt(key.slice(1, -1), 10);
                if (isNaN(index) || index < 0 || index >= current.length) {
                    return defaultValue;
                }
                current = current[index];
            } else {
                current = current[key];
            }
        }
        
        return (current === undefined || current === null) ? defaultValue : current;
    } catch (error) {
        console.error(`Error accessing path [${path.join('.')}]:`, error);
        return defaultValue;
    }
}
```

### 3. Type Handling and Conversion

**Scenario**: Data values may be of unexpected types (string instead of number, etc.)

**Solution**:

```javascript
/**
 * Safely converts a value to a number
 * @param {*} value - Value to convert
 * @param {number} defaultValue - Default if conversion fails
 * @returns {number} The converted number or default
 */
function safeNumberConversion(value, defaultValue = 0) {
    if (value === null || value === undefined) {
        return defaultValue;
    }
    
    if (typeof value === 'number') {
        return isNaN(value) ? defaultValue : value;
    }
    
    if (typeof value === 'string') {
        // Handle percentage strings
        if (value.endsWith('%')) {
            const numValue = parseFloat(value.replace('%', ''));
            return isNaN(numValue) ? defaultValue : numValue / 100;
        }
        
        // Handle imperial height strings
        if (value.includes("'") || value.includes('"')) {
            return parseImperialHeight(value) || defaultValue;
        }
        
        // Standard number parsing
        const numValue = parseFloat(value);
        return isNaN(numValue) ? defaultValue : numValue;
    }
    
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    
    return defaultValue;
}

/**
 * Safely converts a value to a boolean
 * @param {*} value - Value to convert
 * @param {boolean} defaultValue - Default if conversion is unclear
 * @returns {boolean} The converted boolean or default
 */
function safeBooleanConversion(value, defaultValue = false) {
    if (value === null || value === undefined) {
        return defaultValue;
    }
    
    if (typeof value === 'boolean') {
        return value;
    }
    
    if (typeof value === 'number') {
        return value !== 0;
    }
    
    if (typeof value === 'string') {
        const lowered = value.toLowerCase().trim();
        if (['true', 'yes', 'y', '1', 'on'].includes(lowered)) {
            return true;
        }
        if (['false', 'no', 'n', '0', 'off'].includes(lowered)) {
            return false;
        }
    }
    
    return defaultValue;
}
```

### 4. Handling Dynamic Keys

**Scenario**: Katapult JSON uses dynamic keys that vary between files.

**Solution**:

```javascript
/**
 * Finds a value in an object with dynamic keys by partial key match
 * @param {Object} obj - Object to search in
 * @param {string} keyPattern - Partial key to match
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Found value or default
 */
function findValueByPartialKey(obj, keyPattern, defaultValue = null) {
    if (!obj || typeof obj !== 'object' || !keyPattern) {
        return defaultValue;
    }
    
    try {
        // Check for exact key match first
        if (obj[keyPattern] !== undefined) {
            return obj[keyPattern];
        }
        
        // Look for partial matches
        for (const key of Object.keys(obj)) {
            if (key.includes(keyPattern)) {
                return obj[key];
            }
        }
        
        return defaultValue;
    } catch (error) {
        console.error(`Error finding key matching pattern "${keyPattern}":`, error);
        return defaultValue;
    }
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
 * Extracts a value from a Katapult attribute object
 * which may have different structures
 */
function extractAttributeValue(attrObj) {
    if (attrObj === null || attrObj === undefined) {
        return null;
    }
    
    // Handle primitive values
    if (typeof attrObj !== 'object') {
        return attrObj;
    }
    
    // Common Katapult attribute patterns in priority order
    const fieldPriority = [
        'assessment',
        'one',
        '-Imported',
        'multi_added',
        'button_added',
        'auto_calced'
    ];
    
    for (const field of fieldPriority) {
        if (attrObj[field] !== undefined && attrObj[field] !== null) {
            return attrObj[field];
        }
    }
    
    // If no standard pattern, return the first non-object value
    for (const key of Object.keys(attrObj)) {
        const val = attrObj[key];
        if (val !== undefined && val !== null && typeof val !== 'object') {
            return val;
        }
    }
    
    return null;
}
```

### 5. Error Handling in Complex Functions

**Scenario**: Complex extraction functions with multiple steps that could fail.

**Solution**:

```javascript
/**
 * Extracts the pole structure information from multiple sources
 * @param {Object} spidaData - SPIDAcalc data
 * @param {Object} katapultData - Katapult data
 * @param {Object} correlatedPole - Correlated pole data
 * @returns {string} Pole structure (species and class)
 */
function getPoleStructure(spidaData, katapultData, correlatedPole) {
    let species = "";
    let poleClass = "";
    
    try {
        // Try SPIDAcalc first
        if (correlatedPole.spidaLocation) {
            try {
                const measuredDesign = getDesign(correlatedPole.spidaLocation, "Measured");
                if (measuredDesign) {
                    // Get pole reference
                    const poleRef = getNestedValue(
                        measuredDesign, 
                        ['structure', 'pole', 'clientItem', 'id'], 
                        null
                    );
                    
                    if (poleRef) {
                        // Find pole definition
                        const poleDef = findPoleDefinition(spidaData, poleRef);
                        
                        if (poleDef) {
                            species = poleDef.species || "";
                            poleClass = poleDef.classOfPole || "";
                        }
                    }
                }
            } catch (spidaError) {
                console.error("Error extracting pole structure from SPIDAcalc:", spidaError);
                // Continue to try Katapult, don't rethrow
            }
        }
        
        // If we couldn't get the data from SPIDAcalc, try Katapult
        if ((!species || !poleClass) && correlatedPole.katapultNode) {
            try {
                const attributes = correlatedPole.katapultNode.attributes;
                
                if (!species) {
                    species = findNodeAttribute(
                        attributes,
                        ['pole_species', 'wood_species', 'species'],
                        ""
                    );
                }
                
                if (!poleClass) {
                    poleClass = findNodeAttribute(
                        attributes,
                        ['pole_class', 'class', 'pole_class_value'],
                        ""
                    );
                }
            } catch (katapultError) {
                console.error("Error extracting pole structure from Katapult:", katapultError);
                // Continue with what we have, don't rethrow
            }
        }
        
        // Combine and return
        if (!species && !poleClass) {
            return "Unknown";
        }
        
        return `${species} ${poleClass}`.trim();
    } catch (error) {
        console.error("Unexpected error extracting pole structure:", error);
        return "Unknown";
    }
}
```

## Error Logging and Reporting

### Standardized Error Logging

Create a centralized error logging module:

```javascript
/**
 * Error logging levels
 */
const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    CRITICAL: 4
};

/**
 * Logger configuration
 */
const loggerConfig = {
    minLevel: LogLevel.INFO, // Skip DEBUG in production
    includeTimestamp: true,
    logToConsole: true,
    logToUI: true
};

/**
 * Error logging module
 */
const Logger = {
    _uiContainer: null,
    
    /**
     * Initializes the logger
     * @param {Object} config - Configuration options
     * @param {HTMLElement} uiContainer - Optional UI element for displaying logs
     */
    init(config = {}, uiContainer = null) {
        Object.assign(loggerConfig, config);
        this._uiContainer = uiContainer;
    },
    
    /**
     * Logs a message
     * @param {string} message - Log message
     * @param {number} level - LogLevel value
     * @param {Object} details - Additional details
     */
    log(message, level = LogLevel.INFO, details = null) {
        if (level < loggerConfig.minLevel) return;
        
        const timestamp = loggerConfig.includeTimestamp ? new Date().toISOString() : '';
        const levelName = Object.keys(LogLevel).find(key => LogLevel[key] === level) || 'INFO';
        const detailsStr = details ? ` | ${JSON.stringify(details)}` : '';
        
        const logMessage = `${timestamp} [${levelName}] ${message}${detailsStr}`;
        
        // Log to console
        if (loggerConfig.logToConsole) {
            switch (level) {
                case LogLevel.DEBUG:
                    console.debug(logMessage, details || '');
                    break;
                case LogLevel.INFO:
                    console.info(logMessage, details || '');
                    break;
                case LogLevel.WARNING:
                    console.warn(logMessage, details || '');
                    break;
                case LogLevel.ERROR:
                case LogLevel.CRITICAL:
                    console.error(logMessage, details || '');
                    break;
                default:
                    console.log(logMessage, details || '');
            }
        }
        
        // Log to UI
        if (loggerConfig.logToUI && this._uiContainer) {
            const logElement = document.createElement('div');
            logElement.className = `log-entry log-${levelName.toLowerCase()}`;
            logElement.textContent = logMessage;
            this._uiContainer.appendChild(logElement);
            
            // Auto-scroll to bottom
            this._uiContainer.scrollTop = this._uiContainer.scrollHeight;
        }
    },
    
    debug(message, details = null) {
        this.log(message, LogLevel.DEBUG, details);
    },
    
    info(message, details = null) {
        this.log(message, LogLevel.INFO, details);
    },
    
    warning(message, details = null) {
        this.log(message, LogLevel.WARNING, details);
    },
    
    error(message, details = null) {
        this.log(message, LogLevel.ERROR, details);
    },
    
    critical(message, details = null) {
        this.log(message, LogLevel.CRITICAL, details);
    }
};
```

### User-Facing Error Messages

Create a standardized way to display errors to users:

```javascript
/**
 * Shows an error message to the user
 * @param {string} message - Error message
 * @param {string} context - Context where the error occurred
 * @param {boolean} isRecoverable - Whether the user can continue
 */
function showUserError(message, context = '', isRecoverable = true) {
    // Log the error
    Logger.error(message, { context, isRecoverable });
    
    // Create or update error container
    let errorContainer = document.getElementById('error-container');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-container';
        errorContainer.className = 'error-container';
        document.body.appendChild(errorContainer);
    }
    
    // Create error message element
    const errorElement = document.createElement('div');
    errorElement.className = `error-message ${isRecoverable ? 'recoverable' : 'critical'}`;
    
    // Add error content
    const titleElement = document.createElement('h3');
    titleElement.textContent = isRecoverable ? 'Warning' : 'Error';
    errorElement.appendChild(titleElement);
    
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    errorElement.appendChild(messageElement);
    
    if (context) {
        const contextElement = document.createElement('p');
        contextElement.className = 'error-context';
        contextElement.textContent = `Location: ${context}`;
        errorElement.appendChild(contextElement);
    }
    
    // Add close button for recoverable errors
    if (isRecoverable) {
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Dismiss';
        closeButton.onclick = () => errorElement.remove();
        errorElement.appendChild(closeButton);
    } else {
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Reset Application';
        resetButton.onclick = () => window.location.reload();
        errorElement.appendChild(resetButton);
    }
    
    // Add to container
    errorContainer.appendChild(errorElement);
    
    // Auto-remove recoverable errors after delay
    if (isRecoverable) {
        setTimeout(() => {
            if (errorElement.parentNode === errorContainer) {
                errorElement.remove();
            }
        }, 10000); // 10 seconds
    }
}
```

## Error Recovery Strategies

### Retry Mechanisms

For operations that might fail temporarily:

```javascript
/**
 * Retries a function multiple times before giving up
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise} Promise resolving to the function result
 */
async function retryOperation(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Log the retry attempt
            Logger.warning(
                `Operation failed (attempt ${attempt}/${maxRetries})`, 
                { error: error.message }
            );
            
            if (attempt < maxRetries) {
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
                // Exponential backoff
                delay = delay * 2;
            }
        }
    }
    
    // If we get here, all retries failed
    throw new Error(`All ${maxRetries} retry attempts failed. Last error: ${lastError.message}`);
}
```

### Partial Results

When some poles fail to process:

```javascript
/**
 * Processes all poles and collects errors for reporting
 * @param {Array} poles - Array of poles to process
 * @param {Function} processFn - Function to process each pole
 * @returns {Object} Object with results and errors
 */
function processWithErrorCollection(poles, processFn) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < poles.length; i++) {
        try {
            const result = processFn(poles[i], i);
            results.push(result);
        } catch (error) {
            // Log the error
            Logger.error(
                `Error processing pole ${poles[i].poleNumber || i}`, 
                { error: error.message }
            );
            
            // Store error with pole info for reporting
            errors.push({
                poleIndex: i,
                poleNumber: poles[i].poleNumber || `Unknown (${i})`,
                error: error.message
            });
            
            // Add a placeholder in results
            results.push({
                poleNumber: poles[i].poleNumber || `Unknown (${i})`,
                error: true,
                errorMessage: error.message
            });
        }
    }
    
    return { results, errors };
}

/**
 * Display a summary of processing errors to the user
 * @param {Array} errors - Array of error objects
 */
function showErrorSummary(errors) {
    if (!errors || errors.length === 0) return;
    
    const totalErrors = errors.length;
    
    // Create summary message
    let message = `${totalErrors} pole${totalErrors > 1 ? 's' : ''} could not be fully processed:`;
    
    const errorList = document.createElement('ul');
    errors.slice(0, 5).forEach(error => {
        const item = document.createElement('li');
        item.textContent = `Pole ${error.poleNumber}: ${error.error}`;
        errorList.appendChild(item);
    });
    
    if (totalErrors > 5) {
        const item = document.createElement('li');
        item.textContent = `...and ${totalErrors - 5} more`;
        errorList.appendChild(item);
    }
    
    // Show with custom UI or use our showUserError function
    showUserError(message, 'Report Generation', true, errorList);
}
```

## Best Practices

1. **Validation First**: Validate inputs before processing
2. **Try-Catch Blocks**: Wrap all data access and transformations in try-catch
3. **Default Values**: Always provide sensible defaults
4. **Progressive Enhancement**: Try primary data source first, then fall back to alternatives
5. **Meaningful Messages**: Provide detailed error messages that help with debugging
6. **User-Friendly Errors**: Translate technical errors into user-friendly messages
7. **Partial Results**: Return partial results when possible instead of failing completely
8. **Logging Strategy**: Use different log levels for different types of errors
9. **Error Recovery**: Provide clear paths to recover from errors when possible

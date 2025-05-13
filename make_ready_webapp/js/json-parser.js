/**
 * Utility functions for JSON parsing and safe property access
 */

/**
 * Safely retrieves a nested value from an object using a path array.
 * Returns defaultValue if the path doesn't exist.
 *
 * @param {Object} obj - The object to extract the value from
 * @param {Array} path - Array of property names/indices forming the path to the value
 * @param {*} defaultValue - Value to return if the path doesn't exist
 * @returns {*} - The value at the specified path or the default value
 */
function getNestedValue(obj, path, defaultValue = null) {
    if (!obj || typeof obj !== 'object' || !path || !Array.isArray(path)) {
        return defaultValue;
    }

    return path.reduce((current, key) => {
        if (current && typeof current === 'object' && key in current) {
            return current[key];
        }
        return undefined;
    }, obj) ?? defaultValue;
}

/**
 * Converts a value from meters to feet
 * 
 * @param {number} meters - Value in meters
 * @returns {number} - Value in feet
 */
function convertMetersToFeet(meters) {
    if (typeof meters !== 'number' || isNaN(meters)) {
        return null;
    }
    return meters * 3.28084;
}

/**
 * Extracts a pole definition from clientData based on a reference ID
 * 
 * @param {string} poleRefId - The pole reference ID
 * @param {Array} clientDataPoles - Array of pole definitions from clientData
 * @returns {Object|null} - The pole definition object or null if not found
 */
function getPoleDefinitionByRef(poleRefId, clientDataPoles) {
    if (!poleRefId || !clientDataPoles || !Array.isArray(clientDataPoles)) {
        return null;
    }
    
    return clientDataPoles.find(pole => {
        // Check if pole has aliases and if any alias matches the refId
        if (pole.aliases && Array.isArray(pole.aliases)) {
            return pole.aliases.some(alias => alias.id === poleRefId);
        }
        return false;
    }) || null;
}

/**
 * Formats a value for Excel output, handling special cases
 * 
 * @param {*} value - Value to format
 * @param {string} valueType - Type of value ('number', 'percentage', 'string', 'boolean')
 * @returns {string|number} - Formatted value
 */
function formatExcelValue(value, valueType = 'string') {
    if (value === null || value === undefined) {
        return 'N/A';
    }
    
    switch (valueType) {
        case 'number':
            const num = parseFloat(value);
            return isNaN(num) ? 'N/A' : num;
        
        case 'percentage':
            const pct = parseFloat(value);
            if (isNaN(pct)) return 'N/A';
            // If value is already in percentage (e.g., 75 instead of 0.75)
            return pct > 1 ? `${pct.toFixed(1)}%` : `${(pct * 100).toFixed(1)}%`;
            
        case 'boolean':
            return value ? 'YES' : 'NO';
            
        default:
            return value.toString() || 'N/A';
    }
}

/**
 * Checks if a company name matches Charter/Spectrum
 * 
 * @param {string} companyName - Company name to check
 * @returns {boolean} - True if the company is Charter/Spectrum
 */
function isCharterSpectrum(companyName) {
    if (!companyName) return false;
    
    const name = companyName.toString().toLowerCase();
    const charterAliases = ['charter', 'spectrum', 'charter/spectrum', 'charter communications'];
    
    return charterAliases.some(alias => name.includes(alias.toLowerCase()));
}

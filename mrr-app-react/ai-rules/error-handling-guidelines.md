# Error Handling Guidelines

## 1. Null/Missing Data Handling
```javascript
// Standard pattern for missing data
function extractValue(data, path, defaultValue = "N/A") {
    /**
     * Standard template for data extraction with error handling
     * @param {Object} data - The source data object
     * @param {Array} path - Array of keys to traverse
     * @param {*} defaultValue - Default value if path not found
     * @returns {*} Extracted value or default
     */
    try {
        const value = getNestedValue(data, path);
        if (value === null || value === undefined || value === "") {
            return defaultValue;
        }
        return value;
    } catch (error) {
        console.error(`Error extracting ${path.join('.')}:`, error);
        return "ERROR";
    }
}
```

## 2. Unit Conversion Error Handling
```javascript
function safeConvertHeight(value, fromUnit, toUnit) {
    /**
     * Safely convert height units with error handling
     * @param {number|string} value - Value to convert
     * @param {string} fromUnit - Source unit
     * @param {string} toUnit - Target unit
     * @returns {number|null} Converted value or null
     */
    try {
        if (value === null || value === undefined || value === "") {
            return null;
        }
        
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        
        if (isNaN(numericValue)) {
            return null;
        }
        
        if (fromUnit === "METRE" && toUnit === "FEET") {
            return Math.round(numericValue * 3.28084 * 100) / 100; // Round to 2 decimals
        }
        // Add other conversions as needed
        return numericValue;
    } catch (error) {
        console.error(`Error converting ${value} from ${fromUnit} to ${toUnit}:`, error);
        return null;
    }
}
```

## 3. Excel Column Default Values
- **Operation Number**: Leave blank (manual entry)
- **Attachment Action**: "N/A" if cannot determine
- **Pole Owner**: "Unknown"
- **Pole #**: Current SPIDA label (should always exist)
- **Pole Structure**: "Unknown" if either species or class missing
- **Proposed Riser/Guy**: "NO" if not found
- **PLA**: "--" if not calculated
- **Heights**: "--" if no measurement available
- **Descriptions**: "N/A" if not found

## 4. JSON Structure Errors
- Handle cases where expected arrays are missing
- Check for empty objects before iteration
- Validate data types before processing
- Log unexpected data structures for review

## 5. Correlation Errors
```javascript
function handleUnmatchedPoles(unmatchedSpidaPoles, spidaData) {
    /**
     * Handle poles that couldn't be correlated
     * @param {Array} unmatchedSpidaPoles - List of SPIDA pole labels
     * @param {Object} spidaData - SPIDA JSON data
     * @returns {Array} Rows with only SPIDA data
     */
    const rows = [];
    for (const poleLabel of unmatchedSpidaPoles) {
        // Create row with only SPIDA data
        // Fill Katapult columns with "N/A" or "--"
        const row = {
            'Pole #': poleLabel,
            // ... fill other SPIDA columns
            // ... mark Katapult columns as "N/A"
        };
        rows.push(row);
    }
    return rows;
}
```

## 6. File Processing Errors
```javascript
// File reading with error handling
async function processFiles(spidaFile, katapultFile) {
    try {
        // Validate file types
        if (!spidaFile.name.endsWith('.json')) {
            throw new Error('SPIDAcalc file must be JSON');
        }
        if (!katapultFile.name.endsWith('.json')) {
            throw new Error('Katapult file must be JSON');
        }
        
        // Read and parse files
        const spidaData = await readJSONFile(spidaFile);
        const katapultData = await readJSONFile(katapultFile);
        
        return { spidaData, katapultData };
    } catch (error) {
        // Show user-friendly error message
        showError('Error processing files: ' + error.message);
        // Log detailed error for debugging
        console.error('File processing error:', error);
        throw error;
    }
}
```

## 7. User Interface Error Handling
```javascript
// Show error messages to user
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Show progress during processing
function updateProgress(message, percentage) {
    const progressDiv = document.getElementById('progress');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    
    progressDiv.style.display = 'block';
    progressBar.style.width = percentage + '%';
    progressText.textContent = message;
}
```
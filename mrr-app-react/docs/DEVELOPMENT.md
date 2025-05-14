# Development Guide

This guide outlines the development workflow, best practices, and coding standards for the Make-Ready Report Generator project.

## Development Workflow

### Phase-by-Phase Approach

The project follows a structured phase-by-phase development approach:

1. **Phase 0: Project Setup**
   - Create directory structure
   - Set up HTML, CSS, and JavaScript files
   - Initialize version control

2. **Phase 1: Basic Web Interface**
   - Create UI layout and styling
   - Implement file upload capabilities (form and drag-drop)
   - Add status indicators

3. **Phase 2: File Handling**
   - Implement file reading with FileReader API
   - Create JSON parsing utilities
   - Add validation functions

4. **Phase 3: Pole Correlation Logic**
   - Develop pole identifier extraction
   - Create matching algorithm with multiple strategies
   - Implement confidence scoring (0-1)
   - Handle unmatched poles

5. **Phase 4: Data Extraction**
   - Implement extraction functions for each report column
   - Follow field implementation order (simple to complex)
   - Add unit conversion utilities

6. **Phase 5: Report Generation**
   - Create main report generation orchestration
   - Implement column formatting
   - Process correlated poles

7. **Phase 6: Excel Creation**
   - Integrate SheetJS library
   - Format workbook and cells
   - Add download functionality

8. **Phase 7: Testing and Documentation**
   - Test with sample data
   - Document code with JSDoc comments
   - Create user documentation

## Coding Standards

### JavaScript Organization

```
/make_ready_webapp
  /js
    main.js            # Application entry point and UI controller
    file-handler.js    # File reading and validation
    json-parser.js     # JSON utilities and safe navigation
    spida-parser.js    # SPIDAcalc data extraction
    katapult-parser.js # Katapult data extraction
    report-generator.js # Orchestrates report creation including pole correlation
    excel-writer.js    # Excel file generation
  /css
    styles.css         # Application styling
  index.html           # Main application page
  /sample_data         # Test data files
```

### Key Functions and Organization

Core utility functions should be reusable across the application:

```javascript
// Safe navigation utility - place in json-parser.js
function getNestedValue(obj, path, defaultValue = null) {
    return path.reduce((current, key) => {
        if (current && typeof current === 'object' && key in current) {
            return current[key];
        }
        return undefined;
    }, obj) ?? defaultValue;
}

// Unit conversion - place in json-parser.js
function metresToFeet(metres) {
    return metres * 3.28084;
}
```

### Error Handling

Always wrap data access in try-catch blocks and provide meaningful defaults:

```javascript
function extractValue(data, path, defaultValue = "N/A") {
    try {
        const value = getNestedValue(data, path);
        if (value === null || value === undefined) {
            return defaultValue;
        }
        return value;
    } catch (error) {
        console.error(`Error extracting ${path.join('.')}:`, error);
        return "ERROR";
    }
}
```

### Documentation Standards

Use JSDoc comments for all functions:

```javascript
/**
 * Extracts the pole owner from SPIDAcalc data
 * @param {Object} spidaData - The SPIDAcalc JSON data
 * @param {Object} location - The specific location object
 * @returns {string} The pole owner name or "Unknown" if not found
 */
function getSpidaPoleOwner(spidaData, location) {
    // Implementation...
}
```

## Testing Approach

### Test-Driven Development

1. **Test each function immediately after implementation**
   - Use browser console for quick tests
   - Create small test cases with known inputs/outputs

2. **Testing Strategy**
   - Start with unit tests for individual extraction functions
   - Progress to integration tests for data correlation
   - End with full report generation tests

3. **Test with Sample Data**
   - Use real-world JSON samples
   - Test edge cases (missing data, unusual values)
   - Verify Excel output matches expected format

### Debugging Tips

- Add debug logging with clear labels
- Use the browser developer console extensively
- Create visual feedback in the UI for long operations
- Test individual JSON paths before combining into complex functions

## Implementation Order for Data Extraction

For most consistent progress, implement extraction functions in this order:

1. **Simple Fields** (Columns C, D)
   - Pole Owner and Pole Number
   - Focus on direct path extraction

2. **Lookup-Dependent Fields** (Column E)
   - Pole Structure (requires client data lookups)
   - Practice reference resolution

3. **Decision Logic Fields** (Column B)
   - Attachment Action (Install/Transfer/Existing)
   - Implements complex business logic

4. **Proposed Features** (Column F parts)
   - Riser/Guy/PLA fields
   - Requires design comparison

5. **Analysis Fields** (Column G)
   - Construction Grade
   - From analysis case details

6. **Midspan Fields** (Columns H-J)
   - Lowest heights calculations
   - Span identification

7. **Attachment Fields** (Columns K-O)
   - Target attachment identification and properties
   - Existing vs proposed heights

## Version Control Best Practices

- Commit after completing each function
- Use descriptive commit messages referencing the checklist
- Create feature branches for complex functionality
- Example commit message: "PHASE4: Implement getSpidaPoleOwner - Column C complete"

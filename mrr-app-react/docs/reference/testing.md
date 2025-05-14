# Testing Guide

This document outlines testing strategies and requirements for the Make-Ready Report Generator. Thorough testing is essential for ensuring the reliability and accuracy of the data extraction and report generation process.

## Testing Approach

### 1. Layered Testing Strategy

The Make-Ready Report Generator should be tested in layers:

1. **Unit Testing** - Test individual functions in isolation
2. **Integration Testing** - Test interactions between components
3. **End-to-End Testing** - Test the full application workflow
4. **Manual Testing** - Verify specific outputs against expected values

### 2. Test Data Requirements

#### Sample File Requirements

The test suite should include:

- **SPIDAcalc Sample Files**:
  - At least one complete SPIDAcalc file with multiple poles
  - A file with various pole types and attachments
  - A file with both "Measured" and "Recommended" designs

- **Katapult Sample Files**:
  - At least one complete Katapult file with multiple nodes
  - A file with various trace types and companies
  - A file with photo measurement data

- **Edge Case Files**:
  - A minimal SPIDAcalc file with just essential structures
  - A SPIDAcalc file lacking certain optional fields
  - A Katapult file with unusual attribute patterns

#### Test Data Preparation

For effective testing, prepare the following:

1. **Golden Files**: Create known-good output Excel files for comparison
2. **Test Fixtures**: Extract portions of real files for focused testing
3. **Synthetic Data**: Create custom small test files for edge cases

## Unit Testing

### 1. Utility Functions

Test all utility functions that handle core operations:

```javascript
// Test the safe navigation utility
describe('getNestedValue', () => {
    test('should return the value when the full path exists', () => {
        const obj = { a: { b: { c: 'value' } } };
        expect(getNestedValue(obj, ['a', 'b', 'c'], 'default')).toBe('value');
    });
    
    test('should return the default value when the path does not exist', () => {
        const obj = { a: { } };
        expect(getNestedValue(obj, ['a', 'b', 'c'], 'default')).toBe('default');
    });
    
    test('should handle null/undefined objects', () => {
        expect(getNestedValue(null, ['a'], 'default')).toBe('default');
        expect(getNestedValue(undefined, ['a'], 'default')).toBe('default');
    });
});

// Test unit conversions
describe('metresToFeet', () => {
    test('should convert metres to feet correctly', () => {
        expect(metresToFeet(1)).toBeCloseTo(3.28084);
        expect(metresToFeet(10)).toBeCloseTo(32.8084);
    });
    
    test('should handle zero', () => {
        expect(metresToFeet(0)).toBe(0);
    });
    
    test('should handle negative values', () => {
        expect(metresToFeet(-1)).toBeCloseTo(-3.28084);
    });
});

// Test parsing functions
describe('parseImperialHeight', () => {
    test('should parse feet only', () => {
        expect(parseImperialHeight("10'")).toBe(10);
    });
    
    test('should parse feet and inches', () => {
        expect(parseImperialHeight("10' 6\"")).toBeCloseTo(10.5);
    });
    
    test('should handle invalid formats', () => {
        expect(parseImperialHeight("invalid")).toBe(null);
    });
});
```

### 2. Data Extraction Functions

Test extraction functions for different data fields:

```javascript
describe('getSpidaPoleOwner', () => {
    test('should extract pole owner from SPIDAcalc data', () => {
        const location = { 
            designs: [{ 
                layerType: "Measured", 
                structure: { 
                    pole: { 
                        owner: { 
                            id: "CPS Energy" 
                        } 
                    } 
                } 
            }] 
        };
        
        expect(getSpidaPoleOwner({}, location)).toBe("CPS Energy");
    });
    
    test('should return "Unknown" when owner not found', () => {
        const location = { 
            designs: [{ 
                layerType: "Measured", 
                structure: { 
                    pole: {} 
                } 
            }] 
        };
        
        expect(getSpidaPoleOwner({}, location)).toBe("Unknown");
    });
});

describe('getKatapultPoleNumber', () => {
    test('should extract pole number from PoleNumber attribute', () => {
        const node = {
            attributes: {
                PoleNumber: {
                    '-Imported': 'P123'
                }
            }
        };
        
        expect(getKatapultPoleNumber(node)).toBe('P123');
    });
    
    test('should use fallback attributes in correct order', () => {
        const node = {
            attributes: {
                electric_pole_tag: {
                    assessment: 'P456'
                }
            }
        };
        
        expect(getKatapultPoleNumber(node)).toBe('P456');
    });
});
```

### 3. Business Logic Functions

Test functions that implement complex business rules:

```javascript
describe('determineAttachmentAction', () => {
    test('should return "I" for a new installation', () => {
        // Setup test data with Charter attachment in recommended but not measured
        const spidaData = { /* ... */ };
        const katapultData = { /* ... */ };
        const correlatedPole = {
            spidaLocation: { /* ... */ },
            katapultNode: null
        };
        
        expect(determineAttachmentAction(spidaData, katapultData, correlatedPole)).toBe('I');
    });
    
    test('should return "R" for a relocation', () => {
        // Setup test data with different heights for the same attachment
        const spidaData = { /* ... */ };
        const katapultData = { /* ... */ };
        const correlatedPole = {
            spidaLocation: { /* ... */ },
            katapultNode: null
        };
        
        expect(determineAttachmentAction(spidaData, katapultData, correlatedPole)).toBe('R');
    });
    
    test('should return "E" for an existing attachment with no changes', () => {
        // Setup test data with same attachment in both designs
        const spidaData = { /* ... */ };
        const katapultData = { /* ... */ };
        const correlatedPole = {
            spidaLocation: { /* ... */ },
            katapultNode: null
        };
        
        expect(determineAttachmentAction(spidaData, katapultData, correlatedPole)).toBe('E');
    });
});
```

## Integration Testing

### 1. Pole Correlation Testing

Test the correlation between SPIDAcalc and Katapult data:

```javascript
describe('correlatePoles', () => {
    test('should match poles with exact pole numbers', () => {
        const spidaLocations = [
            { label: 'P123' },
            { label: 'P456' }
        ];
        
        const katapultNodes = [
            { 
                id: 'node1',
                attributes: { 
                    PoleNumber: { '-Imported': 'P123' } 
                } 
            },
            { 
                id: 'node2',
                attributes: { 
                    PoleNumber: { '-Imported': 'P789' } 
                } 
            }
        ];
        
        const result = correlatePoles(spidaLocations, katapultNodes);
        
        expect(result.correlatedPoles).toHaveLength(3); // 1 matched, 2 unmatched
        expect(result.correlatedPoles[0].spidaLocation).toBe(spidaLocations[0]);
        expect(result.correlatedPoles[0].katapultNode).toBe(katapultNodes[0]);
    });
    
    test('should handle poles that only exist in one source', () => {
        const spidaLocations = [
            { label: 'P123' }
        ];
        
        const katapultNodes = [
            { 
                id: 'node1',
                attributes: { 
                    PoleNumber: { '-Imported': 'P456' } 
                } 
            }
        ];
        
        const result = correlatePoles(spidaLocations, katapultNodes);
        
        expect(result.correlatedPoles).toHaveLength(2);
        expect(result.correlatedPoles[0].spidaLocation).toBe(spidaLocations[0]);
        expect(result.correlatedPoles[0].katapultNode).toBeNull();
        expect(result.correlatedPoles[1].spidaLocation).toBeNull();
        expect(result.correlatedPoles[1].katapultNode).toBe(katapultNodes[0]);
    });
    
    test('should handle normalized matching', () => {
        const spidaLocations = [
            { label: 'P-123' }
        ];
        
        const katapultNodes = [
            { 
                id: 'node1',
                attributes: { 
                    PoleNumber: { '-Imported': 'P123' } 
                } 
            }
        ];
        
        const result = correlatePoles(spidaLocations, katapultNodes);
        
        expect(result.correlatedPoles[0].spidaLocation).toBe(spidaLocations[0]);
        expect(result.correlatedPoles[0].katapultNode).toBe(katapultNodes[0]);
        expect(result.correlatedPoles[0].confidence).toBeGreaterThan(0.5);
    });
});
```

### 2. Data Integration Testing

Test the integration of data from multiple sources:

```javascript
describe('generateReportData', () => {
    test('should generate report data for correlated poles', () => {
        const spidaData = { /* ... */ };
        const katapultData = { /* ... */ };
        const correlatedPoles = [
            {
                spidaLocation: { /* ... */ },
                katapultNode: { /* ... */ }
            }
        ];
        
        const result = generateReportData(spidaData, katapultData, correlatedPoles);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('poleNumber');
        expect(result[0]).toHaveProperty('poleOwner');
        expect(result[0]).toHaveProperty('attachmentAction');
        // Check other expected properties
    });
    
    test('should handle poles from SPIDAcalc only', () => {
        const spidaData = { /* ... */ };
        const katapultData = { /* ... */ };
        const correlatedPoles = [
            {
                spidaLocation: { /* ... */ },
                katapultNode: null
            }
        ];
        
        const result = generateReportData(spidaData, katapultData, correlatedPoles);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('source', 'SPIDAcalc');
    });
    
    test('should handle poles from Katapult only', () => {
        const spidaData = { /* ... */ };
        const katapultData = { /* ... */ };
        const correlatedPoles = [
            {
                spidaLocation: null,
                katapultNode: { /* ... */ }
            }
        ];
        
        const result = generateReportData(spidaData, katapultData, correlatedPoles);
        
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('source', 'Katapult');
    });
});
```

## End-to-End Testing

### 1. File Upload and Processing

Test the full application workflow:

```javascript
describe('End-to-End File Processing', () => {
    beforeEach(() => {
        // Setup a clean test environment
        document.body.innerHTML = `
            <input type="file" id="spida-file" />
            <input type="file" id="katapult-file" />
            <button id="generate-report">Generate Report</button>
            <div id="status"></div>
        `;
        
        // Initialize the application
        initApp();
    });
    
    test('should process SPIDAcalc file only', async () => {
        // Mock file upload event
        const mockFile = new File(
            [JSON.stringify(sampleSpidaData)], 
            'spida_sample.json', 
            { type: 'application/json' }
        );
        
        const fileInput = document.getElementById('spida-file');
        Object.defineProperty(fileInput, 'files', {
            value: [mockFile]
        });
        
        // Trigger the file change event
        fileInput.dispatchEvent(new Event('change'));
        
        // Wait for file processing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Click generate button
        document.getElementById('generate-report').click();
        
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check for expected status update
        const status = document.getElementById('status').textContent;
        expect(status).toContain('Report generated');
        
        // Verify Excel download was triggered
        expect(mockExcelGeneration).toHaveBeenCalled();
    });
    
    // Add more tests for Katapult-only and both files
});
```

### 2. Excel Output Testing

Test the generated Excel file structure:

```javascript
describe('Excel Generation', () => {
    test('should create Excel file with correct structure', () => {
        const reportData = [
            {
                operationNumber: 1,
                attachmentAction: 'I',
                poleOwner: 'CPS Energy',
                poleNumber: 'P123',
                poleStructure: 'Southern Pine 3',
                // Other fields...
            }
        ];
        
        const workbook = createExcelWorkbook(reportData);
        
        // Verify worksheet exists
        expect(workbook.SheetNames).toContain('Make-Ready Report');
        
        // Get the worksheet
        const worksheet = workbook.Sheets['Make-Ready Report'];
        
        // Check headers
        expect(worksheet.A1.v).toBe('Operation Number');
        expect(worksheet.B1.v).toBe('Attachment Action');
        
        // Check data row
        expect(worksheet.A2.v).toBe(1);
        expect(worksheet.B2.v).toBe('I');
        expect(worksheet.C2.v).toBe('CPS Energy');
    });
    
    test('should apply correct formatting to cells', () => {
        const reportData = [
            {
                // Data with various types
            }
        ];
        
        const workbook = createExcelWorkbook(reportData);
        const worksheet = workbook.Sheets['Make-Ready Report'];
        
        // Check number formatting
        expect(worksheet.F2.z).toBe('0.00"%"'); // Percentage
        expect(worksheet.H2.z).toBe('0.00\''); // Height in feet
    });
});
```

## Manual Testing Scenarios

### 1. Field-by-Field Verification

For each field in the report, verify the extracted data against the source:

1. **Pole Owner (Column C)**
   - Check SPIDAcalc: `project.leads[*].locations[*].designs[?(@.layerType=="Measured")].structure.pole.owner.id`
   - Check Katapult: `nodes.[node_id].attributes.pole_owner.*`
   - Verify the correct source is prioritized

2. **Pole Structure (Column E)**
   - Check SPIDAcalc: Find the pole definition in `clientData.poles` and verify `species` and `classOfPole`
   - Verify the formatting (space between species and class)

3. **Attachment Action (Column B)**
   - For "I" (Install): Verify the attachment exists only in the Recommended design or is marked proposed in Katapult
   - For "R" (Relocate): Verify the attachment exists in both designs with different heights
   - For "E" (Existing): Verify no changes between designs

### 2. Error Case Testing

Manually test error conditions:

1. **Missing Data**
   - Upload a SPIDAcalc file with missing `clientData` section
   - Verify appropriate error messages and fallback behavior

2. **Malformed Files**
   - Upload an invalid JSON file
   - Upload a valid JSON that's not SPIDAcalc/Katapult
   - Verify clear error messages

3. **Edge Cases**
   - Test with a pole having multiple attachments from the same company
   - Test with extreme height values
   - Test with missing height values

### 3. User Interface Testing

Verify the UI components:

1. **File Upload**
   - Test drag-and-drop functionality
   - Test selecting files via the file input
   - Verify upload status indicators

2. **Report Generation**
   - Verify progress indicators during processing
   - Verify summary statistics after completion
   - Test the download functionality

## Performance Testing

### 1. Large File Handling

Test with increasingly large files:

1. **Medium Size**
   - SPIDAcalc file with ~50 poles
   - Katapult file with ~50 nodes
   - Measure processing time and memory usage

2. **Large Size**
   - SPIDAcalc file with ~200 poles
   - Katapult file with ~200 nodes
   - Verify the application remains responsive

3. **Very Large**
   - SPIDAcalc file with ~500+ poles
   - Katapult file with ~500+ nodes
   - Test incremental processing strategies if needed

### 2. Resource Usage

Monitor application resources:

1. **Memory Usage**
   - Use browser developer tools to monitor memory
   - Look for memory leaks during repeated operations

2. **CPU Usage**
   - Monitor CPU usage during processing
   - Identify bottlenecks in data processing

## Automated Testing Setup

### Browser-Based Testing

Setup automated tests using Jest and Puppeteer:

```javascript
// Example setup for browser-based testing
const puppeteer = require('puppeteer');

let browser;
let page;

beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
    await page.goto('http://localhost:8080');
});

afterAll(async () => {
    await browser.close();
});

test('file upload and processing workflow', async () => {
    // Locate file inputs and upload files
    const spidaFileInput = await page.$('#spida-file');
    await spidaFileInput.uploadFile('./test/samples/spida_sample.json');
    
    // Wait for file processing indicator
    await page.waitForSelector('#spida-status.success');
    
    // Click generate button
    await page.click('#generate-report');
    
    // Wait for processing to complete
    await page.waitForSelector('#status.success');
    
    // Check for download trigger
    const downloadStarted = await page.evaluate(() => {
        return document.querySelector('#download-link').getAttribute('href') !== null;
    });
    
    expect(downloadStarted).toBe(true);
});
```

### Testing Schedule

Implement the following testing schedule:

1. **Unit Tests**: Run automatically on every code change
2. **Integration Tests**: Run before commits
3. **End-to-End Tests**: Run before pull requests and releases
4. **Manual Testing**: Perform before major releases
5. **Performance Testing**: Run monthly or when significant changes are made

## Test Documentation

For each test suite, document:

1. **Purpose**: What aspect of the application is being tested
2. **Preconditions**: Required setup and conditions
3. **Test Steps**: Detailed steps to perform the test
4. **Expected Results**: What should happen if the code is working correctly
5. **Actual Results**: What actually happened during the test
6. **Pass/Fail**: Whether the test passed or failed

Maintain a test report that includes:

1. Test coverage metrics
2. Pass/fail rates
3. Performance metrics
4. Identified issues and their status

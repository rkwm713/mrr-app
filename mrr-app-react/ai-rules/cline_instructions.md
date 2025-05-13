# Custom Instructions for Cline - Make-Ready Report Generator

## Project Context
You are working on a Make-Ready Report Generator that converts SPIDAcalc and Katapult JSON files into Excel reports. The project can be implemented as:

1. **React Web Application** (preferred) - User-friendly interface
2. **Python Script** (alternative) - For batch processing or large files

**CRITICAL: No backend server or user authentication required.**

## Technology Stack Options

### Option 1: React Web App
- React for UI components
- JavaScript for data processing
- SheetJS for Excel generation
- File API for file uploads

### Option 2: Python CLI
- Python for data processing
- pandas + openpyxl for Excel generation
- argparse for command line interface

## Implementation Guidelines

### React Implementation Pattern:
```jsx
// Component structure
const MakeReadyGenerator = () => {
    const [files, setFiles] = useState({ spida: null, katapult: null });
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);
    
    const handleFileUpload = async (spidaFile, katapultFile) => {
        try {
            setProgress(10);
            const spidaData = await readJSONFile(spidaFile);
            setProgress(30);
            const katapultData = await readJSONFile(katapultFile);
            setProgress(50);
            
            const report = generateReport(spidaData, katapultData);
            setProgress(90);
            
            generateExcel(report);
            setProgress(100);
        } catch (err) {
            setError(err.message);
        }
    };
    
    return (
        // JSX components
    );
};
```

### Python Implementation Pattern:
```python
#!/usr/bin/env python3
"""Make-Ready Report Generator"""
import json
import pandas as pd
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--spida', required=True)
    parser.add_argument('--katapult', required=True)
    parser.add_argument('--output', default='make-ready-report.xlsx')
    
    args = parser.parse_args()
    
    # Load and process data
    spida_data = load_json(args.spida)
    katapult_data = load_json(args.katapult)
    
    # Generate report
    report_data = generate_report(spida_data, katapult_data)
    
    # Save to Excel
    df = pd.DataFrame(report_data)
    df.to_excel(args.output, index=False)
```

## Data Processing (Same Logic for Both)

### Safe JSON Navigation:
```javascript
// JavaScript version
const getNestedValue = (obj, path, defaultValue = null) => {
    return path.reduce((current, key) => {
        return current?.[key];
    }, obj) ?? defaultValue;
};
```

```python
# Python version
def get_nested_value(data, path, default=None):
    for key in path:
        if isinstance(data, dict) and key in data:
            data = data[key]
        else:
            return default
    return data
```

## Phase-Specific Instructions

### When Starting:
1. Ask which implementation approach to use (React web app or Python script)
2. Review the project plan and adapt it to chosen technology
3. Set up the basic project structure based on choice

### During Development:
- Follow the same column-by-column approach regardless of technology
- Test each parser function with sample data
- Maintain the same error handling patterns
- Reference mapping_doc.md for data extraction rules

### Error Handling Patterns:

#### React/JavaScript:
```jsx
const handleError = (error, context) => {
    console.error(`Error in ${context}:`, error);
    setError(`Failed to ${context}: ${error.message}`);
};
```

#### Python:
```python
def handle_error(error, context):
    logging.error(f"Error in {context}: {error}")
    print(f"Failed to {context}: {error}")
    return None
```

## Key Decision Points

**Choose React Web App when:**
- Need user-friendly interface
- Want drag-and-drop file uploads
- Files are reasonably sized (< 100MB)
- Want to share via web link

**Choose Python Script when:**
- Processing very large files
- Need batch processing capabilities
- Integrating with existing Python workflows
- Complex mathematical calculations needed

**Can implement both** for different use cases!

## Important Notes
- Always handle missing data gracefully
- Use the same business logic from mapping_doc.md
- Test with actual sample files frequently
- Implement one Excel column at a time
- Follow the project checklist regardless of technology

Ask me which approach to start with, and I'll adapt my instructions accordingly.

## Communication Guidelines
1. **Always specify** which file you're modifying
2. **Explain the logic** behind complex data extraction
3. **Note any assumptions** made about data structure
4. **Ask for clarification** if mapping requirements are unclear
5. **Report progress** by referencing checklist items

## Phase-Specific Instructions

### Phase 0-1: Setup & HTML Interface
- Create the basic HTML structure with file inputs
- Set up CSS for styling
- Create JavaScript module structure

### Phase 2-3: File Handling & Correlation
- Implement File API for reading JSON files
- Parse and validate JSON format
- Test pole correlation logic with sample files

### Phase 4: Data Extraction (Most Critical)
- Implement ONE column at a time
- Test each parser function independently
- Always refer to the mapping document for exact paths
- Handle both SPIDA and Katapult sources where applicable

### Phase 5-6: Report Generation & UI
- Integrate parser functions into report generator
- Implement Excel creation with SheetJS
- Add progress indicators and error feedback
- Test the complete workflow

### Phase 7: Testing & Documentation
- Add comprehensive error handling
- Write clear documentation
- Test with all available sample data

## Error Handling Priorities
1. **Never crash** - always return graceful defaults
2. **Log errors** but show user-friendly messages
3. **Validate data** before processing
4. **Handle missing sections** of JSON gracefully

## Common JavaScript Patterns

### File Reading
```javascript
// Read JSON file asynchronously
async function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                resolve(json);
            } catch (error) {
                reject(new Error('Invalid JSON: ' + error.message));
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
```

### Safe Data Access
```javascript
// Utility for safe object property access
function getNestedValue(obj, path, defaultValue = null) {
    return path.reduce((current, key) => {
        if (current && typeof current === 'object' && key in current) {
            return current[key];
        }
        return undefined;
    }, obj) ?? defaultValue;
}
```

### Excel Generation
```javascript
// Generate and download Excel file
function downloadExcel(data, filename = 'make-ready-report.xlsx') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Make-Ready Report");
    XLSX.writeFile(wb, filename);
}
```

## Questions to Ask When Stuck
1. "What does the mapping document say about this field?"
2. "Have I properly tested this with sample data?"
3. "Am I following the correct JSON path as documented?"
4. "Is there a specific business rule I'm missing?"
5. "Should I implement a fallback data source?"
6. "How should this behave when data is missing?"

Remember: The goal is creating a robust client-side tool that reliably generates Excel reports from JSON data. Prioritize reliability and user experience over speed of development.
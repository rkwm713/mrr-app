# Development Workflow for Make-Ready Report Generator

## Phase-Based Development

Follow this prescribed development order for the Make-Ready Report Generator:

1. **Phase 0: Project Setup**
   - Set up directory structure and base files
   - Configure development environment
   - Create utility functions and core infrastructure

2. **Phase 1: Basic Web Interface**
   - Implement file upload interface
   - Create drag-and-drop functionality
   - Build status indicators and feedback mechanisms

3. **Phase 2: File Handling & Parsing**
   - Implement JSON file reading and validation
   - Create core utility functions for data access
   - Test with sample data files

4. **Phase 3: Pole Correlation**
   - Implement pole matching algorithms
   - Create confidence scoring system
   - Handle unmatched poles from either source

5. **Phase 4: Data Extraction**
   - Implement field extraction functions in recommended order:
     1. Simple fields (Pole Owner, Pole Number)
     2. Lookup-dependent fields (Pole Structure)
     3. Complex business logic fields (Attachment Action)
     4. Proposed features fields (Riser/Guy/PLA)
     5. Measurement fields (Heights, Midspans)

6. **Phase 5: Report Generation**
   - Implement Excel generation
   - Format data correctly for each column
   - Add metadata and styling

7. **Phase 6: Testing & Refinement**
   - Test with multiple real-world data files
   - Performance optimization
   - Edge case handling

## Testing Requirements

- **Unit Testing**
  - Test all utility functions individually
  - Verify each field extraction function works correctly
  - Test with sample fragments of real JSON data

- **Integration Testing**
  - Test pole correlation with challenging data sets
  - Verify data integration across sources
  - Test each Excel column generates correctly

- **End-to-End Testing**
  - Test complete workflow from file upload to Excel generation
  - Verify with known good output files (golden master)
  - Test with progressively larger data sets for performance

## Code Organization

Maintain the following file structure:

```
make_ready_webapp/
├── index.html               # Main application entry point
├── css/
│   └── styles.css           # Application styling
├── js/
│   ├── main.js              # Application orchestration
│   ├── file-handler.js      # File reading and validation
│   ├── json-parser.js       # JSON utilities and safe navigation
│   ├── spida-parser.js      # SPIDAcalc data extraction
│   ├── katapult-parser.js   # Katapult data extraction
│   ├── report-generator.js  # Report generation and pole correlation
│   └── excel-writer.js      # Excel file generation
└── sample_data/             # Test data files
```

## Best Practices

- **Progressive Enhancement**
  - Make each function work with minimal data first
  - Add support for edge cases incrementally
  - Test each function after implementation

- **Error Handling**
  - Add comprehensive error handling to all functions
  - Provide fallback values for all data points
  - Log detailed diagnostics for troubleshooting

- **Performance**
  - Create index structures for large datasets
  - Use caching for repeated lookups
  - Process data incrementally for large files

- **User Experience**
  - Provide clear feedback at each stage
  - Show progress indicators for long operations
  - Present errors in a user-friendly manner

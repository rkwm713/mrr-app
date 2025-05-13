# Make-Ready Report Generator

A web-based application that generates Make-Ready Reports by processing SPIDAcalc and Katapult JSON files.

## Overview

This application allows users to upload SPIDAcalc and Katapult JSON files, correlates poles between the two data sources, extracts relevant information according to the specified mapping, and generates an Excel report with the required columns.

## Features

- File drag-and-drop and selection interface
- SPIDAcalc and Katapult JSON parsing
- Pole correlation between data sources
- Extraction of pole data including:
  - Pole owner and number information
  - Pole structure (species and class)
  - Attachment action (Install/Relocate/Existing)
  - Proposed features (riser, guy, PLA)
  - Construction grade of analysis
  - Midspan and attachment height measurements
- Excel report generation and download
- Client-side only implementation (no server needed)

## Technologies Used

- Pure JavaScript (client-side only)
- SheetJS for Excel file generation
- HTML5 File API for file handling
- Modern CSS for styling

## Project Structure

```
make_ready_webapp/
├── index.html                # Main application page
├── js/
│   ├── main.js              # Application entry point
│   ├── file-handler.js      # File reading and validation
│   ├── json-parser.js       # JSON navigation utilities
│   ├── spida-parser.js      # SPIDAcalc specific extraction functions
│   ├── katapult-parser.js   # Katapult specific extraction functions
│   ├── report-generator.js  # Main report generation logic
│   └── excel-writer.js      # Excel file creation using SheetJS
├── css/
│   └── styles.css           # Application styling
└── README.md                # Project documentation
```

## How to Use

1. Open `index.html` in a web browser (Google Chrome recommended)
2. Upload SPIDAcalc and Katapult JSON files using the file inputs or by dragging and dropping
3. Click the "Generate Report" button once both files are loaded
4. Wait for processing to complete
5. Click "Download Excel Report" to save the generated Excel file

## Data Handling

- SPIDAcalc "Measured" designs represent current state
- SPIDAcalc "Recommended" designs represent proposed state
- Units are automatically converted (e.g., meters to feet)
- Katapult dynamic attribute keys ("-Imported", "one", "auto_calced") are handled
- Charter/Spectrum attachments are prioritized in the report
- Missing data is handled gracefully with "N/A", "Unknown", or "--" placeholders

## Development

This application is designed as a client-side only implementation, with no backend server requirements. It runs entirely in the browser, using the browser's built-in capabilities to read and process files and generate Excel outputs.

## License

Copyright © 2025

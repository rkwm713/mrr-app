# General Project Rules

## 1. Project Context Understanding
- Always maintain context that this is a **SPIDAcalc/Katapult JSON to Excel Make-Ready Report** generator
- The primary goal is creating an automated Excel report from two JSON sources
- **CRITICAL**: No backend server with user authentication - can be client-side or local tool
- Prefer client-side solutions but Python scripts are acceptable for local processing
- React can be used for the UI when it improves user experience

## 2. Code Style and Standards
- Use Python 3.7+ compatible syntax
- Follow PEP 8 style guidelines
- Use meaningful variable names (e.g., `spida_pole_label` not `pol_lbl`)
- Comment complex logic, especially data extraction paths
- Use type hints where helpful for clarity

## 3. File Organization Options

### Option A: React + Web (Preferred)
```
make_ready_webapp/
├── public/
│   └── index.html              # Main HTML file
├── src/
│   ├── components/            # React components
│   │   ├── FileUpload.js
│   │   ├── ProgressBar.js
│   │   └── ReportView.js
│   ├── utils/                 # Utility functions
│   │   ├── jsonParser.js
│   │   ├── spidaParser.js
│   │   ├── katapultParser.js
│   │   └── excelGenerator.js
│   ├── App.js                 # Main App component
│   └── index.js               # Entry point
├── ai-rules/                  # AI instruction files
├── sample_data/               # Test JSON files
└── package.json               # Dependencies (React, SheetJS, etc.)
```

### Option B: Python Script (Local alternative)
```
make_ready_generator/
├── main.py                    # CLI entry point
├── parsers/
│   ├── __init__.py
│   ├── spida_parser.py
│   ├── katapult_parser.py
│   └── excel_generator.py
├── utils/
│   ├── __init__.py
│   └── json_utils.py
├── requirements.txt           # pandas, openpyxl
├── ai-rules/                  # AI instruction files
└── sample_data/               # Test JSON files
```

## 4. Technology Choices
- **Preferred**: React for UI, JavaScript for data processing
- **Alternative**: Python for local script processing
- **Excel Generation**: 
  - Web: SheetJS (xlsx) library
  - Python: pandas + openpyxl
- **File Handling**:
  - Web: File API for drag-and-drop uploads
  - Python: Command line arguments or file paths

## 5. Development Approach
- Choose the approach that best fits your workflow needs
- React web app for user-friendly interface
- Python script for batch processing or automation
- Implement one Excel column at a time regardless of technology
- Test each function with sample data before moving on
- Always handle missing data gracefully

## 6. Key Principles
- **Data Source Priority**: Generally SPIDA > Katapult for design data, Katapult > SPIDA for field actions
- **Error Tolerance**: The system should never crash on missing data
- **Unit Conversions**: Always be explicit about units (metres to feet, etc.)
- **Pole Focus**: Each Excel row represents one pole, not one attachment
- **No Authentication**: Avoid any user login or server authentication requirements
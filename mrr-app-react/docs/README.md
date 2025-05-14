# Make-Ready Report Generator

## Overview
The Make-Ready Report Generator is a web-based tool that automates the generation of Make-Ready Reports (MRR) from SPIDAcalc and Katapult JSON data sources. This tool helps utilities, construction companies, and attachment owners streamline the pole attachment process by extracting, correlating, and organizing critical data into standardized Excel reports.

## Purpose
- Eliminate manual data entry between systems
- Ensure consistency in make-ready reporting
- Reduce transcription errors and save time
- Standardize the format of make-ready reports across projects

## Key Features
- Parse and extract data from SPIDAcalc JSON files (pole structural analysis)
- Parse and extract data from Katapult JSON files (field data collection)
- Correlate poles between the two data sources
- Generate standardized Excel reports with key make-ready information
- Handle attachment actions (Install/Transfer/Existing)
- Process proposed risers, guys, and PLA calculations
- Calculate midspan height data

## Quick Start
1. Open the web application in your browser
2. Upload a SPIDAcalc JSON file and/or a Katapult JSON file
3. Click "Generate Report" to process the data
4. Download the resulting Excel report

## Documentation
- [Architecture Overview](ARCHITECTURE.md) - System design and data flow
- [JSON Schemas](JSON_SCHEMAS.md) - Key JSON structures and data formats
- [Mapping Guide](MAPPING_GUIDE.md) - Data mapping specifications
- [Development Guide](DEVELOPMENT.md) - Development workflow and best practices

## Reference
- [Data Extraction](reference/data_extraction.md) - Detailed extraction methods
- [Error Handling](reference/error_handling.md) - Error handling patterns
- [Testing Guide](reference/testing.md) - Testing requirements and strategies

## Code Examples
Check the [examples](examples/) directory for sample code demonstrating key operations.

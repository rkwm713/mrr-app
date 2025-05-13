# Testing Guide for Make-Ready Report Generator

This guide provides instructions for testing the Make-Ready Report Generator application with the included sample data.

## Prerequisites

- Google Chrome browser (recommended)
- No server required - this is a client-side only application

## Testing Steps

1. **Open the Application**
   - Navigate to the `make_ready_webapp` directory
   - Open `index.html` directly in your browser

2. **Test File Upload**
   - Click on "SPIDAcalc JSON" input and select `sample_data/sample_spida.json`
   - Click on "Katapult JSON" input and select `sample_data/sample_katapult.json`
   - Both inputs should show a "Selected:" message with a checkmark

3. **Test Drag and Drop**
   - Try dragging both sample files from your file explorer onto the drop zone
   - The application should recognize and process the files

4. **Generate Report**
   - After both files are loaded, the "Generate Report" button should be enabled
   - Click the button to start processing
   - You should see a progress bar advance through several steps
   - Processing should complete with a success message

5. **Download and View Results**
   - Once processing is complete, a "Download Excel Report" button should be enabled
   - Click the button to download the Excel file
   - Open the downloaded file to verify the following:
     - It contains data for the pole(s) in the sample files
     - The columns are correctly formatted
     - The data matches the expected values from both sources

6. **Test Reset Functionality**
   - Click the "Reset" button to clear all data and return to the initial state
   - The file inputs and buttons should reset to their initial state

## Expected Results

- The sample data includes 2 poles (PL410620 and PL410621)
- The first pole should show:
  - Pole Owner: CPS Energy
  - Pole Structure: Southern Pine 3
  - A Charter/Spectrum attachment with "I" (Install) action due to the proposed riser
  - Proposed riser: YES
  - Proposed guy: YES
  - PLA value of approximately 65%
  - Construction Grade: C

## Troubleshooting

- If files don't load properly, check browser console for JavaScript errors
- If the Excel file isn't generated, verify SheetJS is loading correctly
- For any unexpected data values, review the relevant parser function for that column

## Future Improvements

- Better handling of unmatched poles
- More detailed rendering of midspan information
- Advanced styling of the Excel output
- Preview of report data before download

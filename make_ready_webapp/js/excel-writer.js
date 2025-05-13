/**
 * Excel file generation using SheetJS library
 */

/**
 * Creates an Excel file from the report data and stores it for download
 * 
 * @param {Array} reportData - Array of report row objects
 */
function createExcelFile(reportData) {
    try {
        console.log('Creating Excel file with', reportData.length, 'rows');
        
        // Create a new worksheet
        const ws = XLSX.utils.json_to_sheet(reportData);
        
        // Set column widths
        const wscols = EXCEL_COLUMNS.map(col => ({ wch: col.width }));
        ws['!cols'] = wscols;
        
        // Apply header styling (would require a full version of the library for advanced styling)
        
        // Create a new workbook and append the worksheet
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Make-Ready Report');
        
        // Store workbook for later download
        window.workbook = wb;
        
        return true;
    } catch (error) {
        console.error('Error creating Excel file:', error);
        throw new Error('Failed to create Excel file');
    }
}

/**
 * Downloads the generated Excel file
 */
function downloadExcelFile() {
    try {
        if (!window.workbook) {
            throw new Error('No Excel file has been generated yet');
        }
        
        // Generate a filename with current date
        const now = new Date();
        const formattedDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        const filename = `Make-Ready-Report_${formattedDate}.xlsx`;
        
        // Write the file and trigger download
        XLSX.writeFile(window.workbook, filename);
        
        return true;
    } catch (error) {
        console.error('Error downloading Excel file:', error);
        
        // Show an error message to the user
        document.getElementById('statusMessage').textContent = 
            `Error downloading Excel file: ${error.message}`;
        document.getElementById('statusMessage').style.color = 'red';
        
        return false;
    }
}

Client-Side Architecture Rules
1. File Handling

Use HTML5 File API for file uploads
Read files as text using FileReader API
Parse JSON using native JSON.parse()
Handle large files efficiently (avoid blocking UI)

javascript// Standard file reading pattern
function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target.result);
                resolve(json);
            } catch (error) {
                reject(new Error('Invalid JSON file'));
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
}
2. Excel Generation

Use SheetJS (xlsx) library for Excel file creation
Generate and download files entirely in browser
No server needed for file processing

javascript// Standard Excel generation pattern
function generateExcel(data) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Make-Ready Report");
    
    // Download the file
    XLSX.writeFile(wb, "make-ready-report.xlsx");
}
3. UI Patterns

Use drag-and-drop for file uploads
Show progress indicators during processing
Display results in browser before download
Handle errors gracefully with user feedback

4. Performance Considerations

Use Web Workers for heavy JSON processing if needed
Implement pagination for large reports
Lazy load data when possible
Memory management for large files

5. Browser Compatibility

Target ES6+ browsers
Use polyfills only if necessary
Test in major browsers (Chrome, Firefox, Safari, Edge)
Provide graceful degradation for older browsers

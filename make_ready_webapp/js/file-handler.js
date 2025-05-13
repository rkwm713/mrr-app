/**
 * File handling functionality for processing JSON files
 */

// Global state for loaded files
const fileState = {
    spidaFile: null,
    katapultFile: null,
    spidaData: null,
    katapultData: null
};

/**
 * Initializes file upload handlers and drag/drop functionality
 */
function initFileHandlers() {
    // Get file input elements
    const spidaFileInput = document.getElementById('spidaFile');
    const katapultFileInput = document.getElementById('katapultFile');
    const dropZone = document.getElementById('dropZone');
    const generateBtn = document.getElementById('generateBtn');
    
    // Set up file input change handlers
    spidaFileInput.addEventListener('change', (event) => {
        handleFileSelection(event.target.files[0], 'spida');
    });
    
    katapultFileInput.addEventListener('change', (event) => {
        handleFileSelection(event.target.files[0], 'katapult');
    });
    
    // Set up drag and drop functionality
    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        dropZone.classList.add('drag-over');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });
    
    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        dropZone.classList.remove('drag-over');
        
        // Process dropped files
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            // Look for JSON files
            Array.from(files).forEach(file => {
                if (file.name.toLowerCase().includes('spida')) {
                    handleFileSelection(file, 'spida');
                    spidaFileInput.files = createFileList([file]);
                } else if (file.name.toLowerCase().includes('katapult')) {
                    handleFileSelection(file, 'katapult');
                    katapultFileInput.files = createFileList([file]);
                } else if (files.length === 2) {
                    // If exactly 2 files dropped and not determined by name
                    if (!fileState.spidaFile) {
                        handleFileSelection(files[0], 'spida');
                        spidaFileInput.files = createFileList([files[0]]);
                    }
                    if (!fileState.katapultFile) {
                        handleFileSelection(files[1], 'katapult');
                        katapultFileInput.files = createFileList([files[1]]);
                    }
                }
            });
        }
    });
    
    // Set up generate button handler
    generateBtn.addEventListener('click', () => {
        if (fileState.spidaData && fileState.katapultData) {
            startProcessing();
        }
    });
}

/**
 * Handles file selection for SPIDAcalc or Katapult files
 * 
 * @param {File} file - The selected file
 * @param {string} type - Either 'spida' or 'katapult'
 */
function handleFileSelection(file, type) {
    if (!file) return;
    
    const statusElement = document.getElementById(`${type}FileStatus`);
    
    // Check if file is JSON
    if (!file.name.toLowerCase().endsWith('.json')) {
        statusElement.textContent = 'Error: Not a JSON file';
        statusElement.style.color = 'red';
        return;
    }
    
    // Update status
    statusElement.textContent = `Selected: ${file.name}`;
    statusElement.style.color = '#333';
    
    // Store the file
    fileState[`${type}File`] = file;
    
    // Read the file
    readJSONFile(file)
        .then(data => {
            // Store parsed data
            fileState[`${type}Data`] = data;
            statusElement.textContent += ' ✓';
            checkFilesReady();
        })
        .catch(error => {
            console.error(`Error reading ${type} file:`, error);
            statusElement.textContent = `Error: ${error.message}`;
            statusElement.style.color = 'red';
            fileState[`${type}File`] = null;
            fileState[`${type}Data`] = null;
        });
}

/**
 * Checks if both files are ready and enables the generate button
 */
function checkFilesReady() {
    const generateBtn = document.getElementById('generateBtn');
    generateBtn.disabled = !(fileState.spidaData && fileState.katapultData);
}

/**
 * Reads a JSON file and returns parsed content
 * 
 * @param {File} file - The file to read
 * @returns {Promise<Object>} - Promise resolving to the parsed JSON
 */
function readJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                resolve(json);
            } catch (error) {
                reject(new Error('Invalid JSON format'));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Error reading file'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Helper function to create a FileList-like object for file inputs
 * 
 * @param {Array<File>} files - Array of File objects
 * @returns {Object} - FileList-like object
 */
function createFileList(files) {
    const dt = new DataTransfer();
    files.forEach(file => dt.items.add(file));
    return dt.files;
}

/**
 * Starts the processing workflow
 */
function startProcessing() {
    // Show processing status
    const processingStatus = document.getElementById('processingStatus');
    const statusMessage = document.getElementById('statusMessage');
    const progressBar = document.getElementById('progressBar');
    
    processingStatus.style.display = 'block';
    statusMessage.textContent = 'Processing files...';
    progressBar.style.width = '10%';
    
    // Disable the generate button during processing
    document.getElementById('generateBtn').disabled = true;
    
    setTimeout(() => {
        try {
            // Basic validation
            validateSpidaFile(fileState.spidaData);
            validateKatapultFile(fileState.katapultData);
            
            // Update progress
            progressBar.style.width = '30%';
            statusMessage.textContent = 'Correlating poles...';
            
            setTimeout(() => {
                // Correlate poles between the two data sources
                const correlationResult = correlatePoles(fileState.spidaData, fileState.katapultData);
                
                // Update progress
                progressBar.style.width = '60%';
                statusMessage.textContent = 'Generating report...';
                
                setTimeout(() => {
                    // Generate the report data
                    const reportData = generateReport(
                        fileState.spidaData, 
                        fileState.katapultData,
                        correlationResult.correlatedPoles,
                        correlationResult.unmatchedSpidaPoles
                    );
                    
                    // Update progress
                    progressBar.style.width = '90%';
                    statusMessage.textContent = 'Preparing Excel file...';
                    
                    setTimeout(() => {
                        // Create Excel file
                        createExcelFile(reportData);
                        
                        // Complete the progress
                        progressBar.style.width = '100%';
                        statusMessage.textContent = 'Report generated successfully!';
                        
                        // Show results and enable download button
                        displayResults(correlationResult, reportData.length);
                        
                        // Re-enable generate button
                        document.getElementById('generateBtn').disabled = false;
                    }, 500);
                }, 500);
            }, 500);
        } catch (error) {
            // Handle errors
            console.error('Processing error:', error);
            statusMessage.textContent = `Error: ${error.message}`;
            statusMessage.style.color = 'red';
            
            // Re-enable generate button
            document.getElementById('generateBtn').disabled = false;
        }
    }, 500);
}

/**
 * Basic validation for SPIDAcalc file
 * 
 * @param {Object} spidaData - The parsed SPIDAcalc JSON
 * @throws {Error} If validation fails
 */
function validateSpidaFile(spidaData) {
    if (!spidaData) {
        throw new Error('SPIDAcalc data is null or undefined');
    }
    
    // Check for required top-level properties
    if (!spidaData.leads || !Array.isArray(spidaData.leads) || spidaData.leads.length === 0) {
        throw new Error('SPIDAcalc file does not contain any leads data');
    }
    
    if (!spidaData.clientData) {
        throw new Error('SPIDAcalc file does not contain client data');
    }
    
    // Check for locations
    const hasLocations = spidaData.leads.some(lead => 
        lead.locations && Array.isArray(lead.locations) && lead.locations.length > 0
    );
    
    if (!hasLocations) {
        throw new Error('SPIDAcalc file does not contain any locations');
    }
}

/**
 * Basic validation for Katapult file
 * 
 * @param {Object} katapultData - The parsed Katapult JSON
 * @throws {Error} If validation fails
 */
function validateKatapultFile(katapultData) {
    if (!katapultData) {
        throw new Error('Katapult data is null or undefined');
    }
    
    // Check for required top-level properties
    if (!katapultData.nodes || Object.keys(katapultData.nodes).length === 0) {
        throw new Error('Katapult file does not contain any nodes data');
    }
}

/**
 * Displays results summary and shows the download button
 * 
 * @param {Object} correlationResult - Result from pole correlation
 * @param {number} totalRows - Total number of rows in the report
 */
function displayResults(correlationResult, totalRows) {
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsSummary = document.getElementById('resultsSummary');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Build summary HTML
    const summaryHTML = `
        <p><strong>Report Generation Complete</strong></p>
        <ul>
            <li>Total poles processed: ${correlationResult.correlatedPoles.length + correlationResult.unmatchedSpidaPoles.length}</li>
            <li>Matched poles: ${correlationResult.correlatedPoles.length}</li>
            <li>Unmatched SPIDAcalc poles: ${correlationResult.unmatchedSpidaPoles.length}</li>
            <li>Total report rows: ${totalRows}</li>
        </ul>
    `;
    
    // Update UI
    resultsSummary.innerHTML = summaryHTML;
    resultsContainer.style.display = 'block';
    downloadBtn.disabled = false;
    
    // Set up download button
    downloadBtn.addEventListener('click', () => {
        // This will be implemented in excel-writer.js
        downloadExcelFile();
    });
}

// Initialize file handlers when document is ready
document.addEventListener('DOMContentLoaded', initFileHandlers);

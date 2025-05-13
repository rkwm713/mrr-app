/**
 * Main JavaScript file - application entry point
 */

// Application state
const appState = {
    processingComplete: false,
    currentStep: 0,
    totalSteps: 4 // File validation, Pole correlation, Report generation, Excel creation
};

/**
 * Initializes the application when the document is ready
 */
function initApp() {
    console.log('Make-Ready Report Generator initialized');
    
    // File handlers are initialized in file-handler.js
    
    // Add any additional initialization here
    setupUI();
}

/**
 * Sets up UI elements and event handlers
 */
function setupUI() {
    // Set up event handler for download button
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleDownload);
    }
    
    // Add button to reset the app
    const resetBtnContainer = document.createElement('div');
    resetBtnContainer.className = 'reset-container';
    resetBtnContainer.style.marginTop = '20px';
    resetBtnContainer.style.textAlign = 'center';
    
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.style.backgroundColor = '#e74c3c';
    resetBtn.addEventListener('click', resetApp);
    
    resetBtnContainer.appendChild(resetBtn);
    
    // Add to DOM after the results container
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer && resultsContainer.parentNode) {
        resultsContainer.parentNode.insertBefore(resetBtnContainer, resultsContainer.nextSibling);
    }
}

/**
 * Handles download button click
 */
function handleDownload() {
    if (appState.processingComplete) {
        downloadExcelFile();
    }
}

/**
 * Updates the progress bar and status message
 * 
 * @param {number} percent - Percentage complete (0-100)
 * @param {string} message - Status message to display
 */
function updateProgress(percent, message) {
    const progressBar = document.getElementById('progressBar');
    const statusMessage = document.getElementById('statusMessage');
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
    
    if (statusMessage) {
        statusMessage.textContent = message;
    }
}

/**
 * Updates the app state to mark processing as complete
 */
function markProcessingComplete() {
    appState.processingComplete = true;
    appState.currentStep = appState.totalSteps;
    updateProgress(100, 'Processing complete. Ready for download.');
}

/**
 * Resets the application to initial state
 */
function resetApp() {
    // Reset state
    appState.processingComplete = false;
    appState.currentStep = 0;
    
    // Reset file inputs
    const spidaFileInput = document.getElementById('spidaFile');
    const katapultFileInput = document.getElementById('katapultFile');
    if (spidaFileInput) spidaFileInput.value = '';
    if (katapultFileInput) katapultFileInput.value = '';
    
    // Reset file status text
    const spidaFileStatus = document.getElementById('spidaFileStatus');
    const katapultFileStatus = document.getElementById('katapultFileStatus');
    if (spidaFileStatus) spidaFileStatus.textContent = 'No file selected';
    if (katapultFileStatus) katapultFileStatus.textContent = 'No file selected';
    
    // Reset UI elements
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const processingStatus = document.getElementById('processingStatus');
    const resultsContainer = document.getElementById('resultsSummary');
    
    if (generateBtn) generateBtn.disabled = true;
    if (downloadBtn) downloadBtn.disabled = true;
    if (processingStatus) processingStatus.style.display = 'none';
    if (resultsContainer) {
        resultsContainer.parentElement.style.display = 'none';
        resultsContainer.innerHTML = '';
    }
    
    // Reset file state in file-handler.js
    if (typeof fileState !== 'undefined') {
        fileState.spidaFile = null;
        fileState.katapultFile = null;
        fileState.spidaData = null;
        fileState.katapultData = null;
    }
    
    // Clear generated report data
    if (typeof generatedReportData !== 'undefined') {
        generatedReportData = [];
    }
    
    // Clear workbook
    if (window.workbook) {
        window.workbook = null;
    }
    
    console.log('Application reset');
}

// Initialize the app when the document is ready
document.addEventListener('DOMContentLoaded', initApp);

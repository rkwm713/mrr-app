import { useState } from 'react';
import type { WorkBook } from 'xlsx';
import './App.css';
import FileUpload from './components/FileUpload';
import ProcessingStatus from './components/ProcessingStatus';
import ResultsDisplay from './components/ResultsDisplay';
import TestRiserDetection from './components/TestRiserDetection';
import TestCorrelation from './components/TestCorrelation';
import { readJSONFile, validateSpidaFile, validateKatapultFile, createExcelFile, downloadExcelFile } from './utils/fileUtils';
import type { SpidaData, KatapultData, ReportData, CorrelationResult } from './types/DataTypes';
import { generateReport } from './utils/report/reportGenerator';
import { EnhancedPoleCorrelator } from './utils/correlationUtils';


function App() {
  // Application state
  const [appState, setAppState] = useState({
    processingComplete: false,
    isProcessing: false,
    currentStep: 0,
    totalSteps: 4, // File validation, Pole correlation, Report generation, Excel creation
    statusMessage: '',
    progressPercent: 0
  });

  // File state
  const [fileState, setFileState] = useState<{
    spidaFile: File | null;
    katapultFile: File | null;
    spidaData: SpidaData | null;
    katapultData: KatapultData | null;
  }>({
    spidaFile: null,
    katapultFile: null,
    spidaData: null,
    katapultData: null
  });

  // Report data state
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [resultsSummary, setResultsSummary] = useState({
    totalPoles: 0,
    matchedPoles: 0,
    unmatchedSpidaPoles: 0,
    katapultOnlyPoles: 0,
    totalRows: 0
  });
  const [workbook, setWorkbook] = useState<WorkBook | null>(null);

  // Handle file selection
  const handleFilesSelected = (spidaFile: File | null, katapultFile: File | null) => {
    setFileState(prev => ({
      ...prev,
      spidaFile,
      katapultFile,
      spidaData: null,
      katapultData: null
    }));
    
    // Reset state when files change
    setAppState(prev => ({
      ...prev,
      processingComplete: false,
      isProcessing: false,
      currentStep: 0,
      statusMessage: '',
      progressPercent: 0
    }));
    setReportData([]);
    setWorkbook(null);
  };

  // We've removed the automatic processing useEffect to allow the user to click the Generate Report button

  // Read both JSON files
  const readFiles = async (spidaFile: File, katapultFile: File) => {
    try {
      // Set processing state
      setAppState(prev => ({
        ...prev,
        isProcessing: true,
        statusMessage: 'Reading files...',
        progressPercent: 5
      }));

      // Read files in parallel
      const [spidaData, katapultData] = await Promise.all([
        readJSONFile<SpidaData>(spidaFile),
        readJSONFile<KatapultData>(katapultFile)
      ]);

      // Update file state with parsed data
      setFileState(prev => ({
        ...prev,
        spidaData,
        katapultData
      }));

      // Continue processing
      processFiles(spidaData, katapultData);
    } catch (error) {
      handleError(error);
    }
  };

  // Process files after reading
  const processFiles = async (spidaData: SpidaData, katapultData: KatapultData) => {
    try {
      // Update progress
      setAppState(prev => ({
        ...prev,
        currentStep: 1,
        statusMessage: 'Validating files...',
        progressPercent: 20
      }));

      // Validate files
      validateSpidaFile(spidaData);
      validateKatapultFile(katapultData);

      // Update progress
      setAppState(prev => ({
        ...prev,
        currentStep: 2,
        statusMessage: 'Correlating poles...',
        progressPercent: 40
      }));

      // Use the EnhancedPoleCorrelator for more sophisticated pole matching
      const correlationResult: CorrelationResult = EnhancedPoleCorrelator.correlatePoles(spidaData, katapultData);

      // Update progress
      setAppState(prev => ({
        ...prev,
        currentStep: 3,
        statusMessage: 'Generating report...',
        progressPercent: 70
      }));

      // Use the actual report generation implementation
      const generatedReport = generateReport(correlationResult, spidaData);

      // Set report data
      setReportData(generatedReport);

      // Update progress
      setAppState(prev => ({
        ...prev,
        currentStep: 4,
        statusMessage: 'Creating Excel file...',
        progressPercent: 90
      }));

      // Create Excel file
      const wb = createExcelFile(generatedReport);
      setWorkbook(wb);

      // Set summary
      const summary = {
        totalPoles: correlationResult.correlatedPoles.length + 
                    correlationResult.unmatchedSpidaPoles.length + 
                    correlationResult.katapultOnlyPoles.length,
        matchedPoles: correlationResult.correlatedPoles.length,
        unmatchedSpidaPoles: correlationResult.unmatchedSpidaPoles.length,
        katapultOnlyPoles: correlationResult.katapultOnlyPoles.length,
        totalRows: generatedReport.length
      };
      setResultsSummary(summary);

      // Complete processing
      setAppState(prev => ({
        ...prev,
        processingComplete: true,
        isProcessing: false,
        statusMessage: 'Processing complete. Ready for download.',
        progressPercent: 100
      }));
    } catch (error) {
      handleError(error);
    }
  };

  // Handle errors during processing
  const handleError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    
    setAppState(prev => ({
      ...prev,
      isProcessing: false,
      statusMessage: `Error: ${message}`,
      progressPercent: 0
    }));
    
    console.error('Processing error:', error);
  };

  // Handle download button click
  const handleDownload = () => {
    if (workbook) {
      downloadExcelFile(workbook);
    }
  };

  // Reset the application
  const handleReset = () => {
    setFileState({
      spidaFile: null,
      katapultFile: null,
      spidaData: null,
      katapultData: null
    });
    
    setAppState({
      processingComplete: false,
      isProcessing: false,
      currentStep: 0,
      totalSteps: 4,
      statusMessage: '',
      progressPercent: 0
    });
    
    setReportData([]);
    setWorkbook(null);
  };

  // Real implementations are now used instead of simulation functions

  return (
    <div className="container">
      <header>
        <h1>Make-Ready Report Generator</h1>
        <p>Upload SPIDAcalc and Katapult JSON files to generate a make-ready report</p>
      </header>

      <main>
        {/* File Upload Component */}
        <FileUpload 
          onFilesSelected={handleFilesSelected}
          isProcessing={appState.isProcessing}
        />
        
        {/* Processing Status */}
        <ProcessingStatus 
          isVisible={appState.isProcessing || (appState.statusMessage.includes('Error'))}
          percent={appState.progressPercent}
          message={appState.statusMessage}
        />
        
        {/* Generate Button */}
        {fileState.spidaFile && fileState.katapultFile && !appState.isProcessing && !appState.processingComplete && (
          <button 
            id="generateBtn" 
            onClick={() => readFiles(fileState.spidaFile!, fileState.katapultFile!)}
            disabled={!fileState.spidaFile || !fileState.katapultFile || appState.isProcessing}
            className="generate-button"
          >
            Generate Report
          </button>
        )}
        
        {/* Results Display */}
        <ResultsDisplay 
          isVisible={appState.processingComplete}
          reportData={reportData}
          summary={resultsSummary}
          onDownload={handleDownload}
          isDownloadEnabled={appState.processingComplete && Boolean(workbook)}
        />
        
        {/* Test Components */}
        <div className="test-components">
          <TestRiserDetection 
            spidaData={fileState.spidaData}
            katapultData={fileState.katapultData}
            isVisible={!appState.isProcessing && Boolean(fileState.spidaData) && Boolean(fileState.katapultData)}
          />
          
          <TestCorrelation
            isVisible={!appState.isProcessing}
          />
        </div>
        
        {/* Reset Button */}
        {(appState.processingComplete || appState.statusMessage.includes('Error')) && (
          <div className="reset-container">
            <button 
              onClick={handleReset}
              className="reset-button"
            >
              Reset
            </button>
          </div>
        )}
      </main>
      
      <footer>
        <p>Make-Ready Report Generator v1.0 | &copy; 2025</p>
      </footer>
    </div>
  );
}

export default App;

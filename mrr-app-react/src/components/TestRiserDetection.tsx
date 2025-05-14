import { useState } from 'react';
import { testRiserDetection } from '../utils/report/tests/riserDetectionTest';
import type { SpidaData } from '../types/DataTypes';

interface TestRiserDetectionProps {
  spidaData: SpidaData | null;
  katapultData: Record<string, unknown> | null;
  isVisible: boolean;
}

/**
 * Component to test riser detection logic
 */
const TestRiserDetection = ({ spidaData, katapultData, isVisible }: TestRiserDetectionProps) => {
  const [testResults, setTestResults] = useState<string | null>(null);
  const [isTestRunning, setIsTestRunning] = useState(false);

  if (!isVisible) {
    return null;
  }

  const handleRunTest = () => {
    if (!spidaData || !katapultData) {
      setTestResults('Error: Missing data. Please load SPIDA and Katapult files first.');
      return;
    }

    setIsTestRunning(true);
    setTestResults(null);

    try {
      // Run the test
      const results = testRiserDetection(spidaData, katapultData);
      setTestResults(results);
    } catch (error) {
      setTestResults(`Error running tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTestRunning(false);
    }
  };

  const handleClearResults = () => {
    setTestResults(null);
  };

  return (
    <div className="test-container">
      <h3>Test Charter Riser Detection</h3>
      <div className="test-buttons">
        <button 
          onClick={handleRunTest}
          disabled={isTestRunning || !spidaData || !katapultData}
          className="test-button"
        >
          {isTestRunning ? 'Running Test...' : 'Run Riser Detection Test'}
        </button>
        {testResults && (
          <button 
            onClick={handleClearResults}
            className="clear-button"
          >
            Clear Results
          </button>
        )}
      </div>

      {testResults && (
        <div className="test-results">
          <h4>Test Results:</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{testResults}</pre>
          
          <h4>Debugging Tips:</h4>
          <ul>
            <li>Look for "Found SPIDA Charter riser with direct match on owner.id" or "Found SPIDA Charter riser with flexible name matching" in console logs.</li>
            <li>Look for "Found Charter riser with Add action in equipment inventory attachment" in console logs.</li>
            <li>Check if SPIDAcalc detection is looking for Recommended Design with both layer type AND label.</li>
            <li>Check if Katapult detection is checking equipment inventory attachments correctly.</li>
          </ul>
        </div>
      )}

      {/* Styles moved to App.css */}
    </div>
  );
};

export default TestRiserDetection;

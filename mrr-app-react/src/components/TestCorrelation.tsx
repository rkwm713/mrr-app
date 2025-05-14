import { useState } from 'react';
import { testEnhancedPoleCorrelation } from '../utils/report/tests/correlationTest';

/**
 * Component for testing the enhanced pole correlation
 */
function TestCorrelation({ isVisible = false }) {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = () => {
    setIsRunning(true);
    setTestResults([]);

    // Create a console logger to capture output
    const logs: string[] = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalConsoleLog(...args);
    };

    // Run the test
    try {
      testEnhancedPoleCorrelation();
      setTestResults(logs);
    } catch (error) {
      setTestResults([
        ...logs,
        '---',
        'Error occurred:',
        error instanceof Error ? error.message : String(error)
      ]);
    } finally {
      // Restore original console.log
      console.log = originalConsoleLog;
      setIsRunning(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="test-container">
      <h3>Enhanced Pole Correlation Test</h3>
      <p>Test the enhanced pole correlation algorithm with sample data.</p>
      
      <button 
        className="test-button"
        onClick={runTest}
        disabled={isRunning}
      >
        {isRunning ? 'Running Test...' : 'Run Correlation Test'}
      </button>
      
      {testResults.length > 0 && (
        <div className="test-results">
          <h4>Test Results:</h4>
          <pre>{testResults.join('\n')}</pre>
        </div>
      )}
    </div>
  );
}

export default TestCorrelation;

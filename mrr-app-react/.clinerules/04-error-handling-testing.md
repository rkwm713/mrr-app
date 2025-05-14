# Error Handling and Testing Guidelines

## Error Handling Philosophy

- **Defensive Programming**
  - Assume all inputs may be missing, malformed, or invalid
  - Validate data before processing, especially from external sources
  - Provide sensible defaults for all extracted values
  - Use try-catch blocks liberally, especially for data access

- **Error Categorization**
  - **Critical Errors**: Prevent application function (file parsing failures, JSON structure issues)
  - **Data Errors**: Affect specific records but allow continued processing (missing fields)
  - **Warning Conditions**: May affect output quality but not correctness (ambiguous correlations)

- **User-Facing Errors**
  - Present clear, non-technical explanations for technical issues
  - Offer actionable solutions when possible
  - Group similar errors to avoid overwhelming users
  - Use visual indicators (color, icons) to communicate severity

## Error Handling Patterns

- **Safe Data Access**
  ```javascript
  function getNestedValue(obj, path, defaultValue = null) {
      try {
          return path.reduce((current, key) => {
              if (current && typeof current === 'object' && key in current) {
                  return current[key];
              }
              return undefined;
          }, obj) ?? defaultValue;
      } catch (error) {
          console.error(`Error accessing path ${path.join('.')}:`, error);
          return defaultValue;
      }
  }
  ```

- **Field Extraction**
  ```javascript
  function extractField(data, extractionFn, defaultValue = "N/A") {
      try {
          const result = extractionFn(data);
          return (result === null || result === undefined) ? defaultValue : result;
      } catch (error) {
          console.error(`Field extraction error:`, error);
          return defaultValue;
      }
  }
  ```

- **Error Reporting**
  ```javascript
  const errorLevels = {
      INFO: 'info',
      WARNING: 'warning',
      ERROR: 'error',
      CRITICAL: 'critical'
  };
  
  function reportError(message, level = errorLevels.ERROR, details = null) {
      const errorObj = {
          message,
          level,
          timestamp: new Date().toISOString(),
          details
      };
      
      console[level === errorLevels.INFO ? 'info' : 
             level === errorLevels.WARNING ? 'warn' : 'error'](message, details);
      
      // UI reporting would go here
      return errorObj;
  }
  ```

## Testing Strategy

- **Unit Testing Every Function**
  - Test all utility functions in isolation
  - Test with valid, invalid, and edge case inputs
  - Verify correct default value handling
  - Test error handling paths explicitly

- **Component Testing**
  - Test individual modules (file parsing, data extraction, etc.)
  - Test integration between dependent modules
  - Verify correct handling of typical and atypical data

- **Data-Driven Testing**
  - Create test suites from sample data files
  - Generate test cases covering all field values
  - Include edge cases based on real-world data

- **Error Case Testing**
  - **File Level**: Malformed JSON, wrong file types, missing sections
  - **Record Level**: Missing fields, unexpected data types, inconsistent values
  - **Integration Level**: Conflicting data between sources

## Test Case Examples

- **Safe Navigation Utility**
  ```javascript
  // Test getNestedValue with valid path
  const obj = { a: { b: { c: 'value' } } };
  assert.equal(getNestedValue(obj, ['a', 'b', 'c'], 'default'), 'value');
  
  // Test with missing path
  assert.equal(getNestedValue(obj, ['a', 'x', 'c'], 'default'), 'default');
  
  // Test with null object
  assert.equal(getNestedValue(null, ['a', 'b'], 'default'), 'default');
  ```

- **Data Extraction Function**
  ```javascript
  // Test with valid data
  const validPole = { /* mock valid pole object */ };
  assert.equal(getPoleOwner(validPole), 'CPS Energy');
  
  // Test with missing data
  const invalidPole = { /* mock incomplete pole object */ };
  assert.equal(getPoleOwner(invalidPole), 'Unknown');
  
  // Test with null
  assert.equal(getPoleOwner(null), 'Unknown');
  ```

- **Pole Correlation**
  ```javascript
  // Test exact match
  const spidaPoles = [{ label: 'P123' }];
  const katapultNodes = [{ attributes: { PoleNumber: { '-Imported': 'P123' } } }];
  const result = correlatePoles(spidaPoles, katapultNodes);
  assert.equal(result.correlatedPoles[0].matchType, 'exact');
  assert.equal(result.correlatedPoles[0].confidence, 1.0);
  
  // Test no match
  const noMatchResult = correlatePoles([{ label: 'P999' }], katapultNodes);
  assert.equal(noMatchResult.correlatedPoles[0].matchType, 'spida_only');
  assert.equal(noMatchResult.stats.spidaOnly, 1);
  ```

## Performance Testing

- Create datasets of increasing size: 10, 50, 100, 500 poles
- Benchmark processing time for each phase:
  - File parsing
  - Pole correlation
  - Data extraction
  - Report generation
- Monitor memory usage during processing
- Track time spent in critical functions

## User Experience Testing

- Verify clear feedback during long operations
- Ensure error messages are helpful and actionable
- Confirm progress indicators update appropriately
- Test with realistic user workflows

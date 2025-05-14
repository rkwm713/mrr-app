# Coding Standards for Make-Ready Report Generator

## JavaScript/HTML/CSS Standards

- **Code Style**
  - Use modern ES6+ JavaScript features for all code
  - Prefer const over let; avoid var entirely
  - Use JSDoc comments for all functions and classes
  - Write self-documenting code with clear variable names
  - Include complete error handling in all functions
  - Handle null/undefined values defensively

- **Best Practices**
  - Use the getNestedValue utility for accessing JSON properties
  - Always provide default values when extracting data
  - Validate all user inputs before processing
  - Avoid hard-coded values; use constants instead
  - Use try-catch blocks for all data access operations
  - Format code output with consistent indentation (2 spaces)

## JSON Data Handling

- **Safe Navigation**
  - Never assume object properties exist
  - Always use safe navigation patterns with defaults
  - Wrap all data access in try-catch blocks

- **Unit Conversion**
  - SPIDAcalc values require metric-to-imperial conversion
  - Convert metres to feet: `value * 3.28084`
  - Parse imperial height strings properly: "25' 6"" → 25.5

- **Client Data References**
  - For SPIDAcalc, lookup elements in clientData using IDs
  - Follow reference chains correctly: component → clientItem.id → clientData

## Error Handling

- **Defensive Programming**
  - Validate inputs at function boundaries
  - Use standardized error handling patterns
  - Provide meaningful default values
  - Ensure graceful degradation when data is missing

- **Error Reporting**
  - Use standardized error messages
  - Include context in error messages (field name, object path)
  - Log errors to console with detailed information
  - Provide user-friendly error messages in UI

## Performance Considerations

- **Optimization**
  - Cache repeated lookups for improved performance
  - Use Maps and Sets for efficient data structures
  - Avoid unnecessary iterations over large data sets
  - Implement incremental processing for large files

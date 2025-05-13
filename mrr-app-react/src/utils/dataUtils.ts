/**
 * Utility functions for data processing in TypeScript
 */

/**
 * Safely retrieves a nested value from an object using a path array.
 * Returns defaultValue if the path doesn't exist.
 *
 * @param obj - The object to extract the value from
 * @param path - Array of property names/indices forming the path to the value
 * @param defaultValue - Value to return if the path doesn't exist
 * @returns The value at the specified path or the default value
 */
export function getNestedValue<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string, any>, 
  path: string[], 
  defaultValue: T | null = null
): T | null {
  if (!obj || typeof obj !== 'object' || !path || !Array.isArray(path)) {
    return defaultValue;
  }

  const result = path.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (current: unknown, key: string) => {
      if (current && typeof current === 'object' && key in (current as object)) {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, 
    obj
  );
  
  return (result !== undefined ? result as T : defaultValue);
}

/**
 * Converts a value from meters to feet
 * 
 * @param meters - Value in meters
 * @returns Value in feet or null if invalid input
 */
export function convertMetersToFeet(meters: number): number | null {
  if (typeof meters !== 'number' || isNaN(meters)) {
    return null;
  }
  return meters * 3.28084;
}

/**
 * Extracts a pole definition from clientData based on a reference ID
 * 
 * @param poleRefId - The pole reference ID
 * @param clientDataPoles - Array of pole definitions from clientData
 * @returns The pole definition object or null if not found
 */
export function getPoleDefinitionByRef(
  poleRefId: string, 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  clientDataPoles: Record<string, unknown>[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, unknown> | null {
  if (!poleRefId || !clientDataPoles || !Array.isArray(clientDataPoles)) {
    return null;
  }
  
  return clientDataPoles.find(pole => {
    // Check if pole has aliases and if any alias matches the refId
    if (
      pole.aliases && 
      Array.isArray((pole as { aliases: unknown[] }).aliases)
    ) {
      return (pole as { aliases: { id: string }[] }).aliases.some(
        (alias: { id: string }) => alias.id === poleRefId
      );
    }
    return false;
  }) || null;
}

/**
 * Formats a value for Excel output, handling special cases
 * 
 * @param value - Value to format
 * @param valueType - Type of value ('number', 'percentage', 'string', 'boolean')
 * @returns Formatted value
 */
export function formatExcelValue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: unknown, 
  valueType: 'number' | 'percentage' | 'string' | 'boolean' = 'string'
): string | number {
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  switch (valueType) {
    case 'number': {
      const num = parseFloat(String(value));
      return isNaN(num) ? 'N/A' : num;
    }
    
    case 'percentage': {
      const pct = parseFloat(String(value));
      if (isNaN(pct)) return 'N/A';
      // If value is already in percentage (e.g., 75 instead of 0.75)
      return pct > 1 ? `${pct.toFixed(1)}%` : `${(pct * 100).toFixed(1)}%`;
    }
        
    case 'boolean':
      return value ? 'YES' : 'NO';
        
    default:
      return String(value) || 'N/A';
  }
}

/**
 * Checks if a company name matches Charter/Spectrum
 * 
 * @param companyName - Company name to check
 * @returns True if the company is Charter/Spectrum
 */
export function isCharterSpectrum(companyName: string | object | null | undefined): boolean {
  if (!companyName) return false;
  
  let nameStr: string;
  
  if (typeof companyName === 'string') {
    nameStr = companyName;
  } else if (typeof companyName === 'object') {
    // Try to convert object to string representation
    try {
      nameStr = JSON.stringify(companyName);
    } catch {
      // If stringification fails, try toString or default to empty string
      nameStr = companyName.toString ? companyName.toString() : '';
    }
  } else {
    // Try to convert to string for any other type
    nameStr = String(companyName);
  }
  
  const name = nameStr.toLowerCase();
  const charterAliases = ['charter', 'spectrum', 'charter/spectrum', 'charter communications'];
  
  return charterAliases.some(alias => name.includes(alias.toLowerCase()));
}

/**
 * Parse an imperial measurement string (feet and inches) to decimal feet
 * 
 * @param imperialString - String like "25' 6""
 * @returns Value in decimal feet or null if parsing fails
 */
export function parseImperialMeasurement(imperialString: string): number | null {
  if (!imperialString || typeof imperialString !== 'string') {
    return null;
  }
  
  // Try to parse feet and inches format like "25' 6""
  const feetInchesMatch = imperialString.match(/(\d+)'?\s*(\d+)?"\s*/);
  if (feetInchesMatch) {
    const feet = parseInt(feetInchesMatch[1], 10) || 0;
    const inches = parseInt(feetInchesMatch[2], 10) || 0;
    return feet + (inches / 12);
  }
  
  // Try to parse as a simple number (might already be in decimal feet)
  const numericValue = parseFloat(imperialString);
  if (!isNaN(numericValue)) {
    return numericValue;
  }
  
  return null;
}

/**
 * Get a standardized default value based on the type
 * 
 * @param type - Type of default value needed
 * @returns The appropriate default value
 */
export function getDefaultValue(
  type: 'missing' | 'unknown' | 'not-applicable' | 'boolean' | 'calculation' | string
): string {
  switch(type) {
    case 'missing': return '—';
    case 'unknown': return 'Unknown';
    case 'not-applicable': return 'N/A';
    case 'boolean': return 'NO';
    case 'calculation': return 'Not Calculated';
    default: return '—';
  }
}

/**
 * Validates that an object meets the minimum requirements for processing
 * 
 * @param obj - The object to validate
 * @param requiredProps - Array of required property names (can use dot notation)
 * @returns True if all required properties exist
 */
export function validateObject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string, unknown>, 
  requiredProps: string[]
): boolean {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  return requiredProps.every(prop => {
    const propPath = prop.split('.');
    return getNestedValue(obj, propPath) !== null;
  });
}

/**
 * Formats a height value for display
 * 
 * @param height - Height value in feet
 * @returns Formatted height string (e.g., "25.5'")
 */
export function formatHeight(height: number): string {
  if (typeof height !== 'number' || isNaN(height)) {
    return 'N/A';
  }
  
  // Format to 1 decimal place and add foot symbol
  return `${height.toFixed(1)}'`;
}

/**
 * Normalize a pole number for better matching between systems
 * 
 * @param poleNumber - The pole number to normalize
 * @returns The normalized pole number
 */
export function normalizePoleNumber(poleNumber: string | null | undefined): string {
  if (!poleNumber) return '';
  
  // Remove common prefixes like "1-" that might differ between systems
  // Convert to uppercase for case-insensitive comparison
  return poleNumber.replace(/^\d+-/, '').toUpperCase();
}

/**
 * Utility functions for correlating poles between SPIDAcalc and Katapult data
 */
import type { SpidaData, KatapultData, CorrelationResult, SpidaLocation } from '../types/DataTypes';
import { getNestedValue, normalizePoleNumber } from './dataUtils';

interface PoleIdentifier {
  id: string;
  normalizedId: string;
  latitude?: number;
  longitude?: number;
  originalData: SpidaLocation | Record<string, unknown>;
  leadIndex?: number; // For SPIDA poles
  locationIndex?: number; // For SPIDA poles
  nodeId?: string; // For Katapult nodes
}

/**
 * Correlates poles between SPIDAcalc and Katapult data
 * 
 * @param spidaData - Parsed SPIDAcalc JSON data
 * @param katapultData - Parsed Katapult JSON data
 * @returns Correlation result containing matched and unmatched poles
 */
export function correlatePoles(spidaData: SpidaData, katapultData: KatapultData): CorrelationResult {
  // Extract pole identifiers from both data sources
  const spidaPoles = extractSpidaPoleIdentifiers(spidaData);
  const katapultPoles = extractKatapultPoleIdentifiers(katapultData);
  
  // Initialize result arrays
  const correlatedPoles: CorrelationResult['correlatedPoles'] = [];
  const unmatchedSpidaPoles: SpidaLocation[] = [];
  const katapultOnlyPoles: Record<string, unknown>[] = [];
  
  // Keep track of which poles have been matched
  const matchedSpidaIndices = new Set<string>();
  const matchedKatapultIds = new Set<string>();
  
  // Stage 1: Match by exact ID
  performExactMatching(
    spidaPoles, 
    katapultPoles, 
    correlatedPoles, 
    matchedSpidaIndices, 
    matchedKatapultIds,
    'exact'
  );
  
  // Stage 2: Match by normalized ID for remaining poles
  const unmatchedSpidaPoleIds = spidaPoles.filter(
    pole => pole.leadIndex !== undefined && 
           pole.locationIndex !== undefined && 
           !matchedSpidaIndices.has(`${pole.leadIndex}-${pole.locationIndex}`)
  );
  
  const unmatchedKatapultPoleIds = katapultPoles.filter(
    pole => pole.nodeId !== undefined && !matchedKatapultIds.has(pole.nodeId)
  );
  
  performNormalizedMatching(
    unmatchedSpidaPoleIds,
    unmatchedKatapultPoleIds,
    correlatedPoles,
    matchedSpidaIndices,
    matchedKatapultIds,
    'partial'
  );
  
  // Stage 3: For any remaining poles, try geolocation-based matching if coordinates are available
  const stillUnmatchedSpidaPoleIds = spidaPoles.filter(
    pole => pole.leadIndex !== undefined && 
           pole.locationIndex !== undefined && 
           !matchedSpidaIndices.has(`${pole.leadIndex}-${pole.locationIndex}`)
  );
  
  const stillUnmatchedKatapultPoleIds = katapultPoles.filter(
    pole => pole.nodeId !== undefined && !matchedKatapultIds.has(pole.nodeId)
  );
  
  performGeolocationMatching(
    stillUnmatchedSpidaPoleIds,
    stillUnmatchedKatapultPoleIds,
    correlatedPoles,
    matchedSpidaIndices,
    matchedKatapultIds,
    'algorithm'
  );
  
  // Collect remaining unmatched poles
  spidaPoles.forEach(pole => {
    if (pole.leadIndex !== undefined && 
        pole.locationIndex !== undefined && 
        !matchedSpidaIndices.has(`${pole.leadIndex}-${pole.locationIndex}`)) {
      unmatchedSpidaPoles.push(pole.originalData as SpidaLocation);
    }
  });
  
  katapultPoles.forEach(pole => {
    if (pole.nodeId && !matchedKatapultIds.has(pole.nodeId)) {
      katapultOnlyPoles.push(pole.originalData as Record<string, unknown>);
    }
  });
  
  return {
    correlatedPoles,
    unmatchedSpidaPoles,
    katapultOnlyPoles
  };
}

/**
 * Extracts pole identifiers from SPIDAcalc data
 * 
 * @param spidaData - Parsed SPIDAcalc JSON data
 * @returns Array of pole identifiers
 */
function extractSpidaPoleIdentifiers(spidaData: SpidaData): PoleIdentifier[] {
  const poleIdentifiers: PoleIdentifier[] = [];
  
  // Iterate through all leads and locations
  spidaData.leads.forEach((lead, leadIndex) => {
    lead.locations.forEach((location, locationIndex) => {
      // Get primary pole identifier (label)
      const poleId = location.label;
      
      // Get geolocation if available
      let latitude: number | undefined;
      let longitude: number | undefined;
      
      if (location.geographicCoordinate?.type === 'Point' && 
          Array.isArray(location.geographicCoordinate.coordinates) && 
          location.geographicCoordinate.coordinates.length >= 2) {
        // GeoJSON format: [longitude, latitude]
        longitude = location.geographicCoordinate.coordinates[0];
        latitude = location.geographicCoordinate.coordinates[1];
      }
      
      // Check for additional pole identifiers in poleTags if available
      const additionalIds: string[] = [];
      if (Array.isArray(location.poleTags)) {
        location.poleTags.forEach((tag: Record<string, unknown>) => {
          // Extract tag values that might be pole numbers
          // This depends on the specific format of poleTags in your data
          const value = getNestedValue<string>(tag, ['value'], null) || 
                       getNestedValue<string>(tag, ['name'], null) ||
                       getNestedValue<string>(tag, ['tag_number'], null);
          
          if (value && typeof value === 'string' && value.trim()) {
            additionalIds.push(value.trim());
          }
        });
      }
      
      // Create the primary pole identifier entry
      poleIdentifiers.push({
        id: poleId,
        normalizedId: normalizePoleNumber(poleId),
        latitude,
        longitude,
        originalData: location,
        leadIndex,
        locationIndex
      });
      
      // Add entries for any alternative identifiers
      additionalIds.forEach(altId => {
        if (altId !== poleId) {
          poleIdentifiers.push({
            id: altId,
            normalizedId: normalizePoleNumber(altId),
            latitude,
            longitude,
            originalData: location,
            leadIndex,
            locationIndex
          });
        }
      });
    });
  });
  
  return poleIdentifiers;
}

/**
 * Extracts pole identifiers from Katapult data
 * 
 * @param katapultData - Parsed Katapult JSON data
 * @returns Array of pole identifiers
 */
function extractKatapultPoleIdentifiers(katapultData: KatapultData): PoleIdentifier[] {
  const poleIdentifiers: PoleIdentifier[] = [];
  
  // Iterate through all nodes
  Object.entries(katapultData.nodes).forEach(([nodeId, node]) => {
    // Check various attribute fields that might contain pole numbers
    const possibleIdFields = [
      ['attributes', 'PoleNumber', '-Imported'],
      ['attributes', 'electric_pole_tag', 'assessment'],
      ['attributes', 'DLOC_number', '-Imported'],
      ['attributes', 'pole_number', '-Imported'],
      ['attributes', 'pole_id', '-Imported'],
      ['attributes', 'pole_tag', 'assessment']
    ];
    
    // Find all possible pole IDs
    const poleIds: string[] = [];
    
    possibleIdFields.forEach(path => {
      const value = getNestedValue<string>(node, path, null);
      if (value && typeof value === 'string' && value.trim()) {
        poleIds.push(value.trim());
      }
    });
    
    // If no pole IDs were found in the expected fields, use the node ID as a fallback
    if (poleIds.length === 0) {
      poleIds.push(nodeId);
    }
    
    // Extract coordinates
    const latitude = typeof node.latitude === 'number' ? node.latitude : undefined;
    const longitude = typeof node.longitude === 'number' ? node.longitude : undefined;
    
    // Create an entry for each pole ID
    poleIds.forEach(poleId => {
      poleIdentifiers.push({
        id: poleId,
        normalizedId: normalizePoleNumber(poleId),
        latitude,
        longitude,
        originalData: node,
        nodeId
      });
    });
  });
  
  return poleIdentifiers;
}

/**
 * Performs exact matching between pole identifiers
 * 
 * @param spidaPoles - Array of SPIDA pole identifiers
 * @param katapultPoles - Array of Katapult pole identifiers
 * @param correlatedPoles - Array to store correlated poles
 * @param matchedSpidaIndices - Set of matched SPIDA pole indices
 * @param matchedKatapultIds - Set of matched Katapult pole IDs
 * @param matchType - Type of match to record
 */
function performExactMatching(
  spidaPoles: PoleIdentifier[],
  katapultPoles: PoleIdentifier[],
  correlatedPoles: CorrelationResult['correlatedPoles'],
  matchedSpidaIndices: Set<string>,
  matchedKatapultIds: Set<string>,
  matchType: 'exact' | 'partial' | 'algorithm'
): void {
  spidaPoles.forEach(spidaPole => {
    // Skip if this SPIDA pole has already been matched or missing location indices
    if (spidaPole.leadIndex === undefined || 
        spidaPole.locationIndex === undefined || 
        matchedSpidaIndices.has(`${spidaPole.leadIndex}-${spidaPole.locationIndex}`)) {
      return;
    }
    
    // Look for an exact ID match
    const matchingKatapultPole = katapultPoles.find(katapultPole => 
      katapultPole.nodeId !== undefined && 
      !matchedKatapultIds.has(katapultPole.nodeId) && 
      spidaPole.id === katapultPole.id
    );
    
    if (matchingKatapultPole && matchingKatapultPole.nodeId) {
      // Create correlation entry
      correlatedPoles.push({
        spidaPole: spidaPole.originalData as SpidaLocation,
        katapultNode: matchingKatapultPole.originalData as Record<string, unknown>,
        matchType: matchType
      });
      
      // Mark both poles as matched
      matchedSpidaIndices.add(`${spidaPole.leadIndex}-${spidaPole.locationIndex}`);
      matchedKatapultIds.add(matchingKatapultPole.nodeId);
    }
  });
}

/**
 * Performs normalized matching between pole identifiers
 * 
 * @param spidaPoles - Array of SPIDA pole identifiers
 * @param katapultPoles - Array of Katapult pole identifiers
 * @param correlatedPoles - Array to store correlated poles
 * @param matchedSpidaIndices - Set of matched SPIDA pole indices
 * @param matchedKatapultIds - Set of matched Katapult pole IDs
 * @param matchType - Type of match to record
 */
function performNormalizedMatching(
  spidaPoles: PoleIdentifier[],
  katapultPoles: PoleIdentifier[],
  correlatedPoles: CorrelationResult['correlatedPoles'],
  matchedSpidaIndices: Set<string>,
  matchedKatapultIds: Set<string>,
  matchType: 'exact' | 'partial' | 'algorithm'
): void {
  spidaPoles.forEach(spidaPole => {
    // Skip if this SPIDA pole has already been matched or missing location indices
    if (spidaPole.leadIndex === undefined || 
        spidaPole.locationIndex === undefined || 
        matchedSpidaIndices.has(`${spidaPole.leadIndex}-${spidaPole.locationIndex}`)) {
      return;
    }
    
    // Look for a normalized ID match
    const matchingKatapultPole = katapultPoles.find(katapultPole => 
      katapultPole.nodeId !== undefined && 
      !matchedKatapultIds.has(katapultPole.nodeId) && 
      spidaPole.normalizedId === katapultPole.normalizedId &&
      spidaPole.normalizedId !== '' // Ensure we're not matching on empty normalized IDs
    );
    
    if (matchingKatapultPole && matchingKatapultPole.nodeId) {
      // Create correlation entry
      correlatedPoles.push({
        spidaPole: spidaPole.originalData as SpidaLocation,
        katapultNode: matchingKatapultPole.originalData as Record<string, unknown>,
        matchType: matchType
      });
      
      // Mark both poles as matched
      matchedSpidaIndices.add(`${spidaPole.leadIndex}-${spidaPole.locationIndex}`);
      matchedKatapultIds.add(matchingKatapultPole.nodeId);
    }
  });
}

/**
 * Calculates the distance between two points using the Haversine formula
 * 
 * @param lat1 - Latitude of the first point
 * @param lon1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lon2 - Longitude of the second point
 * @returns Distance in meters
 */
function haversineDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  // Earth's radius in meters
  const R = 6371000;
  
  // Convert latitude and longitude from degrees to radians
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  
  // Haversine formula
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
          Math.cos(phi1) * Math.cos(phi2) *
          Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Performs geolocation-based matching between pole identifiers
 * 
 * @param spidaPoles - Array of SPIDA pole identifiers
 * @param katapultPoles - Array of Katapult pole identifiers
 * @param correlatedPoles - Array to store correlated poles
 * @param matchedSpidaIndices - Set of matched SPIDA pole indices
 * @param matchedKatapultIds - Set of matched Katapult pole IDs
 * @param matchType - Type of match to record
 */
function performGeolocationMatching(
  spidaPoles: PoleIdentifier[],
  katapultPoles: PoleIdentifier[],
  correlatedPoles: CorrelationResult['correlatedPoles'],
  matchedSpidaIndices: Set<string>,
  matchedKatapultIds: Set<string>,
  matchType: 'exact' | 'partial' | 'algorithm'
): void {
  // Maximum distance for considering poles the same (in meters)
  const MAX_DISTANCE = 20;
  
  // Filter to only poles with valid coordinates
  const spidaPolesWithCoords = spidaPoles.filter(
    pole => 
      pole.latitude !== undefined && 
      pole.longitude !== undefined &&
      pole.leadIndex !== undefined && 
      pole.locationIndex !== undefined &&
      !matchedSpidaIndices.has(`${pole.leadIndex}-${pole.locationIndex}`)
  );
  
  const katapultPolesWithCoords = katapultPoles.filter(
    pole => 
      pole.latitude !== undefined && 
      pole.longitude !== undefined &&
      pole.nodeId !== undefined && 
      !matchedKatapultIds.has(pole.nodeId)
  );
  
  // Skip if either set is empty
  if (spidaPolesWithCoords.length === 0 || katapultPolesWithCoords.length === 0) {
    return;
  }
  
  // For each SPIDA pole, find the closest Katapult pole
  for (const spidaPole of spidaPolesWithCoords) {
    // Skip if missing indices or already matched
    if (spidaPole.leadIndex === undefined || 
        spidaPole.locationIndex === undefined || 
        matchedSpidaIndices.has(`${spidaPole.leadIndex}-${spidaPole.locationIndex}`)) {
      continue;
    }
    
    let closestPole: PoleIdentifier | null = null;
    let minDistance = Infinity;
    
    // Calculate distances to all Katapult poles
    for (const katapultPole of katapultPolesWithCoords) {
      // Skip if missing nodeId or already matched
      if (!katapultPole.nodeId || matchedKatapultIds.has(katapultPole.nodeId)) {
        continue;
      }
      
      // Need to check these are defined before using them with ! operator
      if (spidaPole.latitude === undefined || spidaPole.longitude === undefined ||
          katapultPole.latitude === undefined || katapultPole.longitude === undefined) {
        continue;
      }
      
      const distance = haversineDistance(
        spidaPole.latitude, 
        spidaPole.longitude,
        katapultPole.latitude,
        katapultPole.longitude
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPole = katapultPole;
      }
    }
    
    // If the closest pole is within the threshold distance, consider it a match
    if (closestPole && closestPole.nodeId && minDistance <= MAX_DISTANCE) {
      // Create correlation entry
      correlatedPoles.push({
        spidaPole: spidaPole.originalData as SpidaLocation,
        katapultNode: closestPole.originalData as Record<string, unknown>,
        matchType: matchType
      });
      
      // Mark both poles as matched
      matchedSpidaIndices.add(`${spidaPole.leadIndex}-${spidaPole.locationIndex}`);
      matchedKatapultIds.add(closestPole.nodeId);
    }
  }
}

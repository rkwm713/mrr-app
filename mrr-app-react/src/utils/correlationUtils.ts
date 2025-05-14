import type { SpidaData, KatapultData, CorrelationResult, SpidaLocation } from '../types/DataTypes';
import { getNestedValue, normalizePoleNumber } from './dataUtils';

interface PoleIdentifier {
  id: string;
  normalizedId: string;
  alternativeIds: string[];
  latitude?: number;
  longitude?: number;
  originalData: SpidaLocation | Record<string, unknown>;
  leadIndex?: number;
  locationIndex?: number;
  nodeId?: string;
  confidence: number; // 0-1 confidence score for matching
}

export class EnhancedPoleCorrelator {
  private static readonly CONFIDENCE_THRESHOLDS = {
    EXACT_MATCH: 1.0,
    NORMALIZED_MATCH: 0.8,
    PARTIAL_MATCH: 0.6,
    GEOLOCATION_MATCH: 0.5,
    MINIMUM_CONFIDENCE: 0.3
  };

  /**
   * Enhanced pole correlation with confidence scoring
   */
  static correlatePoles(spidaData: SpidaData, katapultData: KatapultData): CorrelationResult {
    console.log('Starting enhanced pole correlation...');
    
    // Extract pole identifiers with multiple alternative IDs
    const spidaPoles = this.extractEnhancedSpidaPoleIdentifiers(spidaData);
    const katapultPoles = this.extractEnhancedKatapultPoleIdentifiers(katapultData);
    
    console.log(`Found ${spidaPoles.length} SPIDA poles and ${katapultPoles.length} Katapult poles`);
    
    // Perform multi-stage matching with confidence scoring
    const matches = this.performEnhancedMatching(spidaPoles, katapultPoles);
    
    // Filter matches by confidence threshold
    const highConfidenceMatches = matches.filter(
      match => match.confidence >= this.CONFIDENCE_THRESHOLDS.MINIMUM_CONFIDENCE
    );
    
    console.log(`Created ${highConfidenceMatches.length} matches with confidence >= ${this.CONFIDENCE_THRESHOLDS.MINIMUM_CONFIDENCE}`);
    
    // Build correlation result
    const correlatedPoles = highConfidenceMatches.map(match => ({
      spidaPole: match.spidaPole.originalData as SpidaLocation,
      katapultNode: match.katapultPole.originalData as Record<string, unknown>,
      matchType: this.getMatchTypeFromConfidence(match.confidence)
    }));
    
    // Find unmatched poles
    const matchedSpidaIndices = new Set(
      highConfidenceMatches.map(match => 
        `${match.spidaPole.leadIndex}-${match.spidaPole.locationIndex}`
      )
    );
    
    const matchedKatapultIds = new Set(
      highConfidenceMatches.map(match => match.katapultPole.nodeId).filter(id => id)
    );
    
    const unmatchedSpidaPoles = spidaPoles
      .filter(pole => 
        pole.leadIndex !== undefined && 
        pole.locationIndex !== undefined &&
        !matchedSpidaIndices.has(`${pole.leadIndex}-${pole.locationIndex}`)
      )
      .map(pole => pole.originalData as SpidaLocation);
    
    const katapultOnlyPoles = katapultPoles
      .filter(pole => pole.nodeId && !matchedKatapultIds.has(pole.nodeId))
      .map(pole => pole.originalData as Record<string, unknown>);
    
    return {
      correlatedPoles,
      unmatchedSpidaPoles,
      katapultOnlyPoles
    };
  }

  /**
   * Enhanced SPIDA pole identifier extraction with multiple ID sources
   */
  private static extractEnhancedSpidaPoleIdentifiers(spidaData: SpidaData): PoleIdentifier[] {
    const poleIdentifiers: PoleIdentifier[] = [];
    
    spidaData.leads.forEach((lead, leadIndex) => {
      lead.locations.forEach((location, locationIndex) => {
        const alternativeIds: string[] = [];
        
        // Get primary pole ID
        const primaryId = location.label;
        
        // Get alternative IDs from poleTags if available
        if (Array.isArray(location.poleTags)) {
          location.poleTags.forEach((tag: Record<string, unknown>) => {
            const tagValue = getNestedValue<string>(tag, ['value'], null) || 
                           getNestedValue<string>(tag, ['name'], null) ||
                           getNestedValue<string>(tag, ['tag_number'], null);
            
            if (tagValue && tagValue !== primaryId) {
              alternativeIds.push(tagValue);
            }
          });
        }
        
        // Get pole alias from clientItemAlias if available
        const measuredDesign = location.designs.find(d => d.layerType === 'Measured');
        if (measuredDesign) {
          const clientItemAlias = getNestedValue<string>(
            measuredDesign,
            ['structure', 'pole', 'clientItemAlias'],
            null
          );
          
          if (clientItemAlias && clientItemAlias !== primaryId) {
            alternativeIds.push(clientItemAlias);
          }
        }
        
        // Extract coordinates
        let latitude: number | undefined;
        let longitude: number | undefined;
        
        if (location.geographicCoordinate?.type === 'Point' && 
            Array.isArray(location.geographicCoordinate.coordinates) && 
            location.geographicCoordinate.coordinates.length >= 2) {
          longitude = location.geographicCoordinate.coordinates[0];
          latitude = location.geographicCoordinate.coordinates[1];
        }
        
        poleIdentifiers.push({
          id: primaryId,
          normalizedId: normalizePoleNumber(primaryId),
          alternativeIds: [...new Set(alternativeIds)], // Remove duplicates
          latitude,
          longitude,
          originalData: location,
          leadIndex,
          locationIndex,
          confidence: 1.0 // Initial confidence
        });
      });
    });
    
    return poleIdentifiers;
  }

  /**
   * Enhanced Katapult pole identifier extraction with multiple ID sources
   */
  private static extractEnhancedKatapultPoleIdentifiers(katapultData: KatapultData): PoleIdentifier[] {
    const poleIdentifiers: PoleIdentifier[] = [];
    
    Object.entries(katapultData.nodes).forEach(([nodeId, node]) => {
      const alternativeIds: string[] = [];
      let primaryId: string | null = null;
      
      // Check all possible pole number fields
      const possibleIdFields = [
        ['attributes', 'PoleNumber', '-Imported'],
        ['attributes', 'electric_pole_tag', 'assessment'], 
        ['attributes', 'DLOC_number', '-Imported'],
        ['attributes', 'pole_number', '-Imported'],
        ['attributes', 'pole_id', '-Imported'],
        ['attributes', 'pole_tag', 'assessment'],
        ['attributes', 'birthmark_brand', 'pole_number'],
        // Check for any attribute containing "pole" or "tag"
        ...this.findPoleLikeAttributes(node.attributes)
      ];
      
      possibleIdFields.forEach(path => {
        const value = getNestedValue<string>(node, path, null);
        if (value && typeof value === 'string' && value.trim()) {
          const cleanValue = value.trim();
          if (!primaryId) {
            primaryId = cleanValue;
          } else if (cleanValue !== primaryId && !alternativeIds.includes(cleanValue)) {
            alternativeIds.push(cleanValue);
          }
        }
      });
      
      // Use node ID as fallback
      if (!primaryId) {
        primaryId = nodeId;
      }
      
      // Extract coordinates
      const latitude = typeof node.latitude === 'number' ? node.latitude : undefined;
      const longitude = typeof node.longitude === 'number' ? node.longitude : undefined;
      
      poleIdentifiers.push({
        id: primaryId,
        normalizedId: normalizePoleNumber(primaryId),
        alternativeIds,
        latitude,
        longitude,
        originalData: node,
        nodeId,
        confidence: 1.0 // Initial confidence
      });
    });
    
    return poleIdentifiers;
  }

  /**
   * Find pole-like attributes dynamically
   */
  private static findPoleLikeAttributes(attributes: Record<string, unknown>): string[][] {
    const poleLikeFields: string[][] = [];
    
    const searchInObject = (obj: Record<string, unknown>, path: string[] = []): void => {
      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = [...path, key];
        
        // Check if key suggests it might contain pole ID
        if (key.toLowerCase().includes('pole') || 
            key.toLowerCase().includes('tag') ||
            key.toLowerCase().includes('dloc') ||
            key.toLowerCase().includes('number')) {
          
          if (typeof value === 'string' || typeof value === 'number') {
            poleLikeFields.push(['attributes', ...currentPath]);
          } else if (value && typeof value === 'object' && currentPath.length < 3) {
            // Recurse one level deeper for nested objects
            searchInObject(value as Record<string, unknown>, currentPath);
          }
        }
      });
    };
    
    searchInObject(attributes);
    return poleLikeFields;
  }

  /**
   * Perform enhanced matching with confidence scoring
   */
  private static performEnhancedMatching(
    spidaPoles: PoleIdentifier[],
    katapultPoles: PoleIdentifier[]
  ): Array<{spidaPole: PoleIdentifier, katapultPole: PoleIdentifier, confidence: number}> {
    const matches: Array<{spidaPole: PoleIdentifier, katapultPole: PoleIdentifier, confidence: number}> = [];
    const usedKatapultPoles = new Set<string>();
    
    // Sort SPIDA poles by confidence (if we had a way to pre-calculate it)
    const sortedSpidaPoles = [...spidaPoles];
    
    for (const spidaPole of sortedSpidaPoles) {
      let bestMatch: {pole: PoleIdentifier, confidence: number} | null = null;
      
      for (const katapultPole of katapultPoles) {
        if (!katapultPole.nodeId || usedKatapultPoles.has(katapultPole.nodeId)) {
          continue;
        }
        
        const confidence = this.calculateMatchConfidence(spidaPole, katapultPole);
        
        if (confidence >= this.CONFIDENCE_THRESHOLDS.MINIMUM_CONFIDENCE &&
            (!bestMatch || confidence > bestMatch.confidence)) {
          bestMatch = { pole: katapultPole, confidence };
        }
      }
      
      if (bestMatch && bestMatch.pole.nodeId) {
        matches.push({
          spidaPole,
          katapultPole: bestMatch.pole,
          confidence: bestMatch.confidence
        });
        
        usedKatapultPoles.add(bestMatch.pole.nodeId);
      }
    }
    
    return matches;
  }

  /**
   * Calculate confidence score for pole matching
   */
  private static calculateMatchConfidence(
    spidaPole: PoleIdentifier,
    katapultPole: PoleIdentifier
  ): number {
    let maxConfidence = 0;
    
    // All possible SPIDA IDs (primary + alternatives)
    const spidaIds = [spidaPole.id, ...spidaPole.alternativeIds];
    // All possible Katapult IDs (primary + alternatives)
    const katapultIds = [katapultPole.id, ...katapultPole.alternativeIds];
    
    // Check for exact matches
    for (const spidaId of spidaIds) {
      for (const katapultId of katapultIds) {
        if (spidaId === katapultId) {
          maxConfidence = Math.max(maxConfidence, this.CONFIDENCE_THRESHOLDS.EXACT_MATCH);
        }
      }
    }
    
    // Check for normalized matches if no exact match
    if (maxConfidence < this.CONFIDENCE_THRESHOLDS.EXACT_MATCH) {
      for (const spidaId of spidaIds) {
        for (const katapultId of katapultIds) {
          const normalizedSpida = normalizePoleNumber(spidaId);
          const normalizedKatapult = normalizePoleNumber(katapultId);
          
          if (normalizedSpida === normalizedKatapult && normalizedSpida !== '') {
            maxConfidence = Math.max(maxConfidence, this.CONFIDENCE_THRESHOLDS.NORMALIZED_MATCH);
          }
        }
      }
    }
    
    // Check for partial matches (substring matching)
    if (maxConfidence < this.CONFIDENCE_THRESHOLDS.NORMALIZED_MATCH) {
      for (const spidaId of spidaIds) {
        for (const katapultId of katapultIds) {
          if (spidaId.length > 3 && katapultId.length > 3) {
            if (spidaId.includes(katapultId) || katapultId.includes(spidaId)) {
              maxConfidence = Math.max(maxConfidence, this.CONFIDENCE_THRESHOLDS.PARTIAL_MATCH);
            }
          }
        }
      }
    }
    
    // Geographic proximity bonus
    if (maxConfidence > 0 && 
        spidaPole.latitude !== undefined && spidaPole.longitude !== undefined &&
        katapultPole.latitude !== undefined && katapultPole.longitude !== undefined) {
      
      const distance = this.haversineDistance(
        spidaPole.latitude, spidaPole.longitude,
        katapultPole.latitude, katapultPole.longitude
      );
      
      // If poles are within 50 meters and we have some ID match, boost confidence
      if (distance < 50) {
        maxConfidence = Math.min(1.0, maxConfidence + 0.1);
      }
    }
    
    // Geographic-only matching for poles with coordinates but no ID match
    if (maxConfidence === 0 && 
        spidaPole.latitude !== undefined && spidaPole.longitude !== undefined &&
        katapultPole.latitude !== undefined && katapultPole.longitude !== undefined) {
      
      const distance = this.haversineDistance(
        spidaPole.latitude, spidaPole.longitude,
        katapultPole.latitude, katapultPole.longitude
      );
      
      // If poles are very close (within 10 meters), consider it a potential match
      if (distance < 10) {
        maxConfidence = this.CONFIDENCE_THRESHOLDS.GEOLOCATION_MATCH;
      }
    }
    
    return maxConfidence;
  }

  /**
   * Haversine distance calculation
   */
  private static haversineDistance(
    lat1: number, lon1: number, lat2: number, lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
    
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert confidence score to match type
   */
  private static getMatchTypeFromConfidence(confidence: number): 'exact' | 'partial' | 'algorithm' {
    if (confidence >= this.CONFIDENCE_THRESHOLDS.EXACT_MATCH) {
      return 'exact';
    } else if (confidence >= this.CONFIDENCE_THRESHOLDS.NORMALIZED_MATCH) {
      return 'partial';
    } else {
      return 'algorithm';
    }
  }
}
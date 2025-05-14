# Enhanced Pole Correlation Implementation

## Overview

This document describes the Enhanced Pole Correlation implementation in the MR Reports application. The enhanced system provides more accurate matching between SPIDAcalc and Katapult poles through a multi-stage approach with confidence scoring.

## Key Features

### 1. Multi-Stage Matching

The correlation algorithm uses a four-stage approach, trying each method in sequence:

1. **Exact Match** (100% confidence) - Direct string comparison of pole IDs
2. **Normalized Match** (80% confidence) - Comparison after normalizing pole numbers (removing prefixes, standardizing case)
3. **Partial Match** (60% confidence) - String similarity and substring matching
4. **Geographic Match** (50% confidence) - Proximity-based matching using coordinates

### 2. Confidence Scoring

Each match receives a confidence score from 0.0 to 1.0, allowing for:
- Filtering matches below a confidence threshold (default: 0.3)
- Showing match quality in the UI
- Supporting manual review of lower-confidence matches

### 3. Alternative ID Matching

The system extracts and uses multiple potential identifiers for each pole:
- Primary pole ID (label)
- Pole tags and additional identifiers
- Client item aliases
- Dynamically discovered ID-like attributes

### 4. Geographic Proximity Analysis

For poles with coordinate data:
- Distance calculations using the Haversine formula
- Graduated confidence based on proximity
- Used to confirm ID-based matches or as a last resort

### 5. Performance Optimizations

- Early bailout for already matched poles
- More efficient data structures
- Consolidation of duplicate IDs

## Implementation Details

### EnhancedPoleCorrelator Class

The system is implemented in the `EnhancedPoleCorrelator` class with methods:

```typescript
static correlatePoles(spidaData: SpidaData, katapultData: KatapultData): CorrelationResult
private static extractEnhancedSpidaPoleIdentifiers(spidaData: SpidaData): PoleIdentifier[]
private static extractEnhancedKatapultPoleIdentifiers(katapultData: KatapultData): PoleIdentifier[]
private static findPoleLikeAttributes(attributes: Record<string, unknown>): string[][]
private static performEnhancedMatching(spidaPoles: PoleIdentifier[], katapultPoles: PoleIdentifier[]): Array<{spidaPole: PoleIdentifier, katapultPole: PoleIdentifier, confidence: number}>
private static calculateMatchConfidence(spidaPole: PoleIdentifier, katapultPole: PoleIdentifier): number
private static haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number
private static getMatchTypeFromConfidence(confidence: number): 'exact' | 'partial' | 'algorithm'
```

### PoleIdentifier Interface

Enhanced to include confidence and alternative IDs:

```typescript
interface PoleIdentifier {
  id: string;                  // Primary pole identifier
  normalizedId: string;        // Normalized version for better matching
  alternativeIds: string[];    // Additional identifiers from tags, aliases, etc.
  latitude?: number;           // Geographic coordinates if available
  longitude?: number;
  confidence: number;          // Match confidence score (0-1)
  originalData: object;        // Reference to original data object
  // System-specific fields
  leadIndex?: number;          // For SPIDA poles
  locationIndex?: number;      // For SPIDA poles
  nodeId?: string;             // For Katapult nodes
}
```

### Testing

The implementation includes a dedicated test module for verification:
- Sample test data with various matching scenarios
- Test component in the UI to visualize results
- Console logging of match details

## Comparison with Previous Implementation

| Feature | Previous Implementation | Enhanced Implementation |
|---------|------------------------|--------------------------|
| Matching Methods | Basic exact and normalized matching | Multi-stage with partial and geographic matching |
| Confidence | Binary (matched/unmatched) | Graduated scoring (0.0-1.0) |
| Alternative IDs | Limited support | Comprehensive extraction and matching |
| Geographic | Basic distance-only | Distance with confidence adjustment |
| Diagnostics | Limited | Detailed match information |

## Future Improvements

- User-configurable confidence thresholds in the UI
- Visual indicators for match confidence levels
- Manual override option for reviewing and correcting matches
- Machine learning for improving match heuristics over time

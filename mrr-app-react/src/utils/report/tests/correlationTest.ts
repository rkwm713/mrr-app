/**
 * Test file for enhanced pole correlation
 */
import type { SpidaData, KatapultData, CorrelationResult } from '../../../types/DataTypes';
import { EnhancedPoleCorrelator } from '../../correlationUtils';

// Test data with various challenging pole ID scenarios
const testSpidaData: SpidaData = {
  leads: [
    {
      label: 'Lead 1',
      locations: [
        {
          label: 'ABC123', // Exact match
          designs: [],
          geographicCoordinate: {
            type: 'Point',
            coordinates: [-82.123, 40.456]
          }
        },
        {
          label: 'XYZ-789', // Normalized match (without prefix)
          designs: [],
          geographicCoordinate: {
            type: 'Point',
            coordinates: [-82.234, 40.567]
          }
        },
        {
          label: 'POLE-456', // Alternative ID match
          poleTags: [
            { value: 'TAG456', name: 'Tag Number' }
          ],
          designs: [],
          geographicCoordinate: undefined
        },
        {
          label: 'GEO-ONLY', // Geolocation-only match
          designs: [],
          geographicCoordinate: {
            type: 'Point',
            coordinates: [-82.111, 40.222]
          }
        },
        {
          label: 'NO-MATCH', // Should remain unmatched
          designs: [],
          geographicCoordinate: undefined
        }
      ]
    }
  ],
  clientData: {
    name: 'Test Data',
    version: 1,
    poles: [],
    wires: []
  }
};

const testKatapultData: KatapultData = {
  nodes: {
    'node1': {
      _created: { method: 'test', timestamp: 123, uid: 'test' },
      attributes: {
        'PoleNumber': { '-Imported': 'ABC123' } // Exact match
      },
      button: 'pole',
      latitude: 40.456,
      longitude: -82.123
    },
    'node2': {
      _created: { method: 'test', timestamp: 123, uid: 'test' },
      attributes: {
        'pole_number': { '-Imported': '789' } // Normalized match
      },
      button: 'pole',
      latitude: 40.567,
      longitude: -82.234
    },
    'node3': {
      _created: { method: 'test', timestamp: 123, uid: 'test' },
      attributes: {
        'pole_id': { '-Imported': 'DIFF-ID' }, // Different main ID
        'alternate_tags': { 'one': 'TAG456' }  // Alternative ID match
      },
      button: 'pole',
      latitude: 40.678,
      longitude: -82.345
    },
    'node4': {
      _created: { method: 'test', timestamp: 123, uid: 'test' },
      attributes: {
        'pole_id': { '-Imported': 'GEO-DIFF' } // Different ID but close location
      },
      button: 'pole',
      latitude: 40.222,
      longitude: -82.111
    },
    'node5': {
      _created: { method: 'test', timestamp: 123, uid: 'test' },
      attributes: {
        'pole_id': { '-Imported': 'KATAPULT-ONLY' } // Katapult-only pole
      },
      button: 'pole',
      latitude: 40.999,
      longitude: -82.999
    }
  }
};

// Run test function
function testEnhancedPoleCorrelation() {
  console.log('Starting enhanced pole correlation test...');
  
  // Run correlation
  const startTime = performance.now();
  const result: CorrelationResult = EnhancedPoleCorrelator.correlatePoles(testSpidaData, testKatapultData);
  const endTime = performance.now();
  
  // Print results
  console.log(`Correlation completed in ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`Found ${result.correlatedPoles.length} matched poles`);
  console.log(`Found ${result.unmatchedSpidaPoles.length} unmatched SPIDA poles`);
  console.log(`Found ${result.katapultOnlyPoles.length} Katapult-only poles`);
  
  // Print match details
  console.log('\nMatch Details:');
  result.correlatedPoles.forEach((match, index) => {
    console.log(`Match ${index + 1}:`);
    console.log(`  SPIDA ID: ${match.spidaPole.label}`);
    console.log(`  Match Type: ${match.matchType}`);
    const nodeId = Object.keys(testKatapultData.nodes).find(
      key => testKatapultData.nodes[key] === match.katapultNode
    );
    console.log(`  Katapult Node: ${nodeId}`);
    console.log('---');
  });
  
  // Print unmatched SPIDA poles
  console.log('\nUnmatched SPIDA Poles:');
  result.unmatchedSpidaPoles.forEach((pole, index) => {
    console.log(`  ${index + 1}. ${pole.label}`);
  });
  
  // Print Katapult-only poles
  console.log('\nKatapult-only Poles:');
  result.katapultOnlyPoles.forEach((pole, index) => {
    const nodeId = Object.keys(testKatapultData.nodes).find(
      key => testKatapultData.nodes[key] === pole
    );
    console.log(`  ${index + 1}. Node ${nodeId}`);
  });
  
  return result;
}

// Export the test function for use in the application
export { testEnhancedPoleCorrelation };

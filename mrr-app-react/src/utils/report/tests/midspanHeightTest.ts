/**
 * Integration test for midspan height processing with REF sub groups
 * 
 * This test verifies that the midspan height data is correctly processed
 * and that REF sub groups are properly formatted.
 */

import { ConnectionTracker } from '../connectionTracker';
import { MidspanDataAnalyzer } from '../midspanDataAnalyzer';
import { ReportDataFactory } from '../reportDataFactory';

/**
 * Test method to verify the midspan height processing
 * 
 * @param katapultData Sample Katapult data to test with
 * @returns Test results
 */
export function testMidspanHeightProcessing(
  katapultData: Record<string, unknown>
): {
  success: boolean;
  message: string;
  results: {
    refStatus: boolean;
    lowestCommHeight: string;
    lowestElectricalHeight: string;
    refFormatting: boolean;
  }
} {
  try {
    // Process connections using ConnectionTracker
    const { connections, spanWires } = ConnectionTracker.processConnections(katapultData);
    
    if (spanWires.length === 0) {
      return {
        success: false,
        message: 'No span wires found in the data',
        results: {
          refStatus: false,
          lowestCommHeight: 'N/A',
          lowestElectricalHeight: 'N/A',
          refFormatting: false
        }
      };
    }
    
    // Process wire heights using MidspanDataAnalyzer
    const processedWires = MidspanDataAnalyzer.processWireHeights(
      spanWires,
      katapultData as Record<string, unknown>
    );
    
    // Create a test report data object
    const reportData = ReportDataFactory.createEmptyReportData(1);
    
    // Check if any connection is a REF sub group
    const hasRefConnection = connections.some(conn => conn.isREFConnection);
    
    if (hasRefConnection) {
      reportData.isREFSubGroup = true;
      reportData.refStatus = 'REF';
    }
    
    // Get lowest heights
    const lowestComm = MidspanDataAnalyzer.getLowestMidspanHeight(processedWires, 'communication');
    const lowestElectrical = MidspanDataAnalyzer.getLowestMidspanHeight(processedWires, 'electrical');
    
    // Update report data
    reportData.lowestCommMidspanHeight = lowestComm.formattedHeight;
    reportData.lowestCPSElectricalMidspanHeight = lowestElectrical.formattedHeight;
    
    // Check if REF formatting is applied correctly
    const refFormatting = Boolean(reportData.isREFSubGroup) && (
      reportData.lowestCommMidspanHeight.startsWith('(') || 
      reportData.lowestCPSElectricalMidspanHeight.startsWith('(')
    );
    
    return {
      success: true,
      message: 'Midspan height processing test completed successfully',
      results: {
        refStatus: reportData.isREFSubGroup === true,
        lowestCommHeight: reportData.lowestCommMidspanHeight,
        lowestElectricalHeight: reportData.lowestCPSElectricalMidspanHeight,
        refFormatting: refFormatting
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `Error during midspan height processing: ${error instanceof Error ? error.message : String(error)}`,
      results: {
        refStatus: false,
        lowestCommHeight: 'Error',
        lowestElectricalHeight: 'Error',
        refFormatting: false
      }
    };
  }
}

/**
 * Function to run the test with sample data
 */
export function runMidspanHeightTest(): void {
  console.log('Running midspan height processing test...');
  
  // Create sample Katapult data with a REF connection
  const sampleKatapultData = {
    nodes: {
      'node1': {
        attributes: {
          pole_number: { one: 'P001' }
        }
      },
      'node2': {
        attributes: {
          pole_number: { one: 'P002' }
        }
      }
    },
    connections: {
      'conn1': {
        node_id_1: 'node1',
        node_id_2: 'node2',
        attributes: {
          connection_type: { one: 'REF' }
        },
        sections: {
          'section1': {
            annotations: {
              'annotation1': {
                attributes: {
                  equipment_type: { button_added: 'Neutral' },
                  owner_name: { one: 'CPS Energy' },
                  measured_height_ft: { one: '22\'-5"' }
                }
              },
              'annotation2': {
                attributes: {
                  equipment_type: { button_added: 'Secondary' },
                  owner_name: { one: 'CPS Energy' },
                  measured_height_ft: { one: '18\'-10"' }
                }
              },
              'annotation3': {
                attributes: {
                  equipment_type: { button_added: 'Cable' },
                  owner_name: { one: 'Charter Communications' },
                  measured_height_ft: { one: '15\'-6"' }
                }
              }
            }
          }
        }
      }
    }
  };
  
  // Run the test
  const testResult = testMidspanHeightProcessing(sampleKatapultData);
  
  // Log results
  console.log('Test result:', testResult.success ? 'SUCCESS' : 'FAILURE');
  console.log('Message:', testResult.message);
  console.log('REF Status:', testResult.results.refStatus);
  console.log('Lowest Communication Height:', testResult.results.lowestCommHeight);
  console.log('Lowest Electrical Height:', testResult.results.lowestElectricalHeight);
  console.log('REF Formatting Applied:', testResult.results.refFormatting);
}

// Export the test function for use in the application
export default runMidspanHeightTest;

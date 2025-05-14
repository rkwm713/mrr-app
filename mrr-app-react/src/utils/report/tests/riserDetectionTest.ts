import { SpidaDataExtractor } from '../spidaDataExtractor';
import { KatapultDataExtractor } from '../katapultDataExtractor';
import type { SpidaData, SpidaDesign } from '../../../types/DataTypes';

/**
 * Test function to validate riser detection in SPIDAcalc and Katapult files
 * 
 * This validates the implementation for detecting when Charter/Spectrum is
 * adding a riser to a pole in the Recommended Design.
 * 
 * @param spidaData - The SPIDAcalc JSON data
 * @param katapultData - The Katapult JSON data
 * @returns Test results summary
 */
export function testRiserDetection(
  spidaData: SpidaData, 
  katapultData: Record<string, unknown>
): string {
  console.log('Starting riser detection test...');
  
  let results = 'Starting riser detection test...\n\n';
  
  try {
    // Test SPIDAcalc riser detection
    results += testSpidaRiserDetection(spidaData);
    
    // Test Katapult riser detection
    results += testKatapultRiserDetection(katapultData);
    
    const message = 'Riser detection test completed';
    console.log(message);
    results += `\n${message}`;
  } catch (error) {
    const errorMessage = `Error during riser detection test: ${error}`;
    console.error(errorMessage);
    results += `\n${errorMessage}`;
  }
  
  return results;
}

/**
 * Tests riser detection in SPIDAcalc file
 */
function testSpidaRiserDetection(spidaData: SpidaData): string {
  console.log('\n--- Testing SPIDAcalc Riser Detection ---');
  
  let results = '--- Testing SPIDAcalc Riser Detection ---\n';
  console.log('\n--- Testing SPIDAcalc Riser Detection ---');
  
  // Iterate through each location (pole) in the SPIDAcalc file
  if (!spidaData.leads || !spidaData.leads[0] || !spidaData.leads[0].locations) {
    const message = 'Invalid SPIDAcalc data structure';
    console.log(message);
    return results + message + '\n';
  }
  
  const locations = spidaData.leads[0].locations;
  
  // Count the poles with Charter risers
  let polesWithRisers = 0;
  
  for (const location of locations) {
    const poleLabel = location.label || 'Unknown Pole';
    
    // Find the Recommended Design
    const recommendedDesign = location.designs?.find((design: SpidaDesign) => 
      design.label === 'Recommended Design' || design.layerType === 'Recommended'
    );
    
    if (!recommendedDesign) {
      console.log(`  ${poleLabel}: No Recommended Design found`);
      continue;
    }
    
    // Check for Charter riser using our enhanced function
    const hasCharterRiser = SpidaDataExtractor.checkForRiser(recommendedDesign);
    
    const message = `  ${poleLabel}: Charter Riser = ${hasCharterRiser ? 'YES' : 'NO'}`;
    console.log(message);
    results += message + '\n';
    
    if (hasCharterRiser) {
      polesWithRisers++;
    }
  }
  
  const summary = `Found ${polesWithRisers} poles with Charter risers in SPIDAcalc file`;
  console.log(`\n${summary}`);
  results += `\n${summary}\n`;
  
  return results;
}

/**
 * Tests riser detection in Katapult file
 */
function testKatapultRiserDetection(katapultData: Record<string, unknown>): string {
  console.log('\n--- Testing Katapult Riser Detection ---');
  
  let results = '\n--- Testing Katapult Riser Detection ---\n';
  console.log('\n--- Testing Katapult Riser Detection ---');
  
  // Iterate through each node (pole) in the Katapult file
  const nodes = katapultData.nodes as Record<string, Record<string, unknown>> | undefined;
  
  if (!nodes) {
    const message = 'Invalid Katapult data structure';
    console.log(message);
    return results + message + '\n';
  }
  
  // Count the poles with Charter risers
  let polesWithRisers = 0;
  
  for (const [nodeId, node] of Object.entries(nodes)) {
    // Get pole number
    const poleNumber = KatapultDataExtractor.getPoleNumber(node) || nodeId;
    
    // Check for Charter riser using our enhanced function
    const hasCharterRiser = KatapultDataExtractor.checkForCharterRiser(node);
    
    const message = `  ${poleNumber}: Charter Riser = ${hasCharterRiser ? 'YES' : 'NO'}`;
    console.log(message);
    results += message + '\n';
    
    if (hasCharterRiser) {
      polesWithRisers++;
    }
  }
  
  const summary = `Found ${polesWithRisers} poles with Charter risers in Katapult file`;
  console.log(`\n${summary}`);
  results += `\n${summary}\n`;
  
  return results;
}

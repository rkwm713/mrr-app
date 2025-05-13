/**
 * Main report generation functions
 */
import type { 
  CorrelationResult, 
  SpidaData, 
  ReportData, 
  SpidaLocation
} from '../../types/DataTypes';
import { ReportDataFactory } from './reportDataFactory';
import { SpidaDataExtractor } from './spidaDataExtractor';
import { KatapultDataExtractor } from './katapultDataExtractor';
import { AttachmentAnalyzer } from './attachmentAnalyzer';

/**
 * Generates a report from correlated pole data
 *
 * @param correlationResult - Result of pole correlation
 * @param spidaData - SPIDAcalc data
 * @returns Array of report data rows
 */
export function generateReport(
  correlationResult: CorrelationResult,
  spidaData: SpidaData
): ReportData[] {
  const reportRows: ReportData[] = [];
  let operationNumber = 1;
  
  // Process matched poles (found in both SPIDA and Katapult)
  correlationResult.correlatedPoles.forEach(correlatedPole => {
    const spidaPole = correlatedPole.spidaPole;
    const katapultNode = correlatedPole.katapultNode;
    
    // Extract data for each column using the mapping rules
    const rowData = extractPoleData(spidaPole, katapultNode, spidaData, operationNumber);
    rowData.matchStatus = 'Full Match';
    
    reportRows.push(rowData);
    operationNumber++;
  });
  
  // Process SPIDA-only poles (not found in Katapult)
  correlationResult.unmatchedSpidaPoles.forEach(spidaLocation => {
    const rowData = extractPoleData(spidaLocation, null, spidaData, operationNumber);
    rowData.matchStatus = 'SPIDA Only';
    
    reportRows.push(rowData);
    operationNumber++;
  });
  
  // Process Katapult-only poles (not found in SPIDA)
  correlationResult.katapultOnlyPoles.forEach(katapultNode => {
    // We can't get SPIDA-specific data like construction grade for these poles
    const rowData = KatapultDataExtractor.extractKatapultOnlyPoleData(katapultNode, operationNumber);
    rowData.matchStatus = 'Katapult Only';
    
    reportRows.push(rowData);
    operationNumber++;
  });
  
  return reportRows;
}

/**
 * Extracts data for a pole from SPIDAcalc and Katapult data
 *
 * @param spidaLocation - SPIDA location data
 * @param katapultNode - Katapult node data or null if not available
 * @param spidaData - Complete SPIDAcalc data
 * @param operationNumber - Operation number for this pole
 * @returns Report data row for this pole
 */
function extractPoleData(
  spidaLocation: SpidaLocation,
  katapultNode: Record<string, unknown> | null,
  spidaData: SpidaData,
  operationNumber: number
): ReportData {
  // Initialize report data with default values
  const reportData = ReportDataFactory.createEmptyReportData(operationNumber);
  
  // Find measured and recommended designs
  const measuredDesign = spidaLocation.designs.find(design => design.layerType === "Measured");
  const recommendedDesign = spidaLocation.designs.find(design => design.layerType === "Recommended");
  
  // Column D: Pole #
  reportData.poleNumber = spidaLocation.label || 'Unknown';
  
  // Extract data for each column from SPIDA if designs are available
  if (measuredDesign) {
    // Column C: Pole Owner
    SpidaDataExtractor.extractPoleOwner(reportData, measuredDesign, katapultNode);
    
    // Column E: Pole Structure (Species & Class)
    SpidaDataExtractor.extractPoleStructure(reportData, measuredDesign, spidaData);
    
    // Columns H-I: Midspan Heights (existing)
    SpidaDataExtractor.extractMidspanHeights(reportData, measuredDesign);
    
    // Set midspanFromPole (part of Column J)
    reportData.midspanFromPole = reportData.poleNumber;
  }
  
  if (recommendedDesign) {
    // Column B: Attachment Action (I/R/E)
    reportData.attachmentAction = AttachmentAnalyzer.determineAttachmentAction(
      measuredDesign, 
      recommendedDesign, 
      katapultNode
    );
    
    // Column F parts: Proposed Features (Riser, Guy, PLA)
    SpidaDataExtractor.extractProposedFeatures(reportData, recommendedDesign);
    
    // Column G: Construction Grade of Analysis
    SpidaDataExtractor.extractConstructionGrade(reportData, recommendedDesign);
    
    // Column K-O: Attacher-specific columns
    AttachmentAnalyzer.extractAttacherData(reportData, measuredDesign, recommendedDesign, katapultNode);
  }
  
  return reportData;
}

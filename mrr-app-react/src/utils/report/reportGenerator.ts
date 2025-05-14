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
import { AttachmentAnalyzer } from './attachmentAnalyzer';
import { MidspanDataAnalyzer } from './midspanDataAnalyzer';
import { getNestedValue } from '../dataUtils';

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
  
  // Katapult-only poles are excluded from the report as requested
  // Original code was:
  // correlationResult.katapultOnlyPoles.forEach(katapultNode => {
  //   const rowData = KatapultDataExtractor.extractKatapultOnlyPoleData(katapultNode, operationNumber);
  //   rowData.matchStatus = 'Katapult Only';
  //   reportRows.push(rowData);
  //   operationNumber++;
  // });
  
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
    SpidaDataExtractor.extractPoleStructure(reportData, measuredDesign, spidaData, katapultNode);
    
    // Columns H-I: Midspan Heights (existing)
    // Use our enhanced midspan data analyzer for more accurate heights
    if (katapultNode) {
      // Extract midspan data from Katapult if available
      const spanWires = MidspanDataAnalyzer.extractMidspanData(katapultNode);
      
      // Get lowest comm and electrical heights
      const lowestComm = MidspanDataAnalyzer.getLowestMidspanHeight(spanWires, 'communication');
      const lowestElectrical = MidspanDataAnalyzer.getLowestMidspanHeight(spanWires, 'electrical');
      
      // Update report data with formatted heights
      reportData.lowestCommMidspanHeight = lowestComm.formattedHeight;
      reportData.lowestCPSElectricalMidspanHeight = lowestElectrical.formattedHeight;
      
      // Process REF sub groups if present in the Katapult data
      checkForREFSubGroups(reportData, katapultNode);
    } else {
      // Fall back to SPIDA extraction if Katapult not available
      SpidaDataExtractor.extractMidspanHeights(reportData, measuredDesign);
    }
    
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
    
    // Get attacher description (list of all attachments from neutral down)
    // Also collect their heights for the Excel report
    reportData.attacherDescription = AttachmentAnalyzer.getAttacherDescription(
      recommendedDesign,
      measuredDesign,
      katapultNode
    );
    
    // Use AttachmentAnalyzer's cached attachments to get heights
    const attachments = AttachmentAnalyzer._cachedAttachments;
    if (attachments && attachments.length > 0) {
      // Store attachment data as JSON for use in Excel generation
      reportData.attachmentData = JSON.stringify(attachments);
    }
  }
  
  return reportData;
}

/**
 * Checks if a pole is part of a REF sub group and marks it accordingly
 * 
 * @param reportData - Report data to update
 * @param katapultNode - Katapult node data
 */
function checkForREFSubGroups(
  reportData: ReportData, 
  katapultNode: Record<string, unknown> | null
): void {
  if (!katapultNode) return;
  
  // Check for connections in the node data
  const connectionsData = getNestedValue<Record<string, Record<string, unknown>>>(
    katapultNode,
    ['connections'],
    {}
  );
  
  if (!connectionsData || Object.keys(connectionsData).length === 0) {
    return;
  }
  
  const connectedPoleIds: string[] = [];
  let hasREFConnection = false;
  
  // Check each connection for REF status
  Object.entries(connectionsData).forEach(([, connectionData]) => {
    // Look for 'is_reference' or 'connection_type' = 'REF' attributes
    const isReference = getNestedValue<boolean>(
      connectionData,
      ['attributes', 'is_reference', 'one'],
      false
    );
    
    const connectionType = getNestedValue<string>(
      connectionData,
      ['attributes', 'connection_type', 'one'],
      ''
    );
    
    // Check if this is a REF connection
    const isREF = Boolean(isReference) || 
                  (connectionType && connectionType.toLowerCase().includes('ref'));
    
    if (isREF) {
      hasREFConnection = true;
      
      // Add connected pole IDs to the list
      const fromPoleId = getNestedValue<string>(connectionData, ['node_id_1'], '');
      const toPoleId = getNestedValue<string>(connectionData, ['node_id_2'], '');
      
      if (fromPoleId && !connectedPoleIds.includes(fromPoleId)) {
        connectedPoleIds.push(fromPoleId);
      }
      
      if (toPoleId && !connectedPoleIds.includes(toPoleId)) {
        connectedPoleIds.push(toPoleId);
      }
    }
  });
  
  // Update report data if this is a REF sub group
  if (hasREFConnection) {
    reportData.isREFSubGroup = true;
    reportData.connectedPoleIds = connectedPoleIds;
    reportData.refStatus = 'REF';
  }
}

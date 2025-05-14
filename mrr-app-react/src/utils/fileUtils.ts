/**
 * File handling utility functions
 */
import { utils, write } from 'xlsx';
import type { WorkBook } from 'xlsx';
import type { SpidaData, KatapultData, ReportData } from '../types/DataTypes';

/**
 * Reads a JSON file and returns parsed content
 *
 * @param file - The file to read
 * @returns Promise resolving to the parsed JSON
 */
export function readJSONFile<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        // TypeScript needs a non-null assertion here since readAsText can return null
        const result = event.target?.result;
        if (typeof result !== 'string') {
          reject(new Error('Failed to read file as text'));
          return;
        }
        
        const json = JSON.parse(result) as T;
        resolve(json);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Invalid JSON format';
        reject(new Error(`JSON parsing error: ${message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Basic validation for SPIDAcalc file
 *
 * @param spidaData - The parsed SPIDAcalc JSON
 * @throws Error if validation fails
 */
export function validateSpidaFile(spidaData: SpidaData | null): void {
  if (!spidaData) {
    throw new Error('SPIDAcalc data is null or undefined');
  }
  
  // Check for required top-level properties
  if (!spidaData.leads || !Array.isArray(spidaData.leads) || spidaData.leads.length === 0) {
    throw new Error('SPIDAcalc file does not contain any leads data');
  }
  
  if (!spidaData.clientData) {
    throw new Error('SPIDAcalc file does not contain client data');
  }
  
  // Check for locations
  const hasLocations = spidaData.leads.some(lead => 
    lead.locations && Array.isArray(lead.locations) && lead.locations.length > 0
  );
  
  if (!hasLocations) {
    throw new Error('SPIDAcalc file does not contain any locations');
  }
}

/**
 * Basic validation for Katapult file
 *
 * @param katapultData - The parsed Katapult JSON
 * @throws Error if validation fails
 */
export function validateKatapultFile(katapultData: KatapultData | null): void {
  if (!katapultData) {
    throw new Error('Katapult data is null or undefined');
  }
  
  // Check for required top-level properties
  if (!katapultData.nodes || Object.keys(katapultData.nodes).length === 0) {
    throw new Error('Katapult file does not contain any nodes data');
  }
}

/**
 * Interface for grouped pole data
 */
interface GroupedPole {
  key: string;
  operationNumber: number | string;
  attachmentAction: string;
  poleOwner: string;
  poleNumber: string;
  poleStructure: string;
  proposedRiser: string;
  proposedGuy: string;
  pla: string;
  constructionGrade: string;
  lowestCommMidspanHeight: string;
  lowestCPSElectricalMidspanHeight: string;
  midspanFromPole: string;
  midspanToPole: string;
  attachers: Array<{
    description: string;
    existingHeight: string;
    proposedHeight: string;
    existingMidspan: string;
    proposedMidspan: string;
  }>;
  matchStatus: string;
}

/**
 * Creates an Excel file from report data with hierarchical structure
 *
 * @param reportData - Array of report data rows
 */
export function createExcelFile(reportData: ReportData[]): WorkBook {
  // Group data by pole/operation similar to what's done in ResultsDisplay component
  const groupedData: Record<string, GroupedPole> = {};
  
  reportData.forEach((row) => {
    const key = `${row.operationNumber}-${row.poleNumber}`;
    
    if (!groupedData[key]) {
      // Extract proposed riser and guy from proposedFeatures string
      const proposedRiser = row.proposedFeatures.includes('Riser: YES') ? 'YES' : 'NO';
      const proposedGuy = row.proposedFeatures.includes('Guy: YES') ? 'YES' : 'NO';
      
      // Extract PLA value from proposedFeatures string if available
      let pla = '--';
      if (row.proposedFeatures.includes('PLA:')) {
        const match = row.proposedFeatures.match(/PLA: ([\d.]+%)/);
        if (match && match[1]) {
          pla = match[1];
        }
      }
      
      groupedData[key] = {
        key,
        operationNumber: row.operationNumber,
        attachmentAction: row.attachmentAction,
        poleOwner: row.poleOwner,
        poleNumber: row.poleNumber,
        poleStructure: row.poleStructure,
        proposedRiser,
        proposedGuy,
        pla,
        constructionGrade: row.constructionGrade,
        lowestCommMidspanHeight: row.lowestCommMidspanHeight,
        lowestCPSElectricalMidspanHeight: row.lowestCPSElectricalMidspanHeight,
        midspanFromPole: row.midspanFromPole,
        midspanToPole: row.midspanToPole || '--',
        attachers: [],
        matchStatus: row.matchStatus
      };
    }
    
    // If it's the first row for this pole and we have attacher descriptions
    if (groupedData[key].attachers.length === 0) {
      if (row.attacherDescription) {
        // Get all the attacher descriptions without heights
        const attacherLines = row.attacherDescription.split('\n');
        
        // Try to get the cached attachment data from JSON
        const attachmentData = row.attachmentData ? JSON.parse(row.attachmentData) : [];
        
        // Match each attacher line with its cached data if available
        attacherLines.forEach((line, index) => {
          let existingHeight = '';
          let proposedHeight = '';
          
          // If we have cached attachment data, get the heights
          if (attachmentData && attachmentData.length > index) {
            const attachment = attachmentData[index];
            
            // Check if this is a Charter/Spectrum attachment
            const isCharter = line.toLowerCase().includes('charter');
            
            if (isCharter) {
              // For Charter/Spectrum, only show in the proposed column, not existing
              existingHeight = '';
              proposedHeight = attachment.heightStr;
            } else {
              // For other companies, show in the existing column
              existingHeight = attachment.heightStr;
              
              // For first entry (typically other Charter/Spectrum entries), check for moves
              if (index === 0) {
                // Include proposed height only if it's different from existing (indicating a move)
                if (row.existingHeight && row.proposedHeight && row.existingHeight !== row.proposedHeight) {
                  proposedHeight = row.proposedHeight;
                }
              }
            }
          } else {
            // Fallback to original approach if no cached data
            existingHeight = index === 0 ? row.existingHeight : '';
            proposedHeight = (index === 0 && row.proposedHeight && row.existingHeight !== row.proposedHeight) 
              ? row.proposedHeight 
              : '';
          }
          
          groupedData[key].attachers.push({
            description: line,
            existingHeight: existingHeight,
            proposedHeight: proposedHeight,
            existingMidspan: index === 0 ? row.existingMidspan : '',
            proposedMidspan: index === 0 ? row.proposedMidspan : ''
          });
        });
      } else {
        // Fallback to charterSpectrumDescription if attacherDescription is not available
        groupedData[key].attachers.push({
          description: row.charterSpectrumDescription,
          existingHeight: row.existingHeight,
          proposedHeight: row.proposedHeight,
          existingMidspan: row.existingMidspan,
          proposedMidspan: row.proposedMidspan
        });
      }
    }
  });
  
  // Convert to array and sort by operation number
  const sortedData = Object.values(groupedData).sort((a, b) => {
    return Number(a.operationNumber) - Number(b.operationNumber);
  });
  
  // Create Excel data array (rows and cells)
  const excelData: (string | number | null | undefined)[][] = [];
  
  // Add header rows with merged cells
  // Row 1: Main column groups
  excelData.push([
    'Operation Number', 'Attachment Action:\n(I)nstalling\n(R)emovong\n(E)xisting', 
    'Pole Owner', 'Pole #', 'Pole Structure', 
    'Proposed Riser (Yes/No) &', 'Proposed Guy (Yes/No) &', 
    'PLA (%) with proposed attachment', 'Construction Grade of Analysis',
    'Existing Midspan Data', 'Existing Midspan Data', '',
    'Make Ready Data', 'Make Ready Data', 'Make Ready Data', 'Make Ready Data', ''
  ]);
  
  // Row 2: Sub-headers
  excelData.push([
    '', '', '', '', '', '', '', '', '',
    '', '', '',
    '', 'Attachment Height', 'Attachment Height', 'Midspan (same as existing)', ''
  ]);
  
  // Row 3: Sub-sub-headers
  excelData.push([
    '', '', '', '', '', '', '', '', '',
    'Height Lowest Com', 'Height Lowest CPS Electrical', 'From Pole / To Pole',
    "Attacher's Description", 'Existing', 'Proposed', 'Existing', 'Proposed'
  ]);
  
  // Add data rows
  sortedData.forEach((poleData) => {
    const attachers = poleData.attachers;
    
    // If no attachers, add a single row with pole data
    if (attachers.length === 0) {
      excelData.push([
        poleData.operationNumber,
        poleData.attachmentAction,
        poleData.poleOwner,
        poleData.poleNumber,
        poleData.poleStructure,
        poleData.proposedRiser,
        poleData.proposedGuy,
        poleData.pla,
        poleData.constructionGrade,
        poleData.lowestCommMidspanHeight,
        poleData.lowestCPSElectricalMidspanHeight,
        `${poleData.midspanFromPole} / ${poleData.midspanToPole}`,
        'N/A',
        'N/A',
        'N/A',
        'N/A',
        'N/A'
      ]);
    } else {
      // Add one row for each attacher
      attachers.forEach((attacher, attacherIndex) => {
        if (attacherIndex === 0) {
          // First attacher includes all pole data
          excelData.push([
            poleData.operationNumber,
            poleData.attachmentAction,
            poleData.poleOwner,
            poleData.poleNumber,
            poleData.poleStructure,
            poleData.proposedRiser,
            poleData.proposedGuy,
            poleData.pla,
            poleData.constructionGrade,
            poleData.lowestCommMidspanHeight,
            poleData.lowestCPSElectricalMidspanHeight,
            `${poleData.midspanFromPole} / ${poleData.midspanToPole}`,
            attacher.description,
            attacher.existingHeight,
            attacher.proposedHeight,
            attacher.existingMidspan,
            attacher.proposedMidspan
          ]);
        } else {
          // Subsequent attachers only include attacher-specific data
          // For Excel, we need to insert empty cells for the pole data columns
          excelData.push([
            '', '', '', '', '', '', '', '', '', '', '', '',
            attacher.description,
            attacher.existingHeight,
            attacher.proposedHeight,
            attacher.existingMidspan,
            attacher.proposedMidspan
          ]);
        }
      });
    }
    
    // Add an empty row after each operation for better readability
    excelData.push(Array(17).fill(''));
  });
  
  // Create worksheet from data array
  const ws = utils.aoa_to_sheet(excelData);
  
  // Set column widths
  const colWidths = [
    { wch: 15 },  // Operation Number
    { wch: 20 },  // Attachment Action
    { wch: 15 },  // Pole Owner
    { wch: 15 },  // Pole #
    { wch: 25 },  // Pole Structure
    { wch: 20 },  // Proposed Riser
    { wch: 20 },  // Proposed Guy
    { wch: 15 },  // PLA
    { wch: 20 },  // Construction Grade
    { wch: 20 },  // Height Lowest Com
    { wch: 25 },  // Height Lowest CPS Electrical
    { wch: 30 },  // From Pole / To Pole
    { wch: 25 },  // Attacher Description
    { wch: 15 },  // Existing
    { wch: 15 },  // Proposed
    { wch: 15 },  // Existing Mid Span
    { wch: 15 },  // Proposed Mid Span
  ];
  
  ws['!cols'] = colWidths;
  
  // Define merged cell ranges for headers
  ws['!merges'] = [
    // Row 1 merges - columns A through I merged across all three rows
    { s: { r: 0, c: 0 }, e: { r: 2, c: 0 } }, // Operation Number
    { s: { r: 0, c: 1 }, e: { r: 2, c: 1 } }, // Attachment Action
    { s: { r: 0, c: 2 }, e: { r: 2, c: 2 } }, // Pole Owner
    { s: { r: 0, c: 3 }, e: { r: 2, c: 3 } }, // Pole #
    { s: { r: 0, c: 4 }, e: { r: 2, c: 4 } }, // Pole Structure
    { s: { r: 0, c: 5 }, e: { r: 2, c: 5 } }, // Proposed Riser
    { s: { r: 0, c: 6 }, e: { r: 2, c: 6 } }, // Proposed Guy
    { s: { r: 0, c: 7 }, e: { r: 2, c: 7 } }, // PLA
    { s: { r: 0, c: 8 }, e: { r: 2, c: 8 } }, // Construction Grade
    
    // Existing Midspan Data group (columns J-K)
    { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } }, // "Existing Midspan Data" merged across J-K in row 1
    
    // Make Ready Data group (columns L-O)
    { s: { r: 0, c: 12 }, e: { r: 0, c: 15 } }, // "Make Ready Data" merged across L-O in row 1
    { s: { r: 1, c: 13 }, e: { r: 1, c: 14 } }, // "Attachment Height" merged across M-N in row 2
    { s: { r: 1, c: 15 }, e: { r: 1, c: 16 } }, // "Midspan (same as existing)" merged across O-P in row 2
  ];
  
  // Create workbook
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Make-Ready Report');
  
  return wb;
}

/**
 * Trigger Excel file download
 *
 * @param workbook - The Excel workbook to download
 * @param filename - The filename for the downloaded file
 */
export function downloadExcelFile(workbook: WorkBook, filename = 'Make-Ready-Report.xlsx'): void {
  // Generate Excel file as a binary string
  const excelBinary = write(workbook, { bookType: 'xlsx', type: 'binary' });
  
  // Convert binary string to Blob
  const buffer = new ArrayBuffer(excelBinary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < excelBinary.length; i++) {
    view[i] = excelBinary.charCodeAt(i) & 0xFF;
  }
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  
  // Create download link
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 0);
}

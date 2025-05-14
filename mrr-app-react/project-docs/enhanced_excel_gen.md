# Enhanced Excel Generation for Make-Ready Report

Based on the Excel format you've shown, I'll help you modify the Excel generation code to match this specific structure. The format shows:

## Key Structure Differences:

1. **Multiple Attachment Rows per Pole**: Each pole can have multiple attachments (Charter Spectrum, AT&T, CPS, etc.) listed separately
2. **Detailed Attachment Information**: Each attachment shows specific details like "Charter Spectrum Fiber Optic", "AT&T Fiber Optic Com", etc.
3. **Reference Sections**: Special reference rows showing "Ref (North East) to service pole" and similar
4. **Complex Grouping**: Attachments are grouped by pole but each has its own row

## Enhanced Excel Generation Code

```typescript
import { utils, write, WorkBook, WorkSheet } from 'xlsx';
import type { ReportData } from '../types/DataTypes';

interface EnhancedAttachmentRow {
  operationNumber: number | string;
  attachmentAction: string;
  poleOwner: string;
  poleNumber: string;
  poleStructure: string;
  proposedRiser: string;
  proposedGuy: string;
  pla: string;
  constructionGrade: string;
  heightLowestCom: string;
  heightLowestElectrical: string;
  fromPole: string;
  toPole: string;
  attacherDescription: string;
  existingHeight: string;
  proposedHeight: string;
  existingMidspan: string;
  proposedMidspan: string;
  isMainRow: boolean;
  isReference: boolean;
}

export function createEnhancedExcelFile(reportData: ReportData[]): WorkBook {
  console.log(`Generating enhanced Excel file for ${reportData.length} rows...`);
  
  // Transform data to match the expected structure
  const enhancedRows = transformToEnhancedStructure(reportData);
  
  // Create Excel data array
  const excelData: (string | number | null | undefined)[][] = [];
  
  // Add headers with proper structure
  addEnhancedHeaders(excelData);
  
  // Add data rows
  enhancedRows.forEach(row => {
    addEnhancedRowToExcel(excelData, row);
  });
  
  // Create worksheet
  const ws = utils.aoa_to_sheet(excelData);
  
  // Apply formatting and structure
  applyEnhancedFormatting(ws, enhancedRows.length);
  
  // Create workbook
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Make-Ready Report');
  
  return wb;
}

function transformToEnhancedStructure(reportData: ReportData[]): EnhancedAttachmentRow[] {
  const enhancedRows: EnhancedAttachmentRow[] = [];
  
  // Group data by pole
  const poleGroups = new Map<string, ReportData[]>();
  
  reportData.forEach(row => {
    const poleKey = row.poleNumber;
    if (!poleGroups.has(poleKey)) {
      poleGroups.set(poleKey, []);
    }
    poleGroups.get(poleKey)!.push(row);
  });
  
  // Process each pole group
  poleGroups.forEach((poleRows, poleNumber) => {
    const firstRow = poleRows[0];
    let isFirstAttachment = true;
    
    // Get all attachments for this pole
    const attachments = getAttachmentsForPole(poleRows);
    
    // Add main pole row with first attachment
    if (attachments.length > 0) {
      const firstAttachment = attachments[0];
      enhancedRows.push({
        operationNumber: firstRow.operationNumber,
        attachmentAction: firstRow.attachmentAction,
        poleOwner: firstRow.poleOwner,
        poleNumber: firstRow.poleNumber,
        poleStructure: firstRow.poleStructure,
        proposedRiser: extractProposedRiser(firstRow.proposedFeatures),
        proposedGuy: extractProposedGuy(firstRow.proposedFeatures),
        pla: extractPLA(firstRow.proposedFeatures),
        constructionGrade: firstRow.constructionGrade,
        heightLowestCom: firstRow.lowestCommMidspanHeight,
        heightLowestElectrical: firstRow.lowestCPSElectricalMidspanHeight,
        fromPole: firstRow.midspanFromPole,
        toPole: firstRow.midspanToPole || '',
        attacherDescription: firstAttachment.description,
        existingHeight: firstAttachment.existingHeight,
        proposedHeight: firstAttachment.proposedHeight,
        existingMidspan: firstAttachment.existingMidspan,
        proposedMidspan: firstAttachment.proposedMidspan,
        isMainRow: true,
        isReference: false
      });
      
      // Add additional attachments as separate rows
      for (let i = 1; i < attachments.length; i++) {
        const attachment = attachments[i];
        enhancedRows.push({
          operationNumber: '', // Empty for additional rows
          attachmentAction: '',
          poleOwner: '',
          poleNumber: '',
          poleStructure: '',
          proposedRiser: '',
          proposedGuy: '',
          pla: '',
          constructionGrade: '',
          heightLowestCom: '',
          heightLowestElectrical: '',
          fromPole: '',
          toPole: '',
          attacherDescription: attachment.description,
          existingHeight: attachment.existingHeight,
          proposedHeight: attachment.proposedHeight,
          existingMidspan: attachment.existingMidspan,
          proposedMidspan: attachment.proposedMidspan,
          isMainRow: false,
          isReference: false
        });
      }
    }
    
    // Add reference rows if needed
    const referenceRows = generateReferenceRows(firstRow);
    enhancedRows.push(...referenceRows);
  });
  
  return enhancedRows;
}

interface Attachment {
  description: string;
  existingHeight: string;
  proposedHeight: string;
  existingMidspan: string;
  proposedMidspan: string;
  owner: string;
  type: string;
}

function getAttachmentsForPole(poleRows: ReportData[]): Attachment[] {
  const attachments: Attachment[] = [];
  
  // Extract all unique attachments for this pole
  poleRows.forEach(row => {
    if (row.charterSpectrumDescription && row.charterSpectrumDescription !== 'Unknown') {
      attachments.push({
        description: row.charterSpectrumDescription,
        existingHeight: row.existingHeight,
        proposedHeight: row.proposedHeight,
        existingMidspan: row.existingMidspan,
        proposedMidspan: row.proposedMidspan,
        owner: 'Charter Spectrum',
        type: 'Communication'
      });
    }
  });
  
  // Add other attachments based on the data
  // This would need to be enhanced to extract all attachment types
  // from both SPIDAcalc and Katapult data
  
  return attachments;
}

function generateReferenceRows(poleData: ReportData): EnhancedAttachmentRow[] {
  const referenceRows: EnhancedAttachmentRow[] = [];
  
  // Add reference row if there's a "to pole" specified
  if (poleData.midspanToPole && poleData.midspanToPole !== 'Unknown') {
    referenceRows.push({
      operationNumber: '',
      attachmentAction: '',
      poleOwner: '',
      poleNumber: '',
      poleStructure: '',
      proposedRiser: '',
      proposedGuy: '',
      pla: '',
      constructionGrade: '',
      heightLowestCom: '',
      heightLowestElectrical: '',
      fromPole: poleData.midspanFromPole,
      toPole: poleData.midspanToPole,
      attacherDescription: `Ref (Direction) to ${poleData.midspanToPole}`,
      existingHeight: '',
      proposedHeight: '',
      existingMidspan: '',
      proposedMidspan: '',
      isMainRow: false,
      isReference: true
    });
  }
  
  return referenceRows;
}

function extractProposedRiser(proposedFeatures: string): string {
  if (proposedFeatures.includes('Riser: YES')) return 'YES (1)';
  if (proposedFeatures.includes('Riser: NO')) return 'NO';
  return 'NO';
}

function extractProposedGuy(proposedFeatures: string): string {
  if (proposedFeatures.includes('Guy: YES')) return 'YES (1)';
  if (proposedFeatures.includes('Guy: NO')) return 'NO';
  return 'NO';
}

function extractPLA(proposedFeatures: string): string {
  const plaMatch = proposedFeatures.match(/PLA: ([\d.]+%)/);
  return plaMatch ? plaMatch[1] : '--';
}

function addEnhancedHeaders(excelData: (string | number | null | undefined)[][]): void {
  // Row 1: Main headers with merged cells
  excelData.push([
    'Operation Number',
    'Attachment Action:\n(I) Installing\n(R)emovng\n(E)xisting',
    'Pole Owner',
    'Pole #',
    'Pole Structure',
    'Proposed Riser (Yes/No) &',
    'Proposed Guy (Yes/No) &',
    'PLA (%) with proposed attachment',
    'Construction Grade of Analysis',
    'Existing Mid Span Data',
    '',
    '',
    'Make Ready Data',
    '',
    '',
    '',
    ''
  ]);
  
  // Row 2: Sub-headers
  excelData.push([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Height Lowest Com',
    'Height Lowest CPS Electrical',
    'Neutral',
    'Attachment Height',
    '',
    'Mid Span\n(same span as\nexisting)',
    ''
  ]);
  
  // Row 3: Detailed headers
  excelData.push([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'Attacher Description',
    'Existing',
    'Proposed',
    'Existing',
    'Proposed'
  ]);
  
  // Row 4: From/To Pole headers
  excelData.push([
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'From Pole',
    'To Pole',
    '',
    '',
    '',
    ''
  ]);
}

function addEnhancedRowToExcel(
  excelData: (string | number | null | undefined)[][],
  row: EnhancedAttachmentRow
): void {
  if (row.isReference) {
    // Add reference row with special formatting
    excelData.push([
      row.operationNumber,
      row.attachmentAction,
      row.poleOwner,
      row.poleNumber,
      row.poleStructure,
      row.proposedRiser,
      row.proposedGuy,
      row.pla,
      row.constructionGrade,
      row.heightLowestCom,
      row.heightLowestElectrical,
      row.fromPole,
      row.toPole,
      row.attacherDescription,
      row.existingHeight,
      row.proposedHeight,
      row.existingMidspan,
      row.proposedMidspan
    ]);
  } else {
    // Add regular attachment row
    excelData.push([
      row.operationNumber,
      row.attachmentAction,
      row.poleOwner,
      row.poleNumber,
      row.poleStructure,
      row.proposedRiser,
      row.proposedGuy,
      row.pla,
      row.constructionGrade,
      row.heightLowestCom,
      row.heightLowestElectrical,
      '', // Empty cell for better spacing
      '', // Empty cell for better spacing
      row.attacherDescription,
      row.existingHeight,
      row.proposedHeight,
      row.existingMidspan,
      row.proposedMidspan
    ]);
  }
}

function applyEnhancedFormatting(ws: WorkSheet, numDataRows: number): void {
  // Set column widths
  const colWidths = [
    { wch: 12 },  // Operation Number
    { wch: 18 },  // Attachment Action
    { wch: 12 },  // Pole Owner
    { wch: 12 },  // Pole #
    { wch: 22 },  // Pole Structure
    { wch: 18 },  // Proposed Riser
    { wch: 18 },  // Proposed Guy
    { wch: 15 },  // PLA
    { wch: 18 },  // Construction Grade
    { wch: 15 },  // Height Lowest Com
    { wch: 20 },  // Height Lowest CPS
    { wch: 12 },  // From Pole
    { wch: 12 },  // To Pole
    { wch: 25 },  // Attacher Description
    { wch: 12 },  // Existing Height
    { wch: 12 },  // Proposed Height
    { wch: 12 },  // Existing Midspan
    { wch: 12 },  // Proposed Midspan
  ];
  
  ws['!cols'] = colWidths;
  
  // Set merged cells for headers
  ws['!merges'] = [
    // Main header merges
    { s: { r: 0, c: 0 }, e: { r: 3, c: 0 } }, // Operation Number
    { s: { r: 0, c: 1 }, e: { r: 3, c: 1 } }, // Attachment Action
    { s: { r: 0, c: 2 }, e: { r: 3, c: 2 } }, // Pole Owner
    { s: { r: 0, c: 3 }, e: { r: 3, c: 3 } }, // Pole #
    { s: { r: 0, c: 4 }, e: { r: 3, c: 4 } }, // Pole Structure
    { s: { r: 0, c: 5 }, e: { r: 3, c: 5 } }, // Proposed Riser
    { s: { r: 0, c: 6 }, e: { r: 3, c: 6 } }, // Proposed Guy
    { s: { r: 0, c: 7 }, e: { r: 3, c: 7 } }, // PLA
    { s: { r: 0, c: 8 }, e: { r: 3, c: 8 } }, // Construction Grade
    
    // Existing Mid Span Data group
    { s: { r: 0, c: 9 }, e: { r: 0, c: 11 } }, // "Existing Mid Span Data"
    { s: { r: 1, c: 9 }, e: { r: 3, c: 9 } }, // Height Lowest Com
    { s: { r: 1, c: 10 }, e: { r: 3, c: 10 } }, // Height Lowest CPS
    { s: { r: 1, c: 11 }, e: { r: 2, c: 11 } }, // Neutral
    
    // From/To Pole headers
    { s: { r: 3, c: 11 }, e: { r: 3, c: 11 } }, // From Pole
    { s: { r: 3, c: 12 }, e: { r: 3, c: 12 } }, // To Pole
    
    // Make Ready Data group
    { s: { r: 0, c: 12 }, e: { r: 0, c: 17 } }, // "Make Ready Data"
    { s: { r: 1, c: 12 }, e: { r: 1, c: 13 } }, // Attachment Height
    { s: { r: 1, c: 14 }, e: { r: 1, c: 17 } }, // Mid Span
    { s: { r: 2, c: 12 }, e: { r: 3, c: 12 } }, // Attacher Description
    { s: { r: 2, c: 13 }, e: { r: 3, c: 13 } }, // Existing
    { s: { r: 2, c: 14 }, e: { r: 3, c: 14 } }, // Proposed
    { s: { r: 2, c: 15 }, e: { r: 3, c: 15 } }, // Existing
    { s: { r: 2, c: 16 }, e: { r: 3, c: 16 } }, // Proposed
  ];
  
  // Freeze panes at row 5 (after headers)
  ws['!freeze'] = { r: 4, c: 0 };
}

// Export the enhanced function
export { createEnhancedExcelFile };
```

## Key Changes to Make:

1. **Update your main Excel generation call**:
```typescript
// In fileUtils.ts, replace createExcelFile with:
export function createExcelFile(reportData: ReportData[]): WorkBook {
  return createEnhancedExcelFile(reportData);
}
```

2. **Enhance data extraction** to capture all attachment types (not just Charter):
- Extract all CPS attachments (Neutral, Supply Fiber, Secondary, etc.)
- Extract all communication attachments (AT&T, Charter Spectrum, etc.)
- Create separate rows for each attachment type

3. **Add reference row generation** based on span connectivity

4. **Update the report generator** to extract more detailed attachment information from both SPIDAcalc and Katapult sources

This will create an Excel file that matches the structure shown in your image, with proper grouping, multiple attachment rows per pole, and reference sections.
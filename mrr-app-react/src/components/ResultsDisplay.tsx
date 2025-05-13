import React, { useMemo } from 'react';
import type { ReportData } from '../types/DataTypes';

interface ResultsSummary {
  totalPoles: number;
  matchedPoles: number;
  unmatchedSpidaPoles: number;
  katapultOnlyPoles: number;
  totalRows: number;
}

interface ResultsDisplayProps {
  isVisible: boolean;
  reportData: ReportData[];
  summary: ResultsSummary;
  onDownload: () => void;
  isDownloadEnabled: boolean;
}

// Interface for grouped pole data
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

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  isVisible,
  reportData,
  summary,
  onDownload,
  isDownloadEnabled
}) => {
  // Group the report data by pole/operation - hooks must be called unconditionally at the top level
  const groupedData = useMemo(() => {
    const groups: Record<string, GroupedPole> = {};
    
    reportData.forEach((row) => {
      const key = `${row.operationNumber}-${row.poleNumber}`;
      
      if (!groups[key]) {
        groups[key] = {
          key,
          operationNumber: row.operationNumber,
          attachmentAction: row.attachmentAction,
          poleOwner: row.poleOwner,
          poleNumber: row.poleNumber,
          poleStructure: row.poleStructure,
          proposedRiser: row.proposedFeatures.includes('Riser: YES') ? 'YES' : 'NO',
          proposedGuy: row.proposedFeatures.includes('Guy: YES') ? 'YES' : 'NO',
          pla: row.proposedFeatures.includes('PLA:') ? 
            row.proposedFeatures.match(/PLA: ([\d.]+%)/)?.[1] || '--' : '--',
          constructionGrade: row.constructionGrade,
          lowestCommMidspanHeight: row.lowestCommMidspanHeight,
          lowestCPSElectricalMidspanHeight: row.lowestCPSElectricalMidspanHeight,
          midspanFromPole: row.midspanFromPole,
          midspanToPole: row.midspanToPole || '--',
          attachers: [],
          matchStatus: row.matchStatus
        };
      }
      
      // Add attacher information
      groups[key].attachers.push({
        description: row.charterSpectrumDescription,
        existingHeight: row.existingHeight,
        proposedHeight: row.proposedHeight,
        existingMidspan: row.existingMidspan,
        proposedMidspan: row.proposedMidspan
      });
    });
    
    // Convert to array and sort by operation number
    return Object.values(groups).sort((a, b) => {
      return Number(a.operationNumber) - Number(b.operationNumber);
    });
  }, [reportData]);

  // Early return if component should not be visible
  if (!isVisible) return null;
  
  return (
    <div className="results-container">
      <h2>Results</h2>
      
      <div id="resultsSummary">
        <p><strong>Report Generation Complete</strong></p>
        <ul>
          <li>Total poles processed: {summary.totalPoles}</li>
          <li>Full matches: {summary.matchedPoles}</li>
          <li>SPIDA-only poles: {summary.unmatchedSpidaPoles}</li>
          <li>Katapult-only poles: {summary.katapultOnlyPoles}</li>
          <li>Total report rows: {summary.totalRows}</li>
        </ul>
        <p>The report includes match status information for each pole.</p>
      </div>
      
      <div id="resultsTableContainer" className="results-table-container">
        {groupedData.length > 0 && (
          <table className="results-table">
            <thead>
              <tr>
                <th rowSpan={3}>Operation Number</th>
                <th rowSpan={3}>Attachment Action:<br/>(I)nstalling<br/>(R)emovong<br/>(E)xisting</th>
                <th rowSpan={3}>Pole Owner</th>
                <th rowSpan={3}>Pole #</th>
                <th rowSpan={3}>Pole Structure</th>
                <th rowSpan={3}>Proposed Riser (Yes/No) &</th>
                <th rowSpan={3}>Proposed Guy (Yes/No) &</th>
                <th rowSpan={3}>PLA (%) with proposed attachment</th>
                <th rowSpan={3}>Construction Grade of Analysis</th>
                <th colSpan={3}>Existing Mid Span Data</th>
                <th colSpan={5}>Make Ready Data</th>
              </tr>
              <tr>
                <th rowSpan={2}>Height Lowest Com</th>
                <th rowSpan={2}>Height Lowest CPS Electrical</th>
                <th rowSpan={1}>From Pole / To Pole</th>
                <th rowSpan={2}>Attacher Description</th>
                <th rowSpan={2}>Existing</th>
                <th rowSpan={2}>Proposed</th>
                <th colSpan={2}>Mid Span<br/>(same span as existing)</th>
              </tr>
              <tr>
                <th></th>
                <th>Existing</th>
                <th>Proposed</th>
              </tr>
            </thead>
            <tbody>
              {groupedData.map((poleData) => {
                // Get the list of attachers
                const attachers = poleData.attachers;
                
                // If no attachers, add a single row with pole data
                if (attachers.length === 0) {
                  return (
                    <tr key={poleData.key} className={`operation-group ${poleData.matchStatus === 'Full Match' ? 'full-match' : 'partial-match'}`}>
                      <td>{poleData.operationNumber}</td>
                      <td>{poleData.attachmentAction}</td>
                      <td>{poleData.poleOwner}</td>
                      <td>{poleData.poleNumber}</td>
                      <td>{poleData.poleStructure}</td>
                      <td>{poleData.proposedRiser}</td>
                      <td>{poleData.proposedGuy}</td>
                      <td>{poleData.pla}</td>
                      <td>{poleData.constructionGrade}</td>
                      <td>{poleData.lowestCommMidspanHeight}</td>
                      <td>{poleData.lowestCPSElectricalMidspanHeight}</td>
                      <td>{`${poleData.midspanFromPole} / ${poleData.midspanToPole}`}</td>
                      <td>N/A</td>
                      <td>N/A</td>
                      <td>N/A</td>
                      <td>N/A</td>
                      <td>N/A</td>
                    </tr>
                  );
                }
                
                // Create a set of rows for this pole - one for each attacher
                return (
                  <React.Fragment key={poleData.key}>
                    {attachers.map((attacher, attacherIndex) => {
                      // For first attacher, include all pole data
                      if (attacherIndex === 0) {
                        return (
                          <tr key={`${poleData.key}-attacher-${attacherIndex}`} 
                              className={`operation-group first-attacher ${poleData.matchStatus === 'Full Match' ? 'full-match' : 'partial-match'}`}>
                            <td>{poleData.operationNumber}</td>
                            <td>{poleData.attachmentAction}</td>
                            <td>{poleData.poleOwner}</td>
                            <td>{poleData.poleNumber}</td>
                            <td>{poleData.poleStructure}</td>
                            <td>{poleData.proposedRiser}</td>
                            <td>{poleData.proposedGuy}</td>
                            <td>{poleData.pla}</td>
                            <td>{poleData.constructionGrade}</td>
                            <td>{poleData.lowestCommMidspanHeight}</td>
                            <td>{poleData.lowestCPSElectricalMidspanHeight}</td>
                            <td>{`${poleData.midspanFromPole} / ${poleData.midspanToPole}`}</td>
                            <td>{attacher.description}</td>
                            <td>{attacher.existingHeight}</td>
                            <td>{attacher.proposedHeight}</td>
                            <td>{attacher.existingMidspan}</td>
                            <td>{attacher.proposedMidspan}</td>
                          </tr>
                        );
                      } else {
                        // For subsequent attachers, only include attacher-specific data
                        return (
                          <tr key={`${poleData.key}-attacher-${attacherIndex}`} 
                              className="operation-group additional-attacher">
                            <td colSpan={12}></td>
                            <td>{attacher.description}</td>
                            <td>{attacher.existingHeight}</td>
                            <td>{attacher.proposedHeight}</td>
                            <td>{attacher.existingMidspan}</td>
                            <td>{attacher.proposedMidspan}</td>
                          </tr>
                        );
                      }
                    })}
                    {/* Add a separator row after each pole's set of attachers */}
                    <tr className="separator-row">
                      <td colSpan={17}></td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      
      <button 
        id="downloadBtn"
        onClick={onDownload}
        disabled={!isDownloadEnabled}
      >
        Download Excel Report
      </button>
    </div>
  );
};

export default ResultsDisplay;

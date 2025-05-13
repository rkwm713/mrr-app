/**
 * Factory class for creating report data objects with default values
 */
import type { ReportData } from '../../types/DataTypes';
import { getDefaultValue } from '../dataUtils';

/**
 * Factory class for creating report data objects with default values
 */
export class ReportDataFactory {
  /**
   * Creates an empty report data object with default values
   */
  static createEmptyReportData(operationNumber: number): ReportData {
    return {
      matchStatus: '',
      operationNumber,
      attachmentAction: getDefaultValue('unknown'),
      poleOwner: getDefaultValue('unknown'),
      poleNumber: getDefaultValue('unknown'),
      poleStructure: getDefaultValue('unknown'),
      proposedFeatures: '',
      constructionGrade: getDefaultValue('unknown'),
      lowestCommMidspanHeight: getDefaultValue('unknown'),
      lowestCPSElectricalMidspanHeight: getDefaultValue('unknown'),
      midspanFromPole: getDefaultValue('unknown'),
      midspanToPole: getDefaultValue('unknown'),
      charterSpectrumDescription: getDefaultValue('unknown'),
      existingHeight: getDefaultValue('not-applicable'),
      proposedHeight: getDefaultValue('not-applicable'),
      existingMidspan: getDefaultValue('not-applicable'),
      proposedMidspan: getDefaultValue('not-applicable')
    };
  }
}

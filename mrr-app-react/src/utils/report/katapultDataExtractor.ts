/**
 * Utility class for extracting data from Katapult source
 */
import type { ReportData } from '../../types/DataTypes';
import { getNestedValue, getDefaultValue, isCharterSpectrum, parseImperialMeasurement } from '../dataUtils';
import { ReportDataFactory } from './reportDataFactory';

/**
 * Utility class for extracting data from Katapult source
 */
export class KatapultDataExtractor {
  /**
   * Extracts data for a Katapult-only pole
   */
  static extractKatapultOnlyPoleData(
    katapultNode: Record<string, unknown>,
    operationNumber: number
  ): ReportData {
    // Initialize with default values
    const reportData = ReportDataFactory.createEmptyReportData(operationNumber);
    reportData.attachmentAction = 'I'; // Assume installing for Katapult-only poles
    reportData.constructionGrade = getDefaultValue('not-applicable'); // Can't get from Katapult
    
    // Extract Pole Number
    reportData.poleNumber = this.getPoleNumber(katapultNode) || getDefaultValue('unknown');
    
    // Extract Pole Owner
    reportData.poleOwner = this.getPoleOwner(katapultNode) || getDefaultValue('unknown');
    
    // Set midspanFromPole if we have a pole number
    if (reportData.poleNumber !== getDefaultValue('unknown')) {
      reportData.midspanFromPole = reportData.poleNumber;
    }
    
    // Fill in proposed features from Katapult attributes if available
    reportData.proposedFeatures = this.getProposedFeatures(katapultNode);
    
    // Extract mid-span heights if available
    this.extractMidspanHeights(reportData, katapultNode);
    
    return reportData;
  }

  /**
   * Get pole number from various possible Katapult attributes
   */
  static getPoleNumber(katapultNode: Record<string, unknown>): string | null {
    const possiblePoleNumberPaths = [
      ['attributes', 'PoleNumber', '-Imported'],
      ['attributes', 'electric_pole_tag', 'assessment'],
      ['attributes', 'DLOC_number', '-Imported'],
      ['attributes', 'pole_number', '-Imported'],
      ['attributes', 'pole_id', '-Imported'],
      ['attributes', 'pole_tag', 'assessment']
    ];
    
    for (const path of possiblePoleNumberPaths) {
      const poleNumber = getNestedValue<string>(katapultNode, path, null);
      if (poleNumber) {
        return poleNumber;
      }
    }
    
    return null;
  }

  /**
   * Get pole owner from Katapult attributes
   */
  static getPoleOwner(katapultNode: Record<string, unknown>): string | null {
    return getNestedValue<string>(katapultNode, ['attributes', 'pole_owner', '-Imported'], null) ||
           getNestedValue<string>(katapultNode, ['attributes', 'pole_owner', 'one'], null) ||
           getNestedValue<string>(katapultNode, ['attributes', 'pole_owner', 'multi_added'], null) ||
           getNestedValue<string>(katapultNode, ['attributes', 'pole_owner_name', '-Imported'], null);
  }

  /**
   * Get proposed features string from Katapult attributes
   */
  static getProposedFeatures(katapultNode: Record<string, unknown>): string {
    const features: string[] = [];
    
    // Check for proposed riser
    const hasRiser = getNestedValue<boolean>(katapultNode, ['attributes', 'riser', 'button_added'], false);
    features.push(`Riser: ${hasRiser ? 'YES' : 'NO'}`);
    
    // Check for proposed guy
    const hasGuy = getNestedValue<boolean>(katapultNode, ['attributes', 'down_guy', 'button_added'], false);
    features.push(`Guy: ${hasGuy ? 'YES' : 'NO'}`);
    
    // Can't get PLA from Katapult
    features.push('PLA: --');
    
    return features.join(', ');
  }

  /**
   * Extracts mid-span heights from connection sections and annotations
   */
  static extractMidspanHeights(
    reportData: ReportData,
    katapultData: Record<string, unknown>
  ): void {
    // Find the lowest communication and electrical mid-span heights
    let lowestCommHeight: number | null = null;
    let lowestElectricalHeight: number | null = null;
    
    // Get connections from Katapult data
    const connections = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultData, 
      ['connections'], 
      null
    );
    
    if (!connections) {
      return;
    }
    
    // Examine each connection
    Object.values(connections).forEach(connection => {
      // Get sections from connection
      const sections = getNestedValue<Record<string, Record<string, unknown>>>(
        connection, 
        ['sections'], 
        null
      );
      
      if (!sections) {
        return;
      }
      
      // Examine each section
      Object.values(sections).forEach(section => {
        // Get annotations from section
        const annotations = getNestedValue<Record<string, Record<string, unknown>>>(
          section, 
          ['annotations'], 
          null
        );
        
        if (!annotations) {
          return;
        }
        
        // Examine each annotation
        Object.values(annotations).forEach(annotation => {
          // Get equipment type and owner
          const equipmentType = getNestedValue<string>(
            annotation, 
            ['attributes', 'equipment_type', 'button_added'], 
            null
          );
          
          const ownerName = getNestedValue<string>(
            annotation, 
            ['attributes', 'owner_name', 'one'], 
            null
          );
          
          // Get height from annotation
          const heightFtDecimal = getNestedValue<number>(
            annotation, 
            ['height_ft_decimal'], 
            null
          );
          
          const measuredHeightFt = getNestedValue<string>(
            annotation, 
            ['measured_height_ft'], 
            null
          );
          
          // Use the decimal height if available, otherwise parse the string height
          let heightInFeet: number | null = null;
          if (heightFtDecimal !== null) {
            heightInFeet = heightFtDecimal;
          } else if (measuredHeightFt) {
            heightInFeet = parseImperialMeasurement(measuredHeightFt);
          }
          
          if (heightInFeet === null) {
            return;
          }
          
          // Check if this is a communications or electrical annotation
          const isCommWire = equipmentType === 'Communication' || 
                            equipmentType?.includes('Communication') || 
                            equipmentType?.includes('CATV');
          
          const isElectricalWire = (equipmentType === 'Primary' || 
                                  equipmentType?.includes('Secondary') || 
                                  equipmentType?.includes('Neutral') || 
                                  equipmentType?.includes('Service')) && 
                                  ownerName?.includes('CPS');
          
          // Update lowest heights if applicable
          if (isCommWire && (lowestCommHeight === null || heightInFeet < lowestCommHeight)) {
            lowestCommHeight = heightInFeet;
          }
          
          if (isElectricalWire && (lowestElectricalHeight === null || heightInFeet < lowestElectricalHeight)) {
            lowestElectricalHeight = heightInFeet;
          }
        });
      });
    });
    
    // Set the height values in the report data
    if (lowestCommHeight !== null) {
      reportData.lowestCommMidspanHeight = `${(lowestCommHeight as number).toFixed(1)}'`;
    }
    
    if (lowestElectricalHeight !== null) {
      reportData.lowestCPSElectricalMidspanHeight = `${(lowestElectricalHeight as number).toFixed(1)}'`;
    }
  }

  /**
   * Checks Katapult for proposed Charter/Spectrum traces or equipment
   */
  static checkForProposedCharter(katapultNode: Record<string, unknown>): boolean {
    // First check if there are traces marked as proposed for Charter/Spectrum
    const traces = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultNode, 
      ['traces', 'trace_data'], 
      null
    );
    
    if (traces) {
      const hasProposedTrace = Object.values(traces).some(trace => {
        const company = getNestedValue<string>(trace, ['company'], '');
        const proposed = getNestedValue<boolean>(trace, ['proposed'], false);
        return proposed && isCharterSpectrum(company);
      });
      
      if (hasProposedTrace) {
        return true;
      }
    }
    
    // Next check for equipment with "proposed: true" flag
    const equipment = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultNode, 
      ['attributes', 'equipment'], 
      null
    );
    
    if (equipment) {
      return Object.values(equipment).some(equip => {
        const companyName = getNestedValue<string>(equip, ['company_name', 'one'], '') || 
                           getNestedValue<string>(equip, ['owner_name', 'one'], '');
        const proposed = getNestedValue<boolean>(equip, ['proposed'], false);
        
        return proposed && isCharterSpectrum(companyName);
      });
    }
    
    return false;
  }

  /**
   * Checks Katapult for relocated Charter/Spectrum attachments
   */
  static checkForRelocatedCharter(katapultNode: Record<string, unknown>): boolean {
    // Check if there are wires with mr_move flag for Charter/Spectrum
    const photos = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultNode, 
      ['photos'], 
      null
    );
    
    if (!photos) {
      return false;
    }
    
    // Check in photofirst_data for wires with mr_move
    const hasRelocatedWire = Object.values(photos).some(photo => {
      const photofirstData = getNestedValue<Record<string, Record<string, unknown>>>(
        photo, 
        ['photofirst_data'], 
        null
      );
      
      if (!photofirstData) {
        return false;
      }
      
      const wires = getNestedValue<Record<string, Record<string, unknown>>>(
        photofirstData, 
        ['wire'], 
        null
      );
      
      if (!wires) {
        return false;
      }
      
      return Object.values(wires).some(wire => {
        const company = getNestedValue<string>(wire, ['company'], '');
        const mrMove = getNestedValue<number>(wire, ['mr_move'], 0);
        return mrMove !== 0 && isCharterSpectrum(company);
      });
    });
    
    if (hasRelocatedWire) {
      return true;
    }
    
    // Also check in equipment attributes
    const equipment = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultNode, 
      ['attributes', 'equipment'], 
      null
    );
    
    if (equipment) {
      return Object.values(equipment).some(equip => {
        const companyName = getNestedValue<string>(equip, ['company_name', 'one'], '') || 
                           getNestedValue<string>(equip, ['owner_name', 'one'], '');
        const mrMove = getNestedValue<number>(equip, ['mr_move'], 0);
        
        return mrMove !== 0 && isCharterSpectrum(companyName);
      });
    }
    
    return false;
  }

  /**
   * Extract Charter/Spectrum attachment data from Katapult
   */
  static getCharterAttachmentData(
    katapultNode: Record<string, unknown>, 
    reportData: ReportData
  ): void {
    // Look for Charter/Spectrum equipment
    const equipment = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultNode, 
      ['attributes', 'equipment'], 
      null
    );
    
    if (!equipment) {
      return;
    }
    
    // Find Charter/Spectrum equipment
    const charterEquipment = Object.values(equipment).filter(equip => {
      const companyName = getNestedValue<string>(equip, ['company_name', 'one'], '') || 
                         getNestedValue<string>(equip, ['owner_name', 'one'], '');
      return isCharterSpectrum(companyName);
    });
    
    if (charterEquipment.length === 0) {
      return;
    }
    
    // Sort by proposed flag, taking proposed items first
    const sortedEquipment = [...charterEquipment].sort((a, b) => {
      const aProposed = getNestedValue<boolean>(a, ['proposed'], false) ? 1 : 0;
      const bProposed = getNestedValue<boolean>(b, ['proposed'], false) ? 1 : 0;
      return bProposed - aProposed;
    });
    
    const primaryEquipment = sortedEquipment[0];
    
    // Set description
    const conductorType = getNestedValue<string>(primaryEquipment, ['conductor_type', 'button_added'], null);
    const equipmentType = getNestedValue<string>(primaryEquipment, ['equipment_type', 'button_added'], null);
    
    if (conductorType && equipmentType) {
      reportData.charterSpectrumDescription = `${conductorType} ${equipmentType}`;
    } else if (conductorType) {
      reportData.charterSpectrumDescription = conductorType;
    } else if (equipmentType) {
      reportData.charterSpectrumDescription = equipmentType;
    } else {
      reportData.charterSpectrumDescription = 'Charter/Spectrum Attachment';
    }
    
    // Get attachment height
    const attachmentHeightStr = getNestedValue<string>(primaryEquipment, ['attachment_height_ft'], null);
    if (attachmentHeightStr) {
      const heightFeet = parseImperialMeasurement(attachmentHeightStr);
      if (heightFeet !== null) {
        if (getNestedValue<boolean>(primaryEquipment, ['proposed'], false)) {
          reportData.proposedHeight = `${heightFeet.toFixed(1)}'`;
        } else {
          reportData.existingHeight = `${heightFeet.toFixed(1)}'`;
        }
      }
    }
    
    // Get midspan height - requires finding the corresponding section data
    this.findCharterMidspanData(katapultNode, reportData);
  }

  /**
   * Find Charter/Spectrum midspan data
   */
  static findCharterMidspanData(
    katapultNode: Record<string, unknown>,
    reportData: ReportData
  ): void {
    // Get connections from Katapult data
    const connections = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultNode, 
      ['connections'], 
      null
    );
    
    if (!connections) {
      return;
    }
    
    // Examine each connection
    Object.values(connections).forEach(connection => {
      // Get sections from connection
      const sections = getNestedValue<Record<string, Record<string, unknown>>>(
        connection, 
        ['sections'], 
        null
      );
      
      if (!sections) {
        return;
      }
      
      // Examine each section
      Object.values(sections).forEach(section => {
        // Get annotations from section
        const annotations = getNestedValue<Record<string, Record<string, unknown>>>(
          section, 
          ['annotations'], 
          null
        );
        
        if (!annotations) {
          return;
        }
        
        // Examine each annotation
        Object.values(annotations).forEach(annotation => {
          // Check if this is a Charter/Spectrum annotation
          const ownerName = getNestedValue<string>(
            annotation, 
            ['attributes', 'owner_name', 'one'], 
            null
          );
          
          if (!ownerName || !isCharterSpectrum(ownerName)) {
            return;
          }
          
          // Get height from annotation
          const heightFtDecimal = getNestedValue<number>(
            annotation, 
            ['height_ft_decimal'], 
            null
          );
          
          const measuredHeightFt = getNestedValue<string>(
            annotation, 
            ['measured_height_ft'], 
            null
          );
          
          // Use the decimal height if available, otherwise parse the string height
          let heightInFeet: number | null = null;
          if (heightFtDecimal !== null) {
            heightInFeet = heightFtDecimal;
          } else if (measuredHeightFt) {
            heightInFeet = parseImperialMeasurement(measuredHeightFt);
          }
          
          if (heightInFeet === null) {
            return;
          }
          
          // Check if this is an existing or proposed attachment
          const proposed = getNestedValue<boolean>(
            annotation, 
            ['proposed'], 
            false
          );
          
          // Set the appropriate midspan height
          if (proposed) {
            reportData.proposedMidspan = `${heightInFeet.toFixed(1)}'`;
          } else {
            reportData.existingMidspan = `${heightInFeet.toFixed(1)}'`;
          }
        });
      });
    });
  }
}

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
    // Pass the reportData so the individual feature fields (like proposedRiser) get set
    reportData.proposedFeatures = this.getProposedFeatures(katapultNode, reportData);
    
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
   * Get pole structure information (species & class)
   */
  static getPoleStructure(katapultNode: Record<string, unknown>): string | null {
    // Get pole species from attributes
    const species = getNestedValue<string>(katapultNode, ['attributes', 'pole_species', 'one'], null) ||
                   getNestedValue<string>(katapultNode, ['attributes', 'pole_species', '-Imported'], null);
    
    // Get pole class from attributes
    const poleClass = getNestedValue<string>(katapultNode, ['attributes', 'pole_class', 'one'], null) ||
                     getNestedValue<string>(katapultNode, ['attributes', 'pole_class', '-Imported'], null);
    
    // Get pole height if available
    const height = getNestedValue<string>(katapultNode, ['attributes', 'pole_height', 'one'], null) ||
                  getNestedValue<string>(katapultNode, ['attributes', 'pole_height', '-Imported'], null);
    
    // Check birthmark_brand for additional data if not found in direct attributes
    if (!species || !poleClass) {
      // Get the birthmark_brand data which might contain pole specifications
      const birthmarkBrand = getNestedValue<Record<string, Record<string, unknown>>>(
        katapultNode, 
        ['attributes', 'birthmark_brand'], 
        null
      );
      
      if (birthmarkBrand) {
        // Get the first entry in the birthmark_brand object
        const brandEntry = Object.values(birthmarkBrand)[0];
        
        // Extract species and class from birthmark_brand
        const brandSpecies = getNestedValue<string>(brandEntry, ['pole_species'], null) ||
                           getNestedValue<string>(brandEntry, ['pole_species*'], null);
        
        const brandClass = getNestedValue<string>(brandEntry, ['pole_class'], null);
        const brandHeight = getNestedValue<string>(brandEntry, ['pole_height'], null);
        
        // Use birthmark data if direct attributes were not available
        const finalSpecies = species || brandSpecies;
        const finalClass = poleClass || brandClass;
        const finalHeight = height || brandHeight;
        
        // Format and return if we have both species and class
        if (finalSpecies && finalClass) {
          // Convert abbreviations if needed (e.g., "SPC" to "Southern Pine")
          const expandedSpecies = this.expandSpeciesAbbreviation(finalSpecies);
          
          // Format as "height-class species" (e.g., "40-4 Southern Pine")
          if (finalHeight) {
            return `${finalHeight}-${finalClass} ${expandedSpecies}`;
          } else {
            return `${finalClass} ${expandedSpecies}`;
          }
        }
      }
    } else if (species && poleClass) {
      // If we already have direct attributes, format and return
      const expandedSpecies = this.expandSpeciesAbbreviation(species);
      
      // Format as "height-class species" (e.g., "40-4 Southern Pine")
      if (height) {
        return `${height}-${poleClass} ${expandedSpecies}`;
      } else {
        return `${poleClass} ${expandedSpecies}`;
      }
    }
    
    return null;
  }
  
  /**
   * Expands species abbreviation to full name
   */
  private static expandSpeciesAbbreviation(abbr: string): string {
    const speciesMap: Record<string, string> = {
      'SPC': 'Southern Pine',
      'WRC': 'Western Red Cedar',
      'DF': 'Douglas Fir',
      'LP': 'Lodgepole Pine'
    };
    
    // Check if it's a known abbreviation
    const upperAbbr = abbr.toUpperCase();
    if (upperAbbr in speciesMap) {
      return speciesMap[upperAbbr];
    }
    
    // If not a known abbreviation, return the original
    return abbr;
  }

  /**
   * Get proposed features string from Katapult attributes and set individual feature fields
   */
  static getProposedFeatures(katapultNode: Record<string, unknown>, reportData?: ReportData): string {
    const features: string[] = [];
    
    // Check for proposed riser (general case for 'proposedFeatures' string)
    const hasRiser = getNestedValue<boolean>(katapultNode, ['attributes', 'riser', 'button_added'], false);
    features.push(`Riser: ${hasRiser ? 'YES' : 'NO'}`);
    
    // For the dedicated proposedRiser field, we need to check specifically for Charter/Spectrum risers
    if (reportData) {
      // Check equipment to see if there's a Charter/Spectrum riser
      const hasCharterRiser = this.checkForCharterRiser(katapultNode);
      reportData.proposedRiser = hasCharterRiser ? 'Yes' : 'No';
    }
    
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
   * Checks for Charter/Spectrum riser in Katapult data
   * 
   * For Katapult, a riser is considered to be "added by Charter" if any of these are true:
   * 1. There's equipment with company_name/owner_name = Charter, equipment_type = Riser, and proposed = true
   * 2. There's an equipment inventory item with company_name = Charter, make_ready_item_type = Riser, and action = Add
   *    - Specifically using path nodes.[node_id].equipment.equipment_inventory.[inv_id].attachments.[att_id].attributes
   * 3. There's a make-ready note containing text like "Charter: Add riser" or "Charter adding a riser"
   */
  static checkForCharterRiser(katapultNode: Record<string, unknown>): boolean {
    // Method 1: Check direct equipment in attributes (higher level)
    const directEquipment = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultNode, 
      ['attributes', 'equipment'], 
      null
    );
    
    if (directEquipment) {
      console.log('Checking direct equipment in attributes');
      
      const hasCharterRiserInEquipment = Object.values(directEquipment).some(equip => {
        // Check that it's owned by Charter/Spectrum
        const companyName = getNestedValue<string>(equip, ['company_name', 'one'], '') || 
                           getNestedValue<string>(equip, ['owner_name', 'one'], '');
        
        if (!companyName) {
          return false;
        }
        
        // Log for debugging
        console.log('Checking Katapult equipment company name:', companyName);
        
        if (!isCharterSpectrum(companyName)) {
          return false;
        }
        
        // Check if it's a riser - look for various possible field paths
        const equipmentType = getNestedValue<string>(equip, ['equipment_type', 'button_added'], '') || 
                             getNestedValue<string>(equip, ['equipment_type', 'one'], '') ||
                             getNestedValue<string>(equip, ['make_ready_item_type', 'button_added'], '') ||
                             getNestedValue<string>(equip, ['make_ready_item_type', 'one'], '') ||
                             getNestedValue<string>(equip, ['description', 'one'], '');
        
        console.log('  Equipment type:', equipmentType);
        
        // Case-insensitive check for 'riser'
        const isRiser = equipmentType ? equipmentType.toLowerCase().includes('riser') : false;
        if (!isRiser) {
          return false;
        }
        
        // Check if it's proposed through various flags
        const proposed = getNestedValue<boolean>(equip, ['proposed'], false);
        const action = getNestedValue<string>(equip, ['action'], '');
        // Case-insensitive check for 'add'
        const isAdd = action ? action.toLowerCase() === 'add' : false;
        
        console.log('  Is proposed:', proposed, 'Action:', action);
        
        return proposed || isAdd;
      });
      
      if (hasCharterRiserInEquipment) {
        console.log('Found Charter riser in direct equipment attributes');
        return true;
      }
    }
    
    // Method 2: Check equipment_inventory for explicit "Add" actions
    // Path from example: nodes.[node_id].equipment.equipment_inventory.[inv_id].attachments.[att_id].attributes
    const inventoryEquipment = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultNode, 
      ['equipment', 'equipment_inventory'], 
      null
    );
    
    if (inventoryEquipment) {
      console.log('Checking equipment inventory');
      
      for (const [invId, inventoryItem] of Object.entries(inventoryEquipment)) {
        console.log(`Checking inventory item: ${invId}`);
        
        const attachments = getNestedValue<Record<string, Record<string, unknown>>>(
          inventoryItem, 
          ['attachments'], 
          null
        );
        
        if (!attachments) {
          continue;
        }
        
        for (const [attId, attachment] of Object.entries(attachments)) {
          console.log(`Checking attachment: ${attId}`);
          
          const attributes = getNestedValue<Record<string, unknown>>(
            attachment, 
            ['attributes'], 
            null
          );
          
          if (!attributes) {
            continue;
          }
          
          // Check company name - EXACT field from example
          const companyName = getNestedValue<string>(attributes, ['company_name'], '');
          console.log(`Company name: ${companyName}`);
          
          if (!companyName || !isCharterSpectrum(companyName)) {
            continue;
          }
          
          // Check if it's a riser - EXACT fields from example
          const makeReadyItemType = getNestedValue<string>(attributes, ['make_ready_item_type'], '');
          const description = getNestedValue<string>(attributes, ['description'], '');
          
          // Log for debugging
          console.log('Checking inventory attachment:', {
            company: companyName,
            type: makeReadyItemType,
            description: description
          });
          
          // Case-insensitive check for "riser"
          const isRiser = (makeReadyItemType ? makeReadyItemType.toLowerCase() === 'riser' : false) || 
                         (description ? description.toLowerCase() === 'riser' : false);
          
          if (!isRiser) {
            continue;
          }
          
          // Check action - EXACT field from example
          const action = getNestedValue<string>(attributes, ['action'], '');
          // Case-insensitive check for "Add"
          if (action && action.toLowerCase() === 'add') {
            console.log('Found Charter riser with "Add" action in equipment inventory attachment');
            console.log('Attachment details:', attributes);
            return true;
          }
        }
      }
    }
    
    // Method 3: Check make-ready notes for explicit mention of Charter adding a riser
    console.log('Checking make-ready notes');
    
    const mrNoteFields = [
      ['attributes', 'stress_MR_notes'],
      ['attributes', 'kat_MR_notes'],
      ['attributes', 'engineering_notes'],
      ['attributes', 'notes']
    ];
    
    for (const notePath of mrNoteFields) {
      const notes = getNestedValue<Record<string, string>>(katapultNode, notePath, null);
      if (!notes) {
        continue;
      }
      
      console.log(`Checking notes in ${notePath.join('.')}`);
      
      // Check each note VALUE for Charter adding a riser
      for (const [noteKey, noteText] of Object.entries(notes)) {
        if (!noteText || typeof noteText !== 'string') {
          continue;
        }
        
        console.log(`Checking note: ${noteKey.substring(0, 15)}...`);
        
        // Convert to lowercase for case-insensitive matching
        const lowerNote = noteText.toLowerCase();
        
        // Look for various patterns of Charter adding a riser
        const hasCharterMention = lowerNote.includes('charter') || lowerNote.includes('spectrum');
        
        if (!hasCharterMention) {
          continue;
        }
        
        const addRiserPatterns = [
          'add riser',
          'adding riser',
          'add a riser',
          'adding a riser',
          'install riser',
          'installing riser',
          'new riser'
        ];
        
        for (const pattern of addRiserPatterns) {
          if (lowerNote.includes(pattern)) {
            console.log(`Found Charter riser in make-ready note with pattern '${pattern}'`);
            console.log('Note text:', noteText);
            return true;
          }
        }
      }
    }
    
    return false;
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

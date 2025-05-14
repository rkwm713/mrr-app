/**
 * Utility class for extracting data from SPIDA source
 */
import type { 
  ReportData, 
  SpidaData, 
  SpidaDesign,
  SpidaStructureWire,
  SpidaStructureEquipment,
  SpidaAnalysis
} from '../../types/DataTypes';
import { 
  getNestedValue, 
  convertMetersToFeet,
  formatHeight,
  isCharterSpectrum,
  getDefaultValue
} from '../dataUtils';
import type { CharterAttachment } from './types';
import { KatapultDataExtractor } from './katapultDataExtractor';

/**
 * Utility class for extracting data from SPIDA source
 */
export class SpidaDataExtractor {
  /**
   * Extracts pole owner information
   */
  static extractPoleOwner(
    reportData: ReportData,
    measuredDesign: SpidaDesign,
    katapultNode: Record<string, unknown> | null
  ): void {
    // Try to get from SPIDA first
    const spidaPoleOwner = getNestedValue<string | Record<string, unknown>>(
      measuredDesign, 
      ['structure', 'pole', 'owner'], 
      null
    );
    
    if (spidaPoleOwner) {
      // Check if owner is an object with industry and id fields (SpidaOwner)
      if (typeof spidaPoleOwner === 'object' && spidaPoleOwner !== null) {
        const industry = getNestedValue<string>(spidaPoleOwner, ['industry'], '');
        const id = getNestedValue<string>(spidaPoleOwner, ['id'], '');
        reportData.poleOwner = id || (industry ? `${industry} Owner` : 'Unknown Owner');
      } else {
        // If it's a string, use it directly
        reportData.poleOwner = String(spidaPoleOwner);
      }
      return;
    }
    
    // Fall back to Katapult if available
    if (katapultNode) {
      const katapultPoleOwner = KatapultDataExtractor.getPoleOwner(katapultNode);
      
      if (katapultPoleOwner) {
        reportData.poleOwner = katapultPoleOwner;
      }
    }
  }

  /**
   * Extracts pole structure information (species & class)
   */
  static extractPoleStructure(
    reportData: ReportData,
    measuredDesign: SpidaDesign,
    spidaData: SpidaData,
    katapultNode: Record<string, unknown> | null
  ): void {
    // Get the pole client item ID reference
    const poleClientItem = getNestedValue<string>(measuredDesign, ['structure', 'pole', 'clientItem'], null);
    
    if (poleClientItem && spidaData.clientData.poles) {
      // Find the matching pole definition in clientData
      const poleDefinition = spidaData.clientData.poles.find(pole => {
        // Check aliases for a matching ID
        return pole.aliases && pole.aliases.some(alias => alias.id === poleClientItem);
      });
      
      if (poleDefinition) {
        const species = poleDefinition.species || '';
        const classOfPole = poleDefinition.classOfPole || '';
        const height = poleDefinition.height?.value;
        
        if (species && classOfPole) {
          // Convert height from meters to feet if available
          let heightFeet = '';
          if (height && typeof height === 'number') {
            const heightInFeet = convertMetersToFeet(height);
            if (heightInFeet !== null) {
              heightFeet = Math.round(heightInFeet).toString();
            }
          }
          
          // Format as "height-class species" (e.g., "40-4 Southern Pine")
          if (heightFeet) {
            reportData.poleStructure = `${heightFeet}-${classOfPole} ${species}`;
          } else {
            // If height isn't available, just use class and species
            reportData.poleStructure = `${classOfPole} ${species}`;
          }
          return;
        }
      }
    }
    
    // Fall back to Katapult if available
    if (katapultNode) {
      const katapultPoleStructure = KatapultDataExtractor.getPoleStructure(katapultNode);
      if (katapultPoleStructure) {
        reportData.poleStructure = katapultPoleStructure;
        return;
      }
    }
    
    // Set default if no data available
    reportData.poleStructure = getDefaultValue('unknown');
  }

  /**
   * Extracts midspan height information
   */
  static extractMidspanHeights(
    reportData: ReportData,
    measuredDesign: SpidaDesign
  ): void {
    // Get all wires from the measured design
    const wires = getNestedValue<SpidaStructureWire[]>(measuredDesign, ['structure', 'wires'], null);
    
    if (!wires || wires.length === 0) {
      return;
    }
    
    // Initialize values for tracking lowest heights
    let lowestCommHeight: number | null = null;
    let lowestElectricalHeight: number | null = null;
    
    // Process each wire to find the lowest communications and electrical wires
    wires.forEach(wire => {
      // Skip wires without midspan height data
      if (!wire.midspanHeight || typeof wire.midspanHeight.value !== 'number') {
        return;
      }
      
      // Convert height from meters to feet
      const heightInFeet = convertMetersToFeet(wire.midspanHeight.value);
      if (heightInFeet === null) {
        return;
      }
      
      // Check if this is a communications wire
      const isCommWire = wire.usageGroup === 'COMMUNICATION' || 
                         wire.usageGroup === 'COMMUNICATION_BUNDLE';
      
      // Check if this is an electrical wire owned by CPS Energy
      let isCPSOwned = false;
      
      if (wire.owner) {
        if (typeof wire.owner === 'string') {
          isCPSOwned = wire.owner.includes('CPS');
        } else if (typeof wire.owner === 'object' && wire.owner !== null) {
          // Check if it's a SpidaOwner object with industry or id containing 'CPS'
          const industry = getNestedValue<string>(wire.owner, ['industry'], '') || '';
          const id = getNestedValue<string>(wire.owner, ['id'], '') || '';
          
          isCPSOwned = industry.includes('CPS') || id.includes('CPS');
        }
      }
      
      const isElectricalWire = (wire.usageGroup === 'PRIMARY' || 
                               wire.usageGroup === 'SECONDARY' || 
                               wire.usageGroup === 'NEUTRAL' || 
                               wire.usageGroup === 'SERVICE') &&
                               isCPSOwned;
      
      // Update lowest heights if applicable
      if (isCommWire && (lowestCommHeight === null || heightInFeet < lowestCommHeight)) {
        lowestCommHeight = heightInFeet;
      }
      
      if (isElectricalWire && (lowestElectricalHeight === null || heightInFeet < lowestElectricalHeight)) {
        lowestElectricalHeight = heightInFeet;
      }
    });
    
    // Format and set the heights in the report data
    if (lowestCommHeight !== null) {
      reportData.lowestCommMidspanHeight = formatHeight(lowestCommHeight);
    }
    
    if (lowestElectricalHeight !== null) {
      reportData.lowestCPSElectricalMidspanHeight = formatHeight(lowestElectricalHeight);
    }
  }

  /**
   * Extracts proposed features (riser, guy, PLA)
   */
  static extractProposedFeatures(
    reportData: ReportData,
    recommendedDesign: SpidaDesign
  ): void {
    const features: string[] = [];
    
    // Check for proposed riser
    const hasRiser = this.checkForRiser(recommendedDesign);
    features.push(`Riser: ${hasRiser ? 'YES' : 'NO'}`);
    
    // Set the dedicated proposedRiser field
    reportData.proposedRiser = hasRiser ? 'Yes' : 'No';
    
    // Check for proposed guy
    const hasGuy = this.checkForGuy(recommendedDesign);
    features.push(`Guy: ${hasGuy ? 'YES' : 'NO'}`);
    
    // Get PLA (Percent Loading Assessment) value
    const pla = this.extractPLA(recommendedDesign);
    features.push(`PLA: ${pla}`);
    
    reportData.proposedFeatures = features.join(', ');
  }

  /**
   * Checks for the presence of a Charter/Spectrum riser in the design
   * 
   * For SPIDAcalc, a riser is considered to be "added by Charter" if:
   * 1. It appears in the Recommended Design (which contains proposed changes)
   * 2. The equipment type is "RISER" (case-insensitive)
   * 3. The owner is Charter/Spectrum (using flexible name matching)
   */
  static checkForRiser(design: SpidaDesign): boolean {
    // Verify this is a Recommended Design layer - need BOTH conditions to match
    // Based on the example provided in CPS_6457E_03_SPIDAcalc.json
    if (design.layerType !== 'Recommended' || design.label !== 'Recommended Design') {
      console.log('Warning: checkForRiser called on non-recommended design layer:', 
                 design.layerType, design.label);
      // Continue anyway in case the naming convention is different
    }
    
    // Get equipments from the structure
    const equipment = getNestedValue<SpidaStructureEquipment[]>(design, ['structure', 'equipments'], null);
    
    if (!equipment || equipment.length === 0) {
      return false;
    }
    
    let foundCharterRiser = false;
    
    // Check each equipment item
    for (const equip of equipment) {
      // First, check if this is a riser - prioritize the direct path from the example
      let isRiser = false;
      
      // Primary path: clientItem.type is a string "RISER"
      const directType = getNestedValue<string>(equip, ['clientItem', 'type'], null);
      if (directType && typeof directType === 'string' && 
          directType.toUpperCase() === 'RISER') {
        isRiser = true;
      }
      
      // Backup paths if primary path doesn't match
      if (!isRiser) {
        // Try type.name
        const typeName = getNestedValue<{ name?: string }>(equip, ['type'], null);
        if (typeName && typeName.name && 
            typeName.name.toUpperCase() === 'RISER') {
          isRiser = true;
        }
        
        // Try clientItem.type.name
        const clientItemType = getNestedValue<{ name?: string }>(equip, ['clientItem', 'type'], null);
        if (!isRiser && clientItemType && clientItemType.name && 
            clientItemType.name.toUpperCase() === 'RISER') {
          isRiser = true;
        }
        
        // Try direct equip.type as string
        if (!isRiser && equip.type && typeof equip.type === 'string' && 
            equip.type.toUpperCase() === 'RISER') {
          isRiser = true;
        }
        
        // Check description or size fields as last resort
        if (!isRiser) {
          const description = getNestedValue<string>(equip, ['clientItem', 'description'], null);
          const size = getNestedValue<string>(equip, ['clientItem', 'size'], null);
          
          if ((description && description.toUpperCase().includes('RISER')) ||
              (size && size.toUpperCase().includes('RISER'))) {
            isRiser = true;
          }
        }
      }
      
      // If it's not a riser, continue to next equipment
      if (!isRiser) {
        continue;
      }
      
      // Now check if it's owned by Charter
      if (!equip.owner) {
        continue;
      }
      
      // Important: Check for owner.id = "Charter" as in example
      if (typeof equip.owner === 'object') {
        const ownerId = getNestedValue<string>(equip.owner, ['id'], null);
        if (ownerId === 'Charter') {
          console.log('Found SPIDA Charter riser with direct match on owner.id:', equip);
          foundCharterRiser = true;
          break;
        }
      }
      
      // If no direct match, use the flexible matching
      if (isCharterSpectrum(equip.owner)) {
        console.log('Found SPIDA Charter riser with flexible name matching:', equip);
        foundCharterRiser = true;
        break;
      }
    }
    
    return foundCharterRiser;
  }

  /**
   * Checks for the presence of a guy wire in the design
   */
  static checkForGuy(design: SpidaDesign): boolean {
    // Check for guys in the design
    const guys = getNestedValue<unknown[]>(design, ['structure', 'guys'], null);
    if (guys && guys.length > 0) {
      return true;
    }
    
    // Check for span guys in the design
    const spanGuys = getNestedValue<unknown[]>(design, ['structure', 'spanGuys'], null);
    return spanGuys ? spanGuys.length > 0 : false;
  }

  /**
   * Extracts PLA (Percent Loading Assessment) value
   */
  static extractPLA(design: SpidaDesign): string {
    // Try to get direct stress ratio from pole
    const stressRatio = getNestedValue<number>(design, ['structure', 'pole', 'stressRatio'], null);
    if (stressRatio !== null) {
      return `${(stressRatio * 100).toFixed(1)}%`;
    }
    
    // Try to get from analysis results
    const analyses = getNestedValue<SpidaAnalysis[]>(design, ['analysis'], null);
    
    if (!analyses) {
      return '--';
    }
    
    // Look for the governing load case (often NESC)
    for (const analysis of analyses) {
      const results = getNestedValue<Record<string, unknown>[]>(analysis, ['results'], null);
      
      if (!results) {
        continue;
      }
      
      for (const result of results) {
        if (result.component === 'Pole' && result.unit === 'PERCENT') {
          const actual = result.actual;
          // Parse the actual value if it's a string or number
          if (typeof actual === 'string' || typeof actual === 'number') {
            return `${parseFloat(String(actual)).toFixed(1)}%`;
          }
        }
      }
    }
    
    return '--';
  }

  /**
   * Extracts construction grade information
   */
  static extractConstructionGrade(
    reportData: ReportData,
    recommendedDesign: SpidaDesign
  ): void {
    // Try to find the construction grade in the analysis case details
    const analyses = getNestedValue<SpidaAnalysis[]>(recommendedDesign, ['analysis'], null);
    
    if (!analyses) {
      return;
    }
    
    // Look for the construction grade in any analysis
    for (const analysis of analyses) {
      const constructionGrade = getNestedValue<string>(
        analysis, 
        ['analysisCaseDetails', 'constructionGrade'], 
        null
      );
      
      if (constructionGrade) {
        reportData.constructionGrade = `Grade ${constructionGrade}`;
        return;
      }
    }
  }

  /**
   * Finds Charter/Spectrum attachments in SPIDA design
   */
  static findCharterAttachments(design: SpidaDesign): CharterAttachment[] {
    const attachments: CharterAttachment[] = [];
    
    // Get wires
    const wires = getNestedValue<SpidaStructureWire[]>(design, ['structure', 'wires'], []);
    
    if (wires && wires.length > 0) {
      // Filter for Charter/Spectrum wires
      const charterWires = wires.filter(wire => 
        wire.owner && 
        (typeof wire.owner === 'string' || typeof wire.owner === 'object') && 
        isCharterSpectrum(wire.owner)
      );
      
      // Add Charter/Spectrum wires to attachments
      charterWires.forEach(wire => {
        // Ensure wire.id exists, even if it's not a string
        if (wire.id !== undefined) {
          attachments.push({
            id: wire.id, // Type will be converted to string when needed
            attachmentHeight: wire.attachmentHeight,
            midspanHeight: wire.midspanHeight,
            description: this.getWireDescription(wire),
            type: 'wire'
          });
        }
      });
    }
    
    // Get equipment
    const equipment = getNestedValue<SpidaStructureEquipment[]>(design, ['structure', 'equipments'], []);
    
    if (equipment && equipment.length > 0) {
      // Filter for Charter/Spectrum equipment
      const charterEquipment = equipment.filter(equip => 
        equip.owner && 
        (typeof equip.owner === 'string' || typeof equip.owner === 'object') && 
        isCharterSpectrum(equip.owner)
      );
      
      // Add Charter/Spectrum equipment to attachments
      charterEquipment.forEach(equip => {
        // Ensure equip.id exists, even if it's not a string
        if (equip.id !== undefined) {
          attachments.push({
            id: equip.id, // Type will be converted to string when needed
            attachmentHeight: equip.attachmentHeight,
            description: this.getEquipmentDescription(equip),
            type: 'equipment'
          });
        }
      });
    }
    
    return attachments;
  }

  /**
   * Gets a description for a wire
   */
  static getWireDescription(wire: SpidaStructureWire): string {
    // Try to get a meaningful description
    const clientItem = getNestedValue<unknown>(wire, ['clientItem'], null);
    
    // Safely check if clientItem is a string and includes specific terms
    if (clientItem !== null) {
      const clientItemStr = typeof clientItem === 'string' 
        ? clientItem 
        : (typeof clientItem === 'object' && clientItem !== null)
          ? JSON.stringify(clientItem)
          : String(clientItem);
          
      if (clientItemStr.includes('Fiber')) {
        return 'Fiber Cable';
      } else if (clientItemStr.includes('Coax')) {
        return 'Coaxial Cable';
      }
    }
    
    // If no specific description is found, use the owner
    if (wire.owner) {
      // Handle SpidaOwner objects specifically
      if (typeof wire.owner === 'object' && wire.owner !== null) {
        const industry = getNestedValue<string>(wire.owner, ['industry'], '');
        const id = getNestedValue<string>(wire.owner, ['id'], '');
        if (id) {
          return `${id} Cable`;
        }
        if (industry) {
          return `${industry} Cable`;
        }
      }
      
      // If it's a string or other type, convert to string
      if (typeof wire.owner === 'string') {
        return `${wire.owner} Cable`;
      } else {
        try {
          return `${String(wire.owner)} Cable`;
        } catch {
          return 'Charter/Spectrum Cable';
        }
      }
    }
    
    return 'Charter/Spectrum Cable';
  }

  /**
   * Gets a description for equipment
   */
  static getEquipmentDescription(equipment: SpidaStructureEquipment): string {
    const equipmentType = getNestedValue<{ name?: string }>(equipment, ['type'], null);
    
    // Get appropriate owner string
    let ownerStr: string;
    if (equipment.owner) {
      // Handle SpidaOwner objects specifically
      if (typeof equipment.owner === 'object' && equipment.owner !== null) {
        const industry = getNestedValue<string>(equipment.owner, ['industry'], '');
        const id = getNestedValue<string>(equipment.owner, ['id'], '');
        ownerStr = id || (industry ? `${industry} Owner` : 'Unknown Owner');
      } else if (typeof equipment.owner === 'string') {
        ownerStr = equipment.owner;
      } else {
        // Use safe String() conversion for any other type
        try {
          ownerStr = String(equipment.owner);
        } catch {
          ownerStr = 'Unknown';
        }
      }
    } else {
      ownerStr = 'Charter/Spectrum';
    }
    
    if (equipmentType && equipmentType.name) {
      return `${equipmentType.name} (${ownerStr})`;
    }
    
    return `Equipment (${ownerStr})`;
  }
}

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
  isCharterSpectrum
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
    const spidaPoleOwner = getNestedValue<string>(measuredDesign, ['structure', 'pole', 'owner'], null);
    
    if (spidaPoleOwner) {
      reportData.poleOwner = spidaPoleOwner;
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
    spidaData: SpidaData
  ): void {
    // Get the pole client item ID reference
    const poleClientItem = getNestedValue<string>(measuredDesign, ['structure', 'pole', 'clientItem'], null);
    
    if (!poleClientItem || !spidaData.clientData.poles) {
      return;
    }
    
    // Find the matching pole definition in clientData
    const poleDefinition = spidaData.clientData.poles.find(pole => {
      // Check aliases for a matching ID
      return pole.aliases && pole.aliases.some(alias => alias.id === poleClientItem);
    });
    
    if (poleDefinition) {
      const species = poleDefinition.species || '';
      const classOfPole = poleDefinition.classOfPole || '';
      
      if (species || classOfPole) {
        reportData.poleStructure = `${species} ${classOfPole}`.trim();
      }
    }
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
      const isElectricalWire = (wire.usageGroup === 'PRIMARY' || 
                               wire.usageGroup === 'SECONDARY' || 
                               wire.usageGroup === 'NEUTRAL' || 
                               wire.usageGroup === 'SERVICE') &&
                               wire.owner && 
                               typeof wire.owner === 'string' && 
                               wire.owner.includes('CPS');
      
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
    
    // Check for proposed guy
    const hasGuy = this.checkForGuy(recommendedDesign);
    features.push(`Guy: ${hasGuy ? 'YES' : 'NO'}`);
    
    // Get PLA (Percent Loading Assessment) value
    const pla = this.extractPLA(recommendedDesign);
    features.push(`PLA: ${pla}`);
    
    reportData.proposedFeatures = features.join(', ');
  }

  /**
   * Checks for the presence of a riser in the design
   */
  static checkForRiser(design: SpidaDesign): boolean {
    const equipment = getNestedValue<SpidaStructureEquipment[]>(design, ['structure', 'equipments'], null);
    
    if (!equipment) {
      return false;
    }
    
    // Check if any equipment is of type "RISER"
    return equipment.some(equip => {
      const equipmentType = getNestedValue<{ name?: string }>(equip, ['type'], null);
      return equipmentType && equipmentType.name === 'RISER';
    });
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
        attachments.push({
          id: wire.id,
          attachmentHeight: wire.attachmentHeight,
          midspanHeight: wire.midspanHeight,
          description: this.getWireDescription(wire),
          type: 'wire'
        });
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
        attachments.push({
          id: equip.id,
          attachmentHeight: equip.attachmentHeight,
          description: this.getEquipmentDescription(equip),
          type: 'equipment'
        });
      });
    }
    
    return attachments;
  }

  /**
   * Gets a description for a wire
   */
  static getWireDescription(wire: SpidaStructureWire): string {
    // Try to get a meaningful description
    const clientItem = getNestedValue<string>(wire, ['clientItem'], null);
    if (clientItem && clientItem.includes('Fiber')) {
      return 'Fiber Cable';
    } else if (clientItem && clientItem.includes('Coax')) {
      return 'Coaxial Cable';
    } else if (wire.owner) {
      // Convert owner to string safely
      let ownerStr: string;
      if (typeof wire.owner === 'string') {
        ownerStr = wire.owner;
      } else {
        // Use safe String() conversion for any other type
        try {
          ownerStr = String(wire.owner);
        } catch {
          ownerStr = 'Unknown';
        }
      }
      return `${ownerStr} Cable`;
    }
    
    return 'Charter/Spectrum Cable';
  }

  /**
   * Gets a description for equipment
   */
  static getEquipmentDescription(equipment: SpidaStructureEquipment): string {
    const equipmentType = getNestedValue<{ name?: string }>(equipment, ['type'], null);
    
    // Convert owner to string safely
    let ownerStr: string;
    if (equipment.owner) {
      if (typeof equipment.owner === 'string') {
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

/**
 * Utility class for analyzing Charter/Spectrum attachments
 */
import type { ReportData, SpidaDesign, SpidaStructureWire, SpidaStructureEquipment } from '../../types/DataTypes';
import { convertMetersToFeet, formatHeight, getNestedValue, parseImperialMeasurement } from '../dataUtils';
import type { AttachmentAction } from './types';
import { SpidaDataExtractor } from './spidaDataExtractor';
import { KatapultDataExtractor } from './katapultDataExtractor';

/**
 * Utility class for analyzing Charter/Spectrum attachments
 */
export class AttachmentAnalyzer {
  /**
   * Cached attachment information for height extraction
   */
  static _cachedAttachments: Array<{
    owner: string;
    description: string;
    height: number;
    heightStr: string;
  }> = [];
  
  /**
   * Gets a description of all attachments from the neutral down in descending order of height
   * @param recommendedDesign - The SPIDAcalc recommended design
   * @param measuredDesign - The SPIDAcalc measured design (optional)
   * @param katapultNode - The Katapult node data (optional)
   * @returns A formatted string listing all attachments from neutral down
   */
  static getAttacherDescription(
    recommendedDesign: SpidaDesign,
    measuredDesign: SpidaDesign | undefined,
    katapultNode: Record<string, unknown> | null
  ): string {
    // Array to store all attachment info
    interface AttachmentInfo {
      owner: string;
      description: string;
      height: number;
      heightStr: string;
    }
    
    const attachments: AttachmentInfo[] = [];
    
    // 1. Extract attachments from Katapult (existing/measured) if available
    if (katapultNode) {
      const lowestNeutralHeight = this.findLowestCPSNeutralHeightKatapult(katapultNode);
      
      if (lowestNeutralHeight !== null) {
        // Add the neutral itself to the list
        attachments.push({
          owner: 'CPS Energy',
          description: 'Neutral',
          height: lowestNeutralHeight,
          heightStr: `${lowestNeutralHeight.toFixed(1)}'`
        });
        
        // Find all attachments below the neutral
        this.findAttachmentsBelowNeutralKatapult(katapultNode, lowestNeutralHeight, attachments);
      }
    }
    
    // 2. Extract attachments from SPIDAcalc (recommended) data
    const spidaLowestNeutralHeight = this.findLowestCPSNeutralHeightSpida(recommendedDesign);
    
    if (spidaLowestNeutralHeight !== null) {
      // Only add the neutral if we didn't already get it from Katapult
      if (!attachments.some(a => a.description.includes('Neutral') && a.owner.includes('CPS'))) {
        attachments.push({
          owner: 'CPS Energy',
          description: 'Neutral',
          height: spidaLowestNeutralHeight,
          heightStr: `${spidaLowestNeutralHeight.toFixed(1)}'`
        });
      }
      
      // Find all attachments below the neutral in the recommended design
      this.findAttachmentsBelowNeutralSpida(recommendedDesign, spidaLowestNeutralHeight, attachments);
    }
    
    // 3. Add measurements from measured design if available
    if (measuredDesign && attachments.length === 0) {
      const measuredNeutralHeight = this.findLowestCPSNeutralHeightSpida(measuredDesign);
      
      if (measuredNeutralHeight !== null) {
        attachments.push({
          owner: 'CPS Energy',
          description: 'Neutral',
          height: measuredNeutralHeight,
          heightStr: `${measuredNeutralHeight.toFixed(1)}'`
        });
        
        // Find all attachments below the neutral in the measured design
        this.findAttachmentsBelowNeutralSpida(measuredDesign, measuredNeutralHeight, attachments);
      }
    }
    
    // Sort attachments by height in descending order (highest to lowest)
    attachments.sort((a, b) => b.height - a.height);
    
    // Remove duplicates (same owner and description)
    const uniqueAttachments: AttachmentInfo[] = [];
    const seen = new Set<string>();
    
    for (const attachment of attachments) {
      const key = `${attachment.owner}-${attachment.description}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueAttachments.push(attachment);
      }
    }
    
    // Format the attachments into a string without heights
    if (uniqueAttachments.length === 0) {
      return 'No attachments found';
    }
    
    // Store the attachments for later height extraction
    AttachmentAnalyzer._cachedAttachments = uniqueAttachments;
    
    return uniqueAttachments.map(a => `${a.description} (${a.owner})`).join('\n');
  }
  
  /**
   * Finds the lowest CPS neutral wire height in Katapult data
   */
  private static findLowestCPSNeutralHeightKatapult(
    katapultNode: Record<string, unknown>
  ): number | null {
    let lowestNeutralHeight: number | null = null;
    
    // Get equipment from Katapult data
    const equipment = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultNode, 
      ['attributes', 'equipment'], 
      null
    );
    
    if (!equipment) {
      return null;
    }
    
    // Examine each piece of equipment
    Object.values(equipment).forEach(equip => {
      // Check if this is a CPS neutral
      const ownerName = getNestedValue<string>(equip, ['owner_name', 'one'], '') || 
                       getNestedValue<string>(equip, ['company_name', 'one'], '') || '';
      
      const equipmentType = getNestedValue<string>(equip, ['equipment_type', 'button_added'], '') || '';
      
      const isCPSNeutral = ownerName.includes('CPS') && 
                          (equipmentType.includes('Neutral') || equipmentType.includes('neutral'));
      
      if (isCPSNeutral) {
        // Get height
        const attachmentHeightStr = getNestedValue<string>(equip, ['attachment_height_ft'], null);
        
        if (attachmentHeightStr) {
          const heightFeet = parseImperialMeasurement(attachmentHeightStr);
          
          if (heightFeet !== null && (lowestNeutralHeight === null || heightFeet < lowestNeutralHeight)) {
            lowestNeutralHeight = heightFeet;
          }
        }
      }
    });
    
    return lowestNeutralHeight;
  }
  
  /**
   * Finds all attachments below the neutral in Katapult data
   */
  private static findAttachmentsBelowNeutralKatapult(
    katapultNode: Record<string, unknown>,
    neutralHeight: number,
    attachments: { owner: string; description: string; height: number; heightStr: string; }[]
  ): void {
    // Get equipment from Katapult data
    const equipment = getNestedValue<Record<string, Record<string, unknown>>>(
      katapultNode, 
      ['attributes', 'equipment'], 
      null
    );
    
    if (!equipment) {
      return;
    }
    
    // Examine each piece of equipment
    Object.values(equipment).forEach(equip => {
      // Get owner name
      const ownerName = getNestedValue<string>(equip, ['owner_name', 'one'], '') || 
                       getNestedValue<string>(equip, ['company_name', 'one'], '') || '';
      
      // Skip if no owner name
      if (!ownerName) {
        return;
      }
      
      // Get height
      const attachmentHeightStr = getNestedValue<string>(equip, ['attachment_height_ft'], null);
      
      if (!attachmentHeightStr) {
        return;
      }
      
      const heightFeet = parseImperialMeasurement(attachmentHeightStr);
      
      if (heightFeet === null) {
        return;
      }
      
      // Check if this attachment is below the neutral
      if (heightFeet < neutralHeight) {
        // Get description
        const equipmentType = getNestedValue<string>(equip, ['equipment_type', 'button_added'], '') || '';
        const conductorType = getNestedValue<string>(equip, ['conductor_type', 'button_added'], '') || '';
        
        let description = '';
        
        if (conductorType && equipmentType) {
          description = `${conductorType} ${equipmentType}`;
        } else if (conductorType) {
          description = conductorType;
        } else if (equipmentType) {
          description = equipmentType;
        } else {
          description = 'Attachment';
        }
        
        // Add to attachments array
        attachments.push({
          owner: ownerName,
          description,
          height: heightFeet,
          heightStr: `${heightFeet.toFixed(1)}'`
        });
      }
    });
  }
  
  /**
   * Finds the lowest CPS neutral wire height in SPIDAcalc data
   */
  private static findLowestCPSNeutralHeightSpida(
    design: SpidaDesign
  ): number | null {
    let lowestNeutralHeight: number | null = null;
    
    // Get wires from the design
    const wires = getNestedValue<SpidaStructureWire[]>(design, ['structure', 'wires'], []);
    
    if (!wires || wires.length === 0) {
      return null;
    }
    
    // Find CPS neutral wires
    for (const wire of wires) {
      // Check if this is a CPS neutral wire
      let isCPSOwned = false;
      
      if (wire.owner) {
        if (typeof wire.owner === 'string') {
          isCPSOwned = wire.owner.includes('CPS');
        } else if (typeof wire.owner === 'object' && wire.owner !== null) {
          const id = getNestedValue<string>(wire.owner, ['id'], '') || '';
          isCPSOwned = id.includes('CPS');
        }
      }
      
      const isNeutral = wire.usageGroup === 'NEUTRAL';
      
      if (isCPSOwned && isNeutral && wire.attachmentHeight?.value !== undefined) {
        const heightInFeet = convertMetersToFeet(wire.attachmentHeight.value);
        
        if (heightInFeet !== null && (lowestNeutralHeight === null || heightInFeet < lowestNeutralHeight)) {
          lowestNeutralHeight = heightInFeet;
        }
      }
    }
    
    return lowestNeutralHeight;
  }
  
  /**
   * Finds all attachments below the neutral in SPIDAcalc data
   */
  private static findAttachmentsBelowNeutralSpida(
    design: SpidaDesign,
    neutralHeight: number,
    attachments: { owner: string; description: string; height: number; heightStr: string; }[]
  ): void {
    // Get wires from the design
    const wires = getNestedValue<SpidaStructureWire[]>(design, ['structure', 'wires'], []);
    
    if (wires && wires.length > 0) {
      for (const wire of wires) {
        // Skip if no attachment height
        if (!wire.attachmentHeight?.value) {
          continue;
        }
        
        const heightInFeet = convertMetersToFeet(wire.attachmentHeight.value);
        
        if (heightInFeet === null) {
          continue;
        }
        
        // Check if below neutral
        if (heightInFeet < neutralHeight) {
          // Get owner name
          let ownerStr = 'Unknown';
          
          if (wire.owner) {
            if (typeof wire.owner === 'string') {
              ownerStr = wire.owner;
            } else if (typeof wire.owner === 'object' && wire.owner !== null) {
              const id = getNestedValue<string>(wire.owner, ['id'], '');
              if (id) {
                ownerStr = id;
              }
            }
          }
          
          // Get description
          const description = SpidaDataExtractor.getWireDescription(wire);
          
          // Add to attachments array
          attachments.push({
            owner: ownerStr,
            description,
            height: heightInFeet,
            heightStr: `${heightInFeet.toFixed(1)}'`
          });
        }
      }
    }
    
    // Get equipment from the design
    const equipment = getNestedValue<SpidaStructureEquipment[]>(design, ['structure', 'equipments'], []);
    
    if (equipment && equipment.length > 0) {
      for (const equip of equipment) {
        // Skip if no attachment height
        if (!equip.attachmentHeight?.value) {
          continue;
        }
        
        const heightInFeet = convertMetersToFeet(equip.attachmentHeight.value);
        
        if (heightInFeet === null) {
          continue;
        }
        
        // Check if below neutral
        if (heightInFeet < neutralHeight) {
          // Get owner name
          let ownerStr = 'Unknown';
          
          if (equip.owner) {
            if (typeof equip.owner === 'string') {
              ownerStr = equip.owner;
            } else if (typeof equip.owner === 'object' && equip.owner !== null) {
              const id = getNestedValue<string>(equip.owner, ['id'], '');
              if (id) {
                ownerStr = id;
              }
            }
          }
          
          // Get description
          const description = SpidaDataExtractor.getEquipmentDescription(equip);
          
          // Add to attachments array
          attachments.push({
            owner: ownerStr,
            description,
            height: heightInFeet,
            heightStr: `${heightInFeet.toFixed(1)}'`
          });
        }
      }
    }
  }
  /**
   * Determines attachment action (I/R/E)
   */
  static determineAttachmentAction(
    measuredDesign: SpidaDesign | undefined,
    recommendedDesign: SpidaDesign,
    katapultNode: Record<string, unknown> | null
  ): AttachmentAction {
    // Try to get action from Katapult first if available
    if (katapultNode) {
      // Check for traces marked as proposed with Charter/Spectrum as company
      const proposedCharter = KatapultDataExtractor.checkForProposedCharter(katapultNode);
      if (proposedCharter) {
        return 'I'; // Installing
      }
      
      // Check for traces with mr_move flag for Charter/Spectrum
      const relocatedCharter = KatapultDataExtractor.checkForRelocatedCharter(katapultNode);
      if (relocatedCharter) {
        return 'R'; // Relocating
      }
    }
    
    // If no Katapult action detected or Katapult not available, check SPIDA
    if (measuredDesign && recommendedDesign) {
      // Get Charter/Spectrum attachments from measured and recommended designs
      const measuredAttachments = SpidaDataExtractor.findCharterAttachments(measuredDesign);
      const recommendedAttachments = SpidaDataExtractor.findCharterAttachments(recommendedDesign);
      
      // Check for new attachments (present in recommended but not measured)
      if (recommendedAttachments.length > 0 && measuredAttachments.length === 0) {
        return 'I'; // Installing
      }
      
      // Check for relocated attachments (present in both but with different heights)
      if (measuredAttachments.length > 0 && recommendedAttachments.length > 0) {
        // Check if any attachment heights changed
        for (const recAttachment of recommendedAttachments) {
          // Safely compare attachment IDs by converting to string
          const matchingMeasuredAttachment = measuredAttachments.find(mAttachment => {
            const mId = String(mAttachment.id);
            const rId = String(recAttachment.id);
            return mId === rId;
          });
          
          if (matchingMeasuredAttachment && 
              matchingMeasuredAttachment.attachmentHeight && 
              recAttachment.attachmentHeight &&
              matchingMeasuredAttachment.attachmentHeight.value !== recAttachment.attachmentHeight.value) {
            return 'R'; // Relocating
          }
        }
        
        // If Charter/Spectrum attachments exist and aren't being installed or relocated
        return 'E'; // Existing
      }
    }
    
    // If we can't determine an action, default based on presence in recommended
    const hasCharterInRecommended = this.hasCharterAttachments(recommendedDesign);
    return hasCharterInRecommended ? 'I' : 'Unknown';
  }

  /**
   * Checks if Charter/Spectrum has attachments in the design
   */
  static hasCharterAttachments(design: SpidaDesign): boolean {
    const attachments = SpidaDataExtractor.findCharterAttachments(design);
    return attachments.length > 0;
  }
  
  /**
   * Gets existing and proposed heights for each attacher
   * @returns A map of attacher descriptions to their heights
   */
  static getAttacherHeights(
    measuredDesign: SpidaDesign | undefined,
    recommendedDesign: SpidaDesign
  ): Map<string, { existing: string | null; proposed: string | null }> {
    const heightMap = new Map<string, { existing: string | null; proposed: string | null }>();
    const attachers = this._cachedAttachments;
    
    if (!attachers || attachers.length === 0) {
      return heightMap;
    }
    
    // For each attacher, find its height in the existing and proposed designs
    for (const attachment of attachers) {
      const key = `${attachment.description} (${attachment.owner})`;
      const existingHeight = attachment.heightStr;
      
      // Initialize with existing height from the attachment
      heightMap.set(key, { 
        existing: existingHeight, 
        proposed: null 
      });
    }
    
    // Check for proposed heights in recommended design
    if (recommendedDesign && measuredDesign) {
      const recommendedWires = getNestedValue<SpidaStructureWire[]>(
        recommendedDesign, ['structure', 'wires'], []
      );
      
      for (const wire of recommendedWires || []) {
        // Skip if no attachment height
        if (!wire.attachmentHeight?.value) {
          continue;
        }
        
        // Get owner name
        let ownerStr = 'Unknown';
        
        if (wire.owner) {
          if (typeof wire.owner === 'string') {
            ownerStr = wire.owner;
          } else if (typeof wire.owner === 'object' && wire.owner !== null) {
            const id = getNestedValue<string>(wire.owner, ['id'], '');
            if (id) {
              ownerStr = id;
            }
          }
        }
        
        // Get description
        const description = SpidaDataExtractor.getWireDescription(wire);
        const key = `${description} (${ownerStr})`;
        
        // Check if we have this attachment in our map
        if (heightMap.has(key)) {
          const heightInFeet = convertMetersToFeet(wire.attachmentHeight.value);
          
          if (heightInFeet !== null) {
            const heightStr = `${heightInFeet.toFixed(1)}'`;
            const existing = heightMap.get(key)?.existing || null;
            
            // Only set proposed height if it's different from existing
            if (existing !== heightStr) {
              heightMap.set(key, { 
                existing, 
                proposed: heightStr 
              });
            }
          }
        }
      }
      
      // Also check equipment
      const recommendedEquipment = getNestedValue<SpidaStructureEquipment[]>(
        recommendedDesign, ['structure', 'equipments'], []
      );
      
      for (const equip of recommendedEquipment || []) {
        // Skip if no attachment height
        if (!equip.attachmentHeight?.value) {
          continue;
        }
        
        // Get owner name
        let ownerStr = 'Unknown';
        
        if (equip.owner) {
          if (typeof equip.owner === 'string') {
            ownerStr = equip.owner;
          } else if (typeof equip.owner === 'object' && equip.owner !== null) {
            const id = getNestedValue<string>(equip.owner, ['id'], '');
            if (id) {
              ownerStr = id;
            }
          }
        }
        
        // Get description
        const description = SpidaDataExtractor.getEquipmentDescription(equip);
        const key = `${description} (${ownerStr})`;
        
        // Check if we have this attachment in our map
        if (heightMap.has(key)) {
          const heightInFeet = convertMetersToFeet(equip.attachmentHeight.value);
          
          if (heightInFeet !== null) {
            const heightStr = `${heightInFeet.toFixed(1)}'`;
            const existing = heightMap.get(key)?.existing || null;
            
            // Only set proposed height if it's different from existing
            if (existing !== heightStr) {
              heightMap.set(key, { 
                existing, 
                proposed: heightStr 
              });
            }
          }
        }
      }
    }
    
    return heightMap;
  }

/**
 * Extracts attacher-specific data
 */
static extractAttacherData(
  reportData: ReportData,
  measuredDesign: SpidaDesign | undefined,
  recommendedDesign: SpidaDesign,
  katapultNode: Record<string, unknown> | null = null
): void {
  // Check if this is a REF sub group and adjust formatting accordingly
  const isREF = reportData.isREFSubGroup === true;
  
  // Format existing heights with parentheses for REF sub groups
  const formatHeightForREF = (height: string | null | undefined): string => {
    if (!height || height === 'N/A' || !isREF) return height || 'N/A';
    // For REF sub groups, wrap existing heights in parentheses
    return `(${height})`;
  };
  
  // Try to get Charter/Spectrum attachment data from Katapult first if available
  let katapultDataExtracted = false;
  
  if (katapultNode) {
    // Use our enhanced Katapult data extractor for Charter attachments
    KatapultDataExtractor.getCharterAttachmentData(katapultNode, reportData);
    
    // If we got any Charter data from Katapult, mark as extracted
    katapultDataExtracted = reportData.charterSpectrumDescription !== '' && 
                          reportData.charterSpectrumDescription !== 'Charter/Spectrum Attachment';
  }
  
  // If we didn't get data from Katapult or data is incomplete, try SPIDA
  if (!katapultDataExtracted) {
    // Set attacher description to default if not already set
    if (!reportData.charterSpectrumDescription || reportData.charterSpectrumDescription === '') {
      reportData.charterSpectrumDescription = 'Charter/Spectrum Attachment';
    }
    
    // Find Charter/Spectrum attachments
    const recommendedAttachments = SpidaDataExtractor.findCharterAttachments(recommendedDesign);
    
    // Get data from first attachment if available
    if (recommendedAttachments.length > 0) {
      const primaryAttachment = recommendedAttachments[0];
      
      // Set description if not already set from Katapult
      if (reportData.charterSpectrumDescription === 'Charter/Spectrum Attachment') {
        reportData.charterSpectrumDescription = primaryAttachment.description;
      }
      
      // Set proposed attachment height if not already set
      if (!reportData.proposedHeight && primaryAttachment.attachmentHeight?.value !== undefined) {
        const height = convertMetersToFeet(primaryAttachment.attachmentHeight.value);
        if (height !== null) {
          reportData.proposedHeight = formatHeight(height);
        }
      }
      
      // Set proposed midspan height if not already set (only applicable for wires)
      if (!reportData.proposedMidspan && 
          primaryAttachment.type === 'wire' && 
          primaryAttachment.midspanHeight?.value !== undefined) {
        const height = convertMetersToFeet(primaryAttachment.midspanHeight.value);
        if (height !== null) {
          reportData.proposedMidspan = formatHeight(height);
        }
      }
    }
    
    // Get existing heights only if not new installation and measured design exists
    if (reportData.attachmentAction !== 'I' && measuredDesign) {
      // Find Charter/Spectrum attachments in measured design
      const measuredAttachments = SpidaDataExtractor.findCharterAttachments(measuredDesign);
      
      // If we have recommended attachments, try to find matching measured attachments
      if (recommendedAttachments.length > 0 && measuredAttachments.length > 0) {
        const primaryRecommendedAttachment = recommendedAttachments[0];
        // Safely compare attachment IDs by converting to string
        const matchingMeasuredAttachment = measuredAttachments.find(mAttachment => {
          const mId = String(mAttachment.id);
          const rId = String(primaryRecommendedAttachment.id);
          return mId === rId;
        });
        
        // Set existing heights if we found a matching attachment and not already set
        if (matchingMeasuredAttachment) {
          if (!reportData.existingHeight && matchingMeasuredAttachment.attachmentHeight?.value !== undefined) {
            const height = convertMetersToFeet(matchingMeasuredAttachment.attachmentHeight.value);
            if (height !== null) {
              // Apply REF formatting if needed
              const formattedHeight = formatHeight(height);
              reportData.existingHeight = isREF ? formatHeightForREF(formattedHeight) : formattedHeight;
            }
          }
          
          // Set existing midspan height for wires if not already set
          if (!reportData.existingMidspan && 
              matchingMeasuredAttachment.type === 'wire' && 
              matchingMeasuredAttachment.midspanHeight?.value !== undefined) {
            const height = convertMetersToFeet(matchingMeasuredAttachment.midspanHeight.value);
            if (height !== null) {
              // Apply REF formatting if needed
              const formattedHeight = formatHeight(height);
              reportData.existingMidspan = isREF ? formatHeightForREF(formattedHeight) : formattedHeight;
            }
          }
        }
      }
    }
  }
}
}

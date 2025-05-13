/**
 * Utility class for analyzing Charter/Spectrum attachments
 */
import type { ReportData, SpidaDesign } from '../../types/DataTypes';
import { convertMetersToFeet, formatHeight } from '../dataUtils';
import type { AttachmentAction } from './types';
import { SpidaDataExtractor } from './spidaDataExtractor';
import { KatapultDataExtractor } from './katapultDataExtractor';

/**
 * Utility class for analyzing Charter/Spectrum attachments
 */
export class AttachmentAnalyzer {
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
          const matchingMeasuredAttachment = measuredAttachments.find(mAttachment => 
            mAttachment.id === recAttachment.id
          );
          
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
 * Extracts attacher-specific data
 */
static extractAttacherData(
  reportData: ReportData,
  measuredDesign: SpidaDesign | undefined,
  recommendedDesign: SpidaDesign,
  katapultNode: Record<string, unknown> | null = null
): void {
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
        const matchingMeasuredAttachment = measuredAttachments.find(
          mAttachment => mAttachment.id === primaryRecommendedAttachment.id
        );
        
        // Set existing heights if we found a matching attachment and not already set
        if (matchingMeasuredAttachment) {
          if (!reportData.existingHeight && matchingMeasuredAttachment.attachmentHeight?.value !== undefined) {
            const height = convertMetersToFeet(matchingMeasuredAttachment.attachmentHeight.value);
            if (height !== null) {
              reportData.existingHeight = formatHeight(height);
            }
          }
          
          // Set existing midspan height for wires if not already set
          if (!reportData.existingMidspan && 
              matchingMeasuredAttachment.type === 'wire' && 
              matchingMeasuredAttachment.midspanHeight?.value !== undefined) {
            const height = convertMetersToFeet(matchingMeasuredAttachment.midspanHeight.value);
            if (height !== null) {
              reportData.existingMidspan = formatHeight(height);
            }
          }
        }
      }
    }
  }
}
}

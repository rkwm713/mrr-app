/**
 * Report generation type definitions
 */

/** Type for Charter/Spectrum attachments */
export type CharterAttachment = {
  id: string;
  attachmentHeight?: { value: number; unit: string };
  midspanHeight?: { value: number; unit: string };
  description: string;
  type: 'wire' | 'equipment';
};

/** Types for attachment actions */
export type AttachmentAction = 'I' | 'R' | 'E' | string;

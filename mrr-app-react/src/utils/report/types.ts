/**
 * Report generation type definitions
 */

/** Type for Charter/Spectrum attachments */
export type CharterAttachment = {
  id: string | number | object;  // Can be various types in the actual data
  attachmentHeight?: { value: number; unit: string };
  midspanHeight?: { value: number; unit: string };
  description: string;
  type: 'wire' | 'equipment';
};

/** Types for attachment actions */
export type AttachmentAction = 'I' | 'R' | 'E' | string;

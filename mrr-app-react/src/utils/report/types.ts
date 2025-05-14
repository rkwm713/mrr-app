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

/** Type for representing a wire in a span */
export interface SpanWire {
  wireType: string;         // e.g., "Neutral", "Secondary"
  owner: string;            // e.g., "CPS Energy"
  existingMidspanHeight: number | null;
  proposedMidspanHeight: number | null;
  moveValue: number;
  isREFSubGroup: boolean;
  sections: unknown[];      // All sections containing this wire
}

/** Type for connection between poles */
export interface Connection {
  id: string;
  fromPoleId: string;
  toPoleId: string;
  sections: Section[];
  isREFConnection: boolean;
}

/** Type for section in a connection */
export interface Section {
  id: string;
  annotations: SectionAnnotation[];
  latitude?: number | null;
  longitude?: number | null;
}

/** Type for annotation in a section */
export interface SectionAnnotation {
  id: string;
  equipmentType: string;
  ownerName: string;
  measuredHeightFt: string | number;
  heightFtDecimal?: number | null;
}

/** Type for connection tracker result */
export interface ConnectionTrackerResult {
  connections: Connection[];
  spanWires: SpanWire[];
}

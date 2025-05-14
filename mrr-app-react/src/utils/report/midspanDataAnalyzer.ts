/**
 * MidspanDataAnalyzer Module
 * 
 * Handles midspan wire height data extraction and processing.
 * This module calculates existing and proposed midspan heights for wire types.
 */

import type { SpanWire } from './types';
import { getNestedValue } from '../dataUtils';
import { ConnectionTracker } from './connectionTracker';

// Format types
const FORMAT_STANDARD = 'standard';
const FORMAT_REF = 'ref';

export class MidspanDataAnalyzer {
  /**
   * Process wire heights data for reporting
   * 
   * @param spanWires - Array of span wires from ConnectionTracker
   * @param photofirstData - Photofirst data for move values (if available)
   * @returns Processed span wires with calculated heights
   */
  public static processWireHeights(
    spanWires: SpanWire[],
    photofirstData?: Record<string, unknown>
  ): SpanWire[] {
    if (!spanWires || !Array.isArray(spanWires) || spanWires.length === 0) {
      return [];
    }
    
    // Process each span wire
    spanWires.forEach(wire => {
      // Calculate proposed height based on move values (if available)
      if (wire.existingMidspanHeight !== null) {
        const moveValue = this.getMoveValue(wire, photofirstData);
        
        if (moveValue > 0) {
          wire.moveValue = moveValue;
          wire.proposedMidspanHeight = wire.existingMidspanHeight + moveValue;
        }
      }
    });
    
    return spanWires;
  }
  
  /**
   * Get the lowest wire height for a specific category
   * 
   * @param spanWires - Processed span wires
   * @param category - Category of wire ('communication' or 'electrical')
   * @returns Lowest height for the specified category
   */
  public static getLowestWireHeight(
    spanWires: SpanWire[],
    category: 'communication' | 'electrical'
  ): number | null {
    if (!spanWires || !Array.isArray(spanWires) || spanWires.length === 0) {
      return null;
    }
    
    // Filter wires by category
    const filteredWires = spanWires.filter(wire => {
      const wireType = wire.wireType.toLowerCase();
      const owner = wire.owner.toLowerCase();
      
      if (category === 'communication') {
        // Communication wires - check for communication-related types
        return (
          wireType.includes('communication') ||
          wireType.includes('fiber') ||
          wireType.includes('cable') ||
          wireType.includes('telephone') ||
          wireType.includes('data') ||
          (!wireType.includes('primary') && !wireType.includes('secondary') && 
           !wireType.includes('neutral') && !wireType.includes('electrical') &&
           !owner.includes('cps energy'))
        );
      } else {
        // Electrical wires - check for CPS/electrical types
        return (
          wireType.includes('primary') ||
          wireType.includes('secondary') ||
          wireType.includes('neutral') ||
          wireType.includes('electrical') ||
          owner.includes('cps energy')
        );
      }
    });
    
    if (filteredWires.length === 0) {
      return null;
    }
    
    // Find minimum existing height
    let lowestHeight: number | null = null;
    
    filteredWires.forEach(wire => {
      if (wire.existingMidspanHeight !== null) {
        if (lowestHeight === null || wire.existingMidspanHeight < lowestHeight) {
          lowestHeight = wire.existingMidspanHeight;
        }
      }
    });
    
    return lowestHeight;
  }
  
  /**
   * Get move value for a wire from photofirst data
   * 
   * @param wire - Span wire to get move value for
   * @param photofirstData - Photofirst data containing move values
   * @returns Move value in feet
   */
  private static getMoveValue(
    wire: SpanWire,
    photofirstData?: Record<string, unknown>
  ): number {
    if (!photofirstData) {
      return 0;
    }
    
    // Look for wire in photofirst data
    const wireData = this.findWireInPhotofirstData(wire, photofirstData);
    
    if (!wireData) {
      return 0;
    }
    
    // Get MR move value (in inches, convert to feet)
    const mrMove = getNestedValue<number>(wireData, ['mr_move'], 0);
    
    // Get effective move value
    const effectiveMove = getNestedValue<number>(
      wireData, 
      ['_effective_moves', 'value'], 
      0
    );
    
    // Use the larger of the two values
    const moveInches = Math.max(mrMove || 0, effectiveMove || 0);
    
    // Convert inches to feet
    return moveInches / 12;
  }
  
  /**
   * Find a wire in photofirst data based on type and owner
   * 
   * @param wire - Span wire to find
   * @param photofirstData - Photofirst data
   * @returns Wire data from photofirst or null if not found
   */
  private static findWireInPhotofirstData(
    wire: SpanWire,
    photofirstData: Record<string, unknown>
  ): Record<string, unknown> | null {
    // Get wires from photofirst data
    const wiresData = getNestedValue<Record<string, unknown>>(
      photofirstData, 
      ['photofirst_data', 'wire'], 
      {}
    );
    
    if (!wiresData || Object.keys(wiresData).length === 0) {
      return null;
    }
    
    // Look for matching wire by type and owner
    for (const [, wireData] of Object.entries(wiresData)) {
      const typedWireData = wireData as Record<string, unknown>;
      
      // Get wire type and owner
      const wireType = getNestedValue<string>(
        typedWireData, 
        ['type'], 
        ''
      );
      
      const wireOwner = getNestedValue<string>(
        typedWireData, 
        ['owner'], 
        ''
      );
      
      // Check if this matches our wire
      if (
        wireType?.toLowerCase().includes(wire.wireType.toLowerCase()) &&
        wireOwner?.toLowerCase().includes(wire.owner.toLowerCase())
      ) {
        return typedWireData;
      }
    }
    
    return null;
  }
  
  /**
   * Format height value based on format type (standard or REF)
   * 
   * @param height - Height value in feet
   * @param formatType - Format type (standard or ref)
   * @param isExisting - Whether this is an existing height (for REF formatting)
   * @returns Formatted height string
   */
  public static formatHeight(
    height: number | null,
    formatType: string = FORMAT_STANDARD,
    isExisting: boolean = false
  ): string {
    if (height === null) {
      return 'N/A';
    }
    
    // Format the height in feet and inches
    const feet = Math.floor(height);
    const inches = Math.round((height - feet) * 12);
    
    // Handle inch overflow
    let formattedFeet = feet;
    let formattedInches = inches;
    
    if (inches >= 12) {
      formattedFeet += 1;
      formattedInches = 0;
    }
    
    const heightStr = `${formattedFeet}'-${formattedInches}"`;
    
    // Apply special formatting for REF
    if (formatType === FORMAT_REF && isExisting) {
      return `(${heightStr})`;
    }
    
    return heightStr;
  }
  
  /**
   * Get formatted height values for a wire
   * 
   * @param wire - Span wire to format heights for
   * @returns Object with formatted height values
   */
  public static getFormattedHeights(wire: SpanWire): {
    existing: string;
    proposed: string;
  } {
    // Determine format type based on REF status
    const formatType = wire.isREFSubGroup ? FORMAT_REF : FORMAT_STANDARD;
    
    // Format existing height
    const existingFormatted = this.formatHeight(
      wire.existingMidspanHeight,
      formatType,
      true
    );
    
    // Format proposed height (if available)
    const proposedFormatted = wire.proposedMidspanHeight !== null
      ? this.formatHeight(wire.proposedMidspanHeight, formatType, false)
      : '';
    
    return {
      existing: existingFormatted,
      proposed: proposedFormatted
    };
  }

  /**
   * Extract midspan data from Katapult data
   * 
   * @param katapultData - Katapult data
   * @returns Array of span wires
   */
  public static extractMidspanData(
    katapultData: Record<string, unknown> | null | undefined
  ): SpanWire[] {
    if (!katapultData) {
      return [];
    }
    
    // Use ConnectionTracker to get connections and wires
    const { spanWires } = ConnectionTracker.processConnections(katapultData);
    
    // Process wire heights to get proposed values
    return this.processWireHeights(
      spanWires,
      getNestedValue<Record<string, unknown>>(katapultData, ['photofirst_data'], {})
    );
  }

  /**
   * Find Charter/Spectrum attachments in the span wires
   * 
   * @param spanWires - Array of span wires
   * @returns Charter/Spectrum attachments
   */
  public static findCharterAttachments(spanWires: SpanWire[]): SpanWire[] {
    if (!spanWires || !Array.isArray(spanWires)) {
      return [];
    }
    
    return spanWires.filter(wire => {
      const owner = wire.owner.toLowerCase();
      const wireType = wire.wireType.toLowerCase();
      
      return (
        owner.includes('charter') ||
        owner.includes('spectrum') ||
        wireType.includes('charter') ||
        wireType.includes('spectrum')
      );
    });
  }

  /**
   * Get the lowest midspan height for a specific category
   * 
   * @param spanWires - Array of span wires
   * @param category - Category of wire ('communication' or 'electrical')
   * @param useProposed - Whether to use proposed heights (if available)
   * @returns Height object with value and formatted string
   */
  public static getLowestMidspanHeight(
    spanWires: SpanWire[],
    category: 'communication' | 'electrical',
    useProposed: boolean = false
  ): { height: number | null; formattedHeight: string } {
    // Get the lowest height value
    let lowestHeight = this.getLowestWireHeight(spanWires, category);
    
    // If using proposed heights and available, check those too
    if (useProposed && lowestHeight !== null) {
      // Find wires that have proposed heights
      const wiresWithProposed = spanWires.filter(wire => 
        wire.proposedMidspanHeight !== null &&
        (
          (category === 'communication' && this.isCommunicationWire(wire)) ||
          (category === 'electrical' && this.isElectricalWire(wire))
        )
      );
      
      // Find lowest proposed height
      let lowestProposed: number | null = null;
      
      wiresWithProposed.forEach(wire => {
        if (wire.proposedMidspanHeight !== null) {
          if (lowestProposed === null || wire.proposedMidspanHeight < lowestProposed) {
            lowestProposed = wire.proposedMidspanHeight;
          }
        }
      });
      
      // Use proposed if available and lower
      if (lowestProposed !== null && (lowestHeight === null || lowestProposed < lowestHeight)) {
        lowestHeight = lowestProposed;
      }
    }
    
    // Format the height
    const formattedHeight = lowestHeight !== null ? 
      this.formatHeight(lowestHeight) : 
      'N/A';
    
    return {
      height: lowestHeight,
      formattedHeight
    };
  }
  
  /**
   * Check if a wire is a communication wire
   * 
   * @param wire - Span wire to check
   * @returns True if this is a communication wire
   */
  private static isCommunicationWire(wire: SpanWire): boolean {
    const wireType = wire.wireType.toLowerCase();
    const owner = wire.owner.toLowerCase();
    
    return (
      wireType.includes('communication') ||
      wireType.includes('fiber') ||
      wireType.includes('cable') ||
      wireType.includes('telephone') ||
      wireType.includes('data') ||
      (!wireType.includes('primary') && !wireType.includes('secondary') && 
       !wireType.includes('neutral') && !wireType.includes('electrical') &&
       !owner.includes('cps energy'))
    );
  }
  
  /**
   * Check if a wire is an electrical wire
   * 
   * @param wire - Span wire to check
   * @returns True if this is an electrical wire
   */
  private static isElectricalWire(wire: SpanWire): boolean {
    const wireType = wire.wireType.toLowerCase();
    const owner = wire.owner.toLowerCase();
    
    return (
      wireType.includes('primary') ||
      wireType.includes('secondary') ||
      wireType.includes('neutral') ||
      wireType.includes('electrical') ||
      owner.includes('cps energy')
    );
  }
}

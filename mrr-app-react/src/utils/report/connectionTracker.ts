/**
 * ConnectionTracker Module
 * 
 * Handles extraction and processing of connection information between poles.
 * This module tracks the connections between poles and extracts midspan wire information.
 */

import type { 
  Connection, 
  Section, 
  SectionAnnotation, 
  ConnectionTrackerResult,
  SpanWire
} from './types';
import { getNestedValue, parseImperialMeasurement } from '../dataUtils';

export class ConnectionTracker {
  /**
   * Process connection data from Katapult JSON
   * 
   * @param katapultData - The full Katapult JSON data
   * @returns Connection tracking result containing connection mappings and wire information
   */
  public static processConnections(katapultData: Record<string, unknown> | null | undefined): ConnectionTrackerResult {
    if (!katapultData) {
      return { connections: [], spanWires: [] };
    }
    
    const connections: Connection[] = [];
    
    // Extract connection data from Katapult
    const connectionsData = getNestedValue<Record<string, unknown>>(
      katapultData, 
      ['connections'], 
      {}
    );
    
    if (!connectionsData || Object.keys(connectionsData).length === 0) {
      console.warn('No connection data found in Katapult data');
      return { connections: [], spanWires: [] };
    }
    
    // Process each connection
    Object.entries(connectionsData).forEach(([connectionId, connectionData]) => {
      const typedConnectionData = connectionData as Record<string, unknown>;
      const fromPoleId = getNestedValue<string>(typedConnectionData, ['node_id_1'], '');
      const toPoleId = getNestedValue<string>(typedConnectionData, ['node_id_2'], '');
      
      if (!fromPoleId || !toPoleId) {
        console.warn(`Connection ${connectionId} missing pole IDs`);
        return;
      }
      
      // Check if this is a REF connection (reference measurements)
      const isREFConnection = this.isReferenceConnection(typedConnectionData);
      
      // Extract section data
      const sectionsData = getNestedValue<Record<string, unknown>>(
        typedConnectionData, 
        ['sections'], 
        {}
      );
      
      const sections: Section[] = [];
      
      if (sectionsData && Object.keys(sectionsData).length > 0) {
        // Process each section in the connection
        Object.entries(sectionsData).forEach(([sectionId, sectionData]) => {
          const typedSectionData = sectionData as Record<string, unknown>;
          // Extract section annotations (wire information)
          const annotations = this.extractSectionAnnotations(typedSectionData);
          
          if (annotations.length > 0) {
            sections.push({
              id: sectionId,
              annotations,
              latitude: getNestedValue<number>(typedSectionData, ['latitude'], undefined),
              longitude: getNestedValue<number>(typedSectionData, ['longitude'], undefined)
            });
          }
        });
      }
      
      // Only add the connection if it has valid sections with annotations
      if (sections.length > 0) {
        connections.push({
          id: connectionId,
          fromPoleId,
          toPoleId,
          sections,
          isREFConnection
        });
      }
    });
    
    // Generate unique wire list from all sections
    const spanWires = this.generateSpanWireList(connections);
    
    return {
      connections,
      spanWires
    };
  }
  
  /**
   * Check if a connection is a reference connection (REF)
   * 
   * @param connectionData - Connection data from Katapult
   * @returns True if this is a reference connection
   */
  private static isReferenceConnection(connectionData: Record<string, unknown>): boolean {
    // Look for reference indicators in connection attributes or type
    const connectionType = getNestedValue<string>(
      connectionData, 
      ['attributes', 'connection_type', 'one'],
      ''
    );
    
    const isReference = getNestedValue<boolean>(
      connectionData, 
      ['attributes', 'is_reference', 'one'],
      false
    );
    
    return Boolean(isReference) || 
           Boolean(connectionType?.toLowerCase().includes('ref')) || 
           Boolean(connectionType?.toLowerCase().includes('reference'));
  }
  
  /**
   * Extract annotation data from a section
   * 
   * @param sectionData - Section data from Katapult
   * @returns Array of section annotations
   */
  private static extractSectionAnnotations(sectionData: Record<string, unknown>): SectionAnnotation[] {
    const annotations: SectionAnnotation[] = [];
    
    // Get annotations from section
    const annotationsData = getNestedValue<Record<string, unknown>>(
      sectionData, 
      ['annotations'], 
      {}
    );
    
    if (!annotationsData || Object.keys(annotationsData).length === 0) {
      return annotations;
    }
    
    // Process each annotation
    Object.entries(annotationsData).forEach(([annotationId, annotationData]) => {
      const typedAnnotationData = annotationData as Record<string, unknown>;
      
      const equipmentType = getNestedValue<string>(
        typedAnnotationData, 
        ['attributes', 'equipment_type', 'button_added'],
        getNestedValue<string>(typedAnnotationData, ['attributes', 'equipment_type', 'one'], '')
      );
      
      const ownerName = getNestedValue<string>(
        typedAnnotationData, 
        ['attributes', 'owner_name', 'one'],
        ''
      );
      
      // Get height in multiple formats
      const measuredHeightFt = getNestedValue<string>(
        typedAnnotationData, 
        ['attributes', 'measured_height_ft', 'one'],
        ''
      );
      
      // If height is available as decimal directly
      const heightFtDecimal = getNestedValue<number>(
        typedAnnotationData, 
        ['attributes', 'height_ft_decimal', 'one'],
        null
      );
      
      // Only add valid annotations with equipment type and height
      if (equipmentType && (measuredHeightFt || heightFtDecimal !== null)) {
        annotations.push({
          id: annotationId,
          equipmentType,
          ownerName: ownerName || 'Unknown',
          measuredHeightFt: measuredHeightFt || '',
          heightFtDecimal: heightFtDecimal !== null ? 
            heightFtDecimal : 
            (measuredHeightFt ? parseImperialMeasurement(measuredHeightFt) : null)
        });
      }
    });
    
    return annotations;
  }
  
  /**
   * Generate a list of unique span wires from all connections
   * 
   * @param connections - Array of processed connections
   * @returns Array of unique span wires
   */
  private static generateSpanWireList(connections: Connection[]): SpanWire[] {
    // Map to store unique wires by type and owner
    const wireMap = new Map<string, SpanWire>();
    
    connections.forEach(connection => {
      connection.sections.forEach(section => {
        section.annotations.forEach(annotation => {
          // Skip annotations without height information
          if (annotation.heightFtDecimal === null) {
            return;
          }
          
          // Create a unique key for this wire type
          const wireKey = `${annotation.equipmentType}|${annotation.ownerName}`;
          
          // Get existing wire or create new one
          if (!wireMap.has(wireKey)) {
            wireMap.set(wireKey, {
              wireType: annotation.equipmentType,
              owner: annotation.ownerName,
              existingMidspanHeight: null,  // Will set to minimum later
              proposedMidspanHeight: null,
              moveValue: 0,
              isREFSubGroup: connection.isREFConnection,
              sections: []
            });
          }
          
          // Add this section to the wire's sections
          const wire = wireMap.get(wireKey);
          if (wire) {
            wire.sections.push({
              sectionId: section.id,
              connectionId: connection.id,
              annotation,
              isREF: connection.isREFConnection
            });
            
            // Update the minimum height if this is lower
            const height = annotation.heightFtDecimal;
            
            if (height !== null && height !== undefined && 
               (wire.existingMidspanHeight === null || height < wire.existingMidspanHeight)) {
              wire.existingMidspanHeight = height;
            }
          }
        });
      });
    });
    
    // Convert map to array and return
    return Array.from(wireMap.values());
  }
}

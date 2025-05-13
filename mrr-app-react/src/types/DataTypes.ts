/**
 * Core data type interfaces for the Make-Ready Report Generator
 */

// Application State interface
export interface AppState {
  processingComplete: boolean;
  currentStep: number;
  totalSteps: number;
}

// File State interface
export interface FileState {
  spidaFile: File | null;
  katapultFile: File | null;
  spidaData: SpidaData | null;
  katapultData: KatapultData | null;
}

// Measurement value with unit
export interface Measurement {
  unit: string;
  value: number;
}

// Alias interface
export interface Alias {
  id: string;
  [key: string]: string | number | boolean;
}

// SPIDA Data Interfaces
export interface SpidaData {
  leads: SpidaLead[];
  clientData: SpidaClientData;
  date?: string;
  dateModified?: number;
  clientFile?: string;
  label?: string;
  version?: number;
  engineer?: string;
  [key: string]: unknown;
}

export interface SpidaClientData {
  name: string;
  version: number;
  poles: SpidaPole[];
  wires: SpidaWire[];
  anchors?: SpidaAnchor[];
  equipments?: SpidaEquipment[];
  owners?: SpidaOwner[];
  designLayers?: SpidaDesignLayer[];
  [key: string]: unknown;
}

export interface SpidaPole {
  aliases: Alias[];
  shape: string;
  materialCategory: string;
  classOfPole: string;
  species: string;
  height: Measurement;
  taper: number;
  density: Measurement;
  ptc: Measurement;
  [key: string]: unknown;
}

export interface SpidaWire {
  aliases: Alias[];
  size: string;
  calculation: string;
  strength: Measurement;
  weight: Measurement;
  diameter: Measurement;
  description: string;
  usageGroups: string[];
  [key: string]: unknown;
}

export interface SpidaAnchor {
  aliases: Alias[];
  size: string;
  strength: Measurement;
  [key: string]: unknown;
}

export interface SpidaEquipment {
  aliases: Alias[];
  size: string;
  type: {
    name: string;
    industry: string;
  };
  weight: Measurement;
  [key: string]: unknown;
}

export interface SpidaOwner {
  industry: string;
  id: string;
  [key: string]: unknown;
}

export interface SpidaDesignLayer {
  name: string;
  type: string;
  [key: string]: unknown;
}

export interface SpidaLead {
  label: string;
  locations: SpidaLocation[];
  [key: string]: unknown;
}

export interface SpidaLocation {
  label: string;
  designs: SpidaDesign[];
  geographicCoordinate?: {
    type: string;
    coordinates: number[];
  };
  [key: string]: unknown;
}

export interface SpidaDesign {
  label: string;
  layerType: string;
  structure: SpidaStructure;
  analysis?: SpidaAnalysis[];
  [key: string]: unknown;
}

export interface SpidaStructure {
  pole: SpidaStructurePole;
  wires: SpidaStructureWire[];
  guys?: SpidaStructureGuy[];
  equipments?: SpidaStructureEquipment[];
  insulators?: SpidaStructureInsulator[];
  anchors?: SpidaStructureAnchor[];
  crossArms?: SpidaStructureCrossArm[];
  [key: string]: unknown;
}

export interface SpidaStructurePole {
  id: string;
  owner: string;
  glc: Measurement;
  agl: Measurement;
  clientItem: string;
  [key: string]: unknown;
}

export interface SpidaStructureWire {
  id: string;
  owner: string;
  clientItem: string;
  attachmentHeight: Measurement;
  usageGroup: string;
  midspanHeight?: Measurement;
  [key: string]: unknown;
}

export interface SpidaStructureGuy {
  id: string;
  owner: string;
  clientItem: string;
  attachmentHeight: Measurement;
  [key: string]: unknown;
}

export interface SpidaStructureEquipment {
  id: string;
  owner: string;
  clientItem: string;
  attachmentHeight: Measurement;
  direction: number;
  [key: string]: unknown;
}

export interface SpidaStructureInsulator {
  id: string;
  owner: string;
  clientItem: string;
  wires: string[];
  [key: string]: unknown;
}

export interface SpidaStructureAnchor {
  id: string;
  clientItem: string;
  height: Measurement;
  direction: number;
  distance: Measurement;
  [key: string]: unknown;
}

export interface SpidaStructureCrossArm {
  id: string;
  owner: string;
  clientItem: string;
  attachmentHeight: Measurement;
  insulators: string[];
  [key: string]: unknown;
}

export interface SpidaAnalysis {
  id: string;
  analysisCaseDetails: Record<string, unknown>;
  results: SpidaAnalysisResult[];
  [key: string]: unknown;
}

export interface SpidaAnalysisResult {
  actual: number;
  allowable: number;
  unit: string;
  component: string;
  loadInfo: string;
  passes: boolean;
  analysisType: string;
  [key: string]: unknown;
}

// Katapult Data Interfaces
export interface KatapultData {
  nodes: Record<string, KatapultNode>;
  connections?: Record<string, KatapultConnection>;
  name?: string;
  project_folder?: string;
  date_created?: number;
  job_owner?: string;
  job_creator?: string;
  [key: string]: unknown;
}

export interface KatapultNode {
  _created: {
    method: string;
    timestamp: number;
    uid: string;
  };
  attributes: Record<string, KatapultAttribute>;
  button: string;
  latitude: number;
  longitude: number;
  photos?: Record<string, KatapultPhotoAssociation>;
  [key: string]: unknown;
}

export interface KatapultAttribute {
  '-Imported'?: string | number | boolean | object;
  'one'?: string | number | boolean | object;
  'auto_calced'?: string | number | boolean | object;
  'assessment'?: string | number | boolean | object;
  button_added?: string | boolean;
  [key: string]: unknown;
}

export interface KatapultConnection {
  _created: {
    method: string;
    timestamp: number;
    uid: string;
  };
  attributes: Record<string, KatapultAttribute>;
  button: string;
  node_id_1: string;
  node_id_2: string;
  sections?: Record<string, KatapultSection>;
  [key: string]: unknown;
}

export interface KatapultSection {
  _created: {
    method: string;
    timestamp: number;
    uid: string;
  };
  latitude: number;
  longitude: number;
  multi_attributes?: Record<string, unknown>;
  breakpoints?: number[][];
  [key: string]: unknown;
}

export interface KatapultPhotoAssociation {
  association: string | boolean;
  association_type: string;
  [key: string]: unknown;
}

// Correlation result interface
export interface CorrelationResult {
  correlatedPoles: CorrelatedPole[];
  unmatchedSpidaPoles: SpidaLocation[];
  katapultOnlyPoles: Record<string, unknown>[];
}

// Correlated pole interface
export interface CorrelatedPole {
  spidaPole: SpidaLocation;
  katapultNode: Record<string, unknown>;
  matchType: 'exact' | 'partial' | 'algorithm';
}

// Report data interface
export interface ReportData {
  matchStatus: string;
  operationNumber: number;
  attachmentAction: string;
  poleOwner: string;
  poleNumber: string;
  poleStructure: string;
  proposedFeatures: string;
  constructionGrade: string;
  lowestCommMidspanHeight: string;
  lowestCPSElectricalMidspanHeight: string;
  midspanFromPole: string;
  midspanToPole: string;
  charterSpectrumDescription: string;
  existingHeight: string;
  proposedHeight: string;
  existingMidspan: string;
  proposedMidspan: string;
  [key: string]: string | number | boolean;
}

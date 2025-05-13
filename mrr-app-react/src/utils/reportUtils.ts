/**
 * Utility functions for generating the Make-Ready Report
 * This file re-exports from the modular report structure
 */

// Re-export types
export type { CharterAttachment, AttachmentAction } from './report/types';

// Re-export the main report generator function
export { generateReport } from './report/reportGenerator';

// Re-export utility classes
export { ReportDataFactory } from './report/reportDataFactory';
export { SpidaDataExtractor } from './report/spidaDataExtractor';
export { KatapultDataExtractor } from './report/katapultDataExtractor';
export { AttachmentAnalyzer } from './report/attachmentAnalyzer';

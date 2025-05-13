import React, { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';

interface FileUploadProps {
  onFilesSelected: (spidaFile: File | null, katapultFile: File | null) => void;
  isProcessing: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, isProcessing }) => {
  const [dragOver, setDragOver] = useState(false);
  const [fileState, setFileState] = useState<{
    spidaFile: File | null;
    spidaFileName: string;
    katapultFile: File | null;
    katapultFileName: string;
  }>({
    spidaFile: null,
    spidaFileName: 'No file selected',
    katapultFile: null,
    katapultFileName: 'No file selected'
  });

  const spidaFileInputRef = useRef<HTMLInputElement>(null);
  const katapultFileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processDroppedFiles(files);
    }
  };

  const processDroppedFiles = (files: FileList) => {
    let spidaFile: File | null = fileState.spidaFile;
    let katapultFile: File | null = fileState.katapultFile;
    
    Array.from(files).forEach(file => {
      if (!file.name.toLowerCase().endsWith('.json')) {
        return; // Skip non-JSON files
      }
      
      if (file.name.toLowerCase().includes('spida')) {
        spidaFile = file;
        if (spidaFileInputRef.current) {
          // Create a DataTransfer to set files programmatically
          const dt = new DataTransfer();
          dt.items.add(file);
          spidaFileInputRef.current.files = dt.files;
        }
      } else if (file.name.toLowerCase().includes('katapult')) {
        katapultFile = file;
        if (katapultFileInputRef.current) {
          const dt = new DataTransfer();
          dt.items.add(file);
          katapultFileInputRef.current.files = dt.files;
        }
      } else if (files.length === 2) {
        // If exactly 2 files dropped and not determined by name
        if (!spidaFile) {
          spidaFile = files[0];
          if (spidaFileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(files[0]);
            spidaFileInputRef.current.files = dt.files;
          }
        }
        if (!katapultFile) {
          katapultFile = files[1];
          if (katapultFileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(files[1]);
            katapultFileInputRef.current.files = dt.files;
          }
        }
      }
    });
    
    updateFileState(spidaFile, katapultFile);
  };
  
  const handleSpidaFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    updateFileState(file, fileState.katapultFile);
  };
  
  const handleKatapultFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    updateFileState(fileState.spidaFile, file);
  };
  
  const updateFileState = (spidaFile: File | null, katapultFile: File | null) => {
    const newState = {
      spidaFile,
      spidaFileName: spidaFile ? `Selected: ${spidaFile.name}` : 'No file selected',
      katapultFile,
      katapultFileName: katapultFile ? `Selected: ${katapultFile.name}` : 'No file selected'
    };
    
    setFileState(newState);
    onFilesSelected(spidaFile, katapultFile);
  };
  
  return (
    <div 
      className={`upload-container ${dragOver ? 'drag-over' : ''}`} 
      id="dropZone"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h2>Upload Files</h2>
      <p>Drag and drop files here or click to select files</p>
      
      <div className="file-inputs">
        <div className="file-group">
          <label htmlFor="spidaFile">SPIDAcalc JSON:</label>
          <input 
            type="file" 
            id="spidaFile" 
            ref={spidaFileInputRef}
            accept=".json"
            onChange={handleSpidaFileChange}
            disabled={isProcessing}
          />
          <span className="file-status" id="spidaFileStatus">
            {fileState.spidaFileName}
          </span>
        </div>
        
        <div className="file-group">
          <label htmlFor="katapultFile">Katapult JSON:</label>
          <input 
            type="file" 
            id="katapultFile" 
            ref={katapultFileInputRef}
            accept=".json"
            onChange={handleKatapultFileChange}
            disabled={isProcessing}
          />
          <span className="file-status" id="katapultFileStatus">
            {fileState.katapultFileName}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;

import React from 'react';

interface ProcessingStatusProps {
  isVisible: boolean;
  percent: number;
  message: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ isVisible, percent, message }) => {
  if (!isVisible) return null;
  
  return (
    <div className="processing-status">
      <div className="progress-container">
        <div 
          className="progress-bar" 
          style={{ width: `${percent}%` }}
        />
      </div>
      <p id="statusMessage">{message}</p>
    </div>
  );
};

export default ProcessingStatus;

import React from 'react';
import { ResolutionPreset } from '../../utils/deviceCapabilities';
import './ResolutionControls.css';

interface ResolutionControlsProps {
  currentResolution: ResolutionPreset;
  availableResolutions: ResolutionPreset[];
  onResolutionChange: (resolution: ResolutionPreset) => void;
  disabled?: boolean;
}

/**
 * Component for selecting video resolution
 */
export const ResolutionControls: React.FC<ResolutionControlsProps> = ({
  currentResolution,
  availableResolutions,
  onResolutionChange,
  disabled = false,
}) => {
  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedResolution = availableResolutions.find(
      resolution => resolution.label === e.target.value
    );
    
    if (selectedResolution) {
      onResolutionChange(selectedResolution);
    }
  };

  return (
    <div className="resolution-controls">
      <label htmlFor="resolution-select">Resolution:</label>
      <select
        id="resolution-select"
        value={currentResolution.label}
        onChange={handleResolutionChange}
        disabled={disabled}
        className="resolution-select"
      >
        {availableResolutions.map(resolution => (
          <option key={resolution.label} value={resolution.label}>
            {resolution.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ResolutionControls;
import React, { useState, useCallback } from 'react';
import { useCamera } from '../../hooks/useCamera';
import ResolutionControls from '../ResolutionControls/ResolutionControls';
import { ResolutionPreset } from '../../utils/deviceCapabilities';
import ErrorMessage from '../ErrorMessage/ErrorMessage';
import './Camera.css';

interface CameraProps {
  width?: number;
  height?: number;
  onFrame?: (video: HTMLVideoElement) => void;
  showResolutionControls?: boolean;
  initialResolution?: ResolutionPreset;
  onResolutionChange?: (resolution: ResolutionPreset) => void;
}

/**
 * Camera component for displaying video stream from webcam
 */
export const Camera: React.FC<CameraProps> = ({ 
  width = 640, 
  height = 480, 
  onFrame,
  showResolutionControls = false,
  initialResolution,
  onResolutionChange
}) => {
  const {
    videoRef,
    devices,
    currentDeviceId,
    currentResolution,
    availableResolutions,
    error,
    isLoading,
    switchCamera,
    changeResolution,
    startCamera,
    stopCamera,
  } = useCamera({ 
    width, 
    height,
    initialResolution
  });

  const [isActive, setIsActive] = useState(false);

  // Get suggestion based on error message
  const getErrorSuggestion = (errorMessage: string): string => {
    if (errorMessage.includes('Camera access denied')) {
      return 'Please check your browser settings and ensure camera permissions are granted. You may need to refresh the page after changing permissions.';
    } else if (errorMessage.includes('No camera found')) {
      return 'Please connect a camera to your device and refresh the page. If you have a camera connected, it might not be recognized by your browser.';
    } else if (errorMessage.includes('Camera is already in use')) {
      return 'Please close any other applications or browser tabs that might be using your camera, then try again.';
    } else if (errorMessage.includes('Camera API is not supported')) {
      return 'Your browser does not support the Camera API. Please try using a modern browser like Chrome, Firefox, or Safari.';
    } else {
      return 'Please check your camera connection and browser settings, then try again.';
    }
  };

  // Handle retry for camera errors
  const handleCameraRetry = useCallback(() => {
    startCamera();
  }, [startCamera]);

  // Handle camera toggle
  const handleToggleCamera = async () => {
    if (isActive) {
      stopCamera();
      setIsActive(false);
    } else {
      await startCamera();
      setIsActive(true);
    }
  };

  // Handle camera selection change
  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    switchCamera(e.target.value);
  };

  // Process video frames if onFrame callback is provided
  const handleVideoPlay = () => {
    if (onFrame && videoRef.current) {
      const processFrame = () => {
        if (videoRef.current && isActive) {
          onFrame(videoRef.current);
          requestAnimationFrame(processFrame);
        }
      };
      requestAnimationFrame(processFrame);
    }
  };

  return (
    <div className="camera-container">
      <div className="camera-header">
        <h2>Camera</h2>
        <div className="camera-controls">
          {devices.length > 1 && (
            <select 
              value={currentDeviceId || ''} 
              onChange={handleCameraChange}
              disabled={!isActive || isLoading}
              className="camera-select"
            >
              {devices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${devices.indexOf(device) + 1}`}
                </option>
              ))}
            </select>
          )}
          {showResolutionControls && (
            <ResolutionControls
              currentResolution={currentResolution}
              availableResolutions={availableResolutions}
              onResolutionChange={(resolution) => {
                changeResolution(resolution);
                if (onResolutionChange) {
                  onResolutionChange(resolution);
                }
              }}
              disabled={!isActive || isLoading}
            />
          )}
          <button 
            onClick={handleToggleCamera} 
            disabled={isLoading}
            className={`camera-toggle ${isActive ? 'active' : ''}`}
          >
            {isLoading ? 'Loading...' : isActive ? 'Stop Camera' : 'Start Camera'}
          </button>
        </div>
      </div>

      <div className="camera-view" style={{ width, height }}>
        {error && (
          <ErrorMessage
            type="error"
            title="Camera Error"
            message={error}
            suggestion={getErrorSuggestion(error)}
            onRetry={handleCameraRetry}
            className="camera-error-message"
          />
        )}
        {isLoading && (
          <ErrorMessage
            type="info"
            title="Loading"
            message="Initializing camera..."
            suggestion="This may take a few moments. Please wait."
            className="camera-loading-message"
          />
        )}
        <video
          ref={videoRef}
          width={width}
          height={height}
          autoPlay
          playsInline
          muted
          onPlay={handleVideoPlay}
          className={isActive ? 'active' : ''}
        />
      </div>
    </div>
  );
};

export default Camera;

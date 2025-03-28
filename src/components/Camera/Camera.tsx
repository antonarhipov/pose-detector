import React, { useState } from 'react';
import { useCamera } from '../../hooks/useCamera';
import './Camera.css';

interface CameraProps {
  width?: number;
  height?: number;
  onFrame?: (video: HTMLVideoElement) => void;
}

/**
 * Camera component for displaying video stream from webcam
 */
export const Camera: React.FC<CameraProps> = ({ 
  width = 640, 
  height = 480, 
  onFrame 
}) => {
  const {
    videoRef,
    devices,
    currentDeviceId,
    error,
    isLoading,
    switchCamera,
    startCamera,
    stopCamera,
  } = useCamera({ width, height });

  const [isActive, setIsActive] = useState(false);

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
        {error && <div className="camera-error">{error}</div>}
        {isLoading && <div className="camera-loading">Loading camera...</div>}
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
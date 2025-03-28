import React, { useState, useRef, useCallback } from 'react';
import Camera from '../Camera/Camera';
import PoseCanvas from '../PoseCanvas/PoseCanvas';
import usePoseDetection from '../../hooks/usePoseDetection';
import './PoseDetector.css';

interface PoseDetectorProps {
  width?: number;
  height?: number;
}

/**
 * Component that integrates camera and pose detection
 */
export const PoseDetector: React.FC<PoseDetectorProps> = ({
  width = 640,
  height = 480,
}) => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showKeypoints, setShowKeypoints] = useState(true);

  // Get video element reference from Camera component
  const handleVideoRef = useCallback((video: HTMLVideoElement) => {
    setVideoElement(video);
  }, []);

  // Use pose detection hook
  const {
    poses,
    isLoading: isDetectorLoading,
    error: detectorError,
    startDetection,
    stopDetection,
  } = usePoseDetection(videoElement, {
    enabled: isDetecting,
    preferWebGL: true,
    detectionInterval: 100, // Adjust based on performance needs
  });

  // Toggle pose detection
  const handleToggleDetection = () => {
    if (isDetecting) {
      stopDetection();
      setIsDetecting(false);
    } else {
      startDetection();
      setIsDetecting(true);
    }
  };

  return (
    <div className="pose-detector-container">
      <div className="pose-detector-header">
        <h2>Pose Detector</h2>
        <div className="pose-detector-controls">
          <button
            onClick={handleToggleDetection}
            disabled={!videoElement || isDetectorLoading}
            className={`detection-toggle ${isDetecting ? 'active' : ''}`}
          >
            {isDetectorLoading ? 'Loading...' : isDetecting ? 'Stop Detection' : 'Start Detection'}
          </button>
          <div className="visualization-controls">
            <label>
              <input
                type="checkbox"
                checked={showSkeleton}
                onChange={() => setShowSkeleton(!showSkeleton)}
              />
              Skeleton
            </label>
            <label>
              <input
                type="checkbox"
                checked={showKeypoints}
                onChange={() => setShowKeypoints(!showKeypoints)}
              />
              Keypoints
            </label>
          </div>
        </div>
      </div>

      <div className="pose-detector-view" style={{ width, height }}>
        {detectorError && <div className="pose-detector-error">{detectorError}</div>}
        
        {/* Camera component */}
        <Camera
          width={width}
          height={height}
          onFrame={handleVideoRef}
        />
        
        {/* Pose visualization overlay */}
        {videoElement && poses.length > 0 && (
          <div className="pose-canvas-container">
            <PoseCanvas
              poses={poses}
              videoWidth={width}
              videoHeight={height}
              showSkeleton={showSkeleton}
              showPoints={showKeypoints}
            />
          </div>
        )}
      </div>

      {/* Stats display */}
      <div className="pose-detector-stats">
        {isDetecting && (
          <>
            <p>Detected poses: {poses.length}</p>
            {poses.length > 0 && poses[0].score && (
              <p>Confidence: {(poses[0].score * 100).toFixed(1)}%</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default PoseDetector;
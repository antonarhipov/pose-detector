import React, { useState, useRef, useCallback, useEffect } from 'react';
import Camera from '../Camera/Camera';
import PoseCanvas from '../PoseCanvas/PoseCanvas';
import usePoseDetection from '../../hooks/usePoseDetection';
import { ResolutionPreset } from '../../utils/deviceCapabilities';
import { 
  FPSMonitor, 
  DEFAULT_PERFORMANCE_SETTINGS, 
  PerformanceSettings,
  shouldDecreaseResolution,
  canIncreaseResolution
} from '../../utils/performanceMonitor';
import ErrorMessage from '../ErrorMessage/ErrorMessage';
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

  // Performance monitoring
  const [fps, setFps] = useState<number>(0);
  const [performanceSettings, setPerformanceSettings] = useState<PerformanceSettings>(DEFAULT_PERFORMANCE_SETTINGS);
  const [autoAdjustEnabled, setAutoAdjustEnabled] = useState<boolean>(true);
  const [cameraResolution, setCameraResolution] = useState<ResolutionPreset | null>(null);
  const fpsMonitorRef = useRef<FPSMonitor | null>(null);
  const lastAdjustTimeRef = useRef<number>(0);

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

  // Adjust resolution based on FPS
  const adjustResolutionBasedOnFPS = useCallback((currentFPS: number) => {
    if (!autoAdjustEnabled || !cameraResolution) return;

    const now = performance.now();
    // Only adjust resolution at the specified interval
    if (now - lastAdjustTimeRef.current < performanceSettings.autoAdjustInterval) {
      return;
    }

    if (shouldDecreaseResolution(currentFPS, performanceSettings)) {
      // Find the next lower resolution
      const currentIndex = cameraResolution.width;
      const availableResolutions = [320, 640, 1280]; // Widths of low, medium, high
      const currentResIndex = availableResolutions.indexOf(currentIndex);

      if (currentResIndex > 0) {
        // There is a lower resolution available
        const newWidth = availableResolutions[currentResIndex - 1];
        const newHeight = newWidth === 320 ? 240 : newWidth === 640 ? 480 : 720;

        // Find the matching resolution preset
        const newResolution = {
          label: newWidth === 320 ? 'Low (320x240)' : newWidth === 640 ? 'Medium (640x480)' : 'High (1280x720)',
          width: newWidth,
          height: newHeight
        };

        setCameraResolution(newResolution);
        console.log(`Decreased resolution to ${newResolution.label} due to low FPS (${currentFPS.toFixed(1)})`);
      }
    } else if (canIncreaseResolution(currentFPS, performanceSettings)) {
      // Find the next higher resolution
      const currentIndex = cameraResolution.width;
      const availableResolutions = [320, 640, 1280]; // Widths of low, medium, high
      const currentResIndex = availableResolutions.indexOf(currentIndex);

      if (currentResIndex < availableResolutions.length - 1) {
        // There is a higher resolution available
        const newWidth = availableResolutions[currentResIndex + 1];
        const newHeight = newWidth === 320 ? 240 : newWidth === 640 ? 480 : 720;

        // Find the matching resolution preset
        const newResolution = {
          label: newWidth === 320 ? 'Low (320x240)' : newWidth === 640 ? 'Medium (640x480)' : 'High (1280x720)',
          width: newWidth,
          height: newHeight
        };

        setCameraResolution(newResolution);
        console.log(`Increased resolution to ${newResolution.label} due to high FPS (${currentFPS.toFixed(1)})`);
      }
    }

    lastAdjustTimeRef.current = now;
  }, [autoAdjustEnabled, cameraResolution, performanceSettings]);

  // Initialize FPS monitor
  useEffect(() => {
    if (isDetecting) {
      // Create FPS monitor if it doesn't exist
      if (!fpsMonitorRef.current) {
        fpsMonitorRef.current = new FPSMonitor((currentFps) => {
          setFps(currentFps);
          adjustResolutionBasedOnFPS(currentFps);
        });
      }

      // Set up animation frame loop for FPS monitoring
      let animationFrameId: number;

      const monitorFrame = () => {
        if (fpsMonitorRef.current) {
          fpsMonitorRef.current.frame();
        }
        animationFrameId = requestAnimationFrame(monitorFrame);
      };

      animationFrameId = requestAnimationFrame(monitorFrame);

      // Clean up
      return () => {
        cancelAnimationFrame(animationFrameId);
      };
    }
  }, [isDetecting, adjustResolutionBasedOnFPS]);

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

  // Toggle auto-adjust resolution
  const handleToggleAutoAdjust = () => {
    setAutoAdjustEnabled(!autoAdjustEnabled);
  };

  // Handle resolution change from Camera component
  const handleResolutionChange = (resolution: ResolutionPreset) => {
    setCameraResolution(resolution);
  };

  // Get suggestion based on error message
  const getErrorSuggestion = (errorMessage: string): string => {
    if (errorMessage.includes('Failed to initialize pose detector')) {
      return 'This could be due to a network issue or a problem with TensorFlow.js. Try refreshing the page or check your internet connection.';
    } else if (errorMessage.includes('WebGL')) {
      return 'Your browser might not support WebGL, which is required for optimal performance. Try using a modern browser like Chrome or Firefox.';
    } else if (errorMessage.includes('model')) {
      return 'There was an issue loading the pose detection model. Check your internet connection and try again.';
    } else {
      return 'Please check your browser settings and internet connection, then try again.';
    }
  };

  // Handle retry for pose detection errors
  const handleDetectorRetry = useCallback(() => {
    if (isDetecting) {
      stopDetection();
      setTimeout(() => {
        startDetection();
      }, 500);
    } else {
      startDetection();
      setIsDetecting(true);
    }
  }, [isDetecting, startDetection, stopDetection]);


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
            <label>
              <input
                type="checkbox"
                checked={autoAdjustEnabled}
                onChange={handleToggleAutoAdjust}
              />
              Auto-adjust Resolution
            </label>
          </div>
          <div className="performance-stats">
            <span>FPS: {fps.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="pose-detector-view" style={{ width, height }}>
        {detectorError && (
          <ErrorMessage
            type="error"
            title="Pose Detection Error"
            message={detectorError}
            suggestion={getErrorSuggestion(detectorError)}
            onRetry={handleDetectorRetry}
            className="pose-detector-error-message"
          />
        )}
        {isDetectorLoading && !detectorError && (
          <ErrorMessage
            type="info"
            title="Initializing"
            message="Setting up pose detection..."
            suggestion="This may take a few moments. Please wait."
            className="pose-detector-loading-message"
          />
        )}

        {/* Camera component */}
        <Camera
          width={width}
          height={height}
          onFrame={handleVideoRef}
          showResolutionControls={true}
          initialResolution={cameraResolution || undefined}
          onResolutionChange={handleResolutionChange}
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

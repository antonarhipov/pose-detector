import { useState, useEffect, useCallback, useRef } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import {
  setupTensorFlow,
  initPoseDetector,
  detectPoses,
  disposePoseDetector,
  cleanupMemory,
  PoseDetectorConfig
} from '../services/poseDetection';

interface UsePoseDetectionOptions {
  enabled?: boolean;
  detectorConfig?: PoseDetectorConfig;
  preferWebGL?: boolean;
  detectionInterval?: number;
}

interface UsePoseDetectionReturn {
  poses: poseDetection.Pose[];
  isLoading: boolean;
  error: string | null;
  startDetection: () => void;
  stopDetection: () => void;
}

/**
 * Custom hook for pose detection using TensorFlow.js and PoseNet
 * @param video - Video element reference
 * @param options - Configuration options
 * @returns Pose detection state and controls
 */
export const usePoseDetection = (
  video: HTMLVideoElement | null,
  options: UsePoseDetectionOptions = {}
): UsePoseDetectionReturn => {
  const {
    enabled = true,
    detectorConfig,
    preferWebGL = true,
    detectionInterval = 100, // ms between detections
  } = options;

  const [poses, setPoses] = useState<poseDetection.Pose[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  
  const detectorRef = useRef<poseDetection.PoseDetector | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastDetectionTimeRef = useRef<number>(0);

  // Initialize TensorFlow and pose detector
  const initializeDetector = useCallback(async () => {
    if (detectorRef.current) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Set up TensorFlow backend
      await setupTensorFlow(preferWebGL);
      
      // Initialize the detector
      const detector = await initPoseDetector(detectorConfig);
      detectorRef.current = detector;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize pose detector';
      setError(errorMessage);
      console.error('Error initializing pose detector:', err);
    } finally {
      setIsLoading(false);
    }
  }, [detectorConfig, preferWebGL]);

  // Detect poses in the video frame
  const detectFrame = useCallback(async (timestamp: number) => {
    if (!video || !detectorRef.current || !isDetecting) return;
    
    // Throttle detection based on interval
    if (timestamp - lastDetectionTimeRef.current >= detectionInterval) {
      try {
        const detectedPoses = await detectPoses(video, detectorRef.current);
        setPoses(detectedPoses);
        lastDetectionTimeRef.current = timestamp;
        
        // Clean up memory periodically
        if (timestamp % 5000 < detectionInterval) { // Every ~5 seconds
          cleanupMemory();
        }
      } catch (err) {
        console.error('Error detecting poses:', err);
      }
    }
    
    // Continue detection loop
    requestRef.current = requestAnimationFrame(detectFrame);
  }, [video, isDetecting, detectionInterval]);

  // Start pose detection
  const startDetection = useCallback(async () => {
    if (!video || isDetecting) return;
    
    // Initialize detector if needed
    if (!detectorRef.current) {
      await initializeDetector();
    }
    
    setIsDetecting(true);
  }, [video, isDetecting, initializeDetector]);

  // Stop pose detection
  const stopDetection = useCallback(() => {
    setIsDetecting(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    setPoses([]);
  }, []);

  // Start/stop detection based on enabled prop
  useEffect(() => {
    if (enabled && video) {
      startDetection();
    } else {
      stopDetection();
    }
  }, [enabled, video, startDetection, stopDetection]);

  // Set up detection loop when isDetecting changes
  useEffect(() => {
    if (isDetecting && detectorRef.current) {
      requestRef.current = requestAnimationFrame(detectFrame);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isDetecting, detectFrame]);

  // Clean up resources on unmount
  useEffect(() => {
    return () => {
      stopDetection();
      if (detectorRef.current) {
        disposePoseDetector();
        detectorRef.current = null;
      }
    };
  }, [stopDetection]);

  return {
    poses,
    isLoading,
    error,
    startDetection,
    stopDetection,
  };
};

export default usePoseDetection;
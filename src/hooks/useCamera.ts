import { useState, useEffect, useRef, useCallback } from 'react';
import { ResolutionPreset, RESOLUTION_PRESETS } from '../utils/deviceCapabilities';

interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
  initialResolution?: ResolutionPreset;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  devices: MediaDeviceInfo[];
  currentDeviceId: string | null;
  currentResolution: ResolutionPreset;
  availableResolutions: ResolutionPreset[];
  error: string | null;
  isLoading: boolean;
  switchCamera: (deviceId: string) => Promise<void>;
  changeResolution: (resolution: ResolutionPreset) => Promise<void>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
}

/**
 * Custom hook for camera access and management
 * @param options - Camera options including width, height, and facing mode
 * @returns Camera controls and state
 */
export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize with medium resolution or provided resolution
  const initialResolution = options.initialResolution || 
    RESOLUTION_PRESETS.find(preset => preset.width === 640 && preset.height === 480) || 
    RESOLUTION_PRESETS[1];

  const [currentResolution, setCurrentResolution] = useState<ResolutionPreset>(initialResolution);

  // Get constraints based on current resolution and device
  const getConstraints = useCallback(() => {
    return {
      audio: false,
      video: {
        width: { ideal: currentResolution.width },
        height: { ideal: currentResolution.height },
        facingMode: options.facingMode || 'user',
        deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
      },
    };
  }, [currentResolution, currentDeviceId, options.facingMode]);

  // Get available video devices
  const getVideoDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);

      // If no device is selected yet and we have devices, select the first one
      if (!currentDeviceId && videoDevices.length > 0) {
        setCurrentDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      setError('Failed to enumerate video devices');
      console.error('Error getting video devices:', err);
    }
  }, [currentDeviceId]);

  // Start the camera with current constraints
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Stop any existing stream
      if (stream) {
        stopCamera();
      }

      // Get user media with current constraints
      const currentConstraints = getConstraints();
      const mediaStream = await navigator.mediaDevices.getUserMedia(currentConstraints);
      setStream(mediaStream);

      // Set the stream as the video source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Enumerate available devices after getting permission
      await getVideoDevices();
    } catch (err) {
      let errorMessage = 'Failed to access camera';

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera access and try again.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please connect a camera and try again.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        }
      }

      setError(errorMessage);
      console.error('Error accessing camera:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getConstraints, getVideoDevices, stream]);

  // Switch to a different camera
  const switchCamera = useCallback(async (deviceId: string) => {
    setCurrentDeviceId(deviceId);
    await startCamera();
  }, [startCamera]);

  // Change resolution
  const changeResolution = useCallback(async (resolution: ResolutionPreset) => {
    setCurrentResolution(resolution);
    if (stream) {
      // Only restart the camera if it's already running
      await startCamera();
    }
  }, [stream, startCamera]);

  // Stop the camera and release resources
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  // Initialize camera on mount if devices are available
  useEffect(() => {
    // Check if mediaDevices API is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera API is not supported in this browser');
      return;
    }

    // Get available devices
    getVideoDevices();

    // Cleanup on unmount
    return () => {
      stopCamera();
    };
  }, [getVideoDevices, stopCamera]);

  return {
    videoRef,
    stream,
    devices,
    currentDeviceId,
    currentResolution,
    availableResolutions: RESOLUTION_PRESETS,
    error,
    isLoading,
    switchCamera,
    changeResolution,
    startCamera,
    stopCamera,
  };
};

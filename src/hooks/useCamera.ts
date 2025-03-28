import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  devices: MediaDeviceInfo[];
  currentDeviceId: string | null;
  error: string | null;
  isLoading: boolean;
  switchCamera: (deviceId: string) => Promise<void>;
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

  // Default camera constraints
  const constraints = {
    audio: false,
    video: {
      width: options.width || 640,
      height: options.height || 480,
      facingMode: options.facingMode || 'user',
      deviceId: currentDeviceId ? { exact: currentDeviceId } : undefined,
    },
  };

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
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
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
  }, [constraints, getVideoDevices, stream]);

  // Switch to a different camera
  const switchCamera = useCallback(async (deviceId: string) => {
    setCurrentDeviceId(deviceId);
    await startCamera();
  }, [startCamera]);

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
    error,
    isLoading,
    switchCamera,
    startCamera,
    stopCamera,
  };
};
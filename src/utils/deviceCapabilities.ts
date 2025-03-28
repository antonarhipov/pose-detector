/**
 * Utility functions for detecting device capabilities and recommending performance settings
 */

// Resolution presets
export interface ResolutionPreset {
  label: string;
  width: number;
  height: number;
}

export const RESOLUTION_PRESETS: ResolutionPreset[] = [
  { label: 'Low (320x240)', width: 320, height: 240 },
  { label: 'Medium (640x480)', width: 640, height: 480 },
  { label: 'High (1280x720)', width: 1280, height: 720 },
];

// Device capability levels
export enum DeviceCapabilityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

interface DeviceCapabilities {
  level: DeviceCapabilityLevel;
  recommendedResolution: ResolutionPreset;
  recommendedFps: number;
  supportsWebGL: boolean;
}

/**
 * Detects device capabilities and recommends performance settings
 * @returns Device capabilities and recommended settings
 */
export const detectDeviceCapabilities = async (): Promise<DeviceCapabilities> => {
  // Check if WebGL is supported
  const supportsWebGL = isWebGLSupported();
  
  // Detect device type and performance level
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEndDevice = isMobile && !isHighEndMobile();
  
  // Determine capability level
  let level: DeviceCapabilityLevel;
  let recommendedResolution: ResolutionPreset;
  let recommendedFps: number;
  
  if (isLowEndDevice || !supportsWebGL) {
    level = DeviceCapabilityLevel.LOW;
    recommendedResolution = RESOLUTION_PRESETS[0]; // Low resolution
    recommendedFps = 15;
  } else if (isMobile) {
    level = DeviceCapabilityLevel.MEDIUM;
    recommendedResolution = RESOLUTION_PRESETS[1]; // Medium resolution
    recommendedFps = 24;
  } else {
    level = DeviceCapabilityLevel.HIGH;
    recommendedResolution = RESOLUTION_PRESETS[2]; // High resolution
    recommendedFps = 30;
  }
  
  return {
    level,
    recommendedResolution,
    recommendedFps,
    supportsWebGL,
  };
};

/**
 * Checks if WebGL is supported in the current browser
 * @returns True if WebGL is supported
 */
export const isWebGLSupported = (): boolean => {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
};

/**
 * Attempts to determine if this is a high-end mobile device
 * This is a simple heuristic and not 100% accurate
 * @returns True if the device appears to be a high-end mobile device
 */
export const isHighEndMobile = (): boolean => {
  const memory = (navigator as any).deviceMemory;
  const cores = (navigator as any).hardwareConcurrency;
  
  // If we can detect memory or cores, use that information
  if (memory && memory >= 4) return true;
  if (cores && cores >= 6) return true;
  
  // Otherwise, use a simple heuristic based on device model
  const userAgent = navigator.userAgent;
  
  // Check for recent iPhone models (iPhone X or newer)
  if (/iPhone/.test(userAgent) && !/iPhone\s([4-8]|9_)/.test(userAgent)) {
    return true;
  }
  
  // Check for high-end Android devices
  if (/Android/.test(userAgent)) {
    // Look for indicators of high-end devices in the user agent
    if (/SM-G9|SM-N9|SM-S9|SM-S10|SM-S20|SM-S21|Pixel [3-6]|OnePlus [7-9]/.test(userAgent)) {
      return true;
    }
  }
  
  return false;
};

/**
 * Gets the optimal resolution based on the device's capabilities and current performance
 * @param fps Current frames per second
 * @param currentResolution Current resolution preset
 * @returns Recommended resolution preset
 */
export const getOptimalResolution = (
  fps: number,
  currentResolution: ResolutionPreset
): ResolutionPreset => {
  // If FPS is too low, recommend a lower resolution
  if (fps < 15 && currentResolution !== RESOLUTION_PRESETS[0]) {
    // Step down one level
    const currentIndex = RESOLUTION_PRESETS.findIndex(
      preset => preset.width === currentResolution.width
    );
    if (currentIndex > 0) {
      return RESOLUTION_PRESETS[currentIndex - 1];
    }
  }
  
  // If FPS is very good, we could potentially increase resolution
  if (fps > 40 && currentResolution !== RESOLUTION_PRESETS[2]) {
    // Step up one level
    const currentIndex = RESOLUTION_PRESETS.findIndex(
      preset => preset.width === currentResolution.width
    );
    if (currentIndex < RESOLUTION_PRESETS.length - 1) {
      return RESOLUTION_PRESETS[currentIndex + 1];
    }
  }
  
  // Otherwise, keep the current resolution
  return currentResolution;
};
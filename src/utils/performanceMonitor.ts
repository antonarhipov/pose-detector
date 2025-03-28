/**
 * Utility for monitoring and optimizing application performance
 */

// FPS monitoring
export class FPSMonitor {
  private frames: number = 0;
  private lastTime: number = 0;
  private fps: number = 0;
  private updateInterval: number = 1000; // Update FPS every second
  private callback?: (fps: number) => void;

  /**
   * Create a new FPS monitor
   * @param callback Optional callback function that will be called with the current FPS
   */
  constructor(callback?: (fps: number) => void) {
    this.callback = callback;
    this.lastTime = performance.now();
  }

  /**
   * Register a frame
   * Should be called on each animation frame
   */
  frame(): void {
    this.frames++;
    const now = performance.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= this.updateInterval) {
      this.fps = (this.frames * 1000) / elapsed;
      this.lastTime = now;
      this.frames = 0;

      if (this.callback) {
        this.callback(this.fps);
      }
    }
  }

  /**
   * Get the current FPS
   * @returns Current frames per second
   */
  getFPS(): number {
    return this.fps;
  }
}

// Performance optimization
export interface PerformanceSettings {
  targetFPS: number;
  minAcceptableFPS: number;
  autoAdjustResolution: boolean;
  autoAdjustInterval: number; // ms
}

export const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  targetFPS: 30,
  minAcceptableFPS: 15,
  autoAdjustResolution: true,
  autoAdjustInterval: 5000, // Check every 5 seconds
};

/**
 * Determines if the resolution should be adjusted based on current FPS
 * @param currentFPS Current frames per second
 * @param settings Performance settings
 * @returns True if resolution should be decreased, false otherwise
 */
export const shouldDecreaseResolution = (
  currentFPS: number,
  settings: PerformanceSettings = DEFAULT_PERFORMANCE_SETTINGS
): boolean => {
  return currentFPS < settings.minAcceptableFPS;
};

/**
 * Determines if the resolution can be increased based on current FPS
 * @param currentFPS Current frames per second
 * @param settings Performance settings
 * @returns True if resolution can be increased, false otherwise
 */
export const canIncreaseResolution = (
  currentFPS: number,
  settings: PerformanceSettings = DEFAULT_PERFORMANCE_SETTINGS
): boolean => {
  // Only increase resolution if we're well above the target FPS
  return currentFPS > settings.targetFPS * 1.5;
};
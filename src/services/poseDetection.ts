import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';

// Configure TensorFlow.js backend
export const setupTensorFlow = async (preferWebGL = true): Promise<void> => {
  // Try to use WebGL backend if preferred and available
  if (preferWebGL && tf.getBackend() !== 'webgl') {
    try {
      await tf.setBackend('webgl');
      console.log('Using WebGL backend for TensorFlow.js');
    } catch (error) {
      console.warn('WebGL backend not available, falling back to CPU', error);
      await tf.setBackend('cpu');
      console.log('Using CPU backend for TensorFlow.js');
    }
  } else if (!preferWebGL) {
    await tf.setBackend('cpu');
    console.log('Using CPU backend for TensorFlow.js');
  }

  // Enable memory management
  tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
  tf.env().set('WEBGL_FLUSH_THRESHOLD', 0);
};

// Model configuration
export interface PoseDetectorConfig {
  modelType?: poseDetection.movenet.ModelType;
  enableSmoothing?: boolean;
  minPoseScore?: number;
  multiPoseMaxDimension?: number;
}

// Default configuration
const defaultConfig: PoseDetectorConfig = {
  modelType: 'SinglePose.Lightning', // 'SinglePose.Lightning' is faster, 'SinglePose.Thunder' is more accurate
  enableSmoothing: true,
  minPoseScore: 0.25,
  multiPoseMaxDimension: 256,
};

// Detector instance
let detector: poseDetection.PoseDetector | null = null;

// Initialize the pose detector
export const initPoseDetector = async (
  config: PoseDetectorConfig = defaultConfig
): Promise<poseDetection.PoseDetector> => {
  if (detector) {
    return detector;
  }

  // Make sure TensorFlow.js is set up
  if (!tf.getBackend()) {
    await setupTensorFlow();
  }

  // Create detector options
  const modelType = config.modelType || defaultConfig.modelType;
  const detectorConfig: poseDetection.movenet.ModelConfig = {
    modelType,
    enableSmoothing: config.enableSmoothing ?? defaultConfig.enableSmoothing,
    minPoseScore: config.minPoseScore ?? defaultConfig.minPoseScore,
    multiPoseMaxDimension: config.multiPoseMaxDimension ?? defaultConfig.multiPoseMaxDimension,
  };

  // Create the detector
  try {
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      detectorConfig
    );
    console.log('Pose detector initialized with config:', detectorConfig);
    return detector;
  } catch (error) {
    console.error('Error initializing pose detector:', error);
    throw new Error('Failed to initialize pose detector');
  }
};

// Detect poses in a video frame
export const detectPoses = async (
  video: HTMLVideoElement,
  detector?: poseDetection.PoseDetector
): Promise<poseDetection.Pose[]> => {
  // Make sure we have a detector
  const poseDetector = detector || await initPoseDetector();

  // Check if video is ready
  if (
    video.readyState < 2 || // HAVE_CURRENT_DATA
    video.paused ||
    video.ended ||
    !video.width ||
    !video.height
  ) {
    return [];
  }

  try {
    // Detect poses
    const poses = await poseDetector.estimatePoses(video, {
      flipHorizontal: false,
      maxPoses: 1, // For now, we only detect one pose
    });

    return poses;
  } catch (error) {
    console.error('Error detecting poses:', error);
    return [];
  }
};

// Clean up resources
export const disposePoseDetector = async (): Promise<void> => {
  if (detector) {
    await detector.dispose();
    detector = null;
    console.log('Pose detector disposed');
  }
};

// Get the current TensorFlow.js memory info
export const getMemoryInfo = (): tf.MemoryInfo => {
  return tf.memory();
};

// Clean up unused tensors
export const cleanupMemory = (): void => {
  tf.tidy(() => {});
  tf.disposeVariables();
  if (tf.getBackend() === 'webgl') {
    const gl = tf.backend().getGPGPUContext().gl;
    const numTexturesInGPU = gl.getParameter(gl.TEXTURE_BINDING_2D);
    console.log('Number of textures in GPU:', numTexturesInGPU);
  }
  console.log('Memory cleaned up');
};

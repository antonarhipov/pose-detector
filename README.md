# Pose Detector

A web-based application for real-time human pose detection using TensorFlow.js and PoseNet.

## Features

- Real-time webcam video processing
- Human pose detection and tracking
- Visualization of keypoints and skeleton overlay
- Camera selection functionality
- Adjustable visualization options

## Tech Stack

- React 18 with TypeScript
- TensorFlow.js with PoseNet for pose estimation
- HTML5 Video/Canvas APIs for video handling
- Vite as the build tool

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A modern web browser with webcam support (Chrome, Firefox, Safari)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/pose-detector.git
   cd pose-detector
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Click the "Start Camera" button to access your webcam
2. If you have multiple cameras, select the desired one from the dropdown
3. Click "Start Detection" to begin pose detection
4. Use the checkboxes to toggle the display of skeleton and keypoints
5. Click "Stop Detection" to pause pose detection
6. Click "Stop Camera" to stop the webcam feed

## Building for Production

To create a production build:

```
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

- `src/components/` - React components
  - `Camera/` - Camera access and video display
  - `PoseCanvas/` - Canvas overlay for pose visualization
  - `PoseDetector/` - Main component integrating camera and pose detection
- `src/hooks/` - Custom React hooks
  - `useCamera.ts` - Hook for camera access and management
  - `usePoseDetection.ts` - Hook for pose detection
- `src/services/` - Service modules
  - `poseDetection.ts` - TensorFlow.js and PoseNet integration
- `src/utils/` - Utility functions
- `public/` - Static assets

## Browser Compatibility

This application works best in:
- Chrome (desktop and mobile)
- Firefox (desktop and mobile)
- Safari (desktop and mobile)

## Privacy

All video processing happens locally in your browser. No video data is sent to any server.

## License

MIT

## Acknowledgements

- [TensorFlow.js](https://www.tensorflow.org/js)
- [PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection)
- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
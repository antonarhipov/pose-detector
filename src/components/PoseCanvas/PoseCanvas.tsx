import React, { useRef, useEffect } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import './PoseCanvas.css';

interface PoseCanvasProps {
  poses: poseDetection.Pose[];
  videoWidth: number;
  videoHeight: number;
  showSkeleton?: boolean;
  showPoints?: boolean;
  pointRadius?: number;
  lineWidth?: number;
  pointColor?: string;
  skeletonColor?: string;
}

// Define the connections between keypoints for the skeleton
const POSE_CONNECTIONS = [
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['right_shoulder', 'right_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['right_hip', 'right_knee'],
  ['left_knee', 'left_ankle'],
  ['right_knee', 'right_ankle'],
];

/**
 * Component for rendering pose keypoints and skeleton on a canvas
 */
export const PoseCanvas: React.FC<PoseCanvasProps> = ({
  poses,
  videoWidth,
  videoHeight,
  showSkeleton = true,
  showPoints = true,
  pointRadius = 4,
  lineWidth = 2,
  pointColor = '#FF0000',
  skeletonColor = '#FFFFFF',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw the poses on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each pose
    poses.forEach((pose) => {
      if (pose.keypoints) {
        if (showSkeleton) {
          drawSkeleton(ctx, pose.keypoints, skeletonColor, lineWidth);
        }
        if (showPoints) {
          drawKeypoints(ctx, pose.keypoints, pointColor, pointRadius);
        }
      }
    });
  }, [poses, videoWidth, videoHeight, showSkeleton, showPoints, pointRadius, lineWidth, pointColor, skeletonColor]);

  // Draw the keypoints
  const drawKeypoints = (
    ctx: CanvasRenderingContext2D,
    keypoints: poseDetection.Keypoint[],
    color: string,
    radius: number
  ) => {
    keypoints.forEach((keypoint) => {
      if (keypoint.score && keypoint.score > 0.3) {
        const { x, y } = keypoint;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }
    });
  };

  // Draw the skeleton
  const drawSkeleton = (
    ctx: CanvasRenderingContext2D,
    keypoints: poseDetection.Keypoint[],
    color: string,
    lineWidth: number
  ) => {
    // Create a map of keypoints by name for easier lookup
    const keypointMap = new Map<string, poseDetection.Keypoint>();
    keypoints.forEach((keypoint) => {
      if (keypoint.name) {
        keypointMap.set(keypoint.name, keypoint);
      }
    });

    // Draw the connections
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    POSE_CONNECTIONS.forEach(([startName, endName]) => {
      const startPoint = keypointMap.get(startName);
      const endPoint = keypointMap.get(endName);

      if (
        startPoint && 
        endPoint && 
        startPoint.score && 
        endPoint.score && 
        startPoint.score > 0.3 && 
        endPoint.score > 0.3
      ) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();
      }
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className="pose-canvas"
      width={videoWidth}
      height={videoHeight}
    />
  );
};

export default PoseCanvas;
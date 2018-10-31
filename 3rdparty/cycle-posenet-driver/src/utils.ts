// Canvas related; adapted from
//   https://github.com/tensorflow/tfjs-models/blob/fc0a80d8ddbd2845fca4a61355dc5c54d1b43e0d/posenet/demos/demo_util.js#L17-L73
import * as posenet from '@tensorflow-models/posenet';

const color = 'aqua';
const lineWidth = 2;

function toTuple({y, x}): [any, any] {
  return [y, x];
}

export function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

// Draws a line on a canvas, i.e. a joint
export function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

// Draws a pose skeleton by looking up all adjacent keypoints/joints
export function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
    keypoints, minConfidence);

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(toTuple(keypoints[0].position),
      toTuple(keypoints[1].position), color, scale, ctx);
  });
}

// Draw pose keypoints onto a canvas
export function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const {y, x} = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

//------------------------------------------------------------------------------
// Camera related; adapted from
//   https://github.com/tensorflow/tfjs-models/blob/fc0a80d8ddbd2845fca4a61355dc5c54d1b43e0d/posenet/demos/camera.js#L26-L68

export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
}

export const isiOS = () => {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export const isMobile = () => {
  return isAndroid() || isiOS();
}

export const setupCamera = async (video, videoWidth, videoHeight) => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw 'Browser API navigator.mediaDevices.getUserMedia not available';
  }

  video.width = videoWidth;
  video.height = videoHeight;

  const mobile = isMobile();
  const stream = await navigator.mediaDevices.getUserMedia({
    'audio': false,
    'video': {
      facingMode: 'user',
      width: mobile ? undefined : videoWidth,
      height: mobile ? undefined: videoHeight}
  });
  video.srcObject = stream;

  return new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve(video);
    };
  });
}

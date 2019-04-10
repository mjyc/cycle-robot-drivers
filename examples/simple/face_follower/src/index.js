import xs from 'xstream';
import {runTabletFaceRobotApp} from '@cycle-robot-drivers/run';

const videoWidth = 640;
const videoHeight = 480;

function main(sources) {
  const face$ = sources.PoseDetection.events('poses')
    .filter(poses =>
      poses.length === 1
      && poses[0].keypoints.filter(kpt => kpt.part === 'nose').length === 1
    ).map(poses => {
      const nose = poses[0].keypoints.filter(kpt => kpt.part === 'nose')[0];
      const eyePosition = {
        x: nose.position.x / videoWidth,
        y: nose.position.y / videoHeight,
      };
      return {
        type: 'SET_STATE',
        value: {
          leftEye: eyePosition,
          rightEye: eyePosition,
        }
      };
    });

  return {
    TabletFace: face$,
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2}
    }),
  };
}

runTabletFaceRobotApp(main);

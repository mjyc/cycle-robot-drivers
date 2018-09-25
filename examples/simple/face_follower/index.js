import {runRobotProgram} from '@cycle-robot-drivers/run';
import {makePoseDetectionDriver} from 'cycle-posenet-driver';
import xs from 'xstream';

const videoWidth = 640;
const videoHeight = 480;

function main(sources) {
  const face$ = sources.PoseDetection.poses
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
    }).debug();

    face$.addListener({next: () => {}});
  
  return {
    // TabletFace: xs.periodic(2000).map(() => {
    //   return {
    //     type: 'EXPRESS',
    //     value: 'happy'
    //   };
    // }).debug(),
    TabletFace: face$,
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2}
    }),
  };
}

runRobotProgram(main, {
  PoseDetection: makePoseDetectionDriver({videoWidth, videoHeight}),
});

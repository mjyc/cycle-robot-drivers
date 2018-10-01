import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

function main(sources) {
  const sinks = {
    TabletFace: sources.PoseDetection.poses
      .filter(poses => 
        // must see one person
        poses.length === 1
        // must see the nose
        && poses[0].keypoints.filter(kpt => kpt.part === 'nose').length === 1  
      ).map(poses => {
        const nose = poses[0].keypoints.filter(kpt => kpt.part === 'nose')[0];
        return {
          x: nose.position.x / 640,  // max value of position.x is 640
          y: nose.position.y / 480  // max value of position.y is 480
        };
      }).map(position => ({
        type: 'SET_STATE',
        value: {
          leftEye: position,
          rightEye: position
        }
      }))
  };
  return sinks;
}

runRobotProgram(main);

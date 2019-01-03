import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

document.body.style.backgroundColor = "white";
document.body.style.margin = "0px";

function main(sources) {
  // sources.PoseDetection.poses
  //   .addListener({next: () => {}});  // see outputs on the browser

  return {
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
  }
}

runRobotProgram(main);
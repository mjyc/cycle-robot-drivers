import xs from 'xstream';
import pairwise from 'xstream/extra/pairwise';
import {runRobotProgram} from '@cycle-robot-drivers/run';
import {makePoseDetectionDriver} from 'cycle-posenet-driver';

const videoWidth = 640;
const videoHeight = 480;

function main(sources) {

  const numFaces$ = sources.PoseDetection.poses.map(poses => poses.length);
  const say$ = numFaces$.compose(pairwise).map(([prev, cur]) => {
    if (prev < cur) {  // found a person
      return 'Hello';
    } else if (prev > cur) {  // lost a person
      return 'Goodbye';
    }
  }).filter(str => !!str);
  
  return {
    SpeechSynthesisAction: say$,
  };
}

runRobotProgram(main, {
  PoseDetection: makePoseDetectionDriver({videoWidth, videoHeight}),
});

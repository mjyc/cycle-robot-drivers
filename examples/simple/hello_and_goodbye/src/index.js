import xs from 'xstream';
import pairwise from 'xstream/extra/pairwise';
import {runTabletFaceRobotApp} from '@cycle-robot-drivers/run';

function main(sources) {

  const numFaces$ = sources.PoseDetection.events('poses')
    .map(poses => poses.length);
  const say$ = numFaces$.compose(pairwise).map(([prev, cur]) => {
    if (prev < cur) {  // found a person
      return 'Hello';
    } else if (prev > cur) {  // lost a person
      return 'Goodbye';
    }
  }).filter(str => !!str);

  return {
    SpeechSynthesisAction: {goal: say$},
  };
}

runTabletFaceRobotApp(main);

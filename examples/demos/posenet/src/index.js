import xs from 'xstream';
import {makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';
import {makePoseDetectionDriver} from 'cycle-posenet-driver';


function main(sources) {
  const params$ = xs.of({
    algorithm: 'single-pose',
    singlePoseDetection: {minPoseConfidence: 0.2},
  });
  const vdom$ = sources.PoseDetection.events('dom');

  sources.PoseDetection.events('poses').addListener({
    next: (poses) => {
      if (poses.length === 1) {  // found 1 person
        console.log('poses', poses)
      }
    }
  })

  return {
    DOM: vdom$,
    PoseDetection: params$,
  }
}

run(main, {
  DOM: makeDOMDriver('#app'),
  PoseDetection: makePoseDetectionDriver(),
});

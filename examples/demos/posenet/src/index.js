import xs from 'xstream';
import {makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';
import {makePoseDetectionDriver} from 'cycle-posenet-driver';


function main(sources) { 
  sources.proxies = {  // will be connected to "targets"
    PoseDetection: xs.create(),
  };


  // main logic
  const params$ = xs.of({
    algorithm: 'single-pose',
    singlePoseDetection: {minPoseConfidence: 0.2},
  });
  const vdom$ = sources.PoseDetection.DOM;

  sources.PoseDetection.poses.addListener({
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

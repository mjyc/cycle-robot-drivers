import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {makePoseDetectionDriver} from '@cycle-robot-drivers/vision'


function main(sources) {
  const vdom$ = sources.PoseDetection.DOM.map(poseDetectionOutput => (
    <div>
      {poseDetectionOutput}
    </div>
  ));

  sources.PoseDetection.poses.addListener({
    next: data => console.warn('result', data),
  });

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  PoseDetection: makePoseDetectionDriver(),
});

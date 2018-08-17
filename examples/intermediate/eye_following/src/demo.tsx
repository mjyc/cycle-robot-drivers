import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeFacialExpressionActionDriver,
} from '@cycle-robot-drivers/screen'
import {makePoseDetectionDriver} from '@cycle-robot-drivers/vision'


function main(sources) {
  const styles = {code: {"background-color": "#f6f8fa"}}

  let leftEye = null;
  let rightEye = null;
  fromEvent(window, 'load').addListener({next: d => {
    leftEye = document.querySelector('.left.eye');
    rightEye = document.querySelector('.right.eye');
  }})

  sources.PoseDetection.poses.addListener({next: d => {
    if (d.length === 0) { return; }
    if (d[0].keypoints.filter(k => k.part === 'nose').length === 0) { return; }

    const nose = d[0].keypoints.filter(k => k.part === 'nose')[0];
    console.log(nose.position.x / 640, 'calc(' +  (22.22 * nose.position.y / 480) + 'vh)');
    if (leftEye && rightEye) {
      leftEye.style.left = 'calc(' +  (22.22 * nose.position.x / 640) + 'vh)'
      leftEye.style.bottom = 'calc(' +  (22.22 * (480 - nose.position.y) / 480) + 'vh)'
      rightEye.style.right = 'calc(' +  (22.22 * (640 - nose.position.x) / 640) + 'vh)'
      rightEye.style.bottom = 'calc(' +  (22.22 * (480 - nose.position.y) / 480) + 'vh)'
    }
  }});

  const goal$ = xs.merge(
    sources.DOM.select('#start').events('click')
      .mapTo({type: 'happy'}),
  );

  const vdom$ = xs.combine(
    sources.PoseDetection.poses.startWith([]),
    sources.FacialExpressionAction.DOM,
    sources.PoseDetection.DOM,
  ).map(([p, f, d]) => (
    <div>
      <h1>PoseDetection component demo</h1>

      <div>
        <button id="start">Start</button>
      </div>

      <div>
        {f}
      </div>

      <div>
        {d}
      </div>

      <div>
        <h3>Driver outputs</h3>
        <div>
          <pre style={styles.code}>"poses": {JSON.stringify(p, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  ));

  return {
    DOM: vdom$,
    FacialExpressionAction: goal$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  FacialExpressionAction: makeFacialExpressionActionDriver(),
  PoseDetection: makePoseDetectionDriver(),
});

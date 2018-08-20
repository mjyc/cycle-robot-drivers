import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeTabletFaceDriver,
} from '@cycle-robot-drivers/screen'
import {makePoseDetectionDriver} from 'cycle-posenet-drivers'

const videoWidth = 640;
const videoHeight = 480;

function main(sources) {
  const action$ = sources.PoseDetection.poses
    .filter(poses => poses.length > 0)
    .filter(poses =>
      poses[0].keypoints.filter(kpt => kpt.part === 'nose').length === 1)
    .map(poses => {
      const nose = poses[0].keypoints.filter(kpt => kpt.part === 'nose')[0];
      const normalizedPos = {
        x: nose.position.x / videoWidth,
        y: nose.position.y / videoHeight,
      };
      return {
        type: 'SET_STATE',
        value: {
          leftEye: normalizedPos,
          rightEye: normalizedPos,
        }
      }
    });

  const click$ = sources.DOM.select('#start').events('click')
    .map(event => (event.target as HTMLButtonElement).textContent)
    .debug(c => console.error(c));

  const stopped$ = click$.fold((acc, x) => {
    return !acc;
  }, true).remember();

  const face$ = stopped$.map(s => s ? action$ : xs.of({
    type: 'SET_STATE',
    value: {
      leftEye: {x: 0.5, y: 0.5},
      rightEye: {x: 0.5, y: 0.5},
    }
  })).flatten();

  const styles = {code: {"background-color": "#f6f8fa"}};
  const vdom$ = xs.combine(
    sources.PoseDetection.poses.startWith([]),
    sources.TabletFace.DOM,
    sources.PoseDetection.DOM,
    stopped$,
  ).map(([p, f, d, st]) => (
    <div>
      <div>
        <button id="start">{
          st
          ? "Start following face"
          : "Stop following face"
        }</button>
      </div>

      <div>
        {f}
      </div>

      <div>
        {d}
      </div>

      <div>
        <h3>Pose detector outputs</h3>
        <div>
          <pre style={styles.code}>"poses": {JSON.stringify(p, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  ));

  return {
    DOM: vdom$,
    TabletFace: face$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver(),
  PoseDetection: makePoseDetectionDriver({videoWidth, videoHeight}),
});

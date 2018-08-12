import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {makePoseDetectionDriver} from '@cycle-robot-drivers/vision'


function main(sources) {
  const styles = {code: {"background-color": "#f6f8fa"}}
  const vdom$ = xs.combine(
    sources.PoseDetection.poses.startWith([]),
    sources.PoseDetection.DOM,
  ).map(([p, d]) => (
    <div>
      <h1>PoseDetection component demo</h1>

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
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  PoseDetection: makePoseDetectionDriver(),
});

import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeFaceControllerDriver,
} from '@cycle-robot-drivers/screen'

const types = ['happy', 'sad', 'angry', 'focused', 'confused'];


function main(sources) {

  const styles = {code: {"background-color": "#f6f8fa"}};
  const vdom$ = sources.FaceController.DOM.map(f => (
    <div>
      <h1>FacalExpressionAction driver demo</h1>

      <div>
        {f}
      </div>

      <div>
        <h3>Action inputs</h3>
        <div>
          <div>
            <select id="type">{[].map(type => (type === false ? (
              <option selected value={type}>{type}</option>
            ) : (
              <option value={type}>{type}</option>
            )))}</select>
          </div>
          <span className="label">Duration</span>
          <input id="duration"
            type="range" min="100" max="10000" value="1" step="1">
          </input><span> 1ms</span>
        </div>
      </div>

      <div>
        <h3>Controls</h3>
        <div>
          <button id="start">Start</button>
          <button id="cancel">Cancel</button>
        </div>
      </div>

      <div>
        <h3>Action outputs</h3>
        <div>
          <pre style={styles.code}>"status": {JSON.stringify({}, null, 2)}
          </pre>
          <pre style={styles.code}>"result": {JSON.stringify({}, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  ));

  return {
    FaceController: xs.of(null),
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  FaceController: makeFaceControllerDriver(),
});

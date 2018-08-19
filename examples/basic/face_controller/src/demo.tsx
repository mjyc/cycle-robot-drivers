import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeFaceControllerDriver,
} from '@cycle-robot-drivers/screen'

const types = ['happy', 'sad', 'angry', 'focused', 'confused'];


function main(sources) {

  // const action$ = xs.create();
  // window.onload = () => {
  //   setTimeout(() => action$.shamefullySendNext({type: 'START_BLINKING', value: {type: 'happy'}}), 100);
  // };

  const action$ = xs.merge(
    sources.DOM.select('#happy').events('click').mapTo({type: 'EXPRESS', value: {type: 'happy'}}),
    sources.DOM.select('#sad').events('click').mapTo({type: 'EXPRESS', value: {type: 'sad'}}),
    sources.DOM.select('#angry').events('click').mapTo({type: 'EXPRESS', value: {type: 'angry'}}),
    sources.DOM.select('#focused').events('click').mapTo({type: 'EXPRESS', value: {type: 'focused'}}),
    sources.DOM.select('#confused').events('click').mapTo({type: 'EXPRESS', value: {type: 'confused'}}),

    sources.DOM.select('#start_blinking').events('click').mapTo({type: 'START_BLINKING'}),
    sources.DOM.select('#stop_blinking').events('click').mapTo({type: 'STOP_BLINKING'}),
  );

  const styles = {code: {"background-color": "#f6f8fa"}};
  const vdom$ = sources.FaceController.DOM.map(f => (
    <div>
      <h1>FaceController driver demo</h1>

      <div>
        <div>
          <button id="happy">Happy</button>
          <button id="sad">Sad</button>
          <button id="angry">Angry</button>
          <button id="focused">Focused</button>
          <button id="confused">Confused</button>
          <button id="start_blinking">Start blinking</button>
          <button id="stop_blinking">Stop blinking</button>
        </div>
      </div>

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
    FaceController: action$.debug(d => console.error('action', d)),
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  FaceController: makeFaceControllerDriver(),
});

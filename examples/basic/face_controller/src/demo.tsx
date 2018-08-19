import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeFaceControllerDriver,
} from '@cycle-robot-drivers/screen'

const types = ['happy', 'sad', 'angry', 'focused', 'confused'];


function main(sources) {
  // TODO: remove this
  sources.FaceController.allFinish.addListener({next: d => console.error(d)});

  const x$ = sources.DOM.select('#x').events('input')
    .map(ev => parseFloat((ev.target as HTMLInputElement).value))
    .startWith(0.0);
  const y$ = sources.DOM.select('#y').events('input')
    .map(ev => parseFloat((ev.target as HTMLInputElement).value))
    .startWith(0.0);
  const params$ = xs.combine(x$, y$)
    .map(([x, y]) => ({x, y}))
    .remember();

  const action$ = xs.merge(
    sources.DOM.select('#happy').events('click')
      .mapTo({type: 'EXPRESS', value: {type: 'happy'}}),
    sources.DOM.select('#sad').events('click')
      .mapTo({type: 'EXPRESS', value: {type: 'sad'}}),
    sources.DOM.select('#angry').events('click')
      .mapTo({type: 'EXPRESS', value: {type: 'angry'}}),
    sources.DOM.select('#focused').events('click')
      .mapTo({type: 'EXPRESS', value: {type: 'focused'}}),
    sources.DOM.select('#confused').events('click')
      .mapTo({type: 'EXPRESS', value: {type: 'confused'}}),

    sources.DOM.select('#start_blinking').events('click')
      .mapTo({type: 'START_BLINKING'}),
    sources.DOM.select('#stop_blinking').events('click')
      .mapTo({type: 'STOP_BLINKING'}),

    x$.map(x => ({
      type: 'SET_STATE',
      value: {
        left: {x},
        right: {x},
      },
    })),
    y$.map(y => ({
      type: 'SET_STATE',
      value: {
        left: {y},
        right: {y},
      },
    })),
  );

  const styles = {code: {"background-color": "#f6f8fa"}};
  const vdom$ = xs.combine(
    sources.FaceController.DOM,
    params$,
  ).map(([f, p]) => (
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
          <div>
            <span className="label">Eye x-position</span>
            <input id="x"
              type="range" min="0.0" max="1.0" value={p.x} step="0.1">
            </input>
            <span>{p.x}</span>
          </div>
          <div>
            <span className="label">Eye y-position</span>
            <input id="y"
              type="range" min="0.0" max="1.0" value={p.y} step="0.1">
            </input>
            <span>{p.y}</span>
          </div>
        </div>
      </div>

      <div>
        {f}
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
    DOM: vdom$,
    FaceController: action$.debug(d => console.error('action', d)),
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  FaceController: makeFaceControllerDriver(),
});

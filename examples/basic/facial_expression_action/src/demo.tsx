import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeTabletFaceDriver,
  IsolatedFacialExpressionAction as FacialExpressionAction,
} from '@cycle-robot-drivers/screen'

const types = ['happy', 'sad', 'angry', 'focused', 'confused'];


function main(sources) {
  const goalProxy$ = xs.create();
  const facialExpressionAction = FacialExpressionAction({
    goal: goalProxy$,
    TabletFace: sources.TabletFace,
  });

  const params$ = xs.combine(
    sources.DOM.select('#type').events('change')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(types[0]),
    sources.DOM.select('#duration').events('input')
      .map(ev => {
        const value = (ev.target as HTMLInputElement).value;
        try { return JSON.parse(value); } catch { return value; }
      })
      .startWith(1000),
  ).map(([type, duration]) => ({type, duration})).remember();

  // send goals to the action
  goalProxy$.imitate(
    xs.merge(
      sources.DOM.select('#start').events('click')
        .mapTo(params$.take(1)).flatten(),
      sources.DOM.select('#cancel').events('click').mapTo(null),
    )
  );

  // update the state
  const state$ = xs.combine(
    params$,
    facialExpressionAction.status.startWith(null),
    facialExpressionAction.result.startWith(null),
  ).map(([params, status, result]) => {
    return {
      ...params,
      status,
      result,
    }
  });

  const styles = {code: {"background-color": "#f6f8fa"}};
  const vdom$ = xs.combine(state$, sources.TabletFace.DOM).map(([s, f]) => (
    <div>
      <h1>FacalExpressionAction driver demo</h1>

      <div>
        {f}
      </div>

      <div>
        <h3>Action inputs</h3>
        <div>
          <div>
            <select id="type">{types.map(type => (type === s.type ? (
              <option selected value={type}>{type}</option>
            ) : (
              <option value={type}>{type}</option>
            )))}</select>
          </div>
          <span className="label">Duration</span>
          <input id="duration"
            type="range" min="100" max="10000" value={s.duration} step="1">
          </input><span> {s.duration}ms</span>
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
          <pre style={styles.code}>"status": {JSON.stringify(s.status, null, 2)}
          </pre>
          <pre style={styles.code}>"result": {JSON.stringify(s.result, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  ));

  return {
    DOM: vdom$,
    TabletFace: facialExpressionAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver({faceHeight: '600px'}),
});

import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/face'

const types = ['SET_MESSAGE', 'ASK_QUESTION'];


function main(sources) {
  const goalProxy$ = xs.create();
  const speechbubbleAction = TwoSpeechbubblesAction({
    goal: goalProxy$,
    DOM: sources.DOM,
  });

  const params$ = xs.combine(
    sources.DOM.select('#type').events('change')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(types[0]),
    sources.DOM.select('#value').events('focusout')
      .map(ev => {
        const value = (ev.target as HTMLInputElement).value;
        try { return JSON.parse(value); } catch { return value; }
      })
      .startWith(''),
  ).map(([type, value]) => ({type, value})).remember();

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
    speechbubbleAction.status.startWith(null),
    speechbubbleAction.result.startWith(null),
  ).map(([params, status, result]) => {
    return {
      ...params,
      status,
      result,
    }
  });

  const styles = {code: {"background-color": "#f6f8fa"}}
  const vdom$ = xs.combine(state$, speechbubbleAction.DOM).map(([s, b]) => (
    <div>
      <h1>TwoSpeechbubblesAction component demo</h1>

      <div>
        {b}
      </div>

      <div>
        <h3>Action inputs</h3>
        <div>
          <select id="type">{types.map(type => (type === s.type ? (
            <option selected value={type}>{type}</option>
          ) : (
            <option value={type}>{type}</option>
          )))}</select>
          <input id="value"></input>
          <div><small>Try <code style={styles.code}>
          ["Do you want cookie or ice cream?", ["Cookie", "Ice cream", "Both"]]
          </code> for ASK_CHOICE</small></div>
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
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
});

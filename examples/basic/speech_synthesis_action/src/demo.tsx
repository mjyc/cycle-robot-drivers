import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent'
import delay from 'xstream/extra/delay'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const goalProxy$ = xs.create();
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: goalProxy$,
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  const params$ = xs.combine(
    sources.DOM.select('#text').events('focusout')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(''),
    sources.DOM.select('#rate').events('input')
      .map(ev => parseFloat((ev.target as HTMLInputElement).value))
      .startWith(1),
    sources.DOM.select('#pitch').events('input')
      .map(ev => parseFloat((ev.target as HTMLInputElement).value))
      .startWith(1),
  ).map(([text, rate, pitch]) => ({text, rate, pitch})).remember();

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
    speechSynthesisAction.status.startWith(null),
    speechSynthesisAction.result.startWith(null),
  ).map(([params, status, result]) => {
    return {
      ...params,
      status,
      result,
    }
  });

  const styles = {code: {"background-color": "#f6f8fa"}};
  const vdom$ = state$.map(s => (
    <div>
      <h1>SpeechSynthesisAction component demo</h1>

      <div>
        <h3>Action inputs</h3>
        <div>
          <div>
            <span className="label">Text</span>
            <input id="text" type="text"></input>
          </div>
          <div>
            <span className="label">Rate</span>
            <input id="rate"
              type="range" min="0.5" max="2" value={s.rate} step="0.1"></input>
            <span>{s.rate}</span>
          </div>
          <div>
            <span className="label">Pitch</span>
            <input id="pitch"
              type="range" min="0" max="2" value={s.pitch} step="0.1"></input>
            <span>{s.pitch}</span>
          </div>
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
    SpeechSynthesis: speechSynthesisAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
});

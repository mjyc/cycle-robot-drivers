import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent'
import delay from 'xstream/extra/delay'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechRecognitionDriver,
  IsolatedSpeechRecognitionAction as SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const goal$ = sources.DOM.select('#start').events('click').mapTo({})
  const speechRecognitionAction = SpeechRecognitionAction({
    goal: goal$,
    SpeechRecognition: sources.SpeechRecognition,
  });

  const state$ = xs.combine(
    speechRecognitionAction.status.startWith(null),
    speechRecognitionAction.result.startWith(null),
  ).map(([status, result]) => {
    return {
      status,
      result,
    }
  });

  const styles = {code: {"background-color": "#f6f8fa"}}
  const vdom$ = state$.map(s => (
    <div>
      <h1>SpeechRecognitionAction component demo</h1>

      <div>
        <h3>Controls</h3>
        <div>
          <button id="start">Start</button>
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
    SpeechRecognition: speechRecognitionAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

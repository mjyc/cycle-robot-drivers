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
  const goal$ = sources.DOM.select('#listen').events('click').mapTo({})
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

  const vdom$ = state$.map(s => (
    <div>
      <h1>Cycle.js SpeechRecognitionAction component demo</h1>

      <div>
        <button id="listen">Listen</button>
      </div>

      <div>
        <div>
          <pre>"status": {JSON.stringify(s.status, null, 2)}</pre>
          <pre>"result": {JSON.stringify(s.result, null, 2)}</pre>
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

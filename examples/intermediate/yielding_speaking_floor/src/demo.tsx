import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent'
import delay from 'xstream/extra/delay'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisDriver,
  makeSpeechRecognitionDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
  IsolatedSpeechRecognitionAction as SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: xs.of({text: 'say something say something say something say something say something say something', rate: 0.5}),
    SpeechSynthesis: sources.SpeechSynthesis,
  });
  const goal$ = xs.merge(
    sources.DOM.select('#say').events('click').mapTo({}),
    sources.DOM.select('#cancel').events('click').mapTo(null),
  );
  const speechRecognitionAction = SpeechRecognitionAction({
    goal: goal$,  // xs.of({}),
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
          <button id="say">Say something</button>
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
    // SpeechSynthesis: speechSynthesisAction.value,
    SpeechRecognition: speechRecognitionAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

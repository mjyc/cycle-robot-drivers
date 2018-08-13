import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import delay from 'xstream/extra/delay'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisDriver,
  makeSpeechRecognitionDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
  IsolatedSpeechRecognitionAction as SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech'

const sentences = [
  "Did you know Steve Jobs said Stay Hungry. Stay Foolish?",
  "Did you know Pablo Picasso said Good Artists Copy, Great Artists Steal?",
  "Did you know Paul Graham said Argue with idiots, and you become an idiot?",
  "Did you know Oscar Wilde said Be yourself; everyone else is already taken?",
  "Did you know Leonardo Da Vinci said Simplicity is the ultimate sophistication?"
];


function main(sources) {
  const goals$ = xs.merge(
    xs.of({text: sentences[Math.floor(Math.random()*5)], rate: 0.75}),
    sources.SpeechRecognition.events('soundstart').debug(data => console.log('soundstart', data)).mapTo(null),
    sources.SpeechRecognition.events('speechstart').debug(data => console.log('speechstart', data)).mapTo(null),
  );

  const speechSynthesisAction = SpeechSynthesisAction({
    goal: goals$,
    SpeechSynthesis: sources.SpeechSynthesis,
  });
  const goal$ = xs.merge(
    sources.DOM.select('#say').events('click').mapTo({}),
    sources.DOM.select('#cancel').events('click').mapTo(null),
  );
  const speechRecognitionAction = SpeechRecognitionAction({
    goal: xs.of({}).compose(delay(500)),
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
    SpeechSynthesis: speechSynthesisAction.value,
    SpeechRecognition: speechRecognitionAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

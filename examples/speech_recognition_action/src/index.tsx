import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechRecognitionDriver,
  IsolatedSpeechRecognitionAction as SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const vdom$ = xs.of((<div>Cycle.js SpeechRecognitionAction component demo</div>));
  const recog$ = xs.create();
  setTimeout(() => {recog$.shamefullySendNext({});}, 1000);

  const speechRecognitionAction = SpeechRecognitionAction({
    goal: recog$,
    SpeechRecognition: sources.SpeechRecognition,
  });

  speechRecognitionAction.result.addListener({
    next: data => console.warn('result', data),
  });
  speechRecognitionAction.status.addListener({
    next: data => console.warn('status', data),
  });
  speechRecognitionAction.value.addListener({
    next: data => console.warn('value', data),
  });

  return {
    DOM: vdom$,
    SpeechRecognition: speechRecognitionAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

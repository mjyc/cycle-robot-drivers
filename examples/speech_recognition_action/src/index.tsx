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
  setTimeout(() => recog$.shamefullySendNext({}), 1);
  // test overwriting the current goal
  setTimeout(() => recog$.shamefullySendNext({}), 100);
  // test canceling an active goal
  setTimeout(() => recog$.shamefullySendNext(null), 500);
  // test calling cancel on done; cancel must do nothing
  setTimeout(() => recog$.shamefullySendNext({}), 1000);
  // you must say something here
  setTimeout(() => recog$.shamefullySendNext(null), 7000);

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

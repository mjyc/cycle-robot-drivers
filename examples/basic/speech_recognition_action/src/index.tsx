import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechRecognitionDriver,
  IsolatedSpeechRecognitionAction as SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const vdom$ = xs.of((<p>SpeechRecognitionAction component test</p>));
  const recog$ = xs.create();
  setTimeout(() => recog$.shamefullySendNext({}), 1);
  // test overwriting the current goal
  setTimeout(() => recog$.shamefullySendNext({}), 500);
  // test canceling an active goal
  setTimeout(() => recog$.shamefullySendNext(null), 1000);
  // test calling cancel on done; cancel must do nothing
  setTimeout(() => recog$.shamefullySendNext({}), 2000);
  // you must say something here
  setTimeout(() => recog$.shamefullySendNext(null), 7000);

  const speechRecognitionAction = SpeechRecognitionAction({
    goal: recog$,
    SpeechRecognition: sources.SpeechRecognition,
  });

  speechRecognitionAction.output.addListener({
    next: data => console.warn('output', data),
  });
  speechRecognitionAction.result.addListener({
    next: data => console.warn('result', data),
  });

  return {
    DOM: vdom$,
    SpeechRecognition: speechRecognitionAction.output,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

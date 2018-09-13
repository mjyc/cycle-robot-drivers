import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisActionDriver,
  makeSpeechRecognitionActionDriver,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const vdom$ = xs.of((<p>SpeechSynthesisAction component test</p>));
  const goal$ = xs.create();
  setTimeout(() => goal$.shamefullySendNext({text: 'Hello'}), 1);
  // test overwriting the current goal
  setTimeout(() => goal$.shamefullySendNext({text: 'World'}), 200);
  // test canceling an active goal
  setTimeout(() => goal$.shamefullySendNext(null), 500);
  setTimeout(() => goal$.shamefullySendNext({text: 'Jello'}), 1500);
  // test calling cancel on done; cancel must do nothing
  setTimeout(() => goal$.shamefullySendNext(null), 2500);

  sources.SpeechSynthesisAction.output.addListener({
    next: data => console.warn('output', data),
  });
  sources.SpeechSynthesisAction.result.addListener({
    next: data => console.warn('result', data),
  });

  return {
    DOM: vdom$,
    SpeechSynthesisAction: goal$,
    SpeechRecognitionAction: xs.of({}),
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesisAction: makeSpeechSynthesisActionDriver(),
  SpeechRecognitionAction: makeSpeechRecognitionActionDriver(),
});

import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const vdom$ = xs.of((<div>Cycle.js SpeechSynthesisAction component demo</div>));
  const synth$ = xs.create();
  setTimeout(() => synth$.shamefullySendNext({text: 'Hello'}), 1);
  // test overwriting the current goal
  setTimeout(() => synth$.shamefullySendNext({text: 'World'}), 200);
  // test canceling an active goal
  setTimeout(() => synth$.shamefullySendNext(null), 500);
  setTimeout(() => synth$.shamefullySendNext({text: 'Jello'}), 1500);
  // test calling cancel on done; cancel must do nothing
  setTimeout(() => synth$.shamefullySendNext(null), 2500);

  const speechSynthesisAction = SpeechSynthesisAction({
    goal: synth$,
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  speechSynthesisAction.value.addListener({
    next: data => console.warn('value', data),
  });
  speechSynthesisAction.status.addListener({
    next: data => console.warn('status', data),
  });
  speechSynthesisAction.result.addListener({
    next: data => console.warn('result', data),
  });

  return {
    DOM: vdom$,
    SpeechSynthesis: speechSynthesisAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
});

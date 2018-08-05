import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import delay from 'xstream/extra/delay'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';

import {makeSpeechSynthesisDriver} from './speech_synthesis'
import SpeechSynthesisAction from './SpeechSynthesisAction'

function main(sources) {
  const vdom$ = xs.of((<div>Hello world!</div>));
  const synth$ = xs.create();
  setTimeout(() => {synth$.shamefullySendNext({text: 'Hello'});}, 1);
  setTimeout(() => {synth$.shamefullySendNext({text: 'World'});}, 200);
  setTimeout(() => {synth$.shamefullySendNext(null);}, 1000);
  setTimeout(() => {synth$.shamefullySendNext({text: 'Jello'});}, 1500);
  setTimeout(() => {synth$.shamefullySendNext(null);}, 2500);

  const speechSynthesis = SpeechSynthesisAction({
    goal: synth$,
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  speechSynthesis.result.addListener({
    next: data => console.warn('result', data),
  });
  speechSynthesis.status.addListener({
    next: data => console.warn('status', data),
  });
  speechSynthesis.value.addListener({
    next: data => console.warn('value', data),
  });

  return {
    DOM: vdom$,
    SpeechSynthesis: speechSynthesis.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
});

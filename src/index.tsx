import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import delay from 'xstream/extra/delay'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';

import {makeSpeechSynthesisDriver} from './speech_synthesis'

function main(sources) {
  const vdom$ = xs.of((<div>Hello world!</div>));
  const synth$ = xs.create();
  setTimeout(() => {synth$.shamefullySendNext(new SpeechSynthesisUtterance('Hello world'))}, 1);
  setTimeout(() => {synth$.shamefullySendNext(null)}, 501);
  setTimeout(() => {synth$.shamefullySendNext(new SpeechSynthesisUtterance('Jello world'))}, 1001);

  sources.SpeechSynthesis.events('start').addListener({
    next: data => console.log('start', data),
  });
  sources.SpeechSynthesis.events('end').addListener({
    next: data => console.log('end', data),
  });
  sources.SpeechSynthesis.events('error').addListener({
    next: data => console.log('error', data),
  });

  return {
    DOM: vdom$,
    SpeechSynthesis: synth$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
});

import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent'
import delay from 'xstream/extra/delay'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';

import {makeSpeechSynthesisDriver} from './speech_synthesis'

function main(sources) {

  const vdom$ = xs.of((<div>Hello world!</div>));

  // Approach 1
  sources.SpeechSynthesis.addListener({
    next: utterance => {
      const start$ = fromEvent(utterance, 'start');
      start$.addListener({next: start => console.log('start', start)});
      const error$ = fromEvent(utterance, 'error');
      error$.addListener({next: error => console.log('error', error)});
      const end$ = fromEvent(utterance, 'end');
      end$.addListener({next: end => console.log('end', end)});
    }
  });

  // Approach 2: does not work
  const speechSynthesisEvent$ = xs.merge(
    sources.SpeechSynthesis.map(utterance => {
      return fromEvent(utterance, 'end');
    }).flatten(),
    sources.SpeechSynthesis.map(utterance => {
      return fromEvent(utterance, 'error');
    }).flatten(),
    sources.SpeechSynthesis.map(utterance => {
      return fromEvent(utterance, 'start');
    }).flatten(),
  );

  speechSynthesisEvent$.addListener({
    next: event => console.warn('event', event)  // use "warn" to highlight differences
  });

  const synth$ = xs.create();
  setTimeout(() => {synth$.shamefullySendNext(new SpeechSynthesisUtterance('Hello world'))}, 1);
  setTimeout(() => {synth$.shamefullySendNext(new SpeechSynthesisUtterance('Jello world'))}, 1001);
  return {
    DOM: vdom$,
    SpeechSynthesis: synth$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
});

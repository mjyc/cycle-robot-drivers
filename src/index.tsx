import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';

import {makeSpeechSynthesisDriver} from './speech_synthesis'

function main(sources) {

  const vdom$ = xs.of((<div>Hello world!</div>));

  sources.SpeechSynthesis.addListener({
    next: utterance => {
      console.log(utterance);
      const startStream$ = fromEvent(utterance, 'start');
      console.log(startStream$);
      startStream$.addListener({next: start => console.log('start', start)});
    }
  });

  sources.SpeechSynthesis.map()

  return {
    DOM: vdom$,
    SpeechSynthesis: xs.of(new SpeechSynthesisUtterance('Hello world')),
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
});

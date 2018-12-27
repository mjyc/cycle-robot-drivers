// TODO: move to examples/demos/meyda?

import xs from 'xstream';
import {div, makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';
import {makeGyronormDriver} from 'cycle-gyronorm-driver';

function main(sources) {
  sources.Meyda.addListener({next: f => console.log(f)});
  return {
    DOM: xs.of(div('Hello world!')),
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  Meyda: makeGyronormDriver(),
});

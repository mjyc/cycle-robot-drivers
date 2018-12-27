import xs from 'xstream';
import {div, makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';
import {makeMeydaDriver} from 'cycle-meyda-driver';

function main(sources) {
  sources.Meyda.addListener({next: f => console.log(f)});
  return {
    DOM: xs.of(div('Hello world!')),
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  Meyda: makeMeydaDriver(),
});

import xs from 'xstream';
import {div, makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';
import {makeGyronormDriver} from 'cycle-gyronorm-driver';

function main(sources) {
  sources.Meyda.addListener({next: f => console.log(f)});
  const vdom$ = sources.Meyda
    .replaceError((err) => xs.of(false))
    .map(data => !data
      ? div('To view this demo, try browsing to "https://stackblitz.com/edit/cycle-robot-drivers-demos-gyronorm" on your mobile device')
      : div(JSON.stringify(data))
    );
  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  Meyda: makeGyronormDriver(),
});

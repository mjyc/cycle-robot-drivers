import xs from 'xstream';
import {div, makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';
import {makeGyronormDriver} from 'cycle-gyronorm-driver';

function main(sources) {
  sources.GyroNorm.addListener({next: f => console.log(f)});
  const vdom$ = sources.GyroNorm
    .replaceError((err) => xs.of(false))
    .map(data => !data
      ? div('To view this demo, try browsing to "https://stackblitz.com/edit/cycle-robot-drivers-demos-gyronorm" on your mobile device')
      : div({}, [
        div(`DeviceOrientation: ${JSON.stringify(data.do)}`),
        div(`DeviceMotion: ${JSON.stringify(data.dm)}`),
      ])
    );
  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  GyroNorm: makeGyronormDriver(),
});

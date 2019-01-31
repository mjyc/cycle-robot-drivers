import {run} from '@cycle/run';
import {div, label, input, hr, h1, makeDOMDriver} from '@cycle/dom';
import {makeMeydaDriver} from 'cycle-meyda-driver';

function makeVibrationDriver() {
  const vibrationDriver = (sink$) => {
    sink$.addListener({
      next: (pattern) => {
        window.navigator.vibrate(pattern);
      }
    });
  };

  return vibrationDriver;
}

function main(sources) {
  const vdom$ = sources.Meyda
    .map(v => div(`loudness: ${v.loudness.total}`));

  const vibration$ = sources.Meyda.filter(v => v.loudness.total > 50)
    .mapTo(500);

  return {
    DOM: vdom$,
    Vibration: vibration$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  Meyda: makeMeydaDriver({
    featureExtractors: ['loudness']
  }),
  Vibration: makeVibrationDriver(),
});

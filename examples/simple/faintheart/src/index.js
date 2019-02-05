import xs from 'xstream';
import {run} from '@cycle/run';
import {div, h1, h2, makeDOMDriver} from '@cycle/dom';
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

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function main(sources) {
  const vdom$ = !isAndroid()
    ? xs.of(div([
      h1("This app only works on Android devices"),
      h2("Please try it on an an Android device")
    ])) : sources.Meyda.map(v => div(`loudness: ${v.loudness.total}`));

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

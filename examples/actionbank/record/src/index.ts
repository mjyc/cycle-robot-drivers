import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {div, a} from '@cycle/dom';

import {withState} from '@cycle/state';
import {timeDriver} from '@cycle/time';
import {run} from '@cycle/run';
import {withRobotActions, initializeDrivers} from '@cycle-robot-drivers/run';
import Robot from './Robot';
import Bagger from './Bagger';

// import 'semantic-ui-css/semantic.min.css';

// document.body.style.backgroundColor = "white";
// document.body.style.margin = "0px";

function main(sources) {

  let data = null;
  let data2 = null;
  xs.fromPromise(fetch('/f0577c65-425f-4331-8ff1-5c0ac05c1574.json', {
    headers: {
      "content-type": "application/json"
    }
  })).map(v => xs.fromPromise(v.json())).flatten().addListener({next: v => {
    data = v.DOM; data2 = v.SpeechSynthesis; console.log(v);}});

  // const time$ = sources.Time.animationFrames().map(frame => frame.time);
  // time$
  //   .addListener({
  //     next: (time) => {
  //       if (!!data) {
  //         console.log(
  //           data.slice(0).reverse()
  //             .find(val => val[1] <= time)
  //         );
  //       }
  //     }
  //   });

  const time$ = sources.Time.animationFrames();
  const vdomExp$ = time$.map(frame => frame.time)
    .map(time => {
      if (!!data) {
        // console.log(
        const found = data.slice(0).reverse()
            .find(val => val[1] <= time)
        // );
        if (!!found) return found[0]
      }
    }).filter(x => !!x).compose(dropRepeats()).startWith(div('hello'));
  const speech$ = time$.map(frame => frame.time)
    .map(time => {
      if (!!data2) {
        // console.log(
        const found = data2.slice(0).reverse()
            .find(val => val[1] <= time)
        // );
        if (!!found) return found[0]
      }
    }).filter(x => !!x).compose(dropRepeats());


  const sinks: any = withRobotActions(Robot)(sources);

  const dataUrl$ = Bagger({
    DOM: sinks.DOM,
    SpeechSynthesis: sinks.SpeechSynthesis,
  }, sources.Time)
    .map(data => {
      const blob = new Blob([JSON.stringify(data, null, 2)], {type : 'application/json'});
      const url = window.URL.createObjectURL(blob);
      return url;
    });

  const vdom$ = xs.combine(sinks.DOM, dataUrl$)
    .map(([face, dataUrl]) =>
      div([
        face,
        div([
          a({props: {href: dataUrl, download: ''}}, 'Download'),
        ]),
      ])
    );

  return {
    ...sinks,
    // DOM: vdom$,
    DOM: vdomExp$,
    SpeechSynthesis: speech$,
  };
}

run(
  // withState(withRobotActions(Robot) as any),
  withState(main),
  {
    ...initializeDrivers(),
    Time: timeDriver,
  },
);
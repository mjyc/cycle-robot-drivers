import xs from 'xstream';
import {div, a} from '@cycle/dom';

import {withState} from '@cycle/state';
import {timeDriver} from '@cycle/time';
import {run} from '@cycle/run';
import {withRobotActions, initializeDrivers} from '@cycle-robot-drivers/run';
import Robot from './Robot';
import Bagger from './Bagger';

import 'semantic-ui-css/semantic.min.css';

// document.body.style.backgroundColor = "white";
// document.body.style.margin = "0px";

function main(sources) {
  const sinks: any = withRobotActions(Robot)(sources);

  const dataUrl$ = Bagger({DOM: sinks.DOM}, sources.Time)
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
    DOM: vdom$,
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
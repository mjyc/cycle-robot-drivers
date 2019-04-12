import xs from 'xstream';
import delay from 'xstream/extra/delay';
import isolate from '@cycle/isolate';
import {runTabletRobotFaceApp} from '@cycle-robot-drivers/run';
import {RobotApp} from './RobotApp';
import {transition} from './transition.js';


function main(sources) {
  // sources.state.stream.addListener({next: s => console.debug('reducer state', s)});

  const S0 = 'S0';
  const T = (s, input) => transition(s, input).state;
  const G = (state, input) => transition(state, input).outputs;
  const command$ = xs.merge(
    sources.TabletFace.events('load').mapTo({
      type: 'LOAD_FSM',
      value: {S0, T, G},
    }),
    sources.TabletFace.events('load').compose(delay(0)).mapTo({
      type: 'START_FSM',
    }),
  );

  const robotSinks = isolate(RobotApp, 'RobotApp')({
    command: command$,
    ...sources,
  });
  return robotSinks;
}

runTabletRobotFaceApp(main);

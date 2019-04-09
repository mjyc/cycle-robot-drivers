import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {runTabletFaceRobotApp} from '@cycle-robot-drivers/run';
import {RobotApp} from './RobotApp';
import {transition} from './transition.js';
console.log(transition);


function main(sources) {
  const S0 = 'S0';
  const T = (s, input) => transition(s, input).state;
  const G = (state, input) => transition(state, input).outputs;
  const command$ = xs.merge(
    xs.of({
      type: 'LOAD_FSM',
      value: {S0, T, G},
    }),
    xs.of({
      type: 'START_FSM',
    }).compose(delay(0)),  // send this data after the above
  ).compose(delay(1500));

  return RobotApp({
    command: command$,
    ...sources,
  });
}

runTabletFaceRobotApp(main);

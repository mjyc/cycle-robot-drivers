import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {runTabletFaceRobotApp} from '@cycle-robot-drivers/run';
import {RobotApp} from './RobotApp';


function main(sources) {
  const S0 = 'S0';
  const T = (state, input) => transition(state, input).state;
  const G = (state, input) => transition(state, input).outputs;
  const command$ = xs.merge(
    xs.of({
      type: 'LOAD_FSM',
      value: {S0, T, G},
    }),
    xs.of({
      type: 'START_FSM',
    }).compose(delay(0)),  // send this data after the above
  ).compose(delay(1000));

  return RobotApp({
    command: command$,
    ...sources,
  });
}

runTabletFaceRobotApp(main);

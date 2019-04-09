import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {runTabletFaceRobotApp} from '@cycle-robot-drivers/run';
import {RobotApp} from './RobotApp';


function main(sources) {
  // const FSM = xs.of({
  //   S0: `S0`,
  //   T: transition,
  // });

  const command$ = xs.merge(
    xs.of({
      type: 'LOAD_FSM',
    }).compose(delay(0)),
    xs.of({
      type: 'START_FSM',
    }).compose(delay(0)),
  );

  command$.addListener({next: v => console.log(v)});

  return RobotApp({
    // srsm: srsm$,
    command: command$,
    ...sources,
  });
}

runTabletFaceRobotApp(main);

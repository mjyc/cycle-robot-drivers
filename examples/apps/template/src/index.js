import xs from 'xstream';
import {runTabletFaceRobotApp} from '@cycle-robot-drivers/run';
import {RobotApp} from './RobotApp';

const S0 = `S0`;

const T = `
function transition(state, inputD, inputC) {
  if (state === 'START' && inputD === '') {

  }
}
`;

function main(sources) {
  const srsm$ = xs.of({
    S0: ``,
    T: ``
  })
  return RobotApp({
    ...sources,
  });
}

runTabletFaceRobotApp(main);

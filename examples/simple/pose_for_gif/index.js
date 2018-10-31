import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

function main(sources) {
  const face$ = xs.merge(
    sources.TabletFace.load.mapTo({
      type: 'START_BLINKING',
    }),
    xs.periodic(2000).map(i => {
      if (i === 0) {
        return {type: 'EXPRESS', value: {type: 'happy'}};
      } else if (i === 1) {
        return {type: 'EXPRESS', value: {type: 'sad'}};
      } else if (i === 2) {
        return {type: 'EXPRESS', value: {type: 'angry'}};
      } else if (i === 3) {
        return {type: 'EXPRESS', value: {type: 'focused'}};
      } else if (i === 4) {
        return {type: 'EXPRESS', value: {type: 'confused'}};
      }
    }).filter(expression => !!expression),
  );
  
  return {
    DOM: sources.TabletFace.DOM,
    TabletFace: face$,
  };
}

runRobotProgram(main);

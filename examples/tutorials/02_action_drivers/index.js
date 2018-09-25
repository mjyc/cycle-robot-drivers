import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

function main(sources) {
  const hello$ = sources.TabletFace.load.mapTo('Hello!');
  const nice$ = sources.SpeechSynthesisAction.result
    .take(1)
    .mapTo('Nice to meet you!');
  const greet$ = xs.merge(hello$, nice$);
  
  const sink = {
    TwoSpeechbubblesAction: greet$,
    SpeechSynthesisAction: greet$,
  };
  return sink;
}

runRobotProgram(main);

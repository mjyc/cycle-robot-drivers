import {makeDOMDriver} from '@cycle/dom';
import {runRobotProgram} from '@cycle-robot-drivers/run';
import xs from 'xstream';

function main(sources) {
  const hello$ = sources.TabletFace.load.mapTo('Hello!');
  const nice$ = sources.SpeechSynthesisAction.result
    .take(1)
    .mapTo('Nice to meet you!');
  const greet$ = xs.merge(hello$, nice$);
    
  return {
    TwoSpeechbubblesAction: greet$,
    SpeechSynthesisAction: greet$,
  }
}

runRobotProgram(main, {
  DOM: makeDOMDriver('#app'),
});

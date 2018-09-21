import {makeDOMDriver} from '@cycle/dom';
import {runRobotProgram} from '@cycle-robot-drivers/run';
import xs from 'xstream';


function main(sources) {
  const hello$ = sources.TabletFace.load.map('Hello!');
    
  return {
    TwoSpeechbubblesAction: hello$,
    SpeechSynthesisAction: hello$,
  }
}

runRobotProgram(main, {
  DOM: makeDOMDriver('#app'),
});

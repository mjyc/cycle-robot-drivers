import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {runRobotProgram} from '@cycle-robot-drivers/run';

function main(sources) {
  const message$ = xs.merge(
    xs.of('Hello').compose(delay(1000)),
    // xs.of(null).compose(delay(1500)),
    // xs.of('world').compose(delay(1500)),
  );

  sources.SpeechSynthesisAction.result.addListener({
    next: result => console.log(result),
  });
  
  return {
    SpeechSynthesisAction: message$,
  };
}

runRobotProgram(main);

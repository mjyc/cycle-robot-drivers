import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {runRobotProgram} from '@cycle-robot-drivers/run';

function main(sources) {
  const message$ = xs.merge(
    xs.of('Hello').compose(delay(1000)),
    // xs.of(null).compose(delay(1500)),
    // xs.of('World').compose(delay(1500)),
  );

  sources.SpeechSynthesisAction.output.addListener({
    next: output => console.log('output', output),
  });
  sources.SpeechSynthesisAction.result.addListener({
    next: result => console.log('result', result),
  });
  
  return {
    // SpeechSynthesis: sources.SpeechSynthesisAction.output.drop(1),
    // SpeechSynthesis: xs.of('What?!').compose(delay(1000)),
    SpeechSynthesisAction: message$,
  };
}

runRobotProgram(main);
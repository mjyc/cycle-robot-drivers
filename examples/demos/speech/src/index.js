import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {run} from '@cycle/run';
import {powerup} from '@cycle-robot-drivers/action';
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction,
  makeSpeechRecognitionDriver,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';


function main(sources) { 
  sources.proxies = {  // will be connected to "targets"
    SpeechSynthesisAction: xs.create(),
    SpeechRecognitionAction: xs.create(),
  };
  // create action components
  sources.SpeechSynthesisAction = SpeechSynthesisAction({
    goal: sources.proxies.SpeechSynthesisAction,
    SpeechSynthesis: sources.SpeechSynthesis,
  });
  sources.SpeechRecognitionAction = SpeechRecognitionAction({
    goal: sources.proxies.SpeechRecognitionAction,
    SpeechRecognition: sources.SpeechRecognition,
  });

  
  // main logic
  const synthGoal$ = xs.of('Hello there!').compose(delay(1000));
  const recogGoal$ = sources.SpeechSynthesisAction.result.mapTo({});

  sources.SpeechRecognitionAction.output.addListener({
    next: () => console.log(`Listening...`)
  });
  sources.SpeechRecognitionAction.result
    .addListener({
      next: (result) => {
        if (result.status.status === 'SUCCEEDED') {
          console.log(`Heard "${result.result}"`);
        } else {
          console.log(`I didn't hear anything.`);
        }
      }
    });

  
  return {
    SpeechSynthesis: sources.SpeechSynthesisAction.output,
    SpeechRecognition: sources.SpeechRecognitionAction.output,
    targets: {  // will be imitating "proxies"
      SpeechSynthesisAction: synthGoal$,
      SpeechRecognitionAction: recogGoal$,
    }
  }
}

run(powerup(main, (proxy, target) => proxy.imitate(target)), {
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

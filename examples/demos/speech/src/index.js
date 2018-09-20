import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {div, makeDOMDriver} from '@cycle/dom';
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


  // Say "Hello there!"
  const synthGoal$ = xs.of('Hello there!').compose(delay(1000));
  // Start listening when finished speacking
  const recogGoal$ = sources.SpeechSynthesisAction.result.mapTo({});
  // Display text based on the latest event
  const vdom$ = xs.merge(
    sources.SpeechSynthesisAction.output,
    sources.SpeechRecognitionAction.result,
  ).map(result => div(`${!!result.text ? result.text : result.result}`));

  
  return {
    DOM: vdom$,
    SpeechSynthesis: sources.SpeechSynthesisAction.output,
    SpeechRecognition: sources.SpeechRecognitionAction.output,
    targets: {  // will be used by "proxies"
      SpeechSynthesisAction: synthGoal$,
      SpeechRecognitionAction: recogGoal$,
    }
  }
}

run(powerup(main, (proxy, target) => proxy.imitate(target)), {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

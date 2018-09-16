import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import delay from 'xstream/extra/delay'
import {makeDOMDriver} from '@cycle/dom';
import {runRobotProgram as run} from '@cycle-robot-drivers/run';
import { fromEvent } from '@cycle/dom/lib/cjs/fromEvent';


function main(sources) { 
  const src = require('../public/snd/IWohoo3.ogg');
  const synthGoal$ = xs.of({text: 'Hello'}).compose(delay(1000));
  const recogGoal$ = xs.of({}).compose(delay(1000));
  const faceGoal$ = xs.of({type: 'happy'}).compose(delay(1000));
  const speechGoal$ = xs.of({type: 'ASK_QUESTION', value: ['How are you?', ['Good', 'Bad']]}).compose(delay(1000));
  const soundGoal$ = xs.of({src}).compose(delay(1000));

  // goals$ = fromEvent().map(() => {
  //   return {
  //     face: {text: 'Hello'},
  //     recognition: {},
  //     goal1: '',
  //   }
  // });

  sources.FacialExpressionAction.result
    .debug('FacialExpressionAction.result')
    .addListener({next: () => {}});
  sources.AudioPlayerAction.result
    .debug('AudioPlayerAction.result')
    .addListener({next: () => {}});
  sources.SpeechSynthesisAction.result
    .debug('SpeechSynthesisAction.result')
    .addListener({next: () => {}});
  sources.SpeechRecognitionAction.result
    .debug('SpeechRecognitionAction.result')
    .addListener({next: () => {}});
  sources.TwoSpeechbubblesAction.result
    .debug('TwoSpeechbubblesAction.result')
    .addListener({next: () => {}});
  sources.PoseDetection.poses
    // .debug('PoseDetection.poses')  // see the outputs in the browser
    .addListener({next: () => {}});
    
  return {
    FacialExpressionAction: faceGoal$,
    TwoSpeechbubblesAction: speechGoal$,
    AudioPlayerAction: soundGoal$,
    SpeechSynthesisAction: synthGoal$,
    SpeechRecognitionAction: recogGoal$,
  }
}

run(main, {
  DOM: makeDOMDriver('#app'),
});

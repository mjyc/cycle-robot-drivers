import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent'
import delay from 'xstream/extra/delay'
import {makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle-robot-drivers/run';


function main(sources) { 

  const src = require('../public/snd/IWohoo3.ogg');
  const synthGoal$ = xs.of({text: 'Hello'}).compose(delay(1000));
  const recogGoal$ = xs.of({}).compose(delay(1000));
  const faceGoal$ = xs.of({type: 'EXPRESS', args: {type: 'happy'}}).compose(delay(1000));
  const speechGoal$ = xs.of({type: 'ASK_QUESTION', value: ['How are you?', ['Good', 'Bad']]}).compose(delay(1000));
  const soundGoal$ = xs.of({src}).compose(delay(1000));

  sources.SpeechSynthesisAction.result
    .debug('SpeechSynthesisAction.result')
    .addListener({next: () => {}});
  sources.SpeechRecognitionAction.result
    .debug('SpeechRecognitionAction.result')
    .addListener({next: () => {}});
  sources.TwoSpeechbubblesAction.result
    .debug('TwoSpeechbubblesAction.result')
    .addListener({next: () => {}});
  sources.AudioPlayerAction.value
    .debug('AudioPlayerAction.value')
    .addListener({next: () => {}});
  sources.PoseDetection.poses
    // .debug('PoseDetection.poses')  // see the outputs in the browser
    .addListener({next: () => {}});
    
  return {
    TabletFace: faceGoal$,
    TwoSpeechbubblesAction: speechGoal$,
    AudioPlayerAction: soundGoal$,
    SpeechSynthesisAction: synthGoal$,
    SpeechRecognitionAction: recogGoal$,
  }
}

run(main, {
  DOM: makeDOMDriver('#app'),
});

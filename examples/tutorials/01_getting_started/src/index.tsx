import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {makeDOMDriver} from '@cycle/dom';
import {runRobotProgram as run} from '@cycle-robot-drivers/run';


function main(sources) { 
  const goals$ = sources.TabletFace.load.map(() => ({
    face: {type: 'happy'},
    sound: {src: require('../public/snd/IWohoo3.ogg')},
    speechbubble: {type: 'ASK_QUESTION', value: ['How are you?', ['Good', 'Bad']]},
    synthesis: {text: 'Hello there!'},
    recognition: {},
  }));

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
    FacialExpressionAction: goals$.map(goals => goals.face),
    TwoSpeechbubblesAction: goals$.map(goals => goals.speechbubble),
    AudioPlayerAction: goals$.map(goals => goals.sound),
    SpeechSynthesisAction: goals$.map(goals => goals.synthesis),
    SpeechRecognitionAction: goals$.map(goals => goals.recognition),
  }
}

run(main, {
  DOM: makeDOMDriver('#app'),
});

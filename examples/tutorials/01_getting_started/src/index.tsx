import Snabbdom from 'snabbdom-pragma';
import {makeDOMDriver} from '@cycle/dom';
import {runRobotProgram as run} from '@cycle-robot-drivers/run';
import xs from 'xstream';


function main(sources) {
  const goals$ = sources.TabletFace.load.filter(() => true).map(() => ({
    face: 'happy',
    sound: require('../public/snd/IWohoo3.ogg'),
    speechbubble: {
      message: 'How are you?',
      choices: ['Good', 'Bad'],
    },
    synthesis: 'Hello there!',
    recognition: {},
  }));

  sources.TwoSpeechbubblesAction.result
    .addListener({next: result => console.log(result)});
  sources.SpeechRecognitionAction.result
    .addListener({next: result => console.log(result)});
  // see the visual outputs in the browser as well
  sources.PoseDetection.poses
    .addListener({next: poses => console.log(poses)});
    
  return {
    FacialExpressionAction: goals$.map(goals => goals.face),
    TwoSpeechbubblesAction: goals$.map(goals => goals.speechbubble),
    AudioPlayerAction: goals$.map(goals => goals.sound),
    SpeechSynthesisAction: goals$.map(goals => goals.synthesis),
    SpeechRecognitionAction: goals$.map(goals => goals.recognition),
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
  }
}

run(main, {
  DOM: makeDOMDriver('#app'),
});

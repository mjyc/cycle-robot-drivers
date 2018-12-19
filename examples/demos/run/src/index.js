import {runRobotProgram} from '@cycle-robot-drivers/run';
import xs from 'xstream';


function main(sources) {
  const goals$ = sources.TabletFace.load.mapTo({
    face: 'happy',
    sound: 'https://raw.githubusercontent.com/aramadia/willow-sound/master/G/G15.ogg',
    speechbubble: {
      message: 'How are you?',
      choices: ['Good', 'Bad'],
    },
    synthesis: 'How are you?',
    recognition: {},
  });

  sources.TwoSpeechbubblesAction.result
    .addListener({next: result => {
      if (result.status.status === 'SUCCEEDED') {
        console.log(`I received "${result.result}"`);
      }
    }});
  sources.SpeechRecognitionAction.result
    .addListener({next: result => {
      if (result.status.status === 'SUCCEEDED') {
        console.log(`I heard "${result.result}"`);
      }
    }});
  sources.PoseDetection.poses
    .addListener({next: () => {}});  // see outputs on the browser
    
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

runRobotProgram(main);

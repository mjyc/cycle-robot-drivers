import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {runTabletFaceRobotApp} from '@cycle-robot-drivers/run';
import {initGoal} from '@cycle-robot-drivers/action';


function main(sources) {
  const goals$ = sources.TabletFace.events('load').mapTo({
    face: 'HAPPY',
    sound: 'https://raw.githubusercontent.com/aramadia/willow-sound/master/G/G15.ogg',
    speechbubble: {
      message: 'How are you?',
      choices: ['Good', 'Bad'],
    },
    synthesis: 'How are you?',
    recognition: {},
  }).compose(delay(1000));

  // sources.TwoSpeechbubblesAction.result
  //   .addListener({next: result => {
  //     if (result.status.status === 'SUCCEEDED') {
  //       console.log(`I received "${result.result}"`);
  //     }
  //   }});
  // sources.SpeechRecognitionAction.result
  //   .addListener({next: result => {
  //     if (result.status.status === 'SUCCEEDED') {
  //       console.log(`I heard "${result.result}"`);
  //     }
  //   }});
  sources.PoseDetection.events('poses').addListener({next: () => {}});

  return {
    FacialExpressionAction: {
      goal: goals$.map(goals => initGoal(goals.face)).debug(),
      cancel: xs.never(),
    },
    AudioPlayerAction: {
      goal: goals$.map(goals => goals.sound),
      cancel: xs.never(),
    },
    SpeechSynthesisAction: {
      goal: goals$.map(goals => goals.synthesis),
      cancel: xs.never(),
    },
    SpeechRecognitionAction: {
      goal: goals$.map(goals => goals.recognition),
      cancel: xs.never(),
    },
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
  }
}

runTabletFaceRobotApp(main);

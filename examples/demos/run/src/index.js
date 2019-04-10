import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {runTabletFaceRobotApp} from '@cycle-robot-drivers/run';
import {initGoal} from '@cycle-robot-drivers/action';


function main(sources) {
  const goals$ = sources.TabletFace.events('load').mapTo({
    face: initGoal('HAPPY'),
    sound: initGoal('https://raw.githubusercontent.com/aramadia/willow-sound/master/G/G15.ogg'),
    robotSpeechbubble: initGoal('How are you?'),
    humanSpeechbubble: initGoal(['Good', 'Bad']),
    synthesis: initGoal('How are you?'),
    recognition: initGoal({}),
  });

  sources.HumanSpeechbubbleAction.result
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
  sources.PoseDetection.events('poses').addListener({next: () => {}});

  return {
    FacialExpressionAction: {
      goal: goals$.map(goals => goals.face),
    },
    RobotSpeechbubbleAction: {
      goal: goals$.map(goals => goals.robotSpeechbubble),
    },
    HumanSpeechbubbleAction: {
      goal: goals$.map(goals => goals.humanSpeechbubble),
    },
    AudioPlayerAction: {
      goal: goals$.map(goals => goals.sound),
    },
    SpeechSynthesisAction: {
      goal: goals$.map(goals => goals.synthesis),
    },
    SpeechRecognitionAction: {
      goal: goals$.map(goals => goals.recognition),
    },
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
  }
}

runTabletFaceRobotApp(main);

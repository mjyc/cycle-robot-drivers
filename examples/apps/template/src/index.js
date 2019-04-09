import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {runTabletFaceRobotApp} from '@cycle-robot-drivers/run';
import {initGoal, selectActionResult} from '@cycle-robot-drivers/action';


function input({
  FacialExpressionAction,
  RobotSpeechbubbleAction,
  HumanSpeechbubbleAction,
  AudioPlayerAction,
  SpeechSynthesisAction,
  SpeechRecognitionAction,
  PoseDetection,
}) {
  return [
    xs.merge(
      FacialExpressionAction.result.map(r => ({
        type: 'FacialExpressionAction',
        ...r,
      })),
      RobotSpeechbubbleAction.result.map(r => ({
        type: 'RobotSpeechbubbleAction',
        ...r,
      })),
      HumanSpeechbubbleAction.result.map(r => ({
        type: 'HumanSpeechbubbleAction',
        ...r,
      })),
      AudioPlayerAction.result.map(r => ({
        type: 'AudioPlayerAction',
        ...r,
      })),
      SpeechSynthesisAction.result.map(r => ({
        type: 'SpeechSynthesisAction',
        ...r,
      })),
      SpeechRecognitionAction.result.map(r => ({
        type: 'SpeechRecognitionAction',
        ...r,
      })),
    ),
    xs.never(),
    // PoseDetection.events('poses').map(poses => ({
    // })),
  ];
}

// function transition(state, inputD, inputC) {

// }

function selectActionResult2(actionName) {
  return (in$) => in$
    .filter(s => !!s
      && !!s[actionName]
      && !!s[actionName].outputs
      // && !!s[actionName].outputs.result
      )
    // .map(s => s[actionName].outputs.result)
    // .compose(dropRepeats(isEqualResult));
}

function main(sources) {
  // sources.state.stream.addListener({next: s => console.debug('reducer state', s)});

  sources.state.stream.compose(selectActionResult2('FacialExpressionAction')).addListener({next: s => console.error('FacialExpression.result', s)});

  input(sources)[0].addListener({next: v => console.warn(v)});
  sources.FacialExpressionAction.result.addListener({next: v => console.error(v)});

  // const goals$ = sources.TabletFace.events('load').mapTo({
  const goals$ = xs.of({
    face: initGoal('HAPPY'),
    sound: initGoal('https://raw.githubusercontent.com/aramadia/willow-sound/master/G/G15.ogg'),
    robotSpeechbubble: initGoal('How are you?'),
    humanSpeechbubble: initGoal(['Good', 'Bad']),
    synthesis: initGoal('How are you?'),
    recognition: initGoal({}),
  // });
  }).compose(delay(1500));

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

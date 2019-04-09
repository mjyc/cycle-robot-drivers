import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {initGoal} from '@cycle-robot-drivers/action';


function input({
  command,
  FacialExpressionAction,
  RobotSpeechbubbleAction,
  HumanSpeechbubbleAction,
  AudioPlayerAction,
  SpeechSynthesisAction,
  SpeechRecognitionAction,
  PoseDetection,
}) {
  const inputD$ = xs.merge(
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
  );


  // TODO: update this using the example below
  const inputC$ = PoseDetection.events('poses').mapTo({
    val1: 0,
    val2: 0,
    val3: 0,
  });
  // const inputC$ = PoseDetection.events('poses').filter(poses =>
  //     posses.length === 1
  //     && poses[0].keypoints.filter(kpt => kpt.part === 'nose').length === 1
  //   ).map(poses => {
  //     const nose = poses[0].keypoints.filter(kpt => kpt.part === 'nose')[0];
  //     return {
  //       x: nose.position.x / 640,  // max value of position.x is 640
  //       y: nose.position.y / 480,  // max value of position.y is 480
  //     };
  //   })
  //   .compose(throttle(throttleDelay))
  //   .compose(pairwise)
  //   .map(([prev, cur]) => cur.x - prev.x)
  //   .filter(delta => Math.abs(delta) > deltaThreshold)
  //   .map(delta => ({type: InputType.MOVED_FACE, value: delta}));

  return xs.merge(
    command$,
    inputD$.map(val => ({type: 'DISCRETE_INPUT', value: val})),
    inputC$.map(val => ({type: 'CONTINUOUS_INPUT', value: val})),
  );
}

function transition(prev, input) {
  return prev;
}

function transitionReducer(input$) {
  const initReducer$ = xs.of(
    function initReducer(prev) {
      return {
        state: State.WAIT,
        variables: {
          goal_id: null,
          newGoal: null,
        },
        outputs: null,
      }
    }
  );

  const inputReducer$ = input$
    .map(input => function inputReducer(prev) {

      // if (input.type === 'FSM') {
      //   return {
      //     ...prev,
      //     fsm: input.value,
      //   };
      // }

      // return {
      //   ...prev,
      //   fsm: {
      //     ...prev.fsm,
      //     state: prev.transition(prev.fsm.state, input),
      //   },
      // };

      return prev;
    });

  return xs.merge(initReducer$, inputReducer$);
}

export function RobotApp(sources) {
  input(sources).addListener({next: v => console.debug(v)});
  // const reducer = transitionReducer(input$);



  // TODO: remove the code below
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

import xs from 'xstream';
import {initGoal} from '@cycle-robot-drivers/action';


function input({
  command,
  FacialExpressionAction,
  RobotSpeechbubbleAction,
  HumanSpeechbubbleAction,
  AudioPlayerAction,
  SpeechSynthesisAction,
  SpeechRecognitionAction,
  // PoseDetection,
}) {
  const command$ = command;  // no change intended
  const inputD$ = xs.merge(
    FacialExpressionAction.result.map(r => ({
      type: 'FacialExpressionAction',
      status: r.status.status,
      result: r.result,
    })),
    RobotSpeechbubbleAction.result.map(r => ({
      type: 'RobotSpeechbubbleAction',
      status: r.status.status,
      result: r.result,
    })),
    HumanSpeechbubbleAction.result.map(r => ({
      type: 'HumanSpeechbubbleAction',
      status: r.status.status,
      result: r.result,
    })),
    AudioPlayerAction.result.map(r => ({
      type: 'AudioPlayerAction',
      status: r.status.status,
      result: r.result,
    })),
    SpeechSynthesisAction.result.map(r => ({
      type: 'SpeechSynthesisAction',
      status: r.status.status,
      result: r.result,
    })),
    SpeechRecognitionAction.result.map(r => ({
      type: 'SpeechRecognitionAction',
      status: r.status.status,
      result: r.result,
    })),
  );


  // TODO: update this using the example below
  const inputC$ = xs.never();
  // PoseDetection.events('poses').mapTo({
  //   val1: 0,
  //   val2: 0,
  //   val3: 0,
  // });
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

function transitionReducer(input$) {
  const initReducer$ = xs.of((prev) => {
    return {
      ...prev,
      fsm: null,
      outputs: null,
    };
  });

  // const wrapOutputs(outputs) {
  //   let outputs = prev.fsm.emission(prev.fsm.state, input.value);
  //   return outputs !== null ? Object.keys(outputs).reduce((prev, name) => ({
  //     ...prev,
  //     [name]: initGoal(outputs[name]),
  //   }), {}) : outputs;
  // }

  const inputReducer$ = input$.map(input => (prev) => {
    if (input.type === 'LOAD_FSM') {
      return {
        ...prev,
        fsm: {
          state: input.value.S0,
          transition: input.value.T,
          emission: input.value.G,
        },
        outputs: null,
      };
    } else if (input.type === 'START_FSM') {
      return {
        ...prev,
        fsm: {
          ...prev.fsm,
          state: prev.fsm.transition(prev.fsm.state, {type: 'START'}),
        },
        outputs: prev.fsm.emission(prev.fsm.state, {type: 'START'}),
      };
    } else if (input.type === 'DISCRETE_INPUT') {
      let outputs = prev.fsm.emission(prev.fsm.state, input.value);
      outputs !== null ? Object.keys(outputs).reduce((prev, name) => ({
        ...prev,
        [name]: initGoal(outputs[name]),
      }), {}) : outputs;
      return {
        ...prev,
        fsm: {
          ...prev.fsm,
          state: prev.fsm.transition(prev.fsm.state, input.value),
        },
        outputs,
      };
    } else {
      return {
        ...prev,
        fsm: {
          ...prev.fsm,
          state: prev.fsm.transition(prev.fsm.state, input),
        },
        outputs: prev.fsm.emission(prev.fsm.state, input),
      };
    }
  });

  return xs.merge(initReducer$, inputReducer$);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(rs => !!rs.outputs)
    .map(rs => rs.outputs);
  return {
    result: outputs$
      .filter(o => !!o.result)
      .map(o => o.result),
    FacialExpressionAction: {
      goal: outputs$.map(o => o.FacialExpressionAction),
    },
    RobotSpeechbubbleAction: {
      goal: outputs$.map(o => o.RobotSpeechbubbleAction),
    },
    HumanSpeechbubbleAction: {
      goal: outputs$.map(o => o.HumanSpeechbubbleAction),
    },
    AudioPlayerAction: {
      goal: outputs$.map(o => o.AudioPlayerAction),
    },
    SpeechSynthesisAction: {
      goal: outputs$.map(o => o.SpeechSynthesisAction),
    },
    SpeechRecognitionAction: {
      goal: outputs$.map(o => o.SpeechRecognitionAction),
    },
  };
};

export function RobotApp(sources) {
  const input$ = input(sources);
  const reducer = transitionReducer(input$);
  const outputs = output(sources.state.stream);

  return {
    state: reducer,
    ...outputs,
  };
}

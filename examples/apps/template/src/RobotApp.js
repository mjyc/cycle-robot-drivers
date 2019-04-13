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
  const command$ = command.map(cmd => cmd.type === 'START_FSM'
    ? ({
      ...cmd,
      value: {type: 'START'},
    }) : cmd
  );
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
      fsm: null,
      outputs: null,
    };
  });

  const wrapOutputs = (outputs = {}) => {
    return outputs !== null
      ? Object.keys(outputs).reduce((prev, name) => ({
        ...prev,
        [name]: (
            outputs[name].hasOwnProperty('goal')
            && outputs[name].hasOwnProperty('cancel')
          ) ? {
            ...outputs[name],
            goal: initGoal(outputs[name].goal),
          } : {
            goal: initGoal(outputs[name]),
            // no cancel
          },
      }), {})
      : outputs;
  };

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
    } else if (input.type === 'START_FSM' || input.type === 'DISCRETE_INPUT') {
      let outputs = wrapOutputs(prev.fsm.emission(prev.fsm.state, input.value));
      return {
        ...prev,
        fsm: {
          ...prev.fsm,
          state: prev.fsm.transition(prev.fsm.state, input.value),
        },
        outputs,
      };
    } else {
      // TODO: update the return value
      return {
        ...prev,
        fsm: {
          ...prev.fsm,
          state: 'S0',
        },
        outputs: null,
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
      goal: outputs$
        .filter(o => !!o.FacialExpressionAction
            && !!o.FacialExpressionAction.goal)
        .map(o => o.FacialExpressionAction.goal),
      cancel: outputs$
        .filter(o => !!o.FacialExpressionAction
            && !!o.FacialExpressionAction.cancel)
        .map(o => o.FacialExpressionAction.cancel),
    },
    RobotSpeechbubbleAction: {
      goal: outputs$
        .filter(o => !!o.RobotSpeechbubbleAction
            && !!o.RobotSpeechbubbleAction.goal)
        .map(o => o.RobotSpeechbubbleAction.goal),
      cancel: outputs$
        .filter(o => !!o.RobotSpeechbubbleAction
            && !!o.RobotSpeechbubbleAction.cancel)
        .map(o => o.RobotSpeechbubbleAction.cancel),
    },
    HumanSpeechbubbleAction: {
      goal: outputs$
        .filter(o => !!o.HumanSpeechbubbleAction
            && !!o.HumanSpeechbubbleAction.goal)
        .map(o => o.HumanSpeechbubbleAction.goal),
      cancel: outputs$
        .filter(o => !!o.HumanSpeechbubbleAction
            && !!o.HumanSpeechbubbleAction.cancel)
        .map(o => o.HumanSpeechbubbleAction.cancel),
    },
    AudioPlayerAction: {
      goal: outputs$
        .filter(o => !!o.AudioPlayerAction
            && !!o.AudioPlayerAction.goal)
        .map(o => o.AudioPlayerAction.goal),
      cancel: outputs$
        .filter(o => !!o.AudioPlayerAction
            && !!o.AudioPlayerAction.canel)
        .map(o => o.AudioPlayerAction.cancel),
    },
    SpeechSynthesisAction: {
      goal: outputs$
        .filter(o => !!o.SpeechSynthesisAction
            && !!o.SpeechSynthesisAction.goal)
        .map(o => o.SpeechSynthesisAction.goal),
      cancel: outputs$
        .filter(o => !!o.SpeechSynthesisAction
            && !!o.SpeechSynthesisAction.cancel)
        .map(o => o.SpeechSynthesisAction.cancel),
    },
    SpeechRecognitionAction: {
      goal: outputs$
        .filter(o => !!o.SpeechRecognitionAction
            && !!o.SpeechRecognitionAction.goal)
        .map(o => o.SpeechRecognitionAction.goal),
      cancel: outputs$
        .filter(o => !!o.SpeechRecognitionAction
            && !!o.SpeechRecognitionAction.cancel)
        .map(o => o.SpeechRecognitionAction.cancel),
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

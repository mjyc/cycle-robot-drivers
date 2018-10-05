import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
  PEND: 'PEND',
  ASK: 'ASK',
  WAIT: 'WAIT',
};

const InputType = {
  GOAL: 'GOAL',
  ASK_DONE: 'ASK_DONE',
  VALID_RESPONSE: 'VALID_RESPONSE',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  DETECTED_FACE: 'DETECTED_FACE',
};

const transitionTable = {
  [State.PEND]: {
    [InputType.GOAL]: State.ASK,
  },
  [State.ASK]: {
    [InputType.ASK_DONE]: State.WAIT,
  },
  [State.WAIT]: {
    [InputType.VALID_RESPONSE]: State.ASK,
    [InputType.INVALID_RESPONSE]: State.WAIT,
  },
};

const Question = {
  EMPTY: '',
  CAREER: 'Is it important that you reach your full career potential?',
  ONLINE: 'Can you see yourself working online.',
  FAMILY: 'Do you have to be near my family/friends/pets?',
  TRIPS: 'Do you think short trips are awesome?',
  HOME: 'Do you want to have a home and nice things?',
  ROUTINE: 'Do you think a routine gives your life structure?',
  JOB: 'Do you need a secure job and a stable income?',
  VACATIONER: 'You are a vacationer!',
  EXPAT: 'You are an expat!',
  NOMAD: 'You are a nomad!',
};

const Response = {
  YES: 'yes',
  NO: 'no',
}

const flowchart = {
  [Question.CAREER]: {
    [Response.YES]: Question.ONLINE,
    [Response.NO]: Question.FAMILY,
  },
  [Question.ONLINE]: {
    [Response.YES]: Question.NOMAD,
    [Response.NO]: Question.VACATIONER,
  },
  [Question.FAMILY]: {
    [Response.YES]: Question.VACATIONER,
    [Response.NO]: Question.TRIPS,
  },
  [Question.TRIPS]: {
    [Response.YES]: Question.VACATIONER,
    [Response.NO]: Question.HOME,
  },
  [Question.HOME]: {
    [Response.YES]: Question.EXPAT,
    [Response.NO]: Question.ROUTINE,
  },
  [Question.ROUTINE]: {
    [Response.YES]: Question.EXPAT,
    [Response.NO]: Question.JOB,
  },
  [Question.JOB]: {
    [Response.YES]: Question.ONLINE,
    [Response.NO]: Question.NOMAD,
  },
};

function input(
  start$,
  speechRecognitionActionSource,
  speechSynthesisActionSource,
  poseDetectionSource,
) {
  return xs.merge(
    start$.mapTo({type: InputType.GOAL}),
    speechRecognitionActionSource.result.filter(result =>
      result.status.status === 'SUCCEEDED'
      && (result.result === Response.YES || result.result === Response.NO)
    ).map(result => ({
      type: InputType.VALID_RESPONSE,
      value: result.result,
    })),
    speechSynthesisActionSource.result.mapTo({type: InputType.ASK_DONE}),
    speechRecognitionActionSource.result.filter(result =>
      result.status.status !== 'SUCCEEDED'
      || (result.result !== Response.YES && result.result !== Response.NO)
    ).mapTo({type: InputType.INVALID_RESPONSE}),
    poseDetectionSource.poses.filter(poses =>
      poses.length === 1
      && poses[0].keypoints.filter(kpt => kpt.part === 'nose').length === 1
    ).map(poses => {
      const nose = poses[0].keypoints.filter(kpt => kpt.part === 'nose')[0];
      return {
        type: InputType.DETECTED_FACE,
        value: {
          x: nose.position.x / 640,  // max value of position.x is 640
          y: nose.position.y / 480,  // max value of position.y is 480
        },
      };
    }),
  );
}

function transition(prevState, prevVariables, input) {
  if (input.type === InputType.DETECTED_FACE) {
    return {
      state: prevState,
      variables: prevVariables,
      outputs: (prevState === State.WAIT)
        ? {
          TabletFace: {
            goal: {
              type: 'SET_STATE',
              value: {
                leftEye: input.value,
                rightEye: input.value,
              },
            },
          },
        } : null,
    };
  }

  const states = transitionTable[prevState];
  if (!states) {
    throw new Error(`Invalid prevState="${prevState}"`);
  }
  let state = states[input.type];
  if (!state) {
    console.debug(`Undefined transition for "${prevState}" "${input.type}"; `
      + `set state to prevState`);
    state = prevState;
  }
  // console.log(prevState, prevVariables, input, state);

  if (state === State.ASK) {
    const question = (input.type === InputType.GOAL)
      ? Question.CAREER
      : flowchart[prevVariables.question][input.value];
    return {
      state,
      variables: {
        question,
      },
      outputs: {
        SpeechSynthesisAction: {
          goal: question,
        },
        TabletFace: {
          goal: {
            type: 'SET_STATE',
            value: {
              leftEye: {x: 0.5, y: 0.5},
              rightEye: {x: 0.5, y: 0.5},
            },
          },
        },
      },
    }
  } else if (state === State.WAIT) {
    if (
      prevVariables.question !== Question.VACATIONER
      && prevVariables.question !== Question.EXPAT
      && prevVariables.question !== Question.NOMAD
    ) {
      return {
        state,
        variables: prevVariables,
        outputs: {
          SpeechRecognitionAction: {
            goal: {},
          },
        },
      }
    } else {
      return {
        state: State.PEND,
        variables: {
          question: null,
        },
        outputs: null,
      };  // == defaultMachine
    }
  }

  return {
    state: prevState,
    variables: prevVariables,
    outputs: null,
  };
}

function main(sources) {
  const input$ = input(
    sources.TabletFace.load.mapTo({}),
    sources.SpeechRecognitionAction,
    sources.SpeechSynthesisAction,
    sources.PoseDetection,
  );

  const defaultMachine = {
    state: State.PEND,
    variables: {
      question: null,
    },
    outputs: null,
  };
  const machine$ = input$.fold((machine, input) => transition(
    machine.state, machine.variables, input
  ), defaultMachine);

  const outputs$ = machine$
    .filter(machine => !!machine.outputs)
    .map(machine => machine.outputs);

  return {
    SpeechSynthesisAction: outputs$
      .filter(outputs => !!outputs.SpeechSynthesisAction)
      .map(output => output.SpeechSynthesisAction.goal),
    SpeechRecognitionAction: outputs$
      .filter(outputs => !!outputs.SpeechRecognitionAction)
      .map(output => output.SpeechRecognitionAction.goal).debug(),
    TabletFace: outputs$
      .filter(outputs => !!outputs.TabletFace)
      .map(output => output.TabletFace.goal),
  }
}

runRobotProgram(main);

import xs from 'xstream';
import pairwise from 'xstream/extra/pairwise';
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
  PEND: 'PEND',
  ASK: 'ASK',
  WAIT_FOR_RESPONSE: 'WAIT_FOR_RESPONSE',
  WAIT_FOR_PERSON: 'WAIT_FOR_PERSON',

};

const InputType = {
  GOAL: 'GOAL',
  ASK_SUCCESS: 'ASK_SUCCESS',
  VALID_RESPONSE: 'VALID_RESPONSE',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  DETECTED_FACE: 'DETECTED_FACE',
  FOUND_PERSON: 'FOUND_PERSON',
  LOST_PERSON: 'LOST_PERSON',
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
    speechSynthesisActionSource.result.mapTo({type: InputType.ASK_SUCCESS}),
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
    poseDetectionSource.poses
      .map(poses => poses.length)
      .compose(pairwise)
      .filter(([prev, cur]) => prev !== cur)
      .map(([prev, cur]) => {
        if (prev < cur) {
          return {type: InputType.FOUND_PERSON};
        } else if (prev > cur) {
          return {type: InputType.LOST_PERSON};
        }
      }),
  );
}

function isQuestion(sentence) {
  return sentence !== Question.VACATIONER
    && sentence !== Question.EXPAT
    && sentence !== Question.NOMAD;
}

function createTransition() {
  const transitionTable = {
    [State.PEND]: {
      [InputType.GOAL]: (variables) => State.ASK,
    },
    [State.ASK]: {
      [InputType.ASK_SUCCESS]: (variables) => isQuestion(variables.question)
        ? State.WAIT_FOR_RESPONSE : State.PEND,
      [InputType.LOST_PERSON]: (variables) => State.WAIT_FOR_PERSON,
    },
    [State.WAIT_FOR_RESPONSE]: {
      [InputType.VALID_RESPONSE]: (variables) => State.ASK,
      [InputType.INVALID_RESPONSE]: (variables) => State.WAIT_FOR_RESPONSE,
    },
    [State.WAIT_FOR_PERSON]: {
      [InputType.FOUND_PERSON]: (variables) => State.ASK,
    },
  };

  return function(state, variables, input) {
    return !transitionTable[state]
      ? state
      : !transitionTable[state][input.type]
        ? state
        : transitionTable[state][input.type](variables);
  }
}

function createEmission() {
  const emissionTable = {
    [State.PEND]: {
      [InputType.GOAL]: (variables, input) => ({
        variables: {question: Question.CAREER},
        outputs: {SpeechSynthesisAction: {goal: Question.CAREER}},
      }),
    },
    [State.ASK]: {
      [InputType.ASK_SUCCESS]: (variables, input) => isQuestion(variables.question)
        ? {
          variables,
          outputs: {SpeechRecognitionAction: {goal: {}}},
        } : {variables, outputs: {done: true}},
      [InputType.LOST_PERSON]: (variables, input) => ({
        variables,
        outputs: {SpeechSynthesisAction: {goal: null}},
      }),
    },
    [State.WAIT_FOR_RESPONSE]: {
      [InputType.VALID_RESPONSE]: (variables, input) => ({
        variables: {question: flowchart[variables.question][input.value]},
        outputs: {
          SpeechSynthesisAction: {
            goal: flowchart[variables.question][input.value],
          },
          TabletFace: {goal: {
            type: 'SET_STATE',
            value: {
              leftEye: {x: 0.5, y: 0.5},
              rightEye: {x: 0.5, y: 0.5},
            },
          }},
        },
      }),
      [InputType.INVALID_RESPONSE]: (variables, input) => ({
        variables,
        outputs: {SpeechRecognitionAction: {goal: {}}},
      }),
      [InputType.DETECTED_FACE]: (variables, input) => ({
        variables,
        outputs: {
          TabletFace: {goal: {
            type: 'SET_STATE',
            value: {
              leftEye: input.value,
              rightEye: input.value,
            },
          }},
        }
      }),
    },
    [State.WAIT_FOR_PERSON]: {
      [InputType.FOUND_PERSON]: (variables, input) => ({
        variables,
        outputs: {SpeechSynthesisAction: {goal: variables.question}},
      }),
    },
  };

  return function(state, variables, input) {
    return !emissionTable[state]
      ? {variables, outputs: null}
      : !emissionTable[state][input.type]
        ? {variables, outputs: null}
        : emissionTable[state][input.type](variables, input);
  }
}

const transition = createTransition();
const emission = createEmission();

function update(state, variables, input) {
  // const newState = transition(state, variables, input);
  // const e = emission(state, variables, input);
  // console.warn(state, input, variables, newState, e.outputs, e.variables);

  const e = emission(state, variables, input);
  const returnMe = {
    state: transition(state, variables, input),
    variables: e.variables,
    outputs: e.outputs,
  };
  console.log(state, returnMe, input);
  return returnMe;
  // return {
  //   state,
  //   variables,
  //   outputs: null,
  // };
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
  const machine$ = input$.fold((machine, input) => update(
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
      .map(output => output.SpeechRecognitionAction.goal),
    TabletFace: outputs$
      .filter(outputs => !!outputs.TabletFace)
      .map(output => output.TabletFace.goal),
  }
}

runRobotProgram(main);

import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
  PEND: 'PEND',
  ASK: 'ASK',
  WAIT: 'WAIT'
};

const InputType = {
  REQUESTED_START: 'REQUESTED_START',
  DONE_SPEAKING: 'DONE_SPEAKING',
  RECEIVED_VALID: 'RECEIVED_VALID',
  RECEIVED_INVALID: 'RECEIVED_INVALID',
};

const transitionTable = {
  [State.PEND]: {
    [InputType.REQUESTED_START]: State.ASK,
  },
  [State.ASK]: {
    [InputType.DONE_SPEAKING]: State.WAIT,
  },
  [State.WAIT]: {
    [InputType.RECEIVED_VALID]: State.ASK,
    [InputType.RECEIVED_INVALID]: State.WAIT,
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
  NOMAD: 'You are a nomad!'
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
  }
};

function input(
  start$,
  speechRecognitionActionSource,
  speechSynthesisActionSource,
  // poseDetectionSource,
) {
  return xs.merge(
    start$.mapTo({type: InputType.REQUESTED_START}),
    speechRecognitionActionSource.result.filter(result =>
      result.status.status === 'SUCCEEDED'
      && (result.result === 'yes' || result.result === 'no')
    ).map(result => ({
      type: InputType.RECEIVED_VALID,
      value: result.result,
    })),
    speechSynthesisActionSource.result.mapTo({type: InputType.DONE_SPEAKING}),
    speechRecognitionActionSource.result.filter(result =>
      result.status.status !== 'SUCCEEDED'
      || (result.result !== 'yes' && result.result !== 'no')
    ).mapTo({type: InputType.RECEIVED_INVALID}),
  );
}

function transition(prevState, prevVariables, input) {
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

  if (
    state === State.ASK
  ) {
    const question = (input.type === InputType.REQUESTED_START)
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
        }
      },
    }
  } else if (
    state === State.WAIT
    && input.type === InputType.DONE_SPEAKING
  ) {
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
          }
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
    // sources.PoseDetection,
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
      .map(output => output.SpeechRecognitionAction.goal),
  }
}

runRobotProgram(main);

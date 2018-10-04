import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
  START: 'START',
  ASK: 'ASK',
  WAIT: 'WAIT'
};

const InputType = {
  LOADED: 'LOADED',
  DONE_SPEAKING: 'DONE_SPEAKING',
  RECEIVED_VALID: 'RECEIVED_VALID',
  RECEIVED_INVALID: 'RECEIVED_INVALID',
};

const transitionTable = {
  [State.START]: {
    [InputType.LOADED]: State.ASK,
  },
  [State.ASK]: {
    [InputType.RECEIVED_VALID]: State.ASK,
    [InputType.RECEIVED_INVALID]: State.ASK,
  },
  [State.ASK]: {
    [InputType.RECEIVED_VALID]: State.ASK,
    [InputType.RECEIVED_INVALID]: State.ASK,
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

const flowchart = {
  [Question.CAREER]: {
    [InputType.RECEIVED_YES]: Question.ONLINE,
    [InputType.RECEIVED_NO]: Question.FAMILY,
  },
  [Question.ONLINE]: {
    [InputType.RECEIVED_YES]: Question.NOMAD,
    [InputType.RECEIVED_NO]: Question.VACATIONER,
  },
  [Question.FAMILY]: {
    [InputType.RECEIVED_YES]: Question.VACATIONER,
    [InputType.RECEIVED_NO]: Question.TRIPS,
  },
  [Question.TRIPS]: {
    [InputType.RECEIVED_YES]: Question.VACATIONER,
    [InputType.RECEIVED_NO]: Question.HOME,
  },
  [Question.HOME]: {
    [InputType.RECEIVED_YES]: Question.EXPAT,
    [InputType.RECEIVED_NO]: Question.ROUTINE,
  },
  [Question.ROUTINE]: {
    [InputType.RECEIVED_YES]: Question.EXPAT,
    [InputType.RECEIVED_NO]: Question.JOB,
  },
  [Question.JOB]: {
    [InputType.RECEIVED_YES]: Question.ONLINE,
    [InputType.RECEIVED_NO]: Question.NOMAD,
  }
};

function input(
  load$,
  speechRecognitionActionResult$,
  speechSynthesisActionResult$,
) {
  return xs.merge(
    load$.mapTo({type: InputType.LOADED}),
    speechRecognitionActionResult$.filter(result =>
      result.status.status === 'SUCCEEDED'
      && (result.result === 'yes' || result.result === 'no')
    ).map(result => ({
      type: InputType.RECEIVED_VALID,
      value: result.result,
    })),
    speechSynthesisActionResult$.mapTo({type: InputType.DONE_SPEAKING}),
    speechRecognitionActionResult$.filter(result =>
      result.status.status !== 'SUCCEEDED'  // must succeed
      || (result.result !== 'yes' && result.result !== 'no') // only yes or no
    ).mapTo({type: InputType.RECEIVED_INVALID}),
  );
}

function transition(prevState, input) {
  const states = transitionTable[prevState];
  if (!states) {
    throw new Error(`Invalid prevState="${prevState}"`);
  }

  let state = states[input];
  if (!state) {
    console.debug(`Undefined transition for "${prevState}" "${input}"; `
      + `set state to prevState`);
    state = prevState;
  }

  console.log(prevState, state, input);

  const outputs = (
    state === State.ASK && input.type === InputType.RECEIVED_VALID
  ) ? {say: flowchart[prevState.question][input.value]} : null;

  return prevState;
}

function main(sources) {
  const input$ = input(
    sources.TabletFace.load,
    sources.SpeechRecognitionAction.result,
    sources.SpeechSynthesisAction.result,
  );

  const model$ = input$.fold((machine, input) => transition(
    machine.state, input
  ), {
    state: State.START,
    variables: {
      questionIdx: 0,
    },
    outputs: null,
  });

  // input$.addListener({
  //   next: (input) => console.log('input', input)
  // });
  model$.addListener({
    next: (model) => console.log('model', model)
  });

}

runRobotProgram(main);

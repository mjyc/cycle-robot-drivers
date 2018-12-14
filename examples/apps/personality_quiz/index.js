import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
  PEND: 'PEND',
  SAY: 'SAY',
  LISTEN: 'LISTEN',
};

const InputType = {
  GOAL: `GOAL`,
  SAY_DONE: `SAY_DONE`,
  VALID_RESPONSE: `VALID_RESPONSE`,
  INVALID_RESPONSE: `INVALID_RESPONSE`,
};

function input(
  start$,
  speechRecognitionActionResult$,
  speechSynthesisActionResult$,
) {
  return xs.merge(
    start$.map(v => ({type: InputType.GOAL, value: v})),
    speechRecognitionActionResult$
      .filter(result =>
        result.status.status === 'SUCCEEDED'
      ).map(result => ({
        type: InputType.VALID_RESPONSE,
        value: result.result,
      })),
    speechSynthesisActionResult$
      .filter(result => result.status.status === 'SUCCEEDED')
      .mapTo({type: InputType.SAY_DONE}),
    speechRecognitionActionResult$
      .filter(result =>
        result.status.status !== 'SUCCEEDED'
      ).mapTo({type: InputType.INVALID_RESPONSE}),
  );
}

function createTransition() {
  // usage: transitionTable["state"]["inputType"], then it returns a function
  //   (prevVariables, inputValue) => {state: ..., variables: ..., outputs: ...}
  const transitionTable = {
    [State.PEND]: {
      [InputType.GOAL]: (prevVariables, inputValue) => ({
        state: State.SAY,
        variables: inputValue,
        outputs: {SpeechSynthesisAction: {goal: inputValue.question}},
      }),
    },
    [State.SAY]: {
      [InputType.SAY_DONE]: (prevVariables, inputValue) => ({
          state: State.LISTEN,
          variables: prevVariables,
          outputs: {SpeechRecognitionAction: {goal: {}}},  // TODO: use grammar
        }),
    },
    [State.LISTEN]: {
      [InputType.VALID_RESPONSE]: (prevVariables, inputValue) => ({
        state: State.PEND,
        variables: prevVariables,
        outputs: {done: true},  // TODO: update output on "done"
      }),
      [InputType.INVALID_RESPONSE]: (prevVariables, inputValue) => ({
        state: State.LISTEN,
        variables: prevVariables,
        outputs: {SpeechRecognitionAction: {goal: {}}},
      }),
    },
  };

  return function(prevState, prevVariables, input) {
    console.debug(
      'prevState', prevState, 'prevVariables', prevVariables, 'input', input);
    // excuse me for abusing ternary
    return !transitionTable[prevState]
      ? {state: prevState, variables: prevVariables, outputs: null}
      : !transitionTable[prevState][input.type]
        ? {state: prevState, variables: prevVariables, outputs: null}
        : transitionTable[prevState][input.type](prevVariables, input.value);
  }
}

const transition = createTransition();

function output(machine$) {
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
  };
}

function main(sources) {
  // const state$ = sources.state.stream;

  const input$ = input(
    sources.TabletFace.load.mapTo({
      question: 'How are you?',
      answers: ['Good', 'Bad'],
    }),
    sources.SpeechRecognitionAction.result,
    sources.SpeechSynthesisAction.result,
  );

  const defaultMachine = {
    state: State.PEND,
    variables: {
      question: null,
      answers: null,
    },
    outputs: null,
  };
  const machine$ = input$.fold((machine, input) => transition(
    machine.state, machine.variables, input
  ), defaultMachine).debug();

  // const reducer$ = machine$
  //   .map(m => function(prevState) {
  //     prevState: {model: m};
  //   })

  const sinks = output(machine$);
  return sinks;
}

runRobotProgram(main);
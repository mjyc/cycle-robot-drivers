import xs from 'xstream';
import pairwise from 'xstream/extra/pairwise';
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
  PEND: 'PEND',
  INSTRUCT: 'INSTRUCT',
  WATCH: 'WATCH',
};

const InputType = {
  GOAL: 'GOAL',
  INSTRUCT_DONE: 'INSTRUCT_DONE',
};

const Instruction = {
  FORWARD: 'Let\'s start from looking forward',
  RIGHT: 'and slowly rotate to your right',
  LEFT: 'and now slowly rotate to your left',
  GREAT: 'Great job!',
};

function input(
  start$,
) {
  return xs.merge(
    start$.mapTo({type: InputType.GOAL}),
  );
}

function createTransition() {
  const transitionTable = {
    [State.PEND]: {
      [InputType.GOAL]: (variables) => State.INSTRUCT,
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
  const emissionTable = {};

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

function update(prevState, prevVariables, input) {
  const state = transition(prevState, prevVariables, input);
  const {variables, outputs} = emission(prevState, prevVariables, input);
  console.log('----', prevState, input.type, state);
  return {
    state,
    variables,
    outputs,
  };
}

function main(sources) {
  const input$ = input(
    sources.TabletFace.load.mapTo({}),
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

    outputs$.addListener({
      next: (value) => console.log('outputs', value)
    })

  return {};
}

runRobotProgram(main);

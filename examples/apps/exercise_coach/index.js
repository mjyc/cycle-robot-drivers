import xs from 'xstream';
import {delay} from 'xstream/extra/delay';
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
  speechSynthesisActionSource,
) {
  return xs.merge(
    start$.mapTo({type: InputType.GOAL}),
    speechSynthesisActionSource.result.mapTo({type: InputType.INSTRUCT_DONE}),
  );
}

function createTransition() {
  const transitionTable = {
    [State.PEND]: {
      [InputType.GOAL]: (variables) => State.INSTRUCT,
    },
    [State.INSTRUCT]: {
      [State.INSTRUCT_DONE]: (variables) => State.INSTRUCT,
    }
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
  const maxRep = 2;
  const emissionTable = {
    [State.PEND]: {
      [InputType.GOAL]: (variables, input) => ({
        variables: {instruction: Instruction.FORWARD, rep: 0},
        outputs: {SpeechSynthesisAction: {goal: Instruction.FORWARD}},
      }),
    },
    [State.INSTRUCT]: {
      [InputType.INSTRUCT_DONE]: (variables, input) => {
        if (variables.instruction === Instruction.FORWARD) {  // exercise start
          return {
            variables: {
              instruction: Instruction.RIGHT,
              rep: variables.rep,
            },
            outputs: {
              SpeechSynthesisAction: {goal: Instruction.RIGHT},
            },
          };
        } else if (variables.instruction === Instruction.RIGHT) {  // rep start
          return {
            variables: {
              instruction: Instruction.LEFT,
              rep: variables.rep + 1,
            },
            outputs: {
              SpeechSynthesisAction: {goal: Instruction.LEFT},
            },
          };
        } else if (variables.instruction === Instruction.LEFT) {  // rep end
          if (variables.rep < maxRep) {  // repeat
            return {
              variables: {
                instruction: Instruction.RIGHT,
                rep: variables.rep,
              },
              outputs: {
                SpeechSynthesisAction: {goal: Instruction.RIGHT},
              },
            };
          } else {  // done
            return {
              variables: {
                instruction: Instruction.GREAT,
                rep: variables.rep,
              },
              outputs: {
                SpeechSynthesisAction: {goal: Instruction.GREAT},
              },
            };
          }
        } else if (variables.instruction === Instruction.GREAT) {// exercise end
          return {variables, outputs: {done: true}};
        } else {
          console.warn('Unexpected inputs', State.INSTRUCT, variables, input);  
          return {variables, outputs: null};
        }
      },
    }
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

function update(prevState, prevVariables, input) {
  const state = transition(prevState, prevVariables, input);
  const {variables, outputs} = emission(prevState, prevVariables, input);
  console.log('----', prevState, input.type, state, outputs);
  return {
    state,
    variables,
    outputs,
  };
}

function main(sources) {
  const input$ = input(
    sources.TabletFace.load.mapTo({}),
    sources.SpeechSynthesisAction,
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
  };
}

runRobotProgram(main);

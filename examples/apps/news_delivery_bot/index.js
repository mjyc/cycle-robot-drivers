import xs from 'xstream';
import delay from 'xstream/extra/delay';
import throttle from 'xstream/extra/throttle';
import pairwise from 'xstream/extra/pairwise';
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
  PEND: 'PEND',
  DELIVER: 'DELIVER',
};

const InputType = {
  GOAL: 'GOAL',
  DELIVERY_DONE: 'INSTRUCT_DONE',
};


function input() {
  return xs.never();
}

function createTransition() {
  const transitionTable = {
    // [State.PEND]: {
    //   [InputType.GOAL]: (variables) => State.INSTRUCT,
    // },
    // [State.INSTRUCT]: {
    //   [InputType.INSTRUCT_DONE]: (variables) => {
    //     if (variables.instruction === Instruction.GREAT) {
    //       return State.PEND;
    //     } else {
    //       return State.INSTRUCT;
    //     }
    //   },
    // }
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
    // [State.PEND]: {
    //   [InputType.GOAL]: (variables, input) => ({
    //     variables: {instruction: Instruction.FORWARD, rep: 0},
    //     outputs: {SpeechSynthesisAction: {goal: Instruction.FORWARD}},
    //   }),
    // },
    // [State.INSTRUCT]: {
    //   [InputType.INSTRUCT_DONE]: (variables, input) => {
    //     if (variables.instruction === Instruction.FORWARD) {  // exercise start
    //       return {
    //         variables: {
    //           instruction: Instruction.RIGHT,
    //           rep: variables.rep,
    //         },
    //         outputs: {
    //           SpeechSynthesisAction: {goal: {
    //             goal_id: {stamp: new Date(), id: InputType.REP_END},
    //             goal: Instruction.RIGHT,
    //           }},
    //         },
    //       };
    //     } else if (variables.instruction === Instruction.GREAT) {// exercise end
    //       return {variables, outputs: {done: true}};
    //     }
    //   },
    //   [InputType.REP_END]: (variables, input) => {
    //     if (variables.instruction === Instruction.RIGHT) {
    //       return {
    //         variables: {
    //           instruction: Instruction.LEFT,
    //           rep: variables.rep,
    //         },
    //         outputs: {
    //           SpeechSynthesisAction: {goal: {
    //             goal_id: {stamp: new Date(), id: InputType.REP_END},
    //             goal: Instruction.LEFT,
    //           }},
    //         },
    //       };
    //     } else if (variables.instruction === Instruction.LEFT) {  // rep ended
    //       if (variables.rep < maxRep - 1) {  // repeat
    //         return {
    //           variables: {
    //             instruction: Instruction.RIGHT,
    //             rep: variables.rep + 1,
    //           },
    //           outputs: {
    //             SpeechSynthesisAction: {goal: {
    //               goal_id: {stamp: new Date(), id: InputType.REP_END},
    //               goal: Instruction.RIGHT,
    //             }},
    //           },
    //         };
    //       } else {
    //         return {
    //           variables: {
    //             instruction: Instruction.GREAT,
    //             rep: variables.rep,
    //           },
    //           outputs: {
    //             SpeechSynthesisAction: {goal: Instruction.GREAT},
    //           },
    //         };
    //       }
    //     }
    //   },
    //   [InputType.MOVED_FACE]: (variables, input) => {
    //     if (
    //       variables.instruction === Instruction.RIGHT
    //       || variables.instruction === Instruction.LEFT
    //     ) {
    //       return {
    //         variables,
    //         outputs: {
    //           AudioPlayerAction: {
    //             goal: variables.instruction === Instruction.RIGHT ?
    //               input.value > 0
    //                 ? 'https://raw.githubusercontent.com/aramadia/willow-sound/master/I/IGotIt1.ogg'  // pos
    //                 : 'https://raw.githubusercontent.com/aramadia/willow-sound/master/I/IHey1.ogg'  // neg
    //               : input.value < 0
    //                 ? 'https://raw.githubusercontent.com/aramadia/willow-sound/master/I/IGotIt1.ogg'  // neg
    //                 : 'https://raw.githubusercontent.com/aramadia/willow-sound/master/I/IHey1.ogg'  // pos
    //           }
    //         }
    //       };
    //     }
    //   }
    // },
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
  return {
    state,
    variables,
    outputs,
  };
}

function main(sources) {
  const input$ = input();

  const defaultMachine = {
    state: State.PEND,
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

import xs from 'xstream';
import delay from 'xstream/extra/delay';
import throttle from 'xstream/extra/throttle';
import pairwise from 'xstream/extra/pairwise';
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
  PEND: 'PEND',
  INSTRUCT: 'INSTRUCT',
};

const InputType = {
  GOAL: 'GOAL',
  INSTRUCT_DONE: 'INSTRUCT_DONE',
  REP_END: 'REP_DONE',
};

const Instruction = {
  FORWARD: 'Let\'s start from looking forward',
  RIGHT: 'and slowly rotate to your right',
  LEFT: 'and now slowly rotate to your left',
  GREAT: 'Great job!',
};

function input(
  start$,
  speechSynthesisActionGoal$,
  speechSynthesisActionSource,
  poseDetectionSource,
) {
  const repDuration = 5000;  // ms

  return xs.merge(
    start$.mapTo({type: InputType.GOAL}),
    speechSynthesisActionSource.result.mapTo({type: InputType.INSTRUCT_DONE}),
    speechSynthesisActionGoal$
      .filter(goal => goal === Instruction.RIGHT || goal === Instruction.LEFT)
      .compose(delay(repDuration))
      .mapTo({type: InputType.REP_END}),
  );
}

function createTransition() {
  const transitionTable = {
    [State.PEND]: {
      [InputType.GOAL]: (variables) => State.INSTRUCT,
    },
    [State.INSTRUCT]: {
      [InputType.INSTRUCT_DONE]: (variables) => {
        if (variables.instruction === Instruction.GREAT) {
          return State.PEND;
        } else {
          return State.INSTRUCT;
        }
      },
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
        } else if (variables.instruction === Instruction.GREAT) {// exercise end
          return {variables, outputs: {done: true}};
        } else {
          return {variables, outputs: null};
        }
      },
      [InputType.REP_END]: (variables, input) => {
        if (variables.instruction === Instruction.RIGHT) {
          return {
            variables: {
              instruction: Instruction.LEFT,
              rep: variables.rep,
            },
            outputs: {
              SpeechSynthesisAction: {goal: Instruction.LEFT},
            },
          };
        } else if (variables.instruction === Instruction.LEFT) {  // rep ended
          if (variables.rep < maxRep - 1) {  // repeat
            return {
              variables: {
                instruction: Instruction.RIGHT,
                rep: variables.rep + 1,
              },
              outputs: {
                SpeechSynthesisAction: {goal: Instruction.RIGHT},
              },
            };
          } else {
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
        } else {
          return {variables, outputs: null};
        }
      }
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
    sources.proxies.SpeechSynthesisAction,
    sources.SpeechSynthesisAction,
    sources.PoseDetection.poses,
  );

  // sources.PoseDetection.poses
  //   .filter(poses =>
  //     poses.length === 1
  //     && poses[0].keypoints.filter(kpt => kpt.part === 'nose').length === 1
  //   ).map(poses => {
  //     const nose = poses[0].keypoints.filter(kpt => kpt.part === 'nose')[0];
  //     return {
  //       x: nose.position.x / 640,  // max value of position.x is 640
  //       y: nose.position.y / 480,  // max value of position.y is 480
  //     };
  //   })
  //   .compose(throttle(200))  // 5hz
  //   .compose(pairwise)
  //   .map(([prev, cur]) => {
  //     console.log(cur.x - prev.x, cur.x - prev.x > 0);
  //     return cur;
  //   })
  //   // .addListener({next: value => console.log('poses', value)});
  //   .addListener({next: value => {}});

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

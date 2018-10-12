import xs from 'xstream';
import delay from 'xstream/extra/delay'
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
  PEND: 'PEND',
  SAY: 'SAY',  //_SENTENCE
  LISTEN: 'LISTEN',  //_FOR_RESPONSE
};

const InputType = {
  START: `START`,
  SAY_DONE: `SAY_DONE`,
  VALID_RESPONSE: `VALID_RESPONSE`,
  INVALID_RESPONSE: `INVALID_RESPONSE`,
  DETECTED_FACE: `DETECTED_FACE`,
};

const Sentence = {
  CAREER: 'Is it important that you reach your full career potential?',
  ONLINE: 'Can you see yourself working online?',
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
  [Sentence.CAREER]: {
    [Response.YES]: Sentence.ONLINE,
    [Response.NO]: Sentence.FAMILY,
  },
  [Sentence.ONLINE]: {
    [Response.YES]: Sentence.NOMAD,
    [Response.NO]: Sentence.VACATIONER,
  },
  [Sentence.FAMILY]: {
    [Response.YES]: Sentence.VACATIONER,
    [Response.NO]: Sentence.TRIPS,
  },
  [Sentence.TRIPS]: {
    [Response.YES]: Sentence.VACATIONER,
    [Response.NO]: Sentence.HOME,
  },
  [Sentence.HOME]: {
    [Response.YES]: Sentence.EXPAT,
    [Response.NO]: Sentence.ROUTINE,
  },
  [Sentence.ROUTINE]: {
    [Response.YES]: Sentence.EXPAT,
    [Response.NO]: Sentence.JOB,
  },
  [Sentence.JOB]: {
    [Response.YES]: Sentence.ONLINE,
    [Response.NO]: Sentence.NOMAD,
  },
};

function isQuestion(sentence) {
  return sentence !== Sentence.VACATIONER
    && sentence !== Sentence.EXPAT
    && sentence !== Sentence.NOMAD;
}

function createTransition() {
  const transitionTable = {
    [State.PEND]: {
      [InputType.START]: (variables, input) => ({
        state: State.SAY,
        variables: {question: Sentence.CAREER},
        outputs: {SpeechSynthesisAction: {goal: Sentence.CAREER}},
      }),
    },
    [State.SAY]: {
      [InputType.SAY_DONE]: (variables, input) => isQuestion(variables.question)
        ? {
          state: State.LISTEN,
          variables,
          outputs: {SpeechRecognitionAction: {goal: {}}},
        } : {  // QUIZ_DONE
          state: State.PEND,
          variables,
          outputs: {done: true},
        },
    },
    [State.LISTEN]: {
      [InputType.VALID_RESPONSE]: (variables, input) => ({
        state: State.SAY,
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
        state: State.LISTEN,
        variables,
        outputs: {SpeechRecognitionAction: {goal: {}}},
      }),
      [InputType.DETECTED_FACE]: (variables, input) => ({
        state: State.LISTEN,
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
  };

  return function(state, variables, input) {
    return !transitionTable[state]
      ? {state, variables, outputs: null}
      : !transitionTable[state][input.type]
        ? {state, variables, outputs: null}
        : transitionTable[state][input.type](variables, input);
  }
}

const transition = createTransition();

/**
 * // Example state, variables, input, and outputs
 * const state = State.PEND;
 * const variables = {  
 *   sentence: 'You are a vacationer!',
 * };
 * const input = {
 *   type: InputType.START,
 *   value: null,
 * };
 * const outputs = {
 *   SpeechSynthesisAction: {
 *     goal: 'You are a vacationer!'
 *   },
 *   SpeechRecognitionAction: {
 *     goal: {}
 *   },
 *   TabletFace: {
 *     goal: {
 *       type: 'SET_STATE',
 *       value: {
 *         leftEye: {x: 0.5, y: 0.5},
 *         rightEye: {x: 0.5, y: 0.5},
 *       },
 *     }},
 *   },
 * }
 */

function input(
  start$,
  speechRecognitionActionResult$,
  speechSynthesisActionResult$,
  poses$,
) {
  return xs.merge(
    start$.mapTo({type: InputType.START}),
    speechRecognitionActionResult$
      .filter(result =>
        result.status.status === 'SUCCEEDED'
        && (result.result === Response.YES || result.result === Response.NO)
      ).map(result => ({
        type: InputType.VALID_RESPONSE,
        value: result.result,
      })),
    speechSynthesisActionResult$
      .filter(result => result.status.status === 'SUCCEEDED')
      .mapTo({type: InputType.SAY_DONE}).debug(),
    speechRecognitionActionResult$
      .filter(result =>
        result.status.status !== 'SUCCEEDED'
        || (result.result !== Response.YES && result.result !== Response.NO)
      ).mapTo({type: InputType.INVALID_RESPONSE}),
    poses$
      .filter(poses =>
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
  // return {
  //   SpeechSynthesisAction: xs.of('Hello world!').compose(delay(1000)),
  //   SpeechRecognitionAction: xs.of({}).compose(delay(1000)),
  //   TabletFace: xs.never(),
  // };
}

function main(sources) { 
  const input$ = input(
    sources.TabletFace.load,
    sources.SpeechRecognitionAction.result,
    sources.SpeechSynthesisAction.result,
    sources.PoseDetection.poses,
  );

  const defaultMachine = {
    state: State.PEND,
    variables: {
      sentence: null,
    },
    outputs: null,
  };
  const machine$ = input$.fold((machine, input) => transition(
    machine.state, machine.variables, input
  ), defaultMachine);

  // machine$.addListener({
  //   next: (value) => console.log('machine', value),
  // });

  const sinks = output(machine$);
  return sinks;
}

runRobotProgram(main);
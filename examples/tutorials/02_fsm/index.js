import xs from 'xstream';
import pairwise from 'xstream/extra/pairwise';
import delay from 'xstream/extra/delay';
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
  PEND: 'PEND',
  SAY: 'SAY',  //_SENTENCE
  LISTEN: 'LISTEN',  //_FOR_RESPONSE
  WAIT: 'WAIT',  //_FOR_PERSON
};

const InputType = {
  START: `START`,
  SAY_DONE: `SAY_DONE`,
  VALID_RESPONSE: `VALID_RESPONSE`,
  INVALID_RESPONSE: `INVALID_RESPONSE`,
  DETECTED_FACE: `DETECTED_FACE`,
  FOUND_PERSON: 'FOUND_PERSON',
  LOST_PERSON: 'LOST_PERSON',
  TIMED_OUT: 'TIMED_OUT',
};

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

const Response = {
  YES: 'yes',
  NO: 'no',
}

function input(
  start$,
  speechRecognitionActionResult$,
  speechSynthesisActionResult$,
  poses$,
) {
  const validResponse$ = speechRecognitionActionResult$
    .filter(result =>
      result.status.status === 'SUCCEEDED'
      && (result.result === Response.YES || result.result === Response.NO)
    ).map(result => ({
      type: InputType.VALID_RESPONSE,
      value: result.result,
    }))
  const lostOrFoundPerson$ = poses$
    .map(poses => poses.length)
    .compose(pairwise)
    .filter(([prev, cur]) => prev !== cur)
    .map(([prev, cur]) => {
      if (prev < cur) {
        return {type: InputType.FOUND_PERSON};
      } else if (prev > cur) {
        return {type: InputType.LOST_PERSON};
      }
    });
  return xs.merge(
    start$.mapTo({type: InputType.START}),
    validResponse$,
    speechSynthesisActionResult$
      .filter(result => result.status.status === 'SUCCEEDED')
      .mapTo({type: InputType.SAY_DONE}),
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
    lostOrFoundPerson$,
    xs.merge(
      xs.merge(
        validResponse$,
        lostOrFoundPerson$.filter(input => input.type == InputType.FOUND_PERSON),
      ).mapTo(xs.never()),  // clear previous timeout, see https://github.com/staltz/xstream#flatten
      xs.merge(
        speechSynthesisActionResult$,
        lostOrFoundPerson$.filter(input => input.type == InputType.LOST_PERSON),
      ).mapTo(xs.of({type: InputType.TIMED_OUT}).compose(delay(30000))),  // 30s
    ).flatten().debug(),
  );
}

function createTransition() {
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

  // this transitionTable is a dictionary of dictionaries and returns a function
  //   that takes previous "variables" and "inputValue" and returns a current
  //   FSM status; {state, variable, outputs}
  const transitionTable = {
    [State.PEND]: {
      [InputType.START]: (prevVariables, prevInputValue) => ({
        state: State.SAY,
        variables: {sentence: Sentence.CAREER},
        outputs: {SpeechSynthesisAction: {goal: Sentence.CAREER}},
      }),
    },
    [State.SAY]: {
      [InputType.SAY_DONE]: (prevVariables, prevInputValue) => (
          prevVariables.sentence !== Sentence.VACATIONER
          && prevVariables.sentence !== Sentence.EXPAT
          && prevVariables.sentence !== Sentence.NOMAD
        ) ? {  // SAY_DONE
          state: State.LISTEN,
          variables: prevVariables,
          outputs: {SpeechRecognitionAction: {goal: {}}},
        } : {  // QUIZ_DONE
          state: State.PEND,
          variables: prevVariables,
          outputs: {done: true},
        },
      [InputType.LOST_PERSON]: (prevVariables, prevInputValue) => ({
        state: State.WAIT,
        variables: prevVariables,
        outputs: {
          SpeechSynthesisAction: {goal: null}
        }
      }),
    },
    [State.LISTEN]: {
      [InputType.VALID_RESPONSE]: (prevVariables, prevInputValue) => ({
        state: State.SAY,
        variables: {sentence: flowchart[prevVariables.sentence][prevInputValue]},
        outputs: {
          SpeechSynthesisAction: {
            goal: flowchart[prevVariables.sentence][prevInputValue],
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
      [InputType.INVALID_RESPONSE]: (prevVariables, prevInputValue) => ({
        state: State.LISTEN,
        variables: prevVariables,
        outputs: {SpeechRecognitionAction: {goal: {}}},
      }),
      [InputType.DETECTED_FACE]: (prevVariables, prevInputValue) => ({
        state: State.LISTEN,
        variables: prevVariables,
        outputs: {
          TabletFace: {goal: {
            type: 'SET_STATE',
            value: {
              leftEye: prevInputValue,
              rightEye: prevInputValue,
            },
          }},
        }
      }),
      [InputType.TIMED_OUT]: (prevVariables, prevInputValue) => ({
        state: State.PEND,
        variables: prevVariables,
        outputs: {
          done: true,
          TabletFace: {goal: {
            type: 'SET_STATE',
            value: {
              leftEye: {x: 0.5, y: 0.5},
              rightEye: {x: 0.5, y: 0.5},
            },
          }},
        }
      }),
    },
    [State.WAIT]: {
      [InputType.FOUND_PERSON]: (prevVariables, prevInputValue) => ({
        state: State.SAY,
        variables: prevVariables,
        outputs: {
          SpeechSynthesisAction: {
            goal: prevVariables.sentence,
          },
        }
      }),
      [InputType.TIMED_OUT]: (prevVariables, prevInputValue) => ({
        state: State.PEND,
        variables: prevVariables,
        outputs: {
          done: true,
          TabletFace: {goal: {
            type: 'SET_STATE',
            value: {
              leftEye: {x: 0.5, y: 0.5},
              rightEye: {x: 0.5, y: 0.5},
            },
          }},
        }
      }),
    }
  };

  return function(prevState, prevVariables, prevInput) {
    (prevInput.type !== "DETECTED_FACE") && 
      console.log(prevState, prevVariables, prevInput);
    // excuse me for abusing ternary
    return !transitionTable[prevState]
      ? {state: prevState, variables: prevVariables, outputs: null}
      : !transitionTable[prevState][prevInput.type]
        ? {state: prevState, variables: prevVariables, outputs: null}
        : transitionTable[prevState][prevInput.type](prevVariables, prevInput.value);
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

  const sinks = output(machine$);
  return sinks;
}

runRobotProgram(main);
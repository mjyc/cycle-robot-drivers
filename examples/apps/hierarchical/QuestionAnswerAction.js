import xs from 'xstream';
import {Status, initGoal} from '@cycle-robot-drivers/action';

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
    start$.map(v => ({type: InputType.GOAL, value: initGoal(v)})),
    speechSynthesisActionResult$
      .filter(result => result.status.status === 'SUCCEEDED')
      .mapTo({type: InputType.SAY_DONE}),
    speechRecognitionActionResult$
      .filter(result =>
        result.status.status === 'SUCCEEDED'
      ).map(result => ({
        type: InputType.VALID_RESPONSE,
        value: result.result,
      })),
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
        variables: {
          goal: initGoal(inputValue),
          question: inputValue.goal.question,
          answers: inputValue.goal.answers.map(a => a.toLowerCase()),
        },
        outputs: {SpeechSynthesisAction: {goal: inputValue.goal.question}},
      }),
    },
    [State.SAY]: {
      [InputType.SAY_DONE]: (prevVariables, inputValue) => ({
        state: State.LISTEN,
        variables: prevVariables,
        outputs: {SpeechRecognitionAction: {goal: {}}},
      }),
    },
    [State.LISTEN]: {
      [InputType.VALID_RESPONSE]: (prevVariables, inputValue) => {
        const answer = prevVariables.answers.find(
          a => a.toLowerCase().includes(inputValue.toLowerCase())
        );
        return ({
              state: State.PEND,
              variables: null,
              outputs: {
                result: {
                  status: {
                    goal_id: prevVariables.goal.goal_id,
                    status: (!!answer)
                      ? Status.SUCCEEDED
                      : Status.ABORTED,
                  },
                  result: answer,
                },
              },
            })
      },
      [InputType.INVALID_RESPONSE]: (prevVariables, inputValue) => ({
        state: State.LISTEN,
        variables: prevVariables,
        outputs: {
          result: {
            status: {
              goal_id: prevVariables.goal.goal_id,
              status: Status.ABORTED,
            },
            result: inputValue,
          },
        },
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

export default function QuestionAnswerAction(sources) {
  const input$ = input(
    // sources.goal,
    xs.never(),
    sources.SpeechRecognitionAction.result,
    sources.SpeechSynthesisAction.result,
  );

  const initReducer$ = xs.of(function () {
    return {
      state: State.PEND,
      variables: {
        question: null,
        answers: null,
      },
      outputs: null,
    };
  });

  const transitionReducer$ = input$.map(input => function (prev) {
    return transition(prev.state, prev.variables, input);
  });

  return {
    state: xs.merge(initReducer$, transitionReducer$)
  }
}

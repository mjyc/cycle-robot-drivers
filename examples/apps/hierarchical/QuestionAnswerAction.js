import xs from 'xstream';
import {Status, initGoal} from '@cycle-robot-drivers/action';
import {output} from './utils';

const State = {
  PEND: 'PEND',
  ASK: 'ASK',
  LISTEN: 'LISTEN',
};

const InputType = {
  GOAL: `GOAL`,
  ASK_DONE: `ASK_DONE`,
  VALID_RESPONSE: `VALID_RESPONSE`,
  INVALID_RESPONSE: `INVALID_RESPONSE`,
};

function input(
  goal$,
  speechSynthesisActionResult$,
  speechRecognitionActionResult$,
) {
  return xs.merge(
    goal$.map(v => ({type: InputType.GOAL, value: initGoal(v)})),
    speechSynthesisActionResult$
      .filter(result => result.status.status === 'SUCCEEDED')
      .mapTo({type: InputType.ASK_DONE}),
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

// TODO: add all this in "transition" directly
function createTransition() {
  // usage: transitionTable["state"]["inputType"], then it returns a function
  //   (prevVariables, inputValue) => {state: ..., variables: ..., outputs: ...}
  const transitionTable = {
    [State.PEND]: {
      [InputType.GOAL]: (prevVariables, inputValue) => ({
        state: State.ASK,
        variables: {
          goal: initGoal(inputValue),
          question: inputValue.goal.question,
          answers: inputValue.goal.answers.map(a => a.toLowerCase()),
        },
        outputs: {SpeechSynthesisAction: {goal: inputValue.goal.question}},
      }),
    },
    [State.ASK]: {
      [InputType.ASK_DONE]: (prevVariables, inputValue) => ({
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
        });
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
    // excuse me for abusing ternary
    return !transitionTable[prevState]
      ? {state: prevState, variables: prevVariables, outputs: null}
      : !transitionTable[prevState][input.type]
        ? {state: prevState, variables: prevVariables, outputs: null}
        : transitionTable[prevState][input.type](prevVariables, input.value);
  }
}

const transition = createTransition();

function machine(inputs) {
  const initReducer$ = xs.of(function (prev) {
    if (typeof prev === 'undefined') {
      return {
        state: State.PEND,
        variables: {
          question: null,
          answers: null,
        },
        outputs: null,
      };
    } else {
      return prev;
    }
  });

  const transitionReducer$ = inputs.map(input => function (prev) {
    console.debug('input', input, 'prev', prev);
    return transition(prev.state, prev.variables, input);
  });

  return xs.merge(initReducer$, transitionReducer$);
}

export default function QuestionAnswerAction(sources) {
  const input$ = input(
    sources.goal,
    sources.SpeechSynthesisAction.result,
    sources.SpeechRecognitionAction.result,
  );
  const reducer$ = machine(input$);
  const output$ = output(sources.state.stream);

  return {
    state: reducer$,
    outputs: output$,
  }
}

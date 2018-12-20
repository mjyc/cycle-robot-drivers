import xs from 'xstream';
import {Status, initGoal} from '@cycle-robot-drivers/action';

const State = {
  PEND: 'PEND',
  ASK: 'ASK',
  LISTEN: 'LISTEN',
};

const InputType = {
  GOAL: 'GOAL',
  ASK_DONE: 'ASK_DONE',
  VALID_RESPONSE: 'VALID_RESPONSE',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
};

function input(
  goal$,
  speechSynthesisAction,
  speechRecognitionAction,
) {
  return xs.merge(
    goal$.map(g => ({type: InputType.GOAL, value: initGoal(g)})),
    speechSynthesisAction.result
      .filter(result => result.status.status === 'SUCCEEDED')
      .mapTo({type: InputType.ASK_DONE}),
    speechRecognitionAction.result
      .filter(result =>
        result.status.status === 'SUCCEEDED'
      ).map(result => ({
        type: InputType.VALID_RESPONSE,
        value: result.result,
      })),
    speechRecognitionAction.result
      .filter(result =>
        result.status.status !== 'SUCCEEDED'
      ).mapTo({type: InputType.INVALID_RESPONSE}),
  );
}

function reducer(input$) {
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

  const transitionReducer$ = input$.map(input => function (prev) {
    console.debug('input', input, 'prev', prev);
    if (prev.state === State.PEND) {
      if (input.type === InputType.GOAL) {
        return {
          state: State.ASK,
          variables: {
            goal: input.value,
            question: input.value.goal.question,
            answers: input.value.goal.answers.map(a => a.toLowerCase()),
          },
          outputs: {SpeechSynthesisAction: {goal: input.value.goal.question}},
        };
      }
    } else if (prev.state === State.ASK) {
      if (input.type === InputType.ASK_DONE) {
        return {
          state: State.LISTEN,
          variables: prev.variables,
          outputs: {SpeechRecognitionAction: {goal: {}}},
        };
      }
    } else if (prev.state === State.LISTEN) {
      if (input.type === InputType.VALID_RESPONSE) {
        const answer = prev.variables.answers.find(
          a => a.toLowerCase().includes(input.value))
        const valid = '' !== input.value && !!answer;
        return ({
          state: State.PEND,
          variables: null,
          outputs: {
            result: {
              status: {
                goal_id: prev.variables.goal.goal_id,
                status: valid ? Status.SUCCEEDED : Status.ABORTED,
              },
              result: valid ? answer : null,
            },
          },
        });
      } else if (input.type === InputType.INVALID_RESPONSE) {
        return {
          state: State.LISTEN,
          variables: prev.variables,
          outputs: {
            result: {
              status: {
                goal_id: prev.variables.goal.goal_id,
                status: Status.ABORTED,
              },
              result: null,
            },
          },
        };
      }
    };
    return prev;
  });

  return xs.merge(initReducer$, transitionReducer$);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(m => !!m.outputs)
    .map(m => m.outputs);
  return {
    SpeechSynthesisAction: outputs$
      .filter(o => !!o.SpeechSynthesisAction)
      .map(o => o.SpeechSynthesisAction.goal),
    SpeechRecognitionAction: outputs$
      .filter(o => !!o.SpeechRecognitionAction)
      .map(o => o.SpeechRecognitionAction.goal),
  };
}

export default function QuestionAnswerAction(sources) {
  const reducerState$ = sources.state.stream;
  const input$ = input(
    sources.goal,
    sources.SpeechSynthesisAction,
    sources.SpeechRecognitionAction,
  );
  const reducer$ = reducer(input$);
  const outputs = output(reducerState$);

  return {
    state: reducer$,
    outputs,
  }
}

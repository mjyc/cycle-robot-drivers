import xs from 'xstream';
import {Stream} from 'xstream';
import {StateSource, Reducer} from '@cycle/state';
import {Status, Result} from '@cycle-robot-drivers/action';

enum FSMState {
  PEND = 'PEND',
  ASK = 'ASK',
  LISTEN = 'LISTEN',
}

enum InputType {
  GOAL = 'GOAL',
  ASK_DONE = 'ASK_DONE',
  VALID_RESPONSE = 'VALID_RESPONSE',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
}

export type ReducerState = {  // TODO: move it to ... utils or types
  state: FSMState,  // TODO: make it a variable
  variables: any,  // TODO: define its own type & make it a variable
  outputs: any,  // TODO: define its own type & make it a variable
};

export type Sources = {  // TODO: define RobotProgramSource in run or keep it in utils
  goal: Stream<any>,
  SpeechSynthesisAction: {result: Stream<Result>},
  SpeechRecognitionAction: {result: Stream<Result>},
  state: StateSource<ReducerState>,
};

export type Sinks = {  // TODO: define RobotProgramSink in run or keep it in utils
  outputs: {
    SpeechSynthesisAction: Stream<any>,
    SpeechRecognitionAction: Stream<any>,
  },
  state: Stream<Reducer<ReducerState>>,
};

function input(
  goal$: Stream<any>,
  speechSynthesisAction,
  speechRecognitionAction,
) {
  return xs.merge(
    goal$.map(g => ({type: InputType.GOAL, value: g})),
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
        state: FSMState.PEND,
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
    if (prev.state === FSMState.PEND) {
      if (input.type === InputType.GOAL) {
        return {
          state: FSMState.ASK,
          variables: {
            goal: input.value,
            question: input.value.goal.question,
            answers: input.value.goal.answers.map(a => a.toLowerCase()),
          },
          outputs: {SpeechSynthesisAction: {goal: input.value.goal.question}},
        };
      }
    } else if (prev.state === FSMState.ASK) {
      if (input.type === InputType.ASK_DONE) {
        return {
          state: FSMState.LISTEN,
          variables: prev.variables,
          outputs: {SpeechRecognitionAction: {goal: {}}},
        };
      }
    } else if (prev.state === FSMState.LISTEN) {
      if (input.type === InputType.VALID_RESPONSE) {
        const answer = prev.variables.answers.find(
          a => a.toLowerCase().includes(input.value))
        const valid = '' !== input.value && !!answer;
        return ({
          state: FSMState.PEND,
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
          state: FSMState.LISTEN,
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
    TabletFace: outputs$
      .filter(o => !!o.TabletFace)
      .map(o => o.TabletFace.goal),
  };
}

export default function QuestionAnswerAction(sources: Sources): Sinks {
  const reducerState$ = sources.state.stream;
  const input$ = input(
    sources.goal,
    sources.SpeechSynthesisAction,
    sources.SpeechRecognitionAction,
  );
  const reducer$ = reducer(input$) as Stream<Reducer<ReducerState>>;
  const outputs = output(reducerState$);

  return {
    state: reducer$,
    outputs,
  }
}

import xs from 'xstream';
import {Stream} from 'xstream';
import {StateSource, Reducer as StateReducer} from '@cycle/state';
import {Goal, Status, Result} from '@cycle-robot-drivers/action';
import {ReducerStateTemplate} from './types';

export enum FSMState {
  PEND = 'PEND',
  ASK = 'ASK',
  LISTEN = 'LISTEN',
}

export enum FSMInputType {
  GOAL = 'GOAL',
  ASK_DONE = 'ASK_DONE',
  VALID_RESPONSE = 'VALID_RESPONSE',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
}

export type FSMVariables = {
  goal: Goal,
  question: string,
  answers: string[],
}

export interface FSMOutputs {
  SpeechSynthesisAction: Stream<any>,
  SpeechRecognitionAction: Stream<any>,
}


export type ReducerState = ReducerStateTemplate<FSMState, FSMVariables, any>;

export type Reducer = StateReducer<ReducerState>;


export interface Sources {
  goal: Stream<any>,
  SpeechSynthesisAction: {result: Stream<Result>},
  SpeechRecognitionAction: {result: Stream<Result>},
  state: StateSource<ReducerState>,
}

export interface Sinks {
  outputs: FSMOutputs,
  state: Stream<Reducer>,
}


function input(
  goal$: Stream<any>,
  speechSynthesisAction,
  speechRecognitionAction,
) {
  return xs.merge(
    goal$.map(g => ({type: FSMInputType.GOAL, value: g})),
    speechSynthesisAction.result
      .filter(result => result.status.status === 'SUCCEEDED')
      .mapTo({type: FSMInputType.ASK_DONE}),
    speechRecognitionAction.result
      .filter(result =>
        result.status.status === 'SUCCEEDED'
      ).map(result => ({
        type: FSMInputType.VALID_RESPONSE,
        value: result.result,
      })),
    speechRecognitionAction.result
      .filter(result =>
        result.status.status !== 'SUCCEEDED'
      ).mapTo({type: FSMInputType.INVALID_RESPONSE}),
  );
}

function reducer(input$) {
  const initReducer$: Stream<Reducer> = xs.of(function (prev) {
    if (typeof prev === 'undefined') {
      return {
        state: FSMState.PEND,
        variables: {
          goal: null,
          question: null,
          answers: null,
        },
        outputs: null,
      };
    } else {
      return prev;
    }
  });

  const transitionReducer$: Stream<Reducer> = input$.map(input => function (prev) {
    console.debug('input', input, 'prev', prev);
    if (prev.state === FSMState.PEND) {
      if (input.type === FSMInputType.GOAL) {
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
      if (input.type === FSMInputType.ASK_DONE) {
        return {
          state: FSMState.LISTEN,
          variables: prev.variables,
          outputs: {SpeechRecognitionAction: {goal: {}}},
        };
      }
    } else if (prev.state === FSMState.LISTEN) {
      if (input.type === FSMInputType.VALID_RESPONSE) {
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
      } else if (input.type === FSMInputType.INVALID_RESPONSE) {
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
  };
}

export default function QuestionAnswerAction(sources: Sources): Sinks {
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

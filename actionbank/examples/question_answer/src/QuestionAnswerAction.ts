import xs from 'xstream';
import {Stream} from 'xstream';
import {StateSource, Reducer} from '@cycle/state';
import {GoalID, Status, Result, initGoal} from '@cycle-robot-drivers/action';
import {FSMReducerState} from './types';

// FSM types
export enum S {
  PEND = 'PEND',
  ASK = 'ASK',
  LISTEN = 'LISTEN',
}

export enum SIGType {
  GOAL = 'GOAL',
  ASK_DONE = 'ASK_DONE',
  VALID_RESPONSE = 'VALID_RESPONSE',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
}

export interface SIG {
  type: SIGType,
  value?: any,
}

export type V = {
  goal_id: GoalID,
  question: string,
  answers: string[],
}

export interface LAM {
  result?: Result,
  SpeechSynthesisAction?: {goal: any},
  SpeechRecognitionAction?: {goal: any},
}

// Reducer types
export type State = FSMReducerState<S, V, LAM>;

// Component types
export interface Sources {
  goal: Stream<any>,
  SpeechSynthesisAction: {result: Stream<Result>},
  SpeechRecognitionAction: {result: Stream<Result>},
  state: StateSource<State>,
}


function input(
  goal$: Stream<any>,
  speechSynthesisResult: Stream<Result>,
  speechRecognitionResult: Stream<Result>,
): Stream<SIG> {
  return xs.merge(
    goal$.map(g => ({type: SIGType.GOAL, value: initGoal(g)})),
    speechSynthesisResult
      .filter(result => result.status.status === 'SUCCEEDED')
      .mapTo({type: SIGType.ASK_DONE}),
    speechRecognitionResult
      .filter(result =>
        result.status.status === 'SUCCEEDED'
      ).map(result => ({
        type: SIGType.VALID_RESPONSE,
        value: result.result,
      })),
    speechRecognitionResult
      .filter(result =>
        result.status.status !== 'SUCCEEDED'
      ).mapTo({type: SIGType.INVALID_RESPONSE}),
  );
}

function reducer(input$: Stream<SIG>): Stream<Reducer<State>> {
  const initReducer$: Stream<Reducer<State>> = xs.of((prev?: State): State => {
    if (typeof prev === 'undefined') {
      return {
        state: S.PEND,
        variables: null,
        outputs: null,
      };
    } else {
      return prev;
    }
  });

  const transitionReducer$: Stream<Reducer<State>> = input$.map((input: SIG) => (prev: State): State => {
    console.debug('input', input, 'prev', prev);
    if (prev.state === S.PEND && input.type === SIGType.GOAL) {
      return {
        state: S.ASK,
        variables: {
          goal_id: input.value.goal_id,
          question: input.value.goal.question,
          answers: input.value.goal.answers,
        },
        outputs: {SpeechSynthesisAction: {goal: input.value.goal.question}},
      };
    } else if (prev.state === S.ASK && input.type === SIGType.ASK_DONE) {
      return {
        state: S.LISTEN,
        variables: prev.variables,
        outputs: {SpeechRecognitionAction: {goal: {}}},
      };
    } else if (prev.state === S.LISTEN && input.type === SIGType.VALID_RESPONSE) {
      // this matching logic must be delegated to the recognizer
      const matched = prev.variables.answers
        .filter(a => a.toLowerCase() === input.value);
      return ({
        state: S.PEND,
        variables: null,
        outputs: {
          result: {
            status: {
              goal_id: prev.variables.goal_id,
              status: matched.length > 0 ? Status.SUCCEEDED : Status.ABORTED,
            },
            result: matched.length > 0
              ? matched[0]  // break the tie here
              : null,
          },
        },
      });
    } else if (prev.state === S.LISTEN && input.type === SIGType.INVALID_RESPONSE) {
      return {
        state: S.PEND,
        variables: null,
        outputs: {
          result: {
            status: {
              goal_id: prev.variables.goal_id,
              status: Status.ABORTED,
            },
            result: null,
          },
        },
      };
    };
    return prev;
  });

  return xs.merge(initReducer$, transitionReducer$);
}

function output(reducerState$: Stream<State>) {
  const outputs$ = reducerState$
    .filter(m => !!m.outputs)
    .map(m => m.outputs);
  return {
    result: outputs$
      .filter(o => !!o.result)
      .map(o => o.result),
    SpeechSynthesisAction: outputs$
      .filter(o => !!o.SpeechSynthesisAction)
      .map(o => o.SpeechSynthesisAction.goal),
    SpeechRecognitionAction: outputs$
      .filter(o => !!o.SpeechRecognitionAction)
      .map(o => o.SpeechRecognitionAction.goal),
  };
}

export function QuestionAnswerAction(sources: Sources) {
  const reducerState$ = sources.state.stream;
  const input$ = input(
    sources.goal,
    sources.SpeechSynthesisAction.result,
    sources.SpeechRecognitionAction.result,
  );
  const reducer$ = reducer(input$);
  const outputs = output(reducerState$);
  return {
    ...outputs,
    state: reducer$,
  };
}

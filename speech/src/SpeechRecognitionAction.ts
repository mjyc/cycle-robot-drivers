import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {Stream} from 'xstream';
import {
  GoalID, Goal, Status, GoalStatus, Result,
  ActionSources, ActionSinks,
  EventSource,
  isEqualGoalStatus
} from '@cycle-robot-drivers/action';
import {SpeechRecognitionArg} from './makeSpeechRecognitionDriver';


enum State {
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  PREEMPTING = 'PREEMPTING',
}

type Variables = {
  goal_id: GoalID,
  transcript: string,
  error: string,
  newGoal: Goal,
};

type Outputs = {
  SpeechRecognition: SpeechRecognitionArg,
};

type ReducerState = {
  state: State,
  variables: Variables,
  outputs: Outputs,
  result: Result,
};

type Reducer = (prev?: ReducerState) => ReducerState | undefined;

enum InputType {
  GOAL = 'GOAL',
  CANCEL = 'CANCEL',
  START = 'START',
  END = 'END',
  ERROR = 'ERROR',
  RESULT = 'RESULT',
}

type Input = {
  type: InputType,
  value: Goal | SpeechRecognitionEvent | SpeechRecognitionError,
};

function input(
  goal$: Stream<Goal>,
  cancel$: Stream<GoalID>,
  startEvent$: Stream<any>,
  endEvent$: Stream<any>,
  errorEvent$: Stream<any>,
  resultEvent$: Stream<any>
) {
  return xs.merge(
    goal$.map(goal => ({
      type: InputType.GOAL,
      value: goal,
    })),
    cancel$.mapTo({type: InputType.CANCEL, value: null}),
    startEvent$.mapTo({type: InputType.START, value: null}),
    endEvent$.mapTo({type: InputType.END, value: null}),
    errorEvent$.map(event => ({type: InputType.ERROR, value: event})),
    resultEvent$.map(event => ({type: InputType.RESULT, value: event})),
  );
}

const transitionTable = {
  [State.DONE]: {
    [InputType.GOAL]: State.RUNNING,
  },
  [State.RUNNING]: {
    [InputType.GOAL]: State.PREEMPTING,
    [InputType.CANCEL]: State.PREEMPTING,
    [InputType.START]: State.RUNNING,
    [InputType.END]: State.DONE,
  },
  [State.PREEMPTING]: {
    [InputType.END]: State.DONE,
  }
};

function transition(
  prevState: State, prevVariables: Variables, input: Input
): ReducerState {
  const states = transitionTable[prevState];
  if (!states) {
    throw new Error(`Invalid prevState="${prevState}"`);
  }

  let state = states[input.type];
  if (!state) {
    console.debug(`Undefined transition for "${prevState}" "${input.type}"; `
      + `set state to prevState`);
    state = prevState;
  }

  if (prevState === State.DONE && state === State.RUNNING) {
    // Start a new goal
    const goal = (input.value as Goal);
    return {
      state,
      variables: {
        goal_id: goal.goal_id,
        transcript: null,
        error: null,
        newGoal: null,
      },
      outputs: {
        SpeechRecognition: goal.goal
      },
      result: null,
    };
  } else if (
    prevState === State.RUNNING && state === State.RUNNING
  ) {
    if (input.type === InputType.RESULT) {
      const event = (input.value as SpeechRecognitionEvent);
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      return {
        state,
        variables: {
          ...prevVariables,
          transcript,
        },
        outputs: null,
        result: null,
      };
    } else if (input.type === InputType.ERROR) {
      const event = (input.value as SpeechRecognitionError);
      return {
        state,
        variables: {
          ...prevVariables,
          error: event.error,  // https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionError/error#Value
        },
        outputs: null,
        result: null,
      };
    }
  } else if (state === State.DONE) {
    if (prevState === State.RUNNING || prevState === State.PREEMPTING) {
      // Stop the current goal and start the queued new goal
      const newGoal = prevVariables.newGoal;
      return {
        state: !!newGoal ? State.RUNNING : state,
        variables: {
          goal_id: !!newGoal ? newGoal.goal_id : null,
          transcript: null,
          error: null,
          newGoal: null,
        },
        outputs: !!newGoal ? {
          SpeechRecognition: newGoal.goal,
        } : null,
        result: {
          status: {
            goal_id: prevVariables.goal_id,
            status: (prevState === State.RUNNING && !prevVariables.error)
              ? Status.SUCCEEDED
              : (!!prevVariables.error) ? Status.ABORTED : Status.PREEMPTED,
          },
          result: (prevState === State.RUNNING && !prevVariables.error)
            ? (prevVariables.transcript || '')  // '' for non-speech inputs
            : null,  // null for aborted & preempted
        },
      };
    }
  } else if (
    (prevState === State.RUNNING || prevState === State.PREEMPTING)
    && state === State.PREEMPTING
  ) {
    if (input.type === InputType.GOAL || input.type === InputType.CANCEL) {
      // Start stopping the current goal and queue a new goal if received one
      return {
        state,
        variables: {
          ...prevVariables,
          newGoal: input.type === InputType.GOAL ? input.value as Goal : null,
        },
        outputs: prevState === State.RUNNING ? {
          SpeechRecognition: null,
        } : null,
        result: null,
      }
    }
  }

  return {
    state: prevState,
    variables: prevVariables,
    outputs: null,
    result: null,
  };
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev: ReducerState): ReducerState {
      return {
        state: State.DONE,
        variables: {
          goal_id: null,
          transcript: null,
          error: null,
          newGoal: null,
        },
        outputs: null,
        result: null,
      }
    }
  );

  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev: ReducerState): ReducerState {
      return transition(prev.state, prev.variables, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

export function status(reducerState$): Stream<GoalStatus> {
  const active$: Stream<GoalStatus> = reducerState$
    .filter(rs => rs.state === State.RUNNING)
    .map(rs => ({goal_id: rs.variables.goal_id, status: Status.ACTIVE}));
  const done$: Stream<GoalStatus> = reducerState$
    .filter(rs => !!rs.result)
    .map(rs => rs.result.status);
  const initGoalStatus: GoalStatus = {
    goal_id: null,
    status: Status.SUCCEEDED,
  };
  return xs.merge(active$, done$)
    .compose(dropRepeats(isEqualGoalStatus))
    .startWith(initGoalStatus);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(rs => !!rs.outputs)
    .map(rs => rs.outputs);
  return {
    SpeechRecognition: outputs$
      .map(o => o.SpeechRecognition)
  };
};

export interface Sources extends ActionSources {
  SpeechRecognition: EventSource,
}

export interface Sinks extends ActionSinks {
  SpeechRecognition: Stream<SpeechRecognitionArg>,
};

/**
 * Web Speech API's [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
 * action component.
 *
 * @param sources
 *
 *   * goal: a stream of `null` (as "cancel") or `SpeechRecognition`
 *     properties (as "goal").
 *   * SpeechSynthesis: `EventSource` for `start`, `end`, `error`, `result`
 *     events.
 *
 * @return sinks
 *
 *   * output: a stream for the SpeechRecognition driver input.
 *   * result: a stream of action results. `result.result` is a transcript from
 *     the recognition; it will be `''` for non-speech inputs.
 *
 */
export function SpeechRecognitionAction(sources: Sources): any {
  const input$ = input(
    sources.goal,
    sources.cancel,
    sources.SpeechRecognition.events('start'),
    sources.SpeechRecognition.events('end'),
    sources.SpeechRecognition.events('error'),
    sources.SpeechRecognition.events('result'),
  );
  const reducer = transitionReducer(input$);

  const result$ = sources.state.stream.map(rs => rs.result).filter(rs => !!rs);
  const status$ = status(sources.state.stream);
  const outputs = output(sources.state.stream);
  return {
    state: reducer,
    status: status$,
    result: result$,
    ...outputs
  };
}

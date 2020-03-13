import xs from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import { Stream } from "xstream";
import {
  GoalID,
  Goal,
  Status,
  GoalStatus,
  Result,
  ActionSources,
  ActionSinks,
  EventSource,
  generateGoalStatus,
  isEqualGoalStatus,
  isEqualGoalID,
  initGoal
} from "@cycle-robot-drivers/action";
import { SpeechRecognitionArg } from "./makeSpeechRecognitionDriver";

enum State {
  RUN = "RUN",
  WAIT = "WAIT",
  PREEMPT = "PREEMPT"
}

type Variables = {
  goal_id: GoalID;
  transcript: string;
  error: string;
  newGoal: Goal;
};

type Outputs = {
  SpeechRecognition: SpeechRecognitionArg;
  result: Result;
};

type ReducerState = {
  state: State;
  variables: Variables;
  outputs: Outputs;
};

type Reducer = (prev?: ReducerState) => ReducerState | undefined;

enum InputType {
  GOAL = "GOAL",
  CANCEL = "CANCEL",
  START = "START",
  END = "END",
  ERROR = "ERROR",
  RESULT = "RESULT"
}

type Input = {
  type: InputType;
  value: Goal | GoalID | SpeechRecognitionEvent | SpeechRecognitionError;
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
    goal$
      .filter(g => typeof g !== "undefined" && g !== null)
      .map(g => ({
        type: InputType.GOAL,
        value: initGoal(g)
      })),
    cancel$.map(val => ({ type: InputType.CANCEL, value: val })),
    startEvent$.mapTo({ type: InputType.START, value: null }),
    endEvent$.mapTo({ type: InputType.END, value: null }),
    errorEvent$.map(event => ({ type: InputType.ERROR, value: event })),
    resultEvent$.map(event => ({ type: InputType.RESULT, value: event }))
  );
}

const transitionTable = {
  [State.WAIT]: {
    [InputType.GOAL]: State.RUN
  },
  [State.RUN]: {
    [InputType.GOAL]: State.PREEMPT,
    [InputType.CANCEL]: State.PREEMPT,
    [InputType.START]: State.RUN,
    [InputType.END]: State.WAIT
  },
  [State.PREEMPT]: {
    [InputType.END]: State.WAIT
  }
};

function transition(
  prevState: State,
  prevVariables: Variables,
  input: Input
): ReducerState {
  const states = transitionTable[prevState];
  if (!states) {
    throw new Error(`Invalid prevState="${prevState}"`);
  }

  let state = states[input.type];
  if (!state) {
    console.debug(
      `Undefined transition for "${prevState}" "${input.type}"; ` +
        `set state to prevState`
    );
    state = prevState;
  }

  if (prevState === State.WAIT && state === State.RUN) {
    // Start a new goal
    const goal = input.value as Goal;
    return {
      state,
      variables: {
        goal_id: goal.goal_id,
        transcript: null,
        error: null,
        newGoal: null
      },
      outputs: {
        SpeechRecognition: goal.goal,
        result: null
      }
    };
  } else if (prevState === State.RUN && state === State.RUN) {
    if (input.type === InputType.RESULT) {
      const event = input.value as SpeechRecognitionEvent;
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      return {
        state,
        variables: {
          ...prevVariables,
          transcript
        },
        outputs: null
      };
    } else if (input.type === InputType.ERROR) {
      const event = input.value as SpeechRecognitionError;
      return {
        state,
        variables: {
          ...prevVariables,
          error: event.error // https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognitionError/error#Value
        },
        outputs: null
      };
    }
  } else if (state === State.WAIT) {
    if (prevState === State.RUN || prevState === State.PREEMPT) {
      // Stop the current goal and start the queued new goal
      const newGoal = prevVariables.newGoal;
      return {
        state: !!newGoal ? State.RUN : state,
        variables: {
          goal_id: !!newGoal ? newGoal.goal_id : null,
          transcript: null,
          error: null,
          newGoal: null
        },
        outputs: {
          SpeechRecognition: !!newGoal ? newGoal.goal : undefined,
          result: {
            status: {
              goal_id: prevVariables.goal_id,
              status:
                prevState === State.RUN && !prevVariables.error
                  ? Status.SUCCEEDED
                  : !!prevVariables.error
                  ? Status.ABORTED
                  : Status.PREEMPTED
            },
            result:
              prevState === State.RUN && !prevVariables.error
                ? prevVariables.transcript || "" // '' for non-speech inputs
                : null // null for aborted & preempted
          }
        }
      };
    }
  } else if (
    (prevState === State.RUN || prevState === State.PREEMPT) &&
    state === State.PREEMPT
  ) {
    if (
      input.type === InputType.GOAL ||
      (input.type === InputType.CANCEL &&
        (input.value === null ||
          isEqualGoalID(input.value as GoalID, prevVariables.goal_id)))
    ) {
      // Start stopping the current goal and queue a new goal if received one
      return {
        state,
        variables: {
          ...prevVariables,
          newGoal: input.type === InputType.GOAL ? (input.value as Goal) : null
        },
        outputs:
          prevState === State.RUN
            ? {
                SpeechRecognition: null,
                result: null
              }
            : null
      };
    }
  }

  return {
    state: prevState,
    variables: prevVariables,
    outputs: null
  };
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(function initReducer(
    prev: ReducerState
  ): ReducerState {
    return {
      state: State.WAIT,
      variables: {
        goal_id: null,
        transcript: null,
        error: null,
        newGoal: null
      },
      outputs: null
    };
  });

  const inputReducer$: Stream<Reducer> = input$.map(
    input =>
      function inputReducer(prev: ReducerState): ReducerState {
        return transition(prev.state, prev.variables, input);
      }
  );

  return xs.merge(initReducer$, inputReducer$);
}

export function status(reducerState$): Stream<GoalStatus> {
  const done$: Stream<GoalStatus> = reducerState$
    .filter(rs => !!rs.outputs && !!rs.outputs.result)
    .map(rs => rs.outputs.result.status);
  const active$: Stream<GoalStatus> = reducerState$
    .filter(rs => rs.state === State.RUN)
    .map(rs => ({ goal_id: rs.variables.goal_id, status: Status.ACTIVE }));
  const initGoalStatus = generateGoalStatus({ status: Status.SUCCEEDED });
  return xs
    .merge(done$, active$)
    .compose(dropRepeats(isEqualGoalStatus))
    .startWith(initGoalStatus);
}

export function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(rs => !!rs.outputs)
    .map(rs => rs.outputs);
  return {
    result: outputs$.filter(o => !!o.result).map(o => o.result),
    SpeechRecognition: outputs$
      .filter(o => typeof o.SpeechRecognition !== "undefined")
      .map(o => o.SpeechRecognition)
  };
}

export interface Sources extends ActionSources {
  SpeechRecognition: EventSource;
}

export interface Sinks extends ActionSinks {
  SpeechRecognition: Stream<SpeechRecognitionArg>;
}

/**
 * Web Speech API's [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
 * action component.
 *
 * @param sources
 *
 *   * goal: a stream `SpeechRecognition` properties.
 *   * cancel: a stream of `GoalID`.
 *   * SpeechSynthesis: `EventSource` for `start`, `end`, `error`, `result`
 *     events.
 *
 * @return sinks
 *
 *   * state: a reducer stream.
 *   * output: a stream for the SpeechRecognition driver input.
 *   * result: a stream of action results. `result.result` is a transcript from
 *     the recognition; it will be `''` for non-speech inputs.
 *
 */
export function SpeechRecognitionAction(sources: Sources): Sinks {
  const input$ = input(
    sources.goal || xs.never(),
    sources.cancel || xs.never(),
    sources.SpeechRecognition.events("start"),
    sources.SpeechRecognition.events("end"),
    sources.SpeechRecognition.events("error"),
    sources.SpeechRecognition.events("result")
  );
  const reducer = transitionReducer(input$);
  const status$ = status(sources.state.stream);
  const outputs = output(sources.state.stream);
  return {
    state: reducer,
    status: status$,
    ...outputs
  };
}

export let SpeechRecognitionActionFncs = {
  input,
  transitionReducer,
  status,
  output
};

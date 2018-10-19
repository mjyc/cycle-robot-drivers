import xs from 'xstream';
import {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {
  GoalID, Goal, Status, Result, EventSource, initGoal,
} from '@cycle-robot-drivers/action';


enum State {
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  PREEMPTING = 'PREEMPTING',
}

type Variables = {
  goal_id: GoalID,
  newGoal: Goal,
};

type Outputs = {
  args: any,
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
}

type Input = {
  type: InputType,
  value: Goal,
};


function input(
  goal$: Stream<any>, startEvent$: Stream<any>, endEvent$: Stream<any>
) {
  return xs.merge(
    goal$.filter(goal => typeof goal !== 'undefined').map(goal => {
      if (goal === null) {
        return {
          type: InputType.CANCEL,
          value: null,  // means "cancel"
        };
      } else {
        const value = !!(goal as any).goal_id ? goal : initGoal(goal);
        return {
          type: InputType.GOAL,
          value: typeof value.goal === 'string'
            ? {
              goal_id: value.goal_id,
              goal: {text: value.goal},
            } : value,
        };
      }
    }),
    startEvent$.mapTo({type: InputType.START, value: null}),
    endEvent$.mapTo({type: InputType.END, value: null}),
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
    const goal = input.value;
    return {
      state,
      variables: {
        goal_id: goal.goal_id,
        newGoal: null,
      },
      outputs: {
        args: goal.goal
      },
      result: null,
    };
  } else if (state === State.DONE) {
    if (prevState === State.RUNNING || prevState === State.PREEMPTING) {
      // Stop the current goal and start the queued new goal
      const newGoal = prevVariables.newGoal;
      return {
        state: !!newGoal ? State.RUNNING : state,
        variables: {
          goal_id: !!newGoal ? newGoal.goal_id : null,
          newGoal: null,
        },
        outputs: !!newGoal ? {
          args: newGoal.goal,
        } : null,
        result: {
          status: {
            goal_id: prevVariables.goal_id,
            status: prevState === State.RUNNING
              ? Status.SUCCEEDED : Status.PREEMPTED,
          },
          result: null,
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
        outputs: {
          args: null,
        },
        result: null,
      }
    }
    if (input.type === InputType.START) {
      return {
        state: state,
        variables: prevVariables,
        outputs: {
          args: null,
        },
        result: null,
      };
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
  const initReducer$ = xs.of(
    function initReducer(prev) {
      return {
        state: State.DONE,
        variables: {
          goal_id: null,
          newGoal: null,
        },
        outputs: null,
        result: null,
      }
    }
  );

  const inputReducer$ = input$
    .map(input => function inputReducer(prev) {
      return transition(prev.state, prev.variables, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

/**
 * Web Speech API's [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
 * action component.
 * 
 * @param sources
 * 
 *   * goal: a stream of `null` (as "cancel") or `SpeechSynthesisUtterance`
 *     properties (as "goal").
 *   * SpeechSynthesis: `EventSource` for `start` and `end` events.
 * 
 * @return sinks
 * 
 *   * output: a stream for the SpeechSynthesis driver input.
 *   * result: a stream of action results.
 * 
 */
export function SpeechSynthesisAction(sources: {
  goal: any,
  SpeechSynthesis: EventSource,
}): {
  output: any,
  result: any,
} {
  const input$ = input(
    xs.fromObservable(sources.goal),
    xs.fromObservable(sources.SpeechSynthesis.events('start')),
    xs.fromObservable(sources.SpeechSynthesis.events('end')),
  );

  const state$ = transitionReducer(input$)
    .fold((state: ReducerState, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null"
  const outputs$ = state$.map(state => state.outputs)
    .filter(outputs => !!outputs);
  const result$ = state$.map(state => state.result).filter(result => !!result);

  return {
    output: adapt(outputs$.map(outputs => outputs.args)),
    result: adapt(result$),
  };
}

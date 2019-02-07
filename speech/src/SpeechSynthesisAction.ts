import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {Stream} from 'xstream';
import {
  GoalID, Goal, Status, GoalStatus, Result,
  ActionSources, ActionSinks,
  EventSource,
  isEqualGoalStatus
} from '@cycle-robot-drivers/action';
import {UtteranceArg} from './makeSpeechSynthesisDriver';


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
  SpeechSynthesis: UtteranceArg,
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
  goal$: Stream<Goal>,
  cancel$: Stream<GoalID>,
  startEvent$: Stream<any>,
  endEvent$: Stream<any>,
) {
  return xs.merge(
    goal$.map(goal => {
      return {
        type: InputType.GOAL,
        value: typeof goal.goal === 'string'
          ? {
            goal_id: goal.goal_id,
            goal: {text: goal.goal},
          } : goal,
      };
    }),
    cancel$.mapTo({type: InputType.CANCEL, value: null}),
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
        SpeechSynthesis: goal.goal
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
          SpeechSynthesis: newGoal.goal,
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
          SpeechSynthesis: null,
        },
        result: null,
      }
    }
    if (input.type === InputType.START) {
      return {
        state: state,
        variables: prevVariables,
        outputs: {
          SpeechSynthesis: null,
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

export interface Sources extends ActionSources {
  SpeechSynthesis: EventSource,
}

export interface Sinks extends ActionSinks {
  SpeechSynthesis: Stream<UtteranceArg>,
};

function status(reducerState$): Stream<GoalStatus> {
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
    SpeechSynthesis: outputs$
      .map(o => o.SpeechSynthesis)
  };
};

export function SpeechSynthesisAction(sources: Sources): Sinks {
  const input$ = input(
    xs.fromObservable(sources.goal),
    xs.fromObservable(sources.cancel),
    xs.fromObservable(sources.SpeechSynthesis.events('start')),
    xs.fromObservable(sources.SpeechSynthesis.events('end')),
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
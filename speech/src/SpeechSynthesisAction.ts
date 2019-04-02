import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {Stream} from 'xstream';
import {
  GoalID, Goal, Status, GoalStatus, Result,
  ActionSources, ActionSinks,
  EventSource,
  generateGoalStatus, isEqualGoalStatus, isEqualGoalID
} from '@cycle-robot-drivers/action';
import {UtteranceArg} from './makeSpeechSynthesisDriver';


enum State {
  RUN = 'RUN',
  WAIT = 'WAIT',
  PREEMPT = 'PREEMPT',
}

type Variables = {
  goal_id: GoalID,
  newGoal: Goal,
};

type Outputs = {
  SpeechSynthesis: UtteranceArg,
  result: Result,
};

type ReducerState = {
  state: State,
  variables: Variables,
  outputs: Outputs,
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
  value: Goal | GoalID,
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
    cancel$.map(val => ({type: InputType.CANCEL, value: val})),
    startEvent$.mapTo({type: InputType.START, value: null}),
    endEvent$.mapTo({type: InputType.END, value: null}),
  );
}

const transitionTable = {
  [State.WAIT]: {
    [InputType.GOAL]: State.RUN,
  },
  [State.RUN]: {
    [InputType.GOAL]: State.PREEMPT,
    [InputType.CANCEL]: State.PREEMPT,
    [InputType.START]: State.RUN,
    [InputType.END]: State.WAIT,
  },
  [State.PREEMPT]: {
    [InputType.END]: State.WAIT,
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

  if (prevState === State.WAIT && state === State.RUN) {
    // Start a new goal
    const goal = input.value as Goal;
    return {
      state,
      variables: {
        goal_id: goal.goal_id,
        newGoal: null,
      },
      outputs: {
        SpeechSynthesis: goal.goal,
        result: null,
      },
    };
  } else if (state === State.WAIT) {
    if (prevState === State.RUN || prevState === State.PREEMPT) {
      // Stop the current goal and start the queued new goal
      const newGoal = prevVariables.newGoal;
      return {
        state: !!newGoal ? State.RUN : state,
        variables: {
          goal_id: !!newGoal ? newGoal.goal_id : null,
          newGoal: null,
        },
        outputs: {
          SpeechSynthesis: !!newGoal ? newGoal.goal : undefined,
          result: {
            status: {
              goal_id: prevVariables.goal_id,
              status: prevState === State.RUN
                ? Status.SUCCEEDED : Status.PREEMPTED,
            },
            result: null,
          },
        },
      };
    }
  } else if (
    (prevState === State.RUN || prevState === State.PREEMPT)
    && state === State.PREEMPT
  ) {
    if (input.type === InputType.GOAL || input.type === InputType.CANCEL
        && (input.value === null ||
            isEqualGoalID(input.value as GoalID, prevVariables.goal_id))) {
      // Start stopping the current goal and queue a new goal if received one
      return {
        state,
        variables: {
          ...prevVariables,
          newGoal: input.type === InputType.GOAL ? input.value as Goal : null,
        },
        outputs: {
          SpeechSynthesis: null,
          result: null,
        }
      }
    }
    if (input.type === InputType.START) {
      return {
        state: state,
        variables: prevVariables,
        outputs: {
          SpeechSynthesis: null,
          result: null,
        },
      };
    }
  }

  return {
    state: prevState,
    variables: prevVariables,
    outputs: null,
  };
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$ = xs.of(
    function initReducer(prev) {
      return {
        state: State.WAIT,
        variables: {
          goal_id: null,
          newGoal: null,
        },
        outputs: null,
      }
    }
  );

  const inputReducer$ = input$
    .map(input => function inputReducer(prev) {
      return transition(prev.state, prev.variables, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

function status(reducerState$): Stream<GoalStatus> {
  const done$: Stream<GoalStatus> = reducerState$
    .filter(rs => !!rs.outputs && !!rs.outputs.result)
    .map(rs => rs.outputs.result.status);
  const active$: Stream<GoalStatus> = reducerState$
    .filter(rs => rs.state === State.RUN)
    .map(rs => ({goal_id: rs.variables.goal_id, status: Status.ACTIVE}));
  const initGoalStatus = generateGoalStatus({status: Status.SUCCEEDED});
  return xs.merge(done$, active$)
    .compose(dropRepeats(isEqualGoalStatus))
    .startWith(initGoalStatus);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(rs => !!rs.outputs)
    .map(rs => rs.outputs);
  return {
    result: outputs$
      .filter(o => !!o.result)
      .map(o => o.result),
    SpeechSynthesis: outputs$
      .filter(o => typeof o.SpeechSynthesis !== 'undefined')
      .map(o => o.SpeechSynthesis),
  };
};

export interface Sources extends ActionSources {
  SpeechSynthesis: EventSource,
}

export interface Sinks extends ActionSinks {
  SpeechSynthesis: Stream<UtteranceArg>,
}

/**
 * Web Speech API's [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
 * action component.
 *
 * @param sources
 *
 *   * goal: a stream of `SpeechSynthesisUtterance` properties.
 *   * cancel: a stream of `GoalID`.
 *   * SpeechSynthesis: `EventSource` for `start` and `end` events.
 *
 * @return sinks
 *
 *   * state: a reducer stream.
 *   * status: a stream of action status.
 *   * result: a stream of action results. `result.result` is always `null`.
 *   * SpeechSynthesis: a stream for the SpeechSynthesis driver input.
 *
 */

export function SpeechSynthesisAction(sources: Sources): Sinks {
  const input$ = input(
    sources.goal,
    sources.cancel || xs.never(),
    sources.SpeechSynthesis.events('start'),
    sources.SpeechSynthesis.events('end'),
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
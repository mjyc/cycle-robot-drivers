import xs, { Stream } from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import {
  GoalID,
  Goal,
  GoalStatus,
  Status,
  Result,
  ActionSources,
  ActionSinks,
  EventSource,
  initGoal,
  generateGoalStatus,
  isEqualGoalStatus,
  isEqualGoalID
} from "@cycle-robot-drivers/action";
import { TabletFaceCommand } from "./makeTabletFaceDriver";

enum State {
  WAIT = "WAIT",
  RUN = "RUN",
  PREEMPT = "PREEMPT"
}

type Variables = {
  goal_id: GoalID;
  newGoal: Goal;
};

type Outputs = {
  TabletFace?: TabletFaceCommand;
  result?: Result;
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
  END = "END"
}

type Input = {
  type: InputType;
  value: Goal | GoalID | string;
};

function input(
  goal$: Stream<Goal | string>,
  cancel$: Stream<GoalID>,
  animationFinishEvent$: Stream<any>
): Stream<Input> {
  return xs.merge(
    goal$
      .filter(g => typeof g !== "undefined" && g !== null)
      .map(g => initGoal(g))
      .map(goal => ({
        type: InputType.GOAL,
        value:
          typeof goal.goal === "string"
            ? {
                goal_id: goal.goal_id,
                goal: {
                  type: "EXPRESS",
                  value: {
                    type: goal.goal
                  }
                }
              }
            : goal
      })),
    cancel$.map(val => ({ type: InputType.CANCEL, value: val })),
    animationFinishEvent$.mapTo({
      type: InputType.END,
      value: null
    })
  );
}

function transition(prev: ReducerState, input: Input): ReducerState {
  if (prev.state === State.WAIT) {
    if (input.type === InputType.GOAL) {
      const goal = input.value as Goal;
      return {
        ...prev,
        state: State.RUN,
        variables: {
          goal_id: goal.goal_id,
          newGoal: null
        },
        outputs: {
          TabletFace: goal.goal
        }
      };
    }
  } else if (prev.state === State.RUN) {
    if (
      input.type === InputType.GOAL ||
      (input.type === InputType.CANCEL &&
        (input.value === null ||
          isEqualGoalID(input.value as GoalID, prev.variables.goal_id)))
    ) {
      return {
        ...prev,
        state: State.PREEMPT,
        variables: {
          ...prev.variables,
          newGoal: input.type === InputType.GOAL ? (input.value as Goal) : null
        },
        outputs: {
          TabletFace: null
        }
      };
    } else if (input.type === InputType.END) {
      return {
        ...prev,
        state: State.WAIT,
        variables: {
          goal_id: null,
          newGoal: null
        },
        outputs: {
          result: {
            status: {
              goal_id: prev.variables.goal_id,
              status: Status.SUCCEEDED
            },
            result: input.value
          }
        }
      };
    }
  } else if (prev.state === State.PREEMPT) {
    if (input.type === InputType.END) {
      const newGoal = prev.variables.newGoal;
      return {
        ...prev,
        state: !!newGoal ? State.RUN : State.WAIT,
        variables: {
          goal_id: !!newGoal ? newGoal.goal_id : null,
          newGoal: null
        },
        outputs: {
          TabletFace: !!newGoal ? newGoal.goal : undefined,
          result: {
            status: {
              goal_id: prev.variables.goal_id,
              status: Status.PREEMPTED
            },
            result: input.value
          }
        }
      };
    }
  }
  return prev;
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(function initReducer(
    prev: ReducerState
  ): ReducerState {
    return {
      state: State.WAIT,
      variables: {
        goal_id: null,
        newGoal: null
      },
      outputs: null
    };
  });

  const inputReducer$: Stream<Reducer> = input$.map(
    input =>
      function inputReducer(prev: ReducerState): ReducerState {
        return transition(prev, input);
      }
  );

  return xs.merge(initReducer$, inputReducer$);
}

function status(reducerState$): Stream<GoalStatus> {
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

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(rs => !!rs.outputs)
    .map(rs => rs.outputs);
  return {
    result: outputs$.filter(o => !!o.result).map(o => o.result),
    TabletFace: outputs$
      .filter(o => typeof o.TabletFace !== "undefined")
      .map(o => o.TabletFace)
  };
}

export interface Sources extends ActionSources {
  TabletFace: EventSource;
}

export interface Sinks extends ActionSinks {
  TabletFace: Stream<TabletFaceCommand>;
}

/**
 * FacialExpression action component.
 *
 * @param sources
 *
 *   * goal: a stream of `TabletFaceCommand`s.
 *   * cancel: a stream of `GoalID`.
 *   * TabletFace: the `TabletFace` driver output.
 *
 * @return sinks
 *
 *   * state: a reducer stream.
 *   * status: a stream of action status.
 *   * result: a stream of action results.
 *   * TabletFace: a stream for the `TabletFace` driver input.
 *
 */
export function FacialExpressionAction(sources: Sources): Sinks {
  const input$ = input(
    sources.goal || xs.never(),
    sources.cancel || xs.never(),
    sources.TabletFace.events("animationfinish")
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

import xs from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import { Stream } from "xstream";
import { TimeSource } from "@cycle/time";
import {
  GoalID,
  Goal,
  Status,
  GoalStatus,
  Result,
  ActionSources,
  ActionSinks,
  initGoal,
  generateGoalStatus,
  isEqualGoalStatus,
  isEqualGoalID
} from "@cycle-robot-drivers/action";

enum State {
  RUN = "RUN",
  WAIT = "WAIT"
}

type Variables = {
  goal_id: GoalID;
};

type SleepInput = {
  goal_id: GoalID;
  duration: number;
};

type SleepOutput = {
  goal_id: GoalID;
  targetTime: number;
};

type Outputs = {
  Time?: SleepInput;
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
  SLEEP_DONE = "SLEEP_DONE"
}

type Input = {
  type: InputType;
  value: Goal | GoalID | SleepOutput;
};

function input(
  goal$: Stream<Goal | number>,
  cancel$: Stream<GoalID>,
  sleepDone$: Stream<SleepOutput>
) {
  return xs.merge(
    goal$
      .filter(g => typeof g !== "undefined" && g !== null)
      .map(g => {
        const goal: Goal = initGoal(g);
        return {
          type: InputType.GOAL,
          value:
            typeof goal.goal === "number"
              ? {
                  goal_id: goal.goal_id,
                  goal: { goal_id: goal.goal_id, duration: goal.goal }
                }
              : goal
        };
      }),
    cancel$.map(val => ({ type: InputType.CANCEL, value: val })),
    sleepDone$.map(val => ({ type: InputType.SLEEP_DONE, value: val }))
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
          goal_id: goal.goal_id
        },
        outputs: {
          Time: goal.goal
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
        state: input.type === InputType.GOAL ? State.RUN : State.WAIT,
        variables: {
          goal_id:
            input.type === InputType.GOAL
              ? (input.value as Goal).goal_id
              : prev.variables.goal_id
        },
        outputs: {
          Time: (input.value as Goal).goal
        }
      };
    } else if (
      input.type === InputType.SLEEP_DONE &&
      isEqualGoalID(
        (input.value as SleepOutput).goal_id,
        prev.variables.goal_id
      )
    ) {
      return {
        ...prev,
        state: State.WAIT,
        variables: {
          goal_id: null
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
        goal_id: null
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
    Time: outputs$.filter(o => typeof o.Time !== "undefined").map(o => o.Time)
  };
}

export interface Sources extends ActionSources {
  Time: TimeSource;
}

function sleep(timeSource) {
  return function sleepOperator(stream) {
    let sourceListener;

    return xs.create({
      start(listener) {
        const { schedule, currentTime } = timeSource.createOperator();

        sourceListener = stream.addListener({
          next({ goal_id, duration }) {
            schedule.next(listener, currentTime() + duration, {
              goal_id,
              targetTime: currentTime() + duration
            });
          },

          error(err) {
            schedule.error(listener, currentTime(), err);
          },

          complete() {
            schedule.complete(listener, currentTime());
          }
        });
      },

      stop() {
        stream.removeListener(sourceListener);
      }
    });
  };
}

export function SleepAction(sources: Sources): ActionSinks {
  const status$ = status(sources.state.stream);
  const outputs = output(sources.state.stream);

  const input$ = input(
    sources.goal || xs.never(),
    sources.cancel || xs.never(),
    outputs.Time.compose(sleep(sources.Time))
  );
  const reducer = transitionReducer(input$);

  return {
    state: reducer,
    status: status$,
    ...outputs
  };
}

import xs, {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {
  GoalID, Goal, GoalStatus, Status, Result,
  ActionSources, ActionSinks,
  generateGoalStatus, isEqualGoalStatus,
} from '@cycle-robot-drivers/action';
import {TabletFaceCommand} from './makeTabletFaceDriver';

enum State {
  WAIT = 'WAIT',
  RUN = 'RUN',
}

type Variables = {
  goal_id: GoalID,
  goal: Goal,
  newGoal: Goal,
};

type Outputs = {
  TabletFace?: TabletFaceCommand,
  result?: Result,
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
  END = 'END',
}

type Input = {
  type: InputType,
  value: Goal | string,
};


function input(
  goal$: Stream<Goal>,
  cancel$: Stream<GoalID>,
  animationFinishEvent$: Stream<any>,
): Stream<Input> {
  return xs.merge(
    goal$.map(goal => ({
      type: InputType.GOAL,
      value: typeof goal.goal === 'string' ? {
        goal_id: goal.goal_id,
        goal: {
          type: 'EXPRESS',
          value: {
            type: goal.goal,
          },
        },
      } : goal,
    })),
    cancel$.mapTo({type: InputType.CANCEL, value: null}),
    animationFinishEvent$.mapTo({
      type: InputType.END,
      value: null,
    }),
  );
}

function transition(prev: ReducerState, input: Input): ReducerState {
  if (prev.state === State.WAIT) {
    if (input.type === 'GOAL') {
      const goal = (input.value as Goal);
      return {
        ...prev,
        state: State.RUN,
        variables: {
          goal_id: goal.goal_id,
          goal: goal.goal,
          newGoal: null,
        },
        outputs: {
          TabletFace: goal.goal,
        },
      };
    }
  } else if (prev.state === State.RUN) {
    if (input.type === 'GOAL') {
      const goal = (input.value as Goal);
      return {
        ...prev,
        state: State.RUN,
        variables: {
          goal_id: goal.goal_id,
          goal: goal.goal,
          newGoal: null,
        },
        outputs: {
          TabletFace: goal.goal,
          result: {
            status: {
              goal_id: prev.variables.goal_id,
              status: Status.PREEMPTED,
            },
            result: null,
          }
        },
      };
    } else if (input.type === 'END' || input.type === 'CANCEL') {
      return {
        ...prev,
        state: State.WAIT,
        variables: null,
        outputs: {
          result: {
            status: {
              goal_id: prev.variables.goal_id,
              status: input.type === 'END' ? Status.SUCCEEDED : Status.PREEMPTED,
            },
            result: input.type === 'END' ? input.value : null,
          },
        },
      };
    }
  }
  return prev;
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev: ReducerState): ReducerState {
      return {
        state: State.WAIT,
        variables: {
          goal_id: null,
          goal: null,
          newGoal: null,
        },
        outputs: null,
      }
    }
  );

  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev: ReducerState): ReducerState {
      return transition(prev, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

function status(reducerState$): Stream<GoalStatus> {
  const active$: Stream<GoalStatus> = reducerState$
    .filter(rs => rs.state === State.RUN)
    .map(rs => ({goal_id: rs.variables.goal_id, status: Status.ACTIVE}));
  const done$: Stream<GoalStatus> = reducerState$
    .filter(rs => !!rs.outputs && !!rs.outputs.result)
    .map(rs => rs.outputs.result.status);
  const initGoalStatus = generateGoalStatus({status: Status.SUCCEEDED});
  return xs.merge(active$, done$)
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
      TabletFace: outputs$
      .filter(o => typeof o.TabletFace !== 'undefined')
      .map(o => o.TabletFace),
  };
};

export interface Sources extends ActionSources {
  TabletFace: any,
}

export interface Sinks extends ActionSinks {
  TabletFace: Stream<TabletFaceCommand>,
}

/**
 * FacialExpression action component.
 *
 * @param sources
 *
 *   * goal: a stream of `null` (as "cancel") or a string '`happy'`, '`sad'`,
 *     '`angry'`, '`focused'`, or '`confused'` (as the TabletFace driver's
 *     `EXPRESS` type command value).
 *   * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).
 *
 * @return sinks
 *
 *   * output: a stream for the TabletFace driver.
 *   * status: depreciated.
 *   * result: a stream of action results. `result.result` is always `null`.
 *
 */
export function FacialExpressionAction(sources: Sources): Sinks {
  const input$ = input(
    sources.goal,
    sources.cancel || xs.never(),
    sources.TabletFace.animationFinish,
  );
  const reducer = transitionReducer(input$);;
  const status$ = status(sources.state.stream);
  const outputs = output(sources.state.stream);
  return {
    state: reducer,
    status: status$,
    ...outputs
  };
}

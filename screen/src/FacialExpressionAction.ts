import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {adapt} from '@cycle/run/lib/adapt';
import {
  GoalID, Goal, GoalStatus, Status, Result,
  generateGoalID, initGoal, isEqual,
} from '@cycle-robot-drivers/action';

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
 *   * status: depreciated
 *   * result: a stream of action results. `result.result` is always `null`.
 * 
 */
export function FacialExpressionAction(sources) {
  // Create action stream
  type Action = {
    type: string,
    value: Goal,
  };

  const goal$ = xs.fromObservable(
    sources.goal
  ).filter(goal => typeof goal !== 'undefined').map(goal => {
    if (goal === null) {
      return {
        type: 'CANCEL',
        value: null,
      };
    } else {
      const value = !!(goal as any).goal_id ? goal as any : initGoal(goal);
      return {
        type: 'GOAL',
        value: typeof value.goal === 'string' ? {
          goal_id: value.goal_id,
          goal: {
            type: value.goal,
          }
        } : value,
      };
    }
  });

  const action$ = xs.merge(
    goal$,
    sources.TabletFace.animationFinish.mapTo({
      type: 'END',
      value: null,
    }),
  );

  // Create state stream
  type State = {
    goal_id: GoalID,
    goal: any,
    status: Status,
    result: any,
  };

  const initialState: State = {
    goal: null,
    goal_id: generateGoalID(),
    status: Status.SUCCEEDED,
    result: null,
  };

  const state$ = action$.fold((state: State, action: Action): State => {
    console.debug('state', state, 'action', action);
    if (state.status === Status.SUCCEEDED
        || state.status === Status.PREEMPTED
        || state.status === Status.ABORTED) {
      if (action.type === 'GOAL') {
        const goal = (action.value as Goal);
        return {
          goal_id: goal.goal_id,
          goal: goal.goal,
          status: Status.ACTIVE,
          result: null,
        };
      } else if (action.type === 'CANCEL') {
        console.debug('Ignore CANCEL in DONE states');
        return state;
      }
    } else if (state.status === Status.ACTIVE) {
      if (action.type === 'GOAL') {
        state$.shamefullySendNext({
          ...state,
          goal: null,
          status: Status.PREEMPTED,
        });
        const goal = (action.value as Goal);
        return {
          goal_id: goal.goal_id,
          goal: goal.goal,
          status: Status.ACTIVE,
          result: null,
        };
      } else if (action.type === 'END') {
        return {
          ...state,
          status: Status.SUCCEEDED,
          result: action.value,
        };
      } else if (action.type === 'CANCEL') {
        return {
          ...state,
          goal: null,
          status: Status.PREEMPTED,
        };
      }
    }
    console.warn(
      `Unhandled state.status ${state.status} action.type ${action.type}`
    );
    return state;
  }, initialState);

  const stateStatusChanged$ = state$
    .compose(dropRepeats(
      (x, y) => (x.status === y.status && isEqual(x.goal_id, y.goal_id))));

  const value$ = stateStatusChanged$
    .filter(state =>
      state.status === Status.ACTIVE || state.status === Status.PREEMPTED)
    .map(state => {
      if (state.status === Status.ACTIVE) {
        return {
          type: 'EXPRESS',
          value: state.goal,
        };
      } else {  // state.status === Status.PREEMPTED
        return null;
      }
    });
  const status$ = stateStatusChanged$
    .map(state => ({
      goal_id: state.goal_id,
      status: state.status,
    } as GoalStatus));

  const result$ = stateStatusChanged$
    .filter(state => (state.status === Status.SUCCEEDED
        || state.status === Status.PREEMPTED
        || state.status === Status.ABORTED))
    .map(state => ({
      status: {
        goal_id: state.goal_id,
        status: state.status,
      },
      result: state.result,
    } as Result));

  // IMPORTANT!! empty the streams manually; otherwise it emits the first
  //   "SUCCEEDED" result
  value$.addListener({next: () => {}});

  return {
    output: adapt(value$),
    status: adapt(status$),
    result: adapt(result$),
  };
}

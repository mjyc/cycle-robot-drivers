import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {adapt} from '@cycle/run/lib/adapt';
import {
  GoalID, Goal, GoalStatus, Status, Result,
  generateGoalID, initGoal, isEqual,
} from '@cycle-robot-drivers/action';

export function FacialExpressionAction(sources) {
  // Create action stream
  type Action = {
    type: string,
    value: Goal,
  };

  const goal$ = xs.fromObservable(sources.goal).map(goal => {
    if (goal === null) {
      return {
        type: 'CANCEL',
        value: null,
      };
    } else {
      return {
        type: 'GOAL',
        value: (goal as any).goal_id ? goal : initGoal(goal),
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
          args: state.goal,
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
    } as Result))
    .drop(1);  // ignore first "SUCCEEDED"

  return {
    value: adapt(value$),
    status: adapt(status$),
    result: adapt(result$),
  };
}

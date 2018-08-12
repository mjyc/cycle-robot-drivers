import xs from 'xstream'
import pairwise from 'xstream/extra/pairwise'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {
  GoalID, Goal, GoalStatus, Status, Result, initGoal, generateGoalID, isEqual,
} from '@cycle-robot-drivers/action'


export function AudioPlayerAction(sources) {
  // Create action stream
  type Action = {
    type: string,
    value: Goal | string,
  };

  const goal$ = xs.fromObservable(sources.goal).map(goal => {
    if (goal === null) {
      return {
        type: 'CANCEL',
        value: null,  // goal MUST BE null on CANCEL
      };
    } else {
      return {
        type: 'GOAL',
        value: (goal as any).goal_id ? goal : initGoal(goal),
      }
    }
  });
  const events$ = xs.merge(
    sources.AudioPlayer.events('ended').map(
      event => ({type: 'ENDED', value: event})
    ),
  );
  const action$ = xs.merge(goal$, events$);


  // Create state stream
  enum ExtraStatus {
    PREEMPTING = 'PREEMPTING',
  };
  type ExtendedStatus = Status | ExtraStatus;
  type State = {
    goal_id: GoalID,
    goal: any,
    status: ExtendedStatus,
    result: any,
    newGoal: Goal,
  };

  const initialState: State = {
    goal: null,
    goal_id: generateGoalID(),
    status: Status.SUCCEEDED,
    result: null,
    newGoal: null,
  };

  const state$ = action$.fold((state: State, action: Action): State => {
    console.debug('state', state, 'action', action);
    if (state.status === Status.SUCCEEDED
        || state.status === Status.PREEMPTED
        || state.status === Status.ABORTED) {
      if (action.type === 'GOAL') {
        return {
          ...state,
          goal_id: (action.value as Goal).goal_id,
          goal: (action.value as Goal).goal,
          status: Status.ACTIVE,
          result: null,
        };
      } else if (action.type === 'CANCEL') {
        console.debug('Ignore cancel in done states');
        return state;
      }
    } else if (state.status === Status.ACTIVE) {
      if (action.type === 'ENDED') {
        return {
          ...state,
          status: Status.SUCCEEDED,
          result: action.value,
        }
      } else if (action.type === 'CANCEL') {
        return {
          ...state,
          goal: null,
          status: ExtraStatus.PREEMPTING,
        }
      }
    } else if (state.status === ExtraStatus.PREEMPTING) {
      if (action.type === 'ENDED') {
        const preemptedState = {
          ...state,
          status: Status.PREEMPTED,
          newGoal: null,
        }
        if (state.newGoal) {
          state$.shamefullySendNext(preemptedState);
          return {
            goal_id: state.newGoal.goal_id,
            goal: state.newGoal.goal,
            status: Status.ACTIVE,
            result: null,
            newGoal: null,
          }
        } else {
          return preemptedState;
        }
      }
    }
    console.warn(
      `Unhandled state.status ${state.status} action.type ${action.type}`
    );
    return state;
  }, initialState);


  // Prepare outgoing streams
  const stateStatusChanged$ = state$
    .compose(pairwise)
    .filter(([prev, cur]) => (
      cur.status !== prev.status || !isEqual(cur.goal_id, prev.goal_id)
    ))
    .map(([prev, cur]) => cur);

  const value$ = stateStatusChanged$
    .debug(data => console.warn('======value', data))
    .filter(state => (state.status === Status.ACTIVE
      || state.status === ExtraStatus.PREEMPTING))
    .map(state => state.goal);
  const status$ = stateStatusChanged$
    .filter(state => state.status !== ExtraStatus.PREEMPTING)
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


  return {
    value: adapt(value$),
    status: adapt(status$),
    result: adapt(result$),
  };
}

export function IsolatedAudioPlayerAction(sources) {
  return isolate(AudioPlayerAction)(sources);
};

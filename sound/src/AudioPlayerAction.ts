import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {adapt} from '@cycle/run/lib/adapt';
import {
  GoalID, Goal, GoalStatus, Status, Result, ActionSinks,
  initGoal, generateGoalID, isEqual,
} from '@cycle-robot-drivers/action'

export interface Sources {
  goal: any,
  AudioPlayer: any,
}

export interface Sinks extends ActionSinks {
  output: any,
}


/**
 * AudioPlayerAction action component.
 * 
 * @param sources
 * 
 *   * goal: a stream of `null` (as "cancel") or `{src: string}` (as HTML audio
 *     [src](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-src))
 *     or a string (as a value of `src`).
 *   * AudioPlayer: `EventSource` for `ended` and `pause` events.
 * 
 * @return sinks
 * 
 *   * output: a stream for the AudioPlayer driver.
 *   * status: depreciated.
 *   * result: a stream of action results. `result.result` is always `null`.
 * 
 */
export function AudioPlayerAction(sources: Sources): Sinks {
  // Create action stream
  type Action = {
    type: string,
    value: Goal | string,
  };

  const goal$ = xs.fromObservable(
    sources.goal
  ).filter(goal => typeof goal !== 'undefined').map(goal => {
    if (goal === null) {
      return {
        type: 'CANCEL',
        value: null,  // goal MUST BE null on CANCEL
      };
    } else {
      const value = !!(goal as any).goal_id ? goal as any : initGoal(goal);
      return {
        type: 'GOAL',
        value: typeof value.goal === 'string'
          ? {
            goal_id: value.goal_id,
            goal: {src: value.goal},
          } : value,
      };
    }
  });
  const events$ = xs.merge(
    sources.AudioPlayer.events('ended').map(
      event => ({type: 'ENDED', value: event})
    ),
    sources.AudioPlayer.events('pause').map(
      event => ({type: 'PAUSE', value: event})
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
    // console.debug('state', state, 'action', action);
    if (state.status === Status.SUCCEEDED
        || state.status === Status.PREEMPTED
        || state.status === Status.ABORTED) {
      if (action.type === 'GOAL') {
        return {
          goal_id: (action.value as Goal).goal_id,
          goal: (action.value as Goal).goal,
          status: Status.ACTIVE,
          result: null,
          newGoal: null,
        };
      } else if (action.type === 'CANCEL') {
        console.debug('Ignore CANCEL in DONE states');
        return state;
      }
    } else if (state.status === Status.ACTIVE) {
      if (action.type === 'GOAL') {
        return {
          ...state,
          goal: null,
          status: ExtraStatus.PREEMPTING,
          newGoal: (action.value as Goal)
        }
      } else if (action.type === 'ENDED') {
        return {
          ...state,
          status: Status.SUCCEEDED,
          result: null,
        }
      } else if (action.type === 'CANCEL') {
        return {
          ...state,
          goal: null,
          status: ExtraStatus.PREEMPTING,
        }
      } else if (action.type === 'PAUSE') {
        console.debug('Ignore pause in ACTIVE states; used ENDED instead');
        return state;
      }
    } else if (state.status === ExtraStatus.PREEMPTING) {
      if (action.type === 'ENDED' || action.type === 'PAUSE') {
        const preemptedState = {
          ...state,
          status: Status.PREEMPTED,
          newGoal: null,
        };
        if (state.newGoal) {
          state$.shamefullySendNext(preemptedState);
          return {
            goal_id: state.newGoal.goal_id,
            goal: state.newGoal.goal,
            status: Status.ACTIVE,
            result: null,
            newGoal: null,
          };
        } else {
          return preemptedState;
        }
      }
    }
    console.debug(
      `Unhandled state.status ${state.status} action.type ${action.type}`
    );
    return state;
  }, initialState);


  // Prepare outgoing streams
  const stateStatusChanged$ = state$
    .compose(dropRepeats(
      (x, y) => (x.status === y.status && isEqual(x.goal_id, y.goal_id))));

  const value$ = stateStatusChanged$
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

  // IMPORTANT!! empty the streams manually; otherwise it emits the first
  //   "SUCCEEDED" result
  value$.addListener({next: () => {}});


  return {
    output: adapt(value$),
    status: adapt(status$),
    result: adapt(result$),
  };
}

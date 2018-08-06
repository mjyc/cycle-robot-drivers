import xs from 'xstream'
import pairwise from 'xstream/extra/pairwise'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {
  GoalID, Goal, GoalStatus, Status, Result, initGoal
} from '@cycle-robot-drivers/action'


function SpeechSynthesisAction(sources) {
  // Create action stream
  type Action = {
    type: string,
    value: Goal | SpeechSynthesisEvent,
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
        value: initGoal(goal),
      }
    }
  });
  const events$ = xs.merge(
    sources.SpeechSynthesis.events('start').map(
      event => ({type: 'START', value: event})
    ),
    sources.SpeechSynthesis.events('end').map(
      event => ({type: 'END', value: event})
    ),
    sources.SpeechSynthesis.events('error').map(
      event => ({type: 'ERROR', value: event})
    ),
  );
  const action$ = xs.merge(goal$, events$);


  // Create state stream
  enum ExtraStatus {
    PREEMPTING = 6,
  };
  type ExtendedStatus = Status | ExtraStatus;
  type State = {
    goal_id: GoalID,
    goal: any,
    status: ExtendedStatus,
    result: any,
    newGoal: Goal,
  };

  const now = new Date();
  const initialState: State = {
    goal: null,
    goal_id: {
      stamp: now,
      id: `${Math.random().toString(36).substring(2)}-${now.getTime()}`,
    },
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
          status: Status.PENDING,
          result: null,
        }
      }
    } else if (state.status === Status.PENDING) {
      if (action.type === 'GOAL') {
        return {
          ...state,
          goal: null,
          status: ExtraStatus.PREEMPTING,
          newGoal: (action.value as Goal)
        }
      } else if (action.type === 'START') {
        return {
          ...state,
          status: Status.ACTIVE,
        };
      } else if (action.type === 'CANCEL') {
        return {
          ...state,
          goal: null,
          status: ExtraStatus.PREEMPTING,
        }
      }
    } else if (state.status === Status.ACTIVE) {
      if (action.type === 'GOAL') {
        return {
          ...state,
          goal: null,
          status: ExtraStatus.PREEMPTING,
          newGoal: (action.value as Goal)
        }
      } else if (action.type === 'END') {
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
      if (action.type === 'END') {
        if (state.newGoal) {
          setTimeout(() => {
            goal$.shamefullySendNext({type: 'GOAL', value: state.newGoal});
          }, 1);
        }
        return {
          ...state,
          status: Status.PREEMPTED,
          newGoal: null,
        }
      }
    }
    console.warn(
      `Unhandled state.status ${state.status} action.type ${action.type}`
    );
    return state;
  }, initialState);


  // Prepare outgoing streams
  const value$ = state$
    .drop(1)
    .filter(state => (state.status === Status.PENDING
      || state.status === ExtraStatus.PREEMPTING))
    .map(state => state.goal);
  const stateStatusChanged$ = state$
    .filter(state => state.status !== ExtraStatus.PREEMPTING)
    .compose(pairwise)
    .filter(([prevState, curState]) => (curState.status !== prevState.status))
    .map(([prevState, curState]) => curState);
  const status$ = stateStatusChanged$
    .map(state => ({
      goal_id: state.goal_id,
      status: state.status,
    } as GoalStatus))
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

const IsolatedSpeechSynthesisAction = function(sources) {
  return isolate(SpeechSynthesisAction)(sources);
};


export {
  SpeechSynthesisAction,
  IsolatedSpeechSynthesisAction,
};

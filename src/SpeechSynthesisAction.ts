import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {Goal, GoalStatus, Status} from './types'
import {initGoal} from './utils'


function SpeechSynthesisAction(sources) {
  // Create action stream
  type Action = {
    type: string,
    value: Goal | SpeechSynthesis,
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

  // Create status stream
  let statusListener = null;
  const status$ = xs.createWithMemory({
    start: listener => {
      statusListener = listener;
    },
    stop: () => {
      statusListener = null;
    },
  });

  // Create result stream
  let resultListener = null;
  const result$ = xs.create({
    start: listener => {
      resultListener = listener;
    },
    stop: () => {
      resultListener = null;
    },
  });

  // Create state stream
  type State = {
    goal: Goal,
    status: GoalStatus,
  };

  const initialState: State = {
    goal: null,
    status: {
      goal_id: {
        stamp: new Date,
        id: '',
      },
      status: Status.SUCCEEDED,
    },
  };

  const state$ = action$.fold((state: State, action: Action): State => {
    console.debug('SpeechSynthesis state', state, 'action', action);
    if (action.type === 'GOAL' || action.type === 'CANCEL') {
      let goal: Goal = state.goal;
      let status: GoalStatus = state.status;
      if (state.status.status === Status.PENDING
          || state.status.status === Status.ACTIVE) {  // preempt the goal
        goal = (action.value as Goal); // null or a new goal (queuing)
        status = {
          goal_id: state.status.goal_id,
          status: Status.PREEMPTING,
        };
        statusListener && statusListener.next(status);
      } else if (action.type === 'GOAL') {
        goal = (action.value as Goal);
        status = {
          goal_id: goal.goal_id,
          status: Status.PENDING,
        };
        statusListener && statusListener.next(status);
      } // else cancel called when no goal is pending or running, then do nothing
      return {
        goal,
        status,
      };
    } else if (action.type === 'START' && state.status.status === Status.PENDING) {
      const status: GoalStatus = {
        goal_id: state.status.goal_id,
        status: Status.ACTIVE,
      };
      statusListener && statusListener.next(status);
      return {
        ...state,
        status,
      }
    } else if (action.type === 'END' && state.status.status === Status.ACTIVE) {
      const status: GoalStatus = {
        goal_id: state.status.goal_id,
        status: Status.SUCCEEDED,
      };
      statusListener && statusListener.next(status);
      resultListener && resultListener.next({
        status: status,
        result: (action.value as SpeechSynthesis),
      });
      return {
        ...state,
        status,
      }
    } else if (action.type === 'END' && state.status.status === Status.PREEMPTING) {
      let status: GoalStatus = {
        goal_id: state.status.goal_id,
        status: Status.PREEMPTED,
      };
      statusListener && statusListener.next(status);
      resultListener && resultListener.next({
        status,
        result: (action.value as SpeechSynthesis),
      });
      if (state.goal) { // the goal was canceled due to an arrival of a new goal
        status.goal_id = state.goal.goal_id;
        status.status = Status.PENDING;
        statusListener && statusListener.next(status);
      }
      return {
        ...state,
        status,
      }
    } else if (action.type === 'ERROR'
               && (state.status.status === Status.PENDING
                   || state.status.status === Status.ACTIVE)) {
      const status: GoalStatus = {
        goal_id: state.status.goal_id,
        status: Status.ABORTED,
      };
      statusListener && statusListener.next(status);
      resultListener && resultListener.next({
        status: status,
        result: (action.value as SpeechSynthesis),
      });
      return {
        ...state,
        status,
      }
    } else {
      console.warn(`returning "state" as is for action.type: ${action.type}`);
      return state;
    }
  }, initialState);

  const value$ = state$.map(state => {
    if (state.status.status === Status.PREEMPTING) {
      return null;  // cancel signal
    } else if (state.goal) {
      return state.goal.goal;
    }
  }).compose(dropRepeats());

  return {
    value: adapt(value$),
    status: adapt(status$),
    result: adapt(result$),
  };
}

const IsolatedSpeechSynthesisAction = function(sources) {
  return isolate(SpeechSynthesisAction)(sources);
};

export default IsolatedSpeechSynthesisAction;

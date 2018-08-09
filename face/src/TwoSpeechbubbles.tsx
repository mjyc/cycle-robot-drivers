import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import pairwise from 'xstream/extra/pairwise'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {
  GoalID, Goal, Status, GoalStatus, Result,
  generateGoalID, initGoal, isEqual,
} from '@cycle-robot-drivers/action'
import {IsolatedSpeechbubbleAction} from './SpeechbubbleAction'

export function TwoSpeechbubblesAction(sources) {
  const firstGoal$ = xs.create();
  const secondGoal$ = xs.create();

  const first = IsolatedSpeechbubbleAction({
    DOM: sources.DOM,
    goal: firstGoal$,
  });
  const second = IsolatedSpeechbubbleAction({
    DOM: sources.DOM,
    goal: secondGoal$,
  });

  // Process incoming streams
  type Action = {
    type: string,
    value: any,
  }

  const goal$ = sources.goal.map(goal => {
    if (!goal) {
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
    second.result.map(result => ({type: 'SECOND_RESULT', value: result})),
  );

  // Update the state
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

  const state$ = action$.fold((state: State, action: Action) => {
    console.debug('state', state, 'action', action);
    if (state.status === Status.SUCCEEDED
        || state.status === Status.PREEMPTED
        || state.status === Status.ABORTED) {
      if (action.type === 'GOAL') {
        const goal = (action.value as Goal);
        return {
          ...state,
          goal_id: goal.goal_id,
          goal: goal.goal,
          status: Status.ACTIVE,
          result: null,
        };
      } else if (action.type === 'CANCEL') {
        console.debug('Ignore cancel in done states');
        return state;
      }
    } else if (state.status === Status.ACTIVE) {
      if (action.type === 'GOAL') {
        setTimeout(() => {
          goal$.shamefullySendNext(action);
        }, 0);
        return {
          ...state,
          goal: null,
          status: Status.PREEMPTED,
        };
      } else if (action.type === 'SECOND_RESULT') {
        if (state.goal.type === 'ASK_QUESTION') {
          return {
            ...state,
            goal: null,
            status: Status.SUCCEEDED,
            result: (action.value as Result),
          };
        }
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

  // Prepare outgoing streams
  const stateStatusChanged$ = state$
    .compose(pairwise)
    .filter(([prevState, curState]) => (
      curState.status !== prevState.status
      || !isEqual(curState.goal_id, prevState.goal_id)
     ))
    .map(([prevState, curState]) => curState);

  firstGoal$.imitate(stateStatusChanged$.map(state => {
    if (!state.goal) {
      return null;
    }
    switch (state.goal.type) {
      case 'SET_MESSAGE':
        return {
          goal_id: state.goal_id,
          goal: {
            type: 'MESSAGE',
            value: state.goal.value,
          },
        };
      case 'ASK_QUESTION':
        return {
          goal_id: state.goal_id,
          goal: {
            type: 'MESSAGE',
            value: state.goal.value[0],
          },
        };
    };
  }));

  secondGoal$.imitate(stateStatusChanged$.map(state => {
    if (!state.goal) {
      return null;
    }
    switch (state.goal.type) {
      case 'SET_MESSAGE':
        return null;
      case 'ASK_QUESTION':
        return {
          goal_id: state.goal_id,
          goal: {
            type: 'CHOICE',
            value: state.goal.value[1],
          },
        };
    };
  }));

  return {
    DOM: adapt(xs.combine(first.DOM, second.DOM).map(([fdom, sdom]) => (
      <div>
        <div>
          <span>Robot:</span> <span>{fdom}</span>
        </div>
        <div>
          <span>Human:</span> <span>{sdom}</span>
        </div>
      </div>
    ))),
    status: stateStatusChanged$
      .map(state => ({
        goal_id: state.goal_id,
        status: state.status,
      } as GoalStatus)),
    result: adapt(stateStatusChanged$
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
    ),
  };
}

export function IsolatedTwoSpeechbubblesAction(sources) {
  return isolate(TwoSpeechbubblesAction)(sources);
};

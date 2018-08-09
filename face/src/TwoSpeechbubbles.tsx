import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import pairwise from 'xstream/extra/pairwise'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {
  GoalID, Goal, Status, Result, initGoal, generateGoalID,
} from '@cycle-robot-drivers/action'
import {IsolatedSpeechbubbleAction} from './SpeechbubbleAction'

export function TwoSpeechbubbles(sources) {
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

  const action$ = xs.merge(
    sources.goal.map(goal => {
      if (!goal) {
        return {
          type: 'CANCEL',
          value: null,
        };
      } else {
        return {
          type: 'GOAL',
          value: (goal as any).goal_id ? goal : initGoal(goal),
        }
      }
    }),
    first.result.map(result => ({type: 'FIRST_RESULT', value: result})),
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
      if (action.type === 'FIRST_RESULT') {
        if (state.goal.type === 'SET_MESSAGE') {
          return {
            ...state,
            status: (action.value as Result),
          };
        }
      } else if (action.type === 'CANCEL') {
        return {
          ...state,
          goal: null,
          status: Status.PREEMPTED,
        }
      }
    }
    console.warn(
      `Unhandled state.status ${state.status} action.type ${action.type}`
    );
    return state;
  }, initialState);

  const stateStatusChanged$ = state$
    .compose(pairwise)
    .filter(([prevState, curState]) => (
      curState.status !== prevState.status
      || curState.goal_id.id !== prevState.goal_id.id
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

  stateStatusChanged$.addListener({next: data => console.log(data.goal)});
  // stateStatusChanged$.addListener({next: data => console.log(data)});

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
    result: adapt(xs.create()),
  };
}

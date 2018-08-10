import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import pairwise from 'xstream/extra/pairwise'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {
  GoalID, Goal, GoalStatus, Status, Result, generateGoalID, initGoal,
} from '@cycle-robot-drivers/action'


export function SpeechbubbleAction(sources) {
  // Create action stream
  type Action = {
    type: string,
    value: Goal | string | boolean,
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
  let click$ = sources.DOM.select('.choice').events('click', {
    preventDefault: true
  });
  click$ = xs.fromObservable(click$).map((event: Event) => {
    return {
      type: 'CLICK',
      value: (event.target as HTMLButtonElement).textContent,
    };
  });
  const action$ = xs.merge(goal$, click$);

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
      } else if (action.type === 'CLICK') {
        return {
          ...state,
          status: Status.SUCCEEDED,
          result: (action.value as string),
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

  // Prepare outgoing streams
  const vdom$ = state$.map((state: State) => {
    const innerDOM = (() => {
      if (state.status === Status.ACTIVE) {
        switch (state.goal.type) {
          case 'MESSAGE':
            return (<span>{state.goal.value}</span>);
          case 'CHOICE':
            return (
              <span>{state.goal.value.map((text) => (
                <button className="choice">{text}</button>
              ))}</span>
            );
        }
      } else {
        return null;
      }
    })();
    return innerDOM;
  });

  const stateStatusChanged$ = state$
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
    DOM: vdom$,
    status: adapt(status$),
    result: adapt(result$),
  };
}

export function IsolatedSpeechbubbleAction(sources) {
  return isolate(SpeechbubbleAction)(sources);
};

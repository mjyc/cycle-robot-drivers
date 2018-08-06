import Snabbdom from 'snabbdom-pragma';
import {Observable} from 'rxjs/Observable';
import xs from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {Goal, GoalStatus, Status} from './types'
import {initGoal} from './utils'


function SpeechbubbleAction(sources) {
  // Create action stream
  type Action = {
    type: string,
    value: Goal | string,
  };

  const goal$ = (
    (sources.goal instanceof Observable) ? xs.from(sources.goal) : sources.goal
  ).map(goal => {
    if (goal === null) {
      return {
        type: 'CANCEL',
        value: null,
      };
    } else {
      return {
        type: 'GOAL',
        value: initGoal(goal),
      }
    }
  });
  let click$ = sources.DOM.select('.choices').events('click', {preventDefault: true});
  click$ = (
    click$ instanceof Observable ? xs.from(click$) : click$
  ).map((event: Event) => {
    return {
      type: 'CLICK',
      value: (event.target as HTMLButtonElement).textContent,
    }
  });
  const action$ = xs.merge(goal$, click$);

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
        id: ''
      },
      status: Status.SUCCEEDED,
    },
  };

  const state$ = action$.fold((state: State, action: Action): State => {
    console.debug('Speechbubble state', state, 'action', action);
    if (action.type === 'GOAL' || action.type === 'CANCEL') {
      let goal: Goal = state.goal;
      let status: GoalStatus = state.status;
      if (state.status.status === Status.ACTIVE) {  // preempt the goal
        status = {
          goal_id: state.status.goal_id,
          status: Status.PREEMPTED,
        };
        statusListener && statusListener.next(status);
        resultListener && resultListener.next({
          status: Status.PREEMPTED,
          result: null,
        });
      }
      if (action.type === 'GOAL') { // send a new goal
        goal = (action.value as Goal);
        status = {
          goal_id: goal.goal_id,
          status: Status.ACTIVE,
        };
        statusListener && statusListener.next(status);
      }
      return {
        goal,
        status,
      }
    } else if (action.type === 'CLICK') {
      const goal: Goal = state.goal;
      const status: GoalStatus = {
        goal_id: goal.goal_id,
        status: Status.SUCCEEDED,
      };
      statusListener && statusListener.next(status);
      resultListener && resultListener.next({
        status,
        result: (action.value as string),
      });
      return {
        goal,
        status,
      };
    } else {
      console.warn(`returning "state" as is for action.type: ${action.type}`);
      return state;
    }
  }, initialState);

  // Create view stream
  const vdom$ = state$.map((state: State) => {
    const innerDOM = (() => {
      if (state.status.status === Status.ACTIVE) {
        switch ((state.goal as Goal).goal.type) {
          case 'message':
            return (<span>{(state.goal as Goal).goal.value}</span>);
          case 'choices':
            return (
              <span>{(state.goal as Goal).goal.value.map((text) => (
                <button className="choices">{text}</button>
              ))}</span>
            );
        }
      } else {
        return null;
      }
    })();
    return innerDOM;
  });

  return {
    DOM: vdom$,
    status: adapt(status$),
    result: adapt(result$),
  };
}

const IsolatedSpeechbubbleAction = function(sources) {
  return isolate(SpeechbubbleAction)(sources);
};

export {
  SpeechbubbleAction,
  IsolatedSpeechbubbleAction,
};

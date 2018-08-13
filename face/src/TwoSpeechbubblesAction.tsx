import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import pairwise from 'xstream/extra/pairwise'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {
  GoalID, Goal, Status, GoalStatus, Result,
  generateGoalID, initGoal, isEqual, powerup,
} from '@cycle-robot-drivers/action'
import {IsolatedSpeechbubbleAction} from './SpeechbubbleAction'

function main(sources) {
  sources.proxies = {
    firstGoal: xs.create(),
    secondGoal: xs.create(),
  };

  const first = IsolatedSpeechbubbleAction({
    DOM: sources.DOM,
    goal: sources.proxies.firstGoal,
  });
  const second = IsolatedSpeechbubbleAction({
    DOM: sources.DOM,
    goal: sources.proxies.secondGoal,
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
          goal_id: goal.goal_id,
          goal: goal.goal,
          status: Status.ACTIVE,
          result: null,
        };
      } else if (action.type === 'CANCEL') {
        console.debug('Ignore CANCEL in DONE states');
        return state;
      } else if (
        action.type === 'FIRST_RESULT' || action.type === 'SECOND_RESULT'
      ) {
        console.debug('Ignore FIRST_RESULT and SECOND_RESULT in DONE states');
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
      } else if (action.type === 'FIRST_RESULT') {
        console.debug('Ignore FIRST_RESULT in ACTIVE state');
        return state;
      } else if (action.type === 'SECOND_RESULT') {
        if (state.goal.type === 'ASK_QUESTION') {
          return {
            ...state,
            goal: null,
            status: Status.SUCCEEDED,
            result: (action.value as Result).result,
          };
        } else {
          console.debug('Ignore SECOND_RESULT in ACTIVE & !ASK_QUESTION state');
        return state;
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
    .filter(([prev, cur]) => (
      cur.status !== prev.status || !isEqual(cur.goal_id, prev.goal_id)
    ))
    .map(([prev, cur]) => cur);

  const status$ = stateStatusChanged$
    .filter(state => state.status !== Status.PREEMPTING)
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

  const goals$ = stateStatusChanged$.filter(state => (
    state.status === Status.ACTIVE || state.status === Status.PREEMPTED
  )).map(state => {
    if (!state.goal) {
      return {
        first: null,
        second: null,
      };
    }
    switch (state.goal.type) {
      case 'SET_MESSAGE':
        return {
          first: {
            goal_id: state.goal_id,
            goal: {
              type: 'MESSAGE',
              value: state.goal.value,
            },
          },
          second: null,
        };
      case 'ASK_QUESTION':
        return {
          first: {
            goal_id: state.goal_id,
            goal: {
              type: 'MESSAGE',
              value: state.goal.value[0],
            },
          },
          second: {
            goal_id: state.goal_id,
            goal: {
              type: 'CHOICE',
              value: state.goal.value[1],
            },
          },
        };
    };
  });
  const firstGoal$ = goals$.map(state => state.first);
  const secondGoal$ = goals$.map(state => state.second);

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
    status: adapt(status$),
    result: adapt(result$),
    targets: {
      firstGoal: firstGoal$,
      secondGoal: secondGoal$
    },
  };
}

export function TwoSpeechbubblesAction(sources) {
  return powerup(main, (proxy, target) => proxy.imitate(target))(sources);
}

export function IsolatedTwoSpeechbubblesAction(sources) {
  return isolate(TwoSpeechbubblesAction)(sources);
};

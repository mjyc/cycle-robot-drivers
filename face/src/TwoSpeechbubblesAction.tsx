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
          status: ExtraStatus.PREEMPTING,
        };
      }
    } else if (state.status === ExtraStatus.PREEMPTING) {
      if ((action.type === 'FIRST_RESULT' || action.type === 'SECOND_RESULT')
          && (action.value as Result).status.status === Status.PREEMPTED) {
        const preemptedState = {
          ...state,
          status: Status.PREEMPTED,
          result: (action.value as Result).result,  // null
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
        }
        return preemptedState;
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

  const targets = {
    firstGoal: stateStatusChanged$.map(state => {
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
      }),
    secondGoal: stateStatusChanged$.map(state => {
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
    }),
  };

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
    targets: targets,
  };
}

export function TwoSpeechbubblesAction(sources) {
  return powerup(main, (proxy, target) => proxy.imitate(target))(sources);
}

export function IsolatedTwoSpeechbubblesAction(sources) {
  return isolate(TwoSpeechbubblesAction)(sources);
};

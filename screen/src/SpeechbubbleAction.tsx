import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {MemoryStream} from 'xstream';  // to return MemoryType in SpeechbubbleAction; for typescript 2.8.x
import dropRepeats from 'xstream/extra/dropRepeats';
import {adapt} from '@cycle/run/lib/adapt';
import isolate from '@cycle/isolate';
import {
  GoalID, Goal, GoalStatus, Status, Result,
  generateGoalID, initGoal, isEqual,
} from '@cycle-robot-drivers/action';

export enum SpeechbubbleType {
  MESSAGE = 'MESSAGE',
  CHOICE = 'CHOICE',
}

export function SpeechbubbleAction(sources) {
  // Create action stream
  type Action = {
    type: string,
    value: Goal | string | boolean,
  };

  const goal$ = xs.fromObservable(
    sources.goal
  ).filter(goal => typeof goal !== 'undefined').map(goal => {
    if (goal === null) {
      return {
        type: 'CANCEL',
        value: null,
      };
    } else {
      const value = !!(goal as any).goal_id ? goal as any: initGoal(goal);
      return {
        type: 'GOAL',
        value: !value.goal.type ? {
          goal_id: value.goal_id,
          goal: {
            type: typeof value.goal === 'string'
              ? SpeechbubbleType.MESSAGE
              : SpeechbubbleType.CHOICE,
            value: value.goal,
          },
        } : value,
      };
    }
  });
  // IMPORTANT!! force creating the click stream
  let click$ = sources.DOM.select('.choice').elements()
    .map(b => sources.DOM.select('.choice').events('click', {
      preventDefault: true
    })).flatten();
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
          goal_id: goal.goal_id,
          goal: goal.goal,
          status: Status.ACTIVE,
          result: null,
        };
      } else if (action.type === 'CANCEL') {
        console.debug('Ignore CANCEL in DONE states');
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
          case SpeechbubbleType.MESSAGE:
            return (<span>{state.goal.value}</span>);
          case SpeechbubbleType.CHOICE:
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
  // IMPORTANT!! manually empty vdom$ stream to prevent the unexpected behavior
  vdom$.addListener({next: vdom => {}});

  const stateStatusChanged$ = state$
    .compose(dropRepeats(
      (x, y) => (x.status === y.status && isEqual(x.goal_id, y.goal_id))));

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
}

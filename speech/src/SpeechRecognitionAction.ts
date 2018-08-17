import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {
  GoalID, Goal, GoalStatus, Status, Result,
  generateGoalID, initGoal, isEqual,
} from '@cycle-robot-drivers/action'


export function SpeechRecognitionAction(sources) {
  // Create action stream
  type Action = {
    type: string,
    value: Goal | SpeechRecognitionError | SpeechRecognitionEvent | string,
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
    sources.SpeechRecognition.events('end').map(
      event => ({type: 'END', value: event})
    ),
    sources.SpeechRecognition.events('error').map(
      event => ({type: 'ERROR', value: event})
    ),
    sources.SpeechRecognition.events('result').map(
      event => ({type: 'RESULT', value: event})
    ),
    sources.SpeechRecognition.events('start').map(
      event => ({type: 'START', value: event})
    ),
  );
  const action$ = xs.merge(goal$, events$);

  // Create status stream
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
      } else if (action.type === 'CANCEL') {
        console.debug('Ignore CANCEL in DONE states');
        return state;
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
      } else if (action.type === 'RESULT') {
        const event = (action.value as SpeechRecognitionEvent);
        const last = event.results.length - 1;
        const result = event.results[last][0].transcript;
        return {
          ...state,
          result,
        }
      } else if (action.type === 'ERROR') {
        const event = (action.value as SpeechRecognitionError);
        return {
          ...state,
          result: event.error,  // "no-speech"
        }
      } else if (action.type === 'END') {
        // set result to '' when ended without hearing anything
        return {
          ...state,
          status: Status.SUCCEEDED,
          result: state.result ? state.result : '',
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
        const preemptedState = {
          ...state,
          status: Status.PREEMPTED,
          newGoal: null,
        }
        if (state.newGoal) {
          state$.shamefullySendNext(preemptedState);
          return {
            goal_id: state.newGoal.goal_id,
            goal: state.newGoal.goal,
            status: Status.PENDING,
            result: null,
            newGoal: null,
          }
        } else {
          return preemptedState;
        }
      } else if (action.type === 'ERROR') {
        console.debug('Ignore ERROR in PREEMPTING state');
        return state;
      } else if (action.type === 'START') {
        throw Error('Cannot start recognition while trying to preempt it; ' +
          'probably sent two goals too close to each other');
      }
    }
    console.warn(
      `Unhandled state.status ${state.status} action.type ${action.type}`
    );
    return state;
  }, initialState);


  // Prepare outgoing streams
  const stateStatusChanged$ = state$
    .compose(dropRepeats(
      (x, y) => (x.status === y.status && isEqual(x.goal_id, y.goal_id))));

  const value$ = stateStatusChanged$
    .filter(state => (state.status === Status.PENDING
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


  return {
    value: adapt(value$),
    status: adapt(status$),
    result: adapt(result$),
  };
}

export function IsolatedSpeechRecognitionAction(sources) {
  return isolate(SpeechRecognitionAction)(sources);
};

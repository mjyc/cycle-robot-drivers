import xs from 'xstream'
import {Stream} from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {
  GoalID, Goal, GoalStatus, Status, Result,
  generateGoalID, initGoal, isEqual,
} from '@cycle-robot-drivers/action'

type Reducer = (prev?: State) => State | undefined;

enum StateType {
  RUNNING = 'RUNNING',
  DONE = 'DONE',
};

enum ExtraStatus {
  PREEMPTING = 'PREEMPTING',
};

type State = {
  state: StateType,
  goal_id: GoalID,
  goal: any,
  status: Status | ExtraStatus,
  result: any,
};

enum InputType {
  GOAL = 'GOAL',
  CANCEL = 'CANCEL',
  START = 'START',
  END = 'END',
}

type Input = {
  type: InputType,
  value: Goal,
}

// NOTE: consider creating "EventSource"
function input(goalO, startEventO, endEventO) {
  return xs.merge(
    xs.fromObservable(goalO).map(goal => {
      if (goal === null) {
        return {
          type: InputType.CANCEL,
          value: null,  // goal MUST BE null on CANCEL
        };
      } else {
        return {
          type: InputType.GOAL,
          value: (goal as any).goal_id ? goal : initGoal(goal),
        };
      }
    }),
    xs.fromObservable(startEventO).mapTo({type: InputType.START, value: null}),
    xs.fromObservable(endEventO).mapTo({type: InputType.END, value: null}),
  );
}

const transitionTable = {
  [StateType.DONE]: {
    [InputType.GOAL]: StateType.RUNNING,
  },
  [StateType.RUNNING]: {
    [InputType.END]: StateType.DONE,
  },
};

function transition(prev: State, input: Input): State {
  const states = transitionTable[prev.state];
  if (!states) {
    console.debug(`Invalid prev.state: "${prev.state}"; returning prev`);
    return prev;
  }
  const state = states[input.type];
  if (!state) {
    console.debug(`Invalid input.type: "${input.type}"; returning prev`);
    return prev;
  }

  if (prev.state === StateType.DONE && state === StateType.RUNNING) {
    const goal = input.value;
    return {
      state,
      goal_id: goal.goal_id,
      goal: goal.goal,
      status: Status.ACTIVE,
      result: null,
    };
  }

  console.warn(`Unknow status: ${state}; returning prev`);
  return prev;
}

function transitionReducer(input$) {
  const initReducer$ = xs.of(function initReducer(prev: State): State {
    return {
      state: StateType.DONE,
      goal: null,
      goal_id: generateGoalID(),
      result: null,
      status: Status.SUCCEEDED,
    };
  });

  const inputReducer$ = input$
    .map(input => function inputReducer(prev: State): State {
      return transition(prev, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

export function SpeechSynthesisAction(sources) {

  const input$ = input(
    sources.goal,
    sources.SpeechSynthesis.events('start'),
    sources.SpeechSynthesis.events('end'),
  );

  const state$ = transitionReducer(input$)
    .fold((state: State, reducer: Reducer) => reducer(state), null);

  return {
    value: adapt(xs.of('value')),
    status: adapt(xs.of('status')),
    result: adapt(state$),
  };
}

export function IsolatedSpeechSynthesisAction(sources) {
  return isolate(SpeechSynthesisAction)(sources);
};

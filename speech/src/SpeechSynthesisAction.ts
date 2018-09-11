import xs from 'xstream'
import {Stream} from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {
  GoalID, Goal, GoalStatus, Status, Result,
  generateGoalID, initGoal, isEqual,
} from '@cycle-robot-drivers/action'

enum State {
  RUNNING = 'RUNNING',
  DONE = 'DONE',
}

enum ExtraStatus {
  PREEMPTING = 'PREEMPTING',
}

type Variables = {
  goal_id: GoalID,
  goal: any,
  status: Status | ExtraStatus,
  result: any,
};

type ReducerState = {
  state: State,
  variables: Variables,
  output: any,
};

type Reducer = (prev?: ReducerState) => ReducerState | undefined;

enum InputType {
  GOAL = 'GOAL',
  CANCEL = 'CANCEL',
  START = 'START',
  END = 'END',
}

type Input = {
  type: InputType,
  value: Goal,
};


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
  [State.DONE]: {
    [InputType.GOAL]: State.RUNNING,
  },
  [State.RUNNING]: {
    [InputType.END]: State.DONE,
  },
};

function transition(
  state: State, variables: Variables, input: Input
): ReducerState {
  const newStates = transitionTable[state];
  if (!newStates) {
    throw new Error(`Invalid state: "${state}"`);
  }
  const newState = newStates[input.type];
  if (!newState) {
    throw new Error(`Invalid input.type: "${input.type}"`);
  }

  if (state === State.DONE && newState === State.RUNNING) {
    const goal = input.value;
    return {
      state: newState,
      variables: {
        goal_id: goal.goal_id,
        goal: goal.goal,
        status: Status.ACTIVE,
        result: null,
      },
      output: {
      },
    };
  }

  throw new Error(`Invalid transition`);
}

function transitionReducer(input$): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev) {
      return {
        state: State.DONE,
        variables: {
          goal: null,
          goal_id: null,
          result: null,
          status: Status.SUCCEEDED,
        },
        output: null,
      }
    }
  );

  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev) {
      // const cur = ;
      // return !!cur ? cur : prev;
      return transition(prev.state, prev.variables, input);
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
    .fold((state: ReducerState, reducer: Reducer) => reducer(state), null);

  return {
    value: adapt(xs.of('value')),
    status: adapt(xs.of('status')),
    result: adapt(state$),
  };
}

export function IsolatedSpeechSynthesisAction(sources) {
  return isolate(SpeechSynthesisAction)(sources);
};

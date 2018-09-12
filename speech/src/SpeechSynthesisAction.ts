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
  PREEMPTING = 'PREEMPTING',
}

type Variables = {
  goal_id: GoalID,
};

type Outputs = {
  args: any,
};

type ReducerState = {
  state: State,
  variables: Variables,
  outputs: Outputs,
  result: Result,
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
    [InputType.CANCEL]: State.PREEMPTING,
    [InputType.START]: State.RUNNING,
    [InputType.END]: State.DONE,
  },
  [State.PREEMPTING]: {
    [InputType.END]: State.DONE,
  }
};

function transition(
  prevState: State, prevVariables: Variables, input: Input
): ReducerState {
  const states = transitionTable[prevState];
  if (!states) {
    throw new Error(`Invalid prevState: "${prevState}"`);
  }
  const state = states[input.type];
  if (!state) {
    throw new Error(`Invalid input.type: "${input.type}"`);
  }

  let newVariables = prevVariables;
  if (prevState === State.DONE && state === State.RUNNING) {
    const goal = input.value;
    return {
      state,
      variables: {
        goal_id: goal.goal_id,
      },
      outputs: {
        args: goal.goal
      },
      result: null,
    };
  } else if (state === State.DONE) {
    if (prevState === State.RUNNING || prevState === State.PREEMPTING) {
      return {
        state,
        variables: {
          goal_id: null,
        },
        outputs: null,
        result: {
          status: {
            goal_id: prevVariables.goal_id,
            status: prevState === State.RUNNING
              ? Status.SUCCEEDED : Status.PREEMPTED,
          },
          result: null,
        },
      };
    }
  } else if (state === State.PREEMPTING) {
    return {
      state,
      variables: prevVariables,
      outputs: {
        args: null
      },
      result: null,
    }
  }

  return {
    state: prevState,
    variables: prevVariables,
    outputs: null,
    result: null,
  };
}

function transitionReducer(input$): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev) {
      return {
        state: State.DONE,
        variables: {
          goal_id: null,
        },
        outputs: null,
        result: null,
      }
    }
  );

  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev) {
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
    .fold((state: ReducerState, reducer: Reducer) => reducer(state), null).debug();
  const outputs$ = state$.map(state => state.outputs)
    .filter(outputs => !!outputs);
  const result$ = state$.map(state => state.result);

  return {
    outputs: {
      args: adapt(outputs$.map(outputs => outputs.args)),
    },
    result: adapt(result$),
  };
}

export function IsolatedSpeechSynthesisAction(sources) {
  return isolate(SpeechSynthesisAction)(sources);
};

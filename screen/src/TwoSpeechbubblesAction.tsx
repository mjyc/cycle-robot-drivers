import xs from 'xstream';
import {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import isolate from '@cycle/isolate';
import {
  GoalID, Goal, Status, Result, initGoal,
} from '@cycle-robot-drivers/action';


enum State {
  RUNNING = 'RUNNING',
  DONE = 'DONE',
}

type Variables = {
  goal_id: GoalID,
  goal: Goal,
  newGoal: Goal,
};

type Outputs = {
  DOM: {
    goal: any,
  },
  result: Result,
};

type Machine = {
  state: State,
  variables: Variables,
  outputs: Outputs,
};

type Reducer = (machine?: Machine) => Machine | undefined;

enum InputType {
  GOAL = 'GOAL',
  CANCEL = 'CANCEL',
  CLICK = 'CLICK',
}

type Input = {
  type: InputType,
  value: Goal,
};


export enum TwoSpeechbubblesType {
  SET_MESSAGE = 'SET_MESSAGE',
  ASK_QUESTION = 'ASK_QUESTION',
}

function input(goal$: Stream<any>): Stream<Input> {
  return xs.merge(
    goal$.filter(goal => typeof goal !== 'undefined').map(goal => {
      if (goal === null) {
        return {
          type: InputType.CANCEL,
          value: null,  // means "cancel"
        };
      } else {
        const value = !!(goal as any).goal_id ? goal : initGoal(goal);
        return {
          type: InputType.GOAL,
          value: typeof value.goal === 'string'
            ? {
              goal_id: value.goal_id,
              goal: {type: TwoSpeechbubblesType.SET_MESSAGE, value: value.goal},
            } : Array.isArray(value.goal)
              ? {
                goal_id: value.goal_id,
                goal: {type: TwoSpeechbubblesType.ASK_QUESTION, value: value.goal},
              } : value.goal,  // {type: string, value: string | [string]}
        };
      }
    }),
  );
}

function createTraxnsition() {
  const transitionTable = {
    [State.DONE]: {
      [InputType.GOAL]: () => {},
    },
  };

  return function(state, variables, input) {
    return !transitionTable[state]
      ? state
      : !transitionTable[state][input.type]
        ? state
        : transitionTable[state][input.type](variables, input.value);
  }
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(machine: Machine): Machine {
      return {
        state: State.DONE,
        variables: {
          goal_id: null,
          goal: null,
          newGoal: null,
        },
        outputs: null,
      }
    }
  );

  const transition = createTraxnsition();
  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(machine: Machine): Machine {
      return transition(machine.state, machine.variables, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

function output(machine$) {
  const outputs$ = machine$
    .filter(machine => !!machine.outputs)
    .map(machine => machine.outputs);

  return {
    result: adapt(outputs$
      .filter(outputs => !!outputs.result)
      .map(outputs => outputs.result)
    ),
  };
}

export function TwoSpeechbubblesAction(sources: {
  goal: any,
}): {
  result: any,
} {
  const input$ = input(xs.fromObservable(sources.goal));

  const machine$ = transitionReducer(input$)
    .fold((state: Machine, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null";

  const sinks = output(machine$);
  return sinks;
}

export function IsolatedTwoSpeechbubblesAction(sources) {
  return isolate(TwoSpeechbubblesAction)(sources);
}

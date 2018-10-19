import xs from 'xstream';
import {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import isolate from '@cycle/isolate';
import {div} from '@cycle/dom';
import {VNode} from '@cycle/dom';
import {powerup} from '@cycle-robot-drivers/action';
import {
  GoalID, Goal, Status, Result, initGoal,
} from '@cycle-robot-drivers/action';
import { IsolatedSpeechbubbleAction } from './SpeechbubbleAction';


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
  HDOM = 'HDOM',
  RDOM = 'RDOM',
}

type Input = {
  type: InputType,
  // value: Goal,
  value: any,
};


export enum TwoSpeechbubblesType {
  SET_MESSAGE = 'SET_MESSAGE',
  ASK_QUESTION = 'ASK_QUESTION',
}

function input(
  goal$: Stream<any>,
  humanSpeechbubbleSource: any,
  robotSpeechbubbleSource: any,
): Stream<Input> {
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
          value: !value.goal.type ? {
            goal_id: value.goal_id,
            goal: {
              type: typeof value.goal === 'string'
                ? TwoSpeechbubblesType.SET_MESSAGE
                : TwoSpeechbubblesType.ASK_QUESTION,
              value: value.goal,
            }
          } : value,  // {type: string, value: string | {message: string, choices: [string]}}
        };
      }
    }),
    (humanSpeechbubbleSource.DOM as Stream<any>)
      .mapTo({type: InputType.HDOM, value: null}),
    // humanSpeechbubbleSource.DOM.map(DOM => ({type: InputType.HDOM, value: DOM})),
    // robotSpeechbubbleSource.DOM.map(DOM => ({type: InputType.RDOM, value: DOM})),
    // humanSpeechbubbleOutput$.map(DOM => ({type: 'HDOM', value: DOM})),
    // robotSpeechbubbleOutput$.map(DOM => ({type: 'HDOM', value: DOM})),
  )
}

function createTransition() {
  const transitionTable = {
    [State.DONE]: {
      [InputType.GOAL]: (variables, inputValue) => ({
        state: State.RUNNING,
        variables: {
          goal_id: inputValue.goal_id,
          goal: inputValue.goal,
          newGoal: null,
        },
        outputs: {
          RobotSpeechbubble: {

          },
          HumanSpeechbubble: {
            
          },
          // DOM: {            
          //   goal: div([]),
          // },
        },
      }),
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

  const transition = createTransition();
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
    DOM: adapt(outputs$
      .filter(outputs => !!outputs.DOM)
      .map(outputs => outputs.DOM)
      .startWith(null)
    ),
    result: adapt(outputs$
      .filter(outputs => !!outputs.result)
      .map(outputs => outputs.result)
    ),
    RobotSpeechbubble: adapt(outputs$
      .filter(outputs => !!outputs.RobotSpeechbubble)
      .map(outputs => outputs.RobotSpeechbubble)
    ),
    HumanSpeechbubble: adapt(outputs$
      .filter(outputs => !!outputs.HumanSpeechbubble)
      .map(outputs => outputs.HumanSpeechbubble)
    ),
  };
}

function main(sources: {
  goal: any,
  RobotSpeechbubble: any,
  HumanSpeechbubble: any,
}): {
  DOM: any,
  result: any,
  RobotSpeechbubble: any,
  HumanSpeechbubble: any,
} {
  const input$ = input(
    xs.fromObservable(sources.goal),
    sources.RobotSpeechbubble,
    sources.HumanSpeechbubble,
  );

  const machine$ = transitionReducer(input$)
    .fold((state: Machine, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null";

  const sinks = output(machine$);
  return sinks;
}

function wrappedMain(sources) {
  sources.proxies = {
    RobotSpeechbubble: xs.create(),
    HumanSpeechbubble: xs.create(),
  },
  sources.RobotSpeechbubble = IsolatedSpeechbubbleAction({
    goal: sources.proxies.RobotSpeechbubble,
    DOM: sources.DOM,
  });
  sources.HumanSpeechbubble = IsolatedSpeechbubbleAction({
    goal: sources.proxies.HumanSpeechbubble,
    DOM: sources.DOM,
  });

  return (() => {
    const {
      DOM,
      result,
      RobotSpeechbubble,
      HumanSpeechbubble,
    } = main(sources) || {
      DOM: null,
      result: null,
      RobotSpeechbubble: null,
      HumanSpeechbubble: null,
    };
    if (!DOM || !result || !RobotSpeechbubble || !HumanSpeechbubble) {
      throw new Error('Error!');
    }
    return {
      DOM,
      result,
      targets: {
        RobotSpeechbubble,
        HumanSpeechbubble,
      },
    };
  })();
}

export const TwoSpeechbubblesAction = powerup(
  wrappedMain as any, (proxy, target) => !!target && proxy.imitate(target)
);

export function IsolatedTwoSpeechbubblesAction(sources) {
  return isolate(TwoSpeechbubblesAction)(sources);
}

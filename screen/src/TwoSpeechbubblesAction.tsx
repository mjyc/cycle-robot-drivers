import xs from 'xstream';
import {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import isolate from '@cycle/isolate';
import {div, span} from '@cycle/dom';
import {
  GoalID, Goal, Status, Result, initGoal, isEqual,
} from '@cycle-robot-drivers/action';
import { IsolatedSpeechbubbleAction } from './SpeechbubbleAction';


enum State {
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  PREEMPTING = 'PREEMPTING',
}

type Variables = {
  goal_id: GoalID,
  numActions: number,
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
  ROBOTSB_RESULT = 'ROBOTSB_RESULT',
  HUMANSB_RESULT = 'HUMANSB_RESULT',  // TODO: merge the two
}

type Input = {
  type: InputType,
  value: Goal | Result,
};


export enum TwoSpeechbubblesType {
  SET_MESSAGE = 'SET_MESSAGE',
  ASK_QUESTION = 'ASK_QUESTION',
}

function input(
  goal$: Stream<any>,
  robotSpeechbubbleResult: Stream<any>,
  humanSpeechbubbleResult: Stream<any>,
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
    robotSpeechbubbleResult.map(result => ({
      type: InputType.ROBOTSB_RESULT,
      value: result,
    })),
    humanSpeechbubbleResult.map(result => ({
      type: InputType.HUMANSB_RESULT,
      value: result,
    })),
  )
}

function createTransition() {
  const transitionTable = {
    [State.DONE]: {
      [InputType.GOAL]: (variables, inputValue) => ({
        state: State.RUNNING,  // TODO: condition this
        variables: {
          goal_id: inputValue.goal_id,  // TODO: condition this
          numActions: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE
            ? 1 : inputValue.goal.type === TwoSpeechbubblesType.ASK_QUESTION
              ? 2 : 0,  // 0 for unknown type
          newGoal: null,
        },
        outputs: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE
        ? {
          RobotSpeechbubble: {  // TODO: use goals
            goal_id: inputValue.goal_id,
            goal: inputValue.goal.value
          },
        } : inputValue.goal.type === TwoSpeechbubblesType.ASK_QUESTION
          ? {
            RobotSpeechbubble: {
              goal_id: inputValue.goal_id,
              goal: inputValue.goal.value.message
            },
            HumanSpeechbubble: {
              goal_id: inputValue.goal_id,
              goal: inputValue.goal.value.choices
            },
          } : null,  // null for unknown type
      }),
    },
    [State.RUNNING]: {
      [InputType.CANCEL]: (variables, inputValue) => ({
        state: State.PREEMPTING,
        variables,
        outputs: {
          RobotSpeechbubble: null,
          HumanSpeechbubble: null,
        }
      }),
    },
    [State.PREEMPTING]: {
      [InputType.ROBOTSB_RESULT]: (variables, inputValue) =>
        isEqual(inputValue.status.goal_id, variables.goal_id)
        ? {
          state: variables.numActions > 1 ? State.PREEMPTING : State.DONE,
          variables: {
            goal_id: variables.numActions > 1 ? variables.goal_id : null,
            numActions: variables.numActions - 1,
          },
          outputs: variables.numActions > 1 ? null : {result: {
            status: {
              goal_id: variables.goal_id,
              status: Status.PREEMPTED,
            },
            result: null,
          }},
        } : null,
      [InputType.HUMANSB_RESULT]: (variables, inputValue) =>  // combine with robot
        isEqual(inputValue.status.goal_id, variables.goal_id)
        ? {
          state: variables.numActions > 1 ? State.PREEMPTING : State.DONE,
          variables: {
            goal_id: variables.numActions > 1 ? variables.goal_id : null,
            numActions: variables.numActions - 1,
          },
          outputs: variables.numActions > 1 ? null : {result: {
            status: {
              goal_id: variables.goal_id,
              status: Status.PREEMPTED,
            },
            result: null,
          }},
        } : null,
    }
    // [State.RUNNING]: {
    //   [InputType.ROBOTSB_RESULT]: (variables, inputValue) => {
    //     console.log('ROBOTSB_RESULT inputValue.status', inputValue.status, variables.goal_id)
    //     return null;
    //   },
    //   [InputType.HUMANSB_RESULT]: (variables, inputValue) => {
    //     console.log('HUMANSB_RESULT inputValue.status', inputValue.status)
    //     return null;
    //   }
    // }
  };

  return function(state, variables, input) {
    console.log(state, variables, input);
    return !transitionTable[state]
      ? state
      : !transitionTable[state][input.type]
        ? state
        : transitionTable[state][input.type](variables, input.value) || state;
  }
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(machine: Machine): Machine {
      return {
        state: State.DONE,
        variables: {
          goal_id: null,
          numActions: null,  // start from 0
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
    .map(machine => machine.outputs).debug();

  return {
    result: adapt(outputs$
      .filter(outputs => !!outputs.result)
      .map(outputs => outputs.result).debug()
    ),
    RobotSpeechbubble: adapt(outputs$
      .filter(outputs => typeof(outputs.RobotSpeechbubble) !== 'undefined')
      .map(outputs => outputs.RobotSpeechbubble)
    ),
    HumanSpeechbubble: adapt(outputs$
      .filter(outputs => typeof(outputs.HumanSpeechbubble) !== 'undefined')
      .map(outputs => outputs.HumanSpeechbubble)
    ),
  };
}

export function TwoSpeechbubblesAction(sources: {
  goal: any,
  DOM: any
}): {
  DOM: any,
  result: any,
} {
  // create proxies
  const robotSpeechbubbleResult = xs.create();
  const humanSpeechbubbleResult = xs.create();

  const input$ = input(
    xs.fromObservable(sources.goal),
    robotSpeechbubbleResult,
    humanSpeechbubbleResult,
  );

  const machine$ = transitionReducer(input$)
    .fold((state: Machine, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null";

  const {
    result,
    RobotSpeechbubble,
    HumanSpeechbubble,
  } = output(machine$);

  // create sub-components
  const robotSpeechbubble = IsolatedSpeechbubbleAction({
    goal: RobotSpeechbubble,
    DOM: sources.DOM,
  });
  const humanSpeechbubble = IsolatedSpeechbubbleAction({
    goal: HumanSpeechbubble,
    DOM: sources.DOM,
  });
  // connect proxies
  robotSpeechbubbleResult.imitate(robotSpeechbubble.result);
  humanSpeechbubbleResult.imitate(humanSpeechbubble.result);

  const vdom$ = xs.combine(robotSpeechbubble.DOM, humanSpeechbubble.DOM)
    .map(([robotVTree, humanVTree]) => div([
      div([span('Robot:'), span(robotVTree)]),
      div([span('Human:'), span(humanVTree)]),
    ]));

  return {
    DOM: vdom$,
    result,
  };
}

export function IsolatedTwoSpeechbubblesAction(sources) {
  return isolate(TwoSpeechbubblesAction)(sources);
}

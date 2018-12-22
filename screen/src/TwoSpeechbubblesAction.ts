import xs from 'xstream';
import {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import isolate from '@cycle/isolate';
import {div, span, DOMSource} from '@cycle/dom';
import {
  GoalID, Goal, Status, Result, ActionSinks, initGoal, isEqual,
} from '@cycle-robot-drivers/action';
import {IsolatedSpeechbubbleAction} from './SpeechbubbleAction';


enum State {
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  PREEMPTING = 'PREEMPTING',
}

type Variables = {
  goal_id: GoalID,
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
  RESULT = 'RESULT',
}

type Input = {
  type: InputType,
  value: Goal | Result,
};

export interface Sources {
  goal: any,
  DOM: DOMSource,
}

export interface Sinks extends ActionSinks {
  DOM: any,
}

export enum TwoSpeechbubblesType {
  SET_MESSAGE = 'SET_MESSAGE',
  ASK_QUESTION = 'ASK_QUESTION',
}


function input(
  goal$: Stream<any>,
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
    humanSpeechbubbleResult.map(result => ({
      type: InputType.RESULT,
      value: result,
    })),
  )
}

function createTransition() {
  const transitionTable = {
    [State.DONE]: {
      [InputType.GOAL]: (variables, inputValue) => ({
        state: State.RUNNING,
        variables: {
          goal_id: inputValue.goal_id,
          newGoal: null,
        },
        outputs: {
          RobotSpeechbubble: {
            goal: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE ? {
              goal_id: inputValue.goal_id,
              goal: inputValue.goal.value,
            } : {  // TwoSpeechbubblesType.ASK_QUESTION
              goal_id: inputValue.goal_id,
              goal: inputValue.goal.value.message
            },
          },
          HumanSpeechbubble: {
            goal: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE
              ? null
              : {  // TwoSpeechbubblesType.ASK_QUESTION
                goal_id: inputValue.goal_id,
                goal: inputValue.goal.value.choices
              },
          },
        },
      })
    },
    [State.RUNNING]: {
      [InputType.GOAL]: (variables, inputValue) => {
        return {
          state: State.RUNNING,
          variables: {
            goal_id: inputValue.goal_id,
            newGoal: null,
          },
          outputs: {
            RobotSpeechbubble: {
              goal: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE ?{
                goal_id: inputValue.goal_id,
                goal: inputValue.goal.value,
              } : {  // TwoSpeechbubblesType.ASK_QUESTION
                goal_id: inputValue.goal_id,
                goal: inputValue.goal.value.message
              },
            },
            HumanSpeechbubble: {
              goal: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE
              ? null
              : {  // TwoSpeechbubblesType.ASK_QUESTION
                goal_id: inputValue.goal_id,
                goal: inputValue.goal.value.choices
              },
            },
            result: {
              status: {
                goal_id: variables.goal_id,
                status: Status.PREEMPTED,
              },
              result: null,
            },
          },
        }
      },
      [InputType.CANCEL]: (variables, inputValue) => ({
        state: State.DONE,
        variables,
        outputs: {
          RobotSpeechbubble: {goal: null},
          HumanSpeechbubble: {goal: null},
          result: {
            status: {
              goal_id: variables.goal_id,
              status: Status.PREEMPTED,
            },
            result: null,
          },
        }
      }),
      [InputType.RESULT]: (variables, inputValue) => 
        isEqual(inputValue.status.goal_id, variables.goal_id) 
        && typeof inputValue.result === 'string' ? {  // CHOICES SUCCEEDED
          state: State.DONE,
          variables: {
            goal_id: null,
            result: null,
            newGoal: null,
          },
          outputs: {
            RobotSpeechbubble: {goal: null},
            HumanSpeechbubble: {goal: null},
            result: {
              status: {
                goal_id: variables.goal_id,
                status: Status.SUCCEEDED,
              },
              result: inputValue.result,
            },
          },
        } : null,
    },
  };

  return function(state, variables, input) {
    const prev = {state, variables, outputs: null};
    return !transitionTable[state]
      ? prev
      : !transitionTable[state][input.type]
        ? prev
        : (transitionTable[state][input.type](variables, input.value) || prev);
  }
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(machine: Machine): Machine {
      return {
        state: State.DONE,
        variables: {
          goal_id: null,
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
    RobotSpeechbubble: adapt(outputs$
      .filter(outputs => !!outputs.RobotSpeechbubble)
      .map(outputs => outputs.RobotSpeechbubble.goal)
    ),
    HumanSpeechbubble: adapt(outputs$
      .filter(outputs => !!outputs.HumanSpeechbubble)
      .map(outputs => outputs.HumanSpeechbubble.goal)
    ),
    result: adapt(outputs$
      .filter(outputs => !!outputs.result)
      .map(outputs => outputs.result)
    ),
  };
}


/**
 * TwoSpeechbubbles, Robot and Human, action component.
 * 
 * @param sources
 * 
 *   * goal: a stream of `null` (as "cancel"),
 *     `{type: 'SET_MESSAGE', value: 'Hello world'}` or `'Hello world'` (as
 *     "set message"), or `{type: 'ASK_QUESTION', message: 'Blue pill or
 *     red pill?', choices: ['Blue', 'Red']}` (as "ask multiple choice").
 *   * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).
 * 
 * @return sinks
 * 
 *   * DOM: a stream of virtual DOM objects, i.e, [Snabbdom “VNode” objects](https://github.com/snabbdom/snabbdom).
 *   * result: a stream of action results.
 * 
 */

export function TwoSpeechbubblesAction(sources: Sources): Sinks {
  // create proxies
  const humanSpeechbubbleResult = xs.create();

  const input$ = input(
    xs.fromObservable(sources.goal),
    humanSpeechbubbleResult,
  );

  const machine$ = transitionReducer(input$)
    .fold((state: Machine, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null";

  const {
    RobotSpeechbubble,
    HumanSpeechbubble,
    result,
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
  // IMPORTANT!! Attach listeners to the DOM streams BEFORE connecting the
  //   proxies to have NO QUEUE in the DOM streams.
  robotSpeechbubble.DOM.addListener({next: value => {}});
  humanSpeechbubble.DOM.addListener({next: value => {}});
  // connect proxies
  humanSpeechbubbleResult.imitate(humanSpeechbubble.result);

  const styles = {
    outer: {
      position: 'absolute',
      width: '100vw',
      zIndex: 1,  // face has zIndex === 0, eyes has zIndex === 1
      margin: '1em',
    },
    bubble: {
      margin: 0,
      padding: '1em',
      maxWidth: '90%',
    },
  };
  const vdom$ = xs.combine(robotSpeechbubble.DOM, humanSpeechbubble.DOM)
    .map(([robotVTree, humanVTree]) => {
      return div({style: styles.outer}, [
        div({style: styles.bubble}, [span(robotVTree)]),
        div({style: {...styles.bubble, textAlign: 'right'}}, [span(humanVTree)]),
      ])
    });


  return {
    DOM: vdom$,
    result,
  };
}

export function IsolatedTwoSpeechbubblesAction(sources) {
  return isolate(TwoSpeechbubblesAction)(sources);
}

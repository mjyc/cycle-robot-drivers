import xs from 'xstream';
import {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import isolate from '@cycle/isolate';
import {span, button} from '@cycle/dom';
import {DOMSource} from '@cycle/dom';
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


export enum SpeechbubbleType {
  MESSAGE = 'MESSAGE',
  CHOICE = 'CHOICE',
}

function input(goal$: Stream<any>, clickEvent$: Stream<any>): Stream<Input> {
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
              goal: {type: SpeechbubbleType.MESSAGE, value: value.goal},
            } : Array.isArray(value.goal)
              ? {
                goal_id: value.goal_id,
                goal: {type: SpeechbubbleType.CHOICE, value: value.goal},
              } : value.goal,  // {type: string, value: string | [string]}
        };
      }
    }),
    clickEvent$.map(event => ({
      type: InputType.CLICK,
      value: (event.target as HTMLButtonElement).textContent as any
    })),
  );
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
          DOM: {
            goal: inputValue.goal.type === SpeechbubbleType.MESSAGE
              ? span(inputValue.goal.value)
              : inputValue.goal.type === SpeechbubbleType.CHOICE
                ? span(
                  inputValue.goal.value.map(text => button('.choice', text))
                ) : ''
          },
        },
      }),
    },
    [State.RUNNING]: {
      [InputType.GOAL]: (variables, inputValue) => ({
        state: State.RUNNING,
        variables: {
          goal_id: inputValue.goal_id,
          goal: inputValue.goal,
          newGoal: null,
        },
        outputs: {
          DOM: {
            goal: inputValue.goal.type === SpeechbubbleType.MESSAGE
              ? span(inputValue.goal.value)
              : inputValue.goal.type === SpeechbubbleType.CHOICE
                ? span(
                  inputValue.goal.value.map(text => button('.choice', text))
                ) : ''
          },
          result: {
            status: {
              goal_id: variables.goal_id,
              status: Status.PREEMPTED,
            },
            result: null,
          }
        },
      }),
      [InputType.CANCEL]: (variables, inputValue) => ({
        state: State.DONE,
        variables: {
          goal_id: null,
          goal: null,
          newGoal: null,
        },
        outputs: {
          DOM: {
            goal: '',
          },
          result: {
            status: {
              goal_id: variables.goal_id,
              status: Status.PREEMPTED,
            },
            result: null,
          }
        },
      }),
      [InputType.CLICK]: (variables, inputValue) => 
        variables.goal.type === SpeechbubbleType.CHOICE
        ? {
          state: State.DONE,
          variables: {
            goal_id: null,
            goal: inputValue.goal,
            newGoal: null,
          },
          outputs: {
            DOM: {
              goal: '',
            },
            result: {
              status: {
                goal_id: variables.goal_id,
                status: Status.SUCCEEDED,
              },
              result: inputValue,
            }
          },
        } : null,  // use prev machine
    }
  };

  return function(state, variables, input) {
    const prev = {state, variables, outputs: null};
    console.log(state, variables, input);
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
      .map(outputs => outputs.DOM.goal).startWith('')
    ),
    result: adapt(outputs$
      .filter(outputs => !!outputs.result)
      .map(outputs => outputs.result)
    ),
  };
}

/**
 * Speechbubble action component.
 * 
 * @param sources
 * 
 *   * goal: a stream of `null` (as "cancel"), `{type: 'MESSAGE', value: 'Hello world'}` for displaying message or `{type: 'MESSAGE', value: ['Hello', 'World']}` for displaying choices.
 *   * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).
 * 
 * @return sinks
 * 
 *   * DOM: a stream of virtual DOM objects, i.e, [Snabbdom “VNode” objects](https://github.com/snabbdom/snabbdom).
 *   * result: a stream of action results.
 * 
 */
export function SpeechbubbleAction(sources: {
  goal: any,
  DOM: DOMSource,
}): {
  DOM: any,
  result: any,
} {
  const input$ = input(
    xs.fromObservable(sources.goal),
    xs.fromObservable(
      sources.DOM.select('.choice').elements()
        .map(b => sources.DOM.select('.choice').events('click', {
          preventDefault: true
        }))
        .flatten()
    )
  );

  const machine$ = transitionReducer(input$)
    .fold((state: Machine, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null";

  const sinks = output(machine$);
  return sinks;
}

export function IsolatedSpeechbubbleAction(sources) {
  return isolate(SpeechbubbleAction)(sources);
}

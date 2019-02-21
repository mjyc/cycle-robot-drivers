import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {Stream} from 'xstream';
import isolate from '@cycle/isolate';
import {span, button, DOMSource, VNode} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {
  GoalID, Goal, Status, GoalStatus, Result,
  ActionSources, ActionSinks,
  generateGoalStatus, isEqualGoalStatus
} from '@cycle-robot-drivers/action';


enum State {
  RUN = 'RUN',
  WAIT = 'WAIT',
}

type Variables = {
  goal_id: GoalID,
  goal: Goal,
  newGoal: Goal,
};

type Outputs = {
  DOM: VNode,
  result: Result,
};

type ReducerState = {
  state: State,
  variables: Variables,
  outputs: Outputs,
};

type Reducer = (prev?: ReducerState) => ReducerState | undefined;

enum InputType {
  GOAL = 'GOAL',
  CANCEL = 'CANCEL',
  CLICK = 'CLICK',
}

type Input = {
  type: InputType,
  value: Goal | string,
};

export enum SpeechbubbleType {
  MESSAGE = 'MESSAGE',
  CHOICE = 'CHOICE',
}


function input(
  goal$: Stream<Goal>,
  cancel$: Stream<GoalID>,
  clickEvent$: Stream<any>,
): Stream<Input> {
  return xs.merge(
    goal$.map(goal => ({
      type: InputType.GOAL,
      value: typeof goal.goal === 'string'
        ? {
          goal_id: goal.goal_id,
          goal: {type: SpeechbubbleType.MESSAGE, value: goal.goal},
        } : Array.isArray(goal.goal)
          ? {
            goal_id: goal.goal_id,
            goal: {type: SpeechbubbleType.CHOICE, value: goal.goal},
          } : goal.goal,  // {type: string, value: string | [string]}
      })),
    cancel$.mapTo({type: InputType.CANCEL, value: null}),
    clickEvent$.map(event => ({
      type: InputType.CLICK,
      value: (event.target as HTMLButtonElement).textContent
    })),
  );
}

function createTransition(options: {
  styles?: {
    message?: object,
    button?: object,
  },
} = {}) {
  if (!options.styles) {
    options.styles = {};
  }
  if (!options.styles.message) {
    options.styles.message = {};
  }
  if (!options.styles.button) {
    options.styles.button = {};
  }

  const styles = {
    message: {
      fontFamily: 'helvetica',
      fontSize: '12.5vmin',
      fontWeight: 'lighter',
      ...options.styles.message,
    },
    button: {
      margin: '0 0.25em 0.25em 0.25em',
      backgroundColor: 'transparent',
      border: '0.05em solid black',
      borderRadius: '0.25em',
      fontFamily: 'helvetica',
      fontSize: '10vmin',
      fontWeight: 'lighter',
      ...options.styles.button,
    },
  }
  const transitionTable = {
    [State.WAIT]: {
      [InputType.GOAL]: (variables, inputValue) => ({
        state: State.RUN,
        variables: {
          goal_id: inputValue.goal_id,
          goal: inputValue.goal,
          newGoal: null,
        },
        outputs: {
          DOM: inputValue.goal.type === SpeechbubbleType.MESSAGE
            ? span({style: styles.message}, inputValue.goal.value)
            : inputValue.goal.type === SpeechbubbleType.CHOICE
              ? span(
                inputValue.goal.value.map(text => button(
                  '.choice', {style: styles.button}, text,
                ))
              ) : '',
        },
      }),
    },
    [State.RUN]: {
      [InputType.GOAL]: (variables, inputValue) => ({
        state: State.RUN,
        variables: {
          goal_id: inputValue.goal_id,
          goal: inputValue.goal,
          newGoal: null,
        },
        outputs: {
          DOM: inputValue.goal.type === SpeechbubbleType.MESSAGE
            ? span({style: styles.message}, inputValue.goal.value)
            : inputValue.goal.type === SpeechbubbleType.CHOICE
              ? span(
                inputValue.goal.value.map(text => button(
                  '.choice', {style: styles.button}, text))
              ) : '',
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
        state: State.WAIT,
        variables: {
          goal_id: null,
          goal: null,
          newGoal: null,
        },
        outputs: {
          DOM: '',
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
          state: State.WAIT,
          variables: {
            goal_id: null,
            goal: inputValue.goal,
            newGoal: null,
          },
          outputs: {
            DOM: '',
            result: {
              status: {
                goal_id: variables.goal_id,
                status: Status.SUCCEEDED,
              },
              result: inputValue,
            }
          },
        } : null,  // use prev
    }
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

function transitionReducer(input$: Stream<Input>, options = {}): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev: ReducerState): ReducerState {
      return {
        state: State.WAIT,
        variables: {
          goal_id: null,
          goal: null,
          newGoal: null,
        },
        outputs: null,
      }
    }
  );

  const transition = createTransition(options);
  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev: ReducerState): ReducerState {
      return transition(prev.state, prev.variables, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

function status(reducerState$): Stream<GoalStatus> {
  const done$: Stream<GoalStatus> = reducerState$
    .filter(rs => !!rs.outputs && !!rs.outputs.result)
    .map(rs => rs.outputs.result.status);
  const active$: Stream<GoalStatus> = reducerState$
    .filter(rs => rs.state === State.RUN)
    .map(rs => ({goal_id: rs.variables.goal_id, status: Status.ACTIVE}));
  const initGoalStatus = generateGoalStatus({status: Status.SUCCEEDED});
  return xs.merge(done$, active$)
    .compose(dropRepeats(isEqualGoalStatus))
    .startWith(initGoalStatus);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(rs => !!rs.outputs)
    .map(rs => rs.outputs);
  return {
    result: outputs$
      .filter(o => !!o.result)
      .map(o => o.result),
    DOM: outputs$
      .map(o => o.DOM)
      .startWith('')
  };
};


export interface Sources extends ActionSources {
  DOM: DOMSource,
}

export interface Sinks extends ActionSinks {
  DOM: Stream<VNode>,
}

export function makeSpeechbubbleAction(options = {}) {
  return function SpeechbubbleAction(sources: Sources): Sinks {
    const input$ = input(
      sources.goal,
      sources.cancel,
      sources.DOM.select('.choice').events('click'),
    );
    const reducer = transitionReducer(input$);;
    const status$ = status(sources.state.stream);
    const outputs = output(sources.state.stream);
    return {
      state: reducer,
      status: status$,
      ...outputs
    };
  }
}

/**
 * Speechbubble action component.
 *
 * @param sources
 *
 *   * goal: a stream of `{type: 'MESSAGE', value: 'Hello world'}`
 *     or `'Hello world'` (as "message"),
 *     or `{type: 'CHOICE', value: ['Hello', 'World']}`
 *     or `['Hello', 'World']` (as "multiple choice").
 *   * cancel: a stream of `GoalID`
 *   * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).
 *
 * @return sinks
 *
 *   * state: a reducer stream.
 *   * status: a stream of action status.
 *   * result: a stream of action results. `result.result` is always `null`.
 *   * DOM: a stream of virtual DOM objects, i.e, [Snabbdom "VNode" objects](https://github.com/snabbdom/snabbdom).
 *
 */
export let SpeechbubbleAction = makeSpeechbubbleAction();

export function IsolatedSpeechbubbleAction(sources) {
  return isolate(SpeechbubbleAction)(sources);
export function SpeechbubbleAction(sources: Sources): Sinks {
  const input$ = input(
    sources.goal,
    sources.cancel || xs.never(),
    sources.DOM.select('.choice').events('click'),
  );
  const reducer = transitionReducer(input$);;
  const status$ = status(sources.state.stream);
  const outputs = output(sources.state.stream);
  return {
    state: reducer,
    status: status$,
    ...outputs
  };
}

export function IsolatedSpeechbubbleAction(sources) {
  return isolate(SpeechbubbleAction)(sources);
}
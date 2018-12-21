import xs from 'xstream';
import {Stream} from 'xstream';
import {Reducer} from '@cycle/state';
import {initGoal, generateGoalID} from '@cycle-robot-drivers/action';

// FSM types
export enum S {
  PEND = 'PEND',
  RUN = 'RUN',
}

export enum SIGType {
  GOAL = 'GOAL',
  CANCEL = 'CANCEL',
}

export interface SIG {
  type: SIGType,
  value: any,
}

// Reducer types
export interface State {
  state: S,
  variables: {
    goal_id: any
  },
  outputs: any
}

function input(
  goal$: Stream<any>
) {
  return goal$.filter(goal => typeof goal !== 'undefined')
    .map(goal => (goal === null)
      ? ({
          type: SIGType.CANCEL,
          value: null,  // means "cancel"
        })
      : ({
          type: SIGType.GOAL,
          value: initGoal(goal),
        }));
}

function reducer(input$) {
  const initReducer$: Stream<Reducer<State>> = xs.of(function (prev) {
    if (typeof prev === 'undefined') {
      return {
        state: S.PEND,
        variables: {
          goal_id: null,
        },
        outputs: null,
      };
    } else {
      return prev;
    }
  });

  const transitionReducer$: Stream<Reducer<State>> = input$.map(input => function (prev) {
    console.debug('input', input, 'prev', prev);
    if (prev.state === S.PEND && input.type === SIGType.GOAL) {
      return {
        state: S.RUN,
        variables: {
          goal_id: input.value.goal_id,
        },
        outputs: input.value.goal,
      }
    }
    return prev;
  });

  return xs.merge(initReducer$, transitionReducer$);
}

const actionNames = ['FacialExpressionAction', 'TwoSpeechbubblesAction'];

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(m => !!m.outputs)
    .map(m => m.outputs);

  return actionNames.reduce((acc, x) => {
    acc[x] = outputs$
      .filter(o => !!o[x])
      .map(o => o[x].goal);
    return acc;
  }, {});
}

export default function AllAction(sources) {
  const reducerState$ = sources.state.stream;
  const input$ = input(sources.goal);
  const reducer$: Stream<Reducer<State>> = reducer(input$);
  const outputs = output(reducerState$)
  return {
    ...outputs,
    state: reducer$
  };
}

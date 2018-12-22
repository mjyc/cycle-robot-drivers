import xs from 'xstream';
import {Stream} from 'xstream';
import {Reducer} from '@cycle/state';
import {initGoal, isEqual, Status, Result} from '@cycle-robot-drivers/action';

// FSM types
export enum S {
  PEND = 'PEND',
  RUN = 'RUN',
}

export enum SIGType {
  GOAL = 'GOAL',
  CANCEL = 'CANCEL',
  RESULTS = 'RESULTS',
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

export function createConcurrentAction(
  actionNames: string[] = [],
  isRace: boolean = false,
) {
  const input = (
    goal$: Stream<any>,
    results: Stream<Result>[],
  ) => {
    const results$: Stream<Result[]>
      = xs.combine.apply(null, results).startWith([]);
      // TODO: update this
      // {status: {goal_id: , result: null}
      // change the strategy here
    return xs.merge(
      goal$.filter(goal => typeof goal !== 'undefined')
        .map(goal => (goal === null)
          ? ({
              type: SIGType.CANCEL,
              value: null,  // means "cancel"
            })
          : ({
              type: SIGType.GOAL,
              value: initGoal(goal),
            })),
      results$.map(r => ({type: SIGType.RESULTS, value: r})),
    );
  }
  const reducer = (input$: Stream<SIG>) => {
    const initReducer$: Stream<Reducer<State>> = xs.of(function (prev) {
      if (typeof prev === 'undefined') {
        return {
          state: S.PEND,
          variables: null,
          outputs: null,
        };
      } else {
        return prev;
      }
    });

    const transitionReducer$: Stream<Reducer<State>> = input$.map(input => function (prev) {
      console.debug('input', input, 'prev', prev);
      if (prev.state === S.PEND && input.type === SIGType.GOAL) {
        const outputs = Object.keys(input.value.goal).reduce((acc, x) => {
          acc[x] = {goal: {
            goal_id: input.value.goal_id,
            goal: input.value.goal[x]
          }};
          return acc;
        }, {});
        return {
          state: S.RUN,
          variables: {
            goal_id: input.value.goal_id,
          },
          outputs,
        }
      } else if (input.type === SIGType.RESULTS) {
        const results$ = input.value
          .map(r => isEqual(r.status.goal_id, prev.variables.goal_id));
        if (
          isRace
            ? results$.some(r => r.status.status === Status.SUCCEEDED)
            : results$.every(r => r.status.status === Status.SUCCEEDED)
        ) {
          return {
            ...prev,
            state: S.PEND,
            variables: null,
            outputs: {
              result: {
                status: {
                  goal_id: prev.variables.goal_id,
                  status: Status.ABORTED,
                },
                result: input.value,
              }
            }
          };
        } else if (
          input.value
            .map(r => isEqual(r.status.goal_id, prev.variables.goal_id))
            .every(r => r.status.status === Status.SUCCEEDED)
        ) {
          return {
            ...prev,
            state: S.PEND,
            variables: null,
            outputs: {
              result: {
                status: {
                  goal_id: prev.variables.goal_id,
                  status: Status.SUCCEEDED,
                },
                result: input.value,
              }
            }
          };
        }
      }
      return prev;
    });

    return xs.merge(initReducer$, transitionReducer$);
  }
  const output = (reducerState$: Stream<State>) => {
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

  return function ConcurrentAction(sources) {
    const reducerState$ = sources.state.stream;
    const results = actionNames.map(x => sources[x].result);
    const input$ = input(sources.goal, results);
    const reducer$: Stream<Reducer<State>> = reducer(input$);
    const outputs = output(reducerState$)
    return {
      ...outputs,
      state: reducer$
    };
  }
}

// const All2Action = createConcurrentActionFactory(actionNames, () => {

// });

// const RaceAction = createConcurrentActionFactory(actionNames, () => {

// })
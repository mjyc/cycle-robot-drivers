import xs from 'xstream';
import {Stream} from 'xstream';
import {Reducer} from '@cycle/state';
import {
  GoalID, Status, Result, initGoal, isEqual, generateGoalID
} from '@cycle-robot-drivers/action';

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
    goal_id: GoalID
  },
  outputs: {
    [actionNameOrResult: string]: any,
  },
}

export function makeConcurrentAction(
  actionNames: string[] = [],
  isRace: boolean = false,
) {
  const input = (
    goal$: Stream<any>,
    results: Stream<Result>[],
  ) => {
    const results$: Stream<Result[]>
      = xs.combine.apply(null, results);
    return xs.merge(
      goal$.filter(g => typeof g !== 'undefined').map(g => (g === null)
        ? ({type: SIGType.CANCEL, value: null})
        : ({type: SIGType.GOAL, value: initGoal(g)})),
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

    const transitionReducer$: Stream<Reducer<State>> = input$.map(input => prev => {
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
        };
      } else if (prev.state === S.RUN && input.type === SIGType.RESULTS) {
        const results = input.value;
        if (
          !isRace
          && results
            .every(r => isEqual(r.status.goal_id, prev.variables.goal_id))
          && results
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
        } else if (
          !!isRace
          && results
            .some(r => (
              isEqual(r.status.goal_id, prev.variables.goal_id)
              && r.status.status === Status.SUCCEEDED
            ))
        ) {
          const result = results.filter(r => (
            isEqual(r.status.goal_id, prev.variables.goal_id)
            && r.status.status === Status.SUCCEEDED
          ))[0];  // break the tie here
          return {
            state: S.PEND,
            variables: null,
            outputs: {
              result: {
                status: {
                  goal_id: prev.variables.goal_id,
                  status: Status.SUCCEEDED,
                },
                result: result.result,  // IDEA: {type: 'FaceExpression', value: result.result}
              },
            },
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
    }, {
      result: outputs$
        .filter(o => !!o.result)
        .map(o => o.result)
    });
  }

  return function ConcurrentAction(sources) {
    const reducerState$ = sources.state.stream;
    const createDummyResult = () => ({
      status: {
        goal_id: generateGoalID(),
        status: Status.SUCCEEDED,
      },
      result: null,
    });
    const results = actionNames
      .map(x => sources[x].result.startWith(createDummyResult()));
    const input$ = input(sources.goal, results);
    const reducer$: Stream<Reducer<State>> = reducer(input$);
    const outputs = output(reducerState$)
    return {
      ...outputs,
      state: reducer$
    };
  }
}

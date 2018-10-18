import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import isolate from '@cycle/isolate';
import {
  GoalID, Goal, Status, Result, EventSource, initGoal,
} from '@cycle-robot-drivers/action';


export enum SpeechbubbleType {
  MESSAGE = 'MESSAGE',
  CHOICE = 'CHOICE',
}


enum State {
  RUNNING = 'RUNNING',
  DONE = 'DONE',
}

type Variables = {
  goal_id: GoalID,
  newGoal: Goal,
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
}

type Input = {
  type: InputType,
  value: Goal,
};


function input(goal$: Stream<any>, clickEvent$: Stream<any>) {
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
              goal: {text: value.goal},
            } : value,
        };
      }
    }),
  );
}

// function createTransition() {
//   const transitionTable = {
//     [State.PEND]: {
//       [InputType.GOAL]: (variables) => ({
//         state: State.TELL,
//         variables,
//         outputs: {
//           SpeechSynthesisAction: {
//             goal: story[variables.index],
//           },
//         },
//       }),
//     },
//     [State.TELL]: {
//       [InputType.TELL_DONE]: (variables) => {
//         const storyIndex = variables.index + 1;
//         if (storyIndex < story.length) {
//           return {
//             state: State.TELL,
//             variables: {index: storyIndex},
//             outputs: {
//               SpeechSynthesisAction: {
//                 goal: story[storyIndex],
//               },
//             },
//           };
//         } else {  // done
//           return {
//             state: State.PEND,
//             variables: {index: storyIndex},
//             outputs: {
//               done: true,
//             },
//           };
//         }
//       }
//     }
//   };

  return function(state, variables, input) {
    return !transitionTable[state]
      ? state
      : !transitionTable[state][input.type]
        ? state
        : transitionTable[state][input.type](variables);
  }
}

function transition(
  prevState: State, prevVariables: Variables, input: Input
): ReducerState {
  return {
    state: prevState,
    variables: prevVariables,
    outputs: null,
    result: null,
  };
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$ = xs.of(
    function initReducer(prev) {
      return {
        state: State.DONE,
        variables: {
          goal_id: null,
          newGoal: null,
        },
        outputs: null,
        result: null,
      }
    }
  );

  const inputReducer$ = input$
    .map(input => function inputReducer(prev) {
      return transition(prev.state, prev.variables, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

export function SpeechbubbleAction(sources: {
  goal: any,
  SpeechSynthesis: EventSource,
}): {
  DOM: any,
  result: any,
} {
  const input$ = input(
    xs.fromObservable(sources.goal),
    xs.never(),
  );

  const state$ = transitionReducer(input$)
    .fold((state: ReducerState, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null"
  const outputs$ = state$.map(state => state.outputs)
    .filter(outputs => !!outputs);
  const result$ = state$.map(state => state.result).filter(result => !!result);

  return {
    DOM: xs.of((<span>{'hello world'}</span>)),//adapt(outputs$.map(outputs => outputs.args)),
    result: adapt(result$),
  };
}

export function IsolatedSpeechbubbleAction(sources) {
  return isolate(SpeechbubbleAction)(sources);
}

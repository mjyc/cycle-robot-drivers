import xs from 'xstream'
import {Stream} from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';
import {
  GoalID, Goal, GoalStatus, Status, Result,
  generateGoalID, initGoal, isEqual,
} from '@cycle-robot-drivers/action'


enum State {
  RUNNING = 'RUNNING',
  DONE = 'DONE',
  PENDING = 'PENDING',
  PREEMPTING = 'PREEMPTING',
}

type Variables = {
  goal_id: GoalID,
  transcript: string,
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
  START = 'START',
  END = 'END',
  ERROR = 'ERROR',
  RESULT = 'RESULT',
}

type Input = {
  type: InputType,
  value: Goal | SpeechRecognitionEvent,
};


function input(
  goal$: Stream<any>,
  startEvent$: Stream<any>,
  endEvent$: Stream<any>,
  errorEvent$: Stream<any>,
  resultEvent$: Stream<any>
) {
  return xs.merge(
    goal$.map(goal => {
      if (goal === null) {
        return {
          type: InputType.CANCEL,
          value: null,  // means "cancel"
        };
      } else {
        return {
          type: InputType.GOAL,
          value: !!(goal as any).goal_id ? goal : initGoal(goal),
        };
      }
    }),
    startEvent$.mapTo({type: InputType.START, value: null}),
    endEvent$.mapTo({type: InputType.END, value: null}),
    errorEvent$.mapTo({type: InputType.ERROR, value: null}),
    resultEvent$.map(event => ({type: InputType.RESULT, value: event})),
  );
}

const transitionTable = {
  [State.DONE]: {
    [InputType.GOAL]: State.RUNNING,
  },
  [State.RUNNING]: {
    [InputType.GOAL]: State.PREEMPTING,
    [InputType.CANCEL]: State.PREEMPTING,
    [InputType.START]: State.RUNNING,
    [InputType.END]: State.DONE,
  },
  [State.PREEMPTING]: {
    [InputType.END]: State.DONE,
  }
};

function transition(
  prevState: State, prevVariables: Variables, input: Input
): ReducerState {
  const states = transitionTable[prevState];
  if (!states) {
    throw new Error(`Invalid prevState: "${prevState}"`);
  }

  let state = states[input.type];
  if (!state) {
    console.debug(`Undefined transition for "${prevState}" "${input.type}"; `
      + `set state to prevState`);
    state = prevState;
  }

  if (prevState === State.DONE && state === State.RUNNING) {
    // Start a new goal
    const goal = (input.value as Goal);
    return {
      state,
      variables: {
        goal_id: goal.goal_id,
        transcript: null,
        newGoal: null,
      },
      outputs: {
        args: goal.goal
      },
      result: null,
    };
  } else if (
    prevState === State.RUNNING && state === State.RUNNING
  ) {
    if (input.type === InputType.RESULT) {
      const event = (input.value as SpeechRecognitionEvent);
      const last = event.results.length - 1;
      const transcript = event.results[last][0].transcript;
      return {
        state,
        variables: {
          ...prevVariables,
          transcript,
        },
        outputs: null,
        result: null,
      };
    } else if (input.type === InputType.ERROR) {
      console.debug('No speech; transcript is null');
    }
  } else if (state === State.DONE) {
    if (prevState === State.RUNNING || prevState === State.PREEMPTING) {
      // Stop the current goal and start the queued new goal
      const newGoal = prevVariables.newGoal;
      return {
        state: !!newGoal ? State.RUNNING : state,
        variables: {
          goal_id: !!newGoal ? newGoal.goal_id : null,
          transcript: null,
          newGoal: null,
        },
        outputs: !!newGoal ? {
          args: newGoal.goal,
        } : null,
        result: {
          status: {
            goal_id: prevVariables.goal_id,
            status: prevState === State.RUNNING
              ? Status.SUCCEEDED : Status.PREEMPTED,
          },
          result: prevVariables.transcript,
        },
      };
    }
  } else if (prevState === State.RUNNING && state === State.PREEMPTING) {
    // Start stopping the current goal and queue a new goal if received one
    return {
      state,
      variables: {
        ...prevVariables,
        newGoal: input.type === InputType.GOAL ? input.value as Goal : null,
      },
      outputs: {
        args: null,
      },
      result: null,
    }
  } // TODO update queue goal in certain condition

  return {
    state: prevState,
    variables: prevVariables,
    outputs: null,
    result: null,
  };
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev: ReducerState): ReducerState {
      return {
        state: State.DONE,
        variables: {
          goal_id: null,
          transcript: null,
          newGoal: null,
        },
        outputs: null,
        result: null,
      }
    }
  );

  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev: ReducerState): ReducerState {
      return transition(prev.state, prev.variables, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

export function SpeechRecognitionAction(sources) {
  const input$ = input(
    xs.fromObservable(sources.goal),
    xs.fromObservable(sources.SpeechRecognition.events('start')),
    xs.fromObservable(sources.SpeechRecognition.events('end')),
    xs.fromObservable(sources.SpeechRecognition.events('error')),
    xs.fromObservable(sources.SpeechRecognition.events('result')),
  );

  const state$ = transitionReducer(input$)
    .fold((state: ReducerState, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null"
  const outputs$ = state$.map(state => state.outputs)
    .filter(outputs => !!outputs);
  const result$ = state$.map(state => state.result).filter(result => !!result);

  return {
    output: adapt(outputs$.map(outputs => outputs.args)),
    result: adapt(result$),
  };
}

export function IsolatedSpeechRecognitionAction(sources) {
  return isolate(SpeechRecognitionAction)(sources);
};

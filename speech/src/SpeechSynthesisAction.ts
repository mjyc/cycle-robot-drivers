import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {
  GoalID, Goal, Status, GoalStatus, Result, ActionSinks, EventSource, initGoal,
} from '@cycle-robot-drivers/action';
import {UtteranceArg} from './makeSpeechSynthesisDriver';


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
}

type Input = {
  type: InputType,
  value: Goal,
};

export interface Sources {
  goal: any,
  SpeechSynthesis: EventSource,
}

export interface Sinks extends ActionSinks {
  output: any,
};

//------------------------------------------------------------------------------
export interface ActionSources {
  state: any,
  goal: Stream<Goal>,
  cancel: Stream<GoalID>,
}

export interface ActionSinks2 {
  state: any,
  feedback?: Stream<any>,
  status: Stream<GoalStatus>,
  result: Stream<Result>,
}

//------------------------------------------------------------------------------
export interface Sources2 extends ActionSources {
  SpeechSynthesis: EventSource,
}

export interface Sinks2 extends ActionSinks2 {
  SpeechSynthesis: Stream<UtteranceArg>,
};

function input2(
  goal$: Stream<Goal>,
  cancel$: Stream<GoalID>,
  startEvent$: Stream<any>,
  endEvent$: Stream<any>,
) {
  return xs.merge(
    goal$.map(goal => {
      return {
        type: InputType.GOAL,
        value: typeof goal.goal === 'string'
          ? {
            goal_id: goal.goal_id,
            goal: {text: goal.goal},
          } : goal,
      };
    }),
    cancel$.mapTo({type: InputType.CANCEL, value: null}),
    startEvent$.mapTo({type: InputType.START, value: null}),
    endEvent$.mapTo({type: InputType.END, value: null}),
  );
}

const transitionTable2 = {
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

type ReducerState2 = {
  state: State,
  variables: Variables,
  outputs: any,
  result: Result,
};

function transition2(
  prevState: State, prevVariables: Variables, input: Input
): ReducerState2 {
  const states = transitionTable2[prevState];
  if (!states) {
    throw new Error(`Invalid prevState="${prevState}"`);
  }

  let state = states[input.type];
  if (!state) {
    console.debug(`Undefined transition for "${prevState}" "${input.type}"; `
      + `set state to prevState`);
    state = prevState;
  }

  if (prevState === State.DONE && state === State.RUNNING) {
    // Start a new goal
    const goal = input.value;
    return {
      state,
      variables: {
        goal_id: goal.goal_id,
        newGoal: null,
      },
      outputs: {
        SpeechSynthesis: goal.goal
      },
      result: null,
    };
  } else if (state === State.DONE) {
    if (prevState === State.RUNNING || prevState === State.PREEMPTING) {
      // Stop the current goal and start the queued new goal
      const newGoal = prevVariables.newGoal;
      return {
        state: !!newGoal ? State.RUNNING : state,
        variables: {
          goal_id: !!newGoal ? newGoal.goal_id : null,
          newGoal: null,
        },
        outputs: !!newGoal ? {
          SpeechSynthesis: newGoal.goal,
        } : null,
        result: {
          status: {
            goal_id: prevVariables.goal_id,
            status: prevState === State.RUNNING
              ? Status.SUCCEEDED : Status.PREEMPTED,
          },
          result: null,
        },
      };
    }
  } else if (
    (prevState === State.RUNNING || prevState === State.PREEMPTING)
    && state === State.PREEMPTING
  ) {
    if (input.type === InputType.GOAL || input.type === InputType.CANCEL) {
      // Start stopping the current goal and queue a new goal if received one
      return {
        state,
        variables: {
          ...prevVariables,
          newGoal: input.type === InputType.GOAL ? input.value as Goal : null,
        },
        outputs: {
          SpeechSynthesis: null,
        },
        result: null,
      }
    }
    if (input.type === InputType.START) {
      return {
        state: state,
        variables: prevVariables,
        outputs: {
          args: null,
        },
        result: null,
      };
    }
  }

  return {
    state: prevState,
    variables: prevVariables,
    outputs: null,
    result: null,
  };
}

function transitionReducer2(input$: Stream<Input>): Stream<Reducer> {
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
      return transition2(prev.state, prev.variables, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

export function SpeechSynthesisAction2(sources: Sources2): Sinks2 {
  // const outputs = output(sources.state.stream);

  const input$ = input2(
    xs.fromObservable(sources.goal),
    xs.fromObservable(sources.cancel),
    xs.fromObservable(sources.SpeechSynthesis.events('start')),
    xs.fromObservable(sources.SpeechSynthesis.events('end')),
  );

  const reducer = transitionReducer2(input$);

  return {
    state: reducer,
    status: xs.never(),
    result: sources.state.stream.map(rs => rs.result),
    SpeechSynthesis: sources.state.stream.debug()  // TODO: create more abstract function
      .filter(rs => !!rs.outputs)
      .map(rs => rs.outputs.SpeechSynthesis),
  };
}
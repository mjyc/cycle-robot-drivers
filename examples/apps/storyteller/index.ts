// Implements the travel quiz presented at
//   http://www.nomadwallet.com/afford-travel-quiz-personality/
import xs from 'xstream';
import {Stream} from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

enum State {
  START = 'START',
  ASK = 'ASK',
  WAIT = 'WAIT',
}

type Outputs = {
  args: any,
};

type ReducerState = {
  state: State,
  outputs: Outputs,
};

type Reducer = (prev?: ReducerState) => ReducerState | undefined;

enum InputType {
  DONE = 'DONE',
}

type Input = {
  type: InputType,
  value: any
};

function input(
  load$: Stream<any>,
) {
  return xs.merge(
    load$.mapTo({type: InputType.DONE, value: null}),
  );
}

const transitionTable = {
  [State.START]: {
    [InputType.DONE]: State.WAIT,
  },
  [State.ASK]: {
    [InputType.DONE]: State.WAIT,
  },
  [State.WAIT]: {
    [InputType.DONE]: State.WAIT,
  },
};

function transition(
  prevState: State, input: Input
): ReducerState {
  const states = transitionTable[prevState];
  if (!states) {
    throw new Error(`Invalid prevState="${prevState}"`);
  }

  let state = states[input.type];
  if (!state) {
    console.debug(`Undefined transition for "${prevState}" "${input.type}"; `
      + `set state to prevState`);
    state = prevState;
  }

  return {
    state: State.START,
    outputs: null,
  };
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev: ReducerState): ReducerState {
      return {
        state: State.START,
        outputs: null,
      }
    }
  );

  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev: ReducerState): ReducerState {
      return transition(prev.state, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

function main(sources) {
  const input$ = input(
    xs.fromObservable(sources.TabletFace.load),
  );

  const state$ = transitionReducer(input$)
    .fold((state: ReducerState, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null"
  const outputs$ = state$.map(state => state.outputs)
    .filter(outputs => !!outputs);
  
  return {
    SpeechSynthesisAction: outputs$.map(outputs => outputs.args),
  };
}

runRobotProgram(main);

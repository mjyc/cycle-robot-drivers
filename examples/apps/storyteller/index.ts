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
  say: {
    args: any
  },
  listen: {
    args: any
  },
};

type ReducerState = {
  state: State,
  outputs: Outputs,
};

type Reducer = (prev?: ReducerState) => ReducerState | undefined;

enum InputType {
  DONE = 'DONE',
  RECEIVED_RESPONSE = 'RECEIVED_RESPONSE',
}

type Input = {
  type: InputType,
  value: any,
};

function input(
  load$: Stream<any>,
  speechSynthesisActionResult$: Stream<any>,  // consider passing the entire object
  speechRecognitionActionResult$: Stream<any>,  // consider passing the entire object
) {
  return xs.merge(
    load$.mapTo({type: InputType.DONE, value: null}),
    speechSynthesisActionResult$.map(result => ({type: InputType.DONE, value: result})),
    speechRecognitionActionResult$.debug().map(result => ({type: InputType.RECEIVED_RESPONSE, value: result})),
  );
}

const transitionTable = {
  [State.START]: {
    [InputType.DONE]: State.ASK,
  },
  [State.ASK]: {
    [InputType.DONE]: State.WAIT,
  },
  [State.WAIT]: {
    [InputType.RECEIVED_RESPONSE]: State.ASK,
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

  console.log(prevState, input.type, state);

  if ((prevState === State.START || prevState === State.WAIT) && state === State.ASK) {
    return {
      state,
      // variables: {
      //   goal_id: goal.goal_id,
      //   transcript: null,
      //   error: null,
      //   newGoal: null,
      // },
      outputs: {
        say: {
          args: 'Brown bear',
        },
        listen: null,
      },
    };
  } else if (prevState === State.ASK && state === State.WAIT) {
    return {
      state,
      // variables: {
      //   goal_id: goal.goal_id,
      //   transcript: null,
      //   error: null,
      //   newGoal: null,
      // },
      outputs: {
        say: null,
        listen: {
          args: {},
        }
      },
    };
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
    xs.fromObservable(sources.SpeechSynthesisAction.result),
    xs.fromObservable(sources.SpeechRecognitionAction.result),
  );

  const state$ = transitionReducer(input$)
    .fold((state: ReducerState, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null"
  const outputs$ = state$.map(state => state.outputs)
    .filter(outputs => !!outputs);
  
  return {
    SpeechSynthesisAction: outputs$.filter(outputs => !!outputs.say).map(outputs => outputs.say.args),
    SpeechRecognitionAction: outputs$.filter(outputs => !!outputs.listen).map(outputs => outputs.listen.args).debug(),
  };
}

runRobotProgram(main);

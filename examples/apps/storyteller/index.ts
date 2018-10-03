import xs from 'xstream';
import {Stream} from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';


const story = [
  "Brown bear, brown bear, what do you see? I see a red bird looking at me.",
  "Red bird, red bird, what do you see? I see a yellow duck looking at me.",
  "Yellow duck, yellow duck, what do you see? I see a blue horse looking at me.",
  "Blue horse, blue horse, what do you see? I see a green frog looking at me.",
  "Green frog, green frog, what do you see? I see a purple cat looking at me.",
  "Purple cat, purple cat, what do you see? I see a white dog looking at me.",
  "white dog, white dog, what do you see?",
  "I see a black sheep looking at me.",
  "Black sheep, black sheep , what do you see? I see a goldfish looking at me.",
  "Goldfish, goldfish, what do you see? I see a teacher looking at me.",
];


enum State {
  START = 'START',
  ASK = 'ASK',
  WAIT = 'WAIT',
}

type Variables = {
  storyIdx: number,
};

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
  variables: Variables,
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
  prevState: State, prevVariables: Variables, input: Input
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
    const storyIdx = prevVariables.storyIdx + 1;
    return {
      state,
      variables: {
        storyIdx,
      },
      outputs: {
        say: {
          args: story[storyIdx],
        },
        listen: null,
      },
    };
  } else if (prevState === State.ASK && state === State.WAIT) {
    return {
      state,
      variables: prevVariables,
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
    variables: prevVariables,
    outputs: null,
  };
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev: ReducerState): ReducerState {
      return {
        state: State.START,
        variables: {
          storyIdx: -1,
        },
        outputs: null,
      }
    }
  );

  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev: ReducerState): ReducerState {
      return transition(prev.state, prev.variables, input);
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

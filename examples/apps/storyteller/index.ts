import xs from 'xstream';
import {Stream} from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

enum State {
  START = 'START',
  TELL = 'TELL',
}


type Variables = {
  storyIdx: number,
};

type Outputs = {
  SpeechSynthesisAction: {
    goal: any
  },
};

type Machine = {
  state: State,
  variables: Variables,
  outputs: Outputs,
};

enum InputType {
  READ_DONE = 'DONE',
}

type Input = {
  type: InputType,
  value: any,
};

type Reducer = (prev?: Machine) => Machine | undefined;

function input(
  start$: Stream<boolean>,
  speechSynthesisActionSource,
  speechRecognitionActionSource,
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
): Machine {
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
    function initReducer(prev: Machine): Machine {
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
    .map(input => function inputReducer(prev: Machine): Machine {
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
    .fold((state: Machine, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null"
  const outputs$ = state$.map(state => state.outputs)
    .filter(outputs => !!outputs);
  
  return {
    SpeechSynthesisAction: outputs$.filter(outputs => !!outputs.say).map(outputs => outputs.say.args),
    SpeechRecognitionAction: outputs$.filter(outputs => !!outputs.listen).map(outputs => outputs.listen.args).debug(),
  };
}

runRobotProgram(main);

import xs from 'xstream';
import {Stream} from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

enum State {
  PEND = 'PEND',
  TELL = 'TELL',
}

type Variables = {
  index: number,
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
  GOAL = 'GOAL',
  TELL_DONE = 'DONE',
}

type Input = {
  type: InputType,
  value: any,
};

type Reducer = (machine?: Machine) => Machine;

function input(
  start$: Stream<boolean>,
  speechSynthesisActionSource,
): Stream<Input> {
  return xs.merge(
    start$.debug()
      .mapTo({type: InputType.GOAL, value: null}),
    xs.fromObservable<Input>(
      speechSynthesisActionSource.result
        .map(result => ({type: InputType.TELL_DONE, value: result})),
    ),
  );
}

const story = [
  'Brown bear, brown bear, what do you see? I see a red bird looking at me.',
  'Red bird, red bird, what do you see? I see a yellow duck looking at me.',
  'Yellow duck, yellow duck, what do you see? I see a blue horse looking at me.',
  'Blue horse, blue horse, what do you see? I see a green frog looking at me.',
  'Green frog, green frog, what do you see? I see a purple cat looking at me.',
  'Purple cat, purple cat, what do you see? I see a white dog looking at me.',
  'White dog, white dog, what do you see? I see a black sheep looking at me.',
  'Black sheep, black sheep , what do you see? I see a goldfish looking at me.',
  'Goldfish, goldfish, what do you see? I see a teacher looking at me.',
];

function createTransition() {
  const transitionTable = {
    [State.PEND]: {
      [InputType.GOAL]: (variables) => ({
        state: State.TELL,
        variables,
        outputs: {
          SpeechSynthesisAction: {
            goal: story[variables.index],
          },
        },
      }),
    },
    [State.TELL]: {
      [InputType.TELL_DONE]: (variables) => {
        const storyIndex = variables.index + 1;
        if (storyIndex < story.length) {
          return {
            state: State.TELL,
            variables: {index: storyIndex},
            outputs: {
              SpeechSynthesisAction: {
                goal: story[storyIndex],
              },
            },
          };
        } else {  // done
          return {
            state: State.PEND,
            variables: {index: storyIndex},
            outputs: {
              done: true,
            },
          };
        }
      }
    }
  };

  return function(state, variables, input) {
    return !transitionTable[state]
      ? state
      : !transitionTable[state][input.type]
        ? state
        : transitionTable[state][input.type](variables);
  }
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(machine: Machine): Machine {
      return {  // initial machine state
        state: State.PEND,
        variables: {
          index: 0,
        },
        outputs: null,
      }
    }
  );

  const transition = createTransition();
  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(machine: Machine): Machine {
      console.log(machine);
      return transition(machine.state, machine.variables, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

function main(sources) {
  const input$ = input(
    xs.fromObservable(sources.TabletFace.load),
    sources.SpeechSynthesisAction,
  );

  const state$ = transitionReducer(input$)
    .fold((state: Machine, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null"
  const outputs$ = state$.map(state => state.outputs)
    .filter(outputs => !!outputs);
  
  return {
    SpeechSynthesisAction: outputs$
      .filter(outputs => !!outputs.SpeechSynthesisAction)
      .map(outputs => outputs.SpeechSynthesisAction.goal),
  };
}

runRobotProgram(main);

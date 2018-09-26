// Implements the travel quiz presented at
//   http://www.nomadwallet.com/afford-travel-quiz-personality/
import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {Stream} from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';
import {GoalID, Goal, Result, initGoal} from '@cycle-robot-drivers/action'

enum State {
  ASK_CAREER_QUESTION = 'It\'s import that I reach my full career potential',
  ASK_WORKING_ONLINE_QUESTION = 'I can see myself working online',
  ASK_FAMILY_QUESTION = 'I have to be near my family/friends/pets',
  ASK_SHORT_TRIPS_QUESTION = 'Short trips are awesome!',
  ASK_HOME_OWNERSHIP_QUESTION = 'I want to have a home and nice things',
  ASK_ROUTINE_QUESTION = 'A routine gives my life structure',
  ASK_JOB_SECURITY_QUESTION = 'I need a secure job and a stable income',
  TELL_THEM_THEY_ARE_VACATIONER = 'You are a vacationer!',
  TELL_THEM_THEY_ARE_EXPAT = 'You are an expat!',
  TELL_THEM_THEY_ARE_NOMAD = 'You are a nomad!',
}

type Outputs = {
  args: any,
};

type ReducerState = {
  state: State,
  outputs: Outputs,
  result: Result,
};

type Reducer = (prev?: ReducerState) => ReducerState | undefined;

enum InputType {
  RECEIVED_YES = 'Yes',
  RECEIVED_NO = 'No',
  RECEIVED_RESTART = 'Restart',
}

type Input = {
  type: InputType,
};

const transitionTable = {
  [State.ASK_CAREER_QUESTION]: {
    [InputType.RECEIVED_YES]: State.ASK_WORKING_ONLINE_QUESTION,
    [InputType.RECEIVED_NO]: State.ASK_FAMILY_QUESTION,
  },
  [State.ASK_WORKING_ONLINE_QUESTION]: {
    [InputType.RECEIVED_YES]: State.TELL_THEM_THEY_ARE_NOMAD,
    [InputType.RECEIVED_NO]: State.TELL_THEM_THEY_ARE_VACATIONER,
  },
  [State.ASK_FAMILY_QUESTION]: {
    [InputType.RECEIVED_YES]: State.TELL_THEM_THEY_ARE_VACATIONER,
    [InputType.RECEIVED_NO]: State.ASK_SHORT_TRIPS_QUESTION,
  },
  [State.ASK_SHORT_TRIPS_QUESTION]: {
    [InputType.RECEIVED_YES]: State.TELL_THEM_THEY_ARE_VACATIONER,
    [InputType.RECEIVED_NO]: State.ASK_HOME_OWNERSHIP_QUESTION,
  },
  [State.ASK_HOME_OWNERSHIP_QUESTION]: {
    [InputType.RECEIVED_YES]: State.TELL_THEM_THEY_ARE_EXPAT,
    [InputType.RECEIVED_NO]: State.ASK_ROUTINE_QUESTION,
  },
  [State.ASK_ROUTINE_QUESTION]: {
    [InputType.RECEIVED_YES]: State.TELL_THEM_THEY_ARE_EXPAT,
    [InputType.RECEIVED_NO]: State.ASK_JOB_SECURITY_QUESTION,
  },
  [State.ASK_JOB_SECURITY_QUESTION]: {
    [InputType.RECEIVED_YES]: State.ASK_WORKING_ONLINE_QUESTION,
    [InputType.RECEIVED_NO]: State.TELL_THEM_THEY_ARE_NOMAD,
  },
  [State.TELL_THEM_THEY_ARE_NOMAD]: {
    [InputType.RECEIVED_RESTART]: State.ASK_CAREER_QUESTION,
  },
  [State.TELL_THEM_THEY_ARE_VACATIONER]: {
    [InputType.RECEIVED_RESTART]: State.ASK_CAREER_QUESTION,
  },
  [State.TELL_THEM_THEY_ARE_EXPAT]: {
    [InputType.RECEIVED_RESTART]: State.ASK_CAREER_QUESTION,
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

  const outputs = {
    args: (
      state.question === State.TELL_THEM_THEY_ARE_NOMAD
      || state.question === State.TELL_THEM_THEY_ARE_VACATIONER
      || state.question === State.TELL_THEM_THEY_ARE_EXPAT
    ) ? initGoal({type: 'ASK_QUESTION', value: [
      state.question,
      [InputType.RECEIVED_RESTART],
    ]}) : initGoal({type: 'ASK_QUESTION', value: [
      state.question,
      [InputType.RECEIVED_YES, InputType.RECEIVED_NO],
    ]}),
  }
  return {
    state: prevState,
    outputs,
    result: null,
  };
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev: ReducerState): ReducerState {
      return {
        state: State.ASK_CAREER_QUESTION,
        outputs: {
          args: initGoal({
            message: State.ASK_CAREER_QUESTION,
            choices: [InputType.RECEIVED_YES, InputType.RECEIVED_NO],
          }),
        },
        result: null,
      }
    }
  );

  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev: ReducerState): ReducerState {
      // return prev;
      return transition(prev.state, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

function main(sources) {
  const input$ = sources.TwoSpeechbubblesAction.result
    .map(result => result.result);

  const state$ = transitionReducer(input$)
    .fold((state: ReducerState, reducer: Reducer) => reducer(state), null)
    .drop(1);  // drop "null"
  const outputs$ = state$.map(state => state.outputs)
    .debug()
    .filter(outputs => !!outputs);
  const result$ = state$.map(state => state.result).filter(result => !!result);
  
  return {
    TwoSpeechbubblesAction: outputs$.map(outputs => outputs.args).compose(delay(2000)).debug(),
    // result: adapt(result$),
  };
}

runRobotProgram(main);

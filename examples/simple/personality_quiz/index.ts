// Implements the travel quiz presented at
//   http://www.nomadwallet.com/afford-travel-quiz-personality/
import xs from 'xstream';
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

type Variables = {
  goal_id: GoalID,
  transcript: string,
  error: string,
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
  RECEIVED_YES = 'Yes',
  RECEIVED_NO = 'No',
  RECEIVED_RESTART = 'Restart',
}

type Input = {
  type: InputType,
  // value: Goal | SpeechRecognitionEvent | SpeechRecognitionError,
};


// function input(
//   goal$: Stream<any>,
//   startEvent$: Stream<any>,
//   endEvent$: Stream<any>,
//   errorEvent$: Stream<any>,
//   resultEvent$: Stream<any>
// ) {
//   return xs.merge(
//     goal$.filter(goal => typeof goal !== 'undefined').map(goal => {
//       if (goal === null) {
//         return {
//           type: InputType.CANCEL,
//           value: null,  // means "cancel"
//         };
//       } else {
//         return {
//           type: InputType.GOAL,
//           value: !!(goal as any).goal_id ? goal : initGoal(goal),
//         };
//       }
//     }),
//     startEvent$.mapTo({type: InputType.START, value: null}),
//     endEvent$.mapTo({type: InputType.END, value: null}),
//     errorEvent$.map(event => ({type: InputType.ERROR, value: event})),
//     resultEvent$.map(event => ({type: InputType.RESULT, value: event})),
//   );
// }

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

// function transition(transTable, state: SMState, event: SMEvent) {
//   const events = transTable[state];
//   if (!events) {
//     console.debug(`Invalid state: "${state}"; returning null`);
//     return null;
//   }
//   const newState = events[event];
//   if (!newState) {
//     console.debug(`Invalid event: "${event}"; returning null`);
//     return null;
//   }
//   return newState;
// }

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev: ReducerState): ReducerState {
      return {
        state: State.ASK_CAREER_QUESTION,
        variables: {
          goal_id: null,
          transcript: null,
          error: null,
          newGoal: null,
        },
        outputs: null,
        result: null,
      }
    }
  );

  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev: ReducerState): ReducerState {
      return prev;
      // return transition(prev.state, prev.variables, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

// function model(result$: Actions): Stream<State> {
//   const transTable = {
//     [SMState.ASK_CAREER_QUESTION]: {
//       [SMEvent.RECEIVED_YES]: SMState.ASK_WORKING_ONLINE_QUESTION,
//       [SMEvent.RECEIVED_NO]: SMState.ASK_FAMILY_QUESTION,
//     },
//     [SMState.ASK_WORKING_ONLINE_QUESTION]: {
//       [SMEvent.RECEIVED_YES]: SMState.TELL_THEM_THEY_ARE_NOMAD,
//       [SMEvent.RECEIVED_NO]: SMState.TELL_THEM_THEY_ARE_VACATIONER,
//     },
//     [SMState.ASK_FAMILY_QUESTION]: {
//       [SMEvent.RECEIVED_YES]: SMState.TELL_THEM_THEY_ARE_VACATIONER,
//       [SMEvent.RECEIVED_NO]: SMState.ASK_SHORT_TRIPS_QUESTION,
//     },
//     [SMState.ASK_SHORT_TRIPS_QUESTION]: {
//       [SMEvent.RECEIVED_YES]: SMState.TELL_THEM_THEY_ARE_VACATIONER,
//       [SMEvent.RECEIVED_NO]: SMState.ASK_HOME_OWNERSHIP_QUESTION,
//     },
//     [SMState.ASK_HOME_OWNERSHIP_QUESTION]: {
//       [SMEvent.RECEIVED_YES]: SMState.TELL_THEM_THEY_ARE_EXPAT,
//       [SMEvent.RECEIVED_NO]: SMState.ASK_ROUTINE_QUESTION,
//     },
//     [SMState.ASK_ROUTINE_QUESTION]: {
//       [SMEvent.RECEIVED_YES]: SMState.TELL_THEM_THEY_ARE_EXPAT,
//       [SMEvent.RECEIVED_NO]: SMState.ASK_JOB_SECURITY_QUESTION,
//     },
//     [SMState.ASK_JOB_SECURITY_QUESTION]: {
//       [SMEvent.RECEIVED_YES]: SMState.ASK_WORKING_ONLINE_QUESTION,
//       [SMEvent.RECEIVED_NO]: SMState.TELL_THEM_THEY_ARE_NOMAD,
//     },
//     [SMState.TELL_THEM_THEY_ARE_NOMAD]: {
//       [SMEvent.RECEIVED_RESTART]: SMState.ASK_CAREER_QUESTION,
//     },
//     [SMState.TELL_THEM_THEY_ARE_VACATIONER]: {
//       [SMEvent.RECEIVED_RESTART]: SMState.ASK_CAREER_QUESTION,
//     },
//     [SMState.TELL_THEM_THEY_ARE_EXPAT]: {
//       [SMEvent.RECEIVED_RESTART]: SMState.ASK_CAREER_QUESTION,
//     },
//   };

//   const initReducer$ = fromEvent(window, 'load').mapTo(function initReducer(prev) {
//     const question = SMState.ASK_CAREER_QUESTION;
//     const graph = createGraph(
//       Object.keys(SMState).map(k => SMState[k]),
//       Object.keys(SMEvent).map(k => SMEvent[k]),
//       transTable,
//     );
//     graph.node(question).style = 'fill: #f77';
//     return {question, graph};
//   });

//   const resultReducer$ = result$
//     .filter(result => result.status.status === 'SUCCEEDED')
//     .map(result => function resultReducer(prevState: State): State {
//       // make a transition
//       const question = transition(
//         transTable,
//         prevState.question,
//         result.result,
//       );
//       // update the graph
//       if (!!question) {
//         prevState.graph.setNode(prevState.question, {
//           label: prevState.question,
//           style: 'stroke: #333; fill: #fff;',
//         });
//         prevState.graph.setNode(question, {
//           label: question,
//           style: 'stroke: #333; fill: #f77',
//         });
//       }
//       return !!question ? {
//         question,
//         graph: prevState.graph
//       } : prevState;
//     });

//   return xs.merge(initReducer$, resultReducer$)
//     .fold((state: State, reducer: Reducer) => reducer(state), null)
//     .drop(1)  // drop "null"
//     .compose(dropRepeats());
// }

function main(sources) {

  console.log('Hello world!!!!');

  // const input$ = sources.TwoSpeechbubblesAction.result;

  // const face$ = sources.PoseDetection.poses
  //   .filter(poses => 
  //     poses.length === 1
  //     && poses[0].keypoints.filter(kpt => kpt.part === 'nose').length === 1
  //   ).map(poses => {
  //     const nose = poses[0].keypoints.filter(kpt => kpt.part === 'nose')[0];
  //     const eyePosition = {
  //       x: nose.position.x / videoWidth,
  //       y: nose.position.y / videoHeight,
  //     };
  //     return {
  //       type: 'SET_STATE',
  //       value: {
  //         leftEye: eyePosition,
  //         rightEye: eyePosition,
  //       }
  //     };
  //   });
  
  return {};
}

runRobotProgram(main);

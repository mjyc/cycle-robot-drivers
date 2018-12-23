// import xs from 'xstream';
// import {Stream} from 'xstream';
// import dropRepeats from 'xstream/extra/dropRepeats';
// import isolate from '@cycle/isolate';
// import {StateSource, Reducer as StateReducer} from '@cycle/state';
// import {
//   GoalID, Status, initGoal, isEqualGoal, isEqualResult
// } from '@cycle-robot-drivers/action';
// import {QAWithScreenAction} from '@cycle-robot-drivers/actionbank';
// import {
//   ReducerState as QARState, Sources as QASources, FSMOutputs as QAOutputs
// } from './QuestionAnswerAction';

// enum State {
//   PEND = 'PEND',
//   QA = 'QA',
//   SAY = 'SAY',
// }

// enum SIGType {
//   GOAL = 'GOAL',
//   QA_SUCCEEDED = 'QA_SUCCEEDED',
//   QA_FAILED = 'QA_FAILED',
//   SAY_DONE = 'SAY_DONE',
// }

// export type V = {
//   flowchart: any,
//   node: string,
//   goal_id: GoalID,
//   QuestionAnswerAction: QARState,
// }

// export interface FSMOutputs extends QAOutputs {
//   QuestionAnswerAction: Stream<any>
// }


// export type ReducerState = ReducerStateTemplate<State, V, any>;

// export type Reducer = StateReducer<ReducerState>;


// export interface Sources extends Omit<QASources, 'state'> {
//   state: StateSource<ReducerState>,
// }

// export interface Sinks {
//   outputs: FSMOutputs,
//   state: Stream<Reducer>,
// }


// function input(
//   goal$,
//   state$,
//   speechSynthesisAction,
// ) {
//   const qaResult$ = state$
//     .filter(s => !!s.QuestionAnswerAction
//       && !!s.QuestionAnswerAction.outputs
//       && !!s.QuestionAnswerAction.outputs.result)
//     .map(s => s.QuestionAnswerAction.outputs.result)
//     .compose(dropRepeats(isEqualResult));
//   return xs.merge(
//     goal$.map(x => ({type: SIGType.GOAL, value: initGoal(x)})),
//     qaResult$
//       .filter(r => r.status.status === Status.SUCCEEDED)
//       .map(r => ({type: SIGType.QA_SUCCEEDED, value: r.result})),
//     qaResult$
//       .filter(r => r.status.status !== Status.SUCCEEDED)
//       .map(r => ({type: SIGType.QA_FAILED, value: r.result})),
//     speechSynthesisAction.result
//       .filter(result => result.status.status === 'SUCCEEDED')
//       .mapTo({type: SIGType.SAY_DONE}),
//   );
// }

// function reducer(input$) {
//   const initReducer$: Stream<Reducer> = xs.of(function(prev) {
//     if (typeof prev === 'undefined') {
//       return {
//         state: State.PEND,
//         variables: null,
//         outputs: null,
//       };
//     } else {
//       return prev;
//     }
//   });

//   const transitionReducer$: Stream<Reducer> = input$.map(input => function(prev) {
//     console.debug('input', input, 'prev', prev);
//     if (prev.state === State.PEND && input.type === SIGType.GOAL) {  // goal-received
//       const node = input.value.goal.start;
//       const next = input.value.goal.flowchart[node];
//       if (typeof next === 'string' || !next) {  // do Monologue
//         return {
//           state: State.SAY,
//           variables: {
//             flowchart: input.value.goal.flowchart,
//             node: node,
//             goal_id: input.value.goal_id,
//           },
//           outputs: {
//             SpeechSynthesisAction: {
//               goal: initGoal(node),
//             },
//           },
//           QuestionAnswerAction: prev.QuestionAnswerAction,
//         };
//       } else {  // do QA
//         return {
//           state: State.QA,
//           variables: {
//             flowchart: input.value.goal.flowchart,
//             node: node,
//             goal_id: input.value.goal_id,
//           },
//           outputs: {
//             QuestionAnswerAction: {
//               goal: initGoal({
//                 question: node,
//                 answers: Object.keys(next),
//               }),
//             },
//           },
//           QuestionAnswerAction: prev.QuestionAnswerAction,
//         }
//       }
//     } else if (prev.state === State.SAY && input.type === SIGType.SAY_DONE) {  // monologue-done
//       const node = prev.variables.flowchart[prev.variables.node];
//       const next = prev.variables.flowchart[node];
//       if (!node) {  // deadend
//         return {
//           ...prev,
//           state: State.PEND,
//           variables: null,
//           outputs: {
//             result: {
//               status: {
//                 goal_id: prev.variables.goal_id,
//                 status: Status.SUCCEEDED,
//               },
//               result: prev.variables.node,
//             }
//           }
//         };
//       } else if (typeof next === 'string' || !next) {  // do Monologue
//         return {
//           ...prev,
//           state: State.SAY,
//           variables: {
//             ...prev.variables,
//             node: node,
//           },
//           outputs: {
//             SpeechSynthesisAction: {
//               goal: initGoal(node),
//             },
//           },
//         };
//       } else {  // do QA
//         return {
//           ...prev,
//           state: State.QA,
//           variables: {
//             ...prev.variables,
//             node: node,
//           },
//           outputs: {
//             QuestionAnswerAction: {
//               goal: initGoal({
//                 question: node,
//                 answers: Object.keys(next),
//               })
//             },
//           },
//         };
//       }
//     } else if (prev.state === State.QA && input.type === SIGType.QA_SUCCEEDED) {  // qa-done
//       const node = prev.variables.flowchart[prev.variables.node][input.value];
//       const next = prev.variables.flowchart[node];
//       if (typeof next === 'string' || !next) {  // do Monologue
//         return {
//           ...prev,
//           state: State.SAY,
//           variables: {
//             ...prev.variables,
//             node: node
//           },
//           outputs: {
//             SpeechSynthesisAction: {
//               goal: initGoal(node)
//             },
//           },
//         };
//       } else {  // do QA
//         return {
//           ...prev,
//           state: State.QA,
//           variables: {
//             ...prev.variables,
//             node: node
//           },
//           outputs: {
//             QuestionAnswerAction: {
//               goal: initGoal({
//                 question: node,
//                 answers: Object.keys(next),
//               })
//             },
//           },
//         };
//       }
//     } else if (prev.state === State.QA && input.type === SIGType.QA_FAILED) {  // qa-failed
//       return {
//         state: State.PEND,
//         variables: null,
//         outputs: {
//           result: {
//             status: {
//               goal_id: prev.variables.goal_id,
//               status: Status.ABORTED,
//             },
//             result: prev.variables.node,
//           }
//         },
//         QuestionAnswerAction: prev.QuestionAnswerAction,
//       };
//     }
//     return prev;
//   });

//   return xs.merge(initReducer$, transitionReducer$);
// }

// function output(reducerState$) {
//   const outputs$ = reducerState$
//     .filter(m => !!m.outputs)
//     .map(m => m.outputs);
//   return {
//     SpeechSynthesisAction: outputs$
//       .filter(o => !!o.SpeechSynthesisAction)
//       .map(o => o.SpeechSynthesisAction.goal)
//       .compose(dropRepeats(isEqualGoal)),
//     QuestionAnswerAction: outputs$
//       .filter(o => !!o.QuestionAnswerAction)
//       .map(o => o.QuestionAnswerAction.goal)
//       .compose(dropRepeats(isEqualGoal)),
//   };
// }

// export default function FlowchartAction(sources: Sources): Sinks {
//   const reducerState$ = sources.state.stream;
//   const outputs = output(reducerState$);
//   const qaSinks: Sinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
//     ...sources,
//     goal: outputs.QuestionAnswerAction,
//   }) as any;
//   const input$ = input(
//     sources.goal,
//     reducerState$,
//     sources.SpeechSynthesisAction,
//   );
//   const reducer$ = reducer(input$);

//   return {
//     state: xs.merge(
//       reducer$,
//       qaSinks.state,
//     ),
//     outputs: {
//       ...qaSinks.outputs,
//       SpeechSynthesisAction: xs.merge(
//         qaSinks.outputs.SpeechSynthesisAction,
//         outputs.SpeechSynthesisAction,
//       ),
//     },
//   };
// }

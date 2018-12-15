// import xs from 'xstream';
// import {Stream} from 'xstream';
// import run from '@cycle/run';
// import isolate from '@cycle/isolate';
// import {withState} from '@cycle/state'
// import {Reducer} from '@cycle/state';
// import {runRobotProgram} from '@cycle-robot-drivers/run';
// import QuestionAnswerAction from './QuestionAnswerAction';
// import {ReducerState} from './QuestionAnswerAction';


// function output(machine$) {
//   const outputs$ = machine$
//     .filter(machine => !!machine.outputs)
//     .map(machine => machine.outputs);

//   return {
//     SpeechSynthesisAction: outputs$
//       .filter(outputs => !!outputs.SpeechSynthesisAction)
//       .map(output => output.SpeechSynthesisAction.goal),
//     SpeechRecognitionAction: outputs$
//       .filter(outputs => !!outputs.SpeechRecognitionAction)
//       .map(output => output.SpeechRecognitionAction.goal),
//     TabletFace: outputs$
//       .filter(outputs => !!outputs.TabletFace)
//       .map(output => output.TabletFace.goal),
//   };
// }

// // type NewReducerState = {
// //   ReducerState
// // };

// export type Sinks = {
//   state: Stream<Reducer<ReducerState>>
// };

// function main(sources) {
//   // const sinks = QuestionAnswerAction({
//   //   goal: sources.TabletFace.load.mapTo({
//   //     question: 'How are you?',
//   //     answers: ['Good', 'Bad'],
//   //   }),
//   //   SpeechRecognitionAction: sources.SpeechRecognitionAction,
//   //   SpeechSynthesisAction: sources.SpeechSynthesisAction,
//   // });
//   // const sinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')(sources);
//   const n = isolate(QuestionAnswerAction, {state: 'child'});
//   const sinks = n({
//     goal: sources.TabletFace.load.mapTo({
//       question: 'How are you?',
//       answers: ['Good', 'Bad'],
//     }),
//     SpeechRecognitionAction: sources.SpeechRecognitionAction,
//     SpeechSynthesisAction: sources.SpeechSynthesisAction,
//   })
//   const state$ = sources.state.stream;

//   const reducer$ = xs.of(function() {
//     return {
//       child: null,
//     }
//   })

//   const outputs = output(state$);
//   sources.TabletFace.load.addListener({next: v => console.log('sources.TabletFace.load', v)});
//   state$.addListener({next: v => console.log('state$', v)});
//   return {
//     state: xs.merge(reducer$, sinks.state),
//     SpeechSynthesisAction: outputs.SpeechSynthesisAction,
//     SpeechRecognitionAction: outputs.SpeechRecognitionAction,
//   };
// }

// runRobotProgram(withState(main));
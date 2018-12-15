import xs from 'xstream';
import QuestionAnswerAction from './QuestionAnswerAction';


// function input(state$) {
//   // create stream for success
// }

// function transition(prevState, prevVariables, input) {
//   // on GOAL, move to SAY
//   // if SAY_DONE, make it say again
//   // at the final SAY_DONE, move to PEND
//   return;
// }

export default function FlowchartAction(sources) {

  // const state$ = sources.state.stream;
  // state$.map(s => s.outputs.result).filter(r => r.);
  // // succeed, then move to something else otherwise repeat

  const qaSinks = QuestionAnswerAction({
    goal: sources.TabletFace.load.mapTo({
      question: 'How are you?',
      answers: ['Good', 'Bad'],
    }),
    SpeechRecognitionAction: sources.SpeechRecognitionAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
  });

  // const initReducer$ = xs.of(function() {
  //   return {
  //     state: State.PEND,
  //     variables: {
  //       question: null,
  //       answers: null,
  //     },
  //     outputs: {
  //       result: null
  //     },
  //   }
  // });

  return qaSinks;
}

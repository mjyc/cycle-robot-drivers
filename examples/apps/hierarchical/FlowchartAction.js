import xs from 'xstream';
import isolate from '@cycle/isolate';
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

  const qaSinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')(sources);

  const initReducer$ = xs.of(function() {
    return {
      state: 'State.PEND',
      QuestionAnswerAction: null,
    };
  });

  return {
    state: xs.merge(
      qaSinks.state,
      initReducer$,
    )
  };
}

import xs from 'xstream';
import delay from 'xstream/extra/delay';
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

  // const newS =

  const qaSinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    ...sources,
    goal: xs.of({question: 'Hello', answers: ['yes', 'no']}).compose(delay(2000)),
  });

  const initReducer$ = xs.of(function(prev) {
    console.log('1');
    return {
      outputs: {question: 'Hello', answers: ['yes', 'no']},
      QuestionAnswerAction: prev.QuestionAnswerAction,
    };
  });

  return {
    state: xs.merge(
      qaSinks.state,
      initReducer$,
    ),
    outputs: qaSinks.outputs,
  };
}

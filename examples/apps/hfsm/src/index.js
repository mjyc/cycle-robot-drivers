import xs from 'xstream';
import delay from 'xstream/extra/delay';
import isolate from '@cycle/isolate';
import {withState} from '@cycle/state'
import {run} from '@cycle/run';
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction,
  makeSpeechRecognitionDriver,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import QuestionAnswerAction from './QuestionAnswerAction';

function main(sources) {
  const state$ = sources.state.stream;
  state$
    .filter(s => !!s.QuestionAnswerAction 
      && !!s.QuestionAnswerAction.outputs
      && !!s.QuestionAnswerAction.outputs.result)
    .addListener({
      next: s => console.log('result', o.QuestionAnswerAction.outputs.result)
    });

  const goal$ = xs.of({
    question: 'How are you?',
    answers: ['Good', 'Bad'],
  }).compose(delay(2000));
  
  // create action components
  const qaSinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    state: sources.state,
    goal: goal$,
    SpeechSynthesisAction: {
      result: state$.map(s => s.SpeechSynthesisAction.result).filter(r => !!r),
    },
    SpeechRecognitionAction: {
      result: state$.map(s => s.SpeechRecognitionAction.result).filter(r => !!r),
    },
  });
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: qaSinks.outputs.SpeechSynthesisAction,
    SpeechSynthesis: sources.SpeechSynthesis,
  });
  const speechRecognitionAction = SpeechRecognitionAction({
    goal: qaSinks.outputs.SpeechRecognitionAction,
    SpeechRecognition: sources.SpeechRecognition,
  });

  // define reducers
  const reducer$ = xs.merge(
    xs.of(function () {  // initReducer
      return {
        SpeechSynthesisAction: {result: null},
        SpeechRecognitionAction: {result: null},
      };
    }),
    speechSynthesisAction.result
      .map(result => function (prevState) {
        return {...prevState, SpeechSynthesisAction: {result}}
      }),
    speechRecognitionAction.result
      .map(result => function (prevState) {
        return {...prevState, SpeechRecognitionAction: {result}}
      }),
    qaSinks.state,
  );

  return {
    SpeechSynthesis: speechSynthesisAction.output,
    SpeechRecognition: speechRecognitionAction.output,
    state: reducer$,
  }
}

run(withState(main), {
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

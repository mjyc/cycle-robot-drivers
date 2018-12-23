import xs, { Stream } from 'xstream';
import delay from 'xstream/extra/delay';
import isolate from '@cycle/isolate';
import {makeConcurrentAction} from '@cycle-robot-drivers/actionbank';
import {QuestionAnswerAction} from './QuestionAnswerAction';
import {selectActionResult} from './utils';

export function QAWithScreenAction(sources) {
  sources.state.stream.addListener({next: v => console.log('state$', v)})

  const state$ = sources.state.stream;
  const questionAnswerResult$ = state$
    .compose(selectActionResult('QuestionAnswerAction'));

  const RaceAction = makeConcurrentAction(
    ['TwoSpeechbubblesAction', 'QuestionAnswerAction'],
    true,
  );
  const raceSinks: any = isolate(RaceAction, 'RaceAction')({
    goal: xs.of({
      QuestionAnswerAction: {question: 'Hello', answers: ['Hello']},
      TwoSpeechbubblesAction: {message: 'Hello', choices: ['Hello']},
    }).compose(delay(1000)),  // TODO: update this
    TwoSpeechbubblesAction: sources.TwoSpeechbubblesAction,
    QuestionAnswerAction: {result: questionAnswerResult$},
    state: sources.state,
  });
  const qaSinks: any = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    goal: raceSinks.QuestionAnswerAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
    SpeechRecognitionAction: sources.SpeechRecognitionAction,
    state: sources.state,
  });

  const reducer$ = xs.merge(raceSinks.state, qaSinks.state);
  
  return {
    result: raceSinks.result,
    TwoSpeechbubblesAction: raceSinks.TwoSpeechbubblesAction,
    SpeechSynthesisAction: qaSinks.SpeechSynthesisAction,
    SpeechRecognitionAction: qaSinks.SpeechRecognitionAction,
    state: reducer$,
  };
}

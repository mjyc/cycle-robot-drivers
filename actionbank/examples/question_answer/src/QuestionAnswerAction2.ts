import xs, { Stream } from 'xstream';
import delay from 'xstream/extra/delay';
import dropRepeats from 'xstream/extra/dropRepeats';
import isolate from '@cycle/isolate';
import {isEqualResult} from '@cycle-robot-drivers/action';
import {makeConcurrentAction} from '@cycle-robot-drivers/actionbank';
import {QuestionAnswerAction} from './QuestionAnswerAction';

const RaceAction = makeConcurrentAction(
  ['QuestionAnswerAction', 'TwoSpeechbubblesAction'],
  true,
);

export function QuestionAnswerAction2(sources) {
  sources.state.stream.addListener({next: v => console.log('state$', v)})

  const state$ = sources.state.stream;
  const selectActionResult = (actionName: string) =>
    (in$: Stream<any>) => in$
      .filter(s => !!s[actionName] && !!s[actionName].result)  // TODO: initialize
      .map(s => s[actionName].result)
      .compose(dropRepeats(isEqualResult));
  const questionAnswerResult$ = state$
    .compose(selectActionResult('QuestionAnswerAction'));
  
  const childSinks: any = isolate(RaceAction)({
    ...sources,
    QuestionAnswerAction: {result: questionAnswerResult$},
    goal: xs.of({
      QuestionAnswerAction: {question: 'Hello', answers: ['Hello']},
      TwoSpeechbubblesAction: {message: 'Hello', choices: ['Hello']},
    }).compose(delay(1000)),
  });

  const qaSinks: any = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    goal: childSinks.QuestionAnswerAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
    SpeechRecognitionAction: sources.SpeechRecognitionAction,
    state: sources.state,
  });

  qaSinks.result.addListener({next: r => console.log('qaSinks.result', r)});

  const childReducer$ = childSinks.state;
  const reducer$ = xs.merge(childReducer$, qaSinks.state);
  
  return {
    result: childSinks.result,
    TwoSpeechbubblesAction: childSinks.TwoSpeechbubblesAction,
    SpeechSynthesisAction: qaSinks.SpeechSynthesisAction,
    SpeechRecognitionAction: qaSinks.SpeechRecognitionAction,
    state: reducer$,
  };
}

import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {makeConcurrentAction} from '@cycle-robot-drivers/actionbank';

const RaceAction = makeConcurrentAction(
  ['FacialExpressionAction', 'TwoSpeechbubblesAction'],
  true,
);

export function QuestionAnswerAction2(sources) {
  const childSinks: any = RaceAction({
    ...sources,
    goal: xs.of({
      FacialExpressionAction: 'happy',
      TwoSpeechbubblesAction: {message: 'Hello', choices: ['Hello']},
    }).compose(delay(1000)),
  })

  const childReducer$ = childSinks.state;
  const reducer$ = xs.merge(xs.never(), childReducer$);
  
  return {
    result: childSinks.result,
    FacialExpressionAction: childSinks.FacialExpressionAction,
    TwoSpeechbubblesAction: childSinks.TwoSpeechbubblesAction,
    // SpeechSynthesisAction: childSinks.SpeechSynthesisAction,
    // SpeechRecognitionAction: childSinks.SpeechRecognitionAction,
    state: reducer$,
  };
}

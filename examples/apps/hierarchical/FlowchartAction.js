import xs from 'xstream';
import QuestionAnswerAction from './QuestionAnswerAction';

export default function FlowchartAction(sources) {
  const qaSinks = QuestionAnswerAction({
    goal: sources.TabletFace.load.mapTo({
      question: 'How are you?',
      answers: ['Good', 'Bad'],
    }),
    SpeechRecognitionAction: sources.SpeechRecognitionAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
  });
  return qaSinks;
}

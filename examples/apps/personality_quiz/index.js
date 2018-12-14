import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';
import QuestionAnswerAction from './QuestionAnswerAction';


function main(sources) {
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

runRobotProgram(main);
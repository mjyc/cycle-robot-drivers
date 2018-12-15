import xs from 'xstream';
import {withState} from '@cycle/state'
import {runRobotProgram} from '@cycle-robot-drivers/run';
import QuestionAnswerAction from './QuestionAnswerAction';

function output(machine$) {
  const outputs$ = machine$
    .filter(machine => !!machine.outputs)
    .map(machine => machine.outputs);

  return {
    SpeechSynthesisAction: outputs$
      .filter(outputs => !!outputs.SpeechSynthesisAction)
      .map(output => output.SpeechSynthesisAction.goal),
    SpeechRecognitionAction: outputs$
      .filter(outputs => !!outputs.SpeechRecognitionAction)
      .map(output => output.SpeechRecognitionAction.goal),
    TabletFace: outputs$
      .filter(outputs => !!outputs.TabletFace)
      .map(output => output.TabletFace.goal),
  };
}

function main(sources) {
  const qaSinks = QuestionAnswerAction({
    goal: sources.TabletFace.load.mapTo({
      question: 'How are you?',
      answers: ['Good', 'Bad'],
    }),
    SpeechRecognitionAction: sources.SpeechRecognitionAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
  });

  const state$ = sources.state.stream;
  // state$.addListener({
  //   next: v => console.warn(v),
  //   error: v => console.error(v)
  // });

  const outputs = output(state$);
  return {
    state: qaSinks.state,
    SpeechSynthesisAction: outputs.SpeechSynthesisAction,
    SpeechRecognitionAction: outputs.SpeechRecognitionAction,
  };
}

runRobotProgram(withState(main));
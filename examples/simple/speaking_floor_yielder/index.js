import {runRobotProgram} from '@cycle-robot-drivers/run';
import xs from 'xstream';
import delay from 'xstream/extra/delay';

function main(sources) {
  const start$ = xs.merge(
    xs.of(null),
    sources.SpeechSynthesisAction.result.compose(delay(5000)),
  );
  const speechstart$ = sources.SpeechRecognition.events('speechstart');

  const sayOrStop$ = xs.merge(
    start$.mapTo(
      'You can interrupt me by saying something while I\'m speaking.'
    ),
    speechstart$.mapTo(null),
  );
  const listen$ = start$.mapTo({});
  
  return {
    SpeechSynthesisAction: sayOrStop$,
    SpeechRecognitionAction: listen$,
  };
}

runRobotProgram(main);

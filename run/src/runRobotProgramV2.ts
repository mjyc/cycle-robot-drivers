// import xs from 'xstream';
// import {Stream} from 'xstream';
// import {div, DOMSource, VNode} from '@cycle/dom';
// import isolate from '@cycle/isolate';
// import {StateSource, Reducer} from '@cycle/state';
// import {Result, EventSource, isEqual, Status} from '@cycle-robot-drivers/action';
import {
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';
import {AudioPlayerAction} from '@cycle-robot-drivers/sound';
import {
  SpeechSynthesisAction,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import {selectActionResult} from '@cycle-robot-drivers/actionbank';
import {initializeDrivers} from './initializeDrivers';

export function runRobotProgramV2(
  main,
  drivers?,
  options?,
) {
  if (!main) {
    throw new Error('Must pass the argument main');
  }

  return run(
    // withState(withActions(main, options)),
    main,
    initializeDrivers(drivers),
  );
};

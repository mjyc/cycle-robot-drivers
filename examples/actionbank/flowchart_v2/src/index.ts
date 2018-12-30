import {makeDOMDriver} from '@cycle/dom';
import {withState} from '@cycle/state';
import {run} from '@cycle/run';
import {makeTabletFaceDriver} from '@cycle-robot-drivers/screen';
import {
  makeSpeechSynthesisDriver,
  makeSpeechRecognitionDriver,
} from '@cycle-robot-drivers/speech';
import RobotApp from './RobotApp';

document.body.style.backgroundColor = "white";
document.body.style.margin = "0px";

const main = withState(RobotApp);

run(main, {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver(),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});
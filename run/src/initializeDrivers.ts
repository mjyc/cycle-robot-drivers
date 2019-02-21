import {Driver} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {makeTabletFaceDriver} from '@cycle-robot-drivers/screen';
import {makeAudioPlayerDriver} from '@cycle-robot-drivers/sound';
import {
makeSpeechSynthesisDriver,
makeSpeechRecognitionDriver,
} from '@cycle-robot-drivers/speech';
import {makePoseDetectionDriver} from 'cycle-posenet-driver';

export function initializeDrivers(): {
  DOM: Driver<any, any>,
  TabletFace: Driver<any, any>,
  AudioPlayer: Driver<any, any>,
  SpeechSynthesis: Driver<any, any>,
  SpeechRecognition: Driver<any, any>,
  PoseDetection: Driver<any, any>,
} {
  if (document.body.getElementsByTagName('div').length === 0) {
    throw 'Cannot find a child of body with div tag; please create the DOM driver yourself';
  };

  return {
    DOM: makeDOMDriver(document.body.getElementsByTagName('div')[0]),
    TabletFace: makeTabletFaceDriver(),
    AudioPlayer: makeAudioPlayerDriver(),
    SpeechSynthesis: makeSpeechSynthesisDriver(),
    SpeechRecognition: makeSpeechRecognitionDriver(),
    PoseDetection: makePoseDetectionDriver(),
  };
}
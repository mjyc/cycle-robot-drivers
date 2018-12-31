import {Driver} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {makeTabletFaceDriver} from '@cycle-robot-drivers/screen';
import {makeAudioPlayerDriver} from '@cycle-robot-drivers/sound';
import {
makeSpeechSynthesisDriver,
makeSpeechRecognitionDriver,
} from '@cycle-robot-drivers/speech';
import {makePoseDetectionDriver} from 'cycle-posenet-driver';

export function initializeDrivers(drivers?: {
  DOM?: Driver<any, any>,
  TabletFace: Driver<any, any>,
  AudioPlayer?: Driver<any, any>,
  SpeechSynthesis?: Driver<any, any>,
  SpeechRecognition?: Driver<any, any>,
  PoseDetection?: Driver<any, any>,
}) {
  if (!drivers) {
    (drivers as any) = {};
  }
  if (!drivers.DOM) {
    if (document.body.getElementsByTagName('div').length === 0) {
      throw 'Cannot find a child of body with div tag; please create the DOM driver yourself';
    }
    drivers.DOM = makeDOMDriver(document.body.getElementsByTagName('div')[0]);
  }
  if (!drivers.TabletFace) {
    drivers.TabletFace = makeTabletFaceDriver();
  }
  if (!drivers.AudioPlayer) {
    drivers.AudioPlayer = makeAudioPlayerDriver();
  }
  if (!drivers.SpeechSynthesis) {
    drivers.SpeechSynthesis = makeSpeechSynthesisDriver();
  }
  if (!drivers.SpeechRecognition) {
    drivers.SpeechRecognition = makeSpeechRecognitionDriver();
  }
  if (!drivers.PoseDetection) {
    drivers.PoseDetection = makePoseDetectionDriver();
  }

  return drivers;
}
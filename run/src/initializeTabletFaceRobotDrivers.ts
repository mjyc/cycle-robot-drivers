import { Driver } from "@cycle/run";
import { makeDOMDriver, DOMSource } from "@cycle/dom";
import { EventSource } from "@cycle-robot-drivers/action";
import { makeTabletFaceDriver } from "@cycle-robot-drivers/screen";
import { makeAudioPlayerDriver } from "@cycle-robot-drivers/sound";
import {
  makeSpeechSynthesisDriver,
  makeSpeechRecognitionDriver
} from "@cycle-robot-drivers/speech";
import { makePoseDetectionDriver } from "cycle-posenet-driver";

export function initializeTabletFaceRobotDrivers(): {
  DOM: Driver<any, DOMSource>;
  TabletFace: Driver<any, EventSource>;
  AudioPlayer: Driver<any, EventSource>;
  SpeechSynthesis: Driver<any, EventSource>;
  SpeechRecognition: Driver<any, EventSource>;
  PoseDetection: Driver<any, EventSource>;
} {
  if (document.body.getElementsByTagName("div").length === 0) {
    throw "Cannot find a child of body with div tag; please create the DOM driver yourself";
  }

  return {
    DOM: makeDOMDriver(document.body.getElementsByTagName("div")[0]),
    TabletFace: makeTabletFaceDriver(),
    AudioPlayer: makeAudioPlayerDriver(),
    SpeechSynthesis: makeSpeechSynthesisDriver(),
    SpeechRecognition: makeSpeechRecognitionDriver(),
    PoseDetection: makePoseDetectionDriver()
  };
}

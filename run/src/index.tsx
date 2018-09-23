import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run, Driver} from '@cycle/run';
import {powerup} from '@cycle-robot-drivers/action';
import {
  makeTabletFaceDriver,
  FacialExpressionAction,
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';
import {
  makeAudioPlayerDriver,
  AudioPlayerAction,
} from '@cycle-robot-drivers/sound';
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction,
  makeSpeechRecognitionDriver,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import {makePoseDetectionDriver} from 'cycle-posenet-driver';

export function runRobotProgram(
  main: any,
  drivers: {
    DOM: Driver<any, any>,
    TabletFace: Driver<any, any>,
    AudioPlayer?: Driver<any, any>,
    SpeechSynthesis?: Driver<any, any>,
    SpeechRecognition?: Driver<any, any>,
    PoseDetection?: Driver<any, any>,
  },
  runCycleProgram?,
) {
  if (!main) {
    throw new Error('Must pass the argument main');
  }
  if (!drivers.DOM) {
    throw new Error('DOMDriver must be defined in drivers as "DOM"');
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
  if (!runCycleProgram) {
    runCycleProgram = run;
  }

  function wrappedMain(sources) {
    sources.proxies = {
      FacialExpressionAction: xs.create(),
      TwoSpeechbubblesAction: xs.create(),
      AudioPlayerAction: xs.create(),
      SpeechSynthesisAction: xs.create(),
      SpeechRecognitionAction: xs.create(),
    };
    sources.FacialExpressionAction = FacialExpressionAction({
      goal: sources.proxies.FacialExpressionAction,
      TabletFace: sources.TabletFace,
    });
    sources.AudioPlayerAction = AudioPlayerAction({
      goal: sources.proxies.AudioPlayerAction,
      AudioPlayer: sources.AudioPlayer,
    });
    sources.TwoSpeechbubblesAction = TwoSpeechbubblesAction({
      goal: sources.proxies.TwoSpeechbubblesAction,
      DOM: sources.DOM,
    });
    sources.SpeechSynthesisAction = SpeechSynthesisAction({
      goal: sources.proxies.SpeechSynthesisAction,
      SpeechSynthesis: sources.SpeechSynthesis,
    });
    sources.SpeechRecognitionAction = SpeechRecognitionAction({
      goal: sources.proxies.SpeechRecognitionAction,
      SpeechRecognition: sources.SpeechRecognition,
    });

    return (() => {
      const {
        TabletFace,
        FacialExpressionAction,
        AudioPlayerAction,
        TwoSpeechbubblesAction,
        SpeechSynthesisAction,
        SpeechRecognitionAction,
        ...sinks
      } = main(sources);
      sinks.targets = {
        TabletFace,
        FacialExpressionAction,
        AudioPlayerAction,
        TwoSpeechbubblesAction,
        SpeechSynthesisAction,
        SpeechRecognitionAction,
      };

      if (!sinks.DOM) {
        sinks.DOM = xs.combine(
          sources.TabletFace.DOM,
          sources.TwoSpeechbubblesAction.DOM,
          sources.PoseDetection.DOM
        ).map(([face, speechbubbles, poseDetectionViz]) => (
          <div>
            {speechbubbles}
            {face}
            {poseDetectionViz}
          </div>
        ));
      }
      if (!sinks.TabletFace) {
        sinks.TabletFace = sources.FacialExpressionAction.output;
      }
      if (!sinks.AudioPlayer) {
        sinks.AudioPlayer = sources.AudioPlayerAction.output;
      }
      if (!sinks.SpeechSynthesis) {
        sinks.SpeechSynthesis = sources.SpeechSynthesisAction.output;
      }
      if (!sinks.SpeechRecognition) {
        sinks.SpeechRecognition = sources.SpeechRecognitionAction.output;
      }

      return sinks;
    })();
  }

  return runCycleProgram(
    powerup(wrappedMain, (proxy, target) => !!target && proxy.imitate(target)),
    drivers,
  );
};

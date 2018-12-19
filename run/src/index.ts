import xs from 'xstream';
import {div, makeDOMDriver} from '@cycle/dom';
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
    drivers.DOM = makeDOMDriver(document.body.firstElementChild);
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

export function withActions(
  main: (sources: any) => any,
  options?: {
    hidePoseViz?: boolean
  },
) {
  if (!options) {
    options = {};
  }
  
  function mainWithActions(sources) {
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
        FacialExpressionAction,
        AudioPlayerAction,
        TwoSpeechbubblesAction,
        SpeechSynthesisAction,
        SpeechRecognitionAction,
        ...sinks
      } = main(sources) || {
        FacialExpressionAction: null,
        AudioPlayerAction: null,
        TwoSpeechbubblesAction: null,
        SpeechSynthesisAction: null,
        SpeechRecognitionAction: null,
      };
      sinks.targets = {
        FacialExpressionAction,
        AudioPlayerAction,
        TwoSpeechbubblesAction,
        SpeechSynthesisAction,
        SpeechRecognitionAction,
      };

      if (!sinks.DOM) {
        sinks.DOM = xs.combine(
          sources.TwoSpeechbubblesAction.DOM,
          sources.TabletFace.DOM,
          sources.PoseDetection.DOM
        ).map(([speechbubbles, face, poseDetectionViz]) => {
          (poseDetectionViz as any).data.style.display = options.hidePoseViz
            ? 'none' : 'block';
          return div({
            style: {position: 'relative'}
          }, [speechbubbles, face, poseDetectionViz]);
        });
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
  return powerup(
    mainWithActions,
    (proxy, target) => !!target && proxy.imitate(target),
  );
}

/**
 * A wrapper function of [Cycle.js run](https://cycle.js.org/api/run.html#api-runmain-drivers)
 *   function.
 * 
 * @param main A function that takes incoming streams as `sources` and returns
 *   outgoing streams as sinks. By default, the following action components
 * 
 *     * [FacialExpressionAction](../screen)
 *     * [AudioPlayerAction](../sound)
 *     * [TwoSpeechbubblesAction](../screen)
 *     * [SpeechSynthesisAction](../speech)
 *     * [SpeechRecognitionAction](../speech)
 * 
 *   are can used used like drivers, i.e., catch incoming message via 
 *   `sources.FacialExpressionAction` and send outgoing message via 
 *   `return { FacialExpressionAction: xs.of(null) };`, as well as six drivers
 *   listed below.
 * 
 * @param drivers A collection of [Cycle.js drivers](). By default, `drivers` is
 *   set to an object containing:
 * 
 *     * [DOM](https://cycle.js.org/api/dom.html)
 *     * [TabletFace](../screen)
 *     * [AudioPlayer](../sound)
 *     * [SpeechSynthesis](../speech#)
 *     * [SpeechRecognition](../speech)
 *     * [PoseDetection](../3rdparty/cycle-posenet-driver)
 * 
 *   drivers.
 */
export function runRobotProgram(
  main,
  drivers,
  options,
) {
  if (!main) {
    throw new Error('Must pass the argument main');
  }

  return run(
    withActions(main, options),
    initializeDrivers(drivers),
  );
};

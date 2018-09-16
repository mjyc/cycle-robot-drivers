import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import delay from 'xstream/extra/delay'
import {run, Driver} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {powerup} from '@cycle-robot-drivers/action';
import {
  TabletFace,
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
import {makePoseDetectionDriver} from 'cycle-posenet-drivers';


function main(sources) {
  sources.proxies = {
    TabletFace: xs.create(),
    TwoSpeechbubblesAction: xs.create(),
    AudioPlayerAction: xs.create(),
    SpeechSynthesisAction: xs.create(),
    SpeechRecognitionAction: xs.create(),
  };
  sources.TabletFace = TabletFace({
    command: sources.proxies.TabletFace,
    DOM: sources.DOM,
  });
  sources.TwoSpeechbubblesAction = TwoSpeechbubblesAction({
    goal: sources.proxies.TwoSpeechbubblesAction,
    DOM: sources.DOM,
  });
  sources.AudioPlayerAction = AudioPlayerAction({
    goal: sources.proxies.AudioPlayerAction,
    AudioPlayer: sources.AudioPlayer,
  });
  sources.SpeechSynthesisAction = SpeechSynthesisAction({
    goal: sources.proxies.SpeechSynthesisAction,
    SpeechSynthesis: sources.SpeechSynthesis,
  });
  sources.SpeechRecognitionAction = SpeechRecognitionAction({
    goal: sources.proxies.SpeechRecognitionAction,
    SpeechRecognition: sources.SpeechRecognition,
  });
  

  const src = require('../public/snd/IWohoo3.ogg');
  const synthGoal$ = xs.of({text: 'Hello'}).compose(delay(1000));
  const recogGoal$ = xs.of({}).compose(delay(1000));
  const faceGoal$ = xs.of({type: 'EXPRESS', args: {type: 'happy'}}).compose(delay(1000));
  const speechGoal$ = xs.of({type: 'ASK_QUESTION', value: ['How are you?', ['Good', 'Bad']]}).compose(delay(1000));
  const soundGoal$ = xs.of({src}).compose(delay(1000));

  sources.SpeechSynthesisAction.result
    .debug('SpeechSynthesisAction.result')
    .addListener({next: () => {}});
  sources.SpeechRecognitionAction.result
    .debug('SpeechRecognitionAction.result')
    .addListener({next: () => {}});
  sources.TwoSpeechbubblesAction.result
    .debug('TwoSpeechbubblesAction.result')
    .addListener({next: () => {}});
  sources.AudioPlayerAction.value
    .debug('AudioPlayerAction.value')
    .addListener({next: () => {}});
  sources.PoseDetection.poses
    // .debug('PoseDetection.poses')  // see the outputs in the browser
    .addListener({next: () => {}});
    
  return {
    DOM: xs.combine(
      sources.TabletFace.DOM,
      sources.TwoSpeechbubblesAction.DOM,
      sources.PoseDetection.DOM
    ).map(([face, speechbubbles, poseDetectionViz]) => (
      <div>
        {speechbubbles}
        {face}
        {poseDetectionViz}
      </div>
    )),
    AudioPlayer: sources.AudioPlayerAction.value,
    SpeechSynthesis: sources.SpeechSynthesisAction.output,
    SpeechRecognition: sources.SpeechRecognitionAction.output,
    targets: {
      TabletFace: faceGoal$,
      TwoSpeechbubblesAction: speechGoal$,
      AudioPlayerAction: soundGoal$,
      SpeechSynthesisAction: synthGoal$,
      SpeechRecognitionAction: recogGoal$,
    },
  }
}

// run(powerup(main, (proxy, target) => proxy.imitate(target)), {
//   DOM: makeDOMDriver('#app'),
//   AudioPlayer: makeAudioPlayerDriver(),
//   SpeechSynthesis: makeSpeechSynthesisDriver(),
//   SpeechRecognition: makeSpeechRecognitionDriver(),
//   PoseDetection: makePoseDetectionDriver(),
// });


function runRobotProgram(
  main,
  drivers: {
    DOM: Driver<any, any>,
    AudioPlayer?: Driver<any, any>,
    SpeechSynthesis?: Driver<any, any>,
    SpeechRecognition?: Driver<any, any>,
    PoseDetection?: Driver<any, any>,
  }
) {
  if (!drivers.DOM) {
    throw new Error('DOMDriver must be defined in drivers as DOM');
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

  function wrappedMain(sources) {
    sources.proxies = {
      TabletFace: xs.create(),
      TwoSpeechbubblesAction: xs.create(),
      AudioPlayerAction: xs.create(),
      SpeechSynthesisAction: xs.create(),
      SpeechRecognitionAction: xs.create(),
    };
    sources.TabletFace = TabletFace({
      command: sources.proxies.TabletFace,
      DOM: sources.DOM,
    });
    sources.TwoSpeechbubblesAction = TwoSpeechbubblesAction({
      goal: sources.proxies.TwoSpeechbubblesAction,
      DOM: sources.DOM,
    });
    sources.AudioPlayerAction = AudioPlayerAction({
      goal: sources.proxies.AudioPlayerAction,
      AudioPlayer: sources.AudioPlayer,
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
        TwoSpeechbubblesAction,
        AudioPlayerAction,
        SpeechSynthesisAction,
        SpeechRecognitionAction,
        ...sinks
      } = main(sources);
      sinks.target = {
        TabletFace,
        TwoSpeechbubblesAction,
        AudioPlayerAction,
        SpeechSynthesisAction,
        SpeechRecognitionAction,
      };
      return sinks;
    })();
  }

  return run(
    powerup(wrappedMain, (proxy, target) => proxy.imitate(target)),
    drivers,
  );
};

runRobotProgram(main, {
  DOM: makeDOMDriver('#app'),
});

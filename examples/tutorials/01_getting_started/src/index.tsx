import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import delay from 'xstream/extra/delay'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
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


function powerup(
  main: (sources: {
    proxies: {
      [proxyName: string]: any
    },
    [sourceName: string]: any,
  }) => {
    targets: {
      [targetName: string]: any,
    },
    [sinkName: string]: any,
  },
  connect: (proxy: any, target: any) => any
) {
  return (sources) => {
    const sinks = main(sources);
    Object.keys(sources.proxies).map(key => {
      connect(sources.proxies[key], sinks.targets[key]);
    });
    const {targets, ...sinksWithoutTargets} = sinks;
    return sinksWithoutTargets;
  };
}

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

run(powerup(main, (proxy, target) => proxy.imitate(target)), {
  DOM: makeDOMDriver('#app'),
  AudioPlayer: makeAudioPlayerDriver(),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
  PoseDetection: makePoseDetectionDriver(),
});


function runRobotProgram(main, drivers) {

  // go through keys in drivers and check it has required drivers
  //   otherwise create one

  // create a new main

  // poweritup

  // run()
};

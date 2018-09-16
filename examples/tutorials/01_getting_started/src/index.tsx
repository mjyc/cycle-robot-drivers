import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import delay from 'xstream/extra/delay'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction,
  makeSpeechRecognitionDriver,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import {
  TabletFace,
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';


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
    SpeechSynthesisAction: xs.create(),
    SpeechRecognitionAction: xs.create(),
    TwoSpeechbubblesAction: xs.create(),
  };
  sources.TabletFace = TabletFace({
    DOM: sources.DOM,
    command: sources.proxies.TabletFace,
  });
  sources.TwoSpeechbubblesAction = TwoSpeechbubblesAction({
    DOM: sources.DOM,
    goal: sources.proxies.TwoSpeechbubblesAction,
  });
  sources.SpeechSynthesisAction = SpeechSynthesisAction({
    goal: sources.proxies.SpeechSynthesisAction,
    SpeechSynthesis: sources.SpeechSynthesis,
  });
  sources.SpeechRecognitionAction = SpeechRecognitionAction({
    goal: sources.proxies.SpeechRecognitionAction,
    SpeechRecognition: sources.SpeechRecognition,
  });


  const synthGoal$ = xs.of({text: 'Hello'}).compose(delay(1000));
  const recogGoal$ = xs.of({}).compose(delay(1000));
  const faceGoal$ = xs.of({type: 'EXPRESS', args: {type: 'happy'}}).compose(delay(1000));
  const speechGoal$ = xs.of({type: 'ASK_QUESTION', value: ['How are you?', ['Good', 'Bad']]}).compose(delay(1000));

  sources.SpeechSynthesisAction.result
    .debug('SpeechSynthesisAction.result')
    .addListener({next: () => {}});
  sources.SpeechRecognitionAction.result
    .debug('SpeechRecognitionAction.result')
    .addListener({next: () => {}});
  sources.TwoSpeechbubblesAction.result
    .debug('TwoSpeechbubblesAction.result')
    .addListener({next: () => {}});

    
  return {
    DOM: xs.combine(sources.TabletFace.DOM, sources.TwoSpeechbubblesAction.DOM)
      .map(([face, speechbubbles]) => (
        <div>
          {speechbubbles}
          {face}
        </div>
      )),
    SpeechSynthesis: sources.SpeechSynthesisAction.output,
    SpeechRecognition: sources.SpeechRecognitionAction.output,
    targets: {
      TabletFace: faceGoal$,
      SpeechSynthesisAction: synthGoal$,
      SpeechRecognitionAction: recogGoal$,
      TwoSpeechbubblesAction: speechGoal$,
    },
  }
}

run(powerup(main, (proxy, target) => proxy.imitate(target)), {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

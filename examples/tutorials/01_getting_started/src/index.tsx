import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisActionDriver,
  makeSpeechRecognitionActionDriver,
} from '@cycle-robot-drivers/speech';


function main(sources) {
  const goal$ = xs.create();
  setTimeout(() => goal$.shamefullySendNext({text: 'Hello'}), 1);
  // test overwriting the current goal
  setTimeout(() => goal$.shamefullySendNext({text: 'World'}), 200);
  // test canceling an active goal
  setTimeout(() => goal$.shamefullySendNext(null), 500);
  setTimeout(() => goal$.shamefullySendNext({text: 'Jello'}), 1500);
  // test calling cancel on done; cancel must do nothing
  setTimeout(() => goal$.shamefullySendNext(null), 2500);

  sources.SpeechSynthesisAction.output.addListener({
    next: data => console.warn('output', data),
  });
  sources.SpeechSynthesisAction.result.addListener({
    next: data => console.warn('result', data),
  });

  return {
    // FacialExpressionAction: xs.periodic(2000).mapTo({type: 'happy'}),
    SpeechSynthesisAction: goal$,
    SpeechRecognitionAction: xs.of({}),
    // TabletFace: xs.periodic(2000).mapTo({type: 'EXPRESS', args: {type: 'happy'}}),
  };
}

// const DOMDriver = makeDOMDriver('#app');
// const tabletFaceDriver = makeTabletFaceDriver({
//   styles: {faceHeight: '600px'},
//   DOMDriver,
// });


function powerup(main, connect) {
  return (sources) => {
    const sinks = main(sources);
    Object.keys(sources.proxies).map(key => {
      connect(sources.proxies[key], sinks.targets[key]);
    });
    const {targets, ...sinksNoTargets} = sinks;
    return sinksNoTargets;
  };
}

// function main_temp(sources) {
//   sources.proxies = {
//     firstGoal: xs.create(),
//     secondGoal: xs.create(),
//   };



//   return {
//     FacialExpressionAction
//     SpeechSynthesisAction
//     SpeechRecognitionAction
//     TabletFace
//     TwoSpeechbubblesActionDriver

//     targets: {
//       firstGoal: firstGoal$,
//       secondGoal: secondGoal$
//     },
//   }
// }

run(main, {
  // FacialExpressionAction: makeFacialExpressionActionDriver({tabletFaceDriver}),
  SpeechSynthesisAction: makeSpeechSynthesisActionDriver(),
  SpeechRecognitionAction: makeSpeechRecognitionActionDriver(),
});

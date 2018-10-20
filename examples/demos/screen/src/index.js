import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {div, makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';
import {powerup} from '@cycle-robot-drivers/action';
import {
  makeTabletFaceDriver,
  FacialExpressionAction,
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';


function main(sources) {
  sources.proxies = {  // will be connected to "targets"
    FacialExpressionAction: xs.create(),
    TwoSpeechbubblesAction: xs.create(),
  };
  // create action components
  sources.TwoSpeechbubblesAction = TwoSpeechbubblesAction({
    goal: sources.proxies.TwoSpeechbubblesAction,
    DOM: sources.DOM,
  });
  sources.FacialExpressionAction = FacialExpressionAction({
    goal: sources.proxies.FacialExpressionAction,
    TabletFace: sources.TabletFace,
  });


  // main logic
  const speechbubbles$ = xs.merge(
    // xs.of('Hello there!').compose(delay(1000)),
    xs.of({
      message: 'How are you?',
      choices: ['Good', 'Bad']
    }).compose(delay(200)),
    // xs.of(null).compose(delay(1000)),
    // sources.TwoSpeechbubblesAction.result
    //   .filter(result => !!result.result)
    //   .map(result => {
    //     if (result.result === 'Good') {
    //       return 'Great!';
    //     } else if (result.result === 'Bad') {
    //       return 'Sorry to hear that...';
    //     }
    //   }),
  );

  // sources.TwoSpeechbubblesAction.result.addListener({
  //   next: value => console.log('result', value),
  // })
  
  const expression$ = sources.TwoSpeechbubblesAction.result.map((result) => {
    if (result.result === 'Good') {
      return 'happy';
    } else if (result.result === 'Bad') {
      return 'sad';
    }
  });
  // const expression$ = xs.never();

  const vdom$ = xs.combine(
    sources.TwoSpeechbubblesAction.DOM,
    sources.TabletFace.DOM,
  ).map(([speechbubbles, face]) => div([speechbubbles, face]));
  

  return {
    DOM: vdom$,
    TabletFace: sources.FacialExpressionAction.output,
    targets: {  // will be imitating "proxies"
      TwoSpeechbubblesAction: speechbubbles$,
      FacialExpressionAction: expression$.debug(),
    },
  }
}

run(powerup(main, (proxy, target) => proxy.imitate(target)), {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver(),
});

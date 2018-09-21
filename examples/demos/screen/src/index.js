import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {div, makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';
import {powerup} from '@cycle-robot-drivers/action';
import {
  TabletFace,
  FacialExpressionAction,
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';


function main(sources) {
  sources.proxies = {  // will be connected to "targets"
    TabletFace: xs.create(),
    FacialExpressionAction: xs.create(),
    TwoSpeechbubblesAction: xs.create(),
  };
  // create action components
  sources.TabletFace = TabletFace({
    command: sources.proxies.TabletFace,
    DOM: sources.DOM,
  });
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
    xs.of('Hello there!').compose(delay(1000)),
    xs.of({
      message: 'How are you?',
      choices: ['Good', 'Bad']
    }).compose(delay(2000)),
    sources.TwoSpeechbubblesAction.result.filter(result => !!result.result)
      .map(result => {
        if (result.result === 'Good') {
          return 'Great!';
        } else if (result.result === 'Bad') {
          return 'Sorry to hear that...';
        }
      })
  );
  
  const expression$ = sources.TwoSpeechbubblesAction.result.debug().map((result) => {
    if (result.result === 'Good') {
      return 'happy';
    } else if (result.result === 'Bad') {
      return 'sad';
    }
  });

  const vdom$ = xs.combine(
    sources.TwoSpeechbubblesAction.DOM,
    sources.TabletFace.DOM,
  ).map(([speechbubbles, face]) => div([speechbubbles, face]));
  

  return {
    DOM: vdom$,
    targets: {  // will be imitating "proxies"
      TabletFace: sources.FacialExpressionAction.output,
      TwoSpeechbubblesAction: speechbubbles$,
      FacialExpressionAction: expression$,
    },
  }
}

run(powerup(main, (proxy, target) => proxy.imitate(target)), {
  DOM: makeDOMDriver('#app'),
});

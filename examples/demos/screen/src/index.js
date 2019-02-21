import xs from 'xstream';
import delay from 'xstream/extra/delay';
import isolate from '@cycle/isolate';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {div, makeDOMDriver} from '@cycle/dom';
import {
  makeTabletFaceDriver,
  SpeechbubbleAction,
  FacialExpressionAction,
} from '@cycle-robot-drivers/screen';

function main(sources) {
  sources.state.stream.addListener({next: s => console.log('reducer state', s)});

  const speechbubbleActionResult = xs.create();
  const speechbubbles$ = xs.merge(
    xs.of({goal_id: `${new Date().getTime()}`, goal: 'Hello there!'})
      .compose(delay(1000)),
    xs.of({goal_id: `${new Date().getTime()}`, goal: ['Good', 'Bad']})
      .compose(delay(2000)),
    speechbubbleActionResult
      .filter(result => !!result.result)
      .map(result => {
        if (result.result === 'Good') {
          return {goal_id: `${new Date().getTime()}`, goal: ['Great', 'Bad']};
        } else if (result.result === 'Bad') {
          return {goal_id: `${new Date().getTime()}`, goal: 'Sorry to hear that...'};
        }
      }),
  );
  const speechbubbleAction = isolate(SpeechbubbleAction)({
    state: sources.state,
    DOM: sources.DOM,
    goal: speechbubbles$,
    cancel: xs.never(),
  });
  speechbubbleActionResult.imitate(speechbubbleAction.result);

  const expression$ = speechbubbleActionResult
    .filter(result => !!result.result)
    .map((result) => {
      if (result.result === 'Good') {
        return {goal_id: `${new Date().getTime()}`, goal: 'happy'};
      } else if (result.result === 'Bad') {
        return {goal_id: `${new Date().getTime()}`, goal: 'sad'};
      }
    });
  const facialExpressionAction = isolate(FacialExpressionAction)({
    state: sources.state,
    TabletFace: sources.TabletFace,
    goal: expression$,
    cancel: xs.never(),
  });


  // UI
  const vdom$ = xs.combine(
    speechbubbleAction.DOM.startWith(''),
    sources.TabletFace.DOM.startWith(''),
  ).map(vdoms => div(vdoms));

  const reducer = xs.merge(
    speechbubbleAction.state,
    facialExpressionAction.state,
  );
  return {
    DOM: vdom$,
    TabletFace: facialExpressionAction.TabletFace.debug(),
    state: reducer,
  };
}

run(withState(main), {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver(),
});

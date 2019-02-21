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
    xs.of({goal_id: `${new Date().getTime()}`, goal: ['Hello!', 'Bye']})
      .compose(delay(2000)),
    speechbubbleActionResult
      .filter(result => !!result.result)
      .map(result => {
        if (result.result === 'Hello!') {
          return {goal_id: `${new Date().getTime()}`, goal: ['Hello?', 'Bye']};
        } else if (result.result === 'Hello?') {
            return {goal_id: `${new Date().getTime()}`, goal: ['Hello!', 'Bye']};
        } else if (result.result === 'Bye') {
          return {goal_id: `${new Date().getTime()}`, goal: 'Bye now'};
        }
      })
      .filter(g => !!g),
  );
  const speechbubbleAction = isolate(SpeechbubbleAction)({
    state: sources.state,
    DOM: sources.DOM,
    goal: speechbubbles$,
  });
  speechbubbleActionResult.imitate(speechbubbleAction.result);

  const expression$ = speechbubbleActionResult
    .filter(result => !!result.result)
    .map((result) => {
      if (result.result === 'Hello!') {
        return {goal_id: `${new Date().getTime()}`, goal: 'happy'};
      } else if (result.result === 'Hello?') {
          return {goal_id: `${new Date().getTime()}`, goal: 'confused'};
      } else if (result.result === 'Bye') {
        return {goal_id: `${new Date().getTime()}`, goal: 'sad'};
      }
    })
    .filter(g => !!g);
  const facialExpressionAction = isolate(FacialExpressionAction)({
    state: sources.state,
    TabletFace: sources.TabletFace,
    goal: expression$,
  });


  // UI
  const vdom$ = xs.combine(
    speechbubbleAction.DOM.startWith(''),
    sources.TabletFace.DOM.startWith(''),
  ).map(vdoms => div(vdoms));

  const reducer = xs.merge(
    speechbubbleAction.state,
    facialExpressionAction.state,
    xs.never(),
  );
  return {
    DOM: vdom$,
    TabletFace: facialExpressionAction.TabletFace,
    state: reducer,
  };
}

run(withState(main), {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver(),
});

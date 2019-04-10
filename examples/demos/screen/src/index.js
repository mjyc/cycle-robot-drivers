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
  sources.state.stream.addListener({next: s => console.debug('reducer state', s)});

  const speechbubbleActionResult = xs.create();
  const speechbubbles$ = xs.merge(
    xs.of({goal_id: {stamp: Date.now(), id: `sb`}, goal: 'Hello there!'})
      .compose(delay(1000)),
    xs.of({goal_id: {stamp: Date.now(), id: `sb`}, goal: ['Hello!', 'Bye']})
      .compose(delay(2000)),
    speechbubbleActionResult
      .filter(result => !!result.result)
      .map(result => {
        if (result.result === 'Hello!') {
          return {goal_id: {stamp: Date.now(), id: `sb`}, goal: ['Hello?', 'Bye']};
        } else if (result.result === 'Hello?') {
            return {goal_id: {stamp: Date.now(), id: `sb`}, goal: ['Hello!', 'Bye']};
        } else if (result.result === 'Bye') {
          return {goal_id: {stamp: Date.now(), id: `sb`}, goal: 'Bye now'};
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
  speechbubbleAction.status.addListener({next: s =>
    console.log('SpeechbubbleAction status', s)});

  const expression$ = speechbubbleActionResult
    .filter(result => !!result.result)
    .map((result) => {
      if (result.result === 'Hello!') {
        return {goal_id: {stamp: Date.now(), id: `fe`}, goal: 'HAPPY'};
      } else if (result.result === 'Hello?') {
          return {goal_id: {stamp: Date.now(), id: `fe`}, goal: 'CONFUSED'};
      } else if (result.result === 'Bye') {
        return {goal_id: {stamp: Date.now(), id: `fe`}, goal: 'SAD'};
      }
    })
    .filter(g => !!g);
  const facialExpressionAction = isolate(FacialExpressionAction)({
    state: sources.state,
    TabletFace: sources.TabletFace,
    goal: expression$,
  });
  facialExpressionAction.status.addListener({next: s =>
    console.log('FacialExpressionAction status', s)});


  // UI
  const vdom$ = xs.combine(
    speechbubbleAction.DOM.startWith(''),
    sources.TabletFace.events('dom').startWith(''),
  ).map(vdoms => div(vdoms));

  const reducer = xs.merge(
    speechbubbleAction.state,
    facialExpressionAction.state,
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

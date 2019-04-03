import xs from 'xstream';
import delay from 'xstream/extra/delay';
import isolate from '@cycle/isolate';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {div, makeDOMDriver} from '@cycle/dom';
import {
  makeTabletFaceDriver,
  FacialExpressionAction,
  SpeechbubbleAction,
} from '@cycle-robot-drivers/screen';

import {
  createConcurrentAction, selectActionResult
} from '@cycle-robot-drivers/action';


function main(sources) {
  sources.state.stream.addListener({next: s => console.debug('reducer state', s)});

  // "main" component
  const AllAction = createConcurrentAction(
    ['FacialExpressionAction', 'SpeechbubbleAction'],
    false,
  );
  const childSinks = isolate(AllAction, 'AllAction')({
  // const RaceAction = makeConcurrentAction(
  //   ['FacialExpressionAction', 'SpeechbubbleAction'],
  //   true,
  // );
  // const childSinks = isolate(RaceAction, 'RaceAction')({
    ...sources,
    goal: xs.of({
      FacialExpressionAction: 'HAPPY',
      SpeechbubbleAction: ['Hello'],
    }).compose(delay(1000)),
    cancel: xs.never(),
    FacialExpressionAction: {result: sources.state.stream
        .compose(selectActionResult('FacialExpressionAction'))},
    SpeechbubbleAction: {result: sources.state.stream
        .compose(selectActionResult('SpeechbubbleAction'))},
  });

  childSinks.result.addListener({next: r => console.log('result', r)});


  // Define Actions
  const facialExpressionAction = isolate(FacialExpressionAction, 'FacialExpressionAction')({
    ...childSinks.FacialExpressionAction,
    state: sources.state,
    TabletFace: sources.TabletFace,
  });
  const speechbubbleAction = isolate(SpeechbubbleAction, 'SpeechbubbleAction')({
    ...childSinks.SpeechbubbleAction,
    state: sources.state,
    DOM: sources.DOM,
  });


  // Define Reducers
  const reducer$ = xs.merge(
    facialExpressionAction.state,
    speechbubbleAction.state,
    childSinks.state,
  );


  // Define Sinks
  const vdom$ = xs.combine(
    speechbubbleAction.DOM.startWith(''),
    sources.TabletFace.events('dom').startWith(''),
  ).map(vdoms => div(vdoms));

  return {
    DOM: vdom$,
    TabletFace: facialExpressionAction.TabletFace,
    state: reducer$,
  };
}

run(withState(main), {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver(),
});

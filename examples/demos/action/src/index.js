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
  makeConcurrentAction, selectActionResult
} from '@cycle-robot-drivers/action';


function main(sources) {
  sources.state.stream.addListener({next: s => console.debug('reducer state', s)})

  // Process state stream
  const state$ = sources.state.stream;
  const facialExpressionResult$ = state$
    .compose(selectActionResult('FacialExpressionAction'));
  const speechbubbleResult$ = state$
    .compose(selectActionResult('SpeechbubbleAction'));


  // "main" component
  const AllAction = makeConcurrentAction(
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
    FacialExpressionAction: {result: facialExpressionResult$},
    SpeechbubbleAction: {result: speechbubbleResult$},
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
    // goal: childSinks.SpeechbubbleAction.goal,
    // cancel: childSinks.SpeechbubbleAction.cancel.debug().filter(v => !!v),
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

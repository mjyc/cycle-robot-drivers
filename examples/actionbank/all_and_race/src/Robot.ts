import xs from 'xstream';
import {Stream} from 'xstream';
import delay from 'xstream/extra/delay';
import {div, DOMSource, VNode} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {StateSource, Reducer} from '@cycle/state';
import {Result} from '@cycle-robot-drivers/action';
import {
  FacialExpressionAction,
  TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';
import {
  FacialExpressionActionSinks as FEASinks,
  TwoSpeechbuttonsActionSinks as TWASinks,
} from './types';
import {selectActionResult, makeConcurrentAction} from '@cycle-robot-drivers/actionbank';

export interface State {
  FacialExpressionAction: {result: Result},
  TwoSpeechbubblesAction: {result: Result},
}

export interface Sources {
  DOM: DOMSource,
  TabletFace: any,
  state: StateSource<State>,
}

export interface Sinks {
  DOM: Stream<VNode>,
  TabletFace: any,
  state: Stream<Reducer<State>>,
}

export default function Robot(sources: Sources): Sinks {
  // sources.state.stream.addListener({next: v => console.log('state$', v)})

  // Process state stream
  const state$ = sources.state.stream;
  const facialExpressionResult$ = state$
    .compose(selectActionResult('FacialExpressionAction'));
  const twoSpeechbubblesResult$ = state$
    .compose(selectActionResult('TwoSpeechbubblesAction'));


  // "main" component
  // const AllAction = makeConcurrentAction(
  //   ['FacialExpressionAction', 'TwoSpeechbubblesAction'],
  //   false,
  // );
  // const childSinks: any = isolate(AllAction, 'AllAction')({
  const RaceAction = makeConcurrentAction(
    ['FacialExpressionAction', 'TwoSpeechbubblesAction'],
    true,
  );
  const childSinks: any = isolate(RaceAction, 'RaceAction')({
    ...sources,
    goal: xs.of({
      FacialExpressionAction: 'happy',
      TwoSpeechbubblesAction: {message: 'Hello', choices: ['Hello']},
    }).compose(delay(1000)),
    FacialExpressionAction: {result: facialExpressionResult$},
    TwoSpeechbubblesAction: {result: twoSpeechbubblesResult$},
  });

  childSinks.result.addListener({next: r => console.log('result', r)});


  // Define Actions
  const facialExpressionAction: FEASinks = FacialExpressionAction({
    goal: childSinks.FacialExpressionAction,
    TabletFace: sources.TabletFace,
  });
  const twoSpeechbubblesAction: TWASinks = TwoSpeechbubblesAction({
    goal: childSinks.TwoSpeechbubblesAction,
    DOM: sources.DOM,
  });


  // Define Reducers
  const parentReducer$: Stream<Reducer<State>> = xs.merge(
    facialExpressionAction.result.map(result =>
      prev => ({...prev, FacialExpressionAction: {outputs: {result}}})),
    twoSpeechbubblesAction.result.map(result =>
      prev => ({...prev, TwoSpeechbubblesAction: {outputs: {result}}})),
  );
  const childReducer$: Stream<Reducer<State>> = childSinks.state;
  const reducer$ = xs.merge(parentReducer$, childReducer$);


  // Define Sinks
  const vdom$ = xs.combine(
    twoSpeechbubblesAction.DOM,
    sources.TabletFace.DOM,
  ).map(([speechbubbles, face]) =>
    div({
      style: {position: 'relative'}
    }, [speechbubbles, face])
  );

  return {
    DOM: vdom$,
    TabletFace: facialExpressionAction.output,
    state: reducer$,
  };
}
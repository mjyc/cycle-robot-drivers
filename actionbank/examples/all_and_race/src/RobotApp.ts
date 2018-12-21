import xs from 'xstream';
import {Stream} from 'xstream';
import delay from 'xstream/extra/delay';
import {DOMSource, div, VNode} from '@cycle/dom';
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

export interface State {
  FacialExpressionAction: {result: Result},
  TwoSpeechbubblesAction: {result: Result},
}

export interface Sources {
  DOM: DOMSource,
  TabletFace: any,
  state: StateSource<State>;
}

export interface Sinks {
  DOM: Stream<VNode>,
  TabletFace: any,
  state: Stream<Reducer<State>>,
}

export default function RobotApp(sources: Sources): Sinks {
  const facialExpressionAction: FEASinks = FacialExpressionAction({
    goal: xs.of('happy').compose(delay(1000)),
    TabletFace: sources.TabletFace,
  });
  const twoSpeechbubblesAction: TWASinks = TwoSpeechbubblesAction({
    goal: xs.of('Hello!').compose(delay(1000)),
    DOM: sources.DOM,
  });

  const reducer$: Stream<Reducer<State>> = xs.merge(
    xs.of((prev?) => ({
      FacialExpressionAction: {result: null},
      TwoSpeechbubblesAction: {result: null},
    })),
    facialExpressionAction.result.map(result => 
      prev => ({...prev, FacialExpressionAction: {result}})),
    twoSpeechbubblesAction.result.map(result =>
      prev => ({...prev, TwoSpeechbubblesAction: {result}})),
  );

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

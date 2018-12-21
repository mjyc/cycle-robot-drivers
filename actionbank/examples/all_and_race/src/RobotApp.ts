import xs from 'xstream';
import {Stream} from 'xstream';
import delay from 'xstream/extra/delay';
import {DOMSource, div, VNode, del} from '@cycle/dom';
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
import AllAction from './AllAction';

export interface State {
  FacialExpressionAction: {result: Result},
  TwoSpeechbubblesAction: {result: Result},
  AllAction?: any,  // TODO: import
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
  sources.state.stream.addListener({
    next: s => console.log(s),
  });

  const allAction: any = isolate(AllAction, 'AllAction')({
    ...sources,
    goal: xs.of({
      FacialExpressionAction: {goal: 'sad'},
      TwoSpeechbubblesAction: {goal: 'Hey'},
    }).compose(delay(1000)),
  });

  const facialExpressionAction: FEASinks = FacialExpressionAction({
    // goal: xs.of('happy').compose(delay(1000)),
    // goal: xs.never(),
    goal: allAction.FacialExpressionAction,
    TabletFace: sources.TabletFace,
    result: sources.state.stream.FacialExpressionAction
  });
  const twoSpeechbubblesAction: TWASinks = TwoSpeechbubblesAction({
    // goal: xs.of('Hello!').compose(delay(1000)),
    // goal: xs.never(),
    goal: allAction.TwoSpeechbubblesAction,
    DOM: sources.DOM,
    result: sources.state.stream.FacialExpressionAction
  });


  const parentReducer$: Stream<Reducer<State>> = xs.merge(
    xs.of(() => ({
      FacialExpressionAction: {result: null},
      TwoSpeechbubblesAction: {result: null},
    })),
    facialExpressionAction.result.map(result => 
      prev => ({...prev, FacialExpressionAction: {result}})),
    twoSpeechbubblesAction.result.map(result =>
      prev => ({...prev, TwoSpeechbubblesAction: {result}})),
  );
  const allActionReducer$: Stream<Reducer<State>> = allAction.state;
  const reducer$ = xs.merge(parentReducer$, allActionReducer$);

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

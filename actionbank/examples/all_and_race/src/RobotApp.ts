import xs from 'xstream';
import {Stream} from 'xstream';
import delay from 'xstream/extra/delay';
import {VNode, DOMSource, div} from '@cycle/dom';
import {StateSource, Reducer} from '@cycle/state';
// import {isEqualResult} from '@cycle-robot-drivers/action';
import {Result} from '@cycle-robot-drivers/action';
import {
  FacialExpressionAction,
  TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';

export interface State {
  FacialExpressionAction: {result: Result},
  TwoSpeechbubblesAction: {result: Result},
}

export interface Sources {
  DOM: DOMSource,
  TabletFace: any,
  state: StateSource<State>;
}

export default function RobotApp(sources: Sources) {
  const state$ = sources.state.stream;

  // output of will SubAction will go into here

  const facialExpressionAction = FacialExpressionAction({
    goal: xs.of('happy').compose(delay(1000)),
    TabletFace: sources.TabletFace,
  });
  const twoSpeechbubblesAction = TwoSpeechbubblesAction({
    goal: xs.of('Hello!').compose(delay(1000)),
    DOM: sources.DOM,
  });

  const goal = xs.of({
    FacialExpressionAction: {goal: 'happy'},
    TwoSpeechbubblesAction: {goal: 'Hello'},
  });

  // state$.FacialExpressionAction  // result

  const reducer$: Stream<Reducer<State>> = xs.merge(
    xs.of((prev?) => ({
      FacialExpressionAction: {result: null},
      TwoSpeechbubblesAction: {result: null},
    })),
    (facialExpressionAction.result as Stream<Result>)
      .map(result => 
        prev => ({...prev, FacialExpressionAction: {result}})),
    (twoSpeechbubblesAction.result as Stream<Result>)
      .map(result =>
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
    TabletFace: facialExpressionAction.output,
    DOM: vdom$,
    state: reducer$,
  };
}

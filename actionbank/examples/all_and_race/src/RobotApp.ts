import xs from 'xstream';
import {Stream} from 'xstream';
import delay from 'xstream/extra/delay';
import dropRepeats from 'xstream/extra/dropRepeats';
import {div, DOMSource, VNode} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {StateSource, Reducer} from '@cycle/state';
import {Status, Result, generateGoalID, isEqualResult} from '@cycle-robot-drivers/action';
import {
  FacialExpressionAction,
  TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';
import {
  FacialExpressionActionSinks as FEASinks,
  TwoSpeechbuttonsActionSinks as TWASinks,
} from './types';
import {createConcurrentAction} from '@cycle-robot-drivers/actionbank';

const AllAction = createConcurrentAction(
  ['FacialExpressionAction', 'TwoSpeechbubblesAction'],
  false,
);

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
  // Process state stream
  const state$ = sources.state.stream;
  const facialExpressionResult$ = state$
    .filter(s => !!s.FacialExpressionAction.result)
    .map(s => s.FacialExpressionAction.result)
    .compose(dropRepeats(isEqualResult))
    .startWith({
      status: {
        goal_id: generateGoalID(),
        status: Status.SUCCEEDED,
      },
      result: null,
    });
  const twoSpeechbubblesResult$ = state$
    .filter(s => !!s.TwoSpeechbubblesAction.result)
    .map(s => s.TwoSpeechbubblesAction.result)
    .compose(dropRepeats(isEqualResult))
    .startWith({
      status: {
        goal_id: generateGoalID(),
        status: Status.SUCCEEDED,
      },
      result: null,
    });


  // "main" component
  const childSinks: any = isolate(AllAction, 'AllAction')({
    ...sources,
    goal: xs.of({
      FacialExpressionAction: 'sad',
      TwoSpeechbubblesAction: {message: 'Hey', choices: ['hey']},
    }).compose(delay(1000)),
    FacialExpressionAction: {result: facialExpressionResult$},
    TwoSpeechbubblesAction: {result: twoSpeechbubblesResult$},
  });


  // Define Actions
  const facialExpressionAction: FEASinks = FacialExpressionAction({
    goal: childSinks.FacialExpressionAction,
    TabletFace: sources.TabletFace,
  });
  const twoSpeechbubblesAction: TWASinks = TwoSpeechbubblesAction({
    goal: childSinks.TwoSpeechbubblesAction,
    // goal: xs.merge(childSinks.TwoSpeechbubblesAction,
    //   xs.of(null).compose(delay(2000)),
    //   ),
    DOM: sources.DOM,
  });


  // Define Reducers
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

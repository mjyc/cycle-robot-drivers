import xs from 'xstream';
import {Stream} from 'xstream';
import delay from 'xstream/extra/delay';
import {div, DOMSource, VNode} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {StateSource, Reducer} from '@cycle/state';
import {Result, EventSource} from '@cycle-robot-drivers/action';
import {
  TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';
import {
  SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech';
import {
  selectActionResult,
  SpeakWithScreenAction,
} from '@cycle-robot-drivers/actionbank';
import {
  TwoSpeechbuttonsActionSinks as TWASinks,
  SpeechSynthesisActionSinks as SSSinks,
} from './types';

export interface State {
  TwoSpeechbubblesAction: {result: Result},
  SpeechSynthesisAction: {result: Result},
}

export interface Sources {
  DOM: DOMSource,
  TabletFace: any,
  SpeechSynthesis: EventSource,
  state: StateSource<State>;
}

export interface Sinks {
  DOM: Stream<VNode>,
  SpeechSynthesis: any,
  state: Stream<Reducer<State>>,
}

export default function RobotApp(sources: Sources): Sinks {
  // sources.state.stream.addListener({next: v => console.log('state$', v)})

  // Process state stream
  const state$ = sources.state.stream;
  const twoSpeechbubblesResult$: Stream<Result> = state$
    .compose(selectActionResult('TwoSpeechbubblesAction'));
  const speechSynthesisResult$: Stream<Result> = state$
    .compose(selectActionResult('SpeechSynthesisAction'));

  // "main" component
  const childSinks: any = isolate(SpeakWithScreenAction)({
    goal: xs.of('Hello world!').compose(delay(1000)),
    TwoSpeechbubblesAction: {result: twoSpeechbubblesResult$},
    SpeechSynthesisAction: {result: speechSynthesisResult$},
    state: sources.state,
  })

  childSinks.result.addListener({next: r => console.log('result', r)});


  // Define Actions
  const twoSpeechbubblesAction: TWASinks = TwoSpeechbubblesAction({
    goal: childSinks.TwoSpeechbubblesAction || xs.never(),
    DOM: sources.DOM,
  });
  const speechSynthesisAction: SSSinks = SpeechSynthesisAction({
    goal: childSinks.SpeechSynthesisAction || xs.never(),
    SpeechSynthesis: sources.SpeechSynthesis,
  });


  // Define Reducers
  const parentReducer$: Stream<Reducer<State>> = xs.merge(
    twoSpeechbubblesAction.result.map(result =>
      prev => ({...prev, TwoSpeechbubblesAction: {outputs: {result}}})),
    speechSynthesisAction.result.map(result =>
      prev => ({...prev, SpeechSynthesisAction: {outputs: {result}}})),
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
    SpeechSynthesis: speechSynthesisAction.output,
    state: reducer$,
  };
}

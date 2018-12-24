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
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import {selectActionResult} from '@cycle-robot-drivers/actionbank';
import {
  TwoSpeechbuttonsActionSinks as TWASinks,
  SpeechSynthesisActionSinks as SSSinks,
  SpeechRecogntionActionSinks as SRSinks,
} from './types';
import {FlowchartAction} from './FlowchartAction';

export interface State {
  FacialExpressionAction: {result: Result},
  TwoSpeechbubblesAction: {result: Result},
  SpeechSynthesisAction: {result: Result},
  SpeechRecognitionAction: {result: Result},
}

export interface Sources {
  DOM: DOMSource,
  TabletFace: any,
  SpeechSynthesis: EventSource,
  SpeechRecognition: EventSource,
  state: StateSource<State>;
}

export interface Sinks {
  DOM: Stream<VNode>,
  SpeechSynthesis: any,
  SpeechRecognition: any,
  state: Stream<Reducer<State>>,
}

export default function RobotApp(sources: Sources): Sinks {
  // sources.state.stream.addListener({next: v => console.log('state$', v)})

  // Process state stream
  const state$ = sources.state.stream;
  const twoSpeechbubblesResult$ = state$
    .compose(selectActionResult('TwoSpeechbubblesAction'));
  const speechSynthesisResult$ = state$
    .compose(selectActionResult('SpeechSynthesisAction'));
  const speechRecognitionResult$ = state$
    .compose(selectActionResult('SpeechRecognitionAction'));

  // "main" component
  const flowchart = {
    "ARE YOU HAPPY?": {
      "Yes": "KEEP DOING WHATEVER YOU'RE DOING",
      "No": "DO YOU WANT TO BE HAPPY?"
    },
    "DO YOU WANT TO BE HAPPY?": {
      "Yes": "CHANGE SOMETHING",
      "No": "KEEP DOING WHATEVER YOU'RE DOING"
    }
  };  
  const childSinks: any = isolate(FlowchartAction)({
    goal: xs.of({
      flowchart,
      start: 'ARE YOU HAPPY?',
    }).compose(delay(1000)),
    TwoSpeechbubblesAction: {result: twoSpeechbubblesResult$},
    SpeechSynthesisAction: {result: speechSynthesisResult$},
    SpeechRecognitionAction: {result: speechRecognitionResult$},
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
  const speechRecognitionAction: SRSinks = SpeechRecognitionAction({
    goal: childSinks.SpeechRecognitionAction || xs.never(),
    SpeechRecognition: sources.SpeechRecognition,
  });


  // Define Reducers
  const parentReducer$: Stream<Reducer<State>> = xs.merge(
    twoSpeechbubblesAction.result.map(result =>
      prev => ({...prev, TwoSpeechbubblesAction: {outputs: {result}}})),
    speechSynthesisAction.result.map(result => 
      prev => ({...prev, SpeechSynthesisAction: {outputs: {result}}})),
    speechRecognitionAction.result.map(result =>
      prev => ({...prev, SpeechRecognitionAction: {outputs: {result}}})),
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
    SpeechRecognition: speechRecognitionAction.output,
    state: reducer$,
  };
}

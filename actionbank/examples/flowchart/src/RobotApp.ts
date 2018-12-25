import xs from 'xstream';
import {Stream} from 'xstream';
import {div, DOMSource, VNode} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {StateSource, Reducer} from '@cycle/state';
import {Result, EventSource, isEqual, Status} from '@cycle-robot-drivers/action';
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
  state: StateSource<State>,
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
  const flowchartMetadata = [
    {
      name: 'How do you know if god exists?',
      path: '/src/data/how_do_you_know_if_god_exists.json',
      start: 'PRAY',
    },
    {
      name: 'Is it time to make changes in your life?',
      path: '/src/data/is_it_time_to_make_changes_in_your_life.json',
      start: 'ARE YOU HAPPY?'
    },
  ];

  // fetch flowchart data
  const data$ = xs.combine.apply(
    null,
    flowchartMetadata.map(d => xs.fromPromise(fetch(d.path, {
      headers: {
        "content-type": "application/json"
      }
    })).map(v => xs.fromPromise(v.json()).map(j => ({
      ...d,
      flowchart: j,
    }))).flatten()),
  );
  const goalId = {stamp: new Date(), id: '#main-screen'};
  const goal$ = xs.combine(data$, twoSpeechbubblesResult$)
    .filter(([data, r]) => isEqual(r.status.goal_id, goalId)
      && r.status.status !== Status.PREEMPTED)
    .map(([data, r]: [any, any]) => ({
      flowchart: data.filter(d => d.name === r.result)[0].flowchart,
      start: data.filter(d => d.name === r.result)[0].start,
    }));
  const childSinks: any = isolate(FlowchartAction)({
    goal: goal$,
    TwoSpeechbubblesAction: {result: twoSpeechbubblesResult$},
    SpeechSynthesisAction: {result: speechSynthesisResult$},
    SpeechRecognitionAction: {result: speechRecognitionResult$},
    state: sources.state,
  });

  // create the main menu screen
  const mainScreen$ = data$.map(data => ({
    goal_id: goalId,
    goal: {
      message: 'I can help you answer some questions',
      choices: data.map(d => d.name),
    }
  }));
  const twoSpeechbubblesGoal$ = xs.merge(
    xs.combine(mainScreen$, childSinks.result.startWith(null)).map(x => x[0]),
    childSinks.TwoSpeechbubblesAction,
  ) || xs.never();


  // Define Actions
  const twoSpeechbubblesAction: TWASinks = TwoSpeechbubblesAction({
    goal: twoSpeechbubblesGoal$,
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

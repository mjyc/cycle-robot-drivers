import xs from 'xstream';
import {Stream} from 'xstream';
import delay from 'xstream/extra/delay';
import dropRepeats from 'xstream/extra/dropRepeats';
import {div, DOMSource, VNode} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {StateSource, Reducer} from '@cycle/state';
import {Status, Result, EventSource, generateGoalID, isEqualResult} from '@cycle-robot-drivers/action';
import {
  FacialExpressionAction,
  TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';
import {
  SpeechSynthesisAction,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import {
  FacialExpressionActionSinks as FEASinks,
  TwoSpeechbuttonsActionSinks as TWASinks,
  SpeechSynthesisActionSinks as SSSinks,
  SpeechRecogntionActionSinks as SRSinks,
} from './types';
import {QuestionAnswerAction} from './QuestionAnswerAction';
import { QuestionAnswerAction2 } from './QuestionAnswerAction2';

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
  TabletFace: any,
  SpeechSynthesis: any,
  SpeechRecognition: any,
  state: Stream<Reducer<State>>,
}

export default function RobotApp(sources: Sources): Sinks {
  sources.state.stream.addListener({next: v => console.log('state$', v)})

  // Process state stream
  const state$ = sources.state.stream;
  const selectActionResult = (actionName: string) =>
    (in$: Stream<State>) => in$
      .map(s => s[actionName].result)
      .compose(dropRepeats(isEqualResult));
  const facialExpressionResult$ = state$
    .compose(selectActionResult('FacialExpressionAction'));
  const twoSpeechbubblesResult$ = state$
    .compose(selectActionResult('TwoSpeechbubblesAction'));
  const speechSynthesisResult$ = state$
    .compose(selectActionResult('SpeechSynthesisAction'));
  const speechRecognitionResult$ = state$
    .compose(selectActionResult('SpeechRecognitionAction'));


  // "main" component
  // const childSinks: any = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
  //   goal: xs.merge(
  //     xs.of({
  //       question: 'How are you?',
  //       answers: ['good', 'bad'],
  //     }).compose(delay(1000)),
  //     xs.of({
  //       question: 'How was today?',
  //       answers: ['Great', 'Okay'],
  //     }).compose(delay(2000))
  //   ),
  //   SpeechSynthesisAction: {result: speechSynthesisResult$},
  //   SpeechRecognitionAction: {result: speechRecognitionResult$},
  //   state: sources.state,
  // });
  const childSinks: any = isolate(QuestionAnswerAction2)({
    ...sources,
    goal: xs.of({
      FacialExpressionAction: 'happy',
      TwoSpeechbubblesAction: {message: 'Hello', choices: ['Hello']},
    }).compose(delay(1000)),
    FacialExpressionAction: {result: facialExpressionResult$},
    TwoSpeechbubblesAction: {result: twoSpeechbubblesResult$},
  })

  childSinks.result.addListener({next: r => console.log('result', r)});


  // Define Actions
  const facialExpressionAction: FEASinks = FacialExpressionAction({
    goal: childSinks.FacialExpressionAction || xs.never(),
    TabletFace: sources.TabletFace,
  });
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
  const createDummyResult = () => ({
    status: {
      goal_id: generateGoalID(),
      status: Status.SUCCEEDED,
    },
    result: null,
  });
  const parentReducer$: Stream<Reducer<State>> = xs.merge(
    xs.of(() => ({
      FacialExpressionAction: {result: createDummyResult()},
      TwoSpeechbubblesAction: {result: createDummyResult()},
      SpeechSynthesisAction: {result: createDummyResult()},
      SpeechRecognitionAction: {result: createDummyResult()},
    })),
    facialExpressionAction.result.map(result => 
      prev => ({...prev, FacialExpressionAction: {result}})),
    twoSpeechbubblesAction.result.map(result =>
      prev => ({...prev, TwoSpeechbubblesAction: {result}})),
    speechSynthesisAction.result.map(result => 
      prev => ({...prev, SpeechSynthesisAction: {result}})),
    speechRecognitionAction.result.map(result =>
      prev => ({...prev, SpeechRecognitionAction: {result}})),
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
    SpeechSynthesis: speechSynthesisAction.output,
    SpeechRecognition: speechRecognitionAction.output,
    state: reducer$,
  };
}

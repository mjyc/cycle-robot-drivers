import xs from 'xstream';
import {Stream} from 'xstream';
import delay from 'xstream/extra/delay';
import {div, DOMSource, VNode} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {StateSource, Reducer} from '@cycle/state';
import {
  Result, EventSource,
  selectActionResult
} from '@cycle-robot-drivers/action';
import {
  SpeechbubbleAction,
  SpeechbubbleActionSinks,
} from '@cycle-robot-drivers/screen';

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

function QuestionAnswerAction(sources) {

}

export default function Robot(sources: Sources): Sinks {
  sources.state.stream.addListener({next: s => console.debug('reducer state', s)});

  // "main" component
  const childSinks: any = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    goal: xs.merge(
      xs.of({
        message: 'How are you?',
        choices: ['good', 'bad'],
      }).compose(delay(1000)),
      xs.of({
        message: 'How was today?',
        choices: ['Great', 'Okay'],
      }).compose(delay(2000))
    ),
    RobotSpeechbubbleAction: {result: sources.state.stream
        .compose(selectActionResult('RobotSpeechbubbleAction'))},
    HumanSpeechbubbleAction: {result: sources.state.stream
        .compose(selectActionResult('HumanSpeechbubbleAction'))},
    state: sources.state,
  });
  childSinks.result.addListener({next: r => console.log('result', r)});


  // Define Actions
  const robotSpeechbubbleAction: SpeechbubbleActionSinks =
      isolate(SpeechbubbleAction, 'RobotSpeechbubbleAction')({
        ...childSinks.RobotSpeechbubbleAction,
        DOM: sources.DOM,
      });
  const humanSpeechbubbleAction: SpeechbubbleActionSinks =
      isolate(SpeechbubbleAction, 'HUmanSpeechbubbleAction')({
        ...childSinks.HumanSpeechbubbleAction,
        DOM: sources.DOM,
      });


  // Define Sinks
  const vdom$ = xs.combine(
    twoSpeechbubblesAction.DOM,
    sources.TabletFace.DOM,
  ).map((vdoms) =>
    div({
      style: {position: 'relative'}
    }, vdoms)
  );
  const reducer$ = xs.merge(
    robotSpeechbubbleAction.state,
    humanSpeechbubbleAction.state,
    childSinks.state,
  );

  return {
    DOM: vdom$,
    state: reducer$,
  };
}

import xs, {Stream} from 'xstream';
import isolate from '@cycle/isolate';
import {Result} from '@cycle-robot-drivers/action';
import {makeConcurrentAction} from './makeConcurrentAction';
import {QuestionAnswerAction} from './QuestionAnswerAction';
import {selectActionResult} from './utils';
import {StateSource, Reducer} from '@cycle/state';
import {State as RaceActionState} from './makeConcurrentAction';
import {State as QuestionAnswerActionState} from './QuestionAnswerAction';

export interface State {
  RaceAction: RaceActionState,
  QuestionAnswerAction: QuestionAnswerActionState,
}

export interface Sources {
  goal: Stream<any>,
  TwoSpeechbubblesAction: any,
  SpeechSynthesisAction: any,
  SpeechRecognitionAction: any,
  state: StateSource<State>,
}

export interface Sinks {
  result: Stream<Result>,
  TwoSpeechbubblesAction: {result: Stream<Result>},
  SpeechSynthesisAction: {result: Stream<Result>},
  SpeechRecognitionAction: {result: Stream<Result>},
  state: Stream<Reducer<State>>;
}

export function QAWithScreenAction(sources: Sources): Sinks {
  sources.state.stream.addListener({next: v => console.log('state$', v)})

  const state$ = sources.state.stream;
  const questionAnswerResult$ = state$
    .compose(selectActionResult('QuestionAnswerAction'));

  const RaceAction = makeConcurrentAction(
    ['TwoSpeechbubblesAction', 'QuestionAnswerAction'],
    true,
  );
  const raceSinks: any = isolate(RaceAction, 'RaceAction')({
    goal: sources.goal.map(g => ({
      QuestionAnswerAction: g,
      TwoSpeechbubblesAction: {message: g.question, choices: g.answers},
    })),
    TwoSpeechbubblesAction: sources.TwoSpeechbubblesAction,
    QuestionAnswerAction: {result: questionAnswerResult$},
    state: sources.state,
  });
  // raceSinks.result.addListener({next: v => console.log('raceSinks.result', v)});
  const qaSinks: any = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    goal: raceSinks.QuestionAnswerAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
    SpeechRecognitionAction: sources.SpeechRecognitionAction,
    state: sources.state,
  });
  // qaSinks.result.addListener({next: v => console.log('qaSinks.result', v)});

  const reducer$: any = xs.merge(raceSinks.state, qaSinks.state);
  
  return {
    result: raceSinks.result,
    TwoSpeechbubblesAction: raceSinks.TwoSpeechbubblesAction,
    SpeechSynthesisAction: qaSinks.SpeechSynthesisAction,
    SpeechRecognitionAction: qaSinks.SpeechRecognitionAction,
    state: reducer$,
  };
}

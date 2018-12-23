import xs, {Stream} from 'xstream';
import isolate from '@cycle/isolate';
import {Result, initGoal} from '@cycle-robot-drivers/action';
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
  // sources.state.stream.addListener({next: v => console.log('reducerState$', v)})

  const reducerState$ = sources.state.stream;
  const questionAnswerResult$ = reducerState$
    .compose(selectActionResult('QuestionAnswerAction'));

  const goal$ = sources.goal
    .filter(g => typeof g !== 'undefined').map(g => initGoal(g))
    .map(g => ({
      goal_id: g.goal_id,
      goal: {
        QuestionAnswerAction: g.goal,
        TwoSpeechbubblesAction: {
          message: g.goal.question,
          choices: g.goal.answers
        },
      },
    }));
  const RaceAction = makeConcurrentAction(
    ['TwoSpeechbubblesAction', 'QuestionAnswerAction'],
    true,
  );
  const raceSinks: any = isolate(RaceAction, 'RaceAction')({
    goal: goal$,
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

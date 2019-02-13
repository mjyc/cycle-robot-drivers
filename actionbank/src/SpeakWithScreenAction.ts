import {Stream} from 'xstream';
import isolate from '@cycle/isolate';
import {Reducer, StateSource} from '@cycle/state';
import {Result, initGoal} from '@cycle-robot-drivers/action';
import {
  makeConcurrentAction, State as RaceActionState
} from './makeConcurrentAction';

export interface State {
  RaceAction: RaceActionState,
  QuestionAnswerAction: any,
}

export interface Sources {
  goal: Stream<any>,
  TwoSpeechbubblesAction: {result: Stream<Result>},
  SpeechSynthesisAction: {result: Stream<Result>},
  state: StateSource<State>,
}

export interface Sinks {
  result: Stream<Result>,
  TwoSpeechbubblesAction: Stream<any>,
  SpeechSynthesisAction: Stream<any>,
  state: Stream<Reducer<State>>;
}

export function SpeakWithScreenAction(sources: Sources): Sinks {
  // sources.state.stream.addListener({next: v => console.debug('reducerState$', v)})

  const goal$ = sources.goal
    .filter(g => typeof g !== 'undefined')
    .map(g => g === null ? null : initGoal({
      goal_id: g.goal_id,
      goal: {
        TwoSpeechbubblesAction: g.goal,
        SpeechSynthesisAction: g.goal,
      },
    }));
  const RaceAction = makeConcurrentAction(
    ['TwoSpeechbubblesAction', 'SpeechSynthesisAction'],
    false,
  );
  const raceSinks: any = isolate(RaceAction, 'RaceAction')({
    goal: goal$,
    TwoSpeechbubblesAction: sources.TwoSpeechbubblesAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
    state: sources.state,
  });
  // raceSinks.result.addListener({next: v => console.debug('raceSinks.result', v)});

  const reducer$: any = raceSinks.state;

  return {
    result: raceSinks.result,
    TwoSpeechbubblesAction: raceSinks.TwoSpeechbubblesAction,
    SpeechSynthesisAction: raceSinks.SpeechSynthesisAction,
    state: reducer$,
  };
}

import xs, {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {
  GoalID, Goal, GoalStatus, Status, Result,
  ActionSources, ActionSinks,
  EventSource,
  initGoal, generateGoalStatus, isEqualGoalStatus, isEqualGoalID,
} from '@cycle-robot-drivers/action';

enum State {
  WAIT = 'WAIT',
  RUN = 'RUN',
  PREEMPT = 'PREEMPT',
}

type Variables = {
  goal_id: GoalID,
  newGoal: Goal,
};

type Outputs = {
  AudioPlayer?: any,
  result?: Result,
};

type ReducerState = {
  state: State,
  variables: Variables,
  outputs: Outputs,
};

type Reducer = (prev?: ReducerState) => ReducerState | undefined;

enum InputType {
  GOAL = 'GOAL',
  CANCEL = 'CANCEL',
  ENDED = 'ENDED',
  PAUSE = 'PAUSE',
}

type Input = {
  type: InputType,
  value: Goal | GoalID | string,
};


function input(
  goal$: Stream<Goal | string>,
  cancel$: Stream<GoalID>,
  audioPlayerEndedEvent$: Stream<GoalID>,
  audioPlayerPausedEvent$: Stream<GoalID>,
): Stream<Input> {
  return xs.merge(
    goal$.filter(g => typeof g !== 'undefined' && g !== null)
      .map(g => initGoal(g))
      .map(goal => ({
        type: InputType.GOAL,
        value: typeof goal.goal === 'string' ? {
          goal_id: goal.goal_id,
          goal: {src: goal.goal},
        } : goal,
      })),
    cancel$.map(val => ({type: InputType.CANCEL, value: val})),
    audioPlayerEndedEvent$.mapTo({
      type: InputType.ENDED,
      value: null,
    }),
    audioPlayerPausedEvent$.mapTo({
      type: InputType.PAUSE,
      value: null,
    }),
  );
}

function transition(prev: ReducerState, input: Input): ReducerState {
  if (prev.state === State.WAIT) {
    if (input.type === InputType.GOAL) {
      const goal = (input.value as Goal);
      return {
        ...prev,
        state: State.RUN,
        variables: {
          goal_id: goal.goal_id,
          newGoal: null,
        },
        outputs: {
          AudioPlayer: goal.goal,
        },
      };
    }
  } else if (prev.state === State.RUN) {
    if (input.type === InputType.GOAL || input.type === InputType.CANCEL
        && (input.value === null ||
            isEqualGoalID(input.value as GoalID, prev.variables.goal_id))) {
      return {
        ...prev,
        state: State.PREEMPT,
        variables: {
          ...prev.variables,
          newGoal: input.type === InputType.GOAL ? (input.value as Goal) : null,
        },
        outputs: {
          AudioPlayer: null,
        },
      };
    } else if (input.type === InputType.ENDED) {
      return {
        ...prev,
        state: State.WAIT,
        variables: {
          goal_id: null,
          newGoal: null,
        },
        outputs: {
          result: {
            status: {
              goal_id: prev.variables.goal_id,
              status: Status.SUCCEEDED,
            },
            result: input.value,
          },
        },
      };
    }
  } else if (prev.state === State.PREEMPT) {
    if (input.type === InputType.ENDED || input.type === InputType.PAUSE) {
      const newGoal = prev.variables.newGoal;
      return {
        ...prev,
        state: !!newGoal ? State.RUN : State.WAIT,
        variables: {
          goal_id: !!newGoal ? newGoal.goal_id : null,
          newGoal: null,
        },
        outputs: {
          AudioPlayer: !!newGoal ? newGoal.goal : undefined,
          result: {
            status: {
              goal_id: prev.variables.goal_id,
              status: Status.PREEMPTED,
            },
            result: input.value,
          },
        },
      };
    }
  }
  return prev;
}

function transitionReducer(input$: Stream<Input>): Stream<Reducer> {
  const initReducer$: Stream<Reducer> = xs.of(
    function initReducer(prev: ReducerState): ReducerState {
      return {
        state: State.WAIT,
        variables: {
          goal_id: null,
          newGoal: null,
        },
        outputs: null,
      }
    }
  );

  const inputReducer$: Stream<Reducer> = input$
    .map(input => function inputReducer(prev: ReducerState): ReducerState {
      return transition(prev, input);
    });

  return xs.merge(initReducer$, inputReducer$);
}

function status(reducerState$): Stream<GoalStatus> {
  const done$: Stream<GoalStatus> = reducerState$
    .filter(rs => !!rs.outputs && !!rs.outputs.result)
    .map(rs => rs.outputs.result.status);
  const active$: Stream<GoalStatus> = reducerState$
    .filter(rs => rs.state === State.RUN)
    .map(rs => ({goal_id: rs.variables.goal_id, status: Status.ACTIVE}));
  const initGoalStatus = generateGoalStatus({status: Status.SUCCEEDED});
  return xs.merge(done$, active$)
    .compose(dropRepeats(isEqualGoalStatus))
    .startWith(initGoalStatus);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(rs => !!rs.outputs)
    .map(rs => rs.outputs);
  return {
    result: outputs$
      .filter(o => !!o.result)
      .map(o => o.result),
    AudioPlayer: outputs$
      .filter(o => typeof o.AudioPlayer !== 'undefined')
      .map(o => o.AudioPlayer),
  };
};

export interface Sources extends ActionSources {
  AudioPlayer: EventSource,
}

export interface Sinks extends ActionSinks {
  AudioPlayer: any,
}

/**
 * AudioPlayerAction action component.
 *
 * @param sources
 *
 *   * goal: a stream of `{src: string}` (as HTML audio
 *     [src](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-src))
 *     or a string (as a value of `src`).
 *   * AudioPlayer: `EventSource` for `ended` and `pause` events.
 *
 * @return sinks
 *
 *   * state: a reducer stream.
 *   * status: a stream of action status.
 *   * result: a stream of action results.
 *   * AudioPlayer: a stream for `AudioPlayer` driver input.
 *
 */
export function AudioPlayerAction(sources: Sources): Sinks {
  const input$ = input(
    sources.goal || xs.never(),
    sources.cancel || xs.never(),
    sources.AudioPlayer.events('ended'),
    sources.AudioPlayer.events('pause'),
  );
  const reducer = transitionReducer(input$);;
  const status$ = status(sources.state.stream);
  const outputs = output(sources.state.stream);
  return {
    state: reducer,
    status: status$,
    ...outputs
  };
}

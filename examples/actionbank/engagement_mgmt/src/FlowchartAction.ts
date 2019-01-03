import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {Stream} from 'xstream';
import isolate from '@cycle/isolate';
import {StateSource, Reducer} from '@cycle/state';
import {
  Goal, GoalID, Result, Status, initGoal, isEqualGoal, isEqualResult,
} from '@cycle-robot-drivers/action';
import {
  Omit, FSMReducerState,
  QAWithScreenActionSources, QAWithScreenActionSinks, QAWithScreenAction,
  SpeakWithScreenAction
} from '@cycle-robot-drivers/actionbank';

// FSM types
enum S {
  PEND = 'PEND',
  MONOLOGUE = 'MONOLOGUE',
  QUESTION_ANSWER = 'QUESTION_ANSWER',
  INSTRUCTION = 'INSTRUCTION',
}

enum SIGType {
  GOAL = 'GOAL',
  CANCEL = 'CANCEL',
  MONO_DONE = 'MONO_DONE',
  QA_SUCCEEDED = 'QA_SUCCEEDED',
  QA_FAILED = 'QA_FAILED',
  INST_SUCCEEDED = 'INST_SUCCEEDED',
  INST_FAILED = 'INST_FAILED',
}

export type SIG = {
  type: SIGType,
  value?: any,
}

export type V = {
  goal_id: GoalID,
  flowchart: any,
  node: any,
}

export type LAM = {
  result?: Result,
  MonologueAction?: {goal: Goal},
  QuestionAnswerAction?: {goal: Goal},
  InstructionAction?: {goal: Goal},
}

// Reducer types
export interface State extends FSMReducerState<S, V, LAM> {
  QuestionAnswerAction?: any,
}

// Component types
export interface Sources extends Omit<QAWithScreenActionSources, 'state'> {
  state: StateSource<State>,
}

export interface Sinks extends Omit<QAWithScreenActionSinks, 'state'>{
  state: Stream<Reducer<State>>;
}

function input(
  goal$: Stream<any>,
  monologueResult$: Stream<Result>,
  questionAnswerResult$: Stream<Result>,
  instructionResult$: Stream<Result>,
): Stream<SIG> {
  return xs.merge(
    goal$.filter(g => typeof g !== 'undefined').map(g => (g === null)
      ? ({type: SIGType.CANCEL, value: null})
      : ({type: SIGType.GOAL, value: initGoal(g)})),
    monologueResult$
      .filter(r => r.status.status === Status.SUCCEEDED)
      .mapTo({type: SIGType.MONO_DONE}).debug(),
    questionAnswerResult$
      .filter(r => r.status.status === Status.SUCCEEDED)
      .map(r => ({type: SIGType.QA_SUCCEEDED, value: r.result})),
    questionAnswerResult$
      .filter(r => r.status.status !== Status.SUCCEEDED)
      .map(r => ({type: SIGType.QA_FAILED, value: r.result})),
    instructionResult$
      .filter(r => r.status.status === Status.SUCCEEDED)
      .map(r => ({type: SIGType.INST_SUCCEEDED, value: r.result})),
    instructionResult$
      .filter(r => r.status.status !== Status.SUCCEEDED)
      .map(r => ({type: SIGType.INST_FAILED, value: r.result})),
  );
}

function reducer(input$: Stream<SIG>): Stream<Reducer<State>> {
  const initReducer$: Stream<Reducer<State>> = xs.of((prev?: State): State => {
    if (typeof prev === 'undefined') {
      return {
        state: S.PEND,
        variables: null,
        outputs: null,
      };
    } else {
      return prev;
    }
  });

  const transitionReducer$: Stream<Reducer<State>> = input$.map((input: SIG) => (prev: State): State => {
    console.debug('input', input, 'prev', prev);
    if (prev.state === S.PEND && input.type === SIGType.GOAL) {  // goal-received
      const flowchart = Object.assign(
        {},
        ...Array.from(
          input.value.goal.flowchart, ({id, ...o}) => ({[id]: {id, ...o}})
        ),
      );
      const node = flowchart[input.value.goal.start_id];
      if (node && node.type === 'MONOLOGUE') {
        return {
          ...prev,
          state: S.MONOLOGUE,
          variables: {
            goal_id: input.value.goal_id,
            flowchart,
            node,
          },
          outputs: {
            MonologueAction: {
              goal: initGoal(node.arg),
            },
          },
        };
      } else if (node.type === 'INSTRUCTION') {
        return {
          ...prev,
          state: S.INSTRUCTION,
          variables: {
            goal_id: input.value.goal_id,
            flowchart,
            node,
          },
          outputs: {
            InstructionAction: {
              goal: initGoal({
                question: node.arg,
                answers: ['Done'],
              }),
            },
          },
        };
      }
    } else if (
      prev.state === S.MONOLOGUE && input.type === SIGType.MONO_DONE
      || prev.state === S.INSTRUCTION && input.type === SIGType.INST_SUCCEEDED
    ) {
      const node = prev.variables.flowchart[prev.variables.node.next];
      if (!node) {  // deadend
        return {
          ...prev,
          state: S.PEND,
          variables: null,
          outputs: {
            result: {
              status: {
                goal_id: prev.variables.goal_id,
                status: Status.SUCCEEDED,
              },
              result: prev.variables.node,
            },
          },
        };
      } else if (node.type === 'MONOLOGUE') {
        return {
          ...prev,
          state: S.MONOLOGUE,
          variables: {
            ...prev.variables,
            node,
          },
          outputs: {
            MonologueAction: {
              goal: initGoal(node.arg),
            },
          },
        };
      } else if (node.type === 'INSTRUCTION') {
        return {
          ...prev,
          state: S.INSTRUCTION,
          variables: {
            ...prev.variables,
            node,
          },
          outputs: {
            InstructionAction: {
              goal: initGoal({
                question: node.arg,
                answers: ['Done'],
              }),
            },
          },
        };
      }
    }
    return prev;
  });

  return xs.merge(initReducer$, transitionReducer$);
}

function output(reducerState$: Stream<State>) {
  const outputs$ = reducerState$
    .filter(m => !!m.outputs)
    .map(m => m.outputs);
  return {
    result: outputs$
      .filter(o => !!o.result)
      .map(o => o.result)
      .compose(dropRepeats(isEqualResult)),
    MonologueAction: outputs$
      .filter(o => !!o.MonologueAction)
      .map(o => o.MonologueAction.goal)
      .compose(dropRepeats(isEqualGoal)),
    QuestionAnswerAction: outputs$
      .filter(o => !!o.QuestionAnswerAction)
      .map(o => o.QuestionAnswerAction.goal)
      .compose(dropRepeats(isEqualGoal)),
    InstructionAction: outputs$
      .filter(o => !!o.InstructionAction)
      .map(o => o.InstructionAction.goal)
      .compose(dropRepeats(isEqualGoal)),
  };
}

export function FlowchartAction(sources: Sources): Sinks {
  sources.state.stream.addListener({next: v => console.log('state$', v)})

  const qaGoalProxy$ = xs.create();
  const qaSinks = isolate(QAWithScreenAction, 'QuestionAnswerAction')({
    ...sources,
    goal: qaGoalProxy$,
  });
  const monoGoalProxy$ = xs.create();
  const monoSinks = isolate(SpeakWithScreenAction, 'SpeakWithScreenAction')({
    goal: monoGoalProxy$,
    TwoSpeechbubblesAction: sources.TwoSpeechbubblesAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
    state: sources.state,
  });
  const instGoalProxy$ = xs.create();
  const instSinks = isolate(QAWithScreenAction, 'InstructionAction')({
    ...sources,
    goal: instGoalProxy$,
  });

  const input$ = input(
    sources.goal,
    sources.SpeechSynthesisAction.result,
    qaSinks.result,
    instSinks.result,
  );
  const parentReducer$ = reducer(input$);
  const reducer$ = xs.merge(
    parentReducer$,
    qaSinks.state as Stream<Reducer<State>>,
    monoSinks.state as Stream<Reducer<State>>,
    instSinks.state as Stream<Reducer<State>>,
  );
  const reducerState$ = sources.state.stream;
  const outputs = output(reducerState$);
  qaGoalProxy$.imitate(outputs.QuestionAnswerAction.compose(dropRepeats(isEqualGoal)));
  monoGoalProxy$.imitate(outputs.MonologueAction.compose(dropRepeats(isEqualGoal)));
  instGoalProxy$.imitate(outputs.InstructionAction.compose(dropRepeats(isEqualGoal)));

  const speechbubbles$ = xs.merge(
    qaSinks.TwoSpeechbubblesAction,
    monoSinks.TwoSpeechbubblesAction,
    instSinks.TwoSpeechbubblesAction,
  );
  const speak$ = xs.merge(
    qaSinks.SpeechSynthesisAction,
    monoSinks.SpeechSynthesisAction,
    instSinks.SpeechSynthesisAction,
  );
  const recog$ = xs.merge(
    qaSinks.SpeechRecognitionAction,
    instSinks.SpeechRecognitionAction,
  )
  return {
    result: outputs.result,
    TwoSpeechbubblesAction: speechbubbles$,
    SpeechSynthesisAction: speak$,
    SpeechRecognitionAction: recog$,
    state: reducer$,
  };
}

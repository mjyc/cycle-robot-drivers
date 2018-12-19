import xs from 'xstream';
import {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import isolate from '@cycle/isolate';
import {StateSource, Reducer as StateReducer} from '@cycle/state';
import {
  GoalID, Status, initGoal, isEqualGoal, isEqualResult
} from '@cycle-robot-drivers/action';
import {Omit, ReducerState} from './types';
import QuestionAnswerAction from './QuestionAnswerAction';
import {
  RState as QARState, Sources as QASources, Outputs as QAOutputs
} from './QuestionAnswerAction';

enum FSMState {
  PEND = 'PEND',
  QA = 'QA',
  SAY = 'SAY',
}

enum InputType {
  GOAL = 'GOAL',
  QA_SUCCEEDED = 'QA_SUCCEEDED',
  QA_FAILED = 'QA_FAILED',
  SAY_DONE = 'SAY_DONE',
}

export type Variables = {
  flowchart: any,
  node: string,
  goal_id: GoalID,
  QuestionAnswerAction: QARState,
}

export type RState = ReducerState<FSMState, Variables, any>;

export type Reducer = StateReducer<RState>;

export interface Outputs extends QAOutputs {
  QuestionAnswerAction: Stream<any>
}

export interface Sources extends Omit<QASources, 'state'> {
  state: StateSource<RState>,
}

export interface Sinks {
  outputs: Outputs,
  state: Stream<Reducer>,
}

function input(
  goal$,
  state$,
  speechSynthesisAction,
) {
  const qaResult$ = state$
    .filter(s => !!s.QuestionAnswerAction
      && !!s.QuestionAnswerAction.outputs
      && !!s.QuestionAnswerAction.outputs.result)
    .map(s => s.QuestionAnswerAction.outputs.result)
    .compose(dropRepeats(isEqualResult));
  return xs.merge(
    goal$.map(x => ({type: InputType.GOAL, value: initGoal(x)})),
    qaResult$
      .filter(r => r.status.status === Status.SUCCEEDED)
      .map(r => ({type: InputType.QA_SUCCEEDED, value: r.result})),
    qaResult$
      .filter(r => r.status.status !== Status.SUCCEEDED)
      .map(r => ({type: InputType.QA_FAILED, value: r.result})),
    speechSynthesisAction.result
      .filter(result => result.status.status === 'SUCCEEDED')
      .mapTo({type: InputType.SAY_DONE}),
  );
}

function reducer(input$) {
  const initReducer$: Stream<Reducer> = xs.of(function(prev) {
    if (typeof prev === 'undefined') {
      return {
        state: FSMState.PEND,
        variables: null,
        outputs: null,
      };
    } else {
      return prev;
    }
  });

  const transitionReducer$: Stream<Reducer> = input$.map(input => function(prev) {
    console.debug('input', input, 'prev', prev);
    if (prev.state === FSMState.PEND && input.type === InputType.GOAL) {  // goal-received
      const node = input.value.goal.start;
      const next = input.value.goal.flowchart[node];
      if (typeof next === 'string' || !next) {  // do Monologue
        return {
          state: FSMState.SAY,
          variables: {
            flowchart: input.value.goal.flowchart,
            node: node,
            goal_id: input.value.goal_id,
          },
          outputs: {
            SpeechSynthesisAction: {
              goal: initGoal(node),
            },
          },
          QuestionAnswerAction: prev.QuestionAnswerAction,
        };
      } else {  // do QA
        return {
          state: FSMState.QA,
          variables: {
            flowchart: input.value.goal.flowchart,
            node: node,
            goal_id: input.value.goal_id,
          },
          outputs: {
            QuestionAnswerAction: {
              goal: initGoal({
                question: node,
                answers: Object.keys(next),
              }),
            },
          },
          QuestionAnswerAction: prev.QuestionAnswerAction,
        }
      }
    } else if (prev.state === FSMState.SAY && input.type === InputType.SAY_DONE) {  // monologue-done
      const node = prev.variables.flowchart[prev.variables.node];
      const next = prev.variables.flowchart[node];
      if (!node) {  // deadend
        return {
          ...prev,
          state: FSMState.PEND,
          variables: null,
          outputs: {
            result: {
              status: {
                goal_id: prev.variables.goal_id,
                status: Status.SUCCEEDED,
              },
              result: prev.variables.node,
            }
          }
        };
      } else if (typeof next === 'string' || !next) {  // do Monologue
        return {
          ...prev,
          state: FSMState.SAY,
          variables: {
            ...prev.variables,
            node: node,
          },
          outputs: {
            SpeechSynthesisAction: {
              goal: initGoal(node),
            },
          },
        };
      } else {  // do QA
        return {
          ...prev,
          state: FSMState.QA,
          variables: {
            ...prev.variables,
            node: node,
          },
          outputs: {
            QuestionAnswerAction: {
              goal: initGoal({
                question: node,
                answers: Object.keys(next),
              })
            },
          },
        };
      }
    } else if (prev.state === FSMState.QA && input.type === InputType.QA_SUCCEEDED) {  // qa-done
      const node = prev.variables.flowchart[prev.variables.node][input.value];
      const next = prev.variables.flowchart[node];
      if (typeof next === 'string' || !next) {  // do Monologue
        return {
          ...prev,
          state: FSMState.SAY,
          variables: {
            ...prev.variables,
            node: node
          },
          outputs: {
            SpeechSynthesisAction: {
              goal: initGoal(node)
            },
          },
        };
      } else {  // do QA
        return {
          ...prev,
          state: FSMState.QA,
          variables: {
            ...prev.variables,
            node: node
          },
          outputs: {
            QuestionAnswerAction: {
              goal: initGoal({
                question: node,
                answers: Object.keys(next),
              })
            },
          },
        };
      }
    } else if (prev.state === FSMState.QA && input.type === InputType.QA_FAILED) {  // qa-failed
      return {
        state: FSMState.PEND,
        variables: null,
        outputs: {
          result: {
            status: {
              goal_id: prev.variables.goal_id,
              status: Status.ABORTED,
            },
            result: prev.variables.node,
          }
        },
        QuestionAnswerAction: prev.QuestionAnswerAction,
      };
    }
    return prev;
  });

  return xs.merge(initReducer$, transitionReducer$);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(m => !!m.outputs)
    .map(m => m.outputs);
  return {
    SpeechSynthesisAction: outputs$
      .filter(o => !!o.SpeechSynthesisAction)
      .map(o => o.SpeechSynthesisAction.goal)
      .compose(dropRepeats(isEqualGoal)),
    QuestionAnswerAction: outputs$
      .filter(o => !!o.QuestionAnswerAction)
      .map(o => o.QuestionAnswerAction.goal)
      .compose(dropRepeats(isEqualGoal)),
  };
}

export default function FlowchartAction(sources: Sources): Sinks {
  const reducerState$ = sources.state.stream;
  const outputs = output(reducerState$);
  const qaSinks: Sinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    ...sources,
    goal: outputs.QuestionAnswerAction,
  }) as any;
  const input$ = input(
    sources.goal,
    reducerState$,
    sources.SpeechSynthesisAction,
  );
  const reducer$ = reducer(input$);

  return {
    state: xs.merge(
      reducer$,
      qaSinks.state,
    ),
    outputs: {
      ...qaSinks.outputs,
      SpeechSynthesisAction: xs.merge(
        qaSinks.outputs.SpeechSynthesisAction,
        outputs.SpeechSynthesisAction,
      ),
    },
  };
}

import xs from 'xstream';
import delay from 'xstream/extra/delay';
import dropRepeats from 'xstream/extra/dropRepeats';
import {Stream} from 'xstream';
import isolate from '@cycle/isolate';
import {StateSource, Reducer} from '@cycle/state';
import {
  GoalID, Status, initGoal, isEqualGoal, isEqualResult
} from '@cycle-robot-drivers/action';
import {
  QAWithScreenAction, FSMReducerState, selectActionResult
} from '@cycle-robot-drivers/actionbank';

enum S {
  PEND = 'PEND',
  QA = 'QA',
  SAY = 'SAY',
}

enum SIGType {
  GOAL = 'GOAL',
  CANCEL = 'CANCEL',
  QA_SUCCEEDED = 'QA_SUCCEEDED',
  QA_FAILED = 'QA_FAILED',
  SAY_DONE = 'SAY_DONE',
}

export type V = {
  goal_id: GoalID,
  flowchart: any,
  node: string,
  QuestionAnswerAction: any,
}

// export interface LAM {
//   result?: Result,
//   QuestionAnswerAction?: Stream<any>
// }

// Reducer types
export type State = FSMReducerState<S, V, any>;

// Component types
// export interface Sources extends Omit<QASources, 'state'> {
//   state: StateSource<State>,
// }

function input(
  goal$,
  questionAnswerResult$,
  monologueResult$,
) {
  return xs.merge(
    goal$.filter(g => typeof g !== 'undefined').map(g => (g === null)
      ? ({type: SIGType.CANCEL, value: null})
      : ({type: SIGType.GOAL, value: initGoal(g)})),
    questionAnswerResult$
      .filter(r => r.status.status === Status.SUCCEEDED)
      .map(r => ({type: SIGType.QA_SUCCEEDED, value: r.result})),
    questionAnswerResult$
      .filter(r => r.status.status !== Status.SUCCEEDED)
      .map(r => ({type: SIGType.QA_FAILED, value: r.result})),
    monologueResult$
      .filter(r => r.status.status === Status.SUCCEEDED)
      .mapTo({type: SIGType.SAY_DONE}),
  );
}

function reducer(input$) {
  const initReducer$: Stream<Reducer<State>> = xs.of(function(prev) {
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

  const transitionReducer$: Stream<Reducer<State>> = input$.map(input => function(prev) {
    console.debug('input', input, 'prev', prev);
    if (prev.state === S.PEND && input.type === SIGType.GOAL) {  // goal-received
      const node = input.value.goal.start;
      const next = input.value.goal.flowchart[node];
      if (typeof next === 'string' || !next) {  // do Monologue
        return {
          ...prev,
          state: S.SAY,
          variables: {
            flowchart: input.value.goal.flowchart,
            node: node,
            goal_id: input.value.goal_id,
          },
          outputs: {
            MonologueAction: {
              goal: initGoal(node),
            },
          },
        };
      } else {  // do QA
        return {
          ...prev,
          state: S.QA,
          variables: {
            flowchart: input.value.goal.flowchart,
            node: node,
            goal_id: input.value.goal_id,
          },
          outputs: {
            QAAction: {
              goal: initGoal({
                question: node,
                answers: Object.keys(next),
              }),
            },
          },
        };
      }
    } else if (prev.state === S.SAY && input.type === SIGType.SAY_DONE) {  // monologue-done
      const node = prev.variables.flowchart[prev.variables.node];
      const next = prev.variables.flowchart[node];
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
            }
          }
        };
      } else if (typeof next === 'string' || !next) {  // do Monologue
        return {
          ...prev,
          state: S.SAY,
          variables: {
            ...prev.variables,
            node: node,
          },
          outputs: {
            MonologueAction: {
              goal: initGoal(node),
            },
          },
        };
      } else {  // do QA
        return {
          ...prev,
          state: S.QA,
          variables: {
            ...prev.variables,
            node: node,
          },
          outputs: {
            QAAction: {
              goal: initGoal({
                question: node,
                answers: Object.keys(next),
              })
            },
          },
        };
      }
    }
  //   } else if (prev.state === S.QA && input.type === SIGType.QA_SUCCEEDED) {  // qa-done
  //     const node = prev.variables.flowchart[prev.variables.node][input.value];
  //     const next = prev.variables.flowchart[node];
  //     if (typeof next === 'string' || !next) {  // do Monologue
  //       return {
  //         ...prev,
  //         state: S.SAY,
  //         variables: {
  //           ...prev.variables,
  //           node: node
  //         },
  //         outputs: {
  //           SpeechSynthesisAction: {
  //             goal: initGoal(node)
  //           },
  //         },
  //       };
  //     } else {  // do QA
  //       return {
  //         ...prev,
  //         state: S.QA,
  //         variables: {
  //           ...prev.variables,
  //           node: node
  //         },
  //         outputs: {
  //           QuestionAnswerAction: {
  //             goal: initGoal({
  //               question: node,
  //               answers: Object.keys(next),
  //             })
  //           },
  //         },
  //       };
  //     }
  //   } else if (prev.state === S.QA && input.type === SIGType.QA_FAILED) {  // qa-failed
  //     return {
  //       state: S.PEND,
  //       variables: null,
  //       outputs: {
  //         result: {
  //           status: {
  //             goal_id: prev.variables.goal_id,
  //             status: Status.ABORTED,
  //           },
  //           result: prev.variables.node,
  //         }
  //       },
  //       QuestionAnswerAction: prev.QuestionAnswerAction,
  //     };
  //   }
    return prev;
  });

  return xs.merge(initReducer$, transitionReducer$);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(m => !!m.outputs)
    .map(m => m.outputs);
  return {
    result: outputs$
      .filter(o => !!o.result)
      .map(o => o.result),
    MonologueAction: outputs$
      .filter(o => !!o.MonologueAction)
      .map(o => o.MonologueAction.goal),
    // SpeechRecognitionAction: outputs$
    //   .filter(o => !!o.SpeechRecognitionAction)
    //   .map(o => o.SpeechRecognitionAction.goal),
    QAAction: outputs$
      .filter(o => !!o.QAAction)
      .map(o => o.QAAction.goal),
  };
}

export function FlowchartAction(sources) {
  sources.state.stream.addListener({next: v => console.log('state$', v)})

  const reducerState$ = sources.state.stream;
  const outputs = output(reducerState$);
  const qaSinks = isolate(QAWithScreenAction, 'QAAction')({
    ...sources,
    goal: outputs.QAAction.compose(dropRepeats(isEqualGoal)),
  });
  // const questionAnswerResult$ = reducerState$
  //   .compose(selectActionResult('QAAction'));
  // questionAnswerResult$.addListener({
  //   next: r => console.log('questionAnswerResult$', r),
  // });
  qaSinks.result.addListener({
    next: r => console.log('qaSinks.result', r),
  });
  const input$ = input(
    sources.goal,
    qaSinks.result,
    sources.SpeechSynthesisAction.result,
  );
  const parentReducer$ = reducer(input$);
  const reducer$ = xs.merge(parentReducer$, qaSinks.state);

  return {
    result: xs.never(),
    TwoSpeechbubblesAction: qaSinks.TwoSpeechbubblesAction.compose(dropRepeats(isEqualGoal)).debug(v => console.log('TwoSpeech', v)),
    SpeechSynthesisAction: xs.merge(
      qaSinks.SpeechSynthesisAction.debug(v => console.log('SpeechSynth', v)),
      outputs.MonologueAction.compose(dropRepeats(isEqualGoal)).debug(v => console.log('Monologue', v)),
      ),
    SpeechRecognitionAction: qaSinks.SpeechRecognitionAction,
    state: reducer$,
  };
}

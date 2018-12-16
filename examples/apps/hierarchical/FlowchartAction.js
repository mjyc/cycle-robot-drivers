import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import isolate from '@cycle/isolate';
import {Status, initGoal, isEqual} from '@cycle-robot-drivers/action';
import QuestionAnswerAction from './QuestionAnswerAction';

const State = {
  PEND: 'PEND',
  QA: 'QA',
};

const InputType = {
  GOAL: 'GOAL',
  QA_DONE: 'QA_DONE',
};

function input(goal$, state$) {
  return xs.merge(
    goal$.map(x => ({type: InputType.GOAL, value: initGoal(x)})),
    state$
      .filter(s => !!s.QuestionAnswerAction
        && !!s.QuestionAnswerAction.outputs
        && !!s.QuestionAnswerAction.outputs.result)
      .map(s => s.QuestionAnswerAction.outputs.result)
      .compose(
        dropRepeats((x, y) => isEqual(x.status.goal_id, y.status.goal_id)))
      .map(r => ({type: InputType.QA_DONE, value: r.result})),
  );
}

function reducer(input$) {
  const initReducer$ = xs.of(function(prev) {
    if (typeof prev === 'undefined') {
      return {
        state: State.PEND,
        outputs: null,
      };
    } else {
      return prev;
    }
  });

  const transitionReducer$ = input$.map(input => function(prev) {
    console.debug('input', input, 'prev', prev);
    if (prev.state === State.PEND && input.type === InputType.GOAL) {
      return {
        state: State.QA,
        variables: {
          flowchart: input.value.goal,
          goal_id: input.value.goal_id,
          cur: 'Is it important that you reach your full career potential?',
        },
        outputs: {
          QuestionAnswerAction: {
            goal: initGoal({
              question: 'Is it important that you reach your full career potential?',
              answers: ['yes', 'no'],
            }),
          },
        },
        QuestionAnswerAction: prev.QuestionAnswerAction,
      }
    } else if (prev.state === State.QA && input.type === InputType.QA_DONE) {
      return {
        state: State.QA,
        variables: {
          flowchart: prev.variables.flowchart,
          goal_id: prev.variables.goal_id,
          cur: prev.variables.flowchart[prev.variables.cur][input.value]
        },
        outputs: {
          QuestionAnswerAction: {
            goal: initGoal({
              question: prev.variables.flowchart[prev.variables.cur][input.value],
              answers: ['yes', 'no'],
            })
          },
        },
        QuestionAnswerAction: prev.QuestionAnswerAction,
      }
    };
    return prev;
  });

  return xs.merge(initReducer$, transitionReducer$);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(m => !!m.outputs)
    .map(m => m.outputs);
  return {
    QuestionAnswerAction: outputs$
      .filter(o => !!o.QuestionAnswerAction)
      .map(o => o.QuestionAnswerAction.goal)
      .compose(dropRepeats((g1, g2) => isEqual(g1.goal_id, g2.goal_id))),
  };
}

export default function FlowchartAction(sources) {
  const reducerState$ = sources.state.stream;
  const qaSinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    ...sources,
    goal: output(reducerState$).QuestionAnswerAction,
  });
  const input$ = input(sources.goal, reducerState$);
  const reducer$ = reducer(input$);

  return {
    state: xs.merge(
      reducer$,
      qaSinks.state,
    ),
    outputs: qaSinks.outputs,
  };
}

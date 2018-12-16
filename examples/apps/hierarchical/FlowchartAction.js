import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import isolate from '@cycle/isolate';
import {Status, initGoal, isEqual} from '@cycle-robot-drivers/action';
import QuestionAnswerAction from './QuestionAnswerAction';

const State = {
  PEND: 'PEND',
  QA: 'QA',
  TELL: 'TELL',
};

const InputType = {
  GOAL: 'GOAL',
  QA_DONE: 'QA_DONE',
  SAY_DONE: 'SAY_DONE',
};

function input(
  goal$,
  state$,
  speechSynthesisAction,
) {
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
    speechSynthesisAction.result
      .filter(result => result.status.status === 'SUCCEEDED')
      .mapTo({type: InputType.SAY_DONE}),
  );
}

function reducer(input$) {
  const initReducer$ = xs.of(function(prev) {
    if (typeof prev === 'undefined') {
      return {
        state: State.PEND,
        variables: null,
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
          // cur: 'Is it important that you reach your full career potential?',
          cur: 'Can you see yourself working online?',
        },
        outputs: {
          QuestionAnswerAction: {
            goal: initGoal({
              // question: 'Is it important that you reach your full career potential?',
              question: 'Can you see yourself working online?',
              answers: ['yes', 'no'],
            }),
          },
        },
        QuestionAnswerAction: prev.QuestionAnswerAction,
      }
    } else if (prev.state === State.QA && input.type === InputType.QA_DONE) {
      const node = prev.variables.flowchart[prev.variables.cur][input.value];
      if (Object.keys(prev.variables.flowchart).includes(node)) {
        return {
          state: State.QA,
          variables: {
            flowchart: prev.variables.flowchart,
            goal_id: prev.variables.goal_id,
            cur: node
          },
          outputs: {
            QuestionAnswerAction: {
              goal: initGoal({
                question: node,
                answers: ['yes', 'no'],
              })
            },
          },
          QuestionAnswerAction: prev.QuestionAnswerAction,
        };
      } else {
        return {
          state: State.TELL,
          variables: {
            flowchart: prev.variables.flowchart,
            goal_id: prev.variables.goal_id,
            cur: node
          },
          outputs: {
            SpeechSynthesisAction: {
              goal: initGoal(node),
            },
          },
          QuestionAnswerAction: prev.QuestionAnswerAction,
        };
      }
    } else if (prev.state === State.TELL && input.type === InputType.SAY_DONE) {
      return {
        state: State.PEND,
        variables: null,
        outputs: {
          result: {
            status: {
              goal_id: prev.variables.goal_id,
              status: Status.SUCCEEDED,
            },
            result: prev.variables.cur,
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
      .compose(dropRepeats((g1, g2) => isEqual(g1.goal_id, g2.goal_id))),
    QuestionAnswerAction: outputs$
      .filter(o => !!o.QuestionAnswerAction)
      .map(o => o.QuestionAnswerAction.goal)
      .compose(dropRepeats((g1, g2) => isEqual(g1.goal_id, g2.goal_id))),
  };
}

export default function FlowchartAction(sources) {
  const reducerState$ = sources.state.stream;
  const outputs = output(reducerState$);
  const qaSinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    ...sources,
    goal: outputs.QuestionAnswerAction,
  });
  const input$ = input(sources.goal, reducerState$, sources.SpeechSynthesisAction);
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

import xs from 'xstream';
import delay from 'xstream/extra/delay';
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

function input(goal$) {
  return goal$.map(x => ({type: InputType.GOAL, value: initGoal(x)}));
}

function machine(inputs) {
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

  const transitionReducer$ = inputs.map(input => function(prev) {
    if (prev.state === State.PEND && input.type === InputType.GOAL) {
      return {
        state: State.QA,
        outputs: input.value,
        QuestionAnswerAction: prev.QuestionAnswerAction,
      }
    } else {
      return {
        state: State.QA,
        outputs: null,
        QuestionAnswerAction: prev.QuestionAnswerAction,
      };
    }
  });

  return xs.merge(initReducer$, transitionReducer$);
}

export default function FlowchartAction(sources) {
  const qaSinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    ...sources,
    goal: sources.state.stream
      .filter(s => !!s.outputs)
      .map(s => s.outputs)
      .compose(dropRepeats(isEqual)),
  });

  const input$ = input(sources.goal);

  const reducer$ = machine(input$);

  return {
    state: xs.merge(
      reducer$,
      qaSinks.state,
    ),
    outputs: qaSinks.outputs,
  };
}

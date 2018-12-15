import xs from 'xstream';
import delay from 'xstream/extra/delay';
import isolate from '@cycle/isolate';
import {Status, initGoal} from '@cycle-robot-drivers/action';
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
    return {
      state: State.PEND,
      outputs: null,
      QuestionAnswerAction: prev.QuestionAnswerAction,
    };
  });

  const transitionReducer$ = inputs.map(input => function(prev) {
    if (prev.state === State.PEND && input.type === InputType.GOAL) {
      console.log(1);
      return {
        state: State.QA,
        outputs: {question: 'How are you?', answers: ['yes', 'no']},
        QuestionAnswerAction: prev.QuestionAnswerAction,
      }
    } else {
      console.log(2);
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
    // goal: xs.of({question: 'How are you?', answers: ['yes', 'no']}).compose(delay(2000)),
    goal: sources.state.stream.filter(s => !!s.outputs).map(s => s.outputs),
    // goal: xs.never(),
  });

  sources.state.stream.addListener({next: x => console.log('FlowchartAction', x)});

  const input$ = input(sources.goal);

  const reducer$ = machine(input$);

  return {
    state: xs.merge(
      qaSinks.state,
      reducer$,
    ),
    outputs: qaSinks.outputs,
  };
}

import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import isolate from '@cycle/isolate';
import {Status, initGoal, isEqualGoal} from '@cycle-robot-drivers/action';
import QuestionAnswerAction from './QuestionAnswerAction';

const State = {
  PEND: 'PEND',
  QA: 'QA',
}

const InputType = {
  GOAL: 'GOAL',
  QA_SUCCEEDED: 'QA_SUCCEEDED',
  QA_FAILED: 'QA_FAILED',
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
  const initReducer$ = xs.of(function (prev) {
    if (typeof prev === 'undefined') {
      return {
        state: State.PEND,
        variable: null,
        outputs: null,
      };
    } else {
      return prev;
    }
  });

  const Sentence = {
    CAREER: 'Is it important that you reach your full career potential?',
    ONLINE: 'Can you see yourself working online?',
    FAMILY: 'Do you have to be near my family/friends/pets?',
    TRIPS: 'Do you think short trips are awesome?',
    HOME: 'Do you want to have a home and nice things?',
    ROUTINE: 'Do you think a routine gives your life structure?',
    JOB: 'Do you need a secure job and a stable income?',
    VACATIONER: 'You are a vacationer!',
    EXPAT: 'You are an expat!',
    NOMAD: 'You are a nomad!',
  };
  const Response = {
    YES: 'yes',
    NO: 'no',
  }
  const flowchart = {
    [Sentence.CAREER]: {
      [Response.YES]: Sentence.ONLINE,
      [Response.NO]: Sentence.FAMILY,
    },
    [Sentence.ONLINE]: {
      [Response.YES]: Sentence.NOMAD,
      [Response.NO]: Sentence.VACATIONER,
    },
    [Sentence.FAMILY]: {
      [Response.YES]: Sentence.VACATIONER,
      [Response.NO]: Sentence.TRIPS,
    },
    [Sentence.TRIPS]: {
      [Response.YES]: Sentence.VACATIONER,
      [Response.NO]: Sentence.HOME,
    },
    [Sentence.HOME]: {
      [Response.YES]: Sentence.EXPAT,
      [Response.NO]: Sentence.ROUTINE,
    },
    [Sentence.ROUTINE]: {
      [Response.YES]: Sentence.EXPAT,
      [Response.NO]: Sentence.JOB,
    },
    [Sentence.JOB]: {
      [Response.YES]: Sentence.ONLINE,
      [Response.NO]: Sentence.NOMAD,
    },
  };

  const transitionReducer$ = input$.map(input => function (prev) {
    console.debug('input', input, 'prev', prev);
    if (prev.state === State.PEND) {
      if (input.type === InputType.GOAL) {
        const node = Sentence.CAREER;
        return {
          state: State.QA,
          variable: {
            goal_id: input.value.goal_id,
            node,
          },
          outputs: {
            QuestionAnswerAction: {
              goal: {
                question: node,
                answers: Object.keys(flowchart[node]),
              },
            },
          },
        };
      }
    } else if (prev.state === State.QA) {
      if (prev.state === State.QA_SUCCEEDED) {
        const node = flowchart[prev.variable][input.value];
        return {
          ...prev,
          variable: {
            ...prev.variable,
            node
          },
          outputs: {
            QuestionAnswerAction: {
              goal: {
                question: node,
                answers: Object.keys(flowchart[node]),
              },
            },
          },
        };
      } else if (prev.state === State.QA_FAILED) {
        return {
          state: State.PEND,
          variable: null,
          outputs: {
            result: {
              status: {
                goal_id: prev.variable.goal_id,
                status: State.ABORTED,
              },
              result: prev.variable.node,
            },
          },
        };
      }
    }
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

export default function FlowchartAction(sources) {
  const state$ = sources.state.stream;
  const outputs = output(reducerState$);
  const qaSinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    state: sources.state,
    goal: outputs.QuestionAnswerAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
    SpeechRecognitionAction: sources.SpeechRecognitionAction,
  });
  const input$ = input(
    sources.goal,
    state$,
    sources.SpeechSynthesisAction,
  );
  const reducer$ = xs.merge(reducer(input$), qaSinks.state);

  return {
    outputs: {
      ...qaSinks.outputs,
      SpeechSynthesisAction: xs.merge(
        qaSinks.outputs.SpeechSynthesisAction,
        outputs.SpeechSynthesisAction,
      ),
    },
    state: reducer$,
  }
}

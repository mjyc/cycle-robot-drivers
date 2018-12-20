import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import isolate from '@cycle/isolate';
import {
  Status, initGoal, isEqualGoal, isEqualResult
} from '@cycle-robot-drivers/action';
import QuestionAnswerAction from './QuestionAnswerAction';

const State = {
  PEND: 'PEND',
  QA: 'QA',
  SAY: 'SAY',
}

const InputType = {
  GOAL: 'GOAL',
  QA_SUCCEEDED: 'QA_SUCCEEDED',
  QA_FAILED: 'QA_FAILED',
  SAY_DONE: 'SAY_DONE',
}

function input(
  goal$,
  reducerState$,
  speechSynthesisAction,
) {
  const qaResult$ = reducerState$
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
      .filter(r => r.status.status === Status.SUCCEEDED)
      .mapTo({type: InputType.SAY_DONE}),
  );
}

function reducer(input$) {
  const initReducer$ = xs.of(function (prev) {
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
          ...prev,
          state: State.QA,
          variables: {
            goal_id: input.value.goal_id,
            node,
          },
          outputs: {
            QuestionAnswerAction: {
              goal: initGoal({
                question: node,
                answers: Object.keys(flowchart[node]),
              }),
            },
          },
        };
      }
    } else if (prev.state === State.QA) {
      if (input.type === InputType.QA_SUCCEEDED) {
        const node = flowchart[prev.variables.node][input.value];
        if (!flowchart[node]) {
          return {
            ...prev,
            state: State.SAY,
            variables: {
              ...prev.variables,
              node,
            },
            outputs: {
              SpeechSynthesisAction: {
                goal: initGoal(node),
              },
            },
          };
        } else {
          return {
            ...prev,
            variables: {
              ...prev.variables,
              node,
            },
            outputs: {
              QuestionAnswerAction: {
                goal: initGoal({
                  question: node,
                  answers: Object.keys(flowchart[node]),
                }),
              },
            },
          };
        }
      } else if (input.type === InputType.QA_FAILED) {
        return {
          ...prev,
          state: State.PEND,
          variables: null,
          outputs: {
            result: {
              status: {
                goal_id: prev.variables.goal_id,
                status: State.ABORTED,
              },
              result: prev.variables.node,
            },
          },
        };
      }
    } else if (prev.state === State.SAY) {
      if (input.type === InputType.SAY_DONE) {
        return {
          ...prev,
          state: State.PEND,
          variables: null,
          outputs: {
            result: {
              status: {
                goal_id: prev.variables.goal_id,
                status: State.SUCCEEDED,
              },
              result: prev.variables.node,
            },
          },
        };
      }
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

export default function FlowchartAction(sources) {
  const reducerState$ = sources.state.stream;
  const outputs = output(reducerState$);
  const qaSinks = isolate(QuestionAnswerAction, 'QuestionAnswerAction')({
    state: sources.state,
    goal: outputs.QuestionAnswerAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
    SpeechRecognitionAction: sources.SpeechRecognitionAction,
  });
  const input$ = input(
    sources.goal,
    reducerState$,
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

import xs from 'xstream';
import isolate from '@cycle/isolate';
import {withState} from '@cycle/state'
import {Reducer} from '@cycle/state';
import QuestionAnswerAction from './QuestionAnswerAction';
import {Sinks} from './QuestionAnswerAction';
import {initGoal} from '@cycle-robot-drivers/action';
import {Status} from '@cycle-robot-drivers/action';


// TODO: remove when done
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
};

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



enum FSMState {
  PEND = 'PEND',
  QA = 'QA',  // ask a question and listen for human response
  END = 'END',  // deadend; say the last sentence and finish
}

enum InputType {
  GOAL = 'GOAL',
  QA_DONE = 'QA_DONE',
}

function input(goal$, state$) {
  return xs.merge(
    goal$.map(g => initGoal(g)),
    state$
      .map(s => !!s && !!s.outputs && s.outputs.result)
      .filter(r => (!!r && r.status.status === 'SUCCEEDED'))
      .map(r => ({type: InputType.QA_DONE, value: r.result})),
  );
}

function transition(prevState, prevVariables, input) {
  if (prevState === FSMState.PEND && input.type === InputType.GOAL) {
    return {
      state: FSMState.QA,
      variables: {goal_id: input.goal_id, flowchart: input.value.goal},
      outputs: null,
    };
  } else if (prevState === FSMState.PEND && input.type === InputType.GOAL) {
    return {
      state: FSMState.PEND,
      variables: null,
      outputs: {
        result: {
          status: {
            goal_id: prevVariables.goal.goal_id,
            status: Status.SUCCEEDED
          },
          result: true,
        }
      }
    }
  }

  return {
    state: prevState,
    variables: prevVariables,
    outputs: null,
  };
}

export default function FlowchartAction(sources) {

  // const input$ = input(
  //   sources.TabletFace.load.mapTo({
  //     question: 'How are you?',
  //     answers: ['Good', 'Bad'],
  //   }),
  //   sources.state.stream,
  // );

  sources.state.stream.addListener({next: v => console.log('====state',v)})

  // const qaSinks = isolate(QuestionAnswerAction)({
  //   goal: sources.TabletFace.load.mapTo({
  //     question: 'How are you?',
  //     answers: ['Good', 'Bad'],
  //   }),
  //   SpeechRecognitionAction: sources.SpeechRecognitionAction,
  //   SpeechSynthesisAction: sources.SpeechSynthesisAction,
  // });
  const qaSinks = QuestionAnswerAction({
    goal: sources.TabletFace.load.mapTo({
      question: 'How are you?',
      answers: ['Good', 'Bad'],
    }),
    SpeechRecognitionAction: sources.SpeechRecognitionAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
  });

  const initReducer$ = xs.of(function() {
    return {
      state: FSMState.PEND,
      variables: {
        goal_id: null,
        flowchart: null,
      },
      outputs: {
        result: null
      },
    }
  });

  // const transitionReducer$ = input$.map(input => function(prev) {
  //   return transition(prev.state, prev.variables, input);
  // });

  console.log('qaSinks', qaSinks);
  return {
    // state: xs.merge(
    //   qaSinks.state,
    //   // initReducer$,
    //   // transitionReducer$,
    // ),
    state: qaSinks.state,
    // state: initReducer$,
  };
}

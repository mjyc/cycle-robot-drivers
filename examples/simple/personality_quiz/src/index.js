import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import {runTabletFaceRobotApp} from '@cycle-robot-drivers/run';

const Question = {
  CAREER: 'Is it important that you reach your full career potential?',
  ONLINE: 'Can you see yourself working online?',
  FAMILY: 'Do you have to be near my family/friends/pets?',
  TRIPS: 'Do you think short trips are awesome?',
  HOME: 'Do you want to have a home and nice things?',
  ROUTINE: 'Do you think a routine gives your life structure?',
  JOB: 'Do you need a secure job and a stable income?',
  VACATIONER: 'You are a vacationer!',
  EXPAT: 'You are an expat!',
  NOMAD: 'You are a nomad!'
};

const Response = {
  YES: 'yes',
  NO: 'no'
};

const transitionTable = {
  [Question.CAREER]: {
    [Response.YES]: Question.ONLINE,
    [Response.NO]: Question.FAMILY,
  },
  [Question.ONLINE]: {
    [Response.YES]: Question.NOMAD,
    [Response.NO]: Question.VACATIONER,
  },
  [Question.FAMILY]: {
    [Response.YES]: Question.VACATIONER,
    [Response.NO]: Question.TRIPS,
  },
  [Question.TRIPS]: {
    [Response.YES]: Question.VACATIONER,
    [Response.NO]: Question.HOME,
  },
  [Question.HOME]: {
    [Response.YES]: Question.EXPAT,
    [Response.NO]: Question.ROUTINE,
  },
  [Question.ROUTINE]: {
    [Response.YES]: Question.EXPAT,
    [Response.NO]: Question.JOB,
  },
  [Question.JOB]: {
    [Response.YES]: Question.ONLINE,
    [Response.NO]: Question.NOMAD,
  }
};

function main(sources) {
  sources.SpeechRecognitionAction.result.addListener({
    next: (result) => console.log('result', result)
  });
  const lastQuestion$ = xs.create();
  const question$ = xs.merge(
    sources.TabletFace.events('load').mapTo(Question.CAREER),
    sources.SpeechRecognitionAction.result.filter(result =>
      result.status.status === 'SUCCEEDED'  // must succeed
      && (result.result === 'yes' || result.result === 'no') // only yes or no
    ).map(result => result.result)
    .startWith('')
    .compose(sampleCombine(
      lastQuestion$
    )).map(([response, question]) => {
      return transitionTable[question][response];
    })
  );
  lastQuestion$.imitate(question$);

  const sinks = {
    SpeechSynthesisAction: {goal: question$},
    SpeechRecognitionAction: {
      goal: xs.merge(
        sources.SpeechSynthesisAction.result,
        sources.SpeechRecognitionAction.result.filter(result =>
          result.status.status !== 'SUCCEEDED'
          || (result.result !== 'yes' && result.result !== 'no')
        )
      ).mapTo({}),
    }
  };
  return sinks;
}

runTabletFaceRobotApp(main);

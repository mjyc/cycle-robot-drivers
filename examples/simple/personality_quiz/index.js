import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import {runRobotProgram} from '@cycle-robot-drivers/run';
import { reduceEachLeadingCommentRange, isNonNullExpression } from 'typescript';

const Question = {
  CAREER: 'Is it important that you reach your full career potential?',
  ONLINE: 'Can you see yourself working online.',
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

const InputType = {
  LOADED: 'LOADED',
  RECEIVED_RESPONSE: 'RECEIVED_RESPONSE',
};

function input(
  load$,
  speechRecognitionActionResult$,
) {
  return xs.merge(
    load.mapTo({type: InputType.LOADED, value: null}),
    speechRecognitionActionResult$.filter(result =>
      result.status.status === 'SUCCEEDED'
      && (result.result === 'yes' || result.result === 'no')
    ).map(result => ({
      type: InputType.RECEIVED_RESPONSE,
      value: result.result
    })),
    // SpeechRecognitionAction: xs.merge(
    //   sources.SpeechSynthesisAction.result,
    //   sources.SpeechRecognitionAction.result.filter(result =>
    //     result.status.status !== 'SUCCEEDED'  // must succeed
    //     || (result.result !== 'yes' && result.result !== 'no') // only yes or no
    //   )
    // ).mapTo({})
  );
}

function main(sources) {
  console.log('Hello world!');

  const input$ = input(sources);

  // sources.SpeechRecognitionAction.result.addListener({
  //   next: (result) => console.log('result', result)
  // });
  // const lastQuestion$ = xs.create();
  // const question$ = xs.merge(
  //   sources.TabletFace.load.mapTo(Question.CAREER),
  //   sources.SpeechRecognitionAction.result.filter(result =>
  //     result.status.status === 'SUCCEEDED'  // must succeed
  //     && (result.result === 'yes' || result.result === 'no') // only yes or no
  //   ).map(result => result.result)
  //   .startWith('')
  //   .compose(sampleCombine(
  //     lastQuestion$
  //   )).map(([response, question]) => {
  //     return transitionTable[question][response];
  //   })
  // );
  // lastQuestion$.imitate(question$);

  // const sinks = {
  //   TabletFace: sources.PoseDetection.poses
  //     .filter(poses =>
  //       // must see one person
  //       poses.length === 1
  //       // must see the nose
  //       && poses[0].keypoints.filter(kpt => kpt.part === 'nose').length === 1
  //     ).map(poses => {
  //       const nose = poses[0].keypoints.filter(kpt => kpt.part === 'nose')[0];
  //       return {
  //         x: nose.position.x / 640,  // max value of position.x is 640
  //         y: nose.position.y / 480  // max value of position.y is 480
  //       };
  //     }).map(position => ({
  //       type: 'SET_STATE',
  //       value: {
  //         leftEye: position,
  //         rightEye: position
  //       }
  //     })),
  //   SpeechSynthesisAction: question$,
  //   SpeechRecognitionAction: xs.merge(
  //     sources.SpeechSynthesisAction.result,
  //     sources.SpeechRecognitionAction.result.filter(result =>
  //       result.status.status !== 'SUCCEEDED'  // must succeed
  //       || (result.result !== 'yes' && result.result !== 'no') // only yes or no
  //     )
  //   ).mapTo({})
  // };
  // return sinks;
}

runRobotProgram(main);

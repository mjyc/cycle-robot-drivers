import xs from 'xstream';
import delay from 'xstream/extra/delay';
import isolate from '@cycle/isolate';
import {withState} from '@cycle/state'
import {runRobotProgram} from '@cycle-robot-drivers/run';
import FlowchartAction from './FlowchartAction';
import {Sinks as FcSinks} from './FlowchartAction';

import story1 from './data/Set 4 - Dogs!.json';
// import story1 from './Dogs!.json';
console.log(story1, Array.isArray(story1));

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

function main(sources) {
  const fcSinks: FcSinks = isolate(FlowchartAction, 'FlowchartAction')({
    ...sources,
    goal: xs.of({
      flowchart,
      start: Sentence.CAREER
    }).compose(delay(1000)),
  });

  return {
    state: fcSinks.state,
    SpeechSynthesisAction: fcSinks.outputs.SpeechSynthesisAction,
    SpeechRecognitionAction: fcSinks.outputs.SpeechRecognitionAction,
  };
}

runRobotProgram(withState(main));

import xs from 'xstream';
import isolate from '@cycle/isolate';
import {withState} from '@cycle/state'
import {runRobotProgram} from '@cycle-robot-drivers/run';
import FlowchartAction from './FlowchartAction';
import {Sinks as FcSinks} from './FlowchartAction';

// import contents
import story1 from './data/Set 4 - Insects!.json';
import story2 from './data/Set 5 - Caterpillars!.json';
import quiz1 from './data/how_do_you_know_if_god_exists.json';
import quiz2 from './data/is_it_time_to_make_changes_in_your_life.json';

// or create contents
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

// process contents
function story2flowchart(story) {
  return story.reduce((acc, x, i, arr) => {
    if (i === 0) {
      return {};
    } else {
      acc[arr[i-1]] = x;
      return acc;
    }
  }, {});
};

const activities = {
  'Insects!': {flowchart:story2flowchart(story1), start: story1[0]},
  'Caterpillars!': {flowchart:story2flowchart(story2), start: story2[0]},
  'Travel personality quiz': {flowchart, start: Sentence.CAREER},
  'How do you know if god exists?': {flowchart: quiz1, start: "PRAY"},
  'Is it time to make changes in your life?': {flowchart: quiz2, start: "ARE YOU HAPPY?"},
}

function main(sources) {
  const choices$ = xs.merge(
    xs.of(null),
    sources.state.stream.filter(
      s => !!s.FlowchartAction.outputs && !!s.FlowchartAction.outputs.result)
  ).mapTo({
    message: 'Pick one!',
    choices: Object.keys(activities),
  });

  const goals$ = sources.TwoSpeechbubblesAction.result
    .map(r => activities[r.result]);
  const fcSinks: FcSinks = isolate(FlowchartAction, 'FlowchartAction')({
    ...sources,
    goal: goals$,
  });

  return {
    state: fcSinks.state,
    SpeechSynthesisAction: fcSinks.outputs.SpeechSynthesisAction,
    SpeechRecognitionAction: fcSinks.outputs.SpeechRecognitionAction,
    TwoSpeechbubblesAction: choices$,
  };
}

runRobotProgram(withState(main));

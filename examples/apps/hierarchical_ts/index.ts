import xs from 'xstream';
import isolate from '@cycle/isolate';
import {withState} from '@cycle/state'
import {runRobotProgram} from '@cycle-robot-drivers/run';
import FlowchartAction from './FlowchartAction';


// const Sentence = {
//   CAREER: 'Is it important that you reach your full career potential?',
//   ONLINE: 'Can you see yourself working online?',
//   FAMILY: 'Do you have to be near my family/friends/pets?',
//   TRIPS: 'Do you think short trips are awesome?',
//   HOME: 'Do you want to have a home and nice things?',
//   ROUTINE: 'Do you think a routine gives your life structure?',
//   JOB: 'Do you need a secure job and a stable income?',
//   VACATIONER: 'You are a vacationer!',
//   EXPAT: 'You are an expat!',
//   NOMAD: 'You are a nomad!',
// };

// const flowchart = {
//   [Sentence.CAREER]: {
//     [Response.YES]: Sentence.ONLINE,
//     [Response.NO]: Sentence.FAMILY,
//   },
//   [Sentence.ONLINE]: {
//     [Response.YES]: Sentence.NOMAD,
//     [Response.NO]: Sentence.VACATIONER,
//   },
//   [Sentence.FAMILY]: {
//     [Response.YES]: Sentence.VACATIONER,
//     [Response.NO]: Sentence.TRIPS,
//   },
//   [Sentence.TRIPS]: {
//     [Response.YES]: Sentence.VACATIONER,
//     [Response.NO]: Sentence.HOME,
//   },
//   [Sentence.HOME]: {
//     [Response.YES]: Sentence.EXPAT,
//     [Response.NO]: Sentence.ROUTINE,
//   },
//   [Sentence.ROUTINE]: {
//     [Response.YES]: Sentence.EXPAT,
//     [Response.NO]: Sentence.JOB,
//   },
//   [Sentence.JOB]: {
//     [Response.YES]: Sentence.ONLINE,
//     [Response.NO]: Sentence.NOMAD,
//   },
// };


function output(machine$) {
  const outputs$ = machine$
    .filter(machine => !!machine.outputs)
    .map(machine => machine.outputs);

  return {
    SpeechSynthesisAction: outputs$
      .filter(outputs => !!outputs.SpeechSynthesisAction)
      .map(output => output.SpeechSynthesisAction.goal),
    SpeechRecognitionAction: outputs$
      .filter(outputs => !!outputs.SpeechRecognitionAction)
      .map(output => output.SpeechRecognitionAction.goal),
    TabletFace: outputs$
      .filter(outputs => !!outputs.TabletFace)
      .map(output => output.TabletFace.goal),
  };
}

function main(sources) {
  const sinks = isolate(FlowchartAction)(sources);

  const state$ = sources.state.stream;

  const outputs = output(state$);
  return {
    state: sinks.state,
    SpeechSynthesisAction: outputs.SpeechSynthesisAction,
    SpeechRecognitionAction: outputs.SpeechRecognitionAction,
  };
}

runRobotProgram(withState(main));
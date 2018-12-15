import xs from 'xstream';
import {withState} from '@cycle/state'
import {runRobotProgram} from '@cycle-robot-drivers/run';
import FlowchartAction from './FlowchartAction';

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
  const sinks = FlowchartAction(sources);

  const state$ = sources.state.stream;

  const outputs = output(state$);
  return {
    state: sinks.state,
    SpeechSynthesisAction: outputs.SpeechSynthesisAction,
    SpeechRecognitionAction: outputs.SpeechRecognitionAction,
  };
}

runRobotProgram(withState(main));
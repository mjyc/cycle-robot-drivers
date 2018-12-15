import xs from 'xstream';
import delay from 'xstream/extra/delay';
import isolate from '@cycle/isolate';
import {withState} from '@cycle/state'
import {runRobotProgram} from '@cycle-robot-drivers/run';
import {output} from './utils';
import FlowchartAction from './FlowchartAction';

function main(sources) {
  const sinks = isolate(FlowchartAction, 'FlowchartAction')({
    ...sources,
    goal: xs.of({}).compose(delay(2000)),
  });

  const state$ = sources.state.stream;
  state$.addListener({next: s => console.log('state$', s)});

  return {
    state: sinks.state,
    SpeechSynthesisAction: sinks.outputs.SpeechSynthesisAction.debug(),
    SpeechRecognitionAction: sinks.outputs.SpeechRecognitionAction.debug(),
  };
}

runRobotProgram(withState(main));

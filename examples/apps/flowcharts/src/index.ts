import xs from 'xstream';
import isolate from '@cycle/isolate';
import {withState} from '@cycle/state'
import {runRobotProgram} from '@cycle-robot-drivers/run';
import FlowchartAction from './FlowchartAction';
import {Sinks as FcSinks} from './FlowchartAction';

function main(sources) {
  const flowchartMetadata = [
    {
      name: 'How do you know if god exists?',
      path: '/src/data/how_do_you_know_if_god_exists.json',
      start: 'PRAY',
    },
    {
      name: 'Is it time to make changes in your life?',
      path: '/src/data/is_it_time_to_make_changes_in_your_life.json',
      start: 'ARE YOU HAPPY?'
    },
  ];
  const data$ = xs.combine.apply(
    null,
    flowchartMetadata.map(d => xs.fromPromise(fetch(d.path, {
      headers: {
        "content-type": "application/json"
      }
    })).map(v => xs.fromPromise(v.json()).map(j => ({
      ...d,
      flowchart: j,
    }))).flatten()),
  );

  const mainScreen$ = data$.map(data => ({
    message: 'I can help you answer some questions',
    choices: data.map(d => d.name),
  }));

  const fcSinks: FcSinks = isolate(FlowchartAction, 'FlowchartAction')({
    ...sources,
    goal: xs.combine(data$, sources.TwoSpeechbubblesAction.result)
      .map(([data, r]: [any, any]) => ({
        flowchart: data.filter(d => d.name === r.result)[0].flowchart,
        start: data.filter(d => d.name === r.result)[0].start,
      })),
  });
  const result$ = sources.state.stream
    .filter(s => !!s.FlowchartAction && !!s.FlowchartAction.outputs && !!s.FlowchartAction.outputs.result)
    .startWith(null);

  return {
    state: fcSinks.state,
    SpeechSynthesisAction: fcSinks.outputs.SpeechSynthesisAction,
    SpeechRecognitionAction: fcSinks.outputs.SpeechRecognitionAction,
    TwoSpeechbubblesAction: xs.combine(mainScreen$, result$).map(x => x[0]),
  };
}

runRobotProgram(withState(main));

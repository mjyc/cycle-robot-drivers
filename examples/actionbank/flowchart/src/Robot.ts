import xs from 'xstream';
import isolate from '@cycle/isolate';
import {Result, isEqual, Status} from '@cycle-robot-drivers/action';
import {FlowchartAction} from '@cycle-robot-drivers/actionbank';

export default function Robot(sources) {
  // sources.state.stream.addListener({next: s => console.log(s)})

  // fetch flowchart data
  const flowchartMetadata = [
    {
      name: 'Cook "Broccoli cheese soup"',
      path: '/flowcharts/crockpot-buffalo-chicken.json',
    },
    {
      name: 'Read "Dogs!"',
      path: '/flowcharts/Set 4 - Dogs!.json',
    },
    {
      name: 'Answer "How do you know god exists?"',
      path: '/flowcharts/how_do_you_know_if_god_exists.json',
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
      ...j,
    }))).flatten()),
  );

  // setup the flowchart action
  const goalId = {stamp: new Date(), id: '#main-screen'};
  const goal$ = xs.combine(data$, sources.TwoSpeechbubblesAction.result)
    .filter(([data, r]: [any[], Result]) =>  // filter not #main-screen results
      isEqual(r.status.goal_id, goalId)
      && r.status.status !== Status.PREEMPTED
      && data.filter(d => d.name === r.result).length > 0)
    .map(([data, r]: [any[], Result]) => ({  // convert data to a goal
      flowchart: data.filter(d => d.name === r.result)[0].flowchart,
      start_id: data.filter(d => d.name === r.result)[0].start_id,
    }));
  const fcSinks: any = isolate(FlowchartAction, 'FlowchartAction')({
    goal: goal$,
    TwoSpeechbubblesAction: {result: sources.TwoSpeechbubblesAction.result},
    SpeechSynthesisAction: {result: sources.SpeechSynthesisAction.result},
    SpeechRecognitionAction: {result: sources.SpeechRecognitionAction.result},
    state: sources.state,
  });

  // create the main menu screen
  const mainScreen$ = data$.map(data => ({
    goal_id: goalId,
    goal: {
      message: 'I can help you',
      choices: data.map(d => d.name),
    }
  }));

  // define sinks
  const twoSpeechbubblesGoal$ = xs.merge(
    xs.combine(mainScreen$, fcSinks.result.startWith(null)).map(x => x[0]),
    fcSinks.TwoSpeechbubblesAction,
  );
  const reducer$: any = fcSinks.state;
  const sinks = {
    TwoSpeechbubblesAction: twoSpeechbubblesGoal$,
    SpeechSynthesisAction: fcSinks.SpeechSynthesisAction,
    SpeechRecognitionAction: fcSinks.SpeechRecognitionAction,
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
    state: reducer$,
  };

  return sinks;
}

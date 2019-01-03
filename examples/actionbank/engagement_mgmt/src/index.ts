import xs from 'xstream';
import isolate from '@cycle/isolate';
import {Result, isEqual, Status} from '@cycle-robot-drivers/action';
import {runRobotProgram} from '@cycle-robot-drivers/run';
import {FlowchartAction} from './FlowchartAction';

document.body.style.backgroundColor = "white";
document.body.style.margin = "0px";

function main(sources) {
  // sources.PoseDetection.poses
  //   .addListener({next: () => {}});  // see outputs on the browser


  // sources.state.stream.addListener({next: s => console.log(s)})

  const flowchartMetadata = [
    {
      name: 'Broccoli cheese soup',
      path: '/flowcharts/crockpot-buffalo-chicken.json',
    },
  ];

  // fetch flowchart data
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
  const childSinks: any = isolate(FlowchartAction, 'FlowchartAction')({
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
      message: 'I can help you cook',
      choices: data.map(d => d.name),
    }
  }));

  const twoSpeechbubblesGoal$ = xs.merge(
    xs.combine(mainScreen$, childSinks.result.startWith(null)).map(x => x[0]),
    childSinks.TwoSpeechbubblesAction,
  );

  const reducer$: any = childSinks.state;



  return {
    TwoSpeechbubblesAction: twoSpeechbubblesGoal$,
    SpeechSynthesisAction: childSinks.SpeechSynthesisAction,
    SpeechRecognitionAction: childSinks.SpeechRecognitionAction,
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
    state: reducer$,
  }
}

runRobotProgram(main);
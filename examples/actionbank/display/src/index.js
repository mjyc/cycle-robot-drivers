import xs from "xstream";
import delay from "xstream/extra/delay";
import isolate from "@cycle/isolate";
import { withState } from "@cycle/state";
import { run } from "@cycle/run";
import { timeDriver } from "@cycle/time";
import {
  initializeTabletFaceRobotDrivers,
  withTabletFaceRobotActions
} from "@cycle-robot-drivers/run";
import {
  initGoal,
  createConcurrentAction,
  selectActionResult
} from "@cycle-robot-drivers/action";
import {
  SleepAction,
  DisplayTextAction
} from "@cycle-robot-drivers/actionbank";

function main(sources) {
  const state$ = sources.state.stream;
  state$.addListener({
    next: s => console.debug("reducer state", s)
  });
  const result$ = state$.compose(selectActionResult("SleepAction"));
  result$.addListener({
    next: s => console.debug("result", s)
  });

  const sleepGoalProxy$ = xs.create();
  const sleepCancelProxy$ = xs.create();
  const sleepAction = isolate(SleepAction, "SleepAction")({
    state: sources.state,
    goal: sleepGoalProxy$,
    cancel: sleepCancelProxy$,
    Time: sources.Time
  });

  const displayText = DisplayTextAction({
    state: sources.state,
    DisplayTextAction: {
      goal: xs
        .of({
          RobotSpeechbubbleAction: "Hello!",
          SleepAction: 1000
        })
        .compose(delay(1000)),
      cancel: xs.never()
    }
  });

  sleepGoalProxy$.imitate(displayText.SleepAction.goal);
  sleepCancelProxy$.imitate(displayText.SleepAction.cancel);

  sources.state.stream
    .compose(selectActionResult("DisplayTextAction"))
    .addListener({ next: x => console.debug("DisplayTextAction result", x) });

  return {
    state: xs.merge(sleepAction.state, displayText.state),
    RobotSpeechbubbleAction: displayText.RobotSpeechbubbleAction
  };
}

run(
  withState(withTabletFaceRobotActions(main)),
  Object.assign({}, initializeTabletFaceRobotDrivers(), { Time: timeDriver })
);

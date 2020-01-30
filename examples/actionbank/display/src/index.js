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
  selectSleepActionStatus,
  SleepAction,
  selectDisplayButtonActionStatus,
  DisplayButtonAction
} from "@cycle-robot-drivers/actionbank";

function selectAction(actionName) {
  return in$ => in$.filter(s => !!s && !!s[actionName]).map(s => s[actionName]);
}

function main(sources) {
  const state$ = sources.state.stream;
  state$.addListener({
    next: s => console.debug("reducer state", s)
  });
  const status$ = state$
    .compose(selectAction("DisplayButtonAction"))
    .compose(selectDisplayButtonActionStatus);
  status$.addListener({
    next: s => console.warn("status", s)
  });
  const result$ = state$.compose(selectActionResult("DisplayButtonAction"));
  result$.addListener({
    next: s => console.warn("result", s)
  });

  const sleepGoalProxy$ = xs.create();
  const sleepCancelProxy$ = xs.create();
  const sleepAction = isolate(SleepAction, "DisplayButtonSleepAction")({
    state: sources.state,
    goal: sleepGoalProxy$,
    cancel: sleepCancelProxy$,
    Time: sources.Time
  });

  const displayAction = DisplayButtonAction({
    state: sources.state,
    DisplayButtonAction: {
      goal: xs
        .of({
          HumanSpeechbubbleAction: ["Hi", "Bye"],
          DisplayButtonSleepAction: 3000
        })
        .compose(delay(1000)),
      cancel: xs.never()
    }
  });

  sleepGoalProxy$.imitate(displayAction.DisplayButtonSleepAction.goal);
  sleepCancelProxy$.imitate(displayAction.DisplayButtonSleepAction.cancel);

  sources.state.stream
    .compose(selectActionResult("DisplayButtonAction"))
    .addListener({ next: x => console.debug("DisplayButtonAction result", x) });

  return {
    state: xs.merge(sleepAction.state, displayAction.state),
    HumanSpeechbubbleAction: displayAction.HumanSpeechbubbleAction
  };
}

run(
  withState(withTabletFaceRobotActions(main)),
  Object.assign({}, initializeTabletFaceRobotDrivers(), { Time: timeDriver })
);

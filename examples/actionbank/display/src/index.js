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
  DisplayButtonAction
} from "@cycle-robot-drivers/actionbank";

function DisplayTextAction(sources) {
  const RaceAction = createConcurrentAction(
    ["SleepAction", "HumanSpeechbubbleAction"],
    true
  );
  const raceSinks = isolate(RaceAction, "DisplayButtonAction")({
    state: sources.state,
    goal: sources.DisplayTextAction.goal,
    cancel: sources.DisplayTextAction.cancel,
    SleepAction: {
      result: sources.state.stream
        .compose(selectActionResult("SleepAction"))
        .debug(r => console.warn(r))
    },
    HumanSpeechbubbleAction: {
      result: sources.state.stream
        .compose(selectActionResult("HumanSpeechbubbleAction"))
        .debug(r => console.error(r))
    }
  });

  return {
    state: raceSinks.state,
    HumanSpeechbubbleAction: raceSinks.HumanSpeechbubbleAction,
    SleepAction: raceSinks.SleepAction
  };
}

function main(sources) {
  const state$ = sources.state.stream;
  state$.addListener({
    next: s => console.debug("reducer state", s)
  });
  const result$ = state$.compose(selectActionResult("SleepAction"));
  result$.addListener({
    next: s => console.debug("result", s)
  });

  const goalProxy$ = xs.create();
  const cancelProxy$ = xs.create();
  const sleepAction = isolate(SleepAction, "SleepAction")({
    state: sources.state,
    // goal: xs.merge(
    //   xs.of(1000).compose(delay(1000)),
    //   xs.of(2000).compose(delay(1000))
    // ),
    goal: goalProxy$,
    cancel: cancelProxy$,
    Time: sources.Time
  });

  const dt = DisplayTextAction({
    state: sources.state,
    DisplayTextAction: {
      goal: xs
        .of({
          HumanSpeechbubbleAction: ["Hello!"],
          SleepAction: 1000
        })
        .compose(delay(1000)),
      cancel: xs.never()
    }
  });

  goalProxy$.imitate(dt.SleepAction.goal);
  cancelProxy$.imitate(dt.SleepAction.cancel);

  sources.state.stream
    .compose(selectActionResult("DisplayButtonAction"))
    .addListener({ next: x => console.error("====", x) });

  return {
    state: xs.merge(sleepAction.state, dt.state),
    HumanSpeechbubbleAction: dt.HumanSpeechbubbleAction
  };
}

run(
  withState(withTabletFaceRobotActions(main)),
  Object.assign({}, initializeTabletFaceRobotDrivers(), { Time: timeDriver })
);

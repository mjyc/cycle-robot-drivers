import xs from "xstream";
import isolate from "@cycle/isolate";
import {
  createConcurrentAction,
  selectActionResult
} from "@cycle-robot-drivers/action";

export function DisplayTextAction(sources) {
  const RaceAction = createConcurrentAction(
    ["SleepAction", "RobotSpeechbubbleAction"],
    true
  );
  const sleepActionResult$ = sources.state.stream.compose(
    selectActionResult("SleepAction")
  );
  const raceSinks = isolate(RaceAction, "DisplayTextAction")({
    state: sources.state,
    goal: sources.DisplayTextAction.goal,
    cancel: sources.DisplayTextAction.cancel,
    SleepAction: {
      result: sleepActionResult$
    },
    RobotSpeechbubbleAction: {
      result: sources.state.stream.compose(
        selectActionResult("RobotSpeechbubbleAction")
      )
    }
  }) as any;

  const RobotSpeechbubbleAction = {
    goal: xs.merge(
      sleepActionResult$
        .debug()
        .filter(r => r.status.status === "SUCCEEDED")
        .mapTo(""),
      raceSinks.RobotSpeechbubbleAction.goal
    ),
    cancel: raceSinks.RobotSpeechbubbleAction.cancel
  };

  return {
    state: raceSinks.state,
    RobotSpeechbubbleAction,
    SleepAction: raceSinks.SleepAction
  };
}

import xs from "xstream";
import isolate from "@cycle/isolate";
import {
  createConcurrentAction,
  selectActionResult
} from "@cycle-robot-drivers/action";

export function DisplayButtonAction(sources) {
  const RaceAction = createConcurrentAction(
    ["SleepAction", "HumanSpeechbubbleAction"],
    true
  );
  const sleepActionResult$ = sources.state.stream.compose(
    selectActionResult("SleepAction")
  );
  const raceSinks = isolate(RaceAction, "DisplayButtonAction")({
    state: sources.state,
    goal: sources.DisplayButtonAction.goal,
    cancel: sources.DisplayButtonAction.cancel,
    SleepAction: {
      result: sources.state.stream.compose(selectActionResult("SleepAction"))
    },
    HumanSpeechbubbleAction: {
      result: sources.state.stream.compose(
        selectActionResult("HumanSpeechbubbleAction")
      )
    }
  }) as any;

  const HumanSpeechbubbleAction = {
    goal: xs.merge(
      sleepActionResult$
        .debug()
        .filter(r => r.status.status === "SUCCEEDED")
        .mapTo([]),
      raceSinks.HumanSpeechbubbleAction.goal
    ),
    cancel: raceSinks.HumanSpeechbubbleAction.cancel
  };

  return {
    state: raceSinks.state,
    HumanSpeechbubbleAction,
    SleepAction: raceSinks.SleepAction
  };
}

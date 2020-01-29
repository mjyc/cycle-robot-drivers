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

  return {
    state: raceSinks.state,
    HumanSpeechbubbleAction: raceSinks.HumanSpeechbubbleAction,
    SleepAction: raceSinks.SleepAction
  };
}

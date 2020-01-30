import xs from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import isolate from "@cycle/isolate";
import {
  Status,
  createConcurrentAction,
  selectActionResult,
  generateGoalStatus,
  isEqualGoalStatus
} from "@cycle-robot-drivers/action";

export function status(reducerState$) {
  const done$ = reducerState$
    .filter(rs => !!rs.outputs && !!rs.outputs.result)
    .map(rs => rs.outputs.result.status);
  const active$ = reducerState$
    .filter(rs => rs.state === "RUN")
    .map(rs => ({ goal_id: rs.variables.goal_id, status: Status.ACTIVE }));
  const initGoalStatus = generateGoalStatus({ status: Status.SUCCEEDED });
  return xs
    .merge(done$, active$)
    .compose(dropRepeats(isEqualGoalStatus))
    .startWith(initGoalStatus);
}

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
      sleepActionResult$.filter(r => r.status.status === "SUCCEEDED").mapTo([]),
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

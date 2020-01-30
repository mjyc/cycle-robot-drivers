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

export function DisplayTextAction(sources) {
  const RaceAction = createConcurrentAction(
    ["DisplayTextSleepAction", "RobotSpeechbubbleAction"],
    true
  );
  const sleepActionResult$ = sources.state.stream.compose(
    selectActionResult("DisplayTextSleepAction")
  );
  const raceSinks = isolate(RaceAction, "DisplayTextAction")({
    state: sources.state,
    goal: sources.DisplayTextAction.goal,
    cancel: sources.DisplayTextAction.cancel,
    DisplayTextSleepAction: {
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
      sleepActionResult$.filter(r => r.status.status === "SUCCEEDED").mapTo(""),
      raceSinks.RobotSpeechbubbleAction.goal
    ),
    cancel: raceSinks.RobotSpeechbubbleAction.cancel
  };

  return {
    state: raceSinks.state,
    RobotSpeechbubbleAction,
    DisplayTextSleepAction: raceSinks.DisplayTextSleepAction
  };
}

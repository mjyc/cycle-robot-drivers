import xs from "xstream";
import delay from "xstream/extra/delay";
import { withState } from "@cycle/state";
import { run } from "@cycle/run";
import isolate from "@cycle/isolate";
import { timeDriver } from "@cycle/time";
import { selectActionResult } from "@cycle-robot-drivers/action";
import {
  SleepAction,
  selectSleepActionStatus
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
    .compose(selectAction("SleepAction"))
    .compose(selectSleepActionStatus);
  status$.addListener({
    next: s => console.debug("status", s)
  });
  const result$ = state$.compose(selectActionResult("SleepAction"));
  result$.addListener({
    next: s => console.debug("result", s)
  });

  const sleepAction = isolate(SleepAction, "SleepAction")({
    state: sources.state,
    goal: xs.merge(
      xs.of(1000).compose(delay(1000)),
      xs.of(2000).compose(delay(3000))
    ) as any,
    Time: sources.Time
  });

  return {
    state: sleepAction.state
  };
}

run(withState(main), {
  Time: timeDriver
});

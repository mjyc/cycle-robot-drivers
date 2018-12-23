import {Stream} from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import {Status, isEqualResult} from "@cycle-robot-drivers/action";

export const selectActionResult = (actionName: string) =>
  (in$: Stream<any>) => in$
    .filter(s => !!s
      && !!s[actionName]
      && !!s[actionName].outputs
      && !!s[actionName].outputs.result)
    .map(s => s[actionName].outputs.result)
    .compose(dropRepeats(isEqualResult));
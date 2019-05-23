import xs from "xstream";
import { runTabletRobotFaceApp } from "@cycle-robot-drivers/run";

function main(sources) {
  const face$ = xs.merge(
    sources.TabletFace.events("load").mapTo({
      type: "START_BLINKING"
    }),
    xs
      .periodic(2000)
      .map(i => {
        if (i === 0) {
          return { type: "EXPRESS", value: { type: "HAPPY" } };
        } else if (i === 1) {
          return { type: "EXPRESS", value: { type: "SAD" } };
        } else if (i === 2) {
          return { type: "EXPRESS", value: { type: "ANGRY" } };
        } else if (i === 3) {
          return { type: "EXPRESS", value: { type: "FOCUSED" } };
        } else if (i === 4) {
          return { type: "EXPRESS", value: { type: "CONFUSED" } };
        }
      })
      .filter(expression => !!expression)
  );

  return {
    DOM: sources.TabletFace.events("dom"),
    TabletFace: face$
  };
}

runTabletRobotFaceApp(main);

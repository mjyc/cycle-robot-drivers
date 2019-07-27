import xs from "xstream";
import { makeDOMDriver, div, video, canvas } from "@cycle/dom";
import { run } from "@cycle/run";
import { makeHandTrackDriver } from "cycle-handtrack-driver";

function main(sources) {
  sources.HandTrack.addListener({ next: console.log });

  const vdom$ = xs
    .of(
      div(".handtrack", [
        ,
        video(".handtrack-video", {
          style: { display: "none", transform: "rotateY(180deg)" }
        }),
        canvas(".handtrack-canvas")
      ])
    )
    .startWith("");
  const command$ = xs
    .combine(
      sources.DOM.select(".handtrack-video")
        .element()
        .take(1),
      sources.DOM.select(".handtrack-canvas")
        .element()
        .take(1)
    )
    .map(x => ({ type: "start", elems: x }));
  return {
    DOM: vdom$,
    HandTrack: command$
  };
}

run(main, {
  DOM: makeDOMDriver("#app"),
  HandTrack: makeHandTrackDriver()
});

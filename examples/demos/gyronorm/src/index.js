import xs from "xstream";
import { div, a, pre, makeDOMDriver } from "@cycle/dom";
import { run } from "@cycle/run";
import { makeGyronormDriver } from "cycle-gyronorm-driver";

function main(sources) {
  sources.GyroNorm.addListener({ next: f => console.log(f) });
  const vdom$ = sources.GyroNorm.replaceError(err => xs.of(false)).map(data =>
    !data
      ? div([
          "To view this demo, browse to ",
          a(
            {
              props: {
                href: "https://cycle-robot-drivers-demos-gyronorm.stackblitz.io"
              }
            },
            "https://cycle-robot-drivers-demos-gyronorm.stackblitz.io"
          ),
          " on your mobile device"
        ])
      : pre(`DeviceOrientation: ${JSON.stringify(data.do)}
DeviceMotion: ${JSON.stringify(data.dm)}`)
  );
  return {
    DOM: vdom$
  };
}

run(main, {
  DOM: makeDOMDriver("#app"),
  GyroNorm: makeGyronormDriver()
});

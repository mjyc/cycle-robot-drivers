import xs from "xstream";
import delay from "xstream/extra/delay";
import { runTabletRobotFaceApp } from "@cycle-robot-drivers/run";

function main(sources) {
  const start$ = xs.merge(
    xs.of(null),
    sources.SpeechSynthesisAction.result.compose(delay(5000))
  );
  const speechstart$ = sources.SpeechRecognition.events("speechstart");

  const say$ = start$.mapTo(
    "You can interrupt me by saying something while I'm speaking."
  );
  const stop$ = speechstart$.mapTo(null);
  const listen$ = start$.mapTo({});

  return {
    SpeechSynthesisAction: { goal: say$, cancel: stop$ },
    SpeechRecognitionAction: { goal: listen$ }
  };
}

runTabletRobotFaceApp(main);

import xs from "xstream";
import sampleCombine from "xstream/extra/sampleCombine";
import isolate from "@cycle/isolate";
import { run } from "@cycle/run";
import { withState } from "@cycle/state";
import { div, label, input, br, button, makeDOMDriver } from "@cycle/dom";
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction,
  makeSpeechRecognitionDriver,
  SpeechRecognitionAction
} from "@cycle-robot-drivers/speech";

function main(sources) {
  sources.state.stream.addListener({
    next: s => console.debug("reducer state", s)
  });

  // speech synthesis
  const say$ = sources.DOM.select(".say").events("click");
  const inputText$ = sources.DOM.select(".inputtext")
    .events("input")
    .map(ev => ev.target.value)
    .startWith("");
  const synthGoal$ = say$
    .compose(sampleCombine(inputText$))
    .filter(([_, text]) => !!text)
    .map(([_, text]) => ({
      goal_id: { stamp: Date.now(), id: "ss" },
      goal: { text: text, rate: 0.9, afterpauseduration: 1000 }
    }));
  const speechSynthesisAction = isolate(SpeechSynthesisAction)({
    state: sources.state,
    SpeechSynthesis: sources.SpeechSynthesis,
    goal: synthGoal$,
    cancel: xs.never()
  });
  speechSynthesisAction.status.addListener({
    next: s => console.log("SpeechSynthesisAction status", s)
  });
  speechSynthesisAction.result.addListener({
    next: r => console.log("SpeechSynthesisAction result", r)
  });

  // speech recognition
  const recogGoal$ = sources.DOM.select("#listen")
    .events("click")
    .mapTo({ goal_id: { stamp: Date.now(), id: "sr" }, goal: {} });
  const speechRecognitionAction = isolate(SpeechRecognitionAction)({
    state: sources.state,
    goal: recogGoal$,
    cancel: xs.never(),
    SpeechRecognition: sources.SpeechRecognition
  });
  speechRecognitionAction.status.addListener({
    next: s => console.log("SpeechRecognitionAction status", s)
  });

  // UI
  const vdom$ = speechRecognitionAction.result
    .filter(r => r.status.status === "SUCCEEDED")
    .startWith({ result: "" })
    .map(r =>
      div([
        button(".say", "say"),
        input(".inputtext", { attrs: { type: "text" } }),
        br(),
        button("#listen", "listen"),
        r.result === "" ? null : label(`heard: ${r.result}`)
      ])
    );

  const reducer = xs.merge(
    speechSynthesisAction.state,
    speechRecognitionAction.state
  );
  return {
    DOM: vdom$,
    SpeechSynthesis: speechSynthesisAction.SpeechSynthesis,
    SpeechRecognition: speechRecognitionAction.SpeechRecognition,
    state: reducer
  };
}

run(withState(main), {
  DOM: makeDOMDriver("#app"),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver()
});

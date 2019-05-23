import xs from "xstream";
import delay from "xstream/extra/delay";
import { div, button, makeDOMDriver } from "@cycle/dom";
import { withState } from "@cycle/state";
import { run } from "@cycle/run";
import {
  makeAudioPlayerDriver,
  AudioPlayerAction
} from "@cycle-robot-drivers/sound";

function main(sources) {
  sources.state.stream.addListener({
    next: s => console.debug("reducer state", s)
  });

  const goal$ = xs
    .merge(
      xs.of(1).compose(delay(10)),
      xs.of(1).compose(delay(7010)),
      sources.DOM.select("button").events("click")
    )
    .debug()
    .mapTo({
      goal_id: { stamp: Date.now(), goal_id: "ap" },
      goal:
        "https://raw.githubusercontent.com/aramadia/willow-sound/master/E/E01.ogg"
    });
  const audioPlayerAction = AudioPlayerAction({
    state: sources.state,
    goal: goal$,
    AudioPlayer: sources.AudioPlayer
  });
  audioPlayerAction.status.addListener({
    next: s => console.log("AudioPlayerAction status", s)
  });

  const $vdom = xs.of(div([button("Play Sound")]));

  return {
    AudioPlayer: audioPlayerAction.AudioPlayer,
    DOM: $vdom,
    state: audioPlayerAction.state
  };
}

run(withState(main), {
  AudioPlayer: makeAudioPlayerDriver(),
  DOM: makeDOMDriver("#app")
});

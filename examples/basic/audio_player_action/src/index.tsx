import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeAudioPlayerDriver,
  IsolatedAudioPlayerAction as AudioPlayerAction,
} from '@cycle-robot-drivers/sound'


function main(sources) {
  const vdom$ = xs.of((<div>Cycle.js AudioPlayerAction component demo</div>));
  const audio$ = xs.create();
  setTimeout(() => audio$.shamefullySendNext({
    src: require("../public/snd/IWohoo1.ogg")
  }), 1);
  // test overwriting the current goal
  setTimeout(() => audio$.shamefullySendNext({
    src: require("../public/snd/IWohoo2.ogg")
  }), 500);
  setTimeout(() => audio$.shamefullySendNext(null), 1000);
  setTimeout(() => audio$.shamefullySendNext({
    src: require("../public/snd/IWohoo3.ogg")
  }), 2000);
  // test calling cancel on done; cancel must do nothing
  setTimeout(() => audio$.shamefullySendNext(null), 4000);

  const audioPlayerAction = AudioPlayerAction({
    goal: audio$,
    AudioPlayer: sources.AudioPlayer,
  });

  return {
    DOM: vdom$,
    AudioPlayer: audioPlayerAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  AudioPlayer: makeAudioPlayerDriver(),
});

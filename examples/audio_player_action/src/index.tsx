import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {makeAudioPlayerDriver} from '@cycle-robot-drivers/sound'


function main(sources) {
  const vdom$ = xs.of((<div>Cycle.js AudioPlayerAction component demo</div>));

  const audio$ = xs.of({src: require("../public/snd/IWohoo1.ogg")});

  ['abort', 'error', 'ended', 'loadeddata'].map((eventName) => {
    sources.AudioPlayer.events(eventName).addListener({
      next: data => console.warn(eventName, data),
    });
  })

  return {
    DOM: vdom$,
    AudioPlayer: audio$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  AudioPlayer: makeAudioPlayerDriver(),
});

import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {makeAudioPlayerDriver} from '@cycle-robot-drivers/sound'


function main(sources) {
  const vdom$ = xs.of((<div>Cycle.js AudioPlayerAction component demo</div>));

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  AudioPlayer: makeAudioPlayerDriver(),
});

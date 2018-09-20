import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {div, makeDOMDriver} from '@cycle/dom';
import {run} from '@cycle/run';
import {powerup} from '@cycle-robot-drivers/action';
import {
  makeAudioPlayerDriver,
  AudioPlayerAction,
} from '@cycle-robot-drivers/sound';


function main(sources) { 
  sources.proxies = {  // will be connected to "targets"
  AudioPlayerAction: xs.create(),
  };
  // create action components
  sources.AudioPlayerAction = AudioPlayerAction({
    goal: sources.proxies.AudioPlayerAction,
    AudioPlayer: sources.AudioPlayer,
  });


  const goal$ = xs.of(
    'https://raw.githubusercontent.com/aramadia/willow-sound/master/E/E01.ogg'
  ).compose(delay(1000));

  
  return {
    AudioPlayer: sources.AudioPlayerAction.value,
    targets: {  // will be used by "proxies"
      AudioPlayerAction: goal$,
    }
  }
}

run(powerup(main, (proxy, target) => proxy.imitate(target)), {
  DOM: makeDOMDriver('#app'),
  AudioPlayer: makeAudioPlayerDriver(),
});

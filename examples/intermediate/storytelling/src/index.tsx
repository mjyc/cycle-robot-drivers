import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/face'
import {
  makeAudioPlayerDriver,
  IsolatedAudioPlayerAction as AudioPlayerAction,
} from '@cycle-robot-drivers/sound'


function main(sources) {
  const sbub$ = xs.create();
  window.onload = () => {
    setTimeout(() => {
      sbub$.shamefullySendNext({type: 'message', value: 'Hello'});
    }, 1);
    // test overwriting the current goal
    setTimeout(() => {
      sbub$.shamefullySendNext({type: 'message', value: 'World!'});
    }, 100);
    // test canceling an active goal
    setTimeout(() => {sbub$.shamefullySendNext(null);}, 200);
    // test calling cancel on done; cancel must do nothing
    setTimeout(() => {
      sbub$.shamefullySendNext({type: 'choices', value: ['Hello', 'World!']});
    }, 500);
    // you must click a button here
    setTimeout(() => {sbub$.shamefullySendNext(null);}, 2000);
  };

  const speechbubbleAction = TwoSpeechbubblesAction({
    goal: sbub$,
    DOM: sources.DOM,
  });


  const audio$ = xs.create();
  setTimeout(() => audio$.shamefullySendNext({
    src: require("../public/snd/IWohoo1.ogg")
  }), 1);

  const audioPlayerAction = AudioPlayerAction({
    goal: audio$,
    AudioPlayer: sources.AudioPlayer,
  });


  const vdom$ = speechbubbleAction.DOM.map((speechbubble) => {
    return (
      <div>
        {speechbubble}
      </div>
    );
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

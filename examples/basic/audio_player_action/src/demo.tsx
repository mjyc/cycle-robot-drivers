import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeAudioPlayerDriver,
  AudioPlayerAction,
} from '@cycle-robot-drivers/sound';

const files = [
  require('../public/snd/IWohoo1.ogg'),
  require('../public/snd/IWohoo2.ogg'),
  require('../public/snd/IWohoo3.ogg'),
];


function main(sources) {
  const goalProxy$ = xs.create();
  const audioPlayerAction = AudioPlayerAction({
    goal: goalProxy$,
    AudioPlayer: sources.AudioPlayer,
  });

  const src$ = sources.DOM.select('#src').events('change')
    .map(ev => (ev.target as HTMLInputElement).value)
    .startWith(files[0]);

  // send goals to the action
  goalProxy$.imitate(
    xs.merge(
      sources.DOM.select('#start').events('click')
        .mapTo(src$.map(src => ({src})).take(1)).flatten(),
      sources.DOM.select('#cancel').events('click').mapTo(null),
    )
  );

  // update the state
  const state$ = xs.combine(
    src$,
    audioPlayerAction.status.startWith(null),
    audioPlayerAction.result.startWith(null),
  ).map(([src, status, result]) => {
    return {
      src,
      status,
      result,
    }
  });

  const styles = {code: {"background-color": "#f6f8fa"}};
  const vdom$ = state$.map(s => (
    <div>
      <h1>AudioPlayerAction component demo</h1>

      <div>
        <h3>Action inputs</h3>
        <div>
          <select id="src">{files.map(file => (file === s.src ? (
            <option selected value={file}>{file}</option>
          ) : (
            <option value={file}>{file}</option>
          )))}</select>
       </div>
      </div>

      <div>
        <h3>Controls</h3>
        <div>
          <button id="start">Start</button>
          <button id="cancel">Cancel</button>
        </div>
      </div>

      <div>
        <h3>Action outputs</h3>
        <div>
          <pre style={styles.code}>"status": {JSON.stringify(s.status, null, 2)}
          </pre>
          <pre style={styles.code}>"result": {JSON.stringify(s.result, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  ));

  return {
    DOM: vdom$,
    AudioPlayer: audioPlayerAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  AudioPlayer: makeAudioPlayerDriver(),
});

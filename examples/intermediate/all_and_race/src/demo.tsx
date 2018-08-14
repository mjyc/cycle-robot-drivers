import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {initGoal, isEqual} from '@cycle-robot-drivers/action';
import {
  makeSpeechSynthesisDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'
import {
  makeAudioPlayerDriver,
  IsolatedAudioPlayerAction as AudioPlayerAction,
} from '@cycle-robot-drivers/sound'

const files = [
  require('../public/snd/IWohoo1.ogg'),
  require('../public/snd/IWohoo2.ogg'),
  require('../public/snd/IWohoo3.ogg'),
];


function main(sources) {
  const goalsProxy$ = xs.create();
  const audioPlayerAction = AudioPlayerAction({
    goal: goalsProxy$.map((goals: any) => goals.sound),
    AudioPlayer: sources.AudioPlayer,
  });
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: goalsProxy$.map((goals: any) => goals.synth),
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  const params$ = xs.combine(
    sources.DOM.select('#text1').events('focusout')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(''),
    sources.DOM.select('#text2').events('focusout')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(''),
    sources.DOM.select('#src1').events('change')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(files[0]),
    sources.DOM.select('#src2').events('change')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(files[0]),
  ).remember();

  const allGoals$ = sources.DOM.select('#all').events('click')
    .mapTo(params$.take(1)).flatten().map(params => ({
      synth: initGoal({text: params[0]}),
      sound: initGoal({src: params[2]}),
    }));
  goalsProxy$.imitate(allGoals$);
  // goalsProxy$.addListener({next: data => console.log('goalProxy', data)})

  const state$ = xs.combine(
    params$,
    speechSynthesisAction.status.startWith(null),
    speechSynthesisAction.result.startWith(null),
  ).map(([params, status, result]) => {
    return {
      params,
      status,
      result,
    }
  });
  const vdom$ = state$.map(state => (
    <div>
      <div>
        <h3>Inputs</h3>
        <table>
          <tr>
            <th></th>
            <th>Joint action 1</th>
            <th>Joint action 2</th>
          </tr>
          <tr>
            <th>Say</th>
            <td><input id="text1" type="text"></input></td>
            <td><input id="text2" type="text"></input></td>
          </tr>
          <tr>
            <th>Play</th>
            <td>
              <select id="src1">{files.map(file => (state.params[2] === file ? (
                <option selected value={file}>{file}</option>
              ) : (
                <option value={file}>{file}</option>
              )))}</select>
            </td>
            <td>
              <select id="src2">{files.map(file => (state.params[3] === file ? (
                <option selected value={file}>{file}</option>
              ) : (
                <option value={file}>{file}</option>
              )))}</select>
            </td>
          </tr>
        </table>
      </div>

      <div>
        <h3>Controls</h3>
        <div>
          <button id="all">all</button>
          <button id="race">race</button>
        </div>
      </div>

      <div>
        <h3>Outputs</h3>
        <table>
          <tr>
            <th></th>
            <th>Say</th>
            <th>Play</th>
            <th>Joint</th>
          </tr>
          <tr>
            <td>Outputs</td>
            <td>1</td>
            <td>2</td>
            <td>3</td>
          </tr>
        </table>
      </div>
    </div>
  ));

  return {
    DOM: vdom$,
    AudioPlayer: audioPlayerAction.value.debug(d => console.warn('sound.value', d)),
    SpeechSynthesis: speechSynthesisAction.value.debug(d => console.warn('synth.value',d)),
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  AudioPlayer: makeAudioPlayerDriver(),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  Time: timeDriver,
});

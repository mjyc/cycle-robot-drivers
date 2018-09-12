import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {initGoal} from '@cycle-robot-drivers/action';
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction as SpeechSynthesisAction,
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
  // Create action components
  const goalsProxy$ = xs.create();
  const audioPlayerAction = AudioPlayerAction({
    goal: goalsProxy$.map((goals: any) => goals.audio),
    AudioPlayer: sources.AudioPlayer,
  });
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: goalsProxy$.map((goals: any) => goals.speech),
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  // cache parameters
  const params$ = xs.combine(
    sources.DOM.select('#src1').events('change')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(files[0]),
    sources.DOM.select('#src2').events('change')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(files[1]),
    sources.DOM.select('#text1').events('focusout')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith('Hello'),
    sources.DOM.select('#text2').events('focusout')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith('World'),
  ).remember();

  // Prepare first goal streams
  const extractFirstGoals = (params) => ({
    audio: initGoal({src: params[0]}),
    speech: initGoal({text: params[2]}),
  });
  const allGoals$ = sources.DOM.select('#all').events('click')
    .mapTo(params$.take(1)).flatten().map(extractFirstGoals);
  const raceGoals$ = sources.DOM.select('#race').events('click')
    .mapTo(params$.take(1)).flatten().map(extractFirstGoals);

  // Create result streams
  const allResult$ = sources.DOM.select('#all').events('click').mapTo(
    xs.combine(
      audioPlayerAction.result,
      speechSynthesisAction.result,
    ).take(1)
  ).flatten();
  const raceResult$ = sources.DOM.select('#race').events('click').mapTo(
    xs.merge(
      audioPlayerAction.result,
      speechSynthesisAction.result,
    ).take(1)
  ).flatten();

  // Create second goal streams
  const extractSecondGoals = (params) => ({
    audio: initGoal({src: params[1]}),
    speech: initGoal({text: params[3]}),
  });
  // end them on receiving results
  goalsProxy$.imitate(
    xs.merge(
      allGoals$,
      raceGoals$,
      allResult$.mapTo(params$.take(1)).flatten().map(extractSecondGoals),
      raceResult$.mapTo(params$.take(1)).flatten().map(extractSecondGoals),
    )
  );

  const state$ = xs.combine(
    params$,
    speechSynthesisAction.status.startWith(null),
    speechSynthesisAction.result.startWith(null),
    audioPlayerAction.status.startWith(null),
    audioPlayerAction.result.startWith(null),
    xs.merge(allResult$, raceResult$).startWith(null)
  ).map(([
    params, audioStatus, audioResult, speechStatus, speechResult, joint1Result,
  ]) => {
    return {
      params,
      audioStatus,
      audioResult,
      speechStatus,
      speechResult,
      joint1Result,
    }
  });
  const styles = {code: {"background-color": "#f6f8fa"}};
  const vdom$ = state$.map(s => (
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
            <th>Play</th>
            <td>
              <select id="src1">{files.map(file => (s.params[0] === file ? (
                <option selected value={file}>{file}</option>
              ) : (
                <option value={file}>{file}</option>
              )))}</select>
            </td>
            <td>
              <select id="src2">{files.map(file => (s.params[1] === file ? (
                <option selected value={file}>{file}</option>
              ) : (
                <option value={file}>{file}</option>
              )))}</select>
            </td>
          </tr>
          <tr>
            <th>Say</th>
            <td><input id="text1" type="text" value={s.params[2]}></input></td>
            <td><input id="text2" type="text" value={s.params[3]}></input></td>
          </tr>
        </table>
      </div>

      <div>
        <h3>Controls</h3>
        <div>
          <button disabled={(
            (s.audioStatus && (s.audioStatus as any).status === "ACTIVE")
            || (s.speechStatus && (s.speechStatus as any).status === "ACTIVE")
          )} id="all">all</button>
          <button disabled={(
            (s.audioStatus && (s.audioStatus as any).status === "ACTIVE")
            || (s.speechStatus && (s.speechStatus as any).status === "ACTIVE")
          )} id="race">race</button>
          <span><small> (for joint action 1)</small></span>
        </div>
      </div>

      <div>
        <h3>Outputs</h3>
        <table>
          <tr>
            <th>Say</th>
            <th>Play</th>
            <th>Joint action 1</th>
          </tr>
          <tr>
            <td>
              <pre style={styles.code}>
                "status": {JSON.stringify(s.audioStatus, null, 2)}
              </pre>
              <pre style={styles.code}>
                "result": {JSON.stringify(s.audioResult, null, 2)}
              </pre>
            </td>
            <td>
              <pre style={styles.code}>
                "status": {JSON.stringify(s.speechStatus, null, 2)}
              </pre>
              <pre style={styles.code}>
                "result": {JSON.stringify(s.speechResult, null, 2)}
              </pre>
            </td>
            <td>
              <pre style={styles.code}>
                "result": {JSON.stringify(s.joint1Result, null, 2)}
              </pre>
            </td>
          </tr>
        </table>
      </div>
    </div>
  ));

  return {
    DOM: vdom$,
    AudioPlayer: audioPlayerAction.value,
    SpeechSynthesis: speechSynthesisAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  AudioPlayer: makeAudioPlayerDriver(),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  Time: timeDriver,
});

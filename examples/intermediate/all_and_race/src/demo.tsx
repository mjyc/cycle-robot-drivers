import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
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
      .startWith(files[0]),
    sources.DOM.select('#text1').events('focusout')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(''),
    sources.DOM.select('#text2').events('focusout')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(''),
  ).remember();

  const allGoals$ = sources.DOM.select('#all').events('click')
    .mapTo(params$.take(1)).flatten().map(params => ({
      audio: initGoal({src: params[0]}),
      speech: initGoal({text: params[2]}),
    }));
   const raceGoals$ = sources.DOM.select('#race').events('click')
    .mapTo(params$.take(1)).flatten().map(params => ({
      audio: initGoal({src: params[0]}),
      speech: initGoal({text: params[2]}),
    }));

  const action$ = xs.merge(
    allGoals$.map(g => ({type: 'ALL', value: g})),
    raceGoals$.map(g => ({type: 'RACE', value: g})),
    audioPlayerAction.result.map(r => ({type: 'AUDIO_RESULT', value: r})),
    speechSynthesisAction.result.map(r => ({type: 'SPEECH_RESULT', value: r})),
  );
  const actionState$ = action$.fold((state: any, action: {type: string, value: any}) => {
    console.debug('state, action', state, action);
    if (action.type === 'ALL') {
      return {
        type: 'ALL',
        goal_ids: [
          action.value.audio.goal_id,
          action.value.speech.goal_id,
        ],
        result: [],
      };
    } else if (action.type === 'RACE') {
      return {
        type: 'RACE',
        goal_ids: [
          action.value.audio.goal_id,
          action.value.speech.goal_id,
        ],
        result: null,
      };
    } else if (action.type === 'AUDIO_RESULT' || action.type === 'SPEECH_RESULT') {
      if (state.type === 'ALL') {
        const goal_ids = state.goal_ids
          .filter(goal_id => !isEqual(goal_id, action.value.status.goal_id));
        if (state.goal_ids.length - 1 === goal_ids.length) {
          return {
            ...state,
            goal_ids,
            result: [...state.result, action.value],
          };
        }
      } else if (state.type === 'RACE') {
        if (state.goal_ids
            .filter(goal_id => isEqual(goal_id, action.value.status.goal_id))
            .length > 0) {
          return {
            ...state,
            goal_ids: [],
            result: action.value,
          };
        }
      }
    }
    return state;
  }, {}).compose(dropRepeats());

  goalsProxy$.imitate(
    xs.merge(
      allGoals$,
      raceGoals$,
      actionState$
        .filter(s => (
          (s.type === 'ALL' && s.goal_ids.length === 0)
          || (s.type === 'RACE' && s.goal_ids.length === 0)
        ))
        .mapTo(params$.take(1)).flatten().map(params => ({
          audio: initGoal({src: params[1]}),
          speech: initGoal({text: params[3]}),
        })),
    )
  );

  const state$ = xs.combine(
    params$,
    speechSynthesisAction.status.startWith(null),
    speechSynthesisAction.result.startWith(null),
    audioPlayerAction.status.startWith(null),
    audioPlayerAction.result.startWith(null),
    actionState$.startWith(null)
  ).map(([
    params,
    audioStatus, audioResult, speechStatus, speechResult,
    actionState,]) => {
    return {
      params,
      audioStatus,
      audioResult,
      speechStatus,
      speechResult,
      actionResult: actionState && actionState.result,
    }
  });
  const styles = {code: {"background-color": "#f6f8fa"}}
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
              <select id="src1">{files.map(file => (s.params[2] === file ? (
                <option selected value={file}>{file}</option>
              ) : (
                <option value={file}>{file}</option>
              )))}</select>
            </td>
            <td>
              <select id="src2">{files.map(file => (s.params[3] === file ? (
                <option selected value={file}>{file}</option>
              ) : (
                <option value={file}>{file}</option>
              )))}</select>
            </td>
          </tr>
          <tr>
            <th>Say</th>
            <td><input id="text1" type="text"></input></td>
            <td><input id="text2" type="text"></input></td>
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
            <th>Joint action 1</th>
          </tr>
          <tr>
            <td>Outputs</td>
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
                "result": {JSON.stringify(s.actionResult, null, 2)}
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

import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {
  makeSpeechSynthesisDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'

const files = [
  require('../public/snd/IWohoo1.ogg'),
  require('../public/snd/IWohoo2.ogg'),
  require('../public/snd/IWohoo3.ogg'),
];


function main(sources) {
  const vdom$ = xs.of(null).map(s => (
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
              <select id="src1">{files.map(file => (false ? (
                <option selected value={file}>{file}</option>
              ) : (
                <option value={file}>{file}</option>
              )))}</select>
            </td>
            <td>
              <select id="src2">{files.map(file => (false ? (
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
    // SpeechSynthesis: speechSynthesisAction.value,
    // SpeechRecognition: speechRecognitionAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  // SpeechSynthesis: makeSpeechSynthesisDriver(),
  // SpeechRecognition: makeSpeechRecognitionDriver(),
  Time: timeDriver,
});

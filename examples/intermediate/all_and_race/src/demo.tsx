import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {
  makeSpeechSynthesisDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const vdom$ = xs.of(null).map(s => (
    <div>
      <table>
        <tr>
          <th></th>
          <th>Joint Action 1</th>
          <th>Joint Action 2</th>
        </tr>
        <tr>
          <td>Say</td>
          <td></td>
        </tr>
        <tr>
          <td>Play</td>
          <td></td>
        </tr>
      </table>
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

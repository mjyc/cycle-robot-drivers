import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechRecognitionDriver,
  // IsolatedSpeechRecognitionAction as SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const vdom$ = xs.of((<div>Cycle.js SpeechRecognitionAction component demo</div>));
  const recog$ = xs.create();
  setTimeout(() => {recog$.shamefullySendNext({});}, 1000);

  sources.SpeechRecognition.events('result').addListener({
    next: data => console.warn('result', data),
  });

  // const speechSynthesis = SpeechSynthesisAction({
  //   goal: recog$,
  //   SpeechRecognition: sources.SpeechRecognition,
  // });

  // speechSynthesis.result.addListener({
  //   next: data => console.warn('result', data),
  // });
  // speechSynthesis.status.addListener({
  //   next: data => console.warn('status', data),
  // });
  // speechSynthesis.value.addListener({
  //   next: data => console.warn('value', data),
  // });

  return {
    DOM: vdom$,
    SpeechRecognition: recog$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

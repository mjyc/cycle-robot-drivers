import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import isolate from '@cycle/isolate';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {div, label, input, br, button, makeDOMDriver, source} from '@cycle/dom';
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction,
  makeSpeechRecognitionDriver,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import {Status} from '../../../../action/lib/cjs';

function main(sources) {
  sources.state.stream.addListener({next: s => console.log('reducer state', s)});

  const say$ = sources.DOM.select('.say').events('click');
  const inputText$ = sources.DOM
    .select('.inputtext').events('input')
    .map(ev => ev.target.value)
    .startWith('');
  const synthGoal$ = say$.compose(sampleCombine(inputText$))
    .filter(([_, text]) => !!text)
    .map(([_, text]) => ({goal_id: `${new Date().getTime()}`, goal: text}));
  const speechSynthesisAction = isolate(SpeechSynthesisAction)({
    state: sources.state,
    goal: synthGoal$,
    cancel: xs.never(),
    SpeechSynthesis: sources.SpeechSynthesis,
  });
  speechSynthesisAction.status.addListener({next: s =>
    console.log('SpeechSynthesisAction status', s)});

  const recogGoal$ = sources.DOM.select('#listen').events('click')
    .mapTo({goal_id: `${new Date().getTime()}`, goal: {}});
  const speechRecognitionAction = isolate(SpeechRecognitionAction)({
    state: sources.state,
    goal: recogGoal$,
    cancel: xs.never(),
    SpeechRecognition: sources.SpeechRecognition,
  });
  speechRecognitionAction.status.addListener({next: s =>
    console.log('SpeechRecognitionAction status', s)});


  const vdom$ = speechRecognitionAction.result
    .filter(r => r.status.status === Status.SUCCEEDED)
    .startWith({result: ''})
    .map(r => div([
      button('.say', 'say'),
      input('.inputtext', {attrs: {type: 'text'}}),
      br(),
      button('#listen', 'listen'),
      r.result === '' ? null : label(`heard: ${r.result}`)
    ]));

  const reducer = xs.merge(speechSynthesisAction.state, speechRecognitionAction.state);
  return {
    DOM: vdom$,
    SpeechSynthesis: speechSynthesisAction.SpeechSynthesis,
    SpeechRecognition: speechRecognitionAction.SpeechRecognition.debug(),
    state: reducer,
  };
}

run(withState(main), {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

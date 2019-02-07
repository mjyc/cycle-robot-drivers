import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {div, label, input, br, button, makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction,
  makeSpeechRecognitionDriver,
} from '@cycle-robot-drivers/speech';

function main(sources) {
  const say$ = sources.DOM.select('.say').events('click');
  const inputText$ = sources.DOM
    .select('.inputtext').events('input')
    .map(ev => ev.target.value)
    .startWith('');
  const synthGoal$ = say$.compose(sampleCombine(inputText$))
    .filter(([_, text]) => !!text)
    .map(([_, text]) => ({goal_id: `${new Date().getTime()}`, goal: text}));
  const speechSynthesisAction = SpeechSynthesisAction({
    state: sources.state,
    goal: synthGoal$,
    cancel: xs.never(),
    SpeechSynthesis: sources.SpeechSynthesis,
  });
  speechSynthesisAction.status.addListener({next: s =>
    console.log('SpeechSynthesisAction status', s)});

  // const recogGoal$ = sources.DOM.select('.listen').events('click').mapTo({});
  // const speechRecognitionAction = SpeechRecognitionAction({
  //   state: sources.state,
  //   goal: recogGoal$,
  //   cancel: xs.never(),
  //   SpeechRecognition: sources.SpeechRecognition,
  // });
  // speechRecognitionAction.status.addListener({next: s =>
  //   console.log('SpeechRecognitionAction status', s)});


  const vdom$ = xs.of(div([
    button('.say', 'say'),
    input('.inputtext', {attrs: {type: 'text'}}),
    br(),
    button('.listen', 'listen'),
    label('heard: hello!')
  ]));

  return {
    DOM: vdom$,
    SpeechSynthesis: speechSynthesisAction.SpeechSynthesis,
    // SpeechRecognition: speechRecognitionAction.SpeechRecognition,
    state: speechSynthesisAction.state,
  };
}

run(withState(main), {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

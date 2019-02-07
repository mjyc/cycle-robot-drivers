import xs from 'xstream';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {div, label, input, br, button, makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction2,
  makeSpeechRecognitionDriver,
} from '@cycle-robot-drivers/speech';

function main(sources) {
  const vdom$ = sources.DOM
    .select('.myinput').events('input')
    .map(ev => ev.target.value)
    .startWith('')
    .map(name =>
      div([
        button('.say', 'say'),
        input('.myinput', {attrs: {type: 'text'}}),
        br(),
        button('listen'),
        label('heard: hello!')
      ])
    );

  const click$ = sources.DOM.select('.say').events('click');

  const speechSynthesisAction = SpeechSynthesisAction2({
    state: sources.state,
    goal: click$.mapTo({goal_id: 'test', goal: 'Hello'}), //xs.never(),
    cancel: xs.never(),
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  sources.state.stream.addListener({next: s => console.log(s)});

  return {
    DOM: vdom$,
    SpeechSynthesis: speechSynthesisAction.SpeechSynthesis,
    state: speechSynthesisAction.state,
  };
}

run(withState(main), {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
});

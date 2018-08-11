import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent'
import delay from 'xstream/extra/delay'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const goalProxy$ = xs.create();
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: goalProxy$,
    SpeechSynthesis: sources.SpeechSynthesis,
  });
  speechSynthesisAction.value.addListener({
    next: data => console.warn('value', data),
  });
  speechSynthesisAction.status.addListener({
    next: data => console.warn('status', data),
  });
  speechSynthesisAction.result.addListener({
    next: data => console.warn('result', data),
  });

  const state$ = xs.combine(
    sources.DOM.select('#text').events('focusout')
      .map(ev => (ev.target as HTMLInputElement).value)
      .startWith(''),
    sources.DOM.select('#rate').events('input')
      .map(ev => parseFloat((ev.target as HTMLInputElement).value))
      .startWith(1),
    sources.DOM.select('#pitch').events('input')
      .map(ev => parseFloat((ev.target as HTMLInputElement).value))
      .startWith(1),
  ).map(([text, rate, pitch]) => ({text, rate, pitch})).remember()


  goalProxy$.imitate(sources.DOM.select('#play').events('click')
      .mapTo(state$.take(1))
      .flatten());
    //.addListener({next: data => console.log('click', data)})


  const vdom$ = state$.debug(s => console.log('s4vdom', s)).map(s => (
    <div>
      <h1>Cycle.js SpeechSynthesisAction component demo</h1>
      <div>
        <span className="label">Text</span>
        <input id="text" type="text"></input>
      </div>
      <div>
        <span className="label">Rate</span>
        <input id="rate"
          type="range" min="0.5" max="2" value={s.rate} step="0.1"></input>
        <span>{s.rate}</span>
      </div>
      <div>
        <span className="label">Pitch</span>
        <input id="pitch"
          type="range" min="0" max="2" value={s.pitch} step="0.1"></input>
        <span>{s.pitch}</span>
      </div>
      <div>
        <button id="play">Speak</button>
      </div>
    </div>
  ));
  return {
    DOM: vdom$,
    SpeechSynthesis: speechSynthesisAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
});

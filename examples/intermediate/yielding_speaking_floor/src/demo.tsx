import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {
  GoalStatus, Status, Result,
} from '@cycle-robot-drivers/action'
import {
  makeSpeechSynthesisDriver,
  makeSpeechRecognitionDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
  IsolatedSpeechRecognitionAction as SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech'

const sentences = [
  "Did you know Steve Jobs said Stay Hungry. Stay Foolish?",
  "Did you know Pablo Picasso said Good Artists Copy, Great Artists Steal?",
  "Did you know Paul Graham said Argue with idiots, and you become an idiot?",
  "Did you know Oscar Wilde said Be yourself; everyone else is already taken?",
  "Did you know Leonardo Da Vinci said Simplicity is the ultimate sophistication?"
];


function main(sources) {
  const goal$ = xs.merge(
    sources.DOM.select('#say').events('click').mapTo({}),
  );
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: xs.merge(
      goal$.mapTo({
        text: sentences[Math.floor(Math.random()*sentences.length)],
        rate: 0.75,
      }).compose(sources.Time.delay(500)),  // give some time for recog to boot
      sources.SpeechRecognition.events('speechstart').mapTo(null),  // cancel
    ),
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  const speechRecognitionAction = SpeechRecognitionAction({
    goal: goal$.mapTo({}),
    SpeechRecognition: sources.SpeechRecognition,
  });

  const state$ = xs.combine(
    speechRecognitionAction.status.startWith({}),
    speechRecognitionAction.result.startWith({}),
  ).map(([status, result]: [GoalStatus, Result]) => {
    return {
      status: status.status,
      result: result.result,
    }
  });

  const vdom$ = state$.map(s => (
    <div>
      <div>
        <div>
          <button id="say" disabled={s.status === Status.ACTIVE}>
            Hey robot, tell me something interesting.
          </button>
          {s.status === Status.ACTIVE ? (
            <div>
              <small>(Try saying something to interrupt the speech)</small>
            </div>
          ) : null}
          {s.status === Status.SUCCEEDED ? (
            <div>The robot heard: "{s.result}"</div>
          ) : null}
        </div>
      </div>
    </div>
  ));

  return {
    DOM: vdom$,
    SpeechSynthesis: speechSynthesisAction.value,
    SpeechRecognition: speechRecognitionAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  SpeechRecognition: makeSpeechRecognitionDriver(),
  Time: timeDriver,
});

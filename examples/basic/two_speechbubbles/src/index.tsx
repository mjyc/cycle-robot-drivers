import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  TwoSpeechbubbles,
} from '@cycle-robot-drivers/face'


function main(sources) {
  const sbub$ = xs.create();
  window.onload = () => {
    setTimeout(() => {
      sbub$.shamefullySendNext({type: 'SET_MESSAGE', value: 'Hello'});
    }, 1);
    // test overwriting the current goal
    setTimeout(() => {
      sbub$.shamefullySendNext({type: 'SET_MESSAGE', value: 'World'});
    }, 500);
    // test canceling an active goal
    setTimeout(() => {sbub$.shamefullySendNext(null);}, 1000);
    // test calling cancel on done; cancel must do nothing
    setTimeout(() => {
      sbub$.shamefullySendNext({
        type: 'ASK_QUESTION',
        value: ['Hey', ['Hey']],
      });
    }, 1500);
    // you must click a button here
    setTimeout(() => {sbub$.shamefullySendNext(null);}, 4000);
  };

  const speechbubbles = TwoSpeechbubbles({
    goal: sbub$,
    DOM: sources.DOM,
  });

  speechbubbles.result.addListener({
    next: data => console.warn('result', data),
  });

  const vdom$ = speechbubbles.DOM.map((sdom) => {
    return (
      <div>
        {sdom}
      </div>
    );
  });

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
});

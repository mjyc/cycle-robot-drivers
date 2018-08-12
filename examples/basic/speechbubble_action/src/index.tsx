import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  IsolatedSpeechbubbleAction as SpeechbubbleAction,
} from '@cycle-robot-drivers/face'


function main(sources) {
  const sbub$ = xs.create();
  window.onload = () => {
    setTimeout(() => {
      sbub$.shamefullySendNext({type: 'MESSAGE', value: 'Hello'});
    }, 1);
    // test overwriting the current goal
    setTimeout(() => {
      sbub$.shamefullySendNext({type: 'MESSAGE', value: 'World!'});
    }, 100);
    // test canceling an active goal
    setTimeout(() => {sbub$.shamefullySendNext(null);}, 200);
    // test calling cancel on done; cancel must do nothing
    setTimeout(() => {
      sbub$.shamefullySendNext({type: 'CHOICE', value: ['Hello', 'World!']});
    }, 1000);
    // you must click a button here
    setTimeout(() => {sbub$.shamefullySendNext(null);}, 2000);
  };

  const speechbubbleAction = SpeechbubbleAction({
    goal: sbub$,
    DOM: sources.DOM,
  });

  speechbubbleAction.status.addListener({
    next: data => console.warn('status', data),
  });
  speechbubbleAction.result.addListener({
    next: data => console.warn('result', data),
  });

  const vdom$ = speechbubbleAction.DOM.map((speechbubble) => {
    return (
      <div>
        <div>SpeechbubbleAction component test</div>
        {speechbubble}
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

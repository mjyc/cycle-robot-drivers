import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeFacialExpressionActionDriver,
} from '@cycle-robot-drivers/screen'


function main(sources) {
  const vdom$ = sources.FacialExpressionAction.DOM.map((face) => {
    return (
      <div>
        <p>FacialExpressionAction driver test</p>
        {face}
      </div>
    );
  });

  const fexp$ = xs.create();
  window.onload = () => {
    setTimeout(() => fexp$.shamefullySendNext({type: 'happy'}), 1);
    // test overwriting the current goal
    setTimeout(() => fexp$.shamefullySendNext({type: 'sad'}), 100);
    // test canceling an active goal
    setTimeout(() => {fexp$.shamefullySendNext(null);}, 500);
    // test calling cancel on done; cancel must do nothing
    setTimeout(() => fexp$.shamefullySendNext({type: 'confused'}), 1000);
    setTimeout(() => fexp$.shamefullySendNext(null), 2500);
  };

  sources.FacialExpressionAction.result.addListener({
    next: data => console.warn('result', data),
  });
  sources.FacialExpressionAction.status.addListener({
    next: data => console.warn('status', data),
  });
  sources.FacialExpressionAction.ended.addListener({
    next: data => console.warn('ended', data),
  });

  return {
    DOM: vdom$,
    FacialExpressionAction: fexp$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  FacialExpressionAction: makeFacialExpressionActionDriver(),
});

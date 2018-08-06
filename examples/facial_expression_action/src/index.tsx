import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeFacialExpressionActionDriver,
} from '@cycle-robot-drivers/face'


function main(sources) {
  const vdom$ = sources.FacialExpressionAction.DOM.map((face) => {
    return (
      <div>
        {face}
      </div>
    );
  });
  const fexp$ = xs.create();
  setTimeout(() => {fexp$.shamefullySendNext({type: 'happy'});}, 1000);
  // // test overwriting the current goal
  // setTimeout(() => {fexp$.shamefullySendNext({});}, 100);
  // // test canceling an active goal
  // setTimeout(() => {fexp$.shamefullySendNext(null);}, 500);
  // // test calling cancel on done; cancel must do nothing
  // setTimeout(() => {fexp$.shamefullySendNext({});}, 1000);
  // // you must say something here
  // setTimeout(() => {fexp$.shamefullySendNext(null);}, 7000);

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

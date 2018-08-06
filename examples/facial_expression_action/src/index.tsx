import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
// import fromEvent from 'xstream/extra/fromEvent'
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
  window.onload = () => {
    setTimeout(() => fexp$.shamefullySendNext({type: 'happy'}), 1);
  };
  // const fexp$ = fromEvent(window, 'load').map(data => {
  //   // console.log();
  //   return {type: 'happy'};
  // });
  // setTimeout(() => fexp$.shamefullySendNext({type: 'happy'}), 1);
  // sources.DOM.select('.face').events('').addListener({
  //   next: data => console.warn('vdom', data),
  // });

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

import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeTabletFaceDriver,
  IsolatedFacialExpressionAction as FacialExpressionAction,
} from '@cycle-robot-drivers/screen'


function main(sources) {
  const vdom$ = sources.TabletFace.DOM.map((face) => {
    return (
      <div>
        <p>FacialExpressionAction component test</p>
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

  const facialExpressionAction = FacialExpressionAction({
    goal: fexp$,
    TabletFace: sources.TabletFace,
  });

  facialExpressionAction.result.addListener({
    next: data => console.warn('result', data),
  });
  facialExpressionAction.status.addListener({
    next: data => console.warn('status', data),
  });

  return {
    DOM: vdom$,
    TabletFace: facialExpressionAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver({faceHeight: '600px'}),
});

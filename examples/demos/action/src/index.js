import xs from 'xstream';
import delay from 'xstream/extra/delay';
import isolate from '@cycle/isolate';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {div, makeDOMDriver} from '@cycle/dom';
import {
  makeTabletFaceDriver,
  SpeechbubbleAction,
} from '@cycle-robot-drivers/screen';

function main(sources) {
  sources.state.stream.addListener({next: s => console.debug('reducer state', s)});

  const robotSpeechbubbleAction = isolate(SpeechbubbleAction, 'RobotSpeechbubbleAction')({
    state: sources.state,
    DOM: sources.DOM,
    goal: xs.of({goal_id: {stamp: Date.now(), id: `hsb`}, goal: 'ROBOT'}).compose(delay(1000)),
  });
  const humanSpeechbubbleAction = isolate(SpeechbubbleAction, 'HumanSpeechbubbleAction')({
    state: sources.state,
    DOM: sources.DOM,
    goal: xs.of({goal_id: {stamp: Date.now(), id: `hsb`}, goal: 'HUMAN'}).compose(delay(1000)),
  });


  // UI
  const vdom$ = xs.combine(
    robotSpeechbubbleAction.DOM.startWith(''),
    humanSpeechbubbleAction.DOM.startWith(''),
    sources.TabletFace.events('dom').startWith(''),
  ).map(vdoms => div(vdoms));

  const reducer = xs.merge(
    robotSpeechbubbleAction.state,
    humanSpeechbubbleAction.state,
  );
  return {
    DOM: vdom$,
    state: reducer,
  };
}

run(withState(main), {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver(),
});

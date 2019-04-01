import xs from 'xstream';
import delay from 'xstream/extra/delay';
import dropRepeats from 'xstream/extra/dropRepeats';
import isolate from '@cycle/isolate';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {div, makeDOMDriver} from '@cycle/dom';
import {
  makeTabletFaceDriver,
  SpeechbubbleAction,
} from '@cycle-robot-drivers/screen';

import {makeConcurrentAction, initGoal, isEqualResult} from '@cycle-robot-drivers/action';

const RaceAction = makeConcurrentAction(
  ['RobotSpeechbubblesAction', 'HumanSpeechbubblesAction'],
  true,
);

const selectActionResult = (actionName) =>
  (in$) => in$
    .filter(s => !!s
      && !!s[actionName]
      && !!s[actionName].outputs
      && !!s[actionName].outputs.result)
    .map(s => s[actionName].outputs.result)
    .compose(dropRepeats(isEqualResult));

function main(sources) {
  sources.state.stream.addListener({next: s => console.debug('reducer state', s)});

  const goal$ = xs.of(initGoal({
    goal_id: {goal_id: {stamp: Date.now(), id: `xxx`}, goal: 'ROBOT'},
    goal: {
      RobotSpeechbubblesAction: 'Robot',
      HumanSpeechbubblesAction: ['Yes', 'No'],
    },
  })).compose(delay(1000));
  const raceSinks = isolate(RaceAction, 'RaceAction')({
    goal: goal$,
    RobotSpeechbubblesAction: {result: sources.state.stream
      .compose(selectActionResult('RobotSpeechbubblesAction'))},
    HumanSpeechbubblesAction: {result: sources.state.stream
      .compose(selectActionResult('HumanSpeechbubblesAction'))},
    state: sources.state,
  });

  const robotSpeechbubbleAction = isolate(SpeechbubbleAction, 'RobotSpeechbubbleAction')({
    state: sources.state,
    DOM: sources.DOM,
    // goal: xs.of({goal_id: {stamp: Date.now(), id: `hsb`}, goal: 'ROBOT'}).compose(delay(1000)),
    goal: raceSinks.RobotSpeechbubblesAction,
  });
  const humanSpeechbubbleAction = isolate(SpeechbubbleAction, 'HumanSpeechbubbleAction')({
    state: sources.state,
    DOM: sources.DOM,
    // goal: xs.of({goal_id: {stamp: Date.now(), id: `hsb`}, goal: 'HUMAN'}).compose(delay(1000)),
    goal: raceSinks.HumanSpeechbubblesAction,
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
    raceSinks.state,
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

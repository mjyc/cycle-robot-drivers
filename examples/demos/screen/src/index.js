import xs from 'xstream';
import delay from 'xstream/extra/delay';
import sampleCombine from 'xstream/extra/sampleCombine';
import isolate from '@cycle/isolate';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {div, label, input, br, button, makeDOMDriver} from '@cycle/dom';
import {Status} from '@cycle-robot-drivers/action';
import {
  makeTabletFaceDriver,
  SpeechbubbleAction,
} from '@cycle-robot-drivers/screen';

function main(sources) {
  sources.state.stream.addListener({next: s => console.log('reducer state', s)});

  const speechbubbleActionResult = xs.create();
  const speechbubbles$ = xs.merge(
    xs.of({goal_id: `${new Date().getTime()}`, goal: 'Hello there!'})
      .compose(delay(1000)),
    xs.of({goal_id: `${new Date().getTime()}`, goal: ['Good', 'Bad']})
      .compose(delay(2000)),
    speechbubbleActionResult
      .debug()
      .filter(result => !!result.result)
      .map(result => {
        if (result.result === 'Good') {
          return {goal_id: `${new Date().getTime()}`, goal: ['Great', 'Bad']};
        } else if (result.result === 'Bad') {
          return {goal_id: `${new Date().getTime()}`, goal: 'Sorry to hear that...'};
        }
      }),
  );

  const speechbubbleAction = SpeechbubbleAction({
    state: sources.state,
    DOM: sources.DOM,
    goal: speechbubbles$,
    cancel: xs.never(),
  })
  speechbubbleActionResult.imitate(speechbubbleAction.result.debug());

  // // speech recognition
  // const recogGoal$ = sources.DOM.select('#listen').events('click')
  //   .mapTo({goal_id: `${new Date().getTime()}`, goal: {}});
  // const speechRecognitionAction = isolate(SpeechRecognitionAction)({
  //   state: sources.state,
  //   goal: recogGoal$,
  //   cancel: xs.never(),
  //   SpeechRecognition: sources.SpeechRecognition,
  // });
  // speechRecognitionAction.status.addListener({next: s =>
  //   console.log('SpeechRecognitionAction status', s)});


  // UI
  const vdom$ = xs.combine(
    speechbubbleAction.DOM.startWith(''),
    sources.TabletFace.DOM.startWith(''),
  ).map(vdoms => div(vdoms))

  const reducer = speechbubbleAction.state;
  return {
    DOM: vdom$,
    state: reducer,
  };
}

run(withState(main), {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver(),
});

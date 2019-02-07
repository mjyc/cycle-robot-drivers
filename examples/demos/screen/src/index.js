import xs from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import isolate from '@cycle/isolate';
import {run} from '@cycle/run';
import {withState} from '@cycle/state';
import {div, label, input, br, button, makeDOMDriver} from '@cycle/dom';
import {Status} from '@cycle-robot-drivers/action';
import {
  makeTabletFaceDriver,
} from '@cycle-robot-drivers/screen';

function main(sources) {
  sources.state.stream.addListener({next: s => console.log('reducer state', s)});

  // // speech synthesis
  // const say$ = sources.DOM.select('.say').events('click');
  // const inputText$ = sources.DOM
  //   .select('.inputtext').events('input')
  //   .map(ev => ev.target.value)
  //   .startWith('');
  // const synthGoal$ = say$.compose(sampleCombine(inputText$))
  //   .filter(([_, text]) => !!text)
  //   .map(([_, text]) => ({goal_id: `${new Date().getTime()}`, goal: text}));
  // const speechSynthesisAction = isolate(SpeechSynthesisAction)({
  //   state: sources.state,
  //   goal: synthGoal$,
  //   cancel: xs.never(),
  //   SpeechSynthesis: sources.SpeechSynthesis,
  // });
  // speechSynthesisAction.status.addListener({next: s =>
  //   console.log('SpeechSynthesisAction status', s)});

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
  const vdom$ = xs.of(div('hello there!'));

  const reducer = xs.never();
  return {
    DOM: vdom$,
    state: reducer,
  };
}

run(withState(main), {
  DOM: makeDOMDriver('#app'),
  TabletFace: makeTabletFaceDriver(),
});

// import xs from 'xstream';
import {Stream} from 'xstream';
// import {div, DOMSource, VNode} from '@cycle/dom';
// import isolate from '@cycle/isolate';
import {StateSource, Reducer} from '@cycle/state';
// import {Result, EventSource, isEqual, Status} from '@cycle-robot-drivers/action';
import {
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';
import {AudioPlayerAction} from '@cycle-robot-drivers/sound';
import {
  SpeechSynthesisAction,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import {selectActionResult} from '@cycle-robot-drivers/actionbank';
import {initializeDrivers} from './initializeDrivers';

export function withRobotActions(main) {
  return (sources) => {
    const state$ = sources.state.stream;
    const twoSpeechbubblesResult$ = state$
      .compose(selectActionResult('TwoSpeechbubblesAction'));
    const speechSynthesisResult$ = state$
      .compose(selectActionResult('SpeechSynthesisAction'));
    const speechRecognitionResult$ = state$
      .compose(selectActionResult('SpeechRecognitionAction'));

    const mainSinks: any = main({
      ...sources,
      TwoSpeechbubblesAction: {result: twoSpeechbubblesResult$},
      SpeechSynthesisAction: {result: speechSynthesisResult$},
      SpeechRecognitionAction: {result: speechRecognitionResult$},
      state: sources.state,
    });

    // Define Actions
    const twoSpeechbubblesAction: TWASinks = TwoSpeechbubblesAction({
      goal: mainSinks.TwoSpeechSynthesisAction || xs.never(),
      DOM: sources.DOM,
    });
    const speechSynthesisAction: SSSinks = SpeechSynthesisAction({
      goal: mainSinks.SpeechSynthesisAction || xs.never(),
      SpeechSynthesis: sources.SpeechSynthesis,
    });
    const speechRecognitionAction: SRSinks = SpeechRecognitionAction({
      goal: mainSinks.SpeechRecognitionAction || xs.never(),
      SpeechRecognition: sources.SpeechRecognition,
    });

    // Define Reducers
    const parentReducer$: Stream<Reducer<State>> = xs.merge(
      twoSpeechbubblesAction.result.map(result =>
        prev => ({...prev, TwoSpeechbubblesAction: {outputs: {result}}})),
      speechSynthesisAction.result.map(result =>
        prev => ({...prev, SpeechSynthesisAction: {outputs: {result}}})),
      speechRecognitionAction.result.map(result =>
        prev => ({...prev, SpeechRecognitionAction: {outputs: {result}}})),
    );
    const childReducer$: Stream<Reducer<State>> = mainSinks.state;
    const reducer$ = xs.merge(parentReducer$, childReducer$);


    // Define Sinks
    const vdom$ = xs.combine(
      twoSpeechbubblesAction.DOM,
      sources.TabletFace.DOM,
    ).map(([speechbubbles, face]) =>
      div({
        style: {position: 'relative'}
      }, [speechbubbles, face])
    );

    // update here, allow user to define theri own outputs (if they want)
    return {
      DOM: vdom$,
      SpeechSynthesis: speechSynthesisAction.output,
      SpeechRecognition: speechRecognitionAction.output,
      state: reducer$,
    };
  }
}

export function runRobotProgramV2(
  main,
  drivers?,
  options?,
) {
  if (!main) {
    throw new Error('Must pass the argument main');
  }

  return run(
    // withState(withActions(main, options)),
    main,
    initializeDrivers(drivers),
  );
};

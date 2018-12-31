import xs from 'xstream';
import {Stream} from 'xstream';
import dropRepeats from "xstream/extra/dropRepeats";
import {div} from '@cycle/dom';
import {withState} from '@cycle/state';
import {run} from '@cycle/run';
import {Result, isEqualResult} from '@cycle-robot-drivers/action';
import {
  FacialExpressionAction,
  IsolatedTwoSpeechbubblesAction as TwoSpeechbubblesAction,
} from '@cycle-robot-drivers/screen';
import {AudioPlayerAction} from '@cycle-robot-drivers/sound';
import {
  SpeechSynthesisAction,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import {initializeDrivers} from './initializeDrivers';

const selectActionResult = (actionName: string) =>
  (in$: Stream<any>): Stream<Result> => in$
    .filter(s => !!s
      && !!s[actionName]
      && !!s[actionName].outputs
      && !!s[actionName].outputs.result)
    .map(s => s[actionName].outputs.result)
    .compose(dropRepeats(isEqualResult));

export function withRobotActions(
  main,
  options?: {
    hidePoseViz?: boolean
  }
) {
  if (!main) {
    throw new Error('Must pass the argument main');
  }
  if (!options) {
    options = {};
  }

  const mainWithRobotActions = (sources) => {
    const state$ = sources.state.stream;
    const facialExpressionResult$ = state$
      .compose(selectActionResult('FacialExpression'));
    const twoSpeechbubblesResult$ = state$
      .compose(selectActionResult('TwoSpeechbubblesAction'));
    const audioPlayerResult$ = state$
      .compose(selectActionResult('AudioPlayer'));
    const speechSynthesisResult$ = state$
      .compose(selectActionResult('SpeechSynthesisAction'));
    const speechRecognitionResult$ = state$
      .compose(selectActionResult('SpeechRecognitionAction'));

    // Call main
    const mainSinks: any = main({
      ...sources,
      FacialExpressionAction: {result: facialExpressionResult$},
      TwoSpeechbubblesAction: {result: twoSpeechbubblesResult$},
      AudioPlayerAction: {result: audioPlayerResult$},
      SpeechSynthesisAction: {result: speechSynthesisResult$},
      SpeechRecognitionAction: {result: speechRecognitionResult$},
      state: sources.state,
    });

    // Define actions
    const facialExpressionAction: any = FacialExpressionAction({
      goal: mainSinks.FacialExpressionAction || xs.never(),
      TabletFace: sources.TabletFace,
    });
    const twoSpeechbubblesAction: any = TwoSpeechbubblesAction({
      goal: mainSinks.TwoSpeechbubblesAction || xs.never(),
      DOM: sources.DOM,
    });
    const audioPlayerAction: any = AudioPlayerAction({
      goal: mainSinks.AudioPlayerAction || xs.never(),
      AudioPlayer: sources.AudioPlayer,
    });
    const speechSynthesisAction: any = SpeechSynthesisAction({
      goal: mainSinks.SpeechSynthesisAction || xs.never(),
      SpeechSynthesis: sources.SpeechSynthesis,
    });
    const speechRecognitionAction: any = SpeechRecognitionAction({
      goal: mainSinks.SpeechRecognitionAction || xs.never(),
      SpeechRecognition: sources.SpeechRecognition,
    });

    // Define reducers
    const parentReducer$: any = xs.merge(
      facialExpressionAction.result.map(result =>
        prev => ({...prev, FacialExpressionAction: {outputs: {result}}})),
      twoSpeechbubblesAction.result.map(result =>
        prev => ({...prev, TwoSpeechbubblesAction: {outputs: {result}}})),
      audioPlayerAction.result.map(result =>
        prev => ({...prev, AudioPlayerAction: {outputs: {result}}})),
      speechSynthesisAction.result.map(result =>
        prev => ({...prev, SpeechSynthesisAction: {outputs: {result}}})),
      speechRecognitionAction.result.map(result =>
        prev => ({...prev, SpeechRecognitionAction: {outputs: {result}}})),
    );
    const childReducer$: any = mainSinks.state || xs.never();
    const reducer$ = xs.merge(parentReducer$, childReducer$);

    // Define sinks
    const vdom$ = xs.combine(
      twoSpeechbubblesAction.DOM,
      sources.TabletFace.DOM,
      sources.PoseDetection.DOM
    ).map(([speechbubbles, face, poseDetectionViz]) => {
      (poseDetectionViz as any).data.style.display = options.hidePoseViz
        ? 'none' : 'block';
      return div({
        style: {position: 'relative'}
      }, [speechbubbles, face, poseDetectionViz]);
    });
    const tablet$ = !!mainSinks.TabletFace
      ? mainSinks.TabletFace : facialExpressionAction.output;
    const audio$ = !!mainSinks.AudioPlayer
      ? mainSinks.AudioPlayer : audioPlayerAction.output;
    const synth$ = !!mainSinks.SpeechSynthesis
      ? mainSinks.SpeechSynthesis : speechSynthesisAction.output;
    const recog$ = !!mainSinks.SpeechRecognition
      ? mainSinks.SpeechRecognition : speechRecognitionAction.output;

    return {
      ...mainSinks,
      DOM: vdom$,
      TabletFace: tablet$,
      AudioPlayer: audio$,
      SpeechSynthesis: synth$,
      SpeechRecognition: recog$,
      state: reducer$,
    };
  }

  return mainWithRobotActions;
}

/**
 * A wrapper function of [Cycle.js run](https://cycle.js.org/api/run.html#api-runmain-drivers)
 *   function for a TabletFace robot.
 *
 * @param main A function that takes incoming streams as `sources` and returns
 *   outgoing streams as sinks. By default, the following action components
 *
 *     * [FacialExpressionAction](../screen)
 *     * [AudioPlayerAction](../sound)
 *     * [TwoSpeechbubblesAction](../screen)
 *     * [SpeechSynthesisAction](../speech)
 *     * [SpeechRecognitionAction](../speech)
 *
 *   are can used used like drivers, i.e., catch incoming message via
 *   `sources.FacialExpressionAction` and send outgoing message via
 *   `return { FacialExpressionAction: xs.of(null) };`, as well as six drivers
 *   listed below.
 *
 * @param drivers A collection of [Cycle.js drivers](). By default, `drivers` is
 *   set to an object containing:
 *
 *     * [DOM](https://cycle.js.org/api/dom.html)
 *     * [TabletFace](../screen)
 *     * [AudioPlayer](../sound)
 *     * [SpeechSynthesis](../speech#)
 *     * [SpeechRecognition](../speech)
 *     * [PoseDetection](../3rdparty/cycle-posenet-driver)
 *
 *   drivers.
 */
export function runRobotProgram(
  main,
  drivers?,
  options?,
) {
  if (!main) {
    throw new Error('Must pass the argument main');
  }

  return run(
    withState(withRobotActions(main, options) as any),
    initializeDrivers(drivers),
  );
};

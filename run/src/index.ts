import xs from 'xstream';
import {div} from '@cycle/dom';
import {withState} from '@cycle/state';
import isolate from '@cycle/isolate';
import {run} from '@cycle/run';
import {selectActionResult} from '@cycle-robot-drivers/action';
import {
  FacialExpressionAction,
  makeSpeechbubbleAction,
} from '@cycle-robot-drivers/screen';
import {AudioPlayerAction} from '@cycle-robot-drivers/sound';
import {
  SpeechSynthesisAction,
  SpeechRecognitionAction,
} from '@cycle-robot-drivers/speech';
import {
  initializeTabletFaceRobotDrivers
} from './initializeTabletFaceRobotDrivers';
export {
  initializeTabletFaceRobotDrivers
} from './initializeTabletFaceRobotDrivers';

export function withTabletFaceRobotActions(
  main,
  {
    hidePoseViz = false,
    speechbubbles = {},
  }: {
    hidePoseViz?: boolean,
    speechbubbles?: object,
  } = {},
) {
  if (!main) {
    throw new Error('Must pass the argument main');
  }

  const mainWithRobotActions = (sources) => {
    const state$ = sources.state.stream;
    const facialExpressionResult$ = state$
      .compose(selectActionResult('FacialExpression'));
    const robotSpeechbubbleResult$ = state$
      .compose(selectActionResult('RobotSpeechbubbleAction'));
    const humanSpeechbubbleResult$ = state$
      .compose(selectActionResult('HumanSpeechbubbleAction'));
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
      RobotSpeechbubbleAction: {result: robotSpeechbubbleResult$},
      HumanSpeechbubbleAction: {result: humanSpeechbubbleResult$},
      AudioPlayerAction: {result: audioPlayerResult$},
      SpeechSynthesisAction: {result: speechSynthesisResult$},
      SpeechRecognitionAction: {result: speechRecognitionResult$},
      state: sources.state,
    });

    // Define actions
    const SpeechbubbleAction = makeSpeechbubbleAction(speechbubbles);
    const defaultActionInputStreams = {
      goal: xs.never(),
      cancel: xs.never(),
    };

    const facialExpressionAction: any = isolate(
      FacialExpressionAction, 'FacialExpressionAction'
    )({
      ...defaultActionInputStreams,
      ...mainSinks.FacialExpressionAction,
      state: sources.state,
      TabletFace: sources.TabletFace,
    });
    const robotSpeechbubbleAction = isolate(
      SpeechbubbleAction, 'RobotSpeechbubbleAction'
    )({
      ...defaultActionInputStreams,
      ...mainSinks.RobotSpeechbubbleAction,
      state: sources.state,
      DOM: sources.DOM,
    });
    const humanSpeechbubbleAction = isolate(
      SpeechbubbleAction, 'HumanSpeechbubbleAction'
    )({
      ...defaultActionInputStreams,
      ...mainSinks.HumanSpeechbubbleAction,
      state: sources.state,
      DOM: sources.DOM,
    });
    const audioPlayerAction: any = isolate(
      AudioPlayerAction, 'AudioPlayerAction'
    )({
      ...defaultActionInputStreams,
      ...mainSinks.AudioPlayerAction,
      state: sources.state,
      AudioPlayer: sources.AudioPlayer,
    });
    const speechSynthesisAction: any = isolate(
      SpeechSynthesisAction, 'SpeechSynthesisAction'
    )({
      ...defaultActionInputStreams,
      ...mainSinks.SpeechSynthesisAction,
      state: sources.state,
      SpeechSynthesis: sources.SpeechSynthesis,
    });
    const speechRecognitionAction: any = isolate(
      SpeechRecognitionAction, 'SpeechRecognitionAction'
    )({
      ...defaultActionInputStreams,
      ...mainSinks.SpeechRecognitionAction,
      state: sources.state,
      SpeechRecognition: sources.SpeechRecognition,
    });


    // Define sinks
    const vdom$ = !!mainSinks.DOM
      ? mainSinks.DOM
      : xs.combine(
          robotSpeechbubbleAction.DOM,
          humanSpeechbubbleAction.DOM,
          sources.TabletFace.DOM,
          sources.PoseDetection.DOM
        ).map((vdoms) => {
          (vdoms[1] as any).data.style.display = hidePoseViz
            ? 'none' : 'block';
          return div({
            style: {position: 'relative'}
          }, vdoms as any);
        });
    const tabletFace$ = !!mainSinks.TabletFace
      ? mainSinks.TabletFace
      : xs.merge(
        sources.TabletFace.events('load').mapTo({
          type: 'START_BLINKING',
          value: {maxInterval: 10000}
        }),
        facialExpressionAction.TabletFace,
      );
    // define reducer stream
    const reducer$: any = xs.merge(
      facialExpressionAction.state,
      audioPlayerAction.state,
      speechSynthesisAction.state,
      speechRecognitionAction.state,
      mainSinks.state || xs.never(),
    );

    return {
      DOM: vdom$,
      TabletFace: tabletFace$,
      AudioPlayer: audioPlayerAction.AudioPlayer,
      SpeechSynthesis: speechSynthesisAction.SpeechSynthesis,
      SpeechRecognition: speechRecognitionAction.SpeechRecognition,
      ...mainSinks,
      state: reducer$,
    };
  }

  return mainWithRobotActions;
}

/**
 * A wrapper function of [Cycle.js run](https://cycle.js.org/api/run.html#api-runmain-drivers)
 *   function for Tabletface robot.
 *
 * @param main A function that takes incoming streams as `sources` and returns
 *   outgoing streams as sinks. By default, the following action components
 *
 *     * [FacialExpressionAction](../screen)
 *     * [AudioPlayerAction](../sound)
 *     * [SpeechbubbleAction](../screen)
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
 *     * [SpeechSynthesis](../speech)
 *     * [SpeechRecognition](../speech)
 *     * [PoseDetection](../3rdparty/cycle-posenet-driver)
 *
 *   drivers.
 */
export function runTabletFaceRobotApp(
  main,
  drivers?,
  options?,
) {
  if (!main) {
    throw new Error('Must pass the argument main');
  }

  return run(
    withState(withTabletFaceRobotActions(main, options) as any),
    {
      ...initializeTabletFaceRobotDrivers(),
      ...drivers,
    },
  );
};

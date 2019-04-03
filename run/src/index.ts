import xs from 'xstream';
import {div, span} from '@cycle/dom';
import {withState} from '@cycle/state';
import isolate from '@cycle/isolate';
import {run} from '@cycle/run';
import {selectActionResult} from '@cycle-robot-drivers/action';
import {
  FacialExpressionAction,
  createSpeechbubbleAction,
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
    styles = {},
  }: {
    hidePoseViz?: boolean,
    styles?: {
      speechbubblesOuter?: object,
      speechbubbleOuter?: object,
      robotSpeechbubble?: object,
      humanSpeechbubble?: object,
    },
  } = {},
) {
  if (!main) {
    throw new Error('Must pass the argument main');
  }

  styles = {
    speechbubblesOuter: {
      position: 'absolute',
      width: '96vw',
      zIndex: 3,  // eyelid has zIndex of 2
      margin: '2vw',
      backgroundColor: 'white',
      border: '0.2vmin solid lightgray',
      borderRadius: '3vmin 3vmin 3vmin 3vmin',
      ...styles.speechbubblesOuter,
    },
    speechbubbleOuter: {
      margin: 0,
      padding: '1em',
      maxWidth: '100%',
      textAlign: 'center',
      ...styles.speechbubbleOuter,
    },
  }


  const mainWithRobotActions = (sources) => {

    // Call main
    const state$ = sources.state.stream;
    const mainSinks: any = main({
      ...sources,
      FacialExpressionAction: {
        result: state$.compose(selectActionResult('FacialExpression'))
      },
      RobotSpeechbubbleAction: {
        result: state$.compose(selectActionResult('RobotSpeechbubbleAction'))
      },
      HumanSpeechbubbleAction: {
        result: state$.compose(selectActionResult('HumanSpeechbubbleAction'))
      },
      AudioPlayerAction: {
        result: state$.compose(selectActionResult('AudioPlayer'))
      },
      SpeechSynthesisAction: {
        result: state$.compose(selectActionResult('SpeechSynthesisAction'))
      },
      SpeechRecognitionAction: {
        result: state$.compose(selectActionResult('SpeechRecognitionAction'))
      },
      state: sources.state,
    });


    // Define actions
    const RobotSpeechbubbleAction = createSpeechbubbleAction(styles.robotSpeechbubble);
    const HumanSpeechbubbleAction = createSpeechbubbleAction(styles.humanSpeechbubble);

    const facialExpressionAction: any = isolate(
      FacialExpressionAction, 'FacialExpressionAction'
    )({
      ...mainSinks.FacialExpressionAction,
      state: sources.state,
      TabletFace: sources.TabletFace,
    });
    const robotSpeechbubbleAction: any = isolate(
      RobotSpeechbubbleAction, 'RobotSpeechbubbleAction'
    )({
      ...mainSinks.RobotSpeechbubbleAction,
      state: sources.state,
      DOM: sources.DOM,
    });
    const humanSpeechbubbleAction: any = isolate(
      HumanSpeechbubbleAction, 'HumanSpeechbubbleAction'
    )({
      ...mainSinks.HumanSpeechbubbleAction,
      state: sources.state,
      DOM: sources.DOM,
    });
    const audioPlayerAction: any = isolate(
      AudioPlayerAction, 'AudioPlayerAction'
    )({
      ...mainSinks.AudioPlayerAction,
      state: sources.state,
      AudioPlayer: sources.AudioPlayer,
    });
    const speechSynthesisAction: any = isolate(
      SpeechSynthesisAction, 'SpeechSynthesisAction'
    )({
      ...mainSinks.SpeechSynthesisAction,
      state: sources.state,
      SpeechSynthesis: sources.SpeechSynthesis,
    });
    const speechRecognitionAction: any = isolate(
      SpeechRecognitionAction, 'SpeechRecognitionAction'
    )({
      ...mainSinks.SpeechRecognitionAction,
      state: sources.state,
      SpeechRecognition: sources.SpeechRecognition,
    });


    // Define sinks
    const speechbubblesVdom$ = xs.combine(
      robotSpeechbubbleAction.DOM.startWith(''),
      humanSpeechbubbleAction.DOM.startWith(''),
    ).map(([robotVTree, humanVTree]) =>
      (robotVTree === '' &&  humanVTree === '')
      ? ''
      : (robotVTree !== '' &&  humanVTree === '')
      ? div({style: styles.speechbubblesOuter}, [
        div({style: styles.speechbubbleOuter}, [span(robotVTree)])
      ])
      : (robotVTree !== '' &&  humanVTree === '')
      ? div({style: styles.speechbubblesOuter}, [
        div({style: styles.speechbubbleOuter}, [span(humanVTree)])
      ])
      : div({style: styles.speechbubblesOuter}, [
        div({style: styles.speechbubbleOuter}, [span(robotVTree)]),
        div({style: styles.speechbubbleOuter}, [span(humanVTree)]),
      ])
    );

    const vdom$ = !!mainSinks.DOM
      ? mainSinks.DOM
      : xs.combine(
          speechbubblesVdom$.startWith(''),
          sources.TabletFace.events('dom').startWith(''),
          sources.PoseDetection.events('dom').startWith(''),
        ).map((vdoms) => {
          if (vdoms[2] !== '') {
            (vdoms[2] as any).data.style.display = hidePoseViz
            ? 'none' : 'block';
          }
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
      robotSpeechbubbleAction.state,
      humanSpeechbubbleAction.state,
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
 * A wrapper function of [Cycle.js run](https://cycle.js.org/api/run.html#api-runmain-drivers) function for Tabletface robot.
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
 *   `return { FacialExpressionAction: {goal: xs.of({...}), cancel: xs.never()} };`, as well as six drivers listed below.
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

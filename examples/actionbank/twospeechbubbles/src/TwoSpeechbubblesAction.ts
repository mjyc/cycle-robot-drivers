import xs from 'xstream';
import {div, span} from '@cycle/dom';
import isolate from '@cycle/isolate';
import {
  createConcurrentAction, selectActionResult
} from '@cycle-robot-drivers/action';
import {createSpeechbubbleAction} from '@cycle-robot-drivers/screen';

export function createTwoSpeechbubblesAction({
  styles = {},
}: {
  styles?: {
    speechbubblesOuter?: object,
    speechbubbleOuter?: object,
    robotSpeechbubble?: object,
    humanSpeechbubble?: object,
  }
} = {}) {
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
  };

  const RobotSpeechbubbleAction =
      createSpeechbubbleAction(styles.robotSpeechbubble);
  const HumanSpeechbubbleAction =
      createSpeechbubbleAction(styles.humanSpeechbubble);

  const TwoSpeechbubbles = (sources) => {
    sources.state.stream.addListener({next: s => console.debug('reducer state', s)})

    const robotSpeechbubbleAction: any = isolate(
      RobotSpeechbubbleAction, 'RobotSpeechbubbleAction'
    )({
      ...sources.RobotSpeechbubbleAction,
      state: sources.state,
      DOM: sources.DOM,
    });
    const humanSpeechbubbleAction: any = isolate(
      HumanSpeechbubbleAction, 'HumanSpeechbubbleAction'
    )({
      ...sources.HumanSpeechbubbleAction,
      state: sources.state,
      DOM: sources.DOM,
    });

    const vdom$ = xs.combine(
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

    return {
      DOM: vdom$,
    };
  };

  return TwoSpeechbubbles;
}
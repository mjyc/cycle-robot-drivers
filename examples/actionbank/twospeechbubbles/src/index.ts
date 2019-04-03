import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {makeDOMDriver} from '@cycle/dom';
import {withState} from '@cycle/state';
import {run} from '@cycle/run';
import {selectActionResult} from '@cycle-robot-drivers/action';
import {TwoSpeechbubbles} from '@cycle-robot-drivers/actionbank';


function main(sources) {
  sources.state.stream.addListener({next: s => console.debug('reducer state', s)});

  const TwoSpeechbubblesRaceAction = {result: sources.state.stream
      .compose(selectActionResult('TwoSpeechbubblesRaceAction'))};

  // "main" component
  const sinks: any = TwoSpeechbubbles({
    state: sources.state,
    TwoSpeechbubblesAllAction: {
      goal: TwoSpeechbubblesRaceAction.result.mapTo({
        RobotSpeechbubbleAction: 'Have a good day!',
        HumanSpeechbubbleAction: '',
      }),
      cancel: xs.never(),
    },
    TwoSpeechbubblesRaceAction: {
      goal: xs.of({
        RobotSpeechbubbleAction: 'Hello!',
        HumanSpeechbubbleAction: ['Hi'],
      }).compose(delay(1000)),
      cancel: xs.never(),
    },
    DOM: sources.DOM,
  });

  return {
    DOM: sinks.DOM,
    state: sinks.state,
  };
}


run(withState(main), {
  DOM: makeDOMDriver('#app'),
});
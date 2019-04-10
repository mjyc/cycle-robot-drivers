import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {withState} from '@cycle/state';
import {run} from '@cycle/run';
import {timeDriver} from '@cycle/time';
import {SleepAction} from './SleepAction';


function main(sources) {
  sources.state.stream.addListener({next: s => console.debug('reducer state', s)});

  const sleepAction = SleepAction({
    state: sources.state,
    goal: xs.of(1000).compose(delay(1000)) as any,
    Time: sources.Time,
  });

  return  {
    state: sleepAction.state,
  }
};

run(withState(main), {
  Time: timeDriver,
});
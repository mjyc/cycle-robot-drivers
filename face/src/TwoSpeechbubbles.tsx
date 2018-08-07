import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';
import {IsolatedSpeechbubbleAction} from './SpeechbubbleAction'

export function TwoSpeechbubbles(sources) {
  const robot = IsolatedSpeechbubbleAction(sources);
  const human = IsolatedSpeechbubbleAction(sources);

  return {
    DOM: adapt(xs.combine(robot.DOM, human.DOM).map(([rdom, hdom]) => (
      <div>
        <div>
          <span>Robot:</span> {rdom}
        </div>
        <div>
          <span>Human:</span> {hdom}
        </div>
      </div>
    ))),
    status: adapt(robot.status),
    result: adapt(robot.result),
  };
}

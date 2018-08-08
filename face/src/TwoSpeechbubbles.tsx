import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {initGoal, generateGoalID} from '@cycle-robot-drivers/action'
import {IsolatedSpeechbubbleAction} from './SpeechbubbleAction'

export function TwoSpeechbubbles(sources) {

  const goals$ = sources.goal.map(goal => {
    const goal_id = generateGoalID();
    switch (goal.type) {
      case 'DISPLAY_MESSAGE':
        return [{
          goal_id,
          goal: {
            type: 'message',
            value: goal.value,
          },
        }, null];
      case 'ASK_QUESTION':
        return [{
          goal_id,
          goal: {
            type: 'message',
            value: goal.value[0],
          },
        }, {
          goal_id,
          goal: {
            type: 'choices',
            value: goal.value[1],
          },
        }];
    }
  });

  const firstSources = {
    ...sources,
    goal: goals$.map(goal => goal[0]),
  };
  const secondSource = {
    ...sources,
    goal: goals$.map(goal => goal[1]),
  };
  const firstSink = IsolatedSpeechbubbleAction(firstSources);
  const secondSink = IsolatedSpeechbubbleAction(secondSource);

  return {
    DOM: adapt(xs.combine(firstSink.DOM, secondSink.DOM).map(([fdom, sdom]) => (
      <div>
        <div>
          <span>Robot:</span> {fdom}
        </div>
        <div>
          <span>Human:</span> {sdom}
        </div>
      </div>
    ))),
    status: adapt(firstSink.status),
    result: adapt(firstSink.result),
  };
}

import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {Status, initGoal, generateGoalID} from '@cycle-robot-drivers/action'
import {IsolatedSpeechbubbleAction} from './SpeechbubbleAction'

export function TwoSpeechbubbles(sources) {

  // IDEA: map each goal field from a stream created from sources.map()

  // define a type for goal
  const firstSources = {
    ...sources,
    goal: sources.goal.map(goal => {
      switch (goal.type) {
        case 'DISPLAY_MESSAGE':
          return initGoal({type: 'message', value: goal.value});
        case 'ASK_QUESTION':
          return initGoal({type: 'message', value: goal.value[0]});
      }
    }),
  };

  const secondSource = {
    ...sources,
    goal: sources.goal.map(goal => {
      switch (goal.type) {
        case 'DISPLAY_MESSAGE':
          return null;
        case 'ASK_QUESTION':
          return initGoal({type: 'choices', value: goal.value[1]});
      }
    }),
  };

  const firstSink = IsolatedSpeechbubbleAction(firstSources);
  const secondSink = IsolatedSpeechbubbleAction(secondSource);

  // IDEA: if the result matches with the current goal_id, return them
  // combine([goal$, firstSink, secondSink]) and then filter to get "result"

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

import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {initGoal, generateGoalID} from '@cycle-robot-drivers/action'
import {IsolatedSpeechbubbleAction} from './SpeechbubbleAction'

export function TwoSpeechbubbles(sources) {

  // define a type for goal
  const firstSources = {
    ...sources,
    goal: sources.goal.map(goal => {
      switch (goal.type) {
        case 'DISPLAY_MESSAGE':
          return {type: 'message', value: goal.value};
        case 'ASK_QUESTION':
          return {type: 'message', value: goal.value[0]};
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
          return {type: 'choices', value: goal.value[1]};
      }
    }),
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

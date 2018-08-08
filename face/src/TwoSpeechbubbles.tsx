import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {Status, initGoal, generateGoalID} from '@cycle-robot-drivers/action'
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
        }, null, goal.type];
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
        }, goal.type];
    }
  });
  const firstGoal$ = goals$.map(goal => goal[0]);
  const secondGoal$ = goals$.map(goal => goal[1]);
  const type$ = goals$.map(goal => goal[2]);

  const firstSources = {
    ...sources,
    goal: firstGoal$,
  };
  const secondSource = {
    ...sources,
    goal: secondGoal$,
  };
  const firstSink = IsolatedSpeechbubbleAction(firstSources);
  const secondSink = IsolatedSpeechbubbleAction(secondSource);

  const result$ = xs.merge(
    xs.combine(type$, firstGoal$, firstSink.status)
      .map(([type, goal, status]) => {
        if (type === 'DISPLAY_MESSAGE'
          && (goal as any).goal_id.id === (status as any).goal_id.id
          && (status as any).status === Status.ACTIVE) {
          return {
            status,
            result: true,
          }
        }
      }),
    xs.combine(type$, secondGoal$, secondSink.result)
      .map(([type, goal, result]) => {
        if (type === "ASK_QUESTION"
          && (goal as any).goal_id.id === (result as any).status.goal_id.id
          && ((result as any).status.status === Status.SUCCEEDED
              || (result as any).status.status === Status.PREEMPTED
              || (result as any).status.status === Status.ABORTED)) {
          return result;
        }
      }),
  ).filter(result => !!result);

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
    result: adapt(result$),
  };
}

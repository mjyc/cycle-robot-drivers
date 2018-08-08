import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import pairwise from 'xstream/extra/pairwise'
import {adapt} from '@cycle/run/lib/adapt'
import isolate from '@cycle/isolate';

import {Status, initGoal, generateGoalID} from '@cycle-robot-drivers/action'
import {IsolatedSpeechbubbleAction} from './SpeechbubbleAction'

export function TwoSpeechbubbles(sources) {
  // Process incoming streams
  const goals$ = sources.goal.map(goal => {
    if (!goal) {
      return [null, null, null];
    }
    const goal_id = generateGoalID();
    switch (goal.type) {
      case 'SET_MESSAGE':
        return [{
          goal_id,
          goal: {
            type: 'MESSAGE',
            value: goal.value,
          },
        }, null, goal.type];
      case 'ASK_QUESTION':
        return [{
          goal_id,
          goal: {
            type: 'MESSAGE',
            value: goal.value[0],
          },
        }, {
          goal_id,
          goal: {
            type: 'CHOICE',
            value: goal.value[1],
          },
        }, goal.type];
    }
  });

  // Create sub-components
  const firstSources = {
    ...sources,
    goal: goals$.map(goal => {
      return goal[0];
    }),
  };
  const secondSource = {
    ...sources,
    goal: goals$.map(goal => goal[1]),
  };
  const firstSink = IsolatedSpeechbubbleAction(firstSources);
  const secondSink = IsolatedSpeechbubbleAction(secondSource);

  // Prepare outgoing streams
  const result$ = xs.merge(
    xs.combine(goals$, firstSink.status)
      .map(([goals, status]) => {
        if (goals[2] === 'SET_MESSAGE'
            && (goals[0] as any).goal_id.id === (status as any).goal_id.id
            && (status as any).status === Status.ACTIVE) {
          return {
            status,
            result: true,
          }
        }
      }),
    xs.combine(goals$.compose(pairwise), secondSink.result)
      .map(([pair, result]) => {
        const [prevGoals, curGoals] = (pair as [any, any]);
        const curGoalType = curGoals[2];
        if ((!curGoalType  // cancel (null) case
             && (prevGoals[1] as any).goal_id.id === (result as any).status.goal_id.id
             && (result as any).status.status === Status.PREEMPTED)
            || (curGoalType === 'ASK_QUESTION'
                && (curGoals[1] as any).goal_id.id === (result as any).status.goal_id.id
                && ((result as any).status.status === Status.SUCCEEDED
                    || (result as any).status.status === Status.PREEMPTED
                    || (result as any).status.status === Status.ABORTED))) {
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
    result: adapt(result$),
  };
}

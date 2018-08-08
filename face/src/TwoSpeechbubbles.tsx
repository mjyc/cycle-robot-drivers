import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
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
      case 'DISPLAY_MESSAGE':
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
  const firstGoal$ = goals$.map(goal => goal[0]);
  // const secondGoal$ = goals$.map(goal => goal[1]);
  const secondGoal$ = xs.of(null);
  const type$ = goals$.map(goal => goal[2]);

  // Create sub-components
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

  // // IMPORTANT! Without this, error occurs
  // type$.addListener({
  //   next: data => {},
  // });

  type$.addListener({
    next: data => {console.error('type$', data);},
  });
  firstGoal$.addListener({
    next: data => {console.error('firstGoal$', data);},
  });
  firstSink.result.addListener({
    next: data => {console.error('firstSink.result', data);},
  });

  // Prepare outgoing streams
  const result$ = xs.merge(
    // xs.combine(type$, firstGoal$, firstSink.status)
    xs.combine(type$, firstGoal$, firstSink.result)
      .map(([type, goal, result]) => {
        if (type === 'DISPLAY_MESSAGE'
            && (goal as any).goal_id.id === (result as any).status.goal_id.id
            && ((result as any).status.status === Status.SUCCEEDED
                || (result as any).status.status === Status.PREEMPTED
                || (result as any).status.status === Status.ABORTED)) {
          console.log('type, goal, result:', type, goal, result);
          return result;
        }
      }),
      // .map(([type, goal, status]) => {
      //   // console.log('type, goal, status', type, goal, status);
      //   if (type === 'DISPLAY_MESSAGE'
      //       && (goal as any).goal_id.id === (status as any).goal_id.id
      //       && (status as any).status === Status.ACTIVE) {
      //     return {
      //       status,
      //       result: true,
      //     }
      //   }
      // }),
    xs.combine(type$, secondGoal$, secondSink.result)
      .map(([type, goal, result]) => {
        if (type === 'ASK_QUESTION'
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
    result: adapt(result$),
  };
}

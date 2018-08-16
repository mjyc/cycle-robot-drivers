import {Goal, GoalID} from './types'


export function generateGoalID(): GoalID {
  const now = new Date();
  return {
    stamp: now,
    id: `${Math.random().toString(36).substring(2)}-${now.getTime()}`,
  };
}

export function initGoal(goal: any): Goal {
  return {
    goal_id: generateGoalID(),
    goal,
  }
}

export function isEqual(first: GoalID, second: GoalID) {
  if (!first || !second) {
    return false;
  }
  return (first.stamp === second.stamp && first.id === second.id);
}

export function powerup(main, connect) {
  return (sources) => {
    const sinks = main(sources);
    Object.keys(sources.proxies).map(key => {
      connect(sources.proxies[key], sinks.targets[key]);
    });
    const {targets, ...sinksNoTargets} = sinks;
    return sinksNoTargets;
  };
}

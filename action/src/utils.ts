import {GoalID, Goal, Result} from './types'

export function generateGoalID(): GoalID {
  const now = new Date();
  return {
    stamp: now,
    id: `${Math.random().toString(36).substring(2)}-${now.getTime()}`,
  };
}

export function initGoal(
  goal: any,
  isGoal: (g: any) => boolean = g =>
    typeof g === 'object' && g !== null && !!g.goal_id,
): Goal {
  return isGoal(goal) ? goal : {
    goal_id: generateGoalID(),
    goal,
  };
}

export function isEqual(first: GoalID, second: GoalID) {
  if (!first || !second) {
    return false;
  }
  return (first.stamp === second.stamp && first.id === second.id);
}

export function isEqualGoal(first: Goal, second: Goal) {
  if (first === null && second === null) {
    return true;
  }
  if (!first || !second) {
    return false;
  }
  return isEqual(first.goal_id, second.goal_id);
}

export function isEqualResult(first: Result, second: Result) {
  if (!first || !second) {
    return false;
  }
  return (
    isEqual(first.status.goal_id, second.status.goal_id)
    && first.status.status === second.status.status
  );
}

export function powerup(
  main: (sources: {
    proxies: {
      [proxyName: string]: any
    },
    [sourceName: string]: any,
  }) => {
    targets: {
      [targetName: string]: any,
    },
    [sinkName: string]: any,
  },
  connect: (proxy: any, target: any) => any
) {
  return (sources) => {
    const sinks = main(sources);
    Object.keys(sources.proxies).map(key => {
      connect(sources.proxies[key], sinks.targets[key]);
    });
    const {targets, ...sinksWithoutTargets} = sinks;
    return sinksWithoutTargets;
  };
}

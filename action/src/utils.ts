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

export function isEqualGoalID(first: GoalID, second: GoalID) {
  return (first.stamp === second.stamp && first.id === second.id);
}

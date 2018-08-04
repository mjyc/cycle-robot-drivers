import {Goal} from './types'

export function initGoal(goal: any): Goal {
  const now = new Date();
  return {
    goal_id: {
      stamp: now,
      id: `${Math.random().toString(36).substring(2)}-${now.getTime()}`,
    },
    goal,
  }
}

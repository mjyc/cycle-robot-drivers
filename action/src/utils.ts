import dropRepeats from 'xstream/extra/dropRepeats';
import {GoalID, Goal, Status, GoalStatus, Result} from './types'

export function generateGoalID({stamp = undefined, id = undefined} = {}): GoalID {
  const now = new Date();
  return {
    stamp: typeof stamp === 'undefined' ? now : stamp,
    id: typeof id === 'undefined'
      ? `${Math.random().toString(36).substring(2)}-${now.getTime()}` : id,
  };
}

export function generateGoalStatus(options?): GoalStatus {
  if (!options) options = {};
  return {
    goal_id: generateGoalID(),
    status: typeof options.status !== 'undefined'
      ? options.status : Status.SUCCEEDED,
  };
}

export function generateResult(options?): Result{
  if (!options) options = {};
  return {
    status: generateGoalStatus(options.status),
    result: typeof options.result !== 'undefined' ? options.result : null,
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

export function isEqualGoalID(first: GoalID, second: GoalID) {
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
  return isEqualGoalID(first.goal_id, second.goal_id);
}

export function isEqualGoalStatus(first: GoalStatus, second: GoalStatus) {
  return (
    isEqualGoalID(first.goal_id, second.goal_id)
    && first.status === second.status
  );
}

export function isEqualResult(first: Result, second: Result) {
  if (!first || !second) {
    return false;
  }
  // doesn't compare .result yet
  return isEqualGoalStatus(first.status, second.status);
}

export function selectActionResult(actionName) {
  return (in$) => in$
    .filter(s => !!s
      && !!s[actionName]
      && !!s[actionName].outputs
      && !!s[actionName].outputs.result)
    .map(s => s[actionName].outputs.result)
    .compose(dropRepeats(isEqualResult));
}
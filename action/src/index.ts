export {
  GoalID,
  Goal,
  Status,
  GoalStatus,
  Result,
  ActionSources,
  ActionSinks,
  EventSource,
} from './types';

export {
  generateGoalID,
  generateGoalStatus,
  generateResult,
  initGoal,
  isEqualGoalID,
  isEqualGoal,
  isEqualGoalStatus,
  isEqualResult,
} from './utils';


export {
  makeConcurrentAction
} from './makeConcurrentAction';
export type GoalID = {
  stamp: Date,
  id: string,
};

export type Goal = {
  goal_id: GoalID,
  goal: any,
};

export enum Status {
  PENDING = 0,
  ACTIVE = 1,
  PREEMPTED = 2,
  SUCCEEDED = 3,
  ABORTED = 4,
  REJECTED = 5,
  PREEMPTING = 6,
}

export type GoalStatus = {
  goal_id: GoalID,
  status: Status,
};

export type Result = {
  status: GoalStatus,
  result: any,
};

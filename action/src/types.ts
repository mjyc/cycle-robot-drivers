export type GoalID = {
  stamp: Date,
  id: string,
};

export type Goal = {
  goal_id: GoalID,
  goal: any,
};

export enum Status {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  PREEMPTED = 'PREEMPTED',
  SUCCEEDED = 'SUCCEEDED',
  ABORTED = 'ABORTED',
  PREEMPTING = 'PREEMPTING',
}

export type GoalStatus = {
  goal_id: GoalID,
  status: Status,
};

export type Result = {
  status: GoalStatus,
  result: any,
};

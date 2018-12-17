export type GoalID = {
  stamp: Date,
  id: string,
};

export type Goal = {
  goal_id: GoalID,
  goal: any,
};

export enum Status {
  ACTIVE = 'ACTIVE',
  PREEMPTED = 'PREEMPTED',
  SUCCEEDED = 'SUCCEEDED',
  ABORTED = 'ABORTED',
}

export type GoalStatus = {
  goal_id: GoalID,
  status: Status,
};

export type Result = {
  status: GoalStatus,
  result: any,
};


export interface ActionSinks {
  output: any,
  status?: any,  // TODO: remove after refactoring AudioPlayerAction & FacialExpressionAction
  result: any,
};


export interface EventSource {
  events(eventType: string): any;
}

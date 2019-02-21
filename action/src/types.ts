import Stream from 'xstream';
import {StateSource} from '@cycle/state';

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


export interface ActionSources {
  state: StateSource<any>,  // Stream<any>
  goal: Stream<Goal>,
  cancel?: Stream<GoalID>,
}

export interface ActionSinks {
  state: Stream<any>,
  feedback?: Stream<any>,
  status: Stream<GoalStatus>,
  result: Stream<Result>,
}


export interface EventSource {
  events(eventType: string): any;
}

export declare type GoalID = {
    stamp: Date;
    id: string;
};
export declare type Goal = {
    goal_id: GoalID;
    goal: any;
};
export declare enum Status {
    PENDING = 0,
    ACTIVE = 1,
    PREEMPTED = 2,
    SUCCEEDED = 3,
    ABORTED = 4
}
export declare type GoalStatus = {
    goal_id: GoalID;
    status: Status;
};
export declare type Result = {
    status: GoalStatus;
    result: any;
};

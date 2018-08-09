export declare type GoalID = {
    stamp: Date;
    id: string;
};
export declare type Goal = {
    goal_id: GoalID;
    goal: any;
};
export declare enum Status {
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    PREEMPTED = "PREEMPTED",
    SUCCEEDED = "SUCCEEDED",
    ABORTED = "ABORTED",
    PREEMPTING = "PREEMPTING"
}
export declare type GoalStatus = {
    goal_id: GoalID;
    status: Status;
};
export declare type Result = {
    status: GoalStatus;
    result: any;
};

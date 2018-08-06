"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateGoalID() {
    var now = new Date();
    return {
        stamp: now,
        id: Math.random().toString(36).substring(2) + "-" + now.getTime(),
    };
}
exports.generateGoalID = generateGoalID;
function initGoal(goal) {
    return {
        goal_id: generateGoalID(),
        goal: goal,
    };
}
exports.initGoal = initGoal;
//# sourceMappingURL=utils.js.map
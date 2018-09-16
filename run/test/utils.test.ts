import {generateGoalID, isEqual} from '../src/utils'

describe('isEqual', () => {
  test('returns true for two GoalIDs with the same property values', () => {
    const goalId1 = generateGoalID();
    const goalId2 = {...goalId1};
    expect(isEqual(goalId1, goalId2)).toBe(true);
  });
});

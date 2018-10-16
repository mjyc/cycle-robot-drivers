const {runRobotProgram} = require('../src/index.tsx');

describe('runRobotProgram', () => {
  test('throws an error if main is not given', () => {
    expect(runRobotProgram).toThrowError();
  });
});

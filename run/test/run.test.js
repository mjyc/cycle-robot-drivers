const {runRobotProgram} = require('../src/index.tsx');

describe('runRobotProgram', () => {
  it('throws an error if main is not given', () => {
    expect(runRobotProgram).toThrow();
  });
});

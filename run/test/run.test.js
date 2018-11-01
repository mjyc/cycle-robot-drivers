const {runRobotProgram} = require('../src/index.ts');

describe('runRobotProgram', () => {
  it('throws an error if main is not given', () => {
    expect(runRobotProgram).toThrow();
  });
});

const {runTabletRobotFaceApp} = require('../src/index.ts');

describe('runTabletRobotFaceApp', () => {
  it('throws an error if main is not given', () => {
    expect(runTabletRobotFaceApp).toThrow();
  });
});

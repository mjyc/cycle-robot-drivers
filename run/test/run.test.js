const {runTabletFaceRobotApp} = require('../src/index.ts');

describe('runTabletFaceRobotApp', () => {
  it('throws an error if main is not given', () => {
    expect(runTabletFaceRobotApp).toThrow();
  });
});

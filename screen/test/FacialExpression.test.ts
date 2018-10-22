import xs from 'xstream'
import {mockTimeSource} from '@cycle/time';
import {
  GoalID, GoalStatus, Status,
  generateGoalID,
} from '@cycle-robot-drivers/action'
import {FacialExpressionAction} from '../src/FacialExpressionAction';


console.debug = jest.fn();  // hide debug outputs

function createToStatus(goal_id: GoalID) {
  return function (str: string): GoalStatus {
    switch (str) {
      case 'a':
        return {
          goal_id,
          status: Status.ACTIVE,
        };
      case 'p':
        return {
          goal_id,
          status: Status.PREEMPTED,
        };
      case 's':
        return {
          goal_id,
          status: Status.SUCCEEDED,
        };
    }
  };
};


describe('FacialExpressionAction', () => {
  it('walks through "happy path"', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =           Time.diagram(`-x--|`);
    const animationFinish$ =    Time.diagram(`--x-|`);
    const expectedOutputMark$ = Time.diagram(`-x--|`);
    const expectedResultMark$ = Time.diagram(`--s-|`);

    // Create the action to test
    const goal = 'happy';
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal,
    });
    const actionComponent = FacialExpressionAction({
      goal: goal$,
      TabletFace: {
        animationFinish: animationFinish$,
      }
    });

    // Prepare expected values
    const toStatus = createToStatus(goal_id);
    const expectedOutput$ = expectedOutputMark$.mapTo({
      type: 'EXPRESS',
      value: {type: goal},
    });
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null,
    }));

    // Run test
    Time.assertEqual(actionComponent.output, expectedOutput$);
    Time.assertEqual(actionComponent.result, expectedResult$);

    Time.run(done);
  });

  it('cancels a running goal on cancel', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =           Time.diagram(`-0-1-|`);
    const animationFinish$ =    Time.diagram(`-----|`);
    const expectedOutputMark$ = Time.diagram(`-0-1-|`);
    const expectedResultMark$ = Time.diagram(`---p-|`);

    // Create the action to test
    const goal = 'happy';
    const goal_id = generateGoalID();
    const goals = [{goal, goal_id}, null];
    const goal$ = goalMark$.map(i => goals[i]);
    const actionComponent = FacialExpressionAction({
      goal: goal$,
      TabletFace: {
        animationFinish: animationFinish$,
      }
    });

    // Prepare expected values
    const values = [goal, null];
    const toStatus = createToStatus(goal_id);
    const expectedOutput$ = expectedOutputMark$.map(i => !!values[i] ? {
      type: 'EXPRESS',
      value: {type: values[i]},
    } : null);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null,
    }));

    // Run test
    Time.assertEqual(actionComponent.output, expectedOutput$);
    Time.assertEqual(actionComponent.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on initial cancel', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =        Time.diagram(`-x-|`);
    const animationFinish$ = Time.diagram(`---|`);
    const expectedOutput$ =  Time.diagram(`---|`);
    const expectedResult$ =  Time.diagram(`---|`);

    // Create the action to test
    const goal$ = goalMark$.mapTo(null);
    const actionComponent = FacialExpressionAction({
      goal: goal$,
      TabletFace: {
        animationFinish: animationFinish$,
      }
    });

    // Run test
    Time.assertEqual(actionComponent.output, expectedOutput$);
    Time.assertEqual(actionComponent.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on cancel after succeeded', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =           Time.diagram(`-0--1-|`);
    const animationFinish$ =    Time.diagram(`---1--|`);
    const expectedOutputMark$ = Time.diagram(`-0----|`);
    const expectedResultMark$ = Time.diagram(`---s--|`);

    // Create the action to test
    const goal = 'happt';
    const goal_id = generateGoalID();
    const goals = [{goal, goal_id}, null];
    const goal$ = goalMark$.map(i => goals[i]);
    const actionComponent = FacialExpressionAction({
      goal: goal$,
      TabletFace: {
        animationFinish: animationFinish$,
      }
    });

    // Prepare expected values
    const values = [goal, null];
    const toStatus = createToStatus(goal_id);
    const expectedOutput$ = expectedOutputMark$.map(i => !!values[i] ? {
      type: 'EXPRESS',
      value: {type: values[i]},
    } : null);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null,
    }));

    // Run test
    Time.assertEqual(actionComponent.output, expectedOutput$);
    Time.assertEqual(actionComponent.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on cancel after preempted', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =           Time.diagram(`-0-1-1-|`);
    const animationFinish$ =    Time.diagram(`-------|`);
    const expectedOutputMark$ = Time.diagram(`-0-1---|`);
    const expectedResultMark$ = Time.diagram(`---p---|`);

    // Create the action to test
    const goal = 'happy';
    const goal_id = generateGoalID();
    const goals = [{goal, goal_id}, null];
    const goal$ = goalMark$.map(i => goals[i]);
    const actionComponent = FacialExpressionAction({
      goal: goal$,
      TabletFace: {
        animationFinish: animationFinish$,
      }
    });

    // Prepare expected values
    const values = [goal, null];
    const toStatus = createToStatus(goal_id);
    const expectedOutput$ = expectedOutputMark$.map(i => !!values[i] ? {
      type: 'EXPRESS',
      value: {type: values[i]},
    } : null);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null,
    }));

    // Run test
    Time.assertEqual(actionComponent.output, expectedOutput$);
    Time.assertEqual(actionComponent.result, expectedResult$);

    Time.run(done);
  });

  it('cancels the first goal on receiving a second goal', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =          Time.diagram(`-0--1----|`);
    const animationFinish$ =   Time.diagram(`-------x-|`);
    const expecteds = [{
      output:                  Time.diagram(`-0--x----|`),
      result:                  Time.diagram(`----p----|`),
    }, {
      output:                  Time.diagram(`----1----|`),
      result:                  Time.diagram(`-------s-|`),
    }];

    // Create the action to test
    const goal_ids = [generateGoalID(), generateGoalID()];
    const goals = ['happy', 'sad'];
    const goal$ = goalMark$.map(i => ({
      goal_id: goal_ids[i],
      goal: goals[i],
    }));
    const actionComponent = FacialExpressionAction({
      goal: goal$,
      TabletFace: {
        animationFinish: animationFinish$,
      }
    });

    // Prepare expected values
    expecteds.map((expected, i) => {
      expected.output = expected.output.map(j => !!goals[j] ? {
        type: 'EXPRESS',
        value: {type: goals[i]},
      } : null);
      const toStatus = createToStatus(goal_ids[i]);
      expected.result = expected.result.map(str => ({
        status: toStatus(str),
        result: null,
      }));
    });
    const expectedOutput$ = xs.merge(expecteds[0].output, expecteds[1].output);
    const expectedResult$ = xs.merge(expecteds[0].result, expecteds[1].result);

    // Run test
    Time.assertEqual(actionComponent.output, expectedOutput$);
    Time.assertEqual(actionComponent.result, expectedResult$);

    Time.run(done);
  });
});

import xs from 'xstream'
import {mockTimeSource} from '@cycle/time';
import {withState} from '@cycle/state';
import {
  GoalID, GoalStatus, Status,
  generateGoalID,
} from '@cycle-robot-drivers/action'
import {FacialExpressionAction as Action} from '../src/FacialExpressionAction';


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

    // Create test input streams
    const goalMark$ =           Time.diagram(`-x--|`);
    const animationFinish$ =    Time.diagram(`--x-|`);
    const expectedOutputMark$ = Time.diagram(`-x`);
    const expectedResultMark$ = Time.diagram(`--s`);

    // Create the action to test
    const goal = 'happy';
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal,
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
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
    Time.assertEqual(sinks.TabletFace, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it('cancels a running goal on cancel', (done) => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ =           Time.diagram(`-x----|`);
    const cancel$ =             Time.diagram(`---x--|`);
    const animationFinish$ =    Time.diagram(`----x-|`);
    const expectedOutputMark$ = Time.diagram(`-0-1`);
    const expectedResultMark$ = Time.diagram(`----p`);

    // Create the action to test
    const goal = 'happy';
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal,
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$,
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
    Time.assertEqual(sinks.TabletFace, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on initial cancel', (done) => {
    const Time = mockTimeSource();

    // Create test input streams
    const cancel$ =        Time.diagram(`-x-|`);
    const animationFinish$ = Time.diagram(``);
    const expectedOutput$ =  Time.diagram(``);
    const expectedResult$ =  Time.diagram(``);

    // Create the action to test
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: xs.never(),
      cancel: cancel$,
      TabletFace: {
        animationFinish: animationFinish$,
      }
    });

    // Run test
    Time.assertEqual(sinks.TabletFace, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on cancel after succeeded', (done) => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ =           Time.diagram(`-x----|`);
    const cancel$ =             Time.diagram(`----x-|`);
    const animationFinish$ =    Time.diagram(`---x--|`);
    const expectedOutputMark$ = Time.diagram(`-0`);
    const expectedResultMark$ = Time.diagram(`---s`);

    // Create the action to test
    const goal = 'happy';
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal,
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$,
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
    Time.assertEqual(sinks.TabletFace, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on cancel after preempted', (done) => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ =           Time.diagram(`-x-----|`);
    const cancel$ =             Time.diagram(`---x-x-|`);
    const animationFinish$ =    Time.diagram(`----x--|`);
    const expectedOutputMark$ = Time.diagram(`-0-1`);
    const expectedResultMark$ = Time.diagram(`----p`);

    // Create the action to test
    const goal = 'happy';
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal,
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$,
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
    Time.assertEqual(sinks.TabletFace, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it('cancels the first goal on receiving a second goal', (done) => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ =          Time.diagram(`-0--1----|`);
    const animationFinish$ =   Time.diagram(`-----x-x-|`);
    const expecteds = [{
      output:                  Time.diagram(`-0--x`),
      result:                  Time.diagram(`-----p`),
    }, {
      output:                  Time.diagram(`-----1`),
      result:                  Time.diagram(`-------s`),
    }];

    // Create the action to test
    const goal_ids = [generateGoalID(), generateGoalID()];
    const goals = ['happy', 'sad'];
    const goal$ = goalMark$.map(i => ({
      goal_id: goal_ids[i],
      goal: goals[i],
    }));
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
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
    Time.assertEqual(sinks.TabletFace, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });
});

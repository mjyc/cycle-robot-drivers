import xs from 'xstream'
import {mockTimeSource} from '@cycle/time';
import {
  GoalID, Goal, GoalStatus, Status, Result, generateGoalID, initGoal,
} from '@cycle-robot-drivers/action'
import {AudioPlayerAction} from '../src/AudioPlayerAction';


console.debug = jest.fn();  // hide debug outputs

function createToStatusFnc(goal_id: GoalID) {
  return function (str: string): GoalStatus {
    switch (str) {
      case 'd':
        return {
          goal_id,
          status: Status.PENDING,
        };
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


describe('AudioPlayerAction', () => {
  it('walks through "happy path"', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalStr$ =           Time.diagram(`-x---|`);
    const events = {
      ended:                   Time.diagram(`---x-|`),
    }
    const expectedValueStr$ =  Time.diagram(`-x---|`);
    const expectedStatusStr$ = Time.diagram(`-a-s-|`);
    const expectedResultStr$ = Time.diagram(`---s-|`);

    // Create the action to test
    const goal = {src: 'dummy.ogg'};
    const goal_id = generateGoalID();
    const goal$ = goalStr$.mapTo({
      goal_id,
      goal,
    });
    const audioPlayerAction = AudioPlayerAction({
      goal: goal$,
      AudioPlayer: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    // Prepare expected values
    const toStatus = createToStatusFnc(goal_id);
    const expectedValue$ = expectedValueStr$.mapTo(goal);
    const expectedStatus$ = expectedStatusStr$.map(str => toStatus(str));
    const expectedResult$ = expectedResultStr$.map(str => ({
      status: toStatus(str),
      result: toStatus(str).status === 'PREEMPTED' ? null : 'x',
    }));

    // Run test
    Time.assertEqual(audioPlayerAction.value, expectedValue$);
    Time.assertEqual(audioPlayerAction.status, expectedStatus$);
    Time.assertEqual(audioPlayerAction.result, expectedResult$);

    Time.run(done);
  });

  it('cancels a running goal on cancel"', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalNum$ =           Time.diagram(`-0-1--|`);
    const events = {
      ended:                   Time.diagram(`----x-|`),
    }
    const expectedValueNum$ =  Time.diagram(`-0-1--|`);
    const expectedStatusStr$ = Time.diagram(`-a--p-|`);
    const expectedResultStr$ = Time.diagram(`----p-|`);

    // update strings to proper inputs
    const goal = {text: 'Hello'};
    const goal_id = generateGoalID();
    const goals = [{goal, goal_id}, null];
    const goal$ = goalNum$.map(i => goals[i]);

    // Create the action to test
    const audioPlayerAction = AudioPlayerAction({
      goal: goal$,
      AudioPlayer: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    // Prepare expected values
    const values = [goal, null];
    const toStatus = createToStatusFnc(goal_id);
    const expectedValue$ = expectedValueNum$.map(i => values[i]);
    const expectedStatus$ = expectedStatusStr$.map(str => toStatus(str));
    const expectedResult$ = expectedResultStr$.map(str => ({
      status: toStatus(str),
      result: toStatus(str).status === 'PREEMPTED' ? null : 'x',
    }));

    // Run test
    Time.assertEqual(audioPlayerAction.value, expectedValue$);
    Time.assertEqual(audioPlayerAction.status, expectedStatus$);
    Time.assertEqual(audioPlayerAction.result, expectedResult$);

    Time.run(done);
  });
});

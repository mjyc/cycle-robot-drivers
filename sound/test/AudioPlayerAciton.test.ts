import xs from 'xstream'
import {mockTimeSource} from '@cycle/time';
import {withState} from '@cycle/state';
import {
  GoalID, GoalStatus, Status,
  generateGoalID,
} from '@cycle-robot-drivers/action'
import {AudioPlayerAction as Action} from '../src/AudioPlayerAction';


console.debug = jest.fn();  // hide debug outputs

function createToStatusFnc(goal_id: GoalID) {
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


describe('AudioPlayerAction', () => {
  it('walks through "happy path"', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalStr$ =           Time.diagram(`-x---|`);
    const events = {
      ended:                   Time.diagram(`---x-|`),
      pause:                   Time.diagram(`-----|`),
    }
    const expectedValueStr$ =  Time.diagram(`-x`);
    const expectedStatusStr$ = Time.diagram(`-a-s`);
    const expectedResultStr$ = Time.diagram(`---s`);

    // Create the action to test
    const goal = {src: 'dummy.ogg'};
    const goal_id = generateGoalID();
    const goal$ = goalStr$.mapTo({
      goal_id,
      goal,
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
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
      result: null,
    }));

    // Run test
    Time.assertEqual(sinks.AudioPlayer, expectedValue$);
    Time.assertEqual(sinks.status.drop(1), expectedStatus$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it('cancels a running goal on cancel"', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =          Time.diagram(`-x----|`);
    const cancel$ =            Time.diagram(`---x--|`);
    const events = {
      ended:                   Time.diagram(`----x-|`),
      pause:                   Time.diagram(`------|`),
    }
    const expectedValueNum$ =  Time.diagram(`-0-1`);
    const expectedStatusStr$ = Time.diagram(`-a--p`);
    const expectedResultStr$ = Time.diagram(`----p`);

    // update strings to proper inputs
    const goal = {src: 'dummy.ogg'};
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal,
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$.mapTo(null),
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
      result: null,
    }));

    // Run test
    Time.assertEqual(sinks.AudioPlayer, expectedValue$);
    Time.assertEqual(sinks.status.drop(1), expectedStatus$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on initial cancel', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const cancel$ =        Time.diagram(`-x-|`);
    const events = {
      ended:                Time.diagram(`---|`),
      pause:                Time.diagram(`---|`),
    }
    const expectedValue$ =  Time.diagram(``);
    const expectedStatus$ = Time.diagram(``);
    const expectedResult$ = Time.diagram(``);

    // Create the action to test
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: xs.never(),
      cancel: cancel$.mapTo(null),
      AudioPlayer: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    // Run test
    Time.assertEqual(sinks.AudioPlayer, expectedValue$);
    Time.assertEqual(sinks.status.drop(1), expectedStatus$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on cancel after succeeded', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =          Time.diagram(`-x----|`);
    const cancel$ =            Time.diagram(`----x-|`);
    const events = {
      ended:                   Time.diagram(`---x--|`),
      pause:                   Time.diagram(`------|`),
    }
    const expectedValueNum$ =  Time.diagram(`-0`);
    const expectedStatusStr$ = Time.diagram(`-a-s`);
    const expectedResultStr$ = Time.diagram(`---s`);

    // Create the action to test
    const goal = {src: 'dummy.ogg'};
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal,
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$.mapTo(null),
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
      result: null,
    }));

    // Run test
    Time.assertEqual(sinks.AudioPlayer, expectedValue$);
    Time.assertEqual(sinks.status.drop(1), expectedStatus$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on cancel after preempted', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =          Time.diagram(`-x-----|`);
    const cancel$ =            Time.diagram(`---x-x-|`);
    const events = {
      ended:                   Time.diagram(`----x--|`),
      pause:                   Time.diagram(`-------|`),
    }
    const expectedValueNum$ =  Time.diagram(`-0-1`);
    const expectedStatusStr$ = Time.diagram(`-a--p`);
    const expectedResultStr$ = Time.diagram(`----p`);

    // Create the action to test
    const goal = {src: 'dummy.ogg'};
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal,
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$.mapTo(null),
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
      result: null,
    }));

    // Run test
    Time.assertEqual(sinks.AudioPlayer, expectedValue$);
    Time.assertEqual(sinks.status.drop(1), expectedStatus$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it('cancels the first goal on receiving a second goal', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =          Time.diagram(`-0--1----|`);
    const events = {
      ended:                   Time.diagram(`-------x-|`),
      pause:                   Time.diagram(`-----x---|`),
    };
    const expecteds = [{
      value:                   Time.diagram(`-0--x`),
      status:                  Time.diagram(`-a---p`),
      result:                  Time.diagram(`-----p`),
    }, {
      value:                   Time.diagram(`-----1`),
      status:                  Time.diagram(`-----a-s`),
      result:                  Time.diagram(`-------s`),
    }];

    // Create the action to test
    const goal_ids = [generateGoalID(), generateGoalID()];
    const goals = [{src: 'dummy.org'}, {text: 'genius.ogg'}];
    const goal$ = goalMark$.map(i => ({
      goal_id: goal_ids[i],
      goal: goals[i],
    }));
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      AudioPlayer: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    // Prepare expected values
    expecteds.map((expected, i) => {
      expected.value = expected.value.map(j => goals[j] ? goals[j] : null);
      const toStatus = createToStatusFnc(goal_ids[i]);
      expected.status = expected.status.map(str => toStatus(str));
      expected.result = expected.result.map(str => ({
        status: toStatus(str),
        result: null,
      }));
    });
    const expectedValue$ = xs.merge(expecteds[0].value, expecteds[1].value);
    const expectedStatus$ = xs.merge(expecteds[0].status, expecteds[1].status);
    const expectedResult$ = xs.merge(expecteds[0].result, expecteds[1].result);

    // Run test
    Time.assertEqual(sinks.AudioPlayer, expectedValue$);
    Time.assertEqual(sinks.status.drop(1), expectedStatus$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });
});

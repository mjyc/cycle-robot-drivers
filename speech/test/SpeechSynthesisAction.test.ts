import xs from 'xstream'
import {mockTimeSource} from '@cycle/time';
import {
  GoalID, GoalStatus, Status,
  generateGoalID,
} from '@cycle-robot-drivers/action'
import {SpeechSynthesisAction} from '../src/SpeechSynthesisAction';


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


describe('SpeechSynthesisAction', () => {
  it('walks through "happy path"', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =           Time.diagram(`-x---|`);
    const events = {
      start:                    Time.diagram(`--x--|`),
      end:                      Time.diagram(`---x-|`),
    }
    const expectedOutputMark$ = Time.diagram(`-x---|`);
    const expectedResultMark$ = Time.diagram(`---s-|`);

    // Create the action to test
    const goal = {text: 'Hello'};
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal,
    });
    const speechSynthesisAction = SpeechSynthesisAction({
      goal: goal$,
      SpeechSynthesis: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    // Prepare expected values
    const toStatus = createToStatus(goal_id);
    const expectedOutput$ = expectedOutputMark$.mapTo(goal);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null,
    }));

    // Run test
    Time.assertEqual(speechSynthesisAction.output, expectedOutput$);
    Time.assertEqual(speechSynthesisAction.result, expectedResult$);

    Time.run(done);
  });

  it('cancels a running goal on cancel"', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =           Time.diagram(`-0-1--|`);
    const events = {
      start:                    Time.diagram(`--x---|`),
      end:                      Time.diagram(`----x-|`),
    }
    const expectedOutputMark$ = Time.diagram(`-0-1--|`);
    const expectedResultMark$ = Time.diagram(`----p-|`);

    // update strings to proper inputs
    const goal = {text: 'Hello'};
    const goal_id = generateGoalID();
    const goals = [{goal, goal_id}, null];
    const goal$ = goalMark$.map(i => goals[i]);

    // Create the action to test
    const speechSynthesisAction = SpeechSynthesisAction({
      goal: goal$,
      SpeechSynthesis: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    // Prepare expected values
    const values = [goal, null];
    const toStatus = createToStatus(goal_id);
    const expectedOutput$ = expectedOutputMark$.map(i => values[i]);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null,
    }));

    // Run test
    Time.assertEqual(speechSynthesisAction.output, expectedOutput$);
    Time.assertEqual(speechSynthesisAction.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on initial cancel', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =       Time.diagram(`-x-|`);
    const events = {
      start:                Time.diagram(`---|`),
      end:                  Time.diagram(`---|`),
    }
    const expectedOutput$ = Time.diagram(`---|`);
    const expectedResult$ = Time.diagram(`---|`);

    // Create the action to test
    const goal$ = goalMark$.mapTo(null);
    const speechSynthesisAction = SpeechSynthesisAction({
      goal: goal$,
      SpeechSynthesis: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    // Run test
    Time.assertEqual(speechSynthesisAction.output, expectedOutput$);
    Time.assertEqual(speechSynthesisAction.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on cancel after succeeded', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =           Time.diagram(`-0--1-|`);
    const events = {
      start:                    Time.diagram(`--x---|`),
      end:                      Time.diagram(`---x--|`),
    }
    const expectedOutputMark$ = Time.diagram(`-0----|`);
    const expectedResultMark$ = Time.diagram(`---s--|`);

    // Create the action to test
    const goal = {text: 'Hello'};
    const goal_id = generateGoalID();
    const goals = [{goal, goal_id}, null];
    const goal$ = goalMark$.map(i => goals[i]);
    const speechSynthesisAction = SpeechSynthesisAction({
      goal: goal$,
      SpeechSynthesis: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    // Prepare expected values
    const values = [goal, null];
    const toStatus = createToStatus(goal_id);
    const expectedOutput$ = expectedOutputMark$.map(i => values[i]);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null,
    }));

    // Run test
    Time.assertEqual(speechSynthesisAction.output, expectedOutput$);
    Time.assertEqual(speechSynthesisAction.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on cancel after preempted', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =           Time.diagram(`-0-1-1-|`);
    const events = {
      start:                    Time.diagram(`--x----|`),
      end:                      Time.diagram(`----x--|`),
    }
    const expectedOutputMark$ = Time.diagram(`-0-1---|`);
    const expectedResultMark$ = Time.diagram(`----p--|`);

    // Create the action to test
    const goal = {text: 'Hello'};
    const goal_id = generateGoalID();
    const goals = [{goal, goal_id}, null];
    const goal$ = goalMark$.map(i => goals[i]);
    const speechSynthesisAction = SpeechSynthesisAction({
      goal: goal$,
      SpeechSynthesis: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    // Prepare expected values
    const values = [goal, null];
    const toStatus = createToStatus(goal_id);
    const expectedOutput$ = expectedOutputMark$.map(i => values[i]);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null,
    }));

    // Run test
    Time.assertEqual(speechSynthesisAction.output, expectedOutput$);
    Time.assertEqual(speechSynthesisAction.result, expectedResult$);

    Time.run(done);
  });

  it('cancels the first goal on receiving a second goal', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =          Time.diagram(`-0--1-----|`);
    const events = {
      start:                   Time.diagram(`--x---x---|`),
      end:                     Time.diagram(`-----x--x-|`),
    };
    const expecteds = [{
      output:                  Time.diagram(`-0--x-----|`),
      result:                  Time.diagram(`-----p----|`),
    }, {
      output:                  Time.diagram(`-----1----|`),
      result:                  Time.diagram(`--------s-|`),
    }];

    // Create the action to test
    const goal_ids = [generateGoalID(), generateGoalID()];
    const goals = [{text: 'Hello'}, {text: 'World'}];
    const goal$ = goalMark$.map(i => ({
      goal_id: goal_ids[i],
      goal: goals[i],
    }));
    const speechSynthesisAction = SpeechSynthesisAction({
      goal: goal$,
      SpeechSynthesis: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    // Prepare expected values
    expecteds.map((expected, i) => {
      expected.output = expected.output.map(j => goals[j] ? goals[j] : null);
      const toStatus = createToStatus(goal_ids[i]);
      expected.result = expected.result.map(str => ({
        status: toStatus(str),
        result: null,
      }));
    });
    const expectedOutput$ = xs.merge(expecteds[0].output, expecteds[1].output);
    const expectedResult$ = xs.merge(expecteds[0].result, expecteds[1].result);

    // Run test
    Time.assertEqual(speechSynthesisAction.output, expectedOutput$);
    Time.assertEqual(speechSynthesisAction.result, expectedResult$);

    Time.run(done);
  });
});

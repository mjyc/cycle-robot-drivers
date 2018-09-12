import xs from 'xstream'
import {mockTimeSource} from '@cycle/time';
import {
  GoalID, GoalStatus, Status,
  generateGoalID,
} from '@cycle-robot-drivers/action'
import {SpeechRecognitionAction} from '../src/SpeechRecognitionAction';


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


describe('SpeechRecognitionAction', () => {
  it('walks through "happy path"', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =           Time.diagram(`-x----|`);
    const events = {
      start:                    Time.diagram(`--x---|`),
      end:                      Time.diagram(`----x-|`),
      result:                   Time.diagram(`---x--|`),
      error:                    Time.diagram(`------|`),
    }
    const expectedOutputMark$ = Time.diagram(`-x----|`);
    const expectedResultMark$ = Time.diagram(`----s-|`);

    // Create the action to test
    const goal = {};
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal,
    });
    const transcript = 'Hello there';
    events.result = events.result.map(r => ({
      results: [[{transcript}]],
    }));
    const speechRecognitionAction = SpeechRecognitionAction({
      goal: goal$,
      SpeechRecognition: {
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
      result: transcript,
    }));

    // Run test
    Time.assertEqual(speechRecognitionAction.output, expectedOutput$);
    Time.assertEqual(speechRecognitionAction.result, expectedResult$);

    Time.run(done);
  });

  it('cancels a running goal on cancel', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =           Time.diagram(`-0-1---|`);
    const events = {
      start:                    Time.diagram(`--x----|`),
      end:                      Time.diagram(`-----x-|`),
      result:                   Time.diagram(`-------|`),
      error:                    Time.diagram(`----x--|`),
    }
    const expectedOutputMark$ = Time.diagram(`-0-1---|`);
    const expectedResultMark$ = Time.diagram(`-----p-|`);

    // update strings to proper inputs
    const transcript = 'Jello there?';
    const goal = {};
    const goal_id = generateGoalID();
    const goals = [{goal, goal_id}, null];
    const goal$ = goalMark$.map(i => goals[i]);

    // Create the action to test
    const speechRecognitionAction = SpeechRecognitionAction({
      goal: goal$,
      SpeechRecognition: {
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
    Time.assertEqual(speechRecognitionAction.output, expectedOutput$);
    Time.assertEqual(speechRecognitionAction.result, expectedResult$);

    Time.run(done);
  });
});

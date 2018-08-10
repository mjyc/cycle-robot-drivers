import {mockTimeSource} from '@cycle/time';
import {
  GoalID, Goal, GoalStatus, Status, Result, generateGoalID, initGoal,
} from '@cycle-robot-drivers/action'
import {SpeechSynthesisAction} from '../src/SpeechSynthesisAction';

// hide debug outputs
console.debug = jest.fn();

describe('SpeechSynthesisAction', () => {
  it('emits status and results', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalStr$ =           Time.diagram(`-x---|`);
    const events = {
      start:                   Time.diagram(`--x--|`),
      end:                     Time.diagram(`---x-|`),
      error:                   Time.diagram(`-----|`),
    }
    const expectedValueStr$ =  Time.diagram(`-y---|`);
    const expectedStatusStr$ = Time.diagram(`-pas-|`);
    const expectedResultStr$ = Time.diagram(`---y-|`);

    // update strings to proper inputs
    const goal = {text: 'Hello world!'};
    const goal_id = generateGoalID();
    const toStatus = ((goal_id) => {
      return (str) => {
        switch (str) {
          case 'p':
            return {
              goal_id,
              status: Status.PENDING,
            };
          case 'a':
            return {
              goal_id,
              status: Status.ACTIVE,
            };
          case 's':
            return {
              goal_id,
              status: Status.SUCCEEDED,
            };
        }
      };
    })(goal_id);
    const goal$ = goalStr$.mapTo({
      goal_id,
      goal,
    });
    const expectedValue$ = expectedValueStr$.mapTo(goal);
    const expectedStatus$ = expectedStatusStr$.map(str => toStatus(str));
    const expectedResult$ = expectedResultStr$.mapTo({
      status: {
        goal_id,
        status: Status.SUCCEEDED
      },
      result: 'x',
    });


    const speechSynthesisAction = SpeechSynthesisAction({
      goal: goal$,
      SpeechSynthesis: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    Time.assertEqual(speechSynthesisAction.value, expectedValue$);
    Time.assertEqual(speechSynthesisAction.status, expectedStatus$);
    Time.assertEqual(speechSynthesisAction.result, expectedResult$);

    Time.run(done);
  });
});

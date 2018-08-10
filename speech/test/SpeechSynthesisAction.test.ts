import {mockTimeSource} from '@cycle/time';
import {
  GoalID, Goal, GoalStatus, Status, Result, generateGoalID, initGoal,
} from '@cycle-robot-drivers/action'
import {SpeechSynthesisAction} from '../src/SpeechSynthesisAction';

describe('SpeechSynthesisAction', () => {
  it('emits status and results', (done) => {
    const Time = mockTimeSource();

    const goalT$ =           Time.diagram(`---x-------|`);
    const events = {
      start:                 Time.diagram(`----x------|`),
      end:                   Time.diagram(`-----x-----|`),
      error:                 Time.diagram(`-----------|`),
    }
    const expectedStatusT$ = Time.diagram(`---pas-----|`);
    const expectedResultT$ = Time.diagram(`-----x-----|`);

    const goal_id = generateGoalID();
    const goal$ = goalT$.map(trigger => {
      return {
        goal_id,
        goal: {text: 'Hello world!'}
      }
    });
    const expectedStatus$ = expectedStatusT$.map(trigger => {
      switch (trigger) {
        case 'p':
          return {
            goal_id,
            status: Status.PENDING
          }
        case 'a':
          return {
            goal_id,
            status: Status.ACTIVE
          }
        case 's':
          return {
            goal_id,
            status: Status.SUCCEEDED
          }
      }
    });
    const expectedResult$ = expectedResultT$.mapTo({
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

    speechSynthesisAction.value.addListener({
      next: data => console.warn('value', data),
    });

    Time.assertEqual(speechSynthesisAction.status, expectedStatus$);
    Time.assertEqual(speechSynthesisAction.result, expectedResult$);

    Time.run(done);
  });
});

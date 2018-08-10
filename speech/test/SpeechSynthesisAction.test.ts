import xs from 'xstream'
import {mockTimeSource} from '@cycle/time';
import {
  GoalID, Goal, GoalStatus, Status, Result, generateGoalID, initGoal,
} from '@cycle-robot-drivers/action'
import {SpeechSynthesisAction} from '../src/SpeechSynthesisAction';


console.debug = jest.fn();  // hide debug outputs

const createToStatusFnc = (goal_id) => {
  return (str) => {
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

const createToGoalFnc = (goal_ids: GoalID[], goals: any[]) => {
  if (goal_ids.length !== goals.length)
    throw new Error('goal_ids.length !== goals.length');
  return (num) => {
    return goal_ids[num] ? {
      goal_id: goal_ids[num],
      goal: goals[num],
    } : null;
  };
};


describe('SpeechSynthesisAction', () => {
  it('walks through "happy path"', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalStr$ =           Time.diagram(`-x---|`);
    const events = {
      start:                   Time.diagram(`--x--|`),
      end:                     Time.diagram(`---x-|`),
      error:                   Time.diagram(`-----|`),
    }
    const expectedValueStr$ =  Time.diagram(`-x---|`);
    const expectedStatusStr$ = Time.diagram(`-das-|`);
    const expectedResultStr$ = Time.diagram(`---x-|`);

    // update strings to proper inputs
    const goal = {text: 'Hello'};
    const goal_id = generateGoalID();
    const toStatus = createToStatusFnc(goal_id);
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

  it('cancels the first goal on receiving a second goal', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalNum$ =           Time.diagram(`-0--1---|`);
    const events = {
      start:                   Time.diagram(`--x--x--|`),
      end:                     Time.diagram(`----x-x-|`),
      error:                   Time.diagram(`--------|`),
    };
    const expecteds = [{
      value:                   Time.diagram(`-0--x---|`),
      status:                  Time.diagram(`-da-p---|`),
    }, {
      value:                   Time.diagram(`----1---|`),
      status:                  Time.diagram(`----das-|`),
    }];

    // update strings to proper inputs
    const goal_ids = [generateGoalID(), generateGoalID()];
    const goals = [{text: 'Hello'}, {text: 'World'}];
    const toGoal = createToGoalFnc(goal_ids, goals);
    const goal$ = goalNum$.map(num => toGoal(num));
    expecteds.map((expected, i) => {
      expected.value = expected.value.map(num => goals[num]);
      const toStatus = createToStatusFnc(goal_ids[i]);
      expected.status = expected.status.map(str => toStatus(str));
    });
    const expectedValue$ = xs.merge(expecteds[0].value, expecteds[1].value);
    const expectedStatus$ = xs.merge(expecteds[0].status, expecteds[1].status);
    // const expectedResult$ = xs.merge(expecteds[0].status, expecteds[1].status);


    const speechSynthesisAction = SpeechSynthesisAction({
      goal: goal$,
      SpeechSynthesis: {
        events: (eventName) => {
          return events[eventName];
        }
      }
    });

    speechSynthesisAction.result.addListener({
      next: data => console.log('result', data)
    });

    Time.assertEqual(speechSynthesisAction.value, expectedValue$);
    Time.assertEqual(speechSynthesisAction.status, expectedStatus$);

    Time.run(done);
  });
});

import xs from 'xstream'
import {mockTimeSource} from '@cycle/time';
import {
  GoalID, GoalStatus, Status,
  generateGoalID,
} from '@cycle-robot-drivers/action'
import {SpeechSynthesisAction} from '../src/SpeechSynthesisAction';


// console.debug = jest.fn();  // hide debug outputs

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
      result: toStatus(str).status === 'PREEMPTED' ? null : 'x',
    }));

    // Run test
    Time.assertEqual(speechSynthesisAction.output, expectedOutput$);
    Time.assertEqual(speechSynthesisAction.result, expectedResult$);

    Time.run(done);
  });

  it('does nothing on initial cancel', (done) => {
    const Time = mockTimeSource();

    // Create test input streams with time
    const goalMark$ =        Time.diagram(`-x-|`);
    const events = {
      start:                 Time.diagram(`---|`),
      end:                   Time.diagram(`---|`),
    }
    const expectedOutput$ =  Time.diagram(`---|`);
    const expectedResult$ =  Time.diagram(`---|`);

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

  // it('does nothing on cancel after succeeded', (done) => {
  //   const Time = mockTimeSource();

  //   // Create test input streams with time
  //   const goalNum$ =           Time.diagram(`-0--1-|`);
  //   const events = {
  //     start:                   Time.diagram(`--x---|`),
  //     end:                     Time.diagram(`---x--|`),
  //     error:                   Time.diagram(`------|`),
  //   }
  //   const expectedValueNum$ =  Time.diagram(`-0----|`);
  //   const expectedStatusStr$ = Time.diagram(`-das--|`);
  //   const expectedResultStr$ = Time.diagram(`---s--|`);

  //   // Create the action to test
  //   const goal = {text: 'Hello'};
  //   const goal_id = generateGoalID();
  //   const goals = [{goal, goal_id}, null];
  //   const goal$ = goalNum$.map(i => goals[i]);
  //   const speechSynthesisAction = SpeechSynthesisAction({
  //     goal: goal$,
  //     SpeechSynthesis: {
  //       events: (eventName) => {
  //         return events[eventName];
  //       }
  //     }
  //   });

  //   // Prepare expected values
  //   const values = [goal, null];
  //   const toStatus = createToStatusFnc(goal_id);
  //   const expectedValue$ = expectedValueNum$.map(i => values[i]);
  //   const expectedStatus$ = expectedStatusStr$.map(str => toStatus(str));
  //   const expectedResult$ = expectedResultStr$.map(str => ({
  //     status: toStatus(str),
  //     result: toStatus(str).status === 'PREEMPTED' ? null : 'x',
  //   }));

  //   // Run test
  //   Time.assertEqual(speechSynthesisAction.value, expectedValue$);
  //   Time.assertEqual(speechSynthesisAction.status, expectedStatus$);
  //   Time.assertEqual(speechSynthesisAction.result, expectedResult$);

  //   Time.run(done);
  // });

  // it('does nothing on cancel after preempted', (done) => {
  //   const Time = mockTimeSource();

  //   // Create test input streams with time
  //   const goalNum$ =           Time.diagram(`-0-1-1-|`);
  //   const events = {
  //     start:                   Time.diagram(`--x----|`),
  //     end:                     Time.diagram(`----x--|`),
  //     error:                   Time.diagram(`-------|`),
  //   }
  //   const expectedValueNum$ =  Time.diagram(`-0-1---|`);
  //   const expectedStatusStr$ = Time.diagram(`-da-p--|`);
  //   const expectedResultStr$ = Time.diagram(`----p--|`);

  //   // Create the action to test
  //   const goal = {text: 'Hello'};
  //   const goal_id = generateGoalID();
  //   const goals = [{goal, goal_id}, null];
  //   const goal$ = goalNum$.map(i => goals[i]);
  //   const speechSynthesisAction = SpeechSynthesisAction({
  //     goal: goal$,
  //     SpeechSynthesis: {
  //       events: (eventName) => {
  //         return events[eventName];
  //       }
  //     }
  //   });

  //   // Prepare expected values
  //   const values = [goal, null];
  //   const toStatus = createToStatusFnc(goal_id);
  //   const expectedValue$ = expectedValueNum$.map(i => values[i]);
  //   const expectedStatus$ = expectedStatusStr$.map(str => toStatus(str));
  //   const expectedResult$ = expectedResultStr$.map(str => ({
  //     status: toStatus(str),
  //     result: toStatus(str).status === 'PREEMPTED' ? null : 'x',
  //   }));

  //   // Run test
  //   Time.assertEqual(speechSynthesisAction.value, expectedValue$);
  //   Time.assertEqual(speechSynthesisAction.status, expectedStatus$);
  //   Time.assertEqual(speechSynthesisAction.result, expectedResult$);

  //   Time.run(done);
  // });

  // it('cancels the first goal on receiving a second goal', (done) => {
  //   const Time = mockTimeSource();

  //   // Create test input streams with time
  //   const goalNum$ =           Time.diagram(`-0--1-----|`);
  //   const events = {
  //     start:                   Time.diagram(`--x---x---|`),
  //     end:                     Time.diagram(`-----x--x-|`),
  //     error:                   Time.diagram(`----------|`),
  //   };
  //   const expecteds = [{
  //     value:                   Time.diagram(`-0--x-----|`),
  //     status:                  Time.diagram(`-da--p----|`),
  //     result:                  Time.diagram(`-----p----|`),
  //   }, {
  //     value:                   Time.diagram(`-----1----|`),
  //     status:                  Time.diagram(`-----da-s-|`),
  //     result:                  Time.diagram(`--------s-|`),
  //   }];

  //   // Create the action to test
  //   const goal_ids = [generateGoalID(), generateGoalID()];
  //   const goals = [{text: 'Hello'}, {text: 'World'}];
  //   const goal$ = goalNum$.map(i => ({
  //     goal_id: goal_ids[i],
  //     goal: goals[i],
  //   }));
  //   const speechSynthesisAction = SpeechSynthesisAction({
  //     goal: goal$,
  //     SpeechSynthesis: {
  //       events: (eventName) => {
  //         return events[eventName];
  //       }
  //     }
  //   });

  //   // Prepare expected values
  //   expecteds.map((expected, i) => {
  //     expected.value = expected.value.map(j => goals[j] ? goals[j] : null);
  //     const toStatus = createToStatusFnc(goal_ids[i]);
  //     expected.status = expected.status.map(str => toStatus(str));
  //     expected.result = expected.result.map(str => ({
  //       status: toStatus(str),
  //       result: toStatus(str).status === 'PREEMPTED' ? null : 'x',
  //     }));
  //   });
  //   const expectedValue$ = xs.merge(expecteds[0].value, expecteds[1].value);
  //   const expectedStatus$ = xs.merge(expecteds[0].status, expecteds[1].status);
  //   const expectedResult$ = xs.merge(expecteds[0].result, expecteds[1].result);

  //   // Run test
  //   Time.assertEqual(speechSynthesisAction.value, expectedValue$);
  //   Time.assertEqual(speechSynthesisAction.status, expectedStatus$);
  //   Time.assertEqual(speechSynthesisAction.result, expectedResult$);

  //   Time.run(done);
  // });
});

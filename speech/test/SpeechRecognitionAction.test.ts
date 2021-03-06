import xs from "xstream";
import { mockTimeSource } from "@cycle/time";
import { withState } from "@cycle/state";
import {
  GoalID,
  GoalStatus,
  Status,
  generateGoalID
} from "@cycle-robot-drivers/action";
import { SpeechRecognitionAction as Action } from "../src/SpeechRecognitionAction";

console.debug = jest.fn(); // hide debug outputs

function createToStatus(goal_id: GoalID) {
  return function(str: string): GoalStatus {
    switch (str) {
      case "a":
        return {
          goal_id,
          status: Status.ACTIVE
        };
      case "p":
        return {
          goal_id,
          status: Status.PREEMPTED
        };
      case "s":
        return {
          goal_id,
          status: Status.SUCCEEDED
        };
    }
  };
}

describe("SpeechRecognitionAction", () => {
  it('walks through "happy path"', done => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ = Time.diagram(`-x----|`);
    const events = {
      start: Time.diagram(`--x---|`),
      end: Time.diagram(`----x-|`),
      result: Time.diagram(`---x--|`),
      error: Time.diagram(`------|`)
    };
    const expectedOutputMark$ = Time.diagram(`-x`);
    const expectedResultMark$ = Time.diagram(`----s`);

    // Create the action to test
    const goal = {};
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal
    });
    const transcript = "Hello there";
    events.result = events.result.map(r => ({
      results: [[{ transcript }]]
    }));
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      SpeechRecognition: {
        events: eventName => {
          return events[eventName];
        }
      }
    });

    // Prepare expected values
    const toStatus = createToStatus(goal_id);
    const expectedOutput$ = expectedOutputMark$.mapTo(goal);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: transcript
    }));

    // Run test
    Time.assertEqual(sinks.SpeechRecognition, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it("cancels a running goal on cancel", done => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ = Time.diagram(`-x-----|`);
    const cancel$ = Time.diagram(`---x---|`);
    const events = {
      start: Time.diagram(`--x----|`),
      end: Time.diagram(`-----x-|`),
      result: Time.diagram(`-------|`),
      error: Time.diagram(`----x--|`)
    };
    const expectedOutputMark$ = Time.diagram(`-0-1`);
    const expectedResultMark$ = Time.diagram(`-----p`);

    // Create the action to test
    const goal = {};
    const goal_id = generateGoalID();
    const goal$ = goalMark$.map(i => ({
      goal_id,
      goal
    }));
    const transcript = "Jello there?";
    events.result = events.result.map(r => ({
      results: [[{ transcript }]]
    }));
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$.mapTo(null),
      SpeechRecognition: {
        events: eventName => {
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
      result: null
    }));

    // Run test
    Time.assertEqual(sinks.SpeechRecognition, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it("does nothing on cancel after succeeded", done => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ = Time.diagram(`-x-----|`);
    const cancel$ = Time.diagram(`-----x-|`);
    const events = {
      start: Time.diagram(`--x----|`),
      end: Time.diagram(`----x--|`),
      result: Time.diagram(`---x---|`),
      error: Time.diagram(`-------|`)
    };
    const expectedOutputMark$ = Time.diagram(`-0`);
    const expectedResultMark$ = Time.diagram(`----s`);

    // Create the action to test
    const goal = {};
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal
    });
    const transcript = "Yellow there!";
    events.result = events.result.map(r => ({
      results: [[{ transcript }]]
    }));
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$.mapTo(null),
      SpeechRecognition: {
        events: eventName => {
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
      result: transcript
    }));

    // Run test
    Time.assertEqual(sinks.SpeechRecognition, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it("does nothing on cancel after preempted", done => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ = Time.diagram(`-x------|`);
    const cancel$ = Time.diagram(`---x--x-|`);
    const events = {
      start: Time.diagram(`--x-----|`),
      end: Time.diagram(`-----x--|`),
      result: Time.diagram(`--------|`),
      error: Time.diagram(`----x---|`)
    };
    const expectedOutputMark$ = Time.diagram(`-0-1`);
    const expectedResultMark$ = Time.diagram(`-----p`);

    // Create the action to test
    const goal = {};
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal
    });
    const transcript = "Fellow there%";
    events.result = events.result.map(r => ({
      results: [[{ transcript }]]
    }));
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$.mapTo(null),
      SpeechRecognition: {
        events: eventName => {
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
      result: null
    }));

    // Run test
    Time.assertEqual(sinks.SpeechRecognition, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it("cancels the first goal on receiving a second goal", done => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ = Time.diagram(`-0--1-------|`);
    const events = {
      start: Time.diagram(`--x-----x---|`),
      end: Time.diagram(`------x---x-|`),
      result: Time.diagram(`---------x--|`),
      error: Time.diagram(`-----x------|`)
    };
    const expecteds = [
      {
        output: Time.diagram(`-0--x-------|`),
        result: Time.diagram(`------p-----|`)
      },
      {
        output: Time.diagram(`------1`),
        result: Time.diagram(`----------s`)
      }
    ];

    // Create the action to test
    const goal_ids = [generateGoalID(), generateGoalID()];
    const goals = [{}, {}];
    const goal$ = goalMark$.map(i => ({
      goal_id: goal_ids[i],
      goal: goals[i]
    }));
    const transcript = "Mellow there~";
    events.result = events.result.map(r => ({
      results: [[{ transcript }]]
    }));
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      SpeechRecognition: {
        events: eventName => {
          return events[eventName];
        }
      }
    });

    // Prepare expected values
    expecteds.map((expected, i) => {
      expected.output = expected.output.map(j => (goals[j] ? goals[j] : null));
      const toStatus = createToStatus(goal_ids[i]);
      expected.result = expected.result.map(str => ({
        status: toStatus(str),
        result: toStatus(str).status === Status.SUCCEEDED ? transcript : null
      }));
    });
    const expectedOutput$ = xs.merge(expecteds[0].output, expecteds[1].output);
    const expectedResult$ = xs.merge(expecteds[0].result, expecteds[1].result);

    // Run test
    Time.assertEqual(sinks.SpeechRecognition, expectedOutput$);
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });
});

import xs from "xstream";
import { mockDOMSource } from "@cycle/dom";
import { mockTimeSource } from "@cycle/time";
import { withState } from "@cycle/state";
import {
  GoalID,
  GoalStatus,
  Status,
  generateGoalID
} from "@cycle-robot-drivers/action";
import { SpeechbubbleAction as Action } from "../src/SpeechbubbleAction";

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

describe("SpeechbubbleAction", () => {
  it('walks through "happy path"', done => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ = Time.diagram(`-x-|`);
    const expectedResultMark$ = Time.diagram(``);

    // Create the action to test
    const goal = "Hello world";
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      DOM: mockDOMSource({})
    });

    // Prepare expected values
    const toStatus = createToStatus(goal_id);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null
    }));

    // Run test
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it("cancels a running goal on cancel", done => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ = Time.diagram(`-x---|`);
    const cancel$ = Time.diagram(`---x-|`);
    const expectedResultMark$ = Time.diagram(`---p`);

    // Create the action to test
    const goal = "Hello world";
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$.mapTo(null),
      DOM: mockDOMSource({})
    });

    // Prepare expected values
    const toStatus = createToStatus(goal_id);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null
    }));

    // Run test
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it("does nothing on initial cancel", done => {
    const Time = mockTimeSource();

    // Create test input streams
    const cancel$ = Time.diagram(`-x-|`);
    const expectedResult$ = Time.diagram(``);

    // Create the action to test
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: xs.never(),
      cancel: cancel$.mapTo(null),
      DOM: mockDOMSource({})
    });

    // Run test
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it("does nothing on cancel after preempted", done => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ = Time.diagram(`-x-----|`);
    const cancel$ = Time.diagram(`---x-x-|`);
    const expectedResultMark$ = Time.diagram(`---p`);

    // Create the action to test
    const goal = "Hello world";
    const goal_id = generateGoalID();
    const goal$ = goalMark$.mapTo({
      goal_id,
      goal
    });
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      cancel: cancel$.mapTo(null),
      DOM: mockDOMSource({})
    });

    // Prepare expected values
    const toStatus = createToStatus(goal_id);
    const expectedResult$ = expectedResultMark$.map(str => ({
      status: toStatus(str),
      result: null
    }));

    // Run test
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });

  it("cancels the first goal on receiving a second goal", done => {
    const Time = mockTimeSource();

    // Create test input streams
    const goalMark$ = Time.diagram(`-0--1-|`);
    const expecteds = [
      {
        result: Time.diagram(`----p-|`)
      },
      {
        result: Time.diagram(``)
      }
    ];

    // Create the action to test
    const goal_ids = [generateGoalID(), generateGoalID()];
    const goals = ["Hello", "World"];
    const goal$ = goalMark$.map(i => ({
      goal_id: goal_ids[i],
      goal: goals[i]
    }));
    const sinks = withState((sources: any) => {
      return Action(sources);
    })({
      goal: goal$,
      DOM: mockDOMSource({})
    });

    // Prepare expected values
    expecteds.map((expected, i) => {
      const toStatus = createToStatus(goal_ids[i]);
      expected.result = expected.result.map(str => ({
        status: toStatus(str),
        result: null
      }));
    });
    const expectedResult$ = xs.merge(expecteds[0].result, expecteds[1].result);

    // Run test
    Time.assertEqual(sinks.result, expectedResult$);

    Time.run(done);
  });
});

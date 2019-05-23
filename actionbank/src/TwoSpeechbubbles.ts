import xs, { Stream } from "xstream";
import { div, span } from "@cycle/dom";
import isolate from "@cycle/isolate";
import {
  Goal,
  GoalID,
  createConcurrentAction,
  selectActionResult
} from "@cycle-robot-drivers/action";
import { createSpeechbubbleAction } from "@cycle-robot-drivers/screen";

export function createTwoSpeechbubbles({
  styles = {}
}: {
  styles?: {
    speechbubblesOuter?: object;
    speechbubbleOuter?: object;
    robotSpeechbubble?: object;
    humanSpeechbubble?: object;
  };
} = {}) {
  styles = {
    speechbubblesOuter: {
      position: "absolute",
      width: "96vw",
      zIndex: 3, // eyelid has zIndex of 2
      margin: "2vw",
      backgroundColor: "white",
      border: "0.2vmin solid lightgray",
      borderRadius: "3vmin 3vmin 3vmin 3vmin",
      ...styles.speechbubblesOuter
    },
    speechbubbleOuter: {
      margin: 0,
      padding: "1em",
      maxWidth: "100%",
      textAlign: "center",
      ...styles.speechbubbleOuter
    }
  };

  const RobotSpeechbubbleAction = createSpeechbubbleAction(
    styles.robotSpeechbubble
  );
  const HumanSpeechbubbleAction = createSpeechbubbleAction(
    styles.humanSpeechbubble
  );

  const TwoSpeechbubbles = sources => {
    sources.state.stream.addListener({
      next: s => console.debug("reducer state", s)
    });

    // Define concurrent actions
    const AllAction = createConcurrentAction(
      ["RobotSpeechbubbleAction", "HumanSpeechbubbleAction"],
      false
    );
    const allSinks: any = isolate(AllAction, "TwoSpeechbubblesAllAction")({
      state: sources.state,
      goal: sources.TwoSpeechbubblesAllAction.goal,
      cancel: sources.TwoSpeechbubblesAllAction.cancel,
      RobotSpeechbubbleAction: {
        result: sources.state.stream.compose(
          selectActionResult("RobotSpeechbubbleAction")
        )
      },
      HumanSpeechbubbleAction: {
        result: sources.state.stream.compose(
          selectActionResult("HumanSpeechbubbleAction")
        )
      }
    });

    const RaceAction = createConcurrentAction(
      ["RobotSpeechbubbleAction", "HumanSpeechbubbleAction"],
      true
    );
    const raceSinks: any = isolate(RaceAction, "TwoSpeechbubblesRaceAction")({
      state: sources.state,
      goal: sources.TwoSpeechbubblesRaceAction.goal,
      cancel: sources.TwoSpeechbubblesRaceAction.cancel,
      RobotSpeechbubbleAction: {
        result: sources.state.stream.compose(
          selectActionResult("RobotSpeechbubbleAction")
        )
      },
      HumanSpeechbubbleAction: {
        result: sources.state.stream
          .compose(selectActionResult("HumanSpeechbubbleAction"))
          .debug(r => console.error(r))
      }
    });

    // Define speechbubble actions
    const robotSpeechbubbleAction: any = isolate(
      RobotSpeechbubbleAction,
      "RobotSpeechbubbleAction"
    )({
      goal: xs.merge(
        allSinks.RobotSpeechbubbleAction.goal,
        raceSinks.RobotSpeechbubbleAction.goal
      ) as Stream<Goal>,
      cancel: xs.merge(
        allSinks.RobotSpeechbubbleAction.cancel,
        raceSinks.RobotSpeechbubbleAction.cancel
      ) as Stream<GoalID>,
      DOM: sources.DOM,
      state: sources.state
    });
    const humanSpeechbubbleAction: any = isolate(
      HumanSpeechbubbleAction,
      "HumanSpeechbubbleAction"
    )({
      state: sources.state,
      goal: xs.merge(
        allSinks.HumanSpeechbubbleAction.goal,
        raceSinks.HumanSpeechbubbleAction.goal
      ) as Stream<Goal>,
      cancel: xs.merge(
        allSinks.HumanSpeechbubbleAction.cancel,
        raceSinks.HumanSpeechbubbleAction.cancel
      ) as Stream<GoalID>,
      DOM: sources.DOM
    });

    // Define sinks
    const vdom$ = xs
      .combine(
        robotSpeechbubbleAction.DOM.startWith(""),
        humanSpeechbubbleAction.DOM.startWith("")
      )
      .map(([robotVTree, humanVTree]) =>
        robotVTree === "" && humanVTree === ""
          ? ""
          : robotVTree !== "" && humanVTree === ""
          ? div({ style: styles.speechbubblesOuter }, [
              div({ style: styles.speechbubbleOuter }, [span(robotVTree)])
            ])
          : robotVTree !== "" && humanVTree === ""
          ? div({ style: styles.speechbubblesOuter }, [
              div({ style: styles.speechbubbleOuter }, [span(humanVTree)])
            ])
          : div({ style: styles.speechbubblesOuter }, [
              div({ style: styles.speechbubbleOuter }, [span(robotVTree)]),
              div({ style: styles.speechbubbleOuter }, [span(humanVTree)])
            ])
      );

    const reducer$ = xs.merge(
      robotSpeechbubbleAction.state,
      humanSpeechbubbleAction.state,
      allSinks.state,
      raceSinks.state
    );

    return {
      DOM: vdom$,
      state: reducer$
    };
  };

  return TwoSpeechbubbles;
}

export let TwoSpeechbubbles = createTwoSpeechbubbles();

import xs from 'xstream';
import delay from 'xstream/extra/delay';
import dropRepeats from 'xstream/extra/dropRepeats';
import pairwise from 'xstream/extra/pairwise';
import isolate from '@cycle/isolate';
import {
  SpeakWithScreenAction, selectActionResult
} from '@cycle-robot-drivers/actionbank';
import {Status, isEqualGoal, initGoal} from '@cycle-robot-drivers/action';
import {FlowchartAction} from './FlowchartAction';

// FSM types
export enum S {
  WAIT = 'WAIT',
  ENGAGE = 'ENGAGE',
  MAINTAIN = 'MAINTAIN',
  DISENGAGE = 'DISENGAGE',
}

export enum SIGType {
  FOUND_PERSON = 'FOUND_PERSON',
  LOST_PERSON = 'LOST_PERSON',
  ENGAGE_DONE = 'ENGAGE_DONE',
  MAINTAIN_DONE = 'MAINTAIN_DONE',
}

export type SIG = {
  type: SIGType,
  value?: any,
}

function input(
  poses$,
  monologueResult$,
  flowchartResult$,
) {
  return xs.merge(
    poses$
      .map(poses => poses.length)
      .compose(pairwise)
      .filter(([prev, cur]) => prev !== cur)
      .map(([prev, cur]) => {
        if (prev < cur) {
          return {type: SIGType.FOUND_PERSON};
        } else if (prev > cur) {
          return {type: SIGType.LOST_PERSON};
        }
      }),
    monologueResult$
      .filter(r => r.status.status === Status.SUCCEEDED)
      .mapTo({type: SIGType.ENGAGE_DONE}),
    flowchartResult$.mapTo({type: SIGType.MAINTAIN_DONE}),
  );
}

function reducer(input$) {
  const initReducer = xs.of((prev) => {
    if (typeof prev === 'undefined') {
      return {
        state: S.WAIT,
        outputs: null,
      };
    } else {
      return prev;
    }
  });

  const goal = initGoal({
    "flowchart": [
      {
        "id": "470999b3-1110-4588-8346-2458caddd9ae",
        "type": "MONOLOGUE",
        "arg": "PRAY",
        "next": "d79a76ec-2cba-4e62-905a-3006c41dc939"
      },
      {
        "id": "d79a76ec-2cba-4e62-905a-3006c41dc939",
        "type": "QUESTION_ANSWER",
        "arg": {"question": "Did it work?", "answers": ["Yes", "No"]},
        "next": [
          "c00b7cd3-d0b8-47b6-8eaa-1eb7919dae92",
          "126628a0-7a4e-4175-ac1c-a4fb680edecb"
        ]
      },
      {
        "id": "c00b7cd3-d0b8-47b6-8eaa-1eb7919dae92",
        "type": "MONOLOGUE",
        "arg": "PRAISE THE LORD"
      },
      {
        "id": "126628a0-7a4e-4175-ac1c-a4fb680edecb",
        "type": "MONOLOGUE",
        "arg": "God works in mysterious ways"
      }
    ],
    "start_id": "470999b3-1110-4588-8346-2458caddd9ae"
  });

  const transitionReducer = input$.map(input => prev => {
    console.debug('input', input, 'prev', prev);
    if (prev.state === S.WAIT && input.type === SIGType.FOUND_PERSON) {
      return {
        ...prev,
        state: S.ENGAGE,
        outputs: {
          MonologueAction: {goal: initGoal('Hello there!')},
        },
      };
    } else if (prev.state === S.WAIT && input.type === SIGType.ENGAGE_DONE) {
      return {
        ...prev,
        outputs: {
          MonologueAction: {goal: null},
        },
      };
    } else if (
      prev.state === S.ENGAGE && input.type === SIGType.ENGAGE_DONE
    ) {
      return {
        ...prev,
        state: S.MAINTAIN,
        outputs: {
          FlowchartAction: {goal},
        },
      };
    } else if (
      prev.state === S.ENGAGE && input.type === SIGType.LOST_PERSON
    ) {
      return {
        ...prev,
        state: S.WAIT,
        outputs: {
          MonologueAction: {goal: initGoal('Bye now!')},
        },
      };
    } else if (
      prev.state === S.MAINTAIN && input.type === SIGType.LOST_PERSON
    ) {
      return {
        ...prev,
        state: S.WAIT,
        outputs: {
          MonologueAction: {goal: initGoal('Bye now!')},
          FlowchartAction: {goal: null},
        },
      };
    }
    return prev;
  });

  return xs.merge(initReducer, transitionReducer);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(m => !!m.outputs)
    .map(m => m.outputs);
  return {
    result: outputs$
      .filter(o => !!o.result)
      .map(o => o.result),
    MonologueAction: outputs$
      .filter(o => !!o.MonologueAction)
      .map(o => o.MonologueAction.goal)
      .compose(dropRepeats(isEqualGoal)),
    FlowchartAction: outputs$
      .filter(o => !!o.FlowchartAction)
      .map(o => o.FlowchartAction.goal)
      .compose(dropRepeats(isEqualGoal)),
  };
};

export default function EngagementManagement(sources) {
  const reducerState$ = sources.state.stream;
  const outputs = output(reducerState$)
  const mnSinks = isolate(SpeakWithScreenAction, 'SpeakWithScreenAction')({
    goal: outputs.MonologueAction,
    TwoSpeechbubblesAction: {result: sources.TwoSpeechbubblesAction.result},
    SpeechSynthesisAction: {result: sources.SpeechSynthesisAction.result},
    state: sources.state,
  });
  const fcSinks = isolate(FlowchartAction, 'FlowchartAction')({
    goal: outputs.FlowchartAction,
    TwoSpeechbubblesAction: {result: sources.TwoSpeechbubblesAction.result},
    SpeechSynthesisAction: {result: sources.SpeechSynthesisAction.result},
    SpeechRecognitionAction: {result: sources.SpeechRecognitionAction.result},
    state: sources.state,
  });

  const input$ = input(
    sources.PoseDetection.poses,
    sources.SpeechSynthesisAction.result,
    fcSinks.result,
  );
  const parentReducer$ = reducer(input$);
  const reducer$ = xs.merge(parentReducer$, mnSinks.state, fcSinks.state);

  const twoSpeechbubblesGoal$ = xs.merge(
    fcSinks.TwoSpeechbubblesAction, mnSinks.TwoSpeechbubblesAction);
  const speechSynthesisGoal$ = xs.merge(
    fcSinks.SpeechSynthesisAction, mnSinks.SpeechSynthesisAction);
  const sinks = {
    TwoSpeechbubblesAction: twoSpeechbubblesGoal$,
    SpeechSynthesisAction: speechSynthesisGoal$,
    SpeechRecognitionAction: fcSinks.SpeechRecognitionAction,
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
    state: reducer$,
  };
  return sinks;
}

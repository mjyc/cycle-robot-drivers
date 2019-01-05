import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import pairwise from 'xstream/extra/pairwise';
import isolate from '@cycle/isolate';
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
}

export type SIG = {
  type: SIGType,
  value?: any,
}

function input(
  poses$,
  speechSynthesisResult$,
) {
  return xs.merge(
    speechSynthesisResult$
      .filter(r => r.status.status === Status.SUCCEEDED)
      .mapTo({type: SIGType.ENGAGE_DONE}),
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
  );
}

function reducer(input$) {
  const initReducer = xs.of((prev) => {
    if (typeof prev === 'undefined') {
      return {
        state: S.WAIT,
        variables: null,
        outputs: null,
      };
    } else {
      return prev;
    }
  });

  const transitionReducer = input$.map(input => prev => {
    console.debug('input', input, 'prev', prev);
    if (prev.state === S.WAIT && input.type === SIGType.FOUND_PERSON) {
      return {
        ...prev,
        state: S.ENGAGE,
        variables: null,
        outputs: {
          SpeechSynthesisAction: {goal: initGoal('Hello there!')},
        },
      };
    } else if (
      prev.state === S.ENGAGE && input.type === SIGType.ENGAGE_DONE
    ) {
      return {
        ...prev,
        state: S.MAINTAIN,
        variables: null,
        outputs: null,
      };
    } else if (
      prev.state === S.MAINTAIN && input.type === SIGType.LOST_PERSON
    ) {
      return {
        ...prev,
        state: S.WAIT,
        variables: null,
        outputs: {
          SpeechSynthesisAction: {goal: initGoal('Bye now!')}
        },
      };
    }
    return prev;
  });

  return xs.merge(initReducer, transitionReducer);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .debug()
    .filter(m => !!m.outputs)
    .map(m => m.outputs);
  return {
    result: outputs$
      .filter(o => !!o.result)
      .map(o => o.result),
    SpeechSynthesisAction: outputs$
      .filter(o => !!o.SpeechSynthesisAction)
      .map(o => o.SpeechSynthesisAction.goal)
      .compose(dropRepeats(isEqualGoal)),
  };
}

export default function EngagementManagement(sources) {
  const input$ = input(
    sources.PoseDetection.poses,
    sources.SpeechSynthesisAction.result,
  );
  const parentReducer$ = reducer(input$);
  const reducerState$ = sources.state.stream;
  const outputs = output(reducerState$)

  const fcSinks = isolate(FlowchartAction, 'FlowchartAction')({
    goal: xs.never(),
    TwoSpeechbubblesAction: {result: sources.TwoSpeechbubblesAction.result},
    SpeechSynthesisAction: {result: sources.SpeechSynthesisAction.result},
    SpeechRecognitionAction: {result: sources.SpeechRecognitionAction.result},
    state: sources.state,
  });
  const reducer$ = xs.merge(parentReducer$, fcSinks.state);

  return {
    ...outputs,
    state: reducer$,  // outReducer$
  }
}

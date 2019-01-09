import xs from 'xstream';
import delay from 'xstream/extra/delay';
import dropRepeats from 'xstream/extra/dropRepeats';
import {parser} from './utils';
import {Status, isEqualGoal, initGoal} from '@cycle-robot-drivers/action';


function interp(tree) {
  if (tree.type === 'started') {
    return tree;
  } else if (tree.type === 'speakDone') {
    return tree;
  } else if (tree.type === 'askQuestionDone') {
    return tree;
  } else if (tree.type === 'input') {
    return interp(tree.value);
  } else if (tree.type === 'speak') {
    return {SpeechSynthesisAction: {goal: initGoal(tree.value)}};
  } else if (tree.type === 'askQuestion') {
    return {TwoSpeechbubblesAction: {goal: initGoal({
      message: tree.value[0],
      choices: [tree.value[1]],  // done
    })}};
  } else if (tree.type === 'actions') {
    return {outputs: interp(tree.value[0])};  // TODO: support arrays
  } else if (tree.type === 'state') {
    return tree.value;
  } else if (tree.type === 'transition') {
    return (prev, input) =>
      (prev.s === interp(tree.value[0]) && input.type === interp(tree.value[1]).type)
        ? {
            ...prev,
            s: interp(tree.value[2]),  // TODO: 3 & 2
            o: interp(tree.value[3]).outputs,
          }
        : null;
  } else if (tree.type === 'fsm') {
    return (prev, input) =>
      tree.value.reduceRight((acc, x) => {
        const v = interp(x)(prev, input);
        return !!v ? v : acc;
      }, prev);
  } else {
    return null;
  }
}


function input(
  goal$,
  speechSynthesisResult$,
  twoSpeechbubblesResult$,
) {
  return xs.merge(
    goal$.map(g => ({type: 'goal', value: g})),
    speechSynthesisResult$
      .filter(r => r.status.status === Status.SUCCEEDED)
      .mapTo({type: 'speakDone'}).compose(delay(200)),
    twoSpeechbubblesResult$
      .filter(r => r.status.status === Status.SUCCEEDED)
      .mapTo({type: 'askQuestionDone'}),
  );
}

function reducer(input$) {
  const initReducer$ = xs.of((prev) => {
    if (typeof prev === 'undefined') {
      return {
        s: '',
        o: null,
      };
    } else {
      return prev;
    }
  });

  let trans = null;
  const transitionReducer = input$.map((input) => (prev) => {
    console.debug('input', input, 'prev', prev);

    if (input.type === 'goal') {
      const ast = parser.parse(input.value);
      trans = interp(ast)
      return trans({
        ...prev,
        s: 'START',
        o: null,
      }, {type: 'started', value: null});
    } else if (!!trans) {
      return trans(prev, input);
    }

    return prev;
  });

  return xs.merge(initReducer$, transitionReducer);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(m => !!m.o)
    .map(m => m.o);
  return {
    TwoSpeechbubblesAction: outputs$
      .filter(o => !!o.TwoSpeechbubblesAction)
      .map(o => o.TwoSpeechbubblesAction.goal)
      .compose(dropRepeats(isEqualGoal)),
    SpeechSynthesisAction: outputs$
      .filter(o => !!o.SpeechSynthesisAction)
      .map(o => o.SpeechSynthesisAction.goal)
      .compose(dropRepeats(isEqualGoal)),
  };
}

export default function Robot(sources) {
  const reducerState$ = sources.state.stream;

  const outputs = output(reducerState$);
  const input$ = input(
    sources.goal,
    sources.SpeechSynthesisAction.result,
    sources.TwoSpeechbubblesAction.result,
  );
  const reducer$ = reducer(input$);

  return {
    ...outputs,
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
    state: reducer$,
  };
}
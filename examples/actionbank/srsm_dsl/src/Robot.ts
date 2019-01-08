import xs from 'xstream';
import delay from 'xstream/extra/delay';
import dropRepeats from 'xstream/extra/dropRepeats';
import {parser} from './utils';
import {Status, isEqualGoal, initGoal} from '@cycle-robot-drivers/action';


// const testCode = `
// S1[askQuestion "Hello" "Hi"] -> |askQuestionDone| S2
// S2[speak "hello"] -> |speakDone| S3
// S3[askQuestion "Bye" "Bye"] -> |askQuestionDone| S4
// `;

// const testTree = parser.parse(testCode);

// console.log(testTree);



function interp(tree) {
  if (tree.type === 'speakDone') {
    return tree;
  } else if (tree.type === 'askQuestionDone') {
    return tree;
  } else if (tree.type === 'input') {
    return interp(tree.value);
  } else if (tree.type === 'speak') {
    return {SpeechSynthesisAction: {goal: initGoal(tree.value)}};
  } else if (tree.type === 'askQuestion') {
    return {TwoSpeechbubblesAction: {goal: initGoal({
      question: tree.value[0],
      answers: tree.value[1],
    })}};
  } else if (tree.type === 'action') {
    return {outputs: interp(tree.value)};  // TODO: support arrays
  } else if (tree.type === 'state') {
    return tree.value;
  } else if (tree.type === 'transition') {
    return (prev, input) =>
      (prev.s === interp(tree.value[0]) && input.type === interp(tree.value[2]).type)
        ? {
            ...prev,
            s: interp(tree.value[3]),
            o: interp(tree.value[1]).outputs,
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

// const trans = interp(testTree);

// console.log(trans);


function input(
  goal$,
  speechSynthesisResult$,
  twoSpeechbubblesResult$,
) {
  return xs.merge(
    goal$.map(g => ({type: 'goal', value: g})).debug(),
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
        s: 'S1',
        o: {SpeechSynthesisAction: {goal: initGoal('Hello')}},
      };
    } else {
      return prev;
    }
  });

  const transitionReducer = input$.map((input) => (prev) => {
    console.debug('input', input, 'prev', prev);
    // return trans(prev, input);
    return prev;
  });

  return xs.merge(initReducer$, transitionReducer);
}

function output(reducerState$) {
  const outputs$ = reducerState$
    .filter(m => !!m.o)
    .map(m => m.o);
  return {
    // result: outputs$
    //   .filter(o => !!o.result)
    //   .map(o => o.result)
    //   .compose(dropRepeats(isEqualResult)),
    SpeechSynthesisAction: outputs$
      .filter(o => !!o.SpeechSynthesisAction)
      .map(o => o.SpeechSynthesisAction.goal)
      .compose(dropRepeats(isEqualGoal)),
  };
}

export default function Robot(sources) {

  // sources.goal.addListener({next: v => console.log('clicked!', v)});
  const input$ = input(
    sources.goal,
    // xs.never(),
    sources.SpeechSynthesisAction.result,
    sources.TwoSpeechbubblesAction.result,
  );

  const reducer$ = reducer(input$);

  const reducerState$ = sources.state.stream.debug();
  reducerState$.addListener({next: s => console.warn(s)});
  const outputs = output(reducerState$);

  return {
    ...outputs,
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
    state: reducer$,
  };
}
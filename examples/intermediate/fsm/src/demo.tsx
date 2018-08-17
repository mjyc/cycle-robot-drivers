import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import fromEvent from 'xstream/extra/fromEvent'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {Goal, Result, initGoal} from '@cycle-robot-drivers/action'
import {
  makeSpeechSynthesisDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'
import {makePoseDetectionDriver} from 'cycle-posenet-drivers'

// a random story from https://www.plot-generator.org.uk/story/
const sentences = [
  "Susan Vader had always hated pretty Sidney with its empty, encouraging estuaries.",
  "It was a place where she felt ambivalent.",
  " ",
  "She was a wild, admirable, squash drinker with hairy hands and tall eyelashes. Her friends saw her as a drab, dripping do gooder.",
  "Once, she had even helped a jolly baby bird recover from a flying accident.",
  "That's the sort of woman he was.",
  " ",
  "Susan walked over to the window and reflected on her quiet surroundings.",
  "The sun shone like smiling koalas.",
  " ",
  "Then she saw something in the distance, or rather someone.",
  "It was the figure of Harry Pigeon.",
  "Harry was a splendid muppet with ugly hands and tall eyelashes.",
  " ",
  "Susan gulped.",
  "She was not prepared for Harry.",
  " ",
  "As Susan stepped outside and Harry came closer, she could see the uptight glint in his eye.",
  " ",
  "Harry gazed with the affection of 7125 sympathetic hungry humming birds.",
  "He said, in hushed tones, \"I love you and I want some more Facebook friends.\"",
  " ",
  "Susan looked back, even more lonely and still fingering the solid gun.",
  "\"Harry, I shrunk the kids,\" she replied.",
  " ",
  "They looked at each other with anxious feelings, like two fluttering, fat foxes bouncing at a very energetic carol service, which had reggae music playing in the background and two friendly uncles hopping to the beat.",
  " ",
  "Susan regarded Harry's ugly hands and tall eyelashes.",
  "\"I feel the same way!\" revealed Susan with a delighted grin.",
  " ",
  "Harry looked fuzzy, his emotions blushing like a nasty, new newspaper.",
  " ",
  "Then Harry came inside for a nice beaker of squash.",
  " ",
  "THE END"
];


enum SMStates {
  LOAD = 'LOAD',
  READ = 'READ',
  WAIT = 'WAIT',
  RESUME = 'RESUME',
  DONE = 'DONE',
};

enum SMActions {
  FOUND_PERSON = 'FOUND_PERSON',
  LOST_PERSON = 'LOST_PERSON',
  FINISHED_SPEACKING = 'FINISHED_SPEACKING',
  FINISHED_READING = 'FINISHED_READING',
};

type State = {
  state: SMStates,
  curSentence?: number,
};

type Reducer = (prev?: State) => State | undefined;

type Actions = {
  numPoses$: Stream<number>,
  result$: Stream<Result>,
}


function transition(state: SMStates, action: SMActions) {
  switch (state) {
    case SMStates.LOAD:
      switch (action) {
        case SMActions.FOUND_PERSON:
          return SMStates.READ
        default:
          console.debug(`Invalid action: "${action}"; returning null`);
          return null;
      }
    case SMStates.READ:
      switch (action) {
        case SMActions.LOST_PERSON:
          return SMStates.WAIT
        case SMActions.FINISHED_SPEACKING:
          return SMStates.READ
        case SMActions.FINISHED_READING:
          return SMStates.DONE
        default:
          console.debug(`Invalid action: "${action}"; returning null`);
          return null;
      }
    case SMStates.WAIT:
      switch (action) {
        case SMActions.FOUND_PERSON:
          return SMStates.RESUME
        default:
          console.debug(`Invalid action: "${action}"; returning null`);
          return null;
      }
    case SMStates.RESUME:
      switch (action) {
        case SMActions.FINISHED_SPEACKING:
          return SMStates.READ
        default:
          console.debug(`Invalid action: "${action}"; returning null`);
          return null;
      }
    default:
      console.debug(`Invalid state: "${state}"; returning null`);
      return null;
  }
}

function intent(poses: Stream<any[]>, result: Stream<Result>) {
  const numPoses$ = poses.map(poses => poses.length).compose(dropRepeats())
  return {
    numPoses$,
    result$: result,
  };
}

function model(actions: Actions): Stream<State> {
  const initReducer$ = xs.of(function initReducer(prev) {
    return {
      state: 'LOAD',
      curSentence: 0,
    };
  });

  const numPosesReducer$ = actions.numPoses$
    .map(numPoses => function numPosesReducer(prevState: State): State {
      // action is based on numPoses
      const state = transition(
        prevState.state,
        numPoses === 0 ? SMActions.LOST_PERSON : SMActions.FOUND_PERSON
      );
      if (!!state) {
        return {
          ...prevState,
          state: state,
        }
      } else {
        return prevState;
      }
    });

  const resultReducer$ = actions.result$
    .filter(result => result.status.status === 'SUCCEEDED')
    .map(result => function resultReducer(prevState: State): State {
      // action is based on prevState.curSentence
      const state = transition(
        prevState.state,
        prevState.curSentence === sentences.length - 1
          ? SMActions.FINISHED_READING : SMActions.FINISHED_SPEACKING,
      );
      if (!!state) {
        return {
          ...prevState,
          state,
          curSentence: state === SMStates.READ
            ? prevState.curSentence + 1 : prevState.curSentence,
        };
      } else {
        return prevState;
      }
    });

  return xs.merge(initReducer$, numPosesReducer$, resultReducer$)
    .fold((state: State, reducer: Reducer) => reducer(state), null)
    .drop(1)  // drop "null"
    .compose(dropRepeats());
}

function goal(state: Stream<State>): Stream<Goal> {
  return xs.merge(
    state
      .filter(s => s.state === SMStates.RESUME)
      .mapTo(initGoal({text: 'I\'ll resume the story', rate: 0.8})),
    state
      .filter(s => s.state === SMStates.READ)
      .map(s => initGoal({text: sentences[s.curSentence], rate: 0.8})),
    state
      .filter(s => s.state === SMStates.WAIT)
      .mapTo(null),
  );
}


function main(sources) {
  const goalProxy$ = xs.create();
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: goalProxy$,
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  const actions = intent(sources.PoseDetection.poses,
                         speechSynthesisAction.result);
  const state$ = model(actions);
  const goal$ = goal(state$);
  goalProxy$.imitate(goal$);

  const styles = {code: {"background-color": "#f6f8fa"}}
  const vdom$ = xs.combine(
    sources.PoseDetection.DOM,
    sources.PoseDetection.poses.startWith([]),
    state$,
  ).map(([d, p, s]) => (
    <div>
      <div>
        <h3>State</h3>
        <pre>{JSON.stringify(s, null, 2)}</pre>
      </div>

      <div>
        <h3>Detection outputs</h3>
        {d}
        <pre style={styles.code}>"poses": {JSON.stringify(p, null, 2)}</pre>
      </div>
    </div>
  ));

  return {
    DOM: vdom$,
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
    SpeechSynthesis: speechSynthesisAction.value,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  PoseDetection: makePoseDetectionDriver(),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
  Time: timeDriver,
});

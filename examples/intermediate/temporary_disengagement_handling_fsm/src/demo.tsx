import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {Stream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {Goal, Result, initGoal} from '@cycle-robot-drivers/action'
import {
  makeSpeechSynthesisDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'
import {makePoseDetectionDriver} from 'cycle-posenet-drivers'

// a randomly generated story from https://www.plot-generator.org.uk/story/
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

// enums for finite state machine pattern
enum SMState {
  LOAD = 'LOAD',
  READ = 'READ',
  WAIT = 'WAIT',
  RESUME = 'RESUME',
  DONE = 'DONE',
};

enum SMEvent {
  FOUND_PERSON = 'FOUND_PERSON',
  LOST_PERSON = 'LOST_PERSON',
  FINISHED_SPEACKING = 'FINISHED_SPEACKING',
  FINISHED_READING = 'FINISHED_READING',
};

// types for state reducer pattern
type State = {
  state: SMState,
  curSentenceIndex?: number,
};

type Reducer = (prev?: State) => State | undefined;

type Actions = {
  numPeople$: Stream<number>,
  result$: Stream<Result>,
}

function intent(poses: Stream<any[]>, result: Stream<Result>) {
  const numPeople$ = poses.map(poses => poses.length).compose(dropRepeats())
  return {
    numPeople$,
    result$: result,
  };
}

function transition(state: SMState, action: SMEvent) {
  switch (state) {
    case SMState.LOAD:
      switch (action) {
        case SMEvent.FOUND_PERSON:
          return SMState.READ
        default:
          console.debug(`Invalid action: "${action}"; returning null`);
          return null;
      }
    case SMState.READ:
      switch (action) {
        case SMEvent.LOST_PERSON:
          return SMState.WAIT
        case SMEvent.FINISHED_SPEACKING:
          return SMState.READ
        case SMEvent.FINISHED_READING:
          return SMState.DONE
        default:
          console.debug(`Invalid action: "${action}"; returning null`);
          return null;
      }
    case SMState.WAIT:
      switch (action) {
        case SMEvent.FOUND_PERSON:
          return SMState.RESUME
        default:
          console.debug(`Invalid action: "${action}"; returning null`);
          return null;
      }
    case SMState.RESUME:
      switch (action) {
        case SMEvent.FINISHED_SPEACKING:
          return SMState.READ
        default:
          console.debug(`Invalid action: "${action}"; returning null`);
          return null;
      }
    default:
      console.debug(`Invalid state: "${state}"; returning null`);
      return null;
  }
}

function model(actions: Actions): Stream<State> {
  const initReducer$ = xs.of(function initReducer(prev) {
    return {
      state: 'LOAD',
      curSentenceIndex: 0,
    };
  });

  const numPeopleReducer$ = actions.numPeople$
    .map(numPeople => function numPeopleReducer(prevState: State): State {
      // the edge is based on numPeople
      const state = transition(
        prevState.state,
        numPeople === 0 ? SMEvent.LOST_PERSON : SMEvent.FOUND_PERSON
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
      // the edge is based on prevState.curSentenceIndex
      const state = transition(
        prevState.state,
        prevState.curSentenceIndex === sentences.length - 1
          ? SMEvent.FINISHED_READING : SMEvent.FINISHED_SPEACKING,
      );
      if (!!state) {
        return {
          ...prevState,
          state,
          curSentenceIndex:
            state === SMState.READ && prevState.state !== SSMStateRESUME
            ? prevState.curSentenceIndex + 1 : prevState.curSentenceIndex,
        };
      } else {
        return prevState;
      }
    });

  return xs.merge(initReducer$, numPeopleReducer$, resultReducer$)
    .fold((state: State, reducer: Reducer) => reducer(state), null)
    .drop(1)  // drop "null"
    .compose(dropRepeats());
}

function goal(state: Stream<State>): Stream<Goal> {
  return xs.merge(
    state
      .filter(s => s.state === SMState.RESUME)
      .mapTo(initGoal({text: 'I\'ll resume the story', rate: 0.8})),
    state
      .filter(s => s.state === SMState.READ)
      .map(s => initGoal({text: sentences[s.curSentenceIndex], rate: 0.8})),
    state
      .filter(s => s.state === SMState.WAIT)
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

  const styles = {code: {"background-color": "#f6f8fa"}};
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

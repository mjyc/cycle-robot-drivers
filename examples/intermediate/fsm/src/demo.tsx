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
import {makePoseDetectionDriver} from '@cycle-robot-drivers/vision'


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
};

export type State = {
  state: SMStates,
  curSentence: number,
};

export type Reducer = (prev?: State) => State | undefined;

export type Actions = {
  numPoses$: Stream<number>,
  result: Stream<Result>,
}


function transition(state: SMStates, action: SMActions) {
  switch (state) {
    case SMStates.LOAD:
      switch (action) {
        case SMActions.FOUND_PERSON:
          return SMStates.READ
      }
    case SMStates.READ:
      switch (action) {
        case SMActions.LOST_PERSON:
          return SMStates.WAIT
      }
    case SMStates.WAIT:
      switch (action) {
        case SMActions.FOUND_PERSON:
          return SMStates.RESUME
      }
    case SMStates.RESUME:
      switch (action) {
        case SMActions.FINISHED_SPEACKING:
          return SMStates.READ
      }
    default:
      console.debug(`Invalid state: "${state}"; returning null`);
      return null;
    console.debug(`Invalid action: "${action}"; returning null`);
    return null;
  }
}

function intent(poses: Stream<any[]>, result) {
  const numPoses$ = poses.map(poses => poses.length).compose(dropRepeats())
  return {
    numPoses$,
    result: result,
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
    .map(numPoses => function addReducer(prevState: State): State {
      const state = transition(
        prevState.state,
        numPoses === 0 ? SMActions.LOST_PERSON : SMActions.FOUND_PERSON
      );
      if (!!state) {
        return {
          state: state,
          curSentence: 0,
        }
      } else {
        return prevState;
      }
    });

  const newReducer = actions.result
    .debug(d => console.error('result', d))
    .filter(result => result.status.status === 'SUCCEEDED')
    .map(result => function resultReducer(prevState: State): State {
      const state = transition(
        prevState.state,
        SMActions.FINISHED_SPEACKING,
      );
      if (!!state) {
        return {
          state: state,
          curSentence: 0,
        }
      } else {
        return prevState;
      }
    });

  return xs.merge(initReducer$, numPosesReducer$, newReducer)
    .fold((state: State, reducer: Reducer) => reducer(state), null)
    .compose(dropRepeats());
}

function goal(state: Stream<State>): Stream<Goal> {
  // state.compose(dropRepeats()).
  // if (state.state === SMStates.RESUME) {
  //   return
  // }

  return state
    // .map(s => {
    //   if (s.state === SMStates.RESUME) {
    //     return initGoal({text: 'I\'ll resume the story'});
    //   } else if (s.state) {
    //     return initGoal({text: 'I\'ll resume the story'});
    //   }
    // })
    .filter(s => s.state === SMStates.RESUME)
    .mapTo(initGoal({text: 'I\'ll resume the story'}))
}


function main(sources) {
  const goalProxy$ = xs.create();
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: goalProxy$,
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  const actions = intent(sources.PoseDetection.poses, speechSynthesisAction.result);
  const state$ = model(actions);
  const goal$ = goal(state$);

  goalProxy$.imitate(goal$);

  actions.numPoses$.addListener({next: d => console.warn('numPoses', d)});
  state$.addListener({next: d => console.warn('state', d)});
  speechSynthesisAction.result.addListener({next: d => console.warn('result', d)});

  const styles = {code: {"background-color": "#f6f8fa"}}
  const vdom$ = xs.combine(
    sources.PoseDetection.DOM,
    sources.PoseDetection.poses.startWith([]),
  ).map(([d, p]) => (
    <div>
      <div>
        <h3>State</h3>
        <div>Waiting</div>
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

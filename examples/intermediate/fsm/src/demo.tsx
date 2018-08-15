import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import fromEvent from 'xstream/extra/fromEvent'
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {
  makeSpeechSynthesisDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'
import {makePoseDetectionDriver} from '@cycle-robot-drivers/vision'

// a random story from https://www.plot-generator.org.uk/story/
const sentences = [
  "Charity Thomas had always loved derelict New York with its wasteful, warty waters.",
  "It was a place where she felt active.",
  " ",
  "She was a controlling, courageous, brandy drinker with beautiful spots and pink lips.",
  "Her friends saw her as a calm, chilly coward.",
  "Once, she had even jumped into a river and saved a sticky puppy.",
  "That's the sort of woman he was.",
  " ",
  "Charity walked over to the window and reflected on her quiet surroundings.",
  "The wind blew like sitting monkeys.",
  " ",
  "Then she saw something in the distance, or rather someone.",
  "It was the figure of Brad Hemingway.",
  "Brad was an incredible friend with spiky spots and curvy lips.",
  " ",
  "Charity gulped.",
  "She was not prepared for Brad.",
  " ",
  "As Charity stepped outside and Brad came closer, she could see the substantial glint in his eye.",
  " ",
  "Brad gazed with the affection of 7472 predatory happy horses.",
  "He said, in hushed tones, \"I love you and I want affection.\"",
  " ",
  "Charity looked back, even more healthy and still fingering the spotty torch.",
  "\"Brad, I'm in love with you,\" she replied.",
  " ",
  "They looked at each other with barmy feelings, like two perfect, panicky puppies laughing at a very loving funeral, which had R & B music playing in the background and two forgetful uncles sitting to the beat.",
  " ",
  "Charity regarded Brad's spiky spots and curvy lips.",
  "\"I feel the same way!\" revealed Charity with a delighted grin.",
  " ",
  "Brad looked calm, his emotions blushing like a black, brief book.",
  " ",
  "Then Brad came inside for a nice glass of brandy.",
  " ",
  "THE END",
];


function intent() {
  return action$;
}

function model(action$) {
  // numPerson === 0
  // numPerson === 1
  // currentSentenceNum === 0 ...
  // actions.speechSynthesis.result
  // actions.speechSynthesis.result

  const addReducer$ = actions.add$
    .map(content => function addReducer(prevState: State): State {
      // 1. convert "content" to a concrete action & call "transit" to get a new state
      // 2. return a new state in certain cases
      // 3.
      return {
        ...prevState,
        list: prevState.list.concat(
          {
            content: content,
            count: prevState.counter.count,
            key: String(Date.now()),
          }
        ),
      };
    });

  transit()

  return state$
}

function view() {

}

function goal(state$) {
  state$.map(s => s.)
}

function main(sources) {
  const goalProxy$ = xs.create();
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: goalProxy$,
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  const numPoses$ = sources.PoseDetection.poses.map(poses => poses.length);
  const xs.create();

  const actions$.


  const count$ = xs.merge(
    speechSynthesisAction.result,
    numPoses$  // wait until the pose detector starts
      .filter(numPoses => numPoses === 1)
      .take(1).mapTo({status: {status: 'START'}}),
  ).fold((count, result: any) => {
    if (result.status.status === "START") {
      return 0;
    } else if (result.status.status === "SUCCEEDED") {
      return count + 1;
    }
    return count;
  }, -1);

  const numPosesChanged$ = numPoses$.compose(dropRepeats());
  const countChanged$ = count$.compose(dropRepeats());
  goalProxy$.imitate(
    xs.merge(
      countChanged$
        .filter(count => count >= 0 && count < sentences.length)
        .map(cnt => ({text: sentences[cnt], rate: 0.8})),
      numPosesChanged$.filter(numPoses => numPoses === 0)  // disappeared
        .mapTo(null),
      numPosesChanged$.filter(numPoses => numPoses === 1)  // appeared
        .mapTo({text: 'So', rate: 0.8}),
    )
  );

  const styles = {code: {"background-color": "#f6f8fa"}}
  const vdom$ = xs.combine(
    sources.PoseDetection.DOM,
    sources.PoseDetection.poses.startWith([]),

  ).map(([d, p, n]) => (
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

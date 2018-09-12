import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {timeDriver} from '@cycle/time';
import {
  makeSpeechSynthesisDriver,
  SpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'
import {makePoseDetectionDriver} from 'cycle-posenet-drivers'

// a randomly generated story from https://www.plot-generator.org.uk/story/
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


function main(sources) {
  const goalProxy$ = xs.create();
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: goalProxy$,
    SpeechSynthesis: sources.SpeechSynthesis,
  });

  const numPeople$ = sources.PoseDetection.poses
    .map(poses => poses.length)
    .compose(dropRepeats())
    .startWith(0);
  const curSentenceIndex$ = xs.merge(
    speechSynthesisAction.result,
    numPeople$
      .filter(numPeople => numPeople === 1)
      .take(1)
      .mapTo('START'),  // wait for a person before starting
  ).fold((index, result: any) => {
    if (result === "START") {
      return 0;
    } else if (result.status.status === "SUCCEEDED") {
      return index + 1;
    }
    return index;
  }, -1).compose(dropRepeats());

  const goal$ = xs.merge(
    curSentenceIndex$
      .filter(count => count >= 0 && count < sentences.length)
      .map(cnt => ({text: sentences[cnt], rate: 0.8})),
    numPeople$.filter(numPeople => numPeople === 0)  // disappeared
      .mapTo(null),
    numPeople$.filter(numPeople => numPeople === 1)  // appeared
      .mapTo({text: 'So', rate: 0.8}),
  );
  goalProxy$.imitate(goal$);

  const styles = {code: {"background-color": "#f6f8fa"}};
  const vdom$ = xs.combine(
    sources.PoseDetection.poses.startWith([]),
    sources.PoseDetection.DOM,
    numPeople$.startWith(-1)
  ).map(([p, d, n]) => (
    <div>
      <div>
        {(n === -1) ? (<p>Loading...</p>) : (n === 1)
          ? (<p>(Try hiding from the camera)</p>)
          : (<p>(Come back to the camera whenever you are ready)</p>)}
      </div>

      <div>
        {d}
      </div>

      <div>
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

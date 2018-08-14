import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import pairwise from 'xstream/extra/pairwise';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisDriver,
  IsolatedSpeechSynthesisAction as SpeechSynthesisAction,
} from '@cycle-robot-drivers/speech'
import {makePoseDetectionDriver} from '@cycle-robot-drivers/vision'

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

  const count$ = speechSynthesisAction.result
    .filter(result => (result.status.status === "SUCCEEDED"))
    .fold((acc, x) => {
      return acc + 1;
    }, 0).debug(data => console.warn('count', data));

  goalProxy$.imitate(
    xs.merge(
      count$
        .filter(count => count < sentences.length)
        .map(cnt => ({text: sentences[cnt], rate: 0.8})),
      sources.PoseDetection.poses
        .map(poses => (poses.filter(pose => pose.score > 0.2)))
        .filter(poses => poses.length === 0).mapTo(null),
      sources.PoseDetection.poses
        .map(poses => (poses.filter(pose => pose.score > 0.2)))
        .map(poses => (poses.length))
        .compose(pairwise)
        .filter(([prev, cur]) => (prev === 0 && cur === 1))
        .debug(data => console.error(data))
        .mapTo({text: 'I\'ll resume the story', rate: 0.8}),
    )
  );

  const vdom$ = xs.combine(
    sources.PoseDetection.poses.startWith([]),
    sources.PoseDetection.DOM,
  ).map(([p, d]) => (
    <div>
      <h1>PoseDetection component demo</h1>

      <div>
        {d}
      </div>

      <div>
        <h3>Driver outputs</h3>
        <div>
          <pre>"poses": {JSON.stringify(p, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  ));

  return {
    DOM: vdom$,
    PoseDetection: xs.of({
      algorithm: 'single-pose',
      singlePoseDetection: {minPoseConfidence: 0.2},
    }),
    SpeechSynthesis: speechSynthesisAction.value.debug(data => console.warn('value', data)),
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  PoseDetection: makePoseDetectionDriver(),
  SpeechSynthesis: makeSpeechSynthesisDriver(),
});

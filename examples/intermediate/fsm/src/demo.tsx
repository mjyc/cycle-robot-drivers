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

function main(sources) {
  const goalProxy$ = xs.create();
  const speechSynthesisAction = SpeechSynthesisAction({
    goal: goalProxy$,
    SpeechSynthesis: sources.SpeechSynthesis,
  });

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

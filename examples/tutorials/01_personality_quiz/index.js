import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

function main(sources) {
  const last$ = xs.create();

  const say$ = xs.combine(result$, last$).map(([result, say]) => {
    if () {

    }
    return ;
  });

  last$.imitate(say$);

  const say$ = xs.merge(
    sources.TabletFace.load.mapTo(
      'It\'s important that I reach my full career potential.'
    ),


    sources.SpeechRecognitionAction.result.filter(result => 
      result.status.status === 'SUCCEEDED'
      && result.result !== ''
    ).map(result => {
      switch (result.result === 'yes') {
        case '':
          return 1;
        default:
          return;
      }
    })



  );
  

  const $listen = sources.SpeechSynthesisAction.result.mapTo({});
  // or ...

  sources.SpeechRecognitionAction.result.addListener({
    next: result => console.log(result),
  });

  xs.combine(
    say$,
    sources.SpeechRecognitionAction.result
  )

  const sinks = {
    TabletFace: sources.PoseDetection.poses
      .filter(poses => 
        // must see one person
        poses.length === 1
        // must see the nose
        && poses[0].keypoints.filter(kpt => kpt.part === 'nose').length === 1  
      ).map(poses => {
        const nose = poses[0].keypoints.filter(kpt => kpt.part === 'nose')[0];
        return {
          x: nose.position.x / 640,  // max value of position.x is 640
          y: nose.position.y / 480  // max value of position.y is 480
        };
      }).map(position => ({
        type: 'SET_STATE',
        value: {
          leftEye: position,
          rightEye: position
        }
      })),
    SpeechSynthesisAction: $say,
    SpeechRecognitionAction: $listen
  };
  return sinks;
}

runRobotProgram(main);

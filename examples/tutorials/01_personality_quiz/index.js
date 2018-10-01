import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

function main(sources) {
  sources.PoseDetection.poses.addListener({
    next: (poses) => console.log('poses =', poses)
  });

  const sinks = {
    TabletFace: xs.periodic(1000).map(i => ({
        x: i % 2 === 0 ? 0 : 1,  // horizontal left or right
        y: 0.5,  // vertical center
      })).map(position => ({
        type: 'SET_STATE',
        value: {
          leftEye: position,
          rightEye: position,
        }
      }));
    })
  };
  return sinks;
}

runRobotProgram(main);

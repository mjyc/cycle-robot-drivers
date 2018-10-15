import {run} from '@cycle/run';
import xs from 'xstream';
import {makeROSDriver} from './makeROSDriver';

function main(sources) {

  // adapted from from
  //   https://github.com/RobotWebTools/roslibjs/blob/develop/examples/simple.html

  // Publishing a Topic
  // ------------------

  const topic$ = xs.of({
    type: 'topic',
    value: {
      name: '/cmd_vel',
      message: {
        linear : {
          x : 0.1,
          y : 0.2,
          z : 0.3,
        },
        angular : {
          x : -0.1,
          y : -0.2,
          z : -0.3,
        },
      },
    },
  });

  //Subscribing to a Topic
  //----------------------

  sources.ROS.addListener({
    next: value => {
      const topic = value.value;
      console.log('Received message on ' + topic.name + ': ' + topic.message.data);
      console.log(value)
    },
  });

  return {
    ROS: topic$,
  };
}

run(main, {
  ROS: makeROSDriver({
    roslib: {url: 'ws://robomackerel.cs.washington.edu:9090'},
    topics: [{
      name: '/cmd_vel',
      messageType: 'geometry_msgs/Twist',
    }, {
      name: '/listener',
      messageType: 'std_msgs/String',
    }],
  }),
});

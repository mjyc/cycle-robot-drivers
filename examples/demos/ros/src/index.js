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

  sources.ROS
    .filter(value => value.type === 'topic' && value.value.name === '/listener')
    .addListener({
      next: value => {
        const topic = value.value;
        console.log('Received message on ' + topic.name + ': ' + topic.message.data);
      },
    });

  // Calling a service
  // -----------------

  const service$ = xs.of({
    type: 'service',
    value: {
      name: '/add_two_ints',
      request: {
        a: 1,
        b: 2,
      },
    }
  });

  sources.ROS
    .filter(value => value.type === 'service' && value.value.name === '/add_two_ints')
    .map(value => value.value.response$).flatten().addListener({
      next: result => {
        console.log('Result for service call: ' + result.sum);
      }
    });

  const ros$ = xs.merge(topic$, service$);
  return {
    ROS: ros$,
  };
}

run(main, {
  ROS: makeROSDriver({
    roslib: {url: 'ws://localhost:9090'},
    topics: [{
      name: '/cmd_vel',
      messageType: 'geometry_msgs/Twist',
    }, {
      name: '/listener',
      messageType: 'std_msgs/String',
    }],
    services: [{
      name : '/add_two_ints',
      serviceType : 'rospy_tutorials/AddTwoInts',
    }]
  }),
});

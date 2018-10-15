import ROSLIB from 'roslib';
import xs from 'xstream';

export function makeROSDriver(options) {
  if (!options) {
    options = {};
  }
  if (!options.topics) {
    options.topics = [];
  }

  // For options.roslib, see
  //   https://github.com/RobotWebTools/roslibjs/blob/master/src/core/Ros.js#L26-L30
  const ros = new ROSLIB.Ros(options.roslib);
  const topics = {};
  options.topics.map(topicOptions => {
    // For topicOptions, see
    //   https://github.com/RobotWebTools/roslibjs/blob/master/src/core/Topic.js#L17-L26
    topics[topicOptions.name] = new ROSLIB.Topic({
      ...topicOptions,
      ros,
    });
  });

  return function(outgoing$) {

    outgoing$.addListener({
      next: outgoing => {
        // // Example outgoing value
        // outgoing = {
        //   type: 'topic',
        //   value: {
        //     name: '/cmd_vel',
        //     message: {
        //       linear : {
        //         x : 0.1,
        //         y : 0.2,
        //         z : 0.3,
        //       },
        //       angular : {
        //         x : -0.1,
        //         y : -0.2,
        //         z : -0.3,
        //       },
        //     },
        //   },
        // }
        switch (outgoing.type) {
          case 'topic':
            topics[outgoing.value.name].publish(outgoing.value.message);
            break;
          default:
            console.warn('Unknown outgoing.type', outgoing.type);
        }
      }
    });

    const incoming$ = xs.create({
      start: listener => {
        Object.keys(topics).map(topic => {
          topics[topic].subscribe(function(message) {
            // // Example incoming value
            // incoming = {
            //   type: 'topic',
            //   value: {
            //     name: '/cmd_vel',
            //     message: {
            //       linear : {
            //         x : 0.1,
            //         y : 0.2,
            //         z : 0.3,
            //       },
            //       angular : {
            //         x : -0.1,
            //         y : -0.2,
            //         z : -0.3,
            //       },
            //     },
            //   },
            // }
            listener.next({type: 'topic', value: {name: topic, message}});
          });
        });
      },
      stop: () => {
        Object.keys(topics).map(topic => {
          topics[topic].unsubscribe();
        });
      },
    });
  
    return incoming$;
  }
}
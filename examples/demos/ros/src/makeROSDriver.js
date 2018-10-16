import ROSLIB from 'roslib';
import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';

export function makeROSDriver(options) {
  if (!options) {
    options = {};
  }
  if (!options.topics) {
    options.topics = [];
  }
  if (!options.services) {
    options.services = [];
  }
  if (!options.actions) {
    options.actions = [];
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
  const services = {};
  options.services.map(serviceOptions => {
    // For topicOptions, see
    //   https://github.com/RobotWebTools/roslibjs/blob/master/src/core/Service.js#L14-L17
    services[serviceOptions.name] = new ROSLIB.Service({
      ...serviceOptions,
      ros,
    });
  });
  const serviceClient$ = xs.create();
  const actions = {};
  options.actions.map(actionOptions => {
    // For topicOptions, see
    //   https://github.com/RobotWebTools/roslibjs/blob/master/src/actionlib/ActionClient.js#L20-L24
    actions[actionOptions.serverName] = new ROSLIB.ActionClient({
      ...actionOptions,
      ros,
    });
  });
  // https://github.com/RobotWebTools/roslibjs/blob/master/src/actionlib/ActionClient.js#L14-L17
  const actionClient$ = xs.create();

  return function(outgoing$) {

    outgoing$.addListener({
      next: outgoing => {
        switch (outgoing.type) {
          case 'topic':
            // // Example outgoing "topic" value
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
            topics[outgoing.value.name].publish(outgoing.value.message);
            break;
          case 'service':
            // // Example outgoing "service" value
            // incoming = {
            //   type: 'service',
            //   value: {
            //     name: '/add_two_ints',
            //     request: {
            //       a: 1,
            //       b: 2,
            //     },
            //   },
            // }
            serviceClient$.shamefullySendNext({
              name: outgoing.value.name,
              response$: xs.create({
                start: listener => {
                  services[outgoing.value.name].callService(
                    new ROSLIB.ServiceRequest(outgoing.value.request),
                    (response) => {
                      listener.next(response);
                      listener.complete();
                    },
                    listener.error.bind(listener),
                  );
                },
                stop: () => {},
              }),
            }); 
            break;
          case 'action':
            // // Example outgoing "action" value
            // incoming = {
            //   type: 'action',
            //   value: {
            //     name: '/fibonacci',
            //     goalMessage: {
            //       order: 7,
            //     },
            //   },
            // }
            const goal = new ROSLIB.Goal({
              actionClient : actions[outgoing.value.name],
              goalMessage : outgoing.value.goalMessage,
            });
            actionClient$.shamefullySendNext({
              name: outgoing.value.name,
              timeout$: fromEvent(goal, 'timeout'),
              status$: fromEvent(goal, 'status'),
              feedback$: fromEvent(goal, 'feedback'),
              result$: fromEvent(goal, 'result'),
            });
            goal.send();
            break;
          default:
            console.warn('Unknown outgoing.type', outgoing.type);
        }
      },
      error: () => {},
      complete: () => {},
    });

    const incoming$ = xs.create({
      start: listener => {
        Object.keys(topics).map(topic => {
          topics[topic].subscribe(function(message) {
            // // Example incoming "topic" value
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

        serviceClient$.addListener({
          next: serviceClient => {
            // // Example incoming "service" value
            // incoming = {
            //   type: 'service',
            //   value: {
            //     name: '/add_two_ints',
            //     response$: // an xstream that emits a response object
            //   },
            // }
            listener.next({type: 'service', value: serviceClient});
          }
        });

        actionClient$.addListener({
          next: actionClient => {
            // // Example incoming "action" value
            // incoming = {
            //   type: 'action',
            //   value: {
            //     name: '/fibonacci',
            //     response$: // an xstream that emits timeout
            //     status$: // an xstream that emits status
            //     feedback$: // an xstream that emits feedback
            //     result$: // an xstream that emits results
            //   },
            // }
            listener.next({type: 'action', value: actionClient});
          }
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
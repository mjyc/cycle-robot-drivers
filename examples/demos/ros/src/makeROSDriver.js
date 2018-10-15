import ROSLIB from 'roslib';
import xs from 'xstream';

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
    //   https://github.com/RobotWebTools/roslibjs/blob/develop/src/core/Service.js#L14-L17
    services[serviceOptions.name] = new ROSLIB.Service({
      ...serviceOptions,
      ros,
    });
  });
  const serviceReponses$$ = xs.create();

  return function(outgoing$) {

    outgoing$.addListener({
      next: outgoing => {
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
        switch (outgoing.type) {
          case 'topic':
            topics[outgoing.value.name].publish(outgoing.value.message);
            break;
          case 'service':
            serviceReponses$$.shamefullySendNext({
              name: outgoing.value.name,
              response$: xs.create({
                start: listener => {
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
                  services[outgoing.value.name].callService(
                    new ROSLIB.ServiceRequest(outgoing.value.request),
                    (response) => {
                      listener.next(response);
                      listener.complete();
                    },
                    listener.error,
                  );
                },
                stop: () => {},
              }),
            }); 
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

        serviceReponses$$.addListener({
          next: serviceReponse$ => {
            // // Example incoming "service" value
            // incoming = {
            //   type: 'service',
            //   value: {
            //     name: '/add_two_ints',
            //     response$: // xs.stream that emits a response object
            //   },
            // }
            listener.next({type: 'service', value: serviceReponse$});
          }
        });
        
      },
      stop: () => {
        Object.keys(topics).map(topic => {
          topics[topic].unsubscribe();
        });
      },
    });
  
    return xs.merge(incoming$, );
  }
}
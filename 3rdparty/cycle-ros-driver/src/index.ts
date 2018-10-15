import {run} from '@cycle/run';
import {div, label, input, hr, h1, makeDOMDriver} from '@cycle/dom';
import xs from 'xstream';

// ---

import ROSLIB from 'roslib';

function makeROSDriver(options) {
  if (!options) {
    options = {};
  }
  if (!options.topics) {
    options.topics = [];
  }

  const ros = new ROSLIB.Ros(options.roslib);
  const topics = {};
  options.topics.map(topicOptions => {
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
            listener.next({type: topic, value: message});
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

// ---

function main(sources) {

  sources.ROS.addListener({
    next: value => console.log(value),
  });

  const out$ = xs.periodic(1000).mapTo({
    type: 'topic',
    value: {
      name: '/turtle1/cmd_vel',
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

  const vdom$ = sources.DOM
    .select('.myinput').events('input')
    .map(ev => ev.target.value)
    .startWith('')
    .map(name =>
      div([
        label('Name:'),
        input('.myinput', {attrs: {type: 'text'}}),
        hr(),
        h1(`Hello ${name}`)
      ])
    );

  return {
    DOM: vdom$,
    ROS: out$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  ROS: makeROSDriver({
    roslib: {url: 'ws://robomackerel.cs.washington.edu:8080'},
    topics: [{
      name: '/turtle1/cmd_vel',
      messageType: 'geometry_msgs/Twist',
    }],
  }),
});

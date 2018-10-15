import {run} from '@cycle/run';
import {div, label, input, hr, h1, makeDOMDriver} from '@cycle/dom';
import xs from 'xstream';

// ---

import ROSLIB from 'roslib';

function makeROSLIBDriver() {
  const ros = new ROSLIB.Ros({
    url : 'ws://robomackerel.cs.washington.edu:8080'
  });

  // const topics = topics.map(topic => new ROSLIB.Topic(topic));  
  // const services

  const cmdVel = new ROSLIB.Topic({
    ros : ros,
    name : '/turtle1/cmd_vel',
    messageType : 'geometry_msgs/Twist'
  });

  
  return function(sink$) {

    // outgoing
    // {type: 'topic', value: {type: '/turtle1/cmd_vel', value: ''}}  

    // incoming topic()
    // {type: '/turtle1/cmd_vel'}

    const incoming$ = xs.create({
      start: listener => {
        cmdVel.subscribe(function(message) {
          listener.next(message);
        });
      },
      stop: () => {},  // unsubscribe
    });
  
    return incoming$;
  }
}

// ---

function main(sources) {
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

    sources.ROS.addListener({next: value => console.log(JSON.stringify(value, null, 2))});

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  ROS: makeROSLIBDriver(),
});

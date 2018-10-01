# Programming a social robot using Cycle.js

In this post, I'll show you how to program a social robot using [Cycle.js](https://cycle.js.org/).
I assume you are familiar reactive programming.
If you are not, check out [The introduction to Reactive Programming you've been missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754).
<!-- TODO: Tell them you can skip the motivation sections -->

<!-- ## Table of contents

* [What is a social robot?](#what-is-a-social-robot)
* [What is Cycle.js?](#what-is-cyclejs)
* [Why Cycle.js for social robots?](#why-cyclejs-for-social-robots)
* [Getting started](#getting-started) -->


## What is a social robot?

[Wikipedia](https://en.wikipedia.org/wiki/Social_robot) introduces it as:

> A social robot is an autonomous robot that interacts and communicates with humans or other autonomous physical agents by following social behaviors and rules attached to its role.

[Cynthia Breazel](https://books.google.com/books?hl=en&lr=&id=402dquhxSTQC&oi=fnd&pg=PA1&dq=cynthia+breazeal&ots=oAToxSv8Cf&sig=KAnbgcrcT56kMQVSFobJho7WN8E#v=onepage&q&f=false), the mother of social robots, once said:

> In short, a socialable robot is socially intelligent in a human-like way, and interacting with it is like interacting with another person. At the pinnacle of achievement, they could befriend us, as we could them.

I see social robots as embodied agents whose main task is to communicate with humans to help humans.
So, interactive robots for [education](http://robotic.media.mit.edu/portfolio/storytelling-companion/) or [eldercare](http://www.cataliahealth.com/) fit my definition the best.
<!-- However, sometimes I also consider less embodied agents that have a potential to create a relationship with us, such as fitbit, as a social robot. -->

Programming social robots is similar to programming web applications.
In both cases, programmers write code for handling inputs, e.g., a button click or sensor reading, and outputting data accordingly, e.g., displaying information on screen or sending control signals to motors.
The major difference is programming social robots involve working with multi-modal inputs and outputs, e.g., speech and motion, to interact with humans instead of solely using a screen interface.

In this post, I'll use a [tablet-face robot](https://github.com/mjyc/tablet-robot-face) for demonstration purposes.
The tablet-face robot is just a web application running on a tablet, but we'll make it speak, listen, and see you to make it more like a "social robot".
<!-- but I believe it is representitive of a social robot since faces are the critical part of a social robot and [many social robots today use a screen as a face](https://spectrum.ieee.org/automaton/robotics/humanoids/what-people-see-in-157-robot-faces). -->


## What is Cycle.js?

[Cycle.js](http://cycle.js.org) is a functional and reactive JavaScript framework.
It is an abstraction that separates all [side effect](https://en.wikipedia.org/wiki/Side_effect_(computer_science)) producing code into [drivers](https://cycle.js.org/drivers.html) so the core application logic code remains [pure](https://en.wikipedia.org/wiki/Pure_function) in one "main" function.
The author of Cycle.js describes a web application as a [dialogue between a human and a computer](https://cycle.js.org/dialogue.html#dialogue-abstraction).
If we assume both are functions, the human as `y = driver(x)` and the computer as `x = main(y)` where `x` and `y` are streams in the context of [reactive programming](https://cycle.js.org/streams.html#streams-reactive-programming), then the dialogue is simply two functions that react to each other via their input stream, which is an output of the another function.


## Why Cycle.js for social robots?

To me, Cycle.js essentially enforces functional reactive programming, e.g., using streams, and [ports and adapters architecture](http://wiki.c2.com/?PortsAndAdaptersArchitecture), e.g., separating side effects, to make it easy to create and understand complex and concurrent interactive programs--beyond web applications. This is why I chose Cycle.js for programming a social robot.
I believe the patterns enforced by Cycle.js will help programmers to battle the concurrency problems originated from supporting multi-modal interactions and stay in control when complexity of the desired robot behavior grows.
In fact, you don't need to use Cycle.js if you can enforce the patterns yourself.
For example, you could use [Yampa with reactimate](https://wiki.haskell.org/Yampa/reactimate), [Flapjax](http://www.flapjax-lang.org/), or one of [ReactiveX](http://reactivex.io/) stream libraries to do this in a language in which your robot's API is available.


## Implementing "travel personality test"

Enough backgrounds, we'll now create a robot program that tests your travel personality.
Specifically, we'll make the robot to

1. look at you while you are interacting with the robot and
2. ask questions as shown in [this flowchart](http://www.nomadwallet.com/afford-travel-quiz-personality/).

Note that the code examples in this post assume your familiarity with [JavaScript ES6](https://medium.freecodecamp.org/write-less-do-more-with-javascript-es6-5fd4a8e50ee2).
To build code, I use [browserify](http://browserify.org/) and [Babel](https://babeljs.io/) here, but feel free to use a build tool and a transpiler you prefer.
 <!-- , e.g., [webpack](https://webpack.js.org/) and [TypeScript](https://www.typescriptlang.org/). -->

First, let's set up a Cycle.js application.
Create a folder:

```
mkdir my-robot-program
cd my-robot-program
```

Then download [`package.json`](../examples/tutorials/01_personality_quiz/package.json), [`.babelrc`](../examples/tutorials/01_personality_quiz/.babelrc), [`index.html`](../examples/tutorials/01_personality_quiz/index.html) and create an empty `index.js` file in the folder.
Run `npm install` to install the required npm packages.
After installing, you can run `npm start` to build and start the web application that does nothing.

Now add the following code in index.js:

```js
import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

function main(sources) { }

runRobotProgram(main);
```

Then run this application, e.g., by running `npm start`.
It should load a robot face on your browser.

We just successfully set up and run a Cycle.js application!

### Robot, look at a face

We'll now focus on implementing the first feature--looking at a face.

Let's make the robot to just move its eyes by adding the following code in `main`:

```js
// ...

function main(sources) {
  const sinks = {
    TabletFace: xs.periodic(1000).map(i => ({
        x: i % 2 === 0 ? 0 : 1,  // horizontal left or right
        y: 0.5  // vertical center
      })).map(position => ({
        type: 'SET_STATE',
        value: {
          leftEye: position,
          rightEye: position
        }
      }))
  };
  return sinks;
}

// ...
```

Here we are sending commands to the `TabletFace` driver by returning the `sink.TabletFace` stream from `main`.
The [`periodic`](https://github.com/staltz/xstream#periodic) xstream factory creates a stream emitting an incremental number every second and the [`map`](https://github.com/staltz/xstream#map) xstream operator create a new stream that turns the emitted numbers into positions and another new stream that turns the emitted positions into control commands.
If you run the updated application, the robot should look left and right repeatedly.

Let's work on detecting a face by adding more code in `main`:

```js
// ...

function main(sources) {
  sources.PoseDetection.poses.addListener({
    next: (poses) => console.log('poses', poses)
  });

  // ...
}

// ...
```

Here we use the [addListener](https://github.com/staltz/xstream#addListener) xstream operator to add a callback function that prints the detected pose data to the `poses` stream, the stream returned from the `PoseDetection` driver.

When you run the application you should see arrays of objects printed to your browser's console, in the following format:

```js
const poses = [
  // the first detected person
  {
    "score": 0.32371445304906,
    "keypoints": [
      {
        "part": "nose",
        "position": {
          "x": 253.36747741699,
          "y": 76.291801452637
        },
        "score": 0.99539834260941
      },
      {
        "part": "leftEye",
        "position": {
          "x": 253.54365539551,
          "y": 71.10383605957
        },
        "score": 0.98781454563141
      },
      // ...
  },
  // the second detected person if there is one
  {
    "score": 0.22838506316132706,
    "keypoints": [
      {
        "part": "nose",
        "position": {
          "x": 236.58547523373466,
          "y": 360.03672892252604
        },
        "score": 0.9979155659675598
      },
      // ...
    ]
  },
  // ...
]
```

While the application is running, try disappearing from the camera.
You should see one less object in the `poses` array.
Also try hiding one of your ears by turning your head left or right.
You should not see an object that has a string `nose` for its `part` field in the `keypoints` array.

Now that we know how to move the robot's eyes and retrieve detected face data, let's make the robot's eyes to follow the nose of the first detected person.
Update `main` as follows:

```js
//...

function main(sources) {
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
      }))
  };
  return sinks;
}

//...
```
Here we are sending commands to the `TabletDriver` by using the stream created from the output stream of the `PoseDetection` driver (`sources.PoseDetection.poses`) instead of creating one from scratch as we did above when we made the robot to look left and right.
To convert pose data into control commands, we use the [`filter`](https://github.com/staltz/xstream#filter) xstream operator to filter pose data to the ones containing only one person whose nose is visible. Then we use the [`map`](https://github.com/staltz/xstream#map) xstream operator twice to convert the detected nose positions into eye positions and turn the eye positions into control commands.

We have made the robot to look at a face!

#### Taking a closer look at `runRobotProgram`

While following code examples above, you may have wondered:

1. when and where is the `TabletFace` driver created
2. how and when a driver produces side effects

Here is the answer to the first question: the two drivers we used in the example code, `TabletFace` and `PoseDetection`, are created in `runRobotProgram`.
Normally when you program a Cycle.js app, you need to [create drivers explicitly](https://cycle.js.org/getting-started.html#getting-started-coding-create-main-and-drivers) and pass them to the [Cycle.js' `run`](https://cycle.js.org/api/run.html) function.
We skipped this step because we used `runRobotProgram` that creates the required drivers for programming a tablet-face robot and calls Cycle.js' `run` for us.
The `runRobotProgram` function is [a wrapper function for Cycle.js' `run`](../run/src/index.tsx) that

1. creates five drivers, `AudioPlayer`, `SpeechSynthesis`, `SpeechRecognition`, `TabletFace`, `PoseDetection`
2. creates and sets up five action components `FacialExpressionAction`, `AudioPlayerAction`, `TwoSpeechbubblesAction`, `SpeechSynthesisAction`, `SpeechRecognitionAction` to allow programmers to use them as drivers, and
3. calls  Cycle.js' run with the created drivers and actions.

In fact, if you are comfortable with Cycle.js, you could use Cycle.js' `run` instead of `runRobotProgram` to have more control over drivers and actions.
You could also create a new `runRobotProgram` function that provides drivers for your own robot that is not a tablet-face robot!

Regarding the second question, check out [this page](https://cycle.js.org/drivers.html) from the Cycle.js' website.


### Robot, asks questions

<!-- The `main` function takes a collection of streams as input (`sources`) and returns a collection of streams as output (`sink`). When `runRobotProgram` is called, it creates functions that produce side effects (_Drivers_ in Cycle.js) and connects the outputs of the drivers with the input of `main` and the output of `main` with the inputs of the drivers. This structure enforced by Cycle.js allows programmers to write the pure, reactive `main` function. -->

```js
// ...

function main(sources) {
  const hello$ = sources.TabletFace.load.mapTo('Hello!');
  const nice$ = sources.SpeechSynthesisAction.result
    .take(1)
    .mapTo('Nice to meet you!');
  const greet$ = xs.merge(hello$, nice$);
  
  const sink = {
    TwoSpeechbubblesAction: greet$,
    SpeechSynthesisAction: greet$,
  };
  return sink;
}

// ...
```

The code above is an example main function that makes the robot to say something. We first subscribe to the `sources.TabletFace.load` stream to convert the "TabletFace screen loaded" event to a new event carrying a string `Hello!` using xstream's [`mapTo`](https://github.com/staltz/xstream#mapTo) operator.
We also subscribe to the `sources.SpeechSynthesisAction.result` stream to convert the first "SpeechSynthesisAction finished" event to a new event carrying a string `Nice to meet you!`. Notice that we use xstream's [`take`](https://github.com/staltz/xstream#mapTo) with the argument `1` to capture the "SpeechSynthesisAction finished" event only once.

The two subscriptions produce two streams, `hello$` and `nice$`. We merge the two streams to create a single multiplexed stream `greet$` using xstream's [`merge`](https://github.com/staltz/xstream#merge) factory. Finally, the `main` function returns the `$greet` stream as `sink.TwoSpeechbubblesAction` and `sink.SpeechSynthesisAction` to trigger an display message action and an speech synthesis action outside of `main`. Note that I attach `$` at the end of the stream variable names to distinguish stream variables from others as the Cycle.js team does this in [their codebase](https://github.com/cyclejs/cyclejs). Upon loading this program, the robot will first say and display "Hello!" and "Nice to meet you!" immediately after finished saying "Hello".

<!-- TODO: provide links to Speechbubble and SpeechSynthesis APIs -->


## Actions
 
If you are familiar with writing a Cycle.js application, you probably noticed what we did in the previous section is exactly like writing a Cycle.js application except (i) we used `runRobotProgram` from `@cycle-robot-drivers/run` instead of `run` from `@cycle/run` and (ii) we did not provide any drivers to `runRobotProgram` but receiving data from somewhere via `sources` and sending data to somewhere via `sinks`. This is because `runRobotProgram` is [just a wrapper function for Cycle.js' `run`](../run/src/index.tsx); it creates five drivers, `AudioPlayer`, `SpeechSynthesis`, `SpeechRecognition`, `TabletFace`, `PoseDetection` and five _actions_, `FacialExpressionAction`, `AudioPlayerAction`, `TwoSpeechbubblesAction`, `SpeechSynthesisAction`, `SpeechRecognitionAction`, sets the actions up to make them act like drivers, and calls Cycle's run with the created drivers and actions. In fact, if you are comfortable with Cycle.js, you could use Cycle.js' `run` instead of `runRobotProgram` to have more control over drivers and actions.

<!-- TODO: provide links for drivers and components  -->

What are _actions_? Actions are Cycle.js components that implement an interface for preemptable tasks. The interface is modeled after [ROS's acitonlib interface](http://wiki.ros.org/actionlib/DetailedDescription#Action_Interface_.26_Transport_Layer); it takes the `goal` stream to receive start or preempt signals from a client and outputs the `output` and `result` streams to send control signals to drivers and send action result data to a client. For simplicity purposes, we constrain the action components to run only one action at a time. In other words, one cannot queue multiple actions. If a new action is requested while a previously requested action is running, the action component will cancel the running action and start the newly requested action.

Let's look at an example below (or [at StackBlitz](https://stackblitz.com/edit/cycle-robot-drivers-tutorials-02-actions)):

```js
import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {runRobotProgram} from '@cycle-robot-drivers/run';

function main(sources) {
  const message$ = xs.merge(
    xs.of('Hello').compose(delay(1000)),
    // xs.of(null).compose(delay(1500)),
    // xs.of('World').compose(delay(1500)),
  );

  sources.SpeechSynthesisAction.output.addListener({
    next: output => console.log('output', output),
  });
  sources.SpeechSynthesisAction.result.addListener({
    next: result => console.log('result', result),
  });
  
  return {
    // SpeechSynthesis: sources.SpeechSynthesisAction.output.drop(1),
    // SpeechSynthesis: xs.of('What?!').compose(delay(1000)),
    SpeechSynthesisAction: message$,
  };
}

runRobotProgram(main);
```

This example program will make the robot to say "Hello". You can change the amount of delay 1000(ms) to see how the new delay amount effects the timing of `output` and `result` events, which will be printed to console. You can also stop the speech in the middle by uncommenting `// xs.of(null).compose(delay(1500)),` or `// xs.of('World').compose(delay(1500)),`. In the latter case, the action component will also start a new action, i.e., the robot will say "World".

Since actions are Cycle.js components, they do not make side effects but work with drivers to do so. The connection between actions and drivers are set up inside of the `runRobotProgram` function. However, if you want to override the connection between action outputs and driver inputs, you can do this by returning an action output in `main` with the name of a driver. For example, if you uncomment `// SpeechSynthesis: sources.SpeechSynthesisAction.output.drop(1),`, the action component will send control signals to the `SpeechSynthesis` driver only after the first action request. In the fact, the input to the `SpeechSynthesis` driver does not need to be dependent on `sources.SpeechSynthesisAction.output`, e.g., try uncommenting `// SpeechSynthesis: xs.of('What?!').compose(delay(1000)),`.

You might ask, _"Well, if I can send signals to the drivers directly, why do I want to use actions at all?"_. It is true you can write a program that do not use actions, but then you need to figure out how to trigger and stop the desired side effects and return relevant values per each driver. Actions provide a consistent way of working with preemptable tasks so programmers could write more predictable code, which is in line with Cycle.js' spirit.


## Working with streams

Let's make a more interesting program!

Try the program [here](https://stackblitz.com/edit/cycle-robot-drivers-tutorials-03-working-with-streams)!


## Finite state machine

Let's make a more interesting program!

Try the program [here](https://stackblitz.com/edit/cycle-robot-drivers-tutorials-04-fsm)!

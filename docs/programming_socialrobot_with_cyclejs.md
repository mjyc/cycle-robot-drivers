# Programming a social robot using Cycle.js

In this post, I'll show you how to program a social robot using Cycle.js. I assume you are familiar reactive programming. If you are not, check out [The introduction to Reactive Programming you've been missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754).

## Table of contents

* [What is a social robot?](#what-is-a-social-robot)
* [What is Cycle.js?](#what-is-cyclejs)
* [Why Cycle.js for social robots?](#why-cyclejs-for-social-robots)
* [Getting started](#getting-started)

## What is a social robot?

[Wikipedia](https://en.wikipedia.org/wiki/Social_robot) introduces it as:

> A social robot is an autonomous robot that interacts and communicates with humans or other autonomous physical agents by following social behaviors and rules attached to its role.

[Cynthia Breazel](https://books.google.com/books?hl=en&lr=&id=402dquhxSTQC&oi=fnd&pg=PA1&dq=cynthia+breazeal&ots=oAToxSv8Cf&sig=KAnbgcrcT56kMQVSFobJho7WN8E#v=onepage&q&f=false), the mother of social robots, once said:

> In short, a socialable robot is socially intelligent in a human-like way, and interacting with it is like interacting with another person. At the pinnacle of achievement, they could befriend us, as we could them.

For me, a social robot is an embodied agent whose main task is to communicate with humans to help humans. So, interactive robots for [education](http://robotic.media.mit.edu/portfolio/storytelling-companion/) or [eldercare](http://www.cataliahealth.com/) fit my definition the best. However, sometimes I also consider less embodied agents that have a potential to create a relationship with us, such as [fitbit](https://www.fitbit.com), as a social robot.


## What is Cycle.js

[Cycle.js](http://cycle.js.org) is a functional and reactive JavaScript framework. It is an abstraction that separates all [side effect](https://en.wikipedia.org/wiki/Side_effect_(computer_science)) producing code into _Drivers_ so the core application logic code remains [pure](https://en.wikipedia.org/wiki/Pure_function) in _main_ function. The author of Cycle.js describes a web application as a _dialogue_ between a human and a computer. If we assume both are functions, the human as `y = driver(x)` and the computer as `x = main(y)` where `x` and `y` are streams in the context of reactive programming, then the dialogue is simply two functions in a circular dependency, which I believe is why the author named the framework "Cycle.js". See [Dialogue abstraction](https://cycle.js.org/dialogue.html#dialogue-abstraction) and [Streams](https://cycle.js.org/streams.html#streams) for the detailed explanation, or [Getting started](https://cycle.js.org/getting-started.html) and [try it live](http://widdersh.in/tricycle/) for getting your hands dirty.

It is interesting to notice the similar abstractions could be found in older works of others, such as [Yampa](https://wiki.haskell.org/Yampa)'s [reactimate](https://wiki.haskell.org/Yampa/reactimate) and [ports and adapters architecture](http://wiki.c2.com/?PortsAndAdaptersArchitecture). Although [it seems Cycle.js was independently developed](https://gist.github.com/zudov/65447685838ea8b2569f), it is reassuring to see Cycle.js uses the robust pattern discovered from the past.


## Why Cycle.js for social robots?
<!-- ## Why reactive programming for social robots? -->

_If we assume perfect robotic sensing and control_, programming a robot is like programming a web application. A web application receives inputs from human (e.g., a button click) and outputs information, just like a robot program receives inputs from the environment including humans (e.g., speech) and outputs actions. In both cases, the main logic requires to handle highly concurrent inputs and outputs and scale spatially (e.g., for web applications) or temporarily (e.g., for robot programs). I believe these requirements make Cycle.js a great candidate for programming a social robot as it encourages reactive programming and predictable (and hence scalable) coding by separating side effects. In fact, I believe any language or framework that supports similar abstractions is also a good candidate.
<!-- To me, [the social robots that has a screen face](https://spectrum.ieee.org/automaton/robotics/humanoids/what-people-see-in-157-robot-faces) seems like physical browsers running a single page web application.  -->

I understand my first assumption above will make roboticists laugh; I understand robotics researchers have not figured out general sensing and control. However, I believe they have made enough progress to use such technology in _constrained environments_ with confidence, for example, check out [Amazon Echo](https://www.google.com/aclk?sa=L&ai=DChcSEwiHnMbni63dAhWP_mQKHUYxAkgYABAAGgJwag&sig=AOD64_0pyA_aplrmSQlW_P1_aeNb1kyX6A&q=&ved=2ahUKEwiHocHni63dAhV-HzQIHW44D9wQ0Qx6BAgFEAI&adurl=), [Google Home](https://assistant.google.com/platforms/speakers/), or even [robots in indoor commercial spaces](https://spectrum.ieee.org/automaton/robotics/robotics-hardware/indoor-robots-for-commercial-spaces) if you haven't already.

Alternatively, you could use one of many existing robot programming frameworks, like [ROS](http://www.ros.org/). While ROS provides ample libraries (e.g., for sensing and control) and tools (e.g., for visualization and data analysis), it is [too heavy](http://wiki.ros.org/hydro/Installation/UbuntuARM#Installation-1) and [constrained](http://www.ros.org/reps/rep-0003.html#platforms-by-distribution) for writing simple interactive programs. I also found it difficult to create clean reactive programs that express complex dependencies between multiple input and output channels using [ROS communication patterns](http://wiki.ros.org/ROS/Patterns/Communication) in [python](http://wiki.ros.org/rospy) or [C++](http://wiki.ros.org/roscpp).
<!-- in python or C/C++ even with [RxPY](https://github.com/ReactiveX/RxPY) or [RxCPP](https://github.com/ReactiveX/RxCpp). -->


## Getting started

The code examples in this post assume your familiarity with [JavaScript ES6](https://medium.freecodecamp.org/write-less-do-more-with-javascript-es6-5fd4a8e50ee2). I recommend using a building tool such as [browserify](http://browserify.org/) or [webpack](https://webpack.js.org/) through a transpiler (e.g. [Babel](https://babeljs.io/) or [TypeScript](https://www.typescriptlang.org/)).

We'll create [a simple web application](https://stackblitz.com/edit/cycle-robot-drivers-run-demo)--which I consider as a social robot in this post. You can download the final code from [here](../examples/tutorials/01_getting_started/).

First, let's create a folder:

```
mkdir my-robot-program
cd my-robot-program
```

Then download [`package.json`](../examples/tutorials/01_getting_started/package.json), [`.babelrc`](../examples/tutorials/01_getting_started/.babelrc), [`index.html`](../examples/tutorials/01_getting_started/index.html) and [`index.js`](../examples/tutorials/01_getting_started/index.js) in the folder. You can now run `npm install` to install the required npm packages. After installing, you can run `npm start` to serve the web application locally.

Now, let's investigate the code. We'll only investigate `index.js` since the most other files are used for setting up the build system.

```js
import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

// ...
```

The first line imports [xstream](https://github.com/staltz/xstream) stream library as `xs`. The second line import `runRobotProgram` function that takes `main` function to run an application, like this:

<!-- TODO: provide a runRobotProgram doc link -->

```js
// ...

function main(sources) {
  // ...
  return sink;
}

runRobotProgram(main);
```

The `main` function takes a collection of streams as an input (`sources`) and returns a collection of streams as an output (`sink`). When `runRobotProgram` is called, it creates functions that produce side effects (_Drivers_ in Cycle.js terms) and connects the outputs of the drivers with the input of `main` and the output of `main` with the inputs of the drivers. This structure enforced by Cycle.js allows programmers to write the pure, reactive `main` function.

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

The code above is an example main function that makes the robot say something, reactively. We achieve this by first subscribing to the `sources.TabletFace.load` stream to convert the "TabletFace screen loaded" event to a new event carrying a string `Hello!` using xstream's [`mapTo`](https://github.com/staltz/xstream#mapTo) operator.
We also subscribe to the `sources.SpeechSynthesisAction.result` stream to convert the first "SpeechSynthesisAction finished" event to a new event carrying a string `Nice to meet you!`. Notice that we use xstream's [`take`](https://github.com/staltz/xstream#mapTo) with the argument `1` to respond to the "SpeechSynthesisAction finished" event only once.

The two subscriptions produce two streams, `hello$` and `nice$`, which we merge to create a single multiplexed stream `greet$` using xstream's [`merge`](https://github.com/staltz/xstream#merge) factory. We return the `greet$` stream as `sink.TwoSpeechbubblesAction` and `sink.SpeechSynthesisAction` to trigger an action displaying the given texts on screen and an action speaking the given texts. Note that I attach `$` at the end of the stream variable names to distinguish stream variables from others as the Cycle.js team does this in [their codebase](https://github.com/cyclejs/cyclejs). Upon loading this web application, it will first say and display "Hello!" and "Nice to meet you!" immediately after finished saying "Hello".

<!-- TODO: provide links to TwoSpeechbubblesAction and SpeechSynthesisAction -->


## Actions
 
If you are familiar with writing a Cycle.js application, you probably noticed what we did in the previous section is almost like writing a regular Cycle.js application except (i) we used `runRobotProgram` from `'@cycle-robot-drivers/run'` instead of `run` from `@cycle/run` and (ii) we did not provide any drivers to `runRobotProgram` but reciving data from somewhere via `sources` and sending data to somewhere via `sinks`. This is because `runRobotProgram` is a wrapper function for Cycle.js's `run`  (see the implementation of `runRobotProgram` [here](../run/src/index.tsx)). In `runRobotProgram`, it creates five drivers, `AudioPlayer`, `SpeechSynthesis`, `SpeechRecognition`, `TabletFace`, `PoseDetection`, and five _actions_, `FacialExpressionAction`, `AudioPlayerAction`, `TwoSpeechbubblesAction`, `SpeechSynthesisAction`, `SpeechRecognitionAction`, that are setup to act like drivers in `runRobotProgram`. In fact, if you are comfortable with Cycle.js, you could use Cycle.js' `run` insated of `runRobotProgram` to have more control over drivers and actions.

What are _actions_? Actions are Cycle.js components that implement an interface for preemptable tasks. The interface is modeled after [ROS's acitonlib interface](http://wiki.ros.org/actionlib/DetailedDescription#Action_Interface_.26_Transport_Layer); it takes the `goal` stream to receive start or preempt signals from a client and outputs the `output` and `result` streams to send control signals to drivers and send action result data to a client. For simplicity purposes, we constrained action components to allow running only one action at a time. In other words, one cannot queue multiple actions; if a new action is requested while an action is already running, the action component will cancel the running action and start the newly requested action.

<!-- TODO: provide a link -->

Let's look at an example:

<!-- TODO: Add a link to stackblitz here -->

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
    SpeechSynthesisAction: message$,
  };
}

runRobotProgram(main);
```

This example program will make the robot to say "Hello". You can change the amount of delay 1000(ms) to see how the new delay amount effects the timing of `output` and `result` events, which will be printed to console. You can also stop the speech in the middle by uncommenting `// xs.of(null).compose(delay(1500)),` or `// xs.of('World').compose(delay(1500)),`. In the latter case, the action component will also start a new action with the string "World".

Since actions are components, they do not make side effects but work with drivers to make side effects. The connection between actions and drivers are setup inside of the `runRobotProgram`. However, if you want to override the connection between an output of an action and an input of a driver, you can define one in the return value of `main`. For example, if you uncomment `// SpeechSynthesis: sources.SpeechSynthesisAction.output.drop(1),`, the action will be there after the first one.

<!-- TODO: provide a link? -->


## Working with streams

Let's make a bit more interesting robot.

## Finite state machine

<!-- Action allows running 
Actions take "goal" stream, which emits data to trigger or null to cancel.
Actions  -->



<!-- components that 

implements preemptable tasks


Basically is a cycle.js app that uses runRobotProgram.

runRobotProgram provides five drivers

AudioPlayer,
SpeechSynthesis,
SpeechRecognition,
TabletFace,
PoseDetection,

And five actions

FacialExpressionAction,
AudioPlayerAction,
TwoSpeechbubblesAction,
SpeechSynthesisAction,
SpeechRecognitionAction,

That behaves like drivers but actually implemented as components. -->



<!-- that are meant to be treated as drivers in the `main` function that `runRobotProgram` take -->

<!-- the major differences are (i) I used `runRobotProgram` from `'@cycle-robot-drivers/run'` instead of `run` from `@cycle/run` to run the application and (ii) we did not provide any drivers to `runRobotProgram`, however, in the `main`, we 

If you are familiar with writing a Cycle.js application, you probably noticed I used `runRobotProgram` imported from `'@cycle-robot-drivers/run'` instead of `run` that is available from `@cycle/run` . -->

<!-- If you are familiar with writing Cycle.js applications, you probably noticed only thing we did differently than writing a regular Cycle.js web application was using `runRobotProgram` imported from `'@cycle-robot-drivers/run'` instead of using `run` that is available from `@cycle/run`. -->

<!-- import {runRobotProgram} from '@cycle-robot-drivers/run'; -->




<!-- The example we provided is a Cycle.js app. What we did is we provided a wrapper funcation for Cycle.js' `run` and defined all the drivers required for working with a tablet face robot in that wrapper function, which we call runRobotProgram, as you can see in the source code. If you are comfortable working with Cycle.js, I recommend you to use without wrappers. -->




<!-- Create an example that demonstrates how the action works -->

<!-- source and sink contains 9 fields that are output streams from  -->


<!-- 
AudioPlayer,
SpeechSynthesis,
SpeechRecognition,
TabletFace,
PoseDetection,

FacialExpressionAction,
AudioPlayerAction,
TwoSpeechbubblesAction,
SpeechSynthesisAction,
SpeechRecognitionAction,
-->



<!-- `runRobotProgram`

The `main` function and `drivers` variable, and calls `runRobotProgram`. 

The main function takes streams as input and return streams. Note that $ is convention used in cycle.js ...
The drivers variable defines driver, and .

We then define a main function that takes streams as input (`sources`) and return 

drivers. -->



<!-- ```js
// ...

function main(sources) {
  const hello$ = sources.TabletFace.load.mapTo('Hello!');
  const nice$ = sources.SpeechSynthesisAction.result
    .take(1)
    .mapTo('Nice to meet you!');
  const greet$ = xs.of(hello$, nice$);
    
  return {
    TwoSpeechbubblesAction: greet$,
    SpeechSynthesisAction: greet$,
  }
}

// ...
```

is the main function that outputs a string 'Hello!' to `TwoSpeechbubblesAction` and `SpeechSynthesisAction` drivers -->

<!-- link to import libraries & create main & drivers -->
<!-- highlight the difference;  -->
<!-- the new DRIVERS -->


<!-- sending (text) & catching (speech) -->


<!-- TELEOP idea: commented out action params (and that's all) -->
<!-- TELEOP idea: commented out action params -->


<!-- Wiring things -->



<!-- 1. install library
2. import libraries

(download the one that has everything as submodules)

3. Create main and library

## Tutorial 0

Let's build

Play with the robot!



## Tutorial 1

## Tutorial 2


 -->






<!-- and `src/index.js`:

```js
import {makeDOMDriver} from '@cycle/dom';
import {runRobotProgram} from '@cycle-robot-drivers/run';
import xs from 'xstream';

function main(sources) {
  const hello$ = sources.TabletFace.load.mapTo('Hello!');
  const nice$ = sources.SpeechSynthesisAction.result
    .take(1)
    .mapTo('Nice to meet you!');
  const greet$ = xs.of(hello$, nice$);
    
  return {
    TwoSpeechbubblesAction: greet$,
    SpeechSynthesisAction: greet$,
  }
}

runRobotProgram(main, {
  DOM: makeDOMDriver('#app'),
});
```

Then, install the libraries:

```
npm install
```

and start the server:

```
npm start
```

The command should open a browser tab with `127.0.0.1:8080`. -->


<!-- First, let's install the packages we'll be using:

```
npm install xstream @cycle/run @cycle-robot-drivers/speech
```

Add demo here -->



<!-- This program . -->

<!-- * Check out the timing of outputs w.r.t. to the input.
* If you send the null as a goal it will. Try this by uncommenting `// ...`
* Note that actions, you can check this out by xs.never(), if you don't define  -->

<!--  -->

<!-- In this example, we are sending a string 'Hello' to `SpeechSynthesisAction` as a goal to make the robot say 'Hello'. When `SpeechSynthesisAction` receives this goal, it will send a control signal to the `SpeechSynthesis` driver, which you can see it in console as `output ...`, to actually produce the synthesized sound 'Hello'. Once the sound is finished playing, the `SpeechSynthesisAction` will emit a result data, which will be displayed in console as `result ...`. You can also comment out `// xs.of(null).compose(delay(1500))` to cancel the running action and see what the result looks like in such case.



Finally, for simplicity purposes, 

we only allow actions to run 

For simplicity purposes, we only allow actions to run only one action at a time.

Let's look at an example. -->

<!-- TODO: provide an example here -->


<!-- We recommend programmers to use actions instead of drivers. Actions drivers are modeled after but ActionInterface but simplified. -->

<!-- Actions take "goal" stream, which should emit `null` to cancel the running action or other expected types of data to start an action.
When the running action is done, either by succeeding the started action, preemed by user request, or aborted due to errornous condition, it will emit contains two fields: result and status. result is the return value from the action and status contains two fields `goal_id` and `status`, which indicate unique id for triggered action and end state of the action, which takes one of the three values. -->

<!-- Note that ... -->
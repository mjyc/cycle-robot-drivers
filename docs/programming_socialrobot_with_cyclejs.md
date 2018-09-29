# Programming a social robot using Cycle.js

In this post, I'll show you how to program a social robot using [Cycle.js](https://cycle.js.org/).
I assume you are familiar reactive programming.
If you are not, check out [The introduction to Reactive Programming you've been missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754).


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

<!-- To me, Cycle.js essentially makes creating and understanding interactive programs easy by enforcing functional reactive programming, e.g., using streams, and [ports and adapters architecture](http://wiki.c2.com/?PortsAndAdaptersArchitecture), e.g., separating side effects. -->


## Why Cycle.js for social robots?

To me, Cycle.js essentially enforces functional reactive programming, e.g., using streams, and [ports and adapters architecture](http://wiki.c2.com/?PortsAndAdaptersArchitecture), e.g., separating side effects, to make it easy to create and understand complex and concurrent interactive programs--beyond web applications. This is why I chose Cycle.js for programming a social robot. I believe the patterns enforced by Cycle.js will help programmers to battle the concurrency problems originated from supporting multi-modal interactions and stay in control when complexity of the desired robot behavior grows.

In fact, you don't need to use Cycle.js to program social robots without writing spaghetti code; you just need to separate side effect producing code and take a functional reactive programming approach.
For example, you could use [Yampa with reactimate](https://wiki.haskell.org/Yampa/reactimate), [Flapjax](http://www.flapjax-lang.org/), or one of [ReactiveX](http://reactivex.io/) stream libraries to do this in a language in which your robot's API is available.

<!-- I chose Cycle.js because it is consise and is compatible with javascript, which made it ease for me to learn and use. -->

<!-- As I mentioned in the "What is a social robot?" section, programming social robots involve working with multi-channel inputs and outputs that invites concurrency programs.
The concurrency programs become even harder to manage when the complexity of a desired robot behavior is high or when the robot has a large number of sensors and actuators. -->

<!-- Cycle.js framework helps programmers to organize the code and focus on  -->
<!-- The principles enforced by Cycle.js helps programmers to create while organizing . -->
<!-- Cycle.js makes it easy to create programs with complex and conccurent inputs and outputs by enforcing the separation of side-effects, i.e., [ports and adapters pattern](http://wiki.c2.com/?PortsAndAdaptersArchitecture), and taking functional reactive programming approach. -->

<!-- In fact, you don't need to use Cycle.js as long as you adapt ports and adapters pattern and functional reactive programming yourself.
For example you could use Yampa, Flapjax, or stream javascipt libraries like RxJS to do this.
I chose Cycle.js because it is consise and is compatible with javascript, which made it ease for me to learn and use. -->

<!-- _If we assume perfect robotic sensing and control_, programming a robot is like programming a web application. A web application receives inputs from human (e.g., a button click) and outputs information, just like a robot program receives inputs from the environment including humans (e.g., speech) and outputs actions. In both cases, the main logic requires to handle highly concurrent inputs and outputs and scale spatially (e.g., for web applications) or temporarily (e.g., for robot programs). I believe these requirements make Cycle.js a great candidate for programming a social robot as it encourages reactive programming and predictable (and hence scalable) coding by separating side effects. In fact, I believe any language or framework that supports similar abstractions is also a good candidate.

I understand my first assumption above will make roboticists laugh; I understand robotics researchers have not figured out general sensing and control. However, I believe they have made enough progress to use such technology in _constrained environments_ with confidence, for example, check out [Amazon Echo](https://www.google.com/aclk?sa=L&ai=DChcSEwiHnMbni63dAhWP_mQKHUYxAkgYABAAGgJwag&sig=AOD64_0pyA_aplrmSQlW_P1_aeNb1kyX6A&q=&ved=2ahUKEwiHocHni63dAhV-HzQIHW44D9wQ0Qx6BAgFEAI&adurl=), [Google Home](https://assistant.google.com/platforms/speakers/), or even [robots in indoor commercial spaces](https://spectrum.ieee.org/automaton/robotics/robotics-hardware/indoor-robots-for-commercial-spaces) if you haven't already.

Alternatively, you could use one of many existing robot programming frameworks, like [ROS](http://www.ros.org/). While ROS provides ample libraries (e.g., for sensing and control) and tools (e.g., for visualization and data analysis), it is [too heavy](http://wiki.ros.org/hydro/Installation/UbuntuARM#Installation-1) and [constrained](http://www.ros.org/reps/rep-0003.html#platforms-by-distribution) for writing simple interactive programs. I also found it difficult to create clean reactive programs that express complex dependencies between multiple input and output channels using [ROS communication patterns](http://wiki.ros.org/ROS/Patterns/Communication) in [python](http://wiki.ros.org/rospy) or [C++](http://wiki.ros.org/roscpp). -->
<!-- in python or C/C++ even with [RxPY](https://github.com/ReactiveX/RxPY) or [RxCPP](https://github.com/ReactiveX/RxCpp). -->


## Getting started

The code examples in this post assume your familiarity with [JavaScript ES6](https://medium.freecodecamp.org/write-less-do-more-with-javascript-es6-5fd4a8e50ee2). I recommend using a building tool such as [browserify](http://browserify.org/) or [webpack](https://webpack.js.org/) through a transpiler (e.g. [Babel](https://babeljs.io/) or [TypeScript](https://www.typescriptlang.org/)).

<!-- We'll create a face looking robot behavior. -->
We'll create a robot face that looks at your face.

<!-- We'll create [a simple web application](https://stackblitz.com/edit/cycle-robot-drivers-tutorials-01-getting-started) or a social robot program as I consider it. You can download the final code from [here](../examples/tutorials/01_getting_started/). -->

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

The `main` function takes a collection of streams as input (`sources`) and returns a collection of streams as output (`sink`). When `runRobotProgram` is called, it creates functions that produce side effects (_Drivers_ in Cycle.js) and connects the outputs of the drivers with the input of `main` and the output of `main` with the inputs of the drivers. This structure enforced by Cycle.js allows programmers to write the pure, reactive `main` function.

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

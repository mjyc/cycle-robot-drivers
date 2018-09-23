# Programming a social robot using Cycle.js

In this post, I'll show you how to program a social robot using Cycle.js. I assume you are familiar reactive programming. If you are not, check out [The introduction to Reactive Programming you've been missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754).

## What is a social robot?

[Wikipedia](https://en.wikipedia.org/wiki/Social_robot) introduces it as:

> A social robot is an autonomous robot that interacts and communicates with humans or other autonomous physical agents by following social behaviors and rules attached to its role.

[Cynthia Breazel](https://books.google.com/books?hl=en&lr=&id=402dquhxSTQC&oi=fnd&pg=PA1&dq=cynthia+breazeal&ots=oAToxSv8Cf&sig=KAnbgcrcT56kMQVSFobJho7WN8E#v=onepage&q&f=false), the mother of social robots, once said:

> In short, a socialable robot is socially intelligent in a human-like way, and interacting with it is like interacting with another person. At the pinnacle of achievement, they could befriend us, as we could them.

For me, a social robot is an embodied agent whose main task is to communicate with humans to help humans. So, interactive robots for [education](http://robotic.media.mit.edu/portfolio/storytelling-companion/) or [eldercare](http://www.cataliahealth.com/) fit my definition the best. However, sometimes I also consider less embodied agents that have a potential to create a relationship with us, such as [fitbit](https://www.fitbit.com), as a social robot.


## What is Cycle.js

[Cycle.js](http://cycle.js.org) is a functional and reactive JavaScript framework. It is an abstraction that separates all [side effect](https://en.wikipedia.org/wiki/Side_effect_(computer_science)) producing code into `Drivers` so the core application logic code remains [pure](https://en.wikipedia.org/wiki/Pure_function) in `main` function. The author of Cycle.js describes a web application as a _dialogue_ between a human and a computer. If we assume both are functions, the human as `y = Driver(x)` and the computer as `x = main(y)` where `x` and `y` are streams in the context of reactive programming, then the dialogue is simply two functions in a circular dependency, which I believe is why the author named the framework "Cycle.js". See [Dialogue abstraction](https://cycle.js.org/dialogue.html#dialogue-abstraction) and [Streams](https://cycle.js.org/streams.html#streams) for the detailed explanation, or [Getting started](https://cycle.js.org/getting-started.html) and [try it live](http://widdersh.in/tricycle/) for getting your hands dirty.

It is interesting to notice the similar abstractions could be found in older works of others, such as [Yampa](https://wiki.haskell.org/Yampa)'s [reactimate](https://wiki.haskell.org/Yampa/reactimate) and [ports and adapters architecture](http://wiki.c2.com/?PortsAndAdaptersArchitecture). Although [it seems Cycle.js was independently developed](https://gist.github.com/zudov/65447685838ea8b2569f), it is reassuring to see Cycle.js uses the robust pattern discovered from the past.


## Why Cycle.js for social robots?
<!-- ## Why reactive programming for social robots? -->

_If we assume perfect robotic sensing and control_, programming a robot is like programming a web application. An web application receives inputs from human (e.g., a button click) and outputs information, just like a robot program receives inputs from environment including humans (e.g., speech) and outputs actions. In both cases, the main logic require to handle highly concurrent inputs and outputs and scale spatially (e.g., for web applications) or temporarily (e.g., for robot programs). I believe these requirements make Cycle.js a great candidate for programming a social robot as it encourages reactive programming and predictable (and hence scalable) coding by separating side effects. In fact, I believe any language or framework that supports similar abstractions is also a good candidate.
<!-- To me, [the social robots that has a screen face](https://spectrum.ieee.org/automaton/robotics/humanoids/what-people-see-in-157-robot-faces) seems like physical browsers running a single page web application.  -->

I understand my first assumption above will make roboticists laugh; I understand robotics researchers have not figured out general sensing and control. However, I believe they have made enough progress to use such technology in _constrained environments_ with confidence, for example, check out [Amazon Echo](https://www.google.com/aclk?sa=L&ai=DChcSEwiHnMbni63dAhWP_mQKHUYxAkgYABAAGgJwag&sig=AOD64_0pyA_aplrmSQlW_P1_aeNb1kyX6A&q=&ved=2ahUKEwiHocHni63dAhV-HzQIHW44D9wQ0Qx6BAgFEAI&adurl=), [Google Home](https://assistant.google.com/platforms/speakers/), or even [robots in indoor commercial spaces](https://spectrum.ieee.org/automaton/robotics/robotics-hardware/indoor-robots-for-commercial-spaces) if you haven't already.

Alternatively, you could use one of many existing robot programming frameworks, like [ROS](http://www.ros.org/). While ROS provides ample libraries (e.g., for sensing and control) and tools (e.g., for visualization and data analysis), it is [too heavy](http://wiki.ros.org/hydro/Installation/UbuntuARM#Installation-1) and [constrained in platform](http://www.ros.org/reps/rep-0003.html#platforms-by-distribution) for writing simple interactive programs. I also found it difficult to create clean reactive programs that express complex dependencies between multiple input and output channels using [ROS communication patterns](http://wiki.ros.org/ROS/Patterns/Communication) in [python](http://wiki.ros.org/rospy) or [C++](http://wiki.ros.org/roscpp).
<!-- in python or C/C++ even with [RxPY](https://github.com/ReactiveX/RxPY) or [RxCPP](https://github.com/ReactiveX/RxCpp). -->


## Getting started

The code examples in this documentation assume your familiarity with [JavaScript ES6](https://medium.freecodecamp.org/write-less-do-more-with-javascript-es6-5fd4a8e50ee2). I recommend using a building tool such as [browserify](http://browserify.org/) or [webpack](https://webpack.js.org/) through a transpiler (e.g. [Babel](https://babeljs.io/) or [TypeScript](https://www.typescriptlang.org/)).


First, let's create a folder:
```
mkdir -p my-robot-program/src
cd my-robot-program
```

and create `package.json`:
```json
{
  "dependencies": {
    "@cycle-robot-drivers/run": "0.0.5",
    "@cycle/dom": "20.4.0",
    "@cycle/run": "4.4.0",
    "xstream": "11.7.0"
  },
  "devDependencies": {
    "babel-core": "^6.26.3",
    "babel-plugin-transform-object-rest-spread": "^6.26.0",
    "babel-preset-es2015": "^6.24.1",
    "babelify": "^8.0.0",
    "browserify": "^16.2.2",
    "live-server": "^1.2.0",
    "mkdirp": "~0.5.0",
    "watchify": "^3.11.0"
  },
  "scripts": {
    "build": "browserify src/index.js -t babelify --outfile dist/index.js -dv",
    "watch": "mkdirp dist && watchify src/index.js -t babelify --outfile dist/index.js -dv",
    "start": "npm run watch & live-server"
  }
}
```

`.babelrc`:

```json
{
  "presets": ["es2015"],
  "plugins": [
    "transform-object-rest-spread"
  ]
}
```

`index.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=1.0">
  <meta name="description" content="tutorial"/>
  <title>tutorial</title>
</head>
<body>
    <div id="app"></div>
    <script src="./dist/index.js"></script>
</body>
</html>
```

<!-- <iframe src="https://stackblitz.com/edit/angular?embed=1"></iframe> -->

and `src/index.js`:

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

The command should open a browser tab with `127.0.0.1:8080`.


<!-- First, let's install the packages we'll be using:

```
npm install xstream @cycle/run @cycle-robot-drivers/speech
```

Add demo here -->


Now, let's investigate the code. We'll only investigate `index.js` since the most other files are used for setting up a build system.

```js
import xs from 'xstream';
import {makeDOMDriver} from '@cycle/dom';
import {runRobotProgram} from '@cycle-robot-drivers/run';
// ...
```

The first three lines import [xstream](https://github.com/staltz/xstream) stream library, `makeDOMDriver` function for creating a [Cycle.js DOM driver](https://cycle.js.org/api/dom.html), and `runRobotProgram` function for connecting `main` function and `drivers` variable to run an application, for example:

```js
// ...

function main(sources) {
  // ...

  const sink = {
    TwoSpeechbubblesAction: greet$,
    SpeechSynthesisAction: greet$,
  };
  return sink;
}

const drivers = {
  DOM: makeDOMDriver('#app')
};

runRobotProgram(main, drivers);
```

The `main` function takes a collection of streams as an input (`source`) and returns a collection of streams as an output (`sink`).

output streams of main are used as an input for underlying actions and inputs are used as .

For example

```js
function main(sources) {
  const hello$ = sources.TabletFace.load.mapTo('Hello!');
  const nice$ = sources.SpeechSynthesisAction.result
    .take(1)
    .mapTo('Nice to meet you!');
  const greet$ = xs.merge(hello$, nice$);
    
  return {
    TwoSpeechbubblesAction: greet$,
    SpeechSynthesisAction: greet$,
  }
}
```

For example, in this main function, the program subscribes to `TabletFace.load` stream to produce a string `Hello!` and subcribe to `TabletFace.load` and take the first data from the stream (`take(1)`) to produce `Hello!`. Two produced outputs are merged as a stream `greet`, which is passed to two different action components `TwoSpeechbubblesAction` and `SpeechSynthesisAction` to make side effects, i.e., take action.



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

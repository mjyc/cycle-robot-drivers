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

First, let's install the packages we'll be using:

```
npm install xstream @cycle/run @cycle-robot-drivers/speech
```

then create `index.html`:

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

and `index.js`:

```js
import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {
  makeSpeechSynthesisActionDriver,
  makeSpeechRecognitionActionDriver,
} from '@cycle-robot-drivers/speech'


function main(sources) {
  const goal$ = xs.create();

  sources.SpeechSynthesisAction.output.addListener({
    next: data => console.warn('output', data),
  });
  sources.SpeechSynthesisAction.result.addListener({
    next: data => console.warn('result', data),
  });

  return {
    DOM: vdom$,
    SpeechSynthesisAction: goal$,
    SpeechRecognitionAction: xs.of({}),
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  SpeechSynthesisAction: makeSpeechSynthesisActionDriver(),
  SpeechRecognitionAction: makeSpeechRecognitionActionDriver(),
});
```

<!-- Add demo here -->


Let's investigate the code.

```
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';

// ...
```
you will need to import libraries

<!-- link to import libraries & create main & drivers -->
<!-- highlight the difference;  -->
<!-- the new DRIVERS -->


<!-- sending (text) & catching (speech) -->


<!-- TELEOP idea: commented out action params (and that's all) -->
<!-- TELEOP idea: commented out action params -->


<!-- Wiring things -->



1. install library
2. import libraries

(download the one that has everything as submodules)

3. Create main and library

## Tutorial 0

Let's build

Play with the robot!



## Tutorial 1

## Tutorial 2




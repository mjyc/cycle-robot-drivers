# Programming a social robot using Cycle.js

> _**Note:** Check out other posts on programming a social robot using Cycle.js too:_
> 1. [Programming a social robot using Cycle.js](./programming_socialrobot_with_cyclejs.md)
> 2. [Implementing a finite state machine in Cycle.js](./programming_socialrobot_with_fsm.md)

In this post, I'll show you how to program a social robot using [Cycle.js](https://cycle.js.org/).
I assume you are familiar with reactive programming.
If you are not, check out [The introduction to Reactive Programming you've been missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754).
If you are eager to get your hands dirty, jump to the [Implementing "travel personality test"](#implementing-travel-personality-test) section.


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
The major difference is programming social robots involves working with multi-modal inputs and outputs, e.g., speech and motion, to interact with humans instead of solely using a screen interface.

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
Specifically, we'll make the robot

1. look at you while you are interacting with the robot and
1. ask questions as shown in [this flowchart](http://www.nomadwallet.com/afford-travel-quiz-personality/).

If you are curious, check out [the complete code and the demo](https://stackblitz.com/edit/cycle-robot-drivers-tutorials-01-personality-quiz) at Stackblitz.

**IMPORTANT!!** For now, the [cycle-robot-drivers/run](../run) package we use in this post and in the Stackblitz demo only work on Chrome browsers (>= 65.0.3325.181).

The code examples in this post assume you are familiar with [JavaScript ES6](https://medium.freecodecamp.org/write-less-do-more-with-javascript-es6-5fd4a8e50ee2).
To build code, I use [browserify](http://browserify.org/) and [Babel](https://babeljs.io/) here, but feel free to use a build tool and a transpiler you prefer.
If you are not familiar with them, just fork [the Stackblitz demo code](https://stackblitz.com/edit/cycle-robot-drivers-tutorials-01-personality-quiz) and start coding!
<!-- , e.g., [webpack](https://webpack.js.org/) and [TypeScript](https://www.typescriptlang.org/). -->

Let's set up a Cycle.js application.
Create a folder:

```
mkdir my-robot-program
cd my-robot-program
```

Then download [`package.json`](../examples/tutorials/01_personality_quiz/package.json), [`.babelrc`](../examples/tutorials/01_personality_quiz/.babelrc), [`index.html`](../examples/tutorials/01_personality_quiz/index.html) and create an empty `index.js` file in the folder.
Run `npm install` to install the required npm packages.
After installing, you can run `npm start` to build and start the web application that does nothing.

Now add the following code in `index.js`:

```js
import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

function main(sources) { }

runRobotProgram(main);
```

Then run this application, e.g., by running `npm start`.
It should load a robot face on your browser.

We just successfully set up and ran a Cycle.js application!

### Robot, look at a face!

We'll now focus on implementing the first feature--looking at a face.

Let's make the robot just move its eyes by adding the following code in `main`:

```js
// ...

// "sources" is a Cycle.js term for the input of "main" / the output of "drivers"
function main(sources) {
  // "const" (and "let") is a javascript ES6 feature
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
  // "sinks" is a Cycle.js term for the output of "main" / the input of "drivers"
  return sinks;
}

// ...
```

Here we are sending commands to the `TabletFace` driver by returning the `sink.TabletFace` stream from `main`.
The [`periodic`](https://github.com/staltz/xstream#periodic) xstream factory creates a stream emitting an incremental number every second and the [`map`](https://github.com/staltz/xstream#map) xstream operator create a new stream that turns the emitted numbers into positions and another new stream that turns the emitted positions into control commands.
If you run the updated application, the robot should look left and right repeatedly.

Let's now work on detecting a face by adding more code in `main`:

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

When you run the application you should see arrays of objects printed to your browser's console.
If you don't see them, make sure you are visible to the camera and being detected via the pose visualizer located below the robot face (try scroll down).
Each array represents detected poses at current moment, which has the following format:

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

Now that we know how to move the robot's eyes and retrieve detected face data, let's put them together to make the robot look at a face.
Concretely, we'll make the robot's eyes follow a detected person's nose.
Update `main` as follows:

```js
// ...

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

// ...
```
Here we are sending commands to the `TabletDriver` by using the stream created from the output stream of the `PoseDetection` driver (`sources.PoseDetection.poses`).
To convert pose data into control commands, we use the [`filter`](https://github.com/staltz/xstream#filter) xstream operator to filter pose data to the ones containing only one person whose nose is visible. Then we use the [`map`](https://github.com/staltz/xstream#map) xstream operator twice to convert the detected nose positions into eye positions and turn the eye positions into control commands.
<!-- ... driver (`sources.PoseDetection.poses`) instead of creating one from scratch as we did above when we made the robot look left and right. -->

We have made the robot look at a face!

_Exercise ideas:_

* Make the robot look at one of [your hands](https://vignette.wikia.nocookie.net/juveniles-roleplay/images/e/e9/Louis4.gif/revision/latest?cb=20130825225246) instead of your nose?
* Make the robot smile ([`happy` expression](../screen)) when you are looking away from the camera?

#### Taking a closer look at `runRobotProgram`

While following code examples above, you may have wondered:

1. when and where is the `TabletFace` driver created
1. how and when a driver produces side effects

Here is the answer to the first question: the two drivers we used in the example code, `TabletFace` and `PoseDetection`, are created in `runRobotProgram`.
Normally when you program a Cycle.js app, you need to [create drivers explicitly](https://cycle.js.org/getting-started.html#getting-started-coding-create-main-and-drivers) and pass them to the [Cycle.js `run`](https://cycle.js.org/api/run.html) function.
We skipped this step because we used `runRobotProgram` that creates the required drivers for programming a tablet-face robot and calls Cycle.js `run` for us.
The `runRobotProgram` function is [a wrapper function for Cycle.js `run`](../run/src/index.tsx) that

1. creates five drivers, `AudioPlayer`, `SpeechSynthesis`, `SpeechRecognition`, `TabletFace`, `PoseDetection`
1. creates and sets up five action components `FacialExpressionAction`, `AudioPlayerAction`, `TwoSpeechbubblesAction`, `SpeechSynthesisAction`, `SpeechRecognitionAction` to allow programmers to use them as drivers, and
1. calls Cycle.js run with the created drivers and actions.

<!-- TODO: Add an example of manually defining a driver here -->

In fact, if you are comfortable with Cycle.js, you could use Cycle.js `run` instead of `runRobotProgram` to have more control over drivers and actions.
You could also create a new `runRobotProgram` function that provides drivers for your own robot that is not a tablet-face robot!

Regarding the second question, check out [this page](https://cycle.js.org/drivers.html) from the Cycle.js website.


### Robot, ask questions!

We'll now focus on implementing the second feature--asking the travel personality quiz questions.

First, we'll represent [the quiz flowchart](http://www.nomadwallet.com/wp-content/uploads/2014/03/travel-quiz-flowchart.jpg) as a dictionary of dictionaries for convenience. Add the following code:

```js
// ...
import {runRobotProgram} from '@cycle-robot-drivers/run';

const Question = {
  CAREER: 'Is reaching your full career potential important to you?',
  ONLINE: 'Can you see yourself working online?',
  FAMILY: 'Do you have to be near my family/friends/pets?',
  TRIPS: 'Do you think short trips are awesome?',
  HOME: 'Do you want to have a home and nice things?',
  ROUTINE: 'Do you think a routine gives your life structure?',
  JOB: 'Do you need a secure job and a stable income?',
  VACATIONER: 'You are a vacationer!',
  EXPAT: 'You are an expat!',
  NOMAD: 'You are a nomad!'
};

const Response = {
  YES: 'yes',
  NO: 'no'
};

const transitionTable = {
  [Question.CAREER]: {
    [Response.YES]: Question.ONLINE,
    [Response.NO]: Question.FAMILY,
  },
  [Question.ONLINE]: {
    [Response.YES]: Question.NOMAD,
    [Response.NO]: Question.VACATIONER,
  },
  [Question.FAMILY]: {
    [Response.YES]: Question.VACATIONER,
    [Response.NO]: Question.TRIPS,
  },
  [Question.TRIPS]: {
    [Response.YES]: Question.VACATIONER,
    [Response.NO]: Question.HOME,
  },
  [Question.HOME]: {
    [Response.YES]: Question.EXPAT,
    [Response.NO]: Question.ROUTINE,
  },
  [Question.ROUTINE]: {
    [Response.YES]: Question.EXPAT,
    [Response.NO]: Question.JOB,
  },
  [Question.JOB]: {
    [Response.YES]: Question.ONLINE,
    [Response.NO]: Question.NOMAD,
  }
};

function main(sources) {
// ...
```
Notice that I modified the quiz questions to change all response choices to "yes" and "no".

Let's now make the robot ask questions and take your verbal responses.
First, we'll make the robot to just say the first question on start, i.e., on loading the robot's face, and start listening after saying something:

```js
// ...
function main(sources) {
  sources.SpeechRecognitionAction.result.addListener({
    next: (result) => console.log('result', result)
  });
  // ...
  const sinks = {
    TabletFace: sources.PoseDetection.poses
      .filter(poses =>
      // ...
    SpeechSynthesisAction: sources.TabletFace.load.mapTo(Question.CAREER),
    SpeechRecognitionAction: sources.SpeechSynthesisAction.result.mapTo({})
  };
  return sinks;
}
// ...
```

Here we are sending commands to the `SpeechSynthesisAction` driver and the `SpeechRecognitionAction` driver by returning the created streams via `sink.SpeechSynthesisAction` and `sink.SpeechRecognitionAction` from `main`.
The input stream for the `SpeechSynthesisAction` driver emits `Question.Career` on the tablet-face-loaded event emitted in the `sources.TabletFace.load` stream.
The input stream for the `SpeechRecognitionAction` driver emits an empty object (`{}`) on finishing the speech synthesis action event emitted in the `sources.SpeechSynthesisAction.result` stream.
Both streams are created using the [`mapTo`](https://github.com/staltz/xstream#mapTo) xstream operator.
We also print out events emitted in the `sources.SpeechRecognitionAction.result` stream using the [addListener](https://github.com/staltz/xstream#addListener) xstream operator.

When you run the application, you should hear the robot saying "Is reaching your full career potential important to you?" and see the output of the `SpeechRecognitionAction` printed to your browser's console.
The output has the following format:

```js
const result = {
  "result": "yes",  // transcribed texts
  "status": {
    "goal_id": {  // a unique id for the executed action
      "stamp": "Mon Oct 01 2018 21:49:00 GMT-0700 (PDT)",  // "Date" object
      "id": "h0fogq2x0zo-1538455335646"
    },
    "status": "SUCCEEDED"  // "SUCCEEDED", "PREEMPTED", or "ABORTED"
  }
}
```

Try saying something and see how well it hears you.

Now we want to improve the program to make the robot ask more than one question.
For example, we can try to send questions as commands to the `SpeechSynthesisAction` driver whenever the robot hears an appropriate answer, i.e., "yes" or "no".
Let's try to express this by updating the code above as follows:

```js
// ...
function main(sources) {
  // ...
  const sinks = {
    TabletFace: sources.PoseDetection.poses
      .filter(poses =>
      // ...
    SpeechSynthesisAction: xs.merge(
      sources.TabletFace.load.mapTo(Question.CAREER),
      sources.SpeechRecognitionAction.result.filter(result =>
        result.status.status === 'SUCCEEDED'  // must succeed
        && (result.result === 'yes' || result.result === 'no') // only yes or no
      ).map(result => result.result).map(result => {
        // Hmm...
      })
    ),
    SpeechRecognitionAction: sources.SpeechSynthesisAction.result.mapTo({})
  };
  return sinks;
}
// ...
```

Here we are merging the commands from the stream that emits the first question (`sources.TabletFace.load.mapTo(Question.CAREER)`) and the commands from the stream that emits a subsequent question on hearing "yes" or "no" (`sources.SpeechRecognitionAction.result.filter(// ...`) using the [`merge`](https://github.com/staltz/xstream#merge) xstream factory.

There is one problem with this approach.
We cannot figure out which question to return in the second stream since the question is dependent on the last question the robot asked, which also is dependent on the last last question and so on.
In other words, we need a previous output of the current stream we are creating as a input to the current stream.

To solve this circular dependency problem, we adopt the proxy pattern by updating the `main` function as follows:

```js
// ...
function main(sources) {
  // ...
  const lastQuestion$ = xs.create();
  const question$ = xs.merge(
    sources.TabletFace.load.mapTo(Question.CAREER),
    sources.SpeechRecognitionAction.result.filter(result =>
      result.status.status === 'SUCCEEDED'  // must succeed
      && (result.result === 'yes' || result.result === 'no') // only yes or no
    ).map(result => result.result)
    .startWith('')
    .compose(sampleCombine(
      lastQuestion$
    )).map(([response, question]) => {
      return transitionTable[question][response];
    })
  );
  lastQuestion$.imitate(question$);

  const sinks = {
    TabletFace: sources.PoseDetection.poses
      .filter(poses =>
      // ...
    SpeechSynthesisAction: question$,
    SpeechRecognitionAction: sources.SpeechSynthesisAction.result.mapTo({})
  };
  return sinks;
}
// ...
```

Here we have moved creating the code for a stream for `sink.SpeechSynthesisAction` outside of the `sink` object definition.
We create an empty proxy stream `lastQuestion$` using the [`create`](https://github.com/staltz/xstream#create) xstream factory and use it when creating the `question$` stream.
Then use the [`imitate`](https://github.com/staltz/xstream#imitate) xstream operator to connect the proxy stream, `lastQuestion$`, to its source stream, `question$`.
We also use the [`compose`](https://github.com/staltz/xstream#compose) and [`sampleCombine`](https://github.com/staltz/xstream/blob/master/EXTRA_DOCS.md#sampleCombine) xstream operators to combine events from the stream originated from `sources.SpeechRecognitionAction.result` and the `lastQuestion$` stream.
Note that I add `$` at the end of stream variable names to distinguish them from other variables as Cycle.js authors do.
Try the updated application and see if the robot asks more than one question if you respond to it with "yes" or "no".

You may have wondered when did we update the code to send the "start listening" command ({}) after _all_ questions.
We didn't update the code; the code we had before already works as desired since the `sources.SpeechSynthesisAction.result` stream emits data on finishing _every_ synthesized speech.

One problem you may have faced is the robot failing to ask a next question when it hears an answer that is not "yes" or "no", e.g., by mistake.
In such case, the robot should start listening again to give the person a chance to correct their answer.
Let's update the code to fix the problem:

```js
// ...
    SpeechSynthesisAction: question$,
    SpeechRecognitionAction: xs.merge(
      sources.SpeechSynthesisAction.result,
      sources.SpeechRecognitionAction.result.filter(result =>
        result.status.status !== 'SUCCEEDED'
        || (result.result !== 'yes' && result.result !== 'no')
      )
    ).mapTo({})
  };
  return sinks;
}
// ...
```

Run the updated application.
You should see that the robot will continue to listen and print whatever it hears to the console until it hears "yes" or "no" before asking a next question.

We are done at this point.
Try taking the travel personality quiz to find out your travel personality and enjoy!

_Exercise ideas:_

* Implement one of ["The 24 Most Important Flowcharts Of All Time"](https://www.buzzfeed.com/lukelewis/the-most-important-flowcharts-of-all-time) to make the robot answer one of the biggest questions in life?
* Make your robot to read Tweets from a certain Twitter user whenever that user post a tweet, e.g., using [a Twitter API](https://developer.twitter.com/en/docs/tweets/filter-realtime/overview)?
* Make your robot alert you whenever a [stock's price goes below or above a certain threshold](https://www.youtube.com/watch?v=uS1KcjkWdoU)?

Please let me know if something isn’t clear, and I’d be happy to chat about your concerns. Thank you for reading!


## Miscellaneous

* Fun fact: [many social robots today use a screen as a face](https://spectrum.ieee.org/automaton/robotics/humanoids/what-people-see-in-157-robot-faces).
* Check out [RxJS Marbles](http://rxmarbles.com/#mergeMap) for visualizing stream operators with marble diagrams, e.g., [interval](http://rxmarbles.com/#interval) (periodic in xstream), [map](http://rxmarbles.com/#map), [filter](http://rxmarbles.com/#filter), [mapTo](http://rxmarbles.com/#mapTo), and [merge](http://rxmarbles.com/#merge).
* If you are a [ROS](http://www.ros.org/) user, check out my [experimental Cycle.js driver](https://github.com/mjyc/cycle-ros-example) for communicating with ROS using [roslibjs](https://github.com/RobotWebTools/roslibjs).
* Help me improve [cycle-robot-drivers](./) library by participating in [this brief survey](https://goo.gl/forms/rdnvgk8rWrUmbtrt1)!

_My name is Mike Chung. I'm a [graduate student](https://homes.cs.washington.edu/~mjyc/) interested in the field of human-robot interaction and machine learning. You can reach me on [Twitter](https://twitter.com/mjyc_) and on [GitHub](https://github.com/mjyc)._

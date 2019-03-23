---
controls: false
progress: false
theme : "white"
transition: "slides"
logoImg: "./figs/hcr_logo.png"
highlightTheme: "github"
fragments: true
slideNumber: true
---

## Reactive Programming for Robot Applications

### Michael Jae-Yoon Chung

#### ROS Seattle Meetup, 2019/03/27

---

<a href="https://spectrum.ieee.org/automaton/robotics/robotics-hardware/indoor-robots-for-commercial-spaces">
  <img data-src="./figs/indoor_robots.jpg">
</a>


Note:

Robots are making appearances in our lives.
Today, robots in commercial spaces are providing services such as security, delivery, and inventory monitoring.

---

<a href="https://www.sciencefocus.com/future-technology/cozmos-robot-character-hides-healthcare-payload/">
  <img width="60%" data-src="./figs/cozmo_kids_wide.jpg">
</a>
<a href="https://variety.com/2017/digital/news/amazon-echo-show-alexa-calling-1202421062/">
  <img width="60%" data-src="./figs/echoshow.jpg">
</a>


Note:

At home, we have toy robots like Anki Cozmo and smart assistant devices like Amazon echoshow that entertain us or provide useful information to us.

---

<a href="http://www.savioke.com/blog/2017/6/22/new-interfaces-enable-relay-users-to-significantly-expand-and-improve-robot-capabilities-and-services">
  <img width="45%" data-src="./figs/relay_pickup.jpg">
</a>
<a href="https://www.trustedreviews.com/news/toy-of-the-year-3325584">
  <img width="50.8%" data-src="./figs/cozmo_game.jpg">
</a>


Note:

One common aspect of all these robots in human-environment is that they are constantly interacting with the environment including humans.
To make such robots more usable, building interactive applications that are robust and easy to maintain have become critical.

---

## Challenges

* Uncertainty
* Temporailty <!-- .element: class="fragment" -->
* Concurrency <!-- .element: class="fragment" -->


Note:

However, programming such applications is not trivial because handling perception or actuation uncertainty is challenging for programmers.
Even when programmers can assume robust robot perception and control, getting temporality right in interactive applications is not trivial.
Another related challenge is handling concurrency issues, which often emerge when working with multi-model interaction interfaces or asynchronous processes, e.g. a central control system.

---

## Challenges

* Uncertainty
* Temporailty
* Concurrency <!-- .element: class="fragment grow" -->


Note:

In this talk, I will focus on proposing an architecture that is intended to enable non-roboticist programmers, primarily web developers, to program robot applications easily.
I find the problem of finding an architecture that handles uncertainty or temporality issues not as interesting because (i) I'm not fully convinced whether the end-user programmers should be working with probabilities directly and (ii) the concurrency issues seem to subsume the temporality issues I've faced so far.

---

## Cycle.js + ROS


Note:

I propose using a web development framework based called Cycle.js with ROS for building interactive robot applications.

---

## What is [Cycle.js](http://cycle.js.org)?

* [functional reactive programming](http://conal.net/papers/icfp97/) framework in JavaScript
* abstraction that separates [side-effect](https://bit.ly/2dSGoZF) producing code from the main business logic code so the main code remains [pure](https://en.wikipedia.org/wiki/Pure_function) and predictable.


Note:

What is Cycle.js?
It is a functional reactive programming framework in JavaScript that allows programmers to express system behaviors as orchestrations of dataflow instead of imperative flows of controls.
The framework also enforces programmers to separate side-effect producing code from the main business logic code to keep the main code pure and hence more predictable.

---

<img data-src="./figs/dialogue_diagram_ros.png" style="background:none; border:none; box-shadow:none;">


Note:

Let's try to understand what that means from what we know; creating a program in ROS.
Imagine how you would program a greeting robot behavior that proactively greets a person depends on distance-to-person in ROS.
I would write a new ROS node that implements the desired behavior by subscribing to topics from existing perception nodes and publishing topics to the existing control nodes.
For example, ...

```mermaid
graph TD
A( /greeting_behavior ) -->| /move_base/goal, <br> /sound_play/SoundRequest| B
B( /move_base, /leg_detector, /sound_play ) -->| /move_base/result <br> /leg_tracker_measurements | A

{
  "theme": "forest"
}
```

https://mermaidjs.github.io/mermaid-live-editor/

---

New specifications:

* notify the server on certain events
* coordinate text-to-speech and base-movement


Note:

The concurrency issues I pointed out earlier usually occur in the behavior node as soon as the desired behavior becomes more complex.
Let's say we have additional specifications such as the robot needs to notify to the central control system for logging purpose or the robot needs to coordinate text-to-speech and base movement to make its internal state more transparent.
Now you are facing nontrivial decisions to make such as where to place notification trigger and trigger event definition location, e.g., in a new node vs. in the behavior node, and a way to synchronize speech and movement related logic.
In addition, due to the increased number of the system's concurrent inputs and outputs, we are also likely to have race-condition related bugs in our code.

---

<img width="70%" data-src="./figs/dialogue_diagram.png" style="background:none; border:none; box-shadow:none;">

`sinks = main(sources)` <!-- .element: class="fragment" data-fragment-index="1" -->

`sources = Drivers(sinks)` <!-- .element: class="fragment" data-fragment-index="1" -->


Note:

The Cycle.js proposes an architecture that considers all components as functions that process to input data streams and returns output data streams, e.g., data streams could carry control signals or sensor data, and enforces separating components that produce side-effects from the behavior logic.
Then running an application means setting up cyclic dependencies between two groups of components: mains and drivers.

---

<img width="70%" data-src="./figs/dialogue_diagram.png" style="background:none; border:none; box-shadow:none; margin: 0px;">

<!-- .element: style="margin: 0px" -->

* Notification code in [`Driver`](https://cycle.js.org/drivers.html)
* Event definition and coordination logic code in `main` using stream operators, e.g., [`map`](https://github.com/staltz/xstream#map), [`filter`](https://github.com/staltz/xstream#filter), [`combine`](https://github.com/staltz/xstream#combine), [`merge`](https://github.com/staltz/xstream#merge), [`delay`](https://github.com/staltz/xstream#delay), etc.


Note:

For our running example, this means placing new side-effect making code in drivers, e.g., notification code, and implement the desired behaviors using stream operators on input data streams in the `main` function, as if we are arranging dataflow.
For example, we could define a notification trigger condition using stream operators on relevant input data and return a data stream of signals that command the Notification driver to send a notification.

---

<iframe width="100%" height="600px" src="https://stackblitz.com/edit/ros-seattle-meetup-20190328?embed=1&file=index.js&view=editor"></iframe>


Note:

Let's look at an example.
Let's see what the robot is supposed to be doing.
_{go through code}_
We'll make a simple screen robot face do something.
_{demo implementing a new behavior}_

Ideas:

* overall code structure; import, main, driver, and run
* the main function
  * the main business logic that defines robot behavior
  * wiring data streams which carry values over time, like topics
* demo
  * displaying "hello"
  * displaying "hello" only when a person is visible

```
var face$ = xs.periodic(2000)
  .mapTo({type: 'EXPRESS', value: {type: 'happy'}});
```

---

<iframe width="100%" height="600px" src="https://stackblitz.com/edit/ros-seattle-meetup-20190328?embed=1&file=makeSpeechSynthesisDriver.js&view=editor"></iframe>


Note:

You might be wondering how the side-effects are produced in drivers.
Let's take a look at one driver implementation.

---

Check out [cycle-robot-drivers](https://github.com/mjyc/cycle-robot-drivers) github repo for more drivers and example applications!


Note:

---

## ROS API as Cycle.js Driver

```
{publishedTopics} = ROSNodeDriver({subscribedTopics});

{result, feedback, status} = ROSActionDriver({goal, cancel});

{response} = ROSServiceDriver({request});

{latestValue1, ...} = ROSParamDriver({newValue1, ...});
```
<!-- .element: style="font-size: 0.5em" -->

See [cycle-ros-example](https://github.com/mjyc/cycle-ros-example) github repo for details.


Note:

So far we have not seen how we can integrate ROS into the Cycle.js framework.
Since ROS is also a network data streams, it fits naturally with the paradigms enforced by Cycle.js.
Specifically, the example code I linked here demonstrates a way to bridge the ROS topics and parameters with the data streams used in Cycle.js and exposing the service API as a Cycle.js' driver that takes request and response data streams.
In addition, the side-effect producing component separation suggested by Cycle.js is naturally enforced as ROS nodes that produce side-effects are only accessible via drivers.

---

## Potential Applications

* Interactive manipulation <!-- .element: class="fragment" -->
* Environment-aware navigation <!-- .element: class="fragment" -->
* Social robot behaviors <!-- .element: class="fragment" -->


Note:

---

## Related Work

* [Functional Reactive Animation](http://conal.net/papers/icfp97/)
* [Yampa](https://wiki.haskell.org/Yampa)
* ["Reactive ROS" topic in ROS discourse](https://discourse.ros.org/t/reactive-ros/)
* [Playful](https://playful.is.tuebingen.mpg.de)


Note:

Taking a reactive programming approach to implementing interactive application has a long history.

---

## Future Work

* Adapting the pattern in python or cpp via [ReactiveX](http://reactivex.io/)
* More robotics tool supports for web developers, e.g., [recording](https://codesandbox.io/s/9lyowx5q0y) and [replaying](https://codesandbox.io/s/48oozw2qz7) data


Note:

Encourage ROS users to try reactive programming.
Encourage web developers to program robots / use ROS.

---

## Conclusion

* Cycle.js + ROS as a reactive programming solution for robot applications
* Use-case demonstrations
* Try reactive programming in your next project!

---

## More Reading

* [Programming a social robot using Cycle.js](https://dev.to/mjyc/programming-a-social-robot-using-cyclejs-23jl)
* [Implementing a finite state machine in Cycle.js](https://dev.to/mjyc/implementing-a-finite-state-machine-in-cyclejs-1e63)

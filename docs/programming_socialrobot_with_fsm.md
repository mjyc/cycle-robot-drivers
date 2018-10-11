# Programming a reactive social robot program as a finite state machine

In this post, I'll show you how to implement a reactive social robot program as a [finite state machine](https://en.wikipedia.org/wiki/Finite-state_machine).
We'll continue from where we left off in the previous post [Programming a social robot using Cycle.js](./programming_socialrobot_with_cyclejs.md)--so check it out if you haven't already!


## Making "travel personality quiz" program more complex

In the previous post, we programmed a [tablet-face robot](https://github.com/mjyc/tablet-robot-face) to test your travel personality.
Concretely, we implemented a tablet-face robot program that

1. looks at a person when it sees one and
1. asks travel personality quiz questions as shown in [this flowchart](http://www.nomadwallet.com/afford-travel-quiz-personality/)

as a [Cycle.js](https://cycle.js.org/) application.
[The complete code and the demo](https://stackblitz.com/edit/cycle-robot-drivers-tutorials-01-personality-quiz) is available at Stackblitz.

**IMPORTANT!!** The main package we use in the demo and in this post, [cycle-robot-drivers/run](../run), only works on Chrome browsers  (>= 65.0.3325.181) for now.

Now, what if we want the robot

1. look at a person only when the robot is waiting for a person's response,
1. stop asking a question if the robot cannot see a person and resume asking the question if it sees a person again, and
1. stop asking questions completely if a person abandons the robot, i.e., the robot does not see a person for more than 10 seconds.

How difficult would it be to update the existing program to have these additional behaviors?
Try implementing the new behaviors on top of the [travel personality quiz program](../examples/tutorials/01_personality_quiz/index.js)--what kind of challenges do you face?

From my experience, there were two major challenges; clearly expressing the desired robot behavior and implementing the desired behavior in a reactive programming framework.
To address the first challenge, we'll use a finite state machine for its simplicity.
For the second challenge, I'll present a pattern for implementing a finite state machine in a reactive programming framework [Cycle.js](https://cycle.js.org/) without scarifying maintainability.
<!-- In the rest of this post, I'll first demonstrate using a finite state machine to express a complex desired behavior.
Then I'll present a pattern for implementing a finite state machine in a reactive programming framework Cycle.js without scarifying maintainability. -->


## What is a finite state machine?

A [finite state machine (FSM)](https://en.wikipedia.org/wiki/Finite-state_machine) is a computational model that can be used to represent and control execution flow.
Due to their simplicity, FSMs have been frequently used by [roboticists](http://wiki.ros.org/smach), [UI developers](https://sketch.systems/) and many others for a [long](https://www.mtholyoke.edu/courses/pdobosh/cs100/handouts/genghis.pdf) [time](http://www.inf.ed.ac.uk/teaching/courses/seoc/2005_2006/resources/statecharts.pdf). An FSM we are using in this post is comprised of five parts:

1. A set of states, e.g., `'SAY_SENTENCE'`, `'WAIT_FOR_RESPONSE'`, etc.
1. A set of variables, e.g., `currentSentence = 'Can you see yourself working online?'`
1. A set of inputs: e.g., `VALID_RESPONSE`, `INVALID_RESPONSE`, etc.
1. A set of outputs: e.g., `speechSynthesisAction = 'Can you see yourself working online?'`
1. A transition function that takes a state, variable, and input and returns a state, variable, and output.

If you are familiar with FSMs, the FSM we are using is a [mealy machine](https://en.wikipedia.org/wiki/Mealy_machine) extended with variables.
Like a mealy machine, it has the following constraints:

* the state set is a [finite set](https://en.wikipedia.org/wiki/Finite_set)
* the FSM can only be in one state in the state set
* the transition function is deterministic; given a state, variable, and input the function always returns the same new state, variable, and output.

<!-- Notice that we made state names verbs as the popular robotics library [SMACH](http://wiki.ros.org/smach) does.
This is because we define state based on distinct actions each state is performing, which are triggered by outputs emitted from transitions. -->


## Implementing the "travel personality test" FSM using Cycle.js

Let's now implement the "travel personality test" program as an FSM.

<!-- We'll start from representing the ["travel personality test" program](../examples/tutorials/01_personality_quiz/index.js) we implemented in the previous post extended with the first additional behavior mentioned above: looking at a person only when the robot is waiting for a person's response.
Such a program can be expressed as an FSM like this: -->
We'll start from representing the ["travel personality test" program](../examples/tutorials/01_personality_quiz/index.js) we implemented in the previous post as follows:

![travel_personality_quiz_fsm](./travel_personality_quiz_fsm.svg)

Here we have three states, `PEND`, `SAY`, `LISTEN`, and five input types, `START`, `SAY_DONE`, `VALID_RESPONSE`, `INVALID_RESPONSE`, and `DETECTED_FACE`.
We omitted variables associated with each state and outputs associated with each transition for visual clarity.

Notice that we use verbs as state names (as a popular robotics FSM library [SMACH](http://wiki.ros.org/smach) does).
This is because we define the states based on distinct actions each state is performing, which are triggered by outputs emitted from transitions.
We did not make each state in the [travel quiz flowchart](http://www.nomadwallet.com/afford-travel-quiz-personality/) as an individual state.
This is because we represent all states that behave the same except the sentence the robot says at a state, which we factor out as the variable `currentSentence` (not shown in the diagram), with the single `SAY` state to make the FSM compact.
We represent the input in similar manner by representing it as a type-value pair.
For example, the `LISTEN` to `SAY` transition will update the `currentSentence` variable appropriately based on the value of the `VALID_RESPONSE` type input which can be "yes" or "no" (input values are not shown in the graph).

Now, let's update the FSM to express the first additional behavior mentioned above: looking at a person only when the robot is waiting for a person's response.

![travel_personality_quiz_fsm_updated](./travel_personality_quiz_fsm_updated.svg)

All we did here is removing the two self-loop transitions from the `PEND` and `SAY` states to stop the robot from looking at a person while the FSM is in those states.

Here we have three states and four input types and omitted something. 
First, we'll start from defining an FSM as follows:

```js
const State = {
  PEND: 'PEND',
  SAY: 'SAY',  //_SENTENCE
  LISTEN: 'LISTEN',  //_FOR_RESPONSE
};

const InputType = {
  GOAL: `GOAL`,
  SAY_DONE: `SAY_DONE`,
  VALID_RESPONSE: `VALID_RESPONSE`,
  INVALID_RESPONSE: `INVALID_RESPONSE`,
  DETECTED_FACE: `DETECTED_FACE`,
};

function transition(state, variables, input) {
  const outputs = null;
  return {state, variables, outputs};
}

/**
 * // Example state, variables, input, and outputs
 * const state = State.PEND;
 * const variables = {
 *   sentence: 'You are a vacationer!',
 * };
 * const input = {
 *   type: InputType.GOAL,
 *   value: null,
 * };
 * const outputs = {
 *   SpeechSynthesisAction: {
 *     goal: 'You are a vacationer!'
 *   },
 *   SpeechRecognitionAction: {
 *     goal: {}
 *   },
 *   TabletFace: {
 *     goal: {
 *       type: 'SET_STATE',
 *       value: {
 *         leftEye: {x: 0.5, y: 0.5},
 *         rightEye: {x: 0.5, y: 0.5},
 *       },
 *     }},
 *   },
 * }
 */
```

Let's now build a Cycle.js application as follows:

```js
import xs from 'xstream';
import {runRobotProgram} from '@cycle-robot-drivers/run';

const State = {
// ...
const InputType = {
// ...
const transition(state, variables, input) {
// ...

function main(sources) { 
  const input$ = xs.never();

  defaultMachine = {
    state: State.PEND,
    variables: {
      sentence: null,
    },
    outputs: null,
  };

  const machine$ = input$.fold((machine, input) => transition(
    machine.state, machine.variables, input
  ), defaultMachine);

  const outputs$ = machine$
    .filter(machine => !!machine.outputs)
    .map(machine => machine.outputs);

  return {
    SpeechSynthesisAction: outputs$
      .filter(outputs => !!outputs.SpeechSynthesisAction)
      .map(output => output.SpeechSynthesisAction.goal),
    SpeechRecognitionAction: outputs$
      .filter(outputs => !!outputs.SpeechRecognitionAction)
      .map(output => output.SpeechRecognitionAction.goal),
    TabletFace: outputs$
      .filter(outputs => !!outputs.TabletFace)
      .map(output => output.TabletFace.goal),
  };
}

runRobotProgram(main);
```

Here we setup a Cycle.js app by ...

<!-- kept the variables as they were there before. rename transition => flowchart -->

update the main as follows

```js
function main(sources) {

  const defaultMachine = {
    state: State.PEND,
    variables: {
      question: null,
    },
    outputs: null,
  };

  const input$ = sources.Tablet.load;

  const machine$ = input$.fold((machine, input) => update(
    machine.state, machine.variables, input
  ), defaultMachine);

  const outputs$ = machine$
    .filter(machine => !!machine.outputs)
    .map(machine => machine.outputs);

  return {
    SpeechSynthesisAction: outputs$
      .filter(outputs => !!outputs.SpeechSynthesisAction)
      .map(output => output.SpeechSynthesisAction.goal),
    SpeechRecognitionAction: outputs$
      .filter(outputs => !!outputs.SpeechRecognitionAction)
      .map(output => output.SpeechRecognitionAction.goal),
    TabletFace: outputs$
      .filter(outputs => !!outputs.TabletFace)
      .map(output => output.TabletFace.goal),
  };
}
```

First, we define state machine as a object with the three fields.

We then define the `input$` stream, which is simply the load stream that emits an event once when DOM is loaded for now,

Now we use fold operator in input to update the state machine over time.

Finally we create a outputs stream and create new streams as commands to action drivers.

We now have a simple state machine! Try running it! You should 

<!-- Then we define the `machine$` stream using `fold` on input. This is where the `transition` is happening.

We now have a simplest state machine! -->


## Making it more complex


<!-- ### Defining inputs and outputs (and udpate the relevant code)

we'll include variable field in input

### Defining transition (and emission)

the big function

### That's it! -->

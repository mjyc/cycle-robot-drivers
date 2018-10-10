# Programming a social robot using a finite state machine
<!-- Programming a reactive social robot program as finite state machine -->

In this post, I'll show you how to program a social robot using a [finite state machine](https://en.wikipedia.org/wiki/Finite-state_machine).
We'll continue from where we left off in the previous post [Programming a social robot using Cycle.js](./programming_socialrobot_with_cyclejs.md)--so check it out if you haven't already!

## Making "travel personality quiz" program more complex

In the previous post, we programmed the [tablet-face robot](https://github.com/mjyc/tablet-robot-face) to test your travel personality.
Concretely, we implemented a tablet-face robot program that

1. looks at a person when it sees one and
2. asks travel personality quiz questions as shown in [this flowchart](http://www.nomadwallet.com/afford-travel-quiz-personality/).

[The complete code and the demo](https://stackblitz.com/edit/cycle-robot-drivers-tutorials-01-personality-quiz) is available via Stackblitz.

**IMPORTANT!!** The main pacakge we use in the demo and in this post, [cycle-robot-drivers/run](../run), only works on Chrome browsers for now.

Now, what if we want the robot to

1. only look at a person when it is waiting for a person's response,
2. stop asking a question if the robot cannot see a person and resume asking the question if it sees a person again
3. stop asking questions completely if it does not see a person for more than 10 seconds.

How difficult would it be to update the existing program to have these additional behaviors?
Try implementing the new behaviors on top of the [travel personality quiz program](../examples/tutorials/01_personality_quiz/index.js), what kind of challenges do you face?

From my experience, there were two major challenges; first, clearly expressing the desired robot behavior without any implementation and second, implementing the desired behavior in a reactive programming framework.
In this post, I'll show how to address the first challenge using a finite state machine, a representation frequently used by roboticists and UX deisngers.
I'll also demonstrate a pattern for implementing finite state machine in a reactive programming framework.

<!-- From my experience, there were two major challenges; first, clearly expressing the desired robot behavior without any implementation and second, implementing the stated behavior in a reactive programming framework.

To address the first challenge, I adopted a finite state machine, , which is widely used by roboticists as well as UX designers .
For the second challenge, I updated -->

<!-- From my experience, expressing the desired, complex human-robot interaction as a finite state machine  -->
<!-- From my experience, working with a "state" in a reactive programming framework was not trivial.
For example, to implement the first additional behavior, we need to know whether the robot is currently waiting for a human response, i.e., speech recognition action is running, or not.
However, there is no direct way to access the state of speech recognition so we need to write additional code.
In addition to the problem of representing a state, writing logic for transitioning between states can be error-prone if it is not done properly. -->


## What is finite state machine?

Finite state machine (FSM) is a computational model that can be used for making sequential decisions. <!-- to represent and control execution flow -->
A FSM we are using in this post is comprised of five parts:

0. A set of states, e.g., `'ASK_QUESTION'`, `'WAIT_FOR_RESPONSE'`, etc.
0. A set of variables, e.g., `currentQuestion`
0. A set of inputs: e.g., `VALID_RESPONSE`, `INVALID_RESPONSE`, etc.
0. A set of outputs: e.g., `SpeechSynthesisAction`, `SpeechSynthesisAction`
0. A transition function that takes a state, variable, and input and returns a state, variable, and output.

<!-- If you are familiar with FSMs, the above FSM is a [mealy machine](https://en.wikipedia.org/wiki/Mealy_machine) with  -->

The FSM we use has the following restrictions

* there are finite set of states
* the FSM can only be in one state
* the transition function is deterministic: changes its state and emits an output in response to an input

<!-- A FSM can only be in one state 
Finite state machine is a computational model for making sequential decision.
A FSM can only be in one state of the finite states, and changes its state and emits an output in response to an input.
It is composed of five parts -->


## Updating the "travel personality test" program as a FSM

We'll start by identifying states and variables

Define State

```js
const State = {
  PEND: 'PEND',
  ASK: 'ASK',
  WAIT: 'WAIT',
};

const InputType = {
  GOAL: 'GOAL',
  ASK_SUCCESS: 'ASK_SUCCESS',
  VALID_RESPONSE: 'VALID_RESPONSE',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  DETECTED_FACE: 'DETECTED_FACE',
};

const Question = {
  // ...
};

const Response = {
  // ...
};

const flowchart = {
  // ...
};

```

kept the variables as they were there before. rename transition => flowchart

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

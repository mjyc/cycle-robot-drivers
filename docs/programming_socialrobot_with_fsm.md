# Programming a social robot using finite state machine

In this post, I'll show you how to program a social robot using finite state machine (FSM).
We'll build on top of the previous examplde code
So if you haven't read it, I go check it out.
<!-- I assume you have read the previous post, [Programming a social robot using Cycle.js](./programming_socialrobot_with_cyclejs.md).
If you haven't, check it out since we are building examples on top of the example code used in the previous post. -->


## What is finite state machine (FSM)?

Finite state machine is a computational model for making sequential decision.
A FSM can only be in one state of the finite states, and changes its state and emits an output in response to an input.
It is composed of five parts

## Why use FSM?

Imagine you want to 

<!-- Mathmatically, it is a tuple: -->

<!-- A Mealy machine is a 6-tuple {\displaystyle (S,S_{0},\Sigma ,\Lambda ,T,G)} (S, S_0, \Sigma, \Lambda, T, G) consisting of the following:

a finite set of states {\displaystyle S} S
a start state (also called initial state) {\displaystyle S_{0}} S_{0} which is an element of {\displaystyle S} S
a finite set called the input alphabet {\displaystyle \Sigma } \Sigma 
a finite set called the output alphabet {\displaystyle \Lambda } \Lambda 
a transition function {\displaystyle T:S\times \Sigma \rightarrow S} T : S \times \Sigma \rightarrow S mapping pairs of a state and an input symbol to the corresponding next state.
an output function {\displaystyle G:S\times \Sigma \rightarrow \Lambda } G:S\times \Sigma \rightarrow \Lambda  mapping pairs of a state and an input symbol to the corresponding output symbol.  
In some formulations, the transition and output functions are coalesced into a single function {\displaystyle T:S\times \Sigma \rightarrow S\times \Lambda } T:S\times \Sigma \rightarrow S\times \Lambda . -->

Why do we care about this? What is wrong with using?

Imagine

1. follow face only when it is waiting for a person
2. stop asking questions if a person is not visibile on screen
3. resume by 

For 1. you have to know whether the robot is waiting for a person or not
For 2. you have to know whether the last asked question 

Also in general

* multiple clicks; whatever
* loading action while waiting--which is what I'm doing
* disable something else while waiting
* unexpected / multiple inputs (voice & touch)

<!-- ## Implementing traffic light FSM and Cycle.js

TODO: Copy the example from there

```
``` -->

## Updating "travel personality test" to use FSM

<!-- ### Defining states and variables (and udpate the relevant code) -->

We'll start by identifying states and variables

Define Stae
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

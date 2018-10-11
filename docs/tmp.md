

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






Let's now implement the "travel personality test" program as an FSM.

<!-- We'll start from representing the ["travel personality test" program](../examples/tutorials/01_personality_quiz/index.js) we implemented in the previous post extended with the first additional behavior mentioned above: looking at a person only when the robot is waiting for a person's response.
Such a program can be expressed as an FSM like this: -->



<!-- Notice that we made state names verbs.
This is because state represent an action the robot is running at the moment. -->
<!-- We make state names verbs since the FSM emits outputs that trigger actions on entering a state. -->






Here we define the set of states as `State`, the variable as a set of strings `sentence`, the input as a type-value pair using a javascript object with `type` and `value` fields, and the outputs as
The `State` variable defines the set of states and variables
We represent input as a type-value pair which is implemented as an javascript object with type and value fields.
Outputs 






## Expressing the "travel personality test" program as a FSM

Let's now represent the desired "travel personality test" program as a FSM.

We'll start from defining a set of states:

* `PEND`
* `SAY`(_SENTENCE)
* `LISTEN`(_FOR_RESPONSE)
* `WAIT`(_FOR_PERSON)

a variable

* `sentence`: a set of strings that has elements like `'Is it important that you reach your full career potential?'`, `'You are a vacationer!'`, etc.

and input types:

* `GOAL`
* `SAY_DONE`
* `VALID_RESPONSE`
* `INVALID_RESPONSE`
* `DETECTED_FACE`
* `FOUND_PERSON`
* `LOST_PERSON`
* `TIMED_OUT`

and outputs:

* speechSynthesisActionGoal
* speechRecognitionActionGoal
* tabletFaceStateCommand

We then visualize the transition function as follows:

![travel_personality_quiz_fsm](./travel_personality_quiz_fsm.svg)

Here each color means something






<!-- and define a variable `sentence` as a set of strings for storing sentences like `'Is it important that you reach your full career potential?'`, `'You are a vacationer!'`, etc.

We then define input as a tuple ()

a set of input types:

* `GOAL`
* `SAY_DONE`
* `VALID_RESPONSE`
* `INVALID_RESPONSE`
* `DETECTED_FACE`
* `FOUND_PERSON`
* `LOST_PERSON`
* `TIMED_OUT`


Notice that instead of making each sentence 

outputs are 

Then transitions could be visualized as

![travel_personality_quiz_fsm](./travel_personality_quiz_fsm.svg)

Note that self-transitions  -->






margin=10, minlen=1, 
margin=10, minlen=1, 
margin=10, minlen=1, 
margin=10, minlen=1, 
margin=10, minlen=1, 
margin=10, minlen=1, 
margin=10, minlen=1, 
margin=10, minlen=1, 






<!-- A FSM can only be in one state 
Finite state machine is a computational model for making sequential decision.
A FSM can only be in one state of the finite states, and changes its state and emits an output in response to an input.
It is composed of five parts -->



<!-- From my experience, there were two major challenges; first, clearly expressing the desired robot behavior without any implementation and second, implementing the stated behavior in a reactive programming framework.

To address the first challenge, I adopted a finite state machine, , which is widely used by roboticists as well as UX designers .
For the second challenge, I updated -->

<!-- From my experience, expressing the desired, complex human-robot interaction as a finite state machine  -->
<!-- From my experience, working with a "state" in a reactive programming framework was not trivial.
For example, to implement the first additional behavior, we need to know whether the robot is currently waiting for a human response, i.e., speech recognition action is running, or not.
However, there is no direct way to access the state of speech recognition so we need to write additional code.
In addition to the problem of representing a state, writing logic for transitioning between states can be error-prone if it is not done properly. -->




<!-- From my experience, it was not trivial.
For example, if we were to implement the behavior 1. on top of the [travel personality quiz program](../examples/tutorials/01_personality_quiz/index.js), we need to  -->


<!-- But checking whether the speech recognition is running or not requires us to monitor the goals sent to and the results the action and  -->

<!-- and "knowing" whether the robot is waiting requires remembering last value sent to or emitted from the SpeechRecognitionAction driver.

To figure out whether 

But there is no direct way to "know" the state other than 

SpeechRecognitionAction

it requires remembering last 

From my experience, working with a "state" in reactive programming in general was not trivial.
For example, to implement the first additional behavior, we need to know whether the robot is currently waiting for a human response.
However, -->


<!-- which we will have to somehow make the program to "remember" from 

However, extracting and remembering such information 

From my experience, it was easy to represent a desired complex human-robot interaction as a finite state machine but implementing the desired behavior without an abstraction quickly resulted in spaghetti code. -->


<!-- From my experience of programming social robots using the reactive programming approach, it became increasingly difficult to maintain readable code when the complexity of supported interactions grew.

However, I noticed UX designers expressed complex user interaction flow as a user flowchart, which looked very similar to finite state machine. -->




<!-- The desired complex user interactions were easy to represent as a flowchart however implementing 
The desired complex user interaction flow was easy to represent as a state machine 
In general, it especially was difficult to convert a user interaction flowchart into a reactive program.
Especially difficult when I was trying to convert.
To address the problem,  -->

<!-- the difficulty of manging as user flow became more complex.
In my experience, using the reactive programming approach,  -->

<!-- In my experience, it was very difficult to implement a complex program as I mentioned here because "state". -->

<!-- For example, in the previous example, we use a proxy to which made the code little bit difficult to read. -->
<!-- Another pattern we could use is using `reduce` , which I won't go into details at this point. -->
<!-- Another pattern we could use is using `reduce` , -->
<!-- Since FSM is natural for expressing state dependent programs, we'll use it. -->


<!-- Now, imagine extending this program to add more features, such as

1. follow face only when it is waiting for a person
2. stop asking questions if a person is not visibile on screen and resume
3. multiple inputs

Do you think you can implement them easily? why or why not? -->

<!-- In my experience, it was difficult to build complex programs because 
In my experience, it was very difficult to build complex because are stateless and need to use proxy pattern, higher-order streams, etc., to ... reduce or scan, which were all difficult to understand. -->






<!-- ## Why use FSM?

Imagine you want to  -->

<!-- Mathmatically, it is a tuple: -->

<!-- A Mealy machine is a 6-tuple {\displaystyle (S,S_{0},\Sigma ,\Lambda ,T,G)} (S, S_0, \Sigma, \Lambda, T, G) consisting of the following:

a finite set of states {\displaystyle S} S
a start state (also called initial state) {\displaystyle S_{0}} S_{0} which is an element of {\displaystyle S} S
a finite set called the input alphabet {\displaystyle \Sigma } \Sigma 
a finite set called the output alphabet {\displaystyle \Lambda } \Lambda 
a transition function {\displaystyle T:S\times \Sigma \rightarrow S} T : S \times \Sigma \rightarrow S mapping pairs of a state and an input symbol to the corresponding next state.
an output function {\displaystyle G:S\times \Sigma \rightarrow \Lambda } G:S\times \Sigma \rightarrow \Lambda  mapping pairs of a state and an input symbol to the corresponding output symbol.  
In some formulations, the transition and output functions are coalesced into a single function {\displaystyle T:S\times \Sigma \rightarrow S\times \Lambda } T:S\times \Sigma \rightarrow S\times \Lambda . -->

<!-- Why do we care about this? What is wrong with using?

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
* unexpected / multiple inputs (voice & touch) -->

<!-- ## Implementing traffic light FSM and Cycle.js

TODO: Copy the example from there

```
``` -->








<!-- I'll continue from where we left off  -->

<!-- I assume you have read the previous post, [Programming a social robot using Cycle.js](./programming_socialrobot_with_cyclejs.md),  -->

<!-- I'll program a tablet face robot, a  -->
<!-- For the  introduction of social robot -->
<!-- What is a social robot? -->

<!-- In the previous post, [Programming a social robot using Cycle.js](./programming_socialrobot_with_cyclejs.md), I demonstrated how to program a social robot using reactive programming approach.
Now imagine extending ... -->

<!-- [Programming a social robot using Cycle.js](./programming_socialrobot_with_cyclejs.md) -->


<!-- Specifically, we'll update and extend the [the travel personality quiz program](https://stackblitz.com/edit/cycle-robot-drivers-tutorials-01-personality-quiz) from the previous post . -->

<!-- # Programming a social robot with a finite state machine
In this post, I'll show you how to program a social robot with 


In this post, I'll show you how to program a social robot using finite state machine (FSM).

We'll continue from [the travel personality quiz program]() we built in the previous post, [Programming a social robot using Cycle.js](./programming_socialrobot_with_cyclejs.md).

We'll build on top of using reactive programming and Cycle.js framework which I demonstrated in the previous post, [Programming a social robot using Cycle.js](./programming_socialrobot_with_cyclejs.md).
So check it out, if you haven't read it already. -->

<!-- If you are eager to get your hands dirty, jump to the [Implementing "travel personality test"](#implementing-travel-personality-test) section. -->

<!-- TODO: give a link to see the final result -->
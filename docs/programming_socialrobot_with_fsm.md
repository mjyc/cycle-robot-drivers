# Programming a social robot using finite state machine

<!-- Continuing from the last tutorial, -->

In this post, I'll show you how to program a social robot using finite state machine (FSM).


## What is finite state machine?

may definition

wikipedia definition maybe


A Mealy machine is a 6-tuple {\displaystyle (S,S_{0},\Sigma ,\Lambda ,T,G)} (S, S_0, \Sigma, \Lambda, T, G) consisting of the following:

a finite set of states {\displaystyle S} S
a start state (also called initial state) {\displaystyle S_{0}} S_{0} which is an element of {\displaystyle S} S
a finite set called the input alphabet {\displaystyle \Sigma } \Sigma 
a finite set called the output alphabet {\displaystyle \Lambda } \Lambda 
a transition function {\displaystyle T:S\times \Sigma \rightarrow S} T : S \times \Sigma \rightarrow S mapping pairs of a state and an input symbol to the corresponding next state.
an output function {\displaystyle G:S\times \Sigma \rightarrow \Lambda } G:S\times \Sigma \rightarrow \Lambda  mapping pairs of a state and an input symbol to the corresponding output symbol.
In some formulations, the transition and output functions are coalesced into a single function {\displaystyle T:S\times \Sigma \rightarrow S\times \Lambda } T:S\times \Sigma \rightarrow S\times \Lambda .

## Implementing traffic light FSM and Cycle.js

TODO: Copy the example from there



## Updating "travel personality test" to use FSM

### Defining states and variables (and udpate the relevant code)

we'll also introduce variables

### Defining inputs and outputs (and udpate the relevant code)

we'll include variable field in input

### Defining transition (and emission)

the big function

### That's it!

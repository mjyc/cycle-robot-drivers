<!-- This README.md is automatically generated. Edit the JSDoc comments in source code or the md files in docs/readmes/. -->

# @cycle-robot-drivers/screen

[Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) and action [components](https://cycle.js.org/components.html) for a [tablet robot face](https://github.com/mjyc/tablet-robot-face).

Try [the demo](https://stackblitz.com/edit/cycle-robot-drivers-demos-screen) at StackBlitz!

Note that this package was tested with Chrome browser (>= 65.0.3325.181) only.

## API

<!-- Start src/FacialExpressionAction.ts -->

### FacialExpressionAction(sources)

FacialExpression action component.

#### Params:

* *sources* 
  * goal: a stream of `TabletFaceCommand`s.
  * cancel: a stream of `GoalID`.
  * TabletFace: the `TabletFace` driver output.

#### Return:

* sinks 
  * state: a reducer stream.
  * status: a stream of action status.
  * result: a stream of action results.
  * TabletFace: a stream for the `TabletFace` driver input.

<!-- End src/FacialExpressionAction.ts -->

<!-- Start src/SpeechbubbleAction.ts -->

Speechbubble action component.

#### Params:

* *sources* 
  * goal: a stream of `{type: 'MESSAGE', value: 'Hello world'}`
    or `'Hello world'` (as "message"),
    or `{type: 'CHOICE', value: ['Hello', 'World']}`
    or `['Hello', 'World']` (as "multiple choice").
  * cancel: a stream of `GoalID`
  * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).

#### Return:

* sinks 
  * state: a reducer stream.
  * status: a stream of action status.
  * result: a stream of action results. `result.result` is always `null`.
  * DOM: a stream of virtual DOM objects, i.e, [Snabbdom "VNode" objects](https://github.com/snabbdom/snabbdom).

<!-- End src/SpeechbubbleAction.ts -->

<!-- Start src/index.ts -->

<!-- End src/index.ts -->

<!-- Start src/makeTabletFaceDriver.ts -->

### makeTabletFaceDriver(options)

[TabletFace](https://github.com/mjyc/tablet-robot-face) driver factory.

#### Params:

* *options* possible key includes 
  * styles {object} A group of optional style parameters

#### Return:

* **Driver** the TabletFace Cycle.js driver function. It takes a stream   of `Command` and returns returns `EventSource`:

  * `EventSource.events(eventName)` takes `'load'`, `'animationfinish'`, or
    `dom` and returns corresponding event streams respectively.

<!-- End src/makeTabletFaceDriver.ts -->


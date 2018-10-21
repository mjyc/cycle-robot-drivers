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
  * goal: a stream of `null` (as "cancel") or a string '`happy'`, '`sad'`,
    '`angry'`, '`focused'`, or '`confused'` (as the TabletFace driver's
    `EXPRESS` type command value).
  * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).

#### Return:

* sinks 
  * output: a stream for the TabletFace driver.
  * status: depreciated
  * result: a stream of action results. `result.result` is always `null`.

<!-- End src/FacialExpressionAction.ts -->

<!-- Start src/SpeechbubbleAction.ts -->

### SpeechbubbleAction(sources)

Speechbubble action component.

#### Params:

* *sources* 
  * goal: a stream of `null` (as "cancel"),
    `{type: 'MESSAGE', value: 'Hello world'}` or `'Hello world'` (as
    "message"), or `{type: 'CHOICE', value: ['Hello', 'World']}`
    or `['Hello', 'World']` (as "multiple choice").
  * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).

#### Return:

* sinks 
  * DOM: a stream of virtual DOM objects, i.e, [Snabbdom “VNode” objects](https://github.com/snabbdom/snabbdom).
  * result: a stream of action results.

<!-- End src/SpeechbubbleAction.ts -->

<!-- Start src/TwoSpeechbubblesAction.ts -->

### TwoSpeechbubblesAction(sources)

TwoSpeechbubbles, Robot and Human, action component.

#### Params:

* *sources* 
  * goal: a stream of `null` (as "cancel"),
    `{type: 'SET_MESSAGE', value: 'Hello world'}` or `'Hello world'` (as
    "set message"), or `{type: 'ASK_QUESTION', message: 'Blue pill or
    red pill?', choices: ['Blue', 'Red']}` (as "ask multiple choice").
  * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).

#### Return:

* sinks 
  * DOM: a stream of virtual DOM objects, i.e, [Snabbdom “VNode” objects](https://github.com/snabbdom/snabbdom).
  * result: a stream of action results.

<!-- End src/TwoSpeechbubblesAction.ts -->

<!-- Start src/index.ts -->

<!-- End src/index.ts -->

<!-- Start src/makeTabletFaceDriver.ts -->

### makeTabletFaceDriver()

[TabletFace](https://github.com/mjyc/tablet-robot-face) driver factory.

#### Return:

* **Driver** the TabletFace Cycle.js driver function. It takes a stream   of `Command` and returns `DOM`, `animationFinish`, and `load` streams.

<!-- End src/makeTabletFaceDriver.ts -->


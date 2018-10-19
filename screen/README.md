<!-- This README.md is automatically generated. Edit the JSDoc comments in source code or the md files in docs/readmes/. -->

# @cycle-robot-drivers/screen

[Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) and action [components](https://cycle.js.org/components.html) for a [tablet robot face](https://github.com/mjyc/tablet-robot-face).

Try [the demo](https://stackblitz.com/edit/cycle-robot-drivers-demos-screen) at StackBlitz!

Note that this package was tested with Chrome browser (>= 65.0.3325.181) only.

## API

<!-- Start src/FacialExpressionAction.tsx -->

<!-- End src/FacialExpressionAction.tsx -->

<!-- Start src/SpeechbubbleAction.tsx -->

### SpeechbubbleAction(sources)

Speechbubble action component.

#### Params:

* *sources* 
  * goal: a stream of `null` (as "cancel"), `{type: 'MESSAGE', value: 'Hello world'}` for displaying message or `{type: 'MESSAGE', value: ['Hello', 'World']}` for displaying choices.
  * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).

#### Return:

* sinks 
  * DOM: a stream of virtual DOM objects, i.e, [Snabbdom “VNode” objects](https://github.com/snabbdom/snabbdom).
  * result: a stream of action results.

<!-- End src/SpeechbubbleAction.tsx -->

<!-- Start src/TwoSpeechbubblesAction.tsx -->

<!-- End src/TwoSpeechbubblesAction.tsx -->

<!-- Start src/index.ts -->

<!-- End src/index.ts -->

<!-- Start src/tablet_face.tsx -->

<!-- End src/tablet_face.tsx -->


<!-- This README.md is automatically generated. Edit the JSDoc comments in source code or the md files in docs/readmes/. -->

# @cycle-robot-drivers/speech

[Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) and action [components](https://cycle.js.org/components.html) for speech synthesis and recognition using [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API).

Try [the demo](https://stackblitz.com/edit/cycle-robot-drivers-demos-speech) at StackBlitz!

Note that this package was tested with Chrome browser (>= 65.0.3325.181) only.

## API

<!-- Start src/SpeechRecognitionAction.ts -->

### SpeechRecognitionAction(sources)

Web Speech API's [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
action component.

#### Params:

* *sources* 
  * goal: a stream of `null` (as "cancel") or `SpeechRecognition`
    properties (as "goal").
  * SpeechSynthesis: `EventSource` for `start`, `end`, `error`, `result`
    events.

#### Return:

* sinks 
  * output: a stream for the SpeechRecognition driver input.
  * result: a stream of action results. `result.result` is a transcript from
    the recognition; it will be `''` for non-speech inputs.

<!-- End src/SpeechRecognitionAction.ts -->

<!-- Start src/SpeechSynthesisAction.ts -->

### SpeechSynthesisAction(sources)

Web Speech API's [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
action component.

#### Params:

* *sources* 
  * goal: a stream of `null` (as "cancel") or `SpeechSynthesisUtterance`
    properties (as "goal").
  * SpeechSynthesis: `EventSource` for `start` and `end` events.

#### Return:

* sinks 
  * output: a stream for the SpeechSynthesis driver input.
  * result: a stream of action results. `result.result` is always `null`.

<!-- End src/SpeechSynthesisAction.ts -->

<!-- Start src/index.ts -->

<!-- End src/index.ts -->

<!-- Start src/makeSpeechRecognitionDriver.ts -->

### makeSpeechRecognitionDriver()

Web Speech API's [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
driver factory.

#### Return:

* **Driver** the SpeechRecognition Cycle.js driver function. It takes a   stream of objects containing [`SpeechRecognition` properties](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#Properties)
  and returns a `EventSource`:

  * `EventSource.events(eventName)` returns a stream of `eventName`
    events from [`SpeechRecognition`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#Event_handlers).

<!-- End src/makeSpeechRecognitionDriver.ts -->

<!-- Start src/makeSpeechSynthesisDriver.ts -->

### makeSpeechSynthesisDriver()

Web Speech API's [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
driver factory.

#### Return:

* **Driver** the SpeechSynthesis Cycle.js driver function. It takes a   stream of objects containing [`SpeechSynthesisUtterance` properties](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance#Properties)
  and returns a `EventSource`:

  * `EventSource.events(eventName)` returns a stream of  `eventName`
    events from [`SpeechSynthesisUtterance`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance#Event_handlers).

<!-- End src/makeSpeechSynthesisDriver.ts -->


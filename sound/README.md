<!-- This README.md is automatically generated. Edit the JSDoc comments in source code or the md files in docs/readmes/. -->

# @cycle-robot-drivers/sound

[Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) and action [components](https://cycle.js.org/components.html) for playing sounds using [HTMLAudioElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLAudioElement).

Try [the demo](https://stackblitz.com/edit/cycle-robot-drivers-demos-sound) at StackBlitz!

Note that this package was tested with Chrome browser (>= 65.0.3325.181) only.

## API

<!-- Start src/AudioPlayerAction.ts -->

### AudioPlayerAction(sources)

AudioPlayerAction action component.

#### Params:

* *sources* 
  * goal: a stream of `null` (as "cancel") or `{src: string}` (as HTML audio
    [src](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-src))
    or a string (as a value of `src`).
  * AudioPlayer: `EventSource` for `ended` and `pause` events.

#### Return:

* sinks 
  * output: a stream for the AudioPlayer driver.
  * status: depreciated.
  * result: a stream of action results. `result.result` is always `null`.

<!-- End src/AudioPlayerAction.ts -->

<!-- Start src/index.ts -->

<!-- End src/index.ts -->

<!-- Start src/makeAudioPlayerDriver.ts -->

[HTML Audio](https://www.w3schools.com/tags/ref_av_dom.asp)
driver factory.

#### Return:

* **Driver** the HTML Audio Cycle.js driver function. It takes a   stream of objects containing `[src](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio#attr-src).org/en-US/docs/Web/API/SpeechSynthesisUtterance#Properties)`
  fieldand returns a `EventSource`:

  * `EventSource.events(eventName)` returns a stream of  `eventName`
    events from [`HTML Audio/Video Events`](https://www.w3schools.com/tags/ref_av_dom.asp).

<!-- End src/makeAudioPlayerDriver.ts -->


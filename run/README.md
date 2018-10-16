<!-- This README.md is automatically generated. Edit the JSDoc comments in source code or the md files in docs/readmes/. -->

# @cycle-robot-drivers/run

`runRobotProgram` function that creates [Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) and action [components](https://cycle.js.org/components.html) for creating [tablet-face robot](https://github.com/mjyc/tablet-robot-face) applications using [xstream](https://github.com/staltz/xstream).

Try [the demo](https://stackblitz.com/edit/cycle-robot-drivers-demos-run) at StackBlitz!

Note that this package was tested with Chrome browser (>= 65.0.3325.181) only.

## API

<!-- Start src/index.tsx -->

### runRobotProgram(main, drivers)

A wrapper function of [Cycle.js run](https://cycle.js.org/api/run.html#api-runmain-drivers)
  function.

#### Params:

* *main* A function that takes incoming streams as `sources` and returns   outgoing streams as sinks. By default, the following action components

    * [FacialExpressionAction](../screen/README.md)
    * [AudioPlayerAction](../sound/README.md)
    * [TwoSpeechbubblesAction](../screen/README.md)
    * [SpeechSynthesisAction](../speech/README.md)
    * [SpeechRecognitionAction](../speech/README.md)

  are can used used like drivers, i.e., catch incoming message via 
  `sources.FacialExpressionAction` and send outgoing message via 
  `return { FacialExpressionAction: xs.of(null) };`, as well as six drivers
  listed below.
* *drivers* A collection of [Cycle.js drivers](). By default, `drivers` is   set to an object containing:

    * [`DOM`](https://cycle.js.org/api/dom.html)
    * [`TabletFace`](../screen/README.md)
    * [`AudioPlayer`](../sound/README.md)
    * [`SpeechSynthesis`](../speech/README.md)
    * [`SpeechRecognition`](../speech/README.md)
    * [`PoseDetection`](../3rdparty/cycle-posenet-driver/README.md)

  drivers.

<!-- End src/index.tsx -->


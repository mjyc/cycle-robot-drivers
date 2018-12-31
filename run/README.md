<!-- This README.md is automatically generated. Edit the JSDoc comments in source code or the md files in docs/readmes/. -->

# @cycle-robot-drivers/run

`runRobotProgram` function that creates [Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) and action [components](https://cycle.js.org/components.html) for creating [Tabletface robot](https://github.com/mjyc/tablet-robot-face) applications.

Try [the demo](https://stackblitz.com/edit/cycle-robot-drivers-demos-run) at StackBlitz!

Note that this package was tested with Chrome browser (>= 65.0.3325.181) only.

## API

<!-- Start src/index.ts -->

### runRobotProgram(main, drivers)

A wrapper function of [Cycle.js run](https://cycle.js.org/api/run.html#api-runmain-drivers)
  function for Tabletface robot.

#### Params:

* *main* A function that takes incoming streams as `sources` and returns   outgoing streams as sinks. By default, the following action components

    * [FacialExpressionAction](../screen)
    * [AudioPlayerAction](../sound)
    * [TwoSpeechbubblesAction](../screen)
    * [SpeechSynthesisAction](../speech)
    * [SpeechRecognitionAction](../speech)

  are can used used like drivers, i.e., catch incoming message via
  `sources.FacialExpressionAction` and send outgoing message via
  `return { FacialExpressionAction: xs.of(null) };`, as well as six drivers
  listed below.
* *drivers* A collection of [Cycle.js drivers](). By default, `drivers` is   set to an object containing:

    * [DOM](https://cycle.js.org/api/dom.html)
    * [TabletFace](../screen)
    * [AudioPlayer](../sound)
    * [SpeechSynthesis](../speech#)
    * [SpeechRecognition](../speech)
    * [PoseDetection](../3rdparty/cycle-posenet-driver)

  drivers.

<!-- End src/index.ts -->

<!-- Start src/initializeDrivers.ts -->

<!-- End src/initializeDrivers.ts -->


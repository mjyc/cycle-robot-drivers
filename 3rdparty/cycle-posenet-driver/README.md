<!-- This README.md is automatically generated. Edit the JSDoc comments in source code or the md files in docs/readmes/. -->

# cycle-posenet-driver

[Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) for pose detection using [PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet).

Try [the demo](https://stackblitz.com/edit/cycle-robot-drivers-demos-posenet) at StackBlitz!

Note that this package was tested with Chrome browser (>= 65.0.3325.181) only.

## API

<!-- Start src/index.ts -->

<!-- End src/index.ts -->

<!-- Start src/makePoseDetectionDriver.ts -->

### makePoseDetectionDriver(options)

[PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet)
driver factory.

#### Params:

* *options* possible key includes 
  * videoWidth {number} An optional video height (default: 640).
  * videoWidth {number} An optional video width (default: 480).
  * flipHorizontal {boolean} An optional flag for horizontally flipping the
    video (default: true).
  * fps {number} An optional desired frame rate per second

the PoseNet Cycle.js driver function. It takes a stream of [`PoseNetParameters`](./src/makePoseDetectionDriver.ts) and returns `EventSource`:

  * `EventSource.events(eventName)` takes `'poses'` or `'dom'` that returns
    [`Pose` arrays](https://github.com/tensorflow/tfjs-models/tree/master/posenet#via-npm)
    or a required virtual dom element, respectively.

<!-- End src/makePoseDetectionDriver.ts -->

<!-- Start src/utils.ts -->

<!-- End src/utils.ts -->


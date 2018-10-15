<!-- This README.md is automatically generated. Edit the JSDoc comments in source code or the md files in docs/readmes/. -->

# cycle-posenet-driver

[Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) and action [components](https://cycle.js.org/components.html) for pose detection using [PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet).

Try [the demo](https://stackblitz.com/edit/cycle-robot-drivers-demos-posenet) at StackBlitz!

Note that this package was tested with Chrome browser (>= 65.0.3325.181) only.

## API

<!-- Start src/index.ts -->

<!-- End src/index.ts -->

<!-- Start src/pose_detection.tsx -->

### makePoseDetectionDriver(options)

[PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet) 
driver factory.

#### Params:

* *options* possible key includes 
  * videoWidth {number} An optional video height (default: 640).
  * videoWidth {number} An optional video width (default: 480).
  * flipHorizontal {boolean} An optional flag for horizontally flipping the
    video (default: true).

#### Return:

* **Driver** the PoseNet Cycle.js driver function. It takes a stream   that emits `PoseNetParameters` and returns a stream that emits arrays of
  `Pose`s.

<!-- End src/pose_detection.tsx -->

<!-- Start src/utils.ts -->

<!-- End src/utils.ts -->


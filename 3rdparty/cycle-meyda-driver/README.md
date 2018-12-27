<!-- This README.md is automatically generated. Edit the JSDoc comments in source code or the md files in docs/readmes/. -->

# cycle-meyda-driver

[Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) and action [components](https://cycle.js.org/components.html) for audio feature extraction using [Meyda](https://github.com/meyda/meyda).

Try [the demo](https://stackblitz.com/edit/cycle-robot-drivers-demos-meyda) at StackBlitz!

Note that this package was tested with Chrome browser (>= 65.0.3325.181) only.

## API

<!-- Start src/index.ts -->

### makeMeydaDriver(options)

[Meyda](https://github.com/meyda/meyda) audio feature extraction driver factory.

#### Params:

* *options* a subset of MeydaOptions (https://meyda.js.org/reference/module-meyda.html) 
  * bufferSize? {number}
  * hopSize? {number}
  * sampleRate? {number}
  * windowingFunction? {string}
  * featureExtractors? {string[]}

#### Return:

* **Driver** the Meyda Cycle.js driver function. It takes no stream   and returns a stream of audio features.

<!-- End src/index.ts -->


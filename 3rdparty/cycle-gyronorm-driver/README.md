<!-- This README.md is automatically generated. Edit the JSDoc comments in source code or the md files in docs/readmes/. -->

# cycle-gyronorm-driver

[Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) for accessing normalized accelerometer and gyroscope data using [gyronorm.js](https://github.com/dorukeker/gyronorm.js).

Try [the demo](https://cycle-robot-drivers-demos-gyronorm.stackblitz.io) on your mobile device!

Note that this package was tested with Chrome browser (>= 65.0.3325.181) only.

## API

<!-- Start src/index.ts -->

### makeGyronormDriver(options)

[gyronorm.js](https://github.com/dorukeker/gyronorm.js) accelerometer and gyroscope driver factory.

#### Params:

* *options* a subset of the GyroNorm options (https://github.com/dorukeker/gyronorm.js#options) 
  * frequency? {number}
  * gravityNormalized? {boolean}
  * orientationBase? {string}
  * decimalCount? {number}
  * screenAdjusted? {boolean}

#### Return:

* **Driver** the GyroNorm Cycle.js driver function. It takes no stream   and returns [GyroNorm output data](https://github.com/dorukeker/gyronorm.js#how-to-use).

<!-- End src/index.ts -->


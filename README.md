# cycle-robot-drivers

A collection of [Cycle.js](http://cycle.js.org/) packages containing [drivers](https://cycle.js.org/drivers.html) and [components](https://cycle.js.org/components.html) for programming [robots](http://pixar.wikia.com/wiki/WALL%E2%80%A2E_(character)).

* [@cycle-robot-drivers/action](./action)
* [@cycle-robot-drivers/screen](./screen)
* [@cycle-robot-drivers/sound](./sound)
* [@cycle-robot-drivers/speech](./speech)
* [cycle-posenet-driver](./3rdparty/cycle-posenet-drivers)

All packages were tested with Chrome browser (>= 65.0.3325.181) only.

## Getting started

To build all packages, simply run `make` from the root directory of this repository.

To get your hands dirty, check out our [examples](./examples) or try building an app using [cycle-robot-drivers-app](https://github.com/mjyc/cycle-robot-drivers-app).

## Tutorials

1. [Programming a social robot with Cycle.js](./docs/programming_socialrobot_with_cyclejs.md)
2. [Implementing a finite state machine in Cycle.js](./docs/programming_socialrobot_with_fsm.md)

## Slides

* [Reactive Programming for Robot Applications, ROS Seattle Meetup, 2019/03/27](./docs/slides/20190327_rosseattlemeetup/export/slides.pdf) ([source](./docs/slides/20190327_rosseattlemeetup/export/slides.md))

## Misc.

* [cycle-robot-drivers-app](https://github.com/mjyc/cycle-robot-drivers-app): a starter template for cycle-robot-drivers apps
* [cycle-ros-example](https://github.com/mjyc/cycle-ros-example): A Cycle.js app with an experimental ROS driver
* [@mjyc/cycle-time-travel](https://github.com/mjyc/cycle-time-travel): A time traveling debugger for Cycle.js apps originally developed by [Widdershin](https://github.com/cyclejs/cycle-time-travel) ([demo](https://codesandbox.io/s/24olxr7k50) | [robot-app-demo](https://codesandbox.io/s/48oozw2qz7))

## Thank you

* [Maya Cakmak](https://github.com/mayacakmak) for her support
* [Human-Centred Lab](https://github.com/hcrlab) and [Personal Robotics Lab](https://github.com/personalrobotics) for feedback
* [André Staltz](https://github.com/staltz) and the [Cycle.js team](https://github.com/cyclejs/cyclejs/blob/master/CORE_TEAM.md) for providing ample Cycle.js documentation

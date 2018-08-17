# cycle-robot-drivers

[Cycle.js](http://cycle.js.org/) [drivers](https://cycle.js.org/drivers.html) for programming [robots](http://pixar.wikia.com/wiki/WALL%E2%80%A2E_(character)).

This repo contains one utility package three robot action packages organized by modality.

1. [action/](./action): utility
2. [face/](./face): facial expression and speechbubbles
3. [sound/](./sound): sound player
4. [speech/](./speech): speech synthesis and recognition

The repo also contains action packages dependent on 3rd party libraries in [3rdparty/](./3rdparty).

All packages were tested with Chrome browser (>= 65.0.3325.181) only.

## Getting started

To build all packages, simply run `make` from the root repo directory.

To get your hands dirty, check out our [examples](./examples).

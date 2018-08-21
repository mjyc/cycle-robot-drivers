# cycle-robot-drivers Examples

A collection of small Cycle.js apps demonstrating cycle-robot-drivers usage.

The three folders contains apps with different purposes:

1. [basic/](./basic) contains apps demonstrating a single action usage
2. [intermediate/](./intermediate) contains simple interactive apps based on our action packages
3. [advanced/](./advanced) WIP

To run an example app, do

```
# build all packages by running `make` at root repo directory
cd basic/speech_synthesis_action/
npm install
npm run start:demo
```

and visit `localhost:9000`.

All packages were tested with Chrome browser (>= 65.0.3325.181) only.

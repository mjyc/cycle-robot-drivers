import xs from 'xstream';
import {Stream} from 'xstream';
import {div} from '@cycle/dom';
import {adapt} from '@cycle/run/lib/adapt';


// adapted from
//   https://github.com/mjyc/tablet-robot-face/blob/709b731dff04033c08cf045adc4e038eefa750a2/index.js#L3-L184
class EyeController {
  private _eyeSize;
  private _blinkTimeoutID;
  private _leftEye;
  private _rightEye;
  private _upperLeftEyelid;
  private _upperRightEyelid;
  private _lowerLeftEyelid;
  private _lowerRightEyelid;

  constructor(elements = {}, eyeSize = '33.33vmin') {
    this._eyeSize = eyeSize;
    this._blinkTimeoutID = null;

    this.setElements(elements);
  }

  get leftEye() { return this._leftEye; }
  get rightEye() { return this._rightEye; }

  setElements({
    leftEye,
    rightEye,
    upperLeftEyelid,
    upperRightEyelid,
    lowerLeftEyelid,
    lowerRightEyelid,
  }: any) {
    this._leftEye = leftEye;
    this._rightEye = rightEye;
    this._upperLeftEyelid = upperLeftEyelid;
    this._upperRightEyelid = upperRightEyelid;
    this._lowerLeftEyelid = lowerLeftEyelid;
    this._lowerRightEyelid = lowerRightEyelid;
    return this;
  }

  _createKeyframes({
    tgtTranYVal = '0px',
    tgtRotVal = '0deg',
    enteredOffset = 0,
    exitingOffset = 0,
  }: any) {
    return [
      {transform: `translateY(0px) rotate(0deg)`, offset: 0.0},
      {transform: `translateY(${tgtTranYVal}) rotate(${tgtRotVal})`, offset: enteredOffset},
      {transform: `translateY(${tgtTranYVal}) rotate(${tgtRotVal})`, offset: exitingOffset},
      {transform: `translateY(0px) rotate(0deg)`, offset: 1.0},
    ];
  }

  express({
    type = '',
    // level = 3,  // 1: min, 5: max
    duration = 1000,
    enterDuration = 75,
    exitDuration = 75,
  }) {
    if (!this._leftEye) {  // assumes all elements are always set together
      console.warn('Eye elements are not set; return;');
      return;
    }

    const options = {
      duration: duration,
    };

    switch (type) {
      case 'happy':
        return {
          lowerLeftEyelid: this._lowerLeftEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * -2 / 3)`,
            tgtRotVal: `30deg`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
          lowerRightEyelid: this._lowerRightEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * -2 / 3)`,
            tgtRotVal: `-30deg`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
        };

      case 'sad':
        return {
          upperLeftEyelid: this._upperLeftEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * 1 / 3)`,
            tgtRotVal: `-20deg`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
          upperRightEyelid: this._upperRightEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * 1 / 3)`,
            tgtRotVal: `20deg`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
        };

      case 'angry':
        return {
          upperLeftEyelid: this._upperLeftEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * 1 / 4)`,
            tgtRotVal: `30deg`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
          upperRightEyelid: this._upperRightEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * 1 / 4)`,
            tgtRotVal: `-30deg`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
        };

      case 'focused':
        return {
          upperLeftEyelid: this._upperLeftEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * 1 / 3)`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
          upperRightEyelid: this._upperRightEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * 1 / 3)`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
          lowerLeftEyelid: this._lowerLeftEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * -1 / 3)`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
          lowerRightEyelid: this._lowerRightEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * -1 / 3)`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
        }

      case 'confused':
        return {
          upperRightEyelid: this._upperRightEyelid.animate(this._createKeyframes({
            tgtTranYVal: `calc(${this._eyeSize} * 1 / 3)`,
            tgtRotVal: `-10deg`,
            enteredOffset: enterDuration / duration,
            exitingOffset: 1 - (exitDuration / duration),
          }), options),
        }

      default:
        console.warn(`Invalid input type=${type}`);
    }
  }

  blink({
    duration = 150,  // in ms
  } = {}) {
    if (!this._leftEye) {  // assumes all elements are always set together
      console.warn('Eye elements are not set; return;');
      return;
    }

    [this._leftEye, this._rightEye].map((eye) => {
      eye.animate([
        {transform: 'rotateX(0deg)'},
        {transform: 'rotateX(90deg)'},
        {transform: 'rotateX(0deg)'},
      ], {
        duration,
        iterations: 1,
      });
    });
  }

  startBlinking({
    maxInterval = 5000
  } = {}) {
    if (this._blinkTimeoutID) {
      console.warn(`Already blinking with timeoutID=${this._blinkTimeoutID}; return;`);
      return;
    }
    const blinkRandomly = (timeout) => {
      this._blinkTimeoutID = setTimeout(() => {
        this.blink();
        blinkRandomly(Math.random() * maxInterval);
      }, timeout);
    }
    blinkRandomly(Math.random() * maxInterval);
  }

  stopBlinking() {
    clearTimeout(this._blinkTimeoutID);
    this._blinkTimeoutID = null;
  }

  setEyePosition(eyeElem, x, y, isRight = false) {
    if (!eyeElem) {  // assumes all elements are always set together
      console.warn('Invalid inputs ', eyeElem, x, y, '; retuning');
      return;
    }

    if (!isNaN(x)) {
      if (!isRight) {
        eyeElem.style.left = `calc(${this._eyeSize} / 3 * 2 * ${x})`;
      } else {
        eyeElem.style.right = `calc(${this._eyeSize} / 3 * 2 * ${1-x})`;
      }
    }
    if (!isNaN(y)) {
      eyeElem.style.bottom = `calc(${this._eyeSize} / 3 * 2 * ${1-y})`;
    }
  }
}


enum CommandType {
  EXPRESS = 'EXPRESS',
  START_BLINKING = 'START_BLINKING',
  STOP_BLINKING = 'STOP_BLINKING',
  SET_STATE = 'SET_STATE',
}

export enum ExpressCommandType {
  HAPPY = 'happy',
  SAD = 'sad',
  ANGRY = 'angry',
  FOCUSED = 'focused',
  CONFUSED = 'confused',
}

type ExpressCommandArgs = {
  type: ExpressCommandType,
  // level: number
  duration: number,
  enterDuration: number,
  exitDuration: number,
}

type StartBlinkingCommandArgs = {
  maxInterval: number,
}

type SetStateCommandArgs = {
  leftEye: {
    x: number,
    y: number,
  },
  rightEye: {
    x: number,
    y: number,
  },
}

type Command = {
  type: CommandType,
  value: ExpressCommandArgs | StartBlinkingCommandArgs | SetStateCommandArgs,
}

/**
 * [TabletFace](https://github.com/mjyc/tablet-robot-face) driver factory.
 *
 * @param options possible key includes
 *
 *   * styles {object} A group of optional style parameters
 *
 * @return {Driver} the TabletFace Cycle.js driver function. It takes a stream
 *   of `Command` and returns `DOM`, animationFinish`, and `load` streams.
 */
export function makeTabletFaceDriver(options: {
  styles?: {
    faceColor?: string,
    faceHeight?: string,
    faceWidth?: string,
    eyeColor?: string,
    eyeSize?: string,
    eyelidColor?: string,
    face?: object,
    eye?: object,
    left?: object,
    right?: object,
    eyelid?: object,
    upper?: object,
    lower?: object,
  },
} = {}) {
  if (!options.styles) {
    options.styles = {};
  }
  const faceColor = options.styles.faceColor || 'whitesmoke';
  const faceHeight = options.styles.faceHeight || '100vh'
  const faceWidth = options.styles.faceWidth || '100vw'
  const eyeColor = options.styles.eyeColor || 'black'
  const eyeSize = options.styles.eyeSize || '33.33vmin'
  const eyelidColor = options.styles.eyelidColor || 'whitesmoke'
  if (!options.styles.face) {
    options.styles.face = {};
  }
  if (!options.styles.eye) {
    options.styles.eye = {};
  }
  if (!options.styles.left) {
    options.styles.left = {};
  }
  if (!options.styles.right) {
    options.styles.right = {};
  }
  if (!options.styles.eyelid) {
    options.styles.eyelid = {};
  }
  if (!options.styles.upper) {
    options.styles.upper = {};
  }
  if (!options.styles.lower) {
    options.styles.lower = {};
  }

  const styles = {
    face: {
      backgroundColor: faceColor,
      height: faceHeight,
      width: faceWidth,
      position: 'relative',
      overflow: 'hidden',
      zIndex: 0,  // speechbubbles and eyes have zIndex === 1,
      ...options.styles.face,
    },
    eye: {
      backgroundColor: eyeColor,
      borderRadius: '100%',
      height: eyeSize,
      width: eyeSize,
      bottom: `calc(${eyeSize} / 3)`,
      zIndex: 1,
      position: 'absolute',
      ...options.styles.eye,
    },
    left: {
      left: `calc(${eyeSize} / 3)`,
      ...options.styles.left,
    },
    right: {
      right: `calc(${eyeSize} / 3)`,
      ...options.styles.right,
    },
    eyelid: {
      backgroundColor: eyelidColor,
      height: eyeSize,
      width: `calc(${eyeSize} * 1.75)`,
      zIndex: 2,
      position: 'absolute',
      ...options.styles.eyelid,
    },
    upper: {
      bottom: `calc(${eyeSize} * 1)`,
      left: `calc(${eyeSize} * -0.375)`,
      ...options.styles.upper,
    },
    lower: {
      borderRadius: '100%',
      bottom: `calc(${eyeSize} * -1)`,
      left: `calc(${eyeSize} * -0.375)`,
      ...options.styles.lower,
    },
  };
  const eyes = new EyeController({}, eyeSize);

  return function(command$) {
    const load$ = xs.create();
    const intervalID = setInterval(() => {
      if (!document.querySelector(`.face`)) {
        console.debug(`Waiting for .face to appear...`);
        return;
      }
      clearInterval(intervalID);

      const element = document.querySelector(`.face`);
      eyes.setElements({
        leftEye: element.querySelector('.left.eye'),
        rightEye: element.querySelector('.right.eye'),
        upperLeftEyelid: element.querySelector('.left .eyelid.upper'),
        upperRightEyelid: element.querySelector('.right .eyelid.upper'),
        lowerLeftEyelid: element.querySelector('.left .eyelid.lower'),
        lowerRightEyelid: element.querySelector('.right .eyelid.lower'),
      });

      load$.shamefullySendNext(true);
    }, 1000);

    let animations = {};
    const animationFinish$$: Stream<Stream<any[]>> = xs.create();
    xs.fromObservable(command$).addListener({
      next: function(command: Command) {
        if (!command) {
          Object.keys(animations).map((key) => {
            animations[key].cancel();
          });
          return;
        }
        switch (command.type) {
          case CommandType.EXPRESS:
            animations = eyes.express(command.value as ExpressCommandArgs) || {};
            animationFinish$$.shamefullySendNext(
              xs.fromPromise(
                Promise.all(Object.keys(animations).map((key) => {
                  return new Promise((resolve, reject) => {
                    animations[key].onfinish = resolve;
                  })
                }))
              )
            );
            break;
          case CommandType.START_BLINKING:
            eyes.startBlinking(command.value as StartBlinkingCommandArgs);
            break;
          case CommandType.STOP_BLINKING:
            eyes.stopBlinking();
            break;
          case CommandType.SET_STATE:
            const value = command.value as SetStateCommandArgs;
            const leftPos = value && value.leftEye || {x: null, y: null};
            const rightPos = value && value.rightEye || {x: null, y: null};
            eyes.setEyePosition(eyes.leftEye, leftPos.x, leftPos.y);
            eyes.setEyePosition(eyes.rightEye, rightPos.x, rightPos.y, true);
            break;
        }
      }
    });

    const vdom$ = xs.of(
      div(`.face`, {style: styles.face}, [
        div('.eye.left', {
          style: (Object as any).assign({}, styles.eye, styles.left),
        }, [
          div('.eyelid.upper', {
            style: (Object as any).assign({}, styles.eyelid, styles.upper),
          }),
          div('.eyelid.lower', {
            style: (Object as any).assign({}, styles.eyelid, styles.lower),
          }),
        ]),
        div('.eye.right', {
          style: (Object as any).assign({}, styles.eye, styles.right),
        }, [
          div('.eyelid.upper', {
            style: (Object as any).assign({}, styles.eyelid, styles.upper),
          }),
          div('.eyelid.lower', {
            style: (Object as any).assign({}, styles.eyelid, styles.lower),
          }),
        ]),
      ])
    );

    return {
      DOM: adapt(vdom$),
      animationFinish: adapt(animationFinish$$.flatten()),
      load: adapt(load$),
    }
  }
}

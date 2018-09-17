import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream';
import {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {
  Goal, GoalStatus, Status, initGoal,
} from '@cycle-robot-drivers/action';


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

  constructor(elements = {}, eyeSize = '33.33vh') {
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
    tgtTranYVal,
    tgtRotVal,
    enteredOffset,
    exitingOffset,
  }: any) {
    return [
      { transform: `translateY(0px) rotate(0deg)`, offset: 0.0 },
      { transform: `translateY(${tgtTranYVal}) rotate(${tgtRotVal})`, offset: enteredOffset },
      { transform: `translateY(${tgtTranYVal}) rotate(${tgtRotVal})`, offset: exitingOffset },
      { transform: `translateY(0px) rotate(0deg)`, offset: 1.0 },
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
        { transform: 'rotateX(0deg)' },
        { transform: 'rotateX(90deg)' },
        { transform: 'rotateX(0deg)' },
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

    if (!!x) {
      if (!isRight) {
        eyeElem.style.left = `calc(${this._eyeSize} / 3 * 2 * ${x})`;
      } else {
        eyeElem.style.right = `calc(${this._eyeSize} / 3 * 2 * ${1-x})`;
      }
    }
    if (!!y) {
      eyeElem.style.bottom = `calc(${this._eyeSize} / 3 * 2 * ${1-y})`;
    }
  }
}


enum CommandType {
  EXPRESS = 'EXPRESS',
  START_BLINKING = 'START_BLINKING',
  STOP_BLINKING = 'STOP_BLINKING',
  SET_STATE = 'SET_STATE',
  SPEECHBUBBLES = 'SPEECHBUBBLES',
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

export function TabletFace(sources, {
  styles: {
    faceColor = 'whitesmoke',
    faceHeight = '100vh',
    faceWidth = '100vw',
    eyeColor = 'black',
    eyeSize = '33.33vh',
    eyelidColor = 'whitesmoke',
  }
}: {
  styles?: {
    faceColor?: string,
    faceHeight?: string,
    faceWidth?: string,
    eyeColor?: string,
    eyeSize?: string,
    eyelidColor?: string,
  },
} = {styles: {}}) {
  const styles = {
    face: {
      backgroundColor: faceColor,
      height: faceHeight,
      width: faceWidth,
      position: 'relative',
      overflow: 'hidden',
    },
    eye: {
      backgroundColor: eyeColor,
      borderRadius: '100%',
      height: eyeSize,
      width: eyeSize,
      bottom: `calc(${eyeSize} / 3)`,
      zIndex: 1,
      position: 'absolute',
    },
    left: {
      left: `calc(${eyeSize} / 3)`,
    },
    right: {
      right: `calc(${eyeSize} / 3)`,
    },
    eyelid: {
      backgroundColor: eyelidColor,
      height: eyeSize,
      width: `calc(${eyeSize} * 1.75)`,
      zIndex: 2,
      position: 'absolute',
    },
    upper: {
      bottom: `calc(${eyeSize} * 1)`,
      left: `calc(${eyeSize} * -0.375)`,
    },
    lower: {
      borderRadius: '100%',
      bottom: `calc(${eyeSize} * -1)`,
      left: `calc(${eyeSize} * -0.375)`,
    },
  };
  const eyes = new EyeController();
  const id = `face-${String(Math.random()).substr(2)}`;

  const faceElement$ = sources.DOM.select(`#${id}`).element();
  faceElement$.addListener({next: (element) => {
    eyes.setElements({
      leftEye: element.querySelector('.left.eye'),
      rightEye: element.querySelector('.right.eye'),
      upperLeftEyelid: element.querySelector('.left .eyelid.upper'),
      upperRightEyelid: element.querySelector('.right .eyelid.upper'),
      lowerLeftEyelid: element.querySelector('.left .eyelid.lower'),
      lowerRightEyelid: element.querySelector('.right .eyelid.lower'),
    });
  }});

  let animations = {};
  const animationFinish$$: Stream<Stream<any[]>> = xs.create();
  const speechbubblesDOM$ = xs.create();
  xs.fromObservable(sources.command).addListener({
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
        case CommandType.SPEECHBUBBLES:
          speechbubblesDOM$.shamefullySendNext(command.value);
          break;
      }
    }
  });

  const vnode$ = xs.of(
    <div className="face" style={styles.face} id={id}>
      <div className="eye left" style={
        (Object as any).assign({}, styles.eye, styles.left)
      }>
        <div className="eyelid upper" style={
          (Object as any).assign({}, styles.eyelid, styles.upper)
        }>
        </div>
        <div className="eyelid lower" style={
          (Object as any).assign({}, styles.eyelid, styles.lower)
        }>
        </div>
      </div>

      <div className="eye right" style={
        (Object as any).assign({}, styles.eye, styles.right)
      }>
        <div className="eyelid upper" style={
          (Object as any).assign({}, styles.eyelid, styles.upper)
        }>
        </div>
        <div className="eyelid lower" style={
          (Object as any).assign({}, styles.eyelid, styles.lower)
        }>
        </div>
      </div>
    </div>
  );

  return {
    DOM: adapt(vnode$),
    animationFinish: adapt(animationFinish$$.flatten()),
    load: adapt(faceElement$.take(1).mapTo(null)),
  }
}

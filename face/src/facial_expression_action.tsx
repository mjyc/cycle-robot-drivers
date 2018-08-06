import Snabbdom from 'snabbdom-pragma';
import xs from 'xstream'
import dropRepeats from 'xstream/extra/dropRepeats'
import {adapt} from '@cycle/run/lib/adapt'

import {
  Goal, GoalStatus, Status, initGoal,
} from '@cycle-robot-drivers/action'


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
      console.warn('Skipping; eye elements are not set');
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
        console.warn(`Invalid input type: ${type}`);
    }
  }

  blink({
    duration = 150,  // in ms
  } = {}) {
    if (!this._leftEye) {  // assumes all elements are always set together
      console.warn('Skipping; eye elements are not set');
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
      console.warn(`Skipping; already blinking with timeoutID: ${this._blinkTimeoutID}`);
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
}

export function makeFacialExpressionActionDriver() {
  const createFaceDOM = () => {
    const faceColor = 'whitesmoke';
    const faceHeight = '62.5vh';
    const faceWidth = '100vw';
    const eyeColor = 'black';
    const eyeSize = '33.33vh';
    const eyelidColor = 'whitesmoke';

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
    }

    return (
      <div className="face" style={styles.face}>
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
    )
  }

  return function facialExpressionAction(sink$) {
    let eyes = null;
    let animations = [];

    // Create EyeController onload
    window.addEventListener('load', async () => {
      eyes = new EyeController({
        leftEye: document.querySelector('.left.eye'),
        rightEye: document.querySelector('.right.eye'),
        upperLeftEyelid: document.querySelector('.left .eyelid.upper'),
        upperRightEyelid: document.querySelector('.right .eyelid.upper'),
        lowerLeftEyelid: document.querySelector('.left .eyelid.lower'),
        lowerRightEyelid: document.querySelector('.right .eyelid.lower'),
      });
    });


    // Create action stream
    type Action = {
      type: string,
      value: Goal,
    };

    const goal$ = sink$.map(goal => {
      if (goal === null) {
        return {
          type: 'CANCEL',
          value: null,
        };
      } else {
        return {
          type: 'GOAL',
          value: initGoal(goal),
        }
      }
    });

    const eventProxy$ = xs.create();

    const action$ = xs.merge(goal$, eventProxy$);


    // Create status stream
    let statusListener = null;
    const status$ = xs.createWithMemory({
      start: listener => {
        statusListener = listener;
      },
      stop: () => {
        statusListener = null;
      },
    });


    // Create result stream
    let resultListener = null;
    const result$ = xs.create({
      start: listener => {
        resultListener = listener;
      },
      stop: () => {
        resultListener = null;
      },
    });


    // Create state stream
    type State = {
      goal: Goal,
      status: GoalStatus,
    };

    const initialState: State = {
      goal: null,
      status: {
        goal_id: {
          stamp: new Date,
          id: ''
        },
        status: Status.SUCCEEDED,
      },
    };

    const state$ = action$.fold((state: State, action: Action): State => {
      console.debug('facialExpressionAction state', state, 'action', action);
      if (action.type === 'GOAL' || action.type === 'CANCEL') {
        let goal: Goal = state.goal;
        let status: GoalStatus = state.status;
        if (state.status.status === Status.ACTIVE) {  // preempt the goal
          // "cancel" animations
          Object.keys(animations).map((key) => {
            animations[key].cancel();
          });
          animations = [];

          status = {
            goal_id: state.status.goal_id,
            status: Status.PREEMPTED,
          };
          statusListener && statusListener.next(status);
          resultListener && resultListener.next({
            status: Status.PREEMPTED,
            result: null,
          });
        }
        if (action.type === 'GOAL') { // send a new goal
          goal = (action.value as Goal);
          status = {
            goal_id: goal.goal_id,
            status: Status.ACTIVE,
          };
          statusListener && statusListener.next(status);
        }
        return {
          goal,
          status,
        }
      } else if (action.type === 'ENDED' && state.status.status === Status.ACTIVE) {
        let status: GoalStatus = {
          goal_id: state.status.goal_id,
          status: Status.SUCCEEDED,
        };
        statusListener && statusListener.next(status);
        resultListener && resultListener.next({
          status,
          result: null,
        });
        return {
          ...state,
          status,
        }
      } else {
        console.warn(`returning "state" as is for action.type: ${action.type}`);
        return state;
      }
    }, initialState);


    // Create event stream
    let eventListener = null;
    const event$ = xs.create({
      start: listener => {
        eventListener = listener;
      },
      stop: () => {
        eventListener = null;
      },
    });
    eventProxy$.imitate(event$);

    state$.map(state => {
      return state.goal && state.goal.goal;
    }).compose(dropRepeats()).addListener({
      next: (props) => {
        if (!props) {
          // received no goal; don't do anything
          return;
        } else {
        // "express"
        animations = eyes.express(props);
        Promise.all(Object.keys(animations).map((key) => {
          return new Promise((resolve, reject) => {
            animations[key].onfinish = resolve;
          })
        })).then((data) => {
          eventListener.next({
            type: 'ENDED',
            value: null
          });
        });
        }
      }
    });

    return {
      DOM: adapt(xs.of(createFaceDOM())),
      status: adapt(status$),
      result: adapt(result$),
      ended: adapt(event$),
    };
  }
}

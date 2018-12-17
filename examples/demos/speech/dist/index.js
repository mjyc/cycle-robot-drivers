(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
exports.Status = types_1.Status;
var utils_1 = require("./utils");
exports.generateGoalID = utils_1.generateGoalID;
exports.initGoal = utils_1.initGoal;
exports.isEqual = utils_1.isEqual;
exports.isEqualGoal = utils_1.isEqualGoal;
exports.isEqualResult = utils_1.isEqualResult;
exports.powerup = utils_1.powerup;

},{"./types":2,"./utils":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Status;
(function (Status) {
    Status["ACTIVE"] = "ACTIVE";
    Status["PREEMPTED"] = "PREEMPTED";
    Status["SUCCEEDED"] = "SUCCEEDED";
    Status["ABORTED"] = "ABORTED";
})(Status = exports.Status || (exports.Status = {}));
;

},{}],3:[function(require,module,exports){
"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
function generateGoalID() {
    var now = new Date();
    return {
        stamp: now,
        id: Math.random().toString(36).substring(2) + "-" + now.getTime(),
    };
}
exports.generateGoalID = generateGoalID;
function initGoal(goal, isGoal) {
    if (isGoal === void 0) { isGoal = function (g) { return !!g.goal_id; }; }
    return isGoal(goal) ? goal : {
        goal_id: generateGoalID(),
        goal: goal,
    };
}
exports.initGoal = initGoal;
function isEqual(first, second) {
    if (!first || !second) {
        return false;
    }
    return (first.stamp === second.stamp && first.id === second.id);
}
exports.isEqual = isEqual;
function isEqualGoal(first, second) {
    if (!first || !second) {
        return false;
    }
    return isEqual(first.goal_id, second.goal_id);
}
exports.isEqualGoal = isEqualGoal;
function isEqualResult(first, second) {
    if (!first || !second) {
        return false;
    }
    return (isEqual(first.status.goal_id, second.status.goal_id)
        && first.status.status === second.status.status);
}
exports.isEqualResult = isEqualResult;
function powerup(main, connect) {
    return function (sources) {
        var sinks = main(sources);
        Object.keys(sources.proxies).map(function (key) {
            connect(sources.proxies[key], sinks.targets[key]);
        });
        var targets = sinks.targets, sinksWithoutTargets = __rest(sinks, ["targets"]);
        return sinksWithoutTargets;
    };
}
exports.powerup = powerup;

},{}],4:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = __importDefault(require("xstream"));
var adapt_1 = require("@cycle/run/lib/adapt");
var action_1 = require("@cycle-robot-drivers/action");
var State;
(function (State) {
    State["RUNNING"] = "RUNNING";
    State["DONE"] = "DONE";
    State["PREEMPTING"] = "PREEMPTING";
})(State || (State = {}));
var InputType;
(function (InputType) {
    InputType["GOAL"] = "GOAL";
    InputType["CANCEL"] = "CANCEL";
    InputType["START"] = "START";
    InputType["END"] = "END";
    InputType["ERROR"] = "ERROR";
    InputType["RESULT"] = "RESULT";
})(InputType || (InputType = {}));
;
function input(goal$, startEvent$, endEvent$, errorEvent$, resultEvent$) {
    return xstream_1.default.merge(goal$.filter(function (goal) { return typeof goal !== 'undefined'; }).map(function (goal) {
        if (goal === null) {
            return {
                type: InputType.CANCEL,
                value: null,
            };
        }
        else {
            return {
                type: InputType.GOAL,
                value: !!goal.goal_id ? goal : action_1.initGoal(goal),
            };
        }
    }), startEvent$.mapTo({ type: InputType.START, value: null }), endEvent$.mapTo({ type: InputType.END, value: null }), errorEvent$.map(function (event) { return ({ type: InputType.ERROR, value: event }); }), resultEvent$.map(function (event) { return ({ type: InputType.RESULT, value: event }); }));
}
var transitionTable = (_a = {},
    _a[State.DONE] = (_b = {},
        _b[InputType.GOAL] = State.RUNNING,
        _b),
    _a[State.RUNNING] = (_c = {},
        _c[InputType.GOAL] = State.PREEMPTING,
        _c[InputType.CANCEL] = State.PREEMPTING,
        _c[InputType.START] = State.RUNNING,
        _c[InputType.END] = State.DONE,
        _c),
    _a[State.PREEMPTING] = (_d = {},
        _d[InputType.END] = State.DONE,
        _d),
    _a);
function transition(prevState, prevVariables, input) {
    var states = transitionTable[prevState];
    if (!states) {
        throw new Error("Invalid prevState=\"" + prevState + "\"");
    }
    var state = states[input.type];
    if (!state) {
        console.debug("Undefined transition for \"" + prevState + "\" \"" + input.type + "\"; "
            + "set state to prevState");
        state = prevState;
    }
    if (prevState === State.DONE && state === State.RUNNING) {
        // Start a new goal
        var goal = input.value;
        return {
            state: state,
            variables: {
                goal_id: goal.goal_id,
                transcript: null,
                error: null,
                newGoal: null,
            },
            outputs: {
                args: goal.goal
            },
            result: null,
        };
    }
    else if (prevState === State.RUNNING && state === State.RUNNING) {
        if (input.type === InputType.RESULT) {
            var event_1 = input.value;
            var last = event_1.results.length - 1;
            var transcript = event_1.results[last][0].transcript;
            return {
                state: state,
                variables: __assign({}, prevVariables, { transcript: transcript }),
                outputs: null,
                result: null,
            };
        }
        else if (input.type === InputType.ERROR) {
            var event_2 = input.value;
            return {
                state: state,
                variables: __assign({}, prevVariables, { error: event_2.error }),
                outputs: null,
                result: null,
            };
        }
    }
    else if (state === State.DONE) {
        if (prevState === State.RUNNING || prevState === State.PREEMPTING) {
            // Stop the current goal and start the queued new goal
            var newGoal = prevVariables.newGoal;
            return {
                state: !!newGoal ? State.RUNNING : state,
                variables: {
                    goal_id: !!newGoal ? newGoal.goal_id : null,
                    transcript: null,
                    error: null,
                    newGoal: null,
                },
                outputs: !!newGoal ? {
                    args: newGoal.goal,
                } : null,
                result: {
                    status: {
                        goal_id: prevVariables.goal_id,
                        status: (prevState === State.RUNNING && !prevVariables.error)
                            ? action_1.Status.SUCCEEDED
                            : (!!prevVariables.error) ? action_1.Status.ABORTED : action_1.Status.PREEMPTED,
                    },
                    result: (prevState === State.RUNNING && !prevVariables.error)
                        ? (prevVariables.transcript || '') // '' for non-speech inputs
                        : null,
                },
            };
        }
    }
    else if ((prevState === State.RUNNING || prevState === State.PREEMPTING)
        && state === State.PREEMPTING) {
        if (input.type === InputType.GOAL || input.type === InputType.CANCEL) {
            // Start stopping the current goal and queue a new goal if received one
            return {
                state: state,
                variables: __assign({}, prevVariables, { newGoal: input.type === InputType.GOAL ? input.value : null }),
                outputs: prevState === State.RUNNING ? {
                    args: null,
                } : null,
                result: null,
            };
        }
    }
    return {
        state: prevState,
        variables: prevVariables,
        outputs: null,
        result: null,
    };
}
function transitionReducer(input$) {
    var initReducer$ = xstream_1.default.of(function initReducer(prev) {
        return {
            state: State.DONE,
            variables: {
                goal_id: null,
                transcript: null,
                error: null,
                newGoal: null,
            },
            outputs: null,
            result: null,
        };
    });
    var inputReducer$ = input$
        .map(function (input) { return function inputReducer(prev) {
        return transition(prev.state, prev.variables, input);
    }; });
    return xstream_1.default.merge(initReducer$, inputReducer$);
}
/**
 * Web Speech API's [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
 * action component.
 *
 * @param sources
 *
 *   * goal: a stream of `null` (as "cancel") or `SpeechRecognition`
 *     properties (as "goal").
 *   * SpeechSynthesis: `EventSource` for `start`, `end`, `error`, `result`
 *     events.
 *
 * @return sinks
 *
 *   * output: a stream for the SpeechRecognition driver input.
 *   * result: a stream of action results. `result.result` is a transcript from
 *     the recognition; it will be `''` for non-speech inputs.
 *
 */
function SpeechRecognitionAction(sources) {
    var input$ = input(xstream_1.default.fromObservable(sources.goal), xstream_1.default.fromObservable(sources.SpeechRecognition.events('start')), xstream_1.default.fromObservable(sources.SpeechRecognition.events('end')), xstream_1.default.fromObservable(sources.SpeechRecognition.events('error')), xstream_1.default.fromObservable(sources.SpeechRecognition.events('result')));
    var state$ = transitionReducer(input$)
        .fold(function (state, reducer) { return reducer(state); }, null)
        .drop(1); // drop "null"
    var outputs$ = state$.map(function (state) { return state.outputs; })
        .filter(function (outputs) { return !!outputs; });
    var result$ = state$.map(function (state) { return state.result; }).filter(function (result) { return !!result; });
    return {
        output: adapt_1.adapt(outputs$.map(function (outputs) { return outputs.args; })),
        result: adapt_1.adapt(result$),
    };
}
exports.SpeechRecognitionAction = SpeechRecognitionAction;
var _a, _b, _c, _d;

},{"@cycle-robot-drivers/action":1,"@cycle/run/lib/adapt":9,"xstream":20}],5:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = __importDefault(require("xstream"));
var adapt_1 = require("@cycle/run/lib/adapt");
var action_1 = require("@cycle-robot-drivers/action");
var State;
(function (State) {
    State["RUNNING"] = "RUNNING";
    State["DONE"] = "DONE";
    State["PREEMPTING"] = "PREEMPTING";
})(State || (State = {}));
var InputType;
(function (InputType) {
    InputType["GOAL"] = "GOAL";
    InputType["CANCEL"] = "CANCEL";
    InputType["START"] = "START";
    InputType["END"] = "END";
})(InputType || (InputType = {}));
;
function input(goal$, startEvent$, endEvent$) {
    return xstream_1.default.merge(goal$.filter(function (goal) { return typeof goal !== 'undefined'; }).map(function (goal) {
        if (goal === null) {
            return {
                type: InputType.CANCEL,
                value: null,
            };
        }
        else {
            var value = !!goal.goal_id ? goal : action_1.initGoal(goal);
            return {
                type: InputType.GOAL,
                value: typeof value.goal === 'string'
                    ? {
                        goal_id: value.goal_id,
                        goal: { text: value.goal },
                    } : value,
            };
        }
    }), startEvent$.mapTo({ type: InputType.START, value: null }), endEvent$.mapTo({ type: InputType.END, value: null }));
}
var transitionTable = (_a = {},
    _a[State.DONE] = (_b = {},
        _b[InputType.GOAL] = State.RUNNING,
        _b),
    _a[State.RUNNING] = (_c = {},
        _c[InputType.GOAL] = State.PREEMPTING,
        _c[InputType.CANCEL] = State.PREEMPTING,
        _c[InputType.START] = State.RUNNING,
        _c[InputType.END] = State.DONE,
        _c),
    _a[State.PREEMPTING] = (_d = {},
        _d[InputType.END] = State.DONE,
        _d),
    _a);
function transition(prevState, prevVariables, input) {
    var states = transitionTable[prevState];
    if (!states) {
        throw new Error("Invalid prevState=\"" + prevState + "\"");
    }
    var state = states[input.type];
    if (!state) {
        console.debug("Undefined transition for \"" + prevState + "\" \"" + input.type + "\"; "
            + "set state to prevState");
        state = prevState;
    }
    if (prevState === State.DONE && state === State.RUNNING) {
        // Start a new goal
        var goal = input.value;
        return {
            state: state,
            variables: {
                goal_id: goal.goal_id,
                newGoal: null,
            },
            outputs: {
                args: goal.goal
            },
            result: null,
        };
    }
    else if (state === State.DONE) {
        if (prevState === State.RUNNING || prevState === State.PREEMPTING) {
            // Stop the current goal and start the queued new goal
            var newGoal = prevVariables.newGoal;
            return {
                state: !!newGoal ? State.RUNNING : state,
                variables: {
                    goal_id: !!newGoal ? newGoal.goal_id : null,
                    newGoal: null,
                },
                outputs: !!newGoal ? {
                    args: newGoal.goal,
                } : null,
                result: {
                    status: {
                        goal_id: prevVariables.goal_id,
                        status: prevState === State.RUNNING
                            ? action_1.Status.SUCCEEDED : action_1.Status.PREEMPTED,
                    },
                    result: null,
                },
            };
        }
    }
    else if ((prevState === State.RUNNING || prevState === State.PREEMPTING)
        && state === State.PREEMPTING) {
        if (input.type === InputType.GOAL || input.type === InputType.CANCEL) {
            // Start stopping the current goal and queue a new goal if received one
            return {
                state: state,
                variables: __assign({}, prevVariables, { newGoal: input.type === InputType.GOAL ? input.value : null }),
                outputs: {
                    args: null,
                },
                result: null,
            };
        }
        if (input.type === InputType.START) {
            return {
                state: state,
                variables: prevVariables,
                outputs: {
                    args: null,
                },
                result: null,
            };
        }
    }
    return {
        state: prevState,
        variables: prevVariables,
        outputs: null,
        result: null,
    };
}
function transitionReducer(input$) {
    var initReducer$ = xstream_1.default.of(function initReducer(prev) {
        return {
            state: State.DONE,
            variables: {
                goal_id: null,
                newGoal: null,
            },
            outputs: null,
            result: null,
        };
    });
    var inputReducer$ = input$
        .map(function (input) { return function inputReducer(prev) {
        return transition(prev.state, prev.variables, input);
    }; });
    return xstream_1.default.merge(initReducer$, inputReducer$);
}
/**
 * Web Speech API's [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
 * action component.
 *
 * @param sources
 *
 *   * goal: a stream of `null` (as "cancel") or `SpeechSynthesisUtterance`
 *     properties (as "goal").
 *   * SpeechSynthesis: `EventSource` for `start` and `end` events.
 *
 * @return sinks
 *
 *   * output: a stream for the SpeechSynthesis driver input.
 *   * result: a stream of action results. `result.result` is always `null`.
 *
 */
function SpeechSynthesisAction(sources) {
    var input$ = input(xstream_1.default.fromObservable(sources.goal), xstream_1.default.fromObservable(sources.SpeechSynthesis.events('start')), xstream_1.default.fromObservable(sources.SpeechSynthesis.events('end')));
    var state$ = transitionReducer(input$)
        .fold(function (state, reducer) { return reducer(state); }, null)
        .drop(1); // drop "null"
    var outputs$ = state$.map(function (state) { return state.outputs; })
        .filter(function (outputs) { return !!outputs; });
    var result$ = state$.map(function (state) { return state.result; }).filter(function (result) { return !!result; });
    return {
        output: adapt_1.adapt(outputs$.map(function (outputs) { return outputs.args; })),
        result: adapt_1.adapt(result$),
    };
}
exports.SpeechSynthesisAction = SpeechSynthesisAction;
var _a, _b, _c, _d;

},{"@cycle-robot-drivers/action":1,"@cycle/run/lib/adapt":9,"xstream":20}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var makeSpeechSynthesisDriver_1 = require("./makeSpeechSynthesisDriver");
exports.makeSpeechSynthesisDriver = makeSpeechSynthesisDriver_1.makeSpeechSynthesisDriver;
var SpeechSynthesisAction_1 = require("./SpeechSynthesisAction");
exports.SpeechSynthesisAction = SpeechSynthesisAction_1.SpeechSynthesisAction;
var makeSpeechRecognitionDriver_1 = require("./makeSpeechRecognitionDriver");
exports.makeSpeechRecognitionDriver = makeSpeechRecognitionDriver_1.makeSpeechRecognitionDriver;
var SpeechRecognitionAction_1 = require("./SpeechRecognitionAction");
exports.SpeechRecognitionAction = SpeechRecognitionAction_1.SpeechRecognitionAction;

},{"./SpeechRecognitionAction":4,"./SpeechSynthesisAction":5,"./makeSpeechRecognitionDriver":7,"./makeSpeechSynthesisDriver":8}],7:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fromEvent_1 = __importDefault(require("xstream/extra/fromEvent"));
var adapt_1 = require("@cycle/run/lib/adapt");
var RecognitionSource = /** @class */ (function () {
    function RecognitionSource(_recognition) {
        this._recognition = _recognition;
    }
    RecognitionSource.prototype.events = function (eventName) {
        return adapt_1.adapt(fromEvent_1.default(this._recognition, eventName));
    };
    return RecognitionSource;
}());
/**
 * Web Speech API's [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
 * driver factory.
 *
 * @return {Driver} the SpeechRecognition Cycle.js driver function. It takes a
 *   stream of objects containing [`SpeechRecognition` properties](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#Properties)
 *   and returns a `EventSource`:
 *
 *   * `EventSource.events(eventName)` returns a stream of `eventName`
 *     events from [`SpeechRecognition`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#Event_handlers).
 */
function makeSpeechRecognitionDriver() {
    var recognition = new webkitSpeechRecognition();
    return function (sink$) {
        sink$.addListener({
            next: function (args) {
                // array values are SpeechSynthesisUtterance properties that are not
                //   event handlers; see
                //   https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
                if (!args) {
                    recognition.abort();
                }
                else {
                    ['lang', 'continuous', 'interimResults', 'maxAlternatives', 'serviceURI'].map(function (arg) {
                        if (arg in args) {
                            recognition[arg] = args[arg];
                        }
                        ;
                    });
                    recognition.start();
                }
            }
        });
        return new RecognitionSource(recognition);
    };
}
exports.makeSpeechRecognitionDriver = makeSpeechRecognitionDriver;

},{"@cycle/run/lib/adapt":9,"xstream/extra/fromEvent":19}],8:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fromEvent_1 = __importDefault(require("xstream/extra/fromEvent"));
var adapt_1 = require("@cycle/run/lib/adapt");
var UtteranceSource = /** @class */ (function () {
    function UtteranceSource(_utterance) {
        this._utterance = _utterance;
    }
    UtteranceSource.prototype.events = function (eventName) {
        return adapt_1.adapt(fromEvent_1.default(this._utterance, eventName));
    };
    return UtteranceSource;
}());
/**
 * Web Speech API's [SpeechSynthesis](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
 * driver factory.
 *
 * @return {Driver} the SpeechSynthesis Cycle.js driver function. It takes a
 *   stream of objects containing [`SpeechSynthesisUtterance` properties](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance#Properties)
 *   and returns a `EventSource`:
 *
 *   * `EventSource.events(eventName)` returns a stream of  `eventName`
 *     events from [`SpeechSynthesisUtterance`](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance#Event_handlers).
 */
function makeSpeechSynthesisDriver() {
    var synthesis = window.speechSynthesis;
    var utterance = new SpeechSynthesisUtterance();
    return function (sink$) {
        sink$.addListener({
            next: function (args) {
                // array values are SpeechSynthesisUtterance properties that are not
                //   event handlers; see
                //   https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance
                if (!args) {
                    synthesis.cancel();
                }
                else {
                    ['lang', 'pitch', 'rate', 'text', 'voice', 'volume'].map(function (arg) {
                        if (arg in args) {
                            utterance[arg] = args[arg];
                        }
                    });
                    synthesis.speak(utterance);
                }
            }
        });
        return new UtteranceSource(utterance);
    };
}
exports.makeSpeechSynthesisDriver = makeSpeechSynthesisDriver;

},{"@cycle/run/lib/adapt":9,"xstream/extra/fromEvent":19}],9:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getGlobal() {
    var globalObj;
    if (typeof window !== 'undefined') {
        globalObj = window;
    }
    else if (typeof global !== 'undefined') {
        globalObj = global;
    }
    else {
        globalObj = this;
    }
    globalObj.Cyclejs = globalObj.Cyclejs || {};
    globalObj = globalObj.Cyclejs;
    globalObj.adaptStream = globalObj.adaptStream || (function (x) { return x; });
    return globalObj;
}
function setAdapt(f) {
    getGlobal().adaptStream = f;
}
exports.setAdapt = setAdapt;
function adapt(stream) {
    return getGlobal().adaptStream(stream);
}
exports.adapt = adapt;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],10:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getGlobal() {
    var globalObj;
    if (typeof window !== 'undefined') {
        globalObj = window;
    }
    else if (typeof global !== 'undefined') {
        globalObj = global;
    }
    else {
        globalObj = this;
    }
    globalObj.Cyclejs = globalObj.Cyclejs || {};
    globalObj = globalObj.Cyclejs;
    globalObj.adaptStream = globalObj.adaptStream || (function (x) { return x; });
    return globalObj;
}
function setAdapt(f) {
    getGlobal().adaptStream = f;
}
exports.setAdapt = setAdapt;
function adapt(stream) {
    return getGlobal().adaptStream(stream);
}
exports.adapt = adapt;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var internals_1 = require("./internals");
/**
 * A function that prepares the Cycle application to be executed. Takes a `main`
 * function and prepares to circularly connects it to the given collection of
 * driver functions. As an output, `setup()` returns an object with three
 * properties: `sources`, `sinks` and `run`. Only when `run()` is called will
 * the application actually execute. Refer to the documentation of `run()` for
 * more details.
 *
 * **Example:**
 * ```js
 * import {setup} from '@cycle/run';
 * const {sources, sinks, run} = setup(main, drivers);
 * // ...
 * const dispose = run(); // Executes the application
 * // ...
 * dispose();
 * ```
 *
 * @param {Function} main a function that takes `sources` as input and outputs
 * `sinks`.
 * @param {Object} drivers an object where keys are driver names and values
 * are driver functions.
 * @return {Object} an object with three properties: `sources`, `sinks` and
 * `run`. `sources` is the collection of driver sources, `sinks` is the
 * collection of driver sinks, these can be used for debugging or testing. `run`
 * is the function that once called will execute the application.
 * @function setup
 */
function setup(main, drivers) {
    if (typeof main !== "function") {
        throw new Error("First argument given to Cycle must be the 'main' " + "function.");
    }
    if (typeof drivers !== "object" || drivers === null) {
        throw new Error("Second argument given to Cycle must be an object " +
            "with driver functions as properties.");
    }
    if (internals_1.isObjectEmpty(drivers)) {
        throw new Error("Second argument given to Cycle must be an object " +
            "with at least one driver function declared as a property.");
    }
    var engine = setupReusable(drivers);
    var sinks = main(engine.sources);
    if (typeof window !== 'undefined') {
        window.Cyclejs = window.Cyclejs || {};
        window.Cyclejs.sinks = sinks;
    }
    function _run() {
        var disposeRun = engine.run(sinks);
        return function dispose() {
            disposeRun();
            engine.dispose();
        };
    }
    return { sinks: sinks, sources: engine.sources, run: _run };
}
exports.setup = setup;
/**
 * A partially-applied variant of setup() which accepts only the drivers, and
 * allows many `main` functions to execute and reuse this same set of drivers.
 *
 * Takes an object with driver functions as input, and outputs an object which
 * contains the generated sources (from those drivers) and a `run` function
 * (which in turn expects sinks as argument). This `run` function can be called
 * multiple times with different arguments, and it will reuse the drivers that
 * were passed to `setupReusable`.
 *
 * **Example:**
 * ```js
 * import {setupReusable} from '@cycle/run';
 * const {sources, run, dispose} = setupReusable(drivers);
 * // ...
 * const sinks = main(sources);
 * const disposeRun = run(sinks);
 * // ...
 * disposeRun();
 * // ...
 * dispose(); // ends the reusability of drivers
 * ```
 *
 * @param {Object} drivers an object where keys are driver names and values
 * are driver functions.
 * @return {Object} an object with three properties: `sources`, `run` and
 * `dispose`. `sources` is the collection of driver sources, `run` is the
 * function that once called with 'sinks' as argument, will execute the
 * application, tying together sources with sinks. `dispose` terminates the
 * reusable resources used by the drivers. Note also that `run` returns a
 * dispose function which terminates resources that are specific (not reusable)
 * to that run.
 * @function setupReusable
 */
function setupReusable(drivers) {
    if (typeof drivers !== "object" || drivers === null) {
        throw new Error("Argument given to setupReusable must be an object " +
            "with driver functions as properties.");
    }
    if (internals_1.isObjectEmpty(drivers)) {
        throw new Error("Argument given to setupReusable must be an object " +
            "with at least one driver function declared as a property.");
    }
    var sinkProxies = internals_1.makeSinkProxies(drivers);
    var rawSources = internals_1.callDrivers(drivers, sinkProxies);
    var sources = internals_1.adaptSources(rawSources);
    function _run(sinks) {
        return internals_1.replicateMany(sinks, sinkProxies);
    }
    function disposeEngine() {
        internals_1.disposeSources(sources);
        internals_1.disposeSinkProxies(sinkProxies);
    }
    return { sources: sources, run: _run, dispose: disposeEngine };
}
exports.setupReusable = setupReusable;
/**
 * Takes a `main` function and circularly connects it to the given collection
 * of driver functions.
 *
 * **Example:**
 * ```js
 * import run from '@cycle/run';
 * const dispose = run(main, drivers);
 * // ...
 * dispose();
 * ```
 *
 * The `main` function expects a collection of "source" streams (returned from
 * drivers) as input, and should return a collection of "sink" streams (to be
 * given to drivers). A "collection of streams" is a JavaScript object where
 * keys match the driver names registered by the `drivers` object, and values
 * are the streams. Refer to the documentation of each driver to see more
 * details on what types of sources it outputs and sinks it receives.
 *
 * @param {Function} main a function that takes `sources` as input and outputs
 * `sinks`.
 * @param {Object} drivers an object where keys are driver names and values
 * are driver functions.
 * @return {Function} a dispose function, used to terminate the execution of the
 * Cycle.js program, cleaning up resources used.
 * @function run
 */
function run(main, drivers) {
    var program = setup(main, drivers);
    if (typeof window !== 'undefined' &&
        window['CyclejsDevTool_startGraphSerializer']) {
        window['CyclejsDevTool_startGraphSerializer'](program.sinks);
    }
    return program.run();
}
exports.run = run;
exports.default = run;

},{"./internals":12}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var quicktask_1 = require("quicktask");
var adapt_1 = require("./adapt");
var scheduleMicrotask = quicktask_1.default();
function makeSinkProxies(drivers) {
    var sinkProxies = {};
    for (var name_1 in drivers) {
        if (drivers.hasOwnProperty(name_1)) {
            sinkProxies[name_1] = xstream_1.default.create();
        }
    }
    return sinkProxies;
}
exports.makeSinkProxies = makeSinkProxies;
function callDrivers(drivers, sinkProxies) {
    var sources = {};
    for (var name_2 in drivers) {
        if (drivers.hasOwnProperty(name_2)) {
            sources[name_2] = drivers[name_2](sinkProxies[name_2], name_2);
            if (sources[name_2] && typeof sources[name_2] === 'object') {
                sources[name_2]._isCycleSource = name_2;
            }
        }
    }
    return sources;
}
exports.callDrivers = callDrivers;
// NOTE: this will mutate `sources`.
function adaptSources(sources) {
    for (var name_3 in sources) {
        if (sources.hasOwnProperty(name_3) &&
            sources[name_3] &&
            typeof sources[name_3]['shamefullySendNext'] === 'function') {
            sources[name_3] = adapt_1.adapt(sources[name_3]);
        }
    }
    return sources;
}
exports.adaptSources = adaptSources;
function replicateMany(sinks, sinkProxies) {
    var sinkNames = Object.keys(sinks).filter(function (name) { return !!sinkProxies[name]; });
    var buffers = {};
    var replicators = {};
    sinkNames.forEach(function (name) {
        buffers[name] = { _n: [], _e: [] };
        replicators[name] = {
            next: function (x) { return buffers[name]._n.push(x); },
            error: function (err) { return buffers[name]._e.push(err); },
            complete: function () { },
        };
    });
    var subscriptions = sinkNames.map(function (name) {
        return xstream_1.default.fromObservable(sinks[name]).subscribe(replicators[name]);
    });
    sinkNames.forEach(function (name) {
        var listener = sinkProxies[name];
        var next = function (x) {
            scheduleMicrotask(function () { return listener._n(x); });
        };
        var error = function (err) {
            scheduleMicrotask(function () {
                (console.error || console.log)(err);
                listener._e(err);
            });
        };
        buffers[name]._n.forEach(next);
        buffers[name]._e.forEach(error);
        replicators[name].next = next;
        replicators[name].error = error;
        // because sink.subscribe(replicator) had mutated replicator to add
        // _n, _e, _c, we must also update these:
        replicators[name]._n = next;
        replicators[name]._e = error;
    });
    buffers = null; // free up for GC
    return function disposeReplication() {
        subscriptions.forEach(function (s) { return s.unsubscribe(); });
    };
}
exports.replicateMany = replicateMany;
function disposeSinkProxies(sinkProxies) {
    Object.keys(sinkProxies).forEach(function (name) { return sinkProxies[name]._c(); });
}
exports.disposeSinkProxies = disposeSinkProxies;
function disposeSources(sources) {
    for (var k in sources) {
        if (sources.hasOwnProperty(k) &&
            sources[k] &&
            sources[k].dispose) {
            sources[k].dispose();
        }
    }
}
exports.disposeSources = disposeSources;
function isObjectEmpty(obj) {
    return Object.keys(obj).length === 0;
}
exports.isObjectEmpty = isObjectEmpty;

},{"./adapt":10,"quicktask":14,"xstream":20}],13:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],14:[function(require,module,exports){
(function (process,setImmediate){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function microtask() {
    if (typeof MutationObserver !== 'undefined') {
        var node_1 = document.createTextNode('');
        var queue_1 = [];
        var i_1 = 0;
        new MutationObserver(function () {
            while (queue_1.length) {
                queue_1.shift()();
            }
        }).observe(node_1, { characterData: true });
        return function (fn) {
            queue_1.push(fn);
            node_1.data = i_1 = 1 - i_1;
        };
    }
    else if (typeof setImmediate !== 'undefined') {
        return setImmediate;
    }
    else if (typeof process !== 'undefined') {
        return process.nextTick;
    }
    else {
        return setTimeout;
    }
}
exports.default = microtask;

}).call(this,require('_process'),require("timers").setImmediate)

},{"_process":13,"timers":17}],15:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ponyfill = require('./ponyfill.js');

var _ponyfill2 = _interopRequireDefault(_ponyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var root; /* global window */


if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  root = Function('return this')();
}

var result = (0, _ponyfill2['default'])(root);
exports['default'] = result;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./ponyfill.js":16}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports['default'] = symbolObservablePonyfill;
function symbolObservablePonyfill(root) {
	var result;
	var _Symbol = root.Symbol;

	if (typeof _Symbol === 'function') {
		if (_Symbol.observable) {
			result = _Symbol.observable;
		} else {
			result = _Symbol('observable');
			_Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
};
},{}],17:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)

},{"process/browser.js":13,"timers":17}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var DelayOperator = /** @class */ (function () {
    function DelayOperator(dt, ins) {
        this.dt = dt;
        this.ins = ins;
        this.type = 'delay';
        this.out = null;
    }
    DelayOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    DelayOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
    };
    DelayOperator.prototype._n = function (t) {
        var u = this.out;
        if (!u)
            return;
        var id = setInterval(function () {
            u._n(t);
            clearInterval(id);
        }, this.dt);
    };
    DelayOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        var id = setInterval(function () {
            u._e(err);
            clearInterval(id);
        }, this.dt);
    };
    DelayOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        var id = setInterval(function () {
            u._c();
            clearInterval(id);
        }, this.dt);
    };
    return DelayOperator;
}());
/**
 * Delays periodic events by a given time period.
 *
 * Marble diagram:
 *
 * ```text
 * 1----2--3--4----5|
 *     delay(60)
 * ---1----2--3--4----5|
 * ```
 *
 * Example:
 *
 * ```js
 * import fromDiagram from 'xstream/extra/fromDiagram'
 * import delay from 'xstream/extra/delay'
 *
 * const stream = fromDiagram('1----2--3--4----5|')
 *  .compose(delay(60))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > 1  (after 60 ms)
 * > 2  (after 160 ms)
 * > 3  (after 220 ms)
 * > 4  (after 280 ms)
 * > 5  (after 380 ms)
 * > completed
 * ```
 *
 * @param {number} period The amount of silence required in milliseconds.
 * @return {Stream}
 */
function delay(period) {
    return function delayOperator(ins) {
        return new index_1.Stream(new DelayOperator(period, ins));
    };
}
exports.default = delay;

},{"../index":20}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var DOMEventProducer = /** @class */ (function () {
    function DOMEventProducer(node, eventType, useCapture) {
        this.node = node;
        this.eventType = eventType;
        this.useCapture = useCapture;
        this.type = 'fromEvent';
    }
    DOMEventProducer.prototype._start = function (out) {
        this.listener = function (e) { return out._n(e); };
        this.node.addEventListener(this.eventType, this.listener, this.useCapture);
    };
    DOMEventProducer.prototype._stop = function () {
        this.node.removeEventListener(this.eventType, this.listener, this.useCapture);
        this.listener = null;
    };
    return DOMEventProducer;
}());
exports.DOMEventProducer = DOMEventProducer;
var NodeEventProducer = /** @class */ (function () {
    function NodeEventProducer(node, eventName) {
        this.node = node;
        this.eventName = eventName;
        this.type = 'fromEvent';
    }
    NodeEventProducer.prototype._start = function (out) {
        this.listener = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return (args.length > 1) ? out._n(args) : out._n(args[0]);
        };
        this.node.addListener(this.eventName, this.listener);
    };
    NodeEventProducer.prototype._stop = function () {
        this.node.removeListener(this.eventName, this.listener);
        this.listener = null;
    };
    return NodeEventProducer;
}());
exports.NodeEventProducer = NodeEventProducer;
function isEmitter(element) {
    return element.emit && element.addListener;
}
function fromEvent(element, eventName, useCapture) {
    if (useCapture === void 0) { useCapture = false; }
    if (isEmitter(element)) {
        return new index_1.Stream(new NodeEventProducer(element, eventName));
    }
    else {
        return new index_1.Stream(new DOMEventProducer(element, eventName, useCapture));
    }
}
exports.default = fromEvent;

},{"../index":20}],20:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var symbol_observable_1 = require("symbol-observable");
var NO = {};
exports.NO = NO;
function noop() { }
function cp(a) {
    var l = a.length;
    var b = Array(l);
    for (var i = 0; i < l; ++i)
        b[i] = a[i];
    return b;
}
function and(f1, f2) {
    return function andFn(t) {
        return f1(t) && f2(t);
    };
}
function _try(c, t, u) {
    try {
        return c.f(t);
    }
    catch (e) {
        u._e(e);
        return NO;
    }
}
var NO_IL = {
    _n: noop,
    _e: noop,
    _c: noop,
};
exports.NO_IL = NO_IL;
// mutates the input
function internalizeProducer(producer) {
    producer._start = function _start(il) {
        il.next = il._n;
        il.error = il._e;
        il.complete = il._c;
        this.start(il);
    };
    producer._stop = producer.stop;
}
var StreamSub = /** @class */ (function () {
    function StreamSub(_stream, _listener) {
        this._stream = _stream;
        this._listener = _listener;
    }
    StreamSub.prototype.unsubscribe = function () {
        this._stream._remove(this._listener);
    };
    return StreamSub;
}());
var Observer = /** @class */ (function () {
    function Observer(_listener) {
        this._listener = _listener;
    }
    Observer.prototype.next = function (value) {
        this._listener._n(value);
    };
    Observer.prototype.error = function (err) {
        this._listener._e(err);
    };
    Observer.prototype.complete = function () {
        this._listener._c();
    };
    return Observer;
}());
var FromObservable = /** @class */ (function () {
    function FromObservable(observable) {
        this.type = 'fromObservable';
        this.ins = observable;
        this.active = false;
    }
    FromObservable.prototype._start = function (out) {
        this.out = out;
        this.active = true;
        this._sub = this.ins.subscribe(new Observer(out));
        if (!this.active)
            this._sub.unsubscribe();
    };
    FromObservable.prototype._stop = function () {
        if (this._sub)
            this._sub.unsubscribe();
        this.active = false;
    };
    return FromObservable;
}());
var Merge = /** @class */ (function () {
    function Merge(insArr) {
        this.type = 'merge';
        this.insArr = insArr;
        this.out = NO;
        this.ac = 0;
    }
    Merge.prototype._start = function (out) {
        this.out = out;
        var s = this.insArr;
        var L = s.length;
        this.ac = L;
        for (var i = 0; i < L; i++)
            s[i]._add(this);
    };
    Merge.prototype._stop = function () {
        var s = this.insArr;
        var L = s.length;
        for (var i = 0; i < L; i++)
            s[i]._remove(this);
        this.out = NO;
    };
    Merge.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        u._n(t);
    };
    Merge.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Merge.prototype._c = function () {
        if (--this.ac <= 0) {
            var u = this.out;
            if (u === NO)
                return;
            u._c();
        }
    };
    return Merge;
}());
var CombineListener = /** @class */ (function () {
    function CombineListener(i, out, p) {
        this.i = i;
        this.out = out;
        this.p = p;
        p.ils.push(this);
    }
    CombineListener.prototype._n = function (t) {
        var p = this.p, out = this.out;
        if (out === NO)
            return;
        if (p.up(t, this.i)) {
            var a = p.vals;
            var l = a.length;
            var b = Array(l);
            for (var i = 0; i < l; ++i)
                b[i] = a[i];
            out._n(b);
        }
    };
    CombineListener.prototype._e = function (err) {
        var out = this.out;
        if (out === NO)
            return;
        out._e(err);
    };
    CombineListener.prototype._c = function () {
        var p = this.p;
        if (p.out === NO)
            return;
        if (--p.Nc === 0)
            p.out._c();
    };
    return CombineListener;
}());
var Combine = /** @class */ (function () {
    function Combine(insArr) {
        this.type = 'combine';
        this.insArr = insArr;
        this.out = NO;
        this.ils = [];
        this.Nc = this.Nn = 0;
        this.vals = [];
    }
    Combine.prototype.up = function (t, i) {
        var v = this.vals[i];
        var Nn = !this.Nn ? 0 : v === NO ? --this.Nn : this.Nn;
        this.vals[i] = t;
        return Nn === 0;
    };
    Combine.prototype._start = function (out) {
        this.out = out;
        var s = this.insArr;
        var n = this.Nc = this.Nn = s.length;
        var vals = this.vals = new Array(n);
        if (n === 0) {
            out._n([]);
            out._c();
        }
        else {
            for (var i = 0; i < n; i++) {
                vals[i] = NO;
                s[i]._add(new CombineListener(i, out, this));
            }
        }
    };
    Combine.prototype._stop = function () {
        var s = this.insArr;
        var n = s.length;
        var ils = this.ils;
        for (var i = 0; i < n; i++)
            s[i]._remove(ils[i]);
        this.out = NO;
        this.ils = [];
        this.vals = [];
    };
    return Combine;
}());
var FromArray = /** @class */ (function () {
    function FromArray(a) {
        this.type = 'fromArray';
        this.a = a;
    }
    FromArray.prototype._start = function (out) {
        var a = this.a;
        for (var i = 0, n = a.length; i < n; i++)
            out._n(a[i]);
        out._c();
    };
    FromArray.prototype._stop = function () {
    };
    return FromArray;
}());
var FromPromise = /** @class */ (function () {
    function FromPromise(p) {
        this.type = 'fromPromise';
        this.on = false;
        this.p = p;
    }
    FromPromise.prototype._start = function (out) {
        var prod = this;
        this.on = true;
        this.p.then(function (v) {
            if (prod.on) {
                out._n(v);
                out._c();
            }
        }, function (e) {
            out._e(e);
        }).then(noop, function (err) {
            setTimeout(function () { throw err; });
        });
    };
    FromPromise.prototype._stop = function () {
        this.on = false;
    };
    return FromPromise;
}());
var Periodic = /** @class */ (function () {
    function Periodic(period) {
        this.type = 'periodic';
        this.period = period;
        this.intervalID = -1;
        this.i = 0;
    }
    Periodic.prototype._start = function (out) {
        var self = this;
        function intervalHandler() { out._n(self.i++); }
        this.intervalID = setInterval(intervalHandler, this.period);
    };
    Periodic.prototype._stop = function () {
        if (this.intervalID !== -1)
            clearInterval(this.intervalID);
        this.intervalID = -1;
        this.i = 0;
    };
    return Periodic;
}());
var Debug = /** @class */ (function () {
    function Debug(ins, arg) {
        this.type = 'debug';
        this.ins = ins;
        this.out = NO;
        this.s = noop;
        this.l = '';
        if (typeof arg === 'string')
            this.l = arg;
        else if (typeof arg === 'function')
            this.s = arg;
    }
    Debug.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    Debug.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    Debug.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        var s = this.s, l = this.l;
        if (s !== noop) {
            try {
                s(t);
            }
            catch (e) {
                u._e(e);
            }
        }
        else if (l)
            console.log(l + ':', t);
        else
            console.log(t);
        u._n(t);
    };
    Debug.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Debug.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return Debug;
}());
var Drop = /** @class */ (function () {
    function Drop(max, ins) {
        this.type = 'drop';
        this.ins = ins;
        this.out = NO;
        this.max = max;
        this.dropped = 0;
    }
    Drop.prototype._start = function (out) {
        this.out = out;
        this.dropped = 0;
        this.ins._add(this);
    };
    Drop.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    Drop.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        if (this.dropped++ >= this.max)
            u._n(t);
    };
    Drop.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Drop.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return Drop;
}());
var EndWhenListener = /** @class */ (function () {
    function EndWhenListener(out, op) {
        this.out = out;
        this.op = op;
    }
    EndWhenListener.prototype._n = function () {
        this.op.end();
    };
    EndWhenListener.prototype._e = function (err) {
        this.out._e(err);
    };
    EndWhenListener.prototype._c = function () {
        this.op.end();
    };
    return EndWhenListener;
}());
var EndWhen = /** @class */ (function () {
    function EndWhen(o, ins) {
        this.type = 'endWhen';
        this.ins = ins;
        this.out = NO;
        this.o = o;
        this.oil = NO_IL;
    }
    EndWhen.prototype._start = function (out) {
        this.out = out;
        this.o._add(this.oil = new EndWhenListener(out, this));
        this.ins._add(this);
    };
    EndWhen.prototype._stop = function () {
        this.ins._remove(this);
        this.o._remove(this.oil);
        this.out = NO;
        this.oil = NO_IL;
    };
    EndWhen.prototype.end = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    EndWhen.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        u._n(t);
    };
    EndWhen.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    EndWhen.prototype._c = function () {
        this.end();
    };
    return EndWhen;
}());
var Filter = /** @class */ (function () {
    function Filter(passes, ins) {
        this.type = 'filter';
        this.ins = ins;
        this.out = NO;
        this.f = passes;
    }
    Filter.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    Filter.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    Filter.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        var r = _try(this, t, u);
        if (r === NO || !r)
            return;
        u._n(t);
    };
    Filter.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Filter.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return Filter;
}());
var FlattenListener = /** @class */ (function () {
    function FlattenListener(out, op) {
        this.out = out;
        this.op = op;
    }
    FlattenListener.prototype._n = function (t) {
        this.out._n(t);
    };
    FlattenListener.prototype._e = function (err) {
        this.out._e(err);
    };
    FlattenListener.prototype._c = function () {
        this.op.inner = NO;
        this.op.less();
    };
    return FlattenListener;
}());
var Flatten = /** @class */ (function () {
    function Flatten(ins) {
        this.type = 'flatten';
        this.ins = ins;
        this.out = NO;
        this.open = true;
        this.inner = NO;
        this.il = NO_IL;
    }
    Flatten.prototype._start = function (out) {
        this.out = out;
        this.open = true;
        this.inner = NO;
        this.il = NO_IL;
        this.ins._add(this);
    };
    Flatten.prototype._stop = function () {
        this.ins._remove(this);
        if (this.inner !== NO)
            this.inner._remove(this.il);
        this.out = NO;
        this.open = true;
        this.inner = NO;
        this.il = NO_IL;
    };
    Flatten.prototype.less = function () {
        var u = this.out;
        if (u === NO)
            return;
        if (!this.open && this.inner === NO)
            u._c();
    };
    Flatten.prototype._n = function (s) {
        var u = this.out;
        if (u === NO)
            return;
        var _a = this, inner = _a.inner, il = _a.il;
        if (inner !== NO && il !== NO_IL)
            inner._remove(il);
        (this.inner = s)._add(this.il = new FlattenListener(u, this));
    };
    Flatten.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Flatten.prototype._c = function () {
        this.open = false;
        this.less();
    };
    return Flatten;
}());
var Fold = /** @class */ (function () {
    function Fold(f, seed, ins) {
        var _this = this;
        this.type = 'fold';
        this.ins = ins;
        this.out = NO;
        this.f = function (t) { return f(_this.acc, t); };
        this.acc = this.seed = seed;
    }
    Fold.prototype._start = function (out) {
        this.out = out;
        this.acc = this.seed;
        out._n(this.acc);
        this.ins._add(this);
    };
    Fold.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
        this.acc = this.seed;
    };
    Fold.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        var r = _try(this, t, u);
        if (r === NO)
            return;
        u._n(this.acc = r);
    };
    Fold.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Fold.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return Fold;
}());
var Last = /** @class */ (function () {
    function Last(ins) {
        this.type = 'last';
        this.ins = ins;
        this.out = NO;
        this.has = false;
        this.val = NO;
    }
    Last.prototype._start = function (out) {
        this.out = out;
        this.has = false;
        this.ins._add(this);
    };
    Last.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
        this.val = NO;
    };
    Last.prototype._n = function (t) {
        this.has = true;
        this.val = t;
    };
    Last.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Last.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        if (this.has) {
            u._n(this.val);
            u._c();
        }
        else
            u._e(new Error('last() failed because input stream completed'));
    };
    return Last;
}());
var MapOp = /** @class */ (function () {
    function MapOp(project, ins) {
        this.type = 'map';
        this.ins = ins;
        this.out = NO;
        this.f = project;
    }
    MapOp.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    MapOp.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    MapOp.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        var r = _try(this, t, u);
        if (r === NO)
            return;
        u._n(r);
    };
    MapOp.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    MapOp.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return MapOp;
}());
var Remember = /** @class */ (function () {
    function Remember(ins) {
        this.type = 'remember';
        this.ins = ins;
        this.out = NO;
    }
    Remember.prototype._start = function (out) {
        this.out = out;
        this.ins._add(out);
    };
    Remember.prototype._stop = function () {
        this.ins._remove(this.out);
        this.out = NO;
    };
    return Remember;
}());
var ReplaceError = /** @class */ (function () {
    function ReplaceError(replacer, ins) {
        this.type = 'replaceError';
        this.ins = ins;
        this.out = NO;
        this.f = replacer;
    }
    ReplaceError.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    ReplaceError.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    ReplaceError.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        u._n(t);
    };
    ReplaceError.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        try {
            this.ins._remove(this);
            (this.ins = this.f(err))._add(this);
        }
        catch (e) {
            u._e(e);
        }
    };
    ReplaceError.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return ReplaceError;
}());
var StartWith = /** @class */ (function () {
    function StartWith(ins, val) {
        this.type = 'startWith';
        this.ins = ins;
        this.out = NO;
        this.val = val;
    }
    StartWith.prototype._start = function (out) {
        this.out = out;
        this.out._n(this.val);
        this.ins._add(out);
    };
    StartWith.prototype._stop = function () {
        this.ins._remove(this.out);
        this.out = NO;
    };
    return StartWith;
}());
var Take = /** @class */ (function () {
    function Take(max, ins) {
        this.type = 'take';
        this.ins = ins;
        this.out = NO;
        this.max = max;
        this.taken = 0;
    }
    Take.prototype._start = function (out) {
        this.out = out;
        this.taken = 0;
        if (this.max <= 0)
            out._c();
        else
            this.ins._add(this);
    };
    Take.prototype._stop = function () {
        this.ins._remove(this);
        this.out = NO;
    };
    Take.prototype._n = function (t) {
        var u = this.out;
        if (u === NO)
            return;
        var m = ++this.taken;
        if (m < this.max)
            u._n(t);
        else if (m === this.max) {
            u._n(t);
            u._c();
        }
    };
    Take.prototype._e = function (err) {
        var u = this.out;
        if (u === NO)
            return;
        u._e(err);
    };
    Take.prototype._c = function () {
        var u = this.out;
        if (u === NO)
            return;
        u._c();
    };
    return Take;
}());
var Stream = /** @class */ (function () {
    function Stream(producer) {
        this._prod = producer || NO;
        this._ils = [];
        this._stopID = NO;
        this._dl = NO;
        this._d = false;
        this._target = NO;
        this._err = NO;
    }
    Stream.prototype._n = function (t) {
        var a = this._ils;
        var L = a.length;
        if (this._d)
            this._dl._n(t);
        if (L == 1)
            a[0]._n(t);
        else if (L == 0)
            return;
        else {
            var b = cp(a);
            for (var i = 0; i < L; i++)
                b[i]._n(t);
        }
    };
    Stream.prototype._e = function (err) {
        if (this._err !== NO)
            return;
        this._err = err;
        var a = this._ils;
        var L = a.length;
        this._x();
        if (this._d)
            this._dl._e(err);
        if (L == 1)
            a[0]._e(err);
        else if (L == 0)
            return;
        else {
            var b = cp(a);
            for (var i = 0; i < L; i++)
                b[i]._e(err);
        }
        if (!this._d && L == 0)
            throw this._err;
    };
    Stream.prototype._c = function () {
        var a = this._ils;
        var L = a.length;
        this._x();
        if (this._d)
            this._dl._c();
        if (L == 1)
            a[0]._c();
        else if (L == 0)
            return;
        else {
            var b = cp(a);
            for (var i = 0; i < L; i++)
                b[i]._c();
        }
    };
    Stream.prototype._x = function () {
        if (this._ils.length === 0)
            return;
        if (this._prod !== NO)
            this._prod._stop();
        this._err = NO;
        this._ils = [];
    };
    Stream.prototype._stopNow = function () {
        // WARNING: code that calls this method should
        // first check if this._prod is valid (not `NO`)
        this._prod._stop();
        this._err = NO;
        this._stopID = NO;
    };
    Stream.prototype._add = function (il) {
        var ta = this._target;
        if (ta !== NO)
            return ta._add(il);
        var a = this._ils;
        a.push(il);
        if (a.length > 1)
            return;
        if (this._stopID !== NO) {
            clearTimeout(this._stopID);
            this._stopID = NO;
        }
        else {
            var p = this._prod;
            if (p !== NO)
                p._start(this);
        }
    };
    Stream.prototype._remove = function (il) {
        var _this = this;
        var ta = this._target;
        if (ta !== NO)
            return ta._remove(il);
        var a = this._ils;
        var i = a.indexOf(il);
        if (i > -1) {
            a.splice(i, 1);
            if (this._prod !== NO && a.length <= 0) {
                this._err = NO;
                this._stopID = setTimeout(function () { return _this._stopNow(); });
            }
            else if (a.length === 1) {
                this._pruneCycles();
            }
        }
    };
    // If all paths stemming from `this` stream eventually end at `this`
    // stream, then we remove the single listener of `this` stream, to
    // force it to end its execution and dispose resources. This method
    // assumes as a precondition that this._ils has just one listener.
    Stream.prototype._pruneCycles = function () {
        if (this._hasNoSinks(this, []))
            this._remove(this._ils[0]);
    };
    // Checks whether *there is no* path starting from `x` that leads to an end
    // listener (sink) in the stream graph, following edges A->B where B is a
    // listener of A. This means these paths constitute a cycle somehow. Is given
    // a trace of all visited nodes so far.
    Stream.prototype._hasNoSinks = function (x, trace) {
        if (trace.indexOf(x) !== -1)
            return true;
        else if (x.out === this)
            return true;
        else if (x.out && x.out !== NO)
            return this._hasNoSinks(x.out, trace.concat(x));
        else if (x._ils) {
            for (var i = 0, N = x._ils.length; i < N; i++)
                if (!this._hasNoSinks(x._ils[i], trace.concat(x)))
                    return false;
            return true;
        }
        else
            return false;
    };
    Stream.prototype.ctor = function () {
        return this instanceof MemoryStream ? MemoryStream : Stream;
    };
    /**
     * Adds a Listener to the Stream.
     *
     * @param {Listener} listener
     */
    Stream.prototype.addListener = function (listener) {
        listener._n = listener.next || noop;
        listener._e = listener.error || noop;
        listener._c = listener.complete || noop;
        this._add(listener);
    };
    /**
     * Removes a Listener from the Stream, assuming the Listener was added to it.
     *
     * @param {Listener<T>} listener
     */
    Stream.prototype.removeListener = function (listener) {
        this._remove(listener);
    };
    /**
     * Adds a Listener to the Stream returning a Subscription to remove that
     * listener.
     *
     * @param {Listener} listener
     * @returns {Subscription}
     */
    Stream.prototype.subscribe = function (listener) {
        this.addListener(listener);
        return new StreamSub(this, listener);
    };
    /**
     * Add interop between most.js and RxJS 5
     *
     * @returns {Stream}
     */
    Stream.prototype[symbol_observable_1.default] = function () {
        return this;
    };
    /**
     * Creates a new Stream given a Producer.
     *
     * @factory true
     * @param {Producer} producer An optional Producer that dictates how to
     * start, generate events, and stop the Stream.
     * @return {Stream}
     */
    Stream.create = function (producer) {
        if (producer) {
            if (typeof producer.start !== 'function'
                || typeof producer.stop !== 'function')
                throw new Error('producer requires both start and stop functions');
            internalizeProducer(producer); // mutates the input
        }
        return new Stream(producer);
    };
    /**
     * Creates a new MemoryStream given a Producer.
     *
     * @factory true
     * @param {Producer} producer An optional Producer that dictates how to
     * start, generate events, and stop the Stream.
     * @return {MemoryStream}
     */
    Stream.createWithMemory = function (producer) {
        if (producer)
            internalizeProducer(producer); // mutates the input
        return new MemoryStream(producer);
    };
    /**
     * Creates a Stream that does nothing when started. It never emits any event.
     *
     * Marble diagram:
     *
     * ```text
     *          never
     * -----------------------
     * ```
     *
     * @factory true
     * @return {Stream}
     */
    Stream.never = function () {
        return new Stream({ _start: noop, _stop: noop });
    };
    /**
     * Creates a Stream that immediately emits the "complete" notification when
     * started, and that's it.
     *
     * Marble diagram:
     *
     * ```text
     * empty
     * -|
     * ```
     *
     * @factory true
     * @return {Stream}
     */
    Stream.empty = function () {
        return new Stream({
            _start: function (il) { il._c(); },
            _stop: noop,
        });
    };
    /**
     * Creates a Stream that immediately emits an "error" notification with the
     * value you passed as the `error` argument when the stream starts, and that's
     * it.
     *
     * Marble diagram:
     *
     * ```text
     * throw(X)
     * -X
     * ```
     *
     * @factory true
     * @param error The error event to emit on the created stream.
     * @return {Stream}
     */
    Stream.throw = function (error) {
        return new Stream({
            _start: function (il) { il._e(error); },
            _stop: noop,
        });
    };
    /**
     * Creates a stream from an Array, Promise, or an Observable.
     *
     * @factory true
     * @param {Array|PromiseLike|Observable} input The input to make a stream from.
     * @return {Stream}
     */
    Stream.from = function (input) {
        if (typeof input[symbol_observable_1.default] === 'function')
            return Stream.fromObservable(input);
        else if (typeof input.then === 'function')
            return Stream.fromPromise(input);
        else if (Array.isArray(input))
            return Stream.fromArray(input);
        throw new TypeError("Type of input to from() must be an Array, Promise, or Observable");
    };
    /**
     * Creates a Stream that immediately emits the arguments that you give to
     * *of*, then completes.
     *
     * Marble diagram:
     *
     * ```text
     * of(1,2,3)
     * 123|
     * ```
     *
     * @factory true
     * @param a The first value you want to emit as an event on the stream.
     * @param b The second value you want to emit as an event on the stream. One
     * or more of these values may be given as arguments.
     * @return {Stream}
     */
    Stream.of = function () {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        return Stream.fromArray(items);
    };
    /**
     * Converts an array to a stream. The returned stream will emit synchronously
     * all the items in the array, and then complete.
     *
     * Marble diagram:
     *
     * ```text
     * fromArray([1,2,3])
     * 123|
     * ```
     *
     * @factory true
     * @param {Array} array The array to be converted as a stream.
     * @return {Stream}
     */
    Stream.fromArray = function (array) {
        return new Stream(new FromArray(array));
    };
    /**
     * Converts a promise to a stream. The returned stream will emit the resolved
     * value of the promise, and then complete. However, if the promise is
     * rejected, the stream will emit the corresponding error.
     *
     * Marble diagram:
     *
     * ```text
     * fromPromise( ----42 )
     * -----------------42|
     * ```
     *
     * @factory true
     * @param {PromiseLike} promise The promise to be converted as a stream.
     * @return {Stream}
     */
    Stream.fromPromise = function (promise) {
        return new Stream(new FromPromise(promise));
    };
    /**
     * Converts an Observable into a Stream.
     *
     * @factory true
     * @param {any} observable The observable to be converted as a stream.
     * @return {Stream}
     */
    Stream.fromObservable = function (obs) {
        if (obs.endWhen)
            return obs;
        var o = typeof obs[symbol_observable_1.default] === 'function' ? obs[symbol_observable_1.default]() : obs;
        return new Stream(new FromObservable(o));
    };
    /**
     * Creates a stream that periodically emits incremental numbers, every
     * `period` milliseconds.
     *
     * Marble diagram:
     *
     * ```text
     *     periodic(1000)
     * ---0---1---2---3---4---...
     * ```
     *
     * @factory true
     * @param {number} period The interval in milliseconds to use as a rate of
     * emission.
     * @return {Stream}
     */
    Stream.periodic = function (period) {
        return new Stream(new Periodic(period));
    };
    Stream.prototype._map = function (project) {
        return new (this.ctor())(new MapOp(project, this));
    };
    /**
     * Transforms each event from the input Stream through a `project` function,
     * to get a Stream that emits those transformed events.
     *
     * Marble diagram:
     *
     * ```text
     * --1---3--5-----7------
     *    map(i => i * 10)
     * --10--30-50----70-----
     * ```
     *
     * @param {Function} project A function of type `(t: T) => U` that takes event
     * `t` of type `T` from the input Stream and produces an event of type `U`, to
     * be emitted on the output Stream.
     * @return {Stream}
     */
    Stream.prototype.map = function (project) {
        return this._map(project);
    };
    /**
     * It's like `map`, but transforms each input event to always the same
     * constant value on the output Stream.
     *
     * Marble diagram:
     *
     * ```text
     * --1---3--5-----7-----
     *       mapTo(10)
     * --10--10-10----10----
     * ```
     *
     * @param projectedValue A value to emit on the output Stream whenever the
     * input Stream emits any value.
     * @return {Stream}
     */
    Stream.prototype.mapTo = function (projectedValue) {
        var s = this.map(function () { return projectedValue; });
        var op = s._prod;
        op.type = 'mapTo';
        return s;
    };
    /**
     * Only allows events that pass the test given by the `passes` argument.
     *
     * Each event from the input stream is given to the `passes` function. If the
     * function returns `true`, the event is forwarded to the output stream,
     * otherwise it is ignored and not forwarded.
     *
     * Marble diagram:
     *
     * ```text
     * --1---2--3-----4-----5---6--7-8--
     *     filter(i => i % 2 === 0)
     * ------2--------4---------6----8--
     * ```
     *
     * @param {Function} passes A function of type `(t: T) => boolean` that takes
     * an event from the input stream and checks if it passes, by returning a
     * boolean.
     * @return {Stream}
     */
    Stream.prototype.filter = function (passes) {
        var p = this._prod;
        if (p instanceof Filter)
            return new Stream(new Filter(and(p.f, passes), p.ins));
        return new Stream(new Filter(passes, this));
    };
    /**
     * Lets the first `amount` many events from the input stream pass to the
     * output stream, then makes the output stream complete.
     *
     * Marble diagram:
     *
     * ```text
     * --a---b--c----d---e--
     *    take(3)
     * --a---b--c|
     * ```
     *
     * @param {number} amount How many events to allow from the input stream
     * before completing the output stream.
     * @return {Stream}
     */
    Stream.prototype.take = function (amount) {
        return new (this.ctor())(new Take(amount, this));
    };
    /**
     * Ignores the first `amount` many events from the input stream, and then
     * after that starts forwarding events from the input stream to the output
     * stream.
     *
     * Marble diagram:
     *
     * ```text
     * --a---b--c----d---e--
     *       drop(3)
     * --------------d---e--
     * ```
     *
     * @param {number} amount How many events to ignore from the input stream
     * before forwarding all events from the input stream to the output stream.
     * @return {Stream}
     */
    Stream.prototype.drop = function (amount) {
        return new Stream(new Drop(amount, this));
    };
    /**
     * When the input stream completes, the output stream will emit the last event
     * emitted by the input stream, and then will also complete.
     *
     * Marble diagram:
     *
     * ```text
     * --a---b--c--d----|
     *       last()
     * -----------------d|
     * ```
     *
     * @return {Stream}
     */
    Stream.prototype.last = function () {
        return new Stream(new Last(this));
    };
    /**
     * Prepends the given `initial` value to the sequence of events emitted by the
     * input stream. The returned stream is a MemoryStream, which means it is
     * already `remember()`'d.
     *
     * Marble diagram:
     *
     * ```text
     * ---1---2-----3---
     *   startWith(0)
     * 0--1---2-----3---
     * ```
     *
     * @param initial The value or event to prepend.
     * @return {MemoryStream}
     */
    Stream.prototype.startWith = function (initial) {
        return new MemoryStream(new StartWith(this, initial));
    };
    /**
     * Uses another stream to determine when to complete the current stream.
     *
     * When the given `other` stream emits an event or completes, the output
     * stream will complete. Before that happens, the output stream will behaves
     * like the input stream.
     *
     * Marble diagram:
     *
     * ```text
     * ---1---2-----3--4----5----6---
     *   endWhen( --------a--b--| )
     * ---1---2-----3--4--|
     * ```
     *
     * @param other Some other stream that is used to know when should the output
     * stream of this operator complete.
     * @return {Stream}
     */
    Stream.prototype.endWhen = function (other) {
        return new (this.ctor())(new EndWhen(other, this));
    };
    /**
     * "Folds" the stream onto itself.
     *
     * Combines events from the past throughout
     * the entire execution of the input stream, allowing you to accumulate them
     * together. It's essentially like `Array.prototype.reduce`. The returned
     * stream is a MemoryStream, which means it is already `remember()`'d.
     *
     * The output stream starts by emitting the `seed` which you give as argument.
     * Then, when an event happens on the input stream, it is combined with that
     * seed value through the `accumulate` function, and the output value is
     * emitted on the output stream. `fold` remembers that output value as `acc`
     * ("accumulator"), and then when a new input event `t` happens, `acc` will be
     * combined with that to produce the new `acc` and so forth.
     *
     * Marble diagram:
     *
     * ```text
     * ------1-----1--2----1----1------
     *   fold((acc, x) => acc + x, 3)
     * 3-----4-----5--7----8----9------
     * ```
     *
     * @param {Function} accumulate A function of type `(acc: R, t: T) => R` that
     * takes the previous accumulated value `acc` and the incoming event from the
     * input stream and produces the new accumulated value.
     * @param seed The initial accumulated value, of type `R`.
     * @return {MemoryStream}
     */
    Stream.prototype.fold = function (accumulate, seed) {
        return new MemoryStream(new Fold(accumulate, seed, this));
    };
    /**
     * Replaces an error with another stream.
     *
     * When (and if) an error happens on the input stream, instead of forwarding
     * that error to the output stream, *replaceError* will call the `replace`
     * function which returns the stream that the output stream will replicate.
     * And, in case that new stream also emits an error, `replace` will be called
     * again to get another stream to start replicating.
     *
     * Marble diagram:
     *
     * ```text
     * --1---2-----3--4-----X
     *   replaceError( () => --10--| )
     * --1---2-----3--4--------10--|
     * ```
     *
     * @param {Function} replace A function of type `(err) => Stream` that takes
     * the error that occurred on the input stream or on the previous replacement
     * stream and returns a new stream. The output stream will behave like the
     * stream that this function returns.
     * @return {Stream}
     */
    Stream.prototype.replaceError = function (replace) {
        return new (this.ctor())(new ReplaceError(replace, this));
    };
    /**
     * Flattens a "stream of streams", handling only one nested stream at a time
     * (no concurrency).
     *
     * If the input stream is a stream that emits streams, then this operator will
     * return an output stream which is a flat stream: emits regular events. The
     * flattening happens without concurrency. It works like this: when the input
     * stream emits a nested stream, *flatten* will start imitating that nested
     * one. However, as soon as the next nested stream is emitted on the input
     * stream, *flatten* will forget the previous nested one it was imitating, and
     * will start imitating the new nested one.
     *
     * Marble diagram:
     *
     * ```text
     * --+--------+---------------
     *   \        \
     *    \       ----1----2---3--
     *    --a--b----c----d--------
     *           flatten
     * -----a--b------1----2---3--
     * ```
     *
     * @return {Stream}
     */
    Stream.prototype.flatten = function () {
        var p = this._prod;
        return new Stream(new Flatten(this));
    };
    /**
     * Passes the input stream to a custom operator, to produce an output stream.
     *
     * *compose* is a handy way of using an existing function in a chained style.
     * Instead of writing `outStream = f(inStream)` you can write
     * `outStream = inStream.compose(f)`.
     *
     * @param {function} operator A function that takes a stream as input and
     * returns a stream as well.
     * @return {Stream}
     */
    Stream.prototype.compose = function (operator) {
        return operator(this);
    };
    /**
     * Returns an output stream that behaves like the input stream, but also
     * remembers the most recent event that happens on the input stream, so that a
     * newly added listener will immediately receive that memorised event.
     *
     * @return {MemoryStream}
     */
    Stream.prototype.remember = function () {
        return new MemoryStream(new Remember(this));
    };
    /**
     * Returns an output stream that identically behaves like the input stream,
     * but also runs a `spy` function for each event, to help you debug your app.
     *
     * *debug* takes a `spy` function as argument, and runs that for each event
     * happening on the input stream. If you don't provide the `spy` argument,
     * then *debug* will just `console.log` each event. This helps you to
     * understand the flow of events through some operator chain.
     *
     * Please note that if the output stream has no listeners, then it will not
     * start, which means `spy` will never run because no actual event happens in
     * that case.
     *
     * Marble diagram:
     *
     * ```text
     * --1----2-----3-----4--
     *         debug
     * --1----2-----3-----4--
     * ```
     *
     * @param {function} labelOrSpy A string to use as the label when printing
     * debug information on the console, or a 'spy' function that takes an event
     * as argument, and does not need to return anything.
     * @return {Stream}
     */
    Stream.prototype.debug = function (labelOrSpy) {
        return new (this.ctor())(new Debug(this, labelOrSpy));
    };
    /**
     * *imitate* changes this current Stream to emit the same events that the
     * `other` given Stream does. This method returns nothing.
     *
     * This method exists to allow one thing: **circular dependency of streams**.
     * For instance, let's imagine that for some reason you need to create a
     * circular dependency where stream `first$` depends on stream `second$`
     * which in turn depends on `first$`:
     *
     * <!-- skip-example -->
     * ```js
     * import delay from 'xstream/extra/delay'
     *
     * var first$ = second$.map(x => x * 10).take(3);
     * var second$ = first$.map(x => x + 1).startWith(1).compose(delay(100));
     * ```
     *
     * However, that is invalid JavaScript, because `second$` is undefined
     * on the first line. This is how *imitate* can help solve it:
     *
     * ```js
     * import delay from 'xstream/extra/delay'
     *
     * var secondProxy$ = xs.create();
     * var first$ = secondProxy$.map(x => x * 10).take(3);
     * var second$ = first$.map(x => x + 1).startWith(1).compose(delay(100));
     * secondProxy$.imitate(second$);
     * ```
     *
     * We create `secondProxy$` before the others, so it can be used in the
     * declaration of `first$`. Then, after both `first$` and `second$` are
     * defined, we hook `secondProxy$` with `second$` with `imitate()` to tell
     * that they are "the same". `imitate` will not trigger the start of any
     * stream, it just binds `secondProxy$` and `second$` together.
     *
     * The following is an example where `imitate()` is important in Cycle.js
     * applications. A parent component contains some child components. A child
     * has an action stream which is given to the parent to define its state:
     *
     * <!-- skip-example -->
     * ```js
     * const childActionProxy$ = xs.create();
     * const parent = Parent({...sources, childAction$: childActionProxy$});
     * const childAction$ = parent.state$.map(s => s.child.action$).flatten();
     * childActionProxy$.imitate(childAction$);
     * ```
     *
     * Note, though, that **`imitate()` does not support MemoryStreams**. If we
     * would attempt to imitate a MemoryStream in a circular dependency, we would
     * either get a race condition (where the symptom would be "nothing happens")
     * or an infinite cyclic emission of values. It's useful to think about
     * MemoryStreams as cells in a spreadsheet. It doesn't make any sense to
     * define a spreadsheet cell `A1` with a formula that depends on `B1` and
     * cell `B1` defined with a formula that depends on `A1`.
     *
     * If you find yourself wanting to use `imitate()` with a
     * MemoryStream, you should rework your code around `imitate()` to use a
     * Stream instead. Look for the stream in the circular dependency that
     * represents an event stream, and that would be a candidate for creating a
     * proxy Stream which then imitates the target Stream.
     *
     * @param {Stream} target The other stream to imitate on the current one. Must
     * not be a MemoryStream.
     */
    Stream.prototype.imitate = function (target) {
        if (target instanceof MemoryStream)
            throw new Error('A MemoryStream was given to imitate(), but it only ' +
                'supports a Stream. Read more about this restriction here: ' +
                'https://github.com/staltz/xstream#faq');
        this._target = target;
        for (var ils = this._ils, N = ils.length, i = 0; i < N; i++)
            target._add(ils[i]);
        this._ils = [];
    };
    /**
     * Forces the Stream to emit the given value to its listeners.
     *
     * As the name indicates, if you use this, you are most likely doing something
     * The Wrong Way. Please try to understand the reactive way before using this
     * method. Use it only when you know what you are doing.
     *
     * @param value The "next" value you want to broadcast to all listeners of
     * this Stream.
     */
    Stream.prototype.shamefullySendNext = function (value) {
        this._n(value);
    };
    /**
     * Forces the Stream to emit the given error to its listeners.
     *
     * As the name indicates, if you use this, you are most likely doing something
     * The Wrong Way. Please try to understand the reactive way before using this
     * method. Use it only when you know what you are doing.
     *
     * @param {any} error The error you want to broadcast to all the listeners of
     * this Stream.
     */
    Stream.prototype.shamefullySendError = function (error) {
        this._e(error);
    };
    /**
     * Forces the Stream to emit the "completed" event to its listeners.
     *
     * As the name indicates, if you use this, you are most likely doing something
     * The Wrong Way. Please try to understand the reactive way before using this
     * method. Use it only when you know what you are doing.
     */
    Stream.prototype.shamefullySendComplete = function () {
        this._c();
    };
    /**
     * Adds a "debug" listener to the stream. There can only be one debug
     * listener, that's why this is 'setDebugListener'. To remove the debug
     * listener, just call setDebugListener(null).
     *
     * A debug listener is like any other listener. The only difference is that a
     * debug listener is "stealthy": its presence/absence does not trigger the
     * start/stop of the stream (or the producer inside the stream). This is
     * useful so you can inspect what is going on without changing the behavior
     * of the program. If you have an idle stream and you add a normal listener to
     * it, the stream will start executing. But if you set a debug listener on an
     * idle stream, it won't start executing (not until the first normal listener
     * is added).
     *
     * As the name indicates, we don't recommend using this method to build app
     * logic. In fact, in most cases the debug operator works just fine. Only use
     * this one if you know what you're doing.
     *
     * @param {Listener<T>} listener
     */
    Stream.prototype.setDebugListener = function (listener) {
        if (!listener) {
            this._d = false;
            this._dl = NO;
        }
        else {
            this._d = true;
            listener._n = listener.next || noop;
            listener._e = listener.error || noop;
            listener._c = listener.complete || noop;
            this._dl = listener;
        }
    };
    /**
     * Blends multiple streams together, emitting events from all of them
     * concurrently.
     *
     * *merge* takes multiple streams as arguments, and creates a stream that
     * behaves like each of the argument streams, in parallel.
     *
     * Marble diagram:
     *
     * ```text
     * --1----2-----3--------4---
     * ----a-----b----c---d------
     *            merge
     * --1-a--2--b--3-c---d--4---
     * ```
     *
     * @factory true
     * @param {Stream} stream1 A stream to merge together with other streams.
     * @param {Stream} stream2 A stream to merge together with other streams. Two
     * or more streams may be given as arguments.
     * @return {Stream}
     */
    Stream.merge = function merge() {
        var streams = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            streams[_i] = arguments[_i];
        }
        return new Stream(new Merge(streams));
    };
    /**
     * Combines multiple input streams together to return a stream whose events
     * are arrays that collect the latest events from each input stream.
     *
     * *combine* internally remembers the most recent event from each of the input
     * streams. When any of the input streams emits an event, that event together
     * with all the other saved events are combined into an array. That array will
     * be emitted on the output stream. It's essentially a way of joining together
     * the events from multiple streams.
     *
     * Marble diagram:
     *
     * ```text
     * --1----2-----3--------4---
     * ----a-----b-----c--d------
     *          combine
     * ----1a-2a-2b-3b-3c-3d-4d--
     * ```
     *
     * @factory true
     * @param {Stream} stream1 A stream to combine together with other streams.
     * @param {Stream} stream2 A stream to combine together with other streams.
     * Multiple streams, not just two, may be given as arguments.
     * @return {Stream}
     */
    Stream.combine = function combine() {
        var streams = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            streams[_i] = arguments[_i];
        }
        return new Stream(new Combine(streams));
    };
    return Stream;
}());
exports.Stream = Stream;
var MemoryStream = /** @class */ (function (_super) {
    __extends(MemoryStream, _super);
    function MemoryStream(producer) {
        var _this = _super.call(this, producer) || this;
        _this._has = false;
        return _this;
    }
    MemoryStream.prototype._n = function (x) {
        this._v = x;
        this._has = true;
        _super.prototype._n.call(this, x);
    };
    MemoryStream.prototype._add = function (il) {
        var ta = this._target;
        if (ta !== NO)
            return ta._add(il);
        var a = this._ils;
        a.push(il);
        if (a.length > 1) {
            if (this._has)
                il._n(this._v);
            return;
        }
        if (this._stopID !== NO) {
            if (this._has)
                il._n(this._v);
            clearTimeout(this._stopID);
            this._stopID = NO;
        }
        else if (this._has)
            il._n(this._v);
        else {
            var p = this._prod;
            if (p !== NO)
                p._start(this);
        }
    };
    MemoryStream.prototype._stopNow = function () {
        this._has = false;
        _super.prototype._stopNow.call(this);
    };
    MemoryStream.prototype._x = function () {
        this._has = false;
        _super.prototype._x.call(this);
    };
    MemoryStream.prototype.map = function (project) {
        return this._map(project);
    };
    MemoryStream.prototype.mapTo = function (projectedValue) {
        return _super.prototype.mapTo.call(this, projectedValue);
    };
    MemoryStream.prototype.take = function (amount) {
        return _super.prototype.take.call(this, amount);
    };
    MemoryStream.prototype.endWhen = function (other) {
        return _super.prototype.endWhen.call(this, other);
    };
    MemoryStream.prototype.replaceError = function (replace) {
        return _super.prototype.replaceError.call(this, replace);
    };
    MemoryStream.prototype.remember = function () {
        return this;
    };
    MemoryStream.prototype.debug = function (labelOrSpy) {
        return _super.prototype.debug.call(this, labelOrSpy);
    };
    return MemoryStream;
}(Stream));
exports.MemoryStream = MemoryStream;
var xs = Stream;
exports.default = xs;

},{"symbol-observable":15}],21:[function(require,module,exports){
'use strict';

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _delay = require('xstream/extra/delay');

var _delay2 = _interopRequireDefault(_delay);

var _run = require('@cycle/run');

var _action = require('@cycle-robot-drivers/action');

var _speech = require('@cycle-robot-drivers/speech');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function main(sources) {
  sources.proxies = { // will be connected to "targets"
    SpeechSynthesisAction: _xstream2.default.create(),
    SpeechRecognitionAction: _xstream2.default.create()
  };
  // create action components
  sources.SpeechSynthesisAction = (0, _speech.SpeechSynthesisAction)({
    goal: sources.proxies.SpeechSynthesisAction,
    SpeechSynthesis: sources.SpeechSynthesis
  });
  sources.SpeechRecognitionAction = (0, _speech.SpeechRecognitionAction)({
    goal: sources.proxies.SpeechRecognitionAction,
    SpeechRecognition: sources.SpeechRecognition
  });

  // main logic
  var synthGoal$ = _xstream2.default.of('Hello there!').compose((0, _delay2.default)(1000));
  var recogGoal$ = sources.SpeechSynthesisAction.result.mapTo({});

  sources.SpeechRecognitionAction.output.addListener({
    next: function next() {
      return console.log('Listening...');
    }
  });
  sources.SpeechRecognitionAction.result.addListener({
    next: function next(result) {
      if (result.status.status === 'SUCCEEDED') {
        console.log('Heard "' + result.result + '"');
      } else {
        console.log('I didn\'t hear anything.');
      }
    }
  });

  return {
    SpeechSynthesis: sources.SpeechSynthesisAction.output,
    SpeechRecognition: sources.SpeechRecognitionAction.output,
    targets: { // will be imitating "proxies"
      SpeechSynthesisAction: synthGoal$,
      SpeechRecognitionAction: recogGoal$
    }
  };
}

(0, _run.run)((0, _action.powerup)(main, function (proxy, target) {
  return proxy.imitate(target);
}), {
  SpeechSynthesis: (0, _speech.makeSpeechSynthesisDriver)(),
  SpeechRecognition: (0, _speech.makeSpeechRecognitionDriver)()
});

},{"@cycle-robot-drivers/action":1,"@cycle-robot-drivers/speech":6,"@cycle/run":11,"xstream":20,"xstream/extra/delay":18}]},{},[21])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdHlwZXMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvc3BlZWNoL2xpYi9janMvU3BlZWNoUmVjb2duaXRpb25BY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvc3BlZWNoL2xpYi9janMvU3BlZWNoU3ludGhlc2lzQWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL3NwZWVjaC9saWIvY2pzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL3NwZWVjaC9saWIvY2pzL21ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUtcm9ib3QtZHJpdmVycy9zcGVlY2gvbGliL2Nqcy9tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL3NwZWVjaC9ub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW50ZXJuYWxzLmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9xdWlja3Rhc2svaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9wb255ZmlsbC5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2RlbGF5LnRzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2Zyb21FdmVudC50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9pbmRleC50cyIsInNyYy9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25NQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0QkE7QUFD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QUFTLEVBQUc7QUFDViw2QkFBdUIsVUFEaEI7QUFFUCwrQkFBeUI7QUFGbEI7QUFISixHQUFQO0FBUUQ7O0FBRUQsY0FBSSxxQkFBUSxJQUFSLEVBQWMsVUFBQyxLQUFELEVBQVEsTUFBUjtBQUFBLFNBQW1CLE1BQU0sT0FBTixDQUFjLE1BQWQsQ0FBbkI7QUFBQSxDQUFkLENBQUosRUFBNkQ7QUFDM0QsbUJBQWlCLHdDQUQwQztBQUUzRCxxQkFBbUI7QUFGd0MsQ0FBN0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0eXBlc18xID0gcmVxdWlyZShcIi4vdHlwZXNcIik7XG5leHBvcnRzLlN0YXR1cyA9IHR5cGVzXzEuU3RhdHVzO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmV4cG9ydHMuZ2VuZXJhdGVHb2FsSUQgPSB1dGlsc18xLmdlbmVyYXRlR29hbElEO1xuZXhwb3J0cy5pbml0R29hbCA9IHV0aWxzXzEuaW5pdEdvYWw7XG5leHBvcnRzLmlzRXF1YWwgPSB1dGlsc18xLmlzRXF1YWw7XG5leHBvcnRzLmlzRXF1YWxHb2FsID0gdXRpbHNfMS5pc0VxdWFsR29hbDtcbmV4cG9ydHMuaXNFcXVhbFJlc3VsdCA9IHV0aWxzXzEuaXNFcXVhbFJlc3VsdDtcbmV4cG9ydHMucG93ZXJ1cCA9IHV0aWxzXzEucG93ZXJ1cDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFN0YXR1cztcbihmdW5jdGlvbiAoU3RhdHVzKSB7XG4gICAgU3RhdHVzW1wiQUNUSVZFXCJdID0gXCJBQ1RJVkVcIjtcbiAgICBTdGF0dXNbXCJQUkVFTVBURURcIl0gPSBcIlBSRUVNUFRFRFwiO1xuICAgIFN0YXR1c1tcIlNVQ0NFRURFRFwiXSA9IFwiU1VDQ0VFREVEXCI7XG4gICAgU3RhdHVzW1wiQUJPUlRFRFwiXSA9IFwiQUJPUlRFRFwiO1xufSkoU3RhdHVzID0gZXhwb3J0cy5TdGF0dXMgfHwgKGV4cG9ydHMuU3RhdHVzID0ge30pKTtcbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXR5cGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fcmVzdCA9ICh0aGlzICYmIHRoaXMuX19yZXN0KSB8fCBmdW5jdGlvbiAocywgZSkge1xuICAgIHZhciB0ID0ge307XG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXG4gICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDApXG4gICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcbiAgICByZXR1cm4gdDtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZW5lcmF0ZUdvYWxJRCgpIHtcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFtcDogbm93LFxuICAgICAgICBpZDogTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIpICsgXCItXCIgKyBub3cuZ2V0VGltZSgpLFxuICAgIH07XG59XG5leHBvcnRzLmdlbmVyYXRlR29hbElEID0gZ2VuZXJhdGVHb2FsSUQ7XG5mdW5jdGlvbiBpbml0R29hbChnb2FsLCBpc0dvYWwpIHtcbiAgICBpZiAoaXNHb2FsID09PSB2b2lkIDApIHsgaXNHb2FsID0gZnVuY3Rpb24gKGcpIHsgcmV0dXJuICEhZy5nb2FsX2lkOyB9OyB9XG4gICAgcmV0dXJuIGlzR29hbChnb2FsKSA/IGdvYWwgOiB7XG4gICAgICAgIGdvYWxfaWQ6IGdlbmVyYXRlR29hbElEKCksXG4gICAgICAgIGdvYWw6IGdvYWwsXG4gICAgfTtcbn1cbmV4cG9ydHMuaW5pdEdvYWwgPSBpbml0R29hbDtcbmZ1bmN0aW9uIGlzRXF1YWwoZmlyc3QsIHNlY29uZCkge1xuICAgIGlmICghZmlyc3QgfHwgIXNlY29uZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoZmlyc3Quc3RhbXAgPT09IHNlY29uZC5zdGFtcCAmJiBmaXJzdC5pZCA9PT0gc2Vjb25kLmlkKTtcbn1cbmV4cG9ydHMuaXNFcXVhbCA9IGlzRXF1YWw7XG5mdW5jdGlvbiBpc0VxdWFsR29hbChmaXJzdCwgc2Vjb25kKSB7XG4gICAgaWYgKCFmaXJzdCB8fCAhc2Vjb25kKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzRXF1YWwoZmlyc3QuZ29hbF9pZCwgc2Vjb25kLmdvYWxfaWQpO1xufVxuZXhwb3J0cy5pc0VxdWFsR29hbCA9IGlzRXF1YWxHb2FsO1xuZnVuY3Rpb24gaXNFcXVhbFJlc3VsdChmaXJzdCwgc2Vjb25kKSB7XG4gICAgaWYgKCFmaXJzdCB8fCAhc2Vjb25kKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIChpc0VxdWFsKGZpcnN0LnN0YXR1cy5nb2FsX2lkLCBzZWNvbmQuc3RhdHVzLmdvYWxfaWQpXG4gICAgICAgICYmIGZpcnN0LnN0YXR1cy5zdGF0dXMgPT09IHNlY29uZC5zdGF0dXMuc3RhdHVzKTtcbn1cbmV4cG9ydHMuaXNFcXVhbFJlc3VsdCA9IGlzRXF1YWxSZXN1bHQ7XG5mdW5jdGlvbiBwb3dlcnVwKG1haW4sIGNvbm5lY3QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHNpbmtzID0gbWFpbihzb3VyY2VzKTtcbiAgICAgICAgT2JqZWN0LmtleXMoc291cmNlcy5wcm94aWVzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgY29ubmVjdChzb3VyY2VzLnByb3hpZXNba2V5XSwgc2lua3MudGFyZ2V0c1trZXldKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciB0YXJnZXRzID0gc2lua3MudGFyZ2V0cywgc2lua3NXaXRob3V0VGFyZ2V0cyA9IF9fcmVzdChzaW5rcywgW1widGFyZ2V0c1wiXSk7XG4gICAgICAgIHJldHVybiBzaW5rc1dpdGhvdXRUYXJnZXRzO1xuICAgIH07XG59XG5leHBvcnRzLnBvd2VydXAgPSBwb3dlcnVwO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgYWN0aW9uXzEgPSByZXF1aXJlKFwiQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uXCIpO1xudmFyIFN0YXRlO1xuKGZ1bmN0aW9uIChTdGF0ZSkge1xuICAgIFN0YXRlW1wiUlVOTklOR1wiXSA9IFwiUlVOTklOR1wiO1xuICAgIFN0YXRlW1wiRE9ORVwiXSA9IFwiRE9ORVwiO1xuICAgIFN0YXRlW1wiUFJFRU1QVElOR1wiXSA9IFwiUFJFRU1QVElOR1wiO1xufSkoU3RhdGUgfHwgKFN0YXRlID0ge30pKTtcbnZhciBJbnB1dFR5cGU7XG4oZnVuY3Rpb24gKElucHV0VHlwZSkge1xuICAgIElucHV0VHlwZVtcIkdPQUxcIl0gPSBcIkdPQUxcIjtcbiAgICBJbnB1dFR5cGVbXCJDQU5DRUxcIl0gPSBcIkNBTkNFTFwiO1xuICAgIElucHV0VHlwZVtcIlNUQVJUXCJdID0gXCJTVEFSVFwiO1xuICAgIElucHV0VHlwZVtcIkVORFwiXSA9IFwiRU5EXCI7XG4gICAgSW5wdXRUeXBlW1wiRVJST1JcIl0gPSBcIkVSUk9SXCI7XG4gICAgSW5wdXRUeXBlW1wiUkVTVUxUXCJdID0gXCJSRVNVTFRcIjtcbn0pKElucHV0VHlwZSB8fCAoSW5wdXRUeXBlID0ge30pKTtcbjtcbmZ1bmN0aW9uIGlucHV0KGdvYWwkLCBzdGFydEV2ZW50JCwgZW5kRXZlbnQkLCBlcnJvckV2ZW50JCwgcmVzdWx0RXZlbnQkKSB7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGdvYWwkLmZpbHRlcihmdW5jdGlvbiAoZ29hbCkgeyByZXR1cm4gdHlwZW9mIGdvYWwgIT09ICd1bmRlZmluZWQnOyB9KS5tYXAoZnVuY3Rpb24gKGdvYWwpIHtcbiAgICAgICAgaWYgKGdvYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogSW5wdXRUeXBlLkNBTkNFTCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5HT0FMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAhIWdvYWwuZ29hbF9pZCA/IGdvYWwgOiBhY3Rpb25fMS5pbml0R29hbChnb2FsKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KSwgc3RhcnRFdmVudCQubWFwVG8oeyB0eXBlOiBJbnB1dFR5cGUuU1RBUlQsIHZhbHVlOiBudWxsIH0pLCBlbmRFdmVudCQubWFwVG8oeyB0eXBlOiBJbnB1dFR5cGUuRU5ELCB2YWx1ZTogbnVsbCB9KSwgZXJyb3JFdmVudCQubWFwKGZ1bmN0aW9uIChldmVudCkgeyByZXR1cm4gKHsgdHlwZTogSW5wdXRUeXBlLkVSUk9SLCB2YWx1ZTogZXZlbnQgfSk7IH0pLCByZXN1bHRFdmVudCQubWFwKGZ1bmN0aW9uIChldmVudCkgeyByZXR1cm4gKHsgdHlwZTogSW5wdXRUeXBlLlJFU1VMVCwgdmFsdWU6IGV2ZW50IH0pOyB9KSk7XG59XG52YXIgdHJhbnNpdGlvblRhYmxlID0gKF9hID0ge30sXG4gICAgX2FbU3RhdGUuRE9ORV0gPSAoX2IgPSB7fSxcbiAgICAgICAgX2JbSW5wdXRUeXBlLkdPQUxdID0gU3RhdGUuUlVOTklORyxcbiAgICAgICAgX2IpLFxuICAgIF9hW1N0YXRlLlJVTk5JTkddID0gKF9jID0ge30sXG4gICAgICAgIF9jW0lucHV0VHlwZS5HT0FMXSA9IFN0YXRlLlBSRUVNUFRJTkcsXG4gICAgICAgIF9jW0lucHV0VHlwZS5DQU5DRUxdID0gU3RhdGUuUFJFRU1QVElORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLlNUQVJUXSA9IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgIF9jW0lucHV0VHlwZS5FTkRdID0gU3RhdGUuRE9ORSxcbiAgICAgICAgX2MpLFxuICAgIF9hW1N0YXRlLlBSRUVNUFRJTkddID0gKF9kID0ge30sXG4gICAgICAgIF9kW0lucHV0VHlwZS5FTkRdID0gU3RhdGUuRE9ORSxcbiAgICAgICAgX2QpLFxuICAgIF9hKTtcbmZ1bmN0aW9uIHRyYW5zaXRpb24ocHJldlN0YXRlLCBwcmV2VmFyaWFibGVzLCBpbnB1dCkge1xuICAgIHZhciBzdGF0ZXMgPSB0cmFuc2l0aW9uVGFibGVbcHJldlN0YXRlXTtcbiAgICBpZiAoIXN0YXRlcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHByZXZTdGF0ZT1cXFwiXCIgKyBwcmV2U3RhdGUgKyBcIlxcXCJcIik7XG4gICAgfVxuICAgIHZhciBzdGF0ZSA9IHN0YXRlc1tpbnB1dC50eXBlXTtcbiAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJVbmRlZmluZWQgdHJhbnNpdGlvbiBmb3IgXFxcIlwiICsgcHJldlN0YXRlICsgXCJcXFwiIFxcXCJcIiArIGlucHV0LnR5cGUgKyBcIlxcXCI7IFwiXG4gICAgICAgICAgICArIFwic2V0IHN0YXRlIHRvIHByZXZTdGF0ZVwiKTtcbiAgICAgICAgc3RhdGUgPSBwcmV2U3RhdGU7XG4gICAgfVxuICAgIGlmIChwcmV2U3RhdGUgPT09IFN0YXRlLkRPTkUgJiYgc3RhdGUgPT09IFN0YXRlLlJVTk5JTkcpIHtcbiAgICAgICAgLy8gU3RhcnQgYSBuZXcgZ29hbFxuICAgICAgICB2YXIgZ29hbCA9IGlucHV0LnZhbHVlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogZ29hbC5nb2FsX2lkLFxuICAgICAgICAgICAgICAgIHRyYW5zY3JpcHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgYXJnczogZ29hbC5nb2FsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmIChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgJiYgc3RhdGUgPT09IFN0YXRlLlJVTk5JTkcpIHtcbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5SRVNVTFQpIHtcbiAgICAgICAgICAgIHZhciBldmVudF8xID0gaW5wdXQudmFsdWU7XG4gICAgICAgICAgICB2YXIgbGFzdCA9IGV2ZW50XzEucmVzdWx0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgdmFyIHRyYW5zY3JpcHQgPSBldmVudF8xLnJlc3VsdHNbbGFzdF1bMF0udHJhbnNjcmlwdDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogX19hc3NpZ24oe30sIHByZXZWYXJpYWJsZXMsIHsgdHJhbnNjcmlwdDogdHJhbnNjcmlwdCB9KSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkVSUk9SKSB7XG4gICAgICAgICAgICB2YXIgZXZlbnRfMiA9IGlucHV0LnZhbHVlO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBfX2Fzc2lnbih7fSwgcHJldlZhcmlhYmxlcywgeyBlcnJvcjogZXZlbnRfMi5lcnJvciB9KSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoc3RhdGUgPT09IFN0YXRlLkRPTkUpIHtcbiAgICAgICAgaWYgKHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyB8fCBwcmV2U3RhdGUgPT09IFN0YXRlLlBSRUVNUFRJTkcpIHtcbiAgICAgICAgICAgIC8vIFN0b3AgdGhlIGN1cnJlbnQgZ29hbCBhbmQgc3RhcnQgdGhlIHF1ZXVlZCBuZXcgZ29hbFxuICAgICAgICAgICAgdmFyIG5ld0dvYWwgPSBwcmV2VmFyaWFibGVzLm5ld0dvYWw7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiAhIW5ld0dvYWwgPyBTdGF0ZS5SVU5OSU5HIDogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6ICEhbmV3R29hbCA/IG5ld0dvYWwuZ29hbF9pZCA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIHRyYW5zY3JpcHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czogISFuZXdHb2FsID8ge1xuICAgICAgICAgICAgICAgICAgICBhcmdzOiBuZXdHb2FsLmdvYWwsXG4gICAgICAgICAgICAgICAgfSA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldlZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiAocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HICYmICFwcmV2VmFyaWFibGVzLmVycm9yKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogKCEhcHJldlZhcmlhYmxlcy5lcnJvcikgPyBhY3Rpb25fMS5TdGF0dXMuQUJPUlRFRCA6IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogKHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyAmJiAhcHJldlZhcmlhYmxlcy5lcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgID8gKHByZXZWYXJpYWJsZXMudHJhbnNjcmlwdCB8fCAnJykgLy8gJycgZm9yIG5vbi1zcGVlY2ggaW5wdXRzXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoKHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyB8fCBwcmV2U3RhdGUgPT09IFN0YXRlLlBSRUVNUFRJTkcpXG4gICAgICAgICYmIHN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKSB7XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuR09BTCB8fCBpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuQ0FOQ0VMKSB7XG4gICAgICAgICAgICAvLyBTdGFydCBzdG9wcGluZyB0aGUgY3VycmVudCBnb2FsIGFuZCBxdWV1ZSBhIG5ldyBnb2FsIGlmIHJlY2VpdmVkIG9uZVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBfX2Fzc2lnbih7fSwgcHJldlZhcmlhYmxlcywgeyBuZXdHb2FsOiBpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuR09BTCA/IGlucHV0LnZhbHVlIDogbnVsbCB9KSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiBwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgPyB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IG51bGwsXG4gICAgICAgICAgICAgICAgfSA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBzdGF0ZTogcHJldlN0YXRlLFxuICAgICAgICB2YXJpYWJsZXM6IHByZXZWYXJpYWJsZXMsXG4gICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICB9O1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvblJlZHVjZXIoaW5wdXQkKSB7XG4gICAgdmFyIGluaXRSZWR1Y2VyJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGZ1bmN0aW9uIGluaXRSZWR1Y2VyKHByZXYpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5ET05FLFxuICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogbnVsbCxcbiAgICAgICAgICAgICAgICB0cmFuc2NyaXB0OiBudWxsLFxuICAgICAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICB2YXIgaW5wdXRSZWR1Y2VyJCA9IGlucHV0JFxuICAgICAgICAubWFwKGZ1bmN0aW9uIChpbnB1dCkgeyByZXR1cm4gZnVuY3Rpb24gaW5wdXRSZWR1Y2VyKHByZXYpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24ocHJldi5zdGF0ZSwgcHJldi52YXJpYWJsZXMsIGlucHV0KTtcbiAgICB9OyB9KTtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoaW5pdFJlZHVjZXIkLCBpbnB1dFJlZHVjZXIkKTtcbn1cbi8qKlxuICogV2ViIFNwZWVjaCBBUEkncyBbU3BlZWNoUmVjb2duaXRpb25dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hSZWNvZ25pdGlvbilcbiAqIGFjdGlvbiBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHNvdXJjZXNcbiAqXG4gKiAgICogZ29hbDogYSBzdHJlYW0gb2YgYG51bGxgIChhcyBcImNhbmNlbFwiKSBvciBgU3BlZWNoUmVjb2duaXRpb25gXG4gKiAgICAgcHJvcGVydGllcyAoYXMgXCJnb2FsXCIpLlxuICogICAqIFNwZWVjaFN5bnRoZXNpczogYEV2ZW50U291cmNlYCBmb3IgYHN0YXJ0YCwgYGVuZGAsIGBlcnJvcmAsIGByZXN1bHRgXG4gKiAgICAgZXZlbnRzLlxuICpcbiAqIEByZXR1cm4gc2lua3NcbiAqXG4gKiAgICogb3V0cHV0OiBhIHN0cmVhbSBmb3IgdGhlIFNwZWVjaFJlY29nbml0aW9uIGRyaXZlciBpbnB1dC5cbiAqICAgKiByZXN1bHQ6IGEgc3RyZWFtIG9mIGFjdGlvbiByZXN1bHRzLiBgcmVzdWx0LnJlc3VsdGAgaXMgYSB0cmFuc2NyaXB0IGZyb21cbiAqICAgICB0aGUgcmVjb2duaXRpb247IGl0IHdpbGwgYmUgYCcnYCBmb3Igbm9uLXNwZWVjaCBpbnB1dHMuXG4gKlxuICovXG5mdW5jdGlvbiBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbihzb3VyY2VzKSB7XG4gICAgdmFyIGlucHV0JCA9IGlucHV0KHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuZ29hbCksIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb24uZXZlbnRzKCdzdGFydCcpKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5TcGVlY2hSZWNvZ25pdGlvbi5ldmVudHMoJ2VuZCcpKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5TcGVlY2hSZWNvZ25pdGlvbi5ldmVudHMoJ2Vycm9yJykpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uLmV2ZW50cygncmVzdWx0JykpKTtcbiAgICB2YXIgc3RhdGUkID0gdHJhbnNpdGlvblJlZHVjZXIoaW5wdXQkKVxuICAgICAgICAuZm9sZChmdW5jdGlvbiAoc3RhdGUsIHJlZHVjZXIpIHsgcmV0dXJuIHJlZHVjZXIoc3RhdGUpOyB9LCBudWxsKVxuICAgICAgICAuZHJvcCgxKTsgLy8gZHJvcCBcIm51bGxcIlxuICAgIHZhciBvdXRwdXRzJCA9IHN0YXRlJC5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiBzdGF0ZS5vdXRwdXRzOyB9KVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiAhIW91dHB1dHM7IH0pO1xuICAgIHZhciByZXN1bHQkID0gc3RhdGUkLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuIHN0YXRlLnJlc3VsdDsgfSkuZmlsdGVyKGZ1bmN0aW9uIChyZXN1bHQpIHsgcmV0dXJuICEhcmVzdWx0OyB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBvdXRwdXQ6IGFkYXB0XzEuYWRhcHQob3V0cHV0cyQubWFwKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiBvdXRwdXRzLmFyZ3M7IH0pKSxcbiAgICAgICAgcmVzdWx0OiBhZGFwdF8xLmFkYXB0KHJlc3VsdCQpLFxuICAgIH07XG59XG5leHBvcnRzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uID0gU3BlZWNoUmVjb2duaXRpb25BY3Rpb247XG52YXIgX2EsIF9iLCBfYywgX2Q7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbVwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBhY3Rpb25fMSA9IHJlcXVpcmUoXCJAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb25cIik7XG52YXIgU3RhdGU7XG4oZnVuY3Rpb24gKFN0YXRlKSB7XG4gICAgU3RhdGVbXCJSVU5OSU5HXCJdID0gXCJSVU5OSU5HXCI7XG4gICAgU3RhdGVbXCJET05FXCJdID0gXCJET05FXCI7XG4gICAgU3RhdGVbXCJQUkVFTVBUSU5HXCJdID0gXCJQUkVFTVBUSU5HXCI7XG59KShTdGF0ZSB8fCAoU3RhdGUgPSB7fSkpO1xudmFyIElucHV0VHlwZTtcbihmdW5jdGlvbiAoSW5wdXRUeXBlKSB7XG4gICAgSW5wdXRUeXBlW1wiR09BTFwiXSA9IFwiR09BTFwiO1xuICAgIElucHV0VHlwZVtcIkNBTkNFTFwiXSA9IFwiQ0FOQ0VMXCI7XG4gICAgSW5wdXRUeXBlW1wiU1RBUlRcIl0gPSBcIlNUQVJUXCI7XG4gICAgSW5wdXRUeXBlW1wiRU5EXCJdID0gXCJFTkRcIjtcbn0pKElucHV0VHlwZSB8fCAoSW5wdXRUeXBlID0ge30pKTtcbjtcbmZ1bmN0aW9uIGlucHV0KGdvYWwkLCBzdGFydEV2ZW50JCwgZW5kRXZlbnQkKSB7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGdvYWwkLmZpbHRlcihmdW5jdGlvbiAoZ29hbCkgeyByZXR1cm4gdHlwZW9mIGdvYWwgIT09ICd1bmRlZmluZWQnOyB9KS5tYXAoZnVuY3Rpb24gKGdvYWwpIHtcbiAgICAgICAgaWYgKGdvYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogSW5wdXRUeXBlLkNBTkNFTCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSAhIWdvYWwuZ29hbF9pZCA/IGdvYWwgOiBhY3Rpb25fMS5pbml0R29hbChnb2FsKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogSW5wdXRUeXBlLkdPQUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHR5cGVvZiB2YWx1ZS5nb2FsID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiB7IHRleHQ6IHZhbHVlLmdvYWwgfSxcbiAgICAgICAgICAgICAgICAgICAgfSA6IHZhbHVlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pLCBzdGFydEV2ZW50JC5tYXBUbyh7IHR5cGU6IElucHV0VHlwZS5TVEFSVCwgdmFsdWU6IG51bGwgfSksIGVuZEV2ZW50JC5tYXBUbyh7IHR5cGU6IElucHV0VHlwZS5FTkQsIHZhbHVlOiBudWxsIH0pKTtcbn1cbnZhciB0cmFuc2l0aW9uVGFibGUgPSAoX2EgPSB7fSxcbiAgICBfYVtTdGF0ZS5ET05FXSA9IChfYiA9IHt9LFxuICAgICAgICBfYltJbnB1dFR5cGUuR09BTF0gPSBTdGF0ZS5SVU5OSU5HLFxuICAgICAgICBfYiksXG4gICAgX2FbU3RhdGUuUlVOTklOR10gPSAoX2MgPSB7fSxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkdPQUxdID0gU3RhdGUuUFJFRU1QVElORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkNBTkNFTF0gPSBTdGF0ZS5QUkVFTVBUSU5HLFxuICAgICAgICBfY1tJbnB1dFR5cGUuU1RBUlRdID0gU3RhdGUuUlVOTklORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkVORF0gPSBTdGF0ZS5ET05FLFxuICAgICAgICBfYyksXG4gICAgX2FbU3RhdGUuUFJFRU1QVElOR10gPSAoX2QgPSB7fSxcbiAgICAgICAgX2RbSW5wdXRUeXBlLkVORF0gPSBTdGF0ZS5ET05FLFxuICAgICAgICBfZCksXG4gICAgX2EpO1xuZnVuY3Rpb24gdHJhbnNpdGlvbihwcmV2U3RhdGUsIHByZXZWYXJpYWJsZXMsIGlucHV0KSB7XG4gICAgdmFyIHN0YXRlcyA9IHRyYW5zaXRpb25UYWJsZVtwcmV2U3RhdGVdO1xuICAgIGlmICghc3RhdGVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcHJldlN0YXRlPVxcXCJcIiArIHByZXZTdGF0ZSArIFwiXFxcIlwiKTtcbiAgICB9XG4gICAgdmFyIHN0YXRlID0gc3RhdGVzW2lucHV0LnR5cGVdO1xuICAgIGlmICghc3RhdGUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlVuZGVmaW5lZCB0cmFuc2l0aW9uIGZvciBcXFwiXCIgKyBwcmV2U3RhdGUgKyBcIlxcXCIgXFxcIlwiICsgaW5wdXQudHlwZSArIFwiXFxcIjsgXCJcbiAgICAgICAgICAgICsgXCJzZXQgc3RhdGUgdG8gcHJldlN0YXRlXCIpO1xuICAgICAgICBzdGF0ZSA9IHByZXZTdGF0ZTtcbiAgICB9XG4gICAgaWYgKHByZXZTdGF0ZSA9PT0gU3RhdGUuRE9ORSAmJiBzdGF0ZSA9PT0gU3RhdGUuUlVOTklORykge1xuICAgICAgICAvLyBTdGFydCBhIG5ldyBnb2FsXG4gICAgICAgIHZhciBnb2FsID0gaW5wdXQudmFsdWU7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBnb2FsLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgYXJnczogZ29hbC5nb2FsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmIChzdGF0ZSA9PT0gU3RhdGUuRE9ORSkge1xuICAgICAgICBpZiAocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HIHx8IHByZXZTdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORykge1xuICAgICAgICAgICAgLy8gU3RvcCB0aGUgY3VycmVudCBnb2FsIGFuZCBzdGFydCB0aGUgcXVldWVkIG5ldyBnb2FsXG4gICAgICAgICAgICB2YXIgbmV3R29hbCA9IHByZXZWYXJpYWJsZXMubmV3R29hbDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6ICEhbmV3R29hbCA/IFN0YXRlLlJVTk5JTkcgOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogISFuZXdHb2FsID8gbmV3R29hbC5nb2FsX2lkIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG91dHB1dHM6ICEhbmV3R29hbCA/IHtcbiAgICAgICAgICAgICAgICAgICAgYXJnczogbmV3R29hbC5nb2FsLFxuICAgICAgICAgICAgICAgIH0gOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHByZXZWYXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogcHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVEIDogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgfHwgcHJldlN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKVxuICAgICAgICAmJiBzdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORykge1xuICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkdPQUwgfHwgaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkNBTkNFTCkge1xuICAgICAgICAgICAgLy8gU3RhcnQgc3RvcHBpbmcgdGhlIGN1cnJlbnQgZ29hbCBhbmQgcXVldWUgYSBuZXcgZ29hbCBpZiByZWNlaXZlZCBvbmVcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogX19hc3NpZ24oe30sIHByZXZWYXJpYWJsZXMsIHsgbmV3R29hbDogaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkdPQUwgPyBpbnB1dC52YWx1ZSA6IG51bGwgfSksXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBhcmdzOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLlNUQVJUKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHByZXZWYXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBhcmdzOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBzdGF0ZTogcHJldlN0YXRlLFxuICAgICAgICB2YXJpYWJsZXM6IHByZXZWYXJpYWJsZXMsXG4gICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICB9O1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvblJlZHVjZXIoaW5wdXQkKSB7XG4gICAgdmFyIGluaXRSZWR1Y2VyJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGZ1bmN0aW9uIGluaXRSZWR1Y2VyKHByZXYpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5ET05FLFxuICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogbnVsbCxcbiAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIGlucHV0UmVkdWNlciQgPSBpbnB1dCRcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoaW5wdXQpIHsgcmV0dXJuIGZ1bmN0aW9uIGlucHV0UmVkdWNlcihwcmV2KSB7XG4gICAgICAgIHJldHVybiB0cmFuc2l0aW9uKHByZXYuc3RhdGUsIHByZXYudmFyaWFibGVzLCBpbnB1dCk7XG4gICAgfTsgfSk7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGluaXRSZWR1Y2VyJCwgaW5wdXRSZWR1Y2VyJCk7XG59XG4vKipcbiAqIFdlYiBTcGVlY2ggQVBJJ3MgW1NwZWVjaFN5bnRoZXNpc10oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFN5bnRoZXNpcylcbiAqIGFjdGlvbiBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHNvdXJjZXNcbiAqXG4gKiAgICogZ29hbDogYSBzdHJlYW0gb2YgYG51bGxgIChhcyBcImNhbmNlbFwiKSBvciBgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlYFxuICogICAgIHByb3BlcnRpZXMgKGFzIFwiZ29hbFwiKS5cbiAqICAgKiBTcGVlY2hTeW50aGVzaXM6IGBFdmVudFNvdXJjZWAgZm9yIGBzdGFydGAgYW5kIGBlbmRgIGV2ZW50cy5cbiAqXG4gKiBAcmV0dXJuIHNpbmtzXG4gKlxuICogICAqIG91dHB1dDogYSBzdHJlYW0gZm9yIHRoZSBTcGVlY2hTeW50aGVzaXMgZHJpdmVyIGlucHV0LlxuICogICAqIHJlc3VsdDogYSBzdHJlYW0gb2YgYWN0aW9uIHJlc3VsdHMuIGByZXN1bHQucmVzdWx0YCBpcyBhbHdheXMgYG51bGxgLlxuICpcbiAqL1xuZnVuY3Rpb24gU3BlZWNoU3ludGhlc2lzQWN0aW9uKHNvdXJjZXMpIHtcbiAgICB2YXIgaW5wdXQkID0gaW5wdXQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5nb2FsKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5TcGVlY2hTeW50aGVzaXMuZXZlbnRzKCdzdGFydCcpKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5TcGVlY2hTeW50aGVzaXMuZXZlbnRzKCdlbmQnKSkpO1xuICAgIHZhciBzdGF0ZSQgPSB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpXG4gICAgICAgIC5mb2xkKGZ1bmN0aW9uIChzdGF0ZSwgcmVkdWNlcikgeyByZXR1cm4gcmVkdWNlcihzdGF0ZSk7IH0sIG51bGwpXG4gICAgICAgIC5kcm9wKDEpOyAvLyBkcm9wIFwibnVsbFwiXG4gICAgdmFyIG91dHB1dHMkID0gc3RhdGUkLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuIHN0YXRlLm91dHB1dHM7IH0pXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuICEhb3V0cHV0czsgfSk7XG4gICAgdmFyIHJlc3VsdCQgPSBzdGF0ZSQubWFwKGZ1bmN0aW9uIChzdGF0ZSkgeyByZXR1cm4gc3RhdGUucmVzdWx0OyB9KS5maWx0ZXIoZnVuY3Rpb24gKHJlc3VsdCkgeyByZXR1cm4gISFyZXN1bHQ7IH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIG91dHB1dDogYWRhcHRfMS5hZGFwdChvdXRwdXRzJC5tYXAoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIG91dHB1dHMuYXJnczsgfSkpLFxuICAgICAgICByZXN1bHQ6IGFkYXB0XzEuYWRhcHQocmVzdWx0JCksXG4gICAgfTtcbn1cbmV4cG9ydHMuU3BlZWNoU3ludGhlc2lzQWN0aW9uID0gU3BlZWNoU3ludGhlc2lzQWN0aW9uO1xudmFyIF9hLCBfYiwgX2MsIF9kO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3BlZWNoU3ludGhlc2lzQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXJfMSA9IHJlcXVpcmUoXCIuL21ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXJcIik7XG5leHBvcnRzLm1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIgPSBtYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyXzEubWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlcjtcbnZhciBTcGVlY2hTeW50aGVzaXNBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1NwZWVjaFN5bnRoZXNpc0FjdGlvblwiKTtcbmV4cG9ydHMuU3BlZWNoU3ludGhlc2lzQWN0aW9uID0gU3BlZWNoU3ludGhlc2lzQWN0aW9uXzEuU3BlZWNoU3ludGhlc2lzQWN0aW9uO1xudmFyIG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcl8xID0gcmVxdWlyZShcIi4vbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyXCIpO1xuZXhwb3J0cy5tYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXIgPSBtYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXJfMS5tYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXI7XG52YXIgU3BlZWNoUmVjb2duaXRpb25BY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1NwZWVjaFJlY29nbml0aW9uQWN0aW9uXCIpO1xuZXhwb3J0cy5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbiA9IFNwZWVjaFJlY29nbml0aW9uQWN0aW9uXzEuU3BlZWNoUmVjb2duaXRpb25BY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBmcm9tRXZlbnRfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbS9leHRyYS9mcm9tRXZlbnRcIikpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgUmVjb2duaXRpb25Tb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVjb2duaXRpb25Tb3VyY2UoX3JlY29nbml0aW9uKSB7XG4gICAgICAgIHRoaXMuX3JlY29nbml0aW9uID0gX3JlY29nbml0aW9uO1xuICAgIH1cbiAgICBSZWNvZ25pdGlvblNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdChmcm9tRXZlbnRfMS5kZWZhdWx0KHRoaXMuX3JlY29nbml0aW9uLCBldmVudE5hbWUpKTtcbiAgICB9O1xuICAgIHJldHVybiBSZWNvZ25pdGlvblNvdXJjZTtcbn0oKSk7XG4vKipcbiAqIFdlYiBTcGVlY2ggQVBJJ3MgW1NwZWVjaFJlY29nbml0aW9uXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoUmVjb2duaXRpb24pXG4gKiBkcml2ZXIgZmFjdG9yeS5cbiAqXG4gKiBAcmV0dXJuIHtEcml2ZXJ9IHRoZSBTcGVlY2hSZWNvZ25pdGlvbiBDeWNsZS5qcyBkcml2ZXIgZnVuY3Rpb24uIEl0IHRha2VzIGFcbiAqICAgc3RyZWFtIG9mIG9iamVjdHMgY29udGFpbmluZyBbYFNwZWVjaFJlY29nbml0aW9uYCBwcm9wZXJ0aWVzXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoUmVjb2duaXRpb24jUHJvcGVydGllcylcbiAqICAgYW5kIHJldHVybnMgYSBgRXZlbnRTb3VyY2VgOlxuICpcbiAqICAgKiBgRXZlbnRTb3VyY2UuZXZlbnRzKGV2ZW50TmFtZSlgIHJldHVybnMgYSBzdHJlYW0gb2YgYGV2ZW50TmFtZWBcbiAqICAgICBldmVudHMgZnJvbSBbYFNwZWVjaFJlY29nbml0aW9uYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFJlY29nbml0aW9uI0V2ZW50X2hhbmRsZXJzKS5cbiAqL1xuZnVuY3Rpb24gbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyKCkge1xuICAgIHZhciByZWNvZ25pdGlvbiA9IG5ldyB3ZWJraXRTcGVlY2hSZWNvZ25pdGlvbigpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoc2luayQpIHtcbiAgICAgICAgc2luayQuYWRkTGlzdGVuZXIoe1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAvLyBhcnJheSB2YWx1ZXMgYXJlIFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSBwcm9wZXJ0aWVzIHRoYXQgYXJlIG5vdFxuICAgICAgICAgICAgICAgIC8vICAgZXZlbnQgaGFuZGxlcnM7IHNlZVxuICAgICAgICAgICAgICAgIC8vICAgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFJlY29nbml0aW9uXG4gICAgICAgICAgICAgICAgaWYgKCFhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlY29nbml0aW9uLmFib3J0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBbJ2xhbmcnLCAnY29udGludW91cycsICdpbnRlcmltUmVzdWx0cycsICdtYXhBbHRlcm5hdGl2ZXMnLCAnc2VydmljZVVSSSddLm1hcChmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJnIGluIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNvZ25pdGlvblthcmddID0gYXJnc1thcmddO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmVjb2duaXRpb24uc3RhcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmV3IFJlY29nbml0aW9uU291cmNlKHJlY29nbml0aW9uKTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXIgPSBtYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgZnJvbUV2ZW50XzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW0vZXh0cmEvZnJvbUV2ZW50XCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIFV0dGVyYW5jZVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBVdHRlcmFuY2VTb3VyY2UoX3V0dGVyYW5jZSkge1xuICAgICAgICB0aGlzLl91dHRlcmFuY2UgPSBfdXR0ZXJhbmNlO1xuICAgIH1cbiAgICBVdHRlcmFuY2VTb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGFkYXB0XzEuYWRhcHQoZnJvbUV2ZW50XzEuZGVmYXVsdCh0aGlzLl91dHRlcmFuY2UsIGV2ZW50TmFtZSkpO1xuICAgIH07XG4gICAgcmV0dXJuIFV0dGVyYW5jZVNvdXJjZTtcbn0oKSk7XG4vKipcbiAqIFdlYiBTcGVlY2ggQVBJJ3MgW1NwZWVjaFN5bnRoZXNpc10oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFN5bnRoZXNpcylcbiAqIGRyaXZlciBmYWN0b3J5LlxuICpcbiAqIEByZXR1cm4ge0RyaXZlcn0gdGhlIFNwZWVjaFN5bnRoZXNpcyBDeWNsZS5qcyBkcml2ZXIgZnVuY3Rpb24uIEl0IHRha2VzIGFcbiAqICAgc3RyZWFtIG9mIG9iamVjdHMgY29udGFpbmluZyBbYFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZWAgcHJvcGVydGllc10oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSNQcm9wZXJ0aWVzKVxuICogICBhbmQgcmV0dXJucyBhIGBFdmVudFNvdXJjZWA6XG4gKlxuICogICAqIGBFdmVudFNvdXJjZS5ldmVudHMoZXZlbnROYW1lKWAgcmV0dXJucyBhIHN0cmVhbSBvZiAgYGV2ZW50TmFtZWBcbiAqICAgICBldmVudHMgZnJvbSBbYFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZWBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UjRXZlbnRfaGFuZGxlcnMpLlxuICovXG5mdW5jdGlvbiBtYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyKCkge1xuICAgIHZhciBzeW50aGVzaXMgPSB3aW5kb3cuc3BlZWNoU3ludGhlc2lzO1xuICAgIHZhciB1dHRlcmFuY2UgPSBuZXcgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzaW5rJCkge1xuICAgICAgICBzaW5rJC5hZGRMaXN0ZW5lcih7XG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgIC8vIGFycmF5IHZhbHVlcyBhcmUgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlIHByb3BlcnRpZXMgdGhhdCBhcmUgbm90XG4gICAgICAgICAgICAgICAgLy8gICBldmVudCBoYW5kbGVyczsgc2VlXG4gICAgICAgICAgICAgICAgLy8gICBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlXG4gICAgICAgICAgICAgICAgaWYgKCFhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN5bnRoZXNpcy5jYW5jZWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFsnbGFuZycsICdwaXRjaCcsICdyYXRlJywgJ3RleHQnLCAndm9pY2UnLCAndm9sdW1lJ10ubWFwKGZ1bmN0aW9uIChhcmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmcgaW4gYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHV0dGVyYW5jZVthcmddID0gYXJnc1thcmddO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc3ludGhlc2lzLnNwZWFrKHV0dGVyYW5jZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBVdHRlcmFuY2VTb3VyY2UodXR0ZXJhbmNlKTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyID0gbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICB2YXIgZ2xvYmFsT2JqO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IGdsb2JhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHRoaXM7XG4gICAgfVxuICAgIGdsb2JhbE9iai5DeWNsZWpzID0gZ2xvYmFsT2JqLkN5Y2xlanMgfHwge307XG4gICAgZ2xvYmFsT2JqID0gZ2xvYmFsT2JqLkN5Y2xlanM7XG4gICAgZ2xvYmFsT2JqLmFkYXB0U3RyZWFtID0gZ2xvYmFsT2JqLmFkYXB0U3RyZWFtIHx8IChmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XG4gICAgcmV0dXJuIGdsb2JhbE9iajtcbn1cbmZ1bmN0aW9uIHNldEFkYXB0KGYpIHtcbiAgICBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbSA9IGY7XG59XG5leHBvcnRzLnNldEFkYXB0ID0gc2V0QWRhcHQ7XG5mdW5jdGlvbiBhZGFwdChzdHJlYW0pIHtcbiAgICByZXR1cm4gZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0oc3RyZWFtKTtcbn1cbmV4cG9ydHMuYWRhcHQgPSBhZGFwdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFkYXB0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGludGVybmFsc18xID0gcmVxdWlyZShcIi4vaW50ZXJuYWxzXCIpO1xuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgcHJlcGFyZXMgdGhlIEN5Y2xlIGFwcGxpY2F0aW9uIHRvIGJlIGV4ZWN1dGVkLiBUYWtlcyBhIGBtYWluYFxuICogZnVuY3Rpb24gYW5kIHByZXBhcmVzIHRvIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb24gb2ZcbiAqIGRyaXZlciBmdW5jdGlvbnMuIEFzIGFuIG91dHB1dCwgYHNldHVwKClgIHJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhyZWVcbiAqIHByb3BlcnRpZXM6IGBzb3VyY2VzYCwgYHNpbmtzYCBhbmQgYHJ1bmAuIE9ubHkgd2hlbiBgcnVuKClgIGlzIGNhbGxlZCB3aWxsXG4gKiB0aGUgYXBwbGljYXRpb24gYWN0dWFsbHkgZXhlY3V0ZS4gUmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgYHJ1bigpYCBmb3JcbiAqIG1vcmUgZGV0YWlscy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQge3NldHVwfSBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IHtzb3VyY2VzLCBzaW5rcywgcnVufSA9IHNldHVwKG1haW4sIGRyaXZlcnMpO1xuICogLy8gLi4uXG4gKiBjb25zdCBkaXNwb3NlID0gcnVuKCk7IC8vIEV4ZWN1dGVzIHRoZSBhcHBsaWNhdGlvblxuICogLy8gLi4uXG4gKiBkaXNwb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCB0aHJlZSBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kXG4gKiBgcnVuYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgc2lua3NgIGlzIHRoZVxuICogY29sbGVjdGlvbiBvZiBkcml2ZXIgc2lua3MsIHRoZXNlIGNhbiBiZSB1c2VkIGZvciBkZWJ1Z2dpbmcgb3IgdGVzdGluZy4gYHJ1bmBcbiAqIGlzIHRoZSBmdW5jdGlvbiB0aGF0IG9uY2UgY2FsbGVkIHdpbGwgZXhlY3V0ZSB0aGUgYXBwbGljYXRpb24uXG4gKiBAZnVuY3Rpb24gc2V0dXBcbiAqL1xuZnVuY3Rpb24gc2V0dXAobWFpbiwgZHJpdmVycykge1xuICAgIGlmICh0eXBlb2YgbWFpbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgdGhlICdtYWluJyBcIiArIFwiZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRyaXZlcnMgIT09IFwib2JqZWN0XCIgfHwgZHJpdmVycyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGRyaXZlciBmdW5jdGlvbnMgYXMgcHJvcGVydGllcy5cIik7XG4gICAgfVxuICAgIGlmIChpbnRlcm5hbHNfMS5pc09iamVjdEVtcHR5KGRyaXZlcnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIGVuZ2luZSA9IHNldHVwUmV1c2FibGUoZHJpdmVycyk7XG4gICAgdmFyIHNpbmtzID0gbWFpbihlbmdpbmUuc291cmNlcyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHdpbmRvdy5DeWNsZWpzID0gd2luZG93LkN5Y2xlanMgfHwge307XG4gICAgICAgIHdpbmRvdy5DeWNsZWpzLnNpbmtzID0gc2lua3M7XG4gICAgfVxuICAgIGZ1bmN0aW9uIF9ydW4oKSB7XG4gICAgICAgIHZhciBkaXNwb3NlUnVuID0gZW5naW5lLnJ1bihzaW5rcyk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICAgICAgZGlzcG9zZVJ1bigpO1xuICAgICAgICAgICAgZW5naW5lLmRpc3Bvc2UoKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc2lua3M6IHNpbmtzLCBzb3VyY2VzOiBlbmdpbmUuc291cmNlcywgcnVuOiBfcnVuIH07XG59XG5leHBvcnRzLnNldHVwID0gc2V0dXA7XG4vKipcbiAqIEEgcGFydGlhbGx5LWFwcGxpZWQgdmFyaWFudCBvZiBzZXR1cCgpIHdoaWNoIGFjY2VwdHMgb25seSB0aGUgZHJpdmVycywgYW5kXG4gKiBhbGxvd3MgbWFueSBgbWFpbmAgZnVuY3Rpb25zIHRvIGV4ZWN1dGUgYW5kIHJldXNlIHRoaXMgc2FtZSBzZXQgb2YgZHJpdmVycy5cbiAqXG4gKiBUYWtlcyBhbiBvYmplY3Qgd2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIGlucHV0LCBhbmQgb3V0cHV0cyBhbiBvYmplY3Qgd2hpY2hcbiAqIGNvbnRhaW5zIHRoZSBnZW5lcmF0ZWQgc291cmNlcyAoZnJvbSB0aG9zZSBkcml2ZXJzKSBhbmQgYSBgcnVuYCBmdW5jdGlvblxuICogKHdoaWNoIGluIHR1cm4gZXhwZWN0cyBzaW5rcyBhcyBhcmd1bWVudCkuIFRoaXMgYHJ1bmAgZnVuY3Rpb24gY2FuIGJlIGNhbGxlZFxuICogbXVsdGlwbGUgdGltZXMgd2l0aCBkaWZmZXJlbnQgYXJndW1lbnRzLCBhbmQgaXQgd2lsbCByZXVzZSB0aGUgZHJpdmVycyB0aGF0XG4gKiB3ZXJlIHBhc3NlZCB0byBgc2V0dXBSZXVzYWJsZWAuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtzZXR1cFJldXNhYmxlfSBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IHtzb3VyY2VzLCBydW4sIGRpc3Bvc2V9ID0gc2V0dXBSZXVzYWJsZShkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogY29uc3Qgc2lua3MgPSBtYWluKHNvdXJjZXMpO1xuICogY29uc3QgZGlzcG9zZVJ1biA9IHJ1bihzaW5rcyk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2VSdW4oKTtcbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpOyAvLyBlbmRzIHRoZSByZXVzYWJpbGl0eSBvZiBkcml2ZXJzXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCB0aHJlZSBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBydW5gIGFuZFxuICogYGRpc3Bvc2VgLiBgc291cmNlc2AgaXMgdGhlIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNvdXJjZXMsIGBydW5gIGlzIHRoZVxuICogZnVuY3Rpb24gdGhhdCBvbmNlIGNhbGxlZCB3aXRoICdzaW5rcycgYXMgYXJndW1lbnQsIHdpbGwgZXhlY3V0ZSB0aGVcbiAqIGFwcGxpY2F0aW9uLCB0eWluZyB0b2dldGhlciBzb3VyY2VzIHdpdGggc2lua3MuIGBkaXNwb3NlYCB0ZXJtaW5hdGVzIHRoZVxuICogcmV1c2FibGUgcmVzb3VyY2VzIHVzZWQgYnkgdGhlIGRyaXZlcnMuIE5vdGUgYWxzbyB0aGF0IGBydW5gIHJldHVybnMgYVxuICogZGlzcG9zZSBmdW5jdGlvbiB3aGljaCB0ZXJtaW5hdGVzIHJlc291cmNlcyB0aGF0IGFyZSBzcGVjaWZpYyAobm90IHJldXNhYmxlKVxuICogdG8gdGhhdCBydW4uXG4gKiBAZnVuY3Rpb24gc2V0dXBSZXVzYWJsZVxuICovXG5mdW5jdGlvbiBzZXR1cFJldXNhYmxlKGRyaXZlcnMpIHtcbiAgICBpZiAodHlwZW9mIGRyaXZlcnMgIT09IFwib2JqZWN0XCIgfHwgZHJpdmVycyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBnaXZlbiB0byBzZXR1cFJldXNhYmxlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMuXCIpO1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWxzXzEuaXNPYmplY3RFbXB0eShkcml2ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBnaXZlbiB0byBzZXR1cFJldXNhYmxlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBhdCBsZWFzdCBvbmUgZHJpdmVyIGZ1bmN0aW9uIGRlY2xhcmVkIGFzIGEgcHJvcGVydHkuXCIpO1xuICAgIH1cbiAgICB2YXIgc2lua1Byb3hpZXMgPSBpbnRlcm5hbHNfMS5tYWtlU2lua1Byb3hpZXMoZHJpdmVycyk7XG4gICAgdmFyIHJhd1NvdXJjZXMgPSBpbnRlcm5hbHNfMS5jYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcyk7XG4gICAgdmFyIHNvdXJjZXMgPSBpbnRlcm5hbHNfMS5hZGFwdFNvdXJjZXMocmF3U291cmNlcyk7XG4gICAgZnVuY3Rpb24gX3J1bihzaW5rcykge1xuICAgICAgICByZXR1cm4gaW50ZXJuYWxzXzEucmVwbGljYXRlTWFueShzaW5rcywgc2lua1Byb3hpZXMpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkaXNwb3NlRW5naW5lKCkge1xuICAgICAgICBpbnRlcm5hbHNfMS5kaXNwb3NlU291cmNlcyhzb3VyY2VzKTtcbiAgICAgICAgaW50ZXJuYWxzXzEuZGlzcG9zZVNpbmtQcm94aWVzKHNpbmtQcm94aWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc291cmNlczogc291cmNlcywgcnVuOiBfcnVuLCBkaXNwb3NlOiBkaXNwb3NlRW5naW5lIH07XG59XG5leHBvcnRzLnNldHVwUmV1c2FibGUgPSBzZXR1cFJldXNhYmxlO1xuLyoqXG4gKiBUYWtlcyBhIGBtYWluYCBmdW5jdGlvbiBhbmQgY2lyY3VsYXJseSBjb25uZWN0cyBpdCB0byB0aGUgZ2l2ZW4gY29sbGVjdGlvblxuICogb2YgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQgcnVuIGZyb20gJ0BjeWNsZS9ydW4nO1xuICogY29uc3QgZGlzcG9zZSA9IHJ1bihtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogVGhlIGBtYWluYCBmdW5jdGlvbiBleHBlY3RzIGEgY29sbGVjdGlvbiBvZiBcInNvdXJjZVwiIHN0cmVhbXMgKHJldHVybmVkIGZyb21cbiAqIGRyaXZlcnMpIGFzIGlucHV0LCBhbmQgc2hvdWxkIHJldHVybiBhIGNvbGxlY3Rpb24gb2YgXCJzaW5rXCIgc3RyZWFtcyAodG8gYmVcbiAqIGdpdmVuIHRvIGRyaXZlcnMpLiBBIFwiY29sbGVjdGlvbiBvZiBzdHJlYW1zXCIgaXMgYSBKYXZhU2NyaXB0IG9iamVjdCB3aGVyZVxuICoga2V5cyBtYXRjaCB0aGUgZHJpdmVyIG5hbWVzIHJlZ2lzdGVyZWQgYnkgdGhlIGBkcml2ZXJzYCBvYmplY3QsIGFuZCB2YWx1ZXNcbiAqIGFyZSB0aGUgc3RyZWFtcy4gUmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgZWFjaCBkcml2ZXIgdG8gc2VlIG1vcmVcbiAqIGRldGFpbHMgb24gd2hhdCB0eXBlcyBvZiBzb3VyY2VzIGl0IG91dHB1dHMgYW5kIHNpbmtzIGl0IHJlY2VpdmVzLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1haW4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dCBhbmQgb3V0cHV0c1xuICogYHNpbmtzYC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkcml2ZXJzIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBkcml2ZXIgbmFtZXMgYW5kIHZhbHVlc1xuICogYXJlIGRyaXZlciBmdW5jdGlvbnMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBkaXNwb3NlIGZ1bmN0aW9uLCB1c2VkIHRvIHRlcm1pbmF0ZSB0aGUgZXhlY3V0aW9uIG9mIHRoZVxuICogQ3ljbGUuanMgcHJvZ3JhbSwgY2xlYW5pbmcgdXAgcmVzb3VyY2VzIHVzZWQuXG4gKiBAZnVuY3Rpb24gcnVuXG4gKi9cbmZ1bmN0aW9uIHJ1bihtYWluLCBkcml2ZXJzKSB7XG4gICAgdmFyIHByb2dyYW0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgd2luZG93WydDeWNsZWpzRGV2VG9vbF9zdGFydEdyYXBoU2VyaWFsaXplciddKSB7XG4gICAgICAgIHdpbmRvd1snQ3ljbGVqc0RldlRvb2xfc3RhcnRHcmFwaFNlcmlhbGl6ZXInXShwcm9ncmFtLnNpbmtzKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2dyYW0ucnVuKCk7XG59XG5leHBvcnRzLnJ1biA9IHJ1bjtcbmV4cG9ydHMuZGVmYXVsdCA9IHJ1bjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIHF1aWNrdGFza18xID0gcmVxdWlyZShcInF1aWNrdGFza1wiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIi4vYWRhcHRcIik7XG52YXIgc2NoZWR1bGVNaWNyb3Rhc2sgPSBxdWlja3Rhc2tfMS5kZWZhdWx0KCk7XG5mdW5jdGlvbiBtYWtlU2lua1Byb3hpZXMoZHJpdmVycykge1xuICAgIHZhciBzaW5rUHJveGllcyA9IHt9O1xuICAgIGZvciAodmFyIG5hbWVfMSBpbiBkcml2ZXJzKSB7XG4gICAgICAgIGlmIChkcml2ZXJzLmhhc093blByb3BlcnR5KG5hbWVfMSkpIHtcbiAgICAgICAgICAgIHNpbmtQcm94aWVzW25hbWVfMV0gPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2lua1Byb3hpZXM7XG59XG5leHBvcnRzLm1ha2VTaW5rUHJveGllcyA9IG1ha2VTaW5rUHJveGllcztcbmZ1bmN0aW9uIGNhbGxEcml2ZXJzKGRyaXZlcnMsIHNpbmtQcm94aWVzKSB7XG4gICAgdmFyIHNvdXJjZXMgPSB7fTtcbiAgICBmb3IgKHZhciBuYW1lXzIgaW4gZHJpdmVycykge1xuICAgICAgICBpZiAoZHJpdmVycy5oYXNPd25Qcm9wZXJ0eShuYW1lXzIpKSB7XG4gICAgICAgICAgICBzb3VyY2VzW25hbWVfMl0gPSBkcml2ZXJzW25hbWVfMl0oc2lua1Byb3hpZXNbbmFtZV8yXSwgbmFtZV8yKTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VzW25hbWVfMl0gJiYgdHlwZW9mIHNvdXJjZXNbbmFtZV8yXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBzb3VyY2VzW25hbWVfMl0uX2lzQ3ljbGVTb3VyY2UgPSBuYW1lXzI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZXM7XG59XG5leHBvcnRzLmNhbGxEcml2ZXJzID0gY2FsbERyaXZlcnM7XG4vLyBOT1RFOiB0aGlzIHdpbGwgbXV0YXRlIGBzb3VyY2VzYC5cbmZ1bmN0aW9uIGFkYXB0U291cmNlcyhzb3VyY2VzKSB7XG4gICAgZm9yICh2YXIgbmFtZV8zIGluIHNvdXJjZXMpIHtcbiAgICAgICAgaWYgKHNvdXJjZXMuaGFzT3duUHJvcGVydHkobmFtZV8zKSAmJlxuICAgICAgICAgICAgc291cmNlc1tuYW1lXzNdICYmXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlc1tuYW1lXzNdWydzaGFtZWZ1bGx5U2VuZE5leHQnXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzNdID0gYWRhcHRfMS5hZGFwdChzb3VyY2VzW25hbWVfM10pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5hZGFwdFNvdXJjZXMgPSBhZGFwdFNvdXJjZXM7XG5mdW5jdGlvbiByZXBsaWNhdGVNYW55KHNpbmtzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhzaW5rcykuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiAhIXNpbmtQcm94aWVzW25hbWVdOyB9KTtcbiAgICB2YXIgYnVmZmVycyA9IHt9O1xuICAgIHZhciByZXBsaWNhdG9ycyA9IHt9O1xuICAgIHNpbmtOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0gPSB7IF9uOiBbXSwgX2U6IFtdIH07XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdID0ge1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKHgpIHsgcmV0dXJuIGJ1ZmZlcnNbbmFtZV0uX24ucHVzaCh4KTsgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7IHJldHVybiBidWZmZXJzW25hbWVdLl9lLnB1c2goZXJyKTsgfSxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSBzaW5rTmFtZXMubWFwKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tuYW1lXSkuc3Vic2NyaWJlKHJlcGxpY2F0b3JzW25hbWVdKTtcbiAgICB9KTtcbiAgICBzaW5rTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgbGlzdGVuZXIgPSBzaW5rUHJveGllc1tuYW1lXTtcbiAgICAgICAgdmFyIG5leHQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgc2NoZWR1bGVNaWNyb3Rhc2soZnVuY3Rpb24gKCkgeyByZXR1cm4gbGlzdGVuZXIuX24oeCk7IH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBzY2hlZHVsZU1pY3JvdGFzayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgKGNvbnNvbGUuZXJyb3IgfHwgY29uc29sZS5sb2cpKGVycik7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuX2UoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBidWZmZXJzW25hbWVdLl9uLmZvckVhY2gobmV4dCk7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0uX2UuZm9yRWFjaChlcnJvcik7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLm5leHQgPSBuZXh0O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5lcnJvciA9IGVycm9yO1xuICAgICAgICAvLyBiZWNhdXNlIHNpbmsuc3Vic2NyaWJlKHJlcGxpY2F0b3IpIGhhZCBtdXRhdGVkIHJlcGxpY2F0b3IgdG8gYWRkXG4gICAgICAgIC8vIF9uLCBfZSwgX2MsIHdlIG11c3QgYWxzbyB1cGRhdGUgdGhlc2U6XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLl9uID0gbmV4dDtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uX2UgPSBlcnJvcjtcbiAgICB9KTtcbiAgICBidWZmZXJzID0gbnVsbDsgLy8gZnJlZSB1cCBmb3IgR0NcbiAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZVJlcGxpY2F0aW9uKCkge1xuICAgICAgICBzdWJzY3JpcHRpb25zLmZvckVhY2goZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudW5zdWJzY3JpYmUoKTsgfSk7XG4gICAgfTtcbn1cbmV4cG9ydHMucmVwbGljYXRlTWFueSA9IHJlcGxpY2F0ZU1hbnk7XG5mdW5jdGlvbiBkaXNwb3NlU2lua1Byb3hpZXMoc2lua1Byb3hpZXMpIHtcbiAgICBPYmplY3Qua2V5cyhzaW5rUHJveGllcykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gc2lua1Byb3hpZXNbbmFtZV0uX2MoKTsgfSk7XG59XG5leHBvcnRzLmRpc3Bvc2VTaW5rUHJveGllcyA9IGRpc3Bvc2VTaW5rUHJveGllcztcbmZ1bmN0aW9uIGRpc3Bvc2VTb3VyY2VzKHNvdXJjZXMpIHtcbiAgICBmb3IgKHZhciBrIGluIHNvdXJjZXMpIHtcbiAgICAgICAgaWYgKHNvdXJjZXMuaGFzT3duUHJvcGVydHkoaykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNba10gJiZcbiAgICAgICAgICAgIHNvdXJjZXNba10uZGlzcG9zZSkge1xuICAgICAgICAgICAgc291cmNlc1trXS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmRpc3Bvc2VTb3VyY2VzID0gZGlzcG9zZVNvdXJjZXM7XG5mdW5jdGlvbiBpc09iamVjdEVtcHR5KG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmV4cG9ydHMuaXNPYmplY3RFbXB0eSA9IGlzT2JqZWN0RW1wdHk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbnRlcm5hbHMuanMubWFwIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gbWljcm90YXNrKCkge1xuICAgIGlmICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIG5vZGVfMSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgdmFyIHF1ZXVlXzEgPSBbXTtcbiAgICAgICAgdmFyIGlfMSA9IDA7XG4gICAgICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChxdWV1ZV8xLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHF1ZXVlXzEuc2hpZnQoKSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5vYnNlcnZlKG5vZGVfMSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZV8xLnB1c2goZm4pO1xuICAgICAgICAgICAgbm9kZV8xLmRhdGEgPSBpXzEgPSAxIC0gaV8xO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gc2V0SW1tZWRpYXRlO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dDtcbiAgICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBtaWNyb3Rhc2s7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfcG9ueWZpbGwgPSByZXF1aXJlKCcuL3BvbnlmaWxsLmpzJyk7XG5cbnZhciBfcG9ueWZpbGwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcG9ueWZpbGwpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciByb290OyAvKiBnbG9iYWwgd2luZG93ICovXG5cblxuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gc2VsZjtcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IG1vZHVsZTtcbn0gZWxzZSB7XG4gIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxuXG52YXIgcmVzdWx0ID0gKDAsIF9wb255ZmlsbDJbJ2RlZmF1bHQnXSkocm9vdCk7XG5leHBvcnRzWydkZWZhdWx0J10gPSByZXN1bHQ7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1snZGVmYXVsdCddID0gc3ltYm9sT2JzZXJ2YWJsZVBvbnlmaWxsO1xuZnVuY3Rpb24gc3ltYm9sT2JzZXJ2YWJsZVBvbnlmaWxsKHJvb3QpIHtcblx0dmFyIHJlc3VsdDtcblx0dmFyIF9TeW1ib2wgPSByb290LlN5bWJvbDtcblxuXHRpZiAodHlwZW9mIF9TeW1ib2wgPT09ICdmdW5jdGlvbicpIHtcblx0XHRpZiAoX1N5bWJvbC5vYnNlcnZhYmxlKSB7XG5cdFx0XHRyZXN1bHQgPSBfU3ltYm9sLm9ic2VydmFibGU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2woJ29ic2VydmFibGUnKTtcblx0XHRcdF9TeW1ib2wub2JzZXJ2YWJsZSA9IHJlc3VsdDtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmVzdWx0ID0gJ0BAb2JzZXJ2YWJsZSc7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCJ2YXIgbmV4dFRpY2sgPSByZXF1aXJlKCdwcm9jZXNzL2Jyb3dzZXIuanMnKS5uZXh0VGljaztcbnZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBpbW1lZGlhdGVJZHMgPSB7fTtcbnZhciBuZXh0SW1tZWRpYXRlSWQgPSAwO1xuXG4vLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5leHBvcnRzLnNldFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xufTtcbmV4cG9ydHMuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG59O1xuZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkgeyB0aW1lb3V0LmNsb3NlKCk7IH07XG5cbmZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcbiAgdGhpcy5faWQgPSBpZDtcbiAgdGhpcy5fY2xlYXJGbiA9IGNsZWFyRm47XG59XG5UaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5UaW1lb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG59O1xuXG4vLyBEb2VzIG5vdCBzdGFydCB0aGUgdGltZSwganVzdCBzZXRzIHVwIHRoZSBtZW1iZXJzIG5lZWRlZC5cbmV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IG1zZWNzO1xufTtcblxuZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xufTtcblxuZXhwb3J0cy5fdW5yZWZBY3RpdmUgPSBleHBvcnRzLmFjdGl2ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG4gIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuICBpZiAobXNlY3MgPj0gMCkge1xuICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcbiAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG4gICAgICAgIGl0ZW0uX29uVGltZW91dCgpO1xuICAgIH0sIG1zZWNzKTtcbiAgfVxufTtcblxuLy8gVGhhdCdzIG5vdCBob3cgbm9kZS5qcyBpbXBsZW1lbnRzIGl0IGJ1dCB0aGUgZXhwb3NlZCBhcGkgaXMgdGhlIHNhbWUuXG5leHBvcnRzLnNldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHNldEltbWVkaWF0ZSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHZhciBpZCA9IG5leHRJbW1lZGlhdGVJZCsrO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGggPCAyID8gZmFsc2UgOiBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgaW1tZWRpYXRlSWRzW2lkXSA9IHRydWU7XG5cbiAgbmV4dFRpY2soZnVuY3Rpb24gb25OZXh0VGljaygpIHtcbiAgICBpZiAoaW1tZWRpYXRlSWRzW2lkXSkge1xuICAgICAgLy8gZm4uY2FsbCgpIGlzIGZhc3RlciBzbyB3ZSBvcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiB1c2UtY2FzZVxuICAgICAgLy8gQHNlZSBodHRwOi8vanNwZXJmLmNvbS9jYWxsLWFwcGx5LXNlZ3VcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm4uY2FsbChudWxsKTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZlbnQgaWRzIGZyb20gbGVha2luZ1xuICAgICAgZXhwb3J0cy5jbGVhckltbWVkaWF0ZShpZCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaWQ7XG59O1xuXG5leHBvcnRzLmNsZWFySW1tZWRpYXRlID0gdHlwZW9mIGNsZWFySW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBjbGVhckltbWVkaWF0ZSA6IGZ1bmN0aW9uKGlkKSB7XG4gIGRlbGV0ZSBpbW1lZGlhdGVJZHNbaWRdO1xufTsiLCJpbXBvcnQge09wZXJhdG9yLCBTdHJlYW19IGZyb20gJy4uL2luZGV4JztcblxuY2xhc3MgRGVsYXlPcGVyYXRvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZGVsYXknO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD4gPSBudWxsIGFzIGFueTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgZHQ6IG51bWJlcixcbiAgICAgICAgICAgICAgcHVibGljIGluczogU3RyZWFtPFQ+KSB7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IG51bGwgYXMgYW55O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHUuX24odCk7XG4gICAgICBjbGVhckludGVydmFsKGlkKTtcbiAgICB9LCB0aGlzLmR0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdS5fZShlcnIpO1xuICAgICAgY2xlYXJJbnRlcnZhbChpZCk7XG4gICAgfSwgdGhpcy5kdCk7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB1Ll9jKCk7XG4gICAgICBjbGVhckludGVydmFsKGlkKTtcbiAgICB9LCB0aGlzLmR0KTtcbiAgfVxufVxuXG4vKipcbiAqIERlbGF5cyBwZXJpb2RpYyBldmVudHMgYnkgYSBnaXZlbiB0aW1lIHBlcmlvZC5cbiAqXG4gKiBNYXJibGUgZGlhZ3JhbTpcbiAqXG4gKiBgYGB0ZXh0XG4gKiAxLS0tLTItLTMtLTQtLS0tNXxcbiAqICAgICBkZWxheSg2MClcbiAqIC0tLTEtLS0tMi0tMy0tNC0tLS01fFxuICogYGBgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21EaWFncmFtIGZyb20gJ3hzdHJlYW0vZXh0cmEvZnJvbURpYWdyYW0nXG4gKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRGlhZ3JhbSgnMS0tLS0yLS0zLS00LS0tLTV8JylcbiAqICAuY29tcG9zZShkZWxheSg2MCkpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IDEgIChhZnRlciA2MCBtcylcbiAqID4gMiAgKGFmdGVyIDE2MCBtcylcbiAqID4gMyAgKGFmdGVyIDIyMCBtcylcbiAqID4gNCAgKGFmdGVyIDI4MCBtcylcbiAqID4gNSAgKGFmdGVyIDM4MCBtcylcbiAqID4gY29tcGxldGVkXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gcGVyaW9kIFRoZSBhbW91bnQgb2Ygc2lsZW5jZSByZXF1aXJlZCBpbiBtaWxsaXNlY29uZHMuXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRlbGF5PFQ+KHBlcmlvZDogbnVtYmVyKTogKGluczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08VD4ge1xuICByZXR1cm4gZnVuY3Rpb24gZGVsYXlPcGVyYXRvcihpbnM6IFN0cmVhbTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERlbGF5T3BlcmF0b3IocGVyaW9kLCBpbnMpKTtcbiAgfTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibm9kZVwiIC8+XG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7U3RyZWFtLCBJbnRlcm5hbFByb2R1Y2VyLCBJbnRlcm5hbExpc3RlbmVyfSBmcm9tICcuLi9pbmRleCc7XG5cbmV4cG9ydCBjbGFzcyBET01FdmVudFByb2R1Y2VyIGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxFdmVudD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tRXZlbnQnO1xuICBwcml2YXRlIGxpc3RlbmVyOiBFdmVudExpc3RlbmVyIHwgbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5vZGU6IEV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICBwcml2YXRlIGV2ZW50VHlwZTogc3RyaW5nLFxuICAgICAgICAgICAgICBwcml2YXRlIHVzZUNhcHR1cmU6IGJvb2xlYW4pIHtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8RXZlbnQ+KSB7XG4gICAgdGhpcy5saXN0ZW5lciA9IChlKSA9PiBvdXQuX24oZSk7XG4gICAgdGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5ldmVudFR5cGUsIHRoaXMubGlzdGVuZXIsIHRoaXMudXNlQ2FwdHVyZSk7XG4gIH1cblxuICBfc3RvcCgpIHtcbiAgICB0aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50VHlwZSwgdGhpcy5saXN0ZW5lciBhcyBhbnksIHRoaXMudXNlQ2FwdHVyZSk7XG4gICAgdGhpcy5saXN0ZW5lciA9IG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVFdmVudFByb2R1Y2VyIGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxhbnk+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbUV2ZW50JztcbiAgcHJpdmF0ZSBsaXN0ZW5lcjogRnVuY3Rpb24gfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbm9kZTogRXZlbnRFbWl0dGVyLCBwcml2YXRlIGV2ZW50TmFtZTogc3RyaW5nKSB7IH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHtcbiAgICB0aGlzLmxpc3RlbmVyID0gKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IHtcbiAgICAgIHJldHVybiAoYXJncy5sZW5ndGggPiAxKSA/IG91dC5fbihhcmdzKSA6IG91dC5fbihhcmdzWzBdKTtcbiAgICB9O1xuICAgIHRoaXMubm9kZS5hZGRMaXN0ZW5lcih0aGlzLmV2ZW50TmFtZSwgdGhpcy5saXN0ZW5lcik7XG4gIH1cblxuICBfc3RvcCgpIHtcbiAgICB0aGlzLm5vZGUucmVtb3ZlTGlzdGVuZXIodGhpcy5ldmVudE5hbWUsIHRoaXMubGlzdGVuZXIgYXMgYW55KTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0VtaXR0ZXIoZWxlbWVudDogYW55KTogZWxlbWVudCBpcyBFdmVudEVtaXR0ZXIge1xuICByZXR1cm4gZWxlbWVudC5lbWl0ICYmIGVsZW1lbnQuYWRkTGlzdGVuZXI7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHN0cmVhbSBiYXNlZCBvbiBlaXRoZXI6XG4gKiAtIERPTSBldmVudHMgd2l0aCB0aGUgbmFtZSBgZXZlbnROYW1lYCBmcm9tIGEgcHJvdmlkZWQgdGFyZ2V0IG5vZGVcbiAqIC0gRXZlbnRzIHdpdGggdGhlIG5hbWUgYGV2ZW50TmFtZWAgZnJvbSBhIHByb3ZpZGVkIE5vZGVKUyBFdmVudEVtaXR0ZXJcbiAqXG4gKiBXaGVuIGNyZWF0aW5nIGEgc3RyZWFtIGZyb20gRXZlbnRFbWl0dGVycywgaWYgdGhlIHNvdXJjZSBldmVudCBoYXMgbW9yZSB0aGFuXG4gKiBvbmUgYXJndW1lbnQgYWxsIHRoZSBhcmd1bWVudHMgd2lsbCBiZSBhZ2dyZWdhdGVkIGludG8gYW4gYXJyYXkgaW4gdGhlXG4gKiByZXN1bHQgc3RyZWFtLlxuICpcbiAqIChUaXA6IHdoZW4gdXNpbmcgdGhpcyBmYWN0b3J5IHdpdGggVHlwZVNjcmlwdCwgeW91IHdpbGwgbmVlZCB0eXBlcyBmb3JcbiAqIE5vZGUuanMgYmVjYXVzZSBmcm9tRXZlbnQga25vd3MgaG93IHRvIGhhbmRsZSBib3RoIERPTSBldmVudHMgYW5kIE5vZGUuanNcbiAqIEV2ZW50RW1pdHRlci4gSnVzdCBpbnN0YWxsIGBAdHlwZXMvbm9kZWApXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogICBmcm9tRXZlbnQoZWxlbWVudCwgZXZlbnROYW1lKVxuICogLS0tZXYtLWV2LS0tLWV2LS0tLS0tLS0tLS0tLS0tXG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21FdmVudCBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21FdmVudCdcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRXZlbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJ1dHRvbicpLCAnY2xpY2snKVxuICogICAubWFwVG8oJ0J1dHRvbiBjbGlja2VkIScpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+ICdCdXR0b24gY2xpY2tlZCEnXG4gKiA+ICdCdXR0b24gY2xpY2tlZCEnXG4gKiA+ICdCdXR0b24gY2xpY2tlZCEnXG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21FdmVudCBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21FdmVudCdcbiAqIGltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnXG4gKlxuICogY29uc3QgTXlFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRXZlbnQoTXlFbWl0dGVyLCAnZm9vJylcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqXG4gKiBNeUVtaXR0ZXIuZW1pdCgnZm9vJywgJ2JhcicpXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+ICdiYXInXG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21FdmVudCBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21FdmVudCdcbiAqIGltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnXG4gKlxuICogY29uc3QgTXlFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRXZlbnQoTXlFbWl0dGVyLCAnZm9vJylcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqXG4gKiBNeUVtaXR0ZXIuZW1pdCgnZm9vJywgJ2JhcicsICdiYXonLCAnYnV6eicpXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IFsnYmFyJywgJ2JheicsICdidXp6J11cbiAqIGBgYFxuICpcbiAqIEBmYWN0b3J5IHRydWVcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyfSBlbGVtZW50IFRoZSBlbGVtZW50IHVwb24gd2hpY2ggdG8gbGlzdGVuLlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgZm9yIHdoaWNoIHRvIGxpc3Rlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbj99IHVzZUNhcHR1cmUgQW4gb3B0aW9uYWwgYm9vbGVhbiB0aGF0IGluZGljYXRlcyB0aGF0IGV2ZW50cyBvZlxuICogdGhpcyB0eXBlIHdpbGwgYmUgZGlzcGF0Y2hlZCB0byB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lciBiZWZvcmUgYmVpbmdcbiAqIGRpc3BhdGNoZWQgdG8gYW55IEV2ZW50VGFyZ2V0IGJlbmVhdGggaXQgaW4gdGhlIERPTSB0cmVlLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuXG5mdW5jdGlvbiBmcm9tRXZlbnQ8VCA9IGFueT4oZWxlbWVudDogRXZlbnRFbWl0dGVyLCBldmVudE5hbWU6IHN0cmluZyk6IFN0cmVhbTxUPjtcbmZ1bmN0aW9uIGZyb21FdmVudDxUIGV4dGVuZHMgRXZlbnQgPSBFdmVudD4oZWxlbWVudDogRXZlbnRUYXJnZXQsIGV2ZW50TmFtZTogc3RyaW5nLCB1c2VDYXB0dXJlPzogYm9vbGVhbik6IFN0cmVhbTxUPjtcblxuZnVuY3Rpb24gZnJvbUV2ZW50PFQgPSBhbnk+KGVsZW1lbnQ6IEV2ZW50RW1pdHRlciB8IEV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZUNhcHR1cmU6IGJvb2xlYW4gPSBmYWxzZSk6IFN0cmVhbTxUPiB7XG4gIGlmIChpc0VtaXR0ZXIoZWxlbWVudCkpIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgTm9kZUV2ZW50UHJvZHVjZXIoZWxlbWVudCwgZXZlbnROYW1lKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERPTUV2ZW50UHJvZHVjZXIoZWxlbWVudCwgZXZlbnROYW1lLCB1c2VDYXB0dXJlKSBhcyBhbnkpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZyb21FdmVudDtcbiIsImltcG9ydCAkJG9ic2VydmFibGUgZnJvbSAnc3ltYm9sLW9ic2VydmFibGUnO1xuXG5jb25zdCBOTyA9IHt9O1xuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmZ1bmN0aW9uIGNwPFQ+KGE6IEFycmF5PFQ+KTogQXJyYXk8VD4ge1xuICBjb25zdCBsID0gYS5sZW5ndGg7XG4gIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyArK2kpIGJbaV0gPSBhW2ldO1xuICByZXR1cm4gYjtcbn1cblxuZnVuY3Rpb24gYW5kPFQ+KGYxOiAodDogVCkgPT4gYm9vbGVhbiwgZjI6ICh0OiBUKSA9PiBib29sZWFuKTogKHQ6IFQpID0+IGJvb2xlYW4ge1xuICByZXR1cm4gZnVuY3Rpb24gYW5kRm4odDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmMSh0KSAmJiBmMih0KTtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIEZDb250YWluZXI8VCwgUj4ge1xuICBmKHQ6IFQpOiBSO1xufVxuXG5mdW5jdGlvbiBfdHJ5PFQsIFI+KGM6IEZDb250YWluZXI8VCwgUj4sIHQ6IFQsIHU6IFN0cmVhbTxhbnk+KTogUiB8IHt9IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYy5mKHQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdS5fZShlKTtcbiAgICByZXR1cm4gTk87XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgX246ICh2OiBUKSA9PiB2b2lkO1xuICBfZTogKGVycjogYW55KSA9PiB2b2lkO1xuICBfYzogKCkgPT4gdm9pZDtcbn1cblxuY29uc3QgTk9fSUw6IEludGVybmFsTGlzdGVuZXI8YW55PiA9IHtcbiAgX246IG5vb3AsXG4gIF9lOiBub29wLFxuICBfYzogbm9vcCxcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIF9zdGFydChsaXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQ7XG4gIF9zdG9wOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE91dFNlbmRlcjxUPiB7XG4gIG91dDogU3RyZWFtPFQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wZXJhdG9yPFQsIFI+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxSPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPFI+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnM6IFN0cmVhbTxUPjtcbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBZ2dyZWdhdG9yPFQsIFU+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxVPiwgT3V0U2VuZGVyPFU+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj47XG4gIF9zdGFydChvdXQ6IFN0cmVhbTxVPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvZHVjZXI8VD4ge1xuICBzdGFydDogKGxpc3RlbmVyOiBMaXN0ZW5lcjxUPikgPT4gdm9pZDtcbiAgc3RvcDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaXN0ZW5lcjxUPiB7XG4gIG5leHQ6ICh4OiBUKSA9PiB2b2lkO1xuICBlcnJvcjogKGVycjogYW55KSA9PiB2b2lkO1xuICBjb21wbGV0ZTogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb24ge1xuICB1bnN1YnNjcmliZSgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9ic2VydmFibGU8VD4ge1xuICBzdWJzY3JpYmUobGlzdGVuZXI6IExpc3RlbmVyPFQ+KTogU3Vic2NyaXB0aW9uO1xufVxuXG4vLyBtdXRhdGVzIHRoZSBpbnB1dFxuZnVuY3Rpb24gaW50ZXJuYWxpemVQcm9kdWNlcjxUPihwcm9kdWNlcjogUHJvZHVjZXI8VD4gJiBQYXJ0aWFsPEludGVybmFsUHJvZHVjZXI8VD4+KSB7XG4gIHByb2R1Y2VyLl9zdGFydCA9IGZ1bmN0aW9uIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPiAmIFBhcnRpYWw8TGlzdGVuZXI8VD4+KSB7XG4gICAgaWwubmV4dCA9IGlsLl9uO1xuICAgIGlsLmVycm9yID0gaWwuX2U7XG4gICAgaWwuY29tcGxldGUgPSBpbC5fYztcbiAgICB0aGlzLnN0YXJ0KGlsKTtcbiAgfTtcbiAgcHJvZHVjZXIuX3N0b3AgPSBwcm9kdWNlci5zdG9wO1xufVxuXG5jbGFzcyBTdHJlYW1TdWI8VD4gaW1wbGVtZW50cyBTdWJzY3JpcHRpb24ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zdHJlYW06IFN0cmVhbTxUPiwgcHJpdmF0ZSBfbGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pIHt9XG5cbiAgdW5zdWJzY3JpYmUoKTogdm9pZCB7XG4gICAgdGhpcy5fc3RyZWFtLl9yZW1vdmUodGhpcy5fbGlzdGVuZXIpO1xuICB9XG59XG5cbmNsYXNzIE9ic2VydmVyPFQ+IGltcGxlbWVudHMgTGlzdGVuZXI8VD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9saXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPikge31cblxuICBuZXh0KHZhbHVlOiBUKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX24odmFsdWUpO1xuICB9XG5cbiAgZXJyb3IoZXJyOiBhbnkpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fZShlcnIpO1xuICB9XG5cbiAgY29tcGxldGUoKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBGcm9tT2JzZXJ2YWJsZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tT2JzZXJ2YWJsZSc7XG4gIHB1YmxpYyBpbnM6IE9ic2VydmFibGU8VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBhY3RpdmU6IGJvb2xlYW47XG4gIHByaXZhdGUgX3N1YjogU3Vic2NyaXB0aW9uIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKG9ic2VydmFibGU6IE9ic2VydmFibGU8VD4pIHtcbiAgICB0aGlzLmlucyA9IG9ic2VydmFibGU7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLl9zdWIgPSB0aGlzLmlucy5zdWJzY3JpYmUobmV3IE9ic2VydmVyKG91dCkpO1xuICAgIGlmICghdGhpcy5hY3RpdmUpIHRoaXMuX3N1Yi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgX3N0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3N1YikgdGhpcy5fc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lcmdlU2lnbmF0dXJlIHtcbiAgKCk6IFN0cmVhbTxhbnk+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogU3RyZWFtPFQxPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiBTdHJlYW08VDEgfCBUMj47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IFN0cmVhbTxUMSB8IFQyIHwgVDM+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDY+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOD47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4IHwgVDk+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5PixcbiAgICBzMTA6IFN0cmVhbTxUMTA+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDggfCBUOSB8IFQxMD47XG4gIDxUPiguLi5zdHJlYW06IEFycmF5PFN0cmVhbTxUPj4pOiBTdHJlYW08VD47XG59XG5cbmNsYXNzIE1lcmdlPFQ+IGltcGxlbWVudHMgQWdncmVnYXRvcjxULCBUPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ21lcmdlJztcbiAgcHVibGljIGluc0FycjogQXJyYXk8U3RyZWFtPFQ+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGFjOiBudW1iZXI7IC8vIGFjIGlzIGFjdGl2ZUNvdW50XG5cbiAgY29uc3RydWN0b3IoaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+KSB7XG4gICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5hYyA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgTCA9IHMubGVuZ3RoO1xuICAgIHRoaXMuYWMgPSBMO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBzW2ldLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgTCA9IHMubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBzW2ldLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBpZiAoLS10aGlzLmFjIDw9IDApIHtcbiAgICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgICAgdS5fYygpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbWJpbmVTaWduYXR1cmUge1xuICAoKTogU3RyZWFtPEFycmF5PGFueT4+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogU3RyZWFtPFtUMV0+O1xuICA8VDEsIFQyPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPik6IFN0cmVhbTxbVDEsIFQyXT47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IFN0cmVhbTxbVDEsIFQyLCBUM10+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNl0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUN10+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5PixcbiAgICBzMTA6IFN0cmVhbTxUMTA+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTBdPjtcbiAgKC4uLnN0cmVhbTogQXJyYXk8U3RyZWFtPGFueT4+KTogU3RyZWFtPEFycmF5PGFueT4+O1xufVxuXG5jbGFzcyBDb21iaW5lTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8QXJyYXk8VD4+IHtcbiAgcHJpdmF0ZSBpOiBudW1iZXI7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxUPj47XG4gIHByaXZhdGUgcDogQ29tYmluZTxUPjtcblxuICBjb25zdHJ1Y3RvcihpOiBudW1iZXIsIG91dDogU3RyZWFtPEFycmF5PFQ+PiwgcDogQ29tYmluZTxUPikge1xuICAgIHRoaXMuaSA9IGk7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5wID0gcDtcbiAgICBwLmlscy5wdXNoKHRoaXMpO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHAudXAodCwgdGhpcy5pKSkge1xuICAgICAgY29uc3QgYSA9IHAudmFscztcbiAgICAgIGNvbnN0IGwgPSBhLmxlbmd0aDtcbiAgICAgIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbDsgKytpKSBiW2ldID0gYVtpXTtcbiAgICAgIG91dC5fbihiKTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgb3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wO1xuICAgIGlmIChwLm91dCA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAoLS1wLk5jID09PSAwKSBwLm91dC5fYygpO1xuICB9XG59XG5cbmNsYXNzIENvbWJpbmU8Uj4gaW1wbGVtZW50cyBBZ2dyZWdhdG9yPGFueSwgQXJyYXk8Uj4+IHtcbiAgcHVibGljIHR5cGUgPSAnY29tYmluZSc7XG4gIHB1YmxpYyBpbnNBcnI6IEFycmF5PFN0cmVhbTxhbnk+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPEFycmF5PFI+PjtcbiAgcHVibGljIGlsczogQXJyYXk8Q29tYmluZUxpc3RlbmVyPGFueT4+O1xuICBwdWJsaWMgTmM6IG51bWJlcjsgLy8gKk4qdW1iZXIgb2Ygc3RyZWFtcyBzdGlsbCB0byBzZW5kICpjKm9tcGxldGVcbiAgcHVibGljIE5uOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqbipleHRcbiAgcHVibGljIHZhbHM6IEFycmF5PFI+O1xuXG4gIGNvbnN0cnVjdG9yKGluc0FycjogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8Uj4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy5OYyA9IHRoaXMuTm4gPSAwO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG5cbiAgdXAodDogYW55LCBpOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCB2ID0gdGhpcy52YWxzW2ldO1xuICAgIGNvbnN0IE5uID0gIXRoaXMuTm4gPyAwIDogdiA9PT0gTk8gPyAtLXRoaXMuTm4gOiB0aGlzLk5uO1xuICAgIHRoaXMudmFsc1tpXSA9IHQ7XG4gICAgcmV0dXJuIE5uID09PSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPEFycmF5PFI+Pik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBuID0gdGhpcy5OYyA9IHRoaXMuTm4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCB2YWxzID0gdGhpcy52YWxzID0gbmV3IEFycmF5KG4pO1xuICAgIGlmIChuID09PSAwKSB7XG4gICAgICBvdXQuX24oW10pO1xuICAgICAgb3V0Ll9jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHZhbHNbaV0gPSBOTztcbiAgICAgICAgc1tpXS5fYWRkKG5ldyBDb21iaW5lTGlzdGVuZXIoaSwgb3V0LCB0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IG4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCBpbHMgPSB0aGlzLmlscztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykgc1tpXS5fcmVtb3ZlKGlsc1tpXSk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8Uj4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy52YWxzID0gW107XG4gIH1cbn1cblxuY2xhc3MgRnJvbUFycmF5PFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21BcnJheSc7XG4gIHB1YmxpYyBhOiBBcnJheTxUPjtcblxuICBjb25zdHJ1Y3RvcihhOiBBcnJheTxUPikge1xuICAgIHRoaXMuYSA9IGE7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuYTtcbiAgICBmb3IgKGxldCBpID0gMCwgbiA9IGEubGVuZ3RoOyBpIDwgbjsgaSsrKSBvdXQuX24oYVtpXSk7XG4gICAgb3V0Ll9jKCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgfVxufVxuXG5jbGFzcyBGcm9tUHJvbWlzZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tUHJvbWlzZSc7XG4gIHB1YmxpYyBvbjogYm9vbGVhbjtcbiAgcHVibGljIHA6IFByb21pc2VMaWtlPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKHA6IFByb21pc2VMaWtlPFQ+KSB7XG4gICAgdGhpcy5vbiA9IGZhbHNlO1xuICAgIHRoaXMucCA9IHA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgcHJvZCA9IHRoaXM7XG4gICAgdGhpcy5vbiA9IHRydWU7XG4gICAgdGhpcy5wLnRoZW4oXG4gICAgICAodjogVCkgPT4ge1xuICAgICAgICBpZiAocHJvZC5vbikge1xuICAgICAgICAgIG91dC5fbih2KTtcbiAgICAgICAgICBvdXQuX2MoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIChlOiBhbnkpID0+IHtcbiAgICAgICAgb3V0Ll9lKGUpO1xuICAgICAgfSxcbiAgICApLnRoZW4obm9vcCwgKGVycjogYW55KSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhyb3cgZXJyOyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMub24gPSBmYWxzZTtcbiAgfVxufVxuXG5jbGFzcyBQZXJpb2RpYyBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8bnVtYmVyPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3BlcmlvZGljJztcbiAgcHVibGljIHBlcmlvZDogbnVtYmVyO1xuICBwcml2YXRlIGludGVydmFsSUQ6IGFueTtcbiAgcHJpdmF0ZSBpOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IocGVyaW9kOiBudW1iZXIpIHtcbiAgICB0aGlzLnBlcmlvZCA9IHBlcmlvZDtcbiAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICB0aGlzLmkgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxudW1iZXI+KTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gaW50ZXJ2YWxIYW5kbGVyKCkgeyBvdXQuX24oc2VsZi5pKyspOyB9XG4gICAgdGhpcy5pbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGVyLCB0aGlzLnBlcmlvZCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pbnRlcnZhbElEICE9PSAtMSkgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSUQpO1xuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IC0xO1xuICAgIHRoaXMuaSA9IDA7XG4gIH1cbn1cblxuY2xhc3MgRGVidWc8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2RlYnVnJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgczogKHQ6IFQpID0+IGFueTsgLy8gc3B5XG4gIHByaXZhdGUgbDogc3RyaW5nOyAvLyBsYWJlbFxuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiAodDogVCkgPT4gYW55KTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnMgPSBub29wO1xuICAgIHRoaXMubCA9ICcnO1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgdGhpcy5sID0gYXJnOyBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB0aGlzLnMgPSBhcmc7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgcyA9IHRoaXMucywgbCA9IHRoaXMubDtcbiAgICBpZiAocyAhPT0gbm9vcCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcyh0KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdS5fZShlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGwpIGNvbnNvbGUubG9nKGwgKyAnOicsIHQpOyBlbHNlIGNvbnNvbGUubG9nKHQpO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIERyb3A8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Ryb3AnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG1heDogbnVtYmVyO1xuICBwcml2YXRlIGRyb3BwZWQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihtYXg6IG51bWJlciwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm1heCA9IG1heDtcbiAgICB0aGlzLmRyb3BwZWQgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5kcm9wcGVkID0gMDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuZHJvcHBlZCsrID49IHRoaXMubWF4KSB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBFbmRXaGVuTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPGFueT4ge1xuICBwcml2YXRlIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wOiBFbmRXaGVuPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKG91dDogU3RyZWFtPFQ+LCBvcDogRW5kV2hlbjxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3AgPSBvcDtcbiAgfVxuXG4gIF9uKCkge1xuICAgIHRoaXMub3AuZW5kKCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIHRoaXMub3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wLmVuZCgpO1xuICB9XG59XG5cbmNsYXNzIEVuZFdoZW48VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2VuZFdoZW4nO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG86IFN0cmVhbTxhbnk+OyAvLyBvID0gb3RoZXJcbiAgcHJpdmF0ZSBvaWw6IEludGVybmFsTGlzdGVuZXI8YW55PjsgLy8gb2lsID0gb3RoZXIgSW50ZXJuYWxMaXN0ZW5lclxuXG4gIGNvbnN0cnVjdG9yKG86IFN0cmVhbTxhbnk+LCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubyA9IG87XG4gICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuby5fYWRkKHRoaXMub2lsID0gbmV3IEVuZFdoZW5MaXN0ZW5lcihvdXQsIHRoaXMpKTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm8uX3JlbW92ZSh0aGlzLm9pbCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgfVxuXG4gIGVuZCgpOiB2b2lkIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5lbmQoKTtcbiAgfVxufVxuXG5jbGFzcyBGaWx0ZXI8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZpbHRlcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmYgPSBwYXNzZXM7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PIHx8ICFyKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRmxhdHRlbkxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHByaXZhdGUgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3A6IEZsYXR0ZW48VD47XG5cbiAgY29uc3RydWN0b3Iob3V0OiBTdHJlYW08VD4sIG9wOiBGbGF0dGVuPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcCA9IG9wO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIHRoaXMub3V0Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICB0aGlzLm91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcC5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wLmxlc3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGbGF0dGVuPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8U3RyZWFtPFQ+LCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZsYXR0ZW4nO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08U3RyZWFtPFQ+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wZW46IGJvb2xlYW47XG4gIHB1YmxpYyBpbm5lcjogU3RyZWFtPFQ+OyAvLyBDdXJyZW50IGlubmVyIFN0cmVhbVxuICBwcml2YXRlIGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+OyAvLyBDdXJyZW50IGlubmVyIEludGVybmFsTGlzdGVuZXJcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxTdHJlYW08VD4+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgaWYgKHRoaXMuaW5uZXIgIT09IE5PKSB0aGlzLmlubmVyLl9yZW1vdmUodGhpcy5pbCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgfVxuXG4gIGxlc3MoKTogdm9pZCB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICghdGhpcy5vcGVuICYmIHRoaXMuaW5uZXIgPT09IE5PKSB1Ll9jKCk7XG4gIH1cblxuICBfbihzOiBTdHJlYW08VD4pIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3Qge2lubmVyLCBpbH0gPSB0aGlzO1xuICAgIGlmIChpbm5lciAhPT0gTk8gJiYgaWwgIT09IE5PX0lMKSBpbm5lci5fcmVtb3ZlKGlsKTtcbiAgICAodGhpcy5pbm5lciA9IHMpLl9hZGQodGhpcy5pbCA9IG5ldyBGbGF0dGVuTGlzdGVuZXIodSwgdGhpcykpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcGVuID0gZmFsc2U7XG4gICAgdGhpcy5sZXNzKCk7XG4gIH1cbn1cblxuY2xhc3MgRm9sZDxULCBSPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFI+IHtcbiAgcHVibGljIHR5cGUgPSAnZm9sZCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFI+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IFI7XG4gIHB1YmxpYyBzZWVkOiBSO1xuICBwcml2YXRlIGFjYzogUjsgLy8gaW5pdGlhbGl6ZWQgYXMgc2VlZFxuXG4gIGNvbnN0cnVjdG9yKGY6IChhY2M6IFIsIHQ6IFQpID0+IFIsIHNlZWQ6IFIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5mID0gKHQ6IFQpID0+IGYodGhpcy5hY2MsIHQpO1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkID0gc2VlZDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICAgIG91dC5fbih0aGlzLmFjYyk7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQ7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odGhpcy5hY2MgPSByIGFzIFIpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBMYXN0PFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdsYXN0JztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgaGFzOiBib29sZWFuO1xuICBwcml2YXRlIHZhbDogVDtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgdGhpcy52YWwgPSBOTyBhcyBUO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5oYXMgPSBmYWxzZTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnZhbCA9IE5PIGFzIFQ7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgdGhpcy5oYXMgPSB0cnVlO1xuICAgIHRoaXMudmFsID0gdDtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAodGhpcy5oYXMpIHtcbiAgICAgIHUuX24odGhpcy52YWwpO1xuICAgICAgdS5fYygpO1xuICAgIH0gZWxzZSB1Ll9lKG5ldyBFcnJvcignbGFzdCgpIGZhaWxlZCBiZWNhdXNlIGlucHV0IHN0cmVhbSBjb21wbGV0ZWQnKSk7XG4gIH1cbn1cblxuY2xhc3MgTWFwT3A8VCwgUj4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBSPiB7XG4gIHB1YmxpYyB0eXBlID0gJ21hcCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFI+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IFI7XG5cbiAgY29uc3RydWN0b3IocHJvamVjdDogKHQ6IFQpID0+IFIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5mID0gcHJvamVjdDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHIgYXMgUik7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIFJlbWVtYmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3JlbWVtYmVyJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG59XG5cbmNsYXNzIFJlcGxhY2VFcnJvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAncmVwbGFjZUVycm9yJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBmOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPjtcblxuICBjb25zdHJ1Y3RvcihyZXBsYWNlcjogKGVycjogYW55KSA9PiBTdHJlYW08VD4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5mID0gcmVwbGFjZXI7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgKHRoaXMuaW5zID0gdGhpcy5mKGVycikpLl9hZGQodGhpcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdS5fZShlKTtcbiAgICB9XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIFN0YXJ0V2l0aDxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdzdGFydFdpdGgnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIHZhbDogVDtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgdmFsOiBUKSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy52YWwgPSB2YWw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm91dC5fbih0aGlzLnZhbCk7XG4gICAgdGhpcy5pbnMuX2FkZChvdXQpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzLm91dCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cbn1cblxuY2xhc3MgVGFrZTxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAndGFrZSc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbWF4OiBudW1iZXI7XG4gIHByaXZhdGUgdGFrZW46IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihtYXg6IG51bWJlciwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm1heCA9IG1heDtcbiAgICB0aGlzLnRha2VuID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMudGFrZW4gPSAwO1xuICAgIGlmICh0aGlzLm1heCA8PSAwKSBvdXQuX2MoKTsgZWxzZSB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgbSA9ICsrdGhpcy50YWtlbjtcbiAgICBpZiAobSA8IHRoaXMubWF4KSB1Ll9uKHQpOyBlbHNlIGlmIChtID09PSB0aGlzLm1heCkge1xuICAgICAgdS5fbih0KTtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJlYW08VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHVibGljIF9wcm9kOiBJbnRlcm5hbFByb2R1Y2VyPFQ+O1xuICBwcm90ZWN0ZWQgX2lsczogQXJyYXk8SW50ZXJuYWxMaXN0ZW5lcjxUPj47IC8vICdpbHMnID0gSW50ZXJuYWwgbGlzdGVuZXJzXG4gIHByb3RlY3RlZCBfc3RvcElEOiBhbnk7XG4gIHByb3RlY3RlZCBfZGw6IEludGVybmFsTGlzdGVuZXI8VD47IC8vIHRoZSBkZWJ1ZyBsaXN0ZW5lclxuICBwcm90ZWN0ZWQgX2Q6IGJvb2xlYW47IC8vIGZsYWcgaW5kaWNhdGluZyB0aGUgZXhpc3RlbmNlIG9mIHRoZSBkZWJ1ZyBsaXN0ZW5lclxuICBwcm90ZWN0ZWQgX3RhcmdldDogU3RyZWFtPFQ+OyAvLyBpbWl0YXRpb24gdGFyZ2V0IGlmIHRoaXMgU3RyZWFtIHdpbGwgaW1pdGF0ZVxuICBwcm90ZWN0ZWQgX2VycjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHByb2R1Y2VyPzogSW50ZXJuYWxQcm9kdWNlcjxUPikge1xuICAgIHRoaXMuX3Byb2QgPSBwcm9kdWNlciB8fCBOTyBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+O1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIHRoaXMuX2RsID0gTk8gYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgdGhpcy5fdGFyZ2V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fbih0KTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9uKHQpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fbih0KTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9lcnIgIT09IE5PKSByZXR1cm47XG4gICAgdGhpcy5fZXJyID0gZXJyO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIHRoaXMuX3goKTtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX2UoZXJyKTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9lKGVycik7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9lKGVycik7XG4gICAgfVxuICAgIGlmICghdGhpcy5fZCAmJiBMID09IDApIHRocm93IHRoaXMuX2VycjtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIHRoaXMuX3goKTtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX2MoKTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9jKCk7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9jKCk7XG4gICAgfVxuICB9XG5cbiAgX3goKTogdm9pZCB7IC8vIHRlYXIgZG93biBsb2dpYywgYWZ0ZXIgZXJyb3Igb3IgY29tcGxldGVcbiAgICBpZiAodGhpcy5faWxzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTykgdGhpcy5fcHJvZC5fc3RvcCgpO1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgLy8gV0FSTklORzogY29kZSB0aGF0IGNhbGxzIHRoaXMgbWV0aG9kIHNob3VsZFxuICAgIC8vIGZpcnN0IGNoZWNrIGlmIHRoaXMuX3Byb2QgaXMgdmFsaWQgKG5vdCBgTk9gKVxuICAgIHRoaXMuX3Byb2QuX3N0b3AoKTtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHJldHVybjtcbiAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3N0b3BJRCk7XG4gICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgICBpZiAocCAhPT0gTk8pIHAuX3N0YXJ0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF9yZW1vdmUoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX3JlbW92ZShpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBpID0gYS5pbmRleE9mKGlsKTtcbiAgICBpZiAoaSA+IC0xKSB7XG4gICAgICBhLnNwbGljZShpLCAxKTtcbiAgICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTyAmJiBhLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgIHRoaXMuX2VyciA9IE5PO1xuICAgICAgICB0aGlzLl9zdG9wSUQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3N0b3BOb3coKSk7XG4gICAgICB9IGVsc2UgaWYgKGEubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHRoaXMuX3BydW5lQ3ljbGVzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgYWxsIHBhdGhzIHN0ZW1taW5nIGZyb20gYHRoaXNgIHN0cmVhbSBldmVudHVhbGx5IGVuZCBhdCBgdGhpc2BcbiAgLy8gc3RyZWFtLCB0aGVuIHdlIHJlbW92ZSB0aGUgc2luZ2xlIGxpc3RlbmVyIG9mIGB0aGlzYCBzdHJlYW0sIHRvXG4gIC8vIGZvcmNlIGl0IHRvIGVuZCBpdHMgZXhlY3V0aW9uIGFuZCBkaXNwb3NlIHJlc291cmNlcy4gVGhpcyBtZXRob2RcbiAgLy8gYXNzdW1lcyBhcyBhIHByZWNvbmRpdGlvbiB0aGF0IHRoaXMuX2lscyBoYXMganVzdCBvbmUgbGlzdGVuZXIuXG4gIF9wcnVuZUN5Y2xlcygpIHtcbiAgICBpZiAodGhpcy5faGFzTm9TaW5rcyh0aGlzLCBbXSkpIHRoaXMuX3JlbW92ZSh0aGlzLl9pbHNbMF0pO1xuICB9XG5cbiAgLy8gQ2hlY2tzIHdoZXRoZXIgKnRoZXJlIGlzIG5vKiBwYXRoIHN0YXJ0aW5nIGZyb20gYHhgIHRoYXQgbGVhZHMgdG8gYW4gZW5kXG4gIC8vIGxpc3RlbmVyIChzaW5rKSBpbiB0aGUgc3RyZWFtIGdyYXBoLCBmb2xsb3dpbmcgZWRnZXMgQS0+QiB3aGVyZSBCIGlzIGFcbiAgLy8gbGlzdGVuZXIgb2YgQS4gVGhpcyBtZWFucyB0aGVzZSBwYXRocyBjb25zdGl0dXRlIGEgY3ljbGUgc29tZWhvdy4gSXMgZ2l2ZW5cbiAgLy8gYSB0cmFjZSBvZiBhbGwgdmlzaXRlZCBub2RlcyBzbyBmYXIuXG4gIF9oYXNOb1NpbmtzKHg6IEludGVybmFsTGlzdGVuZXI8YW55PiwgdHJhY2U6IEFycmF5PGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAodHJhY2UuaW5kZXhPZih4KSAhPT0gLTEpXG4gICAgICByZXR1cm4gdHJ1ZTsgZWxzZVxuICAgIGlmICgoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCA9PT0gdGhpcylcbiAgICAgIHJldHVybiB0cnVlOyBlbHNlXG4gICAgaWYgKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ICYmICh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ICE9PSBOTylcbiAgICAgIHJldHVybiB0aGlzLl9oYXNOb1NpbmtzKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0LCB0cmFjZS5jb25jYXQoeCkpOyBlbHNlXG4gICAgaWYgKCh4IGFzIFN0cmVhbTxhbnk+KS5faWxzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgTiA9ICh4IGFzIFN0cmVhbTxhbnk+KS5faWxzLmxlbmd0aDsgaSA8IE47IGkrKylcbiAgICAgICAgaWYgKCF0aGlzLl9oYXNOb1NpbmtzKCh4IGFzIFN0cmVhbTxhbnk+KS5faWxzW2ldLCB0cmFjZS5jb25jYXQoeCkpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGN0b3IoKTogdHlwZW9mIFN0cmVhbSB7XG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBNZW1vcnlTdHJlYW0gPyBNZW1vcnlTdHJlYW0gOiBTdHJlYW07XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIExpc3RlbmVyIHRvIHRoZSBTdHJlYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXJ9IGxpc3RlbmVyXG4gICAqL1xuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiB2b2lkIHtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX24gPSBsaXN0ZW5lci5uZXh0IHx8IG5vb3A7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2MgPSBsaXN0ZW5lci5jb21wbGV0ZSB8fCBub29wO1xuICAgIHRoaXMuX2FkZChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgTGlzdGVuZXIgZnJvbSB0aGUgU3RyZWFtLCBhc3N1bWluZyB0aGUgTGlzdGVuZXIgd2FzIGFkZGVkIHRvIGl0LlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgKi9cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogdm9pZCB7XG4gICAgdGhpcy5fcmVtb3ZlKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtIHJldHVybmluZyBhIFN1YnNjcmlwdGlvbiB0byByZW1vdmUgdGhhdFxuICAgKiBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcn0gbGlzdGVuZXJcbiAgICogQHJldHVybnMge1N1YnNjcmlwdGlvbn1cbiAgICovXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiBTdWJzY3JpcHRpb24ge1xuICAgIHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiBuZXcgU3RyZWFtU3ViPFQ+KHRoaXMsIGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBpbnRlcm9wIGJldHdlZW4gbW9zdC5qcyBhbmQgUnhKUyA1XG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJlYW19XG4gICAqL1xuICBbJCRvYnNlcnZhYmxlXSgpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgU3RyZWFtIGdpdmVuIGEgUHJvZHVjZXIuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9kdWNlcn0gcHJvZHVjZXIgQW4gb3B0aW9uYWwgUHJvZHVjZXIgdGhhdCBkaWN0YXRlcyBob3cgdG9cbiAgICogc3RhcnQsIGdlbmVyYXRlIGV2ZW50cywgYW5kIHN0b3AgdGhlIFN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZTxUPihwcm9kdWNlcj86IFByb2R1Y2VyPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAocHJvZHVjZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgcHJvZHVjZXIuc3RhcnQgIT09ICdmdW5jdGlvbidcbiAgICAgIHx8IHR5cGVvZiBwcm9kdWNlci5zdG9wICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2R1Y2VyIHJlcXVpcmVzIGJvdGggc3RhcnQgYW5kIHN0b3AgZnVuY3Rpb25zJyk7XG4gICAgICBpbnRlcm5hbGl6ZVByb2R1Y2VyKHByb2R1Y2VyKTsgLy8gbXV0YXRlcyB0aGUgaW5wdXRcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTdHJlYW0ocHJvZHVjZXIgYXMgSW50ZXJuYWxQcm9kdWNlcjxUPiAmIFByb2R1Y2VyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE1lbW9yeVN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGVXaXRoTWVtb3J5PFQ+KHByb2R1Y2VyPzogUHJvZHVjZXI8VD4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIGlmIChwcm9kdWNlcikgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4ocHJvZHVjZXIgYXMgSW50ZXJuYWxQcm9kdWNlcjxUPiAmIFByb2R1Y2VyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgZG9lcyBub3RoaW5nIHdoZW4gc3RhcnRlZC4gSXQgbmV2ZXIgZW1pdHMgYW55IGV2ZW50LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAgICAgICAgICBuZXZlclxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgbmV2ZXIoKTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe19zdGFydDogbm9vcCwgX3N0b3A6IG5vb3B9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgdGhlIFwiY29tcGxldGVcIiBub3RpZmljYXRpb24gd2hlblxuICAgKiBzdGFydGVkLCBhbmQgdGhhdCdzIGl0LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBlbXB0eVxuICAgKiAtfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZW1wdHkoKTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe1xuICAgICAgX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHsgaWwuX2MoKTsgfSxcbiAgICAgIF9zdG9wOiBub29wLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyBhbiBcImVycm9yXCIgbm90aWZpY2F0aW9uIHdpdGggdGhlXG4gICAqIHZhbHVlIHlvdSBwYXNzZWQgYXMgdGhlIGBlcnJvcmAgYXJndW1lbnQgd2hlbiB0aGUgc3RyZWFtIHN0YXJ0cywgYW5kIHRoYXQnc1xuICAgKiBpdC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogdGhyb3coWClcbiAgICogLVhcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIGVycm9yIFRoZSBlcnJvciBldmVudCB0byBlbWl0IG9uIHRoZSBjcmVhdGVkIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIHRocm93KGVycm9yOiBhbnkpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7XG4gICAgICBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8YW55PikgeyBpbC5fZShlcnJvcik7IH0sXG4gICAgICBfc3RvcDogbm9vcCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RyZWFtIGZyb20gYW4gQXJyYXksIFByb21pc2UsIG9yIGFuIE9ic2VydmFibGUuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtBcnJheXxQcm9taXNlTGlrZXxPYnNlcnZhYmxlfSBpbnB1dCBUaGUgaW5wdXQgdG8gbWFrZSBhIHN0cmVhbSBmcm9tLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbTxUPihpbnB1dDogUHJvbWlzZUxpa2U8VD4gfCBTdHJlYW08VD4gfCBBcnJheTxUPiB8IE9ic2VydmFibGU8VD4pOiBTdHJlYW08VD4ge1xuICAgIGlmICh0eXBlb2YgaW5wdXRbJCRvYnNlcnZhYmxlXSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbU9ic2VydmFibGU8VD4oaW5wdXQgYXMgT2JzZXJ2YWJsZTxUPik7IGVsc2VcbiAgICBpZiAodHlwZW9mIChpbnB1dCBhcyBQcm9taXNlTGlrZTxUPikudGhlbiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbVByb21pc2U8VD4oaW5wdXQgYXMgUHJvbWlzZUxpa2U8VD4pOyBlbHNlXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXk8VD4oaW5wdXQpO1xuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVHlwZSBvZiBpbnB1dCB0byBmcm9tKCkgbXVzdCBiZSBhbiBBcnJheSwgUHJvbWlzZSwgb3IgT2JzZXJ2YWJsZWApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyB0aGUgYXJndW1lbnRzIHRoYXQgeW91IGdpdmUgdG9cbiAgICogKm9mKiwgdGhlbiBjb21wbGV0ZXMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIG9mKDEsMiwzKVxuICAgKiAxMjN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSBhIFRoZSBmaXJzdCB2YWx1ZSB5b3Ugd2FudCB0byBlbWl0IGFzIGFuIGV2ZW50IG9uIHRoZSBzdHJlYW0uXG4gICAqIEBwYXJhbSBiIFRoZSBzZWNvbmQgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLiBPbmVcbiAgICogb3IgbW9yZSBvZiB0aGVzZSB2YWx1ZXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG9mPFQ+KC4uLml0ZW1zOiBBcnJheTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXk8VD4oaXRlbXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIGFycmF5IHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCBzeW5jaHJvbm91c2x5XG4gICAqIGFsbCB0aGUgaXRlbXMgaW4gdGhlIGFycmF5LCBhbmQgdGhlbiBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZnJvbUFycmF5KFsxLDIsM10pXG4gICAqIDEyM3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21BcnJheTxUPihhcnJheTogQXJyYXk8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tQXJyYXk8VD4oYXJyYXkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIHByb21pc2UgdG8gYSBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gd2lsbCBlbWl0IHRoZSByZXNvbHZlZFxuICAgKiB2YWx1ZSBvZiB0aGUgcHJvbWlzZSwgYW5kIHRoZW4gY29tcGxldGUuIEhvd2V2ZXIsIGlmIHRoZSBwcm9taXNlIGlzXG4gICAqIHJlamVjdGVkLCB0aGUgc3RyZWFtIHdpbGwgZW1pdCB0aGUgY29ycmVzcG9uZGluZyBlcnJvci5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZnJvbVByb21pc2UoIC0tLS00MiApXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tNDJ8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvbWlzZUxpa2V9IHByb21pc2UgVGhlIHByb21pc2UgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbVByb21pc2U8VD4ocHJvbWlzZTogUHJvbWlzZUxpa2U8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tUHJvbWlzZTxUPihwcm9taXNlKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYW4gT2JzZXJ2YWJsZSBpbnRvIGEgU3RyZWFtLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7YW55fSBvYnNlcnZhYmxlIFRoZSBvYnNlcnZhYmxlIHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21PYnNlcnZhYmxlPFQ+KG9iczoge3N1YnNjcmliZTogYW55fSk6IFN0cmVhbTxUPiB7XG4gICAgaWYgKChvYnMgYXMgU3RyZWFtPFQ+KS5lbmRXaGVuKSByZXR1cm4gb2JzIGFzIFN0cmVhbTxUPjtcbiAgICBjb25zdCBvID0gdHlwZW9mIG9ic1skJG9ic2VydmFibGVdID09PSAnZnVuY3Rpb24nID8gb2JzWyQkb2JzZXJ2YWJsZV0oKSA6IG9icztcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbU9ic2VydmFibGUobykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzdHJlYW0gdGhhdCBwZXJpb2RpY2FsbHkgZW1pdHMgaW5jcmVtZW50YWwgbnVtYmVycywgZXZlcnlcbiAgICogYHBlcmlvZGAgbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAgICAgcGVyaW9kaWMoMTAwMClcbiAgICogLS0tMC0tLTEtLS0yLS0tMy0tLTQtLS0uLi5cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHBlcmlvZCBUaGUgaW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzIHRvIHVzZSBhcyBhIHJhdGUgb2ZcbiAgICogZW1pc3Npb24uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBwZXJpb2RpYyhwZXJpb2Q6IG51bWJlcik6IFN0cmVhbTxudW1iZXI+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxudW1iZXI+KG5ldyBQZXJpb2RpYyhwZXJpb2QpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCbGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgZW1pdHRpbmcgZXZlbnRzIGZyb20gYWxsIG9mIHRoZW1cbiAgICogY29uY3VycmVudGx5LlxuICAgKlxuICAgKiAqbWVyZ2UqIHRha2VzIG11bHRpcGxlIHN0cmVhbXMgYXMgYXJndW1lbnRzLCBhbmQgY3JlYXRlcyBhIHN0cmVhbSB0aGF0XG4gICAqIGJlaGF2ZXMgbGlrZSBlYWNoIG9mIHRoZSBhcmd1bWVudCBzdHJlYW1zLCBpbiBwYXJhbGxlbC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS1cbiAgICogLS0tLWEtLS0tLWItLS0tYy0tLWQtLS0tLS1cbiAgICogICAgICAgICAgICBtZXJnZVxuICAgKiAtLTEtYS0tMi0tYi0tMy1jLS0tZC0tNC0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBtZXJnZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIG1lcmdlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy4gVHdvXG4gICAqIG9yIG1vcmUgc3RyZWFtcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgbWVyZ2U6IE1lcmdlU2lnbmF0dXJlID0gZnVuY3Rpb24gbWVyZ2UoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55PihuZXcgTWVyZ2Uoc3RyZWFtcykpO1xuICB9IGFzIE1lcmdlU2lnbmF0dXJlO1xuXG4gIC8qKlxuICAgKiBDb21iaW5lcyBtdWx0aXBsZSBpbnB1dCBzdHJlYW1zIHRvZ2V0aGVyIHRvIHJldHVybiBhIHN0cmVhbSB3aG9zZSBldmVudHNcbiAgICogYXJlIGFycmF5cyB0aGF0IGNvbGxlY3QgdGhlIGxhdGVzdCBldmVudHMgZnJvbSBlYWNoIGlucHV0IHN0cmVhbS5cbiAgICpcbiAgICogKmNvbWJpbmUqIGludGVybmFsbHkgcmVtZW1iZXJzIHRoZSBtb3N0IHJlY2VudCBldmVudCBmcm9tIGVhY2ggb2YgdGhlIGlucHV0XG4gICAqIHN0cmVhbXMuIFdoZW4gYW55IG9mIHRoZSBpbnB1dCBzdHJlYW1zIGVtaXRzIGFuIGV2ZW50LCB0aGF0IGV2ZW50IHRvZ2V0aGVyXG4gICAqIHdpdGggYWxsIHRoZSBvdGhlciBzYXZlZCBldmVudHMgYXJlIGNvbWJpbmVkIGludG8gYW4gYXJyYXkuIFRoYXQgYXJyYXkgd2lsbFxuICAgKiBiZSBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBJdCdzIGVzc2VudGlhbGx5IGEgd2F5IG9mIGpvaW5pbmcgdG9nZXRoZXJcbiAgICogdGhlIGV2ZW50cyBmcm9tIG11bHRpcGxlIHN0cmVhbXMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gICAqIC0tLS1hLS0tLS1iLS0tLS1jLS1kLS0tLS0tXG4gICAqICAgICAgICAgIGNvbWJpbmVcbiAgICogLS0tLTFhLTJhLTJiLTNiLTNjLTNkLTRkLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gY29tYmluZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBNdWx0aXBsZSBzdHJlYW1zLCBub3QganVzdCB0d28sIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjb21iaW5lOiBDb21iaW5lU2lnbmF0dXJlID0gZnVuY3Rpb24gY29tYmluZSguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxBcnJheTxhbnk+PihuZXcgQ29tYmluZTxhbnk+KHN0cmVhbXMpKTtcbiAgfSBhcyBDb21iaW5lU2lnbmF0dXJlO1xuXG4gIHByb3RlY3RlZCBfbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogU3RyZWFtPFU+IHwgTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VT4obmV3IE1hcE9wPFQsIFU+KHByb2plY3QsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIHRocm91Z2ggYSBgcHJvamVjdGAgZnVuY3Rpb24sXG4gICAqIHRvIGdldCBhIFN0cmVhbSB0aGF0IGVtaXRzIHRob3NlIHRyYW5zZm9ybWVkIGV2ZW50cy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMy0tNS0tLS0tNy0tLS0tLVxuICAgKiAgICBtYXAoaSA9PiBpICogMTApXG4gICAqIC0tMTAtLTMwLTUwLS0tLTcwLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByb2plY3QgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gVWAgdGhhdCB0YWtlcyBldmVudFxuICAgKiBgdGAgb2YgdHlwZSBgVGAgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIGFuZCBwcm9kdWNlcyBhbiBldmVudCBvZiB0eXBlIGBVYCwgdG9cbiAgICogYmUgZW1pdHRlZCBvbiB0aGUgb3V0cHV0IFN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogU3RyZWFtPFU+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwKHByb2plY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0J3MgbGlrZSBgbWFwYCwgYnV0IHRyYW5zZm9ybXMgZWFjaCBpbnB1dCBldmVudCB0byBhbHdheXMgdGhlIHNhbWVcbiAgICogY29uc3RhbnQgdmFsdWUgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTMtLTUtLS0tLTctLS0tLVxuICAgKiAgICAgICBtYXBUbygxMClcbiAgICogLS0xMC0tMTAtMTAtLS0tMTAtLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gcHJvamVjdGVkVmFsdWUgQSB2YWx1ZSB0byBlbWl0IG9uIHRoZSBvdXRwdXQgU3RyZWFtIHdoZW5ldmVyIHRoZVxuICAgKiBpbnB1dCBTdHJlYW0gZW1pdHMgYW55IHZhbHVlLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBtYXBUbzxVPihwcm9qZWN0ZWRWYWx1ZTogVSk6IFN0cmVhbTxVPiB7XG4gICAgY29uc3QgcyA9IHRoaXMubWFwKCgpID0+IHByb2plY3RlZFZhbHVlKTtcbiAgICBjb25zdCBvcDogT3BlcmF0b3I8VCwgVT4gPSBzLl9wcm9kIGFzIE9wZXJhdG9yPFQsIFU+O1xuICAgIG9wLnR5cGUgPSAnbWFwVG8nO1xuICAgIHJldHVybiBzO1xuICB9XG5cbiAgZmlsdGVyPFMgZXh0ZW5kcyBUPihwYXNzZXM6ICh0OiBUKSA9PiB0IGlzIFMpOiBTdHJlYW08Uz47XG4gIGZpbHRlcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuKTogU3RyZWFtPFQ+O1xuICAvKipcbiAgICogT25seSBhbGxvd3MgZXZlbnRzIHRoYXQgcGFzcyB0aGUgdGVzdCBnaXZlbiBieSB0aGUgYHBhc3Nlc2AgYXJndW1lbnQuXG4gICAqXG4gICAqIEVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGlzIGdpdmVuIHRvIHRoZSBgcGFzc2VzYCBmdW5jdGlvbi4gSWYgdGhlXG4gICAqIGZ1bmN0aW9uIHJldHVybnMgYHRydWVgLCB0aGUgZXZlbnQgaXMgZm9yd2FyZGVkIHRvIHRoZSBvdXRwdXQgc3RyZWFtLFxuICAgKiBvdGhlcndpc2UgaXQgaXMgaWdub3JlZCBhbmQgbm90IGZvcndhcmRlZC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMi0tMy0tLS0tNC0tLS0tNS0tLTYtLTctOC0tXG4gICAqICAgICBmaWx0ZXIoaSA9PiBpICUgMiA9PT0gMClcbiAgICogLS0tLS0tMi0tLS0tLS0tNC0tLS0tLS0tLTYtLS0tOC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwYXNzZXMgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gYm9vbGVhbmAgdGhhdCB0YWtlc1xuICAgKiBhbiBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gYW5kIGNoZWNrcyBpZiBpdCBwYXNzZXMsIGJ5IHJldHVybmluZyBhXG4gICAqIGJvb2xlYW4uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGZpbHRlcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuKTogU3RyZWFtPFQ+IHtcbiAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICBpZiAocCBpbnN0YW5jZW9mIEZpbHRlcilcbiAgICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGaWx0ZXI8VD4oXG4gICAgICAgIGFuZCgocCBhcyBGaWx0ZXI8VD4pLmYsIHBhc3NlcyksXG4gICAgICAgIChwIGFzIEZpbHRlcjxUPikuaW5zXG4gICAgICApKTtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRmlsdGVyPFQ+KHBhc3NlcywgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIExldHMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSBwYXNzIHRvIHRoZVxuICAgKiBvdXRwdXQgc3RyZWFtLCB0aGVuIG1ha2VzIHRoZSBvdXRwdXQgc3RyZWFtIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICogICAgdGFrZSgzKVxuICAgKiAtLWEtLS1iLS1jfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCBIb3cgbWFueSBldmVudHMgdG8gYWxsb3cgZnJvbSB0aGUgaW5wdXQgc3RyZWFtXG4gICAqIGJlZm9yZSBjb21wbGV0aW5nIHRoZSBvdXRwdXQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICB0YWtlKGFtb3VudDogbnVtYmVyKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IFRha2U8VD4oYW1vdW50LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogSWdub3JlcyB0aGUgZmlyc3QgYGFtb3VudGAgbWFueSBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtLCBhbmQgdGhlblxuICAgKiBhZnRlciB0aGF0IHN0YXJ0cyBmb3J3YXJkaW5nIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dFxuICAgKiBzdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLS0tZC0tLWUtLVxuICAgKiAgICAgICBkcm9wKDMpXG4gICAqIC0tLS0tLS0tLS0tLS0tZC0tLWUtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCBIb3cgbWFueSBldmVudHMgdG8gaWdub3JlIGZyb20gdGhlIGlucHV0IHN0cmVhbVxuICAgKiBiZWZvcmUgZm9yd2FyZGluZyBhbGwgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSB0byB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZHJvcChhbW91bnQ6IG51bWJlcik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERyb3A8VD4oYW1vdW50LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiB0aGUgaW5wdXQgc3RyZWFtIGNvbXBsZXRlcywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBlbWl0IHRoZSBsYXN0IGV2ZW50XG4gICAqIGVtaXR0ZWQgYnkgdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW4gd2lsbCBhbHNvIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS1kLS0tLXxcbiAgICogICAgICAgbGFzdCgpXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tZHxcbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGxhc3QoKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgTGFzdDxUPih0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogUHJlcGVuZHMgdGhlIGdpdmVuIGBpbml0aWFsYCB2YWx1ZSB0byB0aGUgc2VxdWVuY2Ugb2YgZXZlbnRzIGVtaXR0ZWQgYnkgdGhlXG4gICAqIGlucHV0IHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXNcbiAgICogYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tMS0tLTItLS0tLTMtLS1cbiAgICogICBzdGFydFdpdGgoMClcbiAgICogMC0tMS0tLTItLS0tLTMtLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBpbml0aWFsIFRoZSB2YWx1ZSBvciBldmVudCB0byBwcmVwZW5kLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBzdGFydFdpdGgoaW5pdGlhbDogVCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4obmV3IFN0YXJ0V2l0aDxUPih0aGlzLCBpbml0aWFsKSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlcyBhbm90aGVyIHN0cmVhbSB0byBkZXRlcm1pbmUgd2hlbiB0byBjb21wbGV0ZSB0aGUgY3VycmVudCBzdHJlYW0uXG4gICAqXG4gICAqIFdoZW4gdGhlIGdpdmVuIGBvdGhlcmAgc3RyZWFtIGVtaXRzIGFuIGV2ZW50IG9yIGNvbXBsZXRlcywgdGhlIG91dHB1dFxuICAgKiBzdHJlYW0gd2lsbCBjb21wbGV0ZS4gQmVmb3JlIHRoYXQgaGFwcGVucywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBiZWhhdmVzXG4gICAqIGxpa2UgdGhlIGlucHV0IHN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tMS0tLTItLS0tLTMtLTQtLS0tNS0tLS02LS0tXG4gICAqICAgZW5kV2hlbiggLS0tLS0tLS1hLS1iLS18IClcbiAgICogLS0tMS0tLTItLS0tLTMtLTQtLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBvdGhlciBTb21lIG90aGVyIHN0cmVhbSB0aGF0IGlzIHVzZWQgdG8ga25vdyB3aGVuIHNob3VsZCB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbSBvZiB0aGlzIG9wZXJhdG9yIGNvbXBsZXRlLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBFbmRXaGVuPFQ+KG90aGVyLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogXCJGb2xkc1wiIHRoZSBzdHJlYW0gb250byBpdHNlbGYuXG4gICAqXG4gICAqIENvbWJpbmVzIGV2ZW50cyBmcm9tIHRoZSBwYXN0IHRocm91Z2hvdXRcbiAgICogdGhlIGVudGlyZSBleGVjdXRpb24gb2YgdGhlIGlucHV0IHN0cmVhbSwgYWxsb3dpbmcgeW91IHRvIGFjY3VtdWxhdGUgdGhlbVxuICAgKiB0b2dldGhlci4gSXQncyBlc3NlbnRpYWxseSBsaWtlIGBBcnJheS5wcm90b3R5cGUucmVkdWNlYC4gVGhlIHJldHVybmVkXG4gICAqIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXMgYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICpcbiAgICogVGhlIG91dHB1dCBzdHJlYW0gc3RhcnRzIGJ5IGVtaXR0aW5nIHRoZSBgc2VlZGAgd2hpY2ggeW91IGdpdmUgYXMgYXJndW1lbnQuXG4gICAqIFRoZW4sIHdoZW4gYW4gZXZlbnQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpdCBpcyBjb21iaW5lZCB3aXRoIHRoYXRcbiAgICogc2VlZCB2YWx1ZSB0aHJvdWdoIHRoZSBgYWNjdW11bGF0ZWAgZnVuY3Rpb24sIGFuZCB0aGUgb3V0cHV0IHZhbHVlIGlzXG4gICAqIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBzdHJlYW0uIGBmb2xkYCByZW1lbWJlcnMgdGhhdCBvdXRwdXQgdmFsdWUgYXMgYGFjY2BcbiAgICogKFwiYWNjdW11bGF0b3JcIiksIGFuZCB0aGVuIHdoZW4gYSBuZXcgaW5wdXQgZXZlbnQgYHRgIGhhcHBlbnMsIGBhY2NgIHdpbGwgYmVcbiAgICogY29tYmluZWQgd2l0aCB0aGF0IHRvIHByb2R1Y2UgdGhlIG5ldyBgYWNjYCBhbmQgc28gZm9ydGguXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLS0tLTEtLS0tLTEtLTItLS0tMS0tLS0xLS0tLS0tXG4gICAqICAgZm9sZCgoYWNjLCB4KSA9PiBhY2MgKyB4LCAzKVxuICAgKiAzLS0tLS00LS0tLS01LS03LS0tLTgtLS0tOS0tLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gYWNjdW11bGF0ZSBBIGZ1bmN0aW9uIG9mIHR5cGUgYChhY2M6IFIsIHQ6IFQpID0+IFJgIHRoYXRcbiAgICogdGFrZXMgdGhlIHByZXZpb3VzIGFjY3VtdWxhdGVkIHZhbHVlIGBhY2NgIGFuZCB0aGUgaW5jb21pbmcgZXZlbnQgZnJvbSB0aGVcbiAgICogaW5wdXQgc3RyZWFtIGFuZCBwcm9kdWNlcyB0aGUgbmV3IGFjY3VtdWxhdGVkIHZhbHVlLlxuICAgKiBAcGFyYW0gc2VlZCBUaGUgaW5pdGlhbCBhY2N1bXVsYXRlZCB2YWx1ZSwgb2YgdHlwZSBgUmAuXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIGZvbGQ8Uj4oYWNjdW11bGF0ZTogKGFjYzogUiwgdDogVCkgPT4gUiwgc2VlZDogUik6IE1lbW9yeVN0cmVhbTxSPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08Uj4obmV3IEZvbGQ8VCwgUj4oYWNjdW11bGF0ZSwgc2VlZCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcGxhY2VzIGFuIGVycm9yIHdpdGggYW5vdGhlciBzdHJlYW0uXG4gICAqXG4gICAqIFdoZW4gKGFuZCBpZikgYW4gZXJyb3IgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpbnN0ZWFkIG9mIGZvcndhcmRpbmdcbiAgICogdGhhdCBlcnJvciB0byB0aGUgb3V0cHV0IHN0cmVhbSwgKnJlcGxhY2VFcnJvciogd2lsbCBjYWxsIHRoZSBgcmVwbGFjZWBcbiAgICogZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgc3RyZWFtIHRoYXQgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCByZXBsaWNhdGUuXG4gICAqIEFuZCwgaW4gY2FzZSB0aGF0IG5ldyBzdHJlYW0gYWxzbyBlbWl0cyBhbiBlcnJvciwgYHJlcGxhY2VgIHdpbGwgYmUgY2FsbGVkXG4gICAqIGFnYWluIHRvIGdldCBhbm90aGVyIHN0cmVhbSB0byBzdGFydCByZXBsaWNhdGluZy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMi0tLS0tMy0tNC0tLS0tWFxuICAgKiAgIHJlcGxhY2VFcnJvciggKCkgPT4gLS0xMC0tfCApXG4gICAqIC0tMS0tLTItLS0tLTMtLTQtLS0tLS0tLTEwLS18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXBsYWNlIEEgZnVuY3Rpb24gb2YgdHlwZSBgKGVycikgPT4gU3RyZWFtYCB0aGF0IHRha2VzXG4gICAqIHRoZSBlcnJvciB0aGF0IG9jY3VycmVkIG9uIHRoZSBpbnB1dCBzdHJlYW0gb3Igb24gdGhlIHByZXZpb3VzIHJlcGxhY2VtZW50XG4gICAqIHN0cmVhbSBhbmQgcmV0dXJucyBhIG5ldyBzdHJlYW0uIFRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgYmVoYXZlIGxpa2UgdGhlXG4gICAqIHN0cmVhbSB0aGF0IHRoaXMgZnVuY3Rpb24gcmV0dXJucy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgcmVwbGFjZUVycm9yKHJlcGxhY2U6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IFJlcGxhY2VFcnJvcjxUPihyZXBsYWNlLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogRmxhdHRlbnMgYSBcInN0cmVhbSBvZiBzdHJlYW1zXCIsIGhhbmRsaW5nIG9ubHkgb25lIG5lc3RlZCBzdHJlYW0gYXQgYSB0aW1lXG4gICAqIChubyBjb25jdXJyZW5jeSkuXG4gICAqXG4gICAqIElmIHRoZSBpbnB1dCBzdHJlYW0gaXMgYSBzdHJlYW0gdGhhdCBlbWl0cyBzdHJlYW1zLCB0aGVuIHRoaXMgb3BlcmF0b3Igd2lsbFxuICAgKiByZXR1cm4gYW4gb3V0cHV0IHN0cmVhbSB3aGljaCBpcyBhIGZsYXQgc3RyZWFtOiBlbWl0cyByZWd1bGFyIGV2ZW50cy4gVGhlXG4gICAqIGZsYXR0ZW5pbmcgaGFwcGVucyB3aXRob3V0IGNvbmN1cnJlbmN5LiBJdCB3b3JrcyBsaWtlIHRoaXM6IHdoZW4gdGhlIGlucHV0XG4gICAqIHN0cmVhbSBlbWl0cyBhIG5lc3RlZCBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIHN0YXJ0IGltaXRhdGluZyB0aGF0IG5lc3RlZFxuICAgKiBvbmUuIEhvd2V2ZXIsIGFzIHNvb24gYXMgdGhlIG5leHQgbmVzdGVkIHN0cmVhbSBpcyBlbWl0dGVkIG9uIHRoZSBpbnB1dFxuICAgKiBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIGZvcmdldCB0aGUgcHJldmlvdXMgbmVzdGVkIG9uZSBpdCB3YXMgaW1pdGF0aW5nLCBhbmRcbiAgICogd2lsbCBzdGFydCBpbWl0YXRpbmcgdGhlIG5ldyBuZXN0ZWQgb25lLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLSstLS0tLS0tLSstLS0tLS0tLS0tLS0tLS1cbiAgICogICBcXCAgICAgICAgXFxcbiAgICogICAgXFwgICAgICAgLS0tLTEtLS0tMi0tLTMtLVxuICAgKiAgICAtLWEtLWItLS0tYy0tLS1kLS0tLS0tLS1cbiAgICogICAgICAgICAgIGZsYXR0ZW5cbiAgICogLS0tLS1hLS1iLS0tLS0tMS0tLS0yLS0tMy0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBmbGF0dGVuPFI+KHRoaXM6IFN0cmVhbTxTdHJlYW08Uj4+KTogVCB7XG4gICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08Uj4obmV3IEZsYXR0ZW4odGhpcykpIGFzIFQgJiBTdHJlYW08Uj47XG4gIH1cblxuICAvKipcbiAgICogUGFzc2VzIHRoZSBpbnB1dCBzdHJlYW0gdG8gYSBjdXN0b20gb3BlcmF0b3IsIHRvIHByb2R1Y2UgYW4gb3V0cHV0IHN0cmVhbS5cbiAgICpcbiAgICogKmNvbXBvc2UqIGlzIGEgaGFuZHkgd2F5IG9mIHVzaW5nIGFuIGV4aXN0aW5nIGZ1bmN0aW9uIGluIGEgY2hhaW5lZCBzdHlsZS5cbiAgICogSW5zdGVhZCBvZiB3cml0aW5nIGBvdXRTdHJlYW0gPSBmKGluU3RyZWFtKWAgeW91IGNhbiB3cml0ZVxuICAgKiBgb3V0U3RyZWFtID0gaW5TdHJlYW0uY29tcG9zZShmKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9wZXJhdG9yIEEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHN0cmVhbSBhcyBpbnB1dCBhbmRcbiAgICogcmV0dXJucyBhIHN0cmVhbSBhcyB3ZWxsLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBjb21wb3NlPFU+KG9wZXJhdG9yOiAoc3RyZWFtOiBTdHJlYW08VD4pID0+IFUpOiBVIHtcbiAgICByZXR1cm4gb3BlcmF0b3IodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sIGJ1dCBhbHNvXG4gICAqIHJlbWVtYmVycyB0aGUgbW9zdCByZWNlbnQgZXZlbnQgdGhhdCBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIHNvIHRoYXQgYVxuICAgKiBuZXdseSBhZGRlZCBsaXN0ZW5lciB3aWxsIGltbWVkaWF0ZWx5IHJlY2VpdmUgdGhhdCBtZW1vcmlzZWQgZXZlbnQuXG4gICAqXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHJlbWVtYmVyKCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4obmV3IFJlbWVtYmVyPFQ+KHRoaXMpKTtcbiAgfVxuXG4gIGRlYnVnKCk6IFN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogc3RyaW5nKTogU3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiAodDogVCkgPT4gYW55KTogU3RyZWFtPFQ+O1xuICAvKipcbiAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgaWRlbnRpY2FsbHkgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sXG4gICAqIGJ1dCBhbHNvIHJ1bnMgYSBgc3B5YCBmdW5jdGlvbiBmb3IgZWFjaCBldmVudCwgdG8gaGVscCB5b3UgZGVidWcgeW91ciBhcHAuXG4gICAqXG4gICAqICpkZWJ1ZyogdGFrZXMgYSBgc3B5YCBmdW5jdGlvbiBhcyBhcmd1bWVudCwgYW5kIHJ1bnMgdGhhdCBmb3IgZWFjaCBldmVudFxuICAgKiBoYXBwZW5pbmcgb24gdGhlIGlucHV0IHN0cmVhbS4gSWYgeW91IGRvbid0IHByb3ZpZGUgdGhlIGBzcHlgIGFyZ3VtZW50LFxuICAgKiB0aGVuICpkZWJ1Zyogd2lsbCBqdXN0IGBjb25zb2xlLmxvZ2AgZWFjaCBldmVudC4gVGhpcyBoZWxwcyB5b3UgdG9cbiAgICogdW5kZXJzdGFuZCB0aGUgZmxvdyBvZiBldmVudHMgdGhyb3VnaCBzb21lIG9wZXJhdG9yIGNoYWluLlxuICAgKlxuICAgKiBQbGVhc2Ugbm90ZSB0aGF0IGlmIHRoZSBvdXRwdXQgc3RyZWFtIGhhcyBubyBsaXN0ZW5lcnMsIHRoZW4gaXQgd2lsbCBub3RcbiAgICogc3RhcnQsIHdoaWNoIG1lYW5zIGBzcHlgIHdpbGwgbmV2ZXIgcnVuIGJlY2F1c2Ugbm8gYWN0dWFsIGV2ZW50IGhhcHBlbnMgaW5cbiAgICogdGhhdCBjYXNlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tNC0tXG4gICAqICAgICAgICAgZGVidWdcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLTQtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGFiZWxPclNweSBBIHN0cmluZyB0byB1c2UgYXMgdGhlIGxhYmVsIHdoZW4gcHJpbnRpbmdcbiAgICogZGVidWcgaW5mb3JtYXRpb24gb24gdGhlIGNvbnNvbGUsIG9yIGEgJ3NweScgZnVuY3Rpb24gdGhhdCB0YWtlcyBhbiBldmVudFxuICAgKiBhcyBhcmd1bWVudCwgYW5kIGRvZXMgbm90IG5lZWQgdG8gcmV0dXJuIGFueXRoaW5nLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBkZWJ1ZyhsYWJlbE9yU3B5Pzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IERlYnVnPFQ+KHRoaXMsIGxhYmVsT3JTcHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAqaW1pdGF0ZSogY2hhbmdlcyB0aGlzIGN1cnJlbnQgU3RyZWFtIHRvIGVtaXQgdGhlIHNhbWUgZXZlbnRzIHRoYXQgdGhlXG4gICAqIGBvdGhlcmAgZ2l2ZW4gU3RyZWFtIGRvZXMuIFRoaXMgbWV0aG9kIHJldHVybnMgbm90aGluZy5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgZXhpc3RzIHRvIGFsbG93IG9uZSB0aGluZzogKipjaXJjdWxhciBkZXBlbmRlbmN5IG9mIHN0cmVhbXMqKi5cbiAgICogRm9yIGluc3RhbmNlLCBsZXQncyBpbWFnaW5lIHRoYXQgZm9yIHNvbWUgcmVhc29uIHlvdSBuZWVkIHRvIGNyZWF0ZSBhXG4gICAqIGNpcmN1bGFyIGRlcGVuZGVuY3kgd2hlcmUgc3RyZWFtIGBmaXJzdCRgIGRlcGVuZHMgb24gc3RyZWFtIGBzZWNvbmQkYFxuICAgKiB3aGljaCBpbiB0dXJuIGRlcGVuZHMgb24gYGZpcnN0JGA6XG4gICAqXG4gICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgKiBgYGBqc1xuICAgKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAgICpcbiAgICogdmFyIGZpcnN0JCA9IHNlY29uZCQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBIb3dldmVyLCB0aGF0IGlzIGludmFsaWQgSmF2YVNjcmlwdCwgYmVjYXVzZSBgc2Vjb25kJGAgaXMgdW5kZWZpbmVkXG4gICAqIG9uIHRoZSBmaXJzdCBsaW5lLiBUaGlzIGlzIGhvdyAqaW1pdGF0ZSogY2FuIGhlbHAgc29sdmUgaXQ6XG4gICAqXG4gICAqIGBgYGpzXG4gICAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICAgKlxuICAgKiB2YXIgc2Vjb25kUHJveHkkID0geHMuY3JlYXRlKCk7XG4gICAqIHZhciBmaXJzdCQgPSBzZWNvbmRQcm94eSQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAqIHNlY29uZFByb3h5JC5pbWl0YXRlKHNlY29uZCQpO1xuICAgKiBgYGBcbiAgICpcbiAgICogV2UgY3JlYXRlIGBzZWNvbmRQcm94eSRgIGJlZm9yZSB0aGUgb3RoZXJzLCBzbyBpdCBjYW4gYmUgdXNlZCBpbiB0aGVcbiAgICogZGVjbGFyYXRpb24gb2YgYGZpcnN0JGAuIFRoZW4sIGFmdGVyIGJvdGggYGZpcnN0JGAgYW5kIGBzZWNvbmQkYCBhcmVcbiAgICogZGVmaW5lZCwgd2UgaG9vayBgc2Vjb25kUHJveHkkYCB3aXRoIGBzZWNvbmQkYCB3aXRoIGBpbWl0YXRlKClgIHRvIHRlbGxcbiAgICogdGhhdCB0aGV5IGFyZSBcInRoZSBzYW1lXCIuIGBpbWl0YXRlYCB3aWxsIG5vdCB0cmlnZ2VyIHRoZSBzdGFydCBvZiBhbnlcbiAgICogc3RyZWFtLCBpdCBqdXN0IGJpbmRzIGBzZWNvbmRQcm94eSRgIGFuZCBgc2Vjb25kJGAgdG9nZXRoZXIuXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgaXMgYW4gZXhhbXBsZSB3aGVyZSBgaW1pdGF0ZSgpYCBpcyBpbXBvcnRhbnQgaW4gQ3ljbGUuanNcbiAgICogYXBwbGljYXRpb25zLiBBIHBhcmVudCBjb21wb25lbnQgY29udGFpbnMgc29tZSBjaGlsZCBjb21wb25lbnRzLiBBIGNoaWxkXG4gICAqIGhhcyBhbiBhY3Rpb24gc3RyZWFtIHdoaWNoIGlzIGdpdmVuIHRvIHRoZSBwYXJlbnQgdG8gZGVmaW5lIGl0cyBzdGF0ZTpcbiAgICpcbiAgICogPCEtLSBza2lwLWV4YW1wbGUgLS0+XG4gICAqIGBgYGpzXG4gICAqIGNvbnN0IGNoaWxkQWN0aW9uUHJveHkkID0geHMuY3JlYXRlKCk7XG4gICAqIGNvbnN0IHBhcmVudCA9IFBhcmVudCh7Li4uc291cmNlcywgY2hpbGRBY3Rpb24kOiBjaGlsZEFjdGlvblByb3h5JH0pO1xuICAgKiBjb25zdCBjaGlsZEFjdGlvbiQgPSBwYXJlbnQuc3RhdGUkLm1hcChzID0+IHMuY2hpbGQuYWN0aW9uJCkuZmxhdHRlbigpO1xuICAgKiBjaGlsZEFjdGlvblByb3h5JC5pbWl0YXRlKGNoaWxkQWN0aW9uJCk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBOb3RlLCB0aG91Z2gsIHRoYXQgKipgaW1pdGF0ZSgpYCBkb2VzIG5vdCBzdXBwb3J0IE1lbW9yeVN0cmVhbXMqKi4gSWYgd2VcbiAgICogd291bGQgYXR0ZW1wdCB0byBpbWl0YXRlIGEgTWVtb3J5U3RyZWFtIGluIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSwgd2Ugd291bGRcbiAgICogZWl0aGVyIGdldCBhIHJhY2UgY29uZGl0aW9uICh3aGVyZSB0aGUgc3ltcHRvbSB3b3VsZCBiZSBcIm5vdGhpbmcgaGFwcGVuc1wiKVxuICAgKiBvciBhbiBpbmZpbml0ZSBjeWNsaWMgZW1pc3Npb24gb2YgdmFsdWVzLiBJdCdzIHVzZWZ1bCB0byB0aGluayBhYm91dFxuICAgKiBNZW1vcnlTdHJlYW1zIGFzIGNlbGxzIGluIGEgc3ByZWFkc2hlZXQuIEl0IGRvZXNuJ3QgbWFrZSBhbnkgc2Vuc2UgdG9cbiAgICogZGVmaW5lIGEgc3ByZWFkc2hlZXQgY2VsbCBgQTFgIHdpdGggYSBmb3JtdWxhIHRoYXQgZGVwZW5kcyBvbiBgQjFgIGFuZFxuICAgKiBjZWxsIGBCMWAgZGVmaW5lZCB3aXRoIGEgZm9ybXVsYSB0aGF0IGRlcGVuZHMgb24gYEExYC5cbiAgICpcbiAgICogSWYgeW91IGZpbmQgeW91cnNlbGYgd2FudGluZyB0byB1c2UgYGltaXRhdGUoKWAgd2l0aCBhXG4gICAqIE1lbW9yeVN0cmVhbSwgeW91IHNob3VsZCByZXdvcmsgeW91ciBjb2RlIGFyb3VuZCBgaW1pdGF0ZSgpYCB0byB1c2UgYVxuICAgKiBTdHJlYW0gaW5zdGVhZC4gTG9vayBmb3IgdGhlIHN0cmVhbSBpbiB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeSB0aGF0XG4gICAqIHJlcHJlc2VudHMgYW4gZXZlbnQgc3RyZWFtLCBhbmQgdGhhdCB3b3VsZCBiZSBhIGNhbmRpZGF0ZSBmb3IgY3JlYXRpbmcgYVxuICAgKiBwcm94eSBTdHJlYW0gd2hpY2ggdGhlbiBpbWl0YXRlcyB0aGUgdGFyZ2V0IFN0cmVhbS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJlYW19IHRhcmdldCBUaGUgb3RoZXIgc3RyZWFtIHRvIGltaXRhdGUgb24gdGhlIGN1cnJlbnQgb25lLiBNdXN0XG4gICAqIG5vdCBiZSBhIE1lbW9yeVN0cmVhbS5cbiAgICovXG4gIGltaXRhdGUodGFyZ2V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIE1lbW9yeVN0cmVhbSB3YXMgZ2l2ZW4gdG8gaW1pdGF0ZSgpLCBidXQgaXQgb25seSAnICtcbiAgICAgICdzdXBwb3J0cyBhIFN0cmVhbS4gUmVhZCBtb3JlIGFib3V0IHRoaXMgcmVzdHJpY3Rpb24gaGVyZTogJyArXG4gICAgICAnaHR0cHM6Ly9naXRodWIuY29tL3N0YWx0ei94c3RyZWFtI2ZhcScpO1xuICAgIHRoaXMuX3RhcmdldCA9IHRhcmdldDtcbiAgICBmb3IgKGxldCBpbHMgPSB0aGlzLl9pbHMsIE4gPSBpbHMubGVuZ3RoLCBpID0gMDsgaSA8IE47IGkrKykgdGFyZ2V0Ll9hZGQoaWxzW2ldKTtcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiB2YWx1ZSB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIFRoZSBcIm5leHRcIiB2YWx1ZSB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIGxpc3RlbmVycyBvZlxuICAgKiB0aGlzIFN0cmVhbS5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kTmV4dCh2YWx1ZTogVCkge1xuICAgIHRoaXMuX24odmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIGdpdmVuIGVycm9yIHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gZXJyb3IgVGhlIGVycm9yIHlvdSB3YW50IHRvIGJyb2FkY2FzdCB0byBhbGwgdGhlIGxpc3RlbmVycyBvZlxuICAgKiB0aGlzIFN0cmVhbS5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kRXJyb3IoZXJyb3I6IGFueSkge1xuICAgIHRoaXMuX2UoZXJyb3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIFwiY29tcGxldGVkXCIgZXZlbnQgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZENvbXBsZXRlKCkge1xuICAgIHRoaXMuX2MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgXCJkZWJ1Z1wiIGxpc3RlbmVyIHRvIHRoZSBzdHJlYW0uIFRoZXJlIGNhbiBvbmx5IGJlIG9uZSBkZWJ1Z1xuICAgKiBsaXN0ZW5lciwgdGhhdCdzIHdoeSB0aGlzIGlzICdzZXREZWJ1Z0xpc3RlbmVyJy4gVG8gcmVtb3ZlIHRoZSBkZWJ1Z1xuICAgKiBsaXN0ZW5lciwganVzdCBjYWxsIHNldERlYnVnTGlzdGVuZXIobnVsbCkuXG4gICAqXG4gICAqIEEgZGVidWcgbGlzdGVuZXIgaXMgbGlrZSBhbnkgb3RoZXIgbGlzdGVuZXIuIFRoZSBvbmx5IGRpZmZlcmVuY2UgaXMgdGhhdCBhXG4gICAqIGRlYnVnIGxpc3RlbmVyIGlzIFwic3RlYWx0aHlcIjogaXRzIHByZXNlbmNlL2Fic2VuY2UgZG9lcyBub3QgdHJpZ2dlciB0aGVcbiAgICogc3RhcnQvc3RvcCBvZiB0aGUgc3RyZWFtIChvciB0aGUgcHJvZHVjZXIgaW5zaWRlIHRoZSBzdHJlYW0pLiBUaGlzIGlzXG4gICAqIHVzZWZ1bCBzbyB5b3UgY2FuIGluc3BlY3Qgd2hhdCBpcyBnb2luZyBvbiB3aXRob3V0IGNoYW5naW5nIHRoZSBiZWhhdmlvclxuICAgKiBvZiB0aGUgcHJvZ3JhbS4gSWYgeW91IGhhdmUgYW4gaWRsZSBzdHJlYW0gYW5kIHlvdSBhZGQgYSBub3JtYWwgbGlzdGVuZXIgdG9cbiAgICogaXQsIHRoZSBzdHJlYW0gd2lsbCBzdGFydCBleGVjdXRpbmcuIEJ1dCBpZiB5b3Ugc2V0IGEgZGVidWcgbGlzdGVuZXIgb24gYW5cbiAgICogaWRsZSBzdHJlYW0sIGl0IHdvbid0IHN0YXJ0IGV4ZWN1dGluZyAobm90IHVudGlsIHRoZSBmaXJzdCBub3JtYWwgbGlzdGVuZXJcbiAgICogaXMgYWRkZWQpLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIHdlIGRvbid0IHJlY29tbWVuZCB1c2luZyB0aGlzIG1ldGhvZCB0byBidWlsZCBhcHBcbiAgICogbG9naWMuIEluIGZhY3QsIGluIG1vc3QgY2FzZXMgdGhlIGRlYnVnIG9wZXJhdG9yIHdvcmtzIGp1c3QgZmluZS4gT25seSB1c2VcbiAgICogdGhpcyBvbmUgaWYgeW91IGtub3cgd2hhdCB5b3UncmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXI8VD59IGxpc3RlbmVyXG4gICAqL1xuICBzZXREZWJ1Z0xpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+PiB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgICB0aGlzLl9kbCA9IE5PIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2QgPSB0cnVlO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9uID0gbGlzdGVuZXIubmV4dCB8fCBub29wO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fYyA9IGxpc3RlbmVyLmNvbXBsZXRlIHx8IG5vb3A7XG4gICAgICB0aGlzLl9kbCA9IGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdHJlYW08VD4gZXh0ZW5kcyBTdHJlYW08VD4ge1xuICBwcml2YXRlIF92OiBUO1xuICBwcml2YXRlIF9oYXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29uc3RydWN0b3IocHJvZHVjZXI6IEludGVybmFsUHJvZHVjZXI8VD4pIHtcbiAgICBzdXBlcihwcm9kdWNlcik7XG4gIH1cblxuICBfbih4OiBUKSB7XG4gICAgdGhpcy5fdiA9IHg7XG4gICAgdGhpcy5faGFzID0gdHJ1ZTtcbiAgICBzdXBlci5fbih4KTtcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHtcbiAgICAgIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fc3RvcElEKTtcbiAgICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIH0gZWxzZSBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTsgZWxzZSB7XG4gICAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICAgIGlmIChwICE9PSBOTykgcC5fc3RhcnQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgdGhpcy5faGFzID0gZmFsc2U7XG4gICAgc3VwZXIuX3N0b3BOb3coKTtcbiAgfVxuXG4gIF94KCk6IHZvaWQge1xuICAgIHRoaXMuX2hhcyA9IGZhbHNlO1xuICAgIHN1cGVyLl94KCk7XG4gIH1cblxuICBtYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiB0aGlzLl9tYXAocHJvamVjdCkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgbWFwVG88VT4ocHJvamVjdGVkVmFsdWU6IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiBzdXBlci5tYXBUbyhwcm9qZWN0ZWRWYWx1ZSkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgdGFrZShhbW91bnQ6IG51bWJlcik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnRha2UoYW1vdW50KSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLmVuZFdoZW4ob3RoZXIpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIHJlcGxhY2VFcnJvcihyZXBsYWNlOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnJlcGxhY2VFcnJvcihyZXBsYWNlKSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICByZW1lbWJlcigpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGVidWcoKTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiBzdHJpbmcpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6ICh0OiBUKSA9PiBhbnkpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5kZWJ1ZyhsYWJlbE9yU3B5IGFzIGFueSkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG59XG5cbmV4cG9ydCB7Tk8sIE5PX0lMfTtcbmNvbnN0IHhzID0gU3RyZWFtO1xudHlwZSB4czxUPiA9IFN0cmVhbTxUPjtcbmV4cG9ydCBkZWZhdWx0IHhzO1xuIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknO1xuaW1wb3J0IHtydW59IGZyb20gJ0BjeWNsZS9ydW4nO1xuaW1wb3J0IHtwb3dlcnVwfSBmcm9tICdAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb24nO1xuaW1wb3J0IHtcbiAgbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlcixcbiAgU3BlZWNoU3ludGhlc2lzQWN0aW9uLFxuICBtYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXIsXG4gIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uLFxufSBmcm9tICdAY3ljbGUtcm9ib3QtZHJpdmVycy9zcGVlY2gnO1xuXG5cbmZ1bmN0aW9uIG1haW4oc291cmNlcykge1xuICBzb3VyY2VzLnByb3hpZXMgPSB7ICAvLyB3aWxsIGJlIGNvbm5lY3RlZCB0byBcInRhcmdldHNcIlxuICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogeHMuY3JlYXRlKCksXG4gICAgU3BlZWNoUmVjb2duaXRpb25BY3Rpb246IHhzLmNyZWF0ZSgpLFxuICB9O1xuICAvLyBjcmVhdGUgYWN0aW9uIGNvbXBvbmVudHNcbiAgc291cmNlcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24gPSBTcGVlY2hTeW50aGVzaXNBY3Rpb24oe1xuICAgIGdvYWw6IHNvdXJjZXMucHJveGllcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gICAgU3BlZWNoU3ludGhlc2lzOiBzb3VyY2VzLlNwZWVjaFN5bnRoZXNpcyxcbiAgfSk7XG4gIHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24gPSBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbih7XG4gICAgZ29hbDogc291cmNlcy5wcm94aWVzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLFxuICAgIFNwZWVjaFJlY29nbml0aW9uOiBzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uLFxuICB9KTtcblxuICBcbiAgLy8gbWFpbiBsb2dpY1xuICBjb25zdCBzeW50aEdvYWwkID0geHMub2YoJ0hlbGxvIHRoZXJlIScpLmNvbXBvc2UoZGVsYXkoMTAwMCkpO1xuICBjb25zdCByZWNvZ0dvYWwkID0gc291cmNlcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24ucmVzdWx0Lm1hcFRvKHt9KTtcblxuICBzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLm91dHB1dC5hZGRMaXN0ZW5lcih7XG4gICAgbmV4dDogKCkgPT4gY29uc29sZS5sb2coYExpc3RlbmluZy4uLmApXG4gIH0pO1xuICBzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLnJlc3VsdFxuICAgIC5hZGRMaXN0ZW5lcih7XG4gICAgICBuZXh0OiAocmVzdWx0KSA9PiB7XG4gICAgICAgIGlmIChyZXN1bHQuc3RhdHVzLnN0YXR1cyA9PT0gJ1NVQ0NFRURFRCcpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgSGVhcmQgXCIke3Jlc3VsdC5yZXN1bHR9XCJgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgSSBkaWRuJ3QgaGVhciBhbnl0aGluZy5gKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuXG4gIFxuICByZXR1cm4ge1xuICAgIFNwZWVjaFN5bnRoZXNpczogc291cmNlcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24ub3V0cHV0LFxuICAgIFNwZWVjaFJlY29nbml0aW9uOiBzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLm91dHB1dCxcbiAgICB0YXJnZXRzOiB7ICAvLyB3aWxsIGJlIGltaXRhdGluZyBcInByb3hpZXNcIlxuICAgICAgU3BlZWNoU3ludGhlc2lzQWN0aW9uOiBzeW50aEdvYWwkLFxuICAgICAgU3BlZWNoUmVjb2duaXRpb25BY3Rpb246IHJlY29nR29hbCQsXG4gICAgfVxuICB9XG59XG5cbnJ1bihwb3dlcnVwKG1haW4sIChwcm94eSwgdGFyZ2V0KSA9PiBwcm94eS5pbWl0YXRlKHRhcmdldCkpLCB7XG4gIFNwZWVjaFN5bnRoZXNpczogbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlcigpLFxuICBTcGVlY2hSZWNvZ25pdGlvbjogbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyKCksXG59KTtcbiJdfQ==

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

},{"@cycle-robot-drivers/action":1,"@cycle/run/lib/adapt":9,"xstream":32}],5:[function(require,module,exports){
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

},{"@cycle-robot-drivers/action":1,"@cycle/run/lib/adapt":9,"xstream":32}],6:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":9,"xstream/extra/fromEvent":31}],8:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":9,"xstream/extra/fromEvent":31}],9:[function(require,module,exports){
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
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("@cycle/run/lib/adapt");
function checkIsolateArgs(dataflowComponent, scope) {
    if (typeof dataflowComponent !== "function") {
        throw new Error("First argument given to isolate() must be a " +
            "'dataflowComponent' function");
    }
    if (scope === null) {
        throw new Error("Second argument given to isolate() must not be null");
    }
}
function normalizeScopes(sources, scopes, randomScope) {
    var perChannel = {};
    Object.keys(sources).forEach(function (channel) {
        if (typeof scopes === 'string') {
            perChannel[channel] = scopes;
            return;
        }
        var candidate = scopes[channel];
        if (typeof candidate !== 'undefined') {
            perChannel[channel] = candidate;
            return;
        }
        var wildcard = scopes['*'];
        if (typeof wildcard !== 'undefined') {
            perChannel[channel] = wildcard;
            return;
        }
        perChannel[channel] = randomScope;
    });
    return perChannel;
}
function isolateAllSources(outerSources, scopes) {
    var innerSources = {};
    for (var channel in outerSources) {
        var outerSource = outerSources[channel];
        if (outerSources.hasOwnProperty(channel) &&
            outerSource &&
            scopes[channel] !== null &&
            typeof outerSource.isolateSource === 'function') {
            innerSources[channel] = outerSource.isolateSource(outerSource, scopes[channel]);
        }
        else if (outerSources.hasOwnProperty(channel)) {
            innerSources[channel] = outerSources[channel];
        }
    }
    return innerSources;
}
function isolateAllSinks(sources, innerSinks, scopes) {
    var outerSinks = {};
    for (var channel in innerSinks) {
        var source = sources[channel];
        var innerSink = innerSinks[channel];
        if (innerSinks.hasOwnProperty(channel) &&
            source &&
            scopes[channel] !== null &&
            typeof source.isolateSink === 'function') {
            outerSinks[channel] = adapt_1.adapt(source.isolateSink(xstream_1.default.fromObservable(innerSink), scopes[channel]));
        }
        else if (innerSinks.hasOwnProperty(channel)) {
            outerSinks[channel] = innerSinks[channel];
        }
    }
    return outerSinks;
}
var counter = 0;
function newScope() {
    return "cycle" + ++counter;
}
/**
 * Takes a `component` function and a `scope`, and returns an isolated version
 * of the `component` function.
 *
 * When the isolated component is invoked, each source provided to it is
 * isolated to the given `scope` using `source.isolateSource(source, scope)`,
 * if possible. Likewise, the sinks returned from the isolated component are
 * isolated to the given `scope` using `source.isolateSink(sink, scope)`.
 *
 * The `scope` can be a string or an object. If it is anything else than those
 * two types, it will be converted to a string. If `scope` is an object, it
 * represents "scopes per channel", allowing you to specify a different scope
 * for each key of sources/sinks. For instance
 *
 * ```js
 * const childSinks = isolate(Child, {DOM: 'foo', HTTP: 'bar'})(sources);
 * ```
 *
 * You can also use a wildcard `'*'` to use as a default for source/sinks
 * channels that did not receive a specific scope:
 *
 * ```js
 * // Uses 'bar' as the isolation scope for HTTP and other channels
 * const childSinks = isolate(Child, {DOM: 'foo', '*': 'bar'})(sources);
 * ```
 *
 * If a channel's value is null, then that channel's sources and sinks won't be
 * isolated. If the wildcard is null and some channels are unspecified, those
 * channels won't be isolated. If you don't have a wildcard and some channels
 * are unspecified, then `isolate` will generate a random scope.
 *
 * ```js
 * // Does not isolate HTTP requests
 * const childSinks = isolate(Child, {DOM: 'foo', HTTP: null})(sources);
 * ```
 *
 * If the `scope` argument is not provided at all, a new scope will be
 * automatically created. This means that while **`isolate(component, scope)` is
 * pure** (referentially transparent), **`isolate(component)` is impure** (not
 * referentially transparent). Two calls to `isolate(Foo, bar)` will generate
 * the same component. But, two calls to `isolate(Foo)` will generate two
 * distinct components.
 *
 * ```js
 * // Uses some arbitrary string as the isolation scope for HTTP and other channels
 * const childSinks = isolate(Child, {DOM: 'foo'})(sources);
 * ```
 *
 * Note that both `isolateSource()` and `isolateSink()` are static members of
 * `source`. The reason for this is that drivers produce `source` while the
 * application produces `sink`, and it's the driver's responsibility to
 * implement `isolateSource()` and `isolateSink()`.
 *
 * _Note for Typescript users:_ `isolate` is not currently type-transparent and
 * will explicitly convert generic type arguments to `any`. To preserve types in
 * your components, you can use a type assertion:
 *
 * ```ts
 * // if Child is typed `Component<Sources, Sinks>`
 * const isolatedChild = isolate( Child ) as Component<Sources, Sinks>;
 * ```
 *
 * @param {Function} component a function that takes `sources` as input
 * and outputs a collection of `sinks`.
 * @param {String} scope an optional string that is used to isolate each
 * `sources` and `sinks` when the returned scoped component is invoked.
 * @return {Function} the scoped component function that, as the original
 * `component` function, takes `sources` and returns `sinks`.
 * @function isolate
 */
function isolate(component, scope) {
    if (scope === void 0) { scope = newScope(); }
    checkIsolateArgs(component, scope);
    var randomScope = typeof scope === 'object' ? newScope() : '';
    var scopes = typeof scope === 'string' || typeof scope === 'object'
        ? scope
        : scope.toString();
    return function wrappedComponent(outerSources) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        var scopesPerChannel = normalizeScopes(outerSources, scopes, randomScope);
        var innerSources = isolateAllSources(outerSources, scopesPerChannel);
        var innerSinks = component.apply(void 0, [innerSources].concat(rest));
        var outerSinks = isolateAllSinks(outerSources, innerSinks, scopesPerChannel);
        return outerSinks;
    };
}
isolate.reset = function () { return (counter = 0); };
exports.default = isolate;
function toIsolated(scope) {
    if (scope === void 0) { scope = newScope(); }
    return function (component) { return isolate(component, scope); };
}
exports.toIsolated = toIsolated;

},{"@cycle/run/lib/adapt":11,"xstream":32}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{"./internals":14}],14:[function(require,module,exports){
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

},{"./adapt":12,"quicktask":24,"xstream":32}],15:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("@cycle/run/lib/adapt");
var isolate_1 = require("@cycle/isolate");
var pickMerge_1 = require("./pickMerge");
var pickCombine_1 = require("./pickCombine");
/**
 * An object representing all instances in a collection of components. Has the
 * methods pickCombine and pickMerge to get the combined sinks of all instances.
 */
var Instances = /** @class */ (function () {
    function Instances(instances$) {
        this._instances$ = instances$;
    }
    /**
     * Like `merge` in xstream, this operator blends multiple streams together, but
     * picks those streams from a collection of component instances.
     *
     * Use the `selector` string to pick a stream from the sinks object of each
     * component instance, then pickMerge will merge all those picked streams.
     *
     * @param {String} selector a name of a channel in a sinks object belonging to
     * each component in the collection of components.
     * @return {Function} an operator to be used with xstream's `compose` method.
     */
    Instances.prototype.pickMerge = function (selector) {
        return adapt_1.adapt(this._instances$.compose(pickMerge_1.pickMerge(selector)));
    };
    /**
     * Like `combine` in xstream, this operator combines multiple streams together,
     * but picks those streams from a collection of component instances.
     *
     * Use the `selector` string to pick a stream from the sinks object of each
     * component instance, then pickCombine will combine all those picked streams.
     *
     * @param {String} selector a name of a channel in a sinks object belonging to
     * each component in the collection of components.
     * @return {Function} an operator to be used with xstream's `compose` method.
     */
    Instances.prototype.pickCombine = function (selector) {
        return adapt_1.adapt(this._instances$.compose(pickCombine_1.pickCombine(selector)));
    };
    return Instances;
}());
exports.Instances = Instances;
function defaultItemScope(key) {
    return { '*': null };
}
function instanceLens(itemKey, key) {
    return {
        get: function (arr) {
            if (typeof arr === 'undefined') {
                return void 0;
            }
            else {
                for (var i = 0, n = arr.length; i < n; ++i) {
                    if ("" + itemKey(arr[i], i) === key) {
                        return arr[i];
                    }
                }
                return void 0;
            }
        },
        set: function (arr, item) {
            if (typeof arr === 'undefined') {
                return [item];
            }
            else if (typeof item === 'undefined') {
                return arr.filter(function (s, i) { return "" + itemKey(s, i) !== key; });
            }
            else {
                return arr.map(function (s, i) {
                    if ("" + itemKey(s, i) === key) {
                        return item;
                    }
                    else {
                        return s;
                    }
                });
            }
        },
    };
}
var identityLens = {
    get: function (outer) { return outer; },
    set: function (outer, inner) { return inner; },
};
function makeCollection(opts) {
    return function collectionComponent(sources) {
        var name = opts.channel || 'state';
        var itemKey = opts.itemKey;
        var itemScope = opts.itemScope || defaultItemScope;
        var itemComp = opts.item;
        var state$ = xstream_1.default.fromObservable(sources[name].stream);
        var instances$ = state$.fold(function (acc, nextState) {
            var _a, _b, _c, _d;
            var dict = acc.dict;
            if (Array.isArray(nextState)) {
                var nextInstArray = Array(nextState.length);
                var nextKeys_1 = new Set();
                // add
                for (var i = 0, n = nextState.length; i < n; ++i) {
                    var key = "" + (itemKey ? itemKey(nextState[i], i) : i);
                    nextKeys_1.add(key);
                    if (!dict.has(key)) {
                        var stateScope = itemKey ? instanceLens(itemKey, key) : "" + i;
                        var otherScopes = itemScope(key);
                        var scopes = typeof otherScopes === 'string'
                            ? (_a = { '*': otherScopes }, _a[name] = stateScope, _a) : __assign({}, otherScopes, (_b = {}, _b[name] = stateScope, _b));
                        var sinks = isolate_1.default(itemComp, scopes)(sources);
                        dict.set(key, sinks);
                        nextInstArray[i] = sinks;
                    }
                    else {
                        nextInstArray[i] = dict.get(key);
                    }
                    nextInstArray[i]._key = key;
                }
                // remove
                dict.forEach(function (_, key) {
                    if (!nextKeys_1.has(key)) {
                        dict.delete(key);
                    }
                });
                nextKeys_1.clear();
                return { dict: dict, arr: nextInstArray };
            }
            else {
                dict.clear();
                var key = "" + (itemKey ? itemKey(nextState, 0) : 'this');
                var stateScope = identityLens;
                var otherScopes = itemScope(key);
                var scopes = typeof otherScopes === 'string'
                    ? (_c = { '*': otherScopes }, _c[name] = stateScope, _c) : __assign({}, otherScopes, (_d = {}, _d[name] = stateScope, _d));
                var sinks = isolate_1.default(itemComp, scopes)(sources);
                dict.set(key, sinks);
                return { dict: dict, arr: [sinks] };
            }
        }, { dict: new Map(), arr: [] });
        return opts.collectSinks(new Instances(instances$));
    };
}
exports.makeCollection = makeCollection;

},{"./pickCombine":18,"./pickMerge":19,"@cycle/isolate":21,"@cycle/run/lib/adapt":22,"xstream":32}],16:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var dropRepeats_1 = require("xstream/extra/dropRepeats");
var adapt_1 = require("@cycle/run/lib/adapt");
function updateArrayEntry(array, scope, newVal) {
    if (newVal === array[scope]) {
        return array;
    }
    var index = parseInt(scope);
    if (typeof newVal === 'undefined') {
        return array.filter(function (_val, i) { return i !== index; });
    }
    return array.map(function (val, i) { return (i === index ? newVal : val); });
}
function makeGetter(scope) {
    if (typeof scope === 'string' || typeof scope === 'number') {
        return function lensGet(state) {
            if (typeof state === 'undefined') {
                return void 0;
            }
            else {
                return state[scope];
            }
        };
    }
    else {
        return scope.get;
    }
}
function makeSetter(scope) {
    if (typeof scope === 'string' || typeof scope === 'number') {
        return function lensSet(state, childState) {
            var _a, _b;
            if (Array.isArray(state)) {
                return updateArrayEntry(state, scope, childState);
            }
            else if (typeof state === 'undefined') {
                return _a = {}, _a[scope] = childState, _a;
            }
            else {
                return __assign({}, state, (_b = {}, _b[scope] = childState, _b));
            }
        };
    }
    else {
        return scope.set;
    }
}
function isolateSource(source, scope) {
    return source.select(scope);
}
exports.isolateSource = isolateSource;
function isolateSink(innerReducer$, scope) {
    var get = makeGetter(scope);
    var set = makeSetter(scope);
    return innerReducer$.map(function (innerReducer) {
        return function outerReducer(outer) {
            var prevInner = get(outer);
            var nextInner = innerReducer(prevInner);
            if (prevInner === nextInner) {
                return outer;
            }
            else {
                return set(outer, nextInner);
            }
        };
    });
}
exports.isolateSink = isolateSink;
/**
 * Represents a piece of application state dynamically changing over time.
 */
var StateSource = /** @class */ (function () {
    function StateSource(stream, name) {
        this.isolateSource = isolateSource;
        this.isolateSink = isolateSink;
        this._stream = stream
            .filter(function (s) { return typeof s !== 'undefined'; })
            .compose(dropRepeats_1.default())
            .remember();
        this._name = name;
        this.stream = adapt_1.adapt(this._stream);
        this._stream._isCycleSource = name;
    }
    /**
     * Selects a part (or scope) of the state object and returns a new StateSource
     * dynamically representing that selected part of the state.
     *
     * @param {string|number|lens} scope as a string, this argument represents the
     * property you want to select from the state object. As a number, this
     * represents the array index you want to select from the state array. As a
     * lens object (an object with get() and set()), this argument represents any
     * custom way of selecting something from the state object.
     */
    StateSource.prototype.select = function (scope) {
        var get = makeGetter(scope);
        return new StateSource(this._stream.map(get), this._name);
    };
    return StateSource;
}());
exports.StateSource = StateSource;

},{"@cycle/run/lib/adapt":22,"xstream/extra/dropRepeats":30}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StateSource_1 = require("./StateSource");
exports.StateSource = StateSource_1.StateSource;
exports.isolateSource = StateSource_1.isolateSource;
exports.isolateSink = StateSource_1.isolateSink;
var Collection_1 = require("./Collection");
exports.Instances = Collection_1.Instances;
/**
 * Given a Cycle.js component that expects a state *source* and will
 * output a reducer *sink*, this function sets up the state management
 * mechanics to accumulate state over time and provide the state source. It
 * returns a Cycle.js component which wraps the component given as input.
 * Essentially, it hooks up the reducers sink with the state source as a cycle.
 *
 * Optionally, you can pass a custom name for the state channel. By default,
 * the name is 'state' in sources and sinks, but you can change that to be
 * whatever string you wish.
 *
 * @param {Function} main a function that takes `sources` as input and outputs
 * `sinks`.
 * @param {String} name an optional string for the custom name given to the
 * state channel. By default, it is the string 'state'.
 * @return {Function} a component that wraps the main function given as input,
 * adding state accumulation logic to it.
 * @function withState
 */
var withState_1 = require("./withState");
exports.withState = withState_1.withState;
/**
 * Returns a Cycle.js component (a function from sources to sinks) that
 * represents a collection of many item components of the same type.
 *
 * Takes an "options" object as input, with the required properties:
 * - item
 * - collectSinks
 *
 * And the optional properties:
 * - itemKey
 * - itemScope
 * - channel
 *
 * The returned component, the Collection, will use the state source passed to
 * it (through sources) to guide the dynamic growing/shrinking of instances of
 * the item component.
 *
 * Typically the state source should emit arrays, where each entry in the array
 * is an object holding the state for each item component. When the state array
 * grows, the collection will automatically instantiate a new item component.
 * Similarly, when the state array gets smaller, the collection will handle
 * removal of the corresponding item instance.
 * @param {Object} opts a configuration object with the following fields:
 *   - `item: function`, a Cycle.js component for each item in the collection.
 *   - `collectSinks: function`, a function that describes how to collect the
 *      sinks from all item instances.
 *   - `itemKey: function`, a function from item state to item (unique) key.
 *   - `itemScope: function`, a function from item key to isolation scope.
 *   - `channel: string`, choose the channel name where the StateSource exists.
 * @return {Function} a component that displays many instances of the item
 * component.
 * @function makeCollection
 */
var Collection_2 = require("./Collection");
exports.makeCollection = Collection_2.makeCollection;

},{"./Collection":15,"./StateSource":16,"./withState":20}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var PickCombineListener = /** @class */ (function () {
    function PickCombineListener(key, out, p, ins) {
        this.key = key;
        this.out = out;
        this.p = p;
        this.val = xstream_1.NO;
        this.ins = ins;
    }
    PickCombineListener.prototype._n = function (t) {
        var p = this.p, out = this.out;
        this.val = t;
        if (out === null) {
            return;
        }
        this.p.up();
    };
    PickCombineListener.prototype._e = function (err) {
        var out = this.out;
        if (out === null) {
            return;
        }
        out._e(err);
    };
    PickCombineListener.prototype._c = function () { };
    return PickCombineListener;
}());
var PickCombine = /** @class */ (function () {
    function PickCombine(sel, ins) {
        this.type = 'combine';
        this.ins = ins;
        this.sel = sel;
        this.out = null;
        this.ils = new Map();
        this.inst = null;
    }
    PickCombine.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    PickCombine.prototype._stop = function () {
        this.ins._remove(this);
        var ils = this.ils;
        ils.forEach(function (il) {
            il.ins._remove(il);
            il.ins = null;
            il.out = null;
            il.val = null;
        });
        ils.clear();
        this.out = null;
        this.ils = new Map();
        this.inst = null;
    };
    PickCombine.prototype.up = function () {
        var arr = this.inst.arr;
        var n = arr.length;
        var ils = this.ils;
        var outArr = Array(n);
        for (var i = 0; i < n; ++i) {
            var sinks = arr[i];
            var key = sinks._key;
            if (!ils.has(key)) {
                return;
            }
            var val = ils.get(key).val;
            if (val === xstream_1.NO) {
                return;
            }
            outArr[i] = val;
        }
        this.out._n(outArr);
    };
    PickCombine.prototype._n = function (inst) {
        this.inst = inst;
        var arrSinks = inst.arr;
        var ils = this.ils;
        var out = this.out;
        var sel = this.sel;
        var dict = inst.dict;
        var n = arrSinks.length;
        // remove
        var removed = false;
        ils.forEach(function (il, key) {
            if (!dict.has(key)) {
                il.ins._remove(il);
                il.ins = null;
                il.out = null;
                il.val = null;
                ils.delete(key);
                removed = true;
            }
        });
        if (n === 0) {
            out._n([]);
            return;
        }
        // add
        for (var i = 0; i < n; ++i) {
            var sinks = arrSinks[i];
            var key = sinks._key;
            if (!sinks[sel]) {
                throw new Error('pickCombine found an undefined child sink stream');
            }
            var sink = xstream_1.default.fromObservable(sinks[sel]);
            if (!ils.has(key)) {
                ils.set(key, new PickCombineListener(key, out, this, sink));
                sink._add(ils.get(key));
            }
        }
        if (removed) {
            this.up();
        }
    };
    PickCombine.prototype._e = function (e) {
        var out = this.out;
        if (out === null) {
            return;
        }
        out._e(e);
    };
    PickCombine.prototype._c = function () {
        var out = this.out;
        if (out === null) {
            return;
        }
        out._c();
    };
    return PickCombine;
}());
function pickCombine(selector) {
    return function pickCombineOperator(inst$) {
        return new xstream_1.Stream(new PickCombine(selector, inst$));
    };
}
exports.pickCombine = pickCombine;

},{"xstream":32}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var PickMergeListener = /** @class */ (function () {
    function PickMergeListener(out, p, ins) {
        this.ins = ins;
        this.out = out;
        this.p = p;
    }
    PickMergeListener.prototype._n = function (t) {
        var p = this.p, out = this.out;
        if (out === null) {
            return;
        }
        out._n(t);
    };
    PickMergeListener.prototype._e = function (err) {
        var out = this.out;
        if (out === null) {
            return;
        }
        out._e(err);
    };
    PickMergeListener.prototype._c = function () { };
    return PickMergeListener;
}());
var PickMerge = /** @class */ (function () {
    function PickMerge(sel, ins) {
        this.type = 'pickMerge';
        this.ins = ins;
        this.out = null;
        this.sel = sel;
        this.ils = new Map();
        this.inst = null;
    }
    PickMerge.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    PickMerge.prototype._stop = function () {
        this.ins._remove(this);
        var ils = this.ils;
        ils.forEach(function (il, key) {
            il.ins._remove(il);
            il.ins = null;
            il.out = null;
            ils.delete(key);
        });
        ils.clear();
        this.out = null;
        this.ils = new Map();
        this.inst = null;
    };
    PickMerge.prototype._n = function (inst) {
        this.inst = inst;
        var arrSinks = inst.arr;
        var ils = this.ils;
        var out = this.out;
        var sel = this.sel;
        var n = arrSinks.length;
        // add
        for (var i = 0; i < n; ++i) {
            var sinks = arrSinks[i];
            var key = sinks._key;
            var sink = xstream_1.default.fromObservable(sinks[sel] || xstream_1.default.never());
            if (!ils.has(key)) {
                ils.set(key, new PickMergeListener(out, this, sink));
                sink._add(ils.get(key));
            }
        }
        // remove
        ils.forEach(function (il, key) {
            if (!inst.dict.has(key) || !inst.dict.get(key)) {
                il.ins._remove(il);
                il.ins = null;
                il.out = null;
                ils.delete(key);
            }
        });
    };
    PickMerge.prototype._e = function (err) {
        var u = this.out;
        if (u === null) {
            return;
        }
        u._e(err);
    };
    PickMerge.prototype._c = function () {
        var u = this.out;
        if (u === null) {
            return;
        }
        u._c();
    };
    return PickMerge;
}());
function pickMerge(selector) {
    return function pickMergeOperator(inst$) {
        return new xstream_1.Stream(new PickMerge(selector, inst$));
    };
}
exports.pickMerge = pickMerge;

},{"xstream":32}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var concat_1 = require("xstream/extra/concat");
var StateSource_1 = require("./StateSource");
var quicktask_1 = require("quicktask");
var schedule = quicktask_1.default();
function withState(main, name) {
    if (name === void 0) { name = 'state'; }
    return function mainWithState(sources) {
        var reducerMimic$ = xstream_1.default.create();
        var state$ = reducerMimic$
            .fold(function (state, reducer) { return reducer(state); }, void 0)
            .drop(1);
        var innerSources = sources;
        innerSources[name] = new StateSource_1.StateSource(state$, name);
        var sinks = main(innerSources);
        if (sinks[name]) {
            var stream$ = concat_1.default(xstream_1.default.fromObservable(sinks[name]), xstream_1.default.never());
            stream$.subscribe({
                next: function (i) { return schedule(function () { return reducerMimic$._n(i); }); },
                error: function (err) { return schedule(function () { return reducerMimic$._e(err); }); },
                complete: function () { return schedule(function () { return reducerMimic$._c(); }); },
            });
        }
        return sinks;
    };
}
exports.withState = withState;

},{"./StateSource":16,"quicktask":24,"xstream":32,"xstream/extra/concat":28}],21:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"@cycle/run/lib/adapt":22,"dup":10,"xstream":32}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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

},{"_process":23,"timers":27}],25:[function(require,module,exports){
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

},{"./ponyfill.js":26}],26:[function(require,module,exports){
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
},{}],27:[function(require,module,exports){
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

},{"process/browser.js":23,"timers":27}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var ConcatProducer = /** @class */ (function () {
    function ConcatProducer(streams) {
        this.streams = streams;
        this.type = 'concat';
        this.out = null;
        this.i = 0;
    }
    ConcatProducer.prototype._start = function (out) {
        this.out = out;
        this.streams[this.i]._add(this);
    };
    ConcatProducer.prototype._stop = function () {
        var streams = this.streams;
        if (this.i < streams.length) {
            streams[this.i]._remove(this);
        }
        this.i = 0;
        this.out = null;
    };
    ConcatProducer.prototype._n = function (t) {
        var u = this.out;
        if (!u)
            return;
        u._n(t);
    };
    ConcatProducer.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    ConcatProducer.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        var streams = this.streams;
        streams[this.i]._remove(this);
        if (++this.i < streams.length) {
            streams[this.i]._add(this);
        }
        else {
            u._c();
        }
    };
    return ConcatProducer;
}());
/**
 * Puts one stream after the other. *concat* is a factory that takes multiple
 * streams as arguments, and starts the `n+1`-th stream only when the `n`-th
 * stream has completed. It concatenates those streams together.
 *
 * Marble diagram:
 *
 * ```text
 * --1--2---3---4-|
 * ...............--a-b-c--d-|
 *           concat
 * --1--2---3---4---a-b-c--d-|
 * ```
 *
 * Example:
 *
 * ```js
 * import concat from 'xstream/extra/concat'
 *
 * const streamA = xs.of('a', 'b', 'c')
 * const streamB = xs.of(10, 20, 30)
 * const streamC = xs.of('X', 'Y', 'Z')
 *
 * const outputStream = concat(streamA, streamB, streamC)
 *
 * outputStream.addListener({
 *   next: (x) => console.log(x),
 *   error: (err) => console.error(err),
 *   complete: () => console.log('concat completed'),
 * })
 * ```
 *
 * @factory true
 * @param {Stream} stream1 A stream to concatenate together with other streams.
 * @param {Stream} stream2 A stream to concatenate together with other streams. Two
 * or more streams may be given as arguments.
 * @return {Stream}
 */
function concat() {
    var streams = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        streams[_i] = arguments[_i];
    }
    return new index_1.Stream(new ConcatProducer(streams));
}
exports.default = concat;

},{"../index":32}],29:[function(require,module,exports){
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

},{"../index":32}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var empty = {};
var DropRepeatsOperator = /** @class */ (function () {
    function DropRepeatsOperator(ins, fn) {
        this.ins = ins;
        this.type = 'dropRepeats';
        this.out = null;
        this.v = empty;
        this.isEq = fn ? fn : function (x, y) { return x === y; };
    }
    DropRepeatsOperator.prototype._start = function (out) {
        this.out = out;
        this.ins._add(this);
    };
    DropRepeatsOperator.prototype._stop = function () {
        this.ins._remove(this);
        this.out = null;
        this.v = empty;
    };
    DropRepeatsOperator.prototype._n = function (t) {
        var u = this.out;
        if (!u)
            return;
        var v = this.v;
        if (v !== empty && this.isEq(t, v))
            return;
        this.v = t;
        u._n(t);
    };
    DropRepeatsOperator.prototype._e = function (err) {
        var u = this.out;
        if (!u)
            return;
        u._e(err);
    };
    DropRepeatsOperator.prototype._c = function () {
        var u = this.out;
        if (!u)
            return;
        u._c();
    };
    return DropRepeatsOperator;
}());
exports.DropRepeatsOperator = DropRepeatsOperator;
/**
 * Drops consecutive duplicate values in a stream.
 *
 * Marble diagram:
 *
 * ```text
 * --1--2--1--1--1--2--3--4--3--3|
 *     dropRepeats
 * --1--2--1--------2--3--4--3---|
 * ```
 *
 * Example:
 *
 * ```js
 * import dropRepeats from 'xstream/extra/dropRepeats'
 *
 * const stream = xs.of(1, 2, 1, 1, 1, 2, 3, 4, 3, 3)
 *   .compose(dropRepeats())
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > 1
 * > 2
 * > 1
 * > 2
 * > 3
 * > 4
 * > 3
 * > completed
 * ```
 *
 * Example with a custom isEqual function:
 *
 * ```js
 * import dropRepeats from 'xstream/extra/dropRepeats'
 *
 * const stream = xs.of('a', 'b', 'a', 'A', 'B', 'b')
 *   .compose(dropRepeats((x, y) => x.toLowerCase() === y.toLowerCase()))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > a
 * > b
 * > a
 * > B
 * > completed
 * ```
 *
 * @param {Function} isEqual An optional function of type
 * `(x: T, y: T) => boolean` that takes an event from the input stream and
 * checks if it is equal to previous event, by returning a boolean.
 * @return {Stream}
 */
function dropRepeats(isEqual) {
    if (isEqual === void 0) { isEqual = void 0; }
    return function dropRepeatsOperator(ins) {
        return new index_1.Stream(new DropRepeatsOperator(ins, isEqual));
    };
}
exports.default = dropRepeats;

},{"../index":32}],31:[function(require,module,exports){
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

},{"../index":32}],32:[function(require,module,exports){
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

},{"symbol-observable":25}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = FlowchartAction;

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _dropRepeats = require('xstream/extra/dropRepeats');

var _dropRepeats2 = _interopRequireDefault(_dropRepeats);

var _isolate = require('@cycle/isolate');

var _isolate2 = _interopRequireDefault(_isolate);

var _action = require('@cycle-robot-drivers/action');

var _QuestionAnswerAction = require('./QuestionAnswerAction');

var _QuestionAnswerAction2 = _interopRequireDefault(_QuestionAnswerAction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var State = {
  PEND: 'PEND',
  QA: 'QA',
  SAY: 'SAY'
};

var InputType = {
  GOAL: 'GOAL',
  QA_SUCCEEDED: 'QA_SUCCEEDED',
  QA_FAILED: 'QA_FAILED',
  SAY_DONE: 'SAY_DONE'
};

function input(goal$, reducerState$, speechSynthesisAction) {
  var qaResult$ = reducerState$.filter(function (s) {
    return !!s.QuestionAnswerAction && !!s.QuestionAnswerAction.outputs && !!s.QuestionAnswerAction.outputs.result;
  }).map(function (s) {
    return s.QuestionAnswerAction.outputs.result;
  }).compose((0, _dropRepeats2.default)(_action.isEqualResult));
  return _xstream2.default.merge(goal$.map(function (x) {
    return { type: InputType.GOAL, value: (0, _action.initGoal)(x) };
  }), qaResult$.filter(function (r) {
    return r.status.status === _action.Status.SUCCEEDED;
  }).map(function (r) {
    return { type: InputType.QA_SUCCEEDED, value: r.result };
  }), qaResult$.filter(function (r) {
    return r.status.status !== _action.Status.SUCCEEDED;
  }).map(function (r) {
    return { type: InputType.QA_FAILED, value: r.result };
  }), speechSynthesisAction.result.filter(function (r) {
    return r.status.status === _action.Status.SUCCEEDED;
  }).mapTo({ type: InputType.SAY_DONE }));
}

function reducer(input$) {
  var _Sentence$CAREER, _Sentence$ONLINE, _Sentence$FAMILY, _Sentence$TRIPS, _Sentence$HOME, _Sentence$ROUTINE, _Sentence$JOB, _flowchart;

  var initReducer$ = _xstream2.default.of(function (prev) {
    if (typeof prev === 'undefined') {
      return {
        state: State.PEND,
        variables: null,
        outputs: null
      };
    } else {
      return prev;
    }
  });

  var Sentence = {
    CAREER: 'Is it important that you reach your full career potential?',
    ONLINE: 'Can you see yourself working online?',
    FAMILY: 'Do you have to be near my family/friends/pets?',
    TRIPS: 'Do you think short trips are awesome?',
    HOME: 'Do you want to have a home and nice things?',
    ROUTINE: 'Do you think a routine gives your life structure?',
    JOB: 'Do you need a secure job and a stable income?',
    VACATIONER: 'You are a vacationer!',
    EXPAT: 'You are an expat!',
    NOMAD: 'You are a nomad!'
  };
  var Response = {
    YES: 'yes',
    NO: 'no'
  };
  var flowchart = (_flowchart = {}, _defineProperty(_flowchart, Sentence.CAREER, (_Sentence$CAREER = {}, _defineProperty(_Sentence$CAREER, Response.YES, Sentence.ONLINE), _defineProperty(_Sentence$CAREER, Response.NO, Sentence.FAMILY), _Sentence$CAREER)), _defineProperty(_flowchart, Sentence.ONLINE, (_Sentence$ONLINE = {}, _defineProperty(_Sentence$ONLINE, Response.YES, Sentence.NOMAD), _defineProperty(_Sentence$ONLINE, Response.NO, Sentence.VACATIONER), _Sentence$ONLINE)), _defineProperty(_flowchart, Sentence.FAMILY, (_Sentence$FAMILY = {}, _defineProperty(_Sentence$FAMILY, Response.YES, Sentence.VACATIONER), _defineProperty(_Sentence$FAMILY, Response.NO, Sentence.TRIPS), _Sentence$FAMILY)), _defineProperty(_flowchart, Sentence.TRIPS, (_Sentence$TRIPS = {}, _defineProperty(_Sentence$TRIPS, Response.YES, Sentence.VACATIONER), _defineProperty(_Sentence$TRIPS, Response.NO, Sentence.HOME), _Sentence$TRIPS)), _defineProperty(_flowchart, Sentence.HOME, (_Sentence$HOME = {}, _defineProperty(_Sentence$HOME, Response.YES, Sentence.EXPAT), _defineProperty(_Sentence$HOME, Response.NO, Sentence.ROUTINE), _Sentence$HOME)), _defineProperty(_flowchart, Sentence.ROUTINE, (_Sentence$ROUTINE = {}, _defineProperty(_Sentence$ROUTINE, Response.YES, Sentence.EXPAT), _defineProperty(_Sentence$ROUTINE, Response.NO, Sentence.JOB), _Sentence$ROUTINE)), _defineProperty(_flowchart, Sentence.JOB, (_Sentence$JOB = {}, _defineProperty(_Sentence$JOB, Response.YES, Sentence.ONLINE), _defineProperty(_Sentence$JOB, Response.NO, Sentence.NOMAD), _Sentence$JOB)), _flowchart);

  var transitionReducer$ = input$.map(function (input) {
    return function (prev) {
      console.debug('input', input, 'prev', prev);
      if (prev.state === State.PEND) {
        if (input.type === InputType.GOAL) {
          var node = Sentence.CAREER;
          return _extends({}, prev, {
            state: State.QA,
            variables: {
              goal_id: input.value.goal_id,
              node: node
            },
            outputs: {
              QuestionAnswerAction: {
                goal: (0, _action.initGoal)({
                  question: node,
                  answers: Object.keys(flowchart[node])
                })
              }
            }
          });
        }
      } else if (prev.state === State.QA) {
        if (input.type === InputType.QA_SUCCEEDED) {
          var _node = flowchart[prev.variables.node][input.value];
          if (!flowchart[_node]) {
            return _extends({}, prev, {
              state: State.SAY,
              variables: _extends({}, prev.variables, {
                node: _node
              }),
              outputs: {
                SpeechSynthesisAction: {
                  goal: (0, _action.initGoal)(_node)
                }
              }
            });
          } else {
            return _extends({}, prev, {
              variables: _extends({}, prev.variables, {
                node: _node
              }),
              outputs: {
                QuestionAnswerAction: {
                  goal: (0, _action.initGoal)({
                    question: _node,
                    answers: Object.keys(flowchart[_node])
                  })
                }
              }
            });
          }
        } else if (input.type === InputType.QA_FAILED) {
          return _extends({}, prev, {
            state: State.PEND,
            variables: null,
            outputs: {
              result: {
                status: {
                  goal_id: prev.variables.goal_id,
                  status: State.ABORTED
                },
                result: prev.variables.node
              }
            }
          });
        }
      } else if (prev.state === State.SAY) {
        if (input.type === InputType.SAY_DONE) {
          return _extends({}, prev, {
            state: State.PEND,
            variables: null,
            outputs: {
              result: {
                status: {
                  goal_id: prev.variables.goal_id,
                  status: State.SUCCEEDED
                },
                result: prev.variables.node
              }
            }
          });
        }
      }
      return prev;
    };
  });

  return _xstream2.default.merge(initReducer$, transitionReducer$);
}

function output(reducerState$) {
  var outputs$ = reducerState$.filter(function (m) {
    return !!m.outputs;
  }).map(function (m) {
    return m.outputs;
  });
  return {
    SpeechSynthesisAction: outputs$.filter(function (o) {
      return !!o.SpeechSynthesisAction;
    }).map(function (o) {
      return o.SpeechSynthesisAction.goal;
    }).compose((0, _dropRepeats2.default)(_action.isEqualGoal)),
    QuestionAnswerAction: outputs$.filter(function (o) {
      return !!o.QuestionAnswerAction;
    }).map(function (o) {
      return o.QuestionAnswerAction.goal;
    }).compose((0, _dropRepeats2.default)(_action.isEqualGoal))
  };
}

function FlowchartAction(sources) {
  var reducerState$ = sources.state.stream;
  var outputs = output(reducerState$);
  var qaSinks = (0, _isolate2.default)(_QuestionAnswerAction2.default, 'QuestionAnswerAction')({
    state: sources.state,
    goal: outputs.QuestionAnswerAction,
    SpeechSynthesisAction: sources.SpeechSynthesisAction,
    SpeechRecognitionAction: sources.SpeechRecognitionAction
  });
  var input$ = input(sources.goal, reducerState$, sources.SpeechSynthesisAction);
  var reducer$ = _xstream2.default.merge(reducer(input$), qaSinks.state);

  return {
    outputs: _extends({}, qaSinks.outputs, {
      SpeechSynthesisAction: _xstream2.default.merge(qaSinks.outputs.SpeechSynthesisAction, outputs.SpeechSynthesisAction)
    }),
    state: reducer$
  };
}

},{"./QuestionAnswerAction":34,"@cycle-robot-drivers/action":1,"@cycle/isolate":10,"xstream":32,"xstream/extra/dropRepeats":30}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = QuestionAnswerAction;

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _action = require('@cycle-robot-drivers/action');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var State = {
  PEND: 'PEND',
  ASK: 'ASK',
  LISTEN: 'LISTEN'
};

var InputType = {
  GOAL: 'GOAL',
  ASK_DONE: 'ASK_DONE',
  VALID_RESPONSE: 'VALID_RESPONSE',
  INVALID_RESPONSE: 'INVALID_RESPONSE'
};

function input(goal$, speechSynthesisAction, speechRecognitionAction) {
  return _xstream2.default.merge(goal$.map(function (g) {
    return { type: InputType.GOAL, value: (0, _action.initGoal)(g) };
  }), speechSynthesisAction.result.filter(function (result) {
    return result.status.status === 'SUCCEEDED';
  }).mapTo({ type: InputType.ASK_DONE }), speechRecognitionAction.result.filter(function (result) {
    return result.status.status === 'SUCCEEDED';
  }).map(function (result) {
    return {
      type: InputType.VALID_RESPONSE,
      value: result.result
    };
  }), speechRecognitionAction.result.filter(function (result) {
    return result.status.status !== 'SUCCEEDED';
  }).mapTo({ type: InputType.INVALID_RESPONSE }));
}

function reducer(input$) {
  var initReducer$ = _xstream2.default.of(function (prev) {
    if (typeof prev === 'undefined') {
      return {
        state: State.PEND,
        variables: {
          question: null,
          answers: null
        },
        outputs: null
      };
    } else {
      return prev;
    }
  });

  var transitionReducer$ = input$.map(function (input) {
    return function (prev) {
      console.debug('input', input, 'prev', prev);
      if (prev.state === State.PEND) {
        if (input.type === InputType.GOAL) {
          return {
            state: State.ASK,
            variables: {
              goal: input.value,
              question: input.value.goal.question,
              answers: input.value.goal.answers.map(function (a) {
                return a.toLowerCase();
              })
            },
            outputs: { SpeechSynthesisAction: { goal: input.value.goal.question } }
          };
        }
      } else if (prev.state === State.ASK) {
        if (input.type === InputType.ASK_DONE) {
          return {
            state: State.LISTEN,
            variables: prev.variables,
            outputs: { SpeechRecognitionAction: { goal: {} } }
          };
        }
      } else if (prev.state === State.LISTEN) {
        if (input.type === InputType.VALID_RESPONSE) {
          var answer = prev.variables.answers.find(function (a) {
            return a.toLowerCase().includes(input.value);
          });
          var valid = '' !== input.value && !!answer;
          return {
            state: State.PEND,
            variables: null,
            outputs: {
              result: {
                status: {
                  goal_id: prev.variables.goal.goal_id,
                  status: valid ? _action.Status.SUCCEEDED : _action.Status.ABORTED
                },
                result: valid ? answer : null
              }
            }
          };
        } else if (input.type === InputType.INVALID_RESPONSE) {
          return {
            state: State.LISTEN,
            variables: prev.variables,
            outputs: {
              result: {
                status: {
                  goal_id: prev.variables.goal.goal_id,
                  status: _action.Status.ABORTED
                },
                result: null
              }
            }
          };
        }
      };
      return prev;
    };
  });

  return _xstream2.default.merge(initReducer$, transitionReducer$);
}

function output(reducerState$) {
  var outputs$ = reducerState$.filter(function (m) {
    return !!m.outputs;
  }).map(function (m) {
    return m.outputs;
  });
  return {
    SpeechSynthesisAction: outputs$.filter(function (o) {
      return !!o.SpeechSynthesisAction;
    }).map(function (o) {
      return o.SpeechSynthesisAction.goal;
    }),
    SpeechRecognitionAction: outputs$.filter(function (o) {
      return !!o.SpeechRecognitionAction;
    }).map(function (o) {
      return o.SpeechRecognitionAction.goal;
    })
  };
}

function QuestionAnswerAction(sources) {
  var reducerState$ = sources.state.stream;
  var input$ = input(sources.goal, sources.SpeechSynthesisAction, sources.SpeechRecognitionAction);
  var reducer$ = reducer(input$);
  var outputs = output(reducerState$);

  return {
    state: reducer$,
    outputs: outputs
  };
}

},{"@cycle-robot-drivers/action":1,"xstream":32}],35:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _delay = require('xstream/extra/delay');

var _delay2 = _interopRequireDefault(_delay);

var _dropRepeats = require('xstream/extra/dropRepeats');

var _dropRepeats2 = _interopRequireDefault(_dropRepeats);

var _isolate = require('@cycle/isolate');

var _isolate2 = _interopRequireDefault(_isolate);

var _state = require('@cycle/state');

var _run = require('@cycle/run');

var _action = require('@cycle-robot-drivers/action');

var _speech = require('@cycle-robot-drivers/speech');

var _FlowchartAction = require('./FlowchartAction');

var _FlowchartAction2 = _interopRequireDefault(_FlowchartAction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function main(sources) {
  var state$ = sources.state.stream;
  state$.filter(function (s) {
    return !!s.FlowchartAction && !!s.FlowchartAction.outputs && !!s.FlowchartAction.outputs.result;
  }).map(function (s) {
    return s.FlowchartAction.outputs.result;
  }).compose((0, _dropRepeats2.default)(_action.isEqualResult)).addListener({
    next: function next(r) {
      return console.log('result', r);
    }
  });

  var goal$ = _xstream2.default.of({}).compose((0, _delay2.default)(2000));

  // create action components
  var fcSinks = (0, _isolate2.default)(_FlowchartAction2.default, 'FlowchartAction')({
    state: sources.state,
    goal: goal$,
    SpeechSynthesisAction: {
      result: state$.map(function (s) {
        return s.SpeechSynthesisAction.result;
      }).filter(function (r) {
        return !!r;
      }).compose((0, _dropRepeats2.default)(_action.isEqualResult))
    },
    SpeechRecognitionAction: {
      result: state$.map(function (s) {
        return s.SpeechRecognitionAction.result;
      }).filter(function (r) {
        return !!r;
      }).compose((0, _dropRepeats2.default)(_action.isEqualResult))
    }
  });
  var speechSynthesisAction = (0, _speech.SpeechSynthesisAction)({
    goal: fcSinks.outputs.SpeechSynthesisAction,
    SpeechSynthesis: sources.SpeechSynthesis
  });
  var speechRecognitionAction = (0, _speech.SpeechRecognitionAction)({
    goal: fcSinks.outputs.SpeechRecognitionAction,
    SpeechRecognition: sources.SpeechRecognition
  });

  // define reducers
  var reducer$ = _xstream2.default.merge(_xstream2.default.of(function () {
    // initReducer
    return {
      SpeechSynthesisAction: { result: null },
      SpeechRecognitionAction: { result: null }
    };
  }), speechSynthesisAction.result.map(function (result) {
    return function (prevState) {
      return _extends({}, prevState, { SpeechSynthesisAction: { result: result } });
    };
  }), speechRecognitionAction.result.map(function (result) {
    return function (prevState) {
      return _extends({}, prevState, { SpeechRecognitionAction: { result: result } });
    };
  }), fcSinks.state);

  return {
    SpeechSynthesis: speechSynthesisAction.output,
    SpeechRecognition: speechRecognitionAction.output,
    state: reducer$
  };
}

(0, _run.run)((0, _state.withState)(main), {
  SpeechSynthesis: (0, _speech.makeSpeechSynthesisDriver)(),
  SpeechRecognition: (0, _speech.makeSpeechRecognitionDriver)()
});

},{"./FlowchartAction":33,"@cycle-robot-drivers/action":1,"@cycle-robot-drivers/speech":6,"@cycle/isolate":10,"@cycle/run":13,"@cycle/state":17,"xstream":32,"xstream/extra/delay":29,"xstream/extra/dropRepeats":30}]},{},[35])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdHlwZXMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvc3BlZWNoL2xpYi9janMvU3BlZWNoUmVjb2duaXRpb25BY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvc3BlZWNoL2xpYi9janMvU3BlZWNoU3ludGhlc2lzQWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL3NwZWVjaC9saWIvY2pzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL3NwZWVjaC9saWIvY2pzL21ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUtcm9ib3QtZHJpdmVycy9zcGVlY2gvbGliL2Nqcy9tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL3NwZWVjaC9ub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2lzb2xhdGUvbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvaXNvbGF0ZS9ub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW50ZXJuYWxzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL0NvbGxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvU3RhdGVTb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvcGlja0NvbWJpbmUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvcGlja01lcmdlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL3dpdGhTdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvc3RhdGUvbm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9xdWlja3Rhc2svaW5kZXguanMiLCJub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9wb255ZmlsbC5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2NvbmNhdC50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9kZWxheS50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9kcm9wUmVwZWF0cy50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9mcm9tRXZlbnQudHMiLCJub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvaW5kZXgudHMiLCJzcmMvRmxvd2NoYXJ0QWN0aW9uLmpzIiwic3JjL1F1ZXN0aW9uQW5zd2VyQWN0aW9uLmpzIiwic3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUFFdEQsdUJBQW1CLFFBQVE7QUFGMkIsR0FBeEIsQ0FBaEM7O0FBS0E7QUFDQSxNQUFNLFdBQVcsa0JBQUcsS0FBSCxDQUNmLGtCQUFHLEVBQUgsQ0FBTSxZQUFZO0FBQUc7QUFDbkIsV0FBTztBQUNMLDZCQUF1QixFQUFDLFFBQVEsSUFBVCxFQURsQjtBQUVMLCtCQUF5QixFQUFDLFFBQVEsSUFBVDtBQUZwQixLQUFQO0FBSUQsR0FMRCxDQURlLEVBT2Ysc0JBQXNCLE1BQXRCLENBQ0csR0FESCxDQUNPO0FBQUEsV0FBVSxVQUFVLFNBQVYsRUFBcUI7QUFDbEMsMEJBQVcsU0FBWCxJQUFzQix1QkFBdUIsRUFBQyxjQUFELEVBQTdDO0FBQ0QsS0FGSTtBQUFBLEdBRFAsQ0FQZSxFQVdmLHdCQUF3QixNQUF4QixDQUNHLEdBREgsQ0FDTztBQUFBLFdBQVUsVUFBVSxTQUFWLEVBQXFCO0FBQ2xDLDBCQUFXLFNBQVgsSUFBc0IseUJBQXlCLEVBQUMsY0FBRCxFQUEvQztBQUNELEtBRkk7QUFBQSxHQURQLENBWGUsRUFlZixRQUFRLEtBZk8sQ0FBakI7O0FBa0JBLFNBQU87QUFDTCxxQkFBaUIsc0JBQXNCLE1BRGxDO0FBRUwsdUJBQW1CLHdCQUF3QixNQUZ0QztBQUdMLFdBQU87QUFIRixHQUFQO0FBS0Q7O0FBRUQsY0FBSSxzQkFBVSxJQUFWLENBQUosRUFBcUI7QUFDbkIsbUJBQWlCLHdDQURFO0FBRW5CLHFCQUFtQjtBQUZBLENBQXJCIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdHlwZXNfMSA9IHJlcXVpcmUoXCIuL3R5cGVzXCIpO1xuZXhwb3J0cy5TdGF0dXMgPSB0eXBlc18xLlN0YXR1cztcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5leHBvcnRzLmdlbmVyYXRlR29hbElEID0gdXRpbHNfMS5nZW5lcmF0ZUdvYWxJRDtcbmV4cG9ydHMuaW5pdEdvYWwgPSB1dGlsc18xLmluaXRHb2FsO1xuZXhwb3J0cy5pc0VxdWFsID0gdXRpbHNfMS5pc0VxdWFsO1xuZXhwb3J0cy5pc0VxdWFsR29hbCA9IHV0aWxzXzEuaXNFcXVhbEdvYWw7XG5leHBvcnRzLmlzRXF1YWxSZXN1bHQgPSB1dGlsc18xLmlzRXF1YWxSZXN1bHQ7XG5leHBvcnRzLnBvd2VydXAgPSB1dGlsc18xLnBvd2VydXA7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTdGF0dXM7XG4oZnVuY3Rpb24gKFN0YXR1cykge1xuICAgIFN0YXR1c1tcIkFDVElWRVwiXSA9IFwiQUNUSVZFXCI7XG4gICAgU3RhdHVzW1wiUFJFRU1QVEVEXCJdID0gXCJQUkVFTVBURURcIjtcbiAgICBTdGF0dXNbXCJTVUNDRUVERURcIl0gPSBcIlNVQ0NFRURFRFwiO1xuICAgIFN0YXR1c1tcIkFCT1JURURcIl0gPSBcIkFCT1JURURcIjtcbn0pKFN0YXR1cyA9IGV4cG9ydHMuU3RhdHVzIHx8IChleHBvcnRzLlN0YXR1cyA9IHt9KSk7XG47XG4vLyMgc291cmNlTWFwcGluZ1VSTD10eXBlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX3Jlc3QgPSAodGhpcyAmJiB0aGlzLl9fcmVzdCkgfHwgZnVuY3Rpb24gKHMsIGUpIHtcbiAgICB2YXIgdCA9IHt9O1xuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxuICAgICAgICB0W3BdID0gc1twXTtcbiAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIGlmIChlLmluZGV4T2YocFtpXSkgPCAwKVxuICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XG4gICAgcmV0dXJuIHQ7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2VuZXJhdGVHb2FsSUQoKSB7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhbXA6IG5vdyxcbiAgICAgICAgaWQ6IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyKSArIFwiLVwiICsgbm93LmdldFRpbWUoKSxcbiAgICB9O1xufVxuZXhwb3J0cy5nZW5lcmF0ZUdvYWxJRCA9IGdlbmVyYXRlR29hbElEO1xuZnVuY3Rpb24gaW5pdEdvYWwoZ29hbCwgaXNHb2FsKSB7XG4gICAgaWYgKGlzR29hbCA9PT0gdm9pZCAwKSB7IGlzR29hbCA9IGZ1bmN0aW9uIChnKSB7IHJldHVybiAhIWcuZ29hbF9pZDsgfTsgfVxuICAgIHJldHVybiBpc0dvYWwoZ29hbCkgPyBnb2FsIDoge1xuICAgICAgICBnb2FsX2lkOiBnZW5lcmF0ZUdvYWxJRCgpLFxuICAgICAgICBnb2FsOiBnb2FsLFxuICAgIH07XG59XG5leHBvcnRzLmluaXRHb2FsID0gaW5pdEdvYWw7XG5mdW5jdGlvbiBpc0VxdWFsKGZpcnN0LCBzZWNvbmQpIHtcbiAgICBpZiAoIWZpcnN0IHx8ICFzZWNvbmQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gKGZpcnN0LnN0YW1wID09PSBzZWNvbmQuc3RhbXAgJiYgZmlyc3QuaWQgPT09IHNlY29uZC5pZCk7XG59XG5leHBvcnRzLmlzRXF1YWwgPSBpc0VxdWFsO1xuZnVuY3Rpb24gaXNFcXVhbEdvYWwoZmlyc3QsIHNlY29uZCkge1xuICAgIGlmICghZmlyc3QgfHwgIXNlY29uZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBpc0VxdWFsKGZpcnN0LmdvYWxfaWQsIHNlY29uZC5nb2FsX2lkKTtcbn1cbmV4cG9ydHMuaXNFcXVhbEdvYWwgPSBpc0VxdWFsR29hbDtcbmZ1bmN0aW9uIGlzRXF1YWxSZXN1bHQoZmlyc3QsIHNlY29uZCkge1xuICAgIGlmICghZmlyc3QgfHwgIXNlY29uZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoaXNFcXVhbChmaXJzdC5zdGF0dXMuZ29hbF9pZCwgc2Vjb25kLnN0YXR1cy5nb2FsX2lkKVxuICAgICAgICAmJiBmaXJzdC5zdGF0dXMuc3RhdHVzID09PSBzZWNvbmQuc3RhdHVzLnN0YXR1cyk7XG59XG5leHBvcnRzLmlzRXF1YWxSZXN1bHQgPSBpc0VxdWFsUmVzdWx0O1xuZnVuY3Rpb24gcG93ZXJ1cChtYWluLCBjb25uZWN0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzb3VyY2VzKSB7XG4gICAgICAgIHZhciBzaW5rcyA9IG1haW4oc291cmNlcyk7XG4gICAgICAgIE9iamVjdC5rZXlzKHNvdXJjZXMucHJveGllcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGNvbm5lY3Qoc291cmNlcy5wcm94aWVzW2tleV0sIHNpbmtzLnRhcmdldHNba2V5XSk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdGFyZ2V0cyA9IHNpbmtzLnRhcmdldHMsIHNpbmtzV2l0aG91dFRhcmdldHMgPSBfX3Jlc3Qoc2lua3MsIFtcInRhcmdldHNcIl0pO1xuICAgICAgICByZXR1cm4gc2lua3NXaXRob3V0VGFyZ2V0cztcbiAgICB9O1xufVxuZXhwb3J0cy5wb3dlcnVwID0gcG93ZXJ1cDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtXCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciBTdGF0ZTtcbihmdW5jdGlvbiAoU3RhdGUpIHtcbiAgICBTdGF0ZVtcIlJVTk5JTkdcIl0gPSBcIlJVTk5JTkdcIjtcbiAgICBTdGF0ZVtcIkRPTkVcIl0gPSBcIkRPTkVcIjtcbiAgICBTdGF0ZVtcIlBSRUVNUFRJTkdcIl0gPSBcIlBSRUVNUFRJTkdcIjtcbn0pKFN0YXRlIHx8IChTdGF0ZSA9IHt9KSk7XG52YXIgSW5wdXRUeXBlO1xuKGZ1bmN0aW9uIChJbnB1dFR5cGUpIHtcbiAgICBJbnB1dFR5cGVbXCJHT0FMXCJdID0gXCJHT0FMXCI7XG4gICAgSW5wdXRUeXBlW1wiQ0FOQ0VMXCJdID0gXCJDQU5DRUxcIjtcbiAgICBJbnB1dFR5cGVbXCJTVEFSVFwiXSA9IFwiU1RBUlRcIjtcbiAgICBJbnB1dFR5cGVbXCJFTkRcIl0gPSBcIkVORFwiO1xuICAgIElucHV0VHlwZVtcIkVSUk9SXCJdID0gXCJFUlJPUlwiO1xuICAgIElucHV0VHlwZVtcIlJFU1VMVFwiXSA9IFwiUkVTVUxUXCI7XG59KShJbnB1dFR5cGUgfHwgKElucHV0VHlwZSA9IHt9KSk7XG47XG5mdW5jdGlvbiBpbnB1dChnb2FsJCwgc3RhcnRFdmVudCQsIGVuZEV2ZW50JCwgZXJyb3JFdmVudCQsIHJlc3VsdEV2ZW50JCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5maWx0ZXIoZnVuY3Rpb24gKGdvYWwpIHsgcmV0dXJuIHR5cGVvZiBnb2FsICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIGlmIChnb2FsID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5DQU5DRUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBJbnB1dFR5cGUuR09BTCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogISFnb2FsLmdvYWxfaWQgPyBnb2FsIDogYWN0aW9uXzEuaW5pdEdvYWwoZ29hbCksXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSksIHN0YXJ0RXZlbnQkLm1hcFRvKHsgdHlwZTogSW5wdXRUeXBlLlNUQVJULCB2YWx1ZTogbnVsbCB9KSwgZW5kRXZlbnQkLm1hcFRvKHsgdHlwZTogSW5wdXRUeXBlLkVORCwgdmFsdWU6IG51bGwgfSksIGVycm9yRXZlbnQkLm1hcChmdW5jdGlvbiAoZXZlbnQpIHsgcmV0dXJuICh7IHR5cGU6IElucHV0VHlwZS5FUlJPUiwgdmFsdWU6IGV2ZW50IH0pOyB9KSwgcmVzdWx0RXZlbnQkLm1hcChmdW5jdGlvbiAoZXZlbnQpIHsgcmV0dXJuICh7IHR5cGU6IElucHV0VHlwZS5SRVNVTFQsIHZhbHVlOiBldmVudCB9KTsgfSkpO1xufVxudmFyIHRyYW5zaXRpb25UYWJsZSA9IChfYSA9IHt9LFxuICAgIF9hW1N0YXRlLkRPTkVdID0gKF9iID0ge30sXG4gICAgICAgIF9iW0lucHV0VHlwZS5HT0FMXSA9IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgIF9iKSxcbiAgICBfYVtTdGF0ZS5SVU5OSU5HXSA9IChfYyA9IHt9LFxuICAgICAgICBfY1tJbnB1dFR5cGUuR09BTF0gPSBTdGF0ZS5QUkVFTVBUSU5HLFxuICAgICAgICBfY1tJbnB1dFR5cGUuQ0FOQ0VMXSA9IFN0YXRlLlBSRUVNUFRJTkcsXG4gICAgICAgIF9jW0lucHV0VHlwZS5TVEFSVF0gPSBTdGF0ZS5SVU5OSU5HLFxuICAgICAgICBfY1tJbnB1dFR5cGUuRU5EXSA9IFN0YXRlLkRPTkUsXG4gICAgICAgIF9jKSxcbiAgICBfYVtTdGF0ZS5QUkVFTVBUSU5HXSA9IChfZCA9IHt9LFxuICAgICAgICBfZFtJbnB1dFR5cGUuRU5EXSA9IFN0YXRlLkRPTkUsXG4gICAgICAgIF9kKSxcbiAgICBfYSk7XG5mdW5jdGlvbiB0cmFuc2l0aW9uKHByZXZTdGF0ZSwgcHJldlZhcmlhYmxlcywgaW5wdXQpIHtcbiAgICB2YXIgc3RhdGVzID0gdHJhbnNpdGlvblRhYmxlW3ByZXZTdGF0ZV07XG4gICAgaWYgKCFzdGF0ZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBwcmV2U3RhdGU9XFxcIlwiICsgcHJldlN0YXRlICsgXCJcXFwiXCIpO1xuICAgIH1cbiAgICB2YXIgc3RhdGUgPSBzdGF0ZXNbaW5wdXQudHlwZV07XG4gICAgaWYgKCFzdGF0ZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiVW5kZWZpbmVkIHRyYW5zaXRpb24gZm9yIFxcXCJcIiArIHByZXZTdGF0ZSArIFwiXFxcIiBcXFwiXCIgKyBpbnB1dC50eXBlICsgXCJcXFwiOyBcIlxuICAgICAgICAgICAgKyBcInNldCBzdGF0ZSB0byBwcmV2U3RhdGVcIik7XG4gICAgICAgIHN0YXRlID0gcHJldlN0YXRlO1xuICAgIH1cbiAgICBpZiAocHJldlN0YXRlID09PSBTdGF0ZS5ET05FICYmIHN0YXRlID09PSBTdGF0ZS5SVU5OSU5HKSB7XG4gICAgICAgIC8vIFN0YXJ0IGEgbmV3IGdvYWxcbiAgICAgICAgdmFyIGdvYWwgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGdvYWwuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICB0cmFuc2NyaXB0OiBudWxsLFxuICAgICAgICAgICAgICAgIGVycm9yOiBudWxsLFxuICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgIGFyZ3M6IGdvYWwuZ29hbFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSBpZiAocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HICYmIHN0YXRlID09PSBTdGF0ZS5SVU5OSU5HKSB7XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuUkVTVUxUKSB7XG4gICAgICAgICAgICB2YXIgZXZlbnRfMSA9IGlucHV0LnZhbHVlO1xuICAgICAgICAgICAgdmFyIGxhc3QgPSBldmVudF8xLnJlc3VsdHMubGVuZ3RoIC0gMTtcbiAgICAgICAgICAgIHZhciB0cmFuc2NyaXB0ID0gZXZlbnRfMS5yZXN1bHRzW2xhc3RdWzBdLnRyYW5zY3JpcHQ7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IF9fYXNzaWduKHt9LCBwcmV2VmFyaWFibGVzLCB7IHRyYW5zY3JpcHQ6IHRyYW5zY3JpcHQgfSksXG4gICAgICAgICAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5FUlJPUikge1xuICAgICAgICAgICAgdmFyIGV2ZW50XzIgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogX19hc3NpZ24oe30sIHByZXZWYXJpYWJsZXMsIHsgZXJyb3I6IGV2ZW50XzIuZXJyb3IgfSksXG4gICAgICAgICAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHN0YXRlID09PSBTdGF0ZS5ET05FKSB7XG4gICAgICAgIGlmIChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgfHwgcHJldlN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKSB7XG4gICAgICAgICAgICAvLyBTdG9wIHRoZSBjdXJyZW50IGdvYWwgYW5kIHN0YXJ0IHRoZSBxdWV1ZWQgbmV3IGdvYWxcbiAgICAgICAgICAgIHZhciBuZXdHb2FsID0gcHJldlZhcmlhYmxlcy5uZXdHb2FsO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogISFuZXdHb2FsID8gU3RhdGUuUlVOTklORyA6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiAhIW5ld0dvYWwgPyBuZXdHb2FsLmdvYWxfaWQgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB0cmFuc2NyaXB0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG91dHB1dHM6ICEhbmV3R29hbCA/IHtcbiAgICAgICAgICAgICAgICAgICAgYXJnczogbmV3R29hbC5nb2FsLFxuICAgICAgICAgICAgICAgIH0gOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHByZXZWYXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogKHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyAmJiAhcHJldlZhcmlhYmxlcy5lcnJvcilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERURcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6ICghIXByZXZWYXJpYWJsZXMuZXJyb3IpID8gYWN0aW9uXzEuU3RhdHVzLkFCT1JURUQgOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgJiYgIXByZXZWYXJpYWJsZXMuZXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IChwcmV2VmFyaWFibGVzLnRyYW5zY3JpcHQgfHwgJycpIC8vICcnIGZvciBub24tc3BlZWNoIGlucHV0c1xuICAgICAgICAgICAgICAgICAgICAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgfHwgcHJldlN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKVxuICAgICAgICAmJiBzdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORykge1xuICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkdPQUwgfHwgaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkNBTkNFTCkge1xuICAgICAgICAgICAgLy8gU3RhcnQgc3RvcHBpbmcgdGhlIGN1cnJlbnQgZ29hbCBhbmQgcXVldWUgYSBuZXcgZ29hbCBpZiByZWNlaXZlZCBvbmVcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogX19hc3NpZ24oe30sIHByZXZWYXJpYWJsZXMsIHsgbmV3R29hbDogaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkdPQUwgPyBpbnB1dC52YWx1ZSA6IG51bGwgfSksXG4gICAgICAgICAgICAgICAgb3V0cHV0czogcHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HID8ge1xuICAgICAgICAgICAgICAgICAgICBhcmdzOiBudWxsLFxuICAgICAgICAgICAgICAgIH0gOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGU6IHByZXZTdGF0ZSxcbiAgICAgICAgdmFyaWFibGVzOiBwcmV2VmFyaWFibGVzLFxuICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JCkge1xuICAgIHZhciBpbml0UmVkdWNlciQgPSB4c3RyZWFtXzEuZGVmYXVsdC5vZihmdW5jdGlvbiBpbml0UmVkdWNlcihwcmV2KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0ZTogU3RhdGUuRE9ORSxcbiAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgIGdvYWxfaWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgdHJhbnNjcmlwdDogbnVsbCxcbiAgICAgICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIGlucHV0UmVkdWNlciQgPSBpbnB1dCRcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoaW5wdXQpIHsgcmV0dXJuIGZ1bmN0aW9uIGlucHV0UmVkdWNlcihwcmV2KSB7XG4gICAgICAgIHJldHVybiB0cmFuc2l0aW9uKHByZXYuc3RhdGUsIHByZXYudmFyaWFibGVzLCBpbnB1dCk7XG4gICAgfTsgfSk7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGluaXRSZWR1Y2VyJCwgaW5wdXRSZWR1Y2VyJCk7XG59XG4vKipcbiAqIFdlYiBTcGVlY2ggQVBJJ3MgW1NwZWVjaFJlY29nbml0aW9uXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoUmVjb2duaXRpb24pXG4gKiBhY3Rpb24gY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSBzb3VyY2VzXG4gKlxuICogICAqIGdvYWw6IGEgc3RyZWFtIG9mIGBudWxsYCAoYXMgXCJjYW5jZWxcIikgb3IgYFNwZWVjaFJlY29nbml0aW9uYFxuICogICAgIHByb3BlcnRpZXMgKGFzIFwiZ29hbFwiKS5cbiAqICAgKiBTcGVlY2hTeW50aGVzaXM6IGBFdmVudFNvdXJjZWAgZm9yIGBzdGFydGAsIGBlbmRgLCBgZXJyb3JgLCBgcmVzdWx0YFxuICogICAgIGV2ZW50cy5cbiAqXG4gKiBAcmV0dXJuIHNpbmtzXG4gKlxuICogICAqIG91dHB1dDogYSBzdHJlYW0gZm9yIHRoZSBTcGVlY2hSZWNvZ25pdGlvbiBkcml2ZXIgaW5wdXQuXG4gKiAgICogcmVzdWx0OiBhIHN0cmVhbSBvZiBhY3Rpb24gcmVzdWx0cy4gYHJlc3VsdC5yZXN1bHRgIGlzIGEgdHJhbnNjcmlwdCBmcm9tXG4gKiAgICAgdGhlIHJlY29nbml0aW9uOyBpdCB3aWxsIGJlIGAnJ2AgZm9yIG5vbi1zcGVlY2ggaW5wdXRzLlxuICpcbiAqL1xuZnVuY3Rpb24gU3BlZWNoUmVjb2duaXRpb25BY3Rpb24oc291cmNlcykge1xuICAgIHZhciBpbnB1dCQgPSBpbnB1dCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLmdvYWwpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uLmV2ZW50cygnc3RhcnQnKSksIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb24uZXZlbnRzKCdlbmQnKSksIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb24uZXZlbnRzKCdlcnJvcicpKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5TcGVlY2hSZWNvZ25pdGlvbi5ldmVudHMoJ3Jlc3VsdCcpKSk7XG4gICAgdmFyIHN0YXRlJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSk7IC8vIGRyb3AgXCJudWxsXCJcbiAgICB2YXIgb3V0cHV0cyQgPSBzdGF0ZSQubWFwKGZ1bmN0aW9uIChzdGF0ZSkgeyByZXR1cm4gc3RhdGUub3V0cHV0czsgfSlcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzOyB9KTtcbiAgICB2YXIgcmVzdWx0JCA9IHN0YXRlJC5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiBzdGF0ZS5yZXN1bHQ7IH0pLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7IHJldHVybiAhIXJlc3VsdDsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb3V0cHV0OiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5hcmdzOyB9KSksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChyZXN1bHQkKSxcbiAgICB9O1xufVxuZXhwb3J0cy5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbiA9IFNwZWVjaFJlY29nbml0aW9uQWN0aW9uO1xudmFyIF9hLCBfYiwgX2MsIF9kO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3BlZWNoUmVjb2duaXRpb25BY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgYWN0aW9uXzEgPSByZXF1aXJlKFwiQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uXCIpO1xudmFyIFN0YXRlO1xuKGZ1bmN0aW9uIChTdGF0ZSkge1xuICAgIFN0YXRlW1wiUlVOTklOR1wiXSA9IFwiUlVOTklOR1wiO1xuICAgIFN0YXRlW1wiRE9ORVwiXSA9IFwiRE9ORVwiO1xuICAgIFN0YXRlW1wiUFJFRU1QVElOR1wiXSA9IFwiUFJFRU1QVElOR1wiO1xufSkoU3RhdGUgfHwgKFN0YXRlID0ge30pKTtcbnZhciBJbnB1dFR5cGU7XG4oZnVuY3Rpb24gKElucHV0VHlwZSkge1xuICAgIElucHV0VHlwZVtcIkdPQUxcIl0gPSBcIkdPQUxcIjtcbiAgICBJbnB1dFR5cGVbXCJDQU5DRUxcIl0gPSBcIkNBTkNFTFwiO1xuICAgIElucHV0VHlwZVtcIlNUQVJUXCJdID0gXCJTVEFSVFwiO1xuICAgIElucHV0VHlwZVtcIkVORFwiXSA9IFwiRU5EXCI7XG59KShJbnB1dFR5cGUgfHwgKElucHV0VHlwZSA9IHt9KSk7XG47XG5mdW5jdGlvbiBpbnB1dChnb2FsJCwgc3RhcnRFdmVudCQsIGVuZEV2ZW50JCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5maWx0ZXIoZnVuY3Rpb24gKGdvYWwpIHsgcmV0dXJuIHR5cGVvZiBnb2FsICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIGlmIChnb2FsID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5DQU5DRUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gISFnb2FsLmdvYWxfaWQgPyBnb2FsIDogYWN0aW9uXzEuaW5pdEdvYWwoZ29hbCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5HT0FMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB0eXBlb2YgdmFsdWUuZ29hbCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogeyB0ZXh0OiB2YWx1ZS5nb2FsIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiB2YWx1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KSwgc3RhcnRFdmVudCQubWFwVG8oeyB0eXBlOiBJbnB1dFR5cGUuU1RBUlQsIHZhbHVlOiBudWxsIH0pLCBlbmRFdmVudCQubWFwVG8oeyB0eXBlOiBJbnB1dFR5cGUuRU5ELCB2YWx1ZTogbnVsbCB9KSk7XG59XG52YXIgdHJhbnNpdGlvblRhYmxlID0gKF9hID0ge30sXG4gICAgX2FbU3RhdGUuRE9ORV0gPSAoX2IgPSB7fSxcbiAgICAgICAgX2JbSW5wdXRUeXBlLkdPQUxdID0gU3RhdGUuUlVOTklORyxcbiAgICAgICAgX2IpLFxuICAgIF9hW1N0YXRlLlJVTk5JTkddID0gKF9jID0ge30sXG4gICAgICAgIF9jW0lucHV0VHlwZS5HT0FMXSA9IFN0YXRlLlBSRUVNUFRJTkcsXG4gICAgICAgIF9jW0lucHV0VHlwZS5DQU5DRUxdID0gU3RhdGUuUFJFRU1QVElORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLlNUQVJUXSA9IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgIF9jW0lucHV0VHlwZS5FTkRdID0gU3RhdGUuRE9ORSxcbiAgICAgICAgX2MpLFxuICAgIF9hW1N0YXRlLlBSRUVNUFRJTkddID0gKF9kID0ge30sXG4gICAgICAgIF9kW0lucHV0VHlwZS5FTkRdID0gU3RhdGUuRE9ORSxcbiAgICAgICAgX2QpLFxuICAgIF9hKTtcbmZ1bmN0aW9uIHRyYW5zaXRpb24ocHJldlN0YXRlLCBwcmV2VmFyaWFibGVzLCBpbnB1dCkge1xuICAgIHZhciBzdGF0ZXMgPSB0cmFuc2l0aW9uVGFibGVbcHJldlN0YXRlXTtcbiAgICBpZiAoIXN0YXRlcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHByZXZTdGF0ZT1cXFwiXCIgKyBwcmV2U3RhdGUgKyBcIlxcXCJcIik7XG4gICAgfVxuICAgIHZhciBzdGF0ZSA9IHN0YXRlc1tpbnB1dC50eXBlXTtcbiAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJVbmRlZmluZWQgdHJhbnNpdGlvbiBmb3IgXFxcIlwiICsgcHJldlN0YXRlICsgXCJcXFwiIFxcXCJcIiArIGlucHV0LnR5cGUgKyBcIlxcXCI7IFwiXG4gICAgICAgICAgICArIFwic2V0IHN0YXRlIHRvIHByZXZTdGF0ZVwiKTtcbiAgICAgICAgc3RhdGUgPSBwcmV2U3RhdGU7XG4gICAgfVxuICAgIGlmIChwcmV2U3RhdGUgPT09IFN0YXRlLkRPTkUgJiYgc3RhdGUgPT09IFN0YXRlLlJVTk5JTkcpIHtcbiAgICAgICAgLy8gU3RhcnQgYSBuZXcgZ29hbFxuICAgICAgICB2YXIgZ29hbCA9IGlucHV0LnZhbHVlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogZ29hbC5nb2FsX2lkLFxuICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgIGFyZ3M6IGdvYWwuZ29hbFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSBpZiAoc3RhdGUgPT09IFN0YXRlLkRPTkUpIHtcbiAgICAgICAgaWYgKHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyB8fCBwcmV2U3RhdGUgPT09IFN0YXRlLlBSRUVNUFRJTkcpIHtcbiAgICAgICAgICAgIC8vIFN0b3AgdGhlIGN1cnJlbnQgZ29hbCBhbmQgc3RhcnQgdGhlIHF1ZXVlZCBuZXcgZ29hbFxuICAgICAgICAgICAgdmFyIG5ld0dvYWwgPSBwcmV2VmFyaWFibGVzLm5ld0dvYWw7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiAhIW5ld0dvYWwgPyBTdGF0ZS5SVU5OSU5HIDogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6ICEhbmV3R29hbCA/IG5ld0dvYWwuZ29hbF9pZCA6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiAhIW5ld0dvYWwgPyB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IG5ld0dvYWwuZ29hbCxcbiAgICAgICAgICAgICAgICB9IDogbnVsbCxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBwcmV2VmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklOR1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCA6IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICgocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HIHx8IHByZXZTdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORylcbiAgICAgICAgJiYgc3RhdGUgPT09IFN0YXRlLlBSRUVNUFRJTkcpIHtcbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5HT0FMIHx8IGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5DQU5DRUwpIHtcbiAgICAgICAgICAgIC8vIFN0YXJ0IHN0b3BwaW5nIHRoZSBjdXJyZW50IGdvYWwgYW5kIHF1ZXVlIGEgbmV3IGdvYWwgaWYgcmVjZWl2ZWQgb25lXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IF9fYXNzaWduKHt9LCBwcmV2VmFyaWFibGVzLCB7IG5ld0dvYWw6IGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5HT0FMID8gaW5wdXQudmFsdWUgOiBudWxsIH0pLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgYXJnczogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5TVEFSVCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBwcmV2VmFyaWFibGVzLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgYXJnczogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGU6IHByZXZTdGF0ZSxcbiAgICAgICAgdmFyaWFibGVzOiBwcmV2VmFyaWFibGVzLFxuICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JCkge1xuICAgIHZhciBpbml0UmVkdWNlciQgPSB4c3RyZWFtXzEuZGVmYXVsdC5vZihmdW5jdGlvbiBpbml0UmVkdWNlcihwcmV2KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0ZTogU3RhdGUuRE9ORSxcbiAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgIGdvYWxfaWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciBpbnB1dFJlZHVjZXIkID0gaW5wdXQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiBpbnB1dFJlZHVjZXIocHJldikge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihwcmV2LnN0YXRlLCBwcmV2LnZhcmlhYmxlcywgaW5wdXQpO1xuICAgIH07IH0pO1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbml0UmVkdWNlciQsIGlucHV0UmVkdWNlciQpO1xufVxuLyoqXG4gKiBXZWIgU3BlZWNoIEFQSSdzIFtTcGVlY2hTeW50aGVzaXNdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hTeW50aGVzaXMpXG4gKiBhY3Rpb24gY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSBzb3VyY2VzXG4gKlxuICogICAqIGdvYWw6IGEgc3RyZWFtIG9mIGBudWxsYCAoYXMgXCJjYW5jZWxcIikgb3IgYFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZWBcbiAqICAgICBwcm9wZXJ0aWVzIChhcyBcImdvYWxcIikuXG4gKiAgICogU3BlZWNoU3ludGhlc2lzOiBgRXZlbnRTb3VyY2VgIGZvciBgc3RhcnRgIGFuZCBgZW5kYCBldmVudHMuXG4gKlxuICogQHJldHVybiBzaW5rc1xuICpcbiAqICAgKiBvdXRwdXQ6IGEgc3RyZWFtIGZvciB0aGUgU3BlZWNoU3ludGhlc2lzIGRyaXZlciBpbnB1dC5cbiAqICAgKiByZXN1bHQ6IGEgc3RyZWFtIG9mIGFjdGlvbiByZXN1bHRzLiBgcmVzdWx0LnJlc3VsdGAgaXMgYWx3YXlzIGBudWxsYC5cbiAqXG4gKi9cbmZ1bmN0aW9uIFNwZWVjaFN5bnRoZXNpc0FjdGlvbihzb3VyY2VzKSB7XG4gICAgdmFyIGlucHV0JCA9IGlucHV0KHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuZ29hbCksIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuU3BlZWNoU3ludGhlc2lzLmV2ZW50cygnc3RhcnQnKSksIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuU3BlZWNoU3ludGhlc2lzLmV2ZW50cygnZW5kJykpKTtcbiAgICB2YXIgc3RhdGUkID0gdHJhbnNpdGlvblJlZHVjZXIoaW5wdXQkKVxuICAgICAgICAuZm9sZChmdW5jdGlvbiAoc3RhdGUsIHJlZHVjZXIpIHsgcmV0dXJuIHJlZHVjZXIoc3RhdGUpOyB9LCBudWxsKVxuICAgICAgICAuZHJvcCgxKTsgLy8gZHJvcCBcIm51bGxcIlxuICAgIHZhciBvdXRwdXRzJCA9IHN0YXRlJC5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiBzdGF0ZS5vdXRwdXRzOyB9KVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiAhIW91dHB1dHM7IH0pO1xuICAgIHZhciByZXN1bHQkID0gc3RhdGUkLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuIHN0YXRlLnJlc3VsdDsgfSkuZmlsdGVyKGZ1bmN0aW9uIChyZXN1bHQpIHsgcmV0dXJuICEhcmVzdWx0OyB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBvdXRwdXQ6IGFkYXB0XzEuYWRhcHQob3V0cHV0cyQubWFwKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiBvdXRwdXRzLmFyZ3M7IH0pKSxcbiAgICAgICAgcmVzdWx0OiBhZGFwdF8xLmFkYXB0KHJlc3VsdCQpLFxuICAgIH07XG59XG5leHBvcnRzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbiA9IFNwZWVjaFN5bnRoZXNpc0FjdGlvbjtcbnZhciBfYSwgX2IsIF9jLCBfZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNwZWVjaFN5bnRoZXNpc0FjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBtYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyXzEgPSByZXF1aXJlKFwiLi9tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyXCIpO1xuZXhwb3J0cy5tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyID0gbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlcl8xLm1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXI7XG52YXIgU3BlZWNoU3ludGhlc2lzQWN0aW9uXzEgPSByZXF1aXJlKFwiLi9TcGVlY2hTeW50aGVzaXNBY3Rpb25cIik7XG5leHBvcnRzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbiA9IFNwZWVjaFN5bnRoZXNpc0FjdGlvbl8xLlNwZWVjaFN5bnRoZXNpc0FjdGlvbjtcbnZhciBtYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXJfMSA9IHJlcXVpcmUoXCIuL21ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlclwiKTtcbmV4cG9ydHMubWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyID0gbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyXzEubWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyO1xudmFyIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uXzEgPSByZXF1aXJlKFwiLi9TcGVlY2hSZWNvZ25pdGlvbkFjdGlvblwiKTtcbmV4cG9ydHMuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24gPSBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbl8xLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgZnJvbUV2ZW50XzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW0vZXh0cmEvZnJvbUV2ZW50XCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIFJlY29nbml0aW9uU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlY29nbml0aW9uU291cmNlKF9yZWNvZ25pdGlvbikge1xuICAgICAgICB0aGlzLl9yZWNvZ25pdGlvbiA9IF9yZWNvZ25pdGlvbjtcbiAgICB9XG4gICAgUmVjb2duaXRpb25Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGFkYXB0XzEuYWRhcHQoZnJvbUV2ZW50XzEuZGVmYXVsdCh0aGlzLl9yZWNvZ25pdGlvbiwgZXZlbnROYW1lKSk7XG4gICAgfTtcbiAgICByZXR1cm4gUmVjb2duaXRpb25Tb3VyY2U7XG59KCkpO1xuLyoqXG4gKiBXZWIgU3BlZWNoIEFQSSdzIFtTcGVlY2hSZWNvZ25pdGlvbl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFJlY29nbml0aW9uKVxuICogZHJpdmVyIGZhY3RvcnkuXG4gKlxuICogQHJldHVybiB7RHJpdmVyfSB0aGUgU3BlZWNoUmVjb2duaXRpb24gQ3ljbGUuanMgZHJpdmVyIGZ1bmN0aW9uLiBJdCB0YWtlcyBhXG4gKiAgIHN0cmVhbSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgW2BTcGVlY2hSZWNvZ25pdGlvbmAgcHJvcGVydGllc10oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFJlY29nbml0aW9uI1Byb3BlcnRpZXMpXG4gKiAgIGFuZCByZXR1cm5zIGEgYEV2ZW50U291cmNlYDpcbiAqXG4gKiAgICogYEV2ZW50U291cmNlLmV2ZW50cyhldmVudE5hbWUpYCByZXR1cm5zIGEgc3RyZWFtIG9mIGBldmVudE5hbWVgXG4gKiAgICAgZXZlbnRzIGZyb20gW2BTcGVlY2hSZWNvZ25pdGlvbmBdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hSZWNvZ25pdGlvbiNFdmVudF9oYW5kbGVycykuXG4gKi9cbmZ1bmN0aW9uIG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcigpIHtcbiAgICB2YXIgcmVjb2duaXRpb24gPSBuZXcgd2Via2l0U3BlZWNoUmVjb2duaXRpb24oKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHNpbmskKSB7XG4gICAgICAgIHNpbmskLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgLy8gYXJyYXkgdmFsdWVzIGFyZSBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UgcHJvcGVydGllcyB0aGF0IGFyZSBub3RcbiAgICAgICAgICAgICAgICAvLyAgIGV2ZW50IGhhbmRsZXJzOyBzZWVcbiAgICAgICAgICAgICAgICAvLyAgIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hSZWNvZ25pdGlvblxuICAgICAgICAgICAgICAgIGlmICghYXJncykge1xuICAgICAgICAgICAgICAgICAgICByZWNvZ25pdGlvbi5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgWydsYW5nJywgJ2NvbnRpbnVvdXMnLCAnaW50ZXJpbVJlc3VsdHMnLCAnbWF4QWx0ZXJuYXRpdmVzJywgJ3NlcnZpY2VVUkknXS5tYXAoZnVuY3Rpb24gKGFyZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZyBpbiBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb2duaXRpb25bYXJnXSA9IGFyZ3NbYXJnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJlY29nbml0aW9uLnN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWNvZ25pdGlvblNvdXJjZShyZWNvZ25pdGlvbik7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyID0gbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGZyb21FdmVudF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2Zyb21FdmVudFwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBVdHRlcmFuY2VTb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXR0ZXJhbmNlU291cmNlKF91dHRlcmFuY2UpIHtcbiAgICAgICAgdGhpcy5fdXR0ZXJhbmNlID0gX3V0dGVyYW5jZTtcbiAgICB9XG4gICAgVXR0ZXJhbmNlU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KGZyb21FdmVudF8xLmRlZmF1bHQodGhpcy5fdXR0ZXJhbmNlLCBldmVudE5hbWUpKTtcbiAgICB9O1xuICAgIHJldHVybiBVdHRlcmFuY2VTb3VyY2U7XG59KCkpO1xuLyoqXG4gKiBXZWIgU3BlZWNoIEFQSSdzIFtTcGVlY2hTeW50aGVzaXNdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hTeW50aGVzaXMpXG4gKiBkcml2ZXIgZmFjdG9yeS5cbiAqXG4gKiBAcmV0dXJuIHtEcml2ZXJ9IHRoZSBTcGVlY2hTeW50aGVzaXMgQ3ljbGUuanMgZHJpdmVyIGZ1bmN0aW9uLiBJdCB0YWtlcyBhXG4gKiAgIHN0cmVhbSBvZiBvYmplY3RzIGNvbnRhaW5pbmcgW2BTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VgIHByb3BlcnRpZXNdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UjUHJvcGVydGllcylcbiAqICAgYW5kIHJldHVybnMgYSBgRXZlbnRTb3VyY2VgOlxuICpcbiAqICAgKiBgRXZlbnRTb3VyY2UuZXZlbnRzKGV2ZW50TmFtZSlgIHJldHVybnMgYSBzdHJlYW0gb2YgIGBldmVudE5hbWVgXG4gKiAgICAgZXZlbnRzIGZyb20gW2BTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VgXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlI0V2ZW50X2hhbmRsZXJzKS5cbiAqL1xuZnVuY3Rpb24gbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlcigpIHtcbiAgICB2YXIgc3ludGhlc2lzID0gd2luZG93LnNwZWVjaFN5bnRoZXNpcztcbiAgICB2YXIgdXR0ZXJhbmNlID0gbmV3IFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSgpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoc2luayQpIHtcbiAgICAgICAgc2luayQuYWRkTGlzdGVuZXIoe1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAvLyBhcnJheSB2YWx1ZXMgYXJlIFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSBwcm9wZXJ0aWVzIHRoYXQgYXJlIG5vdFxuICAgICAgICAgICAgICAgIC8vICAgZXZlbnQgaGFuZGxlcnM7IHNlZVxuICAgICAgICAgICAgICAgIC8vICAgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVxuICAgICAgICAgICAgICAgIGlmICghYXJncykge1xuICAgICAgICAgICAgICAgICAgICBzeW50aGVzaXMuY2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBbJ2xhbmcnLCAncGl0Y2gnLCAncmF0ZScsICd0ZXh0JywgJ3ZvaWNlJywgJ3ZvbHVtZSddLm1hcChmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJnIGluIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dHRlcmFuY2VbYXJnXSA9IGFyZ3NbYXJnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN5bnRoZXNpcy5zcGVhayh1dHRlcmFuY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXcgVXR0ZXJhbmNlU291cmNlKHV0dGVyYW5jZSk7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlciA9IG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbmZ1bmN0aW9uIGNoZWNrSXNvbGF0ZUFyZ3MoZGF0YWZsb3dDb21wb25lbnQsIHNjb3BlKSB7XG4gICAgaWYgKHR5cGVvZiBkYXRhZmxvd0NvbXBvbmVudCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGdpdmVuIHRvIGlzb2xhdGUoKSBtdXN0IGJlIGEgXCIgK1xuICAgICAgICAgICAgXCInZGF0YWZsb3dDb21wb25lbnQnIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgICBpZiAoc2NvcGUgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIGlzb2xhdGUoKSBtdXN0IG5vdCBiZSBudWxsXCIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNjb3Blcyhzb3VyY2VzLCBzY29wZXMsIHJhbmRvbVNjb3BlKSB7XG4gICAgdmFyIHBlckNoYW5uZWwgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhzb3VyY2VzKS5mb3JFYWNoKGZ1bmN0aW9uIChjaGFubmVsKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2NvcGVzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHNjb3BlcztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2FuZGlkYXRlID0gc2NvcGVzW2NoYW5uZWxdO1xuICAgICAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSBjYW5kaWRhdGU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdpbGRjYXJkID0gc2NvcGVzWycqJ107XG4gICAgICAgIGlmICh0eXBlb2Ygd2lsZGNhcmQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gd2lsZGNhcmQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHJhbmRvbVNjb3BlO1xuICAgIH0pO1xuICAgIHJldHVybiBwZXJDaGFubmVsO1xufVxuZnVuY3Rpb24gaXNvbGF0ZUFsbFNvdXJjZXMob3V0ZXJTb3VyY2VzLCBzY29wZXMpIHtcbiAgICB2YXIgaW5uZXJTb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgY2hhbm5lbCBpbiBvdXRlclNvdXJjZXMpIHtcbiAgICAgICAgdmFyIG91dGVyU291cmNlID0gb3V0ZXJTb3VyY2VzW2NoYW5uZWxdO1xuICAgICAgICBpZiAob3V0ZXJTb3VyY2VzLmhhc093blByb3BlcnR5KGNoYW5uZWwpICYmXG4gICAgICAgICAgICBvdXRlclNvdXJjZSAmJlxuICAgICAgICAgICAgc2NvcGVzW2NoYW5uZWxdICE9PSBudWxsICYmXG4gICAgICAgICAgICB0eXBlb2Ygb3V0ZXJTb3VyY2UuaXNvbGF0ZVNvdXJjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaW5uZXJTb3VyY2VzW2NoYW5uZWxdID0gb3V0ZXJTb3VyY2UuaXNvbGF0ZVNvdXJjZShvdXRlclNvdXJjZSwgc2NvcGVzW2NoYW5uZWxdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvdXRlclNvdXJjZXMuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkpIHtcbiAgICAgICAgICAgIGlubmVyU291cmNlc1tjaGFubmVsXSA9IG91dGVyU291cmNlc1tjaGFubmVsXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW5uZXJTb3VyY2VzO1xufVxuZnVuY3Rpb24gaXNvbGF0ZUFsbFNpbmtzKHNvdXJjZXMsIGlubmVyU2lua3MsIHNjb3Blcykge1xuICAgIHZhciBvdXRlclNpbmtzID0ge307XG4gICAgZm9yICh2YXIgY2hhbm5lbCBpbiBpbm5lclNpbmtzKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBzb3VyY2VzW2NoYW5uZWxdO1xuICAgICAgICB2YXIgaW5uZXJTaW5rID0gaW5uZXJTaW5rc1tjaGFubmVsXTtcbiAgICAgICAgaWYgKGlubmVyU2lua3MuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkgJiZcbiAgICAgICAgICAgIHNvdXJjZSAmJlxuICAgICAgICAgICAgc2NvcGVzW2NoYW5uZWxdICE9PSBudWxsICYmXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlLmlzb2xhdGVTaW5rID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBvdXRlclNpbmtzW2NoYW5uZWxdID0gYWRhcHRfMS5hZGFwdChzb3VyY2UuaXNvbGF0ZVNpbmsoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoaW5uZXJTaW5rKSwgc2NvcGVzW2NoYW5uZWxdKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaW5uZXJTaW5rcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSkge1xuICAgICAgICAgICAgb3V0ZXJTaW5rc1tjaGFubmVsXSA9IGlubmVyU2lua3NbY2hhbm5lbF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dGVyU2lua3M7XG59XG52YXIgY291bnRlciA9IDA7XG5mdW5jdGlvbiBuZXdTY29wZSgpIHtcbiAgICByZXR1cm4gXCJjeWNsZVwiICsgKytjb3VudGVyO1xufVxuLyoqXG4gKiBUYWtlcyBhIGBjb21wb25lbnRgIGZ1bmN0aW9uIGFuZCBhIGBzY29wZWAsIGFuZCByZXR1cm5zIGFuIGlzb2xhdGVkIHZlcnNpb25cbiAqIG9mIHRoZSBgY29tcG9uZW50YCBmdW5jdGlvbi5cbiAqXG4gKiBXaGVuIHRoZSBpc29sYXRlZCBjb21wb25lbnQgaXMgaW52b2tlZCwgZWFjaCBzb3VyY2UgcHJvdmlkZWQgdG8gaXQgaXNcbiAqIGlzb2xhdGVkIHRvIHRoZSBnaXZlbiBgc2NvcGVgIHVzaW5nIGBzb3VyY2UuaXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKWAsXG4gKiBpZiBwb3NzaWJsZS4gTGlrZXdpc2UsIHRoZSBzaW5rcyByZXR1cm5lZCBmcm9tIHRoZSBpc29sYXRlZCBjb21wb25lbnQgYXJlXG4gKiBpc29sYXRlZCB0byB0aGUgZ2l2ZW4gYHNjb3BlYCB1c2luZyBgc291cmNlLmlzb2xhdGVTaW5rKHNpbmssIHNjb3BlKWAuXG4gKlxuICogVGhlIGBzY29wZWAgY2FuIGJlIGEgc3RyaW5nIG9yIGFuIG9iamVjdC4gSWYgaXQgaXMgYW55dGhpbmcgZWxzZSB0aGFuIHRob3NlXG4gKiB0d28gdHlwZXMsIGl0IHdpbGwgYmUgY29udmVydGVkIHRvIGEgc3RyaW5nLiBJZiBgc2NvcGVgIGlzIGFuIG9iamVjdCwgaXRcbiAqIHJlcHJlc2VudHMgXCJzY29wZXMgcGVyIGNoYW5uZWxcIiwgYWxsb3dpbmcgeW91IHRvIHNwZWNpZnkgYSBkaWZmZXJlbnQgc2NvcGVcbiAqIGZvciBlYWNoIGtleSBvZiBzb3VyY2VzL3NpbmtzLiBGb3IgaW5zdGFuY2VcbiAqXG4gKiBgYGBqc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nLCBIVFRQOiAnYmFyJ30pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogWW91IGNhbiBhbHNvIHVzZSBhIHdpbGRjYXJkIGAnKidgIHRvIHVzZSBhcyBhIGRlZmF1bHQgZm9yIHNvdXJjZS9zaW5rc1xuICogY2hhbm5lbHMgdGhhdCBkaWQgbm90IHJlY2VpdmUgYSBzcGVjaWZpYyBzY29wZTpcbiAqXG4gKiBgYGBqc1xuICogLy8gVXNlcyAnYmFyJyBhcyB0aGUgaXNvbGF0aW9uIHNjb3BlIGZvciBIVFRQIGFuZCBvdGhlciBjaGFubmVsc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nLCAnKic6ICdiYXInfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBJZiBhIGNoYW5uZWwncyB2YWx1ZSBpcyBudWxsLCB0aGVuIHRoYXQgY2hhbm5lbCdzIHNvdXJjZXMgYW5kIHNpbmtzIHdvbid0IGJlXG4gKiBpc29sYXRlZC4gSWYgdGhlIHdpbGRjYXJkIGlzIG51bGwgYW5kIHNvbWUgY2hhbm5lbHMgYXJlIHVuc3BlY2lmaWVkLCB0aG9zZVxuICogY2hhbm5lbHMgd29uJ3QgYmUgaXNvbGF0ZWQuIElmIHlvdSBkb24ndCBoYXZlIGEgd2lsZGNhcmQgYW5kIHNvbWUgY2hhbm5lbHNcbiAqIGFyZSB1bnNwZWNpZmllZCwgdGhlbiBgaXNvbGF0ZWAgd2lsbCBnZW5lcmF0ZSBhIHJhbmRvbSBzY29wZS5cbiAqXG4gKiBgYGBqc1xuICogLy8gRG9lcyBub3QgaXNvbGF0ZSBIVFRQIHJlcXVlc3RzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2ZvbycsIEhUVFA6IG51bGx9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBgc2NvcGVgIGFyZ3VtZW50IGlzIG5vdCBwcm92aWRlZCBhdCBhbGwsIGEgbmV3IHNjb3BlIHdpbGwgYmVcbiAqIGF1dG9tYXRpY2FsbHkgY3JlYXRlZC4gVGhpcyBtZWFucyB0aGF0IHdoaWxlICoqYGlzb2xhdGUoY29tcG9uZW50LCBzY29wZSlgIGlzXG4gKiBwdXJlKiogKHJlZmVyZW50aWFsbHkgdHJhbnNwYXJlbnQpLCAqKmBpc29sYXRlKGNvbXBvbmVudClgIGlzIGltcHVyZSoqIChub3RcbiAqIHJlZmVyZW50aWFsbHkgdHJhbnNwYXJlbnQpLiBUd28gY2FsbHMgdG8gYGlzb2xhdGUoRm9vLCBiYXIpYCB3aWxsIGdlbmVyYXRlXG4gKiB0aGUgc2FtZSBjb21wb25lbnQuIEJ1dCwgdHdvIGNhbGxzIHRvIGBpc29sYXRlKEZvbylgIHdpbGwgZ2VuZXJhdGUgdHdvXG4gKiBkaXN0aW5jdCBjb21wb25lbnRzLlxuICpcbiAqIGBgYGpzXG4gKiAvLyBVc2VzIHNvbWUgYXJiaXRyYXJ5IHN0cmluZyBhcyB0aGUgaXNvbGF0aW9uIHNjb3BlIGZvciBIVFRQIGFuZCBvdGhlciBjaGFubmVsc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBOb3RlIHRoYXQgYm90aCBgaXNvbGF0ZVNvdXJjZSgpYCBhbmQgYGlzb2xhdGVTaW5rKClgIGFyZSBzdGF0aWMgbWVtYmVycyBvZlxuICogYHNvdXJjZWAuIFRoZSByZWFzb24gZm9yIHRoaXMgaXMgdGhhdCBkcml2ZXJzIHByb2R1Y2UgYHNvdXJjZWAgd2hpbGUgdGhlXG4gKiBhcHBsaWNhdGlvbiBwcm9kdWNlcyBgc2lua2AsIGFuZCBpdCdzIHRoZSBkcml2ZXIncyByZXNwb25zaWJpbGl0eSB0b1xuICogaW1wbGVtZW50IGBpc29sYXRlU291cmNlKClgIGFuZCBgaXNvbGF0ZVNpbmsoKWAuXG4gKlxuICogX05vdGUgZm9yIFR5cGVzY3JpcHQgdXNlcnM6XyBgaXNvbGF0ZWAgaXMgbm90IGN1cnJlbnRseSB0eXBlLXRyYW5zcGFyZW50IGFuZFxuICogd2lsbCBleHBsaWNpdGx5IGNvbnZlcnQgZ2VuZXJpYyB0eXBlIGFyZ3VtZW50cyB0byBgYW55YC4gVG8gcHJlc2VydmUgdHlwZXMgaW5cbiAqIHlvdXIgY29tcG9uZW50cywgeW91IGNhbiB1c2UgYSB0eXBlIGFzc2VydGlvbjpcbiAqXG4gKiBgYGB0c1xuICogLy8gaWYgQ2hpbGQgaXMgdHlwZWQgYENvbXBvbmVudDxTb3VyY2VzLCBTaW5rcz5gXG4gKiBjb25zdCBpc29sYXRlZENoaWxkID0gaXNvbGF0ZSggQ2hpbGQgKSBhcyBDb21wb25lbnQ8U291cmNlcywgU2lua3M+O1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcG9uZW50IGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXRcbiAqIGFuZCBvdXRwdXRzIGEgY29sbGVjdGlvbiBvZiBgc2lua3NgLlxuICogQHBhcmFtIHtTdHJpbmd9IHNjb3BlIGFuIG9wdGlvbmFsIHN0cmluZyB0aGF0IGlzIHVzZWQgdG8gaXNvbGF0ZSBlYWNoXG4gKiBgc291cmNlc2AgYW5kIGBzaW5rc2Agd2hlbiB0aGUgcmV0dXJuZWQgc2NvcGVkIGNvbXBvbmVudCBpcyBpbnZva2VkLlxuICogQHJldHVybiB7RnVuY3Rpb259IHRoZSBzY29wZWQgY29tcG9uZW50IGZ1bmN0aW9uIHRoYXQsIGFzIHRoZSBvcmlnaW5hbFxuICogYGNvbXBvbmVudGAgZnVuY3Rpb24sIHRha2VzIGBzb3VyY2VzYCBhbmQgcmV0dXJucyBgc2lua3NgLlxuICogQGZ1bmN0aW9uIGlzb2xhdGVcbiAqL1xuZnVuY3Rpb24gaXNvbGF0ZShjb21wb25lbnQsIHNjb3BlKSB7XG4gICAgaWYgKHNjb3BlID09PSB2b2lkIDApIHsgc2NvcGUgPSBuZXdTY29wZSgpOyB9XG4gICAgY2hlY2tJc29sYXRlQXJncyhjb21wb25lbnQsIHNjb3BlKTtcbiAgICB2YXIgcmFuZG9tU2NvcGUgPSB0eXBlb2Ygc2NvcGUgPT09ICdvYmplY3QnID8gbmV3U2NvcGUoKSA6ICcnO1xuICAgIHZhciBzY29wZXMgPSB0eXBlb2Ygc2NvcGUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzY29wZSA9PT0gJ29iamVjdCdcbiAgICAgICAgPyBzY29wZVxuICAgICAgICA6IHNjb3BlLnRvU3RyaW5nKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZWRDb21wb25lbnQob3V0ZXJTb3VyY2VzKSB7XG4gICAgICAgIHZhciByZXN0ID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICByZXN0W19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzY29wZXNQZXJDaGFubmVsID0gbm9ybWFsaXplU2NvcGVzKG91dGVyU291cmNlcywgc2NvcGVzLCByYW5kb21TY29wZSk7XG4gICAgICAgIHZhciBpbm5lclNvdXJjZXMgPSBpc29sYXRlQWxsU291cmNlcyhvdXRlclNvdXJjZXMsIHNjb3Blc1BlckNoYW5uZWwpO1xuICAgICAgICB2YXIgaW5uZXJTaW5rcyA9IGNvbXBvbmVudC5hcHBseSh2b2lkIDAsIFtpbm5lclNvdXJjZXNdLmNvbmNhdChyZXN0KSk7XG4gICAgICAgIHZhciBvdXRlclNpbmtzID0gaXNvbGF0ZUFsbFNpbmtzKG91dGVyU291cmNlcywgaW5uZXJTaW5rcywgc2NvcGVzUGVyQ2hhbm5lbCk7XG4gICAgICAgIHJldHVybiBvdXRlclNpbmtzO1xuICAgIH07XG59XG5pc29sYXRlLnJlc2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKGNvdW50ZXIgPSAwKTsgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGlzb2xhdGU7XG5mdW5jdGlvbiB0b0lzb2xhdGVkKHNjb3BlKSB7XG4gICAgaWYgKHNjb3BlID09PSB2b2lkIDApIHsgc2NvcGUgPSBuZXdTY29wZSgpOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjb21wb25lbnQpIHsgcmV0dXJuIGlzb2xhdGUoY29tcG9uZW50LCBzY29wZSk7IH07XG59XG5leHBvcnRzLnRvSXNvbGF0ZWQgPSB0b0lzb2xhdGVkO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICB2YXIgZ2xvYmFsT2JqO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IGdsb2JhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHRoaXM7XG4gICAgfVxuICAgIGdsb2JhbE9iai5DeWNsZWpzID0gZ2xvYmFsT2JqLkN5Y2xlanMgfHwge307XG4gICAgZ2xvYmFsT2JqID0gZ2xvYmFsT2JqLkN5Y2xlanM7XG4gICAgZ2xvYmFsT2JqLmFkYXB0U3RyZWFtID0gZ2xvYmFsT2JqLmFkYXB0U3RyZWFtIHx8IChmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XG4gICAgcmV0dXJuIGdsb2JhbE9iajtcbn1cbmZ1bmN0aW9uIHNldEFkYXB0KGYpIHtcbiAgICBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbSA9IGY7XG59XG5leHBvcnRzLnNldEFkYXB0ID0gc2V0QWRhcHQ7XG5mdW5jdGlvbiBhZGFwdChzdHJlYW0pIHtcbiAgICByZXR1cm4gZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0oc3RyZWFtKTtcbn1cbmV4cG9ydHMuYWRhcHQgPSBhZGFwdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFkYXB0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGludGVybmFsc18xID0gcmVxdWlyZShcIi4vaW50ZXJuYWxzXCIpO1xuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgcHJlcGFyZXMgdGhlIEN5Y2xlIGFwcGxpY2F0aW9uIHRvIGJlIGV4ZWN1dGVkLiBUYWtlcyBhIGBtYWluYFxuICogZnVuY3Rpb24gYW5kIHByZXBhcmVzIHRvIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb24gb2ZcbiAqIGRyaXZlciBmdW5jdGlvbnMuIEFzIGFuIG91dHB1dCwgYHNldHVwKClgIHJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhyZWVcbiAqIHByb3BlcnRpZXM6IGBzb3VyY2VzYCwgYHNpbmtzYCBhbmQgYHJ1bmAuIE9ubHkgd2hlbiBgcnVuKClgIGlzIGNhbGxlZCB3aWxsXG4gKiB0aGUgYXBwbGljYXRpb24gYWN0dWFsbHkgZXhlY3V0ZS4gUmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgYHJ1bigpYCBmb3JcbiAqIG1vcmUgZGV0YWlscy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQge3NldHVwfSBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IHtzb3VyY2VzLCBzaW5rcywgcnVufSA9IHNldHVwKG1haW4sIGRyaXZlcnMpO1xuICogLy8gLi4uXG4gKiBjb25zdCBkaXNwb3NlID0gcnVuKCk7IC8vIEV4ZWN1dGVzIHRoZSBhcHBsaWNhdGlvblxuICogLy8gLi4uXG4gKiBkaXNwb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCB0aHJlZSBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kXG4gKiBgcnVuYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgc2lua3NgIGlzIHRoZVxuICogY29sbGVjdGlvbiBvZiBkcml2ZXIgc2lua3MsIHRoZXNlIGNhbiBiZSB1c2VkIGZvciBkZWJ1Z2dpbmcgb3IgdGVzdGluZy4gYHJ1bmBcbiAqIGlzIHRoZSBmdW5jdGlvbiB0aGF0IG9uY2UgY2FsbGVkIHdpbGwgZXhlY3V0ZSB0aGUgYXBwbGljYXRpb24uXG4gKiBAZnVuY3Rpb24gc2V0dXBcbiAqL1xuZnVuY3Rpb24gc2V0dXAobWFpbiwgZHJpdmVycykge1xuICAgIGlmICh0eXBlb2YgbWFpbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgdGhlICdtYWluJyBcIiArIFwiZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRyaXZlcnMgIT09IFwib2JqZWN0XCIgfHwgZHJpdmVycyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGRyaXZlciBmdW5jdGlvbnMgYXMgcHJvcGVydGllcy5cIik7XG4gICAgfVxuICAgIGlmIChpbnRlcm5hbHNfMS5pc09iamVjdEVtcHR5KGRyaXZlcnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIGVuZ2luZSA9IHNldHVwUmV1c2FibGUoZHJpdmVycyk7XG4gICAgdmFyIHNpbmtzID0gbWFpbihlbmdpbmUuc291cmNlcyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHdpbmRvdy5DeWNsZWpzID0gd2luZG93LkN5Y2xlanMgfHwge307XG4gICAgICAgIHdpbmRvdy5DeWNsZWpzLnNpbmtzID0gc2lua3M7XG4gICAgfVxuICAgIGZ1bmN0aW9uIF9ydW4oKSB7XG4gICAgICAgIHZhciBkaXNwb3NlUnVuID0gZW5naW5lLnJ1bihzaW5rcyk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICAgICAgZGlzcG9zZVJ1bigpO1xuICAgICAgICAgICAgZW5naW5lLmRpc3Bvc2UoKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc2lua3M6IHNpbmtzLCBzb3VyY2VzOiBlbmdpbmUuc291cmNlcywgcnVuOiBfcnVuIH07XG59XG5leHBvcnRzLnNldHVwID0gc2V0dXA7XG4vKipcbiAqIEEgcGFydGlhbGx5LWFwcGxpZWQgdmFyaWFudCBvZiBzZXR1cCgpIHdoaWNoIGFjY2VwdHMgb25seSB0aGUgZHJpdmVycywgYW5kXG4gKiBhbGxvd3MgbWFueSBgbWFpbmAgZnVuY3Rpb25zIHRvIGV4ZWN1dGUgYW5kIHJldXNlIHRoaXMgc2FtZSBzZXQgb2YgZHJpdmVycy5cbiAqXG4gKiBUYWtlcyBhbiBvYmplY3Qgd2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIGlucHV0LCBhbmQgb3V0cHV0cyBhbiBvYmplY3Qgd2hpY2hcbiAqIGNvbnRhaW5zIHRoZSBnZW5lcmF0ZWQgc291cmNlcyAoZnJvbSB0aG9zZSBkcml2ZXJzKSBhbmQgYSBgcnVuYCBmdW5jdGlvblxuICogKHdoaWNoIGluIHR1cm4gZXhwZWN0cyBzaW5rcyBhcyBhcmd1bWVudCkuIFRoaXMgYHJ1bmAgZnVuY3Rpb24gY2FuIGJlIGNhbGxlZFxuICogbXVsdGlwbGUgdGltZXMgd2l0aCBkaWZmZXJlbnQgYXJndW1lbnRzLCBhbmQgaXQgd2lsbCByZXVzZSB0aGUgZHJpdmVycyB0aGF0XG4gKiB3ZXJlIHBhc3NlZCB0byBgc2V0dXBSZXVzYWJsZWAuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtzZXR1cFJldXNhYmxlfSBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IHtzb3VyY2VzLCBydW4sIGRpc3Bvc2V9ID0gc2V0dXBSZXVzYWJsZShkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogY29uc3Qgc2lua3MgPSBtYWluKHNvdXJjZXMpO1xuICogY29uc3QgZGlzcG9zZVJ1biA9IHJ1bihzaW5rcyk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2VSdW4oKTtcbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpOyAvLyBlbmRzIHRoZSByZXVzYWJpbGl0eSBvZiBkcml2ZXJzXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCB0aHJlZSBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBydW5gIGFuZFxuICogYGRpc3Bvc2VgLiBgc291cmNlc2AgaXMgdGhlIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNvdXJjZXMsIGBydW5gIGlzIHRoZVxuICogZnVuY3Rpb24gdGhhdCBvbmNlIGNhbGxlZCB3aXRoICdzaW5rcycgYXMgYXJndW1lbnQsIHdpbGwgZXhlY3V0ZSB0aGVcbiAqIGFwcGxpY2F0aW9uLCB0eWluZyB0b2dldGhlciBzb3VyY2VzIHdpdGggc2lua3MuIGBkaXNwb3NlYCB0ZXJtaW5hdGVzIHRoZVxuICogcmV1c2FibGUgcmVzb3VyY2VzIHVzZWQgYnkgdGhlIGRyaXZlcnMuIE5vdGUgYWxzbyB0aGF0IGBydW5gIHJldHVybnMgYVxuICogZGlzcG9zZSBmdW5jdGlvbiB3aGljaCB0ZXJtaW5hdGVzIHJlc291cmNlcyB0aGF0IGFyZSBzcGVjaWZpYyAobm90IHJldXNhYmxlKVxuICogdG8gdGhhdCBydW4uXG4gKiBAZnVuY3Rpb24gc2V0dXBSZXVzYWJsZVxuICovXG5mdW5jdGlvbiBzZXR1cFJldXNhYmxlKGRyaXZlcnMpIHtcbiAgICBpZiAodHlwZW9mIGRyaXZlcnMgIT09IFwib2JqZWN0XCIgfHwgZHJpdmVycyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBnaXZlbiB0byBzZXR1cFJldXNhYmxlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMuXCIpO1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWxzXzEuaXNPYmplY3RFbXB0eShkcml2ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBnaXZlbiB0byBzZXR1cFJldXNhYmxlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBhdCBsZWFzdCBvbmUgZHJpdmVyIGZ1bmN0aW9uIGRlY2xhcmVkIGFzIGEgcHJvcGVydHkuXCIpO1xuICAgIH1cbiAgICB2YXIgc2lua1Byb3hpZXMgPSBpbnRlcm5hbHNfMS5tYWtlU2lua1Byb3hpZXMoZHJpdmVycyk7XG4gICAgdmFyIHJhd1NvdXJjZXMgPSBpbnRlcm5hbHNfMS5jYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcyk7XG4gICAgdmFyIHNvdXJjZXMgPSBpbnRlcm5hbHNfMS5hZGFwdFNvdXJjZXMocmF3U291cmNlcyk7XG4gICAgZnVuY3Rpb24gX3J1bihzaW5rcykge1xuICAgICAgICByZXR1cm4gaW50ZXJuYWxzXzEucmVwbGljYXRlTWFueShzaW5rcywgc2lua1Byb3hpZXMpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkaXNwb3NlRW5naW5lKCkge1xuICAgICAgICBpbnRlcm5hbHNfMS5kaXNwb3NlU291cmNlcyhzb3VyY2VzKTtcbiAgICAgICAgaW50ZXJuYWxzXzEuZGlzcG9zZVNpbmtQcm94aWVzKHNpbmtQcm94aWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc291cmNlczogc291cmNlcywgcnVuOiBfcnVuLCBkaXNwb3NlOiBkaXNwb3NlRW5naW5lIH07XG59XG5leHBvcnRzLnNldHVwUmV1c2FibGUgPSBzZXR1cFJldXNhYmxlO1xuLyoqXG4gKiBUYWtlcyBhIGBtYWluYCBmdW5jdGlvbiBhbmQgY2lyY3VsYXJseSBjb25uZWN0cyBpdCB0byB0aGUgZ2l2ZW4gY29sbGVjdGlvblxuICogb2YgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQgcnVuIGZyb20gJ0BjeWNsZS9ydW4nO1xuICogY29uc3QgZGlzcG9zZSA9IHJ1bihtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogVGhlIGBtYWluYCBmdW5jdGlvbiBleHBlY3RzIGEgY29sbGVjdGlvbiBvZiBcInNvdXJjZVwiIHN0cmVhbXMgKHJldHVybmVkIGZyb21cbiAqIGRyaXZlcnMpIGFzIGlucHV0LCBhbmQgc2hvdWxkIHJldHVybiBhIGNvbGxlY3Rpb24gb2YgXCJzaW5rXCIgc3RyZWFtcyAodG8gYmVcbiAqIGdpdmVuIHRvIGRyaXZlcnMpLiBBIFwiY29sbGVjdGlvbiBvZiBzdHJlYW1zXCIgaXMgYSBKYXZhU2NyaXB0IG9iamVjdCB3aGVyZVxuICoga2V5cyBtYXRjaCB0aGUgZHJpdmVyIG5hbWVzIHJlZ2lzdGVyZWQgYnkgdGhlIGBkcml2ZXJzYCBvYmplY3QsIGFuZCB2YWx1ZXNcbiAqIGFyZSB0aGUgc3RyZWFtcy4gUmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgZWFjaCBkcml2ZXIgdG8gc2VlIG1vcmVcbiAqIGRldGFpbHMgb24gd2hhdCB0eXBlcyBvZiBzb3VyY2VzIGl0IG91dHB1dHMgYW5kIHNpbmtzIGl0IHJlY2VpdmVzLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1haW4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dCBhbmQgb3V0cHV0c1xuICogYHNpbmtzYC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkcml2ZXJzIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBkcml2ZXIgbmFtZXMgYW5kIHZhbHVlc1xuICogYXJlIGRyaXZlciBmdW5jdGlvbnMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBkaXNwb3NlIGZ1bmN0aW9uLCB1c2VkIHRvIHRlcm1pbmF0ZSB0aGUgZXhlY3V0aW9uIG9mIHRoZVxuICogQ3ljbGUuanMgcHJvZ3JhbSwgY2xlYW5pbmcgdXAgcmVzb3VyY2VzIHVzZWQuXG4gKiBAZnVuY3Rpb24gcnVuXG4gKi9cbmZ1bmN0aW9uIHJ1bihtYWluLCBkcml2ZXJzKSB7XG4gICAgdmFyIHByb2dyYW0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgd2luZG93WydDeWNsZWpzRGV2VG9vbF9zdGFydEdyYXBoU2VyaWFsaXplciddKSB7XG4gICAgICAgIHdpbmRvd1snQ3ljbGVqc0RldlRvb2xfc3RhcnRHcmFwaFNlcmlhbGl6ZXInXShwcm9ncmFtLnNpbmtzKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2dyYW0ucnVuKCk7XG59XG5leHBvcnRzLnJ1biA9IHJ1bjtcbmV4cG9ydHMuZGVmYXVsdCA9IHJ1bjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIHF1aWNrdGFza18xID0gcmVxdWlyZShcInF1aWNrdGFza1wiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIi4vYWRhcHRcIik7XG52YXIgc2NoZWR1bGVNaWNyb3Rhc2sgPSBxdWlja3Rhc2tfMS5kZWZhdWx0KCk7XG5mdW5jdGlvbiBtYWtlU2lua1Byb3hpZXMoZHJpdmVycykge1xuICAgIHZhciBzaW5rUHJveGllcyA9IHt9O1xuICAgIGZvciAodmFyIG5hbWVfMSBpbiBkcml2ZXJzKSB7XG4gICAgICAgIGlmIChkcml2ZXJzLmhhc093blByb3BlcnR5KG5hbWVfMSkpIHtcbiAgICAgICAgICAgIHNpbmtQcm94aWVzW25hbWVfMV0gPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2lua1Byb3hpZXM7XG59XG5leHBvcnRzLm1ha2VTaW5rUHJveGllcyA9IG1ha2VTaW5rUHJveGllcztcbmZ1bmN0aW9uIGNhbGxEcml2ZXJzKGRyaXZlcnMsIHNpbmtQcm94aWVzKSB7XG4gICAgdmFyIHNvdXJjZXMgPSB7fTtcbiAgICBmb3IgKHZhciBuYW1lXzIgaW4gZHJpdmVycykge1xuICAgICAgICBpZiAoZHJpdmVycy5oYXNPd25Qcm9wZXJ0eShuYW1lXzIpKSB7XG4gICAgICAgICAgICBzb3VyY2VzW25hbWVfMl0gPSBkcml2ZXJzW25hbWVfMl0oc2lua1Byb3hpZXNbbmFtZV8yXSwgbmFtZV8yKTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VzW25hbWVfMl0gJiYgdHlwZW9mIHNvdXJjZXNbbmFtZV8yXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBzb3VyY2VzW25hbWVfMl0uX2lzQ3ljbGVTb3VyY2UgPSBuYW1lXzI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZXM7XG59XG5leHBvcnRzLmNhbGxEcml2ZXJzID0gY2FsbERyaXZlcnM7XG4vLyBOT1RFOiB0aGlzIHdpbGwgbXV0YXRlIGBzb3VyY2VzYC5cbmZ1bmN0aW9uIGFkYXB0U291cmNlcyhzb3VyY2VzKSB7XG4gICAgZm9yICh2YXIgbmFtZV8zIGluIHNvdXJjZXMpIHtcbiAgICAgICAgaWYgKHNvdXJjZXMuaGFzT3duUHJvcGVydHkobmFtZV8zKSAmJlxuICAgICAgICAgICAgc291cmNlc1tuYW1lXzNdICYmXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlc1tuYW1lXzNdWydzaGFtZWZ1bGx5U2VuZE5leHQnXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzNdID0gYWRhcHRfMS5hZGFwdChzb3VyY2VzW25hbWVfM10pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5hZGFwdFNvdXJjZXMgPSBhZGFwdFNvdXJjZXM7XG5mdW5jdGlvbiByZXBsaWNhdGVNYW55KHNpbmtzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhzaW5rcykuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiAhIXNpbmtQcm94aWVzW25hbWVdOyB9KTtcbiAgICB2YXIgYnVmZmVycyA9IHt9O1xuICAgIHZhciByZXBsaWNhdG9ycyA9IHt9O1xuICAgIHNpbmtOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0gPSB7IF9uOiBbXSwgX2U6IFtdIH07XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdID0ge1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKHgpIHsgcmV0dXJuIGJ1ZmZlcnNbbmFtZV0uX24ucHVzaCh4KTsgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7IHJldHVybiBidWZmZXJzW25hbWVdLl9lLnB1c2goZXJyKTsgfSxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSBzaW5rTmFtZXMubWFwKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tuYW1lXSkuc3Vic2NyaWJlKHJlcGxpY2F0b3JzW25hbWVdKTtcbiAgICB9KTtcbiAgICBzaW5rTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgbGlzdGVuZXIgPSBzaW5rUHJveGllc1tuYW1lXTtcbiAgICAgICAgdmFyIG5leHQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgc2NoZWR1bGVNaWNyb3Rhc2soZnVuY3Rpb24gKCkgeyByZXR1cm4gbGlzdGVuZXIuX24oeCk7IH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBzY2hlZHVsZU1pY3JvdGFzayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgKGNvbnNvbGUuZXJyb3IgfHwgY29uc29sZS5sb2cpKGVycik7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuX2UoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBidWZmZXJzW25hbWVdLl9uLmZvckVhY2gobmV4dCk7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0uX2UuZm9yRWFjaChlcnJvcik7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLm5leHQgPSBuZXh0O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5lcnJvciA9IGVycm9yO1xuICAgICAgICAvLyBiZWNhdXNlIHNpbmsuc3Vic2NyaWJlKHJlcGxpY2F0b3IpIGhhZCBtdXRhdGVkIHJlcGxpY2F0b3IgdG8gYWRkXG4gICAgICAgIC8vIF9uLCBfZSwgX2MsIHdlIG11c3QgYWxzbyB1cGRhdGUgdGhlc2U6XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLl9uID0gbmV4dDtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uX2UgPSBlcnJvcjtcbiAgICB9KTtcbiAgICBidWZmZXJzID0gbnVsbDsgLy8gZnJlZSB1cCBmb3IgR0NcbiAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZVJlcGxpY2F0aW9uKCkge1xuICAgICAgICBzdWJzY3JpcHRpb25zLmZvckVhY2goZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudW5zdWJzY3JpYmUoKTsgfSk7XG4gICAgfTtcbn1cbmV4cG9ydHMucmVwbGljYXRlTWFueSA9IHJlcGxpY2F0ZU1hbnk7XG5mdW5jdGlvbiBkaXNwb3NlU2lua1Byb3hpZXMoc2lua1Byb3hpZXMpIHtcbiAgICBPYmplY3Qua2V5cyhzaW5rUHJveGllcykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gc2lua1Byb3hpZXNbbmFtZV0uX2MoKTsgfSk7XG59XG5leHBvcnRzLmRpc3Bvc2VTaW5rUHJveGllcyA9IGRpc3Bvc2VTaW5rUHJveGllcztcbmZ1bmN0aW9uIGRpc3Bvc2VTb3VyY2VzKHNvdXJjZXMpIHtcbiAgICBmb3IgKHZhciBrIGluIHNvdXJjZXMpIHtcbiAgICAgICAgaWYgKHNvdXJjZXMuaGFzT3duUHJvcGVydHkoaykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNba10gJiZcbiAgICAgICAgICAgIHNvdXJjZXNba10uZGlzcG9zZSkge1xuICAgICAgICAgICAgc291cmNlc1trXS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmRpc3Bvc2VTb3VyY2VzID0gZGlzcG9zZVNvdXJjZXM7XG5mdW5jdGlvbiBpc09iamVjdEVtcHR5KG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmV4cG9ydHMuaXNPYmplY3RFbXB0eSA9IGlzT2JqZWN0RW1wdHk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbnRlcm5hbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgaXNvbGF0ZV8xID0gcmVxdWlyZShcIkBjeWNsZS9pc29sYXRlXCIpO1xudmFyIHBpY2tNZXJnZV8xID0gcmVxdWlyZShcIi4vcGlja01lcmdlXCIpO1xudmFyIHBpY2tDb21iaW5lXzEgPSByZXF1aXJlKFwiLi9waWNrQ29tYmluZVwiKTtcbi8qKlxuICogQW4gb2JqZWN0IHJlcHJlc2VudGluZyBhbGwgaW5zdGFuY2VzIGluIGEgY29sbGVjdGlvbiBvZiBjb21wb25lbnRzLiBIYXMgdGhlXG4gKiBtZXRob2RzIHBpY2tDb21iaW5lIGFuZCBwaWNrTWVyZ2UgdG8gZ2V0IHRoZSBjb21iaW5lZCBzaW5rcyBvZiBhbGwgaW5zdGFuY2VzLlxuICovXG52YXIgSW5zdGFuY2VzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEluc3RhbmNlcyhpbnN0YW5jZXMkKSB7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcyQgPSBpbnN0YW5jZXMkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBMaWtlIGBtZXJnZWAgaW4geHN0cmVhbSwgdGhpcyBvcGVyYXRvciBibGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgYnV0XG4gICAgICogcGlja3MgdGhvc2Ugc3RyZWFtcyBmcm9tIGEgY29sbGVjdGlvbiBvZiBjb21wb25lbnQgaW5zdGFuY2VzLlxuICAgICAqXG4gICAgICogVXNlIHRoZSBgc2VsZWN0b3JgIHN0cmluZyB0byBwaWNrIGEgc3RyZWFtIGZyb20gdGhlIHNpbmtzIG9iamVjdCBvZiBlYWNoXG4gICAgICogY29tcG9uZW50IGluc3RhbmNlLCB0aGVuIHBpY2tNZXJnZSB3aWxsIG1lcmdlIGFsbCB0aG9zZSBwaWNrZWQgc3RyZWFtcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIG5hbWUgb2YgYSBjaGFubmVsIGluIGEgc2lua3Mgb2JqZWN0IGJlbG9uZ2luZyB0b1xuICAgICAqIGVhY2ggY29tcG9uZW50IGluIHRoZSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IGFuIG9wZXJhdG9yIHRvIGJlIHVzZWQgd2l0aCB4c3RyZWFtJ3MgYGNvbXBvc2VgIG1ldGhvZC5cbiAgICAgKi9cbiAgICBJbnN0YW5jZXMucHJvdG90eXBlLnBpY2tNZXJnZSA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdCh0aGlzLl9pbnN0YW5jZXMkLmNvbXBvc2UocGlja01lcmdlXzEucGlja01lcmdlKHNlbGVjdG9yKSkpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogTGlrZSBgY29tYmluZWAgaW4geHN0cmVhbSwgdGhpcyBvcGVyYXRvciBjb21iaW5lcyBtdWx0aXBsZSBzdHJlYW1zIHRvZ2V0aGVyLFxuICAgICAqIGJ1dCBwaWNrcyB0aG9zZSBzdHJlYW1zIGZyb20gYSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudCBpbnN0YW5jZXMuXG4gICAgICpcbiAgICAgKiBVc2UgdGhlIGBzZWxlY3RvcmAgc3RyaW5nIHRvIHBpY2sgYSBzdHJlYW0gZnJvbSB0aGUgc2lua3Mgb2JqZWN0IG9mIGVhY2hcbiAgICAgKiBjb21wb25lbnQgaW5zdGFuY2UsIHRoZW4gcGlja0NvbWJpbmUgd2lsbCBjb21iaW5lIGFsbCB0aG9zZSBwaWNrZWQgc3RyZWFtcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIG5hbWUgb2YgYSBjaGFubmVsIGluIGEgc2lua3Mgb2JqZWN0IGJlbG9uZ2luZyB0b1xuICAgICAqIGVhY2ggY29tcG9uZW50IGluIHRoZSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IGFuIG9wZXJhdG9yIHRvIGJlIHVzZWQgd2l0aCB4c3RyZWFtJ3MgYGNvbXBvc2VgIG1ldGhvZC5cbiAgICAgKi9cbiAgICBJbnN0YW5jZXMucHJvdG90eXBlLnBpY2tDb21iaW5lID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KHRoaXMuX2luc3RhbmNlcyQuY29tcG9zZShwaWNrQ29tYmluZV8xLnBpY2tDb21iaW5lKHNlbGVjdG9yKSkpO1xuICAgIH07XG4gICAgcmV0dXJuIEluc3RhbmNlcztcbn0oKSk7XG5leHBvcnRzLkluc3RhbmNlcyA9IEluc3RhbmNlcztcbmZ1bmN0aW9uIGRlZmF1bHRJdGVtU2NvcGUoa2V5KSB7XG4gICAgcmV0dXJuIHsgJyonOiBudWxsIH07XG59XG5mdW5jdGlvbiBpbnN0YW5jZUxlbnMoaXRlbUtleSwga2V5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBhcnIubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcIlwiICsgaXRlbUtleShhcnJbaV0sIGkpID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJbaV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoYXJyLCBpdGVtKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2l0ZW1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKHMsIGkpIHsgcmV0dXJuIFwiXCIgKyBpdGVtS2V5KHMsIGkpICE9PSBrZXk7IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyci5tYXAoZnVuY3Rpb24gKHMsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiXCIgKyBpdGVtS2V5KHMsIGkpID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xufVxudmFyIGlkZW50aXR5TGVucyA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uIChvdXRlcikgeyByZXR1cm4gb3V0ZXI7IH0sXG4gICAgc2V0OiBmdW5jdGlvbiAob3V0ZXIsIGlubmVyKSB7IHJldHVybiBpbm5lcjsgfSxcbn07XG5mdW5jdGlvbiBtYWtlQ29sbGVjdGlvbihvcHRzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNvbGxlY3Rpb25Db21wb25lbnQoc291cmNlcykge1xuICAgICAgICB2YXIgbmFtZSA9IG9wdHMuY2hhbm5lbCB8fCAnc3RhdGUnO1xuICAgICAgICB2YXIgaXRlbUtleSA9IG9wdHMuaXRlbUtleTtcbiAgICAgICAgdmFyIGl0ZW1TY29wZSA9IG9wdHMuaXRlbVNjb3BlIHx8IGRlZmF1bHRJdGVtU2NvcGU7XG4gICAgICAgIHZhciBpdGVtQ29tcCA9IG9wdHMuaXRlbTtcbiAgICAgICAgdmFyIHN0YXRlJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXNbbmFtZV0uc3RyZWFtKTtcbiAgICAgICAgdmFyIGluc3RhbmNlcyQgPSBzdGF0ZSQuZm9sZChmdW5jdGlvbiAoYWNjLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgICAgIHZhciBfYSwgX2IsIF9jLCBfZDtcbiAgICAgICAgICAgIHZhciBkaWN0ID0gYWNjLmRpY3Q7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShuZXh0U3RhdGUpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRJbnN0QXJyYXkgPSBBcnJheShuZXh0U3RhdGUubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEtleXNfMSA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgICAgICAvLyBhZGRcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IG5leHRTdGF0ZS5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IFwiXCIgKyAoaXRlbUtleSA/IGl0ZW1LZXkobmV4dFN0YXRlW2ldLCBpKSA6IGkpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0S2V5c18xLmFkZChrZXkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWRpY3QuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdGF0ZVNjb3BlID0gaXRlbUtleSA/IGluc3RhbmNlTGVucyhpdGVtS2V5LCBrZXkpIDogXCJcIiArIGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3RoZXJTY29wZXMgPSBpdGVtU2NvcGUoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY29wZXMgPSB0eXBlb2Ygb3RoZXJTY29wZXMgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAoX2EgPSB7ICcqJzogb3RoZXJTY29wZXMgfSwgX2FbbmFtZV0gPSBzdGF0ZVNjb3BlLCBfYSkgOiBfX2Fzc2lnbih7fSwgb3RoZXJTY29wZXMsIChfYiA9IHt9LCBfYltuYW1lXSA9IHN0YXRlU2NvcGUsIF9iKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2lua3MgPSBpc29sYXRlXzEuZGVmYXVsdChpdGVtQ29tcCwgc2NvcGVzKShzb3VyY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3Quc2V0KGtleSwgc2lua3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXSA9IHNpbmtzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXSA9IGRpY3QuZ2V0KGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXS5fa2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyByZW1vdmVcbiAgICAgICAgICAgICAgICBkaWN0LmZvckVhY2goZnVuY3Rpb24gKF8sIGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5leHRLZXlzXzEuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3QuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBuZXh0S2V5c18xLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGljdDogZGljdCwgYXJyOiBuZXh0SW5zdEFycmF5IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWN0LmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IFwiXCIgKyAoaXRlbUtleSA/IGl0ZW1LZXkobmV4dFN0YXRlLCAwKSA6ICd0aGlzJyk7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlU2NvcGUgPSBpZGVudGl0eUxlbnM7XG4gICAgICAgICAgICAgICAgdmFyIG90aGVyU2NvcGVzID0gaXRlbVNjb3BlKGtleSk7XG4gICAgICAgICAgICAgICAgdmFyIHNjb3BlcyA9IHR5cGVvZiBvdGhlclNjb3BlcyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyAoX2MgPSB7ICcqJzogb3RoZXJTY29wZXMgfSwgX2NbbmFtZV0gPSBzdGF0ZVNjb3BlLCBfYykgOiBfX2Fzc2lnbih7fSwgb3RoZXJTY29wZXMsIChfZCA9IHt9LCBfZFtuYW1lXSA9IHN0YXRlU2NvcGUsIF9kKSk7XG4gICAgICAgICAgICAgICAgdmFyIHNpbmtzID0gaXNvbGF0ZV8xLmRlZmF1bHQoaXRlbUNvbXAsIHNjb3Blcykoc291cmNlcyk7XG4gICAgICAgICAgICAgICAgZGljdC5zZXQoa2V5LCBzaW5rcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGljdDogZGljdCwgYXJyOiBbc2lua3NdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgZGljdDogbmV3IE1hcCgpLCBhcnI6IFtdIH0pO1xuICAgICAgICByZXR1cm4gb3B0cy5jb2xsZWN0U2lua3MobmV3IEluc3RhbmNlcyhpbnN0YW5jZXMkKSk7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZUNvbGxlY3Rpb24gPSBtYWtlQ29sbGVjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUNvbGxlY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGRyb3BSZXBlYXRzXzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0c1wiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xuZnVuY3Rpb24gdXBkYXRlQXJyYXlFbnRyeShhcnJheSwgc2NvcGUsIG5ld1ZhbCkge1xuICAgIGlmIChuZXdWYWwgPT09IGFycmF5W3Njb3BlXSkge1xuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuICAgIHZhciBpbmRleCA9IHBhcnNlSW50KHNjb3BlKTtcbiAgICBpZiAodHlwZW9mIG5ld1ZhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5LmZpbHRlcihmdW5jdGlvbiAoX3ZhbCwgaSkgeyByZXR1cm4gaSAhPT0gaW5kZXg7IH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXkubWFwKGZ1bmN0aW9uICh2YWwsIGkpIHsgcmV0dXJuIChpID09PSBpbmRleCA/IG5ld1ZhbCA6IHZhbCk7IH0pO1xufVxuZnVuY3Rpb24gbWFrZUdldHRlcihzY29wZSkge1xuICAgIGlmICh0eXBlb2Ygc2NvcGUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzY29wZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGxlbnNHZXQoc3RhdGUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZVtzY29wZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2NvcGUuZ2V0O1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VTZXR0ZXIoc2NvcGUpIHtcbiAgICBpZiAodHlwZW9mIHNjb3BlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygc2NvcGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBsZW5zU2V0KHN0YXRlLCBjaGlsZFN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc3RhdGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZUFycmF5RW50cnkoc3RhdGUsIHNjb3BlLCBjaGlsZFN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2EgPSB7fSwgX2Fbc2NvcGVdID0gY2hpbGRTdGF0ZSwgX2E7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIHN0YXRlLCAoX2IgPSB7fSwgX2Jbc2NvcGVdID0gY2hpbGRTdGF0ZSwgX2IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBzY29wZS5zZXQ7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKSB7XG4gICAgcmV0dXJuIHNvdXJjZS5zZWxlY3Qoc2NvcGUpO1xufVxuZXhwb3J0cy5pc29sYXRlU291cmNlID0gaXNvbGF0ZVNvdXJjZTtcbmZ1bmN0aW9uIGlzb2xhdGVTaW5rKGlubmVyUmVkdWNlciQsIHNjb3BlKSB7XG4gICAgdmFyIGdldCA9IG1ha2VHZXR0ZXIoc2NvcGUpO1xuICAgIHZhciBzZXQgPSBtYWtlU2V0dGVyKHNjb3BlKTtcbiAgICByZXR1cm4gaW5uZXJSZWR1Y2VyJC5tYXAoZnVuY3Rpb24gKGlubmVyUmVkdWNlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gb3V0ZXJSZWR1Y2VyKG91dGVyKSB7XG4gICAgICAgICAgICB2YXIgcHJldklubmVyID0gZ2V0KG91dGVyKTtcbiAgICAgICAgICAgIHZhciBuZXh0SW5uZXIgPSBpbm5lclJlZHVjZXIocHJldklubmVyKTtcbiAgICAgICAgICAgIGlmIChwcmV2SW5uZXIgPT09IG5leHRJbm5lcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXQob3V0ZXIsIG5leHRJbm5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5leHBvcnRzLmlzb2xhdGVTaW5rID0gaXNvbGF0ZVNpbms7XG4vKipcbiAqIFJlcHJlc2VudHMgYSBwaWVjZSBvZiBhcHBsaWNhdGlvbiBzdGF0ZSBkeW5hbWljYWxseSBjaGFuZ2luZyBvdmVyIHRpbWUuXG4gKi9cbnZhciBTdGF0ZVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdGF0ZVNvdXJjZShzdHJlYW0sIG5hbWUpIHtcbiAgICAgICAgdGhpcy5pc29sYXRlU291cmNlID0gaXNvbGF0ZVNvdXJjZTtcbiAgICAgICAgdGhpcy5pc29sYXRlU2luayA9IGlzb2xhdGVTaW5rO1xuICAgICAgICB0aGlzLl9zdHJlYW0gPSBzdHJlYW1cbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHR5cGVvZiBzICE9PSAndW5kZWZpbmVkJzsgfSlcbiAgICAgICAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzXzEuZGVmYXVsdCgpKVxuICAgICAgICAgICAgLnJlbWVtYmVyKCk7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnN0cmVhbSA9IGFkYXB0XzEuYWRhcHQodGhpcy5fc3RyZWFtKTtcbiAgICAgICAgdGhpcy5fc3RyZWFtLl9pc0N5Y2xlU291cmNlID0gbmFtZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VsZWN0cyBhIHBhcnQgKG9yIHNjb3BlKSBvZiB0aGUgc3RhdGUgb2JqZWN0IGFuZCByZXR1cm5zIGEgbmV3IFN0YXRlU291cmNlXG4gICAgICogZHluYW1pY2FsbHkgcmVwcmVzZW50aW5nIHRoYXQgc2VsZWN0ZWQgcGFydCBvZiB0aGUgc3RhdGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8bGVuc30gc2NvcGUgYXMgYSBzdHJpbmcsIHRoaXMgYXJndW1lbnQgcmVwcmVzZW50cyB0aGVcbiAgICAgKiBwcm9wZXJ0eSB5b3Ugd2FudCB0byBzZWxlY3QgZnJvbSB0aGUgc3RhdGUgb2JqZWN0LiBBcyBhIG51bWJlciwgdGhpc1xuICAgICAqIHJlcHJlc2VudHMgdGhlIGFycmF5IGluZGV4IHlvdSB3YW50IHRvIHNlbGVjdCBmcm9tIHRoZSBzdGF0ZSBhcnJheS4gQXMgYVxuICAgICAqIGxlbnMgb2JqZWN0IChhbiBvYmplY3Qgd2l0aCBnZXQoKSBhbmQgc2V0KCkpLCB0aGlzIGFyZ3VtZW50IHJlcHJlc2VudHMgYW55XG4gICAgICogY3VzdG9tIHdheSBvZiBzZWxlY3Rpbmcgc29tZXRoaW5nIGZyb20gdGhlIHN0YXRlIG9iamVjdC5cbiAgICAgKi9cbiAgICBTdGF0ZVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgIHZhciBnZXQgPSBtYWtlR2V0dGVyKHNjb3BlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZVNvdXJjZSh0aGlzLl9zdHJlYW0ubWFwKGdldCksIHRoaXMuX25hbWUpO1xuICAgIH07XG4gICAgcmV0dXJuIFN0YXRlU291cmNlO1xufSgpKTtcbmV4cG9ydHMuU3RhdGVTb3VyY2UgPSBTdGF0ZVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVN0YXRlU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFN0YXRlU291cmNlXzEgPSByZXF1aXJlKFwiLi9TdGF0ZVNvdXJjZVwiKTtcbmV4cG9ydHMuU3RhdGVTb3VyY2UgPSBTdGF0ZVNvdXJjZV8xLlN0YXRlU291cmNlO1xuZXhwb3J0cy5pc29sYXRlU291cmNlID0gU3RhdGVTb3VyY2VfMS5pc29sYXRlU291cmNlO1xuZXhwb3J0cy5pc29sYXRlU2luayA9IFN0YXRlU291cmNlXzEuaXNvbGF0ZVNpbms7XG52YXIgQ29sbGVjdGlvbl8xID0gcmVxdWlyZShcIi4vQ29sbGVjdGlvblwiKTtcbmV4cG9ydHMuSW5zdGFuY2VzID0gQ29sbGVjdGlvbl8xLkluc3RhbmNlcztcbi8qKlxuICogR2l2ZW4gYSBDeWNsZS5qcyBjb21wb25lbnQgdGhhdCBleHBlY3RzIGEgc3RhdGUgKnNvdXJjZSogYW5kIHdpbGxcbiAqIG91dHB1dCBhIHJlZHVjZXIgKnNpbmsqLCB0aGlzIGZ1bmN0aW9uIHNldHMgdXAgdGhlIHN0YXRlIG1hbmFnZW1lbnRcbiAqIG1lY2hhbmljcyB0byBhY2N1bXVsYXRlIHN0YXRlIG92ZXIgdGltZSBhbmQgcHJvdmlkZSB0aGUgc3RhdGUgc291cmNlLiBJdFxuICogcmV0dXJucyBhIEN5Y2xlLmpzIGNvbXBvbmVudCB3aGljaCB3cmFwcyB0aGUgY29tcG9uZW50IGdpdmVuIGFzIGlucHV0LlxuICogRXNzZW50aWFsbHksIGl0IGhvb2tzIHVwIHRoZSByZWR1Y2VycyBzaW5rIHdpdGggdGhlIHN0YXRlIHNvdXJjZSBhcyBhIGN5Y2xlLlxuICpcbiAqIE9wdGlvbmFsbHksIHlvdSBjYW4gcGFzcyBhIGN1c3RvbSBuYW1lIGZvciB0aGUgc3RhdGUgY2hhbm5lbC4gQnkgZGVmYXVsdCxcbiAqIHRoZSBuYW1lIGlzICdzdGF0ZScgaW4gc291cmNlcyBhbmQgc2lua3MsIGJ1dCB5b3UgY2FuIGNoYW5nZSB0aGF0IHRvIGJlXG4gKiB3aGF0ZXZlciBzdHJpbmcgeW91IHdpc2guXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgYW4gb3B0aW9uYWwgc3RyaW5nIGZvciB0aGUgY3VzdG9tIG5hbWUgZ2l2ZW4gdG8gdGhlXG4gKiBzdGF0ZSBjaGFubmVsLiBCeSBkZWZhdWx0LCBpdCBpcyB0aGUgc3RyaW5nICdzdGF0ZScuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBjb21wb25lbnQgdGhhdCB3cmFwcyB0aGUgbWFpbiBmdW5jdGlvbiBnaXZlbiBhcyBpbnB1dCxcbiAqIGFkZGluZyBzdGF0ZSBhY2N1bXVsYXRpb24gbG9naWMgdG8gaXQuXG4gKiBAZnVuY3Rpb24gd2l0aFN0YXRlXG4gKi9cbnZhciB3aXRoU3RhdGVfMSA9IHJlcXVpcmUoXCIuL3dpdGhTdGF0ZVwiKTtcbmV4cG9ydHMud2l0aFN0YXRlID0gd2l0aFN0YXRlXzEud2l0aFN0YXRlO1xuLyoqXG4gKiBSZXR1cm5zIGEgQ3ljbGUuanMgY29tcG9uZW50IChhIGZ1bmN0aW9uIGZyb20gc291cmNlcyB0byBzaW5rcykgdGhhdFxuICogcmVwcmVzZW50cyBhIGNvbGxlY3Rpb24gb2YgbWFueSBpdGVtIGNvbXBvbmVudHMgb2YgdGhlIHNhbWUgdHlwZS5cbiAqXG4gKiBUYWtlcyBhbiBcIm9wdGlvbnNcIiBvYmplY3QgYXMgaW5wdXQsIHdpdGggdGhlIHJlcXVpcmVkIHByb3BlcnRpZXM6XG4gKiAtIGl0ZW1cbiAqIC0gY29sbGVjdFNpbmtzXG4gKlxuICogQW5kIHRoZSBvcHRpb25hbCBwcm9wZXJ0aWVzOlxuICogLSBpdGVtS2V5XG4gKiAtIGl0ZW1TY29wZVxuICogLSBjaGFubmVsXG4gKlxuICogVGhlIHJldHVybmVkIGNvbXBvbmVudCwgdGhlIENvbGxlY3Rpb24sIHdpbGwgdXNlIHRoZSBzdGF0ZSBzb3VyY2UgcGFzc2VkIHRvXG4gKiBpdCAodGhyb3VnaCBzb3VyY2VzKSB0byBndWlkZSB0aGUgZHluYW1pYyBncm93aW5nL3Nocmlua2luZyBvZiBpbnN0YW5jZXMgb2ZcbiAqIHRoZSBpdGVtIGNvbXBvbmVudC5cbiAqXG4gKiBUeXBpY2FsbHkgdGhlIHN0YXRlIHNvdXJjZSBzaG91bGQgZW1pdCBhcnJheXMsIHdoZXJlIGVhY2ggZW50cnkgaW4gdGhlIGFycmF5XG4gKiBpcyBhbiBvYmplY3QgaG9sZGluZyB0aGUgc3RhdGUgZm9yIGVhY2ggaXRlbSBjb21wb25lbnQuIFdoZW4gdGhlIHN0YXRlIGFycmF5XG4gKiBncm93cywgdGhlIGNvbGxlY3Rpb24gd2lsbCBhdXRvbWF0aWNhbGx5IGluc3RhbnRpYXRlIGEgbmV3IGl0ZW0gY29tcG9uZW50LlxuICogU2ltaWxhcmx5LCB3aGVuIHRoZSBzdGF0ZSBhcnJheSBnZXRzIHNtYWxsZXIsIHRoZSBjb2xsZWN0aW9uIHdpbGwgaGFuZGxlXG4gKiByZW1vdmFsIG9mIHRoZSBjb3JyZXNwb25kaW5nIGl0ZW0gaW5zdGFuY2UuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBhIGNvbmZpZ3VyYXRpb24gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZHM6XG4gKiAgIC0gYGl0ZW06IGZ1bmN0aW9uYCwgYSBDeWNsZS5qcyBjb21wb25lbnQgZm9yIGVhY2ggaXRlbSBpbiB0aGUgY29sbGVjdGlvbi5cbiAqICAgLSBgY29sbGVjdFNpbmtzOiBmdW5jdGlvbmAsIGEgZnVuY3Rpb24gdGhhdCBkZXNjcmliZXMgaG93IHRvIGNvbGxlY3QgdGhlXG4gKiAgICAgIHNpbmtzIGZyb20gYWxsIGl0ZW0gaW5zdGFuY2VzLlxuICogICAtIGBpdGVtS2V5OiBmdW5jdGlvbmAsIGEgZnVuY3Rpb24gZnJvbSBpdGVtIHN0YXRlIHRvIGl0ZW0gKHVuaXF1ZSkga2V5LlxuICogICAtIGBpdGVtU2NvcGU6IGZ1bmN0aW9uYCwgYSBmdW5jdGlvbiBmcm9tIGl0ZW0ga2V5IHRvIGlzb2xhdGlvbiBzY29wZS5cbiAqICAgLSBgY2hhbm5lbDogc3RyaW5nYCwgY2hvb3NlIHRoZSBjaGFubmVsIG5hbWUgd2hlcmUgdGhlIFN0YXRlU291cmNlIGV4aXN0cy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhIGNvbXBvbmVudCB0aGF0IGRpc3BsYXlzIG1hbnkgaW5zdGFuY2VzIG9mIHRoZSBpdGVtXG4gKiBjb21wb25lbnQuXG4gKiBAZnVuY3Rpb24gbWFrZUNvbGxlY3Rpb25cbiAqL1xudmFyIENvbGxlY3Rpb25fMiA9IHJlcXVpcmUoXCIuL0NvbGxlY3Rpb25cIik7XG5leHBvcnRzLm1ha2VDb2xsZWN0aW9uID0gQ29sbGVjdGlvbl8yLm1ha2VDb2xsZWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgUGlja0NvbWJpbmVMaXN0ZW5lciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrQ29tYmluZUxpc3RlbmVyKGtleSwgb3V0LCBwLCBpbnMpIHtcbiAgICAgICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLnAgPSBwO1xuICAgICAgICB0aGlzLnZhbCA9IHhzdHJlYW1fMS5OTztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgfVxuICAgIFBpY2tDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgICAgICB0aGlzLnZhbCA9IHQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnAudXAoKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2UoZXJyKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIHJldHVybiBQaWNrQ29tYmluZUxpc3RlbmVyO1xufSgpKTtcbnZhciBQaWNrQ29tYmluZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrQ29tYmluZShzZWwsIGlucykge1xuICAgICAgICB0aGlzLnR5cGUgPSAnY29tYmluZSc7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLnNlbCA9IHNlbDtcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmlscyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pbnN0ID0gbnVsbDtcbiAgICB9XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgaWxzLmZvckVhY2goZnVuY3Rpb24gKGlsKSB7XG4gICAgICAgICAgICBpbC5pbnMuX3JlbW92ZShpbCk7XG4gICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgIGlsLnZhbCA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICBpbHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmlscyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pbnN0ID0gbnVsbDtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS51cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyciA9IHRoaXMuaW5zdC5hcnI7XG4gICAgICAgIHZhciBuID0gYXJyLmxlbmd0aDtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICB2YXIgb3V0QXJyID0gQXJyYXkobik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc2lua3MgPSBhcnJbaV07XG4gICAgICAgICAgICB2YXIga2V5ID0gc2lua3MuX2tleTtcbiAgICAgICAgICAgIGlmICghaWxzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHZhbCA9IGlscy5nZXQoa2V5KS52YWw7XG4gICAgICAgICAgICBpZiAodmFsID09PSB4c3RyZWFtXzEuTk8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdXRBcnJbaV0gPSB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vdXQuX24ob3V0QXJyKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uIChpbnN0KSB7XG4gICAgICAgIHRoaXMuaW5zdCA9IGluc3Q7XG4gICAgICAgIHZhciBhcnJTaW5rcyA9IGluc3QuYXJyO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgdmFyIHNlbCA9IHRoaXMuc2VsO1xuICAgICAgICB2YXIgZGljdCA9IGluc3QuZGljdDtcbiAgICAgICAgdmFyIG4gPSBhcnJTaW5rcy5sZW5ndGg7XG4gICAgICAgIC8vIHJlbW92ZVxuICAgICAgICB2YXIgcmVtb3ZlZCA9IGZhbHNlO1xuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwsIGtleSkge1xuICAgICAgICAgICAgaWYgKCFkaWN0LmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWwuaW5zLl9yZW1vdmUoaWwpO1xuICAgICAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbC52YWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlscy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgICAgICByZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChuID09PSAwKSB7XG4gICAgICAgICAgICBvdXQuX24oW10pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIGFkZFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgdmFyIHNpbmtzID0gYXJyU2lua3NbaV07XG4gICAgICAgICAgICB2YXIga2V5ID0gc2lua3MuX2tleTtcbiAgICAgICAgICAgIGlmICghc2lua3Nbc2VsXSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncGlja0NvbWJpbmUgZm91bmQgYW4gdW5kZWZpbmVkIGNoaWxkIHNpbmsgc3RyZWFtJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2luayA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW3NlbF0pO1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbHMuc2V0KGtleSwgbmV3IFBpY2tDb21iaW5lTGlzdGVuZXIoa2V5LCBvdXQsIHRoaXMsIHNpbmspKTtcbiAgICAgICAgICAgICAgICBzaW5rLl9hZGQoaWxzLmdldChrZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICAgICAgdGhpcy51cCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2UoZSk7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIFBpY2tDb21iaW5lO1xufSgpKTtcbmZ1bmN0aW9uIHBpY2tDb21iaW5lKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBpY2tDb21iaW5lT3BlcmF0b3IoaW5zdCQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB4c3RyZWFtXzEuU3RyZWFtKG5ldyBQaWNrQ29tYmluZShzZWxlY3RvciwgaW5zdCQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5waWNrQ29tYmluZSA9IHBpY2tDb21iaW5lO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGlja0NvbWJpbmUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgUGlja01lcmdlTGlzdGVuZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGlja01lcmdlTGlzdGVuZXIob3V0LCBwLCBpbnMpIHtcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLnAgPSBwO1xuICAgIH1cbiAgICBQaWNrTWVyZ2VMaXN0ZW5lci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucCwgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX24odCk7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2VMaXN0ZW5lci5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fZShlcnIpO1xuICAgIH07XG4gICAgUGlja01lcmdlTGlzdGVuZXIucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIHJldHVybiBQaWNrTWVyZ2VMaXN0ZW5lcjtcbn0oKSk7XG52YXIgUGlja01lcmdlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tNZXJnZShzZWwsIGlucykge1xuICAgICAgICB0aGlzLnR5cGUgPSAncGlja01lcmdlJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5zZWwgPSBzZWw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH1cbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCwga2V5KSB7XG4gICAgICAgICAgICBpbC5pbnMuX3JlbW92ZShpbCk7XG4gICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgIGlscy5kZWxldGUoa2V5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlscy5jbGVhcigpO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uIChpbnN0KSB7XG4gICAgICAgIHRoaXMuaW5zdCA9IGluc3Q7XG4gICAgICAgIHZhciBhcnJTaW5rcyA9IGluc3QuYXJyO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgdmFyIHNlbCA9IHRoaXMuc2VsO1xuICAgICAgICB2YXIgbiA9IGFyclNpbmtzLmxlbmd0aDtcbiAgICAgICAgLy8gYWRkXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc2lua3MgPSBhcnJTaW5rc1tpXTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBzaW5rcy5fa2V5O1xuICAgICAgICAgICAgdmFyIHNpbmsgPSB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tzZWxdIHx8IHhzdHJlYW1fMS5kZWZhdWx0Lm5ldmVyKCkpO1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbHMuc2V0KGtleSwgbmV3IFBpY2tNZXJnZUxpc3RlbmVyKG91dCwgdGhpcywgc2luaykpO1xuICAgICAgICAgICAgICAgIHNpbmsuX2FkZChpbHMuZ2V0KGtleSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHJlbW92ZVxuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwsIGtleSkge1xuICAgICAgICAgICAgaWYgKCFpbnN0LmRpY3QuaGFzKGtleSkgfHwgIWluc3QuZGljdC5nZXQoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlsLm91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWxzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdS5fZShlcnIpO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1Ll9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gUGlja01lcmdlO1xufSgpKTtcbmZ1bmN0aW9uIHBpY2tNZXJnZShzZWxlY3Rvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiBwaWNrTWVyZ2VPcGVyYXRvcihpbnN0JCkge1xuICAgICAgICByZXR1cm4gbmV3IHhzdHJlYW1fMS5TdHJlYW0obmV3IFBpY2tNZXJnZShzZWxlY3RvciwgaW5zdCQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5waWNrTWVyZ2UgPSBwaWNrTWVyZ2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1waWNrTWVyZ2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgY29uY2F0XzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9jb25jYXRcIik7XG52YXIgU3RhdGVTb3VyY2VfMSA9IHJlcXVpcmUoXCIuL1N0YXRlU291cmNlXCIpO1xudmFyIHF1aWNrdGFza18xID0gcmVxdWlyZShcInF1aWNrdGFza1wiKTtcbnZhciBzY2hlZHVsZSA9IHF1aWNrdGFza18xLmRlZmF1bHQoKTtcbmZ1bmN0aW9uIHdpdGhTdGF0ZShtYWluLCBuYW1lKSB7XG4gICAgaWYgKG5hbWUgPT09IHZvaWQgMCkgeyBuYW1lID0gJ3N0YXRlJzsgfVxuICAgIHJldHVybiBmdW5jdGlvbiBtYWluV2l0aFN0YXRlKHNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHJlZHVjZXJNaW1pYyQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgdmFyIHN0YXRlJCA9IHJlZHVjZXJNaW1pYyRcbiAgICAgICAgICAgIC5mb2xkKGZ1bmN0aW9uIChzdGF0ZSwgcmVkdWNlcikgeyByZXR1cm4gcmVkdWNlcihzdGF0ZSk7IH0sIHZvaWQgMClcbiAgICAgICAgICAgIC5kcm9wKDEpO1xuICAgICAgICB2YXIgaW5uZXJTb3VyY2VzID0gc291cmNlcztcbiAgICAgICAgaW5uZXJTb3VyY2VzW25hbWVdID0gbmV3IFN0YXRlU291cmNlXzEuU3RhdGVTb3VyY2Uoc3RhdGUkLCBuYW1lKTtcbiAgICAgICAgdmFyIHNpbmtzID0gbWFpbihpbm5lclNvdXJjZXMpO1xuICAgICAgICBpZiAoc2lua3NbbmFtZV0pIHtcbiAgICAgICAgICAgIHZhciBzdHJlYW0kID0gY29uY2F0XzEuZGVmYXVsdCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tuYW1lXSksIHhzdHJlYW1fMS5kZWZhdWx0Lm5ldmVyKCkpO1xuICAgICAgICAgICAgc3RyZWFtJC5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChpKSB7IHJldHVybiBzY2hlZHVsZShmdW5jdGlvbiAoKSB7IHJldHVybiByZWR1Y2VyTWltaWMkLl9uKGkpOyB9KTsgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikgeyByZXR1cm4gc2NoZWR1bGUoZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVkdWNlck1pbWljJC5fZShlcnIpOyB9KTsgfSxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gc2NoZWR1bGUoZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVkdWNlck1pbWljJC5fYygpOyB9KTsgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaW5rcztcbiAgICB9O1xufVxuZXhwb3J0cy53aXRoU3RhdGUgPSB3aXRoU3RhdGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD13aXRoU3RhdGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBtaWNyb3Rhc2soKSB7XG4gICAgaWYgKHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB2YXIgbm9kZV8xID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgICAgICB2YXIgcXVldWVfMSA9IFtdO1xuICAgICAgICB2YXIgaV8xID0gMDtcbiAgICAgICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2hpbGUgKHF1ZXVlXzEubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcXVldWVfMS5zaGlmdCgpKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLm9ic2VydmUobm9kZV8xLCB7IGNoYXJhY3RlckRhdGE6IHRydWUgfSk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlXzEucHVzaChmbik7XG4gICAgICAgICAgICBub2RlXzEuZGF0YSA9IGlfMSA9IDEgLSBpXzE7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBzZXRJbW1lZGlhdGU7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljaztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0O1xuICAgIH1cbn1cbmV4cG9ydHMuZGVmYXVsdCA9IG1pY3JvdGFzaztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9wb255ZmlsbCA9IHJlcXVpcmUoJy4vcG9ueWZpbGwuanMnKTtcblxudmFyIF9wb255ZmlsbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wb255ZmlsbCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIHJvb3Q7IC8qIGdsb2JhbCB3aW5kb3cgKi9cblxuXG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gbW9kdWxlO1xufSBlbHNlIHtcbiAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG5cbnZhciByZXN1bHQgPSAoMCwgX3BvbnlmaWxsMlsnZGVmYXVsdCddKShyb290KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHJlc3VsdDsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzWydkZWZhdWx0J10gPSBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGw7XG5mdW5jdGlvbiBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGwocm9vdCkge1xuXHR2YXIgcmVzdWx0O1xuXHR2YXIgX1N5bWJvbCA9IHJvb3QuU3ltYm9sO1xuXG5cdGlmICh0eXBlb2YgX1N5bWJvbCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGlmIChfU3ltYm9sLm9ic2VydmFibGUpIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2wub2JzZXJ2YWJsZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0ID0gX1N5bWJvbCgnb2JzZXJ2YWJsZScpO1xuXHRcdFx0X1N5bWJvbC5vYnNlcnZhYmxlID0gcmVzdWx0O1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXN1bHQgPSAnQEBvYnNlcnZhYmxlJztcblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59OyIsInZhciBuZXh0VGljayA9IHJlcXVpcmUoJ3Byb2Nlc3MvYnJvd3Nlci5qcycpLm5leHRUaWNrO1xudmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGltbWVkaWF0ZUlkcyA9IHt9O1xudmFyIG5leHRJbW1lZGlhdGVJZCA9IDA7XG5cbi8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cbmV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFyVGltZW91dCk7XG59O1xuZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRJbnRlcnZhbCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhckludGVydmFsKTtcbn07XG5leHBvcnRzLmNsZWFyVGltZW91dCA9XG5leHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbih0aW1lb3V0KSB7IHRpbWVvdXQuY2xvc2UoKTsgfTtcblxuZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuICB0aGlzLl9pZCA9IGlkO1xuICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcbn1cblRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2NsZWFyRm4uY2FsbCh3aW5kb3csIHRoaXMuX2lkKTtcbn07XG5cbi8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuZXhwb3J0cy5lbnJvbGwgPSBmdW5jdGlvbihpdGVtLCBtc2Vjcykge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG59O1xuXG5leHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gLTE7XG59O1xuXG5leHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cbiAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG4gIGlmIChtc2VjcyA+PSAwKSB7XG4gICAgaXRlbS5faWRsZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gb25UaW1lb3V0KCkge1xuICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcbiAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG4gICAgfSwgbXNlY3MpO1xuICB9XG59O1xuXG4vLyBUaGF0J3Mgbm90IGhvdyBub2RlLmpzIGltcGxlbWVudHMgaXQgYnV0IHRoZSBleHBvc2VkIGFwaSBpcyB0aGUgc2FtZS5cbmV4cG9ydHMuc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gc2V0SW1tZWRpYXRlIDogZnVuY3Rpb24oZm4pIHtcbiAgdmFyIGlkID0gbmV4dEltbWVkaWF0ZUlkKys7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aCA8IDIgPyBmYWxzZSA6IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBpbW1lZGlhdGVJZHNbaWRdID0gdHJ1ZTtcblxuICBuZXh0VGljayhmdW5jdGlvbiBvbk5leHRUaWNrKCkge1xuICAgIGlmIChpbW1lZGlhdGVJZHNbaWRdKSB7XG4gICAgICAvLyBmbi5jYWxsKCkgaXMgZmFzdGVyIHNvIHdlIG9wdGltaXplIGZvciB0aGUgY29tbW9uIHVzZS1jYXNlXG4gICAgICAvLyBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2NhbGwtYXBwbHktc2VndVxuICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbi5jYWxsKG51bGwpO1xuICAgICAgfVxuICAgICAgLy8gUHJldmVudCBpZHMgZnJvbSBsZWFraW5nXG4gICAgICBleHBvcnRzLmNsZWFySW1tZWRpYXRlKGlkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpZDtcbn07XG5cbmV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSB0eXBlb2YgY2xlYXJJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IGNsZWFySW1tZWRpYXRlIDogZnVuY3Rpb24oaWQpIHtcbiAgZGVsZXRlIGltbWVkaWF0ZUlkc1tpZF07XG59OyIsImltcG9ydCB7U3RyZWFtLCBJbnRlcm5hbFByb2R1Y2VyLCBJbnRlcm5hbExpc3RlbmVyLCBPdXRTZW5kZXJ9IGZyb20gJy4uL2luZGV4JztcblxuY2xhc3MgQ29uY2F0UHJvZHVjZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+LCBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdjb25jYXQnO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD4gPSBudWxsIGFzIGFueTtcbiAgcHJpdmF0ZSBpOiBudW1iZXIgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBzdHJlYW1zOiBBcnJheTxTdHJlYW08VD4+KSB7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLnN0cmVhbXNbdGhpcy5pXS5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3Qgc3RyZWFtcyA9IHRoaXMuc3RyZWFtcztcbiAgICBpZiAodGhpcy5pIDwgc3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgIHN0cmVhbXNbdGhpcy5pXS5fcmVtb3ZlKHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLmkgPSAwO1xuICAgIHRoaXMub3V0ID0gbnVsbCBhcyBhbnk7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3Qgc3RyZWFtcyA9IHRoaXMuc3RyZWFtcztcbiAgICBzdHJlYW1zW3RoaXMuaV0uX3JlbW92ZSh0aGlzKTtcbiAgICBpZiAoKyt0aGlzLmkgPCBzdHJlYW1zLmxlbmd0aCkge1xuICAgICAgc3RyZWFtc1t0aGlzLmldLl9hZGQodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQdXRzIG9uZSBzdHJlYW0gYWZ0ZXIgdGhlIG90aGVyLiAqY29uY2F0KiBpcyBhIGZhY3RvcnkgdGhhdCB0YWtlcyBtdWx0aXBsZVxuICogc3RyZWFtcyBhcyBhcmd1bWVudHMsIGFuZCBzdGFydHMgdGhlIGBuKzFgLXRoIHN0cmVhbSBvbmx5IHdoZW4gdGhlIGBuYC10aFxuICogc3RyZWFtIGhhcyBjb21wbGV0ZWQuIEl0IGNvbmNhdGVuYXRlcyB0aG9zZSBzdHJlYW1zIHRvZ2V0aGVyLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tMi0tLTMtLS00LXxcbiAqIC4uLi4uLi4uLi4uLi4uLi0tYS1iLWMtLWQtfFxuICogICAgICAgICAgIGNvbmNhdFxuICogLS0xLS0yLS0tMy0tLTQtLS1hLWItYy0tZC18XG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgY29uY2F0IGZyb20gJ3hzdHJlYW0vZXh0cmEvY29uY2F0J1xuICpcbiAqIGNvbnN0IHN0cmVhbUEgPSB4cy5vZignYScsICdiJywgJ2MnKVxuICogY29uc3Qgc3RyZWFtQiA9IHhzLm9mKDEwLCAyMCwgMzApXG4gKiBjb25zdCBzdHJlYW1DID0geHMub2YoJ1gnLCAnWScsICdaJylcbiAqXG4gKiBjb25zdCBvdXRwdXRTdHJlYW0gPSBjb25jYXQoc3RyZWFtQSwgc3RyZWFtQiwgc3RyZWFtQylcbiAqXG4gKiBvdXRwdXRTdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiAoeCkgPT4gY29uc29sZS5sb2coeCksXG4gKiAgIGVycm9yOiAoZXJyKSA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29uY2F0IGNvbXBsZXRlZCcpLFxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBmYWN0b3J5IHRydWVcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIGNvbmNhdGVuYXRlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIGNvbmNhdGVuYXRlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy4gVHdvXG4gKiBvciBtb3JlIHN0cmVhbXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29uY2F0PFQ+KC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxUPj4pOiBTdHJlYW08VD4ge1xuICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgQ29uY2F0UHJvZHVjZXIoc3RyZWFtcykpO1xufVxuIiwiaW1wb3J0IHtPcGVyYXRvciwgU3RyZWFtfSBmcm9tICcuLi9pbmRleCc7XG5cbmNsYXNzIERlbGF5T3BlcmF0b3I8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2RlbGF5JztcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+ID0gbnVsbCBhcyBhbnk7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGR0OiBudW1iZXIsXG4gICAgICAgICAgICAgIHB1YmxpYyBpbnM6IFN0cmVhbTxUPikge1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBudWxsIGFzIGFueTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB1Ll9uKHQpO1xuICAgICAgY2xlYXJJbnRlcnZhbChpZCk7XG4gICAgfSwgdGhpcy5kdCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHUuX2UoZXJyKTtcbiAgICAgIGNsZWFySW50ZXJ2YWwoaWQpO1xuICAgIH0sIHRoaXMuZHQpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdS5fYygpO1xuICAgICAgY2xlYXJJbnRlcnZhbChpZCk7XG4gICAgfSwgdGhpcy5kdCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWxheXMgcGVyaW9kaWMgZXZlbnRzIGJ5IGEgZ2l2ZW4gdGltZSBwZXJpb2QuXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogMS0tLS0yLS0zLS00LS0tLTV8XG4gKiAgICAgZGVsYXkoNjApXG4gKiAtLS0xLS0tLTItLTMtLTQtLS0tNXxcbiAqIGBgYFxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBmcm9tRGlhZ3JhbSBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21EaWFncmFtJ1xuICogaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknXG4gKlxuICogY29uc3Qgc3RyZWFtID0gZnJvbURpYWdyYW0oJzEtLS0tMi0tMy0tNC0tLS01fCcpXG4gKiAgLmNvbXBvc2UoZGVsYXkoNjApKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAxICAoYWZ0ZXIgNjAgbXMpXG4gKiA+IDIgIChhZnRlciAxNjAgbXMpXG4gKiA+IDMgIChhZnRlciAyMjAgbXMpXG4gKiA+IDQgIChhZnRlciAyODAgbXMpXG4gKiA+IDUgIChhZnRlciAzODAgbXMpXG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHBlcmlvZCBUaGUgYW1vdW50IG9mIHNpbGVuY2UgcmVxdWlyZWQgaW4gbWlsbGlzZWNvbmRzLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkZWxheTxUPihwZXJpb2Q6IG51bWJlcik6IChpbnM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFQ+IHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGRlbGF5T3BlcmF0b3IoaW5zOiBTdHJlYW08VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBEZWxheU9wZXJhdG9yKHBlcmlvZCwgaW5zKSk7XG4gIH07XG59XG4iLCJpbXBvcnQge09wZXJhdG9yLCBTdHJlYW19IGZyb20gJy4uL2luZGV4JztcbmNvbnN0IGVtcHR5ID0ge307XG5cbmV4cG9ydCBjbGFzcyBEcm9wUmVwZWF0c09wZXJhdG9yPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkcm9wUmVwZWF0cyc7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPiA9IG51bGwgYXMgYW55O1xuICBwdWJsaWMgaXNFcTogKHg6IFQsIHk6IFQpID0+IGJvb2xlYW47XG4gIHByaXZhdGUgdjogVCA9IDxhbnk+IGVtcHR5O1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBpbnM6IFN0cmVhbTxUPixcbiAgICAgICAgICAgICAgZm46ICgoeDogVCwgeTogVCkgPT4gYm9vbGVhbikgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmlzRXEgPSBmbiA/IGZuIDogKHgsIHkpID0+IHggPT09IHk7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IG51bGwgYXMgYW55O1xuICAgIHRoaXMudiA9IGVtcHR5IGFzIGFueTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3QgdiA9IHRoaXMudjtcbiAgICBpZiAodiAhPT0gZW1wdHkgJiYgdGhpcy5pc0VxKHQsIHYpKSByZXR1cm47XG4gICAgdGhpcy52ID0gdDtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG4vKipcbiAqIERyb3BzIGNvbnNlY3V0aXZlIGR1cGxpY2F0ZSB2YWx1ZXMgaW4gYSBzdHJlYW0uXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0yLS0xLS0xLS0xLS0yLS0zLS00LS0zLS0zfFxuICogICAgIGRyb3BSZXBlYXRzXG4gKiAtLTEtLTItLTEtLS0tLS0tLTItLTMtLTQtLTMtLS18XG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZHJvcFJlcGVhdHMgZnJvbSAneHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0cydcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSB4cy5vZigxLCAyLCAxLCAxLCAxLCAyLCAzLCA0LCAzLCAzKVxuICogICAuY29tcG9zZShkcm9wUmVwZWF0cygpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAxXG4gKiA+IDJcbiAqID4gMVxuICogPiAyXG4gKiA+IDNcbiAqID4gNFxuICogPiAzXG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogRXhhbXBsZSB3aXRoIGEgY3VzdG9tIGlzRXF1YWwgZnVuY3Rpb246XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBkcm9wUmVwZWF0cyBmcm9tICd4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzJ1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IHhzLm9mKCdhJywgJ2InLCAnYScsICdBJywgJ0InLCAnYicpXG4gKiAgIC5jb21wb3NlKGRyb3BSZXBlYXRzKCh4LCB5KSA9PiB4LnRvTG93ZXJDYXNlKCkgPT09IHkudG9Mb3dlckNhc2UoKSkpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IGFcbiAqID4gYlxuICogPiBhXG4gKiA+IEJcbiAqID4gY29tcGxldGVkXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpc0VxdWFsIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIG9mIHR5cGVcbiAqIGAoeDogVCwgeTogVCkgPT4gYm9vbGVhbmAgdGhhdCB0YWtlcyBhbiBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gYW5kXG4gKiBjaGVja3MgaWYgaXQgaXMgZXF1YWwgdG8gcHJldmlvdXMgZXZlbnQsIGJ5IHJldHVybmluZyBhIGJvb2xlYW4uXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRyb3BSZXBlYXRzPFQ+KGlzRXF1YWw6ICgoeDogVCwgeTogVCkgPT4gYm9vbGVhbikgfCB1bmRlZmluZWQgPSB2b2lkIDApOiAoaW5zOiBTdHJlYW08VD4pID0+IFN0cmVhbTxUPiB7XG4gIHJldHVybiBmdW5jdGlvbiBkcm9wUmVwZWF0c09wZXJhdG9yKGluczogU3RyZWFtPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRHJvcFJlcGVhdHNPcGVyYXRvcjxUPihpbnMsIGlzRXF1YWwpKTtcbiAgfTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibm9kZVwiIC8+XG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7U3RyZWFtLCBJbnRlcm5hbFByb2R1Y2VyLCBJbnRlcm5hbExpc3RlbmVyfSBmcm9tICcuLi9pbmRleCc7XG5cbmV4cG9ydCBjbGFzcyBET01FdmVudFByb2R1Y2VyIGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxFdmVudD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tRXZlbnQnO1xuICBwcml2YXRlIGxpc3RlbmVyOiBFdmVudExpc3RlbmVyIHwgbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5vZGU6IEV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICBwcml2YXRlIGV2ZW50VHlwZTogc3RyaW5nLFxuICAgICAgICAgICAgICBwcml2YXRlIHVzZUNhcHR1cmU6IGJvb2xlYW4pIHtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8RXZlbnQ+KSB7XG4gICAgdGhpcy5saXN0ZW5lciA9IChlKSA9PiBvdXQuX24oZSk7XG4gICAgdGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5ldmVudFR5cGUsIHRoaXMubGlzdGVuZXIsIHRoaXMudXNlQ2FwdHVyZSk7XG4gIH1cblxuICBfc3RvcCgpIHtcbiAgICB0aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50VHlwZSwgdGhpcy5saXN0ZW5lciBhcyBhbnksIHRoaXMudXNlQ2FwdHVyZSk7XG4gICAgdGhpcy5saXN0ZW5lciA9IG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVFdmVudFByb2R1Y2VyIGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxhbnk+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbUV2ZW50JztcbiAgcHJpdmF0ZSBsaXN0ZW5lcjogRnVuY3Rpb24gfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbm9kZTogRXZlbnRFbWl0dGVyLCBwcml2YXRlIGV2ZW50TmFtZTogc3RyaW5nKSB7IH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHtcbiAgICB0aGlzLmxpc3RlbmVyID0gKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IHtcbiAgICAgIHJldHVybiAoYXJncy5sZW5ndGggPiAxKSA/IG91dC5fbihhcmdzKSA6IG91dC5fbihhcmdzWzBdKTtcbiAgICB9O1xuICAgIHRoaXMubm9kZS5hZGRMaXN0ZW5lcih0aGlzLmV2ZW50TmFtZSwgdGhpcy5saXN0ZW5lcik7XG4gIH1cblxuICBfc3RvcCgpIHtcbiAgICB0aGlzLm5vZGUucmVtb3ZlTGlzdGVuZXIodGhpcy5ldmVudE5hbWUsIHRoaXMubGlzdGVuZXIgYXMgYW55KTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0VtaXR0ZXIoZWxlbWVudDogYW55KTogZWxlbWVudCBpcyBFdmVudEVtaXR0ZXIge1xuICByZXR1cm4gZWxlbWVudC5lbWl0ICYmIGVsZW1lbnQuYWRkTGlzdGVuZXI7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHN0cmVhbSBiYXNlZCBvbiBlaXRoZXI6XG4gKiAtIERPTSBldmVudHMgd2l0aCB0aGUgbmFtZSBgZXZlbnROYW1lYCBmcm9tIGEgcHJvdmlkZWQgdGFyZ2V0IG5vZGVcbiAqIC0gRXZlbnRzIHdpdGggdGhlIG5hbWUgYGV2ZW50TmFtZWAgZnJvbSBhIHByb3ZpZGVkIE5vZGVKUyBFdmVudEVtaXR0ZXJcbiAqXG4gKiBXaGVuIGNyZWF0aW5nIGEgc3RyZWFtIGZyb20gRXZlbnRFbWl0dGVycywgaWYgdGhlIHNvdXJjZSBldmVudCBoYXMgbW9yZSB0aGFuXG4gKiBvbmUgYXJndW1lbnQgYWxsIHRoZSBhcmd1bWVudHMgd2lsbCBiZSBhZ2dyZWdhdGVkIGludG8gYW4gYXJyYXkgaW4gdGhlXG4gKiByZXN1bHQgc3RyZWFtLlxuICpcbiAqIChUaXA6IHdoZW4gdXNpbmcgdGhpcyBmYWN0b3J5IHdpdGggVHlwZVNjcmlwdCwgeW91IHdpbGwgbmVlZCB0eXBlcyBmb3JcbiAqIE5vZGUuanMgYmVjYXVzZSBmcm9tRXZlbnQga25vd3MgaG93IHRvIGhhbmRsZSBib3RoIERPTSBldmVudHMgYW5kIE5vZGUuanNcbiAqIEV2ZW50RW1pdHRlci4gSnVzdCBpbnN0YWxsIGBAdHlwZXMvbm9kZWApXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogICBmcm9tRXZlbnQoZWxlbWVudCwgZXZlbnROYW1lKVxuICogLS0tZXYtLWV2LS0tLWV2LS0tLS0tLS0tLS0tLS0tXG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21FdmVudCBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21FdmVudCdcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRXZlbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJ1dHRvbicpLCAnY2xpY2snKVxuICogICAubWFwVG8oJ0J1dHRvbiBjbGlja2VkIScpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+ICdCdXR0b24gY2xpY2tlZCEnXG4gKiA+ICdCdXR0b24gY2xpY2tlZCEnXG4gKiA+ICdCdXR0b24gY2xpY2tlZCEnXG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21FdmVudCBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21FdmVudCdcbiAqIGltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnXG4gKlxuICogY29uc3QgTXlFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRXZlbnQoTXlFbWl0dGVyLCAnZm9vJylcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqXG4gKiBNeUVtaXR0ZXIuZW1pdCgnZm9vJywgJ2JhcicpXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+ICdiYXInXG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21FdmVudCBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21FdmVudCdcbiAqIGltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnXG4gKlxuICogY29uc3QgTXlFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRXZlbnQoTXlFbWl0dGVyLCAnZm9vJylcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqXG4gKiBNeUVtaXR0ZXIuZW1pdCgnZm9vJywgJ2JhcicsICdiYXonLCAnYnV6eicpXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IFsnYmFyJywgJ2JheicsICdidXp6J11cbiAqIGBgYFxuICpcbiAqIEBmYWN0b3J5IHRydWVcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyfSBlbGVtZW50IFRoZSBlbGVtZW50IHVwb24gd2hpY2ggdG8gbGlzdGVuLlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgZm9yIHdoaWNoIHRvIGxpc3Rlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbj99IHVzZUNhcHR1cmUgQW4gb3B0aW9uYWwgYm9vbGVhbiB0aGF0IGluZGljYXRlcyB0aGF0IGV2ZW50cyBvZlxuICogdGhpcyB0eXBlIHdpbGwgYmUgZGlzcGF0Y2hlZCB0byB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lciBiZWZvcmUgYmVpbmdcbiAqIGRpc3BhdGNoZWQgdG8gYW55IEV2ZW50VGFyZ2V0IGJlbmVhdGggaXQgaW4gdGhlIERPTSB0cmVlLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuXG5mdW5jdGlvbiBmcm9tRXZlbnQ8VCA9IGFueT4oZWxlbWVudDogRXZlbnRFbWl0dGVyLCBldmVudE5hbWU6IHN0cmluZyk6IFN0cmVhbTxUPjtcbmZ1bmN0aW9uIGZyb21FdmVudDxUIGV4dGVuZHMgRXZlbnQgPSBFdmVudD4oZWxlbWVudDogRXZlbnRUYXJnZXQsIGV2ZW50TmFtZTogc3RyaW5nLCB1c2VDYXB0dXJlPzogYm9vbGVhbik6IFN0cmVhbTxUPjtcblxuZnVuY3Rpb24gZnJvbUV2ZW50PFQgPSBhbnk+KGVsZW1lbnQ6IEV2ZW50RW1pdHRlciB8IEV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZUNhcHR1cmU6IGJvb2xlYW4gPSBmYWxzZSk6IFN0cmVhbTxUPiB7XG4gIGlmIChpc0VtaXR0ZXIoZWxlbWVudCkpIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgTm9kZUV2ZW50UHJvZHVjZXIoZWxlbWVudCwgZXZlbnROYW1lKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERPTUV2ZW50UHJvZHVjZXIoZWxlbWVudCwgZXZlbnROYW1lLCB1c2VDYXB0dXJlKSBhcyBhbnkpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZyb21FdmVudDtcbiIsImltcG9ydCAkJG9ic2VydmFibGUgZnJvbSAnc3ltYm9sLW9ic2VydmFibGUnO1xuXG5jb25zdCBOTyA9IHt9O1xuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmZ1bmN0aW9uIGNwPFQ+KGE6IEFycmF5PFQ+KTogQXJyYXk8VD4ge1xuICBjb25zdCBsID0gYS5sZW5ndGg7XG4gIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyArK2kpIGJbaV0gPSBhW2ldO1xuICByZXR1cm4gYjtcbn1cblxuZnVuY3Rpb24gYW5kPFQ+KGYxOiAodDogVCkgPT4gYm9vbGVhbiwgZjI6ICh0OiBUKSA9PiBib29sZWFuKTogKHQ6IFQpID0+IGJvb2xlYW4ge1xuICByZXR1cm4gZnVuY3Rpb24gYW5kRm4odDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmMSh0KSAmJiBmMih0KTtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIEZDb250YWluZXI8VCwgUj4ge1xuICBmKHQ6IFQpOiBSO1xufVxuXG5mdW5jdGlvbiBfdHJ5PFQsIFI+KGM6IEZDb250YWluZXI8VCwgUj4sIHQ6IFQsIHU6IFN0cmVhbTxhbnk+KTogUiB8IHt9IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYy5mKHQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdS5fZShlKTtcbiAgICByZXR1cm4gTk87XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgX246ICh2OiBUKSA9PiB2b2lkO1xuICBfZTogKGVycjogYW55KSA9PiB2b2lkO1xuICBfYzogKCkgPT4gdm9pZDtcbn1cblxuY29uc3QgTk9fSUw6IEludGVybmFsTGlzdGVuZXI8YW55PiA9IHtcbiAgX246IG5vb3AsXG4gIF9lOiBub29wLFxuICBfYzogbm9vcCxcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIF9zdGFydChsaXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQ7XG4gIF9zdG9wOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE91dFNlbmRlcjxUPiB7XG4gIG91dDogU3RyZWFtPFQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wZXJhdG9yPFQsIFI+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxSPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPFI+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnM6IFN0cmVhbTxUPjtcbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBZ2dyZWdhdG9yPFQsIFU+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxVPiwgT3V0U2VuZGVyPFU+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj47XG4gIF9zdGFydChvdXQ6IFN0cmVhbTxVPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvZHVjZXI8VD4ge1xuICBzdGFydDogKGxpc3RlbmVyOiBMaXN0ZW5lcjxUPikgPT4gdm9pZDtcbiAgc3RvcDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaXN0ZW5lcjxUPiB7XG4gIG5leHQ6ICh4OiBUKSA9PiB2b2lkO1xuICBlcnJvcjogKGVycjogYW55KSA9PiB2b2lkO1xuICBjb21wbGV0ZTogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb24ge1xuICB1bnN1YnNjcmliZSgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9ic2VydmFibGU8VD4ge1xuICBzdWJzY3JpYmUobGlzdGVuZXI6IExpc3RlbmVyPFQ+KTogU3Vic2NyaXB0aW9uO1xufVxuXG4vLyBtdXRhdGVzIHRoZSBpbnB1dFxuZnVuY3Rpb24gaW50ZXJuYWxpemVQcm9kdWNlcjxUPihwcm9kdWNlcjogUHJvZHVjZXI8VD4gJiBQYXJ0aWFsPEludGVybmFsUHJvZHVjZXI8VD4+KSB7XG4gIHByb2R1Y2VyLl9zdGFydCA9IGZ1bmN0aW9uIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPiAmIFBhcnRpYWw8TGlzdGVuZXI8VD4+KSB7XG4gICAgaWwubmV4dCA9IGlsLl9uO1xuICAgIGlsLmVycm9yID0gaWwuX2U7XG4gICAgaWwuY29tcGxldGUgPSBpbC5fYztcbiAgICB0aGlzLnN0YXJ0KGlsKTtcbiAgfTtcbiAgcHJvZHVjZXIuX3N0b3AgPSBwcm9kdWNlci5zdG9wO1xufVxuXG5jbGFzcyBTdHJlYW1TdWI8VD4gaW1wbGVtZW50cyBTdWJzY3JpcHRpb24ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zdHJlYW06IFN0cmVhbTxUPiwgcHJpdmF0ZSBfbGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pIHt9XG5cbiAgdW5zdWJzY3JpYmUoKTogdm9pZCB7XG4gICAgdGhpcy5fc3RyZWFtLl9yZW1vdmUodGhpcy5fbGlzdGVuZXIpO1xuICB9XG59XG5cbmNsYXNzIE9ic2VydmVyPFQ+IGltcGxlbWVudHMgTGlzdGVuZXI8VD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9saXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPikge31cblxuICBuZXh0KHZhbHVlOiBUKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX24odmFsdWUpO1xuICB9XG5cbiAgZXJyb3IoZXJyOiBhbnkpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fZShlcnIpO1xuICB9XG5cbiAgY29tcGxldGUoKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBGcm9tT2JzZXJ2YWJsZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tT2JzZXJ2YWJsZSc7XG4gIHB1YmxpYyBpbnM6IE9ic2VydmFibGU8VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBhY3RpdmU6IGJvb2xlYW47XG4gIHByaXZhdGUgX3N1YjogU3Vic2NyaXB0aW9uIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKG9ic2VydmFibGU6IE9ic2VydmFibGU8VD4pIHtcbiAgICB0aGlzLmlucyA9IG9ic2VydmFibGU7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLl9zdWIgPSB0aGlzLmlucy5zdWJzY3JpYmUobmV3IE9ic2VydmVyKG91dCkpO1xuICAgIGlmICghdGhpcy5hY3RpdmUpIHRoaXMuX3N1Yi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgX3N0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3N1YikgdGhpcy5fc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lcmdlU2lnbmF0dXJlIHtcbiAgKCk6IFN0cmVhbTxhbnk+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogU3RyZWFtPFQxPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiBTdHJlYW08VDEgfCBUMj47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IFN0cmVhbTxUMSB8IFQyIHwgVDM+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDY+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOD47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4IHwgVDk+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5PixcbiAgICBzMTA6IFN0cmVhbTxUMTA+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDggfCBUOSB8IFQxMD47XG4gIDxUPiguLi5zdHJlYW06IEFycmF5PFN0cmVhbTxUPj4pOiBTdHJlYW08VD47XG59XG5cbmNsYXNzIE1lcmdlPFQ+IGltcGxlbWVudHMgQWdncmVnYXRvcjxULCBUPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ21lcmdlJztcbiAgcHVibGljIGluc0FycjogQXJyYXk8U3RyZWFtPFQ+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGFjOiBudW1iZXI7IC8vIGFjIGlzIGFjdGl2ZUNvdW50XG5cbiAgY29uc3RydWN0b3IoaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+KSB7XG4gICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5hYyA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgTCA9IHMubGVuZ3RoO1xuICAgIHRoaXMuYWMgPSBMO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBzW2ldLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgTCA9IHMubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBzW2ldLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBpZiAoLS10aGlzLmFjIDw9IDApIHtcbiAgICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgICAgdS5fYygpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbWJpbmVTaWduYXR1cmUge1xuICAoKTogU3RyZWFtPEFycmF5PGFueT4+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogU3RyZWFtPFtUMV0+O1xuICA8VDEsIFQyPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPik6IFN0cmVhbTxbVDEsIFQyXT47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IFN0cmVhbTxbVDEsIFQyLCBUM10+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNl0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUN10+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5PixcbiAgICBzMTA6IFN0cmVhbTxUMTA+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTBdPjtcbiAgKC4uLnN0cmVhbTogQXJyYXk8U3RyZWFtPGFueT4+KTogU3RyZWFtPEFycmF5PGFueT4+O1xufVxuXG5jbGFzcyBDb21iaW5lTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8QXJyYXk8VD4+IHtcbiAgcHJpdmF0ZSBpOiBudW1iZXI7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxUPj47XG4gIHByaXZhdGUgcDogQ29tYmluZTxUPjtcblxuICBjb25zdHJ1Y3RvcihpOiBudW1iZXIsIG91dDogU3RyZWFtPEFycmF5PFQ+PiwgcDogQ29tYmluZTxUPikge1xuICAgIHRoaXMuaSA9IGk7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5wID0gcDtcbiAgICBwLmlscy5wdXNoKHRoaXMpO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHAudXAodCwgdGhpcy5pKSkge1xuICAgICAgY29uc3QgYSA9IHAudmFscztcbiAgICAgIGNvbnN0IGwgPSBhLmxlbmd0aDtcbiAgICAgIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbDsgKytpKSBiW2ldID0gYVtpXTtcbiAgICAgIG91dC5fbihiKTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgb3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wO1xuICAgIGlmIChwLm91dCA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAoLS1wLk5jID09PSAwKSBwLm91dC5fYygpO1xuICB9XG59XG5cbmNsYXNzIENvbWJpbmU8Uj4gaW1wbGVtZW50cyBBZ2dyZWdhdG9yPGFueSwgQXJyYXk8Uj4+IHtcbiAgcHVibGljIHR5cGUgPSAnY29tYmluZSc7XG4gIHB1YmxpYyBpbnNBcnI6IEFycmF5PFN0cmVhbTxhbnk+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPEFycmF5PFI+PjtcbiAgcHVibGljIGlsczogQXJyYXk8Q29tYmluZUxpc3RlbmVyPGFueT4+O1xuICBwdWJsaWMgTmM6IG51bWJlcjsgLy8gKk4qdW1iZXIgb2Ygc3RyZWFtcyBzdGlsbCB0byBzZW5kICpjKm9tcGxldGVcbiAgcHVibGljIE5uOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqbipleHRcbiAgcHVibGljIHZhbHM6IEFycmF5PFI+O1xuXG4gIGNvbnN0cnVjdG9yKGluc0FycjogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8Uj4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy5OYyA9IHRoaXMuTm4gPSAwO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG5cbiAgdXAodDogYW55LCBpOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCB2ID0gdGhpcy52YWxzW2ldO1xuICAgIGNvbnN0IE5uID0gIXRoaXMuTm4gPyAwIDogdiA9PT0gTk8gPyAtLXRoaXMuTm4gOiB0aGlzLk5uO1xuICAgIHRoaXMudmFsc1tpXSA9IHQ7XG4gICAgcmV0dXJuIE5uID09PSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPEFycmF5PFI+Pik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBuID0gdGhpcy5OYyA9IHRoaXMuTm4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCB2YWxzID0gdGhpcy52YWxzID0gbmV3IEFycmF5KG4pO1xuICAgIGlmIChuID09PSAwKSB7XG4gICAgICBvdXQuX24oW10pO1xuICAgICAgb3V0Ll9jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHZhbHNbaV0gPSBOTztcbiAgICAgICAgc1tpXS5fYWRkKG5ldyBDb21iaW5lTGlzdGVuZXIoaSwgb3V0LCB0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IG4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCBpbHMgPSB0aGlzLmlscztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykgc1tpXS5fcmVtb3ZlKGlsc1tpXSk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8Uj4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy52YWxzID0gW107XG4gIH1cbn1cblxuY2xhc3MgRnJvbUFycmF5PFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21BcnJheSc7XG4gIHB1YmxpYyBhOiBBcnJheTxUPjtcblxuICBjb25zdHJ1Y3RvcihhOiBBcnJheTxUPikge1xuICAgIHRoaXMuYSA9IGE7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuYTtcbiAgICBmb3IgKGxldCBpID0gMCwgbiA9IGEubGVuZ3RoOyBpIDwgbjsgaSsrKSBvdXQuX24oYVtpXSk7XG4gICAgb3V0Ll9jKCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgfVxufVxuXG5jbGFzcyBGcm9tUHJvbWlzZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tUHJvbWlzZSc7XG4gIHB1YmxpYyBvbjogYm9vbGVhbjtcbiAgcHVibGljIHA6IFByb21pc2VMaWtlPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKHA6IFByb21pc2VMaWtlPFQ+KSB7XG4gICAgdGhpcy5vbiA9IGZhbHNlO1xuICAgIHRoaXMucCA9IHA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgcHJvZCA9IHRoaXM7XG4gICAgdGhpcy5vbiA9IHRydWU7XG4gICAgdGhpcy5wLnRoZW4oXG4gICAgICAodjogVCkgPT4ge1xuICAgICAgICBpZiAocHJvZC5vbikge1xuICAgICAgICAgIG91dC5fbih2KTtcbiAgICAgICAgICBvdXQuX2MoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIChlOiBhbnkpID0+IHtcbiAgICAgICAgb3V0Ll9lKGUpO1xuICAgICAgfSxcbiAgICApLnRoZW4obm9vcCwgKGVycjogYW55KSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhyb3cgZXJyOyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMub24gPSBmYWxzZTtcbiAgfVxufVxuXG5jbGFzcyBQZXJpb2RpYyBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8bnVtYmVyPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3BlcmlvZGljJztcbiAgcHVibGljIHBlcmlvZDogbnVtYmVyO1xuICBwcml2YXRlIGludGVydmFsSUQ6IGFueTtcbiAgcHJpdmF0ZSBpOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IocGVyaW9kOiBudW1iZXIpIHtcbiAgICB0aGlzLnBlcmlvZCA9IHBlcmlvZDtcbiAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICB0aGlzLmkgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxudW1iZXI+KTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gaW50ZXJ2YWxIYW5kbGVyKCkgeyBvdXQuX24oc2VsZi5pKyspOyB9XG4gICAgdGhpcy5pbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGVyLCB0aGlzLnBlcmlvZCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pbnRlcnZhbElEICE9PSAtMSkgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSUQpO1xuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IC0xO1xuICAgIHRoaXMuaSA9IDA7XG4gIH1cbn1cblxuY2xhc3MgRGVidWc8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2RlYnVnJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgczogKHQ6IFQpID0+IGFueTsgLy8gc3B5XG4gIHByaXZhdGUgbDogc3RyaW5nOyAvLyBsYWJlbFxuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiAodDogVCkgPT4gYW55KTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnMgPSBub29wO1xuICAgIHRoaXMubCA9ICcnO1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgdGhpcy5sID0gYXJnOyBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB0aGlzLnMgPSBhcmc7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgcyA9IHRoaXMucywgbCA9IHRoaXMubDtcbiAgICBpZiAocyAhPT0gbm9vcCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcyh0KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdS5fZShlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGwpIGNvbnNvbGUubG9nKGwgKyAnOicsIHQpOyBlbHNlIGNvbnNvbGUubG9nKHQpO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIERyb3A8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Ryb3AnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG1heDogbnVtYmVyO1xuICBwcml2YXRlIGRyb3BwZWQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihtYXg6IG51bWJlciwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm1heCA9IG1heDtcbiAgICB0aGlzLmRyb3BwZWQgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5kcm9wcGVkID0gMDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuZHJvcHBlZCsrID49IHRoaXMubWF4KSB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBFbmRXaGVuTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPGFueT4ge1xuICBwcml2YXRlIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wOiBFbmRXaGVuPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKG91dDogU3RyZWFtPFQ+LCBvcDogRW5kV2hlbjxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3AgPSBvcDtcbiAgfVxuXG4gIF9uKCkge1xuICAgIHRoaXMub3AuZW5kKCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIHRoaXMub3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wLmVuZCgpO1xuICB9XG59XG5cbmNsYXNzIEVuZFdoZW48VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2VuZFdoZW4nO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG86IFN0cmVhbTxhbnk+OyAvLyBvID0gb3RoZXJcbiAgcHJpdmF0ZSBvaWw6IEludGVybmFsTGlzdGVuZXI8YW55PjsgLy8gb2lsID0gb3RoZXIgSW50ZXJuYWxMaXN0ZW5lclxuXG4gIGNvbnN0cnVjdG9yKG86IFN0cmVhbTxhbnk+LCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubyA9IG87XG4gICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuby5fYWRkKHRoaXMub2lsID0gbmV3IEVuZFdoZW5MaXN0ZW5lcihvdXQsIHRoaXMpKTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm8uX3JlbW92ZSh0aGlzLm9pbCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgfVxuXG4gIGVuZCgpOiB2b2lkIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5lbmQoKTtcbiAgfVxufVxuXG5jbGFzcyBGaWx0ZXI8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZpbHRlcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmYgPSBwYXNzZXM7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PIHx8ICFyKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRmxhdHRlbkxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHByaXZhdGUgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3A6IEZsYXR0ZW48VD47XG5cbiAgY29uc3RydWN0b3Iob3V0OiBTdHJlYW08VD4sIG9wOiBGbGF0dGVuPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcCA9IG9wO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIHRoaXMub3V0Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICB0aGlzLm91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcC5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wLmxlc3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGbGF0dGVuPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8U3RyZWFtPFQ+LCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZsYXR0ZW4nO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08U3RyZWFtPFQ+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wZW46IGJvb2xlYW47XG4gIHB1YmxpYyBpbm5lcjogU3RyZWFtPFQ+OyAvLyBDdXJyZW50IGlubmVyIFN0cmVhbVxuICBwcml2YXRlIGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+OyAvLyBDdXJyZW50IGlubmVyIEludGVybmFsTGlzdGVuZXJcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxTdHJlYW08VD4+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgaWYgKHRoaXMuaW5uZXIgIT09IE5PKSB0aGlzLmlubmVyLl9yZW1vdmUodGhpcy5pbCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgfVxuXG4gIGxlc3MoKTogdm9pZCB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICghdGhpcy5vcGVuICYmIHRoaXMuaW5uZXIgPT09IE5PKSB1Ll9jKCk7XG4gIH1cblxuICBfbihzOiBTdHJlYW08VD4pIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3Qge2lubmVyLCBpbH0gPSB0aGlzO1xuICAgIGlmIChpbm5lciAhPT0gTk8gJiYgaWwgIT09IE5PX0lMKSBpbm5lci5fcmVtb3ZlKGlsKTtcbiAgICAodGhpcy5pbm5lciA9IHMpLl9hZGQodGhpcy5pbCA9IG5ldyBGbGF0dGVuTGlzdGVuZXIodSwgdGhpcykpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcGVuID0gZmFsc2U7XG4gICAgdGhpcy5sZXNzKCk7XG4gIH1cbn1cblxuY2xhc3MgRm9sZDxULCBSPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFI+IHtcbiAgcHVibGljIHR5cGUgPSAnZm9sZCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFI+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IFI7XG4gIHB1YmxpYyBzZWVkOiBSO1xuICBwcml2YXRlIGFjYzogUjsgLy8gaW5pdGlhbGl6ZWQgYXMgc2VlZFxuXG4gIGNvbnN0cnVjdG9yKGY6IChhY2M6IFIsIHQ6IFQpID0+IFIsIHNlZWQ6IFIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5mID0gKHQ6IFQpID0+IGYodGhpcy5hY2MsIHQpO1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkID0gc2VlZDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICAgIG91dC5fbih0aGlzLmFjYyk7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQ7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odGhpcy5hY2MgPSByIGFzIFIpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBMYXN0PFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdsYXN0JztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgaGFzOiBib29sZWFuO1xuICBwcml2YXRlIHZhbDogVDtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgdGhpcy52YWwgPSBOTyBhcyBUO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5oYXMgPSBmYWxzZTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnZhbCA9IE5PIGFzIFQ7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgdGhpcy5oYXMgPSB0cnVlO1xuICAgIHRoaXMudmFsID0gdDtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAodGhpcy5oYXMpIHtcbiAgICAgIHUuX24odGhpcy52YWwpO1xuICAgICAgdS5fYygpO1xuICAgIH0gZWxzZSB1Ll9lKG5ldyBFcnJvcignbGFzdCgpIGZhaWxlZCBiZWNhdXNlIGlucHV0IHN0cmVhbSBjb21wbGV0ZWQnKSk7XG4gIH1cbn1cblxuY2xhc3MgTWFwT3A8VCwgUj4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBSPiB7XG4gIHB1YmxpYyB0eXBlID0gJ21hcCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFI+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IFI7XG5cbiAgY29uc3RydWN0b3IocHJvamVjdDogKHQ6IFQpID0+IFIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5mID0gcHJvamVjdDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHIgYXMgUik7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIFJlbWVtYmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3JlbWVtYmVyJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG59XG5cbmNsYXNzIFJlcGxhY2VFcnJvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAncmVwbGFjZUVycm9yJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBmOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPjtcblxuICBjb25zdHJ1Y3RvcihyZXBsYWNlcjogKGVycjogYW55KSA9PiBTdHJlYW08VD4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5mID0gcmVwbGFjZXI7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgKHRoaXMuaW5zID0gdGhpcy5mKGVycikpLl9hZGQodGhpcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdS5fZShlKTtcbiAgICB9XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIFN0YXJ0V2l0aDxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdzdGFydFdpdGgnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIHZhbDogVDtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgdmFsOiBUKSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy52YWwgPSB2YWw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm91dC5fbih0aGlzLnZhbCk7XG4gICAgdGhpcy5pbnMuX2FkZChvdXQpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzLm91dCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cbn1cblxuY2xhc3MgVGFrZTxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAndGFrZSc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbWF4OiBudW1iZXI7XG4gIHByaXZhdGUgdGFrZW46IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihtYXg6IG51bWJlciwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm1heCA9IG1heDtcbiAgICB0aGlzLnRha2VuID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMudGFrZW4gPSAwO1xuICAgIGlmICh0aGlzLm1heCA8PSAwKSBvdXQuX2MoKTsgZWxzZSB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgbSA9ICsrdGhpcy50YWtlbjtcbiAgICBpZiAobSA8IHRoaXMubWF4KSB1Ll9uKHQpOyBlbHNlIGlmIChtID09PSB0aGlzLm1heCkge1xuICAgICAgdS5fbih0KTtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJlYW08VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHVibGljIF9wcm9kOiBJbnRlcm5hbFByb2R1Y2VyPFQ+O1xuICBwcm90ZWN0ZWQgX2lsczogQXJyYXk8SW50ZXJuYWxMaXN0ZW5lcjxUPj47IC8vICdpbHMnID0gSW50ZXJuYWwgbGlzdGVuZXJzXG4gIHByb3RlY3RlZCBfc3RvcElEOiBhbnk7XG4gIHByb3RlY3RlZCBfZGw6IEludGVybmFsTGlzdGVuZXI8VD47IC8vIHRoZSBkZWJ1ZyBsaXN0ZW5lclxuICBwcm90ZWN0ZWQgX2Q6IGJvb2xlYW47IC8vIGZsYWcgaW5kaWNhdGluZyB0aGUgZXhpc3RlbmNlIG9mIHRoZSBkZWJ1ZyBsaXN0ZW5lclxuICBwcm90ZWN0ZWQgX3RhcmdldDogU3RyZWFtPFQ+OyAvLyBpbWl0YXRpb24gdGFyZ2V0IGlmIHRoaXMgU3RyZWFtIHdpbGwgaW1pdGF0ZVxuICBwcm90ZWN0ZWQgX2VycjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHByb2R1Y2VyPzogSW50ZXJuYWxQcm9kdWNlcjxUPikge1xuICAgIHRoaXMuX3Byb2QgPSBwcm9kdWNlciB8fCBOTyBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+O1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIHRoaXMuX2RsID0gTk8gYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgdGhpcy5fdGFyZ2V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fbih0KTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9uKHQpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fbih0KTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9lcnIgIT09IE5PKSByZXR1cm47XG4gICAgdGhpcy5fZXJyID0gZXJyO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIHRoaXMuX3goKTtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX2UoZXJyKTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9lKGVycik7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9lKGVycik7XG4gICAgfVxuICAgIGlmICghdGhpcy5fZCAmJiBMID09IDApIHRocm93IHRoaXMuX2VycjtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIHRoaXMuX3goKTtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX2MoKTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9jKCk7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9jKCk7XG4gICAgfVxuICB9XG5cbiAgX3goKTogdm9pZCB7IC8vIHRlYXIgZG93biBsb2dpYywgYWZ0ZXIgZXJyb3Igb3IgY29tcGxldGVcbiAgICBpZiAodGhpcy5faWxzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTykgdGhpcy5fcHJvZC5fc3RvcCgpO1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgLy8gV0FSTklORzogY29kZSB0aGF0IGNhbGxzIHRoaXMgbWV0aG9kIHNob3VsZFxuICAgIC8vIGZpcnN0IGNoZWNrIGlmIHRoaXMuX3Byb2QgaXMgdmFsaWQgKG5vdCBgTk9gKVxuICAgIHRoaXMuX3Byb2QuX3N0b3AoKTtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHJldHVybjtcbiAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3N0b3BJRCk7XG4gICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgICBpZiAocCAhPT0gTk8pIHAuX3N0YXJ0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF9yZW1vdmUoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX3JlbW92ZShpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBpID0gYS5pbmRleE9mKGlsKTtcbiAgICBpZiAoaSA+IC0xKSB7XG4gICAgICBhLnNwbGljZShpLCAxKTtcbiAgICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTyAmJiBhLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgIHRoaXMuX2VyciA9IE5PO1xuICAgICAgICB0aGlzLl9zdG9wSUQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3N0b3BOb3coKSk7XG4gICAgICB9IGVsc2UgaWYgKGEubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHRoaXMuX3BydW5lQ3ljbGVzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgYWxsIHBhdGhzIHN0ZW1taW5nIGZyb20gYHRoaXNgIHN0cmVhbSBldmVudHVhbGx5IGVuZCBhdCBgdGhpc2BcbiAgLy8gc3RyZWFtLCB0aGVuIHdlIHJlbW92ZSB0aGUgc2luZ2xlIGxpc3RlbmVyIG9mIGB0aGlzYCBzdHJlYW0sIHRvXG4gIC8vIGZvcmNlIGl0IHRvIGVuZCBpdHMgZXhlY3V0aW9uIGFuZCBkaXNwb3NlIHJlc291cmNlcy4gVGhpcyBtZXRob2RcbiAgLy8gYXNzdW1lcyBhcyBhIHByZWNvbmRpdGlvbiB0aGF0IHRoaXMuX2lscyBoYXMganVzdCBvbmUgbGlzdGVuZXIuXG4gIF9wcnVuZUN5Y2xlcygpIHtcbiAgICBpZiAodGhpcy5faGFzTm9TaW5rcyh0aGlzLCBbXSkpIHRoaXMuX3JlbW92ZSh0aGlzLl9pbHNbMF0pO1xuICB9XG5cbiAgLy8gQ2hlY2tzIHdoZXRoZXIgKnRoZXJlIGlzIG5vKiBwYXRoIHN0YXJ0aW5nIGZyb20gYHhgIHRoYXQgbGVhZHMgdG8gYW4gZW5kXG4gIC8vIGxpc3RlbmVyIChzaW5rKSBpbiB0aGUgc3RyZWFtIGdyYXBoLCBmb2xsb3dpbmcgZWRnZXMgQS0+QiB3aGVyZSBCIGlzIGFcbiAgLy8gbGlzdGVuZXIgb2YgQS4gVGhpcyBtZWFucyB0aGVzZSBwYXRocyBjb25zdGl0dXRlIGEgY3ljbGUgc29tZWhvdy4gSXMgZ2l2ZW5cbiAgLy8gYSB0cmFjZSBvZiBhbGwgdmlzaXRlZCBub2RlcyBzbyBmYXIuXG4gIF9oYXNOb1NpbmtzKHg6IEludGVybmFsTGlzdGVuZXI8YW55PiwgdHJhY2U6IEFycmF5PGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAodHJhY2UuaW5kZXhPZih4KSAhPT0gLTEpXG4gICAgICByZXR1cm4gdHJ1ZTsgZWxzZVxuICAgIGlmICgoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCA9PT0gdGhpcylcbiAgICAgIHJldHVybiB0cnVlOyBlbHNlXG4gICAgaWYgKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ICYmICh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ICE9PSBOTylcbiAgICAgIHJldHVybiB0aGlzLl9oYXNOb1NpbmtzKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0LCB0cmFjZS5jb25jYXQoeCkpOyBlbHNlXG4gICAgaWYgKCh4IGFzIFN0cmVhbTxhbnk+KS5faWxzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgTiA9ICh4IGFzIFN0cmVhbTxhbnk+KS5faWxzLmxlbmd0aDsgaSA8IE47IGkrKylcbiAgICAgICAgaWYgKCF0aGlzLl9oYXNOb1NpbmtzKCh4IGFzIFN0cmVhbTxhbnk+KS5faWxzW2ldLCB0cmFjZS5jb25jYXQoeCkpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGN0b3IoKTogdHlwZW9mIFN0cmVhbSB7XG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBNZW1vcnlTdHJlYW0gPyBNZW1vcnlTdHJlYW0gOiBTdHJlYW07XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIExpc3RlbmVyIHRvIHRoZSBTdHJlYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXJ9IGxpc3RlbmVyXG4gICAqL1xuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiB2b2lkIHtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX24gPSBsaXN0ZW5lci5uZXh0IHx8IG5vb3A7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2MgPSBsaXN0ZW5lci5jb21wbGV0ZSB8fCBub29wO1xuICAgIHRoaXMuX2FkZChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgTGlzdGVuZXIgZnJvbSB0aGUgU3RyZWFtLCBhc3N1bWluZyB0aGUgTGlzdGVuZXIgd2FzIGFkZGVkIHRvIGl0LlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgKi9cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogdm9pZCB7XG4gICAgdGhpcy5fcmVtb3ZlKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtIHJldHVybmluZyBhIFN1YnNjcmlwdGlvbiB0byByZW1vdmUgdGhhdFxuICAgKiBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcn0gbGlzdGVuZXJcbiAgICogQHJldHVybnMge1N1YnNjcmlwdGlvbn1cbiAgICovXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiBTdWJzY3JpcHRpb24ge1xuICAgIHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiBuZXcgU3RyZWFtU3ViPFQ+KHRoaXMsIGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBpbnRlcm9wIGJldHdlZW4gbW9zdC5qcyBhbmQgUnhKUyA1XG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJlYW19XG4gICAqL1xuICBbJCRvYnNlcnZhYmxlXSgpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgU3RyZWFtIGdpdmVuIGEgUHJvZHVjZXIuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9kdWNlcn0gcHJvZHVjZXIgQW4gb3B0aW9uYWwgUHJvZHVjZXIgdGhhdCBkaWN0YXRlcyBob3cgdG9cbiAgICogc3RhcnQsIGdlbmVyYXRlIGV2ZW50cywgYW5kIHN0b3AgdGhlIFN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZTxUPihwcm9kdWNlcj86IFByb2R1Y2VyPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAocHJvZHVjZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgcHJvZHVjZXIuc3RhcnQgIT09ICdmdW5jdGlvbidcbiAgICAgIHx8IHR5cGVvZiBwcm9kdWNlci5zdG9wICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2R1Y2VyIHJlcXVpcmVzIGJvdGggc3RhcnQgYW5kIHN0b3AgZnVuY3Rpb25zJyk7XG4gICAgICBpbnRlcm5hbGl6ZVByb2R1Y2VyKHByb2R1Y2VyKTsgLy8gbXV0YXRlcyB0aGUgaW5wdXRcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTdHJlYW0ocHJvZHVjZXIgYXMgSW50ZXJuYWxQcm9kdWNlcjxUPiAmIFByb2R1Y2VyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE1lbW9yeVN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGVXaXRoTWVtb3J5PFQ+KHByb2R1Y2VyPzogUHJvZHVjZXI8VD4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIGlmIChwcm9kdWNlcikgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4ocHJvZHVjZXIgYXMgSW50ZXJuYWxQcm9kdWNlcjxUPiAmIFByb2R1Y2VyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgZG9lcyBub3RoaW5nIHdoZW4gc3RhcnRlZC4gSXQgbmV2ZXIgZW1pdHMgYW55IGV2ZW50LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAgICAgICAgICBuZXZlclxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgbmV2ZXIoKTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe19zdGFydDogbm9vcCwgX3N0b3A6IG5vb3B9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgdGhlIFwiY29tcGxldGVcIiBub3RpZmljYXRpb24gd2hlblxuICAgKiBzdGFydGVkLCBhbmQgdGhhdCdzIGl0LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBlbXB0eVxuICAgKiAtfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZW1wdHkoKTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe1xuICAgICAgX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHsgaWwuX2MoKTsgfSxcbiAgICAgIF9zdG9wOiBub29wLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyBhbiBcImVycm9yXCIgbm90aWZpY2F0aW9uIHdpdGggdGhlXG4gICAqIHZhbHVlIHlvdSBwYXNzZWQgYXMgdGhlIGBlcnJvcmAgYXJndW1lbnQgd2hlbiB0aGUgc3RyZWFtIHN0YXJ0cywgYW5kIHRoYXQnc1xuICAgKiBpdC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogdGhyb3coWClcbiAgICogLVhcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIGVycm9yIFRoZSBlcnJvciBldmVudCB0byBlbWl0IG9uIHRoZSBjcmVhdGVkIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIHRocm93KGVycm9yOiBhbnkpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7XG4gICAgICBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8YW55PikgeyBpbC5fZShlcnJvcik7IH0sXG4gICAgICBfc3RvcDogbm9vcCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RyZWFtIGZyb20gYW4gQXJyYXksIFByb21pc2UsIG9yIGFuIE9ic2VydmFibGUuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtBcnJheXxQcm9taXNlTGlrZXxPYnNlcnZhYmxlfSBpbnB1dCBUaGUgaW5wdXQgdG8gbWFrZSBhIHN0cmVhbSBmcm9tLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbTxUPihpbnB1dDogUHJvbWlzZUxpa2U8VD4gfCBTdHJlYW08VD4gfCBBcnJheTxUPiB8IE9ic2VydmFibGU8VD4pOiBTdHJlYW08VD4ge1xuICAgIGlmICh0eXBlb2YgaW5wdXRbJCRvYnNlcnZhYmxlXSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbU9ic2VydmFibGU8VD4oaW5wdXQgYXMgT2JzZXJ2YWJsZTxUPik7IGVsc2VcbiAgICBpZiAodHlwZW9mIChpbnB1dCBhcyBQcm9taXNlTGlrZTxUPikudGhlbiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbVByb21pc2U8VD4oaW5wdXQgYXMgUHJvbWlzZUxpa2U8VD4pOyBlbHNlXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXk8VD4oaW5wdXQpO1xuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVHlwZSBvZiBpbnB1dCB0byBmcm9tKCkgbXVzdCBiZSBhbiBBcnJheSwgUHJvbWlzZSwgb3IgT2JzZXJ2YWJsZWApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyB0aGUgYXJndW1lbnRzIHRoYXQgeW91IGdpdmUgdG9cbiAgICogKm9mKiwgdGhlbiBjb21wbGV0ZXMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIG9mKDEsMiwzKVxuICAgKiAxMjN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSBhIFRoZSBmaXJzdCB2YWx1ZSB5b3Ugd2FudCB0byBlbWl0IGFzIGFuIGV2ZW50IG9uIHRoZSBzdHJlYW0uXG4gICAqIEBwYXJhbSBiIFRoZSBzZWNvbmQgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLiBPbmVcbiAgICogb3IgbW9yZSBvZiB0aGVzZSB2YWx1ZXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG9mPFQ+KC4uLml0ZW1zOiBBcnJheTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXk8VD4oaXRlbXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIGFycmF5IHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCBzeW5jaHJvbm91c2x5XG4gICAqIGFsbCB0aGUgaXRlbXMgaW4gdGhlIGFycmF5LCBhbmQgdGhlbiBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZnJvbUFycmF5KFsxLDIsM10pXG4gICAqIDEyM3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21BcnJheTxUPihhcnJheTogQXJyYXk8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tQXJyYXk8VD4oYXJyYXkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIHByb21pc2UgdG8gYSBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gd2lsbCBlbWl0IHRoZSByZXNvbHZlZFxuICAgKiB2YWx1ZSBvZiB0aGUgcHJvbWlzZSwgYW5kIHRoZW4gY29tcGxldGUuIEhvd2V2ZXIsIGlmIHRoZSBwcm9taXNlIGlzXG4gICAqIHJlamVjdGVkLCB0aGUgc3RyZWFtIHdpbGwgZW1pdCB0aGUgY29ycmVzcG9uZGluZyBlcnJvci5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZnJvbVByb21pc2UoIC0tLS00MiApXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tNDJ8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvbWlzZUxpa2V9IHByb21pc2UgVGhlIHByb21pc2UgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbVByb21pc2U8VD4ocHJvbWlzZTogUHJvbWlzZUxpa2U8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tUHJvbWlzZTxUPihwcm9taXNlKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYW4gT2JzZXJ2YWJsZSBpbnRvIGEgU3RyZWFtLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7YW55fSBvYnNlcnZhYmxlIFRoZSBvYnNlcnZhYmxlIHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21PYnNlcnZhYmxlPFQ+KG9iczoge3N1YnNjcmliZTogYW55fSk6IFN0cmVhbTxUPiB7XG4gICAgaWYgKChvYnMgYXMgU3RyZWFtPFQ+KS5lbmRXaGVuKSByZXR1cm4gb2JzIGFzIFN0cmVhbTxUPjtcbiAgICBjb25zdCBvID0gdHlwZW9mIG9ic1skJG9ic2VydmFibGVdID09PSAnZnVuY3Rpb24nID8gb2JzWyQkb2JzZXJ2YWJsZV0oKSA6IG9icztcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbU9ic2VydmFibGUobykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzdHJlYW0gdGhhdCBwZXJpb2RpY2FsbHkgZW1pdHMgaW5jcmVtZW50YWwgbnVtYmVycywgZXZlcnlcbiAgICogYHBlcmlvZGAgbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAgICAgcGVyaW9kaWMoMTAwMClcbiAgICogLS0tMC0tLTEtLS0yLS0tMy0tLTQtLS0uLi5cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHBlcmlvZCBUaGUgaW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzIHRvIHVzZSBhcyBhIHJhdGUgb2ZcbiAgICogZW1pc3Npb24uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBwZXJpb2RpYyhwZXJpb2Q6IG51bWJlcik6IFN0cmVhbTxudW1iZXI+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxudW1iZXI+KG5ldyBQZXJpb2RpYyhwZXJpb2QpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCbGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgZW1pdHRpbmcgZXZlbnRzIGZyb20gYWxsIG9mIHRoZW1cbiAgICogY29uY3VycmVudGx5LlxuICAgKlxuICAgKiAqbWVyZ2UqIHRha2VzIG11bHRpcGxlIHN0cmVhbXMgYXMgYXJndW1lbnRzLCBhbmQgY3JlYXRlcyBhIHN0cmVhbSB0aGF0XG4gICAqIGJlaGF2ZXMgbGlrZSBlYWNoIG9mIHRoZSBhcmd1bWVudCBzdHJlYW1zLCBpbiBwYXJhbGxlbC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS1cbiAgICogLS0tLWEtLS0tLWItLS0tYy0tLWQtLS0tLS1cbiAgICogICAgICAgICAgICBtZXJnZVxuICAgKiAtLTEtYS0tMi0tYi0tMy1jLS0tZC0tNC0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBtZXJnZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIG1lcmdlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy4gVHdvXG4gICAqIG9yIG1vcmUgc3RyZWFtcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgbWVyZ2U6IE1lcmdlU2lnbmF0dXJlID0gZnVuY3Rpb24gbWVyZ2UoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55PihuZXcgTWVyZ2Uoc3RyZWFtcykpO1xuICB9IGFzIE1lcmdlU2lnbmF0dXJlO1xuXG4gIC8qKlxuICAgKiBDb21iaW5lcyBtdWx0aXBsZSBpbnB1dCBzdHJlYW1zIHRvZ2V0aGVyIHRvIHJldHVybiBhIHN0cmVhbSB3aG9zZSBldmVudHNcbiAgICogYXJlIGFycmF5cyB0aGF0IGNvbGxlY3QgdGhlIGxhdGVzdCBldmVudHMgZnJvbSBlYWNoIGlucHV0IHN0cmVhbS5cbiAgICpcbiAgICogKmNvbWJpbmUqIGludGVybmFsbHkgcmVtZW1iZXJzIHRoZSBtb3N0IHJlY2VudCBldmVudCBmcm9tIGVhY2ggb2YgdGhlIGlucHV0XG4gICAqIHN0cmVhbXMuIFdoZW4gYW55IG9mIHRoZSBpbnB1dCBzdHJlYW1zIGVtaXRzIGFuIGV2ZW50LCB0aGF0IGV2ZW50IHRvZ2V0aGVyXG4gICAqIHdpdGggYWxsIHRoZSBvdGhlciBzYXZlZCBldmVudHMgYXJlIGNvbWJpbmVkIGludG8gYW4gYXJyYXkuIFRoYXQgYXJyYXkgd2lsbFxuICAgKiBiZSBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBJdCdzIGVzc2VudGlhbGx5IGEgd2F5IG9mIGpvaW5pbmcgdG9nZXRoZXJcbiAgICogdGhlIGV2ZW50cyBmcm9tIG11bHRpcGxlIHN0cmVhbXMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gICAqIC0tLS1hLS0tLS1iLS0tLS1jLS1kLS0tLS0tXG4gICAqICAgICAgICAgIGNvbWJpbmVcbiAgICogLS0tLTFhLTJhLTJiLTNiLTNjLTNkLTRkLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gY29tYmluZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBNdWx0aXBsZSBzdHJlYW1zLCBub3QganVzdCB0d28sIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjb21iaW5lOiBDb21iaW5lU2lnbmF0dXJlID0gZnVuY3Rpb24gY29tYmluZSguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxBcnJheTxhbnk+PihuZXcgQ29tYmluZTxhbnk+KHN0cmVhbXMpKTtcbiAgfSBhcyBDb21iaW5lU2lnbmF0dXJlO1xuXG4gIHByb3RlY3RlZCBfbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogU3RyZWFtPFU+IHwgTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VT4obmV3IE1hcE9wPFQsIFU+KHByb2plY3QsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIHRocm91Z2ggYSBgcHJvamVjdGAgZnVuY3Rpb24sXG4gICAqIHRvIGdldCBhIFN0cmVhbSB0aGF0IGVtaXRzIHRob3NlIHRyYW5zZm9ybWVkIGV2ZW50cy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMy0tNS0tLS0tNy0tLS0tLVxuICAgKiAgICBtYXAoaSA9PiBpICogMTApXG4gICAqIC0tMTAtLTMwLTUwLS0tLTcwLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByb2plY3QgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gVWAgdGhhdCB0YWtlcyBldmVudFxuICAgKiBgdGAgb2YgdHlwZSBgVGAgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIGFuZCBwcm9kdWNlcyBhbiBldmVudCBvZiB0eXBlIGBVYCwgdG9cbiAgICogYmUgZW1pdHRlZCBvbiB0aGUgb3V0cHV0IFN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogU3RyZWFtPFU+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwKHByb2plY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0J3MgbGlrZSBgbWFwYCwgYnV0IHRyYW5zZm9ybXMgZWFjaCBpbnB1dCBldmVudCB0byBhbHdheXMgdGhlIHNhbWVcbiAgICogY29uc3RhbnQgdmFsdWUgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTMtLTUtLS0tLTctLS0tLVxuICAgKiAgICAgICBtYXBUbygxMClcbiAgICogLS0xMC0tMTAtMTAtLS0tMTAtLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gcHJvamVjdGVkVmFsdWUgQSB2YWx1ZSB0byBlbWl0IG9uIHRoZSBvdXRwdXQgU3RyZWFtIHdoZW5ldmVyIHRoZVxuICAgKiBpbnB1dCBTdHJlYW0gZW1pdHMgYW55IHZhbHVlLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBtYXBUbzxVPihwcm9qZWN0ZWRWYWx1ZTogVSk6IFN0cmVhbTxVPiB7XG4gICAgY29uc3QgcyA9IHRoaXMubWFwKCgpID0+IHByb2plY3RlZFZhbHVlKTtcbiAgICBjb25zdCBvcDogT3BlcmF0b3I8VCwgVT4gPSBzLl9wcm9kIGFzIE9wZXJhdG9yPFQsIFU+O1xuICAgIG9wLnR5cGUgPSAnbWFwVG8nO1xuICAgIHJldHVybiBzO1xuICB9XG5cbiAgZmlsdGVyPFMgZXh0ZW5kcyBUPihwYXNzZXM6ICh0OiBUKSA9PiB0IGlzIFMpOiBTdHJlYW08Uz47XG4gIGZpbHRlcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuKTogU3RyZWFtPFQ+O1xuICAvKipcbiAgICogT25seSBhbGxvd3MgZXZlbnRzIHRoYXQgcGFzcyB0aGUgdGVzdCBnaXZlbiBieSB0aGUgYHBhc3Nlc2AgYXJndW1lbnQuXG4gICAqXG4gICAqIEVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGlzIGdpdmVuIHRvIHRoZSBgcGFzc2VzYCBmdW5jdGlvbi4gSWYgdGhlXG4gICAqIGZ1bmN0aW9uIHJldHVybnMgYHRydWVgLCB0aGUgZXZlbnQgaXMgZm9yd2FyZGVkIHRvIHRoZSBvdXRwdXQgc3RyZWFtLFxuICAgKiBvdGhlcndpc2UgaXQgaXMgaWdub3JlZCBhbmQgbm90IGZvcndhcmRlZC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMi0tMy0tLS0tNC0tLS0tNS0tLTYtLTctOC0tXG4gICAqICAgICBmaWx0ZXIoaSA9PiBpICUgMiA9PT0gMClcbiAgICogLS0tLS0tMi0tLS0tLS0tNC0tLS0tLS0tLTYtLS0tOC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwYXNzZXMgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gYm9vbGVhbmAgdGhhdCB0YWtlc1xuICAgKiBhbiBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gYW5kIGNoZWNrcyBpZiBpdCBwYXNzZXMsIGJ5IHJldHVybmluZyBhXG4gICAqIGJvb2xlYW4uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGZpbHRlcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuKTogU3RyZWFtPFQ+IHtcbiAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICBpZiAocCBpbnN0YW5jZW9mIEZpbHRlcilcbiAgICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGaWx0ZXI8VD4oXG4gICAgICAgIGFuZCgocCBhcyBGaWx0ZXI8VD4pLmYsIHBhc3NlcyksXG4gICAgICAgIChwIGFzIEZpbHRlcjxUPikuaW5zXG4gICAgICApKTtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRmlsdGVyPFQ+KHBhc3NlcywgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIExldHMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSBwYXNzIHRvIHRoZVxuICAgKiBvdXRwdXQgc3RyZWFtLCB0aGVuIG1ha2VzIHRoZSBvdXRwdXQgc3RyZWFtIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICogICAgdGFrZSgzKVxuICAgKiAtLWEtLS1iLS1jfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCBIb3cgbWFueSBldmVudHMgdG8gYWxsb3cgZnJvbSB0aGUgaW5wdXQgc3RyZWFtXG4gICAqIGJlZm9yZSBjb21wbGV0aW5nIHRoZSBvdXRwdXQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICB0YWtlKGFtb3VudDogbnVtYmVyKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IFRha2U8VD4oYW1vdW50LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogSWdub3JlcyB0aGUgZmlyc3QgYGFtb3VudGAgbWFueSBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtLCBhbmQgdGhlblxuICAgKiBhZnRlciB0aGF0IHN0YXJ0cyBmb3J3YXJkaW5nIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dFxuICAgKiBzdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLS0tZC0tLWUtLVxuICAgKiAgICAgICBkcm9wKDMpXG4gICAqIC0tLS0tLS0tLS0tLS0tZC0tLWUtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCBIb3cgbWFueSBldmVudHMgdG8gaWdub3JlIGZyb20gdGhlIGlucHV0IHN0cmVhbVxuICAgKiBiZWZvcmUgZm9yd2FyZGluZyBhbGwgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSB0byB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZHJvcChhbW91bnQ6IG51bWJlcik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERyb3A8VD4oYW1vdW50LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiB0aGUgaW5wdXQgc3RyZWFtIGNvbXBsZXRlcywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBlbWl0IHRoZSBsYXN0IGV2ZW50XG4gICAqIGVtaXR0ZWQgYnkgdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW4gd2lsbCBhbHNvIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS1kLS0tLXxcbiAgICogICAgICAgbGFzdCgpXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tZHxcbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGxhc3QoKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgTGFzdDxUPih0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogUHJlcGVuZHMgdGhlIGdpdmVuIGBpbml0aWFsYCB2YWx1ZSB0byB0aGUgc2VxdWVuY2Ugb2YgZXZlbnRzIGVtaXR0ZWQgYnkgdGhlXG4gICAqIGlucHV0IHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXNcbiAgICogYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tMS0tLTItLS0tLTMtLS1cbiAgICogICBzdGFydFdpdGgoMClcbiAgICogMC0tMS0tLTItLS0tLTMtLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBpbml0aWFsIFRoZSB2YWx1ZSBvciBldmVudCB0byBwcmVwZW5kLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBzdGFydFdpdGgoaW5pdGlhbDogVCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4obmV3IFN0YXJ0V2l0aDxUPih0aGlzLCBpbml0aWFsKSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlcyBhbm90aGVyIHN0cmVhbSB0byBkZXRlcm1pbmUgd2hlbiB0byBjb21wbGV0ZSB0aGUgY3VycmVudCBzdHJlYW0uXG4gICAqXG4gICAqIFdoZW4gdGhlIGdpdmVuIGBvdGhlcmAgc3RyZWFtIGVtaXRzIGFuIGV2ZW50IG9yIGNvbXBsZXRlcywgdGhlIG91dHB1dFxuICAgKiBzdHJlYW0gd2lsbCBjb21wbGV0ZS4gQmVmb3JlIHRoYXQgaGFwcGVucywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBiZWhhdmVzXG4gICAqIGxpa2UgdGhlIGlucHV0IHN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tMS0tLTItLS0tLTMtLTQtLS0tNS0tLS02LS0tXG4gICAqICAgZW5kV2hlbiggLS0tLS0tLS1hLS1iLS18IClcbiAgICogLS0tMS0tLTItLS0tLTMtLTQtLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBvdGhlciBTb21lIG90aGVyIHN0cmVhbSB0aGF0IGlzIHVzZWQgdG8ga25vdyB3aGVuIHNob3VsZCB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbSBvZiB0aGlzIG9wZXJhdG9yIGNvbXBsZXRlLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBFbmRXaGVuPFQ+KG90aGVyLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogXCJGb2xkc1wiIHRoZSBzdHJlYW0gb250byBpdHNlbGYuXG4gICAqXG4gICAqIENvbWJpbmVzIGV2ZW50cyBmcm9tIHRoZSBwYXN0IHRocm91Z2hvdXRcbiAgICogdGhlIGVudGlyZSBleGVjdXRpb24gb2YgdGhlIGlucHV0IHN0cmVhbSwgYWxsb3dpbmcgeW91IHRvIGFjY3VtdWxhdGUgdGhlbVxuICAgKiB0b2dldGhlci4gSXQncyBlc3NlbnRpYWxseSBsaWtlIGBBcnJheS5wcm90b3R5cGUucmVkdWNlYC4gVGhlIHJldHVybmVkXG4gICAqIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXMgYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICpcbiAgICogVGhlIG91dHB1dCBzdHJlYW0gc3RhcnRzIGJ5IGVtaXR0aW5nIHRoZSBgc2VlZGAgd2hpY2ggeW91IGdpdmUgYXMgYXJndW1lbnQuXG4gICAqIFRoZW4sIHdoZW4gYW4gZXZlbnQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpdCBpcyBjb21iaW5lZCB3aXRoIHRoYXRcbiAgICogc2VlZCB2YWx1ZSB0aHJvdWdoIHRoZSBgYWNjdW11bGF0ZWAgZnVuY3Rpb24sIGFuZCB0aGUgb3V0cHV0IHZhbHVlIGlzXG4gICAqIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBzdHJlYW0uIGBmb2xkYCByZW1lbWJlcnMgdGhhdCBvdXRwdXQgdmFsdWUgYXMgYGFjY2BcbiAgICogKFwiYWNjdW11bGF0b3JcIiksIGFuZCB0aGVuIHdoZW4gYSBuZXcgaW5wdXQgZXZlbnQgYHRgIGhhcHBlbnMsIGBhY2NgIHdpbGwgYmVcbiAgICogY29tYmluZWQgd2l0aCB0aGF0IHRvIHByb2R1Y2UgdGhlIG5ldyBgYWNjYCBhbmQgc28gZm9ydGguXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLS0tLTEtLS0tLTEtLTItLS0tMS0tLS0xLS0tLS0tXG4gICAqICAgZm9sZCgoYWNjLCB4KSA9PiBhY2MgKyB4LCAzKVxuICAgKiAzLS0tLS00LS0tLS01LS03LS0tLTgtLS0tOS0tLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gYWNjdW11bGF0ZSBBIGZ1bmN0aW9uIG9mIHR5cGUgYChhY2M6IFIsIHQ6IFQpID0+IFJgIHRoYXRcbiAgICogdGFrZXMgdGhlIHByZXZpb3VzIGFjY3VtdWxhdGVkIHZhbHVlIGBhY2NgIGFuZCB0aGUgaW5jb21pbmcgZXZlbnQgZnJvbSB0aGVcbiAgICogaW5wdXQgc3RyZWFtIGFuZCBwcm9kdWNlcyB0aGUgbmV3IGFjY3VtdWxhdGVkIHZhbHVlLlxuICAgKiBAcGFyYW0gc2VlZCBUaGUgaW5pdGlhbCBhY2N1bXVsYXRlZCB2YWx1ZSwgb2YgdHlwZSBgUmAuXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIGZvbGQ8Uj4oYWNjdW11bGF0ZTogKGFjYzogUiwgdDogVCkgPT4gUiwgc2VlZDogUik6IE1lbW9yeVN0cmVhbTxSPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08Uj4obmV3IEZvbGQ8VCwgUj4oYWNjdW11bGF0ZSwgc2VlZCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcGxhY2VzIGFuIGVycm9yIHdpdGggYW5vdGhlciBzdHJlYW0uXG4gICAqXG4gICAqIFdoZW4gKGFuZCBpZikgYW4gZXJyb3IgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpbnN0ZWFkIG9mIGZvcndhcmRpbmdcbiAgICogdGhhdCBlcnJvciB0byB0aGUgb3V0cHV0IHN0cmVhbSwgKnJlcGxhY2VFcnJvciogd2lsbCBjYWxsIHRoZSBgcmVwbGFjZWBcbiAgICogZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgc3RyZWFtIHRoYXQgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCByZXBsaWNhdGUuXG4gICAqIEFuZCwgaW4gY2FzZSB0aGF0IG5ldyBzdHJlYW0gYWxzbyBlbWl0cyBhbiBlcnJvciwgYHJlcGxhY2VgIHdpbGwgYmUgY2FsbGVkXG4gICAqIGFnYWluIHRvIGdldCBhbm90aGVyIHN0cmVhbSB0byBzdGFydCByZXBsaWNhdGluZy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMi0tLS0tMy0tNC0tLS0tWFxuICAgKiAgIHJlcGxhY2VFcnJvciggKCkgPT4gLS0xMC0tfCApXG4gICAqIC0tMS0tLTItLS0tLTMtLTQtLS0tLS0tLTEwLS18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXBsYWNlIEEgZnVuY3Rpb24gb2YgdHlwZSBgKGVycikgPT4gU3RyZWFtYCB0aGF0IHRha2VzXG4gICAqIHRoZSBlcnJvciB0aGF0IG9jY3VycmVkIG9uIHRoZSBpbnB1dCBzdHJlYW0gb3Igb24gdGhlIHByZXZpb3VzIHJlcGxhY2VtZW50XG4gICAqIHN0cmVhbSBhbmQgcmV0dXJucyBhIG5ldyBzdHJlYW0uIFRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgYmVoYXZlIGxpa2UgdGhlXG4gICAqIHN0cmVhbSB0aGF0IHRoaXMgZnVuY3Rpb24gcmV0dXJucy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgcmVwbGFjZUVycm9yKHJlcGxhY2U6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IFJlcGxhY2VFcnJvcjxUPihyZXBsYWNlLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogRmxhdHRlbnMgYSBcInN0cmVhbSBvZiBzdHJlYW1zXCIsIGhhbmRsaW5nIG9ubHkgb25lIG5lc3RlZCBzdHJlYW0gYXQgYSB0aW1lXG4gICAqIChubyBjb25jdXJyZW5jeSkuXG4gICAqXG4gICAqIElmIHRoZSBpbnB1dCBzdHJlYW0gaXMgYSBzdHJlYW0gdGhhdCBlbWl0cyBzdHJlYW1zLCB0aGVuIHRoaXMgb3BlcmF0b3Igd2lsbFxuICAgKiByZXR1cm4gYW4gb3V0cHV0IHN0cmVhbSB3aGljaCBpcyBhIGZsYXQgc3RyZWFtOiBlbWl0cyByZWd1bGFyIGV2ZW50cy4gVGhlXG4gICAqIGZsYXR0ZW5pbmcgaGFwcGVucyB3aXRob3V0IGNvbmN1cnJlbmN5LiBJdCB3b3JrcyBsaWtlIHRoaXM6IHdoZW4gdGhlIGlucHV0XG4gICAqIHN0cmVhbSBlbWl0cyBhIG5lc3RlZCBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIHN0YXJ0IGltaXRhdGluZyB0aGF0IG5lc3RlZFxuICAgKiBvbmUuIEhvd2V2ZXIsIGFzIHNvb24gYXMgdGhlIG5leHQgbmVzdGVkIHN0cmVhbSBpcyBlbWl0dGVkIG9uIHRoZSBpbnB1dFxuICAgKiBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIGZvcmdldCB0aGUgcHJldmlvdXMgbmVzdGVkIG9uZSBpdCB3YXMgaW1pdGF0aW5nLCBhbmRcbiAgICogd2lsbCBzdGFydCBpbWl0YXRpbmcgdGhlIG5ldyBuZXN0ZWQgb25lLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLSstLS0tLS0tLSstLS0tLS0tLS0tLS0tLS1cbiAgICogICBcXCAgICAgICAgXFxcbiAgICogICAgXFwgICAgICAgLS0tLTEtLS0tMi0tLTMtLVxuICAgKiAgICAtLWEtLWItLS0tYy0tLS1kLS0tLS0tLS1cbiAgICogICAgICAgICAgIGZsYXR0ZW5cbiAgICogLS0tLS1hLS1iLS0tLS0tMS0tLS0yLS0tMy0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBmbGF0dGVuPFI+KHRoaXM6IFN0cmVhbTxTdHJlYW08Uj4+KTogVCB7XG4gICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08Uj4obmV3IEZsYXR0ZW4odGhpcykpIGFzIFQgJiBTdHJlYW08Uj47XG4gIH1cblxuICAvKipcbiAgICogUGFzc2VzIHRoZSBpbnB1dCBzdHJlYW0gdG8gYSBjdXN0b20gb3BlcmF0b3IsIHRvIHByb2R1Y2UgYW4gb3V0cHV0IHN0cmVhbS5cbiAgICpcbiAgICogKmNvbXBvc2UqIGlzIGEgaGFuZHkgd2F5IG9mIHVzaW5nIGFuIGV4aXN0aW5nIGZ1bmN0aW9uIGluIGEgY2hhaW5lZCBzdHlsZS5cbiAgICogSW5zdGVhZCBvZiB3cml0aW5nIGBvdXRTdHJlYW0gPSBmKGluU3RyZWFtKWAgeW91IGNhbiB3cml0ZVxuICAgKiBgb3V0U3RyZWFtID0gaW5TdHJlYW0uY29tcG9zZShmKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9wZXJhdG9yIEEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHN0cmVhbSBhcyBpbnB1dCBhbmRcbiAgICogcmV0dXJucyBhIHN0cmVhbSBhcyB3ZWxsLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBjb21wb3NlPFU+KG9wZXJhdG9yOiAoc3RyZWFtOiBTdHJlYW08VD4pID0+IFUpOiBVIHtcbiAgICByZXR1cm4gb3BlcmF0b3IodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sIGJ1dCBhbHNvXG4gICAqIHJlbWVtYmVycyB0aGUgbW9zdCByZWNlbnQgZXZlbnQgdGhhdCBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIHNvIHRoYXQgYVxuICAgKiBuZXdseSBhZGRlZCBsaXN0ZW5lciB3aWxsIGltbWVkaWF0ZWx5IHJlY2VpdmUgdGhhdCBtZW1vcmlzZWQgZXZlbnQuXG4gICAqXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHJlbWVtYmVyKCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4obmV3IFJlbWVtYmVyPFQ+KHRoaXMpKTtcbiAgfVxuXG4gIGRlYnVnKCk6IFN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogc3RyaW5nKTogU3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiAodDogVCkgPT4gYW55KTogU3RyZWFtPFQ+O1xuICAvKipcbiAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgaWRlbnRpY2FsbHkgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sXG4gICAqIGJ1dCBhbHNvIHJ1bnMgYSBgc3B5YCBmdW5jdGlvbiBmb3IgZWFjaCBldmVudCwgdG8gaGVscCB5b3UgZGVidWcgeW91ciBhcHAuXG4gICAqXG4gICAqICpkZWJ1ZyogdGFrZXMgYSBgc3B5YCBmdW5jdGlvbiBhcyBhcmd1bWVudCwgYW5kIHJ1bnMgdGhhdCBmb3IgZWFjaCBldmVudFxuICAgKiBoYXBwZW5pbmcgb24gdGhlIGlucHV0IHN0cmVhbS4gSWYgeW91IGRvbid0IHByb3ZpZGUgdGhlIGBzcHlgIGFyZ3VtZW50LFxuICAgKiB0aGVuICpkZWJ1Zyogd2lsbCBqdXN0IGBjb25zb2xlLmxvZ2AgZWFjaCBldmVudC4gVGhpcyBoZWxwcyB5b3UgdG9cbiAgICogdW5kZXJzdGFuZCB0aGUgZmxvdyBvZiBldmVudHMgdGhyb3VnaCBzb21lIG9wZXJhdG9yIGNoYWluLlxuICAgKlxuICAgKiBQbGVhc2Ugbm90ZSB0aGF0IGlmIHRoZSBvdXRwdXQgc3RyZWFtIGhhcyBubyBsaXN0ZW5lcnMsIHRoZW4gaXQgd2lsbCBub3RcbiAgICogc3RhcnQsIHdoaWNoIG1lYW5zIGBzcHlgIHdpbGwgbmV2ZXIgcnVuIGJlY2F1c2Ugbm8gYWN0dWFsIGV2ZW50IGhhcHBlbnMgaW5cbiAgICogdGhhdCBjYXNlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tNC0tXG4gICAqICAgICAgICAgZGVidWdcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLTQtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGFiZWxPclNweSBBIHN0cmluZyB0byB1c2UgYXMgdGhlIGxhYmVsIHdoZW4gcHJpbnRpbmdcbiAgICogZGVidWcgaW5mb3JtYXRpb24gb24gdGhlIGNvbnNvbGUsIG9yIGEgJ3NweScgZnVuY3Rpb24gdGhhdCB0YWtlcyBhbiBldmVudFxuICAgKiBhcyBhcmd1bWVudCwgYW5kIGRvZXMgbm90IG5lZWQgdG8gcmV0dXJuIGFueXRoaW5nLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBkZWJ1ZyhsYWJlbE9yU3B5Pzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IERlYnVnPFQ+KHRoaXMsIGxhYmVsT3JTcHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAqaW1pdGF0ZSogY2hhbmdlcyB0aGlzIGN1cnJlbnQgU3RyZWFtIHRvIGVtaXQgdGhlIHNhbWUgZXZlbnRzIHRoYXQgdGhlXG4gICAqIGBvdGhlcmAgZ2l2ZW4gU3RyZWFtIGRvZXMuIFRoaXMgbWV0aG9kIHJldHVybnMgbm90aGluZy5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgZXhpc3RzIHRvIGFsbG93IG9uZSB0aGluZzogKipjaXJjdWxhciBkZXBlbmRlbmN5IG9mIHN0cmVhbXMqKi5cbiAgICogRm9yIGluc3RhbmNlLCBsZXQncyBpbWFnaW5lIHRoYXQgZm9yIHNvbWUgcmVhc29uIHlvdSBuZWVkIHRvIGNyZWF0ZSBhXG4gICAqIGNpcmN1bGFyIGRlcGVuZGVuY3kgd2hlcmUgc3RyZWFtIGBmaXJzdCRgIGRlcGVuZHMgb24gc3RyZWFtIGBzZWNvbmQkYFxuICAgKiB3aGljaCBpbiB0dXJuIGRlcGVuZHMgb24gYGZpcnN0JGA6XG4gICAqXG4gICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgKiBgYGBqc1xuICAgKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAgICpcbiAgICogdmFyIGZpcnN0JCA9IHNlY29uZCQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBIb3dldmVyLCB0aGF0IGlzIGludmFsaWQgSmF2YVNjcmlwdCwgYmVjYXVzZSBgc2Vjb25kJGAgaXMgdW5kZWZpbmVkXG4gICAqIG9uIHRoZSBmaXJzdCBsaW5lLiBUaGlzIGlzIGhvdyAqaW1pdGF0ZSogY2FuIGhlbHAgc29sdmUgaXQ6XG4gICAqXG4gICAqIGBgYGpzXG4gICAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICAgKlxuICAgKiB2YXIgc2Vjb25kUHJveHkkID0geHMuY3JlYXRlKCk7XG4gICAqIHZhciBmaXJzdCQgPSBzZWNvbmRQcm94eSQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAqIHNlY29uZFByb3h5JC5pbWl0YXRlKHNlY29uZCQpO1xuICAgKiBgYGBcbiAgICpcbiAgICogV2UgY3JlYXRlIGBzZWNvbmRQcm94eSRgIGJlZm9yZSB0aGUgb3RoZXJzLCBzbyBpdCBjYW4gYmUgdXNlZCBpbiB0aGVcbiAgICogZGVjbGFyYXRpb24gb2YgYGZpcnN0JGAuIFRoZW4sIGFmdGVyIGJvdGggYGZpcnN0JGAgYW5kIGBzZWNvbmQkYCBhcmVcbiAgICogZGVmaW5lZCwgd2UgaG9vayBgc2Vjb25kUHJveHkkYCB3aXRoIGBzZWNvbmQkYCB3aXRoIGBpbWl0YXRlKClgIHRvIHRlbGxcbiAgICogdGhhdCB0aGV5IGFyZSBcInRoZSBzYW1lXCIuIGBpbWl0YXRlYCB3aWxsIG5vdCB0cmlnZ2VyIHRoZSBzdGFydCBvZiBhbnlcbiAgICogc3RyZWFtLCBpdCBqdXN0IGJpbmRzIGBzZWNvbmRQcm94eSRgIGFuZCBgc2Vjb25kJGAgdG9nZXRoZXIuXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgaXMgYW4gZXhhbXBsZSB3aGVyZSBgaW1pdGF0ZSgpYCBpcyBpbXBvcnRhbnQgaW4gQ3ljbGUuanNcbiAgICogYXBwbGljYXRpb25zLiBBIHBhcmVudCBjb21wb25lbnQgY29udGFpbnMgc29tZSBjaGlsZCBjb21wb25lbnRzLiBBIGNoaWxkXG4gICAqIGhhcyBhbiBhY3Rpb24gc3RyZWFtIHdoaWNoIGlzIGdpdmVuIHRvIHRoZSBwYXJlbnQgdG8gZGVmaW5lIGl0cyBzdGF0ZTpcbiAgICpcbiAgICogPCEtLSBza2lwLWV4YW1wbGUgLS0+XG4gICAqIGBgYGpzXG4gICAqIGNvbnN0IGNoaWxkQWN0aW9uUHJveHkkID0geHMuY3JlYXRlKCk7XG4gICAqIGNvbnN0IHBhcmVudCA9IFBhcmVudCh7Li4uc291cmNlcywgY2hpbGRBY3Rpb24kOiBjaGlsZEFjdGlvblByb3h5JH0pO1xuICAgKiBjb25zdCBjaGlsZEFjdGlvbiQgPSBwYXJlbnQuc3RhdGUkLm1hcChzID0+IHMuY2hpbGQuYWN0aW9uJCkuZmxhdHRlbigpO1xuICAgKiBjaGlsZEFjdGlvblByb3h5JC5pbWl0YXRlKGNoaWxkQWN0aW9uJCk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBOb3RlLCB0aG91Z2gsIHRoYXQgKipgaW1pdGF0ZSgpYCBkb2VzIG5vdCBzdXBwb3J0IE1lbW9yeVN0cmVhbXMqKi4gSWYgd2VcbiAgICogd291bGQgYXR0ZW1wdCB0byBpbWl0YXRlIGEgTWVtb3J5U3RyZWFtIGluIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSwgd2Ugd291bGRcbiAgICogZWl0aGVyIGdldCBhIHJhY2UgY29uZGl0aW9uICh3aGVyZSB0aGUgc3ltcHRvbSB3b3VsZCBiZSBcIm5vdGhpbmcgaGFwcGVuc1wiKVxuICAgKiBvciBhbiBpbmZpbml0ZSBjeWNsaWMgZW1pc3Npb24gb2YgdmFsdWVzLiBJdCdzIHVzZWZ1bCB0byB0aGluayBhYm91dFxuICAgKiBNZW1vcnlTdHJlYW1zIGFzIGNlbGxzIGluIGEgc3ByZWFkc2hlZXQuIEl0IGRvZXNuJ3QgbWFrZSBhbnkgc2Vuc2UgdG9cbiAgICogZGVmaW5lIGEgc3ByZWFkc2hlZXQgY2VsbCBgQTFgIHdpdGggYSBmb3JtdWxhIHRoYXQgZGVwZW5kcyBvbiBgQjFgIGFuZFxuICAgKiBjZWxsIGBCMWAgZGVmaW5lZCB3aXRoIGEgZm9ybXVsYSB0aGF0IGRlcGVuZHMgb24gYEExYC5cbiAgICpcbiAgICogSWYgeW91IGZpbmQgeW91cnNlbGYgd2FudGluZyB0byB1c2UgYGltaXRhdGUoKWAgd2l0aCBhXG4gICAqIE1lbW9yeVN0cmVhbSwgeW91IHNob3VsZCByZXdvcmsgeW91ciBjb2RlIGFyb3VuZCBgaW1pdGF0ZSgpYCB0byB1c2UgYVxuICAgKiBTdHJlYW0gaW5zdGVhZC4gTG9vayBmb3IgdGhlIHN0cmVhbSBpbiB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeSB0aGF0XG4gICAqIHJlcHJlc2VudHMgYW4gZXZlbnQgc3RyZWFtLCBhbmQgdGhhdCB3b3VsZCBiZSBhIGNhbmRpZGF0ZSBmb3IgY3JlYXRpbmcgYVxuICAgKiBwcm94eSBTdHJlYW0gd2hpY2ggdGhlbiBpbWl0YXRlcyB0aGUgdGFyZ2V0IFN0cmVhbS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJlYW19IHRhcmdldCBUaGUgb3RoZXIgc3RyZWFtIHRvIGltaXRhdGUgb24gdGhlIGN1cnJlbnQgb25lLiBNdXN0XG4gICAqIG5vdCBiZSBhIE1lbW9yeVN0cmVhbS5cbiAgICovXG4gIGltaXRhdGUodGFyZ2V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIE1lbW9yeVN0cmVhbSB3YXMgZ2l2ZW4gdG8gaW1pdGF0ZSgpLCBidXQgaXQgb25seSAnICtcbiAgICAgICdzdXBwb3J0cyBhIFN0cmVhbS4gUmVhZCBtb3JlIGFib3V0IHRoaXMgcmVzdHJpY3Rpb24gaGVyZTogJyArXG4gICAgICAnaHR0cHM6Ly9naXRodWIuY29tL3N0YWx0ei94c3RyZWFtI2ZhcScpO1xuICAgIHRoaXMuX3RhcmdldCA9IHRhcmdldDtcbiAgICBmb3IgKGxldCBpbHMgPSB0aGlzLl9pbHMsIE4gPSBpbHMubGVuZ3RoLCBpID0gMDsgaSA8IE47IGkrKykgdGFyZ2V0Ll9hZGQoaWxzW2ldKTtcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiB2YWx1ZSB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIFRoZSBcIm5leHRcIiB2YWx1ZSB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIGxpc3RlbmVycyBvZlxuICAgKiB0aGlzIFN0cmVhbS5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kTmV4dCh2YWx1ZTogVCkge1xuICAgIHRoaXMuX24odmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIGdpdmVuIGVycm9yIHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gZXJyb3IgVGhlIGVycm9yIHlvdSB3YW50IHRvIGJyb2FkY2FzdCB0byBhbGwgdGhlIGxpc3RlbmVycyBvZlxuICAgKiB0aGlzIFN0cmVhbS5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kRXJyb3IoZXJyb3I6IGFueSkge1xuICAgIHRoaXMuX2UoZXJyb3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIFwiY29tcGxldGVkXCIgZXZlbnQgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZENvbXBsZXRlKCkge1xuICAgIHRoaXMuX2MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgXCJkZWJ1Z1wiIGxpc3RlbmVyIHRvIHRoZSBzdHJlYW0uIFRoZXJlIGNhbiBvbmx5IGJlIG9uZSBkZWJ1Z1xuICAgKiBsaXN0ZW5lciwgdGhhdCdzIHdoeSB0aGlzIGlzICdzZXREZWJ1Z0xpc3RlbmVyJy4gVG8gcmVtb3ZlIHRoZSBkZWJ1Z1xuICAgKiBsaXN0ZW5lciwganVzdCBjYWxsIHNldERlYnVnTGlzdGVuZXIobnVsbCkuXG4gICAqXG4gICAqIEEgZGVidWcgbGlzdGVuZXIgaXMgbGlrZSBhbnkgb3RoZXIgbGlzdGVuZXIuIFRoZSBvbmx5IGRpZmZlcmVuY2UgaXMgdGhhdCBhXG4gICAqIGRlYnVnIGxpc3RlbmVyIGlzIFwic3RlYWx0aHlcIjogaXRzIHByZXNlbmNlL2Fic2VuY2UgZG9lcyBub3QgdHJpZ2dlciB0aGVcbiAgICogc3RhcnQvc3RvcCBvZiB0aGUgc3RyZWFtIChvciB0aGUgcHJvZHVjZXIgaW5zaWRlIHRoZSBzdHJlYW0pLiBUaGlzIGlzXG4gICAqIHVzZWZ1bCBzbyB5b3UgY2FuIGluc3BlY3Qgd2hhdCBpcyBnb2luZyBvbiB3aXRob3V0IGNoYW5naW5nIHRoZSBiZWhhdmlvclxuICAgKiBvZiB0aGUgcHJvZ3JhbS4gSWYgeW91IGhhdmUgYW4gaWRsZSBzdHJlYW0gYW5kIHlvdSBhZGQgYSBub3JtYWwgbGlzdGVuZXIgdG9cbiAgICogaXQsIHRoZSBzdHJlYW0gd2lsbCBzdGFydCBleGVjdXRpbmcuIEJ1dCBpZiB5b3Ugc2V0IGEgZGVidWcgbGlzdGVuZXIgb24gYW5cbiAgICogaWRsZSBzdHJlYW0sIGl0IHdvbid0IHN0YXJ0IGV4ZWN1dGluZyAobm90IHVudGlsIHRoZSBmaXJzdCBub3JtYWwgbGlzdGVuZXJcbiAgICogaXMgYWRkZWQpLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIHdlIGRvbid0IHJlY29tbWVuZCB1c2luZyB0aGlzIG1ldGhvZCB0byBidWlsZCBhcHBcbiAgICogbG9naWMuIEluIGZhY3QsIGluIG1vc3QgY2FzZXMgdGhlIGRlYnVnIG9wZXJhdG9yIHdvcmtzIGp1c3QgZmluZS4gT25seSB1c2VcbiAgICogdGhpcyBvbmUgaWYgeW91IGtub3cgd2hhdCB5b3UncmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXI8VD59IGxpc3RlbmVyXG4gICAqL1xuICBzZXREZWJ1Z0xpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+PiB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgICB0aGlzLl9kbCA9IE5PIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2QgPSB0cnVlO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9uID0gbGlzdGVuZXIubmV4dCB8fCBub29wO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fYyA9IGxpc3RlbmVyLmNvbXBsZXRlIHx8IG5vb3A7XG4gICAgICB0aGlzLl9kbCA9IGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdHJlYW08VD4gZXh0ZW5kcyBTdHJlYW08VD4ge1xuICBwcml2YXRlIF92OiBUO1xuICBwcml2YXRlIF9oYXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29uc3RydWN0b3IocHJvZHVjZXI6IEludGVybmFsUHJvZHVjZXI8VD4pIHtcbiAgICBzdXBlcihwcm9kdWNlcik7XG4gIH1cblxuICBfbih4OiBUKSB7XG4gICAgdGhpcy5fdiA9IHg7XG4gICAgdGhpcy5faGFzID0gdHJ1ZTtcbiAgICBzdXBlci5fbih4KTtcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHtcbiAgICAgIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fc3RvcElEKTtcbiAgICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIH0gZWxzZSBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTsgZWxzZSB7XG4gICAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICAgIGlmIChwICE9PSBOTykgcC5fc3RhcnQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgdGhpcy5faGFzID0gZmFsc2U7XG4gICAgc3VwZXIuX3N0b3BOb3coKTtcbiAgfVxuXG4gIF94KCk6IHZvaWQge1xuICAgIHRoaXMuX2hhcyA9IGZhbHNlO1xuICAgIHN1cGVyLl94KCk7XG4gIH1cblxuICBtYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiB0aGlzLl9tYXAocHJvamVjdCkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgbWFwVG88VT4ocHJvamVjdGVkVmFsdWU6IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiBzdXBlci5tYXBUbyhwcm9qZWN0ZWRWYWx1ZSkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgdGFrZShhbW91bnQ6IG51bWJlcik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnRha2UoYW1vdW50KSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLmVuZFdoZW4ob3RoZXIpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIHJlcGxhY2VFcnJvcihyZXBsYWNlOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnJlcGxhY2VFcnJvcihyZXBsYWNlKSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICByZW1lbWJlcigpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGVidWcoKTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiBzdHJpbmcpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6ICh0OiBUKSA9PiBhbnkpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5kZWJ1ZyhsYWJlbE9yU3B5IGFzIGFueSkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG59XG5cbmV4cG9ydCB7Tk8sIE5PX0lMfTtcbmNvbnN0IHhzID0gU3RyZWFtO1xudHlwZSB4czxUPiA9IFN0cmVhbTxUPjtcbmV4cG9ydCBkZWZhdWx0IHhzO1xuIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuaW1wb3J0IGRyb3BSZXBlYXRzIGZyb20gJ3hzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHMnO1xuaW1wb3J0IGlzb2xhdGUgZnJvbSAnQGN5Y2xlL2lzb2xhdGUnO1xuaW1wb3J0IHtcbiAgU3RhdHVzLCBpbml0R29hbCwgaXNFcXVhbEdvYWwsIGlzRXF1YWxSZXN1bHRcbn0gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uJztcbmltcG9ydCBRdWVzdGlvbkFuc3dlckFjdGlvbiBmcm9tICcuL1F1ZXN0aW9uQW5zd2VyQWN0aW9uJztcblxuY29uc3QgU3RhdGUgPSB7XG4gIFBFTkQ6ICdQRU5EJyxcbiAgUUE6ICdRQScsXG4gIFNBWTogJ1NBWScsXG59XG5cbmNvbnN0IElucHV0VHlwZSA9IHtcbiAgR09BTDogJ0dPQUwnLFxuICBRQV9TVUNDRUVERUQ6ICdRQV9TVUNDRUVERUQnLFxuICBRQV9GQUlMRUQ6ICdRQV9GQUlMRUQnLFxuICBTQVlfRE9ORTogJ1NBWV9ET05FJyxcbn1cblxuZnVuY3Rpb24gaW5wdXQoXG4gIGdvYWwkLFxuICByZWR1Y2VyU3RhdGUkLFxuICBzcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4pIHtcbiAgY29uc3QgcWFSZXN1bHQkID0gcmVkdWNlclN0YXRlJFxuICAgIC5maWx0ZXIocyA9PiAhIXMuUXVlc3Rpb25BbnN3ZXJBY3Rpb25cbiAgICAgICYmICEhcy5RdWVzdGlvbkFuc3dlckFjdGlvbi5vdXRwdXRzXG4gICAgICAmJiAhIXMuUXVlc3Rpb25BbnN3ZXJBY3Rpb24ub3V0cHV0cy5yZXN1bHQpXG4gICAgLm1hcChzID0+IHMuUXVlc3Rpb25BbnN3ZXJBY3Rpb24ub3V0cHV0cy5yZXN1bHQpXG4gICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoaXNFcXVhbFJlc3VsdCkpO1xuICByZXR1cm4geHMubWVyZ2UoXG4gICAgZ29hbCQubWFwKHggPT4gKHt0eXBlOiBJbnB1dFR5cGUuR09BTCwgdmFsdWU6IGluaXRHb2FsKHgpfSkpLFxuICAgIHFhUmVzdWx0JFxuICAgICAgLmZpbHRlcihyID0+IHIuc3RhdHVzLnN0YXR1cyA9PT0gU3RhdHVzLlNVQ0NFRURFRClcbiAgICAgIC5tYXAociA9PiAoe3R5cGU6IElucHV0VHlwZS5RQV9TVUNDRUVERUQsIHZhbHVlOiByLnJlc3VsdH0pKSxcbiAgICBxYVJlc3VsdCRcbiAgICAgIC5maWx0ZXIociA9PiByLnN0YXR1cy5zdGF0dXMgIT09IFN0YXR1cy5TVUNDRUVERUQpXG4gICAgICAubWFwKHIgPT4gKHt0eXBlOiBJbnB1dFR5cGUuUUFfRkFJTEVELCB2YWx1ZTogci5yZXN1bHR9KSksXG4gICAgc3BlZWNoU3ludGhlc2lzQWN0aW9uLnJlc3VsdFxuICAgICAgLmZpbHRlcihyID0+IHIuc3RhdHVzLnN0YXR1cyA9PT0gU3RhdHVzLlNVQ0NFRURFRClcbiAgICAgIC5tYXBUbyh7dHlwZTogSW5wdXRUeXBlLlNBWV9ET05FfSksXG4gICk7XG59XG5cbmZ1bmN0aW9uIHJlZHVjZXIoaW5wdXQkKSB7XG4gIGNvbnN0IGluaXRSZWR1Y2VyJCA9IHhzLm9mKGZ1bmN0aW9uIChwcmV2KSB7XG4gICAgaWYgKHR5cGVvZiBwcmV2ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGU6IFN0YXRlLlBFTkQsXG4gICAgICAgIHZhcmlhYmxlczogbnVsbCxcbiAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwcmV2O1xuICAgIH1cbiAgfSk7XG5cbiAgY29uc3QgU2VudGVuY2UgPSB7XG4gICAgQ0FSRUVSOiAnSXMgaXQgaW1wb3J0YW50IHRoYXQgeW91IHJlYWNoIHlvdXIgZnVsbCBjYXJlZXIgcG90ZW50aWFsPycsXG4gICAgT05MSU5FOiAnQ2FuIHlvdSBzZWUgeW91cnNlbGYgd29ya2luZyBvbmxpbmU/JyxcbiAgICBGQU1JTFk6ICdEbyB5b3UgaGF2ZSB0byBiZSBuZWFyIG15IGZhbWlseS9mcmllbmRzL3BldHM/JyxcbiAgICBUUklQUzogJ0RvIHlvdSB0aGluayBzaG9ydCB0cmlwcyBhcmUgYXdlc29tZT8nLFxuICAgIEhPTUU6ICdEbyB5b3Ugd2FudCB0byBoYXZlIGEgaG9tZSBhbmQgbmljZSB0aGluZ3M/JyxcbiAgICBST1VUSU5FOiAnRG8geW91IHRoaW5rIGEgcm91dGluZSBnaXZlcyB5b3VyIGxpZmUgc3RydWN0dXJlPycsXG4gICAgSk9COiAnRG8geW91IG5lZWQgYSBzZWN1cmUgam9iIGFuZCBhIHN0YWJsZSBpbmNvbWU/JyxcbiAgICBWQUNBVElPTkVSOiAnWW91IGFyZSBhIHZhY2F0aW9uZXIhJyxcbiAgICBFWFBBVDogJ1lvdSBhcmUgYW4gZXhwYXQhJyxcbiAgICBOT01BRDogJ1lvdSBhcmUgYSBub21hZCEnLFxuICB9O1xuICBjb25zdCBSZXNwb25zZSA9IHtcbiAgICBZRVM6ICd5ZXMnLFxuICAgIE5POiAnbm8nLFxuICB9XG4gIGNvbnN0IGZsb3djaGFydCA9IHtcbiAgICBbU2VudGVuY2UuQ0FSRUVSXToge1xuICAgICAgW1Jlc3BvbnNlLllFU106IFNlbnRlbmNlLk9OTElORSxcbiAgICAgIFtSZXNwb25zZS5OT106IFNlbnRlbmNlLkZBTUlMWSxcbiAgICB9LFxuICAgIFtTZW50ZW5jZS5PTkxJTkVdOiB7XG4gICAgICBbUmVzcG9uc2UuWUVTXTogU2VudGVuY2UuTk9NQUQsXG4gICAgICBbUmVzcG9uc2UuTk9dOiBTZW50ZW5jZS5WQUNBVElPTkVSLFxuICAgIH0sXG4gICAgW1NlbnRlbmNlLkZBTUlMWV06IHtcbiAgICAgIFtSZXNwb25zZS5ZRVNdOiBTZW50ZW5jZS5WQUNBVElPTkVSLFxuICAgICAgW1Jlc3BvbnNlLk5PXTogU2VudGVuY2UuVFJJUFMsXG4gICAgfSxcbiAgICBbU2VudGVuY2UuVFJJUFNdOiB7XG4gICAgICBbUmVzcG9uc2UuWUVTXTogU2VudGVuY2UuVkFDQVRJT05FUixcbiAgICAgIFtSZXNwb25zZS5OT106IFNlbnRlbmNlLkhPTUUsXG4gICAgfSxcbiAgICBbU2VudGVuY2UuSE9NRV06IHtcbiAgICAgIFtSZXNwb25zZS5ZRVNdOiBTZW50ZW5jZS5FWFBBVCxcbiAgICAgIFtSZXNwb25zZS5OT106IFNlbnRlbmNlLlJPVVRJTkUsXG4gICAgfSxcbiAgICBbU2VudGVuY2UuUk9VVElORV06IHtcbiAgICAgIFtSZXNwb25zZS5ZRVNdOiBTZW50ZW5jZS5FWFBBVCxcbiAgICAgIFtSZXNwb25zZS5OT106IFNlbnRlbmNlLkpPQixcbiAgICB9LFxuICAgIFtTZW50ZW5jZS5KT0JdOiB7XG4gICAgICBbUmVzcG9uc2UuWUVTXTogU2VudGVuY2UuT05MSU5FLFxuICAgICAgW1Jlc3BvbnNlLk5PXTogU2VudGVuY2UuTk9NQUQsXG4gICAgfSxcbiAgfTtcblxuICBjb25zdCB0cmFuc2l0aW9uUmVkdWNlciQgPSBpbnB1dCQubWFwKGlucHV0ID0+IGZ1bmN0aW9uIChwcmV2KSB7XG4gICAgY29uc29sZS5kZWJ1ZygnaW5wdXQnLCBpbnB1dCwgJ3ByZXYnLCBwcmV2KTtcbiAgICBpZiAocHJldi5zdGF0ZSA9PT0gU3RhdGUuUEVORCkge1xuICAgICAgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5HT0FMKSB7XG4gICAgICAgIGNvbnN0IG5vZGUgPSBTZW50ZW5jZS5DQVJFRVI7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICBzdGF0ZTogU3RhdGUuUUEsXG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBnb2FsX2lkOiBpbnB1dC52YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgIFF1ZXN0aW9uQW5zd2VyQWN0aW9uOiB7XG4gICAgICAgICAgICAgIGdvYWw6IGluaXRHb2FsKHtcbiAgICAgICAgICAgICAgICBxdWVzdGlvbjogbm9kZSxcbiAgICAgICAgICAgICAgICBhbnN3ZXJzOiBPYmplY3Qua2V5cyhmbG93Y2hhcnRbbm9kZV0pLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByZXYuc3RhdGUgPT09IFN0YXRlLlFBKSB7XG4gICAgICBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLlFBX1NVQ0NFRURFRCkge1xuICAgICAgICBjb25zdCBub2RlID0gZmxvd2NoYXJ0W3ByZXYudmFyaWFibGVzLm5vZGVdW2lucHV0LnZhbHVlXTtcbiAgICAgICAgaWYgKCFmbG93Y2hhcnRbbm9kZV0pIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5TQVksXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgLi4ucHJldi52YXJpYWJsZXMsXG4gICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICBTcGVlY2hTeW50aGVzaXNBY3Rpb246IHtcbiAgICAgICAgICAgICAgICBnb2FsOiBpbml0R29hbChub2RlKSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAuLi5wcmV2LnZhcmlhYmxlcyxcbiAgICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgIFF1ZXN0aW9uQW5zd2VyQWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgZ29hbDogaW5pdEdvYWwoe1xuICAgICAgICAgICAgICAgICAgcXVlc3Rpb246IG5vZGUsXG4gICAgICAgICAgICAgICAgICBhbnN3ZXJzOiBPYmplY3Qua2V5cyhmbG93Y2hhcnRbbm9kZV0pLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5RQV9GQUlMRUQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5wcmV2LFxuICAgICAgICAgIHN0YXRlOiBTdGF0ZS5QRU5ELFxuICAgICAgICAgIHZhcmlhYmxlczogbnVsbCxcbiAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldi52YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IFN0YXRlLkFCT1JURUQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHJlc3VsdDogcHJldi52YXJpYWJsZXMubm9kZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHByZXYuc3RhdGUgPT09IFN0YXRlLlNBWSkge1xuICAgICAgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5TQVlfRE9ORSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIC4uLnByZXYsXG4gICAgICAgICAgc3RhdGU6IFN0YXRlLlBFTkQsXG4gICAgICAgICAgdmFyaWFibGVzOiBudWxsLFxuICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICBzdGF0dXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBwcmV2LnZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgIHN0YXR1czogU3RhdGUuU1VDQ0VFREVELFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICByZXN1bHQ6IHByZXYudmFyaWFibGVzLm5vZGUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcmV2O1xuICB9KTtcblxuICByZXR1cm4geHMubWVyZ2UoaW5pdFJlZHVjZXIkLCB0cmFuc2l0aW9uUmVkdWNlciQpO1xufVxuXG5mdW5jdGlvbiBvdXRwdXQocmVkdWNlclN0YXRlJCkge1xuICBjb25zdCBvdXRwdXRzJCA9IHJlZHVjZXJTdGF0ZSRcbiAgICAuZmlsdGVyKG0gPT4gISFtLm91dHB1dHMpXG4gICAgLm1hcChtID0+IG0ub3V0cHV0cyk7XG4gIHJldHVybiB7XG4gICAgU3BlZWNoU3ludGhlc2lzQWN0aW9uOiBvdXRwdXRzJFxuICAgICAgLmZpbHRlcihvID0+ICEhby5TcGVlY2hTeW50aGVzaXNBY3Rpb24pXG4gICAgICAubWFwKG8gPT4gby5TcGVlY2hTeW50aGVzaXNBY3Rpb24uZ29hbClcbiAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzKGlzRXF1YWxHb2FsKSksXG4gICAgUXVlc3Rpb25BbnN3ZXJBY3Rpb246IG91dHB1dHMkXG4gICAgICAuZmlsdGVyKG8gPT4gISFvLlF1ZXN0aW9uQW5zd2VyQWN0aW9uKVxuICAgICAgLm1hcChvID0+IG8uUXVlc3Rpb25BbnN3ZXJBY3Rpb24uZ29hbClcbiAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzKGlzRXF1YWxHb2FsKSksXG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIEZsb3djaGFydEFjdGlvbihzb3VyY2VzKSB7XG4gIGNvbnN0IHJlZHVjZXJTdGF0ZSQgPSBzb3VyY2VzLnN0YXRlLnN0cmVhbTtcbiAgY29uc3Qgb3V0cHV0cyA9IG91dHB1dChyZWR1Y2VyU3RhdGUkKTtcbiAgY29uc3QgcWFTaW5rcyA9IGlzb2xhdGUoUXVlc3Rpb25BbnN3ZXJBY3Rpb24sICdRdWVzdGlvbkFuc3dlckFjdGlvbicpKHtcbiAgICBzdGF0ZTogc291cmNlcy5zdGF0ZSxcbiAgICBnb2FsOiBvdXRwdXRzLlF1ZXN0aW9uQW5zd2VyQWN0aW9uLFxuICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogc291cmNlcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gICAgU3BlZWNoUmVjb2duaXRpb25BY3Rpb246IHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24sXG4gIH0pO1xuICBjb25zdCBpbnB1dCQgPSBpbnB1dChcbiAgICBzb3VyY2VzLmdvYWwsXG4gICAgcmVkdWNlclN0YXRlJCxcbiAgICBzb3VyY2VzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbixcbiAgKTtcbiAgY29uc3QgcmVkdWNlciQgPSB4cy5tZXJnZShyZWR1Y2VyKGlucHV0JCksIHFhU2lua3Muc3RhdGUpO1xuXG4gIHJldHVybiB7XG4gICAgb3V0cHV0czoge1xuICAgICAgLi4ucWFTaW5rcy5vdXRwdXRzLFxuICAgICAgU3BlZWNoU3ludGhlc2lzQWN0aW9uOiB4cy5tZXJnZShcbiAgICAgICAgcWFTaW5rcy5vdXRwdXRzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbixcbiAgICAgICAgb3V0cHV0cy5TcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gICAgICApLFxuICAgIH0sXG4gICAgc3RhdGU6IHJlZHVjZXIkLFxuICB9XG59XG4iLCJpbXBvcnQgeHMgZnJvbSAneHN0cmVhbSc7XG5pbXBvcnQge1N0YXR1cywgaW5pdEdvYWx9IGZyb20gJ0BjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvbic7XG5cbmNvbnN0IFN0YXRlID0ge1xuICBQRU5EOiAnUEVORCcsXG4gIEFTSzogJ0FTSycsXG4gIExJU1RFTjogJ0xJU1RFTicsXG59O1xuXG5jb25zdCBJbnB1dFR5cGUgPSB7XG4gIEdPQUw6ICdHT0FMJyxcbiAgQVNLX0RPTkU6ICdBU0tfRE9ORScsXG4gIFZBTElEX1JFU1BPTlNFOiAnVkFMSURfUkVTUE9OU0UnLFxuICBJTlZBTElEX1JFU1BPTlNFOiAnSU5WQUxJRF9SRVNQT05TRScsXG59O1xuXG5mdW5jdGlvbiBpbnB1dChcbiAgZ29hbCQsXG4gIHNwZWVjaFN5bnRoZXNpc0FjdGlvbixcbiAgc3BlZWNoUmVjb2duaXRpb25BY3Rpb24sXG4pIHtcbiAgcmV0dXJuIHhzLm1lcmdlKFxuICAgIGdvYWwkLm1hcChnID0+ICh7dHlwZTogSW5wdXRUeXBlLkdPQUwsIHZhbHVlOiBpbml0R29hbChnKX0pKSxcbiAgICBzcGVlY2hTeW50aGVzaXNBY3Rpb24ucmVzdWx0XG4gICAgICAuZmlsdGVyKHJlc3VsdCA9PiByZXN1bHQuc3RhdHVzLnN0YXR1cyA9PT0gJ1NVQ0NFRURFRCcpXG4gICAgICAubWFwVG8oe3R5cGU6IElucHV0VHlwZS5BU0tfRE9ORX0pLFxuICAgIHNwZWVjaFJlY29nbml0aW9uQWN0aW9uLnJlc3VsdFxuICAgICAgLmZpbHRlcihyZXN1bHQgPT5cbiAgICAgICAgcmVzdWx0LnN0YXR1cy5zdGF0dXMgPT09ICdTVUNDRUVERUQnXG4gICAgICApLm1hcChyZXN1bHQgPT4gKHtcbiAgICAgICAgdHlwZTogSW5wdXRUeXBlLlZBTElEX1JFU1BPTlNFLFxuICAgICAgICB2YWx1ZTogcmVzdWx0LnJlc3VsdCxcbiAgICAgIH0pKSxcbiAgICBzcGVlY2hSZWNvZ25pdGlvbkFjdGlvbi5yZXN1bHRcbiAgICAgIC5maWx0ZXIocmVzdWx0ID0+XG4gICAgICAgIHJlc3VsdC5zdGF0dXMuc3RhdHVzICE9PSAnU1VDQ0VFREVEJ1xuICAgICAgKS5tYXBUbyh7dHlwZTogSW5wdXRUeXBlLklOVkFMSURfUkVTUE9OU0V9KSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gcmVkdWNlcihpbnB1dCQpIHtcbiAgY29uc3QgaW5pdFJlZHVjZXIkID0geHMub2YoZnVuY3Rpb24gKHByZXYpIHtcbiAgICBpZiAodHlwZW9mIHByZXYgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0ZTogU3RhdGUuUEVORCxcbiAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgcXVlc3Rpb246IG51bGwsXG4gICAgICAgICAgYW5zd2VyczogbnVsbCxcbiAgICAgICAgfSxcbiAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwcmV2O1xuICAgIH1cbiAgfSk7XG5cbiAgY29uc3QgdHJhbnNpdGlvblJlZHVjZXIkID0gaW5wdXQkLm1hcChpbnB1dCA9PiBmdW5jdGlvbiAocHJldikge1xuICAgIGNvbnNvbGUuZGVidWcoJ2lucHV0JywgaW5wdXQsICdwcmV2JywgcHJldik7XG4gICAgaWYgKHByZXYuc3RhdGUgPT09IFN0YXRlLlBFTkQpIHtcbiAgICAgIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuR09BTCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXRlOiBTdGF0ZS5BU0ssXG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBnb2FsOiBpbnB1dC52YWx1ZSxcbiAgICAgICAgICAgIHF1ZXN0aW9uOiBpbnB1dC52YWx1ZS5nb2FsLnF1ZXN0aW9uLFxuICAgICAgICAgICAgYW5zd2VyczogaW5wdXQudmFsdWUuZ29hbC5hbnN3ZXJzLm1hcChhID0+IGEudG9Mb3dlckNhc2UoKSksXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvdXRwdXRzOiB7U3BlZWNoU3ludGhlc2lzQWN0aW9uOiB7Z29hbDogaW5wdXQudmFsdWUuZ29hbC5xdWVzdGlvbn19LFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAocHJldi5zdGF0ZSA9PT0gU3RhdGUuQVNLKSB7XG4gICAgICBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkFTS19ET05FKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhdGU6IFN0YXRlLkxJU1RFTixcbiAgICAgICAgICB2YXJpYWJsZXM6IHByZXYudmFyaWFibGVzLFxuICAgICAgICAgIG91dHB1dHM6IHtTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjoge2dvYWw6IHt9fX0sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcmV2LnN0YXRlID09PSBTdGF0ZS5MSVNURU4pIHtcbiAgICAgIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuVkFMSURfUkVTUE9OU0UpIHtcbiAgICAgICAgY29uc3QgYW5zd2VyID0gcHJldi52YXJpYWJsZXMuYW5zd2Vycy5maW5kKFxuICAgICAgICAgIGEgPT4gYS50b0xvd2VyQ2FzZSgpLmluY2x1ZGVzKGlucHV0LnZhbHVlKSlcbiAgICAgICAgY29uc3QgdmFsaWQgPSAnJyAhPT0gaW5wdXQudmFsdWUgJiYgISFhbnN3ZXI7XG4gICAgICAgIHJldHVybiAoe1xuICAgICAgICAgIHN0YXRlOiBTdGF0ZS5QRU5ELFxuICAgICAgICAgIHZhcmlhYmxlczogbnVsbCxcbiAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldi52YXJpYWJsZXMuZ29hbC5nb2FsX2lkLFxuICAgICAgICAgICAgICAgIHN0YXR1czogdmFsaWQgPyBTdGF0dXMuU1VDQ0VFREVEIDogU3RhdHVzLkFCT1JURUQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHJlc3VsdDogdmFsaWQgPyBhbnN3ZXIgOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLklOVkFMSURfUkVTUE9OU0UpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0ZTogU3RhdGUuTElTVEVOLFxuICAgICAgICAgIHZhcmlhYmxlczogcHJldi52YXJpYWJsZXMsXG4gICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHByZXYudmFyaWFibGVzLmdvYWwuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IFN0YXR1cy5BQk9SVEVELFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gcHJldjtcbiAgfSk7XG5cbiAgcmV0dXJuIHhzLm1lcmdlKGluaXRSZWR1Y2VyJCwgdHJhbnNpdGlvblJlZHVjZXIkKTtcbn1cblxuZnVuY3Rpb24gb3V0cHV0KHJlZHVjZXJTdGF0ZSQpIHtcbiAgY29uc3Qgb3V0cHV0cyQgPSByZWR1Y2VyU3RhdGUkXG4gICAgLmZpbHRlcihtID0+ICEhbS5vdXRwdXRzKVxuICAgIC5tYXAobSA9PiBtLm91dHB1dHMpO1xuICByZXR1cm4ge1xuICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogb3V0cHV0cyRcbiAgICAgIC5maWx0ZXIobyA9PiAhIW8uU3BlZWNoU3ludGhlc2lzQWN0aW9uKVxuICAgICAgLm1hcChvID0+IG8uU3BlZWNoU3ludGhlc2lzQWN0aW9uLmdvYWwpLFxuICAgIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiBvdXRwdXRzJFxuICAgICAgLmZpbHRlcihvID0+ICEhby5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbilcbiAgICAgIC5tYXAobyA9PiBvLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLmdvYWwpLFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBRdWVzdGlvbkFuc3dlckFjdGlvbihzb3VyY2VzKSB7XG4gIGNvbnN0IHJlZHVjZXJTdGF0ZSQgPSBzb3VyY2VzLnN0YXRlLnN0cmVhbTtcbiAgY29uc3QgaW5wdXQkID0gaW5wdXQoXG4gICAgc291cmNlcy5nb2FsLFxuICAgIHNvdXJjZXMuU3BlZWNoU3ludGhlc2lzQWN0aW9uLFxuICAgIHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24sXG4gICk7XG4gIGNvbnN0IHJlZHVjZXIkID0gcmVkdWNlcihpbnB1dCQpO1xuICBjb25zdCBvdXRwdXRzID0gb3V0cHV0KHJlZHVjZXJTdGF0ZSQpO1xuXG4gIHJldHVybiB7XG4gICAgc3RhdGU6IHJlZHVjZXIkLFxuICAgIG91dHB1dHMsXG4gIH1cbn1cbiIsImltcG9ydCB4cyBmcm9tICd4c3RyZWFtJztcbmltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5JztcbmltcG9ydCBkcm9wUmVwZWF0cyBmcm9tICd4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzJztcbmltcG9ydCBpc29sYXRlIGZyb20gJ0BjeWNsZS9pc29sYXRlJztcbmltcG9ydCB7d2l0aFN0YXRlfSBmcm9tICdAY3ljbGUvc3RhdGUnXG5pbXBvcnQge3J1bn0gZnJvbSAnQGN5Y2xlL3J1bic7XG5pbXBvcnQge2lzRXF1YWxSZXN1bHR9IGZyb20gJ0BjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvbic7XG5pbXBvcnQge1xuICBtYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyLFxuICBTcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gIG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcixcbiAgU3BlZWNoUmVjb2duaXRpb25BY3Rpb24sXG59IGZyb20gJ0BjeWNsZS1yb2JvdC1kcml2ZXJzL3NwZWVjaCc7XG5pbXBvcnQgRmxvd2NoYXJ0QWN0aW9uIGZyb20gJy4vRmxvd2NoYXJ0QWN0aW9uJztcblxuZnVuY3Rpb24gbWFpbihzb3VyY2VzKSB7XG4gIGNvbnN0IHN0YXRlJCA9IHNvdXJjZXMuc3RhdGUuc3RyZWFtO1xuICBzdGF0ZSRcbiAgICAuZmlsdGVyKHMgPT4gISFzLkZsb3djaGFydEFjdGlvbiBcbiAgICAgICYmICEhcy5GbG93Y2hhcnRBY3Rpb24ub3V0cHV0c1xuICAgICAgJiYgISFzLkZsb3djaGFydEFjdGlvbi5vdXRwdXRzLnJlc3VsdClcbiAgICAubWFwKHMgPT4gcy5GbG93Y2hhcnRBY3Rpb24ub3V0cHV0cy5yZXN1bHQpXG4gICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoaXNFcXVhbFJlc3VsdCkpXG4gICAgLmFkZExpc3RlbmVyKHtcbiAgICAgIG5leHQ6IHIgPT4gY29uc29sZS5sb2coJ3Jlc3VsdCcsIHIpXG4gICAgfSk7XG5cbiAgY29uc3QgZ29hbCQgPSB4cy5vZih7fSkuY29tcG9zZShkZWxheSgyMDAwKSk7XG4gIFxuICAvLyBjcmVhdGUgYWN0aW9uIGNvbXBvbmVudHNcbiAgY29uc3QgZmNTaW5rcyA9IGlzb2xhdGUoRmxvd2NoYXJ0QWN0aW9uLCAnRmxvd2NoYXJ0QWN0aW9uJykoe1xuICAgIHN0YXRlOiBzb3VyY2VzLnN0YXRlLFxuICAgIGdvYWw6IGdvYWwkLFxuICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjoge1xuICAgICAgcmVzdWx0OiBzdGF0ZSRcbiAgICAgICAgLm1hcChzID0+IHMuU3BlZWNoU3ludGhlc2lzQWN0aW9uLnJlc3VsdClcbiAgICAgICAgLmZpbHRlcihyID0+ICEhcilcbiAgICAgICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoaXNFcXVhbFJlc3VsdCkpLFxuICAgIH0sXG4gICAgU3BlZWNoUmVjb2duaXRpb25BY3Rpb246IHtcbiAgICAgIHJlc3VsdDogc3RhdGUkXG4gICAgICAgIC5tYXAocyA9PiBzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLnJlc3VsdClcbiAgICAgICAgLmZpbHRlcihyID0+ICEhcilcbiAgICAgICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoaXNFcXVhbFJlc3VsdCkpLFxuICAgIH0sXG4gIH0pO1xuICBjb25zdCBzcGVlY2hTeW50aGVzaXNBY3Rpb24gPSBTcGVlY2hTeW50aGVzaXNBY3Rpb24oe1xuICAgIGdvYWw6IGZjU2lua3Mub3V0cHV0cy5TcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gICAgU3BlZWNoU3ludGhlc2lzOiBzb3VyY2VzLlNwZWVjaFN5bnRoZXNpcyxcbiAgfSk7XG4gIGNvbnN0IHNwZWVjaFJlY29nbml0aW9uQWN0aW9uID0gU3BlZWNoUmVjb2duaXRpb25BY3Rpb24oe1xuICAgIGdvYWw6IGZjU2lua3Mub3V0cHV0cy5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbixcbiAgICBTcGVlY2hSZWNvZ25pdGlvbjogc291cmNlcy5TcGVlY2hSZWNvZ25pdGlvbixcbiAgfSk7XG5cbiAgLy8gZGVmaW5lIHJlZHVjZXJzXG4gIGNvbnN0IHJlZHVjZXIkID0geHMubWVyZ2UoXG4gICAgeHMub2YoZnVuY3Rpb24gKCkgeyAgLy8gaW5pdFJlZHVjZXJcbiAgICAgIHJldHVybiB7XG4gICAgICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjoge3Jlc3VsdDogbnVsbH0sXG4gICAgICAgIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiB7cmVzdWx0OiBudWxsfSxcbiAgICAgIH07XG4gICAgfSksXG4gICAgc3BlZWNoU3ludGhlc2lzQWN0aW9uLnJlc3VsdFxuICAgICAgLm1hcChyZXN1bHQgPT4gZnVuY3Rpb24gKHByZXZTdGF0ZSkge1xuICAgICAgICByZXR1cm4gey4uLnByZXZTdGF0ZSwgU3BlZWNoU3ludGhlc2lzQWN0aW9uOiB7cmVzdWx0fX1cbiAgICAgIH0pLFxuICAgIHNwZWVjaFJlY29nbml0aW9uQWN0aW9uLnJlc3VsdFxuICAgICAgLm1hcChyZXN1bHQgPT4gZnVuY3Rpb24gKHByZXZTdGF0ZSkge1xuICAgICAgICByZXR1cm4gey4uLnByZXZTdGF0ZSwgU3BlZWNoUmVjb2duaXRpb25BY3Rpb246IHtyZXN1bHR9fVxuICAgICAgfSksXG4gICAgZmNTaW5rcy5zdGF0ZSxcbiAgKTtcblxuICByZXR1cm4ge1xuICAgIFNwZWVjaFN5bnRoZXNpczogc3BlZWNoU3ludGhlc2lzQWN0aW9uLm91dHB1dCxcbiAgICBTcGVlY2hSZWNvZ25pdGlvbjogc3BlZWNoUmVjb2duaXRpb25BY3Rpb24ub3V0cHV0LFxuICAgIHN0YXRlOiByZWR1Y2VyJCxcbiAgfVxufVxuXG5ydW4od2l0aFN0YXRlKG1haW4pLCB7XG4gIFNwZWVjaFN5bnRoZXNpczogbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlcigpLFxuICBTcGVlY2hSZWNvZ25pdGlvbjogbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyKCksXG59KTtcbiJdfQ==

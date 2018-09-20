(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var types_1 = require("./types");
exports.Status = types_1.Status;
var utils_1 = require("./utils");
exports.generateGoalID = utils_1.generateGoalID;
exports.initGoal = utils_1.initGoal;
exports.isEqual = utils_1.isEqual;
exports.powerup = utils_1.powerup;

},{"./types":2,"./utils":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Status;
(function (Status) {
    Status["PENDING"] = "PENDING";
    Status["ACTIVE"] = "ACTIVE";
    Status["PREEMPTED"] = "PREEMPTED";
    Status["SUCCEEDED"] = "SUCCEEDED";
    Status["ABORTED"] = "ABORTED";
})(Status = exports.Status || (exports.Status = {}));

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
function initGoal(goal) {
    return {
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
function input(goal$, startEvent$, endEvent$, errorEvent$, resultEvent$) {
    return xstream_1.default.merge(goal$.map(function (goal) {
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
    }), startEvent$.mapTo({ type: InputType.START, value: null }), endEvent$.mapTo({ type: InputType.END, value: null }), errorEvent$.mapTo({ type: InputType.ERROR, value: null }), resultEvent$.map(function (event) { return ({ type: InputType.RESULT, value: event }); }));
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
            console.debug('No speech; transcript is null');
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
                    result: prevVariables.transcript,
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
function input(goal$, startEvent$, endEvent$) {
    return xstream_1.default.merge(goal$.map(function (goal) {
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
var speech_synthesis_1 = require("./speech_synthesis");
exports.makeSpeechSynthesisDriver = speech_synthesis_1.makeSpeechSynthesisDriver;
var SpeechSynthesisAction_1 = require("./SpeechSynthesisAction");
exports.SpeechSynthesisAction = SpeechSynthesisAction_1.SpeechSynthesisAction;
var speech_recognition_1 = require("./speech_recognition");
exports.makeSpeechRecognitionDriver = speech_recognition_1.makeSpeechRecognitionDriver;
var SpeechRecognitionAction_1 = require("./SpeechRecognitionAction");
exports.SpeechRecognitionAction = SpeechRecognitionAction_1.SpeechRecognitionAction;

},{"./SpeechRecognitionAction":4,"./SpeechSynthesisAction":5,"./speech_recognition":7,"./speech_synthesis":8}],7:[function(require,module,exports){
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
    next: function next(result) {
      return console.log('Listening...');
    }
  });
  sources.SpeechRecognitionAction.result.addListener({
    next: function next(result) {
      return console.log('Heard "' + result.result + '"');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdHlwZXMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvc3BlZWNoL2xpYi9janMvU3BlZWNoUmVjb2duaXRpb25BY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvc3BlZWNoL2xpYi9janMvU3BlZWNoU3ludGhlc2lzQWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL3NwZWVjaC9saWIvY2pzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL3NwZWVjaC9saWIvY2pzL3NwZWVjaF9yZWNvZ25pdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUtcm9ib3QtZHJpdmVycy9zcGVlY2gvbGliL2Nqcy9zcGVlY2hfc3ludGhlc2lzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9hZGFwdC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2ludGVybmFscy5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcXVpY2t0YXNrL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zeW1ib2wtb2JzZXJ2YWJsZS9saWIvcG9ueWZpbGwuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9kZWxheS50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9mcm9tRXZlbnQudHMiLCJub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvaW5kZXgudHMiLCJzcmMvaW5kZXguanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QyxDQUFtRDtBQUNqRCxVQUFNLGNBQUMsTUFBRDtBQUFBLGFBQVksUUFBUSxHQUFSLGdCQUFaO0FBQUE7QUFEMkMsR0FBbkQ7QUFHQSxVQUFRLHVCQUFSLENBQWdDLE1BQWhDLENBQXVDLFdBQXZDLENBQW1EO0FBQ2pELFVBQU0sY0FBQyxNQUFEO0FBQUEsYUFBWSxRQUFRLEdBQVIsYUFBc0IsT0FBTyxNQUE3QixPQUFaO0FBQUE7QUFEMkMsR0FBbkQ7O0FBS0EsU0FBTztBQUNMLHFCQUFpQixRQUFRLHFCQUFSLENBQThCLE1BRDFDO0FBRUwsdUJBQW1CLFFBQVEsdUJBQVIsQ0FBZ0MsTUFGOUM7QUFHTCxhQUFTLEVBQUc7QUFDViw2QkFBdUIsVUFEaEI7QUFFUCwrQkFBeUI7QUFGbEI7QUFISixHQUFQO0FBUUQ7O0FBRUQsY0FBSSxxQkFBUSxJQUFSLEVBQWMsVUFBQyxLQUFELEVBQVEsTUFBUjtBQUFBLFNBQW1CLE1BQU0sT0FBTixDQUFjLE1BQWQsQ0FBbkI7QUFBQSxDQUFkLENBQUosRUFBNkQ7QUFDM0QsbUJBQWlCLHdDQUQwQztBQUUzRCxxQkFBbUI7QUFGd0MsQ0FBN0QiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0eXBlc18xID0gcmVxdWlyZShcIi4vdHlwZXNcIik7XG5leHBvcnRzLlN0YXR1cyA9IHR5cGVzXzEuU3RhdHVzO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmV4cG9ydHMuZ2VuZXJhdGVHb2FsSUQgPSB1dGlsc18xLmdlbmVyYXRlR29hbElEO1xuZXhwb3J0cy5pbml0R29hbCA9IHV0aWxzXzEuaW5pdEdvYWw7XG5leHBvcnRzLmlzRXF1YWwgPSB1dGlsc18xLmlzRXF1YWw7XG5leHBvcnRzLnBvd2VydXAgPSB1dGlsc18xLnBvd2VydXA7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTdGF0dXM7XG4oZnVuY3Rpb24gKFN0YXR1cykge1xuICAgIFN0YXR1c1tcIlBFTkRJTkdcIl0gPSBcIlBFTkRJTkdcIjtcbiAgICBTdGF0dXNbXCJBQ1RJVkVcIl0gPSBcIkFDVElWRVwiO1xuICAgIFN0YXR1c1tcIlBSRUVNUFRFRFwiXSA9IFwiUFJFRU1QVEVEXCI7XG4gICAgU3RhdHVzW1wiU1VDQ0VFREVEXCJdID0gXCJTVUNDRUVERURcIjtcbiAgICBTdGF0dXNbXCJBQk9SVEVEXCJdID0gXCJBQk9SVEVEXCI7XG59KShTdGF0dXMgPSBleHBvcnRzLlN0YXR1cyB8fCAoZXhwb3J0cy5TdGF0dXMgPSB7fSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dHlwZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19yZXN0ID0gKHRoaXMgJiYgdGhpcy5fX3Jlc3QpIHx8IGZ1bmN0aW9uIChzLCBlKSB7XG4gICAgdmFyIHQgPSB7fTtcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcbiAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMClcbiAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xuICAgIHJldHVybiB0O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdlbmVyYXRlR29hbElEKCkge1xuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YW1wOiBub3csXG4gICAgICAgIGlkOiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMikgKyBcIi1cIiArIG5vdy5nZXRUaW1lKCksXG4gICAgfTtcbn1cbmV4cG9ydHMuZ2VuZXJhdGVHb2FsSUQgPSBnZW5lcmF0ZUdvYWxJRDtcbmZ1bmN0aW9uIGluaXRHb2FsKGdvYWwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBnb2FsX2lkOiBnZW5lcmF0ZUdvYWxJRCgpLFxuICAgICAgICBnb2FsOiBnb2FsLFxuICAgIH07XG59XG5leHBvcnRzLmluaXRHb2FsID0gaW5pdEdvYWw7XG5mdW5jdGlvbiBpc0VxdWFsKGZpcnN0LCBzZWNvbmQpIHtcbiAgICBpZiAoIWZpcnN0IHx8ICFzZWNvbmQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gKGZpcnN0LnN0YW1wID09PSBzZWNvbmQuc3RhbXAgJiYgZmlyc3QuaWQgPT09IHNlY29uZC5pZCk7XG59XG5leHBvcnRzLmlzRXF1YWwgPSBpc0VxdWFsO1xuZnVuY3Rpb24gcG93ZXJ1cChtYWluLCBjb25uZWN0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzb3VyY2VzKSB7XG4gICAgICAgIHZhciBzaW5rcyA9IG1haW4oc291cmNlcyk7XG4gICAgICAgIE9iamVjdC5rZXlzKHNvdXJjZXMucHJveGllcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGNvbm5lY3Qoc291cmNlcy5wcm94aWVzW2tleV0sIHNpbmtzLnRhcmdldHNba2V5XSk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdGFyZ2V0cyA9IHNpbmtzLnRhcmdldHMsIHNpbmtzV2l0aG91dFRhcmdldHMgPSBfX3Jlc3Qoc2lua3MsIFtcInRhcmdldHNcIl0pO1xuICAgICAgICByZXR1cm4gc2lua3NXaXRob3V0VGFyZ2V0cztcbiAgICB9O1xufVxuZXhwb3J0cy5wb3dlcnVwID0gcG93ZXJ1cDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtXCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciBTdGF0ZTtcbihmdW5jdGlvbiAoU3RhdGUpIHtcbiAgICBTdGF0ZVtcIlJVTk5JTkdcIl0gPSBcIlJVTk5JTkdcIjtcbiAgICBTdGF0ZVtcIkRPTkVcIl0gPSBcIkRPTkVcIjtcbiAgICBTdGF0ZVtcIlBSRUVNUFRJTkdcIl0gPSBcIlBSRUVNUFRJTkdcIjtcbn0pKFN0YXRlIHx8IChTdGF0ZSA9IHt9KSk7XG52YXIgSW5wdXRUeXBlO1xuKGZ1bmN0aW9uIChJbnB1dFR5cGUpIHtcbiAgICBJbnB1dFR5cGVbXCJHT0FMXCJdID0gXCJHT0FMXCI7XG4gICAgSW5wdXRUeXBlW1wiQ0FOQ0VMXCJdID0gXCJDQU5DRUxcIjtcbiAgICBJbnB1dFR5cGVbXCJTVEFSVFwiXSA9IFwiU1RBUlRcIjtcbiAgICBJbnB1dFR5cGVbXCJFTkRcIl0gPSBcIkVORFwiO1xuICAgIElucHV0VHlwZVtcIkVSUk9SXCJdID0gXCJFUlJPUlwiO1xuICAgIElucHV0VHlwZVtcIlJFU1VMVFwiXSA9IFwiUkVTVUxUXCI7XG59KShJbnB1dFR5cGUgfHwgKElucHV0VHlwZSA9IHt9KSk7XG5mdW5jdGlvbiBpbnB1dChnb2FsJCwgc3RhcnRFdmVudCQsIGVuZEV2ZW50JCwgZXJyb3JFdmVudCQsIHJlc3VsdEV2ZW50JCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5tYXAoZnVuY3Rpb24gKGdvYWwpIHtcbiAgICAgICAgaWYgKGdvYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogSW5wdXRUeXBlLkNBTkNFTCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5HT0FMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAhIWdvYWwuZ29hbF9pZCA/IGdvYWwgOiBhY3Rpb25fMS5pbml0R29hbChnb2FsKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KSwgc3RhcnRFdmVudCQubWFwVG8oeyB0eXBlOiBJbnB1dFR5cGUuU1RBUlQsIHZhbHVlOiBudWxsIH0pLCBlbmRFdmVudCQubWFwVG8oeyB0eXBlOiBJbnB1dFR5cGUuRU5ELCB2YWx1ZTogbnVsbCB9KSwgZXJyb3JFdmVudCQubWFwVG8oeyB0eXBlOiBJbnB1dFR5cGUuRVJST1IsIHZhbHVlOiBudWxsIH0pLCByZXN1bHRFdmVudCQubWFwKGZ1bmN0aW9uIChldmVudCkgeyByZXR1cm4gKHsgdHlwZTogSW5wdXRUeXBlLlJFU1VMVCwgdmFsdWU6IGV2ZW50IH0pOyB9KSk7XG59XG52YXIgdHJhbnNpdGlvblRhYmxlID0gKF9hID0ge30sXG4gICAgX2FbU3RhdGUuRE9ORV0gPSAoX2IgPSB7fSxcbiAgICAgICAgX2JbSW5wdXRUeXBlLkdPQUxdID0gU3RhdGUuUlVOTklORyxcbiAgICAgICAgX2IpLFxuICAgIF9hW1N0YXRlLlJVTk5JTkddID0gKF9jID0ge30sXG4gICAgICAgIF9jW0lucHV0VHlwZS5HT0FMXSA9IFN0YXRlLlBSRUVNUFRJTkcsXG4gICAgICAgIF9jW0lucHV0VHlwZS5DQU5DRUxdID0gU3RhdGUuUFJFRU1QVElORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLlNUQVJUXSA9IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgIF9jW0lucHV0VHlwZS5FTkRdID0gU3RhdGUuRE9ORSxcbiAgICAgICAgX2MpLFxuICAgIF9hW1N0YXRlLlBSRUVNUFRJTkddID0gKF9kID0ge30sXG4gICAgICAgIF9kW0lucHV0VHlwZS5FTkRdID0gU3RhdGUuRE9ORSxcbiAgICAgICAgX2QpLFxuICAgIF9hKTtcbmZ1bmN0aW9uIHRyYW5zaXRpb24ocHJldlN0YXRlLCBwcmV2VmFyaWFibGVzLCBpbnB1dCkge1xuICAgIHZhciBzdGF0ZXMgPSB0cmFuc2l0aW9uVGFibGVbcHJldlN0YXRlXTtcbiAgICBpZiAoIXN0YXRlcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHByZXZTdGF0ZT1cXFwiXCIgKyBwcmV2U3RhdGUgKyBcIlxcXCJcIik7XG4gICAgfVxuICAgIHZhciBzdGF0ZSA9IHN0YXRlc1tpbnB1dC50eXBlXTtcbiAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJVbmRlZmluZWQgdHJhbnNpdGlvbiBmb3IgXFxcIlwiICsgcHJldlN0YXRlICsgXCJcXFwiIFxcXCJcIiArIGlucHV0LnR5cGUgKyBcIlxcXCI7IFwiXG4gICAgICAgICAgICArIFwic2V0IHN0YXRlIHRvIHByZXZTdGF0ZVwiKTtcbiAgICAgICAgc3RhdGUgPSBwcmV2U3RhdGU7XG4gICAgfVxuICAgIGlmIChwcmV2U3RhdGUgPT09IFN0YXRlLkRPTkUgJiYgc3RhdGUgPT09IFN0YXRlLlJVTk5JTkcpIHtcbiAgICAgICAgLy8gU3RhcnQgYSBuZXcgZ29hbFxuICAgICAgICB2YXIgZ29hbCA9IGlucHV0LnZhbHVlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogZ29hbC5nb2FsX2lkLFxuICAgICAgICAgICAgICAgIHRyYW5zY3JpcHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgYXJnczogZ29hbC5nb2FsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmIChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgJiYgc3RhdGUgPT09IFN0YXRlLlJVTk5JTkcpIHtcbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5SRVNVTFQpIHtcbiAgICAgICAgICAgIHZhciBldmVudF8xID0gaW5wdXQudmFsdWU7XG4gICAgICAgICAgICB2YXIgbGFzdCA9IGV2ZW50XzEucmVzdWx0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgdmFyIHRyYW5zY3JpcHQgPSBldmVudF8xLnJlc3VsdHNbbGFzdF1bMF0udHJhbnNjcmlwdDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogX19hc3NpZ24oe30sIHByZXZWYXJpYWJsZXMsIHsgdHJhbnNjcmlwdDogdHJhbnNjcmlwdCB9KSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkVSUk9SKSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdObyBzcGVlY2g7IHRyYW5zY3JpcHQgaXMgbnVsbCcpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHN0YXRlID09PSBTdGF0ZS5ET05FKSB7XG4gICAgICAgIGlmIChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgfHwgcHJldlN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKSB7XG4gICAgICAgICAgICAvLyBTdG9wIHRoZSBjdXJyZW50IGdvYWwgYW5kIHN0YXJ0IHRoZSBxdWV1ZWQgbmV3IGdvYWxcbiAgICAgICAgICAgIHZhciBuZXdHb2FsID0gcHJldlZhcmlhYmxlcy5uZXdHb2FsO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogISFuZXdHb2FsID8gU3RhdGUuUlVOTklORyA6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiAhIW5ld0dvYWwgPyBuZXdHb2FsLmdvYWxfaWQgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB0cmFuc2NyaXB0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czogISFuZXdHb2FsID8ge1xuICAgICAgICAgICAgICAgICAgICBhcmdzOiBuZXdHb2FsLmdvYWwsXG4gICAgICAgICAgICAgICAgfSA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldlZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQgOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHByZXZWYXJpYWJsZXMudHJhbnNjcmlwdCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICgocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HIHx8IHByZXZTdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORylcbiAgICAgICAgJiYgc3RhdGUgPT09IFN0YXRlLlBSRUVNUFRJTkcpIHtcbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5HT0FMIHx8IGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5DQU5DRUwpIHtcbiAgICAgICAgICAgIC8vIFN0YXJ0IHN0b3BwaW5nIHRoZSBjdXJyZW50IGdvYWwgYW5kIHF1ZXVlIGEgbmV3IGdvYWwgaWYgcmVjZWl2ZWQgb25lXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IF9fYXNzaWduKHt9LCBwcmV2VmFyaWFibGVzLCB7IG5ld0dvYWw6IGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5HT0FMID8gaW5wdXQudmFsdWUgOiBudWxsIH0pLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyA/IHtcbiAgICAgICAgICAgICAgICAgICAgYXJnczogbnVsbCxcbiAgICAgICAgICAgICAgICB9IDogbnVsbCxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXRlOiBwcmV2U3RhdGUsXG4gICAgICAgIHZhcmlhYmxlczogcHJldlZhcmlhYmxlcyxcbiAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgIH07XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gaW5pdFJlZHVjZXIocHJldikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgIHRyYW5zY3JpcHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciBpbnB1dFJlZHVjZXIkID0gaW5wdXQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiBpbnB1dFJlZHVjZXIocHJldikge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihwcmV2LnN0YXRlLCBwcmV2LnZhcmlhYmxlcywgaW5wdXQpO1xuICAgIH07IH0pO1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbml0UmVkdWNlciQsIGlucHV0UmVkdWNlciQpO1xufVxuZnVuY3Rpb24gU3BlZWNoUmVjb2duaXRpb25BY3Rpb24oc291cmNlcykge1xuICAgIHZhciBpbnB1dCQgPSBpbnB1dCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLmdvYWwpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uLmV2ZW50cygnc3RhcnQnKSksIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb24uZXZlbnRzKCdlbmQnKSksIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb24uZXZlbnRzKCdlcnJvcicpKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5TcGVlY2hSZWNvZ25pdGlvbi5ldmVudHMoJ3Jlc3VsdCcpKSk7XG4gICAgdmFyIHN0YXRlJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSk7IC8vIGRyb3AgXCJudWxsXCJcbiAgICB2YXIgb3V0cHV0cyQgPSBzdGF0ZSQubWFwKGZ1bmN0aW9uIChzdGF0ZSkgeyByZXR1cm4gc3RhdGUub3V0cHV0czsgfSlcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzOyB9KTtcbiAgICB2YXIgcmVzdWx0JCA9IHN0YXRlJC5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiBzdGF0ZS5yZXN1bHQ7IH0pLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7IHJldHVybiAhIXJlc3VsdDsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb3V0cHV0OiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5hcmdzOyB9KSksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChyZXN1bHQkKSxcbiAgICB9O1xufVxuZXhwb3J0cy5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbiA9IFNwZWVjaFJlY29nbml0aW9uQWN0aW9uO1xudmFyIF9hLCBfYiwgX2MsIF9kO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3BlZWNoUmVjb2duaXRpb25BY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgYWN0aW9uXzEgPSByZXF1aXJlKFwiQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uXCIpO1xudmFyIFN0YXRlO1xuKGZ1bmN0aW9uIChTdGF0ZSkge1xuICAgIFN0YXRlW1wiUlVOTklOR1wiXSA9IFwiUlVOTklOR1wiO1xuICAgIFN0YXRlW1wiRE9ORVwiXSA9IFwiRE9ORVwiO1xuICAgIFN0YXRlW1wiUFJFRU1QVElOR1wiXSA9IFwiUFJFRU1QVElOR1wiO1xufSkoU3RhdGUgfHwgKFN0YXRlID0ge30pKTtcbnZhciBJbnB1dFR5cGU7XG4oZnVuY3Rpb24gKElucHV0VHlwZSkge1xuICAgIElucHV0VHlwZVtcIkdPQUxcIl0gPSBcIkdPQUxcIjtcbiAgICBJbnB1dFR5cGVbXCJDQU5DRUxcIl0gPSBcIkNBTkNFTFwiO1xuICAgIElucHV0VHlwZVtcIlNUQVJUXCJdID0gXCJTVEFSVFwiO1xuICAgIElucHV0VHlwZVtcIkVORFwiXSA9IFwiRU5EXCI7XG59KShJbnB1dFR5cGUgfHwgKElucHV0VHlwZSA9IHt9KSk7XG5mdW5jdGlvbiBpbnB1dChnb2FsJCwgc3RhcnRFdmVudCQsIGVuZEV2ZW50JCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5tYXAoZnVuY3Rpb24gKGdvYWwpIHtcbiAgICAgICAgaWYgKGdvYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogSW5wdXRUeXBlLkNBTkNFTCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSAhIWdvYWwuZ29hbF9pZCA/IGdvYWwgOiBhY3Rpb25fMS5pbml0R29hbChnb2FsKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogSW5wdXRUeXBlLkdPQUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHR5cGVvZiB2YWx1ZS5nb2FsID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiB7IHRleHQ6IHZhbHVlLmdvYWwgfSxcbiAgICAgICAgICAgICAgICAgICAgfSA6IHZhbHVlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pLCBzdGFydEV2ZW50JC5tYXBUbyh7IHR5cGU6IElucHV0VHlwZS5TVEFSVCwgdmFsdWU6IG51bGwgfSksIGVuZEV2ZW50JC5tYXBUbyh7IHR5cGU6IElucHV0VHlwZS5FTkQsIHZhbHVlOiBudWxsIH0pKTtcbn1cbnZhciB0cmFuc2l0aW9uVGFibGUgPSAoX2EgPSB7fSxcbiAgICBfYVtTdGF0ZS5ET05FXSA9IChfYiA9IHt9LFxuICAgICAgICBfYltJbnB1dFR5cGUuR09BTF0gPSBTdGF0ZS5SVU5OSU5HLFxuICAgICAgICBfYiksXG4gICAgX2FbU3RhdGUuUlVOTklOR10gPSAoX2MgPSB7fSxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkdPQUxdID0gU3RhdGUuUFJFRU1QVElORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkNBTkNFTF0gPSBTdGF0ZS5QUkVFTVBUSU5HLFxuICAgICAgICBfY1tJbnB1dFR5cGUuU1RBUlRdID0gU3RhdGUuUlVOTklORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkVORF0gPSBTdGF0ZS5ET05FLFxuICAgICAgICBfYyksXG4gICAgX2FbU3RhdGUuUFJFRU1QVElOR10gPSAoX2QgPSB7fSxcbiAgICAgICAgX2RbSW5wdXRUeXBlLkVORF0gPSBTdGF0ZS5ET05FLFxuICAgICAgICBfZCksXG4gICAgX2EpO1xuZnVuY3Rpb24gdHJhbnNpdGlvbihwcmV2U3RhdGUsIHByZXZWYXJpYWJsZXMsIGlucHV0KSB7XG4gICAgdmFyIHN0YXRlcyA9IHRyYW5zaXRpb25UYWJsZVtwcmV2U3RhdGVdO1xuICAgIGlmICghc3RhdGVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcHJldlN0YXRlPVxcXCJcIiArIHByZXZTdGF0ZSArIFwiXFxcIlwiKTtcbiAgICB9XG4gICAgdmFyIHN0YXRlID0gc3RhdGVzW2lucHV0LnR5cGVdO1xuICAgIGlmICghc3RhdGUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlVuZGVmaW5lZCB0cmFuc2l0aW9uIGZvciBcXFwiXCIgKyBwcmV2U3RhdGUgKyBcIlxcXCIgXFxcIlwiICsgaW5wdXQudHlwZSArIFwiXFxcIjsgXCJcbiAgICAgICAgICAgICsgXCJzZXQgc3RhdGUgdG8gcHJldlN0YXRlXCIpO1xuICAgICAgICBzdGF0ZSA9IHByZXZTdGF0ZTtcbiAgICB9XG4gICAgaWYgKHByZXZTdGF0ZSA9PT0gU3RhdGUuRE9ORSAmJiBzdGF0ZSA9PT0gU3RhdGUuUlVOTklORykge1xuICAgICAgICAvLyBTdGFydCBhIG5ldyBnb2FsXG4gICAgICAgIHZhciBnb2FsID0gaW5wdXQudmFsdWU7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBnb2FsLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgYXJnczogZ29hbC5nb2FsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmIChzdGF0ZSA9PT0gU3RhdGUuRE9ORSkge1xuICAgICAgICBpZiAocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HIHx8IHByZXZTdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORykge1xuICAgICAgICAgICAgLy8gU3RvcCB0aGUgY3VycmVudCBnb2FsIGFuZCBzdGFydCB0aGUgcXVldWVkIG5ldyBnb2FsXG4gICAgICAgICAgICB2YXIgbmV3R29hbCA9IHByZXZWYXJpYWJsZXMubmV3R29hbDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6ICEhbmV3R29hbCA/IFN0YXRlLlJVTk5JTkcgOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogISFuZXdHb2FsID8gbmV3R29hbC5nb2FsX2lkIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG91dHB1dHM6ICEhbmV3R29hbCA/IHtcbiAgICAgICAgICAgICAgICAgICAgYXJnczogbmV3R29hbC5nb2FsLFxuICAgICAgICAgICAgICAgIH0gOiBudWxsLFxuICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHByZXZWYXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogcHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVEIDogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgfHwgcHJldlN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKVxuICAgICAgICAmJiBzdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORykge1xuICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkdPQUwgfHwgaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkNBTkNFTCkge1xuICAgICAgICAgICAgLy8gU3RhcnQgc3RvcHBpbmcgdGhlIGN1cnJlbnQgZ29hbCBhbmQgcXVldWUgYSBuZXcgZ29hbCBpZiByZWNlaXZlZCBvbmVcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogX19hc3NpZ24oe30sIHByZXZWYXJpYWJsZXMsIHsgbmV3R29hbDogaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLkdPQUwgPyBpbnB1dC52YWx1ZSA6IG51bGwgfSksXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBhcmdzOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBzdGF0ZTogcHJldlN0YXRlLFxuICAgICAgICB2YXJpYWJsZXM6IHByZXZWYXJpYWJsZXMsXG4gICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICB9O1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvblJlZHVjZXIoaW5wdXQkKSB7XG4gICAgdmFyIGluaXRSZWR1Y2VyJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGZ1bmN0aW9uIGluaXRSZWR1Y2VyKHByZXYpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5ET05FLFxuICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogbnVsbCxcbiAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIGlucHV0UmVkdWNlciQgPSBpbnB1dCRcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoaW5wdXQpIHsgcmV0dXJuIGZ1bmN0aW9uIGlucHV0UmVkdWNlcihwcmV2KSB7XG4gICAgICAgIHJldHVybiB0cmFuc2l0aW9uKHByZXYuc3RhdGUsIHByZXYudmFyaWFibGVzLCBpbnB1dCk7XG4gICAgfTsgfSk7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGluaXRSZWR1Y2VyJCwgaW5wdXRSZWR1Y2VyJCk7XG59XG5mdW5jdGlvbiBTcGVlY2hTeW50aGVzaXNBY3Rpb24oc291cmNlcykge1xuICAgIHZhciBpbnB1dCQgPSBpbnB1dCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLmdvYWwpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFN5bnRoZXNpcy5ldmVudHMoJ3N0YXJ0JykpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFN5bnRoZXNpcy5ldmVudHMoJ2VuZCcpKSk7XG4gICAgdmFyIHN0YXRlJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSk7IC8vIGRyb3AgXCJudWxsXCJcbiAgICB2YXIgb3V0cHV0cyQgPSBzdGF0ZSQubWFwKGZ1bmN0aW9uIChzdGF0ZSkgeyByZXR1cm4gc3RhdGUub3V0cHV0czsgfSlcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzOyB9KTtcbiAgICB2YXIgcmVzdWx0JCA9IHN0YXRlJC5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiBzdGF0ZS5yZXN1bHQ7IH0pLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7IHJldHVybiAhIXJlc3VsdDsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb3V0cHV0OiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5hcmdzOyB9KSksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChyZXN1bHQkKSxcbiAgICB9O1xufVxuZXhwb3J0cy5TcGVlY2hTeW50aGVzaXNBY3Rpb24gPSBTcGVlY2hTeW50aGVzaXNBY3Rpb247XG52YXIgX2EsIF9iLCBfYywgX2Q7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TcGVlY2hTeW50aGVzaXNBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgc3BlZWNoX3N5bnRoZXNpc18xID0gcmVxdWlyZShcIi4vc3BlZWNoX3N5bnRoZXNpc1wiKTtcbmV4cG9ydHMubWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlciA9IHNwZWVjaF9zeW50aGVzaXNfMS5tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyO1xudmFyIFNwZWVjaFN5bnRoZXNpc0FjdGlvbl8xID0gcmVxdWlyZShcIi4vU3BlZWNoU3ludGhlc2lzQWN0aW9uXCIpO1xuZXhwb3J0cy5TcGVlY2hTeW50aGVzaXNBY3Rpb24gPSBTcGVlY2hTeW50aGVzaXNBY3Rpb25fMS5TcGVlY2hTeW50aGVzaXNBY3Rpb247XG52YXIgc3BlZWNoX3JlY29nbml0aW9uXzEgPSByZXF1aXJlKFwiLi9zcGVlY2hfcmVjb2duaXRpb25cIik7XG5leHBvcnRzLm1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlciA9IHNwZWVjaF9yZWNvZ25pdGlvbl8xLm1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcjtcbnZhciBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbl8xID0gcmVxdWlyZShcIi4vU3BlZWNoUmVjb2duaXRpb25BY3Rpb25cIik7XG5leHBvcnRzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uID0gU3BlZWNoUmVjb2duaXRpb25BY3Rpb25fMS5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGZyb21FdmVudF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2Zyb21FdmVudFwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBSZWNvZ25pdGlvblNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZWNvZ25pdGlvblNvdXJjZShfcmVjb2duaXRpb24pIHtcbiAgICAgICAgdGhpcy5fcmVjb2duaXRpb24gPSBfcmVjb2duaXRpb247XG4gICAgfVxuICAgIFJlY29nbml0aW9uU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KGZyb21FdmVudF8xLmRlZmF1bHQodGhpcy5fcmVjb2duaXRpb24sIGV2ZW50TmFtZSkpO1xuICAgIH07XG4gICAgcmV0dXJuIFJlY29nbml0aW9uU291cmNlO1xufSgpKTtcbmZ1bmN0aW9uIG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcigpIHtcbiAgICB2YXIgcmVjb2duaXRpb24gPSBuZXcgd2Via2l0U3BlZWNoUmVjb2duaXRpb24oKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHNpbmskKSB7XG4gICAgICAgIHNpbmskLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgLy8gYXJyYXkgdmFsdWVzIGFyZSBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UgcHJvcGVydGllcyB0aGF0IGFyZSBub3RcbiAgICAgICAgICAgICAgICAvLyAgIGV2ZW50IGhhbmRsZXJzOyBzZWVcbiAgICAgICAgICAgICAgICAvLyAgIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hSZWNvZ25pdGlvblxuICAgICAgICAgICAgICAgIGlmICghYXJncykge1xuICAgICAgICAgICAgICAgICAgICByZWNvZ25pdGlvbi5hYm9ydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgWydsYW5nJywgJ2NvbnRpbnVvdXMnLCAnaW50ZXJpbVJlc3VsdHMnLCAnbWF4QWx0ZXJuYXRpdmVzJywgJ3NlcnZpY2VVUkknXS5tYXAoZnVuY3Rpb24gKGFyZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZyBpbiBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb2duaXRpb25bYXJnXSA9IGFyZ3NbYXJnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJlY29nbml0aW9uLnN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZWNvZ25pdGlvblNvdXJjZShyZWNvZ25pdGlvbik7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyID0gbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c3BlZWNoX3JlY29nbml0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGZyb21FdmVudF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2Zyb21FdmVudFwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBVdHRlcmFuY2VTb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVXR0ZXJhbmNlU291cmNlKF91dHRlcmFuY2UpIHtcbiAgICAgICAgdGhpcy5fdXR0ZXJhbmNlID0gX3V0dGVyYW5jZTtcbiAgICB9XG4gICAgVXR0ZXJhbmNlU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KGZyb21FdmVudF8xLmRlZmF1bHQodGhpcy5fdXR0ZXJhbmNlLCBldmVudE5hbWUpKTtcbiAgICB9O1xuICAgIHJldHVybiBVdHRlcmFuY2VTb3VyY2U7XG59KCkpO1xuZnVuY3Rpb24gbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlcigpIHtcbiAgICB2YXIgc3ludGhlc2lzID0gd2luZG93LnNwZWVjaFN5bnRoZXNpcztcbiAgICB2YXIgdXR0ZXJhbmNlID0gbmV3IFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSgpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoc2luayQpIHtcbiAgICAgICAgc2luayQuYWRkTGlzdGVuZXIoe1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAvLyBhcnJheSB2YWx1ZXMgYXJlIFNwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSBwcm9wZXJ0aWVzIHRoYXQgYXJlIG5vdFxuICAgICAgICAgICAgICAgIC8vICAgZXZlbnQgaGFuZGxlcnM7IHNlZVxuICAgICAgICAgICAgICAgIC8vICAgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZVxuICAgICAgICAgICAgICAgIGlmICghYXJncykge1xuICAgICAgICAgICAgICAgICAgICBzeW50aGVzaXMuY2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBbJ2xhbmcnLCAncGl0Y2gnLCAncmF0ZScsICd0ZXh0JywgJ3ZvaWNlJywgJ3ZvbHVtZSddLm1hcChmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJnIGluIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dHRlcmFuY2VbYXJnXSA9IGFyZ3NbYXJnXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHN5bnRoZXNpcy5zcGVhayh1dHRlcmFuY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXcgVXR0ZXJhbmNlU291cmNlKHV0dGVyYW5jZSk7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlciA9IG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zcGVlY2hfc3ludGhlc2lzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBpbnRlcm5hbHNfMSA9IHJlcXVpcmUoXCIuL2ludGVybmFsc1wiKTtcbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHByZXBhcmVzIHRoZSBDeWNsZSBhcHBsaWNhdGlvbiB0byBiZSBleGVjdXRlZC4gVGFrZXMgYSBgbWFpbmBcbiAqIGZ1bmN0aW9uIGFuZCBwcmVwYXJlcyB0byBjaXJjdWxhcmx5IGNvbm5lY3RzIGl0IHRvIHRoZSBnaXZlbiBjb2xsZWN0aW9uIG9mXG4gKiBkcml2ZXIgZnVuY3Rpb25zLiBBcyBhbiBvdXRwdXQsIGBzZXR1cCgpYCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRocmVlXG4gKiBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kIGBydW5gLiBPbmx5IHdoZW4gYHJ1bigpYCBpcyBjYWxsZWQgd2lsbFxuICogdGhlIGFwcGxpY2F0aW9uIGFjdHVhbGx5IGV4ZWN1dGUuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGBydW4oKWAgZm9yXG4gKiBtb3JlIGRldGFpbHMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtzZXR1cH0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgc2lua3MsIHJ1bn0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogY29uc3QgZGlzcG9zZSA9IHJ1bigpOyAvLyBFeGVjdXRlcyB0aGUgYXBwbGljYXRpb25cbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgc2lua3NgIGFuZFxuICogYHJ1bmAuIGBzb3VyY2VzYCBpcyB0aGUgY29sbGVjdGlvbiBvZiBkcml2ZXIgc291cmNlcywgYHNpbmtzYCBpcyB0aGVcbiAqIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNpbmtzLCB0aGVzZSBjYW4gYmUgdXNlZCBmb3IgZGVidWdnaW5nIG9yIHRlc3RpbmcuIGBydW5gXG4gKiBpcyB0aGUgZnVuY3Rpb24gdGhhdCBvbmNlIGNhbGxlZCB3aWxsIGV4ZWN1dGUgdGhlIGFwcGxpY2F0aW9uLlxuICogQGZ1bmN0aW9uIHNldHVwXG4gKi9cbmZ1bmN0aW9uIHNldHVwKG1haW4sIGRyaXZlcnMpIHtcbiAgICBpZiAodHlwZW9mIG1haW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIHRoZSAnbWFpbicgXCIgKyBcImZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMuXCIpO1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWxzXzEuaXNPYmplY3RFbXB0eShkcml2ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGF0IGxlYXN0IG9uZSBkcml2ZXIgZnVuY3Rpb24gZGVjbGFyZWQgYXMgYSBwcm9wZXJ0eS5cIik7XG4gICAgfVxuICAgIHZhciBlbmdpbmUgPSBzZXR1cFJldXNhYmxlKGRyaXZlcnMpO1xuICAgIHZhciBzaW5rcyA9IG1haW4oZW5naW5lLnNvdXJjZXMpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcyA9IHdpbmRvdy5DeWNsZWpzIHx8IHt9O1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcy5zaW5rcyA9IHNpbmtzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcnVuKCkge1xuICAgICAgICB2YXIgZGlzcG9zZVJ1biA9IGVuZ2luZS5ydW4oc2lua3MpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgICAgIGRpc3Bvc2VSdW4oKTtcbiAgICAgICAgICAgIGVuZ2luZS5kaXNwb3NlKCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNpbmtzOiBzaW5rcywgc291cmNlczogZW5naW5lLnNvdXJjZXMsIHJ1bjogX3J1biB9O1xufVxuZXhwb3J0cy5zZXR1cCA9IHNldHVwO1xuLyoqXG4gKiBBIHBhcnRpYWxseS1hcHBsaWVkIHZhcmlhbnQgb2Ygc2V0dXAoKSB3aGljaCBhY2NlcHRzIG9ubHkgdGhlIGRyaXZlcnMsIGFuZFxuICogYWxsb3dzIG1hbnkgYG1haW5gIGZ1bmN0aW9ucyB0byBleGVjdXRlIGFuZCByZXVzZSB0aGlzIHNhbWUgc2V0IG9mIGRyaXZlcnMuXG4gKlxuICogVGFrZXMgYW4gb2JqZWN0IHdpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBpbnB1dCwgYW5kIG91dHB1dHMgYW4gb2JqZWN0IHdoaWNoXG4gKiBjb250YWlucyB0aGUgZ2VuZXJhdGVkIHNvdXJjZXMgKGZyb20gdGhvc2UgZHJpdmVycykgYW5kIGEgYHJ1bmAgZnVuY3Rpb25cbiAqICh3aGljaCBpbiB0dXJuIGV4cGVjdHMgc2lua3MgYXMgYXJndW1lbnQpLiBUaGlzIGBydW5gIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWRcbiAqIG11bHRpcGxlIHRpbWVzIHdpdGggZGlmZmVyZW50IGFyZ3VtZW50cywgYW5kIGl0IHdpbGwgcmV1c2UgdGhlIGRyaXZlcnMgdGhhdFxuICogd2VyZSBwYXNzZWQgdG8gYHNldHVwUmV1c2FibGVgLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYGBganNcbiAqIGltcG9ydCB7c2V0dXBSZXVzYWJsZX0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgcnVuLCBkaXNwb3NlfSA9IHNldHVwUmV1c2FibGUoZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGNvbnN0IHNpbmtzID0gbWFpbihzb3VyY2VzKTtcbiAqIGNvbnN0IGRpc3Bvc2VSdW4gPSBydW4oc2lua3MpO1xuICogLy8gLi4uXG4gKiBkaXNwb3NlUnVuKCk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTsgLy8gZW5kcyB0aGUgcmV1c2FiaWxpdHkgb2YgZHJpdmVyc1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgcnVuYCBhbmRcbiAqIGBkaXNwb3NlYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgcnVuYCBpcyB0aGVcbiAqIGZ1bmN0aW9uIHRoYXQgb25jZSBjYWxsZWQgd2l0aCAnc2lua3MnIGFzIGFyZ3VtZW50LCB3aWxsIGV4ZWN1dGUgdGhlXG4gKiBhcHBsaWNhdGlvbiwgdHlpbmcgdG9nZXRoZXIgc291cmNlcyB3aXRoIHNpbmtzLiBgZGlzcG9zZWAgdGVybWluYXRlcyB0aGVcbiAqIHJldXNhYmxlIHJlc291cmNlcyB1c2VkIGJ5IHRoZSBkcml2ZXJzLiBOb3RlIGFsc28gdGhhdCBgcnVuYCByZXR1cm5zIGFcbiAqIGRpc3Bvc2UgZnVuY3Rpb24gd2hpY2ggdGVybWluYXRlcyByZXNvdXJjZXMgdGhhdCBhcmUgc3BlY2lmaWMgKG5vdCByZXVzYWJsZSlcbiAqIHRvIHRoYXQgcnVuLlxuICogQGZ1bmN0aW9uIHNldHVwUmV1c2FibGVcbiAqL1xuZnVuY3Rpb24gc2V0dXBSZXVzYWJsZShkcml2ZXJzKSB7XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBwcm9wZXJ0aWVzLlwiKTtcbiAgICB9XG4gICAgaWYgKGludGVybmFsc18xLmlzT2JqZWN0RW1wdHkoZHJpdmVycykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIHNpbmtQcm94aWVzID0gaW50ZXJuYWxzXzEubWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpO1xuICAgIHZhciByYXdTb3VyY2VzID0gaW50ZXJuYWxzXzEuY2FsbERyaXZlcnMoZHJpdmVycywgc2lua1Byb3hpZXMpO1xuICAgIHZhciBzb3VyY2VzID0gaW50ZXJuYWxzXzEuYWRhcHRTb3VyY2VzKHJhd1NvdXJjZXMpO1xuICAgIGZ1bmN0aW9uIF9ydW4oc2lua3MpIHtcbiAgICAgICAgcmV0dXJuIGludGVybmFsc18xLnJlcGxpY2F0ZU1hbnkoc2lua3MsIHNpbmtQcm94aWVzKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcG9zZUVuZ2luZSgpIHtcbiAgICAgICAgaW50ZXJuYWxzXzEuZGlzcG9zZVNvdXJjZXMoc291cmNlcyk7XG4gICAgICAgIGludGVybmFsc18xLmRpc3Bvc2VTaW5rUHJveGllcyhzaW5rUHJveGllcyk7XG4gICAgfVxuICAgIHJldHVybiB7IHNvdXJjZXM6IHNvdXJjZXMsIHJ1bjogX3J1biwgZGlzcG9zZTogZGlzcG9zZUVuZ2luZSB9O1xufVxuZXhwb3J0cy5zZXR1cFJldXNhYmxlID0gc2V0dXBSZXVzYWJsZTtcbi8qKlxuICogVGFrZXMgYSBgbWFpbmAgZnVuY3Rpb24gYW5kIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb25cbiAqIG9mIGRyaXZlciBmdW5jdGlvbnMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHJ1biBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IGRpc3Bvc2UgPSBydW4obWFpbiwgZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTtcbiAqIGBgYFxuICpcbiAqIFRoZSBgbWFpbmAgZnVuY3Rpb24gZXhwZWN0cyBhIGNvbGxlY3Rpb24gb2YgXCJzb3VyY2VcIiBzdHJlYW1zIChyZXR1cm5lZCBmcm9tXG4gKiBkcml2ZXJzKSBhcyBpbnB1dCwgYW5kIHNob3VsZCByZXR1cm4gYSBjb2xsZWN0aW9uIG9mIFwic2lua1wiIHN0cmVhbXMgKHRvIGJlXG4gKiBnaXZlbiB0byBkcml2ZXJzKS4gQSBcImNvbGxlY3Rpb24gb2Ygc3RyZWFtc1wiIGlzIGEgSmF2YVNjcmlwdCBvYmplY3Qgd2hlcmVcbiAqIGtleXMgbWF0Y2ggdGhlIGRyaXZlciBuYW1lcyByZWdpc3RlcmVkIGJ5IHRoZSBgZHJpdmVyc2Agb2JqZWN0LCBhbmQgdmFsdWVzXG4gKiBhcmUgdGhlIHN0cmVhbXMuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGVhY2ggZHJpdmVyIHRvIHNlZSBtb3JlXG4gKiBkZXRhaWxzIG9uIHdoYXQgdHlwZXMgb2Ygc291cmNlcyBpdCBvdXRwdXRzIGFuZCBzaW5rcyBpdCByZWNlaXZlcy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgZGlzcG9zZSBmdW5jdGlvbiwgdXNlZCB0byB0ZXJtaW5hdGUgdGhlIGV4ZWN1dGlvbiBvZiB0aGVcbiAqIEN5Y2xlLmpzIHByb2dyYW0sIGNsZWFuaW5nIHVwIHJlc291cmNlcyB1c2VkLlxuICogQGZ1bmN0aW9uIHJ1blxuICovXG5mdW5jdGlvbiBydW4obWFpbiwgZHJpdmVycykge1xuICAgIHZhciBwcm9ncmFtID0gc2V0dXAobWFpbiwgZHJpdmVycyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgIHdpbmRvd1snQ3ljbGVqc0RldlRvb2xfc3RhcnRHcmFwaFNlcmlhbGl6ZXInXSkge1xuICAgICAgICB3aW5kb3dbJ0N5Y2xlanNEZXZUb29sX3N0YXJ0R3JhcGhTZXJpYWxpemVyJ10ocHJvZ3JhbS5zaW5rcyk7XG4gICAgfVxuICAgIHJldHVybiBwcm9ncmFtLnJ1bigpO1xufVxuZXhwb3J0cy5ydW4gPSBydW47XG5leHBvcnRzLmRlZmF1bHQgPSBydW47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBxdWlja3Rhc2tfMSA9IHJlcXVpcmUoXCJxdWlja3Rhc2tcIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCIuL2FkYXB0XCIpO1xudmFyIHNjaGVkdWxlTWljcm90YXNrID0gcXVpY2t0YXNrXzEuZGVmYXVsdCgpO1xuZnVuY3Rpb24gbWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpIHtcbiAgICB2YXIgc2lua1Byb3hpZXMgPSB7fTtcbiAgICBmb3IgKHZhciBuYW1lXzEgaW4gZHJpdmVycykge1xuICAgICAgICBpZiAoZHJpdmVycy5oYXNPd25Qcm9wZXJ0eShuYW1lXzEpKSB7XG4gICAgICAgICAgICBzaW5rUHJveGllc1tuYW1lXzFdID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNpbmtQcm94aWVzO1xufVxuZXhwb3J0cy5tYWtlU2lua1Byb3hpZXMgPSBtYWtlU2lua1Byb3hpZXM7XG5mdW5jdGlvbiBjYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgbmFtZV8yIGluIGRyaXZlcnMpIHtcbiAgICAgICAgaWYgKGRyaXZlcnMuaGFzT3duUHJvcGVydHkobmFtZV8yKSkge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdID0gZHJpdmVyc1tuYW1lXzJdKHNpbmtQcm94aWVzW25hbWVfMl0sIG5hbWVfMik7XG4gICAgICAgICAgICBpZiAoc291cmNlc1tuYW1lXzJdICYmIHR5cGVvZiBzb3VyY2VzW25hbWVfMl0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdLl9pc0N5Y2xlU291cmNlID0gbmFtZV8yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5jYWxsRHJpdmVycyA9IGNhbGxEcml2ZXJzO1xuLy8gTk9URTogdGhpcyB3aWxsIG11dGF0ZSBgc291cmNlc2AuXG5mdW5jdGlvbiBhZGFwdFNvdXJjZXMoc291cmNlcykge1xuICAgIGZvciAodmFyIG5hbWVfMyBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KG5hbWVfMykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSAmJlxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZXNbbmFtZV8zXVsnc2hhbWVmdWxseVNlbmROZXh0J10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSA9IGFkYXB0XzEuYWRhcHQoc291cmNlc1tuYW1lXzNdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlcztcbn1cbmV4cG9ydHMuYWRhcHRTb3VyY2VzID0gYWRhcHRTb3VyY2VzO1xuZnVuY3Rpb24gcmVwbGljYXRlTWFueShzaW5rcywgc2lua1Byb3hpZXMpIHtcbiAgICB2YXIgc2lua05hbWVzID0gT2JqZWN0LmtleXMoc2lua3MpLmZpbHRlcihmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gISFzaW5rUHJveGllc1tuYW1lXTsgfSk7XG4gICAgdmFyIGJ1ZmZlcnMgPSB7fTtcbiAgICB2YXIgcmVwbGljYXRvcnMgPSB7fTtcbiAgICBzaW5rTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBidWZmZXJzW25hbWVdID0geyBfbjogW10sIF9lOiBbXSB9O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXSA9IHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uICh4KSB7IHJldHVybiBidWZmZXJzW25hbWVdLl9uLnB1c2goeCk7IH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikgeyByZXR1cm4gYnVmZmVyc1tuYW1lXS5fZS5wdXNoKGVycik7IH0sXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciBzdWJzY3JpcHRpb25zID0gc2lua05hbWVzLm1hcChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2lua3NbbmFtZV0pLnN1YnNjcmliZShyZXBsaWNhdG9yc1tuYW1lXSk7XG4gICAgfSk7XG4gICAgc2lua05hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVyID0gc2lua1Byb3hpZXNbbmFtZV07XG4gICAgICAgIHZhciBuZXh0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHNjaGVkdWxlTWljcm90YXNrKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGxpc3RlbmVyLl9uKHgpOyB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgc2NoZWR1bGVNaWNyb3Rhc2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIChjb25zb2xlLmVycm9yIHx8IGNvbnNvbGUubG9nKShlcnIpO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLl9lKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgYnVmZmVyc1tuYW1lXS5fbi5mb3JFYWNoKG5leHQpO1xuICAgICAgICBidWZmZXJzW25hbWVdLl9lLmZvckVhY2goZXJyb3IpO1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5uZXh0ID0gbmV4dDtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uZXJyb3IgPSBlcnJvcjtcbiAgICAgICAgLy8gYmVjYXVzZSBzaW5rLnN1YnNjcmliZShyZXBsaWNhdG9yKSBoYWQgbXV0YXRlZCByZXBsaWNhdG9yIHRvIGFkZFxuICAgICAgICAvLyBfbiwgX2UsIF9jLCB3ZSBtdXN0IGFsc28gdXBkYXRlIHRoZXNlOlxuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5fbiA9IG5leHQ7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLl9lID0gZXJyb3I7XG4gICAgfSk7XG4gICAgYnVmZmVycyA9IG51bGw7IC8vIGZyZWUgdXAgZm9yIEdDXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGRpc3Bvc2VSZXBsaWNhdGlvbigpIHtcbiAgICAgICAgc3Vic2NyaXB0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnVuc3Vic2NyaWJlKCk7IH0pO1xuICAgIH07XG59XG5leHBvcnRzLnJlcGxpY2F0ZU1hbnkgPSByZXBsaWNhdGVNYW55O1xuZnVuY3Rpb24gZGlzcG9zZVNpbmtQcm94aWVzKHNpbmtQcm94aWVzKSB7XG4gICAgT2JqZWN0LmtleXMoc2lua1Byb3hpZXMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIHNpbmtQcm94aWVzW25hbWVdLl9jKCk7IH0pO1xufVxuZXhwb3J0cy5kaXNwb3NlU2lua1Byb3hpZXMgPSBkaXNwb3NlU2lua1Byb3hpZXM7XG5mdW5jdGlvbiBkaXNwb3NlU291cmNlcyhzb3VyY2VzKSB7XG4gICAgZm9yICh2YXIgayBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KGspICYmXG4gICAgICAgICAgICBzb3VyY2VzW2tdICYmXG4gICAgICAgICAgICBzb3VyY2VzW2tdLmRpc3Bvc2UpIHtcbiAgICAgICAgICAgIHNvdXJjZXNba10uZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5kaXNwb3NlU291cmNlcyA9IGRpc3Bvc2VTb3VyY2VzO1xuZnVuY3Rpb24gaXNPYmplY3RFbXB0eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG59XG5leHBvcnRzLmlzT2JqZWN0RW1wdHkgPSBpc09iamVjdEVtcHR5O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW50ZXJuYWxzLmpzLm1hcCIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIG1pY3JvdGFzaygpIHtcbiAgICBpZiAodHlwZW9mIE11dGF0aW9uT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhciBub2RlXzEgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICAgIHZhciBxdWV1ZV8xID0gW107XG4gICAgICAgIHZhciBpXzEgPSAwO1xuICAgICAgICBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aGlsZSAocXVldWVfMS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZV8xLnNoaWZ0KCkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkub2JzZXJ2ZShub2RlXzEsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgcXVldWVfMS5wdXNoKGZuKTtcbiAgICAgICAgICAgIG5vZGVfMS5kYXRhID0gaV8xID0gMSAtIGlfMTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHNldEltbWVkaWF0ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQ7XG4gICAgfVxufVxuZXhwb3J0cy5kZWZhdWx0ID0gbWljcm90YXNrO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX3BvbnlmaWxsID0gcmVxdWlyZSgnLi9wb255ZmlsbC5qcycpO1xuXG52YXIgX3BvbnlmaWxsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3BvbnlmaWxsKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgcm9vdDsgLyogZ2xvYmFsIHdpbmRvdyAqL1xuXG5cbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHNlbGY7XG59IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBnbG9iYWw7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBtb2R1bGU7XG59IGVsc2Uge1xuICByb290ID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn1cblxudmFyIHJlc3VsdCA9ICgwLCBfcG9ueWZpbGwyWydkZWZhdWx0J10pKHJvb3QpO1xuZXhwb3J0c1snZGVmYXVsdCddID0gcmVzdWx0OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG5cdHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHN5bWJvbE9ic2VydmFibGVQb255ZmlsbDtcbmZ1bmN0aW9uIHN5bWJvbE9ic2VydmFibGVQb255ZmlsbChyb290KSB7XG5cdHZhciByZXN1bHQ7XG5cdHZhciBfU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cblx0aWYgKHR5cGVvZiBfU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0aWYgKF9TeW1ib2wub2JzZXJ2YWJsZSkge1xuXHRcdFx0cmVzdWx0ID0gX1N5bWJvbC5vYnNlcnZhYmxlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXN1bHQgPSBfU3ltYm9sKCdvYnNlcnZhYmxlJyk7XG5cdFx0XHRfU3ltYm9sLm9ic2VydmFibGUgPSByZXN1bHQ7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJlc3VsdCA9ICdAQG9ic2VydmFibGUnO1xuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwidmFyIG5leHRUaWNrID0gcmVxdWlyZSgncHJvY2Vzcy9icm93c2VyLmpzJykubmV4dFRpY2s7XG52YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaW1tZWRpYXRlSWRzID0ge307XG52YXIgbmV4dEltbWVkaWF0ZUlkID0gMDtcblxuLy8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcbn07XG5leHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xufTtcbmV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cbmV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHsgdGltZW91dC5jbG9zZSgpOyB9O1xuXG5mdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG4gIHRoaXMuX2lkID0gaWQ7XG4gIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xufVxuVGltZW91dC5wcm90b3R5cGUudW5yZWYgPSBUaW1lb3V0LnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHt9O1xuVGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xufTtcblxuLy8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5leHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcbn07XG5cbmV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcbn07XG5cbmV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcbiAgaWYgKG1zZWNzID49IDApIHtcbiAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG4gICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcbiAgICB9LCBtc2Vjcyk7XG4gIH1cbn07XG5cbi8vIFRoYXQncyBub3QgaG93IG5vZGUuanMgaW1wbGVtZW50cyBpdCBidXQgdGhlIGV4cG9zZWQgYXBpIGlzIHRoZSBzYW1lLlxuZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBmdW5jdGlvbihmbikge1xuICB2YXIgaWQgPSBuZXh0SW1tZWRpYXRlSWQrKztcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGZhbHNlIDogc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIGltbWVkaWF0ZUlkc1tpZF0gPSB0cnVlO1xuXG4gIG5leHRUaWNrKGZ1bmN0aW9uIG9uTmV4dFRpY2soKSB7XG4gICAgaWYgKGltbWVkaWF0ZUlkc1tpZF0pIHtcbiAgICAgIC8vIGZuLmNhbGwoKSBpcyBmYXN0ZXIgc28gd2Ugb3B0aW1pemUgZm9yIHRoZSBjb21tb24gdXNlLWNhc2VcbiAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vY2FsbC1hcHBseS1zZWd1XG4gICAgICBpZiAoYXJncykge1xuICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuLmNhbGwobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyBQcmV2ZW50IGlkcyBmcm9tIGxlYWtpbmdcbiAgICAgIGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUoaWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGlkO1xufTtcblxuZXhwb3J0cy5jbGVhckltbWVkaWF0ZSA9IHR5cGVvZiBjbGVhckltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gY2xlYXJJbW1lZGlhdGUgOiBmdW5jdGlvbihpZCkge1xuICBkZWxldGUgaW1tZWRpYXRlSWRzW2lkXTtcbn07IiwiaW1wb3J0IHtPcGVyYXRvciwgU3RyZWFtfSBmcm9tICcuLi9pbmRleCc7XG5cbmNsYXNzIERlbGF5T3BlcmF0b3I8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2RlbGF5JztcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+ID0gbnVsbCBhcyBhbnk7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGR0OiBudW1iZXIsXG4gICAgICAgICAgICAgIHB1YmxpYyBpbnM6IFN0cmVhbTxUPikge1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBudWxsIGFzIGFueTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB1Ll9uKHQpO1xuICAgICAgY2xlYXJJbnRlcnZhbChpZCk7XG4gICAgfSwgdGhpcy5kdCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHUuX2UoZXJyKTtcbiAgICAgIGNsZWFySW50ZXJ2YWwoaWQpO1xuICAgIH0sIHRoaXMuZHQpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdS5fYygpO1xuICAgICAgY2xlYXJJbnRlcnZhbChpZCk7XG4gICAgfSwgdGhpcy5kdCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEZWxheXMgcGVyaW9kaWMgZXZlbnRzIGJ5IGEgZ2l2ZW4gdGltZSBwZXJpb2QuXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogMS0tLS0yLS0zLS00LS0tLTV8XG4gKiAgICAgZGVsYXkoNjApXG4gKiAtLS0xLS0tLTItLTMtLTQtLS0tNXxcbiAqIGBgYFxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBmcm9tRGlhZ3JhbSBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21EaWFncmFtJ1xuICogaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknXG4gKlxuICogY29uc3Qgc3RyZWFtID0gZnJvbURpYWdyYW0oJzEtLS0tMi0tMy0tNC0tLS01fCcpXG4gKiAgLmNvbXBvc2UoZGVsYXkoNjApKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAxICAoYWZ0ZXIgNjAgbXMpXG4gKiA+IDIgIChhZnRlciAxNjAgbXMpXG4gKiA+IDMgIChhZnRlciAyMjAgbXMpXG4gKiA+IDQgIChhZnRlciAyODAgbXMpXG4gKiA+IDUgIChhZnRlciAzODAgbXMpXG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogQHBhcmFtIHtudW1iZXJ9IHBlcmlvZCBUaGUgYW1vdW50IG9mIHNpbGVuY2UgcmVxdWlyZWQgaW4gbWlsbGlzZWNvbmRzLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkZWxheTxUPihwZXJpb2Q6IG51bWJlcik6IChpbnM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFQ+IHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGRlbGF5T3BlcmF0b3IoaW5zOiBTdHJlYW08VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBEZWxheU9wZXJhdG9yKHBlcmlvZCwgaW5zKSk7XG4gIH07XG59XG4iLCIvLy8gPHJlZmVyZW5jZSB0eXBlcz1cIm5vZGVcIiAvPlxuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQge1N0cmVhbSwgSW50ZXJuYWxQcm9kdWNlciwgSW50ZXJuYWxMaXN0ZW5lcn0gZnJvbSAnLi4vaW5kZXgnO1xuXG5leHBvcnQgY2xhc3MgRE9NRXZlbnRQcm9kdWNlciBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8RXZlbnQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbUV2ZW50JztcbiAgcHJpdmF0ZSBsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lciB8IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBub2RlOiBFdmVudFRhcmdldCxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBldmVudFR5cGU6IHN0cmluZyxcbiAgICAgICAgICAgICAgcHJpdmF0ZSB1c2VDYXB0dXJlOiBib29sZWFuKSB7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPEV2ZW50Pikge1xuICAgIHRoaXMubGlzdGVuZXIgPSAoZSkgPT4gb3V0Ll9uKGUpO1xuICAgIHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKHRoaXMuZXZlbnRUeXBlLCB0aGlzLmxpc3RlbmVyLCB0aGlzLnVzZUNhcHR1cmUpO1xuICB9XG5cbiAgX3N0b3AoKSB7XG4gICAgdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5ldmVudFR5cGUsIHRoaXMubGlzdGVuZXIgYXMgYW55LCB0aGlzLnVzZUNhcHR1cmUpO1xuICAgIHRoaXMubGlzdGVuZXIgPSBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlRXZlbnRQcm9kdWNlciBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8YW55PiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21FdmVudCc7XG4gIHByaXZhdGUgbGlzdGVuZXI6IEZ1bmN0aW9uIHwgbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5vZGU6IEV2ZW50RW1pdHRlciwgcHJpdmF0ZSBldmVudE5hbWU6IHN0cmluZykgeyB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+KSB7XG4gICAgdGhpcy5saXN0ZW5lciA9ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiB7XG4gICAgICByZXR1cm4gKGFyZ3MubGVuZ3RoID4gMSkgPyBvdXQuX24oYXJncykgOiBvdXQuX24oYXJnc1swXSk7XG4gICAgfTtcbiAgICB0aGlzLm5vZGUuYWRkTGlzdGVuZXIodGhpcy5ldmVudE5hbWUsIHRoaXMubGlzdGVuZXIpO1xuICB9XG5cbiAgX3N0b3AoKSB7XG4gICAgdGhpcy5ub2RlLnJlbW92ZUxpc3RlbmVyKHRoaXMuZXZlbnROYW1lLCB0aGlzLmxpc3RlbmVyIGFzIGFueSk7XG4gICAgdGhpcy5saXN0ZW5lciA9IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNFbWl0dGVyKGVsZW1lbnQ6IGFueSk6IGVsZW1lbnQgaXMgRXZlbnRFbWl0dGVyIHtcbiAgcmV0dXJuIGVsZW1lbnQuZW1pdCAmJiBlbGVtZW50LmFkZExpc3RlbmVyO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBzdHJlYW0gYmFzZWQgb24gZWl0aGVyOlxuICogLSBET00gZXZlbnRzIHdpdGggdGhlIG5hbWUgYGV2ZW50TmFtZWAgZnJvbSBhIHByb3ZpZGVkIHRhcmdldCBub2RlXG4gKiAtIEV2ZW50cyB3aXRoIHRoZSBuYW1lIGBldmVudE5hbWVgIGZyb20gYSBwcm92aWRlZCBOb2RlSlMgRXZlbnRFbWl0dGVyXG4gKlxuICogV2hlbiBjcmVhdGluZyBhIHN0cmVhbSBmcm9tIEV2ZW50RW1pdHRlcnMsIGlmIHRoZSBzb3VyY2UgZXZlbnQgaGFzIG1vcmUgdGhhblxuICogb25lIGFyZ3VtZW50IGFsbCB0aGUgYXJndW1lbnRzIHdpbGwgYmUgYWdncmVnYXRlZCBpbnRvIGFuIGFycmF5IGluIHRoZVxuICogcmVzdWx0IHN0cmVhbS5cbiAqXG4gKiAoVGlwOiB3aGVuIHVzaW5nIHRoaXMgZmFjdG9yeSB3aXRoIFR5cGVTY3JpcHQsIHlvdSB3aWxsIG5lZWQgdHlwZXMgZm9yXG4gKiBOb2RlLmpzIGJlY2F1c2UgZnJvbUV2ZW50IGtub3dzIGhvdyB0byBoYW5kbGUgYm90aCBET00gZXZlbnRzIGFuZCBOb2RlLmpzXG4gKiBFdmVudEVtaXR0ZXIuIEp1c3QgaW5zdGFsbCBgQHR5cGVzL25vZGVgKVxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqICAgZnJvbUV2ZW50KGVsZW1lbnQsIGV2ZW50TmFtZSlcbiAqIC0tLWV2LS1ldi0tLS1ldi0tLS0tLS0tLS0tLS0tLVxuICogYGBgXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBmcm9tRXZlbnQgZnJvbSAneHN0cmVhbS9leHRyYS9mcm9tRXZlbnQnXG4gKlxuICogY29uc3Qgc3RyZWFtID0gZnJvbUV2ZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idXR0b24nKSwgJ2NsaWNrJylcbiAqICAgLm1hcFRvKCdCdXR0b24gY2xpY2tlZCEnKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAnQnV0dG9uIGNsaWNrZWQhJ1xuICogPiAnQnV0dG9uIGNsaWNrZWQhJ1xuICogPiAnQnV0dG9uIGNsaWNrZWQhJ1xuICogYGBgXG4gKlxuICogYGBganNcbiAqIGltcG9ydCBmcm9tRXZlbnQgZnJvbSAneHN0cmVhbS9leHRyYS9mcm9tRXZlbnQnXG4gKiBpbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJ1xuICpcbiAqIGNvbnN0IE15RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICogY29uc3Qgc3RyZWFtID0gZnJvbUV2ZW50KE15RW1pdHRlciwgJ2ZvbycpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKlxuICogTXlFbWl0dGVyLmVtaXQoJ2ZvbycsICdiYXInKVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAnYmFyJ1xuICogYGBgXG4gKlxuICogYGBganNcbiAqIGltcG9ydCBmcm9tRXZlbnQgZnJvbSAneHN0cmVhbS9leHRyYS9mcm9tRXZlbnQnXG4gKiBpbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJ1xuICpcbiAqIGNvbnN0IE15RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICogY29uc3Qgc3RyZWFtID0gZnJvbUV2ZW50KE15RW1pdHRlciwgJ2ZvbycpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKlxuICogTXlFbWl0dGVyLmVtaXQoJ2ZvbycsICdiYXInLCAnYmF6JywgJ2J1enonKVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiBbJ2JhcicsICdiYXonLCAnYnV6eiddXG4gKiBgYGBcbiAqXG4gKiBAZmFjdG9yeSB0cnVlXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEV2ZW50RW1pdHRlcn0gZWxlbWVudCBUaGUgZWxlbWVudCB1cG9uIHdoaWNoIHRvIGxpc3Rlbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgVGhlIG5hbWUgb2YgdGhlIGV2ZW50IGZvciB3aGljaCB0byBsaXN0ZW4uXG4gKiBAcGFyYW0ge2Jvb2xlYW4/fSB1c2VDYXB0dXJlIEFuIG9wdGlvbmFsIGJvb2xlYW4gdGhhdCBpbmRpY2F0ZXMgdGhhdCBldmVudHMgb2ZcbiAqIHRoaXMgdHlwZSB3aWxsIGJlIGRpc3BhdGNoZWQgdG8gdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXIgYmVmb3JlIGJlaW5nXG4gKiBkaXNwYXRjaGVkIHRvIGFueSBFdmVudFRhcmdldCBiZW5lYXRoIGl0IGluIHRoZSBET00gdHJlZS4gRGVmYXVsdHMgdG8gZmFsc2UuXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cblxuZnVuY3Rpb24gZnJvbUV2ZW50PFQgPSBhbnk+KGVsZW1lbnQ6IEV2ZW50RW1pdHRlciwgZXZlbnROYW1lOiBzdHJpbmcpOiBTdHJlYW08VD47XG5mdW5jdGlvbiBmcm9tRXZlbnQ8VCBleHRlbmRzIEV2ZW50ID0gRXZlbnQ+KGVsZW1lbnQ6IEV2ZW50VGFyZ2V0LCBldmVudE5hbWU6IHN0cmluZywgdXNlQ2FwdHVyZT86IGJvb2xlYW4pOiBTdHJlYW08VD47XG5cbmZ1bmN0aW9uIGZyb21FdmVudDxUID0gYW55PihlbGVtZW50OiBFdmVudEVtaXR0ZXIgfCBFdmVudFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VDYXB0dXJlOiBib29sZWFuID0gZmFsc2UpOiBTdHJlYW08VD4ge1xuICBpZiAoaXNFbWl0dGVyKGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IE5vZGVFdmVudFByb2R1Y2VyKGVsZW1lbnQsIGV2ZW50TmFtZSkpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBET01FdmVudFByb2R1Y2VyKGVsZW1lbnQsIGV2ZW50TmFtZSwgdXNlQ2FwdHVyZSkgYXMgYW55KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmcm9tRXZlbnQ7XG4iLCJpbXBvcnQgJCRvYnNlcnZhYmxlIGZyb20gJ3N5bWJvbC1vYnNlcnZhYmxlJztcblxuY29uc3QgTk8gPSB7fTtcbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5mdW5jdGlvbiBjcDxUPihhOiBBcnJheTxUPik6IEFycmF5PFQ+IHtcbiAgY29uc3QgbCA9IGEubGVuZ3RoO1xuICBjb25zdCBiID0gQXJyYXkobCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbDsgKytpKSBiW2ldID0gYVtpXTtcbiAgcmV0dXJuIGI7XG59XG5cbmZ1bmN0aW9uIGFuZDxUPihmMTogKHQ6IFQpID0+IGJvb2xlYW4sIGYyOiAodDogVCkgPT4gYm9vbGVhbik6ICh0OiBUKSA9PiBib29sZWFuIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuZEZuKHQ6IFQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZjEodCkgJiYgZjIodCk7XG4gIH07XG59XG5cbmludGVyZmFjZSBGQ29udGFpbmVyPFQsIFI+IHtcbiAgZih0OiBUKTogUjtcbn1cblxuZnVuY3Rpb24gX3RyeTxULCBSPihjOiBGQ29udGFpbmVyPFQsIFI+LCB0OiBULCB1OiBTdHJlYW08YW55Pik6IFIgfCB7fSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGMuZih0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHUuX2UoZSk7XG4gICAgcmV0dXJuIE5PO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIF9uOiAodjogVCkgPT4gdm9pZDtcbiAgX2U6IChlcnI6IGFueSkgPT4gdm9pZDtcbiAgX2M6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IE5PX0lMOiBJbnRlcm5hbExpc3RlbmVyPGFueT4gPSB7XG4gIF9uOiBub29wLFxuICBfZTogbm9vcCxcbiAgX2M6IG5vb3AsXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBfc3RhcnQobGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkO1xuICBfc3RvcDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPdXRTZW5kZXI8VD4ge1xuICBvdXQ6IFN0cmVhbTxUPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPcGVyYXRvcjxULCBSPiBleHRlbmRzIEludGVybmFsUHJvZHVjZXI8Uj4sIEludGVybmFsTGlzdGVuZXI8VD4sIE91dFNlbmRlcjxSPiB7XG4gIHR5cGU6IHN0cmluZztcbiAgaW5zOiBTdHJlYW08VD47XG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWdncmVnYXRvcjxULCBVPiBleHRlbmRzIEludGVybmFsUHJvZHVjZXI8VT4sIE91dFNlbmRlcjxVPiB7XG4gIHR5cGU6IHN0cmluZztcbiAgaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+O1xuICBfc3RhcnQob3V0OiBTdHJlYW08VT4pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByb2R1Y2VyPFQ+IHtcbiAgc3RhcnQ6IChsaXN0ZW5lcjogTGlzdGVuZXI8VD4pID0+IHZvaWQ7XG4gIHN0b3A6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdGVuZXI8VD4ge1xuICBuZXh0OiAoeDogVCkgPT4gdm9pZDtcbiAgZXJyb3I6IChlcnI6IGFueSkgPT4gdm9pZDtcbiAgY29tcGxldGU6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3Vic2NyaXB0aW9uIHtcbiAgdW5zdWJzY3JpYmUoKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPYnNlcnZhYmxlPFQ+IHtcbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBMaXN0ZW5lcjxUPik6IFN1YnNjcmlwdGlvbjtcbn1cblxuLy8gbXV0YXRlcyB0aGUgaW5wdXRcbmZ1bmN0aW9uIGludGVybmFsaXplUHJvZHVjZXI8VD4ocHJvZHVjZXI6IFByb2R1Y2VyPFQ+ICYgUGFydGlhbDxJbnRlcm5hbFByb2R1Y2VyPFQ+Pikge1xuICBwcm9kdWNlci5fc3RhcnQgPSBmdW5jdGlvbiBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4gJiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pikge1xuICAgIGlsLm5leHQgPSBpbC5fbjtcbiAgICBpbC5lcnJvciA9IGlsLl9lO1xuICAgIGlsLmNvbXBsZXRlID0gaWwuX2M7XG4gICAgdGhpcy5zdGFydChpbCk7XG4gIH07XG4gIHByb2R1Y2VyLl9zdG9wID0gcHJvZHVjZXIuc3RvcDtcbn1cblxuY2xhc3MgU3RyZWFtU3ViPFQ+IGltcGxlbWVudHMgU3Vic2NyaXB0aW9uIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfc3RyZWFtOiBTdHJlYW08VD4sIHByaXZhdGUgX2xpc3RlbmVyOiBJbnRlcm5hbExpc3RlbmVyPFQ+KSB7fVxuXG4gIHVuc3Vic2NyaWJlKCk6IHZvaWQge1xuICAgIHRoaXMuX3N0cmVhbS5fcmVtb3ZlKHRoaXMuX2xpc3RlbmVyKTtcbiAgfVxufVxuXG5jbGFzcyBPYnNlcnZlcjxUPiBpbXBsZW1lbnRzIExpc3RlbmVyPFQ+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pIHt9XG5cbiAgbmV4dCh2YWx1ZTogVCkge1xuICAgIHRoaXMuX2xpc3RlbmVyLl9uKHZhbHVlKTtcbiAgfVxuXG4gIGVycm9yKGVycjogYW55KSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX2UoZXJyKTtcbiAgfVxuXG4gIGNvbXBsZXRlKCkge1xuICAgIHRoaXMuX2xpc3RlbmVyLl9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRnJvbU9ic2VydmFibGU8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbU9ic2VydmFibGUnO1xuICBwdWJsaWMgaW5zOiBPYnNlcnZhYmxlPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgYWN0aXZlOiBib29sZWFuO1xuICBwcml2YXRlIF9zdWI6IFN1YnNjcmlwdGlvbiB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBvYnNlcnZhYmxlO1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5fc3ViID0gdGhpcy5pbnMuc3Vic2NyaWJlKG5ldyBPYnNlcnZlcihvdXQpKTtcbiAgICBpZiAoIXRoaXMuYWN0aXZlKSB0aGlzLl9zdWIudW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIF9zdG9wKCkge1xuICAgIGlmICh0aGlzLl9zdWIpIHRoaXMuX3N1Yi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZXJnZVNpZ25hdHVyZSB7XG4gICgpOiBTdHJlYW08YW55PjtcbiAgPFQxPihzMTogU3RyZWFtPFQxPik6IFN0cmVhbTxUMT47XG4gIDxUMSwgVDI+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+KTogU3RyZWFtPFQxIHwgVDI+O1xuICA8VDEsIFQyLCBUMz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4pOiBTdHJlYW08VDEgfCBUMiB8IFQzPjtcbiAgPFQxLCBUMiwgVDMsIFQ0PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUND47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDU+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDU+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNz47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDg+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDg+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOCB8IFQ5PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4sXG4gICAgczEwOiBTdHJlYW08VDEwPik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4IHwgVDkgfCBUMTA+O1xuICA8VD4oLi4uc3RyZWFtOiBBcnJheTxTdHJlYW08VD4+KTogU3RyZWFtPFQ+O1xufVxuXG5jbGFzcyBNZXJnZTxUPiBpbXBsZW1lbnRzIEFnZ3JlZ2F0b3I8VCwgVD4sIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdtZXJnZSc7XG4gIHB1YmxpYyBpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBhYzogbnVtYmVyOyAvLyBhYyBpcyBhY3RpdmVDb3VudFxuXG4gIGNvbnN0cnVjdG9yKGluc0FycjogQXJyYXk8U3RyZWFtPFQ+Pikge1xuICAgIHRoaXMuaW5zQXJyID0gaW5zQXJyO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuYWMgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IEwgPSBzLmxlbmd0aDtcbiAgICB0aGlzLmFjID0gTDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgc1tpXS5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IEwgPSBzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgc1tpXS5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgaWYgKC0tdGhpcy5hYyA8PSAwKSB7XG4gICAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21iaW5lU2lnbmF0dXJlIHtcbiAgKCk6IFN0cmVhbTxBcnJheTxhbnk+PjtcbiAgPFQxPihzMTogU3RyZWFtPFQxPik6IFN0cmVhbTxbVDFdPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiBTdHJlYW08W1QxLCBUMl0+O1xuICA8VDEsIFQyLCBUMz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4pOiBTdHJlYW08W1QxLCBUMiwgVDNdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDRdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDZdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDddPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDldPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4sXG4gICAgczEwOiBTdHJlYW08VDEwPik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwXT47XG4gICguLi5zdHJlYW06IEFycmF5PFN0cmVhbTxhbnk+Pik6IFN0cmVhbTxBcnJheTxhbnk+Pjtcbn1cblxuY2xhc3MgQ29tYmluZUxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPEFycmF5PFQ+PiB7XG4gIHByaXZhdGUgaTogbnVtYmVyO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08QXJyYXk8VD4+O1xuICBwcml2YXRlIHA6IENvbWJpbmU8VD47XG5cbiAgY29uc3RydWN0b3IoaTogbnVtYmVyLCBvdXQ6IFN0cmVhbTxBcnJheTxUPj4sIHA6IENvbWJpbmU8VD4pIHtcbiAgICB0aGlzLmkgPSBpO1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMucCA9IHA7XG4gICAgcC5pbHMucHVzaCh0aGlzKTtcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wLCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIGlmIChwLnVwKHQsIHRoaXMuaSkpIHtcbiAgICAgIGNvbnN0IGEgPSBwLnZhbHM7XG4gICAgICBjb25zdCBsID0gYS5sZW5ndGg7XG4gICAgICBjb25zdCBiID0gQXJyYXkobCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGw7ICsraSkgYltpXSA9IGFbaV07XG4gICAgICBvdXQuX24oYik7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIG91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMucDtcbiAgICBpZiAocC5vdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKC0tcC5OYyA9PT0gMCkgcC5vdXQuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBDb21iaW5lPFI+IGltcGxlbWVudHMgQWdncmVnYXRvcjxhbnksIEFycmF5PFI+PiB7XG4gIHB1YmxpYyB0eXBlID0gJ2NvbWJpbmUnO1xuICBwdWJsaWMgaW5zQXJyOiBBcnJheTxTdHJlYW08YW55Pj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxSPj47XG4gIHB1YmxpYyBpbHM6IEFycmF5PENvbWJpbmVMaXN0ZW5lcjxhbnk+PjtcbiAgcHVibGljIE5jOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqYypvbXBsZXRlXG4gIHB1YmxpYyBObjogbnVtYmVyOyAvLyAqTip1bWJlciBvZiBzdHJlYW1zIHN0aWxsIHRvIHNlbmQgKm4qZXh0XG4gIHB1YmxpYyB2YWxzOiBBcnJheTxSPjtcblxuICBjb25zdHJ1Y3RvcihpbnNBcnI6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHRoaXMuaW5zQXJyID0gaW5zQXJyO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PFI+PjtcbiAgICB0aGlzLmlscyA9IFtdO1xuICAgIHRoaXMuTmMgPSB0aGlzLk5uID0gMDtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgfVxuXG4gIHVwKHQ6IGFueSwgaTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdiA9IHRoaXMudmFsc1tpXTtcbiAgICBjb25zdCBObiA9ICF0aGlzLk5uID8gMCA6IHYgPT09IE5PID8gLS10aGlzLk5uIDogdGhpcy5ObjtcbiAgICB0aGlzLnZhbHNbaV0gPSB0O1xuICAgIHJldHVybiBObiA9PT0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxBcnJheTxSPj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgbiA9IHRoaXMuTmMgPSB0aGlzLk5uID0gcy5sZW5ndGg7XG4gICAgY29uc3QgdmFscyA9IHRoaXMudmFscyA9IG5ldyBBcnJheShuKTtcbiAgICBpZiAobiA9PT0gMCkge1xuICAgICAgb3V0Ll9uKFtdKTtcbiAgICAgIG91dC5fYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICB2YWxzW2ldID0gTk87XG4gICAgICAgIHNbaV0uX2FkZChuZXcgQ29tYmluZUxpc3RlbmVyKGksIG91dCwgdGhpcykpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBuID0gcy5sZW5ndGg7XG4gICAgY29uc3QgaWxzID0gdGhpcy5pbHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHNbaV0uX3JlbW92ZShpbHNbaV0pO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PFI+PjtcbiAgICB0aGlzLmlscyA9IFtdO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG59XG5cbmNsYXNzIEZyb21BcnJheTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tQXJyYXknO1xuICBwdWJsaWMgYTogQXJyYXk8VD47XG5cbiAgY29uc3RydWN0b3IoYTogQXJyYXk8VD4pIHtcbiAgICB0aGlzLmEgPSBhO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLmE7XG4gICAgZm9yIChsZXQgaSA9IDAsIG4gPSBhLmxlbmd0aDsgaSA8IG47IGkrKykgb3V0Ll9uKGFbaV0pO1xuICAgIG91dC5fYygpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gIH1cbn1cblxuY2xhc3MgRnJvbVByb21pc2U8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbVByb21pc2UnO1xuICBwdWJsaWMgb246IGJvb2xlYW47XG4gIHB1YmxpYyBwOiBQcm9taXNlTGlrZTxUPjtcblxuICBjb25zdHJ1Y3RvcihwOiBQcm9taXNlTGlrZTxUPikge1xuICAgIHRoaXMub24gPSBmYWxzZTtcbiAgICB0aGlzLnAgPSBwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHByb2QgPSB0aGlzO1xuICAgIHRoaXMub24gPSB0cnVlO1xuICAgIHRoaXMucC50aGVuKFxuICAgICAgKHY6IFQpID0+IHtcbiAgICAgICAgaWYgKHByb2Qub24pIHtcbiAgICAgICAgICBvdXQuX24odik7XG4gICAgICAgICAgb3V0Ll9jKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAoZTogYW55KSA9PiB7XG4gICAgICAgIG91dC5fZShlKTtcbiAgICAgIH0sXG4gICAgKS50aGVuKG5vb3AsIChlcnI6IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7IHRocm93IGVycjsgfSk7XG4gICAgfSk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLm9uID0gZmFsc2U7XG4gIH1cbn1cblxuY2xhc3MgUGVyaW9kaWMgaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPG51bWJlcj4ge1xuICBwdWJsaWMgdHlwZSA9ICdwZXJpb2RpYyc7XG4gIHB1YmxpYyBwZXJpb2Q6IG51bWJlcjtcbiAgcHJpdmF0ZSBpbnRlcnZhbElEOiBhbnk7XG4gIHByaXZhdGUgaTogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKHBlcmlvZDogbnVtYmVyKSB7XG4gICAgdGhpcy5wZXJpb2QgPSBwZXJpb2Q7XG4gICAgdGhpcy5pbnRlcnZhbElEID0gLTE7XG4gICAgdGhpcy5pID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8bnVtYmVyPik6IHZvaWQge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIGludGVydmFsSGFuZGxlcigpIHsgb3V0Ll9uKHNlbGYuaSsrKTsgfVxuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IHNldEludGVydmFsKGludGVydmFsSGFuZGxlciwgdGhpcy5wZXJpb2QpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaW50ZXJ2YWxJRCAhPT0gLTEpIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbElEKTtcbiAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICB0aGlzLmkgPSAwO1xuICB9XG59XG5cbmNsYXNzIERlYnVnPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkZWJ1Zyc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIHM6ICh0OiBUKSA9PiBhbnk7IC8vIHNweVxuICBwcml2YXRlIGw6IHN0cmluZzsgLy8gbGFiZWxcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPik7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogKHQ6IFQpID0+IGFueSk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5zID0gbm9vcDtcbiAgICB0aGlzLmwgPSAnJztcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHRoaXMubCA9IGFyZzsgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJykgdGhpcy5zID0gYXJnO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHMgPSB0aGlzLnMsIGwgPSB0aGlzLmw7XG4gICAgaWYgKHMgIT09IG5vb3ApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHModCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHUuX2UoZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChsKSBjb25zb2xlLmxvZyhsICsgJzonLCB0KTsgZWxzZSBjb25zb2xlLmxvZyh0KTtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBEcm9wPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkcm9wJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBtYXg6IG51bWJlcjtcbiAgcHJpdmF0ZSBkcm9wcGVkOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IobWF4OiBudW1iZXIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5tYXggPSBtYXg7XG4gICAgdGhpcy5kcm9wcGVkID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuZHJvcHBlZCA9IDA7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmRyb3BwZWQrKyA+PSB0aGlzLm1heCkgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRW5kV2hlbkxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxhbnk+IHtcbiAgcHJpdmF0ZSBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcDogRW5kV2hlbjxUPjtcblxuICBjb25zdHJ1Y3RvcihvdXQ6IFN0cmVhbTxUPiwgb3A6IEVuZFdoZW48VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wID0gb3A7XG4gIH1cblxuICBfbigpIHtcbiAgICB0aGlzLm9wLmVuZCgpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICB0aGlzLm91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcC5lbmQoKTtcbiAgfVxufVxuXG5jbGFzcyBFbmRXaGVuPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdlbmRXaGVuJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBvOiBTdHJlYW08YW55PjsgLy8gbyA9IG90aGVyXG4gIHByaXZhdGUgb2lsOiBJbnRlcm5hbExpc3RlbmVyPGFueT47IC8vIG9pbCA9IG90aGVyIEludGVybmFsTGlzdGVuZXJcblxuICBjb25zdHJ1Y3RvcihvOiBTdHJlYW08YW55PiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm8gPSBvO1xuICAgIHRoaXMub2lsID0gTk9fSUw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm8uX2FkZCh0aGlzLm9pbCA9IG5ldyBFbmRXaGVuTGlzdGVuZXIob3V0LCB0aGlzKSk7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vLl9yZW1vdmUodGhpcy5vaWwpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub2lsID0gTk9fSUw7XG4gIH1cblxuICBlbmQoKTogdm9pZCB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMuZW5kKCk7XG4gIH1cbn1cblxuY2xhc3MgRmlsdGVyPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmaWx0ZXInO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKHBhc3NlczogKHQ6IFQpID0+IGJvb2xlYW4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5mID0gcGFzc2VzO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTyB8fCAhcikgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIEZsYXR0ZW5MaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwcml2YXRlIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wOiBGbGF0dGVuPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKG91dDogU3RyZWFtPFQ+LCBvcDogRmxhdHRlbjxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3AgPSBvcDtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICB0aGlzLm91dC5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgdGhpcy5vdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3AuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcC5sZXNzKCk7XG4gIH1cbn1cblxuY2xhc3MgRmxhdHRlbjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFN0cmVhbTxUPiwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmbGF0dGVuJztcbiAgcHVibGljIGluczogU3RyZWFtPFN0cmVhbTxUPj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcGVuOiBib29sZWFuO1xuICBwdWJsaWMgaW5uZXI6IFN0cmVhbTxUPjsgLy8gQ3VycmVudCBpbm5lciBTdHJlYW1cbiAgcHJpdmF0ZSBpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPjsgLy8gQ3VycmVudCBpbm5lciBJbnRlcm5hbExpc3RlbmVyXG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08U3RyZWFtPFQ+Pikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5pbCA9IE5PX0lMO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIGlmICh0aGlzLmlubmVyICE9PSBOTykgdGhpcy5pbm5lci5fcmVtb3ZlKHRoaXMuaWwpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gIH1cblxuICBsZXNzKCk6IHZvaWQge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAoIXRoaXMub3BlbiAmJiB0aGlzLmlubmVyID09PSBOTykgdS5fYygpO1xuICB9XG5cbiAgX24oczogU3RyZWFtPFQ+KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHtpbm5lciwgaWx9ID0gdGhpcztcbiAgICBpZiAoaW5uZXIgIT09IE5PICYmIGlsICE9PSBOT19JTCkgaW5uZXIuX3JlbW92ZShpbCk7XG4gICAgKHRoaXMuaW5uZXIgPSBzKS5fYWRkKHRoaXMuaWwgPSBuZXcgRmxhdHRlbkxpc3RlbmVyKHUsIHRoaXMpKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3BlbiA9IGZhbHNlO1xuICAgIHRoaXMubGVzcygpO1xuICB9XG59XG5cbmNsYXNzIEZvbGQ8VCwgUj4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBSPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZvbGQnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxSPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBSO1xuICBwdWJsaWMgc2VlZDogUjtcbiAgcHJpdmF0ZSBhY2M6IFI7IC8vIGluaXRpYWxpemVkIGFzIHNlZWRcblxuICBjb25zdHJ1Y3RvcihmOiAoYWNjOiBSLCB0OiBUKSA9PiBSLCBzZWVkOiBSLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuZiA9ICh0OiBUKSA9PiBmKHRoaXMuYWNjLCB0KTtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZCA9IHNlZWQ7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZDtcbiAgICBvdXQuX24odGhpcy5hY2MpO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHRoaXMuYWNjID0gciBhcyBSKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgTGFzdDxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnbGFzdCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGhhczogYm9vbGVhbjtcbiAgcHJpdmF0ZSB2YWw6IFQ7XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmhhcyA9IGZhbHNlO1xuICAgIHRoaXMudmFsID0gTk8gYXMgVDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy52YWwgPSBOTyBhcyBUO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIHRoaXMuaGFzID0gdHJ1ZTtcbiAgICB0aGlzLnZhbCA9IHQ7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaGFzKSB7XG4gICAgICB1Ll9uKHRoaXMudmFsKTtcbiAgICAgIHUuX2MoKTtcbiAgICB9IGVsc2UgdS5fZShuZXcgRXJyb3IoJ2xhc3QoKSBmYWlsZWQgYmVjYXVzZSBpbnB1dCBzdHJlYW0gY29tcGxldGVkJykpO1xuICB9XG59XG5cbmNsYXNzIE1hcE9wPFQsIFI+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgUj4ge1xuICBwdWJsaWMgdHlwZSA9ICdtYXAnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxSPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBSO1xuXG4gIGNvbnN0cnVjdG9yKHByb2plY3Q6ICh0OiBUKSA9PiBSLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuZiA9IHByb2plY3Q7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbihyIGFzIFIpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBSZW1lbWJlcjxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdyZW1lbWJlcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKG91dCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMub3V0KTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxufVxuXG5jbGFzcyBSZXBsYWNlRXJyb3I8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3JlcGxhY2VFcnJvcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgZjogKGVycjogYW55KSA9PiBTdHJlYW08VD47XG5cbiAgY29uc3RydWN0b3IocmVwbGFjZXI6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+LCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuZiA9IHJlcGxhY2VyO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICh0aGlzLmlucyA9IHRoaXMuZihlcnIpKS5fYWRkKHRoaXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHUuX2UoZSk7XG4gICAgfVxuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBTdGFydFdpdGg8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnc3RhcnRXaXRoJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyB2YWw6IFQ7XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIHZhbDogVCkge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMudmFsID0gdmFsO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vdXQuX24odGhpcy52YWwpO1xuICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG59XG5cbmNsYXNzIFRha2U8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3Rha2UnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG1heDogbnVtYmVyO1xuICBwcml2YXRlIHRha2VuOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IobWF4OiBudW1iZXIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5tYXggPSBtYXg7XG4gICAgdGhpcy50YWtlbiA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLnRha2VuID0gMDtcbiAgICBpZiAodGhpcy5tYXggPD0gMCkgb3V0Ll9jKCk7IGVsc2UgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IG0gPSArK3RoaXMudGFrZW47XG4gICAgaWYgKG0gPCB0aGlzLm1heCkgdS5fbih0KTsgZWxzZSBpZiAobSA9PT0gdGhpcy5tYXgpIHtcbiAgICAgIHUuX24odCk7XG4gICAgICB1Ll9jKCk7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3RyZWFtPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHB1YmxpYyBfcHJvZDogSW50ZXJuYWxQcm9kdWNlcjxUPjtcbiAgcHJvdGVjdGVkIF9pbHM6IEFycmF5PEludGVybmFsTGlzdGVuZXI8VD4+OyAvLyAnaWxzJyA9IEludGVybmFsIGxpc3RlbmVyc1xuICBwcm90ZWN0ZWQgX3N0b3BJRDogYW55O1xuICBwcm90ZWN0ZWQgX2RsOiBJbnRlcm5hbExpc3RlbmVyPFQ+OyAvLyB0aGUgZGVidWcgbGlzdGVuZXJcbiAgcHJvdGVjdGVkIF9kOiBib29sZWFuOyAvLyBmbGFnIGluZGljYXRpbmcgdGhlIGV4aXN0ZW5jZSBvZiB0aGUgZGVidWcgbGlzdGVuZXJcbiAgcHJvdGVjdGVkIF90YXJnZXQ6IFN0cmVhbTxUPjsgLy8gaW1pdGF0aW9uIHRhcmdldCBpZiB0aGlzIFN0cmVhbSB3aWxsIGltaXRhdGVcbiAgcHJvdGVjdGVkIF9lcnI6IGFueTtcblxuICBjb25zdHJ1Y3Rvcihwcm9kdWNlcj86IEludGVybmFsUHJvZHVjZXI8VD4pIHtcbiAgICB0aGlzLl9wcm9kID0gcHJvZHVjZXIgfHwgTk8gYXMgSW50ZXJuYWxQcm9kdWNlcjxUPjtcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB0aGlzLl9kbCA9IE5PIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgdGhpcy5fZCA9IGZhbHNlO1xuICAgIHRoaXMuX3RhcmdldCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX24odCk7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fbih0KTsgZWxzZSBpZiAoTCA9PSAwKSByZXR1cm47IGVsc2Uge1xuICAgICAgY29uc3QgYiA9IGNwKGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIGJbaV0uX24odCk7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZXJyICE9PSBOTykgcmV0dXJuO1xuICAgIHRoaXMuX2VyciA9IGVycjtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICB0aGlzLl94KCk7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9lKGVycik7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fZShlcnIpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fZShlcnIpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2QgJiYgTCA9PSAwKSB0aHJvdyB0aGlzLl9lcnI7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICB0aGlzLl94KCk7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9jKCk7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fYygpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fYygpO1xuICAgIH1cbiAgfVxuXG4gIF94KCk6IHZvaWQgeyAvLyB0ZWFyIGRvd24gbG9naWMsIGFmdGVyIGVycm9yIG9yIGNvbXBsZXRlXG4gICAgaWYgKHRoaXMuX2lscy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBpZiAodGhpcy5fcHJvZCAhPT0gTk8pIHRoaXMuX3Byb2QuX3N0b3AoKTtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgfVxuXG4gIF9zdG9wTm93KCkge1xuICAgIC8vIFdBUk5JTkc6IGNvZGUgdGhhdCBjYWxscyB0aGlzIG1ldGhvZCBzaG91bGRcbiAgICAvLyBmaXJzdCBjaGVjayBpZiB0aGlzLl9wcm9kIGlzIHZhbGlkIChub3QgYE5PYClcbiAgICB0aGlzLl9wcm9kLl9zdG9wKCk7XG4gICAgdGhpcy5fZXJyID0gTk87XG4gICAgdGhpcy5fc3RvcElEID0gTk87XG4gIH1cblxuICBfYWRkKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9hZGQoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgYS5wdXNoKGlsKTtcbiAgICBpZiAoYS5sZW5ndGggPiAxKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX3N0b3BJRCAhPT0gTk8pIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zdG9wSUQpO1xuICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgICAgaWYgKHAgIT09IE5PKSBwLl9zdGFydCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBfcmVtb3ZlKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9yZW1vdmUoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgaSA9IGEuaW5kZXhPZihpbCk7XG4gICAgaWYgKGkgPiAtMSkge1xuICAgICAgYS5zcGxpY2UoaSwgMSk7XG4gICAgICBpZiAodGhpcy5fcHJvZCAhPT0gTk8gJiYgYS5sZW5ndGggPD0gMCkge1xuICAgICAgICB0aGlzLl9lcnIgPSBOTztcbiAgICAgICAgdGhpcy5fc3RvcElEID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9zdG9wTm93KCkpO1xuICAgICAgfSBlbHNlIGlmIChhLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB0aGlzLl9wcnVuZUN5Y2xlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIGFsbCBwYXRocyBzdGVtbWluZyBmcm9tIGB0aGlzYCBzdHJlYW0gZXZlbnR1YWxseSBlbmQgYXQgYHRoaXNgXG4gIC8vIHN0cmVhbSwgdGhlbiB3ZSByZW1vdmUgdGhlIHNpbmdsZSBsaXN0ZW5lciBvZiBgdGhpc2Agc3RyZWFtLCB0b1xuICAvLyBmb3JjZSBpdCB0byBlbmQgaXRzIGV4ZWN1dGlvbiBhbmQgZGlzcG9zZSByZXNvdXJjZXMuIFRoaXMgbWV0aG9kXG4gIC8vIGFzc3VtZXMgYXMgYSBwcmVjb25kaXRpb24gdGhhdCB0aGlzLl9pbHMgaGFzIGp1c3Qgb25lIGxpc3RlbmVyLlxuICBfcHJ1bmVDeWNsZXMoKSB7XG4gICAgaWYgKHRoaXMuX2hhc05vU2lua3ModGhpcywgW10pKSB0aGlzLl9yZW1vdmUodGhpcy5faWxzWzBdKTtcbiAgfVxuXG4gIC8vIENoZWNrcyB3aGV0aGVyICp0aGVyZSBpcyBubyogcGF0aCBzdGFydGluZyBmcm9tIGB4YCB0aGF0IGxlYWRzIHRvIGFuIGVuZFxuICAvLyBsaXN0ZW5lciAoc2luaykgaW4gdGhlIHN0cmVhbSBncmFwaCwgZm9sbG93aW5nIGVkZ2VzIEEtPkIgd2hlcmUgQiBpcyBhXG4gIC8vIGxpc3RlbmVyIG9mIEEuIFRoaXMgbWVhbnMgdGhlc2UgcGF0aHMgY29uc3RpdHV0ZSBhIGN5Y2xlIHNvbWVob3cuIElzIGdpdmVuXG4gIC8vIGEgdHJhY2Ugb2YgYWxsIHZpc2l0ZWQgbm9kZXMgc28gZmFyLlxuICBfaGFzTm9TaW5rcyh4OiBJbnRlcm5hbExpc3RlbmVyPGFueT4sIHRyYWNlOiBBcnJheTxhbnk+KTogYm9vbGVhbiB7XG4gICAgaWYgKHRyYWNlLmluZGV4T2YoeCkgIT09IC0xKVxuICAgICAgcmV0dXJuIHRydWU7IGVsc2VcbiAgICBpZiAoKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQgPT09IHRoaXMpXG4gICAgICByZXR1cm4gdHJ1ZTsgZWxzZVxuICAgIGlmICgoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCAmJiAoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCAhPT0gTk8pXG4gICAgICByZXR1cm4gdGhpcy5faGFzTm9TaW5rcygoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCwgdHJhY2UuY29uY2F0KHgpKTsgZWxzZVxuICAgIGlmICgoeCBhcyBTdHJlYW08YW55PikuX2lscykge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIE4gPSAoeCBhcyBTdHJlYW08YW55PikuX2lscy5sZW5ndGg7IGkgPCBOOyBpKyspXG4gICAgICAgIGlmICghdGhpcy5faGFzTm9TaW5rcygoeCBhcyBTdHJlYW08YW55PikuX2lsc1tpXSwgdHJhY2UuY29uY2F0KHgpKSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBjdG9yKCk6IHR5cGVvZiBTdHJlYW0ge1xuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtID8gTWVtb3J5U3RyZWFtIDogU3RyZWFtO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyfSBsaXN0ZW5lclxuICAgKi9cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogdm9pZCB7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9uID0gbGlzdGVuZXIubmV4dCB8fCBub29wO1xuICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fZSA9IGxpc3RlbmVyLmVycm9yIHx8IG5vb3A7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9jID0gbGlzdGVuZXIuY29tcGxldGUgfHwgbm9vcDtcbiAgICB0aGlzLl9hZGQobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIExpc3RlbmVyIGZyb20gdGhlIFN0cmVhbSwgYXNzdW1pbmcgdGhlIExpc3RlbmVyIHdhcyBhZGRlZCB0byBpdC5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcjxUPn0gbGlzdGVuZXJcbiAgICovXG4gIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pik6IHZvaWQge1xuICAgIHRoaXMuX3JlbW92ZShsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgTGlzdGVuZXIgdG8gdGhlIFN0cmVhbSByZXR1cm5pbmcgYSBTdWJzY3JpcHRpb24gdG8gcmVtb3ZlIHRoYXRcbiAgICogbGlzdGVuZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXJ9IGxpc3RlbmVyXG4gICAqIEByZXR1cm5zIHtTdWJzY3JpcHRpb259XG4gICAqL1xuICBzdWJzY3JpYmUobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogU3Vic2NyaXB0aW9uIHtcbiAgICB0aGlzLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gbmV3IFN0cmVhbVN1YjxUPih0aGlzLCBsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgaW50ZXJvcCBiZXR3ZWVuIG1vc3QuanMgYW5kIFJ4SlMgNVxuICAgKlxuICAgKiBAcmV0dXJucyB7U3RyZWFtfVxuICAgKi9cbiAgWyQkb2JzZXJ2YWJsZV0oKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGU8VD4ocHJvZHVjZXI/OiBQcm9kdWNlcjxUPik6IFN0cmVhbTxUPiB7XG4gICAgaWYgKHByb2R1Y2VyKSB7XG4gICAgICBpZiAodHlwZW9mIHByb2R1Y2VyLnN0YXJ0ICE9PSAnZnVuY3Rpb24nXG4gICAgICB8fCB0eXBlb2YgcHJvZHVjZXIuc3RvcCAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcm9kdWNlciByZXF1aXJlcyBib3RoIHN0YXJ0IGFuZCBzdG9wIGZ1bmN0aW9ucycpO1xuICAgICAgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgfVxuICAgIHJldHVybiBuZXcgU3RyZWFtKHByb2R1Y2VyIGFzIEludGVybmFsUHJvZHVjZXI8VD4gJiBQcm9kdWNlcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNZW1vcnlTdHJlYW0gZ2l2ZW4gYSBQcm9kdWNlci5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb2R1Y2VyfSBwcm9kdWNlciBBbiBvcHRpb25hbCBQcm9kdWNlciB0aGF0IGRpY3RhdGVzIGhvdyB0b1xuICAgKiBzdGFydCwgZ2VuZXJhdGUgZXZlbnRzLCBhbmQgc3RvcCB0aGUgU3RyZWFtLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlV2l0aE1lbW9yeTxUPihwcm9kdWNlcj86IFByb2R1Y2VyPFQ+KTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICBpZiAocHJvZHVjZXIpIGludGVybmFsaXplUHJvZHVjZXIocHJvZHVjZXIpOyAvLyBtdXRhdGVzIHRoZSBpbnB1dFxuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KHByb2R1Y2VyIGFzIEludGVybmFsUHJvZHVjZXI8VD4gJiBQcm9kdWNlcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGRvZXMgbm90aGluZyB3aGVuIHN0YXJ0ZWQuIEl0IG5ldmVyIGVtaXRzIGFueSBldmVudC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogICAgICAgICAgbmV2ZXJcbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG5ldmVyKCk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtfc3RhcnQ6IG5vb3AsIF9zdG9wOiBub29wfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIHRoZSBcImNvbXBsZXRlXCIgbm90aWZpY2F0aW9uIHdoZW5cbiAgICogc3RhcnRlZCwgYW5kIHRoYXQncyBpdC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZW1wdHlcbiAgICogLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGVtcHR5KCk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtcbiAgICAgIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+KSB7IGlsLl9jKCk7IH0sXG4gICAgICBfc3RvcDogbm9vcCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgYW4gXCJlcnJvclwiIG5vdGlmaWNhdGlvbiB3aXRoIHRoZVxuICAgKiB2YWx1ZSB5b3UgcGFzc2VkIGFzIHRoZSBgZXJyb3JgIGFyZ3VtZW50IHdoZW4gdGhlIHN0cmVhbSBzdGFydHMsIGFuZCB0aGF0J3NcbiAgICogaXQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIHRocm93KFgpXG4gICAqIC1YXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSBlcnJvciBUaGUgZXJyb3IgZXZlbnQgdG8gZW1pdCBvbiB0aGUgY3JlYXRlZCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyB0aHJvdyhlcnJvcjogYW55KTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe1xuICAgICAgX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHsgaWwuX2UoZXJyb3IpOyB9LFxuICAgICAgX3N0b3A6IG5vb3AsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHN0cmVhbSBmcm9tIGFuIEFycmF5LCBQcm9taXNlLCBvciBhbiBPYnNlcnZhYmxlLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7QXJyYXl8UHJvbWlzZUxpa2V8T2JzZXJ2YWJsZX0gaW5wdXQgVGhlIGlucHV0IHRvIG1ha2UgYSBzdHJlYW0gZnJvbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb208VD4oaW5wdXQ6IFByb21pc2VMaWtlPFQ+IHwgU3RyZWFtPFQ+IHwgQXJyYXk8VD4gfCBPYnNlcnZhYmxlPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAodHlwZW9mIGlucHV0WyQkb2JzZXJ2YWJsZV0gPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21PYnNlcnZhYmxlPFQ+KGlucHV0IGFzIE9ic2VydmFibGU8VD4pOyBlbHNlXG4gICAgaWYgKHR5cGVvZiAoaW5wdXQgYXMgUHJvbWlzZUxpa2U8VD4pLnRoZW4gPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21Qcm9taXNlPFQ+KGlucHV0IGFzIFByb21pc2VMaWtlPFQ+KTsgZWxzZVxuICAgIGlmIChBcnJheS5pc0FycmF5KGlucHV0KSlcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbUFycmF5PFQ+KGlucHV0KTtcblxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFR5cGUgb2YgaW5wdXQgdG8gZnJvbSgpIG11c3QgYmUgYW4gQXJyYXksIFByb21pc2UsIG9yIE9ic2VydmFibGVgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgdGhlIGFyZ3VtZW50cyB0aGF0IHlvdSBnaXZlIHRvXG4gICAqICpvZiosIHRoZW4gY29tcGxldGVzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBvZigxLDIsMylcbiAgICogMTIzfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0gYSBUaGUgZmlyc3QgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLlxuICAgKiBAcGFyYW0gYiBUaGUgc2Vjb25kIHZhbHVlIHlvdSB3YW50IHRvIGVtaXQgYXMgYW4gZXZlbnQgb24gdGhlIHN0cmVhbS4gT25lXG4gICAqIG9yIG1vcmUgb2YgdGhlc2UgdmFsdWVzIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBvZjxUPiguLi5pdGVtczogQXJyYXk8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBTdHJlYW0uZnJvbUFycmF5PFQ+KGl0ZW1zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhbiBhcnJheSB0byBhIHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSB3aWxsIGVtaXQgc3luY2hyb25vdXNseVxuICAgKiBhbGwgdGhlIGl0ZW1zIGluIHRoZSBhcnJheSwgYW5kIHRoZW4gY29tcGxldGUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGZyb21BcnJheShbMSwyLDNdKVxuICAgKiAxMjN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tQXJyYXk8VD4oYXJyYXk6IEFycmF5PFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbUFycmF5PFQ+KGFycmF5KSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSBwcm9taXNlIHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCB0aGUgcmVzb2x2ZWRcbiAgICogdmFsdWUgb2YgdGhlIHByb21pc2UsIGFuZCB0aGVuIGNvbXBsZXRlLiBIb3dldmVyLCBpZiB0aGUgcHJvbWlzZSBpc1xuICAgKiByZWplY3RlZCwgdGhlIHN0cmVhbSB3aWxsIGVtaXQgdGhlIGNvcnJlc3BvbmRpbmcgZXJyb3IuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGZyb21Qcm9taXNlKCAtLS0tNDIgKVxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLTQyfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb21pc2VMaWtlfSBwcm9taXNlIFRoZSBwcm9taXNlIHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21Qcm9taXNlPFQ+KHByb21pc2U6IFByb21pc2VMaWtlPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbVByb21pc2U8VD4ocHJvbWlzZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIE9ic2VydmFibGUgaW50byBhIFN0cmVhbS5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge2FueX0gb2JzZXJ2YWJsZSBUaGUgb2JzZXJ2YWJsZSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tT2JzZXJ2YWJsZTxUPihvYnM6IHtzdWJzY3JpYmU6IGFueX0pOiBTdHJlYW08VD4ge1xuICAgIGlmICgob2JzIGFzIFN0cmVhbTxUPikuZW5kV2hlbikgcmV0dXJuIG9icyBhcyBTdHJlYW08VD47XG4gICAgY29uc3QgbyA9IHR5cGVvZiBvYnNbJCRvYnNlcnZhYmxlXSA9PT0gJ2Z1bmN0aW9uJyA/IG9ic1skJG9ic2VydmFibGVdKCkgOiBvYnM7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZyb21PYnNlcnZhYmxlKG8pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RyZWFtIHRoYXQgcGVyaW9kaWNhbGx5IGVtaXRzIGluY3JlbWVudGFsIG51bWJlcnMsIGV2ZXJ5XG4gICAqIGBwZXJpb2RgIG1pbGxpc2Vjb25kcy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogICAgIHBlcmlvZGljKDEwMDApXG4gICAqIC0tLTAtLS0xLS0tMi0tLTMtLS00LS0tLi4uXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJpb2QgVGhlIGludGVydmFsIGluIG1pbGxpc2Vjb25kcyB0byB1c2UgYXMgYSByYXRlIG9mXG4gICAqIGVtaXNzaW9uLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgcGVyaW9kaWMocGVyaW9kOiBudW1iZXIpOiBTdHJlYW08bnVtYmVyPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08bnVtYmVyPihuZXcgUGVyaW9kaWMocGVyaW9kKSk7XG4gIH1cblxuICAvKipcbiAgICogQmxlbmRzIG11bHRpcGxlIHN0cmVhbXMgdG9nZXRoZXIsIGVtaXR0aW5nIGV2ZW50cyBmcm9tIGFsbCBvZiB0aGVtXG4gICAqIGNvbmN1cnJlbnRseS5cbiAgICpcbiAgICogKm1lcmdlKiB0YWtlcyBtdWx0aXBsZSBzdHJlYW1zIGFzIGFyZ3VtZW50cywgYW5kIGNyZWF0ZXMgYSBzdHJlYW0gdGhhdFxuICAgKiBiZWhhdmVzIGxpa2UgZWFjaCBvZiB0aGUgYXJndW1lbnQgc3RyZWFtcywgaW4gcGFyYWxsZWwuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gICAqIC0tLS1hLS0tLS1iLS0tLWMtLS1kLS0tLS0tXG4gICAqICAgICAgICAgICAgbWVyZ2VcbiAgICogLS0xLWEtLTItLWItLTMtYy0tLWQtLTQtLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gbWVyZ2UgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMiBBIHN0cmVhbSB0byBtZXJnZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuIFR3b1xuICAgKiBvciBtb3JlIHN0cmVhbXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG1lcmdlOiBNZXJnZVNpZ25hdHVyZSA9IGZ1bmN0aW9uIG1lcmdlKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4obmV3IE1lcmdlKHN0cmVhbXMpKTtcbiAgfSBhcyBNZXJnZVNpZ25hdHVyZTtcblxuICAvKipcbiAgICogQ29tYmluZXMgbXVsdGlwbGUgaW5wdXQgc3RyZWFtcyB0b2dldGhlciB0byByZXR1cm4gYSBzdHJlYW0gd2hvc2UgZXZlbnRzXG4gICAqIGFyZSBhcnJheXMgdGhhdCBjb2xsZWN0IHRoZSBsYXRlc3QgZXZlbnRzIGZyb20gZWFjaCBpbnB1dCBzdHJlYW0uXG4gICAqXG4gICAqICpjb21iaW5lKiBpbnRlcm5hbGx5IHJlbWVtYmVycyB0aGUgbW9zdCByZWNlbnQgZXZlbnQgZnJvbSBlYWNoIG9mIHRoZSBpbnB1dFxuICAgKiBzdHJlYW1zLiBXaGVuIGFueSBvZiB0aGUgaW5wdXQgc3RyZWFtcyBlbWl0cyBhbiBldmVudCwgdGhhdCBldmVudCB0b2dldGhlclxuICAgKiB3aXRoIGFsbCB0aGUgb3RoZXIgc2F2ZWQgZXZlbnRzIGFyZSBjb21iaW5lZCBpbnRvIGFuIGFycmF5LiBUaGF0IGFycmF5IHdpbGxcbiAgICogYmUgZW1pdHRlZCBvbiB0aGUgb3V0cHV0IHN0cmVhbS4gSXQncyBlc3NlbnRpYWxseSBhIHdheSBvZiBqb2luaW5nIHRvZ2V0aGVyXG4gICAqIHRoZSBldmVudHMgZnJvbSBtdWx0aXBsZSBzdHJlYW1zLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tLS0tNC0tLVxuICAgKiAtLS0tYS0tLS0tYi0tLS0tYy0tZC0tLS0tLVxuICAgKiAgICAgICAgICBjb21iaW5lXG4gICAqIC0tLS0xYS0yYS0yYi0zYi0zYy0zZC00ZC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMiBBIHN0cmVhbSB0byBjb21iaW5lIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAgICogTXVsdGlwbGUgc3RyZWFtcywgbm90IGp1c3QgdHdvLCBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY29tYmluZTogQ29tYmluZVNpZ25hdHVyZSA9IGZ1bmN0aW9uIGNvbWJpbmUoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08QXJyYXk8YW55Pj4obmV3IENvbWJpbmU8YW55PihzdHJlYW1zKSk7XG4gIH0gYXMgQ29tYmluZVNpZ25hdHVyZTtcblxuICBwcm90ZWN0ZWQgX21hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IFN0cmVhbTxVPiB8IE1lbW9yeVN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFU+KG5ldyBNYXBPcDxULCBVPihwcm9qZWN0LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyBlYWNoIGV2ZW50IGZyb20gdGhlIGlucHV0IFN0cmVhbSB0aHJvdWdoIGEgYHByb2plY3RgIGZ1bmN0aW9uLFxuICAgKiB0byBnZXQgYSBTdHJlYW0gdGhhdCBlbWl0cyB0aG9zZSB0cmFuc2Zvcm1lZCBldmVudHMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTMtLTUtLS0tLTctLS0tLS1cbiAgICogICAgbWFwKGkgPT4gaSAqIDEwKVxuICAgKiAtLTEwLS0zMC01MC0tLS03MC0tLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcm9qZWN0IEEgZnVuY3Rpb24gb2YgdHlwZSBgKHQ6IFQpID0+IFVgIHRoYXQgdGFrZXMgZXZlbnRcbiAgICogYHRgIG9mIHR5cGUgYFRgIGZyb20gdGhlIGlucHV0IFN0cmVhbSBhbmQgcHJvZHVjZXMgYW4gZXZlbnQgb2YgdHlwZSBgVWAsIHRvXG4gICAqIGJlIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIG1hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IFN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIHRoaXMuX21hcChwcm9qZWN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdCdzIGxpa2UgYG1hcGAsIGJ1dCB0cmFuc2Zvcm1zIGVhY2ggaW5wdXQgZXZlbnQgdG8gYWx3YXlzIHRoZSBzYW1lXG4gICAqIGNvbnN0YW50IHZhbHVlIG9uIHRoZSBvdXRwdXQgU3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0zLS01LS0tLS03LS0tLS1cbiAgICogICAgICAgbWFwVG8oMTApXG4gICAqIC0tMTAtLTEwLTEwLS0tLTEwLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHByb2plY3RlZFZhbHVlIEEgdmFsdWUgdG8gZW1pdCBvbiB0aGUgb3V0cHV0IFN0cmVhbSB3aGVuZXZlciB0aGVcbiAgICogaW5wdXQgU3RyZWFtIGVtaXRzIGFueSB2YWx1ZS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbWFwVG88VT4ocHJvamVjdGVkVmFsdWU6IFUpOiBTdHJlYW08VT4ge1xuICAgIGNvbnN0IHMgPSB0aGlzLm1hcCgoKSA9PiBwcm9qZWN0ZWRWYWx1ZSk7XG4gICAgY29uc3Qgb3A6IE9wZXJhdG9yPFQsIFU+ID0gcy5fcHJvZCBhcyBPcGVyYXRvcjxULCBVPjtcbiAgICBvcC50eXBlID0gJ21hcFRvJztcbiAgICByZXR1cm4gcztcbiAgfVxuXG4gIGZpbHRlcjxTIGV4dGVuZHMgVD4ocGFzc2VzOiAodDogVCkgPT4gdCBpcyBTKTogU3RyZWFtPFM+O1xuICBmaWx0ZXIocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbik6IFN0cmVhbTxUPjtcbiAgLyoqXG4gICAqIE9ubHkgYWxsb3dzIGV2ZW50cyB0aGF0IHBhc3MgdGhlIHRlc3QgZ2l2ZW4gYnkgdGhlIGBwYXNzZXNgIGFyZ3VtZW50LlxuICAgKlxuICAgKiBFYWNoIGV2ZW50IGZyb20gdGhlIGlucHV0IHN0cmVhbSBpcyBnaXZlbiB0byB0aGUgYHBhc3Nlc2AgZnVuY3Rpb24uIElmIHRoZVxuICAgKiBmdW5jdGlvbiByZXR1cm5zIGB0cnVlYCwgdGhlIGV2ZW50IGlzIGZvcndhcmRlZCB0byB0aGUgb3V0cHV0IHN0cmVhbSxcbiAgICogb3RoZXJ3aXNlIGl0IGlzIGlnbm9yZWQgYW5kIG5vdCBmb3J3YXJkZWQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTItLTMtLS0tLTQtLS0tLTUtLS02LS03LTgtLVxuICAgKiAgICAgZmlsdGVyKGkgPT4gaSAlIDIgPT09IDApXG4gICAqIC0tLS0tLTItLS0tLS0tLTQtLS0tLS0tLS02LS0tLTgtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcGFzc2VzIEEgZnVuY3Rpb24gb2YgdHlwZSBgKHQ6IFQpID0+IGJvb2xlYW5gIHRoYXQgdGFrZXNcbiAgICogYW4gZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGFuZCBjaGVja3MgaWYgaXQgcGFzc2VzLCBieSByZXR1cm5pbmcgYVxuICAgKiBib29sZWFuLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBmaWx0ZXIocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbik6IFN0cmVhbTxUPiB7XG4gICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgaWYgKHAgaW5zdGFuY2VvZiBGaWx0ZXIpXG4gICAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRmlsdGVyPFQ+KFxuICAgICAgICBhbmQoKHAgYXMgRmlsdGVyPFQ+KS5mLCBwYXNzZXMpLFxuICAgICAgICAocCBhcyBGaWx0ZXI8VD4pLmluc1xuICAgICAgKSk7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZpbHRlcjxUPihwYXNzZXMsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMZXRzIHRoZSBmaXJzdCBgYW1vdW50YCBtYW55IGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gcGFzcyB0byB0aGVcbiAgICogb3V0cHV0IHN0cmVhbSwgdGhlbiBtYWtlcyB0aGUgb3V0cHV0IHN0cmVhbSBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tLS1kLS0tZS0tXG4gICAqICAgIHRha2UoMylcbiAgICogLS1hLS0tYi0tY3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgSG93IG1hbnkgZXZlbnRzIHRvIGFsbG93IGZyb20gdGhlIGlucHV0IHN0cmVhbVxuICAgKiBiZWZvcmUgY29tcGxldGluZyB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgdGFrZShhbW91bnQ6IG51bWJlcik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBUYWtlPFQ+KGFtb3VudCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIElnbm9yZXMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW5cbiAgICogYWZ0ZXIgdGhhdCBzdGFydHMgZm9yd2FyZGluZyBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHRvIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICogICAgICAgZHJvcCgzKVxuICAgKiAtLS0tLS0tLS0tLS0tLWQtLS1lLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgSG93IG1hbnkgZXZlbnRzIHRvIGlnbm9yZSBmcm9tIHRoZSBpbnB1dCBzdHJlYW1cbiAgICogYmVmb3JlIGZvcndhcmRpbmcgYWxsIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGRyb3AoYW1vdW50OiBudW1iZXIpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBEcm9wPFQ+KGFtb3VudCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZW4gdGhlIGlucHV0IHN0cmVhbSBjb21wbGV0ZXMsIHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgZW1pdCB0aGUgbGFzdCBldmVudFxuICAgKiBlbWl0dGVkIGJ5IHRoZSBpbnB1dCBzdHJlYW0sIGFuZCB0aGVuIHdpbGwgYWxzbyBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tZC0tLS18XG4gICAqICAgICAgIGxhc3QoKVxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLWR8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBsYXN0KCk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IExhc3Q8VD4odGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZXBlbmRzIHRoZSBnaXZlbiBgaW5pdGlhbGAgdmFsdWUgdG8gdGhlIHNlcXVlbmNlIG9mIGV2ZW50cyBlbWl0dGVkIGJ5IHRoZVxuICAgKiBpbnB1dCBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gaXMgYSBNZW1vcnlTdHJlYW0sIHdoaWNoIG1lYW5zIGl0IGlzXG4gICAqIGFscmVhZHkgYHJlbWVtYmVyKClgJ2QuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLTEtLS0yLS0tLS0zLS0tXG4gICAqICAgc3RhcnRXaXRoKDApXG4gICAqIDAtLTEtLS0yLS0tLS0zLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gaW5pdGlhbCBUaGUgdmFsdWUgb3IgZXZlbnQgdG8gcHJlcGVuZC5cbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgc3RhcnRXaXRoKGluaXRpYWw6IFQpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KG5ldyBTdGFydFdpdGg8VD4odGhpcywgaW5pdGlhbCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZXMgYW5vdGhlciBzdHJlYW0gdG8gZGV0ZXJtaW5lIHdoZW4gdG8gY29tcGxldGUgdGhlIGN1cnJlbnQgc3RyZWFtLlxuICAgKlxuICAgKiBXaGVuIHRoZSBnaXZlbiBgb3RoZXJgIHN0cmVhbSBlbWl0cyBhbiBldmVudCBvciBjb21wbGV0ZXMsIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtIHdpbGwgY29tcGxldGUuIEJlZm9yZSB0aGF0IGhhcHBlbnMsIHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgYmVoYXZlc1xuICAgKiBsaWtlIHRoZSBpbnB1dCBzdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLTEtLS0yLS0tLS0zLS00LS0tLTUtLS0tNi0tLVxuICAgKiAgIGVuZFdoZW4oIC0tLS0tLS0tYS0tYi0tfCApXG4gICAqIC0tLTEtLS0yLS0tLS0zLS00LS18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gb3RoZXIgU29tZSBvdGhlciBzdHJlYW0gdGhhdCBpcyB1c2VkIHRvIGtub3cgd2hlbiBzaG91bGQgdGhlIG91dHB1dFxuICAgKiBzdHJlYW0gb2YgdGhpcyBvcGVyYXRvciBjb21wbGV0ZS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZW5kV2hlbihvdGhlcjogU3RyZWFtPGFueT4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgRW5kV2hlbjxUPihvdGhlciwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFwiRm9sZHNcIiB0aGUgc3RyZWFtIG9udG8gaXRzZWxmLlxuICAgKlxuICAgKiBDb21iaW5lcyBldmVudHMgZnJvbSB0aGUgcGFzdCB0aHJvdWdob3V0XG4gICAqIHRoZSBlbnRpcmUgZXhlY3V0aW9uIG9mIHRoZSBpbnB1dCBzdHJlYW0sIGFsbG93aW5nIHlvdSB0byBhY2N1bXVsYXRlIHRoZW1cbiAgICogdG9nZXRoZXIuIEl0J3MgZXNzZW50aWFsbHkgbGlrZSBgQXJyYXkucHJvdG90eXBlLnJlZHVjZWAuIFRoZSByZXR1cm5lZFxuICAgKiBzdHJlYW0gaXMgYSBNZW1vcnlTdHJlYW0sIHdoaWNoIG1lYW5zIGl0IGlzIGFscmVhZHkgYHJlbWVtYmVyKClgJ2QuXG4gICAqXG4gICAqIFRoZSBvdXRwdXQgc3RyZWFtIHN0YXJ0cyBieSBlbWl0dGluZyB0aGUgYHNlZWRgIHdoaWNoIHlvdSBnaXZlIGFzIGFyZ3VtZW50LlxuICAgKiBUaGVuLCB3aGVuIGFuIGV2ZW50IGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgaXQgaXMgY29tYmluZWQgd2l0aCB0aGF0XG4gICAqIHNlZWQgdmFsdWUgdGhyb3VnaCB0aGUgYGFjY3VtdWxhdGVgIGZ1bmN0aW9uLCBhbmQgdGhlIG91dHB1dCB2YWx1ZSBpc1xuICAgKiBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBgZm9sZGAgcmVtZW1iZXJzIHRoYXQgb3V0cHV0IHZhbHVlIGFzIGBhY2NgXG4gICAqIChcImFjY3VtdWxhdG9yXCIpLCBhbmQgdGhlbiB3aGVuIGEgbmV3IGlucHV0IGV2ZW50IGB0YCBoYXBwZW5zLCBgYWNjYCB3aWxsIGJlXG4gICAqIGNvbWJpbmVkIHdpdGggdGhhdCB0byBwcm9kdWNlIHRoZSBuZXcgYGFjY2AgYW5kIHNvIGZvcnRoLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLS0tLS0xLS0tLS0xLS0yLS0tLTEtLS0tMS0tLS0tLVxuICAgKiAgIGZvbGQoKGFjYywgeCkgPT4gYWNjICsgeCwgMylcbiAgICogMy0tLS0tNC0tLS0tNS0tNy0tLS04LS0tLTktLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGFjY3VtdWxhdGUgQSBmdW5jdGlvbiBvZiB0eXBlIGAoYWNjOiBSLCB0OiBUKSA9PiBSYCB0aGF0XG4gICAqIHRha2VzIHRoZSBwcmV2aW91cyBhY2N1bXVsYXRlZCB2YWx1ZSBgYWNjYCBhbmQgdGhlIGluY29taW5nIGV2ZW50IGZyb20gdGhlXG4gICAqIGlucHV0IHN0cmVhbSBhbmQgcHJvZHVjZXMgdGhlIG5ldyBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICogQHBhcmFtIHNlZWQgVGhlIGluaXRpYWwgYWNjdW11bGF0ZWQgdmFsdWUsIG9mIHR5cGUgYFJgLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBmb2xkPFI+KGFjY3VtdWxhdGU6IChhY2M6IFIsIHQ6IFQpID0+IFIsIHNlZWQ6IFIpOiBNZW1vcnlTdHJlYW08Uj4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFI+KG5ldyBGb2xkPFQsIFI+KGFjY3VtdWxhdGUsIHNlZWQsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBsYWNlcyBhbiBlcnJvciB3aXRoIGFub3RoZXIgc3RyZWFtLlxuICAgKlxuICAgKiBXaGVuIChhbmQgaWYpIGFuIGVycm9yIGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgaW5zdGVhZCBvZiBmb3J3YXJkaW5nXG4gICAqIHRoYXQgZXJyb3IgdG8gdGhlIG91dHB1dCBzdHJlYW0sICpyZXBsYWNlRXJyb3IqIHdpbGwgY2FsbCB0aGUgYHJlcGxhY2VgXG4gICAqIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIHN0cmVhbSB0aGF0IHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgcmVwbGljYXRlLlxuICAgKiBBbmQsIGluIGNhc2UgdGhhdCBuZXcgc3RyZWFtIGFsc28gZW1pdHMgYW4gZXJyb3IsIGByZXBsYWNlYCB3aWxsIGJlIGNhbGxlZFxuICAgKiBhZ2FpbiB0byBnZXQgYW5vdGhlciBzdHJlYW0gdG8gc3RhcnQgcmVwbGljYXRpbmcuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTItLS0tLTMtLTQtLS0tLVhcbiAgICogICByZXBsYWNlRXJyb3IoICgpID0+IC0tMTAtLXwgKVxuICAgKiAtLTEtLS0yLS0tLS0zLS00LS0tLS0tLS0xMC0tfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmVwbGFjZSBBIGZ1bmN0aW9uIG9mIHR5cGUgYChlcnIpID0+IFN0cmVhbWAgdGhhdCB0YWtlc1xuICAgKiB0aGUgZXJyb3IgdGhhdCBvY2N1cnJlZCBvbiB0aGUgaW5wdXQgc3RyZWFtIG9yIG9uIHRoZSBwcmV2aW91cyByZXBsYWNlbWVudFxuICAgKiBzdHJlYW0gYW5kIHJldHVybnMgYSBuZXcgc3RyZWFtLiBUaGUgb3V0cHV0IHN0cmVhbSB3aWxsIGJlaGF2ZSBsaWtlIHRoZVxuICAgKiBzdHJlYW0gdGhhdCB0aGlzIGZ1bmN0aW9uIHJldHVybnMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHJlcGxhY2VFcnJvcihyZXBsYWNlOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBSZXBsYWNlRXJyb3I8VD4ocmVwbGFjZSwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZsYXR0ZW5zIGEgXCJzdHJlYW0gb2Ygc3RyZWFtc1wiLCBoYW5kbGluZyBvbmx5IG9uZSBuZXN0ZWQgc3RyZWFtIGF0IGEgdGltZVxuICAgKiAobm8gY29uY3VycmVuY3kpLlxuICAgKlxuICAgKiBJZiB0aGUgaW5wdXQgc3RyZWFtIGlzIGEgc3RyZWFtIHRoYXQgZW1pdHMgc3RyZWFtcywgdGhlbiB0aGlzIG9wZXJhdG9yIHdpbGxcbiAgICogcmV0dXJuIGFuIG91dHB1dCBzdHJlYW0gd2hpY2ggaXMgYSBmbGF0IHN0cmVhbTogZW1pdHMgcmVndWxhciBldmVudHMuIFRoZVxuICAgKiBmbGF0dGVuaW5nIGhhcHBlbnMgd2l0aG91dCBjb25jdXJyZW5jeS4gSXQgd29ya3MgbGlrZSB0aGlzOiB3aGVuIHRoZSBpbnB1dFxuICAgKiBzdHJlYW0gZW1pdHMgYSBuZXN0ZWQgc3RyZWFtLCAqZmxhdHRlbiogd2lsbCBzdGFydCBpbWl0YXRpbmcgdGhhdCBuZXN0ZWRcbiAgICogb25lLiBIb3dldmVyLCBhcyBzb29uIGFzIHRoZSBuZXh0IG5lc3RlZCBzdHJlYW0gaXMgZW1pdHRlZCBvbiB0aGUgaW5wdXRcbiAgICogc3RyZWFtLCAqZmxhdHRlbiogd2lsbCBmb3JnZXQgdGhlIHByZXZpb3VzIG5lc3RlZCBvbmUgaXQgd2FzIGltaXRhdGluZywgYW5kXG4gICAqIHdpbGwgc3RhcnQgaW1pdGF0aW5nIHRoZSBuZXcgbmVzdGVkIG9uZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0rLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0tXG4gICAqICAgXFwgICAgICAgIFxcXG4gICAqICAgIFxcICAgICAgIC0tLS0xLS0tLTItLS0zLS1cbiAgICogICAgLS1hLS1iLS0tLWMtLS0tZC0tLS0tLS0tXG4gICAqICAgICAgICAgICBmbGF0dGVuXG4gICAqIC0tLS0tYS0tYi0tLS0tLTEtLS0tMi0tLTMtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZmxhdHRlbjxSPih0aGlzOiBTdHJlYW08U3RyZWFtPFI+Pik6IFQge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFI+KG5ldyBGbGF0dGVuKHRoaXMpKSBhcyBUICYgU3RyZWFtPFI+O1xuICB9XG5cbiAgLyoqXG4gICAqIFBhc3NlcyB0aGUgaW5wdXQgc3RyZWFtIHRvIGEgY3VzdG9tIG9wZXJhdG9yLCB0byBwcm9kdWNlIGFuIG91dHB1dCBzdHJlYW0uXG4gICAqXG4gICAqICpjb21wb3NlKiBpcyBhIGhhbmR5IHdheSBvZiB1c2luZyBhbiBleGlzdGluZyBmdW5jdGlvbiBpbiBhIGNoYWluZWQgc3R5bGUuXG4gICAqIEluc3RlYWQgb2Ygd3JpdGluZyBgb3V0U3RyZWFtID0gZihpblN0cmVhbSlgIHlvdSBjYW4gd3JpdGVcbiAgICogYG91dFN0cmVhbSA9IGluU3RyZWFtLmNvbXBvc2UoZilgLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvcGVyYXRvciBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBzdHJlYW0gYXMgaW5wdXQgYW5kXG4gICAqIHJldHVybnMgYSBzdHJlYW0gYXMgd2VsbC5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgY29tcG9zZTxVPihvcGVyYXRvcjogKHN0cmVhbTogU3RyZWFtPFQ+KSA9PiBVKTogVSB7XG4gICAgcmV0dXJuIG9wZXJhdG9yKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb3V0cHV0IHN0cmVhbSB0aGF0IGJlaGF2ZXMgbGlrZSB0aGUgaW5wdXQgc3RyZWFtLCBidXQgYWxzb1xuICAgKiByZW1lbWJlcnMgdGhlIG1vc3QgcmVjZW50IGV2ZW50IHRoYXQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBzbyB0aGF0IGFcbiAgICogbmV3bHkgYWRkZWQgbGlzdGVuZXIgd2lsbCBpbW1lZGlhdGVseSByZWNlaXZlIHRoYXQgbWVtb3Jpc2VkIGV2ZW50LlxuICAgKlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICByZW1lbWJlcigpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KG5ldyBSZW1lbWJlcjxUPih0aGlzKSk7XG4gIH1cblxuICBkZWJ1ZygpOiBTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6IHN0cmluZyk6IFN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogKHQ6IFQpID0+IGFueSk6IFN0cmVhbTxUPjtcbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb3V0cHV0IHN0cmVhbSB0aGF0IGlkZW50aWNhbGx5IGJlaGF2ZXMgbGlrZSB0aGUgaW5wdXQgc3RyZWFtLFxuICAgKiBidXQgYWxzbyBydW5zIGEgYHNweWAgZnVuY3Rpb24gZm9yIGVhY2ggZXZlbnQsIHRvIGhlbHAgeW91IGRlYnVnIHlvdXIgYXBwLlxuICAgKlxuICAgKiAqZGVidWcqIHRha2VzIGEgYHNweWAgZnVuY3Rpb24gYXMgYXJndW1lbnQsIGFuZCBydW5zIHRoYXQgZm9yIGVhY2ggZXZlbnRcbiAgICogaGFwcGVuaW5nIG9uIHRoZSBpbnB1dCBzdHJlYW0uIElmIHlvdSBkb24ndCBwcm92aWRlIHRoZSBgc3B5YCBhcmd1bWVudCxcbiAgICogdGhlbiAqZGVidWcqIHdpbGwganVzdCBgY29uc29sZS5sb2dgIGVhY2ggZXZlbnQuIFRoaXMgaGVscHMgeW91IHRvXG4gICAqIHVuZGVyc3RhbmQgdGhlIGZsb3cgb2YgZXZlbnRzIHRocm91Z2ggc29tZSBvcGVyYXRvciBjaGFpbi5cbiAgICpcbiAgICogUGxlYXNlIG5vdGUgdGhhdCBpZiB0aGUgb3V0cHV0IHN0cmVhbSBoYXMgbm8gbGlzdGVuZXJzLCB0aGVuIGl0IHdpbGwgbm90XG4gICAqIHN0YXJ0LCB3aGljaCBtZWFucyBgc3B5YCB3aWxsIG5ldmVyIHJ1biBiZWNhdXNlIG5vIGFjdHVhbCBldmVudCBoYXBwZW5zIGluXG4gICAqIHRoYXQgY2FzZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLTQtLVxuICAgKiAgICAgICAgIGRlYnVnXG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS00LS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxhYmVsT3JTcHkgQSBzdHJpbmcgdG8gdXNlIGFzIHRoZSBsYWJlbCB3aGVuIHByaW50aW5nXG4gICAqIGRlYnVnIGluZm9ybWF0aW9uIG9uIHRoZSBjb25zb2xlLCBvciBhICdzcHknIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYW4gZXZlbnRcbiAgICogYXMgYXJndW1lbnQsIGFuZCBkb2VzIG5vdCBuZWVkIHRvIHJldHVybiBhbnl0aGluZy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZGVidWcobGFiZWxPclNweT86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBEZWJ1ZzxUPih0aGlzLCBsYWJlbE9yU3B5KSk7XG4gIH1cblxuICAvKipcbiAgICogKmltaXRhdGUqIGNoYW5nZXMgdGhpcyBjdXJyZW50IFN0cmVhbSB0byBlbWl0IHRoZSBzYW1lIGV2ZW50cyB0aGF0IHRoZVxuICAgKiBgb3RoZXJgIGdpdmVuIFN0cmVhbSBkb2VzLiBUaGlzIG1ldGhvZCByZXR1cm5zIG5vdGhpbmcuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGV4aXN0cyB0byBhbGxvdyBvbmUgdGhpbmc6ICoqY2lyY3VsYXIgZGVwZW5kZW5jeSBvZiBzdHJlYW1zKiouXG4gICAqIEZvciBpbnN0YW5jZSwgbGV0J3MgaW1hZ2luZSB0aGF0IGZvciBzb21lIHJlYXNvbiB5b3UgbmVlZCB0byBjcmVhdGUgYVxuICAgKiBjaXJjdWxhciBkZXBlbmRlbmN5IHdoZXJlIHN0cmVhbSBgZmlyc3QkYCBkZXBlbmRzIG9uIHN0cmVhbSBgc2Vjb25kJGBcbiAgICogd2hpY2ggaW4gdHVybiBkZXBlbmRzIG9uIGBmaXJzdCRgOlxuICAgKlxuICAgKiA8IS0tIHNraXAtZXhhbXBsZSAtLT5cbiAgICogYGBganNcbiAgICogaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknXG4gICAqXG4gICAqIHZhciBmaXJzdCQgPSBzZWNvbmQkLm1hcCh4ID0+IHggKiAxMCkudGFrZSgzKTtcbiAgICogdmFyIHNlY29uZCQgPSBmaXJzdCQubWFwKHggPT4geCArIDEpLnN0YXJ0V2l0aCgxKS5jb21wb3NlKGRlbGF5KDEwMCkpO1xuICAgKiBgYGBcbiAgICpcbiAgICogSG93ZXZlciwgdGhhdCBpcyBpbnZhbGlkIEphdmFTY3JpcHQsIGJlY2F1c2UgYHNlY29uZCRgIGlzIHVuZGVmaW5lZFxuICAgKiBvbiB0aGUgZmlyc3QgbGluZS4gVGhpcyBpcyBob3cgKmltaXRhdGUqIGNhbiBoZWxwIHNvbHZlIGl0OlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAgICpcbiAgICogdmFyIHNlY29uZFByb3h5JCA9IHhzLmNyZWF0ZSgpO1xuICAgKiB2YXIgZmlyc3QkID0gc2Vjb25kUHJveHkkLm1hcCh4ID0+IHggKiAxMCkudGFrZSgzKTtcbiAgICogdmFyIHNlY29uZCQgPSBmaXJzdCQubWFwKHggPT4geCArIDEpLnN0YXJ0V2l0aCgxKS5jb21wb3NlKGRlbGF5KDEwMCkpO1xuICAgKiBzZWNvbmRQcm94eSQuaW1pdGF0ZShzZWNvbmQkKTtcbiAgICogYGBgXG4gICAqXG4gICAqIFdlIGNyZWF0ZSBgc2Vjb25kUHJveHkkYCBiZWZvcmUgdGhlIG90aGVycywgc28gaXQgY2FuIGJlIHVzZWQgaW4gdGhlXG4gICAqIGRlY2xhcmF0aW9uIG9mIGBmaXJzdCRgLiBUaGVuLCBhZnRlciBib3RoIGBmaXJzdCRgIGFuZCBgc2Vjb25kJGAgYXJlXG4gICAqIGRlZmluZWQsIHdlIGhvb2sgYHNlY29uZFByb3h5JGAgd2l0aCBgc2Vjb25kJGAgd2l0aCBgaW1pdGF0ZSgpYCB0byB0ZWxsXG4gICAqIHRoYXQgdGhleSBhcmUgXCJ0aGUgc2FtZVwiLiBgaW1pdGF0ZWAgd2lsbCBub3QgdHJpZ2dlciB0aGUgc3RhcnQgb2YgYW55XG4gICAqIHN0cmVhbSwgaXQganVzdCBiaW5kcyBgc2Vjb25kUHJveHkkYCBhbmQgYHNlY29uZCRgIHRvZ2V0aGVyLlxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGlzIGFuIGV4YW1wbGUgd2hlcmUgYGltaXRhdGUoKWAgaXMgaW1wb3J0YW50IGluIEN5Y2xlLmpzXG4gICAqIGFwcGxpY2F0aW9ucy4gQSBwYXJlbnQgY29tcG9uZW50IGNvbnRhaW5zIHNvbWUgY2hpbGQgY29tcG9uZW50cy4gQSBjaGlsZFxuICAgKiBoYXMgYW4gYWN0aW9uIHN0cmVhbSB3aGljaCBpcyBnaXZlbiB0byB0aGUgcGFyZW50IHRvIGRlZmluZSBpdHMgc3RhdGU6XG4gICAqXG4gICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgKiBgYGBqc1xuICAgKiBjb25zdCBjaGlsZEFjdGlvblByb3h5JCA9IHhzLmNyZWF0ZSgpO1xuICAgKiBjb25zdCBwYXJlbnQgPSBQYXJlbnQoey4uLnNvdXJjZXMsIGNoaWxkQWN0aW9uJDogY2hpbGRBY3Rpb25Qcm94eSR9KTtcbiAgICogY29uc3QgY2hpbGRBY3Rpb24kID0gcGFyZW50LnN0YXRlJC5tYXAocyA9PiBzLmNoaWxkLmFjdGlvbiQpLmZsYXR0ZW4oKTtcbiAgICogY2hpbGRBY3Rpb25Qcm94eSQuaW1pdGF0ZShjaGlsZEFjdGlvbiQpO1xuICAgKiBgYGBcbiAgICpcbiAgICogTm90ZSwgdGhvdWdoLCB0aGF0ICoqYGltaXRhdGUoKWAgZG9lcyBub3Qgc3VwcG9ydCBNZW1vcnlTdHJlYW1zKiouIElmIHdlXG4gICAqIHdvdWxkIGF0dGVtcHQgdG8gaW1pdGF0ZSBhIE1lbW9yeVN0cmVhbSBpbiBhIGNpcmN1bGFyIGRlcGVuZGVuY3ksIHdlIHdvdWxkXG4gICAqIGVpdGhlciBnZXQgYSByYWNlIGNvbmRpdGlvbiAod2hlcmUgdGhlIHN5bXB0b20gd291bGQgYmUgXCJub3RoaW5nIGhhcHBlbnNcIilcbiAgICogb3IgYW4gaW5maW5pdGUgY3ljbGljIGVtaXNzaW9uIG9mIHZhbHVlcy4gSXQncyB1c2VmdWwgdG8gdGhpbmsgYWJvdXRcbiAgICogTWVtb3J5U3RyZWFtcyBhcyBjZWxscyBpbiBhIHNwcmVhZHNoZWV0LiBJdCBkb2Vzbid0IG1ha2UgYW55IHNlbnNlIHRvXG4gICAqIGRlZmluZSBhIHNwcmVhZHNoZWV0IGNlbGwgYEExYCB3aXRoIGEgZm9ybXVsYSB0aGF0IGRlcGVuZHMgb24gYEIxYCBhbmRcbiAgICogY2VsbCBgQjFgIGRlZmluZWQgd2l0aCBhIGZvcm11bGEgdGhhdCBkZXBlbmRzIG9uIGBBMWAuXG4gICAqXG4gICAqIElmIHlvdSBmaW5kIHlvdXJzZWxmIHdhbnRpbmcgdG8gdXNlIGBpbWl0YXRlKClgIHdpdGggYVxuICAgKiBNZW1vcnlTdHJlYW0sIHlvdSBzaG91bGQgcmV3b3JrIHlvdXIgY29kZSBhcm91bmQgYGltaXRhdGUoKWAgdG8gdXNlIGFcbiAgICogU3RyZWFtIGluc3RlYWQuIExvb2sgZm9yIHRoZSBzdHJlYW0gaW4gdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kgdGhhdFxuICAgKiByZXByZXNlbnRzIGFuIGV2ZW50IHN0cmVhbSwgYW5kIHRoYXQgd291bGQgYmUgYSBjYW5kaWRhdGUgZm9yIGNyZWF0aW5nIGFcbiAgICogcHJveHkgU3RyZWFtIHdoaWNoIHRoZW4gaW1pdGF0ZXMgdGhlIHRhcmdldCBTdHJlYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyZWFtfSB0YXJnZXQgVGhlIG90aGVyIHN0cmVhbSB0byBpbWl0YXRlIG9uIHRoZSBjdXJyZW50IG9uZS4gTXVzdFxuICAgKiBub3QgYmUgYSBNZW1vcnlTdHJlYW0uXG4gICAqL1xuICBpbWl0YXRlKHRhcmdldDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE1lbW9yeVN0cmVhbSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignQSBNZW1vcnlTdHJlYW0gd2FzIGdpdmVuIHRvIGltaXRhdGUoKSwgYnV0IGl0IG9ubHkgJyArXG4gICAgICAnc3VwcG9ydHMgYSBTdHJlYW0uIFJlYWQgbW9yZSBhYm91dCB0aGlzIHJlc3RyaWN0aW9uIGhlcmU6ICcgK1xuICAgICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9zdGFsdHoveHN0cmVhbSNmYXEnKTtcbiAgICB0aGlzLl90YXJnZXQgPSB0YXJnZXQ7XG4gICAgZm9yIChsZXQgaWxzID0gdGhpcy5faWxzLCBOID0gaWxzLmxlbmd0aCwgaSA9IDA7IGkgPCBOOyBpKyspIHRhcmdldC5fYWRkKGlsc1tpXSk7XG4gICAgdGhpcy5faWxzID0gW107XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgZ2l2ZW4gdmFsdWUgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgXCJuZXh0XCIgdmFsdWUgeW91IHdhbnQgdG8gYnJvYWRjYXN0IHRvIGFsbCBsaXN0ZW5lcnMgb2ZcbiAgICogdGhpcyBTdHJlYW0uXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZE5leHQodmFsdWU6IFQpIHtcbiAgICB0aGlzLl9uKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiBlcnJvciB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGVycm9yIFRoZSBlcnJvciB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIHRoZSBsaXN0ZW5lcnMgb2ZcbiAgICogdGhpcyBTdHJlYW0uXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZEVycm9yKGVycm9yOiBhbnkpIHtcbiAgICB0aGlzLl9lKGVycm9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBcImNvbXBsZXRlZFwiIGV2ZW50IHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKi9cbiAgc2hhbWVmdWxseVNlbmRDb21wbGV0ZSgpIHtcbiAgICB0aGlzLl9jKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIFwiZGVidWdcIiBsaXN0ZW5lciB0byB0aGUgc3RyZWFtLiBUaGVyZSBjYW4gb25seSBiZSBvbmUgZGVidWdcbiAgICogbGlzdGVuZXIsIHRoYXQncyB3aHkgdGhpcyBpcyAnc2V0RGVidWdMaXN0ZW5lcicuIFRvIHJlbW92ZSB0aGUgZGVidWdcbiAgICogbGlzdGVuZXIsIGp1c3QgY2FsbCBzZXREZWJ1Z0xpc3RlbmVyKG51bGwpLlxuICAgKlxuICAgKiBBIGRlYnVnIGxpc3RlbmVyIGlzIGxpa2UgYW55IG90aGVyIGxpc3RlbmVyLiBUaGUgb25seSBkaWZmZXJlbmNlIGlzIHRoYXQgYVxuICAgKiBkZWJ1ZyBsaXN0ZW5lciBpcyBcInN0ZWFsdGh5XCI6IGl0cyBwcmVzZW5jZS9hYnNlbmNlIGRvZXMgbm90IHRyaWdnZXIgdGhlXG4gICAqIHN0YXJ0L3N0b3Agb2YgdGhlIHN0cmVhbSAob3IgdGhlIHByb2R1Y2VyIGluc2lkZSB0aGUgc3RyZWFtKS4gVGhpcyBpc1xuICAgKiB1c2VmdWwgc28geW91IGNhbiBpbnNwZWN0IHdoYXQgaXMgZ29pbmcgb24gd2l0aG91dCBjaGFuZ2luZyB0aGUgYmVoYXZpb3JcbiAgICogb2YgdGhlIHByb2dyYW0uIElmIHlvdSBoYXZlIGFuIGlkbGUgc3RyZWFtIGFuZCB5b3UgYWRkIGEgbm9ybWFsIGxpc3RlbmVyIHRvXG4gICAqIGl0LCB0aGUgc3RyZWFtIHdpbGwgc3RhcnQgZXhlY3V0aW5nLiBCdXQgaWYgeW91IHNldCBhIGRlYnVnIGxpc3RlbmVyIG9uIGFuXG4gICAqIGlkbGUgc3RyZWFtLCBpdCB3b24ndCBzdGFydCBleGVjdXRpbmcgKG5vdCB1bnRpbCB0aGUgZmlyc3Qgbm9ybWFsIGxpc3RlbmVyXG4gICAqIGlzIGFkZGVkKS5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCB3ZSBkb24ndCByZWNvbW1lbmQgdXNpbmcgdGhpcyBtZXRob2QgdG8gYnVpbGQgYXBwXG4gICAqIGxvZ2ljLiBJbiBmYWN0LCBpbiBtb3N0IGNhc2VzIHRoZSBkZWJ1ZyBvcGVyYXRvciB3b3JrcyBqdXN0IGZpbmUuIE9ubHkgdXNlXG4gICAqIHRoaXMgb25lIGlmIHlvdSBrbm93IHdoYXQgeW91J3JlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgKi9cbiAgc2V0RGVidWdMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgdGhpcy5fZCA9IGZhbHNlO1xuICAgICAgdGhpcy5fZGwgPSBOTyBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kID0gdHJ1ZTtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fbiA9IGxpc3RlbmVyLm5leHQgfHwgbm9vcDtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fZSA9IGxpc3RlbmVyLmVycm9yIHx8IG5vb3A7XG4gICAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2MgPSBsaXN0ZW5lci5jb21wbGV0ZSB8fCBub29wO1xuICAgICAgdGhpcy5fZGwgPSBsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RyZWFtPFQ+IGV4dGVuZHMgU3RyZWFtPFQ+IHtcbiAgcHJpdmF0ZSBfdjogVDtcbiAgcHJpdmF0ZSBfaGFzOiBib29sZWFuID0gZmFsc2U7XG4gIGNvbnN0cnVjdG9yKHByb2R1Y2VyOiBJbnRlcm5hbFByb2R1Y2VyPFQ+KSB7XG4gICAgc3VwZXIocHJvZHVjZXIpO1xuICB9XG5cbiAgX24oeDogVCkge1xuICAgIHRoaXMuX3YgPSB4O1xuICAgIHRoaXMuX2hhcyA9IHRydWU7XG4gICAgc3VwZXIuX24oeCk7XG4gIH1cblxuICBfYWRkKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9hZGQoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgYS5wdXNoKGlsKTtcbiAgICBpZiAoYS5sZW5ndGggPiAxKSB7XG4gICAgICBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3N0b3BJRCAhPT0gTk8pIHtcbiAgICAgIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3N0b3BJRCk7XG4gICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7IGVsc2Uge1xuICAgICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgICBpZiAocCAhPT0gTk8pIHAuX3N0YXJ0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF9zdG9wTm93KCkge1xuICAgIHRoaXMuX2hhcyA9IGZhbHNlO1xuICAgIHN1cGVyLl9zdG9wTm93KCk7XG4gIH1cblxuICBfeCgpOiB2b2lkIHtcbiAgICB0aGlzLl9oYXMgPSBmYWxzZTtcbiAgICBzdXBlci5feCgpO1xuICB9XG5cbiAgbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwKHByb2plY3QpIGFzIE1lbW9yeVN0cmVhbTxVPjtcbiAgfVxuXG4gIG1hcFRvPFU+KHByb2plY3RlZFZhbHVlOiBVKTogTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gc3VwZXIubWFwVG8ocHJvamVjdGVkVmFsdWUpIGFzIE1lbW9yeVN0cmVhbTxVPjtcbiAgfVxuXG4gIHRha2UoYW1vdW50OiBudW1iZXIpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci50YWtlKGFtb3VudCkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG5cbiAgZW5kV2hlbihvdGhlcjogU3RyZWFtPGFueT4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5lbmRXaGVuKG90aGVyKSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICByZXBsYWNlRXJyb3IocmVwbGFjZTogKGVycjogYW55KSA9PiBTdHJlYW08VD4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5yZXBsYWNlRXJyb3IocmVwbGFjZSkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG5cbiAgcmVtZW1iZXIoKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRlYnVnKCk6IE1lbW9yeVN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogc3RyaW5nKTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiAodDogVCkgPT4gYW55KTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5Pzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpIHwgdW5kZWZpbmVkKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIuZGVidWcobGFiZWxPclNweSBhcyBhbnkpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxufVxuXG5leHBvcnQge05PLCBOT19JTH07XG5jb25zdCB4cyA9IFN0cmVhbTtcbnR5cGUgeHM8VD4gPSBTdHJlYW08VD47XG5leHBvcnQgZGVmYXVsdCB4cztcbiIsImltcG9ydCB4cyBmcm9tICd4c3RyZWFtJztcbmltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5JztcbmltcG9ydCB7cnVufSBmcm9tICdAY3ljbGUvcnVuJztcbmltcG9ydCB7cG93ZXJ1cH0gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uJztcbmltcG9ydCB7XG4gIG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIsXG4gIFNwZWVjaFN5bnRoZXNpc0FjdGlvbixcbiAgbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyLFxuICBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbixcbn0gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvc3BlZWNoJztcblxuXG5mdW5jdGlvbiBtYWluKHNvdXJjZXMpIHsgXG4gIHNvdXJjZXMucHJveGllcyA9IHsgIC8vIHdpbGwgYmUgY29ubmVjdGVkIHRvIFwidGFyZ2V0c1wiXG4gICAgU3BlZWNoU3ludGhlc2lzQWN0aW9uOiB4cy5jcmVhdGUoKSxcbiAgICBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjogeHMuY3JlYXRlKCksXG4gIH07XG4gIC8vIGNyZWF0ZSBhY3Rpb24gY29tcG9uZW50c1xuICBzb3VyY2VzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbiA9IFNwZWVjaFN5bnRoZXNpc0FjdGlvbih7XG4gICAgZ29hbDogc291cmNlcy5wcm94aWVzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbixcbiAgICBTcGVlY2hTeW50aGVzaXM6IHNvdXJjZXMuU3BlZWNoU3ludGhlc2lzLFxuICB9KTtcbiAgc291cmNlcy5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbiA9IFNwZWVjaFJlY29nbml0aW9uQWN0aW9uKHtcbiAgICBnb2FsOiBzb3VyY2VzLnByb3hpZXMuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24sXG4gICAgU3BlZWNoUmVjb2duaXRpb246IHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb24sXG4gIH0pO1xuXG4gIFxuICAvLyBtYWluIGxvZ2ljXG4gIGNvbnN0IHN5bnRoR29hbCQgPSB4cy5vZignSGVsbG8gdGhlcmUhJykuY29tcG9zZShkZWxheSgxMDAwKSk7XG4gIGNvbnN0IHJlY29nR29hbCQgPSBzb3VyY2VzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbi5yZXN1bHQubWFwVG8oe30pO1xuXG4gIHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24ub3V0cHV0LmFkZExpc3RlbmVyKHtcbiAgICBuZXh0OiAocmVzdWx0KSA9PiBjb25zb2xlLmxvZyhgTGlzdGVuaW5nLi4uYClcbiAgfSk7XG4gIHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24ucmVzdWx0LmFkZExpc3RlbmVyKHtcbiAgICBuZXh0OiAocmVzdWx0KSA9PiBjb25zb2xlLmxvZyhgSGVhcmQgXCIke3Jlc3VsdC5yZXN1bHR9XCJgKVxuICB9KTtcblxuICBcbiAgcmV0dXJuIHtcbiAgICBTcGVlY2hTeW50aGVzaXM6IHNvdXJjZXMuU3BlZWNoU3ludGhlc2lzQWN0aW9uLm91dHB1dCxcbiAgICBTcGVlY2hSZWNvZ25pdGlvbjogc291cmNlcy5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbi5vdXRwdXQsXG4gICAgdGFyZ2V0czogeyAgLy8gd2lsbCBiZSBpbWl0YXRpbmcgXCJwcm94aWVzXCJcbiAgICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogc3ludGhHb2FsJCxcbiAgICAgIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiByZWNvZ0dvYWwkLFxuICAgIH1cbiAgfVxufVxuXG5ydW4ocG93ZXJ1cChtYWluLCAocHJveHksIHRhcmdldCkgPT4gcHJveHkuaW1pdGF0ZSh0YXJnZXQpKSwge1xuICBTcGVlY2hTeW50aGVzaXM6IG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIoKSxcbiAgU3BlZWNoUmVjb2duaXRpb246IG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcigpLFxufSk7XG4iXX0=

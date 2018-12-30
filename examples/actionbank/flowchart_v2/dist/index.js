(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = __importDefault(require("xstream"));
var isolate_1 = __importDefault(require("@cycle/isolate"));
var action_1 = require("@cycle-robot-drivers/action");
var utils_1 = require("./utils");
var makeConcurrentAction_1 = require("./makeConcurrentAction");
var QuestionAnswerAction_1 = require("./QuestionAnswerAction");
function QAWithScreenAction(sources) {
    // sources.state.stream.addListener({next: v => console.log('reducerState$', v)})
    var reducerState$ = sources.state.stream;
    var questionAnswerResult$ = reducerState$
        .compose(utils_1.selectActionResult('QuestionAnswerAction'));
    var goal$ = sources.goal
        .filter(function (g) { return typeof g !== 'undefined'; }).map(function (g) { return action_1.initGoal(g); })
        .map(function (g) { return ({
        goal_id: g.goal_id,
        goal: {
            QuestionAnswerAction: g.goal,
            TwoSpeechbubblesAction: {
                message: g.goal.question,
                choices: g.goal.answers
            },
        },
    }); });
    var RaceAction = makeConcurrentAction_1.makeConcurrentAction(['TwoSpeechbubblesAction', 'QuestionAnswerAction'], true);
    var raceSinks = isolate_1.default(RaceAction, 'RaceAction')({
        goal: goal$,
        TwoSpeechbubblesAction: sources.TwoSpeechbubblesAction,
        QuestionAnswerAction: { result: questionAnswerResult$ },
        state: sources.state,
    });
    // raceSinks.result.addListener({next: v => console.log('raceSinks.result', v)});
    var qaSinks = isolate_1.default(QuestionAnswerAction_1.QuestionAnswerAction, 'QuestionAnswerAction')({
        goal: raceSinks.QuestionAnswerAction,
        SpeechSynthesisAction: sources.SpeechSynthesisAction,
        SpeechRecognitionAction: sources.SpeechRecognitionAction,
        state: sources.state,
    });
    // qaSinks.result.addListener({next: v => console.log('qaSinks.result', v)});
    var reducer$ = xstream_1.default.merge(raceSinks.state, qaSinks.state);
    return {
        result: raceSinks.result,
        TwoSpeechbubblesAction: raceSinks.TwoSpeechbubblesAction,
        SpeechSynthesisAction: qaSinks.SpeechSynthesisAction,
        SpeechRecognitionAction: qaSinks.SpeechRecognitionAction,
        state: reducer$,
    };
}
exports.QAWithScreenAction = QAWithScreenAction;

},{"./QuestionAnswerAction":2,"./makeConcurrentAction":5,"./utils":6,"@cycle-robot-drivers/action":7,"@cycle/isolate":10,"xstream":15}],2:[function(require,module,exports){
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
var action_1 = require("@cycle-robot-drivers/action");
// FSM types
var S;
(function (S) {
    S["PEND"] = "PEND";
    S["ASK"] = "ASK";
    S["LISTEN"] = "LISTEN";
})(S = exports.S || (exports.S = {}));
var SIGType;
(function (SIGType) {
    SIGType["GOAL"] = "GOAL";
    SIGType["CANCEL"] = "CANCEL";
    SIGType["ASK_DONE"] = "ASK_DONE";
    SIGType["VALID_RESPONSE"] = "VALID_RESPONSE";
    SIGType["INVALID_RESPONSE"] = "INVALID_RESPONSE";
})(SIGType = exports.SIGType || (exports.SIGType = {}));
;
function input(goal$, speechSynthesisResult$, speechRecognitionResult$) {
    return xstream_1.default.merge(goal$.filter(function (g) { return typeof g !== 'undefined'; }).map(function (g) { return (g === null)
        ? ({ type: SIGType.CANCEL, value: null })
        : ({ type: SIGType.GOAL, value: action_1.initGoal(g) }); }), speechSynthesisResult$
        .filter(function (result) { return result.status.status === 'SUCCEEDED'; })
        .mapTo({ type: SIGType.ASK_DONE }), speechRecognitionResult$
        .filter(function (result) {
        return result.status.status === 'SUCCEEDED';
    }).map(function (result) { return ({
        type: SIGType.VALID_RESPONSE,
        value: result.result,
    }); }), speechRecognitionResult$
        .filter(function (result) {
        return result.status.status !== 'SUCCEEDED';
    }).mapTo({ type: SIGType.INVALID_RESPONSE }));
}
function reducer(input$) {
    var initReducer$ = xstream_1.default.of(function (prev) {
        if (typeof prev === 'undefined') {
            return {
                state: S.PEND,
                variables: null,
                outputs: null,
            };
        }
        else {
            return prev;
        }
    });
    var transitionReducer$ = input$.map(function (input) { return function (prev) {
        console.debug('input', input, 'prev', prev);
        if (prev.state === S.PEND && input.type === SIGType.GOAL) {
            return {
                state: S.ASK,
                variables: {
                    goal_id: input.value.goal_id,
                    question: input.value.goal.question,
                    answers: input.value.goal.answers,
                },
                outputs: { SpeechSynthesisAction: { goal: input.value.goal.question } },
            };
        }
        else if (prev.state !== S.PEND && input.type === SIGType.GOAL) {
            return {
                state: S.ASK,
                variables: {
                    goal_id: input.value.goal_id,
                    question: input.value.goal.question,
                    answers: input.value.goal.answers,
                },
                outputs: {
                    result: {
                        status: {
                            goal_id: prev.variables.goal_id,
                            status: action_1.Status.PREEMPTED,
                        },
                        result: null,
                    },
                    SpeechSynthesisAction: { goal: input.value.goal.question },
                    SpeechRecognitionAction: { goal: null },
                },
            };
        }
        else if (prev.state !== S.PEND && input.type === SIGType.CANCEL) {
            return {
                state: S.PEND,
                variables: null,
                outputs: {
                    result: {
                        status: {
                            goal_id: prev.variables.goal_id,
                            status: action_1.Status.PREEMPTED,
                        },
                        result: null,
                    },
                    SpeechSynthesisAction: { goal: null },
                    SpeechRecognitionAction: { goal: null },
                }
            };
        }
        else if (prev.state === S.ASK && input.type === SIGType.ASK_DONE) {
            return {
                state: S.LISTEN,
                variables: prev.variables,
                outputs: { SpeechRecognitionAction: { goal: {} } },
            };
        }
        else if (prev.state === S.LISTEN && input.type === SIGType.VALID_RESPONSE) {
            // this matching logic must be delegated to the recognizer
            var matched = prev.variables.answers
                .filter(function (a) { return a.toLowerCase() === input.value; });
            return (matched.length > 0 ? {
                state: S.PEND,
                variables: null,
                outputs: {
                    result: {
                        status: {
                            goal_id: prev.variables.goal_id,
                            status: action_1.Status.SUCCEEDED,
                        },
                        result: matched[0],
                    },
                },
            } : {
                state: prev.state,
                variables: prev.variables,
                outputs: { SpeechRecognitionAction: { goal: {} } },
            });
        }
        else if (prev.state === S.LISTEN && input.type === SIGType.INVALID_RESPONSE) {
            return {
                state: prev.state,
                variables: prev.variables,
                outputs: { SpeechRecognitionAction: { goal: {} } },
            };
        }
        ;
        return prev;
    }; });
    return xstream_1.default.merge(initReducer$, transitionReducer$);
}
function output(reducerState$) {
    var outputs$ = reducerState$
        .filter(function (m) { return !!m.outputs; })
        .map(function (m) { return m.outputs; });
    return {
        result: outputs$
            .filter(function (o) { return !!o.result; })
            .map(function (o) { return o.result; }),
        SpeechSynthesisAction: outputs$
            .filter(function (o) { return !!o.SpeechSynthesisAction; })
            .map(function (o) { return o.SpeechSynthesisAction.goal; }),
        SpeechRecognitionAction: outputs$
            .filter(function (o) { return !!o.SpeechRecognitionAction; })
            .map(function (o) { return o.SpeechRecognitionAction.goal; }),
    };
}
function QuestionAnswerAction(sources) {
    var reducerState$ = sources.state.stream;
    var input$ = input(sources.goal, sources.SpeechSynthesisAction.result, sources.SpeechRecognitionAction.result);
    var reducer$ = reducer(input$);
    var outputs = output(reducerState$);
    return __assign({}, outputs, { state: reducer$ });
}
exports.QuestionAnswerAction = QuestionAnswerAction;

},{"@cycle-robot-drivers/action":7,"xstream":15}],3:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var isolate_1 = __importDefault(require("@cycle/isolate"));
var action_1 = require("@cycle-robot-drivers/action");
var makeConcurrentAction_1 = require("./makeConcurrentAction");
function SpeakWithScreenAction(sources) {
    sources.state.stream.addListener({ next: function (v) { return console.log('reducerState$', v); } });
    var goal$ = sources.goal
        .filter(function (g) { return typeof g !== 'undefined'; }).map(function (g) { return action_1.initGoal(g); })
        .map(function (g) { return ({
        goal_id: g.goal_id,
        goal: {
            TwoSpeechbubblesAction: g.goal,
            SpeechSynthesisAction: g.goal,
        },
    }); });
    var RaceAction = makeConcurrentAction_1.makeConcurrentAction(['TwoSpeechbubblesAction', 'SpeechSynthesisAction'], false);
    var raceSinks = isolate_1.default(RaceAction, 'RaceAction')({
        goal: goal$,
        TwoSpeechbubblesAction: sources.TwoSpeechbubblesAction,
        SpeechSynthesisAction: sources.SpeechSynthesisAction,
        state: sources.state,
    });
    // raceSinks.result.addListener({next: v => console.log('raceSinks.result', v)});
    var reducer$ = raceSinks.state;
    return {
        result: raceSinks.result,
        TwoSpeechbubblesAction: raceSinks.TwoSpeechbubblesAction,
        SpeechSynthesisAction: raceSinks.SpeechSynthesisAction,
        state: reducer$,
    };
}
exports.SpeakWithScreenAction = SpeakWithScreenAction;

},{"./makeConcurrentAction":5,"@cycle-robot-drivers/action":7,"@cycle/isolate":10}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
exports.selectActionResult = utils_1.selectActionResult;
var makeConcurrentAction_1 = require("./makeConcurrentAction");
exports.makeConcurrentAction = makeConcurrentAction_1.makeConcurrentAction;
var SpeakWithScreenAction_1 = require("./SpeakWithScreenAction");
exports.SpeakWithScreenAction = SpeakWithScreenAction_1.SpeakWithScreenAction;
var QuestionAnswerAction_1 = require("./QuestionAnswerAction");
exports.QuestionAnswerAction = QuestionAnswerAction_1.QuestionAnswerAction;
var QAWithScreenAction_1 = require("./QAWithScreenAction");
exports.QAWithScreenAction = QAWithScreenAction_1.QAWithScreenAction;

},{"./QAWithScreenAction":1,"./QuestionAnswerAction":2,"./SpeakWithScreenAction":3,"./makeConcurrentAction":5,"./utils":6}],5:[function(require,module,exports){
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
var action_1 = require("@cycle-robot-drivers/action");
// FSM types
var S;
(function (S) {
    S["PEND"] = "PEND";
    S["RUN"] = "RUN";
})(S = exports.S || (exports.S = {}));
var SIGType;
(function (SIGType) {
    SIGType["GOAL"] = "GOAL";
    SIGType["CANCEL"] = "CANCEL";
    SIGType["RESULTS"] = "RESULTS";
})(SIGType = exports.SIGType || (exports.SIGType = {}));
function makeConcurrentAction(actionNames, isRace) {
    if (actionNames === void 0) { actionNames = []; }
    if (isRace === void 0) { isRace = false; }
    var input = function (goal$, results) {
        var results$ = xstream_1.default.combine.apply(null, results);
        return xstream_1.default.merge(goal$.filter(function (g) { return typeof g !== 'undefined'; }).map(function (g) { return (g === null)
            ? ({ type: SIGType.CANCEL, value: null })
            : ({ type: SIGType.GOAL, value: action_1.initGoal(g) }); }), results$.map(function (r) { return ({ type: SIGType.RESULTS, value: r }); }));
    };
    var reducer = function (input$) {
        var initReducer$ = xstream_1.default.of(function (prev) {
            if (typeof prev === 'undefined') {
                return {
                    state: S.PEND,
                    variables: null,
                    outputs: null,
                };
            }
            else {
                return prev;
            }
        });
        var transitionReducer$ = input$.map(function (input) { return function (prev) {
            console.debug('input', input, 'prev', prev);
            if (prev.state === S.PEND && input.type === SIGType.GOAL) {
                var outputs = Object.keys(input.value.goal).reduce(function (acc, x) {
                    acc[x] = { goal: {
                            goal_id: input.value.goal_id,
                            goal: input.value.goal[x]
                        } };
                    return acc;
                }, {});
                return {
                    state: S.RUN,
                    variables: {
                        goal_id: input.value.goal_id,
                    },
                    outputs: outputs,
                };
            }
            else if (prev.state === S.RUN && input.type === SIGType.GOAL) {
                var outputs = Object.keys(input.value.goal).reduce(function (acc, x) {
                    acc[x] = { goal: {
                            goal_id: input.value.goal_id,
                            goal: input.value.goal[x]
                        } };
                    return acc;
                }, {});
                return {
                    state: S.RUN,
                    variables: {
                        goal_id: input.value.goal_id,
                    },
                    outputs: __assign({}, outputs, { result: {
                            status: {
                                goal_id: prev.variables.goal_id,
                                status: action_1.Status.PREEMPTED,
                            },
                            result: null,
                        } }),
                };
            }
            else if (prev.state === S.RUN && input.type === SIGType.RESULTS) {
                var results = input.value;
                if (!isRace
                    && results
                        .every(function (r) { return action_1.isEqual(r.status.goal_id, prev.variables.goal_id); })
                    && results
                        .every(function (r) { return r.status.status === action_1.Status.SUCCEEDED; })) {
                    return __assign({}, prev, { state: S.PEND, variables: null, outputs: {
                            result: {
                                status: {
                                    goal_id: prev.variables.goal_id,
                                    status: action_1.Status.SUCCEEDED,
                                },
                                result: input.value,
                            },
                        } });
                }
                else if (!!isRace
                    && results
                        .some(function (r) { return (action_1.isEqual(r.status.goal_id, prev.variables.goal_id)
                        && r.status.status === action_1.Status.SUCCEEDED); })) {
                    var result = results.filter(function (r) { return (action_1.isEqual(r.status.goal_id, prev.variables.goal_id)
                        && r.status.status === action_1.Status.SUCCEEDED); })[0]; // break the tie here
                    return {
                        state: S.PEND,
                        variables: null,
                        outputs: {
                            result: {
                                status: {
                                    goal_id: prev.variables.goal_id,
                                    status: action_1.Status.SUCCEEDED,
                                },
                                result: result.result,
                            },
                        },
                    };
                }
            }
            return prev;
        }; });
        return xstream_1.default.merge(initReducer$, transitionReducer$);
    };
    var output = function (reducerState$) {
        var outputs$ = reducerState$
            .filter(function (m) { return !!m.outputs; })
            .map(function (m) { return m.outputs; });
        return actionNames.reduce(function (acc, x) {
            acc[x] = outputs$
                .filter(function (o) { return !!o[x]; })
                .map(function (o) { return o[x].goal; });
            return acc;
        }, {
            result: outputs$
                .filter(function (o) { return !!o.result; })
                .map(function (o) { return o.result; })
        });
    };
    return function ConcurrentAction(sources) {
        var reducerState$ = sources.state.stream;
        var createDummyResult = function () { return ({
            status: {
                goal_id: action_1.generateGoalID(),
                status: action_1.Status.SUCCEEDED,
            },
            result: null,
        }); };
        var results = actionNames
            .map(function (x) { return sources[x].result.startWith(createDummyResult()); });
        var input$ = input(sources.goal, results);
        var reducer$ = reducer(input$);
        var outputs = output(reducerState$);
        return __assign({}, outputs, { state: reducer$ });
    };
}
exports.makeConcurrentAction = makeConcurrentAction;

},{"@cycle-robot-drivers/action":7,"xstream":15}],6:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dropRepeats_1 = __importDefault(require("xstream/extra/dropRepeats"));
var action_1 = require("@cycle-robot-drivers/action");
exports.selectActionResult = function (actionName) {
    return function (in$) { return in$
        .filter(function (s) { return !!s
        && !!s[actionName]
        && !!s[actionName].outputs
        && !!s[actionName].outputs.result; })
        .map(function (s) { return s[actionName].outputs.result; })
        .compose(dropRepeats_1.default(action_1.isEqualResult)); };
};

},{"@cycle-robot-drivers/action":7,"xstream/extra/dropRepeats":14}],7:[function(require,module,exports){
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

},{"./types":8,"./utils":9}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":11,"xstream":15}],11:[function(require,module,exports){
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

},{"./ponyfill.js":13}],13:[function(require,module,exports){
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
},{}],14:[function(require,module,exports){
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

},{"../index":15}],15:[function(require,module,exports){
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

},{"symbol-observable":12}],16:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"./types":17,"./utils":18,"dup":7}],17:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],18:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("@cycle/run/lib/adapt");
var fromEvent_1 = require("./fromEvent");
var BodyDOMSource = /** @class */ (function () {
    function BodyDOMSource(_name) {
        this._name = _name;
    }
    BodyDOMSource.prototype.select = function (selector) {
        // This functionality is still undefined/undecided.
        return this;
    };
    BodyDOMSource.prototype.elements = function () {
        var out = adapt_1.adapt(xstream_1.default.of([document.body]));
        out._isCycleSource = this._name;
        return out;
    };
    BodyDOMSource.prototype.element = function () {
        var out = adapt_1.adapt(xstream_1.default.of(document.body));
        out._isCycleSource = this._name;
        return out;
    };
    BodyDOMSource.prototype.events = function (eventType, options, bubbles) {
        if (options === void 0) { options = {}; }
        var stream;
        stream = fromEvent_1.fromEvent(document.body, eventType, options.useCapture, options.preventDefault);
        var out = adapt_1.adapt(stream);
        out._isCycleSource = this._name;
        return out;
    };
    return BodyDOMSource;
}());
exports.BodyDOMSource = BodyDOMSource;

},{"./fromEvent":30,"@cycle/run/lib/adapt":41,"xstream":83}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("@cycle/run/lib/adapt");
var fromEvent_1 = require("./fromEvent");
var DocumentDOMSource = /** @class */ (function () {
    function DocumentDOMSource(_name) {
        this._name = _name;
    }
    DocumentDOMSource.prototype.select = function (selector) {
        // This functionality is still undefined/undecided.
        return this;
    };
    DocumentDOMSource.prototype.elements = function () {
        var out = adapt_1.adapt(xstream_1.default.of([document]));
        out._isCycleSource = this._name;
        return out;
    };
    DocumentDOMSource.prototype.element = function () {
        var out = adapt_1.adapt(xstream_1.default.of(document));
        out._isCycleSource = this._name;
        return out;
    };
    DocumentDOMSource.prototype.events = function (eventType, options, bubbles) {
        if (options === void 0) { options = {}; }
        var stream;
        stream = fromEvent_1.fromEvent(document, eventType, options.useCapture, options.preventDefault);
        var out = adapt_1.adapt(stream);
        out._isCycleSource = this._name;
        return out;
    };
    return DocumentDOMSource;
}());
exports.DocumentDOMSource = DocumentDOMSource;

},{"./fromEvent":30,"@cycle/run/lib/adapt":41,"xstream":83}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ScopeChecker_1 = require("./ScopeChecker");
var utils_1 = require("./utils");
function toElArray(input) {
    return Array.prototype.slice.call(input);
}
var ElementFinder = /** @class */ (function () {
    function ElementFinder(namespace, isolateModule) {
        this.namespace = namespace;
        this.isolateModule = isolateModule;
    }
    ElementFinder.prototype.call = function () {
        var namespace = this.namespace;
        var selector = utils_1.getSelectors(namespace);
        var scopeChecker = new ScopeChecker_1.ScopeChecker(namespace, this.isolateModule);
        var topNode = this.isolateModule.getElement(namespace.filter(function (n) { return n.type !== 'selector'; }));
        if (topNode === undefined) {
            return [];
        }
        if (selector === '') {
            return [topNode];
        }
        return toElArray(topNode.querySelectorAll(selector))
            .filter(scopeChecker.isDirectlyInScope, scopeChecker)
            .concat(topNode.matches(selector) ? [topNode] : []);
    };
    return ElementFinder;
}());
exports.ElementFinder = ElementFinder;

},{"./ScopeChecker":27,"./utils":38}],22:[function(require,module,exports){
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
var ScopeChecker_1 = require("./ScopeChecker");
var utils_1 = require("./utils");
var ElementFinder_1 = require("./ElementFinder");
var SymbolTree_1 = require("./SymbolTree");
var RemovalSet_1 = require("./RemovalSet");
var PriorityQueue_1 = require("./PriorityQueue");
var fromEvent_1 = require("./fromEvent");
exports.eventTypesThatDontBubble = [
    "blur",
    "canplay",
    "canplaythrough",
    "durationchange",
    "emptied",
    "ended",
    "focus",
    "load",
    "loadeddata",
    "loadedmetadata",
    "mouseenter",
    "mouseleave",
    "pause",
    "play",
    "playing",
    "ratechange",
    "reset",
    "scroll",
    "seeked",
    "seeking",
    "stalled",
    "submit",
    "suspend",
    "timeupdate",
    "unload",
    "volumechange",
    "waiting",
];
/**
 * Manages "Event delegation", by connecting an origin with multiple
 * destinations.
 *
 * Attaches a DOM event listener to the DOM element called the "origin",
 * and delegates events to "destinations", which are subjects as outputs
 * for the DOMSource. Simulates bubbling or capturing, with regards to
 * isolation boundaries too.
 */
var EventDelegator = /** @class */ (function () {
    function EventDelegator(rootElement$, isolateModule) {
        var _this = this;
        this.rootElement$ = rootElement$;
        this.isolateModule = isolateModule;
        this.virtualListeners = new SymbolTree_1.default(function (x) { return x.scope; });
        this.nonBubblingListenersToAdd = new RemovalSet_1.default();
        this.virtualNonBubblingListener = [];
        this.isolateModule.setEventDelegator(this);
        this.domListeners = new Map();
        this.domListenersToAdd = new Map();
        this.nonBubblingListeners = new Map();
        rootElement$.addListener({
            next: function (el) {
                if (_this.origin !== el) {
                    _this.origin = el;
                    _this.resetEventListeners();
                    _this.domListenersToAdd.forEach(function (passive, type) {
                        return _this.setupDOMListener(type, passive);
                    });
                    _this.domListenersToAdd.clear();
                }
                _this.resetNonBubblingListeners();
                _this.nonBubblingListenersToAdd.forEach(function (arr) {
                    _this.setupNonBubblingListener(arr);
                });
            },
        });
    }
    EventDelegator.prototype.addEventListener = function (eventType, namespace, options, bubbles) {
        var subject = xstream_1.default.never();
        var scopeChecker = new ScopeChecker_1.ScopeChecker(namespace, this.isolateModule);
        var dest = this.insertListener(subject, scopeChecker, eventType, options);
        var shouldBubble = bubbles === undefined
            ? exports.eventTypesThatDontBubble.indexOf(eventType) === -1
            : bubbles;
        if (shouldBubble) {
            if (!this.domListeners.has(eventType)) {
                this.setupDOMListener(eventType, !!options.passive);
            }
        }
        else {
            var finder = new ElementFinder_1.ElementFinder(namespace, this.isolateModule);
            this.setupNonBubblingListener([eventType, finder, dest]);
        }
        return subject;
    };
    EventDelegator.prototype.removeElement = function (element, namespace) {
        if (namespace !== undefined) {
            this.virtualListeners.delete(namespace);
        }
        var toRemove = [];
        this.nonBubblingListeners.forEach(function (map, type) {
            if (map.has(element)) {
                toRemove.push([type, element]);
            }
        });
        for (var i = 0; i < toRemove.length; i++) {
            var map = this.nonBubblingListeners.get(toRemove[i][0]);
            if (!map) {
                continue;
            }
            map.delete(toRemove[i][1]);
            if (map.size === 0) {
                this.nonBubblingListeners.delete(toRemove[i][0]);
            }
            else {
                this.nonBubblingListeners.set(toRemove[i][0], map);
            }
        }
    };
    EventDelegator.prototype.insertListener = function (subject, scopeChecker, eventType, options) {
        var relevantSets = [];
        var n = scopeChecker._namespace;
        var max = n.length;
        do {
            relevantSets.push(this.getVirtualListeners(eventType, n, true, max));
            max--;
        } while (max >= 0 && n[max].type !== 'total');
        var destination = __assign({}, options, { scopeChecker: scopeChecker,
            subject: subject, bubbles: !!options.bubbles, useCapture: !!options.useCapture, passive: !!options.passive });
        for (var i = 0; i < relevantSets.length; i++) {
            relevantSets[i].add(destination, n.length);
        }
        return destination;
    };
    /**
     * Returns a set of all virtual listeners in the scope of the namespace
     * Set `exact` to true to treat sibiling isolated scopes as total scopes
     */
    EventDelegator.prototype.getVirtualListeners = function (eventType, namespace, exact, max) {
        if (exact === void 0) { exact = false; }
        var _max = max !== undefined ? max : namespace.length;
        if (!exact) {
            for (var i = _max - 1; i >= 0; i--) {
                if (namespace[i].type === 'total') {
                    _max = i + 1;
                    break;
                }
                _max = i;
            }
        }
        var map = this.virtualListeners.getDefault(namespace, function () { return new Map(); }, _max);
        if (!map.has(eventType)) {
            map.set(eventType, new PriorityQueue_1.default());
        }
        return map.get(eventType);
    };
    EventDelegator.prototype.setupDOMListener = function (eventType, passive) {
        var _this = this;
        if (this.origin) {
            var sub = fromEvent_1.fromEvent(this.origin, eventType, false, false, passive).subscribe({
                next: function (event) { return _this.onEvent(eventType, event, passive); },
                error: function () { },
                complete: function () { },
            });
            this.domListeners.set(eventType, { sub: sub, passive: passive });
        }
        else {
            this.domListenersToAdd.set(eventType, passive);
        }
    };
    EventDelegator.prototype.setupNonBubblingListener = function (input) {
        var _this = this;
        var eventType = input[0], elementFinder = input[1], destination = input[2];
        if (!this.origin) {
            this.nonBubblingListenersToAdd.add(input);
            return;
        }
        var element = elementFinder.call()[0];
        if (element) {
            this.nonBubblingListenersToAdd.delete(input);
            var sub = fromEvent_1.fromEvent(element, eventType, false, false, destination.passive).subscribe({
                next: function (ev) { return _this.onEvent(eventType, ev, !!destination.passive, false); },
                error: function () { },
                complete: function () { },
            });
            if (!this.nonBubblingListeners.has(eventType)) {
                this.nonBubblingListeners.set(eventType, new Map());
            }
            var map = this.nonBubblingListeners.get(eventType);
            if (!map) {
                return;
            }
            map.set(element, { sub: sub, destination: destination });
        }
        else {
            this.nonBubblingListenersToAdd.add(input);
        }
    };
    EventDelegator.prototype.resetEventListeners = function () {
        var iter = this.domListeners.entries();
        var curr = iter.next();
        while (!curr.done) {
            var _a = curr.value, type = _a[0], _b = _a[1], sub = _b.sub, passive = _b.passive;
            sub.unsubscribe();
            this.setupDOMListener(type, passive);
            curr = iter.next();
        }
    };
    EventDelegator.prototype.resetNonBubblingListeners = function () {
        var _this = this;
        var newMap = new Map();
        var insert = utils_1.makeInsert(newMap);
        this.nonBubblingListeners.forEach(function (map, type) {
            map.forEach(function (value, elm) {
                if (!document.body.contains(elm)) {
                    var sub = value.sub, destination_1 = value.destination;
                    if (sub) {
                        sub.unsubscribe();
                    }
                    var elementFinder = new ElementFinder_1.ElementFinder(destination_1.scopeChecker.namespace, _this.isolateModule);
                    var newElm = elementFinder.call()[0];
                    var newSub = fromEvent_1.fromEvent(newElm, type, false, false, destination_1.passive).subscribe({
                        next: function (event) {
                            return _this.onEvent(type, event, !!destination_1.passive, false);
                        },
                        error: function () { },
                        complete: function () { },
                    });
                    insert(type, newElm, { sub: newSub, destination: destination_1 });
                }
                else {
                    insert(type, elm, value);
                }
            });
            _this.nonBubblingListeners = newMap;
        });
    };
    EventDelegator.prototype.putNonBubblingListener = function (eventType, elm, useCapture, passive) {
        var map = this.nonBubblingListeners.get(eventType);
        if (!map) {
            return;
        }
        var listener = map.get(elm);
        if (listener &&
            listener.destination.passive === passive &&
            listener.destination.useCapture === useCapture) {
            this.virtualNonBubblingListener[0] = listener.destination;
        }
    };
    EventDelegator.prototype.onEvent = function (eventType, event, passive, bubbles) {
        if (bubbles === void 0) { bubbles = true; }
        var cycleEvent = this.patchEvent(event);
        var rootElement = this.isolateModule.getRootElement(event.target);
        if (bubbles) {
            var namespace = this.isolateModule.getNamespace(event.target);
            if (!namespace) {
                return;
            }
            var listeners = this.getVirtualListeners(eventType, namespace);
            this.bubble(eventType, event.target, rootElement, cycleEvent, listeners, namespace, namespace.length - 1, true, passive);
            this.bubble(eventType, event.target, rootElement, cycleEvent, listeners, namespace, namespace.length - 1, false, passive);
        }
        else {
            this.putNonBubblingListener(eventType, event.target, true, passive);
            this.doBubbleStep(eventType, event.target, rootElement, cycleEvent, this.virtualNonBubblingListener, true, passive);
            this.putNonBubblingListener(eventType, event.target, false, passive);
            this.doBubbleStep(eventType, event.target, rootElement, cycleEvent, this.virtualNonBubblingListener, false, passive);
            event.stopPropagation(); //fix reset event (spec'ed as non-bubbling, but bubbles in reality
        }
    };
    EventDelegator.prototype.bubble = function (eventType, elm, rootElement, event, listeners, namespace, index, useCapture, passive) {
        if (!useCapture && !event.propagationHasBeenStopped) {
            this.doBubbleStep(eventType, elm, rootElement, event, listeners, useCapture, passive);
        }
        var newRoot = rootElement;
        var newIndex = index;
        if (elm === rootElement) {
            if (index >= 0 && namespace[index].type === 'sibling') {
                newRoot = this.isolateModule.getElement(namespace, index);
                newIndex--;
            }
            else {
                return;
            }
        }
        if (elm.parentNode && newRoot) {
            this.bubble(eventType, elm.parentNode, newRoot, event, listeners, namespace, newIndex, useCapture, passive);
        }
        if (useCapture && !event.propagationHasBeenStopped) {
            this.doBubbleStep(eventType, elm, rootElement, event, listeners, useCapture, passive);
        }
    };
    EventDelegator.prototype.doBubbleStep = function (eventType, elm, rootElement, event, listeners, useCapture, passive) {
        if (!rootElement) {
            return;
        }
        this.mutateEventCurrentTarget(event, elm);
        listeners.forEach(function (dest) {
            if (dest.passive === passive && dest.useCapture === useCapture) {
                var sel = utils_1.getSelectors(dest.scopeChecker.namespace);
                if (!event.propagationHasBeenStopped &&
                    dest.scopeChecker.isDirectlyInScope(elm) &&
                    ((sel !== '' && elm.matches(sel)) ||
                        (sel === '' && elm === rootElement))) {
                    fromEvent_1.preventDefaultConditional(event, dest.preventDefault);
                    dest.subject.shamefullySendNext(event);
                }
            }
        });
    };
    EventDelegator.prototype.patchEvent = function (event) {
        var pEvent = event;
        pEvent.propagationHasBeenStopped = false;
        var oldStopPropagation = pEvent.stopPropagation;
        pEvent.stopPropagation = function stopPropagation() {
            oldStopPropagation.call(this);
            this.propagationHasBeenStopped = true;
        };
        return pEvent;
    };
    EventDelegator.prototype.mutateEventCurrentTarget = function (event, currentTargetElement) {
        try {
            Object.defineProperty(event, "currentTarget", {
                value: currentTargetElement,
                configurable: true,
            });
        }
        catch (err) {
            console.log("please use event.ownerTarget");
        }
        event.ownerTarget = currentTargetElement;
    };
    return EventDelegator;
}());
exports.EventDelegator = EventDelegator;

},{"./ElementFinder":21,"./PriorityQueue":25,"./RemovalSet":26,"./ScopeChecker":27,"./SymbolTree":28,"./fromEvent":30,"./utils":38,"xstream":83}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var SymbolTree_1 = require("./SymbolTree");
var IsolateModule = /** @class */ (function () {
    function IsolateModule() {
        this.namespaceTree = new SymbolTree_1.default(function (x) { return x.scope; });
        this.namespaceByElement = new Map();
        this.vnodesBeingRemoved = [];
    }
    IsolateModule.prototype.setEventDelegator = function (del) {
        this.eventDelegator = del;
    };
    IsolateModule.prototype.insertElement = function (namespace, el) {
        this.namespaceByElement.set(el, namespace);
        this.namespaceTree.set(namespace, el);
    };
    IsolateModule.prototype.removeElement = function (elm) {
        this.namespaceByElement.delete(elm);
        var namespace = this.getNamespace(elm);
        if (namespace) {
            this.namespaceTree.delete(namespace);
        }
    };
    IsolateModule.prototype.getElement = function (namespace, max) {
        return this.namespaceTree.get(namespace, undefined, max);
    };
    IsolateModule.prototype.getRootElement = function (elm) {
        if (this.namespaceByElement.has(elm)) {
            return elm;
        }
        //TODO: Add quick-lru or similar as additional O(1) cache
        var curr = elm;
        while (!this.namespaceByElement.has(curr)) {
            curr = curr.parentNode;
            if (!curr) {
                return undefined;
            }
            else if (curr.tagName === 'HTML') {
                throw new Error('No root element found, this should not happen at all');
            }
        }
        return curr;
    };
    IsolateModule.prototype.getNamespace = function (elm) {
        var rootElement = this.getRootElement(elm);
        if (!rootElement) {
            return undefined;
        }
        return this.namespaceByElement.get(rootElement);
    };
    IsolateModule.prototype.createModule = function () {
        var self = this;
        return {
            create: function (emptyVNode, vNode) {
                var elm = vNode.elm, _a = vNode.data, data = _a === void 0 ? {} : _a;
                var namespace = data.isolate;
                if (Array.isArray(namespace)) {
                    self.insertElement(namespace, elm);
                }
            },
            update: function (oldVNode, vNode) {
                var oldElm = oldVNode.elm, _a = oldVNode.data, oldData = _a === void 0 ? {} : _a;
                var elm = vNode.elm, _b = vNode.data, data = _b === void 0 ? {} : _b;
                var oldNamespace = oldData.isolate;
                var namespace = data.isolate;
                if (!utils_1.isEqualNamespace(oldNamespace, namespace)) {
                    if (Array.isArray(oldNamespace)) {
                        self.removeElement(oldElm);
                    }
                }
                if (Array.isArray(namespace)) {
                    self.insertElement(namespace, elm);
                }
            },
            destroy: function (vNode) {
                self.vnodesBeingRemoved.push(vNode);
            },
            remove: function (vNode, cb) {
                self.vnodesBeingRemoved.push(vNode);
                cb();
            },
            post: function () {
                var vnodesBeingRemoved = self.vnodesBeingRemoved;
                for (var i = vnodesBeingRemoved.length - 1; i >= 0; i--) {
                    var vnode = vnodesBeingRemoved[i];
                    var namespace = vnode.data !== undefined
                        ? vnode.data.isolation
                        : undefined;
                    if (namespace !== undefined) {
                        self.removeElement(namespace);
                    }
                    self.eventDelegator.removeElement(vnode.elm, namespace);
                }
                self.vnodesBeingRemoved = [];
            },
        };
    };
    return IsolateModule;
}());
exports.IsolateModule = IsolateModule;

},{"./SymbolTree":28,"./utils":38}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var adapt_1 = require("@cycle/run/lib/adapt");
var DocumentDOMSource_1 = require("./DocumentDOMSource");
var BodyDOMSource_1 = require("./BodyDOMSource");
var ElementFinder_1 = require("./ElementFinder");
var isolate_1 = require("./isolate");
var MainDOMSource = /** @class */ (function () {
    function MainDOMSource(_rootElement$, _sanitation$, _namespace, _isolateModule, _eventDelegator, _name) {
        if (_namespace === void 0) { _namespace = []; }
        this._rootElement$ = _rootElement$;
        this._sanitation$ = _sanitation$;
        this._namespace = _namespace;
        this._isolateModule = _isolateModule;
        this._eventDelegator = _eventDelegator;
        this._name = _name;
        this.isolateSource = function (source, scope) {
            return new MainDOMSource(source._rootElement$, source._sanitation$, source._namespace.concat(isolate_1.getScopeObj(scope)), source._isolateModule, source._eventDelegator, source._name);
        };
        this.isolateSink = isolate_1.makeIsolateSink(this._namespace);
    }
    MainDOMSource.prototype._elements = function () {
        if (this._namespace.length === 0) {
            return this._rootElement$.map(function (x) { return [x]; });
        }
        else {
            var elementFinder_1 = new ElementFinder_1.ElementFinder(this._namespace, this._isolateModule);
            return this._rootElement$.map(function () { return elementFinder_1.call(); });
        }
    };
    MainDOMSource.prototype.elements = function () {
        var out = adapt_1.adapt(this._elements().remember());
        out._isCycleSource = this._name;
        return out;
    };
    MainDOMSource.prototype.element = function () {
        var out = adapt_1.adapt(this._elements()
            .filter(function (arr) { return arr.length > 0; })
            .map(function (arr) { return arr[0]; })
            .remember());
        out._isCycleSource = this._name;
        return out;
    };
    Object.defineProperty(MainDOMSource.prototype, "namespace", {
        get: function () {
            return this._namespace;
        },
        enumerable: true,
        configurable: true
    });
    MainDOMSource.prototype.select = function (selector) {
        if (typeof selector !== 'string') {
            throw new Error("DOM driver's select() expects the argument to be a " +
                "string as a CSS selector");
        }
        if (selector === 'document') {
            return new DocumentDOMSource_1.DocumentDOMSource(this._name);
        }
        if (selector === 'body') {
            return new BodyDOMSource_1.BodyDOMSource(this._name);
        }
        var namespace = selector === ':root'
            ? []
            : this._namespace.concat({ type: 'selector', scope: selector.trim() });
        return new MainDOMSource(this._rootElement$, this._sanitation$, namespace, this._isolateModule, this._eventDelegator, this._name);
    };
    MainDOMSource.prototype.events = function (eventType, options, bubbles) {
        if (options === void 0) { options = {}; }
        if (typeof eventType !== "string") {
            throw new Error("DOM driver's events() expects argument to be a " +
                "string representing the event type to listen for.");
        }
        var event$ = this._eventDelegator.addEventListener(eventType, this._namespace, options, bubbles);
        var out = adapt_1.adapt(event$);
        out._isCycleSource = this._name;
        return out;
    };
    MainDOMSource.prototype.dispose = function () {
        this._sanitation$.shamefullySendNext(null);
        //this._isolateModule.reset();
    };
    return MainDOMSource;
}());
exports.MainDOMSource = MainDOMSource;

},{"./BodyDOMSource":19,"./DocumentDOMSource":20,"./ElementFinder":21,"./isolate":33,"@cycle/run/lib/adapt":41}],25:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var PriorityQueue = /** @class */ (function () {
    function PriorityQueue() {
        this.arr = [];
        this.prios = [];
    }
    PriorityQueue.prototype.add = function (t, prio) {
        for (var i = 0; i < this.arr.length; i++) {
            if (this.prios[i] < prio) {
                this.arr.splice(i, 0, t);
                this.prios.splice(i, 0, prio);
                return;
            }
        }
        this.arr.push(t);
        this.prios.push(prio);
    };
    PriorityQueue.prototype.forEach = function (f) {
        for (var i = 0; i < this.arr.length; i++) {
            f(this.arr[i], i, this.arr);
        }
    };
    PriorityQueue.prototype.delete = function (t) {
        for (var i = 0; i < this.arr.length; i++) {
            if (this.arr[i] === t) {
                this.arr.splice(i, 1);
                this.prios.splice(i, 1);
                return;
            }
        }
    };
    return PriorityQueue;
}());
exports.default = PriorityQueue;

},{}],26:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RemovalSet = /** @class */ (function () {
    function RemovalSet() {
        this.toDelete = [];
        this.toDeleteSize = 0;
        this._set = new Set();
    }
    RemovalSet.prototype.add = function (t) {
        this._set.add(t);
    };
    RemovalSet.prototype.forEach = function (f) {
        this._set.forEach(f);
        this.flush();
    };
    RemovalSet.prototype.delete = function (t) {
        if (this.toDelete.length === this.toDeleteSize) {
            this.toDelete.push(t);
        }
        else {
            this.toDelete[this.toDeleteSize] = t;
        }
        this.toDeleteSize++;
    };
    RemovalSet.prototype.flush = function () {
        for (var i = 0; i < this.toDelete.length; i++) {
            if (i < this.toDeleteSize) {
                this._set.delete(this.toDelete[i]);
            }
            this.toDelete[i] = undefined;
        }
        this.toDeleteSize = 0;
    };
    return RemovalSet;
}());
exports.default = RemovalSet;

},{}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var ScopeChecker = /** @class */ (function () {
    function ScopeChecker(namespace, isolateModule) {
        this.namespace = namespace;
        this.isolateModule = isolateModule;
        this._namespace = namespace.filter(function (n) { return n.type !== 'selector'; });
    }
    /**
     * Checks whether the given element is *directly* in the scope of this
     * scope checker. Being contained *indirectly* through other scopes
     * is not valid. This is crucial for implementing parent-child isolation,
     * so that the parent selectors don't search inside a child scope.
     */
    ScopeChecker.prototype.isDirectlyInScope = function (leaf) {
        var namespace = this.isolateModule.getNamespace(leaf);
        if (!namespace) {
            return false;
        }
        if (this._namespace.length > namespace.length ||
            !utils_1.isEqualNamespace(this._namespace, namespace.slice(0, this._namespace.length))) {
            return false;
        }
        for (var i = this._namespace.length; i < namespace.length; i++) {
            if (namespace[i].type === 'total') {
                return false;
            }
        }
        return true;
    };
    return ScopeChecker;
}());
exports.ScopeChecker = ScopeChecker;

},{"./utils":38}],28:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SymbolTree = /** @class */ (function () {
    function SymbolTree(mapper) {
        this.mapper = mapper;
        this.tree = [undefined, {}];
    }
    SymbolTree.prototype.set = function (path, element, max) {
        var curr = this.tree;
        var _max = max !== undefined ? max : path.length;
        for (var i = 0; i < _max; i++) {
            var n = this.mapper(path[i]);
            var child = curr[1][n];
            if (!child) {
                child = [undefined, {}];
                curr[1][n] = child;
            }
            curr = child;
        }
        curr[0] = element;
    };
    SymbolTree.prototype.getDefault = function (path, mkDefaultElement, max) {
        return this.get(path, mkDefaultElement, max);
    };
    /**
     * Returns the payload of the path
     * If a default element creator is given, it will insert it at the path
     */
    SymbolTree.prototype.get = function (path, mkDefaultElement, max) {
        var curr = this.tree;
        var _max = max !== undefined ? max : path.length;
        for (var i = 0; i < _max; i++) {
            var n = this.mapper(path[i]);
            var child = curr[1][n];
            if (!child) {
                if (mkDefaultElement) {
                    child = [undefined, {}];
                    curr[1][n] = child;
                }
                else {
                    return undefined;
                }
            }
            curr = child;
        }
        if (mkDefaultElement && !curr[0]) {
            curr[0] = mkDefaultElement();
        }
        return curr[0];
    };
    SymbolTree.prototype.delete = function (path) {
        var curr = this.tree;
        for (var i = 0; i < path.length - 1; i++) {
            var child = curr[1][this.mapper(path[i])];
            if (!child) {
                return;
            }
            curr = child;
        }
        delete curr[1][this.mapper(path[path.length - 1])];
    };
    return SymbolTree;
}());
exports.default = SymbolTree;

},{}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("snabbdom/vnode");
var h_1 = require("snabbdom/h");
var snabbdom_selector_1 = require("snabbdom-selector");
var utils_1 = require("./utils");
var VNodeWrapper = /** @class */ (function () {
    function VNodeWrapper(rootElement) {
        this.rootElement = rootElement;
    }
    VNodeWrapper.prototype.call = function (vnode) {
        if (utils_1.isDocFrag(this.rootElement)) {
            return this.wrapDocFrag(vnode === null ? [] : [vnode]);
        }
        if (vnode === null) {
            return this.wrap([]);
        }
        var _a = snabbdom_selector_1.selectorParser(vnode), selTagName = _a.tagName, selId = _a.id;
        var vNodeClassName = snabbdom_selector_1.classNameFromVNode(vnode);
        var vNodeData = vnode.data || {};
        var vNodeDataProps = vNodeData.props || {};
        var _b = vNodeDataProps.id, vNodeId = _b === void 0 ? selId : _b;
        var isVNodeAndRootElementIdentical = typeof vNodeId === 'string' &&
            vNodeId.toUpperCase() === this.rootElement.id.toUpperCase() &&
            selTagName.toUpperCase() === this.rootElement.tagName.toUpperCase() &&
            vNodeClassName.toUpperCase() === this.rootElement.className.toUpperCase();
        if (isVNodeAndRootElementIdentical) {
            return vnode;
        }
        return this.wrap([vnode]);
    };
    VNodeWrapper.prototype.wrapDocFrag = function (children) {
        return vnode_1.vnode('', { isolate: [] }, children, undefined, this
            .rootElement);
    };
    VNodeWrapper.prototype.wrap = function (children) {
        var _a = this.rootElement, tagName = _a.tagName, id = _a.id, className = _a.className;
        var selId = id ? "#" + id : '';
        var selClass = className ? "." + className.split(" ").join(".") : '';
        var vnode = h_1.h("" + tagName.toLowerCase() + selId + selClass, {}, children);
        vnode.data = vnode.data || {};
        vnode.data.isolate = vnode.data.isolate || [];
        return vnode;
    };
    return VNodeWrapper;
}());
exports.VNodeWrapper = VNodeWrapper;

},{"./utils":38,"snabbdom-selector":57,"snabbdom/h":61,"snabbdom/vnode":72}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
function fromEvent(element, eventName, useCapture, preventDefault, passive) {
    if (useCapture === void 0) { useCapture = false; }
    if (preventDefault === void 0) { preventDefault = false; }
    if (passive === void 0) { passive = false; }
    var next = null;
    return xstream_1.Stream.create({
        start: function start(listener) {
            if (preventDefault) {
                next = function _next(event) {
                    preventDefaultConditional(event, preventDefault);
                    listener.next(event);
                };
            }
            else {
                next = function _next(event) {
                    listener.next(event);
                };
            }
            element.addEventListener(eventName, next, {
                capture: useCapture,
                passive: passive,
            });
        },
        stop: function stop() {
            element.removeEventListener(eventName, next, useCapture);
        },
    });
}
exports.fromEvent = fromEvent;
function matchObject(matcher, obj) {
    var keys = Object.keys(matcher);
    var n = keys.length;
    for (var i = 0; i < n; i++) {
        var k = keys[i];
        if (typeof matcher[k] === 'object' && typeof obj[k] === 'object') {
            if (!matchObject(matcher[k], obj[k])) {
                return false;
            }
        }
        else if (matcher[k] !== obj[k]) {
            return false;
        }
    }
    return true;
}
function preventDefaultConditional(event, preventDefault) {
    if (preventDefault) {
        if (typeof preventDefault === 'boolean') {
            event.preventDefault();
        }
        else if (isPredicate(preventDefault)) {
            if (preventDefault(event)) {
                event.preventDefault();
            }
        }
        else if (typeof preventDefault === 'object') {
            if (matchObject(preventDefault, event)) {
                event.preventDefault();
            }
        }
        else {
            throw new Error('preventDefault has to be either a boolean, predicate function or object');
        }
    }
}
exports.preventDefaultConditional = preventDefaultConditional;
function isPredicate(fn) {
    return typeof fn === 'function';
}

},{"xstream":83}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-file-line-count
var h_1 = require("snabbdom/h");
function isValidString(param) {
    return typeof param === 'string' && param.length > 0;
}
function isSelector(param) {
    return isValidString(param) && (param[0] === '.' || param[0] === '#');
}
function createTagFunction(tagName) {
    return function hyperscript(a, b, c) {
        var hasA = typeof a !== 'undefined';
        var hasB = typeof b !== 'undefined';
        var hasC = typeof c !== 'undefined';
        if (isSelector(a)) {
            if (hasB && hasC) {
                return h_1.h(tagName + a, b, c);
            }
            else if (hasB) {
                return h_1.h(tagName + a, b);
            }
            else {
                return h_1.h(tagName + a, {});
            }
        }
        else if (hasC) {
            return h_1.h(tagName + a, b, c);
        }
        else if (hasB) {
            return h_1.h(tagName, a, b);
        }
        else if (hasA) {
            return h_1.h(tagName, a);
        }
        else {
            return h_1.h(tagName, {});
        }
    };
}
var SVG_TAG_NAMES = [
    'a',
    'altGlyph',
    'altGlyphDef',
    'altGlyphItem',
    'animate',
    'animateColor',
    'animateMotion',
    'animateTransform',
    'circle',
    'clipPath',
    'colorProfile',
    'cursor',
    'defs',
    'desc',
    'ellipse',
    'feBlend',
    'feColorMatrix',
    'feComponentTransfer',
    'feComposite',
    'feConvolveMatrix',
    'feDiffuseLighting',
    'feDisplacementMap',
    'feDistantLight',
    'feFlood',
    'feFuncA',
    'feFuncB',
    'feFuncG',
    'feFuncR',
    'feGaussianBlur',
    'feImage',
    'feMerge',
    'feMergeNode',
    'feMorphology',
    'feOffset',
    'fePointLight',
    'feSpecularLighting',
    'feSpotlight',
    'feTile',
    'feTurbulence',
    'filter',
    'font',
    'fontFace',
    'fontFaceFormat',
    'fontFaceName',
    'fontFaceSrc',
    'fontFaceUri',
    'foreignObject',
    'g',
    'glyph',
    'glyphRef',
    'hkern',
    'image',
    'line',
    'linearGradient',
    'marker',
    'mask',
    'metadata',
    'missingGlyph',
    'mpath',
    'path',
    'pattern',
    'polygon',
    'polyline',
    'radialGradient',
    'rect',
    'script',
    'set',
    'stop',
    'style',
    'switch',
    'symbol',
    'text',
    'textPath',
    'title',
    'tref',
    'tspan',
    'use',
    'view',
    'vkern',
];
var svg = createTagFunction('svg');
SVG_TAG_NAMES.forEach(function (tag) {
    svg[tag] = createTagFunction(tag);
});
var TAG_NAMES = [
    'a',
    'abbr',
    'address',
    'area',
    'article',
    'aside',
    'audio',
    'b',
    'base',
    'bdi',
    'bdo',
    'blockquote',
    'body',
    'br',
    'button',
    'canvas',
    'caption',
    'cite',
    'code',
    'col',
    'colgroup',
    'dd',
    'del',
    'details',
    'dfn',
    'dir',
    'div',
    'dl',
    'dt',
    'em',
    'embed',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'head',
    'header',
    'hgroup',
    'hr',
    'html',
    'i',
    'iframe',
    'img',
    'input',
    'ins',
    'kbd',
    'keygen',
    'label',
    'legend',
    'li',
    'link',
    'main',
    'map',
    'mark',
    'menu',
    'meta',
    'nav',
    'noscript',
    'object',
    'ol',
    'optgroup',
    'option',
    'p',
    'param',
    'pre',
    'progress',
    'q',
    'rp',
    'rt',
    'ruby',
    's',
    'samp',
    'script',
    'section',
    'select',
    'small',
    'source',
    'span',
    'strong',
    'style',
    'sub',
    'summary',
    'sup',
    'table',
    'tbody',
    'td',
    'textarea',
    'tfoot',
    'th',
    'thead',
    'time',
    'title',
    'tr',
    'u',
    'ul',
    'video',
];
var exported = {
    SVG_TAG_NAMES: SVG_TAG_NAMES,
    TAG_NAMES: TAG_NAMES,
    svg: svg,
    isSelector: isSelector,
    createTagFunction: createTagFunction,
};
TAG_NAMES.forEach(function (n) {
    exported[n] = createTagFunction(n);
});
exports.default = exported;

},{"snabbdom/h":61}],32:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var thunk_1 = require("./thunk");
exports.thunk = thunk_1.thunk;
var MainDOMSource_1 = require("./MainDOMSource");
exports.MainDOMSource = MainDOMSource_1.MainDOMSource;
/**
 * A factory for the DOM driver function.
 *
 * Takes a `container` to define the target on the existing DOM which this
 * driver will operate on, and an `options` object as the second argument. The
 * input to this driver is a stream of virtual DOM objects, or in other words,
 * Snabbdom "VNode" objects. The output of this driver is a "DOMSource": a
 * collection of Observables queried with the methods `select()` and `events()`.
 *
 * **`DOMSource.select(selector)`** returns a new DOMSource with scope
 * restricted to the element(s) that matches the CSS `selector` given. To select
 * the page's `document`, use `.select('document')`. To select the container
 * element for this app, use `.select(':root')`.
 *
 * **`DOMSource.events(eventType, options)`** returns a stream of events of
 * `eventType` happening on the elements that match the current DOMSource. The
 * event object contains the `ownerTarget` property that behaves exactly like
 * `currentTarget`. The reason for this is that some browsers doesn't allow
 * `currentTarget` property to be mutated, hence a new property is created. The
 * returned stream is an *xstream* Stream if you use `@cycle/xstream-run` to run
 * your app with this driver, or it is an RxJS Observable if you use
 * `@cycle/rxjs-run`, and so forth.
 *
 * **options for DOMSource.events**
 *
 * The `options` parameter on `DOMSource.events(eventType, options)` is an
 * (optional) object with two optional fields: `useCapture` and
 * `preventDefault`.
 *
 * `useCapture` is by default `false`, except it is `true` for event types that
 * do not bubble. Read more here
 * https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
 * about the `useCapture` and its purpose.
 *
 * `preventDefault` is by default `false`, and indicates to the driver whether
 * `event.preventDefault()` should be invoked. This option can be configured in
 * three ways:
 *
 * - `{preventDefault: boolean}` to invoke preventDefault if `true`, and not
 * invoke otherwise.
 * - `{preventDefault: (ev: Event) => boolean}` for conditional invocation.
 * - `{preventDefault: NestedObject}` uses an object to be recursively compared
 * to the `Event` object. `preventDefault` is invoked when all properties on the
 * nested object match with the properties on the event object.
 *
 * Here are some examples:
 * ```typescript
 * // always prevent default
 * DOMSource.select('input').events('keydown', {
 *   preventDefault: true
 * })
 *
 * // prevent default only when `ENTER` is pressed
 * DOMSource.select('input').events('keydown', {
 *   preventDefault: e => e.keyCode === 13
 * })
 *
 * // prevent defualt when `ENTER` is pressed AND target.value is 'HELLO'
 * DOMSource.select('input').events('keydown', {
 *   preventDefault: { keyCode: 13, ownerTarget: { value: 'HELLO' } }
 * });
 * ```
 *
 * **`DOMSource.elements()`** returns a stream of arrays containing the DOM
 * elements that match the selectors in the DOMSource (e.g. from previous
 * `select(x)` calls).
 *
 * **`DOMSource.element()`** returns a stream of DOM elements. Notice that this
 * is the singular version of `.elements()`, so the stream will emit an element,
 * not an array. If there is no element that matches the selected DOMSource,
 * then the returned stream will not emit anything.
 *
 * @param {(String|HTMLElement)} container the DOM selector for the element
 * (or the element itself) to contain the rendering of the VTrees.
 * @param {DOMDriverOptions} options an object with two optional properties:
 *
 *   - `modules: array` overrides `@cycle/dom`'s default Snabbdom modules as
 *     as defined in [`src/modules.ts`](./src/modules.ts).
 * @return {Function} the DOM driver function. The function expects a stream of
 * VNode as input, and outputs the DOMSource object.
 * @function makeDOMDriver
 */
var makeDOMDriver_1 = require("./makeDOMDriver");
exports.makeDOMDriver = makeDOMDriver_1.makeDOMDriver;
/**
 * A factory function to create mocked DOMSource objects, for testing purposes.
 *
 * Takes a `mockConfig` object as argument, and returns
 * a DOMSource that can be given to any Cycle.js app that expects a DOMSource in
 * the sources, for testing.
 *
 * The `mockConfig` parameter is an object specifying selectors, eventTypes and
 * their streams. Example:
 *
 * ```js
 * const domSource = mockDOMSource({
 *   '.foo': {
 *     'click': xs.of({target: {}}),
 *     'mouseover': xs.of({target: {}}),
 *   },
 *   '.bar': {
 *     'scroll': xs.of({target: {}}),
 *     elements: xs.of({tagName: 'div'}),
 *   }
 * });
 *
 * // Usage
 * const click$ = domSource.select('.foo').events('click');
 * const element$ = domSource.select('.bar').elements();
 * ```
 *
 * The mocked DOM Source supports isolation. It has the functions `isolateSink`
 * and `isolateSource` attached to it, and performs simple isolation using
 * classNames. *isolateSink* with scope `foo` will append the class `___foo` to
 * the stream of virtual DOM nodes, and *isolateSource* with scope `foo` will
 * perform a conventional `mockedDOMSource.select('.__foo')` call.
 *
 * @param {Object} mockConfig an object where keys are selector strings
 * and values are objects. Those nested objects have `eventType` strings as keys
 * and values are streams you created.
 * @return {Object} fake DOM source object, with an API containing `select()`
 * and `events()` and `elements()` which can be used just like the DOM Driver's
 * DOMSource.
 *
 * @function mockDOMSource
 */
var mockDOMSource_1 = require("./mockDOMSource");
exports.mockDOMSource = mockDOMSource_1.mockDOMSource;
exports.MockedDOMSource = mockDOMSource_1.MockedDOMSource;
/**
 * The hyperscript function `h()` is a function to create virtual DOM objects,
 * also known as VNodes. Call
 *
 * ```js
 * h('div.myClass', {style: {color: 'red'}}, [])
 * ```
 *
 * to create a VNode that represents a `DIV` element with className `myClass`,
 * styled with red color, and no children because the `[]` array was passed. The
 * API is `h(tagOrSelector, optionalData, optionalChildrenOrText)`.
 *
 * However, usually you should use "hyperscript helpers", which are shortcut
 * functions based on hyperscript. There is one hyperscript helper function for
 * each DOM tagName, such as `h1()`, `h2()`, `div()`, `span()`, `label()`,
 * `input()`. For instance, the previous example could have been written
 * as:
 *
 * ```js
 * div('.myClass', {style: {color: 'red'}}, [])
 * ```
 *
 * There are also SVG helper functions, which apply the appropriate SVG
 * namespace to the resulting elements. `svg()` function creates the top-most
 * SVG element, and `svg.g`, `svg.polygon`, `svg.circle`, `svg.path` are for
 * SVG-specific child elements. Example:
 *
 * ```js
 * svg({attrs: {width: 150, height: 150}}, [
 *   svg.polygon({
 *     attrs: {
 *       class: 'triangle',
 *       points: '20 0 20 150 150 20'
 *     }
 *   })
 * ])
 * ```
 *
 * @function h
 */
var h_1 = require("snabbdom/h");
exports.h = h_1.h;
var hyperscript_helpers_1 = require("./hyperscript-helpers");
exports.svg = hyperscript_helpers_1.default.svg;
exports.a = hyperscript_helpers_1.default.a;
exports.abbr = hyperscript_helpers_1.default.abbr;
exports.address = hyperscript_helpers_1.default.address;
exports.area = hyperscript_helpers_1.default.area;
exports.article = hyperscript_helpers_1.default.article;
exports.aside = hyperscript_helpers_1.default.aside;
exports.audio = hyperscript_helpers_1.default.audio;
exports.b = hyperscript_helpers_1.default.b;
exports.base = hyperscript_helpers_1.default.base;
exports.bdi = hyperscript_helpers_1.default.bdi;
exports.bdo = hyperscript_helpers_1.default.bdo;
exports.blockquote = hyperscript_helpers_1.default.blockquote;
exports.body = hyperscript_helpers_1.default.body;
exports.br = hyperscript_helpers_1.default.br;
exports.button = hyperscript_helpers_1.default.button;
exports.canvas = hyperscript_helpers_1.default.canvas;
exports.caption = hyperscript_helpers_1.default.caption;
exports.cite = hyperscript_helpers_1.default.cite;
exports.code = hyperscript_helpers_1.default.code;
exports.col = hyperscript_helpers_1.default.col;
exports.colgroup = hyperscript_helpers_1.default.colgroup;
exports.dd = hyperscript_helpers_1.default.dd;
exports.del = hyperscript_helpers_1.default.del;
exports.dfn = hyperscript_helpers_1.default.dfn;
exports.dir = hyperscript_helpers_1.default.dir;
exports.div = hyperscript_helpers_1.default.div;
exports.dl = hyperscript_helpers_1.default.dl;
exports.dt = hyperscript_helpers_1.default.dt;
exports.em = hyperscript_helpers_1.default.em;
exports.embed = hyperscript_helpers_1.default.embed;
exports.fieldset = hyperscript_helpers_1.default.fieldset;
exports.figcaption = hyperscript_helpers_1.default.figcaption;
exports.figure = hyperscript_helpers_1.default.figure;
exports.footer = hyperscript_helpers_1.default.footer;
exports.form = hyperscript_helpers_1.default.form;
exports.h1 = hyperscript_helpers_1.default.h1;
exports.h2 = hyperscript_helpers_1.default.h2;
exports.h3 = hyperscript_helpers_1.default.h3;
exports.h4 = hyperscript_helpers_1.default.h4;
exports.h5 = hyperscript_helpers_1.default.h5;
exports.h6 = hyperscript_helpers_1.default.h6;
exports.head = hyperscript_helpers_1.default.head;
exports.header = hyperscript_helpers_1.default.header;
exports.hgroup = hyperscript_helpers_1.default.hgroup;
exports.hr = hyperscript_helpers_1.default.hr;
exports.html = hyperscript_helpers_1.default.html;
exports.i = hyperscript_helpers_1.default.i;
exports.iframe = hyperscript_helpers_1.default.iframe;
exports.img = hyperscript_helpers_1.default.img;
exports.input = hyperscript_helpers_1.default.input;
exports.ins = hyperscript_helpers_1.default.ins;
exports.kbd = hyperscript_helpers_1.default.kbd;
exports.keygen = hyperscript_helpers_1.default.keygen;
exports.label = hyperscript_helpers_1.default.label;
exports.legend = hyperscript_helpers_1.default.legend;
exports.li = hyperscript_helpers_1.default.li;
exports.link = hyperscript_helpers_1.default.link;
exports.main = hyperscript_helpers_1.default.main;
exports.map = hyperscript_helpers_1.default.map;
exports.mark = hyperscript_helpers_1.default.mark;
exports.menu = hyperscript_helpers_1.default.menu;
exports.meta = hyperscript_helpers_1.default.meta;
exports.nav = hyperscript_helpers_1.default.nav;
exports.noscript = hyperscript_helpers_1.default.noscript;
exports.object = hyperscript_helpers_1.default.object;
exports.ol = hyperscript_helpers_1.default.ol;
exports.optgroup = hyperscript_helpers_1.default.optgroup;
exports.option = hyperscript_helpers_1.default.option;
exports.p = hyperscript_helpers_1.default.p;
exports.param = hyperscript_helpers_1.default.param;
exports.pre = hyperscript_helpers_1.default.pre;
exports.progress = hyperscript_helpers_1.default.progress;
exports.q = hyperscript_helpers_1.default.q;
exports.rp = hyperscript_helpers_1.default.rp;
exports.rt = hyperscript_helpers_1.default.rt;
exports.ruby = hyperscript_helpers_1.default.ruby;
exports.s = hyperscript_helpers_1.default.s;
exports.samp = hyperscript_helpers_1.default.samp;
exports.script = hyperscript_helpers_1.default.script;
exports.section = hyperscript_helpers_1.default.section;
exports.select = hyperscript_helpers_1.default.select;
exports.small = hyperscript_helpers_1.default.small;
exports.source = hyperscript_helpers_1.default.source;
exports.span = hyperscript_helpers_1.default.span;
exports.strong = hyperscript_helpers_1.default.strong;
exports.style = hyperscript_helpers_1.default.style;
exports.sub = hyperscript_helpers_1.default.sub;
exports.sup = hyperscript_helpers_1.default.sup;
exports.table = hyperscript_helpers_1.default.table;
exports.tbody = hyperscript_helpers_1.default.tbody;
exports.td = hyperscript_helpers_1.default.td;
exports.textarea = hyperscript_helpers_1.default.textarea;
exports.tfoot = hyperscript_helpers_1.default.tfoot;
exports.th = hyperscript_helpers_1.default.th;
exports.thead = hyperscript_helpers_1.default.thead;
exports.title = hyperscript_helpers_1.default.title;
exports.tr = hyperscript_helpers_1.default.tr;
exports.u = hyperscript_helpers_1.default.u;
exports.ul = hyperscript_helpers_1.default.ul;
exports.video = hyperscript_helpers_1.default.video;

},{"./MainDOMSource":24,"./hyperscript-helpers":31,"./makeDOMDriver":34,"./mockDOMSource":35,"./thunk":37,"snabbdom/h":61}],33:[function(require,module,exports){
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
var utils_1 = require("./utils");
function makeIsolateSink(namespace) {
    return function (sink, scope) {
        if (scope === ':root') {
            return sink;
        }
        return sink.map(function (node) {
            if (!node) {
                return node;
            }
            var scopeObj = getScopeObj(scope);
            var newNode = __assign({}, node, { data: __assign({}, node.data, { isolate: !node.data || !Array.isArray(node.data.isolate)
                        ? namespace.concat([scopeObj])
                        : node.data.isolate }) });
            return __assign({}, newNode, { key: newNode.key !== undefined
                    ? newNode.key
                    : JSON.stringify(newNode.data.isolate) });
        });
    };
}
exports.makeIsolateSink = makeIsolateSink;
function getScopeObj(scope) {
    return {
        type: utils_1.isClassOrId(scope) ? 'sibling' : 'total',
        scope: scope,
    };
}
exports.getScopeObj = getScopeObj;

},{"./utils":38}],34:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var snabbdom_1 = require("snabbdom");
var xstream_1 = require("xstream");
var concat_1 = require("xstream/extra/concat");
var sampleCombine_1 = require("xstream/extra/sampleCombine");
var MainDOMSource_1 = require("./MainDOMSource");
var tovnode_1 = require("snabbdom/tovnode");
var VNodeWrapper_1 = require("./VNodeWrapper");
var utils_1 = require("./utils");
var modules_1 = require("./modules");
var IsolateModule_1 = require("./IsolateModule");
var EventDelegator_1 = require("./EventDelegator");
function makeDOMDriverInputGuard(modules) {
    if (!Array.isArray(modules)) {
        throw new Error("Optional modules option must be an array for snabbdom modules");
    }
}
function domDriverInputGuard(view$) {
    if (!view$ ||
        typeof view$.addListener !== "function" ||
        typeof view$.fold !== "function") {
        throw new Error("The DOM driver function expects as input a Stream of " +
            "virtual DOM elements");
    }
}
function dropCompletion(input) {
    return xstream_1.default.merge(input, xstream_1.default.never());
}
function unwrapElementFromVNode(vnode) {
    return vnode.elm;
}
function reportSnabbdomError(err) {
    (console.error || console.log)(err);
}
function makeDOMReady$() {
    return xstream_1.default.create({
        start: function (lis) {
            if (document.readyState === 'loading') {
                document.addEventListener('readystatechange', function () {
                    var state = document.readyState;
                    if (state === 'interactive' || state === 'complete') {
                        lis.next(null);
                        lis.complete();
                    }
                });
            }
            else {
                lis.next(null);
                lis.complete();
            }
        },
        stop: function () { },
    });
}
function addRootScope(vnode) {
    vnode.data = vnode.data || {};
    vnode.data.isolate = [];
    return vnode;
}
function makeDOMDriver(container, options) {
    if (!options) {
        options = {};
    }
    utils_1.checkValidContainer(container);
    var modules = options.modules || modules_1.default;
    makeDOMDriverInputGuard(modules);
    var isolateModule = new IsolateModule_1.IsolateModule();
    var patch = snabbdom_1.init([isolateModule.createModule()].concat(modules));
    var domReady$ = makeDOMReady$();
    var vnodeWrapper;
    var mutationObserver;
    var mutationConfirmed$ = xstream_1.default.create({
        start: function (listener) {
            mutationObserver = new MutationObserver(function () { return listener.next(null); });
        },
        stop: function () {
            mutationObserver.disconnect();
        },
    });
    function DOMDriver(vnode$, name) {
        if (name === void 0) { name = 'DOM'; }
        domDriverInputGuard(vnode$);
        var sanitation$ = xstream_1.default.create();
        var firstRoot$ = domReady$.map(function () {
            var firstRoot = utils_1.getValidNode(container) || document.body;
            vnodeWrapper = new VNodeWrapper_1.VNodeWrapper(firstRoot);
            return firstRoot;
        });
        // We need to subscribe to the sink (i.e. vnode$) synchronously inside this
        // driver, and not later in the map().flatten() because this sink is in
        // reality a SinkProxy from @cycle/run, and we don't want to miss the first
        // emission when the main() is connected to the drivers.
        // Read more in issue #739.
        var rememberedVNode$ = vnode$.remember();
        rememberedVNode$.addListener({});
        // The mutation observer internal to mutationConfirmed$ should
        // exist before elementAfterPatch$ calls mutationObserver.observe()
        mutationConfirmed$.addListener({});
        var elementAfterPatch$ = firstRoot$
            .map(function (firstRoot) {
            return xstream_1.default
                .merge(rememberedVNode$.endWhen(sanitation$), sanitation$)
                .map(function (vnode) { return vnodeWrapper.call(vnode); })
                .startWith(addRootScope(tovnode_1.toVNode(firstRoot)))
                .fold(patch, tovnode_1.toVNode(firstRoot))
                .drop(1)
                .map(unwrapElementFromVNode)
                .startWith(firstRoot)
                .map(function (el) {
                mutationObserver.observe(el, {
                    childList: true,
                    attributes: true,
                    characterData: true,
                    subtree: true,
                    attributeOldValue: true,
                    characterDataOldValue: true,
                });
                return el;
            })
                .compose(dropCompletion);
        } // don't complete this stream
        )
            .flatten();
        var rootElement$ = concat_1.default(domReady$, mutationConfirmed$)
            .endWhen(sanitation$)
            .compose(sampleCombine_1.default(elementAfterPatch$))
            .map(function (arr) { return arr[1]; })
            .remember();
        // Start the snabbdom patching, over time
        rootElement$.addListener({ error: reportSnabbdomError });
        var delegator = new EventDelegator_1.EventDelegator(rootElement$, isolateModule);
        return new MainDOMSource_1.MainDOMSource(rootElement$, sanitation$, [], isolateModule, delegator, name);
    }
    return DOMDriver;
}
exports.makeDOMDriver = makeDOMDriver;

},{"./EventDelegator":22,"./IsolateModule":23,"./MainDOMSource":24,"./VNodeWrapper":29,"./modules":36,"./utils":38,"snabbdom":69,"snabbdom/tovnode":71,"xstream":83,"xstream/extra/concat":80,"xstream/extra/sampleCombine":82}],35:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("@cycle/run/lib/adapt");
var SCOPE_PREFIX = '___';
var MockedDOMSource = /** @class */ (function () {
    function MockedDOMSource(_mockConfig) {
        this._mockConfig = _mockConfig;
        if (_mockConfig.elements) {
            this._elements = _mockConfig.elements;
        }
        else {
            this._elements = adapt_1.adapt(xstream_1.default.empty());
        }
    }
    MockedDOMSource.prototype.elements = function () {
        var out = this
            ._elements;
        out._isCycleSource = 'MockedDOM';
        return out;
    };
    MockedDOMSource.prototype.element = function () {
        var output$ = this.elements()
            .filter(function (arr) { return arr.length > 0; })
            .map(function (arr) { return arr[0]; })
            .remember();
        var out = adapt_1.adapt(output$);
        out._isCycleSource = 'MockedDOM';
        return out;
    };
    MockedDOMSource.prototype.events = function (eventType, options, bubbles) {
        var streamForEventType = this._mockConfig[eventType];
        var out = adapt_1.adapt(streamForEventType || xstream_1.default.empty());
        out._isCycleSource = 'MockedDOM';
        return out;
    };
    MockedDOMSource.prototype.select = function (selector) {
        var mockConfigForSelector = this._mockConfig[selector] || {};
        return new MockedDOMSource(mockConfigForSelector);
    };
    MockedDOMSource.prototype.isolateSource = function (source, scope) {
        return source.select('.' + SCOPE_PREFIX + scope);
    };
    MockedDOMSource.prototype.isolateSink = function (sink, scope) {
        return adapt_1.adapt(xstream_1.default.fromObservable(sink).map(function (vnode) {
            if (vnode.sel && vnode.sel.indexOf(SCOPE_PREFIX + scope) !== -1) {
                return vnode;
            }
            else {
                vnode.sel += "." + SCOPE_PREFIX + scope;
                return vnode;
            }
        }));
    };
    return MockedDOMSource;
}());
exports.MockedDOMSource = MockedDOMSource;
function mockDOMSource(mockConfig) {
    return new MockedDOMSource(mockConfig);
}
exports.mockDOMSource = mockDOMSource;

},{"@cycle/run/lib/adapt":41,"xstream":83}],36:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var class_1 = require("snabbdom/modules/class");
exports.ClassModule = class_1.default;
var props_1 = require("snabbdom/modules/props");
exports.PropsModule = props_1.default;
var attributes_1 = require("snabbdom/modules/attributes");
exports.AttrsModule = attributes_1.default;
var style_1 = require("snabbdom/modules/style");
exports.StyleModule = style_1.default;
var dataset_1 = require("snabbdom/modules/dataset");
exports.DatasetModule = dataset_1.default;
var modules = [
    style_1.default,
    class_1.default,
    props_1.default,
    attributes_1.default,
    dataset_1.default,
];
exports.default = modules;

},{"snabbdom/modules/attributes":64,"snabbdom/modules/class":65,"snabbdom/modules/dataset":66,"snabbdom/modules/props":67,"snabbdom/modules/style":68}],37:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var h_1 = require("snabbdom/h");
function copyToThunk(vnode, thunkVNode) {
    thunkVNode.elm = vnode.elm;
    vnode.data.fn = thunkVNode.data.fn;
    vnode.data.args = thunkVNode.data.args;
    vnode.data.isolate = thunkVNode.data.isolate;
    thunkVNode.data = vnode.data;
    thunkVNode.children = vnode.children;
    thunkVNode.text = vnode.text;
    thunkVNode.elm = vnode.elm;
}
function init(thunkVNode) {
    var cur = thunkVNode.data;
    var vnode = cur.fn.apply(undefined, cur.args);
    copyToThunk(vnode, thunkVNode);
}
function prepatch(oldVnode, thunkVNode) {
    var old = oldVnode.data, cur = thunkVNode.data;
    var i;
    var oldArgs = old.args, args = cur.args;
    if (old.fn !== cur.fn || oldArgs.length !== args.length) {
        copyToThunk(cur.fn.apply(undefined, args), thunkVNode);
    }
    for (i = 0; i < args.length; ++i) {
        if (oldArgs[i] !== args[i]) {
            copyToThunk(cur.fn.apply(undefined, args), thunkVNode);
            return;
        }
    }
    copyToThunk(oldVnode, thunkVNode);
}
function thunk(sel, key, fn, args) {
    if (args === undefined) {
        args = fn;
        fn = key;
        key = undefined;
    }
    return h_1.h(sel, {
        key: key,
        hook: { init: init, prepatch: prepatch },
        fn: fn,
        args: args,
    });
}
exports.thunk = thunk;
exports.default = thunk;

},{"snabbdom/h":61}],38:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isValidNode(obj) {
    var ELEM_TYPE = 1;
    var FRAG_TYPE = 11;
    return typeof HTMLElement === 'object'
        ? obj instanceof HTMLElement || obj instanceof DocumentFragment
        : obj &&
            typeof obj === 'object' &&
            obj !== null &&
            (obj.nodeType === ELEM_TYPE || obj.nodeType === FRAG_TYPE) &&
            typeof obj.nodeName === 'string';
}
function isClassOrId(str) {
    return str.length > 1 && (str[0] === '.' || str[0] === '#');
}
exports.isClassOrId = isClassOrId;
function isDocFrag(el) {
    return el.nodeType === 11;
}
exports.isDocFrag = isDocFrag;
function checkValidContainer(container) {
    if (typeof container !== 'string' && !isValidNode(container)) {
        throw new Error('Given container is not a DOM element neither a selector string.');
    }
}
exports.checkValidContainer = checkValidContainer;
function getValidNode(selectors) {
    var domElement = typeof selectors === 'string'
        ? document.querySelector(selectors)
        : selectors;
    if (typeof selectors === 'string' && domElement === null) {
        throw new Error("Cannot render into unknown element `" + selectors + "`");
    }
    return domElement;
}
exports.getValidNode = getValidNode;
function getSelectors(namespace) {
    var res = '';
    for (var i = namespace.length - 1; i >= 0; i--) {
        if (namespace[i].type !== 'selector') {
            break;
        }
        res = namespace[i].scope + ' ' + res;
    }
    return res.trim();
}
exports.getSelectors = getSelectors;
function isEqualNamespace(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
        return false;
    }
    for (var i = 0; i < a.length; i++) {
        if (a[i].type !== b[i].type || a[i].scope !== b[i].scope) {
            return false;
        }
    }
    return true;
}
exports.isEqualNamespace = isEqualNamespace;
function makeInsert(map) {
    return function (type, elm, value) {
        if (map.has(type)) {
            var innerMap = map.get(type);
            innerMap.set(elm, value);
        }
        else {
            var innerMap = new Map();
            innerMap.set(elm, value);
            map.set(type, innerMap);
        }
    };
}
exports.makeInsert = makeInsert;

},{}],39:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"@cycle/run/lib/adapt":40,"dup":10,"xstream":83}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
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

},{}],43:[function(require,module,exports){
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
        window.CyclejsDevTool_startGraphSerializer) {
        window.CyclejsDevTool_startGraphSerializer(program.sinks);
    }
    return program.run();
}
exports.run = run;
exports.default = run;

},{"./internals":44}],44:[function(require,module,exports){
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
            typeof sources[name_3].shamefullySendNext ===
                'function') {
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

},{"./adapt":42,"quicktask":53,"xstream":83}],45:[function(require,module,exports){
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

},{"./pickCombine":48,"./pickMerge":49,"@cycle/isolate":39,"@cycle/run/lib/adapt":51,"xstream":83}],46:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":51,"xstream/extra/dropRepeats":81}],47:[function(require,module,exports){
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

},{"./Collection":45,"./StateSource":46,"./withState":50}],48:[function(require,module,exports){
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

},{"xstream":83}],49:[function(require,module,exports){
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

},{"xstream":83}],50:[function(require,module,exports){
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

},{"./StateSource":46,"quicktask":53,"xstream":83,"xstream/extra/concat":80}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
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

},{"_process":52,"timers":75}],54:[function(require,module,exports){
"use strict";
var selectorParser_1 = require('./selectorParser');
function classNameFromVNode(vNode) {
    var _a = selectorParser_1.selectorParser(vNode).className, cn = _a === void 0 ? '' : _a;
    if (!vNode.data) {
        return cn;
    }
    var _b = vNode.data, dataClass = _b.class, props = _b.props;
    if (dataClass) {
        var c = Object.keys(dataClass)
            .filter(function (cl) { return dataClass[cl]; });
        cn += " " + c.join(" ");
    }
    if (props && props.className) {
        cn += " " + props.className;
    }
    return cn && cn.trim();
}
exports.classNameFromVNode = classNameFromVNode;

},{"./selectorParser":60}],55:[function(require,module,exports){
"use strict";
function curry2(select) {
    return function selector(sel, vNode) {
        switch (arguments.length) {
            case 0: return select;
            case 1: return function (_vNode) { return select(sel, _vNode); };
            default: return select(sel, vNode);
        }
    };
}
exports.curry2 = curry2;
;

},{}],56:[function(require,module,exports){
"use strict";
var query_1 = require('./query');
var parent_symbol_1 = require('./parent-symbol');
function findMatches(cssSelector, vNode) {
    if (!vNode) {
        return [];
    }
    traverseVNode(vNode, addParent); // add mapping to the parent selectorParser
    return query_1.querySelector(cssSelector, vNode);
}
exports.findMatches = findMatches;
function traverseVNode(vNode, f) {
    function recurse(currentNode, isParent, parentVNode) {
        var length = currentNode.children && currentNode.children.length || 0;
        for (var i = 0; i < length; ++i) {
            var children = currentNode.children;
            if (children && children[i] && typeof children[i] !== 'string') {
                var child = children[i];
                recurse(child, false, currentNode);
            }
        }
        f(currentNode, isParent, isParent ? void 0 : parentVNode);
    }
    recurse(vNode, true);
}
function addParent(vNode, isParent, parent) {
    if (isParent) {
        return void 0;
    }
    if (!vNode.data) {
        vNode.data = {};
    }
    if (!vNode.data[parent_symbol_1.default]) {
        Object.defineProperty(vNode.data, parent_symbol_1.default, {
            value: parent,
        });
    }
}

},{"./parent-symbol":58,"./query":59}],57:[function(require,module,exports){
"use strict";
var curry2_1 = require('./curry2');
var findMatches_1 = require('./findMatches');
exports.select = curry2_1.curry2(findMatches_1.findMatches);
var selectorParser_1 = require('./selectorParser');
exports.selectorParser = selectorParser_1.selectorParser;
var classNameFromVNode_1 = require('./classNameFromVNode');
exports.classNameFromVNode = classNameFromVNode_1.classNameFromVNode;

},{"./classNameFromVNode":54,"./curry2":55,"./findMatches":56,"./selectorParser":60}],58:[function(require,module,exports){
(function (global){
"use strict";
var root;
if (typeof self !== 'undefined') {
    root = self;
}
else if (typeof window !== 'undefined') {
    root = window;
}
else if (typeof global !== 'undefined') {
    root = global;
}
else {
    root = Function('return this')();
}
var Symbol = root.Symbol;
var parentSymbol;
if (typeof Symbol === 'function') {
    parentSymbol = Symbol('parent');
}
else {
    parentSymbol = '@@snabbdom-selector-parent';
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parentSymbol;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],59:[function(require,module,exports){
"use strict";
var tree_selector_1 = require('tree-selector');
var selectorParser_1 = require('./selectorParser');
var classNameFromVNode_1 = require('./classNameFromVNode');
var parent_symbol_1 = require('./parent-symbol');
var options = {
    tag: function (vNode) { return selectorParser_1.selectorParser(vNode).tagName; },
    className: function (vNode) { return classNameFromVNode_1.classNameFromVNode(vNode); },
    id: function (vNode) { return selectorParser_1.selectorParser(vNode).id || ''; },
    children: function (vNode) { return vNode.children || []; },
    parent: function (vNode) { return vNode.data[parent_symbol_1.default] || vNode; },
    contents: function (vNode) { return vNode.text || ''; },
    attr: function (vNode, attr) {
        if (vNode.data) {
            var _a = vNode.data, _b = _a.attrs, attrs = _b === void 0 ? {} : _b, _c = _a.props, props = _c === void 0 ? {} : _c, _d = _a.dataset, dataset = _d === void 0 ? {} : _d;
            if (attrs[attr]) {
                return attrs[attr];
            }
            if (props[attr]) {
                return props[attr];
            }
            if (attr.indexOf('data-') === 0 && dataset[attr.slice(5)]) {
                return dataset[attr.slice(5)];
            }
        }
    },
};
var matches = tree_selector_1.createMatches(options);
function customMatches(sel, vnode) {
    var data = vnode.data;
    var selector = matches.bind(null, sel);
    if (data && data.fn) {
        var n = void 0;
        if (Array.isArray(data.args)) {
            n = data.fn.apply(null, data.args);
        }
        else if (data.args) {
            n = data.fn.call(null, data.args);
        }
        else {
            n = data.fn();
        }
        return selector(n) ? n : false;
    }
    return selector(vnode);
}
exports.querySelector = tree_selector_1.createQuerySelector(options, customMatches);

},{"./classNameFromVNode":54,"./parent-symbol":58,"./selectorParser":60,"tree-selector":76}],60:[function(require,module,exports){
"use strict";
function selectorParser(node) {
    if (!node.sel) {
        return {
            tagName: '',
            id: '',
            className: '',
        };
    }
    var sel = node.sel;
    var hashIdx = sel.indexOf('#');
    var dotIdx = sel.indexOf('.', hashIdx);
    var hash = hashIdx > 0 ? hashIdx : sel.length;
    var dot = dotIdx > 0 ? dotIdx : sel.length;
    var tagName = hashIdx !== -1 || dotIdx !== -1 ?
        sel.slice(0, Math.min(hash, dot)) :
        sel;
    var id = hash < dot ? sel.slice(hash + 1, dot) : void 0;
    var className = dotIdx > 0 ? sel.slice(dot + 1).replace(/\./g, ' ') : void 0;
    return {
        tagName: tagName,
        id: id,
        className: className,
    };
}
exports.selectorParser = selectorParser;

},{}],61:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("./vnode");
var is = require("./is");
function addNS(data, children, sel) {
    data.ns = 'http://www.w3.org/2000/svg';
    if (sel !== 'foreignObject' && children !== undefined) {
        for (var i = 0; i < children.length; ++i) {
            var childData = children[i].data;
            if (childData !== undefined) {
                addNS(childData, children[i].children, children[i].sel);
            }
        }
    }
}
function h(sel, b, c) {
    var data = {}, children, text, i;
    if (c !== undefined) {
        data = b;
        if (is.array(c)) {
            children = c;
        }
        else if (is.primitive(c)) {
            text = c;
        }
        else if (c && c.sel) {
            children = [c];
        }
    }
    else if (b !== undefined) {
        if (is.array(b)) {
            children = b;
        }
        else if (is.primitive(b)) {
            text = b;
        }
        else if (b && b.sel) {
            children = [b];
        }
        else {
            data = b;
        }
    }
    if (children !== undefined) {
        for (i = 0; i < children.length; ++i) {
            if (is.primitive(children[i]))
                children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i], undefined);
        }
    }
    if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g' &&
        (sel.length === 3 || sel[3] === '.' || sel[3] === '#')) {
        addNS(data, children, sel);
    }
    return vnode_1.vnode(sel, data, children, text, undefined);
}
exports.h = h;
;
exports.default = h;

},{"./is":63,"./vnode":72}],62:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createElement(tagName) {
    return document.createElement(tagName);
}
function createElementNS(namespaceURI, qualifiedName) {
    return document.createElementNS(namespaceURI, qualifiedName);
}
function createTextNode(text) {
    return document.createTextNode(text);
}
function createComment(text) {
    return document.createComment(text);
}
function insertBefore(parentNode, newNode, referenceNode) {
    parentNode.insertBefore(newNode, referenceNode);
}
function removeChild(node, child) {
    node.removeChild(child);
}
function appendChild(node, child) {
    node.appendChild(child);
}
function parentNode(node) {
    return node.parentNode;
}
function nextSibling(node) {
    return node.nextSibling;
}
function tagName(elm) {
    return elm.tagName;
}
function setTextContent(node, text) {
    node.textContent = text;
}
function getTextContent(node) {
    return node.textContent;
}
function isElement(node) {
    return node.nodeType === 1;
}
function isText(node) {
    return node.nodeType === 3;
}
function isComment(node) {
    return node.nodeType === 8;
}
exports.htmlDomApi = {
    createElement: createElement,
    createElementNS: createElementNS,
    createTextNode: createTextNode,
    createComment: createComment,
    insertBefore: insertBefore,
    removeChild: removeChild,
    appendChild: appendChild,
    parentNode: parentNode,
    nextSibling: nextSibling,
    tagName: tagName,
    setTextContent: setTextContent,
    getTextContent: getTextContent,
    isElement: isElement,
    isText: isText,
    isComment: isComment,
};
exports.default = exports.htmlDomApi;

},{}],63:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;

},{}],64:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xlinkNS = 'http://www.w3.org/1999/xlink';
var xmlNS = 'http://www.w3.org/XML/1998/namespace';
var colonChar = 58;
var xChar = 120;
function updateAttrs(oldVnode, vnode) {
    var key, elm = vnode.elm, oldAttrs = oldVnode.data.attrs, attrs = vnode.data.attrs;
    if (!oldAttrs && !attrs)
        return;
    if (oldAttrs === attrs)
        return;
    oldAttrs = oldAttrs || {};
    attrs = attrs || {};
    // update modified attributes, add new attributes
    for (key in attrs) {
        var cur = attrs[key];
        var old = oldAttrs[key];
        if (old !== cur) {
            if (cur === true) {
                elm.setAttribute(key, "");
            }
            else if (cur === false) {
                elm.removeAttribute(key);
            }
            else {
                if (key.charCodeAt(0) !== xChar) {
                    elm.setAttribute(key, cur);
                }
                else if (key.charCodeAt(3) === colonChar) {
                    // Assume xml namespace
                    elm.setAttributeNS(xmlNS, key, cur);
                }
                else if (key.charCodeAt(5) === colonChar) {
                    // Assume xlink namespace
                    elm.setAttributeNS(xlinkNS, key, cur);
                }
                else {
                    elm.setAttribute(key, cur);
                }
            }
        }
    }
    // remove removed attributes
    // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
    // the other option is to remove all attributes with value == undefined
    for (key in oldAttrs) {
        if (!(key in attrs)) {
            elm.removeAttribute(key);
        }
    }
}
exports.attributesModule = { create: updateAttrs, update: updateAttrs };
exports.default = exports.attributesModule;

},{}],65:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function updateClass(oldVnode, vnode) {
    var cur, name, elm = vnode.elm, oldClass = oldVnode.data.class, klass = vnode.data.class;
    if (!oldClass && !klass)
        return;
    if (oldClass === klass)
        return;
    oldClass = oldClass || {};
    klass = klass || {};
    for (name in oldClass) {
        if (!klass[name]) {
            elm.classList.remove(name);
        }
    }
    for (name in klass) {
        cur = klass[name];
        if (cur !== oldClass[name]) {
            elm.classList[cur ? 'add' : 'remove'](name);
        }
    }
}
exports.classModule = { create: updateClass, update: updateClass };
exports.default = exports.classModule;

},{}],66:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CAPS_REGEX = /[A-Z]/g;
function updateDataset(oldVnode, vnode) {
    var elm = vnode.elm, oldDataset = oldVnode.data.dataset, dataset = vnode.data.dataset, key;
    if (!oldDataset && !dataset)
        return;
    if (oldDataset === dataset)
        return;
    oldDataset = oldDataset || {};
    dataset = dataset || {};
    var d = elm.dataset;
    for (key in oldDataset) {
        if (!dataset[key]) {
            if (d) {
                if (key in d) {
                    delete d[key];
                }
            }
            else {
                elm.removeAttribute('data-' + key.replace(CAPS_REGEX, '-$&').toLowerCase());
            }
        }
    }
    for (key in dataset) {
        if (oldDataset[key] !== dataset[key]) {
            if (d) {
                d[key] = dataset[key];
            }
            else {
                elm.setAttribute('data-' + key.replace(CAPS_REGEX, '-$&').toLowerCase(), dataset[key]);
            }
        }
    }
}
exports.datasetModule = { create: updateDataset, update: updateDataset };
exports.default = exports.datasetModule;

},{}],67:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function updateProps(oldVnode, vnode) {
    var key, cur, old, elm = vnode.elm, oldProps = oldVnode.data.props, props = vnode.data.props;
    if (!oldProps && !props)
        return;
    if (oldProps === props)
        return;
    oldProps = oldProps || {};
    props = props || {};
    for (key in oldProps) {
        if (!props[key]) {
            delete elm[key];
        }
    }
    for (key in props) {
        cur = props[key];
        old = oldProps[key];
        if (old !== cur && (key !== 'value' || elm[key] !== cur)) {
            elm[key] = cur;
        }
    }
}
exports.propsModule = { create: updateProps, update: updateProps };
exports.default = exports.propsModule;

},{}],68:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Bindig `requestAnimationFrame` like this fixes a bug in IE/Edge. See #360 and #409.
var raf = (typeof window !== 'undefined' && (window.requestAnimationFrame).bind(window)) || setTimeout;
var nextFrame = function (fn) { raf(function () { raf(fn); }); };
var reflowForced = false;
function setNextFrame(obj, prop, val) {
    nextFrame(function () { obj[prop] = val; });
}
function updateStyle(oldVnode, vnode) {
    var cur, name, elm = vnode.elm, oldStyle = oldVnode.data.style, style = vnode.data.style;
    if (!oldStyle && !style)
        return;
    if (oldStyle === style)
        return;
    oldStyle = oldStyle || {};
    style = style || {};
    var oldHasDel = 'delayed' in oldStyle;
    for (name in oldStyle) {
        if (!style[name]) {
            if (name[0] === '-' && name[1] === '-') {
                elm.style.removeProperty(name);
            }
            else {
                elm.style[name] = '';
            }
        }
    }
    for (name in style) {
        cur = style[name];
        if (name === 'delayed' && style.delayed) {
            for (var name2 in style.delayed) {
                cur = style.delayed[name2];
                if (!oldHasDel || cur !== oldStyle.delayed[name2]) {
                    setNextFrame(elm.style, name2, cur);
                }
            }
        }
        else if (name !== 'remove' && cur !== oldStyle[name]) {
            if (name[0] === '-' && name[1] === '-') {
                elm.style.setProperty(name, cur);
            }
            else {
                elm.style[name] = cur;
            }
        }
    }
}
function applyDestroyStyle(vnode) {
    var style, name, elm = vnode.elm, s = vnode.data.style;
    if (!s || !(style = s.destroy))
        return;
    for (name in style) {
        elm.style[name] = style[name];
    }
}
function applyRemoveStyle(vnode, rm) {
    var s = vnode.data.style;
    if (!s || !s.remove) {
        rm();
        return;
    }
    if (!reflowForced) {
        getComputedStyle(document.body).transform;
        reflowForced = true;
    }
    var name, elm = vnode.elm, i = 0, compStyle, style = s.remove, amount = 0, applied = [];
    for (name in style) {
        applied.push(name);
        elm.style[name] = style[name];
    }
    compStyle = getComputedStyle(elm);
    var props = compStyle['transition-property'].split(', ');
    for (; i < props.length; ++i) {
        if (applied.indexOf(props[i]) !== -1)
            amount++;
    }
    elm.addEventListener('transitionend', function (ev) {
        if (ev.target === elm)
            --amount;
        if (amount === 0)
            rm();
    });
}
function forceReflow() {
    reflowForced = false;
}
exports.styleModule = {
    pre: forceReflow,
    create: updateStyle,
    update: updateStyle,
    destroy: applyDestroyStyle,
    remove: applyRemoveStyle
};
exports.default = exports.styleModule;

},{}],69:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("./vnode");
var is = require("./is");
var htmldomapi_1 = require("./htmldomapi");
function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }
var emptyNode = vnode_1.default('', {}, [], undefined, undefined);
function sameVnode(vnode1, vnode2) {
    return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}
function isVnode(vnode) {
    return vnode.sel !== undefined;
}
function createKeyToOldIdx(children, beginIdx, endIdx) {
    var i, map = {}, key, ch;
    for (i = beginIdx; i <= endIdx; ++i) {
        ch = children[i];
        if (ch != null) {
            key = ch.key;
            if (key !== undefined)
                map[key] = i;
        }
    }
    return map;
}
var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];
var h_1 = require("./h");
exports.h = h_1.h;
var thunk_1 = require("./thunk");
exports.thunk = thunk_1.thunk;
function init(modules, domApi) {
    var i, j, cbs = {};
    var api = domApi !== undefined ? domApi : htmldomapi_1.default;
    for (i = 0; i < hooks.length; ++i) {
        cbs[hooks[i]] = [];
        for (j = 0; j < modules.length; ++j) {
            var hook = modules[j][hooks[i]];
            if (hook !== undefined) {
                cbs[hooks[i]].push(hook);
            }
        }
    }
    function emptyNodeAt(elm) {
        var id = elm.id ? '#' + elm.id : '';
        var c = elm.className ? '.' + elm.className.split(' ').join('.') : '';
        return vnode_1.default(api.tagName(elm).toLowerCase() + id + c, {}, [], undefined, elm);
    }
    function createRmCb(childElm, listeners) {
        return function rmCb() {
            if (--listeners === 0) {
                var parent_1 = api.parentNode(childElm);
                api.removeChild(parent_1, childElm);
            }
        };
    }
    function createElm(vnode, insertedVnodeQueue) {
        var i, data = vnode.data;
        if (data !== undefined) {
            if (isDef(i = data.hook) && isDef(i = i.init)) {
                i(vnode);
                data = vnode.data;
            }
        }
        var children = vnode.children, sel = vnode.sel;
        if (sel === '!') {
            if (isUndef(vnode.text)) {
                vnode.text = '';
            }
            vnode.elm = api.createComment(vnode.text);
        }
        else if (sel !== undefined) {
            // Parse selector
            var hashIdx = sel.indexOf('#');
            var dotIdx = sel.indexOf('.', hashIdx);
            var hash = hashIdx > 0 ? hashIdx : sel.length;
            var dot = dotIdx > 0 ? dotIdx : sel.length;
            var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
            var elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? api.createElementNS(i, tag)
                : api.createElement(tag);
            if (hash < dot)
                elm.setAttribute('id', sel.slice(hash + 1, dot));
            if (dotIdx > 0)
                elm.setAttribute('class', sel.slice(dot + 1).replace(/\./g, ' '));
            for (i = 0; i < cbs.create.length; ++i)
                cbs.create[i](emptyNode, vnode);
            if (is.array(children)) {
                for (i = 0; i < children.length; ++i) {
                    var ch = children[i];
                    if (ch != null) {
                        api.appendChild(elm, createElm(ch, insertedVnodeQueue));
                    }
                }
            }
            else if (is.primitive(vnode.text)) {
                api.appendChild(elm, api.createTextNode(vnode.text));
            }
            i = vnode.data.hook; // Reuse variable
            if (isDef(i)) {
                if (i.create)
                    i.create(emptyNode, vnode);
                if (i.insert)
                    insertedVnodeQueue.push(vnode);
            }
        }
        else {
            vnode.elm = api.createTextNode(vnode.text);
        }
        return vnode.elm;
    }
    function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
        for (; startIdx <= endIdx; ++startIdx) {
            var ch = vnodes[startIdx];
            if (ch != null) {
                api.insertBefore(parentElm, createElm(ch, insertedVnodeQueue), before);
            }
        }
    }
    function invokeDestroyHook(vnode) {
        var i, j, data = vnode.data;
        if (data !== undefined) {
            if (isDef(i = data.hook) && isDef(i = i.destroy))
                i(vnode);
            for (i = 0; i < cbs.destroy.length; ++i)
                cbs.destroy[i](vnode);
            if (vnode.children !== undefined) {
                for (j = 0; j < vnode.children.length; ++j) {
                    i = vnode.children[j];
                    if (i != null && typeof i !== "string") {
                        invokeDestroyHook(i);
                    }
                }
            }
        }
    }
    function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
        for (; startIdx <= endIdx; ++startIdx) {
            var i_1 = void 0, listeners = void 0, rm = void 0, ch = vnodes[startIdx];
            if (ch != null) {
                if (isDef(ch.sel)) {
                    invokeDestroyHook(ch);
                    listeners = cbs.remove.length + 1;
                    rm = createRmCb(ch.elm, listeners);
                    for (i_1 = 0; i_1 < cbs.remove.length; ++i_1)
                        cbs.remove[i_1](ch, rm);
                    if (isDef(i_1 = ch.data) && isDef(i_1 = i_1.hook) && isDef(i_1 = i_1.remove)) {
                        i_1(ch, rm);
                    }
                    else {
                        rm();
                    }
                }
                else {
                    api.removeChild(parentElm, ch.elm);
                }
            }
        }
    }
    function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
        var oldStartIdx = 0, newStartIdx = 0;
        var oldEndIdx = oldCh.length - 1;
        var oldStartVnode = oldCh[0];
        var oldEndVnode = oldCh[oldEndIdx];
        var newEndIdx = newCh.length - 1;
        var newStartVnode = newCh[0];
        var newEndVnode = newCh[newEndIdx];
        var oldKeyToIdx;
        var idxInOld;
        var elmToMove;
        var before;
        while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
            if (oldStartVnode == null) {
                oldStartVnode = oldCh[++oldStartIdx]; // Vnode might have been moved left
            }
            else if (oldEndVnode == null) {
                oldEndVnode = oldCh[--oldEndIdx];
            }
            else if (newStartVnode == null) {
                newStartVnode = newCh[++newStartIdx];
            }
            else if (newEndVnode == null) {
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldStartVnode, newStartVnode)) {
                patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
                oldStartVnode = oldCh[++oldStartIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            else if (sameVnode(oldEndVnode, newEndVnode)) {
                patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
                oldEndVnode = oldCh[--oldEndIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldStartVnode, newEndVnode)) {
                patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
                api.insertBefore(parentElm, oldStartVnode.elm, api.nextSibling(oldEndVnode.elm));
                oldStartVnode = oldCh[++oldStartIdx];
                newEndVnode = newCh[--newEndIdx];
            }
            else if (sameVnode(oldEndVnode, newStartVnode)) {
                patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
                api.insertBefore(parentElm, oldEndVnode.elm, oldStartVnode.elm);
                oldEndVnode = oldCh[--oldEndIdx];
                newStartVnode = newCh[++newStartIdx];
            }
            else {
                if (oldKeyToIdx === undefined) {
                    oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
                }
                idxInOld = oldKeyToIdx[newStartVnode.key];
                if (isUndef(idxInOld)) {
                    api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    newStartVnode = newCh[++newStartIdx];
                }
                else {
                    elmToMove = oldCh[idxInOld];
                    if (elmToMove.sel !== newStartVnode.sel) {
                        api.insertBefore(parentElm, createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
                    }
                    else {
                        patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
                        oldCh[idxInOld] = undefined;
                        api.insertBefore(parentElm, elmToMove.elm, oldStartVnode.elm);
                    }
                    newStartVnode = newCh[++newStartIdx];
                }
            }
        }
        if (oldStartIdx <= oldEndIdx || newStartIdx <= newEndIdx) {
            if (oldStartIdx > oldEndIdx) {
                before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
                addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
            }
            else {
                removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
            }
        }
    }
    function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
        var i, hook;
        if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
            i(oldVnode, vnode);
        }
        var elm = vnode.elm = oldVnode.elm;
        var oldCh = oldVnode.children;
        var ch = vnode.children;
        if (oldVnode === vnode)
            return;
        if (vnode.data !== undefined) {
            for (i = 0; i < cbs.update.length; ++i)
                cbs.update[i](oldVnode, vnode);
            i = vnode.data.hook;
            if (isDef(i) && isDef(i = i.update))
                i(oldVnode, vnode);
        }
        if (isUndef(vnode.text)) {
            if (isDef(oldCh) && isDef(ch)) {
                if (oldCh !== ch)
                    updateChildren(elm, oldCh, ch, insertedVnodeQueue);
            }
            else if (isDef(ch)) {
                if (isDef(oldVnode.text))
                    api.setTextContent(elm, '');
                addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
            }
            else if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            else if (isDef(oldVnode.text)) {
                api.setTextContent(elm, '');
            }
        }
        else if (oldVnode.text !== vnode.text) {
            if (isDef(oldCh)) {
                removeVnodes(elm, oldCh, 0, oldCh.length - 1);
            }
            api.setTextContent(elm, vnode.text);
        }
        if (isDef(hook) && isDef(i = hook.postpatch)) {
            i(oldVnode, vnode);
        }
    }
    return function patch(oldVnode, vnode) {
        var i, elm, parent;
        var insertedVnodeQueue = [];
        for (i = 0; i < cbs.pre.length; ++i)
            cbs.pre[i]();
        if (!isVnode(oldVnode)) {
            oldVnode = emptyNodeAt(oldVnode);
        }
        if (sameVnode(oldVnode, vnode)) {
            patchVnode(oldVnode, vnode, insertedVnodeQueue);
        }
        else {
            elm = oldVnode.elm;
            parent = api.parentNode(elm);
            createElm(vnode, insertedVnodeQueue);
            if (parent !== null) {
                api.insertBefore(parent, vnode.elm, api.nextSibling(elm));
                removeVnodes(parent, [oldVnode], 0, 0);
            }
        }
        for (i = 0; i < insertedVnodeQueue.length; ++i) {
            insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
        }
        for (i = 0; i < cbs.post.length; ++i)
            cbs.post[i]();
        return vnode;
    };
}
exports.init = init;

},{"./h":61,"./htmldomapi":62,"./is":63,"./thunk":70,"./vnode":72}],70:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var h_1 = require("./h");
function copyToThunk(vnode, thunk) {
    thunk.elm = vnode.elm;
    vnode.data.fn = thunk.data.fn;
    vnode.data.args = thunk.data.args;
    thunk.data = vnode.data;
    thunk.children = vnode.children;
    thunk.text = vnode.text;
    thunk.elm = vnode.elm;
}
function init(thunk) {
    var cur = thunk.data;
    var vnode = cur.fn.apply(undefined, cur.args);
    copyToThunk(vnode, thunk);
}
function prepatch(oldVnode, thunk) {
    var i, old = oldVnode.data, cur = thunk.data;
    var oldArgs = old.args, args = cur.args;
    if (old.fn !== cur.fn || oldArgs.length !== args.length) {
        copyToThunk(cur.fn.apply(undefined, args), thunk);
        return;
    }
    for (i = 0; i < args.length; ++i) {
        if (oldArgs[i] !== args[i]) {
            copyToThunk(cur.fn.apply(undefined, args), thunk);
            return;
        }
    }
    copyToThunk(oldVnode, thunk);
}
exports.thunk = function thunk(sel, key, fn, args) {
    if (args === undefined) {
        args = fn;
        fn = key;
        key = undefined;
    }
    return h_1.h(sel, {
        key: key,
        hook: { init: init, prepatch: prepatch },
        fn: fn,
        args: args
    });
};
exports.default = exports.thunk;

},{"./h":61}],71:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("./vnode");
var htmldomapi_1 = require("./htmldomapi");
function toVNode(node, domApi) {
    var api = domApi !== undefined ? domApi : htmldomapi_1.default;
    var text;
    if (api.isElement(node)) {
        var id = node.id ? '#' + node.id : '';
        var cn = node.getAttribute('class');
        var c = cn ? '.' + cn.split(' ').join('.') : '';
        var sel = api.tagName(node).toLowerCase() + id + c;
        var attrs = {};
        var children = [];
        var name_1;
        var i = void 0, n = void 0;
        var elmAttrs = node.attributes;
        var elmChildren = node.childNodes;
        for (i = 0, n = elmAttrs.length; i < n; i++) {
            name_1 = elmAttrs[i].nodeName;
            if (name_1 !== 'id' && name_1 !== 'class') {
                attrs[name_1] = elmAttrs[i].nodeValue;
            }
        }
        for (i = 0, n = elmChildren.length; i < n; i++) {
            children.push(toVNode(elmChildren[i], domApi));
        }
        return vnode_1.default(sel, { attrs: attrs }, children, undefined, node);
    }
    else if (api.isText(node)) {
        text = api.getTextContent(node);
        return vnode_1.default(undefined, undefined, undefined, text, node);
    }
    else if (api.isComment(node)) {
        text = api.getTextContent(node);
        return vnode_1.default('!', {}, [], text, node);
    }
    else {
        return vnode_1.default('', {}, [], undefined, node);
    }
}
exports.toVNode = toVNode;
exports.default = toVNode;

},{"./htmldomapi":62,"./vnode":72}],72:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
exports.default = vnode;

},{}],73:[function(require,module,exports){
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

},{"./ponyfill.js":74}],74:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13}],75:[function(require,module,exports){
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

},{"process/browser.js":52,"timers":75}],76:[function(require,module,exports){
"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./selectorParser"));
var matches_1 = require("./matches");
exports.createMatches = matches_1.createMatches;
var querySelector_1 = require("./querySelector");
exports.createQuerySelector = querySelector_1.createQuerySelector;

},{"./matches":77,"./querySelector":78,"./selectorParser":79}],77:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var selectorParser_1 = require("./selectorParser");
function createMatches(opts) {
    return function matches(selector, node) {
        var _a = typeof selector === 'object' ? selector : selectorParser_1.parseSelector(selector), tag = _a.tag, id = _a.id, classList = _a.classList, attributes = _a.attributes, nextSelector = _a.nextSelector, pseudos = _a.pseudos;
        if (nextSelector !== undefined) {
            throw new Error('matches can only process selectors that target a single element');
        }
        if (!node) {
            return false;
        }
        if (tag && tag.toLowerCase() !== opts.tag(node).toLowerCase()) {
            return false;
        }
        if (id && id !== opts.id(node)) {
            return false;
        }
        var classes = opts.className(node).split(' ');
        for (var i = 0; i < classList.length; i++) {
            if (classes.indexOf(classList[i]) === -1) {
                return false;
            }
        }
        for (var key in attributes) {
            var attr = opts.attr(node, key);
            var t = attributes[key][0];
            var v = attributes[key][1];
            if (attr === undefined) {
                return false;
            }
            if (t === 'has') {
                return true;
            }
            if (t === 'exact' && attr !== v) {
                return false;
            }
            else if (t !== 'exact') {
                if (typeof v !== 'string') {
                    throw new Error('All non-string values have to be an exact match');
                }
                if (t === 'startsWith' && !attr.startsWith(v)) {
                    return false;
                }
                if (t === 'endsWith' && !attr.endsWith(v)) {
                    return false;
                }
                if (t === 'contains' && attr.indexOf(v) === -1) {
                    return false;
                }
                if (t === 'whitespace' && attr.split(' ').indexOf(v) === -1) {
                    return false;
                }
                if (t === 'dash' && attr.split('-').indexOf(v) === -1) {
                    return false;
                }
            }
        }
        for (var i = 0; i < pseudos.length; i++) {
            var _b = pseudos[i], t = _b[0], data = _b[1];
            if (t === 'contains' && data !== opts.contents(node)) {
                return false;
            }
            if (t === 'empty' &&
                (opts.contents(node) || opts.children(node).length !== 0)) {
                return false;
            }
            if (t === 'root' && opts.parent(node) !== undefined) {
                return false;
            }
            if (t.indexOf('child') !== -1) {
                if (!opts.parent(node)) {
                    return false;
                }
                var siblings = opts.children(opts.parent(node));
                if (t === 'first-child' && siblings.indexOf(node) !== 0) {
                    return false;
                }
                if (t === 'last-child' &&
                    siblings.indexOf(node) !== siblings.length - 1) {
                    return false;
                }
                if (t === 'nth-child') {
                    var regex = /([\+-]?)(\d*)(n?)(\+\d+)?/;
                    var parseResult = regex.exec(data).slice(1);
                    var index = siblings.indexOf(node);
                    if (!parseResult[0]) {
                        parseResult[0] = '+';
                    }
                    var factor = parseResult[1]
                        ? parseInt(parseResult[0] + parseResult[1])
                        : undefined;
                    var add = parseInt(parseResult[3] || '0');
                    if (factor &&
                        parseResult[2] === 'n' &&
                        index % factor !== add) {
                        return false;
                    }
                    else if (!factor &&
                        parseResult[2] &&
                        ((parseResult[0] === '+' && index - add < 0) ||
                            (parseResult[0] === '-' && index - add >= 0))) {
                        return false;
                    }
                    else if (!parseResult[2] && factor &&
                        index !== factor - 1) {
                        return false;
                    }
                }
            }
        }
        return true;
    };
}
exports.createMatches = createMatches;

},{"./selectorParser":79}],78:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var selectorParser_1 = require("./selectorParser");
var matches_1 = require("./matches");
function createQuerySelector(options, matches) {
    var _matches = matches || matches_1.createMatches(options);
    function findSubtree(selector, depth, node) {
        if (!node) {
            return [];
        }
        var n = _matches(selector, node);
        var matched = n ? (typeof n === 'object' ? [n] : [node]) : [];
        if (depth === 0) {
            return matched;
        }
        var childMatched = options
            .children(node)
            .filter(function (c) { return typeof c !== 'string'; })
            .map(function (c) { return findSubtree(selector, depth - 1, c); })
            .reduce(function (acc, curr) { return acc.concat(curr); }, []);
        return matched.concat(childMatched);
    }
    function findSibling(selector, next, node) {
        if (!node || options.parent(node) === undefined) {
            return [];
        }
        var results = [];
        var siblings = options.children(options.parent(node));
        for (var i = siblings.indexOf(node) + 1; i < siblings.length; i++) {
            if (typeof siblings[i] === 'string') {
                continue;
            }
            var n = _matches(selector, siblings[i]);
            if (n) {
                if (typeof n === 'object') {
                    results.push(n);
                }
                else {
                    results.push(siblings[i]);
                }
            }
            if (next) {
                break;
            }
        }
        return results;
    }
    return function querySelector(selector, node) {
        if (!node) {
            return [];
        }
        var sel = typeof selector === 'object' ? selector : selectorParser_1.parseSelector(selector);
        var results = [node];
        var currentSelector = sel;
        var currentCombinator = 'subtree';
        var tail = undefined;
        var _loop_1 = function () {
            tail = currentSelector.nextSelector;
            currentSelector.nextSelector = undefined;
            if (currentCombinator === 'subtree' ||
                currentCombinator === 'child') {
                var depth_1 = currentCombinator === 'subtree' ? Infinity : 1;
                results = results
                    .map(function (n) { return findSubtree(currentSelector, depth_1, n); })
                    .reduce(function (acc, curr) { return acc.concat(curr); }, []);
            }
            else {
                var next_1 = currentCombinator === 'nextSibling';
                results = results
                    .map(function (n) { return findSibling(currentSelector, next_1, n); })
                    .reduce(function (acc, curr) { return acc.concat(curr); }, []);
            }
            if (tail) {
                currentSelector = tail[1];
                currentCombinator = tail[0];
            }
        };
        do {
            _loop_1();
        } while (tail !== undefined);
        return results;
    };
}
exports.createQuerySelector = createQuerySelector;

},{"./matches":77,"./selectorParser":79}],79:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var IDENT = '[\\w-]+';
var SPACE = '[ \t]*';
var VALUE = "[^\\]]+";
var CLASS = "(?:\\." + IDENT + ")";
var ID = "(?:#" + IDENT + ")";
var OP = "(?:=|\\$=|\\^=|\\*=|~=|\\|=)";
var ATTR = "(?:\\[" + SPACE + IDENT + SPACE + "(?:" + OP + SPACE + VALUE + SPACE + ")?\\])";
var SUBTREE = "(?:[ \t]+)";
var CHILD = "(?:" + SPACE + "(>)" + SPACE + ")";
var NEXT_SIBLING = "(?:" + SPACE + "(\\+)" + SPACE + ")";
var SIBLING = "(?:" + SPACE + "(~)" + SPACE + ")";
var COMBINATOR = "(?:" + SUBTREE + "|" + CHILD + "|" + NEXT_SIBLING + "|" + SIBLING + ")";
var CONTAINS = "contains\\(\"[^\"]*\"\\)";
var FORMULA = "(?:even|odd|\\d*(?:-?n(?:\\+\\d+)?)?)";
var NTH_CHILD = "nth-child\\(" + FORMULA + "\\)";
var PSEUDO = ":(?:first-child|last-child|" + NTH_CHILD + "|empty|root|" + CONTAINS + ")";
var TAG = "(:?" + IDENT + ")?";
var TOKENS = CLASS + "|" + ID + "|" + ATTR + "|" + PSEUDO + "|" + COMBINATOR;
var combinatorRegex = new RegExp("^" + COMBINATOR + "$");
/**
 * Parses a css selector into a normalized object.
 * Expects a selector for a single element only, no `>` or the like!
 */
function parseSelector(selector) {
    var sel = selector.trim();
    var tagRegex = new RegExp(TAG, 'y');
    var tag = tagRegex.exec(sel)[0];
    var regex = new RegExp(TOKENS, 'y');
    regex.lastIndex = tagRegex.lastIndex;
    var matches = [];
    var nextSelector = undefined;
    var lastCombinator = undefined;
    var index = -1;
    while (regex.lastIndex < sel.length) {
        var match = regex.exec(sel);
        if (!match && lastCombinator === undefined) {
            throw new Error('Parse error, invalid selector');
        }
        else if (match && combinatorRegex.test(match[0])) {
            var comb = combinatorRegex.exec(match[0])[0];
            lastCombinator = comb;
            index = regex.lastIndex;
        }
        else {
            if (lastCombinator !== undefined) {
                nextSelector = [
                    getCombinator(lastCombinator),
                    parseSelector(sel.substring(index))
                ];
                break;
            }
            matches.push(match[0]);
        }
    }
    var classList = matches
        .filter(function (s) { return s.startsWith('.'); })
        .map(function (s) { return s.substring(1); });
    var ids = matches.filter(function (s) { return s.startsWith('#'); }).map(function (s) { return s.substring(1); });
    if (ids.length > 1) {
        throw new Error('Invalid selector, only one id is allowed');
    }
    var postprocessRegex = new RegExp("(" + IDENT + ")" + SPACE + "(" + OP + ")?" + SPACE + "(" + VALUE + ")?");
    var attrs = matches
        .filter(function (s) { return s.startsWith('['); })
        .map(function (s) { return postprocessRegex.exec(s).slice(1, 4); })
        .map(function (_a) {
        var attr = _a[0], op = _a[1], val = _a[2];
        var _b;
        return (_b = {},
            _b[attr] = [getOp(op), val ? parseAttrValue(val) : val],
            _b);
    })
        .reduce(function (acc, curr) { return (__assign({}, acc, curr)); }, {});
    var pseudos = matches
        .filter(function (s) { return s.startsWith(':'); })
        .map(function (s) { return postProcessPseudos(s.substring(1)); });
    return {
        id: ids[0] || '',
        tag: tag,
        classList: classList,
        attributes: attrs,
        nextSelector: nextSelector,
        pseudos: pseudos
    };
}
exports.parseSelector = parseSelector;
function parseAttrValue(v) {
    if (v.startsWith('"')) {
        return v.slice(1, -1);
    }
    if (v === "true") {
        return true;
    }
    if (v === "false") {
        return false;
    }
    var f = parseFloat(v);
    if (isNaN(f)) {
        return v;
    }
    return f;
}
function postProcessPseudos(sel) {
    if (sel === 'first-child' ||
        sel === 'last-child' ||
        sel === 'root' ||
        sel === 'empty') {
        return [sel, undefined];
    }
    if (sel.startsWith('contains')) {
        var text = sel.slice(10, -2);
        return ['contains', text];
    }
    var content = sel.slice(10, -1);
    if (content === 'even') {
        content = '2n';
    }
    if (content === 'odd') {
        content = '2n+1';
    }
    return ['nth-child', content];
}
function getOp(op) {
    switch (op) {
        case '=':
            return 'exact';
        case '^=':
            return 'startsWith';
        case '$=':
            return 'endsWith';
        case '*=':
            return 'contains';
        case '~=':
            return 'whitespace';
        case '|=':
            return 'dash';
        default:
            return 'has';
    }
}
function getCombinator(comb) {
    switch (comb.trim()) {
        case '>':
            return 'child';
        case '+':
            return 'nextSibling';
        case '~':
            return 'sibling';
        default:
            return 'subtree';
    }
}

},{}],80:[function(require,module,exports){
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

},{"../index":83}],81:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"../index":83,"dup":14}],82:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../index");
var NO = {};
var SampleCombineListener = /** @class */ (function () {
    function SampleCombineListener(i, p) {
        this.i = i;
        this.p = p;
        p.ils[i] = this;
    }
    SampleCombineListener.prototype._n = function (t) {
        var p = this.p;
        if (p.out === NO)
            return;
        p.up(t, this.i);
    };
    SampleCombineListener.prototype._e = function (err) {
        this.p._e(err);
    };
    SampleCombineListener.prototype._c = function () {
        this.p.down(this.i, this);
    };
    return SampleCombineListener;
}());
exports.SampleCombineListener = SampleCombineListener;
var SampleCombineOperator = /** @class */ (function () {
    function SampleCombineOperator(ins, streams) {
        this.type = 'sampleCombine';
        this.ins = ins;
        this.others = streams;
        this.out = NO;
        this.ils = [];
        this.Nn = 0;
        this.vals = [];
    }
    SampleCombineOperator.prototype._start = function (out) {
        this.out = out;
        var s = this.others;
        var n = this.Nn = s.length;
        var vals = this.vals = new Array(n);
        for (var i = 0; i < n; i++) {
            vals[i] = NO;
            s[i]._add(new SampleCombineListener(i, this));
        }
        this.ins._add(this);
    };
    SampleCombineOperator.prototype._stop = function () {
        var s = this.others;
        var n = s.length;
        var ils = this.ils;
        this.ins._remove(this);
        for (var i = 0; i < n; i++) {
            s[i]._remove(ils[i]);
        }
        this.out = NO;
        this.vals = [];
        this.ils = [];
    };
    SampleCombineOperator.prototype._n = function (t) {
        var out = this.out;
        if (out === NO)
            return;
        if (this.Nn > 0)
            return;
        out._n([t].concat(this.vals));
    };
    SampleCombineOperator.prototype._e = function (err) {
        var out = this.out;
        if (out === NO)
            return;
        out._e(err);
    };
    SampleCombineOperator.prototype._c = function () {
        var out = this.out;
        if (out === NO)
            return;
        out._c();
    };
    SampleCombineOperator.prototype.up = function (t, i) {
        var v = this.vals[i];
        if (this.Nn > 0 && v === NO) {
            this.Nn--;
        }
        this.vals[i] = t;
    };
    SampleCombineOperator.prototype.down = function (i, l) {
        this.others[i]._remove(l);
    };
    return SampleCombineOperator;
}());
exports.SampleCombineOperator = SampleCombineOperator;
var sampleCombine;
/**
 *
 * Combines a source stream with multiple other streams. The result stream
 * will emit the latest events from all input streams, but only when the
 * source stream emits.
 *
 * If the source, or any input stream, throws an error, the result stream
 * will propagate the error. If any input streams end, their final emitted
 * value will remain in the array of any subsequent events from the result
 * stream.
 *
 * The result stream will only complete upon completion of the source stream.
 *
 * Marble diagram:
 *
 * ```text
 * --1----2-----3--------4--- (source)
 * ----a-----b-----c--d------ (other)
 *      sampleCombine
 * -------2a----3b-------4d--
 * ```
 *
 * Examples:
 *
 * ```js
 * import sampleCombine from 'xstream/extra/sampleCombine'
 * import xs from 'xstream'
 *
 * const sampler = xs.periodic(1000).take(3)
 * const other = xs.periodic(100)
 *
 * const stream = sampler.compose(sampleCombine(other))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > [0, 8]
 * > [1, 18]
 * > [2, 28]
 * ```
 *
 * ```js
 * import sampleCombine from 'xstream/extra/sampleCombine'
 * import xs from 'xstream'
 *
 * const sampler = xs.periodic(1000).take(3)
 * const other = xs.periodic(100).take(2)
 *
 * const stream = sampler.compose(sampleCombine(other))
 *
 * stream.addListener({
 *   next: i => console.log(i),
 *   error: err => console.error(err),
 *   complete: () => console.log('completed')
 * })
 * ```
 *
 * ```text
 * > [0, 1]
 * > [1, 1]
 * > [2, 1]
 * ```
 *
 * @param {...Stream} streams One or more streams to combine with the sampler
 * stream.
 * @return {Stream}
 */
sampleCombine = function sampleCombine() {
    var streams = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        streams[_i] = arguments[_i];
    }
    return function sampleCombineOperator(sampler) {
        return new index_1.Stream(new SampleCombineOperator(sampler, streams));
    };
};
exports.default = sampleCombine;

},{"../index":83}],83:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"symbol-observable":73}],84:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var xstream_1 = require("xstream");
var dropRepeats_1 = require("xstream/extra/dropRepeats");
var isolate_1 = require("@cycle/isolate");
var action_1 = require("@cycle-robot-drivers/action");
var actionbank_1 = require("@cycle-robot-drivers/actionbank");
var S;
(function (S) {
    S["PEND"] = "PEND";
    S["MONOLOGUE"] = "MONOLOGUE";
    S["QUESTION_ANSWER"] = "QUESTION_ANSWER";
    S["INSTRUCTION"] = "INSTRUCTION";
})(S || (S = {}));
var SIGType;
(function (SIGType) {
    SIGType["GOAL"] = "GOAL";
    SIGType["CANCEL"] = "CANCEL";
    SIGType["MONO_DONE"] = "MONO_DONE";
    SIGType["QA_SUCCEEDED"] = "QA_SUCCEEDED";
    SIGType["QA_FAILED"] = "QA_FAILED";
    SIGType["INST_SUCCEEDED"] = "INST_SUCCEEDED";
    SIGType["INST_FAILED"] = "INST_FAILED";
})(SIGType || (SIGType = {}));
function input(goal$, monologueResult$, questionAnswerResult$, instructionResult$) {
    return xstream_1.default.merge(goal$.filter(function (g) { return typeof g !== 'undefined'; }).map(function (g) { return (g === null)
        ? ({ type: SIGType.CANCEL, value: null })
        : ({ type: SIGType.GOAL, value: action_1.initGoal(g) }); }), monologueResult$
        .filter(function (r) { return r.status.status === action_1.Status.SUCCEEDED; })
        .mapTo({ type: SIGType.MONO_DONE }).debug(), questionAnswerResult$
        .filter(function (r) { return r.status.status === action_1.Status.SUCCEEDED; })
        .map(function (r) { return ({ type: SIGType.QA_SUCCEEDED, value: r.result }); }), questionAnswerResult$
        .filter(function (r) { return r.status.status !== action_1.Status.SUCCEEDED; })
        .map(function (r) { return ({ type: SIGType.QA_FAILED, value: r.result }); }), instructionResult$
        .filter(function (r) { return r.status.status === action_1.Status.SUCCEEDED; })
        .map(function (r) { return ({ type: SIGType.INST_SUCCEEDED, value: r.result }); }), instructionResult$
        .filter(function (r) { return r.status.status !== action_1.Status.SUCCEEDED; })
        .map(function (r) { return ({ type: SIGType.INST_FAILED, value: r.result }); }));
}
function reducer(input$) {
    var initReducer$ = xstream_1.default.of(function (prev) {
        if (typeof prev === 'undefined') {
            return {
                state: S.PEND,
                variables: null,
                outputs: null,
            };
        }
        else {
            return prev;
        }
    });
    var transitionReducer$ = input$.map(function (input) { return function (prev) {
        console.debug('input', input, 'prev', prev);
        if (prev.state === S.PEND && input.type === SIGType.GOAL) {
            var flowchart = Object.assign.apply(Object, [{}].concat(Array.from(input.value.goal.flowchart, function (_a) {
                var id = _a.id, o = __rest(_a, ["id"]);
                return (_b = {}, _b[id] = __assign({ id: id }, o), _b);
                var _b;
            })));
            var node = flowchart[input.value.goal.start_id];
            if (node && node.type === 'MONOLOGUE') {
                return __assign({}, prev, { state: S.MONOLOGUE, variables: {
                        goal_id: input.value.goal_id,
                        flowchart: flowchart,
                        node: node,
                    }, outputs: {
                        MonologueAction: {
                            goal: action_1.initGoal(node.arg),
                        },
                    } });
            }
        }
        else if (prev.state === S.MONOLOGUE && input.type === SIGType.MONO_DONE
            || prev.state === S.INSTRUCTION && input.type === SIGType.INST_SUCCEEDED) {
            var node = prev.variables.flowchart[prev.variables.node.next];
            if (node.type === 'MONOLOGUE') {
                return __assign({}, prev, { state: S.MONOLOGUE, variables: __assign({}, prev.variables, { node: node }), outputs: {
                        MonologueAction: {
                            goal: action_1.initGoal(node.arg),
                        },
                    } });
            }
            else if (node.type === 'INSTRUCTION') {
                return __assign({}, prev, { state: S.INSTRUCTION, variables: __assign({}, prev.variables, { node: node }), outputs: {
                        QuestionAnswerAction: {
                            goal: action_1.initGoal({
                                question: node.arg,
                                answers: ['Done'],
                            }),
                        },
                    } });
            }
        }
        return prev;
    }; });
    return xstream_1.default.merge(initReducer$, transitionReducer$);
}
function output(reducerState$) {
    var outputs$ = reducerState$
        .filter(function (m) { return !!m.outputs; })
        .map(function (m) { return m.outputs; });
    return {
        result: outputs$
            .filter(function (o) { return !!o.result; })
            .map(function (o) { return o.result; })
            .compose(dropRepeats_1.default(action_1.isEqualResult)),
        MonologueAction: outputs$
            .filter(function (o) { return !!o.MonologueAction; })
            .map(function (o) { return o.MonologueAction.goal; })
            .compose(dropRepeats_1.default(action_1.isEqualGoal)),
        QuestionAnswerAction: outputs$
            .filter(function (o) { return !!o.QuestionAnswerAction; })
            .map(function (o) { return o.QuestionAnswerAction.goal; })
            .compose(dropRepeats_1.default(action_1.isEqualGoal)),
    };
}
function FlowchartAction(sources) {
    sources.state.stream.addListener({ next: function (v) { return console.log('state$', v); } });
    var goalProxy$ = xstream_1.default.create();
    var goalProxy2$ = xstream_1.default.create();
    var qaSinks = isolate_1.default(actionbank_1.QAWithScreenAction, 'QuestionAnswerAction')(__assign({}, sources, { goal: goalProxy$ }));
    var monoSinks = isolate_1.default(actionbank_1.SpeakWithScreenAction, 'SpeakWithScreenAction')({
        goal: goalProxy2$,
        TwoSpeechbubblesAction: sources.TwoSpeechbubblesAction,
        SpeechSynthesisAction: sources.SpeechSynthesisAction,
        state: sources.state,
    });
    var input$ = input(sources.goal, sources.SpeechSynthesisAction.result, qaSinks.result, qaSinks.result);
    var parentReducer$ = reducer(input$);
    var reducer$ = xstream_1.default.merge(parentReducer$, qaSinks.state, monoSinks.state);
    var reducerState$ = sources.state.stream;
    var outputs = output(reducerState$);
    goalProxy$.imitate(outputs.QuestionAnswerAction.compose(dropRepeats_1.default(action_1.isEqualGoal)));
    goalProxy2$.imitate(outputs.MonologueAction.compose(dropRepeats_1.default(action_1.isEqualGoal)));
    var speechbubbles$ = xstream_1.default.merge(qaSinks.TwoSpeechbubblesAction, monoSinks.TwoSpeechbubblesAction);
    var speak$ = xstream_1.default.merge(qaSinks.SpeechSynthesisAction, monoSinks.SpeechSynthesisAction);
    return {
        result: outputs.result,
        TwoSpeechbubblesAction: speechbubbles$,
        SpeechSynthesisAction: speak$,
        SpeechRecognitionAction: qaSinks.SpeechRecognitionAction,
        state: reducer$,
    };
}
exports.FlowchartAction = FlowchartAction;

},{"@cycle-robot-drivers/action":16,"@cycle-robot-drivers/actionbank":4,"@cycle/isolate":39,"xstream":83,"xstream/extra/dropRepeats":81}],85:[function(require,module,exports){
"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var dom_1 = require("@cycle/dom");
var isolate_1 = require("@cycle/isolate");
var action_1 = require("@cycle-robot-drivers/action");
var screen_1 = require("@cycle-robot-drivers/screen");
var speech_1 = require("@cycle-robot-drivers/speech");
var actionbank_1 = require("@cycle-robot-drivers/actionbank");
var FlowchartAction_1 = require("./FlowchartAction");
function RobotApp(sources) {
    var state$ = sources.state.stream;
    var twoSpeechbubblesResult$ = state$
        .compose(actionbank_1.selectActionResult('TwoSpeechbubblesAction'));
    var speechSynthesisResult$ = state$
        .compose(actionbank_1.selectActionResult('SpeechSynthesisAction'));
    var speechRecognitionResult$ = state$
        .compose(actionbank_1.selectActionResult('SpeechRecognitionAction'));
    var flowchartMetadata = [
        {
            name: 'Broccoli cheese soup',
            path: '/flowcharts/crockpot-buffalo-chicken.json',
        },
    ];
    var data$ = xstream_1.default.combine.apply(null, flowchartMetadata.map(function (d) { return xstream_1.default.fromPromise(fetch(d.path, {
        headers: {
            "content-type": "application/json"
        }
    })).map(function (v) { return xstream_1.default.fromPromise(v.json()).map(function (j) { return (__assign({}, d, j)); }); }).flatten(); }));
    var goalId = { stamp: new Date(), id: '#main-screen' };
    var goal$ = xstream_1.default.combine(data$, twoSpeechbubblesResult$)
        .filter(function (_a) {
        var data = _a[0], r = _a[1];
        return action_1.isEqual(r.status.goal_id, goalId)
            && r.status.status !== action_1.Status.PREEMPTED
            && data.filter(function (d) { return d.name === r.result; }).length > 0;
    })
        .map(function (_a) {
        var data = _a[0], r = _a[1];
        return ({
            flowchart: data.filter(function (d) { return d.name === r.result; })[0].flowchart,
            start_id: data.filter(function (d) { return d.name === r.result; })[0].start_id,
        });
    });
    var childSinks = isolate_1.default(FlowchartAction_1.FlowchartAction)({
        goal: goal$,
        TwoSpeechbubblesAction: { result: twoSpeechbubblesResult$ },
        SpeechSynthesisAction: { result: speechSynthesisResult$ },
        SpeechRecognitionAction: { result: speechRecognitionResult$ },
        state: sources.state,
    });
    var mainScreen$ = data$.map(function (data) { return ({
        goal_id: goalId,
        goal: {
            message: 'I can help you answer some questions',
            choices: data.map(function (d) { return d.name; }),
        }
    }); });
    var twoSpeechbubblesGoal$ = xstream_1.default.merge(xstream_1.default.combine(mainScreen$, childSinks.result.startWith(null)).map(function (x) { return x[0]; }), childSinks.TwoSpeechbubblesAction) || xstream_1.default.never();
    var twoSpeechbubblesAction = screen_1.TwoSpeechbubblesAction({
        goal: twoSpeechbubblesGoal$,
        DOM: sources.DOM,
    });
    var speechSynthesisAction = speech_1.SpeechSynthesisAction({
        goal: childSinks.SpeechSynthesisAction || xstream_1.default.never(),
        SpeechSynthesis: sources.SpeechSynthesis,
    });
    var speechRecognitionAction = speech_1.SpeechRecognitionAction({
        goal: childSinks.SpeechRecognitionAction || xstream_1.default.never(),
        SpeechRecognition: sources.SpeechRecognition,
    });
    var parentReducer$ = xstream_1.default.merge(twoSpeechbubblesAction.result.map(function (result) {
        return function (prev) { return (__assign({}, prev, { TwoSpeechbubblesAction: { outputs: { result: result } } })); };
    }), speechSynthesisAction.result.map(function (result) {
        return function (prev) { return (__assign({}, prev, { SpeechSynthesisAction: { outputs: { result: result } } })); };
    }), speechRecognitionAction.result.map(function (result) {
        return function (prev) { return (__assign({}, prev, { SpeechRecognitionAction: { outputs: { result: result } } })); };
    }));
    var childReducer$ = childSinks.state;
    var reducer$ = xstream_1.default.merge(parentReducer$, childReducer$);
    var vdom$ = xstream_1.default.combine(twoSpeechbubblesAction.DOM, sources.TabletFace.DOM).map(function (_a) {
        var speechbubbles = _a[0], face = _a[1];
        return dom_1.div({
            style: { position: 'relative' }
        }, [speechbubbles, face]);
    });
    return {
        DOM: vdom$,
        SpeechSynthesis: speechSynthesisAction.output,
        SpeechRecognition: speechRecognitionAction.output,
        state: reducer$,
    };
}
exports.default = RobotApp;

},{"./FlowchartAction":84,"@cycle-robot-drivers/action":16,"@cycle-robot-drivers/actionbank":4,"@cycle-robot-drivers/screen":90,"@cycle-robot-drivers/speech":148,"@cycle/dom":32,"@cycle/isolate":39,"xstream":83}],86:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = require("@cycle/dom");
var state_1 = require("@cycle/state");
var run_1 = require("@cycle/run");
var screen_1 = require("@cycle-robot-drivers/screen");
var speech_1 = require("@cycle-robot-drivers/speech");
var RobotApp_1 = require("./RobotApp");
var main = state_1.withState(RobotApp_1.default);
run_1.run(main, {
    DOM: dom_1.makeDOMDriver('#app'),
    TabletFace: screen_1.makeTabletFaceDriver(),
    SpeechSynthesis: speech_1.makeSpeechSynthesisDriver(),
    SpeechRecognition: speech_1.makeSpeechRecognitionDriver(),
});

},{"./RobotApp":85,"@cycle-robot-drivers/screen":90,"@cycle-robot-drivers/speech":148,"@cycle/dom":32,"@cycle/run":43,"@cycle/state":47}],87:[function(require,module,exports){
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
var dropRepeats_1 = __importDefault(require("xstream/extra/dropRepeats"));
var adapt_1 = require("@cycle/run/lib/adapt");
var action_1 = require("@cycle-robot-drivers/action");
;
/**
 * FacialExpression action component.
 *
 * @param sources
 *
 *   * goal: a stream of `null` (as "cancel") or a string '`happy'`, '`sad'`,
 *     '`angry'`, '`focused'`, or '`confused'` (as the TabletFace driver's
 *     `EXPRESS` type command value).
 *   * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).
 *
 * @return sinks
 *
 *   * output: a stream for the TabletFace driver.
 *   * status: depreciated.
 *   * result: a stream of action results. `result.result` is always `null`.
 *
 */
function FacialExpressionAction(sources) {
    var goal$ = xstream_1.default.fromObservable(sources.goal).filter(function (goal) { return typeof goal !== 'undefined'; }).map(function (goal) {
        if (goal === null) {
            return {
                type: 'CANCEL',
                value: null,
            };
        }
        else {
            var value = !!goal.goal_id ? goal : action_1.initGoal(goal);
            return {
                type: 'GOAL',
                value: typeof value.goal === 'string' ? {
                    goal_id: value.goal_id,
                    goal: {
                        type: value.goal,
                    }
                } : value,
            };
        }
    });
    var action$ = xstream_1.default.merge(goal$, sources.TabletFace.animationFinish.mapTo({
        type: 'END',
        value: null,
    }));
    var initialState = {
        goal: null,
        goal_id: action_1.generateGoalID(),
        status: action_1.Status.SUCCEEDED,
        result: null,
    };
    var state$ = action$.fold(function (state, action) {
        // console.debug('state', state, 'action', action);
        if (state.status === action_1.Status.SUCCEEDED
            || state.status === action_1.Status.PREEMPTED
            || state.status === action_1.Status.ABORTED) {
            if (action.type === 'GOAL') {
                var goal = action.value;
                return {
                    goal_id: goal.goal_id,
                    goal: goal.goal,
                    status: action_1.Status.ACTIVE,
                    result: null,
                };
            }
            else if (action.type === 'CANCEL') {
                console.debug('Ignore CANCEL in DONE states');
                return state;
            }
        }
        else if (state.status === action_1.Status.ACTIVE) {
            if (action.type === 'GOAL') {
                state$.shamefullySendNext(__assign({}, state, { goal: null, status: action_1.Status.PREEMPTED }));
                var goal = action.value;
                return {
                    goal_id: goal.goal_id,
                    goal: goal.goal,
                    status: action_1.Status.ACTIVE,
                    result: null,
                };
            }
            else if (action.type === 'END') {
                return __assign({}, state, { status: action_1.Status.SUCCEEDED, result: action.value });
            }
            else if (action.type === 'CANCEL') {
                return __assign({}, state, { goal: null, status: action_1.Status.PREEMPTED });
            }
        }
        console.debug("Unhandled state.status " + state.status + " action.type " + action.type);
        return state;
    }, initialState);
    var stateStatusChanged$ = state$
        .compose(dropRepeats_1.default(function (x, y) { return (x.status === y.status && action_1.isEqual(x.goal_id, y.goal_id)); }));
    var value$ = stateStatusChanged$
        .filter(function (state) {
        return state.status === action_1.Status.ACTIVE || state.status === action_1.Status.PREEMPTED;
    })
        .map(function (state) {
        if (state.status === action_1.Status.ACTIVE) {
            return {
                type: 'EXPRESS',
                value: state.goal,
            };
        }
        else { // state.status === Status.PREEMPTED
            return null;
        }
    });
    var status$ = stateStatusChanged$
        .map(function (state) { return ({
        goal_id: state.goal_id,
        status: state.status,
    }); });
    var result$ = stateStatusChanged$
        .filter(function (state) { return (state.status === action_1.Status.SUCCEEDED
        || state.status === action_1.Status.PREEMPTED
        || state.status === action_1.Status.ABORTED); })
        .map(function (state) { return ({
        status: {
            goal_id: state.goal_id,
            status: state.status,
        },
        result: state.result,
    }); });
    // IMPORTANT!! empty the streams manually; otherwise it emits the first
    //   "SUCCEEDED" result
    value$.addListener({ next: function () { } });
    return {
        output: adapt_1.adapt(value$),
        status: adapt_1.adapt(status$),
        result: adapt_1.adapt(result$),
    };
}
exports.FacialExpressionAction = FacialExpressionAction;

},{"@cycle-robot-drivers/action":92,"@cycle/run/lib/adapt":116,"xstream":145,"xstream/extra/dropRepeats":143}],88:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = __importDefault(require("xstream"));
var adapt_1 = require("@cycle/run/lib/adapt");
var isolate_1 = __importDefault(require("@cycle/isolate"));
var dom_1 = require("@cycle/dom");
var action_1 = require("@cycle-robot-drivers/action");
var State;
(function (State) {
    State["RUNNING"] = "RUNNING";
    State["DONE"] = "DONE";
})(State || (State = {}));
var InputType;
(function (InputType) {
    InputType["GOAL"] = "GOAL";
    InputType["CANCEL"] = "CANCEL";
    InputType["CLICK"] = "CLICK";
})(InputType || (InputType = {}));
var SpeechbubbleType;
(function (SpeechbubbleType) {
    SpeechbubbleType["MESSAGE"] = "MESSAGE";
    SpeechbubbleType["CHOICE"] = "CHOICE";
})(SpeechbubbleType = exports.SpeechbubbleType || (exports.SpeechbubbleType = {}));
function input(goal$, clickEvent$) {
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
                        goal: { type: SpeechbubbleType.MESSAGE, value: value.goal },
                    } : Array.isArray(value.goal)
                    ? {
                        goal_id: value.goal_id,
                        goal: { type: SpeechbubbleType.CHOICE, value: value.goal },
                    } : value.goal,
            };
        }
    }), clickEvent$.map(function (event) { return ({
        type: InputType.CLICK,
        value: event.target.textContent
    }); }));
}
function createTransition() {
    var styles = {
        message: {
            fontFamily: 'helvetica',
            fontSize: '3em',
            fontWeight: 'lighter',
        },
        button: {
            margin: '0 0.25em 0 0.25em',
            backgroundColor: 'transparent',
            border: '0.05em solid black',
            fontFamily: 'helvetica',
            fontSize: '2.5em',
            fontWeight: 'lighter',
        },
    };
    var transitionTable = (_a = {},
        _a[State.DONE] = (_b = {},
            _b[InputType.GOAL] = function (variables, inputValue) { return ({
                state: State.RUNNING,
                variables: {
                    goal_id: inputValue.goal_id,
                    goal: inputValue.goal,
                    newGoal: null,
                },
                outputs: {
                    DOM: {
                        goal: inputValue.goal.type === SpeechbubbleType.MESSAGE
                            ? dom_1.span({ style: styles.message }, inputValue.goal.value)
                            : inputValue.goal.type === SpeechbubbleType.CHOICE
                                ? dom_1.span(inputValue.goal.value.map(function (text) { return dom_1.button('.choice', { style: styles.button }, text); })) : ''
                    },
                },
            }); },
            _b),
        _a[State.RUNNING] = (_c = {},
            _c[InputType.GOAL] = function (variables, inputValue) { return ({
                state: State.RUNNING,
                variables: {
                    goal_id: inputValue.goal_id,
                    goal: inputValue.goal,
                    newGoal: null,
                },
                outputs: {
                    DOM: {
                        goal: inputValue.goal.type === SpeechbubbleType.MESSAGE
                            ? dom_1.span({ style: styles.message }, inputValue.goal.value)
                            : inputValue.goal.type === SpeechbubbleType.CHOICE
                                ? dom_1.span(inputValue.goal.value.map(function (text) { return dom_1.button('.choice', { style: styles.button }, text); })) : ''
                    },
                    result: {
                        status: {
                            goal_id: variables.goal_id,
                            status: action_1.Status.PREEMPTED,
                        },
                        result: null,
                    }
                },
            }); },
            _c[InputType.CANCEL] = function (variables, inputValue) { return ({
                state: State.DONE,
                variables: {
                    goal_id: null,
                    goal: null,
                    newGoal: null,
                },
                outputs: {
                    DOM: {
                        goal: '',
                    },
                    result: {
                        status: {
                            goal_id: variables.goal_id,
                            status: action_1.Status.PREEMPTED,
                        },
                        result: null,
                    }
                },
            }); },
            _c[InputType.CLICK] = function (variables, inputValue) {
                return variables.goal.type === SpeechbubbleType.CHOICE
                    ? {
                        state: State.DONE,
                        variables: {
                            goal_id: null,
                            goal: inputValue.goal,
                            newGoal: null,
                        },
                        outputs: {
                            DOM: {
                                goal: '',
                            },
                            result: {
                                status: {
                                    goal_id: variables.goal_id,
                                    status: action_1.Status.SUCCEEDED,
                                },
                                result: inputValue,
                            }
                        },
                    } : null;
            },
            _c),
        _a);
    return function (state, variables, input) {
        var prev = { state: state, variables: variables, outputs: null };
        return !transitionTable[state]
            ? prev
            : !transitionTable[state][input.type]
                ? prev
                : (transitionTable[state][input.type](variables, input.value) || prev);
    };
    var _a, _b, _c;
}
function transitionReducer(input$) {
    var initReducer$ = xstream_1.default.of(function initReducer(machine) {
        return {
            state: State.DONE,
            variables: {
                goal_id: null,
                goal: null,
                newGoal: null,
            },
            outputs: null,
        };
    });
    var transition = createTransition();
    var inputReducer$ = input$
        .map(function (input) { return function inputReducer(machine) {
        return transition(machine.state, machine.variables, input);
    }; });
    return xstream_1.default.merge(initReducer$, inputReducer$);
}
function output(machine$) {
    var outputs$ = machine$
        .filter(function (machine) { return !!machine.outputs; })
        .map(function (machine) { return machine.outputs; });
    return {
        DOM: adapt_1.adapt(outputs$
            .filter(function (outputs) { return !!outputs.DOM; })
            .map(function (outputs) { return outputs.DOM.goal; }).startWith('')),
        result: adapt_1.adapt(outputs$
            .filter(function (outputs) { return !!outputs.result; })
            .map(function (outputs) { return outputs.result; })),
    };
}
/**
 * Speechbubble action component.
 *
 * @param sources
 *
 *   * goal: a stream of `null` (as "cancel"),
 *     `{type: 'MESSAGE', value: 'Hello world'}` or `'Hello world'` (as
 *     "message"), or `{type: 'CHOICE', value: ['Hello', 'World']}`
 *     or `['Hello', 'World']` (as "multiple choice").
 *   * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).
 *
 * @return sinks
 *
 *   * DOM: a stream of virtual DOM objects, i.e, [Snabbdom “VNode” objects](https://github.com/snabbdom/snabbdom).
 *   * result: a stream of action results.
 *
 */
function SpeechbubbleAction(sources) {
    var input$ = input(xstream_1.default.fromObservable(sources.goal), xstream_1.default.fromObservable(
    // IMPORTANT!! This makes the click stream always exist.
    sources.DOM.select('.choice').elements()
        .map(function (b) { return sources.DOM.select('.choice').events('click', {
        preventDefault: true
    }); })
        .flatten()));
    var machine$ = transitionReducer(input$)
        .fold(function (state, reducer) { return reducer(state); }, null)
        .drop(1); // drop "null";
    var sinks = output(machine$);
    return sinks;
}
exports.SpeechbubbleAction = SpeechbubbleAction;
function IsolatedSpeechbubbleAction(sources) {
    return isolate_1.default(SpeechbubbleAction)(sources);
}
exports.IsolatedSpeechbubbleAction = IsolatedSpeechbubbleAction;

},{"@cycle-robot-drivers/action":92,"@cycle/dom":108,"@cycle/isolate":115,"@cycle/run/lib/adapt":116,"xstream":145}],89:[function(require,module,exports){
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
var isolate_1 = __importDefault(require("@cycle/isolate"));
var dom_1 = require("@cycle/dom");
var action_1 = require("@cycle-robot-drivers/action");
var SpeechbubbleAction_1 = require("./SpeechbubbleAction");
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
    InputType["RESULT"] = "RESULT";
})(InputType || (InputType = {}));
var TwoSpeechbubblesType;
(function (TwoSpeechbubblesType) {
    TwoSpeechbubblesType["SET_MESSAGE"] = "SET_MESSAGE";
    TwoSpeechbubblesType["ASK_QUESTION"] = "ASK_QUESTION";
})(TwoSpeechbubblesType = exports.TwoSpeechbubblesType || (exports.TwoSpeechbubblesType = {}));
function input(goal$, humanSpeechbubbleResult) {
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
                value: !value.goal.type ? {
                    goal_id: value.goal_id,
                    goal: {
                        type: typeof value.goal === 'string'
                            ? TwoSpeechbubblesType.SET_MESSAGE
                            : TwoSpeechbubblesType.ASK_QUESTION,
                        value: value.goal,
                    }
                } : value,
            };
        }
    }), humanSpeechbubbleResult.map(function (result) { return ({
        type: InputType.RESULT,
        value: result,
    }); }));
}
function createTransition() {
    var transitionTable = (_a = {},
        _a[State.DONE] = (_b = {},
            _b[InputType.GOAL] = function (variables, inputValue) { return ({
                state: State.RUNNING,
                variables: {
                    goal_id: inputValue.goal_id,
                    newGoal: null,
                },
                outputs: {
                    RobotSpeechbubble: {
                        goal: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE ? {
                            goal_id: inputValue.goal_id,
                            goal: inputValue.goal.value,
                        } : {
                            goal_id: inputValue.goal_id,
                            goal: inputValue.goal.value.message
                        },
                    },
                    HumanSpeechbubble: {
                        goal: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE
                            ? null
                            : {
                                goal_id: inputValue.goal_id,
                                goal: inputValue.goal.value.choices
                            },
                    },
                },
            }); },
            _b),
        _a[State.RUNNING] = (_c = {},
            _c[InputType.GOAL] = function (variables, inputValue) {
                return {
                    state: State.RUNNING,
                    variables: {
                        goal_id: inputValue.goal_id,
                        newGoal: null,
                    },
                    outputs: {
                        RobotSpeechbubble: {
                            goal: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE ? {
                                goal_id: inputValue.goal_id,
                                goal: inputValue.goal.value,
                            } : {
                                goal_id: inputValue.goal_id,
                                goal: inputValue.goal.value.message
                            },
                        },
                        HumanSpeechbubble: {
                            goal: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE
                                ? null
                                : {
                                    goal_id: inputValue.goal_id,
                                    goal: inputValue.goal.value.choices
                                },
                        },
                        result: {
                            status: {
                                goal_id: variables.goal_id,
                                status: action_1.Status.PREEMPTED,
                            },
                            result: null,
                        },
                    },
                };
            },
            _c[InputType.CANCEL] = function (variables, inputValue) { return ({
                state: State.DONE,
                variables: variables,
                outputs: {
                    RobotSpeechbubble: { goal: null },
                    HumanSpeechbubble: { goal: null },
                    result: {
                        status: {
                            goal_id: variables.goal_id,
                            status: action_1.Status.PREEMPTED,
                        },
                        result: null,
                    },
                }
            }); },
            _c[InputType.RESULT] = function (variables, inputValue) {
                return action_1.isEqual(inputValue.status.goal_id, variables.goal_id)
                    && typeof inputValue.result === 'string' ? {
                    state: State.DONE,
                    variables: {
                        goal_id: null,
                        result: null,
                        newGoal: null,
                    },
                    outputs: {
                        RobotSpeechbubble: { goal: null },
                        HumanSpeechbubble: { goal: null },
                        result: {
                            status: {
                                goal_id: variables.goal_id,
                                status: action_1.Status.SUCCEEDED,
                            },
                            result: inputValue.result,
                        },
                    },
                } : null;
            },
            _c),
        _a);
    return function (state, variables, input) {
        var prev = { state: state, variables: variables, outputs: null };
        return !transitionTable[state]
            ? prev
            : !transitionTable[state][input.type]
                ? prev
                : (transitionTable[state][input.type](variables, input.value) || prev);
    };
    var _a, _b, _c;
}
function transitionReducer(input$) {
    var initReducer$ = xstream_1.default.of(function initReducer(machine) {
        return {
            state: State.DONE,
            variables: {
                goal_id: null,
                newGoal: null,
            },
            outputs: null,
        };
    });
    var transition = createTransition();
    var inputReducer$ = input$
        .map(function (input) { return function inputReducer(machine) {
        return transition(machine.state, machine.variables, input);
    }; });
    return xstream_1.default.merge(initReducer$, inputReducer$);
}
function output(machine$) {
    var outputs$ = machine$
        .filter(function (machine) { return !!machine.outputs; })
        .map(function (machine) { return machine.outputs; });
    return {
        RobotSpeechbubble: adapt_1.adapt(outputs$
            .filter(function (outputs) { return !!outputs.RobotSpeechbubble; })
            .map(function (outputs) { return outputs.RobotSpeechbubble.goal; })),
        HumanSpeechbubble: adapt_1.adapt(outputs$
            .filter(function (outputs) { return !!outputs.HumanSpeechbubble; })
            .map(function (outputs) { return outputs.HumanSpeechbubble.goal; })),
        result: adapt_1.adapt(outputs$
            .filter(function (outputs) { return !!outputs.result; })
            .map(function (outputs) { return outputs.result; })),
    };
}
/**
 * TwoSpeechbubbles, Robot and Human, action component.
 *
 * @param sources
 *
 *   * goal: a stream of `null` (as "cancel"),
 *     `{type: 'SET_MESSAGE', value: 'Hello world'}` or `'Hello world'` (as
 *     "set message"), or `{type: 'ASK_QUESTION', message: 'Blue pill or
 *     red pill?', choices: ['Blue', 'Red']}` (as "ask multiple choice").
 *   * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).
 *
 * @return sinks
 *
 *   * DOM: a stream of virtual DOM objects, i.e, [Snabbdom “VNode” objects](https://github.com/snabbdom/snabbdom).
 *   * result: a stream of action results.
 *
 */
function TwoSpeechbubblesAction(sources) {
    // create proxies
    var humanSpeechbubbleResult = xstream_1.default.create();
    var input$ = input(xstream_1.default.fromObservable(sources.goal), humanSpeechbubbleResult);
    var machine$ = transitionReducer(input$)
        .fold(function (state, reducer) { return reducer(state); }, null)
        .drop(1); // drop "null";
    var _a = output(machine$), RobotSpeechbubble = _a.RobotSpeechbubble, HumanSpeechbubble = _a.HumanSpeechbubble, result = _a.result;
    // create sub-components
    var robotSpeechbubble = SpeechbubbleAction_1.IsolatedSpeechbubbleAction({
        goal: RobotSpeechbubble,
        DOM: sources.DOM,
    });
    var humanSpeechbubble = SpeechbubbleAction_1.IsolatedSpeechbubbleAction({
        goal: HumanSpeechbubble,
        DOM: sources.DOM,
    });
    // IMPORTANT!! Attach listeners to the DOM streams BEFORE connecting the
    //   proxies to have NO QUEUE in the DOM streams.
    robotSpeechbubble.DOM.addListener({ next: function (value) { } });
    humanSpeechbubble.DOM.addListener({ next: function (value) { } });
    // connect proxies
    humanSpeechbubbleResult.imitate(humanSpeechbubble.result);
    var styles = {
        outer: {
            position: 'absolute',
            width: '100vw',
            zIndex: 1,
            margin: '1em',
        },
        bubble: {
            margin: 0,
            padding: '1em',
            maxWidth: '90%',
        },
    };
    var vdom$ = xstream_1.default.combine(robotSpeechbubble.DOM, humanSpeechbubble.DOM)
        .map(function (_a) {
        var robotVTree = _a[0], humanVTree = _a[1];
        return dom_1.div({ style: styles.outer }, [
            dom_1.div({ style: styles.bubble }, [dom_1.span(robotVTree)]),
            dom_1.div({ style: __assign({}, styles.bubble, { textAlign: 'right' }) }, [dom_1.span(humanVTree)]),
        ]);
    });
    return {
        DOM: vdom$,
        result: result,
    };
}
exports.TwoSpeechbubblesAction = TwoSpeechbubblesAction;
function IsolatedTwoSpeechbubblesAction(sources) {
    return isolate_1.default(TwoSpeechbubblesAction)(sources);
}
exports.IsolatedTwoSpeechbubblesAction = IsolatedTwoSpeechbubblesAction;

},{"./SpeechbubbleAction":88,"@cycle-robot-drivers/action":92,"@cycle/dom":108,"@cycle/isolate":115,"@cycle/run/lib/adapt":116,"xstream":145}],90:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var makeTabletFaceDriver_1 = require("./makeTabletFaceDriver");
exports.ExpressCommandType = makeTabletFaceDriver_1.ExpressCommandType;
exports.makeTabletFaceDriver = makeTabletFaceDriver_1.makeTabletFaceDriver;
var FacialExpressionAction_1 = require("./FacialExpressionAction");
exports.FacialExpressionAction = FacialExpressionAction_1.FacialExpressionAction;
var SpeechbubbleAction_1 = require("./SpeechbubbleAction");
exports.SpeechbubbleType = SpeechbubbleAction_1.SpeechbubbleType;
exports.SpeechbubbleAction = SpeechbubbleAction_1.SpeechbubbleAction;
exports.IsolatedSpeechbubbleAction = SpeechbubbleAction_1.IsolatedSpeechbubbleAction;
var TwoSpeechbubblesAction_1 = require("./TwoSpeechbubblesAction");
exports.TwoSpeechbubblesType = TwoSpeechbubblesAction_1.TwoSpeechbubblesType;
exports.TwoSpeechbubblesAction = TwoSpeechbubblesAction_1.TwoSpeechbubblesAction;
exports.IsolatedTwoSpeechbubblesAction = TwoSpeechbubblesAction_1.IsolatedTwoSpeechbubblesAction;

},{"./FacialExpressionAction":87,"./SpeechbubbleAction":88,"./TwoSpeechbubblesAction":89,"./makeTabletFaceDriver":91}],91:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = __importDefault(require("xstream"));
var dom_1 = require("@cycle/dom");
var adapt_1 = require("@cycle/run/lib/adapt");
// adapted from
//   https://github.com/mjyc/tablet-robot-face/blob/709b731dff04033c08cf045adc4e038eefa750a2/index.js#L3-L184
var EyeController = /** @class */ (function () {
    function EyeController(elements, eyeSize) {
        if (elements === void 0) { elements = {}; }
        if (eyeSize === void 0) { eyeSize = '33.33vmin'; }
        this._eyeSize = eyeSize;
        this._blinkTimeoutID = null;
        this.setElements(elements);
    }
    Object.defineProperty(EyeController.prototype, "leftEye", {
        get: function () { return this._leftEye; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EyeController.prototype, "rightEye", {
        get: function () { return this._rightEye; },
        enumerable: true,
        configurable: true
    });
    EyeController.prototype.setElements = function (_a) {
        var leftEye = _a.leftEye, rightEye = _a.rightEye, upperLeftEyelid = _a.upperLeftEyelid, upperRightEyelid = _a.upperRightEyelid, lowerLeftEyelid = _a.lowerLeftEyelid, lowerRightEyelid = _a.lowerRightEyelid;
        this._leftEye = leftEye;
        this._rightEye = rightEye;
        this._upperLeftEyelid = upperLeftEyelid;
        this._upperRightEyelid = upperRightEyelid;
        this._lowerLeftEyelid = lowerLeftEyelid;
        this._lowerRightEyelid = lowerRightEyelid;
        return this;
    };
    EyeController.prototype._createKeyframes = function (_a) {
        var _b = _a.tgtTranYVal, tgtTranYVal = _b === void 0 ? '0px' : _b, _c = _a.tgtRotVal, tgtRotVal = _c === void 0 ? '0deg' : _c, _d = _a.enteredOffset, enteredOffset = _d === void 0 ? 0 : _d, _e = _a.exitingOffset, exitingOffset = _e === void 0 ? 0 : _e;
        return [
            { transform: "translateY(0px) rotate(0deg)", offset: 0.0 },
            { transform: "translateY(" + tgtTranYVal + ") rotate(" + tgtRotVal + ")", offset: enteredOffset },
            { transform: "translateY(" + tgtTranYVal + ") rotate(" + tgtRotVal + ")", offset: exitingOffset },
            { transform: "translateY(0px) rotate(0deg)", offset: 1.0 },
        ];
    };
    EyeController.prototype.express = function (_a) {
        var _b = _a.type, type = _b === void 0 ? '' : _b, 
        // level = 3,  // 1: min, 5: max
        _c = _a.duration, 
        // level = 3,  // 1: min, 5: max
        duration = _c === void 0 ? 1000 : _c, _d = _a.enterDuration, enterDuration = _d === void 0 ? 75 : _d, _e = _a.exitDuration, exitDuration = _e === void 0 ? 75 : _e;
        if (!this._leftEye) { // assumes all elements are always set together
            console.warn('Eye elements are not set; return;');
            return;
        }
        var options = {
            duration: duration,
        };
        switch (type) {
            case 'happy':
                return {
                    lowerLeftEyelid: this._lowerLeftEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * -2 / 3)",
                        tgtRotVal: "30deg",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                    lowerRightEyelid: this._lowerRightEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * -2 / 3)",
                        tgtRotVal: "-30deg",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                };
            case 'sad':
                return {
                    upperLeftEyelid: this._upperLeftEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * 1 / 3)",
                        tgtRotVal: "-20deg",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                    upperRightEyelid: this._upperRightEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * 1 / 3)",
                        tgtRotVal: "20deg",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                };
            case 'angry':
                return {
                    upperLeftEyelid: this._upperLeftEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * 1 / 4)",
                        tgtRotVal: "30deg",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                    upperRightEyelid: this._upperRightEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * 1 / 4)",
                        tgtRotVal: "-30deg",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                };
            case 'focused':
                return {
                    upperLeftEyelid: this._upperLeftEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * 1 / 3)",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                    upperRightEyelid: this._upperRightEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * 1 / 3)",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                    lowerLeftEyelid: this._lowerLeftEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * -1 / 3)",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                    lowerRightEyelid: this._lowerRightEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * -1 / 3)",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                };
            case 'confused':
                return {
                    upperRightEyelid: this._upperRightEyelid.animate(this._createKeyframes({
                        tgtTranYVal: "calc(" + this._eyeSize + " * 1 / 3)",
                        tgtRotVal: "-10deg",
                        enteredOffset: enterDuration / duration,
                        exitingOffset: 1 - (exitDuration / duration),
                    }), options),
                };
            default:
                console.warn("Invalid input type=" + type);
        }
    };
    EyeController.prototype.blink = function (_a) {
        var _b = (_a === void 0 ? {} : _a).duration, duration = _b === void 0 ? 150 : _b;
        if (!this._leftEye) { // assumes all elements are always set together
            console.warn('Eye elements are not set; return;');
            return;
        }
        [this._leftEye, this._rightEye].map(function (eye) {
            eye.animate([
                { transform: 'rotateX(0deg)' },
                { transform: 'rotateX(90deg)' },
                { transform: 'rotateX(0deg)' },
            ], {
                duration: duration,
                iterations: 1,
            });
        });
    };
    EyeController.prototype.startBlinking = function (_a) {
        var _this = this;
        var _b = (_a === void 0 ? {} : _a).maxInterval, maxInterval = _b === void 0 ? 5000 : _b;
        if (this._blinkTimeoutID) {
            console.warn("Already blinking with timeoutID=" + this._blinkTimeoutID + "; return;");
            return;
        }
        var blinkRandomly = function (timeout) {
            _this._blinkTimeoutID = setTimeout(function () {
                _this.blink();
                blinkRandomly(Math.random() * maxInterval);
            }, timeout);
        };
        blinkRandomly(Math.random() * maxInterval);
    };
    EyeController.prototype.stopBlinking = function () {
        clearTimeout(this._blinkTimeoutID);
        this._blinkTimeoutID = null;
    };
    EyeController.prototype.setEyePosition = function (eyeElem, x, y, isRight) {
        if (isRight === void 0) { isRight = false; }
        if (!eyeElem) { // assumes all elements are always set together
            console.warn('Invalid inputs ', eyeElem, x, y, '; retuning');
            return;
        }
        if (!isNaN(x)) {
            if (!isRight) {
                eyeElem.style.left = "calc(" + this._eyeSize + " / 3 * 2 * " + x + ")";
            }
            else {
                eyeElem.style.right = "calc(" + this._eyeSize + " / 3 * 2 * " + (1 - x) + ")";
            }
        }
        if (!isNaN(y)) {
            eyeElem.style.bottom = "calc(" + this._eyeSize + " / 3 * 2 * " + (1 - y) + ")";
        }
    };
    return EyeController;
}());
var CommandType;
(function (CommandType) {
    CommandType["EXPRESS"] = "EXPRESS";
    CommandType["START_BLINKING"] = "START_BLINKING";
    CommandType["STOP_BLINKING"] = "STOP_BLINKING";
    CommandType["SET_STATE"] = "SET_STATE";
})(CommandType || (CommandType = {}));
var ExpressCommandType;
(function (ExpressCommandType) {
    ExpressCommandType["HAPPY"] = "happy";
    ExpressCommandType["SAD"] = "sad";
    ExpressCommandType["ANGRY"] = "angry";
    ExpressCommandType["FOCUSED"] = "focused";
    ExpressCommandType["CONFUSED"] = "confused";
})(ExpressCommandType = exports.ExpressCommandType || (exports.ExpressCommandType = {}));
/**
 * [TabletFace](https://github.com/mjyc/tablet-robot-face) driver factory.
 *
 * @param options possible key includes
 *
 *   * styles {object} A group of optional face style parameters:
 *     * faceColor {string} (default: 'whitesmoke')
 *     * faceHeight {string} (default: '100vh')
 *     * faceWidth {string} (default: '100vw')
 *     * eyeColor {string} (default: 'black')
 *     * eyeSize {string} (default: '33.33vmin')
 *     * eyelidColor {string} (default: 'whitesmoke')
 *
 * @return {Driver} the TabletFace Cycle.js driver function. It takes a stream
 *   of `Command` and returns `DOM`, animationFinish`, and `load` streams.
 */
function makeTabletFaceDriver(_a) {
    var _b = (_a === void 0 ? {} : _a).styles, _c = _b === void 0 ? {} : _b, _d = _c.faceColor, faceColor = _d === void 0 ? 'whitesmoke' : _d, _e = _c.faceHeight, faceHeight = _e === void 0 ? '100vh' : _e, _f = _c.faceWidth, faceWidth = _f === void 0 ? '100vw' : _f, _g = _c.eyeColor, eyeColor = _g === void 0 ? 'black' : _g, _h = _c.eyeSize, eyeSize = _h === void 0 ? '33.33vmin' : _h, _j = _c.eyelidColor, eyelidColor = _j === void 0 ? 'whitesmoke' : _j;
    var styles = {
        face: {
            backgroundColor: faceColor,
            height: faceHeight,
            width: faceWidth,
            position: 'relative',
            overflow: 'hidden',
            zIndex: 0,
        },
        eye: {
            backgroundColor: eyeColor,
            borderRadius: '100%',
            height: eyeSize,
            width: eyeSize,
            bottom: "calc(" + eyeSize + " / 3)",
            zIndex: 1,
            position: 'absolute',
        },
        left: {
            left: "calc(" + eyeSize + " / 3)",
        },
        right: {
            right: "calc(" + eyeSize + " / 3)",
        },
        eyelid: {
            backgroundColor: eyelidColor,
            height: eyeSize,
            width: "calc(" + eyeSize + " * 1.75)",
            zIndex: 2,
            position: 'absolute',
        },
        upper: {
            bottom: "calc(" + eyeSize + " * 1)",
            left: "calc(" + eyeSize + " * -0.375)",
        },
        lower: {
            borderRadius: '100%',
            bottom: "calc(" + eyeSize + " * -1)",
            left: "calc(" + eyeSize + " * -0.375)",
        },
    };
    var eyes = new EyeController();
    var id = "face-" + String(Math.random()).substr(2);
    return function (command$) {
        var load$ = xstream_1.default.create();
        var intervalID = setInterval(function () {
            if (!document.querySelector("#" + id)) {
                console.debug("Waiting for #" + id + " to appear...");
                return;
            }
            clearInterval(intervalID);
            var element = document.querySelector("#" + id);
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
        var animations = {};
        var animationFinish$$ = xstream_1.default.create();
        xstream_1.default.fromObservable(command$).addListener({
            next: function (command) {
                if (!command) {
                    Object.keys(animations).map(function (key) {
                        animations[key].cancel();
                    });
                    return;
                }
                switch (command.type) {
                    case CommandType.EXPRESS:
                        animations = eyes.express(command.value) || {};
                        animationFinish$$.shamefullySendNext(xstream_1.default.fromPromise(Promise.all(Object.keys(animations).map(function (key) {
                            return new Promise(function (resolve, reject) {
                                animations[key].onfinish = resolve;
                            });
                        }))));
                        break;
                    case CommandType.START_BLINKING:
                        eyes.startBlinking(command.value);
                        break;
                    case CommandType.STOP_BLINKING:
                        eyes.stopBlinking();
                        break;
                    case CommandType.SET_STATE:
                        var value = command.value;
                        var leftPos = value && value.leftEye || { x: null, y: null };
                        var rightPos = value && value.rightEye || { x: null, y: null };
                        eyes.setEyePosition(eyes.leftEye, leftPos.x, leftPos.y);
                        eyes.setEyePosition(eyes.rightEye, rightPos.x, rightPos.y, true);
                        break;
                }
            }
        });
        var vdom$ = xstream_1.default.of(dom_1.div("#" + id + ".face", { style: styles.face }, [
            dom_1.div('.eye.left', {
                style: Object.assign({}, styles.eye, styles.left),
            }, [
                dom_1.div('.eyelid.upper', {
                    style: Object.assign({}, styles.eyelid, styles.upper),
                }),
                dom_1.div('.eyelid.lower', {
                    style: Object.assign({}, styles.eyelid, styles.lower),
                }),
            ]),
            dom_1.div('.eye.right', {
                style: Object.assign({}, styles.eye, styles.right),
            }, [
                dom_1.div('.eyelid.upper', {
                    style: Object.assign({}, styles.eyelid, styles.upper),
                }),
                dom_1.div('.eyelid.lower', {
                    style: Object.assign({}, styles.eyelid, styles.lower),
                }),
            ]),
        ]));
        return {
            DOM: adapt_1.adapt(vdom$),
            animationFinish: adapt_1.adapt(animationFinish$$.flatten()),
            load: adapt_1.adapt(load$),
        };
    };
}
exports.makeTabletFaceDriver = makeTabletFaceDriver;

},{"@cycle/dom":108,"@cycle/run/lib/adapt":116,"xstream":145}],92:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"./types":93,"./utils":94,"dup":7}],93:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],94:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],95:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./fromEvent":106,"@cycle/run/lib/adapt":116,"dup":19,"xstream":145}],96:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"./fromEvent":106,"@cycle/run/lib/adapt":116,"dup":20,"xstream":145}],97:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"./ScopeChecker":103,"./utils":114,"dup":21}],98:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"./ElementFinder":97,"./PriorityQueue":101,"./RemovalSet":102,"./ScopeChecker":103,"./SymbolTree":104,"./fromEvent":106,"./utils":114,"dup":22,"xstream":145}],99:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"./SymbolTree":104,"./utils":114,"dup":23}],100:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"./BodyDOMSource":95,"./DocumentDOMSource":96,"./ElementFinder":97,"./isolate":109,"@cycle/run/lib/adapt":116,"dup":24}],101:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],102:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],103:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"./utils":114,"dup":27}],104:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"dup":28}],105:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"./utils":114,"dup":29,"snabbdom-selector":120,"snabbdom/h":124,"snabbdom/vnode":135}],106:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"dup":30,"xstream":145}],107:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31,"snabbdom/h":124}],108:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"./MainDOMSource":100,"./hyperscript-helpers":107,"./makeDOMDriver":110,"./mockDOMSource":111,"./thunk":113,"dup":32,"snabbdom/h":124}],109:[function(require,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"./utils":114,"dup":33}],110:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"./EventDelegator":98,"./IsolateModule":99,"./MainDOMSource":100,"./VNodeWrapper":105,"./modules":112,"./utils":114,"dup":34,"snabbdom":132,"snabbdom/tovnode":134,"xstream":145,"xstream/extra/concat":142,"xstream/extra/sampleCombine":144}],111:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"@cycle/run/lib/adapt":116,"dup":35,"xstream":145}],112:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"snabbdom/modules/attributes":127,"snabbdom/modules/class":128,"snabbdom/modules/dataset":129,"snabbdom/modules/props":130,"snabbdom/modules/style":131}],113:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"dup":37,"snabbdom/h":124}],114:[function(require,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"dup":38}],115:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"@cycle/run/lib/adapt":116,"dup":10,"xstream":145}],116:[function(require,module,exports){
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

},{}],117:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"./selectorParser":123,"dup":54}],118:[function(require,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"dup":55}],119:[function(require,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"./parent-symbol":121,"./query":122,"dup":56}],120:[function(require,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"./classNameFromVNode":117,"./curry2":118,"./findMatches":119,"./selectorParser":123,"dup":57}],121:[function(require,module,exports){
(function (global){
"use strict";
var root;
if (typeof self !== 'undefined') {
    root = self;
}
else if (typeof window !== 'undefined') {
    root = window;
}
else if (typeof global !== 'undefined') {
    root = global;
}
else {
    root = Function('return this')();
}
var Symbol = root.Symbol;
var parentSymbol;
if (typeof Symbol === 'function') {
    parentSymbol = Symbol('parent');
}
else {
    parentSymbol = '@@snabbdom-selector-parent';
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parentSymbol;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],122:[function(require,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"./classNameFromVNode":117,"./parent-symbol":121,"./selectorParser":123,"dup":59,"tree-selector":138}],123:[function(require,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"dup":60}],124:[function(require,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"./is":126,"./vnode":135,"dup":61}],125:[function(require,module,exports){
arguments[4][62][0].apply(exports,arguments)
},{"dup":62}],126:[function(require,module,exports){
arguments[4][63][0].apply(exports,arguments)
},{"dup":63}],127:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64}],128:[function(require,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"dup":65}],129:[function(require,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"dup":66}],130:[function(require,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"dup":67}],131:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"dup":68}],132:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"./h":124,"./htmldomapi":125,"./is":126,"./thunk":133,"./vnode":135,"dup":69}],133:[function(require,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"./h":124,"dup":70}],134:[function(require,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"./htmldomapi":125,"./vnode":135,"dup":71}],135:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],136:[function(require,module,exports){
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

},{"./ponyfill.js":137}],137:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13}],138:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"./matches":139,"./querySelector":140,"./selectorParser":141,"dup":76}],139:[function(require,module,exports){
arguments[4][77][0].apply(exports,arguments)
},{"./selectorParser":141,"dup":77}],140:[function(require,module,exports){
arguments[4][78][0].apply(exports,arguments)
},{"./matches":139,"./selectorParser":141,"dup":78}],141:[function(require,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"dup":79}],142:[function(require,module,exports){
arguments[4][80][0].apply(exports,arguments)
},{"../index":145,"dup":80}],143:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"../index":145,"dup":14}],144:[function(require,module,exports){
arguments[4][82][0].apply(exports,arguments)
},{"../index":145,"dup":82}],145:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"symbol-observable":136}],146:[function(require,module,exports){
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

},{"@cycle-robot-drivers/action":151,"@cycle/run/lib/adapt":154,"xstream":158}],147:[function(require,module,exports){
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

},{"@cycle-robot-drivers/action":151,"@cycle/run/lib/adapt":154,"xstream":158}],148:[function(require,module,exports){
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

},{"./SpeechRecognitionAction":146,"./SpeechSynthesisAction":147,"./makeSpeechRecognitionDriver":149,"./makeSpeechSynthesisDriver":150}],149:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":154,"xstream/extra/fromEvent":157}],150:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":154,"xstream/extra/fromEvent":157}],151:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"./types":152,"./utils":153,"dup":7}],152:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],153:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],154:[function(require,module,exports){
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

},{}],155:[function(require,module,exports){
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

},{"./ponyfill.js":156}],156:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13}],157:[function(require,module,exports){
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

},{"../index":158}],158:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"symbol-observable":155}]},{},[86])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi9hY3Rpb25iYW5rL2xpYi9janMvUUFXaXRoU2NyZWVuQWN0aW9uLmpzIiwiLi4vLi4vLi4vYWN0aW9uYmFuay9saWIvY2pzL1F1ZXN0aW9uQW5zd2VyQWN0aW9uLmpzIiwiLi4vLi4vLi4vYWN0aW9uYmFuay9saWIvY2pzL1NwZWFrV2l0aFNjcmVlbkFjdGlvbi5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbGliL2Nqcy9pbmRleC5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbGliL2Nqcy9tYWtlQ29uY3VycmVudEFjdGlvbi5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbGliL2Nqcy91dGlscy5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvbi9saWIvY2pzL2luZGV4LmpzIiwiLi4vLi4vLi4vYWN0aW9uYmFuay9ub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdHlwZXMuanMiLCIuLi8uLi8uLi9hY3Rpb25iYW5rL25vZGVfbW9kdWxlcy9AY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb24vbGliL2Nqcy91dGlscy5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbm9kZV9tb2R1bGVzL0BjeWNsZS9pc29sYXRlL2xpYi9janMvaW5kZXguanMiLCIuLi8uLi8uLi9hY3Rpb25iYW5rL25vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9hZGFwdC5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9pbmRleC5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9wb255ZmlsbC5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2Ryb3BSZXBlYXRzLnRzIiwiLi4vLi4vLi4vYWN0aW9uYmFuay9ub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvaW5kZXgudHMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0JvZHlET01Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0RvY3VtZW50RE9NU291cmNlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9FbGVtZW50RmluZGVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9FdmVudERlbGVnYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvSXNvbGF0ZU1vZHVsZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvTWFpbkRPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvUHJpb3JpdHlRdWV1ZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvUmVtb3ZhbFNldC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvU2NvcGVDaGVja2VyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9TeW1ib2xUcmVlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9WTm9kZVdyYXBwZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL2Zyb21FdmVudC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaHlwZXJzY3JpcHQtaGVscGVycy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL2lzb2xhdGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21ha2VET01Ecml2ZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21vY2tET01Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21vZHVsZXMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL3RodW5rLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvaXNvbGF0ZS9ub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW50ZXJuYWxzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL0NvbGxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvU3RhdGVTb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvcGlja0NvbWJpbmUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvcGlja01lcmdlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL3dpdGhTdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvc3RhdGUvbm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9xdWlja3Rhc2svaW5kZXguanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL2NsYXNzTmFtZUZyb21WTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvY3VycnkyLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9maW5kTWF0Y2hlcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL3BhcmVudC1zeW1ib2wuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL3F1ZXJ5LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9zZWxlY3RvclBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9oLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL2h0bWxkb21hcGkuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vaXMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvY2xhc3MuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9kYXRhc2V0LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvcHJvcHMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9zdHlsZS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9zbmFiYmRvbS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS90aHVuay5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS90b3Zub2RlLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3Zub2RlLmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3RyZWUtc2VsZWN0b3IvbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvbWF0Y2hlcy5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvcXVlcnlTZWxlY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvc2VsZWN0b3JQYXJzZXIuanMiLCJub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvZXh0cmEvY29uY2F0LnRzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL3NhbXBsZUNvbWJpbmUudHMiLCJzcmMvRmxvd2NoYXJ0QWN0aW9uLnRzIiwic3JjL1JvYm90QXBwLnRzIiwic3JjL2luZGV4LnRzIiwiLi4vLi4vLi4vc2NyZWVuL2xpYi9janMvRmFjaWFsRXhwcmVzc2lvbkFjdGlvbi5qcyIsIi4uLy4uLy4uL3NjcmVlbi9saWIvY2pzL1NwZWVjaGJ1YmJsZUFjdGlvbi5qcyIsIi4uLy4uLy4uL3NjcmVlbi9saWIvY2pzL1R3b1NwZWVjaGJ1YmJsZXNBY3Rpb24uanMiLCIuLi8uLi8uLi9zY3JlZW4vbGliL2Nqcy9pbmRleC5qcyIsIi4uLy4uLy4uL3NjcmVlbi9saWIvY2pzL21ha2VUYWJsZXRGYWNlRHJpdmVyLmpzIiwiLi4vLi4vLi4vc2NyZWVuL25vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9hZGFwdC5qcyIsIi4uLy4uLy4uL3NjcmVlbi9ub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL3BhcmVudC1zeW1ib2wuanMiLCIuLi8uLi8uLi9zY3JlZW4vbm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9pbmRleC5qcyIsIi4uLy4uLy4uL3NwZWVjaC9saWIvY2pzL1NwZWVjaFJlY29nbml0aW9uQWN0aW9uLmpzIiwiLi4vLi4vLi4vc3BlZWNoL2xpYi9janMvU3BlZWNoU3ludGhlc2lzQWN0aW9uLmpzIiwiLi4vLi4vLi4vc3BlZWNoL2xpYi9janMvaW5kZXguanMiLCIuLi8uLi8uLi9zcGVlY2gvbGliL2Nqcy9tYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXIuanMiLCIuLi8uLi8uLi9zcGVlY2gvbGliL2Nqcy9tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyLmpzIiwiLi4vLi4vLi4vc3BlZWNoL25vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9hZGFwdC5qcyIsIi4uLy4uLy4uL3NwZWVjaC9ub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIiwiLi4vLi4vLi4vc3BlZWNoL25vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9mcm9tRXZlbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3RXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7OztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMUJB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LENBQUMsQ0FBQztLQUNuRjtBQUNILENBQUM7QUFFRCxrQkFBZSxTQUFTLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGlzb2xhdGVfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiQGN5Y2xlL2lzb2xhdGVcIikpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgbWFrZUNvbmN1cnJlbnRBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL21ha2VDb25jdXJyZW50QWN0aW9uXCIpO1xudmFyIFF1ZXN0aW9uQW5zd2VyQWN0aW9uXzEgPSByZXF1aXJlKFwiLi9RdWVzdGlvbkFuc3dlckFjdGlvblwiKTtcbmZ1bmN0aW9uIFFBV2l0aFNjcmVlbkFjdGlvbihzb3VyY2VzKSB7XG4gICAgLy8gc291cmNlcy5zdGF0ZS5zdHJlYW0uYWRkTGlzdGVuZXIoe25leHQ6IHYgPT4gY29uc29sZS5sb2coJ3JlZHVjZXJTdGF0ZSQnLCB2KX0pXG4gICAgdmFyIHJlZHVjZXJTdGF0ZSQgPSBzb3VyY2VzLnN0YXRlLnN0cmVhbTtcbiAgICB2YXIgcXVlc3Rpb25BbnN3ZXJSZXN1bHQkID0gcmVkdWNlclN0YXRlJFxuICAgICAgICAuY29tcG9zZSh1dGlsc18xLnNlbGVjdEFjdGlvblJlc3VsdCgnUXVlc3Rpb25BbnN3ZXJBY3Rpb24nKSk7XG4gICAgdmFyIGdvYWwkID0gc291cmNlcy5nb2FsXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGcpIHsgcmV0dXJuIHR5cGVvZiBnICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnKSB7IHJldHVybiBhY3Rpb25fMS5pbml0R29hbChnKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoZykgeyByZXR1cm4gKHtcbiAgICAgICAgZ29hbF9pZDogZy5nb2FsX2lkLFxuICAgICAgICBnb2FsOiB7XG4gICAgICAgICAgICBRdWVzdGlvbkFuc3dlckFjdGlvbjogZy5nb2FsLFxuICAgICAgICAgICAgVHdvU3BlZWNoYnViYmxlc0FjdGlvbjoge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGcuZ29hbC5xdWVzdGlvbixcbiAgICAgICAgICAgICAgICBjaG9pY2VzOiBnLmdvYWwuYW5zd2Vyc1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9KTsgfSk7XG4gICAgdmFyIFJhY2VBY3Rpb24gPSBtYWtlQ29uY3VycmVudEFjdGlvbl8xLm1ha2VDb25jdXJyZW50QWN0aW9uKFsnVHdvU3BlZWNoYnViYmxlc0FjdGlvbicsICdRdWVzdGlvbkFuc3dlckFjdGlvbiddLCB0cnVlKTtcbiAgICB2YXIgcmFjZVNpbmtzID0gaXNvbGF0ZV8xLmRlZmF1bHQoUmFjZUFjdGlvbiwgJ1JhY2VBY3Rpb24nKSh7XG4gICAgICAgIGdvYWw6IGdvYWwkLFxuICAgICAgICBUd29TcGVlY2hidWJibGVzQWN0aW9uOiBzb3VyY2VzLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24sXG4gICAgICAgIFF1ZXN0aW9uQW5zd2VyQWN0aW9uOiB7IHJlc3VsdDogcXVlc3Rpb25BbnN3ZXJSZXN1bHQkIH0sXG4gICAgICAgIHN0YXRlOiBzb3VyY2VzLnN0YXRlLFxuICAgIH0pO1xuICAgIC8vIHJhY2VTaW5rcy5yZXN1bHQuYWRkTGlzdGVuZXIoe25leHQ6IHYgPT4gY29uc29sZS5sb2coJ3JhY2VTaW5rcy5yZXN1bHQnLCB2KX0pO1xuICAgIHZhciBxYVNpbmtzID0gaXNvbGF0ZV8xLmRlZmF1bHQoUXVlc3Rpb25BbnN3ZXJBY3Rpb25fMS5RdWVzdGlvbkFuc3dlckFjdGlvbiwgJ1F1ZXN0aW9uQW5zd2VyQWN0aW9uJykoe1xuICAgICAgICBnb2FsOiByYWNlU2lua3MuUXVlc3Rpb25BbnN3ZXJBY3Rpb24sXG4gICAgICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogc291cmNlcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gICAgICAgIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiBzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLFxuICAgICAgICBzdGF0ZTogc291cmNlcy5zdGF0ZSxcbiAgICB9KTtcbiAgICAvLyBxYVNpbmtzLnJlc3VsdC5hZGRMaXN0ZW5lcih7bmV4dDogdiA9PiBjb25zb2xlLmxvZygncWFTaW5rcy5yZXN1bHQnLCB2KX0pO1xuICAgIHZhciByZWR1Y2VyJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKHJhY2VTaW5rcy5zdGF0ZSwgcWFTaW5rcy5zdGF0ZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdWx0OiByYWNlU2lua3MucmVzdWx0LFxuICAgICAgICBUd29TcGVlY2hidWJibGVzQWN0aW9uOiByYWNlU2lua3MuVHdvU3BlZWNoYnViYmxlc0FjdGlvbixcbiAgICAgICAgU3BlZWNoU3ludGhlc2lzQWN0aW9uOiBxYVNpbmtzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbixcbiAgICAgICAgU3BlZWNoUmVjb2duaXRpb25BY3Rpb246IHFhU2lua3MuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24sXG4gICAgICAgIHN0YXRlOiByZWR1Y2VyJCxcbiAgICB9O1xufVxuZXhwb3J0cy5RQVdpdGhTY3JlZW5BY3Rpb24gPSBRQVdpdGhTY3JlZW5BY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1RQVdpdGhTY3JlZW5BY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbi8vIEZTTSB0eXBlc1xudmFyIFM7XG4oZnVuY3Rpb24gKFMpIHtcbiAgICBTW1wiUEVORFwiXSA9IFwiUEVORFwiO1xuICAgIFNbXCJBU0tcIl0gPSBcIkFTS1wiO1xuICAgIFNbXCJMSVNURU5cIl0gPSBcIkxJU1RFTlwiO1xufSkoUyA9IGV4cG9ydHMuUyB8fCAoZXhwb3J0cy5TID0ge30pKTtcbnZhciBTSUdUeXBlO1xuKGZ1bmN0aW9uIChTSUdUeXBlKSB7XG4gICAgU0lHVHlwZVtcIkdPQUxcIl0gPSBcIkdPQUxcIjtcbiAgICBTSUdUeXBlW1wiQ0FOQ0VMXCJdID0gXCJDQU5DRUxcIjtcbiAgICBTSUdUeXBlW1wiQVNLX0RPTkVcIl0gPSBcIkFTS19ET05FXCI7XG4gICAgU0lHVHlwZVtcIlZBTElEX1JFU1BPTlNFXCJdID0gXCJWQUxJRF9SRVNQT05TRVwiO1xuICAgIFNJR1R5cGVbXCJJTlZBTElEX1JFU1BPTlNFXCJdID0gXCJJTlZBTElEX1JFU1BPTlNFXCI7XG59KShTSUdUeXBlID0gZXhwb3J0cy5TSUdUeXBlIHx8IChleHBvcnRzLlNJR1R5cGUgPSB7fSkpO1xuO1xuZnVuY3Rpb24gaW5wdXQoZ29hbCQsIHNwZWVjaFN5bnRoZXNpc1Jlc3VsdCQsIHNwZWVjaFJlY29nbml0aW9uUmVzdWx0JCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5maWx0ZXIoZnVuY3Rpb24gKGcpIHsgcmV0dXJuIHR5cGVvZiBnICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnKSB7IHJldHVybiAoZyA9PT0gbnVsbClcbiAgICAgICAgPyAoeyB0eXBlOiBTSUdUeXBlLkNBTkNFTCwgdmFsdWU6IG51bGwgfSlcbiAgICAgICAgOiAoeyB0eXBlOiBTSUdUeXBlLkdPQUwsIHZhbHVlOiBhY3Rpb25fMS5pbml0R29hbChnKSB9KTsgfSksIHNwZWVjaFN5bnRoZXNpc1Jlc3VsdCRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7IHJldHVybiByZXN1bHQuc3RhdHVzLnN0YXR1cyA9PT0gJ1NVQ0NFRURFRCc7IH0pXG4gICAgICAgIC5tYXBUbyh7IHR5cGU6IFNJR1R5cGUuQVNLX0RPTkUgfSksIHNwZWVjaFJlY29nbml0aW9uUmVzdWx0JFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5zdGF0dXMuc3RhdHVzID09PSAnU1VDQ0VFREVEJztcbiAgICB9KS5tYXAoZnVuY3Rpb24gKHJlc3VsdCkgeyByZXR1cm4gKHtcbiAgICAgICAgdHlwZTogU0lHVHlwZS5WQUxJRF9SRVNQT05TRSxcbiAgICAgICAgdmFsdWU6IHJlc3VsdC5yZXN1bHQsXG4gICAgfSk7IH0pLCBzcGVlY2hSZWNvZ25pdGlvblJlc3VsdCRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiByZXN1bHQuc3RhdHVzLnN0YXR1cyAhPT0gJ1NVQ0NFRURFRCc7XG4gICAgfSkubWFwVG8oeyB0eXBlOiBTSUdUeXBlLklOVkFMSURfUkVTUE9OU0UgfSkpO1xufVxuZnVuY3Rpb24gcmVkdWNlcihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gKHByZXYpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcmV2ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogUy5QRU5ELFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogbnVsbCxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHRyYW5zaXRpb25SZWR1Y2VyJCA9IGlucHV0JC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiAocHJldikge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdpbnB1dCcsIGlucHV0LCAncHJldicsIHByZXYpO1xuICAgICAgICBpZiAocHJldi5zdGF0ZSA9PT0gUy5QRU5EICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuR09BTCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogUy5BU0ssXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0LnZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBpbnB1dC52YWx1ZS5nb2FsLnF1ZXN0aW9uLFxuICAgICAgICAgICAgICAgICAgICBhbnN3ZXJzOiBpbnB1dC52YWx1ZS5nb2FsLmFuc3dlcnMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7IFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogeyBnb2FsOiBpbnB1dC52YWx1ZS5nb2FsLnF1ZXN0aW9uIH0gfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJldi5zdGF0ZSAhPT0gUy5QRU5EICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuR09BTCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogUy5BU0ssXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0LnZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBpbnB1dC52YWx1ZS5nb2FsLnF1ZXN0aW9uLFxuICAgICAgICAgICAgICAgICAgICBhbnN3ZXJzOiBpbnB1dC52YWx1ZS5nb2FsLmFuc3dlcnMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldi52YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBTcGVlY2hTeW50aGVzaXNBY3Rpb246IHsgZ29hbDogaW5wdXQudmFsdWUuZ29hbC5xdWVzdGlvbiB9LFxuICAgICAgICAgICAgICAgICAgICBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjogeyBnb2FsOiBudWxsIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJldi5zdGF0ZSAhPT0gUy5QRU5EICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuQ0FOQ0VMKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBTLlBFTkQsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBudWxsLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBwcmV2LnZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogeyBnb2FsOiBudWxsIH0sXG4gICAgICAgICAgICAgICAgICAgIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiB7IGdvYWw6IG51bGwgfSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByZXYuc3RhdGUgPT09IFMuQVNLICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuQVNLX0RPTkUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFMuTElTVEVOLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogcHJldi52YXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgb3V0cHV0czogeyBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjogeyBnb2FsOiB7fSB9IH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByZXYuc3RhdGUgPT09IFMuTElTVEVOICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuVkFMSURfUkVTUE9OU0UpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgbWF0Y2hpbmcgbG9naWMgbXVzdCBiZSBkZWxlZ2F0ZWQgdG8gdGhlIHJlY29nbml6ZXJcbiAgICAgICAgICAgIHZhciBtYXRjaGVkID0gcHJldi52YXJpYWJsZXMuYW5zd2Vyc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKSA9PT0gaW5wdXQudmFsdWU7IH0pO1xuICAgICAgICAgICAgcmV0dXJuIChtYXRjaGVkLmxlbmd0aCA+IDAgPyB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFMuUEVORCxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHByZXYudmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVELFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbWF0Y2hlZFswXSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSA6IHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogcHJldi5zdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHByZXYudmFyaWFibGVzLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHsgU3BlZWNoUmVjb2duaXRpb25BY3Rpb246IHsgZ29hbDoge30gfSB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJldi5zdGF0ZSA9PT0gUy5MSVNURU4gJiYgaW5wdXQudHlwZSA9PT0gU0lHVHlwZS5JTlZBTElEX1JFU1BPTlNFKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBwcmV2LnN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogcHJldi52YXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgb3V0cHV0czogeyBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjogeyBnb2FsOiB7fSB9IH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIDtcbiAgICAgICAgcmV0dXJuIHByZXY7XG4gICAgfTsgfSk7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGluaXRSZWR1Y2VyJCwgdHJhbnNpdGlvblJlZHVjZXIkKTtcbn1cbmZ1bmN0aW9uIG91dHB1dChyZWR1Y2VyU3RhdGUkKSB7XG4gICAgdmFyIG91dHB1dHMkID0gcmVkdWNlclN0YXRlJFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChtKSB7IHJldHVybiAhIW0ub3V0cHV0czsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAobSkgeyByZXR1cm4gbS5vdXRwdXRzOyB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN1bHQ6IG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvKSB7IHJldHVybiAhIW8ucmVzdWx0OyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobykgeyByZXR1cm4gby5yZXN1bHQ7IH0pLFxuICAgICAgICBTcGVlY2hTeW50aGVzaXNBY3Rpb246IG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvKSB7IHJldHVybiAhIW8uU3BlZWNoU3ludGhlc2lzQWN0aW9uOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobykgeyByZXR1cm4gby5TcGVlY2hTeW50aGVzaXNBY3Rpb24uZ29hbDsgfSksXG4gICAgICAgIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiBvdXRwdXRzJFxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobykgeyByZXR1cm4gISFvLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobykgeyByZXR1cm4gby5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbi5nb2FsOyB9KSxcbiAgICB9O1xufVxuZnVuY3Rpb24gUXVlc3Rpb25BbnN3ZXJBY3Rpb24oc291cmNlcykge1xuICAgIHZhciByZWR1Y2VyU3RhdGUkID0gc291cmNlcy5zdGF0ZS5zdHJlYW07XG4gICAgdmFyIGlucHV0JCA9IGlucHV0KHNvdXJjZXMuZ29hbCwgc291cmNlcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24ucmVzdWx0LCBzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLnJlc3VsdCk7XG4gICAgdmFyIHJlZHVjZXIkID0gcmVkdWNlcihpbnB1dCQpO1xuICAgIHZhciBvdXRwdXRzID0gb3V0cHV0KHJlZHVjZXJTdGF0ZSQpO1xuICAgIHJldHVybiBfX2Fzc2lnbih7fSwgb3V0cHV0cywgeyBzdGF0ZTogcmVkdWNlciQgfSk7XG59XG5leHBvcnRzLlF1ZXN0aW9uQW5zd2VyQWN0aW9uID0gUXVlc3Rpb25BbnN3ZXJBY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1RdWVzdGlvbkFuc3dlckFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBpc29sYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIkBjeWNsZS9pc29sYXRlXCIpKTtcbnZhciBhY3Rpb25fMSA9IHJlcXVpcmUoXCJAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb25cIik7XG52YXIgbWFrZUNvbmN1cnJlbnRBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL21ha2VDb25jdXJyZW50QWN0aW9uXCIpO1xuZnVuY3Rpb24gU3BlYWtXaXRoU2NyZWVuQWN0aW9uKHNvdXJjZXMpIHtcbiAgICBzb3VyY2VzLnN0YXRlLnN0cmVhbS5hZGRMaXN0ZW5lcih7IG5leHQ6IGZ1bmN0aW9uICh2KSB7IHJldHVybiBjb25zb2xlLmxvZygncmVkdWNlclN0YXRlJCcsIHYpOyB9IH0pO1xuICAgIHZhciBnb2FsJCA9IHNvdXJjZXMuZ29hbFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChnKSB7IHJldHVybiB0eXBlb2YgZyAhPT0gJ3VuZGVmaW5lZCc7IH0pLm1hcChmdW5jdGlvbiAoZykgeyByZXR1cm4gYWN0aW9uXzEuaW5pdEdvYWwoZyk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGcpIHsgcmV0dXJuICh7XG4gICAgICAgIGdvYWxfaWQ6IGcuZ29hbF9pZCxcbiAgICAgICAgZ29hbDoge1xuICAgICAgICAgICAgVHdvU3BlZWNoYnViYmxlc0FjdGlvbjogZy5nb2FsLFxuICAgICAgICAgICAgU3BlZWNoU3ludGhlc2lzQWN0aW9uOiBnLmdvYWwsXG4gICAgICAgIH0sXG4gICAgfSk7IH0pO1xuICAgIHZhciBSYWNlQWN0aW9uID0gbWFrZUNvbmN1cnJlbnRBY3Rpb25fMS5tYWtlQ29uY3VycmVudEFjdGlvbihbJ1R3b1NwZWVjaGJ1YmJsZXNBY3Rpb24nLCAnU3BlZWNoU3ludGhlc2lzQWN0aW9uJ10sIGZhbHNlKTtcbiAgICB2YXIgcmFjZVNpbmtzID0gaXNvbGF0ZV8xLmRlZmF1bHQoUmFjZUFjdGlvbiwgJ1JhY2VBY3Rpb24nKSh7XG4gICAgICAgIGdvYWw6IGdvYWwkLFxuICAgICAgICBUd29TcGVlY2hidWJibGVzQWN0aW9uOiBzb3VyY2VzLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24sXG4gICAgICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogc291cmNlcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gICAgICAgIHN0YXRlOiBzb3VyY2VzLnN0YXRlLFxuICAgIH0pO1xuICAgIC8vIHJhY2VTaW5rcy5yZXN1bHQuYWRkTGlzdGVuZXIoe25leHQ6IHYgPT4gY29uc29sZS5sb2coJ3JhY2VTaW5rcy5yZXN1bHQnLCB2KX0pO1xuICAgIHZhciByZWR1Y2VyJCA9IHJhY2VTaW5rcy5zdGF0ZTtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN1bHQ6IHJhY2VTaW5rcy5yZXN1bHQsXG4gICAgICAgIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb246IHJhY2VTaW5rcy5Ud29TcGVlY2hidWJibGVzQWN0aW9uLFxuICAgICAgICBTcGVlY2hTeW50aGVzaXNBY3Rpb246IHJhY2VTaW5rcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gICAgICAgIHN0YXRlOiByZWR1Y2VyJCxcbiAgICB9O1xufVxuZXhwb3J0cy5TcGVha1dpdGhTY3JlZW5BY3Rpb24gPSBTcGVha1dpdGhTY3JlZW5BY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TcGVha1dpdGhTY3JlZW5BY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuZXhwb3J0cy5zZWxlY3RBY3Rpb25SZXN1bHQgPSB1dGlsc18xLnNlbGVjdEFjdGlvblJlc3VsdDtcbnZhciBtYWtlQ29uY3VycmVudEFjdGlvbl8xID0gcmVxdWlyZShcIi4vbWFrZUNvbmN1cnJlbnRBY3Rpb25cIik7XG5leHBvcnRzLm1ha2VDb25jdXJyZW50QWN0aW9uID0gbWFrZUNvbmN1cnJlbnRBY3Rpb25fMS5tYWtlQ29uY3VycmVudEFjdGlvbjtcbnZhciBTcGVha1dpdGhTY3JlZW5BY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1NwZWFrV2l0aFNjcmVlbkFjdGlvblwiKTtcbmV4cG9ydHMuU3BlYWtXaXRoU2NyZWVuQWN0aW9uID0gU3BlYWtXaXRoU2NyZWVuQWN0aW9uXzEuU3BlYWtXaXRoU2NyZWVuQWN0aW9uO1xudmFyIFF1ZXN0aW9uQW5zd2VyQWN0aW9uXzEgPSByZXF1aXJlKFwiLi9RdWVzdGlvbkFuc3dlckFjdGlvblwiKTtcbmV4cG9ydHMuUXVlc3Rpb25BbnN3ZXJBY3Rpb24gPSBRdWVzdGlvbkFuc3dlckFjdGlvbl8xLlF1ZXN0aW9uQW5zd2VyQWN0aW9uO1xudmFyIFFBV2l0aFNjcmVlbkFjdGlvbl8xID0gcmVxdWlyZShcIi4vUUFXaXRoU2NyZWVuQWN0aW9uXCIpO1xuZXhwb3J0cy5RQVdpdGhTY3JlZW5BY3Rpb24gPSBRQVdpdGhTY3JlZW5BY3Rpb25fMS5RQVdpdGhTY3JlZW5BY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbVwiKSk7XG52YXIgYWN0aW9uXzEgPSByZXF1aXJlKFwiQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uXCIpO1xuLy8gRlNNIHR5cGVzXG52YXIgUztcbihmdW5jdGlvbiAoUykge1xuICAgIFNbXCJQRU5EXCJdID0gXCJQRU5EXCI7XG4gICAgU1tcIlJVTlwiXSA9IFwiUlVOXCI7XG59KShTID0gZXhwb3J0cy5TIHx8IChleHBvcnRzLlMgPSB7fSkpO1xudmFyIFNJR1R5cGU7XG4oZnVuY3Rpb24gKFNJR1R5cGUpIHtcbiAgICBTSUdUeXBlW1wiR09BTFwiXSA9IFwiR09BTFwiO1xuICAgIFNJR1R5cGVbXCJDQU5DRUxcIl0gPSBcIkNBTkNFTFwiO1xuICAgIFNJR1R5cGVbXCJSRVNVTFRTXCJdID0gXCJSRVNVTFRTXCI7XG59KShTSUdUeXBlID0gZXhwb3J0cy5TSUdUeXBlIHx8IChleHBvcnRzLlNJR1R5cGUgPSB7fSkpO1xuZnVuY3Rpb24gbWFrZUNvbmN1cnJlbnRBY3Rpb24oYWN0aW9uTmFtZXMsIGlzUmFjZSkge1xuICAgIGlmIChhY3Rpb25OYW1lcyA9PT0gdm9pZCAwKSB7IGFjdGlvbk5hbWVzID0gW107IH1cbiAgICBpZiAoaXNSYWNlID09PSB2b2lkIDApIHsgaXNSYWNlID0gZmFsc2U7IH1cbiAgICB2YXIgaW5wdXQgPSBmdW5jdGlvbiAoZ29hbCQsIHJlc3VsdHMpIHtcbiAgICAgICAgdmFyIHJlc3VsdHMkID0geHN0cmVhbV8xLmRlZmF1bHQuY29tYmluZS5hcHBseShudWxsLCByZXN1bHRzKTtcbiAgICAgICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGdvYWwkLmZpbHRlcihmdW5jdGlvbiAoZykgeyByZXR1cm4gdHlwZW9mIGcgIT09ICd1bmRlZmluZWQnOyB9KS5tYXAoZnVuY3Rpb24gKGcpIHsgcmV0dXJuIChnID09PSBudWxsKVxuICAgICAgICAgICAgPyAoeyB0eXBlOiBTSUdUeXBlLkNBTkNFTCwgdmFsdWU6IG51bGwgfSlcbiAgICAgICAgICAgIDogKHsgdHlwZTogU0lHVHlwZS5HT0FMLCB2YWx1ZTogYWN0aW9uXzEuaW5pdEdvYWwoZykgfSk7IH0pLCByZXN1bHRzJC5tYXAoZnVuY3Rpb24gKHIpIHsgcmV0dXJuICh7IHR5cGU6IFNJR1R5cGUuUkVTVUxUUywgdmFsdWU6IHIgfSk7IH0pKTtcbiAgICB9O1xuICAgIHZhciByZWR1Y2VyID0gZnVuY3Rpb24gKGlucHV0JCkge1xuICAgICAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gKHByZXYpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcHJldiA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogUy5QRU5ELFxuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHRyYW5zaXRpb25SZWR1Y2VyJCA9IGlucHV0JC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiAocHJldikge1xuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnaW5wdXQnLCBpbnB1dCwgJ3ByZXYnLCBwcmV2KTtcbiAgICAgICAgICAgIGlmIChwcmV2LnN0YXRlID09PSBTLlBFTkQgJiYgaW5wdXQudHlwZSA9PT0gU0lHVHlwZS5HT0FMKSB7XG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dHMgPSBPYmplY3Qua2V5cyhpbnB1dC52YWx1ZS5nb2FsKS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgeCkge1xuICAgICAgICAgICAgICAgICAgICBhY2NbeF0gPSB7IGdvYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBpbnB1dC52YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0LnZhbHVlLmdvYWxbeF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFMuUlVOLFxuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0LnZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dHM6IG91dHB1dHMsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHByZXYuc3RhdGUgPT09IFMuUlVOICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuR09BTCkge1xuICAgICAgICAgICAgICAgIHZhciBvdXRwdXRzID0gT2JqZWN0LmtleXMoaW5wdXQudmFsdWUuZ29hbCkucmVkdWNlKGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICAgICAgICAgICAgICAgICAgYWNjW3hdID0geyBnb2FsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXQudmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dC52YWx1ZS5nb2FsW3hdXG4gICAgICAgICAgICAgICAgICAgICAgICB9IH07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgICAgICAgICAgfSwge30pO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiBTLlJVTixcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBpbnB1dC52YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBvdXRwdXRzOiBfX2Fzc2lnbih7fSwgb3V0cHV0cywgeyByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldi52YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSB9KSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocHJldi5zdGF0ZSA9PT0gUy5SVU4gJiYgaW5wdXQudHlwZSA9PT0gU0lHVHlwZS5SRVNVTFRTKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgICAgICAgICBpZiAoIWlzUmFjZVxuICAgICAgICAgICAgICAgICAgICAmJiByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXZlcnkoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIGFjdGlvbl8xLmlzRXF1YWwoci5zdGF0dXMuZ29hbF9pZCwgcHJldi52YXJpYWJsZXMuZ29hbF9pZCk7IH0pXG4gICAgICAgICAgICAgICAgICAgICYmIHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIC5ldmVyeShmdW5jdGlvbiAocikgeyByZXR1cm4gci5zdGF0dXMuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVEOyB9KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIHByZXYsIHsgc3RhdGU6IFMuUEVORCwgdmFyaWFibGVzOiBudWxsLCBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldi52YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBpbnB1dC52YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoISFpc1JhY2VcbiAgICAgICAgICAgICAgICAgICAgJiYgcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICAgICAgLnNvbWUoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIChhY3Rpb25fMS5pc0VxdWFsKHIuc3RhdHVzLmdvYWxfaWQsIHByZXYudmFyaWFibGVzLmdvYWxfaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiByLnN0YXR1cy5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQpOyB9KSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gcmVzdWx0cy5maWx0ZXIoZnVuY3Rpb24gKHIpIHsgcmV0dXJuIChhY3Rpb25fMS5pc0VxdWFsKHIuc3RhdHVzLmdvYWxfaWQsIHByZXYudmFyaWFibGVzLmdvYWxfaWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiByLnN0YXR1cy5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQpOyB9KVswXTsgLy8gYnJlYWsgdGhlIHRpZSBoZXJlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZTogUy5QRU5ELFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHByZXYudmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogcmVzdWx0LnJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgICAgfTsgfSk7XG4gICAgICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbml0UmVkdWNlciQsIHRyYW5zaXRpb25SZWR1Y2VyJCk7XG4gICAgfTtcbiAgICB2YXIgb3V0cHV0ID0gZnVuY3Rpb24gKHJlZHVjZXJTdGF0ZSQpIHtcbiAgICAgICAgdmFyIG91dHB1dHMkID0gcmVkdWNlclN0YXRlJFxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobSkgeyByZXR1cm4gISFtLm91dHB1dHM7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChtKSB7IHJldHVybiBtLm91dHB1dHM7IH0pO1xuICAgICAgICByZXR1cm4gYWN0aW9uTmFtZXMucmVkdWNlKGZ1bmN0aW9uIChhY2MsIHgpIHtcbiAgICAgICAgICAgIGFjY1t4XSA9IG91dHB1dHMkXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobykgeyByZXR1cm4gISFvW3hdOyB9KVxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG8pIHsgcmV0dXJuIG9beF0uZ29hbDsgfSk7XG4gICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICB9LCB7XG4gICAgICAgICAgICByZXN1bHQ6IG91dHB1dHMkXG4gICAgICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobykgeyByZXR1cm4gISFvLnJlc3VsdDsgfSlcbiAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChvKSB7IHJldHVybiBvLnJlc3VsdDsgfSlcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gZnVuY3Rpb24gQ29uY3VycmVudEFjdGlvbihzb3VyY2VzKSB7XG4gICAgICAgIHZhciByZWR1Y2VyU3RhdGUkID0gc291cmNlcy5zdGF0ZS5zdHJlYW07XG4gICAgICAgIHZhciBjcmVhdGVEdW1teVJlc3VsdCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICh7XG4gICAgICAgICAgICBzdGF0dXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBhY3Rpb25fMS5nZW5lcmF0ZUdvYWxJRCgpLFxuICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgIH0pOyB9O1xuICAgICAgICB2YXIgcmVzdWx0cyA9IGFjdGlvbk5hbWVzXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiBzb3VyY2VzW3hdLnJlc3VsdC5zdGFydFdpdGgoY3JlYXRlRHVtbXlSZXN1bHQoKSk7IH0pO1xuICAgICAgICB2YXIgaW5wdXQkID0gaW5wdXQoc291cmNlcy5nb2FsLCByZXN1bHRzKTtcbiAgICAgICAgdmFyIHJlZHVjZXIkID0gcmVkdWNlcihpbnB1dCQpO1xuICAgICAgICB2YXIgb3V0cHV0cyA9IG91dHB1dChyZWR1Y2VyU3RhdGUkKTtcbiAgICAgICAgcmV0dXJuIF9fYXNzaWduKHt9LCBvdXRwdXRzLCB7IHN0YXRlOiByZWR1Y2VyJCB9KTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlQ29uY3VycmVudEFjdGlvbiA9IG1ha2VDb25jdXJyZW50QWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFrZUNvbmN1cnJlbnRBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgZHJvcFJlcGVhdHNfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0c1wiKSk7XG52YXIgYWN0aW9uXzEgPSByZXF1aXJlKFwiQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uXCIpO1xuZXhwb3J0cy5zZWxlY3RBY3Rpb25SZXN1bHQgPSBmdW5jdGlvbiAoYWN0aW9uTmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoaW4kKSB7IHJldHVybiBpbiRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gISFzXG4gICAgICAgICYmICEhc1thY3Rpb25OYW1lXVxuICAgICAgICAmJiAhIXNbYWN0aW9uTmFtZV0ub3V0cHV0c1xuICAgICAgICAmJiAhIXNbYWN0aW9uTmFtZV0ub3V0cHV0cy5yZXN1bHQ7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHNbYWN0aW9uTmFtZV0ub3V0cHV0cy5yZXN1bHQ7IH0pXG4gICAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzXzEuZGVmYXVsdChhY3Rpb25fMS5pc0VxdWFsUmVzdWx0KSk7IH07XG59O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdHlwZXNfMSA9IHJlcXVpcmUoXCIuL3R5cGVzXCIpO1xuZXhwb3J0cy5TdGF0dXMgPSB0eXBlc18xLlN0YXR1cztcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5leHBvcnRzLmdlbmVyYXRlR29hbElEID0gdXRpbHNfMS5nZW5lcmF0ZUdvYWxJRDtcbmV4cG9ydHMuaW5pdEdvYWwgPSB1dGlsc18xLmluaXRHb2FsO1xuZXhwb3J0cy5pc0VxdWFsID0gdXRpbHNfMS5pc0VxdWFsO1xuZXhwb3J0cy5pc0VxdWFsR29hbCA9IHV0aWxzXzEuaXNFcXVhbEdvYWw7XG5leHBvcnRzLmlzRXF1YWxSZXN1bHQgPSB1dGlsc18xLmlzRXF1YWxSZXN1bHQ7XG5leHBvcnRzLnBvd2VydXAgPSB1dGlsc18xLnBvd2VydXA7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTdGF0dXM7XG4oZnVuY3Rpb24gKFN0YXR1cykge1xuICAgIFN0YXR1c1tcIkFDVElWRVwiXSA9IFwiQUNUSVZFXCI7XG4gICAgU3RhdHVzW1wiUFJFRU1QVEVEXCJdID0gXCJQUkVFTVBURURcIjtcbiAgICBTdGF0dXNbXCJTVUNDRUVERURcIl0gPSBcIlNVQ0NFRURFRFwiO1xuICAgIFN0YXR1c1tcIkFCT1JURURcIl0gPSBcIkFCT1JURURcIjtcbn0pKFN0YXR1cyA9IGV4cG9ydHMuU3RhdHVzIHx8IChleHBvcnRzLlN0YXR1cyA9IHt9KSk7XG47XG4vLyMgc291cmNlTWFwcGluZ1VSTD10eXBlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX3Jlc3QgPSAodGhpcyAmJiB0aGlzLl9fcmVzdCkgfHwgZnVuY3Rpb24gKHMsIGUpIHtcbiAgICB2YXIgdCA9IHt9O1xuICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSAmJiBlLmluZGV4T2YocCkgPCAwKVxuICAgICAgICB0W3BdID0gc1twXTtcbiAgICBpZiAocyAhPSBudWxsICYmIHR5cGVvZiBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzID09PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBwID0gT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhzKTsgaSA8IHAubGVuZ3RoOyBpKyspIGlmIChlLmluZGV4T2YocFtpXSkgPCAwKVxuICAgICAgICAgICAgdFtwW2ldXSA9IHNbcFtpXV07XG4gICAgcmV0dXJuIHQ7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2VuZXJhdGVHb2FsSUQoKSB7XG4gICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhbXA6IG5vdyxcbiAgICAgICAgaWQ6IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyKSArIFwiLVwiICsgbm93LmdldFRpbWUoKSxcbiAgICB9O1xufVxuZXhwb3J0cy5nZW5lcmF0ZUdvYWxJRCA9IGdlbmVyYXRlR29hbElEO1xuZnVuY3Rpb24gaW5pdEdvYWwoZ29hbCwgaXNHb2FsKSB7XG4gICAgaWYgKGlzR29hbCA9PT0gdm9pZCAwKSB7IGlzR29hbCA9IGZ1bmN0aW9uIChnKSB7IHJldHVybiAhIWcuZ29hbF9pZDsgfTsgfVxuICAgIHJldHVybiBpc0dvYWwoZ29hbCkgPyBnb2FsIDoge1xuICAgICAgICBnb2FsX2lkOiBnZW5lcmF0ZUdvYWxJRCgpLFxuICAgICAgICBnb2FsOiBnb2FsLFxuICAgIH07XG59XG5leHBvcnRzLmluaXRHb2FsID0gaW5pdEdvYWw7XG5mdW5jdGlvbiBpc0VxdWFsKGZpcnN0LCBzZWNvbmQpIHtcbiAgICBpZiAoIWZpcnN0IHx8ICFzZWNvbmQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gKGZpcnN0LnN0YW1wID09PSBzZWNvbmQuc3RhbXAgJiYgZmlyc3QuaWQgPT09IHNlY29uZC5pZCk7XG59XG5leHBvcnRzLmlzRXF1YWwgPSBpc0VxdWFsO1xuZnVuY3Rpb24gaXNFcXVhbEdvYWwoZmlyc3QsIHNlY29uZCkge1xuICAgIGlmICghZmlyc3QgfHwgIXNlY29uZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBpc0VxdWFsKGZpcnN0LmdvYWxfaWQsIHNlY29uZC5nb2FsX2lkKTtcbn1cbmV4cG9ydHMuaXNFcXVhbEdvYWwgPSBpc0VxdWFsR29hbDtcbmZ1bmN0aW9uIGlzRXF1YWxSZXN1bHQoZmlyc3QsIHNlY29uZCkge1xuICAgIGlmICghZmlyc3QgfHwgIXNlY29uZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoaXNFcXVhbChmaXJzdC5zdGF0dXMuZ29hbF9pZCwgc2Vjb25kLnN0YXR1cy5nb2FsX2lkKVxuICAgICAgICAmJiBmaXJzdC5zdGF0dXMuc3RhdHVzID09PSBzZWNvbmQuc3RhdHVzLnN0YXR1cyk7XG59XG5leHBvcnRzLmlzRXF1YWxSZXN1bHQgPSBpc0VxdWFsUmVzdWx0O1xuZnVuY3Rpb24gcG93ZXJ1cChtYWluLCBjb25uZWN0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzb3VyY2VzKSB7XG4gICAgICAgIHZhciBzaW5rcyA9IG1haW4oc291cmNlcyk7XG4gICAgICAgIE9iamVjdC5rZXlzKHNvdXJjZXMucHJveGllcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGNvbm5lY3Qoc291cmNlcy5wcm94aWVzW2tleV0sIHNpbmtzLnRhcmdldHNba2V5XSk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdGFyZ2V0cyA9IHNpbmtzLnRhcmdldHMsIHNpbmtzV2l0aG91dFRhcmdldHMgPSBfX3Jlc3Qoc2lua3MsIFtcInRhcmdldHNcIl0pO1xuICAgICAgICByZXR1cm4gc2lua3NXaXRob3V0VGFyZ2V0cztcbiAgICB9O1xufVxuZXhwb3J0cy5wb3dlcnVwID0gcG93ZXJ1cDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG5mdW5jdGlvbiBjaGVja0lzb2xhdGVBcmdzKGRhdGFmbG93Q29tcG9uZW50LCBzY29wZSkge1xuICAgIGlmICh0eXBlb2YgZGF0YWZsb3dDb21wb25lbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBnaXZlbiB0byBpc29sYXRlKCkgbXVzdCBiZSBhIFwiICtcbiAgICAgICAgICAgIFwiJ2RhdGFmbG93Q29tcG9uZW50JyBmdW5jdGlvblwiKTtcbiAgICB9XG4gICAgaWYgKHNjb3BlID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBnaXZlbiB0byBpc29sYXRlKCkgbXVzdCBub3QgYmUgbnVsbFwiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBub3JtYWxpemVTY29wZXMoc291cmNlcywgc2NvcGVzLCByYW5kb21TY29wZSkge1xuICAgIHZhciBwZXJDaGFubmVsID0ge307XG4gICAgT2JqZWN0LmtleXMoc291cmNlcykuZm9yRWFjaChmdW5jdGlvbiAoY2hhbm5lbCkge1xuICAgICAgICBpZiAodHlwZW9mIHNjb3BlcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSBzY29wZXM7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNhbmRpZGF0ZSA9IHNjb3Blc1tjaGFubmVsXTtcbiAgICAgICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gY2FuZGlkYXRlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB3aWxkY2FyZCA9IHNjb3Blc1snKiddO1xuICAgICAgICBpZiAodHlwZW9mIHdpbGRjYXJkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHdpbGRjYXJkO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSByYW5kb21TY29wZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcGVyQ2hhbm5lbDtcbn1cbmZ1bmN0aW9uIGlzb2xhdGVBbGxTb3VyY2VzKG91dGVyU291cmNlcywgc2NvcGVzKSB7XG4gICAgdmFyIGlubmVyU291cmNlcyA9IHt9O1xuICAgIGZvciAodmFyIGNoYW5uZWwgaW4gb3V0ZXJTb3VyY2VzKSB7XG4gICAgICAgIHZhciBvdXRlclNvdXJjZSA9IG91dGVyU291cmNlc1tjaGFubmVsXTtcbiAgICAgICAgaWYgKG91dGVyU291cmNlcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSAmJlxuICAgICAgICAgICAgb3V0ZXJTb3VyY2UgJiZcbiAgICAgICAgICAgIHNjb3Blc1tjaGFubmVsXSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgdHlwZW9mIG91dGVyU291cmNlLmlzb2xhdGVTb3VyY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGlubmVyU291cmNlc1tjaGFubmVsXSA9IG91dGVyU291cmNlLmlzb2xhdGVTb3VyY2Uob3V0ZXJTb3VyY2UsIHNjb3Blc1tjaGFubmVsXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3V0ZXJTb3VyY2VzLmhhc093blByb3BlcnR5KGNoYW5uZWwpKSB7XG4gICAgICAgICAgICBpbm5lclNvdXJjZXNbY2hhbm5lbF0gPSBvdXRlclNvdXJjZXNbY2hhbm5lbF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlubmVyU291cmNlcztcbn1cbmZ1bmN0aW9uIGlzb2xhdGVBbGxTaW5rcyhzb3VyY2VzLCBpbm5lclNpbmtzLCBzY29wZXMpIHtcbiAgICB2YXIgb3V0ZXJTaW5rcyA9IHt9O1xuICAgIGZvciAodmFyIGNoYW5uZWwgaW4gaW5uZXJTaW5rcykge1xuICAgICAgICB2YXIgc291cmNlID0gc291cmNlc1tjaGFubmVsXTtcbiAgICAgICAgdmFyIGlubmVyU2luayA9IGlubmVyU2lua3NbY2hhbm5lbF07XG4gICAgICAgIGlmIChpbm5lclNpbmtzLmhhc093blByb3BlcnR5KGNoYW5uZWwpICYmXG4gICAgICAgICAgICBzb3VyY2UgJiZcbiAgICAgICAgICAgIHNjb3Blc1tjaGFubmVsXSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZS5pc29sYXRlU2luayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgb3V0ZXJTaW5rc1tjaGFubmVsXSA9IGFkYXB0XzEuYWRhcHQoc291cmNlLmlzb2xhdGVTaW5rKHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKGlubmVyU2luayksIHNjb3Blc1tjaGFubmVsXSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlubmVyU2lua3MuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkpIHtcbiAgICAgICAgICAgIG91dGVyU2lua3NbY2hhbm5lbF0gPSBpbm5lclNpbmtzW2NoYW5uZWxdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRlclNpbmtzO1xufVxudmFyIGNvdW50ZXIgPSAwO1xuZnVuY3Rpb24gbmV3U2NvcGUoKSB7XG4gICAgcmV0dXJuIFwiY3ljbGVcIiArICsrY291bnRlcjtcbn1cbi8qKlxuICogVGFrZXMgYSBgY29tcG9uZW50YCBmdW5jdGlvbiBhbmQgYSBgc2NvcGVgLCBhbmQgcmV0dXJucyBhbiBpc29sYXRlZCB2ZXJzaW9uXG4gKiBvZiB0aGUgYGNvbXBvbmVudGAgZnVuY3Rpb24uXG4gKlxuICogV2hlbiB0aGUgaXNvbGF0ZWQgY29tcG9uZW50IGlzIGludm9rZWQsIGVhY2ggc291cmNlIHByb3ZpZGVkIHRvIGl0IGlzXG4gKiBpc29sYXRlZCB0byB0aGUgZ2l2ZW4gYHNjb3BlYCB1c2luZyBgc291cmNlLmlzb2xhdGVTb3VyY2Uoc291cmNlLCBzY29wZSlgLFxuICogaWYgcG9zc2libGUuIExpa2V3aXNlLCB0aGUgc2lua3MgcmV0dXJuZWQgZnJvbSB0aGUgaXNvbGF0ZWQgY29tcG9uZW50IGFyZVxuICogaXNvbGF0ZWQgdG8gdGhlIGdpdmVuIGBzY29wZWAgdXNpbmcgYHNvdXJjZS5pc29sYXRlU2luayhzaW5rLCBzY29wZSlgLlxuICpcbiAqIFRoZSBgc2NvcGVgIGNhbiBiZSBhIHN0cmluZyBvciBhbiBvYmplY3QuIElmIGl0IGlzIGFueXRoaW5nIGVsc2UgdGhhbiB0aG9zZVxuICogdHdvIHR5cGVzLCBpdCB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIHN0cmluZy4gSWYgYHNjb3BlYCBpcyBhbiBvYmplY3QsIGl0XG4gKiByZXByZXNlbnRzIFwic2NvcGVzIHBlciBjaGFubmVsXCIsIGFsbG93aW5nIHlvdSB0byBzcGVjaWZ5IGEgZGlmZmVyZW50IHNjb3BlXG4gKiBmb3IgZWFjaCBrZXkgb2Ygc291cmNlcy9zaW5rcy4gRm9yIGluc3RhbmNlXG4gKlxuICogYGBganNcbiAqIGNvbnN0IGNoaWxkU2lua3MgPSBpc29sYXRlKENoaWxkLCB7RE9NOiAnZm9vJywgSFRUUDogJ2Jhcid9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIFlvdSBjYW4gYWxzbyB1c2UgYSB3aWxkY2FyZCBgJyonYCB0byB1c2UgYXMgYSBkZWZhdWx0IGZvciBzb3VyY2Uvc2lua3NcbiAqIGNoYW5uZWxzIHRoYXQgZGlkIG5vdCByZWNlaXZlIGEgc3BlY2lmaWMgc2NvcGU6XG4gKlxuICogYGBganNcbiAqIC8vIFVzZXMgJ2JhcicgYXMgdGhlIGlzb2xhdGlvbiBzY29wZSBmb3IgSFRUUCBhbmQgb3RoZXIgY2hhbm5lbHNcbiAqIGNvbnN0IGNoaWxkU2lua3MgPSBpc29sYXRlKENoaWxkLCB7RE9NOiAnZm9vJywgJyonOiAnYmFyJ30pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogSWYgYSBjaGFubmVsJ3MgdmFsdWUgaXMgbnVsbCwgdGhlbiB0aGF0IGNoYW5uZWwncyBzb3VyY2VzIGFuZCBzaW5rcyB3b24ndCBiZVxuICogaXNvbGF0ZWQuIElmIHRoZSB3aWxkY2FyZCBpcyBudWxsIGFuZCBzb21lIGNoYW5uZWxzIGFyZSB1bnNwZWNpZmllZCwgdGhvc2VcbiAqIGNoYW5uZWxzIHdvbid0IGJlIGlzb2xhdGVkLiBJZiB5b3UgZG9uJ3QgaGF2ZSBhIHdpbGRjYXJkIGFuZCBzb21lIGNoYW5uZWxzXG4gKiBhcmUgdW5zcGVjaWZpZWQsIHRoZW4gYGlzb2xhdGVgIHdpbGwgZ2VuZXJhdGUgYSByYW5kb20gc2NvcGUuXG4gKlxuICogYGBganNcbiAqIC8vIERvZXMgbm90IGlzb2xhdGUgSFRUUCByZXF1ZXN0c1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nLCBIVFRQOiBudWxsfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgYHNjb3BlYCBhcmd1bWVudCBpcyBub3QgcHJvdmlkZWQgYXQgYWxsLCBhIG5ldyBzY29wZSB3aWxsIGJlXG4gKiBhdXRvbWF0aWNhbGx5IGNyZWF0ZWQuIFRoaXMgbWVhbnMgdGhhdCB3aGlsZSAqKmBpc29sYXRlKGNvbXBvbmVudCwgc2NvcGUpYCBpc1xuICogcHVyZSoqIChyZWZlcmVudGlhbGx5IHRyYW5zcGFyZW50KSwgKipgaXNvbGF0ZShjb21wb25lbnQpYCBpcyBpbXB1cmUqKiAobm90XG4gKiByZWZlcmVudGlhbGx5IHRyYW5zcGFyZW50KS4gVHdvIGNhbGxzIHRvIGBpc29sYXRlKEZvbywgYmFyKWAgd2lsbCBnZW5lcmF0ZVxuICogdGhlIHNhbWUgY29tcG9uZW50LiBCdXQsIHR3byBjYWxscyB0byBgaXNvbGF0ZShGb28pYCB3aWxsIGdlbmVyYXRlIHR3b1xuICogZGlzdGluY3QgY29tcG9uZW50cy5cbiAqXG4gKiBgYGBqc1xuICogLy8gVXNlcyBzb21lIGFyYml0cmFyeSBzdHJpbmcgYXMgdGhlIGlzb2xhdGlvbiBzY29wZSBmb3IgSFRUUCBhbmQgb3RoZXIgY2hhbm5lbHNcbiAqIGNvbnN0IGNoaWxkU2lua3MgPSBpc29sYXRlKENoaWxkLCB7RE9NOiAnZm9vJ30pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogTm90ZSB0aGF0IGJvdGggYGlzb2xhdGVTb3VyY2UoKWAgYW5kIGBpc29sYXRlU2luaygpYCBhcmUgc3RhdGljIG1lbWJlcnMgb2ZcbiAqIGBzb3VyY2VgLiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgZHJpdmVycyBwcm9kdWNlIGBzb3VyY2VgIHdoaWxlIHRoZVxuICogYXBwbGljYXRpb24gcHJvZHVjZXMgYHNpbmtgLCBhbmQgaXQncyB0aGUgZHJpdmVyJ3MgcmVzcG9uc2liaWxpdHkgdG9cbiAqIGltcGxlbWVudCBgaXNvbGF0ZVNvdXJjZSgpYCBhbmQgYGlzb2xhdGVTaW5rKClgLlxuICpcbiAqIF9Ob3RlIGZvciBUeXBlc2NyaXB0IHVzZXJzOl8gYGlzb2xhdGVgIGlzIG5vdCBjdXJyZW50bHkgdHlwZS10cmFuc3BhcmVudCBhbmRcbiAqIHdpbGwgZXhwbGljaXRseSBjb252ZXJ0IGdlbmVyaWMgdHlwZSBhcmd1bWVudHMgdG8gYGFueWAuIFRvIHByZXNlcnZlIHR5cGVzIGluXG4gKiB5b3VyIGNvbXBvbmVudHMsIHlvdSBjYW4gdXNlIGEgdHlwZSBhc3NlcnRpb246XG4gKlxuICogYGBgdHNcbiAqIC8vIGlmIENoaWxkIGlzIHR5cGVkIGBDb21wb25lbnQ8U291cmNlcywgU2lua3M+YFxuICogY29uc3QgaXNvbGF0ZWRDaGlsZCA9IGlzb2xhdGUoIENoaWxkICkgYXMgQ29tcG9uZW50PFNvdXJjZXMsIFNpbmtzPjtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBvbmVudCBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0XG4gKiBhbmQgb3V0cHV0cyBhIGNvbGxlY3Rpb24gb2YgYHNpbmtzYC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzY29wZSBhbiBvcHRpb25hbCBzdHJpbmcgdGhhdCBpcyB1c2VkIHRvIGlzb2xhdGUgZWFjaFxuICogYHNvdXJjZXNgIGFuZCBgc2lua3NgIHdoZW4gdGhlIHJldHVybmVkIHNjb3BlZCBjb21wb25lbnQgaXMgaW52b2tlZC5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aGUgc2NvcGVkIGNvbXBvbmVudCBmdW5jdGlvbiB0aGF0LCBhcyB0aGUgb3JpZ2luYWxcbiAqIGBjb21wb25lbnRgIGZ1bmN0aW9uLCB0YWtlcyBgc291cmNlc2AgYW5kIHJldHVybnMgYHNpbmtzYC5cbiAqIEBmdW5jdGlvbiBpc29sYXRlXG4gKi9cbmZ1bmN0aW9uIGlzb2xhdGUoY29tcG9uZW50LCBzY29wZSkge1xuICAgIGlmIChzY29wZSA9PT0gdm9pZCAwKSB7IHNjb3BlID0gbmV3U2NvcGUoKTsgfVxuICAgIGNoZWNrSXNvbGF0ZUFyZ3MoY29tcG9uZW50LCBzY29wZSk7XG4gICAgdmFyIHJhbmRvbVNjb3BlID0gdHlwZW9mIHNjb3BlID09PSAnb2JqZWN0JyA/IG5ld1Njb3BlKCkgOiAnJztcbiAgICB2YXIgc2NvcGVzID0gdHlwZW9mIHNjb3BlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygc2NvcGUgPT09ICdvYmplY3QnXG4gICAgICAgID8gc2NvcGVcbiAgICAgICAgOiBzY29wZS50b1N0cmluZygpO1xuICAgIHJldHVybiBmdW5jdGlvbiB3cmFwcGVkQ29tcG9uZW50KG91dGVyU291cmNlcykge1xuICAgICAgICB2YXIgcmVzdCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgcmVzdFtfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2NvcGVzUGVyQ2hhbm5lbCA9IG5vcm1hbGl6ZVNjb3BlcyhvdXRlclNvdXJjZXMsIHNjb3BlcywgcmFuZG9tU2NvcGUpO1xuICAgICAgICB2YXIgaW5uZXJTb3VyY2VzID0gaXNvbGF0ZUFsbFNvdXJjZXMob3V0ZXJTb3VyY2VzLCBzY29wZXNQZXJDaGFubmVsKTtcbiAgICAgICAgdmFyIGlubmVyU2lua3MgPSBjb21wb25lbnQuYXBwbHkodm9pZCAwLCBbaW5uZXJTb3VyY2VzXS5jb25jYXQocmVzdCkpO1xuICAgICAgICB2YXIgb3V0ZXJTaW5rcyA9IGlzb2xhdGVBbGxTaW5rcyhvdXRlclNvdXJjZXMsIGlubmVyU2lua3MsIHNjb3Blc1BlckNoYW5uZWwpO1xuICAgICAgICByZXR1cm4gb3V0ZXJTaW5rcztcbiAgICB9O1xufVxuaXNvbGF0ZS5yZXNldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIChjb3VudGVyID0gMCk7IH07XG5leHBvcnRzLmRlZmF1bHQgPSBpc29sYXRlO1xuZnVuY3Rpb24gdG9Jc29sYXRlZChzY29wZSkge1xuICAgIGlmIChzY29wZSA9PT0gdm9pZCAwKSB7IHNjb3BlID0gbmV3U2NvcGUoKTsgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoY29tcG9uZW50KSB7IHJldHVybiBpc29sYXRlKGNvbXBvbmVudCwgc2NvcGUpOyB9O1xufVxuZXhwb3J0cy50b0lzb2xhdGVkID0gdG9Jc29sYXRlZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX3BvbnlmaWxsID0gcmVxdWlyZSgnLi9wb255ZmlsbC5qcycpO1xuXG52YXIgX3BvbnlmaWxsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3BvbnlmaWxsKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgcm9vdDsgLyogZ2xvYmFsIHdpbmRvdyAqL1xuXG5cbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHNlbGY7XG59IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBnbG9iYWw7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBtb2R1bGU7XG59IGVsc2Uge1xuICByb290ID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn1cblxudmFyIHJlc3VsdCA9ICgwLCBfcG9ueWZpbGwyWydkZWZhdWx0J10pKHJvb3QpO1xuZXhwb3J0c1snZGVmYXVsdCddID0gcmVzdWx0OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG5cdHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHN5bWJvbE9ic2VydmFibGVQb255ZmlsbDtcbmZ1bmN0aW9uIHN5bWJvbE9ic2VydmFibGVQb255ZmlsbChyb290KSB7XG5cdHZhciByZXN1bHQ7XG5cdHZhciBfU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cblx0aWYgKHR5cGVvZiBfU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0aWYgKF9TeW1ib2wub2JzZXJ2YWJsZSkge1xuXHRcdFx0cmVzdWx0ID0gX1N5bWJvbC5vYnNlcnZhYmxlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXN1bHQgPSBfU3ltYm9sKCdvYnNlcnZhYmxlJyk7XG5cdFx0XHRfU3ltYm9sLm9ic2VydmFibGUgPSByZXN1bHQ7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJlc3VsdCA9ICdAQG9ic2VydmFibGUnO1xuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiaW1wb3J0IHtPcGVyYXRvciwgU3RyZWFtfSBmcm9tICcuLi9pbmRleCc7XG5jb25zdCBlbXB0eSA9IHt9O1xuXG5leHBvcnQgY2xhc3MgRHJvcFJlcGVhdHNPcGVyYXRvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZHJvcFJlcGVhdHMnO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD4gPSBudWxsIGFzIGFueTtcbiAgcHVibGljIGlzRXE6ICh4OiBULCB5OiBUKSA9PiBib29sZWFuO1xuICBwcml2YXRlIHY6IFQgPSA8YW55PiBlbXB0eTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgaW5zOiBTdHJlYW08VD4sXG4gICAgICAgICAgICAgIGZuOiAoKHg6IFQsIHk6IFQpID0+IGJvb2xlYW4pIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5pc0VxID0gZm4gPyBmbiA6ICh4LCB5KSA9PiB4ID09PSB5O1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBudWxsIGFzIGFueTtcbiAgICB0aGlzLnYgPSBlbXB0eSBhcyBhbnk7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IHYgPSB0aGlzLnY7XG4gICAgaWYgKHYgIT09IGVtcHR5ICYmIHRoaXMuaXNFcSh0LCB2KSkgcmV0dXJuO1xuICAgIHRoaXMudiA9IHQ7XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEcm9wcyBjb25zZWN1dGl2ZSBkdXBsaWNhdGUgdmFsdWVzIGluIGEgc3RyZWFtLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tMi0tMS0tMS0tMS0tMi0tMy0tNC0tMy0tM3xcbiAqICAgICBkcm9wUmVwZWF0c1xuICogLS0xLS0yLS0xLS0tLS0tLS0yLS0zLS00LS0zLS0tfFxuICogYGBgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGRyb3BSZXBlYXRzIGZyb20gJ3hzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHMnXG4gKlxuICogY29uc3Qgc3RyZWFtID0geHMub2YoMSwgMiwgMSwgMSwgMSwgMiwgMywgNCwgMywgMylcbiAqICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gMVxuICogPiAyXG4gKiA+IDFcbiAqID4gMlxuICogPiAzXG4gKiA+IDRcbiAqID4gM1xuICogPiBjb21wbGV0ZWRcbiAqIGBgYFxuICpcbiAqIEV4YW1wbGUgd2l0aCBhIGN1c3RvbSBpc0VxdWFsIGZ1bmN0aW9uOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZHJvcFJlcGVhdHMgZnJvbSAneHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0cydcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSB4cy5vZignYScsICdiJywgJ2EnLCAnQScsICdCJywgJ2InKVxuICogICAuY29tcG9zZShkcm9wUmVwZWF0cygoeCwgeSkgPT4geC50b0xvd2VyQ2FzZSgpID09PSB5LnRvTG93ZXJDYXNlKCkpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiBhXG4gKiA+IGJcbiAqID4gYVxuICogPiBCXG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXNFcXVhbCBBbiBvcHRpb25hbCBmdW5jdGlvbiBvZiB0eXBlXG4gKiBgKHg6IFQsIHk6IFQpID0+IGJvb2xlYW5gIHRoYXQgdGFrZXMgYW4gZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGFuZFxuICogY2hlY2tzIGlmIGl0IGlzIGVxdWFsIHRvIHByZXZpb3VzIGV2ZW50LCBieSByZXR1cm5pbmcgYSBib29sZWFuLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkcm9wUmVwZWF0czxUPihpc0VxdWFsOiAoKHg6IFQsIHk6IFQpID0+IGJvb2xlYW4pIHwgdW5kZWZpbmVkID0gdm9pZCAwKTogKGluczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08VD4ge1xuICByZXR1cm4gZnVuY3Rpb24gZHJvcFJlcGVhdHNPcGVyYXRvcihpbnM6IFN0cmVhbTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERyb3BSZXBlYXRzT3BlcmF0b3I8VD4oaW5zLCBpc0VxdWFsKSk7XG4gIH07XG59XG4iLCJpbXBvcnQgJCRvYnNlcnZhYmxlIGZyb20gJ3N5bWJvbC1vYnNlcnZhYmxlJztcblxuY29uc3QgTk8gPSB7fTtcbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5mdW5jdGlvbiBjcDxUPihhOiBBcnJheTxUPik6IEFycmF5PFQ+IHtcbiAgY29uc3QgbCA9IGEubGVuZ3RoO1xuICBjb25zdCBiID0gQXJyYXkobCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbDsgKytpKSBiW2ldID0gYVtpXTtcbiAgcmV0dXJuIGI7XG59XG5cbmZ1bmN0aW9uIGFuZDxUPihmMTogKHQ6IFQpID0+IGJvb2xlYW4sIGYyOiAodDogVCkgPT4gYm9vbGVhbik6ICh0OiBUKSA9PiBib29sZWFuIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuZEZuKHQ6IFQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZjEodCkgJiYgZjIodCk7XG4gIH07XG59XG5cbmludGVyZmFjZSBGQ29udGFpbmVyPFQsIFI+IHtcbiAgZih0OiBUKTogUjtcbn1cblxuZnVuY3Rpb24gX3RyeTxULCBSPihjOiBGQ29udGFpbmVyPFQsIFI+LCB0OiBULCB1OiBTdHJlYW08YW55Pik6IFIgfCB7fSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGMuZih0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHUuX2UoZSk7XG4gICAgcmV0dXJuIE5PO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIF9uOiAodjogVCkgPT4gdm9pZDtcbiAgX2U6IChlcnI6IGFueSkgPT4gdm9pZDtcbiAgX2M6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IE5PX0lMOiBJbnRlcm5hbExpc3RlbmVyPGFueT4gPSB7XG4gIF9uOiBub29wLFxuICBfZTogbm9vcCxcbiAgX2M6IG5vb3AsXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBfc3RhcnQobGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkO1xuICBfc3RvcDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPdXRTZW5kZXI8VD4ge1xuICBvdXQ6IFN0cmVhbTxUPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPcGVyYXRvcjxULCBSPiBleHRlbmRzIEludGVybmFsUHJvZHVjZXI8Uj4sIEludGVybmFsTGlzdGVuZXI8VD4sIE91dFNlbmRlcjxSPiB7XG4gIHR5cGU6IHN0cmluZztcbiAgaW5zOiBTdHJlYW08VD47XG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWdncmVnYXRvcjxULCBVPiBleHRlbmRzIEludGVybmFsUHJvZHVjZXI8VT4sIE91dFNlbmRlcjxVPiB7XG4gIHR5cGU6IHN0cmluZztcbiAgaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+O1xuICBfc3RhcnQob3V0OiBTdHJlYW08VT4pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByb2R1Y2VyPFQ+IHtcbiAgc3RhcnQ6IChsaXN0ZW5lcjogTGlzdGVuZXI8VD4pID0+IHZvaWQ7XG4gIHN0b3A6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdGVuZXI8VD4ge1xuICBuZXh0OiAoeDogVCkgPT4gdm9pZDtcbiAgZXJyb3I6IChlcnI6IGFueSkgPT4gdm9pZDtcbiAgY29tcGxldGU6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3Vic2NyaXB0aW9uIHtcbiAgdW5zdWJzY3JpYmUoKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPYnNlcnZhYmxlPFQ+IHtcbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBMaXN0ZW5lcjxUPik6IFN1YnNjcmlwdGlvbjtcbn1cblxuLy8gbXV0YXRlcyB0aGUgaW5wdXRcbmZ1bmN0aW9uIGludGVybmFsaXplUHJvZHVjZXI8VD4ocHJvZHVjZXI6IFByb2R1Y2VyPFQ+ICYgUGFydGlhbDxJbnRlcm5hbFByb2R1Y2VyPFQ+Pikge1xuICBwcm9kdWNlci5fc3RhcnQgPSBmdW5jdGlvbiBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4gJiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pikge1xuICAgIGlsLm5leHQgPSBpbC5fbjtcbiAgICBpbC5lcnJvciA9IGlsLl9lO1xuICAgIGlsLmNvbXBsZXRlID0gaWwuX2M7XG4gICAgdGhpcy5zdGFydChpbCk7XG4gIH07XG4gIHByb2R1Y2VyLl9zdG9wID0gcHJvZHVjZXIuc3RvcDtcbn1cblxuY2xhc3MgU3RyZWFtU3ViPFQ+IGltcGxlbWVudHMgU3Vic2NyaXB0aW9uIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfc3RyZWFtOiBTdHJlYW08VD4sIHByaXZhdGUgX2xpc3RlbmVyOiBJbnRlcm5hbExpc3RlbmVyPFQ+KSB7fVxuXG4gIHVuc3Vic2NyaWJlKCk6IHZvaWQge1xuICAgIHRoaXMuX3N0cmVhbS5fcmVtb3ZlKHRoaXMuX2xpc3RlbmVyKTtcbiAgfVxufVxuXG5jbGFzcyBPYnNlcnZlcjxUPiBpbXBsZW1lbnRzIExpc3RlbmVyPFQ+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pIHt9XG5cbiAgbmV4dCh2YWx1ZTogVCkge1xuICAgIHRoaXMuX2xpc3RlbmVyLl9uKHZhbHVlKTtcbiAgfVxuXG4gIGVycm9yKGVycjogYW55KSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX2UoZXJyKTtcbiAgfVxuXG4gIGNvbXBsZXRlKCkge1xuICAgIHRoaXMuX2xpc3RlbmVyLl9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRnJvbU9ic2VydmFibGU8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbU9ic2VydmFibGUnO1xuICBwdWJsaWMgaW5zOiBPYnNlcnZhYmxlPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgYWN0aXZlOiBib29sZWFuO1xuICBwcml2YXRlIF9zdWI6IFN1YnNjcmlwdGlvbiB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBvYnNlcnZhYmxlO1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5fc3ViID0gdGhpcy5pbnMuc3Vic2NyaWJlKG5ldyBPYnNlcnZlcihvdXQpKTtcbiAgICBpZiAoIXRoaXMuYWN0aXZlKSB0aGlzLl9zdWIudW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIF9zdG9wKCkge1xuICAgIGlmICh0aGlzLl9zdWIpIHRoaXMuX3N1Yi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZXJnZVNpZ25hdHVyZSB7XG4gICgpOiBTdHJlYW08YW55PjtcbiAgPFQxPihzMTogU3RyZWFtPFQxPik6IFN0cmVhbTxUMT47XG4gIDxUMSwgVDI+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+KTogU3RyZWFtPFQxIHwgVDI+O1xuICA8VDEsIFQyLCBUMz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4pOiBTdHJlYW08VDEgfCBUMiB8IFQzPjtcbiAgPFQxLCBUMiwgVDMsIFQ0PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUND47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDU+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDU+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNz47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDg+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDg+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOCB8IFQ5PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4sXG4gICAgczEwOiBTdHJlYW08VDEwPik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4IHwgVDkgfCBUMTA+O1xuICA8VD4oLi4uc3RyZWFtOiBBcnJheTxTdHJlYW08VD4+KTogU3RyZWFtPFQ+O1xufVxuXG5jbGFzcyBNZXJnZTxUPiBpbXBsZW1lbnRzIEFnZ3JlZ2F0b3I8VCwgVD4sIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdtZXJnZSc7XG4gIHB1YmxpYyBpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBhYzogbnVtYmVyOyAvLyBhYyBpcyBhY3RpdmVDb3VudFxuXG4gIGNvbnN0cnVjdG9yKGluc0FycjogQXJyYXk8U3RyZWFtPFQ+Pikge1xuICAgIHRoaXMuaW5zQXJyID0gaW5zQXJyO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuYWMgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IEwgPSBzLmxlbmd0aDtcbiAgICB0aGlzLmFjID0gTDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgc1tpXS5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IEwgPSBzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgc1tpXS5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgaWYgKC0tdGhpcy5hYyA8PSAwKSB7XG4gICAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21iaW5lU2lnbmF0dXJlIHtcbiAgKCk6IFN0cmVhbTxBcnJheTxhbnk+PjtcbiAgPFQxPihzMTogU3RyZWFtPFQxPik6IFN0cmVhbTxbVDFdPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiBTdHJlYW08W1QxLCBUMl0+O1xuICA8VDEsIFQyLCBUMz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4pOiBTdHJlYW08W1QxLCBUMiwgVDNdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDRdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDZdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDddPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDldPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4sXG4gICAgczEwOiBTdHJlYW08VDEwPik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwXT47XG4gICguLi5zdHJlYW06IEFycmF5PFN0cmVhbTxhbnk+Pik6IFN0cmVhbTxBcnJheTxhbnk+Pjtcbn1cblxuY2xhc3MgQ29tYmluZUxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPEFycmF5PFQ+PiB7XG4gIHByaXZhdGUgaTogbnVtYmVyO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08QXJyYXk8VD4+O1xuICBwcml2YXRlIHA6IENvbWJpbmU8VD47XG5cbiAgY29uc3RydWN0b3IoaTogbnVtYmVyLCBvdXQ6IFN0cmVhbTxBcnJheTxUPj4sIHA6IENvbWJpbmU8VD4pIHtcbiAgICB0aGlzLmkgPSBpO1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMucCA9IHA7XG4gICAgcC5pbHMucHVzaCh0aGlzKTtcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wLCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIGlmIChwLnVwKHQsIHRoaXMuaSkpIHtcbiAgICAgIGNvbnN0IGEgPSBwLnZhbHM7XG4gICAgICBjb25zdCBsID0gYS5sZW5ndGg7XG4gICAgICBjb25zdCBiID0gQXJyYXkobCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGw7ICsraSkgYltpXSA9IGFbaV07XG4gICAgICBvdXQuX24oYik7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIG91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMucDtcbiAgICBpZiAocC5vdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKC0tcC5OYyA9PT0gMCkgcC5vdXQuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBDb21iaW5lPFI+IGltcGxlbWVudHMgQWdncmVnYXRvcjxhbnksIEFycmF5PFI+PiB7XG4gIHB1YmxpYyB0eXBlID0gJ2NvbWJpbmUnO1xuICBwdWJsaWMgaW5zQXJyOiBBcnJheTxTdHJlYW08YW55Pj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxSPj47XG4gIHB1YmxpYyBpbHM6IEFycmF5PENvbWJpbmVMaXN0ZW5lcjxhbnk+PjtcbiAgcHVibGljIE5jOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqYypvbXBsZXRlXG4gIHB1YmxpYyBObjogbnVtYmVyOyAvLyAqTip1bWJlciBvZiBzdHJlYW1zIHN0aWxsIHRvIHNlbmQgKm4qZXh0XG4gIHB1YmxpYyB2YWxzOiBBcnJheTxSPjtcblxuICBjb25zdHJ1Y3RvcihpbnNBcnI6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHRoaXMuaW5zQXJyID0gaW5zQXJyO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PFI+PjtcbiAgICB0aGlzLmlscyA9IFtdO1xuICAgIHRoaXMuTmMgPSB0aGlzLk5uID0gMDtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgfVxuXG4gIHVwKHQ6IGFueSwgaTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdiA9IHRoaXMudmFsc1tpXTtcbiAgICBjb25zdCBObiA9ICF0aGlzLk5uID8gMCA6IHYgPT09IE5PID8gLS10aGlzLk5uIDogdGhpcy5ObjtcbiAgICB0aGlzLnZhbHNbaV0gPSB0O1xuICAgIHJldHVybiBObiA9PT0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxBcnJheTxSPj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgbiA9IHRoaXMuTmMgPSB0aGlzLk5uID0gcy5sZW5ndGg7XG4gICAgY29uc3QgdmFscyA9IHRoaXMudmFscyA9IG5ldyBBcnJheShuKTtcbiAgICBpZiAobiA9PT0gMCkge1xuICAgICAgb3V0Ll9uKFtdKTtcbiAgICAgIG91dC5fYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICB2YWxzW2ldID0gTk87XG4gICAgICAgIHNbaV0uX2FkZChuZXcgQ29tYmluZUxpc3RlbmVyKGksIG91dCwgdGhpcykpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBuID0gcy5sZW5ndGg7XG4gICAgY29uc3QgaWxzID0gdGhpcy5pbHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHNbaV0uX3JlbW92ZShpbHNbaV0pO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PFI+PjtcbiAgICB0aGlzLmlscyA9IFtdO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG59XG5cbmNsYXNzIEZyb21BcnJheTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tQXJyYXknO1xuICBwdWJsaWMgYTogQXJyYXk8VD47XG5cbiAgY29uc3RydWN0b3IoYTogQXJyYXk8VD4pIHtcbiAgICB0aGlzLmEgPSBhO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLmE7XG4gICAgZm9yIChsZXQgaSA9IDAsIG4gPSBhLmxlbmd0aDsgaSA8IG47IGkrKykgb3V0Ll9uKGFbaV0pO1xuICAgIG91dC5fYygpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gIH1cbn1cblxuY2xhc3MgRnJvbVByb21pc2U8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbVByb21pc2UnO1xuICBwdWJsaWMgb246IGJvb2xlYW47XG4gIHB1YmxpYyBwOiBQcm9taXNlTGlrZTxUPjtcblxuICBjb25zdHJ1Y3RvcihwOiBQcm9taXNlTGlrZTxUPikge1xuICAgIHRoaXMub24gPSBmYWxzZTtcbiAgICB0aGlzLnAgPSBwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHByb2QgPSB0aGlzO1xuICAgIHRoaXMub24gPSB0cnVlO1xuICAgIHRoaXMucC50aGVuKFxuICAgICAgKHY6IFQpID0+IHtcbiAgICAgICAgaWYgKHByb2Qub24pIHtcbiAgICAgICAgICBvdXQuX24odik7XG4gICAgICAgICAgb3V0Ll9jKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAoZTogYW55KSA9PiB7XG4gICAgICAgIG91dC5fZShlKTtcbiAgICAgIH0sXG4gICAgKS50aGVuKG5vb3AsIChlcnI6IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7IHRocm93IGVycjsgfSk7XG4gICAgfSk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLm9uID0gZmFsc2U7XG4gIH1cbn1cblxuY2xhc3MgUGVyaW9kaWMgaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPG51bWJlcj4ge1xuICBwdWJsaWMgdHlwZSA9ICdwZXJpb2RpYyc7XG4gIHB1YmxpYyBwZXJpb2Q6IG51bWJlcjtcbiAgcHJpdmF0ZSBpbnRlcnZhbElEOiBhbnk7XG4gIHByaXZhdGUgaTogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKHBlcmlvZDogbnVtYmVyKSB7XG4gICAgdGhpcy5wZXJpb2QgPSBwZXJpb2Q7XG4gICAgdGhpcy5pbnRlcnZhbElEID0gLTE7XG4gICAgdGhpcy5pID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8bnVtYmVyPik6IHZvaWQge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIGludGVydmFsSGFuZGxlcigpIHsgb3V0Ll9uKHNlbGYuaSsrKTsgfVxuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IHNldEludGVydmFsKGludGVydmFsSGFuZGxlciwgdGhpcy5wZXJpb2QpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaW50ZXJ2YWxJRCAhPT0gLTEpIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbElEKTtcbiAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICB0aGlzLmkgPSAwO1xuICB9XG59XG5cbmNsYXNzIERlYnVnPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkZWJ1Zyc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIHM6ICh0OiBUKSA9PiBhbnk7IC8vIHNweVxuICBwcml2YXRlIGw6IHN0cmluZzsgLy8gbGFiZWxcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPik7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogKHQ6IFQpID0+IGFueSk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5zID0gbm9vcDtcbiAgICB0aGlzLmwgPSAnJztcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHRoaXMubCA9IGFyZzsgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJykgdGhpcy5zID0gYXJnO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHMgPSB0aGlzLnMsIGwgPSB0aGlzLmw7XG4gICAgaWYgKHMgIT09IG5vb3ApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHModCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHUuX2UoZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChsKSBjb25zb2xlLmxvZyhsICsgJzonLCB0KTsgZWxzZSBjb25zb2xlLmxvZyh0KTtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBEcm9wPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkcm9wJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBtYXg6IG51bWJlcjtcbiAgcHJpdmF0ZSBkcm9wcGVkOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IobWF4OiBudW1iZXIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5tYXggPSBtYXg7XG4gICAgdGhpcy5kcm9wcGVkID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuZHJvcHBlZCA9IDA7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmRyb3BwZWQrKyA+PSB0aGlzLm1heCkgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRW5kV2hlbkxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxhbnk+IHtcbiAgcHJpdmF0ZSBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcDogRW5kV2hlbjxUPjtcblxuICBjb25zdHJ1Y3RvcihvdXQ6IFN0cmVhbTxUPiwgb3A6IEVuZFdoZW48VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wID0gb3A7XG4gIH1cblxuICBfbigpIHtcbiAgICB0aGlzLm9wLmVuZCgpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICB0aGlzLm91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcC5lbmQoKTtcbiAgfVxufVxuXG5jbGFzcyBFbmRXaGVuPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdlbmRXaGVuJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBvOiBTdHJlYW08YW55PjsgLy8gbyA9IG90aGVyXG4gIHByaXZhdGUgb2lsOiBJbnRlcm5hbExpc3RlbmVyPGFueT47IC8vIG9pbCA9IG90aGVyIEludGVybmFsTGlzdGVuZXJcblxuICBjb25zdHJ1Y3RvcihvOiBTdHJlYW08YW55PiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm8gPSBvO1xuICAgIHRoaXMub2lsID0gTk9fSUw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm8uX2FkZCh0aGlzLm9pbCA9IG5ldyBFbmRXaGVuTGlzdGVuZXIob3V0LCB0aGlzKSk7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vLl9yZW1vdmUodGhpcy5vaWwpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub2lsID0gTk9fSUw7XG4gIH1cblxuICBlbmQoKTogdm9pZCB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMuZW5kKCk7XG4gIH1cbn1cblxuY2xhc3MgRmlsdGVyPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmaWx0ZXInO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKHBhc3NlczogKHQ6IFQpID0+IGJvb2xlYW4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5mID0gcGFzc2VzO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTyB8fCAhcikgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIEZsYXR0ZW5MaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwcml2YXRlIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wOiBGbGF0dGVuPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKG91dDogU3RyZWFtPFQ+LCBvcDogRmxhdHRlbjxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3AgPSBvcDtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICB0aGlzLm91dC5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgdGhpcy5vdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3AuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcC5sZXNzKCk7XG4gIH1cbn1cblxuY2xhc3MgRmxhdHRlbjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFN0cmVhbTxUPiwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmbGF0dGVuJztcbiAgcHVibGljIGluczogU3RyZWFtPFN0cmVhbTxUPj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcGVuOiBib29sZWFuO1xuICBwdWJsaWMgaW5uZXI6IFN0cmVhbTxUPjsgLy8gQ3VycmVudCBpbm5lciBTdHJlYW1cbiAgcHJpdmF0ZSBpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPjsgLy8gQ3VycmVudCBpbm5lciBJbnRlcm5hbExpc3RlbmVyXG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08U3RyZWFtPFQ+Pikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5pbCA9IE5PX0lMO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIGlmICh0aGlzLmlubmVyICE9PSBOTykgdGhpcy5pbm5lci5fcmVtb3ZlKHRoaXMuaWwpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gIH1cblxuICBsZXNzKCk6IHZvaWQge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAoIXRoaXMub3BlbiAmJiB0aGlzLmlubmVyID09PSBOTykgdS5fYygpO1xuICB9XG5cbiAgX24oczogU3RyZWFtPFQ+KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHtpbm5lciwgaWx9ID0gdGhpcztcbiAgICBpZiAoaW5uZXIgIT09IE5PICYmIGlsICE9PSBOT19JTCkgaW5uZXIuX3JlbW92ZShpbCk7XG4gICAgKHRoaXMuaW5uZXIgPSBzKS5fYWRkKHRoaXMuaWwgPSBuZXcgRmxhdHRlbkxpc3RlbmVyKHUsIHRoaXMpKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3BlbiA9IGZhbHNlO1xuICAgIHRoaXMubGVzcygpO1xuICB9XG59XG5cbmNsYXNzIEZvbGQ8VCwgUj4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBSPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZvbGQnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxSPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBSO1xuICBwdWJsaWMgc2VlZDogUjtcbiAgcHJpdmF0ZSBhY2M6IFI7IC8vIGluaXRpYWxpemVkIGFzIHNlZWRcblxuICBjb25zdHJ1Y3RvcihmOiAoYWNjOiBSLCB0OiBUKSA9PiBSLCBzZWVkOiBSLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuZiA9ICh0OiBUKSA9PiBmKHRoaXMuYWNjLCB0KTtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZCA9IHNlZWQ7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZDtcbiAgICBvdXQuX24odGhpcy5hY2MpO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHRoaXMuYWNjID0gciBhcyBSKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgTGFzdDxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnbGFzdCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGhhczogYm9vbGVhbjtcbiAgcHJpdmF0ZSB2YWw6IFQ7XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmhhcyA9IGZhbHNlO1xuICAgIHRoaXMudmFsID0gTk8gYXMgVDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy52YWwgPSBOTyBhcyBUO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIHRoaXMuaGFzID0gdHJ1ZTtcbiAgICB0aGlzLnZhbCA9IHQ7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaGFzKSB7XG4gICAgICB1Ll9uKHRoaXMudmFsKTtcbiAgICAgIHUuX2MoKTtcbiAgICB9IGVsc2UgdS5fZShuZXcgRXJyb3IoJ2xhc3QoKSBmYWlsZWQgYmVjYXVzZSBpbnB1dCBzdHJlYW0gY29tcGxldGVkJykpO1xuICB9XG59XG5cbmNsYXNzIE1hcE9wPFQsIFI+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgUj4ge1xuICBwdWJsaWMgdHlwZSA9ICdtYXAnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxSPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBSO1xuXG4gIGNvbnN0cnVjdG9yKHByb2plY3Q6ICh0OiBUKSA9PiBSLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuZiA9IHByb2plY3Q7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbihyIGFzIFIpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBSZW1lbWJlcjxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdyZW1lbWJlcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKG91dCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMub3V0KTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxufVxuXG5jbGFzcyBSZXBsYWNlRXJyb3I8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3JlcGxhY2VFcnJvcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgZjogKGVycjogYW55KSA9PiBTdHJlYW08VD47XG5cbiAgY29uc3RydWN0b3IocmVwbGFjZXI6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+LCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuZiA9IHJlcGxhY2VyO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICh0aGlzLmlucyA9IHRoaXMuZihlcnIpKS5fYWRkKHRoaXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHUuX2UoZSk7XG4gICAgfVxuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBTdGFydFdpdGg8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnc3RhcnRXaXRoJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyB2YWw6IFQ7XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIHZhbDogVCkge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMudmFsID0gdmFsO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vdXQuX24odGhpcy52YWwpO1xuICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG59XG5cbmNsYXNzIFRha2U8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3Rha2UnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG1heDogbnVtYmVyO1xuICBwcml2YXRlIHRha2VuOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IobWF4OiBudW1iZXIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5tYXggPSBtYXg7XG4gICAgdGhpcy50YWtlbiA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLnRha2VuID0gMDtcbiAgICBpZiAodGhpcy5tYXggPD0gMCkgb3V0Ll9jKCk7IGVsc2UgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IG0gPSArK3RoaXMudGFrZW47XG4gICAgaWYgKG0gPCB0aGlzLm1heCkgdS5fbih0KTsgZWxzZSBpZiAobSA9PT0gdGhpcy5tYXgpIHtcbiAgICAgIHUuX24odCk7XG4gICAgICB1Ll9jKCk7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3RyZWFtPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHB1YmxpYyBfcHJvZDogSW50ZXJuYWxQcm9kdWNlcjxUPjtcbiAgcHJvdGVjdGVkIF9pbHM6IEFycmF5PEludGVybmFsTGlzdGVuZXI8VD4+OyAvLyAnaWxzJyA9IEludGVybmFsIGxpc3RlbmVyc1xuICBwcm90ZWN0ZWQgX3N0b3BJRDogYW55O1xuICBwcm90ZWN0ZWQgX2RsOiBJbnRlcm5hbExpc3RlbmVyPFQ+OyAvLyB0aGUgZGVidWcgbGlzdGVuZXJcbiAgcHJvdGVjdGVkIF9kOiBib29sZWFuOyAvLyBmbGFnIGluZGljYXRpbmcgdGhlIGV4aXN0ZW5jZSBvZiB0aGUgZGVidWcgbGlzdGVuZXJcbiAgcHJvdGVjdGVkIF90YXJnZXQ6IFN0cmVhbTxUPjsgLy8gaW1pdGF0aW9uIHRhcmdldCBpZiB0aGlzIFN0cmVhbSB3aWxsIGltaXRhdGVcbiAgcHJvdGVjdGVkIF9lcnI6IGFueTtcblxuICBjb25zdHJ1Y3Rvcihwcm9kdWNlcj86IEludGVybmFsUHJvZHVjZXI8VD4pIHtcbiAgICB0aGlzLl9wcm9kID0gcHJvZHVjZXIgfHwgTk8gYXMgSW50ZXJuYWxQcm9kdWNlcjxUPjtcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB0aGlzLl9kbCA9IE5PIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgdGhpcy5fZCA9IGZhbHNlO1xuICAgIHRoaXMuX3RhcmdldCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX24odCk7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fbih0KTsgZWxzZSBpZiAoTCA9PSAwKSByZXR1cm47IGVsc2Uge1xuICAgICAgY29uc3QgYiA9IGNwKGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIGJbaV0uX24odCk7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZXJyICE9PSBOTykgcmV0dXJuO1xuICAgIHRoaXMuX2VyciA9IGVycjtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICB0aGlzLl94KCk7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9lKGVycik7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fZShlcnIpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fZShlcnIpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2QgJiYgTCA9PSAwKSB0aHJvdyB0aGlzLl9lcnI7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICB0aGlzLl94KCk7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9jKCk7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fYygpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fYygpO1xuICAgIH1cbiAgfVxuXG4gIF94KCk6IHZvaWQgeyAvLyB0ZWFyIGRvd24gbG9naWMsIGFmdGVyIGVycm9yIG9yIGNvbXBsZXRlXG4gICAgaWYgKHRoaXMuX2lscy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBpZiAodGhpcy5fcHJvZCAhPT0gTk8pIHRoaXMuX3Byb2QuX3N0b3AoKTtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgfVxuXG4gIF9zdG9wTm93KCkge1xuICAgIC8vIFdBUk5JTkc6IGNvZGUgdGhhdCBjYWxscyB0aGlzIG1ldGhvZCBzaG91bGRcbiAgICAvLyBmaXJzdCBjaGVjayBpZiB0aGlzLl9wcm9kIGlzIHZhbGlkIChub3QgYE5PYClcbiAgICB0aGlzLl9wcm9kLl9zdG9wKCk7XG4gICAgdGhpcy5fZXJyID0gTk87XG4gICAgdGhpcy5fc3RvcElEID0gTk87XG4gIH1cblxuICBfYWRkKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9hZGQoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgYS5wdXNoKGlsKTtcbiAgICBpZiAoYS5sZW5ndGggPiAxKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX3N0b3BJRCAhPT0gTk8pIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zdG9wSUQpO1xuICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgICAgaWYgKHAgIT09IE5PKSBwLl9zdGFydCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBfcmVtb3ZlKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9yZW1vdmUoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgaSA9IGEuaW5kZXhPZihpbCk7XG4gICAgaWYgKGkgPiAtMSkge1xuICAgICAgYS5zcGxpY2UoaSwgMSk7XG4gICAgICBpZiAodGhpcy5fcHJvZCAhPT0gTk8gJiYgYS5sZW5ndGggPD0gMCkge1xuICAgICAgICB0aGlzLl9lcnIgPSBOTztcbiAgICAgICAgdGhpcy5fc3RvcElEID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9zdG9wTm93KCkpO1xuICAgICAgfSBlbHNlIGlmIChhLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB0aGlzLl9wcnVuZUN5Y2xlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIGFsbCBwYXRocyBzdGVtbWluZyBmcm9tIGB0aGlzYCBzdHJlYW0gZXZlbnR1YWxseSBlbmQgYXQgYHRoaXNgXG4gIC8vIHN0cmVhbSwgdGhlbiB3ZSByZW1vdmUgdGhlIHNpbmdsZSBsaXN0ZW5lciBvZiBgdGhpc2Agc3RyZWFtLCB0b1xuICAvLyBmb3JjZSBpdCB0byBlbmQgaXRzIGV4ZWN1dGlvbiBhbmQgZGlzcG9zZSByZXNvdXJjZXMuIFRoaXMgbWV0aG9kXG4gIC8vIGFzc3VtZXMgYXMgYSBwcmVjb25kaXRpb24gdGhhdCB0aGlzLl9pbHMgaGFzIGp1c3Qgb25lIGxpc3RlbmVyLlxuICBfcHJ1bmVDeWNsZXMoKSB7XG4gICAgaWYgKHRoaXMuX2hhc05vU2lua3ModGhpcywgW10pKSB0aGlzLl9yZW1vdmUodGhpcy5faWxzWzBdKTtcbiAgfVxuXG4gIC8vIENoZWNrcyB3aGV0aGVyICp0aGVyZSBpcyBubyogcGF0aCBzdGFydGluZyBmcm9tIGB4YCB0aGF0IGxlYWRzIHRvIGFuIGVuZFxuICAvLyBsaXN0ZW5lciAoc2luaykgaW4gdGhlIHN0cmVhbSBncmFwaCwgZm9sbG93aW5nIGVkZ2VzIEEtPkIgd2hlcmUgQiBpcyBhXG4gIC8vIGxpc3RlbmVyIG9mIEEuIFRoaXMgbWVhbnMgdGhlc2UgcGF0aHMgY29uc3RpdHV0ZSBhIGN5Y2xlIHNvbWVob3cuIElzIGdpdmVuXG4gIC8vIGEgdHJhY2Ugb2YgYWxsIHZpc2l0ZWQgbm9kZXMgc28gZmFyLlxuICBfaGFzTm9TaW5rcyh4OiBJbnRlcm5hbExpc3RlbmVyPGFueT4sIHRyYWNlOiBBcnJheTxhbnk+KTogYm9vbGVhbiB7XG4gICAgaWYgKHRyYWNlLmluZGV4T2YoeCkgIT09IC0xKVxuICAgICAgcmV0dXJuIHRydWU7IGVsc2VcbiAgICBpZiAoKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQgPT09IHRoaXMpXG4gICAgICByZXR1cm4gdHJ1ZTsgZWxzZVxuICAgIGlmICgoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCAmJiAoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCAhPT0gTk8pXG4gICAgICByZXR1cm4gdGhpcy5faGFzTm9TaW5rcygoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCwgdHJhY2UuY29uY2F0KHgpKTsgZWxzZVxuICAgIGlmICgoeCBhcyBTdHJlYW08YW55PikuX2lscykge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIE4gPSAoeCBhcyBTdHJlYW08YW55PikuX2lscy5sZW5ndGg7IGkgPCBOOyBpKyspXG4gICAgICAgIGlmICghdGhpcy5faGFzTm9TaW5rcygoeCBhcyBTdHJlYW08YW55PikuX2lsc1tpXSwgdHJhY2UuY29uY2F0KHgpKSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBjdG9yKCk6IHR5cGVvZiBTdHJlYW0ge1xuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtID8gTWVtb3J5U3RyZWFtIDogU3RyZWFtO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyfSBsaXN0ZW5lclxuICAgKi9cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogdm9pZCB7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9uID0gbGlzdGVuZXIubmV4dCB8fCBub29wO1xuICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fZSA9IGxpc3RlbmVyLmVycm9yIHx8IG5vb3A7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9jID0gbGlzdGVuZXIuY29tcGxldGUgfHwgbm9vcDtcbiAgICB0aGlzLl9hZGQobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIExpc3RlbmVyIGZyb20gdGhlIFN0cmVhbSwgYXNzdW1pbmcgdGhlIExpc3RlbmVyIHdhcyBhZGRlZCB0byBpdC5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcjxUPn0gbGlzdGVuZXJcbiAgICovXG4gIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pik6IHZvaWQge1xuICAgIHRoaXMuX3JlbW92ZShsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgTGlzdGVuZXIgdG8gdGhlIFN0cmVhbSByZXR1cm5pbmcgYSBTdWJzY3JpcHRpb24gdG8gcmVtb3ZlIHRoYXRcbiAgICogbGlzdGVuZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXJ9IGxpc3RlbmVyXG4gICAqIEByZXR1cm5zIHtTdWJzY3JpcHRpb259XG4gICAqL1xuICBzdWJzY3JpYmUobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogU3Vic2NyaXB0aW9uIHtcbiAgICB0aGlzLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gbmV3IFN0cmVhbVN1YjxUPih0aGlzLCBsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgaW50ZXJvcCBiZXR3ZWVuIG1vc3QuanMgYW5kIFJ4SlMgNVxuICAgKlxuICAgKiBAcmV0dXJucyB7U3RyZWFtfVxuICAgKi9cbiAgWyQkb2JzZXJ2YWJsZV0oKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGU8VD4ocHJvZHVjZXI/OiBQcm9kdWNlcjxUPik6IFN0cmVhbTxUPiB7XG4gICAgaWYgKHByb2R1Y2VyKSB7XG4gICAgICBpZiAodHlwZW9mIHByb2R1Y2VyLnN0YXJ0ICE9PSAnZnVuY3Rpb24nXG4gICAgICB8fCB0eXBlb2YgcHJvZHVjZXIuc3RvcCAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcm9kdWNlciByZXF1aXJlcyBib3RoIHN0YXJ0IGFuZCBzdG9wIGZ1bmN0aW9ucycpO1xuICAgICAgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgfVxuICAgIHJldHVybiBuZXcgU3RyZWFtKHByb2R1Y2VyIGFzIEludGVybmFsUHJvZHVjZXI8VD4gJiBQcm9kdWNlcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNZW1vcnlTdHJlYW0gZ2l2ZW4gYSBQcm9kdWNlci5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb2R1Y2VyfSBwcm9kdWNlciBBbiBvcHRpb25hbCBQcm9kdWNlciB0aGF0IGRpY3RhdGVzIGhvdyB0b1xuICAgKiBzdGFydCwgZ2VuZXJhdGUgZXZlbnRzLCBhbmQgc3RvcCB0aGUgU3RyZWFtLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlV2l0aE1lbW9yeTxUPihwcm9kdWNlcj86IFByb2R1Y2VyPFQ+KTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICBpZiAocHJvZHVjZXIpIGludGVybmFsaXplUHJvZHVjZXIocHJvZHVjZXIpOyAvLyBtdXRhdGVzIHRoZSBpbnB1dFxuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KHByb2R1Y2VyIGFzIEludGVybmFsUHJvZHVjZXI8VD4gJiBQcm9kdWNlcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGRvZXMgbm90aGluZyB3aGVuIHN0YXJ0ZWQuIEl0IG5ldmVyIGVtaXRzIGFueSBldmVudC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogICAgICAgICAgbmV2ZXJcbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG5ldmVyKCk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtfc3RhcnQ6IG5vb3AsIF9zdG9wOiBub29wfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIHRoZSBcImNvbXBsZXRlXCIgbm90aWZpY2F0aW9uIHdoZW5cbiAgICogc3RhcnRlZCwgYW5kIHRoYXQncyBpdC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZW1wdHlcbiAgICogLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGVtcHR5KCk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtcbiAgICAgIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+KSB7IGlsLl9jKCk7IH0sXG4gICAgICBfc3RvcDogbm9vcCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgYW4gXCJlcnJvclwiIG5vdGlmaWNhdGlvbiB3aXRoIHRoZVxuICAgKiB2YWx1ZSB5b3UgcGFzc2VkIGFzIHRoZSBgZXJyb3JgIGFyZ3VtZW50IHdoZW4gdGhlIHN0cmVhbSBzdGFydHMsIGFuZCB0aGF0J3NcbiAgICogaXQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIHRocm93KFgpXG4gICAqIC1YXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSBlcnJvciBUaGUgZXJyb3IgZXZlbnQgdG8gZW1pdCBvbiB0aGUgY3JlYXRlZCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyB0aHJvdyhlcnJvcjogYW55KTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe1xuICAgICAgX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHsgaWwuX2UoZXJyb3IpOyB9LFxuICAgICAgX3N0b3A6IG5vb3AsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHN0cmVhbSBmcm9tIGFuIEFycmF5LCBQcm9taXNlLCBvciBhbiBPYnNlcnZhYmxlLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7QXJyYXl8UHJvbWlzZUxpa2V8T2JzZXJ2YWJsZX0gaW5wdXQgVGhlIGlucHV0IHRvIG1ha2UgYSBzdHJlYW0gZnJvbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb208VD4oaW5wdXQ6IFByb21pc2VMaWtlPFQ+IHwgU3RyZWFtPFQ+IHwgQXJyYXk8VD4gfCBPYnNlcnZhYmxlPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAodHlwZW9mIGlucHV0WyQkb2JzZXJ2YWJsZV0gPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21PYnNlcnZhYmxlPFQ+KGlucHV0IGFzIE9ic2VydmFibGU8VD4pOyBlbHNlXG4gICAgaWYgKHR5cGVvZiAoaW5wdXQgYXMgUHJvbWlzZUxpa2U8VD4pLnRoZW4gPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21Qcm9taXNlPFQ+KGlucHV0IGFzIFByb21pc2VMaWtlPFQ+KTsgZWxzZVxuICAgIGlmIChBcnJheS5pc0FycmF5KGlucHV0KSlcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbUFycmF5PFQ+KGlucHV0KTtcblxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFR5cGUgb2YgaW5wdXQgdG8gZnJvbSgpIG11c3QgYmUgYW4gQXJyYXksIFByb21pc2UsIG9yIE9ic2VydmFibGVgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgdGhlIGFyZ3VtZW50cyB0aGF0IHlvdSBnaXZlIHRvXG4gICAqICpvZiosIHRoZW4gY29tcGxldGVzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBvZigxLDIsMylcbiAgICogMTIzfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0gYSBUaGUgZmlyc3QgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLlxuICAgKiBAcGFyYW0gYiBUaGUgc2Vjb25kIHZhbHVlIHlvdSB3YW50IHRvIGVtaXQgYXMgYW4gZXZlbnQgb24gdGhlIHN0cmVhbS4gT25lXG4gICAqIG9yIG1vcmUgb2YgdGhlc2UgdmFsdWVzIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBvZjxUPiguLi5pdGVtczogQXJyYXk8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBTdHJlYW0uZnJvbUFycmF5PFQ+KGl0ZW1zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhbiBhcnJheSB0byBhIHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSB3aWxsIGVtaXQgc3luY2hyb25vdXNseVxuICAgKiBhbGwgdGhlIGl0ZW1zIGluIHRoZSBhcnJheSwgYW5kIHRoZW4gY29tcGxldGUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGZyb21BcnJheShbMSwyLDNdKVxuICAgKiAxMjN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tQXJyYXk8VD4oYXJyYXk6IEFycmF5PFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbUFycmF5PFQ+KGFycmF5KSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSBwcm9taXNlIHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCB0aGUgcmVzb2x2ZWRcbiAgICogdmFsdWUgb2YgdGhlIHByb21pc2UsIGFuZCB0aGVuIGNvbXBsZXRlLiBIb3dldmVyLCBpZiB0aGUgcHJvbWlzZSBpc1xuICAgKiByZWplY3RlZCwgdGhlIHN0cmVhbSB3aWxsIGVtaXQgdGhlIGNvcnJlc3BvbmRpbmcgZXJyb3IuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGZyb21Qcm9taXNlKCAtLS0tNDIgKVxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLTQyfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb21pc2VMaWtlfSBwcm9taXNlIFRoZSBwcm9taXNlIHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21Qcm9taXNlPFQ+KHByb21pc2U6IFByb21pc2VMaWtlPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbVByb21pc2U8VD4ocHJvbWlzZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIE9ic2VydmFibGUgaW50byBhIFN0cmVhbS5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge2FueX0gb2JzZXJ2YWJsZSBUaGUgb2JzZXJ2YWJsZSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tT2JzZXJ2YWJsZTxUPihvYnM6IHtzdWJzY3JpYmU6IGFueX0pOiBTdHJlYW08VD4ge1xuICAgIGlmICgob2JzIGFzIFN0cmVhbTxUPikuZW5kV2hlbikgcmV0dXJuIG9icyBhcyBTdHJlYW08VD47XG4gICAgY29uc3QgbyA9IHR5cGVvZiBvYnNbJCRvYnNlcnZhYmxlXSA9PT0gJ2Z1bmN0aW9uJyA/IG9ic1skJG9ic2VydmFibGVdKCkgOiBvYnM7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZyb21PYnNlcnZhYmxlKG8pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RyZWFtIHRoYXQgcGVyaW9kaWNhbGx5IGVtaXRzIGluY3JlbWVudGFsIG51bWJlcnMsIGV2ZXJ5XG4gICAqIGBwZXJpb2RgIG1pbGxpc2Vjb25kcy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogICAgIHBlcmlvZGljKDEwMDApXG4gICAqIC0tLTAtLS0xLS0tMi0tLTMtLS00LS0tLi4uXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJpb2QgVGhlIGludGVydmFsIGluIG1pbGxpc2Vjb25kcyB0byB1c2UgYXMgYSByYXRlIG9mXG4gICAqIGVtaXNzaW9uLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgcGVyaW9kaWMocGVyaW9kOiBudW1iZXIpOiBTdHJlYW08bnVtYmVyPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08bnVtYmVyPihuZXcgUGVyaW9kaWMocGVyaW9kKSk7XG4gIH1cblxuICAvKipcbiAgICogQmxlbmRzIG11bHRpcGxlIHN0cmVhbXMgdG9nZXRoZXIsIGVtaXR0aW5nIGV2ZW50cyBmcm9tIGFsbCBvZiB0aGVtXG4gICAqIGNvbmN1cnJlbnRseS5cbiAgICpcbiAgICogKm1lcmdlKiB0YWtlcyBtdWx0aXBsZSBzdHJlYW1zIGFzIGFyZ3VtZW50cywgYW5kIGNyZWF0ZXMgYSBzdHJlYW0gdGhhdFxuICAgKiBiZWhhdmVzIGxpa2UgZWFjaCBvZiB0aGUgYXJndW1lbnQgc3RyZWFtcywgaW4gcGFyYWxsZWwuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gICAqIC0tLS1hLS0tLS1iLS0tLWMtLS1kLS0tLS0tXG4gICAqICAgICAgICAgICAgbWVyZ2VcbiAgICogLS0xLWEtLTItLWItLTMtYy0tLWQtLTQtLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gbWVyZ2UgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMiBBIHN0cmVhbSB0byBtZXJnZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuIFR3b1xuICAgKiBvciBtb3JlIHN0cmVhbXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG1lcmdlOiBNZXJnZVNpZ25hdHVyZSA9IGZ1bmN0aW9uIG1lcmdlKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4obmV3IE1lcmdlKHN0cmVhbXMpKTtcbiAgfSBhcyBNZXJnZVNpZ25hdHVyZTtcblxuICAvKipcbiAgICogQ29tYmluZXMgbXVsdGlwbGUgaW5wdXQgc3RyZWFtcyB0b2dldGhlciB0byByZXR1cm4gYSBzdHJlYW0gd2hvc2UgZXZlbnRzXG4gICAqIGFyZSBhcnJheXMgdGhhdCBjb2xsZWN0IHRoZSBsYXRlc3QgZXZlbnRzIGZyb20gZWFjaCBpbnB1dCBzdHJlYW0uXG4gICAqXG4gICAqICpjb21iaW5lKiBpbnRlcm5hbGx5IHJlbWVtYmVycyB0aGUgbW9zdCByZWNlbnQgZXZlbnQgZnJvbSBlYWNoIG9mIHRoZSBpbnB1dFxuICAgKiBzdHJlYW1zLiBXaGVuIGFueSBvZiB0aGUgaW5wdXQgc3RyZWFtcyBlbWl0cyBhbiBldmVudCwgdGhhdCBldmVudCB0b2dldGhlclxuICAgKiB3aXRoIGFsbCB0aGUgb3RoZXIgc2F2ZWQgZXZlbnRzIGFyZSBjb21iaW5lZCBpbnRvIGFuIGFycmF5LiBUaGF0IGFycmF5IHdpbGxcbiAgICogYmUgZW1pdHRlZCBvbiB0aGUgb3V0cHV0IHN0cmVhbS4gSXQncyBlc3NlbnRpYWxseSBhIHdheSBvZiBqb2luaW5nIHRvZ2V0aGVyXG4gICAqIHRoZSBldmVudHMgZnJvbSBtdWx0aXBsZSBzdHJlYW1zLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tLS0tNC0tLVxuICAgKiAtLS0tYS0tLS0tYi0tLS0tYy0tZC0tLS0tLVxuICAgKiAgICAgICAgICBjb21iaW5lXG4gICAqIC0tLS0xYS0yYS0yYi0zYi0zYy0zZC00ZC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMiBBIHN0cmVhbSB0byBjb21iaW5lIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAgICogTXVsdGlwbGUgc3RyZWFtcywgbm90IGp1c3QgdHdvLCBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY29tYmluZTogQ29tYmluZVNpZ25hdHVyZSA9IGZ1bmN0aW9uIGNvbWJpbmUoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08QXJyYXk8YW55Pj4obmV3IENvbWJpbmU8YW55PihzdHJlYW1zKSk7XG4gIH0gYXMgQ29tYmluZVNpZ25hdHVyZTtcblxuICBwcm90ZWN0ZWQgX21hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IFN0cmVhbTxVPiB8IE1lbW9yeVN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFU+KG5ldyBNYXBPcDxULCBVPihwcm9qZWN0LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyBlYWNoIGV2ZW50IGZyb20gdGhlIGlucHV0IFN0cmVhbSB0aHJvdWdoIGEgYHByb2plY3RgIGZ1bmN0aW9uLFxuICAgKiB0byBnZXQgYSBTdHJlYW0gdGhhdCBlbWl0cyB0aG9zZSB0cmFuc2Zvcm1lZCBldmVudHMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTMtLTUtLS0tLTctLS0tLS1cbiAgICogICAgbWFwKGkgPT4gaSAqIDEwKVxuICAgKiAtLTEwLS0zMC01MC0tLS03MC0tLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcm9qZWN0IEEgZnVuY3Rpb24gb2YgdHlwZSBgKHQ6IFQpID0+IFVgIHRoYXQgdGFrZXMgZXZlbnRcbiAgICogYHRgIG9mIHR5cGUgYFRgIGZyb20gdGhlIGlucHV0IFN0cmVhbSBhbmQgcHJvZHVjZXMgYW4gZXZlbnQgb2YgdHlwZSBgVWAsIHRvXG4gICAqIGJlIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIG1hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IFN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIHRoaXMuX21hcChwcm9qZWN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdCdzIGxpa2UgYG1hcGAsIGJ1dCB0cmFuc2Zvcm1zIGVhY2ggaW5wdXQgZXZlbnQgdG8gYWx3YXlzIHRoZSBzYW1lXG4gICAqIGNvbnN0YW50IHZhbHVlIG9uIHRoZSBvdXRwdXQgU3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0zLS01LS0tLS03LS0tLS1cbiAgICogICAgICAgbWFwVG8oMTApXG4gICAqIC0tMTAtLTEwLTEwLS0tLTEwLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHByb2plY3RlZFZhbHVlIEEgdmFsdWUgdG8gZW1pdCBvbiB0aGUgb3V0cHV0IFN0cmVhbSB3aGVuZXZlciB0aGVcbiAgICogaW5wdXQgU3RyZWFtIGVtaXRzIGFueSB2YWx1ZS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbWFwVG88VT4ocHJvamVjdGVkVmFsdWU6IFUpOiBTdHJlYW08VT4ge1xuICAgIGNvbnN0IHMgPSB0aGlzLm1hcCgoKSA9PiBwcm9qZWN0ZWRWYWx1ZSk7XG4gICAgY29uc3Qgb3A6IE9wZXJhdG9yPFQsIFU+ID0gcy5fcHJvZCBhcyBPcGVyYXRvcjxULCBVPjtcbiAgICBvcC50eXBlID0gJ21hcFRvJztcbiAgICByZXR1cm4gcztcbiAgfVxuXG4gIGZpbHRlcjxTIGV4dGVuZHMgVD4ocGFzc2VzOiAodDogVCkgPT4gdCBpcyBTKTogU3RyZWFtPFM+O1xuICBmaWx0ZXIocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbik6IFN0cmVhbTxUPjtcbiAgLyoqXG4gICAqIE9ubHkgYWxsb3dzIGV2ZW50cyB0aGF0IHBhc3MgdGhlIHRlc3QgZ2l2ZW4gYnkgdGhlIGBwYXNzZXNgIGFyZ3VtZW50LlxuICAgKlxuICAgKiBFYWNoIGV2ZW50IGZyb20gdGhlIGlucHV0IHN0cmVhbSBpcyBnaXZlbiB0byB0aGUgYHBhc3Nlc2AgZnVuY3Rpb24uIElmIHRoZVxuICAgKiBmdW5jdGlvbiByZXR1cm5zIGB0cnVlYCwgdGhlIGV2ZW50IGlzIGZvcndhcmRlZCB0byB0aGUgb3V0cHV0IHN0cmVhbSxcbiAgICogb3RoZXJ3aXNlIGl0IGlzIGlnbm9yZWQgYW5kIG5vdCBmb3J3YXJkZWQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTItLTMtLS0tLTQtLS0tLTUtLS02LS03LTgtLVxuICAgKiAgICAgZmlsdGVyKGkgPT4gaSAlIDIgPT09IDApXG4gICAqIC0tLS0tLTItLS0tLS0tLTQtLS0tLS0tLS02LS0tLTgtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcGFzc2VzIEEgZnVuY3Rpb24gb2YgdHlwZSBgKHQ6IFQpID0+IGJvb2xlYW5gIHRoYXQgdGFrZXNcbiAgICogYW4gZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGFuZCBjaGVja3MgaWYgaXQgcGFzc2VzLCBieSByZXR1cm5pbmcgYVxuICAgKiBib29sZWFuLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBmaWx0ZXIocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbik6IFN0cmVhbTxUPiB7XG4gICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgaWYgKHAgaW5zdGFuY2VvZiBGaWx0ZXIpXG4gICAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRmlsdGVyPFQ+KFxuICAgICAgICBhbmQoKHAgYXMgRmlsdGVyPFQ+KS5mLCBwYXNzZXMpLFxuICAgICAgICAocCBhcyBGaWx0ZXI8VD4pLmluc1xuICAgICAgKSk7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZpbHRlcjxUPihwYXNzZXMsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMZXRzIHRoZSBmaXJzdCBgYW1vdW50YCBtYW55IGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gcGFzcyB0byB0aGVcbiAgICogb3V0cHV0IHN0cmVhbSwgdGhlbiBtYWtlcyB0aGUgb3V0cHV0IHN0cmVhbSBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tLS1kLS0tZS0tXG4gICAqICAgIHRha2UoMylcbiAgICogLS1hLS0tYi0tY3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgSG93IG1hbnkgZXZlbnRzIHRvIGFsbG93IGZyb20gdGhlIGlucHV0IHN0cmVhbVxuICAgKiBiZWZvcmUgY29tcGxldGluZyB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgdGFrZShhbW91bnQ6IG51bWJlcik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBUYWtlPFQ+KGFtb3VudCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIElnbm9yZXMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW5cbiAgICogYWZ0ZXIgdGhhdCBzdGFydHMgZm9yd2FyZGluZyBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHRvIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICogICAgICAgZHJvcCgzKVxuICAgKiAtLS0tLS0tLS0tLS0tLWQtLS1lLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgSG93IG1hbnkgZXZlbnRzIHRvIGlnbm9yZSBmcm9tIHRoZSBpbnB1dCBzdHJlYW1cbiAgICogYmVmb3JlIGZvcndhcmRpbmcgYWxsIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGRyb3AoYW1vdW50OiBudW1iZXIpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBEcm9wPFQ+KGFtb3VudCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZW4gdGhlIGlucHV0IHN0cmVhbSBjb21wbGV0ZXMsIHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgZW1pdCB0aGUgbGFzdCBldmVudFxuICAgKiBlbWl0dGVkIGJ5IHRoZSBpbnB1dCBzdHJlYW0sIGFuZCB0aGVuIHdpbGwgYWxzbyBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tZC0tLS18XG4gICAqICAgICAgIGxhc3QoKVxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLWR8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBsYXN0KCk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IExhc3Q8VD4odGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZXBlbmRzIHRoZSBnaXZlbiBgaW5pdGlhbGAgdmFsdWUgdG8gdGhlIHNlcXVlbmNlIG9mIGV2ZW50cyBlbWl0dGVkIGJ5IHRoZVxuICAgKiBpbnB1dCBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gaXMgYSBNZW1vcnlTdHJlYW0sIHdoaWNoIG1lYW5zIGl0IGlzXG4gICAqIGFscmVhZHkgYHJlbWVtYmVyKClgJ2QuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLTEtLS0yLS0tLS0zLS0tXG4gICAqICAgc3RhcnRXaXRoKDApXG4gICAqIDAtLTEtLS0yLS0tLS0zLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gaW5pdGlhbCBUaGUgdmFsdWUgb3IgZXZlbnQgdG8gcHJlcGVuZC5cbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgc3RhcnRXaXRoKGluaXRpYWw6IFQpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KG5ldyBTdGFydFdpdGg8VD4odGhpcywgaW5pdGlhbCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZXMgYW5vdGhlciBzdHJlYW0gdG8gZGV0ZXJtaW5lIHdoZW4gdG8gY29tcGxldGUgdGhlIGN1cnJlbnQgc3RyZWFtLlxuICAgKlxuICAgKiBXaGVuIHRoZSBnaXZlbiBgb3RoZXJgIHN0cmVhbSBlbWl0cyBhbiBldmVudCBvciBjb21wbGV0ZXMsIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtIHdpbGwgY29tcGxldGUuIEJlZm9yZSB0aGF0IGhhcHBlbnMsIHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgYmVoYXZlc1xuICAgKiBsaWtlIHRoZSBpbnB1dCBzdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLTEtLS0yLS0tLS0zLS00LS0tLTUtLS0tNi0tLVxuICAgKiAgIGVuZFdoZW4oIC0tLS0tLS0tYS0tYi0tfCApXG4gICAqIC0tLTEtLS0yLS0tLS0zLS00LS18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gb3RoZXIgU29tZSBvdGhlciBzdHJlYW0gdGhhdCBpcyB1c2VkIHRvIGtub3cgd2hlbiBzaG91bGQgdGhlIG91dHB1dFxuICAgKiBzdHJlYW0gb2YgdGhpcyBvcGVyYXRvciBjb21wbGV0ZS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZW5kV2hlbihvdGhlcjogU3RyZWFtPGFueT4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgRW5kV2hlbjxUPihvdGhlciwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFwiRm9sZHNcIiB0aGUgc3RyZWFtIG9udG8gaXRzZWxmLlxuICAgKlxuICAgKiBDb21iaW5lcyBldmVudHMgZnJvbSB0aGUgcGFzdCB0aHJvdWdob3V0XG4gICAqIHRoZSBlbnRpcmUgZXhlY3V0aW9uIG9mIHRoZSBpbnB1dCBzdHJlYW0sIGFsbG93aW5nIHlvdSB0byBhY2N1bXVsYXRlIHRoZW1cbiAgICogdG9nZXRoZXIuIEl0J3MgZXNzZW50aWFsbHkgbGlrZSBgQXJyYXkucHJvdG90eXBlLnJlZHVjZWAuIFRoZSByZXR1cm5lZFxuICAgKiBzdHJlYW0gaXMgYSBNZW1vcnlTdHJlYW0sIHdoaWNoIG1lYW5zIGl0IGlzIGFscmVhZHkgYHJlbWVtYmVyKClgJ2QuXG4gICAqXG4gICAqIFRoZSBvdXRwdXQgc3RyZWFtIHN0YXJ0cyBieSBlbWl0dGluZyB0aGUgYHNlZWRgIHdoaWNoIHlvdSBnaXZlIGFzIGFyZ3VtZW50LlxuICAgKiBUaGVuLCB3aGVuIGFuIGV2ZW50IGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgaXQgaXMgY29tYmluZWQgd2l0aCB0aGF0XG4gICAqIHNlZWQgdmFsdWUgdGhyb3VnaCB0aGUgYGFjY3VtdWxhdGVgIGZ1bmN0aW9uLCBhbmQgdGhlIG91dHB1dCB2YWx1ZSBpc1xuICAgKiBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBgZm9sZGAgcmVtZW1iZXJzIHRoYXQgb3V0cHV0IHZhbHVlIGFzIGBhY2NgXG4gICAqIChcImFjY3VtdWxhdG9yXCIpLCBhbmQgdGhlbiB3aGVuIGEgbmV3IGlucHV0IGV2ZW50IGB0YCBoYXBwZW5zLCBgYWNjYCB3aWxsIGJlXG4gICAqIGNvbWJpbmVkIHdpdGggdGhhdCB0byBwcm9kdWNlIHRoZSBuZXcgYGFjY2AgYW5kIHNvIGZvcnRoLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLS0tLS0xLS0tLS0xLS0yLS0tLTEtLS0tMS0tLS0tLVxuICAgKiAgIGZvbGQoKGFjYywgeCkgPT4gYWNjICsgeCwgMylcbiAgICogMy0tLS0tNC0tLS0tNS0tNy0tLS04LS0tLTktLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGFjY3VtdWxhdGUgQSBmdW5jdGlvbiBvZiB0eXBlIGAoYWNjOiBSLCB0OiBUKSA9PiBSYCB0aGF0XG4gICAqIHRha2VzIHRoZSBwcmV2aW91cyBhY2N1bXVsYXRlZCB2YWx1ZSBgYWNjYCBhbmQgdGhlIGluY29taW5nIGV2ZW50IGZyb20gdGhlXG4gICAqIGlucHV0IHN0cmVhbSBhbmQgcHJvZHVjZXMgdGhlIG5ldyBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICogQHBhcmFtIHNlZWQgVGhlIGluaXRpYWwgYWNjdW11bGF0ZWQgdmFsdWUsIG9mIHR5cGUgYFJgLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBmb2xkPFI+KGFjY3VtdWxhdGU6IChhY2M6IFIsIHQ6IFQpID0+IFIsIHNlZWQ6IFIpOiBNZW1vcnlTdHJlYW08Uj4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFI+KG5ldyBGb2xkPFQsIFI+KGFjY3VtdWxhdGUsIHNlZWQsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBsYWNlcyBhbiBlcnJvciB3aXRoIGFub3RoZXIgc3RyZWFtLlxuICAgKlxuICAgKiBXaGVuIChhbmQgaWYpIGFuIGVycm9yIGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgaW5zdGVhZCBvZiBmb3J3YXJkaW5nXG4gICAqIHRoYXQgZXJyb3IgdG8gdGhlIG91dHB1dCBzdHJlYW0sICpyZXBsYWNlRXJyb3IqIHdpbGwgY2FsbCB0aGUgYHJlcGxhY2VgXG4gICAqIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIHN0cmVhbSB0aGF0IHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgcmVwbGljYXRlLlxuICAgKiBBbmQsIGluIGNhc2UgdGhhdCBuZXcgc3RyZWFtIGFsc28gZW1pdHMgYW4gZXJyb3IsIGByZXBsYWNlYCB3aWxsIGJlIGNhbGxlZFxuICAgKiBhZ2FpbiB0byBnZXQgYW5vdGhlciBzdHJlYW0gdG8gc3RhcnQgcmVwbGljYXRpbmcuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTItLS0tLTMtLTQtLS0tLVhcbiAgICogICByZXBsYWNlRXJyb3IoICgpID0+IC0tMTAtLXwgKVxuICAgKiAtLTEtLS0yLS0tLS0zLS00LS0tLS0tLS0xMC0tfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmVwbGFjZSBBIGZ1bmN0aW9uIG9mIHR5cGUgYChlcnIpID0+IFN0cmVhbWAgdGhhdCB0YWtlc1xuICAgKiB0aGUgZXJyb3IgdGhhdCBvY2N1cnJlZCBvbiB0aGUgaW5wdXQgc3RyZWFtIG9yIG9uIHRoZSBwcmV2aW91cyByZXBsYWNlbWVudFxuICAgKiBzdHJlYW0gYW5kIHJldHVybnMgYSBuZXcgc3RyZWFtLiBUaGUgb3V0cHV0IHN0cmVhbSB3aWxsIGJlaGF2ZSBsaWtlIHRoZVxuICAgKiBzdHJlYW0gdGhhdCB0aGlzIGZ1bmN0aW9uIHJldHVybnMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHJlcGxhY2VFcnJvcihyZXBsYWNlOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBSZXBsYWNlRXJyb3I8VD4ocmVwbGFjZSwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZsYXR0ZW5zIGEgXCJzdHJlYW0gb2Ygc3RyZWFtc1wiLCBoYW5kbGluZyBvbmx5IG9uZSBuZXN0ZWQgc3RyZWFtIGF0IGEgdGltZVxuICAgKiAobm8gY29uY3VycmVuY3kpLlxuICAgKlxuICAgKiBJZiB0aGUgaW5wdXQgc3RyZWFtIGlzIGEgc3RyZWFtIHRoYXQgZW1pdHMgc3RyZWFtcywgdGhlbiB0aGlzIG9wZXJhdG9yIHdpbGxcbiAgICogcmV0dXJuIGFuIG91dHB1dCBzdHJlYW0gd2hpY2ggaXMgYSBmbGF0IHN0cmVhbTogZW1pdHMgcmVndWxhciBldmVudHMuIFRoZVxuICAgKiBmbGF0dGVuaW5nIGhhcHBlbnMgd2l0aG91dCBjb25jdXJyZW5jeS4gSXQgd29ya3MgbGlrZSB0aGlzOiB3aGVuIHRoZSBpbnB1dFxuICAgKiBzdHJlYW0gZW1pdHMgYSBuZXN0ZWQgc3RyZWFtLCAqZmxhdHRlbiogd2lsbCBzdGFydCBpbWl0YXRpbmcgdGhhdCBuZXN0ZWRcbiAgICogb25lLiBIb3dldmVyLCBhcyBzb29uIGFzIHRoZSBuZXh0IG5lc3RlZCBzdHJlYW0gaXMgZW1pdHRlZCBvbiB0aGUgaW5wdXRcbiAgICogc3RyZWFtLCAqZmxhdHRlbiogd2lsbCBmb3JnZXQgdGhlIHByZXZpb3VzIG5lc3RlZCBvbmUgaXQgd2FzIGltaXRhdGluZywgYW5kXG4gICAqIHdpbGwgc3RhcnQgaW1pdGF0aW5nIHRoZSBuZXcgbmVzdGVkIG9uZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0rLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0tXG4gICAqICAgXFwgICAgICAgIFxcXG4gICAqICAgIFxcICAgICAgIC0tLS0xLS0tLTItLS0zLS1cbiAgICogICAgLS1hLS1iLS0tLWMtLS0tZC0tLS0tLS0tXG4gICAqICAgICAgICAgICBmbGF0dGVuXG4gICAqIC0tLS0tYS0tYi0tLS0tLTEtLS0tMi0tLTMtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZmxhdHRlbjxSPih0aGlzOiBTdHJlYW08U3RyZWFtPFI+Pik6IFQge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFI+KG5ldyBGbGF0dGVuKHRoaXMpKSBhcyBUICYgU3RyZWFtPFI+O1xuICB9XG5cbiAgLyoqXG4gICAqIFBhc3NlcyB0aGUgaW5wdXQgc3RyZWFtIHRvIGEgY3VzdG9tIG9wZXJhdG9yLCB0byBwcm9kdWNlIGFuIG91dHB1dCBzdHJlYW0uXG4gICAqXG4gICAqICpjb21wb3NlKiBpcyBhIGhhbmR5IHdheSBvZiB1c2luZyBhbiBleGlzdGluZyBmdW5jdGlvbiBpbiBhIGNoYWluZWQgc3R5bGUuXG4gICAqIEluc3RlYWQgb2Ygd3JpdGluZyBgb3V0U3RyZWFtID0gZihpblN0cmVhbSlgIHlvdSBjYW4gd3JpdGVcbiAgICogYG91dFN0cmVhbSA9IGluU3RyZWFtLmNvbXBvc2UoZilgLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvcGVyYXRvciBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBzdHJlYW0gYXMgaW5wdXQgYW5kXG4gICAqIHJldHVybnMgYSBzdHJlYW0gYXMgd2VsbC5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgY29tcG9zZTxVPihvcGVyYXRvcjogKHN0cmVhbTogU3RyZWFtPFQ+KSA9PiBVKTogVSB7XG4gICAgcmV0dXJuIG9wZXJhdG9yKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb3V0cHV0IHN0cmVhbSB0aGF0IGJlaGF2ZXMgbGlrZSB0aGUgaW5wdXQgc3RyZWFtLCBidXQgYWxzb1xuICAgKiByZW1lbWJlcnMgdGhlIG1vc3QgcmVjZW50IGV2ZW50IHRoYXQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBzbyB0aGF0IGFcbiAgICogbmV3bHkgYWRkZWQgbGlzdGVuZXIgd2lsbCBpbW1lZGlhdGVseSByZWNlaXZlIHRoYXQgbWVtb3Jpc2VkIGV2ZW50LlxuICAgKlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICByZW1lbWJlcigpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KG5ldyBSZW1lbWJlcjxUPih0aGlzKSk7XG4gIH1cblxuICBkZWJ1ZygpOiBTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6IHN0cmluZyk6IFN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogKHQ6IFQpID0+IGFueSk6IFN0cmVhbTxUPjtcbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb3V0cHV0IHN0cmVhbSB0aGF0IGlkZW50aWNhbGx5IGJlaGF2ZXMgbGlrZSB0aGUgaW5wdXQgc3RyZWFtLFxuICAgKiBidXQgYWxzbyBydW5zIGEgYHNweWAgZnVuY3Rpb24gZm9yIGVhY2ggZXZlbnQsIHRvIGhlbHAgeW91IGRlYnVnIHlvdXIgYXBwLlxuICAgKlxuICAgKiAqZGVidWcqIHRha2VzIGEgYHNweWAgZnVuY3Rpb24gYXMgYXJndW1lbnQsIGFuZCBydW5zIHRoYXQgZm9yIGVhY2ggZXZlbnRcbiAgICogaGFwcGVuaW5nIG9uIHRoZSBpbnB1dCBzdHJlYW0uIElmIHlvdSBkb24ndCBwcm92aWRlIHRoZSBgc3B5YCBhcmd1bWVudCxcbiAgICogdGhlbiAqZGVidWcqIHdpbGwganVzdCBgY29uc29sZS5sb2dgIGVhY2ggZXZlbnQuIFRoaXMgaGVscHMgeW91IHRvXG4gICAqIHVuZGVyc3RhbmQgdGhlIGZsb3cgb2YgZXZlbnRzIHRocm91Z2ggc29tZSBvcGVyYXRvciBjaGFpbi5cbiAgICpcbiAgICogUGxlYXNlIG5vdGUgdGhhdCBpZiB0aGUgb3V0cHV0IHN0cmVhbSBoYXMgbm8gbGlzdGVuZXJzLCB0aGVuIGl0IHdpbGwgbm90XG4gICAqIHN0YXJ0LCB3aGljaCBtZWFucyBgc3B5YCB3aWxsIG5ldmVyIHJ1biBiZWNhdXNlIG5vIGFjdHVhbCBldmVudCBoYXBwZW5zIGluXG4gICAqIHRoYXQgY2FzZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLTQtLVxuICAgKiAgICAgICAgIGRlYnVnXG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS00LS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxhYmVsT3JTcHkgQSBzdHJpbmcgdG8gdXNlIGFzIHRoZSBsYWJlbCB3aGVuIHByaW50aW5nXG4gICAqIGRlYnVnIGluZm9ybWF0aW9uIG9uIHRoZSBjb25zb2xlLCBvciBhICdzcHknIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYW4gZXZlbnRcbiAgICogYXMgYXJndW1lbnQsIGFuZCBkb2VzIG5vdCBuZWVkIHRvIHJldHVybiBhbnl0aGluZy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZGVidWcobGFiZWxPclNweT86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBEZWJ1ZzxUPih0aGlzLCBsYWJlbE9yU3B5KSk7XG4gIH1cblxuICAvKipcbiAgICogKmltaXRhdGUqIGNoYW5nZXMgdGhpcyBjdXJyZW50IFN0cmVhbSB0byBlbWl0IHRoZSBzYW1lIGV2ZW50cyB0aGF0IHRoZVxuICAgKiBgb3RoZXJgIGdpdmVuIFN0cmVhbSBkb2VzLiBUaGlzIG1ldGhvZCByZXR1cm5zIG5vdGhpbmcuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGV4aXN0cyB0byBhbGxvdyBvbmUgdGhpbmc6ICoqY2lyY3VsYXIgZGVwZW5kZW5jeSBvZiBzdHJlYW1zKiouXG4gICAqIEZvciBpbnN0YW5jZSwgbGV0J3MgaW1hZ2luZSB0aGF0IGZvciBzb21lIHJlYXNvbiB5b3UgbmVlZCB0byBjcmVhdGUgYVxuICAgKiBjaXJjdWxhciBkZXBlbmRlbmN5IHdoZXJlIHN0cmVhbSBgZmlyc3QkYCBkZXBlbmRzIG9uIHN0cmVhbSBgc2Vjb25kJGBcbiAgICogd2hpY2ggaW4gdHVybiBkZXBlbmRzIG9uIGBmaXJzdCRgOlxuICAgKlxuICAgKiA8IS0tIHNraXAtZXhhbXBsZSAtLT5cbiAgICogYGBganNcbiAgICogaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknXG4gICAqXG4gICAqIHZhciBmaXJzdCQgPSBzZWNvbmQkLm1hcCh4ID0+IHggKiAxMCkudGFrZSgzKTtcbiAgICogdmFyIHNlY29uZCQgPSBmaXJzdCQubWFwKHggPT4geCArIDEpLnN0YXJ0V2l0aCgxKS5jb21wb3NlKGRlbGF5KDEwMCkpO1xuICAgKiBgYGBcbiAgICpcbiAgICogSG93ZXZlciwgdGhhdCBpcyBpbnZhbGlkIEphdmFTY3JpcHQsIGJlY2F1c2UgYHNlY29uZCRgIGlzIHVuZGVmaW5lZFxuICAgKiBvbiB0aGUgZmlyc3QgbGluZS4gVGhpcyBpcyBob3cgKmltaXRhdGUqIGNhbiBoZWxwIHNvbHZlIGl0OlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAgICpcbiAgICogdmFyIHNlY29uZFByb3h5JCA9IHhzLmNyZWF0ZSgpO1xuICAgKiB2YXIgZmlyc3QkID0gc2Vjb25kUHJveHkkLm1hcCh4ID0+IHggKiAxMCkudGFrZSgzKTtcbiAgICogdmFyIHNlY29uZCQgPSBmaXJzdCQubWFwKHggPT4geCArIDEpLnN0YXJ0V2l0aCgxKS5jb21wb3NlKGRlbGF5KDEwMCkpO1xuICAgKiBzZWNvbmRQcm94eSQuaW1pdGF0ZShzZWNvbmQkKTtcbiAgICogYGBgXG4gICAqXG4gICAqIFdlIGNyZWF0ZSBgc2Vjb25kUHJveHkkYCBiZWZvcmUgdGhlIG90aGVycywgc28gaXQgY2FuIGJlIHVzZWQgaW4gdGhlXG4gICAqIGRlY2xhcmF0aW9uIG9mIGBmaXJzdCRgLiBUaGVuLCBhZnRlciBib3RoIGBmaXJzdCRgIGFuZCBgc2Vjb25kJGAgYXJlXG4gICAqIGRlZmluZWQsIHdlIGhvb2sgYHNlY29uZFByb3h5JGAgd2l0aCBgc2Vjb25kJGAgd2l0aCBgaW1pdGF0ZSgpYCB0byB0ZWxsXG4gICAqIHRoYXQgdGhleSBhcmUgXCJ0aGUgc2FtZVwiLiBgaW1pdGF0ZWAgd2lsbCBub3QgdHJpZ2dlciB0aGUgc3RhcnQgb2YgYW55XG4gICAqIHN0cmVhbSwgaXQganVzdCBiaW5kcyBgc2Vjb25kUHJveHkkYCBhbmQgYHNlY29uZCRgIHRvZ2V0aGVyLlxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGlzIGFuIGV4YW1wbGUgd2hlcmUgYGltaXRhdGUoKWAgaXMgaW1wb3J0YW50IGluIEN5Y2xlLmpzXG4gICAqIGFwcGxpY2F0aW9ucy4gQSBwYXJlbnQgY29tcG9uZW50IGNvbnRhaW5zIHNvbWUgY2hpbGQgY29tcG9uZW50cy4gQSBjaGlsZFxuICAgKiBoYXMgYW4gYWN0aW9uIHN0cmVhbSB3aGljaCBpcyBnaXZlbiB0byB0aGUgcGFyZW50IHRvIGRlZmluZSBpdHMgc3RhdGU6XG4gICAqXG4gICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgKiBgYGBqc1xuICAgKiBjb25zdCBjaGlsZEFjdGlvblByb3h5JCA9IHhzLmNyZWF0ZSgpO1xuICAgKiBjb25zdCBwYXJlbnQgPSBQYXJlbnQoey4uLnNvdXJjZXMsIGNoaWxkQWN0aW9uJDogY2hpbGRBY3Rpb25Qcm94eSR9KTtcbiAgICogY29uc3QgY2hpbGRBY3Rpb24kID0gcGFyZW50LnN0YXRlJC5tYXAocyA9PiBzLmNoaWxkLmFjdGlvbiQpLmZsYXR0ZW4oKTtcbiAgICogY2hpbGRBY3Rpb25Qcm94eSQuaW1pdGF0ZShjaGlsZEFjdGlvbiQpO1xuICAgKiBgYGBcbiAgICpcbiAgICogTm90ZSwgdGhvdWdoLCB0aGF0ICoqYGltaXRhdGUoKWAgZG9lcyBub3Qgc3VwcG9ydCBNZW1vcnlTdHJlYW1zKiouIElmIHdlXG4gICAqIHdvdWxkIGF0dGVtcHQgdG8gaW1pdGF0ZSBhIE1lbW9yeVN0cmVhbSBpbiBhIGNpcmN1bGFyIGRlcGVuZGVuY3ksIHdlIHdvdWxkXG4gICAqIGVpdGhlciBnZXQgYSByYWNlIGNvbmRpdGlvbiAod2hlcmUgdGhlIHN5bXB0b20gd291bGQgYmUgXCJub3RoaW5nIGhhcHBlbnNcIilcbiAgICogb3IgYW4gaW5maW5pdGUgY3ljbGljIGVtaXNzaW9uIG9mIHZhbHVlcy4gSXQncyB1c2VmdWwgdG8gdGhpbmsgYWJvdXRcbiAgICogTWVtb3J5U3RyZWFtcyBhcyBjZWxscyBpbiBhIHNwcmVhZHNoZWV0LiBJdCBkb2Vzbid0IG1ha2UgYW55IHNlbnNlIHRvXG4gICAqIGRlZmluZSBhIHNwcmVhZHNoZWV0IGNlbGwgYEExYCB3aXRoIGEgZm9ybXVsYSB0aGF0IGRlcGVuZHMgb24gYEIxYCBhbmRcbiAgICogY2VsbCBgQjFgIGRlZmluZWQgd2l0aCBhIGZvcm11bGEgdGhhdCBkZXBlbmRzIG9uIGBBMWAuXG4gICAqXG4gICAqIElmIHlvdSBmaW5kIHlvdXJzZWxmIHdhbnRpbmcgdG8gdXNlIGBpbWl0YXRlKClgIHdpdGggYVxuICAgKiBNZW1vcnlTdHJlYW0sIHlvdSBzaG91bGQgcmV3b3JrIHlvdXIgY29kZSBhcm91bmQgYGltaXRhdGUoKWAgdG8gdXNlIGFcbiAgICogU3RyZWFtIGluc3RlYWQuIExvb2sgZm9yIHRoZSBzdHJlYW0gaW4gdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kgdGhhdFxuICAgKiByZXByZXNlbnRzIGFuIGV2ZW50IHN0cmVhbSwgYW5kIHRoYXQgd291bGQgYmUgYSBjYW5kaWRhdGUgZm9yIGNyZWF0aW5nIGFcbiAgICogcHJveHkgU3RyZWFtIHdoaWNoIHRoZW4gaW1pdGF0ZXMgdGhlIHRhcmdldCBTdHJlYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyZWFtfSB0YXJnZXQgVGhlIG90aGVyIHN0cmVhbSB0byBpbWl0YXRlIG9uIHRoZSBjdXJyZW50IG9uZS4gTXVzdFxuICAgKiBub3QgYmUgYSBNZW1vcnlTdHJlYW0uXG4gICAqL1xuICBpbWl0YXRlKHRhcmdldDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE1lbW9yeVN0cmVhbSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignQSBNZW1vcnlTdHJlYW0gd2FzIGdpdmVuIHRvIGltaXRhdGUoKSwgYnV0IGl0IG9ubHkgJyArXG4gICAgICAnc3VwcG9ydHMgYSBTdHJlYW0uIFJlYWQgbW9yZSBhYm91dCB0aGlzIHJlc3RyaWN0aW9uIGhlcmU6ICcgK1xuICAgICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9zdGFsdHoveHN0cmVhbSNmYXEnKTtcbiAgICB0aGlzLl90YXJnZXQgPSB0YXJnZXQ7XG4gICAgZm9yIChsZXQgaWxzID0gdGhpcy5faWxzLCBOID0gaWxzLmxlbmd0aCwgaSA9IDA7IGkgPCBOOyBpKyspIHRhcmdldC5fYWRkKGlsc1tpXSk7XG4gICAgdGhpcy5faWxzID0gW107XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgZ2l2ZW4gdmFsdWUgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgXCJuZXh0XCIgdmFsdWUgeW91IHdhbnQgdG8gYnJvYWRjYXN0IHRvIGFsbCBsaXN0ZW5lcnMgb2ZcbiAgICogdGhpcyBTdHJlYW0uXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZE5leHQodmFsdWU6IFQpIHtcbiAgICB0aGlzLl9uKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiBlcnJvciB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGVycm9yIFRoZSBlcnJvciB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIHRoZSBsaXN0ZW5lcnMgb2ZcbiAgICogdGhpcyBTdHJlYW0uXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZEVycm9yKGVycm9yOiBhbnkpIHtcbiAgICB0aGlzLl9lKGVycm9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBcImNvbXBsZXRlZFwiIGV2ZW50IHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKi9cbiAgc2hhbWVmdWxseVNlbmRDb21wbGV0ZSgpIHtcbiAgICB0aGlzLl9jKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIFwiZGVidWdcIiBsaXN0ZW5lciB0byB0aGUgc3RyZWFtLiBUaGVyZSBjYW4gb25seSBiZSBvbmUgZGVidWdcbiAgICogbGlzdGVuZXIsIHRoYXQncyB3aHkgdGhpcyBpcyAnc2V0RGVidWdMaXN0ZW5lcicuIFRvIHJlbW92ZSB0aGUgZGVidWdcbiAgICogbGlzdGVuZXIsIGp1c3QgY2FsbCBzZXREZWJ1Z0xpc3RlbmVyKG51bGwpLlxuICAgKlxuICAgKiBBIGRlYnVnIGxpc3RlbmVyIGlzIGxpa2UgYW55IG90aGVyIGxpc3RlbmVyLiBUaGUgb25seSBkaWZmZXJlbmNlIGlzIHRoYXQgYVxuICAgKiBkZWJ1ZyBsaXN0ZW5lciBpcyBcInN0ZWFsdGh5XCI6IGl0cyBwcmVzZW5jZS9hYnNlbmNlIGRvZXMgbm90IHRyaWdnZXIgdGhlXG4gICAqIHN0YXJ0L3N0b3Agb2YgdGhlIHN0cmVhbSAob3IgdGhlIHByb2R1Y2VyIGluc2lkZSB0aGUgc3RyZWFtKS4gVGhpcyBpc1xuICAgKiB1c2VmdWwgc28geW91IGNhbiBpbnNwZWN0IHdoYXQgaXMgZ29pbmcgb24gd2l0aG91dCBjaGFuZ2luZyB0aGUgYmVoYXZpb3JcbiAgICogb2YgdGhlIHByb2dyYW0uIElmIHlvdSBoYXZlIGFuIGlkbGUgc3RyZWFtIGFuZCB5b3UgYWRkIGEgbm9ybWFsIGxpc3RlbmVyIHRvXG4gICAqIGl0LCB0aGUgc3RyZWFtIHdpbGwgc3RhcnQgZXhlY3V0aW5nLiBCdXQgaWYgeW91IHNldCBhIGRlYnVnIGxpc3RlbmVyIG9uIGFuXG4gICAqIGlkbGUgc3RyZWFtLCBpdCB3b24ndCBzdGFydCBleGVjdXRpbmcgKG5vdCB1bnRpbCB0aGUgZmlyc3Qgbm9ybWFsIGxpc3RlbmVyXG4gICAqIGlzIGFkZGVkKS5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCB3ZSBkb24ndCByZWNvbW1lbmQgdXNpbmcgdGhpcyBtZXRob2QgdG8gYnVpbGQgYXBwXG4gICAqIGxvZ2ljLiBJbiBmYWN0LCBpbiBtb3N0IGNhc2VzIHRoZSBkZWJ1ZyBvcGVyYXRvciB3b3JrcyBqdXN0IGZpbmUuIE9ubHkgdXNlXG4gICAqIHRoaXMgb25lIGlmIHlvdSBrbm93IHdoYXQgeW91J3JlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgKi9cbiAgc2V0RGVidWdMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgdGhpcy5fZCA9IGZhbHNlO1xuICAgICAgdGhpcy5fZGwgPSBOTyBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kID0gdHJ1ZTtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fbiA9IGxpc3RlbmVyLm5leHQgfHwgbm9vcDtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fZSA9IGxpc3RlbmVyLmVycm9yIHx8IG5vb3A7XG4gICAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2MgPSBsaXN0ZW5lci5jb21wbGV0ZSB8fCBub29wO1xuICAgICAgdGhpcy5fZGwgPSBsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RyZWFtPFQ+IGV4dGVuZHMgU3RyZWFtPFQ+IHtcbiAgcHJpdmF0ZSBfdjogVDtcbiAgcHJpdmF0ZSBfaGFzOiBib29sZWFuID0gZmFsc2U7XG4gIGNvbnN0cnVjdG9yKHByb2R1Y2VyOiBJbnRlcm5hbFByb2R1Y2VyPFQ+KSB7XG4gICAgc3VwZXIocHJvZHVjZXIpO1xuICB9XG5cbiAgX24oeDogVCkge1xuICAgIHRoaXMuX3YgPSB4O1xuICAgIHRoaXMuX2hhcyA9IHRydWU7XG4gICAgc3VwZXIuX24oeCk7XG4gIH1cblxuICBfYWRkKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9hZGQoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgYS5wdXNoKGlsKTtcbiAgICBpZiAoYS5sZW5ndGggPiAxKSB7XG4gICAgICBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3N0b3BJRCAhPT0gTk8pIHtcbiAgICAgIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3N0b3BJRCk7XG4gICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7IGVsc2Uge1xuICAgICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgICBpZiAocCAhPT0gTk8pIHAuX3N0YXJ0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF9zdG9wTm93KCkge1xuICAgIHRoaXMuX2hhcyA9IGZhbHNlO1xuICAgIHN1cGVyLl9zdG9wTm93KCk7XG4gIH1cblxuICBfeCgpOiB2b2lkIHtcbiAgICB0aGlzLl9oYXMgPSBmYWxzZTtcbiAgICBzdXBlci5feCgpO1xuICB9XG5cbiAgbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwKHByb2plY3QpIGFzIE1lbW9yeVN0cmVhbTxVPjtcbiAgfVxuXG4gIG1hcFRvPFU+KHByb2plY3RlZFZhbHVlOiBVKTogTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gc3VwZXIubWFwVG8ocHJvamVjdGVkVmFsdWUpIGFzIE1lbW9yeVN0cmVhbTxVPjtcbiAgfVxuXG4gIHRha2UoYW1vdW50OiBudW1iZXIpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci50YWtlKGFtb3VudCkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG5cbiAgZW5kV2hlbihvdGhlcjogU3RyZWFtPGFueT4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5lbmRXaGVuKG90aGVyKSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICByZXBsYWNlRXJyb3IocmVwbGFjZTogKGVycjogYW55KSA9PiBTdHJlYW08VD4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5yZXBsYWNlRXJyb3IocmVwbGFjZSkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG5cbiAgcmVtZW1iZXIoKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRlYnVnKCk6IE1lbW9yeVN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogc3RyaW5nKTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiAodDogVCkgPT4gYW55KTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5Pzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpIHwgdW5kZWZpbmVkKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIuZGVidWcobGFiZWxPclNweSBhcyBhbnkpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxufVxuXG5leHBvcnQge05PLCBOT19JTH07XG5jb25zdCB4cyA9IFN0cmVhbTtcbnR5cGUgeHM8VD4gPSBTdHJlYW08VD47XG5leHBvcnQgZGVmYXVsdCB4cztcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgZnJvbUV2ZW50XzEgPSByZXF1aXJlKFwiLi9mcm9tRXZlbnRcIik7XG52YXIgQm9keURPTVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBCb2R5RE9NU291cmNlKF9uYW1lKSB7XG4gICAgICAgIHRoaXMuX25hbWUgPSBfbmFtZTtcbiAgICB9XG4gICAgQm9keURPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb25hbGl0eSBpcyBzdGlsbCB1bmRlZmluZWQvdW5kZWNpZGVkLlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5vZihbZG9jdW1lbnQuYm9keV0pKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGRvY3VtZW50LmJvZHkpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMsIGJ1YmJsZXMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdmFyIHN0cmVhbTtcbiAgICAgICAgc3RyZWFtID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KGRvY3VtZW50LmJvZHksIGV2ZW50VHlwZSwgb3B0aW9ucy51c2VDYXB0dXJlLCBvcHRpb25zLnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoc3RyZWFtKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIHJldHVybiBCb2R5RE9NU291cmNlO1xufSgpKTtcbmV4cG9ydHMuQm9keURPTVNvdXJjZSA9IEJvZHlET01Tb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Cb2R5RE9NU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgZnJvbUV2ZW50XzEgPSByZXF1aXJlKFwiLi9mcm9tRXZlbnRcIik7XG52YXIgRG9jdW1lbnRET01Tb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRG9jdW1lbnRET01Tb3VyY2UoX25hbWUpIHtcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xuICAgIH1cbiAgICBEb2N1bWVudERPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb25hbGl0eSBpcyBzdGlsbCB1bmRlZmluZWQvdW5kZWNpZGVkLlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIERvY3VtZW50RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQub2YoW2RvY3VtZW50XSkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgRG9jdW1lbnRET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGRvY3VtZW50KSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBEb2N1bWVudERPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucywgYnViYmxlcykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICB2YXIgc3RyZWFtO1xuICAgICAgICBzdHJlYW0gPSBmcm9tRXZlbnRfMS5mcm9tRXZlbnQoZG9jdW1lbnQsIGV2ZW50VHlwZSwgb3B0aW9ucy51c2VDYXB0dXJlLCBvcHRpb25zLnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoc3RyZWFtKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIHJldHVybiBEb2N1bWVudERPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLkRvY3VtZW50RE9NU291cmNlID0gRG9jdW1lbnRET01Tb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Eb2N1bWVudERPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTY29wZUNoZWNrZXJfMSA9IHJlcXVpcmUoXCIuL1Njb3BlQ2hlY2tlclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5mdW5jdGlvbiB0b0VsQXJyYXkoaW5wdXQpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaW5wdXQpO1xufVxudmFyIEVsZW1lbnRGaW5kZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRWxlbWVudEZpbmRlcihuYW1lc3BhY2UsIGlzb2xhdGVNb2R1bGUpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZSA9IGlzb2xhdGVNb2R1bGU7XG4gICAgfVxuICAgIEVsZW1lbnRGaW5kZXIucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSB0aGlzLm5hbWVzcGFjZTtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gdXRpbHNfMS5nZXRTZWxlY3RvcnMobmFtZXNwYWNlKTtcbiAgICAgICAgdmFyIHNjb3BlQ2hlY2tlciA9IG5ldyBTY29wZUNoZWNrZXJfMS5TY29wZUNoZWNrZXIobmFtZXNwYWNlLCB0aGlzLmlzb2xhdGVNb2R1bGUpO1xuICAgICAgICB2YXIgdG9wTm9kZSA9IHRoaXMuaXNvbGF0ZU1vZHVsZS5nZXRFbGVtZW50KG5hbWVzcGFjZS5maWx0ZXIoZnVuY3Rpb24gKG4pIHsgcmV0dXJuIG4udHlwZSAhPT0gJ3NlbGVjdG9yJzsgfSkpO1xuICAgICAgICBpZiAodG9wTm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIFt0b3BOb2RlXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG9FbEFycmF5KHRvcE5vZGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpXG4gICAgICAgICAgICAuZmlsdGVyKHNjb3BlQ2hlY2tlci5pc0RpcmVjdGx5SW5TY29wZSwgc2NvcGVDaGVja2VyKVxuICAgICAgICAgICAgLmNvbmNhdCh0b3BOb2RlLm1hdGNoZXMoc2VsZWN0b3IpID8gW3RvcE5vZGVdIDogW10pO1xuICAgIH07XG4gICAgcmV0dXJuIEVsZW1lbnRGaW5kZXI7XG59KCkpO1xuZXhwb3J0cy5FbGVtZW50RmluZGVyID0gRWxlbWVudEZpbmRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUVsZW1lbnRGaW5kZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIFNjb3BlQ2hlY2tlcl8xID0gcmVxdWlyZShcIi4vU2NvcGVDaGVja2VyXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBFbGVtZW50RmluZGVyXzEgPSByZXF1aXJlKFwiLi9FbGVtZW50RmluZGVyXCIpO1xudmFyIFN5bWJvbFRyZWVfMSA9IHJlcXVpcmUoXCIuL1N5bWJvbFRyZWVcIik7XG52YXIgUmVtb3ZhbFNldF8xID0gcmVxdWlyZShcIi4vUmVtb3ZhbFNldFwiKTtcbnZhciBQcmlvcml0eVF1ZXVlXzEgPSByZXF1aXJlKFwiLi9Qcmlvcml0eVF1ZXVlXCIpO1xudmFyIGZyb21FdmVudF8xID0gcmVxdWlyZShcIi4vZnJvbUV2ZW50XCIpO1xuZXhwb3J0cy5ldmVudFR5cGVzVGhhdERvbnRCdWJibGUgPSBbXG4gICAgXCJibHVyXCIsXG4gICAgXCJjYW5wbGF5XCIsXG4gICAgXCJjYW5wbGF5dGhyb3VnaFwiLFxuICAgIFwiZHVyYXRpb25jaGFuZ2VcIixcbiAgICBcImVtcHRpZWRcIixcbiAgICBcImVuZGVkXCIsXG4gICAgXCJmb2N1c1wiLFxuICAgIFwibG9hZFwiLFxuICAgIFwibG9hZGVkZGF0YVwiLFxuICAgIFwibG9hZGVkbWV0YWRhdGFcIixcbiAgICBcIm1vdXNlZW50ZXJcIixcbiAgICBcIm1vdXNlbGVhdmVcIixcbiAgICBcInBhdXNlXCIsXG4gICAgXCJwbGF5XCIsXG4gICAgXCJwbGF5aW5nXCIsXG4gICAgXCJyYXRlY2hhbmdlXCIsXG4gICAgXCJyZXNldFwiLFxuICAgIFwic2Nyb2xsXCIsXG4gICAgXCJzZWVrZWRcIixcbiAgICBcInNlZWtpbmdcIixcbiAgICBcInN0YWxsZWRcIixcbiAgICBcInN1Ym1pdFwiLFxuICAgIFwic3VzcGVuZFwiLFxuICAgIFwidGltZXVwZGF0ZVwiLFxuICAgIFwidW5sb2FkXCIsXG4gICAgXCJ2b2x1bWVjaGFuZ2VcIixcbiAgICBcIndhaXRpbmdcIixcbl07XG4vKipcbiAqIE1hbmFnZXMgXCJFdmVudCBkZWxlZ2F0aW9uXCIsIGJ5IGNvbm5lY3RpbmcgYW4gb3JpZ2luIHdpdGggbXVsdGlwbGVcbiAqIGRlc3RpbmF0aW9ucy5cbiAqXG4gKiBBdHRhY2hlcyBhIERPTSBldmVudCBsaXN0ZW5lciB0byB0aGUgRE9NIGVsZW1lbnQgY2FsbGVkIHRoZSBcIm9yaWdpblwiLFxuICogYW5kIGRlbGVnYXRlcyBldmVudHMgdG8gXCJkZXN0aW5hdGlvbnNcIiwgd2hpY2ggYXJlIHN1YmplY3RzIGFzIG91dHB1dHNcbiAqIGZvciB0aGUgRE9NU291cmNlLiBTaW11bGF0ZXMgYnViYmxpbmcgb3IgY2FwdHVyaW5nLCB3aXRoIHJlZ2FyZHMgdG9cbiAqIGlzb2xhdGlvbiBib3VuZGFyaWVzIHRvby5cbiAqL1xudmFyIEV2ZW50RGVsZWdhdG9yID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50RGVsZWdhdG9yKHJvb3RFbGVtZW50JCwgaXNvbGF0ZU1vZHVsZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50JCA9IHJvb3RFbGVtZW50JDtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlID0gaXNvbGF0ZU1vZHVsZTtcbiAgICAgICAgdGhpcy52aXJ0dWFsTGlzdGVuZXJzID0gbmV3IFN5bWJvbFRyZWVfMS5kZWZhdWx0KGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnNjb3BlOyB9KTtcbiAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVyc1RvQWRkID0gbmV3IFJlbW92YWxTZXRfMS5kZWZhdWx0KCk7XG4gICAgICAgIHRoaXMudmlydHVhbE5vbkJ1YmJsaW5nTGlzdGVuZXIgPSBbXTtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlLnNldEV2ZW50RGVsZWdhdG9yKHRoaXMpO1xuICAgICAgICB0aGlzLmRvbUxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5kb21MaXN0ZW5lcnNUb0FkZCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgcm9vdEVsZW1lbnQkLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIGlmIChfdGhpcy5vcmlnaW4gIT09IGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLm9yaWdpbiA9IGVsO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5yZXNldEV2ZW50TGlzdGVuZXJzKCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmRvbUxpc3RlbmVyc1RvQWRkLmZvckVhY2goZnVuY3Rpb24gKHBhc3NpdmUsIHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5zZXR1cERPTUxpc3RlbmVyKHR5cGUsIHBhc3NpdmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZG9tTGlzdGVuZXJzVG9BZGQuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3RoaXMucmVzZXROb25CdWJibGluZ0xpc3RlbmVycygpO1xuICAgICAgICAgICAgICAgIF90aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzVG9BZGQuZm9yRWFjaChmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNldHVwTm9uQnViYmxpbmdMaXN0ZW5lcihhcnIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbmFtZXNwYWNlLCBvcHRpb25zLCBidWJibGVzKSB7XG4gICAgICAgIHZhciBzdWJqZWN0ID0geHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKTtcbiAgICAgICAgdmFyIHNjb3BlQ2hlY2tlciA9IG5ldyBTY29wZUNoZWNrZXJfMS5TY29wZUNoZWNrZXIobmFtZXNwYWNlLCB0aGlzLmlzb2xhdGVNb2R1bGUpO1xuICAgICAgICB2YXIgZGVzdCA9IHRoaXMuaW5zZXJ0TGlzdGVuZXIoc3ViamVjdCwgc2NvcGVDaGVja2VyLCBldmVudFR5cGUsIG9wdGlvbnMpO1xuICAgICAgICB2YXIgc2hvdWxkQnViYmxlID0gYnViYmxlcyA9PT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IGV4cG9ydHMuZXZlbnRUeXBlc1RoYXREb250QnViYmxlLmluZGV4T2YoZXZlbnRUeXBlKSA9PT0gLTFcbiAgICAgICAgICAgIDogYnViYmxlcztcbiAgICAgICAgaWYgKHNob3VsZEJ1YmJsZSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmRvbUxpc3RlbmVycy5oYXMoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0dXBET01MaXN0ZW5lcihldmVudFR5cGUsICEhb3B0aW9ucy5wYXNzaXZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBmaW5kZXIgPSBuZXcgRWxlbWVudEZpbmRlcl8xLkVsZW1lbnRGaW5kZXIobmFtZXNwYWNlLCB0aGlzLmlzb2xhdGVNb2R1bGUpO1xuICAgICAgICAgICAgdGhpcy5zZXR1cE5vbkJ1YmJsaW5nTGlzdGVuZXIoW2V2ZW50VHlwZSwgZmluZGVyLCBkZXN0XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1YmplY3Q7XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucmVtb3ZlRWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50LCBuYW1lc3BhY2UpIHtcbiAgICAgICAgaWYgKG5hbWVzcGFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnZpcnR1YWxMaXN0ZW5lcnMuZGVsZXRlKG5hbWVzcGFjZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRvUmVtb3ZlID0gW107XG4gICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAobWFwLCB0eXBlKSB7XG4gICAgICAgICAgICBpZiAobWFwLmhhcyhlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIHRvUmVtb3ZlLnB1c2goW3R5cGUsIGVsZW1lbnRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9SZW1vdmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtYXAgPSB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmdldCh0b1JlbW92ZVtpXVswXSk7XG4gICAgICAgICAgICBpZiAoIW1hcCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFwLmRlbGV0ZSh0b1JlbW92ZVtpXVsxXSk7XG4gICAgICAgICAgICBpZiAobWFwLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmRlbGV0ZSh0b1JlbW92ZVtpXVswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLnNldCh0b1JlbW92ZVtpXVswXSwgbWFwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLmluc2VydExpc3RlbmVyID0gZnVuY3Rpb24gKHN1YmplY3QsIHNjb3BlQ2hlY2tlciwgZXZlbnRUeXBlLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciByZWxldmFudFNldHMgPSBbXTtcbiAgICAgICAgdmFyIG4gPSBzY29wZUNoZWNrZXIuX25hbWVzcGFjZTtcbiAgICAgICAgdmFyIG1heCA9IG4ubGVuZ3RoO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICByZWxldmFudFNldHMucHVzaCh0aGlzLmdldFZpcnR1YWxMaXN0ZW5lcnMoZXZlbnRUeXBlLCBuLCB0cnVlLCBtYXgpKTtcbiAgICAgICAgICAgIG1heC0tO1xuICAgICAgICB9IHdoaWxlIChtYXggPj0gMCAmJiBuW21heF0udHlwZSAhPT0gJ3RvdGFsJyk7XG4gICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IF9fYXNzaWduKHt9LCBvcHRpb25zLCB7IHNjb3BlQ2hlY2tlcjogc2NvcGVDaGVja2VyLFxuICAgICAgICAgICAgc3ViamVjdDogc3ViamVjdCwgYnViYmxlczogISFvcHRpb25zLmJ1YmJsZXMsIHVzZUNhcHR1cmU6ICEhb3B0aW9ucy51c2VDYXB0dXJlLCBwYXNzaXZlOiAhIW9wdGlvbnMucGFzc2l2ZSB9KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWxldmFudFNldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlbGV2YW50U2V0c1tpXS5hZGQoZGVzdGluYXRpb24sIG4ubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVzdGluYXRpb247XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgc2V0IG9mIGFsbCB2aXJ0dWFsIGxpc3RlbmVycyBpbiB0aGUgc2NvcGUgb2YgdGhlIG5hbWVzcGFjZVxuICAgICAqIFNldCBgZXhhY3RgIHRvIHRydWUgdG8gdHJlYXQgc2liaWxpbmcgaXNvbGF0ZWQgc2NvcGVzIGFzIHRvdGFsIHNjb3Blc1xuICAgICAqL1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5nZXRWaXJ0dWFsTGlzdGVuZXJzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbmFtZXNwYWNlLCBleGFjdCwgbWF4KSB7XG4gICAgICAgIGlmIChleGFjdCA9PT0gdm9pZCAwKSB7IGV4YWN0ID0gZmFsc2U7IH1cbiAgICAgICAgdmFyIF9tYXggPSBtYXggIT09IHVuZGVmaW5lZCA/IG1heCA6IG5hbWVzcGFjZS5sZW5ndGg7XG4gICAgICAgIGlmICghZXhhY3QpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBfbWF4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAobmFtZXNwYWNlW2ldLnR5cGUgPT09ICd0b3RhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgX21heCA9IGkgKyAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX21heCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1hcCA9IHRoaXMudmlydHVhbExpc3RlbmVycy5nZXREZWZhdWx0KG5hbWVzcGFjZSwgZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IE1hcCgpOyB9LCBfbWF4KTtcbiAgICAgICAgaWYgKCFtYXAuaGFzKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIG1hcC5zZXQoZXZlbnRUeXBlLCBuZXcgUHJpb3JpdHlRdWV1ZV8xLmRlZmF1bHQoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hcC5nZXQoZXZlbnRUeXBlKTtcbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5zZXR1cERPTUxpc3RlbmVyID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgcGFzc2l2ZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy5vcmlnaW4pIHtcbiAgICAgICAgICAgIHZhciBzdWIgPSBmcm9tRXZlbnRfMS5mcm9tRXZlbnQodGhpcy5vcmlnaW4sIGV2ZW50VHlwZSwgZmFsc2UsIGZhbHNlLCBwYXNzaXZlKS5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChldmVudCkgeyByZXR1cm4gX3RoaXMub25FdmVudChldmVudFR5cGUsIGV2ZW50LCBwYXNzaXZlKTsgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuZG9tTGlzdGVuZXJzLnNldChldmVudFR5cGUsIHsgc3ViOiBzdWIsIHBhc3NpdmU6IHBhc3NpdmUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRvbUxpc3RlbmVyc1RvQWRkLnNldChldmVudFR5cGUsIHBhc3NpdmUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuc2V0dXBOb25CdWJibGluZ0xpc3RlbmVyID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBpbnB1dFswXSwgZWxlbWVudEZpbmRlciA9IGlucHV0WzFdLCBkZXN0aW5hdGlvbiA9IGlucHV0WzJdO1xuICAgICAgICBpZiAoIXRoaXMub3JpZ2luKSB7XG4gICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzVG9BZGQuYWRkKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZWxlbWVudCA9IGVsZW1lbnRGaW5kZXIuY2FsbCgpWzBdO1xuICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVyc1RvQWRkLmRlbGV0ZShpbnB1dCk7XG4gICAgICAgICAgICB2YXIgc3ViID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KGVsZW1lbnQsIGV2ZW50VHlwZSwgZmFsc2UsIGZhbHNlLCBkZXN0aW5hdGlvbi5wYXNzaXZlKS5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChldikgeyByZXR1cm4gX3RoaXMub25FdmVudChldmVudFR5cGUsIGV2LCAhIWRlc3RpbmF0aW9uLnBhc3NpdmUsIGZhbHNlKTsgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5oYXMoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuc2V0KGV2ZW50VHlwZSwgbmV3IE1hcCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtYXAgPSB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmdldChldmVudFR5cGUpO1xuICAgICAgICAgICAgaWYgKCFtYXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtYXAuc2V0KGVsZW1lbnQsIHsgc3ViOiBzdWIsIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbiB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnNUb0FkZC5hZGQoaW5wdXQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucmVzZXRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGl0ZXIgPSB0aGlzLmRvbUxpc3RlbmVycy5lbnRyaWVzKCk7XG4gICAgICAgIHZhciBjdXJyID0gaXRlci5uZXh0KCk7XG4gICAgICAgIHdoaWxlICghY3Vyci5kb25lKSB7XG4gICAgICAgICAgICB2YXIgX2EgPSBjdXJyLnZhbHVlLCB0eXBlID0gX2FbMF0sIF9iID0gX2FbMV0sIHN1YiA9IF9iLnN1YiwgcGFzc2l2ZSA9IF9iLnBhc3NpdmU7XG4gICAgICAgICAgICBzdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0dXBET01MaXN0ZW5lcih0eXBlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgIGN1cnIgPSBpdGVyLm5leHQoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnJlc2V0Tm9uQnViYmxpbmdMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBuZXdNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHZhciBpbnNlcnQgPSB1dGlsc18xLm1ha2VJbnNlcnQobmV3TWFwKTtcbiAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChtYXAsIHR5cGUpIHtcbiAgICAgICAgICAgIG1hcC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgZWxtKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5ib2R5LmNvbnRhaW5zKGVsbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1YiA9IHZhbHVlLnN1YiwgZGVzdGluYXRpb25fMSA9IHZhbHVlLmRlc3RpbmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3ViKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbWVudEZpbmRlciA9IG5ldyBFbGVtZW50RmluZGVyXzEuRWxlbWVudEZpbmRlcihkZXN0aW5hdGlvbl8xLnNjb3BlQ2hlY2tlci5uYW1lc3BhY2UsIF90aGlzLmlzb2xhdGVNb2R1bGUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RWxtID0gZWxlbWVudEZpbmRlci5jYWxsKClbMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdTdWIgPSBmcm9tRXZlbnRfMS5mcm9tRXZlbnQobmV3RWxtLCB0eXBlLCBmYWxzZSwgZmFsc2UsIGRlc3RpbmF0aW9uXzEucGFzc2l2ZSkuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5vbkV2ZW50KHR5cGUsIGV2ZW50LCAhIWRlc3RpbmF0aW9uXzEucGFzc2l2ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0KHR5cGUsIG5ld0VsbSwgeyBzdWI6IG5ld1N1YiwgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uXzEgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnQodHlwZSwgZWxtLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBfdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycyA9IG5ld01hcDtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucHV0Tm9uQnViYmxpbmdMaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGVsbSwgdXNlQ2FwdHVyZSwgcGFzc2l2ZSkge1xuICAgICAgICB2YXIgbWFwID0gdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5nZXQoZXZlbnRUeXBlKTtcbiAgICAgICAgaWYgKCFtYXApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGlzdGVuZXIgPSBtYXAuZ2V0KGVsbSk7XG4gICAgICAgIGlmIChsaXN0ZW5lciAmJlxuICAgICAgICAgICAgbGlzdGVuZXIuZGVzdGluYXRpb24ucGFzc2l2ZSA9PT0gcGFzc2l2ZSAmJlxuICAgICAgICAgICAgbGlzdGVuZXIuZGVzdGluYXRpb24udXNlQ2FwdHVyZSA9PT0gdXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgdGhpcy52aXJ0dWFsTm9uQnViYmxpbmdMaXN0ZW5lclswXSA9IGxpc3RlbmVyLmRlc3RpbmF0aW9uO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUub25FdmVudCA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGV2ZW50LCBwYXNzaXZlLCBidWJibGVzKSB7XG4gICAgICAgIGlmIChidWJibGVzID09PSB2b2lkIDApIHsgYnViYmxlcyA9IHRydWU7IH1cbiAgICAgICAgdmFyIGN5Y2xlRXZlbnQgPSB0aGlzLnBhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICB2YXIgcm9vdEVsZW1lbnQgPSB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0Um9vdEVsZW1lbnQoZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgaWYgKGJ1YmJsZXMpIHtcbiAgICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0TmFtZXNwYWNlKGV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICBpZiAoIW5hbWVzcGFjZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldFZpcnR1YWxMaXN0ZW5lcnMoZXZlbnRUeXBlLCBuYW1lc3BhY2UpO1xuICAgICAgICAgICAgdGhpcy5idWJibGUoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIHJvb3RFbGVtZW50LCBjeWNsZUV2ZW50LCBsaXN0ZW5lcnMsIG5hbWVzcGFjZSwgbmFtZXNwYWNlLmxlbmd0aCAtIDEsIHRydWUsIHBhc3NpdmUpO1xuICAgICAgICAgICAgdGhpcy5idWJibGUoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIHJvb3RFbGVtZW50LCBjeWNsZUV2ZW50LCBsaXN0ZW5lcnMsIG5hbWVzcGFjZSwgbmFtZXNwYWNlLmxlbmd0aCAtIDEsIGZhbHNlLCBwYXNzaXZlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHV0Tm9uQnViYmxpbmdMaXN0ZW5lcihldmVudFR5cGUsIGV2ZW50LnRhcmdldCwgdHJ1ZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICB0aGlzLmRvQnViYmxlU3RlcChldmVudFR5cGUsIGV2ZW50LnRhcmdldCwgcm9vdEVsZW1lbnQsIGN5Y2xlRXZlbnQsIHRoaXMudmlydHVhbE5vbkJ1YmJsaW5nTGlzdGVuZXIsIHRydWUsIHBhc3NpdmUpO1xuICAgICAgICAgICAgdGhpcy5wdXROb25CdWJibGluZ0xpc3RlbmVyKGV2ZW50VHlwZSwgZXZlbnQudGFyZ2V0LCBmYWxzZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICB0aGlzLmRvQnViYmxlU3RlcChldmVudFR5cGUsIGV2ZW50LnRhcmdldCwgcm9vdEVsZW1lbnQsIGN5Y2xlRXZlbnQsIHRoaXMudmlydHVhbE5vbkJ1YmJsaW5nTGlzdGVuZXIsIGZhbHNlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyAvL2ZpeCByZXNldCBldmVudCAoc3BlYydlZCBhcyBub24tYnViYmxpbmcsIGJ1dCBidWJibGVzIGluIHJlYWxpdHlcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLmJ1YmJsZSA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGVsbSwgcm9vdEVsZW1lbnQsIGV2ZW50LCBsaXN0ZW5lcnMsIG5hbWVzcGFjZSwgaW5kZXgsIHVzZUNhcHR1cmUsIHBhc3NpdmUpIHtcbiAgICAgICAgaWYgKCF1c2VDYXB0dXJlICYmICFldmVudC5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkKSB7XG4gICAgICAgICAgICB0aGlzLmRvQnViYmxlU3RlcChldmVudFR5cGUsIGVsbSwgcm9vdEVsZW1lbnQsIGV2ZW50LCBsaXN0ZW5lcnMsIHVzZUNhcHR1cmUsIHBhc3NpdmUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZXdSb290ID0gcm9vdEVsZW1lbnQ7XG4gICAgICAgIHZhciBuZXdJbmRleCA9IGluZGV4O1xuICAgICAgICBpZiAoZWxtID09PSByb290RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGluZGV4ID49IDAgJiYgbmFtZXNwYWNlW2luZGV4XS50eXBlID09PSAnc2libGluZycpIHtcbiAgICAgICAgICAgICAgICBuZXdSb290ID0gdGhpcy5pc29sYXRlTW9kdWxlLmdldEVsZW1lbnQobmFtZXNwYWNlLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgbmV3SW5kZXgtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZWxtLnBhcmVudE5vZGUgJiYgbmV3Um9vdCkge1xuICAgICAgICAgICAgdGhpcy5idWJibGUoZXZlbnRUeXBlLCBlbG0ucGFyZW50Tm9kZSwgbmV3Um9vdCwgZXZlbnQsIGxpc3RlbmVycywgbmFtZXNwYWNlLCBuZXdJbmRleCwgdXNlQ2FwdHVyZSwgcGFzc2l2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZUNhcHR1cmUgJiYgIWV2ZW50LnByb3BhZ2F0aW9uSGFzQmVlblN0b3BwZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZG9CdWJibGVTdGVwKGV2ZW50VHlwZSwgZWxtLCByb290RWxlbWVudCwgZXZlbnQsIGxpc3RlbmVycywgdXNlQ2FwdHVyZSwgcGFzc2l2ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5kb0J1YmJsZVN0ZXAgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBlbG0sIHJvb3RFbGVtZW50LCBldmVudCwgbGlzdGVuZXJzLCB1c2VDYXB0dXJlLCBwYXNzaXZlKSB7XG4gICAgICAgIGlmICghcm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm11dGF0ZUV2ZW50Q3VycmVudFRhcmdldChldmVudCwgZWxtKTtcbiAgICAgICAgbGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgICAgIGlmIChkZXN0LnBhc3NpdmUgPT09IHBhc3NpdmUgJiYgZGVzdC51c2VDYXB0dXJlID09PSB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlbCA9IHV0aWxzXzEuZ2V0U2VsZWN0b3JzKGRlc3Quc2NvcGVDaGVja2VyLm5hbWVzcGFjZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFldmVudC5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkICYmXG4gICAgICAgICAgICAgICAgICAgIGRlc3Quc2NvcGVDaGVja2VyLmlzRGlyZWN0bHlJblNjb3BlKGVsbSkgJiZcbiAgICAgICAgICAgICAgICAgICAgKChzZWwgIT09ICcnICYmIGVsbS5tYXRjaGVzKHNlbCkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoc2VsID09PSAnJyAmJiBlbG0gPT09IHJvb3RFbGVtZW50KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbUV2ZW50XzEucHJldmVudERlZmF1bHRDb25kaXRpb25hbChldmVudCwgZGVzdC5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgICAgICAgICAgICAgIGRlc3Quc3ViamVjdC5zaGFtZWZ1bGx5U2VuZE5leHQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucGF0Y2hFdmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgcEV2ZW50ID0gZXZlbnQ7XG4gICAgICAgIHBFdmVudC5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkID0gZmFsc2U7XG4gICAgICAgIHZhciBvbGRTdG9wUHJvcGFnYXRpb24gPSBwRXZlbnQuc3RvcFByb3BhZ2F0aW9uO1xuICAgICAgICBwRXZlbnQuc3RvcFByb3BhZ2F0aW9uID0gZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uKCkge1xuICAgICAgICAgICAgb2xkU3RvcFByb3BhZ2F0aW9uLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB0aGlzLnByb3BhZ2F0aW9uSGFzQmVlblN0b3BwZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcEV2ZW50O1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLm11dGF0ZUV2ZW50Q3VycmVudFRhcmdldCA9IGZ1bmN0aW9uIChldmVudCwgY3VycmVudFRhcmdldEVsZW1lbnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShldmVudCwgXCJjdXJyZW50VGFyZ2V0XCIsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogY3VycmVudFRhcmdldEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwbGVhc2UgdXNlIGV2ZW50Lm93bmVyVGFyZ2V0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50Lm93bmVyVGFyZ2V0ID0gY3VycmVudFRhcmdldEVsZW1lbnQ7XG4gICAgfTtcbiAgICByZXR1cm4gRXZlbnREZWxlZ2F0b3I7XG59KCkpO1xuZXhwb3J0cy5FdmVudERlbGVnYXRvciA9IEV2ZW50RGVsZWdhdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RXZlbnREZWxlZ2F0b3IuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIFN5bWJvbFRyZWVfMSA9IHJlcXVpcmUoXCIuL1N5bWJvbFRyZWVcIik7XG52YXIgSXNvbGF0ZU1vZHVsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJc29sYXRlTW9kdWxlKCkge1xuICAgICAgICB0aGlzLm5hbWVzcGFjZVRyZWUgPSBuZXcgU3ltYm9sVHJlZV8xLmRlZmF1bHQoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHguc2NvcGU7IH0pO1xuICAgICAgICB0aGlzLm5hbWVzcGFjZUJ5RWxlbWVudCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy52bm9kZXNCZWluZ1JlbW92ZWQgPSBbXTtcbiAgICB9XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuc2V0RXZlbnREZWxlZ2F0b3IgPSBmdW5jdGlvbiAoZGVsKSB7XG4gICAgICAgIHRoaXMuZXZlbnREZWxlZ2F0b3IgPSBkZWw7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5pbnNlcnRFbGVtZW50ID0gZnVuY3Rpb24gKG5hbWVzcGFjZSwgZWwpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQuc2V0KGVsLCBuYW1lc3BhY2UpO1xuICAgICAgICB0aGlzLm5hbWVzcGFjZVRyZWUuc2V0KG5hbWVzcGFjZSwgZWwpO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUucmVtb3ZlRWxlbWVudCA9IGZ1bmN0aW9uIChlbG0pIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQuZGVsZXRlKGVsbSk7XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSB0aGlzLmdldE5hbWVzcGFjZShlbG0pO1xuICAgICAgICBpZiAobmFtZXNwYWNlKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWVzcGFjZVRyZWUuZGVsZXRlKG5hbWVzcGFjZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmdldEVsZW1lbnQgPSBmdW5jdGlvbiAobmFtZXNwYWNlLCBtYXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlVHJlZS5nZXQobmFtZXNwYWNlLCB1bmRlZmluZWQsIG1heCk7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5nZXRSb290RWxlbWVudCA9IGZ1bmN0aW9uIChlbG0pIHtcbiAgICAgICAgaWYgKHRoaXMubmFtZXNwYWNlQnlFbGVtZW50LmhhcyhlbG0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxtO1xuICAgICAgICB9XG4gICAgICAgIC8vVE9ETzogQWRkIHF1aWNrLWxydSBvciBzaW1pbGFyIGFzIGFkZGl0aW9uYWwgTygxKSBjYWNoZVxuICAgICAgICB2YXIgY3VyciA9IGVsbTtcbiAgICAgICAgd2hpbGUgKCF0aGlzLm5hbWVzcGFjZUJ5RWxlbWVudC5oYXMoY3VycikpIHtcbiAgICAgICAgICAgIGN1cnIgPSBjdXJyLnBhcmVudE5vZGU7XG4gICAgICAgICAgICBpZiAoIWN1cnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY3Vyci50YWdOYW1lID09PSAnSFRNTCcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJvb3QgZWxlbWVudCBmb3VuZCwgdGhpcyBzaG91bGQgbm90IGhhcHBlbiBhdCBhbGwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycjtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChlbG0pIHtcbiAgICAgICAgdmFyIHJvb3RFbGVtZW50ID0gdGhpcy5nZXRSb290RWxlbWVudChlbG0pO1xuICAgICAgICBpZiAoIXJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWVzcGFjZUJ5RWxlbWVudC5nZXQocm9vdEVsZW1lbnQpO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuY3JlYXRlTW9kdWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChlbXB0eVZOb2RlLCB2Tm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBlbG0gPSB2Tm9kZS5lbG0sIF9hID0gdk5vZGUuZGF0YSwgZGF0YSA9IF9hID09PSB2b2lkIDAgPyB7fSA6IF9hO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSBkYXRhLmlzb2xhdGU7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobmFtZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmluc2VydEVsZW1lbnQobmFtZXNwYWNlLCBlbG0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uIChvbGRWTm9kZSwgdk5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkRWxtID0gb2xkVk5vZGUuZWxtLCBfYSA9IG9sZFZOb2RlLmRhdGEsIG9sZERhdGEgPSBfYSA9PT0gdm9pZCAwID8ge30gOiBfYTtcbiAgICAgICAgICAgICAgICB2YXIgZWxtID0gdk5vZGUuZWxtLCBfYiA9IHZOb2RlLmRhdGEsIGRhdGEgPSBfYiA9PT0gdm9pZCAwID8ge30gOiBfYjtcbiAgICAgICAgICAgICAgICB2YXIgb2xkTmFtZXNwYWNlID0gb2xkRGF0YS5pc29sYXRlO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSBkYXRhLmlzb2xhdGU7XG4gICAgICAgICAgICAgICAgaWYgKCF1dGlsc18xLmlzRXF1YWxOYW1lc3BhY2Uob2xkTmFtZXNwYWNlLCBuYW1lc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9sZE5hbWVzcGFjZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlRWxlbWVudChvbGRFbG0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5hbWVzcGFjZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbnNlcnRFbGVtZW50KG5hbWVzcGFjZSwgZWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24gKHZOb2RlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQucHVzaCh2Tm9kZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAodk5vZGUsIGNiKSB7XG4gICAgICAgICAgICAgICAgc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQucHVzaCh2Tm9kZSk7XG4gICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3N0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZub2Rlc0JlaW5nUmVtb3ZlZCA9IHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSB2bm9kZXNCZWluZ1JlbW92ZWQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZub2RlID0gdm5vZGVzQmVpbmdSZW1vdmVkW2ldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gdm5vZGUuZGF0YSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHZub2RlLmRhdGEuaXNvbGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVzcGFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUVsZW1lbnQobmFtZXNwYWNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZWxmLmV2ZW50RGVsZWdhdG9yLnJlbW92ZUVsZW1lbnQodm5vZGUuZWxtLCBuYW1lc3BhY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLnZub2Rlc0JlaW5nUmVtb3ZlZCA9IFtdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIHJldHVybiBJc29sYXRlTW9kdWxlO1xufSgpKTtcbmV4cG9ydHMuSXNvbGF0ZU1vZHVsZSA9IElzb2xhdGVNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Jc29sYXRlTW9kdWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgRG9jdW1lbnRET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL0RvY3VtZW50RE9NU291cmNlXCIpO1xudmFyIEJvZHlET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL0JvZHlET01Tb3VyY2VcIik7XG52YXIgRWxlbWVudEZpbmRlcl8xID0gcmVxdWlyZShcIi4vRWxlbWVudEZpbmRlclwiKTtcbnZhciBpc29sYXRlXzEgPSByZXF1aXJlKFwiLi9pc29sYXRlXCIpO1xudmFyIE1haW5ET01Tb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTWFpbkRPTVNvdXJjZShfcm9vdEVsZW1lbnQkLCBfc2FuaXRhdGlvbiQsIF9uYW1lc3BhY2UsIF9pc29sYXRlTW9kdWxlLCBfZXZlbnREZWxlZ2F0b3IsIF9uYW1lKSB7XG4gICAgICAgIGlmIChfbmFtZXNwYWNlID09PSB2b2lkIDApIHsgX25hbWVzcGFjZSA9IFtdOyB9XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50JCA9IF9yb290RWxlbWVudCQ7XG4gICAgICAgIHRoaXMuX3Nhbml0YXRpb24kID0gX3Nhbml0YXRpb24kO1xuICAgICAgICB0aGlzLl9uYW1lc3BhY2UgPSBfbmFtZXNwYWNlO1xuICAgICAgICB0aGlzLl9pc29sYXRlTW9kdWxlID0gX2lzb2xhdGVNb2R1bGU7XG4gICAgICAgIHRoaXMuX2V2ZW50RGVsZWdhdG9yID0gX2V2ZW50RGVsZWdhdG9yO1xuICAgICAgICB0aGlzLl9uYW1lID0gX25hbWU7XG4gICAgICAgIHRoaXMuaXNvbGF0ZVNvdXJjZSA9IGZ1bmN0aW9uIChzb3VyY2UsIHNjb3BlKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1haW5ET01Tb3VyY2Uoc291cmNlLl9yb290RWxlbWVudCQsIHNvdXJjZS5fc2FuaXRhdGlvbiQsIHNvdXJjZS5fbmFtZXNwYWNlLmNvbmNhdChpc29sYXRlXzEuZ2V0U2NvcGVPYmooc2NvcGUpKSwgc291cmNlLl9pc29sYXRlTW9kdWxlLCBzb3VyY2UuX2V2ZW50RGVsZWdhdG9yLCBzb3VyY2UuX25hbWUpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmlzb2xhdGVTaW5rID0gaXNvbGF0ZV8xLm1ha2VJc29sYXRlU2luayh0aGlzLl9uYW1lc3BhY2UpO1xuICAgIH1cbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5fZWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9uYW1lc3BhY2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcm9vdEVsZW1lbnQkLm1hcChmdW5jdGlvbiAoeCkgeyByZXR1cm4gW3hdOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50RmluZGVyXzEgPSBuZXcgRWxlbWVudEZpbmRlcl8xLkVsZW1lbnRGaW5kZXIodGhpcy5fbmFtZXNwYWNlLCB0aGlzLl9pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yb290RWxlbWVudCQubWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGVsZW1lbnRGaW5kZXJfMS5jYWxsKCk7IH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQodGhpcy5fZWxlbWVudHMoKS5yZW1lbWJlcigpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHRoaXMuX2VsZW1lbnRzKClcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGFycikgeyByZXR1cm4gYXJyLmxlbmd0aCA+IDA7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChhcnIpIHsgcmV0dXJuIGFyclswXTsgfSlcbiAgICAgICAgICAgIC5yZW1lbWJlcigpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNYWluRE9NU291cmNlLnByb3RvdHlwZSwgXCJuYW1lc3BhY2VcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9uYW1lc3BhY2U7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRE9NIGRyaXZlcidzIHNlbGVjdCgpIGV4cGVjdHMgdGhlIGFyZ3VtZW50IHRvIGJlIGEgXCIgK1xuICAgICAgICAgICAgICAgIFwic3RyaW5nIGFzIGEgQ1NTIHNlbGVjdG9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3RvciA9PT0gJ2RvY3VtZW50Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEb2N1bWVudERPTVNvdXJjZV8xLkRvY3VtZW50RE9NU291cmNlKHRoaXMuX25hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3RvciA9PT0gJ2JvZHknKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJvZHlET01Tb3VyY2VfMS5Cb2R5RE9NU291cmNlKHRoaXMuX25hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSBzZWxlY3RvciA9PT0gJzpyb290J1xuICAgICAgICAgICAgPyBbXVxuICAgICAgICAgICAgOiB0aGlzLl9uYW1lc3BhY2UuY29uY2F0KHsgdHlwZTogJ3NlbGVjdG9yJywgc2NvcGU6IHNlbGVjdG9yLnRyaW0oKSB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBNYWluRE9NU291cmNlKHRoaXMuX3Jvb3RFbGVtZW50JCwgdGhpcy5fc2FuaXRhdGlvbiQsIG5hbWVzcGFjZSwgdGhpcy5faXNvbGF0ZU1vZHVsZSwgdGhpcy5fZXZlbnREZWxlZ2F0b3IsIHRoaXMuX25hbWUpO1xuICAgIH07XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucywgYnViYmxlcykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50VHlwZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRE9NIGRyaXZlcidzIGV2ZW50cygpIGV4cGVjdHMgYXJndW1lbnQgdG8gYmUgYSBcIiArXG4gICAgICAgICAgICAgICAgXCJzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBldmVudCB0eXBlIHRvIGxpc3RlbiBmb3IuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBldmVudCQgPSB0aGlzLl9ldmVudERlbGVnYXRvci5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5fbmFtZXNwYWNlLCBvcHRpb25zLCBidWJibGVzKTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoZXZlbnQkKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX3Nhbml0YXRpb24kLnNoYW1lZnVsbHlTZW5kTmV4dChudWxsKTtcbiAgICAgICAgLy90aGlzLl9pc29sYXRlTW9kdWxlLnJlc2V0KCk7XG4gICAgfTtcbiAgICByZXR1cm4gTWFpbkRPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLk1haW5ET01Tb3VyY2UgPSBNYWluRE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TWFpbkRPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBQcmlvcml0eVF1ZXVlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFByaW9yaXR5UXVldWUoKSB7XG4gICAgICAgIHRoaXMuYXJyID0gW107XG4gICAgICAgIHRoaXMucHJpb3MgPSBbXTtcbiAgICB9XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHQsIHByaW8pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJpb3NbaV0gPCBwcmlvKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcnIuc3BsaWNlKGksIDAsIHQpO1xuICAgICAgICAgICAgICAgIHRoaXMucHJpb3Muc3BsaWNlKGksIDAsIHByaW8pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFyci5wdXNoKHQpO1xuICAgICAgICB0aGlzLnByaW9zLnB1c2gocHJpbyk7XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZih0aGlzLmFycltpXSwgaSwgdGhpcy5hcnIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5hcnJbaV0gPT09IHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFyci5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmlvcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gUHJpb3JpdHlRdWV1ZTtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBQcmlvcml0eVF1ZXVlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UHJpb3JpdHlRdWV1ZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBSZW1vdmFsU2V0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlbW92YWxTZXQoKSB7XG4gICAgICAgIHRoaXMudG9EZWxldGUgPSBbXTtcbiAgICAgICAgdGhpcy50b0RlbGV0ZVNpemUgPSAwO1xuICAgICAgICB0aGlzLl9zZXQgPSBuZXcgU2V0KCk7XG4gICAgfVxuICAgIFJlbW92YWxTZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHRoaXMuX3NldC5hZGQodCk7XG4gICAgfTtcbiAgICBSZW1vdmFsU2V0LnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5fc2V0LmZvckVhY2goZik7XG4gICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICB9O1xuICAgIFJlbW92YWxTZXQucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIGlmICh0aGlzLnRvRGVsZXRlLmxlbmd0aCA9PT0gdGhpcy50b0RlbGV0ZVNpemUpIHtcbiAgICAgICAgICAgIHRoaXMudG9EZWxldGUucHVzaCh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudG9EZWxldGVbdGhpcy50b0RlbGV0ZVNpemVdID0gdDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRvRGVsZXRlU2l6ZSsrO1xuICAgIH07XG4gICAgUmVtb3ZhbFNldC5wcm90b3R5cGUuZmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50b0RlbGV0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPCB0aGlzLnRvRGVsZXRlU2l6ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldC5kZWxldGUodGhpcy50b0RlbGV0ZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnRvRGVsZXRlW2ldID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudG9EZWxldGVTaXplID0gMDtcbiAgICB9O1xuICAgIHJldHVybiBSZW1vdmFsU2V0O1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IFJlbW92YWxTZXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1SZW1vdmFsU2V0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBTY29wZUNoZWNrZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2NvcGVDaGVja2VyKG5hbWVzcGFjZSwgaXNvbGF0ZU1vZHVsZSkge1xuICAgICAgICB0aGlzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlID0gaXNvbGF0ZU1vZHVsZTtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gbmFtZXNwYWNlLmZpbHRlcihmdW5jdGlvbiAobikgeyByZXR1cm4gbi50eXBlICE9PSAnc2VsZWN0b3InOyB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGVsZW1lbnQgaXMgKmRpcmVjdGx5KiBpbiB0aGUgc2NvcGUgb2YgdGhpc1xuICAgICAqIHNjb3BlIGNoZWNrZXIuIEJlaW5nIGNvbnRhaW5lZCAqaW5kaXJlY3RseSogdGhyb3VnaCBvdGhlciBzY29wZXNcbiAgICAgKiBpcyBub3QgdmFsaWQuIFRoaXMgaXMgY3J1Y2lhbCBmb3IgaW1wbGVtZW50aW5nIHBhcmVudC1jaGlsZCBpc29sYXRpb24sXG4gICAgICogc28gdGhhdCB0aGUgcGFyZW50IHNlbGVjdG9ycyBkb24ndCBzZWFyY2ggaW5zaWRlIGEgY2hpbGQgc2NvcGUuXG4gICAgICovXG4gICAgU2NvcGVDaGVja2VyLnByb3RvdHlwZS5pc0RpcmVjdGx5SW5TY29wZSA9IGZ1bmN0aW9uIChsZWFmKSB7XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0TmFtZXNwYWNlKGxlYWYpO1xuICAgICAgICBpZiAoIW5hbWVzcGFjZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9uYW1lc3BhY2UubGVuZ3RoID4gbmFtZXNwYWNlLmxlbmd0aCB8fFxuICAgICAgICAgICAgIXV0aWxzXzEuaXNFcXVhbE5hbWVzcGFjZSh0aGlzLl9uYW1lc3BhY2UsIG5hbWVzcGFjZS5zbGljZSgwLCB0aGlzLl9uYW1lc3BhY2UubGVuZ3RoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5fbmFtZXNwYWNlLmxlbmd0aDsgaSA8IG5hbWVzcGFjZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKG5hbWVzcGFjZVtpXS50eXBlID09PSAndG90YWwnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgcmV0dXJuIFNjb3BlQ2hlY2tlcjtcbn0oKSk7XG5leHBvcnRzLlNjb3BlQ2hlY2tlciA9IFNjb3BlQ2hlY2tlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNjb3BlQ2hlY2tlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTeW1ib2xUcmVlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN5bWJvbFRyZWUobWFwcGVyKSB7XG4gICAgICAgIHRoaXMubWFwcGVyID0gbWFwcGVyO1xuICAgICAgICB0aGlzLnRyZWUgPSBbdW5kZWZpbmVkLCB7fV07XG4gICAgfVxuICAgIFN5bWJvbFRyZWUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChwYXRoLCBlbGVtZW50LCBtYXgpIHtcbiAgICAgICAgdmFyIGN1cnIgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBfbWF4ID0gbWF4ICE9PSB1bmRlZmluZWQgPyBtYXggOiBwYXRoLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfbWF4OyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5tYXBwZXIocGF0aFtpXSk7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjdXJyWzFdW25dO1xuICAgICAgICAgICAgaWYgKCFjaGlsZCkge1xuICAgICAgICAgICAgICAgIGNoaWxkID0gW3VuZGVmaW5lZCwge31dO1xuICAgICAgICAgICAgICAgIGN1cnJbMV1bbl0gPSBjaGlsZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnIgPSBjaGlsZDtcbiAgICAgICAgfVxuICAgICAgICBjdXJyWzBdID0gZWxlbWVudDtcbiAgICB9O1xuICAgIFN5bWJvbFRyZWUucHJvdG90eXBlLmdldERlZmF1bHQgPSBmdW5jdGlvbiAocGF0aCwgbWtEZWZhdWx0RWxlbWVudCwgbWF4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldChwYXRoLCBta0RlZmF1bHRFbGVtZW50LCBtYXgpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGF5bG9hZCBvZiB0aGUgcGF0aFxuICAgICAqIElmIGEgZGVmYXVsdCBlbGVtZW50IGNyZWF0b3IgaXMgZ2l2ZW4sIGl0IHdpbGwgaW5zZXJ0IGl0IGF0IHRoZSBwYXRoXG4gICAgICovXG4gICAgU3ltYm9sVHJlZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKHBhdGgsIG1rRGVmYXVsdEVsZW1lbnQsIG1heCkge1xuICAgICAgICB2YXIgY3VyciA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIF9tYXggPSBtYXggIT09IHVuZGVmaW5lZCA/IG1heCA6IHBhdGgubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IF9tYXg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLm1hcHBlcihwYXRoW2ldKTtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGN1cnJbMV1bbl07XG4gICAgICAgICAgICBpZiAoIWNoaWxkKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1rRGVmYXVsdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBbdW5kZWZpbmVkLCB7fV07XG4gICAgICAgICAgICAgICAgICAgIGN1cnJbMV1bbl0gPSBjaGlsZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VyciA9IGNoaWxkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChta0RlZmF1bHRFbGVtZW50ICYmICFjdXJyWzBdKSB7XG4gICAgICAgICAgICBjdXJyWzBdID0gbWtEZWZhdWx0RWxlbWVudCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyWzBdO1xuICAgIH07XG4gICAgU3ltYm9sVHJlZS5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgdmFyIGN1cnIgPSB0aGlzLnRyZWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGN1cnJbMV1bdGhpcy5tYXBwZXIocGF0aFtpXSldO1xuICAgICAgICAgICAgaWYgKCFjaGlsZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnIgPSBjaGlsZDtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgY3VyclsxXVt0aGlzLm1hcHBlcihwYXRoW3BhdGgubGVuZ3RoIC0gMV0pXTtcbiAgICB9O1xuICAgIHJldHVybiBTeW1ib2xUcmVlO1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IFN5bWJvbFRyZWU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TeW1ib2xUcmVlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwic25hYmJkb20vdm5vZGVcIik7XG52YXIgaF8xID0gcmVxdWlyZShcInNuYWJiZG9tL2hcIik7XG52YXIgc25hYmJkb21fc2VsZWN0b3JfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS1zZWxlY3RvclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgVk5vZGVXcmFwcGVyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFZOb2RlV3JhcHBlcihyb290RWxlbWVudCkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdEVsZW1lbnQ7XG4gICAgfVxuICAgIFZOb2RlV3JhcHBlci5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uICh2bm9kZSkge1xuICAgICAgICBpZiAodXRpbHNfMS5pc0RvY0ZyYWcodGhpcy5yb290RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndyYXBEb2NGcmFnKHZub2RlID09PSBudWxsID8gW10gOiBbdm5vZGVdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodm5vZGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndyYXAoW10pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBfYSA9IHNuYWJiZG9tX3NlbGVjdG9yXzEuc2VsZWN0b3JQYXJzZXIodm5vZGUpLCBzZWxUYWdOYW1lID0gX2EudGFnTmFtZSwgc2VsSWQgPSBfYS5pZDtcbiAgICAgICAgdmFyIHZOb2RlQ2xhc3NOYW1lID0gc25hYmJkb21fc2VsZWN0b3JfMS5jbGFzc05hbWVGcm9tVk5vZGUodm5vZGUpO1xuICAgICAgICB2YXIgdk5vZGVEYXRhID0gdm5vZGUuZGF0YSB8fCB7fTtcbiAgICAgICAgdmFyIHZOb2RlRGF0YVByb3BzID0gdk5vZGVEYXRhLnByb3BzIHx8IHt9O1xuICAgICAgICB2YXIgX2IgPSB2Tm9kZURhdGFQcm9wcy5pZCwgdk5vZGVJZCA9IF9iID09PSB2b2lkIDAgPyBzZWxJZCA6IF9iO1xuICAgICAgICB2YXIgaXNWTm9kZUFuZFJvb3RFbGVtZW50SWRlbnRpY2FsID0gdHlwZW9mIHZOb2RlSWQgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICB2Tm9kZUlkLnRvVXBwZXJDYXNlKCkgPT09IHRoaXMucm9vdEVsZW1lbnQuaWQudG9VcHBlckNhc2UoKSAmJlxuICAgICAgICAgICAgc2VsVGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSB0aGlzLnJvb3RFbGVtZW50LnRhZ05hbWUudG9VcHBlckNhc2UoKSAmJlxuICAgICAgICAgICAgdk5vZGVDbGFzc05hbWUudG9VcHBlckNhc2UoKSA9PT0gdGhpcy5yb290RWxlbWVudC5jbGFzc05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKGlzVk5vZGVBbmRSb290RWxlbWVudElkZW50aWNhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoW3Zub2RlXSk7XG4gICAgfTtcbiAgICBWTm9kZVdyYXBwZXIucHJvdG90eXBlLndyYXBEb2NGcmFnID0gZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLnZub2RlKCcnLCB7IGlzb2xhdGU6IFtdIH0sIGNoaWxkcmVuLCB1bmRlZmluZWQsIHRoaXNcbiAgICAgICAgICAgIC5yb290RWxlbWVudCk7XG4gICAgfTtcbiAgICBWTm9kZVdyYXBwZXIucHJvdG90eXBlLndyYXAgPSBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICAgICAgdmFyIF9hID0gdGhpcy5yb290RWxlbWVudCwgdGFnTmFtZSA9IF9hLnRhZ05hbWUsIGlkID0gX2EuaWQsIGNsYXNzTmFtZSA9IF9hLmNsYXNzTmFtZTtcbiAgICAgICAgdmFyIHNlbElkID0gaWQgPyBcIiNcIiArIGlkIDogJyc7XG4gICAgICAgIHZhciBzZWxDbGFzcyA9IGNsYXNzTmFtZSA/IFwiLlwiICsgY2xhc3NOYW1lLnNwbGl0KFwiIFwiKS5qb2luKFwiLlwiKSA6ICcnO1xuICAgICAgICB2YXIgdm5vZGUgPSBoXzEuaChcIlwiICsgdGFnTmFtZS50b0xvd2VyQ2FzZSgpICsgc2VsSWQgKyBzZWxDbGFzcywge30sIGNoaWxkcmVuKTtcbiAgICAgICAgdm5vZGUuZGF0YSA9IHZub2RlLmRhdGEgfHwge307XG4gICAgICAgIHZub2RlLmRhdGEuaXNvbGF0ZSA9IHZub2RlLmRhdGEuaXNvbGF0ZSB8fCBbXTtcbiAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgIH07XG4gICAgcmV0dXJuIFZOb2RlV3JhcHBlcjtcbn0oKSk7XG5leHBvcnRzLlZOb2RlV3JhcHBlciA9IFZOb2RlV3JhcHBlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVZOb2RlV3JhcHBlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbmZ1bmN0aW9uIGZyb21FdmVudChlbGVtZW50LCBldmVudE5hbWUsIHVzZUNhcHR1cmUsIHByZXZlbnREZWZhdWx0LCBwYXNzaXZlKSB7XG4gICAgaWYgKHVzZUNhcHR1cmUgPT09IHZvaWQgMCkgeyB1c2VDYXB0dXJlID0gZmFsc2U7IH1cbiAgICBpZiAocHJldmVudERlZmF1bHQgPT09IHZvaWQgMCkgeyBwcmV2ZW50RGVmYXVsdCA9IGZhbHNlOyB9XG4gICAgaWYgKHBhc3NpdmUgPT09IHZvaWQgMCkgeyBwYXNzaXZlID0gZmFsc2U7IH1cbiAgICB2YXIgbmV4dCA9IG51bGw7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5TdHJlYW0uY3JlYXRlKHtcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIHN0YXJ0KGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICBuZXh0ID0gZnVuY3Rpb24gX25leHQoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldmVudERlZmF1bHRDb25kaXRpb25hbChldmVudCwgcHJldmVudERlZmF1bHQpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5uZXh0KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV4dCA9IGZ1bmN0aW9uIF9uZXh0KGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLm5leHQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBuZXh0LCB7XG4gICAgICAgICAgICAgICAgY2FwdHVyZTogdXNlQ2FwdHVyZSxcbiAgICAgICAgICAgICAgICBwYXNzaXZlOiBwYXNzaXZlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBuZXh0LCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cbmV4cG9ydHMuZnJvbUV2ZW50ID0gZnJvbUV2ZW50O1xuZnVuY3Rpb24gbWF0Y2hPYmplY3QobWF0Y2hlciwgb2JqKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtYXRjaGVyKTtcbiAgICB2YXIgbiA9IGtleXMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHZhciBrID0ga2V5c1tpXTtcbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyW2tdID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqW2tdID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKCFtYXRjaE9iamVjdChtYXRjaGVyW2tdLCBvYmpba10pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG1hdGNoZXJba10gIT09IG9ialtrXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gcHJldmVudERlZmF1bHRDb25kaXRpb25hbChldmVudCwgcHJldmVudERlZmF1bHQpIHtcbiAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcmV2ZW50RGVmYXVsdCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzUHJlZGljYXRlKHByZXZlbnREZWZhdWx0KSkge1xuICAgICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KGV2ZW50KSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHByZXZlbnREZWZhdWx0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKG1hdGNoT2JqZWN0KHByZXZlbnREZWZhdWx0LCBldmVudCkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcmV2ZW50RGVmYXVsdCBoYXMgdG8gYmUgZWl0aGVyIGEgYm9vbGVhbiwgcHJlZGljYXRlIGZ1bmN0aW9uIG9yIG9iamVjdCcpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5wcmV2ZW50RGVmYXVsdENvbmRpdGlvbmFsID0gcHJldmVudERlZmF1bHRDb25kaXRpb25hbDtcbmZ1bmN0aW9uIGlzUHJlZGljYXRlKGZuKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZyb21FdmVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8vIHRzbGludDpkaXNhYmxlOm1heC1maWxlLWxpbmUtY291bnRcbnZhciBoXzEgPSByZXF1aXJlKFwic25hYmJkb20vaFwiKTtcbmZ1bmN0aW9uIGlzVmFsaWRTdHJpbmcocGFyYW0pIHtcbiAgICByZXR1cm4gdHlwZW9mIHBhcmFtID09PSAnc3RyaW5nJyAmJiBwYXJhbS5sZW5ndGggPiAwO1xufVxuZnVuY3Rpb24gaXNTZWxlY3RvcihwYXJhbSkge1xuICAgIHJldHVybiBpc1ZhbGlkU3RyaW5nKHBhcmFtKSAmJiAocGFyYW1bMF0gPT09ICcuJyB8fCBwYXJhbVswXSA9PT0gJyMnKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRhZ0Z1bmN0aW9uKHRhZ05hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaHlwZXJzY3JpcHQoYSwgYiwgYykge1xuICAgICAgICB2YXIgaGFzQSA9IHR5cGVvZiBhICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgdmFyIGhhc0IgPSB0eXBlb2YgYiAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIHZhciBoYXNDID0gdHlwZW9mIGMgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICBpZiAoaXNTZWxlY3RvcihhKSkge1xuICAgICAgICAgICAgaWYgKGhhc0IgJiYgaGFzQykge1xuICAgICAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwgYiwgYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChoYXNCKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCBiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGhhc0MpIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwgYiwgYyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaGFzQikge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUsIGEsIGIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGhhc0EpIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lLCBhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lLCB7fSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxudmFyIFNWR19UQUdfTkFNRVMgPSBbXG4gICAgJ2EnLFxuICAgICdhbHRHbHlwaCcsXG4gICAgJ2FsdEdseXBoRGVmJyxcbiAgICAnYWx0R2x5cGhJdGVtJyxcbiAgICAnYW5pbWF0ZScsXG4gICAgJ2FuaW1hdGVDb2xvcicsXG4gICAgJ2FuaW1hdGVNb3Rpb24nLFxuICAgICdhbmltYXRlVHJhbnNmb3JtJyxcbiAgICAnY2lyY2xlJyxcbiAgICAnY2xpcFBhdGgnLFxuICAgICdjb2xvclByb2ZpbGUnLFxuICAgICdjdXJzb3InLFxuICAgICdkZWZzJyxcbiAgICAnZGVzYycsXG4gICAgJ2VsbGlwc2UnLFxuICAgICdmZUJsZW5kJyxcbiAgICAnZmVDb2xvck1hdHJpeCcsXG4gICAgJ2ZlQ29tcG9uZW50VHJhbnNmZXInLFxuICAgICdmZUNvbXBvc2l0ZScsXG4gICAgJ2ZlQ29udm9sdmVNYXRyaXgnLFxuICAgICdmZURpZmZ1c2VMaWdodGluZycsXG4gICAgJ2ZlRGlzcGxhY2VtZW50TWFwJyxcbiAgICAnZmVEaXN0YW50TGlnaHQnLFxuICAgICdmZUZsb29kJyxcbiAgICAnZmVGdW5jQScsXG4gICAgJ2ZlRnVuY0InLFxuICAgICdmZUZ1bmNHJyxcbiAgICAnZmVGdW5jUicsXG4gICAgJ2ZlR2F1c3NpYW5CbHVyJyxcbiAgICAnZmVJbWFnZScsXG4gICAgJ2ZlTWVyZ2UnLFxuICAgICdmZU1lcmdlTm9kZScsXG4gICAgJ2ZlTW9ycGhvbG9neScsXG4gICAgJ2ZlT2Zmc2V0JyxcbiAgICAnZmVQb2ludExpZ2h0JyxcbiAgICAnZmVTcGVjdWxhckxpZ2h0aW5nJyxcbiAgICAnZmVTcG90bGlnaHQnLFxuICAgICdmZVRpbGUnLFxuICAgICdmZVR1cmJ1bGVuY2UnLFxuICAgICdmaWx0ZXInLFxuICAgICdmb250JyxcbiAgICAnZm9udEZhY2UnLFxuICAgICdmb250RmFjZUZvcm1hdCcsXG4gICAgJ2ZvbnRGYWNlTmFtZScsXG4gICAgJ2ZvbnRGYWNlU3JjJyxcbiAgICAnZm9udEZhY2VVcmknLFxuICAgICdmb3JlaWduT2JqZWN0JyxcbiAgICAnZycsXG4gICAgJ2dseXBoJyxcbiAgICAnZ2x5cGhSZWYnLFxuICAgICdoa2VybicsXG4gICAgJ2ltYWdlJyxcbiAgICAnbGluZScsXG4gICAgJ2xpbmVhckdyYWRpZW50JyxcbiAgICAnbWFya2VyJyxcbiAgICAnbWFzaycsXG4gICAgJ21ldGFkYXRhJyxcbiAgICAnbWlzc2luZ0dseXBoJyxcbiAgICAnbXBhdGgnLFxuICAgICdwYXRoJyxcbiAgICAncGF0dGVybicsXG4gICAgJ3BvbHlnb24nLFxuICAgICdwb2x5bGluZScsXG4gICAgJ3JhZGlhbEdyYWRpZW50JyxcbiAgICAncmVjdCcsXG4gICAgJ3NjcmlwdCcsXG4gICAgJ3NldCcsXG4gICAgJ3N0b3AnLFxuICAgICdzdHlsZScsXG4gICAgJ3N3aXRjaCcsXG4gICAgJ3N5bWJvbCcsXG4gICAgJ3RleHQnLFxuICAgICd0ZXh0UGF0aCcsXG4gICAgJ3RpdGxlJyxcbiAgICAndHJlZicsXG4gICAgJ3RzcGFuJyxcbiAgICAndXNlJyxcbiAgICAndmlldycsXG4gICAgJ3ZrZXJuJyxcbl07XG52YXIgc3ZnID0gY3JlYXRlVGFnRnVuY3Rpb24oJ3N2ZycpO1xuU1ZHX1RBR19OQU1FUy5mb3JFYWNoKGZ1bmN0aW9uICh0YWcpIHtcbiAgICBzdmdbdGFnXSA9IGNyZWF0ZVRhZ0Z1bmN0aW9uKHRhZyk7XG59KTtcbnZhciBUQUdfTkFNRVMgPSBbXG4gICAgJ2EnLFxuICAgICdhYmJyJyxcbiAgICAnYWRkcmVzcycsXG4gICAgJ2FyZWEnLFxuICAgICdhcnRpY2xlJyxcbiAgICAnYXNpZGUnLFxuICAgICdhdWRpbycsXG4gICAgJ2InLFxuICAgICdiYXNlJyxcbiAgICAnYmRpJyxcbiAgICAnYmRvJyxcbiAgICAnYmxvY2txdW90ZScsXG4gICAgJ2JvZHknLFxuICAgICdicicsXG4gICAgJ2J1dHRvbicsXG4gICAgJ2NhbnZhcycsXG4gICAgJ2NhcHRpb24nLFxuICAgICdjaXRlJyxcbiAgICAnY29kZScsXG4gICAgJ2NvbCcsXG4gICAgJ2NvbGdyb3VwJyxcbiAgICAnZGQnLFxuICAgICdkZWwnLFxuICAgICdkZXRhaWxzJyxcbiAgICAnZGZuJyxcbiAgICAnZGlyJyxcbiAgICAnZGl2JyxcbiAgICAnZGwnLFxuICAgICdkdCcsXG4gICAgJ2VtJyxcbiAgICAnZW1iZWQnLFxuICAgICdmaWVsZHNldCcsXG4gICAgJ2ZpZ2NhcHRpb24nLFxuICAgICdmaWd1cmUnLFxuICAgICdmb290ZXInLFxuICAgICdmb3JtJyxcbiAgICAnaDEnLFxuICAgICdoMicsXG4gICAgJ2gzJyxcbiAgICAnaDQnLFxuICAgICdoNScsXG4gICAgJ2g2JyxcbiAgICAnaGVhZCcsXG4gICAgJ2hlYWRlcicsXG4gICAgJ2hncm91cCcsXG4gICAgJ2hyJyxcbiAgICAnaHRtbCcsXG4gICAgJ2knLFxuICAgICdpZnJhbWUnLFxuICAgICdpbWcnLFxuICAgICdpbnB1dCcsXG4gICAgJ2lucycsXG4gICAgJ2tiZCcsXG4gICAgJ2tleWdlbicsXG4gICAgJ2xhYmVsJyxcbiAgICAnbGVnZW5kJyxcbiAgICAnbGknLFxuICAgICdsaW5rJyxcbiAgICAnbWFpbicsXG4gICAgJ21hcCcsXG4gICAgJ21hcmsnLFxuICAgICdtZW51JyxcbiAgICAnbWV0YScsXG4gICAgJ25hdicsXG4gICAgJ25vc2NyaXB0JyxcbiAgICAnb2JqZWN0JyxcbiAgICAnb2wnLFxuICAgICdvcHRncm91cCcsXG4gICAgJ29wdGlvbicsXG4gICAgJ3AnLFxuICAgICdwYXJhbScsXG4gICAgJ3ByZScsXG4gICAgJ3Byb2dyZXNzJyxcbiAgICAncScsXG4gICAgJ3JwJyxcbiAgICAncnQnLFxuICAgICdydWJ5JyxcbiAgICAncycsXG4gICAgJ3NhbXAnLFxuICAgICdzY3JpcHQnLFxuICAgICdzZWN0aW9uJyxcbiAgICAnc2VsZWN0JyxcbiAgICAnc21hbGwnLFxuICAgICdzb3VyY2UnLFxuICAgICdzcGFuJyxcbiAgICAnc3Ryb25nJyxcbiAgICAnc3R5bGUnLFxuICAgICdzdWInLFxuICAgICdzdW1tYXJ5JyxcbiAgICAnc3VwJyxcbiAgICAndGFibGUnLFxuICAgICd0Ym9keScsXG4gICAgJ3RkJyxcbiAgICAndGV4dGFyZWEnLFxuICAgICd0Zm9vdCcsXG4gICAgJ3RoJyxcbiAgICAndGhlYWQnLFxuICAgICd0aW1lJyxcbiAgICAndGl0bGUnLFxuICAgICd0cicsXG4gICAgJ3UnLFxuICAgICd1bCcsXG4gICAgJ3ZpZGVvJyxcbl07XG52YXIgZXhwb3J0ZWQgPSB7XG4gICAgU1ZHX1RBR19OQU1FUzogU1ZHX1RBR19OQU1FUyxcbiAgICBUQUdfTkFNRVM6IFRBR19OQU1FUyxcbiAgICBzdmc6IHN2ZyxcbiAgICBpc1NlbGVjdG9yOiBpc1NlbGVjdG9yLFxuICAgIGNyZWF0ZVRhZ0Z1bmN0aW9uOiBjcmVhdGVUYWdGdW5jdGlvbixcbn07XG5UQUdfTkFNRVMuZm9yRWFjaChmdW5jdGlvbiAobikge1xuICAgIGV4cG9ydGVkW25dID0gY3JlYXRlVGFnRnVuY3Rpb24obik7XG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydGVkO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aHlwZXJzY3JpcHQtaGVscGVycy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0aHVua18xID0gcmVxdWlyZShcIi4vdGh1bmtcIik7XG5leHBvcnRzLnRodW5rID0gdGh1bmtfMS50aHVuaztcbnZhciBNYWluRE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9NYWluRE9NU291cmNlXCIpO1xuZXhwb3J0cy5NYWluRE9NU291cmNlID0gTWFpbkRPTVNvdXJjZV8xLk1haW5ET01Tb3VyY2U7XG4vKipcbiAqIEEgZmFjdG9yeSBmb3IgdGhlIERPTSBkcml2ZXIgZnVuY3Rpb24uXG4gKlxuICogVGFrZXMgYSBgY29udGFpbmVyYCB0byBkZWZpbmUgdGhlIHRhcmdldCBvbiB0aGUgZXhpc3RpbmcgRE9NIHdoaWNoIHRoaXNcbiAqIGRyaXZlciB3aWxsIG9wZXJhdGUgb24sIGFuZCBhbiBgb3B0aW9uc2Agb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuIFRoZVxuICogaW5wdXQgdG8gdGhpcyBkcml2ZXIgaXMgYSBzdHJlYW0gb2YgdmlydHVhbCBET00gb2JqZWN0cywgb3IgaW4gb3RoZXIgd29yZHMsXG4gKiBTbmFiYmRvbSBcIlZOb2RlXCIgb2JqZWN0cy4gVGhlIG91dHB1dCBvZiB0aGlzIGRyaXZlciBpcyBhIFwiRE9NU291cmNlXCI6IGFcbiAqIGNvbGxlY3Rpb24gb2YgT2JzZXJ2YWJsZXMgcXVlcmllZCB3aXRoIHRoZSBtZXRob2RzIGBzZWxlY3QoKWAgYW5kIGBldmVudHMoKWAuXG4gKlxuICogKipgRE9NU291cmNlLnNlbGVjdChzZWxlY3RvcilgKiogcmV0dXJucyBhIG5ldyBET01Tb3VyY2Ugd2l0aCBzY29wZVxuICogcmVzdHJpY3RlZCB0byB0aGUgZWxlbWVudChzKSB0aGF0IG1hdGNoZXMgdGhlIENTUyBgc2VsZWN0b3JgIGdpdmVuLiBUbyBzZWxlY3RcbiAqIHRoZSBwYWdlJ3MgYGRvY3VtZW50YCwgdXNlIGAuc2VsZWN0KCdkb2N1bWVudCcpYC4gVG8gc2VsZWN0IHRoZSBjb250YWluZXJcbiAqIGVsZW1lbnQgZm9yIHRoaXMgYXBwLCB1c2UgYC5zZWxlY3QoJzpyb290JylgLlxuICpcbiAqICoqYERPTVNvdXJjZS5ldmVudHMoZXZlbnRUeXBlLCBvcHRpb25zKWAqKiByZXR1cm5zIGEgc3RyZWFtIG9mIGV2ZW50cyBvZlxuICogYGV2ZW50VHlwZWAgaGFwcGVuaW5nIG9uIHRoZSBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBjdXJyZW50IERPTVNvdXJjZS4gVGhlXG4gKiBldmVudCBvYmplY3QgY29udGFpbnMgdGhlIGBvd25lclRhcmdldGAgcHJvcGVydHkgdGhhdCBiZWhhdmVzIGV4YWN0bHkgbGlrZVxuICogYGN1cnJlbnRUYXJnZXRgLiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgc29tZSBicm93c2VycyBkb2Vzbid0IGFsbG93XG4gKiBgY3VycmVudFRhcmdldGAgcHJvcGVydHkgdG8gYmUgbXV0YXRlZCwgaGVuY2UgYSBuZXcgcHJvcGVydHkgaXMgY3JlYXRlZC4gVGhlXG4gKiByZXR1cm5lZCBzdHJlYW0gaXMgYW4gKnhzdHJlYW0qIFN0cmVhbSBpZiB5b3UgdXNlIGBAY3ljbGUveHN0cmVhbS1ydW5gIHRvIHJ1blxuICogeW91ciBhcHAgd2l0aCB0aGlzIGRyaXZlciwgb3IgaXQgaXMgYW4gUnhKUyBPYnNlcnZhYmxlIGlmIHlvdSB1c2VcbiAqIGBAY3ljbGUvcnhqcy1ydW5gLCBhbmQgc28gZm9ydGguXG4gKlxuICogKipvcHRpb25zIGZvciBET01Tb3VyY2UuZXZlbnRzKipcbiAqXG4gKiBUaGUgYG9wdGlvbnNgIHBhcmFtZXRlciBvbiBgRE9NU291cmNlLmV2ZW50cyhldmVudFR5cGUsIG9wdGlvbnMpYCBpcyBhblxuICogKG9wdGlvbmFsKSBvYmplY3Qgd2l0aCB0d28gb3B0aW9uYWwgZmllbGRzOiBgdXNlQ2FwdHVyZWAgYW5kXG4gKiBgcHJldmVudERlZmF1bHRgLlxuICpcbiAqIGB1c2VDYXB0dXJlYCBpcyBieSBkZWZhdWx0IGBmYWxzZWAsIGV4Y2VwdCBpdCBpcyBgdHJ1ZWAgZm9yIGV2ZW50IHR5cGVzIHRoYXRcbiAqIGRvIG5vdCBidWJibGUuIFJlYWQgbW9yZSBoZXJlXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRXZlbnRUYXJnZXQvYWRkRXZlbnRMaXN0ZW5lclxuICogYWJvdXQgdGhlIGB1c2VDYXB0dXJlYCBhbmQgaXRzIHB1cnBvc2UuXG4gKlxuICogYHByZXZlbnREZWZhdWx0YCBpcyBieSBkZWZhdWx0IGBmYWxzZWAsIGFuZCBpbmRpY2F0ZXMgdG8gdGhlIGRyaXZlciB3aGV0aGVyXG4gKiBgZXZlbnQucHJldmVudERlZmF1bHQoKWAgc2hvdWxkIGJlIGludm9rZWQuIFRoaXMgb3B0aW9uIGNhbiBiZSBjb25maWd1cmVkIGluXG4gKiB0aHJlZSB3YXlzOlxuICpcbiAqIC0gYHtwcmV2ZW50RGVmYXVsdDogYm9vbGVhbn1gIHRvIGludm9rZSBwcmV2ZW50RGVmYXVsdCBpZiBgdHJ1ZWAsIGFuZCBub3RcbiAqIGludm9rZSBvdGhlcndpc2UuXG4gKiAtIGB7cHJldmVudERlZmF1bHQ6IChldjogRXZlbnQpID0+IGJvb2xlYW59YCBmb3IgY29uZGl0aW9uYWwgaW52b2NhdGlvbi5cbiAqIC0gYHtwcmV2ZW50RGVmYXVsdDogTmVzdGVkT2JqZWN0fWAgdXNlcyBhbiBvYmplY3QgdG8gYmUgcmVjdXJzaXZlbHkgY29tcGFyZWRcbiAqIHRvIHRoZSBgRXZlbnRgIG9iamVjdC4gYHByZXZlbnREZWZhdWx0YCBpcyBpbnZva2VkIHdoZW4gYWxsIHByb3BlcnRpZXMgb24gdGhlXG4gKiBuZXN0ZWQgb2JqZWN0IG1hdGNoIHdpdGggdGhlIHByb3BlcnRpZXMgb24gdGhlIGV2ZW50IG9iamVjdC5cbiAqXG4gKiBIZXJlIGFyZSBzb21lIGV4YW1wbGVzOlxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gYWx3YXlzIHByZXZlbnQgZGVmYXVsdFxuICogRE9NU291cmNlLnNlbGVjdCgnaW5wdXQnKS5ldmVudHMoJ2tleWRvd24nLCB7XG4gKiAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gKiB9KVxuICpcbiAqIC8vIHByZXZlbnQgZGVmYXVsdCBvbmx5IHdoZW4gYEVOVEVSYCBpcyBwcmVzc2VkXG4gKiBET01Tb3VyY2Uuc2VsZWN0KCdpbnB1dCcpLmV2ZW50cygna2V5ZG93bicsIHtcbiAqICAgcHJldmVudERlZmF1bHQ6IGUgPT4gZS5rZXlDb2RlID09PSAxM1xuICogfSlcbiAqXG4gKiAvLyBwcmV2ZW50IGRlZnVhbHQgd2hlbiBgRU5URVJgIGlzIHByZXNzZWQgQU5EIHRhcmdldC52YWx1ZSBpcyAnSEVMTE8nXG4gKiBET01Tb3VyY2Uuc2VsZWN0KCdpbnB1dCcpLmV2ZW50cygna2V5ZG93bicsIHtcbiAqICAgcHJldmVudERlZmF1bHQ6IHsga2V5Q29kZTogMTMsIG93bmVyVGFyZ2V0OiB7IHZhbHVlOiAnSEVMTE8nIH0gfVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiAqKmBET01Tb3VyY2UuZWxlbWVudHMoKWAqKiByZXR1cm5zIGEgc3RyZWFtIG9mIGFycmF5cyBjb250YWluaW5nIHRoZSBET01cbiAqIGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlIHNlbGVjdG9ycyBpbiB0aGUgRE9NU291cmNlIChlLmcuIGZyb20gcHJldmlvdXNcbiAqIGBzZWxlY3QoeClgIGNhbGxzKS5cbiAqXG4gKiAqKmBET01Tb3VyY2UuZWxlbWVudCgpYCoqIHJldHVybnMgYSBzdHJlYW0gb2YgRE9NIGVsZW1lbnRzLiBOb3RpY2UgdGhhdCB0aGlzXG4gKiBpcyB0aGUgc2luZ3VsYXIgdmVyc2lvbiBvZiBgLmVsZW1lbnRzKClgLCBzbyB0aGUgc3RyZWFtIHdpbGwgZW1pdCBhbiBlbGVtZW50LFxuICogbm90IGFuIGFycmF5LiBJZiB0aGVyZSBpcyBubyBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgc2VsZWN0ZWQgRE9NU291cmNlLFxuICogdGhlbiB0aGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgbm90IGVtaXQgYW55dGhpbmcuXG4gKlxuICogQHBhcmFtIHsoU3RyaW5nfEhUTUxFbGVtZW50KX0gY29udGFpbmVyIHRoZSBET00gc2VsZWN0b3IgZm9yIHRoZSBlbGVtZW50XG4gKiAob3IgdGhlIGVsZW1lbnQgaXRzZWxmKSB0byBjb250YWluIHRoZSByZW5kZXJpbmcgb2YgdGhlIFZUcmVlcy5cbiAqIEBwYXJhbSB7RE9NRHJpdmVyT3B0aW9uc30gb3B0aW9ucyBhbiBvYmplY3Qgd2l0aCB0d28gb3B0aW9uYWwgcHJvcGVydGllczpcbiAqXG4gKiAgIC0gYG1vZHVsZXM6IGFycmF5YCBvdmVycmlkZXMgYEBjeWNsZS9kb21gJ3MgZGVmYXVsdCBTbmFiYmRvbSBtb2R1bGVzIGFzXG4gKiAgICAgYXMgZGVmaW5lZCBpbiBbYHNyYy9tb2R1bGVzLnRzYF0oLi9zcmMvbW9kdWxlcy50cykuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGhlIERPTSBkcml2ZXIgZnVuY3Rpb24uIFRoZSBmdW5jdGlvbiBleHBlY3RzIGEgc3RyZWFtIG9mXG4gKiBWTm9kZSBhcyBpbnB1dCwgYW5kIG91dHB1dHMgdGhlIERPTVNvdXJjZSBvYmplY3QuXG4gKiBAZnVuY3Rpb24gbWFrZURPTURyaXZlclxuICovXG52YXIgbWFrZURPTURyaXZlcl8xID0gcmVxdWlyZShcIi4vbWFrZURPTURyaXZlclwiKTtcbmV4cG9ydHMubWFrZURPTURyaXZlciA9IG1ha2VET01Ecml2ZXJfMS5tYWtlRE9NRHJpdmVyO1xuLyoqXG4gKiBBIGZhY3RvcnkgZnVuY3Rpb24gdG8gY3JlYXRlIG1vY2tlZCBET01Tb3VyY2Ugb2JqZWN0cywgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gKlxuICogVGFrZXMgYSBgbW9ja0NvbmZpZ2Agb2JqZWN0IGFzIGFyZ3VtZW50LCBhbmQgcmV0dXJuc1xuICogYSBET01Tb3VyY2UgdGhhdCBjYW4gYmUgZ2l2ZW4gdG8gYW55IEN5Y2xlLmpzIGFwcCB0aGF0IGV4cGVjdHMgYSBET01Tb3VyY2UgaW5cbiAqIHRoZSBzb3VyY2VzLCBmb3IgdGVzdGluZy5cbiAqXG4gKiBUaGUgYG1vY2tDb25maWdgIHBhcmFtZXRlciBpcyBhbiBvYmplY3Qgc3BlY2lmeWluZyBzZWxlY3RvcnMsIGV2ZW50VHlwZXMgYW5kXG4gKiB0aGVpciBzdHJlYW1zLiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBkb21Tb3VyY2UgPSBtb2NrRE9NU291cmNlKHtcbiAqICAgJy5mb28nOiB7XG4gKiAgICAgJ2NsaWNrJzogeHMub2Yoe3RhcmdldDoge319KSxcbiAqICAgICAnbW91c2VvdmVyJzogeHMub2Yoe3RhcmdldDoge319KSxcbiAqICAgfSxcbiAqICAgJy5iYXInOiB7XG4gKiAgICAgJ3Njcm9sbCc6IHhzLm9mKHt0YXJnZXQ6IHt9fSksXG4gKiAgICAgZWxlbWVudHM6IHhzLm9mKHt0YWdOYW1lOiAnZGl2J30pLFxuICogICB9XG4gKiB9KTtcbiAqXG4gKiAvLyBVc2FnZVxuICogY29uc3QgY2xpY2skID0gZG9tU291cmNlLnNlbGVjdCgnLmZvbycpLmV2ZW50cygnY2xpY2snKTtcbiAqIGNvbnN0IGVsZW1lbnQkID0gZG9tU291cmNlLnNlbGVjdCgnLmJhcicpLmVsZW1lbnRzKCk7XG4gKiBgYGBcbiAqXG4gKiBUaGUgbW9ja2VkIERPTSBTb3VyY2Ugc3VwcG9ydHMgaXNvbGF0aW9uLiBJdCBoYXMgdGhlIGZ1bmN0aW9ucyBgaXNvbGF0ZVNpbmtgXG4gKiBhbmQgYGlzb2xhdGVTb3VyY2VgIGF0dGFjaGVkIHRvIGl0LCBhbmQgcGVyZm9ybXMgc2ltcGxlIGlzb2xhdGlvbiB1c2luZ1xuICogY2xhc3NOYW1lcy4gKmlzb2xhdGVTaW5rKiB3aXRoIHNjb3BlIGBmb29gIHdpbGwgYXBwZW5kIHRoZSBjbGFzcyBgX19fZm9vYCB0b1xuICogdGhlIHN0cmVhbSBvZiB2aXJ0dWFsIERPTSBub2RlcywgYW5kICppc29sYXRlU291cmNlKiB3aXRoIHNjb3BlIGBmb29gIHdpbGxcbiAqIHBlcmZvcm0gYSBjb252ZW50aW9uYWwgYG1vY2tlZERPTVNvdXJjZS5zZWxlY3QoJy5fX2ZvbycpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtb2NrQ29uZmlnIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBzZWxlY3RvciBzdHJpbmdzXG4gKiBhbmQgdmFsdWVzIGFyZSBvYmplY3RzLiBUaG9zZSBuZXN0ZWQgb2JqZWN0cyBoYXZlIGBldmVudFR5cGVgIHN0cmluZ3MgYXMga2V5c1xuICogYW5kIHZhbHVlcyBhcmUgc3RyZWFtcyB5b3UgY3JlYXRlZC5cbiAqIEByZXR1cm4ge09iamVjdH0gZmFrZSBET00gc291cmNlIG9iamVjdCwgd2l0aCBhbiBBUEkgY29udGFpbmluZyBgc2VsZWN0KClgXG4gKiBhbmQgYGV2ZW50cygpYCBhbmQgYGVsZW1lbnRzKClgIHdoaWNoIGNhbiBiZSB1c2VkIGp1c3QgbGlrZSB0aGUgRE9NIERyaXZlcidzXG4gKiBET01Tb3VyY2UuXG4gKlxuICogQGZ1bmN0aW9uIG1vY2tET01Tb3VyY2VcbiAqL1xudmFyIG1vY2tET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL21vY2tET01Tb3VyY2VcIik7XG5leHBvcnRzLm1vY2tET01Tb3VyY2UgPSBtb2NrRE9NU291cmNlXzEubW9ja0RPTVNvdXJjZTtcbmV4cG9ydHMuTW9ja2VkRE9NU291cmNlID0gbW9ja0RPTVNvdXJjZV8xLk1vY2tlZERPTVNvdXJjZTtcbi8qKlxuICogVGhlIGh5cGVyc2NyaXB0IGZ1bmN0aW9uIGBoKClgIGlzIGEgZnVuY3Rpb24gdG8gY3JlYXRlIHZpcnR1YWwgRE9NIG9iamVjdHMsXG4gKiBhbHNvIGtub3duIGFzIFZOb2Rlcy4gQ2FsbFxuICpcbiAqIGBgYGpzXG4gKiBoKCdkaXYubXlDbGFzcycsIHtzdHlsZToge2NvbG9yOiAncmVkJ319LCBbXSlcbiAqIGBgYFxuICpcbiAqIHRvIGNyZWF0ZSBhIFZOb2RlIHRoYXQgcmVwcmVzZW50cyBhIGBESVZgIGVsZW1lbnQgd2l0aCBjbGFzc05hbWUgYG15Q2xhc3NgLFxuICogc3R5bGVkIHdpdGggcmVkIGNvbG9yLCBhbmQgbm8gY2hpbGRyZW4gYmVjYXVzZSB0aGUgYFtdYCBhcnJheSB3YXMgcGFzc2VkLiBUaGVcbiAqIEFQSSBpcyBgaCh0YWdPclNlbGVjdG9yLCBvcHRpb25hbERhdGEsIG9wdGlvbmFsQ2hpbGRyZW5PclRleHQpYC5cbiAqXG4gKiBIb3dldmVyLCB1c3VhbGx5IHlvdSBzaG91bGQgdXNlIFwiaHlwZXJzY3JpcHQgaGVscGVyc1wiLCB3aGljaCBhcmUgc2hvcnRjdXRcbiAqIGZ1bmN0aW9ucyBiYXNlZCBvbiBoeXBlcnNjcmlwdC4gVGhlcmUgaXMgb25lIGh5cGVyc2NyaXB0IGhlbHBlciBmdW5jdGlvbiBmb3JcbiAqIGVhY2ggRE9NIHRhZ05hbWUsIHN1Y2ggYXMgYGgxKClgLCBgaDIoKWAsIGBkaXYoKWAsIGBzcGFuKClgLCBgbGFiZWwoKWAsXG4gKiBgaW5wdXQoKWAuIEZvciBpbnN0YW5jZSwgdGhlIHByZXZpb3VzIGV4YW1wbGUgY291bGQgaGF2ZSBiZWVuIHdyaXR0ZW5cbiAqIGFzOlxuICpcbiAqIGBgYGpzXG4gKiBkaXYoJy5teUNsYXNzJywge3N0eWxlOiB7Y29sb3I6ICdyZWQnfX0sIFtdKVxuICogYGBgXG4gKlxuICogVGhlcmUgYXJlIGFsc28gU1ZHIGhlbHBlciBmdW5jdGlvbnMsIHdoaWNoIGFwcGx5IHRoZSBhcHByb3ByaWF0ZSBTVkdcbiAqIG5hbWVzcGFjZSB0byB0aGUgcmVzdWx0aW5nIGVsZW1lbnRzLiBgc3ZnKClgIGZ1bmN0aW9uIGNyZWF0ZXMgdGhlIHRvcC1tb3N0XG4gKiBTVkcgZWxlbWVudCwgYW5kIGBzdmcuZ2AsIGBzdmcucG9seWdvbmAsIGBzdmcuY2lyY2xlYCwgYHN2Zy5wYXRoYCBhcmUgZm9yXG4gKiBTVkctc3BlY2lmaWMgY2hpbGQgZWxlbWVudHMuIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIHN2Zyh7YXR0cnM6IHt3aWR0aDogMTUwLCBoZWlnaHQ6IDE1MH19LCBbXG4gKiAgIHN2Zy5wb2x5Z29uKHtcbiAqICAgICBhdHRyczoge1xuICogICAgICAgY2xhc3M6ICd0cmlhbmdsZScsXG4gKiAgICAgICBwb2ludHM6ICcyMCAwIDIwIDE1MCAxNTAgMjAnXG4gKiAgICAgfVxuICogICB9KVxuICogXSlcbiAqIGBgYFxuICpcbiAqIEBmdW5jdGlvbiBoXG4gKi9cbnZhciBoXzEgPSByZXF1aXJlKFwic25hYmJkb20vaFwiKTtcbmV4cG9ydHMuaCA9IGhfMS5oO1xudmFyIGh5cGVyc2NyaXB0X2hlbHBlcnNfMSA9IHJlcXVpcmUoXCIuL2h5cGVyc2NyaXB0LWhlbHBlcnNcIik7XG5leHBvcnRzLnN2ZyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN2ZztcbmV4cG9ydHMuYSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmE7XG5leHBvcnRzLmFiYnIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hYmJyO1xuZXhwb3J0cy5hZGRyZXNzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYWRkcmVzcztcbmV4cG9ydHMuYXJlYSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFyZWE7XG5leHBvcnRzLmFydGljbGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hcnRpY2xlO1xuZXhwb3J0cy5hc2lkZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFzaWRlO1xuZXhwb3J0cy5hdWRpbyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmF1ZGlvO1xuZXhwb3J0cy5iID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYjtcbmV4cG9ydHMuYmFzZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJhc2U7XG5leHBvcnRzLmJkaSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJkaTtcbmV4cG9ydHMuYmRvID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmRvO1xuZXhwb3J0cy5ibG9ja3F1b3RlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmxvY2txdW90ZTtcbmV4cG9ydHMuYm9keSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJvZHk7XG5leHBvcnRzLmJyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYnI7XG5leHBvcnRzLmJ1dHRvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJ1dHRvbjtcbmV4cG9ydHMuY2FudmFzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY2FudmFzO1xuZXhwb3J0cy5jYXB0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY2FwdGlvbjtcbmV4cG9ydHMuY2l0ZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNpdGU7XG5leHBvcnRzLmNvZGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jb2RlO1xuZXhwb3J0cy5jb2wgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jb2w7XG5leHBvcnRzLmNvbGdyb3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY29sZ3JvdXA7XG5leHBvcnRzLmRkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGQ7XG5leHBvcnRzLmRlbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRlbDtcbmV4cG9ydHMuZGZuID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGZuO1xuZXhwb3J0cy5kaXIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kaXI7XG5leHBvcnRzLmRpdiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRpdjtcbmV4cG9ydHMuZGwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kbDtcbmV4cG9ydHMuZHQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kdDtcbmV4cG9ydHMuZW0gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5lbTtcbmV4cG9ydHMuZW1iZWQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5lbWJlZDtcbmV4cG9ydHMuZmllbGRzZXQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5maWVsZHNldDtcbmV4cG9ydHMuZmlnY2FwdGlvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZpZ2NhcHRpb247XG5leHBvcnRzLmZpZ3VyZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZpZ3VyZTtcbmV4cG9ydHMuZm9vdGVyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZm9vdGVyO1xuZXhwb3J0cy5mb3JtID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZm9ybTtcbmV4cG9ydHMuaDEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oMTtcbmV4cG9ydHMuaDIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oMjtcbmV4cG9ydHMuaDMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oMztcbmV4cG9ydHMuaDQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oNDtcbmV4cG9ydHMuaDUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oNTtcbmV4cG9ydHMuaDYgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oNjtcbmV4cG9ydHMuaGVhZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmhlYWQ7XG5leHBvcnRzLmhlYWRlciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmhlYWRlcjtcbmV4cG9ydHMuaGdyb3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaGdyb3VwO1xuZXhwb3J0cy5ociA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmhyO1xuZXhwb3J0cy5odG1sID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaHRtbDtcbmV4cG9ydHMuaSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmk7XG5leHBvcnRzLmlmcmFtZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmlmcmFtZTtcbmV4cG9ydHMuaW1nID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaW1nO1xuZXhwb3J0cy5pbnB1dCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmlucHV0O1xuZXhwb3J0cy5pbnMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pbnM7XG5leHBvcnRzLmtiZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmtiZDtcbmV4cG9ydHMua2V5Z2VuID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQua2V5Z2VuO1xuZXhwb3J0cy5sYWJlbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmxhYmVsO1xuZXhwb3J0cy5sZWdlbmQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5sZWdlbmQ7XG5leHBvcnRzLmxpID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubGk7XG5leHBvcnRzLmxpbmsgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5saW5rO1xuZXhwb3J0cy5tYWluID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWFpbjtcbmV4cG9ydHMubWFwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWFwO1xuZXhwb3J0cy5tYXJrID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWFyaztcbmV4cG9ydHMubWVudSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1lbnU7XG5leHBvcnRzLm1ldGEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tZXRhO1xuZXhwb3J0cy5uYXYgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5uYXY7XG5leHBvcnRzLm5vc2NyaXB0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubm9zY3JpcHQ7XG5leHBvcnRzLm9iamVjdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9iamVjdDtcbmV4cG9ydHMub2wgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vbDtcbmV4cG9ydHMub3B0Z3JvdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vcHRncm91cDtcbmV4cG9ydHMub3B0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQub3B0aW9uO1xuZXhwb3J0cy5wID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucDtcbmV4cG9ydHMucGFyYW0gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wYXJhbTtcbmV4cG9ydHMucHJlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucHJlO1xuZXhwb3J0cy5wcm9ncmVzcyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnByb2dyZXNzO1xuZXhwb3J0cy5xID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucTtcbmV4cG9ydHMucnAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ycDtcbmV4cG9ydHMucnQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ydDtcbmV4cG9ydHMucnVieSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnJ1Ynk7XG5leHBvcnRzLnMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zO1xuZXhwb3J0cy5zYW1wID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2FtcDtcbmV4cG9ydHMuc2NyaXB0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2NyaXB0O1xuZXhwb3J0cy5zZWN0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2VjdGlvbjtcbmV4cG9ydHMuc2VsZWN0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2VsZWN0O1xuZXhwb3J0cy5zbWFsbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNtYWxsO1xuZXhwb3J0cy5zb3VyY2UgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zb3VyY2U7XG5leHBvcnRzLnNwYW4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zcGFuO1xuZXhwb3J0cy5zdHJvbmcgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdHJvbmc7XG5leHBvcnRzLnN0eWxlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3R5bGU7XG5leHBvcnRzLnN1YiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN1YjtcbmV4cG9ydHMuc3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3VwO1xuZXhwb3J0cy50YWJsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRhYmxlO1xuZXhwb3J0cy50Ym9keSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRib2R5O1xuZXhwb3J0cy50ZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRkO1xuZXhwb3J0cy50ZXh0YXJlYSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRleHRhcmVhO1xuZXhwb3J0cy50Zm9vdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRmb290O1xuZXhwb3J0cy50aCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRoO1xuZXhwb3J0cy50aGVhZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRoZWFkO1xuZXhwb3J0cy50aXRsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRpdGxlO1xuZXhwb3J0cy50ciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRyO1xuZXhwb3J0cy51ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudTtcbmV4cG9ydHMudWwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC51bDtcbmV4cG9ydHMudmlkZW8gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC52aWRlbztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5mdW5jdGlvbiBtYWtlSXNvbGF0ZVNpbmsobmFtZXNwYWNlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzaW5rLCBzY29wZSkge1xuICAgICAgICBpZiAoc2NvcGUgPT09ICc6cm9vdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBzaW5rO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaW5rLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2NvcGVPYmogPSBnZXRTY29wZU9iaihzY29wZSk7XG4gICAgICAgICAgICB2YXIgbmV3Tm9kZSA9IF9fYXNzaWduKHt9LCBub2RlLCB7IGRhdGE6IF9fYXNzaWduKHt9LCBub2RlLmRhdGEsIHsgaXNvbGF0ZTogIW5vZGUuZGF0YSB8fCAhQXJyYXkuaXNBcnJheShub2RlLmRhdGEuaXNvbGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgID8gbmFtZXNwYWNlLmNvbmNhdChbc2NvcGVPYmpdKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBub2RlLmRhdGEuaXNvbGF0ZSB9KSB9KTtcbiAgICAgICAgICAgIHJldHVybiBfX2Fzc2lnbih7fSwgbmV3Tm9kZSwgeyBrZXk6IG5ld05vZGUua2V5ICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgPyBuZXdOb2RlLmtleVxuICAgICAgICAgICAgICAgICAgICA6IEpTT04uc3RyaW5naWZ5KG5ld05vZGUuZGF0YS5pc29sYXRlKSB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZUlzb2xhdGVTaW5rID0gbWFrZUlzb2xhdGVTaW5rO1xuZnVuY3Rpb24gZ2V0U2NvcGVPYmooc2NvcGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiB1dGlsc18xLmlzQ2xhc3NPcklkKHNjb3BlKSA/ICdzaWJsaW5nJyA6ICd0b3RhbCcsXG4gICAgICAgIHNjb3BlOiBzY29wZSxcbiAgICB9O1xufVxuZXhwb3J0cy5nZXRTY29wZU9iaiA9IGdldFNjb3BlT2JqO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aXNvbGF0ZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBzbmFiYmRvbV8xID0gcmVxdWlyZShcInNuYWJiZG9tXCIpO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGNvbmNhdF8xID0gcmVxdWlyZShcInhzdHJlYW0vZXh0cmEvY29uY2F0XCIpO1xudmFyIHNhbXBsZUNvbWJpbmVfMSA9IHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL3NhbXBsZUNvbWJpbmVcIik7XG52YXIgTWFpbkRPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vTWFpbkRPTVNvdXJjZVwiKTtcbnZhciB0b3Zub2RlXzEgPSByZXF1aXJlKFwic25hYmJkb20vdG92bm9kZVwiKTtcbnZhciBWTm9kZVdyYXBwZXJfMSA9IHJlcXVpcmUoXCIuL1ZOb2RlV3JhcHBlclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgbW9kdWxlc18xID0gcmVxdWlyZShcIi4vbW9kdWxlc1wiKTtcbnZhciBJc29sYXRlTW9kdWxlXzEgPSByZXF1aXJlKFwiLi9Jc29sYXRlTW9kdWxlXCIpO1xudmFyIEV2ZW50RGVsZWdhdG9yXzEgPSByZXF1aXJlKFwiLi9FdmVudERlbGVnYXRvclwiKTtcbmZ1bmN0aW9uIG1ha2VET01Ecml2ZXJJbnB1dEd1YXJkKG1vZHVsZXMpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkobW9kdWxlcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3B0aW9uYWwgbW9kdWxlcyBvcHRpb24gbXVzdCBiZSBhbiBhcnJheSBmb3Igc25hYmJkb20gbW9kdWxlc1wiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkb21Ecml2ZXJJbnB1dEd1YXJkKHZpZXckKSB7XG4gICAgaWYgKCF2aWV3JCB8fFxuICAgICAgICB0eXBlb2YgdmlldyQuYWRkTGlzdGVuZXIgIT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICAgICB0eXBlb2YgdmlldyQuZm9sZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBET00gZHJpdmVyIGZ1bmN0aW9uIGV4cGVjdHMgYXMgaW5wdXQgYSBTdHJlYW0gb2YgXCIgK1xuICAgICAgICAgICAgXCJ2aXJ0dWFsIERPTSBlbGVtZW50c1wiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkcm9wQ29tcGxldGlvbihpbnB1dCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbnB1dCwgeHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKSk7XG59XG5mdW5jdGlvbiB1bndyYXBFbGVtZW50RnJvbVZOb2RlKHZub2RlKSB7XG4gICAgcmV0dXJuIHZub2RlLmVsbTtcbn1cbmZ1bmN0aW9uIHJlcG9ydFNuYWJiZG9tRXJyb3IoZXJyKSB7XG4gICAgKGNvbnNvbGUuZXJyb3IgfHwgY29uc29sZS5sb2cpKGVycik7XG59XG5mdW5jdGlvbiBtYWtlRE9NUmVhZHkkKCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoe1xuICAgICAgICBzdGFydDogZnVuY3Rpb24gKGxpcykge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IGRvY3VtZW50LnJlYWR5U3RhdGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJyB8fCBzdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzLm5leHQobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXMuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzLm5leHQobnVsbCk7XG4gICAgICAgICAgICAgICAgbGlzLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGFkZFJvb3RTY29wZSh2bm9kZSkge1xuICAgIHZub2RlLmRhdGEgPSB2bm9kZS5kYXRhIHx8IHt9O1xuICAgIHZub2RlLmRhdGEuaXNvbGF0ZSA9IFtdO1xuICAgIHJldHVybiB2bm9kZTtcbn1cbmZ1bmN0aW9uIG1ha2VET01Ecml2ZXIoY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgdXRpbHNfMS5jaGVja1ZhbGlkQ29udGFpbmVyKGNvbnRhaW5lcik7XG4gICAgdmFyIG1vZHVsZXMgPSBvcHRpb25zLm1vZHVsZXMgfHwgbW9kdWxlc18xLmRlZmF1bHQ7XG4gICAgbWFrZURPTURyaXZlcklucHV0R3VhcmQobW9kdWxlcyk7XG4gICAgdmFyIGlzb2xhdGVNb2R1bGUgPSBuZXcgSXNvbGF0ZU1vZHVsZV8xLklzb2xhdGVNb2R1bGUoKTtcbiAgICB2YXIgcGF0Y2ggPSBzbmFiYmRvbV8xLmluaXQoW2lzb2xhdGVNb2R1bGUuY3JlYXRlTW9kdWxlKCldLmNvbmNhdChtb2R1bGVzKSk7XG4gICAgdmFyIGRvbVJlYWR5JCA9IG1ha2VET01SZWFkeSQoKTtcbiAgICB2YXIgdm5vZGVXcmFwcGVyO1xuICAgIHZhciBtdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBtdXRhdGlvbkNvbmZpcm1lZCQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoe1xuICAgICAgICBzdGFydDogZnVuY3Rpb24gKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBtdXRhdGlvbk9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkgeyByZXR1cm4gbGlzdGVuZXIubmV4dChudWxsKTsgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG11dGF0aW9uT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgIH0pO1xuICAgIGZ1bmN0aW9uIERPTURyaXZlcih2bm9kZSQsIG5hbWUpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09IHZvaWQgMCkgeyBuYW1lID0gJ0RPTSc7IH1cbiAgICAgICAgZG9tRHJpdmVySW5wdXRHdWFyZCh2bm9kZSQpO1xuICAgICAgICB2YXIgc2FuaXRhdGlvbiQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgdmFyIGZpcnN0Um9vdCQgPSBkb21SZWFkeSQubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmaXJzdFJvb3QgPSB1dGlsc18xLmdldFZhbGlkTm9kZShjb250YWluZXIpIHx8IGRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICB2bm9kZVdyYXBwZXIgPSBuZXcgVk5vZGVXcmFwcGVyXzEuVk5vZGVXcmFwcGVyKGZpcnN0Um9vdCk7XG4gICAgICAgICAgICByZXR1cm4gZmlyc3RSb290O1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBzdWJzY3JpYmUgdG8gdGhlIHNpbmsgKGkuZS4gdm5vZGUkKSBzeW5jaHJvbm91c2x5IGluc2lkZSB0aGlzXG4gICAgICAgIC8vIGRyaXZlciwgYW5kIG5vdCBsYXRlciBpbiB0aGUgbWFwKCkuZmxhdHRlbigpIGJlY2F1c2UgdGhpcyBzaW5rIGlzIGluXG4gICAgICAgIC8vIHJlYWxpdHkgYSBTaW5rUHJveHkgZnJvbSBAY3ljbGUvcnVuLCBhbmQgd2UgZG9uJ3Qgd2FudCB0byBtaXNzIHRoZSBmaXJzdFxuICAgICAgICAvLyBlbWlzc2lvbiB3aGVuIHRoZSBtYWluKCkgaXMgY29ubmVjdGVkIHRvIHRoZSBkcml2ZXJzLlxuICAgICAgICAvLyBSZWFkIG1vcmUgaW4gaXNzdWUgIzczOS5cbiAgICAgICAgdmFyIHJlbWVtYmVyZWRWTm9kZSQgPSB2bm9kZSQucmVtZW1iZXIoKTtcbiAgICAgICAgcmVtZW1iZXJlZFZOb2RlJC5hZGRMaXN0ZW5lcih7fSk7XG4gICAgICAgIC8vIFRoZSBtdXRhdGlvbiBvYnNlcnZlciBpbnRlcm5hbCB0byBtdXRhdGlvbkNvbmZpcm1lZCQgc2hvdWxkXG4gICAgICAgIC8vIGV4aXN0IGJlZm9yZSBlbGVtZW50QWZ0ZXJQYXRjaCQgY2FsbHMgbXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKClcbiAgICAgICAgbXV0YXRpb25Db25maXJtZWQkLmFkZExpc3RlbmVyKHt9KTtcbiAgICAgICAgdmFyIGVsZW1lbnRBZnRlclBhdGNoJCA9IGZpcnN0Um9vdCRcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGZpcnN0Um9vdCkge1xuICAgICAgICAgICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0XG4gICAgICAgICAgICAgICAgLm1lcmdlKHJlbWVtYmVyZWRWTm9kZSQuZW5kV2hlbihzYW5pdGF0aW9uJCksIHNhbml0YXRpb24kKVxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKHZub2RlKSB7IHJldHVybiB2bm9kZVdyYXBwZXIuY2FsbCh2bm9kZSk7IH0pXG4gICAgICAgICAgICAgICAgLnN0YXJ0V2l0aChhZGRSb290U2NvcGUodG92bm9kZV8xLnRvVk5vZGUoZmlyc3RSb290KSkpXG4gICAgICAgICAgICAgICAgLmZvbGQocGF0Y2gsIHRvdm5vZGVfMS50b1ZOb2RlKGZpcnN0Um9vdCkpXG4gICAgICAgICAgICAgICAgLmRyb3AoMSlcbiAgICAgICAgICAgICAgICAubWFwKHVud3JhcEVsZW1lbnRGcm9tVk5vZGUpXG4gICAgICAgICAgICAgICAgLnN0YXJ0V2l0aChmaXJzdFJvb3QpXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICBtdXRhdGlvbk9ic2VydmVyLm9ic2VydmUoZWwsIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyRGF0YU9sZFZhbHVlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNvbXBvc2UoZHJvcENvbXBsZXRpb24pO1xuICAgICAgICB9IC8vIGRvbid0IGNvbXBsZXRlIHRoaXMgc3RyZWFtXG4gICAgICAgIClcbiAgICAgICAgICAgIC5mbGF0dGVuKCk7XG4gICAgICAgIHZhciByb290RWxlbWVudCQgPSBjb25jYXRfMS5kZWZhdWx0KGRvbVJlYWR5JCwgbXV0YXRpb25Db25maXJtZWQkKVxuICAgICAgICAgICAgLmVuZFdoZW4oc2FuaXRhdGlvbiQpXG4gICAgICAgICAgICAuY29tcG9zZShzYW1wbGVDb21iaW5lXzEuZGVmYXVsdChlbGVtZW50QWZ0ZXJQYXRjaCQpKVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoYXJyKSB7IHJldHVybiBhcnJbMV07IH0pXG4gICAgICAgICAgICAucmVtZW1iZXIoKTtcbiAgICAgICAgLy8gU3RhcnQgdGhlIHNuYWJiZG9tIHBhdGNoaW5nLCBvdmVyIHRpbWVcbiAgICAgICAgcm9vdEVsZW1lbnQkLmFkZExpc3RlbmVyKHsgZXJyb3I6IHJlcG9ydFNuYWJiZG9tRXJyb3IgfSk7XG4gICAgICAgIHZhciBkZWxlZ2F0b3IgPSBuZXcgRXZlbnREZWxlZ2F0b3JfMS5FdmVudERlbGVnYXRvcihyb290RWxlbWVudCQsIGlzb2xhdGVNb2R1bGUpO1xuICAgICAgICByZXR1cm4gbmV3IE1haW5ET01Tb3VyY2VfMS5NYWluRE9NU291cmNlKHJvb3RFbGVtZW50JCwgc2FuaXRhdGlvbiQsIFtdLCBpc29sYXRlTW9kdWxlLCBkZWxlZ2F0b3IsIG5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gRE9NRHJpdmVyO1xufVxuZXhwb3J0cy5tYWtlRE9NRHJpdmVyID0gbWFrZURPTURyaXZlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1ha2VET01Ecml2ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBTQ09QRV9QUkVGSVggPSAnX19fJztcbnZhciBNb2NrZWRET01Tb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTW9ja2VkRE9NU291cmNlKF9tb2NrQ29uZmlnKSB7XG4gICAgICAgIHRoaXMuX21vY2tDb25maWcgPSBfbW9ja0NvbmZpZztcbiAgICAgICAgaWYgKF9tb2NrQ29uZmlnLmVsZW1lbnRzKSB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50cyA9IF9tb2NrQ29uZmlnLmVsZW1lbnRzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudHMgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0LmVtcHR5KCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzXG4gICAgICAgICAgICAuX2VsZW1lbnRzO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSAnTW9ja2VkRE9NJztcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dHB1dCQgPSB0aGlzLmVsZW1lbnRzKClcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGFycikgeyByZXR1cm4gYXJyLmxlbmd0aCA+IDA7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChhcnIpIHsgcmV0dXJuIGFyclswXTsgfSlcbiAgICAgICAgICAgIC5yZW1lbWJlcigpO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChvdXRwdXQkKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gJ01vY2tlZERPTSc7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBNb2NrZWRET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMsIGJ1YmJsZXMpIHtcbiAgICAgICAgdmFyIHN0cmVhbUZvckV2ZW50VHlwZSA9IHRoaXMuX21vY2tDb25maWdbZXZlbnRUeXBlXTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoc3RyZWFtRm9yRXZlbnRUeXBlIHx8IHhzdHJlYW1fMS5kZWZhdWx0LmVtcHR5KCkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSAnTW9ja2VkRE9NJztcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBtb2NrQ29uZmlnRm9yU2VsZWN0b3IgPSB0aGlzLl9tb2NrQ29uZmlnW3NlbGVjdG9yXSB8fCB7fTtcbiAgICAgICAgcmV0dXJuIG5ldyBNb2NrZWRET01Tb3VyY2UobW9ja0NvbmZpZ0ZvclNlbGVjdG9yKTtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuaXNvbGF0ZVNvdXJjZSA9IGZ1bmN0aW9uIChzb3VyY2UsIHNjb3BlKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2Uuc2VsZWN0KCcuJyArIFNDT1BFX1BSRUZJWCArIHNjb3BlKTtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuaXNvbGF0ZVNpbmsgPSBmdW5jdGlvbiAoc2luaywgc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2luaykubWFwKGZ1bmN0aW9uICh2bm9kZSkge1xuICAgICAgICAgICAgaWYgKHZub2RlLnNlbCAmJiB2bm9kZS5zZWwuaW5kZXhPZihTQ09QRV9QUkVGSVggKyBzY29wZSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdm5vZGUuc2VsICs9IFwiLlwiICsgU0NPUEVfUFJFRklYICsgc2NvcGU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfTtcbiAgICByZXR1cm4gTW9ja2VkRE9NU291cmNlO1xufSgpKTtcbmV4cG9ydHMuTW9ja2VkRE9NU291cmNlID0gTW9ja2VkRE9NU291cmNlO1xuZnVuY3Rpb24gbW9ja0RPTVNvdXJjZShtb2NrQ29uZmlnKSB7XG4gICAgcmV0dXJuIG5ldyBNb2NrZWRET01Tb3VyY2UobW9ja0NvbmZpZyk7XG59XG5leHBvcnRzLm1vY2tET01Tb3VyY2UgPSBtb2NrRE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9ja0RPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBjbGFzc18xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvY2xhc3NcIik7XG5leHBvcnRzLkNsYXNzTW9kdWxlID0gY2xhc3NfMS5kZWZhdWx0O1xudmFyIHByb3BzXzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9wcm9wc1wiKTtcbmV4cG9ydHMuUHJvcHNNb2R1bGUgPSBwcm9wc18xLmRlZmF1bHQ7XG52YXIgYXR0cmlidXRlc18xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvYXR0cmlidXRlc1wiKTtcbmV4cG9ydHMuQXR0cnNNb2R1bGUgPSBhdHRyaWJ1dGVzXzEuZGVmYXVsdDtcbnZhciBzdHlsZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvc3R5bGVcIik7XG5leHBvcnRzLlN0eWxlTW9kdWxlID0gc3R5bGVfMS5kZWZhdWx0O1xudmFyIGRhdGFzZXRfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL2RhdGFzZXRcIik7XG5leHBvcnRzLkRhdGFzZXRNb2R1bGUgPSBkYXRhc2V0XzEuZGVmYXVsdDtcbnZhciBtb2R1bGVzID0gW1xuICAgIHN0eWxlXzEuZGVmYXVsdCxcbiAgICBjbGFzc18xLmRlZmF1bHQsXG4gICAgcHJvcHNfMS5kZWZhdWx0LFxuICAgIGF0dHJpYnV0ZXNfMS5kZWZhdWx0LFxuICAgIGRhdGFzZXRfMS5kZWZhdWx0LFxuXTtcbmV4cG9ydHMuZGVmYXVsdCA9IG1vZHVsZXM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tb2R1bGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xuZnVuY3Rpb24gY29weVRvVGh1bmsodm5vZGUsIHRodW5rVk5vZGUpIHtcbiAgICB0aHVua1ZOb2RlLmVsbSA9IHZub2RlLmVsbTtcbiAgICB2bm9kZS5kYXRhLmZuID0gdGh1bmtWTm9kZS5kYXRhLmZuO1xuICAgIHZub2RlLmRhdGEuYXJncyA9IHRodW5rVk5vZGUuZGF0YS5hcmdzO1xuICAgIHZub2RlLmRhdGEuaXNvbGF0ZSA9IHRodW5rVk5vZGUuZGF0YS5pc29sYXRlO1xuICAgIHRodW5rVk5vZGUuZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgdGh1bmtWTm9kZS5jaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xuICAgIHRodW5rVk5vZGUudGV4dCA9IHZub2RlLnRleHQ7XG4gICAgdGh1bmtWTm9kZS5lbG0gPSB2bm9kZS5lbG07XG59XG5mdW5jdGlvbiBpbml0KHRodW5rVk5vZGUpIHtcbiAgICB2YXIgY3VyID0gdGh1bmtWTm9kZS5kYXRhO1xuICAgIHZhciB2bm9kZSA9IGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGN1ci5hcmdzKTtcbiAgICBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmtWTm9kZSk7XG59XG5mdW5jdGlvbiBwcmVwYXRjaChvbGRWbm9kZSwgdGh1bmtWTm9kZSkge1xuICAgIHZhciBvbGQgPSBvbGRWbm9kZS5kYXRhLCBjdXIgPSB0aHVua1ZOb2RlLmRhdGE7XG4gICAgdmFyIGk7XG4gICAgdmFyIG9sZEFyZ3MgPSBvbGQuYXJncywgYXJncyA9IGN1ci5hcmdzO1xuICAgIGlmIChvbGQuZm4gIT09IGN1ci5mbiB8fCBvbGRBcmdzLmxlbmd0aCAhPT0gYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rVk5vZGUpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAob2xkQXJnc1tpXSAhPT0gYXJnc1tpXSkge1xuICAgICAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rVk5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvcHlUb1RodW5rKG9sZFZub2RlLCB0aHVua1ZOb2RlKTtcbn1cbmZ1bmN0aW9uIHRodW5rKHNlbCwga2V5LCBmbiwgYXJncykge1xuICAgIGlmIChhcmdzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXJncyA9IGZuO1xuICAgICAgICBmbiA9IGtleTtcbiAgICAgICAga2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gaF8xLmgoc2VsLCB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBob29rOiB7IGluaXQ6IGluaXQsIHByZXBhdGNoOiBwcmVwYXRjaCB9LFxuICAgICAgICBmbjogZm4sXG4gICAgICAgIGFyZ3M6IGFyZ3MsXG4gICAgfSk7XG59XG5leHBvcnRzLnRodW5rID0gdGh1bms7XG5leHBvcnRzLmRlZmF1bHQgPSB0aHVuaztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRodW5rLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gaXNWYWxpZE5vZGUob2JqKSB7XG4gICAgdmFyIEVMRU1fVFlQRSA9IDE7XG4gICAgdmFyIEZSQUdfVFlQRSA9IDExO1xuICAgIHJldHVybiB0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdvYmplY3QnXG4gICAgICAgID8gb2JqIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgfHwgb2JqIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudFxuICAgICAgICA6IG9iaiAmJlxuICAgICAgICAgICAgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICAgIG9iaiAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgKG9iai5ub2RlVHlwZSA9PT0gRUxFTV9UWVBFIHx8IG9iai5ub2RlVHlwZSA9PT0gRlJBR19UWVBFKSAmJlxuICAgICAgICAgICAgdHlwZW9mIG9iai5ub2RlTmFtZSA9PT0gJ3N0cmluZyc7XG59XG5mdW5jdGlvbiBpc0NsYXNzT3JJZChzdHIpIHtcbiAgICByZXR1cm4gc3RyLmxlbmd0aCA+IDEgJiYgKHN0clswXSA9PT0gJy4nIHx8IHN0clswXSA9PT0gJyMnKTtcbn1cbmV4cG9ydHMuaXNDbGFzc09ySWQgPSBpc0NsYXNzT3JJZDtcbmZ1bmN0aW9uIGlzRG9jRnJhZyhlbCkge1xuICAgIHJldHVybiBlbC5ub2RlVHlwZSA9PT0gMTE7XG59XG5leHBvcnRzLmlzRG9jRnJhZyA9IGlzRG9jRnJhZztcbmZ1bmN0aW9uIGNoZWNrVmFsaWRDb250YWluZXIoY29udGFpbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBjb250YWluZXIgIT09ICdzdHJpbmcnICYmICFpc1ZhbGlkTm9kZShjb250YWluZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignR2l2ZW4gY29udGFpbmVyIGlzIG5vdCBhIERPTSBlbGVtZW50IG5laXRoZXIgYSBzZWxlY3RvciBzdHJpbmcuJyk7XG4gICAgfVxufVxuZXhwb3J0cy5jaGVja1ZhbGlkQ29udGFpbmVyID0gY2hlY2tWYWxpZENvbnRhaW5lcjtcbmZ1bmN0aW9uIGdldFZhbGlkTm9kZShzZWxlY3RvcnMpIHtcbiAgICB2YXIgZG9tRWxlbWVudCA9IHR5cGVvZiBzZWxlY3RvcnMgPT09ICdzdHJpbmcnXG4gICAgICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcnMpXG4gICAgICAgIDogc2VsZWN0b3JzO1xuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3JzID09PSAnc3RyaW5nJyAmJiBkb21FbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZW5kZXIgaW50byB1bmtub3duIGVsZW1lbnQgYFwiICsgc2VsZWN0b3JzICsgXCJgXCIpO1xuICAgIH1cbiAgICByZXR1cm4gZG9tRWxlbWVudDtcbn1cbmV4cG9ydHMuZ2V0VmFsaWROb2RlID0gZ2V0VmFsaWROb2RlO1xuZnVuY3Rpb24gZ2V0U2VsZWN0b3JzKG5hbWVzcGFjZSkge1xuICAgIHZhciByZXMgPSAnJztcbiAgICBmb3IgKHZhciBpID0gbmFtZXNwYWNlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGlmIChuYW1lc3BhY2VbaV0udHlwZSAhPT0gJ3NlbGVjdG9yJykge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzID0gbmFtZXNwYWNlW2ldLnNjb3BlICsgJyAnICsgcmVzO1xuICAgIH1cbiAgICByZXR1cm4gcmVzLnRyaW0oKTtcbn1cbmV4cG9ydHMuZ2V0U2VsZWN0b3JzID0gZ2V0U2VsZWN0b3JzO1xuZnVuY3Rpb24gaXNFcXVhbE5hbWVzcGFjZShhLCBiKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGEpIHx8ICFBcnJheS5pc0FycmF5KGIpIHx8IGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYVtpXS50eXBlICE9PSBiW2ldLnR5cGUgfHwgYVtpXS5zY29wZSAhPT0gYltpXS5zY29wZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0cy5pc0VxdWFsTmFtZXNwYWNlID0gaXNFcXVhbE5hbWVzcGFjZTtcbmZ1bmN0aW9uIG1ha2VJbnNlcnQobWFwKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0eXBlLCBlbG0sIHZhbHVlKSB7XG4gICAgICAgIGlmIChtYXAuaGFzKHR5cGUpKSB7XG4gICAgICAgICAgICB2YXIgaW5uZXJNYXAgPSBtYXAuZ2V0KHR5cGUpO1xuICAgICAgICAgICAgaW5uZXJNYXAuc2V0KGVsbSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGlubmVyTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgaW5uZXJNYXAuc2V0KGVsbSwgdmFsdWUpO1xuICAgICAgICAgICAgbWFwLnNldCh0eXBlLCBpbm5lck1hcCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlSW5zZXJ0ID0gbWFrZUluc2VydDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICB2YXIgZ2xvYmFsT2JqO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IGdsb2JhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHRoaXM7XG4gICAgfVxuICAgIGdsb2JhbE9iai5DeWNsZWpzID0gZ2xvYmFsT2JqLkN5Y2xlanMgfHwge307XG4gICAgZ2xvYmFsT2JqID0gZ2xvYmFsT2JqLkN5Y2xlanM7XG4gICAgZ2xvYmFsT2JqLmFkYXB0U3RyZWFtID0gZ2xvYmFsT2JqLmFkYXB0U3RyZWFtIHx8IChmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XG4gICAgcmV0dXJuIGdsb2JhbE9iajtcbn1cbmZ1bmN0aW9uIHNldEFkYXB0KGYpIHtcbiAgICBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbSA9IGY7XG59XG5leHBvcnRzLnNldEFkYXB0ID0gc2V0QWRhcHQ7XG5mdW5jdGlvbiBhZGFwdChzdHJlYW0pIHtcbiAgICByZXR1cm4gZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0oc3RyZWFtKTtcbn1cbmV4cG9ydHMuYWRhcHQgPSBhZGFwdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFkYXB0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGludGVybmFsc18xID0gcmVxdWlyZShcIi4vaW50ZXJuYWxzXCIpO1xuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgcHJlcGFyZXMgdGhlIEN5Y2xlIGFwcGxpY2F0aW9uIHRvIGJlIGV4ZWN1dGVkLiBUYWtlcyBhIGBtYWluYFxuICogZnVuY3Rpb24gYW5kIHByZXBhcmVzIHRvIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb24gb2ZcbiAqIGRyaXZlciBmdW5jdGlvbnMuIEFzIGFuIG91dHB1dCwgYHNldHVwKClgIHJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhyZWVcbiAqIHByb3BlcnRpZXM6IGBzb3VyY2VzYCwgYHNpbmtzYCBhbmQgYHJ1bmAuIE9ubHkgd2hlbiBgcnVuKClgIGlzIGNhbGxlZCB3aWxsXG4gKiB0aGUgYXBwbGljYXRpb24gYWN0dWFsbHkgZXhlY3V0ZS4gUmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgYHJ1bigpYCBmb3JcbiAqIG1vcmUgZGV0YWlscy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQge3NldHVwfSBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IHtzb3VyY2VzLCBzaW5rcywgcnVufSA9IHNldHVwKG1haW4sIGRyaXZlcnMpO1xuICogLy8gLi4uXG4gKiBjb25zdCBkaXNwb3NlID0gcnVuKCk7IC8vIEV4ZWN1dGVzIHRoZSBhcHBsaWNhdGlvblxuICogLy8gLi4uXG4gKiBkaXNwb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCB0aHJlZSBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kXG4gKiBgcnVuYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgc2lua3NgIGlzIHRoZVxuICogY29sbGVjdGlvbiBvZiBkcml2ZXIgc2lua3MsIHRoZXNlIGNhbiBiZSB1c2VkIGZvciBkZWJ1Z2dpbmcgb3IgdGVzdGluZy4gYHJ1bmBcbiAqIGlzIHRoZSBmdW5jdGlvbiB0aGF0IG9uY2UgY2FsbGVkIHdpbGwgZXhlY3V0ZSB0aGUgYXBwbGljYXRpb24uXG4gKiBAZnVuY3Rpb24gc2V0dXBcbiAqL1xuZnVuY3Rpb24gc2V0dXAobWFpbiwgZHJpdmVycykge1xuICAgIGlmICh0eXBlb2YgbWFpbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgdGhlICdtYWluJyBcIiArIFwiZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRyaXZlcnMgIT09IFwib2JqZWN0XCIgfHwgZHJpdmVycyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGRyaXZlciBmdW5jdGlvbnMgYXMgcHJvcGVydGllcy5cIik7XG4gICAgfVxuICAgIGlmIChpbnRlcm5hbHNfMS5pc09iamVjdEVtcHR5KGRyaXZlcnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIGVuZ2luZSA9IHNldHVwUmV1c2FibGUoZHJpdmVycyk7XG4gICAgdmFyIHNpbmtzID0gbWFpbihlbmdpbmUuc291cmNlcyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHdpbmRvdy5DeWNsZWpzID0gd2luZG93LkN5Y2xlanMgfHwge307XG4gICAgICAgIHdpbmRvdy5DeWNsZWpzLnNpbmtzID0gc2lua3M7XG4gICAgfVxuICAgIGZ1bmN0aW9uIF9ydW4oKSB7XG4gICAgICAgIHZhciBkaXNwb3NlUnVuID0gZW5naW5lLnJ1bihzaW5rcyk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICAgICAgZGlzcG9zZVJ1bigpO1xuICAgICAgICAgICAgZW5naW5lLmRpc3Bvc2UoKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc2lua3M6IHNpbmtzLCBzb3VyY2VzOiBlbmdpbmUuc291cmNlcywgcnVuOiBfcnVuIH07XG59XG5leHBvcnRzLnNldHVwID0gc2V0dXA7XG4vKipcbiAqIEEgcGFydGlhbGx5LWFwcGxpZWQgdmFyaWFudCBvZiBzZXR1cCgpIHdoaWNoIGFjY2VwdHMgb25seSB0aGUgZHJpdmVycywgYW5kXG4gKiBhbGxvd3MgbWFueSBgbWFpbmAgZnVuY3Rpb25zIHRvIGV4ZWN1dGUgYW5kIHJldXNlIHRoaXMgc2FtZSBzZXQgb2YgZHJpdmVycy5cbiAqXG4gKiBUYWtlcyBhbiBvYmplY3Qgd2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIGlucHV0LCBhbmQgb3V0cHV0cyBhbiBvYmplY3Qgd2hpY2hcbiAqIGNvbnRhaW5zIHRoZSBnZW5lcmF0ZWQgc291cmNlcyAoZnJvbSB0aG9zZSBkcml2ZXJzKSBhbmQgYSBgcnVuYCBmdW5jdGlvblxuICogKHdoaWNoIGluIHR1cm4gZXhwZWN0cyBzaW5rcyBhcyBhcmd1bWVudCkuIFRoaXMgYHJ1bmAgZnVuY3Rpb24gY2FuIGJlIGNhbGxlZFxuICogbXVsdGlwbGUgdGltZXMgd2l0aCBkaWZmZXJlbnQgYXJndW1lbnRzLCBhbmQgaXQgd2lsbCByZXVzZSB0aGUgZHJpdmVycyB0aGF0XG4gKiB3ZXJlIHBhc3NlZCB0byBgc2V0dXBSZXVzYWJsZWAuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtzZXR1cFJldXNhYmxlfSBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IHtzb3VyY2VzLCBydW4sIGRpc3Bvc2V9ID0gc2V0dXBSZXVzYWJsZShkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogY29uc3Qgc2lua3MgPSBtYWluKHNvdXJjZXMpO1xuICogY29uc3QgZGlzcG9zZVJ1biA9IHJ1bihzaW5rcyk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2VSdW4oKTtcbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpOyAvLyBlbmRzIHRoZSByZXVzYWJpbGl0eSBvZiBkcml2ZXJzXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCB0aHJlZSBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBydW5gIGFuZFxuICogYGRpc3Bvc2VgLiBgc291cmNlc2AgaXMgdGhlIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNvdXJjZXMsIGBydW5gIGlzIHRoZVxuICogZnVuY3Rpb24gdGhhdCBvbmNlIGNhbGxlZCB3aXRoICdzaW5rcycgYXMgYXJndW1lbnQsIHdpbGwgZXhlY3V0ZSB0aGVcbiAqIGFwcGxpY2F0aW9uLCB0eWluZyB0b2dldGhlciBzb3VyY2VzIHdpdGggc2lua3MuIGBkaXNwb3NlYCB0ZXJtaW5hdGVzIHRoZVxuICogcmV1c2FibGUgcmVzb3VyY2VzIHVzZWQgYnkgdGhlIGRyaXZlcnMuIE5vdGUgYWxzbyB0aGF0IGBydW5gIHJldHVybnMgYVxuICogZGlzcG9zZSBmdW5jdGlvbiB3aGljaCB0ZXJtaW5hdGVzIHJlc291cmNlcyB0aGF0IGFyZSBzcGVjaWZpYyAobm90IHJldXNhYmxlKVxuICogdG8gdGhhdCBydW4uXG4gKiBAZnVuY3Rpb24gc2V0dXBSZXVzYWJsZVxuICovXG5mdW5jdGlvbiBzZXR1cFJldXNhYmxlKGRyaXZlcnMpIHtcbiAgICBpZiAodHlwZW9mIGRyaXZlcnMgIT09IFwib2JqZWN0XCIgfHwgZHJpdmVycyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBnaXZlbiB0byBzZXR1cFJldXNhYmxlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMuXCIpO1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWxzXzEuaXNPYmplY3RFbXB0eShkcml2ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBnaXZlbiB0byBzZXR1cFJldXNhYmxlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBhdCBsZWFzdCBvbmUgZHJpdmVyIGZ1bmN0aW9uIGRlY2xhcmVkIGFzIGEgcHJvcGVydHkuXCIpO1xuICAgIH1cbiAgICB2YXIgc2lua1Byb3hpZXMgPSBpbnRlcm5hbHNfMS5tYWtlU2lua1Byb3hpZXMoZHJpdmVycyk7XG4gICAgdmFyIHJhd1NvdXJjZXMgPSBpbnRlcm5hbHNfMS5jYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcyk7XG4gICAgdmFyIHNvdXJjZXMgPSBpbnRlcm5hbHNfMS5hZGFwdFNvdXJjZXMocmF3U291cmNlcyk7XG4gICAgZnVuY3Rpb24gX3J1bihzaW5rcykge1xuICAgICAgICByZXR1cm4gaW50ZXJuYWxzXzEucmVwbGljYXRlTWFueShzaW5rcywgc2lua1Byb3hpZXMpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkaXNwb3NlRW5naW5lKCkge1xuICAgICAgICBpbnRlcm5hbHNfMS5kaXNwb3NlU291cmNlcyhzb3VyY2VzKTtcbiAgICAgICAgaW50ZXJuYWxzXzEuZGlzcG9zZVNpbmtQcm94aWVzKHNpbmtQcm94aWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc291cmNlczogc291cmNlcywgcnVuOiBfcnVuLCBkaXNwb3NlOiBkaXNwb3NlRW5naW5lIH07XG59XG5leHBvcnRzLnNldHVwUmV1c2FibGUgPSBzZXR1cFJldXNhYmxlO1xuLyoqXG4gKiBUYWtlcyBhIGBtYWluYCBmdW5jdGlvbiBhbmQgY2lyY3VsYXJseSBjb25uZWN0cyBpdCB0byB0aGUgZ2l2ZW4gY29sbGVjdGlvblxuICogb2YgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQgcnVuIGZyb20gJ0BjeWNsZS9ydW4nO1xuICogY29uc3QgZGlzcG9zZSA9IHJ1bihtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogVGhlIGBtYWluYCBmdW5jdGlvbiBleHBlY3RzIGEgY29sbGVjdGlvbiBvZiBcInNvdXJjZVwiIHN0cmVhbXMgKHJldHVybmVkIGZyb21cbiAqIGRyaXZlcnMpIGFzIGlucHV0LCBhbmQgc2hvdWxkIHJldHVybiBhIGNvbGxlY3Rpb24gb2YgXCJzaW5rXCIgc3RyZWFtcyAodG8gYmVcbiAqIGdpdmVuIHRvIGRyaXZlcnMpLiBBIFwiY29sbGVjdGlvbiBvZiBzdHJlYW1zXCIgaXMgYSBKYXZhU2NyaXB0IG9iamVjdCB3aGVyZVxuICoga2V5cyBtYXRjaCB0aGUgZHJpdmVyIG5hbWVzIHJlZ2lzdGVyZWQgYnkgdGhlIGBkcml2ZXJzYCBvYmplY3QsIGFuZCB2YWx1ZXNcbiAqIGFyZSB0aGUgc3RyZWFtcy4gUmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgZWFjaCBkcml2ZXIgdG8gc2VlIG1vcmVcbiAqIGRldGFpbHMgb24gd2hhdCB0eXBlcyBvZiBzb3VyY2VzIGl0IG91dHB1dHMgYW5kIHNpbmtzIGl0IHJlY2VpdmVzLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1haW4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dCBhbmQgb3V0cHV0c1xuICogYHNpbmtzYC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkcml2ZXJzIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBkcml2ZXIgbmFtZXMgYW5kIHZhbHVlc1xuICogYXJlIGRyaXZlciBmdW5jdGlvbnMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBkaXNwb3NlIGZ1bmN0aW9uLCB1c2VkIHRvIHRlcm1pbmF0ZSB0aGUgZXhlY3V0aW9uIG9mIHRoZVxuICogQ3ljbGUuanMgcHJvZ3JhbSwgY2xlYW5pbmcgdXAgcmVzb3VyY2VzIHVzZWQuXG4gKiBAZnVuY3Rpb24gcnVuXG4gKi9cbmZ1bmN0aW9uIHJ1bihtYWluLCBkcml2ZXJzKSB7XG4gICAgdmFyIHByb2dyYW0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgd2luZG93LkN5Y2xlanNEZXZUb29sX3N0YXJ0R3JhcGhTZXJpYWxpemVyKSB7XG4gICAgICAgIHdpbmRvdy5DeWNsZWpzRGV2VG9vbF9zdGFydEdyYXBoU2VyaWFsaXplcihwcm9ncmFtLnNpbmtzKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2dyYW0ucnVuKCk7XG59XG5leHBvcnRzLnJ1biA9IHJ1bjtcbmV4cG9ydHMuZGVmYXVsdCA9IHJ1bjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIHF1aWNrdGFza18xID0gcmVxdWlyZShcInF1aWNrdGFza1wiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIi4vYWRhcHRcIik7XG52YXIgc2NoZWR1bGVNaWNyb3Rhc2sgPSBxdWlja3Rhc2tfMS5kZWZhdWx0KCk7XG5mdW5jdGlvbiBtYWtlU2lua1Byb3hpZXMoZHJpdmVycykge1xuICAgIHZhciBzaW5rUHJveGllcyA9IHt9O1xuICAgIGZvciAodmFyIG5hbWVfMSBpbiBkcml2ZXJzKSB7XG4gICAgICAgIGlmIChkcml2ZXJzLmhhc093blByb3BlcnR5KG5hbWVfMSkpIHtcbiAgICAgICAgICAgIHNpbmtQcm94aWVzW25hbWVfMV0gPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2lua1Byb3hpZXM7XG59XG5leHBvcnRzLm1ha2VTaW5rUHJveGllcyA9IG1ha2VTaW5rUHJveGllcztcbmZ1bmN0aW9uIGNhbGxEcml2ZXJzKGRyaXZlcnMsIHNpbmtQcm94aWVzKSB7XG4gICAgdmFyIHNvdXJjZXMgPSB7fTtcbiAgICBmb3IgKHZhciBuYW1lXzIgaW4gZHJpdmVycykge1xuICAgICAgICBpZiAoZHJpdmVycy5oYXNPd25Qcm9wZXJ0eShuYW1lXzIpKSB7XG4gICAgICAgICAgICBzb3VyY2VzW25hbWVfMl0gPSBkcml2ZXJzW25hbWVfMl0oc2lua1Byb3hpZXNbbmFtZV8yXSwgbmFtZV8yKTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VzW25hbWVfMl0gJiYgdHlwZW9mIHNvdXJjZXNbbmFtZV8yXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBzb3VyY2VzW25hbWVfMl0uX2lzQ3ljbGVTb3VyY2UgPSBuYW1lXzI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZXM7XG59XG5leHBvcnRzLmNhbGxEcml2ZXJzID0gY2FsbERyaXZlcnM7XG4vLyBOT1RFOiB0aGlzIHdpbGwgbXV0YXRlIGBzb3VyY2VzYC5cbmZ1bmN0aW9uIGFkYXB0U291cmNlcyhzb3VyY2VzKSB7XG4gICAgZm9yICh2YXIgbmFtZV8zIGluIHNvdXJjZXMpIHtcbiAgICAgICAgaWYgKHNvdXJjZXMuaGFzT3duUHJvcGVydHkobmFtZV8zKSAmJlxuICAgICAgICAgICAgc291cmNlc1tuYW1lXzNdICYmXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlc1tuYW1lXzNdLnNoYW1lZnVsbHlTZW5kTmV4dCA9PT1cbiAgICAgICAgICAgICAgICAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzb3VyY2VzW25hbWVfM10gPSBhZGFwdF8xLmFkYXB0KHNvdXJjZXNbbmFtZV8zXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZXM7XG59XG5leHBvcnRzLmFkYXB0U291cmNlcyA9IGFkYXB0U291cmNlcztcbmZ1bmN0aW9uIHJlcGxpY2F0ZU1hbnkoc2lua3MsIHNpbmtQcm94aWVzKSB7XG4gICAgdmFyIHNpbmtOYW1lcyA9IE9iamVjdC5rZXlzKHNpbmtzKS5maWx0ZXIoZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuICEhc2lua1Byb3hpZXNbbmFtZV07IH0pO1xuICAgIHZhciBidWZmZXJzID0ge307XG4gICAgdmFyIHJlcGxpY2F0b3JzID0ge307XG4gICAgc2lua05hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgYnVmZmVyc1tuYW1lXSA9IHsgX246IFtdLCBfZTogW10gfTtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0gPSB7XG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoeCkgeyByZXR1cm4gYnVmZmVyc1tuYW1lXS5fbi5wdXNoKHgpOyB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHsgcmV0dXJuIGJ1ZmZlcnNbbmFtZV0uX2UucHVzaChlcnIpOyB9LFxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IHNpbmtOYW1lcy5tYXAoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW25hbWVdKS5zdWJzY3JpYmUocmVwbGljYXRvcnNbbmFtZV0pO1xuICAgIH0pO1xuICAgIHNpbmtOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lciA9IHNpbmtQcm94aWVzW25hbWVdO1xuICAgICAgICB2YXIgbmV4dCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBzY2hlZHVsZU1pY3JvdGFzayhmdW5jdGlvbiAoKSB7IHJldHVybiBsaXN0ZW5lci5fbih4KTsgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIHNjaGVkdWxlTWljcm90YXNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAoY29uc29sZS5lcnJvciB8fCBjb25zb2xlLmxvZykoZXJyKTtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5fZShlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0uX24uZm9yRWFjaChuZXh0KTtcbiAgICAgICAgYnVmZmVyc1tuYW1lXS5fZS5mb3JFYWNoKGVycm9yKTtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0ubmV4dCA9IG5leHQ7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLmVycm9yID0gZXJyb3I7XG4gICAgICAgIC8vIGJlY2F1c2Ugc2luay5zdWJzY3JpYmUocmVwbGljYXRvcikgaGFkIG11dGF0ZWQgcmVwbGljYXRvciB0byBhZGRcbiAgICAgICAgLy8gX24sIF9lLCBfYywgd2UgbXVzdCBhbHNvIHVwZGF0ZSB0aGVzZTpcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uX24gPSBuZXh0O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5fZSA9IGVycm9yO1xuICAgIH0pO1xuICAgIGJ1ZmZlcnMgPSBudWxsOyAvLyBmcmVlIHVwIGZvciBHQ1xuICAgIHJldHVybiBmdW5jdGlvbiBkaXNwb3NlUmVwbGljYXRpb24oKSB7XG4gICAgICAgIHN1YnNjcmlwdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAocykgeyByZXR1cm4gcy51bnN1YnNjcmliZSgpOyB9KTtcbiAgICB9O1xufVxuZXhwb3J0cy5yZXBsaWNhdGVNYW55ID0gcmVwbGljYXRlTWFueTtcbmZ1bmN0aW9uIGRpc3Bvc2VTaW5rUHJveGllcyhzaW5rUHJveGllcykge1xuICAgIE9iamVjdC5rZXlzKHNpbmtQcm94aWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBzaW5rUHJveGllc1tuYW1lXS5fYygpOyB9KTtcbn1cbmV4cG9ydHMuZGlzcG9zZVNpbmtQcm94aWVzID0gZGlzcG9zZVNpbmtQcm94aWVzO1xuZnVuY3Rpb24gZGlzcG9zZVNvdXJjZXMoc291cmNlcykge1xuICAgIGZvciAodmFyIGsgaW4gc291cmNlcykge1xuICAgICAgICBpZiAoc291cmNlcy5oYXNPd25Qcm9wZXJ0eShrKSAmJlxuICAgICAgICAgICAgc291cmNlc1trXSAmJlxuICAgICAgICAgICAgc291cmNlc1trXS5kaXNwb3NlKSB7XG4gICAgICAgICAgICBzb3VyY2VzW2tdLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuZGlzcG9zZVNvdXJjZXMgPSBkaXNwb3NlU291cmNlcztcbmZ1bmN0aW9uIGlzT2JqZWN0RW1wdHkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuZXhwb3J0cy5pc09iamVjdEVtcHR5ID0gaXNPYmplY3RFbXB0eTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWludGVybmFscy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfTtcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBpc29sYXRlXzEgPSByZXF1aXJlKFwiQGN5Y2xlL2lzb2xhdGVcIik7XG52YXIgcGlja01lcmdlXzEgPSByZXF1aXJlKFwiLi9waWNrTWVyZ2VcIik7XG52YXIgcGlja0NvbWJpbmVfMSA9IHJlcXVpcmUoXCIuL3BpY2tDb21iaW5lXCIpO1xuLyoqXG4gKiBBbiBvYmplY3QgcmVwcmVzZW50aW5nIGFsbCBpbnN0YW5jZXMgaW4gYSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuIEhhcyB0aGVcbiAqIG1ldGhvZHMgcGlja0NvbWJpbmUgYW5kIHBpY2tNZXJnZSB0byBnZXQgdGhlIGNvbWJpbmVkIHNpbmtzIG9mIGFsbCBpbnN0YW5jZXMuXG4gKi9cbnZhciBJbnN0YW5jZXMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSW5zdGFuY2VzKGluc3RhbmNlcyQpIHtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VzJCA9IGluc3RhbmNlcyQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIExpa2UgYG1lcmdlYCBpbiB4c3RyZWFtLCB0aGlzIG9wZXJhdG9yIGJsZW5kcyBtdWx0aXBsZSBzdHJlYW1zIHRvZ2V0aGVyLCBidXRcbiAgICAgKiBwaWNrcyB0aG9zZSBzdHJlYW1zIGZyb20gYSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudCBpbnN0YW5jZXMuXG4gICAgICpcbiAgICAgKiBVc2UgdGhlIGBzZWxlY3RvcmAgc3RyaW5nIHRvIHBpY2sgYSBzdHJlYW0gZnJvbSB0aGUgc2lua3Mgb2JqZWN0IG9mIGVhY2hcbiAgICAgKiBjb21wb25lbnQgaW5zdGFuY2UsIHRoZW4gcGlja01lcmdlIHdpbGwgbWVyZ2UgYWxsIHRob3NlIHBpY2tlZCBzdHJlYW1zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIGEgbmFtZSBvZiBhIGNoYW5uZWwgaW4gYSBzaW5rcyBvYmplY3QgYmVsb25naW5nIHRvXG4gICAgICogZWFjaCBjb21wb25lbnQgaW4gdGhlIGNvbGxlY3Rpb24gb2YgY29tcG9uZW50cy5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYW4gb3BlcmF0b3IgdG8gYmUgdXNlZCB3aXRoIHhzdHJlYW0ncyBgY29tcG9zZWAgbWV0aG9kLlxuICAgICAqL1xuICAgIEluc3RhbmNlcy5wcm90b3R5cGUucGlja01lcmdlID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KHRoaXMuX2luc3RhbmNlcyQuY29tcG9zZShwaWNrTWVyZ2VfMS5waWNrTWVyZ2Uoc2VsZWN0b3IpKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBMaWtlIGBjb21iaW5lYCBpbiB4c3RyZWFtLCB0aGlzIG9wZXJhdG9yIGNvbWJpbmVzIG11bHRpcGxlIHN0cmVhbXMgdG9nZXRoZXIsXG4gICAgICogYnV0IHBpY2tzIHRob3NlIHN0cmVhbXMgZnJvbSBhIGNvbGxlY3Rpb24gb2YgY29tcG9uZW50IGluc3RhbmNlcy5cbiAgICAgKlxuICAgICAqIFVzZSB0aGUgYHNlbGVjdG9yYCBzdHJpbmcgdG8gcGljayBhIHN0cmVhbSBmcm9tIHRoZSBzaW5rcyBvYmplY3Qgb2YgZWFjaFxuICAgICAqIGNvbXBvbmVudCBpbnN0YW5jZSwgdGhlbiBwaWNrQ29tYmluZSB3aWxsIGNvbWJpbmUgYWxsIHRob3NlIHBpY2tlZCBzdHJlYW1zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIGEgbmFtZSBvZiBhIGNoYW5uZWwgaW4gYSBzaW5rcyBvYmplY3QgYmVsb25naW5nIHRvXG4gICAgICogZWFjaCBjb21wb25lbnQgaW4gdGhlIGNvbGxlY3Rpb24gb2YgY29tcG9uZW50cy5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYW4gb3BlcmF0b3IgdG8gYmUgdXNlZCB3aXRoIHhzdHJlYW0ncyBgY29tcG9zZWAgbWV0aG9kLlxuICAgICAqL1xuICAgIEluc3RhbmNlcy5wcm90b3R5cGUucGlja0NvbWJpbmUgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGFkYXB0XzEuYWRhcHQodGhpcy5faW5zdGFuY2VzJC5jb21wb3NlKHBpY2tDb21iaW5lXzEucGlja0NvbWJpbmUoc2VsZWN0b3IpKSk7XG4gICAgfTtcbiAgICByZXR1cm4gSW5zdGFuY2VzO1xufSgpKTtcbmV4cG9ydHMuSW5zdGFuY2VzID0gSW5zdGFuY2VzO1xuZnVuY3Rpb24gZGVmYXVsdEl0ZW1TY29wZShrZXkpIHtcbiAgICByZXR1cm4geyAnKic6IG51bGwgfTtcbn1cbmZ1bmN0aW9uIGluc3RhbmNlTGVucyhpdGVtS2V5LCBrZXkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGFyci5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiXCIgKyBpdGVtS2V5KGFycltpXSwgaSkgPT09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFycltpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChhcnIsIGl0ZW0pIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBbaXRlbV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgaXRlbSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAocywgaSkgeyByZXR1cm4gXCJcIiArIGl0ZW1LZXkocywgaSkgIT09IGtleTsgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyLm1hcChmdW5jdGlvbiAocywgaSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJcIiArIGl0ZW1LZXkocywgaSkgPT09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG59XG52YXIgaWRlbnRpdHlMZW5zID0ge1xuICAgIGdldDogZnVuY3Rpb24gKG91dGVyKSB7IHJldHVybiBvdXRlcjsgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIChvdXRlciwgaW5uZXIpIHsgcmV0dXJuIGlubmVyOyB9LFxufTtcbmZ1bmN0aW9uIG1ha2VDb2xsZWN0aW9uKG9wdHMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gY29sbGVjdGlvbkNvbXBvbmVudChzb3VyY2VzKSB7XG4gICAgICAgIHZhciBuYW1lID0gb3B0cy5jaGFubmVsIHx8ICdzdGF0ZSc7XG4gICAgICAgIHZhciBpdGVtS2V5ID0gb3B0cy5pdGVtS2V5O1xuICAgICAgICB2YXIgaXRlbVNjb3BlID0gb3B0cy5pdGVtU2NvcGUgfHwgZGVmYXVsdEl0ZW1TY29wZTtcbiAgICAgICAgdmFyIGl0ZW1Db21wID0gb3B0cy5pdGVtO1xuICAgICAgICB2YXIgc3RhdGUkID0geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlc1tuYW1lXS5zdHJlYW0pO1xuICAgICAgICB2YXIgaW5zdGFuY2VzJCA9IHN0YXRlJC5mb2xkKGZ1bmN0aW9uIChhY2MsIG5leHRTdGF0ZSkge1xuICAgICAgICAgICAgdmFyIF9hLCBfYiwgX2MsIF9kO1xuICAgICAgICAgICAgdmFyIGRpY3QgPSBhY2MuZGljdDtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5leHRTdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEluc3RBcnJheSA9IEFycmF5KG5leHRTdGF0ZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHZhciBuZXh0S2V5c18xID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgICAgIC8vIGFkZFxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gbmV4dFN0YXRlLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gXCJcIiArIChpdGVtS2V5ID8gaXRlbUtleShuZXh0U3RhdGVbaV0sIGkpIDogaSk7XG4gICAgICAgICAgICAgICAgICAgIG5leHRLZXlzXzEuYWRkKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZGljdC5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlU2NvcGUgPSBpdGVtS2V5ID8gaW5zdGFuY2VMZW5zKGl0ZW1LZXksIGtleSkgOiBcIlwiICsgaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvdGhlclNjb3BlcyA9IGl0ZW1TY29wZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjb3BlcyA9IHR5cGVvZiBvdGhlclNjb3BlcyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IChfYSA9IHsgJyonOiBvdGhlclNjb3BlcyB9LCBfYVtuYW1lXSA9IHN0YXRlU2NvcGUsIF9hKSA6IF9fYXNzaWduKHt9LCBvdGhlclNjb3BlcywgKF9iID0ge30sIF9iW25hbWVdID0gc3RhdGVTY29wZSwgX2IpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaW5rcyA9IGlzb2xhdGVfMS5kZWZhdWx0KGl0ZW1Db21wLCBzY29wZXMpKHNvdXJjZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGljdC5zZXQoa2V5LCBzaW5rcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0SW5zdEFycmF5W2ldID0gc2lua3M7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0SW5zdEFycmF5W2ldID0gZGljdC5nZXQoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXh0SW5zdEFycmF5W2ldLl9rZXkgPSBrZXk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZVxuICAgICAgICAgICAgICAgIGRpY3QuZm9yRWFjaChmdW5jdGlvbiAoXywga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbmV4dEtleXNfMS5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGljdC5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG5leHRLZXlzXzEuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBkaWN0OiBkaWN0LCBhcnI6IG5leHRJbnN0QXJyYXkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpY3QuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gXCJcIiArIChpdGVtS2V5ID8gaXRlbUtleShuZXh0U3RhdGUsIDApIDogJ3RoaXMnKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdGVTY29wZSA9IGlkZW50aXR5TGVucztcbiAgICAgICAgICAgICAgICB2YXIgb3RoZXJTY29wZXMgPSBpdGVtU2NvcGUoa2V5KTtcbiAgICAgICAgICAgICAgICB2YXIgc2NvcGVzID0gdHlwZW9mIG90aGVyU2NvcGVzID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICA/IChfYyA9IHsgJyonOiBvdGhlclNjb3BlcyB9LCBfY1tuYW1lXSA9IHN0YXRlU2NvcGUsIF9jKSA6IF9fYXNzaWduKHt9LCBvdGhlclNjb3BlcywgKF9kID0ge30sIF9kW25hbWVdID0gc3RhdGVTY29wZSwgX2QpKTtcbiAgICAgICAgICAgICAgICB2YXIgc2lua3MgPSBpc29sYXRlXzEuZGVmYXVsdChpdGVtQ29tcCwgc2NvcGVzKShzb3VyY2VzKTtcbiAgICAgICAgICAgICAgICBkaWN0LnNldChrZXksIHNpbmtzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBkaWN0OiBkaWN0LCBhcnI6IFtzaW5rc10gfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBkaWN0OiBuZXcgTWFwKCksIGFycjogW10gfSk7XG4gICAgICAgIHJldHVybiBvcHRzLmNvbGxlY3RTaW5rcyhuZXcgSW5zdGFuY2VzKGluc3RhbmNlcyQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlQ29sbGVjdGlvbiA9IG1ha2VDb2xsZWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q29sbGVjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfTtcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgZHJvcFJlcGVhdHNfMSA9IHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG5mdW5jdGlvbiB1cGRhdGVBcnJheUVudHJ5KGFycmF5LCBzY29wZSwgbmV3VmFsKSB7XG4gICAgaWYgKG5ld1ZhbCA9PT0gYXJyYXlbc2NvcGVdKSB7XG4gICAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG4gICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoc2NvcGUpO1xuICAgIGlmICh0eXBlb2YgbmV3VmFsID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gYXJyYXkuZmlsdGVyKGZ1bmN0aW9uIChfdmFsLCBpKSB7IHJldHVybiBpICE9PSBpbmRleDsgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheS5tYXAoZnVuY3Rpb24gKHZhbCwgaSkgeyByZXR1cm4gKGkgPT09IGluZGV4ID8gbmV3VmFsIDogdmFsKTsgfSk7XG59XG5mdW5jdGlvbiBtYWtlR2V0dGVyKHNjb3BlKSB7XG4gICAgaWYgKHR5cGVvZiBzY29wZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHNjb3BlID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbGVuc0dldChzdGF0ZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlW3Njb3BlXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBzY29wZS5nZXQ7XG4gICAgfVxufVxuZnVuY3Rpb24gbWFrZVNldHRlcihzY29wZSkge1xuICAgIGlmICh0eXBlb2Ygc2NvcGUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzY29wZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGxlbnNTZXQoc3RhdGUsIGNoaWxkU3RhdGUpIHtcbiAgICAgICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXBkYXRlQXJyYXlFbnRyeShzdGF0ZSwgc2NvcGUsIGNoaWxkU3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIHN0YXRlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfYSA9IHt9LCBfYVtzY29wZV0gPSBjaGlsZFN0YXRlLCBfYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfX2Fzc2lnbih7fSwgc3RhdGUsIChfYiA9IHt9LCBfYltzY29wZV0gPSBjaGlsZFN0YXRlLCBfYikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNjb3BlLnNldDtcbiAgICB9XG59XG5mdW5jdGlvbiBpc29sYXRlU291cmNlKHNvdXJjZSwgc2NvcGUpIHtcbiAgICByZXR1cm4gc291cmNlLnNlbGVjdChzY29wZSk7XG59XG5leHBvcnRzLmlzb2xhdGVTb3VyY2UgPSBpc29sYXRlU291cmNlO1xuZnVuY3Rpb24gaXNvbGF0ZVNpbmsoaW5uZXJSZWR1Y2VyJCwgc2NvcGUpIHtcbiAgICB2YXIgZ2V0ID0gbWFrZUdldHRlcihzY29wZSk7XG4gICAgdmFyIHNldCA9IG1ha2VTZXR0ZXIoc2NvcGUpO1xuICAgIHJldHVybiBpbm5lclJlZHVjZXIkLm1hcChmdW5jdGlvbiAoaW5uZXJSZWR1Y2VyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBvdXRlclJlZHVjZXIob3V0ZXIpIHtcbiAgICAgICAgICAgIHZhciBwcmV2SW5uZXIgPSBnZXQob3V0ZXIpO1xuICAgICAgICAgICAgdmFyIG5leHRJbm5lciA9IGlubmVyUmVkdWNlcihwcmV2SW5uZXIpO1xuICAgICAgICAgICAgaWYgKHByZXZJbm5lciA9PT0gbmV4dElubmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldChvdXRlciwgbmV4dElubmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcbn1cbmV4cG9ydHMuaXNvbGF0ZVNpbmsgPSBpc29sYXRlU2luaztcbi8qKlxuICogUmVwcmVzZW50cyBhIHBpZWNlIG9mIGFwcGxpY2F0aW9uIHN0YXRlIGR5bmFtaWNhbGx5IGNoYW5naW5nIG92ZXIgdGltZS5cbiAqL1xudmFyIFN0YXRlU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0YXRlU291cmNlKHN0cmVhbSwgbmFtZSkge1xuICAgICAgICB0aGlzLmlzb2xhdGVTb3VyY2UgPSBpc29sYXRlU291cmNlO1xuICAgICAgICB0aGlzLmlzb2xhdGVTaW5rID0gaXNvbGF0ZVNpbms7XG4gICAgICAgIHRoaXMuX3N0cmVhbSA9IHN0cmVhbVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gdHlwZW9mIHMgIT09ICd1bmRlZmluZWQnOyB9KVxuICAgICAgICAgICAgLmNvbXBvc2UoZHJvcFJlcGVhdHNfMS5kZWZhdWx0KCkpXG4gICAgICAgICAgICAucmVtZW1iZXIoKTtcbiAgICAgICAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuc3RyZWFtID0gYWRhcHRfMS5hZGFwdCh0aGlzLl9zdHJlYW0pO1xuICAgICAgICB0aGlzLl9zdHJlYW0uX2lzQ3ljbGVTb3VyY2UgPSBuYW1lO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZWxlY3RzIGEgcGFydCAob3Igc2NvcGUpIG9mIHRoZSBzdGF0ZSBvYmplY3QgYW5kIHJldHVybnMgYSBuZXcgU3RhdGVTb3VyY2VcbiAgICAgKiBkeW5hbWljYWxseSByZXByZXNlbnRpbmcgdGhhdCBzZWxlY3RlZCBwYXJ0IG9mIHRoZSBzdGF0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxsZW5zfSBzY29wZSBhcyBhIHN0cmluZywgdGhpcyBhcmd1bWVudCByZXByZXNlbnRzIHRoZVxuICAgICAqIHByb3BlcnR5IHlvdSB3YW50IHRvIHNlbGVjdCBmcm9tIHRoZSBzdGF0ZSBvYmplY3QuIEFzIGEgbnVtYmVyLCB0aGlzXG4gICAgICogcmVwcmVzZW50cyB0aGUgYXJyYXkgaW5kZXggeW91IHdhbnQgdG8gc2VsZWN0IGZyb20gdGhlIHN0YXRlIGFycmF5LiBBcyBhXG4gICAgICogbGVucyBvYmplY3QgKGFuIG9iamVjdCB3aXRoIGdldCgpIGFuZCBzZXQoKSksIHRoaXMgYXJndW1lbnQgcmVwcmVzZW50cyBhbnlcbiAgICAgKiBjdXN0b20gd2F5IG9mIHNlbGVjdGluZyBzb21ldGhpbmcgZnJvbSB0aGUgc3RhdGUgb2JqZWN0LlxuICAgICAqL1xuICAgIFN0YXRlU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgdmFyIGdldCA9IG1ha2VHZXR0ZXIoc2NvcGUpO1xuICAgICAgICByZXR1cm4gbmV3IFN0YXRlU291cmNlKHRoaXMuX3N0cmVhbS5tYXAoZ2V0KSwgdGhpcy5fbmFtZSk7XG4gICAgfTtcbiAgICByZXR1cm4gU3RhdGVTb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5TdGF0ZVNvdXJjZSA9IFN0YXRlU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3RhdGVTb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU3RhdGVTb3VyY2VfMSA9IHJlcXVpcmUoXCIuL1N0YXRlU291cmNlXCIpO1xuZXhwb3J0cy5TdGF0ZVNvdXJjZSA9IFN0YXRlU291cmNlXzEuU3RhdGVTb3VyY2U7XG5leHBvcnRzLmlzb2xhdGVTb3VyY2UgPSBTdGF0ZVNvdXJjZV8xLmlzb2xhdGVTb3VyY2U7XG5leHBvcnRzLmlzb2xhdGVTaW5rID0gU3RhdGVTb3VyY2VfMS5pc29sYXRlU2luaztcbnZhciBDb2xsZWN0aW9uXzEgPSByZXF1aXJlKFwiLi9Db2xsZWN0aW9uXCIpO1xuZXhwb3J0cy5JbnN0YW5jZXMgPSBDb2xsZWN0aW9uXzEuSW5zdGFuY2VzO1xuLyoqXG4gKiBHaXZlbiBhIEN5Y2xlLmpzIGNvbXBvbmVudCB0aGF0IGV4cGVjdHMgYSBzdGF0ZSAqc291cmNlKiBhbmQgd2lsbFxuICogb3V0cHV0IGEgcmVkdWNlciAqc2luayosIHRoaXMgZnVuY3Rpb24gc2V0cyB1cCB0aGUgc3RhdGUgbWFuYWdlbWVudFxuICogbWVjaGFuaWNzIHRvIGFjY3VtdWxhdGUgc3RhdGUgb3ZlciB0aW1lIGFuZCBwcm92aWRlIHRoZSBzdGF0ZSBzb3VyY2UuIEl0XG4gKiByZXR1cm5zIGEgQ3ljbGUuanMgY29tcG9uZW50IHdoaWNoIHdyYXBzIHRoZSBjb21wb25lbnQgZ2l2ZW4gYXMgaW5wdXQuXG4gKiBFc3NlbnRpYWxseSwgaXQgaG9va3MgdXAgdGhlIHJlZHVjZXJzIHNpbmsgd2l0aCB0aGUgc3RhdGUgc291cmNlIGFzIGEgY3ljbGUuXG4gKlxuICogT3B0aW9uYWxseSwgeW91IGNhbiBwYXNzIGEgY3VzdG9tIG5hbWUgZm9yIHRoZSBzdGF0ZSBjaGFubmVsLiBCeSBkZWZhdWx0LFxuICogdGhlIG5hbWUgaXMgJ3N0YXRlJyBpbiBzb3VyY2VzIGFuZCBzaW5rcywgYnV0IHlvdSBjYW4gY2hhbmdlIHRoYXQgdG8gYmVcbiAqIHdoYXRldmVyIHN0cmluZyB5b3Ugd2lzaC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBhbiBvcHRpb25hbCBzdHJpbmcgZm9yIHRoZSBjdXN0b20gbmFtZSBnaXZlbiB0byB0aGVcbiAqIHN0YXRlIGNoYW5uZWwuIEJ5IGRlZmF1bHQsIGl0IGlzIHRoZSBzdHJpbmcgJ3N0YXRlJy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhIGNvbXBvbmVudCB0aGF0IHdyYXBzIHRoZSBtYWluIGZ1bmN0aW9uIGdpdmVuIGFzIGlucHV0LFxuICogYWRkaW5nIHN0YXRlIGFjY3VtdWxhdGlvbiBsb2dpYyB0byBpdC5cbiAqIEBmdW5jdGlvbiB3aXRoU3RhdGVcbiAqL1xudmFyIHdpdGhTdGF0ZV8xID0gcmVxdWlyZShcIi4vd2l0aFN0YXRlXCIpO1xuZXhwb3J0cy53aXRoU3RhdGUgPSB3aXRoU3RhdGVfMS53aXRoU3RhdGU7XG4vKipcbiAqIFJldHVybnMgYSBDeWNsZS5qcyBjb21wb25lbnQgKGEgZnVuY3Rpb24gZnJvbSBzb3VyY2VzIHRvIHNpbmtzKSB0aGF0XG4gKiByZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiBtYW55IGl0ZW0gY29tcG9uZW50cyBvZiB0aGUgc2FtZSB0eXBlLlxuICpcbiAqIFRha2VzIGFuIFwib3B0aW9uc1wiIG9iamVjdCBhcyBpbnB1dCwgd2l0aCB0aGUgcmVxdWlyZWQgcHJvcGVydGllczpcbiAqIC0gaXRlbVxuICogLSBjb2xsZWN0U2lua3NcbiAqXG4gKiBBbmQgdGhlIG9wdGlvbmFsIHByb3BlcnRpZXM6XG4gKiAtIGl0ZW1LZXlcbiAqIC0gaXRlbVNjb3BlXG4gKiAtIGNoYW5uZWxcbiAqXG4gKiBUaGUgcmV0dXJuZWQgY29tcG9uZW50LCB0aGUgQ29sbGVjdGlvbiwgd2lsbCB1c2UgdGhlIHN0YXRlIHNvdXJjZSBwYXNzZWQgdG9cbiAqIGl0ICh0aHJvdWdoIHNvdXJjZXMpIHRvIGd1aWRlIHRoZSBkeW5hbWljIGdyb3dpbmcvc2hyaW5raW5nIG9mIGluc3RhbmNlcyBvZlxuICogdGhlIGl0ZW0gY29tcG9uZW50LlxuICpcbiAqIFR5cGljYWxseSB0aGUgc3RhdGUgc291cmNlIHNob3VsZCBlbWl0IGFycmF5cywgd2hlcmUgZWFjaCBlbnRyeSBpbiB0aGUgYXJyYXlcbiAqIGlzIGFuIG9iamVjdCBob2xkaW5nIHRoZSBzdGF0ZSBmb3IgZWFjaCBpdGVtIGNvbXBvbmVudC4gV2hlbiB0aGUgc3RhdGUgYXJyYXlcbiAqIGdyb3dzLCB0aGUgY29sbGVjdGlvbiB3aWxsIGF1dG9tYXRpY2FsbHkgaW5zdGFudGlhdGUgYSBuZXcgaXRlbSBjb21wb25lbnQuXG4gKiBTaW1pbGFybHksIHdoZW4gdGhlIHN0YXRlIGFycmF5IGdldHMgc21hbGxlciwgdGhlIGNvbGxlY3Rpb24gd2lsbCBoYW5kbGVcbiAqIHJlbW92YWwgb2YgdGhlIGNvcnJlc3BvbmRpbmcgaXRlbSBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIGEgY29uZmlndXJhdGlvbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczpcbiAqICAgLSBgaXRlbTogZnVuY3Rpb25gLCBhIEN5Y2xlLmpzIGNvbXBvbmVudCBmb3IgZWFjaCBpdGVtIGluIHRoZSBjb2xsZWN0aW9uLlxuICogICAtIGBjb2xsZWN0U2lua3M6IGZ1bmN0aW9uYCwgYSBmdW5jdGlvbiB0aGF0IGRlc2NyaWJlcyBob3cgdG8gY29sbGVjdCB0aGVcbiAqICAgICAgc2lua3MgZnJvbSBhbGwgaXRlbSBpbnN0YW5jZXMuXG4gKiAgIC0gYGl0ZW1LZXk6IGZ1bmN0aW9uYCwgYSBmdW5jdGlvbiBmcm9tIGl0ZW0gc3RhdGUgdG8gaXRlbSAodW5pcXVlKSBrZXkuXG4gKiAgIC0gYGl0ZW1TY29wZTogZnVuY3Rpb25gLCBhIGZ1bmN0aW9uIGZyb20gaXRlbSBrZXkgdG8gaXNvbGF0aW9uIHNjb3BlLlxuICogICAtIGBjaGFubmVsOiBzdHJpbmdgLCBjaG9vc2UgdGhlIGNoYW5uZWwgbmFtZSB3aGVyZSB0aGUgU3RhdGVTb3VyY2UgZXhpc3RzLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgY29tcG9uZW50IHRoYXQgZGlzcGxheXMgbWFueSBpbnN0YW5jZXMgb2YgdGhlIGl0ZW1cbiAqIGNvbXBvbmVudC5cbiAqIEBmdW5jdGlvbiBtYWtlQ29sbGVjdGlvblxuICovXG52YXIgQ29sbGVjdGlvbl8yID0gcmVxdWlyZShcIi4vQ29sbGVjdGlvblwiKTtcbmV4cG9ydHMubWFrZUNvbGxlY3Rpb24gPSBDb2xsZWN0aW9uXzIubWFrZUNvbGxlY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBQaWNrQ29tYmluZUxpc3RlbmVyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tDb21iaW5lTGlzdGVuZXIoa2V5LCBvdXQsIHAsIGlucykge1xuICAgICAgICB0aGlzLmtleSA9IGtleTtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMucCA9IHA7XG4gICAgICAgIHRoaXMudmFsID0geHN0cmVhbV8xLk5PO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICB9XG4gICAgUGlja0NvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucCwgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIHRoaXMudmFsID0gdDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucC51cCgpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fZShlcnIpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgcmV0dXJuIFBpY2tDb21iaW5lTGlzdGVuZXI7XG59KCkpO1xudmFyIFBpY2tDb21iaW5lID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tDb21iaW5lKHNlbCwgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdjb21iaW5lJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMuc2VsID0gc2VsO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH1cbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwpIHtcbiAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICBpbC5vdXQgPSBudWxsO1xuICAgICAgICAgICAgaWwudmFsID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlscy5jbGVhcigpO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLnVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJyID0gdGhpcy5pbnN0LmFycjtcbiAgICAgICAgdmFyIG4gPSBhcnIubGVuZ3RoO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIHZhciBvdXRBcnIgPSBBcnJheShuKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzaW5rcyA9IGFycltpXTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBzaW5rcy5fa2V5O1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdmFsID0gaWxzLmdldChrZXkpLnZhbDtcbiAgICAgICAgICAgIGlmICh2YWwgPT09IHhzdHJlYW1fMS5OTykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dEFycltpXSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm91dC5fbihvdXRBcnIpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKGluc3QpIHtcbiAgICAgICAgdGhpcy5pbnN0ID0gaW5zdDtcbiAgICAgICAgdmFyIGFyclNpbmtzID0gaW5zdC5hcnI7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICB2YXIgc2VsID0gdGhpcy5zZWw7XG4gICAgICAgIHZhciBkaWN0ID0gaW5zdC5kaWN0O1xuICAgICAgICB2YXIgbiA9IGFyclNpbmtzLmxlbmd0aDtcbiAgICAgICAgLy8gcmVtb3ZlXG4gICAgICAgIHZhciByZW1vdmVkID0gZmFsc2U7XG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCwga2V5KSB7XG4gICAgICAgICAgICBpZiAoIWRpY3QuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbC5pbnMuX3JlbW92ZShpbCk7XG4gICAgICAgICAgICAgICAgaWwuaW5zID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbC5vdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlsLnZhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWxzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgIHJlbW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKG4gPT09IDApIHtcbiAgICAgICAgICAgIG91dC5fbihbXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWRkXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc2lua3MgPSBhcnJTaW5rc1tpXTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBzaW5rcy5fa2V5O1xuICAgICAgICAgICAgaWYgKCFzaW5rc1tzZWxdKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwaWNrQ29tYmluZSBmb3VuZCBhbiB1bmRlZmluZWQgY2hpbGQgc2luayBzdHJlYW0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzaW5rID0geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2lua3Nbc2VsXSk7XG4gICAgICAgICAgICBpZiAoIWlscy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlscy5zZXQoa2V5LCBuZXcgUGlja0NvbWJpbmVMaXN0ZW5lcihrZXksIG91dCwgdGhpcywgc2luaykpO1xuICAgICAgICAgICAgICAgIHNpbmsuX2FkZChpbHMuZ2V0KGtleSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgICB0aGlzLnVwKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fZShlKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gUGlja0NvbWJpbmU7XG59KCkpO1xuZnVuY3Rpb24gcGlja0NvbWJpbmUoc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gcGlja0NvbWJpbmVPcGVyYXRvcihpbnN0JCkge1xuICAgICAgICByZXR1cm4gbmV3IHhzdHJlYW1fMS5TdHJlYW0obmV3IFBpY2tDb21iaW5lKHNlbGVjdG9yLCBpbnN0JCkpO1xuICAgIH07XG59XG5leHBvcnRzLnBpY2tDb21iaW5lID0gcGlja0NvbWJpbmU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1waWNrQ29tYmluZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBQaWNrTWVyZ2VMaXN0ZW5lciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrTWVyZ2VMaXN0ZW5lcihvdXQsIHAsIGlucykge1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMucCA9IHA7XG4gICAgfVxuICAgIFBpY2tNZXJnZUxpc3RlbmVyLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wLCBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fbih0KTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZUxpc3RlbmVyLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9lKGVycik7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2VMaXN0ZW5lci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgcmV0dXJuIFBpY2tNZXJnZUxpc3RlbmVyO1xufSgpKTtcbnZhciBQaWNrTWVyZ2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGlja01lcmdlKHNlbCwgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdwaWNrTWVyZ2UnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLnNlbCA9IHNlbDtcbiAgICAgICAgdGhpcy5pbHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5zdCA9IG51bGw7XG4gICAgfVxuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgaWxzLmZvckVhY2goZnVuY3Rpb24gKGlsLCBrZXkpIHtcbiAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICBpbC5vdXQgPSBudWxsO1xuICAgICAgICAgICAgaWxzLmRlbGV0ZShrZXkpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWxzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5zdCA9IG51bGw7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKGluc3QpIHtcbiAgICAgICAgdGhpcy5pbnN0ID0gaW5zdDtcbiAgICAgICAgdmFyIGFyclNpbmtzID0gaW5zdC5hcnI7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICB2YXIgc2VsID0gdGhpcy5zZWw7XG4gICAgICAgIHZhciBuID0gYXJyU2lua3MubGVuZ3RoO1xuICAgICAgICAvLyBhZGRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzaW5rcyA9IGFyclNpbmtzW2ldO1xuICAgICAgICAgICAgdmFyIGtleSA9IHNpbmtzLl9rZXk7XG4gICAgICAgICAgICB2YXIgc2luayA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW3NlbF0gfHwgeHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKSk7XG4gICAgICAgICAgICBpZiAoIWlscy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlscy5zZXQoa2V5LCBuZXcgUGlja01lcmdlTGlzdGVuZXIob3V0LCB0aGlzLCBzaW5rKSk7XG4gICAgICAgICAgICAgICAgc2luay5fYWRkKGlscy5nZXQoa2V5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVtb3ZlXG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCwga2V5KSB7XG4gICAgICAgICAgICBpZiAoIWluc3QuZGljdC5oYXMoa2V5KSB8fCAhaW5zdC5kaWN0LmdldChrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWwuaW5zLl9yZW1vdmUoaWwpO1xuICAgICAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbHMuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHUuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBQaWNrTWVyZ2U7XG59KCkpO1xuZnVuY3Rpb24gcGlja01lcmdlKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBpY2tNZXJnZU9wZXJhdG9yKGluc3QkKSB7XG4gICAgICAgIHJldHVybiBuZXcgeHN0cmVhbV8xLlN0cmVhbShuZXcgUGlja01lcmdlKHNlbGVjdG9yLCBpbnN0JCkpO1xuICAgIH07XG59XG5leHBvcnRzLnBpY2tNZXJnZSA9IHBpY2tNZXJnZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBpY2tNZXJnZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBjb25jYXRfMSA9IHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2NvbmNhdFwiKTtcbnZhciBTdGF0ZVNvdXJjZV8xID0gcmVxdWlyZShcIi4vU3RhdGVTb3VyY2VcIik7XG52YXIgcXVpY2t0YXNrXzEgPSByZXF1aXJlKFwicXVpY2t0YXNrXCIpO1xudmFyIHNjaGVkdWxlID0gcXVpY2t0YXNrXzEuZGVmYXVsdCgpO1xuZnVuY3Rpb24gd2l0aFN0YXRlKG1haW4sIG5hbWUpIHtcbiAgICBpZiAobmFtZSA9PT0gdm9pZCAwKSB7IG5hbWUgPSAnc3RhdGUnOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG1haW5XaXRoU3RhdGUoc291cmNlcykge1xuICAgICAgICB2YXIgcmVkdWNlck1pbWljJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSgpO1xuICAgICAgICB2YXIgc3RhdGUkID0gcmVkdWNlck1pbWljJFxuICAgICAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgdm9pZCAwKVxuICAgICAgICAgICAgLmRyb3AoMSk7XG4gICAgICAgIHZhciBpbm5lclNvdXJjZXMgPSBzb3VyY2VzO1xuICAgICAgICBpbm5lclNvdXJjZXNbbmFtZV0gPSBuZXcgU3RhdGVTb3VyY2VfMS5TdGF0ZVNvdXJjZShzdGF0ZSQsIG5hbWUpO1xuICAgICAgICB2YXIgc2lua3MgPSBtYWluKGlubmVyU291cmNlcyk7XG4gICAgICAgIGlmIChzaW5rc1tuYW1lXSkge1xuICAgICAgICAgICAgdmFyIHN0cmVhbSQgPSBjb25jYXRfMS5kZWZhdWx0KHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW25hbWVdKSwgeHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKSk7XG4gICAgICAgICAgICBzdHJlYW0kLnN1YnNjcmliZSh7XG4gICAgICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKGkpIHsgcmV0dXJuIHNjaGVkdWxlKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJlZHVjZXJNaW1pYyQuX24oaSk7IH0pOyB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7IHJldHVybiBzY2hlZHVsZShmdW5jdGlvbiAoKSB7IHJldHVybiByZWR1Y2VyTWltaWMkLl9lKGVycik7IH0pOyB9LFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IHJldHVybiBzY2hlZHVsZShmdW5jdGlvbiAoKSB7IHJldHVybiByZWR1Y2VyTWltaWMkLl9jKCk7IH0pOyB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpbmtzO1xuICAgIH07XG59XG5leHBvcnRzLndpdGhTdGF0ZSA9IHdpdGhTdGF0ZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXdpdGhTdGF0ZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICB2YXIgZ2xvYmFsT2JqO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IGdsb2JhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHRoaXM7XG4gICAgfVxuICAgIGdsb2JhbE9iai5DeWNsZWpzID0gZ2xvYmFsT2JqLkN5Y2xlanMgfHwge307XG4gICAgZ2xvYmFsT2JqID0gZ2xvYmFsT2JqLkN5Y2xlanM7XG4gICAgZ2xvYmFsT2JqLmFkYXB0U3RyZWFtID0gZ2xvYmFsT2JqLmFkYXB0U3RyZWFtIHx8IChmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XG4gICAgcmV0dXJuIGdsb2JhbE9iajtcbn1cbmZ1bmN0aW9uIHNldEFkYXB0KGYpIHtcbiAgICBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbSA9IGY7XG59XG5leHBvcnRzLnNldEFkYXB0ID0gc2V0QWRhcHQ7XG5mdW5jdGlvbiBhZGFwdChzdHJlYW0pIHtcbiAgICByZXR1cm4gZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0oc3RyZWFtKTtcbn1cbmV4cG9ydHMuYWRhcHQgPSBhZGFwdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFkYXB0LmpzLm1hcCIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIG1pY3JvdGFzaygpIHtcbiAgICBpZiAodHlwZW9mIE11dGF0aW9uT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhciBub2RlXzEgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICAgIHZhciBxdWV1ZV8xID0gW107XG4gICAgICAgIHZhciBpXzEgPSAwO1xuICAgICAgICBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aGlsZSAocXVldWVfMS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZV8xLnNoaWZ0KCkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkub2JzZXJ2ZShub2RlXzEsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgcXVldWVfMS5wdXNoKGZuKTtcbiAgICAgICAgICAgIG5vZGVfMS5kYXRhID0gaV8xID0gMSAtIGlfMTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHNldEltbWVkaWF0ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQ7XG4gICAgfVxufVxuZXhwb3J0cy5kZWZhdWx0ID0gbWljcm90YXNrO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoJy4vc2VsZWN0b3JQYXJzZXInKTtcbmZ1bmN0aW9uIGNsYXNzTmFtZUZyb21WTm9kZSh2Tm9kZSkge1xuICAgIHZhciBfYSA9IHNlbGVjdG9yUGFyc2VyXzEuc2VsZWN0b3JQYXJzZXIodk5vZGUpLmNsYXNzTmFtZSwgY24gPSBfYSA9PT0gdm9pZCAwID8gJycgOiBfYTtcbiAgICBpZiAoIXZOb2RlLmRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGNuO1xuICAgIH1cbiAgICB2YXIgX2IgPSB2Tm9kZS5kYXRhLCBkYXRhQ2xhc3MgPSBfYi5jbGFzcywgcHJvcHMgPSBfYi5wcm9wcztcbiAgICBpZiAoZGF0YUNsYXNzKSB7XG4gICAgICAgIHZhciBjID0gT2JqZWN0LmtleXMoZGF0YUNsYXNzKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoY2wpIHsgcmV0dXJuIGRhdGFDbGFzc1tjbF07IH0pO1xuICAgICAgICBjbiArPSBcIiBcIiArIGMuam9pbihcIiBcIik7XG4gICAgfVxuICAgIGlmIChwcm9wcyAmJiBwcm9wcy5jbGFzc05hbWUpIHtcbiAgICAgICAgY24gKz0gXCIgXCIgKyBwcm9wcy5jbGFzc05hbWU7XG4gICAgfVxuICAgIHJldHVybiBjbiAmJiBjbi50cmltKCk7XG59XG5leHBvcnRzLmNsYXNzTmFtZUZyb21WTm9kZSA9IGNsYXNzTmFtZUZyb21WTm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNsYXNzTmFtZUZyb21WTm9kZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIGN1cnJ5MihzZWxlY3QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gc2VsZWN0b3Ioc2VsLCB2Tm9kZSkge1xuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIHNlbGVjdDtcbiAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uIChfdk5vZGUpIHsgcmV0dXJuIHNlbGVjdChzZWwsIF92Tm9kZSk7IH07XG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gc2VsZWN0KHNlbCwgdk5vZGUpO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmV4cG9ydHMuY3VycnkyID0gY3VycnkyO1xuO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3VycnkyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHF1ZXJ5XzEgPSByZXF1aXJlKCcuL3F1ZXJ5Jyk7XG52YXIgcGFyZW50X3N5bWJvbF8xID0gcmVxdWlyZSgnLi9wYXJlbnQtc3ltYm9sJyk7XG5mdW5jdGlvbiBmaW5kTWF0Y2hlcyhjc3NTZWxlY3Rvciwgdk5vZGUpIHtcbiAgICBpZiAoIXZOb2RlKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdHJhdmVyc2VWTm9kZSh2Tm9kZSwgYWRkUGFyZW50KTsgLy8gYWRkIG1hcHBpbmcgdG8gdGhlIHBhcmVudCBzZWxlY3RvclBhcnNlclxuICAgIHJldHVybiBxdWVyeV8xLnF1ZXJ5U2VsZWN0b3IoY3NzU2VsZWN0b3IsIHZOb2RlKTtcbn1cbmV4cG9ydHMuZmluZE1hdGNoZXMgPSBmaW5kTWF0Y2hlcztcbmZ1bmN0aW9uIHRyYXZlcnNlVk5vZGUodk5vZGUsIGYpIHtcbiAgICBmdW5jdGlvbiByZWN1cnNlKGN1cnJlbnROb2RlLCBpc1BhcmVudCwgcGFyZW50Vk5vZGUpIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGN1cnJlbnROb2RlLmNoaWxkcmVuICYmIGN1cnJlbnROb2RlLmNoaWxkcmVuLmxlbmd0aCB8fCAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBjdXJyZW50Tm9kZS5jaGlsZHJlbjtcbiAgICAgICAgICAgIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbltpXSAmJiB0eXBlb2YgY2hpbGRyZW5baV0gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgcmVjdXJzZShjaGlsZCwgZmFsc2UsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmKGN1cnJlbnROb2RlLCBpc1BhcmVudCwgaXNQYXJlbnQgPyB2b2lkIDAgOiBwYXJlbnRWTm9kZSk7XG4gICAgfVxuICAgIHJlY3Vyc2Uodk5vZGUsIHRydWUpO1xufVxuZnVuY3Rpb24gYWRkUGFyZW50KHZOb2RlLCBpc1BhcmVudCwgcGFyZW50KSB7XG4gICAgaWYgKGlzUGFyZW50KSB7XG4gICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICAgIGlmICghdk5vZGUuZGF0YSkge1xuICAgICAgICB2Tm9kZS5kYXRhID0ge307XG4gICAgfVxuICAgIGlmICghdk5vZGUuZGF0YVtwYXJlbnRfc3ltYm9sXzEuZGVmYXVsdF0pIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZOb2RlLmRhdGEsIHBhcmVudF9zeW1ib2xfMS5kZWZhdWx0LCB7XG4gICAgICAgICAgICB2YWx1ZTogcGFyZW50LFxuICAgICAgICB9KTtcbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1maW5kTWF0Y2hlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBjdXJyeTJfMSA9IHJlcXVpcmUoJy4vY3VycnkyJyk7XG52YXIgZmluZE1hdGNoZXNfMSA9IHJlcXVpcmUoJy4vZmluZE1hdGNoZXMnKTtcbmV4cG9ydHMuc2VsZWN0ID0gY3VycnkyXzEuY3VycnkyKGZpbmRNYXRjaGVzXzEuZmluZE1hdGNoZXMpO1xudmFyIHNlbGVjdG9yUGFyc2VyXzEgPSByZXF1aXJlKCcuL3NlbGVjdG9yUGFyc2VyJyk7XG5leHBvcnRzLnNlbGVjdG9yUGFyc2VyID0gc2VsZWN0b3JQYXJzZXJfMS5zZWxlY3RvclBhcnNlcjtcbnZhciBjbGFzc05hbWVGcm9tVk5vZGVfMSA9IHJlcXVpcmUoJy4vY2xhc3NOYW1lRnJvbVZOb2RlJyk7XG5leHBvcnRzLmNsYXNzTmFtZUZyb21WTm9kZSA9IGNsYXNzTmFtZUZyb21WTm9kZV8xLmNsYXNzTmFtZUZyb21WTm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHJvb3Q7XG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IHNlbGY7XG59XG5lbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJvb3QgPSB3aW5kb3c7XG59XG5lbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJvb3QgPSBnbG9iYWw7XG59XG5lbHNlIHtcbiAgICByb290ID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn1cbnZhciBTeW1ib2wgPSByb290LlN5bWJvbDtcbnZhciBwYXJlbnRTeW1ib2w7XG5pZiAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHBhcmVudFN5bWJvbCA9IFN5bWJvbCgncGFyZW50Jyk7XG59XG5lbHNlIHtcbiAgICBwYXJlbnRTeW1ib2wgPSAnQEBzbmFiYmRvbS1zZWxlY3Rvci1wYXJlbnQnO1xufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gcGFyZW50U3ltYm9sO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGFyZW50LXN5bWJvbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciB0cmVlX3NlbGVjdG9yXzEgPSByZXF1aXJlKCd0cmVlLXNlbGVjdG9yJyk7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoJy4vc2VsZWN0b3JQYXJzZXInKTtcbnZhciBjbGFzc05hbWVGcm9tVk5vZGVfMSA9IHJlcXVpcmUoJy4vY2xhc3NOYW1lRnJvbVZOb2RlJyk7XG52YXIgcGFyZW50X3N5bWJvbF8xID0gcmVxdWlyZSgnLi9wYXJlbnQtc3ltYm9sJyk7XG52YXIgb3B0aW9ucyA9IHtcbiAgICB0YWc6IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gc2VsZWN0b3JQYXJzZXJfMS5zZWxlY3RvclBhcnNlcih2Tm9kZSkudGFnTmFtZTsgfSxcbiAgICBjbGFzc05hbWU6IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gY2xhc3NOYW1lRnJvbVZOb2RlXzEuY2xhc3NOYW1lRnJvbVZOb2RlKHZOb2RlKTsgfSxcbiAgICBpZDogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiBzZWxlY3RvclBhcnNlcl8xLnNlbGVjdG9yUGFyc2VyKHZOb2RlKS5pZCB8fCAnJzsgfSxcbiAgICBjaGlsZHJlbjogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiB2Tm9kZS5jaGlsZHJlbiB8fCBbXTsgfSxcbiAgICBwYXJlbnQ6IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gdk5vZGUuZGF0YVtwYXJlbnRfc3ltYm9sXzEuZGVmYXVsdF0gfHwgdk5vZGU7IH0sXG4gICAgY29udGVudHM6IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gdk5vZGUudGV4dCB8fCAnJzsgfSxcbiAgICBhdHRyOiBmdW5jdGlvbiAodk5vZGUsIGF0dHIpIHtcbiAgICAgICAgaWYgKHZOb2RlLmRhdGEpIHtcbiAgICAgICAgICAgIHZhciBfYSA9IHZOb2RlLmRhdGEsIF9iID0gX2EuYXR0cnMsIGF0dHJzID0gX2IgPT09IHZvaWQgMCA/IHt9IDogX2IsIF9jID0gX2EucHJvcHMsIHByb3BzID0gX2MgPT09IHZvaWQgMCA/IHt9IDogX2MsIF9kID0gX2EuZGF0YXNldCwgZGF0YXNldCA9IF9kID09PSB2b2lkIDAgPyB7fSA6IF9kO1xuICAgICAgICAgICAgaWYgKGF0dHJzW2F0dHJdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF0dHJzW2F0dHJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByb3BzW2F0dHJdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BzW2F0dHJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF0dHIuaW5kZXhPZignZGF0YS0nKSA9PT0gMCAmJiBkYXRhc2V0W2F0dHIuc2xpY2UoNSldKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFzZXRbYXR0ci5zbGljZSg1KV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxufTtcbnZhciBtYXRjaGVzID0gdHJlZV9zZWxlY3Rvcl8xLmNyZWF0ZU1hdGNoZXMob3B0aW9ucyk7XG5mdW5jdGlvbiBjdXN0b21NYXRjaGVzKHNlbCwgdm5vZGUpIHtcbiAgICB2YXIgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgdmFyIHNlbGVjdG9yID0gbWF0Y2hlcy5iaW5kKG51bGwsIHNlbCk7XG4gICAgaWYgKGRhdGEgJiYgZGF0YS5mbikge1xuICAgICAgICB2YXIgbiA9IHZvaWQgMDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YS5hcmdzKSkge1xuICAgICAgICAgICAgbiA9IGRhdGEuZm4uYXBwbHkobnVsbCwgZGF0YS5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkYXRhLmFyZ3MpIHtcbiAgICAgICAgICAgIG4gPSBkYXRhLmZuLmNhbGwobnVsbCwgZGF0YS5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG4gPSBkYXRhLmZuKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbGVjdG9yKG4pID8gbiA6IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0b3Iodm5vZGUpO1xufVxuZXhwb3J0cy5xdWVyeVNlbGVjdG9yID0gdHJlZV9zZWxlY3Rvcl8xLmNyZWF0ZVF1ZXJ5U2VsZWN0b3Iob3B0aW9ucywgY3VzdG9tTWF0Y2hlcyk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1xdWVyeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIHNlbGVjdG9yUGFyc2VyKG5vZGUpIHtcbiAgICBpZiAoIW5vZGUuc2VsKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0YWdOYW1lOiAnJyxcbiAgICAgICAgICAgIGlkOiAnJyxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJycsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBzZWwgPSBub2RlLnNlbDtcbiAgICB2YXIgaGFzaElkeCA9IHNlbC5pbmRleE9mKCcjJyk7XG4gICAgdmFyIGRvdElkeCA9IHNlbC5pbmRleE9mKCcuJywgaGFzaElkeCk7XG4gICAgdmFyIGhhc2ggPSBoYXNoSWR4ID4gMCA/IGhhc2hJZHggOiBzZWwubGVuZ3RoO1xuICAgIHZhciBkb3QgPSBkb3RJZHggPiAwID8gZG90SWR4IDogc2VsLmxlbmd0aDtcbiAgICB2YXIgdGFnTmFtZSA9IGhhc2hJZHggIT09IC0xIHx8IGRvdElkeCAhPT0gLTEgP1xuICAgICAgICBzZWwuc2xpY2UoMCwgTWF0aC5taW4oaGFzaCwgZG90KSkgOlxuICAgICAgICBzZWw7XG4gICAgdmFyIGlkID0gaGFzaCA8IGRvdCA/IHNlbC5zbGljZShoYXNoICsgMSwgZG90KSA6IHZvaWQgMDtcbiAgICB2YXIgY2xhc3NOYW1lID0gZG90SWR4ID4gMCA/IHNlbC5zbGljZShkb3QgKyAxKS5yZXBsYWNlKC9cXC4vZywgJyAnKSA6IHZvaWQgMDtcbiAgICByZXR1cm4ge1xuICAgICAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgICAgICBpZDogaWQsXG4gICAgICAgIGNsYXNzTmFtZTogY2xhc3NOYW1lLFxuICAgIH07XG59XG5leHBvcnRzLnNlbGVjdG9yUGFyc2VyID0gc2VsZWN0b3JQYXJzZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZWxlY3RvclBhcnNlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcIi4vdm5vZGVcIik7XG52YXIgaXMgPSByZXF1aXJlKFwiLi9pc1wiKTtcbmZ1bmN0aW9uIGFkZE5TKGRhdGEsIGNoaWxkcmVuLCBzZWwpIHtcbiAgICBkYXRhLm5zID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgICBpZiAoc2VsICE9PSAnZm9yZWlnbk9iamVjdCcgJiYgY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGREYXRhID0gY2hpbGRyZW5baV0uZGF0YTtcbiAgICAgICAgICAgIGlmIChjaGlsZERhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGFkZE5TKGNoaWxkRGF0YSwgY2hpbGRyZW5baV0uY2hpbGRyZW4sIGNoaWxkcmVuW2ldLnNlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBoKHNlbCwgYiwgYykge1xuICAgIHZhciBkYXRhID0ge30sIGNoaWxkcmVuLCB0ZXh0LCBpO1xuICAgIGlmIChjICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZGF0YSA9IGI7XG4gICAgICAgIGlmIChpcy5hcnJheShjKSkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBjO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZShjKSkge1xuICAgICAgICAgICAgdGV4dCA9IGM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYyAmJiBjLnNlbCkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBbY107XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoYiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChpcy5hcnJheShiKSkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZShiKSkge1xuICAgICAgICAgICAgdGV4dCA9IGI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYiAmJiBiLnNlbCkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBbYl07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0gYjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpcy5wcmltaXRpdmUoY2hpbGRyZW5baV0pKVxuICAgICAgICAgICAgICAgIGNoaWxkcmVuW2ldID0gdm5vZGVfMS52bm9kZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjaGlsZHJlbltpXSwgdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoc2VsWzBdID09PSAncycgJiYgc2VsWzFdID09PSAndicgJiYgc2VsWzJdID09PSAnZycgJiZcbiAgICAgICAgKHNlbC5sZW5ndGggPT09IDMgfHwgc2VsWzNdID09PSAnLicgfHwgc2VsWzNdID09PSAnIycpKSB7XG4gICAgICAgIGFkZE5TKGRhdGEsIGNoaWxkcmVuLCBzZWwpO1xuICAgIH1cbiAgICByZXR1cm4gdm5vZGVfMS52bm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCB1bmRlZmluZWQpO1xufVxuZXhwb3J0cy5oID0gaDtcbjtcbmV4cG9ydHMuZGVmYXVsdCA9IGg7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1oLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh0YWdOYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG59XG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2VVUkksIHF1YWxpZmllZE5hbWUpO1xufVxuZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodGV4dCkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0KTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUNvbW1lbnQodGV4dCkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVDb21tZW50KHRleHQpO1xufVxuZnVuY3Rpb24gaW5zZXJ0QmVmb3JlKHBhcmVudE5vZGUsIG5ld05vZGUsIHJlZmVyZW5jZU5vZGUpIHtcbiAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShuZXdOb2RlLCByZWZlcmVuY2VOb2RlKTtcbn1cbmZ1bmN0aW9uIHJlbW92ZUNoaWxkKG5vZGUsIGNoaWxkKSB7XG4gICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG59XG5mdW5jdGlvbiBhcHBlbmRDaGlsZChub2RlLCBjaGlsZCkge1xuICAgIG5vZGUuYXBwZW5kQ2hpbGQoY2hpbGQpO1xufVxuZnVuY3Rpb24gcGFyZW50Tm9kZShub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUucGFyZW50Tm9kZTtcbn1cbmZ1bmN0aW9uIG5leHRTaWJsaW5nKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5uZXh0U2libGluZztcbn1cbmZ1bmN0aW9uIHRhZ05hbWUoZWxtKSB7XG4gICAgcmV0dXJuIGVsbS50YWdOYW1lO1xufVxuZnVuY3Rpb24gc2V0VGV4dENvbnRlbnQobm9kZSwgdGV4dCkge1xuICAgIG5vZGUudGV4dENvbnRlbnQgPSB0ZXh0O1xufVxuZnVuY3Rpb24gZ2V0VGV4dENvbnRlbnQobm9kZSkge1xuICAgIHJldHVybiBub2RlLnRleHRDb250ZW50O1xufVxuZnVuY3Rpb24gaXNFbGVtZW50KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMTtcbn1cbmZ1bmN0aW9uIGlzVGV4dChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDM7XG59XG5mdW5jdGlvbiBpc0NvbW1lbnQobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSA4O1xufVxuZXhwb3J0cy5odG1sRG9tQXBpID0ge1xuICAgIGNyZWF0ZUVsZW1lbnQ6IGNyZWF0ZUVsZW1lbnQsXG4gICAgY3JlYXRlRWxlbWVudE5TOiBjcmVhdGVFbGVtZW50TlMsXG4gICAgY3JlYXRlVGV4dE5vZGU6IGNyZWF0ZVRleHROb2RlLFxuICAgIGNyZWF0ZUNvbW1lbnQ6IGNyZWF0ZUNvbW1lbnQsXG4gICAgaW5zZXJ0QmVmb3JlOiBpbnNlcnRCZWZvcmUsXG4gICAgcmVtb3ZlQ2hpbGQ6IHJlbW92ZUNoaWxkLFxuICAgIGFwcGVuZENoaWxkOiBhcHBlbmRDaGlsZCxcbiAgICBwYXJlbnROb2RlOiBwYXJlbnROb2RlLFxuICAgIG5leHRTaWJsaW5nOiBuZXh0U2libGluZyxcbiAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgIHNldFRleHRDb250ZW50OiBzZXRUZXh0Q29udGVudCxcbiAgICBnZXRUZXh0Q29udGVudDogZ2V0VGV4dENvbnRlbnQsXG4gICAgaXNFbGVtZW50OiBpc0VsZW1lbnQsXG4gICAgaXNUZXh0OiBpc1RleHQsXG4gICAgaXNDb21tZW50OiBpc0NvbW1lbnQsXG59O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5odG1sRG9tQXBpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aHRtbGRvbWFwaS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuYXJyYXkgPSBBcnJheS5pc0FycmF5O1xuZnVuY3Rpb24gcHJpbWl0aXZlKHMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHMgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMucHJpbWl0aXZlID0gcHJpbWl0aXZlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeGxpbmtOUyA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJztcbnZhciB4bWxOUyA9ICdodHRwOi8vd3d3LnczLm9yZy9YTUwvMTk5OC9uYW1lc3BhY2UnO1xudmFyIGNvbG9uQ2hhciA9IDU4O1xudmFyIHhDaGFyID0gMTIwO1xuZnVuY3Rpb24gdXBkYXRlQXR0cnMob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGtleSwgZWxtID0gdm5vZGUuZWxtLCBvbGRBdHRycyA9IG9sZFZub2RlLmRhdGEuYXR0cnMsIGF0dHJzID0gdm5vZGUuZGF0YS5hdHRycztcbiAgICBpZiAoIW9sZEF0dHJzICYmICFhdHRycylcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRBdHRycyA9PT0gYXR0cnMpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRBdHRycyA9IG9sZEF0dHJzIHx8IHt9O1xuICAgIGF0dHJzID0gYXR0cnMgfHwge307XG4gICAgLy8gdXBkYXRlIG1vZGlmaWVkIGF0dHJpYnV0ZXMsIGFkZCBuZXcgYXR0cmlidXRlc1xuICAgIGZvciAoa2V5IGluIGF0dHJzKSB7XG4gICAgICAgIHZhciBjdXIgPSBhdHRyc1trZXldO1xuICAgICAgICB2YXIgb2xkID0gb2xkQXR0cnNba2V5XTtcbiAgICAgICAgaWYgKG9sZCAhPT0gY3VyKSB7XG4gICAgICAgICAgICBpZiAoY3VyID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY3VyID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChrZXkuY2hhckNvZGVBdCgwKSAhPT0geENoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleS5jaGFyQ29kZUF0KDMpID09PSBjb2xvbkNoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lIHhtbCBuYW1lc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZU5TKHhtbE5TLCBrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleS5jaGFyQ29kZUF0KDUpID09PSBjb2xvbkNoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lIHhsaW5rIG5hbWVzcGFjZVxuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlTlMoeGxpbmtOUywga2V5LCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHJlbW92ZSByZW1vdmVkIGF0dHJpYnV0ZXNcbiAgICAvLyB1c2UgYGluYCBvcGVyYXRvciBzaW5jZSB0aGUgcHJldmlvdXMgYGZvcmAgaXRlcmF0aW9uIHVzZXMgaXQgKC5pLmUuIGFkZCBldmVuIGF0dHJpYnV0ZXMgd2l0aCB1bmRlZmluZWQgdmFsdWUpXG4gICAgLy8gdGhlIG90aGVyIG9wdGlvbiBpcyB0byByZW1vdmUgYWxsIGF0dHJpYnV0ZXMgd2l0aCB2YWx1ZSA9PSB1bmRlZmluZWRcbiAgICBmb3IgKGtleSBpbiBvbGRBdHRycykge1xuICAgICAgICBpZiAoIShrZXkgaW4gYXR0cnMpKSB7XG4gICAgICAgICAgICBlbG0ucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmF0dHJpYnV0ZXNNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlQXR0cnMsIHVwZGF0ZTogdXBkYXRlQXR0cnMgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuYXR0cmlidXRlc01vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWF0dHJpYnV0ZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB1cGRhdGVDbGFzcyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIgY3VyLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sIG9sZENsYXNzID0gb2xkVm5vZGUuZGF0YS5jbGFzcywga2xhc3MgPSB2bm9kZS5kYXRhLmNsYXNzO1xuICAgIGlmICghb2xkQ2xhc3MgJiYgIWtsYXNzKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZENsYXNzID09PSBrbGFzcylcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZENsYXNzID0gb2xkQ2xhc3MgfHwge307XG4gICAga2xhc3MgPSBrbGFzcyB8fCB7fTtcbiAgICBmb3IgKG5hbWUgaW4gb2xkQ2xhc3MpIHtcbiAgICAgICAgaWYgKCFrbGFzc1tuYW1lXSkge1xuICAgICAgICAgICAgZWxtLmNsYXNzTGlzdC5yZW1vdmUobmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChuYW1lIGluIGtsYXNzKSB7XG4gICAgICAgIGN1ciA9IGtsYXNzW25hbWVdO1xuICAgICAgICBpZiAoY3VyICE9PSBvbGRDbGFzc1tuYW1lXSkge1xuICAgICAgICAgICAgZWxtLmNsYXNzTGlzdFtjdXIgPyAnYWRkJyA6ICdyZW1vdmUnXShuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuY2xhc3NNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlQ2xhc3MsIHVwZGF0ZTogdXBkYXRlQ2xhc3MgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuY2xhc3NNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jbGFzcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBDQVBTX1JFR0VYID0gL1tBLVpdL2c7XG5mdW5jdGlvbiB1cGRhdGVEYXRhc2V0KG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBlbG0gPSB2bm9kZS5lbG0sIG9sZERhdGFzZXQgPSBvbGRWbm9kZS5kYXRhLmRhdGFzZXQsIGRhdGFzZXQgPSB2bm9kZS5kYXRhLmRhdGFzZXQsIGtleTtcbiAgICBpZiAoIW9sZERhdGFzZXQgJiYgIWRhdGFzZXQpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkRGF0YXNldCA9PT0gZGF0YXNldClcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZERhdGFzZXQgPSBvbGREYXRhc2V0IHx8IHt9O1xuICAgIGRhdGFzZXQgPSBkYXRhc2V0IHx8IHt9O1xuICAgIHZhciBkID0gZWxtLmRhdGFzZXQ7XG4gICAgZm9yIChrZXkgaW4gb2xkRGF0YXNldCkge1xuICAgICAgICBpZiAoIWRhdGFzZXRba2V5XSkge1xuICAgICAgICAgICAgaWYgKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5IGluIGQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGRba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0ucmVtb3ZlQXR0cmlidXRlKCdkYXRhLScgKyBrZXkucmVwbGFjZShDQVBTX1JFR0VYLCAnLSQmJykudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChrZXkgaW4gZGF0YXNldCkge1xuICAgICAgICBpZiAob2xkRGF0YXNldFtrZXldICE9PSBkYXRhc2V0W2tleV0pIHtcbiAgICAgICAgICAgIGlmIChkKSB7XG4gICAgICAgICAgICAgICAgZFtrZXldID0gZGF0YXNldFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZSgnZGF0YS0nICsga2V5LnJlcGxhY2UoQ0FQU19SRUdFWCwgJy0kJicpLnRvTG93ZXJDYXNlKCksIGRhdGFzZXRba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmRhdGFzZXRNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlRGF0YXNldCwgdXBkYXRlOiB1cGRhdGVEYXRhc2V0IH07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmRhdGFzZXRNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhc2V0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gdXBkYXRlUHJvcHMob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGtleSwgY3VyLCBvbGQsIGVsbSA9IHZub2RlLmVsbSwgb2xkUHJvcHMgPSBvbGRWbm9kZS5kYXRhLnByb3BzLCBwcm9wcyA9IHZub2RlLmRhdGEucHJvcHM7XG4gICAgaWYgKCFvbGRQcm9wcyAmJiAhcHJvcHMpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkUHJvcHMgPT09IHByb3BzKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkUHJvcHMgPSBvbGRQcm9wcyB8fCB7fTtcbiAgICBwcm9wcyA9IHByb3BzIHx8IHt9O1xuICAgIGZvciAoa2V5IGluIG9sZFByb3BzKSB7XG4gICAgICAgIGlmICghcHJvcHNba2V5XSkge1xuICAgICAgICAgICAgZGVsZXRlIGVsbVtrZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoa2V5IGluIHByb3BzKSB7XG4gICAgICAgIGN1ciA9IHByb3BzW2tleV07XG4gICAgICAgIG9sZCA9IG9sZFByb3BzW2tleV07XG4gICAgICAgIGlmIChvbGQgIT09IGN1ciAmJiAoa2V5ICE9PSAndmFsdWUnIHx8IGVsbVtrZXldICE9PSBjdXIpKSB7XG4gICAgICAgICAgICBlbG1ba2V5XSA9IGN1cjtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMucHJvcHNNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlUHJvcHMsIHVwZGF0ZTogdXBkYXRlUHJvcHMgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMucHJvcHNNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm9wcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8vIEJpbmRpZyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCBsaWtlIHRoaXMgZml4ZXMgYSBidWcgaW4gSUUvRWRnZS4gU2VlICMzNjAgYW5kICM0MDkuXG52YXIgcmFmID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmICh3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKS5iaW5kKHdpbmRvdykpIHx8IHNldFRpbWVvdXQ7XG52YXIgbmV4dEZyYW1lID0gZnVuY3Rpb24gKGZuKSB7IHJhZihmdW5jdGlvbiAoKSB7IHJhZihmbik7IH0pOyB9O1xudmFyIHJlZmxvd0ZvcmNlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2V0TmV4dEZyYW1lKG9iaiwgcHJvcCwgdmFsKSB7XG4gICAgbmV4dEZyYW1lKGZ1bmN0aW9uICgpIHsgb2JqW3Byb3BdID0gdmFsOyB9KTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxlKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBjdXIsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgb2xkU3R5bGUgPSBvbGRWbm9kZS5kYXRhLnN0eWxlLCBzdHlsZSA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFvbGRTdHlsZSAmJiAhc3R5bGUpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkU3R5bGUgPT09IHN0eWxlKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkU3R5bGUgPSBvbGRTdHlsZSB8fCB7fTtcbiAgICBzdHlsZSA9IHN0eWxlIHx8IHt9O1xuICAgIHZhciBvbGRIYXNEZWwgPSAnZGVsYXllZCcgaW4gb2xkU3R5bGU7XG4gICAgZm9yIChuYW1lIGluIG9sZFN0eWxlKSB7XG4gICAgICAgIGlmICghc3R5bGVbbmFtZV0pIHtcbiAgICAgICAgICAgIGlmIChuYW1lWzBdID09PSAnLScgJiYgbmFtZVsxXSA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlLnJlbW92ZVByb3BlcnR5KG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGN1ciA9IHN0eWxlW25hbWVdO1xuICAgICAgICBpZiAobmFtZSA9PT0gJ2RlbGF5ZWQnICYmIHN0eWxlLmRlbGF5ZWQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIG5hbWUyIGluIHN0eWxlLmRlbGF5ZWQpIHtcbiAgICAgICAgICAgICAgICBjdXIgPSBzdHlsZS5kZWxheWVkW25hbWUyXTtcbiAgICAgICAgICAgICAgICBpZiAoIW9sZEhhc0RlbCB8fCBjdXIgIT09IG9sZFN0eWxlLmRlbGF5ZWRbbmFtZTJdKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldE5leHRGcmFtZShlbG0uc3R5bGUsIG5hbWUyLCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChuYW1lICE9PSAncmVtb3ZlJyAmJiBjdXIgIT09IG9sZFN0eWxlW25hbWVdKSB7XG4gICAgICAgICAgICBpZiAobmFtZVswXSA9PT0gJy0nICYmIG5hbWVbMV0gPT09ICctJykge1xuICAgICAgICAgICAgICAgIGVsbS5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCBjdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gY3VyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gYXBwbHlEZXN0cm95U3R5bGUodm5vZGUpIHtcbiAgICB2YXIgc3R5bGUsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFzIHx8ICEoc3R5bGUgPSBzLmRlc3Ryb3kpKVxuICAgICAgICByZXR1cm47XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IHN0eWxlW25hbWVdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFwcGx5UmVtb3ZlU3R5bGUodm5vZGUsIHJtKSB7XG4gICAgdmFyIHMgPSB2bm9kZS5kYXRhLnN0eWxlO1xuICAgIGlmICghcyB8fCAhcy5yZW1vdmUpIHtcbiAgICAgICAgcm0oKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXJlZmxvd0ZvcmNlZCkge1xuICAgICAgICBnZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHkpLnRyYW5zZm9ybTtcbiAgICAgICAgcmVmbG93Rm9yY2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgdmFyIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgaSA9IDAsIGNvbXBTdHlsZSwgc3R5bGUgPSBzLnJlbW92ZSwgYW1vdW50ID0gMCwgYXBwbGllZCA9IFtdO1xuICAgIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBhcHBsaWVkLnB1c2gobmFtZSk7XG4gICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IHN0eWxlW25hbWVdO1xuICAgIH1cbiAgICBjb21wU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsbSk7XG4gICAgdmFyIHByb3BzID0gY29tcFN0eWxlWyd0cmFuc2l0aW9uLXByb3BlcnR5J10uc3BsaXQoJywgJyk7XG4gICAgZm9yICg7IGkgPCBwcm9wcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoYXBwbGllZC5pbmRleE9mKHByb3BzW2ldKSAhPT0gLTEpXG4gICAgICAgICAgICBhbW91bnQrKztcbiAgICB9XG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgaWYgKGV2LnRhcmdldCA9PT0gZWxtKVxuICAgICAgICAgICAgLS1hbW91bnQ7XG4gICAgICAgIGlmIChhbW91bnQgPT09IDApXG4gICAgICAgICAgICBybSgpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gZm9yY2VSZWZsb3coKSB7XG4gICAgcmVmbG93Rm9yY2VkID0gZmFsc2U7XG59XG5leHBvcnRzLnN0eWxlTW9kdWxlID0ge1xuICAgIHByZTogZm9yY2VSZWZsb3csXG4gICAgY3JlYXRlOiB1cGRhdGVTdHlsZSxcbiAgICB1cGRhdGU6IHVwZGF0ZVN0eWxlLFxuICAgIGRlc3Ryb3k6IGFwcGx5RGVzdHJveVN0eWxlLFxuICAgIHJlbW92ZTogYXBwbHlSZW1vdmVTdHlsZVxufTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuc3R5bGVNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdHlsZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcIi4vdm5vZGVcIik7XG52YXIgaXMgPSByZXF1aXJlKFwiLi9pc1wiKTtcbnZhciBodG1sZG9tYXBpXzEgPSByZXF1aXJlKFwiLi9odG1sZG9tYXBpXCIpO1xuZnVuY3Rpb24gaXNVbmRlZihzKSB7IHJldHVybiBzID09PSB1bmRlZmluZWQ7IH1cbmZ1bmN0aW9uIGlzRGVmKHMpIHsgcmV0dXJuIHMgIT09IHVuZGVmaW5lZDsgfVxudmFyIGVtcHR5Tm9kZSA9IHZub2RlXzEuZGVmYXVsdCgnJywge30sIFtdLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG5mdW5jdGlvbiBzYW1lVm5vZGUodm5vZGUxLCB2bm9kZTIpIHtcbiAgICByZXR1cm4gdm5vZGUxLmtleSA9PT0gdm5vZGUyLmtleSAmJiB2bm9kZTEuc2VsID09PSB2bm9kZTIuc2VsO1xufVxuZnVuY3Rpb24gaXNWbm9kZSh2bm9kZSkge1xuICAgIHJldHVybiB2bm9kZS5zZWwgIT09IHVuZGVmaW5lZDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUtleVRvT2xkSWR4KGNoaWxkcmVuLCBiZWdpbklkeCwgZW5kSWR4KSB7XG4gICAgdmFyIGksIG1hcCA9IHt9LCBrZXksIGNoO1xuICAgIGZvciAoaSA9IGJlZ2luSWR4OyBpIDw9IGVuZElkeDsgKytpKSB7XG4gICAgICAgIGNoID0gY2hpbGRyZW5baV07XG4gICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICBrZXkgPSBjaC5rZXk7XG4gICAgICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgbWFwW2tleV0gPSBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG59XG52YXIgaG9va3MgPSBbJ2NyZWF0ZScsICd1cGRhdGUnLCAncmVtb3ZlJywgJ2Rlc3Ryb3knLCAncHJlJywgJ3Bvc3QnXTtcbnZhciBoXzEgPSByZXF1aXJlKFwiLi9oXCIpO1xuZXhwb3J0cy5oID0gaF8xLmg7XG52YXIgdGh1bmtfMSA9IHJlcXVpcmUoXCIuL3RodW5rXCIpO1xuZXhwb3J0cy50aHVuayA9IHRodW5rXzEudGh1bms7XG5mdW5jdGlvbiBpbml0KG1vZHVsZXMsIGRvbUFwaSkge1xuICAgIHZhciBpLCBqLCBjYnMgPSB7fTtcbiAgICB2YXIgYXBpID0gZG9tQXBpICE9PSB1bmRlZmluZWQgPyBkb21BcGkgOiBodG1sZG9tYXBpXzEuZGVmYXVsdDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgaG9va3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY2JzW2hvb2tzW2ldXSA9IFtdO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgbW9kdWxlcy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgdmFyIGhvb2sgPSBtb2R1bGVzW2pdW2hvb2tzW2ldXTtcbiAgICAgICAgICAgIGlmIChob29rICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjYnNbaG9va3NbaV1dLnB1c2goaG9vayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZW1wdHlOb2RlQXQoZWxtKSB7XG4gICAgICAgIHZhciBpZCA9IGVsbS5pZCA/ICcjJyArIGVsbS5pZCA6ICcnO1xuICAgICAgICB2YXIgYyA9IGVsbS5jbGFzc05hbWUgPyAnLicgKyBlbG0uY2xhc3NOYW1lLnNwbGl0KCcgJykuam9pbignLicpIDogJyc7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQoYXBpLnRhZ05hbWUoZWxtKS50b0xvd2VyQ2FzZSgpICsgaWQgKyBjLCB7fSwgW10sIHVuZGVmaW5lZCwgZWxtKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY3JlYXRlUm1DYihjaGlsZEVsbSwgbGlzdGVuZXJzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBybUNiKCkge1xuICAgICAgICAgICAgaWYgKC0tbGlzdGVuZXJzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudF8xID0gYXBpLnBhcmVudE5vZGUoY2hpbGRFbG0pO1xuICAgICAgICAgICAgICAgIGFwaS5yZW1vdmVDaGlsZChwYXJlbnRfMSwgY2hpbGRFbG0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVFbG0odm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICB2YXIgaSwgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChpc0RlZihpID0gZGF0YS5ob29rKSAmJiBpc0RlZihpID0gaS5pbml0KSkge1xuICAgICAgICAgICAgICAgIGkodm5vZGUpO1xuICAgICAgICAgICAgICAgIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuLCBzZWwgPSB2bm9kZS5zZWw7XG4gICAgICAgIGlmIChzZWwgPT09ICchJykge1xuICAgICAgICAgICAgaWYgKGlzVW5kZWYodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICB2bm9kZS50ZXh0ID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2bm9kZS5lbG0gPSBhcGkuY3JlYXRlQ29tbWVudCh2bm9kZS50ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gUGFyc2Ugc2VsZWN0b3JcbiAgICAgICAgICAgIHZhciBoYXNoSWR4ID0gc2VsLmluZGV4T2YoJyMnKTtcbiAgICAgICAgICAgIHZhciBkb3RJZHggPSBzZWwuaW5kZXhPZignLicsIGhhc2hJZHgpO1xuICAgICAgICAgICAgdmFyIGhhc2ggPSBoYXNoSWR4ID4gMCA/IGhhc2hJZHggOiBzZWwubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGRvdCA9IGRvdElkeCA+IDAgPyBkb3RJZHggOiBzZWwubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIHRhZyA9IGhhc2hJZHggIT09IC0xIHx8IGRvdElkeCAhPT0gLTEgPyBzZWwuc2xpY2UoMCwgTWF0aC5taW4oaGFzaCwgZG90KSkgOiBzZWw7XG4gICAgICAgICAgICB2YXIgZWxtID0gdm5vZGUuZWxtID0gaXNEZWYoZGF0YSkgJiYgaXNEZWYoaSA9IGRhdGEubnMpID8gYXBpLmNyZWF0ZUVsZW1lbnROUyhpLCB0YWcpXG4gICAgICAgICAgICAgICAgOiBhcGkuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgICAgICAgICAgaWYgKGhhc2ggPCBkb3QpXG4gICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZSgnaWQnLCBzZWwuc2xpY2UoaGFzaCArIDEsIGRvdCkpO1xuICAgICAgICAgICAgaWYgKGRvdElkeCA+IDApXG4gICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBzZWwuc2xpY2UoZG90ICsgMSkucmVwbGFjZSgvXFwuL2csICcgJykpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5jcmVhdGUubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgY2JzLmNyZWF0ZVtpXShlbXB0eU5vZGUsIHZub2RlKTtcbiAgICAgICAgICAgIGlmIChpcy5hcnJheShjaGlsZHJlbikpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBjcmVhdGVFbG0oY2gsIGluc2VydGVkVm5vZGVRdWV1ZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKHZub2RlLnRleHQpKSB7XG4gICAgICAgICAgICAgICAgYXBpLmFwcGVuZENoaWxkKGVsbSwgYXBpLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSB2bm9kZS5kYXRhLmhvb2s7IC8vIFJldXNlIHZhcmlhYmxlXG4gICAgICAgICAgICBpZiAoaXNEZWYoaSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaS5jcmVhdGUpXG4gICAgICAgICAgICAgICAgICAgIGkuY3JlYXRlKGVtcHR5Tm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChpLmluc2VydClcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0ZWRWbm9kZVF1ZXVlLnB1c2godm5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdm5vZGUuZWxtID0gYXBpLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2bm9kZS5lbG07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZFZub2RlcyhwYXJlbnRFbG0sIGJlZm9yZSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICAgICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgICAgICAgdmFyIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSwgYmVmb3JlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBpbnZva2VEZXN0cm95SG9vayh2bm9kZSkge1xuICAgICAgICB2YXIgaSwgaiwgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChpc0RlZihpID0gZGF0YS5ob29rKSAmJiBpc0RlZihpID0gaS5kZXN0cm95KSlcbiAgICAgICAgICAgICAgICBpKHZub2RlKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMuZGVzdHJveS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMuZGVzdHJveVtpXSh2bm9kZSk7XG4gICAgICAgICAgICBpZiAodm5vZGUuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB2bm9kZS5jaGlsZHJlbi5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgICAgICBpID0gdm5vZGUuY2hpbGRyZW5bal07XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICE9IG51bGwgJiYgdHlwZW9mIGkgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGludm9rZURlc3Ryb3lIb29rKGkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIHZub2Rlcywgc3RhcnRJZHgsIGVuZElkeCkge1xuICAgICAgICBmb3IgKDsgc3RhcnRJZHggPD0gZW5kSWR4OyArK3N0YXJ0SWR4KSB7XG4gICAgICAgICAgICB2YXIgaV8xID0gdm9pZCAwLCBsaXN0ZW5lcnMgPSB2b2lkIDAsIHJtID0gdm9pZCAwLCBjaCA9IHZub2Rlc1tzdGFydElkeF07XG4gICAgICAgICAgICBpZiAoY2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChpc0RlZihjaC5zZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGludm9rZURlc3Ryb3lIb29rKGNoKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzID0gY2JzLnJlbW92ZS5sZW5ndGggKyAxO1xuICAgICAgICAgICAgICAgICAgICBybSA9IGNyZWF0ZVJtQ2IoY2guZWxtLCBsaXN0ZW5lcnMpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGlfMSA9IDA7IGlfMSA8IGNicy5yZW1vdmUubGVuZ3RoOyArK2lfMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNicy5yZW1vdmVbaV8xXShjaCwgcm0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNEZWYoaV8xID0gY2guZGF0YSkgJiYgaXNEZWYoaV8xID0gaV8xLmhvb2spICYmIGlzRGVmKGlfMSA9IGlfMS5yZW1vdmUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpXzEoY2gsIHJtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJtKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFwaS5yZW1vdmVDaGlsZChwYXJlbnRFbG0sIGNoLmVsbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZUNoaWxkcmVuKHBhcmVudEVsbSwgb2xkQ2gsIG5ld0NoLCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICAgICAgdmFyIG9sZFN0YXJ0SWR4ID0gMCwgbmV3U3RhcnRJZHggPSAwO1xuICAgICAgICB2YXIgb2xkRW5kSWR4ID0gb2xkQ2gubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFswXTtcbiAgICAgICAgdmFyIG9sZEVuZFZub2RlID0gb2xkQ2hbb2xkRW5kSWR4XTtcbiAgICAgICAgdmFyIG5ld0VuZElkeCA9IG5ld0NoLmxlbmd0aCAtIDE7XG4gICAgICAgIHZhciBuZXdTdGFydFZub2RlID0gbmV3Q2hbMF07XG4gICAgICAgIHZhciBuZXdFbmRWbm9kZSA9IG5ld0NoW25ld0VuZElkeF07XG4gICAgICAgIHZhciBvbGRLZXlUb0lkeDtcbiAgICAgICAgdmFyIGlkeEluT2xkO1xuICAgICAgICB2YXIgZWxtVG9Nb3ZlO1xuICAgICAgICB2YXIgYmVmb3JlO1xuICAgICAgICB3aGlsZSAob2xkU3RhcnRJZHggPD0gb2xkRW5kSWR4ICYmIG5ld1N0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgICAgICAgaWYgKG9sZFN0YXJ0Vm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTsgLy8gVm5vZGUgbWlnaHQgaGF2ZSBiZWVuIG1vdmVkIGxlZnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9sZEVuZFZub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBvbGRFbmRWbm9kZSA9IG9sZENoWy0tb2xkRW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld1N0YXJ0Vm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld0VuZFZub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgICAgICBvbGRTdGFydFZub2RlID0gb2xkQ2hbKytvbGRTdGFydElkeF07XG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdFbmRWbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZEVuZFZub2RlLCBuZXdFbmRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgICAgICBvbGRFbmRWbm9kZSA9IG9sZENoWy0tb2xkRW5kSWR4XTtcbiAgICAgICAgICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRTdGFydFZub2RlLCBuZXdFbmRWbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRTdGFydFZub2RlLmVsbSwgYXBpLm5leHRTaWJsaW5nKG9sZEVuZFZub2RlLmVsbSkpO1xuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRFbmRWbm9kZSwgbmV3U3RhcnRWbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRFbmRWbm9kZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICBvbGRFbmRWbm9kZSA9IG9sZENoWy0tb2xkRW5kSWR4XTtcbiAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkS2V5VG9JZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBvbGRLZXlUb0lkeCA9IGNyZWF0ZUtleVRvT2xkSWR4KG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4SW5PbGQgPSBvbGRLZXlUb0lkeFtuZXdTdGFydFZub2RlLmtleV07XG4gICAgICAgICAgICAgICAgaWYgKGlzVW5kZWYoaWR4SW5PbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBjcmVhdGVFbG0obmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbG1Ub01vdmUgPSBvbGRDaFtpZHhJbk9sZF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbG1Ub01vdmUuc2VsICE9PSBuZXdTdGFydFZub2RlLnNlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaFZub2RlKGVsbVRvTW92ZSwgbmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZENoW2lkeEluT2xkXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBlbG1Ub01vdmUuZWxtLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAob2xkU3RhcnRJZHggPD0gb2xkRW5kSWR4IHx8IG5ld1N0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgICAgICAgaWYgKG9sZFN0YXJ0SWR4ID4gb2xkRW5kSWR4KSB7XG4gICAgICAgICAgICAgICAgYmVmb3JlID0gbmV3Q2hbbmV3RW5kSWR4ICsgMV0gPT0gbnVsbCA/IG51bGwgOiBuZXdDaFtuZXdFbmRJZHggKyAxXS5lbG07XG4gICAgICAgICAgICAgICAgYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCBuZXdDaCwgbmV3U3RhcnRJZHgsIG5ld0VuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBpLCBob29rO1xuICAgICAgICBpZiAoaXNEZWYoaSA9IHZub2RlLmRhdGEpICYmIGlzRGVmKGhvb2sgPSBpLmhvb2spICYmIGlzRGVmKGkgPSBob29rLnByZXBhdGNoKSkge1xuICAgICAgICAgICAgaShvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBvbGRWbm9kZS5lbG07XG4gICAgICAgIHZhciBvbGRDaCA9IG9sZFZub2RlLmNoaWxkcmVuO1xuICAgICAgICB2YXIgY2ggPSB2bm9kZS5jaGlsZHJlbjtcbiAgICAgICAgaWYgKG9sZFZub2RlID09PSB2bm9kZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHZub2RlLmRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy51cGRhdGUubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgY2JzLnVwZGF0ZVtpXShvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgaSA9IHZub2RlLmRhdGEuaG9vaztcbiAgICAgICAgICAgIGlmIChpc0RlZihpKSAmJiBpc0RlZihpID0gaS51cGRhdGUpKVxuICAgICAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNVbmRlZih2bm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKG9sZENoKSAmJiBpc0RlZihjaCkpIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkQ2ggIT09IGNoKVxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVDaGlsZHJlbihlbG0sIG9sZENoLCBjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRGVmKGNoKSkge1xuICAgICAgICAgICAgICAgIGlmIChpc0RlZihvbGRWbm9kZS50ZXh0KSlcbiAgICAgICAgICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgJycpO1xuICAgICAgICAgICAgICAgIGFkZFZub2RlcyhlbG0sIG51bGwsIGNoLCAwLCBjaC5sZW5ndGggLSAxLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYob2xkQ2gpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKGVsbSwgb2xkQ2gsIDAsIG9sZENoLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYob2xkVm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2xkVm5vZGUudGV4dCAhPT0gdm5vZGUudGV4dCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKG9sZENoKSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhlbG0sIG9sZENoLCAwLCBvbGRDaC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFwaS5zZXRUZXh0Q29udGVudChlbG0sIHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0RlZihob29rKSAmJiBpc0RlZihpID0gaG9vay5wb3N0cGF0Y2gpKSB7XG4gICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBhdGNoKG9sZFZub2RlLCB2bm9kZSkge1xuICAgICAgICB2YXIgaSwgZWxtLCBwYXJlbnQ7XG4gICAgICAgIHZhciBpbnNlcnRlZFZub2RlUXVldWUgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5wcmUubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICBjYnMucHJlW2ldKCk7XG4gICAgICAgIGlmICghaXNWbm9kZShvbGRWbm9kZSkpIHtcbiAgICAgICAgICAgIG9sZFZub2RlID0gZW1wdHlOb2RlQXQob2xkVm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzYW1lVm5vZGUob2xkVm5vZGUsIHZub2RlKSkge1xuICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRWbm9kZSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbG0gPSBvbGRWbm9kZS5lbG07XG4gICAgICAgICAgICBwYXJlbnQgPSBhcGkucGFyZW50Tm9kZShlbG0pO1xuICAgICAgICAgICAgY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgaWYgKHBhcmVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50LCB2bm9kZS5lbG0sIGFwaS5uZXh0U2libGluZyhlbG0pKTtcbiAgICAgICAgICAgICAgICByZW1vdmVWbm9kZXMocGFyZW50LCBbb2xkVm5vZGVdLCAwLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWVbaV0uZGF0YS5ob29rLmluc2VydChpbnNlcnRlZFZub2RlUXVldWVbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMucG9zdC5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgIGNicy5wb3N0W2ldKCk7XG4gICAgICAgIHJldHVybiB2bm9kZTtcbiAgICB9O1xufVxuZXhwb3J0cy5pbml0ID0gaW5pdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNuYWJiZG9tLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGhfMSA9IHJlcXVpcmUoXCIuL2hcIik7XG5mdW5jdGlvbiBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmspIHtcbiAgICB0aHVuay5lbG0gPSB2bm9kZS5lbG07XG4gICAgdm5vZGUuZGF0YS5mbiA9IHRodW5rLmRhdGEuZm47XG4gICAgdm5vZGUuZGF0YS5hcmdzID0gdGh1bmsuZGF0YS5hcmdzO1xuICAgIHRodW5rLmRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIHRodW5rLmNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG4gICAgdGh1bmsudGV4dCA9IHZub2RlLnRleHQ7XG4gICAgdGh1bmsuZWxtID0gdm5vZGUuZWxtO1xufVxuZnVuY3Rpb24gaW5pdCh0aHVuaykge1xuICAgIHZhciBjdXIgPSB0aHVuay5kYXRhO1xuICAgIHZhciB2bm9kZSA9IGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGN1ci5hcmdzKTtcbiAgICBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmspO1xufVxuZnVuY3Rpb24gcHJlcGF0Y2gob2xkVm5vZGUsIHRodW5rKSB7XG4gICAgdmFyIGksIG9sZCA9IG9sZFZub2RlLmRhdGEsIGN1ciA9IHRodW5rLmRhdGE7XG4gICAgdmFyIG9sZEFyZ3MgPSBvbGQuYXJncywgYXJncyA9IGN1ci5hcmdzO1xuICAgIGlmIChvbGQuZm4gIT09IGN1ci5mbiB8fCBvbGRBcmdzLmxlbmd0aCAhPT0gYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAob2xkQXJnc1tpXSAhPT0gYXJnc1tpXSkge1xuICAgICAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb3B5VG9UaHVuayhvbGRWbm9kZSwgdGh1bmspO1xufVxuZXhwb3J0cy50aHVuayA9IGZ1bmN0aW9uIHRodW5rKHNlbCwga2V5LCBmbiwgYXJncykge1xuICAgIGlmIChhcmdzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXJncyA9IGZuO1xuICAgICAgICBmbiA9IGtleTtcbiAgICAgICAga2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gaF8xLmgoc2VsLCB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBob29rOiB7IGluaXQ6IGluaXQsIHByZXBhdGNoOiBwcmVwYXRjaCB9LFxuICAgICAgICBmbjogZm4sXG4gICAgICAgIGFyZ3M6IGFyZ3NcbiAgICB9KTtcbn07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLnRodW5rO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGh1bmsuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdm5vZGVfMSA9IHJlcXVpcmUoXCIuL3Zub2RlXCIpO1xudmFyIGh0bWxkb21hcGlfMSA9IHJlcXVpcmUoXCIuL2h0bWxkb21hcGlcIik7XG5mdW5jdGlvbiB0b1ZOb2RlKG5vZGUsIGRvbUFwaSkge1xuICAgIHZhciBhcGkgPSBkb21BcGkgIT09IHVuZGVmaW5lZCA/IGRvbUFwaSA6IGh0bWxkb21hcGlfMS5kZWZhdWx0O1xuICAgIHZhciB0ZXh0O1xuICAgIGlmIChhcGkuaXNFbGVtZW50KG5vZGUpKSB7XG4gICAgICAgIHZhciBpZCA9IG5vZGUuaWQgPyAnIycgKyBub2RlLmlkIDogJyc7XG4gICAgICAgIHZhciBjbiA9IG5vZGUuZ2V0QXR0cmlidXRlKCdjbGFzcycpO1xuICAgICAgICB2YXIgYyA9IGNuID8gJy4nICsgY24uc3BsaXQoJyAnKS5qb2luKCcuJykgOiAnJztcbiAgICAgICAgdmFyIHNlbCA9IGFwaS50YWdOYW1lKG5vZGUpLnRvTG93ZXJDYXNlKCkgKyBpZCArIGM7XG4gICAgICAgIHZhciBhdHRycyA9IHt9O1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgdmFyIG5hbWVfMTtcbiAgICAgICAgdmFyIGkgPSB2b2lkIDAsIG4gPSB2b2lkIDA7XG4gICAgICAgIHZhciBlbG1BdHRycyA9IG5vZGUuYXR0cmlidXRlcztcbiAgICAgICAgdmFyIGVsbUNoaWxkcmVuID0gbm9kZS5jaGlsZE5vZGVzO1xuICAgICAgICBmb3IgKGkgPSAwLCBuID0gZWxtQXR0cnMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBuYW1lXzEgPSBlbG1BdHRyc1tpXS5ub2RlTmFtZTtcbiAgICAgICAgICAgIGlmIChuYW1lXzEgIT09ICdpZCcgJiYgbmFtZV8xICE9PSAnY2xhc3MnKSB7XG4gICAgICAgICAgICAgICAgYXR0cnNbbmFtZV8xXSA9IGVsbUF0dHJzW2ldLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gZWxtQ2hpbGRyZW4ubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHRvVk5vZGUoZWxtQ2hpbGRyZW5baV0sIGRvbUFwaSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQoc2VsLCB7IGF0dHJzOiBhdHRycyB9LCBjaGlsZHJlbiwgdW5kZWZpbmVkLCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYXBpLmlzVGV4dChub2RlKSkge1xuICAgICAgICB0ZXh0ID0gYXBpLmdldFRleHRDb250ZW50KG5vZGUpO1xuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHRleHQsIG5vZGUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChhcGkuaXNDb21tZW50KG5vZGUpKSB7XG4gICAgICAgIHRleHQgPSBhcGkuZ2V0VGV4dENvbnRlbnQobm9kZSk7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQoJyEnLCB7fSwgW10sIHRleHQsIG5vZGUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdCgnJywge30sIFtdLCB1bmRlZmluZWQsIG5vZGUpO1xuICAgIH1cbn1cbmV4cG9ydHMudG9WTm9kZSA9IHRvVk5vZGU7XG5leHBvcnRzLmRlZmF1bHQgPSB0b1ZOb2RlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dG92bm9kZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIHZub2RlKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIGVsbSkge1xuICAgIHZhciBrZXkgPSBkYXRhID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBkYXRhLmtleTtcbiAgICByZXR1cm4geyBzZWw6IHNlbCwgZGF0YTogZGF0YSwgY2hpbGRyZW46IGNoaWxkcmVuLFxuICAgICAgICB0ZXh0OiB0ZXh0LCBlbG06IGVsbSwga2V5OiBrZXkgfTtcbn1cbmV4cG9ydHMudm5vZGUgPSB2bm9kZTtcbmV4cG9ydHMuZGVmYXVsdCA9IHZub2RlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dm5vZGUuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX3BvbnlmaWxsID0gcmVxdWlyZSgnLi9wb255ZmlsbC5qcycpO1xuXG52YXIgX3BvbnlmaWxsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3BvbnlmaWxsKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgcm9vdDsgLyogZ2xvYmFsIHdpbmRvdyAqL1xuXG5cbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHNlbGY7XG59IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBnbG9iYWw7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBtb2R1bGU7XG59IGVsc2Uge1xuICByb290ID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn1cblxudmFyIHJlc3VsdCA9ICgwLCBfcG9ueWZpbGwyWydkZWZhdWx0J10pKHJvb3QpO1xuZXhwb3J0c1snZGVmYXVsdCddID0gcmVzdWx0OyIsInZhciBuZXh0VGljayA9IHJlcXVpcmUoJ3Byb2Nlc3MvYnJvd3Nlci5qcycpLm5leHRUaWNrO1xudmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGltbWVkaWF0ZUlkcyA9IHt9O1xudmFyIG5leHRJbW1lZGlhdGVJZCA9IDA7XG5cbi8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cbmV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFyVGltZW91dCk7XG59O1xuZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRJbnRlcnZhbCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhckludGVydmFsKTtcbn07XG5leHBvcnRzLmNsZWFyVGltZW91dCA9XG5leHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbih0aW1lb3V0KSB7IHRpbWVvdXQuY2xvc2UoKTsgfTtcblxuZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuICB0aGlzLl9pZCA9IGlkO1xuICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcbn1cblRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2NsZWFyRm4uY2FsbCh3aW5kb3csIHRoaXMuX2lkKTtcbn07XG5cbi8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuZXhwb3J0cy5lbnJvbGwgPSBmdW5jdGlvbihpdGVtLCBtc2Vjcykge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG59O1xuXG5leHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gLTE7XG59O1xuXG5leHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cbiAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG4gIGlmIChtc2VjcyA+PSAwKSB7XG4gICAgaXRlbS5faWRsZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gb25UaW1lb3V0KCkge1xuICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcbiAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG4gICAgfSwgbXNlY3MpO1xuICB9XG59O1xuXG4vLyBUaGF0J3Mgbm90IGhvdyBub2RlLmpzIGltcGxlbWVudHMgaXQgYnV0IHRoZSBleHBvc2VkIGFwaSBpcyB0aGUgc2FtZS5cbmV4cG9ydHMuc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gc2V0SW1tZWRpYXRlIDogZnVuY3Rpb24oZm4pIHtcbiAgdmFyIGlkID0gbmV4dEltbWVkaWF0ZUlkKys7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aCA8IDIgPyBmYWxzZSA6IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBpbW1lZGlhdGVJZHNbaWRdID0gdHJ1ZTtcblxuICBuZXh0VGljayhmdW5jdGlvbiBvbk5leHRUaWNrKCkge1xuICAgIGlmIChpbW1lZGlhdGVJZHNbaWRdKSB7XG4gICAgICAvLyBmbi5jYWxsKCkgaXMgZmFzdGVyIHNvIHdlIG9wdGltaXplIGZvciB0aGUgY29tbW9uIHVzZS1jYXNlXG4gICAgICAvLyBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2NhbGwtYXBwbHktc2VndVxuICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbi5jYWxsKG51bGwpO1xuICAgICAgfVxuICAgICAgLy8gUHJldmVudCBpZHMgZnJvbSBsZWFraW5nXG4gICAgICBleHBvcnRzLmNsZWFySW1tZWRpYXRlKGlkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpZDtcbn07XG5cbmV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSB0eXBlb2YgY2xlYXJJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IGNsZWFySW1tZWRpYXRlIDogZnVuY3Rpb24oaWQpIHtcbiAgZGVsZXRlIGltbWVkaWF0ZUlkc1tpZF07XG59OyIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gX19leHBvcnQobSkge1xuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKCFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBleHBvcnRzW3BdID0gbVtwXTtcbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NlbGVjdG9yUGFyc2VyXCIpKTtcbnZhciBtYXRjaGVzXzEgPSByZXF1aXJlKFwiLi9tYXRjaGVzXCIpO1xuZXhwb3J0cy5jcmVhdGVNYXRjaGVzID0gbWF0Y2hlc18xLmNyZWF0ZU1hdGNoZXM7XG52YXIgcXVlcnlTZWxlY3Rvcl8xID0gcmVxdWlyZShcIi4vcXVlcnlTZWxlY3RvclwiKTtcbmV4cG9ydHMuY3JlYXRlUXVlcnlTZWxlY3RvciA9IHF1ZXJ5U2VsZWN0b3JfMS5jcmVhdGVRdWVyeVNlbGVjdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoXCIuL3NlbGVjdG9yUGFyc2VyXCIpO1xuZnVuY3Rpb24gY3JlYXRlTWF0Y2hlcyhvcHRzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG1hdGNoZXMoc2VsZWN0b3IsIG5vZGUpIHtcbiAgICAgICAgdmFyIF9hID0gdHlwZW9mIHNlbGVjdG9yID09PSAnb2JqZWN0JyA/IHNlbGVjdG9yIDogc2VsZWN0b3JQYXJzZXJfMS5wYXJzZVNlbGVjdG9yKHNlbGVjdG9yKSwgdGFnID0gX2EudGFnLCBpZCA9IF9hLmlkLCBjbGFzc0xpc3QgPSBfYS5jbGFzc0xpc3QsIGF0dHJpYnV0ZXMgPSBfYS5hdHRyaWJ1dGVzLCBuZXh0U2VsZWN0b3IgPSBfYS5uZXh0U2VsZWN0b3IsIHBzZXVkb3MgPSBfYS5wc2V1ZG9zO1xuICAgICAgICBpZiAobmV4dFNlbGVjdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbWF0Y2hlcyBjYW4gb25seSBwcm9jZXNzIHNlbGVjdG9ycyB0aGF0IHRhcmdldCBhIHNpbmdsZSBlbGVtZW50Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRhZyAmJiB0YWcudG9Mb3dlckNhc2UoKSAhPT0gb3B0cy50YWcobm9kZSkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpZCAmJiBpZCAhPT0gb3B0cy5pZChub2RlKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjbGFzc2VzID0gb3B0cy5jbGFzc05hbWUobm9kZSkuc3BsaXQoJyAnKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChjbGFzc2VzLmluZGV4T2YoY2xhc3NMaXN0W2ldKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIHZhciBhdHRyID0gb3B0cy5hdHRyKG5vZGUsIGtleSk7XG4gICAgICAgICAgICB2YXIgdCA9IGF0dHJpYnV0ZXNba2V5XVswXTtcbiAgICAgICAgICAgIHZhciB2ID0gYXR0cmlidXRlc1trZXldWzFdO1xuICAgICAgICAgICAgaWYgKGF0dHIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ID09PSAnaGFzJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQgPT09ICdleGFjdCcgJiYgYXR0ciAhPT0gdikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHQgIT09ICdleGFjdCcpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHYgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQWxsIG5vbi1zdHJpbmcgdmFsdWVzIGhhdmUgdG8gYmUgYW4gZXhhY3QgbWF0Y2gnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdzdGFydHNXaXRoJyAmJiAhYXR0ci5zdGFydHNXaXRoKHYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdlbmRzV2l0aCcgJiYgIWF0dHIuZW5kc1dpdGgodikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ2NvbnRhaW5zJyAmJiBhdHRyLmluZGV4T2YodikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICd3aGl0ZXNwYWNlJyAmJiBhdHRyLnNwbGl0KCcgJykuaW5kZXhPZih2KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ2Rhc2gnICYmIGF0dHIuc3BsaXQoJy0nKS5pbmRleE9mKHYpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHNldWRvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIF9iID0gcHNldWRvc1tpXSwgdCA9IF9iWzBdLCBkYXRhID0gX2JbMV07XG4gICAgICAgICAgICBpZiAodCA9PT0gJ2NvbnRhaW5zJyAmJiBkYXRhICE9PSBvcHRzLmNvbnRlbnRzKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQgPT09ICdlbXB0eScgJiZcbiAgICAgICAgICAgICAgICAob3B0cy5jb250ZW50cyhub2RlKSB8fCBvcHRzLmNoaWxkcmVuKG5vZGUpLmxlbmd0aCAhPT0gMCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodCA9PT0gJ3Jvb3QnICYmIG9wdHMucGFyZW50KG5vZGUpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodC5pbmRleE9mKCdjaGlsZCcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGlmICghb3B0cy5wYXJlbnQobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc2libGluZ3MgPSBvcHRzLmNoaWxkcmVuKG9wdHMucGFyZW50KG5vZGUpKTtcbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ2ZpcnN0LWNoaWxkJyAmJiBzaWJsaW5ncy5pbmRleE9mKG5vZGUpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdsYXN0LWNoaWxkJyAmJlxuICAgICAgICAgICAgICAgICAgICBzaWJsaW5ncy5pbmRleE9mKG5vZGUpICE9PSBzaWJsaW5ncy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdudGgtY2hpbGQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdleCA9IC8oW1xcKy1dPykoXFxkKikobj8pKFxcK1xcZCspPy87XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJzZVJlc3VsdCA9IHJlZ2V4LmV4ZWMoZGF0YSkuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHNpYmxpbmdzLmluZGV4T2Yobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFyc2VSZXN1bHRbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUmVzdWx0WzBdID0gJysnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBmYWN0b3IgPSBwYXJzZVJlc3VsdFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBwYXJzZUludChwYXJzZVJlc3VsdFswXSArIHBhcnNlUmVzdWx0WzFdKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhZGQgPSBwYXJzZUludChwYXJzZVJlc3VsdFszXSB8fCAnMCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmFjdG9yICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVJlc3VsdFsyXSA9PT0gJ24nICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCAlIGZhY3RvciAhPT0gYWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIWZhY3RvciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VSZXN1bHRbMl0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICgocGFyc2VSZXN1bHRbMF0gPT09ICcrJyAmJiBpbmRleCAtIGFkZCA8IDApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhcnNlUmVzdWx0WzBdID09PSAnLScgJiYgaW5kZXggLSBhZGQgPj0gMCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIXBhcnNlUmVzdWx0WzJdICYmIGZhY3RvciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggIT09IGZhY3RvciAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xufVxuZXhwb3J0cy5jcmVhdGVNYXRjaGVzID0gY3JlYXRlTWF0Y2hlcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1hdGNoZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoXCIuL3NlbGVjdG9yUGFyc2VyXCIpO1xudmFyIG1hdGNoZXNfMSA9IHJlcXVpcmUoXCIuL21hdGNoZXNcIik7XG5mdW5jdGlvbiBjcmVhdGVRdWVyeVNlbGVjdG9yKG9wdGlvbnMsIG1hdGNoZXMpIHtcbiAgICB2YXIgX21hdGNoZXMgPSBtYXRjaGVzIHx8IG1hdGNoZXNfMS5jcmVhdGVNYXRjaGVzKG9wdGlvbnMpO1xuICAgIGZ1bmN0aW9uIGZpbmRTdWJ0cmVlKHNlbGVjdG9yLCBkZXB0aCwgbm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbiA9IF9tYXRjaGVzKHNlbGVjdG9yLCBub2RlKTtcbiAgICAgICAgdmFyIG1hdGNoZWQgPSBuID8gKHR5cGVvZiBuID09PSAnb2JqZWN0JyA/IFtuXSA6IFtub2RlXSkgOiBbXTtcbiAgICAgICAgaWYgKGRlcHRoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2hpbGRNYXRjaGVkID0gb3B0aW9uc1xuICAgICAgICAgICAgLmNoaWxkcmVuKG5vZGUpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiB0eXBlb2YgYyAhPT0gJ3N0cmluZyc7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBmaW5kU3VidHJlZShzZWxlY3RvciwgZGVwdGggLSAxLCBjKTsgfSlcbiAgICAgICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgY3VycikgeyByZXR1cm4gYWNjLmNvbmNhdChjdXJyKTsgfSwgW10pO1xuICAgICAgICByZXR1cm4gbWF0Y2hlZC5jb25jYXQoY2hpbGRNYXRjaGVkKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZmluZFNpYmxpbmcoc2VsZWN0b3IsIG5leHQsIG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlIHx8IG9wdGlvbnMucGFyZW50KG5vZGUpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICB2YXIgc2libGluZ3MgPSBvcHRpb25zLmNoaWxkcmVuKG9wdGlvbnMucGFyZW50KG5vZGUpKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHNpYmxpbmdzLmluZGV4T2Yobm9kZSkgKyAxOyBpIDwgc2libGluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc2libGluZ3NbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbiA9IF9tYXRjaGVzKHNlbGVjdG9yLCBzaWJsaW5nc1tpXSk7XG4gICAgICAgICAgICBpZiAobikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHNpYmxpbmdzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gcXVlcnlTZWxlY3RvcihzZWxlY3Rvciwgbm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2VsID0gdHlwZW9mIHNlbGVjdG9yID09PSAnb2JqZWN0JyA/IHNlbGVjdG9yIDogc2VsZWN0b3JQYXJzZXJfMS5wYXJzZVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbbm9kZV07XG4gICAgICAgIHZhciBjdXJyZW50U2VsZWN0b3IgPSBzZWw7XG4gICAgICAgIHZhciBjdXJyZW50Q29tYmluYXRvciA9ICdzdWJ0cmVlJztcbiAgICAgICAgdmFyIHRhaWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBfbG9vcF8xID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGFpbCA9IGN1cnJlbnRTZWxlY3Rvci5uZXh0U2VsZWN0b3I7XG4gICAgICAgICAgICBjdXJyZW50U2VsZWN0b3IubmV4dFNlbGVjdG9yID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDb21iaW5hdG9yID09PSAnc3VidHJlZScgfHxcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29tYmluYXRvciA9PT0gJ2NoaWxkJykge1xuICAgICAgICAgICAgICAgIHZhciBkZXB0aF8xID0gY3VycmVudENvbWJpbmF0b3IgPT09ICdzdWJ0cmVlJyA/IEluZmluaXR5IDogMTtcbiAgICAgICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChuKSB7IHJldHVybiBmaW5kU3VidHJlZShjdXJyZW50U2VsZWN0b3IsIGRlcHRoXzEsIG4pOyB9KVxuICAgICAgICAgICAgICAgICAgICAucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGN1cnIpIHsgcmV0dXJuIGFjYy5jb25jYXQoY3Vycik7IH0sIFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0XzEgPSBjdXJyZW50Q29tYmluYXRvciA9PT0gJ25leHRTaWJsaW5nJztcbiAgICAgICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChuKSB7IHJldHVybiBmaW5kU2libGluZyhjdXJyZW50U2VsZWN0b3IsIG5leHRfMSwgbik7IH0pXG4gICAgICAgICAgICAgICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgY3VycikgeyByZXR1cm4gYWNjLmNvbmNhdChjdXJyKTsgfSwgW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRhaWwpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50U2VsZWN0b3IgPSB0YWlsWzFdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRDb21iaW5hdG9yID0gdGFpbFswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgX2xvb3BfMSgpO1xuICAgICAgICB9IHdoaWxlICh0YWlsICE9PSB1bmRlZmluZWQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xufVxuZXhwb3J0cy5jcmVhdGVRdWVyeVNlbGVjdG9yID0gY3JlYXRlUXVlcnlTZWxlY3Rvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXJ5U2VsZWN0b3IuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBJREVOVCA9ICdbXFxcXHctXSsnO1xudmFyIFNQQUNFID0gJ1sgXFx0XSonO1xudmFyIFZBTFVFID0gXCJbXlxcXFxdXStcIjtcbnZhciBDTEFTUyA9IFwiKD86XFxcXC5cIiArIElERU5UICsgXCIpXCI7XG52YXIgSUQgPSBcIig/OiNcIiArIElERU5UICsgXCIpXCI7XG52YXIgT1AgPSBcIig/Oj18XFxcXCQ9fFxcXFxePXxcXFxcKj18fj18XFxcXHw9KVwiO1xudmFyIEFUVFIgPSBcIig/OlxcXFxbXCIgKyBTUEFDRSArIElERU5UICsgU1BBQ0UgKyBcIig/OlwiICsgT1AgKyBTUEFDRSArIFZBTFVFICsgU1BBQ0UgKyBcIik/XFxcXF0pXCI7XG52YXIgU1VCVFJFRSA9IFwiKD86WyBcXHRdKylcIjtcbnZhciBDSElMRCA9IFwiKD86XCIgKyBTUEFDRSArIFwiKD4pXCIgKyBTUEFDRSArIFwiKVwiO1xudmFyIE5FWFRfU0lCTElORyA9IFwiKD86XCIgKyBTUEFDRSArIFwiKFxcXFwrKVwiICsgU1BBQ0UgKyBcIilcIjtcbnZhciBTSUJMSU5HID0gXCIoPzpcIiArIFNQQUNFICsgXCIofilcIiArIFNQQUNFICsgXCIpXCI7XG52YXIgQ09NQklOQVRPUiA9IFwiKD86XCIgKyBTVUJUUkVFICsgXCJ8XCIgKyBDSElMRCArIFwifFwiICsgTkVYVF9TSUJMSU5HICsgXCJ8XCIgKyBTSUJMSU5HICsgXCIpXCI7XG52YXIgQ09OVEFJTlMgPSBcImNvbnRhaW5zXFxcXChcXFwiW15cXFwiXSpcXFwiXFxcXClcIjtcbnZhciBGT1JNVUxBID0gXCIoPzpldmVufG9kZHxcXFxcZCooPzotP24oPzpcXFxcK1xcXFxkKyk/KT8pXCI7XG52YXIgTlRIX0NISUxEID0gXCJudGgtY2hpbGRcXFxcKFwiICsgRk9STVVMQSArIFwiXFxcXClcIjtcbnZhciBQU0VVRE8gPSBcIjooPzpmaXJzdC1jaGlsZHxsYXN0LWNoaWxkfFwiICsgTlRIX0NISUxEICsgXCJ8ZW1wdHl8cm9vdHxcIiArIENPTlRBSU5TICsgXCIpXCI7XG52YXIgVEFHID0gXCIoOj9cIiArIElERU5UICsgXCIpP1wiO1xudmFyIFRPS0VOUyA9IENMQVNTICsgXCJ8XCIgKyBJRCArIFwifFwiICsgQVRUUiArIFwifFwiICsgUFNFVURPICsgXCJ8XCIgKyBDT01CSU5BVE9SO1xudmFyIGNvbWJpbmF0b3JSZWdleCA9IG5ldyBSZWdFeHAoXCJeXCIgKyBDT01CSU5BVE9SICsgXCIkXCIpO1xuLyoqXG4gKiBQYXJzZXMgYSBjc3Mgc2VsZWN0b3IgaW50byBhIG5vcm1hbGl6ZWQgb2JqZWN0LlxuICogRXhwZWN0cyBhIHNlbGVjdG9yIGZvciBhIHNpbmdsZSBlbGVtZW50IG9ubHksIG5vIGA+YCBvciB0aGUgbGlrZSFcbiAqL1xuZnVuY3Rpb24gcGFyc2VTZWxlY3RvcihzZWxlY3Rvcikge1xuICAgIHZhciBzZWwgPSBzZWxlY3Rvci50cmltKCk7XG4gICAgdmFyIHRhZ1JlZ2V4ID0gbmV3IFJlZ0V4cChUQUcsICd5Jyk7XG4gICAgdmFyIHRhZyA9IHRhZ1JlZ2V4LmV4ZWMoc2VsKVswXTtcbiAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFRPS0VOUywgJ3knKTtcbiAgICByZWdleC5sYXN0SW5kZXggPSB0YWdSZWdleC5sYXN0SW5kZXg7XG4gICAgdmFyIG1hdGNoZXMgPSBbXTtcbiAgICB2YXIgbmV4dFNlbGVjdG9yID0gdW5kZWZpbmVkO1xuICAgIHZhciBsYXN0Q29tYmluYXRvciA9IHVuZGVmaW5lZDtcbiAgICB2YXIgaW5kZXggPSAtMTtcbiAgICB3aGlsZSAocmVnZXgubGFzdEluZGV4IDwgc2VsLmxlbmd0aCkge1xuICAgICAgICB2YXIgbWF0Y2ggPSByZWdleC5leGVjKHNlbCk7XG4gICAgICAgIGlmICghbWF0Y2ggJiYgbGFzdENvbWJpbmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXJzZSBlcnJvciwgaW52YWxpZCBzZWxlY3RvcicpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG1hdGNoICYmIGNvbWJpbmF0b3JSZWdleC50ZXN0KG1hdGNoWzBdKSkge1xuICAgICAgICAgICAgdmFyIGNvbWIgPSBjb21iaW5hdG9yUmVnZXguZXhlYyhtYXRjaFswXSlbMF07XG4gICAgICAgICAgICBsYXN0Q29tYmluYXRvciA9IGNvbWI7XG4gICAgICAgICAgICBpbmRleCA9IHJlZ2V4Lmxhc3RJbmRleDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChsYXN0Q29tYmluYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbmV4dFNlbGVjdG9yID0gW1xuICAgICAgICAgICAgICAgICAgICBnZXRDb21iaW5hdG9yKGxhc3RDb21iaW5hdG9yKSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3RvcihzZWwuc3Vic3RyaW5nKGluZGV4KSlcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKG1hdGNoWzBdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgY2xhc3NMaXN0ID0gbWF0Y2hlc1xuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN0YXJ0c1dpdGgoJy4nKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdWJzdHJpbmcoMSk7IH0pO1xuICAgIHZhciBpZHMgPSBtYXRjaGVzLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdGFydHNXaXRoKCcjJyk7IH0pLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdWJzdHJpbmcoMSk7IH0pO1xuICAgIGlmIChpZHMubGVuZ3RoID4gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc2VsZWN0b3IsIG9ubHkgb25lIGlkIGlzIGFsbG93ZWQnKTtcbiAgICB9XG4gICAgdmFyIHBvc3Rwcm9jZXNzUmVnZXggPSBuZXcgUmVnRXhwKFwiKFwiICsgSURFTlQgKyBcIilcIiArIFNQQUNFICsgXCIoXCIgKyBPUCArIFwiKT9cIiArIFNQQUNFICsgXCIoXCIgKyBWQUxVRSArIFwiKT9cIik7XG4gICAgdmFyIGF0dHJzID0gbWF0Y2hlc1xuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN0YXJ0c1dpdGgoJ1snKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcG9zdHByb2Nlc3NSZWdleC5leGVjKHMpLnNsaWNlKDEsIDQpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgYXR0ciA9IF9hWzBdLCBvcCA9IF9hWzFdLCB2YWwgPSBfYVsyXTtcbiAgICAgICAgdmFyIF9iO1xuICAgICAgICByZXR1cm4gKF9iID0ge30sXG4gICAgICAgICAgICBfYlthdHRyXSA9IFtnZXRPcChvcCksIHZhbCA/IHBhcnNlQXR0clZhbHVlKHZhbCkgOiB2YWxdLFxuICAgICAgICAgICAgX2IpO1xuICAgIH0pXG4gICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgY3VycikgeyByZXR1cm4gKF9fYXNzaWduKHt9LCBhY2MsIGN1cnIpKTsgfSwge30pO1xuICAgIHZhciBwc2V1ZG9zID0gbWF0Y2hlc1xuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN0YXJ0c1dpdGgoJzonKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcG9zdFByb2Nlc3NQc2V1ZG9zKHMuc3Vic3RyaW5nKDEpKTsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IGlkc1swXSB8fCAnJyxcbiAgICAgICAgdGFnOiB0YWcsXG4gICAgICAgIGNsYXNzTGlzdDogY2xhc3NMaXN0LFxuICAgICAgICBhdHRyaWJ1dGVzOiBhdHRycyxcbiAgICAgICAgbmV4dFNlbGVjdG9yOiBuZXh0U2VsZWN0b3IsXG4gICAgICAgIHBzZXVkb3M6IHBzZXVkb3NcbiAgICB9O1xufVxuZXhwb3J0cy5wYXJzZVNlbGVjdG9yID0gcGFyc2VTZWxlY3RvcjtcbmZ1bmN0aW9uIHBhcnNlQXR0clZhbHVlKHYpIHtcbiAgICBpZiAodi5zdGFydHNXaXRoKCdcIicpKSB7XG4gICAgICAgIHJldHVybiB2LnNsaWNlKDEsIC0xKTtcbiAgICB9XG4gICAgaWYgKHYgPT09IFwidHJ1ZVwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodiA9PT0gXCJmYWxzZVwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGYgPSBwYXJzZUZsb2F0KHYpO1xuICAgIGlmIChpc05hTihmKSkge1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG4gICAgcmV0dXJuIGY7XG59XG5mdW5jdGlvbiBwb3N0UHJvY2Vzc1BzZXVkb3Moc2VsKSB7XG4gICAgaWYgKHNlbCA9PT0gJ2ZpcnN0LWNoaWxkJyB8fFxuICAgICAgICBzZWwgPT09ICdsYXN0LWNoaWxkJyB8fFxuICAgICAgICBzZWwgPT09ICdyb290JyB8fFxuICAgICAgICBzZWwgPT09ICdlbXB0eScpIHtcbiAgICAgICAgcmV0dXJuIFtzZWwsIHVuZGVmaW5lZF07XG4gICAgfVxuICAgIGlmIChzZWwuc3RhcnRzV2l0aCgnY29udGFpbnMnKSkge1xuICAgICAgICB2YXIgdGV4dCA9IHNlbC5zbGljZSgxMCwgLTIpO1xuICAgICAgICByZXR1cm4gWydjb250YWlucycsIHRleHRdO1xuICAgIH1cbiAgICB2YXIgY29udGVudCA9IHNlbC5zbGljZSgxMCwgLTEpO1xuICAgIGlmIChjb250ZW50ID09PSAnZXZlbicpIHtcbiAgICAgICAgY29udGVudCA9ICcybic7XG4gICAgfVxuICAgIGlmIChjb250ZW50ID09PSAnb2RkJykge1xuICAgICAgICBjb250ZW50ID0gJzJuKzEnO1xuICAgIH1cbiAgICByZXR1cm4gWydudGgtY2hpbGQnLCBjb250ZW50XTtcbn1cbmZ1bmN0aW9uIGdldE9wKG9wKSB7XG4gICAgc3dpdGNoIChvcCkge1xuICAgICAgICBjYXNlICc9JzpcbiAgICAgICAgICAgIHJldHVybiAnZXhhY3QnO1xuICAgICAgICBjYXNlICdePSc6XG4gICAgICAgICAgICByZXR1cm4gJ3N0YXJ0c1dpdGgnO1xuICAgICAgICBjYXNlICckPSc6XG4gICAgICAgICAgICByZXR1cm4gJ2VuZHNXaXRoJztcbiAgICAgICAgY2FzZSAnKj0nOlxuICAgICAgICAgICAgcmV0dXJuICdjb250YWlucyc7XG4gICAgICAgIGNhc2UgJ349JzpcbiAgICAgICAgICAgIHJldHVybiAnd2hpdGVzcGFjZSc7XG4gICAgICAgIGNhc2UgJ3w9JzpcbiAgICAgICAgICAgIHJldHVybiAnZGFzaCc7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJ2hhcyc7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0Q29tYmluYXRvcihjb21iKSB7XG4gICAgc3dpdGNoIChjb21iLnRyaW0oKSkge1xuICAgICAgICBjYXNlICc+JzpcbiAgICAgICAgICAgIHJldHVybiAnY2hpbGQnO1xuICAgICAgICBjYXNlICcrJzpcbiAgICAgICAgICAgIHJldHVybiAnbmV4dFNpYmxpbmcnO1xuICAgICAgICBjYXNlICd+JzpcbiAgICAgICAgICAgIHJldHVybiAnc2libGluZyc7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJ3N1YnRyZWUnO1xuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNlbGVjdG9yUGFyc2VyLmpzLm1hcCIsImltcG9ydCB7U3RyZWFtLCBJbnRlcm5hbFByb2R1Y2VyLCBJbnRlcm5hbExpc3RlbmVyLCBPdXRTZW5kZXJ9IGZyb20gJy4uL2luZGV4JztcblxuY2xhc3MgQ29uY2F0UHJvZHVjZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+LCBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdjb25jYXQnO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD4gPSBudWxsIGFzIGFueTtcbiAgcHJpdmF0ZSBpOiBudW1iZXIgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBzdHJlYW1zOiBBcnJheTxTdHJlYW08VD4+KSB7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLnN0cmVhbXNbdGhpcy5pXS5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3Qgc3RyZWFtcyA9IHRoaXMuc3RyZWFtcztcbiAgICBpZiAodGhpcy5pIDwgc3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgIHN0cmVhbXNbdGhpcy5pXS5fcmVtb3ZlKHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLmkgPSAwO1xuICAgIHRoaXMub3V0ID0gbnVsbCBhcyBhbnk7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3Qgc3RyZWFtcyA9IHRoaXMuc3RyZWFtcztcbiAgICBzdHJlYW1zW3RoaXMuaV0uX3JlbW92ZSh0aGlzKTtcbiAgICBpZiAoKyt0aGlzLmkgPCBzdHJlYW1zLmxlbmd0aCkge1xuICAgICAgc3RyZWFtc1t0aGlzLmldLl9hZGQodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQdXRzIG9uZSBzdHJlYW0gYWZ0ZXIgdGhlIG90aGVyLiAqY29uY2F0KiBpcyBhIGZhY3RvcnkgdGhhdCB0YWtlcyBtdWx0aXBsZVxuICogc3RyZWFtcyBhcyBhcmd1bWVudHMsIGFuZCBzdGFydHMgdGhlIGBuKzFgLXRoIHN0cmVhbSBvbmx5IHdoZW4gdGhlIGBuYC10aFxuICogc3RyZWFtIGhhcyBjb21wbGV0ZWQuIEl0IGNvbmNhdGVuYXRlcyB0aG9zZSBzdHJlYW1zIHRvZ2V0aGVyLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tMi0tLTMtLS00LXxcbiAqIC4uLi4uLi4uLi4uLi4uLi0tYS1iLWMtLWQtfFxuICogICAgICAgICAgIGNvbmNhdFxuICogLS0xLS0yLS0tMy0tLTQtLS1hLWItYy0tZC18XG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgY29uY2F0IGZyb20gJ3hzdHJlYW0vZXh0cmEvY29uY2F0J1xuICpcbiAqIGNvbnN0IHN0cmVhbUEgPSB4cy5vZignYScsICdiJywgJ2MnKVxuICogY29uc3Qgc3RyZWFtQiA9IHhzLm9mKDEwLCAyMCwgMzApXG4gKiBjb25zdCBzdHJlYW1DID0geHMub2YoJ1gnLCAnWScsICdaJylcbiAqXG4gKiBjb25zdCBvdXRwdXRTdHJlYW0gPSBjb25jYXQoc3RyZWFtQSwgc3RyZWFtQiwgc3RyZWFtQylcbiAqXG4gKiBvdXRwdXRTdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiAoeCkgPT4gY29uc29sZS5sb2coeCksXG4gKiAgIGVycm9yOiAoZXJyKSA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29uY2F0IGNvbXBsZXRlZCcpLFxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBmYWN0b3J5IHRydWVcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIGNvbmNhdGVuYXRlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIGNvbmNhdGVuYXRlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy4gVHdvXG4gKiBvciBtb3JlIHN0cmVhbXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29uY2F0PFQ+KC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxUPj4pOiBTdHJlYW08VD4ge1xuICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgQ29uY2F0UHJvZHVjZXIoc3RyZWFtcykpO1xufVxuIiwiaW1wb3J0IHtJbnRlcm5hbExpc3RlbmVyLCBPcGVyYXRvciwgU3RyZWFtfSBmcm9tICcuLi9pbmRleCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2FtcGxlQ29tYmluZVNpZ25hdHVyZSB7XG4gICgpOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1RdPjtcbiAgPFQxPihzMTogU3RyZWFtPFQxPik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDFdPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMl0+O1xuICA8VDEsIFQyLCBUMz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDNdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0Pik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUMywgVDRdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDMsIFQ0LCBUNV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDZdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3Pik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDddPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOF0+O1xuICAoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KTogKHM6IFN0cmVhbTxhbnk+KSA9PiBTdHJlYW08QXJyYXk8YW55Pj47XG59XG5cbmNvbnN0IE5PID0ge307XG5cbmV4cG9ydCBjbGFzcyBTYW1wbGVDb21iaW5lTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBpOiBudW1iZXIsIHByaXZhdGUgcDogU2FtcGxlQ29tYmluZU9wZXJhdG9yPGFueT4pIHtcbiAgICBwLmlsc1tpXSA9IHRoaXM7XG4gIH1cblxuICBfbih0OiBUKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMucDtcbiAgICBpZiAocC5vdXQgPT09IE5PKSByZXR1cm47XG4gICAgcC51cCh0LCB0aGlzLmkpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLnAuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIHRoaXMucC5kb3duKHRoaXMuaSwgdGhpcyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNhbXBsZUNvbWJpbmVPcGVyYXRvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIEFycmF5PGFueT4+IHtcbiAgcHVibGljIHR5cGUgPSAnc2FtcGxlQ29tYmluZSc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG90aGVyczogQXJyYXk8U3RyZWFtPGFueT4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08QXJyYXk8YW55Pj47XG4gIHB1YmxpYyBpbHM6IEFycmF5PFNhbXBsZUNvbWJpbmVMaXN0ZW5lcjxhbnk+PjtcbiAgcHVibGljIE5uOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqbipleHRcbiAgcHVibGljIHZhbHM6IEFycmF5PGFueT47XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIHN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3RoZXJzID0gc3RyZWFtcztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxBcnJheTxhbnk+PjtcbiAgICB0aGlzLmlscyA9IFtdO1xuICAgIHRoaXMuTm4gPSAwO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPEFycmF5PGFueT4+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgY29uc3QgcyA9IHRoaXMub3RoZXJzO1xuICAgIGNvbnN0IG4gPSB0aGlzLk5uID0gcy5sZW5ndGg7XG4gICAgY29uc3QgdmFscyA9IHRoaXMudmFscyA9IG5ldyBBcnJheShuKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgdmFsc1tpXSA9IE5PO1xuICAgICAgc1tpXS5fYWRkKG5ldyBTYW1wbGVDb21iaW5lTGlzdGVuZXI8YW55PihpLCB0aGlzKSk7XG4gICAgfVxuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5vdGhlcnM7XG4gICAgY29uc3QgbiA9IHMubGVuZ3RoO1xuICAgIGNvbnN0IGlscyA9IHRoaXMuaWxzO1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIHNbaV0uX3JlbW92ZShpbHNbaV0pO1xuICAgIH1cbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxBcnJheTxhbnk+PjtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgICB0aGlzLmlscyA9IFtdO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuTm4gPiAwKSByZXR1cm47XG4gICAgb3V0Ll9uKFt0LCAuLi50aGlzLnZhbHNdKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KTogdm9pZCB7XG4gICAgY29uc3Qgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBvdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgb3V0Ll9jKCk7XG4gIH1cblxuICB1cCh0OiBhbnksIGk6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IHYgPSB0aGlzLnZhbHNbaV07XG4gICAgaWYgKHRoaXMuTm4gPiAwICYmIHYgPT09IE5PKSB7XG4gICAgICB0aGlzLk5uLS07XG4gICAgfVxuICAgIHRoaXMudmFsc1tpXSA9IHQ7XG4gIH1cblxuICBkb3duKGk6IG51bWJlciwgbDogU2FtcGxlQ29tYmluZUxpc3RlbmVyPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLm90aGVyc1tpXS5fcmVtb3ZlKGwpO1xuICB9XG59XG5cbmxldCBzYW1wbGVDb21iaW5lOiBTYW1wbGVDb21iaW5lU2lnbmF0dXJlO1xuXG4vKipcbiAqXG4gKiBDb21iaW5lcyBhIHNvdXJjZSBzdHJlYW0gd2l0aCBtdWx0aXBsZSBvdGhlciBzdHJlYW1zLiBUaGUgcmVzdWx0IHN0cmVhbVxuICogd2lsbCBlbWl0IHRoZSBsYXRlc3QgZXZlbnRzIGZyb20gYWxsIGlucHV0IHN0cmVhbXMsIGJ1dCBvbmx5IHdoZW4gdGhlXG4gKiBzb3VyY2Ugc3RyZWFtIGVtaXRzLlxuICpcbiAqIElmIHRoZSBzb3VyY2UsIG9yIGFueSBpbnB1dCBzdHJlYW0sIHRocm93cyBhbiBlcnJvciwgdGhlIHJlc3VsdCBzdHJlYW1cbiAqIHdpbGwgcHJvcGFnYXRlIHRoZSBlcnJvci4gSWYgYW55IGlucHV0IHN0cmVhbXMgZW5kLCB0aGVpciBmaW5hbCBlbWl0dGVkXG4gKiB2YWx1ZSB3aWxsIHJlbWFpbiBpbiB0aGUgYXJyYXkgb2YgYW55IHN1YnNlcXVlbnQgZXZlbnRzIGZyb20gdGhlIHJlc3VsdFxuICogc3RyZWFtLlxuICpcbiAqIFRoZSByZXN1bHQgc3RyZWFtIHdpbGwgb25seSBjb21wbGV0ZSB1cG9uIGNvbXBsZXRpb24gb2YgdGhlIHNvdXJjZSBzdHJlYW0uXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS0gKHNvdXJjZSlcbiAqIC0tLS1hLS0tLS1iLS0tLS1jLS1kLS0tLS0tIChvdGhlcilcbiAqICAgICAgc2FtcGxlQ29tYmluZVxuICogLS0tLS0tLTJhLS0tLTNiLS0tLS0tLTRkLS1cbiAqIGBgYFxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgc2FtcGxlQ29tYmluZSBmcm9tICd4c3RyZWFtL2V4dHJhL3NhbXBsZUNvbWJpbmUnXG4gKiBpbXBvcnQgeHMgZnJvbSAneHN0cmVhbSdcbiAqXG4gKiBjb25zdCBzYW1wbGVyID0geHMucGVyaW9kaWMoMTAwMCkudGFrZSgzKVxuICogY29uc3Qgb3RoZXIgPSB4cy5wZXJpb2RpYygxMDApXG4gKlxuICogY29uc3Qgc3RyZWFtID0gc2FtcGxlci5jb21wb3NlKHNhbXBsZUNvbWJpbmUob3RoZXIpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiBbMCwgOF1cbiAqID4gWzEsIDE4XVxuICogPiBbMiwgMjhdXG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IHNhbXBsZUNvbWJpbmUgZnJvbSAneHN0cmVhbS9leHRyYS9zYW1wbGVDb21iaW5lJ1xuICogaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nXG4gKlxuICogY29uc3Qgc2FtcGxlciA9IHhzLnBlcmlvZGljKDEwMDApLnRha2UoMylcbiAqIGNvbnN0IG90aGVyID0geHMucGVyaW9kaWMoMTAwKS50YWtlKDIpXG4gKlxuICogY29uc3Qgc3RyZWFtID0gc2FtcGxlci5jb21wb3NlKHNhbXBsZUNvbWJpbmUob3RoZXIpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiBbMCwgMV1cbiAqID4gWzEsIDFdXG4gKiA+IFsyLCAxXVxuICogYGBgXG4gKlxuICogQHBhcmFtIHsuLi5TdHJlYW19IHN0cmVhbXMgT25lIG9yIG1vcmUgc3RyZWFtcyB0byBjb21iaW5lIHdpdGggdGhlIHNhbXBsZXJcbiAqIHN0cmVhbS5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuc2FtcGxlQ29tYmluZSA9IGZ1bmN0aW9uIHNhbXBsZUNvbWJpbmUoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gIHJldHVybiBmdW5jdGlvbiBzYW1wbGVDb21iaW5lT3BlcmF0b3Ioc2FtcGxlcjogU3RyZWFtPGFueT4pOiBTdHJlYW08QXJyYXk8YW55Pj4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPEFycmF5PGFueT4+KG5ldyBTYW1wbGVDb21iaW5lT3BlcmF0b3Ioc2FtcGxlciwgc3RyZWFtcykpO1xuICB9O1xufSBhcyBTYW1wbGVDb21iaW5lU2lnbmF0dXJlO1xuXG5leHBvcnQgZGVmYXVsdCBzYW1wbGVDb21iaW5lOyIsImltcG9ydCB4cyBmcm9tICd4c3RyZWFtJztcbmltcG9ydCBkcm9wUmVwZWF0cyBmcm9tICd4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzJztcbmltcG9ydCB7U3RyZWFtfSBmcm9tICd4c3RyZWFtJztcbmltcG9ydCBpc29sYXRlIGZyb20gJ0BjeWNsZS9pc29sYXRlJztcbmltcG9ydCB7U3RhdGVTb3VyY2UsIFJlZHVjZXJ9IGZyb20gJ0BjeWNsZS9zdGF0ZSc7XG5pbXBvcnQge1xuICBHb2FsLCBHb2FsSUQsIFJlc3VsdCwgU3RhdHVzLCBpbml0R29hbCwgaXNFcXVhbEdvYWwsIGlzRXF1YWxSZXN1bHQsXG59IGZyb20gJ0BjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvbic7XG5pbXBvcnQge1xuICBPbWl0LCBGU01SZWR1Y2VyU3RhdGUsXG4gIFFBV2l0aFNjcmVlbkFjdGlvblNvdXJjZXMsIFFBV2l0aFNjcmVlbkFjdGlvblNpbmtzLCBRQVdpdGhTY3JlZW5BY3Rpb24sXG4gIFNwZWFrV2l0aFNjcmVlbkFjdGlvblxufSBmcm9tICdAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb25iYW5rJztcblxuLy8gRlNNIHR5cGVzXG5lbnVtIFMge1xuICBQRU5EID0gJ1BFTkQnLFxuICBNT05PTE9HVUUgPSAnTU9OT0xPR1VFJyxcbiAgUVVFU1RJT05fQU5TV0VSID0gJ1FVRVNUSU9OX0FOU1dFUicsXG4gIElOU1RSVUNUSU9OID0gJ0lOU1RSVUNUSU9OJyxcbn1cblxuZW51bSBTSUdUeXBlIHtcbiAgR09BTCA9ICdHT0FMJyxcbiAgQ0FOQ0VMID0gJ0NBTkNFTCcsXG4gIE1PTk9fRE9ORSA9ICdNT05PX0RPTkUnLFxuICBRQV9TVUNDRUVERUQgPSAnUUFfU1VDQ0VFREVEJyxcbiAgUUFfRkFJTEVEID0gJ1FBX0ZBSUxFRCcsXG4gIElOU1RfU1VDQ0VFREVEID0gJ0lOU1RfU1VDQ0VFREVEJyxcbiAgSU5TVF9GQUlMRUQgPSAnSU5TVF9GQUlMRUQnLFxufVxuXG5leHBvcnQgdHlwZSBTSUcgPSB7XG4gIHR5cGU6IFNJR1R5cGUsXG4gIHZhbHVlPzogYW55LFxufVxuXG5leHBvcnQgdHlwZSBWID0ge1xuICBnb2FsX2lkOiBHb2FsSUQsXG4gIGZsb3djaGFydDogYW55LFxuICBub2RlOiBhbnksXG59XG5cbmV4cG9ydCB0eXBlIExBTSA9IHtcbiAgcmVzdWx0PzogUmVzdWx0LFxuICBNb25vbG9ndWVBY3Rpb24/OiB7Z29hbDogR29hbH0sXG4gIFF1ZXN0aW9uQW5zd2VyQWN0aW9uPzoge2dvYWw6IEdvYWx9LFxuICBJbnN0cnVjdGlvbkFjdGlvbj86IHtnb2FsOiBHb2FsfSxcbn1cblxuLy8gUmVkdWNlciB0eXBlc1xuZXhwb3J0IGludGVyZmFjZSBTdGF0ZSBleHRlbmRzIEZTTVJlZHVjZXJTdGF0ZTxTLCBWLCBMQU0+IHtcbiAgUXVlc3Rpb25BbnN3ZXJBY3Rpb24/OiBhbnksXG59XG5cbi8vIENvbXBvbmVudCB0eXBlc1xuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VzIGV4dGVuZHMgT21pdDxRQVdpdGhTY3JlZW5BY3Rpb25Tb3VyY2VzLCAnc3RhdGUnPiB7XG4gIHN0YXRlOiBTdGF0ZVNvdXJjZTxTdGF0ZT4sXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lua3MgZXh0ZW5kcyBPbWl0PFFBV2l0aFNjcmVlbkFjdGlvblNpbmtzLCAnc3RhdGUnPntcbiAgc3RhdGU6IFN0cmVhbTxSZWR1Y2VyPFN0YXRlPj47XG59XG5cbmZ1bmN0aW9uIGlucHV0KFxuICBnb2FsJDogU3RyZWFtPGFueT4sXG4gIG1vbm9sb2d1ZVJlc3VsdCQ6IFN0cmVhbTxSZXN1bHQ+LFxuICBxdWVzdGlvbkFuc3dlclJlc3VsdCQ6IFN0cmVhbTxSZXN1bHQ+LFxuICBpbnN0cnVjdGlvblJlc3VsdCQ6IFN0cmVhbTxSZXN1bHQ+LFxuKTogU3RyZWFtPFNJRz4ge1xuICByZXR1cm4geHMubWVyZ2UoXG4gICAgZ29hbCQuZmlsdGVyKGcgPT4gdHlwZW9mIGcgIT09ICd1bmRlZmluZWQnKS5tYXAoZyA9PiAoZyA9PT0gbnVsbClcbiAgICAgID8gKHt0eXBlOiBTSUdUeXBlLkNBTkNFTCwgdmFsdWU6IG51bGx9KVxuICAgICAgOiAoe3R5cGU6IFNJR1R5cGUuR09BTCwgdmFsdWU6IGluaXRHb2FsKGcpfSkpLFxuICAgIG1vbm9sb2d1ZVJlc3VsdCRcbiAgICAgIC5maWx0ZXIociA9PiByLnN0YXR1cy5zdGF0dXMgPT09IFN0YXR1cy5TVUNDRUVERUQpXG4gICAgICAubWFwVG8oe3R5cGU6IFNJR1R5cGUuTU9OT19ET05FfSkuZGVidWcoKSxcbiAgICBxdWVzdGlvbkFuc3dlclJlc3VsdCRcbiAgICAgIC5maWx0ZXIociA9PiByLnN0YXR1cy5zdGF0dXMgPT09IFN0YXR1cy5TVUNDRUVERUQpXG4gICAgICAubWFwKHIgPT4gKHt0eXBlOiBTSUdUeXBlLlFBX1NVQ0NFRURFRCwgdmFsdWU6IHIucmVzdWx0fSkpLFxuICAgIHF1ZXN0aW9uQW5zd2VyUmVzdWx0JFxuICAgICAgLmZpbHRlcihyID0+IHIuc3RhdHVzLnN0YXR1cyAhPT0gU3RhdHVzLlNVQ0NFRURFRClcbiAgICAgIC5tYXAociA9PiAoe3R5cGU6IFNJR1R5cGUuUUFfRkFJTEVELCB2YWx1ZTogci5yZXN1bHR9KSksXG4gICAgaW5zdHJ1Y3Rpb25SZXN1bHQkXG4gICAgICAuZmlsdGVyKHIgPT4gci5zdGF0dXMuc3RhdHVzID09PSBTdGF0dXMuU1VDQ0VFREVEKVxuICAgICAgLm1hcChyID0+ICh7dHlwZTogU0lHVHlwZS5JTlNUX1NVQ0NFRURFRCwgdmFsdWU6IHIucmVzdWx0fSkpLFxuICAgIGluc3RydWN0aW9uUmVzdWx0JFxuICAgICAgLmZpbHRlcihyID0+IHIuc3RhdHVzLnN0YXR1cyAhPT0gU3RhdHVzLlNVQ0NFRURFRClcbiAgICAgIC5tYXAociA9PiAoe3R5cGU6IFNJR1R5cGUuSU5TVF9GQUlMRUQsIHZhbHVlOiByLnJlc3VsdH0pKSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gcmVkdWNlcihpbnB1dCQ6IFN0cmVhbTxTSUc+KTogU3RyZWFtPFJlZHVjZXI8U3RhdGU+PiB7XG4gIGNvbnN0IGluaXRSZWR1Y2VyJDogU3RyZWFtPFJlZHVjZXI8U3RhdGU+PiA9IHhzLm9mKChwcmV2PzogU3RhdGUpOiBTdGF0ZSA9PiB7XG4gICAgaWYgKHR5cGVvZiBwcmV2ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGU6IFMuUEVORCxcbiAgICAgICAgdmFyaWFibGVzOiBudWxsLFxuICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHByZXY7XG4gICAgfVxuICB9KTtcblxuICBjb25zdCB0cmFuc2l0aW9uUmVkdWNlciQ6IFN0cmVhbTxSZWR1Y2VyPFN0YXRlPj4gPSBpbnB1dCQubWFwKChpbnB1dDogU0lHKSA9PiAocHJldjogU3RhdGUpOiBTdGF0ZSA9PiB7XG4gICAgY29uc29sZS5kZWJ1ZygnaW5wdXQnLCBpbnB1dCwgJ3ByZXYnLCBwcmV2KTtcbiAgICBpZiAocHJldi5zdGF0ZSA9PT0gUy5QRU5EICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuR09BTCkgeyAgLy8gZ29hbC1yZWNlaXZlZFxuICAgICAgY29uc3QgZmxvd2NoYXJ0ID0gT2JqZWN0LmFzc2lnbihcbiAgICAgICAge30sXG4gICAgICAgIC4uLkFycmF5LmZyb20oXG4gICAgICAgICAgaW5wdXQudmFsdWUuZ29hbC5mbG93Y2hhcnQsICh7aWQsIC4uLm99KSA9PiAoe1tpZF06IHtpZCwgLi4ub319KVxuICAgICAgICApLFxuICAgICAgKTtcbiAgICAgIGNvbnN0IG5vZGUgPSBmbG93Y2hhcnRbaW5wdXQudmFsdWUuZ29hbC5zdGFydF9pZF07XG4gICAgICBpZiAobm9kZSAmJiBub2RlLnR5cGUgPT09ICdNT05PTE9HVUUnKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICBzdGF0ZTogUy5NT05PTE9HVUUsXG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBnb2FsX2lkOiBpbnB1dC52YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgZmxvd2NoYXJ0LFxuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgIE1vbm9sb2d1ZUFjdGlvbjoge1xuICAgICAgICAgICAgICBnb2FsOiBpbml0R29hbChub2RlLmFyZyksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHByZXYuc3RhdGUgPT09IFMuTU9OT0xPR1VFICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuTU9OT19ET05FXG4gICAgICB8fCBwcmV2LnN0YXRlID09PSBTLklOU1RSVUNUSU9OICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuSU5TVF9TVUNDRUVERURcbiAgICApIHtcbiAgICAgIGNvbnN0IG5vZGUgPSBwcmV2LnZhcmlhYmxlcy5mbG93Y2hhcnRbcHJldi52YXJpYWJsZXMubm9kZS5uZXh0XTtcbiAgICAgIGlmIChub2RlLnR5cGUgPT09ICdNT05PTE9HVUUnKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICBzdGF0ZTogUy5NT05PTE9HVUUsXG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAuLi5wcmV2LnZhcmlhYmxlcyxcbiAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICBNb25vbG9ndWVBY3Rpb246IHtcbiAgICAgICAgICAgICAgZ29hbDogaW5pdEdvYWwobm9kZS5hcmcpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09ICdJTlNUUlVDVElPTicpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5wcmV2LFxuICAgICAgICAgIHN0YXRlOiBTLklOU1RSVUNUSU9OLFxuICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgLi4ucHJldi52YXJpYWJsZXMsXG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgUXVlc3Rpb25BbnN3ZXJBY3Rpb246IHtcbiAgICAgICAgICAgICAgZ29hbDogaW5pdEdvYWwoe1xuICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBub2RlLmFyZyxcbiAgICAgICAgICAgICAgICBhbnN3ZXJzOiBbJ0RvbmUnXSxcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcmV2O1xuICB9KTtcblxuICByZXR1cm4geHMubWVyZ2UoaW5pdFJlZHVjZXIkLCB0cmFuc2l0aW9uUmVkdWNlciQpO1xufVxuXG5mdW5jdGlvbiBvdXRwdXQocmVkdWNlclN0YXRlJDogU3RyZWFtPFN0YXRlPikge1xuICBjb25zdCBvdXRwdXRzJCA9IHJlZHVjZXJTdGF0ZSRcbiAgICAuZmlsdGVyKG0gPT4gISFtLm91dHB1dHMpXG4gICAgLm1hcChtID0+IG0ub3V0cHV0cyk7XG4gIHJldHVybiB7XG4gICAgcmVzdWx0OiBvdXRwdXRzJFxuICAgICAgLmZpbHRlcihvID0+ICEhby5yZXN1bHQpXG4gICAgICAubWFwKG8gPT4gby5yZXN1bHQpXG4gICAgICAuY29tcG9zZShkcm9wUmVwZWF0cyhpc0VxdWFsUmVzdWx0KSksXG4gICAgTW9ub2xvZ3VlQWN0aW9uOiBvdXRwdXRzJFxuICAgICAgLmZpbHRlcihvID0+ICEhby5Nb25vbG9ndWVBY3Rpb24pXG4gICAgICAubWFwKG8gPT4gby5Nb25vbG9ndWVBY3Rpb24uZ29hbClcbiAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzKGlzRXF1YWxHb2FsKSksXG4gICAgUXVlc3Rpb25BbnN3ZXJBY3Rpb246IG91dHB1dHMkXG4gICAgICAuZmlsdGVyKG8gPT4gISFvLlF1ZXN0aW9uQW5zd2VyQWN0aW9uKVxuICAgICAgLm1hcChvID0+IG8uUXVlc3Rpb25BbnN3ZXJBY3Rpb24uZ29hbClcbiAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzKGlzRXF1YWxHb2FsKSksXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBGbG93Y2hhcnRBY3Rpb24oc291cmNlczogU291cmNlcyk6IFNpbmtzIHtcbiAgc291cmNlcy5zdGF0ZS5zdHJlYW0uYWRkTGlzdGVuZXIoe25leHQ6IHYgPT4gY29uc29sZS5sb2coJ3N0YXRlJCcsIHYpfSlcblxuICBjb25zdCBnb2FsUHJveHkkID0geHMuY3JlYXRlKCk7XG4gIGNvbnN0IGdvYWxQcm94eTIkID0geHMuY3JlYXRlKCk7XG4gIGNvbnN0IHFhU2lua3MgPSBpc29sYXRlKFFBV2l0aFNjcmVlbkFjdGlvbiwgJ1F1ZXN0aW9uQW5zd2VyQWN0aW9uJykoe1xuICAgIC4uLnNvdXJjZXMsXG4gICAgZ29hbDogZ29hbFByb3h5JCxcbiAgfSk7XG4gIGNvbnN0IG1vbm9TaW5rcyA9IGlzb2xhdGUoU3BlYWtXaXRoU2NyZWVuQWN0aW9uLCAnU3BlYWtXaXRoU2NyZWVuQWN0aW9uJykoe1xuICAgIGdvYWw6IGdvYWxQcm94eTIkLFxuICAgIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb246IHNvdXJjZXMuVHdvU3BlZWNoYnViYmxlc0FjdGlvbixcbiAgICBTcGVlY2hTeW50aGVzaXNBY3Rpb246IHNvdXJjZXMuU3BlZWNoU3ludGhlc2lzQWN0aW9uLFxuICAgIHN0YXRlOiBzb3VyY2VzLnN0YXRlLFxuICB9KTtcblxuICBjb25zdCBpbnB1dCQgPSBpbnB1dChcbiAgICBzb3VyY2VzLmdvYWwsXG4gICAgc291cmNlcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24ucmVzdWx0LFxuICAgIHFhU2lua3MucmVzdWx0LFxuICAgIHFhU2lua3MucmVzdWx0LCAgLy8gZm9yIG5vdyxcbiAgKTtcbiAgY29uc3QgcGFyZW50UmVkdWNlciQgPSByZWR1Y2VyKGlucHV0JCk7XG4gIGNvbnN0IHJlZHVjZXIkID0geHMubWVyZ2UoXG4gICAgcGFyZW50UmVkdWNlciQsXG4gICAgcWFTaW5rcy5zdGF0ZSBhcyBTdHJlYW08UmVkdWNlcjxTdGF0ZT4+LFxuICAgIG1vbm9TaW5rcy5zdGF0ZSBhcyBTdHJlYW08UmVkdWNlcjxTdGF0ZT4+LFxuICApO1xuICBjb25zdCByZWR1Y2VyU3RhdGUkID0gc291cmNlcy5zdGF0ZS5zdHJlYW07XG4gIGNvbnN0IG91dHB1dHMgPSBvdXRwdXQocmVkdWNlclN0YXRlJCk7XG4gIGdvYWxQcm94eSQuaW1pdGF0ZShvdXRwdXRzLlF1ZXN0aW9uQW5zd2VyQWN0aW9uLmNvbXBvc2UoZHJvcFJlcGVhdHMoaXNFcXVhbEdvYWwpKSk7XG4gIGdvYWxQcm94eTIkLmltaXRhdGUob3V0cHV0cy5Nb25vbG9ndWVBY3Rpb24uY29tcG9zZShkcm9wUmVwZWF0cyhpc0VxdWFsR29hbCkpKTtcblxuICBjb25zdCBzcGVlY2hidWJibGVzJCA9IHhzLm1lcmdlKFxuICAgIHFhU2lua3MuVHdvU3BlZWNoYnViYmxlc0FjdGlvbixcbiAgICBtb25vU2lua3MuVHdvU3BlZWNoYnViYmxlc0FjdGlvbixcbiAgKTtcbiAgY29uc3Qgc3BlYWskID0geHMubWVyZ2UoXG4gICAgcWFTaW5rcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gICAgbW9ub1NpbmtzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbixcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICByZXN1bHQ6IG91dHB1dHMucmVzdWx0LFxuICAgIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb246IHNwZWVjaGJ1YmJsZXMkLFxuICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogc3BlYWskLFxuICAgIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiBxYVNpbmtzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLFxuICAgIHN0YXRlOiByZWR1Y2VyJCxcbiAgfTtcbn1cbiIsImltcG9ydCB4cyBmcm9tICd4c3RyZWFtJztcbmltcG9ydCB7U3RyZWFtfSBmcm9tICd4c3RyZWFtJztcbmltcG9ydCB7ZGl2LCBET01Tb3VyY2UsIFZOb2RlfSBmcm9tICdAY3ljbGUvZG9tJztcbmltcG9ydCBpc29sYXRlIGZyb20gJ0BjeWNsZS9pc29sYXRlJztcbmltcG9ydCB7U3RhdGVTb3VyY2UsIFJlZHVjZXJ9IGZyb20gJ0BjeWNsZS9zdGF0ZSc7XG5pbXBvcnQge1Jlc3VsdCwgRXZlbnRTb3VyY2UsIGlzRXF1YWwsIFN0YXR1c30gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uJztcbmltcG9ydCB7XG4gIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24sXG59IGZyb20gJ0BjeWNsZS1yb2JvdC1kcml2ZXJzL3NjcmVlbic7XG5pbXBvcnQge1xuICBTcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uLFxufSBmcm9tICdAY3ljbGUtcm9ib3QtZHJpdmVycy9zcGVlY2gnO1xuaW1wb3J0IHtzZWxlY3RBY3Rpb25SZXN1bHR9IGZyb20gJ0BjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvbmJhbmsnO1xuaW1wb3J0IHtcbiAgVHdvU3BlZWNoYnV0dG9uc0FjdGlvblNpbmtzIGFzIFRXQVNpbmtzLFxuICBTcGVlY2hTeW50aGVzaXNBY3Rpb25TaW5rcyBhcyBTU1NpbmtzLFxuICBTcGVlY2hSZWNvZ250aW9uQWN0aW9uU2lua3MgYXMgU1JTaW5rcyxcbn0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge0Zsb3djaGFydEFjdGlvbn0gZnJvbSAnLi9GbG93Y2hhcnRBY3Rpb24nO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0YXRlIHtcbiAgRmFjaWFsRXhwcmVzc2lvbkFjdGlvbjoge3Jlc3VsdDogUmVzdWx0fSxcbiAgVHdvU3BlZWNoYnViYmxlc0FjdGlvbjoge3Jlc3VsdDogUmVzdWx0fSxcbiAgU3BlZWNoU3ludGhlc2lzQWN0aW9uOiB7cmVzdWx0OiBSZXN1bHR9LFxuICBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjoge3Jlc3VsdDogUmVzdWx0fSxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VzIHtcbiAgRE9NOiBET01Tb3VyY2UsXG4gIFRhYmxldEZhY2U6IGFueSxcbiAgU3BlZWNoU3ludGhlc2lzOiBFdmVudFNvdXJjZSxcbiAgU3BlZWNoUmVjb2duaXRpb246IEV2ZW50U291cmNlLFxuICBzdGF0ZTogU3RhdGVTb3VyY2U8U3RhdGU+LFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpbmtzIHtcbiAgRE9NOiBTdHJlYW08Vk5vZGU+LFxuICBTcGVlY2hTeW50aGVzaXM6IGFueSxcbiAgU3BlZWNoUmVjb2duaXRpb246IGFueSxcbiAgc3RhdGU6IFN0cmVhbTxSZWR1Y2VyPFN0YXRlPj4sXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFJvYm90QXBwKHNvdXJjZXM6IFNvdXJjZXMpOiBTaW5rcyB7XG4gIC8vIHNvdXJjZXMuc3RhdGUuc3RyZWFtLmFkZExpc3RlbmVyKHtuZXh0OiB2ID0+IGNvbnNvbGUubG9nKCdzdGF0ZSQnLCB2KX0pXG5cbiAgLy8gUHJvY2VzcyBzdGF0ZSBzdHJlYW1cbiAgY29uc3Qgc3RhdGUkID0gc291cmNlcy5zdGF0ZS5zdHJlYW07XG4gIGNvbnN0IHR3b1NwZWVjaGJ1YmJsZXNSZXN1bHQkID0gc3RhdGUkXG4gICAgLmNvbXBvc2Uoc2VsZWN0QWN0aW9uUmVzdWx0KCdUd29TcGVlY2hidWJibGVzQWN0aW9uJykpO1xuICBjb25zdCBzcGVlY2hTeW50aGVzaXNSZXN1bHQkID0gc3RhdGUkXG4gICAgLmNvbXBvc2Uoc2VsZWN0QWN0aW9uUmVzdWx0KCdTcGVlY2hTeW50aGVzaXNBY3Rpb24nKSk7XG4gIGNvbnN0IHNwZWVjaFJlY29nbml0aW9uUmVzdWx0JCA9IHN0YXRlJFxuICAgIC5jb21wb3NlKHNlbGVjdEFjdGlvblJlc3VsdCgnU3BlZWNoUmVjb2duaXRpb25BY3Rpb24nKSk7XG5cblxuICAvLyBcIm1haW5cIiBjb21wb25lbnRcbiAgY29uc3QgZmxvd2NoYXJ0TWV0YWRhdGEgPSBbXG4gICAge1xuICAgICAgbmFtZTogJ0Jyb2Njb2xpIGNoZWVzZSBzb3VwJyxcbiAgICAgIHBhdGg6ICcvZmxvd2NoYXJ0cy9jcm9ja3BvdC1idWZmYWxvLWNoaWNrZW4uanNvbicsXG4gICAgfSxcbiAgXTtcblxuICAvLyBmZXRjaCBmbG93Y2hhcnQgZGF0YVxuICBjb25zdCBkYXRhJCA9IHhzLmNvbWJpbmUuYXBwbHkoXG4gICAgbnVsbCxcbiAgICBmbG93Y2hhcnRNZXRhZGF0YS5tYXAoZCA9PiB4cy5mcm9tUHJvbWlzZShmZXRjaChkLnBhdGgsIHtcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgXCJjb250ZW50LXR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCJcbiAgICAgIH1cbiAgICB9KSkubWFwKHYgPT4geHMuZnJvbVByb21pc2Uodi5qc29uKCkpLm1hcChqID0+ICh7XG4gICAgICAuLi5kLFxuICAgICAgLi4uaixcbiAgICB9KSkpLmZsYXR0ZW4oKSksXG4gICk7XG4gIGNvbnN0IGdvYWxJZCA9IHtzdGFtcDogbmV3IERhdGUoKSwgaWQ6ICcjbWFpbi1zY3JlZW4nfTtcbiAgY29uc3QgZ29hbCQgPSB4cy5jb21iaW5lKGRhdGEkLCB0d29TcGVlY2hidWJibGVzUmVzdWx0JClcbiAgICAuZmlsdGVyKChbZGF0YSwgcl06IFthbnlbXSwgUmVzdWx0XSkgPT4gIC8vIGZpbHRlciBub3QgI21haW4tc2NyZWVuIHJlc3VsdHNcbiAgICAgIGlzRXF1YWwoci5zdGF0dXMuZ29hbF9pZCwgZ29hbElkKVxuICAgICAgJiYgci5zdGF0dXMuc3RhdHVzICE9PSBTdGF0dXMuUFJFRU1QVEVEXG4gICAgICAmJiBkYXRhLmZpbHRlcihkID0+IGQubmFtZSA9PT0gci5yZXN1bHQpLmxlbmd0aCA+IDApXG4gICAgLm1hcCgoW2RhdGEsIHJdOiBbYW55W10sIFJlc3VsdF0pID0+ICh7ICAvLyBjb252ZXJ0IGRhdGEgdG8gYSBnb2FsXG4gICAgICBmbG93Y2hhcnQ6IGRhdGEuZmlsdGVyKGQgPT4gZC5uYW1lID09PSByLnJlc3VsdClbMF0uZmxvd2NoYXJ0LFxuICAgICAgc3RhcnRfaWQ6IGRhdGEuZmlsdGVyKGQgPT4gZC5uYW1lID09PSByLnJlc3VsdClbMF0uc3RhcnRfaWQsXG4gICAgfSkpO1xuICBjb25zdCBjaGlsZFNpbmtzOiBhbnkgPSBpc29sYXRlKEZsb3djaGFydEFjdGlvbikoe1xuICAgIGdvYWw6IGdvYWwkLFxuICAgIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb246IHtyZXN1bHQ6IHR3b1NwZWVjaGJ1YmJsZXNSZXN1bHQkfSxcbiAgICBTcGVlY2hTeW50aGVzaXNBY3Rpb246IHtyZXN1bHQ6IHNwZWVjaFN5bnRoZXNpc1Jlc3VsdCR9LFxuICAgIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiB7cmVzdWx0OiBzcGVlY2hSZWNvZ25pdGlvblJlc3VsdCR9LFxuICAgIHN0YXRlOiBzb3VyY2VzLnN0YXRlLFxuICB9KTtcblxuICAvLyBjcmVhdGUgdGhlIG1haW4gbWVudSBzY3JlZW5cbiAgY29uc3QgbWFpblNjcmVlbiQgPSBkYXRhJC5tYXAoZGF0YSA9PiAoe1xuICAgIGdvYWxfaWQ6IGdvYWxJZCxcbiAgICBnb2FsOiB7XG4gICAgICBtZXNzYWdlOiAnSSBjYW4gaGVscCB5b3UgYW5zd2VyIHNvbWUgcXVlc3Rpb25zJyxcbiAgICAgIGNob2ljZXM6IGRhdGEubWFwKGQgPT4gZC5uYW1lKSxcbiAgICB9XG4gIH0pKTtcbiAgY29uc3QgdHdvU3BlZWNoYnViYmxlc0dvYWwkID0geHMubWVyZ2UoXG4gICAgeHMuY29tYmluZShtYWluU2NyZWVuJCwgY2hpbGRTaW5rcy5yZXN1bHQuc3RhcnRXaXRoKG51bGwpKS5tYXAoeCA9PiB4WzBdKSxcbiAgICBjaGlsZFNpbmtzLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24sXG4gICkgfHwgeHMubmV2ZXIoKTtcblxuXG4gIC8vIERlZmluZSBBY3Rpb25zXG4gIGNvbnN0IHR3b1NwZWVjaGJ1YmJsZXNBY3Rpb246IFRXQVNpbmtzID0gVHdvU3BlZWNoYnViYmxlc0FjdGlvbih7XG4gICAgZ29hbDogdHdvU3BlZWNoYnViYmxlc0dvYWwkLFxuICAgIERPTTogc291cmNlcy5ET00sXG4gIH0pO1xuICBjb25zdCBzcGVlY2hTeW50aGVzaXNBY3Rpb246IFNTU2lua3MgPSBTcGVlY2hTeW50aGVzaXNBY3Rpb24oe1xuICAgIGdvYWw6IGNoaWxkU2lua3MuU3BlZWNoU3ludGhlc2lzQWN0aW9uIHx8IHhzLm5ldmVyKCksXG4gICAgU3BlZWNoU3ludGhlc2lzOiBzb3VyY2VzLlNwZWVjaFN5bnRoZXNpcyxcbiAgfSk7XG4gIGNvbnN0IHNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiBTUlNpbmtzID0gU3BlZWNoUmVjb2duaXRpb25BY3Rpb24oe1xuICAgIGdvYWw6IGNoaWxkU2lua3MuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24gfHwgeHMubmV2ZXIoKSxcbiAgICBTcGVlY2hSZWNvZ25pdGlvbjogc291cmNlcy5TcGVlY2hSZWNvZ25pdGlvbixcbiAgfSk7XG5cblxuICAvLyBEZWZpbmUgUmVkdWNlcnNcbiAgY29uc3QgcGFyZW50UmVkdWNlciQ6IFN0cmVhbTxSZWR1Y2VyPFN0YXRlPj4gPSB4cy5tZXJnZShcbiAgICB0d29TcGVlY2hidWJibGVzQWN0aW9uLnJlc3VsdC5tYXAocmVzdWx0ID0+XG4gICAgICBwcmV2ID0+ICh7Li4ucHJldiwgVHdvU3BlZWNoYnViYmxlc0FjdGlvbjoge291dHB1dHM6IHtyZXN1bHR9fX0pKSxcbiAgICBzcGVlY2hTeW50aGVzaXNBY3Rpb24ucmVzdWx0Lm1hcChyZXN1bHQgPT5cbiAgICAgIHByZXYgPT4gKHsuLi5wcmV2LCBTcGVlY2hTeW50aGVzaXNBY3Rpb246IHtvdXRwdXRzOiB7cmVzdWx0fX19KSksXG4gICAgc3BlZWNoUmVjb2duaXRpb25BY3Rpb24ucmVzdWx0Lm1hcChyZXN1bHQgPT5cbiAgICAgIHByZXYgPT4gKHsuLi5wcmV2LCBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjoge291dHB1dHM6IHtyZXN1bHR9fX0pKSxcbiAgKTtcbiAgY29uc3QgY2hpbGRSZWR1Y2VyJDogU3RyZWFtPFJlZHVjZXI8U3RhdGU+PiA9IGNoaWxkU2lua3Muc3RhdGU7XG4gIGNvbnN0IHJlZHVjZXIkID0geHMubWVyZ2UocGFyZW50UmVkdWNlciQsIGNoaWxkUmVkdWNlciQpO1xuXG5cbiAgLy8gRGVmaW5lIFNpbmtzXG4gIGNvbnN0IHZkb20kID0geHMuY29tYmluZShcbiAgICB0d29TcGVlY2hidWJibGVzQWN0aW9uLkRPTSxcbiAgICBzb3VyY2VzLlRhYmxldEZhY2UuRE9NLFxuICApLm1hcCgoW3NwZWVjaGJ1YmJsZXMsIGZhY2VdKSA9PlxuICAgIGRpdih7XG4gICAgICBzdHlsZToge3Bvc2l0aW9uOiAncmVsYXRpdmUnfVxuICAgIH0sIFtzcGVlY2hidWJibGVzLCBmYWNlXSlcbiAgKTtcblxuICByZXR1cm4ge1xuICAgIERPTTogdmRvbSQsXG4gICAgU3BlZWNoU3ludGhlc2lzOiBzcGVlY2hTeW50aGVzaXNBY3Rpb24ub3V0cHV0LFxuICAgIFNwZWVjaFJlY29nbml0aW9uOiBzcGVlY2hSZWNvZ25pdGlvbkFjdGlvbi5vdXRwdXQsXG4gICAgc3RhdGU6IHJlZHVjZXIkLFxuICB9O1xufVxuIiwiaW1wb3J0IHttYWtlRE9NRHJpdmVyfSBmcm9tICdAY3ljbGUvZG9tJztcbmltcG9ydCB7d2l0aFN0YXRlfSBmcm9tICdAY3ljbGUvc3RhdGUnO1xuaW1wb3J0IHtydW59IGZyb20gJ0BjeWNsZS9ydW4nO1xuaW1wb3J0IHttYWtlVGFibGV0RmFjZURyaXZlcn0gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvc2NyZWVuJztcbmltcG9ydCB7XG4gIG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIsXG4gIG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcixcbn0gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvc3BlZWNoJztcbmltcG9ydCBSb2JvdEFwcCBmcm9tICcuL1JvYm90QXBwJztcblxuY29uc3QgbWFpbiA9IHdpdGhTdGF0ZShSb2JvdEFwcCk7XG5cbnJ1bihtYWluLCB7XG4gIERPTTogbWFrZURPTURyaXZlcignI2FwcCcpLFxuICBUYWJsZXRGYWNlOiBtYWtlVGFibGV0RmFjZURyaXZlcigpLFxuICBTcGVlY2hTeW50aGVzaXM6IG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIoKSxcbiAgU3BlZWNoUmVjb2duaXRpb246IG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcigpLFxufSk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGRyb3BSZXBlYXRzXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHNcIikpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgYWN0aW9uXzEgPSByZXF1aXJlKFwiQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uXCIpO1xuO1xuLyoqXG4gKiBGYWNpYWxFeHByZXNzaW9uIGFjdGlvbiBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHNvdXJjZXNcbiAqXG4gKiAgICogZ29hbDogYSBzdHJlYW0gb2YgYG51bGxgIChhcyBcImNhbmNlbFwiKSBvciBhIHN0cmluZyAnYGhhcHB5J2AsICdgc2FkJ2AsXG4gKiAgICAgJ2BhbmdyeSdgLCAnYGZvY3VzZWQnYCwgb3IgJ2Bjb25mdXNlZCdgIChhcyB0aGUgVGFibGV0RmFjZSBkcml2ZXInc1xuICogICAgIGBFWFBSRVNTYCB0eXBlIGNvbW1hbmQgdmFsdWUpLlxuICogICAqIERPTTogQ3ljbGUuanMgW0RPTVNvdXJjZV0oaHR0cHM6Ly9jeWNsZS5qcy5vcmcvYXBpL2RvbS5odG1sKS5cbiAqXG4gKiBAcmV0dXJuIHNpbmtzXG4gKlxuICogICAqIG91dHB1dDogYSBzdHJlYW0gZm9yIHRoZSBUYWJsZXRGYWNlIGRyaXZlci5cbiAqICAgKiBzdGF0dXM6IGRlcHJlY2lhdGVkLlxuICogICAqIHJlc3VsdDogYSBzdHJlYW0gb2YgYWN0aW9uIHJlc3VsdHMuIGByZXN1bHQucmVzdWx0YCBpcyBhbHdheXMgYG51bGxgLlxuICpcbiAqL1xuZnVuY3Rpb24gRmFjaWFsRXhwcmVzc2lvbkFjdGlvbihzb3VyY2VzKSB7XG4gICAgdmFyIGdvYWwkID0geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5nb2FsKS5maWx0ZXIoZnVuY3Rpb24gKGdvYWwpIHsgcmV0dXJuIHR5cGVvZiBnb2FsICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIGlmIChnb2FsID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdDQU5DRUwnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9ICEhZ29hbC5nb2FsX2lkID8gZ29hbCA6IGFjdGlvbl8xLmluaXRHb2FsKGdvYWwpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnR09BTCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHR5cGVvZiB2YWx1ZS5nb2FsID09PSAnc3RyaW5nJyA/IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgZ29hbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdmFsdWUuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gOiB2YWx1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgYWN0aW9uJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGdvYWwkLCBzb3VyY2VzLlRhYmxldEZhY2UuYW5pbWF0aW9uRmluaXNoLm1hcFRvKHtcbiAgICAgICAgdHlwZTogJ0VORCcsXG4gICAgICAgIHZhbHVlOiBudWxsLFxuICAgIH0pKTtcbiAgICB2YXIgaW5pdGlhbFN0YXRlID0ge1xuICAgICAgICBnb2FsOiBudWxsLFxuICAgICAgICBnb2FsX2lkOiBhY3Rpb25fMS5nZW5lcmF0ZUdvYWxJRCgpLFxuICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQsXG4gICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICB9O1xuICAgIHZhciBzdGF0ZSQgPSBhY3Rpb24kLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCBhY3Rpb24pIHtcbiAgICAgICAgLy8gY29uc29sZS5kZWJ1Zygnc3RhdGUnLCBzdGF0ZSwgJ2FjdGlvbicsIGFjdGlvbik7XG4gICAgICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERURcbiAgICAgICAgICAgIHx8IHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRFxuICAgICAgICAgICAgfHwgc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuQUJPUlRFRCkge1xuICAgICAgICAgICAgaWYgKGFjdGlvbi50eXBlID09PSAnR09BTCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgZ29hbCA9IGFjdGlvbi52YWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBnb2FsLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIGdvYWw6IGdvYWwuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuQUNUSVZFLFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbi50eXBlID09PSAnQ0FOQ0VMJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ0lnbm9yZSBDQU5DRUwgaW4gRE9ORSBzdGF0ZXMnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuQUNUSVZFKSB7XG4gICAgICAgICAgICBpZiAoYWN0aW9uLnR5cGUgPT09ICdHT0FMJykge1xuICAgICAgICAgICAgICAgIHN0YXRlJC5zaGFtZWZ1bGx5U2VuZE5leHQoX19hc3NpZ24oe30sIHN0YXRlLCB7IGdvYWw6IG51bGwsIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCB9KSk7XG4gICAgICAgICAgICAgICAgdmFyIGdvYWwgPSBhY3Rpb24udmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogZ29hbC5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBnb2FsOiBnb2FsLmdvYWwsXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLkFDVElWRSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhY3Rpb24udHlwZSA9PT0gJ0VORCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIHN0YXRlLCB7IHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCwgcmVzdWx0OiBhY3Rpb24udmFsdWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhY3Rpb24udHlwZSA9PT0gJ0NBTkNFTCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIHN0YXRlLCB7IGdvYWw6IG51bGwsIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKFwiVW5oYW5kbGVkIHN0YXRlLnN0YXR1cyBcIiArIHN0YXRlLnN0YXR1cyArIFwiIGFjdGlvbi50eXBlIFwiICsgYWN0aW9uLnR5cGUpO1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSwgaW5pdGlhbFN0YXRlKTtcbiAgICB2YXIgc3RhdGVTdGF0dXNDaGFuZ2VkJCA9IHN0YXRlJFxuICAgICAgICAuY29tcG9zZShkcm9wUmVwZWF0c18xLmRlZmF1bHQoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuICh4LnN0YXR1cyA9PT0geS5zdGF0dXMgJiYgYWN0aW9uXzEuaXNFcXVhbCh4LmdvYWxfaWQsIHkuZ29hbF9pZCkpOyB9KSk7XG4gICAgdmFyIHZhbHVlJCA9IHN0YXRlU3RhdHVzQ2hhbmdlZCRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLkFDVElWRSB8fCBzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQ7XG4gICAgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLkFDVElWRSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnRVhQUkVTUycsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHN0YXRlLmdvYWwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgeyAvLyBzdGF0ZS5zdGF0dXMgPT09IFN0YXR1cy5QUkVFTVBURURcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHN0YXR1cyQgPSBzdGF0ZVN0YXR1c0NoYW5nZWQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiAoe1xuICAgICAgICBnb2FsX2lkOiBzdGF0ZS5nb2FsX2lkLFxuICAgICAgICBzdGF0dXM6IHN0YXRlLnN0YXR1cyxcbiAgICB9KTsgfSk7XG4gICAgdmFyIHJlc3VsdCQgPSBzdGF0ZVN0YXR1c0NoYW5nZWQkXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiAoc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVEXG4gICAgICAgIHx8IHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRFxuICAgICAgICB8fCBzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5BQk9SVEVEKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuICh7XG4gICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgZ29hbF9pZDogc3RhdGUuZ29hbF9pZCxcbiAgICAgICAgICAgIHN0YXR1czogc3RhdGUuc3RhdHVzLFxuICAgICAgICB9LFxuICAgICAgICByZXN1bHQ6IHN0YXRlLnJlc3VsdCxcbiAgICB9KTsgfSk7XG4gICAgLy8gSU1QT1JUQU5UISEgZW1wdHkgdGhlIHN0cmVhbXMgbWFudWFsbHk7IG90aGVyd2lzZSBpdCBlbWl0cyB0aGUgZmlyc3RcbiAgICAvLyAgIFwiU1VDQ0VFREVEXCIgcmVzdWx0XG4gICAgdmFsdWUkLmFkZExpc3RlbmVyKHsgbmV4dDogZnVuY3Rpb24gKCkgeyB9IH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIG91dHB1dDogYWRhcHRfMS5hZGFwdCh2YWx1ZSQpLFxuICAgICAgICBzdGF0dXM6IGFkYXB0XzEuYWRhcHQoc3RhdHVzJCksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChyZXN1bHQkKSxcbiAgICB9O1xufVxuZXhwb3J0cy5GYWNpYWxFeHByZXNzaW9uQWN0aW9uID0gRmFjaWFsRXhwcmVzc2lvbkFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUZhY2lhbEV4cHJlc3Npb25BY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtXCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGlzb2xhdGVfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiQGN5Y2xlL2lzb2xhdGVcIikpO1xudmFyIGRvbV8xID0gcmVxdWlyZShcIkBjeWNsZS9kb21cIik7XG52YXIgYWN0aW9uXzEgPSByZXF1aXJlKFwiQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uXCIpO1xudmFyIFN0YXRlO1xuKGZ1bmN0aW9uIChTdGF0ZSkge1xuICAgIFN0YXRlW1wiUlVOTklOR1wiXSA9IFwiUlVOTklOR1wiO1xuICAgIFN0YXRlW1wiRE9ORVwiXSA9IFwiRE9ORVwiO1xufSkoU3RhdGUgfHwgKFN0YXRlID0ge30pKTtcbnZhciBJbnB1dFR5cGU7XG4oZnVuY3Rpb24gKElucHV0VHlwZSkge1xuICAgIElucHV0VHlwZVtcIkdPQUxcIl0gPSBcIkdPQUxcIjtcbiAgICBJbnB1dFR5cGVbXCJDQU5DRUxcIl0gPSBcIkNBTkNFTFwiO1xuICAgIElucHV0VHlwZVtcIkNMSUNLXCJdID0gXCJDTElDS1wiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xudmFyIFNwZWVjaGJ1YmJsZVR5cGU7XG4oZnVuY3Rpb24gKFNwZWVjaGJ1YmJsZVR5cGUpIHtcbiAgICBTcGVlY2hidWJibGVUeXBlW1wiTUVTU0FHRVwiXSA9IFwiTUVTU0FHRVwiO1xuICAgIFNwZWVjaGJ1YmJsZVR5cGVbXCJDSE9JQ0VcIl0gPSBcIkNIT0lDRVwiO1xufSkoU3BlZWNoYnViYmxlVHlwZSA9IGV4cG9ydHMuU3BlZWNoYnViYmxlVHlwZSB8fCAoZXhwb3J0cy5TcGVlY2hidWJibGVUeXBlID0ge30pKTtcbmZ1bmN0aW9uIGlucHV0KGdvYWwkLCBjbGlja0V2ZW50JCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5maWx0ZXIoZnVuY3Rpb24gKGdvYWwpIHsgcmV0dXJuIHR5cGVvZiBnb2FsICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIGlmIChnb2FsID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5DQU5DRUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gISFnb2FsLmdvYWxfaWQgPyBnb2FsIDogYWN0aW9uXzEuaW5pdEdvYWwoZ29hbCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5HT0FMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB0eXBlb2YgdmFsdWUuZ29hbCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogeyB0eXBlOiBTcGVlY2hidWJibGVUeXBlLk1FU1NBR0UsIHZhbHVlOiB2YWx1ZS5nb2FsIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiBBcnJheS5pc0FycmF5KHZhbHVlLmdvYWwpXG4gICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IHsgdHlwZTogU3BlZWNoYnViYmxlVHlwZS5DSE9JQ0UsIHZhbHVlOiB2YWx1ZS5nb2FsIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiB2YWx1ZS5nb2FsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pLCBjbGlja0V2ZW50JC5tYXAoZnVuY3Rpb24gKGV2ZW50KSB7IHJldHVybiAoe1xuICAgICAgICB0eXBlOiBJbnB1dFR5cGUuQ0xJQ0ssXG4gICAgICAgIHZhbHVlOiBldmVudC50YXJnZXQudGV4dENvbnRlbnRcbiAgICB9KTsgfSkpO1xufVxuZnVuY3Rpb24gY3JlYXRlVHJhbnNpdGlvbigpIHtcbiAgICB2YXIgc3R5bGVzID0ge1xuICAgICAgICBtZXNzYWdlOiB7XG4gICAgICAgICAgICBmb250RmFtaWx5OiAnaGVsdmV0aWNhJyxcbiAgICAgICAgICAgIGZvbnRTaXplOiAnM2VtJyxcbiAgICAgICAgICAgIGZvbnRXZWlnaHQ6ICdsaWdodGVyJyxcbiAgICAgICAgfSxcbiAgICAgICAgYnV0dG9uOiB7XG4gICAgICAgICAgICBtYXJnaW46ICcwIDAuMjVlbSAwIDAuMjVlbScsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICBib3JkZXI6ICcwLjA1ZW0gc29saWQgYmxhY2snLFxuICAgICAgICAgICAgZm9udEZhbWlseTogJ2hlbHZldGljYScsXG4gICAgICAgICAgICBmb250U2l6ZTogJzIuNWVtJyxcbiAgICAgICAgICAgIGZvbnRXZWlnaHQ6ICdsaWdodGVyJyxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHZhciB0cmFuc2l0aW9uVGFibGUgPSAoX2EgPSB7fSxcbiAgICAgICAgX2FbU3RhdGUuRE9ORV0gPSAoX2IgPSB7fSxcbiAgICAgICAgICAgIF9iW0lucHV0VHlwZS5HT0FMXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHsgcmV0dXJuICh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBET006IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC50eXBlID09PSBTcGVlY2hidWJibGVUeXBlLk1FU1NBR0VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGRvbV8xLnNwYW4oeyBzdHlsZTogc3R5bGVzLm1lc3NhZ2UgfSwgaW5wdXRWYWx1ZS5nb2FsLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuQ0hPSUNFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gZG9tXzEuc3BhbihpbnB1dFZhbHVlLmdvYWwudmFsdWUubWFwKGZ1bmN0aW9uICh0ZXh0KSB7IHJldHVybiBkb21fMS5idXR0b24oJy5jaG9pY2UnLCB7IHN0eWxlOiBzdHlsZXMuYnV0dG9uIH0sIHRleHQpOyB9KSkgOiAnJ1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTsgfSxcbiAgICAgICAgICAgIF9iKSxcbiAgICAgICAgX2FbU3RhdGUuUlVOTklOR10gPSAoX2MgPSB7fSxcbiAgICAgICAgICAgIF9jW0lucHV0VHlwZS5HT0FMXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHsgcmV0dXJuICh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBET006IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC50eXBlID09PSBTcGVlY2hidWJibGVUeXBlLk1FU1NBR0VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGRvbV8xLnNwYW4oeyBzdHlsZTogc3R5bGVzLm1lc3NhZ2UgfSwgaW5wdXRWYWx1ZS5nb2FsLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuQ0hPSUNFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gZG9tXzEuc3BhbihpbnB1dFZhbHVlLmdvYWwudmFsdWUubWFwKGZ1bmN0aW9uICh0ZXh0KSB7IHJldHVybiBkb21fMS5idXR0b24oJy5jaG9pY2UnLCB7IHN0eWxlOiBzdHlsZXMuYnV0dG9uIH0sIHRleHQpOyB9KSkgOiAnJ1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7IH0sXG4gICAgICAgICAgICBfY1tJbnB1dFR5cGUuQ0FOQ0VMXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHsgcmV0dXJuICh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGdvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIERPTToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogJycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTsgfSxcbiAgICAgICAgICAgIF9jW0lucHV0VHlwZS5DTElDS10gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlcy5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuQ0hPSUNFXG4gICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBET006IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBpbnB1dFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9jKSxcbiAgICAgICAgX2EpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoc3RhdGUsIHZhcmlhYmxlcywgaW5wdXQpIHtcbiAgICAgICAgdmFyIHByZXYgPSB7IHN0YXRlOiBzdGF0ZSwgdmFyaWFibGVzOiB2YXJpYWJsZXMsIG91dHB1dHM6IG51bGwgfTtcbiAgICAgICAgcmV0dXJuICF0cmFuc2l0aW9uVGFibGVbc3RhdGVdXG4gICAgICAgICAgICA/IHByZXZcbiAgICAgICAgICAgIDogIXRyYW5zaXRpb25UYWJsZVtzdGF0ZV1baW5wdXQudHlwZV1cbiAgICAgICAgICAgICAgICA/IHByZXZcbiAgICAgICAgICAgICAgICA6ICh0cmFuc2l0aW9uVGFibGVbc3RhdGVdW2lucHV0LnR5cGVdKHZhcmlhYmxlcywgaW5wdXQudmFsdWUpIHx8IHByZXYpO1xuICAgIH07XG4gICAgdmFyIF9hLCBfYiwgX2M7XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gaW5pdFJlZHVjZXIobWFjaGluZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgIGdvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciB0cmFuc2l0aW9uID0gY3JlYXRlVHJhbnNpdGlvbigpO1xuICAgIHZhciBpbnB1dFJlZHVjZXIkID0gaW5wdXQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiBpbnB1dFJlZHVjZXIobWFjaGluZSkge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihtYWNoaW5lLnN0YXRlLCBtYWNoaW5lLnZhcmlhYmxlcywgaW5wdXQpO1xuICAgIH07IH0pO1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbml0UmVkdWNlciQsIGlucHV0UmVkdWNlciQpO1xufVxuZnVuY3Rpb24gb3V0cHV0KG1hY2hpbmUkKSB7XG4gICAgdmFyIG91dHB1dHMkID0gbWFjaGluZSRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobWFjaGluZSkgeyByZXR1cm4gISFtYWNoaW5lLm91dHB1dHM7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKG1hY2hpbmUpIHsgcmV0dXJuIG1hY2hpbmUub3V0cHV0czsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRE9NOiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiAhIW91dHB1dHMuRE9NOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5ET00uZ29hbDsgfSkuc3RhcnRXaXRoKCcnKSksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChvdXRwdXRzJFxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzLnJlc3VsdDsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIG91dHB1dHMucmVzdWx0OyB9KSksXG4gICAgfTtcbn1cbi8qKlxuICogU3BlZWNoYnViYmxlIGFjdGlvbiBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHNvdXJjZXNcbiAqXG4gKiAgICogZ29hbDogYSBzdHJlYW0gb2YgYG51bGxgIChhcyBcImNhbmNlbFwiKSxcbiAqICAgICBge3R5cGU6ICdNRVNTQUdFJywgdmFsdWU6ICdIZWxsbyB3b3JsZCd9YCBvciBgJ0hlbGxvIHdvcmxkJ2AgKGFzXG4gKiAgICAgXCJtZXNzYWdlXCIpLCBvciBge3R5cGU6ICdDSE9JQ0UnLCB2YWx1ZTogWydIZWxsbycsICdXb3JsZCddfWBcbiAqICAgICBvciBgWydIZWxsbycsICdXb3JsZCddYCAoYXMgXCJtdWx0aXBsZSBjaG9pY2VcIikuXG4gKiAgICogRE9NOiBDeWNsZS5qcyBbRE9NU291cmNlXShodHRwczovL2N5Y2xlLmpzLm9yZy9hcGkvZG9tLmh0bWwpLlxuICpcbiAqIEByZXR1cm4gc2lua3NcbiAqXG4gKiAgICogRE9NOiBhIHN0cmVhbSBvZiB2aXJ0dWFsIERPTSBvYmplY3RzLCBpLmUsIFtTbmFiYmRvbSDigJxWTm9kZeKAnSBvYmplY3RzXShodHRwczovL2dpdGh1Yi5jb20vc25hYmJkb20vc25hYmJkb20pLlxuICogICAqIHJlc3VsdDogYSBzdHJlYW0gb2YgYWN0aW9uIHJlc3VsdHMuXG4gKlxuICovXG5mdW5jdGlvbiBTcGVlY2hidWJibGVBY3Rpb24oc291cmNlcykge1xuICAgIHZhciBpbnB1dCQgPSBpbnB1dCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLmdvYWwpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShcbiAgICAvLyBJTVBPUlRBTlQhISBUaGlzIG1ha2VzIHRoZSBjbGljayBzdHJlYW0gYWx3YXlzIGV4aXN0LlxuICAgIHNvdXJjZXMuRE9NLnNlbGVjdCgnLmNob2ljZScpLmVsZW1lbnRzKClcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoYikgeyByZXR1cm4gc291cmNlcy5ET00uc2VsZWN0KCcuY2hvaWNlJykuZXZlbnRzKCdjbGljaycsIHtcbiAgICAgICAgcHJldmVudERlZmF1bHQ6IHRydWVcbiAgICB9KTsgfSlcbiAgICAgICAgLmZsYXR0ZW4oKSkpO1xuICAgIHZhciBtYWNoaW5lJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSk7IC8vIGRyb3AgXCJudWxsXCI7XG4gICAgdmFyIHNpbmtzID0gb3V0cHV0KG1hY2hpbmUkKTtcbiAgICByZXR1cm4gc2lua3M7XG59XG5leHBvcnRzLlNwZWVjaGJ1YmJsZUFjdGlvbiA9IFNwZWVjaGJ1YmJsZUFjdGlvbjtcbmZ1bmN0aW9uIElzb2xhdGVkU3BlZWNoYnViYmxlQWN0aW9uKHNvdXJjZXMpIHtcbiAgICByZXR1cm4gaXNvbGF0ZV8xLmRlZmF1bHQoU3BlZWNoYnViYmxlQWN0aW9uKShzb3VyY2VzKTtcbn1cbmV4cG9ydHMuSXNvbGF0ZWRTcGVlY2hidWJibGVBY3Rpb24gPSBJc29sYXRlZFNwZWVjaGJ1YmJsZUFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNwZWVjaGJ1YmJsZUFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbVwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBpc29sYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIkBjeWNsZS9pc29sYXRlXCIpKTtcbnZhciBkb21fMSA9IHJlcXVpcmUoXCJAY3ljbGUvZG9tXCIpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciBTcGVlY2hidWJibGVBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1NwZWVjaGJ1YmJsZUFjdGlvblwiKTtcbnZhciBTdGF0ZTtcbihmdW5jdGlvbiAoU3RhdGUpIHtcbiAgICBTdGF0ZVtcIlJVTk5JTkdcIl0gPSBcIlJVTk5JTkdcIjtcbiAgICBTdGF0ZVtcIkRPTkVcIl0gPSBcIkRPTkVcIjtcbiAgICBTdGF0ZVtcIlBSRUVNUFRJTkdcIl0gPSBcIlBSRUVNUFRJTkdcIjtcbn0pKFN0YXRlIHx8IChTdGF0ZSA9IHt9KSk7XG52YXIgSW5wdXRUeXBlO1xuKGZ1bmN0aW9uIChJbnB1dFR5cGUpIHtcbiAgICBJbnB1dFR5cGVbXCJHT0FMXCJdID0gXCJHT0FMXCI7XG4gICAgSW5wdXRUeXBlW1wiQ0FOQ0VMXCJdID0gXCJDQU5DRUxcIjtcbiAgICBJbnB1dFR5cGVbXCJSRVNVTFRcIl0gPSBcIlJFU1VMVFwiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xudmFyIFR3b1NwZWVjaGJ1YmJsZXNUeXBlO1xuKGZ1bmN0aW9uIChUd29TcGVlY2hidWJibGVzVHlwZSkge1xuICAgIFR3b1NwZWVjaGJ1YmJsZXNUeXBlW1wiU0VUX01FU1NBR0VcIl0gPSBcIlNFVF9NRVNTQUdFXCI7XG4gICAgVHdvU3BlZWNoYnViYmxlc1R5cGVbXCJBU0tfUVVFU1RJT05cIl0gPSBcIkFTS19RVUVTVElPTlwiO1xufSkoVHdvU3BlZWNoYnViYmxlc1R5cGUgPSBleHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlIHx8IChleHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlID0ge30pKTtcbmZ1bmN0aW9uIGlucHV0KGdvYWwkLCBodW1hblNwZWVjaGJ1YmJsZVJlc3VsdCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5maWx0ZXIoZnVuY3Rpb24gKGdvYWwpIHsgcmV0dXJuIHR5cGVvZiBnb2FsICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIGlmIChnb2FsID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5DQU5DRUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gISFnb2FsLmdvYWxfaWQgPyBnb2FsIDogYWN0aW9uXzEuaW5pdEdvYWwoZ29hbCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5HT0FMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAhdmFsdWUuZ29hbC50eXBlID8ge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBnb2FsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlb2YgdmFsdWUuZ29hbCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBUd29TcGVlY2hidWJibGVzVHlwZS5BU0tfUVVFU1RJT04sXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gOiB2YWx1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KSwgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQubWFwKGZ1bmN0aW9uIChyZXN1bHQpIHsgcmV0dXJuICh7XG4gICAgICAgIHR5cGU6IElucHV0VHlwZS5SRVNVTFQsXG4gICAgICAgIHZhbHVlOiByZXN1bHQsXG4gICAgfSk7IH0pKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRyYW5zaXRpb24oKSB7XG4gICAgdmFyIHRyYW5zaXRpb25UYWJsZSA9IChfYSA9IHt9LFxuICAgICAgICBfYVtTdGF0ZS5ET05FXSA9IChfYiA9IHt9LFxuICAgICAgICAgICAgX2JbSW5wdXRUeXBlLkdPQUxdID0gZnVuY3Rpb24gKHZhcmlhYmxlcywgaW5wdXRWYWx1ZSkgeyByZXR1cm4gKHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuUlVOTklORyxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXRWYWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBSb2JvdFNwZWVjaGJ1YmJsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudmFsdWUubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgSHVtYW5TcGVlY2hidWJibGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC50eXBlID09PSBUd29TcGVlY2hidWJibGVzVHlwZS5TRVRfTUVTU0FHRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBpbnB1dFZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC52YWx1ZS5jaG9pY2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7IH0sXG4gICAgICAgICAgICBfYiksXG4gICAgICAgIF9hW1N0YXRlLlJVTk5JTkddID0gKF9jID0ge30sXG4gICAgICAgICAgICBfY1tJbnB1dFR5cGUuR09BTF0gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXRWYWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgUm9ib3RTcGVlY2hidWJibGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudHlwZSA9PT0gVHdvU3BlZWNoYnViYmxlc1R5cGUuU0VUX01FU1NBR0UgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnZhbHVlLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEh1bWFuU3BlZWNoYnViYmxlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC52YWx1ZS5jaG9pY2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX2NbSW5wdXRUeXBlLkNBTkNFTF0gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7IHJldHVybiAoe1xuICAgICAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5ET05FLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogdmFyaWFibGVzLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgUm9ib3RTcGVlY2hidWJibGU6IHsgZ29hbDogbnVsbCB9LFxuICAgICAgICAgICAgICAgICAgICBIdW1hblNwZWVjaGJ1YmJsZTogeyBnb2FsOiBudWxsIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTsgfSxcbiAgICAgICAgICAgIF9jW0lucHV0VHlwZS5SRVNVTFRdID0gZnVuY3Rpb24gKHZhcmlhYmxlcywgaW5wdXRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY3Rpb25fMS5pc0VxdWFsKGlucHV0VmFsdWUuc3RhdHVzLmdvYWxfaWQsIHZhcmlhYmxlcy5nb2FsX2lkKVxuICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5wdXRWYWx1ZS5yZXN1bHQgPT09ICdzdHJpbmcnID8ge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuRE9ORSxcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgUm9ib3RTcGVlY2hidWJibGU6IHsgZ29hbDogbnVsbCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgSHVtYW5TcGVlY2hidWJibGU6IHsgZ29hbDogbnVsbCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IGlucHV0VmFsdWUucmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9IDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfYyksXG4gICAgICAgIF9hKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHN0YXRlLCB2YXJpYWJsZXMsIGlucHV0KSB7XG4gICAgICAgIHZhciBwcmV2ID0geyBzdGF0ZTogc3RhdGUsIHZhcmlhYmxlczogdmFyaWFibGVzLCBvdXRwdXRzOiBudWxsIH07XG4gICAgICAgIHJldHVybiAhdHJhbnNpdGlvblRhYmxlW3N0YXRlXVxuICAgICAgICAgICAgPyBwcmV2XG4gICAgICAgICAgICA6ICF0cmFuc2l0aW9uVGFibGVbc3RhdGVdW2lucHV0LnR5cGVdXG4gICAgICAgICAgICAgICAgPyBwcmV2XG4gICAgICAgICAgICAgICAgOiAodHJhbnNpdGlvblRhYmxlW3N0YXRlXVtpbnB1dC50eXBlXSh2YXJpYWJsZXMsIGlucHV0LnZhbHVlKSB8fCBwcmV2KTtcbiAgICB9O1xuICAgIHZhciBfYSwgX2IsIF9jO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvblJlZHVjZXIoaW5wdXQkKSB7XG4gICAgdmFyIGluaXRSZWR1Y2VyJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGZ1bmN0aW9uIGluaXRSZWR1Y2VyKG1hY2hpbmUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5ET05FLFxuICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogbnVsbCxcbiAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIHRyYW5zaXRpb24gPSBjcmVhdGVUcmFuc2l0aW9uKCk7XG4gICAgdmFyIGlucHV0UmVkdWNlciQgPSBpbnB1dCRcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoaW5wdXQpIHsgcmV0dXJuIGZ1bmN0aW9uIGlucHV0UmVkdWNlcihtYWNoaW5lKSB7XG4gICAgICAgIHJldHVybiB0cmFuc2l0aW9uKG1hY2hpbmUuc3RhdGUsIG1hY2hpbmUudmFyaWFibGVzLCBpbnB1dCk7XG4gICAgfTsgfSk7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGluaXRSZWR1Y2VyJCwgaW5wdXRSZWR1Y2VyJCk7XG59XG5mdW5jdGlvbiBvdXRwdXQobWFjaGluZSQpIHtcbiAgICB2YXIgb3V0cHV0cyQgPSBtYWNoaW5lJFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChtYWNoaW5lKSB7IHJldHVybiAhIW1hY2hpbmUub3V0cHV0czsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAobWFjaGluZSkgeyByZXR1cm4gbWFjaGluZS5vdXRwdXRzOyB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBSb2JvdFNwZWVjaGJ1YmJsZTogYWRhcHRfMS5hZGFwdChvdXRwdXRzJFxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzLlJvYm90U3BlZWNoYnViYmxlOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5Sb2JvdFNwZWVjaGJ1YmJsZS5nb2FsOyB9KSksXG4gICAgICAgIEh1bWFuU3BlZWNoYnViYmxlOiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiAhIW91dHB1dHMuSHVtYW5TcGVlY2hidWJibGU7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiBvdXRwdXRzLkh1bWFuU3BlZWNoYnViYmxlLmdvYWw7IH0pKSxcbiAgICAgICAgcmVzdWx0OiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiAhIW91dHB1dHMucmVzdWx0OyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5yZXN1bHQ7IH0pKSxcbiAgICB9O1xufVxuLyoqXG4gKiBUd29TcGVlY2hidWJibGVzLCBSb2JvdCBhbmQgSHVtYW4sIGFjdGlvbiBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHNvdXJjZXNcbiAqXG4gKiAgICogZ29hbDogYSBzdHJlYW0gb2YgYG51bGxgIChhcyBcImNhbmNlbFwiKSxcbiAqICAgICBge3R5cGU6ICdTRVRfTUVTU0FHRScsIHZhbHVlOiAnSGVsbG8gd29ybGQnfWAgb3IgYCdIZWxsbyB3b3JsZCdgIChhc1xuICogICAgIFwic2V0IG1lc3NhZ2VcIiksIG9yIGB7dHlwZTogJ0FTS19RVUVTVElPTicsIG1lc3NhZ2U6ICdCbHVlIHBpbGwgb3JcbiAqICAgICByZWQgcGlsbD8nLCBjaG9pY2VzOiBbJ0JsdWUnLCAnUmVkJ119YCAoYXMgXCJhc2sgbXVsdGlwbGUgY2hvaWNlXCIpLlxuICogICAqIERPTTogQ3ljbGUuanMgW0RPTVNvdXJjZV0oaHR0cHM6Ly9jeWNsZS5qcy5vcmcvYXBpL2RvbS5odG1sKS5cbiAqXG4gKiBAcmV0dXJuIHNpbmtzXG4gKlxuICogICAqIERPTTogYSBzdHJlYW0gb2YgdmlydHVhbCBET00gb2JqZWN0cywgaS5lLCBbU25hYmJkb20g4oCcVk5vZGXigJ0gb2JqZWN0c10oaHR0cHM6Ly9naXRodWIuY29tL3NuYWJiZG9tL3NuYWJiZG9tKS5cbiAqICAgKiByZXN1bHQ6IGEgc3RyZWFtIG9mIGFjdGlvbiByZXN1bHRzLlxuICpcbiAqL1xuZnVuY3Rpb24gVHdvU3BlZWNoYnViYmxlc0FjdGlvbihzb3VyY2VzKSB7XG4gICAgLy8gY3JlYXRlIHByb3hpZXNcbiAgICB2YXIgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICB2YXIgaW5wdXQkID0gaW5wdXQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5nb2FsKSwgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQpO1xuICAgIHZhciBtYWNoaW5lJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSk7IC8vIGRyb3AgXCJudWxsXCI7XG4gICAgdmFyIF9hID0gb3V0cHV0KG1hY2hpbmUkKSwgUm9ib3RTcGVlY2hidWJibGUgPSBfYS5Sb2JvdFNwZWVjaGJ1YmJsZSwgSHVtYW5TcGVlY2hidWJibGUgPSBfYS5IdW1hblNwZWVjaGJ1YmJsZSwgcmVzdWx0ID0gX2EucmVzdWx0O1xuICAgIC8vIGNyZWF0ZSBzdWItY29tcG9uZW50c1xuICAgIHZhciByb2JvdFNwZWVjaGJ1YmJsZSA9IFNwZWVjaGJ1YmJsZUFjdGlvbl8xLklzb2xhdGVkU3BlZWNoYnViYmxlQWN0aW9uKHtcbiAgICAgICAgZ29hbDogUm9ib3RTcGVlY2hidWJibGUsXG4gICAgICAgIERPTTogc291cmNlcy5ET00sXG4gICAgfSk7XG4gICAgdmFyIGh1bWFuU3BlZWNoYnViYmxlID0gU3BlZWNoYnViYmxlQWN0aW9uXzEuSXNvbGF0ZWRTcGVlY2hidWJibGVBY3Rpb24oe1xuICAgICAgICBnb2FsOiBIdW1hblNwZWVjaGJ1YmJsZSxcbiAgICAgICAgRE9NOiBzb3VyY2VzLkRPTSxcbiAgICB9KTtcbiAgICAvLyBJTVBPUlRBTlQhISBBdHRhY2ggbGlzdGVuZXJzIHRvIHRoZSBET00gc3RyZWFtcyBCRUZPUkUgY29ubmVjdGluZyB0aGVcbiAgICAvLyAgIHByb3hpZXMgdG8gaGF2ZSBOTyBRVUVVRSBpbiB0aGUgRE9NIHN0cmVhbXMuXG4gICAgcm9ib3RTcGVlY2hidWJibGUuRE9NLmFkZExpc3RlbmVyKHsgbmV4dDogZnVuY3Rpb24gKHZhbHVlKSB7IH0gfSk7XG4gICAgaHVtYW5TcGVlY2hidWJibGUuRE9NLmFkZExpc3RlbmVyKHsgbmV4dDogZnVuY3Rpb24gKHZhbHVlKSB7IH0gfSk7XG4gICAgLy8gY29ubmVjdCBwcm94aWVzXG4gICAgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQuaW1pdGF0ZShodW1hblNwZWVjaGJ1YmJsZS5yZXN1bHQpO1xuICAgIHZhciBzdHlsZXMgPSB7XG4gICAgICAgIG91dGVyOiB7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHdpZHRoOiAnMTAwdncnLFxuICAgICAgICAgICAgekluZGV4OiAxLFxuICAgICAgICAgICAgbWFyZ2luOiAnMWVtJyxcbiAgICAgICAgfSxcbiAgICAgICAgYnViYmxlOiB7XG4gICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICBwYWRkaW5nOiAnMWVtJyxcbiAgICAgICAgICAgIG1heFdpZHRoOiAnOTAlJyxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHZhciB2ZG9tJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNvbWJpbmUocm9ib3RTcGVlY2hidWJibGUuRE9NLCBodW1hblNwZWVjaGJ1YmJsZS5ET00pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciByb2JvdFZUcmVlID0gX2FbMF0sIGh1bWFuVlRyZWUgPSBfYVsxXTtcbiAgICAgICAgcmV0dXJuIGRvbV8xLmRpdih7IHN0eWxlOiBzdHlsZXMub3V0ZXIgfSwgW1xuICAgICAgICAgICAgZG9tXzEuZGl2KHsgc3R5bGU6IHN0eWxlcy5idWJibGUgfSwgW2RvbV8xLnNwYW4ocm9ib3RWVHJlZSldKSxcbiAgICAgICAgICAgIGRvbV8xLmRpdih7IHN0eWxlOiBfX2Fzc2lnbih7fSwgc3R5bGVzLmJ1YmJsZSwgeyB0ZXh0QWxpZ246ICdyaWdodCcgfSkgfSwgW2RvbV8xLnNwYW4oaHVtYW5WVHJlZSldKSxcbiAgICAgICAgXSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRE9NOiB2ZG9tJCxcbiAgICAgICAgcmVzdWx0OiByZXN1bHQsXG4gICAgfTtcbn1cbmV4cG9ydHMuVHdvU3BlZWNoYnViYmxlc0FjdGlvbiA9IFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb247XG5mdW5jdGlvbiBJc29sYXRlZFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24oc291cmNlcykge1xuICAgIHJldHVybiBpc29sYXRlXzEuZGVmYXVsdChUd29TcGVlY2hidWJibGVzQWN0aW9uKShzb3VyY2VzKTtcbn1cbmV4cG9ydHMuSXNvbGF0ZWRUd29TcGVlY2hidWJibGVzQWN0aW9uID0gSXNvbGF0ZWRUd29TcGVlY2hidWJibGVzQWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9VHdvU3BlZWNoYnViYmxlc0FjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBtYWtlVGFibGV0RmFjZURyaXZlcl8xID0gcmVxdWlyZShcIi4vbWFrZVRhYmxldEZhY2VEcml2ZXJcIik7XG5leHBvcnRzLkV4cHJlc3NDb21tYW5kVHlwZSA9IG1ha2VUYWJsZXRGYWNlRHJpdmVyXzEuRXhwcmVzc0NvbW1hbmRUeXBlO1xuZXhwb3J0cy5tYWtlVGFibGV0RmFjZURyaXZlciA9IG1ha2VUYWJsZXRGYWNlRHJpdmVyXzEubWFrZVRhYmxldEZhY2VEcml2ZXI7XG52YXIgRmFjaWFsRXhwcmVzc2lvbkFjdGlvbl8xID0gcmVxdWlyZShcIi4vRmFjaWFsRXhwcmVzc2lvbkFjdGlvblwiKTtcbmV4cG9ydHMuRmFjaWFsRXhwcmVzc2lvbkFjdGlvbiA9IEZhY2lhbEV4cHJlc3Npb25BY3Rpb25fMS5GYWNpYWxFeHByZXNzaW9uQWN0aW9uO1xudmFyIFNwZWVjaGJ1YmJsZUFjdGlvbl8xID0gcmVxdWlyZShcIi4vU3BlZWNoYnViYmxlQWN0aW9uXCIpO1xuZXhwb3J0cy5TcGVlY2hidWJibGVUeXBlID0gU3BlZWNoYnViYmxlQWN0aW9uXzEuU3BlZWNoYnViYmxlVHlwZTtcbmV4cG9ydHMuU3BlZWNoYnViYmxlQWN0aW9uID0gU3BlZWNoYnViYmxlQWN0aW9uXzEuU3BlZWNoYnViYmxlQWN0aW9uO1xuZXhwb3J0cy5Jc29sYXRlZFNwZWVjaGJ1YmJsZUFjdGlvbiA9IFNwZWVjaGJ1YmJsZUFjdGlvbl8xLklzb2xhdGVkU3BlZWNoYnViYmxlQWN0aW9uO1xudmFyIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1R3b1NwZWVjaGJ1YmJsZXNBY3Rpb25cIik7XG5leHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlID0gVHdvU3BlZWNoYnViYmxlc0FjdGlvbl8xLlR3b1NwZWVjaGJ1YmJsZXNUeXBlO1xuZXhwb3J0cy5Ud29TcGVlY2hidWJibGVzQWN0aW9uID0gVHdvU3BlZWNoYnViYmxlc0FjdGlvbl8xLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb247XG5leHBvcnRzLklzb2xhdGVkVHdvU3BlZWNoYnViYmxlc0FjdGlvbiA9IFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb25fMS5Jc29sYXRlZFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGRvbV8xID0gcmVxdWlyZShcIkBjeWNsZS9kb21cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbi8vIGFkYXB0ZWQgZnJvbVxuLy8gICBodHRwczovL2dpdGh1Yi5jb20vbWp5Yy90YWJsZXQtcm9ib3QtZmFjZS9ibG9iLzcwOWI3MzFkZmYwNDAzM2MwOGNmMDQ1YWRjNGUwMzhlZWZhNzUwYTIvaW5kZXguanMjTDMtTDE4NFxudmFyIEV5ZUNvbnRyb2xsZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXllQ29udHJvbGxlcihlbGVtZW50cywgZXllU2l6ZSkge1xuICAgICAgICBpZiAoZWxlbWVudHMgPT09IHZvaWQgMCkgeyBlbGVtZW50cyA9IHt9OyB9XG4gICAgICAgIGlmIChleWVTaXplID09PSB2b2lkIDApIHsgZXllU2l6ZSA9ICczMy4zM3ZtaW4nOyB9XG4gICAgICAgIHRoaXMuX2V5ZVNpemUgPSBleWVTaXplO1xuICAgICAgICB0aGlzLl9ibGlua1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgIHRoaXMuc2V0RWxlbWVudHMoZWxlbWVudHMpO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXllQ29udHJvbGxlci5wcm90b3R5cGUsIFwibGVmdEV5ZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fbGVmdEV5ZTsgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLCBcInJpZ2h0RXllXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9yaWdodEV5ZTsgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgRXllQ29udHJvbGxlci5wcm90b3R5cGUuc2V0RWxlbWVudHMgPSBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgdmFyIGxlZnRFeWUgPSBfYS5sZWZ0RXllLCByaWdodEV5ZSA9IF9hLnJpZ2h0RXllLCB1cHBlckxlZnRFeWVsaWQgPSBfYS51cHBlckxlZnRFeWVsaWQsIHVwcGVyUmlnaHRFeWVsaWQgPSBfYS51cHBlclJpZ2h0RXllbGlkLCBsb3dlckxlZnRFeWVsaWQgPSBfYS5sb3dlckxlZnRFeWVsaWQsIGxvd2VyUmlnaHRFeWVsaWQgPSBfYS5sb3dlclJpZ2h0RXllbGlkO1xuICAgICAgICB0aGlzLl9sZWZ0RXllID0gbGVmdEV5ZTtcbiAgICAgICAgdGhpcy5fcmlnaHRFeWUgPSByaWdodEV5ZTtcbiAgICAgICAgdGhpcy5fdXBwZXJMZWZ0RXllbGlkID0gdXBwZXJMZWZ0RXllbGlkO1xuICAgICAgICB0aGlzLl91cHBlclJpZ2h0RXllbGlkID0gdXBwZXJSaWdodEV5ZWxpZDtcbiAgICAgICAgdGhpcy5fbG93ZXJMZWZ0RXllbGlkID0gbG93ZXJMZWZ0RXllbGlkO1xuICAgICAgICB0aGlzLl9sb3dlclJpZ2h0RXllbGlkID0gbG93ZXJSaWdodEV5ZWxpZDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5fY3JlYXRlS2V5ZnJhbWVzID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBfYiA9IF9hLnRndFRyYW5ZVmFsLCB0Z3RUcmFuWVZhbCA9IF9iID09PSB2b2lkIDAgPyAnMHB4JyA6IF9iLCBfYyA9IF9hLnRndFJvdFZhbCwgdGd0Um90VmFsID0gX2MgPT09IHZvaWQgMCA/ICcwZGVnJyA6IF9jLCBfZCA9IF9hLmVudGVyZWRPZmZzZXQsIGVudGVyZWRPZmZzZXQgPSBfZCA9PT0gdm9pZCAwID8gMCA6IF9kLCBfZSA9IF9hLmV4aXRpbmdPZmZzZXQsIGV4aXRpbmdPZmZzZXQgPSBfZSA9PT0gdm9pZCAwID8gMCA6IF9lO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyB0cmFuc2Zvcm06IFwidHJhbnNsYXRlWSgwcHgpIHJvdGF0ZSgwZGVnKVwiLCBvZmZzZXQ6IDAuMCB9LFxuICAgICAgICAgICAgeyB0cmFuc2Zvcm06IFwidHJhbnNsYXRlWShcIiArIHRndFRyYW5ZVmFsICsgXCIpIHJvdGF0ZShcIiArIHRndFJvdFZhbCArIFwiKVwiLCBvZmZzZXQ6IGVudGVyZWRPZmZzZXQgfSxcbiAgICAgICAgICAgIHsgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZVkoXCIgKyB0Z3RUcmFuWVZhbCArIFwiKSByb3RhdGUoXCIgKyB0Z3RSb3RWYWwgKyBcIilcIiwgb2Zmc2V0OiBleGl0aW5nT2Zmc2V0IH0sXG4gICAgICAgICAgICB7IHRyYW5zZm9ybTogXCJ0cmFuc2xhdGVZKDBweCkgcm90YXRlKDBkZWcpXCIsIG9mZnNldDogMS4wIH0sXG4gICAgICAgIF07XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5leHByZXNzID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBfYiA9IF9hLnR5cGUsIHR5cGUgPSBfYiA9PT0gdm9pZCAwID8gJycgOiBfYiwgXG4gICAgICAgIC8vIGxldmVsID0gMywgIC8vIDE6IG1pbiwgNTogbWF4XG4gICAgICAgIF9jID0gX2EuZHVyYXRpb24sIFxuICAgICAgICAvLyBsZXZlbCA9IDMsICAvLyAxOiBtaW4sIDU6IG1heFxuICAgICAgICBkdXJhdGlvbiA9IF9jID09PSB2b2lkIDAgPyAxMDAwIDogX2MsIF9kID0gX2EuZW50ZXJEdXJhdGlvbiwgZW50ZXJEdXJhdGlvbiA9IF9kID09PSB2b2lkIDAgPyA3NSA6IF9kLCBfZSA9IF9hLmV4aXREdXJhdGlvbiwgZXhpdER1cmF0aW9uID0gX2UgPT09IHZvaWQgMCA/IDc1IDogX2U7XG4gICAgICAgIGlmICghdGhpcy5fbGVmdEV5ZSkgeyAvLyBhc3N1bWVzIGFsbCBlbGVtZW50cyBhcmUgYWx3YXlzIHNldCB0b2dldGhlclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdFeWUgZWxlbWVudHMgYXJlIG5vdCBzZXQ7IHJldHVybjsnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGR1cmF0aW9uOiBkdXJhdGlvbixcbiAgICAgICAgfTtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdoYXBweSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbG93ZXJMZWZ0RXllbGlkOiB0aGlzLl9sb3dlckxlZnRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIC0yIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFJvdFZhbDogXCIzMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICAgICAgbG93ZXJSaWdodEV5ZWxpZDogdGhpcy5fbG93ZXJSaWdodEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogLTIgLyAzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGd0Um90VmFsOiBcIi0zMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2FzZSAnc2FkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB1cHBlckxlZnRFeWVsaWQ6IHRoaXMuX3VwcGVyTGVmdEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RSb3RWYWw6IFwiLTIwZGVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICB1cHBlclJpZ2h0RXllbGlkOiB0aGlzLl91cHBlclJpZ2h0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAxIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFJvdFZhbDogXCIyMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2FzZSAnYW5ncnknOlxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHVwcGVyTGVmdEV5ZWxpZDogdGhpcy5fdXBwZXJMZWZ0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAxIC8gNClcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFJvdFZhbDogXCIzMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJSaWdodEV5ZWxpZDogdGhpcy5fdXBwZXJSaWdodEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDQpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RSb3RWYWw6IFwiLTMwZGVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjYXNlICdmb2N1c2VkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB1cHBlckxlZnRFeWVsaWQ6IHRoaXMuX3VwcGVyTGVmdEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICB1cHBlclJpZ2h0RXllbGlkOiB0aGlzLl91cHBlclJpZ2h0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAxIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgICAgIGxvd2VyTGVmdEV5ZWxpZDogdGhpcy5fbG93ZXJMZWZ0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAtMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICBsb3dlclJpZ2h0RXllbGlkOiB0aGlzLl9sb3dlclJpZ2h0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAtMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjYXNlICdjb25mdXNlZCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJSaWdodEV5ZWxpZDogdGhpcy5fdXBwZXJSaWdodEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RSb3RWYWw6IFwiLTEwZGVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkludmFsaWQgaW5wdXQgdHlwZT1cIiArIHR5cGUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5ibGluayA9IGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgX2IgPSAoX2EgPT09IHZvaWQgMCA/IHt9IDogX2EpLmR1cmF0aW9uLCBkdXJhdGlvbiA9IF9iID09PSB2b2lkIDAgPyAxNTAgOiBfYjtcbiAgICAgICAgaWYgKCF0aGlzLl9sZWZ0RXllKSB7IC8vIGFzc3VtZXMgYWxsIGVsZW1lbnRzIGFyZSBhbHdheXMgc2V0IHRvZ2V0aGVyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0V5ZSBlbGVtZW50cyBhcmUgbm90IHNldDsgcmV0dXJuOycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFt0aGlzLl9sZWZ0RXllLCB0aGlzLl9yaWdodEV5ZV0ubWFwKGZ1bmN0aW9uIChleWUpIHtcbiAgICAgICAgICAgIGV5ZS5hbmltYXRlKFtcbiAgICAgICAgICAgICAgICB7IHRyYW5zZm9ybTogJ3JvdGF0ZVgoMGRlZyknIH0sXG4gICAgICAgICAgICAgICAgeyB0cmFuc2Zvcm06ICdyb3RhdGVYKDkwZGVnKScgfSxcbiAgICAgICAgICAgICAgICB7IHRyYW5zZm9ybTogJ3JvdGF0ZVgoMGRlZyknIH0sXG4gICAgICAgICAgICBdLCB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb246IGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgIGl0ZXJhdGlvbnM6IDEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5zdGFydEJsaW5raW5nID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBfYiA9IChfYSA9PT0gdm9pZCAwID8ge30gOiBfYSkubWF4SW50ZXJ2YWwsIG1heEludGVydmFsID0gX2IgPT09IHZvaWQgMCA/IDUwMDAgOiBfYjtcbiAgICAgICAgaWYgKHRoaXMuX2JsaW5rVGltZW91dElEKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJBbHJlYWR5IGJsaW5raW5nIHdpdGggdGltZW91dElEPVwiICsgdGhpcy5fYmxpbmtUaW1lb3V0SUQgKyBcIjsgcmV0dXJuO1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYmxpbmtSYW5kb21seSA9IGZ1bmN0aW9uICh0aW1lb3V0KSB7XG4gICAgICAgICAgICBfdGhpcy5fYmxpbmtUaW1lb3V0SUQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5ibGluaygpO1xuICAgICAgICAgICAgICAgIGJsaW5rUmFuZG9tbHkoTWF0aC5yYW5kb20oKSAqIG1heEludGVydmFsKTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICB9O1xuICAgICAgICBibGlua1JhbmRvbWx5KE1hdGgucmFuZG9tKCkgKiBtYXhJbnRlcnZhbCk7XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5zdG9wQmxpbmtpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9ibGlua1RpbWVvdXRJRCk7XG4gICAgICAgIHRoaXMuX2JsaW5rVGltZW91dElEID0gbnVsbDtcbiAgICB9O1xuICAgIEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLnNldEV5ZVBvc2l0aW9uID0gZnVuY3Rpb24gKGV5ZUVsZW0sIHgsIHksIGlzUmlnaHQpIHtcbiAgICAgICAgaWYgKGlzUmlnaHQgPT09IHZvaWQgMCkgeyBpc1JpZ2h0ID0gZmFsc2U7IH1cbiAgICAgICAgaWYgKCFleWVFbGVtKSB7IC8vIGFzc3VtZXMgYWxsIGVsZW1lbnRzIGFyZSBhbHdheXMgc2V0IHRvZ2V0aGVyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgaW5wdXRzICcsIGV5ZUVsZW0sIHgsIHksICc7IHJldHVuaW5nJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc05hTih4KSkge1xuICAgICAgICAgICAgaWYgKCFpc1JpZ2h0KSB7XG4gICAgICAgICAgICAgICAgZXllRWxlbS5zdHlsZS5sZWZ0ID0gXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiIC8gMyAqIDIgKiBcIiArIHggKyBcIilcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGV5ZUVsZW0uc3R5bGUucmlnaHQgPSBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgLyAzICogMiAqIFwiICsgKDEgLSB4KSArIFwiKVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaXNOYU4oeSkpIHtcbiAgICAgICAgICAgIGV5ZUVsZW0uc3R5bGUuYm90dG9tID0gXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiIC8gMyAqIDIgKiBcIiArICgxIC0geSkgKyBcIilcIjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEV5ZUNvbnRyb2xsZXI7XG59KCkpO1xudmFyIENvbW1hbmRUeXBlO1xuKGZ1bmN0aW9uIChDb21tYW5kVHlwZSkge1xuICAgIENvbW1hbmRUeXBlW1wiRVhQUkVTU1wiXSA9IFwiRVhQUkVTU1wiO1xuICAgIENvbW1hbmRUeXBlW1wiU1RBUlRfQkxJTktJTkdcIl0gPSBcIlNUQVJUX0JMSU5LSU5HXCI7XG4gICAgQ29tbWFuZFR5cGVbXCJTVE9QX0JMSU5LSU5HXCJdID0gXCJTVE9QX0JMSU5LSU5HXCI7XG4gICAgQ29tbWFuZFR5cGVbXCJTRVRfU1RBVEVcIl0gPSBcIlNFVF9TVEFURVwiO1xufSkoQ29tbWFuZFR5cGUgfHwgKENvbW1hbmRUeXBlID0ge30pKTtcbnZhciBFeHByZXNzQ29tbWFuZFR5cGU7XG4oZnVuY3Rpb24gKEV4cHJlc3NDb21tYW5kVHlwZSkge1xuICAgIEV4cHJlc3NDb21tYW5kVHlwZVtcIkhBUFBZXCJdID0gXCJoYXBweVwiO1xuICAgIEV4cHJlc3NDb21tYW5kVHlwZVtcIlNBRFwiXSA9IFwic2FkXCI7XG4gICAgRXhwcmVzc0NvbW1hbmRUeXBlW1wiQU5HUllcIl0gPSBcImFuZ3J5XCI7XG4gICAgRXhwcmVzc0NvbW1hbmRUeXBlW1wiRk9DVVNFRFwiXSA9IFwiZm9jdXNlZFwiO1xuICAgIEV4cHJlc3NDb21tYW5kVHlwZVtcIkNPTkZVU0VEXCJdID0gXCJjb25mdXNlZFwiO1xufSkoRXhwcmVzc0NvbW1hbmRUeXBlID0gZXhwb3J0cy5FeHByZXNzQ29tbWFuZFR5cGUgfHwgKGV4cG9ydHMuRXhwcmVzc0NvbW1hbmRUeXBlID0ge30pKTtcbi8qKlxuICogW1RhYmxldEZhY2VdKGh0dHBzOi8vZ2l0aHViLmNvbS9tanljL3RhYmxldC1yb2JvdC1mYWNlKSBkcml2ZXIgZmFjdG9yeS5cbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBwb3NzaWJsZSBrZXkgaW5jbHVkZXNcbiAqXG4gKiAgICogc3R5bGVzIHtvYmplY3R9IEEgZ3JvdXAgb2Ygb3B0aW9uYWwgZmFjZSBzdHlsZSBwYXJhbWV0ZXJzOlxuICogICAgICogZmFjZUNvbG9yIHtzdHJpbmd9IChkZWZhdWx0OiAnd2hpdGVzbW9rZScpXG4gKiAgICAgKiBmYWNlSGVpZ2h0IHtzdHJpbmd9IChkZWZhdWx0OiAnMTAwdmgnKVxuICogICAgICogZmFjZVdpZHRoIHtzdHJpbmd9IChkZWZhdWx0OiAnMTAwdncnKVxuICogICAgICogZXllQ29sb3Ige3N0cmluZ30gKGRlZmF1bHQ6ICdibGFjaycpXG4gKiAgICAgKiBleWVTaXplIHtzdHJpbmd9IChkZWZhdWx0OiAnMzMuMzN2bWluJylcbiAqICAgICAqIGV5ZWxpZENvbG9yIHtzdHJpbmd9IChkZWZhdWx0OiAnd2hpdGVzbW9rZScpXG4gKlxuICogQHJldHVybiB7RHJpdmVyfSB0aGUgVGFibGV0RmFjZSBDeWNsZS5qcyBkcml2ZXIgZnVuY3Rpb24uIEl0IHRha2VzIGEgc3RyZWFtXG4gKiAgIG9mIGBDb21tYW5kYCBhbmQgcmV0dXJucyBgRE9NYCwgYW5pbWF0aW9uRmluaXNoYCwgYW5kIGBsb2FkYCBzdHJlYW1zLlxuICovXG5mdW5jdGlvbiBtYWtlVGFibGV0RmFjZURyaXZlcihfYSkge1xuICAgIHZhciBfYiA9IChfYSA9PT0gdm9pZCAwID8ge30gOiBfYSkuc3R5bGVzLCBfYyA9IF9iID09PSB2b2lkIDAgPyB7fSA6IF9iLCBfZCA9IF9jLmZhY2VDb2xvciwgZmFjZUNvbG9yID0gX2QgPT09IHZvaWQgMCA/ICd3aGl0ZXNtb2tlJyA6IF9kLCBfZSA9IF9jLmZhY2VIZWlnaHQsIGZhY2VIZWlnaHQgPSBfZSA9PT0gdm9pZCAwID8gJzEwMHZoJyA6IF9lLCBfZiA9IF9jLmZhY2VXaWR0aCwgZmFjZVdpZHRoID0gX2YgPT09IHZvaWQgMCA/ICcxMDB2dycgOiBfZiwgX2cgPSBfYy5leWVDb2xvciwgZXllQ29sb3IgPSBfZyA9PT0gdm9pZCAwID8gJ2JsYWNrJyA6IF9nLCBfaCA9IF9jLmV5ZVNpemUsIGV5ZVNpemUgPSBfaCA9PT0gdm9pZCAwID8gJzMzLjMzdm1pbicgOiBfaCwgX2ogPSBfYy5leWVsaWRDb2xvciwgZXllbGlkQ29sb3IgPSBfaiA9PT0gdm9pZCAwID8gJ3doaXRlc21va2UnIDogX2o7XG4gICAgdmFyIHN0eWxlcyA9IHtcbiAgICAgICAgZmFjZToge1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBmYWNlQ29sb3IsXG4gICAgICAgICAgICBoZWlnaHQ6IGZhY2VIZWlnaHQsXG4gICAgICAgICAgICB3aWR0aDogZmFjZVdpZHRoLFxuICAgICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICAgICAgICB6SW5kZXg6IDAsXG4gICAgICAgIH0sXG4gICAgICAgIGV5ZToge1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBleWVDb2xvcixcbiAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzEwMCUnLFxuICAgICAgICAgICAgaGVpZ2h0OiBleWVTaXplLFxuICAgICAgICAgICAgd2lkdGg6IGV5ZVNpemUsXG4gICAgICAgICAgICBib3R0b206IFwiY2FsYyhcIiArIGV5ZVNpemUgKyBcIiAvIDMpXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDEsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgfSxcbiAgICAgICAgbGVmdDoge1xuICAgICAgICAgICAgbGVmdDogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiIC8gMylcIixcbiAgICAgICAgfSxcbiAgICAgICAgcmlnaHQ6IHtcbiAgICAgICAgICAgIHJpZ2h0OiBcImNhbGMoXCIgKyBleWVTaXplICsgXCIgLyAzKVwiLFxuICAgICAgICB9LFxuICAgICAgICBleWVsaWQ6IHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogZXllbGlkQ29sb3IsXG4gICAgICAgICAgICBoZWlnaHQ6IGV5ZVNpemUsXG4gICAgICAgICAgICB3aWR0aDogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiICogMS43NSlcIixcbiAgICAgICAgICAgIHpJbmRleDogMixcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICB9LFxuICAgICAgICB1cHBlcjoge1xuICAgICAgICAgICAgYm90dG9tOiBcImNhbGMoXCIgKyBleWVTaXplICsgXCIgKiAxKVwiLFxuICAgICAgICAgICAgbGVmdDogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiICogLTAuMzc1KVwiLFxuICAgICAgICB9LFxuICAgICAgICBsb3dlcjoge1xuICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnMTAwJScsXG4gICAgICAgICAgICBib3R0b206IFwiY2FsYyhcIiArIGV5ZVNpemUgKyBcIiAqIC0xKVwiLFxuICAgICAgICAgICAgbGVmdDogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiICogLTAuMzc1KVwiLFxuICAgICAgICB9LFxuICAgIH07XG4gICAgdmFyIGV5ZXMgPSBuZXcgRXllQ29udHJvbGxlcigpO1xuICAgIHZhciBpZCA9IFwiZmFjZS1cIiArIFN0cmluZyhNYXRoLnJhbmRvbSgpKS5zdWJzdHIoMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjb21tYW5kJCkge1xuICAgICAgICB2YXIgbG9hZCQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgdmFyIGludGVydmFsSUQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjXCIgKyBpZCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiV2FpdGluZyBmb3IgI1wiICsgaWQgKyBcIiB0byBhcHBlYXIuLi5cIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbElEKTtcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNcIiArIGlkKTtcbiAgICAgICAgICAgIGV5ZXMuc2V0RWxlbWVudHMoe1xuICAgICAgICAgICAgICAgIGxlZnRFeWU6IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLmxlZnQuZXllJyksXG4gICAgICAgICAgICAgICAgcmlnaHRFeWU6IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLnJpZ2h0LmV5ZScpLFxuICAgICAgICAgICAgICAgIHVwcGVyTGVmdEV5ZWxpZDogZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubGVmdCAuZXllbGlkLnVwcGVyJyksXG4gICAgICAgICAgICAgICAgdXBwZXJSaWdodEV5ZWxpZDogZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmlnaHQgLmV5ZWxpZC51cHBlcicpLFxuICAgICAgICAgICAgICAgIGxvd2VyTGVmdEV5ZWxpZDogZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubGVmdCAuZXllbGlkLmxvd2VyJyksXG4gICAgICAgICAgICAgICAgbG93ZXJSaWdodEV5ZWxpZDogZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmlnaHQgLmV5ZWxpZC5sb3dlcicpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsb2FkJC5zaGFtZWZ1bGx5U2VuZE5leHQodHJ1ZSk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgICB2YXIgYW5pbWF0aW9ucyA9IHt9O1xuICAgICAgICB2YXIgYW5pbWF0aW9uRmluaXNoJCQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoY29tbWFuZCQpLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGFuaW1hdGlvbnMpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25zW2tleV0uY2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN3aXRjaCAoY29tbWFuZC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQ29tbWFuZFR5cGUuRVhQUkVTUzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbnMgPSBleWVzLmV4cHJlc3MoY29tbWFuZC52YWx1ZSkgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25GaW5pc2gkJC5zaGFtZWZ1bGx5U2VuZE5leHQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbVByb21pc2UoUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoYW5pbWF0aW9ucykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25zW2tleV0ub25maW5pc2ggPSByZXNvbHZlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDb21tYW5kVHlwZS5TVEFSVF9CTElOS0lORzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGV5ZXMuc3RhcnRCbGlua2luZyhjb21tYW5kLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIENvbW1hbmRUeXBlLlNUT1BfQkxJTktJTkc6XG4gICAgICAgICAgICAgICAgICAgICAgICBleWVzLnN0b3BCbGlua2luZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQ29tbWFuZFR5cGUuU0VUX1NUQVRFOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gY29tbWFuZC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZWZ0UG9zID0gdmFsdWUgJiYgdmFsdWUubGVmdEV5ZSB8fCB7IHg6IG51bGwsIHk6IG51bGwgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByaWdodFBvcyA9IHZhbHVlICYmIHZhbHVlLnJpZ2h0RXllIHx8IHsgeDogbnVsbCwgeTogbnVsbCB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZXllcy5zZXRFeWVQb3NpdGlvbihleWVzLmxlZnRFeWUsIGxlZnRQb3MueCwgbGVmdFBvcy55KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV5ZXMuc2V0RXllUG9zaXRpb24oZXllcy5yaWdodEV5ZSwgcmlnaHRQb3MueCwgcmlnaHRQb3MueSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdmRvbSQgPSB4c3RyZWFtXzEuZGVmYXVsdC5vZihkb21fMS5kaXYoXCIjXCIgKyBpZCArIFwiLmZhY2VcIiwgeyBzdHlsZTogc3R5bGVzLmZhY2UgfSwgW1xuICAgICAgICAgICAgZG9tXzEuZGl2KCcuZXllLmxlZnQnLCB7XG4gICAgICAgICAgICAgICAgc3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlcy5leWUsIHN0eWxlcy5sZWZ0KSxcbiAgICAgICAgICAgIH0sIFtcbiAgICAgICAgICAgICAgICBkb21fMS5kaXYoJy5leWVsaWQudXBwZXInLCB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiBPYmplY3QuYXNzaWduKHt9LCBzdHlsZXMuZXllbGlkLCBzdHlsZXMudXBwZXIpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGRvbV8xLmRpdignLmV5ZWxpZC5sb3dlcicsIHtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlcy5leWVsaWQsIHN0eWxlcy5sb3dlciksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdKSxcbiAgICAgICAgICAgIGRvbV8xLmRpdignLmV5ZS5yaWdodCcsIHtcbiAgICAgICAgICAgICAgICBzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgc3R5bGVzLmV5ZSwgc3R5bGVzLnJpZ2h0KSxcbiAgICAgICAgICAgIH0sIFtcbiAgICAgICAgICAgICAgICBkb21fMS5kaXYoJy5leWVsaWQudXBwZXInLCB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiBPYmplY3QuYXNzaWduKHt9LCBzdHlsZXMuZXllbGlkLCBzdHlsZXMudXBwZXIpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGRvbV8xLmRpdignLmV5ZWxpZC5sb3dlcicsIHtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlcy5leWVsaWQsIHN0eWxlcy5sb3dlciksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdKSxcbiAgICAgICAgXSkpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgRE9NOiBhZGFwdF8xLmFkYXB0KHZkb20kKSxcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbmlzaDogYWRhcHRfMS5hZGFwdChhbmltYXRpb25GaW5pc2gkJC5mbGF0dGVuKCkpLFxuICAgICAgICAgICAgbG9hZDogYWRhcHRfMS5hZGFwdChsb2FkJCksXG4gICAgICAgIH07XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZVRhYmxldEZhY2VEcml2ZXIgPSBtYWtlVGFibGV0RmFjZURyaXZlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1ha2VUYWJsZXRGYWNlRHJpdmVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcm9vdDtcbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByb290ID0gc2VsZjtcbn1cbmVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IHdpbmRvdztcbn1cbmVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IGdsb2JhbDtcbn1cbmVsc2Uge1xuICAgIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxudmFyIFN5bWJvbCA9IHJvb3QuU3ltYm9sO1xudmFyIHBhcmVudFN5bWJvbDtcbmlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcGFyZW50U3ltYm9sID0gU3ltYm9sKCdwYXJlbnQnKTtcbn1cbmVsc2Uge1xuICAgIHBhcmVudFN5bWJvbCA9ICdAQHNuYWJiZG9tLXNlbGVjdG9yLXBhcmVudCc7XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBwYXJlbnRTeW1ib2w7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wYXJlbnQtc3ltYm9sLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9wb255ZmlsbCA9IHJlcXVpcmUoJy4vcG9ueWZpbGwuanMnKTtcblxudmFyIF9wb255ZmlsbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wb255ZmlsbCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIHJvb3Q7IC8qIGdsb2JhbCB3aW5kb3cgKi9cblxuXG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gbW9kdWxlO1xufSBlbHNlIHtcbiAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG5cbnZhciByZXN1bHQgPSAoMCwgX3BvbnlmaWxsMlsnZGVmYXVsdCddKShyb290KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHJlc3VsdDsiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbVwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBhY3Rpb25fMSA9IHJlcXVpcmUoXCJAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb25cIik7XG52YXIgU3RhdGU7XG4oZnVuY3Rpb24gKFN0YXRlKSB7XG4gICAgU3RhdGVbXCJSVU5OSU5HXCJdID0gXCJSVU5OSU5HXCI7XG4gICAgU3RhdGVbXCJET05FXCJdID0gXCJET05FXCI7XG4gICAgU3RhdGVbXCJQUkVFTVBUSU5HXCJdID0gXCJQUkVFTVBUSU5HXCI7XG59KShTdGF0ZSB8fCAoU3RhdGUgPSB7fSkpO1xudmFyIElucHV0VHlwZTtcbihmdW5jdGlvbiAoSW5wdXRUeXBlKSB7XG4gICAgSW5wdXRUeXBlW1wiR09BTFwiXSA9IFwiR09BTFwiO1xuICAgIElucHV0VHlwZVtcIkNBTkNFTFwiXSA9IFwiQ0FOQ0VMXCI7XG4gICAgSW5wdXRUeXBlW1wiU1RBUlRcIl0gPSBcIlNUQVJUXCI7XG4gICAgSW5wdXRUeXBlW1wiRU5EXCJdID0gXCJFTkRcIjtcbiAgICBJbnB1dFR5cGVbXCJFUlJPUlwiXSA9IFwiRVJST1JcIjtcbiAgICBJbnB1dFR5cGVbXCJSRVNVTFRcIl0gPSBcIlJFU1VMVFwiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xuO1xuZnVuY3Rpb24gaW5wdXQoZ29hbCQsIHN0YXJ0RXZlbnQkLCBlbmRFdmVudCQsIGVycm9yRXZlbnQkLCByZXN1bHRFdmVudCQpIHtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoZ29hbCQuZmlsdGVyKGZ1bmN0aW9uIChnb2FsKSB7IHJldHVybiB0eXBlb2YgZ29hbCAhPT0gJ3VuZGVmaW5lZCc7IH0pLm1hcChmdW5jdGlvbiAoZ29hbCkge1xuICAgICAgICBpZiAoZ29hbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBJbnB1dFR5cGUuQ0FOQ0VMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogSW5wdXRUeXBlLkdPQUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICEhZ29hbC5nb2FsX2lkID8gZ29hbCA6IGFjdGlvbl8xLmluaXRHb2FsKGdvYWwpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pLCBzdGFydEV2ZW50JC5tYXBUbyh7IHR5cGU6IElucHV0VHlwZS5TVEFSVCwgdmFsdWU6IG51bGwgfSksIGVuZEV2ZW50JC5tYXBUbyh7IHR5cGU6IElucHV0VHlwZS5FTkQsIHZhbHVlOiBudWxsIH0pLCBlcnJvckV2ZW50JC5tYXAoZnVuY3Rpb24gKGV2ZW50KSB7IHJldHVybiAoeyB0eXBlOiBJbnB1dFR5cGUuRVJST1IsIHZhbHVlOiBldmVudCB9KTsgfSksIHJlc3VsdEV2ZW50JC5tYXAoZnVuY3Rpb24gKGV2ZW50KSB7IHJldHVybiAoeyB0eXBlOiBJbnB1dFR5cGUuUkVTVUxULCB2YWx1ZTogZXZlbnQgfSk7IH0pKTtcbn1cbnZhciB0cmFuc2l0aW9uVGFibGUgPSAoX2EgPSB7fSxcbiAgICBfYVtTdGF0ZS5ET05FXSA9IChfYiA9IHt9LFxuICAgICAgICBfYltJbnB1dFR5cGUuR09BTF0gPSBTdGF0ZS5SVU5OSU5HLFxuICAgICAgICBfYiksXG4gICAgX2FbU3RhdGUuUlVOTklOR10gPSAoX2MgPSB7fSxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkdPQUxdID0gU3RhdGUuUFJFRU1QVElORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkNBTkNFTF0gPSBTdGF0ZS5QUkVFTVBUSU5HLFxuICAgICAgICBfY1tJbnB1dFR5cGUuU1RBUlRdID0gU3RhdGUuUlVOTklORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkVORF0gPSBTdGF0ZS5ET05FLFxuICAgICAgICBfYyksXG4gICAgX2FbU3RhdGUuUFJFRU1QVElOR10gPSAoX2QgPSB7fSxcbiAgICAgICAgX2RbSW5wdXRUeXBlLkVORF0gPSBTdGF0ZS5ET05FLFxuICAgICAgICBfZCksXG4gICAgX2EpO1xuZnVuY3Rpb24gdHJhbnNpdGlvbihwcmV2U3RhdGUsIHByZXZWYXJpYWJsZXMsIGlucHV0KSB7XG4gICAgdmFyIHN0YXRlcyA9IHRyYW5zaXRpb25UYWJsZVtwcmV2U3RhdGVdO1xuICAgIGlmICghc3RhdGVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcHJldlN0YXRlPVxcXCJcIiArIHByZXZTdGF0ZSArIFwiXFxcIlwiKTtcbiAgICB9XG4gICAgdmFyIHN0YXRlID0gc3RhdGVzW2lucHV0LnR5cGVdO1xuICAgIGlmICghc3RhdGUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlVuZGVmaW5lZCB0cmFuc2l0aW9uIGZvciBcXFwiXCIgKyBwcmV2U3RhdGUgKyBcIlxcXCIgXFxcIlwiICsgaW5wdXQudHlwZSArIFwiXFxcIjsgXCJcbiAgICAgICAgICAgICsgXCJzZXQgc3RhdGUgdG8gcHJldlN0YXRlXCIpO1xuICAgICAgICBzdGF0ZSA9IHByZXZTdGF0ZTtcbiAgICB9XG4gICAgaWYgKHByZXZTdGF0ZSA9PT0gU3RhdGUuRE9ORSAmJiBzdGF0ZSA9PT0gU3RhdGUuUlVOTklORykge1xuICAgICAgICAvLyBTdGFydCBhIG5ldyBnb2FsXG4gICAgICAgIHZhciBnb2FsID0gaW5wdXQudmFsdWU7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBnb2FsLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgdHJhbnNjcmlwdDogbnVsbCxcbiAgICAgICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICBhcmdzOiBnb2FsLmdvYWxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyAmJiBzdGF0ZSA9PT0gU3RhdGUuUlVOTklORykge1xuICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLlJFU1VMVCkge1xuICAgICAgICAgICAgdmFyIGV2ZW50XzEgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgICAgIHZhciBsYXN0ID0gZXZlbnRfMS5yZXN1bHRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB2YXIgdHJhbnNjcmlwdCA9IGV2ZW50XzEucmVzdWx0c1tsYXN0XVswXS50cmFuc2NyaXB0O1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBfX2Fzc2lnbih7fSwgcHJldlZhcmlhYmxlcywgeyB0cmFuc2NyaXB0OiB0cmFuc2NyaXB0IH0pLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuRVJST1IpIHtcbiAgICAgICAgICAgIHZhciBldmVudF8yID0gaW5wdXQudmFsdWU7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IF9fYXNzaWduKHt9LCBwcmV2VmFyaWFibGVzLCB7IGVycm9yOiBldmVudF8yLmVycm9yIH0pLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChzdGF0ZSA9PT0gU3RhdGUuRE9ORSkge1xuICAgICAgICBpZiAocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HIHx8IHByZXZTdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORykge1xuICAgICAgICAgICAgLy8gU3RvcCB0aGUgY3VycmVudCBnb2FsIGFuZCBzdGFydCB0aGUgcXVldWVkIG5ldyBnb2FsXG4gICAgICAgICAgICB2YXIgbmV3R29hbCA9IHByZXZWYXJpYWJsZXMubmV3R29hbDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6ICEhbmV3R29hbCA/IFN0YXRlLlJVTk5JTkcgOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogISFuZXdHb2FsID8gbmV3R29hbC5nb2FsX2lkIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNjcmlwdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiAhIW5ld0dvYWwgPyB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IG5ld0dvYWwuZ29hbCxcbiAgICAgICAgICAgICAgICB9IDogbnVsbCxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBwcmV2VmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgJiYgIXByZXZWYXJpYWJsZXMuZXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVEXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAoISFwcmV2VmFyaWFibGVzLmVycm9yKSA/IGFjdGlvbl8xLlN0YXR1cy5BQk9SVEVEIDogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiAocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HICYmICFwcmV2VmFyaWFibGVzLmVycm9yKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyAocHJldlZhcmlhYmxlcy50cmFuc2NyaXB0IHx8ICcnKSAvLyAnJyBmb3Igbm9uLXNwZWVjaCBpbnB1dHNcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICgocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HIHx8IHByZXZTdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORylcbiAgICAgICAgJiYgc3RhdGUgPT09IFN0YXRlLlBSRUVNUFRJTkcpIHtcbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5HT0FMIHx8IGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5DQU5DRUwpIHtcbiAgICAgICAgICAgIC8vIFN0YXJ0IHN0b3BwaW5nIHRoZSBjdXJyZW50IGdvYWwgYW5kIHF1ZXVlIGEgbmV3IGdvYWwgaWYgcmVjZWl2ZWQgb25lXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IF9fYXNzaWduKHt9LCBwcmV2VmFyaWFibGVzLCB7IG5ld0dvYWw6IGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5HT0FMID8gaW5wdXQudmFsdWUgOiBudWxsIH0pLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyA/IHtcbiAgICAgICAgICAgICAgICAgICAgYXJnczogbnVsbCxcbiAgICAgICAgICAgICAgICB9IDogbnVsbCxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXRlOiBwcmV2U3RhdGUsXG4gICAgICAgIHZhcmlhYmxlczogcHJldlZhcmlhYmxlcyxcbiAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgIH07XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gaW5pdFJlZHVjZXIocHJldikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgIHRyYW5zY3JpcHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciBpbnB1dFJlZHVjZXIkID0gaW5wdXQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiBpbnB1dFJlZHVjZXIocHJldikge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihwcmV2LnN0YXRlLCBwcmV2LnZhcmlhYmxlcywgaW5wdXQpO1xuICAgIH07IH0pO1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbml0UmVkdWNlciQsIGlucHV0UmVkdWNlciQpO1xufVxuLyoqXG4gKiBXZWIgU3BlZWNoIEFQSSdzIFtTcGVlY2hSZWNvZ25pdGlvbl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFJlY29nbml0aW9uKVxuICogYWN0aW9uIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gc291cmNlc1xuICpcbiAqICAgKiBnb2FsOiBhIHN0cmVhbSBvZiBgbnVsbGAgKGFzIFwiY2FuY2VsXCIpIG9yIGBTcGVlY2hSZWNvZ25pdGlvbmBcbiAqICAgICBwcm9wZXJ0aWVzIChhcyBcImdvYWxcIikuXG4gKiAgICogU3BlZWNoU3ludGhlc2lzOiBgRXZlbnRTb3VyY2VgIGZvciBgc3RhcnRgLCBgZW5kYCwgYGVycm9yYCwgYHJlc3VsdGBcbiAqICAgICBldmVudHMuXG4gKlxuICogQHJldHVybiBzaW5rc1xuICpcbiAqICAgKiBvdXRwdXQ6IGEgc3RyZWFtIGZvciB0aGUgU3BlZWNoUmVjb2duaXRpb24gZHJpdmVyIGlucHV0LlxuICogICAqIHJlc3VsdDogYSBzdHJlYW0gb2YgYWN0aW9uIHJlc3VsdHMuIGByZXN1bHQucmVzdWx0YCBpcyBhIHRyYW5zY3JpcHQgZnJvbVxuICogICAgIHRoZSByZWNvZ25pdGlvbjsgaXQgd2lsbCBiZSBgJydgIGZvciBub24tc3BlZWNoIGlucHV0cy5cbiAqXG4gKi9cbmZ1bmN0aW9uIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uKHNvdXJjZXMpIHtcbiAgICB2YXIgaW5wdXQkID0gaW5wdXQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5nb2FsKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5TcGVlY2hSZWNvZ25pdGlvbi5ldmVudHMoJ3N0YXJ0JykpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uLmV2ZW50cygnZW5kJykpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uLmV2ZW50cygnZXJyb3InKSksIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb24uZXZlbnRzKCdyZXN1bHQnKSkpO1xuICAgIHZhciBzdGF0ZSQgPSB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpXG4gICAgICAgIC5mb2xkKGZ1bmN0aW9uIChzdGF0ZSwgcmVkdWNlcikgeyByZXR1cm4gcmVkdWNlcihzdGF0ZSk7IH0sIG51bGwpXG4gICAgICAgIC5kcm9wKDEpOyAvLyBkcm9wIFwibnVsbFwiXG4gICAgdmFyIG91dHB1dHMkID0gc3RhdGUkLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuIHN0YXRlLm91dHB1dHM7IH0pXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuICEhb3V0cHV0czsgfSk7XG4gICAgdmFyIHJlc3VsdCQgPSBzdGF0ZSQubWFwKGZ1bmN0aW9uIChzdGF0ZSkgeyByZXR1cm4gc3RhdGUucmVzdWx0OyB9KS5maWx0ZXIoZnVuY3Rpb24gKHJlc3VsdCkgeyByZXR1cm4gISFyZXN1bHQ7IH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIG91dHB1dDogYWRhcHRfMS5hZGFwdChvdXRwdXRzJC5tYXAoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIG91dHB1dHMuYXJnczsgfSkpLFxuICAgICAgICByZXN1bHQ6IGFkYXB0XzEuYWRhcHQocmVzdWx0JCksXG4gICAgfTtcbn1cbmV4cG9ydHMuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24gPSBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjtcbnZhciBfYSwgX2IsIF9jLCBfZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNwZWVjaFJlY29nbml0aW9uQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtXCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciBTdGF0ZTtcbihmdW5jdGlvbiAoU3RhdGUpIHtcbiAgICBTdGF0ZVtcIlJVTk5JTkdcIl0gPSBcIlJVTk5JTkdcIjtcbiAgICBTdGF0ZVtcIkRPTkVcIl0gPSBcIkRPTkVcIjtcbiAgICBTdGF0ZVtcIlBSRUVNUFRJTkdcIl0gPSBcIlBSRUVNUFRJTkdcIjtcbn0pKFN0YXRlIHx8IChTdGF0ZSA9IHt9KSk7XG52YXIgSW5wdXRUeXBlO1xuKGZ1bmN0aW9uIChJbnB1dFR5cGUpIHtcbiAgICBJbnB1dFR5cGVbXCJHT0FMXCJdID0gXCJHT0FMXCI7XG4gICAgSW5wdXRUeXBlW1wiQ0FOQ0VMXCJdID0gXCJDQU5DRUxcIjtcbiAgICBJbnB1dFR5cGVbXCJTVEFSVFwiXSA9IFwiU1RBUlRcIjtcbiAgICBJbnB1dFR5cGVbXCJFTkRcIl0gPSBcIkVORFwiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xuO1xuZnVuY3Rpb24gaW5wdXQoZ29hbCQsIHN0YXJ0RXZlbnQkLCBlbmRFdmVudCQpIHtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoZ29hbCQuZmlsdGVyKGZ1bmN0aW9uIChnb2FsKSB7IHJldHVybiB0eXBlb2YgZ29hbCAhPT0gJ3VuZGVmaW5lZCc7IH0pLm1hcChmdW5jdGlvbiAoZ29hbCkge1xuICAgICAgICBpZiAoZ29hbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBJbnB1dFR5cGUuQ0FOQ0VMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9ICEhZ29hbC5nb2FsX2lkID8gZ29hbCA6IGFjdGlvbl8xLmluaXRHb2FsKGdvYWwpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBJbnB1dFR5cGUuR09BTCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogdHlwZW9mIHZhbHVlLmdvYWwgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IHsgdGV4dDogdmFsdWUuZ29hbCB9LFxuICAgICAgICAgICAgICAgICAgICB9IDogdmFsdWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSksIHN0YXJ0RXZlbnQkLm1hcFRvKHsgdHlwZTogSW5wdXRUeXBlLlNUQVJULCB2YWx1ZTogbnVsbCB9KSwgZW5kRXZlbnQkLm1hcFRvKHsgdHlwZTogSW5wdXRUeXBlLkVORCwgdmFsdWU6IG51bGwgfSkpO1xufVxudmFyIHRyYW5zaXRpb25UYWJsZSA9IChfYSA9IHt9LFxuICAgIF9hW1N0YXRlLkRPTkVdID0gKF9iID0ge30sXG4gICAgICAgIF9iW0lucHV0VHlwZS5HT0FMXSA9IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgIF9iKSxcbiAgICBfYVtTdGF0ZS5SVU5OSU5HXSA9IChfYyA9IHt9LFxuICAgICAgICBfY1tJbnB1dFR5cGUuR09BTF0gPSBTdGF0ZS5QUkVFTVBUSU5HLFxuICAgICAgICBfY1tJbnB1dFR5cGUuQ0FOQ0VMXSA9IFN0YXRlLlBSRUVNUFRJTkcsXG4gICAgICAgIF9jW0lucHV0VHlwZS5TVEFSVF0gPSBTdGF0ZS5SVU5OSU5HLFxuICAgICAgICBfY1tJbnB1dFR5cGUuRU5EXSA9IFN0YXRlLkRPTkUsXG4gICAgICAgIF9jKSxcbiAgICBfYVtTdGF0ZS5QUkVFTVBUSU5HXSA9IChfZCA9IHt9LFxuICAgICAgICBfZFtJbnB1dFR5cGUuRU5EXSA9IFN0YXRlLkRPTkUsXG4gICAgICAgIF9kKSxcbiAgICBfYSk7XG5mdW5jdGlvbiB0cmFuc2l0aW9uKHByZXZTdGF0ZSwgcHJldlZhcmlhYmxlcywgaW5wdXQpIHtcbiAgICB2YXIgc3RhdGVzID0gdHJhbnNpdGlvblRhYmxlW3ByZXZTdGF0ZV07XG4gICAgaWYgKCFzdGF0ZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBwcmV2U3RhdGU9XFxcIlwiICsgcHJldlN0YXRlICsgXCJcXFwiXCIpO1xuICAgIH1cbiAgICB2YXIgc3RhdGUgPSBzdGF0ZXNbaW5wdXQudHlwZV07XG4gICAgaWYgKCFzdGF0ZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiVW5kZWZpbmVkIHRyYW5zaXRpb24gZm9yIFxcXCJcIiArIHByZXZTdGF0ZSArIFwiXFxcIiBcXFwiXCIgKyBpbnB1dC50eXBlICsgXCJcXFwiOyBcIlxuICAgICAgICAgICAgKyBcInNldCBzdGF0ZSB0byBwcmV2U3RhdGVcIik7XG4gICAgICAgIHN0YXRlID0gcHJldlN0YXRlO1xuICAgIH1cbiAgICBpZiAocHJldlN0YXRlID09PSBTdGF0ZS5ET05FICYmIHN0YXRlID09PSBTdGF0ZS5SVU5OSU5HKSB7XG4gICAgICAgIC8vIFN0YXJ0IGEgbmV3IGdvYWxcbiAgICAgICAgdmFyIGdvYWwgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGdvYWwuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICBhcmdzOiBnb2FsLmdvYWxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKHN0YXRlID09PSBTdGF0ZS5ET05FKSB7XG4gICAgICAgIGlmIChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgfHwgcHJldlN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKSB7XG4gICAgICAgICAgICAvLyBTdG9wIHRoZSBjdXJyZW50IGdvYWwgYW5kIHN0YXJ0IHRoZSBxdWV1ZWQgbmV3IGdvYWxcbiAgICAgICAgICAgIHZhciBuZXdHb2FsID0gcHJldlZhcmlhYmxlcy5uZXdHb2FsO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogISFuZXdHb2FsID8gU3RhdGUuUlVOTklORyA6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiAhIW5ld0dvYWwgPyBuZXdHb2FsLmdvYWxfaWQgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czogISFuZXdHb2FsID8ge1xuICAgICAgICAgICAgICAgICAgICBhcmdzOiBuZXdHb2FsLmdvYWwsXG4gICAgICAgICAgICAgICAgfSA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldlZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQgOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoKHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyB8fCBwcmV2U3RhdGUgPT09IFN0YXRlLlBSRUVNUFRJTkcpXG4gICAgICAgICYmIHN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKSB7XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuR09BTCB8fCBpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuQ0FOQ0VMKSB7XG4gICAgICAgICAgICAvLyBTdGFydCBzdG9wcGluZyB0aGUgY3VycmVudCBnb2FsIGFuZCBxdWV1ZSBhIG5ldyBnb2FsIGlmIHJlY2VpdmVkIG9uZVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBfX2Fzc2lnbih7fSwgcHJldlZhcmlhYmxlcywgeyBuZXdHb2FsOiBpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuR09BTCA/IGlucHV0LnZhbHVlIDogbnVsbCB9KSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuU1RBUlQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogcHJldlZhcmlhYmxlcyxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXRlOiBwcmV2U3RhdGUsXG4gICAgICAgIHZhcmlhYmxlczogcHJldlZhcmlhYmxlcyxcbiAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgIH07XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gaW5pdFJlZHVjZXIocHJldikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICB2YXIgaW5wdXRSZWR1Y2VyJCA9IGlucHV0JFxuICAgICAgICAubWFwKGZ1bmN0aW9uIChpbnB1dCkgeyByZXR1cm4gZnVuY3Rpb24gaW5wdXRSZWR1Y2VyKHByZXYpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24ocHJldi5zdGF0ZSwgcHJldi52YXJpYWJsZXMsIGlucHV0KTtcbiAgICB9OyB9KTtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoaW5pdFJlZHVjZXIkLCBpbnB1dFJlZHVjZXIkKTtcbn1cbi8qKlxuICogV2ViIFNwZWVjaCBBUEkncyBbU3BlZWNoU3ludGhlc2lzXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoU3ludGhlc2lzKVxuICogYWN0aW9uIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gc291cmNlc1xuICpcbiAqICAgKiBnb2FsOiBhIHN0cmVhbSBvZiBgbnVsbGAgKGFzIFwiY2FuY2VsXCIpIG9yIGBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VgXG4gKiAgICAgcHJvcGVydGllcyAoYXMgXCJnb2FsXCIpLlxuICogICAqIFNwZWVjaFN5bnRoZXNpczogYEV2ZW50U291cmNlYCBmb3IgYHN0YXJ0YCBhbmQgYGVuZGAgZXZlbnRzLlxuICpcbiAqIEByZXR1cm4gc2lua3NcbiAqXG4gKiAgICogb3V0cHV0OiBhIHN0cmVhbSBmb3IgdGhlIFNwZWVjaFN5bnRoZXNpcyBkcml2ZXIgaW5wdXQuXG4gKiAgICogcmVzdWx0OiBhIHN0cmVhbSBvZiBhY3Rpb24gcmVzdWx0cy4gYHJlc3VsdC5yZXN1bHRgIGlzIGFsd2F5cyBgbnVsbGAuXG4gKlxuICovXG5mdW5jdGlvbiBTcGVlY2hTeW50aGVzaXNBY3Rpb24oc291cmNlcykge1xuICAgIHZhciBpbnB1dCQgPSBpbnB1dCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLmdvYWwpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFN5bnRoZXNpcy5ldmVudHMoJ3N0YXJ0JykpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFN5bnRoZXNpcy5ldmVudHMoJ2VuZCcpKSk7XG4gICAgdmFyIHN0YXRlJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSk7IC8vIGRyb3AgXCJudWxsXCJcbiAgICB2YXIgb3V0cHV0cyQgPSBzdGF0ZSQubWFwKGZ1bmN0aW9uIChzdGF0ZSkgeyByZXR1cm4gc3RhdGUub3V0cHV0czsgfSlcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzOyB9KTtcbiAgICB2YXIgcmVzdWx0JCA9IHN0YXRlJC5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiBzdGF0ZS5yZXN1bHQ7IH0pLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7IHJldHVybiAhIXJlc3VsdDsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb3V0cHV0OiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5hcmdzOyB9KSksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChyZXN1bHQkKSxcbiAgICB9O1xufVxuZXhwb3J0cy5TcGVlY2hTeW50aGVzaXNBY3Rpb24gPSBTcGVlY2hTeW50aGVzaXNBY3Rpb247XG52YXIgX2EsIF9iLCBfYywgX2Q7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TcGVlY2hTeW50aGVzaXNBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlcl8xID0gcmVxdWlyZShcIi4vbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlclwiKTtcbmV4cG9ydHMubWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlciA9IG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXJfMS5tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyO1xudmFyIFNwZWVjaFN5bnRoZXNpc0FjdGlvbl8xID0gcmVxdWlyZShcIi4vU3BlZWNoU3ludGhlc2lzQWN0aW9uXCIpO1xuZXhwb3J0cy5TcGVlY2hTeW50aGVzaXNBY3Rpb24gPSBTcGVlY2hTeW50aGVzaXNBY3Rpb25fMS5TcGVlY2hTeW50aGVzaXNBY3Rpb247XG52YXIgbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyXzEgPSByZXF1aXJlKFwiLi9tYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXJcIik7XG5leHBvcnRzLm1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlciA9IG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcl8xLm1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcjtcbnZhciBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbl8xID0gcmVxdWlyZShcIi4vU3BlZWNoUmVjb2duaXRpb25BY3Rpb25cIik7XG5leHBvcnRzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uID0gU3BlZWNoUmVjb2duaXRpb25BY3Rpb25fMS5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGZyb21FdmVudF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2Zyb21FdmVudFwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBSZWNvZ25pdGlvblNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZWNvZ25pdGlvblNvdXJjZShfcmVjb2duaXRpb24pIHtcbiAgICAgICAgdGhpcy5fcmVjb2duaXRpb24gPSBfcmVjb2duaXRpb247XG4gICAgfVxuICAgIFJlY29nbml0aW9uU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KGZyb21FdmVudF8xLmRlZmF1bHQodGhpcy5fcmVjb2duaXRpb24sIGV2ZW50TmFtZSkpO1xuICAgIH07XG4gICAgcmV0dXJuIFJlY29nbml0aW9uU291cmNlO1xufSgpKTtcbi8qKlxuICogV2ViIFNwZWVjaCBBUEkncyBbU3BlZWNoUmVjb2duaXRpb25dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hSZWNvZ25pdGlvbilcbiAqIGRyaXZlciBmYWN0b3J5LlxuICpcbiAqIEByZXR1cm4ge0RyaXZlcn0gdGhlIFNwZWVjaFJlY29nbml0aW9uIEN5Y2xlLmpzIGRyaXZlciBmdW5jdGlvbi4gSXQgdGFrZXMgYVxuICogICBzdHJlYW0gb2Ygb2JqZWN0cyBjb250YWluaW5nIFtgU3BlZWNoUmVjb2duaXRpb25gIHByb3BlcnRpZXNdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hSZWNvZ25pdGlvbiNQcm9wZXJ0aWVzKVxuICogICBhbmQgcmV0dXJucyBhIGBFdmVudFNvdXJjZWA6XG4gKlxuICogICAqIGBFdmVudFNvdXJjZS5ldmVudHMoZXZlbnROYW1lKWAgcmV0dXJucyBhIHN0cmVhbSBvZiBgZXZlbnROYW1lYFxuICogICAgIGV2ZW50cyBmcm9tIFtgU3BlZWNoUmVjb2duaXRpb25gXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoUmVjb2duaXRpb24jRXZlbnRfaGFuZGxlcnMpLlxuICovXG5mdW5jdGlvbiBtYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXIoKSB7XG4gICAgdmFyIHJlY29nbml0aW9uID0gbmV3IHdlYmtpdFNwZWVjaFJlY29nbml0aW9uKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzaW5rJCkge1xuICAgICAgICBzaW5rJC5hZGRMaXN0ZW5lcih7XG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgIC8vIGFycmF5IHZhbHVlcyBhcmUgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlIHByb3BlcnRpZXMgdGhhdCBhcmUgbm90XG4gICAgICAgICAgICAgICAgLy8gICBldmVudCBoYW5kbGVyczsgc2VlXG4gICAgICAgICAgICAgICAgLy8gICBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoUmVjb2duaXRpb25cbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjb2duaXRpb24uYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFsnbGFuZycsICdjb250aW51b3VzJywgJ2ludGVyaW1SZXN1bHRzJywgJ21heEFsdGVybmF0aXZlcycsICdzZXJ2aWNlVVJJJ10ubWFwKGZ1bmN0aW9uIChhcmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmcgaW4gYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY29nbml0aW9uW2FyZ10gPSBhcmdzW2FyZ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZWNvZ25pdGlvbi5zdGFydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXcgUmVjb2duaXRpb25Tb3VyY2UocmVjb2duaXRpb24pO1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlciA9IG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBmcm9tRXZlbnRfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbS9leHRyYS9mcm9tRXZlbnRcIikpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgVXR0ZXJhbmNlU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFV0dGVyYW5jZVNvdXJjZShfdXR0ZXJhbmNlKSB7XG4gICAgICAgIHRoaXMuX3V0dGVyYW5jZSA9IF91dHRlcmFuY2U7XG4gICAgfVxuICAgIFV0dGVyYW5jZVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdChmcm9tRXZlbnRfMS5kZWZhdWx0KHRoaXMuX3V0dGVyYW5jZSwgZXZlbnROYW1lKSk7XG4gICAgfTtcbiAgICByZXR1cm4gVXR0ZXJhbmNlU291cmNlO1xufSgpKTtcbi8qKlxuICogV2ViIFNwZWVjaCBBUEkncyBbU3BlZWNoU3ludGhlc2lzXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoU3ludGhlc2lzKVxuICogZHJpdmVyIGZhY3RvcnkuXG4gKlxuICogQHJldHVybiB7RHJpdmVyfSB0aGUgU3BlZWNoU3ludGhlc2lzIEN5Y2xlLmpzIGRyaXZlciBmdW5jdGlvbi4gSXQgdGFrZXMgYVxuICogICBzdHJlYW0gb2Ygb2JqZWN0cyBjb250YWluaW5nIFtgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlYCBwcm9wZXJ0aWVzXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlI1Byb3BlcnRpZXMpXG4gKiAgIGFuZCByZXR1cm5zIGEgYEV2ZW50U291cmNlYDpcbiAqXG4gKiAgICogYEV2ZW50U291cmNlLmV2ZW50cyhldmVudE5hbWUpYCByZXR1cm5zIGEgc3RyZWFtIG9mICBgZXZlbnROYW1lYFxuICogICAgIGV2ZW50cyBmcm9tIFtgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSNFdmVudF9oYW5kbGVycykuXG4gKi9cbmZ1bmN0aW9uIG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIoKSB7XG4gICAgdmFyIHN5bnRoZXNpcyA9IHdpbmRvdy5zcGVlY2hTeW50aGVzaXM7XG4gICAgdmFyIHV0dGVyYW5jZSA9IG5ldyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UoKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHNpbmskKSB7XG4gICAgICAgIHNpbmskLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgLy8gYXJyYXkgdmFsdWVzIGFyZSBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UgcHJvcGVydGllcyB0aGF0IGFyZSBub3RcbiAgICAgICAgICAgICAgICAvLyAgIGV2ZW50IGhhbmRsZXJzOyBzZWVcbiAgICAgICAgICAgICAgICAvLyAgIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgc3ludGhlc2lzLmNhbmNlbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgWydsYW5nJywgJ3BpdGNoJywgJ3JhdGUnLCAndGV4dCcsICd2b2ljZScsICd2b2x1bWUnXS5tYXAoZnVuY3Rpb24gKGFyZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZyBpbiBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXR0ZXJhbmNlW2FyZ10gPSBhcmdzW2FyZ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzeW50aGVzaXMuc3BlYWsodXR0ZXJhbmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmV3IFV0dGVyYW5jZVNvdXJjZSh1dHRlcmFuY2UpO1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIgPSBtYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICB2YXIgZ2xvYmFsT2JqO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IGdsb2JhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHRoaXM7XG4gICAgfVxuICAgIGdsb2JhbE9iai5DeWNsZWpzID0gZ2xvYmFsT2JqLkN5Y2xlanMgfHwge307XG4gICAgZ2xvYmFsT2JqID0gZ2xvYmFsT2JqLkN5Y2xlanM7XG4gICAgZ2xvYmFsT2JqLmFkYXB0U3RyZWFtID0gZ2xvYmFsT2JqLmFkYXB0U3RyZWFtIHx8IChmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XG4gICAgcmV0dXJuIGdsb2JhbE9iajtcbn1cbmZ1bmN0aW9uIHNldEFkYXB0KGYpIHtcbiAgICBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbSA9IGY7XG59XG5leHBvcnRzLnNldEFkYXB0ID0gc2V0QWRhcHQ7XG5mdW5jdGlvbiBhZGFwdChzdHJlYW0pIHtcbiAgICByZXR1cm4gZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0oc3RyZWFtKTtcbn1cbmV4cG9ydHMuYWRhcHQgPSBhZGFwdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFkYXB0LmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9wb255ZmlsbCA9IHJlcXVpcmUoJy4vcG9ueWZpbGwuanMnKTtcblxudmFyIF9wb255ZmlsbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wb255ZmlsbCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIHJvb3Q7IC8qIGdsb2JhbCB3aW5kb3cgKi9cblxuXG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gbW9kdWxlO1xufSBlbHNlIHtcbiAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG5cbnZhciByZXN1bHQgPSAoMCwgX3BvbnlmaWxsMlsnZGVmYXVsdCddKShyb290KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHJlc3VsdDsiLCIvLy8gPHJlZmVyZW5jZSB0eXBlcz1cIm5vZGVcIiAvPlxuaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cyc7XG5pbXBvcnQge1N0cmVhbSwgSW50ZXJuYWxQcm9kdWNlciwgSW50ZXJuYWxMaXN0ZW5lcn0gZnJvbSAnLi4vaW5kZXgnO1xuXG5leHBvcnQgY2xhc3MgRE9NRXZlbnRQcm9kdWNlciBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8RXZlbnQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbUV2ZW50JztcbiAgcHJpdmF0ZSBsaXN0ZW5lcjogRXZlbnRMaXN0ZW5lciB8IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBub2RlOiBFdmVudFRhcmdldCxcbiAgICAgICAgICAgICAgcHJpdmF0ZSBldmVudFR5cGU6IHN0cmluZyxcbiAgICAgICAgICAgICAgcHJpdmF0ZSB1c2VDYXB0dXJlOiBib29sZWFuKSB7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPEV2ZW50Pikge1xuICAgIHRoaXMubGlzdGVuZXIgPSAoZSkgPT4gb3V0Ll9uKGUpO1xuICAgIHRoaXMubm9kZS5hZGRFdmVudExpc3RlbmVyKHRoaXMuZXZlbnRUeXBlLCB0aGlzLmxpc3RlbmVyLCB0aGlzLnVzZUNhcHR1cmUpO1xuICB9XG5cbiAgX3N0b3AoKSB7XG4gICAgdGhpcy5ub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIodGhpcy5ldmVudFR5cGUsIHRoaXMubGlzdGVuZXIgYXMgYW55LCB0aGlzLnVzZUNhcHR1cmUpO1xuICAgIHRoaXMubGlzdGVuZXIgPSBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlRXZlbnRQcm9kdWNlciBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8YW55PiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21FdmVudCc7XG4gIHByaXZhdGUgbGlzdGVuZXI6IEZ1bmN0aW9uIHwgbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5vZGU6IEV2ZW50RW1pdHRlciwgcHJpdmF0ZSBldmVudE5hbWU6IHN0cmluZykgeyB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+KSB7XG4gICAgdGhpcy5saXN0ZW5lciA9ICguLi5hcmdzOiBBcnJheTxhbnk+KSA9PiB7XG4gICAgICByZXR1cm4gKGFyZ3MubGVuZ3RoID4gMSkgPyBvdXQuX24oYXJncykgOiBvdXQuX24oYXJnc1swXSk7XG4gICAgfTtcbiAgICB0aGlzLm5vZGUuYWRkTGlzdGVuZXIodGhpcy5ldmVudE5hbWUsIHRoaXMubGlzdGVuZXIpO1xuICB9XG5cbiAgX3N0b3AoKSB7XG4gICAgdGhpcy5ub2RlLnJlbW92ZUxpc3RlbmVyKHRoaXMuZXZlbnROYW1lLCB0aGlzLmxpc3RlbmVyIGFzIGFueSk7XG4gICAgdGhpcy5saXN0ZW5lciA9IG51bGw7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNFbWl0dGVyKGVsZW1lbnQ6IGFueSk6IGVsZW1lbnQgaXMgRXZlbnRFbWl0dGVyIHtcbiAgcmV0dXJuIGVsZW1lbnQuZW1pdCAmJiBlbGVtZW50LmFkZExpc3RlbmVyO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBzdHJlYW0gYmFzZWQgb24gZWl0aGVyOlxuICogLSBET00gZXZlbnRzIHdpdGggdGhlIG5hbWUgYGV2ZW50TmFtZWAgZnJvbSBhIHByb3ZpZGVkIHRhcmdldCBub2RlXG4gKiAtIEV2ZW50cyB3aXRoIHRoZSBuYW1lIGBldmVudE5hbWVgIGZyb20gYSBwcm92aWRlZCBOb2RlSlMgRXZlbnRFbWl0dGVyXG4gKlxuICogV2hlbiBjcmVhdGluZyBhIHN0cmVhbSBmcm9tIEV2ZW50RW1pdHRlcnMsIGlmIHRoZSBzb3VyY2UgZXZlbnQgaGFzIG1vcmUgdGhhblxuICogb25lIGFyZ3VtZW50IGFsbCB0aGUgYXJndW1lbnRzIHdpbGwgYmUgYWdncmVnYXRlZCBpbnRvIGFuIGFycmF5IGluIHRoZVxuICogcmVzdWx0IHN0cmVhbS5cbiAqXG4gKiAoVGlwOiB3aGVuIHVzaW5nIHRoaXMgZmFjdG9yeSB3aXRoIFR5cGVTY3JpcHQsIHlvdSB3aWxsIG5lZWQgdHlwZXMgZm9yXG4gKiBOb2RlLmpzIGJlY2F1c2UgZnJvbUV2ZW50IGtub3dzIGhvdyB0byBoYW5kbGUgYm90aCBET00gZXZlbnRzIGFuZCBOb2RlLmpzXG4gKiBFdmVudEVtaXR0ZXIuIEp1c3QgaW5zdGFsbCBgQHR5cGVzL25vZGVgKVxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqICAgZnJvbUV2ZW50KGVsZW1lbnQsIGV2ZW50TmFtZSlcbiAqIC0tLWV2LS1ldi0tLS1ldi0tLS0tLS0tLS0tLS0tLVxuICogYGBgXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBmcm9tRXZlbnQgZnJvbSAneHN0cmVhbS9leHRyYS9mcm9tRXZlbnQnXG4gKlxuICogY29uc3Qgc3RyZWFtID0gZnJvbUV2ZW50KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idXR0b24nKSwgJ2NsaWNrJylcbiAqICAgLm1hcFRvKCdCdXR0b24gY2xpY2tlZCEnKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAnQnV0dG9uIGNsaWNrZWQhJ1xuICogPiAnQnV0dG9uIGNsaWNrZWQhJ1xuICogPiAnQnV0dG9uIGNsaWNrZWQhJ1xuICogYGBgXG4gKlxuICogYGBganNcbiAqIGltcG9ydCBmcm9tRXZlbnQgZnJvbSAneHN0cmVhbS9leHRyYS9mcm9tRXZlbnQnXG4gKiBpbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJ1xuICpcbiAqIGNvbnN0IE15RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICogY29uc3Qgc3RyZWFtID0gZnJvbUV2ZW50KE15RW1pdHRlciwgJ2ZvbycpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKlxuICogTXlFbWl0dGVyLmVtaXQoJ2ZvbycsICdiYXInKVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAnYmFyJ1xuICogYGBgXG4gKlxuICogYGBganNcbiAqIGltcG9ydCBmcm9tRXZlbnQgZnJvbSAneHN0cmVhbS9leHRyYS9mcm9tRXZlbnQnXG4gKiBpbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJ1xuICpcbiAqIGNvbnN0IE15RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKVxuICogY29uc3Qgc3RyZWFtID0gZnJvbUV2ZW50KE15RW1pdHRlciwgJ2ZvbycpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKlxuICogTXlFbWl0dGVyLmVtaXQoJ2ZvbycsICdiYXInLCAnYmF6JywgJ2J1enonKVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiBbJ2JhcicsICdiYXonLCAnYnV6eiddXG4gKiBgYGBcbiAqXG4gKiBAZmFjdG9yeSB0cnVlXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEV2ZW50RW1pdHRlcn0gZWxlbWVudCBUaGUgZWxlbWVudCB1cG9uIHdoaWNoIHRvIGxpc3Rlbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWUgVGhlIG5hbWUgb2YgdGhlIGV2ZW50IGZvciB3aGljaCB0byBsaXN0ZW4uXG4gKiBAcGFyYW0ge2Jvb2xlYW4/fSB1c2VDYXB0dXJlIEFuIG9wdGlvbmFsIGJvb2xlYW4gdGhhdCBpbmRpY2F0ZXMgdGhhdCBldmVudHMgb2ZcbiAqIHRoaXMgdHlwZSB3aWxsIGJlIGRpc3BhdGNoZWQgdG8gdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXIgYmVmb3JlIGJlaW5nXG4gKiBkaXNwYXRjaGVkIHRvIGFueSBFdmVudFRhcmdldCBiZW5lYXRoIGl0IGluIHRoZSBET00gdHJlZS4gRGVmYXVsdHMgdG8gZmFsc2UuXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cblxuZnVuY3Rpb24gZnJvbUV2ZW50PFQgPSBhbnk+KGVsZW1lbnQ6IEV2ZW50RW1pdHRlciwgZXZlbnROYW1lOiBzdHJpbmcpOiBTdHJlYW08VD47XG5mdW5jdGlvbiBmcm9tRXZlbnQ8VCBleHRlbmRzIEV2ZW50ID0gRXZlbnQ+KGVsZW1lbnQ6IEV2ZW50VGFyZ2V0LCBldmVudE5hbWU6IHN0cmluZywgdXNlQ2FwdHVyZT86IGJvb2xlYW4pOiBTdHJlYW08VD47XG5cbmZ1bmN0aW9uIGZyb21FdmVudDxUID0gYW55PihlbGVtZW50OiBFdmVudEVtaXR0ZXIgfCBFdmVudFRhcmdldCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBldmVudE5hbWU6IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VDYXB0dXJlOiBib29sZWFuID0gZmFsc2UpOiBTdHJlYW08VD4ge1xuICBpZiAoaXNFbWl0dGVyKGVsZW1lbnQpKSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IE5vZGVFdmVudFByb2R1Y2VyKGVsZW1lbnQsIGV2ZW50TmFtZSkpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBET01FdmVudFByb2R1Y2VyKGVsZW1lbnQsIGV2ZW50TmFtZSwgdXNlQ2FwdHVyZSkgYXMgYW55KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBmcm9tRXZlbnQ7XG4iXX0=

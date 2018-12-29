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
            return ({
                state: S.PEND,
                variables: null,
                outputs: {
                    result: {
                        status: {
                            goal_id: prev.variables.goal_id,
                            status: matched.length > 0 ? action_1.Status.SUCCEEDED : action_1.Status.ABORTED,
                        },
                        result: matched.length > 0
                            ? matched[0] // break the tie here
                            : null,
                    },
                },
            });
        }
        else if (prev.state === S.LISTEN && input.type === SIGType.INVALID_RESPONSE) {
            return {
                state: S.PEND,
                variables: null,
                outputs: {
                    result: {
                        status: {
                            goal_id: prev.variables.goal_id,
                            status: action_1.Status.ABORTED,
                        },
                        result: null,
                    },
                },
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

},{"./fromEvent":27,"@cycle/run/lib/adapt":38,"xstream":81}],17:[function(require,module,exports){
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

},{"./fromEvent":27,"@cycle/run/lib/adapt":38,"xstream":81}],18:[function(require,module,exports){
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

},{"./ScopeChecker":24,"./utils":35}],19:[function(require,module,exports){
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

},{"./ElementFinder":18,"./PriorityQueue":22,"./RemovalSet":23,"./ScopeChecker":24,"./SymbolTree":25,"./fromEvent":27,"./utils":35,"xstream":81}],20:[function(require,module,exports){
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

},{"./SymbolTree":25,"./utils":35}],21:[function(require,module,exports){
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

},{"./BodyDOMSource":16,"./DocumentDOMSource":17,"./ElementFinder":18,"./isolate":30,"@cycle/run/lib/adapt":38}],22:[function(require,module,exports){
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

},{}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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

},{"./utils":35}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

},{"./utils":35,"snabbdom-selector":54,"snabbdom/h":58,"snabbdom/vnode":69}],27:[function(require,module,exports){
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

},{"xstream":81}],28:[function(require,module,exports){
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

},{"snabbdom/h":58}],29:[function(require,module,exports){
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

},{"./MainDOMSource":21,"./hyperscript-helpers":28,"./makeDOMDriver":31,"./mockDOMSource":32,"./thunk":34,"snabbdom/h":58}],30:[function(require,module,exports){
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

},{"./utils":35}],31:[function(require,module,exports){
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

},{"./EventDelegator":19,"./IsolateModule":20,"./MainDOMSource":21,"./VNodeWrapper":26,"./modules":33,"./utils":35,"snabbdom":66,"snabbdom/tovnode":68,"xstream":81,"xstream/extra/concat":77,"xstream/extra/sampleCombine":80}],32:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":38,"xstream":81}],33:[function(require,module,exports){
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

},{"snabbdom/modules/attributes":61,"snabbdom/modules/class":62,"snabbdom/modules/dataset":63,"snabbdom/modules/props":64,"snabbdom/modules/style":65}],34:[function(require,module,exports){
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

},{"snabbdom/h":58}],35:[function(require,module,exports){
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

},{}],36:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"@cycle/run/lib/adapt":37,"dup":10,"xstream":81}],37:[function(require,module,exports){
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

},{}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{}],40:[function(require,module,exports){
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

},{"./internals":41}],41:[function(require,module,exports){
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

},{"./adapt":39,"quicktask":50,"xstream":81}],42:[function(require,module,exports){
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

},{"./pickCombine":45,"./pickMerge":46,"@cycle/isolate":36,"@cycle/run/lib/adapt":48,"xstream":81}],43:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":48,"xstream/extra/dropRepeats":79}],44:[function(require,module,exports){
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

},{"./Collection":42,"./StateSource":43,"./withState":47}],45:[function(require,module,exports){
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

},{"xstream":81}],46:[function(require,module,exports){
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

},{"xstream":81}],47:[function(require,module,exports){
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

},{"./StateSource":43,"quicktask":50,"xstream":81,"xstream/extra/concat":77}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
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

},{}],50:[function(require,module,exports){
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

},{"_process":49,"timers":72}],51:[function(require,module,exports){
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

},{"./selectorParser":57}],52:[function(require,module,exports){
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

},{}],53:[function(require,module,exports){
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

},{"./parent-symbol":55,"./query":56}],54:[function(require,module,exports){
"use strict";
var curry2_1 = require('./curry2');
var findMatches_1 = require('./findMatches');
exports.select = curry2_1.curry2(findMatches_1.findMatches);
var selectorParser_1 = require('./selectorParser');
exports.selectorParser = selectorParser_1.selectorParser;
var classNameFromVNode_1 = require('./classNameFromVNode');
exports.classNameFromVNode = classNameFromVNode_1.classNameFromVNode;

},{"./classNameFromVNode":51,"./curry2":52,"./findMatches":53,"./selectorParser":57}],55:[function(require,module,exports){
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

},{}],56:[function(require,module,exports){
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

},{"./classNameFromVNode":51,"./parent-symbol":55,"./selectorParser":57,"tree-selector":73}],57:[function(require,module,exports){
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

},{}],58:[function(require,module,exports){
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

},{"./is":60,"./vnode":69}],59:[function(require,module,exports){
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

},{}],60:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;

},{}],61:[function(require,module,exports){
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

},{}],62:[function(require,module,exports){
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

},{}],63:[function(require,module,exports){
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

},{}],64:[function(require,module,exports){
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

},{}],65:[function(require,module,exports){
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

},{}],66:[function(require,module,exports){
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

},{"./h":58,"./htmldomapi":59,"./is":60,"./thunk":67,"./vnode":69}],67:[function(require,module,exports){
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

},{"./h":58}],68:[function(require,module,exports){
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

},{"./htmldomapi":59,"./vnode":69}],69:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
exports.default = vnode;

},{}],70:[function(require,module,exports){
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

},{"./ponyfill.js":71}],71:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13}],72:[function(require,module,exports){
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

},{"process/browser.js":49,"timers":72}],73:[function(require,module,exports){
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

},{"./matches":74,"./querySelector":75,"./selectorParser":76}],74:[function(require,module,exports){
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

},{"./selectorParser":76}],75:[function(require,module,exports){
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

},{"./matches":74,"./selectorParser":76}],76:[function(require,module,exports){
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

},{}],77:[function(require,module,exports){
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

},{"../index":81}],78:[function(require,module,exports){
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

},{"../index":81}],79:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"../index":81,"dup":14}],80:[function(require,module,exports){
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

},{"../index":81}],81:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"symbol-observable":70}],82:[function(require,module,exports){
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
var delay_1 = require("xstream/extra/delay");
var dom_1 = require("@cycle/dom");
var isolate_1 = require("@cycle/isolate");
var screen_1 = require("@cycle-robot-drivers/screen");
var actionbank_1 = require("@cycle-robot-drivers/actionbank");
function RobotApp(sources) {
    var state$ = sources.state.stream;
    var facialExpressionResult$ = state$
        .compose(actionbank_1.selectActionResult('FacialExpressionAction'));
    var twoSpeechbubblesResult$ = state$
        .compose(actionbank_1.selectActionResult('TwoSpeechbubblesAction'));
    var RaceAction = actionbank_1.makeConcurrentAction(['FacialExpressionAction', 'TwoSpeechbubblesAction'], true);
    var childSinks = isolate_1.default(RaceAction, 'RaceAction')(__assign({}, sources, { goal: xstream_1.default.of({
            FacialExpressionAction: 'happy',
            TwoSpeechbubblesAction: { message: 'Hello', choices: ['Hello'] },
        }).compose(delay_1.default(1000)), FacialExpressionAction: { result: facialExpressionResult$ }, TwoSpeechbubblesAction: { result: twoSpeechbubblesResult$ } }));
    childSinks.result.addListener({ next: function (r) { return console.log('result', r); } });
    var facialExpressionAction = screen_1.FacialExpressionAction({
        goal: childSinks.FacialExpressionAction,
        TabletFace: sources.TabletFace,
    });
    var twoSpeechbubblesAction = screen_1.TwoSpeechbubblesAction({
        goal: childSinks.TwoSpeechbubblesAction,
        DOM: sources.DOM,
    });
    var parentReducer$ = xstream_1.default.merge(facialExpressionAction.result.map(function (result) {
        return function (prev) { return (__assign({}, prev, { FacialExpressionAction: { outputs: { result: result } } })); };
    }), twoSpeechbubblesAction.result.map(function (result) {
        return function (prev) { return (__assign({}, prev, { TwoSpeechbubblesAction: { outputs: { result: result } } })); };
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
        TabletFace: facialExpressionAction.output,
        state: reducer$,
    };
}
exports.default = RobotApp;

},{"@cycle-robot-drivers/actionbank":4,"@cycle-robot-drivers/screen":87,"@cycle/dom":29,"@cycle/isolate":36,"xstream":81,"xstream/extra/delay":78}],83:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = require("@cycle/dom");
var state_1 = require("@cycle/state");
var run_1 = require("@cycle/run");
var screen_1 = require("@cycle-robot-drivers/screen");
var RobotApp_1 = require("./RobotApp");
var main = state_1.withState(RobotApp_1.default);
run_1.run(main, {
    DOM: dom_1.makeDOMDriver('#app'),
    TabletFace: screen_1.makeTabletFaceDriver(),
});

},{"./RobotApp":82,"@cycle-robot-drivers/screen":87,"@cycle/dom":29,"@cycle/run":40,"@cycle/state":44}],84:[function(require,module,exports){
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

},{"@cycle-robot-drivers/action":89,"@cycle/run/lib/adapt":113,"xstream":142,"xstream/extra/dropRepeats":140}],85:[function(require,module,exports){
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

},{"@cycle-robot-drivers/action":89,"@cycle/dom":105,"@cycle/isolate":112,"@cycle/run/lib/adapt":113,"xstream":142}],86:[function(require,module,exports){
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

},{"./SpeechbubbleAction":85,"@cycle-robot-drivers/action":89,"@cycle/dom":105,"@cycle/isolate":112,"@cycle/run/lib/adapt":113,"xstream":142}],87:[function(require,module,exports){
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

},{"./FacialExpressionAction":84,"./SpeechbubbleAction":85,"./TwoSpeechbubblesAction":86,"./makeTabletFaceDriver":88}],88:[function(require,module,exports){
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

},{"@cycle/dom":105,"@cycle/run/lib/adapt":113,"xstream":142}],89:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"./types":90,"./utils":91,"dup":7}],90:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],91:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],92:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"./fromEvent":103,"@cycle/run/lib/adapt":113,"dup":16,"xstream":142}],93:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"./fromEvent":103,"@cycle/run/lib/adapt":113,"dup":17,"xstream":142}],94:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"./ScopeChecker":100,"./utils":111,"dup":18}],95:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"./ElementFinder":94,"./PriorityQueue":98,"./RemovalSet":99,"./ScopeChecker":100,"./SymbolTree":101,"./fromEvent":103,"./utils":111,"dup":19,"xstream":142}],96:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"./SymbolTree":101,"./utils":111,"dup":20}],97:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"./BodyDOMSource":92,"./DocumentDOMSource":93,"./ElementFinder":94,"./isolate":106,"@cycle/run/lib/adapt":113,"dup":21}],98:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],99:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],100:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"./utils":111,"dup":24}],101:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],102:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"./utils":111,"dup":26,"snabbdom-selector":117,"snabbdom/h":121,"snabbdom/vnode":132}],103:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"xstream":142}],104:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"dup":28,"snabbdom/h":121}],105:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"./MainDOMSource":97,"./hyperscript-helpers":104,"./makeDOMDriver":107,"./mockDOMSource":108,"./thunk":110,"dup":29,"snabbdom/h":121}],106:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"./utils":111,"dup":30}],107:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"./EventDelegator":95,"./IsolateModule":96,"./MainDOMSource":97,"./VNodeWrapper":102,"./modules":109,"./utils":111,"dup":31,"snabbdom":129,"snabbdom/tovnode":131,"xstream":142,"xstream/extra/concat":139,"xstream/extra/sampleCombine":141}],108:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"@cycle/run/lib/adapt":113,"dup":32,"xstream":142}],109:[function(require,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"dup":33,"snabbdom/modules/attributes":124,"snabbdom/modules/class":125,"snabbdom/modules/dataset":126,"snabbdom/modules/props":127,"snabbdom/modules/style":128}],110:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34,"snabbdom/h":121}],111:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],112:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"@cycle/run/lib/adapt":113,"dup":10,"xstream":142}],113:[function(require,module,exports){
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

},{}],114:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"./selectorParser":120,"dup":51}],115:[function(require,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"dup":52}],116:[function(require,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"./parent-symbol":118,"./query":119,"dup":53}],117:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"./classNameFromVNode":114,"./curry2":115,"./findMatches":116,"./selectorParser":120,"dup":54}],118:[function(require,module,exports){
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

},{}],119:[function(require,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"./classNameFromVNode":114,"./parent-symbol":118,"./selectorParser":120,"dup":56,"tree-selector":135}],120:[function(require,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"dup":57}],121:[function(require,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"./is":123,"./vnode":132,"dup":58}],122:[function(require,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"dup":59}],123:[function(require,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"dup":60}],124:[function(require,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"dup":61}],125:[function(require,module,exports){
arguments[4][62][0].apply(exports,arguments)
},{"dup":62}],126:[function(require,module,exports){
arguments[4][63][0].apply(exports,arguments)
},{"dup":63}],127:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64}],128:[function(require,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"dup":65}],129:[function(require,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"./h":121,"./htmldomapi":122,"./is":123,"./thunk":130,"./vnode":132,"dup":66}],130:[function(require,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"./h":121,"dup":67}],131:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"./htmldomapi":122,"./vnode":132,"dup":68}],132:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"dup":69}],133:[function(require,module,exports){
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

},{"./ponyfill.js":134}],134:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13}],135:[function(require,module,exports){
arguments[4][73][0].apply(exports,arguments)
},{"./matches":136,"./querySelector":137,"./selectorParser":138,"dup":73}],136:[function(require,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"./selectorParser":138,"dup":74}],137:[function(require,module,exports){
arguments[4][75][0].apply(exports,arguments)
},{"./matches":136,"./selectorParser":138,"dup":75}],138:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],139:[function(require,module,exports){
arguments[4][77][0].apply(exports,arguments)
},{"../index":142,"dup":77}],140:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"../index":142,"dup":14}],141:[function(require,module,exports){
arguments[4][80][0].apply(exports,arguments)
},{"../index":142,"dup":80}],142:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"symbol-observable":133}]},{},[83])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi9hY3Rpb25iYW5rL2xpYi9janMvUUFXaXRoU2NyZWVuQWN0aW9uLmpzIiwiLi4vLi4vLi4vYWN0aW9uYmFuay9saWIvY2pzL1F1ZXN0aW9uQW5zd2VyQWN0aW9uLmpzIiwiLi4vLi4vLi4vYWN0aW9uYmFuay9saWIvY2pzL1NwZWFrV2l0aFNjcmVlbkFjdGlvbi5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbGliL2Nqcy9pbmRleC5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbGliL2Nqcy9tYWtlQ29uY3VycmVudEFjdGlvbi5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbGliL2Nqcy91dGlscy5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvbi9saWIvY2pzL2luZGV4LmpzIiwiLi4vLi4vLi4vYWN0aW9uYmFuay9ub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdHlwZXMuanMiLCIuLi8uLi8uLi9hY3Rpb25iYW5rL25vZGVfbW9kdWxlcy9AY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb24vbGliL2Nqcy91dGlscy5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbm9kZV9tb2R1bGVzL0BjeWNsZS9pc29sYXRlL2xpYi9janMvaW5kZXguanMiLCIuLi8uLi8uLi9hY3Rpb25iYW5rL25vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9hZGFwdC5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9pbmRleC5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9wb255ZmlsbC5qcyIsIi4uLy4uLy4uL2FjdGlvbmJhbmsvbm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2Ryb3BSZXBlYXRzLnRzIiwiLi4vLi4vLi4vYWN0aW9uYmFuay9ub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvaW5kZXgudHMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0JvZHlET01Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0RvY3VtZW50RE9NU291cmNlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9FbGVtZW50RmluZGVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9FdmVudERlbGVnYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvSXNvbGF0ZU1vZHVsZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvTWFpbkRPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvUHJpb3JpdHlRdWV1ZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvUmVtb3ZhbFNldC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvU2NvcGVDaGVja2VyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9TeW1ib2xUcmVlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9WTm9kZVdyYXBwZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL2Zyb21FdmVudC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaHlwZXJzY3JpcHQtaGVscGVycy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL2lzb2xhdGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21ha2VET01Ecml2ZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21vY2tET01Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21vZHVsZXMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL3RodW5rLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvaXNvbGF0ZS9ub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW50ZXJuYWxzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL0NvbGxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvU3RhdGVTb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvcGlja0NvbWJpbmUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvcGlja01lcmdlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL3dpdGhTdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvc3RhdGUvbm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9xdWlja3Rhc2svaW5kZXguanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL2NsYXNzTmFtZUZyb21WTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvY3VycnkyLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9maW5kTWF0Y2hlcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL3BhcmVudC1zeW1ib2wuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL3F1ZXJ5LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9zZWxlY3RvclBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9oLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL2h0bWxkb21hcGkuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vaXMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvY2xhc3MuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9kYXRhc2V0LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvcHJvcHMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9zdHlsZS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9zbmFiYmRvbS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS90aHVuay5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS90b3Zub2RlLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3Zub2RlLmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3RyZWUtc2VsZWN0b3IvbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvbWF0Y2hlcy5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvcXVlcnlTZWxlY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvc2VsZWN0b3JQYXJzZXIuanMiLCJub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvZXh0cmEvY29uY2F0LnRzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2RlbGF5LnRzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL3NhbXBsZUNvbWJpbmUudHMiLCJzcmMvUm9ib3RBcHAudHMiLCJzcmMvaW5kZXgudHMiLCIuLi8uLi8uLi9zY3JlZW4vbGliL2Nqcy9GYWNpYWxFeHByZXNzaW9uQWN0aW9uLmpzIiwiLi4vLi4vLi4vc2NyZWVuL2xpYi9janMvU3BlZWNoYnViYmxlQWN0aW9uLmpzIiwiLi4vLi4vLi4vc2NyZWVuL2xpYi9janMvVHdvU3BlZWNoYnViYmxlc0FjdGlvbi5qcyIsIi4uLy4uLy4uL3NjcmVlbi9saWIvY2pzL2luZGV4LmpzIiwiLi4vLi4vLi4vc2NyZWVuL2xpYi9janMvbWFrZVRhYmxldEZhY2VEcml2ZXIuanMiLCIuLi8uLi8uLi9zY3JlZW4vbm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwiLi4vLi4vLi4vc2NyZWVuL25vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvcGFyZW50LXN5bWJvbC5qcyIsIi4uLy4uLy4uL3NjcmVlbi9ub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUNuQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbEQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNO1lBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBRUQsOEJBQUssR0FBTDtRQUNFLElBQUksSUFBSSxDQUFDLElBQUk7WUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLENBQUM7SUFDSCxxQkFBQztBQUFELENBdkJBLEFBdUJDLElBQUE7QUF1RUQ7SUFNRSxlQUFZLE1BQXdCO1FBTDdCLFNBQUksR0FBRyxPQUFPLENBQUM7UUFNcEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7UUFDM0IsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDZCxDQUFDO0lBRUQsc0JBQU0sR0FBTixVQUFPLEdBQWM7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3RCLElBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDbkIsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDWixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVELHFCQUFLLEdBQUw7UUFDRSxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3RC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QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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RWxDLElBQU0sSUFBSSxHQUFHLGlCQUFTLENBQUMsa0JBQVEsQ0FBQyxDQUFDO0FBRWpDLFNBQUcsQ0FBQyxJQUFJLEVBQUU7SUFDUixHQUFHLEVBQUUsbUJBQWEsQ0FBQyxNQUFNLENBQUM7SUFDMUIsVUFBVSxFQUFFLDZCQUFvQixFQUFFO0NBQ25DLENBQUMsQ0FBQzs7O0FDWEg7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDdFdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGlzb2xhdGVfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiQGN5Y2xlL2lzb2xhdGVcIikpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgbWFrZUNvbmN1cnJlbnRBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL21ha2VDb25jdXJyZW50QWN0aW9uXCIpO1xudmFyIFF1ZXN0aW9uQW5zd2VyQWN0aW9uXzEgPSByZXF1aXJlKFwiLi9RdWVzdGlvbkFuc3dlckFjdGlvblwiKTtcbmZ1bmN0aW9uIFFBV2l0aFNjcmVlbkFjdGlvbihzb3VyY2VzKSB7XG4gICAgLy8gc291cmNlcy5zdGF0ZS5zdHJlYW0uYWRkTGlzdGVuZXIoe25leHQ6IHYgPT4gY29uc29sZS5sb2coJ3JlZHVjZXJTdGF0ZSQnLCB2KX0pXG4gICAgdmFyIHJlZHVjZXJTdGF0ZSQgPSBzb3VyY2VzLnN0YXRlLnN0cmVhbTtcbiAgICB2YXIgcXVlc3Rpb25BbnN3ZXJSZXN1bHQkID0gcmVkdWNlclN0YXRlJFxuICAgICAgICAuY29tcG9zZSh1dGlsc18xLnNlbGVjdEFjdGlvblJlc3VsdCgnUXVlc3Rpb25BbnN3ZXJBY3Rpb24nKSk7XG4gICAgdmFyIGdvYWwkID0gc291cmNlcy5nb2FsXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGcpIHsgcmV0dXJuIHR5cGVvZiBnICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnKSB7IHJldHVybiBhY3Rpb25fMS5pbml0R29hbChnKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoZykgeyByZXR1cm4gKHtcbiAgICAgICAgZ29hbF9pZDogZy5nb2FsX2lkLFxuICAgICAgICBnb2FsOiB7XG4gICAgICAgICAgICBRdWVzdGlvbkFuc3dlckFjdGlvbjogZy5nb2FsLFxuICAgICAgICAgICAgVHdvU3BlZWNoYnViYmxlc0FjdGlvbjoge1xuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGcuZ29hbC5xdWVzdGlvbixcbiAgICAgICAgICAgICAgICBjaG9pY2VzOiBnLmdvYWwuYW5zd2Vyc1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9KTsgfSk7XG4gICAgdmFyIFJhY2VBY3Rpb24gPSBtYWtlQ29uY3VycmVudEFjdGlvbl8xLm1ha2VDb25jdXJyZW50QWN0aW9uKFsnVHdvU3BlZWNoYnViYmxlc0FjdGlvbicsICdRdWVzdGlvbkFuc3dlckFjdGlvbiddLCB0cnVlKTtcbiAgICB2YXIgcmFjZVNpbmtzID0gaXNvbGF0ZV8xLmRlZmF1bHQoUmFjZUFjdGlvbiwgJ1JhY2VBY3Rpb24nKSh7XG4gICAgICAgIGdvYWw6IGdvYWwkLFxuICAgICAgICBUd29TcGVlY2hidWJibGVzQWN0aW9uOiBzb3VyY2VzLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24sXG4gICAgICAgIFF1ZXN0aW9uQW5zd2VyQWN0aW9uOiB7IHJlc3VsdDogcXVlc3Rpb25BbnN3ZXJSZXN1bHQkIH0sXG4gICAgICAgIHN0YXRlOiBzb3VyY2VzLnN0YXRlLFxuICAgIH0pO1xuICAgIC8vIHJhY2VTaW5rcy5yZXN1bHQuYWRkTGlzdGVuZXIoe25leHQ6IHYgPT4gY29uc29sZS5sb2coJ3JhY2VTaW5rcy5yZXN1bHQnLCB2KX0pO1xuICAgIHZhciBxYVNpbmtzID0gaXNvbGF0ZV8xLmRlZmF1bHQoUXVlc3Rpb25BbnN3ZXJBY3Rpb25fMS5RdWVzdGlvbkFuc3dlckFjdGlvbiwgJ1F1ZXN0aW9uQW5zd2VyQWN0aW9uJykoe1xuICAgICAgICBnb2FsOiByYWNlU2lua3MuUXVlc3Rpb25BbnN3ZXJBY3Rpb24sXG4gICAgICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogc291cmNlcy5TcGVlY2hTeW50aGVzaXNBY3Rpb24sXG4gICAgICAgIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiBzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLFxuICAgICAgICBzdGF0ZTogc291cmNlcy5zdGF0ZSxcbiAgICB9KTtcbiAgICAvLyBxYVNpbmtzLnJlc3VsdC5hZGRMaXN0ZW5lcih7bmV4dDogdiA9PiBjb25zb2xlLmxvZygncWFTaW5rcy5yZXN1bHQnLCB2KX0pO1xuICAgIHZhciByZWR1Y2VyJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKHJhY2VTaW5rcy5zdGF0ZSwgcWFTaW5rcy5zdGF0ZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdWx0OiByYWNlU2lua3MucmVzdWx0LFxuICAgICAgICBUd29TcGVlY2hidWJibGVzQWN0aW9uOiByYWNlU2lua3MuVHdvU3BlZWNoYnViYmxlc0FjdGlvbixcbiAgICAgICAgU3BlZWNoU3ludGhlc2lzQWN0aW9uOiBxYVNpbmtzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbixcbiAgICAgICAgU3BlZWNoUmVjb2duaXRpb25BY3Rpb246IHFhU2lua3MuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24sXG4gICAgICAgIHN0YXRlOiByZWR1Y2VyJCxcbiAgICB9O1xufVxuZXhwb3J0cy5RQVdpdGhTY3JlZW5BY3Rpb24gPSBRQVdpdGhTY3JlZW5BY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1RQVdpdGhTY3JlZW5BY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbi8vIEZTTSB0eXBlc1xudmFyIFM7XG4oZnVuY3Rpb24gKFMpIHtcbiAgICBTW1wiUEVORFwiXSA9IFwiUEVORFwiO1xuICAgIFNbXCJBU0tcIl0gPSBcIkFTS1wiO1xuICAgIFNbXCJMSVNURU5cIl0gPSBcIkxJU1RFTlwiO1xufSkoUyA9IGV4cG9ydHMuUyB8fCAoZXhwb3J0cy5TID0ge30pKTtcbnZhciBTSUdUeXBlO1xuKGZ1bmN0aW9uIChTSUdUeXBlKSB7XG4gICAgU0lHVHlwZVtcIkdPQUxcIl0gPSBcIkdPQUxcIjtcbiAgICBTSUdUeXBlW1wiQ0FOQ0VMXCJdID0gXCJDQU5DRUxcIjtcbiAgICBTSUdUeXBlW1wiQVNLX0RPTkVcIl0gPSBcIkFTS19ET05FXCI7XG4gICAgU0lHVHlwZVtcIlZBTElEX1JFU1BPTlNFXCJdID0gXCJWQUxJRF9SRVNQT05TRVwiO1xuICAgIFNJR1R5cGVbXCJJTlZBTElEX1JFU1BPTlNFXCJdID0gXCJJTlZBTElEX1JFU1BPTlNFXCI7XG59KShTSUdUeXBlID0gZXhwb3J0cy5TSUdUeXBlIHx8IChleHBvcnRzLlNJR1R5cGUgPSB7fSkpO1xuO1xuZnVuY3Rpb24gaW5wdXQoZ29hbCQsIHNwZWVjaFN5bnRoZXNpc1Jlc3VsdCQsIHNwZWVjaFJlY29nbml0aW9uUmVzdWx0JCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5maWx0ZXIoZnVuY3Rpb24gKGcpIHsgcmV0dXJuIHR5cGVvZiBnICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnKSB7IHJldHVybiAoZyA9PT0gbnVsbClcbiAgICAgICAgPyAoeyB0eXBlOiBTSUdUeXBlLkNBTkNFTCwgdmFsdWU6IG51bGwgfSlcbiAgICAgICAgOiAoeyB0eXBlOiBTSUdUeXBlLkdPQUwsIHZhbHVlOiBhY3Rpb25fMS5pbml0R29hbChnKSB9KTsgfSksIHNwZWVjaFN5bnRoZXNpc1Jlc3VsdCRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7IHJldHVybiByZXN1bHQuc3RhdHVzLnN0YXR1cyA9PT0gJ1NVQ0NFRURFRCc7IH0pXG4gICAgICAgIC5tYXBUbyh7IHR5cGU6IFNJR1R5cGUuQVNLX0RPTkUgfSksIHNwZWVjaFJlY29nbml0aW9uUmVzdWx0JFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdC5zdGF0dXMuc3RhdHVzID09PSAnU1VDQ0VFREVEJztcbiAgICB9KS5tYXAoZnVuY3Rpb24gKHJlc3VsdCkgeyByZXR1cm4gKHtcbiAgICAgICAgdHlwZTogU0lHVHlwZS5WQUxJRF9SRVNQT05TRSxcbiAgICAgICAgdmFsdWU6IHJlc3VsdC5yZXN1bHQsXG4gICAgfSk7IH0pLCBzcGVlY2hSZWNvZ25pdGlvblJlc3VsdCRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiByZXN1bHQuc3RhdHVzLnN0YXR1cyAhPT0gJ1NVQ0NFRURFRCc7XG4gICAgfSkubWFwVG8oeyB0eXBlOiBTSUdUeXBlLklOVkFMSURfUkVTUE9OU0UgfSkpO1xufVxuZnVuY3Rpb24gcmVkdWNlcihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gKHByZXYpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcmV2ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogUy5QRU5ELFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogbnVsbCxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHRyYW5zaXRpb25SZWR1Y2VyJCA9IGlucHV0JC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiAocHJldikge1xuICAgICAgICBjb25zb2xlLmRlYnVnKCdpbnB1dCcsIGlucHV0LCAncHJldicsIHByZXYpO1xuICAgICAgICBpZiAocHJldi5zdGF0ZSA9PT0gUy5QRU5EICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuR09BTCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogUy5BU0ssXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0LnZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBpbnB1dC52YWx1ZS5nb2FsLnF1ZXN0aW9uLFxuICAgICAgICAgICAgICAgICAgICBhbnN3ZXJzOiBpbnB1dC52YWx1ZS5nb2FsLmFuc3dlcnMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7IFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogeyBnb2FsOiBpbnB1dC52YWx1ZS5nb2FsLnF1ZXN0aW9uIH0gfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJldi5zdGF0ZSAhPT0gUy5QRU5EICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuR09BTCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogUy5BU0ssXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0LnZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIHF1ZXN0aW9uOiBpbnB1dC52YWx1ZS5nb2FsLnF1ZXN0aW9uLFxuICAgICAgICAgICAgICAgICAgICBhbnN3ZXJzOiBpbnB1dC52YWx1ZS5nb2FsLmFuc3dlcnMsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldi52YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBTcGVlY2hTeW50aGVzaXNBY3Rpb246IHsgZ29hbDogaW5wdXQudmFsdWUuZ29hbC5xdWVzdGlvbiB9LFxuICAgICAgICAgICAgICAgICAgICBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjogeyBnb2FsOiBudWxsIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAocHJldi5zdGF0ZSAhPT0gUy5QRU5EICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuQ0FOQ0VMKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBTLlBFTkQsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBudWxsLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBwcmV2LnZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogeyBnb2FsOiBudWxsIH0sXG4gICAgICAgICAgICAgICAgICAgIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uOiB7IGdvYWw6IG51bGwgfSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByZXYuc3RhdGUgPT09IFMuQVNLICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuQVNLX0RPTkUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFMuTElTVEVOLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogcHJldi52YXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgb3V0cHV0czogeyBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjogeyBnb2FsOiB7fSB9IH0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHByZXYuc3RhdGUgPT09IFMuTElTVEVOICYmIGlucHV0LnR5cGUgPT09IFNJR1R5cGUuVkFMSURfUkVTUE9OU0UpIHtcbiAgICAgICAgICAgIC8vIHRoaXMgbWF0Y2hpbmcgbG9naWMgbXVzdCBiZSBkZWxlZ2F0ZWQgdG8gdGhlIHJlY29nbml6ZXJcbiAgICAgICAgICAgIHZhciBtYXRjaGVkID0gcHJldi52YXJpYWJsZXMuYW5zd2Vyc1xuICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGEpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKSA9PT0gaW5wdXQudmFsdWU7IH0pO1xuICAgICAgICAgICAgcmV0dXJuICh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFMuUEVORCxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHByZXYudmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBtYXRjaGVkLmxlbmd0aCA+IDAgPyBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVEIDogYWN0aW9uXzEuU3RhdHVzLkFCT1JURUQsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBtYXRjaGVkLmxlbmd0aCA+IDBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IG1hdGNoZWRbMF0gLy8gYnJlYWsgdGhlIHRpZSBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChwcmV2LnN0YXRlID09PSBTLkxJU1RFTiAmJiBpbnB1dC50eXBlID09PSBTSUdUeXBlLklOVkFMSURfUkVTUE9OU0UpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFMuUEVORCxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHByZXYudmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuQUJPUlRFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgO1xuICAgICAgICByZXR1cm4gcHJldjtcbiAgICB9OyB9KTtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoaW5pdFJlZHVjZXIkLCB0cmFuc2l0aW9uUmVkdWNlciQpO1xufVxuZnVuY3Rpb24gb3V0cHV0KHJlZHVjZXJTdGF0ZSQpIHtcbiAgICB2YXIgb3V0cHV0cyQgPSByZWR1Y2VyU3RhdGUkXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG0pIHsgcmV0dXJuICEhbS5vdXRwdXRzOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChtKSB7IHJldHVybiBtLm91dHB1dHM7IH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3VsdDogb3V0cHV0cyRcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG8pIHsgcmV0dXJuICEhby5yZXN1bHQ7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChvKSB7IHJldHVybiBvLnJlc3VsdDsgfSksXG4gICAgICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogb3V0cHV0cyRcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG8pIHsgcmV0dXJuICEhby5TcGVlY2hTeW50aGVzaXNBY3Rpb247IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChvKSB7IHJldHVybiBvLlNwZWVjaFN5bnRoZXNpc0FjdGlvbi5nb2FsOyB9KSxcbiAgICAgICAgU3BlZWNoUmVjb2duaXRpb25BY3Rpb246IG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvKSB7IHJldHVybiAhIW8uU3BlZWNoUmVjb2duaXRpb25BY3Rpb247IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChvKSB7IHJldHVybiBvLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uLmdvYWw7IH0pLFxuICAgIH07XG59XG5mdW5jdGlvbiBRdWVzdGlvbkFuc3dlckFjdGlvbihzb3VyY2VzKSB7XG4gICAgdmFyIHJlZHVjZXJTdGF0ZSQgPSBzb3VyY2VzLnN0YXRlLnN0cmVhbTtcbiAgICB2YXIgaW5wdXQkID0gaW5wdXQoc291cmNlcy5nb2FsLCBzb3VyY2VzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbi5yZXN1bHQsIHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24ucmVzdWx0KTtcbiAgICB2YXIgcmVkdWNlciQgPSByZWR1Y2VyKGlucHV0JCk7XG4gICAgdmFyIG91dHB1dHMgPSBvdXRwdXQocmVkdWNlclN0YXRlJCk7XG4gICAgcmV0dXJuIF9fYXNzaWduKHt9LCBvdXRwdXRzLCB7IHN0YXRlOiByZWR1Y2VyJCB9KTtcbn1cbmV4cG9ydHMuUXVlc3Rpb25BbnN3ZXJBY3Rpb24gPSBRdWVzdGlvbkFuc3dlckFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVF1ZXN0aW9uQW5zd2VyQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGlzb2xhdGVfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiQGN5Y2xlL2lzb2xhdGVcIikpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciBtYWtlQ29uY3VycmVudEFjdGlvbl8xID0gcmVxdWlyZShcIi4vbWFrZUNvbmN1cnJlbnRBY3Rpb25cIik7XG5mdW5jdGlvbiBTcGVha1dpdGhTY3JlZW5BY3Rpb24oc291cmNlcykge1xuICAgIHNvdXJjZXMuc3RhdGUuc3RyZWFtLmFkZExpc3RlbmVyKHsgbmV4dDogZnVuY3Rpb24gKHYpIHsgcmV0dXJuIGNvbnNvbGUubG9nKCdyZWR1Y2VyU3RhdGUkJywgdik7IH0gfSk7XG4gICAgdmFyIGdvYWwkID0gc291cmNlcy5nb2FsXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGcpIHsgcmV0dXJuIHR5cGVvZiBnICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnKSB7IHJldHVybiBhY3Rpb25fMS5pbml0R29hbChnKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoZykgeyByZXR1cm4gKHtcbiAgICAgICAgZ29hbF9pZDogZy5nb2FsX2lkLFxuICAgICAgICBnb2FsOiB7XG4gICAgICAgICAgICBUd29TcGVlY2hidWJibGVzQWN0aW9uOiBnLmdvYWwsXG4gICAgICAgICAgICBTcGVlY2hTeW50aGVzaXNBY3Rpb246IGcuZ29hbCxcbiAgICAgICAgfSxcbiAgICB9KTsgfSk7XG4gICAgdmFyIFJhY2VBY3Rpb24gPSBtYWtlQ29uY3VycmVudEFjdGlvbl8xLm1ha2VDb25jdXJyZW50QWN0aW9uKFsnVHdvU3BlZWNoYnViYmxlc0FjdGlvbicsICdTcGVlY2hTeW50aGVzaXNBY3Rpb24nXSwgZmFsc2UpO1xuICAgIHZhciByYWNlU2lua3MgPSBpc29sYXRlXzEuZGVmYXVsdChSYWNlQWN0aW9uLCAnUmFjZUFjdGlvbicpKHtcbiAgICAgICAgZ29hbDogZ29hbCQsXG4gICAgICAgIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb246IHNvdXJjZXMuVHdvU3BlZWNoYnViYmxlc0FjdGlvbixcbiAgICAgICAgU3BlZWNoU3ludGhlc2lzQWN0aW9uOiBzb3VyY2VzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbixcbiAgICAgICAgc3RhdGU6IHNvdXJjZXMuc3RhdGUsXG4gICAgfSk7XG4gICAgLy8gcmFjZVNpbmtzLnJlc3VsdC5hZGRMaXN0ZW5lcih7bmV4dDogdiA9PiBjb25zb2xlLmxvZygncmFjZVNpbmtzLnJlc3VsdCcsIHYpfSk7XG4gICAgdmFyIHJlZHVjZXIkID0gcmFjZVNpbmtzLnN0YXRlO1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3VsdDogcmFjZVNpbmtzLnJlc3VsdCxcbiAgICAgICAgVHdvU3BlZWNoYnViYmxlc0FjdGlvbjogcmFjZVNpbmtzLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24sXG4gICAgICAgIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjogcmFjZVNpbmtzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbixcbiAgICAgICAgc3RhdGU6IHJlZHVjZXIkLFxuICAgIH07XG59XG5leHBvcnRzLlNwZWFrV2l0aFNjcmVlbkFjdGlvbiA9IFNwZWFrV2l0aFNjcmVlbkFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNwZWFrV2l0aFNjcmVlbkFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5leHBvcnRzLnNlbGVjdEFjdGlvblJlc3VsdCA9IHV0aWxzXzEuc2VsZWN0QWN0aW9uUmVzdWx0O1xudmFyIG1ha2VDb25jdXJyZW50QWN0aW9uXzEgPSByZXF1aXJlKFwiLi9tYWtlQ29uY3VycmVudEFjdGlvblwiKTtcbmV4cG9ydHMubWFrZUNvbmN1cnJlbnRBY3Rpb24gPSBtYWtlQ29uY3VycmVudEFjdGlvbl8xLm1ha2VDb25jdXJyZW50QWN0aW9uO1xudmFyIFNwZWFrV2l0aFNjcmVlbkFjdGlvbl8xID0gcmVxdWlyZShcIi4vU3BlYWtXaXRoU2NyZWVuQWN0aW9uXCIpO1xuZXhwb3J0cy5TcGVha1dpdGhTY3JlZW5BY3Rpb24gPSBTcGVha1dpdGhTY3JlZW5BY3Rpb25fMS5TcGVha1dpdGhTY3JlZW5BY3Rpb247XG52YXIgUXVlc3Rpb25BbnN3ZXJBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1F1ZXN0aW9uQW5zd2VyQWN0aW9uXCIpO1xuZXhwb3J0cy5RdWVzdGlvbkFuc3dlckFjdGlvbiA9IFF1ZXN0aW9uQW5zd2VyQWN0aW9uXzEuUXVlc3Rpb25BbnN3ZXJBY3Rpb247XG52YXIgUUFXaXRoU2NyZWVuQWN0aW9uXzEgPSByZXF1aXJlKFwiLi9RQVdpdGhTY3JlZW5BY3Rpb25cIik7XG5leHBvcnRzLlFBV2l0aFNjcmVlbkFjdGlvbiA9IFFBV2l0aFNjcmVlbkFjdGlvbl8xLlFBV2l0aFNjcmVlbkFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtXCIpKTtcbnZhciBhY3Rpb25fMSA9IHJlcXVpcmUoXCJAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb25cIik7XG4vLyBGU00gdHlwZXNcbnZhciBTO1xuKGZ1bmN0aW9uIChTKSB7XG4gICAgU1tcIlBFTkRcIl0gPSBcIlBFTkRcIjtcbiAgICBTW1wiUlVOXCJdID0gXCJSVU5cIjtcbn0pKFMgPSBleHBvcnRzLlMgfHwgKGV4cG9ydHMuUyA9IHt9KSk7XG52YXIgU0lHVHlwZTtcbihmdW5jdGlvbiAoU0lHVHlwZSkge1xuICAgIFNJR1R5cGVbXCJHT0FMXCJdID0gXCJHT0FMXCI7XG4gICAgU0lHVHlwZVtcIkNBTkNFTFwiXSA9IFwiQ0FOQ0VMXCI7XG4gICAgU0lHVHlwZVtcIlJFU1VMVFNcIl0gPSBcIlJFU1VMVFNcIjtcbn0pKFNJR1R5cGUgPSBleHBvcnRzLlNJR1R5cGUgfHwgKGV4cG9ydHMuU0lHVHlwZSA9IHt9KSk7XG5mdW5jdGlvbiBtYWtlQ29uY3VycmVudEFjdGlvbihhY3Rpb25OYW1lcywgaXNSYWNlKSB7XG4gICAgaWYgKGFjdGlvbk5hbWVzID09PSB2b2lkIDApIHsgYWN0aW9uTmFtZXMgPSBbXTsgfVxuICAgIGlmIChpc1JhY2UgPT09IHZvaWQgMCkgeyBpc1JhY2UgPSBmYWxzZTsgfVxuICAgIHZhciBpbnB1dCA9IGZ1bmN0aW9uIChnb2FsJCwgcmVzdWx0cykge1xuICAgICAgICB2YXIgcmVzdWx0cyQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jb21iaW5lLmFwcGx5KG51bGwsIHJlc3VsdHMpO1xuICAgICAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoZ29hbCQuZmlsdGVyKGZ1bmN0aW9uIChnKSB7IHJldHVybiB0eXBlb2YgZyAhPT0gJ3VuZGVmaW5lZCc7IH0pLm1hcChmdW5jdGlvbiAoZykgeyByZXR1cm4gKGcgPT09IG51bGwpXG4gICAgICAgICAgICA/ICh7IHR5cGU6IFNJR1R5cGUuQ0FOQ0VMLCB2YWx1ZTogbnVsbCB9KVxuICAgICAgICAgICAgOiAoeyB0eXBlOiBTSUdUeXBlLkdPQUwsIHZhbHVlOiBhY3Rpb25fMS5pbml0R29hbChnKSB9KTsgfSksIHJlc3VsdHMkLm1hcChmdW5jdGlvbiAocikgeyByZXR1cm4gKHsgdHlwZTogU0lHVHlwZS5SRVNVTFRTLCB2YWx1ZTogciB9KTsgfSkpO1xuICAgIH07XG4gICAgdmFyIHJlZHVjZXIgPSBmdW5jdGlvbiAoaW5wdXQkKSB7XG4gICAgICAgIHZhciBpbml0UmVkdWNlciQgPSB4c3RyZWFtXzEuZGVmYXVsdC5vZihmdW5jdGlvbiAocHJldikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwcmV2ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiBTLlBFTkQsXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByZXY7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdHJhbnNpdGlvblJlZHVjZXIkID0gaW5wdXQkLm1hcChmdW5jdGlvbiAoaW5wdXQpIHsgcmV0dXJuIGZ1bmN0aW9uIChwcmV2KSB7XG4gICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdpbnB1dCcsIGlucHV0LCAncHJldicsIHByZXYpO1xuICAgICAgICAgICAgaWYgKHByZXYuc3RhdGUgPT09IFMuUEVORCAmJiBpbnB1dC50eXBlID09PSBTSUdUeXBlLkdPQUwpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0cyA9IE9iamVjdC5rZXlzKGlucHV0LnZhbHVlLmdvYWwpLnJlZHVjZShmdW5jdGlvbiAoYWNjLCB4KSB7XG4gICAgICAgICAgICAgICAgICAgIGFjY1t4XSA9IHsgZ29hbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0LnZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXQudmFsdWUuZ29hbFt4XVxuICAgICAgICAgICAgICAgICAgICAgICAgfSB9O1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgICAgIH0sIHt9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogUy5SVU4sXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXQudmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0czogb3V0cHV0cyxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAocHJldi5zdGF0ZSA9PT0gUy5SVU4gJiYgaW5wdXQudHlwZSA9PT0gU0lHVHlwZS5HT0FMKSB7XG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dHMgPSBPYmplY3Qua2V5cyhpbnB1dC52YWx1ZS5nb2FsKS5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgeCkge1xuICAgICAgICAgICAgICAgICAgICBhY2NbeF0gPSB7IGdvYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBpbnB1dC52YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0LnZhbHVlLmdvYWxbeF1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gfTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFMuUlVOLFxuICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0LnZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dHM6IF9fYXNzaWduKHt9LCBvdXRwdXRzLCB7IHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBwcmV2LnZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB9IH0pLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChwcmV2LnN0YXRlID09PSBTLlJVTiAmJiBpbnB1dC50eXBlID09PSBTSUdUeXBlLlJFU1VMVFMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0cyA9IGlucHV0LnZhbHVlO1xuICAgICAgICAgICAgICAgIGlmICghaXNSYWNlXG4gICAgICAgICAgICAgICAgICAgICYmIHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIC5ldmVyeShmdW5jdGlvbiAocikgeyByZXR1cm4gYWN0aW9uXzEuaXNFcXVhbChyLnN0YXR1cy5nb2FsX2lkLCBwcmV2LnZhcmlhYmxlcy5nb2FsX2lkKTsgfSlcbiAgICAgICAgICAgICAgICAgICAgJiYgcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICAgICAgLmV2ZXJ5KGZ1bmN0aW9uIChyKSB7IHJldHVybiByLnN0YXR1cy5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQ7IH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBfX2Fzc2lnbih7fSwgcHJldiwgeyBzdGF0ZTogUy5QRU5ELCB2YXJpYWJsZXM6IG51bGwsIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBwcmV2LnZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVELFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IGlucHV0LnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICghIWlzUmFjZVxuICAgICAgICAgICAgICAgICAgICAmJiByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgICAgICAuc29tZShmdW5jdGlvbiAocikgeyByZXR1cm4gKGFjdGlvbl8xLmlzRXF1YWwoci5zdGF0dXMuZ29hbF9pZCwgcHJldi52YXJpYWJsZXMuZ29hbF9pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIHIuc3RhdHVzLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCk7IH0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSByZXN1bHRzLmZpbHRlcihmdW5jdGlvbiAocikgeyByZXR1cm4gKGFjdGlvbl8xLmlzRXF1YWwoci5zdGF0dXMuZ29hbF9pZCwgcHJldi52YXJpYWJsZXMuZ29hbF9pZClcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIHIuc3RhdHVzLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCk7IH0pWzBdOyAvLyBicmVhayB0aGUgdGllIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlOiBTLlBFTkQsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldi52YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiByZXN1bHQucmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcmV2O1xuICAgICAgICB9OyB9KTtcbiAgICAgICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGluaXRSZWR1Y2VyJCwgdHJhbnNpdGlvblJlZHVjZXIkKTtcbiAgICB9O1xuICAgIHZhciBvdXRwdXQgPSBmdW5jdGlvbiAocmVkdWNlclN0YXRlJCkge1xuICAgICAgICB2YXIgb3V0cHV0cyQgPSByZWR1Y2VyU3RhdGUkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChtKSB7IHJldHVybiAhIW0ub3V0cHV0czsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG0pIHsgcmV0dXJuIG0ub3V0cHV0czsgfSk7XG4gICAgICAgIHJldHVybiBhY3Rpb25OYW1lcy5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgeCkge1xuICAgICAgICAgICAgYWNjW3hdID0gb3V0cHV0cyRcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvKSB7IHJldHVybiAhIW9beF07IH0pXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobykgeyByZXR1cm4gb1t4XS5nb2FsOyB9KTtcbiAgICAgICAgICAgIHJldHVybiBhY2M7XG4gICAgICAgIH0sIHtcbiAgICAgICAgICAgIHJlc3VsdDogb3V0cHV0cyRcbiAgICAgICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvKSB7IHJldHVybiAhIW8ucmVzdWx0OyB9KVxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG8pIHsgcmV0dXJuIG8ucmVzdWx0OyB9KVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBmdW5jdGlvbiBDb25jdXJyZW50QWN0aW9uKHNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHJlZHVjZXJTdGF0ZSQgPSBzb3VyY2VzLnN0YXRlLnN0cmVhbTtcbiAgICAgICAgdmFyIGNyZWF0ZUR1bW15UmVzdWx0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKHtcbiAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGFjdGlvbl8xLmdlbmVyYXRlR29hbElEKCksXG4gICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVELFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgfSk7IH07XG4gICAgICAgIHZhciByZXN1bHRzID0gYWN0aW9uTmFtZXNcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHNvdXJjZXNbeF0ucmVzdWx0LnN0YXJ0V2l0aChjcmVhdGVEdW1teVJlc3VsdCgpKTsgfSk7XG4gICAgICAgIHZhciBpbnB1dCQgPSBpbnB1dChzb3VyY2VzLmdvYWwsIHJlc3VsdHMpO1xuICAgICAgICB2YXIgcmVkdWNlciQgPSByZWR1Y2VyKGlucHV0JCk7XG4gICAgICAgIHZhciBvdXRwdXRzID0gb3V0cHV0KHJlZHVjZXJTdGF0ZSQpO1xuICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIG91dHB1dHMsIHsgc3RhdGU6IHJlZHVjZXIkIH0pO1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VDb25jdXJyZW50QWN0aW9uID0gbWFrZUNvbmN1cnJlbnRBY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWtlQ29uY3VycmVudEFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBkcm9wUmVwZWF0c18xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzXCIpKTtcbnZhciBhY3Rpb25fMSA9IHJlcXVpcmUoXCJAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb25cIik7XG5leHBvcnRzLnNlbGVjdEFjdGlvblJlc3VsdCA9IGZ1bmN0aW9uIChhY3Rpb25OYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChpbiQpIHsgcmV0dXJuIGluJFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiAhIXNcbiAgICAgICAgJiYgISFzW2FjdGlvbk5hbWVdXG4gICAgICAgICYmICEhc1thY3Rpb25OYW1lXS5vdXRwdXRzXG4gICAgICAgICYmICEhc1thY3Rpb25OYW1lXS5vdXRwdXRzLnJlc3VsdDsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gc1thY3Rpb25OYW1lXS5vdXRwdXRzLnJlc3VsdDsgfSlcbiAgICAgICAgLmNvbXBvc2UoZHJvcFJlcGVhdHNfMS5kZWZhdWx0KGFjdGlvbl8xLmlzRXF1YWxSZXN1bHQpKTsgfTtcbn07XG4vLyMgc291cmNlTWFwcGluZ1VSTD11dGlscy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0eXBlc18xID0gcmVxdWlyZShcIi4vdHlwZXNcIik7XG5leHBvcnRzLlN0YXR1cyA9IHR5cGVzXzEuU3RhdHVzO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmV4cG9ydHMuZ2VuZXJhdGVHb2FsSUQgPSB1dGlsc18xLmdlbmVyYXRlR29hbElEO1xuZXhwb3J0cy5pbml0R29hbCA9IHV0aWxzXzEuaW5pdEdvYWw7XG5leHBvcnRzLmlzRXF1YWwgPSB1dGlsc18xLmlzRXF1YWw7XG5leHBvcnRzLmlzRXF1YWxHb2FsID0gdXRpbHNfMS5pc0VxdWFsR29hbDtcbmV4cG9ydHMuaXNFcXVhbFJlc3VsdCA9IHV0aWxzXzEuaXNFcXVhbFJlc3VsdDtcbmV4cG9ydHMucG93ZXJ1cCA9IHV0aWxzXzEucG93ZXJ1cDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFN0YXR1cztcbihmdW5jdGlvbiAoU3RhdHVzKSB7XG4gICAgU3RhdHVzW1wiQUNUSVZFXCJdID0gXCJBQ1RJVkVcIjtcbiAgICBTdGF0dXNbXCJQUkVFTVBURURcIl0gPSBcIlBSRUVNUFRFRFwiO1xuICAgIFN0YXR1c1tcIlNVQ0NFRURFRFwiXSA9IFwiU1VDQ0VFREVEXCI7XG4gICAgU3RhdHVzW1wiQUJPUlRFRFwiXSA9IFwiQUJPUlRFRFwiO1xufSkoU3RhdHVzID0gZXhwb3J0cy5TdGF0dXMgfHwgKGV4cG9ydHMuU3RhdHVzID0ge30pKTtcbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXR5cGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fcmVzdCA9ICh0aGlzICYmIHRoaXMuX19yZXN0KSB8fCBmdW5jdGlvbiAocywgZSkge1xuICAgIHZhciB0ID0ge307XG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXG4gICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDApXG4gICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcbiAgICByZXR1cm4gdDtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZW5lcmF0ZUdvYWxJRCgpIHtcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFtcDogbm93LFxuICAgICAgICBpZDogTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIpICsgXCItXCIgKyBub3cuZ2V0VGltZSgpLFxuICAgIH07XG59XG5leHBvcnRzLmdlbmVyYXRlR29hbElEID0gZ2VuZXJhdGVHb2FsSUQ7XG5mdW5jdGlvbiBpbml0R29hbChnb2FsLCBpc0dvYWwpIHtcbiAgICBpZiAoaXNHb2FsID09PSB2b2lkIDApIHsgaXNHb2FsID0gZnVuY3Rpb24gKGcpIHsgcmV0dXJuICEhZy5nb2FsX2lkOyB9OyB9XG4gICAgcmV0dXJuIGlzR29hbChnb2FsKSA/IGdvYWwgOiB7XG4gICAgICAgIGdvYWxfaWQ6IGdlbmVyYXRlR29hbElEKCksXG4gICAgICAgIGdvYWw6IGdvYWwsXG4gICAgfTtcbn1cbmV4cG9ydHMuaW5pdEdvYWwgPSBpbml0R29hbDtcbmZ1bmN0aW9uIGlzRXF1YWwoZmlyc3QsIHNlY29uZCkge1xuICAgIGlmICghZmlyc3QgfHwgIXNlY29uZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoZmlyc3Quc3RhbXAgPT09IHNlY29uZC5zdGFtcCAmJiBmaXJzdC5pZCA9PT0gc2Vjb25kLmlkKTtcbn1cbmV4cG9ydHMuaXNFcXVhbCA9IGlzRXF1YWw7XG5mdW5jdGlvbiBpc0VxdWFsR29hbChmaXJzdCwgc2Vjb25kKSB7XG4gICAgaWYgKCFmaXJzdCB8fCAhc2Vjb25kKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzRXF1YWwoZmlyc3QuZ29hbF9pZCwgc2Vjb25kLmdvYWxfaWQpO1xufVxuZXhwb3J0cy5pc0VxdWFsR29hbCA9IGlzRXF1YWxHb2FsO1xuZnVuY3Rpb24gaXNFcXVhbFJlc3VsdChmaXJzdCwgc2Vjb25kKSB7XG4gICAgaWYgKCFmaXJzdCB8fCAhc2Vjb25kKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIChpc0VxdWFsKGZpcnN0LnN0YXR1cy5nb2FsX2lkLCBzZWNvbmQuc3RhdHVzLmdvYWxfaWQpXG4gICAgICAgICYmIGZpcnN0LnN0YXR1cy5zdGF0dXMgPT09IHNlY29uZC5zdGF0dXMuc3RhdHVzKTtcbn1cbmV4cG9ydHMuaXNFcXVhbFJlc3VsdCA9IGlzRXF1YWxSZXN1bHQ7XG5mdW5jdGlvbiBwb3dlcnVwKG1haW4sIGNvbm5lY3QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHNpbmtzID0gbWFpbihzb3VyY2VzKTtcbiAgICAgICAgT2JqZWN0LmtleXMoc291cmNlcy5wcm94aWVzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgY29ubmVjdChzb3VyY2VzLnByb3hpZXNba2V5XSwgc2lua3MudGFyZ2V0c1trZXldKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciB0YXJnZXRzID0gc2lua3MudGFyZ2V0cywgc2lua3NXaXRob3V0VGFyZ2V0cyA9IF9fcmVzdChzaW5rcywgW1widGFyZ2V0c1wiXSk7XG4gICAgICAgIHJldHVybiBzaW5rc1dpdGhvdXRUYXJnZXRzO1xuICAgIH07XG59XG5leHBvcnRzLnBvd2VydXAgPSBwb3dlcnVwO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbmZ1bmN0aW9uIGNoZWNrSXNvbGF0ZUFyZ3MoZGF0YWZsb3dDb21wb25lbnQsIHNjb3BlKSB7XG4gICAgaWYgKHR5cGVvZiBkYXRhZmxvd0NvbXBvbmVudCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGdpdmVuIHRvIGlzb2xhdGUoKSBtdXN0IGJlIGEgXCIgK1xuICAgICAgICAgICAgXCInZGF0YWZsb3dDb21wb25lbnQnIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgICBpZiAoc2NvcGUgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIGlzb2xhdGUoKSBtdXN0IG5vdCBiZSBudWxsXCIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNjb3Blcyhzb3VyY2VzLCBzY29wZXMsIHJhbmRvbVNjb3BlKSB7XG4gICAgdmFyIHBlckNoYW5uZWwgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhzb3VyY2VzKS5mb3JFYWNoKGZ1bmN0aW9uIChjaGFubmVsKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2NvcGVzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHNjb3BlcztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2FuZGlkYXRlID0gc2NvcGVzW2NoYW5uZWxdO1xuICAgICAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSBjYW5kaWRhdGU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdpbGRjYXJkID0gc2NvcGVzWycqJ107XG4gICAgICAgIGlmICh0eXBlb2Ygd2lsZGNhcmQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gd2lsZGNhcmQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHJhbmRvbVNjb3BlO1xuICAgIH0pO1xuICAgIHJldHVybiBwZXJDaGFubmVsO1xufVxuZnVuY3Rpb24gaXNvbGF0ZUFsbFNvdXJjZXMob3V0ZXJTb3VyY2VzLCBzY29wZXMpIHtcbiAgICB2YXIgaW5uZXJTb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgY2hhbm5lbCBpbiBvdXRlclNvdXJjZXMpIHtcbiAgICAgICAgdmFyIG91dGVyU291cmNlID0gb3V0ZXJTb3VyY2VzW2NoYW5uZWxdO1xuICAgICAgICBpZiAob3V0ZXJTb3VyY2VzLmhhc093blByb3BlcnR5KGNoYW5uZWwpICYmXG4gICAgICAgICAgICBvdXRlclNvdXJjZSAmJlxuICAgICAgICAgICAgc2NvcGVzW2NoYW5uZWxdICE9PSBudWxsICYmXG4gICAgICAgICAgICB0eXBlb2Ygb3V0ZXJTb3VyY2UuaXNvbGF0ZVNvdXJjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaW5uZXJTb3VyY2VzW2NoYW5uZWxdID0gb3V0ZXJTb3VyY2UuaXNvbGF0ZVNvdXJjZShvdXRlclNvdXJjZSwgc2NvcGVzW2NoYW5uZWxdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvdXRlclNvdXJjZXMuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkpIHtcbiAgICAgICAgICAgIGlubmVyU291cmNlc1tjaGFubmVsXSA9IG91dGVyU291cmNlc1tjaGFubmVsXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW5uZXJTb3VyY2VzO1xufVxuZnVuY3Rpb24gaXNvbGF0ZUFsbFNpbmtzKHNvdXJjZXMsIGlubmVyU2lua3MsIHNjb3Blcykge1xuICAgIHZhciBvdXRlclNpbmtzID0ge307XG4gICAgZm9yICh2YXIgY2hhbm5lbCBpbiBpbm5lclNpbmtzKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBzb3VyY2VzW2NoYW5uZWxdO1xuICAgICAgICB2YXIgaW5uZXJTaW5rID0gaW5uZXJTaW5rc1tjaGFubmVsXTtcbiAgICAgICAgaWYgKGlubmVyU2lua3MuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkgJiZcbiAgICAgICAgICAgIHNvdXJjZSAmJlxuICAgICAgICAgICAgc2NvcGVzW2NoYW5uZWxdICE9PSBudWxsICYmXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlLmlzb2xhdGVTaW5rID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBvdXRlclNpbmtzW2NoYW5uZWxdID0gYWRhcHRfMS5hZGFwdChzb3VyY2UuaXNvbGF0ZVNpbmsoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoaW5uZXJTaW5rKSwgc2NvcGVzW2NoYW5uZWxdKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaW5uZXJTaW5rcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSkge1xuICAgICAgICAgICAgb3V0ZXJTaW5rc1tjaGFubmVsXSA9IGlubmVyU2lua3NbY2hhbm5lbF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dGVyU2lua3M7XG59XG52YXIgY291bnRlciA9IDA7XG5mdW5jdGlvbiBuZXdTY29wZSgpIHtcbiAgICByZXR1cm4gXCJjeWNsZVwiICsgKytjb3VudGVyO1xufVxuLyoqXG4gKiBUYWtlcyBhIGBjb21wb25lbnRgIGZ1bmN0aW9uIGFuZCBhIGBzY29wZWAsIGFuZCByZXR1cm5zIGFuIGlzb2xhdGVkIHZlcnNpb25cbiAqIG9mIHRoZSBgY29tcG9uZW50YCBmdW5jdGlvbi5cbiAqXG4gKiBXaGVuIHRoZSBpc29sYXRlZCBjb21wb25lbnQgaXMgaW52b2tlZCwgZWFjaCBzb3VyY2UgcHJvdmlkZWQgdG8gaXQgaXNcbiAqIGlzb2xhdGVkIHRvIHRoZSBnaXZlbiBgc2NvcGVgIHVzaW5nIGBzb3VyY2UuaXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKWAsXG4gKiBpZiBwb3NzaWJsZS4gTGlrZXdpc2UsIHRoZSBzaW5rcyByZXR1cm5lZCBmcm9tIHRoZSBpc29sYXRlZCBjb21wb25lbnQgYXJlXG4gKiBpc29sYXRlZCB0byB0aGUgZ2l2ZW4gYHNjb3BlYCB1c2luZyBgc291cmNlLmlzb2xhdGVTaW5rKHNpbmssIHNjb3BlKWAuXG4gKlxuICogVGhlIGBzY29wZWAgY2FuIGJlIGEgc3RyaW5nIG9yIGFuIG9iamVjdC4gSWYgaXQgaXMgYW55dGhpbmcgZWxzZSB0aGFuIHRob3NlXG4gKiB0d28gdHlwZXMsIGl0IHdpbGwgYmUgY29udmVydGVkIHRvIGEgc3RyaW5nLiBJZiBgc2NvcGVgIGlzIGFuIG9iamVjdCwgaXRcbiAqIHJlcHJlc2VudHMgXCJzY29wZXMgcGVyIGNoYW5uZWxcIiwgYWxsb3dpbmcgeW91IHRvIHNwZWNpZnkgYSBkaWZmZXJlbnQgc2NvcGVcbiAqIGZvciBlYWNoIGtleSBvZiBzb3VyY2VzL3NpbmtzLiBGb3IgaW5zdGFuY2VcbiAqXG4gKiBgYGBqc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nLCBIVFRQOiAnYmFyJ30pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogWW91IGNhbiBhbHNvIHVzZSBhIHdpbGRjYXJkIGAnKidgIHRvIHVzZSBhcyBhIGRlZmF1bHQgZm9yIHNvdXJjZS9zaW5rc1xuICogY2hhbm5lbHMgdGhhdCBkaWQgbm90IHJlY2VpdmUgYSBzcGVjaWZpYyBzY29wZTpcbiAqXG4gKiBgYGBqc1xuICogLy8gVXNlcyAnYmFyJyBhcyB0aGUgaXNvbGF0aW9uIHNjb3BlIGZvciBIVFRQIGFuZCBvdGhlciBjaGFubmVsc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nLCAnKic6ICdiYXInfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBJZiBhIGNoYW5uZWwncyB2YWx1ZSBpcyBudWxsLCB0aGVuIHRoYXQgY2hhbm5lbCdzIHNvdXJjZXMgYW5kIHNpbmtzIHdvbid0IGJlXG4gKiBpc29sYXRlZC4gSWYgdGhlIHdpbGRjYXJkIGlzIG51bGwgYW5kIHNvbWUgY2hhbm5lbHMgYXJlIHVuc3BlY2lmaWVkLCB0aG9zZVxuICogY2hhbm5lbHMgd29uJ3QgYmUgaXNvbGF0ZWQuIElmIHlvdSBkb24ndCBoYXZlIGEgd2lsZGNhcmQgYW5kIHNvbWUgY2hhbm5lbHNcbiAqIGFyZSB1bnNwZWNpZmllZCwgdGhlbiBgaXNvbGF0ZWAgd2lsbCBnZW5lcmF0ZSBhIHJhbmRvbSBzY29wZS5cbiAqXG4gKiBgYGBqc1xuICogLy8gRG9lcyBub3QgaXNvbGF0ZSBIVFRQIHJlcXVlc3RzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2ZvbycsIEhUVFA6IG51bGx9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBgc2NvcGVgIGFyZ3VtZW50IGlzIG5vdCBwcm92aWRlZCBhdCBhbGwsIGEgbmV3IHNjb3BlIHdpbGwgYmVcbiAqIGF1dG9tYXRpY2FsbHkgY3JlYXRlZC4gVGhpcyBtZWFucyB0aGF0IHdoaWxlICoqYGlzb2xhdGUoY29tcG9uZW50LCBzY29wZSlgIGlzXG4gKiBwdXJlKiogKHJlZmVyZW50aWFsbHkgdHJhbnNwYXJlbnQpLCAqKmBpc29sYXRlKGNvbXBvbmVudClgIGlzIGltcHVyZSoqIChub3RcbiAqIHJlZmVyZW50aWFsbHkgdHJhbnNwYXJlbnQpLiBUd28gY2FsbHMgdG8gYGlzb2xhdGUoRm9vLCBiYXIpYCB3aWxsIGdlbmVyYXRlXG4gKiB0aGUgc2FtZSBjb21wb25lbnQuIEJ1dCwgdHdvIGNhbGxzIHRvIGBpc29sYXRlKEZvbylgIHdpbGwgZ2VuZXJhdGUgdHdvXG4gKiBkaXN0aW5jdCBjb21wb25lbnRzLlxuICpcbiAqIGBgYGpzXG4gKiAvLyBVc2VzIHNvbWUgYXJiaXRyYXJ5IHN0cmluZyBhcyB0aGUgaXNvbGF0aW9uIHNjb3BlIGZvciBIVFRQIGFuZCBvdGhlciBjaGFubmVsc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBOb3RlIHRoYXQgYm90aCBgaXNvbGF0ZVNvdXJjZSgpYCBhbmQgYGlzb2xhdGVTaW5rKClgIGFyZSBzdGF0aWMgbWVtYmVycyBvZlxuICogYHNvdXJjZWAuIFRoZSByZWFzb24gZm9yIHRoaXMgaXMgdGhhdCBkcml2ZXJzIHByb2R1Y2UgYHNvdXJjZWAgd2hpbGUgdGhlXG4gKiBhcHBsaWNhdGlvbiBwcm9kdWNlcyBgc2lua2AsIGFuZCBpdCdzIHRoZSBkcml2ZXIncyByZXNwb25zaWJpbGl0eSB0b1xuICogaW1wbGVtZW50IGBpc29sYXRlU291cmNlKClgIGFuZCBgaXNvbGF0ZVNpbmsoKWAuXG4gKlxuICogX05vdGUgZm9yIFR5cGVzY3JpcHQgdXNlcnM6XyBgaXNvbGF0ZWAgaXMgbm90IGN1cnJlbnRseSB0eXBlLXRyYW5zcGFyZW50IGFuZFxuICogd2lsbCBleHBsaWNpdGx5IGNvbnZlcnQgZ2VuZXJpYyB0eXBlIGFyZ3VtZW50cyB0byBgYW55YC4gVG8gcHJlc2VydmUgdHlwZXMgaW5cbiAqIHlvdXIgY29tcG9uZW50cywgeW91IGNhbiB1c2UgYSB0eXBlIGFzc2VydGlvbjpcbiAqXG4gKiBgYGB0c1xuICogLy8gaWYgQ2hpbGQgaXMgdHlwZWQgYENvbXBvbmVudDxTb3VyY2VzLCBTaW5rcz5gXG4gKiBjb25zdCBpc29sYXRlZENoaWxkID0gaXNvbGF0ZSggQ2hpbGQgKSBhcyBDb21wb25lbnQ8U291cmNlcywgU2lua3M+O1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcG9uZW50IGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXRcbiAqIGFuZCBvdXRwdXRzIGEgY29sbGVjdGlvbiBvZiBgc2lua3NgLlxuICogQHBhcmFtIHtTdHJpbmd9IHNjb3BlIGFuIG9wdGlvbmFsIHN0cmluZyB0aGF0IGlzIHVzZWQgdG8gaXNvbGF0ZSBlYWNoXG4gKiBgc291cmNlc2AgYW5kIGBzaW5rc2Agd2hlbiB0aGUgcmV0dXJuZWQgc2NvcGVkIGNvbXBvbmVudCBpcyBpbnZva2VkLlxuICogQHJldHVybiB7RnVuY3Rpb259IHRoZSBzY29wZWQgY29tcG9uZW50IGZ1bmN0aW9uIHRoYXQsIGFzIHRoZSBvcmlnaW5hbFxuICogYGNvbXBvbmVudGAgZnVuY3Rpb24sIHRha2VzIGBzb3VyY2VzYCBhbmQgcmV0dXJucyBgc2lua3NgLlxuICogQGZ1bmN0aW9uIGlzb2xhdGVcbiAqL1xuZnVuY3Rpb24gaXNvbGF0ZShjb21wb25lbnQsIHNjb3BlKSB7XG4gICAgaWYgKHNjb3BlID09PSB2b2lkIDApIHsgc2NvcGUgPSBuZXdTY29wZSgpOyB9XG4gICAgY2hlY2tJc29sYXRlQXJncyhjb21wb25lbnQsIHNjb3BlKTtcbiAgICB2YXIgcmFuZG9tU2NvcGUgPSB0eXBlb2Ygc2NvcGUgPT09ICdvYmplY3QnID8gbmV3U2NvcGUoKSA6ICcnO1xuICAgIHZhciBzY29wZXMgPSB0eXBlb2Ygc2NvcGUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzY29wZSA9PT0gJ29iamVjdCdcbiAgICAgICAgPyBzY29wZVxuICAgICAgICA6IHNjb3BlLnRvU3RyaW5nKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZWRDb21wb25lbnQob3V0ZXJTb3VyY2VzKSB7XG4gICAgICAgIHZhciByZXN0ID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICByZXN0W19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzY29wZXNQZXJDaGFubmVsID0gbm9ybWFsaXplU2NvcGVzKG91dGVyU291cmNlcywgc2NvcGVzLCByYW5kb21TY29wZSk7XG4gICAgICAgIHZhciBpbm5lclNvdXJjZXMgPSBpc29sYXRlQWxsU291cmNlcyhvdXRlclNvdXJjZXMsIHNjb3Blc1BlckNoYW5uZWwpO1xuICAgICAgICB2YXIgaW5uZXJTaW5rcyA9IGNvbXBvbmVudC5hcHBseSh2b2lkIDAsIFtpbm5lclNvdXJjZXNdLmNvbmNhdChyZXN0KSk7XG4gICAgICAgIHZhciBvdXRlclNpbmtzID0gaXNvbGF0ZUFsbFNpbmtzKG91dGVyU291cmNlcywgaW5uZXJTaW5rcywgc2NvcGVzUGVyQ2hhbm5lbCk7XG4gICAgICAgIHJldHVybiBvdXRlclNpbmtzO1xuICAgIH07XG59XG5pc29sYXRlLnJlc2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKGNvdW50ZXIgPSAwKTsgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGlzb2xhdGU7XG5mdW5jdGlvbiB0b0lzb2xhdGVkKHNjb3BlKSB7XG4gICAgaWYgKHNjb3BlID09PSB2b2lkIDApIHsgc2NvcGUgPSBuZXdTY29wZSgpOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjb21wb25lbnQpIHsgcmV0dXJuIGlzb2xhdGUoY29tcG9uZW50LCBzY29wZSk7IH07XG59XG5leHBvcnRzLnRvSXNvbGF0ZWQgPSB0b0lzb2xhdGVkO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfcG9ueWZpbGwgPSByZXF1aXJlKCcuL3BvbnlmaWxsLmpzJyk7XG5cbnZhciBfcG9ueWZpbGwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcG9ueWZpbGwpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciByb290OyAvKiBnbG9iYWwgd2luZG93ICovXG5cblxuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gc2VsZjtcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IG1vZHVsZTtcbn0gZWxzZSB7XG4gIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxuXG52YXIgcmVzdWx0ID0gKDAsIF9wb255ZmlsbDJbJ2RlZmF1bHQnXSkocm9vdCk7XG5leHBvcnRzWydkZWZhdWx0J10gPSByZXN1bHQ7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1snZGVmYXVsdCddID0gc3ltYm9sT2JzZXJ2YWJsZVBvbnlmaWxsO1xuZnVuY3Rpb24gc3ltYm9sT2JzZXJ2YWJsZVBvbnlmaWxsKHJvb3QpIHtcblx0dmFyIHJlc3VsdDtcblx0dmFyIF9TeW1ib2wgPSByb290LlN5bWJvbDtcblxuXHRpZiAodHlwZW9mIF9TeW1ib2wgPT09ICdmdW5jdGlvbicpIHtcblx0XHRpZiAoX1N5bWJvbC5vYnNlcnZhYmxlKSB7XG5cdFx0XHRyZXN1bHQgPSBfU3ltYm9sLm9ic2VydmFibGU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2woJ29ic2VydmFibGUnKTtcblx0XHRcdF9TeW1ib2wub2JzZXJ2YWJsZSA9IHJlc3VsdDtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmVzdWx0ID0gJ0BAb2JzZXJ2YWJsZSc7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCJpbXBvcnQge09wZXJhdG9yLCBTdHJlYW19IGZyb20gJy4uL2luZGV4JztcbmNvbnN0IGVtcHR5ID0ge307XG5cbmV4cG9ydCBjbGFzcyBEcm9wUmVwZWF0c09wZXJhdG9yPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkcm9wUmVwZWF0cyc7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPiA9IG51bGwgYXMgYW55O1xuICBwdWJsaWMgaXNFcTogKHg6IFQsIHk6IFQpID0+IGJvb2xlYW47XG4gIHByaXZhdGUgdjogVCA9IDxhbnk+IGVtcHR5O1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBpbnM6IFN0cmVhbTxUPixcbiAgICAgICAgICAgICAgZm46ICgoeDogVCwgeTogVCkgPT4gYm9vbGVhbikgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmlzRXEgPSBmbiA/IGZuIDogKHgsIHkpID0+IHggPT09IHk7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IG51bGwgYXMgYW55O1xuICAgIHRoaXMudiA9IGVtcHR5IGFzIGFueTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3QgdiA9IHRoaXMudjtcbiAgICBpZiAodiAhPT0gZW1wdHkgJiYgdGhpcy5pc0VxKHQsIHYpKSByZXR1cm47XG4gICAgdGhpcy52ID0gdDtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG4vKipcbiAqIERyb3BzIGNvbnNlY3V0aXZlIGR1cGxpY2F0ZSB2YWx1ZXMgaW4gYSBzdHJlYW0uXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0yLS0xLS0xLS0xLS0yLS0zLS00LS0zLS0zfFxuICogICAgIGRyb3BSZXBlYXRzXG4gKiAtLTEtLTItLTEtLS0tLS0tLTItLTMtLTQtLTMtLS18XG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZHJvcFJlcGVhdHMgZnJvbSAneHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0cydcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSB4cy5vZigxLCAyLCAxLCAxLCAxLCAyLCAzLCA0LCAzLCAzKVxuICogICAuY29tcG9zZShkcm9wUmVwZWF0cygpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAxXG4gKiA+IDJcbiAqID4gMVxuICogPiAyXG4gKiA+IDNcbiAqID4gNFxuICogPiAzXG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogRXhhbXBsZSB3aXRoIGEgY3VzdG9tIGlzRXF1YWwgZnVuY3Rpb246XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBkcm9wUmVwZWF0cyBmcm9tICd4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzJ1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IHhzLm9mKCdhJywgJ2InLCAnYScsICdBJywgJ0InLCAnYicpXG4gKiAgIC5jb21wb3NlKGRyb3BSZXBlYXRzKCh4LCB5KSA9PiB4LnRvTG93ZXJDYXNlKCkgPT09IHkudG9Mb3dlckNhc2UoKSkpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IGFcbiAqID4gYlxuICogPiBhXG4gKiA+IEJcbiAqID4gY29tcGxldGVkXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpc0VxdWFsIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIG9mIHR5cGVcbiAqIGAoeDogVCwgeTogVCkgPT4gYm9vbGVhbmAgdGhhdCB0YWtlcyBhbiBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gYW5kXG4gKiBjaGVja3MgaWYgaXQgaXMgZXF1YWwgdG8gcHJldmlvdXMgZXZlbnQsIGJ5IHJldHVybmluZyBhIGJvb2xlYW4uXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRyb3BSZXBlYXRzPFQ+KGlzRXF1YWw6ICgoeDogVCwgeTogVCkgPT4gYm9vbGVhbikgfCB1bmRlZmluZWQgPSB2b2lkIDApOiAoaW5zOiBTdHJlYW08VD4pID0+IFN0cmVhbTxUPiB7XG4gIHJldHVybiBmdW5jdGlvbiBkcm9wUmVwZWF0c09wZXJhdG9yKGluczogU3RyZWFtPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRHJvcFJlcGVhdHNPcGVyYXRvcjxUPihpbnMsIGlzRXF1YWwpKTtcbiAgfTtcbn1cbiIsImltcG9ydCAkJG9ic2VydmFibGUgZnJvbSAnc3ltYm9sLW9ic2VydmFibGUnO1xuXG5jb25zdCBOTyA9IHt9O1xuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmZ1bmN0aW9uIGNwPFQ+KGE6IEFycmF5PFQ+KTogQXJyYXk8VD4ge1xuICBjb25zdCBsID0gYS5sZW5ndGg7XG4gIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyArK2kpIGJbaV0gPSBhW2ldO1xuICByZXR1cm4gYjtcbn1cblxuZnVuY3Rpb24gYW5kPFQ+KGYxOiAodDogVCkgPT4gYm9vbGVhbiwgZjI6ICh0OiBUKSA9PiBib29sZWFuKTogKHQ6IFQpID0+IGJvb2xlYW4ge1xuICByZXR1cm4gZnVuY3Rpb24gYW5kRm4odDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmMSh0KSAmJiBmMih0KTtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIEZDb250YWluZXI8VCwgUj4ge1xuICBmKHQ6IFQpOiBSO1xufVxuXG5mdW5jdGlvbiBfdHJ5PFQsIFI+KGM6IEZDb250YWluZXI8VCwgUj4sIHQ6IFQsIHU6IFN0cmVhbTxhbnk+KTogUiB8IHt9IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYy5mKHQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdS5fZShlKTtcbiAgICByZXR1cm4gTk87XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgX246ICh2OiBUKSA9PiB2b2lkO1xuICBfZTogKGVycjogYW55KSA9PiB2b2lkO1xuICBfYzogKCkgPT4gdm9pZDtcbn1cblxuY29uc3QgTk9fSUw6IEludGVybmFsTGlzdGVuZXI8YW55PiA9IHtcbiAgX246IG5vb3AsXG4gIF9lOiBub29wLFxuICBfYzogbm9vcCxcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIF9zdGFydChsaXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQ7XG4gIF9zdG9wOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE91dFNlbmRlcjxUPiB7XG4gIG91dDogU3RyZWFtPFQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wZXJhdG9yPFQsIFI+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxSPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPFI+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnM6IFN0cmVhbTxUPjtcbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBZ2dyZWdhdG9yPFQsIFU+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxVPiwgT3V0U2VuZGVyPFU+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj47XG4gIF9zdGFydChvdXQ6IFN0cmVhbTxVPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvZHVjZXI8VD4ge1xuICBzdGFydDogKGxpc3RlbmVyOiBMaXN0ZW5lcjxUPikgPT4gdm9pZDtcbiAgc3RvcDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaXN0ZW5lcjxUPiB7XG4gIG5leHQ6ICh4OiBUKSA9PiB2b2lkO1xuICBlcnJvcjogKGVycjogYW55KSA9PiB2b2lkO1xuICBjb21wbGV0ZTogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb24ge1xuICB1bnN1YnNjcmliZSgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9ic2VydmFibGU8VD4ge1xuICBzdWJzY3JpYmUobGlzdGVuZXI6IExpc3RlbmVyPFQ+KTogU3Vic2NyaXB0aW9uO1xufVxuXG4vLyBtdXRhdGVzIHRoZSBpbnB1dFxuZnVuY3Rpb24gaW50ZXJuYWxpemVQcm9kdWNlcjxUPihwcm9kdWNlcjogUHJvZHVjZXI8VD4gJiBQYXJ0aWFsPEludGVybmFsUHJvZHVjZXI8VD4+KSB7XG4gIHByb2R1Y2VyLl9zdGFydCA9IGZ1bmN0aW9uIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPiAmIFBhcnRpYWw8TGlzdGVuZXI8VD4+KSB7XG4gICAgaWwubmV4dCA9IGlsLl9uO1xuICAgIGlsLmVycm9yID0gaWwuX2U7XG4gICAgaWwuY29tcGxldGUgPSBpbC5fYztcbiAgICB0aGlzLnN0YXJ0KGlsKTtcbiAgfTtcbiAgcHJvZHVjZXIuX3N0b3AgPSBwcm9kdWNlci5zdG9wO1xufVxuXG5jbGFzcyBTdHJlYW1TdWI8VD4gaW1wbGVtZW50cyBTdWJzY3JpcHRpb24ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zdHJlYW06IFN0cmVhbTxUPiwgcHJpdmF0ZSBfbGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pIHt9XG5cbiAgdW5zdWJzY3JpYmUoKTogdm9pZCB7XG4gICAgdGhpcy5fc3RyZWFtLl9yZW1vdmUodGhpcy5fbGlzdGVuZXIpO1xuICB9XG59XG5cbmNsYXNzIE9ic2VydmVyPFQ+IGltcGxlbWVudHMgTGlzdGVuZXI8VD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9saXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPikge31cblxuICBuZXh0KHZhbHVlOiBUKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX24odmFsdWUpO1xuICB9XG5cbiAgZXJyb3IoZXJyOiBhbnkpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fZShlcnIpO1xuICB9XG5cbiAgY29tcGxldGUoKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBGcm9tT2JzZXJ2YWJsZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tT2JzZXJ2YWJsZSc7XG4gIHB1YmxpYyBpbnM6IE9ic2VydmFibGU8VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBhY3RpdmU6IGJvb2xlYW47XG4gIHByaXZhdGUgX3N1YjogU3Vic2NyaXB0aW9uIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKG9ic2VydmFibGU6IE9ic2VydmFibGU8VD4pIHtcbiAgICB0aGlzLmlucyA9IG9ic2VydmFibGU7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLl9zdWIgPSB0aGlzLmlucy5zdWJzY3JpYmUobmV3IE9ic2VydmVyKG91dCkpO1xuICAgIGlmICghdGhpcy5hY3RpdmUpIHRoaXMuX3N1Yi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgX3N0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3N1YikgdGhpcy5fc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lcmdlU2lnbmF0dXJlIHtcbiAgKCk6IFN0cmVhbTxhbnk+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogU3RyZWFtPFQxPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiBTdHJlYW08VDEgfCBUMj47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IFN0cmVhbTxUMSB8IFQyIHwgVDM+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDY+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOD47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4IHwgVDk+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5PixcbiAgICBzMTA6IFN0cmVhbTxUMTA+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDggfCBUOSB8IFQxMD47XG4gIDxUPiguLi5zdHJlYW06IEFycmF5PFN0cmVhbTxUPj4pOiBTdHJlYW08VD47XG59XG5cbmNsYXNzIE1lcmdlPFQ+IGltcGxlbWVudHMgQWdncmVnYXRvcjxULCBUPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ21lcmdlJztcbiAgcHVibGljIGluc0FycjogQXJyYXk8U3RyZWFtPFQ+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGFjOiBudW1iZXI7IC8vIGFjIGlzIGFjdGl2ZUNvdW50XG5cbiAgY29uc3RydWN0b3IoaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+KSB7XG4gICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5hYyA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgTCA9IHMubGVuZ3RoO1xuICAgIHRoaXMuYWMgPSBMO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBzW2ldLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgTCA9IHMubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBzW2ldLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBpZiAoLS10aGlzLmFjIDw9IDApIHtcbiAgICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgICAgdS5fYygpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbWJpbmVTaWduYXR1cmUge1xuICAoKTogU3RyZWFtPEFycmF5PGFueT4+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogU3RyZWFtPFtUMV0+O1xuICA8VDEsIFQyPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPik6IFN0cmVhbTxbVDEsIFQyXT47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IFN0cmVhbTxbVDEsIFQyLCBUM10+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNl0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUN10+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5PixcbiAgICBzMTA6IFN0cmVhbTxUMTA+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTBdPjtcbiAgKC4uLnN0cmVhbTogQXJyYXk8U3RyZWFtPGFueT4+KTogU3RyZWFtPEFycmF5PGFueT4+O1xufVxuXG5jbGFzcyBDb21iaW5lTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8QXJyYXk8VD4+IHtcbiAgcHJpdmF0ZSBpOiBudW1iZXI7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxUPj47XG4gIHByaXZhdGUgcDogQ29tYmluZTxUPjtcblxuICBjb25zdHJ1Y3RvcihpOiBudW1iZXIsIG91dDogU3RyZWFtPEFycmF5PFQ+PiwgcDogQ29tYmluZTxUPikge1xuICAgIHRoaXMuaSA9IGk7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5wID0gcDtcbiAgICBwLmlscy5wdXNoKHRoaXMpO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHAudXAodCwgdGhpcy5pKSkge1xuICAgICAgY29uc3QgYSA9IHAudmFscztcbiAgICAgIGNvbnN0IGwgPSBhLmxlbmd0aDtcbiAgICAgIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbDsgKytpKSBiW2ldID0gYVtpXTtcbiAgICAgIG91dC5fbihiKTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgb3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wO1xuICAgIGlmIChwLm91dCA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAoLS1wLk5jID09PSAwKSBwLm91dC5fYygpO1xuICB9XG59XG5cbmNsYXNzIENvbWJpbmU8Uj4gaW1wbGVtZW50cyBBZ2dyZWdhdG9yPGFueSwgQXJyYXk8Uj4+IHtcbiAgcHVibGljIHR5cGUgPSAnY29tYmluZSc7XG4gIHB1YmxpYyBpbnNBcnI6IEFycmF5PFN0cmVhbTxhbnk+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPEFycmF5PFI+PjtcbiAgcHVibGljIGlsczogQXJyYXk8Q29tYmluZUxpc3RlbmVyPGFueT4+O1xuICBwdWJsaWMgTmM6IG51bWJlcjsgLy8gKk4qdW1iZXIgb2Ygc3RyZWFtcyBzdGlsbCB0byBzZW5kICpjKm9tcGxldGVcbiAgcHVibGljIE5uOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqbipleHRcbiAgcHVibGljIHZhbHM6IEFycmF5PFI+O1xuXG4gIGNvbnN0cnVjdG9yKGluc0FycjogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8Uj4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy5OYyA9IHRoaXMuTm4gPSAwO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG5cbiAgdXAodDogYW55LCBpOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCB2ID0gdGhpcy52YWxzW2ldO1xuICAgIGNvbnN0IE5uID0gIXRoaXMuTm4gPyAwIDogdiA9PT0gTk8gPyAtLXRoaXMuTm4gOiB0aGlzLk5uO1xuICAgIHRoaXMudmFsc1tpXSA9IHQ7XG4gICAgcmV0dXJuIE5uID09PSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPEFycmF5PFI+Pik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBuID0gdGhpcy5OYyA9IHRoaXMuTm4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCB2YWxzID0gdGhpcy52YWxzID0gbmV3IEFycmF5KG4pO1xuICAgIGlmIChuID09PSAwKSB7XG4gICAgICBvdXQuX24oW10pO1xuICAgICAgb3V0Ll9jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHZhbHNbaV0gPSBOTztcbiAgICAgICAgc1tpXS5fYWRkKG5ldyBDb21iaW5lTGlzdGVuZXIoaSwgb3V0LCB0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IG4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCBpbHMgPSB0aGlzLmlscztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykgc1tpXS5fcmVtb3ZlKGlsc1tpXSk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8Uj4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy52YWxzID0gW107XG4gIH1cbn1cblxuY2xhc3MgRnJvbUFycmF5PFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21BcnJheSc7XG4gIHB1YmxpYyBhOiBBcnJheTxUPjtcblxuICBjb25zdHJ1Y3RvcihhOiBBcnJheTxUPikge1xuICAgIHRoaXMuYSA9IGE7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuYTtcbiAgICBmb3IgKGxldCBpID0gMCwgbiA9IGEubGVuZ3RoOyBpIDwgbjsgaSsrKSBvdXQuX24oYVtpXSk7XG4gICAgb3V0Ll9jKCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgfVxufVxuXG5jbGFzcyBGcm9tUHJvbWlzZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tUHJvbWlzZSc7XG4gIHB1YmxpYyBvbjogYm9vbGVhbjtcbiAgcHVibGljIHA6IFByb21pc2VMaWtlPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKHA6IFByb21pc2VMaWtlPFQ+KSB7XG4gICAgdGhpcy5vbiA9IGZhbHNlO1xuICAgIHRoaXMucCA9IHA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgcHJvZCA9IHRoaXM7XG4gICAgdGhpcy5vbiA9IHRydWU7XG4gICAgdGhpcy5wLnRoZW4oXG4gICAgICAodjogVCkgPT4ge1xuICAgICAgICBpZiAocHJvZC5vbikge1xuICAgICAgICAgIG91dC5fbih2KTtcbiAgICAgICAgICBvdXQuX2MoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIChlOiBhbnkpID0+IHtcbiAgICAgICAgb3V0Ll9lKGUpO1xuICAgICAgfSxcbiAgICApLnRoZW4obm9vcCwgKGVycjogYW55KSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhyb3cgZXJyOyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMub24gPSBmYWxzZTtcbiAgfVxufVxuXG5jbGFzcyBQZXJpb2RpYyBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8bnVtYmVyPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3BlcmlvZGljJztcbiAgcHVibGljIHBlcmlvZDogbnVtYmVyO1xuICBwcml2YXRlIGludGVydmFsSUQ6IGFueTtcbiAgcHJpdmF0ZSBpOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IocGVyaW9kOiBudW1iZXIpIHtcbiAgICB0aGlzLnBlcmlvZCA9IHBlcmlvZDtcbiAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICB0aGlzLmkgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxudW1iZXI+KTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gaW50ZXJ2YWxIYW5kbGVyKCkgeyBvdXQuX24oc2VsZi5pKyspOyB9XG4gICAgdGhpcy5pbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGVyLCB0aGlzLnBlcmlvZCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pbnRlcnZhbElEICE9PSAtMSkgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSUQpO1xuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IC0xO1xuICAgIHRoaXMuaSA9IDA7XG4gIH1cbn1cblxuY2xhc3MgRGVidWc8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2RlYnVnJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgczogKHQ6IFQpID0+IGFueTsgLy8gc3B5XG4gIHByaXZhdGUgbDogc3RyaW5nOyAvLyBsYWJlbFxuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiAodDogVCkgPT4gYW55KTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnMgPSBub29wO1xuICAgIHRoaXMubCA9ICcnO1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgdGhpcy5sID0gYXJnOyBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB0aGlzLnMgPSBhcmc7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgcyA9IHRoaXMucywgbCA9IHRoaXMubDtcbiAgICBpZiAocyAhPT0gbm9vcCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcyh0KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdS5fZShlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGwpIGNvbnNvbGUubG9nKGwgKyAnOicsIHQpOyBlbHNlIGNvbnNvbGUubG9nKHQpO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIERyb3A8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Ryb3AnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG1heDogbnVtYmVyO1xuICBwcml2YXRlIGRyb3BwZWQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihtYXg6IG51bWJlciwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm1heCA9IG1heDtcbiAgICB0aGlzLmRyb3BwZWQgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5kcm9wcGVkID0gMDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuZHJvcHBlZCsrID49IHRoaXMubWF4KSB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBFbmRXaGVuTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPGFueT4ge1xuICBwcml2YXRlIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wOiBFbmRXaGVuPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKG91dDogU3RyZWFtPFQ+LCBvcDogRW5kV2hlbjxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3AgPSBvcDtcbiAgfVxuXG4gIF9uKCkge1xuICAgIHRoaXMub3AuZW5kKCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIHRoaXMub3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wLmVuZCgpO1xuICB9XG59XG5cbmNsYXNzIEVuZFdoZW48VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2VuZFdoZW4nO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG86IFN0cmVhbTxhbnk+OyAvLyBvID0gb3RoZXJcbiAgcHJpdmF0ZSBvaWw6IEludGVybmFsTGlzdGVuZXI8YW55PjsgLy8gb2lsID0gb3RoZXIgSW50ZXJuYWxMaXN0ZW5lclxuXG4gIGNvbnN0cnVjdG9yKG86IFN0cmVhbTxhbnk+LCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubyA9IG87XG4gICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuby5fYWRkKHRoaXMub2lsID0gbmV3IEVuZFdoZW5MaXN0ZW5lcihvdXQsIHRoaXMpKTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm8uX3JlbW92ZSh0aGlzLm9pbCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgfVxuXG4gIGVuZCgpOiB2b2lkIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5lbmQoKTtcbiAgfVxufVxuXG5jbGFzcyBGaWx0ZXI8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZpbHRlcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmYgPSBwYXNzZXM7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PIHx8ICFyKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRmxhdHRlbkxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHByaXZhdGUgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3A6IEZsYXR0ZW48VD47XG5cbiAgY29uc3RydWN0b3Iob3V0OiBTdHJlYW08VD4sIG9wOiBGbGF0dGVuPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcCA9IG9wO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIHRoaXMub3V0Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICB0aGlzLm91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcC5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wLmxlc3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGbGF0dGVuPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8U3RyZWFtPFQ+LCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZsYXR0ZW4nO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08U3RyZWFtPFQ+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wZW46IGJvb2xlYW47XG4gIHB1YmxpYyBpbm5lcjogU3RyZWFtPFQ+OyAvLyBDdXJyZW50IGlubmVyIFN0cmVhbVxuICBwcml2YXRlIGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+OyAvLyBDdXJyZW50IGlubmVyIEludGVybmFsTGlzdGVuZXJcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxTdHJlYW08VD4+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgaWYgKHRoaXMuaW5uZXIgIT09IE5PKSB0aGlzLmlubmVyLl9yZW1vdmUodGhpcy5pbCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgfVxuXG4gIGxlc3MoKTogdm9pZCB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICghdGhpcy5vcGVuICYmIHRoaXMuaW5uZXIgPT09IE5PKSB1Ll9jKCk7XG4gIH1cblxuICBfbihzOiBTdHJlYW08VD4pIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3Qge2lubmVyLCBpbH0gPSB0aGlzO1xuICAgIGlmIChpbm5lciAhPT0gTk8gJiYgaWwgIT09IE5PX0lMKSBpbm5lci5fcmVtb3ZlKGlsKTtcbiAgICAodGhpcy5pbm5lciA9IHMpLl9hZGQodGhpcy5pbCA9IG5ldyBGbGF0dGVuTGlzdGVuZXIodSwgdGhpcykpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcGVuID0gZmFsc2U7XG4gICAgdGhpcy5sZXNzKCk7XG4gIH1cbn1cblxuY2xhc3MgRm9sZDxULCBSPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFI+IHtcbiAgcHVibGljIHR5cGUgPSAnZm9sZCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFI+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IFI7XG4gIHB1YmxpYyBzZWVkOiBSO1xuICBwcml2YXRlIGFjYzogUjsgLy8gaW5pdGlhbGl6ZWQgYXMgc2VlZFxuXG4gIGNvbnN0cnVjdG9yKGY6IChhY2M6IFIsIHQ6IFQpID0+IFIsIHNlZWQ6IFIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5mID0gKHQ6IFQpID0+IGYodGhpcy5hY2MsIHQpO1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkID0gc2VlZDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICAgIG91dC5fbih0aGlzLmFjYyk7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQ7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odGhpcy5hY2MgPSByIGFzIFIpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBMYXN0PFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdsYXN0JztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgaGFzOiBib29sZWFuO1xuICBwcml2YXRlIHZhbDogVDtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgdGhpcy52YWwgPSBOTyBhcyBUO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5oYXMgPSBmYWxzZTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnZhbCA9IE5PIGFzIFQ7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgdGhpcy5oYXMgPSB0cnVlO1xuICAgIHRoaXMudmFsID0gdDtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAodGhpcy5oYXMpIHtcbiAgICAgIHUuX24odGhpcy52YWwpO1xuICAgICAgdS5fYygpO1xuICAgIH0gZWxzZSB1Ll9lKG5ldyBFcnJvcignbGFzdCgpIGZhaWxlZCBiZWNhdXNlIGlucHV0IHN0cmVhbSBjb21wbGV0ZWQnKSk7XG4gIH1cbn1cblxuY2xhc3MgTWFwT3A8VCwgUj4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBSPiB7XG4gIHB1YmxpYyB0eXBlID0gJ21hcCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFI+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IFI7XG5cbiAgY29uc3RydWN0b3IocHJvamVjdDogKHQ6IFQpID0+IFIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5mID0gcHJvamVjdDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHIgYXMgUik7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIFJlbWVtYmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3JlbWVtYmVyJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG59XG5cbmNsYXNzIFJlcGxhY2VFcnJvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAncmVwbGFjZUVycm9yJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBmOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPjtcblxuICBjb25zdHJ1Y3RvcihyZXBsYWNlcjogKGVycjogYW55KSA9PiBTdHJlYW08VD4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5mID0gcmVwbGFjZXI7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgKHRoaXMuaW5zID0gdGhpcy5mKGVycikpLl9hZGQodGhpcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdS5fZShlKTtcbiAgICB9XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIFN0YXJ0V2l0aDxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdzdGFydFdpdGgnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIHZhbDogVDtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgdmFsOiBUKSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy52YWwgPSB2YWw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm91dC5fbih0aGlzLnZhbCk7XG4gICAgdGhpcy5pbnMuX2FkZChvdXQpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzLm91dCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cbn1cblxuY2xhc3MgVGFrZTxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAndGFrZSc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbWF4OiBudW1iZXI7XG4gIHByaXZhdGUgdGFrZW46IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihtYXg6IG51bWJlciwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm1heCA9IG1heDtcbiAgICB0aGlzLnRha2VuID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMudGFrZW4gPSAwO1xuICAgIGlmICh0aGlzLm1heCA8PSAwKSBvdXQuX2MoKTsgZWxzZSB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgbSA9ICsrdGhpcy50YWtlbjtcbiAgICBpZiAobSA8IHRoaXMubWF4KSB1Ll9uKHQpOyBlbHNlIGlmIChtID09PSB0aGlzLm1heCkge1xuICAgICAgdS5fbih0KTtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJlYW08VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHVibGljIF9wcm9kOiBJbnRlcm5hbFByb2R1Y2VyPFQ+O1xuICBwcm90ZWN0ZWQgX2lsczogQXJyYXk8SW50ZXJuYWxMaXN0ZW5lcjxUPj47IC8vICdpbHMnID0gSW50ZXJuYWwgbGlzdGVuZXJzXG4gIHByb3RlY3RlZCBfc3RvcElEOiBhbnk7XG4gIHByb3RlY3RlZCBfZGw6IEludGVybmFsTGlzdGVuZXI8VD47IC8vIHRoZSBkZWJ1ZyBsaXN0ZW5lclxuICBwcm90ZWN0ZWQgX2Q6IGJvb2xlYW47IC8vIGZsYWcgaW5kaWNhdGluZyB0aGUgZXhpc3RlbmNlIG9mIHRoZSBkZWJ1ZyBsaXN0ZW5lclxuICBwcm90ZWN0ZWQgX3RhcmdldDogU3RyZWFtPFQ+OyAvLyBpbWl0YXRpb24gdGFyZ2V0IGlmIHRoaXMgU3RyZWFtIHdpbGwgaW1pdGF0ZVxuICBwcm90ZWN0ZWQgX2VycjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHByb2R1Y2VyPzogSW50ZXJuYWxQcm9kdWNlcjxUPikge1xuICAgIHRoaXMuX3Byb2QgPSBwcm9kdWNlciB8fCBOTyBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+O1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIHRoaXMuX2RsID0gTk8gYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgdGhpcy5fdGFyZ2V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fbih0KTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9uKHQpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fbih0KTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9lcnIgIT09IE5PKSByZXR1cm47XG4gICAgdGhpcy5fZXJyID0gZXJyO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIHRoaXMuX3goKTtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX2UoZXJyKTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9lKGVycik7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9lKGVycik7XG4gICAgfVxuICAgIGlmICghdGhpcy5fZCAmJiBMID09IDApIHRocm93IHRoaXMuX2VycjtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIHRoaXMuX3goKTtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX2MoKTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9jKCk7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9jKCk7XG4gICAgfVxuICB9XG5cbiAgX3goKTogdm9pZCB7IC8vIHRlYXIgZG93biBsb2dpYywgYWZ0ZXIgZXJyb3Igb3IgY29tcGxldGVcbiAgICBpZiAodGhpcy5faWxzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTykgdGhpcy5fcHJvZC5fc3RvcCgpO1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgLy8gV0FSTklORzogY29kZSB0aGF0IGNhbGxzIHRoaXMgbWV0aG9kIHNob3VsZFxuICAgIC8vIGZpcnN0IGNoZWNrIGlmIHRoaXMuX3Byb2QgaXMgdmFsaWQgKG5vdCBgTk9gKVxuICAgIHRoaXMuX3Byb2QuX3N0b3AoKTtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHJldHVybjtcbiAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3N0b3BJRCk7XG4gICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgICBpZiAocCAhPT0gTk8pIHAuX3N0YXJ0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF9yZW1vdmUoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX3JlbW92ZShpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBpID0gYS5pbmRleE9mKGlsKTtcbiAgICBpZiAoaSA+IC0xKSB7XG4gICAgICBhLnNwbGljZShpLCAxKTtcbiAgICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTyAmJiBhLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgIHRoaXMuX2VyciA9IE5PO1xuICAgICAgICB0aGlzLl9zdG9wSUQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3N0b3BOb3coKSk7XG4gICAgICB9IGVsc2UgaWYgKGEubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHRoaXMuX3BydW5lQ3ljbGVzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgYWxsIHBhdGhzIHN0ZW1taW5nIGZyb20gYHRoaXNgIHN0cmVhbSBldmVudHVhbGx5IGVuZCBhdCBgdGhpc2BcbiAgLy8gc3RyZWFtLCB0aGVuIHdlIHJlbW92ZSB0aGUgc2luZ2xlIGxpc3RlbmVyIG9mIGB0aGlzYCBzdHJlYW0sIHRvXG4gIC8vIGZvcmNlIGl0IHRvIGVuZCBpdHMgZXhlY3V0aW9uIGFuZCBkaXNwb3NlIHJlc291cmNlcy4gVGhpcyBtZXRob2RcbiAgLy8gYXNzdW1lcyBhcyBhIHByZWNvbmRpdGlvbiB0aGF0IHRoaXMuX2lscyBoYXMganVzdCBvbmUgbGlzdGVuZXIuXG4gIF9wcnVuZUN5Y2xlcygpIHtcbiAgICBpZiAodGhpcy5faGFzTm9TaW5rcyh0aGlzLCBbXSkpIHRoaXMuX3JlbW92ZSh0aGlzLl9pbHNbMF0pO1xuICB9XG5cbiAgLy8gQ2hlY2tzIHdoZXRoZXIgKnRoZXJlIGlzIG5vKiBwYXRoIHN0YXJ0aW5nIGZyb20gYHhgIHRoYXQgbGVhZHMgdG8gYW4gZW5kXG4gIC8vIGxpc3RlbmVyIChzaW5rKSBpbiB0aGUgc3RyZWFtIGdyYXBoLCBmb2xsb3dpbmcgZWRnZXMgQS0+QiB3aGVyZSBCIGlzIGFcbiAgLy8gbGlzdGVuZXIgb2YgQS4gVGhpcyBtZWFucyB0aGVzZSBwYXRocyBjb25zdGl0dXRlIGEgY3ljbGUgc29tZWhvdy4gSXMgZ2l2ZW5cbiAgLy8gYSB0cmFjZSBvZiBhbGwgdmlzaXRlZCBub2RlcyBzbyBmYXIuXG4gIF9oYXNOb1NpbmtzKHg6IEludGVybmFsTGlzdGVuZXI8YW55PiwgdHJhY2U6IEFycmF5PGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAodHJhY2UuaW5kZXhPZih4KSAhPT0gLTEpXG4gICAgICByZXR1cm4gdHJ1ZTsgZWxzZVxuICAgIGlmICgoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCA9PT0gdGhpcylcbiAgICAgIHJldHVybiB0cnVlOyBlbHNlXG4gICAgaWYgKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ICYmICh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ICE9PSBOTylcbiAgICAgIHJldHVybiB0aGlzLl9oYXNOb1NpbmtzKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0LCB0cmFjZS5jb25jYXQoeCkpOyBlbHNlXG4gICAgaWYgKCh4IGFzIFN0cmVhbTxhbnk+KS5faWxzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgTiA9ICh4IGFzIFN0cmVhbTxhbnk+KS5faWxzLmxlbmd0aDsgaSA8IE47IGkrKylcbiAgICAgICAgaWYgKCF0aGlzLl9oYXNOb1NpbmtzKCh4IGFzIFN0cmVhbTxhbnk+KS5faWxzW2ldLCB0cmFjZS5jb25jYXQoeCkpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGN0b3IoKTogdHlwZW9mIFN0cmVhbSB7XG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBNZW1vcnlTdHJlYW0gPyBNZW1vcnlTdHJlYW0gOiBTdHJlYW07XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIExpc3RlbmVyIHRvIHRoZSBTdHJlYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXJ9IGxpc3RlbmVyXG4gICAqL1xuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiB2b2lkIHtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX24gPSBsaXN0ZW5lci5uZXh0IHx8IG5vb3A7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2MgPSBsaXN0ZW5lci5jb21wbGV0ZSB8fCBub29wO1xuICAgIHRoaXMuX2FkZChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgTGlzdGVuZXIgZnJvbSB0aGUgU3RyZWFtLCBhc3N1bWluZyB0aGUgTGlzdGVuZXIgd2FzIGFkZGVkIHRvIGl0LlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgKi9cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogdm9pZCB7XG4gICAgdGhpcy5fcmVtb3ZlKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtIHJldHVybmluZyBhIFN1YnNjcmlwdGlvbiB0byByZW1vdmUgdGhhdFxuICAgKiBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcn0gbGlzdGVuZXJcbiAgICogQHJldHVybnMge1N1YnNjcmlwdGlvbn1cbiAgICovXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiBTdWJzY3JpcHRpb24ge1xuICAgIHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiBuZXcgU3RyZWFtU3ViPFQ+KHRoaXMsIGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBpbnRlcm9wIGJldHdlZW4gbW9zdC5qcyBhbmQgUnhKUyA1XG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJlYW19XG4gICAqL1xuICBbJCRvYnNlcnZhYmxlXSgpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgU3RyZWFtIGdpdmVuIGEgUHJvZHVjZXIuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9kdWNlcn0gcHJvZHVjZXIgQW4gb3B0aW9uYWwgUHJvZHVjZXIgdGhhdCBkaWN0YXRlcyBob3cgdG9cbiAgICogc3RhcnQsIGdlbmVyYXRlIGV2ZW50cywgYW5kIHN0b3AgdGhlIFN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZTxUPihwcm9kdWNlcj86IFByb2R1Y2VyPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAocHJvZHVjZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgcHJvZHVjZXIuc3RhcnQgIT09ICdmdW5jdGlvbidcbiAgICAgIHx8IHR5cGVvZiBwcm9kdWNlci5zdG9wICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2R1Y2VyIHJlcXVpcmVzIGJvdGggc3RhcnQgYW5kIHN0b3AgZnVuY3Rpb25zJyk7XG4gICAgICBpbnRlcm5hbGl6ZVByb2R1Y2VyKHByb2R1Y2VyKTsgLy8gbXV0YXRlcyB0aGUgaW5wdXRcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTdHJlYW0ocHJvZHVjZXIgYXMgSW50ZXJuYWxQcm9kdWNlcjxUPiAmIFByb2R1Y2VyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE1lbW9yeVN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGVXaXRoTWVtb3J5PFQ+KHByb2R1Y2VyPzogUHJvZHVjZXI8VD4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIGlmIChwcm9kdWNlcikgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4ocHJvZHVjZXIgYXMgSW50ZXJuYWxQcm9kdWNlcjxUPiAmIFByb2R1Y2VyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgZG9lcyBub3RoaW5nIHdoZW4gc3RhcnRlZC4gSXQgbmV2ZXIgZW1pdHMgYW55IGV2ZW50LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAgICAgICAgICBuZXZlclxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgbmV2ZXIoKTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe19zdGFydDogbm9vcCwgX3N0b3A6IG5vb3B9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgdGhlIFwiY29tcGxldGVcIiBub3RpZmljYXRpb24gd2hlblxuICAgKiBzdGFydGVkLCBhbmQgdGhhdCdzIGl0LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBlbXB0eVxuICAgKiAtfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZW1wdHkoKTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe1xuICAgICAgX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHsgaWwuX2MoKTsgfSxcbiAgICAgIF9zdG9wOiBub29wLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyBhbiBcImVycm9yXCIgbm90aWZpY2F0aW9uIHdpdGggdGhlXG4gICAqIHZhbHVlIHlvdSBwYXNzZWQgYXMgdGhlIGBlcnJvcmAgYXJndW1lbnQgd2hlbiB0aGUgc3RyZWFtIHN0YXJ0cywgYW5kIHRoYXQnc1xuICAgKiBpdC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogdGhyb3coWClcbiAgICogLVhcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIGVycm9yIFRoZSBlcnJvciBldmVudCB0byBlbWl0IG9uIHRoZSBjcmVhdGVkIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIHRocm93KGVycm9yOiBhbnkpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7XG4gICAgICBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8YW55PikgeyBpbC5fZShlcnJvcik7IH0sXG4gICAgICBfc3RvcDogbm9vcCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RyZWFtIGZyb20gYW4gQXJyYXksIFByb21pc2UsIG9yIGFuIE9ic2VydmFibGUuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtBcnJheXxQcm9taXNlTGlrZXxPYnNlcnZhYmxlfSBpbnB1dCBUaGUgaW5wdXQgdG8gbWFrZSBhIHN0cmVhbSBmcm9tLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbTxUPihpbnB1dDogUHJvbWlzZUxpa2U8VD4gfCBTdHJlYW08VD4gfCBBcnJheTxUPiB8IE9ic2VydmFibGU8VD4pOiBTdHJlYW08VD4ge1xuICAgIGlmICh0eXBlb2YgaW5wdXRbJCRvYnNlcnZhYmxlXSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbU9ic2VydmFibGU8VD4oaW5wdXQgYXMgT2JzZXJ2YWJsZTxUPik7IGVsc2VcbiAgICBpZiAodHlwZW9mIChpbnB1dCBhcyBQcm9taXNlTGlrZTxUPikudGhlbiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbVByb21pc2U8VD4oaW5wdXQgYXMgUHJvbWlzZUxpa2U8VD4pOyBlbHNlXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXk8VD4oaW5wdXQpO1xuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVHlwZSBvZiBpbnB1dCB0byBmcm9tKCkgbXVzdCBiZSBhbiBBcnJheSwgUHJvbWlzZSwgb3IgT2JzZXJ2YWJsZWApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyB0aGUgYXJndW1lbnRzIHRoYXQgeW91IGdpdmUgdG9cbiAgICogKm9mKiwgdGhlbiBjb21wbGV0ZXMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIG9mKDEsMiwzKVxuICAgKiAxMjN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSBhIFRoZSBmaXJzdCB2YWx1ZSB5b3Ugd2FudCB0byBlbWl0IGFzIGFuIGV2ZW50IG9uIHRoZSBzdHJlYW0uXG4gICAqIEBwYXJhbSBiIFRoZSBzZWNvbmQgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLiBPbmVcbiAgICogb3IgbW9yZSBvZiB0aGVzZSB2YWx1ZXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG9mPFQ+KC4uLml0ZW1zOiBBcnJheTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXk8VD4oaXRlbXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIGFycmF5IHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCBzeW5jaHJvbm91c2x5XG4gICAqIGFsbCB0aGUgaXRlbXMgaW4gdGhlIGFycmF5LCBhbmQgdGhlbiBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZnJvbUFycmF5KFsxLDIsM10pXG4gICAqIDEyM3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21BcnJheTxUPihhcnJheTogQXJyYXk8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tQXJyYXk8VD4oYXJyYXkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIHByb21pc2UgdG8gYSBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gd2lsbCBlbWl0IHRoZSByZXNvbHZlZFxuICAgKiB2YWx1ZSBvZiB0aGUgcHJvbWlzZSwgYW5kIHRoZW4gY29tcGxldGUuIEhvd2V2ZXIsIGlmIHRoZSBwcm9taXNlIGlzXG4gICAqIHJlamVjdGVkLCB0aGUgc3RyZWFtIHdpbGwgZW1pdCB0aGUgY29ycmVzcG9uZGluZyBlcnJvci5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZnJvbVByb21pc2UoIC0tLS00MiApXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tNDJ8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvbWlzZUxpa2V9IHByb21pc2UgVGhlIHByb21pc2UgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbVByb21pc2U8VD4ocHJvbWlzZTogUHJvbWlzZUxpa2U8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tUHJvbWlzZTxUPihwcm9taXNlKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYW4gT2JzZXJ2YWJsZSBpbnRvIGEgU3RyZWFtLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7YW55fSBvYnNlcnZhYmxlIFRoZSBvYnNlcnZhYmxlIHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21PYnNlcnZhYmxlPFQ+KG9iczoge3N1YnNjcmliZTogYW55fSk6IFN0cmVhbTxUPiB7XG4gICAgaWYgKChvYnMgYXMgU3RyZWFtPFQ+KS5lbmRXaGVuKSByZXR1cm4gb2JzIGFzIFN0cmVhbTxUPjtcbiAgICBjb25zdCBvID0gdHlwZW9mIG9ic1skJG9ic2VydmFibGVdID09PSAnZnVuY3Rpb24nID8gb2JzWyQkb2JzZXJ2YWJsZV0oKSA6IG9icztcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbU9ic2VydmFibGUobykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzdHJlYW0gdGhhdCBwZXJpb2RpY2FsbHkgZW1pdHMgaW5jcmVtZW50YWwgbnVtYmVycywgZXZlcnlcbiAgICogYHBlcmlvZGAgbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAgICAgcGVyaW9kaWMoMTAwMClcbiAgICogLS0tMC0tLTEtLS0yLS0tMy0tLTQtLS0uLi5cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHBlcmlvZCBUaGUgaW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzIHRvIHVzZSBhcyBhIHJhdGUgb2ZcbiAgICogZW1pc3Npb24uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBwZXJpb2RpYyhwZXJpb2Q6IG51bWJlcik6IFN0cmVhbTxudW1iZXI+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxudW1iZXI+KG5ldyBQZXJpb2RpYyhwZXJpb2QpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCbGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgZW1pdHRpbmcgZXZlbnRzIGZyb20gYWxsIG9mIHRoZW1cbiAgICogY29uY3VycmVudGx5LlxuICAgKlxuICAgKiAqbWVyZ2UqIHRha2VzIG11bHRpcGxlIHN0cmVhbXMgYXMgYXJndW1lbnRzLCBhbmQgY3JlYXRlcyBhIHN0cmVhbSB0aGF0XG4gICAqIGJlaGF2ZXMgbGlrZSBlYWNoIG9mIHRoZSBhcmd1bWVudCBzdHJlYW1zLCBpbiBwYXJhbGxlbC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS1cbiAgICogLS0tLWEtLS0tLWItLS0tYy0tLWQtLS0tLS1cbiAgICogICAgICAgICAgICBtZXJnZVxuICAgKiAtLTEtYS0tMi0tYi0tMy1jLS0tZC0tNC0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBtZXJnZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIG1lcmdlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy4gVHdvXG4gICAqIG9yIG1vcmUgc3RyZWFtcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgbWVyZ2U6IE1lcmdlU2lnbmF0dXJlID0gZnVuY3Rpb24gbWVyZ2UoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55PihuZXcgTWVyZ2Uoc3RyZWFtcykpO1xuICB9IGFzIE1lcmdlU2lnbmF0dXJlO1xuXG4gIC8qKlxuICAgKiBDb21iaW5lcyBtdWx0aXBsZSBpbnB1dCBzdHJlYW1zIHRvZ2V0aGVyIHRvIHJldHVybiBhIHN0cmVhbSB3aG9zZSBldmVudHNcbiAgICogYXJlIGFycmF5cyB0aGF0IGNvbGxlY3QgdGhlIGxhdGVzdCBldmVudHMgZnJvbSBlYWNoIGlucHV0IHN0cmVhbS5cbiAgICpcbiAgICogKmNvbWJpbmUqIGludGVybmFsbHkgcmVtZW1iZXJzIHRoZSBtb3N0IHJlY2VudCBldmVudCBmcm9tIGVhY2ggb2YgdGhlIGlucHV0XG4gICAqIHN0cmVhbXMuIFdoZW4gYW55IG9mIHRoZSBpbnB1dCBzdHJlYW1zIGVtaXRzIGFuIGV2ZW50LCB0aGF0IGV2ZW50IHRvZ2V0aGVyXG4gICAqIHdpdGggYWxsIHRoZSBvdGhlciBzYXZlZCBldmVudHMgYXJlIGNvbWJpbmVkIGludG8gYW4gYXJyYXkuIFRoYXQgYXJyYXkgd2lsbFxuICAgKiBiZSBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBJdCdzIGVzc2VudGlhbGx5IGEgd2F5IG9mIGpvaW5pbmcgdG9nZXRoZXJcbiAgICogdGhlIGV2ZW50cyBmcm9tIG11bHRpcGxlIHN0cmVhbXMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gICAqIC0tLS1hLS0tLS1iLS0tLS1jLS1kLS0tLS0tXG4gICAqICAgICAgICAgIGNvbWJpbmVcbiAgICogLS0tLTFhLTJhLTJiLTNiLTNjLTNkLTRkLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gY29tYmluZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBNdWx0aXBsZSBzdHJlYW1zLCBub3QganVzdCB0d28sIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjb21iaW5lOiBDb21iaW5lU2lnbmF0dXJlID0gZnVuY3Rpb24gY29tYmluZSguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxBcnJheTxhbnk+PihuZXcgQ29tYmluZTxhbnk+KHN0cmVhbXMpKTtcbiAgfSBhcyBDb21iaW5lU2lnbmF0dXJlO1xuXG4gIHByb3RlY3RlZCBfbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogU3RyZWFtPFU+IHwgTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VT4obmV3IE1hcE9wPFQsIFU+KHByb2plY3QsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIHRocm91Z2ggYSBgcHJvamVjdGAgZnVuY3Rpb24sXG4gICAqIHRvIGdldCBhIFN0cmVhbSB0aGF0IGVtaXRzIHRob3NlIHRyYW5zZm9ybWVkIGV2ZW50cy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMy0tNS0tLS0tNy0tLS0tLVxuICAgKiAgICBtYXAoaSA9PiBpICogMTApXG4gICAqIC0tMTAtLTMwLTUwLS0tLTcwLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByb2plY3QgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gVWAgdGhhdCB0YWtlcyBldmVudFxuICAgKiBgdGAgb2YgdHlwZSBgVGAgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIGFuZCBwcm9kdWNlcyBhbiBldmVudCBvZiB0eXBlIGBVYCwgdG9cbiAgICogYmUgZW1pdHRlZCBvbiB0aGUgb3V0cHV0IFN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogU3RyZWFtPFU+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwKHByb2plY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0J3MgbGlrZSBgbWFwYCwgYnV0IHRyYW5zZm9ybXMgZWFjaCBpbnB1dCBldmVudCB0byBhbHdheXMgdGhlIHNhbWVcbiAgICogY29uc3RhbnQgdmFsdWUgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTMtLTUtLS0tLTctLS0tLVxuICAgKiAgICAgICBtYXBUbygxMClcbiAgICogLS0xMC0tMTAtMTAtLS0tMTAtLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gcHJvamVjdGVkVmFsdWUgQSB2YWx1ZSB0byBlbWl0IG9uIHRoZSBvdXRwdXQgU3RyZWFtIHdoZW5ldmVyIHRoZVxuICAgKiBpbnB1dCBTdHJlYW0gZW1pdHMgYW55IHZhbHVlLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBtYXBUbzxVPihwcm9qZWN0ZWRWYWx1ZTogVSk6IFN0cmVhbTxVPiB7XG4gICAgY29uc3QgcyA9IHRoaXMubWFwKCgpID0+IHByb2plY3RlZFZhbHVlKTtcbiAgICBjb25zdCBvcDogT3BlcmF0b3I8VCwgVT4gPSBzLl9wcm9kIGFzIE9wZXJhdG9yPFQsIFU+O1xuICAgIG9wLnR5cGUgPSAnbWFwVG8nO1xuICAgIHJldHVybiBzO1xuICB9XG5cbiAgZmlsdGVyPFMgZXh0ZW5kcyBUPihwYXNzZXM6ICh0OiBUKSA9PiB0IGlzIFMpOiBTdHJlYW08Uz47XG4gIGZpbHRlcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuKTogU3RyZWFtPFQ+O1xuICAvKipcbiAgICogT25seSBhbGxvd3MgZXZlbnRzIHRoYXQgcGFzcyB0aGUgdGVzdCBnaXZlbiBieSB0aGUgYHBhc3Nlc2AgYXJndW1lbnQuXG4gICAqXG4gICAqIEVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGlzIGdpdmVuIHRvIHRoZSBgcGFzc2VzYCBmdW5jdGlvbi4gSWYgdGhlXG4gICAqIGZ1bmN0aW9uIHJldHVybnMgYHRydWVgLCB0aGUgZXZlbnQgaXMgZm9yd2FyZGVkIHRvIHRoZSBvdXRwdXQgc3RyZWFtLFxuICAgKiBvdGhlcndpc2UgaXQgaXMgaWdub3JlZCBhbmQgbm90IGZvcndhcmRlZC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMi0tMy0tLS0tNC0tLS0tNS0tLTYtLTctOC0tXG4gICAqICAgICBmaWx0ZXIoaSA9PiBpICUgMiA9PT0gMClcbiAgICogLS0tLS0tMi0tLS0tLS0tNC0tLS0tLS0tLTYtLS0tOC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwYXNzZXMgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gYm9vbGVhbmAgdGhhdCB0YWtlc1xuICAgKiBhbiBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gYW5kIGNoZWNrcyBpZiBpdCBwYXNzZXMsIGJ5IHJldHVybmluZyBhXG4gICAqIGJvb2xlYW4uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGZpbHRlcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuKTogU3RyZWFtPFQ+IHtcbiAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICBpZiAocCBpbnN0YW5jZW9mIEZpbHRlcilcbiAgICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGaWx0ZXI8VD4oXG4gICAgICAgIGFuZCgocCBhcyBGaWx0ZXI8VD4pLmYsIHBhc3NlcyksXG4gICAgICAgIChwIGFzIEZpbHRlcjxUPikuaW5zXG4gICAgICApKTtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRmlsdGVyPFQ+KHBhc3NlcywgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIExldHMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSBwYXNzIHRvIHRoZVxuICAgKiBvdXRwdXQgc3RyZWFtLCB0aGVuIG1ha2VzIHRoZSBvdXRwdXQgc3RyZWFtIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICogICAgdGFrZSgzKVxuICAgKiAtLWEtLS1iLS1jfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCBIb3cgbWFueSBldmVudHMgdG8gYWxsb3cgZnJvbSB0aGUgaW5wdXQgc3RyZWFtXG4gICAqIGJlZm9yZSBjb21wbGV0aW5nIHRoZSBvdXRwdXQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICB0YWtlKGFtb3VudDogbnVtYmVyKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IFRha2U8VD4oYW1vdW50LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogSWdub3JlcyB0aGUgZmlyc3QgYGFtb3VudGAgbWFueSBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtLCBhbmQgdGhlblxuICAgKiBhZnRlciB0aGF0IHN0YXJ0cyBmb3J3YXJkaW5nIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dFxuICAgKiBzdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLS0tZC0tLWUtLVxuICAgKiAgICAgICBkcm9wKDMpXG4gICAqIC0tLS0tLS0tLS0tLS0tZC0tLWUtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCBIb3cgbWFueSBldmVudHMgdG8gaWdub3JlIGZyb20gdGhlIGlucHV0IHN0cmVhbVxuICAgKiBiZWZvcmUgZm9yd2FyZGluZyBhbGwgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSB0byB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZHJvcChhbW91bnQ6IG51bWJlcik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERyb3A8VD4oYW1vdW50LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiB0aGUgaW5wdXQgc3RyZWFtIGNvbXBsZXRlcywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBlbWl0IHRoZSBsYXN0IGV2ZW50XG4gICAqIGVtaXR0ZWQgYnkgdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW4gd2lsbCBhbHNvIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS1kLS0tLXxcbiAgICogICAgICAgbGFzdCgpXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tZHxcbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGxhc3QoKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgTGFzdDxUPih0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogUHJlcGVuZHMgdGhlIGdpdmVuIGBpbml0aWFsYCB2YWx1ZSB0byB0aGUgc2VxdWVuY2Ugb2YgZXZlbnRzIGVtaXR0ZWQgYnkgdGhlXG4gICAqIGlucHV0IHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXNcbiAgICogYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tMS0tLTItLS0tLTMtLS1cbiAgICogICBzdGFydFdpdGgoMClcbiAgICogMC0tMS0tLTItLS0tLTMtLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBpbml0aWFsIFRoZSB2YWx1ZSBvciBldmVudCB0byBwcmVwZW5kLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBzdGFydFdpdGgoaW5pdGlhbDogVCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4obmV3IFN0YXJ0V2l0aDxUPih0aGlzLCBpbml0aWFsKSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlcyBhbm90aGVyIHN0cmVhbSB0byBkZXRlcm1pbmUgd2hlbiB0byBjb21wbGV0ZSB0aGUgY3VycmVudCBzdHJlYW0uXG4gICAqXG4gICAqIFdoZW4gdGhlIGdpdmVuIGBvdGhlcmAgc3RyZWFtIGVtaXRzIGFuIGV2ZW50IG9yIGNvbXBsZXRlcywgdGhlIG91dHB1dFxuICAgKiBzdHJlYW0gd2lsbCBjb21wbGV0ZS4gQmVmb3JlIHRoYXQgaGFwcGVucywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBiZWhhdmVzXG4gICAqIGxpa2UgdGhlIGlucHV0IHN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tMS0tLTItLS0tLTMtLTQtLS0tNS0tLS02LS0tXG4gICAqICAgZW5kV2hlbiggLS0tLS0tLS1hLS1iLS18IClcbiAgICogLS0tMS0tLTItLS0tLTMtLTQtLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBvdGhlciBTb21lIG90aGVyIHN0cmVhbSB0aGF0IGlzIHVzZWQgdG8ga25vdyB3aGVuIHNob3VsZCB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbSBvZiB0aGlzIG9wZXJhdG9yIGNvbXBsZXRlLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBFbmRXaGVuPFQ+KG90aGVyLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogXCJGb2xkc1wiIHRoZSBzdHJlYW0gb250byBpdHNlbGYuXG4gICAqXG4gICAqIENvbWJpbmVzIGV2ZW50cyBmcm9tIHRoZSBwYXN0IHRocm91Z2hvdXRcbiAgICogdGhlIGVudGlyZSBleGVjdXRpb24gb2YgdGhlIGlucHV0IHN0cmVhbSwgYWxsb3dpbmcgeW91IHRvIGFjY3VtdWxhdGUgdGhlbVxuICAgKiB0b2dldGhlci4gSXQncyBlc3NlbnRpYWxseSBsaWtlIGBBcnJheS5wcm90b3R5cGUucmVkdWNlYC4gVGhlIHJldHVybmVkXG4gICAqIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXMgYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICpcbiAgICogVGhlIG91dHB1dCBzdHJlYW0gc3RhcnRzIGJ5IGVtaXR0aW5nIHRoZSBgc2VlZGAgd2hpY2ggeW91IGdpdmUgYXMgYXJndW1lbnQuXG4gICAqIFRoZW4sIHdoZW4gYW4gZXZlbnQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpdCBpcyBjb21iaW5lZCB3aXRoIHRoYXRcbiAgICogc2VlZCB2YWx1ZSB0aHJvdWdoIHRoZSBgYWNjdW11bGF0ZWAgZnVuY3Rpb24sIGFuZCB0aGUgb3V0cHV0IHZhbHVlIGlzXG4gICAqIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBzdHJlYW0uIGBmb2xkYCByZW1lbWJlcnMgdGhhdCBvdXRwdXQgdmFsdWUgYXMgYGFjY2BcbiAgICogKFwiYWNjdW11bGF0b3JcIiksIGFuZCB0aGVuIHdoZW4gYSBuZXcgaW5wdXQgZXZlbnQgYHRgIGhhcHBlbnMsIGBhY2NgIHdpbGwgYmVcbiAgICogY29tYmluZWQgd2l0aCB0aGF0IHRvIHByb2R1Y2UgdGhlIG5ldyBgYWNjYCBhbmQgc28gZm9ydGguXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLS0tLTEtLS0tLTEtLTItLS0tMS0tLS0xLS0tLS0tXG4gICAqICAgZm9sZCgoYWNjLCB4KSA9PiBhY2MgKyB4LCAzKVxuICAgKiAzLS0tLS00LS0tLS01LS03LS0tLTgtLS0tOS0tLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gYWNjdW11bGF0ZSBBIGZ1bmN0aW9uIG9mIHR5cGUgYChhY2M6IFIsIHQ6IFQpID0+IFJgIHRoYXRcbiAgICogdGFrZXMgdGhlIHByZXZpb3VzIGFjY3VtdWxhdGVkIHZhbHVlIGBhY2NgIGFuZCB0aGUgaW5jb21pbmcgZXZlbnQgZnJvbSB0aGVcbiAgICogaW5wdXQgc3RyZWFtIGFuZCBwcm9kdWNlcyB0aGUgbmV3IGFjY3VtdWxhdGVkIHZhbHVlLlxuICAgKiBAcGFyYW0gc2VlZCBUaGUgaW5pdGlhbCBhY2N1bXVsYXRlZCB2YWx1ZSwgb2YgdHlwZSBgUmAuXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIGZvbGQ8Uj4oYWNjdW11bGF0ZTogKGFjYzogUiwgdDogVCkgPT4gUiwgc2VlZDogUik6IE1lbW9yeVN0cmVhbTxSPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08Uj4obmV3IEZvbGQ8VCwgUj4oYWNjdW11bGF0ZSwgc2VlZCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcGxhY2VzIGFuIGVycm9yIHdpdGggYW5vdGhlciBzdHJlYW0uXG4gICAqXG4gICAqIFdoZW4gKGFuZCBpZikgYW4gZXJyb3IgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpbnN0ZWFkIG9mIGZvcndhcmRpbmdcbiAgICogdGhhdCBlcnJvciB0byB0aGUgb3V0cHV0IHN0cmVhbSwgKnJlcGxhY2VFcnJvciogd2lsbCBjYWxsIHRoZSBgcmVwbGFjZWBcbiAgICogZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgc3RyZWFtIHRoYXQgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCByZXBsaWNhdGUuXG4gICAqIEFuZCwgaW4gY2FzZSB0aGF0IG5ldyBzdHJlYW0gYWxzbyBlbWl0cyBhbiBlcnJvciwgYHJlcGxhY2VgIHdpbGwgYmUgY2FsbGVkXG4gICAqIGFnYWluIHRvIGdldCBhbm90aGVyIHN0cmVhbSB0byBzdGFydCByZXBsaWNhdGluZy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMi0tLS0tMy0tNC0tLS0tWFxuICAgKiAgIHJlcGxhY2VFcnJvciggKCkgPT4gLS0xMC0tfCApXG4gICAqIC0tMS0tLTItLS0tLTMtLTQtLS0tLS0tLTEwLS18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXBsYWNlIEEgZnVuY3Rpb24gb2YgdHlwZSBgKGVycikgPT4gU3RyZWFtYCB0aGF0IHRha2VzXG4gICAqIHRoZSBlcnJvciB0aGF0IG9jY3VycmVkIG9uIHRoZSBpbnB1dCBzdHJlYW0gb3Igb24gdGhlIHByZXZpb3VzIHJlcGxhY2VtZW50XG4gICAqIHN0cmVhbSBhbmQgcmV0dXJucyBhIG5ldyBzdHJlYW0uIFRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgYmVoYXZlIGxpa2UgdGhlXG4gICAqIHN0cmVhbSB0aGF0IHRoaXMgZnVuY3Rpb24gcmV0dXJucy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgcmVwbGFjZUVycm9yKHJlcGxhY2U6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IFJlcGxhY2VFcnJvcjxUPihyZXBsYWNlLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogRmxhdHRlbnMgYSBcInN0cmVhbSBvZiBzdHJlYW1zXCIsIGhhbmRsaW5nIG9ubHkgb25lIG5lc3RlZCBzdHJlYW0gYXQgYSB0aW1lXG4gICAqIChubyBjb25jdXJyZW5jeSkuXG4gICAqXG4gICAqIElmIHRoZSBpbnB1dCBzdHJlYW0gaXMgYSBzdHJlYW0gdGhhdCBlbWl0cyBzdHJlYW1zLCB0aGVuIHRoaXMgb3BlcmF0b3Igd2lsbFxuICAgKiByZXR1cm4gYW4gb3V0cHV0IHN0cmVhbSB3aGljaCBpcyBhIGZsYXQgc3RyZWFtOiBlbWl0cyByZWd1bGFyIGV2ZW50cy4gVGhlXG4gICAqIGZsYXR0ZW5pbmcgaGFwcGVucyB3aXRob3V0IGNvbmN1cnJlbmN5LiBJdCB3b3JrcyBsaWtlIHRoaXM6IHdoZW4gdGhlIGlucHV0XG4gICAqIHN0cmVhbSBlbWl0cyBhIG5lc3RlZCBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIHN0YXJ0IGltaXRhdGluZyB0aGF0IG5lc3RlZFxuICAgKiBvbmUuIEhvd2V2ZXIsIGFzIHNvb24gYXMgdGhlIG5leHQgbmVzdGVkIHN0cmVhbSBpcyBlbWl0dGVkIG9uIHRoZSBpbnB1dFxuICAgKiBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIGZvcmdldCB0aGUgcHJldmlvdXMgbmVzdGVkIG9uZSBpdCB3YXMgaW1pdGF0aW5nLCBhbmRcbiAgICogd2lsbCBzdGFydCBpbWl0YXRpbmcgdGhlIG5ldyBuZXN0ZWQgb25lLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLSstLS0tLS0tLSstLS0tLS0tLS0tLS0tLS1cbiAgICogICBcXCAgICAgICAgXFxcbiAgICogICAgXFwgICAgICAgLS0tLTEtLS0tMi0tLTMtLVxuICAgKiAgICAtLWEtLWItLS0tYy0tLS1kLS0tLS0tLS1cbiAgICogICAgICAgICAgIGZsYXR0ZW5cbiAgICogLS0tLS1hLS1iLS0tLS0tMS0tLS0yLS0tMy0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBmbGF0dGVuPFI+KHRoaXM6IFN0cmVhbTxTdHJlYW08Uj4+KTogVCB7XG4gICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08Uj4obmV3IEZsYXR0ZW4odGhpcykpIGFzIFQgJiBTdHJlYW08Uj47XG4gIH1cblxuICAvKipcbiAgICogUGFzc2VzIHRoZSBpbnB1dCBzdHJlYW0gdG8gYSBjdXN0b20gb3BlcmF0b3IsIHRvIHByb2R1Y2UgYW4gb3V0cHV0IHN0cmVhbS5cbiAgICpcbiAgICogKmNvbXBvc2UqIGlzIGEgaGFuZHkgd2F5IG9mIHVzaW5nIGFuIGV4aXN0aW5nIGZ1bmN0aW9uIGluIGEgY2hhaW5lZCBzdHlsZS5cbiAgICogSW5zdGVhZCBvZiB3cml0aW5nIGBvdXRTdHJlYW0gPSBmKGluU3RyZWFtKWAgeW91IGNhbiB3cml0ZVxuICAgKiBgb3V0U3RyZWFtID0gaW5TdHJlYW0uY29tcG9zZShmKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9wZXJhdG9yIEEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHN0cmVhbSBhcyBpbnB1dCBhbmRcbiAgICogcmV0dXJucyBhIHN0cmVhbSBhcyB3ZWxsLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBjb21wb3NlPFU+KG9wZXJhdG9yOiAoc3RyZWFtOiBTdHJlYW08VD4pID0+IFUpOiBVIHtcbiAgICByZXR1cm4gb3BlcmF0b3IodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sIGJ1dCBhbHNvXG4gICAqIHJlbWVtYmVycyB0aGUgbW9zdCByZWNlbnQgZXZlbnQgdGhhdCBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIHNvIHRoYXQgYVxuICAgKiBuZXdseSBhZGRlZCBsaXN0ZW5lciB3aWxsIGltbWVkaWF0ZWx5IHJlY2VpdmUgdGhhdCBtZW1vcmlzZWQgZXZlbnQuXG4gICAqXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHJlbWVtYmVyKCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4obmV3IFJlbWVtYmVyPFQ+KHRoaXMpKTtcbiAgfVxuXG4gIGRlYnVnKCk6IFN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogc3RyaW5nKTogU3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiAodDogVCkgPT4gYW55KTogU3RyZWFtPFQ+O1xuICAvKipcbiAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgaWRlbnRpY2FsbHkgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sXG4gICAqIGJ1dCBhbHNvIHJ1bnMgYSBgc3B5YCBmdW5jdGlvbiBmb3IgZWFjaCBldmVudCwgdG8gaGVscCB5b3UgZGVidWcgeW91ciBhcHAuXG4gICAqXG4gICAqICpkZWJ1ZyogdGFrZXMgYSBgc3B5YCBmdW5jdGlvbiBhcyBhcmd1bWVudCwgYW5kIHJ1bnMgdGhhdCBmb3IgZWFjaCBldmVudFxuICAgKiBoYXBwZW5pbmcgb24gdGhlIGlucHV0IHN0cmVhbS4gSWYgeW91IGRvbid0IHByb3ZpZGUgdGhlIGBzcHlgIGFyZ3VtZW50LFxuICAgKiB0aGVuICpkZWJ1Zyogd2lsbCBqdXN0IGBjb25zb2xlLmxvZ2AgZWFjaCBldmVudC4gVGhpcyBoZWxwcyB5b3UgdG9cbiAgICogdW5kZXJzdGFuZCB0aGUgZmxvdyBvZiBldmVudHMgdGhyb3VnaCBzb21lIG9wZXJhdG9yIGNoYWluLlxuICAgKlxuICAgKiBQbGVhc2Ugbm90ZSB0aGF0IGlmIHRoZSBvdXRwdXQgc3RyZWFtIGhhcyBubyBsaXN0ZW5lcnMsIHRoZW4gaXQgd2lsbCBub3RcbiAgICogc3RhcnQsIHdoaWNoIG1lYW5zIGBzcHlgIHdpbGwgbmV2ZXIgcnVuIGJlY2F1c2Ugbm8gYWN0dWFsIGV2ZW50IGhhcHBlbnMgaW5cbiAgICogdGhhdCBjYXNlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tNC0tXG4gICAqICAgICAgICAgZGVidWdcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLTQtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGFiZWxPclNweSBBIHN0cmluZyB0byB1c2UgYXMgdGhlIGxhYmVsIHdoZW4gcHJpbnRpbmdcbiAgICogZGVidWcgaW5mb3JtYXRpb24gb24gdGhlIGNvbnNvbGUsIG9yIGEgJ3NweScgZnVuY3Rpb24gdGhhdCB0YWtlcyBhbiBldmVudFxuICAgKiBhcyBhcmd1bWVudCwgYW5kIGRvZXMgbm90IG5lZWQgdG8gcmV0dXJuIGFueXRoaW5nLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBkZWJ1ZyhsYWJlbE9yU3B5Pzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IERlYnVnPFQ+KHRoaXMsIGxhYmVsT3JTcHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAqaW1pdGF0ZSogY2hhbmdlcyB0aGlzIGN1cnJlbnQgU3RyZWFtIHRvIGVtaXQgdGhlIHNhbWUgZXZlbnRzIHRoYXQgdGhlXG4gICAqIGBvdGhlcmAgZ2l2ZW4gU3RyZWFtIGRvZXMuIFRoaXMgbWV0aG9kIHJldHVybnMgbm90aGluZy5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgZXhpc3RzIHRvIGFsbG93IG9uZSB0aGluZzogKipjaXJjdWxhciBkZXBlbmRlbmN5IG9mIHN0cmVhbXMqKi5cbiAgICogRm9yIGluc3RhbmNlLCBsZXQncyBpbWFnaW5lIHRoYXQgZm9yIHNvbWUgcmVhc29uIHlvdSBuZWVkIHRvIGNyZWF0ZSBhXG4gICAqIGNpcmN1bGFyIGRlcGVuZGVuY3kgd2hlcmUgc3RyZWFtIGBmaXJzdCRgIGRlcGVuZHMgb24gc3RyZWFtIGBzZWNvbmQkYFxuICAgKiB3aGljaCBpbiB0dXJuIGRlcGVuZHMgb24gYGZpcnN0JGA6XG4gICAqXG4gICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgKiBgYGBqc1xuICAgKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAgICpcbiAgICogdmFyIGZpcnN0JCA9IHNlY29uZCQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBIb3dldmVyLCB0aGF0IGlzIGludmFsaWQgSmF2YVNjcmlwdCwgYmVjYXVzZSBgc2Vjb25kJGAgaXMgdW5kZWZpbmVkXG4gICAqIG9uIHRoZSBmaXJzdCBsaW5lLiBUaGlzIGlzIGhvdyAqaW1pdGF0ZSogY2FuIGhlbHAgc29sdmUgaXQ6XG4gICAqXG4gICAqIGBgYGpzXG4gICAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICAgKlxuICAgKiB2YXIgc2Vjb25kUHJveHkkID0geHMuY3JlYXRlKCk7XG4gICAqIHZhciBmaXJzdCQgPSBzZWNvbmRQcm94eSQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAqIHNlY29uZFByb3h5JC5pbWl0YXRlKHNlY29uZCQpO1xuICAgKiBgYGBcbiAgICpcbiAgICogV2UgY3JlYXRlIGBzZWNvbmRQcm94eSRgIGJlZm9yZSB0aGUgb3RoZXJzLCBzbyBpdCBjYW4gYmUgdXNlZCBpbiB0aGVcbiAgICogZGVjbGFyYXRpb24gb2YgYGZpcnN0JGAuIFRoZW4sIGFmdGVyIGJvdGggYGZpcnN0JGAgYW5kIGBzZWNvbmQkYCBhcmVcbiAgICogZGVmaW5lZCwgd2UgaG9vayBgc2Vjb25kUHJveHkkYCB3aXRoIGBzZWNvbmQkYCB3aXRoIGBpbWl0YXRlKClgIHRvIHRlbGxcbiAgICogdGhhdCB0aGV5IGFyZSBcInRoZSBzYW1lXCIuIGBpbWl0YXRlYCB3aWxsIG5vdCB0cmlnZ2VyIHRoZSBzdGFydCBvZiBhbnlcbiAgICogc3RyZWFtLCBpdCBqdXN0IGJpbmRzIGBzZWNvbmRQcm94eSRgIGFuZCBgc2Vjb25kJGAgdG9nZXRoZXIuXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgaXMgYW4gZXhhbXBsZSB3aGVyZSBgaW1pdGF0ZSgpYCBpcyBpbXBvcnRhbnQgaW4gQ3ljbGUuanNcbiAgICogYXBwbGljYXRpb25zLiBBIHBhcmVudCBjb21wb25lbnQgY29udGFpbnMgc29tZSBjaGlsZCBjb21wb25lbnRzLiBBIGNoaWxkXG4gICAqIGhhcyBhbiBhY3Rpb24gc3RyZWFtIHdoaWNoIGlzIGdpdmVuIHRvIHRoZSBwYXJlbnQgdG8gZGVmaW5lIGl0cyBzdGF0ZTpcbiAgICpcbiAgICogPCEtLSBza2lwLWV4YW1wbGUgLS0+XG4gICAqIGBgYGpzXG4gICAqIGNvbnN0IGNoaWxkQWN0aW9uUHJveHkkID0geHMuY3JlYXRlKCk7XG4gICAqIGNvbnN0IHBhcmVudCA9IFBhcmVudCh7Li4uc291cmNlcywgY2hpbGRBY3Rpb24kOiBjaGlsZEFjdGlvblByb3h5JH0pO1xuICAgKiBjb25zdCBjaGlsZEFjdGlvbiQgPSBwYXJlbnQuc3RhdGUkLm1hcChzID0+IHMuY2hpbGQuYWN0aW9uJCkuZmxhdHRlbigpO1xuICAgKiBjaGlsZEFjdGlvblByb3h5JC5pbWl0YXRlKGNoaWxkQWN0aW9uJCk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBOb3RlLCB0aG91Z2gsIHRoYXQgKipgaW1pdGF0ZSgpYCBkb2VzIG5vdCBzdXBwb3J0IE1lbW9yeVN0cmVhbXMqKi4gSWYgd2VcbiAgICogd291bGQgYXR0ZW1wdCB0byBpbWl0YXRlIGEgTWVtb3J5U3RyZWFtIGluIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSwgd2Ugd291bGRcbiAgICogZWl0aGVyIGdldCBhIHJhY2UgY29uZGl0aW9uICh3aGVyZSB0aGUgc3ltcHRvbSB3b3VsZCBiZSBcIm5vdGhpbmcgaGFwcGVuc1wiKVxuICAgKiBvciBhbiBpbmZpbml0ZSBjeWNsaWMgZW1pc3Npb24gb2YgdmFsdWVzLiBJdCdzIHVzZWZ1bCB0byB0aGluayBhYm91dFxuICAgKiBNZW1vcnlTdHJlYW1zIGFzIGNlbGxzIGluIGEgc3ByZWFkc2hlZXQuIEl0IGRvZXNuJ3QgbWFrZSBhbnkgc2Vuc2UgdG9cbiAgICogZGVmaW5lIGEgc3ByZWFkc2hlZXQgY2VsbCBgQTFgIHdpdGggYSBmb3JtdWxhIHRoYXQgZGVwZW5kcyBvbiBgQjFgIGFuZFxuICAgKiBjZWxsIGBCMWAgZGVmaW5lZCB3aXRoIGEgZm9ybXVsYSB0aGF0IGRlcGVuZHMgb24gYEExYC5cbiAgICpcbiAgICogSWYgeW91IGZpbmQgeW91cnNlbGYgd2FudGluZyB0byB1c2UgYGltaXRhdGUoKWAgd2l0aCBhXG4gICAqIE1lbW9yeVN0cmVhbSwgeW91IHNob3VsZCByZXdvcmsgeW91ciBjb2RlIGFyb3VuZCBgaW1pdGF0ZSgpYCB0byB1c2UgYVxuICAgKiBTdHJlYW0gaW5zdGVhZC4gTG9vayBmb3IgdGhlIHN0cmVhbSBpbiB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeSB0aGF0XG4gICAqIHJlcHJlc2VudHMgYW4gZXZlbnQgc3RyZWFtLCBhbmQgdGhhdCB3b3VsZCBiZSBhIGNhbmRpZGF0ZSBmb3IgY3JlYXRpbmcgYVxuICAgKiBwcm94eSBTdHJlYW0gd2hpY2ggdGhlbiBpbWl0YXRlcyB0aGUgdGFyZ2V0IFN0cmVhbS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJlYW19IHRhcmdldCBUaGUgb3RoZXIgc3RyZWFtIHRvIGltaXRhdGUgb24gdGhlIGN1cnJlbnQgb25lLiBNdXN0XG4gICAqIG5vdCBiZSBhIE1lbW9yeVN0cmVhbS5cbiAgICovXG4gIGltaXRhdGUodGFyZ2V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIE1lbW9yeVN0cmVhbSB3YXMgZ2l2ZW4gdG8gaW1pdGF0ZSgpLCBidXQgaXQgb25seSAnICtcbiAgICAgICdzdXBwb3J0cyBhIFN0cmVhbS4gUmVhZCBtb3JlIGFib3V0IHRoaXMgcmVzdHJpY3Rpb24gaGVyZTogJyArXG4gICAgICAnaHR0cHM6Ly9naXRodWIuY29tL3N0YWx0ei94c3RyZWFtI2ZhcScpO1xuICAgIHRoaXMuX3RhcmdldCA9IHRhcmdldDtcbiAgICBmb3IgKGxldCBpbHMgPSB0aGlzLl9pbHMsIE4gPSBpbHMubGVuZ3RoLCBpID0gMDsgaSA8IE47IGkrKykgdGFyZ2V0Ll9hZGQoaWxzW2ldKTtcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiB2YWx1ZSB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIFRoZSBcIm5leHRcIiB2YWx1ZSB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIGxpc3RlbmVycyBvZlxuICAgKiB0aGlzIFN0cmVhbS5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kTmV4dCh2YWx1ZTogVCkge1xuICAgIHRoaXMuX24odmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIGdpdmVuIGVycm9yIHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gZXJyb3IgVGhlIGVycm9yIHlvdSB3YW50IHRvIGJyb2FkY2FzdCB0byBhbGwgdGhlIGxpc3RlbmVycyBvZlxuICAgKiB0aGlzIFN0cmVhbS5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kRXJyb3IoZXJyb3I6IGFueSkge1xuICAgIHRoaXMuX2UoZXJyb3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIFwiY29tcGxldGVkXCIgZXZlbnQgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZENvbXBsZXRlKCkge1xuICAgIHRoaXMuX2MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgXCJkZWJ1Z1wiIGxpc3RlbmVyIHRvIHRoZSBzdHJlYW0uIFRoZXJlIGNhbiBvbmx5IGJlIG9uZSBkZWJ1Z1xuICAgKiBsaXN0ZW5lciwgdGhhdCdzIHdoeSB0aGlzIGlzICdzZXREZWJ1Z0xpc3RlbmVyJy4gVG8gcmVtb3ZlIHRoZSBkZWJ1Z1xuICAgKiBsaXN0ZW5lciwganVzdCBjYWxsIHNldERlYnVnTGlzdGVuZXIobnVsbCkuXG4gICAqXG4gICAqIEEgZGVidWcgbGlzdGVuZXIgaXMgbGlrZSBhbnkgb3RoZXIgbGlzdGVuZXIuIFRoZSBvbmx5IGRpZmZlcmVuY2UgaXMgdGhhdCBhXG4gICAqIGRlYnVnIGxpc3RlbmVyIGlzIFwic3RlYWx0aHlcIjogaXRzIHByZXNlbmNlL2Fic2VuY2UgZG9lcyBub3QgdHJpZ2dlciB0aGVcbiAgICogc3RhcnQvc3RvcCBvZiB0aGUgc3RyZWFtIChvciB0aGUgcHJvZHVjZXIgaW5zaWRlIHRoZSBzdHJlYW0pLiBUaGlzIGlzXG4gICAqIHVzZWZ1bCBzbyB5b3UgY2FuIGluc3BlY3Qgd2hhdCBpcyBnb2luZyBvbiB3aXRob3V0IGNoYW5naW5nIHRoZSBiZWhhdmlvclxuICAgKiBvZiB0aGUgcHJvZ3JhbS4gSWYgeW91IGhhdmUgYW4gaWRsZSBzdHJlYW0gYW5kIHlvdSBhZGQgYSBub3JtYWwgbGlzdGVuZXIgdG9cbiAgICogaXQsIHRoZSBzdHJlYW0gd2lsbCBzdGFydCBleGVjdXRpbmcuIEJ1dCBpZiB5b3Ugc2V0IGEgZGVidWcgbGlzdGVuZXIgb24gYW5cbiAgICogaWRsZSBzdHJlYW0sIGl0IHdvbid0IHN0YXJ0IGV4ZWN1dGluZyAobm90IHVudGlsIHRoZSBmaXJzdCBub3JtYWwgbGlzdGVuZXJcbiAgICogaXMgYWRkZWQpLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIHdlIGRvbid0IHJlY29tbWVuZCB1c2luZyB0aGlzIG1ldGhvZCB0byBidWlsZCBhcHBcbiAgICogbG9naWMuIEluIGZhY3QsIGluIG1vc3QgY2FzZXMgdGhlIGRlYnVnIG9wZXJhdG9yIHdvcmtzIGp1c3QgZmluZS4gT25seSB1c2VcbiAgICogdGhpcyBvbmUgaWYgeW91IGtub3cgd2hhdCB5b3UncmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXI8VD59IGxpc3RlbmVyXG4gICAqL1xuICBzZXREZWJ1Z0xpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+PiB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgICB0aGlzLl9kbCA9IE5PIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2QgPSB0cnVlO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9uID0gbGlzdGVuZXIubmV4dCB8fCBub29wO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fYyA9IGxpc3RlbmVyLmNvbXBsZXRlIHx8IG5vb3A7XG4gICAgICB0aGlzLl9kbCA9IGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdHJlYW08VD4gZXh0ZW5kcyBTdHJlYW08VD4ge1xuICBwcml2YXRlIF92OiBUO1xuICBwcml2YXRlIF9oYXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29uc3RydWN0b3IocHJvZHVjZXI6IEludGVybmFsUHJvZHVjZXI8VD4pIHtcbiAgICBzdXBlcihwcm9kdWNlcik7XG4gIH1cblxuICBfbih4OiBUKSB7XG4gICAgdGhpcy5fdiA9IHg7XG4gICAgdGhpcy5faGFzID0gdHJ1ZTtcbiAgICBzdXBlci5fbih4KTtcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHtcbiAgICAgIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fc3RvcElEKTtcbiAgICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIH0gZWxzZSBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTsgZWxzZSB7XG4gICAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICAgIGlmIChwICE9PSBOTykgcC5fc3RhcnQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgdGhpcy5faGFzID0gZmFsc2U7XG4gICAgc3VwZXIuX3N0b3BOb3coKTtcbiAgfVxuXG4gIF94KCk6IHZvaWQge1xuICAgIHRoaXMuX2hhcyA9IGZhbHNlO1xuICAgIHN1cGVyLl94KCk7XG4gIH1cblxuICBtYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiB0aGlzLl9tYXAocHJvamVjdCkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgbWFwVG88VT4ocHJvamVjdGVkVmFsdWU6IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiBzdXBlci5tYXBUbyhwcm9qZWN0ZWRWYWx1ZSkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgdGFrZShhbW91bnQ6IG51bWJlcik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnRha2UoYW1vdW50KSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLmVuZFdoZW4ob3RoZXIpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIHJlcGxhY2VFcnJvcihyZXBsYWNlOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnJlcGxhY2VFcnJvcihyZXBsYWNlKSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICByZW1lbWJlcigpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGVidWcoKTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiBzdHJpbmcpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6ICh0OiBUKSA9PiBhbnkpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5kZWJ1ZyhsYWJlbE9yU3B5IGFzIGFueSkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG59XG5cbmV4cG9ydCB7Tk8sIE5PX0lMfTtcbmNvbnN0IHhzID0gU3RyZWFtO1xudHlwZSB4czxUPiA9IFN0cmVhbTxUPjtcbmV4cG9ydCBkZWZhdWx0IHhzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBmcm9tRXZlbnRfMSA9IHJlcXVpcmUoXCIuL2Zyb21FdmVudFwiKTtcbnZhciBCb2R5RE9NU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEJvZHlET01Tb3VyY2UoX25hbWUpIHtcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xuICAgIH1cbiAgICBCb2R5RE9NU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbmFsaXR5IGlzIHN0aWxsIHVuZGVmaW5lZC91bmRlY2lkZWQuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgQm9keURPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0Lm9mKFtkb2N1bWVudC5ib2R5XSkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgQm9keURPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQub2YoZG9jdW1lbnQuYm9keSkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgQm9keURPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucywgYnViYmxlcykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICB2YXIgc3RyZWFtO1xuICAgICAgICBzdHJlYW0gPSBmcm9tRXZlbnRfMS5mcm9tRXZlbnQoZG9jdW1lbnQuYm9keSwgZXZlbnRUeXBlLCBvcHRpb25zLnVzZUNhcHR1cmUsIG9wdGlvbnMucHJldmVudERlZmF1bHQpO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChzdHJlYW0pO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgcmV0dXJuIEJvZHlET01Tb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5Cb2R5RE9NU291cmNlID0gQm9keURPTVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUJvZHlET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBmcm9tRXZlbnRfMSA9IHJlcXVpcmUoXCIuL2Zyb21FdmVudFwiKTtcbnZhciBEb2N1bWVudERPTVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEb2N1bWVudERPTVNvdXJjZShfbmFtZSkge1xuICAgICAgICB0aGlzLl9uYW1lID0gX25hbWU7XG4gICAgfVxuICAgIERvY3VtZW50RE9NU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgLy8gVGhpcyBmdW5jdGlvbmFsaXR5IGlzIHN0aWxsIHVuZGVmaW5lZC91bmRlY2lkZWQuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgRG9jdW1lbnRET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5vZihbZG9jdW1lbnRdKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBEb2N1bWVudERPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQub2YoZG9jdW1lbnQpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIERvY3VtZW50RE9NU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBvcHRpb25zLCBidWJibGVzKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIHZhciBzdHJlYW07XG4gICAgICAgIHN0cmVhbSA9IGZyb21FdmVudF8xLmZyb21FdmVudChkb2N1bWVudCwgZXZlbnRUeXBlLCBvcHRpb25zLnVzZUNhcHR1cmUsIG9wdGlvbnMucHJldmVudERlZmF1bHQpO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChzdHJlYW0pO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgcmV0dXJuIERvY3VtZW50RE9NU291cmNlO1xufSgpKTtcbmV4cG9ydHMuRG9jdW1lbnRET01Tb3VyY2UgPSBEb2N1bWVudERPTVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPURvY3VtZW50RE9NU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFNjb3BlQ2hlY2tlcl8xID0gcmVxdWlyZShcIi4vU2NvcGVDaGVja2VyXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmZ1bmN0aW9uIHRvRWxBcnJheShpbnB1dCkge1xuICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChpbnB1dCk7XG59XG52YXIgRWxlbWVudEZpbmRlciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFbGVtZW50RmluZGVyKG5hbWVzcGFjZSwgaXNvbGF0ZU1vZHVsZSkge1xuICAgICAgICB0aGlzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlID0gaXNvbGF0ZU1vZHVsZTtcbiAgICB9XG4gICAgRWxlbWVudEZpbmRlci5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG5hbWVzcGFjZSA9IHRoaXMubmFtZXNwYWNlO1xuICAgICAgICB2YXIgc2VsZWN0b3IgPSB1dGlsc18xLmdldFNlbGVjdG9ycyhuYW1lc3BhY2UpO1xuICAgICAgICB2YXIgc2NvcGVDaGVja2VyID0gbmV3IFNjb3BlQ2hlY2tlcl8xLlNjb3BlQ2hlY2tlcihuYW1lc3BhY2UsIHRoaXMuaXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgIHZhciB0b3BOb2RlID0gdGhpcy5pc29sYXRlTW9kdWxlLmdldEVsZW1lbnQobmFtZXNwYWNlLmZpbHRlcihmdW5jdGlvbiAobikgeyByZXR1cm4gbi50eXBlICE9PSAnc2VsZWN0b3InOyB9KSk7XG4gICAgICAgIGlmICh0b3BOb2RlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4gW3RvcE5vZGVdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0b0VsQXJyYXkodG9wTm9kZS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKSlcbiAgICAgICAgICAgIC5maWx0ZXIoc2NvcGVDaGVja2VyLmlzRGlyZWN0bHlJblNjb3BlLCBzY29wZUNoZWNrZXIpXG4gICAgICAgICAgICAuY29uY2F0KHRvcE5vZGUubWF0Y2hlcyhzZWxlY3RvcikgPyBbdG9wTm9kZV0gOiBbXSk7XG4gICAgfTtcbiAgICByZXR1cm4gRWxlbWVudEZpbmRlcjtcbn0oKSk7XG5leHBvcnRzLkVsZW1lbnRGaW5kZXIgPSBFbGVtZW50RmluZGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RWxlbWVudEZpbmRlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfTtcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgU2NvcGVDaGVja2VyXzEgPSByZXF1aXJlKFwiLi9TY29wZUNoZWNrZXJcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIEVsZW1lbnRGaW5kZXJfMSA9IHJlcXVpcmUoXCIuL0VsZW1lbnRGaW5kZXJcIik7XG52YXIgU3ltYm9sVHJlZV8xID0gcmVxdWlyZShcIi4vU3ltYm9sVHJlZVwiKTtcbnZhciBSZW1vdmFsU2V0XzEgPSByZXF1aXJlKFwiLi9SZW1vdmFsU2V0XCIpO1xudmFyIFByaW9yaXR5UXVldWVfMSA9IHJlcXVpcmUoXCIuL1ByaW9yaXR5UXVldWVcIik7XG52YXIgZnJvbUV2ZW50XzEgPSByZXF1aXJlKFwiLi9mcm9tRXZlbnRcIik7XG5leHBvcnRzLmV2ZW50VHlwZXNUaGF0RG9udEJ1YmJsZSA9IFtcbiAgICBcImJsdXJcIixcbiAgICBcImNhbnBsYXlcIixcbiAgICBcImNhbnBsYXl0aHJvdWdoXCIsXG4gICAgXCJkdXJhdGlvbmNoYW5nZVwiLFxuICAgIFwiZW1wdGllZFwiLFxuICAgIFwiZW5kZWRcIixcbiAgICBcImZvY3VzXCIsXG4gICAgXCJsb2FkXCIsXG4gICAgXCJsb2FkZWRkYXRhXCIsXG4gICAgXCJsb2FkZWRtZXRhZGF0YVwiLFxuICAgIFwibW91c2VlbnRlclwiLFxuICAgIFwibW91c2VsZWF2ZVwiLFxuICAgIFwicGF1c2VcIixcbiAgICBcInBsYXlcIixcbiAgICBcInBsYXlpbmdcIixcbiAgICBcInJhdGVjaGFuZ2VcIixcbiAgICBcInJlc2V0XCIsXG4gICAgXCJzY3JvbGxcIixcbiAgICBcInNlZWtlZFwiLFxuICAgIFwic2Vla2luZ1wiLFxuICAgIFwic3RhbGxlZFwiLFxuICAgIFwic3VibWl0XCIsXG4gICAgXCJzdXNwZW5kXCIsXG4gICAgXCJ0aW1ldXBkYXRlXCIsXG4gICAgXCJ1bmxvYWRcIixcbiAgICBcInZvbHVtZWNoYW5nZVwiLFxuICAgIFwid2FpdGluZ1wiLFxuXTtcbi8qKlxuICogTWFuYWdlcyBcIkV2ZW50IGRlbGVnYXRpb25cIiwgYnkgY29ubmVjdGluZyBhbiBvcmlnaW4gd2l0aCBtdWx0aXBsZVxuICogZGVzdGluYXRpb25zLlxuICpcbiAqIEF0dGFjaGVzIGEgRE9NIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBET00gZWxlbWVudCBjYWxsZWQgdGhlIFwib3JpZ2luXCIsXG4gKiBhbmQgZGVsZWdhdGVzIGV2ZW50cyB0byBcImRlc3RpbmF0aW9uc1wiLCB3aGljaCBhcmUgc3ViamVjdHMgYXMgb3V0cHV0c1xuICogZm9yIHRoZSBET01Tb3VyY2UuIFNpbXVsYXRlcyBidWJibGluZyBvciBjYXB0dXJpbmcsIHdpdGggcmVnYXJkcyB0b1xuICogaXNvbGF0aW9uIGJvdW5kYXJpZXMgdG9vLlxuICovXG52YXIgRXZlbnREZWxlZ2F0b3IgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXZlbnREZWxlZ2F0b3Iocm9vdEVsZW1lbnQkLCBpc29sYXRlTW9kdWxlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQkID0gcm9vdEVsZW1lbnQkO1xuICAgICAgICB0aGlzLmlzb2xhdGVNb2R1bGUgPSBpc29sYXRlTW9kdWxlO1xuICAgICAgICB0aGlzLnZpcnR1YWxMaXN0ZW5lcnMgPSBuZXcgU3ltYm9sVHJlZV8xLmRlZmF1bHQoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHguc2NvcGU7IH0pO1xuICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzVG9BZGQgPSBuZXcgUmVtb3ZhbFNldF8xLmRlZmF1bHQoKTtcbiAgICAgICAgdGhpcy52aXJ0dWFsTm9uQnViYmxpbmdMaXN0ZW5lciA9IFtdO1xuICAgICAgICB0aGlzLmlzb2xhdGVNb2R1bGUuc2V0RXZlbnREZWxlZ2F0b3IodGhpcyk7XG4gICAgICAgIHRoaXMuZG9tTGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmRvbUxpc3RlbmVyc1RvQWRkID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzID0gbmV3IE1hcCgpO1xuICAgICAgICByb290RWxlbWVudCQuYWRkTGlzdGVuZXIoe1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgaWYgKF90aGlzLm9yaWdpbiAhPT0gZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMub3JpZ2luID0gZWw7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnJlc2V0RXZlbnRMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZG9tTGlzdGVuZXJzVG9BZGQuZm9yRWFjaChmdW5jdGlvbiAocGFzc2l2ZSwgdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLnNldHVwRE9NTGlzdGVuZXIodHlwZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5kb21MaXN0ZW5lcnNUb0FkZC5jbGVhcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfdGhpcy5yZXNldE5vbkJ1YmJsaW5nTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICAgICAgX3RoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnNUb0FkZC5mb3JFYWNoKGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2V0dXBOb25CdWJibGluZ0xpc3RlbmVyKGFycik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICB9KTtcbiAgICB9XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBuYW1lc3BhY2UsIG9wdGlvbnMsIGJ1YmJsZXMpIHtcbiAgICAgICAgdmFyIHN1YmplY3QgPSB4c3RyZWFtXzEuZGVmYXVsdC5uZXZlcigpO1xuICAgICAgICB2YXIgc2NvcGVDaGVja2VyID0gbmV3IFNjb3BlQ2hlY2tlcl8xLlNjb3BlQ2hlY2tlcihuYW1lc3BhY2UsIHRoaXMuaXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgIHZhciBkZXN0ID0gdGhpcy5pbnNlcnRMaXN0ZW5lcihzdWJqZWN0LCBzY29wZUNoZWNrZXIsIGV2ZW50VHlwZSwgb3B0aW9ucyk7XG4gICAgICAgIHZhciBzaG91bGRCdWJibGUgPSBidWJibGVzID09PSB1bmRlZmluZWRcbiAgICAgICAgICAgID8gZXhwb3J0cy5ldmVudFR5cGVzVGhhdERvbnRCdWJibGUuaW5kZXhPZihldmVudFR5cGUpID09PSAtMVxuICAgICAgICAgICAgOiBidWJibGVzO1xuICAgICAgICBpZiAoc2hvdWxkQnViYmxlKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZG9tTGlzdGVuZXJzLmhhcyhldmVudFR5cGUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXR1cERPTUxpc3RlbmVyKGV2ZW50VHlwZSwgISFvcHRpb25zLnBhc3NpdmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGZpbmRlciA9IG5ldyBFbGVtZW50RmluZGVyXzEuRWxlbWVudEZpbmRlcihuYW1lc3BhY2UsIHRoaXMuaXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgICAgICB0aGlzLnNldHVwTm9uQnViYmxpbmdMaXN0ZW5lcihbZXZlbnRUeXBlLCBmaW5kZXIsIGRlc3RdKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc3ViamVjdDtcbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5yZW1vdmVFbGVtZW50ID0gZnVuY3Rpb24gKGVsZW1lbnQsIG5hbWVzcGFjZSkge1xuICAgICAgICBpZiAobmFtZXNwYWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMudmlydHVhbExpc3RlbmVycy5kZWxldGUobmFtZXNwYWNlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdG9SZW1vdmUgPSBbXTtcbiAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChtYXAsIHR5cGUpIHtcbiAgICAgICAgICAgIGlmIChtYXAuaGFzKGVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgdG9SZW1vdmUucHVzaChbdHlwZSwgZWxlbWVudF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b1JlbW92ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG1hcCA9IHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuZ2V0KHRvUmVtb3ZlW2ldWzBdKTtcbiAgICAgICAgICAgIGlmICghbWFwKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtYXAuZGVsZXRlKHRvUmVtb3ZlW2ldWzFdKTtcbiAgICAgICAgICAgIGlmIChtYXAuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuZGVsZXRlKHRvUmVtb3ZlW2ldWzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuc2V0KHRvUmVtb3ZlW2ldWzBdLCBtYXApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuaW5zZXJ0TGlzdGVuZXIgPSBmdW5jdGlvbiAoc3ViamVjdCwgc2NvcGVDaGVja2VyLCBldmVudFR5cGUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHJlbGV2YW50U2V0cyA9IFtdO1xuICAgICAgICB2YXIgbiA9IHNjb3BlQ2hlY2tlci5fbmFtZXNwYWNlO1xuICAgICAgICB2YXIgbWF4ID0gbi5sZW5ndGg7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIHJlbGV2YW50U2V0cy5wdXNoKHRoaXMuZ2V0VmlydHVhbExpc3RlbmVycyhldmVudFR5cGUsIG4sIHRydWUsIG1heCkpO1xuICAgICAgICAgICAgbWF4LS07XG4gICAgICAgIH0gd2hpbGUgKG1heCA+PSAwICYmIG5bbWF4XS50eXBlICE9PSAndG90YWwnKTtcbiAgICAgICAgdmFyIGRlc3RpbmF0aW9uID0gX19hc3NpZ24oe30sIG9wdGlvbnMsIHsgc2NvcGVDaGVja2VyOiBzY29wZUNoZWNrZXIsXG4gICAgICAgICAgICBzdWJqZWN0OiBzdWJqZWN0LCBidWJibGVzOiAhIW9wdGlvbnMuYnViYmxlcywgdXNlQ2FwdHVyZTogISFvcHRpb25zLnVzZUNhcHR1cmUsIHBhc3NpdmU6ICEhb3B0aW9ucy5wYXNzaXZlIH0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlbGV2YW50U2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVsZXZhbnRTZXRzW2ldLmFkZChkZXN0aW5hdGlvbiwgbi5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZXN0aW5hdGlvbjtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgYSBzZXQgb2YgYWxsIHZpcnR1YWwgbGlzdGVuZXJzIGluIHRoZSBzY29wZSBvZiB0aGUgbmFtZXNwYWNlXG4gICAgICogU2V0IGBleGFjdGAgdG8gdHJ1ZSB0byB0cmVhdCBzaWJpbGluZyBpc29sYXRlZCBzY29wZXMgYXMgdG90YWwgc2NvcGVzXG4gICAgICovXG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLmdldFZpcnR1YWxMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBuYW1lc3BhY2UsIGV4YWN0LCBtYXgpIHtcbiAgICAgICAgaWYgKGV4YWN0ID09PSB2b2lkIDApIHsgZXhhY3QgPSBmYWxzZTsgfVxuICAgICAgICB2YXIgX21heCA9IG1heCAhPT0gdW5kZWZpbmVkID8gbWF4IDogbmFtZXNwYWNlLmxlbmd0aDtcbiAgICAgICAgaWYgKCFleGFjdCkge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IF9tYXggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGlmIChuYW1lc3BhY2VbaV0udHlwZSA9PT0gJ3RvdGFsJykge1xuICAgICAgICAgICAgICAgICAgICBfbWF4ID0gaSArIDE7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBfbWF4ID0gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB2YXIgbWFwID0gdGhpcy52aXJ0dWFsTGlzdGVuZXJzLmdldERlZmF1bHQobmFtZXNwYWNlLCBmdW5jdGlvbiAoKSB7IHJldHVybiBuZXcgTWFwKCk7IH0sIF9tYXgpO1xuICAgICAgICBpZiAoIW1hcC5oYXMoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgbWFwLnNldChldmVudFR5cGUsIG5ldyBQcmlvcml0eVF1ZXVlXzEuZGVmYXVsdCgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFwLmdldChldmVudFR5cGUpO1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnNldHVwRE9NTGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBwYXNzaXZlKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLm9yaWdpbikge1xuICAgICAgICAgICAgdmFyIHN1YiA9IGZyb21FdmVudF8xLmZyb21FdmVudCh0aGlzLm9yaWdpbiwgZXZlbnRUeXBlLCBmYWxzZSwgZmFsc2UsIHBhc3NpdmUpLnN1YnNjcmliZSh7XG4gICAgICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKGV2ZW50KSB7IHJldHVybiBfdGhpcy5vbkV2ZW50KGV2ZW50VHlwZSwgZXZlbnQsIHBhc3NpdmUpOyB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5kb21MaXN0ZW5lcnMuc2V0KGV2ZW50VHlwZSwgeyBzdWI6IHN1YiwgcGFzc2l2ZTogcGFzc2l2ZSB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZG9tTGlzdGVuZXJzVG9BZGQuc2V0KGV2ZW50VHlwZSwgcGFzc2l2ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5zZXR1cE5vbkJ1YmJsaW5nTGlzdGVuZXIgPSBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIGV2ZW50VHlwZSA9IGlucHV0WzBdLCBlbGVtZW50RmluZGVyID0gaW5wdXRbMV0sIGRlc3RpbmF0aW9uID0gaW5wdXRbMl07XG4gICAgICAgIGlmICghdGhpcy5vcmlnaW4pIHtcbiAgICAgICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnNUb0FkZC5hZGQoaW5wdXQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbGVtZW50ID0gZWxlbWVudEZpbmRlci5jYWxsKClbMF07XG4gICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzVG9BZGQuZGVsZXRlKGlucHV0KTtcbiAgICAgICAgICAgIHZhciBzdWIgPSBmcm9tRXZlbnRfMS5mcm9tRXZlbnQoZWxlbWVudCwgZXZlbnRUeXBlLCBmYWxzZSwgZmFsc2UsIGRlc3RpbmF0aW9uLnBhc3NpdmUpLnN1YnNjcmliZSh7XG4gICAgICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKGV2KSB7IHJldHVybiBfdGhpcy5vbkV2ZW50KGV2ZW50VHlwZSwgZXYsICEhZGVzdGluYXRpb24ucGFzc2l2ZSwgZmFsc2UpOyB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCF0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmhhcyhldmVudFR5cGUpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5zZXQoZXZlbnRUeXBlLCBuZXcgTWFwKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1hcCA9IHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuZ2V0KGV2ZW50VHlwZSk7XG4gICAgICAgICAgICBpZiAoIW1hcCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1hcC5zZXQoZWxlbWVudCwgeyBzdWI6IHN1YiwgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVyc1RvQWRkLmFkZChpbnB1dCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5yZXNldEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaXRlciA9IHRoaXMuZG9tTGlzdGVuZXJzLmVudHJpZXMoKTtcbiAgICAgICAgdmFyIGN1cnIgPSBpdGVyLm5leHQoKTtcbiAgICAgICAgd2hpbGUgKCFjdXJyLmRvbmUpIHtcbiAgICAgICAgICAgIHZhciBfYSA9IGN1cnIudmFsdWUsIHR5cGUgPSBfYVswXSwgX2IgPSBfYVsxXSwgc3ViID0gX2Iuc3ViLCBwYXNzaXZlID0gX2IucGFzc2l2ZTtcbiAgICAgICAgICAgIHN1Yi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgdGhpcy5zZXR1cERPTUxpc3RlbmVyKHR5cGUsIHBhc3NpdmUpO1xuICAgICAgICAgICAgY3VyciA9IGl0ZXIubmV4dCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucmVzZXROb25CdWJibGluZ0xpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIG5ld01hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdmFyIGluc2VydCA9IHV0aWxzXzEubWFrZUluc2VydChuZXdNYXApO1xuICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKG1hcCwgdHlwZSkge1xuICAgICAgICAgICAgbWFwLmZvckVhY2goZnVuY3Rpb24gKHZhbHVlLCBlbG0pIHtcbiAgICAgICAgICAgICAgICBpZiAoIWRvY3VtZW50LmJvZHkuY29udGFpbnMoZWxtKSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3ViID0gdmFsdWUuc3ViLCBkZXN0aW5hdGlvbl8xID0gdmFsdWUuZGVzdGluYXRpb247XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdWIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN1Yi51bnN1YnNjcmliZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbGVtZW50RmluZGVyID0gbmV3IEVsZW1lbnRGaW5kZXJfMS5FbGVtZW50RmluZGVyKGRlc3RpbmF0aW9uXzEuc2NvcGVDaGVja2VyLm5hbWVzcGFjZSwgX3RoaXMuaXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdFbG0gPSBlbGVtZW50RmluZGVyLmNhbGwoKVswXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld1N1YiA9IGZyb21FdmVudF8xLmZyb21FdmVudChuZXdFbG0sIHR5cGUsIGZhbHNlLCBmYWxzZSwgZGVzdGluYXRpb25fMS5wYXNzaXZlKS5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF90aGlzLm9uRXZlbnQodHlwZSwgZXZlbnQsICEhZGVzdGluYXRpb25fMS5wYXNzaXZlLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnQodHlwZSwgbmV3RWxtLCB7IHN1YjogbmV3U3ViLCBkZXN0aW5hdGlvbjogZGVzdGluYXRpb25fMSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGluc2VydCh0eXBlLCBlbG0sIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIF90aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzID0gbmV3TWFwO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5wdXROb25CdWJibGluZ0xpc3RlbmVyID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgZWxtLCB1c2VDYXB0dXJlLCBwYXNzaXZlKSB7XG4gICAgICAgIHZhciBtYXAgPSB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmdldChldmVudFR5cGUpO1xuICAgICAgICBpZiAoIW1hcCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsaXN0ZW5lciA9IG1hcC5nZXQoZWxtKTtcbiAgICAgICAgaWYgKGxpc3RlbmVyICYmXG4gICAgICAgICAgICBsaXN0ZW5lci5kZXN0aW5hdGlvbi5wYXNzaXZlID09PSBwYXNzaXZlICYmXG4gICAgICAgICAgICBsaXN0ZW5lci5kZXN0aW5hdGlvbi51c2VDYXB0dXJlID09PSB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICB0aGlzLnZpcnR1YWxOb25CdWJibGluZ0xpc3RlbmVyWzBdID0gbGlzdGVuZXIuZGVzdGluYXRpb247XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5vbkV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgZXZlbnQsIHBhc3NpdmUsIGJ1YmJsZXMpIHtcbiAgICAgICAgaWYgKGJ1YmJsZXMgPT09IHZvaWQgMCkgeyBidWJibGVzID0gdHJ1ZTsgfVxuICAgICAgICB2YXIgY3ljbGVFdmVudCA9IHRoaXMucGF0Y2hFdmVudChldmVudCk7XG4gICAgICAgIHZhciByb290RWxlbWVudCA9IHRoaXMuaXNvbGF0ZU1vZHVsZS5nZXRSb290RWxlbWVudChldmVudC50YXJnZXQpO1xuICAgICAgICBpZiAoYnViYmxlcykge1xuICAgICAgICAgICAgdmFyIG5hbWVzcGFjZSA9IHRoaXMuaXNvbGF0ZU1vZHVsZS5nZXROYW1lc3BhY2UoZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgICAgIGlmICghbmFtZXNwYWNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGxpc3RlbmVycyA9IHRoaXMuZ2V0VmlydHVhbExpc3RlbmVycyhldmVudFR5cGUsIG5hbWVzcGFjZSk7XG4gICAgICAgICAgICB0aGlzLmJ1YmJsZShldmVudFR5cGUsIGV2ZW50LnRhcmdldCwgcm9vdEVsZW1lbnQsIGN5Y2xlRXZlbnQsIGxpc3RlbmVycywgbmFtZXNwYWNlLCBuYW1lc3BhY2UubGVuZ3RoIC0gMSwgdHJ1ZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICB0aGlzLmJ1YmJsZShldmVudFR5cGUsIGV2ZW50LnRhcmdldCwgcm9vdEVsZW1lbnQsIGN5Y2xlRXZlbnQsIGxpc3RlbmVycywgbmFtZXNwYWNlLCBuYW1lc3BhY2UubGVuZ3RoIC0gMSwgZmFsc2UsIHBhc3NpdmUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5wdXROb25CdWJibGluZ0xpc3RlbmVyKGV2ZW50VHlwZSwgZXZlbnQudGFyZ2V0LCB0cnVlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgIHRoaXMuZG9CdWJibGVTdGVwKGV2ZW50VHlwZSwgZXZlbnQudGFyZ2V0LCByb290RWxlbWVudCwgY3ljbGVFdmVudCwgdGhpcy52aXJ0dWFsTm9uQnViYmxpbmdMaXN0ZW5lciwgdHJ1ZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICB0aGlzLnB1dE5vbkJ1YmJsaW5nTGlzdGVuZXIoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIGZhbHNlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgIHRoaXMuZG9CdWJibGVTdGVwKGV2ZW50VHlwZSwgZXZlbnQudGFyZ2V0LCByb290RWxlbWVudCwgY3ljbGVFdmVudCwgdGhpcy52aXJ0dWFsTm9uQnViYmxpbmdMaXN0ZW5lciwgZmFsc2UsIHBhc3NpdmUpO1xuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7IC8vZml4IHJlc2V0IGV2ZW50IChzcGVjJ2VkIGFzIG5vbi1idWJibGluZywgYnV0IGJ1YmJsZXMgaW4gcmVhbGl0eVxuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuYnViYmxlID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgZWxtLCByb290RWxlbWVudCwgZXZlbnQsIGxpc3RlbmVycywgbmFtZXNwYWNlLCBpbmRleCwgdXNlQ2FwdHVyZSwgcGFzc2l2ZSkge1xuICAgICAgICBpZiAoIXVzZUNhcHR1cmUgJiYgIWV2ZW50LnByb3BhZ2F0aW9uSGFzQmVlblN0b3BwZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZG9CdWJibGVTdGVwKGV2ZW50VHlwZSwgZWxtLCByb290RWxlbWVudCwgZXZlbnQsIGxpc3RlbmVycywgdXNlQ2FwdHVyZSwgcGFzc2l2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5ld1Jvb3QgPSByb290RWxlbWVudDtcbiAgICAgICAgdmFyIG5ld0luZGV4ID0gaW5kZXg7XG4gICAgICAgIGlmIChlbG0gPT09IHJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBuYW1lc3BhY2VbaW5kZXhdLnR5cGUgPT09ICdzaWJsaW5nJykge1xuICAgICAgICAgICAgICAgIG5ld1Jvb3QgPSB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0RWxlbWVudChuYW1lc3BhY2UsIGluZGV4KTtcbiAgICAgICAgICAgICAgICBuZXdJbmRleC0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChlbG0ucGFyZW50Tm9kZSAmJiBuZXdSb290KSB7XG4gICAgICAgICAgICB0aGlzLmJ1YmJsZShldmVudFR5cGUsIGVsbS5wYXJlbnROb2RlLCBuZXdSb290LCBldmVudCwgbGlzdGVuZXJzLCBuYW1lc3BhY2UsIG5ld0luZGV4LCB1c2VDYXB0dXJlLCBwYXNzaXZlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXNlQ2FwdHVyZSAmJiAhZXZlbnQucHJvcGFnYXRpb25IYXNCZWVuU3RvcHBlZCkge1xuICAgICAgICAgICAgdGhpcy5kb0J1YmJsZVN0ZXAoZXZlbnRUeXBlLCBlbG0sIHJvb3RFbGVtZW50LCBldmVudCwgbGlzdGVuZXJzLCB1c2VDYXB0dXJlLCBwYXNzaXZlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLmRvQnViYmxlU3RlcCA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGVsbSwgcm9vdEVsZW1lbnQsIGV2ZW50LCBsaXN0ZW5lcnMsIHVzZUNhcHR1cmUsIHBhc3NpdmUpIHtcbiAgICAgICAgaWYgKCFyb290RWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubXV0YXRlRXZlbnRDdXJyZW50VGFyZ2V0KGV2ZW50LCBlbG0pO1xuICAgICAgICBsaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAoZGVzdCkge1xuICAgICAgICAgICAgaWYgKGRlc3QucGFzc2l2ZSA9PT0gcGFzc2l2ZSAmJiBkZXN0LnVzZUNhcHR1cmUgPT09IHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VsID0gdXRpbHNfMS5nZXRTZWxlY3RvcnMoZGVzdC5zY29wZUNoZWNrZXIubmFtZXNwYWNlKTtcbiAgICAgICAgICAgICAgICBpZiAoIWV2ZW50LnByb3BhZ2F0aW9uSGFzQmVlblN0b3BwZWQgJiZcbiAgICAgICAgICAgICAgICAgICAgZGVzdC5zY29wZUNoZWNrZXIuaXNEaXJlY3RseUluU2NvcGUoZWxtKSAmJlxuICAgICAgICAgICAgICAgICAgICAoKHNlbCAhPT0gJycgJiYgZWxtLm1hdGNoZXMoc2VsKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChzZWwgPT09ICcnICYmIGVsbSA9PT0gcm9vdEVsZW1lbnQpKSkge1xuICAgICAgICAgICAgICAgICAgICBmcm9tRXZlbnRfMS5wcmV2ZW50RGVmYXVsdENvbmRpdGlvbmFsKGV2ZW50LCBkZXN0LnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgZGVzdC5zdWJqZWN0LnNoYW1lZnVsbHlTZW5kTmV4dChldmVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5wYXRjaEV2ZW50ID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHZhciBwRXZlbnQgPSBldmVudDtcbiAgICAgICAgcEV2ZW50LnByb3BhZ2F0aW9uSGFzQmVlblN0b3BwZWQgPSBmYWxzZTtcbiAgICAgICAgdmFyIG9sZFN0b3BQcm9wYWdhdGlvbiA9IHBFdmVudC5zdG9wUHJvcGFnYXRpb247XG4gICAgICAgIHBFdmVudC5zdG9wUHJvcGFnYXRpb24gPSBmdW5jdGlvbiBzdG9wUHJvcGFnYXRpb24oKSB7XG4gICAgICAgICAgICBvbGRTdG9wUHJvcGFnYXRpb24uY2FsbCh0aGlzKTtcbiAgICAgICAgICAgIHRoaXMucHJvcGFnYXRpb25IYXNCZWVuU3RvcHBlZCA9IHRydWU7XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBwRXZlbnQ7XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUubXV0YXRlRXZlbnRDdXJyZW50VGFyZ2V0ID0gZnVuY3Rpb24gKGV2ZW50LCBjdXJyZW50VGFyZ2V0RWxlbWVudCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV2ZW50LCBcImN1cnJlbnRUYXJnZXRcIiwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBjdXJyZW50VGFyZ2V0RWxlbWVudCxcbiAgICAgICAgICAgICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInBsZWFzZSB1c2UgZXZlbnQub3duZXJUYXJnZXRcIik7XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnQub3duZXJUYXJnZXQgPSBjdXJyZW50VGFyZ2V0RWxlbWVudDtcbiAgICB9O1xuICAgIHJldHVybiBFdmVudERlbGVnYXRvcjtcbn0oKSk7XG5leHBvcnRzLkV2ZW50RGVsZWdhdG9yID0gRXZlbnREZWxlZ2F0b3I7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FdmVudERlbGVnYXRvci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgU3ltYm9sVHJlZV8xID0gcmVxdWlyZShcIi4vU3ltYm9sVHJlZVwiKTtcbnZhciBJc29sYXRlTW9kdWxlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIElzb2xhdGVNb2R1bGUoKSB7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlVHJlZSA9IG5ldyBTeW1ib2xUcmVlXzEuZGVmYXVsdChmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5zY29wZTsgfSk7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlQnlFbGVtZW50ID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLnZub2Rlc0JlaW5nUmVtb3ZlZCA9IFtdO1xuICAgIH1cbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5zZXRFdmVudERlbGVnYXRvciA9IGZ1bmN0aW9uIChkZWwpIHtcbiAgICAgICAgdGhpcy5ldmVudERlbGVnYXRvciA9IGRlbDtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmluc2VydEVsZW1lbnQgPSBmdW5jdGlvbiAobmFtZXNwYWNlLCBlbCkge1xuICAgICAgICB0aGlzLm5hbWVzcGFjZUJ5RWxlbWVudC5zZXQoZWwsIG5hbWVzcGFjZSk7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlVHJlZS5zZXQobmFtZXNwYWNlLCBlbCk7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5yZW1vdmVFbGVtZW50ID0gZnVuY3Rpb24gKGVsbSkge1xuICAgICAgICB0aGlzLm5hbWVzcGFjZUJ5RWxlbWVudC5kZWxldGUoZWxtKTtcbiAgICAgICAgdmFyIG5hbWVzcGFjZSA9IHRoaXMuZ2V0TmFtZXNwYWNlKGVsbSk7XG4gICAgICAgIGlmIChuYW1lc3BhY2UpIHtcbiAgICAgICAgICAgIHRoaXMubmFtZXNwYWNlVHJlZS5kZWxldGUobmFtZXNwYWNlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuZ2V0RWxlbWVudCA9IGZ1bmN0aW9uIChuYW1lc3BhY2UsIG1heCkge1xuICAgICAgICByZXR1cm4gdGhpcy5uYW1lc3BhY2VUcmVlLmdldChuYW1lc3BhY2UsIHVuZGVmaW5lZCwgbWF4KTtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmdldFJvb3RFbGVtZW50ID0gZnVuY3Rpb24gKGVsbSkge1xuICAgICAgICBpZiAodGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQuaGFzKGVsbSkpIHtcbiAgICAgICAgICAgIHJldHVybiBlbG07XG4gICAgICAgIH1cbiAgICAgICAgLy9UT0RPOiBBZGQgcXVpY2stbHJ1IG9yIHNpbWlsYXIgYXMgYWRkaXRpb25hbCBPKDEpIGNhY2hlXG4gICAgICAgIHZhciBjdXJyID0gZWxtO1xuICAgICAgICB3aGlsZSAoIXRoaXMubmFtZXNwYWNlQnlFbGVtZW50LmhhcyhjdXJyKSkge1xuICAgICAgICAgICAgY3VyciA9IGN1cnIucGFyZW50Tm9kZTtcbiAgICAgICAgICAgIGlmICghY3Vycikge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjdXJyLnRhZ05hbWUgPT09ICdIVE1MJykge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcm9vdCBlbGVtZW50IGZvdW5kLCB0aGlzIHNob3VsZCBub3QgaGFwcGVuIGF0IGFsbCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuZ2V0TmFtZXNwYWNlID0gZnVuY3Rpb24gKGVsbSkge1xuICAgICAgICB2YXIgcm9vdEVsZW1lbnQgPSB0aGlzLmdldFJvb3RFbGVtZW50KGVsbSk7XG4gICAgICAgIGlmICghcm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlQnlFbGVtZW50LmdldChyb290RWxlbWVudCk7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5jcmVhdGVNb2R1bGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKGVtcHR5Vk5vZGUsIHZOb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVsbSA9IHZOb2RlLmVsbSwgX2EgPSB2Tm9kZS5kYXRhLCBkYXRhID0gX2EgPT09IHZvaWQgMCA/IHt9IDogX2E7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWVzcGFjZSA9IGRhdGEuaXNvbGF0ZTtcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShuYW1lc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5zZXJ0RWxlbWVudChuYW1lc3BhY2UsIGVsbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKG9sZFZOb2RlLCB2Tm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBvbGRFbG0gPSBvbGRWTm9kZS5lbG0sIF9hID0gb2xkVk5vZGUuZGF0YSwgb2xkRGF0YSA9IF9hID09PSB2b2lkIDAgPyB7fSA6IF9hO1xuICAgICAgICAgICAgICAgIHZhciBlbG0gPSB2Tm9kZS5lbG0sIF9iID0gdk5vZGUuZGF0YSwgZGF0YSA9IF9iID09PSB2b2lkIDAgPyB7fSA6IF9iO1xuICAgICAgICAgICAgICAgIHZhciBvbGROYW1lc3BhY2UgPSBvbGREYXRhLmlzb2xhdGU7XG4gICAgICAgICAgICAgICAgdmFyIG5hbWVzcGFjZSA9IGRhdGEuaXNvbGF0ZTtcbiAgICAgICAgICAgICAgICBpZiAoIXV0aWxzXzEuaXNFcXVhbE5hbWVzcGFjZShvbGROYW1lc3BhY2UsIG5hbWVzcGFjZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2xkTmFtZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVFbGVtZW50KG9sZEVsbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobmFtZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmluc2VydEVsZW1lbnQobmFtZXNwYWNlLCBlbG0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAodk5vZGUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnZub2Rlc0JlaW5nUmVtb3ZlZC5wdXNoKHZOb2RlKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZW1vdmU6IGZ1bmN0aW9uICh2Tm9kZSwgY2IpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnZub2Rlc0JlaW5nUmVtb3ZlZC5wdXNoKHZOb2RlKTtcbiAgICAgICAgICAgICAgICBjYigpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvc3Q6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgdm5vZGVzQmVpbmdSZW1vdmVkID0gc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQ7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IHZub2Rlc0JlaW5nUmVtb3ZlZC5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdm5vZGUgPSB2bm9kZXNCZWluZ1JlbW92ZWRbaV07XG4gICAgICAgICAgICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSB2bm9kZS5kYXRhICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgID8gdm5vZGUuZGF0YS5pc29sYXRpb25cbiAgICAgICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICBpZiAobmFtZXNwYWNlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlRWxlbWVudChuYW1lc3BhY2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZXZlbnREZWxlZ2F0b3IucmVtb3ZlRWxlbWVudCh2bm9kZS5lbG0sIG5hbWVzcGFjZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkID0gW107XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH07XG4gICAgcmV0dXJuIElzb2xhdGVNb2R1bGU7XG59KCkpO1xuZXhwb3J0cy5Jc29sYXRlTW9kdWxlID0gSXNvbGF0ZU1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUlzb2xhdGVNb2R1bGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBEb2N1bWVudERPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vRG9jdW1lbnRET01Tb3VyY2VcIik7XG52YXIgQm9keURPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vQm9keURPTVNvdXJjZVwiKTtcbnZhciBFbGVtZW50RmluZGVyXzEgPSByZXF1aXJlKFwiLi9FbGVtZW50RmluZGVyXCIpO1xudmFyIGlzb2xhdGVfMSA9IHJlcXVpcmUoXCIuL2lzb2xhdGVcIik7XG52YXIgTWFpbkRPTVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNYWluRE9NU291cmNlKF9yb290RWxlbWVudCQsIF9zYW5pdGF0aW9uJCwgX25hbWVzcGFjZSwgX2lzb2xhdGVNb2R1bGUsIF9ldmVudERlbGVnYXRvciwgX25hbWUpIHtcbiAgICAgICAgaWYgKF9uYW1lc3BhY2UgPT09IHZvaWQgMCkgeyBfbmFtZXNwYWNlID0gW107IH1cbiAgICAgICAgdGhpcy5fcm9vdEVsZW1lbnQkID0gX3Jvb3RFbGVtZW50JDtcbiAgICAgICAgdGhpcy5fc2FuaXRhdGlvbiQgPSBfc2FuaXRhdGlvbiQ7XG4gICAgICAgIHRoaXMuX25hbWVzcGFjZSA9IF9uYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuX2lzb2xhdGVNb2R1bGUgPSBfaXNvbGF0ZU1vZHVsZTtcbiAgICAgICAgdGhpcy5fZXZlbnREZWxlZ2F0b3IgPSBfZXZlbnREZWxlZ2F0b3I7XG4gICAgICAgIHRoaXMuX25hbWUgPSBfbmFtZTtcbiAgICAgICAgdGhpcy5pc29sYXRlU291cmNlID0gZnVuY3Rpb24gKHNvdXJjZSwgc2NvcGUpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgTWFpbkRPTVNvdXJjZShzb3VyY2UuX3Jvb3RFbGVtZW50JCwgc291cmNlLl9zYW5pdGF0aW9uJCwgc291cmNlLl9uYW1lc3BhY2UuY29uY2F0KGlzb2xhdGVfMS5nZXRTY29wZU9iaihzY29wZSkpLCBzb3VyY2UuX2lzb2xhdGVNb2R1bGUsIHNvdXJjZS5fZXZlbnREZWxlZ2F0b3IsIHNvdXJjZS5fbmFtZSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuaXNvbGF0ZVNpbmsgPSBpc29sYXRlXzEubWFrZUlzb2xhdGVTaW5rKHRoaXMuX25hbWVzcGFjZSk7XG4gICAgfVxuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLl9lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuX25hbWVzcGFjZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yb290RWxlbWVudCQubWFwKGZ1bmN0aW9uICh4KSB7IHJldHVybiBbeF07IH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnRGaW5kZXJfMSA9IG5ldyBFbGVtZW50RmluZGVyXzEuRWxlbWVudEZpbmRlcih0aGlzLl9uYW1lc3BhY2UsIHRoaXMuX2lzb2xhdGVNb2R1bGUpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50JC5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gZWxlbWVudEZpbmRlcl8xLmNhbGwoKTsgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh0aGlzLl9lbGVtZW50cygpLnJlbWVtYmVyKCkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQodGhpcy5fZWxlbWVudHMoKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYXJyKSB7IHJldHVybiBhcnIubGVuZ3RoID4gMDsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGFycikgeyByZXR1cm4gYXJyWzBdOyB9KVxuICAgICAgICAgICAgLnJlbWVtYmVyKCkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE1haW5ET01Tb3VyY2UucHJvdG90eXBlLCBcIm5hbWVzcGFjZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25hbWVzcGFjZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJET00gZHJpdmVyJ3Mgc2VsZWN0KCkgZXhwZWN0cyB0aGUgYXJndW1lbnQgdG8gYmUgYSBcIiArXG4gICAgICAgICAgICAgICAgXCJzdHJpbmcgYXMgYSBDU1Mgc2VsZWN0b3JcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnZG9jdW1lbnQnKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERvY3VtZW50RE9NU291cmNlXzEuRG9jdW1lbnRET01Tb3VyY2UodGhpcy5fbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnYm9keScpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQm9keURPTVNvdXJjZV8xLkJvZHlET01Tb3VyY2UodGhpcy5fbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5hbWVzcGFjZSA9IHNlbGVjdG9yID09PSAnOnJvb3QnXG4gICAgICAgICAgICA/IFtdXG4gICAgICAgICAgICA6IHRoaXMuX25hbWVzcGFjZS5jb25jYXQoeyB0eXBlOiAnc2VsZWN0b3InLCBzY29wZTogc2VsZWN0b3IudHJpbSgpIH0pO1xuICAgICAgICByZXR1cm4gbmV3IE1haW5ET01Tb3VyY2UodGhpcy5fcm9vdEVsZW1lbnQkLCB0aGlzLl9zYW5pdGF0aW9uJCwgbmFtZXNwYWNlLCB0aGlzLl9pc29sYXRlTW9kdWxlLCB0aGlzLl9ldmVudERlbGVnYXRvciwgdGhpcy5fbmFtZSk7XG4gICAgfTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBvcHRpb25zLCBidWJibGVzKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnRUeXBlICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJET00gZHJpdmVyJ3MgZXZlbnRzKCkgZXhwZWN0cyBhcmd1bWVudCB0byBiZSBhIFwiICtcbiAgICAgICAgICAgICAgICBcInN0cmluZyByZXByZXNlbnRpbmcgdGhlIGV2ZW50IHR5cGUgdG8gbGlzdGVuIGZvci5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGV2ZW50JCA9IHRoaXMuX2V2ZW50RGVsZWdhdG9yLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLl9uYW1lc3BhY2UsIG9wdGlvbnMsIGJ1YmJsZXMpO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChldmVudCQpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fc2FuaXRhdGlvbiQuc2hhbWVmdWxseVNlbmROZXh0KG51bGwpO1xuICAgICAgICAvL3RoaXMuX2lzb2xhdGVNb2R1bGUucmVzZXQoKTtcbiAgICB9O1xuICAgIHJldHVybiBNYWluRE9NU291cmNlO1xufSgpKTtcbmV4cG9ydHMuTWFpbkRPTVNvdXJjZSA9IE1haW5ET01Tb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1NYWluRE9NU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFByaW9yaXR5UXVldWUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUHJpb3JpdHlRdWV1ZSgpIHtcbiAgICAgICAgdGhpcy5hcnIgPSBbXTtcbiAgICAgICAgdGhpcy5wcmlvcyA9IFtdO1xuICAgIH1cbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodCwgcHJpbykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5wcmlvc1tpXSA8IHByaW8pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFyci5zcGxpY2UoaSwgMCwgdCk7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmlvcy5zcGxpY2UoaSwgMCwgcHJpbyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuYXJyLnB1c2godCk7XG4gICAgICAgIHRoaXMucHJpb3MucHVzaChwcmlvKTtcbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoZikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBmKHRoaXMuYXJyW2ldLCBpLCB0aGlzLmFycik7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmFycltpXSA9PT0gdCkge1xuICAgICAgICAgICAgICAgIHRoaXMuYXJyLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB0aGlzLnByaW9zLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBQcmlvcml0eVF1ZXVlO1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IFByaW9yaXR5UXVldWU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Qcmlvcml0eVF1ZXVlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFJlbW92YWxTZXQgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUmVtb3ZhbFNldCgpIHtcbiAgICAgICAgdGhpcy50b0RlbGV0ZSA9IFtdO1xuICAgICAgICB0aGlzLnRvRGVsZXRlU2l6ZSA9IDA7XG4gICAgICAgIHRoaXMuX3NldCA9IG5ldyBTZXQoKTtcbiAgICB9XG4gICAgUmVtb3ZhbFNldC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdGhpcy5fc2V0LmFkZCh0KTtcbiAgICB9O1xuICAgIFJlbW92YWxTZXQucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoZikge1xuICAgICAgICB0aGlzLl9zZXQuZm9yRWFjaChmKTtcbiAgICAgICAgdGhpcy5mbHVzaCgpO1xuICAgIH07XG4gICAgUmVtb3ZhbFNldC5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgaWYgKHRoaXMudG9EZWxldGUubGVuZ3RoID09PSB0aGlzLnRvRGVsZXRlU2l6ZSkge1xuICAgICAgICAgICAgdGhpcy50b0RlbGV0ZS5wdXNoKHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50b0RlbGV0ZVt0aGlzLnRvRGVsZXRlU2l6ZV0gPSB0O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudG9EZWxldGVTaXplKys7XG4gICAgfTtcbiAgICBSZW1vdmFsU2V0LnByb3RvdHlwZS5mbHVzaCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnRvRGVsZXRlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaSA8IHRoaXMudG9EZWxldGVTaXplKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2V0LmRlbGV0ZSh0aGlzLnRvRGVsZXRlW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudG9EZWxldGVbaV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50b0RlbGV0ZVNpemUgPSAwO1xuICAgIH07XG4gICAgcmV0dXJuIFJlbW92YWxTZXQ7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gUmVtb3ZhbFNldDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVJlbW92YWxTZXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIFNjb3BlQ2hlY2tlciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTY29wZUNoZWNrZXIobmFtZXNwYWNlLCBpc29sYXRlTW9kdWxlKSB7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgICAgICB0aGlzLmlzb2xhdGVNb2R1bGUgPSBpc29sYXRlTW9kdWxlO1xuICAgICAgICB0aGlzLl9uYW1lc3BhY2UgPSBuYW1lc3BhY2UuZmlsdGVyKGZ1bmN0aW9uIChuKSB7IHJldHVybiBuLnR5cGUgIT09ICdzZWxlY3Rvcic7IH0pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDaGVja3Mgd2hldGhlciB0aGUgZ2l2ZW4gZWxlbWVudCBpcyAqZGlyZWN0bHkqIGluIHRoZSBzY29wZSBvZiB0aGlzXG4gICAgICogc2NvcGUgY2hlY2tlci4gQmVpbmcgY29udGFpbmVkICppbmRpcmVjdGx5KiB0aHJvdWdoIG90aGVyIHNjb3Blc1xuICAgICAqIGlzIG5vdCB2YWxpZC4gVGhpcyBpcyBjcnVjaWFsIGZvciBpbXBsZW1lbnRpbmcgcGFyZW50LWNoaWxkIGlzb2xhdGlvbixcbiAgICAgKiBzbyB0aGF0IHRoZSBwYXJlbnQgc2VsZWN0b3JzIGRvbid0IHNlYXJjaCBpbnNpZGUgYSBjaGlsZCBzY29wZS5cbiAgICAgKi9cbiAgICBTY29wZUNoZWNrZXIucHJvdG90eXBlLmlzRGlyZWN0bHlJblNjb3BlID0gZnVuY3Rpb24gKGxlYWYpIHtcbiAgICAgICAgdmFyIG5hbWVzcGFjZSA9IHRoaXMuaXNvbGF0ZU1vZHVsZS5nZXROYW1lc3BhY2UobGVhZik7XG4gICAgICAgIGlmICghbmFtZXNwYWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuX25hbWVzcGFjZS5sZW5ndGggPiBuYW1lc3BhY2UubGVuZ3RoIHx8XG4gICAgICAgICAgICAhdXRpbHNfMS5pc0VxdWFsTmFtZXNwYWNlKHRoaXMuX25hbWVzcGFjZSwgbmFtZXNwYWNlLnNsaWNlKDAsIHRoaXMuX25hbWVzcGFjZS5sZW5ndGgpKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSB0aGlzLl9uYW1lc3BhY2UubGVuZ3RoOyBpIDwgbmFtZXNwYWNlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAobmFtZXNwYWNlW2ldLnR5cGUgPT09ICd0b3RhbCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICByZXR1cm4gU2NvcGVDaGVja2VyO1xufSgpKTtcbmV4cG9ydHMuU2NvcGVDaGVja2VyID0gU2NvcGVDaGVja2VyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U2NvcGVDaGVja2VyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFN5bWJvbFRyZWUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3ltYm9sVHJlZShtYXBwZXIpIHtcbiAgICAgICAgdGhpcy5tYXBwZXIgPSBtYXBwZXI7XG4gICAgICAgIHRoaXMudHJlZSA9IFt1bmRlZmluZWQsIHt9XTtcbiAgICB9XG4gICAgU3ltYm9sVHJlZS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHBhdGgsIGVsZW1lbnQsIG1heCkge1xuICAgICAgICB2YXIgY3VyciA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIF9tYXggPSBtYXggIT09IHVuZGVmaW5lZCA/IG1heCA6IHBhdGgubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IF9tYXg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLm1hcHBlcihwYXRoW2ldKTtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGN1cnJbMV1bbl07XG4gICAgICAgICAgICBpZiAoIWNoaWxkKSB7XG4gICAgICAgICAgICAgICAgY2hpbGQgPSBbdW5kZWZpbmVkLCB7fV07XG4gICAgICAgICAgICAgICAgY3VyclsxXVtuXSA9IGNoaWxkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VyciA9IGNoaWxkO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJbMF0gPSBlbGVtZW50O1xuICAgIH07XG4gICAgU3ltYm9sVHJlZS5wcm90b3R5cGUuZ2V0RGVmYXVsdCA9IGZ1bmN0aW9uIChwYXRoLCBta0RlZmF1bHRFbGVtZW50LCBtYXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KHBhdGgsIG1rRGVmYXVsdEVsZW1lbnQsIG1heCk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBwYXlsb2FkIG9mIHRoZSBwYXRoXG4gICAgICogSWYgYSBkZWZhdWx0IGVsZW1lbnQgY3JlYXRvciBpcyBnaXZlbiwgaXQgd2lsbCBpbnNlcnQgaXQgYXQgdGhlIHBhdGhcbiAgICAgKi9cbiAgICBTeW1ib2xUcmVlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAocGF0aCwgbWtEZWZhdWx0RWxlbWVudCwgbWF4KSB7XG4gICAgICAgIHZhciBjdXJyID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgX21heCA9IG1heCAhPT0gdW5kZWZpbmVkID8gbWF4IDogcGF0aC5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX21heDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMubWFwcGVyKHBhdGhbaV0pO1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gY3VyclsxXVtuXTtcbiAgICAgICAgICAgIGlmICghY2hpbGQpIHtcbiAgICAgICAgICAgICAgICBpZiAobWtEZWZhdWx0RWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZCA9IFt1bmRlZmluZWQsIHt9XTtcbiAgICAgICAgICAgICAgICAgICAgY3VyclsxXVtuXSA9IGNoaWxkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyID0gY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1rRGVmYXVsdEVsZW1lbnQgJiYgIWN1cnJbMF0pIHtcbiAgICAgICAgICAgIGN1cnJbMF0gPSBta0RlZmF1bHRFbGVtZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnJbMF07XG4gICAgfTtcbiAgICBTeW1ib2xUcmVlLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAocGF0aCkge1xuICAgICAgICB2YXIgY3VyciA9IHRoaXMudHJlZTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gY3VyclsxXVt0aGlzLm1hcHBlcihwYXRoW2ldKV07XG4gICAgICAgICAgICBpZiAoIWNoaWxkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VyciA9IGNoaWxkO1xuICAgICAgICB9XG4gICAgICAgIGRlbGV0ZSBjdXJyWzFdW3RoaXMubWFwcGVyKHBhdGhbcGF0aC5sZW5ndGggLSAxXSldO1xuICAgIH07XG4gICAgcmV0dXJuIFN5bWJvbFRyZWU7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gU3ltYm9sVHJlZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVN5bWJvbFRyZWUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdm5vZGVfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS92bm9kZVwiKTtcbnZhciBoXzEgPSByZXF1aXJlKFwic25hYmJkb20vaFwiKTtcbnZhciBzbmFiYmRvbV9zZWxlY3Rvcl8xID0gcmVxdWlyZShcInNuYWJiZG9tLXNlbGVjdG9yXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBWTm9kZVdyYXBwZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gVk5vZGVXcmFwcGVyKHJvb3RFbGVtZW50KSB7XG4gICAgICAgIHRoaXMucm9vdEVsZW1lbnQgPSByb290RWxlbWVudDtcbiAgICB9XG4gICAgVk5vZGVXcmFwcGVyLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKHZub2RlKSB7XG4gICAgICAgIGlmICh1dGlsc18xLmlzRG9jRnJhZyh0aGlzLnJvb3RFbGVtZW50KSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMud3JhcERvY0ZyYWcodm5vZGUgPT09IG51bGwgPyBbXSA6IFt2bm9kZV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh2bm9kZSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMud3JhcChbXSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIF9hID0gc25hYmJkb21fc2VsZWN0b3JfMS5zZWxlY3RvclBhcnNlcih2bm9kZSksIHNlbFRhZ05hbWUgPSBfYS50YWdOYW1lLCBzZWxJZCA9IF9hLmlkO1xuICAgICAgICB2YXIgdk5vZGVDbGFzc05hbWUgPSBzbmFiYmRvbV9zZWxlY3Rvcl8xLmNsYXNzTmFtZUZyb21WTm9kZSh2bm9kZSk7XG4gICAgICAgIHZhciB2Tm9kZURhdGEgPSB2bm9kZS5kYXRhIHx8IHt9O1xuICAgICAgICB2YXIgdk5vZGVEYXRhUHJvcHMgPSB2Tm9kZURhdGEucHJvcHMgfHwge307XG4gICAgICAgIHZhciBfYiA9IHZOb2RlRGF0YVByb3BzLmlkLCB2Tm9kZUlkID0gX2IgPT09IHZvaWQgMCA/IHNlbElkIDogX2I7XG4gICAgICAgIHZhciBpc1ZOb2RlQW5kUm9vdEVsZW1lbnRJZGVudGljYWwgPSB0eXBlb2Ygdk5vZGVJZCA9PT0gJ3N0cmluZycgJiZcbiAgICAgICAgICAgIHZOb2RlSWQudG9VcHBlckNhc2UoKSA9PT0gdGhpcy5yb290RWxlbWVudC5pZC50b1VwcGVyQ2FzZSgpICYmXG4gICAgICAgICAgICBzZWxUYWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09IHRoaXMucm9vdEVsZW1lbnQudGFnTmFtZS50b1VwcGVyQ2FzZSgpICYmXG4gICAgICAgICAgICB2Tm9kZUNsYXNzTmFtZS50b1VwcGVyQ2FzZSgpID09PSB0aGlzLnJvb3RFbGVtZW50LmNsYXNzTmFtZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICBpZiAoaXNWTm9kZUFuZFJvb3RFbGVtZW50SWRlbnRpY2FsKSB7XG4gICAgICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMud3JhcChbdm5vZGVdKTtcbiAgICB9O1xuICAgIFZOb2RlV3JhcHBlci5wcm90b3R5cGUud3JhcERvY0ZyYWcgPSBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICAgICAgcmV0dXJuIHZub2RlXzEudm5vZGUoJycsIHsgaXNvbGF0ZTogW10gfSwgY2hpbGRyZW4sIHVuZGVmaW5lZCwgdGhpc1xuICAgICAgICAgICAgLnJvb3RFbGVtZW50KTtcbiAgICB9O1xuICAgIFZOb2RlV3JhcHBlci5wcm90b3R5cGUud3JhcCA9IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgICAgICB2YXIgX2EgPSB0aGlzLnJvb3RFbGVtZW50LCB0YWdOYW1lID0gX2EudGFnTmFtZSwgaWQgPSBfYS5pZCwgY2xhc3NOYW1lID0gX2EuY2xhc3NOYW1lO1xuICAgICAgICB2YXIgc2VsSWQgPSBpZCA/IFwiI1wiICsgaWQgOiAnJztcbiAgICAgICAgdmFyIHNlbENsYXNzID0gY2xhc3NOYW1lID8gXCIuXCIgKyBjbGFzc05hbWUuc3BsaXQoXCIgXCIpLmpvaW4oXCIuXCIpIDogJyc7XG4gICAgICAgIHZhciB2bm9kZSA9IGhfMS5oKFwiXCIgKyB0YWdOYW1lLnRvTG93ZXJDYXNlKCkgKyBzZWxJZCArIHNlbENsYXNzLCB7fSwgY2hpbGRyZW4pO1xuICAgICAgICB2bm9kZS5kYXRhID0gdm5vZGUuZGF0YSB8fCB7fTtcbiAgICAgICAgdm5vZGUuZGF0YS5pc29sYXRlID0gdm5vZGUuZGF0YS5pc29sYXRlIHx8IFtdO1xuICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgfTtcbiAgICByZXR1cm4gVk5vZGVXcmFwcGVyO1xufSgpKTtcbmV4cG9ydHMuVk5vZGVXcmFwcGVyID0gVk5vZGVXcmFwcGVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Vk5vZGVXcmFwcGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xuZnVuY3Rpb24gZnJvbUV2ZW50KGVsZW1lbnQsIGV2ZW50TmFtZSwgdXNlQ2FwdHVyZSwgcHJldmVudERlZmF1bHQsIHBhc3NpdmUpIHtcbiAgICBpZiAodXNlQ2FwdHVyZSA9PT0gdm9pZCAwKSB7IHVzZUNhcHR1cmUgPSBmYWxzZTsgfVxuICAgIGlmIChwcmV2ZW50RGVmYXVsdCA9PT0gdm9pZCAwKSB7IHByZXZlbnREZWZhdWx0ID0gZmFsc2U7IH1cbiAgICBpZiAocGFzc2l2ZSA9PT0gdm9pZCAwKSB7IHBhc3NpdmUgPSBmYWxzZTsgfVxuICAgIHZhciBuZXh0ID0gbnVsbDtcbiAgICByZXR1cm4geHN0cmVhbV8xLlN0cmVhbS5jcmVhdGUoe1xuICAgICAgICBzdGFydDogZnVuY3Rpb24gc3RhcnQobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIGlmIChwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICAgICAgICAgIG5leHQgPSBmdW5jdGlvbiBfbmV4dChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2ZW50RGVmYXVsdENvbmRpdGlvbmFsKGV2ZW50LCBwcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLm5leHQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBuZXh0ID0gZnVuY3Rpb24gX25leHQoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubmV4dChldmVudCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIG5leHQsIHtcbiAgICAgICAgICAgICAgICBjYXB0dXJlOiB1c2VDYXB0dXJlLFxuICAgICAgICAgICAgICAgIHBhc3NpdmU6IHBhc3NpdmUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIG5leHQsIHVzZUNhcHR1cmUpO1xuICAgICAgICB9LFxuICAgIH0pO1xufVxuZXhwb3J0cy5mcm9tRXZlbnQgPSBmcm9tRXZlbnQ7XG5mdW5jdGlvbiBtYXRjaE9iamVjdChtYXRjaGVyLCBvYmopIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hdGNoZXIpO1xuICAgIHZhciBuID0ga2V5cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xuICAgICAgICBpZiAodHlwZW9mIG1hdGNoZXJba10gPT09ICdvYmplY3QnICYmIHR5cGVvZiBvYmpba10gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBpZiAoIW1hdGNoT2JqZWN0KG1hdGNoZXJba10sIG9ialtrXSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobWF0Y2hlcltrXSAhPT0gb2JqW2tdKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBwcmV2ZW50RGVmYXVsdENvbmRpdGlvbmFsKGV2ZW50LCBwcmV2ZW50RGVmYXVsdCkge1xuICAgIGlmIChwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICBpZiAodHlwZW9mIHByZXZlbnREZWZhdWx0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNQcmVkaWNhdGUocHJldmVudERlZmF1bHQpKSB7XG4gICAgICAgICAgICBpZiAocHJldmVudERlZmF1bHQoZXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgcHJldmVudERlZmF1bHQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2hPYmplY3QocHJldmVudERlZmF1bHQsIGV2ZW50KSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3ByZXZlbnREZWZhdWx0IGhhcyB0byBiZSBlaXRoZXIgYSBib29sZWFuLCBwcmVkaWNhdGUgZnVuY3Rpb24gb3Igb2JqZWN0Jyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLnByZXZlbnREZWZhdWx0Q29uZGl0aW9uYWwgPSBwcmV2ZW50RGVmYXVsdENvbmRpdGlvbmFsO1xuZnVuY3Rpb24gaXNQcmVkaWNhdGUoZm4pIHtcbiAgICByZXR1cm4gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZnJvbUV2ZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLy8gdHNsaW50OmRpc2FibGU6bWF4LWZpbGUtbGluZS1jb3VudFxudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xuZnVuY3Rpb24gaXNWYWxpZFN0cmluZyhwYXJhbSkge1xuICAgIHJldHVybiB0eXBlb2YgcGFyYW0gPT09ICdzdHJpbmcnICYmIHBhcmFtLmxlbmd0aCA+IDA7XG59XG5mdW5jdGlvbiBpc1NlbGVjdG9yKHBhcmFtKSB7XG4gICAgcmV0dXJuIGlzVmFsaWRTdHJpbmcocGFyYW0pICYmIChwYXJhbVswXSA9PT0gJy4nIHx8IHBhcmFtWzBdID09PSAnIycpO1xufVxuZnVuY3Rpb24gY3JlYXRlVGFnRnVuY3Rpb24odGFnTmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiBoeXBlcnNjcmlwdChhLCBiLCBjKSB7XG4gICAgICAgIHZhciBoYXNBID0gdHlwZW9mIGEgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICB2YXIgaGFzQiA9IHR5cGVvZiBiICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgdmFyIGhhc0MgPSB0eXBlb2YgYyAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIGlmIChpc1NlbGVjdG9yKGEpKSB7XG4gICAgICAgICAgICBpZiAoaGFzQiAmJiBoYXNDKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCBiLCBjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGhhc0IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSArIGEsIGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaGFzQykge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCBiLCBjKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChoYXNCKSB7XG4gICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSwgYSwgYik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaGFzQSkge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUsIGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUsIHt9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG52YXIgU1ZHX1RBR19OQU1FUyA9IFtcbiAgICAnYScsXG4gICAgJ2FsdEdseXBoJyxcbiAgICAnYWx0R2x5cGhEZWYnLFxuICAgICdhbHRHbHlwaEl0ZW0nLFxuICAgICdhbmltYXRlJyxcbiAgICAnYW5pbWF0ZUNvbG9yJyxcbiAgICAnYW5pbWF0ZU1vdGlvbicsXG4gICAgJ2FuaW1hdGVUcmFuc2Zvcm0nLFxuICAgICdjaXJjbGUnLFxuICAgICdjbGlwUGF0aCcsXG4gICAgJ2NvbG9yUHJvZmlsZScsXG4gICAgJ2N1cnNvcicsXG4gICAgJ2RlZnMnLFxuICAgICdkZXNjJyxcbiAgICAnZWxsaXBzZScsXG4gICAgJ2ZlQmxlbmQnLFxuICAgICdmZUNvbG9yTWF0cml4JyxcbiAgICAnZmVDb21wb25lbnRUcmFuc2ZlcicsXG4gICAgJ2ZlQ29tcG9zaXRlJyxcbiAgICAnZmVDb252b2x2ZU1hdHJpeCcsXG4gICAgJ2ZlRGlmZnVzZUxpZ2h0aW5nJyxcbiAgICAnZmVEaXNwbGFjZW1lbnRNYXAnLFxuICAgICdmZURpc3RhbnRMaWdodCcsXG4gICAgJ2ZlRmxvb2QnLFxuICAgICdmZUZ1bmNBJyxcbiAgICAnZmVGdW5jQicsXG4gICAgJ2ZlRnVuY0cnLFxuICAgICdmZUZ1bmNSJyxcbiAgICAnZmVHYXVzc2lhbkJsdXInLFxuICAgICdmZUltYWdlJyxcbiAgICAnZmVNZXJnZScsXG4gICAgJ2ZlTWVyZ2VOb2RlJyxcbiAgICAnZmVNb3JwaG9sb2d5JyxcbiAgICAnZmVPZmZzZXQnLFxuICAgICdmZVBvaW50TGlnaHQnLFxuICAgICdmZVNwZWN1bGFyTGlnaHRpbmcnLFxuICAgICdmZVNwb3RsaWdodCcsXG4gICAgJ2ZlVGlsZScsXG4gICAgJ2ZlVHVyYnVsZW5jZScsXG4gICAgJ2ZpbHRlcicsXG4gICAgJ2ZvbnQnLFxuICAgICdmb250RmFjZScsXG4gICAgJ2ZvbnRGYWNlRm9ybWF0JyxcbiAgICAnZm9udEZhY2VOYW1lJyxcbiAgICAnZm9udEZhY2VTcmMnLFxuICAgICdmb250RmFjZVVyaScsXG4gICAgJ2ZvcmVpZ25PYmplY3QnLFxuICAgICdnJyxcbiAgICAnZ2x5cGgnLFxuICAgICdnbHlwaFJlZicsXG4gICAgJ2hrZXJuJyxcbiAgICAnaW1hZ2UnLFxuICAgICdsaW5lJyxcbiAgICAnbGluZWFyR3JhZGllbnQnLFxuICAgICdtYXJrZXInLFxuICAgICdtYXNrJyxcbiAgICAnbWV0YWRhdGEnLFxuICAgICdtaXNzaW5nR2x5cGgnLFxuICAgICdtcGF0aCcsXG4gICAgJ3BhdGgnLFxuICAgICdwYXR0ZXJuJyxcbiAgICAncG9seWdvbicsXG4gICAgJ3BvbHlsaW5lJyxcbiAgICAncmFkaWFsR3JhZGllbnQnLFxuICAgICdyZWN0JyxcbiAgICAnc2NyaXB0JyxcbiAgICAnc2V0JyxcbiAgICAnc3RvcCcsXG4gICAgJ3N0eWxlJyxcbiAgICAnc3dpdGNoJyxcbiAgICAnc3ltYm9sJyxcbiAgICAndGV4dCcsXG4gICAgJ3RleHRQYXRoJyxcbiAgICAndGl0bGUnLFxuICAgICd0cmVmJyxcbiAgICAndHNwYW4nLFxuICAgICd1c2UnLFxuICAgICd2aWV3JyxcbiAgICAndmtlcm4nLFxuXTtcbnZhciBzdmcgPSBjcmVhdGVUYWdGdW5jdGlvbignc3ZnJyk7XG5TVkdfVEFHX05BTUVTLmZvckVhY2goZnVuY3Rpb24gKHRhZykge1xuICAgIHN2Z1t0YWddID0gY3JlYXRlVGFnRnVuY3Rpb24odGFnKTtcbn0pO1xudmFyIFRBR19OQU1FUyA9IFtcbiAgICAnYScsXG4gICAgJ2FiYnInLFxuICAgICdhZGRyZXNzJyxcbiAgICAnYXJlYScsXG4gICAgJ2FydGljbGUnLFxuICAgICdhc2lkZScsXG4gICAgJ2F1ZGlvJyxcbiAgICAnYicsXG4gICAgJ2Jhc2UnLFxuICAgICdiZGknLFxuICAgICdiZG8nLFxuICAgICdibG9ja3F1b3RlJyxcbiAgICAnYm9keScsXG4gICAgJ2JyJyxcbiAgICAnYnV0dG9uJyxcbiAgICAnY2FudmFzJyxcbiAgICAnY2FwdGlvbicsXG4gICAgJ2NpdGUnLFxuICAgICdjb2RlJyxcbiAgICAnY29sJyxcbiAgICAnY29sZ3JvdXAnLFxuICAgICdkZCcsXG4gICAgJ2RlbCcsXG4gICAgJ2RldGFpbHMnLFxuICAgICdkZm4nLFxuICAgICdkaXInLFxuICAgICdkaXYnLFxuICAgICdkbCcsXG4gICAgJ2R0JyxcbiAgICAnZW0nLFxuICAgICdlbWJlZCcsXG4gICAgJ2ZpZWxkc2V0JyxcbiAgICAnZmlnY2FwdGlvbicsXG4gICAgJ2ZpZ3VyZScsXG4gICAgJ2Zvb3RlcicsXG4gICAgJ2Zvcm0nLFxuICAgICdoMScsXG4gICAgJ2gyJyxcbiAgICAnaDMnLFxuICAgICdoNCcsXG4gICAgJ2g1JyxcbiAgICAnaDYnLFxuICAgICdoZWFkJyxcbiAgICAnaGVhZGVyJyxcbiAgICAnaGdyb3VwJyxcbiAgICAnaHInLFxuICAgICdodG1sJyxcbiAgICAnaScsXG4gICAgJ2lmcmFtZScsXG4gICAgJ2ltZycsXG4gICAgJ2lucHV0JyxcbiAgICAnaW5zJyxcbiAgICAna2JkJyxcbiAgICAna2V5Z2VuJyxcbiAgICAnbGFiZWwnLFxuICAgICdsZWdlbmQnLFxuICAgICdsaScsXG4gICAgJ2xpbmsnLFxuICAgICdtYWluJyxcbiAgICAnbWFwJyxcbiAgICAnbWFyaycsXG4gICAgJ21lbnUnLFxuICAgICdtZXRhJyxcbiAgICAnbmF2JyxcbiAgICAnbm9zY3JpcHQnLFxuICAgICdvYmplY3QnLFxuICAgICdvbCcsXG4gICAgJ29wdGdyb3VwJyxcbiAgICAnb3B0aW9uJyxcbiAgICAncCcsXG4gICAgJ3BhcmFtJyxcbiAgICAncHJlJyxcbiAgICAncHJvZ3Jlc3MnLFxuICAgICdxJyxcbiAgICAncnAnLFxuICAgICdydCcsXG4gICAgJ3J1YnknLFxuICAgICdzJyxcbiAgICAnc2FtcCcsXG4gICAgJ3NjcmlwdCcsXG4gICAgJ3NlY3Rpb24nLFxuICAgICdzZWxlY3QnLFxuICAgICdzbWFsbCcsXG4gICAgJ3NvdXJjZScsXG4gICAgJ3NwYW4nLFxuICAgICdzdHJvbmcnLFxuICAgICdzdHlsZScsXG4gICAgJ3N1YicsXG4gICAgJ3N1bW1hcnknLFxuICAgICdzdXAnLFxuICAgICd0YWJsZScsXG4gICAgJ3Rib2R5JyxcbiAgICAndGQnLFxuICAgICd0ZXh0YXJlYScsXG4gICAgJ3Rmb290JyxcbiAgICAndGgnLFxuICAgICd0aGVhZCcsXG4gICAgJ3RpbWUnLFxuICAgICd0aXRsZScsXG4gICAgJ3RyJyxcbiAgICAndScsXG4gICAgJ3VsJyxcbiAgICAndmlkZW8nLFxuXTtcbnZhciBleHBvcnRlZCA9IHtcbiAgICBTVkdfVEFHX05BTUVTOiBTVkdfVEFHX05BTUVTLFxuICAgIFRBR19OQU1FUzogVEFHX05BTUVTLFxuICAgIHN2Zzogc3ZnLFxuICAgIGlzU2VsZWN0b3I6IGlzU2VsZWN0b3IsXG4gICAgY3JlYXRlVGFnRnVuY3Rpb246IGNyZWF0ZVRhZ0Z1bmN0aW9uLFxufTtcblRBR19OQU1FUy5mb3JFYWNoKGZ1bmN0aW9uIChuKSB7XG4gICAgZXhwb3J0ZWRbbl0gPSBjcmVhdGVUYWdGdW5jdGlvbihuKTtcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0ZWQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1oeXBlcnNjcmlwdC1oZWxwZXJzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHRodW5rXzEgPSByZXF1aXJlKFwiLi90aHVua1wiKTtcbmV4cG9ydHMudGh1bmsgPSB0aHVua18xLnRodW5rO1xudmFyIE1haW5ET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL01haW5ET01Tb3VyY2VcIik7XG5leHBvcnRzLk1haW5ET01Tb3VyY2UgPSBNYWluRE9NU291cmNlXzEuTWFpbkRPTVNvdXJjZTtcbi8qKlxuICogQSBmYWN0b3J5IGZvciB0aGUgRE9NIGRyaXZlciBmdW5jdGlvbi5cbiAqXG4gKiBUYWtlcyBhIGBjb250YWluZXJgIHRvIGRlZmluZSB0aGUgdGFyZ2V0IG9uIHRoZSBleGlzdGluZyBET00gd2hpY2ggdGhpc1xuICogZHJpdmVyIHdpbGwgb3BlcmF0ZSBvbiwgYW5kIGFuIGBvcHRpb25zYCBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudC4gVGhlXG4gKiBpbnB1dCB0byB0aGlzIGRyaXZlciBpcyBhIHN0cmVhbSBvZiB2aXJ0dWFsIERPTSBvYmplY3RzLCBvciBpbiBvdGhlciB3b3JkcyxcbiAqIFNuYWJiZG9tIFwiVk5vZGVcIiBvYmplY3RzLiBUaGUgb3V0cHV0IG9mIHRoaXMgZHJpdmVyIGlzIGEgXCJET01Tb3VyY2VcIjogYVxuICogY29sbGVjdGlvbiBvZiBPYnNlcnZhYmxlcyBxdWVyaWVkIHdpdGggdGhlIG1ldGhvZHMgYHNlbGVjdCgpYCBhbmQgYGV2ZW50cygpYC5cbiAqXG4gKiAqKmBET01Tb3VyY2Uuc2VsZWN0KHNlbGVjdG9yKWAqKiByZXR1cm5zIGEgbmV3IERPTVNvdXJjZSB3aXRoIHNjb3BlXG4gKiByZXN0cmljdGVkIHRvIHRoZSBlbGVtZW50KHMpIHRoYXQgbWF0Y2hlcyB0aGUgQ1NTIGBzZWxlY3RvcmAgZ2l2ZW4uIFRvIHNlbGVjdFxuICogdGhlIHBhZ2UncyBgZG9jdW1lbnRgLCB1c2UgYC5zZWxlY3QoJ2RvY3VtZW50JylgLiBUbyBzZWxlY3QgdGhlIGNvbnRhaW5lclxuICogZWxlbWVudCBmb3IgdGhpcyBhcHAsIHVzZSBgLnNlbGVjdCgnOnJvb3QnKWAuXG4gKlxuICogKipgRE9NU291cmNlLmV2ZW50cyhldmVudFR5cGUsIG9wdGlvbnMpYCoqIHJldHVybnMgYSBzdHJlYW0gb2YgZXZlbnRzIG9mXG4gKiBgZXZlbnRUeXBlYCBoYXBwZW5pbmcgb24gdGhlIGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgRE9NU291cmNlLiBUaGVcbiAqIGV2ZW50IG9iamVjdCBjb250YWlucyB0aGUgYG93bmVyVGFyZ2V0YCBwcm9wZXJ0eSB0aGF0IGJlaGF2ZXMgZXhhY3RseSBsaWtlXG4gKiBgY3VycmVudFRhcmdldGAuIFRoZSByZWFzb24gZm9yIHRoaXMgaXMgdGhhdCBzb21lIGJyb3dzZXJzIGRvZXNuJ3QgYWxsb3dcbiAqIGBjdXJyZW50VGFyZ2V0YCBwcm9wZXJ0eSB0byBiZSBtdXRhdGVkLCBoZW5jZSBhIG5ldyBwcm9wZXJ0eSBpcyBjcmVhdGVkLiBUaGVcbiAqIHJldHVybmVkIHN0cmVhbSBpcyBhbiAqeHN0cmVhbSogU3RyZWFtIGlmIHlvdSB1c2UgYEBjeWNsZS94c3RyZWFtLXJ1bmAgdG8gcnVuXG4gKiB5b3VyIGFwcCB3aXRoIHRoaXMgZHJpdmVyLCBvciBpdCBpcyBhbiBSeEpTIE9ic2VydmFibGUgaWYgeW91IHVzZVxuICogYEBjeWNsZS9yeGpzLXJ1bmAsIGFuZCBzbyBmb3J0aC5cbiAqXG4gKiAqKm9wdGlvbnMgZm9yIERPTVNvdXJjZS5ldmVudHMqKlxuICpcbiAqIFRoZSBgb3B0aW9uc2AgcGFyYW1ldGVyIG9uIGBET01Tb3VyY2UuZXZlbnRzKGV2ZW50VHlwZSwgb3B0aW9ucylgIGlzIGFuXG4gKiAob3B0aW9uYWwpIG9iamVjdCB3aXRoIHR3byBvcHRpb25hbCBmaWVsZHM6IGB1c2VDYXB0dXJlYCBhbmRcbiAqIGBwcmV2ZW50RGVmYXVsdGAuXG4gKlxuICogYHVzZUNhcHR1cmVgIGlzIGJ5IGRlZmF1bHQgYGZhbHNlYCwgZXhjZXB0IGl0IGlzIGB0cnVlYCBmb3IgZXZlbnQgdHlwZXMgdGhhdFxuICogZG8gbm90IGJ1YmJsZS4gUmVhZCBtb3JlIGhlcmVcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FdmVudFRhcmdldC9hZGRFdmVudExpc3RlbmVyXG4gKiBhYm91dCB0aGUgYHVzZUNhcHR1cmVgIGFuZCBpdHMgcHVycG9zZS5cbiAqXG4gKiBgcHJldmVudERlZmF1bHRgIGlzIGJ5IGRlZmF1bHQgYGZhbHNlYCwgYW5kIGluZGljYXRlcyB0byB0aGUgZHJpdmVyIHdoZXRoZXJcbiAqIGBldmVudC5wcmV2ZW50RGVmYXVsdCgpYCBzaG91bGQgYmUgaW52b2tlZC4gVGhpcyBvcHRpb24gY2FuIGJlIGNvbmZpZ3VyZWQgaW5cbiAqIHRocmVlIHdheXM6XG4gKlxuICogLSBge3ByZXZlbnREZWZhdWx0OiBib29sZWFufWAgdG8gaW52b2tlIHByZXZlbnREZWZhdWx0IGlmIGB0cnVlYCwgYW5kIG5vdFxuICogaW52b2tlIG90aGVyd2lzZS5cbiAqIC0gYHtwcmV2ZW50RGVmYXVsdDogKGV2OiBFdmVudCkgPT4gYm9vbGVhbn1gIGZvciBjb25kaXRpb25hbCBpbnZvY2F0aW9uLlxuICogLSBge3ByZXZlbnREZWZhdWx0OiBOZXN0ZWRPYmplY3R9YCB1c2VzIGFuIG9iamVjdCB0byBiZSByZWN1cnNpdmVseSBjb21wYXJlZFxuICogdG8gdGhlIGBFdmVudGAgb2JqZWN0LiBgcHJldmVudERlZmF1bHRgIGlzIGludm9rZWQgd2hlbiBhbGwgcHJvcGVydGllcyBvbiB0aGVcbiAqIG5lc3RlZCBvYmplY3QgbWF0Y2ggd2l0aCB0aGUgcHJvcGVydGllcyBvbiB0aGUgZXZlbnQgb2JqZWN0LlxuICpcbiAqIEhlcmUgYXJlIHNvbWUgZXhhbXBsZXM6XG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBhbHdheXMgcHJldmVudCBkZWZhdWx0XG4gKiBET01Tb3VyY2Uuc2VsZWN0KCdpbnB1dCcpLmV2ZW50cygna2V5ZG93bicsIHtcbiAqICAgcHJldmVudERlZmF1bHQ6IHRydWVcbiAqIH0pXG4gKlxuICogLy8gcHJldmVudCBkZWZhdWx0IG9ubHkgd2hlbiBgRU5URVJgIGlzIHByZXNzZWRcbiAqIERPTVNvdXJjZS5zZWxlY3QoJ2lucHV0JykuZXZlbnRzKCdrZXlkb3duJywge1xuICogICBwcmV2ZW50RGVmYXVsdDogZSA9PiBlLmtleUNvZGUgPT09IDEzXG4gKiB9KVxuICpcbiAqIC8vIHByZXZlbnQgZGVmdWFsdCB3aGVuIGBFTlRFUmAgaXMgcHJlc3NlZCBBTkQgdGFyZ2V0LnZhbHVlIGlzICdIRUxMTydcbiAqIERPTVNvdXJjZS5zZWxlY3QoJ2lucHV0JykuZXZlbnRzKCdrZXlkb3duJywge1xuICogICBwcmV2ZW50RGVmYXVsdDogeyBrZXlDb2RlOiAxMywgb3duZXJUYXJnZXQ6IHsgdmFsdWU6ICdIRUxMTycgfSB9XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqICoqYERPTVNvdXJjZS5lbGVtZW50cygpYCoqIHJldHVybnMgYSBzdHJlYW0gb2YgYXJyYXlzIGNvbnRhaW5pbmcgdGhlIERPTVxuICogZWxlbWVudHMgdGhhdCBtYXRjaCB0aGUgc2VsZWN0b3JzIGluIHRoZSBET01Tb3VyY2UgKGUuZy4gZnJvbSBwcmV2aW91c1xuICogYHNlbGVjdCh4KWAgY2FsbHMpLlxuICpcbiAqICoqYERPTVNvdXJjZS5lbGVtZW50KClgKiogcmV0dXJucyBhIHN0cmVhbSBvZiBET00gZWxlbWVudHMuIE5vdGljZSB0aGF0IHRoaXNcbiAqIGlzIHRoZSBzaW5ndWxhciB2ZXJzaW9uIG9mIGAuZWxlbWVudHMoKWAsIHNvIHRoZSBzdHJlYW0gd2lsbCBlbWl0IGFuIGVsZW1lbnQsXG4gKiBub3QgYW4gYXJyYXkuIElmIHRoZXJlIGlzIG5vIGVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBzZWxlY3RlZCBET01Tb3VyY2UsXG4gKiB0aGVuIHRoZSByZXR1cm5lZCBzdHJlYW0gd2lsbCBub3QgZW1pdCBhbnl0aGluZy5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8SFRNTEVsZW1lbnQpfSBjb250YWluZXIgdGhlIERPTSBzZWxlY3RvciBmb3IgdGhlIGVsZW1lbnRcbiAqIChvciB0aGUgZWxlbWVudCBpdHNlbGYpIHRvIGNvbnRhaW4gdGhlIHJlbmRlcmluZyBvZiB0aGUgVlRyZWVzLlxuICogQHBhcmFtIHtET01Ecml2ZXJPcHRpb25zfSBvcHRpb25zIGFuIG9iamVjdCB3aXRoIHR3byBvcHRpb25hbCBwcm9wZXJ0aWVzOlxuICpcbiAqICAgLSBgbW9kdWxlczogYXJyYXlgIG92ZXJyaWRlcyBgQGN5Y2xlL2RvbWAncyBkZWZhdWx0IFNuYWJiZG9tIG1vZHVsZXMgYXNcbiAqICAgICBhcyBkZWZpbmVkIGluIFtgc3JjL21vZHVsZXMudHNgXSguL3NyYy9tb2R1bGVzLnRzKS5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aGUgRE9NIGRyaXZlciBmdW5jdGlvbi4gVGhlIGZ1bmN0aW9uIGV4cGVjdHMgYSBzdHJlYW0gb2ZcbiAqIFZOb2RlIGFzIGlucHV0LCBhbmQgb3V0cHV0cyB0aGUgRE9NU291cmNlIG9iamVjdC5cbiAqIEBmdW5jdGlvbiBtYWtlRE9NRHJpdmVyXG4gKi9cbnZhciBtYWtlRE9NRHJpdmVyXzEgPSByZXF1aXJlKFwiLi9tYWtlRE9NRHJpdmVyXCIpO1xuZXhwb3J0cy5tYWtlRE9NRHJpdmVyID0gbWFrZURPTURyaXZlcl8xLm1ha2VET01Ecml2ZXI7XG4vKipcbiAqIEEgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgbW9ja2VkIERPTVNvdXJjZSBvYmplY3RzLCBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAqXG4gKiBUYWtlcyBhIGBtb2NrQ29uZmlnYCBvYmplY3QgYXMgYXJndW1lbnQsIGFuZCByZXR1cm5zXG4gKiBhIERPTVNvdXJjZSB0aGF0IGNhbiBiZSBnaXZlbiB0byBhbnkgQ3ljbGUuanMgYXBwIHRoYXQgZXhwZWN0cyBhIERPTVNvdXJjZSBpblxuICogdGhlIHNvdXJjZXMsIGZvciB0ZXN0aW5nLlxuICpcbiAqIFRoZSBgbW9ja0NvbmZpZ2AgcGFyYW1ldGVyIGlzIGFuIG9iamVjdCBzcGVjaWZ5aW5nIHNlbGVjdG9ycywgZXZlbnRUeXBlcyBhbmRcbiAqIHRoZWlyIHN0cmVhbXMuIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIGNvbnN0IGRvbVNvdXJjZSA9IG1vY2tET01Tb3VyY2Uoe1xuICogICAnLmZvbyc6IHtcbiAqICAgICAnY2xpY2snOiB4cy5vZih7dGFyZ2V0OiB7fX0pLFxuICogICAgICdtb3VzZW92ZXInOiB4cy5vZih7dGFyZ2V0OiB7fX0pLFxuICogICB9LFxuICogICAnLmJhcic6IHtcbiAqICAgICAnc2Nyb2xsJzogeHMub2Yoe3RhcmdldDoge319KSxcbiAqICAgICBlbGVtZW50czogeHMub2Yoe3RhZ05hbWU6ICdkaXYnfSksXG4gKiAgIH1cbiAqIH0pO1xuICpcbiAqIC8vIFVzYWdlXG4gKiBjb25zdCBjbGljayQgPSBkb21Tb3VyY2Uuc2VsZWN0KCcuZm9vJykuZXZlbnRzKCdjbGljaycpO1xuICogY29uc3QgZWxlbWVudCQgPSBkb21Tb3VyY2Uuc2VsZWN0KCcuYmFyJykuZWxlbWVudHMoKTtcbiAqIGBgYFxuICpcbiAqIFRoZSBtb2NrZWQgRE9NIFNvdXJjZSBzdXBwb3J0cyBpc29sYXRpb24uIEl0IGhhcyB0aGUgZnVuY3Rpb25zIGBpc29sYXRlU2lua2BcbiAqIGFuZCBgaXNvbGF0ZVNvdXJjZWAgYXR0YWNoZWQgdG8gaXQsIGFuZCBwZXJmb3JtcyBzaW1wbGUgaXNvbGF0aW9uIHVzaW5nXG4gKiBjbGFzc05hbWVzLiAqaXNvbGF0ZVNpbmsqIHdpdGggc2NvcGUgYGZvb2Agd2lsbCBhcHBlbmQgdGhlIGNsYXNzIGBfX19mb29gIHRvXG4gKiB0aGUgc3RyZWFtIG9mIHZpcnR1YWwgRE9NIG5vZGVzLCBhbmQgKmlzb2xhdGVTb3VyY2UqIHdpdGggc2NvcGUgYGZvb2Agd2lsbFxuICogcGVyZm9ybSBhIGNvbnZlbnRpb25hbCBgbW9ja2VkRE9NU291cmNlLnNlbGVjdCgnLl9fZm9vJylgIGNhbGwuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG1vY2tDb25maWcgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIHNlbGVjdG9yIHN0cmluZ3NcbiAqIGFuZCB2YWx1ZXMgYXJlIG9iamVjdHMuIFRob3NlIG5lc3RlZCBvYmplY3RzIGhhdmUgYGV2ZW50VHlwZWAgc3RyaW5ncyBhcyBrZXlzXG4gKiBhbmQgdmFsdWVzIGFyZSBzdHJlYW1zIHlvdSBjcmVhdGVkLlxuICogQHJldHVybiB7T2JqZWN0fSBmYWtlIERPTSBzb3VyY2Ugb2JqZWN0LCB3aXRoIGFuIEFQSSBjb250YWluaW5nIGBzZWxlY3QoKWBcbiAqIGFuZCBgZXZlbnRzKClgIGFuZCBgZWxlbWVudHMoKWAgd2hpY2ggY2FuIGJlIHVzZWQganVzdCBsaWtlIHRoZSBET00gRHJpdmVyJ3NcbiAqIERPTVNvdXJjZS5cbiAqXG4gKiBAZnVuY3Rpb24gbW9ja0RPTVNvdXJjZVxuICovXG52YXIgbW9ja0RPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vbW9ja0RPTVNvdXJjZVwiKTtcbmV4cG9ydHMubW9ja0RPTVNvdXJjZSA9IG1vY2tET01Tb3VyY2VfMS5tb2NrRE9NU291cmNlO1xuZXhwb3J0cy5Nb2NrZWRET01Tb3VyY2UgPSBtb2NrRE9NU291cmNlXzEuTW9ja2VkRE9NU291cmNlO1xuLyoqXG4gKiBUaGUgaHlwZXJzY3JpcHQgZnVuY3Rpb24gYGgoKWAgaXMgYSBmdW5jdGlvbiB0byBjcmVhdGUgdmlydHVhbCBET00gb2JqZWN0cyxcbiAqIGFsc28ga25vd24gYXMgVk5vZGVzLiBDYWxsXG4gKlxuICogYGBganNcbiAqIGgoJ2Rpdi5teUNsYXNzJywge3N0eWxlOiB7Y29sb3I6ICdyZWQnfX0sIFtdKVxuICogYGBgXG4gKlxuICogdG8gY3JlYXRlIGEgVk5vZGUgdGhhdCByZXByZXNlbnRzIGEgYERJVmAgZWxlbWVudCB3aXRoIGNsYXNzTmFtZSBgbXlDbGFzc2AsXG4gKiBzdHlsZWQgd2l0aCByZWQgY29sb3IsIGFuZCBubyBjaGlsZHJlbiBiZWNhdXNlIHRoZSBgW11gIGFycmF5IHdhcyBwYXNzZWQuIFRoZVxuICogQVBJIGlzIGBoKHRhZ09yU2VsZWN0b3IsIG9wdGlvbmFsRGF0YSwgb3B0aW9uYWxDaGlsZHJlbk9yVGV4dClgLlxuICpcbiAqIEhvd2V2ZXIsIHVzdWFsbHkgeW91IHNob3VsZCB1c2UgXCJoeXBlcnNjcmlwdCBoZWxwZXJzXCIsIHdoaWNoIGFyZSBzaG9ydGN1dFxuICogZnVuY3Rpb25zIGJhc2VkIG9uIGh5cGVyc2NyaXB0LiBUaGVyZSBpcyBvbmUgaHlwZXJzY3JpcHQgaGVscGVyIGZ1bmN0aW9uIGZvclxuICogZWFjaCBET00gdGFnTmFtZSwgc3VjaCBhcyBgaDEoKWAsIGBoMigpYCwgYGRpdigpYCwgYHNwYW4oKWAsIGBsYWJlbCgpYCxcbiAqIGBpbnB1dCgpYC4gRm9yIGluc3RhbmNlLCB0aGUgcHJldmlvdXMgZXhhbXBsZSBjb3VsZCBoYXZlIGJlZW4gd3JpdHRlblxuICogYXM6XG4gKlxuICogYGBganNcbiAqIGRpdignLm15Q2xhc3MnLCB7c3R5bGU6IHtjb2xvcjogJ3JlZCd9fSwgW10pXG4gKiBgYGBcbiAqXG4gKiBUaGVyZSBhcmUgYWxzbyBTVkcgaGVscGVyIGZ1bmN0aW9ucywgd2hpY2ggYXBwbHkgdGhlIGFwcHJvcHJpYXRlIFNWR1xuICogbmFtZXNwYWNlIHRvIHRoZSByZXN1bHRpbmcgZWxlbWVudHMuIGBzdmcoKWAgZnVuY3Rpb24gY3JlYXRlcyB0aGUgdG9wLW1vc3RcbiAqIFNWRyBlbGVtZW50LCBhbmQgYHN2Zy5nYCwgYHN2Zy5wb2x5Z29uYCwgYHN2Zy5jaXJjbGVgLCBgc3ZnLnBhdGhgIGFyZSBmb3JcbiAqIFNWRy1zcGVjaWZpYyBjaGlsZCBlbGVtZW50cy4gRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogc3ZnKHthdHRyczoge3dpZHRoOiAxNTAsIGhlaWdodDogMTUwfX0sIFtcbiAqICAgc3ZnLnBvbHlnb24oe1xuICogICAgIGF0dHJzOiB7XG4gKiAgICAgICBjbGFzczogJ3RyaWFuZ2xlJyxcbiAqICAgICAgIHBvaW50czogJzIwIDAgMjAgMTUwIDE1MCAyMCdcbiAqICAgICB9XG4gKiAgIH0pXG4gKiBdKVxuICogYGBgXG4gKlxuICogQGZ1bmN0aW9uIGhcbiAqL1xudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xuZXhwb3J0cy5oID0gaF8xLmg7XG52YXIgaHlwZXJzY3JpcHRfaGVscGVyc18xID0gcmVxdWlyZShcIi4vaHlwZXJzY3JpcHQtaGVscGVyc1wiKTtcbmV4cG9ydHMuc3ZnID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3ZnO1xuZXhwb3J0cy5hID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYTtcbmV4cG9ydHMuYWJiciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFiYnI7XG5leHBvcnRzLmFkZHJlc3MgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hZGRyZXNzO1xuZXhwb3J0cy5hcmVhID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXJlYTtcbmV4cG9ydHMuYXJ0aWNsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFydGljbGU7XG5leHBvcnRzLmFzaWRlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXNpZGU7XG5leHBvcnRzLmF1ZGlvID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXVkaW87XG5leHBvcnRzLmIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5iO1xuZXhwb3J0cy5iYXNlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmFzZTtcbmV4cG9ydHMuYmRpID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmRpO1xuZXhwb3J0cy5iZG8gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5iZG87XG5leHBvcnRzLmJsb2NrcXVvdGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ibG9ja3F1b3RlO1xuZXhwb3J0cy5ib2R5ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYm9keTtcbmV4cG9ydHMuYnIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5icjtcbmV4cG9ydHMuYnV0dG9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYnV0dG9uO1xuZXhwb3J0cy5jYW52YXMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jYW52YXM7XG5leHBvcnRzLmNhcHRpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jYXB0aW9uO1xuZXhwb3J0cy5jaXRlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY2l0ZTtcbmV4cG9ydHMuY29kZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNvZGU7XG5leHBvcnRzLmNvbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNvbDtcbmV4cG9ydHMuY29sZ3JvdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jb2xncm91cDtcbmV4cG9ydHMuZGQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kZDtcbmV4cG9ydHMuZGVsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGVsO1xuZXhwb3J0cy5kZm4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kZm47XG5leHBvcnRzLmRpciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRpcjtcbmV4cG9ydHMuZGl2ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGl2O1xuZXhwb3J0cy5kbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRsO1xuZXhwb3J0cy5kdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmR0O1xuZXhwb3J0cy5lbSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmVtO1xuZXhwb3J0cy5lbWJlZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmVtYmVkO1xuZXhwb3J0cy5maWVsZHNldCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZpZWxkc2V0O1xuZXhwb3J0cy5maWdjYXB0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZmlnY2FwdGlvbjtcbmV4cG9ydHMuZmlndXJlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZmlndXJlO1xuZXhwb3J0cy5mb290ZXIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5mb290ZXI7XG5leHBvcnRzLmZvcm0gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5mb3JtO1xuZXhwb3J0cy5oMSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmgxO1xuZXhwb3J0cy5oMiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmgyO1xuZXhwb3J0cy5oMyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmgzO1xuZXhwb3J0cy5oNCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmg0O1xuZXhwb3J0cy5oNSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmg1O1xuZXhwb3J0cy5oNiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmg2O1xuZXhwb3J0cy5oZWFkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaGVhZDtcbmV4cG9ydHMuaGVhZGVyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaGVhZGVyO1xuZXhwb3J0cy5oZ3JvdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oZ3JvdXA7XG5leHBvcnRzLmhyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaHI7XG5leHBvcnRzLmh0bWwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5odG1sO1xuZXhwb3J0cy5pID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaTtcbmV4cG9ydHMuaWZyYW1lID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaWZyYW1lO1xuZXhwb3J0cy5pbWcgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pbWc7XG5leHBvcnRzLmlucHV0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaW5wdXQ7XG5leHBvcnRzLmlucyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmlucztcbmV4cG9ydHMua2JkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQua2JkO1xuZXhwb3J0cy5rZXlnZW4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5rZXlnZW47XG5leHBvcnRzLmxhYmVsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubGFiZWw7XG5leHBvcnRzLmxlZ2VuZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmxlZ2VuZDtcbmV4cG9ydHMubGkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5saTtcbmV4cG9ydHMubGluayA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmxpbms7XG5leHBvcnRzLm1haW4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tYWluO1xuZXhwb3J0cy5tYXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tYXA7XG5leHBvcnRzLm1hcmsgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tYXJrO1xuZXhwb3J0cy5tZW51ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWVudTtcbmV4cG9ydHMubWV0YSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1ldGE7XG5leHBvcnRzLm5hdiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm5hdjtcbmV4cG9ydHMubm9zY3JpcHQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ub3NjcmlwdDtcbmV4cG9ydHMub2JqZWN0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQub2JqZWN0O1xuZXhwb3J0cy5vbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9sO1xuZXhwb3J0cy5vcHRncm91cCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9wdGdyb3VwO1xuZXhwb3J0cy5vcHRpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vcHRpb247XG5leHBvcnRzLnAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wO1xuZXhwb3J0cy5wYXJhbSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnBhcmFtO1xuZXhwb3J0cy5wcmUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wcmU7XG5leHBvcnRzLnByb2dyZXNzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucHJvZ3Jlc3M7XG5leHBvcnRzLnEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5xO1xuZXhwb3J0cy5ycCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnJwO1xuZXhwb3J0cy5ydCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnJ0O1xuZXhwb3J0cy5ydWJ5ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucnVieTtcbmV4cG9ydHMucyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnM7XG5leHBvcnRzLnNhbXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zYW1wO1xuZXhwb3J0cy5zY3JpcHQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zY3JpcHQ7XG5leHBvcnRzLnNlY3Rpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zZWN0aW9uO1xuZXhwb3J0cy5zZWxlY3QgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zZWxlY3Q7XG5leHBvcnRzLnNtYWxsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc21hbGw7XG5leHBvcnRzLnNvdXJjZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNvdXJjZTtcbmV4cG9ydHMuc3BhbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNwYW47XG5leHBvcnRzLnN0cm9uZyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN0cm9uZztcbmV4cG9ydHMuc3R5bGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdHlsZTtcbmV4cG9ydHMuc3ViID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3ViO1xuZXhwb3J0cy5zdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdXA7XG5leHBvcnRzLnRhYmxlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGFibGU7XG5leHBvcnRzLnRib2R5ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGJvZHk7XG5leHBvcnRzLnRkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGQ7XG5leHBvcnRzLnRleHRhcmVhID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGV4dGFyZWE7XG5leHBvcnRzLnRmb290ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGZvb3Q7XG5leHBvcnRzLnRoID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGg7XG5leHBvcnRzLnRoZWFkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGhlYWQ7XG5leHBvcnRzLnRpdGxlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGl0bGU7XG5leHBvcnRzLnRyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudHI7XG5leHBvcnRzLnUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC51O1xuZXhwb3J0cy51bCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnVsO1xuZXhwb3J0cy52aWRlbyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnZpZGVvO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmZ1bmN0aW9uIG1ha2VJc29sYXRlU2luayhuYW1lc3BhY2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHNpbmssIHNjb3BlKSB7XG4gICAgICAgIGlmIChzY29wZSA9PT0gJzpyb290Jykge1xuICAgICAgICAgICAgcmV0dXJuIHNpbms7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpbmsubWFwKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzY29wZU9iaiA9IGdldFNjb3BlT2JqKHNjb3BlKTtcbiAgICAgICAgICAgIHZhciBuZXdOb2RlID0gX19hc3NpZ24oe30sIG5vZGUsIHsgZGF0YTogX19hc3NpZ24oe30sIG5vZGUuZGF0YSwgeyBpc29sYXRlOiAhbm9kZS5kYXRhIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZGF0YS5pc29sYXRlKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBuYW1lc3BhY2UuY29uY2F0KFtzY29wZU9ial0pXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG5vZGUuZGF0YS5pc29sYXRlIH0pIH0pO1xuICAgICAgICAgICAgcmV0dXJuIF9fYXNzaWduKHt9LCBuZXdOb2RlLCB7IGtleTogbmV3Tm9kZS5rZXkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICA/IG5ld05vZGUua2V5XG4gICAgICAgICAgICAgICAgICAgIDogSlNPTi5zdHJpbmdpZnkobmV3Tm9kZS5kYXRhLmlzb2xhdGUpIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlSXNvbGF0ZVNpbmsgPSBtYWtlSXNvbGF0ZVNpbms7XG5mdW5jdGlvbiBnZXRTY29wZU9iaihzY29wZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IHV0aWxzXzEuaXNDbGFzc09ySWQoc2NvcGUpID8gJ3NpYmxpbmcnIDogJ3RvdGFsJyxcbiAgICAgICAgc2NvcGU6IHNjb3BlLFxuICAgIH07XG59XG5leHBvcnRzLmdldFNjb3BlT2JqID0gZ2V0U2NvcGVPYmo7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pc29sYXRlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHNuYWJiZG9tXzEgPSByZXF1aXJlKFwic25hYmJkb21cIik7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgY29uY2F0XzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9jb25jYXRcIik7XG52YXIgc2FtcGxlQ29tYmluZV8xID0gcmVxdWlyZShcInhzdHJlYW0vZXh0cmEvc2FtcGxlQ29tYmluZVwiKTtcbnZhciBNYWluRE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9NYWluRE9NU291cmNlXCIpO1xudmFyIHRvdm5vZGVfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS90b3Zub2RlXCIpO1xudmFyIFZOb2RlV3JhcHBlcl8xID0gcmVxdWlyZShcIi4vVk5vZGVXcmFwcGVyXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBtb2R1bGVzXzEgPSByZXF1aXJlKFwiLi9tb2R1bGVzXCIpO1xudmFyIElzb2xhdGVNb2R1bGVfMSA9IHJlcXVpcmUoXCIuL0lzb2xhdGVNb2R1bGVcIik7XG52YXIgRXZlbnREZWxlZ2F0b3JfMSA9IHJlcXVpcmUoXCIuL0V2ZW50RGVsZWdhdG9yXCIpO1xuZnVuY3Rpb24gbWFrZURPTURyaXZlcklucHV0R3VhcmQobW9kdWxlcykge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShtb2R1bGVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcHRpb25hbCBtb2R1bGVzIG9wdGlvbiBtdXN0IGJlIGFuIGFycmF5IGZvciBzbmFiYmRvbSBtb2R1bGVzXCIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRvbURyaXZlcklucHV0R3VhcmQodmlldyQpIHtcbiAgICBpZiAoIXZpZXckIHx8XG4gICAgICAgIHR5cGVvZiB2aWV3JC5hZGRMaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAgIHR5cGVvZiB2aWV3JC5mb2xkICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIERPTSBkcml2ZXIgZnVuY3Rpb24gZXhwZWN0cyBhcyBpbnB1dCBhIFN0cmVhbSBvZiBcIiArXG4gICAgICAgICAgICBcInZpcnR1YWwgRE9NIGVsZW1lbnRzXCIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRyb3BDb21wbGV0aW9uKGlucHV0KSB7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGlucHV0LCB4c3RyZWFtXzEuZGVmYXVsdC5uZXZlcigpKTtcbn1cbmZ1bmN0aW9uIHVud3JhcEVsZW1lbnRGcm9tVk5vZGUodm5vZGUpIHtcbiAgICByZXR1cm4gdm5vZGUuZWxtO1xufVxuZnVuY3Rpb24gcmVwb3J0U25hYmJkb21FcnJvcihlcnIpIHtcbiAgICAoY29uc29sZS5lcnJvciB8fCBjb25zb2xlLmxvZykoZXJyKTtcbn1cbmZ1bmN0aW9uIG1ha2VET01SZWFkeSQoKSB7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSh7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAobGlzKSB7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gZG9jdW1lbnQucmVhZHlTdGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSAnaW50ZXJhY3RpdmUnIHx8IHN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXMubmV4dChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpcy5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaXMubmV4dChudWxsKTtcbiAgICAgICAgICAgICAgICBsaXMuY29tcGxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkgeyB9LFxuICAgIH0pO1xufVxuZnVuY3Rpb24gYWRkUm9vdFNjb3BlKHZub2RlKSB7XG4gICAgdm5vZGUuZGF0YSA9IHZub2RlLmRhdGEgfHwge307XG4gICAgdm5vZGUuZGF0YS5pc29sYXRlID0gW107XG4gICAgcmV0dXJuIHZub2RlO1xufVxuZnVuY3Rpb24gbWFrZURPTURyaXZlcihjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICB1dGlsc18xLmNoZWNrVmFsaWRDb250YWluZXIoY29udGFpbmVyKTtcbiAgICB2YXIgbW9kdWxlcyA9IG9wdGlvbnMubW9kdWxlcyB8fCBtb2R1bGVzXzEuZGVmYXVsdDtcbiAgICBtYWtlRE9NRHJpdmVySW5wdXRHdWFyZChtb2R1bGVzKTtcbiAgICB2YXIgaXNvbGF0ZU1vZHVsZSA9IG5ldyBJc29sYXRlTW9kdWxlXzEuSXNvbGF0ZU1vZHVsZSgpO1xuICAgIHZhciBwYXRjaCA9IHNuYWJiZG9tXzEuaW5pdChbaXNvbGF0ZU1vZHVsZS5jcmVhdGVNb2R1bGUoKV0uY29uY2F0KG1vZHVsZXMpKTtcbiAgICB2YXIgZG9tUmVhZHkkID0gbWFrZURPTVJlYWR5JCgpO1xuICAgIHZhciB2bm9kZVdyYXBwZXI7XG4gICAgdmFyIG11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIG11dGF0aW9uQ29uZmlybWVkJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSh7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIG11dGF0aW9uT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7IHJldHVybiBsaXN0ZW5lci5uZXh0KG51bGwpOyB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbXV0YXRpb25PYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0sXG4gICAgfSk7XG4gICAgZnVuY3Rpb24gRE9NRHJpdmVyKHZub2RlJCwgbmFtZSkge1xuICAgICAgICBpZiAobmFtZSA9PT0gdm9pZCAwKSB7IG5hbWUgPSAnRE9NJzsgfVxuICAgICAgICBkb21Ecml2ZXJJbnB1dEd1YXJkKHZub2RlJCk7XG4gICAgICAgIHZhciBzYW5pdGF0aW9uJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSgpO1xuICAgICAgICB2YXIgZmlyc3RSb290JCA9IGRvbVJlYWR5JC5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZpcnN0Um9vdCA9IHV0aWxzXzEuZ2V0VmFsaWROb2RlKGNvbnRhaW5lcikgfHwgZG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgIHZub2RlV3JhcHBlciA9IG5ldyBWTm9kZVdyYXBwZXJfMS5WTm9kZVdyYXBwZXIoZmlyc3RSb290KTtcbiAgICAgICAgICAgIHJldHVybiBmaXJzdFJvb3Q7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHN1YnNjcmliZSB0byB0aGUgc2luayAoaS5lLiB2bm9kZSQpIHN5bmNocm9ub3VzbHkgaW5zaWRlIHRoaXNcbiAgICAgICAgLy8gZHJpdmVyLCBhbmQgbm90IGxhdGVyIGluIHRoZSBtYXAoKS5mbGF0dGVuKCkgYmVjYXVzZSB0aGlzIHNpbmsgaXMgaW5cbiAgICAgICAgLy8gcmVhbGl0eSBhIFNpbmtQcm94eSBmcm9tIEBjeWNsZS9ydW4sIGFuZCB3ZSBkb24ndCB3YW50IHRvIG1pc3MgdGhlIGZpcnN0XG4gICAgICAgIC8vIGVtaXNzaW9uIHdoZW4gdGhlIG1haW4oKSBpcyBjb25uZWN0ZWQgdG8gdGhlIGRyaXZlcnMuXG4gICAgICAgIC8vIFJlYWQgbW9yZSBpbiBpc3N1ZSAjNzM5LlxuICAgICAgICB2YXIgcmVtZW1iZXJlZFZOb2RlJCA9IHZub2RlJC5yZW1lbWJlcigpO1xuICAgICAgICByZW1lbWJlcmVkVk5vZGUkLmFkZExpc3RlbmVyKHt9KTtcbiAgICAgICAgLy8gVGhlIG11dGF0aW9uIG9ic2VydmVyIGludGVybmFsIHRvIG11dGF0aW9uQ29uZmlybWVkJCBzaG91bGRcbiAgICAgICAgLy8gZXhpc3QgYmVmb3JlIGVsZW1lbnRBZnRlclBhdGNoJCBjYWxscyBtdXRhdGlvbk9ic2VydmVyLm9ic2VydmUoKVxuICAgICAgICBtdXRhdGlvbkNvbmZpcm1lZCQuYWRkTGlzdGVuZXIoe30pO1xuICAgICAgICB2YXIgZWxlbWVudEFmdGVyUGF0Y2gkID0gZmlyc3RSb290JFxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoZmlyc3RSb290KSB7XG4gICAgICAgICAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHRcbiAgICAgICAgICAgICAgICAubWVyZ2UocmVtZW1iZXJlZFZOb2RlJC5lbmRXaGVuKHNhbml0YXRpb24kKSwgc2FuaXRhdGlvbiQpXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAodm5vZGUpIHsgcmV0dXJuIHZub2RlV3JhcHBlci5jYWxsKHZub2RlKTsgfSlcbiAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKGFkZFJvb3RTY29wZSh0b3Zub2RlXzEudG9WTm9kZShmaXJzdFJvb3QpKSlcbiAgICAgICAgICAgICAgICAuZm9sZChwYXRjaCwgdG92bm9kZV8xLnRvVk5vZGUoZmlyc3RSb290KSlcbiAgICAgICAgICAgICAgICAuZHJvcCgxKVxuICAgICAgICAgICAgICAgIC5tYXAodW53cmFwRWxlbWVudEZyb21WTm9kZSlcbiAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKGZpcnN0Um9vdClcbiAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIG11dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZShlbCwge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY29tcG9zZShkcm9wQ29tcGxldGlvbik7XG4gICAgICAgIH0gLy8gZG9uJ3QgY29tcGxldGUgdGhpcyBzdHJlYW1cbiAgICAgICAgKVxuICAgICAgICAgICAgLmZsYXR0ZW4oKTtcbiAgICAgICAgdmFyIHJvb3RFbGVtZW50JCA9IGNvbmNhdF8xLmRlZmF1bHQoZG9tUmVhZHkkLCBtdXRhdGlvbkNvbmZpcm1lZCQpXG4gICAgICAgICAgICAuZW5kV2hlbihzYW5pdGF0aW9uJClcbiAgICAgICAgICAgIC5jb21wb3NlKHNhbXBsZUNvbWJpbmVfMS5kZWZhdWx0KGVsZW1lbnRBZnRlclBhdGNoJCkpXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChhcnIpIHsgcmV0dXJuIGFyclsxXTsgfSlcbiAgICAgICAgICAgIC5yZW1lbWJlcigpO1xuICAgICAgICAvLyBTdGFydCB0aGUgc25hYmJkb20gcGF0Y2hpbmcsIG92ZXIgdGltZVxuICAgICAgICByb290RWxlbWVudCQuYWRkTGlzdGVuZXIoeyBlcnJvcjogcmVwb3J0U25hYmJkb21FcnJvciB9KTtcbiAgICAgICAgdmFyIGRlbGVnYXRvciA9IG5ldyBFdmVudERlbGVnYXRvcl8xLkV2ZW50RGVsZWdhdG9yKHJvb3RFbGVtZW50JCwgaXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgIHJldHVybiBuZXcgTWFpbkRPTVNvdXJjZV8xLk1haW5ET01Tb3VyY2Uocm9vdEVsZW1lbnQkLCBzYW5pdGF0aW9uJCwgW10sIGlzb2xhdGVNb2R1bGUsIGRlbGVnYXRvciwgbmFtZSk7XG4gICAgfVxuICAgIHJldHVybiBET01Ecml2ZXI7XG59XG5leHBvcnRzLm1ha2VET01Ecml2ZXIgPSBtYWtlRE9NRHJpdmVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFrZURPTURyaXZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIFNDT1BFX1BSRUZJWCA9ICdfX18nO1xudmFyIE1vY2tlZERPTVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2NrZWRET01Tb3VyY2UoX21vY2tDb25maWcpIHtcbiAgICAgICAgdGhpcy5fbW9ja0NvbmZpZyA9IF9tb2NrQ29uZmlnO1xuICAgICAgICBpZiAoX21vY2tDb25maWcuZWxlbWVudHMpIHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnRzID0gX21vY2tDb25maWcuZWxlbWVudHM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50cyA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQuZW1wdHkoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXNcbiAgICAgICAgICAgIC5fZWxlbWVudHM7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9ICdNb2NrZWRET00nO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0cHV0JCA9IHRoaXMuZWxlbWVudHMoKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYXJyKSB7IHJldHVybiBhcnIubGVuZ3RoID4gMDsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGFycikgeyByZXR1cm4gYXJyWzBdOyB9KVxuICAgICAgICAgICAgLnJlbWVtYmVyKCk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KG91dHB1dCQpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSAnTW9ja2VkRE9NJztcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucywgYnViYmxlcykge1xuICAgICAgICB2YXIgc3RyZWFtRm9yRXZlbnRUeXBlID0gdGhpcy5fbW9ja0NvbmZpZ1tldmVudFR5cGVdO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChzdHJlYW1Gb3JFdmVudFR5cGUgfHwgeHN0cmVhbV8xLmRlZmF1bHQuZW1wdHkoKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9ICdNb2NrZWRET00nO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIG1vY2tDb25maWdGb3JTZWxlY3RvciA9IHRoaXMuX21vY2tDb25maWdbc2VsZWN0b3JdIHx8IHt9O1xuICAgICAgICByZXR1cm4gbmV3IE1vY2tlZERPTVNvdXJjZShtb2NrQ29uZmlnRm9yU2VsZWN0b3IpO1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5pc29sYXRlU291cmNlID0gZnVuY3Rpb24gKHNvdXJjZSwgc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZS5zZWxlY3QoJy4nICsgU0NPUEVfUFJFRklYICsgc2NvcGUpO1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5pc29sYXRlU2luayA9IGZ1bmN0aW9uIChzaW5rLCBzY29wZSkge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rKS5tYXAoZnVuY3Rpb24gKHZub2RlKSB7XG4gICAgICAgICAgICBpZiAodm5vZGUuc2VsICYmIHZub2RlLnNlbC5pbmRleE9mKFNDT1BFX1BSRUZJWCArIHNjb3BlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2bm9kZS5zZWwgKz0gXCIuXCIgKyBTQ09QRV9QUkVGSVggKyBzY29wZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9O1xuICAgIHJldHVybiBNb2NrZWRET01Tb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5Nb2NrZWRET01Tb3VyY2UgPSBNb2NrZWRET01Tb3VyY2U7XG5mdW5jdGlvbiBtb2NrRE9NU291cmNlKG1vY2tDb25maWcpIHtcbiAgICByZXR1cm4gbmV3IE1vY2tlZERPTVNvdXJjZShtb2NrQ29uZmlnKTtcbn1cbmV4cG9ydHMubW9ja0RPTVNvdXJjZSA9IG1vY2tET01Tb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tb2NrRE9NU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGNsYXNzXzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9jbGFzc1wiKTtcbmV4cG9ydHMuQ2xhc3NNb2R1bGUgPSBjbGFzc18xLmRlZmF1bHQ7XG52YXIgcHJvcHNfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL3Byb3BzXCIpO1xuZXhwb3J0cy5Qcm9wc01vZHVsZSA9IHByb3BzXzEuZGVmYXVsdDtcbnZhciBhdHRyaWJ1dGVzXzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzXCIpO1xuZXhwb3J0cy5BdHRyc01vZHVsZSA9IGF0dHJpYnV0ZXNfMS5kZWZhdWx0O1xudmFyIHN0eWxlXzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9zdHlsZVwiKTtcbmV4cG9ydHMuU3R5bGVNb2R1bGUgPSBzdHlsZV8xLmRlZmF1bHQ7XG52YXIgZGF0YXNldF8xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvZGF0YXNldFwiKTtcbmV4cG9ydHMuRGF0YXNldE1vZHVsZSA9IGRhdGFzZXRfMS5kZWZhdWx0O1xudmFyIG1vZHVsZXMgPSBbXG4gICAgc3R5bGVfMS5kZWZhdWx0LFxuICAgIGNsYXNzXzEuZGVmYXVsdCxcbiAgICBwcm9wc18xLmRlZmF1bHQsXG4gICAgYXR0cmlidXRlc18xLmRlZmF1bHQsXG4gICAgZGF0YXNldF8xLmRlZmF1bHQsXG5dO1xuZXhwb3J0cy5kZWZhdWx0ID0gbW9kdWxlcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1vZHVsZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgaF8xID0gcmVxdWlyZShcInNuYWJiZG9tL2hcIik7XG5mdW5jdGlvbiBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmtWTm9kZSkge1xuICAgIHRodW5rVk5vZGUuZWxtID0gdm5vZGUuZWxtO1xuICAgIHZub2RlLmRhdGEuZm4gPSB0aHVua1ZOb2RlLmRhdGEuZm47XG4gICAgdm5vZGUuZGF0YS5hcmdzID0gdGh1bmtWTm9kZS5kYXRhLmFyZ3M7XG4gICAgdm5vZGUuZGF0YS5pc29sYXRlID0gdGh1bmtWTm9kZS5kYXRhLmlzb2xhdGU7XG4gICAgdGh1bmtWTm9kZS5kYXRhID0gdm5vZGUuZGF0YTtcbiAgICB0aHVua1ZOb2RlLmNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG4gICAgdGh1bmtWTm9kZS50ZXh0ID0gdm5vZGUudGV4dDtcbiAgICB0aHVua1ZOb2RlLmVsbSA9IHZub2RlLmVsbTtcbn1cbmZ1bmN0aW9uIGluaXQodGh1bmtWTm9kZSkge1xuICAgIHZhciBjdXIgPSB0aHVua1ZOb2RlLmRhdGE7XG4gICAgdmFyIHZub2RlID0gY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgY3VyLmFyZ3MpO1xuICAgIGNvcHlUb1RodW5rKHZub2RlLCB0aHVua1ZOb2RlKTtcbn1cbmZ1bmN0aW9uIHByZXBhdGNoKG9sZFZub2RlLCB0aHVua1ZOb2RlKSB7XG4gICAgdmFyIG9sZCA9IG9sZFZub2RlLmRhdGEsIGN1ciA9IHRodW5rVk5vZGUuZGF0YTtcbiAgICB2YXIgaTtcbiAgICB2YXIgb2xkQXJncyA9IG9sZC5hcmdzLCBhcmdzID0gY3VyLmFyZ3M7XG4gICAgaWYgKG9sZC5mbiAhPT0gY3VyLmZuIHx8IG9sZEFyZ3MubGVuZ3RoICE9PSBhcmdzLmxlbmd0aCkge1xuICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmtWTm9kZSk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChvbGRBcmdzW2ldICE9PSBhcmdzW2ldKSB7XG4gICAgICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmtWTm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29weVRvVGh1bmsob2xkVm5vZGUsIHRodW5rVk5vZGUpO1xufVxuZnVuY3Rpb24gdGh1bmsoc2VsLCBrZXksIGZuLCBhcmdzKSB7XG4gICAgaWYgKGFyZ3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhcmdzID0gZm47XG4gICAgICAgIGZuID0ga2V5O1xuICAgICAgICBrZXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBoXzEuaChzZWwsIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIGhvb2s6IHsgaW5pdDogaW5pdCwgcHJlcGF0Y2g6IHByZXBhdGNoIH0sXG4gICAgICAgIGZuOiBmbixcbiAgICAgICAgYXJnczogYXJncyxcbiAgICB9KTtcbn1cbmV4cG9ydHMudGh1bmsgPSB0aHVuaztcbmV4cG9ydHMuZGVmYXVsdCA9IHRodW5rO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGh1bmsuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBpc1ZhbGlkTm9kZShvYmopIHtcbiAgICB2YXIgRUxFTV9UWVBFID0gMTtcbiAgICB2YXIgRlJBR19UWVBFID0gMTE7XG4gICAgcmV0dXJuIHR5cGVvZiBIVE1MRWxlbWVudCA9PT0gJ29iamVjdCdcbiAgICAgICAgPyBvYmogaW5zdGFuY2VvZiBIVE1MRWxlbWVudCB8fCBvYmogaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50XG4gICAgICAgIDogb2JqICYmXG4gICAgICAgICAgICB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgICAgb2JqICE9PSBudWxsICYmXG4gICAgICAgICAgICAob2JqLm5vZGVUeXBlID09PSBFTEVNX1RZUEUgfHwgb2JqLm5vZGVUeXBlID09PSBGUkFHX1RZUEUpICYmXG4gICAgICAgICAgICB0eXBlb2Ygb2JqLm5vZGVOYW1lID09PSAnc3RyaW5nJztcbn1cbmZ1bmN0aW9uIGlzQ2xhc3NPcklkKHN0cikge1xuICAgIHJldHVybiBzdHIubGVuZ3RoID4gMSAmJiAoc3RyWzBdID09PSAnLicgfHwgc3RyWzBdID09PSAnIycpO1xufVxuZXhwb3J0cy5pc0NsYXNzT3JJZCA9IGlzQ2xhc3NPcklkO1xuZnVuY3Rpb24gaXNEb2NGcmFnKGVsKSB7XG4gICAgcmV0dXJuIGVsLm5vZGVUeXBlID09PSAxMTtcbn1cbmV4cG9ydHMuaXNEb2NGcmFnID0gaXNEb2NGcmFnO1xuZnVuY3Rpb24gY2hlY2tWYWxpZENvbnRhaW5lcihjb250YWluZXIpIHtcbiAgICBpZiAodHlwZW9mIGNvbnRhaW5lciAhPT0gJ3N0cmluZycgJiYgIWlzVmFsaWROb2RlKGNvbnRhaW5lcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHaXZlbiBjb250YWluZXIgaXMgbm90IGEgRE9NIGVsZW1lbnQgbmVpdGhlciBhIHNlbGVjdG9yIHN0cmluZy4nKTtcbiAgICB9XG59XG5leHBvcnRzLmNoZWNrVmFsaWRDb250YWluZXIgPSBjaGVja1ZhbGlkQ29udGFpbmVyO1xuZnVuY3Rpb24gZ2V0VmFsaWROb2RlKHNlbGVjdG9ycykge1xuICAgIHZhciBkb21FbGVtZW50ID0gdHlwZW9mIHNlbGVjdG9ycyA9PT0gJ3N0cmluZydcbiAgICAgICAgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9ycylcbiAgICAgICAgOiBzZWxlY3RvcnM7XG4gICAgaWYgKHR5cGVvZiBzZWxlY3RvcnMgPT09ICdzdHJpbmcnICYmIGRvbUVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJlbmRlciBpbnRvIHVua25vd24gZWxlbWVudCBgXCIgKyBzZWxlY3RvcnMgKyBcImBcIik7XG4gICAgfVxuICAgIHJldHVybiBkb21FbGVtZW50O1xufVxuZXhwb3J0cy5nZXRWYWxpZE5vZGUgPSBnZXRWYWxpZE5vZGU7XG5mdW5jdGlvbiBnZXRTZWxlY3RvcnMobmFtZXNwYWNlKSB7XG4gICAgdmFyIHJlcyA9ICcnO1xuICAgIGZvciAodmFyIGkgPSBuYW1lc3BhY2UubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKG5hbWVzcGFjZVtpXS50eXBlICE9PSAnc2VsZWN0b3InKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXMgPSBuYW1lc3BhY2VbaV0uc2NvcGUgKyAnICcgKyByZXM7XG4gICAgfVxuICAgIHJldHVybiByZXMudHJpbSgpO1xufVxuZXhwb3J0cy5nZXRTZWxlY3RvcnMgPSBnZXRTZWxlY3RvcnM7XG5mdW5jdGlvbiBpc0VxdWFsTmFtZXNwYWNlKGEsIGIpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYSkgfHwgIUFycmF5LmlzQXJyYXkoYikgfHwgYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhW2ldLnR5cGUgIT09IGJbaV0udHlwZSB8fCBhW2ldLnNjb3BlICE9PSBiW2ldLnNjb3BlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5leHBvcnRzLmlzRXF1YWxOYW1lc3BhY2UgPSBpc0VxdWFsTmFtZXNwYWNlO1xuZnVuY3Rpb24gbWFrZUluc2VydChtYXApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHR5cGUsIGVsbSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKG1hcC5oYXModHlwZSkpIHtcbiAgICAgICAgICAgIHZhciBpbm5lck1hcCA9IG1hcC5nZXQodHlwZSk7XG4gICAgICAgICAgICBpbm5lck1hcC5zZXQoZWxtLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgaW5uZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBpbm5lck1hcC5zZXQoZWxtLCB2YWx1ZSk7XG4gICAgICAgICAgICBtYXAuc2V0KHR5cGUsIGlubmVyTWFwKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5leHBvcnRzLm1ha2VJbnNlcnQgPSBtYWtlSW5zZXJ0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICB2YXIgZ2xvYmFsT2JqO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IGdsb2JhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHRoaXM7XG4gICAgfVxuICAgIGdsb2JhbE9iai5DeWNsZWpzID0gZ2xvYmFsT2JqLkN5Y2xlanMgfHwge307XG4gICAgZ2xvYmFsT2JqID0gZ2xvYmFsT2JqLkN5Y2xlanM7XG4gICAgZ2xvYmFsT2JqLmFkYXB0U3RyZWFtID0gZ2xvYmFsT2JqLmFkYXB0U3RyZWFtIHx8IChmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XG4gICAgcmV0dXJuIGdsb2JhbE9iajtcbn1cbmZ1bmN0aW9uIHNldEFkYXB0KGYpIHtcbiAgICBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbSA9IGY7XG59XG5leHBvcnRzLnNldEFkYXB0ID0gc2V0QWRhcHQ7XG5mdW5jdGlvbiBhZGFwdChzdHJlYW0pIHtcbiAgICByZXR1cm4gZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0oc3RyZWFtKTtcbn1cbmV4cG9ydHMuYWRhcHQgPSBhZGFwdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFkYXB0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgaW50ZXJuYWxzXzEgPSByZXF1aXJlKFwiLi9pbnRlcm5hbHNcIik7XG4vKipcbiAqIEEgZnVuY3Rpb24gdGhhdCBwcmVwYXJlcyB0aGUgQ3ljbGUgYXBwbGljYXRpb24gdG8gYmUgZXhlY3V0ZWQuIFRha2VzIGEgYG1haW5gXG4gKiBmdW5jdGlvbiBhbmQgcHJlcGFyZXMgdG8gY2lyY3VsYXJseSBjb25uZWN0cyBpdCB0byB0aGUgZ2l2ZW4gY29sbGVjdGlvbiBvZlxuICogZHJpdmVyIGZ1bmN0aW9ucy4gQXMgYW4gb3V0cHV0LCBgc2V0dXAoKWAgcmV0dXJucyBhbiBvYmplY3Qgd2l0aCB0aHJlZVxuICogcHJvcGVydGllczogYHNvdXJjZXNgLCBgc2lua3NgIGFuZCBgcnVuYC4gT25seSB3aGVuIGBydW4oKWAgaXMgY2FsbGVkIHdpbGxcbiAqIHRoZSBhcHBsaWNhdGlvbiBhY3R1YWxseSBleGVjdXRlLiBSZWZlciB0byB0aGUgZG9jdW1lbnRhdGlvbiBvZiBgcnVuKClgIGZvclxuICogbW9yZSBkZXRhaWxzLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYGBganNcbiAqIGltcG9ydCB7c2V0dXB9IGZyb20gJ0BjeWNsZS9ydW4nO1xuICogY29uc3Qge3NvdXJjZXMsIHNpbmtzLCBydW59ID0gc2V0dXAobWFpbiwgZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGNvbnN0IGRpc3Bvc2UgPSBydW4oKTsgLy8gRXhlY3V0ZXMgdGhlIGFwcGxpY2F0aW9uXG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1haW4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dCBhbmQgb3V0cHV0c1xuICogYHNpbmtzYC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkcml2ZXJzIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBkcml2ZXIgbmFtZXMgYW5kIHZhbHVlc1xuICogYXJlIGRyaXZlciBmdW5jdGlvbnMuXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFuIG9iamVjdCB3aXRoIHRocmVlIHByb3BlcnRpZXM6IGBzb3VyY2VzYCwgYHNpbmtzYCBhbmRcbiAqIGBydW5gLiBgc291cmNlc2AgaXMgdGhlIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNvdXJjZXMsIGBzaW5rc2AgaXMgdGhlXG4gKiBjb2xsZWN0aW9uIG9mIGRyaXZlciBzaW5rcywgdGhlc2UgY2FuIGJlIHVzZWQgZm9yIGRlYnVnZ2luZyBvciB0ZXN0aW5nLiBgcnVuYFxuICogaXMgdGhlIGZ1bmN0aW9uIHRoYXQgb25jZSBjYWxsZWQgd2lsbCBleGVjdXRlIHRoZSBhcHBsaWNhdGlvbi5cbiAqIEBmdW5jdGlvbiBzZXR1cFxuICovXG5mdW5jdGlvbiBzZXR1cChtYWluLCBkcml2ZXJzKSB7XG4gICAgaWYgKHR5cGVvZiBtYWluICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSB0aGUgJ21haW4nIFwiICsgXCJmdW5jdGlvbi5cIik7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZHJpdmVycyAhPT0gXCJvYmplY3RcIiB8fCBkcml2ZXJzID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBwcm9wZXJ0aWVzLlwiKTtcbiAgICB9XG4gICAgaWYgKGludGVybmFsc18xLmlzT2JqZWN0RW1wdHkoZHJpdmVycykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBhdCBsZWFzdCBvbmUgZHJpdmVyIGZ1bmN0aW9uIGRlY2xhcmVkIGFzIGEgcHJvcGVydHkuXCIpO1xuICAgIH1cbiAgICB2YXIgZW5naW5lID0gc2V0dXBSZXVzYWJsZShkcml2ZXJzKTtcbiAgICB2YXIgc2lua3MgPSBtYWluKGVuZ2luZS5zb3VyY2VzKTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgd2luZG93LkN5Y2xlanMgPSB3aW5kb3cuQ3ljbGVqcyB8fCB7fTtcbiAgICAgICAgd2luZG93LkN5Y2xlanMuc2lua3MgPSBzaW5rcztcbiAgICB9XG4gICAgZnVuY3Rpb24gX3J1bigpIHtcbiAgICAgICAgdmFyIGRpc3Bvc2VSdW4gPSBlbmdpbmUucnVuKHNpbmtzKTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGRpc3Bvc2UoKSB7XG4gICAgICAgICAgICBkaXNwb3NlUnVuKCk7XG4gICAgICAgICAgICBlbmdpbmUuZGlzcG9zZSgpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyBzaW5rczogc2lua3MsIHNvdXJjZXM6IGVuZ2luZS5zb3VyY2VzLCBydW46IF9ydW4gfTtcbn1cbmV4cG9ydHMuc2V0dXAgPSBzZXR1cDtcbi8qKlxuICogQSBwYXJ0aWFsbHktYXBwbGllZCB2YXJpYW50IG9mIHNldHVwKCkgd2hpY2ggYWNjZXB0cyBvbmx5IHRoZSBkcml2ZXJzLCBhbmRcbiAqIGFsbG93cyBtYW55IGBtYWluYCBmdW5jdGlvbnMgdG8gZXhlY3V0ZSBhbmQgcmV1c2UgdGhpcyBzYW1lIHNldCBvZiBkcml2ZXJzLlxuICpcbiAqIFRha2VzIGFuIG9iamVjdCB3aXRoIGRyaXZlciBmdW5jdGlvbnMgYXMgaW5wdXQsIGFuZCBvdXRwdXRzIGFuIG9iamVjdCB3aGljaFxuICogY29udGFpbnMgdGhlIGdlbmVyYXRlZCBzb3VyY2VzIChmcm9tIHRob3NlIGRyaXZlcnMpIGFuZCBhIGBydW5gIGZ1bmN0aW9uXG4gKiAod2hpY2ggaW4gdHVybiBleHBlY3RzIHNpbmtzIGFzIGFyZ3VtZW50KS4gVGhpcyBgcnVuYCBmdW5jdGlvbiBjYW4gYmUgY2FsbGVkXG4gKiBtdWx0aXBsZSB0aW1lcyB3aXRoIGRpZmZlcmVudCBhcmd1bWVudHMsIGFuZCBpdCB3aWxsIHJldXNlIHRoZSBkcml2ZXJzIHRoYXRcbiAqIHdlcmUgcGFzc2VkIHRvIGBzZXR1cFJldXNhYmxlYC5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQge3NldHVwUmV1c2FibGV9IGZyb20gJ0BjeWNsZS9ydW4nO1xuICogY29uc3Qge3NvdXJjZXMsIHJ1biwgZGlzcG9zZX0gPSBzZXR1cFJldXNhYmxlKGRyaXZlcnMpO1xuICogLy8gLi4uXG4gKiBjb25zdCBzaW5rcyA9IG1haW4oc291cmNlcyk7XG4gKiBjb25zdCBkaXNwb3NlUnVuID0gcnVuKHNpbmtzKTtcbiAqIC8vIC4uLlxuICogZGlzcG9zZVJ1bigpO1xuICogLy8gLi4uXG4gKiBkaXNwb3NlKCk7IC8vIGVuZHMgdGhlIHJldXNhYmlsaXR5IG9mIGRyaXZlcnNcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBkcml2ZXJzIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBkcml2ZXIgbmFtZXMgYW5kIHZhbHVlc1xuICogYXJlIGRyaXZlciBmdW5jdGlvbnMuXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFuIG9iamVjdCB3aXRoIHRocmVlIHByb3BlcnRpZXM6IGBzb3VyY2VzYCwgYHJ1bmAgYW5kXG4gKiBgZGlzcG9zZWAuIGBzb3VyY2VzYCBpcyB0aGUgY29sbGVjdGlvbiBvZiBkcml2ZXIgc291cmNlcywgYHJ1bmAgaXMgdGhlXG4gKiBmdW5jdGlvbiB0aGF0IG9uY2UgY2FsbGVkIHdpdGggJ3NpbmtzJyBhcyBhcmd1bWVudCwgd2lsbCBleGVjdXRlIHRoZVxuICogYXBwbGljYXRpb24sIHR5aW5nIHRvZ2V0aGVyIHNvdXJjZXMgd2l0aCBzaW5rcy4gYGRpc3Bvc2VgIHRlcm1pbmF0ZXMgdGhlXG4gKiByZXVzYWJsZSByZXNvdXJjZXMgdXNlZCBieSB0aGUgZHJpdmVycy4gTm90ZSBhbHNvIHRoYXQgYHJ1bmAgcmV0dXJucyBhXG4gKiBkaXNwb3NlIGZ1bmN0aW9uIHdoaWNoIHRlcm1pbmF0ZXMgcmVzb3VyY2VzIHRoYXQgYXJlIHNwZWNpZmljIChub3QgcmV1c2FibGUpXG4gKiB0byB0aGF0IHJ1bi5cbiAqIEBmdW5jdGlvbiBzZXR1cFJldXNhYmxlXG4gKi9cbmZ1bmN0aW9uIHNldHVwUmV1c2FibGUoZHJpdmVycykge1xuICAgIGlmICh0eXBlb2YgZHJpdmVycyAhPT0gXCJvYmplY3RcIiB8fCBkcml2ZXJzID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IGdpdmVuIHRvIHNldHVwUmV1c2FibGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGRyaXZlciBmdW5jdGlvbnMgYXMgcHJvcGVydGllcy5cIik7XG4gICAgfVxuICAgIGlmIChpbnRlcm5hbHNfMS5pc09iamVjdEVtcHR5KGRyaXZlcnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkFyZ3VtZW50IGdpdmVuIHRvIHNldHVwUmV1c2FibGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGF0IGxlYXN0IG9uZSBkcml2ZXIgZnVuY3Rpb24gZGVjbGFyZWQgYXMgYSBwcm9wZXJ0eS5cIik7XG4gICAgfVxuICAgIHZhciBzaW5rUHJveGllcyA9IGludGVybmFsc18xLm1ha2VTaW5rUHJveGllcyhkcml2ZXJzKTtcbiAgICB2YXIgcmF3U291cmNlcyA9IGludGVybmFsc18xLmNhbGxEcml2ZXJzKGRyaXZlcnMsIHNpbmtQcm94aWVzKTtcbiAgICB2YXIgc291cmNlcyA9IGludGVybmFsc18xLmFkYXB0U291cmNlcyhyYXdTb3VyY2VzKTtcbiAgICBmdW5jdGlvbiBfcnVuKHNpbmtzKSB7XG4gICAgICAgIHJldHVybiBpbnRlcm5hbHNfMS5yZXBsaWNhdGVNYW55KHNpbmtzLCBzaW5rUHJveGllcyk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGRpc3Bvc2VFbmdpbmUoKSB7XG4gICAgICAgIGludGVybmFsc18xLmRpc3Bvc2VTb3VyY2VzKHNvdXJjZXMpO1xuICAgICAgICBpbnRlcm5hbHNfMS5kaXNwb3NlU2lua1Byb3hpZXMoc2lua1Byb3hpZXMpO1xuICAgIH1cbiAgICByZXR1cm4geyBzb3VyY2VzOiBzb3VyY2VzLCBydW46IF9ydW4sIGRpc3Bvc2U6IGRpc3Bvc2VFbmdpbmUgfTtcbn1cbmV4cG9ydHMuc2V0dXBSZXVzYWJsZSA9IHNldHVwUmV1c2FibGU7XG4vKipcbiAqIFRha2VzIGEgYG1haW5gIGZ1bmN0aW9uIGFuZCBjaXJjdWxhcmx5IGNvbm5lY3RzIGl0IHRvIHRoZSBnaXZlbiBjb2xsZWN0aW9uXG4gKiBvZiBkcml2ZXIgZnVuY3Rpb25zLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYGBganNcbiAqIGltcG9ydCBydW4gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCBkaXNwb3NlID0gcnVuKG1haW4sIGRyaXZlcnMpO1xuICogLy8gLi4uXG4gKiBkaXNwb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBUaGUgYG1haW5gIGZ1bmN0aW9uIGV4cGVjdHMgYSBjb2xsZWN0aW9uIG9mIFwic291cmNlXCIgc3RyZWFtcyAocmV0dXJuZWQgZnJvbVxuICogZHJpdmVycykgYXMgaW5wdXQsIGFuZCBzaG91bGQgcmV0dXJuIGEgY29sbGVjdGlvbiBvZiBcInNpbmtcIiBzdHJlYW1zICh0byBiZVxuICogZ2l2ZW4gdG8gZHJpdmVycykuIEEgXCJjb2xsZWN0aW9uIG9mIHN0cmVhbXNcIiBpcyBhIEphdmFTY3JpcHQgb2JqZWN0IHdoZXJlXG4gKiBrZXlzIG1hdGNoIHRoZSBkcml2ZXIgbmFtZXMgcmVnaXN0ZXJlZCBieSB0aGUgYGRyaXZlcnNgIG9iamVjdCwgYW5kIHZhbHVlc1xuICogYXJlIHRoZSBzdHJlYW1zLiBSZWZlciB0byB0aGUgZG9jdW1lbnRhdGlvbiBvZiBlYWNoIGRyaXZlciB0byBzZWUgbW9yZVxuICogZGV0YWlscyBvbiB3aGF0IHR5cGVzIG9mIHNvdXJjZXMgaXQgb3V0cHV0cyBhbmQgc2lua3MgaXQgcmVjZWl2ZXMuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhIGRpc3Bvc2UgZnVuY3Rpb24sIHVzZWQgdG8gdGVybWluYXRlIHRoZSBleGVjdXRpb24gb2YgdGhlXG4gKiBDeWNsZS5qcyBwcm9ncmFtLCBjbGVhbmluZyB1cCByZXNvdXJjZXMgdXNlZC5cbiAqIEBmdW5jdGlvbiBydW5cbiAqL1xuZnVuY3Rpb24gcnVuKG1haW4sIGRyaXZlcnMpIHtcbiAgICB2YXIgcHJvZ3JhbSA9IHNldHVwKG1haW4sIGRyaXZlcnMpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICB3aW5kb3cuQ3ljbGVqc0RldlRvb2xfc3RhcnRHcmFwaFNlcmlhbGl6ZXIpIHtcbiAgICAgICAgd2luZG93LkN5Y2xlanNEZXZUb29sX3N0YXJ0R3JhcGhTZXJpYWxpemVyKHByb2dyYW0uc2lua3MpO1xuICAgIH1cbiAgICByZXR1cm4gcHJvZ3JhbS5ydW4oKTtcbn1cbmV4cG9ydHMucnVuID0gcnVuO1xuZXhwb3J0cy5kZWZhdWx0ID0gcnVuO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgcXVpY2t0YXNrXzEgPSByZXF1aXJlKFwicXVpY2t0YXNrXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiLi9hZGFwdFwiKTtcbnZhciBzY2hlZHVsZU1pY3JvdGFzayA9IHF1aWNrdGFza18xLmRlZmF1bHQoKTtcbmZ1bmN0aW9uIG1ha2VTaW5rUHJveGllcyhkcml2ZXJzKSB7XG4gICAgdmFyIHNpbmtQcm94aWVzID0ge307XG4gICAgZm9yICh2YXIgbmFtZV8xIGluIGRyaXZlcnMpIHtcbiAgICAgICAgaWYgKGRyaXZlcnMuaGFzT3duUHJvcGVydHkobmFtZV8xKSkge1xuICAgICAgICAgICAgc2lua1Byb3hpZXNbbmFtZV8xXSA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzaW5rUHJveGllcztcbn1cbmV4cG9ydHMubWFrZVNpbmtQcm94aWVzID0gbWFrZVNpbmtQcm94aWVzO1xuZnVuY3Rpb24gY2FsbERyaXZlcnMoZHJpdmVycywgc2lua1Byb3hpZXMpIHtcbiAgICB2YXIgc291cmNlcyA9IHt9O1xuICAgIGZvciAodmFyIG5hbWVfMiBpbiBkcml2ZXJzKSB7XG4gICAgICAgIGlmIChkcml2ZXJzLmhhc093blByb3BlcnR5KG5hbWVfMikpIHtcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8yXSA9IGRyaXZlcnNbbmFtZV8yXShzaW5rUHJveGllc1tuYW1lXzJdLCBuYW1lXzIpO1xuICAgICAgICAgICAgaWYgKHNvdXJjZXNbbmFtZV8yXSAmJiB0eXBlb2Ygc291cmNlc1tuYW1lXzJdID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8yXS5faXNDeWNsZVNvdXJjZSA9IG5hbWVfMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlcztcbn1cbmV4cG9ydHMuY2FsbERyaXZlcnMgPSBjYWxsRHJpdmVycztcbi8vIE5PVEU6IHRoaXMgd2lsbCBtdXRhdGUgYHNvdXJjZXNgLlxuZnVuY3Rpb24gYWRhcHRTb3VyY2VzKHNvdXJjZXMpIHtcbiAgICBmb3IgKHZhciBuYW1lXzMgaW4gc291cmNlcykge1xuICAgICAgICBpZiAoc291cmNlcy5oYXNPd25Qcm9wZXJ0eShuYW1lXzMpICYmXG4gICAgICAgICAgICBzb3VyY2VzW25hbWVfM10gJiZcbiAgICAgICAgICAgIHR5cGVvZiBzb3VyY2VzW25hbWVfM10uc2hhbWVmdWxseVNlbmROZXh0ID09PVxuICAgICAgICAgICAgICAgICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSA9IGFkYXB0XzEuYWRhcHQoc291cmNlc1tuYW1lXzNdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlcztcbn1cbmV4cG9ydHMuYWRhcHRTb3VyY2VzID0gYWRhcHRTb3VyY2VzO1xuZnVuY3Rpb24gcmVwbGljYXRlTWFueShzaW5rcywgc2lua1Byb3hpZXMpIHtcbiAgICB2YXIgc2lua05hbWVzID0gT2JqZWN0LmtleXMoc2lua3MpLmZpbHRlcihmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gISFzaW5rUHJveGllc1tuYW1lXTsgfSk7XG4gICAgdmFyIGJ1ZmZlcnMgPSB7fTtcbiAgICB2YXIgcmVwbGljYXRvcnMgPSB7fTtcbiAgICBzaW5rTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBidWZmZXJzW25hbWVdID0geyBfbjogW10sIF9lOiBbXSB9O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXSA9IHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uICh4KSB7IHJldHVybiBidWZmZXJzW25hbWVdLl9uLnB1c2goeCk7IH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikgeyByZXR1cm4gYnVmZmVyc1tuYW1lXS5fZS5wdXNoKGVycik7IH0sXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciBzdWJzY3JpcHRpb25zID0gc2lua05hbWVzLm1hcChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2lua3NbbmFtZV0pLnN1YnNjcmliZShyZXBsaWNhdG9yc1tuYW1lXSk7XG4gICAgfSk7XG4gICAgc2lua05hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVyID0gc2lua1Byb3hpZXNbbmFtZV07XG4gICAgICAgIHZhciBuZXh0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHNjaGVkdWxlTWljcm90YXNrKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGxpc3RlbmVyLl9uKHgpOyB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgc2NoZWR1bGVNaWNyb3Rhc2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIChjb25zb2xlLmVycm9yIHx8IGNvbnNvbGUubG9nKShlcnIpO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLl9lKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgYnVmZmVyc1tuYW1lXS5fbi5mb3JFYWNoKG5leHQpO1xuICAgICAgICBidWZmZXJzW25hbWVdLl9lLmZvckVhY2goZXJyb3IpO1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5uZXh0ID0gbmV4dDtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uZXJyb3IgPSBlcnJvcjtcbiAgICAgICAgLy8gYmVjYXVzZSBzaW5rLnN1YnNjcmliZShyZXBsaWNhdG9yKSBoYWQgbXV0YXRlZCByZXBsaWNhdG9yIHRvIGFkZFxuICAgICAgICAvLyBfbiwgX2UsIF9jLCB3ZSBtdXN0IGFsc28gdXBkYXRlIHRoZXNlOlxuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5fbiA9IG5leHQ7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLl9lID0gZXJyb3I7XG4gICAgfSk7XG4gICAgYnVmZmVycyA9IG51bGw7IC8vIGZyZWUgdXAgZm9yIEdDXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGRpc3Bvc2VSZXBsaWNhdGlvbigpIHtcbiAgICAgICAgc3Vic2NyaXB0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnVuc3Vic2NyaWJlKCk7IH0pO1xuICAgIH07XG59XG5leHBvcnRzLnJlcGxpY2F0ZU1hbnkgPSByZXBsaWNhdGVNYW55O1xuZnVuY3Rpb24gZGlzcG9zZVNpbmtQcm94aWVzKHNpbmtQcm94aWVzKSB7XG4gICAgT2JqZWN0LmtleXMoc2lua1Byb3hpZXMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIHNpbmtQcm94aWVzW25hbWVdLl9jKCk7IH0pO1xufVxuZXhwb3J0cy5kaXNwb3NlU2lua1Byb3hpZXMgPSBkaXNwb3NlU2lua1Byb3hpZXM7XG5mdW5jdGlvbiBkaXNwb3NlU291cmNlcyhzb3VyY2VzKSB7XG4gICAgZm9yICh2YXIgayBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KGspICYmXG4gICAgICAgICAgICBzb3VyY2VzW2tdICYmXG4gICAgICAgICAgICBzb3VyY2VzW2tdLmRpc3Bvc2UpIHtcbiAgICAgICAgICAgIHNvdXJjZXNba10uZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5kaXNwb3NlU291cmNlcyA9IGRpc3Bvc2VTb3VyY2VzO1xuZnVuY3Rpb24gaXNPYmplY3RFbXB0eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG59XG5leHBvcnRzLmlzT2JqZWN0RW1wdHkgPSBpc09iamVjdEVtcHR5O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW50ZXJuYWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGlzb2xhdGVfMSA9IHJlcXVpcmUoXCJAY3ljbGUvaXNvbGF0ZVwiKTtcbnZhciBwaWNrTWVyZ2VfMSA9IHJlcXVpcmUoXCIuL3BpY2tNZXJnZVwiKTtcbnZhciBwaWNrQ29tYmluZV8xID0gcmVxdWlyZShcIi4vcGlja0NvbWJpbmVcIik7XG4vKipcbiAqIEFuIG9iamVjdCByZXByZXNlbnRpbmcgYWxsIGluc3RhbmNlcyBpbiBhIGNvbGxlY3Rpb24gb2YgY29tcG9uZW50cy4gSGFzIHRoZVxuICogbWV0aG9kcyBwaWNrQ29tYmluZSBhbmQgcGlja01lcmdlIHRvIGdldCB0aGUgY29tYmluZWQgc2lua3Mgb2YgYWxsIGluc3RhbmNlcy5cbiAqL1xudmFyIEluc3RhbmNlcyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJbnN0YW5jZXMoaW5zdGFuY2VzJCkge1xuICAgICAgICB0aGlzLl9pbnN0YW5jZXMkID0gaW5zdGFuY2VzJDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTGlrZSBgbWVyZ2VgIGluIHhzdHJlYW0sIHRoaXMgb3BlcmF0b3IgYmxlbmRzIG11bHRpcGxlIHN0cmVhbXMgdG9nZXRoZXIsIGJ1dFxuICAgICAqIHBpY2tzIHRob3NlIHN0cmVhbXMgZnJvbSBhIGNvbGxlY3Rpb24gb2YgY29tcG9uZW50IGluc3RhbmNlcy5cbiAgICAgKlxuICAgICAqIFVzZSB0aGUgYHNlbGVjdG9yYCBzdHJpbmcgdG8gcGljayBhIHN0cmVhbSBmcm9tIHRoZSBzaW5rcyBvYmplY3Qgb2YgZWFjaFxuICAgICAqIGNvbXBvbmVudCBpbnN0YW5jZSwgdGhlbiBwaWNrTWVyZ2Ugd2lsbCBtZXJnZSBhbGwgdGhvc2UgcGlja2VkIHN0cmVhbXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgYSBuYW1lIG9mIGEgY2hhbm5lbCBpbiBhIHNpbmtzIG9iamVjdCBiZWxvbmdpbmcgdG9cbiAgICAgKiBlYWNoIGNvbXBvbmVudCBpbiB0aGUgY29sbGVjdGlvbiBvZiBjb21wb25lbnRzLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhbiBvcGVyYXRvciB0byBiZSB1c2VkIHdpdGggeHN0cmVhbSdzIGBjb21wb3NlYCBtZXRob2QuXG4gICAgICovXG4gICAgSW5zdGFuY2VzLnByb3RvdHlwZS5waWNrTWVyZ2UgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGFkYXB0XzEuYWRhcHQodGhpcy5faW5zdGFuY2VzJC5jb21wb3NlKHBpY2tNZXJnZV8xLnBpY2tNZXJnZShzZWxlY3RvcikpKTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIExpa2UgYGNvbWJpbmVgIGluIHhzdHJlYW0sIHRoaXMgb3BlcmF0b3IgY29tYmluZXMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlcixcbiAgICAgKiBidXQgcGlja3MgdGhvc2Ugc3RyZWFtcyBmcm9tIGEgY29sbGVjdGlvbiBvZiBjb21wb25lbnQgaW5zdGFuY2VzLlxuICAgICAqXG4gICAgICogVXNlIHRoZSBgc2VsZWN0b3JgIHN0cmluZyB0byBwaWNrIGEgc3RyZWFtIGZyb20gdGhlIHNpbmtzIG9iamVjdCBvZiBlYWNoXG4gICAgICogY29tcG9uZW50IGluc3RhbmNlLCB0aGVuIHBpY2tDb21iaW5lIHdpbGwgY29tYmluZSBhbGwgdGhvc2UgcGlja2VkIHN0cmVhbXMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc2VsZWN0b3IgYSBuYW1lIG9mIGEgY2hhbm5lbCBpbiBhIHNpbmtzIG9iamVjdCBiZWxvbmdpbmcgdG9cbiAgICAgKiBlYWNoIGNvbXBvbmVudCBpbiB0aGUgY29sbGVjdGlvbiBvZiBjb21wb25lbnRzLlxuICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhbiBvcGVyYXRvciB0byBiZSB1c2VkIHdpdGggeHN0cmVhbSdzIGBjb21wb3NlYCBtZXRob2QuXG4gICAgICovXG4gICAgSW5zdGFuY2VzLnByb3RvdHlwZS5waWNrQ29tYmluZSA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdCh0aGlzLl9pbnN0YW5jZXMkLmNvbXBvc2UocGlja0NvbWJpbmVfMS5waWNrQ29tYmluZShzZWxlY3RvcikpKTtcbiAgICB9O1xuICAgIHJldHVybiBJbnN0YW5jZXM7XG59KCkpO1xuZXhwb3J0cy5JbnN0YW5jZXMgPSBJbnN0YW5jZXM7XG5mdW5jdGlvbiBkZWZhdWx0SXRlbVNjb3BlKGtleSkge1xuICAgIHJldHVybiB7ICcqJzogbnVsbCB9O1xufVxuZnVuY3Rpb24gaW5zdGFuY2VMZW5zKGl0ZW1LZXksIGtleSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKGFycikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhcnIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gYXJyLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJcIiArIGl0ZW1LZXkoYXJyW2ldLCBpKSA9PT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJyW2ldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGFyciwgaXRlbSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBhcnIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFtpdGVtXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBpdGVtID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnIuZmlsdGVyKGZ1bmN0aW9uIChzLCBpKSB7IHJldHVybiBcIlwiICsgaXRlbUtleShzLCBpKSAhPT0ga2V5OyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcnIubWFwKGZ1bmN0aW9uIChzLCBpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcIlwiICsgaXRlbUtleShzLCBpKSA9PT0ga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcbn1cbnZhciBpZGVudGl0eUxlbnMgPSB7XG4gICAgZ2V0OiBmdW5jdGlvbiAob3V0ZXIpIHsgcmV0dXJuIG91dGVyOyB9LFxuICAgIHNldDogZnVuY3Rpb24gKG91dGVyLCBpbm5lcikgeyByZXR1cm4gaW5uZXI7IH0sXG59O1xuZnVuY3Rpb24gbWFrZUNvbGxlY3Rpb24ob3B0cykge1xuICAgIHJldHVybiBmdW5jdGlvbiBjb2xsZWN0aW9uQ29tcG9uZW50KHNvdXJjZXMpIHtcbiAgICAgICAgdmFyIG5hbWUgPSBvcHRzLmNoYW5uZWwgfHwgJ3N0YXRlJztcbiAgICAgICAgdmFyIGl0ZW1LZXkgPSBvcHRzLml0ZW1LZXk7XG4gICAgICAgIHZhciBpdGVtU2NvcGUgPSBvcHRzLml0ZW1TY29wZSB8fCBkZWZhdWx0SXRlbVNjb3BlO1xuICAgICAgICB2YXIgaXRlbUNvbXAgPSBvcHRzLml0ZW07XG4gICAgICAgIHZhciBzdGF0ZSQgPSB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzW25hbWVdLnN0cmVhbSk7XG4gICAgICAgIHZhciBpbnN0YW5jZXMkID0gc3RhdGUkLmZvbGQoZnVuY3Rpb24gKGFjYywgbmV4dFN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgX2EsIF9iLCBfYywgX2Q7XG4gICAgICAgICAgICB2YXIgZGljdCA9IGFjYy5kaWN0O1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobmV4dFN0YXRlKSkge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0SW5zdEFycmF5ID0gQXJyYXkobmV4dFN0YXRlLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRLZXlzXzEgPSBuZXcgU2V0KCk7XG4gICAgICAgICAgICAgICAgLy8gYWRkXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBuZXh0U3RhdGUubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBrZXkgPSBcIlwiICsgKGl0ZW1LZXkgPyBpdGVtS2V5KG5leHRTdGF0ZVtpXSwgaSkgOiBpKTtcbiAgICAgICAgICAgICAgICAgICAgbmV4dEtleXNfMS5hZGQoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFkaWN0LmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3RhdGVTY29wZSA9IGl0ZW1LZXkgPyBpbnN0YW5jZUxlbnMoaXRlbUtleSwga2V5KSA6IFwiXCIgKyBpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG90aGVyU2NvcGVzID0gaXRlbVNjb3BlKGtleSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2NvcGVzID0gdHlwZW9mIG90aGVyU2NvcGVzID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gKF9hID0geyAnKic6IG90aGVyU2NvcGVzIH0sIF9hW25hbWVdID0gc3RhdGVTY29wZSwgX2EpIDogX19hc3NpZ24oe30sIG90aGVyU2NvcGVzLCAoX2IgPSB7fSwgX2JbbmFtZV0gPSBzdGF0ZVNjb3BlLCBfYikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNpbmtzID0gaXNvbGF0ZV8xLmRlZmF1bHQoaXRlbUNvbXAsIHNjb3Blcykoc291cmNlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWN0LnNldChrZXksIHNpbmtzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHRJbnN0QXJyYXlbaV0gPSBzaW5rcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHRJbnN0QXJyYXlbaV0gPSBkaWN0LmdldChrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIG5leHRJbnN0QXJyYXlbaV0uX2tleSA9IGtleTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gcmVtb3ZlXG4gICAgICAgICAgICAgICAgZGljdC5mb3JFYWNoKGZ1bmN0aW9uIChfLCBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFuZXh0S2V5c18xLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWN0LmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgbmV4dEtleXNfMS5jbGVhcigpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGRpY3Q6IGRpY3QsIGFycjogbmV4dEluc3RBcnJheSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZGljdC5jbGVhcigpO1xuICAgICAgICAgICAgICAgIHZhciBrZXkgPSBcIlwiICsgKGl0ZW1LZXkgPyBpdGVtS2V5KG5leHRTdGF0ZSwgMCkgOiAndGhpcycpO1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZVNjb3BlID0gaWRlbnRpdHlMZW5zO1xuICAgICAgICAgICAgICAgIHZhciBvdGhlclNjb3BlcyA9IGl0ZW1TY29wZShrZXkpO1xuICAgICAgICAgICAgICAgIHZhciBzY29wZXMgPSB0eXBlb2Ygb3RoZXJTY29wZXMgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgID8gKF9jID0geyAnKic6IG90aGVyU2NvcGVzIH0sIF9jW25hbWVdID0gc3RhdGVTY29wZSwgX2MpIDogX19hc3NpZ24oe30sIG90aGVyU2NvcGVzLCAoX2QgPSB7fSwgX2RbbmFtZV0gPSBzdGF0ZVNjb3BlLCBfZCkpO1xuICAgICAgICAgICAgICAgIHZhciBzaW5rcyA9IGlzb2xhdGVfMS5kZWZhdWx0KGl0ZW1Db21wLCBzY29wZXMpKHNvdXJjZXMpO1xuICAgICAgICAgICAgICAgIGRpY3Quc2V0KGtleSwgc2lua3MpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IGRpY3Q6IGRpY3QsIGFycjogW3NpbmtzXSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB7IGRpY3Q6IG5ldyBNYXAoKSwgYXJyOiBbXSB9KTtcbiAgICAgICAgcmV0dXJuIG9wdHMuY29sbGVjdFNpbmtzKG5ldyBJbnN0YW5jZXMoaW5zdGFuY2VzJCkpO1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VDb2xsZWN0aW9uID0gbWFrZUNvbGxlY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Db2xsZWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBkcm9wUmVwZWF0c18xID0gcmVxdWlyZShcInhzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHNcIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbmZ1bmN0aW9uIHVwZGF0ZUFycmF5RW50cnkoYXJyYXksIHNjb3BlLCBuZXdWYWwpIHtcbiAgICBpZiAobmV3VmFsID09PSBhcnJheVtzY29wZV0pIHtcbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cbiAgICB2YXIgaW5kZXggPSBwYXJzZUludChzY29wZSk7XG4gICAgaWYgKHR5cGVvZiBuZXdWYWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBhcnJheS5maWx0ZXIoZnVuY3Rpb24gKF92YWwsIGkpIHsgcmV0dXJuIGkgIT09IGluZGV4OyB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5Lm1hcChmdW5jdGlvbiAodmFsLCBpKSB7IHJldHVybiAoaSA9PT0gaW5kZXggPyBuZXdWYWwgOiB2YWwpOyB9KTtcbn1cbmZ1bmN0aW9uIG1ha2VHZXR0ZXIoc2NvcGUpIHtcbiAgICBpZiAodHlwZW9mIHNjb3BlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygc2NvcGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBsZW5zR2V0KHN0YXRlKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHN0YXRlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGVbc2NvcGVdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNjb3BlLmdldDtcbiAgICB9XG59XG5mdW5jdGlvbiBtYWtlU2V0dGVyKHNjb3BlKSB7XG4gICAgaWYgKHR5cGVvZiBzY29wZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHNjb3BlID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbGVuc1NldChzdGF0ZSwgY2hpbGRTdGF0ZSkge1xuICAgICAgICAgICAgdmFyIF9hLCBfYjtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHN0YXRlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1cGRhdGVBcnJheUVudHJ5KHN0YXRlLCBzY29wZSwgY2hpbGRTdGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2Ygc3RhdGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9hID0ge30sIF9hW3Njb3BlXSA9IGNoaWxkU3RhdGUsIF9hO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9fYXNzaWduKHt9LCBzdGF0ZSwgKF9iID0ge30sIF9iW3Njb3BlXSA9IGNoaWxkU3RhdGUsIF9iKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2NvcGUuc2V0O1xuICAgIH1cbn1cbmZ1bmN0aW9uIGlzb2xhdGVTb3VyY2Uoc291cmNlLCBzY29wZSkge1xuICAgIHJldHVybiBzb3VyY2Uuc2VsZWN0KHNjb3BlKTtcbn1cbmV4cG9ydHMuaXNvbGF0ZVNvdXJjZSA9IGlzb2xhdGVTb3VyY2U7XG5mdW5jdGlvbiBpc29sYXRlU2luayhpbm5lclJlZHVjZXIkLCBzY29wZSkge1xuICAgIHZhciBnZXQgPSBtYWtlR2V0dGVyKHNjb3BlKTtcbiAgICB2YXIgc2V0ID0gbWFrZVNldHRlcihzY29wZSk7XG4gICAgcmV0dXJuIGlubmVyUmVkdWNlciQubWFwKGZ1bmN0aW9uIChpbm5lclJlZHVjZXIpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIG91dGVyUmVkdWNlcihvdXRlcikge1xuICAgICAgICAgICAgdmFyIHByZXZJbm5lciA9IGdldChvdXRlcik7XG4gICAgICAgICAgICB2YXIgbmV4dElubmVyID0gaW5uZXJSZWR1Y2VyKHByZXZJbm5lcik7XG4gICAgICAgICAgICBpZiAocHJldklubmVyID09PSBuZXh0SW5uZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3V0ZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2V0KG91dGVyLCBuZXh0SW5uZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xufVxuZXhwb3J0cy5pc29sYXRlU2luayA9IGlzb2xhdGVTaW5rO1xuLyoqXG4gKiBSZXByZXNlbnRzIGEgcGllY2Ugb2YgYXBwbGljYXRpb24gc3RhdGUgZHluYW1pY2FsbHkgY2hhbmdpbmcgb3ZlciB0aW1lLlxuICovXG52YXIgU3RhdGVTb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU3RhdGVTb3VyY2Uoc3RyZWFtLCBuYW1lKSB7XG4gICAgICAgIHRoaXMuaXNvbGF0ZVNvdXJjZSA9IGlzb2xhdGVTb3VyY2U7XG4gICAgICAgIHRoaXMuaXNvbGF0ZVNpbmsgPSBpc29sYXRlU2luaztcbiAgICAgICAgdGhpcy5fc3RyZWFtID0gc3RyZWFtXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiB0eXBlb2YgcyAhPT0gJ3VuZGVmaW5lZCc7IH0pXG4gICAgICAgICAgICAuY29tcG9zZShkcm9wUmVwZWF0c18xLmRlZmF1bHQoKSlcbiAgICAgICAgICAgIC5yZW1lbWJlcigpO1xuICAgICAgICB0aGlzLl9uYW1lID0gbmFtZTtcbiAgICAgICAgdGhpcy5zdHJlYW0gPSBhZGFwdF8xLmFkYXB0KHRoaXMuX3N0cmVhbSk7XG4gICAgICAgIHRoaXMuX3N0cmVhbS5faXNDeWNsZVNvdXJjZSA9IG5hbWU7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbGVjdHMgYSBwYXJ0IChvciBzY29wZSkgb2YgdGhlIHN0YXRlIG9iamVjdCBhbmQgcmV0dXJucyBhIG5ldyBTdGF0ZVNvdXJjZVxuICAgICAqIGR5bmFtaWNhbGx5IHJlcHJlc2VudGluZyB0aGF0IHNlbGVjdGVkIHBhcnQgb2YgdGhlIHN0YXRlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfGxlbnN9IHNjb3BlIGFzIGEgc3RyaW5nLCB0aGlzIGFyZ3VtZW50IHJlcHJlc2VudHMgdGhlXG4gICAgICogcHJvcGVydHkgeW91IHdhbnQgdG8gc2VsZWN0IGZyb20gdGhlIHN0YXRlIG9iamVjdC4gQXMgYSBudW1iZXIsIHRoaXNcbiAgICAgKiByZXByZXNlbnRzIHRoZSBhcnJheSBpbmRleCB5b3Ugd2FudCB0byBzZWxlY3QgZnJvbSB0aGUgc3RhdGUgYXJyYXkuIEFzIGFcbiAgICAgKiBsZW5zIG9iamVjdCAoYW4gb2JqZWN0IHdpdGggZ2V0KCkgYW5kIHNldCgpKSwgdGhpcyBhcmd1bWVudCByZXByZXNlbnRzIGFueVxuICAgICAqIGN1c3RvbSB3YXkgb2Ygc2VsZWN0aW5nIHNvbWV0aGluZyBmcm9tIHRoZSBzdGF0ZSBvYmplY3QuXG4gICAgICovXG4gICAgU3RhdGVTb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzY29wZSkge1xuICAgICAgICB2YXIgZ2V0ID0gbWFrZUdldHRlcihzY29wZSk7XG4gICAgICAgIHJldHVybiBuZXcgU3RhdGVTb3VyY2UodGhpcy5fc3RyZWFtLm1hcChnZXQpLCB0aGlzLl9uYW1lKTtcbiAgICB9O1xuICAgIHJldHVybiBTdGF0ZVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLlN0YXRlU291cmNlID0gU3RhdGVTb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TdGF0ZVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTdGF0ZVNvdXJjZV8xID0gcmVxdWlyZShcIi4vU3RhdGVTb3VyY2VcIik7XG5leHBvcnRzLlN0YXRlU291cmNlID0gU3RhdGVTb3VyY2VfMS5TdGF0ZVNvdXJjZTtcbmV4cG9ydHMuaXNvbGF0ZVNvdXJjZSA9IFN0YXRlU291cmNlXzEuaXNvbGF0ZVNvdXJjZTtcbmV4cG9ydHMuaXNvbGF0ZVNpbmsgPSBTdGF0ZVNvdXJjZV8xLmlzb2xhdGVTaW5rO1xudmFyIENvbGxlY3Rpb25fMSA9IHJlcXVpcmUoXCIuL0NvbGxlY3Rpb25cIik7XG5leHBvcnRzLkluc3RhbmNlcyA9IENvbGxlY3Rpb25fMS5JbnN0YW5jZXM7XG4vKipcbiAqIEdpdmVuIGEgQ3ljbGUuanMgY29tcG9uZW50IHRoYXQgZXhwZWN0cyBhIHN0YXRlICpzb3VyY2UqIGFuZCB3aWxsXG4gKiBvdXRwdXQgYSByZWR1Y2VyICpzaW5rKiwgdGhpcyBmdW5jdGlvbiBzZXRzIHVwIHRoZSBzdGF0ZSBtYW5hZ2VtZW50XG4gKiBtZWNoYW5pY3MgdG8gYWNjdW11bGF0ZSBzdGF0ZSBvdmVyIHRpbWUgYW5kIHByb3ZpZGUgdGhlIHN0YXRlIHNvdXJjZS4gSXRcbiAqIHJldHVybnMgYSBDeWNsZS5qcyBjb21wb25lbnQgd2hpY2ggd3JhcHMgdGhlIGNvbXBvbmVudCBnaXZlbiBhcyBpbnB1dC5cbiAqIEVzc2VudGlhbGx5LCBpdCBob29rcyB1cCB0aGUgcmVkdWNlcnMgc2luayB3aXRoIHRoZSBzdGF0ZSBzb3VyY2UgYXMgYSBjeWNsZS5cbiAqXG4gKiBPcHRpb25hbGx5LCB5b3UgY2FuIHBhc3MgYSBjdXN0b20gbmFtZSBmb3IgdGhlIHN0YXRlIGNoYW5uZWwuIEJ5IGRlZmF1bHQsXG4gKiB0aGUgbmFtZSBpcyAnc3RhdGUnIGluIHNvdXJjZXMgYW5kIHNpbmtzLCBidXQgeW91IGNhbiBjaGFuZ2UgdGhhdCB0byBiZVxuICogd2hhdGV2ZXIgc3RyaW5nIHlvdSB3aXNoLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1haW4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dCBhbmQgb3V0cHV0c1xuICogYHNpbmtzYC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIGFuIG9wdGlvbmFsIHN0cmluZyBmb3IgdGhlIGN1c3RvbSBuYW1lIGdpdmVuIHRvIHRoZVxuICogc3RhdGUgY2hhbm5lbC4gQnkgZGVmYXVsdCwgaXQgaXMgdGhlIHN0cmluZyAnc3RhdGUnLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgY29tcG9uZW50IHRoYXQgd3JhcHMgdGhlIG1haW4gZnVuY3Rpb24gZ2l2ZW4gYXMgaW5wdXQsXG4gKiBhZGRpbmcgc3RhdGUgYWNjdW11bGF0aW9uIGxvZ2ljIHRvIGl0LlxuICogQGZ1bmN0aW9uIHdpdGhTdGF0ZVxuICovXG52YXIgd2l0aFN0YXRlXzEgPSByZXF1aXJlKFwiLi93aXRoU3RhdGVcIik7XG5leHBvcnRzLndpdGhTdGF0ZSA9IHdpdGhTdGF0ZV8xLndpdGhTdGF0ZTtcbi8qKlxuICogUmV0dXJucyBhIEN5Y2xlLmpzIGNvbXBvbmVudCAoYSBmdW5jdGlvbiBmcm9tIHNvdXJjZXMgdG8gc2lua3MpIHRoYXRcbiAqIHJlcHJlc2VudHMgYSBjb2xsZWN0aW9uIG9mIG1hbnkgaXRlbSBjb21wb25lbnRzIG9mIHRoZSBzYW1lIHR5cGUuXG4gKlxuICogVGFrZXMgYW4gXCJvcHRpb25zXCIgb2JqZWN0IGFzIGlucHV0LCB3aXRoIHRoZSByZXF1aXJlZCBwcm9wZXJ0aWVzOlxuICogLSBpdGVtXG4gKiAtIGNvbGxlY3RTaW5rc1xuICpcbiAqIEFuZCB0aGUgb3B0aW9uYWwgcHJvcGVydGllczpcbiAqIC0gaXRlbUtleVxuICogLSBpdGVtU2NvcGVcbiAqIC0gY2hhbm5lbFxuICpcbiAqIFRoZSByZXR1cm5lZCBjb21wb25lbnQsIHRoZSBDb2xsZWN0aW9uLCB3aWxsIHVzZSB0aGUgc3RhdGUgc291cmNlIHBhc3NlZCB0b1xuICogaXQgKHRocm91Z2ggc291cmNlcykgdG8gZ3VpZGUgdGhlIGR5bmFtaWMgZ3Jvd2luZy9zaHJpbmtpbmcgb2YgaW5zdGFuY2VzIG9mXG4gKiB0aGUgaXRlbSBjb21wb25lbnQuXG4gKlxuICogVHlwaWNhbGx5IHRoZSBzdGF0ZSBzb3VyY2Ugc2hvdWxkIGVtaXQgYXJyYXlzLCB3aGVyZSBlYWNoIGVudHJ5IGluIHRoZSBhcnJheVxuICogaXMgYW4gb2JqZWN0IGhvbGRpbmcgdGhlIHN0YXRlIGZvciBlYWNoIGl0ZW0gY29tcG9uZW50LiBXaGVuIHRoZSBzdGF0ZSBhcnJheVxuICogZ3Jvd3MsIHRoZSBjb2xsZWN0aW9uIHdpbGwgYXV0b21hdGljYWxseSBpbnN0YW50aWF0ZSBhIG5ldyBpdGVtIGNvbXBvbmVudC5cbiAqIFNpbWlsYXJseSwgd2hlbiB0aGUgc3RhdGUgYXJyYXkgZ2V0cyBzbWFsbGVyLCB0aGUgY29sbGVjdGlvbiB3aWxsIGhhbmRsZVxuICogcmVtb3ZhbCBvZiB0aGUgY29ycmVzcG9uZGluZyBpdGVtIGluc3RhbmNlLlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgYSBjb25maWd1cmF0aW9uIG9iamVjdCB3aXRoIHRoZSBmb2xsb3dpbmcgZmllbGRzOlxuICogICAtIGBpdGVtOiBmdW5jdGlvbmAsIGEgQ3ljbGUuanMgY29tcG9uZW50IGZvciBlYWNoIGl0ZW0gaW4gdGhlIGNvbGxlY3Rpb24uXG4gKiAgIC0gYGNvbGxlY3RTaW5rczogZnVuY3Rpb25gLCBhIGZ1bmN0aW9uIHRoYXQgZGVzY3JpYmVzIGhvdyB0byBjb2xsZWN0IHRoZVxuICogICAgICBzaW5rcyBmcm9tIGFsbCBpdGVtIGluc3RhbmNlcy5cbiAqICAgLSBgaXRlbUtleTogZnVuY3Rpb25gLCBhIGZ1bmN0aW9uIGZyb20gaXRlbSBzdGF0ZSB0byBpdGVtICh1bmlxdWUpIGtleS5cbiAqICAgLSBgaXRlbVNjb3BlOiBmdW5jdGlvbmAsIGEgZnVuY3Rpb24gZnJvbSBpdGVtIGtleSB0byBpc29sYXRpb24gc2NvcGUuXG4gKiAgIC0gYGNoYW5uZWw6IHN0cmluZ2AsIGNob29zZSB0aGUgY2hhbm5lbCBuYW1lIHdoZXJlIHRoZSBTdGF0ZVNvdXJjZSBleGlzdHMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBjb21wb25lbnQgdGhhdCBkaXNwbGF5cyBtYW55IGluc3RhbmNlcyBvZiB0aGUgaXRlbVxuICogY29tcG9uZW50LlxuICogQGZ1bmN0aW9uIG1ha2VDb2xsZWN0aW9uXG4gKi9cbnZhciBDb2xsZWN0aW9uXzIgPSByZXF1aXJlKFwiLi9Db2xsZWN0aW9uXCIpO1xuZXhwb3J0cy5tYWtlQ29sbGVjdGlvbiA9IENvbGxlY3Rpb25fMi5tYWtlQ29sbGVjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIFBpY2tDb21iaW5lTGlzdGVuZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGlja0NvbWJpbmVMaXN0ZW5lcihrZXksIG91dCwgcCwgaW5zKSB7XG4gICAgICAgIHRoaXMua2V5ID0ga2V5O1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5wID0gcDtcbiAgICAgICAgdGhpcy52YWwgPSB4c3RyZWFtXzEuTk87XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIH1cbiAgICBQaWNrQ29tYmluZUxpc3RlbmVyLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wLCBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgdGhpcy52YWwgPSB0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wLnVwKCk7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZUxpc3RlbmVyLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9lKGVycik7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZUxpc3RlbmVyLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICByZXR1cm4gUGlja0NvbWJpbmVMaXN0ZW5lcjtcbn0oKSk7XG52YXIgUGlja0NvbWJpbmUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGlja0NvbWJpbmUoc2VsLCBpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ2NvbWJpbmUnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5zZWwgPSBzZWw7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5zdCA9IG51bGw7XG4gICAgfVxuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCkge1xuICAgICAgICAgICAgaWwuaW5zLl9yZW1vdmUoaWwpO1xuICAgICAgICAgICAgaWwuaW5zID0gbnVsbDtcbiAgICAgICAgICAgIGlsLm91dCA9IG51bGw7XG4gICAgICAgICAgICBpbC52YWwgPSBudWxsO1xuICAgICAgICB9KTtcbiAgICAgICAgaWxzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5zdCA9IG51bGw7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUudXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcnIgPSB0aGlzLmluc3QuYXJyO1xuICAgICAgICB2YXIgbiA9IGFyci5sZW5ndGg7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgdmFyIG91dEFyciA9IEFycmF5KG4pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgdmFyIHNpbmtzID0gYXJyW2ldO1xuICAgICAgICAgICAgdmFyIGtleSA9IHNpbmtzLl9rZXk7XG4gICAgICAgICAgICBpZiAoIWlscy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB2YWwgPSBpbHMuZ2V0KGtleSkudmFsO1xuICAgICAgICAgICAgaWYgKHZhbCA9PT0geHN0cmVhbV8xLk5PKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3V0QXJyW2ldID0gdmFsO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMub3V0Ll9uKG91dEFycik7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAoaW5zdCkge1xuICAgICAgICB0aGlzLmluc3QgPSBpbnN0O1xuICAgICAgICB2YXIgYXJyU2lua3MgPSBpbnN0LmFycjtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIHZhciBzZWwgPSB0aGlzLnNlbDtcbiAgICAgICAgdmFyIGRpY3QgPSBpbnN0LmRpY3Q7XG4gICAgICAgIHZhciBuID0gYXJyU2lua3MubGVuZ3RoO1xuICAgICAgICAvLyByZW1vdmVcbiAgICAgICAgdmFyIHJlbW92ZWQgPSBmYWxzZTtcbiAgICAgICAgaWxzLmZvckVhY2goZnVuY3Rpb24gKGlsLCBrZXkpIHtcbiAgICAgICAgICAgIGlmICghZGljdC5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlsLm91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWwudmFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbHMuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAobiA9PT0gMCkge1xuICAgICAgICAgICAgb3V0Ll9uKFtdKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBhZGRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzaW5rcyA9IGFyclNpbmtzW2ldO1xuICAgICAgICAgICAgdmFyIGtleSA9IHNpbmtzLl9rZXk7XG4gICAgICAgICAgICBpZiAoIXNpbmtzW3NlbF0pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3BpY2tDb21iaW5lIGZvdW5kIGFuIHVuZGVmaW5lZCBjaGlsZCBzaW5rIHN0cmVhbScpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHNpbmsgPSB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tzZWxdKTtcbiAgICAgICAgICAgIGlmICghaWxzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWxzLnNldChrZXksIG5ldyBQaWNrQ29tYmluZUxpc3RlbmVyKGtleSwgb3V0LCB0aGlzLCBzaW5rKSk7XG4gICAgICAgICAgICAgICAgc2luay5fYWRkKGlscy5nZXQoa2V5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgICAgIHRoaXMudXAoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9lKGUpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBQaWNrQ29tYmluZTtcbn0oKSk7XG5mdW5jdGlvbiBwaWNrQ29tYmluZShzZWxlY3Rvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiBwaWNrQ29tYmluZU9wZXJhdG9yKGluc3QkKSB7XG4gICAgICAgIHJldHVybiBuZXcgeHN0cmVhbV8xLlN0cmVhbShuZXcgUGlja0NvbWJpbmUoc2VsZWN0b3IsIGluc3QkKSk7XG4gICAgfTtcbn1cbmV4cG9ydHMucGlja0NvbWJpbmUgPSBwaWNrQ29tYmluZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBpY2tDb21iaW5lLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIFBpY2tNZXJnZUxpc3RlbmVyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tNZXJnZUxpc3RlbmVyKG91dCwgcCwgaW5zKSB7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5wID0gcDtcbiAgICB9XG4gICAgUGlja01lcmdlTGlzdGVuZXIucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9uKHQpO1xuICAgIH07XG4gICAgUGlja01lcmdlTGlzdGVuZXIucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2UoZXJyKTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZUxpc3RlbmVyLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHsgfTtcbiAgICByZXR1cm4gUGlja01lcmdlTGlzdGVuZXI7XG59KCkpO1xudmFyIFBpY2tNZXJnZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrTWVyZ2Uoc2VsLCBpbnMpIHtcbiAgICAgICAgdGhpcy50eXBlID0gJ3BpY2tNZXJnZSc7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuc2VsID0gc2VsO1xuICAgICAgICB0aGlzLmlscyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pbnN0ID0gbnVsbDtcbiAgICB9XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fc3RhcnQgPSBmdW5jdGlvbiAob3V0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwsIGtleSkge1xuICAgICAgICAgICAgaWwuaW5zLl9yZW1vdmUoaWwpO1xuICAgICAgICAgICAgaWwuaW5zID0gbnVsbDtcbiAgICAgICAgICAgIGlsLm91dCA9IG51bGw7XG4gICAgICAgICAgICBpbHMuZGVsZXRlKGtleSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpbHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmlscyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pbnN0ID0gbnVsbDtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAoaW5zdCkge1xuICAgICAgICB0aGlzLmluc3QgPSBpbnN0O1xuICAgICAgICB2YXIgYXJyU2lua3MgPSBpbnN0LmFycjtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIHZhciBzZWwgPSB0aGlzLnNlbDtcbiAgICAgICAgdmFyIG4gPSBhcnJTaW5rcy5sZW5ndGg7XG4gICAgICAgIC8vIGFkZFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgdmFyIHNpbmtzID0gYXJyU2lua3NbaV07XG4gICAgICAgICAgICB2YXIga2V5ID0gc2lua3MuX2tleTtcbiAgICAgICAgICAgIHZhciBzaW5rID0geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2lua3Nbc2VsXSB8fCB4c3RyZWFtXzEuZGVmYXVsdC5uZXZlcigpKTtcbiAgICAgICAgICAgIGlmICghaWxzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWxzLnNldChrZXksIG5ldyBQaWNrTWVyZ2VMaXN0ZW5lcihvdXQsIHRoaXMsIHNpbmspKTtcbiAgICAgICAgICAgICAgICBzaW5rLl9hZGQoaWxzLmdldChrZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmVcbiAgICAgICAgaWxzLmZvckVhY2goZnVuY3Rpb24gKGlsLCBrZXkpIHtcbiAgICAgICAgICAgIGlmICghaW5zdC5kaWN0LmhhcyhrZXkpIHx8ICFpbnN0LmRpY3QuZ2V0KGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbC5pbnMuX3JlbW92ZShpbCk7XG4gICAgICAgICAgICAgICAgaWwuaW5zID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbC5vdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlscy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHUuX2UoZXJyKTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdS5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIFBpY2tNZXJnZTtcbn0oKSk7XG5mdW5jdGlvbiBwaWNrTWVyZ2Uoc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gcGlja01lcmdlT3BlcmF0b3IoaW5zdCQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB4c3RyZWFtXzEuU3RyZWFtKG5ldyBQaWNrTWVyZ2Uoc2VsZWN0b3IsIGluc3QkKSk7XG4gICAgfTtcbn1cbmV4cG9ydHMucGlja01lcmdlID0gcGlja01lcmdlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGlja01lcmdlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGNvbmNhdF8xID0gcmVxdWlyZShcInhzdHJlYW0vZXh0cmEvY29uY2F0XCIpO1xudmFyIFN0YXRlU291cmNlXzEgPSByZXF1aXJlKFwiLi9TdGF0ZVNvdXJjZVwiKTtcbnZhciBxdWlja3Rhc2tfMSA9IHJlcXVpcmUoXCJxdWlja3Rhc2tcIik7XG52YXIgc2NoZWR1bGUgPSBxdWlja3Rhc2tfMS5kZWZhdWx0KCk7XG5mdW5jdGlvbiB3aXRoU3RhdGUobWFpbiwgbmFtZSkge1xuICAgIGlmIChuYW1lID09PSB2b2lkIDApIHsgbmFtZSA9ICdzdGF0ZSc7IH1cbiAgICByZXR1cm4gZnVuY3Rpb24gbWFpbldpdGhTdGF0ZShzb3VyY2VzKSB7XG4gICAgICAgIHZhciByZWR1Y2VyTWltaWMkID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIHZhciBzdGF0ZSQgPSByZWR1Y2VyTWltaWMkXG4gICAgICAgICAgICAuZm9sZChmdW5jdGlvbiAoc3RhdGUsIHJlZHVjZXIpIHsgcmV0dXJuIHJlZHVjZXIoc3RhdGUpOyB9LCB2b2lkIDApXG4gICAgICAgICAgICAuZHJvcCgxKTtcbiAgICAgICAgdmFyIGlubmVyU291cmNlcyA9IHNvdXJjZXM7XG4gICAgICAgIGlubmVyU291cmNlc1tuYW1lXSA9IG5ldyBTdGF0ZVNvdXJjZV8xLlN0YXRlU291cmNlKHN0YXRlJCwgbmFtZSk7XG4gICAgICAgIHZhciBzaW5rcyA9IG1haW4oaW5uZXJTb3VyY2VzKTtcbiAgICAgICAgaWYgKHNpbmtzW25hbWVdKSB7XG4gICAgICAgICAgICB2YXIgc3RyZWFtJCA9IGNvbmNhdF8xLmRlZmF1bHQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2lua3NbbmFtZV0pLCB4c3RyZWFtXzEuZGVmYXVsdC5uZXZlcigpKTtcbiAgICAgICAgICAgIHN0cmVhbSQuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoaSkgeyByZXR1cm4gc2NoZWR1bGUoZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVkdWNlck1pbWljJC5fbihpKTsgfSk7IH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHsgcmV0dXJuIHNjaGVkdWxlKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJlZHVjZXJNaW1pYyQuX2UoZXJyKTsgfSk7IH0sXG4gICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHNjaGVkdWxlKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJlZHVjZXJNaW1pYyQuX2MoKTsgfSk7IH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2lua3M7XG4gICAgfTtcbn1cbmV4cG9ydHMud2l0aFN0YXRlID0gd2l0aFN0YXRlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9d2l0aFN0YXRlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gbWljcm90YXNrKCkge1xuICAgIGlmICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIG5vZGVfMSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgdmFyIHF1ZXVlXzEgPSBbXTtcbiAgICAgICAgdmFyIGlfMSA9IDA7XG4gICAgICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChxdWV1ZV8xLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHF1ZXVlXzEuc2hpZnQoKSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5vYnNlcnZlKG5vZGVfMSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZV8xLnB1c2goZm4pO1xuICAgICAgICAgICAgbm9kZV8xLmRhdGEgPSBpXzEgPSAxIC0gaV8xO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gc2V0SW1tZWRpYXRlO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dDtcbiAgICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBtaWNyb3Rhc2s7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZSgnLi9zZWxlY3RvclBhcnNlcicpO1xuZnVuY3Rpb24gY2xhc3NOYW1lRnJvbVZOb2RlKHZOb2RlKSB7XG4gICAgdmFyIF9hID0gc2VsZWN0b3JQYXJzZXJfMS5zZWxlY3RvclBhcnNlcih2Tm9kZSkuY2xhc3NOYW1lLCBjbiA9IF9hID09PSB2b2lkIDAgPyAnJyA6IF9hO1xuICAgIGlmICghdk5vZGUuZGF0YSkge1xuICAgICAgICByZXR1cm4gY247XG4gICAgfVxuICAgIHZhciBfYiA9IHZOb2RlLmRhdGEsIGRhdGFDbGFzcyA9IF9iLmNsYXNzLCBwcm9wcyA9IF9iLnByb3BzO1xuICAgIGlmIChkYXRhQ2xhc3MpIHtcbiAgICAgICAgdmFyIGMgPSBPYmplY3Qua2V5cyhkYXRhQ2xhc3MpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjbCkgeyByZXR1cm4gZGF0YUNsYXNzW2NsXTsgfSk7XG4gICAgICAgIGNuICs9IFwiIFwiICsgYy5qb2luKFwiIFwiKTtcbiAgICB9XG4gICAgaWYgKHByb3BzICYmIHByb3BzLmNsYXNzTmFtZSkge1xuICAgICAgICBjbiArPSBcIiBcIiArIHByb3BzLmNsYXNzTmFtZTtcbiAgICB9XG4gICAgcmV0dXJuIGNuICYmIGNuLnRyaW0oKTtcbn1cbmV4cG9ydHMuY2xhc3NOYW1lRnJvbVZOb2RlID0gY2xhc3NOYW1lRnJvbVZOb2RlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2xhc3NOYW1lRnJvbVZOb2RlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gY3VycnkyKHNlbGVjdCkge1xuICAgIHJldHVybiBmdW5jdGlvbiBzZWxlY3RvcihzZWwsIHZOb2RlKSB7XG4gICAgICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gc2VsZWN0O1xuICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24gKF92Tm9kZSkgeyByZXR1cm4gc2VsZWN0KHNlbCwgX3ZOb2RlKTsgfTtcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBzZWxlY3Qoc2VsLCB2Tm9kZSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZXhwb3J0cy5jdXJyeTIgPSBjdXJyeTI7XG47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jdXJyeTIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcXVlcnlfMSA9IHJlcXVpcmUoJy4vcXVlcnknKTtcbnZhciBwYXJlbnRfc3ltYm9sXzEgPSByZXF1aXJlKCcuL3BhcmVudC1zeW1ib2wnKTtcbmZ1bmN0aW9uIGZpbmRNYXRjaGVzKGNzc1NlbGVjdG9yLCB2Tm9kZSkge1xuICAgIGlmICghdk5vZGUpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICB0cmF2ZXJzZVZOb2RlKHZOb2RlLCBhZGRQYXJlbnQpOyAvLyBhZGQgbWFwcGluZyB0byB0aGUgcGFyZW50IHNlbGVjdG9yUGFyc2VyXG4gICAgcmV0dXJuIHF1ZXJ5XzEucXVlcnlTZWxlY3Rvcihjc3NTZWxlY3Rvciwgdk5vZGUpO1xufVxuZXhwb3J0cy5maW5kTWF0Y2hlcyA9IGZpbmRNYXRjaGVzO1xuZnVuY3Rpb24gdHJhdmVyc2VWTm9kZSh2Tm9kZSwgZikge1xuICAgIGZ1bmN0aW9uIHJlY3Vyc2UoY3VycmVudE5vZGUsIGlzUGFyZW50LCBwYXJlbnRWTm9kZSkge1xuICAgICAgICB2YXIgbGVuZ3RoID0gY3VycmVudE5vZGUuY2hpbGRyZW4gJiYgY3VycmVudE5vZGUuY2hpbGRyZW4ubGVuZ3RoIHx8IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGN1cnJlbnROb2RlLmNoaWxkcmVuO1xuICAgICAgICAgICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuW2ldICYmIHR5cGVvZiBjaGlsZHJlbltpXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICByZWN1cnNlKGNoaWxkLCBmYWxzZSwgY3VycmVudE5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGYoY3VycmVudE5vZGUsIGlzUGFyZW50LCBpc1BhcmVudCA/IHZvaWQgMCA6IHBhcmVudFZOb2RlKTtcbiAgICB9XG4gICAgcmVjdXJzZSh2Tm9kZSwgdHJ1ZSk7XG59XG5mdW5jdGlvbiBhZGRQYXJlbnQodk5vZGUsIGlzUGFyZW50LCBwYXJlbnQpIHtcbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG4gICAgaWYgKCF2Tm9kZS5kYXRhKSB7XG4gICAgICAgIHZOb2RlLmRhdGEgPSB7fTtcbiAgICB9XG4gICAgaWYgKCF2Tm9kZS5kYXRhW3BhcmVudF9zeW1ib2xfMS5kZWZhdWx0XSkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodk5vZGUuZGF0YSwgcGFyZW50X3N5bWJvbF8xLmRlZmF1bHQsIHtcbiAgICAgICAgICAgIHZhbHVlOiBwYXJlbnQsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZpbmRNYXRjaGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIGN1cnJ5Ml8xID0gcmVxdWlyZSgnLi9jdXJyeTInKTtcbnZhciBmaW5kTWF0Y2hlc18xID0gcmVxdWlyZSgnLi9maW5kTWF0Y2hlcycpO1xuZXhwb3J0cy5zZWxlY3QgPSBjdXJyeTJfMS5jdXJyeTIoZmluZE1hdGNoZXNfMS5maW5kTWF0Y2hlcyk7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoJy4vc2VsZWN0b3JQYXJzZXInKTtcbmV4cG9ydHMuc2VsZWN0b3JQYXJzZXIgPSBzZWxlY3RvclBhcnNlcl8xLnNlbGVjdG9yUGFyc2VyO1xudmFyIGNsYXNzTmFtZUZyb21WTm9kZV8xID0gcmVxdWlyZSgnLi9jbGFzc05hbWVGcm9tVk5vZGUnKTtcbmV4cG9ydHMuY2xhc3NOYW1lRnJvbVZOb2RlID0gY2xhc3NOYW1lRnJvbVZOb2RlXzEuY2xhc3NOYW1lRnJvbVZOb2RlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcm9vdDtcbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByb290ID0gc2VsZjtcbn1cbmVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IHdpbmRvdztcbn1cbmVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IGdsb2JhbDtcbn1cbmVsc2Uge1xuICAgIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxudmFyIFN5bWJvbCA9IHJvb3QuU3ltYm9sO1xudmFyIHBhcmVudFN5bWJvbDtcbmlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcGFyZW50U3ltYm9sID0gU3ltYm9sKCdwYXJlbnQnKTtcbn1cbmVsc2Uge1xuICAgIHBhcmVudFN5bWJvbCA9ICdAQHNuYWJiZG9tLXNlbGVjdG9yLXBhcmVudCc7XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBwYXJlbnRTeW1ib2w7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wYXJlbnQtc3ltYm9sLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHRyZWVfc2VsZWN0b3JfMSA9IHJlcXVpcmUoJ3RyZWUtc2VsZWN0b3InKTtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZSgnLi9zZWxlY3RvclBhcnNlcicpO1xudmFyIGNsYXNzTmFtZUZyb21WTm9kZV8xID0gcmVxdWlyZSgnLi9jbGFzc05hbWVGcm9tVk5vZGUnKTtcbnZhciBwYXJlbnRfc3ltYm9sXzEgPSByZXF1aXJlKCcuL3BhcmVudC1zeW1ib2wnKTtcbnZhciBvcHRpb25zID0ge1xuICAgIHRhZzogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiBzZWxlY3RvclBhcnNlcl8xLnNlbGVjdG9yUGFyc2VyKHZOb2RlKS50YWdOYW1lOyB9LFxuICAgIGNsYXNzTmFtZTogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiBjbGFzc05hbWVGcm9tVk5vZGVfMS5jbGFzc05hbWVGcm9tVk5vZGUodk5vZGUpOyB9LFxuICAgIGlkOiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIHNlbGVjdG9yUGFyc2VyXzEuc2VsZWN0b3JQYXJzZXIodk5vZGUpLmlkIHx8ICcnOyB9LFxuICAgIGNoaWxkcmVuOiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIHZOb2RlLmNoaWxkcmVuIHx8IFtdOyB9LFxuICAgIHBhcmVudDogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiB2Tm9kZS5kYXRhW3BhcmVudF9zeW1ib2xfMS5kZWZhdWx0XSB8fCB2Tm9kZTsgfSxcbiAgICBjb250ZW50czogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiB2Tm9kZS50ZXh0IHx8ICcnOyB9LFxuICAgIGF0dHI6IGZ1bmN0aW9uICh2Tm9kZSwgYXR0cikge1xuICAgICAgICBpZiAodk5vZGUuZGF0YSkge1xuICAgICAgICAgICAgdmFyIF9hID0gdk5vZGUuZGF0YSwgX2IgPSBfYS5hdHRycywgYXR0cnMgPSBfYiA9PT0gdm9pZCAwID8ge30gOiBfYiwgX2MgPSBfYS5wcm9wcywgcHJvcHMgPSBfYyA9PT0gdm9pZCAwID8ge30gOiBfYywgX2QgPSBfYS5kYXRhc2V0LCBkYXRhc2V0ID0gX2QgPT09IHZvaWQgMCA/IHt9IDogX2Q7XG4gICAgICAgICAgICBpZiAoYXR0cnNbYXR0cl0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXR0cnNbYXR0cl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJvcHNbYXR0cl0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcHNbYXR0cl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXR0ci5pbmRleE9mKCdkYXRhLScpID09PSAwICYmIGRhdGFzZXRbYXR0ci5zbGljZSg1KV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YXNldFthdHRyLnNsaWNlKDUpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG59O1xudmFyIG1hdGNoZXMgPSB0cmVlX3NlbGVjdG9yXzEuY3JlYXRlTWF0Y2hlcyhvcHRpb25zKTtcbmZ1bmN0aW9uIGN1c3RvbU1hdGNoZXMoc2VsLCB2bm9kZSkge1xuICAgIHZhciBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICB2YXIgc2VsZWN0b3IgPSBtYXRjaGVzLmJpbmQobnVsbCwgc2VsKTtcbiAgICBpZiAoZGF0YSAmJiBkYXRhLmZuKSB7XG4gICAgICAgIHZhciBuID0gdm9pZCAwO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhLmFyZ3MpKSB7XG4gICAgICAgICAgICBuID0gZGF0YS5mbi5hcHBseShudWxsLCBkYXRhLmFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRhdGEuYXJncykge1xuICAgICAgICAgICAgbiA9IGRhdGEuZm4uY2FsbChudWxsLCBkYXRhLmFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbiA9IGRhdGEuZm4oKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VsZWN0b3IobikgPyBuIDogZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3Rvcih2bm9kZSk7XG59XG5leHBvcnRzLnF1ZXJ5U2VsZWN0b3IgPSB0cmVlX3NlbGVjdG9yXzEuY3JlYXRlUXVlcnlTZWxlY3RvcihvcHRpb25zLCBjdXN0b21NYXRjaGVzKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXJ5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gc2VsZWN0b3JQYXJzZXIobm9kZSkge1xuICAgIGlmICghbm9kZS5zZWwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRhZ05hbWU6ICcnLFxuICAgICAgICAgICAgaWQ6ICcnLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnJyxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIHNlbCA9IG5vZGUuc2VsO1xuICAgIHZhciBoYXNoSWR4ID0gc2VsLmluZGV4T2YoJyMnKTtcbiAgICB2YXIgZG90SWR4ID0gc2VsLmluZGV4T2YoJy4nLCBoYXNoSWR4KTtcbiAgICB2YXIgaGFzaCA9IGhhc2hJZHggPiAwID8gaGFzaElkeCA6IHNlbC5sZW5ndGg7XG4gICAgdmFyIGRvdCA9IGRvdElkeCA+IDAgPyBkb3RJZHggOiBzZWwubGVuZ3RoO1xuICAgIHZhciB0YWdOYW1lID0gaGFzaElkeCAhPT0gLTEgfHwgZG90SWR4ICE9PSAtMSA/XG4gICAgICAgIHNlbC5zbGljZSgwLCBNYXRoLm1pbihoYXNoLCBkb3QpKSA6XG4gICAgICAgIHNlbDtcbiAgICB2YXIgaWQgPSBoYXNoIDwgZG90ID8gc2VsLnNsaWNlKGhhc2ggKyAxLCBkb3QpIDogdm9pZCAwO1xuICAgIHZhciBjbGFzc05hbWUgPSBkb3RJZHggPiAwID8gc2VsLnNsaWNlKGRvdCArIDEpLnJlcGxhY2UoL1xcLi9nLCAnICcpIDogdm9pZCAwO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgIGlkOiBpZCxcbiAgICAgICAgY2xhc3NOYW1lOiBjbGFzc05hbWUsXG4gICAgfTtcbn1cbmV4cG9ydHMuc2VsZWN0b3JQYXJzZXIgPSBzZWxlY3RvclBhcnNlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNlbGVjdG9yUGFyc2VyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcbnZhciBpcyA9IHJlcXVpcmUoXCIuL2lzXCIpO1xuZnVuY3Rpb24gYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCkge1xuICAgIGRhdGEubnMgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICAgIGlmIChzZWwgIT09ICdmb3JlaWduT2JqZWN0JyAmJiBjaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZERhdGEgPSBjaGlsZHJlbltpXS5kYXRhO1xuICAgICAgICAgICAgaWYgKGNoaWxkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYWRkTlMoY2hpbGREYXRhLCBjaGlsZHJlbltpXS5jaGlsZHJlbiwgY2hpbGRyZW5baV0uc2VsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGgoc2VsLCBiLCBjKSB7XG4gICAgdmFyIGRhdGEgPSB7fSwgY2hpbGRyZW4sIHRleHQsIGk7XG4gICAgaWYgKGMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkYXRhID0gYjtcbiAgICAgICAgaWYgKGlzLmFycmF5KGMpKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGMpKSB7XG4gICAgICAgICAgICB0ZXh0ID0gYztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjICYmIGMuc2VsKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtjXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChiICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGlzLmFycmF5KGIpKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGIpKSB7XG4gICAgICAgICAgICB0ZXh0ID0gYjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChiICYmIGIuc2VsKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtiXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSBiO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKGlzLnByaW1pdGl2ZShjaGlsZHJlbltpXSkpXG4gICAgICAgICAgICAgICAgY2hpbGRyZW5baV0gPSB2bm9kZV8xLnZub2RlKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGNoaWxkcmVuW2ldLCB1bmRlZmluZWQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChzZWxbMF0gPT09ICdzJyAmJiBzZWxbMV0gPT09ICd2JyAmJiBzZWxbMl0gPT09ICdnJyAmJlxuICAgICAgICAoc2VsLmxlbmd0aCA9PT0gMyB8fCBzZWxbM10gPT09ICcuJyB8fCBzZWxbM10gPT09ICcjJykpIHtcbiAgICAgICAgYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCk7XG4gICAgfVxuICAgIHJldHVybiB2bm9kZV8xLnZub2RlKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIHVuZGVmaW5lZCk7XG59XG5leHBvcnRzLmggPSBoO1xuO1xuZXhwb3J0cy5kZWZhdWx0ID0gaDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZ05hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2VVUkksIHF1YWxpZmllZE5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSk7XG59XG5mdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh0ZXh0KSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xufVxuZnVuY3Rpb24gY3JlYXRlQ29tbWVudCh0ZXh0KSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQodGV4dCk7XG59XG5mdW5jdGlvbiBpbnNlcnRCZWZvcmUocGFyZW50Tm9kZSwgbmV3Tm9kZSwgcmVmZXJlbmNlTm9kZSkge1xuICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIHJlZmVyZW5jZU5vZGUpO1xufVxuZnVuY3Rpb24gcmVtb3ZlQ2hpbGQobm9kZSwgY2hpbGQpIHtcbiAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZENoaWxkKG5vZGUsIGNoaWxkKSB7XG4gICAgbm9kZS5hcHBlbmRDaGlsZChjaGlsZCk7XG59XG5mdW5jdGlvbiBwYXJlbnROb2RlKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5wYXJlbnROb2RlO1xufVxuZnVuY3Rpb24gbmV4dFNpYmxpbmcobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5leHRTaWJsaW5nO1xufVxuZnVuY3Rpb24gdGFnTmFtZShlbG0pIHtcbiAgICByZXR1cm4gZWxtLnRhZ05hbWU7XG59XG5mdW5jdGlvbiBzZXRUZXh0Q29udGVudChub2RlLCB0ZXh0KSB7XG4gICAgbm9kZS50ZXh0Q29udGVudCA9IHRleHQ7XG59XG5mdW5jdGlvbiBnZXRUZXh0Q29udGVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUudGV4dENvbnRlbnQ7XG59XG5mdW5jdGlvbiBpc0VsZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAxO1xufVxuZnVuY3Rpb24gaXNUZXh0KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMztcbn1cbmZ1bmN0aW9uIGlzQ29tbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDg7XG59XG5leHBvcnRzLmh0bWxEb21BcGkgPSB7XG4gICAgY3JlYXRlRWxlbWVudDogY3JlYXRlRWxlbWVudCxcbiAgICBjcmVhdGVFbGVtZW50TlM6IGNyZWF0ZUVsZW1lbnROUyxcbiAgICBjcmVhdGVUZXh0Tm9kZTogY3JlYXRlVGV4dE5vZGUsXG4gICAgY3JlYXRlQ29tbWVudDogY3JlYXRlQ29tbWVudCxcbiAgICBpbnNlcnRCZWZvcmU6IGluc2VydEJlZm9yZSxcbiAgICByZW1vdmVDaGlsZDogcmVtb3ZlQ2hpbGQsXG4gICAgYXBwZW5kQ2hpbGQ6IGFwcGVuZENoaWxkLFxuICAgIHBhcmVudE5vZGU6IHBhcmVudE5vZGUsXG4gICAgbmV4dFNpYmxpbmc6IG5leHRTaWJsaW5nLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgc2V0VGV4dENvbnRlbnQ6IHNldFRleHRDb250ZW50LFxuICAgIGdldFRleHRDb250ZW50OiBnZXRUZXh0Q29udGVudCxcbiAgICBpc0VsZW1lbnQ6IGlzRWxlbWVudCxcbiAgICBpc1RleHQ6IGlzVGV4dCxcbiAgICBpc0NvbW1lbnQ6IGlzQ29tbWVudCxcbn07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmh0bWxEb21BcGk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1odG1sZG9tYXBpLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5hcnJheSA9IEFycmF5LmlzQXJyYXk7XG5mdW5jdGlvbiBwcmltaXRpdmUocykge1xuICAgIHJldHVybiB0eXBlb2YgcyA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHMgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5wcmltaXRpdmUgPSBwcmltaXRpdmU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4bGlua05TID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnO1xudmFyIHhtbE5TID0gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XG52YXIgY29sb25DaGFyID0gNTg7XG52YXIgeENoYXIgPSAxMjA7XG5mdW5jdGlvbiB1cGRhdGVBdHRycyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIga2V5LCBlbG0gPSB2bm9kZS5lbG0sIG9sZEF0dHJzID0gb2xkVm5vZGUuZGF0YS5hdHRycywgYXR0cnMgPSB2bm9kZS5kYXRhLmF0dHJzO1xuICAgIGlmICghb2xkQXR0cnMgJiYgIWF0dHJzKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZEF0dHJzID09PSBhdHRycylcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZEF0dHJzID0gb2xkQXR0cnMgfHwge307XG4gICAgYXR0cnMgPSBhdHRycyB8fCB7fTtcbiAgICAvLyB1cGRhdGUgbW9kaWZpZWQgYXR0cmlidXRlcywgYWRkIG5ldyBhdHRyaWJ1dGVzXG4gICAgZm9yIChrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgdmFyIGN1ciA9IGF0dHJzW2tleV07XG4gICAgICAgIHZhciBvbGQgPSBvbGRBdHRyc1trZXldO1xuICAgICAgICBpZiAob2xkICE9PSBjdXIpIHtcbiAgICAgICAgICAgIGlmIChjdXIgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgXCJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjdXIgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleS5jaGFyQ29kZUF0KDApICE9PSB4Q2hhcikge1xuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5LmNoYXJDb2RlQXQoMykgPT09IGNvbG9uQ2hhcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWUgeG1sIG5hbWVzcGFjZVxuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlTlMoeG1sTlMsIGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5LmNoYXJDb2RlQXQoNSkgPT09IGNvbG9uQ2hhcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWUgeGxpbmsgbmFtZXNwYWNlXG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGVOUyh4bGlua05TLCBrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gcmVtb3ZlIHJlbW92ZWQgYXR0cmlidXRlc1xuICAgIC8vIHVzZSBgaW5gIG9wZXJhdG9yIHNpbmNlIHRoZSBwcmV2aW91cyBgZm9yYCBpdGVyYXRpb24gdXNlcyBpdCAoLmkuZS4gYWRkIGV2ZW4gYXR0cmlidXRlcyB3aXRoIHVuZGVmaW5lZCB2YWx1ZSlcbiAgICAvLyB0aGUgb3RoZXIgb3B0aW9uIGlzIHRvIHJlbW92ZSBhbGwgYXR0cmlidXRlcyB3aXRoIHZhbHVlID09IHVuZGVmaW5lZFxuICAgIGZvciAoa2V5IGluIG9sZEF0dHJzKSB7XG4gICAgICAgIGlmICghKGtleSBpbiBhdHRycykpIHtcbiAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuYXR0cmlidXRlc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVBdHRycywgdXBkYXRlOiB1cGRhdGVBdHRycyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5hdHRyaWJ1dGVzTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXR0cmlidXRlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIHVwZGF0ZUNsYXNzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBjdXIsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgb2xkQ2xhc3MgPSBvbGRWbm9kZS5kYXRhLmNsYXNzLCBrbGFzcyA9IHZub2RlLmRhdGEuY2xhc3M7XG4gICAgaWYgKCFvbGRDbGFzcyAmJiAha2xhc3MpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkQ2xhc3MgPT09IGtsYXNzKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkQ2xhc3MgPSBvbGRDbGFzcyB8fCB7fTtcbiAgICBrbGFzcyA9IGtsYXNzIHx8IHt9O1xuICAgIGZvciAobmFtZSBpbiBvbGRDbGFzcykge1xuICAgICAgICBpZiAoIWtsYXNzW25hbWVdKSB7XG4gICAgICAgICAgICBlbG0uY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKG5hbWUgaW4ga2xhc3MpIHtcbiAgICAgICAgY3VyID0ga2xhc3NbbmFtZV07XG4gICAgICAgIGlmIChjdXIgIT09IG9sZENsYXNzW25hbWVdKSB7XG4gICAgICAgICAgICBlbG0uY2xhc3NMaXN0W2N1ciA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5jbGFzc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVDbGFzcywgdXBkYXRlOiB1cGRhdGVDbGFzcyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5jbGFzc01vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNsYXNzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIENBUFNfUkVHRVggPSAvW0EtWl0vZztcbmZ1bmN0aW9uIHVwZGF0ZURhdGFzZXQob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGVsbSA9IHZub2RlLmVsbSwgb2xkRGF0YXNldCA9IG9sZFZub2RlLmRhdGEuZGF0YXNldCwgZGF0YXNldCA9IHZub2RlLmRhdGEuZGF0YXNldCwga2V5O1xuICAgIGlmICghb2xkRGF0YXNldCAmJiAhZGF0YXNldClcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGREYXRhc2V0ID09PSBkYXRhc2V0KVxuICAgICAgICByZXR1cm47XG4gICAgb2xkRGF0YXNldCA9IG9sZERhdGFzZXQgfHwge307XG4gICAgZGF0YXNldCA9IGRhdGFzZXQgfHwge307XG4gICAgdmFyIGQgPSBlbG0uZGF0YXNldDtcbiAgICBmb3IgKGtleSBpbiBvbGREYXRhc2V0KSB7XG4gICAgICAgIGlmICghZGF0YXNldFtrZXldKSB7XG4gICAgICAgICAgICBpZiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChrZXkgaW4gZCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZFtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtJyArIGtleS5yZXBsYWNlKENBUFNfUkVHRVgsICctJCYnKS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGtleSBpbiBkYXRhc2V0KSB7XG4gICAgICAgIGlmIChvbGREYXRhc2V0W2tleV0gIT09IGRhdGFzZXRba2V5XSkge1xuICAgICAgICAgICAgaWYgKGQpIHtcbiAgICAgICAgICAgICAgICBkW2tleV0gPSBkYXRhc2V0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdkYXRhLScgKyBrZXkucmVwbGFjZShDQVBTX1JFR0VYLCAnLSQmJykudG9Mb3dlckNhc2UoKSwgZGF0YXNldFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuZGF0YXNldE1vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVEYXRhc2V0LCB1cGRhdGU6IHVwZGF0ZURhdGFzZXQgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuZGF0YXNldE1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGFzZXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB1cGRhdGVQcm9wcyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIga2V5LCBjdXIsIG9sZCwgZWxtID0gdm5vZGUuZWxtLCBvbGRQcm9wcyA9IG9sZFZub2RlLmRhdGEucHJvcHMsIHByb3BzID0gdm5vZGUuZGF0YS5wcm9wcztcbiAgICBpZiAoIW9sZFByb3BzICYmICFwcm9wcylcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRQcm9wcyA9PT0gcHJvcHMpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRQcm9wcyA9IG9sZFByb3BzIHx8IHt9O1xuICAgIHByb3BzID0gcHJvcHMgfHwge307XG4gICAgZm9yIChrZXkgaW4gb2xkUHJvcHMpIHtcbiAgICAgICAgaWYgKCFwcm9wc1trZXldKSB7XG4gICAgICAgICAgICBkZWxldGUgZWxtW2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChrZXkgaW4gcHJvcHMpIHtcbiAgICAgICAgY3VyID0gcHJvcHNba2V5XTtcbiAgICAgICAgb2xkID0gb2xkUHJvcHNba2V5XTtcbiAgICAgICAgaWYgKG9sZCAhPT0gY3VyICYmIChrZXkgIT09ICd2YWx1ZScgfHwgZWxtW2tleV0gIT09IGN1cikpIHtcbiAgICAgICAgICAgIGVsbVtrZXldID0gY3VyO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5wcm9wc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVQcm9wcywgdXBkYXRlOiB1cGRhdGVQcm9wcyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5wcm9wc01vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb3BzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLy8gQmluZGlnIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGxpa2UgdGhpcyBmaXhlcyBhIGJ1ZyBpbiBJRS9FZGdlLiBTZWUgIzM2MCBhbmQgIzQwOS5cbnZhciByYWYgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgKHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpLmJpbmQod2luZG93KSkgfHwgc2V0VGltZW91dDtcbnZhciBuZXh0RnJhbWUgPSBmdW5jdGlvbiAoZm4pIHsgcmFmKGZ1bmN0aW9uICgpIHsgcmFmKGZuKTsgfSk7IH07XG52YXIgcmVmbG93Rm9yY2VkID0gZmFsc2U7XG5mdW5jdGlvbiBzZXROZXh0RnJhbWUob2JqLCBwcm9wLCB2YWwpIHtcbiAgICBuZXh0RnJhbWUoZnVuY3Rpb24gKCkgeyBvYmpbcHJvcF0gPSB2YWw7IH0pO1xufVxuZnVuY3Rpb24gdXBkYXRlU3R5bGUob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGN1ciwgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBvbGRTdHlsZSA9IG9sZFZub2RlLmRhdGEuc3R5bGUsIHN0eWxlID0gdm5vZGUuZGF0YS5zdHlsZTtcbiAgICBpZiAoIW9sZFN0eWxlICYmICFzdHlsZSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRTdHlsZSA9PT0gc3R5bGUpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRTdHlsZSA9IG9sZFN0eWxlIHx8IHt9O1xuICAgIHN0eWxlID0gc3R5bGUgfHwge307XG4gICAgdmFyIG9sZEhhc0RlbCA9ICdkZWxheWVkJyBpbiBvbGRTdHlsZTtcbiAgICBmb3IgKG5hbWUgaW4gb2xkU3R5bGUpIHtcbiAgICAgICAgaWYgKCFzdHlsZVtuYW1lXSkge1xuICAgICAgICAgICAgaWYgKG5hbWVbMF0gPT09ICctJyAmJiBuYW1lWzFdID09PSAnLScpIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcbiAgICAgICAgY3VyID0gc3R5bGVbbmFtZV07XG4gICAgICAgIGlmIChuYW1lID09PSAnZGVsYXllZCcgJiYgc3R5bGUuZGVsYXllZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgbmFtZTIgaW4gc3R5bGUuZGVsYXllZCkge1xuICAgICAgICAgICAgICAgIGN1ciA9IHN0eWxlLmRlbGF5ZWRbbmFtZTJdO1xuICAgICAgICAgICAgICAgIGlmICghb2xkSGFzRGVsIHx8IGN1ciAhPT0gb2xkU3R5bGUuZGVsYXllZFtuYW1lMl0pIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0TmV4dEZyYW1lKGVsbS5zdHlsZSwgbmFtZTIsIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5hbWUgIT09ICdyZW1vdmUnICYmIGN1ciAhPT0gb2xkU3R5bGVbbmFtZV0pIHtcbiAgICAgICAgICAgIGlmIChuYW1lWzBdID09PSAnLScgJiYgbmFtZVsxXSA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIGN1cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBjdXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBhcHBseURlc3Ryb3lTdHlsZSh2bm9kZSkge1xuICAgIHZhciBzdHlsZSwgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBzID0gdm5vZGUuZGF0YS5zdHlsZTtcbiAgICBpZiAoIXMgfHwgIShzdHlsZSA9IHMuZGVzdHJveSkpXG4gICAgICAgIHJldHVybjtcbiAgICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcbiAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gc3R5bGVbbmFtZV07XG4gICAgfVxufVxuZnVuY3Rpb24gYXBwbHlSZW1vdmVTdHlsZSh2bm9kZSwgcm0pIHtcbiAgICB2YXIgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFzIHx8ICFzLnJlbW92ZSkge1xuICAgICAgICBybSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghcmVmbG93Rm9yY2VkKSB7XG4gICAgICAgIGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSkudHJhbnNmb3JtO1xuICAgICAgICByZWZsb3dGb3JjZWQgPSB0cnVlO1xuICAgIH1cbiAgICB2YXIgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBpID0gMCwgY29tcFN0eWxlLCBzdHlsZSA9IHMucmVtb3ZlLCBhbW91bnQgPSAwLCBhcHBsaWVkID0gW107XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGFwcGxpZWQucHVzaChuYW1lKTtcbiAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gc3R5bGVbbmFtZV07XG4gICAgfVxuICAgIGNvbXBTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxtKTtcbiAgICB2YXIgcHJvcHMgPSBjb21wU3R5bGVbJ3RyYW5zaXRpb24tcHJvcGVydHknXS5zcGxpdCgnLCAnKTtcbiAgICBmb3IgKDsgaSA8IHByb3BzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChhcHBsaWVkLmluZGV4T2YocHJvcHNbaV0pICE9PSAtMSlcbiAgICAgICAgICAgIGFtb3VudCsrO1xuICAgIH1cbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGZ1bmN0aW9uIChldikge1xuICAgICAgICBpZiAoZXYudGFyZ2V0ID09PSBlbG0pXG4gICAgICAgICAgICAtLWFtb3VudDtcbiAgICAgICAgaWYgKGFtb3VudCA9PT0gMClcbiAgICAgICAgICAgIHJtKCk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmb3JjZVJlZmxvdygpIHtcbiAgICByZWZsb3dGb3JjZWQgPSBmYWxzZTtcbn1cbmV4cG9ydHMuc3R5bGVNb2R1bGUgPSB7XG4gICAgcHJlOiBmb3JjZVJlZmxvdyxcbiAgICBjcmVhdGU6IHVwZGF0ZVN0eWxlLFxuICAgIHVwZGF0ZTogdXBkYXRlU3R5bGUsXG4gICAgZGVzdHJveTogYXBwbHlEZXN0cm95U3R5bGUsXG4gICAgcmVtb3ZlOiBhcHBseVJlbW92ZVN0eWxlXG59O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5zdHlsZU1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN0eWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcbnZhciBpcyA9IHJlcXVpcmUoXCIuL2lzXCIpO1xudmFyIGh0bWxkb21hcGlfMSA9IHJlcXVpcmUoXCIuL2h0bWxkb21hcGlcIik7XG5mdW5jdGlvbiBpc1VuZGVmKHMpIHsgcmV0dXJuIHMgPT09IHVuZGVmaW5lZDsgfVxuZnVuY3Rpb24gaXNEZWYocykgeyByZXR1cm4gcyAhPT0gdW5kZWZpbmVkOyB9XG52YXIgZW1wdHlOb2RlID0gdm5vZGVfMS5kZWZhdWx0KCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbmZ1bmN0aW9uIHNhbWVWbm9kZSh2bm9kZTEsIHZub2RlMikge1xuICAgIHJldHVybiB2bm9kZTEua2V5ID09PSB2bm9kZTIua2V5ICYmIHZub2RlMS5zZWwgPT09IHZub2RlMi5zZWw7XG59XG5mdW5jdGlvbiBpc1Zub2RlKHZub2RlKSB7XG4gICAgcmV0dXJuIHZub2RlLnNlbCAhPT0gdW5kZWZpbmVkO1xufVxuZnVuY3Rpb24gY3JlYXRlS2V5VG9PbGRJZHgoY2hpbGRyZW4sIGJlZ2luSWR4LCBlbmRJZHgpIHtcbiAgICB2YXIgaSwgbWFwID0ge30sIGtleSwgY2g7XG4gICAgZm9yIChpID0gYmVnaW5JZHg7IGkgPD0gZW5kSWR4OyArK2kpIHtcbiAgICAgICAgY2ggPSBjaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgIGtleSA9IGNoLmtleTtcbiAgICAgICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICBtYXBba2V5XSA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hcDtcbn1cbnZhciBob29rcyA9IFsnY3JlYXRlJywgJ3VwZGF0ZScsICdyZW1vdmUnLCAnZGVzdHJveScsICdwcmUnLCAncG9zdCddO1xudmFyIGhfMSA9IHJlcXVpcmUoXCIuL2hcIik7XG5leHBvcnRzLmggPSBoXzEuaDtcbnZhciB0aHVua18xID0gcmVxdWlyZShcIi4vdGh1bmtcIik7XG5leHBvcnRzLnRodW5rID0gdGh1bmtfMS50aHVuaztcbmZ1bmN0aW9uIGluaXQobW9kdWxlcywgZG9tQXBpKSB7XG4gICAgdmFyIGksIGosIGNicyA9IHt9O1xuICAgIHZhciBhcGkgPSBkb21BcGkgIT09IHVuZGVmaW5lZCA/IGRvbUFwaSA6IGh0bWxkb21hcGlfMS5kZWZhdWx0O1xuICAgIGZvciAoaSA9IDA7IGkgPCBob29rcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjYnNbaG9va3NbaV1dID0gW107XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBtb2R1bGVzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICB2YXIgaG9vayA9IG1vZHVsZXNbal1baG9va3NbaV1dO1xuICAgICAgICAgICAgaWYgKGhvb2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNic1tob29rc1tpXV0ucHVzaChob29rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBlbXB0eU5vZGVBdChlbG0pIHtcbiAgICAgICAgdmFyIGlkID0gZWxtLmlkID8gJyMnICsgZWxtLmlkIDogJyc7XG4gICAgICAgIHZhciBjID0gZWxtLmNsYXNzTmFtZSA/ICcuJyArIGVsbS5jbGFzc05hbWUuc3BsaXQoJyAnKS5qb2luKCcuJykgOiAnJztcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdChhcGkudGFnTmFtZShlbG0pLnRvTG93ZXJDYXNlKCkgKyBpZCArIGMsIHt9LCBbXSwgdW5kZWZpbmVkLCBlbG0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVSbUNiKGNoaWxkRWxtLCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHJtQ2IoKSB7XG4gICAgICAgICAgICBpZiAoLS1saXN0ZW5lcnMgPT09IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50XzEgPSBhcGkucGFyZW50Tm9kZShjaGlsZEVsbSk7XG4gICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudF8xLCBjaGlsZEVsbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsbSh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBpLCBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmluaXQpKSB7XG4gICAgICAgICAgICAgICAgaSh2bm9kZSk7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW4sIHNlbCA9IHZub2RlLnNlbDtcbiAgICAgICAgaWYgKHNlbCA9PT0gJyEnKSB7XG4gICAgICAgICAgICBpZiAoaXNVbmRlZih2bm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIHZub2RlLnRleHQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZub2RlLmVsbSA9IGFwaS5jcmVhdGVDb21tZW50KHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBQYXJzZSBzZWxlY3RvclxuICAgICAgICAgICAgdmFyIGhhc2hJZHggPSBzZWwuaW5kZXhPZignIycpO1xuICAgICAgICAgICAgdmFyIGRvdElkeCA9IHNlbC5pbmRleE9mKCcuJywgaGFzaElkeCk7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IGhhc2hJZHggPiAwID8gaGFzaElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgZG90ID0gZG90SWR4ID4gMCA/IGRvdElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgdGFnID0gaGFzaElkeCAhPT0gLTEgfHwgZG90SWR4ICE9PSAtMSA/IHNlbC5zbGljZSgwLCBNYXRoLm1pbihoYXNoLCBkb3QpKSA6IHNlbDtcbiAgICAgICAgICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBpc0RlZihkYXRhKSAmJiBpc0RlZihpID0gZGF0YS5ucykgPyBhcGkuY3JlYXRlRWxlbWVudE5TKGksIHRhZylcbiAgICAgICAgICAgICAgICA6IGFwaS5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgICAgICAgICBpZiAoaGFzaCA8IGRvdClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdpZCcsIHNlbC5zbGljZShoYXNoICsgMSwgZG90KSk7XG4gICAgICAgICAgICBpZiAoZG90SWR4ID4gMClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdjbGFzcycsIHNlbC5zbGljZShkb3QgKyAxKS5yZXBsYWNlKC9cXC4vZywgJyAnKSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLmNyZWF0ZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMuY3JlYXRlW2ldKGVtcHR5Tm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzLmFycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2ggPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5hcHBlbmRDaGlsZChlbG0sIGNyZWF0ZUVsbShjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IHZub2RlLmRhdGEuaG9vazsgLy8gUmV1c2UgdmFyaWFibGVcbiAgICAgICAgICAgIGlmIChpc0RlZihpKSkge1xuICAgICAgICAgICAgICAgIGlmIChpLmNyZWF0ZSlcbiAgICAgICAgICAgICAgICAgICAgaS5jcmVhdGUoZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKGkuaW5zZXJ0KVxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWUucHVzaCh2bm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2bm9kZS5lbG0gPSBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZub2RlLmVsbTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCB2bm9kZXMsIHN0YXJ0SWR4LCBlbmRJZHgsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICBmb3IgKDsgc3RhcnRJZHggPD0gZW5kSWR4OyArK3N0YXJ0SWR4KSB7XG4gICAgICAgICAgICB2YXIgY2ggPSB2bm9kZXNbc3RhcnRJZHhdO1xuICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKGNoLCBpbnNlcnRlZFZub2RlUXVldWUpLCBiZWZvcmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludm9rZURlc3Ryb3lIb29rKHZub2RlKSB7XG4gICAgICAgIHZhciBpLCBqLCBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmRlc3Ryb3kpKVxuICAgICAgICAgICAgICAgIGkodm5vZGUpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5kZXN0cm95Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgIGNicy5kZXN0cm95W2ldKHZub2RlKTtcbiAgICAgICAgICAgIGlmICh2bm9kZS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHZub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgIGkgPSB2bm9kZS5jaGlsZHJlbltqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT0gbnVsbCAmJiB0eXBlb2YgaSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4KSB7XG4gICAgICAgIGZvciAoOyBzdGFydElkeCA8PSBlbmRJZHg7ICsrc3RhcnRJZHgpIHtcbiAgICAgICAgICAgIHZhciBpXzEgPSB2b2lkIDAsIGxpc3RlbmVycyA9IHZvaWQgMCwgcm0gPSB2b2lkIDAsIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmKGNoLnNlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soY2gpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBjYnMucmVtb3ZlLmxlbmd0aCArIDE7XG4gICAgICAgICAgICAgICAgICAgIHJtID0gY3JlYXRlUm1DYihjaC5lbG0sIGxpc3RlbmVycyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaV8xID0gMDsgaV8xIDwgY2JzLnJlbW92ZS5sZW5ndGg7ICsraV8xKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2JzLnJlbW92ZVtpXzFdKGNoLCBybSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0RlZihpXzEgPSBjaC5kYXRhKSAmJiBpc0RlZihpXzEgPSBpXzEuaG9vaykgJiYgaXNEZWYoaV8xID0gaV8xLnJlbW92ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlfMShjaCwgcm0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudEVsbSwgY2guZWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlQ2hpbGRyZW4ocGFyZW50RWxtLCBvbGRDaCwgbmV3Q2gsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICB2YXIgb2xkU3RhcnRJZHggPSAwLCBuZXdTdGFydElkeCA9IDA7XG4gICAgICAgIHZhciBvbGRFbmRJZHggPSBvbGRDaC5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgb2xkU3RhcnRWbm9kZSA9IG9sZENoWzBdO1xuICAgICAgICB2YXIgb2xkRW5kVm5vZGUgPSBvbGRDaFtvbGRFbmRJZHhdO1xuICAgICAgICB2YXIgbmV3RW5kSWR4ID0gbmV3Q2gubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFswXTtcbiAgICAgICAgdmFyIG5ld0VuZFZub2RlID0gbmV3Q2hbbmV3RW5kSWR4XTtcbiAgICAgICAgdmFyIG9sZEtleVRvSWR4O1xuICAgICAgICB2YXIgaWR4SW5PbGQ7XG4gICAgICAgIHZhciBlbG1Ub01vdmU7XG4gICAgICAgIHZhciBiZWZvcmU7XG4gICAgICAgIHdoaWxlIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggJiYgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICAgICAgICBpZiAob2xkU3RhcnRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdOyAvLyBWbm9kZSBtaWdodCBoYXZlIGJlZW4gbW92ZWQgbGVmdFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob2xkRW5kVm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3U3RhcnRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3RW5kVm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld1N0YXJ0Vm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzYW1lVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtLCBhcGkubmV4dFNpYmxpbmcob2xkRW5kVm5vZGUuZWxtKSk7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZEVuZFZub2RlLmVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChvbGRLZXlUb0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9sZEtleVRvSWR4ID0gY3JlYXRlS2V5VG9PbGRJZHgob2xkQ2gsIG9sZFN0YXJ0SWR4LCBvbGRFbmRJZHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZHhJbk9sZCA9IG9sZEtleVRvSWR4W25ld1N0YXJ0Vm5vZGUua2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoaXNVbmRlZihpZHhJbk9sZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbVRvTW92ZSA9IG9sZENoW2lkeEluT2xkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsbVRvTW92ZS5zZWwgIT09IG5ld1N0YXJ0Vm5vZGUuc2VsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSksIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUoZWxtVG9Nb3ZlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkQ2hbaWR4SW5PbGRdID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGVsbVRvTW92ZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggfHwgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICAgICAgICBpZiAob2xkU3RhcnRJZHggPiBvbGRFbmRJZHgpIHtcbiAgICAgICAgICAgICAgICBiZWZvcmUgPSBuZXdDaFtuZXdFbmRJZHggKyAxXSA9PSBudWxsID8gbnVsbCA6IG5ld0NoW25ld0VuZElkeCArIDFdLmVsbTtcbiAgICAgICAgICAgICAgICBhZGRWbm9kZXMocGFyZW50RWxtLCBiZWZvcmUsIG5ld0NoLCBuZXdTdGFydElkeCwgbmV3RW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgb2xkQ2gsIG9sZFN0YXJ0SWR4LCBvbGRFbmRJZHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBhdGNoVm5vZGUob2xkVm5vZGUsIHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICAgICAgdmFyIGksIGhvb2s7XG4gICAgICAgIGlmIChpc0RlZihpID0gdm5vZGUuZGF0YSkgJiYgaXNEZWYoaG9vayA9IGkuaG9vaykgJiYgaXNEZWYoaSA9IGhvb2sucHJlcGF0Y2gpKSB7XG4gICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVsbSA9IHZub2RlLmVsbSA9IG9sZFZub2RlLmVsbTtcbiAgICAgICAgdmFyIG9sZENoID0gb2xkVm5vZGUuY2hpbGRyZW47XG4gICAgICAgIHZhciBjaCA9IHZub2RlLmNoaWxkcmVuO1xuICAgICAgICBpZiAob2xkVm5vZGUgPT09IHZub2RlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAodm5vZGUuZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnVwZGF0ZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMudXBkYXRlW2ldKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgICAgICBpID0gdm5vZGUuZGF0YS5ob29rO1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkpICYmIGlzRGVmKGkgPSBpLnVwZGF0ZSkpXG4gICAgICAgICAgICAgICAgaShvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1VuZGVmKHZub2RlLnRleHQpKSB7XG4gICAgICAgICAgICBpZiAoaXNEZWYob2xkQ2gpICYmIGlzRGVmKGNoKSkge1xuICAgICAgICAgICAgICAgIGlmIChvbGRDaCAhPT0gY2gpXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUNoaWxkcmVuKGVsbSwgb2xkQ2gsIGNoLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYoY2gpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmKG9sZFZub2RlLnRleHQpKVxuICAgICAgICAgICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICAgICAgICAgICAgYWRkVm5vZGVzKGVsbSwgbnVsbCwgY2gsIDAsIGNoLmxlbmd0aCAtIDEsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0RlZihvbGRDaCkpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVWbm9kZXMoZWxtLCBvbGRDaCwgMCwgb2xkQ2gubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0RlZihvbGRWbm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIGFwaS5zZXRUZXh0Q29udGVudChlbG0sICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvbGRWbm9kZS50ZXh0ICE9PSB2bm9kZS50ZXh0KSB7XG4gICAgICAgICAgICBpZiAoaXNEZWYob2xkQ2gpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKGVsbSwgb2xkQ2gsIDAsIG9sZENoLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgdm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRGVmKGhvb2spICYmIGlzRGVmKGkgPSBob29rLnBvc3RwYXRjaCkpIHtcbiAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gcGF0Y2gob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgICAgIHZhciBpLCBlbG0sIHBhcmVudDtcbiAgICAgICAgdmFyIGluc2VydGVkVm5vZGVRdWV1ZSA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnByZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgIGNicy5wcmVbaV0oKTtcbiAgICAgICAgaWYgKCFpc1Zub2RlKG9sZFZub2RlKSkge1xuICAgICAgICAgICAgb2xkVm5vZGUgPSBlbXB0eU5vZGVBdChvbGRWbm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNhbWVWbm9kZShvbGRWbm9kZSwgdm5vZGUpKSB7XG4gICAgICAgICAgICBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsbSA9IG9sZFZub2RlLmVsbTtcbiAgICAgICAgICAgIHBhcmVudCA9IGFwaS5wYXJlbnROb2RlKGVsbSk7XG4gICAgICAgICAgICBjcmVhdGVFbG0odm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICBpZiAocGFyZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnQsIHZub2RlLmVsbSwgYXBpLm5leHRTaWJsaW5nKGVsbSkpO1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnQsIFtvbGRWbm9kZV0sIDAsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbnNlcnRlZFZub2RlUXVldWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGluc2VydGVkVm5vZGVRdWV1ZVtpXS5kYXRhLmhvb2suaW5zZXJ0KGluc2VydGVkVm5vZGVRdWV1ZVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5wb3N0Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgY2JzLnBvc3RbaV0oKTtcbiAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgIH07XG59XG5leHBvcnRzLmluaXQgPSBpbml0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c25hYmJkb20uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgaF8xID0gcmVxdWlyZShcIi4vaFwiKTtcbmZ1bmN0aW9uIGNvcHlUb1RodW5rKHZub2RlLCB0aHVuaykge1xuICAgIHRodW5rLmVsbSA9IHZub2RlLmVsbTtcbiAgICB2bm9kZS5kYXRhLmZuID0gdGh1bmsuZGF0YS5mbjtcbiAgICB2bm9kZS5kYXRhLmFyZ3MgPSB0aHVuay5kYXRhLmFyZ3M7XG4gICAgdGh1bmsuZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgdGh1bmsuY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcbiAgICB0aHVuay50ZXh0ID0gdm5vZGUudGV4dDtcbiAgICB0aHVuay5lbG0gPSB2bm9kZS5lbG07XG59XG5mdW5jdGlvbiBpbml0KHRodW5rKSB7XG4gICAgdmFyIGN1ciA9IHRodW5rLmRhdGE7XG4gICAgdmFyIHZub2RlID0gY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgY3VyLmFyZ3MpO1xuICAgIGNvcHlUb1RodW5rKHZub2RlLCB0aHVuayk7XG59XG5mdW5jdGlvbiBwcmVwYXRjaChvbGRWbm9kZSwgdGh1bmspIHtcbiAgICB2YXIgaSwgb2xkID0gb2xkVm5vZGUuZGF0YSwgY3VyID0gdGh1bmsuZGF0YTtcbiAgICB2YXIgb2xkQXJncyA9IG9sZC5hcmdzLCBhcmdzID0gY3VyLmFyZ3M7XG4gICAgaWYgKG9sZC5mbiAhPT0gY3VyLmZuIHx8IG9sZEFyZ3MubGVuZ3RoICE9PSBhcmdzLmxlbmd0aCkge1xuICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmspO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChvbGRBcmdzW2ldICE9PSBhcmdzW2ldKSB7XG4gICAgICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmspO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvcHlUb1RodW5rKG9sZFZub2RlLCB0aHVuayk7XG59XG5leHBvcnRzLnRodW5rID0gZnVuY3Rpb24gdGh1bmsoc2VsLCBrZXksIGZuLCBhcmdzKSB7XG4gICAgaWYgKGFyZ3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhcmdzID0gZm47XG4gICAgICAgIGZuID0ga2V5O1xuICAgICAgICBrZXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBoXzEuaChzZWwsIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIGhvb2s6IHsgaW5pdDogaW5pdCwgcHJlcGF0Y2g6IHByZXBhdGNoIH0sXG4gICAgICAgIGZuOiBmbixcbiAgICAgICAgYXJnczogYXJnc1xuICAgIH0pO1xufTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMudGh1bms7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10aHVuay5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcIi4vdm5vZGVcIik7XG52YXIgaHRtbGRvbWFwaV8xID0gcmVxdWlyZShcIi4vaHRtbGRvbWFwaVwiKTtcbmZ1bmN0aW9uIHRvVk5vZGUobm9kZSwgZG9tQXBpKSB7XG4gICAgdmFyIGFwaSA9IGRvbUFwaSAhPT0gdW5kZWZpbmVkID8gZG9tQXBpIDogaHRtbGRvbWFwaV8xLmRlZmF1bHQ7XG4gICAgdmFyIHRleHQ7XG4gICAgaWYgKGFwaS5pc0VsZW1lbnQobm9kZSkpIHtcbiAgICAgICAgdmFyIGlkID0gbm9kZS5pZCA/ICcjJyArIG5vZGUuaWQgOiAnJztcbiAgICAgICAgdmFyIGNuID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2NsYXNzJyk7XG4gICAgICAgIHZhciBjID0gY24gPyAnLicgKyBjbi5zcGxpdCgnICcpLmpvaW4oJy4nKSA6ICcnO1xuICAgICAgICB2YXIgc2VsID0gYXBpLnRhZ05hbWUobm9kZSkudG9Mb3dlckNhc2UoKSArIGlkICsgYztcbiAgICAgICAgdmFyIGF0dHJzID0ge307XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IFtdO1xuICAgICAgICB2YXIgbmFtZV8xO1xuICAgICAgICB2YXIgaSA9IHZvaWQgMCwgbiA9IHZvaWQgMDtcbiAgICAgICAgdmFyIGVsbUF0dHJzID0gbm9kZS5hdHRyaWJ1dGVzO1xuICAgICAgICB2YXIgZWxtQ2hpbGRyZW4gPSBub2RlLmNoaWxkTm9kZXM7XG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBlbG1BdHRycy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIG5hbWVfMSA9IGVsbUF0dHJzW2ldLm5vZGVOYW1lO1xuICAgICAgICAgICAgaWYgKG5hbWVfMSAhPT0gJ2lkJyAmJiBuYW1lXzEgIT09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgICBhdHRyc1tuYW1lXzFdID0gZWxtQXR0cnNbaV0ubm9kZVZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBlbG1DaGlsZHJlbi5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2godG9WTm9kZShlbG1DaGlsZHJlbltpXSwgZG9tQXBpKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdChzZWwsIHsgYXR0cnM6IGF0dHJzIH0sIGNoaWxkcmVuLCB1bmRlZmluZWQsIG5vZGUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChhcGkuaXNUZXh0KG5vZGUpKSB7XG4gICAgICAgIHRleHQgPSBhcGkuZ2V0VGV4dENvbnRlbnQobm9kZSk7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdGV4dCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGFwaS5pc0NvbW1lbnQobm9kZSkpIHtcbiAgICAgICAgdGV4dCA9IGFwaS5nZXRUZXh0Q29udGVudChub2RlKTtcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdCgnIScsIHt9LCBbXSwgdGV4dCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgbm9kZSk7XG4gICAgfVxufVxuZXhwb3J0cy50b1ZOb2RlID0gdG9WTm9kZTtcbmV4cG9ydHMuZGVmYXVsdCA9IHRvVk5vZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10b3Zub2RlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gdm5vZGUoc2VsLCBkYXRhLCBjaGlsZHJlbiwgdGV4dCwgZWxtKSB7XG4gICAgdmFyIGtleSA9IGRhdGEgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGRhdGEua2V5O1xuICAgIHJldHVybiB7IHNlbDogc2VsLCBkYXRhOiBkYXRhLCBjaGlsZHJlbjogY2hpbGRyZW4sXG4gICAgICAgIHRleHQ6IHRleHQsIGVsbTogZWxtLCBrZXk6IGtleSB9O1xufVxuZXhwb3J0cy52bm9kZSA9IHZub2RlO1xuZXhwb3J0cy5kZWZhdWx0ID0gdm5vZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12bm9kZS5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfcG9ueWZpbGwgPSByZXF1aXJlKCcuL3BvbnlmaWxsLmpzJyk7XG5cbnZhciBfcG9ueWZpbGwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcG9ueWZpbGwpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciByb290OyAvKiBnbG9iYWwgd2luZG93ICovXG5cblxuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gc2VsZjtcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IG1vZHVsZTtcbn0gZWxzZSB7XG4gIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxuXG52YXIgcmVzdWx0ID0gKDAsIF9wb255ZmlsbDJbJ2RlZmF1bHQnXSkocm9vdCk7XG5leHBvcnRzWydkZWZhdWx0J10gPSByZXN1bHQ7IiwidmFyIG5leHRUaWNrID0gcmVxdWlyZSgncHJvY2Vzcy9icm93c2VyLmpzJykubmV4dFRpY2s7XG52YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaW1tZWRpYXRlSWRzID0ge307XG52YXIgbmV4dEltbWVkaWF0ZUlkID0gMDtcblxuLy8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcbn07XG5leHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xufTtcbmV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cbmV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHsgdGltZW91dC5jbG9zZSgpOyB9O1xuXG5mdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG4gIHRoaXMuX2lkID0gaWQ7XG4gIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xufVxuVGltZW91dC5wcm90b3R5cGUudW5yZWYgPSBUaW1lb3V0LnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHt9O1xuVGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xufTtcblxuLy8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5leHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcbn07XG5cbmV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcbn07XG5cbmV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcbiAgaWYgKG1zZWNzID49IDApIHtcbiAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG4gICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcbiAgICB9LCBtc2Vjcyk7XG4gIH1cbn07XG5cbi8vIFRoYXQncyBub3QgaG93IG5vZGUuanMgaW1wbGVtZW50cyBpdCBidXQgdGhlIGV4cG9zZWQgYXBpIGlzIHRoZSBzYW1lLlxuZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBmdW5jdGlvbihmbikge1xuICB2YXIgaWQgPSBuZXh0SW1tZWRpYXRlSWQrKztcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGZhbHNlIDogc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIGltbWVkaWF0ZUlkc1tpZF0gPSB0cnVlO1xuXG4gIG5leHRUaWNrKGZ1bmN0aW9uIG9uTmV4dFRpY2soKSB7XG4gICAgaWYgKGltbWVkaWF0ZUlkc1tpZF0pIHtcbiAgICAgIC8vIGZuLmNhbGwoKSBpcyBmYXN0ZXIgc28gd2Ugb3B0aW1pemUgZm9yIHRoZSBjb21tb24gdXNlLWNhc2VcbiAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vY2FsbC1hcHBseS1zZWd1XG4gICAgICBpZiAoYXJncykge1xuICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuLmNhbGwobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyBQcmV2ZW50IGlkcyBmcm9tIGxlYWtpbmdcbiAgICAgIGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUoaWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGlkO1xufTtcblxuZXhwb3J0cy5jbGVhckltbWVkaWF0ZSA9IHR5cGVvZiBjbGVhckltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gY2xlYXJJbW1lZGlhdGUgOiBmdW5jdGlvbihpZCkge1xuICBkZWxldGUgaW1tZWRpYXRlSWRzW2lkXTtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBfX2V4cG9ydChtKSB7XG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAoIWV4cG9ydHMuaGFzT3duUHJvcGVydHkocCkpIGV4cG9ydHNbcF0gPSBtW3BdO1xufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuX19leHBvcnQocmVxdWlyZShcIi4vc2VsZWN0b3JQYXJzZXJcIikpO1xudmFyIG1hdGNoZXNfMSA9IHJlcXVpcmUoXCIuL21hdGNoZXNcIik7XG5leHBvcnRzLmNyZWF0ZU1hdGNoZXMgPSBtYXRjaGVzXzEuY3JlYXRlTWF0Y2hlcztcbnZhciBxdWVyeVNlbGVjdG9yXzEgPSByZXF1aXJlKFwiLi9xdWVyeVNlbGVjdG9yXCIpO1xuZXhwb3J0cy5jcmVhdGVRdWVyeVNlbGVjdG9yID0gcXVlcnlTZWxlY3Rvcl8xLmNyZWF0ZVF1ZXJ5U2VsZWN0b3I7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZShcIi4vc2VsZWN0b3JQYXJzZXJcIik7XG5mdW5jdGlvbiBjcmVhdGVNYXRjaGVzKG9wdHMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gbWF0Y2hlcyhzZWxlY3Rvciwgbm9kZSkge1xuICAgICAgICB2YXIgX2EgPSB0eXBlb2Ygc2VsZWN0b3IgPT09ICdvYmplY3QnID8gc2VsZWN0b3IgOiBzZWxlY3RvclBhcnNlcl8xLnBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpLCB0YWcgPSBfYS50YWcsIGlkID0gX2EuaWQsIGNsYXNzTGlzdCA9IF9hLmNsYXNzTGlzdCwgYXR0cmlidXRlcyA9IF9hLmF0dHJpYnV0ZXMsIG5leHRTZWxlY3RvciA9IF9hLm5leHRTZWxlY3RvciwgcHNldWRvcyA9IF9hLnBzZXVkb3M7XG4gICAgICAgIGlmIChuZXh0U2VsZWN0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYXRjaGVzIGNhbiBvbmx5IHByb2Nlc3Mgc2VsZWN0b3JzIHRoYXQgdGFyZ2V0IGEgc2luZ2xlIGVsZW1lbnQnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGFnICYmIHRhZy50b0xvd2VyQ2FzZSgpICE9PSBvcHRzLnRhZyhub2RlKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlkICYmIGlkICE9PSBvcHRzLmlkKG5vZGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNsYXNzZXMgPSBvcHRzLmNsYXNzTmFtZShub2RlKS5zcGxpdCgnICcpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGNsYXNzZXMuaW5kZXhPZihjbGFzc0xpc3RbaV0pID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICAgICAgdmFyIGF0dHIgPSBvcHRzLmF0dHIobm9kZSwga2V5KTtcbiAgICAgICAgICAgIHZhciB0ID0gYXR0cmlidXRlc1trZXldWzBdO1xuICAgICAgICAgICAgdmFyIHYgPSBhdHRyaWJ1dGVzW2tleV1bMV07XG4gICAgICAgICAgICBpZiAoYXR0ciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQgPT09ICdoYXMnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodCA9PT0gJ2V4YWN0JyAmJiBhdHRyICE9PSB2KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodCAhPT0gJ2V4YWN0Jykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbGwgbm9uLXN0cmluZyB2YWx1ZXMgaGF2ZSB0byBiZSBhbiBleGFjdCBtYXRjaCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ3N0YXJ0c1dpdGgnICYmICFhdHRyLnN0YXJ0c1dpdGgodikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ2VuZHNXaXRoJyAmJiAhYXR0ci5lbmRzV2l0aCh2KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnY29udGFpbnMnICYmIGF0dHIuaW5kZXhPZih2KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ3doaXRlc3BhY2UnICYmIGF0dHIuc3BsaXQoJyAnKS5pbmRleE9mKHYpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnZGFzaCcgJiYgYXR0ci5zcGxpdCgnLScpLmluZGV4T2YodikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwc2V1ZG9zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgX2IgPSBwc2V1ZG9zW2ldLCB0ID0gX2JbMF0sIGRhdGEgPSBfYlsxXTtcbiAgICAgICAgICAgIGlmICh0ID09PSAnY29udGFpbnMnICYmIGRhdGEgIT09IG9wdHMuY29udGVudHMobm9kZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodCA9PT0gJ2VtcHR5JyAmJlxuICAgICAgICAgICAgICAgIChvcHRzLmNvbnRlbnRzKG5vZGUpIHx8IG9wdHMuY2hpbGRyZW4obm9kZSkubGVuZ3RoICE9PSAwKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ID09PSAncm9vdCcgJiYgb3B0cy5wYXJlbnQobm9kZSkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0LmluZGV4T2YoJ2NoaWxkJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFvcHRzLnBhcmVudChub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzaWJsaW5ncyA9IG9wdHMuY2hpbGRyZW4ob3B0cy5wYXJlbnQobm9kZSkpO1xuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnZmlyc3QtY2hpbGQnICYmIHNpYmxpbmdzLmluZGV4T2Yobm9kZSkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ2xhc3QtY2hpbGQnICYmXG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzLmluZGV4T2Yobm9kZSkgIT09IHNpYmxpbmdzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ250aC1jaGlsZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4ID0gLyhbXFwrLV0/KShcXGQqKShuPykoXFwrXFxkKyk/LztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnNlUmVzdWx0ID0gcmVnZXguZXhlYyhkYXRhKS5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gc2libGluZ3MuaW5kZXhPZihub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJzZVJlc3VsdFswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VSZXN1bHRbMF0gPSAnKyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZhY3RvciA9IHBhcnNlUmVzdWx0WzFdXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHBhcnNlSW50KHBhcnNlUmVzdWx0WzBdICsgcGFyc2VSZXN1bHRbMV0pXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFkZCA9IHBhcnNlSW50KHBhcnNlUmVzdWx0WzNdIHx8ICcwJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmYWN0b3IgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUmVzdWx0WzJdID09PSAnbicgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICUgZmFjdG9yICE9PSBhZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICghZmFjdG9yICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVJlc3VsdFsyXSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKChwYXJzZVJlc3VsdFswXSA9PT0gJysnICYmIGluZGV4IC0gYWRkIDwgMCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocGFyc2VSZXN1bHRbMF0gPT09ICctJyAmJiBpbmRleCAtIGFkZCA+PSAwKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICghcGFyc2VSZXN1bHRbMl0gJiYgZmFjdG9yICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCAhPT0gZmFjdG9yIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZU1hdGNoZXMgPSBjcmVhdGVNYXRjaGVzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWF0Y2hlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZShcIi4vc2VsZWN0b3JQYXJzZXJcIik7XG52YXIgbWF0Y2hlc18xID0gcmVxdWlyZShcIi4vbWF0Y2hlc1wiKTtcbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5U2VsZWN0b3Iob3B0aW9ucywgbWF0Y2hlcykge1xuICAgIHZhciBfbWF0Y2hlcyA9IG1hdGNoZXMgfHwgbWF0Y2hlc18xLmNyZWF0ZU1hdGNoZXMob3B0aW9ucyk7XG4gICAgZnVuY3Rpb24gZmluZFN1YnRyZWUoc2VsZWN0b3IsIGRlcHRoLCBub2RlKSB7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuID0gX21hdGNoZXMoc2VsZWN0b3IsIG5vZGUpO1xuICAgICAgICB2YXIgbWF0Y2hlZCA9IG4gPyAodHlwZW9mIG4gPT09ICdvYmplY3QnID8gW25dIDogW25vZGVdKSA6IFtdO1xuICAgICAgICBpZiAoZGVwdGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVkO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjaGlsZE1hdGNoZWQgPSBvcHRpb25zXG4gICAgICAgICAgICAuY2hpbGRyZW4obm9kZSlcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIHR5cGVvZiBjICE9PSAnc3RyaW5nJzsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGZpbmRTdWJ0cmVlKHNlbGVjdG9yLCBkZXB0aCAtIDEsIGMpOyB9KVxuICAgICAgICAgICAgLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBjdXJyKSB7IHJldHVybiBhY2MuY29uY2F0KGN1cnIpOyB9LCBbXSk7XG4gICAgICAgIHJldHVybiBtYXRjaGVkLmNvbmNhdChjaGlsZE1hdGNoZWQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmaW5kU2libGluZyhzZWxlY3RvciwgbmV4dCwgbm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUgfHwgb3B0aW9ucy5wYXJlbnQobm9kZSkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgIHZhciBzaWJsaW5ncyA9IG9wdGlvbnMuY2hpbGRyZW4ob3B0aW9ucy5wYXJlbnQobm9kZSkpO1xuICAgICAgICBmb3IgKHZhciBpID0gc2libGluZ3MuaW5kZXhPZihub2RlKSArIDE7IGkgPCBzaWJsaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzaWJsaW5nc1tpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuID0gX21hdGNoZXMoc2VsZWN0b3IsIHNpYmxpbmdzW2ldKTtcbiAgICAgICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goc2libGluZ3NbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yLCBub2RlKSB7XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzZWwgPSB0eXBlb2Ygc2VsZWN0b3IgPT09ICdvYmplY3QnID8gc2VsZWN0b3IgOiBzZWxlY3RvclBhcnNlcl8xLnBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtub2RlXTtcbiAgICAgICAgdmFyIGN1cnJlbnRTZWxlY3RvciA9IHNlbDtcbiAgICAgICAgdmFyIGN1cnJlbnRDb21iaW5hdG9yID0gJ3N1YnRyZWUnO1xuICAgICAgICB2YXIgdGFpbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIF9sb29wXzEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YWlsID0gY3VycmVudFNlbGVjdG9yLm5leHRTZWxlY3RvcjtcbiAgICAgICAgICAgIGN1cnJlbnRTZWxlY3Rvci5uZXh0U2VsZWN0b3IgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoY3VycmVudENvbWJpbmF0b3IgPT09ICdzdWJ0cmVlJyB8fFxuICAgICAgICAgICAgICAgIGN1cnJlbnRDb21iaW5hdG9yID09PSAnY2hpbGQnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlcHRoXzEgPSBjdXJyZW50Q29tYmluYXRvciA9PT0gJ3N1YnRyZWUnID8gSW5maW5pdHkgOiAxO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG4pIHsgcmV0dXJuIGZpbmRTdWJ0cmVlKGN1cnJlbnRTZWxlY3RvciwgZGVwdGhfMSwgbik7IH0pXG4gICAgICAgICAgICAgICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgY3VycikgeyByZXR1cm4gYWNjLmNvbmNhdChjdXJyKTsgfSwgW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRfMSA9IGN1cnJlbnRDb21iaW5hdG9yID09PSAnbmV4dFNpYmxpbmcnO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG4pIHsgcmV0dXJuIGZpbmRTaWJsaW5nKGN1cnJlbnRTZWxlY3RvciwgbmV4dF8xLCBuKTsgfSlcbiAgICAgICAgICAgICAgICAgICAgLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBjdXJyKSB7IHJldHVybiBhY2MuY29uY2F0KGN1cnIpOyB9LCBbXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGFpbCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRTZWxlY3RvciA9IHRhaWxbMV07XG4gICAgICAgICAgICAgICAgY3VycmVudENvbWJpbmF0b3IgPSB0YWlsWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBfbG9vcF8xKCk7XG4gICAgICAgIH0gd2hpbGUgKHRhaWwgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZVF1ZXJ5U2VsZWN0b3IgPSBjcmVhdGVRdWVyeVNlbGVjdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cXVlcnlTZWxlY3Rvci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIElERU5UID0gJ1tcXFxcdy1dKyc7XG52YXIgU1BBQ0UgPSAnWyBcXHRdKic7XG52YXIgVkFMVUUgPSBcIlteXFxcXF1dK1wiO1xudmFyIENMQVNTID0gXCIoPzpcXFxcLlwiICsgSURFTlQgKyBcIilcIjtcbnZhciBJRCA9IFwiKD86I1wiICsgSURFTlQgKyBcIilcIjtcbnZhciBPUCA9IFwiKD86PXxcXFxcJD18XFxcXF49fFxcXFwqPXx+PXxcXFxcfD0pXCI7XG52YXIgQVRUUiA9IFwiKD86XFxcXFtcIiArIFNQQUNFICsgSURFTlQgKyBTUEFDRSArIFwiKD86XCIgKyBPUCArIFNQQUNFICsgVkFMVUUgKyBTUEFDRSArIFwiKT9cXFxcXSlcIjtcbnZhciBTVUJUUkVFID0gXCIoPzpbIFxcdF0rKVwiO1xudmFyIENISUxEID0gXCIoPzpcIiArIFNQQUNFICsgXCIoPilcIiArIFNQQUNFICsgXCIpXCI7XG52YXIgTkVYVF9TSUJMSU5HID0gXCIoPzpcIiArIFNQQUNFICsgXCIoXFxcXCspXCIgKyBTUEFDRSArIFwiKVwiO1xudmFyIFNJQkxJTkcgPSBcIig/OlwiICsgU1BBQ0UgKyBcIih+KVwiICsgU1BBQ0UgKyBcIilcIjtcbnZhciBDT01CSU5BVE9SID0gXCIoPzpcIiArIFNVQlRSRUUgKyBcInxcIiArIENISUxEICsgXCJ8XCIgKyBORVhUX1NJQkxJTkcgKyBcInxcIiArIFNJQkxJTkcgKyBcIilcIjtcbnZhciBDT05UQUlOUyA9IFwiY29udGFpbnNcXFxcKFxcXCJbXlxcXCJdKlxcXCJcXFxcKVwiO1xudmFyIEZPUk1VTEEgPSBcIig/OmV2ZW58b2RkfFxcXFxkKig/Oi0/big/OlxcXFwrXFxcXGQrKT8pPylcIjtcbnZhciBOVEhfQ0hJTEQgPSBcIm50aC1jaGlsZFxcXFwoXCIgKyBGT1JNVUxBICsgXCJcXFxcKVwiO1xudmFyIFBTRVVETyA9IFwiOig/OmZpcnN0LWNoaWxkfGxhc3QtY2hpbGR8XCIgKyBOVEhfQ0hJTEQgKyBcInxlbXB0eXxyb290fFwiICsgQ09OVEFJTlMgKyBcIilcIjtcbnZhciBUQUcgPSBcIig6P1wiICsgSURFTlQgKyBcIik/XCI7XG52YXIgVE9LRU5TID0gQ0xBU1MgKyBcInxcIiArIElEICsgXCJ8XCIgKyBBVFRSICsgXCJ8XCIgKyBQU0VVRE8gKyBcInxcIiArIENPTUJJTkFUT1I7XG52YXIgY29tYmluYXRvclJlZ2V4ID0gbmV3IFJlZ0V4cChcIl5cIiArIENPTUJJTkFUT1IgKyBcIiRcIik7XG4vKipcbiAqIFBhcnNlcyBhIGNzcyBzZWxlY3RvciBpbnRvIGEgbm9ybWFsaXplZCBvYmplY3QuXG4gKiBFeHBlY3RzIGEgc2VsZWN0b3IgZm9yIGEgc2luZ2xlIGVsZW1lbnQgb25seSwgbm8gYD5gIG9yIHRoZSBsaWtlIVxuICovXG5mdW5jdGlvbiBwYXJzZVNlbGVjdG9yKHNlbGVjdG9yKSB7XG4gICAgdmFyIHNlbCA9IHNlbGVjdG9yLnRyaW0oKTtcbiAgICB2YXIgdGFnUmVnZXggPSBuZXcgUmVnRXhwKFRBRywgJ3knKTtcbiAgICB2YXIgdGFnID0gdGFnUmVnZXguZXhlYyhzZWwpWzBdO1xuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoVE9LRU5TLCAneScpO1xuICAgIHJlZ2V4Lmxhc3RJbmRleCA9IHRhZ1JlZ2V4Lmxhc3RJbmRleDtcbiAgICB2YXIgbWF0Y2hlcyA9IFtdO1xuICAgIHZhciBuZXh0U2VsZWN0b3IgPSB1bmRlZmluZWQ7XG4gICAgdmFyIGxhc3RDb21iaW5hdG9yID0gdW5kZWZpbmVkO1xuICAgIHZhciBpbmRleCA9IC0xO1xuICAgIHdoaWxlIChyZWdleC5sYXN0SW5kZXggPCBzZWwubGVuZ3RoKSB7XG4gICAgICAgIHZhciBtYXRjaCA9IHJlZ2V4LmV4ZWMoc2VsKTtcbiAgICAgICAgaWYgKCFtYXRjaCAmJiBsYXN0Q29tYmluYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlIGVycm9yLCBpbnZhbGlkIHNlbGVjdG9yJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobWF0Y2ggJiYgY29tYmluYXRvclJlZ2V4LnRlc3QobWF0Y2hbMF0pKSB7XG4gICAgICAgICAgICB2YXIgY29tYiA9IGNvbWJpbmF0b3JSZWdleC5leGVjKG1hdGNoWzBdKVswXTtcbiAgICAgICAgICAgIGxhc3RDb21iaW5hdG9yID0gY29tYjtcbiAgICAgICAgICAgIGluZGV4ID0gcmVnZXgubGFzdEluZGV4O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKGxhc3RDb21iaW5hdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBuZXh0U2VsZWN0b3IgPSBbXG4gICAgICAgICAgICAgICAgICAgIGdldENvbWJpbmF0b3IobGFzdENvbWJpbmF0b3IpLFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdG9yKHNlbC5zdWJzdHJpbmcoaW5kZXgpKVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtYXRjaGVzLnB1c2gobWF0Y2hbMF0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBjbGFzc0xpc3QgPSBtYXRjaGVzXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3RhcnRzV2l0aCgnLicpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN1YnN0cmluZygxKTsgfSk7XG4gICAgdmFyIGlkcyA9IG1hdGNoZXMuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN0YXJ0c1dpdGgoJyMnKTsgfSkubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN1YnN0cmluZygxKTsgfSk7XG4gICAgaWYgKGlkcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzZWxlY3Rvciwgb25seSBvbmUgaWQgaXMgYWxsb3dlZCcpO1xuICAgIH1cbiAgICB2YXIgcG9zdHByb2Nlc3NSZWdleCA9IG5ldyBSZWdFeHAoXCIoXCIgKyBJREVOVCArIFwiKVwiICsgU1BBQ0UgKyBcIihcIiArIE9QICsgXCIpP1wiICsgU1BBQ0UgKyBcIihcIiArIFZBTFVFICsgXCIpP1wiKTtcbiAgICB2YXIgYXR0cnMgPSBtYXRjaGVzXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3RhcnRzV2l0aCgnWycpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBwb3N0cHJvY2Vzc1JlZ2V4LmV4ZWMocykuc2xpY2UoMSwgNCk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBhdHRyID0gX2FbMF0sIG9wID0gX2FbMV0sIHZhbCA9IF9hWzJdO1xuICAgICAgICB2YXIgX2I7XG4gICAgICAgIHJldHVybiAoX2IgPSB7fSxcbiAgICAgICAgICAgIF9iW2F0dHJdID0gW2dldE9wKG9wKSwgdmFsID8gcGFyc2VBdHRyVmFsdWUodmFsKSA6IHZhbF0sXG4gICAgICAgICAgICBfYik7XG4gICAgfSlcbiAgICAgICAgLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBjdXJyKSB7IHJldHVybiAoX19hc3NpZ24oe30sIGFjYywgY3VycikpOyB9LCB7fSk7XG4gICAgdmFyIHBzZXVkb3MgPSBtYXRjaGVzXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3RhcnRzV2l0aCgnOicpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBwb3N0UHJvY2Vzc1BzZXVkb3Mocy5zdWJzdHJpbmcoMSkpOyB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBpZDogaWRzWzBdIHx8ICcnLFxuICAgICAgICB0YWc6IHRhZyxcbiAgICAgICAgY2xhc3NMaXN0OiBjbGFzc0xpc3QsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJzLFxuICAgICAgICBuZXh0U2VsZWN0b3I6IG5leHRTZWxlY3RvcixcbiAgICAgICAgcHNldWRvczogcHNldWRvc1xuICAgIH07XG59XG5leHBvcnRzLnBhcnNlU2VsZWN0b3IgPSBwYXJzZVNlbGVjdG9yO1xuZnVuY3Rpb24gcGFyc2VBdHRyVmFsdWUodikge1xuICAgIGlmICh2LnN0YXJ0c1dpdGgoJ1wiJykpIHtcbiAgICAgICAgcmV0dXJuIHYuc2xpY2UoMSwgLTEpO1xuICAgIH1cbiAgICBpZiAodiA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh2ID09PSBcImZhbHNlXCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgZiA9IHBhcnNlRmxvYXQodik7XG4gICAgaWYgKGlzTmFOKGYpKSB7XG4gICAgICAgIHJldHVybiB2O1xuICAgIH1cbiAgICByZXR1cm4gZjtcbn1cbmZ1bmN0aW9uIHBvc3RQcm9jZXNzUHNldWRvcyhzZWwpIHtcbiAgICBpZiAoc2VsID09PSAnZmlyc3QtY2hpbGQnIHx8XG4gICAgICAgIHNlbCA9PT0gJ2xhc3QtY2hpbGQnIHx8XG4gICAgICAgIHNlbCA9PT0gJ3Jvb3QnIHx8XG4gICAgICAgIHNlbCA9PT0gJ2VtcHR5Jykge1xuICAgICAgICByZXR1cm4gW3NlbCwgdW5kZWZpbmVkXTtcbiAgICB9XG4gICAgaWYgKHNlbC5zdGFydHNXaXRoKCdjb250YWlucycpKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gc2VsLnNsaWNlKDEwLCAtMik7XG4gICAgICAgIHJldHVybiBbJ2NvbnRhaW5zJywgdGV4dF07XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gc2VsLnNsaWNlKDEwLCAtMSk7XG4gICAgaWYgKGNvbnRlbnQgPT09ICdldmVuJykge1xuICAgICAgICBjb250ZW50ID0gJzJuJztcbiAgICB9XG4gICAgaWYgKGNvbnRlbnQgPT09ICdvZGQnKSB7XG4gICAgICAgIGNvbnRlbnQgPSAnMm4rMSc7XG4gICAgfVxuICAgIHJldHVybiBbJ250aC1jaGlsZCcsIGNvbnRlbnRdO1xufVxuZnVuY3Rpb24gZ2V0T3Aob3ApIHtcbiAgICBzd2l0Y2ggKG9wKSB7XG4gICAgICAgIGNhc2UgJz0nOlxuICAgICAgICAgICAgcmV0dXJuICdleGFjdCc7XG4gICAgICAgIGNhc2UgJ149JzpcbiAgICAgICAgICAgIHJldHVybiAnc3RhcnRzV2l0aCc7XG4gICAgICAgIGNhc2UgJyQ9JzpcbiAgICAgICAgICAgIHJldHVybiAnZW5kc1dpdGgnO1xuICAgICAgICBjYXNlICcqPSc6XG4gICAgICAgICAgICByZXR1cm4gJ2NvbnRhaW5zJztcbiAgICAgICAgY2FzZSAnfj0nOlxuICAgICAgICAgICAgcmV0dXJuICd3aGl0ZXNwYWNlJztcbiAgICAgICAgY2FzZSAnfD0nOlxuICAgICAgICAgICAgcmV0dXJuICdkYXNoJztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAnaGFzJztcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRDb21iaW5hdG9yKGNvbWIpIHtcbiAgICBzd2l0Y2ggKGNvbWIudHJpbSgpKSB7XG4gICAgICAgIGNhc2UgJz4nOlxuICAgICAgICAgICAgcmV0dXJuICdjaGlsZCc7XG4gICAgICAgIGNhc2UgJysnOlxuICAgICAgICAgICAgcmV0dXJuICduZXh0U2libGluZyc7XG4gICAgICAgIGNhc2UgJ34nOlxuICAgICAgICAgICAgcmV0dXJuICdzaWJsaW5nJztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAnc3VidHJlZSc7XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2VsZWN0b3JQYXJzZXIuanMubWFwIiwiaW1wb3J0IHtTdHJlYW0sIEludGVybmFsUHJvZHVjZXIsIEludGVybmFsTGlzdGVuZXIsIE91dFNlbmRlcn0gZnJvbSAnLi4vaW5kZXgnO1xuXG5jbGFzcyBDb25jYXRQcm9kdWNlcjxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4sIEludGVybmFsTGlzdGVuZXI8VD4sIE91dFNlbmRlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2NvbmNhdCc7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPiA9IG51bGwgYXMgYW55O1xuICBwcml2YXRlIGk6IG51bWJlciA9IDA7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHN0cmVhbXM6IEFycmF5PFN0cmVhbTxUPj4pIHtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuc3RyZWFtc1t0aGlzLmldLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzdHJlYW1zID0gdGhpcy5zdHJlYW1zO1xuICAgIGlmICh0aGlzLmkgPCBzdHJlYW1zLmxlbmd0aCkge1xuICAgICAgc3RyZWFtc1t0aGlzLmldLl9yZW1vdmUodGhpcyk7XG4gICAgfVxuICAgIHRoaXMuaSA9IDA7XG4gICAgdGhpcy5vdXQgPSBudWxsIGFzIGFueTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICBjb25zdCBzdHJlYW1zID0gdGhpcy5zdHJlYW1zO1xuICAgIHN0cmVhbXNbdGhpcy5pXS5fcmVtb3ZlKHRoaXMpO1xuICAgIGlmICgrK3RoaXMuaSA8IHN0cmVhbXMubGVuZ3RoKSB7XG4gICAgICBzdHJlYW1zW3RoaXMuaV0uX2FkZCh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdS5fYygpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFB1dHMgb25lIHN0cmVhbSBhZnRlciB0aGUgb3RoZXIuICpjb25jYXQqIGlzIGEgZmFjdG9yeSB0aGF0IHRha2VzIG11bHRpcGxlXG4gKiBzdHJlYW1zIGFzIGFyZ3VtZW50cywgYW5kIHN0YXJ0cyB0aGUgYG4rMWAtdGggc3RyZWFtIG9ubHkgd2hlbiB0aGUgYG5gLXRoXG4gKiBzdHJlYW0gaGFzIGNvbXBsZXRlZC4gSXQgY29uY2F0ZW5hdGVzIHRob3NlIHN0cmVhbXMgdG9nZXRoZXIuXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0yLS0tMy0tLTQtfFxuICogLi4uLi4uLi4uLi4uLi4uLS1hLWItYy0tZC18XG4gKiAgICAgICAgICAgY29uY2F0XG4gKiAtLTEtLTItLS0zLS0tNC0tLWEtYi1jLS1kLXxcbiAqIGBgYFxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBjb25jYXQgZnJvbSAneHN0cmVhbS9leHRyYS9jb25jYXQnXG4gKlxuICogY29uc3Qgc3RyZWFtQSA9IHhzLm9mKCdhJywgJ2InLCAnYycpXG4gKiBjb25zdCBzdHJlYW1CID0geHMub2YoMTAsIDIwLCAzMClcbiAqIGNvbnN0IHN0cmVhbUMgPSB4cy5vZignWCcsICdZJywgJ1onKVxuICpcbiAqIGNvbnN0IG91dHB1dFN0cmVhbSA9IGNvbmNhdChzdHJlYW1BLCBzdHJlYW1CLCBzdHJlYW1DKVxuICpcbiAqIG91dHB1dFN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6ICh4KSA9PiBjb25zb2xlLmxvZyh4KSxcbiAqICAgZXJyb3I6IChlcnIpID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb25jYXQgY29tcGxldGVkJyksXG4gKiB9KVxuICogYGBgXG4gKlxuICogQGZhY3RvcnkgdHJ1ZVxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gY29uY2F0ZW5hdGUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTIgQSBzdHJlYW0gdG8gY29uY2F0ZW5hdGUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLiBUd29cbiAqIG9yIG1vcmUgc3RyZWFtcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb25jYXQ8VD4oLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPFQ+Pik6IFN0cmVhbTxUPiB7XG4gIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBDb25jYXRQcm9kdWNlcihzdHJlYW1zKSk7XG59XG4iLCJpbXBvcnQge09wZXJhdG9yLCBTdHJlYW19IGZyb20gJy4uL2luZGV4JztcblxuY2xhc3MgRGVsYXlPcGVyYXRvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZGVsYXknO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD4gPSBudWxsIGFzIGFueTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgZHQ6IG51bWJlcixcbiAgICAgICAgICAgICAgcHVibGljIGluczogU3RyZWFtPFQ+KSB7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IG51bGwgYXMgYW55O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHUuX24odCk7XG4gICAgICBjbGVhckludGVydmFsKGlkKTtcbiAgICB9LCB0aGlzLmR0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdS5fZShlcnIpO1xuICAgICAgY2xlYXJJbnRlcnZhbChpZCk7XG4gICAgfSwgdGhpcy5kdCk7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB1Ll9jKCk7XG4gICAgICBjbGVhckludGVydmFsKGlkKTtcbiAgICB9LCB0aGlzLmR0KTtcbiAgfVxufVxuXG4vKipcbiAqIERlbGF5cyBwZXJpb2RpYyBldmVudHMgYnkgYSBnaXZlbiB0aW1lIHBlcmlvZC5cbiAqXG4gKiBNYXJibGUgZGlhZ3JhbTpcbiAqXG4gKiBgYGB0ZXh0XG4gKiAxLS0tLTItLTMtLTQtLS0tNXxcbiAqICAgICBkZWxheSg2MClcbiAqIC0tLTEtLS0tMi0tMy0tNC0tLS01fFxuICogYGBgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21EaWFncmFtIGZyb20gJ3hzdHJlYW0vZXh0cmEvZnJvbURpYWdyYW0nXG4gKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRGlhZ3JhbSgnMS0tLS0yLS0zLS00LS0tLTV8JylcbiAqICAuY29tcG9zZShkZWxheSg2MCkpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IDEgIChhZnRlciA2MCBtcylcbiAqID4gMiAgKGFmdGVyIDE2MCBtcylcbiAqID4gMyAgKGFmdGVyIDIyMCBtcylcbiAqID4gNCAgKGFmdGVyIDI4MCBtcylcbiAqID4gNSAgKGFmdGVyIDM4MCBtcylcbiAqID4gY29tcGxldGVkXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gcGVyaW9kIFRoZSBhbW91bnQgb2Ygc2lsZW5jZSByZXF1aXJlZCBpbiBtaWxsaXNlY29uZHMuXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRlbGF5PFQ+KHBlcmlvZDogbnVtYmVyKTogKGluczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08VD4ge1xuICByZXR1cm4gZnVuY3Rpb24gZGVsYXlPcGVyYXRvcihpbnM6IFN0cmVhbTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERlbGF5T3BlcmF0b3IocGVyaW9kLCBpbnMpKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7SW50ZXJuYWxMaXN0ZW5lciwgT3BlcmF0b3IsIFN0cmVhbX0gZnJvbSAnLi4vaW5kZXgnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNhbXBsZUNvbWJpbmVTaWduYXR1cmUge1xuICAoKTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtUXT47XG4gIDxUMT4oczE6IFN0cmVhbTxUMT4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxXT47XG4gIDxUMSwgVDI+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDJdPjtcbiAgPFQxLCBUMiwgVDM+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzXT47XG4gIDxUMSwgVDIsIFQzLCBUND4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDMsIFQ0XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDU+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzLCBUNCwgVDVdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDY+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDg+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDhdPjtcbiAgKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pik6IChzOiBTdHJlYW08YW55PikgPT4gU3RyZWFtPEFycmF5PGFueT4+O1xufVxuXG5jb25zdCBOTyA9IHt9O1xuXG5leHBvcnQgY2xhc3MgU2FtcGxlQ29tYmluZUxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaTogbnVtYmVyLCBwcml2YXRlIHA6IFNhbXBsZUNvbWJpbmVPcGVyYXRvcjxhbnk+KSB7XG4gICAgcC5pbHNbaV0gPSB0aGlzO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLnA7XG4gICAgaWYgKHAub3V0ID09PSBOTykgcmV0dXJuO1xuICAgIHAudXAodCwgdGhpcy5pKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KTogdm9pZCB7XG4gICAgdGhpcy5wLl9lKGVycik7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICB0aGlzLnAuZG93bih0aGlzLmksIHRoaXMpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTYW1wbGVDb21iaW5lT3BlcmF0b3I8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBBcnJheTxhbnk+PiB7XG4gIHB1YmxpYyB0eXBlID0gJ3NhbXBsZUNvbWJpbmUnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdGhlcnM6IEFycmF5PFN0cmVhbTxhbnk+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPEFycmF5PGFueT4+O1xuICBwdWJsaWMgaWxzOiBBcnJheTxTYW1wbGVDb21iaW5lTGlzdGVuZXI8YW55Pj47XG4gIHB1YmxpYyBObjogbnVtYmVyOyAvLyAqTip1bWJlciBvZiBzdHJlYW1zIHN0aWxsIHRvIHNlbmQgKm4qZXh0XG4gIHB1YmxpYyB2YWxzOiBBcnJheTxhbnk+O1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBzdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm90aGVycyA9IHN0cmVhbXM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8YW55Pj47XG4gICAgdGhpcy5pbHMgPSBbXTtcbiAgICB0aGlzLk5uID0gMDtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxBcnJheTxhbnk+Pik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIGNvbnN0IHMgPSB0aGlzLm90aGVycztcbiAgICBjb25zdCBuID0gdGhpcy5ObiA9IHMubGVuZ3RoO1xuICAgIGNvbnN0IHZhbHMgPSB0aGlzLnZhbHMgPSBuZXcgQXJyYXkobik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIHZhbHNbaV0gPSBOTztcbiAgICAgIHNbaV0uX2FkZChuZXcgU2FtcGxlQ29tYmluZUxpc3RlbmVyPGFueT4oaSwgdGhpcykpO1xuICAgIH1cbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMub3RoZXJzO1xuICAgIGNvbnN0IG4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCBpbHMgPSB0aGlzLmlscztcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICBzW2ldLl9yZW1vdmUoaWxzW2ldKTtcbiAgICB9XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8YW55Pj47XG4gICAgdGhpcy52YWxzID0gW107XG4gICAgdGhpcy5pbHMgPSBbXTtcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICh0aGlzLk5uID4gMCkgcmV0dXJuO1xuICAgIG91dC5fbihbdCwgLi4udGhpcy52YWxzXSk7XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgb3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIG91dC5fYygpO1xuICB9XG5cbiAgdXAodDogYW55LCBpOiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCB2ID0gdGhpcy52YWxzW2ldO1xuICAgIGlmICh0aGlzLk5uID4gMCAmJiB2ID09PSBOTykge1xuICAgICAgdGhpcy5Obi0tO1xuICAgIH1cbiAgICB0aGlzLnZhbHNbaV0gPSB0O1xuICB9XG5cbiAgZG93bihpOiBudW1iZXIsIGw6IFNhbXBsZUNvbWJpbmVMaXN0ZW5lcjxhbnk+KTogdm9pZCB7XG4gICAgdGhpcy5vdGhlcnNbaV0uX3JlbW92ZShsKTtcbiAgfVxufVxuXG5sZXQgc2FtcGxlQ29tYmluZTogU2FtcGxlQ29tYmluZVNpZ25hdHVyZTtcblxuLyoqXG4gKlxuICogQ29tYmluZXMgYSBzb3VyY2Ugc3RyZWFtIHdpdGggbXVsdGlwbGUgb3RoZXIgc3RyZWFtcy4gVGhlIHJlc3VsdCBzdHJlYW1cbiAqIHdpbGwgZW1pdCB0aGUgbGF0ZXN0IGV2ZW50cyBmcm9tIGFsbCBpbnB1dCBzdHJlYW1zLCBidXQgb25seSB3aGVuIHRoZVxuICogc291cmNlIHN0cmVhbSBlbWl0cy5cbiAqXG4gKiBJZiB0aGUgc291cmNlLCBvciBhbnkgaW5wdXQgc3RyZWFtLCB0aHJvd3MgYW4gZXJyb3IsIHRoZSByZXN1bHQgc3RyZWFtXG4gKiB3aWxsIHByb3BhZ2F0ZSB0aGUgZXJyb3IuIElmIGFueSBpbnB1dCBzdHJlYW1zIGVuZCwgdGhlaXIgZmluYWwgZW1pdHRlZFxuICogdmFsdWUgd2lsbCByZW1haW4gaW4gdGhlIGFycmF5IG9mIGFueSBzdWJzZXF1ZW50IGV2ZW50cyBmcm9tIHRoZSByZXN1bHRcbiAqIHN0cmVhbS5cbiAqXG4gKiBUaGUgcmVzdWx0IHN0cmVhbSB3aWxsIG9ubHkgY29tcGxldGUgdXBvbiBjb21wbGV0aW9uIG9mIHRoZSBzb3VyY2Ugc3RyZWFtLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tIChzb3VyY2UpXG4gKiAtLS0tYS0tLS0tYi0tLS0tYy0tZC0tLS0tLSAob3RoZXIpXG4gKiAgICAgIHNhbXBsZUNvbWJpbmVcbiAqIC0tLS0tLS0yYS0tLS0zYi0tLS0tLS00ZC0tXG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IHNhbXBsZUNvbWJpbmUgZnJvbSAneHN0cmVhbS9leHRyYS9zYW1wbGVDb21iaW5lJ1xuICogaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nXG4gKlxuICogY29uc3Qgc2FtcGxlciA9IHhzLnBlcmlvZGljKDEwMDApLnRha2UoMylcbiAqIGNvbnN0IG90aGVyID0geHMucGVyaW9kaWMoMTAwKVxuICpcbiAqIGNvbnN0IHN0cmVhbSA9IHNhbXBsZXIuY29tcG9zZShzYW1wbGVDb21iaW5lKG90aGVyKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gWzAsIDhdXG4gKiA+IFsxLCAxOF1cbiAqID4gWzIsIDI4XVxuICogYGBgXG4gKlxuICogYGBganNcbiAqIGltcG9ydCBzYW1wbGVDb21iaW5lIGZyb20gJ3hzdHJlYW0vZXh0cmEvc2FtcGxlQ29tYmluZSdcbiAqIGltcG9ydCB4cyBmcm9tICd4c3RyZWFtJ1xuICpcbiAqIGNvbnN0IHNhbXBsZXIgPSB4cy5wZXJpb2RpYygxMDAwKS50YWtlKDMpXG4gKiBjb25zdCBvdGhlciA9IHhzLnBlcmlvZGljKDEwMCkudGFrZSgyKVxuICpcbiAqIGNvbnN0IHN0cmVhbSA9IHNhbXBsZXIuY29tcG9zZShzYW1wbGVDb21iaW5lKG90aGVyKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gWzAsIDFdXG4gKiA+IFsxLCAxXVxuICogPiBbMiwgMV1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7Li4uU3RyZWFtfSBzdHJlYW1zIE9uZSBvciBtb3JlIHN0cmVhbXMgdG8gY29tYmluZSB3aXRoIHRoZSBzYW1wbGVyXG4gKiBzdHJlYW0uXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbnNhbXBsZUNvbWJpbmUgPSBmdW5jdGlvbiBzYW1wbGVDb21iaW5lKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICByZXR1cm4gZnVuY3Rpb24gc2FtcGxlQ29tYmluZU9wZXJhdG9yKHNhbXBsZXI6IFN0cmVhbTxhbnk+KTogU3RyZWFtPEFycmF5PGFueT4+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxBcnJheTxhbnk+PihuZXcgU2FtcGxlQ29tYmluZU9wZXJhdG9yKHNhbXBsZXIsIHN0cmVhbXMpKTtcbiAgfTtcbn0gYXMgU2FtcGxlQ29tYmluZVNpZ25hdHVyZTtcblxuZXhwb3J0IGRlZmF1bHQgc2FtcGxlQ29tYmluZTsiLCJpbXBvcnQgeHMgZnJvbSAneHN0cmVhbSc7XG5pbXBvcnQge1N0cmVhbX0gZnJvbSAneHN0cmVhbSc7XG5pbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSc7XG5pbXBvcnQge2RpdiwgRE9NU291cmNlLCBWTm9kZX0gZnJvbSAnQGN5Y2xlL2RvbSc7XG5pbXBvcnQgaXNvbGF0ZSBmcm9tICdAY3ljbGUvaXNvbGF0ZSc7XG5pbXBvcnQge1N0YXRlU291cmNlLCBSZWR1Y2VyfSBmcm9tICdAY3ljbGUvc3RhdGUnO1xuaW1wb3J0IHtSZXN1bHR9IGZyb20gJ0BjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvbic7XG5pbXBvcnQge1xuICBGYWNpYWxFeHByZXNzaW9uQWN0aW9uLFxuICBUd29TcGVlY2hidWJibGVzQWN0aW9uLFxufSBmcm9tICdAY3ljbGUtcm9ib3QtZHJpdmVycy9zY3JlZW4nO1xuaW1wb3J0IHtcbiAgRmFjaWFsRXhwcmVzc2lvbkFjdGlvblNpbmtzIGFzIEZFQVNpbmtzLFxuICBUd29TcGVlY2hidXR0b25zQWN0aW9uU2lua3MgYXMgVFdBU2lua3MsXG59IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtzZWxlY3RBY3Rpb25SZXN1bHQsIG1ha2VDb25jdXJyZW50QWN0aW9ufSBmcm9tICdAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb25iYW5rJztcblxuZXhwb3J0IGludGVyZmFjZSBTdGF0ZSB7XG4gIEZhY2lhbEV4cHJlc3Npb25BY3Rpb246IHtyZXN1bHQ6IFJlc3VsdH0sXG4gIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb246IHtyZXN1bHQ6IFJlc3VsdH0sXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU291cmNlcyB7XG4gIERPTTogRE9NU291cmNlLFxuICBUYWJsZXRGYWNlOiBhbnksXG4gIHN0YXRlOiBTdGF0ZVNvdXJjZTxTdGF0ZT4sXG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2lua3Mge1xuICBET006IFN0cmVhbTxWTm9kZT4sXG4gIFRhYmxldEZhY2U6IGFueSxcbiAgc3RhdGU6IFN0cmVhbTxSZWR1Y2VyPFN0YXRlPj4sXG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFJvYm90QXBwKHNvdXJjZXM6IFNvdXJjZXMpOiBTaW5rcyB7XG4gIC8vIHNvdXJjZXMuc3RhdGUuc3RyZWFtLmFkZExpc3RlbmVyKHtuZXh0OiB2ID0+IGNvbnNvbGUubG9nKCdzdGF0ZSQnLCB2KX0pXG5cbiAgLy8gUHJvY2VzcyBzdGF0ZSBzdHJlYW1cbiAgY29uc3Qgc3RhdGUkID0gc291cmNlcy5zdGF0ZS5zdHJlYW07XG4gIGNvbnN0IGZhY2lhbEV4cHJlc3Npb25SZXN1bHQkID0gc3RhdGUkXG4gICAgLmNvbXBvc2Uoc2VsZWN0QWN0aW9uUmVzdWx0KCdGYWNpYWxFeHByZXNzaW9uQWN0aW9uJykpO1xuICBjb25zdCB0d29TcGVlY2hidWJibGVzUmVzdWx0JCA9IHN0YXRlJFxuICAgIC5jb21wb3NlKHNlbGVjdEFjdGlvblJlc3VsdCgnVHdvU3BlZWNoYnViYmxlc0FjdGlvbicpKTtcblxuXG4gIC8vIFwibWFpblwiIGNvbXBvbmVudFxuICAvLyBjb25zdCBBbGxBY3Rpb24gPSBtYWtlQ29uY3VycmVudEFjdGlvbihcbiAgLy8gICBbJ0ZhY2lhbEV4cHJlc3Npb25BY3Rpb24nLCAnVHdvU3BlZWNoYnViYmxlc0FjdGlvbiddLFxuICAvLyAgIGZhbHNlLFxuICAvLyApO1xuICAvLyBjb25zdCBjaGlsZFNpbmtzOiBhbnkgPSBpc29sYXRlKEFsbEFjdGlvbiwgJ0FsbEFjdGlvbicpKHtcbiAgY29uc3QgUmFjZUFjdGlvbiA9IG1ha2VDb25jdXJyZW50QWN0aW9uKFxuICAgIFsnRmFjaWFsRXhwcmVzc2lvbkFjdGlvbicsICdUd29TcGVlY2hidWJibGVzQWN0aW9uJ10sXG4gICAgdHJ1ZSxcbiAgKTtcbiAgY29uc3QgY2hpbGRTaW5rczogYW55ID0gaXNvbGF0ZShSYWNlQWN0aW9uLCAnUmFjZUFjdGlvbicpKHtcbiAgICAuLi5zb3VyY2VzLFxuICAgIGdvYWw6IHhzLm9mKHtcbiAgICAgIEZhY2lhbEV4cHJlc3Npb25BY3Rpb246ICdoYXBweScsXG4gICAgICBUd29TcGVlY2hidWJibGVzQWN0aW9uOiB7bWVzc2FnZTogJ0hlbGxvJywgY2hvaWNlczogWydIZWxsbyddfSxcbiAgICB9KS5jb21wb3NlKGRlbGF5KDEwMDApKSxcbiAgICBGYWNpYWxFeHByZXNzaW9uQWN0aW9uOiB7cmVzdWx0OiBmYWNpYWxFeHByZXNzaW9uUmVzdWx0JH0sXG4gICAgVHdvU3BlZWNoYnViYmxlc0FjdGlvbjoge3Jlc3VsdDogdHdvU3BlZWNoYnViYmxlc1Jlc3VsdCR9LFxuICB9KTtcblxuICBjaGlsZFNpbmtzLnJlc3VsdC5hZGRMaXN0ZW5lcih7bmV4dDogciA9PiBjb25zb2xlLmxvZygncmVzdWx0Jywgcil9KTtcblxuXG4gIC8vIERlZmluZSBBY3Rpb25zXG4gIGNvbnN0IGZhY2lhbEV4cHJlc3Npb25BY3Rpb246IEZFQVNpbmtzID0gRmFjaWFsRXhwcmVzc2lvbkFjdGlvbih7XG4gICAgZ29hbDogY2hpbGRTaW5rcy5GYWNpYWxFeHByZXNzaW9uQWN0aW9uLFxuICAgIFRhYmxldEZhY2U6IHNvdXJjZXMuVGFibGV0RmFjZSxcbiAgfSk7XG4gIGNvbnN0IHR3b1NwZWVjaGJ1YmJsZXNBY3Rpb246IFRXQVNpbmtzID0gVHdvU3BlZWNoYnViYmxlc0FjdGlvbih7XG4gICAgZ29hbDogY2hpbGRTaW5rcy5Ud29TcGVlY2hidWJibGVzQWN0aW9uLFxuICAgIERPTTogc291cmNlcy5ET00sXG4gIH0pO1xuXG5cbiAgLy8gRGVmaW5lIFJlZHVjZXJzXG4gIGNvbnN0IHBhcmVudFJlZHVjZXIkOiBTdHJlYW08UmVkdWNlcjxTdGF0ZT4+ID0geHMubWVyZ2UoXG4gICAgZmFjaWFsRXhwcmVzc2lvbkFjdGlvbi5yZXN1bHQubWFwKHJlc3VsdCA9PiBcbiAgICAgIHByZXYgPT4gKHsuLi5wcmV2LCBGYWNpYWxFeHByZXNzaW9uQWN0aW9uOiB7b3V0cHV0czoge3Jlc3VsdH19fSkpLFxuICAgIHR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24ucmVzdWx0Lm1hcChyZXN1bHQgPT5cbiAgICAgIHByZXYgPT4gKHsuLi5wcmV2LCBUd29TcGVlY2hidWJibGVzQWN0aW9uOiB7b3V0cHV0czoge3Jlc3VsdH19fSkpLFxuICApO1xuICBjb25zdCBjaGlsZFJlZHVjZXIkOiBTdHJlYW08UmVkdWNlcjxTdGF0ZT4+ID0gY2hpbGRTaW5rcy5zdGF0ZTtcbiAgY29uc3QgcmVkdWNlciQgPSB4cy5tZXJnZShwYXJlbnRSZWR1Y2VyJCwgY2hpbGRSZWR1Y2VyJCk7XG5cblxuICAvLyBEZWZpbmUgU2lua3NcbiAgY29uc3QgdmRvbSQgPSB4cy5jb21iaW5lKFxuICAgIHR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24uRE9NLFxuICAgIHNvdXJjZXMuVGFibGV0RmFjZS5ET00sXG4gICkubWFwKChbc3BlZWNoYnViYmxlcywgZmFjZV0pID0+IFxuICAgIGRpdih7XG4gICAgICBzdHlsZToge3Bvc2l0aW9uOiAncmVsYXRpdmUnfVxuICAgIH0sIFtzcGVlY2hidWJibGVzLCBmYWNlXSlcbiAgKTtcblxuICByZXR1cm4ge1xuICAgIERPTTogdmRvbSQsXG4gICAgVGFibGV0RmFjZTogZmFjaWFsRXhwcmVzc2lvbkFjdGlvbi5vdXRwdXQsXG4gICAgc3RhdGU6IHJlZHVjZXIkLFxuICB9O1xufVxuIiwiaW1wb3J0IHttYWtlRE9NRHJpdmVyfSBmcm9tICdAY3ljbGUvZG9tJztcbmltcG9ydCB7d2l0aFN0YXRlfSBmcm9tICdAY3ljbGUvc3RhdGUnO1xuaW1wb3J0IHtydW59IGZyb20gJ0BjeWNsZS9ydW4nO1xuaW1wb3J0IHttYWtlVGFibGV0RmFjZURyaXZlcn0gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvc2NyZWVuJztcbmltcG9ydCBSb2JvdEFwcCBmcm9tICcuL1JvYm90QXBwJztcblxuY29uc3QgbWFpbiA9IHdpdGhTdGF0ZShSb2JvdEFwcCk7XG5cbnJ1bihtYWluLCB7XG4gIERPTTogbWFrZURPTURyaXZlcignI2FwcCcpLFxuICBUYWJsZXRGYWNlOiBtYWtlVGFibGV0RmFjZURyaXZlcigpLFxufSk7IiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGRyb3BSZXBlYXRzXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHNcIikpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgYWN0aW9uXzEgPSByZXF1aXJlKFwiQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uXCIpO1xuO1xuLyoqXG4gKiBGYWNpYWxFeHByZXNzaW9uIGFjdGlvbiBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHNvdXJjZXNcbiAqXG4gKiAgICogZ29hbDogYSBzdHJlYW0gb2YgYG51bGxgIChhcyBcImNhbmNlbFwiKSBvciBhIHN0cmluZyAnYGhhcHB5J2AsICdgc2FkJ2AsXG4gKiAgICAgJ2BhbmdyeSdgLCAnYGZvY3VzZWQnYCwgb3IgJ2Bjb25mdXNlZCdgIChhcyB0aGUgVGFibGV0RmFjZSBkcml2ZXInc1xuICogICAgIGBFWFBSRVNTYCB0eXBlIGNvbW1hbmQgdmFsdWUpLlxuICogICAqIERPTTogQ3ljbGUuanMgW0RPTVNvdXJjZV0oaHR0cHM6Ly9jeWNsZS5qcy5vcmcvYXBpL2RvbS5odG1sKS5cbiAqXG4gKiBAcmV0dXJuIHNpbmtzXG4gKlxuICogICAqIG91dHB1dDogYSBzdHJlYW0gZm9yIHRoZSBUYWJsZXRGYWNlIGRyaXZlci5cbiAqICAgKiBzdGF0dXM6IGRlcHJlY2lhdGVkLlxuICogICAqIHJlc3VsdDogYSBzdHJlYW0gb2YgYWN0aW9uIHJlc3VsdHMuIGByZXN1bHQucmVzdWx0YCBpcyBhbHdheXMgYG51bGxgLlxuICpcbiAqL1xuZnVuY3Rpb24gRmFjaWFsRXhwcmVzc2lvbkFjdGlvbihzb3VyY2VzKSB7XG4gICAgdmFyIGdvYWwkID0geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5nb2FsKS5maWx0ZXIoZnVuY3Rpb24gKGdvYWwpIHsgcmV0dXJuIHR5cGVvZiBnb2FsICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIGlmIChnb2FsID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdDQU5DRUwnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9ICEhZ29hbC5nb2FsX2lkID8gZ29hbCA6IGFjdGlvbl8xLmluaXRHb2FsKGdvYWwpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnR09BTCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHR5cGVvZiB2YWx1ZS5nb2FsID09PSAnc3RyaW5nJyA/IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgZ29hbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdmFsdWUuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gOiB2YWx1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgYWN0aW9uJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGdvYWwkLCBzb3VyY2VzLlRhYmxldEZhY2UuYW5pbWF0aW9uRmluaXNoLm1hcFRvKHtcbiAgICAgICAgdHlwZTogJ0VORCcsXG4gICAgICAgIHZhbHVlOiBudWxsLFxuICAgIH0pKTtcbiAgICB2YXIgaW5pdGlhbFN0YXRlID0ge1xuICAgICAgICBnb2FsOiBudWxsLFxuICAgICAgICBnb2FsX2lkOiBhY3Rpb25fMS5nZW5lcmF0ZUdvYWxJRCgpLFxuICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQsXG4gICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICB9O1xuICAgIHZhciBzdGF0ZSQgPSBhY3Rpb24kLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCBhY3Rpb24pIHtcbiAgICAgICAgLy8gY29uc29sZS5kZWJ1Zygnc3RhdGUnLCBzdGF0ZSwgJ2FjdGlvbicsIGFjdGlvbik7XG4gICAgICAgIGlmIChzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERURcbiAgICAgICAgICAgIHx8IHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRFxuICAgICAgICAgICAgfHwgc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuQUJPUlRFRCkge1xuICAgICAgICAgICAgaWYgKGFjdGlvbi50eXBlID09PSAnR09BTCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgZ29hbCA9IGFjdGlvbi52YWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBnb2FsLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIGdvYWw6IGdvYWwuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuQUNUSVZFLFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbi50eXBlID09PSAnQ0FOQ0VMJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoJ0lnbm9yZSBDQU5DRUwgaW4gRE9ORSBzdGF0ZXMnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuQUNUSVZFKSB7XG4gICAgICAgICAgICBpZiAoYWN0aW9uLnR5cGUgPT09ICdHT0FMJykge1xuICAgICAgICAgICAgICAgIHN0YXRlJC5zaGFtZWZ1bGx5U2VuZE5leHQoX19hc3NpZ24oe30sIHN0YXRlLCB7IGdvYWw6IG51bGwsIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCB9KSk7XG4gICAgICAgICAgICAgICAgdmFyIGdvYWwgPSBhY3Rpb24udmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogZ29hbC5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBnb2FsOiBnb2FsLmdvYWwsXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLkFDVElWRSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhY3Rpb24udHlwZSA9PT0gJ0VORCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIHN0YXRlLCB7IHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCwgcmVzdWx0OiBhY3Rpb24udmFsdWUgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhY3Rpb24udHlwZSA9PT0gJ0NBTkNFTCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIHN0YXRlLCB7IGdvYWw6IG51bGwsIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmRlYnVnKFwiVW5oYW5kbGVkIHN0YXRlLnN0YXR1cyBcIiArIHN0YXRlLnN0YXR1cyArIFwiIGFjdGlvbi50eXBlIFwiICsgYWN0aW9uLnR5cGUpO1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSwgaW5pdGlhbFN0YXRlKTtcbiAgICB2YXIgc3RhdGVTdGF0dXNDaGFuZ2VkJCA9IHN0YXRlJFxuICAgICAgICAuY29tcG9zZShkcm9wUmVwZWF0c18xLmRlZmF1bHQoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuICh4LnN0YXR1cyA9PT0geS5zdGF0dXMgJiYgYWN0aW9uXzEuaXNFcXVhbCh4LmdvYWxfaWQsIHkuZ29hbF9pZCkpOyB9KSk7XG4gICAgdmFyIHZhbHVlJCA9IHN0YXRlU3RhdHVzQ2hhbmdlZCRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLkFDVElWRSB8fCBzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQ7XG4gICAgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLkFDVElWRSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnRVhQUkVTUycsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHN0YXRlLmdvYWwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgeyAvLyBzdGF0ZS5zdGF0dXMgPT09IFN0YXR1cy5QUkVFTVBURURcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHN0YXR1cyQgPSBzdGF0ZVN0YXR1c0NoYW5nZWQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiAoe1xuICAgICAgICBnb2FsX2lkOiBzdGF0ZS5nb2FsX2lkLFxuICAgICAgICBzdGF0dXM6IHN0YXRlLnN0YXR1cyxcbiAgICB9KTsgfSk7XG4gICAgdmFyIHJlc3VsdCQgPSBzdGF0ZVN0YXR1c0NoYW5nZWQkXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiAoc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVEXG4gICAgICAgIHx8IHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRFxuICAgICAgICB8fCBzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5BQk9SVEVEKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuICh7XG4gICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgZ29hbF9pZDogc3RhdGUuZ29hbF9pZCxcbiAgICAgICAgICAgIHN0YXR1czogc3RhdGUuc3RhdHVzLFxuICAgICAgICB9LFxuICAgICAgICByZXN1bHQ6IHN0YXRlLnJlc3VsdCxcbiAgICB9KTsgfSk7XG4gICAgLy8gSU1QT1JUQU5UISEgZW1wdHkgdGhlIHN0cmVhbXMgbWFudWFsbHk7IG90aGVyd2lzZSBpdCBlbWl0cyB0aGUgZmlyc3RcbiAgICAvLyAgIFwiU1VDQ0VFREVEXCIgcmVzdWx0XG4gICAgdmFsdWUkLmFkZExpc3RlbmVyKHsgbmV4dDogZnVuY3Rpb24gKCkgeyB9IH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIG91dHB1dDogYWRhcHRfMS5hZGFwdCh2YWx1ZSQpLFxuICAgICAgICBzdGF0dXM6IGFkYXB0XzEuYWRhcHQoc3RhdHVzJCksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChyZXN1bHQkKSxcbiAgICB9O1xufVxuZXhwb3J0cy5GYWNpYWxFeHByZXNzaW9uQWN0aW9uID0gRmFjaWFsRXhwcmVzc2lvbkFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUZhY2lhbEV4cHJlc3Npb25BY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtXCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGlzb2xhdGVfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiQGN5Y2xlL2lzb2xhdGVcIikpO1xudmFyIGRvbV8xID0gcmVxdWlyZShcIkBjeWNsZS9kb21cIik7XG52YXIgYWN0aW9uXzEgPSByZXF1aXJlKFwiQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uXCIpO1xudmFyIFN0YXRlO1xuKGZ1bmN0aW9uIChTdGF0ZSkge1xuICAgIFN0YXRlW1wiUlVOTklOR1wiXSA9IFwiUlVOTklOR1wiO1xuICAgIFN0YXRlW1wiRE9ORVwiXSA9IFwiRE9ORVwiO1xufSkoU3RhdGUgfHwgKFN0YXRlID0ge30pKTtcbnZhciBJbnB1dFR5cGU7XG4oZnVuY3Rpb24gKElucHV0VHlwZSkge1xuICAgIElucHV0VHlwZVtcIkdPQUxcIl0gPSBcIkdPQUxcIjtcbiAgICBJbnB1dFR5cGVbXCJDQU5DRUxcIl0gPSBcIkNBTkNFTFwiO1xuICAgIElucHV0VHlwZVtcIkNMSUNLXCJdID0gXCJDTElDS1wiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xudmFyIFNwZWVjaGJ1YmJsZVR5cGU7XG4oZnVuY3Rpb24gKFNwZWVjaGJ1YmJsZVR5cGUpIHtcbiAgICBTcGVlY2hidWJibGVUeXBlW1wiTUVTU0FHRVwiXSA9IFwiTUVTU0FHRVwiO1xuICAgIFNwZWVjaGJ1YmJsZVR5cGVbXCJDSE9JQ0VcIl0gPSBcIkNIT0lDRVwiO1xufSkoU3BlZWNoYnViYmxlVHlwZSA9IGV4cG9ydHMuU3BlZWNoYnViYmxlVHlwZSB8fCAoZXhwb3J0cy5TcGVlY2hidWJibGVUeXBlID0ge30pKTtcbmZ1bmN0aW9uIGlucHV0KGdvYWwkLCBjbGlja0V2ZW50JCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5maWx0ZXIoZnVuY3Rpb24gKGdvYWwpIHsgcmV0dXJuIHR5cGVvZiBnb2FsICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIGlmIChnb2FsID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5DQU5DRUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gISFnb2FsLmdvYWxfaWQgPyBnb2FsIDogYWN0aW9uXzEuaW5pdEdvYWwoZ29hbCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5HT0FMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB0eXBlb2YgdmFsdWUuZ29hbCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogeyB0eXBlOiBTcGVlY2hidWJibGVUeXBlLk1FU1NBR0UsIHZhbHVlOiB2YWx1ZS5nb2FsIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiBBcnJheS5pc0FycmF5KHZhbHVlLmdvYWwpXG4gICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IHsgdHlwZTogU3BlZWNoYnViYmxlVHlwZS5DSE9JQ0UsIHZhbHVlOiB2YWx1ZS5nb2FsIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiB2YWx1ZS5nb2FsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pLCBjbGlja0V2ZW50JC5tYXAoZnVuY3Rpb24gKGV2ZW50KSB7IHJldHVybiAoe1xuICAgICAgICB0eXBlOiBJbnB1dFR5cGUuQ0xJQ0ssXG4gICAgICAgIHZhbHVlOiBldmVudC50YXJnZXQudGV4dENvbnRlbnRcbiAgICB9KTsgfSkpO1xufVxuZnVuY3Rpb24gY3JlYXRlVHJhbnNpdGlvbigpIHtcbiAgICB2YXIgc3R5bGVzID0ge1xuICAgICAgICBtZXNzYWdlOiB7XG4gICAgICAgICAgICBmb250RmFtaWx5OiAnaGVsdmV0aWNhJyxcbiAgICAgICAgICAgIGZvbnRTaXplOiAnM2VtJyxcbiAgICAgICAgICAgIGZvbnRXZWlnaHQ6ICdsaWdodGVyJyxcbiAgICAgICAgfSxcbiAgICAgICAgYnV0dG9uOiB7XG4gICAgICAgICAgICBtYXJnaW46ICcwIDAuMjVlbSAwIDAuMjVlbScsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd0cmFuc3BhcmVudCcsXG4gICAgICAgICAgICBib3JkZXI6ICcwLjA1ZW0gc29saWQgYmxhY2snLFxuICAgICAgICAgICAgZm9udEZhbWlseTogJ2hlbHZldGljYScsXG4gICAgICAgICAgICBmb250U2l6ZTogJzIuNWVtJyxcbiAgICAgICAgICAgIGZvbnRXZWlnaHQ6ICdsaWdodGVyJyxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHZhciB0cmFuc2l0aW9uVGFibGUgPSAoX2EgPSB7fSxcbiAgICAgICAgX2FbU3RhdGUuRE9ORV0gPSAoX2IgPSB7fSxcbiAgICAgICAgICAgIF9iW0lucHV0VHlwZS5HT0FMXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHsgcmV0dXJuICh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBET006IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC50eXBlID09PSBTcGVlY2hidWJibGVUeXBlLk1FU1NBR0VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGRvbV8xLnNwYW4oeyBzdHlsZTogc3R5bGVzLm1lc3NhZ2UgfSwgaW5wdXRWYWx1ZS5nb2FsLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuQ0hPSUNFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gZG9tXzEuc3BhbihpbnB1dFZhbHVlLmdvYWwudmFsdWUubWFwKGZ1bmN0aW9uICh0ZXh0KSB7IHJldHVybiBkb21fMS5idXR0b24oJy5jaG9pY2UnLCB7IHN0eWxlOiBzdHlsZXMuYnV0dG9uIH0sIHRleHQpOyB9KSkgOiAnJ1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTsgfSxcbiAgICAgICAgICAgIF9iKSxcbiAgICAgICAgX2FbU3RhdGUuUlVOTklOR10gPSAoX2MgPSB7fSxcbiAgICAgICAgICAgIF9jW0lucHV0VHlwZS5HT0FMXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHsgcmV0dXJuICh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBET006IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC50eXBlID09PSBTcGVlY2hidWJibGVUeXBlLk1FU1NBR0VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGRvbV8xLnNwYW4oeyBzdHlsZTogc3R5bGVzLm1lc3NhZ2UgfSwgaW5wdXRWYWx1ZS5nb2FsLnZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuQ0hPSUNFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gZG9tXzEuc3BhbihpbnB1dFZhbHVlLmdvYWwudmFsdWUubWFwKGZ1bmN0aW9uICh0ZXh0KSB7IHJldHVybiBkb21fMS5idXR0b24oJy5jaG9pY2UnLCB7IHN0eWxlOiBzdHlsZXMuYnV0dG9uIH0sIHRleHQpOyB9KSkgOiAnJ1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7IH0sXG4gICAgICAgICAgICBfY1tJbnB1dFR5cGUuQ0FOQ0VMXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHsgcmV0dXJuICh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGdvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIERPTToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogJycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTsgfSxcbiAgICAgICAgICAgIF9jW0lucHV0VHlwZS5DTElDS10gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlcy5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuQ0hPSUNFXG4gICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBET006IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBpbnB1dFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9jKSxcbiAgICAgICAgX2EpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoc3RhdGUsIHZhcmlhYmxlcywgaW5wdXQpIHtcbiAgICAgICAgdmFyIHByZXYgPSB7IHN0YXRlOiBzdGF0ZSwgdmFyaWFibGVzOiB2YXJpYWJsZXMsIG91dHB1dHM6IG51bGwgfTtcbiAgICAgICAgcmV0dXJuICF0cmFuc2l0aW9uVGFibGVbc3RhdGVdXG4gICAgICAgICAgICA/IHByZXZcbiAgICAgICAgICAgIDogIXRyYW5zaXRpb25UYWJsZVtzdGF0ZV1baW5wdXQudHlwZV1cbiAgICAgICAgICAgICAgICA/IHByZXZcbiAgICAgICAgICAgICAgICA6ICh0cmFuc2l0aW9uVGFibGVbc3RhdGVdW2lucHV0LnR5cGVdKHZhcmlhYmxlcywgaW5wdXQudmFsdWUpIHx8IHByZXYpO1xuICAgIH07XG4gICAgdmFyIF9hLCBfYiwgX2M7XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gaW5pdFJlZHVjZXIobWFjaGluZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgIGdvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciB0cmFuc2l0aW9uID0gY3JlYXRlVHJhbnNpdGlvbigpO1xuICAgIHZhciBpbnB1dFJlZHVjZXIkID0gaW5wdXQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiBpbnB1dFJlZHVjZXIobWFjaGluZSkge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihtYWNoaW5lLnN0YXRlLCBtYWNoaW5lLnZhcmlhYmxlcywgaW5wdXQpO1xuICAgIH07IH0pO1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbml0UmVkdWNlciQsIGlucHV0UmVkdWNlciQpO1xufVxuZnVuY3Rpb24gb3V0cHV0KG1hY2hpbmUkKSB7XG4gICAgdmFyIG91dHB1dHMkID0gbWFjaGluZSRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobWFjaGluZSkgeyByZXR1cm4gISFtYWNoaW5lLm91dHB1dHM7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKG1hY2hpbmUpIHsgcmV0dXJuIG1hY2hpbmUub3V0cHV0czsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRE9NOiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiAhIW91dHB1dHMuRE9NOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5ET00uZ29hbDsgfSkuc3RhcnRXaXRoKCcnKSksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChvdXRwdXRzJFxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzLnJlc3VsdDsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIG91dHB1dHMucmVzdWx0OyB9KSksXG4gICAgfTtcbn1cbi8qKlxuICogU3BlZWNoYnViYmxlIGFjdGlvbiBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHNvdXJjZXNcbiAqXG4gKiAgICogZ29hbDogYSBzdHJlYW0gb2YgYG51bGxgIChhcyBcImNhbmNlbFwiKSxcbiAqICAgICBge3R5cGU6ICdNRVNTQUdFJywgdmFsdWU6ICdIZWxsbyB3b3JsZCd9YCBvciBgJ0hlbGxvIHdvcmxkJ2AgKGFzXG4gKiAgICAgXCJtZXNzYWdlXCIpLCBvciBge3R5cGU6ICdDSE9JQ0UnLCB2YWx1ZTogWydIZWxsbycsICdXb3JsZCddfWBcbiAqICAgICBvciBgWydIZWxsbycsICdXb3JsZCddYCAoYXMgXCJtdWx0aXBsZSBjaG9pY2VcIikuXG4gKiAgICogRE9NOiBDeWNsZS5qcyBbRE9NU291cmNlXShodHRwczovL2N5Y2xlLmpzLm9yZy9hcGkvZG9tLmh0bWwpLlxuICpcbiAqIEByZXR1cm4gc2lua3NcbiAqXG4gKiAgICogRE9NOiBhIHN0cmVhbSBvZiB2aXJ0dWFsIERPTSBvYmplY3RzLCBpLmUsIFtTbmFiYmRvbSDigJxWTm9kZeKAnSBvYmplY3RzXShodHRwczovL2dpdGh1Yi5jb20vc25hYmJkb20vc25hYmJkb20pLlxuICogICAqIHJlc3VsdDogYSBzdHJlYW0gb2YgYWN0aW9uIHJlc3VsdHMuXG4gKlxuICovXG5mdW5jdGlvbiBTcGVlY2hidWJibGVBY3Rpb24oc291cmNlcykge1xuICAgIHZhciBpbnB1dCQgPSBpbnB1dCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLmdvYWwpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShcbiAgICAvLyBJTVBPUlRBTlQhISBUaGlzIG1ha2VzIHRoZSBjbGljayBzdHJlYW0gYWx3YXlzIGV4aXN0LlxuICAgIHNvdXJjZXMuRE9NLnNlbGVjdCgnLmNob2ljZScpLmVsZW1lbnRzKClcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoYikgeyByZXR1cm4gc291cmNlcy5ET00uc2VsZWN0KCcuY2hvaWNlJykuZXZlbnRzKCdjbGljaycsIHtcbiAgICAgICAgcHJldmVudERlZmF1bHQ6IHRydWVcbiAgICB9KTsgfSlcbiAgICAgICAgLmZsYXR0ZW4oKSkpO1xuICAgIHZhciBtYWNoaW5lJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSk7IC8vIGRyb3AgXCJudWxsXCI7XG4gICAgdmFyIHNpbmtzID0gb3V0cHV0KG1hY2hpbmUkKTtcbiAgICByZXR1cm4gc2lua3M7XG59XG5leHBvcnRzLlNwZWVjaGJ1YmJsZUFjdGlvbiA9IFNwZWVjaGJ1YmJsZUFjdGlvbjtcbmZ1bmN0aW9uIElzb2xhdGVkU3BlZWNoYnViYmxlQWN0aW9uKHNvdXJjZXMpIHtcbiAgICByZXR1cm4gaXNvbGF0ZV8xLmRlZmF1bHQoU3BlZWNoYnViYmxlQWN0aW9uKShzb3VyY2VzKTtcbn1cbmV4cG9ydHMuSXNvbGF0ZWRTcGVlY2hidWJibGVBY3Rpb24gPSBJc29sYXRlZFNwZWVjaGJ1YmJsZUFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNwZWVjaGJ1YmJsZUFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbVwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBpc29sYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIkBjeWNsZS9pc29sYXRlXCIpKTtcbnZhciBkb21fMSA9IHJlcXVpcmUoXCJAY3ljbGUvZG9tXCIpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciBTcGVlY2hidWJibGVBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1NwZWVjaGJ1YmJsZUFjdGlvblwiKTtcbnZhciBTdGF0ZTtcbihmdW5jdGlvbiAoU3RhdGUpIHtcbiAgICBTdGF0ZVtcIlJVTk5JTkdcIl0gPSBcIlJVTk5JTkdcIjtcbiAgICBTdGF0ZVtcIkRPTkVcIl0gPSBcIkRPTkVcIjtcbiAgICBTdGF0ZVtcIlBSRUVNUFRJTkdcIl0gPSBcIlBSRUVNUFRJTkdcIjtcbn0pKFN0YXRlIHx8IChTdGF0ZSA9IHt9KSk7XG52YXIgSW5wdXRUeXBlO1xuKGZ1bmN0aW9uIChJbnB1dFR5cGUpIHtcbiAgICBJbnB1dFR5cGVbXCJHT0FMXCJdID0gXCJHT0FMXCI7XG4gICAgSW5wdXRUeXBlW1wiQ0FOQ0VMXCJdID0gXCJDQU5DRUxcIjtcbiAgICBJbnB1dFR5cGVbXCJSRVNVTFRcIl0gPSBcIlJFU1VMVFwiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xudmFyIFR3b1NwZWVjaGJ1YmJsZXNUeXBlO1xuKGZ1bmN0aW9uIChUd29TcGVlY2hidWJibGVzVHlwZSkge1xuICAgIFR3b1NwZWVjaGJ1YmJsZXNUeXBlW1wiU0VUX01FU1NBR0VcIl0gPSBcIlNFVF9NRVNTQUdFXCI7XG4gICAgVHdvU3BlZWNoYnViYmxlc1R5cGVbXCJBU0tfUVVFU1RJT05cIl0gPSBcIkFTS19RVUVTVElPTlwiO1xufSkoVHdvU3BlZWNoYnViYmxlc1R5cGUgPSBleHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlIHx8IChleHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlID0ge30pKTtcbmZ1bmN0aW9uIGlucHV0KGdvYWwkLCBodW1hblNwZWVjaGJ1YmJsZVJlc3VsdCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5maWx0ZXIoZnVuY3Rpb24gKGdvYWwpIHsgcmV0dXJuIHR5cGVvZiBnb2FsICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIGlmIChnb2FsID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5DQU5DRUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gISFnb2FsLmdvYWxfaWQgPyBnb2FsIDogYWN0aW9uXzEuaW5pdEdvYWwoZ29hbCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5HT0FMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAhdmFsdWUuZ29hbC50eXBlID8ge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBnb2FsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlb2YgdmFsdWUuZ29hbCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBUd29TcGVlY2hidWJibGVzVHlwZS5BU0tfUVVFU1RJT04sXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gOiB2YWx1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KSwgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQubWFwKGZ1bmN0aW9uIChyZXN1bHQpIHsgcmV0dXJuICh7XG4gICAgICAgIHR5cGU6IElucHV0VHlwZS5SRVNVTFQsXG4gICAgICAgIHZhbHVlOiByZXN1bHQsXG4gICAgfSk7IH0pKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRyYW5zaXRpb24oKSB7XG4gICAgdmFyIHRyYW5zaXRpb25UYWJsZSA9IChfYSA9IHt9LFxuICAgICAgICBfYVtTdGF0ZS5ET05FXSA9IChfYiA9IHt9LFxuICAgICAgICAgICAgX2JbSW5wdXRUeXBlLkdPQUxdID0gZnVuY3Rpb24gKHZhcmlhYmxlcywgaW5wdXRWYWx1ZSkgeyByZXR1cm4gKHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuUlVOTklORyxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXRWYWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBSb2JvdFNwZWVjaGJ1YmJsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudmFsdWUubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgSHVtYW5TcGVlY2hidWJibGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC50eXBlID09PSBUd29TcGVlY2hidWJibGVzVHlwZS5TRVRfTUVTU0FHRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBpbnB1dFZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC52YWx1ZS5jaG9pY2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7IH0sXG4gICAgICAgICAgICBfYiksXG4gICAgICAgIF9hW1N0YXRlLlJVTk5JTkddID0gKF9jID0ge30sXG4gICAgICAgICAgICBfY1tJbnB1dFR5cGUuR09BTF0gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXRWYWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgUm9ib3RTcGVlY2hidWJibGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudHlwZSA9PT0gVHdvU3BlZWNoYnViYmxlc1R5cGUuU0VUX01FU1NBR0UgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnZhbHVlLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEh1bWFuU3BlZWNoYnViYmxlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC52YWx1ZS5jaG9pY2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX2NbSW5wdXRUeXBlLkNBTkNFTF0gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7IHJldHVybiAoe1xuICAgICAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5ET05FLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogdmFyaWFibGVzLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgUm9ib3RTcGVlY2hidWJibGU6IHsgZ29hbDogbnVsbCB9LFxuICAgICAgICAgICAgICAgICAgICBIdW1hblNwZWVjaGJ1YmJsZTogeyBnb2FsOiBudWxsIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTsgfSxcbiAgICAgICAgICAgIF9jW0lucHV0VHlwZS5SRVNVTFRdID0gZnVuY3Rpb24gKHZhcmlhYmxlcywgaW5wdXRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhY3Rpb25fMS5pc0VxdWFsKGlucHV0VmFsdWUuc3RhdHVzLmdvYWxfaWQsIHZhcmlhYmxlcy5nb2FsX2lkKVxuICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YgaW5wdXRWYWx1ZS5yZXN1bHQgPT09ICdzdHJpbmcnID8ge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuRE9ORSxcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgUm9ib3RTcGVlY2hidWJibGU6IHsgZ29hbDogbnVsbCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgSHVtYW5TcGVlY2hidWJibGU6IHsgZ29hbDogbnVsbCB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IGlucHV0VmFsdWUucmVzdWx0LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9IDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfYyksXG4gICAgICAgIF9hKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHN0YXRlLCB2YXJpYWJsZXMsIGlucHV0KSB7XG4gICAgICAgIHZhciBwcmV2ID0geyBzdGF0ZTogc3RhdGUsIHZhcmlhYmxlczogdmFyaWFibGVzLCBvdXRwdXRzOiBudWxsIH07XG4gICAgICAgIHJldHVybiAhdHJhbnNpdGlvblRhYmxlW3N0YXRlXVxuICAgICAgICAgICAgPyBwcmV2XG4gICAgICAgICAgICA6ICF0cmFuc2l0aW9uVGFibGVbc3RhdGVdW2lucHV0LnR5cGVdXG4gICAgICAgICAgICAgICAgPyBwcmV2XG4gICAgICAgICAgICAgICAgOiAodHJhbnNpdGlvblRhYmxlW3N0YXRlXVtpbnB1dC50eXBlXSh2YXJpYWJsZXMsIGlucHV0LnZhbHVlKSB8fCBwcmV2KTtcbiAgICB9O1xuICAgIHZhciBfYSwgX2IsIF9jO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvblJlZHVjZXIoaW5wdXQkKSB7XG4gICAgdmFyIGluaXRSZWR1Y2VyJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGZ1bmN0aW9uIGluaXRSZWR1Y2VyKG1hY2hpbmUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5ET05FLFxuICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogbnVsbCxcbiAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIHRyYW5zaXRpb24gPSBjcmVhdGVUcmFuc2l0aW9uKCk7XG4gICAgdmFyIGlucHV0UmVkdWNlciQgPSBpbnB1dCRcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoaW5wdXQpIHsgcmV0dXJuIGZ1bmN0aW9uIGlucHV0UmVkdWNlcihtYWNoaW5lKSB7XG4gICAgICAgIHJldHVybiB0cmFuc2l0aW9uKG1hY2hpbmUuc3RhdGUsIG1hY2hpbmUudmFyaWFibGVzLCBpbnB1dCk7XG4gICAgfTsgfSk7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGluaXRSZWR1Y2VyJCwgaW5wdXRSZWR1Y2VyJCk7XG59XG5mdW5jdGlvbiBvdXRwdXQobWFjaGluZSQpIHtcbiAgICB2YXIgb3V0cHV0cyQgPSBtYWNoaW5lJFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChtYWNoaW5lKSB7IHJldHVybiAhIW1hY2hpbmUub3V0cHV0czsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAobWFjaGluZSkgeyByZXR1cm4gbWFjaGluZS5vdXRwdXRzOyB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBSb2JvdFNwZWVjaGJ1YmJsZTogYWRhcHRfMS5hZGFwdChvdXRwdXRzJFxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzLlJvYm90U3BlZWNoYnViYmxlOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5Sb2JvdFNwZWVjaGJ1YmJsZS5nb2FsOyB9KSksXG4gICAgICAgIEh1bWFuU3BlZWNoYnViYmxlOiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiAhIW91dHB1dHMuSHVtYW5TcGVlY2hidWJibGU7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiBvdXRwdXRzLkh1bWFuU3BlZWNoYnViYmxlLmdvYWw7IH0pKSxcbiAgICAgICAgcmVzdWx0OiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiAhIW91dHB1dHMucmVzdWx0OyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5yZXN1bHQ7IH0pKSxcbiAgICB9O1xufVxuLyoqXG4gKiBUd29TcGVlY2hidWJibGVzLCBSb2JvdCBhbmQgSHVtYW4sIGFjdGlvbiBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHNvdXJjZXNcbiAqXG4gKiAgICogZ29hbDogYSBzdHJlYW0gb2YgYG51bGxgIChhcyBcImNhbmNlbFwiKSxcbiAqICAgICBge3R5cGU6ICdTRVRfTUVTU0FHRScsIHZhbHVlOiAnSGVsbG8gd29ybGQnfWAgb3IgYCdIZWxsbyB3b3JsZCdgIChhc1xuICogICAgIFwic2V0IG1lc3NhZ2VcIiksIG9yIGB7dHlwZTogJ0FTS19RVUVTVElPTicsIG1lc3NhZ2U6ICdCbHVlIHBpbGwgb3JcbiAqICAgICByZWQgcGlsbD8nLCBjaG9pY2VzOiBbJ0JsdWUnLCAnUmVkJ119YCAoYXMgXCJhc2sgbXVsdGlwbGUgY2hvaWNlXCIpLlxuICogICAqIERPTTogQ3ljbGUuanMgW0RPTVNvdXJjZV0oaHR0cHM6Ly9jeWNsZS5qcy5vcmcvYXBpL2RvbS5odG1sKS5cbiAqXG4gKiBAcmV0dXJuIHNpbmtzXG4gKlxuICogICAqIERPTTogYSBzdHJlYW0gb2YgdmlydHVhbCBET00gb2JqZWN0cywgaS5lLCBbU25hYmJkb20g4oCcVk5vZGXigJ0gb2JqZWN0c10oaHR0cHM6Ly9naXRodWIuY29tL3NuYWJiZG9tL3NuYWJiZG9tKS5cbiAqICAgKiByZXN1bHQ6IGEgc3RyZWFtIG9mIGFjdGlvbiByZXN1bHRzLlxuICpcbiAqL1xuZnVuY3Rpb24gVHdvU3BlZWNoYnViYmxlc0FjdGlvbihzb3VyY2VzKSB7XG4gICAgLy8gY3JlYXRlIHByb3hpZXNcbiAgICB2YXIgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICB2YXIgaW5wdXQkID0gaW5wdXQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5nb2FsKSwgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQpO1xuICAgIHZhciBtYWNoaW5lJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSk7IC8vIGRyb3AgXCJudWxsXCI7XG4gICAgdmFyIF9hID0gb3V0cHV0KG1hY2hpbmUkKSwgUm9ib3RTcGVlY2hidWJibGUgPSBfYS5Sb2JvdFNwZWVjaGJ1YmJsZSwgSHVtYW5TcGVlY2hidWJibGUgPSBfYS5IdW1hblNwZWVjaGJ1YmJsZSwgcmVzdWx0ID0gX2EucmVzdWx0O1xuICAgIC8vIGNyZWF0ZSBzdWItY29tcG9uZW50c1xuICAgIHZhciByb2JvdFNwZWVjaGJ1YmJsZSA9IFNwZWVjaGJ1YmJsZUFjdGlvbl8xLklzb2xhdGVkU3BlZWNoYnViYmxlQWN0aW9uKHtcbiAgICAgICAgZ29hbDogUm9ib3RTcGVlY2hidWJibGUsXG4gICAgICAgIERPTTogc291cmNlcy5ET00sXG4gICAgfSk7XG4gICAgdmFyIGh1bWFuU3BlZWNoYnViYmxlID0gU3BlZWNoYnViYmxlQWN0aW9uXzEuSXNvbGF0ZWRTcGVlY2hidWJibGVBY3Rpb24oe1xuICAgICAgICBnb2FsOiBIdW1hblNwZWVjaGJ1YmJsZSxcbiAgICAgICAgRE9NOiBzb3VyY2VzLkRPTSxcbiAgICB9KTtcbiAgICAvLyBJTVBPUlRBTlQhISBBdHRhY2ggbGlzdGVuZXJzIHRvIHRoZSBET00gc3RyZWFtcyBCRUZPUkUgY29ubmVjdGluZyB0aGVcbiAgICAvLyAgIHByb3hpZXMgdG8gaGF2ZSBOTyBRVUVVRSBpbiB0aGUgRE9NIHN0cmVhbXMuXG4gICAgcm9ib3RTcGVlY2hidWJibGUuRE9NLmFkZExpc3RlbmVyKHsgbmV4dDogZnVuY3Rpb24gKHZhbHVlKSB7IH0gfSk7XG4gICAgaHVtYW5TcGVlY2hidWJibGUuRE9NLmFkZExpc3RlbmVyKHsgbmV4dDogZnVuY3Rpb24gKHZhbHVlKSB7IH0gfSk7XG4gICAgLy8gY29ubmVjdCBwcm94aWVzXG4gICAgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQuaW1pdGF0ZShodW1hblNwZWVjaGJ1YmJsZS5yZXN1bHQpO1xuICAgIHZhciBzdHlsZXMgPSB7XG4gICAgICAgIG91dGVyOiB7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgICAgIHdpZHRoOiAnMTAwdncnLFxuICAgICAgICAgICAgekluZGV4OiAxLFxuICAgICAgICAgICAgbWFyZ2luOiAnMWVtJyxcbiAgICAgICAgfSxcbiAgICAgICAgYnViYmxlOiB7XG4gICAgICAgICAgICBtYXJnaW46IDAsXG4gICAgICAgICAgICBwYWRkaW5nOiAnMWVtJyxcbiAgICAgICAgICAgIG1heFdpZHRoOiAnOTAlJyxcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHZhciB2ZG9tJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNvbWJpbmUocm9ib3RTcGVlY2hidWJibGUuRE9NLCBodW1hblNwZWVjaGJ1YmJsZS5ET00pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciByb2JvdFZUcmVlID0gX2FbMF0sIGh1bWFuVlRyZWUgPSBfYVsxXTtcbiAgICAgICAgcmV0dXJuIGRvbV8xLmRpdih7IHN0eWxlOiBzdHlsZXMub3V0ZXIgfSwgW1xuICAgICAgICAgICAgZG9tXzEuZGl2KHsgc3R5bGU6IHN0eWxlcy5idWJibGUgfSwgW2RvbV8xLnNwYW4ocm9ib3RWVHJlZSldKSxcbiAgICAgICAgICAgIGRvbV8xLmRpdih7IHN0eWxlOiBfX2Fzc2lnbih7fSwgc3R5bGVzLmJ1YmJsZSwgeyB0ZXh0QWxpZ246ICdyaWdodCcgfSkgfSwgW2RvbV8xLnNwYW4oaHVtYW5WVHJlZSldKSxcbiAgICAgICAgXSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRE9NOiB2ZG9tJCxcbiAgICAgICAgcmVzdWx0OiByZXN1bHQsXG4gICAgfTtcbn1cbmV4cG9ydHMuVHdvU3BlZWNoYnViYmxlc0FjdGlvbiA9IFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb247XG5mdW5jdGlvbiBJc29sYXRlZFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24oc291cmNlcykge1xuICAgIHJldHVybiBpc29sYXRlXzEuZGVmYXVsdChUd29TcGVlY2hidWJibGVzQWN0aW9uKShzb3VyY2VzKTtcbn1cbmV4cG9ydHMuSXNvbGF0ZWRUd29TcGVlY2hidWJibGVzQWN0aW9uID0gSXNvbGF0ZWRUd29TcGVlY2hidWJibGVzQWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9VHdvU3BlZWNoYnViYmxlc0FjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBtYWtlVGFibGV0RmFjZURyaXZlcl8xID0gcmVxdWlyZShcIi4vbWFrZVRhYmxldEZhY2VEcml2ZXJcIik7XG5leHBvcnRzLkV4cHJlc3NDb21tYW5kVHlwZSA9IG1ha2VUYWJsZXRGYWNlRHJpdmVyXzEuRXhwcmVzc0NvbW1hbmRUeXBlO1xuZXhwb3J0cy5tYWtlVGFibGV0RmFjZURyaXZlciA9IG1ha2VUYWJsZXRGYWNlRHJpdmVyXzEubWFrZVRhYmxldEZhY2VEcml2ZXI7XG52YXIgRmFjaWFsRXhwcmVzc2lvbkFjdGlvbl8xID0gcmVxdWlyZShcIi4vRmFjaWFsRXhwcmVzc2lvbkFjdGlvblwiKTtcbmV4cG9ydHMuRmFjaWFsRXhwcmVzc2lvbkFjdGlvbiA9IEZhY2lhbEV4cHJlc3Npb25BY3Rpb25fMS5GYWNpYWxFeHByZXNzaW9uQWN0aW9uO1xudmFyIFNwZWVjaGJ1YmJsZUFjdGlvbl8xID0gcmVxdWlyZShcIi4vU3BlZWNoYnViYmxlQWN0aW9uXCIpO1xuZXhwb3J0cy5TcGVlY2hidWJibGVUeXBlID0gU3BlZWNoYnViYmxlQWN0aW9uXzEuU3BlZWNoYnViYmxlVHlwZTtcbmV4cG9ydHMuU3BlZWNoYnViYmxlQWN0aW9uID0gU3BlZWNoYnViYmxlQWN0aW9uXzEuU3BlZWNoYnViYmxlQWN0aW9uO1xuZXhwb3J0cy5Jc29sYXRlZFNwZWVjaGJ1YmJsZUFjdGlvbiA9IFNwZWVjaGJ1YmJsZUFjdGlvbl8xLklzb2xhdGVkU3BlZWNoYnViYmxlQWN0aW9uO1xudmFyIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1R3b1NwZWVjaGJ1YmJsZXNBY3Rpb25cIik7XG5leHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlID0gVHdvU3BlZWNoYnViYmxlc0FjdGlvbl8xLlR3b1NwZWVjaGJ1YmJsZXNUeXBlO1xuZXhwb3J0cy5Ud29TcGVlY2hidWJibGVzQWN0aW9uID0gVHdvU3BlZWNoYnViYmxlc0FjdGlvbl8xLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb247XG5leHBvcnRzLklzb2xhdGVkVHdvU3BlZWNoYnViYmxlc0FjdGlvbiA9IFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb25fMS5Jc29sYXRlZFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGRvbV8xID0gcmVxdWlyZShcIkBjeWNsZS9kb21cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbi8vIGFkYXB0ZWQgZnJvbVxuLy8gICBodHRwczovL2dpdGh1Yi5jb20vbWp5Yy90YWJsZXQtcm9ib3QtZmFjZS9ibG9iLzcwOWI3MzFkZmYwNDAzM2MwOGNmMDQ1YWRjNGUwMzhlZWZhNzUwYTIvaW5kZXguanMjTDMtTDE4NFxudmFyIEV5ZUNvbnRyb2xsZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRXllQ29udHJvbGxlcihlbGVtZW50cywgZXllU2l6ZSkge1xuICAgICAgICBpZiAoZWxlbWVudHMgPT09IHZvaWQgMCkgeyBlbGVtZW50cyA9IHt9OyB9XG4gICAgICAgIGlmIChleWVTaXplID09PSB2b2lkIDApIHsgZXllU2l6ZSA9ICczMy4zM3ZtaW4nOyB9XG4gICAgICAgIHRoaXMuX2V5ZVNpemUgPSBleWVTaXplO1xuICAgICAgICB0aGlzLl9ibGlua1RpbWVvdXRJRCA9IG51bGw7XG4gICAgICAgIHRoaXMuc2V0RWxlbWVudHMoZWxlbWVudHMpO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXllQ29udHJvbGxlci5wcm90b3R5cGUsIFwibGVmdEV5ZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fbGVmdEV5ZTsgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLCBcInJpZ2h0RXllXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9yaWdodEV5ZTsgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgRXllQ29udHJvbGxlci5wcm90b3R5cGUuc2V0RWxlbWVudHMgPSBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgdmFyIGxlZnRFeWUgPSBfYS5sZWZ0RXllLCByaWdodEV5ZSA9IF9hLnJpZ2h0RXllLCB1cHBlckxlZnRFeWVsaWQgPSBfYS51cHBlckxlZnRFeWVsaWQsIHVwcGVyUmlnaHRFeWVsaWQgPSBfYS51cHBlclJpZ2h0RXllbGlkLCBsb3dlckxlZnRFeWVsaWQgPSBfYS5sb3dlckxlZnRFeWVsaWQsIGxvd2VyUmlnaHRFeWVsaWQgPSBfYS5sb3dlclJpZ2h0RXllbGlkO1xuICAgICAgICB0aGlzLl9sZWZ0RXllID0gbGVmdEV5ZTtcbiAgICAgICAgdGhpcy5fcmlnaHRFeWUgPSByaWdodEV5ZTtcbiAgICAgICAgdGhpcy5fdXBwZXJMZWZ0RXllbGlkID0gdXBwZXJMZWZ0RXllbGlkO1xuICAgICAgICB0aGlzLl91cHBlclJpZ2h0RXllbGlkID0gdXBwZXJSaWdodEV5ZWxpZDtcbiAgICAgICAgdGhpcy5fbG93ZXJMZWZ0RXllbGlkID0gbG93ZXJMZWZ0RXllbGlkO1xuICAgICAgICB0aGlzLl9sb3dlclJpZ2h0RXllbGlkID0gbG93ZXJSaWdodEV5ZWxpZDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5fY3JlYXRlS2V5ZnJhbWVzID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBfYiA9IF9hLnRndFRyYW5ZVmFsLCB0Z3RUcmFuWVZhbCA9IF9iID09PSB2b2lkIDAgPyAnMHB4JyA6IF9iLCBfYyA9IF9hLnRndFJvdFZhbCwgdGd0Um90VmFsID0gX2MgPT09IHZvaWQgMCA/ICcwZGVnJyA6IF9jLCBfZCA9IF9hLmVudGVyZWRPZmZzZXQsIGVudGVyZWRPZmZzZXQgPSBfZCA9PT0gdm9pZCAwID8gMCA6IF9kLCBfZSA9IF9hLmV4aXRpbmdPZmZzZXQsIGV4aXRpbmdPZmZzZXQgPSBfZSA9PT0gdm9pZCAwID8gMCA6IF9lO1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyB0cmFuc2Zvcm06IFwidHJhbnNsYXRlWSgwcHgpIHJvdGF0ZSgwZGVnKVwiLCBvZmZzZXQ6IDAuMCB9LFxuICAgICAgICAgICAgeyB0cmFuc2Zvcm06IFwidHJhbnNsYXRlWShcIiArIHRndFRyYW5ZVmFsICsgXCIpIHJvdGF0ZShcIiArIHRndFJvdFZhbCArIFwiKVwiLCBvZmZzZXQ6IGVudGVyZWRPZmZzZXQgfSxcbiAgICAgICAgICAgIHsgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZVkoXCIgKyB0Z3RUcmFuWVZhbCArIFwiKSByb3RhdGUoXCIgKyB0Z3RSb3RWYWwgKyBcIilcIiwgb2Zmc2V0OiBleGl0aW5nT2Zmc2V0IH0sXG4gICAgICAgICAgICB7IHRyYW5zZm9ybTogXCJ0cmFuc2xhdGVZKDBweCkgcm90YXRlKDBkZWcpXCIsIG9mZnNldDogMS4wIH0sXG4gICAgICAgIF07XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5leHByZXNzID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBfYiA9IF9hLnR5cGUsIHR5cGUgPSBfYiA9PT0gdm9pZCAwID8gJycgOiBfYiwgXG4gICAgICAgIC8vIGxldmVsID0gMywgIC8vIDE6IG1pbiwgNTogbWF4XG4gICAgICAgIF9jID0gX2EuZHVyYXRpb24sIFxuICAgICAgICAvLyBsZXZlbCA9IDMsICAvLyAxOiBtaW4sIDU6IG1heFxuICAgICAgICBkdXJhdGlvbiA9IF9jID09PSB2b2lkIDAgPyAxMDAwIDogX2MsIF9kID0gX2EuZW50ZXJEdXJhdGlvbiwgZW50ZXJEdXJhdGlvbiA9IF9kID09PSB2b2lkIDAgPyA3NSA6IF9kLCBfZSA9IF9hLmV4aXREdXJhdGlvbiwgZXhpdER1cmF0aW9uID0gX2UgPT09IHZvaWQgMCA/IDc1IDogX2U7XG4gICAgICAgIGlmICghdGhpcy5fbGVmdEV5ZSkgeyAvLyBhc3N1bWVzIGFsbCBlbGVtZW50cyBhcmUgYWx3YXlzIHNldCB0b2dldGhlclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdFeWUgZWxlbWVudHMgYXJlIG5vdCBzZXQ7IHJldHVybjsnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgIGR1cmF0aW9uOiBkdXJhdGlvbixcbiAgICAgICAgfTtcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdoYXBweSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbG93ZXJMZWZ0RXllbGlkOiB0aGlzLl9sb3dlckxlZnRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIC0yIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFJvdFZhbDogXCIzMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICAgICAgbG93ZXJSaWdodEV5ZWxpZDogdGhpcy5fbG93ZXJSaWdodEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogLTIgLyAzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGd0Um90VmFsOiBcIi0zMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2FzZSAnc2FkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB1cHBlckxlZnRFeWVsaWQ6IHRoaXMuX3VwcGVyTGVmdEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RSb3RWYWw6IFwiLTIwZGVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICB1cHBlclJpZ2h0RXllbGlkOiB0aGlzLl91cHBlclJpZ2h0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAxIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFJvdFZhbDogXCIyMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2FzZSAnYW5ncnknOlxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHVwcGVyTGVmdEV5ZWxpZDogdGhpcy5fdXBwZXJMZWZ0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAxIC8gNClcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFJvdFZhbDogXCIzMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJSaWdodEV5ZWxpZDogdGhpcy5fdXBwZXJSaWdodEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDQpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RSb3RWYWw6IFwiLTMwZGVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjYXNlICdmb2N1c2VkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB1cHBlckxlZnRFeWVsaWQ6IHRoaXMuX3VwcGVyTGVmdEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICB1cHBlclJpZ2h0RXllbGlkOiB0aGlzLl91cHBlclJpZ2h0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAxIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgICAgIGxvd2VyTGVmdEV5ZWxpZDogdGhpcy5fbG93ZXJMZWZ0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAtMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICBsb3dlclJpZ2h0RXllbGlkOiB0aGlzLl9sb3dlclJpZ2h0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAtMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjYXNlICdjb25mdXNlZCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJSaWdodEV5ZWxpZDogdGhpcy5fdXBwZXJSaWdodEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RSb3RWYWw6IFwiLTEwZGVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkludmFsaWQgaW5wdXQgdHlwZT1cIiArIHR5cGUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5ibGluayA9IGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgX2IgPSAoX2EgPT09IHZvaWQgMCA/IHt9IDogX2EpLmR1cmF0aW9uLCBkdXJhdGlvbiA9IF9iID09PSB2b2lkIDAgPyAxNTAgOiBfYjtcbiAgICAgICAgaWYgKCF0aGlzLl9sZWZ0RXllKSB7IC8vIGFzc3VtZXMgYWxsIGVsZW1lbnRzIGFyZSBhbHdheXMgc2V0IHRvZ2V0aGVyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0V5ZSBlbGVtZW50cyBhcmUgbm90IHNldDsgcmV0dXJuOycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIFt0aGlzLl9sZWZ0RXllLCB0aGlzLl9yaWdodEV5ZV0ubWFwKGZ1bmN0aW9uIChleWUpIHtcbiAgICAgICAgICAgIGV5ZS5hbmltYXRlKFtcbiAgICAgICAgICAgICAgICB7IHRyYW5zZm9ybTogJ3JvdGF0ZVgoMGRlZyknIH0sXG4gICAgICAgICAgICAgICAgeyB0cmFuc2Zvcm06ICdyb3RhdGVYKDkwZGVnKScgfSxcbiAgICAgICAgICAgICAgICB7IHRyYW5zZm9ybTogJ3JvdGF0ZVgoMGRlZyknIH0sXG4gICAgICAgICAgICBdLCB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb246IGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgIGl0ZXJhdGlvbnM6IDEsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5zdGFydEJsaW5raW5nID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBfYiA9IChfYSA9PT0gdm9pZCAwID8ge30gOiBfYSkubWF4SW50ZXJ2YWwsIG1heEludGVydmFsID0gX2IgPT09IHZvaWQgMCA/IDUwMDAgOiBfYjtcbiAgICAgICAgaWYgKHRoaXMuX2JsaW5rVGltZW91dElEKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJBbHJlYWR5IGJsaW5raW5nIHdpdGggdGltZW91dElEPVwiICsgdGhpcy5fYmxpbmtUaW1lb3V0SUQgKyBcIjsgcmV0dXJuO1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYmxpbmtSYW5kb21seSA9IGZ1bmN0aW9uICh0aW1lb3V0KSB7XG4gICAgICAgICAgICBfdGhpcy5fYmxpbmtUaW1lb3V0SUQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5ibGluaygpO1xuICAgICAgICAgICAgICAgIGJsaW5rUmFuZG9tbHkoTWF0aC5yYW5kb20oKSAqIG1heEludGVydmFsKTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICB9O1xuICAgICAgICBibGlua1JhbmRvbWx5KE1hdGgucmFuZG9tKCkgKiBtYXhJbnRlcnZhbCk7XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5zdG9wQmxpbmtpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9ibGlua1RpbWVvdXRJRCk7XG4gICAgICAgIHRoaXMuX2JsaW5rVGltZW91dElEID0gbnVsbDtcbiAgICB9O1xuICAgIEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLnNldEV5ZVBvc2l0aW9uID0gZnVuY3Rpb24gKGV5ZUVsZW0sIHgsIHksIGlzUmlnaHQpIHtcbiAgICAgICAgaWYgKGlzUmlnaHQgPT09IHZvaWQgMCkgeyBpc1JpZ2h0ID0gZmFsc2U7IH1cbiAgICAgICAgaWYgKCFleWVFbGVtKSB7IC8vIGFzc3VtZXMgYWxsIGVsZW1lbnRzIGFyZSBhbHdheXMgc2V0IHRvZ2V0aGVyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ludmFsaWQgaW5wdXRzICcsIGV5ZUVsZW0sIHgsIHksICc7IHJldHVuaW5nJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc05hTih4KSkge1xuICAgICAgICAgICAgaWYgKCFpc1JpZ2h0KSB7XG4gICAgICAgICAgICAgICAgZXllRWxlbS5zdHlsZS5sZWZ0ID0gXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiIC8gMyAqIDIgKiBcIiArIHggKyBcIilcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGV5ZUVsZW0uc3R5bGUucmlnaHQgPSBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgLyAzICogMiAqIFwiICsgKDEgLSB4KSArIFwiKVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghaXNOYU4oeSkpIHtcbiAgICAgICAgICAgIGV5ZUVsZW0uc3R5bGUuYm90dG9tID0gXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiIC8gMyAqIDIgKiBcIiArICgxIC0geSkgKyBcIilcIjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIEV5ZUNvbnRyb2xsZXI7XG59KCkpO1xudmFyIENvbW1hbmRUeXBlO1xuKGZ1bmN0aW9uIChDb21tYW5kVHlwZSkge1xuICAgIENvbW1hbmRUeXBlW1wiRVhQUkVTU1wiXSA9IFwiRVhQUkVTU1wiO1xuICAgIENvbW1hbmRUeXBlW1wiU1RBUlRfQkxJTktJTkdcIl0gPSBcIlNUQVJUX0JMSU5LSU5HXCI7XG4gICAgQ29tbWFuZFR5cGVbXCJTVE9QX0JMSU5LSU5HXCJdID0gXCJTVE9QX0JMSU5LSU5HXCI7XG4gICAgQ29tbWFuZFR5cGVbXCJTRVRfU1RBVEVcIl0gPSBcIlNFVF9TVEFURVwiO1xufSkoQ29tbWFuZFR5cGUgfHwgKENvbW1hbmRUeXBlID0ge30pKTtcbnZhciBFeHByZXNzQ29tbWFuZFR5cGU7XG4oZnVuY3Rpb24gKEV4cHJlc3NDb21tYW5kVHlwZSkge1xuICAgIEV4cHJlc3NDb21tYW5kVHlwZVtcIkhBUFBZXCJdID0gXCJoYXBweVwiO1xuICAgIEV4cHJlc3NDb21tYW5kVHlwZVtcIlNBRFwiXSA9IFwic2FkXCI7XG4gICAgRXhwcmVzc0NvbW1hbmRUeXBlW1wiQU5HUllcIl0gPSBcImFuZ3J5XCI7XG4gICAgRXhwcmVzc0NvbW1hbmRUeXBlW1wiRk9DVVNFRFwiXSA9IFwiZm9jdXNlZFwiO1xuICAgIEV4cHJlc3NDb21tYW5kVHlwZVtcIkNPTkZVU0VEXCJdID0gXCJjb25mdXNlZFwiO1xufSkoRXhwcmVzc0NvbW1hbmRUeXBlID0gZXhwb3J0cy5FeHByZXNzQ29tbWFuZFR5cGUgfHwgKGV4cG9ydHMuRXhwcmVzc0NvbW1hbmRUeXBlID0ge30pKTtcbi8qKlxuICogW1RhYmxldEZhY2VdKGh0dHBzOi8vZ2l0aHViLmNvbS9tanljL3RhYmxldC1yb2JvdC1mYWNlKSBkcml2ZXIgZmFjdG9yeS5cbiAqXG4gKiBAcGFyYW0gb3B0aW9ucyBwb3NzaWJsZSBrZXkgaW5jbHVkZXNcbiAqXG4gKiAgICogc3R5bGVzIHtvYmplY3R9IEEgZ3JvdXAgb2Ygb3B0aW9uYWwgZmFjZSBzdHlsZSBwYXJhbWV0ZXJzOlxuICogICAgICogZmFjZUNvbG9yIHtzdHJpbmd9IChkZWZhdWx0OiAnd2hpdGVzbW9rZScpXG4gKiAgICAgKiBmYWNlSGVpZ2h0IHtzdHJpbmd9IChkZWZhdWx0OiAnMTAwdmgnKVxuICogICAgICogZmFjZVdpZHRoIHtzdHJpbmd9IChkZWZhdWx0OiAnMTAwdncnKVxuICogICAgICogZXllQ29sb3Ige3N0cmluZ30gKGRlZmF1bHQ6ICdibGFjaycpXG4gKiAgICAgKiBleWVTaXplIHtzdHJpbmd9IChkZWZhdWx0OiAnMzMuMzN2bWluJylcbiAqICAgICAqIGV5ZWxpZENvbG9yIHtzdHJpbmd9IChkZWZhdWx0OiAnd2hpdGVzbW9rZScpXG4gKlxuICogQHJldHVybiB7RHJpdmVyfSB0aGUgVGFibGV0RmFjZSBDeWNsZS5qcyBkcml2ZXIgZnVuY3Rpb24uIEl0IHRha2VzIGEgc3RyZWFtXG4gKiAgIG9mIGBDb21tYW5kYCBhbmQgcmV0dXJucyBgRE9NYCwgYW5pbWF0aW9uRmluaXNoYCwgYW5kIGBsb2FkYCBzdHJlYW1zLlxuICovXG5mdW5jdGlvbiBtYWtlVGFibGV0RmFjZURyaXZlcihfYSkge1xuICAgIHZhciBfYiA9IChfYSA9PT0gdm9pZCAwID8ge30gOiBfYSkuc3R5bGVzLCBfYyA9IF9iID09PSB2b2lkIDAgPyB7fSA6IF9iLCBfZCA9IF9jLmZhY2VDb2xvciwgZmFjZUNvbG9yID0gX2QgPT09IHZvaWQgMCA/ICd3aGl0ZXNtb2tlJyA6IF9kLCBfZSA9IF9jLmZhY2VIZWlnaHQsIGZhY2VIZWlnaHQgPSBfZSA9PT0gdm9pZCAwID8gJzEwMHZoJyA6IF9lLCBfZiA9IF9jLmZhY2VXaWR0aCwgZmFjZVdpZHRoID0gX2YgPT09IHZvaWQgMCA/ICcxMDB2dycgOiBfZiwgX2cgPSBfYy5leWVDb2xvciwgZXllQ29sb3IgPSBfZyA9PT0gdm9pZCAwID8gJ2JsYWNrJyA6IF9nLCBfaCA9IF9jLmV5ZVNpemUsIGV5ZVNpemUgPSBfaCA9PT0gdm9pZCAwID8gJzMzLjMzdm1pbicgOiBfaCwgX2ogPSBfYy5leWVsaWRDb2xvciwgZXllbGlkQ29sb3IgPSBfaiA9PT0gdm9pZCAwID8gJ3doaXRlc21va2UnIDogX2o7XG4gICAgdmFyIHN0eWxlcyA9IHtcbiAgICAgICAgZmFjZToge1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBmYWNlQ29sb3IsXG4gICAgICAgICAgICBoZWlnaHQ6IGZhY2VIZWlnaHQsXG4gICAgICAgICAgICB3aWR0aDogZmFjZVdpZHRoLFxuICAgICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgICAgICBvdmVyZmxvdzogJ2hpZGRlbicsXG4gICAgICAgICAgICB6SW5kZXg6IDAsXG4gICAgICAgIH0sXG4gICAgICAgIGV5ZToge1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBleWVDb2xvcixcbiAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzEwMCUnLFxuICAgICAgICAgICAgaGVpZ2h0OiBleWVTaXplLFxuICAgICAgICAgICAgd2lkdGg6IGV5ZVNpemUsXG4gICAgICAgICAgICBib3R0b206IFwiY2FsYyhcIiArIGV5ZVNpemUgKyBcIiAvIDMpXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDEsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgfSxcbiAgICAgICAgbGVmdDoge1xuICAgICAgICAgICAgbGVmdDogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiIC8gMylcIixcbiAgICAgICAgfSxcbiAgICAgICAgcmlnaHQ6IHtcbiAgICAgICAgICAgIHJpZ2h0OiBcImNhbGMoXCIgKyBleWVTaXplICsgXCIgLyAzKVwiLFxuICAgICAgICB9LFxuICAgICAgICBleWVsaWQ6IHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogZXllbGlkQ29sb3IsXG4gICAgICAgICAgICBoZWlnaHQ6IGV5ZVNpemUsXG4gICAgICAgICAgICB3aWR0aDogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiICogMS43NSlcIixcbiAgICAgICAgICAgIHpJbmRleDogMixcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICB9LFxuICAgICAgICB1cHBlcjoge1xuICAgICAgICAgICAgYm90dG9tOiBcImNhbGMoXCIgKyBleWVTaXplICsgXCIgKiAxKVwiLFxuICAgICAgICAgICAgbGVmdDogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiICogLTAuMzc1KVwiLFxuICAgICAgICB9LFxuICAgICAgICBsb3dlcjoge1xuICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnMTAwJScsXG4gICAgICAgICAgICBib3R0b206IFwiY2FsYyhcIiArIGV5ZVNpemUgKyBcIiAqIC0xKVwiLFxuICAgICAgICAgICAgbGVmdDogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiICogLTAuMzc1KVwiLFxuICAgICAgICB9LFxuICAgIH07XG4gICAgdmFyIGV5ZXMgPSBuZXcgRXllQ29udHJvbGxlcigpO1xuICAgIHZhciBpZCA9IFwiZmFjZS1cIiArIFN0cmluZyhNYXRoLnJhbmRvbSgpKS5zdWJzdHIoMik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjb21tYW5kJCkge1xuICAgICAgICB2YXIgbG9hZCQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgdmFyIGludGVydmFsSUQgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIWRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjXCIgKyBpZCkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiV2FpdGluZyBmb3IgI1wiICsgaWQgKyBcIiB0byBhcHBlYXIuLi5cIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbElEKTtcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNcIiArIGlkKTtcbiAgICAgICAgICAgIGV5ZXMuc2V0RWxlbWVudHMoe1xuICAgICAgICAgICAgICAgIGxlZnRFeWU6IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLmxlZnQuZXllJyksXG4gICAgICAgICAgICAgICAgcmlnaHRFeWU6IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLnJpZ2h0LmV5ZScpLFxuICAgICAgICAgICAgICAgIHVwcGVyTGVmdEV5ZWxpZDogZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubGVmdCAuZXllbGlkLnVwcGVyJyksXG4gICAgICAgICAgICAgICAgdXBwZXJSaWdodEV5ZWxpZDogZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmlnaHQgLmV5ZWxpZC51cHBlcicpLFxuICAgICAgICAgICAgICAgIGxvd2VyTGVmdEV5ZWxpZDogZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubGVmdCAuZXllbGlkLmxvd2VyJyksXG4gICAgICAgICAgICAgICAgbG93ZXJSaWdodEV5ZWxpZDogZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmlnaHQgLmV5ZWxpZC5sb3dlcicpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsb2FkJC5zaGFtZWZ1bGx5U2VuZE5leHQodHJ1ZSk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgICB2YXIgYW5pbWF0aW9ucyA9IHt9O1xuICAgICAgICB2YXIgYW5pbWF0aW9uRmluaXNoJCQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoY29tbWFuZCQpLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGFuaW1hdGlvbnMpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25zW2tleV0uY2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN3aXRjaCAoY29tbWFuZC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQ29tbWFuZFR5cGUuRVhQUkVTUzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbnMgPSBleWVzLmV4cHJlc3MoY29tbWFuZC52YWx1ZSkgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25GaW5pc2gkJC5zaGFtZWZ1bGx5U2VuZE5leHQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbVByb21pc2UoUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoYW5pbWF0aW9ucykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25zW2tleV0ub25maW5pc2ggPSByZXNvbHZlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDb21tYW5kVHlwZS5TVEFSVF9CTElOS0lORzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGV5ZXMuc3RhcnRCbGlua2luZyhjb21tYW5kLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIENvbW1hbmRUeXBlLlNUT1BfQkxJTktJTkc6XG4gICAgICAgICAgICAgICAgICAgICAgICBleWVzLnN0b3BCbGlua2luZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQ29tbWFuZFR5cGUuU0VUX1NUQVRFOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gY29tbWFuZC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZWZ0UG9zID0gdmFsdWUgJiYgdmFsdWUubGVmdEV5ZSB8fCB7IHg6IG51bGwsIHk6IG51bGwgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByaWdodFBvcyA9IHZhbHVlICYmIHZhbHVlLnJpZ2h0RXllIHx8IHsgeDogbnVsbCwgeTogbnVsbCB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZXllcy5zZXRFeWVQb3NpdGlvbihleWVzLmxlZnRFeWUsIGxlZnRQb3MueCwgbGVmdFBvcy55KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV5ZXMuc2V0RXllUG9zaXRpb24oZXllcy5yaWdodEV5ZSwgcmlnaHRQb3MueCwgcmlnaHRQb3MueSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdmRvbSQgPSB4c3RyZWFtXzEuZGVmYXVsdC5vZihkb21fMS5kaXYoXCIjXCIgKyBpZCArIFwiLmZhY2VcIiwgeyBzdHlsZTogc3R5bGVzLmZhY2UgfSwgW1xuICAgICAgICAgICAgZG9tXzEuZGl2KCcuZXllLmxlZnQnLCB7XG4gICAgICAgICAgICAgICAgc3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlcy5leWUsIHN0eWxlcy5sZWZ0KSxcbiAgICAgICAgICAgIH0sIFtcbiAgICAgICAgICAgICAgICBkb21fMS5kaXYoJy5leWVsaWQudXBwZXInLCB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiBPYmplY3QuYXNzaWduKHt9LCBzdHlsZXMuZXllbGlkLCBzdHlsZXMudXBwZXIpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGRvbV8xLmRpdignLmV5ZWxpZC5sb3dlcicsIHtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlcy5leWVsaWQsIHN0eWxlcy5sb3dlciksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdKSxcbiAgICAgICAgICAgIGRvbV8xLmRpdignLmV5ZS5yaWdodCcsIHtcbiAgICAgICAgICAgICAgICBzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgc3R5bGVzLmV5ZSwgc3R5bGVzLnJpZ2h0KSxcbiAgICAgICAgICAgIH0sIFtcbiAgICAgICAgICAgICAgICBkb21fMS5kaXYoJy5leWVsaWQudXBwZXInLCB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiBPYmplY3QuYXNzaWduKHt9LCBzdHlsZXMuZXllbGlkLCBzdHlsZXMudXBwZXIpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgIGRvbV8xLmRpdignLmV5ZWxpZC5sb3dlcicsIHtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlcy5leWVsaWQsIHN0eWxlcy5sb3dlciksXG4gICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICBdKSxcbiAgICAgICAgXSkpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgRE9NOiBhZGFwdF8xLmFkYXB0KHZkb20kKSxcbiAgICAgICAgICAgIGFuaW1hdGlvbkZpbmlzaDogYWRhcHRfMS5hZGFwdChhbmltYXRpb25GaW5pc2gkJC5mbGF0dGVuKCkpLFxuICAgICAgICAgICAgbG9hZDogYWRhcHRfMS5hZGFwdChsb2FkJCksXG4gICAgICAgIH07XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZVRhYmxldEZhY2VEcml2ZXIgPSBtYWtlVGFibGV0RmFjZURyaXZlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1ha2VUYWJsZXRGYWNlRHJpdmVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcm9vdDtcbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByb290ID0gc2VsZjtcbn1cbmVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IHdpbmRvdztcbn1cbmVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IGdsb2JhbDtcbn1cbmVsc2Uge1xuICAgIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxudmFyIFN5bWJvbCA9IHJvb3QuU3ltYm9sO1xudmFyIHBhcmVudFN5bWJvbDtcbmlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcGFyZW50U3ltYm9sID0gU3ltYm9sKCdwYXJlbnQnKTtcbn1cbmVsc2Uge1xuICAgIHBhcmVudFN5bWJvbCA9ICdAQHNuYWJiZG9tLXNlbGVjdG9yLXBhcmVudCc7XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBwYXJlbnRTeW1ib2w7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wYXJlbnQtc3ltYm9sLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9wb255ZmlsbCA9IHJlcXVpcmUoJy4vcG9ueWZpbGwuanMnKTtcblxudmFyIF9wb255ZmlsbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wb255ZmlsbCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIHJvb3Q7IC8qIGdsb2JhbCB3aW5kb3cgKi9cblxuXG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gbW9kdWxlO1xufSBlbHNlIHtcbiAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG5cbnZhciByZXN1bHQgPSAoMCwgX3BvbnlmaWxsMlsnZGVmYXVsdCddKShyb290KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHJlc3VsdDsiXX0=

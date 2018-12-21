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

},{"@cycle-robot-drivers/action":1,"@cycle/run/lib/adapt":32,"xstream":75,"xstream/extra/dropRepeats":73}],5:[function(require,module,exports){
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
                                ? dom_1.span(inputValue.goal.value.map(function (text) { return dom_1.button('.choice', text); })) : ''
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

},{"@cycle-robot-drivers/action":1,"@cycle/dom":23,"@cycle/isolate":9,"@cycle/run/lib/adapt":32,"xstream":75}],6:[function(require,module,exports){
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
                state: State.RUNNING,
                variables: variables,
                outputs: {
                    RobotSpeechbubble: { goal: null },
                    HumanSpeechbubble: { goal: null },
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

},{"./SpeechbubbleAction":5,"@cycle-robot-drivers/action":1,"@cycle/dom":23,"@cycle/isolate":9,"@cycle/run/lib/adapt":32,"xstream":75}],7:[function(require,module,exports){
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

},{"./FacialExpressionAction":4,"./SpeechbubbleAction":5,"./TwoSpeechbubblesAction":6,"./makeTabletFaceDriver":8}],8:[function(require,module,exports){
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

},{"@cycle/dom":23,"@cycle/run/lib/adapt":32,"xstream":75}],9:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":32,"xstream":75}],10:[function(require,module,exports){
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

},{"./fromEvent":21,"@cycle/run/lib/adapt":32,"xstream":75}],11:[function(require,module,exports){
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

},{"./fromEvent":21,"@cycle/run/lib/adapt":32,"xstream":75}],12:[function(require,module,exports){
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

},{"./ScopeChecker":18,"./utils":29}],13:[function(require,module,exports){
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

},{"./ElementFinder":12,"./PriorityQueue":16,"./RemovalSet":17,"./ScopeChecker":18,"./SymbolTree":19,"./fromEvent":21,"./utils":29,"xstream":75}],14:[function(require,module,exports){
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

},{"./SymbolTree":19,"./utils":29}],15:[function(require,module,exports){
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

},{"./BodyDOMSource":10,"./DocumentDOMSource":11,"./ElementFinder":12,"./isolate":24,"@cycle/run/lib/adapt":32}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
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

},{"./utils":29}],19:[function(require,module,exports){
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

},{}],20:[function(require,module,exports){
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

},{"./utils":29,"snabbdom-selector":48,"snabbdom/h":52,"snabbdom/vnode":63}],21:[function(require,module,exports){
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

},{"xstream":75}],22:[function(require,module,exports){
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

},{"snabbdom/h":52}],23:[function(require,module,exports){
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

},{"./MainDOMSource":15,"./hyperscript-helpers":22,"./makeDOMDriver":25,"./mockDOMSource":26,"./thunk":28,"snabbdom/h":52}],24:[function(require,module,exports){
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

},{"./utils":29}],25:[function(require,module,exports){
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

},{"./EventDelegator":13,"./IsolateModule":14,"./MainDOMSource":15,"./VNodeWrapper":20,"./modules":27,"./utils":29,"snabbdom":60,"snabbdom/tovnode":62,"xstream":75,"xstream/extra/concat":71,"xstream/extra/sampleCombine":74}],26:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":32,"xstream":75}],27:[function(require,module,exports){
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

},{"snabbdom/modules/attributes":55,"snabbdom/modules/class":56,"snabbdom/modules/dataset":57,"snabbdom/modules/props":58,"snabbdom/modules/style":59}],28:[function(require,module,exports){
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

},{"snabbdom/h":52}],29:[function(require,module,exports){
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

},{}],30:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"@cycle/run/lib/adapt":31,"dup":9,"xstream":75}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
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

},{"./internals":35}],35:[function(require,module,exports){
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

},{"./adapt":33,"quicktask":44,"xstream":75}],36:[function(require,module,exports){
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

},{"./pickCombine":39,"./pickMerge":40,"@cycle/isolate":30,"@cycle/run/lib/adapt":42,"xstream":75}],37:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":42,"xstream/extra/dropRepeats":73}],38:[function(require,module,exports){
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

},{"./Collection":36,"./StateSource":37,"./withState":41}],39:[function(require,module,exports){
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

},{"xstream":75}],40:[function(require,module,exports){
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

},{"xstream":75}],41:[function(require,module,exports){
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

},{"./StateSource":37,"quicktask":44,"xstream":75,"xstream/extra/concat":71}],42:[function(require,module,exports){
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

},{}],44:[function(require,module,exports){
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

},{"_process":43,"timers":66}],45:[function(require,module,exports){
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

},{"./selectorParser":51}],46:[function(require,module,exports){
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

},{}],47:[function(require,module,exports){
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

},{"./parent-symbol":49,"./query":50}],48:[function(require,module,exports){
"use strict";
var curry2_1 = require('./curry2');
var findMatches_1 = require('./findMatches');
exports.select = curry2_1.curry2(findMatches_1.findMatches);
var selectorParser_1 = require('./selectorParser');
exports.selectorParser = selectorParser_1.selectorParser;
var classNameFromVNode_1 = require('./classNameFromVNode');
exports.classNameFromVNode = classNameFromVNode_1.classNameFromVNode;

},{"./classNameFromVNode":45,"./curry2":46,"./findMatches":47,"./selectorParser":51}],49:[function(require,module,exports){
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

},{}],50:[function(require,module,exports){
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

},{"./classNameFromVNode":45,"./parent-symbol":49,"./selectorParser":51,"tree-selector":67}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
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

},{"./is":54,"./vnode":63}],53:[function(require,module,exports){
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

},{}],54:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;

},{}],55:[function(require,module,exports){
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

},{}],56:[function(require,module,exports){
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

},{}],57:[function(require,module,exports){
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

},{}],58:[function(require,module,exports){
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

},{}],59:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;
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

},{}],60:[function(require,module,exports){
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

},{"./h":52,"./htmldomapi":53,"./is":54,"./thunk":61,"./vnode":63}],61:[function(require,module,exports){
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

},{"./h":52}],62:[function(require,module,exports){
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

},{"./htmldomapi":53,"./vnode":63}],63:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
exports.default = vnode;

},{}],64:[function(require,module,exports){
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

},{"./ponyfill.js":65}],65:[function(require,module,exports){
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
},{}],66:[function(require,module,exports){
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

},{"process/browser.js":43,"timers":66}],67:[function(require,module,exports){
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

},{"./matches":68,"./querySelector":69,"./selectorParser":70}],68:[function(require,module,exports){
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

},{"./selectorParser":70}],69:[function(require,module,exports){
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

},{"./matches":68,"./selectorParser":70}],70:[function(require,module,exports){
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

},{}],71:[function(require,module,exports){
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

},{"../index":75}],72:[function(require,module,exports){
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

},{"../index":75}],73:[function(require,module,exports){
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

},{"../index":75}],74:[function(require,module,exports){
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

},{"../index":75}],75:[function(require,module,exports){
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

},{"symbol-observable":64}],76:[function(require,module,exports){
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
var delay_1 = __importDefault(require("xstream/extra/delay"));
var dom_1 = require("@cycle/dom");
var screen_1 = require("@cycle-robot-drivers/screen");
function RobotApp(sources) {
    var facialExpressionAction = screen_1.FacialExpressionAction({
        goal: xstream_1.default.of('happy').compose(delay_1.default(1000)),
        TabletFace: sources.TabletFace,
    });
    var twoSpeechbubblesAction = screen_1.TwoSpeechbubblesAction({
        goal: xstream_1.default.of('Hello!').compose(delay_1.default(1000)),
        DOM: sources.DOM,
    });
    var reducer$ = xstream_1.default.merge(xstream_1.default.of(function (prev) { return ({
        FacialExpressionAction: { result: null },
        TwoSpeechbubblesAction: { result: null },
    }); }), facialExpressionAction.result.map(function (result) {
        return function (prev) { return (__assign({}, prev, { FacialExpressionAction: { result: result } })); };
    }), twoSpeechbubblesAction.result.map(function (result) {
        return function (prev) { return (__assign({}, prev, { TwoSpeechbubblesAction: { result: result } })); };
    }));
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

},{"@cycle-robot-drivers/screen":7,"@cycle/dom":23,"xstream":75,"xstream/extra/delay":72}],77:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dom_1 = require("@cycle/dom");
var state_1 = require("@cycle/state");
var run_1 = require("@cycle/run");
var screen_1 = require("@cycle-robot-drivers/screen");
var RobotApp_1 = __importDefault(require("./RobotApp"));
var main = state_1.withState(RobotApp_1.default);
run_1.run(main, {
    DOM: dom_1.makeDOMDriver('#app'),
    TabletFace: screen_1.makeTabletFaceDriver(),
});

},{"./RobotApp":76,"@cycle-robot-drivers/screen":7,"@cycle/dom":23,"@cycle/run":34,"@cycle/state":38}]},{},[77])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdHlwZXMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvc2NyZWVuL2xpYi9janMvRmFjaWFsRXhwcmVzc2lvbkFjdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUtcm9ib3QtZHJpdmVycy9zY3JlZW4vbGliL2Nqcy9TcGVlY2hidWJibGVBY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvc2NyZWVuL2xpYi9janMvVHdvU3BlZWNoYnViYmxlc0FjdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUtcm9ib3QtZHJpdmVycy9zY3JlZW4vbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUtcm9ib3QtZHJpdmVycy9zY3JlZW4vbGliL2Nqcy9tYWtlVGFibGV0RmFjZURyaXZlci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUtcm9ib3QtZHJpdmVycy9zY3JlZW4vbm9kZV9tb2R1bGVzL0BjeWNsZS9pc29sYXRlL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0JvZHlET01Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0RvY3VtZW50RE9NU291cmNlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9FbGVtZW50RmluZGVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9FdmVudERlbGVnYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvSXNvbGF0ZU1vZHVsZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvTWFpbkRPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvUHJpb3JpdHlRdWV1ZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvUmVtb3ZhbFNldC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvU2NvcGVDaGVja2VyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9TeW1ib2xUcmVlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9WTm9kZVdyYXBwZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL2Zyb21FdmVudC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaHlwZXJzY3JpcHQtaGVscGVycy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL2lzb2xhdGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21ha2VET01Ecml2ZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21vY2tET01Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21vZHVsZXMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL3RodW5rLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvaXNvbGF0ZS9ub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW50ZXJuYWxzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL0NvbGxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvU3RhdGVTb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvcGlja0NvbWJpbmUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvcGlja01lcmdlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL3dpdGhTdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvc3RhdGUvbm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9xdWlja3Rhc2svaW5kZXguanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL2NsYXNzTmFtZUZyb21WTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvY3VycnkyLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9maW5kTWF0Y2hlcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL3BhcmVudC1zeW1ib2wuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL3F1ZXJ5LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9zZWxlY3RvclBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9oLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL2h0bWxkb21hcGkuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vaXMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvY2xhc3MuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9kYXRhc2V0LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvcHJvcHMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9zdHlsZS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9zbmFiYmRvbS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS90aHVuay5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS90b3Zub2RlLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3Zub2RlLmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zeW1ib2wtb2JzZXJ2YWJsZS9saWIvcG9ueWZpbGwuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdHJlZS1zZWxlY3Rvci9saWIvY2pzL21hdGNoZXMuanMiLCJub2RlX21vZHVsZXMvdHJlZS1zZWxlY3Rvci9saWIvY2pzL3F1ZXJ5U2VsZWN0b3IuanMiLCJub2RlX21vZHVsZXMvdHJlZS1zZWxlY3Rvci9saWIvY2pzL3NlbGVjdG9yUGFyc2VyLmpzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2NvbmNhdC50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9kZWxheS50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9kcm9wUmVwZWF0cy50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9zYW1wbGVDb21iaW5lLnRzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2luZGV4LnRzIiwic3JjL1JvYm90QXBwLnRzIiwic3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QyxVQUFVLENBQUMsR0FBRyxDQUN2QixDQUFDLEdBQUcsQ0FBQyxVQUFDLEVBQXFCO1lBQXBCLHFCQUFhLEVBQUUsWUFBSTtRQUN6QixPQUFBLFNBQUcsQ0FBQztZQUNGLEtBQUssRUFBRSxFQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUM7U0FDOUIsRUFBRSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUZ6QixDQUV5QixDQUMxQixDQUFDO0lBRUYsT0FBTztRQUNMLEdBQUcsRUFBRSxLQUFLO1FBQ1YsVUFBVSxFQUFFLHNCQUFzQixDQUFDLE1BQU07UUFDekMsS0FBSyxFQUFFLFFBQVE7S0FDaEIsQ0FBQztBQUNKLENBQUM7QUFuQ0QsMkJBbUNDOzs7Ozs7OztBQ25FRCxrQ0FBeUM7QUFDekMsc0NBQXVDO0FBQ3ZDLGtDQUErQjtBQUMvQixzREFBaUU7QUFDakUsd0RBQWtDO0FBRWxDLElBQU0sSUFBSSxHQUFHLGlCQUFTLENBQUMsa0JBQVEsQ0FBQyxDQUFDO0FBRWpDLFNBQUcsQ0FBQyxJQUFJLEVBQUU7SUFDUixHQUFHLEVBQUUsbUJBQWEsQ0FBQyxNQUFNLENBQUM7SUFDMUIsVUFBVSxFQUFFLDZCQUFvQixFQUFFO0NBQ25DLENBQUMsQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHR5cGVzXzEgPSByZXF1aXJlKFwiLi90eXBlc1wiKTtcbmV4cG9ydHMuU3RhdHVzID0gdHlwZXNfMS5TdGF0dXM7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuZXhwb3J0cy5nZW5lcmF0ZUdvYWxJRCA9IHV0aWxzXzEuZ2VuZXJhdGVHb2FsSUQ7XG5leHBvcnRzLmluaXRHb2FsID0gdXRpbHNfMS5pbml0R29hbDtcbmV4cG9ydHMuaXNFcXVhbCA9IHV0aWxzXzEuaXNFcXVhbDtcbmV4cG9ydHMuaXNFcXVhbEdvYWwgPSB1dGlsc18xLmlzRXF1YWxHb2FsO1xuZXhwb3J0cy5pc0VxdWFsUmVzdWx0ID0gdXRpbHNfMS5pc0VxdWFsUmVzdWx0O1xuZXhwb3J0cy5wb3dlcnVwID0gdXRpbHNfMS5wb3dlcnVwO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU3RhdHVzO1xuKGZ1bmN0aW9uIChTdGF0dXMpIHtcbiAgICBTdGF0dXNbXCJBQ1RJVkVcIl0gPSBcIkFDVElWRVwiO1xuICAgIFN0YXR1c1tcIlBSRUVNUFRFRFwiXSA9IFwiUFJFRU1QVEVEXCI7XG4gICAgU3RhdHVzW1wiU1VDQ0VFREVEXCJdID0gXCJTVUNDRUVERURcIjtcbiAgICBTdGF0dXNbXCJBQk9SVEVEXCJdID0gXCJBQk9SVEVEXCI7XG59KShTdGF0dXMgPSBleHBvcnRzLlN0YXR1cyB8fCAoZXhwb3J0cy5TdGF0dXMgPSB7fSkpO1xuO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dHlwZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19yZXN0ID0gKHRoaXMgJiYgdGhpcy5fX3Jlc3QpIHx8IGZ1bmN0aW9uIChzLCBlKSB7XG4gICAgdmFyIHQgPSB7fTtcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcbiAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMClcbiAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xuICAgIHJldHVybiB0O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdlbmVyYXRlR29hbElEKCkge1xuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YW1wOiBub3csXG4gICAgICAgIGlkOiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMikgKyBcIi1cIiArIG5vdy5nZXRUaW1lKCksXG4gICAgfTtcbn1cbmV4cG9ydHMuZ2VuZXJhdGVHb2FsSUQgPSBnZW5lcmF0ZUdvYWxJRDtcbmZ1bmN0aW9uIGluaXRHb2FsKGdvYWwsIGlzR29hbCkge1xuICAgIGlmIChpc0dvYWwgPT09IHZvaWQgMCkgeyBpc0dvYWwgPSBmdW5jdGlvbiAoZykgeyByZXR1cm4gISFnLmdvYWxfaWQ7IH07IH1cbiAgICByZXR1cm4gaXNHb2FsKGdvYWwpID8gZ29hbCA6IHtcbiAgICAgICAgZ29hbF9pZDogZ2VuZXJhdGVHb2FsSUQoKSxcbiAgICAgICAgZ29hbDogZ29hbCxcbiAgICB9O1xufVxuZXhwb3J0cy5pbml0R29hbCA9IGluaXRHb2FsO1xuZnVuY3Rpb24gaXNFcXVhbChmaXJzdCwgc2Vjb25kKSB7XG4gICAgaWYgKCFmaXJzdCB8fCAhc2Vjb25kKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIChmaXJzdC5zdGFtcCA9PT0gc2Vjb25kLnN0YW1wICYmIGZpcnN0LmlkID09PSBzZWNvbmQuaWQpO1xufVxuZXhwb3J0cy5pc0VxdWFsID0gaXNFcXVhbDtcbmZ1bmN0aW9uIGlzRXF1YWxHb2FsKGZpcnN0LCBzZWNvbmQpIHtcbiAgICBpZiAoIWZpcnN0IHx8ICFzZWNvbmQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gaXNFcXVhbChmaXJzdC5nb2FsX2lkLCBzZWNvbmQuZ29hbF9pZCk7XG59XG5leHBvcnRzLmlzRXF1YWxHb2FsID0gaXNFcXVhbEdvYWw7XG5mdW5jdGlvbiBpc0VxdWFsUmVzdWx0KGZpcnN0LCBzZWNvbmQpIHtcbiAgICBpZiAoIWZpcnN0IHx8ICFzZWNvbmQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gKGlzRXF1YWwoZmlyc3Quc3RhdHVzLmdvYWxfaWQsIHNlY29uZC5zdGF0dXMuZ29hbF9pZClcbiAgICAgICAgJiYgZmlyc3Quc3RhdHVzLnN0YXR1cyA9PT0gc2Vjb25kLnN0YXR1cy5zdGF0dXMpO1xufVxuZXhwb3J0cy5pc0VxdWFsUmVzdWx0ID0gaXNFcXVhbFJlc3VsdDtcbmZ1bmN0aW9uIHBvd2VydXAobWFpbiwgY29ubmVjdCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoc291cmNlcykge1xuICAgICAgICB2YXIgc2lua3MgPSBtYWluKHNvdXJjZXMpO1xuICAgICAgICBPYmplY3Qua2V5cyhzb3VyY2VzLnByb3hpZXMpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICBjb25uZWN0KHNvdXJjZXMucHJveGllc1trZXldLCBzaW5rcy50YXJnZXRzW2tleV0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHRhcmdldHMgPSBzaW5rcy50YXJnZXRzLCBzaW5rc1dpdGhvdXRUYXJnZXRzID0gX19yZXN0KHNpbmtzLCBbXCJ0YXJnZXRzXCJdKTtcbiAgICAgICAgcmV0dXJuIHNpbmtzV2l0aG91dFRhcmdldHM7XG4gICAgfTtcbn1cbmV4cG9ydHMucG93ZXJ1cCA9IHBvd2VydXA7XG4vLyMgc291cmNlTWFwcGluZ1VSTD11dGlscy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbVwiKSk7XG52YXIgZHJvcFJlcGVhdHNfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0c1wiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBhY3Rpb25fMSA9IHJlcXVpcmUoXCJAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb25cIik7XG47XG4vKipcbiAqIEZhY2lhbEV4cHJlc3Npb24gYWN0aW9uIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gc291cmNlc1xuICpcbiAqICAgKiBnb2FsOiBhIHN0cmVhbSBvZiBgbnVsbGAgKGFzIFwiY2FuY2VsXCIpIG9yIGEgc3RyaW5nICdgaGFwcHknYCwgJ2BzYWQnYCxcbiAqICAgICAnYGFuZ3J5J2AsICdgZm9jdXNlZCdgLCBvciAnYGNvbmZ1c2VkJ2AgKGFzIHRoZSBUYWJsZXRGYWNlIGRyaXZlcidzXG4gKiAgICAgYEVYUFJFU1NgIHR5cGUgY29tbWFuZCB2YWx1ZSkuXG4gKiAgICogRE9NOiBDeWNsZS5qcyBbRE9NU291cmNlXShodHRwczovL2N5Y2xlLmpzLm9yZy9hcGkvZG9tLmh0bWwpLlxuICpcbiAqIEByZXR1cm4gc2lua3NcbiAqXG4gKiAgICogb3V0cHV0OiBhIHN0cmVhbSBmb3IgdGhlIFRhYmxldEZhY2UgZHJpdmVyLlxuICogICAqIHN0YXR1czogZGVwcmVjaWF0ZWQuXG4gKiAgICogcmVzdWx0OiBhIHN0cmVhbSBvZiBhY3Rpb24gcmVzdWx0cy4gYHJlc3VsdC5yZXN1bHRgIGlzIGFsd2F5cyBgbnVsbGAuXG4gKlxuICovXG5mdW5jdGlvbiBGYWNpYWxFeHByZXNzaW9uQWN0aW9uKHNvdXJjZXMpIHtcbiAgICB2YXIgZ29hbCQgPSB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLmdvYWwpLmZpbHRlcihmdW5jdGlvbiAoZ29hbCkgeyByZXR1cm4gdHlwZW9mIGdvYWwgIT09ICd1bmRlZmluZWQnOyB9KS5tYXAoZnVuY3Rpb24gKGdvYWwpIHtcbiAgICAgICAgaWYgKGdvYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0NBTkNFTCcsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gISFnb2FsLmdvYWxfaWQgPyBnb2FsIDogYWN0aW9uXzEuaW5pdEdvYWwoZ29hbCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdHT0FMJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogdHlwZW9mIHZhbHVlLmdvYWwgPT09ICdzdHJpbmcnID8ge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBnb2FsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB2YWx1ZS5nb2FsLFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSA6IHZhbHVlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHZhciBhY3Rpb24kID0geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoZ29hbCQsIHNvdXJjZXMuVGFibGV0RmFjZS5hbmltYXRpb25GaW5pc2gubWFwVG8oe1xuICAgICAgICB0eXBlOiAnRU5EJyxcbiAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgfSkpO1xuICAgIHZhciBpbml0aWFsU3RhdGUgPSB7XG4gICAgICAgIGdvYWw6IG51bGwsXG4gICAgICAgIGdvYWxfaWQ6IGFjdGlvbl8xLmdlbmVyYXRlR29hbElEKCksXG4gICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCxcbiAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgIH07XG4gICAgdmFyIHN0YXRlJCA9IGFjdGlvbiQuZm9sZChmdW5jdGlvbiAoc3RhdGUsIGFjdGlvbikge1xuICAgICAgICAvLyBjb25zb2xlLmRlYnVnKCdzdGF0ZScsIHN0YXRlLCAnYWN0aW9uJywgYWN0aW9uKTtcbiAgICAgICAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRFxuICAgICAgICAgICAgfHwgc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVEXG4gICAgICAgICAgICB8fCBzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5BQk9SVEVEKSB7XG4gICAgICAgICAgICBpZiAoYWN0aW9uLnR5cGUgPT09ICdHT0FMJykge1xuICAgICAgICAgICAgICAgIHZhciBnb2FsID0gYWN0aW9uLnZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGdvYWwuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgZ29hbDogZ29hbC5nb2FsLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5BQ1RJVkUsXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYWN0aW9uLnR5cGUgPT09ICdDQU5DRUwnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZygnSWdub3JlIENBTkNFTCBpbiBET05FIHN0YXRlcycpO1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5BQ1RJVkUpIHtcbiAgICAgICAgICAgIGlmIChhY3Rpb24udHlwZSA9PT0gJ0dPQUwnKSB7XG4gICAgICAgICAgICAgICAgc3RhdGUkLnNoYW1lZnVsbHlTZW5kTmV4dChfX2Fzc2lnbih7fSwgc3RhdGUsIHsgZ29hbDogbnVsbCwgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVEIH0pKTtcbiAgICAgICAgICAgICAgICB2YXIgZ29hbCA9IGFjdGlvbi52YWx1ZTtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBnb2FsLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIGdvYWw6IGdvYWwuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuQUNUSVZFLFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbi50eXBlID09PSAnRU5EJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfX2Fzc2lnbih7fSwgc3RhdGUsIHsgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVELCByZXN1bHQ6IGFjdGlvbi52YWx1ZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGFjdGlvbi50eXBlID09PSAnQ0FOQ0VMJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfX2Fzc2lnbih7fSwgc3RhdGUsIHsgZ29hbDogbnVsbCwgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVEIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJVbmhhbmRsZWQgc3RhdGUuc3RhdHVzIFwiICsgc3RhdGUuc3RhdHVzICsgXCIgYWN0aW9uLnR5cGUgXCIgKyBhY3Rpb24udHlwZSk7XG4gICAgICAgIHJldHVybiBzdGF0ZTtcbiAgICB9LCBpbml0aWFsU3RhdGUpO1xuICAgIHZhciBzdGF0ZVN0YXR1c0NoYW5nZWQkID0gc3RhdGUkXG4gICAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzXzEuZGVmYXVsdChmdW5jdGlvbiAoeCwgeSkgeyByZXR1cm4gKHguc3RhdHVzID09PSB5LnN0YXR1cyAmJiBhY3Rpb25fMS5pc0VxdWFsKHguZ29hbF9pZCwgeS5nb2FsX2lkKSk7IH0pKTtcbiAgICB2YXIgdmFsdWUkID0gc3RhdGVTdGF0dXNDaGFuZ2VkJFxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICByZXR1cm4gc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuQUNUSVZFIHx8IHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRDtcbiAgICB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgICBpZiAoc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuQUNUSVZFKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdFWFBSRVNTJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogc3RhdGUuZ29hbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7IC8vIHN0YXRlLnN0YXR1cyA9PT0gU3RhdHVzLlBSRUVNUFRFRFxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICB2YXIgc3RhdHVzJCA9IHN0YXRlU3RhdHVzQ2hhbmdlZCRcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuICh7XG4gICAgICAgIGdvYWxfaWQ6IHN0YXRlLmdvYWxfaWQsXG4gICAgICAgIHN0YXR1czogc3RhdGUuc3RhdHVzLFxuICAgIH0pOyB9KTtcbiAgICB2YXIgcmVzdWx0JCA9IHN0YXRlU3RhdHVzQ2hhbmdlZCRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuIChzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERURcbiAgICAgICAgfHwgc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVEXG4gICAgICAgIHx8IHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLkFCT1JURUQpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChzdGF0ZSkgeyByZXR1cm4gKHtcbiAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICBnb2FsX2lkOiBzdGF0ZS5nb2FsX2lkLFxuICAgICAgICAgICAgc3RhdHVzOiBzdGF0ZS5zdGF0dXMsXG4gICAgICAgIH0sXG4gICAgICAgIHJlc3VsdDogc3RhdGUucmVzdWx0LFxuICAgIH0pOyB9KTtcbiAgICAvLyBJTVBPUlRBTlQhISBlbXB0eSB0aGUgc3RyZWFtcyBtYW51YWxseTsgb3RoZXJ3aXNlIGl0IGVtaXRzIHRoZSBmaXJzdFxuICAgIC8vICAgXCJTVUNDRUVERURcIiByZXN1bHRcbiAgICB2YWx1ZSQuYWRkTGlzdGVuZXIoeyBuZXh0OiBmdW5jdGlvbiAoKSB7IH0gfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb3V0cHV0OiBhZGFwdF8xLmFkYXB0KHZhbHVlJCksXG4gICAgICAgIHN0YXR1czogYWRhcHRfMS5hZGFwdChzdGF0dXMkKSxcbiAgICAgICAgcmVzdWx0OiBhZGFwdF8xLmFkYXB0KHJlc3VsdCQpLFxuICAgIH07XG59XG5leHBvcnRzLkZhY2lhbEV4cHJlc3Npb25BY3Rpb24gPSBGYWNpYWxFeHByZXNzaW9uQWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RmFjaWFsRXhwcmVzc2lvbkFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgaXNvbGF0ZV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJAY3ljbGUvaXNvbGF0ZVwiKSk7XG52YXIgZG9tXzEgPSByZXF1aXJlKFwiQGN5Y2xlL2RvbVwiKTtcbnZhciBhY3Rpb25fMSA9IHJlcXVpcmUoXCJAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb25cIik7XG52YXIgU3RhdGU7XG4oZnVuY3Rpb24gKFN0YXRlKSB7XG4gICAgU3RhdGVbXCJSVU5OSU5HXCJdID0gXCJSVU5OSU5HXCI7XG4gICAgU3RhdGVbXCJET05FXCJdID0gXCJET05FXCI7XG59KShTdGF0ZSB8fCAoU3RhdGUgPSB7fSkpO1xudmFyIElucHV0VHlwZTtcbihmdW5jdGlvbiAoSW5wdXRUeXBlKSB7XG4gICAgSW5wdXRUeXBlW1wiR09BTFwiXSA9IFwiR09BTFwiO1xuICAgIElucHV0VHlwZVtcIkNBTkNFTFwiXSA9IFwiQ0FOQ0VMXCI7XG4gICAgSW5wdXRUeXBlW1wiQ0xJQ0tcIl0gPSBcIkNMSUNLXCI7XG59KShJbnB1dFR5cGUgfHwgKElucHV0VHlwZSA9IHt9KSk7XG52YXIgU3BlZWNoYnViYmxlVHlwZTtcbihmdW5jdGlvbiAoU3BlZWNoYnViYmxlVHlwZSkge1xuICAgIFNwZWVjaGJ1YmJsZVR5cGVbXCJNRVNTQUdFXCJdID0gXCJNRVNTQUdFXCI7XG4gICAgU3BlZWNoYnViYmxlVHlwZVtcIkNIT0lDRVwiXSA9IFwiQ0hPSUNFXCI7XG59KShTcGVlY2hidWJibGVUeXBlID0gZXhwb3J0cy5TcGVlY2hidWJibGVUeXBlIHx8IChleHBvcnRzLlNwZWVjaGJ1YmJsZVR5cGUgPSB7fSkpO1xuZnVuY3Rpb24gaW5wdXQoZ29hbCQsIGNsaWNrRXZlbnQkKSB7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGdvYWwkLmZpbHRlcihmdW5jdGlvbiAoZ29hbCkgeyByZXR1cm4gdHlwZW9mIGdvYWwgIT09ICd1bmRlZmluZWQnOyB9KS5tYXAoZnVuY3Rpb24gKGdvYWwpIHtcbiAgICAgICAgaWYgKGdvYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogSW5wdXRUeXBlLkNBTkNFTCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSAhIWdvYWwuZ29hbF9pZCA/IGdvYWwgOiBhY3Rpb25fMS5pbml0R29hbChnb2FsKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogSW5wdXRUeXBlLkdPQUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHR5cGVvZiB2YWx1ZS5nb2FsID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiB7IHR5cGU6IFNwZWVjaGJ1YmJsZVR5cGUuTUVTU0FHRSwgdmFsdWU6IHZhbHVlLmdvYWwgfSxcbiAgICAgICAgICAgICAgICAgICAgfSA6IEFycmF5LmlzQXJyYXkodmFsdWUuZ29hbClcbiAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogeyB0eXBlOiBTcGVlY2hidWJibGVUeXBlLkNIT0lDRSwgdmFsdWU6IHZhbHVlLmdvYWwgfSxcbiAgICAgICAgICAgICAgICAgICAgfSA6IHZhbHVlLmdvYWwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSksIGNsaWNrRXZlbnQkLm1hcChmdW5jdGlvbiAoZXZlbnQpIHsgcmV0dXJuICh7XG4gICAgICAgIHR5cGU6IElucHV0VHlwZS5DTElDSyxcbiAgICAgICAgdmFsdWU6IGV2ZW50LnRhcmdldC50ZXh0Q29udGVudFxuICAgIH0pOyB9KSk7XG59XG5mdW5jdGlvbiBjcmVhdGVUcmFuc2l0aW9uKCkge1xuICAgIHZhciBzdHlsZXMgPSB7XG4gICAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgICAgIGZvbnRGYW1pbHk6ICdoZWx2ZXRpY2EnLFxuICAgICAgICAgICAgZm9udFNpemU6ICczZW0nLFxuICAgICAgICAgICAgZm9udFdlaWdodDogJ2xpZ2h0ZXInLFxuICAgICAgICB9LFxuICAgICAgICBidXR0b246IHtcbiAgICAgICAgICAgIG1hcmdpbjogJzAgMC4yNWVtIDAgMC4yNWVtJyxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgICAgIGJvcmRlcjogJzAuMDVlbSBzb2xpZCBibGFjaycsXG4gICAgICAgICAgICBmb250RmFtaWx5OiAnaGVsdmV0aWNhJyxcbiAgICAgICAgICAgIGZvbnRTaXplOiAnMi41ZW0nLFxuICAgICAgICAgICAgZm9udFdlaWdodDogJ2xpZ2h0ZXInLFxuICAgICAgICB9LFxuICAgIH07XG4gICAgdmFyIHRyYW5zaXRpb25UYWJsZSA9IChfYSA9IHt9LFxuICAgICAgICBfYVtTdGF0ZS5ET05FXSA9IChfYiA9IHt9LFxuICAgICAgICAgICAgX2JbSW5wdXRUeXBlLkdPQUxdID0gZnVuY3Rpb24gKHZhcmlhYmxlcywgaW5wdXRWYWx1ZSkgeyByZXR1cm4gKHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuUlVOTklORyxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXRWYWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIERPTToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuTUVTU0FHRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gZG9tXzEuc3Bhbih7IHN0eWxlOiBzdHlsZXMubWVzc2FnZSB9LCBpbnB1dFZhbHVlLmdvYWwudmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBpbnB1dFZhbHVlLmdvYWwudHlwZSA9PT0gU3BlZWNoYnViYmxlVHlwZS5DSE9JQ0VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBkb21fMS5zcGFuKGlucHV0VmFsdWUuZ29hbC52YWx1ZS5tYXAoZnVuY3Rpb24gKHRleHQpIHsgcmV0dXJuIGRvbV8xLmJ1dHRvbignLmNob2ljZScsIHsgc3R5bGU6IHN0eWxlcy5idXR0b24gfSwgdGV4dCk7IH0pKSA6ICcnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pOyB9LFxuICAgICAgICAgICAgX2IpLFxuICAgICAgICBfYVtTdGF0ZS5SVU5OSU5HXSA9IChfYyA9IHt9LFxuICAgICAgICAgICAgX2NbSW5wdXRUeXBlLkdPQUxdID0gZnVuY3Rpb24gKHZhcmlhYmxlcywgaW5wdXRWYWx1ZSkgeyByZXR1cm4gKHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuUlVOTklORyxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXRWYWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIERPTToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuTUVTU0FHRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gZG9tXzEuc3Bhbih7IHN0eWxlOiBzdHlsZXMubWVzc2FnZSB9LCBpbnB1dFZhbHVlLmdvYWwudmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBpbnB1dFZhbHVlLmdvYWwudHlwZSA9PT0gU3BlZWNoYnViYmxlVHlwZS5DSE9JQ0VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBkb21fMS5zcGFuKGlucHV0VmFsdWUuZ29hbC52YWx1ZS5tYXAoZnVuY3Rpb24gKHRleHQpIHsgcmV0dXJuIGRvbV8xLmJ1dHRvbignLmNob2ljZScsIHRleHQpOyB9KSkgOiAnJ1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7IH0sXG4gICAgICAgICAgICBfY1tJbnB1dFR5cGUuQ0FOQ0VMXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHsgcmV0dXJuICh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGdvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIERPTToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogJycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTsgfSxcbiAgICAgICAgICAgIF9jW0lucHV0VHlwZS5DTElDS10gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlcy5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuQ0hPSUNFXG4gICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBET006IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBpbnB1dFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9jKSxcbiAgICAgICAgX2EpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoc3RhdGUsIHZhcmlhYmxlcywgaW5wdXQpIHtcbiAgICAgICAgdmFyIHByZXYgPSB7IHN0YXRlOiBzdGF0ZSwgdmFyaWFibGVzOiB2YXJpYWJsZXMsIG91dHB1dHM6IG51bGwgfTtcbiAgICAgICAgcmV0dXJuICF0cmFuc2l0aW9uVGFibGVbc3RhdGVdXG4gICAgICAgICAgICA/IHByZXZcbiAgICAgICAgICAgIDogIXRyYW5zaXRpb25UYWJsZVtzdGF0ZV1baW5wdXQudHlwZV1cbiAgICAgICAgICAgICAgICA/IHByZXZcbiAgICAgICAgICAgICAgICA6ICh0cmFuc2l0aW9uVGFibGVbc3RhdGVdW2lucHV0LnR5cGVdKHZhcmlhYmxlcywgaW5wdXQudmFsdWUpIHx8IHByZXYpO1xuICAgIH07XG4gICAgdmFyIF9hLCBfYiwgX2M7XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gaW5pdFJlZHVjZXIobWFjaGluZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgIGdvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciB0cmFuc2l0aW9uID0gY3JlYXRlVHJhbnNpdGlvbigpO1xuICAgIHZhciBpbnB1dFJlZHVjZXIkID0gaW5wdXQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiBpbnB1dFJlZHVjZXIobWFjaGluZSkge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihtYWNoaW5lLnN0YXRlLCBtYWNoaW5lLnZhcmlhYmxlcywgaW5wdXQpO1xuICAgIH07IH0pO1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbml0UmVkdWNlciQsIGlucHV0UmVkdWNlciQpO1xufVxuZnVuY3Rpb24gb3V0cHV0KG1hY2hpbmUkKSB7XG4gICAgdmFyIG91dHB1dHMkID0gbWFjaGluZSRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobWFjaGluZSkgeyByZXR1cm4gISFtYWNoaW5lLm91dHB1dHM7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKG1hY2hpbmUpIHsgcmV0dXJuIG1hY2hpbmUub3V0cHV0czsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRE9NOiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiAhIW91dHB1dHMuRE9NOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5ET00uZ29hbDsgfSkuc3RhcnRXaXRoKCcnKSksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChvdXRwdXRzJFxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzLnJlc3VsdDsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIG91dHB1dHMucmVzdWx0OyB9KSksXG4gICAgfTtcbn1cbi8qKlxuICogU3BlZWNoYnViYmxlIGFjdGlvbiBjb21wb25lbnQuXG4gKlxuICogQHBhcmFtIHNvdXJjZXNcbiAqXG4gKiAgICogZ29hbDogYSBzdHJlYW0gb2YgYG51bGxgIChhcyBcImNhbmNlbFwiKSxcbiAqICAgICBge3R5cGU6ICdNRVNTQUdFJywgdmFsdWU6ICdIZWxsbyB3b3JsZCd9YCBvciBgJ0hlbGxvIHdvcmxkJ2AgKGFzXG4gKiAgICAgXCJtZXNzYWdlXCIpLCBvciBge3R5cGU6ICdDSE9JQ0UnLCB2YWx1ZTogWydIZWxsbycsICdXb3JsZCddfWBcbiAqICAgICBvciBgWydIZWxsbycsICdXb3JsZCddYCAoYXMgXCJtdWx0aXBsZSBjaG9pY2VcIikuXG4gKiAgICogRE9NOiBDeWNsZS5qcyBbRE9NU291cmNlXShodHRwczovL2N5Y2xlLmpzLm9yZy9hcGkvZG9tLmh0bWwpLlxuICpcbiAqIEByZXR1cm4gc2lua3NcbiAqXG4gKiAgICogRE9NOiBhIHN0cmVhbSBvZiB2aXJ0dWFsIERPTSBvYmplY3RzLCBpLmUsIFtTbmFiYmRvbSDigJxWTm9kZeKAnSBvYmplY3RzXShodHRwczovL2dpdGh1Yi5jb20vc25hYmJkb20vc25hYmJkb20pLlxuICogICAqIHJlc3VsdDogYSBzdHJlYW0gb2YgYWN0aW9uIHJlc3VsdHMuXG4gKlxuICovXG5mdW5jdGlvbiBTcGVlY2hidWJibGVBY3Rpb24oc291cmNlcykge1xuICAgIHZhciBpbnB1dCQgPSBpbnB1dCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLmdvYWwpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShcbiAgICAvLyBJTVBPUlRBTlQhISBUaGlzIG1ha2VzIHRoZSBjbGljayBzdHJlYW0gYWx3YXlzIGV4aXN0LlxuICAgIHNvdXJjZXMuRE9NLnNlbGVjdCgnLmNob2ljZScpLmVsZW1lbnRzKClcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoYikgeyByZXR1cm4gc291cmNlcy5ET00uc2VsZWN0KCcuY2hvaWNlJykuZXZlbnRzKCdjbGljaycsIHtcbiAgICAgICAgcHJldmVudERlZmF1bHQ6IHRydWVcbiAgICB9KTsgfSlcbiAgICAgICAgLmZsYXR0ZW4oKSkpO1xuICAgIHZhciBtYWNoaW5lJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSk7IC8vIGRyb3AgXCJudWxsXCI7XG4gICAgdmFyIHNpbmtzID0gb3V0cHV0KG1hY2hpbmUkKTtcbiAgICByZXR1cm4gc2lua3M7XG59XG5leHBvcnRzLlNwZWVjaGJ1YmJsZUFjdGlvbiA9IFNwZWVjaGJ1YmJsZUFjdGlvbjtcbmZ1bmN0aW9uIElzb2xhdGVkU3BlZWNoYnViYmxlQWN0aW9uKHNvdXJjZXMpIHtcbiAgICByZXR1cm4gaXNvbGF0ZV8xLmRlZmF1bHQoU3BlZWNoYnViYmxlQWN0aW9uKShzb3VyY2VzKTtcbn1cbmV4cG9ydHMuSXNvbGF0ZWRTcGVlY2hidWJibGVBY3Rpb24gPSBJc29sYXRlZFNwZWVjaGJ1YmJsZUFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNwZWVjaGJ1YmJsZUFjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbVwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBpc29sYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIkBjeWNsZS9pc29sYXRlXCIpKTtcbnZhciBkb21fMSA9IHJlcXVpcmUoXCJAY3ljbGUvZG9tXCIpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciBTcGVlY2hidWJibGVBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1NwZWVjaGJ1YmJsZUFjdGlvblwiKTtcbnZhciBTdGF0ZTtcbihmdW5jdGlvbiAoU3RhdGUpIHtcbiAgICBTdGF0ZVtcIlJVTk5JTkdcIl0gPSBcIlJVTk5JTkdcIjtcbiAgICBTdGF0ZVtcIkRPTkVcIl0gPSBcIkRPTkVcIjtcbiAgICBTdGF0ZVtcIlBSRUVNUFRJTkdcIl0gPSBcIlBSRUVNUFRJTkdcIjtcbn0pKFN0YXRlIHx8IChTdGF0ZSA9IHt9KSk7XG52YXIgSW5wdXRUeXBlO1xuKGZ1bmN0aW9uIChJbnB1dFR5cGUpIHtcbiAgICBJbnB1dFR5cGVbXCJHT0FMXCJdID0gXCJHT0FMXCI7XG4gICAgSW5wdXRUeXBlW1wiQ0FOQ0VMXCJdID0gXCJDQU5DRUxcIjtcbiAgICBJbnB1dFR5cGVbXCJSRVNVTFRcIl0gPSBcIlJFU1VMVFwiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xudmFyIFR3b1NwZWVjaGJ1YmJsZXNUeXBlO1xuKGZ1bmN0aW9uIChUd29TcGVlY2hidWJibGVzVHlwZSkge1xuICAgIFR3b1NwZWVjaGJ1YmJsZXNUeXBlW1wiU0VUX01FU1NBR0VcIl0gPSBcIlNFVF9NRVNTQUdFXCI7XG4gICAgVHdvU3BlZWNoYnViYmxlc1R5cGVbXCJBU0tfUVVFU1RJT05cIl0gPSBcIkFTS19RVUVTVElPTlwiO1xufSkoVHdvU3BlZWNoYnViYmxlc1R5cGUgPSBleHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlIHx8IChleHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlID0ge30pKTtcbmZ1bmN0aW9uIGlucHV0KGdvYWwkLCBodW1hblNwZWVjaGJ1YmJsZVJlc3VsdCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5maWx0ZXIoZnVuY3Rpb24gKGdvYWwpIHsgcmV0dXJuIHR5cGVvZiBnb2FsICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIGlmIChnb2FsID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5DQU5DRUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gISFnb2FsLmdvYWxfaWQgPyBnb2FsIDogYWN0aW9uXzEuaW5pdEdvYWwoZ29hbCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5HT0FMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAhdmFsdWUuZ29hbC50eXBlID8ge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBnb2FsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlb2YgdmFsdWUuZ29hbCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBUd29TcGVlY2hidWJibGVzVHlwZS5BU0tfUVVFU1RJT04sXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gOiB2YWx1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9KSwgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQubWFwKGZ1bmN0aW9uIChyZXN1bHQpIHsgcmV0dXJuICh7XG4gICAgICAgIHR5cGU6IElucHV0VHlwZS5SRVNVTFQsXG4gICAgICAgIHZhbHVlOiByZXN1bHQsXG4gICAgfSk7IH0pKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRyYW5zaXRpb24oKSB7XG4gICAgdmFyIHRyYW5zaXRpb25UYWJsZSA9IChfYSA9IHt9LFxuICAgICAgICBfYVtTdGF0ZS5ET05FXSA9IChfYiA9IHt9LFxuICAgICAgICAgICAgX2JbSW5wdXRUeXBlLkdPQUxdID0gZnVuY3Rpb24gKHZhcmlhYmxlcywgaW5wdXRWYWx1ZSkgeyByZXR1cm4gKHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuUlVOTklORyxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXRWYWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBSb2JvdFNwZWVjaGJ1YmJsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudmFsdWUubWVzc2FnZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgSHVtYW5TcGVlY2hidWJibGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC50eXBlID09PSBUd29TcGVlY2hidWJibGVzVHlwZS5TRVRfTUVTU0FHRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBpbnB1dFZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC52YWx1ZS5jaG9pY2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7IH0sXG4gICAgICAgICAgICBfYiksXG4gICAgICAgIF9hW1N0YXRlLlJVTk5JTkddID0gKF9jID0ge30sXG4gICAgICAgICAgICBfY1tJbnB1dFR5cGUuR09BTF0gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXRWYWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgUm9ib3RTcGVlY2hidWJibGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudHlwZSA9PT0gVHdvU3BlZWNoYnViYmxlc1R5cGUuU0VUX01FU1NBR0UgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnZhbHVlLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEh1bWFuU3BlZWNoYnViYmxlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gbnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC52YWx1ZS5jaG9pY2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX2NbSW5wdXRUeXBlLkNBTkNFTF0gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7IHJldHVybiAoe1xuICAgICAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5SVU5OSU5HLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogdmFyaWFibGVzLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgUm9ib3RTcGVlY2hidWJibGU6IHsgZ29hbDogbnVsbCB9LFxuICAgICAgICAgICAgICAgICAgICBIdW1hblNwZWVjaGJ1YmJsZTogeyBnb2FsOiBudWxsIH0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7IH0sXG4gICAgICAgICAgICBfY1tJbnB1dFR5cGUuUkVTVUxUXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aW9uXzEuaXNFcXVhbChpbnB1dFZhbHVlLnN0YXR1cy5nb2FsX2lkLCB2YXJpYWJsZXMuZ29hbF9pZClcbiAgICAgICAgICAgICAgICAgICAgJiYgdHlwZW9mIGlucHV0VmFsdWUucmVzdWx0ID09PSAnc3RyaW5nJyA/IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFJvYm90U3BlZWNoYnViYmxlOiB7IGdvYWw6IG51bGwgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEh1bWFuU3BlZWNoYnViYmxlOiB7IGdvYWw6IG51bGwgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVELFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBpbnB1dFZhbHVlLnJlc3VsdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSA6IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX2MpLFxuICAgICAgICBfYSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzdGF0ZSwgdmFyaWFibGVzLCBpbnB1dCkge1xuICAgICAgICB2YXIgcHJldiA9IHsgc3RhdGU6IHN0YXRlLCB2YXJpYWJsZXM6IHZhcmlhYmxlcywgb3V0cHV0czogbnVsbCB9O1xuICAgICAgICByZXR1cm4gIXRyYW5zaXRpb25UYWJsZVtzdGF0ZV1cbiAgICAgICAgICAgID8gcHJldlxuICAgICAgICAgICAgOiAhdHJhbnNpdGlvblRhYmxlW3N0YXRlXVtpbnB1dC50eXBlXVxuICAgICAgICAgICAgICAgID8gcHJldlxuICAgICAgICAgICAgICAgIDogKHRyYW5zaXRpb25UYWJsZVtzdGF0ZV1baW5wdXQudHlwZV0odmFyaWFibGVzLCBpbnB1dC52YWx1ZSkgfHwgcHJldik7XG4gICAgfTtcbiAgICB2YXIgX2EsIF9iLCBfYztcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JCkge1xuICAgIHZhciBpbml0UmVkdWNlciQgPSB4c3RyZWFtXzEuZGVmYXVsdC5vZihmdW5jdGlvbiBpbml0UmVkdWNlcihtYWNoaW5lKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0ZTogU3RhdGUuRE9ORSxcbiAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgIGdvYWxfaWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciB0cmFuc2l0aW9uID0gY3JlYXRlVHJhbnNpdGlvbigpO1xuICAgIHZhciBpbnB1dFJlZHVjZXIkID0gaW5wdXQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiBpbnB1dFJlZHVjZXIobWFjaGluZSkge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihtYWNoaW5lLnN0YXRlLCBtYWNoaW5lLnZhcmlhYmxlcywgaW5wdXQpO1xuICAgIH07IH0pO1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbml0UmVkdWNlciQsIGlucHV0UmVkdWNlciQpO1xufVxuZnVuY3Rpb24gb3V0cHV0KG1hY2hpbmUkKSB7XG4gICAgdmFyIG91dHB1dHMkID0gbWFjaGluZSRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobWFjaGluZSkgeyByZXR1cm4gISFtYWNoaW5lLm91dHB1dHM7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKG1hY2hpbmUpIHsgcmV0dXJuIG1hY2hpbmUub3V0cHV0czsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgUm9ib3RTcGVlY2hidWJibGU6IGFkYXB0XzEuYWRhcHQob3V0cHV0cyRcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuICEhb3V0cHV0cy5Sb2JvdFNwZWVjaGJ1YmJsZTsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIG91dHB1dHMuUm9ib3RTcGVlY2hidWJibGUuZ29hbDsgfSkpLFxuICAgICAgICBIdW1hblNwZWVjaGJ1YmJsZTogYWRhcHRfMS5hZGFwdChvdXRwdXRzJFxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzLkh1bWFuU3BlZWNoYnViYmxlOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5IdW1hblNwZWVjaGJ1YmJsZS5nb2FsOyB9KSksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChvdXRwdXRzJFxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzLnJlc3VsdDsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIG91dHB1dHMucmVzdWx0OyB9KSksXG4gICAgfTtcbn1cbi8qKlxuICogVHdvU3BlZWNoYnViYmxlcywgUm9ib3QgYW5kIEh1bWFuLCBhY3Rpb24gY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSBzb3VyY2VzXG4gKlxuICogICAqIGdvYWw6IGEgc3RyZWFtIG9mIGBudWxsYCAoYXMgXCJjYW5jZWxcIiksXG4gKiAgICAgYHt0eXBlOiAnU0VUX01FU1NBR0UnLCB2YWx1ZTogJ0hlbGxvIHdvcmxkJ31gIG9yIGAnSGVsbG8gd29ybGQnYCAoYXNcbiAqICAgICBcInNldCBtZXNzYWdlXCIpLCBvciBge3R5cGU6ICdBU0tfUVVFU1RJT04nLCBtZXNzYWdlOiAnQmx1ZSBwaWxsIG9yXG4gKiAgICAgcmVkIHBpbGw/JywgY2hvaWNlczogWydCbHVlJywgJ1JlZCddfWAgKGFzIFwiYXNrIG11bHRpcGxlIGNob2ljZVwiKS5cbiAqICAgKiBET006IEN5Y2xlLmpzIFtET01Tb3VyY2VdKGh0dHBzOi8vY3ljbGUuanMub3JnL2FwaS9kb20uaHRtbCkuXG4gKlxuICogQHJldHVybiBzaW5rc1xuICpcbiAqICAgKiBET006IGEgc3RyZWFtIG9mIHZpcnR1YWwgRE9NIG9iamVjdHMsIGkuZSwgW1NuYWJiZG9tIOKAnFZOb2Rl4oCdIG9iamVjdHNdKGh0dHBzOi8vZ2l0aHViLmNvbS9zbmFiYmRvbS9zbmFiYmRvbSkuXG4gKiAgICogcmVzdWx0OiBhIHN0cmVhbSBvZiBhY3Rpb24gcmVzdWx0cy5cbiAqXG4gKi9cbmZ1bmN0aW9uIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24oc291cmNlcykge1xuICAgIC8vIGNyZWF0ZSBwcm94aWVzXG4gICAgdmFyIGh1bWFuU3BlZWNoYnViYmxlUmVzdWx0ID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgdmFyIGlucHV0JCA9IGlucHV0KHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuZ29hbCksIGh1bWFuU3BlZWNoYnViYmxlUmVzdWx0KTtcbiAgICB2YXIgbWFjaGluZSQgPSB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpXG4gICAgICAgIC5mb2xkKGZ1bmN0aW9uIChzdGF0ZSwgcmVkdWNlcikgeyByZXR1cm4gcmVkdWNlcihzdGF0ZSk7IH0sIG51bGwpXG4gICAgICAgIC5kcm9wKDEpOyAvLyBkcm9wIFwibnVsbFwiO1xuICAgIHZhciBfYSA9IG91dHB1dChtYWNoaW5lJCksIFJvYm90U3BlZWNoYnViYmxlID0gX2EuUm9ib3RTcGVlY2hidWJibGUsIEh1bWFuU3BlZWNoYnViYmxlID0gX2EuSHVtYW5TcGVlY2hidWJibGUsIHJlc3VsdCA9IF9hLnJlc3VsdDtcbiAgICAvLyBjcmVhdGUgc3ViLWNvbXBvbmVudHNcbiAgICB2YXIgcm9ib3RTcGVlY2hidWJibGUgPSBTcGVlY2hidWJibGVBY3Rpb25fMS5Jc29sYXRlZFNwZWVjaGJ1YmJsZUFjdGlvbih7XG4gICAgICAgIGdvYWw6IFJvYm90U3BlZWNoYnViYmxlLFxuICAgICAgICBET006IHNvdXJjZXMuRE9NLFxuICAgIH0pO1xuICAgIHZhciBodW1hblNwZWVjaGJ1YmJsZSA9IFNwZWVjaGJ1YmJsZUFjdGlvbl8xLklzb2xhdGVkU3BlZWNoYnViYmxlQWN0aW9uKHtcbiAgICAgICAgZ29hbDogSHVtYW5TcGVlY2hidWJibGUsXG4gICAgICAgIERPTTogc291cmNlcy5ET00sXG4gICAgfSk7XG4gICAgLy8gSU1QT1JUQU5UISEgQXR0YWNoIGxpc3RlbmVycyB0byB0aGUgRE9NIHN0cmVhbXMgQkVGT1JFIGNvbm5lY3RpbmcgdGhlXG4gICAgLy8gICBwcm94aWVzIHRvIGhhdmUgTk8gUVVFVUUgaW4gdGhlIERPTSBzdHJlYW1zLlxuICAgIHJvYm90U3BlZWNoYnViYmxlLkRPTS5hZGRMaXN0ZW5lcih7IG5leHQ6IGZ1bmN0aW9uICh2YWx1ZSkgeyB9IH0pO1xuICAgIGh1bWFuU3BlZWNoYnViYmxlLkRPTS5hZGRMaXN0ZW5lcih7IG5leHQ6IGZ1bmN0aW9uICh2YWx1ZSkgeyB9IH0pO1xuICAgIC8vIGNvbm5lY3QgcHJveGllc1xuICAgIGh1bWFuU3BlZWNoYnViYmxlUmVzdWx0LmltaXRhdGUoaHVtYW5TcGVlY2hidWJibGUucmVzdWx0KTtcbiAgICB2YXIgc3R5bGVzID0ge1xuICAgICAgICBvdXRlcjoge1xuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgICAgICB3aWR0aDogJzEwMHZ3JyxcbiAgICAgICAgICAgIHpJbmRleDogMSxcbiAgICAgICAgICAgIG1hcmdpbjogJzFlbScsXG4gICAgICAgIH0sXG4gICAgICAgIGJ1YmJsZToge1xuICAgICAgICAgICAgbWFyZ2luOiAwLFxuICAgICAgICAgICAgcGFkZGluZzogJzFlbScsXG4gICAgICAgICAgICBtYXhXaWR0aDogJzkwJScsXG4gICAgICAgIH0sXG4gICAgfTtcbiAgICB2YXIgdmRvbSQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jb21iaW5lKHJvYm90U3BlZWNoYnViYmxlLkRPTSwgaHVtYW5TcGVlY2hidWJibGUuRE9NKVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgcm9ib3RWVHJlZSA9IF9hWzBdLCBodW1hblZUcmVlID0gX2FbMV07XG4gICAgICAgIHJldHVybiBkb21fMS5kaXYoeyBzdHlsZTogc3R5bGVzLm91dGVyIH0sIFtcbiAgICAgICAgICAgIGRvbV8xLmRpdih7IHN0eWxlOiBzdHlsZXMuYnViYmxlIH0sIFtkb21fMS5zcGFuKHJvYm90VlRyZWUpXSksXG4gICAgICAgICAgICBkb21fMS5kaXYoeyBzdHlsZTogX19hc3NpZ24oe30sIHN0eWxlcy5idWJibGUsIHsgdGV4dEFsaWduOiAncmlnaHQnIH0pIH0sIFtkb21fMS5zcGFuKGh1bWFuVlRyZWUpXSksXG4gICAgICAgIF0pO1xuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIERPTTogdmRvbSQsXG4gICAgICAgIHJlc3VsdDogcmVzdWx0LFxuICAgIH07XG59XG5leHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24gPSBUd29TcGVlY2hidWJibGVzQWN0aW9uO1xuZnVuY3Rpb24gSXNvbGF0ZWRUd29TcGVlY2hidWJibGVzQWN0aW9uKHNvdXJjZXMpIHtcbiAgICByZXR1cm4gaXNvbGF0ZV8xLmRlZmF1bHQoVHdvU3BlZWNoYnViYmxlc0FjdGlvbikoc291cmNlcyk7XG59XG5leHBvcnRzLklzb2xhdGVkVHdvU3BlZWNoYnViYmxlc0FjdGlvbiA9IElzb2xhdGVkVHdvU3BlZWNoYnViYmxlc0FjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgbWFrZVRhYmxldEZhY2VEcml2ZXJfMSA9IHJlcXVpcmUoXCIuL21ha2VUYWJsZXRGYWNlRHJpdmVyXCIpO1xuZXhwb3J0cy5FeHByZXNzQ29tbWFuZFR5cGUgPSBtYWtlVGFibGV0RmFjZURyaXZlcl8xLkV4cHJlc3NDb21tYW5kVHlwZTtcbmV4cG9ydHMubWFrZVRhYmxldEZhY2VEcml2ZXIgPSBtYWtlVGFibGV0RmFjZURyaXZlcl8xLm1ha2VUYWJsZXRGYWNlRHJpdmVyO1xudmFyIEZhY2lhbEV4cHJlc3Npb25BY3Rpb25fMSA9IHJlcXVpcmUoXCIuL0ZhY2lhbEV4cHJlc3Npb25BY3Rpb25cIik7XG5leHBvcnRzLkZhY2lhbEV4cHJlc3Npb25BY3Rpb24gPSBGYWNpYWxFeHByZXNzaW9uQWN0aW9uXzEuRmFjaWFsRXhwcmVzc2lvbkFjdGlvbjtcbnZhciBTcGVlY2hidWJibGVBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1NwZWVjaGJ1YmJsZUFjdGlvblwiKTtcbmV4cG9ydHMuU3BlZWNoYnViYmxlVHlwZSA9IFNwZWVjaGJ1YmJsZUFjdGlvbl8xLlNwZWVjaGJ1YmJsZVR5cGU7XG5leHBvcnRzLlNwZWVjaGJ1YmJsZUFjdGlvbiA9IFNwZWVjaGJ1YmJsZUFjdGlvbl8xLlNwZWVjaGJ1YmJsZUFjdGlvbjtcbmV4cG9ydHMuSXNvbGF0ZWRTcGVlY2hidWJibGVBY3Rpb24gPSBTcGVlY2hidWJibGVBY3Rpb25fMS5Jc29sYXRlZFNwZWVjaGJ1YmJsZUFjdGlvbjtcbnZhciBUd29TcGVlY2hidWJibGVzQWN0aW9uXzEgPSByZXF1aXJlKFwiLi9Ud29TcGVlY2hidWJibGVzQWN0aW9uXCIpO1xuZXhwb3J0cy5Ud29TcGVlY2hidWJibGVzVHlwZSA9IFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb25fMS5Ud29TcGVlY2hidWJibGVzVHlwZTtcbmV4cG9ydHMuVHdvU3BlZWNoYnViYmxlc0FjdGlvbiA9IFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb25fMS5Ud29TcGVlY2hidWJibGVzQWN0aW9uO1xuZXhwb3J0cy5Jc29sYXRlZFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24gPSBUd29TcGVlY2hidWJibGVzQWN0aW9uXzEuSXNvbGF0ZWRUd29TcGVlY2hidWJibGVzQWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtXCIpKTtcbnZhciBkb21fMSA9IHJlcXVpcmUoXCJAY3ljbGUvZG9tXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG4vLyBhZGFwdGVkIGZyb21cbi8vICAgaHR0cHM6Ly9naXRodWIuY29tL21qeWMvdGFibGV0LXJvYm90LWZhY2UvYmxvYi83MDliNzMxZGZmMDQwMzNjMDhjZjA0NWFkYzRlMDM4ZWVmYTc1MGEyL2luZGV4LmpzI0wzLUwxODRcbnZhciBFeWVDb250cm9sbGVyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEV5ZUNvbnRyb2xsZXIoZWxlbWVudHMsIGV5ZVNpemUpIHtcbiAgICAgICAgaWYgKGVsZW1lbnRzID09PSB2b2lkIDApIHsgZWxlbWVudHMgPSB7fTsgfVxuICAgICAgICBpZiAoZXllU2l6ZSA9PT0gdm9pZCAwKSB7IGV5ZVNpemUgPSAnMzMuMzN2bWluJzsgfVxuICAgICAgICB0aGlzLl9leWVTaXplID0gZXllU2l6ZTtcbiAgICAgICAgdGhpcy5fYmxpbmtUaW1lb3V0SUQgPSBudWxsO1xuICAgICAgICB0aGlzLnNldEVsZW1lbnRzKGVsZW1lbnRzKTtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLCBcImxlZnRFeWVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX2xlZnRFeWU7IH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeWVDb250cm9sbGVyLnByb3RvdHlwZSwgXCJyaWdodEV5ZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fcmlnaHRFeWU7IH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLnNldEVsZW1lbnRzID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBsZWZ0RXllID0gX2EubGVmdEV5ZSwgcmlnaHRFeWUgPSBfYS5yaWdodEV5ZSwgdXBwZXJMZWZ0RXllbGlkID0gX2EudXBwZXJMZWZ0RXllbGlkLCB1cHBlclJpZ2h0RXllbGlkID0gX2EudXBwZXJSaWdodEV5ZWxpZCwgbG93ZXJMZWZ0RXllbGlkID0gX2EubG93ZXJMZWZ0RXllbGlkLCBsb3dlclJpZ2h0RXllbGlkID0gX2EubG93ZXJSaWdodEV5ZWxpZDtcbiAgICAgICAgdGhpcy5fbGVmdEV5ZSA9IGxlZnRFeWU7XG4gICAgICAgIHRoaXMuX3JpZ2h0RXllID0gcmlnaHRFeWU7XG4gICAgICAgIHRoaXMuX3VwcGVyTGVmdEV5ZWxpZCA9IHVwcGVyTGVmdEV5ZWxpZDtcbiAgICAgICAgdGhpcy5fdXBwZXJSaWdodEV5ZWxpZCA9IHVwcGVyUmlnaHRFeWVsaWQ7XG4gICAgICAgIHRoaXMuX2xvd2VyTGVmdEV5ZWxpZCA9IGxvd2VyTGVmdEV5ZWxpZDtcbiAgICAgICAgdGhpcy5fbG93ZXJSaWdodEV5ZWxpZCA9IGxvd2VyUmlnaHRFeWVsaWQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG4gICAgRXllQ29udHJvbGxlci5wcm90b3R5cGUuX2NyZWF0ZUtleWZyYW1lcyA9IGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgX2IgPSBfYS50Z3RUcmFuWVZhbCwgdGd0VHJhbllWYWwgPSBfYiA9PT0gdm9pZCAwID8gJzBweCcgOiBfYiwgX2MgPSBfYS50Z3RSb3RWYWwsIHRndFJvdFZhbCA9IF9jID09PSB2b2lkIDAgPyAnMGRlZycgOiBfYywgX2QgPSBfYS5lbnRlcmVkT2Zmc2V0LCBlbnRlcmVkT2Zmc2V0ID0gX2QgPT09IHZvaWQgMCA/IDAgOiBfZCwgX2UgPSBfYS5leGl0aW5nT2Zmc2V0LCBleGl0aW5nT2Zmc2V0ID0gX2UgPT09IHZvaWQgMCA/IDAgOiBfZTtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZVkoMHB4KSByb3RhdGUoMGRlZylcIiwgb2Zmc2V0OiAwLjAgfSxcbiAgICAgICAgICAgIHsgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZVkoXCIgKyB0Z3RUcmFuWVZhbCArIFwiKSByb3RhdGUoXCIgKyB0Z3RSb3RWYWwgKyBcIilcIiwgb2Zmc2V0OiBlbnRlcmVkT2Zmc2V0IH0sXG4gICAgICAgICAgICB7IHRyYW5zZm9ybTogXCJ0cmFuc2xhdGVZKFwiICsgdGd0VHJhbllWYWwgKyBcIikgcm90YXRlKFwiICsgdGd0Um90VmFsICsgXCIpXCIsIG9mZnNldDogZXhpdGluZ09mZnNldCB9LFxuICAgICAgICAgICAgeyB0cmFuc2Zvcm06IFwidHJhbnNsYXRlWSgwcHgpIHJvdGF0ZSgwZGVnKVwiLCBvZmZzZXQ6IDEuMCB9LFxuICAgICAgICBdO1xuICAgIH07XG4gICAgRXllQ29udHJvbGxlci5wcm90b3R5cGUuZXhwcmVzcyA9IGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgX2IgPSBfYS50eXBlLCB0eXBlID0gX2IgPT09IHZvaWQgMCA/ICcnIDogX2IsIFxuICAgICAgICAvLyBsZXZlbCA9IDMsICAvLyAxOiBtaW4sIDU6IG1heFxuICAgICAgICBfYyA9IF9hLmR1cmF0aW9uLCBcbiAgICAgICAgLy8gbGV2ZWwgPSAzLCAgLy8gMTogbWluLCA1OiBtYXhcbiAgICAgICAgZHVyYXRpb24gPSBfYyA9PT0gdm9pZCAwID8gMTAwMCA6IF9jLCBfZCA9IF9hLmVudGVyRHVyYXRpb24sIGVudGVyRHVyYXRpb24gPSBfZCA9PT0gdm9pZCAwID8gNzUgOiBfZCwgX2UgPSBfYS5leGl0RHVyYXRpb24sIGV4aXREdXJhdGlvbiA9IF9lID09PSB2b2lkIDAgPyA3NSA6IF9lO1xuICAgICAgICBpZiAoIXRoaXMuX2xlZnRFeWUpIHsgLy8gYXNzdW1lcyBhbGwgZWxlbWVudHMgYXJlIGFsd2F5cyBzZXQgdG9nZXRoZXJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRXllIGVsZW1lbnRzIGFyZSBub3Qgc2V0OyByZXR1cm47Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBkdXJhdGlvbjogZHVyYXRpb24sXG4gICAgICAgIH07XG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnaGFwcHknOlxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGxvd2VyTGVmdEV5ZWxpZDogdGhpcy5fbG93ZXJMZWZ0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAtMiAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RSb3RWYWw6IFwiMzBkZWdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgICAgIGxvd2VyUmlnaHRFeWVsaWQ6IHRoaXMuX2xvd2VyUmlnaHRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIC0yIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFJvdFZhbDogXCItMzBkZWdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNhc2UgJ3NhZCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJMZWZ0RXllbGlkOiB0aGlzLl91cHBlckxlZnRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIDEgLyAzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGd0Um90VmFsOiBcIi0yMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJSaWdodEV5ZWxpZDogdGhpcy5fdXBwZXJSaWdodEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RSb3RWYWw6IFwiMjBkZWdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNhc2UgJ2FuZ3J5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB1cHBlckxlZnRFeWVsaWQ6IHRoaXMuX3VwcGVyTGVmdEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDQpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RSb3RWYWw6IFwiMzBkZWdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgICAgIHVwcGVyUmlnaHRFeWVsaWQ6IHRoaXMuX3VwcGVyUmlnaHRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIDEgLyA0KVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGd0Um90VmFsOiBcIi0zMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2FzZSAnZm9jdXNlZCc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJMZWZ0RXllbGlkOiB0aGlzLl91cHBlckxlZnRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIDEgLyAzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJSaWdodEV5ZWxpZDogdGhpcy5fdXBwZXJSaWdodEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogMSAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICBsb3dlckxlZnRFeWVsaWQ6IHRoaXMuX2xvd2VyTGVmdEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogLTEgLyAzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICAgICAgbG93ZXJSaWdodEV5ZWxpZDogdGhpcy5fbG93ZXJSaWdodEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogLTEgLyAzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgY2FzZSAnY29uZnVzZWQnOlxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHVwcGVyUmlnaHRFeWVsaWQ6IHRoaXMuX3VwcGVyUmlnaHRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIDEgLyAzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGd0Um90VmFsOiBcIi0xMGRlZ1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJJbnZhbGlkIGlucHV0IHR5cGU9XCIgKyB0eXBlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXllQ29udHJvbGxlci5wcm90b3R5cGUuYmxpbmsgPSBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgdmFyIF9iID0gKF9hID09PSB2b2lkIDAgPyB7fSA6IF9hKS5kdXJhdGlvbiwgZHVyYXRpb24gPSBfYiA9PT0gdm9pZCAwID8gMTUwIDogX2I7XG4gICAgICAgIGlmICghdGhpcy5fbGVmdEV5ZSkgeyAvLyBhc3N1bWVzIGFsbCBlbGVtZW50cyBhcmUgYWx3YXlzIHNldCB0b2dldGhlclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdFeWUgZWxlbWVudHMgYXJlIG5vdCBzZXQ7IHJldHVybjsnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBbdGhpcy5fbGVmdEV5ZSwgdGhpcy5fcmlnaHRFeWVdLm1hcChmdW5jdGlvbiAoZXllKSB7XG4gICAgICAgICAgICBleWUuYW5pbWF0ZShbXG4gICAgICAgICAgICAgICAgeyB0cmFuc2Zvcm06ICdyb3RhdGVYKDBkZWcpJyB9LFxuICAgICAgICAgICAgICAgIHsgdHJhbnNmb3JtOiAncm90YXRlWCg5MGRlZyknIH0sXG4gICAgICAgICAgICAgICAgeyB0cmFuc2Zvcm06ICdyb3RhdGVYKDBkZWcpJyB9LFxuICAgICAgICAgICAgXSwge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICBpdGVyYXRpb25zOiAxLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRXllQ29udHJvbGxlci5wcm90b3R5cGUuc3RhcnRCbGlua2luZyA9IGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgX2IgPSAoX2EgPT09IHZvaWQgMCA/IHt9IDogX2EpLm1heEludGVydmFsLCBtYXhJbnRlcnZhbCA9IF9iID09PSB2b2lkIDAgPyA1MDAwIDogX2I7XG4gICAgICAgIGlmICh0aGlzLl9ibGlua1RpbWVvdXRJRCkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiQWxyZWFkeSBibGlua2luZyB3aXRoIHRpbWVvdXRJRD1cIiArIHRoaXMuX2JsaW5rVGltZW91dElEICsgXCI7IHJldHVybjtcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJsaW5rUmFuZG9tbHkgPSBmdW5jdGlvbiAodGltZW91dCkge1xuICAgICAgICAgICAgX3RoaXMuX2JsaW5rVGltZW91dElEID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMuYmxpbmsoKTtcbiAgICAgICAgICAgICAgICBibGlua1JhbmRvbWx5KE1hdGgucmFuZG9tKCkgKiBtYXhJbnRlcnZhbCk7XG4gICAgICAgICAgICB9LCB0aW1lb3V0KTtcbiAgICAgICAgfTtcbiAgICAgICAgYmxpbmtSYW5kb21seShNYXRoLnJhbmRvbSgpICogbWF4SW50ZXJ2YWwpO1xuICAgIH07XG4gICAgRXllQ29udHJvbGxlci5wcm90b3R5cGUuc3RvcEJsaW5raW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fYmxpbmtUaW1lb3V0SUQpO1xuICAgICAgICB0aGlzLl9ibGlua1RpbWVvdXRJRCA9IG51bGw7XG4gICAgfTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5zZXRFeWVQb3NpdGlvbiA9IGZ1bmN0aW9uIChleWVFbGVtLCB4LCB5LCBpc1JpZ2h0KSB7XG4gICAgICAgIGlmIChpc1JpZ2h0ID09PSB2b2lkIDApIHsgaXNSaWdodCA9IGZhbHNlOyB9XG4gICAgICAgIGlmICghZXllRWxlbSkgeyAvLyBhc3N1bWVzIGFsbCBlbGVtZW50cyBhcmUgYWx3YXlzIHNldCB0b2dldGhlclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdJbnZhbGlkIGlucHV0cyAnLCBleWVFbGVtLCB4LCB5LCAnOyByZXR1bmluZycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmICghaXNOYU4oeCkpIHtcbiAgICAgICAgICAgIGlmICghaXNSaWdodCkge1xuICAgICAgICAgICAgICAgIGV5ZUVsZW0uc3R5bGUubGVmdCA9IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAvIDMgKiAyICogXCIgKyB4ICsgXCIpXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBleWVFbGVtLnN0eWxlLnJpZ2h0ID0gXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiIC8gMyAqIDIgKiBcIiArICgxIC0geCkgKyBcIilcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzTmFOKHkpKSB7XG4gICAgICAgICAgICBleWVFbGVtLnN0eWxlLmJvdHRvbSA9IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAvIDMgKiAyICogXCIgKyAoMSAtIHkpICsgXCIpXCI7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBFeWVDb250cm9sbGVyO1xufSgpKTtcbnZhciBDb21tYW5kVHlwZTtcbihmdW5jdGlvbiAoQ29tbWFuZFR5cGUpIHtcbiAgICBDb21tYW5kVHlwZVtcIkVYUFJFU1NcIl0gPSBcIkVYUFJFU1NcIjtcbiAgICBDb21tYW5kVHlwZVtcIlNUQVJUX0JMSU5LSU5HXCJdID0gXCJTVEFSVF9CTElOS0lOR1wiO1xuICAgIENvbW1hbmRUeXBlW1wiU1RPUF9CTElOS0lOR1wiXSA9IFwiU1RPUF9CTElOS0lOR1wiO1xuICAgIENvbW1hbmRUeXBlW1wiU0VUX1NUQVRFXCJdID0gXCJTRVRfU1RBVEVcIjtcbn0pKENvbW1hbmRUeXBlIHx8IChDb21tYW5kVHlwZSA9IHt9KSk7XG52YXIgRXhwcmVzc0NvbW1hbmRUeXBlO1xuKGZ1bmN0aW9uIChFeHByZXNzQ29tbWFuZFR5cGUpIHtcbiAgICBFeHByZXNzQ29tbWFuZFR5cGVbXCJIQVBQWVwiXSA9IFwiaGFwcHlcIjtcbiAgICBFeHByZXNzQ29tbWFuZFR5cGVbXCJTQURcIl0gPSBcInNhZFwiO1xuICAgIEV4cHJlc3NDb21tYW5kVHlwZVtcIkFOR1JZXCJdID0gXCJhbmdyeVwiO1xuICAgIEV4cHJlc3NDb21tYW5kVHlwZVtcIkZPQ1VTRURcIl0gPSBcImZvY3VzZWRcIjtcbiAgICBFeHByZXNzQ29tbWFuZFR5cGVbXCJDT05GVVNFRFwiXSA9IFwiY29uZnVzZWRcIjtcbn0pKEV4cHJlc3NDb21tYW5kVHlwZSA9IGV4cG9ydHMuRXhwcmVzc0NvbW1hbmRUeXBlIHx8IChleHBvcnRzLkV4cHJlc3NDb21tYW5kVHlwZSA9IHt9KSk7XG4vKipcbiAqIFtUYWJsZXRGYWNlXShodHRwczovL2dpdGh1Yi5jb20vbWp5Yy90YWJsZXQtcm9ib3QtZmFjZSkgZHJpdmVyIGZhY3RvcnkuXG4gKlxuICogQHBhcmFtIG9wdGlvbnMgcG9zc2libGUga2V5IGluY2x1ZGVzXG4gKlxuICogICAqIHN0eWxlcyB7b2JqZWN0fSBBIGdyb3VwIG9mIG9wdGlvbmFsIGZhY2Ugc3R5bGUgcGFyYW1ldGVyczpcbiAqICAgICAqIGZhY2VDb2xvciB7c3RyaW5nfSAoZGVmYXVsdDogJ3doaXRlc21va2UnKVxuICogICAgICogZmFjZUhlaWdodCB7c3RyaW5nfSAoZGVmYXVsdDogJzEwMHZoJylcbiAqICAgICAqIGZhY2VXaWR0aCB7c3RyaW5nfSAoZGVmYXVsdDogJzEwMHZ3JylcbiAqICAgICAqIGV5ZUNvbG9yIHtzdHJpbmd9IChkZWZhdWx0OiAnYmxhY2snKVxuICogICAgICogZXllU2l6ZSB7c3RyaW5nfSAoZGVmYXVsdDogJzMzLjMzdm1pbicpXG4gKiAgICAgKiBleWVsaWRDb2xvciB7c3RyaW5nfSAoZGVmYXVsdDogJ3doaXRlc21va2UnKVxuICpcbiAqIEByZXR1cm4ge0RyaXZlcn0gdGhlIFRhYmxldEZhY2UgQ3ljbGUuanMgZHJpdmVyIGZ1bmN0aW9uLiBJdCB0YWtlcyBhIHN0cmVhbVxuICogICBvZiBgQ29tbWFuZGAgYW5kIHJldHVybnMgYERPTWAsIGFuaW1hdGlvbkZpbmlzaGAsIGFuZCBgbG9hZGAgc3RyZWFtcy5cbiAqL1xuZnVuY3Rpb24gbWFrZVRhYmxldEZhY2VEcml2ZXIoX2EpIHtcbiAgICB2YXIgX2IgPSAoX2EgPT09IHZvaWQgMCA/IHt9IDogX2EpLnN0eWxlcywgX2MgPSBfYiA9PT0gdm9pZCAwID8ge30gOiBfYiwgX2QgPSBfYy5mYWNlQ29sb3IsIGZhY2VDb2xvciA9IF9kID09PSB2b2lkIDAgPyAnd2hpdGVzbW9rZScgOiBfZCwgX2UgPSBfYy5mYWNlSGVpZ2h0LCBmYWNlSGVpZ2h0ID0gX2UgPT09IHZvaWQgMCA/ICcxMDB2aCcgOiBfZSwgX2YgPSBfYy5mYWNlV2lkdGgsIGZhY2VXaWR0aCA9IF9mID09PSB2b2lkIDAgPyAnMTAwdncnIDogX2YsIF9nID0gX2MuZXllQ29sb3IsIGV5ZUNvbG9yID0gX2cgPT09IHZvaWQgMCA/ICdibGFjaycgOiBfZywgX2ggPSBfYy5leWVTaXplLCBleWVTaXplID0gX2ggPT09IHZvaWQgMCA/ICczMy4zM3ZtaW4nIDogX2gsIF9qID0gX2MuZXllbGlkQ29sb3IsIGV5ZWxpZENvbG9yID0gX2ogPT09IHZvaWQgMCA/ICd3aGl0ZXNtb2tlJyA6IF9qO1xuICAgIHZhciBzdHlsZXMgPSB7XG4gICAgICAgIGZhY2U6IHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogZmFjZUNvbG9yLFxuICAgICAgICAgICAgaGVpZ2h0OiBmYWNlSGVpZ2h0LFxuICAgICAgICAgICAgd2lkdGg6IGZhY2VXaWR0aCxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICAgICAgb3ZlcmZsb3c6ICdoaWRkZW4nLFxuICAgICAgICAgICAgekluZGV4OiAwLFxuICAgICAgICB9LFxuICAgICAgICBleWU6IHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogZXllQ29sb3IsXG4gICAgICAgICAgICBib3JkZXJSYWRpdXM6ICcxMDAlJyxcbiAgICAgICAgICAgIGhlaWdodDogZXllU2l6ZSxcbiAgICAgICAgICAgIHdpZHRoOiBleWVTaXplLFxuICAgICAgICAgICAgYm90dG9tOiBcImNhbGMoXCIgKyBleWVTaXplICsgXCIgLyAzKVwiLFxuICAgICAgICAgICAgekluZGV4OiAxLFxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIH0sXG4gICAgICAgIGxlZnQ6IHtcbiAgICAgICAgICAgIGxlZnQ6IFwiY2FsYyhcIiArIGV5ZVNpemUgKyBcIiAvIDMpXCIsXG4gICAgICAgIH0sXG4gICAgICAgIHJpZ2h0OiB7XG4gICAgICAgICAgICByaWdodDogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiIC8gMylcIixcbiAgICAgICAgfSxcbiAgICAgICAgZXllbGlkOiB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGV5ZWxpZENvbG9yLFxuICAgICAgICAgICAgaGVpZ2h0OiBleWVTaXplLFxuICAgICAgICAgICAgd2lkdGg6IFwiY2FsYyhcIiArIGV5ZVNpemUgKyBcIiAqIDEuNzUpXCIsXG4gICAgICAgICAgICB6SW5kZXg6IDIsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2Fic29sdXRlJyxcbiAgICAgICAgfSxcbiAgICAgICAgdXBwZXI6IHtcbiAgICAgICAgICAgIGJvdHRvbTogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiICogMSlcIixcbiAgICAgICAgICAgIGxlZnQ6IFwiY2FsYyhcIiArIGV5ZVNpemUgKyBcIiAqIC0wLjM3NSlcIixcbiAgICAgICAgfSxcbiAgICAgICAgbG93ZXI6IHtcbiAgICAgICAgICAgIGJvcmRlclJhZGl1czogJzEwMCUnLFxuICAgICAgICAgICAgYm90dG9tOiBcImNhbGMoXCIgKyBleWVTaXplICsgXCIgKiAtMSlcIixcbiAgICAgICAgICAgIGxlZnQ6IFwiY2FsYyhcIiArIGV5ZVNpemUgKyBcIiAqIC0wLjM3NSlcIixcbiAgICAgICAgfSxcbiAgICB9O1xuICAgIHZhciBleWVzID0gbmV3IEV5ZUNvbnRyb2xsZXIoKTtcbiAgICB2YXIgaWQgPSBcImZhY2UtXCIgKyBTdHJpbmcoTWF0aC5yYW5kb20oKSkuc3Vic3RyKDIpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoY29tbWFuZCQpIHtcbiAgICAgICAgdmFyIGxvYWQkID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIHZhciBpbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI1wiICsgaWQpKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIldhaXRpbmcgZm9yICNcIiArIGlkICsgXCIgdG8gYXBwZWFyLi4uXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxJRCk7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjXCIgKyBpZCk7XG4gICAgICAgICAgICBleWVzLnNldEVsZW1lbnRzKHtcbiAgICAgICAgICAgICAgICBsZWZ0RXllOiBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5sZWZ0LmV5ZScpLFxuICAgICAgICAgICAgICAgIHJpZ2h0RXllOiBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yaWdodC5leWUnKSxcbiAgICAgICAgICAgICAgICB1cHBlckxlZnRFeWVsaWQ6IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLmxlZnQgLmV5ZWxpZC51cHBlcicpLFxuICAgICAgICAgICAgICAgIHVwcGVyUmlnaHRFeWVsaWQ6IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLnJpZ2h0IC5leWVsaWQudXBwZXInKSxcbiAgICAgICAgICAgICAgICBsb3dlckxlZnRFeWVsaWQ6IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLmxlZnQgLmV5ZWxpZC5sb3dlcicpLFxuICAgICAgICAgICAgICAgIGxvd2VyUmlnaHRFeWVsaWQ6IGVsZW1lbnQucXVlcnlTZWxlY3RvcignLnJpZ2h0IC5leWVsaWQubG93ZXInKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbG9hZCQuc2hhbWVmdWxseVNlbmROZXh0KHRydWUpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgdmFyIGFuaW1hdGlvbnMgPSB7fTtcbiAgICAgICAgdmFyIGFuaW1hdGlvbkZpbmlzaCQkID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKGNvbW1hbmQkKS5hZGRMaXN0ZW5lcih7XG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoY29tbWFuZCkge1xuICAgICAgICAgICAgICAgIGlmICghY29tbWFuZCkge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhhbmltYXRpb25zKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uc1trZXldLmNhbmNlbCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzd2l0Y2ggKGNvbW1hbmQudHlwZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlIENvbW1hbmRUeXBlLkVYUFJFU1M6XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25zID0gZXllcy5leHByZXNzKGNvbW1hbmQudmFsdWUpIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uRmluaXNoJCQuc2hhbWVmdWxseVNlbmROZXh0KHhzdHJlYW1fMS5kZWZhdWx0LmZyb21Qcm9taXNlKFByb21pc2UuYWxsKE9iamVjdC5rZXlzKGFuaW1hdGlvbnMpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0aW9uc1trZXldLm9uZmluaXNoID0gcmVzb2x2ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQ29tbWFuZFR5cGUuU1RBUlRfQkxJTktJTkc6XG4gICAgICAgICAgICAgICAgICAgICAgICBleWVzLnN0YXJ0QmxpbmtpbmcoY29tbWFuZC52YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDb21tYW5kVHlwZS5TVE9QX0JMSU5LSU5HOlxuICAgICAgICAgICAgICAgICAgICAgICAgZXllcy5zdG9wQmxpbmtpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIENvbW1hbmRUeXBlLlNFVF9TVEFURTpcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IGNvbW1hbmQudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVmdFBvcyA9IHZhbHVlICYmIHZhbHVlLmxlZnRFeWUgfHwgeyB4OiBudWxsLCB5OiBudWxsIH07XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmlnaHRQb3MgPSB2YWx1ZSAmJiB2YWx1ZS5yaWdodEV5ZSB8fCB7IHg6IG51bGwsIHk6IG51bGwgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV5ZXMuc2V0RXllUG9zaXRpb24oZXllcy5sZWZ0RXllLCBsZWZ0UG9zLngsIGxlZnRQb3MueSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBleWVzLnNldEV5ZVBvc2l0aW9uKGV5ZXMucmlnaHRFeWUsIHJpZ2h0UG9zLngsIHJpZ2h0UG9zLnksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHZkb20kID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZG9tXzEuZGl2KFwiI1wiICsgaWQgKyBcIi5mYWNlXCIsIHsgc3R5bGU6IHN0eWxlcy5mYWNlIH0sIFtcbiAgICAgICAgICAgIGRvbV8xLmRpdignLmV5ZS5sZWZ0Jywge1xuICAgICAgICAgICAgICAgIHN0eWxlOiBPYmplY3QuYXNzaWduKHt9LCBzdHlsZXMuZXllLCBzdHlsZXMubGVmdCksXG4gICAgICAgICAgICB9LCBbXG4gICAgICAgICAgICAgICAgZG9tXzEuZGl2KCcuZXllbGlkLnVwcGVyJywge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgc3R5bGVzLmV5ZWxpZCwgc3R5bGVzLnVwcGVyKSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBkb21fMS5kaXYoJy5leWVsaWQubG93ZXInLCB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiBPYmplY3QuYXNzaWduKHt9LCBzdHlsZXMuZXllbGlkLCBzdHlsZXMubG93ZXIpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgXSksXG4gICAgICAgICAgICBkb21fMS5kaXYoJy5leWUucmlnaHQnLCB7XG4gICAgICAgICAgICAgICAgc3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlcy5leWUsIHN0eWxlcy5yaWdodCksXG4gICAgICAgICAgICB9LCBbXG4gICAgICAgICAgICAgICAgZG9tXzEuZGl2KCcuZXllbGlkLnVwcGVyJywge1xuICAgICAgICAgICAgICAgICAgICBzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgc3R5bGVzLmV5ZWxpZCwgc3R5bGVzLnVwcGVyKSxcbiAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICBkb21fMS5kaXYoJy5leWVsaWQubG93ZXInLCB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiBPYmplY3QuYXNzaWduKHt9LCBzdHlsZXMuZXllbGlkLCBzdHlsZXMubG93ZXIpLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgXSksXG4gICAgICAgIF0pKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIERPTTogYWRhcHRfMS5hZGFwdCh2ZG9tJCksXG4gICAgICAgICAgICBhbmltYXRpb25GaW5pc2g6IGFkYXB0XzEuYWRhcHQoYW5pbWF0aW9uRmluaXNoJCQuZmxhdHRlbigpKSxcbiAgICAgICAgICAgIGxvYWQ6IGFkYXB0XzEuYWRhcHQobG9hZCQpLFxuICAgICAgICB9O1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VUYWJsZXRGYWNlRHJpdmVyID0gbWFrZVRhYmxldEZhY2VEcml2ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWtlVGFibGV0RmFjZURyaXZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xuZnVuY3Rpb24gY2hlY2tJc29sYXRlQXJncyhkYXRhZmxvd0NvbXBvbmVudCwgc2NvcGUpIHtcbiAgICBpZiAodHlwZW9mIGRhdGFmbG93Q29tcG9uZW50ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgYXJndW1lbnQgZ2l2ZW4gdG8gaXNvbGF0ZSgpIG11c3QgYmUgYSBcIiArXG4gICAgICAgICAgICBcIidkYXRhZmxvd0NvbXBvbmVudCcgZnVuY3Rpb25cIik7XG4gICAgfVxuICAgIGlmIChzY29wZSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gaXNvbGF0ZSgpIG11c3Qgbm90IGJlIG51bGxcIik7XG4gICAgfVxufVxuZnVuY3Rpb24gbm9ybWFsaXplU2NvcGVzKHNvdXJjZXMsIHNjb3BlcywgcmFuZG9tU2NvcGUpIHtcbiAgICB2YXIgcGVyQ2hhbm5lbCA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHNvdXJjZXMpLmZvckVhY2goZnVuY3Rpb24gKGNoYW5uZWwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzY29wZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gc2NvcGVzO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjYW5kaWRhdGUgPSBzY29wZXNbY2hhbm5lbF07XG4gICAgICAgIGlmICh0eXBlb2YgY2FuZGlkYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IGNhbmRpZGF0ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgd2lsZGNhcmQgPSBzY29wZXNbJyonXTtcbiAgICAgICAgaWYgKHR5cGVvZiB3aWxkY2FyZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSB3aWxkY2FyZDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gcmFuZG9tU2NvcGU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHBlckNoYW5uZWw7XG59XG5mdW5jdGlvbiBpc29sYXRlQWxsU291cmNlcyhvdXRlclNvdXJjZXMsIHNjb3Blcykge1xuICAgIHZhciBpbm5lclNvdXJjZXMgPSB7fTtcbiAgICBmb3IgKHZhciBjaGFubmVsIGluIG91dGVyU291cmNlcykge1xuICAgICAgICB2YXIgb3V0ZXJTb3VyY2UgPSBvdXRlclNvdXJjZXNbY2hhbm5lbF07XG4gICAgICAgIGlmIChvdXRlclNvdXJjZXMuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkgJiZcbiAgICAgICAgICAgIG91dGVyU291cmNlICYmXG4gICAgICAgICAgICBzY29wZXNbY2hhbm5lbF0gIT09IG51bGwgJiZcbiAgICAgICAgICAgIHR5cGVvZiBvdXRlclNvdXJjZS5pc29sYXRlU291cmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBpbm5lclNvdXJjZXNbY2hhbm5lbF0gPSBvdXRlclNvdXJjZS5pc29sYXRlU291cmNlKG91dGVyU291cmNlLCBzY29wZXNbY2hhbm5lbF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG91dGVyU291cmNlcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSkge1xuICAgICAgICAgICAgaW5uZXJTb3VyY2VzW2NoYW5uZWxdID0gb3V0ZXJTb3VyY2VzW2NoYW5uZWxdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbm5lclNvdXJjZXM7XG59XG5mdW5jdGlvbiBpc29sYXRlQWxsU2lua3Moc291cmNlcywgaW5uZXJTaW5rcywgc2NvcGVzKSB7XG4gICAgdmFyIG91dGVyU2lua3MgPSB7fTtcbiAgICBmb3IgKHZhciBjaGFubmVsIGluIGlubmVyU2lua3MpIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IHNvdXJjZXNbY2hhbm5lbF07XG4gICAgICAgIHZhciBpbm5lclNpbmsgPSBpbm5lclNpbmtzW2NoYW5uZWxdO1xuICAgICAgICBpZiAoaW5uZXJTaW5rcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSAmJlxuICAgICAgICAgICAgc291cmNlICYmXG4gICAgICAgICAgICBzY29wZXNbY2hhbm5lbF0gIT09IG51bGwgJiZcbiAgICAgICAgICAgIHR5cGVvZiBzb3VyY2UuaXNvbGF0ZVNpbmsgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIG91dGVyU2lua3NbY2hhbm5lbF0gPSBhZGFwdF8xLmFkYXB0KHNvdXJjZS5pc29sYXRlU2luayh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShpbm5lclNpbmspLCBzY29wZXNbY2hhbm5lbF0pKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpbm5lclNpbmtzLmhhc093blByb3BlcnR5KGNoYW5uZWwpKSB7XG4gICAgICAgICAgICBvdXRlclNpbmtzW2NoYW5uZWxdID0gaW5uZXJTaW5rc1tjaGFubmVsXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0ZXJTaW5rcztcbn1cbnZhciBjb3VudGVyID0gMDtcbmZ1bmN0aW9uIG5ld1Njb3BlKCkge1xuICAgIHJldHVybiBcImN5Y2xlXCIgKyArK2NvdW50ZXI7XG59XG4vKipcbiAqIFRha2VzIGEgYGNvbXBvbmVudGAgZnVuY3Rpb24gYW5kIGEgYHNjb3BlYCwgYW5kIHJldHVybnMgYW4gaXNvbGF0ZWQgdmVyc2lvblxuICogb2YgdGhlIGBjb21wb25lbnRgIGZ1bmN0aW9uLlxuICpcbiAqIFdoZW4gdGhlIGlzb2xhdGVkIGNvbXBvbmVudCBpcyBpbnZva2VkLCBlYWNoIHNvdXJjZSBwcm92aWRlZCB0byBpdCBpc1xuICogaXNvbGF0ZWQgdG8gdGhlIGdpdmVuIGBzY29wZWAgdXNpbmcgYHNvdXJjZS5pc29sYXRlU291cmNlKHNvdXJjZSwgc2NvcGUpYCxcbiAqIGlmIHBvc3NpYmxlLiBMaWtld2lzZSwgdGhlIHNpbmtzIHJldHVybmVkIGZyb20gdGhlIGlzb2xhdGVkIGNvbXBvbmVudCBhcmVcbiAqIGlzb2xhdGVkIHRvIHRoZSBnaXZlbiBgc2NvcGVgIHVzaW5nIGBzb3VyY2UuaXNvbGF0ZVNpbmsoc2luaywgc2NvcGUpYC5cbiAqXG4gKiBUaGUgYHNjb3BlYCBjYW4gYmUgYSBzdHJpbmcgb3IgYW4gb2JqZWN0LiBJZiBpdCBpcyBhbnl0aGluZyBlbHNlIHRoYW4gdGhvc2VcbiAqIHR3byB0eXBlcywgaXQgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gYSBzdHJpbmcuIElmIGBzY29wZWAgaXMgYW4gb2JqZWN0LCBpdFxuICogcmVwcmVzZW50cyBcInNjb3BlcyBwZXIgY2hhbm5lbFwiLCBhbGxvd2luZyB5b3UgdG8gc3BlY2lmeSBhIGRpZmZlcmVudCBzY29wZVxuICogZm9yIGVhY2gga2V5IG9mIHNvdXJjZXMvc2lua3MuIEZvciBpbnN0YW5jZVxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2ZvbycsIEhUVFA6ICdiYXInfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBZb3UgY2FuIGFsc28gdXNlIGEgd2lsZGNhcmQgYCcqJ2AgdG8gdXNlIGFzIGEgZGVmYXVsdCBmb3Igc291cmNlL3NpbmtzXG4gKiBjaGFubmVscyB0aGF0IGRpZCBub3QgcmVjZWl2ZSBhIHNwZWNpZmljIHNjb3BlOlxuICpcbiAqIGBgYGpzXG4gKiAvLyBVc2VzICdiYXInIGFzIHRoZSBpc29sYXRpb24gc2NvcGUgZm9yIEhUVFAgYW5kIG90aGVyIGNoYW5uZWxzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2ZvbycsICcqJzogJ2Jhcid9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIElmIGEgY2hhbm5lbCdzIHZhbHVlIGlzIG51bGwsIHRoZW4gdGhhdCBjaGFubmVsJ3Mgc291cmNlcyBhbmQgc2lua3Mgd29uJ3QgYmVcbiAqIGlzb2xhdGVkLiBJZiB0aGUgd2lsZGNhcmQgaXMgbnVsbCBhbmQgc29tZSBjaGFubmVscyBhcmUgdW5zcGVjaWZpZWQsIHRob3NlXG4gKiBjaGFubmVscyB3b24ndCBiZSBpc29sYXRlZC4gSWYgeW91IGRvbid0IGhhdmUgYSB3aWxkY2FyZCBhbmQgc29tZSBjaGFubmVsc1xuICogYXJlIHVuc3BlY2lmaWVkLCB0aGVuIGBpc29sYXRlYCB3aWxsIGdlbmVyYXRlIGEgcmFuZG9tIHNjb3BlLlxuICpcbiAqIGBgYGpzXG4gKiAvLyBEb2VzIG5vdCBpc29sYXRlIEhUVFAgcmVxdWVzdHNcbiAqIGNvbnN0IGNoaWxkU2lua3MgPSBpc29sYXRlKENoaWxkLCB7RE9NOiAnZm9vJywgSFRUUDogbnVsbH0pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogSWYgdGhlIGBzY29wZWAgYXJndW1lbnQgaXMgbm90IHByb3ZpZGVkIGF0IGFsbCwgYSBuZXcgc2NvcGUgd2lsbCBiZVxuICogYXV0b21hdGljYWxseSBjcmVhdGVkLiBUaGlzIG1lYW5zIHRoYXQgd2hpbGUgKipgaXNvbGF0ZShjb21wb25lbnQsIHNjb3BlKWAgaXNcbiAqIHB1cmUqKiAocmVmZXJlbnRpYWxseSB0cmFuc3BhcmVudCksICoqYGlzb2xhdGUoY29tcG9uZW50KWAgaXMgaW1wdXJlKiogKG5vdFxuICogcmVmZXJlbnRpYWxseSB0cmFuc3BhcmVudCkuIFR3byBjYWxscyB0byBgaXNvbGF0ZShGb28sIGJhcilgIHdpbGwgZ2VuZXJhdGVcbiAqIHRoZSBzYW1lIGNvbXBvbmVudC4gQnV0LCB0d28gY2FsbHMgdG8gYGlzb2xhdGUoRm9vKWAgd2lsbCBnZW5lcmF0ZSB0d29cbiAqIGRpc3RpbmN0IGNvbXBvbmVudHMuXG4gKlxuICogYGBganNcbiAqIC8vIFVzZXMgc29tZSBhcmJpdHJhcnkgc3RyaW5nIGFzIHRoZSBpc29sYXRpb24gc2NvcGUgZm9yIEhUVFAgYW5kIG90aGVyIGNoYW5uZWxzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2Zvbyd9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIE5vdGUgdGhhdCBib3RoIGBpc29sYXRlU291cmNlKClgIGFuZCBgaXNvbGF0ZVNpbmsoKWAgYXJlIHN0YXRpYyBtZW1iZXJzIG9mXG4gKiBgc291cmNlYC4gVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyB0aGF0IGRyaXZlcnMgcHJvZHVjZSBgc291cmNlYCB3aGlsZSB0aGVcbiAqIGFwcGxpY2F0aW9uIHByb2R1Y2VzIGBzaW5rYCwgYW5kIGl0J3MgdGhlIGRyaXZlcidzIHJlc3BvbnNpYmlsaXR5IHRvXG4gKiBpbXBsZW1lbnQgYGlzb2xhdGVTb3VyY2UoKWAgYW5kIGBpc29sYXRlU2luaygpYC5cbiAqXG4gKiBfTm90ZSBmb3IgVHlwZXNjcmlwdCB1c2VyczpfIGBpc29sYXRlYCBpcyBub3QgY3VycmVudGx5IHR5cGUtdHJhbnNwYXJlbnQgYW5kXG4gKiB3aWxsIGV4cGxpY2l0bHkgY29udmVydCBnZW5lcmljIHR5cGUgYXJndW1lbnRzIHRvIGBhbnlgLiBUbyBwcmVzZXJ2ZSB0eXBlcyBpblxuICogeW91ciBjb21wb25lbnRzLCB5b3UgY2FuIHVzZSBhIHR5cGUgYXNzZXJ0aW9uOlxuICpcbiAqIGBgYHRzXG4gKiAvLyBpZiBDaGlsZCBpcyB0eXBlZCBgQ29tcG9uZW50PFNvdXJjZXMsIFNpbmtzPmBcbiAqIGNvbnN0IGlzb2xhdGVkQ2hpbGQgPSBpc29sYXRlKCBDaGlsZCApIGFzIENvbXBvbmVudDxTb3VyY2VzLCBTaW5rcz47XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wb25lbnQgYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dFxuICogYW5kIG91dHB1dHMgYSBjb2xsZWN0aW9uIG9mIGBzaW5rc2AuXG4gKiBAcGFyYW0ge1N0cmluZ30gc2NvcGUgYW4gb3B0aW9uYWwgc3RyaW5nIHRoYXQgaXMgdXNlZCB0byBpc29sYXRlIGVhY2hcbiAqIGBzb3VyY2VzYCBhbmQgYHNpbmtzYCB3aGVuIHRoZSByZXR1cm5lZCBzY29wZWQgY29tcG9uZW50IGlzIGludm9rZWQuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGhlIHNjb3BlZCBjb21wb25lbnQgZnVuY3Rpb24gdGhhdCwgYXMgdGhlIG9yaWdpbmFsXG4gKiBgY29tcG9uZW50YCBmdW5jdGlvbiwgdGFrZXMgYHNvdXJjZXNgIGFuZCByZXR1cm5zIGBzaW5rc2AuXG4gKiBAZnVuY3Rpb24gaXNvbGF0ZVxuICovXG5mdW5jdGlvbiBpc29sYXRlKGNvbXBvbmVudCwgc2NvcGUpIHtcbiAgICBpZiAoc2NvcGUgPT09IHZvaWQgMCkgeyBzY29wZSA9IG5ld1Njb3BlKCk7IH1cbiAgICBjaGVja0lzb2xhdGVBcmdzKGNvbXBvbmVudCwgc2NvcGUpO1xuICAgIHZhciByYW5kb21TY29wZSA9IHR5cGVvZiBzY29wZSA9PT0gJ29iamVjdCcgPyBuZXdTY29wZSgpIDogJyc7XG4gICAgdmFyIHNjb3BlcyA9IHR5cGVvZiBzY29wZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHNjb3BlID09PSAnb2JqZWN0J1xuICAgICAgICA/IHNjb3BlXG4gICAgICAgIDogc2NvcGUudG9TdHJpbmcoKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlZENvbXBvbmVudChvdXRlclNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHJlc3QgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHJlc3RbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNjb3Blc1BlckNoYW5uZWwgPSBub3JtYWxpemVTY29wZXMob3V0ZXJTb3VyY2VzLCBzY29wZXMsIHJhbmRvbVNjb3BlKTtcbiAgICAgICAgdmFyIGlubmVyU291cmNlcyA9IGlzb2xhdGVBbGxTb3VyY2VzKG91dGVyU291cmNlcywgc2NvcGVzUGVyQ2hhbm5lbCk7XG4gICAgICAgIHZhciBpbm5lclNpbmtzID0gY29tcG9uZW50LmFwcGx5KHZvaWQgMCwgW2lubmVyU291cmNlc10uY29uY2F0KHJlc3QpKTtcbiAgICAgICAgdmFyIG91dGVyU2lua3MgPSBpc29sYXRlQWxsU2lua3Mob3V0ZXJTb3VyY2VzLCBpbm5lclNpbmtzLCBzY29wZXNQZXJDaGFubmVsKTtcbiAgICAgICAgcmV0dXJuIG91dGVyU2lua3M7XG4gICAgfTtcbn1cbmlzb2xhdGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAoY291bnRlciA9IDApOyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gaXNvbGF0ZTtcbmZ1bmN0aW9uIHRvSXNvbGF0ZWQoc2NvcGUpIHtcbiAgICBpZiAoc2NvcGUgPT09IHZvaWQgMCkgeyBzY29wZSA9IG5ld1Njb3BlKCk7IH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGNvbXBvbmVudCkgeyByZXR1cm4gaXNvbGF0ZShjb21wb25lbnQsIHNjb3BlKTsgfTtcbn1cbmV4cG9ydHMudG9Jc29sYXRlZCA9IHRvSXNvbGF0ZWQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGZyb21FdmVudF8xID0gcmVxdWlyZShcIi4vZnJvbUV2ZW50XCIpO1xudmFyIEJvZHlET01Tb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQm9keURPTVNvdXJjZShfbmFtZSkge1xuICAgICAgICB0aGlzLl9uYW1lID0gX25hbWU7XG4gICAgfVxuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uYWxpdHkgaXMgc3RpbGwgdW5kZWZpbmVkL3VuZGVjaWRlZC5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBCb2R5RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQub2YoW2RvY3VtZW50LmJvZHldKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBCb2R5RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5vZihkb2N1bWVudC5ib2R5KSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBCb2R5RE9NU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBvcHRpb25zLCBidWJibGVzKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIHZhciBzdHJlYW07XG4gICAgICAgIHN0cmVhbSA9IGZyb21FdmVudF8xLmZyb21FdmVudChkb2N1bWVudC5ib2R5LCBldmVudFR5cGUsIG9wdGlvbnMudXNlQ2FwdHVyZSwgb3B0aW9ucy5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHN0cmVhbSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICByZXR1cm4gQm9keURPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLkJvZHlET01Tb3VyY2UgPSBCb2R5RE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Qm9keURPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGZyb21FdmVudF8xID0gcmVxdWlyZShcIi4vZnJvbUV2ZW50XCIpO1xudmFyIERvY3VtZW50RE9NU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERvY3VtZW50RE9NU291cmNlKF9uYW1lKSB7XG4gICAgICAgIHRoaXMuX25hbWUgPSBfbmFtZTtcbiAgICB9XG4gICAgRG9jdW1lbnRET01Tb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uYWxpdHkgaXMgc3RpbGwgdW5kZWZpbmVkL3VuZGVjaWRlZC5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBEb2N1bWVudERPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0Lm9mKFtkb2N1bWVudF0pKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIERvY3VtZW50RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5vZihkb2N1bWVudCkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgRG9jdW1lbnRET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMsIGJ1YmJsZXMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdmFyIHN0cmVhbTtcbiAgICAgICAgc3RyZWFtID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KGRvY3VtZW50LCBldmVudFR5cGUsIG9wdGlvbnMudXNlQ2FwdHVyZSwgb3B0aW9ucy5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHN0cmVhbSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICByZXR1cm4gRG9jdW1lbnRET01Tb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5Eb2N1bWVudERPTVNvdXJjZSA9IERvY3VtZW50RE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RG9jdW1lbnRET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU2NvcGVDaGVja2VyXzEgPSByZXF1aXJlKFwiLi9TY29wZUNoZWNrZXJcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuZnVuY3Rpb24gdG9FbEFycmF5KGlucHV0KSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0KTtcbn1cbnZhciBFbGVtZW50RmluZGVyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEVsZW1lbnRGaW5kZXIobmFtZXNwYWNlLCBpc29sYXRlTW9kdWxlKSB7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgICAgICB0aGlzLmlzb2xhdGVNb2R1bGUgPSBpc29sYXRlTW9kdWxlO1xuICAgIH1cbiAgICBFbGVtZW50RmluZGVyLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbmFtZXNwYWNlID0gdGhpcy5uYW1lc3BhY2U7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IHV0aWxzXzEuZ2V0U2VsZWN0b3JzKG5hbWVzcGFjZSk7XG4gICAgICAgIHZhciBzY29wZUNoZWNrZXIgPSBuZXcgU2NvcGVDaGVja2VyXzEuU2NvcGVDaGVja2VyKG5hbWVzcGFjZSwgdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgdmFyIHRvcE5vZGUgPSB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0RWxlbWVudChuYW1lc3BhY2UuZmlsdGVyKGZ1bmN0aW9uIChuKSB7IHJldHVybiBuLnR5cGUgIT09ICdzZWxlY3Rvcic7IH0pKTtcbiAgICAgICAgaWYgKHRvcE5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiBbdG9wTm9kZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvRWxBcnJheSh0b3BOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKVxuICAgICAgICAgICAgLmZpbHRlcihzY29wZUNoZWNrZXIuaXNEaXJlY3RseUluU2NvcGUsIHNjb3BlQ2hlY2tlcilcbiAgICAgICAgICAgIC5jb25jYXQodG9wTm9kZS5tYXRjaGVzKHNlbGVjdG9yKSA/IFt0b3BOb2RlXSA6IFtdKTtcbiAgICB9O1xuICAgIHJldHVybiBFbGVtZW50RmluZGVyO1xufSgpKTtcbmV4cG9ydHMuRWxlbWVudEZpbmRlciA9IEVsZW1lbnRGaW5kZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FbGVtZW50RmluZGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBTY29wZUNoZWNrZXJfMSA9IHJlcXVpcmUoXCIuL1Njb3BlQ2hlY2tlclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgRWxlbWVudEZpbmRlcl8xID0gcmVxdWlyZShcIi4vRWxlbWVudEZpbmRlclwiKTtcbnZhciBTeW1ib2xUcmVlXzEgPSByZXF1aXJlKFwiLi9TeW1ib2xUcmVlXCIpO1xudmFyIFJlbW92YWxTZXRfMSA9IHJlcXVpcmUoXCIuL1JlbW92YWxTZXRcIik7XG52YXIgUHJpb3JpdHlRdWV1ZV8xID0gcmVxdWlyZShcIi4vUHJpb3JpdHlRdWV1ZVwiKTtcbnZhciBmcm9tRXZlbnRfMSA9IHJlcXVpcmUoXCIuL2Zyb21FdmVudFwiKTtcbmV4cG9ydHMuZXZlbnRUeXBlc1RoYXREb250QnViYmxlID0gW1xuICAgIFwiYmx1clwiLFxuICAgIFwiY2FucGxheVwiLFxuICAgIFwiY2FucGxheXRocm91Z2hcIixcbiAgICBcImR1cmF0aW9uY2hhbmdlXCIsXG4gICAgXCJlbXB0aWVkXCIsXG4gICAgXCJlbmRlZFwiLFxuICAgIFwiZm9jdXNcIixcbiAgICBcImxvYWRcIixcbiAgICBcImxvYWRlZGRhdGFcIixcbiAgICBcImxvYWRlZG1ldGFkYXRhXCIsXG4gICAgXCJtb3VzZWVudGVyXCIsXG4gICAgXCJtb3VzZWxlYXZlXCIsXG4gICAgXCJwYXVzZVwiLFxuICAgIFwicGxheVwiLFxuICAgIFwicGxheWluZ1wiLFxuICAgIFwicmF0ZWNoYW5nZVwiLFxuICAgIFwicmVzZXRcIixcbiAgICBcInNjcm9sbFwiLFxuICAgIFwic2Vla2VkXCIsXG4gICAgXCJzZWVraW5nXCIsXG4gICAgXCJzdGFsbGVkXCIsXG4gICAgXCJzdWJtaXRcIixcbiAgICBcInN1c3BlbmRcIixcbiAgICBcInRpbWV1cGRhdGVcIixcbiAgICBcInVubG9hZFwiLFxuICAgIFwidm9sdW1lY2hhbmdlXCIsXG4gICAgXCJ3YWl0aW5nXCIsXG5dO1xuLyoqXG4gKiBNYW5hZ2VzIFwiRXZlbnQgZGVsZWdhdGlvblwiLCBieSBjb25uZWN0aW5nIGFuIG9yaWdpbiB3aXRoIG11bHRpcGxlXG4gKiBkZXN0aW5hdGlvbnMuXG4gKlxuICogQXR0YWNoZXMgYSBET00gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIERPTSBlbGVtZW50IGNhbGxlZCB0aGUgXCJvcmlnaW5cIixcbiAqIGFuZCBkZWxlZ2F0ZXMgZXZlbnRzIHRvIFwiZGVzdGluYXRpb25zXCIsIHdoaWNoIGFyZSBzdWJqZWN0cyBhcyBvdXRwdXRzXG4gKiBmb3IgdGhlIERPTVNvdXJjZS4gU2ltdWxhdGVzIGJ1YmJsaW5nIG9yIGNhcHR1cmluZywgd2l0aCByZWdhcmRzIHRvXG4gKiBpc29sYXRpb24gYm91bmRhcmllcyB0b28uXG4gKi9cbnZhciBFdmVudERlbGVnYXRvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFdmVudERlbGVnYXRvcihyb290RWxlbWVudCQsIGlzb2xhdGVNb2R1bGUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCQgPSByb290RWxlbWVudCQ7XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZSA9IGlzb2xhdGVNb2R1bGU7XG4gICAgICAgIHRoaXMudmlydHVhbExpc3RlbmVycyA9IG5ldyBTeW1ib2xUcmVlXzEuZGVmYXVsdChmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5zY29wZTsgfSk7XG4gICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnNUb0FkZCA9IG5ldyBSZW1vdmFsU2V0XzEuZGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnZpcnR1YWxOb25CdWJibGluZ0xpc3RlbmVyID0gW107XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZS5zZXRFdmVudERlbGVnYXRvcih0aGlzKTtcbiAgICAgICAgdGhpcy5kb21MaXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuZG9tTGlzdGVuZXJzVG9BZGQgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHJvb3RFbGVtZW50JC5hZGRMaXN0ZW5lcih7XG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMub3JpZ2luICE9PSBlbCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vcmlnaW4gPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucmVzZXRFdmVudExpc3RlbmVycygpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5kb21MaXN0ZW5lcnNUb0FkZC5mb3JFYWNoKGZ1bmN0aW9uIChwYXNzaXZlLCB0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuc2V0dXBET01MaXN0ZW5lcih0eXBlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmRvbUxpc3RlbmVyc1RvQWRkLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzLnJlc2V0Tm9uQnViYmxpbmdMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5ub25CdWJibGluZ0xpc3RlbmVyc1RvQWRkLmZvckVhY2goZnVuY3Rpb24gKGFycikge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5zZXR1cE5vbkJ1YmJsaW5nTGlzdGVuZXIoYXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG5hbWVzcGFjZSwgb3B0aW9ucywgYnViYmxlcykge1xuICAgICAgICB2YXIgc3ViamVjdCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm5ldmVyKCk7XG4gICAgICAgIHZhciBzY29wZUNoZWNrZXIgPSBuZXcgU2NvcGVDaGVja2VyXzEuU2NvcGVDaGVja2VyKG5hbWVzcGFjZSwgdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgdmFyIGRlc3QgPSB0aGlzLmluc2VydExpc3RlbmVyKHN1YmplY3QsIHNjb3BlQ2hlY2tlciwgZXZlbnRUeXBlLCBvcHRpb25zKTtcbiAgICAgICAgdmFyIHNob3VsZEJ1YmJsZSA9IGJ1YmJsZXMgPT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBleHBvcnRzLmV2ZW50VHlwZXNUaGF0RG9udEJ1YmJsZS5pbmRleE9mKGV2ZW50VHlwZSkgPT09IC0xXG4gICAgICAgICAgICA6IGJ1YmJsZXM7XG4gICAgICAgIGlmIChzaG91bGRCdWJibGUpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kb21MaXN0ZW5lcnMuaGFzKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldHVwRE9NTGlzdGVuZXIoZXZlbnRUeXBlLCAhIW9wdGlvbnMucGFzc2l2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgZmluZGVyID0gbmV3IEVsZW1lbnRGaW5kZXJfMS5FbGVtZW50RmluZGVyKG5hbWVzcGFjZSwgdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0dXBOb25CdWJibGluZ0xpc3RlbmVyKFtldmVudFR5cGUsIGZpbmRlciwgZGVzdF0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdWJqZWN0O1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnJlbW92ZUVsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCwgbmFtZXNwYWNlKSB7XG4gICAgICAgIGlmIChuYW1lc3BhY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy52aXJ0dWFsTGlzdGVuZXJzLmRlbGV0ZShuYW1lc3BhY2UpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0b1JlbW92ZSA9IFtdO1xuICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKG1hcCwgdHlwZSkge1xuICAgICAgICAgICAgaWYgKG1hcC5oYXMoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICB0b1JlbW92ZS5wdXNoKFt0eXBlLCBlbGVtZW50XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRvUmVtb3ZlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5nZXQodG9SZW1vdmVbaV1bMF0pO1xuICAgICAgICAgICAgaWYgKCFtYXApIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1hcC5kZWxldGUodG9SZW1vdmVbaV1bMV0pO1xuICAgICAgICAgICAgaWYgKG1hcC5zaXplID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5kZWxldGUodG9SZW1vdmVbaV1bMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5zZXQodG9SZW1vdmVbaV1bMF0sIG1hcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5pbnNlcnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChzdWJqZWN0LCBzY29wZUNoZWNrZXIsIGV2ZW50VHlwZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgcmVsZXZhbnRTZXRzID0gW107XG4gICAgICAgIHZhciBuID0gc2NvcGVDaGVja2VyLl9uYW1lc3BhY2U7XG4gICAgICAgIHZhciBtYXggPSBuLmxlbmd0aDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgcmVsZXZhbnRTZXRzLnB1c2godGhpcy5nZXRWaXJ0dWFsTGlzdGVuZXJzKGV2ZW50VHlwZSwgbiwgdHJ1ZSwgbWF4KSk7XG4gICAgICAgICAgICBtYXgtLTtcbiAgICAgICAgfSB3aGlsZSAobWF4ID49IDAgJiYgblttYXhdLnR5cGUgIT09ICd0b3RhbCcpO1xuICAgICAgICB2YXIgZGVzdGluYXRpb24gPSBfX2Fzc2lnbih7fSwgb3B0aW9ucywgeyBzY29wZUNoZWNrZXI6IHNjb3BlQ2hlY2tlcixcbiAgICAgICAgICAgIHN1YmplY3Q6IHN1YmplY3QsIGJ1YmJsZXM6ICEhb3B0aW9ucy5idWJibGVzLCB1c2VDYXB0dXJlOiAhIW9wdGlvbnMudXNlQ2FwdHVyZSwgcGFzc2l2ZTogISFvcHRpb25zLnBhc3NpdmUgfSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVsZXZhbnRTZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZWxldmFudFNldHNbaV0uYWRkKGRlc3RpbmF0aW9uLCBuLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlc3RpbmF0aW9uO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHNldCBvZiBhbGwgdmlydHVhbCBsaXN0ZW5lcnMgaW4gdGhlIHNjb3BlIG9mIHRoZSBuYW1lc3BhY2VcbiAgICAgKiBTZXQgYGV4YWN0YCB0byB0cnVlIHRvIHRyZWF0IHNpYmlsaW5nIGlzb2xhdGVkIHNjb3BlcyBhcyB0b3RhbCBzY29wZXNcbiAgICAgKi9cbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuZ2V0VmlydHVhbExpc3RlbmVycyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG5hbWVzcGFjZSwgZXhhY3QsIG1heCkge1xuICAgICAgICBpZiAoZXhhY3QgPT09IHZvaWQgMCkgeyBleGFjdCA9IGZhbHNlOyB9XG4gICAgICAgIHZhciBfbWF4ID0gbWF4ICE9PSB1bmRlZmluZWQgPyBtYXggOiBuYW1lc3BhY2UubGVuZ3RoO1xuICAgICAgICBpZiAoIWV4YWN0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gX21heCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVzcGFjZVtpXS50eXBlID09PSAndG90YWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIF9tYXggPSBpICsgMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9tYXggPSBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBtYXAgPSB0aGlzLnZpcnR1YWxMaXN0ZW5lcnMuZ2V0RGVmYXVsdChuYW1lc3BhY2UsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBNYXAoKTsgfSwgX21heCk7XG4gICAgICAgIGlmICghbWFwLmhhcyhldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBtYXAuc2V0KGV2ZW50VHlwZSwgbmV3IFByaW9yaXR5UXVldWVfMS5kZWZhdWx0KCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXAuZ2V0KGV2ZW50VHlwZSk7XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuc2V0dXBET01MaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudFR5cGUsIHBhc3NpdmUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMub3JpZ2luKSB7XG4gICAgICAgICAgICB2YXIgc3ViID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KHRoaXMub3JpZ2luLCBldmVudFR5cGUsIGZhbHNlLCBmYWxzZSwgcGFzc2l2ZSkuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoZXZlbnQpIHsgcmV0dXJuIF90aGlzLm9uRXZlbnQoZXZlbnRUeXBlLCBldmVudCwgcGFzc2l2ZSk7IH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmRvbUxpc3RlbmVycy5zZXQoZXZlbnRUeXBlLCB7IHN1Yjogc3ViLCBwYXNzaXZlOiBwYXNzaXZlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kb21MaXN0ZW5lcnNUb0FkZC5zZXQoZXZlbnRUeXBlLCBwYXNzaXZlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnNldHVwTm9uQnViYmxpbmdMaXN0ZW5lciA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gaW5wdXRbMF0sIGVsZW1lbnRGaW5kZXIgPSBpbnB1dFsxXSwgZGVzdGluYXRpb24gPSBpbnB1dFsyXTtcbiAgICAgICAgaWYgKCF0aGlzLm9yaWdpbikge1xuICAgICAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVyc1RvQWRkLmFkZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVsZW1lbnQgPSBlbGVtZW50RmluZGVyLmNhbGwoKVswXTtcbiAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnNUb0FkZC5kZWxldGUoaW5wdXQpO1xuICAgICAgICAgICAgdmFyIHN1YiA9IGZyb21FdmVudF8xLmZyb21FdmVudChlbGVtZW50LCBldmVudFR5cGUsIGZhbHNlLCBmYWxzZSwgZGVzdGluYXRpb24ucGFzc2l2ZSkuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoZXYpIHsgcmV0dXJuIF90aGlzLm9uRXZlbnQoZXZlbnRUeXBlLCBldiwgISFkZXN0aW5hdGlvbi5wYXNzaXZlLCBmYWxzZSk7IH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIXRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuaGFzKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLnNldChldmVudFR5cGUsIG5ldyBNYXAoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5nZXQoZXZlbnRUeXBlKTtcbiAgICAgICAgICAgIGlmICghbWFwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFwLnNldChlbGVtZW50LCB7IHN1Yjogc3ViLCBkZXN0aW5hdGlvbjogZGVzdGluYXRpb24gfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzVG9BZGQuYWRkKGlucHV0KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnJlc2V0RXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpdGVyID0gdGhpcy5kb21MaXN0ZW5lcnMuZW50cmllcygpO1xuICAgICAgICB2YXIgY3VyciA9IGl0ZXIubmV4dCgpO1xuICAgICAgICB3aGlsZSAoIWN1cnIuZG9uZSkge1xuICAgICAgICAgICAgdmFyIF9hID0gY3Vyci52YWx1ZSwgdHlwZSA9IF9hWzBdLCBfYiA9IF9hWzFdLCBzdWIgPSBfYi5zdWIsIHBhc3NpdmUgPSBfYi5wYXNzaXZlO1xuICAgICAgICAgICAgc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLnNldHVwRE9NTGlzdGVuZXIodHlwZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICBjdXJyID0gaXRlci5uZXh0KCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5yZXNldE5vbkJ1YmJsaW5nTGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgbmV3TWFwID0gbmV3IE1hcCgpO1xuICAgICAgICB2YXIgaW5zZXJ0ID0gdXRpbHNfMS5tYWtlSW5zZXJ0KG5ld01hcCk7XG4gICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAobWFwLCB0eXBlKSB7XG4gICAgICAgICAgICBtYXAuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGVsbSkge1xuICAgICAgICAgICAgICAgIGlmICghZG9jdW1lbnQuYm9keS5jb250YWlucyhlbG0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdWIgPSB2YWx1ZS5zdWIsIGRlc3RpbmF0aW9uXzEgPSB2YWx1ZS5kZXN0aW5hdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1Yikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRGaW5kZXIgPSBuZXcgRWxlbWVudEZpbmRlcl8xLkVsZW1lbnRGaW5kZXIoZGVzdGluYXRpb25fMS5zY29wZUNoZWNrZXIubmFtZXNwYWNlLCBfdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0VsbSA9IGVsZW1lbnRGaW5kZXIuY2FsbCgpWzBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3U3ViID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KG5ld0VsbSwgdHlwZSwgZmFsc2UsIGZhbHNlLCBkZXN0aW5hdGlvbl8xLnBhc3NpdmUpLnN1YnNjcmliZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMub25FdmVudCh0eXBlLCBldmVudCwgISFkZXN0aW5hdGlvbl8xLnBhc3NpdmUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGluc2VydCh0eXBlLCBuZXdFbG0sIHsgc3ViOiBuZXdTdWIsIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbl8xIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0KHR5cGUsIGVsbSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgX3RoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMgPSBuZXdNYXA7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnB1dE5vbkJ1YmJsaW5nTGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBlbG0sIHVzZUNhcHR1cmUsIHBhc3NpdmUpIHtcbiAgICAgICAgdmFyIG1hcCA9IHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuZ2V0KGV2ZW50VHlwZSk7XG4gICAgICAgIGlmICghbWFwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxpc3RlbmVyID0gbWFwLmdldChlbG0pO1xuICAgICAgICBpZiAobGlzdGVuZXIgJiZcbiAgICAgICAgICAgIGxpc3RlbmVyLmRlc3RpbmF0aW9uLnBhc3NpdmUgPT09IHBhc3NpdmUgJiZcbiAgICAgICAgICAgIGxpc3RlbmVyLmRlc3RpbmF0aW9uLnVzZUNhcHR1cmUgPT09IHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgIHRoaXMudmlydHVhbE5vbkJ1YmJsaW5nTGlzdGVuZXJbMF0gPSBsaXN0ZW5lci5kZXN0aW5hdGlvbjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLm9uRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBldmVudCwgcGFzc2l2ZSwgYnViYmxlcykge1xuICAgICAgICBpZiAoYnViYmxlcyA9PT0gdm9pZCAwKSB7IGJ1YmJsZXMgPSB0cnVlOyB9XG4gICAgICAgIHZhciBjeWNsZUV2ZW50ID0gdGhpcy5wYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgdmFyIHJvb3RFbGVtZW50ID0gdGhpcy5pc29sYXRlTW9kdWxlLmdldFJvb3RFbGVtZW50KGV2ZW50LnRhcmdldCk7XG4gICAgICAgIGlmIChidWJibGVzKSB7XG4gICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gdGhpcy5pc29sYXRlTW9kdWxlLmdldE5hbWVzcGFjZShldmVudC50YXJnZXQpO1xuICAgICAgICAgICAgaWYgKCFuYW1lc3BhY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRWaXJ0dWFsTGlzdGVuZXJzKGV2ZW50VHlwZSwgbmFtZXNwYWNlKTtcbiAgICAgICAgICAgIHRoaXMuYnViYmxlKGV2ZW50VHlwZSwgZXZlbnQudGFyZ2V0LCByb290RWxlbWVudCwgY3ljbGVFdmVudCwgbGlzdGVuZXJzLCBuYW1lc3BhY2UsIG5hbWVzcGFjZS5sZW5ndGggLSAxLCB0cnVlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgIHRoaXMuYnViYmxlKGV2ZW50VHlwZSwgZXZlbnQudGFyZ2V0LCByb290RWxlbWVudCwgY3ljbGVFdmVudCwgbGlzdGVuZXJzLCBuYW1lc3BhY2UsIG5hbWVzcGFjZS5sZW5ndGggLSAxLCBmYWxzZSwgcGFzc2l2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnB1dE5vbkJ1YmJsaW5nTGlzdGVuZXIoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIHRydWUsIHBhc3NpdmUpO1xuICAgICAgICAgICAgdGhpcy5kb0J1YmJsZVN0ZXAoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIHJvb3RFbGVtZW50LCBjeWNsZUV2ZW50LCB0aGlzLnZpcnR1YWxOb25CdWJibGluZ0xpc3RlbmVyLCB0cnVlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgIHRoaXMucHV0Tm9uQnViYmxpbmdMaXN0ZW5lcihldmVudFR5cGUsIGV2ZW50LnRhcmdldCwgZmFsc2UsIHBhc3NpdmUpO1xuICAgICAgICAgICAgdGhpcy5kb0J1YmJsZVN0ZXAoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIHJvb3RFbGVtZW50LCBjeWNsZUV2ZW50LCB0aGlzLnZpcnR1YWxOb25CdWJibGluZ0xpc3RlbmVyLCBmYWxzZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgLy9maXggcmVzZXQgZXZlbnQgKHNwZWMnZWQgYXMgbm9uLWJ1YmJsaW5nLCBidXQgYnViYmxlcyBpbiByZWFsaXR5XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5idWJibGUgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBlbG0sIHJvb3RFbGVtZW50LCBldmVudCwgbGlzdGVuZXJzLCBuYW1lc3BhY2UsIGluZGV4LCB1c2VDYXB0dXJlLCBwYXNzaXZlKSB7XG4gICAgICAgIGlmICghdXNlQ2FwdHVyZSAmJiAhZXZlbnQucHJvcGFnYXRpb25IYXNCZWVuU3RvcHBlZCkge1xuICAgICAgICAgICAgdGhpcy5kb0J1YmJsZVN0ZXAoZXZlbnRUeXBlLCBlbG0sIHJvb3RFbGVtZW50LCBldmVudCwgbGlzdGVuZXJzLCB1c2VDYXB0dXJlLCBwYXNzaXZlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmV3Um9vdCA9IHJvb3RFbGVtZW50O1xuICAgICAgICB2YXIgbmV3SW5kZXggPSBpbmRleDtcbiAgICAgICAgaWYgKGVsbSA9PT0gcm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSAwICYmIG5hbWVzcGFjZVtpbmRleF0udHlwZSA9PT0gJ3NpYmxpbmcnKSB7XG4gICAgICAgICAgICAgICAgbmV3Um9vdCA9IHRoaXMuaXNvbGF0ZU1vZHVsZS5nZXRFbGVtZW50KG5hbWVzcGFjZSwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIG5ld0luZGV4LS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsbS5wYXJlbnROb2RlICYmIG5ld1Jvb3QpIHtcbiAgICAgICAgICAgIHRoaXMuYnViYmxlKGV2ZW50VHlwZSwgZWxtLnBhcmVudE5vZGUsIG5ld1Jvb3QsIGV2ZW50LCBsaXN0ZW5lcnMsIG5hbWVzcGFjZSwgbmV3SW5kZXgsIHVzZUNhcHR1cmUsIHBhc3NpdmUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1c2VDYXB0dXJlICYmICFldmVudC5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkKSB7XG4gICAgICAgICAgICB0aGlzLmRvQnViYmxlU3RlcChldmVudFR5cGUsIGVsbSwgcm9vdEVsZW1lbnQsIGV2ZW50LCBsaXN0ZW5lcnMsIHVzZUNhcHR1cmUsIHBhc3NpdmUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuZG9CdWJibGVTdGVwID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgZWxtLCByb290RWxlbWVudCwgZXZlbnQsIGxpc3RlbmVycywgdXNlQ2FwdHVyZSwgcGFzc2l2ZSkge1xuICAgICAgICBpZiAoIXJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tdXRhdGVFdmVudEN1cnJlbnRUYXJnZXQoZXZlbnQsIGVsbSk7XG4gICAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgICAgICBpZiAoZGVzdC5wYXNzaXZlID09PSBwYXNzaXZlICYmIGRlc3QudXNlQ2FwdHVyZSA9PT0gdXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgICAgIHZhciBzZWwgPSB1dGlsc18xLmdldFNlbGVjdG9ycyhkZXN0LnNjb3BlQ2hlY2tlci5uYW1lc3BhY2UpO1xuICAgICAgICAgICAgICAgIGlmICghZXZlbnQucHJvcGFnYXRpb25IYXNCZWVuU3RvcHBlZCAmJlxuICAgICAgICAgICAgICAgICAgICBkZXN0LnNjb3BlQ2hlY2tlci5pc0RpcmVjdGx5SW5TY29wZShlbG0pICYmXG4gICAgICAgICAgICAgICAgICAgICgoc2VsICE9PSAnJyAmJiBlbG0ubWF0Y2hlcyhzZWwpKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKHNlbCA9PT0gJycgJiYgZWxtID09PSByb290RWxlbWVudCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb21FdmVudF8xLnByZXZlbnREZWZhdWx0Q29uZGl0aW9uYWwoZXZlbnQsIGRlc3QucHJldmVudERlZmF1bHQpO1xuICAgICAgICAgICAgICAgICAgICBkZXN0LnN1YmplY3Quc2hhbWVmdWxseVNlbmROZXh0KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnBhdGNoRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHBFdmVudCA9IGV2ZW50O1xuICAgICAgICBwRXZlbnQucHJvcGFnYXRpb25IYXNCZWVuU3RvcHBlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgb2xkU3RvcFByb3BhZ2F0aW9uID0gcEV2ZW50LnN0b3BQcm9wYWdhdGlvbjtcbiAgICAgICAgcEV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICAgICAgICAgIG9sZFN0b3BQcm9wYWdhdGlvbi5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHBFdmVudDtcbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5tdXRhdGVFdmVudEN1cnJlbnRUYXJnZXQgPSBmdW5jdGlvbiAoZXZlbnQsIGN1cnJlbnRUYXJnZXRFbGVtZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsIFwiY3VycmVudFRhcmdldFwiLCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGN1cnJlbnRUYXJnZXRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicGxlYXNlIHVzZSBldmVudC5vd25lclRhcmdldFwiKTtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5vd25lclRhcmdldCA9IGN1cnJlbnRUYXJnZXRFbGVtZW50O1xuICAgIH07XG4gICAgcmV0dXJuIEV2ZW50RGVsZWdhdG9yO1xufSgpKTtcbmV4cG9ydHMuRXZlbnREZWxlZ2F0b3IgPSBFdmVudERlbGVnYXRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUV2ZW50RGVsZWdhdG9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBTeW1ib2xUcmVlXzEgPSByZXF1aXJlKFwiLi9TeW1ib2xUcmVlXCIpO1xudmFyIElzb2xhdGVNb2R1bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSXNvbGF0ZU1vZHVsZSgpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VUcmVlID0gbmV3IFN5bWJvbFRyZWVfMS5kZWZhdWx0KGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnNjb3BlOyB9KTtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMudm5vZGVzQmVpbmdSZW1vdmVkID0gW107XG4gICAgfVxuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLnNldEV2ZW50RGVsZWdhdG9yID0gZnVuY3Rpb24gKGRlbCkge1xuICAgICAgICB0aGlzLmV2ZW50RGVsZWdhdG9yID0gZGVsO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuaW5zZXJ0RWxlbWVudCA9IGZ1bmN0aW9uIChuYW1lc3BhY2UsIGVsKSB7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlQnlFbGVtZW50LnNldChlbCwgbmFtZXNwYWNlKTtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VUcmVlLnNldChuYW1lc3BhY2UsIGVsKTtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLnJlbW92ZUVsZW1lbnQgPSBmdW5jdGlvbiAoZWxtKSB7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlQnlFbGVtZW50LmRlbGV0ZShlbG0pO1xuICAgICAgICB2YXIgbmFtZXNwYWNlID0gdGhpcy5nZXROYW1lc3BhY2UoZWxtKTtcbiAgICAgICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgICAgICAgdGhpcy5uYW1lc3BhY2VUcmVlLmRlbGV0ZShuYW1lc3BhY2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5nZXRFbGVtZW50ID0gZnVuY3Rpb24gKG5hbWVzcGFjZSwgbWF4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWVzcGFjZVRyZWUuZ2V0KG5hbWVzcGFjZSwgdW5kZWZpbmVkLCBtYXgpO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuZ2V0Um9vdEVsZW1lbnQgPSBmdW5jdGlvbiAoZWxtKSB7XG4gICAgICAgIGlmICh0aGlzLm5hbWVzcGFjZUJ5RWxlbWVudC5oYXMoZWxtKSkge1xuICAgICAgICAgICAgcmV0dXJuIGVsbTtcbiAgICAgICAgfVxuICAgICAgICAvL1RPRE86IEFkZCBxdWljay1scnUgb3Igc2ltaWxhciBhcyBhZGRpdGlvbmFsIE8oMSkgY2FjaGVcbiAgICAgICAgdmFyIGN1cnIgPSBlbG07XG4gICAgICAgIHdoaWxlICghdGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQuaGFzKGN1cnIpKSB7XG4gICAgICAgICAgICBjdXJyID0gY3Vyci5wYXJlbnROb2RlO1xuICAgICAgICAgICAgaWYgKCFjdXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGN1cnIudGFnTmFtZSA9PT0gJ0hUTUwnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByb290IGVsZW1lbnQgZm91bmQsIHRoaXMgc2hvdWxkIG5vdCBoYXBwZW4gYXQgYWxsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnI7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5nZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAoZWxtKSB7XG4gICAgICAgIHZhciByb290RWxlbWVudCA9IHRoaXMuZ2V0Um9vdEVsZW1lbnQoZWxtKTtcbiAgICAgICAgaWYgKCFyb290RWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQuZ2V0KHJvb3RFbGVtZW50KTtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmNyZWF0ZU1vZHVsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoZW1wdHlWTm9kZSwgdk5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWxtID0gdk5vZGUuZWxtLCBfYSA9IHZOb2RlLmRhdGEsIGRhdGEgPSBfYSA9PT0gdm9pZCAwID8ge30gOiBfYTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gZGF0YS5pc29sYXRlO1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5hbWVzcGFjZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbnNlcnRFbGVtZW50KG5hbWVzcGFjZSwgZWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlOiBmdW5jdGlvbiAob2xkVk5vZGUsIHZOb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZEVsbSA9IG9sZFZOb2RlLmVsbSwgX2EgPSBvbGRWTm9kZS5kYXRhLCBvbGREYXRhID0gX2EgPT09IHZvaWQgMCA/IHt9IDogX2E7XG4gICAgICAgICAgICAgICAgdmFyIGVsbSA9IHZOb2RlLmVsbSwgX2IgPSB2Tm9kZS5kYXRhLCBkYXRhID0gX2IgPT09IHZvaWQgMCA/IHt9IDogX2I7XG4gICAgICAgICAgICAgICAgdmFyIG9sZE5hbWVzcGFjZSA9IG9sZERhdGEuaXNvbGF0ZTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gZGF0YS5pc29sYXRlO1xuICAgICAgICAgICAgICAgIGlmICghdXRpbHNfMS5pc0VxdWFsTmFtZXNwYWNlKG9sZE5hbWVzcGFjZSwgbmFtZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvbGROYW1lc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUVsZW1lbnQob2xkRWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShuYW1lc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5zZXJ0RWxlbWVudChuYW1lc3BhY2UsIGVsbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICh2Tm9kZSkge1xuICAgICAgICAgICAgICAgIHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkLnB1c2godk5vZGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKHZOb2RlLCBjYikge1xuICAgICAgICAgICAgICAgIHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkLnB1c2godk5vZGUpO1xuICAgICAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9zdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB2bm9kZXNCZWluZ1JlbW92ZWQgPSBzZWxmLnZub2Rlc0JlaW5nUmVtb3ZlZDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdm5vZGVzQmVpbmdSZW1vdmVkLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2bm9kZSA9IHZub2Rlc0JlaW5nUmVtb3ZlZFtpXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVzcGFjZSA9IHZub2RlLmRhdGEgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgPyB2bm9kZS5kYXRhLmlzb2xhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lc3BhY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVFbGVtZW50KG5hbWVzcGFjZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5ldmVudERlbGVnYXRvci5yZW1vdmVFbGVtZW50KHZub2RlLmVsbSwgbmFtZXNwYWNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQgPSBbXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfTtcbiAgICByZXR1cm4gSXNvbGF0ZU1vZHVsZTtcbn0oKSk7XG5leHBvcnRzLklzb2xhdGVNb2R1bGUgPSBJc29sYXRlTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SXNvbGF0ZU1vZHVsZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIERvY3VtZW50RE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9Eb2N1bWVudERPTVNvdXJjZVwiKTtcbnZhciBCb2R5RE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9Cb2R5RE9NU291cmNlXCIpO1xudmFyIEVsZW1lbnRGaW5kZXJfMSA9IHJlcXVpcmUoXCIuL0VsZW1lbnRGaW5kZXJcIik7XG52YXIgaXNvbGF0ZV8xID0gcmVxdWlyZShcIi4vaXNvbGF0ZVwiKTtcbnZhciBNYWluRE9NU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1haW5ET01Tb3VyY2UoX3Jvb3RFbGVtZW50JCwgX3Nhbml0YXRpb24kLCBfbmFtZXNwYWNlLCBfaXNvbGF0ZU1vZHVsZSwgX2V2ZW50RGVsZWdhdG9yLCBfbmFtZSkge1xuICAgICAgICBpZiAoX25hbWVzcGFjZSA9PT0gdm9pZCAwKSB7IF9uYW1lc3BhY2UgPSBbXTsgfVxuICAgICAgICB0aGlzLl9yb290RWxlbWVudCQgPSBfcm9vdEVsZW1lbnQkO1xuICAgICAgICB0aGlzLl9zYW5pdGF0aW9uJCA9IF9zYW5pdGF0aW9uJDtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gX25hbWVzcGFjZTtcbiAgICAgICAgdGhpcy5faXNvbGF0ZU1vZHVsZSA9IF9pc29sYXRlTW9kdWxlO1xuICAgICAgICB0aGlzLl9ldmVudERlbGVnYXRvciA9IF9ldmVudERlbGVnYXRvcjtcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xuICAgICAgICB0aGlzLmlzb2xhdGVTb3VyY2UgPSBmdW5jdGlvbiAoc291cmNlLCBzY29wZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYWluRE9NU291cmNlKHNvdXJjZS5fcm9vdEVsZW1lbnQkLCBzb3VyY2UuX3Nhbml0YXRpb24kLCBzb3VyY2UuX25hbWVzcGFjZS5jb25jYXQoaXNvbGF0ZV8xLmdldFNjb3BlT2JqKHNjb3BlKSksIHNvdXJjZS5faXNvbGF0ZU1vZHVsZSwgc291cmNlLl9ldmVudERlbGVnYXRvciwgc291cmNlLl9uYW1lKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5pc29sYXRlU2luayA9IGlzb2xhdGVfMS5tYWtlSXNvbGF0ZVNpbmsodGhpcy5fbmFtZXNwYWNlKTtcbiAgICB9XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuX2VsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fbmFtZXNwYWNlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50JC5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIFt4XTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudEZpbmRlcl8xID0gbmV3IEVsZW1lbnRGaW5kZXJfMS5FbGVtZW50RmluZGVyKHRoaXMuX25hbWVzcGFjZSwgdGhpcy5faXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcm9vdEVsZW1lbnQkLm1hcChmdW5jdGlvbiAoKSB7IHJldHVybiBlbGVtZW50RmluZGVyXzEuY2FsbCgpOyB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHRoaXMuX2VsZW1lbnRzKCkucmVtZW1iZXIoKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh0aGlzLl9lbGVtZW50cygpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChhcnIpIHsgcmV0dXJuIGFyci5sZW5ndGggPiAwOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoYXJyKSB7IHJldHVybiBhcnJbMF07IH0pXG4gICAgICAgICAgICAucmVtZW1iZXIoKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUsIFwibmFtZXNwYWNlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRPTSBkcml2ZXIncyBzZWxlY3QoKSBleHBlY3RzIHRoZSBhcmd1bWVudCB0byBiZSBhIFwiICtcbiAgICAgICAgICAgICAgICBcInN0cmluZyBhcyBhIENTUyBzZWxlY3RvclwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICdkb2N1bWVudCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRG9jdW1lbnRET01Tb3VyY2VfMS5Eb2N1bWVudERPTVNvdXJjZSh0aGlzLl9uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICdib2R5Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBCb2R5RE9NU291cmNlXzEuQm9keURPTVNvdXJjZSh0aGlzLl9uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZXNwYWNlID0gc2VsZWN0b3IgPT09ICc6cm9vdCdcbiAgICAgICAgICAgID8gW11cbiAgICAgICAgICAgIDogdGhpcy5fbmFtZXNwYWNlLmNvbmNhdCh7IHR5cGU6ICdzZWxlY3RvcicsIHNjb3BlOiBzZWxlY3Rvci50cmltKCkgfSk7XG4gICAgICAgIHJldHVybiBuZXcgTWFpbkRPTVNvdXJjZSh0aGlzLl9yb290RWxlbWVudCQsIHRoaXMuX3Nhbml0YXRpb24kLCBuYW1lc3BhY2UsIHRoaXMuX2lzb2xhdGVNb2R1bGUsIHRoaXMuX2V2ZW50RGVsZWdhdG9yLCB0aGlzLl9uYW1lKTtcbiAgICB9O1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMsIGJ1YmJsZXMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRPTSBkcml2ZXIncyBldmVudHMoKSBleHBlY3RzIGFyZ3VtZW50IHRvIGJlIGEgXCIgK1xuICAgICAgICAgICAgICAgIFwic3RyaW5nIHJlcHJlc2VudGluZyB0aGUgZXZlbnQgdHlwZSB0byBsaXN0ZW4gZm9yLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZXZlbnQkID0gdGhpcy5fZXZlbnREZWxlZ2F0b3IuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuX25hbWVzcGFjZSwgb3B0aW9ucywgYnViYmxlcyk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KGV2ZW50JCk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9zYW5pdGF0aW9uJC5zaGFtZWZ1bGx5U2VuZE5leHQobnVsbCk7XG4gICAgICAgIC8vdGhpcy5faXNvbGF0ZU1vZHVsZS5yZXNldCgpO1xuICAgIH07XG4gICAgcmV0dXJuIE1haW5ET01Tb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5NYWluRE9NU291cmNlID0gTWFpbkRPTVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPU1haW5ET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgUHJpb3JpdHlRdWV1ZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQcmlvcml0eVF1ZXVlKCkge1xuICAgICAgICB0aGlzLmFyciA9IFtdO1xuICAgICAgICB0aGlzLnByaW9zID0gW107XG4gICAgfVxuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh0LCBwcmlvKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByaW9zW2ldIDwgcHJpbykge1xuICAgICAgICAgICAgICAgIHRoaXMuYXJyLnNwbGljZShpLCAwLCB0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnByaW9zLnNwbGljZShpLCAwLCBwcmlvKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hcnIucHVzaCh0KTtcbiAgICAgICAgdGhpcy5wcmlvcy5wdXNoKHByaW8pO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGYodGhpcy5hcnJbaV0sIGksIHRoaXMuYXJyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuYXJyW2ldID09PSB0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcnIuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMucHJpb3Muc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIFByaW9yaXR5UXVldWU7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gUHJpb3JpdHlRdWV1ZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVByaW9yaXR5UXVldWUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgUmVtb3ZhbFNldCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZW1vdmFsU2V0KCkge1xuICAgICAgICB0aGlzLnRvRGVsZXRlID0gW107XG4gICAgICAgIHRoaXMudG9EZWxldGVTaXplID0gMDtcbiAgICAgICAgdGhpcy5fc2V0ID0gbmV3IFNldCgpO1xuICAgIH1cbiAgICBSZW1vdmFsU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB0aGlzLl9zZXQuYWRkKHQpO1xuICAgIH07XG4gICAgUmVtb3ZhbFNldC5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHRoaXMuX3NldC5mb3JFYWNoKGYpO1xuICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgfTtcbiAgICBSZW1vdmFsU2V0LnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICBpZiAodGhpcy50b0RlbGV0ZS5sZW5ndGggPT09IHRoaXMudG9EZWxldGVTaXplKSB7XG4gICAgICAgICAgICB0aGlzLnRvRGVsZXRlLnB1c2godCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRvRGVsZXRlW3RoaXMudG9EZWxldGVTaXplXSA9IHQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50b0RlbGV0ZVNpemUrKztcbiAgICB9O1xuICAgIFJlbW92YWxTZXQucHJvdG90eXBlLmZsdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudG9EZWxldGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpIDwgdGhpcy50b0RlbGV0ZVNpemUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXQuZGVsZXRlKHRoaXMudG9EZWxldGVbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy50b0RlbGV0ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRvRGVsZXRlU2l6ZSA9IDA7XG4gICAgfTtcbiAgICByZXR1cm4gUmVtb3ZhbFNldDtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBSZW1vdmFsU2V0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UmVtb3ZhbFNldC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgU2NvcGVDaGVja2VyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNjb3BlQ2hlY2tlcihuYW1lc3BhY2UsIGlzb2xhdGVNb2R1bGUpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZSA9IGlzb2xhdGVNb2R1bGU7XG4gICAgICAgIHRoaXMuX25hbWVzcGFjZSA9IG5hbWVzcGFjZS5maWx0ZXIoZnVuY3Rpb24gKG4pIHsgcmV0dXJuIG4udHlwZSAhPT0gJ3NlbGVjdG9yJzsgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBlbGVtZW50IGlzICpkaXJlY3RseSogaW4gdGhlIHNjb3BlIG9mIHRoaXNcbiAgICAgKiBzY29wZSBjaGVja2VyLiBCZWluZyBjb250YWluZWQgKmluZGlyZWN0bHkqIHRocm91Z2ggb3RoZXIgc2NvcGVzXG4gICAgICogaXMgbm90IHZhbGlkLiBUaGlzIGlzIGNydWNpYWwgZm9yIGltcGxlbWVudGluZyBwYXJlbnQtY2hpbGQgaXNvbGF0aW9uLFxuICAgICAqIHNvIHRoYXQgdGhlIHBhcmVudCBzZWxlY3RvcnMgZG9uJ3Qgc2VhcmNoIGluc2lkZSBhIGNoaWxkIHNjb3BlLlxuICAgICAqL1xuICAgIFNjb3BlQ2hlY2tlci5wcm90b3R5cGUuaXNEaXJlY3RseUluU2NvcGUgPSBmdW5jdGlvbiAobGVhZikge1xuICAgICAgICB2YXIgbmFtZXNwYWNlID0gdGhpcy5pc29sYXRlTW9kdWxlLmdldE5hbWVzcGFjZShsZWFmKTtcbiAgICAgICAgaWYgKCFuYW1lc3BhY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fbmFtZXNwYWNlLmxlbmd0aCA+IG5hbWVzcGFjZS5sZW5ndGggfHxcbiAgICAgICAgICAgICF1dGlsc18xLmlzRXF1YWxOYW1lc3BhY2UodGhpcy5fbmFtZXNwYWNlLCBuYW1lc3BhY2Uuc2xpY2UoMCwgdGhpcy5fbmFtZXNwYWNlLmxlbmd0aCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuX25hbWVzcGFjZS5sZW5ndGg7IGkgPCBuYW1lc3BhY2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChuYW1lc3BhY2VbaV0udHlwZSA9PT0gJ3RvdGFsJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIHJldHVybiBTY29wZUNoZWNrZXI7XG59KCkpO1xuZXhwb3J0cy5TY29wZUNoZWNrZXIgPSBTY29wZUNoZWNrZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TY29wZUNoZWNrZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU3ltYm9sVHJlZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTeW1ib2xUcmVlKG1hcHBlcikge1xuICAgICAgICB0aGlzLm1hcHBlciA9IG1hcHBlcjtcbiAgICAgICAgdGhpcy50cmVlID0gW3VuZGVmaW5lZCwge31dO1xuICAgIH1cbiAgICBTeW1ib2xUcmVlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAocGF0aCwgZWxlbWVudCwgbWF4KSB7XG4gICAgICAgIHZhciBjdXJyID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgX21heCA9IG1heCAhPT0gdW5kZWZpbmVkID8gbWF4IDogcGF0aC5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX21heDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMubWFwcGVyKHBhdGhbaV0pO1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gY3VyclsxXVtuXTtcbiAgICAgICAgICAgIGlmICghY2hpbGQpIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IFt1bmRlZmluZWQsIHt9XTtcbiAgICAgICAgICAgICAgICBjdXJyWzFdW25dID0gY2hpbGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyID0gY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgY3VyclswXSA9IGVsZW1lbnQ7XG4gICAgfTtcbiAgICBTeW1ib2xUcmVlLnByb3RvdHlwZS5nZXREZWZhdWx0ID0gZnVuY3Rpb24gKHBhdGgsIG1rRGVmYXVsdEVsZW1lbnQsIG1heCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXQocGF0aCwgbWtEZWZhdWx0RWxlbWVudCwgbWF4KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBheWxvYWQgb2YgdGhlIHBhdGhcbiAgICAgKiBJZiBhIGRlZmF1bHQgZWxlbWVudCBjcmVhdG9yIGlzIGdpdmVuLCBpdCB3aWxsIGluc2VydCBpdCBhdCB0aGUgcGF0aFxuICAgICAqL1xuICAgIFN5bWJvbFRyZWUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChwYXRoLCBta0RlZmF1bHRFbGVtZW50LCBtYXgpIHtcbiAgICAgICAgdmFyIGN1cnIgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBfbWF4ID0gbWF4ICE9PSB1bmRlZmluZWQgPyBtYXggOiBwYXRoLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfbWF4OyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5tYXBwZXIocGF0aFtpXSk7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjdXJyWzFdW25dO1xuICAgICAgICAgICAgaWYgKCFjaGlsZCkge1xuICAgICAgICAgICAgICAgIGlmIChta0RlZmF1bHRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkID0gW3VuZGVmaW5lZCwge31dO1xuICAgICAgICAgICAgICAgICAgICBjdXJyWzFdW25dID0gY2hpbGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnIgPSBjaGlsZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWtEZWZhdWx0RWxlbWVudCAmJiAhY3VyclswXSkge1xuICAgICAgICAgICAgY3VyclswXSA9IG1rRGVmYXVsdEVsZW1lbnQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VyclswXTtcbiAgICB9O1xuICAgIFN5bWJvbFRyZWUucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHZhciBjdXJyID0gdGhpcy50cmVlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjdXJyWzFdW3RoaXMubWFwcGVyKHBhdGhbaV0pXTtcbiAgICAgICAgICAgIGlmICghY2hpbGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyID0gY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIGN1cnJbMV1bdGhpcy5tYXBwZXIocGF0aFtwYXRoLmxlbmd0aCAtIDFdKV07XG4gICAgfTtcbiAgICByZXR1cm4gU3ltYm9sVHJlZTtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTeW1ib2xUcmVlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3ltYm9sVHJlZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL3Zub2RlXCIpO1xudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xudmFyIHNuYWJiZG9tX3NlbGVjdG9yXzEgPSByZXF1aXJlKFwic25hYmJkb20tc2VsZWN0b3JcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIFZOb2RlV3JhcHBlciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWTm9kZVdyYXBwZXIocm9vdEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IHJvb3RFbGVtZW50O1xuICAgIH1cbiAgICBWTm9kZVdyYXBwZXIucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAodm5vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzXzEuaXNEb2NGcmFnKHRoaXMucm9vdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53cmFwRG9jRnJhZyh2bm9kZSA9PT0gbnVsbCA/IFtdIDogW3Zub2RlXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZub2RlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53cmFwKFtdKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgX2EgPSBzbmFiYmRvbV9zZWxlY3Rvcl8xLnNlbGVjdG9yUGFyc2VyKHZub2RlKSwgc2VsVGFnTmFtZSA9IF9hLnRhZ05hbWUsIHNlbElkID0gX2EuaWQ7XG4gICAgICAgIHZhciB2Tm9kZUNsYXNzTmFtZSA9IHNuYWJiZG9tX3NlbGVjdG9yXzEuY2xhc3NOYW1lRnJvbVZOb2RlKHZub2RlKTtcbiAgICAgICAgdmFyIHZOb2RlRGF0YSA9IHZub2RlLmRhdGEgfHwge307XG4gICAgICAgIHZhciB2Tm9kZURhdGFQcm9wcyA9IHZOb2RlRGF0YS5wcm9wcyB8fCB7fTtcbiAgICAgICAgdmFyIF9iID0gdk5vZGVEYXRhUHJvcHMuaWQsIHZOb2RlSWQgPSBfYiA9PT0gdm9pZCAwID8gc2VsSWQgOiBfYjtcbiAgICAgICAgdmFyIGlzVk5vZGVBbmRSb290RWxlbWVudElkZW50aWNhbCA9IHR5cGVvZiB2Tm9kZUlkID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgdk5vZGVJZC50b1VwcGVyQ2FzZSgpID09PSB0aGlzLnJvb3RFbGVtZW50LmlkLnRvVXBwZXJDYXNlKCkgJiZcbiAgICAgICAgICAgIHNlbFRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gdGhpcy5yb290RWxlbWVudC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgJiZcbiAgICAgICAgICAgIHZOb2RlQ2xhc3NOYW1lLnRvVXBwZXJDYXNlKCkgPT09IHRoaXMucm9vdEVsZW1lbnQuY2xhc3NOYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGlmIChpc1ZOb2RlQW5kUm9vdEVsZW1lbnRJZGVudGljYWwpIHtcbiAgICAgICAgICAgIHJldHVybiB2bm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy53cmFwKFt2bm9kZV0pO1xuICAgIH07XG4gICAgVk5vZGVXcmFwcGVyLnByb3RvdHlwZS53cmFwRG9jRnJhZyA9IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgICAgICByZXR1cm4gdm5vZGVfMS52bm9kZSgnJywgeyBpc29sYXRlOiBbXSB9LCBjaGlsZHJlbiwgdW5kZWZpbmVkLCB0aGlzXG4gICAgICAgICAgICAucm9vdEVsZW1lbnQpO1xuICAgIH07XG4gICAgVk5vZGVXcmFwcGVyLnByb3RvdHlwZS53cmFwID0gZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgICAgIHZhciBfYSA9IHRoaXMucm9vdEVsZW1lbnQsIHRhZ05hbWUgPSBfYS50YWdOYW1lLCBpZCA9IF9hLmlkLCBjbGFzc05hbWUgPSBfYS5jbGFzc05hbWU7XG4gICAgICAgIHZhciBzZWxJZCA9IGlkID8gXCIjXCIgKyBpZCA6ICcnO1xuICAgICAgICB2YXIgc2VsQ2xhc3MgPSBjbGFzc05hbWUgPyBcIi5cIiArIGNsYXNzTmFtZS5zcGxpdChcIiBcIikuam9pbihcIi5cIikgOiAnJztcbiAgICAgICAgdmFyIHZub2RlID0gaF8xLmgoXCJcIiArIHRhZ05hbWUudG9Mb3dlckNhc2UoKSArIHNlbElkICsgc2VsQ2xhc3MsIHt9LCBjaGlsZHJlbik7XG4gICAgICAgIHZub2RlLmRhdGEgPSB2bm9kZS5kYXRhIHx8IHt9O1xuICAgICAgICB2bm9kZS5kYXRhLmlzb2xhdGUgPSB2bm9kZS5kYXRhLmlzb2xhdGUgfHwgW107XG4gICAgICAgIHJldHVybiB2bm9kZTtcbiAgICB9O1xuICAgIHJldHVybiBWTm9kZVdyYXBwZXI7XG59KCkpO1xuZXhwb3J0cy5WTm9kZVdyYXBwZXIgPSBWTm9kZVdyYXBwZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1WTm9kZVdyYXBwZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG5mdW5jdGlvbiBmcm9tRXZlbnQoZWxlbWVudCwgZXZlbnROYW1lLCB1c2VDYXB0dXJlLCBwcmV2ZW50RGVmYXVsdCwgcGFzc2l2ZSkge1xuICAgIGlmICh1c2VDYXB0dXJlID09PSB2b2lkIDApIHsgdXNlQ2FwdHVyZSA9IGZhbHNlOyB9XG4gICAgaWYgKHByZXZlbnREZWZhdWx0ID09PSB2b2lkIDApIHsgcHJldmVudERlZmF1bHQgPSBmYWxzZTsgfVxuICAgIGlmIChwYXNzaXZlID09PSB2b2lkIDApIHsgcGFzc2l2ZSA9IGZhbHNlOyB9XG4gICAgdmFyIG5leHQgPSBudWxsO1xuICAgIHJldHVybiB4c3RyZWFtXzEuU3RyZWFtLmNyZWF0ZSh7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiBzdGFydChsaXN0ZW5lcikge1xuICAgICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgbmV4dCA9IGZ1bmN0aW9uIF9uZXh0KGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHByZXZlbnREZWZhdWx0Q29uZGl0aW9uYWwoZXZlbnQsIHByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubmV4dChldmVudCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG5leHQgPSBmdW5jdGlvbiBfbmV4dChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5uZXh0KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbmV4dCwge1xuICAgICAgICAgICAgICAgIGNhcHR1cmU6IHVzZUNhcHR1cmUsXG4gICAgICAgICAgICAgICAgcGFzc2l2ZTogcGFzc2l2ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBzdG9wOiBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbmV4dCwgdXNlQ2FwdHVyZSk7XG4gICAgICAgIH0sXG4gICAgfSk7XG59XG5leHBvcnRzLmZyb21FdmVudCA9IGZyb21FdmVudDtcbmZ1bmN0aW9uIG1hdGNoT2JqZWN0KG1hdGNoZXIsIG9iaikge1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMobWF0Y2hlcik7XG4gICAgdmFyIG4gPSBrZXlzLmxlbmd0aDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICB2YXIgayA9IGtleXNbaV07XG4gICAgICAgIGlmICh0eXBlb2YgbWF0Y2hlcltrXSA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG9ialtrXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGlmICghbWF0Y2hPYmplY3QobWF0Y2hlcltrXSwgb2JqW2tdKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChtYXRjaGVyW2tdICE9PSBvYmpba10pIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIHByZXZlbnREZWZhdWx0Q29uZGl0aW9uYWwoZXZlbnQsIHByZXZlbnREZWZhdWx0KSB7XG4gICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgcHJldmVudERlZmF1bHQgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc1ByZWRpY2F0ZShwcmV2ZW50RGVmYXVsdCkpIHtcbiAgICAgICAgICAgIGlmIChwcmV2ZW50RGVmYXVsdChldmVudCkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBwcmV2ZW50RGVmYXVsdCA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGlmIChtYXRjaE9iamVjdChwcmV2ZW50RGVmYXVsdCwgZXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncHJldmVudERlZmF1bHQgaGFzIHRvIGJlIGVpdGhlciBhIGJvb2xlYW4sIHByZWRpY2F0ZSBmdW5jdGlvbiBvciBvYmplY3QnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMucHJldmVudERlZmF1bHRDb25kaXRpb25hbCA9IHByZXZlbnREZWZhdWx0Q29uZGl0aW9uYWw7XG5mdW5jdGlvbiBpc1ByZWRpY2F0ZShmbikge1xuICAgIHJldHVybiB0eXBlb2YgZm4gPT09ICdmdW5jdGlvbic7XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1mcm9tRXZlbnQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG4vLyB0c2xpbnQ6ZGlzYWJsZTptYXgtZmlsZS1saW5lLWNvdW50XG52YXIgaF8xID0gcmVxdWlyZShcInNuYWJiZG9tL2hcIik7XG5mdW5jdGlvbiBpc1ZhbGlkU3RyaW5nKHBhcmFtKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBwYXJhbSA9PT0gJ3N0cmluZycgJiYgcGFyYW0ubGVuZ3RoID4gMDtcbn1cbmZ1bmN0aW9uIGlzU2VsZWN0b3IocGFyYW0pIHtcbiAgICByZXR1cm4gaXNWYWxpZFN0cmluZyhwYXJhbSkgJiYgKHBhcmFtWzBdID09PSAnLicgfHwgcGFyYW1bMF0gPT09ICcjJyk7XG59XG5mdW5jdGlvbiBjcmVhdGVUYWdGdW5jdGlvbih0YWdOYW1lKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGh5cGVyc2NyaXB0KGEsIGIsIGMpIHtcbiAgICAgICAgdmFyIGhhc0EgPSB0eXBlb2YgYSAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIHZhciBoYXNCID0gdHlwZW9mIGIgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICB2YXIgaGFzQyA9IHR5cGVvZiBjICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgaWYgKGlzU2VsZWN0b3IoYSkpIHtcbiAgICAgICAgICAgIGlmIChoYXNCICYmIGhhc0MpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSArIGEsIGIsIGMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaGFzQikge1xuICAgICAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwgYik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSArIGEsIHt9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChoYXNDKSB7XG4gICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSArIGEsIGIsIGMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGhhc0IpIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lLCBhLCBiKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChoYXNBKSB7XG4gICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSwgYSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSwge30pO1xuICAgICAgICB9XG4gICAgfTtcbn1cbnZhciBTVkdfVEFHX05BTUVTID0gW1xuICAgICdhJyxcbiAgICAnYWx0R2x5cGgnLFxuICAgICdhbHRHbHlwaERlZicsXG4gICAgJ2FsdEdseXBoSXRlbScsXG4gICAgJ2FuaW1hdGUnLFxuICAgICdhbmltYXRlQ29sb3InLFxuICAgICdhbmltYXRlTW90aW9uJyxcbiAgICAnYW5pbWF0ZVRyYW5zZm9ybScsXG4gICAgJ2NpcmNsZScsXG4gICAgJ2NsaXBQYXRoJyxcbiAgICAnY29sb3JQcm9maWxlJyxcbiAgICAnY3Vyc29yJyxcbiAgICAnZGVmcycsXG4gICAgJ2Rlc2MnLFxuICAgICdlbGxpcHNlJyxcbiAgICAnZmVCbGVuZCcsXG4gICAgJ2ZlQ29sb3JNYXRyaXgnLFxuICAgICdmZUNvbXBvbmVudFRyYW5zZmVyJyxcbiAgICAnZmVDb21wb3NpdGUnLFxuICAgICdmZUNvbnZvbHZlTWF0cml4JyxcbiAgICAnZmVEaWZmdXNlTGlnaHRpbmcnLFxuICAgICdmZURpc3BsYWNlbWVudE1hcCcsXG4gICAgJ2ZlRGlzdGFudExpZ2h0JyxcbiAgICAnZmVGbG9vZCcsXG4gICAgJ2ZlRnVuY0EnLFxuICAgICdmZUZ1bmNCJyxcbiAgICAnZmVGdW5jRycsXG4gICAgJ2ZlRnVuY1InLFxuICAgICdmZUdhdXNzaWFuQmx1cicsXG4gICAgJ2ZlSW1hZ2UnLFxuICAgICdmZU1lcmdlJyxcbiAgICAnZmVNZXJnZU5vZGUnLFxuICAgICdmZU1vcnBob2xvZ3knLFxuICAgICdmZU9mZnNldCcsXG4gICAgJ2ZlUG9pbnRMaWdodCcsXG4gICAgJ2ZlU3BlY3VsYXJMaWdodGluZycsXG4gICAgJ2ZlU3BvdGxpZ2h0JyxcbiAgICAnZmVUaWxlJyxcbiAgICAnZmVUdXJidWxlbmNlJyxcbiAgICAnZmlsdGVyJyxcbiAgICAnZm9udCcsXG4gICAgJ2ZvbnRGYWNlJyxcbiAgICAnZm9udEZhY2VGb3JtYXQnLFxuICAgICdmb250RmFjZU5hbWUnLFxuICAgICdmb250RmFjZVNyYycsXG4gICAgJ2ZvbnRGYWNlVXJpJyxcbiAgICAnZm9yZWlnbk9iamVjdCcsXG4gICAgJ2cnLFxuICAgICdnbHlwaCcsXG4gICAgJ2dseXBoUmVmJyxcbiAgICAnaGtlcm4nLFxuICAgICdpbWFnZScsXG4gICAgJ2xpbmUnLFxuICAgICdsaW5lYXJHcmFkaWVudCcsXG4gICAgJ21hcmtlcicsXG4gICAgJ21hc2snLFxuICAgICdtZXRhZGF0YScsXG4gICAgJ21pc3NpbmdHbHlwaCcsXG4gICAgJ21wYXRoJyxcbiAgICAncGF0aCcsXG4gICAgJ3BhdHRlcm4nLFxuICAgICdwb2x5Z29uJyxcbiAgICAncG9seWxpbmUnLFxuICAgICdyYWRpYWxHcmFkaWVudCcsXG4gICAgJ3JlY3QnLFxuICAgICdzY3JpcHQnLFxuICAgICdzZXQnLFxuICAgICdzdG9wJyxcbiAgICAnc3R5bGUnLFxuICAgICdzd2l0Y2gnLFxuICAgICdzeW1ib2wnLFxuICAgICd0ZXh0JyxcbiAgICAndGV4dFBhdGgnLFxuICAgICd0aXRsZScsXG4gICAgJ3RyZWYnLFxuICAgICd0c3BhbicsXG4gICAgJ3VzZScsXG4gICAgJ3ZpZXcnLFxuICAgICd2a2VybicsXG5dO1xudmFyIHN2ZyA9IGNyZWF0ZVRhZ0Z1bmN0aW9uKCdzdmcnKTtcblNWR19UQUdfTkFNRVMuZm9yRWFjaChmdW5jdGlvbiAodGFnKSB7XG4gICAgc3ZnW3RhZ10gPSBjcmVhdGVUYWdGdW5jdGlvbih0YWcpO1xufSk7XG52YXIgVEFHX05BTUVTID0gW1xuICAgICdhJyxcbiAgICAnYWJicicsXG4gICAgJ2FkZHJlc3MnLFxuICAgICdhcmVhJyxcbiAgICAnYXJ0aWNsZScsXG4gICAgJ2FzaWRlJyxcbiAgICAnYXVkaW8nLFxuICAgICdiJyxcbiAgICAnYmFzZScsXG4gICAgJ2JkaScsXG4gICAgJ2JkbycsXG4gICAgJ2Jsb2NrcXVvdGUnLFxuICAgICdib2R5JyxcbiAgICAnYnInLFxuICAgICdidXR0b24nLFxuICAgICdjYW52YXMnLFxuICAgICdjYXB0aW9uJyxcbiAgICAnY2l0ZScsXG4gICAgJ2NvZGUnLFxuICAgICdjb2wnLFxuICAgICdjb2xncm91cCcsXG4gICAgJ2RkJyxcbiAgICAnZGVsJyxcbiAgICAnZGV0YWlscycsXG4gICAgJ2RmbicsXG4gICAgJ2RpcicsXG4gICAgJ2RpdicsXG4gICAgJ2RsJyxcbiAgICAnZHQnLFxuICAgICdlbScsXG4gICAgJ2VtYmVkJyxcbiAgICAnZmllbGRzZXQnLFxuICAgICdmaWdjYXB0aW9uJyxcbiAgICAnZmlndXJlJyxcbiAgICAnZm9vdGVyJyxcbiAgICAnZm9ybScsXG4gICAgJ2gxJyxcbiAgICAnaDInLFxuICAgICdoMycsXG4gICAgJ2g0JyxcbiAgICAnaDUnLFxuICAgICdoNicsXG4gICAgJ2hlYWQnLFxuICAgICdoZWFkZXInLFxuICAgICdoZ3JvdXAnLFxuICAgICdocicsXG4gICAgJ2h0bWwnLFxuICAgICdpJyxcbiAgICAnaWZyYW1lJyxcbiAgICAnaW1nJyxcbiAgICAnaW5wdXQnLFxuICAgICdpbnMnLFxuICAgICdrYmQnLFxuICAgICdrZXlnZW4nLFxuICAgICdsYWJlbCcsXG4gICAgJ2xlZ2VuZCcsXG4gICAgJ2xpJyxcbiAgICAnbGluaycsXG4gICAgJ21haW4nLFxuICAgICdtYXAnLFxuICAgICdtYXJrJyxcbiAgICAnbWVudScsXG4gICAgJ21ldGEnLFxuICAgICduYXYnLFxuICAgICdub3NjcmlwdCcsXG4gICAgJ29iamVjdCcsXG4gICAgJ29sJyxcbiAgICAnb3B0Z3JvdXAnLFxuICAgICdvcHRpb24nLFxuICAgICdwJyxcbiAgICAncGFyYW0nLFxuICAgICdwcmUnLFxuICAgICdwcm9ncmVzcycsXG4gICAgJ3EnLFxuICAgICdycCcsXG4gICAgJ3J0JyxcbiAgICAncnVieScsXG4gICAgJ3MnLFxuICAgICdzYW1wJyxcbiAgICAnc2NyaXB0JyxcbiAgICAnc2VjdGlvbicsXG4gICAgJ3NlbGVjdCcsXG4gICAgJ3NtYWxsJyxcbiAgICAnc291cmNlJyxcbiAgICAnc3BhbicsXG4gICAgJ3N0cm9uZycsXG4gICAgJ3N0eWxlJyxcbiAgICAnc3ViJyxcbiAgICAnc3VtbWFyeScsXG4gICAgJ3N1cCcsXG4gICAgJ3RhYmxlJyxcbiAgICAndGJvZHknLFxuICAgICd0ZCcsXG4gICAgJ3RleHRhcmVhJyxcbiAgICAndGZvb3QnLFxuICAgICd0aCcsXG4gICAgJ3RoZWFkJyxcbiAgICAndGltZScsXG4gICAgJ3RpdGxlJyxcbiAgICAndHInLFxuICAgICd1JyxcbiAgICAndWwnLFxuICAgICd2aWRlbycsXG5dO1xudmFyIGV4cG9ydGVkID0ge1xuICAgIFNWR19UQUdfTkFNRVM6IFNWR19UQUdfTkFNRVMsXG4gICAgVEFHX05BTUVTOiBUQUdfTkFNRVMsXG4gICAgc3ZnOiBzdmcsXG4gICAgaXNTZWxlY3RvcjogaXNTZWxlY3RvcixcbiAgICBjcmVhdGVUYWdGdW5jdGlvbjogY3JlYXRlVGFnRnVuY3Rpb24sXG59O1xuVEFHX05BTUVTLmZvckVhY2goZnVuY3Rpb24gKG4pIHtcbiAgICBleHBvcnRlZFtuXSA9IGNyZWF0ZVRhZ0Z1bmN0aW9uKG4pO1xufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRlZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWh5cGVyc2NyaXB0LWhlbHBlcnMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdGh1bmtfMSA9IHJlcXVpcmUoXCIuL3RodW5rXCIpO1xuZXhwb3J0cy50aHVuayA9IHRodW5rXzEudGh1bms7XG52YXIgTWFpbkRPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vTWFpbkRPTVNvdXJjZVwiKTtcbmV4cG9ydHMuTWFpbkRPTVNvdXJjZSA9IE1haW5ET01Tb3VyY2VfMS5NYWluRE9NU291cmNlO1xuLyoqXG4gKiBBIGZhY3RvcnkgZm9yIHRoZSBET00gZHJpdmVyIGZ1bmN0aW9uLlxuICpcbiAqIFRha2VzIGEgYGNvbnRhaW5lcmAgdG8gZGVmaW5lIHRoZSB0YXJnZXQgb24gdGhlIGV4aXN0aW5nIERPTSB3aGljaCB0aGlzXG4gKiBkcml2ZXIgd2lsbCBvcGVyYXRlIG9uLCBhbmQgYW4gYG9wdGlvbnNgIG9iamVjdCBhcyB0aGUgc2Vjb25kIGFyZ3VtZW50LiBUaGVcbiAqIGlucHV0IHRvIHRoaXMgZHJpdmVyIGlzIGEgc3RyZWFtIG9mIHZpcnR1YWwgRE9NIG9iamVjdHMsIG9yIGluIG90aGVyIHdvcmRzLFxuICogU25hYmJkb20gXCJWTm9kZVwiIG9iamVjdHMuIFRoZSBvdXRwdXQgb2YgdGhpcyBkcml2ZXIgaXMgYSBcIkRPTVNvdXJjZVwiOiBhXG4gKiBjb2xsZWN0aW9uIG9mIE9ic2VydmFibGVzIHF1ZXJpZWQgd2l0aCB0aGUgbWV0aG9kcyBgc2VsZWN0KClgIGFuZCBgZXZlbnRzKClgLlxuICpcbiAqICoqYERPTVNvdXJjZS5zZWxlY3Qoc2VsZWN0b3IpYCoqIHJldHVybnMgYSBuZXcgRE9NU291cmNlIHdpdGggc2NvcGVcbiAqIHJlc3RyaWN0ZWQgdG8gdGhlIGVsZW1lbnQocykgdGhhdCBtYXRjaGVzIHRoZSBDU1MgYHNlbGVjdG9yYCBnaXZlbi4gVG8gc2VsZWN0XG4gKiB0aGUgcGFnZSdzIGBkb2N1bWVudGAsIHVzZSBgLnNlbGVjdCgnZG9jdW1lbnQnKWAuIFRvIHNlbGVjdCB0aGUgY29udGFpbmVyXG4gKiBlbGVtZW50IGZvciB0aGlzIGFwcCwgdXNlIGAuc2VsZWN0KCc6cm9vdCcpYC5cbiAqXG4gKiAqKmBET01Tb3VyY2UuZXZlbnRzKGV2ZW50VHlwZSwgb3B0aW9ucylgKiogcmV0dXJucyBhIHN0cmVhbSBvZiBldmVudHMgb2ZcbiAqIGBldmVudFR5cGVgIGhhcHBlbmluZyBvbiB0aGUgZWxlbWVudHMgdGhhdCBtYXRjaCB0aGUgY3VycmVudCBET01Tb3VyY2UuIFRoZVxuICogZXZlbnQgb2JqZWN0IGNvbnRhaW5zIHRoZSBgb3duZXJUYXJnZXRgIHByb3BlcnR5IHRoYXQgYmVoYXZlcyBleGFjdGx5IGxpa2VcbiAqIGBjdXJyZW50VGFyZ2V0YC4gVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyB0aGF0IHNvbWUgYnJvd3NlcnMgZG9lc24ndCBhbGxvd1xuICogYGN1cnJlbnRUYXJnZXRgIHByb3BlcnR5IHRvIGJlIG11dGF0ZWQsIGhlbmNlIGEgbmV3IHByb3BlcnR5IGlzIGNyZWF0ZWQuIFRoZVxuICogcmV0dXJuZWQgc3RyZWFtIGlzIGFuICp4c3RyZWFtKiBTdHJlYW0gaWYgeW91IHVzZSBgQGN5Y2xlL3hzdHJlYW0tcnVuYCB0byBydW5cbiAqIHlvdXIgYXBwIHdpdGggdGhpcyBkcml2ZXIsIG9yIGl0IGlzIGFuIFJ4SlMgT2JzZXJ2YWJsZSBpZiB5b3UgdXNlXG4gKiBgQGN5Y2xlL3J4anMtcnVuYCwgYW5kIHNvIGZvcnRoLlxuICpcbiAqICoqb3B0aW9ucyBmb3IgRE9NU291cmNlLmV2ZW50cyoqXG4gKlxuICogVGhlIGBvcHRpb25zYCBwYXJhbWV0ZXIgb24gYERPTVNvdXJjZS5ldmVudHMoZXZlbnRUeXBlLCBvcHRpb25zKWAgaXMgYW5cbiAqIChvcHRpb25hbCkgb2JqZWN0IHdpdGggdHdvIG9wdGlvbmFsIGZpZWxkczogYHVzZUNhcHR1cmVgIGFuZFxuICogYHByZXZlbnREZWZhdWx0YC5cbiAqXG4gKiBgdXNlQ2FwdHVyZWAgaXMgYnkgZGVmYXVsdCBgZmFsc2VgLCBleGNlcHQgaXQgaXMgYHRydWVgIGZvciBldmVudCB0eXBlcyB0aGF0XG4gKiBkbyBub3QgYnViYmxlLiBSZWFkIG1vcmUgaGVyZVxuICogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0V2ZW50VGFyZ2V0L2FkZEV2ZW50TGlzdGVuZXJcbiAqIGFib3V0IHRoZSBgdXNlQ2FwdHVyZWAgYW5kIGl0cyBwdXJwb3NlLlxuICpcbiAqIGBwcmV2ZW50RGVmYXVsdGAgaXMgYnkgZGVmYXVsdCBgZmFsc2VgLCBhbmQgaW5kaWNhdGVzIHRvIHRoZSBkcml2ZXIgd2hldGhlclxuICogYGV2ZW50LnByZXZlbnREZWZhdWx0KClgIHNob3VsZCBiZSBpbnZva2VkLiBUaGlzIG9wdGlvbiBjYW4gYmUgY29uZmlndXJlZCBpblxuICogdGhyZWUgd2F5czpcbiAqXG4gKiAtIGB7cHJldmVudERlZmF1bHQ6IGJvb2xlYW59YCB0byBpbnZva2UgcHJldmVudERlZmF1bHQgaWYgYHRydWVgLCBhbmQgbm90XG4gKiBpbnZva2Ugb3RoZXJ3aXNlLlxuICogLSBge3ByZXZlbnREZWZhdWx0OiAoZXY6IEV2ZW50KSA9PiBib29sZWFufWAgZm9yIGNvbmRpdGlvbmFsIGludm9jYXRpb24uXG4gKiAtIGB7cHJldmVudERlZmF1bHQ6IE5lc3RlZE9iamVjdH1gIHVzZXMgYW4gb2JqZWN0IHRvIGJlIHJlY3Vyc2l2ZWx5IGNvbXBhcmVkXG4gKiB0byB0aGUgYEV2ZW50YCBvYmplY3QuIGBwcmV2ZW50RGVmYXVsdGAgaXMgaW52b2tlZCB3aGVuIGFsbCBwcm9wZXJ0aWVzIG9uIHRoZVxuICogbmVzdGVkIG9iamVjdCBtYXRjaCB3aXRoIHRoZSBwcm9wZXJ0aWVzIG9uIHRoZSBldmVudCBvYmplY3QuXG4gKlxuICogSGVyZSBhcmUgc29tZSBleGFtcGxlczpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIC8vIGFsd2F5cyBwcmV2ZW50IGRlZmF1bHRcbiAqIERPTVNvdXJjZS5zZWxlY3QoJ2lucHV0JykuZXZlbnRzKCdrZXlkb3duJywge1xuICogICBwcmV2ZW50RGVmYXVsdDogdHJ1ZVxuICogfSlcbiAqXG4gKiAvLyBwcmV2ZW50IGRlZmF1bHQgb25seSB3aGVuIGBFTlRFUmAgaXMgcHJlc3NlZFxuICogRE9NU291cmNlLnNlbGVjdCgnaW5wdXQnKS5ldmVudHMoJ2tleWRvd24nLCB7XG4gKiAgIHByZXZlbnREZWZhdWx0OiBlID0+IGUua2V5Q29kZSA9PT0gMTNcbiAqIH0pXG4gKlxuICogLy8gcHJldmVudCBkZWZ1YWx0IHdoZW4gYEVOVEVSYCBpcyBwcmVzc2VkIEFORCB0YXJnZXQudmFsdWUgaXMgJ0hFTExPJ1xuICogRE9NU291cmNlLnNlbGVjdCgnaW5wdXQnKS5ldmVudHMoJ2tleWRvd24nLCB7XG4gKiAgIHByZXZlbnREZWZhdWx0OiB7IGtleUNvZGU6IDEzLCBvd25lclRhcmdldDogeyB2YWx1ZTogJ0hFTExPJyB9IH1cbiAqIH0pO1xuICogYGBgXG4gKlxuICogKipgRE9NU291cmNlLmVsZW1lbnRzKClgKiogcmV0dXJucyBhIHN0cmVhbSBvZiBhcnJheXMgY29udGFpbmluZyB0aGUgRE9NXG4gKiBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBzZWxlY3RvcnMgaW4gdGhlIERPTVNvdXJjZSAoZS5nLiBmcm9tIHByZXZpb3VzXG4gKiBgc2VsZWN0KHgpYCBjYWxscykuXG4gKlxuICogKipgRE9NU291cmNlLmVsZW1lbnQoKWAqKiByZXR1cm5zIGEgc3RyZWFtIG9mIERPTSBlbGVtZW50cy4gTm90aWNlIHRoYXQgdGhpc1xuICogaXMgdGhlIHNpbmd1bGFyIHZlcnNpb24gb2YgYC5lbGVtZW50cygpYCwgc28gdGhlIHN0cmVhbSB3aWxsIGVtaXQgYW4gZWxlbWVudCxcbiAqIG5vdCBhbiBhcnJheS4gSWYgdGhlcmUgaXMgbm8gZWxlbWVudCB0aGF0IG1hdGNoZXMgdGhlIHNlbGVjdGVkIERPTVNvdXJjZSxcbiAqIHRoZW4gdGhlIHJldHVybmVkIHN0cmVhbSB3aWxsIG5vdCBlbWl0IGFueXRoaW5nLlxuICpcbiAqIEBwYXJhbSB7KFN0cmluZ3xIVE1MRWxlbWVudCl9IGNvbnRhaW5lciB0aGUgRE9NIHNlbGVjdG9yIGZvciB0aGUgZWxlbWVudFxuICogKG9yIHRoZSBlbGVtZW50IGl0c2VsZikgdG8gY29udGFpbiB0aGUgcmVuZGVyaW5nIG9mIHRoZSBWVHJlZXMuXG4gKiBAcGFyYW0ge0RPTURyaXZlck9wdGlvbnN9IG9wdGlvbnMgYW4gb2JqZWN0IHdpdGggdHdvIG9wdGlvbmFsIHByb3BlcnRpZXM6XG4gKlxuICogICAtIGBtb2R1bGVzOiBhcnJheWAgb3ZlcnJpZGVzIGBAY3ljbGUvZG9tYCdzIGRlZmF1bHQgU25hYmJkb20gbW9kdWxlcyBhc1xuICogICAgIGFzIGRlZmluZWQgaW4gW2BzcmMvbW9kdWxlcy50c2BdKC4vc3JjL21vZHVsZXMudHMpLlxuICogQHJldHVybiB7RnVuY3Rpb259IHRoZSBET00gZHJpdmVyIGZ1bmN0aW9uLiBUaGUgZnVuY3Rpb24gZXhwZWN0cyBhIHN0cmVhbSBvZlxuICogVk5vZGUgYXMgaW5wdXQsIGFuZCBvdXRwdXRzIHRoZSBET01Tb3VyY2Ugb2JqZWN0LlxuICogQGZ1bmN0aW9uIG1ha2VET01Ecml2ZXJcbiAqL1xudmFyIG1ha2VET01Ecml2ZXJfMSA9IHJlcXVpcmUoXCIuL21ha2VET01Ecml2ZXJcIik7XG5leHBvcnRzLm1ha2VET01Ecml2ZXIgPSBtYWtlRE9NRHJpdmVyXzEubWFrZURPTURyaXZlcjtcbi8qKlxuICogQSBmYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSBtb2NrZWQgRE9NU291cmNlIG9iamVjdHMsIGZvciB0ZXN0aW5nIHB1cnBvc2VzLlxuICpcbiAqIFRha2VzIGEgYG1vY2tDb25maWdgIG9iamVjdCBhcyBhcmd1bWVudCwgYW5kIHJldHVybnNcbiAqIGEgRE9NU291cmNlIHRoYXQgY2FuIGJlIGdpdmVuIHRvIGFueSBDeWNsZS5qcyBhcHAgdGhhdCBleHBlY3RzIGEgRE9NU291cmNlIGluXG4gKiB0aGUgc291cmNlcywgZm9yIHRlc3RpbmcuXG4gKlxuICogVGhlIGBtb2NrQ29uZmlnYCBwYXJhbWV0ZXIgaXMgYW4gb2JqZWN0IHNwZWNpZnlpbmcgc2VsZWN0b3JzLCBldmVudFR5cGVzIGFuZFxuICogdGhlaXIgc3RyZWFtcy4gRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogY29uc3QgZG9tU291cmNlID0gbW9ja0RPTVNvdXJjZSh7XG4gKiAgICcuZm9vJzoge1xuICogICAgICdjbGljayc6IHhzLm9mKHt0YXJnZXQ6IHt9fSksXG4gKiAgICAgJ21vdXNlb3Zlcic6IHhzLm9mKHt0YXJnZXQ6IHt9fSksXG4gKiAgIH0sXG4gKiAgICcuYmFyJzoge1xuICogICAgICdzY3JvbGwnOiB4cy5vZih7dGFyZ2V0OiB7fX0pLFxuICogICAgIGVsZW1lbnRzOiB4cy5vZih7dGFnTmFtZTogJ2Rpdid9KSxcbiAqICAgfVxuICogfSk7XG4gKlxuICogLy8gVXNhZ2VcbiAqIGNvbnN0IGNsaWNrJCA9IGRvbVNvdXJjZS5zZWxlY3QoJy5mb28nKS5ldmVudHMoJ2NsaWNrJyk7XG4gKiBjb25zdCBlbGVtZW50JCA9IGRvbVNvdXJjZS5zZWxlY3QoJy5iYXInKS5lbGVtZW50cygpO1xuICogYGBgXG4gKlxuICogVGhlIG1vY2tlZCBET00gU291cmNlIHN1cHBvcnRzIGlzb2xhdGlvbi4gSXQgaGFzIHRoZSBmdW5jdGlvbnMgYGlzb2xhdGVTaW5rYFxuICogYW5kIGBpc29sYXRlU291cmNlYCBhdHRhY2hlZCB0byBpdCwgYW5kIHBlcmZvcm1zIHNpbXBsZSBpc29sYXRpb24gdXNpbmdcbiAqIGNsYXNzTmFtZXMuICppc29sYXRlU2luayogd2l0aCBzY29wZSBgZm9vYCB3aWxsIGFwcGVuZCB0aGUgY2xhc3MgYF9fX2Zvb2AgdG9cbiAqIHRoZSBzdHJlYW0gb2YgdmlydHVhbCBET00gbm9kZXMsIGFuZCAqaXNvbGF0ZVNvdXJjZSogd2l0aCBzY29wZSBgZm9vYCB3aWxsXG4gKiBwZXJmb3JtIGEgY29udmVudGlvbmFsIGBtb2NrZWRET01Tb3VyY2Uuc2VsZWN0KCcuX19mb28nKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbW9ja0NvbmZpZyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgc2VsZWN0b3Igc3RyaW5nc1xuICogYW5kIHZhbHVlcyBhcmUgb2JqZWN0cy4gVGhvc2UgbmVzdGVkIG9iamVjdHMgaGF2ZSBgZXZlbnRUeXBlYCBzdHJpbmdzIGFzIGtleXNcbiAqIGFuZCB2YWx1ZXMgYXJlIHN0cmVhbXMgeW91IGNyZWF0ZWQuXG4gKiBAcmV0dXJuIHtPYmplY3R9IGZha2UgRE9NIHNvdXJjZSBvYmplY3QsIHdpdGggYW4gQVBJIGNvbnRhaW5pbmcgYHNlbGVjdCgpYFxuICogYW5kIGBldmVudHMoKWAgYW5kIGBlbGVtZW50cygpYCB3aGljaCBjYW4gYmUgdXNlZCBqdXN0IGxpa2UgdGhlIERPTSBEcml2ZXInc1xuICogRE9NU291cmNlLlxuICpcbiAqIEBmdW5jdGlvbiBtb2NrRE9NU291cmNlXG4gKi9cbnZhciBtb2NrRE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9tb2NrRE9NU291cmNlXCIpO1xuZXhwb3J0cy5tb2NrRE9NU291cmNlID0gbW9ja0RPTVNvdXJjZV8xLm1vY2tET01Tb3VyY2U7XG5leHBvcnRzLk1vY2tlZERPTVNvdXJjZSA9IG1vY2tET01Tb3VyY2VfMS5Nb2NrZWRET01Tb3VyY2U7XG4vKipcbiAqIFRoZSBoeXBlcnNjcmlwdCBmdW5jdGlvbiBgaCgpYCBpcyBhIGZ1bmN0aW9uIHRvIGNyZWF0ZSB2aXJ0dWFsIERPTSBvYmplY3RzLFxuICogYWxzbyBrbm93biBhcyBWTm9kZXMuIENhbGxcbiAqXG4gKiBgYGBqc1xuICogaCgnZGl2Lm15Q2xhc3MnLCB7c3R5bGU6IHtjb2xvcjogJ3JlZCd9fSwgW10pXG4gKiBgYGBcbiAqXG4gKiB0byBjcmVhdGUgYSBWTm9kZSB0aGF0IHJlcHJlc2VudHMgYSBgRElWYCBlbGVtZW50IHdpdGggY2xhc3NOYW1lIGBteUNsYXNzYCxcbiAqIHN0eWxlZCB3aXRoIHJlZCBjb2xvciwgYW5kIG5vIGNoaWxkcmVuIGJlY2F1c2UgdGhlIGBbXWAgYXJyYXkgd2FzIHBhc3NlZC4gVGhlXG4gKiBBUEkgaXMgYGgodGFnT3JTZWxlY3Rvciwgb3B0aW9uYWxEYXRhLCBvcHRpb25hbENoaWxkcmVuT3JUZXh0KWAuXG4gKlxuICogSG93ZXZlciwgdXN1YWxseSB5b3Ugc2hvdWxkIHVzZSBcImh5cGVyc2NyaXB0IGhlbHBlcnNcIiwgd2hpY2ggYXJlIHNob3J0Y3V0XG4gKiBmdW5jdGlvbnMgYmFzZWQgb24gaHlwZXJzY3JpcHQuIFRoZXJlIGlzIG9uZSBoeXBlcnNjcmlwdCBoZWxwZXIgZnVuY3Rpb24gZm9yXG4gKiBlYWNoIERPTSB0YWdOYW1lLCBzdWNoIGFzIGBoMSgpYCwgYGgyKClgLCBgZGl2KClgLCBgc3BhbigpYCwgYGxhYmVsKClgLFxuICogYGlucHV0KClgLiBGb3IgaW5zdGFuY2UsIHRoZSBwcmV2aW91cyBleGFtcGxlIGNvdWxkIGhhdmUgYmVlbiB3cml0dGVuXG4gKiBhczpcbiAqXG4gKiBgYGBqc1xuICogZGl2KCcubXlDbGFzcycsIHtzdHlsZToge2NvbG9yOiAncmVkJ319LCBbXSlcbiAqIGBgYFxuICpcbiAqIFRoZXJlIGFyZSBhbHNvIFNWRyBoZWxwZXIgZnVuY3Rpb25zLCB3aGljaCBhcHBseSB0aGUgYXBwcm9wcmlhdGUgU1ZHXG4gKiBuYW1lc3BhY2UgdG8gdGhlIHJlc3VsdGluZyBlbGVtZW50cy4gYHN2ZygpYCBmdW5jdGlvbiBjcmVhdGVzIHRoZSB0b3AtbW9zdFxuICogU1ZHIGVsZW1lbnQsIGFuZCBgc3ZnLmdgLCBgc3ZnLnBvbHlnb25gLCBgc3ZnLmNpcmNsZWAsIGBzdmcucGF0aGAgYXJlIGZvclxuICogU1ZHLXNwZWNpZmljIGNoaWxkIGVsZW1lbnRzLiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBzdmcoe2F0dHJzOiB7d2lkdGg6IDE1MCwgaGVpZ2h0OiAxNTB9fSwgW1xuICogICBzdmcucG9seWdvbih7XG4gKiAgICAgYXR0cnM6IHtcbiAqICAgICAgIGNsYXNzOiAndHJpYW5nbGUnLFxuICogICAgICAgcG9pbnRzOiAnMjAgMCAyMCAxNTAgMTUwIDIwJ1xuICogICAgIH1cbiAqICAgfSlcbiAqIF0pXG4gKiBgYGBcbiAqXG4gKiBAZnVuY3Rpb24gaFxuICovXG52YXIgaF8xID0gcmVxdWlyZShcInNuYWJiZG9tL2hcIik7XG5leHBvcnRzLmggPSBoXzEuaDtcbnZhciBoeXBlcnNjcmlwdF9oZWxwZXJzXzEgPSByZXF1aXJlKFwiLi9oeXBlcnNjcmlwdC1oZWxwZXJzXCIpO1xuZXhwb3J0cy5zdmcgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdmc7XG5leHBvcnRzLmEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hO1xuZXhwb3J0cy5hYmJyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYWJicjtcbmV4cG9ydHMuYWRkcmVzcyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFkZHJlc3M7XG5leHBvcnRzLmFyZWEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hcmVhO1xuZXhwb3J0cy5hcnRpY2xlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXJ0aWNsZTtcbmV4cG9ydHMuYXNpZGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hc2lkZTtcbmV4cG9ydHMuYXVkaW8gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hdWRpbztcbmV4cG9ydHMuYiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmI7XG5leHBvcnRzLmJhc2UgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5iYXNlO1xuZXhwb3J0cy5iZGkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5iZGk7XG5leHBvcnRzLmJkbyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJkbztcbmV4cG9ydHMuYmxvY2txdW90ZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJsb2NrcXVvdGU7XG5leHBvcnRzLmJvZHkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ib2R5O1xuZXhwb3J0cy5iciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJyO1xuZXhwb3J0cy5idXR0b24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5idXR0b247XG5leHBvcnRzLmNhbnZhcyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNhbnZhcztcbmV4cG9ydHMuY2FwdGlvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNhcHRpb247XG5leHBvcnRzLmNpdGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jaXRlO1xuZXhwb3J0cy5jb2RlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY29kZTtcbmV4cG9ydHMuY29sID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY29sO1xuZXhwb3J0cy5jb2xncm91cCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNvbGdyb3VwO1xuZXhwb3J0cy5kZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRkO1xuZXhwb3J0cy5kZWwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kZWw7XG5leHBvcnRzLmRmbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRmbjtcbmV4cG9ydHMuZGlyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGlyO1xuZXhwb3J0cy5kaXYgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kaXY7XG5leHBvcnRzLmRsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGw7XG5leHBvcnRzLmR0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZHQ7XG5leHBvcnRzLmVtID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZW07XG5leHBvcnRzLmVtYmVkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZW1iZWQ7XG5leHBvcnRzLmZpZWxkc2V0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZmllbGRzZXQ7XG5leHBvcnRzLmZpZ2NhcHRpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5maWdjYXB0aW9uO1xuZXhwb3J0cy5maWd1cmUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5maWd1cmU7XG5leHBvcnRzLmZvb3RlciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZvb3RlcjtcbmV4cG9ydHMuZm9ybSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZvcm07XG5leHBvcnRzLmgxID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDE7XG5leHBvcnRzLmgyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDI7XG5leHBvcnRzLmgzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDM7XG5leHBvcnRzLmg0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDQ7XG5leHBvcnRzLmg1ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDU7XG5leHBvcnRzLmg2ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaDY7XG5leHBvcnRzLmhlYWQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oZWFkO1xuZXhwb3J0cy5oZWFkZXIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oZWFkZXI7XG5leHBvcnRzLmhncm91cCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmhncm91cDtcbmV4cG9ydHMuaHIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ocjtcbmV4cG9ydHMuaHRtbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmh0bWw7XG5leHBvcnRzLmkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pO1xuZXhwb3J0cy5pZnJhbWUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pZnJhbWU7XG5leHBvcnRzLmltZyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmltZztcbmV4cG9ydHMuaW5wdXQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pbnB1dDtcbmV4cG9ydHMuaW5zID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaW5zO1xuZXhwb3J0cy5rYmQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5rYmQ7XG5leHBvcnRzLmtleWdlbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmtleWdlbjtcbmV4cG9ydHMubGFiZWwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5sYWJlbDtcbmV4cG9ydHMubGVnZW5kID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubGVnZW5kO1xuZXhwb3J0cy5saSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmxpO1xuZXhwb3J0cy5saW5rID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubGluaztcbmV4cG9ydHMubWFpbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1haW47XG5leHBvcnRzLm1hcCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1hcDtcbmV4cG9ydHMubWFyayA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1hcms7XG5leHBvcnRzLm1lbnUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tZW51O1xuZXhwb3J0cy5tZXRhID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWV0YTtcbmV4cG9ydHMubmF2ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubmF2O1xuZXhwb3J0cy5ub3NjcmlwdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm5vc2NyaXB0O1xuZXhwb3J0cy5vYmplY3QgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vYmplY3Q7XG5leHBvcnRzLm9sID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQub2w7XG5leHBvcnRzLm9wdGdyb3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQub3B0Z3JvdXA7XG5leHBvcnRzLm9wdGlvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9wdGlvbjtcbmV4cG9ydHMucCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnA7XG5leHBvcnRzLnBhcmFtID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucGFyYW07XG5leHBvcnRzLnByZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnByZTtcbmV4cG9ydHMucHJvZ3Jlc3MgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wcm9ncmVzcztcbmV4cG9ydHMucSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnE7XG5leHBvcnRzLnJwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucnA7XG5leHBvcnRzLnJ0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucnQ7XG5leHBvcnRzLnJ1YnkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ydWJ5O1xuZXhwb3J0cy5zID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucztcbmV4cG9ydHMuc2FtcCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNhbXA7XG5leHBvcnRzLnNjcmlwdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNjcmlwdDtcbmV4cG9ydHMuc2VjdGlvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNlY3Rpb247XG5leHBvcnRzLnNlbGVjdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNlbGVjdDtcbmV4cG9ydHMuc21hbGwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zbWFsbDtcbmV4cG9ydHMuc291cmNlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc291cmNlO1xuZXhwb3J0cy5zcGFuID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3BhbjtcbmV4cG9ydHMuc3Ryb25nID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3Ryb25nO1xuZXhwb3J0cy5zdHlsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN0eWxlO1xuZXhwb3J0cy5zdWIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdWI7XG5leHBvcnRzLnN1cCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN1cDtcbmV4cG9ydHMudGFibGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50YWJsZTtcbmV4cG9ydHMudGJvZHkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50Ym9keTtcbmV4cG9ydHMudGQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50ZDtcbmV4cG9ydHMudGV4dGFyZWEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50ZXh0YXJlYTtcbmV4cG9ydHMudGZvb3QgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50Zm9vdDtcbmV4cG9ydHMudGggPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50aDtcbmV4cG9ydHMudGhlYWQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50aGVhZDtcbmV4cG9ydHMudGl0bGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50aXRsZTtcbmV4cG9ydHMudHIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC50cjtcbmV4cG9ydHMudSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnU7XG5leHBvcnRzLnVsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudWw7XG5leHBvcnRzLnZpZGVvID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudmlkZW87XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfTtcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuZnVuY3Rpb24gbWFrZUlzb2xhdGVTaW5rKG5hbWVzcGFjZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAoc2luaywgc2NvcGUpIHtcbiAgICAgICAgaWYgKHNjb3BlID09PSAnOnJvb3QnKSB7XG4gICAgICAgICAgICByZXR1cm4gc2luaztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2luay5tYXAoZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHNjb3BlT2JqID0gZ2V0U2NvcGVPYmooc2NvcGUpO1xuICAgICAgICAgICAgdmFyIG5ld05vZGUgPSBfX2Fzc2lnbih7fSwgbm9kZSwgeyBkYXRhOiBfX2Fzc2lnbih7fSwgbm9kZS5kYXRhLCB7IGlzb2xhdGU6ICFub2RlLmRhdGEgfHwgIUFycmF5LmlzQXJyYXkobm9kZS5kYXRhLmlzb2xhdGUpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG5hbWVzcGFjZS5jb25jYXQoW3Njb3BlT2JqXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbm9kZS5kYXRhLmlzb2xhdGUgfSkgfSk7XG4gICAgICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIG5ld05vZGUsIHsga2V5OiBuZXdOb2RlLmtleSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgID8gbmV3Tm9kZS5rZXlcbiAgICAgICAgICAgICAgICAgICAgOiBKU09OLnN0cmluZ2lmeShuZXdOb2RlLmRhdGEuaXNvbGF0ZSkgfSk7XG4gICAgICAgIH0pO1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VJc29sYXRlU2luayA9IG1ha2VJc29sYXRlU2luaztcbmZ1bmN0aW9uIGdldFNjb3BlT2JqKHNjb3BlKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdHlwZTogdXRpbHNfMS5pc0NsYXNzT3JJZChzY29wZSkgPyAnc2libGluZycgOiAndG90YWwnLFxuICAgICAgICBzY29wZTogc2NvcGUsXG4gICAgfTtcbn1cbmV4cG9ydHMuZ2V0U2NvcGVPYmogPSBnZXRTY29wZU9iajtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWlzb2xhdGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgc25hYmJkb21fMSA9IHJlcXVpcmUoXCJzbmFiYmRvbVwiKTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBjb25jYXRfMSA9IHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2NvbmNhdFwiKTtcbnZhciBzYW1wbGVDb21iaW5lXzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9zYW1wbGVDb21iaW5lXCIpO1xudmFyIE1haW5ET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL01haW5ET01Tb3VyY2VcIik7XG52YXIgdG92bm9kZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL3Rvdm5vZGVcIik7XG52YXIgVk5vZGVXcmFwcGVyXzEgPSByZXF1aXJlKFwiLi9WTm9kZVdyYXBwZXJcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIG1vZHVsZXNfMSA9IHJlcXVpcmUoXCIuL21vZHVsZXNcIik7XG52YXIgSXNvbGF0ZU1vZHVsZV8xID0gcmVxdWlyZShcIi4vSXNvbGF0ZU1vZHVsZVwiKTtcbnZhciBFdmVudERlbGVnYXRvcl8xID0gcmVxdWlyZShcIi4vRXZlbnREZWxlZ2F0b3JcIik7XG5mdW5jdGlvbiBtYWtlRE9NRHJpdmVySW5wdXRHdWFyZChtb2R1bGVzKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KG1vZHVsZXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk9wdGlvbmFsIG1vZHVsZXMgb3B0aW9uIG11c3QgYmUgYW4gYXJyYXkgZm9yIHNuYWJiZG9tIG1vZHVsZXNcIik7XG4gICAgfVxufVxuZnVuY3Rpb24gZG9tRHJpdmVySW5wdXRHdWFyZCh2aWV3JCkge1xuICAgIGlmICghdmlldyQgfHxcbiAgICAgICAgdHlwZW9mIHZpZXckLmFkZExpc3RlbmVyICE9PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAgICAgdHlwZW9mIHZpZXckLmZvbGQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgRE9NIGRyaXZlciBmdW5jdGlvbiBleHBlY3RzIGFzIGlucHV0IGEgU3RyZWFtIG9mIFwiICtcbiAgICAgICAgICAgIFwidmlydHVhbCBET00gZWxlbWVudHNcIik7XG4gICAgfVxufVxuZnVuY3Rpb24gZHJvcENvbXBsZXRpb24oaW5wdXQpIHtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoaW5wdXQsIHhzdHJlYW1fMS5kZWZhdWx0Lm5ldmVyKCkpO1xufVxuZnVuY3Rpb24gdW53cmFwRWxlbWVudEZyb21WTm9kZSh2bm9kZSkge1xuICAgIHJldHVybiB2bm9kZS5lbG07XG59XG5mdW5jdGlvbiByZXBvcnRTbmFiYmRvbUVycm9yKGVycikge1xuICAgIChjb25zb2xlLmVycm9yIHx8IGNvbnNvbGUubG9nKShlcnIpO1xufVxuZnVuY3Rpb24gbWFrZURPTVJlYWR5JCgpIHtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKHtcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIChsaXMpIHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnbG9hZGluZycpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdyZWFkeXN0YXRlY2hhbmdlJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3RhdGUgPSBkb2N1bWVudC5yZWFkeVN0YXRlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09ICdpbnRlcmFjdGl2ZScgfHwgc3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpcy5uZXh0KG51bGwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxpcy5uZXh0KG51bGwpO1xuICAgICAgICAgICAgICAgIGxpcy5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzdG9wOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgfSk7XG59XG5mdW5jdGlvbiBhZGRSb290U2NvcGUodm5vZGUpIHtcbiAgICB2bm9kZS5kYXRhID0gdm5vZGUuZGF0YSB8fCB7fTtcbiAgICB2bm9kZS5kYXRhLmlzb2xhdGUgPSBbXTtcbiAgICByZXR1cm4gdm5vZGU7XG59XG5mdW5jdGlvbiBtYWtlRE9NRHJpdmVyKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0ge307XG4gICAgfVxuICAgIHV0aWxzXzEuY2hlY2tWYWxpZENvbnRhaW5lcihjb250YWluZXIpO1xuICAgIHZhciBtb2R1bGVzID0gb3B0aW9ucy5tb2R1bGVzIHx8IG1vZHVsZXNfMS5kZWZhdWx0O1xuICAgIG1ha2VET01Ecml2ZXJJbnB1dEd1YXJkKG1vZHVsZXMpO1xuICAgIHZhciBpc29sYXRlTW9kdWxlID0gbmV3IElzb2xhdGVNb2R1bGVfMS5Jc29sYXRlTW9kdWxlKCk7XG4gICAgdmFyIHBhdGNoID0gc25hYmJkb21fMS5pbml0KFtpc29sYXRlTW9kdWxlLmNyZWF0ZU1vZHVsZSgpXS5jb25jYXQobW9kdWxlcykpO1xuICAgIHZhciBkb21SZWFkeSQgPSBtYWtlRE9NUmVhZHkkKCk7XG4gICAgdmFyIHZub2RlV3JhcHBlcjtcbiAgICB2YXIgbXV0YXRpb25PYnNlcnZlcjtcbiAgICB2YXIgbXV0YXRpb25Db25maXJtZWQkID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKHtcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIChsaXN0ZW5lcikge1xuICAgICAgICAgICAgbXV0YXRpb25PYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGxpc3RlbmVyLm5leHQobnVsbCk7IH0pO1xuICAgICAgICB9LFxuICAgICAgICBzdG9wOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtdXRhdGlvbk9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgfSxcbiAgICB9KTtcbiAgICBmdW5jdGlvbiBET01Ecml2ZXIodm5vZGUkLCBuYW1lKSB7XG4gICAgICAgIGlmIChuYW1lID09PSB2b2lkIDApIHsgbmFtZSA9ICdET00nOyB9XG4gICAgICAgIGRvbURyaXZlcklucHV0R3VhcmQodm5vZGUkKTtcbiAgICAgICAgdmFyIHNhbml0YXRpb24kID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIHZhciBmaXJzdFJvb3QkID0gZG9tUmVhZHkkLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZmlyc3RSb290ID0gdXRpbHNfMS5nZXRWYWxpZE5vZGUoY29udGFpbmVyKSB8fCBkb2N1bWVudC5ib2R5O1xuICAgICAgICAgICAgdm5vZGVXcmFwcGVyID0gbmV3IFZOb2RlV3JhcHBlcl8xLlZOb2RlV3JhcHBlcihmaXJzdFJvb3QpO1xuICAgICAgICAgICAgcmV0dXJuIGZpcnN0Um9vdDtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIFdlIG5lZWQgdG8gc3Vic2NyaWJlIHRvIHRoZSBzaW5rIChpLmUuIHZub2RlJCkgc3luY2hyb25vdXNseSBpbnNpZGUgdGhpc1xuICAgICAgICAvLyBkcml2ZXIsIGFuZCBub3QgbGF0ZXIgaW4gdGhlIG1hcCgpLmZsYXR0ZW4oKSBiZWNhdXNlIHRoaXMgc2luayBpcyBpblxuICAgICAgICAvLyByZWFsaXR5IGEgU2lua1Byb3h5IGZyb20gQGN5Y2xlL3J1biwgYW5kIHdlIGRvbid0IHdhbnQgdG8gbWlzcyB0aGUgZmlyc3RcbiAgICAgICAgLy8gZW1pc3Npb24gd2hlbiB0aGUgbWFpbigpIGlzIGNvbm5lY3RlZCB0byB0aGUgZHJpdmVycy5cbiAgICAgICAgLy8gUmVhZCBtb3JlIGluIGlzc3VlICM3MzkuXG4gICAgICAgIHZhciByZW1lbWJlcmVkVk5vZGUkID0gdm5vZGUkLnJlbWVtYmVyKCk7XG4gICAgICAgIHJlbWVtYmVyZWRWTm9kZSQuYWRkTGlzdGVuZXIoe30pO1xuICAgICAgICAvLyBUaGUgbXV0YXRpb24gb2JzZXJ2ZXIgaW50ZXJuYWwgdG8gbXV0YXRpb25Db25maXJtZWQkIHNob3VsZFxuICAgICAgICAvLyBleGlzdCBiZWZvcmUgZWxlbWVudEFmdGVyUGF0Y2gkIGNhbGxzIG11dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZSgpXG4gICAgICAgIG11dGF0aW9uQ29uZmlybWVkJC5hZGRMaXN0ZW5lcih7fSk7XG4gICAgICAgIHZhciBlbGVtZW50QWZ0ZXJQYXRjaCQgPSBmaXJzdFJvb3QkXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChmaXJzdFJvb3QpIHtcbiAgICAgICAgICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdFxuICAgICAgICAgICAgICAgIC5tZXJnZShyZW1lbWJlcmVkVk5vZGUkLmVuZFdoZW4oc2FuaXRhdGlvbiQpLCBzYW5pdGF0aW9uJClcbiAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uICh2bm9kZSkgeyByZXR1cm4gdm5vZGVXcmFwcGVyLmNhbGwodm5vZGUpOyB9KVxuICAgICAgICAgICAgICAgIC5zdGFydFdpdGgoYWRkUm9vdFNjb3BlKHRvdm5vZGVfMS50b1ZOb2RlKGZpcnN0Um9vdCkpKVxuICAgICAgICAgICAgICAgIC5mb2xkKHBhdGNoLCB0b3Zub2RlXzEudG9WTm9kZShmaXJzdFJvb3QpKVxuICAgICAgICAgICAgICAgIC5kcm9wKDEpXG4gICAgICAgICAgICAgICAgLm1hcCh1bndyYXBFbGVtZW50RnJvbVZOb2RlKVxuICAgICAgICAgICAgICAgIC5zdGFydFdpdGgoZmlyc3RSb290KVxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgbXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKGVsLCB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyRGF0YTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlT2xkVmFsdWU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlckRhdGFPbGRWYWx1ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWw7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jb21wb3NlKGRyb3BDb21wbGV0aW9uKTtcbiAgICAgICAgfSAvLyBkb24ndCBjb21wbGV0ZSB0aGlzIHN0cmVhbVxuICAgICAgICApXG4gICAgICAgICAgICAuZmxhdHRlbigpO1xuICAgICAgICB2YXIgcm9vdEVsZW1lbnQkID0gY29uY2F0XzEuZGVmYXVsdChkb21SZWFkeSQsIG11dGF0aW9uQ29uZmlybWVkJClcbiAgICAgICAgICAgIC5lbmRXaGVuKHNhbml0YXRpb24kKVxuICAgICAgICAgICAgLmNvbXBvc2Uoc2FtcGxlQ29tYmluZV8xLmRlZmF1bHQoZWxlbWVudEFmdGVyUGF0Y2gkKSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGFycikgeyByZXR1cm4gYXJyWzFdOyB9KVxuICAgICAgICAgICAgLnJlbWVtYmVyKCk7XG4gICAgICAgIC8vIFN0YXJ0IHRoZSBzbmFiYmRvbSBwYXRjaGluZywgb3ZlciB0aW1lXG4gICAgICAgIHJvb3RFbGVtZW50JC5hZGRMaXN0ZW5lcih7IGVycm9yOiByZXBvcnRTbmFiYmRvbUVycm9yIH0pO1xuICAgICAgICB2YXIgZGVsZWdhdG9yID0gbmV3IEV2ZW50RGVsZWdhdG9yXzEuRXZlbnREZWxlZ2F0b3Iocm9vdEVsZW1lbnQkLCBpc29sYXRlTW9kdWxlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBNYWluRE9NU291cmNlXzEuTWFpbkRPTVNvdXJjZShyb290RWxlbWVudCQsIHNhbml0YXRpb24kLCBbXSwgaXNvbGF0ZU1vZHVsZSwgZGVsZWdhdG9yLCBuYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIERPTURyaXZlcjtcbn1cbmV4cG9ydHMubWFrZURPTURyaXZlciA9IG1ha2VET01Ecml2ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYWtlRE9NRHJpdmVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgU0NPUEVfUFJFRklYID0gJ19fXyc7XG52YXIgTW9ja2VkRE9NU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1vY2tlZERPTVNvdXJjZShfbW9ja0NvbmZpZykge1xuICAgICAgICB0aGlzLl9tb2NrQ29uZmlnID0gX21vY2tDb25maWc7XG4gICAgICAgIGlmIChfbW9ja0NvbmZpZy5lbGVtZW50cykge1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudHMgPSBfbW9ja0NvbmZpZy5lbGVtZW50cztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnRzID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5lbXB0eSgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBNb2NrZWRET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gdGhpc1xuICAgICAgICAgICAgLl9lbGVtZW50cztcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gJ01vY2tlZERPTSc7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBNb2NrZWRET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXRwdXQkID0gdGhpcy5lbGVtZW50cygpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChhcnIpIHsgcmV0dXJuIGFyci5sZW5ndGggPiAwOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoYXJyKSB7IHJldHVybiBhcnJbMF07IH0pXG4gICAgICAgICAgICAucmVtZW1iZXIoKTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQob3V0cHV0JCk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9ICdNb2NrZWRET00nO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBvcHRpb25zLCBidWJibGVzKSB7XG4gICAgICAgIHZhciBzdHJlYW1Gb3JFdmVudFR5cGUgPSB0aGlzLl9tb2NrQ29uZmlnW2V2ZW50VHlwZV07XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHN0cmVhbUZvckV2ZW50VHlwZSB8fCB4c3RyZWFtXzEuZGVmYXVsdC5lbXB0eSgpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gJ01vY2tlZERPTSc7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBNb2NrZWRET01Tb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICB2YXIgbW9ja0NvbmZpZ0ZvclNlbGVjdG9yID0gdGhpcy5fbW9ja0NvbmZpZ1tzZWxlY3Rvcl0gfHwge307XG4gICAgICAgIHJldHVybiBuZXcgTW9ja2VkRE9NU291cmNlKG1vY2tDb25maWdGb3JTZWxlY3Rvcik7XG4gICAgfTtcbiAgICBNb2NrZWRET01Tb3VyY2UucHJvdG90eXBlLmlzb2xhdGVTb3VyY2UgPSBmdW5jdGlvbiAoc291cmNlLCBzY29wZSkge1xuICAgICAgICByZXR1cm4gc291cmNlLnNlbGVjdCgnLicgKyBTQ09QRV9QUkVGSVggKyBzY29wZSk7XG4gICAgfTtcbiAgICBNb2NrZWRET01Tb3VyY2UucHJvdG90eXBlLmlzb2xhdGVTaW5rID0gZnVuY3Rpb24gKHNpbmssIHNjb3BlKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmspLm1hcChmdW5jdGlvbiAodm5vZGUpIHtcbiAgICAgICAgICAgIGlmICh2bm9kZS5zZWwgJiYgdm5vZGUuc2VsLmluZGV4T2YoU0NPUEVfUFJFRklYICsgc2NvcGUpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2bm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZub2RlLnNlbCArPSBcIi5cIiArIFNDT1BFX1BSRUZJWCArIHNjb3BlO1xuICAgICAgICAgICAgICAgIHJldHVybiB2bm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpO1xuICAgIH07XG4gICAgcmV0dXJuIE1vY2tlZERPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLk1vY2tlZERPTVNvdXJjZSA9IE1vY2tlZERPTVNvdXJjZTtcbmZ1bmN0aW9uIG1vY2tET01Tb3VyY2UobW9ja0NvbmZpZykge1xuICAgIHJldHVybiBuZXcgTW9ja2VkRE9NU291cmNlKG1vY2tDb25maWcpO1xufVxuZXhwb3J0cy5tb2NrRE9NU291cmNlID0gbW9ja0RPTVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1vY2tET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgY2xhc3NfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL2NsYXNzXCIpO1xuZXhwb3J0cy5DbGFzc01vZHVsZSA9IGNsYXNzXzEuZGVmYXVsdDtcbnZhciBwcm9wc18xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvcHJvcHNcIik7XG5leHBvcnRzLlByb3BzTW9kdWxlID0gcHJvcHNfMS5kZWZhdWx0O1xudmFyIGF0dHJpYnV0ZXNfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL2F0dHJpYnV0ZXNcIik7XG5leHBvcnRzLkF0dHJzTW9kdWxlID0gYXR0cmlidXRlc18xLmRlZmF1bHQ7XG52YXIgc3R5bGVfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL3N0eWxlXCIpO1xuZXhwb3J0cy5TdHlsZU1vZHVsZSA9IHN0eWxlXzEuZGVmYXVsdDtcbnZhciBkYXRhc2V0XzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9kYXRhc2V0XCIpO1xuZXhwb3J0cy5EYXRhc2V0TW9kdWxlID0gZGF0YXNldF8xLmRlZmF1bHQ7XG52YXIgbW9kdWxlcyA9IFtcbiAgICBzdHlsZV8xLmRlZmF1bHQsXG4gICAgY2xhc3NfMS5kZWZhdWx0LFxuICAgIHByb3BzXzEuZGVmYXVsdCxcbiAgICBhdHRyaWJ1dGVzXzEuZGVmYXVsdCxcbiAgICBkYXRhc2V0XzEuZGVmYXVsdCxcbl07XG5leHBvcnRzLmRlZmF1bHQgPSBtb2R1bGVzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kdWxlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBoXzEgPSByZXF1aXJlKFwic25hYmJkb20vaFwiKTtcbmZ1bmN0aW9uIGNvcHlUb1RodW5rKHZub2RlLCB0aHVua1ZOb2RlKSB7XG4gICAgdGh1bmtWTm9kZS5lbG0gPSB2bm9kZS5lbG07XG4gICAgdm5vZGUuZGF0YS5mbiA9IHRodW5rVk5vZGUuZGF0YS5mbjtcbiAgICB2bm9kZS5kYXRhLmFyZ3MgPSB0aHVua1ZOb2RlLmRhdGEuYXJncztcbiAgICB2bm9kZS5kYXRhLmlzb2xhdGUgPSB0aHVua1ZOb2RlLmRhdGEuaXNvbGF0ZTtcbiAgICB0aHVua1ZOb2RlLmRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIHRodW5rVk5vZGUuY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcbiAgICB0aHVua1ZOb2RlLnRleHQgPSB2bm9kZS50ZXh0O1xuICAgIHRodW5rVk5vZGUuZWxtID0gdm5vZGUuZWxtO1xufVxuZnVuY3Rpb24gaW5pdCh0aHVua1ZOb2RlKSB7XG4gICAgdmFyIGN1ciA9IHRodW5rVk5vZGUuZGF0YTtcbiAgICB2YXIgdm5vZGUgPSBjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBjdXIuYXJncyk7XG4gICAgY29weVRvVGh1bmsodm5vZGUsIHRodW5rVk5vZGUpO1xufVxuZnVuY3Rpb24gcHJlcGF0Y2gob2xkVm5vZGUsIHRodW5rVk5vZGUpIHtcbiAgICB2YXIgb2xkID0gb2xkVm5vZGUuZGF0YSwgY3VyID0gdGh1bmtWTm9kZS5kYXRhO1xuICAgIHZhciBpO1xuICAgIHZhciBvbGRBcmdzID0gb2xkLmFyZ3MsIGFyZ3MgPSBjdXIuYXJncztcbiAgICBpZiAob2xkLmZuICE9PSBjdXIuZm4gfHwgb2xkQXJncy5sZW5ndGggIT09IGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNvcHlUb1RodW5rKGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpLCB0aHVua1ZOb2RlKTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKG9sZEFyZ3NbaV0gIT09IGFyZ3NbaV0pIHtcbiAgICAgICAgICAgIGNvcHlUb1RodW5rKGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpLCB0aHVua1ZOb2RlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb3B5VG9UaHVuayhvbGRWbm9kZSwgdGh1bmtWTm9kZSk7XG59XG5mdW5jdGlvbiB0aHVuayhzZWwsIGtleSwgZm4sIGFyZ3MpIHtcbiAgICBpZiAoYXJncyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFyZ3MgPSBmbjtcbiAgICAgICAgZm4gPSBrZXk7XG4gICAgICAgIGtleSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGhfMS5oKHNlbCwge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgaG9vazogeyBpbml0OiBpbml0LCBwcmVwYXRjaDogcHJlcGF0Y2ggfSxcbiAgICAgICAgZm46IGZuLFxuICAgICAgICBhcmdzOiBhcmdzLFxuICAgIH0pO1xufVxuZXhwb3J0cy50aHVuayA9IHRodW5rO1xuZXhwb3J0cy5kZWZhdWx0ID0gdGh1bms7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10aHVuay5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGlzVmFsaWROb2RlKG9iaikge1xuICAgIHZhciBFTEVNX1RZUEUgPSAxO1xuICAgIHZhciBGUkFHX1RZUEUgPSAxMTtcbiAgICByZXR1cm4gdHlwZW9mIEhUTUxFbGVtZW50ID09PSAnb2JqZWN0J1xuICAgICAgICA/IG9iaiBpbnN0YW5jZW9mIEhUTUxFbGVtZW50IHx8IG9iaiBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnRcbiAgICAgICAgOiBvYmogJiZcbiAgICAgICAgICAgIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICBvYmogIT09IG51bGwgJiZcbiAgICAgICAgICAgIChvYmoubm9kZVR5cGUgPT09IEVMRU1fVFlQRSB8fCBvYmoubm9kZVR5cGUgPT09IEZSQUdfVFlQRSkgJiZcbiAgICAgICAgICAgIHR5cGVvZiBvYmoubm9kZU5hbWUgPT09ICdzdHJpbmcnO1xufVxuZnVuY3Rpb24gaXNDbGFzc09ySWQoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5sZW5ndGggPiAxICYmIChzdHJbMF0gPT09ICcuJyB8fCBzdHJbMF0gPT09ICcjJyk7XG59XG5leHBvcnRzLmlzQ2xhc3NPcklkID0gaXNDbGFzc09ySWQ7XG5mdW5jdGlvbiBpc0RvY0ZyYWcoZWwpIHtcbiAgICByZXR1cm4gZWwubm9kZVR5cGUgPT09IDExO1xufVxuZXhwb3J0cy5pc0RvY0ZyYWcgPSBpc0RvY0ZyYWc7XG5mdW5jdGlvbiBjaGVja1ZhbGlkQ29udGFpbmVyKGNvbnRhaW5lcikge1xuICAgIGlmICh0eXBlb2YgY29udGFpbmVyICE9PSAnc3RyaW5nJyAmJiAhaXNWYWxpZE5vZGUoY29udGFpbmVyKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0dpdmVuIGNvbnRhaW5lciBpcyBub3QgYSBET00gZWxlbWVudCBuZWl0aGVyIGEgc2VsZWN0b3Igc3RyaW5nLicpO1xuICAgIH1cbn1cbmV4cG9ydHMuY2hlY2tWYWxpZENvbnRhaW5lciA9IGNoZWNrVmFsaWRDb250YWluZXI7XG5mdW5jdGlvbiBnZXRWYWxpZE5vZGUoc2VsZWN0b3JzKSB7XG4gICAgdmFyIGRvbUVsZW1lbnQgPSB0eXBlb2Ygc2VsZWN0b3JzID09PSAnc3RyaW5nJ1xuICAgICAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3JzKVxuICAgICAgICA6IHNlbGVjdG9ycztcbiAgICBpZiAodHlwZW9mIHNlbGVjdG9ycyA9PT0gJ3N0cmluZycgJiYgZG9tRWxlbWVudCA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmVuZGVyIGludG8gdW5rbm93biBlbGVtZW50IGBcIiArIHNlbGVjdG9ycyArIFwiYFwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGRvbUVsZW1lbnQ7XG59XG5leHBvcnRzLmdldFZhbGlkTm9kZSA9IGdldFZhbGlkTm9kZTtcbmZ1bmN0aW9uIGdldFNlbGVjdG9ycyhuYW1lc3BhY2UpIHtcbiAgICB2YXIgcmVzID0gJyc7XG4gICAgZm9yICh2YXIgaSA9IG5hbWVzcGFjZS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICBpZiAobmFtZXNwYWNlW2ldLnR5cGUgIT09ICdzZWxlY3RvcicpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIHJlcyA9IG5hbWVzcGFjZVtpXS5zY29wZSArICcgJyArIHJlcztcbiAgICB9XG4gICAgcmV0dXJuIHJlcy50cmltKCk7XG59XG5leHBvcnRzLmdldFNlbGVjdG9ycyA9IGdldFNlbGVjdG9ycztcbmZ1bmN0aW9uIGlzRXF1YWxOYW1lc3BhY2UoYSwgYikge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShhKSB8fCAhQXJyYXkuaXNBcnJheShiKSB8fCBhLmxlbmd0aCAhPT0gYi5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGFbaV0udHlwZSAhPT0gYltpXS50eXBlIHx8IGFbaV0uc2NvcGUgIT09IGJbaV0uc2NvcGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cbmV4cG9ydHMuaXNFcXVhbE5hbWVzcGFjZSA9IGlzRXF1YWxOYW1lc3BhY2U7XG5mdW5jdGlvbiBtYWtlSW5zZXJ0KG1hcCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodHlwZSwgZWxtLCB2YWx1ZSkge1xuICAgICAgICBpZiAobWFwLmhhcyh0eXBlKSkge1xuICAgICAgICAgICAgdmFyIGlubmVyTWFwID0gbWFwLmdldCh0eXBlKTtcbiAgICAgICAgICAgIGlubmVyTWFwLnNldChlbG0sIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpbm5lck1hcCA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIGlubmVyTWFwLnNldChlbG0sIHZhbHVlKTtcbiAgICAgICAgICAgIG1hcC5zZXQodHlwZSwgaW5uZXJNYXApO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZUluc2VydCA9IG1ha2VJbnNlcnQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD11dGlscy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICB2YXIgZ2xvYmFsT2JqO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IGdsb2JhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHRoaXM7XG4gICAgfVxuICAgIGdsb2JhbE9iai5DeWNsZWpzID0gZ2xvYmFsT2JqLkN5Y2xlanMgfHwge307XG4gICAgZ2xvYmFsT2JqID0gZ2xvYmFsT2JqLkN5Y2xlanM7XG4gICAgZ2xvYmFsT2JqLmFkYXB0U3RyZWFtID0gZ2xvYmFsT2JqLmFkYXB0U3RyZWFtIHx8IChmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XG4gICAgcmV0dXJuIGdsb2JhbE9iajtcbn1cbmZ1bmN0aW9uIHNldEFkYXB0KGYpIHtcbiAgICBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbSA9IGY7XG59XG5leHBvcnRzLnNldEFkYXB0ID0gc2V0QWRhcHQ7XG5mdW5jdGlvbiBhZGFwdChzdHJlYW0pIHtcbiAgICByZXR1cm4gZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0oc3RyZWFtKTtcbn1cbmV4cG9ydHMuYWRhcHQgPSBhZGFwdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFkYXB0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBpbnRlcm5hbHNfMSA9IHJlcXVpcmUoXCIuL2ludGVybmFsc1wiKTtcbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHByZXBhcmVzIHRoZSBDeWNsZSBhcHBsaWNhdGlvbiB0byBiZSBleGVjdXRlZC4gVGFrZXMgYSBgbWFpbmBcbiAqIGZ1bmN0aW9uIGFuZCBwcmVwYXJlcyB0byBjaXJjdWxhcmx5IGNvbm5lY3RzIGl0IHRvIHRoZSBnaXZlbiBjb2xsZWN0aW9uIG9mXG4gKiBkcml2ZXIgZnVuY3Rpb25zLiBBcyBhbiBvdXRwdXQsIGBzZXR1cCgpYCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRocmVlXG4gKiBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kIGBydW5gLiBPbmx5IHdoZW4gYHJ1bigpYCBpcyBjYWxsZWQgd2lsbFxuICogdGhlIGFwcGxpY2F0aW9uIGFjdHVhbGx5IGV4ZWN1dGUuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGBydW4oKWAgZm9yXG4gKiBtb3JlIGRldGFpbHMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtzZXR1cH0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgc2lua3MsIHJ1bn0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogY29uc3QgZGlzcG9zZSA9IHJ1bigpOyAvLyBFeGVjdXRlcyB0aGUgYXBwbGljYXRpb25cbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgc2lua3NgIGFuZFxuICogYHJ1bmAuIGBzb3VyY2VzYCBpcyB0aGUgY29sbGVjdGlvbiBvZiBkcml2ZXIgc291cmNlcywgYHNpbmtzYCBpcyB0aGVcbiAqIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNpbmtzLCB0aGVzZSBjYW4gYmUgdXNlZCBmb3IgZGVidWdnaW5nIG9yIHRlc3RpbmcuIGBydW5gXG4gKiBpcyB0aGUgZnVuY3Rpb24gdGhhdCBvbmNlIGNhbGxlZCB3aWxsIGV4ZWN1dGUgdGhlIGFwcGxpY2F0aW9uLlxuICogQGZ1bmN0aW9uIHNldHVwXG4gKi9cbmZ1bmN0aW9uIHNldHVwKG1haW4sIGRyaXZlcnMpIHtcbiAgICBpZiAodHlwZW9mIG1haW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIHRoZSAnbWFpbicgXCIgKyBcImZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMuXCIpO1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWxzXzEuaXNPYmplY3RFbXB0eShkcml2ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGF0IGxlYXN0IG9uZSBkcml2ZXIgZnVuY3Rpb24gZGVjbGFyZWQgYXMgYSBwcm9wZXJ0eS5cIik7XG4gICAgfVxuICAgIHZhciBlbmdpbmUgPSBzZXR1cFJldXNhYmxlKGRyaXZlcnMpO1xuICAgIHZhciBzaW5rcyA9IG1haW4oZW5naW5lLnNvdXJjZXMpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcyA9IHdpbmRvdy5DeWNsZWpzIHx8IHt9O1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcy5zaW5rcyA9IHNpbmtzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcnVuKCkge1xuICAgICAgICB2YXIgZGlzcG9zZVJ1biA9IGVuZ2luZS5ydW4oc2lua3MpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgICAgIGRpc3Bvc2VSdW4oKTtcbiAgICAgICAgICAgIGVuZ2luZS5kaXNwb3NlKCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNpbmtzOiBzaW5rcywgc291cmNlczogZW5naW5lLnNvdXJjZXMsIHJ1bjogX3J1biB9O1xufVxuZXhwb3J0cy5zZXR1cCA9IHNldHVwO1xuLyoqXG4gKiBBIHBhcnRpYWxseS1hcHBsaWVkIHZhcmlhbnQgb2Ygc2V0dXAoKSB3aGljaCBhY2NlcHRzIG9ubHkgdGhlIGRyaXZlcnMsIGFuZFxuICogYWxsb3dzIG1hbnkgYG1haW5gIGZ1bmN0aW9ucyB0byBleGVjdXRlIGFuZCByZXVzZSB0aGlzIHNhbWUgc2V0IG9mIGRyaXZlcnMuXG4gKlxuICogVGFrZXMgYW4gb2JqZWN0IHdpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBpbnB1dCwgYW5kIG91dHB1dHMgYW4gb2JqZWN0IHdoaWNoXG4gKiBjb250YWlucyB0aGUgZ2VuZXJhdGVkIHNvdXJjZXMgKGZyb20gdGhvc2UgZHJpdmVycykgYW5kIGEgYHJ1bmAgZnVuY3Rpb25cbiAqICh3aGljaCBpbiB0dXJuIGV4cGVjdHMgc2lua3MgYXMgYXJndW1lbnQpLiBUaGlzIGBydW5gIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWRcbiAqIG11bHRpcGxlIHRpbWVzIHdpdGggZGlmZmVyZW50IGFyZ3VtZW50cywgYW5kIGl0IHdpbGwgcmV1c2UgdGhlIGRyaXZlcnMgdGhhdFxuICogd2VyZSBwYXNzZWQgdG8gYHNldHVwUmV1c2FibGVgLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYGBganNcbiAqIGltcG9ydCB7c2V0dXBSZXVzYWJsZX0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgcnVuLCBkaXNwb3NlfSA9IHNldHVwUmV1c2FibGUoZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGNvbnN0IHNpbmtzID0gbWFpbihzb3VyY2VzKTtcbiAqIGNvbnN0IGRpc3Bvc2VSdW4gPSBydW4oc2lua3MpO1xuICogLy8gLi4uXG4gKiBkaXNwb3NlUnVuKCk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTsgLy8gZW5kcyB0aGUgcmV1c2FiaWxpdHkgb2YgZHJpdmVyc1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgcnVuYCBhbmRcbiAqIGBkaXNwb3NlYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgcnVuYCBpcyB0aGVcbiAqIGZ1bmN0aW9uIHRoYXQgb25jZSBjYWxsZWQgd2l0aCAnc2lua3MnIGFzIGFyZ3VtZW50LCB3aWxsIGV4ZWN1dGUgdGhlXG4gKiBhcHBsaWNhdGlvbiwgdHlpbmcgdG9nZXRoZXIgc291cmNlcyB3aXRoIHNpbmtzLiBgZGlzcG9zZWAgdGVybWluYXRlcyB0aGVcbiAqIHJldXNhYmxlIHJlc291cmNlcyB1c2VkIGJ5IHRoZSBkcml2ZXJzLiBOb3RlIGFsc28gdGhhdCBgcnVuYCByZXR1cm5zIGFcbiAqIGRpc3Bvc2UgZnVuY3Rpb24gd2hpY2ggdGVybWluYXRlcyByZXNvdXJjZXMgdGhhdCBhcmUgc3BlY2lmaWMgKG5vdCByZXVzYWJsZSlcbiAqIHRvIHRoYXQgcnVuLlxuICogQGZ1bmN0aW9uIHNldHVwUmV1c2FibGVcbiAqL1xuZnVuY3Rpb24gc2V0dXBSZXVzYWJsZShkcml2ZXJzKSB7XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBwcm9wZXJ0aWVzLlwiKTtcbiAgICB9XG4gICAgaWYgKGludGVybmFsc18xLmlzT2JqZWN0RW1wdHkoZHJpdmVycykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIHNpbmtQcm94aWVzID0gaW50ZXJuYWxzXzEubWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpO1xuICAgIHZhciByYXdTb3VyY2VzID0gaW50ZXJuYWxzXzEuY2FsbERyaXZlcnMoZHJpdmVycywgc2lua1Byb3hpZXMpO1xuICAgIHZhciBzb3VyY2VzID0gaW50ZXJuYWxzXzEuYWRhcHRTb3VyY2VzKHJhd1NvdXJjZXMpO1xuICAgIGZ1bmN0aW9uIF9ydW4oc2lua3MpIHtcbiAgICAgICAgcmV0dXJuIGludGVybmFsc18xLnJlcGxpY2F0ZU1hbnkoc2lua3MsIHNpbmtQcm94aWVzKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcG9zZUVuZ2luZSgpIHtcbiAgICAgICAgaW50ZXJuYWxzXzEuZGlzcG9zZVNvdXJjZXMoc291cmNlcyk7XG4gICAgICAgIGludGVybmFsc18xLmRpc3Bvc2VTaW5rUHJveGllcyhzaW5rUHJveGllcyk7XG4gICAgfVxuICAgIHJldHVybiB7IHNvdXJjZXM6IHNvdXJjZXMsIHJ1bjogX3J1biwgZGlzcG9zZTogZGlzcG9zZUVuZ2luZSB9O1xufVxuZXhwb3J0cy5zZXR1cFJldXNhYmxlID0gc2V0dXBSZXVzYWJsZTtcbi8qKlxuICogVGFrZXMgYSBgbWFpbmAgZnVuY3Rpb24gYW5kIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb25cbiAqIG9mIGRyaXZlciBmdW5jdGlvbnMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHJ1biBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IGRpc3Bvc2UgPSBydW4obWFpbiwgZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTtcbiAqIGBgYFxuICpcbiAqIFRoZSBgbWFpbmAgZnVuY3Rpb24gZXhwZWN0cyBhIGNvbGxlY3Rpb24gb2YgXCJzb3VyY2VcIiBzdHJlYW1zIChyZXR1cm5lZCBmcm9tXG4gKiBkcml2ZXJzKSBhcyBpbnB1dCwgYW5kIHNob3VsZCByZXR1cm4gYSBjb2xsZWN0aW9uIG9mIFwic2lua1wiIHN0cmVhbXMgKHRvIGJlXG4gKiBnaXZlbiB0byBkcml2ZXJzKS4gQSBcImNvbGxlY3Rpb24gb2Ygc3RyZWFtc1wiIGlzIGEgSmF2YVNjcmlwdCBvYmplY3Qgd2hlcmVcbiAqIGtleXMgbWF0Y2ggdGhlIGRyaXZlciBuYW1lcyByZWdpc3RlcmVkIGJ5IHRoZSBgZHJpdmVyc2Agb2JqZWN0LCBhbmQgdmFsdWVzXG4gKiBhcmUgdGhlIHN0cmVhbXMuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGVhY2ggZHJpdmVyIHRvIHNlZSBtb3JlXG4gKiBkZXRhaWxzIG9uIHdoYXQgdHlwZXMgb2Ygc291cmNlcyBpdCBvdXRwdXRzIGFuZCBzaW5rcyBpdCByZWNlaXZlcy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgZGlzcG9zZSBmdW5jdGlvbiwgdXNlZCB0byB0ZXJtaW5hdGUgdGhlIGV4ZWN1dGlvbiBvZiB0aGVcbiAqIEN5Y2xlLmpzIHByb2dyYW0sIGNsZWFuaW5nIHVwIHJlc291cmNlcyB1c2VkLlxuICogQGZ1bmN0aW9uIHJ1blxuICovXG5mdW5jdGlvbiBydW4obWFpbiwgZHJpdmVycykge1xuICAgIHZhciBwcm9ncmFtID0gc2V0dXAobWFpbiwgZHJpdmVycyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgIHdpbmRvdy5DeWNsZWpzRGV2VG9vbF9zdGFydEdyYXBoU2VyaWFsaXplcikge1xuICAgICAgICB3aW5kb3cuQ3ljbGVqc0RldlRvb2xfc3RhcnRHcmFwaFNlcmlhbGl6ZXIocHJvZ3JhbS5zaW5rcyk7XG4gICAgfVxuICAgIHJldHVybiBwcm9ncmFtLnJ1bigpO1xufVxuZXhwb3J0cy5ydW4gPSBydW47XG5leHBvcnRzLmRlZmF1bHQgPSBydW47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBxdWlja3Rhc2tfMSA9IHJlcXVpcmUoXCJxdWlja3Rhc2tcIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCIuL2FkYXB0XCIpO1xudmFyIHNjaGVkdWxlTWljcm90YXNrID0gcXVpY2t0YXNrXzEuZGVmYXVsdCgpO1xuZnVuY3Rpb24gbWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpIHtcbiAgICB2YXIgc2lua1Byb3hpZXMgPSB7fTtcbiAgICBmb3IgKHZhciBuYW1lXzEgaW4gZHJpdmVycykge1xuICAgICAgICBpZiAoZHJpdmVycy5oYXNPd25Qcm9wZXJ0eShuYW1lXzEpKSB7XG4gICAgICAgICAgICBzaW5rUHJveGllc1tuYW1lXzFdID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNpbmtQcm94aWVzO1xufVxuZXhwb3J0cy5tYWtlU2lua1Byb3hpZXMgPSBtYWtlU2lua1Byb3hpZXM7XG5mdW5jdGlvbiBjYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgbmFtZV8yIGluIGRyaXZlcnMpIHtcbiAgICAgICAgaWYgKGRyaXZlcnMuaGFzT3duUHJvcGVydHkobmFtZV8yKSkge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdID0gZHJpdmVyc1tuYW1lXzJdKHNpbmtQcm94aWVzW25hbWVfMl0sIG5hbWVfMik7XG4gICAgICAgICAgICBpZiAoc291cmNlc1tuYW1lXzJdICYmIHR5cGVvZiBzb3VyY2VzW25hbWVfMl0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdLl9pc0N5Y2xlU291cmNlID0gbmFtZV8yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5jYWxsRHJpdmVycyA9IGNhbGxEcml2ZXJzO1xuLy8gTk9URTogdGhpcyB3aWxsIG11dGF0ZSBgc291cmNlc2AuXG5mdW5jdGlvbiBhZGFwdFNvdXJjZXMoc291cmNlcykge1xuICAgIGZvciAodmFyIG5hbWVfMyBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KG5hbWVfMykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSAmJlxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZXNbbmFtZV8zXS5zaGFtZWZ1bGx5U2VuZE5leHQgPT09XG4gICAgICAgICAgICAgICAgJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzNdID0gYWRhcHRfMS5hZGFwdChzb3VyY2VzW25hbWVfM10pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5hZGFwdFNvdXJjZXMgPSBhZGFwdFNvdXJjZXM7XG5mdW5jdGlvbiByZXBsaWNhdGVNYW55KHNpbmtzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhzaW5rcykuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiAhIXNpbmtQcm94aWVzW25hbWVdOyB9KTtcbiAgICB2YXIgYnVmZmVycyA9IHt9O1xuICAgIHZhciByZXBsaWNhdG9ycyA9IHt9O1xuICAgIHNpbmtOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0gPSB7IF9uOiBbXSwgX2U6IFtdIH07XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdID0ge1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKHgpIHsgcmV0dXJuIGJ1ZmZlcnNbbmFtZV0uX24ucHVzaCh4KTsgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7IHJldHVybiBidWZmZXJzW25hbWVdLl9lLnB1c2goZXJyKTsgfSxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSBzaW5rTmFtZXMubWFwKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tuYW1lXSkuc3Vic2NyaWJlKHJlcGxpY2F0b3JzW25hbWVdKTtcbiAgICB9KTtcbiAgICBzaW5rTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgbGlzdGVuZXIgPSBzaW5rUHJveGllc1tuYW1lXTtcbiAgICAgICAgdmFyIG5leHQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgc2NoZWR1bGVNaWNyb3Rhc2soZnVuY3Rpb24gKCkgeyByZXR1cm4gbGlzdGVuZXIuX24oeCk7IH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBzY2hlZHVsZU1pY3JvdGFzayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgKGNvbnNvbGUuZXJyb3IgfHwgY29uc29sZS5sb2cpKGVycik7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuX2UoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBidWZmZXJzW25hbWVdLl9uLmZvckVhY2gobmV4dCk7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0uX2UuZm9yRWFjaChlcnJvcik7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLm5leHQgPSBuZXh0O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5lcnJvciA9IGVycm9yO1xuICAgICAgICAvLyBiZWNhdXNlIHNpbmsuc3Vic2NyaWJlKHJlcGxpY2F0b3IpIGhhZCBtdXRhdGVkIHJlcGxpY2F0b3IgdG8gYWRkXG4gICAgICAgIC8vIF9uLCBfZSwgX2MsIHdlIG11c3QgYWxzbyB1cGRhdGUgdGhlc2U6XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLl9uID0gbmV4dDtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uX2UgPSBlcnJvcjtcbiAgICB9KTtcbiAgICBidWZmZXJzID0gbnVsbDsgLy8gZnJlZSB1cCBmb3IgR0NcbiAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZVJlcGxpY2F0aW9uKCkge1xuICAgICAgICBzdWJzY3JpcHRpb25zLmZvckVhY2goZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudW5zdWJzY3JpYmUoKTsgfSk7XG4gICAgfTtcbn1cbmV4cG9ydHMucmVwbGljYXRlTWFueSA9IHJlcGxpY2F0ZU1hbnk7XG5mdW5jdGlvbiBkaXNwb3NlU2lua1Byb3hpZXMoc2lua1Byb3hpZXMpIHtcbiAgICBPYmplY3Qua2V5cyhzaW5rUHJveGllcykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gc2lua1Byb3hpZXNbbmFtZV0uX2MoKTsgfSk7XG59XG5leHBvcnRzLmRpc3Bvc2VTaW5rUHJveGllcyA9IGRpc3Bvc2VTaW5rUHJveGllcztcbmZ1bmN0aW9uIGRpc3Bvc2VTb3VyY2VzKHNvdXJjZXMpIHtcbiAgICBmb3IgKHZhciBrIGluIHNvdXJjZXMpIHtcbiAgICAgICAgaWYgKHNvdXJjZXMuaGFzT3duUHJvcGVydHkoaykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNba10gJiZcbiAgICAgICAgICAgIHNvdXJjZXNba10uZGlzcG9zZSkge1xuICAgICAgICAgICAgc291cmNlc1trXS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmRpc3Bvc2VTb3VyY2VzID0gZGlzcG9zZVNvdXJjZXM7XG5mdW5jdGlvbiBpc09iamVjdEVtcHR5KG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmV4cG9ydHMuaXNPYmplY3RFbXB0eSA9IGlzT2JqZWN0RW1wdHk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbnRlcm5hbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgaXNvbGF0ZV8xID0gcmVxdWlyZShcIkBjeWNsZS9pc29sYXRlXCIpO1xudmFyIHBpY2tNZXJnZV8xID0gcmVxdWlyZShcIi4vcGlja01lcmdlXCIpO1xudmFyIHBpY2tDb21iaW5lXzEgPSByZXF1aXJlKFwiLi9waWNrQ29tYmluZVwiKTtcbi8qKlxuICogQW4gb2JqZWN0IHJlcHJlc2VudGluZyBhbGwgaW5zdGFuY2VzIGluIGEgY29sbGVjdGlvbiBvZiBjb21wb25lbnRzLiBIYXMgdGhlXG4gKiBtZXRob2RzIHBpY2tDb21iaW5lIGFuZCBwaWNrTWVyZ2UgdG8gZ2V0IHRoZSBjb21iaW5lZCBzaW5rcyBvZiBhbGwgaW5zdGFuY2VzLlxuICovXG52YXIgSW5zdGFuY2VzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEluc3RhbmNlcyhpbnN0YW5jZXMkKSB7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcyQgPSBpbnN0YW5jZXMkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBMaWtlIGBtZXJnZWAgaW4geHN0cmVhbSwgdGhpcyBvcGVyYXRvciBibGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgYnV0XG4gICAgICogcGlja3MgdGhvc2Ugc3RyZWFtcyBmcm9tIGEgY29sbGVjdGlvbiBvZiBjb21wb25lbnQgaW5zdGFuY2VzLlxuICAgICAqXG4gICAgICogVXNlIHRoZSBgc2VsZWN0b3JgIHN0cmluZyB0byBwaWNrIGEgc3RyZWFtIGZyb20gdGhlIHNpbmtzIG9iamVjdCBvZiBlYWNoXG4gICAgICogY29tcG9uZW50IGluc3RhbmNlLCB0aGVuIHBpY2tNZXJnZSB3aWxsIG1lcmdlIGFsbCB0aG9zZSBwaWNrZWQgc3RyZWFtcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIG5hbWUgb2YgYSBjaGFubmVsIGluIGEgc2lua3Mgb2JqZWN0IGJlbG9uZ2luZyB0b1xuICAgICAqIGVhY2ggY29tcG9uZW50IGluIHRoZSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IGFuIG9wZXJhdG9yIHRvIGJlIHVzZWQgd2l0aCB4c3RyZWFtJ3MgYGNvbXBvc2VgIG1ldGhvZC5cbiAgICAgKi9cbiAgICBJbnN0YW5jZXMucHJvdG90eXBlLnBpY2tNZXJnZSA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdCh0aGlzLl9pbnN0YW5jZXMkLmNvbXBvc2UocGlja01lcmdlXzEucGlja01lcmdlKHNlbGVjdG9yKSkpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogTGlrZSBgY29tYmluZWAgaW4geHN0cmVhbSwgdGhpcyBvcGVyYXRvciBjb21iaW5lcyBtdWx0aXBsZSBzdHJlYW1zIHRvZ2V0aGVyLFxuICAgICAqIGJ1dCBwaWNrcyB0aG9zZSBzdHJlYW1zIGZyb20gYSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudCBpbnN0YW5jZXMuXG4gICAgICpcbiAgICAgKiBVc2UgdGhlIGBzZWxlY3RvcmAgc3RyaW5nIHRvIHBpY2sgYSBzdHJlYW0gZnJvbSB0aGUgc2lua3Mgb2JqZWN0IG9mIGVhY2hcbiAgICAgKiBjb21wb25lbnQgaW5zdGFuY2UsIHRoZW4gcGlja0NvbWJpbmUgd2lsbCBjb21iaW5lIGFsbCB0aG9zZSBwaWNrZWQgc3RyZWFtcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIG5hbWUgb2YgYSBjaGFubmVsIGluIGEgc2lua3Mgb2JqZWN0IGJlbG9uZ2luZyB0b1xuICAgICAqIGVhY2ggY29tcG9uZW50IGluIHRoZSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IGFuIG9wZXJhdG9yIHRvIGJlIHVzZWQgd2l0aCB4c3RyZWFtJ3MgYGNvbXBvc2VgIG1ldGhvZC5cbiAgICAgKi9cbiAgICBJbnN0YW5jZXMucHJvdG90eXBlLnBpY2tDb21iaW5lID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KHRoaXMuX2luc3RhbmNlcyQuY29tcG9zZShwaWNrQ29tYmluZV8xLnBpY2tDb21iaW5lKHNlbGVjdG9yKSkpO1xuICAgIH07XG4gICAgcmV0dXJuIEluc3RhbmNlcztcbn0oKSk7XG5leHBvcnRzLkluc3RhbmNlcyA9IEluc3RhbmNlcztcbmZ1bmN0aW9uIGRlZmF1bHRJdGVtU2NvcGUoa2V5KSB7XG4gICAgcmV0dXJuIHsgJyonOiBudWxsIH07XG59XG5mdW5jdGlvbiBpbnN0YW5jZUxlbnMoaXRlbUtleSwga2V5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBhcnIubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcIlwiICsgaXRlbUtleShhcnJbaV0sIGkpID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJbaV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoYXJyLCBpdGVtKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2l0ZW1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKHMsIGkpIHsgcmV0dXJuIFwiXCIgKyBpdGVtS2V5KHMsIGkpICE9PSBrZXk7IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyci5tYXAoZnVuY3Rpb24gKHMsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiXCIgKyBpdGVtS2V5KHMsIGkpID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xufVxudmFyIGlkZW50aXR5TGVucyA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uIChvdXRlcikgeyByZXR1cm4gb3V0ZXI7IH0sXG4gICAgc2V0OiBmdW5jdGlvbiAob3V0ZXIsIGlubmVyKSB7IHJldHVybiBpbm5lcjsgfSxcbn07XG5mdW5jdGlvbiBtYWtlQ29sbGVjdGlvbihvcHRzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNvbGxlY3Rpb25Db21wb25lbnQoc291cmNlcykge1xuICAgICAgICB2YXIgbmFtZSA9IG9wdHMuY2hhbm5lbCB8fCAnc3RhdGUnO1xuICAgICAgICB2YXIgaXRlbUtleSA9IG9wdHMuaXRlbUtleTtcbiAgICAgICAgdmFyIGl0ZW1TY29wZSA9IG9wdHMuaXRlbVNjb3BlIHx8IGRlZmF1bHRJdGVtU2NvcGU7XG4gICAgICAgIHZhciBpdGVtQ29tcCA9IG9wdHMuaXRlbTtcbiAgICAgICAgdmFyIHN0YXRlJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXNbbmFtZV0uc3RyZWFtKTtcbiAgICAgICAgdmFyIGluc3RhbmNlcyQgPSBzdGF0ZSQuZm9sZChmdW5jdGlvbiAoYWNjLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgICAgIHZhciBfYSwgX2IsIF9jLCBfZDtcbiAgICAgICAgICAgIHZhciBkaWN0ID0gYWNjLmRpY3Q7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShuZXh0U3RhdGUpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRJbnN0QXJyYXkgPSBBcnJheShuZXh0U3RhdGUubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEtleXNfMSA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgICAgICAvLyBhZGRcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IG5leHRTdGF0ZS5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IFwiXCIgKyAoaXRlbUtleSA/IGl0ZW1LZXkobmV4dFN0YXRlW2ldLCBpKSA6IGkpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0S2V5c18xLmFkZChrZXkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWRpY3QuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdGF0ZVNjb3BlID0gaXRlbUtleSA/IGluc3RhbmNlTGVucyhpdGVtS2V5LCBrZXkpIDogXCJcIiArIGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3RoZXJTY29wZXMgPSBpdGVtU2NvcGUoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY29wZXMgPSB0eXBlb2Ygb3RoZXJTY29wZXMgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAoX2EgPSB7ICcqJzogb3RoZXJTY29wZXMgfSwgX2FbbmFtZV0gPSBzdGF0ZVNjb3BlLCBfYSkgOiBfX2Fzc2lnbih7fSwgb3RoZXJTY29wZXMsIChfYiA9IHt9LCBfYltuYW1lXSA9IHN0YXRlU2NvcGUsIF9iKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2lua3MgPSBpc29sYXRlXzEuZGVmYXVsdChpdGVtQ29tcCwgc2NvcGVzKShzb3VyY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3Quc2V0KGtleSwgc2lua3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXSA9IHNpbmtzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXSA9IGRpY3QuZ2V0KGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXS5fa2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyByZW1vdmVcbiAgICAgICAgICAgICAgICBkaWN0LmZvckVhY2goZnVuY3Rpb24gKF8sIGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5leHRLZXlzXzEuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3QuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBuZXh0S2V5c18xLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGljdDogZGljdCwgYXJyOiBuZXh0SW5zdEFycmF5IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWN0LmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IFwiXCIgKyAoaXRlbUtleSA/IGl0ZW1LZXkobmV4dFN0YXRlLCAwKSA6ICd0aGlzJyk7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlU2NvcGUgPSBpZGVudGl0eUxlbnM7XG4gICAgICAgICAgICAgICAgdmFyIG90aGVyU2NvcGVzID0gaXRlbVNjb3BlKGtleSk7XG4gICAgICAgICAgICAgICAgdmFyIHNjb3BlcyA9IHR5cGVvZiBvdGhlclNjb3BlcyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyAoX2MgPSB7ICcqJzogb3RoZXJTY29wZXMgfSwgX2NbbmFtZV0gPSBzdGF0ZVNjb3BlLCBfYykgOiBfX2Fzc2lnbih7fSwgb3RoZXJTY29wZXMsIChfZCA9IHt9LCBfZFtuYW1lXSA9IHN0YXRlU2NvcGUsIF9kKSk7XG4gICAgICAgICAgICAgICAgdmFyIHNpbmtzID0gaXNvbGF0ZV8xLmRlZmF1bHQoaXRlbUNvbXAsIHNjb3Blcykoc291cmNlcyk7XG4gICAgICAgICAgICAgICAgZGljdC5zZXQoa2V5LCBzaW5rcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGljdDogZGljdCwgYXJyOiBbc2lua3NdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgZGljdDogbmV3IE1hcCgpLCBhcnI6IFtdIH0pO1xuICAgICAgICByZXR1cm4gb3B0cy5jb2xsZWN0U2lua3MobmV3IEluc3RhbmNlcyhpbnN0YW5jZXMkKSk7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZUNvbGxlY3Rpb24gPSBtYWtlQ29sbGVjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUNvbGxlY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGRyb3BSZXBlYXRzXzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0c1wiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xuZnVuY3Rpb24gdXBkYXRlQXJyYXlFbnRyeShhcnJheSwgc2NvcGUsIG5ld1ZhbCkge1xuICAgIGlmIChuZXdWYWwgPT09IGFycmF5W3Njb3BlXSkge1xuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuICAgIHZhciBpbmRleCA9IHBhcnNlSW50KHNjb3BlKTtcbiAgICBpZiAodHlwZW9mIG5ld1ZhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5LmZpbHRlcihmdW5jdGlvbiAoX3ZhbCwgaSkgeyByZXR1cm4gaSAhPT0gaW5kZXg7IH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXkubWFwKGZ1bmN0aW9uICh2YWwsIGkpIHsgcmV0dXJuIChpID09PSBpbmRleCA/IG5ld1ZhbCA6IHZhbCk7IH0pO1xufVxuZnVuY3Rpb24gbWFrZUdldHRlcihzY29wZSkge1xuICAgIGlmICh0eXBlb2Ygc2NvcGUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzY29wZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGxlbnNHZXQoc3RhdGUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZVtzY29wZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2NvcGUuZ2V0O1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VTZXR0ZXIoc2NvcGUpIHtcbiAgICBpZiAodHlwZW9mIHNjb3BlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygc2NvcGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBsZW5zU2V0KHN0YXRlLCBjaGlsZFN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc3RhdGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZUFycmF5RW50cnkoc3RhdGUsIHNjb3BlLCBjaGlsZFN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2EgPSB7fSwgX2Fbc2NvcGVdID0gY2hpbGRTdGF0ZSwgX2E7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIHN0YXRlLCAoX2IgPSB7fSwgX2Jbc2NvcGVdID0gY2hpbGRTdGF0ZSwgX2IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBzY29wZS5zZXQ7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKSB7XG4gICAgcmV0dXJuIHNvdXJjZS5zZWxlY3Qoc2NvcGUpO1xufVxuZXhwb3J0cy5pc29sYXRlU291cmNlID0gaXNvbGF0ZVNvdXJjZTtcbmZ1bmN0aW9uIGlzb2xhdGVTaW5rKGlubmVyUmVkdWNlciQsIHNjb3BlKSB7XG4gICAgdmFyIGdldCA9IG1ha2VHZXR0ZXIoc2NvcGUpO1xuICAgIHZhciBzZXQgPSBtYWtlU2V0dGVyKHNjb3BlKTtcbiAgICByZXR1cm4gaW5uZXJSZWR1Y2VyJC5tYXAoZnVuY3Rpb24gKGlubmVyUmVkdWNlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gb3V0ZXJSZWR1Y2VyKG91dGVyKSB7XG4gICAgICAgICAgICB2YXIgcHJldklubmVyID0gZ2V0KG91dGVyKTtcbiAgICAgICAgICAgIHZhciBuZXh0SW5uZXIgPSBpbm5lclJlZHVjZXIocHJldklubmVyKTtcbiAgICAgICAgICAgIGlmIChwcmV2SW5uZXIgPT09IG5leHRJbm5lcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXQob3V0ZXIsIG5leHRJbm5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5leHBvcnRzLmlzb2xhdGVTaW5rID0gaXNvbGF0ZVNpbms7XG4vKipcbiAqIFJlcHJlc2VudHMgYSBwaWVjZSBvZiBhcHBsaWNhdGlvbiBzdGF0ZSBkeW5hbWljYWxseSBjaGFuZ2luZyBvdmVyIHRpbWUuXG4gKi9cbnZhciBTdGF0ZVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdGF0ZVNvdXJjZShzdHJlYW0sIG5hbWUpIHtcbiAgICAgICAgdGhpcy5pc29sYXRlU291cmNlID0gaXNvbGF0ZVNvdXJjZTtcbiAgICAgICAgdGhpcy5pc29sYXRlU2luayA9IGlzb2xhdGVTaW5rO1xuICAgICAgICB0aGlzLl9zdHJlYW0gPSBzdHJlYW1cbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHR5cGVvZiBzICE9PSAndW5kZWZpbmVkJzsgfSlcbiAgICAgICAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzXzEuZGVmYXVsdCgpKVxuICAgICAgICAgICAgLnJlbWVtYmVyKCk7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnN0cmVhbSA9IGFkYXB0XzEuYWRhcHQodGhpcy5fc3RyZWFtKTtcbiAgICAgICAgdGhpcy5fc3RyZWFtLl9pc0N5Y2xlU291cmNlID0gbmFtZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VsZWN0cyBhIHBhcnQgKG9yIHNjb3BlKSBvZiB0aGUgc3RhdGUgb2JqZWN0IGFuZCByZXR1cm5zIGEgbmV3IFN0YXRlU291cmNlXG4gICAgICogZHluYW1pY2FsbHkgcmVwcmVzZW50aW5nIHRoYXQgc2VsZWN0ZWQgcGFydCBvZiB0aGUgc3RhdGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8bGVuc30gc2NvcGUgYXMgYSBzdHJpbmcsIHRoaXMgYXJndW1lbnQgcmVwcmVzZW50cyB0aGVcbiAgICAgKiBwcm9wZXJ0eSB5b3Ugd2FudCB0byBzZWxlY3QgZnJvbSB0aGUgc3RhdGUgb2JqZWN0LiBBcyBhIG51bWJlciwgdGhpc1xuICAgICAqIHJlcHJlc2VudHMgdGhlIGFycmF5IGluZGV4IHlvdSB3YW50IHRvIHNlbGVjdCBmcm9tIHRoZSBzdGF0ZSBhcnJheS4gQXMgYVxuICAgICAqIGxlbnMgb2JqZWN0IChhbiBvYmplY3Qgd2l0aCBnZXQoKSBhbmQgc2V0KCkpLCB0aGlzIGFyZ3VtZW50IHJlcHJlc2VudHMgYW55XG4gICAgICogY3VzdG9tIHdheSBvZiBzZWxlY3Rpbmcgc29tZXRoaW5nIGZyb20gdGhlIHN0YXRlIG9iamVjdC5cbiAgICAgKi9cbiAgICBTdGF0ZVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgIHZhciBnZXQgPSBtYWtlR2V0dGVyKHNjb3BlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZVNvdXJjZSh0aGlzLl9zdHJlYW0ubWFwKGdldCksIHRoaXMuX25hbWUpO1xuICAgIH07XG4gICAgcmV0dXJuIFN0YXRlU291cmNlO1xufSgpKTtcbmV4cG9ydHMuU3RhdGVTb3VyY2UgPSBTdGF0ZVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVN0YXRlU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFN0YXRlU291cmNlXzEgPSByZXF1aXJlKFwiLi9TdGF0ZVNvdXJjZVwiKTtcbmV4cG9ydHMuU3RhdGVTb3VyY2UgPSBTdGF0ZVNvdXJjZV8xLlN0YXRlU291cmNlO1xuZXhwb3J0cy5pc29sYXRlU291cmNlID0gU3RhdGVTb3VyY2VfMS5pc29sYXRlU291cmNlO1xuZXhwb3J0cy5pc29sYXRlU2luayA9IFN0YXRlU291cmNlXzEuaXNvbGF0ZVNpbms7XG52YXIgQ29sbGVjdGlvbl8xID0gcmVxdWlyZShcIi4vQ29sbGVjdGlvblwiKTtcbmV4cG9ydHMuSW5zdGFuY2VzID0gQ29sbGVjdGlvbl8xLkluc3RhbmNlcztcbi8qKlxuICogR2l2ZW4gYSBDeWNsZS5qcyBjb21wb25lbnQgdGhhdCBleHBlY3RzIGEgc3RhdGUgKnNvdXJjZSogYW5kIHdpbGxcbiAqIG91dHB1dCBhIHJlZHVjZXIgKnNpbmsqLCB0aGlzIGZ1bmN0aW9uIHNldHMgdXAgdGhlIHN0YXRlIG1hbmFnZW1lbnRcbiAqIG1lY2hhbmljcyB0byBhY2N1bXVsYXRlIHN0YXRlIG92ZXIgdGltZSBhbmQgcHJvdmlkZSB0aGUgc3RhdGUgc291cmNlLiBJdFxuICogcmV0dXJucyBhIEN5Y2xlLmpzIGNvbXBvbmVudCB3aGljaCB3cmFwcyB0aGUgY29tcG9uZW50IGdpdmVuIGFzIGlucHV0LlxuICogRXNzZW50aWFsbHksIGl0IGhvb2tzIHVwIHRoZSByZWR1Y2VycyBzaW5rIHdpdGggdGhlIHN0YXRlIHNvdXJjZSBhcyBhIGN5Y2xlLlxuICpcbiAqIE9wdGlvbmFsbHksIHlvdSBjYW4gcGFzcyBhIGN1c3RvbSBuYW1lIGZvciB0aGUgc3RhdGUgY2hhbm5lbC4gQnkgZGVmYXVsdCxcbiAqIHRoZSBuYW1lIGlzICdzdGF0ZScgaW4gc291cmNlcyBhbmQgc2lua3MsIGJ1dCB5b3UgY2FuIGNoYW5nZSB0aGF0IHRvIGJlXG4gKiB3aGF0ZXZlciBzdHJpbmcgeW91IHdpc2guXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgYW4gb3B0aW9uYWwgc3RyaW5nIGZvciB0aGUgY3VzdG9tIG5hbWUgZ2l2ZW4gdG8gdGhlXG4gKiBzdGF0ZSBjaGFubmVsLiBCeSBkZWZhdWx0LCBpdCBpcyB0aGUgc3RyaW5nICdzdGF0ZScuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBjb21wb25lbnQgdGhhdCB3cmFwcyB0aGUgbWFpbiBmdW5jdGlvbiBnaXZlbiBhcyBpbnB1dCxcbiAqIGFkZGluZyBzdGF0ZSBhY2N1bXVsYXRpb24gbG9naWMgdG8gaXQuXG4gKiBAZnVuY3Rpb24gd2l0aFN0YXRlXG4gKi9cbnZhciB3aXRoU3RhdGVfMSA9IHJlcXVpcmUoXCIuL3dpdGhTdGF0ZVwiKTtcbmV4cG9ydHMud2l0aFN0YXRlID0gd2l0aFN0YXRlXzEud2l0aFN0YXRlO1xuLyoqXG4gKiBSZXR1cm5zIGEgQ3ljbGUuanMgY29tcG9uZW50IChhIGZ1bmN0aW9uIGZyb20gc291cmNlcyB0byBzaW5rcykgdGhhdFxuICogcmVwcmVzZW50cyBhIGNvbGxlY3Rpb24gb2YgbWFueSBpdGVtIGNvbXBvbmVudHMgb2YgdGhlIHNhbWUgdHlwZS5cbiAqXG4gKiBUYWtlcyBhbiBcIm9wdGlvbnNcIiBvYmplY3QgYXMgaW5wdXQsIHdpdGggdGhlIHJlcXVpcmVkIHByb3BlcnRpZXM6XG4gKiAtIGl0ZW1cbiAqIC0gY29sbGVjdFNpbmtzXG4gKlxuICogQW5kIHRoZSBvcHRpb25hbCBwcm9wZXJ0aWVzOlxuICogLSBpdGVtS2V5XG4gKiAtIGl0ZW1TY29wZVxuICogLSBjaGFubmVsXG4gKlxuICogVGhlIHJldHVybmVkIGNvbXBvbmVudCwgdGhlIENvbGxlY3Rpb24sIHdpbGwgdXNlIHRoZSBzdGF0ZSBzb3VyY2UgcGFzc2VkIHRvXG4gKiBpdCAodGhyb3VnaCBzb3VyY2VzKSB0byBndWlkZSB0aGUgZHluYW1pYyBncm93aW5nL3Nocmlua2luZyBvZiBpbnN0YW5jZXMgb2ZcbiAqIHRoZSBpdGVtIGNvbXBvbmVudC5cbiAqXG4gKiBUeXBpY2FsbHkgdGhlIHN0YXRlIHNvdXJjZSBzaG91bGQgZW1pdCBhcnJheXMsIHdoZXJlIGVhY2ggZW50cnkgaW4gdGhlIGFycmF5XG4gKiBpcyBhbiBvYmplY3QgaG9sZGluZyB0aGUgc3RhdGUgZm9yIGVhY2ggaXRlbSBjb21wb25lbnQuIFdoZW4gdGhlIHN0YXRlIGFycmF5XG4gKiBncm93cywgdGhlIGNvbGxlY3Rpb24gd2lsbCBhdXRvbWF0aWNhbGx5IGluc3RhbnRpYXRlIGEgbmV3IGl0ZW0gY29tcG9uZW50LlxuICogU2ltaWxhcmx5LCB3aGVuIHRoZSBzdGF0ZSBhcnJheSBnZXRzIHNtYWxsZXIsIHRoZSBjb2xsZWN0aW9uIHdpbGwgaGFuZGxlXG4gKiByZW1vdmFsIG9mIHRoZSBjb3JyZXNwb25kaW5nIGl0ZW0gaW5zdGFuY2UuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBhIGNvbmZpZ3VyYXRpb24gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZHM6XG4gKiAgIC0gYGl0ZW06IGZ1bmN0aW9uYCwgYSBDeWNsZS5qcyBjb21wb25lbnQgZm9yIGVhY2ggaXRlbSBpbiB0aGUgY29sbGVjdGlvbi5cbiAqICAgLSBgY29sbGVjdFNpbmtzOiBmdW5jdGlvbmAsIGEgZnVuY3Rpb24gdGhhdCBkZXNjcmliZXMgaG93IHRvIGNvbGxlY3QgdGhlXG4gKiAgICAgIHNpbmtzIGZyb20gYWxsIGl0ZW0gaW5zdGFuY2VzLlxuICogICAtIGBpdGVtS2V5OiBmdW5jdGlvbmAsIGEgZnVuY3Rpb24gZnJvbSBpdGVtIHN0YXRlIHRvIGl0ZW0gKHVuaXF1ZSkga2V5LlxuICogICAtIGBpdGVtU2NvcGU6IGZ1bmN0aW9uYCwgYSBmdW5jdGlvbiBmcm9tIGl0ZW0ga2V5IHRvIGlzb2xhdGlvbiBzY29wZS5cbiAqICAgLSBgY2hhbm5lbDogc3RyaW5nYCwgY2hvb3NlIHRoZSBjaGFubmVsIG5hbWUgd2hlcmUgdGhlIFN0YXRlU291cmNlIGV4aXN0cy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhIGNvbXBvbmVudCB0aGF0IGRpc3BsYXlzIG1hbnkgaW5zdGFuY2VzIG9mIHRoZSBpdGVtXG4gKiBjb21wb25lbnQuXG4gKiBAZnVuY3Rpb24gbWFrZUNvbGxlY3Rpb25cbiAqL1xudmFyIENvbGxlY3Rpb25fMiA9IHJlcXVpcmUoXCIuL0NvbGxlY3Rpb25cIik7XG5leHBvcnRzLm1ha2VDb2xsZWN0aW9uID0gQ29sbGVjdGlvbl8yLm1ha2VDb2xsZWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgUGlja0NvbWJpbmVMaXN0ZW5lciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrQ29tYmluZUxpc3RlbmVyKGtleSwgb3V0LCBwLCBpbnMpIHtcbiAgICAgICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLnAgPSBwO1xuICAgICAgICB0aGlzLnZhbCA9IHhzdHJlYW1fMS5OTztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgfVxuICAgIFBpY2tDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgICAgICB0aGlzLnZhbCA9IHQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnAudXAoKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2UoZXJyKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIHJldHVybiBQaWNrQ29tYmluZUxpc3RlbmVyO1xufSgpKTtcbnZhciBQaWNrQ29tYmluZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrQ29tYmluZShzZWwsIGlucykge1xuICAgICAgICB0aGlzLnR5cGUgPSAnY29tYmluZSc7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLnNlbCA9IHNlbDtcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmlscyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pbnN0ID0gbnVsbDtcbiAgICB9XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgaWxzLmZvckVhY2goZnVuY3Rpb24gKGlsKSB7XG4gICAgICAgICAgICBpbC5pbnMuX3JlbW92ZShpbCk7XG4gICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgIGlsLnZhbCA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICBpbHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmlscyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pbnN0ID0gbnVsbDtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS51cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyciA9IHRoaXMuaW5zdC5hcnI7XG4gICAgICAgIHZhciBuID0gYXJyLmxlbmd0aDtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICB2YXIgb3V0QXJyID0gQXJyYXkobik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc2lua3MgPSBhcnJbaV07XG4gICAgICAgICAgICB2YXIga2V5ID0gc2lua3MuX2tleTtcbiAgICAgICAgICAgIGlmICghaWxzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHZhbCA9IGlscy5nZXQoa2V5KS52YWw7XG4gICAgICAgICAgICBpZiAodmFsID09PSB4c3RyZWFtXzEuTk8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdXRBcnJbaV0gPSB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vdXQuX24ob3V0QXJyKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uIChpbnN0KSB7XG4gICAgICAgIHRoaXMuaW5zdCA9IGluc3Q7XG4gICAgICAgIHZhciBhcnJTaW5rcyA9IGluc3QuYXJyO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgdmFyIHNlbCA9IHRoaXMuc2VsO1xuICAgICAgICB2YXIgZGljdCA9IGluc3QuZGljdDtcbiAgICAgICAgdmFyIG4gPSBhcnJTaW5rcy5sZW5ndGg7XG4gICAgICAgIC8vIHJlbW92ZVxuICAgICAgICB2YXIgcmVtb3ZlZCA9IGZhbHNlO1xuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwsIGtleSkge1xuICAgICAgICAgICAgaWYgKCFkaWN0LmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWwuaW5zLl9yZW1vdmUoaWwpO1xuICAgICAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbC52YWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlscy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgICAgICByZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChuID09PSAwKSB7XG4gICAgICAgICAgICBvdXQuX24oW10pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIGFkZFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgdmFyIHNpbmtzID0gYXJyU2lua3NbaV07XG4gICAgICAgICAgICB2YXIga2V5ID0gc2lua3MuX2tleTtcbiAgICAgICAgICAgIGlmICghc2lua3Nbc2VsXSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncGlja0NvbWJpbmUgZm91bmQgYW4gdW5kZWZpbmVkIGNoaWxkIHNpbmsgc3RyZWFtJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2luayA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW3NlbF0pO1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbHMuc2V0KGtleSwgbmV3IFBpY2tDb21iaW5lTGlzdGVuZXIoa2V5LCBvdXQsIHRoaXMsIHNpbmspKTtcbiAgICAgICAgICAgICAgICBzaW5rLl9hZGQoaWxzLmdldChrZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICAgICAgdGhpcy51cCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2UoZSk7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIFBpY2tDb21iaW5lO1xufSgpKTtcbmZ1bmN0aW9uIHBpY2tDb21iaW5lKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBpY2tDb21iaW5lT3BlcmF0b3IoaW5zdCQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB4c3RyZWFtXzEuU3RyZWFtKG5ldyBQaWNrQ29tYmluZShzZWxlY3RvciwgaW5zdCQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5waWNrQ29tYmluZSA9IHBpY2tDb21iaW5lO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGlja0NvbWJpbmUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgUGlja01lcmdlTGlzdGVuZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGlja01lcmdlTGlzdGVuZXIob3V0LCBwLCBpbnMpIHtcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLnAgPSBwO1xuICAgIH1cbiAgICBQaWNrTWVyZ2VMaXN0ZW5lci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucCwgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX24odCk7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2VMaXN0ZW5lci5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fZShlcnIpO1xuICAgIH07XG4gICAgUGlja01lcmdlTGlzdGVuZXIucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIHJldHVybiBQaWNrTWVyZ2VMaXN0ZW5lcjtcbn0oKSk7XG52YXIgUGlja01lcmdlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tNZXJnZShzZWwsIGlucykge1xuICAgICAgICB0aGlzLnR5cGUgPSAncGlja01lcmdlJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5zZWwgPSBzZWw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH1cbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCwga2V5KSB7XG4gICAgICAgICAgICBpbC5pbnMuX3JlbW92ZShpbCk7XG4gICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgIGlscy5kZWxldGUoa2V5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlscy5jbGVhcigpO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uIChpbnN0KSB7XG4gICAgICAgIHRoaXMuaW5zdCA9IGluc3Q7XG4gICAgICAgIHZhciBhcnJTaW5rcyA9IGluc3QuYXJyO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgdmFyIHNlbCA9IHRoaXMuc2VsO1xuICAgICAgICB2YXIgbiA9IGFyclNpbmtzLmxlbmd0aDtcbiAgICAgICAgLy8gYWRkXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc2lua3MgPSBhcnJTaW5rc1tpXTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBzaW5rcy5fa2V5O1xuICAgICAgICAgICAgdmFyIHNpbmsgPSB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tzZWxdIHx8IHhzdHJlYW1fMS5kZWZhdWx0Lm5ldmVyKCkpO1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbHMuc2V0KGtleSwgbmV3IFBpY2tNZXJnZUxpc3RlbmVyKG91dCwgdGhpcywgc2luaykpO1xuICAgICAgICAgICAgICAgIHNpbmsuX2FkZChpbHMuZ2V0KGtleSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHJlbW92ZVxuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwsIGtleSkge1xuICAgICAgICAgICAgaWYgKCFpbnN0LmRpY3QuaGFzKGtleSkgfHwgIWluc3QuZGljdC5nZXQoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlsLm91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWxzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdS5fZShlcnIpO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1Ll9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gUGlja01lcmdlO1xufSgpKTtcbmZ1bmN0aW9uIHBpY2tNZXJnZShzZWxlY3Rvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiBwaWNrTWVyZ2VPcGVyYXRvcihpbnN0JCkge1xuICAgICAgICByZXR1cm4gbmV3IHhzdHJlYW1fMS5TdHJlYW0obmV3IFBpY2tNZXJnZShzZWxlY3RvciwgaW5zdCQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5waWNrTWVyZ2UgPSBwaWNrTWVyZ2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1waWNrTWVyZ2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgY29uY2F0XzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9jb25jYXRcIik7XG52YXIgU3RhdGVTb3VyY2VfMSA9IHJlcXVpcmUoXCIuL1N0YXRlU291cmNlXCIpO1xudmFyIHF1aWNrdGFza18xID0gcmVxdWlyZShcInF1aWNrdGFza1wiKTtcbnZhciBzY2hlZHVsZSA9IHF1aWNrdGFza18xLmRlZmF1bHQoKTtcbmZ1bmN0aW9uIHdpdGhTdGF0ZShtYWluLCBuYW1lKSB7XG4gICAgaWYgKG5hbWUgPT09IHZvaWQgMCkgeyBuYW1lID0gJ3N0YXRlJzsgfVxuICAgIHJldHVybiBmdW5jdGlvbiBtYWluV2l0aFN0YXRlKHNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHJlZHVjZXJNaW1pYyQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgdmFyIHN0YXRlJCA9IHJlZHVjZXJNaW1pYyRcbiAgICAgICAgICAgIC5mb2xkKGZ1bmN0aW9uIChzdGF0ZSwgcmVkdWNlcikgeyByZXR1cm4gcmVkdWNlcihzdGF0ZSk7IH0sIHZvaWQgMClcbiAgICAgICAgICAgIC5kcm9wKDEpO1xuICAgICAgICB2YXIgaW5uZXJTb3VyY2VzID0gc291cmNlcztcbiAgICAgICAgaW5uZXJTb3VyY2VzW25hbWVdID0gbmV3IFN0YXRlU291cmNlXzEuU3RhdGVTb3VyY2Uoc3RhdGUkLCBuYW1lKTtcbiAgICAgICAgdmFyIHNpbmtzID0gbWFpbihpbm5lclNvdXJjZXMpO1xuICAgICAgICBpZiAoc2lua3NbbmFtZV0pIHtcbiAgICAgICAgICAgIHZhciBzdHJlYW0kID0gY29uY2F0XzEuZGVmYXVsdCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tuYW1lXSksIHhzdHJlYW1fMS5kZWZhdWx0Lm5ldmVyKCkpO1xuICAgICAgICAgICAgc3RyZWFtJC5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChpKSB7IHJldHVybiBzY2hlZHVsZShmdW5jdGlvbiAoKSB7IHJldHVybiByZWR1Y2VyTWltaWMkLl9uKGkpOyB9KTsgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikgeyByZXR1cm4gc2NoZWR1bGUoZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVkdWNlck1pbWljJC5fZShlcnIpOyB9KTsgfSxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gc2NoZWR1bGUoZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVkdWNlck1pbWljJC5fYygpOyB9KTsgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaW5rcztcbiAgICB9O1xufVxuZXhwb3J0cy53aXRoU3RhdGUgPSB3aXRoU3RhdGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD13aXRoU3RhdGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBtaWNyb3Rhc2soKSB7XG4gICAgaWYgKHR5cGVvZiBNdXRhdGlvbk9ic2VydmVyICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB2YXIgbm9kZV8xID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoJycpO1xuICAgICAgICB2YXIgcXVldWVfMSA9IFtdO1xuICAgICAgICB2YXIgaV8xID0gMDtcbiAgICAgICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2hpbGUgKHF1ZXVlXzEubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcXVldWVfMS5zaGlmdCgpKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLm9ic2VydmUobm9kZV8xLCB7IGNoYXJhY3RlckRhdGE6IHRydWUgfSk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgICAgIHF1ZXVlXzEucHVzaChmbik7XG4gICAgICAgICAgICBub2RlXzEuZGF0YSA9IGlfMSA9IDEgLSBpXzE7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBzZXRJbW1lZGlhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBzZXRJbW1lZGlhdGU7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gcHJvY2Vzcy5uZXh0VGljaztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0O1xuICAgIH1cbn1cbmV4cG9ydHMuZGVmYXVsdCA9IG1pY3JvdGFzaztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHNlbGVjdG9yUGFyc2VyXzEgPSByZXF1aXJlKCcuL3NlbGVjdG9yUGFyc2VyJyk7XG5mdW5jdGlvbiBjbGFzc05hbWVGcm9tVk5vZGUodk5vZGUpIHtcbiAgICB2YXIgX2EgPSBzZWxlY3RvclBhcnNlcl8xLnNlbGVjdG9yUGFyc2VyKHZOb2RlKS5jbGFzc05hbWUsIGNuID0gX2EgPT09IHZvaWQgMCA/ICcnIDogX2E7XG4gICAgaWYgKCF2Tm9kZS5kYXRhKSB7XG4gICAgICAgIHJldHVybiBjbjtcbiAgICB9XG4gICAgdmFyIF9iID0gdk5vZGUuZGF0YSwgZGF0YUNsYXNzID0gX2IuY2xhc3MsIHByb3BzID0gX2IucHJvcHM7XG4gICAgaWYgKGRhdGFDbGFzcykge1xuICAgICAgICB2YXIgYyA9IE9iamVjdC5rZXlzKGRhdGFDbGFzcylcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGNsKSB7IHJldHVybiBkYXRhQ2xhc3NbY2xdOyB9KTtcbiAgICAgICAgY24gKz0gXCIgXCIgKyBjLmpvaW4oXCIgXCIpO1xuICAgIH1cbiAgICBpZiAocHJvcHMgJiYgcHJvcHMuY2xhc3NOYW1lKSB7XG4gICAgICAgIGNuICs9IFwiIFwiICsgcHJvcHMuY2xhc3NOYW1lO1xuICAgIH1cbiAgICByZXR1cm4gY24gJiYgY24udHJpbSgpO1xufVxuZXhwb3J0cy5jbGFzc05hbWVGcm9tVk5vZGUgPSBjbGFzc05hbWVGcm9tVk5vZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jbGFzc05hbWVGcm9tVk5vZGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBjdXJyeTIoc2VsZWN0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHNlbGVjdG9yKHNlbCwgdk5vZGUpIHtcbiAgICAgICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBjYXNlIDA6IHJldHVybiBzZWxlY3Q7XG4gICAgICAgICAgICBjYXNlIDE6IHJldHVybiBmdW5jdGlvbiAoX3ZOb2RlKSB7IHJldHVybiBzZWxlY3Qoc2VsLCBfdk5vZGUpOyB9O1xuICAgICAgICAgICAgZGVmYXVsdDogcmV0dXJuIHNlbGVjdChzZWwsIHZOb2RlKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5leHBvcnRzLmN1cnJ5MiA9IGN1cnJ5Mjtcbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWN1cnJ5Mi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBxdWVyeV8xID0gcmVxdWlyZSgnLi9xdWVyeScpO1xudmFyIHBhcmVudF9zeW1ib2xfMSA9IHJlcXVpcmUoJy4vcGFyZW50LXN5bWJvbCcpO1xuZnVuY3Rpb24gZmluZE1hdGNoZXMoY3NzU2VsZWN0b3IsIHZOb2RlKSB7XG4gICAgaWYgKCF2Tm9kZSkge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuICAgIHRyYXZlcnNlVk5vZGUodk5vZGUsIGFkZFBhcmVudCk7IC8vIGFkZCBtYXBwaW5nIHRvIHRoZSBwYXJlbnQgc2VsZWN0b3JQYXJzZXJcbiAgICByZXR1cm4gcXVlcnlfMS5xdWVyeVNlbGVjdG9yKGNzc1NlbGVjdG9yLCB2Tm9kZSk7XG59XG5leHBvcnRzLmZpbmRNYXRjaGVzID0gZmluZE1hdGNoZXM7XG5mdW5jdGlvbiB0cmF2ZXJzZVZOb2RlKHZOb2RlLCBmKSB7XG4gICAgZnVuY3Rpb24gcmVjdXJzZShjdXJyZW50Tm9kZSwgaXNQYXJlbnQsIHBhcmVudFZOb2RlKSB7XG4gICAgICAgIHZhciBsZW5ndGggPSBjdXJyZW50Tm9kZS5jaGlsZHJlbiAmJiBjdXJyZW50Tm9kZS5jaGlsZHJlbi5sZW5ndGggfHwgMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gY3VycmVudE5vZGUuY2hpbGRyZW47XG4gICAgICAgICAgICBpZiAoY2hpbGRyZW4gJiYgY2hpbGRyZW5baV0gJiYgdHlwZW9mIGNoaWxkcmVuW2ldICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIHJlY3Vyc2UoY2hpbGQsIGZhbHNlLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZihjdXJyZW50Tm9kZSwgaXNQYXJlbnQsIGlzUGFyZW50ID8gdm9pZCAwIDogcGFyZW50Vk5vZGUpO1xuICAgIH1cbiAgICByZWN1cnNlKHZOb2RlLCB0cnVlKTtcbn1cbmZ1bmN0aW9uIGFkZFBhcmVudCh2Tm9kZSwgaXNQYXJlbnQsIHBhcmVudCkge1xuICAgIGlmIChpc1BhcmVudCkge1xuICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH1cbiAgICBpZiAoIXZOb2RlLmRhdGEpIHtcbiAgICAgICAgdk5vZGUuZGF0YSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIXZOb2RlLmRhdGFbcGFyZW50X3N5bWJvbF8xLmRlZmF1bHRdKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2Tm9kZS5kYXRhLCBwYXJlbnRfc3ltYm9sXzEuZGVmYXVsdCwge1xuICAgICAgICAgICAgdmFsdWU6IHBhcmVudCxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZmluZE1hdGNoZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgY3VycnkyXzEgPSByZXF1aXJlKCcuL2N1cnJ5MicpO1xudmFyIGZpbmRNYXRjaGVzXzEgPSByZXF1aXJlKCcuL2ZpbmRNYXRjaGVzJyk7XG5leHBvcnRzLnNlbGVjdCA9IGN1cnJ5Ml8xLmN1cnJ5MihmaW5kTWF0Y2hlc18xLmZpbmRNYXRjaGVzKTtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZSgnLi9zZWxlY3RvclBhcnNlcicpO1xuZXhwb3J0cy5zZWxlY3RvclBhcnNlciA9IHNlbGVjdG9yUGFyc2VyXzEuc2VsZWN0b3JQYXJzZXI7XG52YXIgY2xhc3NOYW1lRnJvbVZOb2RlXzEgPSByZXF1aXJlKCcuL2NsYXNzTmFtZUZyb21WTm9kZScpO1xuZXhwb3J0cy5jbGFzc05hbWVGcm9tVk5vZGUgPSBjbGFzc05hbWVGcm9tVk5vZGVfMS5jbGFzc05hbWVGcm9tVk5vZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciByb290O1xuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJvb3QgPSBzZWxmO1xufVxuZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByb290ID0gd2luZG93O1xufVxuZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByb290ID0gZ2xvYmFsO1xufVxuZWxzZSB7XG4gICAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2w7XG52YXIgcGFyZW50U3ltYm9sO1xuaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicpIHtcbiAgICBwYXJlbnRTeW1ib2wgPSBTeW1ib2woJ3BhcmVudCcpO1xufVxuZWxzZSB7XG4gICAgcGFyZW50U3ltYm9sID0gJ0BAc25hYmJkb20tc2VsZWN0b3ItcGFyZW50Jztcbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHBhcmVudFN5bWJvbDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBhcmVudC1zeW1ib2wuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgdHJlZV9zZWxlY3Rvcl8xID0gcmVxdWlyZSgndHJlZS1zZWxlY3RvcicpO1xudmFyIHNlbGVjdG9yUGFyc2VyXzEgPSByZXF1aXJlKCcuL3NlbGVjdG9yUGFyc2VyJyk7XG52YXIgY2xhc3NOYW1lRnJvbVZOb2RlXzEgPSByZXF1aXJlKCcuL2NsYXNzTmFtZUZyb21WTm9kZScpO1xudmFyIHBhcmVudF9zeW1ib2xfMSA9IHJlcXVpcmUoJy4vcGFyZW50LXN5bWJvbCcpO1xudmFyIG9wdGlvbnMgPSB7XG4gICAgdGFnOiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIHNlbGVjdG9yUGFyc2VyXzEuc2VsZWN0b3JQYXJzZXIodk5vZGUpLnRhZ05hbWU7IH0sXG4gICAgY2xhc3NOYW1lOiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIGNsYXNzTmFtZUZyb21WTm9kZV8xLmNsYXNzTmFtZUZyb21WTm9kZSh2Tm9kZSk7IH0sXG4gICAgaWQ6IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gc2VsZWN0b3JQYXJzZXJfMS5zZWxlY3RvclBhcnNlcih2Tm9kZSkuaWQgfHwgJyc7IH0sXG4gICAgY2hpbGRyZW46IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gdk5vZGUuY2hpbGRyZW4gfHwgW107IH0sXG4gICAgcGFyZW50OiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIHZOb2RlLmRhdGFbcGFyZW50X3N5bWJvbF8xLmRlZmF1bHRdIHx8IHZOb2RlOyB9LFxuICAgIGNvbnRlbnRzOiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIHZOb2RlLnRleHQgfHwgJyc7IH0sXG4gICAgYXR0cjogZnVuY3Rpb24gKHZOb2RlLCBhdHRyKSB7XG4gICAgICAgIGlmICh2Tm9kZS5kYXRhKSB7XG4gICAgICAgICAgICB2YXIgX2EgPSB2Tm9kZS5kYXRhLCBfYiA9IF9hLmF0dHJzLCBhdHRycyA9IF9iID09PSB2b2lkIDAgPyB7fSA6IF9iLCBfYyA9IF9hLnByb3BzLCBwcm9wcyA9IF9jID09PSB2b2lkIDAgPyB7fSA6IF9jLCBfZCA9IF9hLmRhdGFzZXQsIGRhdGFzZXQgPSBfZCA9PT0gdm9pZCAwID8ge30gOiBfZDtcbiAgICAgICAgICAgIGlmIChhdHRyc1thdHRyXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhdHRyc1thdHRyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9wc1thdHRyXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wc1thdHRyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhdHRyLmluZGV4T2YoJ2RhdGEtJykgPT09IDAgJiYgZGF0YXNldFthdHRyLnNsaWNlKDUpXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhc2V0W2F0dHIuc2xpY2UoNSldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbn07XG52YXIgbWF0Y2hlcyA9IHRyZWVfc2VsZWN0b3JfMS5jcmVhdGVNYXRjaGVzKG9wdGlvbnMpO1xuZnVuY3Rpb24gY3VzdG9tTWF0Y2hlcyhzZWwsIHZub2RlKSB7XG4gICAgdmFyIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIHZhciBzZWxlY3RvciA9IG1hdGNoZXMuYmluZChudWxsLCBzZWwpO1xuICAgIGlmIChkYXRhICYmIGRhdGEuZm4pIHtcbiAgICAgICAgdmFyIG4gPSB2b2lkIDA7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEuYXJncykpIHtcbiAgICAgICAgICAgIG4gPSBkYXRhLmZuLmFwcGx5KG51bGwsIGRhdGEuYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGF0YS5hcmdzKSB7XG4gICAgICAgICAgICBuID0gZGF0YS5mbi5jYWxsKG51bGwsIGRhdGEuYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuID0gZGF0YS5mbigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWxlY3RvcihuKSA/IG4gOiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdG9yKHZub2RlKTtcbn1cbmV4cG9ydHMucXVlcnlTZWxlY3RvciA9IHRyZWVfc2VsZWN0b3JfMS5jcmVhdGVRdWVyeVNlbGVjdG9yKG9wdGlvbnMsIGN1c3RvbU1hdGNoZXMpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cXVlcnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBzZWxlY3RvclBhcnNlcihub2RlKSB7XG4gICAgaWYgKCFub2RlLnNlbCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGFnTmFtZTogJycsXG4gICAgICAgICAgICBpZDogJycsXG4gICAgICAgICAgICBjbGFzc05hbWU6ICcnLFxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgc2VsID0gbm9kZS5zZWw7XG4gICAgdmFyIGhhc2hJZHggPSBzZWwuaW5kZXhPZignIycpO1xuICAgIHZhciBkb3RJZHggPSBzZWwuaW5kZXhPZignLicsIGhhc2hJZHgpO1xuICAgIHZhciBoYXNoID0gaGFzaElkeCA+IDAgPyBoYXNoSWR4IDogc2VsLmxlbmd0aDtcbiAgICB2YXIgZG90ID0gZG90SWR4ID4gMCA/IGRvdElkeCA6IHNlbC5sZW5ndGg7XG4gICAgdmFyIHRhZ05hbWUgPSBoYXNoSWR4ICE9PSAtMSB8fCBkb3RJZHggIT09IC0xID9cbiAgICAgICAgc2VsLnNsaWNlKDAsIE1hdGgubWluKGhhc2gsIGRvdCkpIDpcbiAgICAgICAgc2VsO1xuICAgIHZhciBpZCA9IGhhc2ggPCBkb3QgPyBzZWwuc2xpY2UoaGFzaCArIDEsIGRvdCkgOiB2b2lkIDA7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGRvdElkeCA+IDAgPyBzZWwuc2xpY2UoZG90ICsgMSkucmVwbGFjZSgvXFwuL2csICcgJykgOiB2b2lkIDA7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICBjbGFzc05hbWU6IGNsYXNzTmFtZSxcbiAgICB9O1xufVxuZXhwb3J0cy5zZWxlY3RvclBhcnNlciA9IHNlbGVjdG9yUGFyc2VyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2VsZWN0b3JQYXJzZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdm5vZGVfMSA9IHJlcXVpcmUoXCIuL3Zub2RlXCIpO1xudmFyIGlzID0gcmVxdWlyZShcIi4vaXNcIik7XG5mdW5jdGlvbiBhZGROUyhkYXRhLCBjaGlsZHJlbiwgc2VsKSB7XG4gICAgZGF0YS5ucyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG4gICAgaWYgKHNlbCAhPT0gJ2ZvcmVpZ25PYmplY3QnICYmIGNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkRGF0YSA9IGNoaWxkcmVuW2ldLmRhdGE7XG4gICAgICAgICAgICBpZiAoY2hpbGREYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBhZGROUyhjaGlsZERhdGEsIGNoaWxkcmVuW2ldLmNoaWxkcmVuLCBjaGlsZHJlbltpXS5zZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gaChzZWwsIGIsIGMpIHtcbiAgICB2YXIgZGF0YSA9IHt9LCBjaGlsZHJlbiwgdGV4dCwgaTtcbiAgICBpZiAoYyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRhdGEgPSBiO1xuICAgICAgICBpZiAoaXMuYXJyYXkoYykpIHtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gYztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUoYykpIHtcbiAgICAgICAgICAgIHRleHQgPSBjO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgJiYgYy5zZWwpIHtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gW2NdO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKGIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAoaXMuYXJyYXkoYikpIHtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gYjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUoYikpIHtcbiAgICAgICAgICAgIHRleHQgPSBiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGIgJiYgYi5zZWwpIHtcbiAgICAgICAgICAgIGNoaWxkcmVuID0gW2JdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGF0YSA9IGI7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGNoaWxkcmVuICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoaXMucHJpbWl0aXZlKGNoaWxkcmVuW2ldKSlcbiAgICAgICAgICAgICAgICBjaGlsZHJlbltpXSA9IHZub2RlXzEudm5vZGUodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY2hpbGRyZW5baV0sIHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHNlbFswXSA9PT0gJ3MnICYmIHNlbFsxXSA9PT0gJ3YnICYmIHNlbFsyXSA9PT0gJ2cnICYmXG4gICAgICAgIChzZWwubGVuZ3RoID09PSAzIHx8IHNlbFszXSA9PT0gJy4nIHx8IHNlbFszXSA9PT0gJyMnKSkge1xuICAgICAgICBhZGROUyhkYXRhLCBjaGlsZHJlbiwgc2VsKTtcbiAgICB9XG4gICAgcmV0dXJuIHZub2RlXzEudm5vZGUoc2VsLCBkYXRhLCBjaGlsZHJlbiwgdGV4dCwgdW5kZWZpbmVkKTtcbn1cbmV4cG9ydHMuaCA9IGg7XG47XG5leHBvcnRzLmRlZmF1bHQgPSBoO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQodGFnTmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xufVxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRleHROb2RlKHRleHQpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dCk7XG59XG5mdW5jdGlvbiBjcmVhdGVDb21tZW50KHRleHQpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCh0ZXh0KTtcbn1cbmZ1bmN0aW9uIGluc2VydEJlZm9yZShwYXJlbnROb2RlLCBuZXdOb2RlLCByZWZlcmVuY2VOb2RlKSB7XG4gICAgcGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUobmV3Tm9kZSwgcmVmZXJlbmNlTm9kZSk7XG59XG5mdW5jdGlvbiByZW1vdmVDaGlsZChub2RlLCBjaGlsZCkge1xuICAgIG5vZGUucmVtb3ZlQ2hpbGQoY2hpbGQpO1xufVxuZnVuY3Rpb24gYXBwZW5kQ2hpbGQobm9kZSwgY2hpbGQpIHtcbiAgICBub2RlLmFwcGVuZENoaWxkKGNoaWxkKTtcbn1cbmZ1bmN0aW9uIHBhcmVudE5vZGUobm9kZSkge1xuICAgIHJldHVybiBub2RlLnBhcmVudE5vZGU7XG59XG5mdW5jdGlvbiBuZXh0U2libGluZyhub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubmV4dFNpYmxpbmc7XG59XG5mdW5jdGlvbiB0YWdOYW1lKGVsbSkge1xuICAgIHJldHVybiBlbG0udGFnTmFtZTtcbn1cbmZ1bmN0aW9uIHNldFRleHRDb250ZW50KG5vZGUsIHRleHQpIHtcbiAgICBub2RlLnRleHRDb250ZW50ID0gdGV4dDtcbn1cbmZ1bmN0aW9uIGdldFRleHRDb250ZW50KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS50ZXh0Q29udGVudDtcbn1cbmZ1bmN0aW9uIGlzRWxlbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDE7XG59XG5mdW5jdGlvbiBpc1RleHQobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAzO1xufVxuZnVuY3Rpb24gaXNDb21tZW50KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gODtcbn1cbmV4cG9ydHMuaHRtbERvbUFwaSA9IHtcbiAgICBjcmVhdGVFbGVtZW50OiBjcmVhdGVFbGVtZW50LFxuICAgIGNyZWF0ZUVsZW1lbnROUzogY3JlYXRlRWxlbWVudE5TLFxuICAgIGNyZWF0ZVRleHROb2RlOiBjcmVhdGVUZXh0Tm9kZSxcbiAgICBjcmVhdGVDb21tZW50OiBjcmVhdGVDb21tZW50LFxuICAgIGluc2VydEJlZm9yZTogaW5zZXJ0QmVmb3JlLFxuICAgIHJlbW92ZUNoaWxkOiByZW1vdmVDaGlsZCxcbiAgICBhcHBlbmRDaGlsZDogYXBwZW5kQ2hpbGQsXG4gICAgcGFyZW50Tm9kZTogcGFyZW50Tm9kZSxcbiAgICBuZXh0U2libGluZzogbmV4dFNpYmxpbmcsXG4gICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICBzZXRUZXh0Q29udGVudDogc2V0VGV4dENvbnRlbnQsXG4gICAgZ2V0VGV4dENvbnRlbnQ6IGdldFRleHRDb250ZW50LFxuICAgIGlzRWxlbWVudDogaXNFbGVtZW50LFxuICAgIGlzVGV4dDogaXNUZXh0LFxuICAgIGlzQ29tbWVudDogaXNDb21tZW50LFxufTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuaHRtbERvbUFwaTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWh0bWxkb21hcGkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmFycmF5ID0gQXJyYXkuaXNBcnJheTtcbmZ1bmN0aW9uIHByaW1pdGl2ZShzKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBzID09PSAnc3RyaW5nJyB8fCB0eXBlb2YgcyA9PT0gJ251bWJlcic7XG59XG5leHBvcnRzLnByaW1pdGl2ZSA9IHByaW1pdGl2ZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWlzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhsaW5rTlMgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayc7XG52YXIgeG1sTlMgPSAnaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlJztcbnZhciBjb2xvbkNoYXIgPSA1ODtcbnZhciB4Q2hhciA9IDEyMDtcbmZ1bmN0aW9uIHVwZGF0ZUF0dHJzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBrZXksIGVsbSA9IHZub2RlLmVsbSwgb2xkQXR0cnMgPSBvbGRWbm9kZS5kYXRhLmF0dHJzLCBhdHRycyA9IHZub2RlLmRhdGEuYXR0cnM7XG4gICAgaWYgKCFvbGRBdHRycyAmJiAhYXR0cnMpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkQXR0cnMgPT09IGF0dHJzKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkQXR0cnMgPSBvbGRBdHRycyB8fCB7fTtcbiAgICBhdHRycyA9IGF0dHJzIHx8IHt9O1xuICAgIC8vIHVwZGF0ZSBtb2RpZmllZCBhdHRyaWJ1dGVzLCBhZGQgbmV3IGF0dHJpYnV0ZXNcbiAgICBmb3IgKGtleSBpbiBhdHRycykge1xuICAgICAgICB2YXIgY3VyID0gYXR0cnNba2V5XTtcbiAgICAgICAgdmFyIG9sZCA9IG9sZEF0dHJzW2tleV07XG4gICAgICAgIGlmIChvbGQgIT09IGN1cikge1xuICAgICAgICAgICAgaWYgKGN1ciA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoa2V5LCBcIlwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGN1ciA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBlbG0ucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5LmNoYXJDb2RlQXQoMCkgIT09IHhDaGFyKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoa2V5LCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXkuY2hhckNvZGVBdCgzKSA9PT0gY29sb25DaGFyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFzc3VtZSB4bWwgbmFtZXNwYWNlXG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGVOUyh4bWxOUywga2V5LCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChrZXkuY2hhckNvZGVBdCg1KSA9PT0gY29sb25DaGFyKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEFzc3VtZSB4bGluayBuYW1lc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZU5TKHhsaW5rTlMsIGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoa2V5LCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyByZW1vdmUgcmVtb3ZlZCBhdHRyaWJ1dGVzXG4gICAgLy8gdXNlIGBpbmAgb3BlcmF0b3Igc2luY2UgdGhlIHByZXZpb3VzIGBmb3JgIGl0ZXJhdGlvbiB1c2VzIGl0ICguaS5lLiBhZGQgZXZlbiBhdHRyaWJ1dGVzIHdpdGggdW5kZWZpbmVkIHZhbHVlKVxuICAgIC8vIHRoZSBvdGhlciBvcHRpb24gaXMgdG8gcmVtb3ZlIGFsbCBhdHRyaWJ1dGVzIHdpdGggdmFsdWUgPT0gdW5kZWZpbmVkXG4gICAgZm9yIChrZXkgaW4gb2xkQXR0cnMpIHtcbiAgICAgICAgaWYgKCEoa2V5IGluIGF0dHJzKSkge1xuICAgICAgICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5hdHRyaWJ1dGVzTW9kdWxlID0geyBjcmVhdGU6IHVwZGF0ZUF0dHJzLCB1cGRhdGU6IHVwZGF0ZUF0dHJzIH07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmF0dHJpYnV0ZXNNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hdHRyaWJ1dGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gdXBkYXRlQ2xhc3Mob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGN1ciwgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBvbGRDbGFzcyA9IG9sZFZub2RlLmRhdGEuY2xhc3MsIGtsYXNzID0gdm5vZGUuZGF0YS5jbGFzcztcbiAgICBpZiAoIW9sZENsYXNzICYmICFrbGFzcylcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRDbGFzcyA9PT0ga2xhc3MpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRDbGFzcyA9IG9sZENsYXNzIHx8IHt9O1xuICAgIGtsYXNzID0ga2xhc3MgfHwge307XG4gICAgZm9yIChuYW1lIGluIG9sZENsYXNzKSB7XG4gICAgICAgIGlmICgha2xhc3NbbmFtZV0pIHtcbiAgICAgICAgICAgIGVsbS5jbGFzc0xpc3QucmVtb3ZlKG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAobmFtZSBpbiBrbGFzcykge1xuICAgICAgICBjdXIgPSBrbGFzc1tuYW1lXTtcbiAgICAgICAgaWYgKGN1ciAhPT0gb2xkQ2xhc3NbbmFtZV0pIHtcbiAgICAgICAgICAgIGVsbS5jbGFzc0xpc3RbY3VyID8gJ2FkZCcgOiAncmVtb3ZlJ10obmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmNsYXNzTW9kdWxlID0geyBjcmVhdGU6IHVwZGF0ZUNsYXNzLCB1cGRhdGU6IHVwZGF0ZUNsYXNzIH07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmNsYXNzTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2xhc3MuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgQ0FQU19SRUdFWCA9IC9bQS1aXS9nO1xuZnVuY3Rpb24gdXBkYXRlRGF0YXNldChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIgZWxtID0gdm5vZGUuZWxtLCBvbGREYXRhc2V0ID0gb2xkVm5vZGUuZGF0YS5kYXRhc2V0LCBkYXRhc2V0ID0gdm5vZGUuZGF0YS5kYXRhc2V0LCBrZXk7XG4gICAgaWYgKCFvbGREYXRhc2V0ICYmICFkYXRhc2V0KVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZERhdGFzZXQgPT09IGRhdGFzZXQpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGREYXRhc2V0ID0gb2xkRGF0YXNldCB8fCB7fTtcbiAgICBkYXRhc2V0ID0gZGF0YXNldCB8fCB7fTtcbiAgICB2YXIgZCA9IGVsbS5kYXRhc2V0O1xuICAgIGZvciAoa2V5IGluIG9sZERhdGFzZXQpIHtcbiAgICAgICAgaWYgKCFkYXRhc2V0W2tleV0pIHtcbiAgICAgICAgICAgIGlmIChkKSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleSBpbiBkKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBkW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS0nICsga2V5LnJlcGxhY2UoQ0FQU19SRUdFWCwgJy0kJicpLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoa2V5IGluIGRhdGFzZXQpIHtcbiAgICAgICAgaWYgKG9sZERhdGFzZXRba2V5XSAhPT0gZGF0YXNldFtrZXldKSB7XG4gICAgICAgICAgICBpZiAoZCkge1xuICAgICAgICAgICAgICAgIGRba2V5XSA9IGRhdGFzZXRba2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGUoJ2RhdGEtJyArIGtleS5yZXBsYWNlKENBUFNfUkVHRVgsICctJCYnKS50b0xvd2VyQ2FzZSgpLCBkYXRhc2V0W2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5kYXRhc2V0TW9kdWxlID0geyBjcmVhdGU6IHVwZGF0ZURhdGFzZXQsIHVwZGF0ZTogdXBkYXRlRGF0YXNldCB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5kYXRhc2V0TW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZGF0YXNldC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIHVwZGF0ZVByb3BzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBrZXksIGN1ciwgb2xkLCBlbG0gPSB2bm9kZS5lbG0sIG9sZFByb3BzID0gb2xkVm5vZGUuZGF0YS5wcm9wcywgcHJvcHMgPSB2bm9kZS5kYXRhLnByb3BzO1xuICAgIGlmICghb2xkUHJvcHMgJiYgIXByb3BzKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZFByb3BzID09PSBwcm9wcylcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZFByb3BzID0gb2xkUHJvcHMgfHwge307XG4gICAgcHJvcHMgPSBwcm9wcyB8fCB7fTtcbiAgICBmb3IgKGtleSBpbiBvbGRQcm9wcykge1xuICAgICAgICBpZiAoIXByb3BzW2tleV0pIHtcbiAgICAgICAgICAgIGRlbGV0ZSBlbG1ba2V5XTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGtleSBpbiBwcm9wcykge1xuICAgICAgICBjdXIgPSBwcm9wc1trZXldO1xuICAgICAgICBvbGQgPSBvbGRQcm9wc1trZXldO1xuICAgICAgICBpZiAob2xkICE9PSBjdXIgJiYgKGtleSAhPT0gJ3ZhbHVlJyB8fCBlbG1ba2V5XSAhPT0gY3VyKSkge1xuICAgICAgICAgICAgZWxtW2tleV0gPSBjdXI7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLnByb3BzTW9kdWxlID0geyBjcmVhdGU6IHVwZGF0ZVByb3BzLCB1cGRhdGU6IHVwZGF0ZVByb3BzIH07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLnByb3BzTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cHJvcHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgcmFmID0gKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpIHx8IHNldFRpbWVvdXQ7XG52YXIgbmV4dEZyYW1lID0gZnVuY3Rpb24gKGZuKSB7IHJhZihmdW5jdGlvbiAoKSB7IHJhZihmbik7IH0pOyB9O1xudmFyIHJlZmxvd0ZvcmNlZCA9IGZhbHNlO1xuZnVuY3Rpb24gc2V0TmV4dEZyYW1lKG9iaiwgcHJvcCwgdmFsKSB7XG4gICAgbmV4dEZyYW1lKGZ1bmN0aW9uICgpIHsgb2JqW3Byb3BdID0gdmFsOyB9KTtcbn1cbmZ1bmN0aW9uIHVwZGF0ZVN0eWxlKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBjdXIsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgb2xkU3R5bGUgPSBvbGRWbm9kZS5kYXRhLnN0eWxlLCBzdHlsZSA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFvbGRTdHlsZSAmJiAhc3R5bGUpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkU3R5bGUgPT09IHN0eWxlKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkU3R5bGUgPSBvbGRTdHlsZSB8fCB7fTtcbiAgICBzdHlsZSA9IHN0eWxlIHx8IHt9O1xuICAgIHZhciBvbGRIYXNEZWwgPSAnZGVsYXllZCcgaW4gb2xkU3R5bGU7XG4gICAgZm9yIChuYW1lIGluIG9sZFN0eWxlKSB7XG4gICAgICAgIGlmICghc3R5bGVbbmFtZV0pIHtcbiAgICAgICAgICAgIGlmIChuYW1lWzBdID09PSAnLScgJiYgbmFtZVsxXSA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlLnJlbW92ZVByb3BlcnR5KG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGN1ciA9IHN0eWxlW25hbWVdO1xuICAgICAgICBpZiAobmFtZSA9PT0gJ2RlbGF5ZWQnICYmIHN0eWxlLmRlbGF5ZWQpIHtcbiAgICAgICAgICAgIGZvciAodmFyIG5hbWUyIGluIHN0eWxlLmRlbGF5ZWQpIHtcbiAgICAgICAgICAgICAgICBjdXIgPSBzdHlsZS5kZWxheWVkW25hbWUyXTtcbiAgICAgICAgICAgICAgICBpZiAoIW9sZEhhc0RlbCB8fCBjdXIgIT09IG9sZFN0eWxlLmRlbGF5ZWRbbmFtZTJdKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldE5leHRGcmFtZShlbG0uc3R5bGUsIG5hbWUyLCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChuYW1lICE9PSAncmVtb3ZlJyAmJiBjdXIgIT09IG9sZFN0eWxlW25hbWVdKSB7XG4gICAgICAgICAgICBpZiAobmFtZVswXSA9PT0gJy0nICYmIG5hbWVbMV0gPT09ICctJykge1xuICAgICAgICAgICAgICAgIGVsbS5zdHlsZS5zZXRQcm9wZXJ0eShuYW1lLCBjdXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gY3VyO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gYXBwbHlEZXN0cm95U3R5bGUodm5vZGUpIHtcbiAgICB2YXIgc3R5bGUsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFzIHx8ICEoc3R5bGUgPSBzLmRlc3Ryb3kpKVxuICAgICAgICByZXR1cm47XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IHN0eWxlW25hbWVdO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFwcGx5UmVtb3ZlU3R5bGUodm5vZGUsIHJtKSB7XG4gICAgdmFyIHMgPSB2bm9kZS5kYXRhLnN0eWxlO1xuICAgIGlmICghcyB8fCAhcy5yZW1vdmUpIHtcbiAgICAgICAgcm0oKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIXJlZmxvd0ZvcmNlZCkge1xuICAgICAgICBnZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHkpLnRyYW5zZm9ybTtcbiAgICAgICAgcmVmbG93Rm9yY2VkID0gdHJ1ZTtcbiAgICB9XG4gICAgdmFyIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgaSA9IDAsIGNvbXBTdHlsZSwgc3R5bGUgPSBzLnJlbW92ZSwgYW1vdW50ID0gMCwgYXBwbGllZCA9IFtdO1xuICAgIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBhcHBsaWVkLnB1c2gobmFtZSk7XG4gICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IHN0eWxlW25hbWVdO1xuICAgIH1cbiAgICBjb21wU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsbSk7XG4gICAgdmFyIHByb3BzID0gY29tcFN0eWxlWyd0cmFuc2l0aW9uLXByb3BlcnR5J10uc3BsaXQoJywgJyk7XG4gICAgZm9yICg7IGkgPCBwcm9wcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoYXBwbGllZC5pbmRleE9mKHByb3BzW2ldKSAhPT0gLTEpXG4gICAgICAgICAgICBhbW91bnQrKztcbiAgICB9XG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgaWYgKGV2LnRhcmdldCA9PT0gZWxtKVxuICAgICAgICAgICAgLS1hbW91bnQ7XG4gICAgICAgIGlmIChhbW91bnQgPT09IDApXG4gICAgICAgICAgICBybSgpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gZm9yY2VSZWZsb3coKSB7XG4gICAgcmVmbG93Rm9yY2VkID0gZmFsc2U7XG59XG5leHBvcnRzLnN0eWxlTW9kdWxlID0ge1xuICAgIHByZTogZm9yY2VSZWZsb3csXG4gICAgY3JlYXRlOiB1cGRhdGVTdHlsZSxcbiAgICB1cGRhdGU6IHVwZGF0ZVN0eWxlLFxuICAgIGRlc3Ryb3k6IGFwcGx5RGVzdHJveVN0eWxlLFxuICAgIHJlbW92ZTogYXBwbHlSZW1vdmVTdHlsZVxufTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuc3R5bGVNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zdHlsZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcIi4vdm5vZGVcIik7XG52YXIgaXMgPSByZXF1aXJlKFwiLi9pc1wiKTtcbnZhciBodG1sZG9tYXBpXzEgPSByZXF1aXJlKFwiLi9odG1sZG9tYXBpXCIpO1xuZnVuY3Rpb24gaXNVbmRlZihzKSB7IHJldHVybiBzID09PSB1bmRlZmluZWQ7IH1cbmZ1bmN0aW9uIGlzRGVmKHMpIHsgcmV0dXJuIHMgIT09IHVuZGVmaW5lZDsgfVxudmFyIGVtcHR5Tm9kZSA9IHZub2RlXzEuZGVmYXVsdCgnJywge30sIFtdLCB1bmRlZmluZWQsIHVuZGVmaW5lZCk7XG5mdW5jdGlvbiBzYW1lVm5vZGUodm5vZGUxLCB2bm9kZTIpIHtcbiAgICByZXR1cm4gdm5vZGUxLmtleSA9PT0gdm5vZGUyLmtleSAmJiB2bm9kZTEuc2VsID09PSB2bm9kZTIuc2VsO1xufVxuZnVuY3Rpb24gaXNWbm9kZSh2bm9kZSkge1xuICAgIHJldHVybiB2bm9kZS5zZWwgIT09IHVuZGVmaW5lZDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUtleVRvT2xkSWR4KGNoaWxkcmVuLCBiZWdpbklkeCwgZW5kSWR4KSB7XG4gICAgdmFyIGksIG1hcCA9IHt9LCBrZXksIGNoO1xuICAgIGZvciAoaSA9IGJlZ2luSWR4OyBpIDw9IGVuZElkeDsgKytpKSB7XG4gICAgICAgIGNoID0gY2hpbGRyZW5baV07XG4gICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICBrZXkgPSBjaC5rZXk7XG4gICAgICAgICAgICBpZiAoa2V5ICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgbWFwW2tleV0gPSBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXA7XG59XG52YXIgaG9va3MgPSBbJ2NyZWF0ZScsICd1cGRhdGUnLCAncmVtb3ZlJywgJ2Rlc3Ryb3knLCAncHJlJywgJ3Bvc3QnXTtcbnZhciBoXzEgPSByZXF1aXJlKFwiLi9oXCIpO1xuZXhwb3J0cy5oID0gaF8xLmg7XG52YXIgdGh1bmtfMSA9IHJlcXVpcmUoXCIuL3RodW5rXCIpO1xuZXhwb3J0cy50aHVuayA9IHRodW5rXzEudGh1bms7XG5mdW5jdGlvbiBpbml0KG1vZHVsZXMsIGRvbUFwaSkge1xuICAgIHZhciBpLCBqLCBjYnMgPSB7fTtcbiAgICB2YXIgYXBpID0gZG9tQXBpICE9PSB1bmRlZmluZWQgPyBkb21BcGkgOiBodG1sZG9tYXBpXzEuZGVmYXVsdDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgaG9va3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgY2JzW2hvb2tzW2ldXSA9IFtdO1xuICAgICAgICBmb3IgKGogPSAwOyBqIDwgbW9kdWxlcy5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgdmFyIGhvb2sgPSBtb2R1bGVzW2pdW2hvb2tzW2ldXTtcbiAgICAgICAgICAgIGlmIChob29rICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjYnNbaG9va3NbaV1dLnB1c2goaG9vayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gZW1wdHlOb2RlQXQoZWxtKSB7XG4gICAgICAgIHZhciBpZCA9IGVsbS5pZCA/ICcjJyArIGVsbS5pZCA6ICcnO1xuICAgICAgICB2YXIgYyA9IGVsbS5jbGFzc05hbWUgPyAnLicgKyBlbG0uY2xhc3NOYW1lLnNwbGl0KCcgJykuam9pbignLicpIDogJyc7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQoYXBpLnRhZ05hbWUoZWxtKS50b0xvd2VyQ2FzZSgpICsgaWQgKyBjLCB7fSwgW10sIHVuZGVmaW5lZCwgZWxtKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY3JlYXRlUm1DYihjaGlsZEVsbSwgbGlzdGVuZXJzKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBybUNiKCkge1xuICAgICAgICAgICAgaWYgKC0tbGlzdGVuZXJzID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcmVudF8xID0gYXBpLnBhcmVudE5vZGUoY2hpbGRFbG0pO1xuICAgICAgICAgICAgICAgIGFwaS5yZW1vdmVDaGlsZChwYXJlbnRfMSwgY2hpbGRFbG0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVFbG0odm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICB2YXIgaSwgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChpc0RlZihpID0gZGF0YS5ob29rKSAmJiBpc0RlZihpID0gaS5pbml0KSkge1xuICAgICAgICAgICAgICAgIGkodm5vZGUpO1xuICAgICAgICAgICAgICAgIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuLCBzZWwgPSB2bm9kZS5zZWw7XG4gICAgICAgIGlmIChzZWwgPT09ICchJykge1xuICAgICAgICAgICAgaWYgKGlzVW5kZWYodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICB2bm9kZS50ZXh0ID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2bm9kZS5lbG0gPSBhcGkuY3JlYXRlQ29tbWVudCh2bm9kZS50ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChzZWwgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gUGFyc2Ugc2VsZWN0b3JcbiAgICAgICAgICAgIHZhciBoYXNoSWR4ID0gc2VsLmluZGV4T2YoJyMnKTtcbiAgICAgICAgICAgIHZhciBkb3RJZHggPSBzZWwuaW5kZXhPZignLicsIGhhc2hJZHgpO1xuICAgICAgICAgICAgdmFyIGhhc2ggPSBoYXNoSWR4ID4gMCA/IGhhc2hJZHggOiBzZWwubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIGRvdCA9IGRvdElkeCA+IDAgPyBkb3RJZHggOiBzZWwubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIHRhZyA9IGhhc2hJZHggIT09IC0xIHx8IGRvdElkeCAhPT0gLTEgPyBzZWwuc2xpY2UoMCwgTWF0aC5taW4oaGFzaCwgZG90KSkgOiBzZWw7XG4gICAgICAgICAgICB2YXIgZWxtID0gdm5vZGUuZWxtID0gaXNEZWYoZGF0YSkgJiYgaXNEZWYoaSA9IGRhdGEubnMpID8gYXBpLmNyZWF0ZUVsZW1lbnROUyhpLCB0YWcpXG4gICAgICAgICAgICAgICAgOiBhcGkuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgICAgICAgICAgaWYgKGhhc2ggPCBkb3QpXG4gICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZSgnaWQnLCBzZWwuc2xpY2UoaGFzaCArIDEsIGRvdCkpO1xuICAgICAgICAgICAgaWYgKGRvdElkeCA+IDApXG4gICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCBzZWwuc2xpY2UoZG90ICsgMSkucmVwbGFjZSgvXFwuL2csICcgJykpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5jcmVhdGUubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgY2JzLmNyZWF0ZVtpXShlbXB0eU5vZGUsIHZub2RlKTtcbiAgICAgICAgICAgIGlmIChpcy5hcnJheShjaGlsZHJlbikpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNoID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBjcmVhdGVFbG0oY2gsIGluc2VydGVkVm5vZGVRdWV1ZSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKHZub2RlLnRleHQpKSB7XG4gICAgICAgICAgICAgICAgYXBpLmFwcGVuZENoaWxkKGVsbSwgYXBpLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGkgPSB2bm9kZS5kYXRhLmhvb2s7IC8vIFJldXNlIHZhcmlhYmxlXG4gICAgICAgICAgICBpZiAoaXNEZWYoaSkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaS5jcmVhdGUpXG4gICAgICAgICAgICAgICAgICAgIGkuY3JlYXRlKGVtcHR5Tm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgICAgIGlmIChpLmluc2VydClcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0ZWRWbm9kZVF1ZXVlLnB1c2godm5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdm5vZGUuZWxtID0gYXBpLmNyZWF0ZVRleHROb2RlKHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2bm9kZS5lbG07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGFkZFZub2RlcyhwYXJlbnRFbG0sIGJlZm9yZSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICAgICAgZm9yICg7IHN0YXJ0SWR4IDw9IGVuZElkeDsgKytzdGFydElkeCkge1xuICAgICAgICAgICAgdmFyIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSwgYmVmb3JlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBpbnZva2VEZXN0cm95SG9vayh2bm9kZSkge1xuICAgICAgICB2YXIgaSwgaiwgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgIGlmIChkYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChpc0RlZihpID0gZGF0YS5ob29rKSAmJiBpc0RlZihpID0gaS5kZXN0cm95KSlcbiAgICAgICAgICAgICAgICBpKHZub2RlKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMuZGVzdHJveS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMuZGVzdHJveVtpXSh2bm9kZSk7XG4gICAgICAgICAgICBpZiAodm5vZGUuY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCB2bm9kZS5jaGlsZHJlbi5sZW5ndGg7ICsraikge1xuICAgICAgICAgICAgICAgICAgICBpID0gdm5vZGUuY2hpbGRyZW5bal07XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICE9IG51bGwgJiYgdHlwZW9mIGkgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGludm9rZURlc3Ryb3lIb29rKGkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIHZub2Rlcywgc3RhcnRJZHgsIGVuZElkeCkge1xuICAgICAgICBmb3IgKDsgc3RhcnRJZHggPD0gZW5kSWR4OyArK3N0YXJ0SWR4KSB7XG4gICAgICAgICAgICB2YXIgaV8xID0gdm9pZCAwLCBsaXN0ZW5lcnMgPSB2b2lkIDAsIHJtID0gdm9pZCAwLCBjaCA9IHZub2Rlc1tzdGFydElkeF07XG4gICAgICAgICAgICBpZiAoY2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChpc0RlZihjaC5zZWwpKSB7XG4gICAgICAgICAgICAgICAgICAgIGludm9rZURlc3Ryb3lIb29rKGNoKTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXJzID0gY2JzLnJlbW92ZS5sZW5ndGggKyAxO1xuICAgICAgICAgICAgICAgICAgICBybSA9IGNyZWF0ZVJtQ2IoY2guZWxtLCBsaXN0ZW5lcnMpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGlfMSA9IDA7IGlfMSA8IGNicy5yZW1vdmUubGVuZ3RoOyArK2lfMSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGNicy5yZW1vdmVbaV8xXShjaCwgcm0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXNEZWYoaV8xID0gY2guZGF0YSkgJiYgaXNEZWYoaV8xID0gaV8xLmhvb2spICYmIGlzRGVmKGlfMSA9IGlfMS5yZW1vdmUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpXzEoY2gsIHJtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJtKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFwaS5yZW1vdmVDaGlsZChwYXJlbnRFbG0sIGNoLmVsbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZUNoaWxkcmVuKHBhcmVudEVsbSwgb2xkQ2gsIG5ld0NoLCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICAgICAgdmFyIG9sZFN0YXJ0SWR4ID0gMCwgbmV3U3RhcnRJZHggPSAwO1xuICAgICAgICB2YXIgb2xkRW5kSWR4ID0gb2xkQ2gubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFswXTtcbiAgICAgICAgdmFyIG9sZEVuZFZub2RlID0gb2xkQ2hbb2xkRW5kSWR4XTtcbiAgICAgICAgdmFyIG5ld0VuZElkeCA9IG5ld0NoLmxlbmd0aCAtIDE7XG4gICAgICAgIHZhciBuZXdTdGFydFZub2RlID0gbmV3Q2hbMF07XG4gICAgICAgIHZhciBuZXdFbmRWbm9kZSA9IG5ld0NoW25ld0VuZElkeF07XG4gICAgICAgIHZhciBvbGRLZXlUb0lkeDtcbiAgICAgICAgdmFyIGlkeEluT2xkO1xuICAgICAgICB2YXIgZWxtVG9Nb3ZlO1xuICAgICAgICB2YXIgYmVmb3JlO1xuICAgICAgICB3aGlsZSAob2xkU3RhcnRJZHggPD0gb2xkRW5kSWR4ICYmIG5ld1N0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgICAgICAgaWYgKG9sZFN0YXJ0Vm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTsgLy8gVm5vZGUgbWlnaHQgaGF2ZSBiZWVuIG1vdmVkIGxlZnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG9sZEVuZFZub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBvbGRFbmRWbm9kZSA9IG9sZENoWy0tb2xkRW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld1N0YXJ0Vm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG5ld0VuZFZub2RlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgICAgICBvbGRTdGFydFZub2RlID0gb2xkQ2hbKytvbGRTdGFydElkeF07XG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdFbmRWbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZEVuZFZub2RlLCBuZXdFbmRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgICAgICBvbGRFbmRWbm9kZSA9IG9sZENoWy0tb2xkRW5kSWR4XTtcbiAgICAgICAgICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRTdGFydFZub2RlLCBuZXdFbmRWbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRTdGFydFZub2RlLmVsbSwgYXBpLm5leHRTaWJsaW5nKG9sZEVuZFZub2RlLmVsbSkpO1xuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICBuZXdFbmRWbm9kZSA9IG5ld0NoWy0tbmV3RW5kSWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHNhbWVWbm9kZShvbGRFbmRWbm9kZSwgbmV3U3RhcnRWbm9kZSkpIHtcbiAgICAgICAgICAgICAgICBwYXRjaFZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBvbGRFbmRWbm9kZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICBvbGRFbmRWbm9kZSA9IG9sZENoWy0tb2xkRW5kSWR4XTtcbiAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkS2V5VG9JZHggPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBvbGRLZXlUb0lkeCA9IGNyZWF0ZUtleVRvT2xkSWR4KG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWR4SW5PbGQgPSBvbGRLZXlUb0lkeFtuZXdTdGFydFZub2RlLmtleV07XG4gICAgICAgICAgICAgICAgaWYgKGlzVW5kZWYoaWR4SW5PbGQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBjcmVhdGVFbG0obmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbG1Ub01vdmUgPSBvbGRDaFtpZHhJbk9sZF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbG1Ub01vdmUuc2VsICE9PSBuZXdTdGFydFZub2RlLnNlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXRjaFZub2RlKGVsbVRvTW92ZSwgbmV3U3RhcnRWbm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZENoW2lkeEluT2xkXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50RWxtLCBlbG1Ub01vdmUuZWxtLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAob2xkU3RhcnRJZHggPD0gb2xkRW5kSWR4IHx8IG5ld1N0YXJ0SWR4IDw9IG5ld0VuZElkeCkge1xuICAgICAgICAgICAgaWYgKG9sZFN0YXJ0SWR4ID4gb2xkRW5kSWR4KSB7XG4gICAgICAgICAgICAgICAgYmVmb3JlID0gbmV3Q2hbbmV3RW5kSWR4ICsgMV0gPT0gbnVsbCA/IG51bGwgOiBuZXdDaFtuZXdFbmRJZHggKyAxXS5lbG07XG4gICAgICAgICAgICAgICAgYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCBuZXdDaCwgbmV3U3RhcnRJZHgsIG5ld0VuZElkeCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnRFbG0sIG9sZENoLCBvbGRTdGFydElkeCwgb2xkRW5kSWR4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBpLCBob29rO1xuICAgICAgICBpZiAoaXNEZWYoaSA9IHZub2RlLmRhdGEpICYmIGlzRGVmKGhvb2sgPSBpLmhvb2spICYmIGlzRGVmKGkgPSBob29rLnByZXBhdGNoKSkge1xuICAgICAgICAgICAgaShvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBvbGRWbm9kZS5lbG07XG4gICAgICAgIHZhciBvbGRDaCA9IG9sZFZub2RlLmNoaWxkcmVuO1xuICAgICAgICB2YXIgY2ggPSB2bm9kZS5jaGlsZHJlbjtcbiAgICAgICAgaWYgKG9sZFZub2RlID09PSB2bm9kZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgaWYgKHZub2RlLmRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy51cGRhdGUubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICAgICAgY2JzLnVwZGF0ZVtpXShvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgaSA9IHZub2RlLmRhdGEuaG9vaztcbiAgICAgICAgICAgIGlmIChpc0RlZihpKSAmJiBpc0RlZihpID0gaS51cGRhdGUpKVxuICAgICAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNVbmRlZih2bm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKG9sZENoKSAmJiBpc0RlZihjaCkpIHtcbiAgICAgICAgICAgICAgICBpZiAob2xkQ2ggIT09IGNoKVxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVDaGlsZHJlbihlbG0sIG9sZENoLCBjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRGVmKGNoKSkge1xuICAgICAgICAgICAgICAgIGlmIChpc0RlZihvbGRWbm9kZS50ZXh0KSlcbiAgICAgICAgICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgJycpO1xuICAgICAgICAgICAgICAgIGFkZFZub2RlcyhlbG0sIG51bGwsIGNoLCAwLCBjaC5sZW5ndGggLSAxLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYob2xkQ2gpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKGVsbSwgb2xkQ2gsIDAsIG9sZENoLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYob2xkVm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2xkVm5vZGUudGV4dCAhPT0gdm5vZGUudGV4dCkge1xuICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgdm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRGVmKGhvb2spICYmIGlzRGVmKGkgPSBob29rLnBvc3RwYXRjaCkpIHtcbiAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gcGF0Y2gob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgICAgIHZhciBpLCBlbG0sIHBhcmVudDtcbiAgICAgICAgdmFyIGluc2VydGVkVm5vZGVRdWV1ZSA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnByZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgIGNicy5wcmVbaV0oKTtcbiAgICAgICAgaWYgKCFpc1Zub2RlKG9sZFZub2RlKSkge1xuICAgICAgICAgICAgb2xkVm5vZGUgPSBlbXB0eU5vZGVBdChvbGRWbm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNhbWVWbm9kZShvbGRWbm9kZSwgdm5vZGUpKSB7XG4gICAgICAgICAgICBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsbSA9IG9sZFZub2RlLmVsbTtcbiAgICAgICAgICAgIHBhcmVudCA9IGFwaS5wYXJlbnROb2RlKGVsbSk7XG4gICAgICAgICAgICBjcmVhdGVFbG0odm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICBpZiAocGFyZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnQsIHZub2RlLmVsbSwgYXBpLm5leHRTaWJsaW5nKGVsbSkpO1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnQsIFtvbGRWbm9kZV0sIDAsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbnNlcnRlZFZub2RlUXVldWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGluc2VydGVkVm5vZGVRdWV1ZVtpXS5kYXRhLmhvb2suaW5zZXJ0KGluc2VydGVkVm5vZGVRdWV1ZVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5wb3N0Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgY2JzLnBvc3RbaV0oKTtcbiAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgIH07XG59XG5leHBvcnRzLmluaXQgPSBpbml0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c25hYmJkb20uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgaF8xID0gcmVxdWlyZShcIi4vaFwiKTtcbmZ1bmN0aW9uIGNvcHlUb1RodW5rKHZub2RlLCB0aHVuaykge1xuICAgIHRodW5rLmVsbSA9IHZub2RlLmVsbTtcbiAgICB2bm9kZS5kYXRhLmZuID0gdGh1bmsuZGF0YS5mbjtcbiAgICB2bm9kZS5kYXRhLmFyZ3MgPSB0aHVuay5kYXRhLmFyZ3M7XG4gICAgdGh1bmsuZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgdGh1bmsuY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcbiAgICB0aHVuay50ZXh0ID0gdm5vZGUudGV4dDtcbiAgICB0aHVuay5lbG0gPSB2bm9kZS5lbG07XG59XG5mdW5jdGlvbiBpbml0KHRodW5rKSB7XG4gICAgdmFyIGN1ciA9IHRodW5rLmRhdGE7XG4gICAgdmFyIHZub2RlID0gY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgY3VyLmFyZ3MpO1xuICAgIGNvcHlUb1RodW5rKHZub2RlLCB0aHVuayk7XG59XG5mdW5jdGlvbiBwcmVwYXRjaChvbGRWbm9kZSwgdGh1bmspIHtcbiAgICB2YXIgaSwgb2xkID0gb2xkVm5vZGUuZGF0YSwgY3VyID0gdGh1bmsuZGF0YTtcbiAgICB2YXIgb2xkQXJncyA9IG9sZC5hcmdzLCBhcmdzID0gY3VyLmFyZ3M7XG4gICAgaWYgKG9sZC5mbiAhPT0gY3VyLmZuIHx8IG9sZEFyZ3MubGVuZ3RoICE9PSBhcmdzLmxlbmd0aCkge1xuICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmspO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChvbGRBcmdzW2ldICE9PSBhcmdzW2ldKSB7XG4gICAgICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmspO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvcHlUb1RodW5rKG9sZFZub2RlLCB0aHVuayk7XG59XG5leHBvcnRzLnRodW5rID0gZnVuY3Rpb24gdGh1bmsoc2VsLCBrZXksIGZuLCBhcmdzKSB7XG4gICAgaWYgKGFyZ3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhcmdzID0gZm47XG4gICAgICAgIGZuID0ga2V5O1xuICAgICAgICBrZXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBoXzEuaChzZWwsIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIGhvb2s6IHsgaW5pdDogaW5pdCwgcHJlcGF0Y2g6IHByZXBhdGNoIH0sXG4gICAgICAgIGZuOiBmbixcbiAgICAgICAgYXJnczogYXJnc1xuICAgIH0pO1xufTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMudGh1bms7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10aHVuay5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcIi4vdm5vZGVcIik7XG52YXIgaHRtbGRvbWFwaV8xID0gcmVxdWlyZShcIi4vaHRtbGRvbWFwaVwiKTtcbmZ1bmN0aW9uIHRvVk5vZGUobm9kZSwgZG9tQXBpKSB7XG4gICAgdmFyIGFwaSA9IGRvbUFwaSAhPT0gdW5kZWZpbmVkID8gZG9tQXBpIDogaHRtbGRvbWFwaV8xLmRlZmF1bHQ7XG4gICAgdmFyIHRleHQ7XG4gICAgaWYgKGFwaS5pc0VsZW1lbnQobm9kZSkpIHtcbiAgICAgICAgdmFyIGlkID0gbm9kZS5pZCA/ICcjJyArIG5vZGUuaWQgOiAnJztcbiAgICAgICAgdmFyIGNuID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2NsYXNzJyk7XG4gICAgICAgIHZhciBjID0gY24gPyAnLicgKyBjbi5zcGxpdCgnICcpLmpvaW4oJy4nKSA6ICcnO1xuICAgICAgICB2YXIgc2VsID0gYXBpLnRhZ05hbWUobm9kZSkudG9Mb3dlckNhc2UoKSArIGlkICsgYztcbiAgICAgICAgdmFyIGF0dHJzID0ge307XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IFtdO1xuICAgICAgICB2YXIgbmFtZV8xO1xuICAgICAgICB2YXIgaSA9IHZvaWQgMCwgbiA9IHZvaWQgMDtcbiAgICAgICAgdmFyIGVsbUF0dHJzID0gbm9kZS5hdHRyaWJ1dGVzO1xuICAgICAgICB2YXIgZWxtQ2hpbGRyZW4gPSBub2RlLmNoaWxkTm9kZXM7XG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBlbG1BdHRycy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIG5hbWVfMSA9IGVsbUF0dHJzW2ldLm5vZGVOYW1lO1xuICAgICAgICAgICAgaWYgKG5hbWVfMSAhPT0gJ2lkJyAmJiBuYW1lXzEgIT09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgICBhdHRyc1tuYW1lXzFdID0gZWxtQXR0cnNbaV0ubm9kZVZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBlbG1DaGlsZHJlbi5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2godG9WTm9kZShlbG1DaGlsZHJlbltpXSwgZG9tQXBpKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdChzZWwsIHsgYXR0cnM6IGF0dHJzIH0sIGNoaWxkcmVuLCB1bmRlZmluZWQsIG5vZGUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChhcGkuaXNUZXh0KG5vZGUpKSB7XG4gICAgICAgIHRleHQgPSBhcGkuZ2V0VGV4dENvbnRlbnQobm9kZSk7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdGV4dCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGFwaS5pc0NvbW1lbnQobm9kZSkpIHtcbiAgICAgICAgdGV4dCA9IGFwaS5nZXRUZXh0Q29udGVudChub2RlKTtcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdCgnIScsIHt9LCBbXSwgdGV4dCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgbm9kZSk7XG4gICAgfVxufVxuZXhwb3J0cy50b1ZOb2RlID0gdG9WTm9kZTtcbmV4cG9ydHMuZGVmYXVsdCA9IHRvVk5vZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10b3Zub2RlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gdm5vZGUoc2VsLCBkYXRhLCBjaGlsZHJlbiwgdGV4dCwgZWxtKSB7XG4gICAgdmFyIGtleSA9IGRhdGEgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGRhdGEua2V5O1xuICAgIHJldHVybiB7IHNlbDogc2VsLCBkYXRhOiBkYXRhLCBjaGlsZHJlbjogY2hpbGRyZW4sXG4gICAgICAgIHRleHQ6IHRleHQsIGVsbTogZWxtLCBrZXk6IGtleSB9O1xufVxuZXhwb3J0cy52bm9kZSA9IHZub2RlO1xuZXhwb3J0cy5kZWZhdWx0ID0gdm5vZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12bm9kZS5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfcG9ueWZpbGwgPSByZXF1aXJlKCcuL3BvbnlmaWxsLmpzJyk7XG5cbnZhciBfcG9ueWZpbGwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcG9ueWZpbGwpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciByb290OyAvKiBnbG9iYWwgd2luZG93ICovXG5cblxuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gc2VsZjtcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IG1vZHVsZTtcbn0gZWxzZSB7XG4gIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxuXG52YXIgcmVzdWx0ID0gKDAsIF9wb255ZmlsbDJbJ2RlZmF1bHQnXSkocm9vdCk7XG5leHBvcnRzWydkZWZhdWx0J10gPSByZXN1bHQ7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1snZGVmYXVsdCddID0gc3ltYm9sT2JzZXJ2YWJsZVBvbnlmaWxsO1xuZnVuY3Rpb24gc3ltYm9sT2JzZXJ2YWJsZVBvbnlmaWxsKHJvb3QpIHtcblx0dmFyIHJlc3VsdDtcblx0dmFyIF9TeW1ib2wgPSByb290LlN5bWJvbDtcblxuXHRpZiAodHlwZW9mIF9TeW1ib2wgPT09ICdmdW5jdGlvbicpIHtcblx0XHRpZiAoX1N5bWJvbC5vYnNlcnZhYmxlKSB7XG5cdFx0XHRyZXN1bHQgPSBfU3ltYm9sLm9ic2VydmFibGU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2woJ29ic2VydmFibGUnKTtcblx0XHRcdF9TeW1ib2wub2JzZXJ2YWJsZSA9IHJlc3VsdDtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmVzdWx0ID0gJ0BAb2JzZXJ2YWJsZSc7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCJ2YXIgbmV4dFRpY2sgPSByZXF1aXJlKCdwcm9jZXNzL2Jyb3dzZXIuanMnKS5uZXh0VGljaztcbnZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBpbW1lZGlhdGVJZHMgPSB7fTtcbnZhciBuZXh0SW1tZWRpYXRlSWQgPSAwO1xuXG4vLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5leHBvcnRzLnNldFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xufTtcbmV4cG9ydHMuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG59O1xuZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkgeyB0aW1lb3V0LmNsb3NlKCk7IH07XG5cbmZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcbiAgdGhpcy5faWQgPSBpZDtcbiAgdGhpcy5fY2xlYXJGbiA9IGNsZWFyRm47XG59XG5UaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5UaW1lb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG59O1xuXG4vLyBEb2VzIG5vdCBzdGFydCB0aGUgdGltZSwganVzdCBzZXRzIHVwIHRoZSBtZW1iZXJzIG5lZWRlZC5cbmV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IG1zZWNzO1xufTtcblxuZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xufTtcblxuZXhwb3J0cy5fdW5yZWZBY3RpdmUgPSBleHBvcnRzLmFjdGl2ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG4gIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuICBpZiAobXNlY3MgPj0gMCkge1xuICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcbiAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG4gICAgICAgIGl0ZW0uX29uVGltZW91dCgpO1xuICAgIH0sIG1zZWNzKTtcbiAgfVxufTtcblxuLy8gVGhhdCdzIG5vdCBob3cgbm9kZS5qcyBpbXBsZW1lbnRzIGl0IGJ1dCB0aGUgZXhwb3NlZCBhcGkgaXMgdGhlIHNhbWUuXG5leHBvcnRzLnNldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHNldEltbWVkaWF0ZSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHZhciBpZCA9IG5leHRJbW1lZGlhdGVJZCsrO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGggPCAyID8gZmFsc2UgOiBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgaW1tZWRpYXRlSWRzW2lkXSA9IHRydWU7XG5cbiAgbmV4dFRpY2soZnVuY3Rpb24gb25OZXh0VGljaygpIHtcbiAgICBpZiAoaW1tZWRpYXRlSWRzW2lkXSkge1xuICAgICAgLy8gZm4uY2FsbCgpIGlzIGZhc3RlciBzbyB3ZSBvcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiB1c2UtY2FzZVxuICAgICAgLy8gQHNlZSBodHRwOi8vanNwZXJmLmNvbS9jYWxsLWFwcGx5LXNlZ3VcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm4uY2FsbChudWxsKTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZlbnQgaWRzIGZyb20gbGVha2luZ1xuICAgICAgZXhwb3J0cy5jbGVhckltbWVkaWF0ZShpZCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaWQ7XG59O1xuXG5leHBvcnRzLmNsZWFySW1tZWRpYXRlID0gdHlwZW9mIGNsZWFySW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBjbGVhckltbWVkaWF0ZSA6IGZ1bmN0aW9uKGlkKSB7XG4gIGRlbGV0ZSBpbW1lZGlhdGVJZHNbaWRdO1xufTsiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIF9fZXhwb3J0KG0pIHtcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmICghZXhwb3J0cy5oYXNPd25Qcm9wZXJ0eShwKSkgZXhwb3J0c1twXSA9IG1bcF07XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zZWxlY3RvclBhcnNlclwiKSk7XG52YXIgbWF0Y2hlc18xID0gcmVxdWlyZShcIi4vbWF0Y2hlc1wiKTtcbmV4cG9ydHMuY3JlYXRlTWF0Y2hlcyA9IG1hdGNoZXNfMS5jcmVhdGVNYXRjaGVzO1xudmFyIHF1ZXJ5U2VsZWN0b3JfMSA9IHJlcXVpcmUoXCIuL3F1ZXJ5U2VsZWN0b3JcIik7XG5leHBvcnRzLmNyZWF0ZVF1ZXJ5U2VsZWN0b3IgPSBxdWVyeVNlbGVjdG9yXzEuY3JlYXRlUXVlcnlTZWxlY3Rvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHNlbGVjdG9yUGFyc2VyXzEgPSByZXF1aXJlKFwiLi9zZWxlY3RvclBhcnNlclwiKTtcbmZ1bmN0aW9uIGNyZWF0ZU1hdGNoZXMob3B0cykge1xuICAgIHJldHVybiBmdW5jdGlvbiBtYXRjaGVzKHNlbGVjdG9yLCBub2RlKSB7XG4gICAgICAgIHZhciBfYSA9IHR5cGVvZiBzZWxlY3RvciA9PT0gJ29iamVjdCcgPyBzZWxlY3RvciA6IHNlbGVjdG9yUGFyc2VyXzEucGFyc2VTZWxlY3RvcihzZWxlY3RvciksIHRhZyA9IF9hLnRhZywgaWQgPSBfYS5pZCwgY2xhc3NMaXN0ID0gX2EuY2xhc3NMaXN0LCBhdHRyaWJ1dGVzID0gX2EuYXR0cmlidXRlcywgbmV4dFNlbGVjdG9yID0gX2EubmV4dFNlbGVjdG9yLCBwc2V1ZG9zID0gX2EucHNldWRvcztcbiAgICAgICAgaWYgKG5leHRTZWxlY3RvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hdGNoZXMgY2FuIG9ubHkgcHJvY2VzcyBzZWxlY3RvcnMgdGhhdCB0YXJnZXQgYSBzaW5nbGUgZWxlbWVudCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0YWcgJiYgdGFnLnRvTG93ZXJDYXNlKCkgIT09IG9wdHMudGFnKG5vZGUpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaWQgJiYgaWQgIT09IG9wdHMuaWQobm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2xhc3NlcyA9IG9wdHMuY2xhc3NOYW1lKG5vZGUpLnNwbGl0KCcgJyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3NMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoY2xhc3Nlcy5pbmRleE9mKGNsYXNzTGlzdFtpXSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICB2YXIgYXR0ciA9IG9wdHMuYXR0cihub2RlLCBrZXkpO1xuICAgICAgICAgICAgdmFyIHQgPSBhdHRyaWJ1dGVzW2tleV1bMF07XG4gICAgICAgICAgICB2YXIgdiA9IGF0dHJpYnV0ZXNba2V5XVsxXTtcbiAgICAgICAgICAgIGlmIChhdHRyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodCA9PT0gJ2hhcycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ID09PSAnZXhhY3QnICYmIGF0dHIgIT09IHYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0ICE9PSAnZXhhY3QnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FsbCBub24tc3RyaW5nIHZhbHVlcyBoYXZlIHRvIGJlIGFuIGV4YWN0IG1hdGNoJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnc3RhcnRzV2l0aCcgJiYgIWF0dHIuc3RhcnRzV2l0aCh2KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnZW5kc1dpdGgnICYmICFhdHRyLmVuZHNXaXRoKHYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdjb250YWlucycgJiYgYXR0ci5pbmRleE9mKHYpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnd2hpdGVzcGFjZScgJiYgYXR0ci5zcGxpdCgnICcpLmluZGV4T2YodikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdkYXNoJyAmJiBhdHRyLnNwbGl0KCctJykuaW5kZXhPZih2KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBzZXVkb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBfYiA9IHBzZXVkb3NbaV0sIHQgPSBfYlswXSwgZGF0YSA9IF9iWzFdO1xuICAgICAgICAgICAgaWYgKHQgPT09ICdjb250YWlucycgJiYgZGF0YSAhPT0gb3B0cy5jb250ZW50cyhub2RlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ID09PSAnZW1wdHknICYmXG4gICAgICAgICAgICAgICAgKG9wdHMuY29udGVudHMobm9kZSkgfHwgb3B0cy5jaGlsZHJlbihub2RlKS5sZW5ndGggIT09IDApKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQgPT09ICdyb290JyAmJiBvcHRzLnBhcmVudChub2RlKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQuaW5kZXhPZignY2hpbGQnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdHMucGFyZW50KG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNpYmxpbmdzID0gb3B0cy5jaGlsZHJlbihvcHRzLnBhcmVudChub2RlKSk7XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdmaXJzdC1jaGlsZCcgJiYgc2libGluZ3MuaW5kZXhPZihub2RlKSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnbGFzdC1jaGlsZCcgJiZcbiAgICAgICAgICAgICAgICAgICAgc2libGluZ3MuaW5kZXhPZihub2RlKSAhPT0gc2libGluZ3MubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnbnRoLWNoaWxkJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnZXggPSAvKFtcXCstXT8pKFxcZCopKG4/KShcXCtcXGQrKT8vO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyc2VSZXN1bHQgPSByZWdleC5leGVjKGRhdGEpLnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBzaWJsaW5ncy5pbmRleE9mKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcnNlUmVzdWx0WzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVJlc3VsdFswXSA9ICcrJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgZmFjdG9yID0gcGFyc2VSZXN1bHRbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgID8gcGFyc2VJbnQocGFyc2VSZXN1bHRbMF0gKyBwYXJzZVJlc3VsdFsxXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWRkID0gcGFyc2VJbnQocGFyc2VSZXN1bHRbM10gfHwgJzAnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZhY3RvciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VSZXN1bHRbMl0gPT09ICduJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggJSBmYWN0b3IgIT09IGFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFmYWN0b3IgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUmVzdWx0WzJdICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoKHBhcnNlUmVzdWx0WzBdID09PSAnKycgJiYgaW5kZXggLSBhZGQgPCAwKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXJzZVJlc3VsdFswXSA9PT0gJy0nICYmIGluZGV4IC0gYWRkID49IDApKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFwYXJzZVJlc3VsdFsyXSAmJiBmYWN0b3IgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICE9PSBmYWN0b3IgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbn1cbmV4cG9ydHMuY3JlYXRlTWF0Y2hlcyA9IGNyZWF0ZU1hdGNoZXM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYXRjaGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHNlbGVjdG9yUGFyc2VyXzEgPSByZXF1aXJlKFwiLi9zZWxlY3RvclBhcnNlclwiKTtcbnZhciBtYXRjaGVzXzEgPSByZXF1aXJlKFwiLi9tYXRjaGVzXCIpO1xuZnVuY3Rpb24gY3JlYXRlUXVlcnlTZWxlY3RvcihvcHRpb25zLCBtYXRjaGVzKSB7XG4gICAgdmFyIF9tYXRjaGVzID0gbWF0Y2hlcyB8fCBtYXRjaGVzXzEuY3JlYXRlTWF0Y2hlcyhvcHRpb25zKTtcbiAgICBmdW5jdGlvbiBmaW5kU3VidHJlZShzZWxlY3RvciwgZGVwdGgsIG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG4gPSBfbWF0Y2hlcyhzZWxlY3Rvciwgbm9kZSk7XG4gICAgICAgIHZhciBtYXRjaGVkID0gbiA/ICh0eXBlb2YgbiA9PT0gJ29iamVjdCcgPyBbbl0gOiBbbm9kZV0pIDogW107XG4gICAgICAgIGlmIChkZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoaWxkTWF0Y2hlZCA9IG9wdGlvbnNcbiAgICAgICAgICAgIC5jaGlsZHJlbihub2RlKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gdHlwZW9mIGMgIT09ICdzdHJpbmcnOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gZmluZFN1YnRyZWUoc2VsZWN0b3IsIGRlcHRoIC0gMSwgYyk7IH0pXG4gICAgICAgICAgICAucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGN1cnIpIHsgcmV0dXJuIGFjYy5jb25jYXQoY3Vycik7IH0sIFtdKTtcbiAgICAgICAgcmV0dXJuIG1hdGNoZWQuY29uY2F0KGNoaWxkTWF0Y2hlZCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZpbmRTaWJsaW5nKHNlbGVjdG9yLCBuZXh0LCBub2RlKSB7XG4gICAgICAgIGlmICghbm9kZSB8fCBvcHRpb25zLnBhcmVudChub2RlKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgdmFyIHNpYmxpbmdzID0gb3B0aW9ucy5jaGlsZHJlbihvcHRpb25zLnBhcmVudChub2RlKSk7XG4gICAgICAgIGZvciAodmFyIGkgPSBzaWJsaW5ncy5pbmRleE9mKG5vZGUpICsgMTsgaSA8IHNpYmxpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNpYmxpbmdzW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG4gPSBfbWF0Y2hlcyhzZWxlY3Rvciwgc2libGluZ3NbaV0pO1xuICAgICAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG4gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChzaWJsaW5nc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IsIG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNlbCA9IHR5cGVvZiBzZWxlY3RvciA9PT0gJ29iamVjdCcgPyBzZWxlY3RvciA6IHNlbGVjdG9yUGFyc2VyXzEucGFyc2VTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgIHZhciByZXN1bHRzID0gW25vZGVdO1xuICAgICAgICB2YXIgY3VycmVudFNlbGVjdG9yID0gc2VsO1xuICAgICAgICB2YXIgY3VycmVudENvbWJpbmF0b3IgPSAnc3VidHJlZSc7XG4gICAgICAgIHZhciB0YWlsID0gdW5kZWZpbmVkO1xuICAgICAgICB2YXIgX2xvb3BfMSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRhaWwgPSBjdXJyZW50U2VsZWN0b3IubmV4dFNlbGVjdG9yO1xuICAgICAgICAgICAgY3VycmVudFNlbGVjdG9yLm5leHRTZWxlY3RvciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Q29tYmluYXRvciA9PT0gJ3N1YnRyZWUnIHx8XG4gICAgICAgICAgICAgICAgY3VycmVudENvbWJpbmF0b3IgPT09ICdjaGlsZCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVwdGhfMSA9IGN1cnJlbnRDb21iaW5hdG9yID09PSAnc3VidHJlZScgPyBJbmZpbml0eSA6IDE7XG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobikgeyByZXR1cm4gZmluZFN1YnRyZWUoY3VycmVudFNlbGVjdG9yLCBkZXB0aF8xLCBuKTsgfSlcbiAgICAgICAgICAgICAgICAgICAgLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBjdXJyKSB7IHJldHVybiBhY2MuY29uY2F0KGN1cnIpOyB9LCBbXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dF8xID0gY3VycmVudENvbWJpbmF0b3IgPT09ICduZXh0U2libGluZyc7XG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobikgeyByZXR1cm4gZmluZFNpYmxpbmcoY3VycmVudFNlbGVjdG9yLCBuZXh0XzEsIG4pOyB9KVxuICAgICAgICAgICAgICAgICAgICAucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGN1cnIpIHsgcmV0dXJuIGFjYy5jb25jYXQoY3Vycik7IH0sIFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0YWlsKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFNlbGVjdG9yID0gdGFpbFsxXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29tYmluYXRvciA9IHRhaWxbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIF9sb29wXzEoKTtcbiAgICAgICAgfSB3aGlsZSAodGFpbCAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcbn1cbmV4cG9ydHMuY3JlYXRlUXVlcnlTZWxlY3RvciA9IGNyZWF0ZVF1ZXJ5U2VsZWN0b3I7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1xdWVyeVNlbGVjdG9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgSURFTlQgPSAnW1xcXFx3LV0rJztcbnZhciBTUEFDRSA9ICdbIFxcdF0qJztcbnZhciBWQUxVRSA9IFwiW15cXFxcXV0rXCI7XG52YXIgQ0xBU1MgPSBcIig/OlxcXFwuXCIgKyBJREVOVCArIFwiKVwiO1xudmFyIElEID0gXCIoPzojXCIgKyBJREVOVCArIFwiKVwiO1xudmFyIE9QID0gXCIoPzo9fFxcXFwkPXxcXFxcXj18XFxcXCo9fH49fFxcXFx8PSlcIjtcbnZhciBBVFRSID0gXCIoPzpcXFxcW1wiICsgU1BBQ0UgKyBJREVOVCArIFNQQUNFICsgXCIoPzpcIiArIE9QICsgU1BBQ0UgKyBWQUxVRSArIFNQQUNFICsgXCIpP1xcXFxdKVwiO1xudmFyIFNVQlRSRUUgPSBcIig/OlsgXFx0XSspXCI7XG52YXIgQ0hJTEQgPSBcIig/OlwiICsgU1BBQ0UgKyBcIig+KVwiICsgU1BBQ0UgKyBcIilcIjtcbnZhciBORVhUX1NJQkxJTkcgPSBcIig/OlwiICsgU1BBQ0UgKyBcIihcXFxcKylcIiArIFNQQUNFICsgXCIpXCI7XG52YXIgU0lCTElORyA9IFwiKD86XCIgKyBTUEFDRSArIFwiKH4pXCIgKyBTUEFDRSArIFwiKVwiO1xudmFyIENPTUJJTkFUT1IgPSBcIig/OlwiICsgU1VCVFJFRSArIFwifFwiICsgQ0hJTEQgKyBcInxcIiArIE5FWFRfU0lCTElORyArIFwifFwiICsgU0lCTElORyArIFwiKVwiO1xudmFyIENPTlRBSU5TID0gXCJjb250YWluc1xcXFwoXFxcIlteXFxcIl0qXFxcIlxcXFwpXCI7XG52YXIgRk9STVVMQSA9IFwiKD86ZXZlbnxvZGR8XFxcXGQqKD86LT9uKD86XFxcXCtcXFxcZCspPyk/KVwiO1xudmFyIE5USF9DSElMRCA9IFwibnRoLWNoaWxkXFxcXChcIiArIEZPUk1VTEEgKyBcIlxcXFwpXCI7XG52YXIgUFNFVURPID0gXCI6KD86Zmlyc3QtY2hpbGR8bGFzdC1jaGlsZHxcIiArIE5USF9DSElMRCArIFwifGVtcHR5fHJvb3R8XCIgKyBDT05UQUlOUyArIFwiKVwiO1xudmFyIFRBRyA9IFwiKDo/XCIgKyBJREVOVCArIFwiKT9cIjtcbnZhciBUT0tFTlMgPSBDTEFTUyArIFwifFwiICsgSUQgKyBcInxcIiArIEFUVFIgKyBcInxcIiArIFBTRVVETyArIFwifFwiICsgQ09NQklOQVRPUjtcbnZhciBjb21iaW5hdG9yUmVnZXggPSBuZXcgUmVnRXhwKFwiXlwiICsgQ09NQklOQVRPUiArIFwiJFwiKTtcbi8qKlxuICogUGFyc2VzIGEgY3NzIHNlbGVjdG9yIGludG8gYSBub3JtYWxpemVkIG9iamVjdC5cbiAqIEV4cGVjdHMgYSBzZWxlY3RvciBmb3IgYSBzaW5nbGUgZWxlbWVudCBvbmx5LCBubyBgPmAgb3IgdGhlIGxpa2UhXG4gKi9cbmZ1bmN0aW9uIHBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpIHtcbiAgICB2YXIgc2VsID0gc2VsZWN0b3IudHJpbSgpO1xuICAgIHZhciB0YWdSZWdleCA9IG5ldyBSZWdFeHAoVEFHLCAneScpO1xuICAgIHZhciB0YWcgPSB0YWdSZWdleC5leGVjKHNlbClbMF07XG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChUT0tFTlMsICd5Jyk7XG4gICAgcmVnZXgubGFzdEluZGV4ID0gdGFnUmVnZXgubGFzdEluZGV4O1xuICAgIHZhciBtYXRjaGVzID0gW107XG4gICAgdmFyIG5leHRTZWxlY3RvciA9IHVuZGVmaW5lZDtcbiAgICB2YXIgbGFzdENvbWJpbmF0b3IgPSB1bmRlZmluZWQ7XG4gICAgdmFyIGluZGV4ID0gLTE7XG4gICAgd2hpbGUgKHJlZ2V4Lmxhc3RJbmRleCA8IHNlbC5sZW5ndGgpIHtcbiAgICAgICAgdmFyIG1hdGNoID0gcmVnZXguZXhlYyhzZWwpO1xuICAgICAgICBpZiAoIW1hdGNoICYmIGxhc3RDb21iaW5hdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGFyc2UgZXJyb3IsIGludmFsaWQgc2VsZWN0b3InKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChtYXRjaCAmJiBjb21iaW5hdG9yUmVnZXgudGVzdChtYXRjaFswXSkpIHtcbiAgICAgICAgICAgIHZhciBjb21iID0gY29tYmluYXRvclJlZ2V4LmV4ZWMobWF0Y2hbMF0pWzBdO1xuICAgICAgICAgICAgbGFzdENvbWJpbmF0b3IgPSBjb21iO1xuICAgICAgICAgICAgaW5kZXggPSByZWdleC5sYXN0SW5kZXg7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAobGFzdENvbWJpbmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG5leHRTZWxlY3RvciA9IFtcbiAgICAgICAgICAgICAgICAgICAgZ2V0Q29tYmluYXRvcihsYXN0Q29tYmluYXRvciksXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0b3Ioc2VsLnN1YnN0cmluZyhpbmRleCkpXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1hdGNoZXMucHVzaChtYXRjaFswXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGNsYXNzTGlzdCA9IG1hdGNoZXNcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdGFydHNXaXRoKCcuJyk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3Vic3RyaW5nKDEpOyB9KTtcbiAgICB2YXIgaWRzID0gbWF0Y2hlcy5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3RhcnRzV2l0aCgnIycpOyB9KS5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3Vic3RyaW5nKDEpOyB9KTtcbiAgICBpZiAoaWRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHNlbGVjdG9yLCBvbmx5IG9uZSBpZCBpcyBhbGxvd2VkJyk7XG4gICAgfVxuICAgIHZhciBwb3N0cHJvY2Vzc1JlZ2V4ID0gbmV3IFJlZ0V4cChcIihcIiArIElERU5UICsgXCIpXCIgKyBTUEFDRSArIFwiKFwiICsgT1AgKyBcIik/XCIgKyBTUEFDRSArIFwiKFwiICsgVkFMVUUgKyBcIik/XCIpO1xuICAgIHZhciBhdHRycyA9IG1hdGNoZXNcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdGFydHNXaXRoKCdbJyk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHBvc3Rwcm9jZXNzUmVnZXguZXhlYyhzKS5zbGljZSgxLCA0KTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgdmFyIGF0dHIgPSBfYVswXSwgb3AgPSBfYVsxXSwgdmFsID0gX2FbMl07XG4gICAgICAgIHZhciBfYjtcbiAgICAgICAgcmV0dXJuIChfYiA9IHt9LFxuICAgICAgICAgICAgX2JbYXR0cl0gPSBbZ2V0T3Aob3ApLCB2YWwgPyBwYXJzZUF0dHJWYWx1ZSh2YWwpIDogdmFsXSxcbiAgICAgICAgICAgIF9iKTtcbiAgICB9KVxuICAgICAgICAucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGN1cnIpIHsgcmV0dXJuIChfX2Fzc2lnbih7fSwgYWNjLCBjdXJyKSk7IH0sIHt9KTtcbiAgICB2YXIgcHNldWRvcyA9IG1hdGNoZXNcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdGFydHNXaXRoKCc6Jyk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHBvc3RQcm9jZXNzUHNldWRvcyhzLnN1YnN0cmluZygxKSk7IH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBpZHNbMF0gfHwgJycsXG4gICAgICAgIHRhZzogdGFnLFxuICAgICAgICBjbGFzc0xpc3Q6IGNsYXNzTGlzdCxcbiAgICAgICAgYXR0cmlidXRlczogYXR0cnMsXG4gICAgICAgIG5leHRTZWxlY3RvcjogbmV4dFNlbGVjdG9yLFxuICAgICAgICBwc2V1ZG9zOiBwc2V1ZG9zXG4gICAgfTtcbn1cbmV4cG9ydHMucGFyc2VTZWxlY3RvciA9IHBhcnNlU2VsZWN0b3I7XG5mdW5jdGlvbiBwYXJzZUF0dHJWYWx1ZSh2KSB7XG4gICAgaWYgKHYuc3RhcnRzV2l0aCgnXCInKSkge1xuICAgICAgICByZXR1cm4gdi5zbGljZSgxLCAtMSk7XG4gICAgfVxuICAgIGlmICh2ID09PSBcInRydWVcIikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHYgPT09IFwiZmFsc2VcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBmID0gcGFyc2VGbG9hdCh2KTtcbiAgICBpZiAoaXNOYU4oZikpIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICAgIHJldHVybiBmO1xufVxuZnVuY3Rpb24gcG9zdFByb2Nlc3NQc2V1ZG9zKHNlbCkge1xuICAgIGlmIChzZWwgPT09ICdmaXJzdC1jaGlsZCcgfHxcbiAgICAgICAgc2VsID09PSAnbGFzdC1jaGlsZCcgfHxcbiAgICAgICAgc2VsID09PSAncm9vdCcgfHxcbiAgICAgICAgc2VsID09PSAnZW1wdHknKSB7XG4gICAgICAgIHJldHVybiBbc2VsLCB1bmRlZmluZWRdO1xuICAgIH1cbiAgICBpZiAoc2VsLnN0YXJ0c1dpdGgoJ2NvbnRhaW5zJykpIHtcbiAgICAgICAgdmFyIHRleHQgPSBzZWwuc2xpY2UoMTAsIC0yKTtcbiAgICAgICAgcmV0dXJuIFsnY29udGFpbnMnLCB0ZXh0XTtcbiAgICB9XG4gICAgdmFyIGNvbnRlbnQgPSBzZWwuc2xpY2UoMTAsIC0xKTtcbiAgICBpZiAoY29udGVudCA9PT0gJ2V2ZW4nKSB7XG4gICAgICAgIGNvbnRlbnQgPSAnMm4nO1xuICAgIH1cbiAgICBpZiAoY29udGVudCA9PT0gJ29kZCcpIHtcbiAgICAgICAgY29udGVudCA9ICcybisxJztcbiAgICB9XG4gICAgcmV0dXJuIFsnbnRoLWNoaWxkJywgY29udGVudF07XG59XG5mdW5jdGlvbiBnZXRPcChvcCkge1xuICAgIHN3aXRjaCAob3ApIHtcbiAgICAgICAgY2FzZSAnPSc6XG4gICAgICAgICAgICByZXR1cm4gJ2V4YWN0JztcbiAgICAgICAgY2FzZSAnXj0nOlxuICAgICAgICAgICAgcmV0dXJuICdzdGFydHNXaXRoJztcbiAgICAgICAgY2FzZSAnJD0nOlxuICAgICAgICAgICAgcmV0dXJuICdlbmRzV2l0aCc7XG4gICAgICAgIGNhc2UgJyo9JzpcbiAgICAgICAgICAgIHJldHVybiAnY29udGFpbnMnO1xuICAgICAgICBjYXNlICd+PSc6XG4gICAgICAgICAgICByZXR1cm4gJ3doaXRlc3BhY2UnO1xuICAgICAgICBjYXNlICd8PSc6XG4gICAgICAgICAgICByZXR1cm4gJ2Rhc2gnO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICdoYXMnO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldENvbWJpbmF0b3IoY29tYikge1xuICAgIHN3aXRjaCAoY29tYi50cmltKCkpIHtcbiAgICAgICAgY2FzZSAnPic6XG4gICAgICAgICAgICByZXR1cm4gJ2NoaWxkJztcbiAgICAgICAgY2FzZSAnKyc6XG4gICAgICAgICAgICByZXR1cm4gJ25leHRTaWJsaW5nJztcbiAgICAgICAgY2FzZSAnfic6XG4gICAgICAgICAgICByZXR1cm4gJ3NpYmxpbmcnO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICdzdWJ0cmVlJztcbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZWxlY3RvclBhcnNlci5qcy5tYXAiLCJpbXBvcnQge1N0cmVhbSwgSW50ZXJuYWxQcm9kdWNlciwgSW50ZXJuYWxMaXN0ZW5lciwgT3V0U2VuZGVyfSBmcm9tICcuLi9pbmRleCc7XG5cbmNsYXNzIENvbmNhdFByb2R1Y2VyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnY29uY2F0JztcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+ID0gbnVsbCBhcyBhbnk7XG4gIHByaXZhdGUgaTogbnVtYmVyID0gMDtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgc3RyZWFtczogQXJyYXk8U3RyZWFtPFQ+Pikge1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5zdHJlYW1zW3RoaXMuaV0uX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHN0cmVhbXMgPSB0aGlzLnN0cmVhbXM7XG4gICAgaWYgKHRoaXMuaSA8IHN0cmVhbXMubGVuZ3RoKSB7XG4gICAgICBzdHJlYW1zW3RoaXMuaV0uX3JlbW92ZSh0aGlzKTtcbiAgICB9XG4gICAgdGhpcy5pID0gMDtcbiAgICB0aGlzLm91dCA9IG51bGwgYXMgYW55O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IHN0cmVhbXMgPSB0aGlzLnN0cmVhbXM7XG4gICAgc3RyZWFtc1t0aGlzLmldLl9yZW1vdmUodGhpcyk7XG4gICAgaWYgKCsrdGhpcy5pIDwgc3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgIHN0cmVhbXNbdGhpcy5pXS5fYWRkKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1Ll9jKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHV0cyBvbmUgc3RyZWFtIGFmdGVyIHRoZSBvdGhlci4gKmNvbmNhdCogaXMgYSBmYWN0b3J5IHRoYXQgdGFrZXMgbXVsdGlwbGVcbiAqIHN0cmVhbXMgYXMgYXJndW1lbnRzLCBhbmQgc3RhcnRzIHRoZSBgbisxYC10aCBzdHJlYW0gb25seSB3aGVuIHRoZSBgbmAtdGhcbiAqIHN0cmVhbSBoYXMgY29tcGxldGVkLiBJdCBjb25jYXRlbmF0ZXMgdGhvc2Ugc3RyZWFtcyB0b2dldGhlci5cbiAqXG4gKiBNYXJibGUgZGlhZ3JhbTpcbiAqXG4gKiBgYGB0ZXh0XG4gKiAtLTEtLTItLS0zLS0tNC18XG4gKiAuLi4uLi4uLi4uLi4uLi4tLWEtYi1jLS1kLXxcbiAqICAgICAgICAgICBjb25jYXRcbiAqIC0tMS0tMi0tLTMtLS00LS0tYS1iLWMtLWQtfFxuICogYGBgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGNvbmNhdCBmcm9tICd4c3RyZWFtL2V4dHJhL2NvbmNhdCdcbiAqXG4gKiBjb25zdCBzdHJlYW1BID0geHMub2YoJ2EnLCAnYicsICdjJylcbiAqIGNvbnN0IHN0cmVhbUIgPSB4cy5vZigxMCwgMjAsIDMwKVxuICogY29uc3Qgc3RyZWFtQyA9IHhzLm9mKCdYJywgJ1knLCAnWicpXG4gKlxuICogY29uc3Qgb3V0cHV0U3RyZWFtID0gY29uY2F0KHN0cmVhbUEsIHN0cmVhbUIsIHN0cmVhbUMpXG4gKlxuICogb3V0cHV0U3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogKHgpID0+IGNvbnNvbGUubG9nKHgpLFxuICogICBlcnJvcjogKGVycikgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbmNhdCBjb21wbGV0ZWQnKSxcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAZmFjdG9yeSB0cnVlXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBjb25jYXRlbmF0ZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMiBBIHN0cmVhbSB0byBjb25jYXRlbmF0ZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuIFR3b1xuICogb3IgbW9yZSBzdHJlYW1zIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbmNhdDxUPiguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08VD4+KTogU3RyZWFtPFQ+IHtcbiAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IENvbmNhdFByb2R1Y2VyKHN0cmVhbXMpKTtcbn1cbiIsImltcG9ydCB7T3BlcmF0b3IsIFN0cmVhbX0gZnJvbSAnLi4vaW5kZXgnO1xuXG5jbGFzcyBEZWxheU9wZXJhdG9yPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkZWxheSc7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPiA9IG51bGwgYXMgYW55O1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBkdDogbnVtYmVyLFxuICAgICAgICAgICAgICBwdWJsaWMgaW5zOiBTdHJlYW08VD4pIHtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gbnVsbCBhcyBhbnk7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdS5fbih0KTtcbiAgICAgIGNsZWFySW50ZXJ2YWwoaWQpO1xuICAgIH0sIHRoaXMuZHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB1Ll9lKGVycik7XG4gICAgICBjbGVhckludGVydmFsKGlkKTtcbiAgICB9LCB0aGlzLmR0KTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHUuX2MoKTtcbiAgICAgIGNsZWFySW50ZXJ2YWwoaWQpO1xuICAgIH0sIHRoaXMuZHQpO1xuICB9XG59XG5cbi8qKlxuICogRGVsYXlzIHBlcmlvZGljIGV2ZW50cyBieSBhIGdpdmVuIHRpbWUgcGVyaW9kLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIDEtLS0tMi0tMy0tNC0tLS01fFxuICogICAgIGRlbGF5KDYwKVxuICogLS0tMS0tLS0yLS0zLS00LS0tLTV8XG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZnJvbURpYWdyYW0gZnJvbSAneHN0cmVhbS9leHRyYS9mcm9tRGlhZ3JhbSdcbiAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IGZyb21EaWFncmFtKCcxLS0tLTItLTMtLTQtLS0tNXwnKVxuICogIC5jb21wb3NlKGRlbGF5KDYwKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gMSAgKGFmdGVyIDYwIG1zKVxuICogPiAyICAoYWZ0ZXIgMTYwIG1zKVxuICogPiAzICAoYWZ0ZXIgMjIwIG1zKVxuICogPiA0ICAoYWZ0ZXIgMjgwIG1zKVxuICogPiA1ICAoYWZ0ZXIgMzgwIG1zKVxuICogPiBjb21wbGV0ZWRcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBwZXJpb2QgVGhlIGFtb3VudCBvZiBzaWxlbmNlIHJlcXVpcmVkIGluIG1pbGxpc2Vjb25kcy5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZGVsYXk8VD4ocGVyaW9kOiBudW1iZXIpOiAoaW5zOiBTdHJlYW08VD4pID0+IFN0cmVhbTxUPiB7XG4gIHJldHVybiBmdW5jdGlvbiBkZWxheU9wZXJhdG9yKGluczogU3RyZWFtPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRGVsYXlPcGVyYXRvcihwZXJpb2QsIGlucykpO1xuICB9O1xufVxuIiwiaW1wb3J0IHtPcGVyYXRvciwgU3RyZWFtfSBmcm9tICcuLi9pbmRleCc7XG5jb25zdCBlbXB0eSA9IHt9O1xuXG5leHBvcnQgY2xhc3MgRHJvcFJlcGVhdHNPcGVyYXRvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZHJvcFJlcGVhdHMnO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD4gPSBudWxsIGFzIGFueTtcbiAgcHVibGljIGlzRXE6ICh4OiBULCB5OiBUKSA9PiBib29sZWFuO1xuICBwcml2YXRlIHY6IFQgPSA8YW55PiBlbXB0eTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgaW5zOiBTdHJlYW08VD4sXG4gICAgICAgICAgICAgIGZuOiAoKHg6IFQsIHk6IFQpID0+IGJvb2xlYW4pIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5pc0VxID0gZm4gPyBmbiA6ICh4LCB5KSA9PiB4ID09PSB5O1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBudWxsIGFzIGFueTtcbiAgICB0aGlzLnYgPSBlbXB0eSBhcyBhbnk7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IHYgPSB0aGlzLnY7XG4gICAgaWYgKHYgIT09IGVtcHR5ICYmIHRoaXMuaXNFcSh0LCB2KSkgcmV0dXJuO1xuICAgIHRoaXMudiA9IHQ7XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEcm9wcyBjb25zZWN1dGl2ZSBkdXBsaWNhdGUgdmFsdWVzIGluIGEgc3RyZWFtLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tMi0tMS0tMS0tMS0tMi0tMy0tNC0tMy0tM3xcbiAqICAgICBkcm9wUmVwZWF0c1xuICogLS0xLS0yLS0xLS0tLS0tLS0yLS0zLS00LS0zLS0tfFxuICogYGBgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGRyb3BSZXBlYXRzIGZyb20gJ3hzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHMnXG4gKlxuICogY29uc3Qgc3RyZWFtID0geHMub2YoMSwgMiwgMSwgMSwgMSwgMiwgMywgNCwgMywgMylcbiAqICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gMVxuICogPiAyXG4gKiA+IDFcbiAqID4gMlxuICogPiAzXG4gKiA+IDRcbiAqID4gM1xuICogPiBjb21wbGV0ZWRcbiAqIGBgYFxuICpcbiAqIEV4YW1wbGUgd2l0aCBhIGN1c3RvbSBpc0VxdWFsIGZ1bmN0aW9uOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZHJvcFJlcGVhdHMgZnJvbSAneHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0cydcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSB4cy5vZignYScsICdiJywgJ2EnLCAnQScsICdCJywgJ2InKVxuICogICAuY29tcG9zZShkcm9wUmVwZWF0cygoeCwgeSkgPT4geC50b0xvd2VyQ2FzZSgpID09PSB5LnRvTG93ZXJDYXNlKCkpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiBhXG4gKiA+IGJcbiAqID4gYVxuICogPiBCXG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXNFcXVhbCBBbiBvcHRpb25hbCBmdW5jdGlvbiBvZiB0eXBlXG4gKiBgKHg6IFQsIHk6IFQpID0+IGJvb2xlYW5gIHRoYXQgdGFrZXMgYW4gZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGFuZFxuICogY2hlY2tzIGlmIGl0IGlzIGVxdWFsIHRvIHByZXZpb3VzIGV2ZW50LCBieSByZXR1cm5pbmcgYSBib29sZWFuLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkcm9wUmVwZWF0czxUPihpc0VxdWFsOiAoKHg6IFQsIHk6IFQpID0+IGJvb2xlYW4pIHwgdW5kZWZpbmVkID0gdm9pZCAwKTogKGluczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08VD4ge1xuICByZXR1cm4gZnVuY3Rpb24gZHJvcFJlcGVhdHNPcGVyYXRvcihpbnM6IFN0cmVhbTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERyb3BSZXBlYXRzT3BlcmF0b3I8VD4oaW5zLCBpc0VxdWFsKSk7XG4gIH07XG59XG4iLCJpbXBvcnQge0ludGVybmFsTGlzdGVuZXIsIE9wZXJhdG9yLCBTdHJlYW19IGZyb20gJy4uL2luZGV4JztcblxuZXhwb3J0IGludGVyZmFjZSBTYW1wbGVDb21iaW5lU2lnbmF0dXJlIHtcbiAgKCk6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVF0+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMV0+O1xuICA8VDEsIFQyPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyXT47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUM10+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzLCBUNF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1Pik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUMywgVDQsIFQ1XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUMywgVDQsIFQ1LCBUNl0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUN10+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4Pik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4XT47XG4gICguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pOiAoczogU3RyZWFtPGFueT4pID0+IFN0cmVhbTxBcnJheTxhbnk+Pjtcbn1cblxuY29uc3QgTk8gPSB7fTtcblxuZXhwb3J0IGNsYXNzIFNhbXBsZUNvbWJpbmVMaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGk6IG51bWJlciwgcHJpdmF0ZSBwOiBTYW1wbGVDb21iaW5lT3BlcmF0b3I8YW55Pikge1xuICAgIHAuaWxzW2ldID0gdGhpcztcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wO1xuICAgIGlmIChwLm91dCA9PT0gTk8pIHJldHVybjtcbiAgICBwLnVwKHQsIHRoaXMuaSk7XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIHRoaXMucC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgdGhpcy5wLmRvd24odGhpcy5pLCB0aGlzKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2FtcGxlQ29tYmluZU9wZXJhdG9yPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgQXJyYXk8YW55Pj4ge1xuICBwdWJsaWMgdHlwZSA9ICdzYW1wbGVDb21iaW5lJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3RoZXJzOiBBcnJheTxTdHJlYW08YW55Pj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxhbnk+PjtcbiAgcHVibGljIGlsczogQXJyYXk8U2FtcGxlQ29tYmluZUxpc3RlbmVyPGFueT4+O1xuICBwdWJsaWMgTm46IG51bWJlcjsgLy8gKk4qdW1iZXIgb2Ygc3RyZWFtcyBzdGlsbCB0byBzZW5kICpuKmV4dFxuICBwdWJsaWMgdmFsczogQXJyYXk8YW55PjtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdGhlcnMgPSBzdHJlYW1zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PGFueT4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy5ObiA9IDA7XG4gICAgdGhpcy52YWxzID0gW107XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08QXJyYXk8YW55Pj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5vdGhlcnM7XG4gICAgY29uc3QgbiA9IHRoaXMuTm4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCB2YWxzID0gdGhpcy52YWxzID0gbmV3IEFycmF5KG4pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICB2YWxzW2ldID0gTk87XG4gICAgICBzW2ldLl9hZGQobmV3IFNhbXBsZUNvbWJpbmVMaXN0ZW5lcjxhbnk+KGksIHRoaXMpKTtcbiAgICB9XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLm90aGVycztcbiAgICBjb25zdCBuID0gcy5sZW5ndGg7XG4gICAgY29uc3QgaWxzID0gdGhpcy5pbHM7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgc1tpXS5fcmVtb3ZlKGlsc1tpXSk7XG4gICAgfVxuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PGFueT4+O1xuICAgIHRoaXMudmFscyA9IFtdO1xuICAgIHRoaXMuaWxzID0gW107XG4gIH1cblxuICBfbih0OiBUKTogdm9pZCB7XG4gICAgY29uc3Qgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAodGhpcy5ObiA+IDApIHJldHVybjtcbiAgICBvdXQuX24oW3QsIC4uLnRoaXMudmFsc10pO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIG91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgY29uc3Qgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBvdXQuX2MoKTtcbiAgfVxuXG4gIHVwKHQ6IGFueSwgaTogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgdiA9IHRoaXMudmFsc1tpXTtcbiAgICBpZiAodGhpcy5ObiA+IDAgJiYgdiA9PT0gTk8pIHtcbiAgICAgIHRoaXMuTm4tLTtcbiAgICB9XG4gICAgdGhpcy52YWxzW2ldID0gdDtcbiAgfVxuXG4gIGRvd24oaTogbnVtYmVyLCBsOiBTYW1wbGVDb21iaW5lTGlzdGVuZXI8YW55Pik6IHZvaWQge1xuICAgIHRoaXMub3RoZXJzW2ldLl9yZW1vdmUobCk7XG4gIH1cbn1cblxubGV0IHNhbXBsZUNvbWJpbmU6IFNhbXBsZUNvbWJpbmVTaWduYXR1cmU7XG5cbi8qKlxuICpcbiAqIENvbWJpbmVzIGEgc291cmNlIHN0cmVhbSB3aXRoIG11bHRpcGxlIG90aGVyIHN0cmVhbXMuIFRoZSByZXN1bHQgc3RyZWFtXG4gKiB3aWxsIGVtaXQgdGhlIGxhdGVzdCBldmVudHMgZnJvbSBhbGwgaW5wdXQgc3RyZWFtcywgYnV0IG9ubHkgd2hlbiB0aGVcbiAqIHNvdXJjZSBzdHJlYW0gZW1pdHMuXG4gKlxuICogSWYgdGhlIHNvdXJjZSwgb3IgYW55IGlucHV0IHN0cmVhbSwgdGhyb3dzIGFuIGVycm9yLCB0aGUgcmVzdWx0IHN0cmVhbVxuICogd2lsbCBwcm9wYWdhdGUgdGhlIGVycm9yLiBJZiBhbnkgaW5wdXQgc3RyZWFtcyBlbmQsIHRoZWlyIGZpbmFsIGVtaXR0ZWRcbiAqIHZhbHVlIHdpbGwgcmVtYWluIGluIHRoZSBhcnJheSBvZiBhbnkgc3Vic2VxdWVudCBldmVudHMgZnJvbSB0aGUgcmVzdWx0XG4gKiBzdHJlYW0uXG4gKlxuICogVGhlIHJlc3VsdCBzdHJlYW0gd2lsbCBvbmx5IGNvbXBsZXRlIHVwb24gY29tcGxldGlvbiBvZiB0aGUgc291cmNlIHN0cmVhbS5cbiAqXG4gKiBNYXJibGUgZGlhZ3JhbTpcbiAqXG4gKiBgYGB0ZXh0XG4gKiAtLTEtLS0tMi0tLS0tMy0tLS0tLS0tNC0tLSAoc291cmNlKVxuICogLS0tLWEtLS0tLWItLS0tLWMtLWQtLS0tLS0gKG90aGVyKVxuICogICAgICBzYW1wbGVDb21iaW5lXG4gKiAtLS0tLS0tMmEtLS0tM2ItLS0tLS0tNGQtLVxuICogYGBgXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBzYW1wbGVDb21iaW5lIGZyb20gJ3hzdHJlYW0vZXh0cmEvc2FtcGxlQ29tYmluZSdcbiAqIGltcG9ydCB4cyBmcm9tICd4c3RyZWFtJ1xuICpcbiAqIGNvbnN0IHNhbXBsZXIgPSB4cy5wZXJpb2RpYygxMDAwKS50YWtlKDMpXG4gKiBjb25zdCBvdGhlciA9IHhzLnBlcmlvZGljKDEwMClcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBzYW1wbGVyLmNvbXBvc2Uoc2FtcGxlQ29tYmluZShvdGhlcikpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IFswLCA4XVxuICogPiBbMSwgMThdXG4gKiA+IFsyLCAyOF1cbiAqIGBgYFxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgc2FtcGxlQ29tYmluZSBmcm9tICd4c3RyZWFtL2V4dHJhL3NhbXBsZUNvbWJpbmUnXG4gKiBpbXBvcnQgeHMgZnJvbSAneHN0cmVhbSdcbiAqXG4gKiBjb25zdCBzYW1wbGVyID0geHMucGVyaW9kaWMoMTAwMCkudGFrZSgzKVxuICogY29uc3Qgb3RoZXIgPSB4cy5wZXJpb2RpYygxMDApLnRha2UoMilcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBzYW1wbGVyLmNvbXBvc2Uoc2FtcGxlQ29tYmluZShvdGhlcikpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IFswLCAxXVxuICogPiBbMSwgMV1cbiAqID4gWzIsIDFdXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gey4uLlN0cmVhbX0gc3RyZWFtcyBPbmUgb3IgbW9yZSBzdHJlYW1zIHRvIGNvbWJpbmUgd2l0aCB0aGUgc2FtcGxlclxuICogc3RyZWFtLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5zYW1wbGVDb21iaW5lID0gZnVuY3Rpb24gc2FtcGxlQ29tYmluZSguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHNhbXBsZUNvbWJpbmVPcGVyYXRvcihzYW1wbGVyOiBTdHJlYW08YW55Pik6IFN0cmVhbTxBcnJheTxhbnk+PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08QXJyYXk8YW55Pj4obmV3IFNhbXBsZUNvbWJpbmVPcGVyYXRvcihzYW1wbGVyLCBzdHJlYW1zKSk7XG4gIH07XG59IGFzIFNhbXBsZUNvbWJpbmVTaWduYXR1cmU7XG5cbmV4cG9ydCBkZWZhdWx0IHNhbXBsZUNvbWJpbmU7IiwiaW1wb3J0ICQkb2JzZXJ2YWJsZSBmcm9tICdzeW1ib2wtb2JzZXJ2YWJsZSc7XG5cbmNvbnN0IE5PID0ge307XG5mdW5jdGlvbiBub29wKCkge31cblxuZnVuY3Rpb24gY3A8VD4oYTogQXJyYXk8VD4pOiBBcnJheTxUPiB7XG4gIGNvbnN0IGwgPSBhLmxlbmd0aDtcbiAgY29uc3QgYiA9IEFycmF5KGwpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGw7ICsraSkgYltpXSA9IGFbaV07XG4gIHJldHVybiBiO1xufVxuXG5mdW5jdGlvbiBhbmQ8VD4oZjE6ICh0OiBUKSA9PiBib29sZWFuLCBmMjogKHQ6IFQpID0+IGJvb2xlYW4pOiAodDogVCkgPT4gYm9vbGVhbiB7XG4gIHJldHVybiBmdW5jdGlvbiBhbmRGbih0OiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGYxKHQpICYmIGYyKHQpO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgRkNvbnRhaW5lcjxULCBSPiB7XG4gIGYodDogVCk6IFI7XG59XG5cbmZ1bmN0aW9uIF90cnk8VCwgUj4oYzogRkNvbnRhaW5lcjxULCBSPiwgdDogVCwgdTogU3RyZWFtPGFueT4pOiBSIHwge30ge1xuICB0cnkge1xuICAgIHJldHVybiBjLmYodCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB1Ll9lKGUpO1xuICAgIHJldHVybiBOTztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBfbjogKHY6IFQpID0+IHZvaWQ7XG4gIF9lOiAoZXJyOiBhbnkpID0+IHZvaWQ7XG4gIF9jOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBOT19JTDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+ID0ge1xuICBfbjogbm9vcCxcbiAgX2U6IG5vb3AsXG4gIF9jOiBub29wLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgX3N0YXJ0KGxpc3RlbmVyOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZDtcbiAgX3N0b3A6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0U2VuZGVyPFQ+IHtcbiAgb3V0OiBTdHJlYW08VD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3BlcmF0b3I8VCwgUj4gZXh0ZW5kcyBJbnRlcm5hbFByb2R1Y2VyPFI+LCBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8Uj4ge1xuICB0eXBlOiBzdHJpbmc7XG4gIGluczogU3RyZWFtPFQ+O1xuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFnZ3JlZ2F0b3I8VCwgVT4gZXh0ZW5kcyBJbnRlcm5hbFByb2R1Y2VyPFU+LCBPdXRTZW5kZXI8VT4ge1xuICB0eXBlOiBzdHJpbmc7XG4gIGluc0FycjogQXJyYXk8U3RyZWFtPFQ+PjtcbiAgX3N0YXJ0KG91dDogU3RyZWFtPFU+KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9kdWNlcjxUPiB7XG4gIHN0YXJ0OiAobGlzdGVuZXI6IExpc3RlbmVyPFQ+KSA9PiB2b2lkO1xuICBzdG9wOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExpc3RlbmVyPFQ+IHtcbiAgbmV4dDogKHg6IFQpID0+IHZvaWQ7XG4gIGVycm9yOiAoZXJyOiBhbnkpID0+IHZvaWQ7XG4gIGNvbXBsZXRlOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN1YnNjcmlwdGlvbiB7XG4gIHVuc3Vic2NyaWJlKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT2JzZXJ2YWJsZTxUPiB7XG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXI8VD4pOiBTdWJzY3JpcHRpb247XG59XG5cbi8vIG11dGF0ZXMgdGhlIGlucHV0XG5mdW5jdGlvbiBpbnRlcm5hbGl6ZVByb2R1Y2VyPFQ+KHByb2R1Y2VyOiBQcm9kdWNlcjxUPiAmIFBhcnRpYWw8SW50ZXJuYWxQcm9kdWNlcjxUPj4pIHtcbiAgcHJvZHVjZXIuX3N0YXJ0ID0gZnVuY3Rpb24gX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+ICYgUGFydGlhbDxMaXN0ZW5lcjxUPj4pIHtcbiAgICBpbC5uZXh0ID0gaWwuX247XG4gICAgaWwuZXJyb3IgPSBpbC5fZTtcbiAgICBpbC5jb21wbGV0ZSA9IGlsLl9jO1xuICAgIHRoaXMuc3RhcnQoaWwpO1xuICB9O1xuICBwcm9kdWNlci5fc3RvcCA9IHByb2R1Y2VyLnN0b3A7XG59XG5cbmNsYXNzIFN0cmVhbVN1YjxUPiBpbXBsZW1lbnRzIFN1YnNjcmlwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3N0cmVhbTogU3RyZWFtPFQ+LCBwcml2YXRlIF9saXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPikge31cblxuICB1bnN1YnNjcmliZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9zdHJlYW0uX3JlbW92ZSh0aGlzLl9saXN0ZW5lcik7XG4gIH1cbn1cblxuY2xhc3MgT2JzZXJ2ZXI8VD4gaW1wbGVtZW50cyBMaXN0ZW5lcjxUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2xpc3RlbmVyOiBJbnRlcm5hbExpc3RlbmVyPFQ+KSB7fVxuXG4gIG5leHQodmFsdWU6IFQpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fbih2YWx1ZSk7XG4gIH1cblxuICBlcnJvcihlcnI6IGFueSkge1xuICAgIHRoaXMuX2xpc3RlbmVyLl9lKGVycik7XG4gIH1cblxuICBjb21wbGV0ZSgpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fYygpO1xuICB9XG59XG5cbmNsYXNzIEZyb21PYnNlcnZhYmxlPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21PYnNlcnZhYmxlJztcbiAgcHVibGljIGluczogT2JzZXJ2YWJsZTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGFjdGl2ZTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfc3ViOiBTdWJzY3JpcHRpb24gfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3Iob2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUPikge1xuICAgIHRoaXMuaW5zID0gb2JzZXJ2YWJsZTtcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMuX3N1YiA9IHRoaXMuaW5zLnN1YnNjcmliZShuZXcgT2JzZXJ2ZXIob3V0KSk7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZSkgdGhpcy5fc3ViLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICBfc3RvcCgpIHtcbiAgICBpZiAodGhpcy5fc3ViKSB0aGlzLl9zdWIudW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVyZ2VTaWduYXR1cmUge1xuICAoKTogU3RyZWFtPGFueT47XG4gIDxUMT4oczE6IFN0cmVhbTxUMT4pOiBTdHJlYW08VDE+O1xuICA8VDEsIFQyPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPik6IFN0cmVhbTxUMSB8IFQyPjtcbiAgPFQxLCBUMiwgVDM+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+KTogU3RyZWFtPFQxIHwgVDIgfCBUMz47XG4gIDxUMSwgVDIsIFQzLCBUND4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQ+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDY+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNj47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDc+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDk+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDggfCBUOT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTA+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+LFxuICAgIHMxMDogU3RyZWFtPFQxMD4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOCB8IFQ5IHwgVDEwPjtcbiAgPFQ+KC4uLnN0cmVhbTogQXJyYXk8U3RyZWFtPFQ+Pik6IFN0cmVhbTxUPjtcbn1cblxuY2xhc3MgTWVyZ2U8VD4gaW1wbGVtZW50cyBBZ2dyZWdhdG9yPFQsIFQ+LCBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnbWVyZ2UnO1xuICBwdWJsaWMgaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgYWM6IG51bWJlcjsgLy8gYWMgaXMgYWN0aXZlQ291bnRcblxuICBjb25zdHJ1Y3RvcihpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj4pIHtcbiAgICB0aGlzLmluc0FyciA9IGluc0FycjtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmFjID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBMID0gcy5sZW5ndGg7XG4gICAgdGhpcy5hYyA9IEw7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIHNbaV0uX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBMID0gcy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIHNbaV0uX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGlmICgtLXRoaXMuYWMgPD0gMCkge1xuICAgICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgICB1Ll9jKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tYmluZVNpZ25hdHVyZSB7XG4gICgpOiBTdHJlYW08QXJyYXk8YW55Pj47XG4gIDxUMT4oczE6IFN0cmVhbTxUMT4pOiBTdHJlYW08W1QxXT47XG4gIDxUMSwgVDI+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+KTogU3RyZWFtPFtUMSwgVDJdPjtcbiAgPFQxLCBUMiwgVDM+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+KTogU3RyZWFtPFtUMSwgVDIsIFQzXT47XG4gIDxUMSwgVDIsIFQzLCBUND4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDU+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDVdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDY+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDg+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDhdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDk+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTA+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+LFxuICAgIHMxMDogU3RyZWFtPFQxMD4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMF0+O1xuICAoLi4uc3RyZWFtOiBBcnJheTxTdHJlYW08YW55Pj4pOiBTdHJlYW08QXJyYXk8YW55Pj47XG59XG5cbmNsYXNzIENvbWJpbmVMaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4sIE91dFNlbmRlcjxBcnJheTxUPj4ge1xuICBwcml2YXRlIGk6IG51bWJlcjtcbiAgcHVibGljIG91dDogU3RyZWFtPEFycmF5PFQ+PjtcbiAgcHJpdmF0ZSBwOiBDb21iaW5lPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGk6IG51bWJlciwgb3V0OiBTdHJlYW08QXJyYXk8VD4+LCBwOiBDb21iaW5lPFQ+KSB7XG4gICAgdGhpcy5pID0gaTtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLnAgPSBwO1xuICAgIHAuaWxzLnB1c2godGhpcyk7XG4gIH1cblxuICBfbih0OiBUKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMucCwgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAocC51cCh0LCB0aGlzLmkpKSB7XG4gICAgICBjb25zdCBhID0gcC52YWxzO1xuICAgICAgY29uc3QgbCA9IGEubGVuZ3RoO1xuICAgICAgY29uc3QgYiA9IEFycmF5KGwpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyArK2kpIGJbaV0gPSBhW2ldO1xuICAgICAgb3V0Ll9uKGIpO1xuICAgIH1cbiAgfVxuXG4gIF9lKGVycjogYW55KTogdm9pZCB7XG4gICAgY29uc3Qgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBvdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLnA7XG4gICAgaWYgKHAub3V0ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICgtLXAuTmMgPT09IDApIHAub3V0Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgQ29tYmluZTxSPiBpbXBsZW1lbnRzIEFnZ3JlZ2F0b3I8YW55LCBBcnJheTxSPj4ge1xuICBwdWJsaWMgdHlwZSA9ICdjb21iaW5lJztcbiAgcHVibGljIGluc0FycjogQXJyYXk8U3RyZWFtPGFueT4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08QXJyYXk8Uj4+O1xuICBwdWJsaWMgaWxzOiBBcnJheTxDb21iaW5lTGlzdGVuZXI8YW55Pj47XG4gIHB1YmxpYyBOYzogbnVtYmVyOyAvLyAqTip1bWJlciBvZiBzdHJlYW1zIHN0aWxsIHRvIHNlbmQgKmMqb21wbGV0ZVxuICBwdWJsaWMgTm46IG51bWJlcjsgLy8gKk4qdW1iZXIgb2Ygc3RyZWFtcyBzdGlsbCB0byBzZW5kICpuKmV4dFxuICBwdWJsaWMgdmFsczogQXJyYXk8Uj47XG5cbiAgY29uc3RydWN0b3IoaW5zQXJyOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICB0aGlzLmluc0FyciA9IGluc0FycjtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxBcnJheTxSPj47XG4gICAgdGhpcy5pbHMgPSBbXTtcbiAgICB0aGlzLk5jID0gdGhpcy5ObiA9IDA7XG4gICAgdGhpcy52YWxzID0gW107XG4gIH1cblxuICB1cCh0OiBhbnksIGk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHYgPSB0aGlzLnZhbHNbaV07XG4gICAgY29uc3QgTm4gPSAhdGhpcy5ObiA/IDAgOiB2ID09PSBOTyA/IC0tdGhpcy5ObiA6IHRoaXMuTm47XG4gICAgdGhpcy52YWxzW2ldID0gdDtcbiAgICByZXR1cm4gTm4gPT09IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08QXJyYXk8Uj4+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IG4gPSB0aGlzLk5jID0gdGhpcy5ObiA9IHMubGVuZ3RoO1xuICAgIGNvbnN0IHZhbHMgPSB0aGlzLnZhbHMgPSBuZXcgQXJyYXkobik7XG4gICAgaWYgKG4gPT09IDApIHtcbiAgICAgIG91dC5fbihbXSk7XG4gICAgICBvdXQuX2MoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgdmFsc1tpXSA9IE5PO1xuICAgICAgICBzW2ldLl9hZGQobmV3IENvbWJpbmVMaXN0ZW5lcihpLCBvdXQsIHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgbiA9IHMubGVuZ3RoO1xuICAgIGNvbnN0IGlscyA9IHRoaXMuaWxzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSBzW2ldLl9yZW1vdmUoaWxzW2ldKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxBcnJheTxSPj47XG4gICAgdGhpcy5pbHMgPSBbXTtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgfVxufVxuXG5jbGFzcyBGcm9tQXJyYXk8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbUFycmF5JztcbiAgcHVibGljIGE6IEFycmF5PFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGE6IEFycmF5PFQ+KSB7XG4gICAgdGhpcy5hID0gYTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5hO1xuICAgIGZvciAobGV0IGkgPSAwLCBuID0gYS5sZW5ndGg7IGkgPCBuOyBpKyspIG91dC5fbihhW2ldKTtcbiAgICBvdXQuX2MoKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICB9XG59XG5cbmNsYXNzIEZyb21Qcm9taXNlPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21Qcm9taXNlJztcbiAgcHVibGljIG9uOiBib29sZWFuO1xuICBwdWJsaWMgcDogUHJvbWlzZUxpa2U8VD47XG5cbiAgY29uc3RydWN0b3IocDogUHJvbWlzZUxpa2U8VD4pIHtcbiAgICB0aGlzLm9uID0gZmFsc2U7XG4gICAgdGhpcy5wID0gcDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCBwcm9kID0gdGhpcztcbiAgICB0aGlzLm9uID0gdHJ1ZTtcbiAgICB0aGlzLnAudGhlbihcbiAgICAgICh2OiBUKSA9PiB7XG4gICAgICAgIGlmIChwcm9kLm9uKSB7XG4gICAgICAgICAgb3V0Ll9uKHYpO1xuICAgICAgICAgIG91dC5fYygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBvdXQuX2UoZSk7XG4gICAgICB9LFxuICAgICkudGhlbihub29wLCAoZXJyOiBhbnkpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4geyB0aHJvdyBlcnI7IH0pO1xuICAgIH0pO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5vbiA9IGZhbHNlO1xuICB9XG59XG5cbmNsYXNzIFBlcmlvZGljIGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxudW1iZXI+IHtcbiAgcHVibGljIHR5cGUgPSAncGVyaW9kaWMnO1xuICBwdWJsaWMgcGVyaW9kOiBudW1iZXI7XG4gIHByaXZhdGUgaW50ZXJ2YWxJRDogYW55O1xuICBwcml2YXRlIGk6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihwZXJpb2Q6IG51bWJlcikge1xuICAgIHRoaXMucGVyaW9kID0gcGVyaW9kO1xuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IC0xO1xuICAgIHRoaXMuaSA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPG51bWJlcj4pOiB2b2lkIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBpbnRlcnZhbEhhbmRsZXIoKSB7IG91dC5fbihzZWxmLmkrKyk7IH1cbiAgICB0aGlzLmludGVydmFsSUQgPSBzZXRJbnRlcnZhbChpbnRlcnZhbEhhbmRsZXIsIHRoaXMucGVyaW9kKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmludGVydmFsSUQgIT09IC0xKSBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJRCk7XG4gICAgdGhpcy5pbnRlcnZhbElEID0gLTE7XG4gICAgdGhpcy5pID0gMDtcbiAgfVxufVxuXG5jbGFzcyBEZWJ1ZzxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZGVidWcnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBzOiAodDogVCkgPT4gYW55OyAvLyBzcHlcbiAgcHJpdmF0ZSBsOiBzdHJpbmc7IC8vIGxhYmVsXG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogc3RyaW5nKTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86ICh0OiBUKSA9PiBhbnkpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpKTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMucyA9IG5vb3A7XG4gICAgdGhpcy5sID0gJyc7XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB0aGlzLmwgPSBhcmc7IGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbicpIHRoaXMucyA9IGFyZztcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCBzID0gdGhpcy5zLCBsID0gdGhpcy5sO1xuICAgIGlmIChzICE9PSBub29wKSB7XG4gICAgICB0cnkge1xuICAgICAgICBzKHQpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB1Ll9lKGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobCkgY29uc29sZS5sb2cobCArICc6JywgdCk7IGVsc2UgY29uc29sZS5sb2codCk7XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRHJvcDxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZHJvcCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbWF4OiBudW1iZXI7XG4gIHByaXZhdGUgZHJvcHBlZDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKG1heDogbnVtYmVyLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubWF4ID0gbWF4O1xuICAgIHRoaXMuZHJvcHBlZCA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmRyb3BwZWQgPSAwO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAodGhpcy5kcm9wcGVkKysgPj0gdGhpcy5tYXgpIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIEVuZFdoZW5MaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8YW55PiB7XG4gIHByaXZhdGUgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3A6IEVuZFdoZW48VD47XG5cbiAgY29uc3RydWN0b3Iob3V0OiBTdHJlYW08VD4sIG9wOiBFbmRXaGVuPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcCA9IG9wO1xuICB9XG5cbiAgX24oKSB7XG4gICAgdGhpcy5vcC5lbmQoKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgdGhpcy5vdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3AuZW5kKCk7XG4gIH1cbn1cblxuY2xhc3MgRW5kV2hlbjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZW5kV2hlbic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbzogU3RyZWFtPGFueT47IC8vIG8gPSBvdGhlclxuICBwcml2YXRlIG9pbDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+OyAvLyBvaWwgPSBvdGhlciBJbnRlcm5hbExpc3RlbmVyXG5cbiAgY29uc3RydWN0b3IobzogU3RyZWFtPGFueT4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vID0gbztcbiAgICB0aGlzLm9pbCA9IE5PX0lMO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vLl9hZGQodGhpcy5vaWwgPSBuZXcgRW5kV2hlbkxpc3RlbmVyKG91dCwgdGhpcykpO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMuby5fcmVtb3ZlKHRoaXMub2lsKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9pbCA9IE5PX0lMO1xuICB9XG5cbiAgZW5kKCk6IHZvaWQge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLmVuZCgpO1xuICB9XG59XG5cbmNsYXNzIEZpbHRlcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZmlsdGVyJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBmOiAodDogVCkgPT4gYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuZiA9IHBhc3NlcztcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8gfHwgIXIpIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBGbGF0dGVuTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHJpdmF0ZSBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcDogRmxhdHRlbjxUPjtcblxuICBjb25zdHJ1Y3RvcihvdXQ6IFN0cmVhbTxUPiwgb3A6IEZsYXR0ZW48VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wID0gb3A7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgdGhpcy5vdXQuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIHRoaXMub3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3AubGVzcygpO1xuICB9XG59XG5cbmNsYXNzIEZsYXR0ZW48VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxTdHJlYW08VD4sIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZmxhdHRlbic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxTdHJlYW08VD4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3BlbjogYm9vbGVhbjtcbiAgcHVibGljIGlubmVyOiBTdHJlYW08VD47IC8vIEN1cnJlbnQgaW5uZXIgU3RyZWFtXG4gIHByaXZhdGUgaWw6IEludGVybmFsTGlzdGVuZXI8VD47IC8vIEN1cnJlbnQgaW5uZXIgSW50ZXJuYWxMaXN0ZW5lclxuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFN0cmVhbTxUPj4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5pbCA9IE5PX0lMO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICBpZiAodGhpcy5pbm5lciAhPT0gTk8pIHRoaXMuaW5uZXIuX3JlbW92ZSh0aGlzLmlsKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5pbCA9IE5PX0lMO1xuICB9XG5cbiAgbGVzcygpOiB2b2lkIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLm9wZW4gJiYgdGhpcy5pbm5lciA9PT0gTk8pIHUuX2MoKTtcbiAgfVxuXG4gIF9uKHM6IFN0cmVhbTxUPikge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCB7aW5uZXIsIGlsfSA9IHRoaXM7XG4gICAgaWYgKGlubmVyICE9PSBOTyAmJiBpbCAhPT0gTk9fSUwpIGlubmVyLl9yZW1vdmUoaWwpO1xuICAgICh0aGlzLmlubmVyID0gcykuX2FkZCh0aGlzLmlsID0gbmV3IEZsYXR0ZW5MaXN0ZW5lcih1LCB0aGlzKSk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICB0aGlzLmxlc3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGb2xkPFQsIFI+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgUj4ge1xuICBwdWJsaWMgdHlwZSA9ICdmb2xkJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08Uj47XG4gIHB1YmxpYyBmOiAodDogVCkgPT4gUjtcbiAgcHVibGljIHNlZWQ6IFI7XG4gIHByaXZhdGUgYWNjOiBSOyAvLyBpbml0aWFsaXplZCBhcyBzZWVkXG5cbiAgY29uc3RydWN0b3IoZjogKGFjYzogUiwgdDogVCkgPT4gUiwgc2VlZDogUiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgICB0aGlzLmYgPSAodDogVCkgPT4gZih0aGlzLmFjYywgdCk7XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQgPSBzZWVkO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQ7XG4gICAgb3V0Ll9uKHRoaXMuYWNjKTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZDtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0aGlzLmFjYyA9IHIgYXMgUik7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIExhc3Q8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2xhc3QnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBoYXM6IGJvb2xlYW47XG4gIHByaXZhdGUgdmFsOiBUO1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5oYXMgPSBmYWxzZTtcbiAgICB0aGlzLnZhbCA9IE5PIGFzIFQ7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmhhcyA9IGZhbHNlO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMudmFsID0gTk8gYXMgVDtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICB0aGlzLmhhcyA9IHRydWU7XG4gICAgdGhpcy52YWwgPSB0O1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmhhcykge1xuICAgICAgdS5fbih0aGlzLnZhbCk7XG4gICAgICB1Ll9jKCk7XG4gICAgfSBlbHNlIHUuX2UobmV3IEVycm9yKCdsYXN0KCkgZmFpbGVkIGJlY2F1c2UgaW5wdXQgc3RyZWFtIGNvbXBsZXRlZCcpKTtcbiAgfVxufVxuXG5jbGFzcyBNYXBPcDxULCBSPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFI+IHtcbiAgcHVibGljIHR5cGUgPSAnbWFwJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08Uj47XG4gIHB1YmxpYyBmOiAodDogVCkgPT4gUjtcblxuICBjb25zdHJ1Y3Rvcihwcm9qZWN0OiAodDogVCkgPT4gUiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgICB0aGlzLmYgPSBwcm9qZWN0O1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24ociBhcyBSKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgUmVtZW1iZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAncmVtZW1iZXInO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZChvdXQpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzLm91dCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cbn1cblxuY2xhc3MgUmVwbGFjZUVycm9yPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdyZXBsYWNlRXJyb3InO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIGY6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKHJlcGxhY2VyOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmYgPSByZXBsYWNlcjtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAodGhpcy5pbnMgPSB0aGlzLmYoZXJyKSkuX2FkZCh0aGlzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB1Ll9lKGUpO1xuICAgIH1cbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgU3RhcnRXaXRoPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3N0YXJ0V2l0aCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgdmFsOiBUO1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCB2YWw6IFQpIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnZhbCA9IHZhbDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3V0Ll9uKHRoaXMudmFsKTtcbiAgICB0aGlzLmlucy5fYWRkKG91dCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMub3V0KTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxufVxuXG5jbGFzcyBUYWtlPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICd0YWtlJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBtYXg6IG51bWJlcjtcbiAgcHJpdmF0ZSB0YWtlbjogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKG1heDogbnVtYmVyLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubWF4ID0gbWF4O1xuICAgIHRoaXMudGFrZW4gPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy50YWtlbiA9IDA7XG4gICAgaWYgKHRoaXMubWF4IDw9IDApIG91dC5fYygpOyBlbHNlIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCBtID0gKyt0aGlzLnRha2VuO1xuICAgIGlmIChtIDwgdGhpcy5tYXgpIHUuX24odCk7IGVsc2UgaWYgKG0gPT09IHRoaXMubWF4KSB7XG4gICAgICB1Ll9uKHQpO1xuICAgICAgdS5fYygpO1xuICAgIH1cbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN0cmVhbTxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwdWJsaWMgX3Byb2Q6IEludGVybmFsUHJvZHVjZXI8VD47XG4gIHByb3RlY3RlZCBfaWxzOiBBcnJheTxJbnRlcm5hbExpc3RlbmVyPFQ+PjsgLy8gJ2lscycgPSBJbnRlcm5hbCBsaXN0ZW5lcnNcbiAgcHJvdGVjdGVkIF9zdG9wSUQ6IGFueTtcbiAgcHJvdGVjdGVkIF9kbDogSW50ZXJuYWxMaXN0ZW5lcjxUPjsgLy8gdGhlIGRlYnVnIGxpc3RlbmVyXG4gIHByb3RlY3RlZCBfZDogYm9vbGVhbjsgLy8gZmxhZyBpbmRpY2F0aW5nIHRoZSBleGlzdGVuY2Ugb2YgdGhlIGRlYnVnIGxpc3RlbmVyXG4gIHByb3RlY3RlZCBfdGFyZ2V0OiBTdHJlYW08VD47IC8vIGltaXRhdGlvbiB0YXJnZXQgaWYgdGhpcyBTdHJlYW0gd2lsbCBpbWl0YXRlXG4gIHByb3RlY3RlZCBfZXJyOiBhbnk7XG5cbiAgY29uc3RydWN0b3IocHJvZHVjZXI/OiBJbnRlcm5hbFByb2R1Y2VyPFQ+KSB7XG4gICAgdGhpcy5fcHJvZCA9IHByb2R1Y2VyIHx8IE5PIGFzIEludGVybmFsUHJvZHVjZXI8VD47XG4gICAgdGhpcy5faWxzID0gW107XG4gICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgdGhpcy5fZGwgPSBOTyBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIHRoaXMuX2QgPSBmYWxzZTtcbiAgICB0aGlzLl90YXJnZXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5fZXJyID0gTk87XG4gIH1cblxuICBfbih0OiBUKTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBMID0gYS5sZW5ndGg7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9uKHQpO1xuICAgIGlmIChMID09IDEpIGFbMF0uX24odCk7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9uKHQpO1xuICAgIH1cbiAgfVxuXG4gIF9lKGVycjogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2VyciAhPT0gTk8pIHJldHVybjtcbiAgICB0aGlzLl9lcnIgPSBlcnI7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBMID0gYS5sZW5ndGg7XG4gICAgdGhpcy5feCgpO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fZShlcnIpO1xuICAgIGlmIChMID09IDEpIGFbMF0uX2UoZXJyKTsgZWxzZSBpZiAoTCA9PSAwKSByZXR1cm47IGVsc2Uge1xuICAgICAgY29uc3QgYiA9IGNwKGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIGJbaV0uX2UoZXJyKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9kICYmIEwgPT0gMCkgdGhyb3cgdGhpcy5fZXJyO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBMID0gYS5sZW5ndGg7XG4gICAgdGhpcy5feCgpO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fYygpO1xuICAgIGlmIChMID09IDEpIGFbMF0uX2MoKTsgZWxzZSBpZiAoTCA9PSAwKSByZXR1cm47IGVsc2Uge1xuICAgICAgY29uc3QgYiA9IGNwKGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIGJbaV0uX2MoKTtcbiAgICB9XG4gIH1cblxuICBfeCgpOiB2b2lkIHsgLy8gdGVhciBkb3duIGxvZ2ljLCBhZnRlciBlcnJvciBvciBjb21wbGV0ZVxuICAgIGlmICh0aGlzLl9pbHMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX3Byb2QgIT09IE5PKSB0aGlzLl9wcm9kLl9zdG9wKCk7XG4gICAgdGhpcy5fZXJyID0gTk87XG4gICAgdGhpcy5faWxzID0gW107XG4gIH1cblxuICBfc3RvcE5vdygpIHtcbiAgICAvLyBXQVJOSU5HOiBjb2RlIHRoYXQgY2FsbHMgdGhpcyBtZXRob2Qgc2hvdWxkXG4gICAgLy8gZmlyc3QgY2hlY2sgaWYgdGhpcy5fcHJvZCBpcyB2YWxpZCAobm90IGBOT2ApXG4gICAgdGhpcy5fcHJvZC5fc3RvcCgpO1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICB9XG5cbiAgX2FkZChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgIGlmICh0YSAhPT0gTk8pIHJldHVybiB0YS5fYWRkKGlsKTtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGEucHVzaChpbCk7XG4gICAgaWYgKGEubGVuZ3RoID4gMSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9zdG9wSUQgIT09IE5PKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fc3RvcElEKTtcbiAgICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICAgIGlmIChwICE9PSBOTykgcC5fc3RhcnQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgX3JlbW92ZShpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgIGlmICh0YSAhPT0gTk8pIHJldHVybiB0YS5fcmVtb3ZlKGlsKTtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IGkgPSBhLmluZGV4T2YoaWwpO1xuICAgIGlmIChpID4gLTEpIHtcbiAgICAgIGEuc3BsaWNlKGksIDEpO1xuICAgICAgaWYgKHRoaXMuX3Byb2QgIT09IE5PICYmIGEubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgdGhpcy5fZXJyID0gTk87XG4gICAgICAgIHRoaXMuX3N0b3BJRCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fc3RvcE5vdygpKTtcbiAgICAgIH0gZWxzZSBpZiAoYS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdGhpcy5fcHJ1bmVDeWNsZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJZiBhbGwgcGF0aHMgc3RlbW1pbmcgZnJvbSBgdGhpc2Agc3RyZWFtIGV2ZW50dWFsbHkgZW5kIGF0IGB0aGlzYFxuICAvLyBzdHJlYW0sIHRoZW4gd2UgcmVtb3ZlIHRoZSBzaW5nbGUgbGlzdGVuZXIgb2YgYHRoaXNgIHN0cmVhbSwgdG9cbiAgLy8gZm9yY2UgaXQgdG8gZW5kIGl0cyBleGVjdXRpb24gYW5kIGRpc3Bvc2UgcmVzb3VyY2VzLiBUaGlzIG1ldGhvZFxuICAvLyBhc3N1bWVzIGFzIGEgcHJlY29uZGl0aW9uIHRoYXQgdGhpcy5faWxzIGhhcyBqdXN0IG9uZSBsaXN0ZW5lci5cbiAgX3BydW5lQ3ljbGVzKCkge1xuICAgIGlmICh0aGlzLl9oYXNOb1NpbmtzKHRoaXMsIFtdKSkgdGhpcy5fcmVtb3ZlKHRoaXMuX2lsc1swXSk7XG4gIH1cblxuICAvLyBDaGVja3Mgd2hldGhlciAqdGhlcmUgaXMgbm8qIHBhdGggc3RhcnRpbmcgZnJvbSBgeGAgdGhhdCBsZWFkcyB0byBhbiBlbmRcbiAgLy8gbGlzdGVuZXIgKHNpbmspIGluIHRoZSBzdHJlYW0gZ3JhcGgsIGZvbGxvd2luZyBlZGdlcyBBLT5CIHdoZXJlIEIgaXMgYVxuICAvLyBsaXN0ZW5lciBvZiBBLiBUaGlzIG1lYW5zIHRoZXNlIHBhdGhzIGNvbnN0aXR1dGUgYSBjeWNsZSBzb21laG93LiBJcyBnaXZlblxuICAvLyBhIHRyYWNlIG9mIGFsbCB2aXNpdGVkIG5vZGVzIHNvIGZhci5cbiAgX2hhc05vU2lua3MoeDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+LCB0cmFjZTogQXJyYXk8YW55Pik6IGJvb2xlYW4ge1xuICAgIGlmICh0cmFjZS5pbmRleE9mKHgpICE9PSAtMSlcbiAgICAgIHJldHVybiB0cnVlOyBlbHNlXG4gICAgaWYgKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ID09PSB0aGlzKVxuICAgICAgcmV0dXJuIHRydWU7IGVsc2VcbiAgICBpZiAoKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQgJiYgKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQgIT09IE5PKVxuICAgICAgcmV0dXJuIHRoaXMuX2hhc05vU2lua3MoKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQsIHRyYWNlLmNvbmNhdCh4KSk7IGVsc2VcbiAgICBpZiAoKHggYXMgU3RyZWFtPGFueT4pLl9pbHMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBOID0gKHggYXMgU3RyZWFtPGFueT4pLl9pbHMubGVuZ3RoOyBpIDwgTjsgaSsrKVxuICAgICAgICBpZiAoIXRoaXMuX2hhc05vU2lua3MoKHggYXMgU3RyZWFtPGFueT4pLl9pbHNbaV0sIHRyYWNlLmNvbmNhdCh4KSkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgY3RvcigpOiB0eXBlb2YgU3RyZWFtIHtcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIE1lbW9yeVN0cmVhbSA/IE1lbW9yeVN0cmVhbSA6IFN0cmVhbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgTGlzdGVuZXIgdG8gdGhlIFN0cmVhbS5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcn0gbGlzdGVuZXJcbiAgICovXG4gIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pik6IHZvaWQge1xuICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fbiA9IGxpc3RlbmVyLm5leHQgfHwgbm9vcDtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2UgPSBsaXN0ZW5lci5lcnJvciB8fCBub29wO1xuICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fYyA9IGxpc3RlbmVyLmNvbXBsZXRlIHx8IG5vb3A7XG4gICAgdGhpcy5fYWRkKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBMaXN0ZW5lciBmcm9tIHRoZSBTdHJlYW0sIGFzc3VtaW5nIHRoZSBMaXN0ZW5lciB3YXMgYWRkZWQgdG8gaXQuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXI8VD59IGxpc3RlbmVyXG4gICAqL1xuICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiB2b2lkIHtcbiAgICB0aGlzLl9yZW1vdmUobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIExpc3RlbmVyIHRvIHRoZSBTdHJlYW0gcmV0dXJuaW5nIGEgU3Vic2NyaXB0aW9uIHRvIHJlbW92ZSB0aGF0XG4gICAqIGxpc3RlbmVyLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyfSBsaXN0ZW5lclxuICAgKiBAcmV0dXJucyB7U3Vic2NyaXB0aW9ufVxuICAgKi9cbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pik6IFN1YnNjcmlwdGlvbiB7XG4gICAgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW1TdWI8VD4odGhpcywgbGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGludGVyb3AgYmV0d2VlbiBtb3N0LmpzIGFuZCBSeEpTIDVcbiAgICpcbiAgICogQHJldHVybnMge1N0cmVhbX1cbiAgICovXG4gIFskJG9ic2VydmFibGVdKCk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBTdHJlYW0gZ2l2ZW4gYSBQcm9kdWNlci5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb2R1Y2VyfSBwcm9kdWNlciBBbiBvcHRpb25hbCBQcm9kdWNlciB0aGF0IGRpY3RhdGVzIGhvdyB0b1xuICAgKiBzdGFydCwgZ2VuZXJhdGUgZXZlbnRzLCBhbmQgc3RvcCB0aGUgU3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlPFQ+KHByb2R1Y2VyPzogUHJvZHVjZXI8VD4pOiBTdHJlYW08VD4ge1xuICAgIGlmIChwcm9kdWNlcikge1xuICAgICAgaWYgKHR5cGVvZiBwcm9kdWNlci5zdGFydCAhPT0gJ2Z1bmN0aW9uJ1xuICAgICAgfHwgdHlwZW9mIHByb2R1Y2VyLnN0b3AgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncHJvZHVjZXIgcmVxdWlyZXMgYm90aCBzdGFydCBhbmQgc3RvcCBmdW5jdGlvbnMnKTtcbiAgICAgIGludGVybmFsaXplUHJvZHVjZXIocHJvZHVjZXIpOyAvLyBtdXRhdGVzIHRoZSBpbnB1dFxuICAgIH1cbiAgICByZXR1cm4gbmV3IFN0cmVhbShwcm9kdWNlciBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+ICYgUHJvZHVjZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTWVtb3J5U3RyZWFtIGdpdmVuIGEgUHJvZHVjZXIuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9kdWNlcn0gcHJvZHVjZXIgQW4gb3B0aW9uYWwgUHJvZHVjZXIgdGhhdCBkaWN0YXRlcyBob3cgdG9cbiAgICogc3RhcnQsIGdlbmVyYXRlIGV2ZW50cywgYW5kIHN0b3AgdGhlIFN0cmVhbS5cbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZVdpdGhNZW1vcnk8VD4ocHJvZHVjZXI/OiBQcm9kdWNlcjxUPik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgaWYgKHByb2R1Y2VyKSBpbnRlcm5hbGl6ZVByb2R1Y2VyKHByb2R1Y2VyKTsgLy8gbXV0YXRlcyB0aGUgaW5wdXRcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxUPihwcm9kdWNlciBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+ICYgUHJvZHVjZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBkb2VzIG5vdGhpbmcgd2hlbiBzdGFydGVkLiBJdCBuZXZlciBlbWl0cyBhbnkgZXZlbnQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqICAgICAgICAgIG5ldmVyXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBuZXZlcigpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7X3N0YXJ0OiBub29wLCBfc3RvcDogbm9vcH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyB0aGUgXCJjb21wbGV0ZVwiIG5vdGlmaWNhdGlvbiB3aGVuXG4gICAqIHN0YXJ0ZWQsIGFuZCB0aGF0J3MgaXQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGVtcHR5XG4gICAqIC18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBlbXB0eSgpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7XG4gICAgICBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8YW55PikgeyBpbC5fYygpOyB9LFxuICAgICAgX3N0b3A6IG5vb3AsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIGFuIFwiZXJyb3JcIiBub3RpZmljYXRpb24gd2l0aCB0aGVcbiAgICogdmFsdWUgeW91IHBhc3NlZCBhcyB0aGUgYGVycm9yYCBhcmd1bWVudCB3aGVuIHRoZSBzdHJlYW0gc3RhcnRzLCBhbmQgdGhhdCdzXG4gICAqIGl0LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiB0aHJvdyhYKVxuICAgKiAtWFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0gZXJyb3IgVGhlIGVycm9yIGV2ZW50IHRvIGVtaXQgb24gdGhlIGNyZWF0ZWQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgdGhyb3coZXJyb3I6IGFueSk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtcbiAgICAgIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+KSB7IGlsLl9lKGVycm9yKTsgfSxcbiAgICAgIF9zdG9wOiBub29wLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzdHJlYW0gZnJvbSBhbiBBcnJheSwgUHJvbWlzZSwgb3IgYW4gT2JzZXJ2YWJsZS5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge0FycmF5fFByb21pc2VMaWtlfE9ic2VydmFibGV9IGlucHV0IFRoZSBpbnB1dCB0byBtYWtlIGEgc3RyZWFtIGZyb20uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tPFQ+KGlucHV0OiBQcm9taXNlTGlrZTxUPiB8IFN0cmVhbTxUPiB8IEFycmF5PFQ+IHwgT2JzZXJ2YWJsZTxUPik6IFN0cmVhbTxUPiB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dFskJG9ic2VydmFibGVdID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tT2JzZXJ2YWJsZTxUPihpbnB1dCBhcyBPYnNlcnZhYmxlPFQ+KTsgZWxzZVxuICAgIGlmICh0eXBlb2YgKGlucHV0IGFzIFByb21pc2VMaWtlPFQ+KS50aGVuID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tUHJvbWlzZTxUPihpbnB1dCBhcyBQcm9taXNlTGlrZTxUPik7IGVsc2VcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpbnB1dCkpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21BcnJheTxUPihpbnB1dCk7XG5cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBUeXBlIG9mIGlucHV0IHRvIGZyb20oKSBtdXN0IGJlIGFuIEFycmF5LCBQcm9taXNlLCBvciBPYnNlcnZhYmxlYCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIHRoZSBhcmd1bWVudHMgdGhhdCB5b3UgZ2l2ZSB0b1xuICAgKiAqb2YqLCB0aGVuIGNvbXBsZXRlcy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogb2YoMSwyLDMpXG4gICAqIDEyM3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIGEgVGhlIGZpcnN0IHZhbHVlIHlvdSB3YW50IHRvIGVtaXQgYXMgYW4gZXZlbnQgb24gdGhlIHN0cmVhbS5cbiAgICogQHBhcmFtIGIgVGhlIHNlY29uZCB2YWx1ZSB5b3Ugd2FudCB0byBlbWl0IGFzIGFuIGV2ZW50IG9uIHRoZSBzdHJlYW0uIE9uZVxuICAgKiBvciBtb3JlIG9mIHRoZXNlIHZhbHVlcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgb2Y8VD4oLi4uaXRlbXM6IEFycmF5PFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gU3RyZWFtLmZyb21BcnJheTxUPihpdGVtcyk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYW4gYXJyYXkgdG8gYSBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gd2lsbCBlbWl0IHN5bmNocm9ub3VzbHlcbiAgICogYWxsIHRoZSBpdGVtcyBpbiB0aGUgYXJyYXksIGFuZCB0aGVuIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBmcm9tQXJyYXkoWzEsMiwzXSlcbiAgICogMTIzfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbUFycmF5PFQ+KGFycmF5OiBBcnJheTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZyb21BcnJheTxUPihhcnJheSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgcHJvbWlzZSB0byBhIHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSB3aWxsIGVtaXQgdGhlIHJlc29sdmVkXG4gICAqIHZhbHVlIG9mIHRoZSBwcm9taXNlLCBhbmQgdGhlbiBjb21wbGV0ZS4gSG93ZXZlciwgaWYgdGhlIHByb21pc2UgaXNcbiAgICogcmVqZWN0ZWQsIHRoZSBzdHJlYW0gd2lsbCBlbWl0IHRoZSBjb3JyZXNwb25kaW5nIGVycm9yLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBmcm9tUHJvbWlzZSggLS0tLTQyIClcbiAgICogLS0tLS0tLS0tLS0tLS0tLS00MnxcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9taXNlTGlrZX0gcHJvbWlzZSBUaGUgcHJvbWlzZSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tUHJvbWlzZTxUPihwcm9taXNlOiBQcm9taXNlTGlrZTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZyb21Qcm9taXNlPFQ+KHByb21pc2UpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhbiBPYnNlcnZhYmxlIGludG8gYSBTdHJlYW0uXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHthbnl9IG9ic2VydmFibGUgVGhlIG9ic2VydmFibGUgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbU9ic2VydmFibGU8VD4ob2JzOiB7c3Vic2NyaWJlOiBhbnl9KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAoKG9icyBhcyBTdHJlYW08VD4pLmVuZFdoZW4pIHJldHVybiBvYnMgYXMgU3RyZWFtPFQ+O1xuICAgIGNvbnN0IG8gPSB0eXBlb2Ygb2JzWyQkb2JzZXJ2YWJsZV0gPT09ICdmdW5jdGlvbicgPyBvYnNbJCRvYnNlcnZhYmxlXSgpIDogb2JzO1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tT2JzZXJ2YWJsZShvKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHN0cmVhbSB0aGF0IHBlcmlvZGljYWxseSBlbWl0cyBpbmNyZW1lbnRhbCBudW1iZXJzLCBldmVyeVxuICAgKiBgcGVyaW9kYCBtaWxsaXNlY29uZHMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqICAgICBwZXJpb2RpYygxMDAwKVxuICAgKiAtLS0wLS0tMS0tLTItLS0zLS0tNC0tLS4uLlxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge251bWJlcn0gcGVyaW9kIFRoZSBpbnRlcnZhbCBpbiBtaWxsaXNlY29uZHMgdG8gdXNlIGFzIGEgcmF0ZSBvZlxuICAgKiBlbWlzc2lvbi5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIHBlcmlvZGljKHBlcmlvZDogbnVtYmVyKTogU3RyZWFtPG51bWJlcj4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPG51bWJlcj4obmV3IFBlcmlvZGljKHBlcmlvZCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJsZW5kcyBtdWx0aXBsZSBzdHJlYW1zIHRvZ2V0aGVyLCBlbWl0dGluZyBldmVudHMgZnJvbSBhbGwgb2YgdGhlbVxuICAgKiBjb25jdXJyZW50bHkuXG4gICAqXG4gICAqICptZXJnZSogdGFrZXMgbXVsdGlwbGUgc3RyZWFtcyBhcyBhcmd1bWVudHMsIGFuZCBjcmVhdGVzIGEgc3RyZWFtIHRoYXRcbiAgICogYmVoYXZlcyBsaWtlIGVhY2ggb2YgdGhlIGFyZ3VtZW50IHN0cmVhbXMsIGluIHBhcmFsbGVsLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tLS0tNC0tLVxuICAgKiAtLS0tYS0tLS0tYi0tLS1jLS0tZC0tLS0tLVxuICAgKiAgICAgICAgICAgIG1lcmdlXG4gICAqIC0tMS1hLS0yLS1iLS0zLWMtLS1kLS00LS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIG1lcmdlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTIgQSBzdHJlYW0gdG8gbWVyZ2UgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLiBUd29cbiAgICogb3IgbW9yZSBzdHJlYW1zIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBtZXJnZTogTWVyZ2VTaWduYXR1cmUgPSBmdW5jdGlvbiBtZXJnZSguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KG5ldyBNZXJnZShzdHJlYW1zKSk7XG4gIH0gYXMgTWVyZ2VTaWduYXR1cmU7XG5cbiAgLyoqXG4gICAqIENvbWJpbmVzIG11bHRpcGxlIGlucHV0IHN0cmVhbXMgdG9nZXRoZXIgdG8gcmV0dXJuIGEgc3RyZWFtIHdob3NlIGV2ZW50c1xuICAgKiBhcmUgYXJyYXlzIHRoYXQgY29sbGVjdCB0aGUgbGF0ZXN0IGV2ZW50cyBmcm9tIGVhY2ggaW5wdXQgc3RyZWFtLlxuICAgKlxuICAgKiAqY29tYmluZSogaW50ZXJuYWxseSByZW1lbWJlcnMgdGhlIG1vc3QgcmVjZW50IGV2ZW50IGZyb20gZWFjaCBvZiB0aGUgaW5wdXRcbiAgICogc3RyZWFtcy4gV2hlbiBhbnkgb2YgdGhlIGlucHV0IHN0cmVhbXMgZW1pdHMgYW4gZXZlbnQsIHRoYXQgZXZlbnQgdG9nZXRoZXJcbiAgICogd2l0aCBhbGwgdGhlIG90aGVyIHNhdmVkIGV2ZW50cyBhcmUgY29tYmluZWQgaW50byBhbiBhcnJheS4gVGhhdCBhcnJheSB3aWxsXG4gICAqIGJlIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBzdHJlYW0uIEl0J3MgZXNzZW50aWFsbHkgYSB3YXkgb2Ygam9pbmluZyB0b2dldGhlclxuICAgKiB0aGUgZXZlbnRzIGZyb20gbXVsdGlwbGUgc3RyZWFtcy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS1cbiAgICogLS0tLWEtLS0tLWItLS0tLWMtLWQtLS0tLS1cbiAgICogICAgICAgICAgY29tYmluZVxuICAgKiAtLS0tMWEtMmEtMmItM2ItM2MtM2QtNGQtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBjb21iaW5lIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTIgQSBzdHJlYW0gdG8gY29tYmluZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIE11bHRpcGxlIHN0cmVhbXMsIG5vdCBqdXN0IHR3bywgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNvbWJpbmU6IENvbWJpbmVTaWduYXR1cmUgPSBmdW5jdGlvbiBjb21iaW5lKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPEFycmF5PGFueT4+KG5ldyBDb21iaW5lPGFueT4oc3RyZWFtcykpO1xuICB9IGFzIENvbWJpbmVTaWduYXR1cmU7XG5cbiAgcHJvdGVjdGVkIF9tYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBTdHJlYW08VT4gfCBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxVPihuZXcgTWFwT3A8VCwgVT4ocHJvamVjdCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgZWFjaCBldmVudCBmcm9tIHRoZSBpbnB1dCBTdHJlYW0gdGhyb3VnaCBhIGBwcm9qZWN0YCBmdW5jdGlvbixcbiAgICogdG8gZ2V0IGEgU3RyZWFtIHRoYXQgZW1pdHMgdGhvc2UgdHJhbnNmb3JtZWQgZXZlbnRzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0zLS01LS0tLS03LS0tLS0tXG4gICAqICAgIG1hcChpID0+IGkgKiAxMClcbiAgICogLS0xMC0tMzAtNTAtLS0tNzAtLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJvamVjdCBBIGZ1bmN0aW9uIG9mIHR5cGUgYCh0OiBUKSA9PiBVYCB0aGF0IHRha2VzIGV2ZW50XG4gICAqIGB0YCBvZiB0eXBlIGBUYCBmcm9tIHRoZSBpbnB1dCBTdHJlYW0gYW5kIHByb2R1Y2VzIGFuIGV2ZW50IG9mIHR5cGUgYFVgLCB0b1xuICAgKiBiZSBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgU3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBtYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBTdHJlYW08VT4ge1xuICAgIHJldHVybiB0aGlzLl9tYXAocHJvamVjdCk7XG4gIH1cblxuICAvKipcbiAgICogSXQncyBsaWtlIGBtYXBgLCBidXQgdHJhbnNmb3JtcyBlYWNoIGlucHV0IGV2ZW50IHRvIGFsd2F5cyB0aGUgc2FtZVxuICAgKiBjb25zdGFudCB2YWx1ZSBvbiB0aGUgb3V0cHV0IFN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMy0tNS0tLS0tNy0tLS0tXG4gICAqICAgICAgIG1hcFRvKDEwKVxuICAgKiAtLTEwLS0xMC0xMC0tLS0xMC0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBwcm9qZWN0ZWRWYWx1ZSBBIHZhbHVlIHRvIGVtaXQgb24gdGhlIG91dHB1dCBTdHJlYW0gd2hlbmV2ZXIgdGhlXG4gICAqIGlucHV0IFN0cmVhbSBlbWl0cyBhbnkgdmFsdWUuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIG1hcFRvPFU+KHByb2plY3RlZFZhbHVlOiBVKTogU3RyZWFtPFU+IHtcbiAgICBjb25zdCBzID0gdGhpcy5tYXAoKCkgPT4gcHJvamVjdGVkVmFsdWUpO1xuICAgIGNvbnN0IG9wOiBPcGVyYXRvcjxULCBVPiA9IHMuX3Byb2QgYXMgT3BlcmF0b3I8VCwgVT47XG4gICAgb3AudHlwZSA9ICdtYXBUbyc7XG4gICAgcmV0dXJuIHM7XG4gIH1cblxuICBmaWx0ZXI8UyBleHRlbmRzIFQ+KHBhc3NlczogKHQ6IFQpID0+IHQgaXMgUyk6IFN0cmVhbTxTPjtcbiAgZmlsdGVyKHBhc3NlczogKHQ6IFQpID0+IGJvb2xlYW4pOiBTdHJlYW08VD47XG4gIC8qKlxuICAgKiBPbmx5IGFsbG93cyBldmVudHMgdGhhdCBwYXNzIHRoZSB0ZXN0IGdpdmVuIGJ5IHRoZSBgcGFzc2VzYCBhcmd1bWVudC5cbiAgICpcbiAgICogRWFjaCBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gaXMgZ2l2ZW4gdG8gdGhlIGBwYXNzZXNgIGZ1bmN0aW9uLiBJZiB0aGVcbiAgICogZnVuY3Rpb24gcmV0dXJucyBgdHJ1ZWAsIHRoZSBldmVudCBpcyBmb3J3YXJkZWQgdG8gdGhlIG91dHB1dCBzdHJlYW0sXG4gICAqIG90aGVyd2lzZSBpdCBpcyBpZ25vcmVkIGFuZCBub3QgZm9yd2FyZGVkLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0yLS0zLS0tLS00LS0tLS01LS0tNi0tNy04LS1cbiAgICogICAgIGZpbHRlcihpID0+IGkgJSAyID09PSAwKVxuICAgKiAtLS0tLS0yLS0tLS0tLS00LS0tLS0tLS0tNi0tLS04LS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHBhc3NlcyBBIGZ1bmN0aW9uIG9mIHR5cGUgYCh0OiBUKSA9PiBib29sZWFuYCB0aGF0IHRha2VzXG4gICAqIGFuIGV2ZW50IGZyb20gdGhlIGlucHV0IHN0cmVhbSBhbmQgY2hlY2tzIGlmIGl0IHBhc3NlcywgYnkgcmV0dXJuaW5nIGFcbiAgICogYm9vbGVhbi5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZmlsdGVyKHBhc3NlczogKHQ6IFQpID0+IGJvb2xlYW4pOiBTdHJlYW08VD4ge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgIGlmIChwIGluc3RhbmNlb2YgRmlsdGVyKVxuICAgICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZpbHRlcjxUPihcbiAgICAgICAgYW5kKChwIGFzIEZpbHRlcjxUPikuZiwgcGFzc2VzKSxcbiAgICAgICAgKHAgYXMgRmlsdGVyPFQ+KS5pbnNcbiAgICAgICkpO1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGaWx0ZXI8VD4ocGFzc2VzLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogTGV0cyB0aGUgZmlyc3QgYGFtb3VudGAgbWFueSBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHBhc3MgdG8gdGhlXG4gICAqIG91dHB1dCBzdHJlYW0sIHRoZW4gbWFrZXMgdGhlIG91dHB1dCBzdHJlYW0gY29tcGxldGUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLS0tZC0tLWUtLVxuICAgKiAgICB0YWtlKDMpXG4gICAqIC0tYS0tLWItLWN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gYW1vdW50IEhvdyBtYW55IGV2ZW50cyB0byBhbGxvdyBmcm9tIHRoZSBpbnB1dCBzdHJlYW1cbiAgICogYmVmb3JlIGNvbXBsZXRpbmcgdGhlIG91dHB1dCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHRha2UoYW1vdW50OiBudW1iZXIpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgVGFrZTxUPihhbW91bnQsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZ25vcmVzIHRoZSBmaXJzdCBgYW1vdW50YCBtYW55IGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0sIGFuZCB0aGVuXG4gICAqIGFmdGVyIHRoYXQgc3RhcnRzIGZvcndhcmRpbmcgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSB0byB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tLS1kLS0tZS0tXG4gICAqICAgICAgIGRyb3AoMylcbiAgICogLS0tLS0tLS0tLS0tLS1kLS0tZS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gYW1vdW50IEhvdyBtYW55IGV2ZW50cyB0byBpZ25vcmUgZnJvbSB0aGUgaW5wdXQgc3RyZWFtXG4gICAqIGJlZm9yZSBmb3J3YXJkaW5nIGFsbCBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHRvIHRoZSBvdXRwdXQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBkcm9wKGFtb3VudDogbnVtYmVyKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRHJvcDxUPihhbW91bnQsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGVuIHRoZSBpbnB1dCBzdHJlYW0gY29tcGxldGVzLCB0aGUgb3V0cHV0IHN0cmVhbSB3aWxsIGVtaXQgdGhlIGxhc3QgZXZlbnRcbiAgICogZW1pdHRlZCBieSB0aGUgaW5wdXQgc3RyZWFtLCBhbmQgdGhlbiB3aWxsIGFsc28gY29tcGxldGUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLWQtLS0tfFxuICAgKiAgICAgICBsYXN0KClcbiAgICogLS0tLS0tLS0tLS0tLS0tLS1kfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbGFzdCgpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBMYXN0PFQ+KHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwZW5kcyB0aGUgZ2l2ZW4gYGluaXRpYWxgIHZhbHVlIHRvIHRoZSBzZXF1ZW5jZSBvZiBldmVudHMgZW1pdHRlZCBieSB0aGVcbiAgICogaW5wdXQgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIGlzIGEgTWVtb3J5U3RyZWFtLCB3aGljaCBtZWFucyBpdCBpc1xuICAgKiBhbHJlYWR5IGByZW1lbWJlcigpYCdkLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLS0xLS0tMi0tLS0tMy0tLVxuICAgKiAgIHN0YXJ0V2l0aCgwKVxuICAgKiAwLS0xLS0tMi0tLS0tMy0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGluaXRpYWwgVGhlIHZhbHVlIG9yIGV2ZW50IHRvIHByZXBlbmQuXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHN0YXJ0V2l0aChpbml0aWFsOiBUKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxUPihuZXcgU3RhcnRXaXRoPFQ+KHRoaXMsIGluaXRpYWwpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VzIGFub3RoZXIgc3RyZWFtIHRvIGRldGVybWluZSB3aGVuIHRvIGNvbXBsZXRlIHRoZSBjdXJyZW50IHN0cmVhbS5cbiAgICpcbiAgICogV2hlbiB0aGUgZ2l2ZW4gYG90aGVyYCBzdHJlYW0gZW1pdHMgYW4gZXZlbnQgb3IgY29tcGxldGVzLCB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbSB3aWxsIGNvbXBsZXRlLiBCZWZvcmUgdGhhdCBoYXBwZW5zLCB0aGUgb3V0cHV0IHN0cmVhbSB3aWxsIGJlaGF2ZXNcbiAgICogbGlrZSB0aGUgaW5wdXQgc3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLS0xLS0tMi0tLS0tMy0tNC0tLS01LS0tLTYtLS1cbiAgICogICBlbmRXaGVuKCAtLS0tLS0tLWEtLWItLXwgKVxuICAgKiAtLS0xLS0tMi0tLS0tMy0tNC0tfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIG90aGVyIFNvbWUgb3RoZXIgc3RyZWFtIHRoYXQgaXMgdXNlZCB0byBrbm93IHdoZW4gc2hvdWxkIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtIG9mIHRoaXMgb3BlcmF0b3IgY29tcGxldGUuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGVuZFdoZW4ob3RoZXI6IFN0cmVhbTxhbnk+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IEVuZFdoZW48VD4ob3RoZXIsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBcIkZvbGRzXCIgdGhlIHN0cmVhbSBvbnRvIGl0c2VsZi5cbiAgICpcbiAgICogQ29tYmluZXMgZXZlbnRzIGZyb20gdGhlIHBhc3QgdGhyb3VnaG91dFxuICAgKiB0aGUgZW50aXJlIGV4ZWN1dGlvbiBvZiB0aGUgaW5wdXQgc3RyZWFtLCBhbGxvd2luZyB5b3UgdG8gYWNjdW11bGF0ZSB0aGVtXG4gICAqIHRvZ2V0aGVyLiBJdCdzIGVzc2VudGlhbGx5IGxpa2UgYEFycmF5LnByb3RvdHlwZS5yZWR1Y2VgLiBUaGUgcmV0dXJuZWRcbiAgICogc3RyZWFtIGlzIGEgTWVtb3J5U3RyZWFtLCB3aGljaCBtZWFucyBpdCBpcyBhbHJlYWR5IGByZW1lbWJlcigpYCdkLlxuICAgKlxuICAgKiBUaGUgb3V0cHV0IHN0cmVhbSBzdGFydHMgYnkgZW1pdHRpbmcgdGhlIGBzZWVkYCB3aGljaCB5b3UgZ2l2ZSBhcyBhcmd1bWVudC5cbiAgICogVGhlbiwgd2hlbiBhbiBldmVudCBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIGl0IGlzIGNvbWJpbmVkIHdpdGggdGhhdFxuICAgKiBzZWVkIHZhbHVlIHRocm91Z2ggdGhlIGBhY2N1bXVsYXRlYCBmdW5jdGlvbiwgYW5kIHRoZSBvdXRwdXQgdmFsdWUgaXNcbiAgICogZW1pdHRlZCBvbiB0aGUgb3V0cHV0IHN0cmVhbS4gYGZvbGRgIHJlbWVtYmVycyB0aGF0IG91dHB1dCB2YWx1ZSBhcyBgYWNjYFxuICAgKiAoXCJhY2N1bXVsYXRvclwiKSwgYW5kIHRoZW4gd2hlbiBhIG5ldyBpbnB1dCBldmVudCBgdGAgaGFwcGVucywgYGFjY2Agd2lsbCBiZVxuICAgKiBjb21iaW5lZCB3aXRoIHRoYXQgdG8gcHJvZHVjZSB0aGUgbmV3IGBhY2NgIGFuZCBzbyBmb3J0aC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tLS0tMS0tLS0tMS0tMi0tLS0xLS0tLTEtLS0tLS1cbiAgICogICBmb2xkKChhY2MsIHgpID0+IGFjYyArIHgsIDMpXG4gICAqIDMtLS0tLTQtLS0tLTUtLTctLS0tOC0tLS05LS0tLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBhY2N1bXVsYXRlIEEgZnVuY3Rpb24gb2YgdHlwZSBgKGFjYzogUiwgdDogVCkgPT4gUmAgdGhhdFxuICAgKiB0YWtlcyB0aGUgcHJldmlvdXMgYWNjdW11bGF0ZWQgdmFsdWUgYGFjY2AgYW5kIHRoZSBpbmNvbWluZyBldmVudCBmcm9tIHRoZVxuICAgKiBpbnB1dCBzdHJlYW0gYW5kIHByb2R1Y2VzIHRoZSBuZXcgYWNjdW11bGF0ZWQgdmFsdWUuXG4gICAqIEBwYXJhbSBzZWVkIFRoZSBpbml0aWFsIGFjY3VtdWxhdGVkIHZhbHVlLCBvZiB0eXBlIGBSYC5cbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgZm9sZDxSPihhY2N1bXVsYXRlOiAoYWNjOiBSLCB0OiBUKSA9PiBSLCBzZWVkOiBSKTogTWVtb3J5U3RyZWFtPFI+IHtcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxSPihuZXcgRm9sZDxULCBSPihhY2N1bXVsYXRlLCBzZWVkLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVwbGFjZXMgYW4gZXJyb3Igd2l0aCBhbm90aGVyIHN0cmVhbS5cbiAgICpcbiAgICogV2hlbiAoYW5kIGlmKSBhbiBlcnJvciBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIGluc3RlYWQgb2YgZm9yd2FyZGluZ1xuICAgKiB0aGF0IGVycm9yIHRvIHRoZSBvdXRwdXQgc3RyZWFtLCAqcmVwbGFjZUVycm9yKiB3aWxsIGNhbGwgdGhlIGByZXBsYWNlYFxuICAgKiBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBzdHJlYW0gdGhhdCB0aGUgb3V0cHV0IHN0cmVhbSB3aWxsIHJlcGxpY2F0ZS5cbiAgICogQW5kLCBpbiBjYXNlIHRoYXQgbmV3IHN0cmVhbSBhbHNvIGVtaXRzIGFuIGVycm9yLCBgcmVwbGFjZWAgd2lsbCBiZSBjYWxsZWRcbiAgICogYWdhaW4gdG8gZ2V0IGFub3RoZXIgc3RyZWFtIHRvIHN0YXJ0IHJlcGxpY2F0aW5nLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0yLS0tLS0zLS00LS0tLS1YXG4gICAqICAgcmVwbGFjZUVycm9yKCAoKSA9PiAtLTEwLS18IClcbiAgICogLS0xLS0tMi0tLS0tMy0tNC0tLS0tLS0tMTAtLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHJlcGxhY2UgQSBmdW5jdGlvbiBvZiB0eXBlIGAoZXJyKSA9PiBTdHJlYW1gIHRoYXQgdGFrZXNcbiAgICogdGhlIGVycm9yIHRoYXQgb2NjdXJyZWQgb24gdGhlIGlucHV0IHN0cmVhbSBvciBvbiB0aGUgcHJldmlvdXMgcmVwbGFjZW1lbnRcbiAgICogc3RyZWFtIGFuZCByZXR1cm5zIGEgbmV3IHN0cmVhbS4gVGhlIG91dHB1dCBzdHJlYW0gd2lsbCBiZWhhdmUgbGlrZSB0aGVcbiAgICogc3RyZWFtIHRoYXQgdGhpcyBmdW5jdGlvbiByZXR1cm5zLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICByZXBsYWNlRXJyb3IocmVwbGFjZTogKGVycjogYW55KSA9PiBTdHJlYW08VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgUmVwbGFjZUVycm9yPFQ+KHJlcGxhY2UsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGbGF0dGVucyBhIFwic3RyZWFtIG9mIHN0cmVhbXNcIiwgaGFuZGxpbmcgb25seSBvbmUgbmVzdGVkIHN0cmVhbSBhdCBhIHRpbWVcbiAgICogKG5vIGNvbmN1cnJlbmN5KS5cbiAgICpcbiAgICogSWYgdGhlIGlucHV0IHN0cmVhbSBpcyBhIHN0cmVhbSB0aGF0IGVtaXRzIHN0cmVhbXMsIHRoZW4gdGhpcyBvcGVyYXRvciB3aWxsXG4gICAqIHJldHVybiBhbiBvdXRwdXQgc3RyZWFtIHdoaWNoIGlzIGEgZmxhdCBzdHJlYW06IGVtaXRzIHJlZ3VsYXIgZXZlbnRzLiBUaGVcbiAgICogZmxhdHRlbmluZyBoYXBwZW5zIHdpdGhvdXQgY29uY3VycmVuY3kuIEl0IHdvcmtzIGxpa2UgdGhpczogd2hlbiB0aGUgaW5wdXRcbiAgICogc3RyZWFtIGVtaXRzIGEgbmVzdGVkIHN0cmVhbSwgKmZsYXR0ZW4qIHdpbGwgc3RhcnQgaW1pdGF0aW5nIHRoYXQgbmVzdGVkXG4gICAqIG9uZS4gSG93ZXZlciwgYXMgc29vbiBhcyB0aGUgbmV4dCBuZXN0ZWQgc3RyZWFtIGlzIGVtaXR0ZWQgb24gdGhlIGlucHV0XG4gICAqIHN0cmVhbSwgKmZsYXR0ZW4qIHdpbGwgZm9yZ2V0IHRoZSBwcmV2aW91cyBuZXN0ZWQgb25lIGl0IHdhcyBpbWl0YXRpbmcsIGFuZFxuICAgKiB3aWxsIHN0YXJ0IGltaXRhdGluZyB0aGUgbmV3IG5lc3RlZCBvbmUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tKy0tLS0tLS0tKy0tLS0tLS0tLS0tLS0tLVxuICAgKiAgIFxcICAgICAgICBcXFxuICAgKiAgICBcXCAgICAgICAtLS0tMS0tLS0yLS0tMy0tXG4gICAqICAgIC0tYS0tYi0tLS1jLS0tLWQtLS0tLS0tLVxuICAgKiAgICAgICAgICAgZmxhdHRlblxuICAgKiAtLS0tLWEtLWItLS0tLS0xLS0tLTItLS0zLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGZsYXR0ZW48Uj4odGhpczogU3RyZWFtPFN0cmVhbTxSPj4pOiBUIHtcbiAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxSPihuZXcgRmxhdHRlbih0aGlzKSkgYXMgVCAmIFN0cmVhbTxSPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXNzZXMgdGhlIGlucHV0IHN0cmVhbSB0byBhIGN1c3RvbSBvcGVyYXRvciwgdG8gcHJvZHVjZSBhbiBvdXRwdXQgc3RyZWFtLlxuICAgKlxuICAgKiAqY29tcG9zZSogaXMgYSBoYW5keSB3YXkgb2YgdXNpbmcgYW4gZXhpc3RpbmcgZnVuY3Rpb24gaW4gYSBjaGFpbmVkIHN0eWxlLlxuICAgKiBJbnN0ZWFkIG9mIHdyaXRpbmcgYG91dFN0cmVhbSA9IGYoaW5TdHJlYW0pYCB5b3UgY2FuIHdyaXRlXG4gICAqIGBvdXRTdHJlYW0gPSBpblN0cmVhbS5jb21wb3NlKGYpYC5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gb3BlcmF0b3IgQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgc3RyZWFtIGFzIGlucHV0IGFuZFxuICAgKiByZXR1cm5zIGEgc3RyZWFtIGFzIHdlbGwuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGNvbXBvc2U8VT4ob3BlcmF0b3I6IChzdHJlYW06IFN0cmVhbTxUPikgPT4gVSk6IFUge1xuICAgIHJldHVybiBvcGVyYXRvcih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG91dHB1dCBzdHJlYW0gdGhhdCBiZWhhdmVzIGxpa2UgdGhlIGlucHV0IHN0cmVhbSwgYnV0IGFsc29cbiAgICogcmVtZW1iZXJzIHRoZSBtb3N0IHJlY2VudCBldmVudCB0aGF0IGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgc28gdGhhdCBhXG4gICAqIG5ld2x5IGFkZGVkIGxpc3RlbmVyIHdpbGwgaW1tZWRpYXRlbHkgcmVjZWl2ZSB0aGF0IG1lbW9yaXNlZCBldmVudC5cbiAgICpcbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgcmVtZW1iZXIoKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxUPihuZXcgUmVtZW1iZXI8VD4odGhpcykpO1xuICB9XG5cbiAgZGVidWcoKTogU3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiBzdHJpbmcpOiBTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6ICh0OiBUKSA9PiBhbnkpOiBTdHJlYW08VD47XG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG91dHB1dCBzdHJlYW0gdGhhdCBpZGVudGljYWxseSBiZWhhdmVzIGxpa2UgdGhlIGlucHV0IHN0cmVhbSxcbiAgICogYnV0IGFsc28gcnVucyBhIGBzcHlgIGZ1bmN0aW9uIGZvciBlYWNoIGV2ZW50LCB0byBoZWxwIHlvdSBkZWJ1ZyB5b3VyIGFwcC5cbiAgICpcbiAgICogKmRlYnVnKiB0YWtlcyBhIGBzcHlgIGZ1bmN0aW9uIGFzIGFyZ3VtZW50LCBhbmQgcnVucyB0aGF0IGZvciBlYWNoIGV2ZW50XG4gICAqIGhhcHBlbmluZyBvbiB0aGUgaW5wdXQgc3RyZWFtLiBJZiB5b3UgZG9uJ3QgcHJvdmlkZSB0aGUgYHNweWAgYXJndW1lbnQsXG4gICAqIHRoZW4gKmRlYnVnKiB3aWxsIGp1c3QgYGNvbnNvbGUubG9nYCBlYWNoIGV2ZW50LiBUaGlzIGhlbHBzIHlvdSB0b1xuICAgKiB1bmRlcnN0YW5kIHRoZSBmbG93IG9mIGV2ZW50cyB0aHJvdWdoIHNvbWUgb3BlcmF0b3IgY2hhaW4uXG4gICAqXG4gICAqIFBsZWFzZSBub3RlIHRoYXQgaWYgdGhlIG91dHB1dCBzdHJlYW0gaGFzIG5vIGxpc3RlbmVycywgdGhlbiBpdCB3aWxsIG5vdFxuICAgKiBzdGFydCwgd2hpY2ggbWVhbnMgYHNweWAgd2lsbCBuZXZlciBydW4gYmVjYXVzZSBubyBhY3R1YWwgZXZlbnQgaGFwcGVucyBpblxuICAgKiB0aGF0IGNhc2UuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS00LS1cbiAgICogICAgICAgICBkZWJ1Z1xuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tNC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsYWJlbE9yU3B5IEEgc3RyaW5nIHRvIHVzZSBhcyB0aGUgbGFiZWwgd2hlbiBwcmludGluZ1xuICAgKiBkZWJ1ZyBpbmZvcm1hdGlvbiBvbiB0aGUgY29uc29sZSwgb3IgYSAnc3B5JyBmdW5jdGlvbiB0aGF0IHRha2VzIGFuIGV2ZW50XG4gICAqIGFzIGFyZ3VtZW50LCBhbmQgZG9lcyBub3QgbmVlZCB0byByZXR1cm4gYW55dGhpbmcuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGRlYnVnKGxhYmVsT3JTcHk/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgRGVidWc8VD4odGhpcywgbGFiZWxPclNweSkpO1xuICB9XG5cbiAgLyoqXG4gICAqICppbWl0YXRlKiBjaGFuZ2VzIHRoaXMgY3VycmVudCBTdHJlYW0gdG8gZW1pdCB0aGUgc2FtZSBldmVudHMgdGhhdCB0aGVcbiAgICogYG90aGVyYCBnaXZlbiBTdHJlYW0gZG9lcy4gVGhpcyBtZXRob2QgcmV0dXJucyBub3RoaW5nLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBleGlzdHMgdG8gYWxsb3cgb25lIHRoaW5nOiAqKmNpcmN1bGFyIGRlcGVuZGVuY3kgb2Ygc3RyZWFtcyoqLlxuICAgKiBGb3IgaW5zdGFuY2UsIGxldCdzIGltYWdpbmUgdGhhdCBmb3Igc29tZSByZWFzb24geW91IG5lZWQgdG8gY3JlYXRlIGFcbiAgICogY2lyY3VsYXIgZGVwZW5kZW5jeSB3aGVyZSBzdHJlYW0gYGZpcnN0JGAgZGVwZW5kcyBvbiBzdHJlYW0gYHNlY29uZCRgXG4gICAqIHdoaWNoIGluIHR1cm4gZGVwZW5kcyBvbiBgZmlyc3QkYDpcbiAgICpcbiAgICogPCEtLSBza2lwLWV4YW1wbGUgLS0+XG4gICAqIGBgYGpzXG4gICAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICAgKlxuICAgKiB2YXIgZmlyc3QkID0gc2Vjb25kJC5tYXAoeCA9PiB4ICogMTApLnRha2UoMyk7XG4gICAqIHZhciBzZWNvbmQkID0gZmlyc3QkLm1hcCh4ID0+IHggKyAxKS5zdGFydFdpdGgoMSkuY29tcG9zZShkZWxheSgxMDApKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEhvd2V2ZXIsIHRoYXQgaXMgaW52YWxpZCBKYXZhU2NyaXB0LCBiZWNhdXNlIGBzZWNvbmQkYCBpcyB1bmRlZmluZWRcbiAgICogb24gdGhlIGZpcnN0IGxpbmUuIFRoaXMgaXMgaG93ICppbWl0YXRlKiBjYW4gaGVscCBzb2x2ZSBpdDpcbiAgICpcbiAgICogYGBganNcbiAgICogaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknXG4gICAqXG4gICAqIHZhciBzZWNvbmRQcm94eSQgPSB4cy5jcmVhdGUoKTtcbiAgICogdmFyIGZpcnN0JCA9IHNlY29uZFByb3h5JC5tYXAoeCA9PiB4ICogMTApLnRha2UoMyk7XG4gICAqIHZhciBzZWNvbmQkID0gZmlyc3QkLm1hcCh4ID0+IHggKyAxKS5zdGFydFdpdGgoMSkuY29tcG9zZShkZWxheSgxMDApKTtcbiAgICogc2Vjb25kUHJveHkkLmltaXRhdGUoc2Vjb25kJCk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBXZSBjcmVhdGUgYHNlY29uZFByb3h5JGAgYmVmb3JlIHRoZSBvdGhlcnMsIHNvIGl0IGNhbiBiZSB1c2VkIGluIHRoZVxuICAgKiBkZWNsYXJhdGlvbiBvZiBgZmlyc3QkYC4gVGhlbiwgYWZ0ZXIgYm90aCBgZmlyc3QkYCBhbmQgYHNlY29uZCRgIGFyZVxuICAgKiBkZWZpbmVkLCB3ZSBob29rIGBzZWNvbmRQcm94eSRgIHdpdGggYHNlY29uZCRgIHdpdGggYGltaXRhdGUoKWAgdG8gdGVsbFxuICAgKiB0aGF0IHRoZXkgYXJlIFwidGhlIHNhbWVcIi4gYGltaXRhdGVgIHdpbGwgbm90IHRyaWdnZXIgdGhlIHN0YXJ0IG9mIGFueVxuICAgKiBzdHJlYW0sIGl0IGp1c3QgYmluZHMgYHNlY29uZFByb3h5JGAgYW5kIGBzZWNvbmQkYCB0b2dldGhlci5cbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBpcyBhbiBleGFtcGxlIHdoZXJlIGBpbWl0YXRlKClgIGlzIGltcG9ydGFudCBpbiBDeWNsZS5qc1xuICAgKiBhcHBsaWNhdGlvbnMuIEEgcGFyZW50IGNvbXBvbmVudCBjb250YWlucyBzb21lIGNoaWxkIGNvbXBvbmVudHMuIEEgY2hpbGRcbiAgICogaGFzIGFuIGFjdGlvbiBzdHJlYW0gd2hpY2ggaXMgZ2l2ZW4gdG8gdGhlIHBhcmVudCB0byBkZWZpbmUgaXRzIHN0YXRlOlxuICAgKlxuICAgKiA8IS0tIHNraXAtZXhhbXBsZSAtLT5cbiAgICogYGBganNcbiAgICogY29uc3QgY2hpbGRBY3Rpb25Qcm94eSQgPSB4cy5jcmVhdGUoKTtcbiAgICogY29uc3QgcGFyZW50ID0gUGFyZW50KHsuLi5zb3VyY2VzLCBjaGlsZEFjdGlvbiQ6IGNoaWxkQWN0aW9uUHJveHkkfSk7XG4gICAqIGNvbnN0IGNoaWxkQWN0aW9uJCA9IHBhcmVudC5zdGF0ZSQubWFwKHMgPT4gcy5jaGlsZC5hY3Rpb24kKS5mbGF0dGVuKCk7XG4gICAqIGNoaWxkQWN0aW9uUHJveHkkLmltaXRhdGUoY2hpbGRBY3Rpb24kKTtcbiAgICogYGBgXG4gICAqXG4gICAqIE5vdGUsIHRob3VnaCwgdGhhdCAqKmBpbWl0YXRlKClgIGRvZXMgbm90IHN1cHBvcnQgTWVtb3J5U3RyZWFtcyoqLiBJZiB3ZVxuICAgKiB3b3VsZCBhdHRlbXB0IHRvIGltaXRhdGUgYSBNZW1vcnlTdHJlYW0gaW4gYSBjaXJjdWxhciBkZXBlbmRlbmN5LCB3ZSB3b3VsZFxuICAgKiBlaXRoZXIgZ2V0IGEgcmFjZSBjb25kaXRpb24gKHdoZXJlIHRoZSBzeW1wdG9tIHdvdWxkIGJlIFwibm90aGluZyBoYXBwZW5zXCIpXG4gICAqIG9yIGFuIGluZmluaXRlIGN5Y2xpYyBlbWlzc2lvbiBvZiB2YWx1ZXMuIEl0J3MgdXNlZnVsIHRvIHRoaW5rIGFib3V0XG4gICAqIE1lbW9yeVN0cmVhbXMgYXMgY2VsbHMgaW4gYSBzcHJlYWRzaGVldC4gSXQgZG9lc24ndCBtYWtlIGFueSBzZW5zZSB0b1xuICAgKiBkZWZpbmUgYSBzcHJlYWRzaGVldCBjZWxsIGBBMWAgd2l0aCBhIGZvcm11bGEgdGhhdCBkZXBlbmRzIG9uIGBCMWAgYW5kXG4gICAqIGNlbGwgYEIxYCBkZWZpbmVkIHdpdGggYSBmb3JtdWxhIHRoYXQgZGVwZW5kcyBvbiBgQTFgLlxuICAgKlxuICAgKiBJZiB5b3UgZmluZCB5b3Vyc2VsZiB3YW50aW5nIHRvIHVzZSBgaW1pdGF0ZSgpYCB3aXRoIGFcbiAgICogTWVtb3J5U3RyZWFtLCB5b3Ugc2hvdWxkIHJld29yayB5b3VyIGNvZGUgYXJvdW5kIGBpbWl0YXRlKClgIHRvIHVzZSBhXG4gICAqIFN0cmVhbSBpbnN0ZWFkLiBMb29rIGZvciB0aGUgc3RyZWFtIGluIHRoZSBjaXJjdWxhciBkZXBlbmRlbmN5IHRoYXRcbiAgICogcmVwcmVzZW50cyBhbiBldmVudCBzdHJlYW0sIGFuZCB0aGF0IHdvdWxkIGJlIGEgY2FuZGlkYXRlIGZvciBjcmVhdGluZyBhXG4gICAqIHByb3h5IFN0cmVhbSB3aGljaCB0aGVuIGltaXRhdGVzIHRoZSB0YXJnZXQgU3RyZWFtLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gdGFyZ2V0IFRoZSBvdGhlciBzdHJlYW0gdG8gaW1pdGF0ZSBvbiB0aGUgY3VycmVudCBvbmUuIE11c3RcbiAgICogbm90IGJlIGEgTWVtb3J5U3RyZWFtLlxuICAgKi9cbiAgaW1pdGF0ZSh0YXJnZXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBNZW1vcnlTdHJlYW0pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgTWVtb3J5U3RyZWFtIHdhcyBnaXZlbiB0byBpbWl0YXRlKCksIGJ1dCBpdCBvbmx5ICcgK1xuICAgICAgJ3N1cHBvcnRzIGEgU3RyZWFtLiBSZWFkIG1vcmUgYWJvdXQgdGhpcyByZXN0cmljdGlvbiBoZXJlOiAnICtcbiAgICAgICdodHRwczovL2dpdGh1Yi5jb20vc3RhbHR6L3hzdHJlYW0jZmFxJyk7XG4gICAgdGhpcy5fdGFyZ2V0ID0gdGFyZ2V0O1xuICAgIGZvciAobGV0IGlscyA9IHRoaXMuX2lscywgTiA9IGlscy5sZW5ndGgsIGkgPSAwOyBpIDwgTjsgaSsrKSB0YXJnZXQuX2FkZChpbHNbaV0pO1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIGdpdmVuIHZhbHVlIHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIFwibmV4dFwiIHZhbHVlIHlvdSB3YW50IHRvIGJyb2FkY2FzdCB0byBhbGwgbGlzdGVuZXJzIG9mXG4gICAqIHRoaXMgU3RyZWFtLlxuICAgKi9cbiAgc2hhbWVmdWxseVNlbmROZXh0KHZhbHVlOiBUKSB7XG4gICAgdGhpcy5fbih2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgZ2l2ZW4gZXJyb3IgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBlcnJvciBUaGUgZXJyb3IgeW91IHdhbnQgdG8gYnJvYWRjYXN0IHRvIGFsbCB0aGUgbGlzdGVuZXJzIG9mXG4gICAqIHRoaXMgU3RyZWFtLlxuICAgKi9cbiAgc2hhbWVmdWxseVNlbmRFcnJvcihlcnJvcjogYW55KSB7XG4gICAgdGhpcy5fZShlcnJvcik7XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgXCJjb21wbGV0ZWRcIiBldmVudCB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kQ29tcGxldGUoKSB7XG4gICAgdGhpcy5fYygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBcImRlYnVnXCIgbGlzdGVuZXIgdG8gdGhlIHN0cmVhbS4gVGhlcmUgY2FuIG9ubHkgYmUgb25lIGRlYnVnXG4gICAqIGxpc3RlbmVyLCB0aGF0J3Mgd2h5IHRoaXMgaXMgJ3NldERlYnVnTGlzdGVuZXInLiBUbyByZW1vdmUgdGhlIGRlYnVnXG4gICAqIGxpc3RlbmVyLCBqdXN0IGNhbGwgc2V0RGVidWdMaXN0ZW5lcihudWxsKS5cbiAgICpcbiAgICogQSBkZWJ1ZyBsaXN0ZW5lciBpcyBsaWtlIGFueSBvdGhlciBsaXN0ZW5lci4gVGhlIG9ubHkgZGlmZmVyZW5jZSBpcyB0aGF0IGFcbiAgICogZGVidWcgbGlzdGVuZXIgaXMgXCJzdGVhbHRoeVwiOiBpdHMgcHJlc2VuY2UvYWJzZW5jZSBkb2VzIG5vdCB0cmlnZ2VyIHRoZVxuICAgKiBzdGFydC9zdG9wIG9mIHRoZSBzdHJlYW0gKG9yIHRoZSBwcm9kdWNlciBpbnNpZGUgdGhlIHN0cmVhbSkuIFRoaXMgaXNcbiAgICogdXNlZnVsIHNvIHlvdSBjYW4gaW5zcGVjdCB3aGF0IGlzIGdvaW5nIG9uIHdpdGhvdXQgY2hhbmdpbmcgdGhlIGJlaGF2aW9yXG4gICAqIG9mIHRoZSBwcm9ncmFtLiBJZiB5b3UgaGF2ZSBhbiBpZGxlIHN0cmVhbSBhbmQgeW91IGFkZCBhIG5vcm1hbCBsaXN0ZW5lciB0b1xuICAgKiBpdCwgdGhlIHN0cmVhbSB3aWxsIHN0YXJ0IGV4ZWN1dGluZy4gQnV0IGlmIHlvdSBzZXQgYSBkZWJ1ZyBsaXN0ZW5lciBvbiBhblxuICAgKiBpZGxlIHN0cmVhbSwgaXQgd29uJ3Qgc3RhcnQgZXhlY3V0aW5nIChub3QgdW50aWwgdGhlIGZpcnN0IG5vcm1hbCBsaXN0ZW5lclxuICAgKiBpcyBhZGRlZCkuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgd2UgZG9uJ3QgcmVjb21tZW5kIHVzaW5nIHRoaXMgbWV0aG9kIHRvIGJ1aWxkIGFwcFxuICAgKiBsb2dpYy4gSW4gZmFjdCwgaW4gbW9zdCBjYXNlcyB0aGUgZGVidWcgb3BlcmF0b3Igd29ya3MganVzdCBmaW5lLiBPbmx5IHVzZVxuICAgKiB0aGlzIG9uZSBpZiB5b3Uga25vdyB3aGF0IHlvdSdyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcjxUPn0gbGlzdGVuZXJcbiAgICovXG4gIHNldERlYnVnTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+IHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX2QgPSBmYWxzZTtcbiAgICAgIHRoaXMuX2RsID0gTk8gYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZCA9IHRydWU7XG4gICAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX24gPSBsaXN0ZW5lci5uZXh0IHx8IG5vb3A7XG4gICAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2UgPSBsaXN0ZW5lci5lcnJvciB8fCBub29wO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9jID0gbGlzdGVuZXIuY29tcGxldGUgfHwgbm9vcDtcbiAgICAgIHRoaXMuX2RsID0gbGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0cmVhbTxUPiBleHRlbmRzIFN0cmVhbTxUPiB7XG4gIHByaXZhdGUgX3Y6IFQ7XG4gIHByaXZhdGUgX2hhczogYm9vbGVhbiA9IGZhbHNlO1xuICBjb25zdHJ1Y3Rvcihwcm9kdWNlcjogSW50ZXJuYWxQcm9kdWNlcjxUPikge1xuICAgIHN1cGVyKHByb2R1Y2VyKTtcbiAgfVxuXG4gIF9uKHg6IFQpIHtcbiAgICB0aGlzLl92ID0geDtcbiAgICB0aGlzLl9oYXMgPSB0cnVlO1xuICAgIHN1cGVyLl9uKHgpO1xuICB9XG5cbiAgX2FkZChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgIGlmICh0YSAhPT0gTk8pIHJldHVybiB0YS5fYWRkKGlsKTtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGEucHVzaChpbCk7XG4gICAgaWYgKGEubGVuZ3RoID4gMSkge1xuICAgICAgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9zdG9wSUQgIT09IE5PKSB7XG4gICAgICBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zdG9wSUQpO1xuICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgfSBlbHNlIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpOyBlbHNlIHtcbiAgICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgICAgaWYgKHAgIT09IE5PKSBwLl9zdGFydCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBfc3RvcE5vdygpIHtcbiAgICB0aGlzLl9oYXMgPSBmYWxzZTtcbiAgICBzdXBlci5fc3RvcE5vdygpO1xuICB9XG5cbiAgX3goKTogdm9pZCB7XG4gICAgdGhpcy5faGFzID0gZmFsc2U7XG4gICAgc3VwZXIuX3goKTtcbiAgfVxuXG4gIG1hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IE1lbW9yeVN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIHRoaXMuX21hcChwcm9qZWN0KSBhcyBNZW1vcnlTdHJlYW08VT47XG4gIH1cblxuICBtYXBUbzxVPihwcm9qZWN0ZWRWYWx1ZTogVSk6IE1lbW9yeVN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIHN1cGVyLm1hcFRvKHByb2plY3RlZFZhbHVlKSBhcyBNZW1vcnlTdHJlYW08VT47XG4gIH1cblxuICB0YWtlKGFtb3VudDogbnVtYmVyKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIudGFrZShhbW91bnQpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIGVuZFdoZW4ob3RoZXI6IFN0cmVhbTxhbnk+KTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIuZW5kV2hlbihvdGhlcikgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG5cbiAgcmVwbGFjZUVycm9yKHJlcGxhY2U6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+KTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIucmVwbGFjZUVycm9yKHJlcGxhY2UpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIHJlbWVtYmVyKCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkZWJ1ZygpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6IHN0cmluZyk6IE1lbW9yeVN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogKHQ6IFQpID0+IGFueSk6IE1lbW9yeVN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweT86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSB8IHVuZGVmaW5lZCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLmRlYnVnKGxhYmVsT3JTcHkgYXMgYW55KSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cbn1cblxuZXhwb3J0IHtOTywgTk9fSUx9O1xuY29uc3QgeHMgPSBTdHJlYW07XG50eXBlIHhzPFQ+ID0gU3RyZWFtPFQ+O1xuZXhwb3J0IGRlZmF1bHQgeHM7XG4iLCJpbXBvcnQgeHMgZnJvbSAneHN0cmVhbSc7XG5pbXBvcnQge1N0cmVhbX0gZnJvbSAneHN0cmVhbSc7XG5pbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSc7XG5pbXBvcnQge0RPTVNvdXJjZSwgZGl2LCBWTm9kZX0gZnJvbSAnQGN5Y2xlL2RvbSc7XG5pbXBvcnQge1N0YXRlU291cmNlLCBSZWR1Y2VyfSBmcm9tICdAY3ljbGUvc3RhdGUnO1xuaW1wb3J0IHtSZXN1bHR9IGZyb20gJ0BjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvbic7XG5pbXBvcnQge1xuICBGYWNpYWxFeHByZXNzaW9uQWN0aW9uLFxuICBUd29TcGVlY2hidWJibGVzQWN0aW9uLFxufSBmcm9tICdAY3ljbGUtcm9ib3QtZHJpdmVycy9zY3JlZW4nO1xuaW1wb3J0IHtcbiAgRmFjaWFsRXhwcmVzc2lvbkFjdGlvblNpbmtzIGFzIEZFQVNpbmtzLFxuICBUd29TcGVlY2hidXR0b25zQWN0aW9uU2lua3MgYXMgVFdBU2lua3MsXG59IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0YXRlIHtcbiAgRmFjaWFsRXhwcmVzc2lvbkFjdGlvbjoge3Jlc3VsdDogUmVzdWx0fSxcbiAgVHdvU3BlZWNoYnViYmxlc0FjdGlvbjoge3Jlc3VsdDogUmVzdWx0fSxcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTb3VyY2VzIHtcbiAgRE9NOiBET01Tb3VyY2UsXG4gIFRhYmxldEZhY2U6IGFueSxcbiAgc3RhdGU6IFN0YXRlU291cmNlPFN0YXRlPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTaW5rcyB7XG4gIERPTTogU3RyZWFtPFZOb2RlPixcbiAgVGFibGV0RmFjZTogYW55LFxuICBzdGF0ZTogU3RyZWFtPFJlZHVjZXI8U3RhdGU+Pixcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gUm9ib3RBcHAoc291cmNlczogU291cmNlcykge1xuICBjb25zdCBmYWNpYWxFeHByZXNzaW9uQWN0aW9uOiBGRUFTaW5rcyA9IEZhY2lhbEV4cHJlc3Npb25BY3Rpb24oe1xuICAgIGdvYWw6IHhzLm9mKCdoYXBweScpLmNvbXBvc2UoZGVsYXkoMTAwMCkpLFxuICAgIFRhYmxldEZhY2U6IHNvdXJjZXMuVGFibGV0RmFjZSxcbiAgfSk7XG4gIGNvbnN0IHR3b1NwZWVjaGJ1YmJsZXNBY3Rpb246IFRXQVNpbmtzID0gVHdvU3BlZWNoYnViYmxlc0FjdGlvbih7XG4gICAgZ29hbDogeHMub2YoJ0hlbGxvIScpLmNvbXBvc2UoZGVsYXkoMTAwMCkpLFxuICAgIERPTTogc291cmNlcy5ET00sXG4gIH0pO1xuXG4gIGNvbnN0IHJlZHVjZXIkOiBTdHJlYW08UmVkdWNlcjxTdGF0ZT4+ID0geHMubWVyZ2UoXG4gICAgeHMub2YoKHByZXY/KSA9PiAoe1xuICAgICAgRmFjaWFsRXhwcmVzc2lvbkFjdGlvbjoge3Jlc3VsdDogbnVsbH0sXG4gICAgICBUd29TcGVlY2hidWJibGVzQWN0aW9uOiB7cmVzdWx0OiBudWxsfSxcbiAgICB9KSksXG4gICAgZmFjaWFsRXhwcmVzc2lvbkFjdGlvbi5yZXN1bHQubWFwKHJlc3VsdCA9PiBcbiAgICAgIHByZXYgPT4gKHsuLi5wcmV2LCBGYWNpYWxFeHByZXNzaW9uQWN0aW9uOiB7cmVzdWx0fX0pKSxcbiAgICB0d29TcGVlY2hidWJibGVzQWN0aW9uLnJlc3VsdC5tYXAocmVzdWx0ID0+XG4gICAgICBwcmV2ID0+ICh7Li4ucHJldiwgVHdvU3BlZWNoYnViYmxlc0FjdGlvbjoge3Jlc3VsdH19KSksXG4gICk7XG5cbiAgY29uc3QgdmRvbSQgPSB4cy5jb21iaW5lKFxuICAgIHR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24uRE9NLFxuICAgIHNvdXJjZXMuVGFibGV0RmFjZS5ET00sXG4gICkubWFwKChbc3BlZWNoYnViYmxlcywgZmFjZV0pID0+IFxuICAgIGRpdih7XG4gICAgICBzdHlsZToge3Bvc2l0aW9uOiAncmVsYXRpdmUnfVxuICAgIH0sIFtzcGVlY2hidWJibGVzLCBmYWNlXSlcbiAgKTtcblxuICByZXR1cm4ge1xuICAgIERPTTogdmRvbSQsXG4gICAgVGFibGV0RmFjZTogZmFjaWFsRXhwcmVzc2lvbkFjdGlvbi5vdXRwdXQsXG4gICAgc3RhdGU6IHJlZHVjZXIkLFxuICB9O1xufVxuIiwiaW1wb3J0IHttYWtlRE9NRHJpdmVyfSBmcm9tICdAY3ljbGUvZG9tJztcbmltcG9ydCB7d2l0aFN0YXRlfSBmcm9tICdAY3ljbGUvc3RhdGUnO1xuaW1wb3J0IHtydW59IGZyb20gJ0BjeWNsZS9ydW4nO1xuaW1wb3J0IHttYWtlVGFibGV0RmFjZURyaXZlcn0gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvc2NyZWVuJztcbmltcG9ydCBSb2JvdEFwcCBmcm9tICcuL1JvYm90QXBwJztcblxuY29uc3QgbWFpbiA9IHdpdGhTdGF0ZShSb2JvdEFwcCk7XG5cbnJ1bihtYWluLCB7XG4gIERPTTogbWFrZURPTURyaXZlcignI2FwcCcpLFxuICBUYWJsZXRGYWNlOiBtYWtlVGFibGV0RmFjZURyaXZlcigpLFxufSk7Il19

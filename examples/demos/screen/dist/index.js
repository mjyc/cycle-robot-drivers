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
    BodyDOMSource.prototype.events = function (eventType, options) {
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

},{"./fromEvent":12,"@cycle/run/lib/adapt":34,"xstream":120}],5:[function(require,module,exports){
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
    DocumentDOMSource.prototype.events = function (eventType, options) {
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

},{"./fromEvent":12,"@cycle/run/lib/adapt":34,"xstream":120}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ScopeChecker_1 = require("./ScopeChecker");
var utils_1 = require("./utils");
var matchesSelector_1 = require("./matchesSelector");
function toElArray(input) {
    return Array.prototype.slice.call(input);
}
var ElementFinder = /** @class */ (function () {
    function ElementFinder(namespace, isolateModule) {
        this.namespace = namespace;
        this.isolateModule = isolateModule;
    }
    ElementFinder.prototype.call = function (rootElement) {
        var namespace = this.namespace;
        var selector = utils_1.getSelectors(namespace);
        if (!selector) {
            return [rootElement];
        }
        var fullScope = utils_1.getFullScope(namespace);
        var scopeChecker = new ScopeChecker_1.ScopeChecker(fullScope, this.isolateModule);
        var topNode = fullScope
            ? this.isolateModule.getElement(fullScope) || rootElement
            : rootElement;
        var topNodeMatchesSelector = !!fullScope && !!selector && matchesSelector_1.matchesSelector(topNode, selector);
        return toElArray(topNode.querySelectorAll(selector))
            .filter(scopeChecker.isDirectlyInScope, scopeChecker)
            .concat(topNodeMatchesSelector ? [topNode] : []);
    };
    return ElementFinder;
}());
exports.ElementFinder = ElementFinder;

},{"./ScopeChecker":10,"./matchesSelector":17,"./utils":21}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var ScopeChecker_1 = require("./ScopeChecker");
var utils_1 = require("./utils");
var matchesSelector_1 = require("./matchesSelector");
var fromEvent_1 = require("./fromEvent");
/**
 * Finds (with binary search) index of the destination that id equal to searchId
 * among the destinations in the given array.
 */
function indexOf(arr, searchId) {
    var minIndex = 0;
    var maxIndex = arr.length - 1;
    var currentIndex;
    var current;
    while (minIndex <= maxIndex) {
        currentIndex = ((minIndex + maxIndex) / 2) | 0; // tslint:disable-line:no-bitwise
        current = arr[currentIndex];
        var currentId = current.id;
        if (currentId < searchId) {
            minIndex = currentIndex + 1;
        }
        else if (currentId > searchId) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }
    return -1;
}
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
    function EventDelegator(origin, eventType, useCapture, isolateModule, preventDefault) {
        if (preventDefault === void 0) { preventDefault = false; }
        var _this = this;
        this.origin = origin;
        this.eventType = eventType;
        this.useCapture = useCapture;
        this.isolateModule = isolateModule;
        this.preventDefault = preventDefault;
        this.destinations = [];
        this._lastId = 0;
        if (preventDefault) {
            if (useCapture) {
                this.listener = function (ev) {
                    fromEvent_1.preventDefaultConditional(ev, preventDefault);
                    _this.capture(ev);
                };
            }
            else {
                this.listener = function (ev) {
                    fromEvent_1.preventDefaultConditional(ev, preventDefault);
                    _this.bubble(ev);
                };
            }
        }
        else {
            if (useCapture) {
                this.listener = function (ev) { return _this.capture(ev); };
            }
            else {
                this.listener = function (ev) { return _this.bubble(ev); };
            }
        }
        origin.addEventListener(eventType, this.listener, useCapture);
    }
    EventDelegator.prototype.updateOrigin = function (newOrigin) {
        this.origin.removeEventListener(this.eventType, this.listener, this.useCapture);
        newOrigin.addEventListener(this.eventType, this.listener, this.useCapture);
        this.origin = newOrigin;
    };
    /**
     * Creates a *new* destination given the namespace and returns the subject
     * representing the destination of events. Is not referentially transparent,
     * will always return a different output for the same input.
     */
    EventDelegator.prototype.createDestination = function (namespace) {
        var _this = this;
        var id = this._lastId++;
        var selector = utils_1.getSelectors(namespace);
        var scopeChecker = new ScopeChecker_1.ScopeChecker(utils_1.getFullScope(namespace), this.isolateModule);
        var subject = xstream_1.default.create({
            start: function () { },
            stop: function () {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(function () {
                        _this.removeDestination(id);
                    });
                }
                else {
                    _this.removeDestination(id);
                }
            },
        });
        var destination = { id: id, selector: selector, scopeChecker: scopeChecker, subject: subject };
        this.destinations.push(destination);
        return subject;
    };
    /**
     * Removes the destination that has the given id.
     */
    EventDelegator.prototype.removeDestination = function (id) {
        var i = indexOf(this.destinations, id);
        i >= 0 && this.destinations.splice(i, 1); // tslint:disable-line:no-unused-expression
    };
    EventDelegator.prototype.capture = function (ev) {
        var n = this.destinations.length;
        for (var i = 0; i < n; i++) {
            var dest = this.destinations[i];
            if (matchesSelector_1.matchesSelector(ev.target, dest.selector)) {
                dest.subject._n(ev);
            }
        }
    };
    EventDelegator.prototype.bubble = function (rawEvent) {
        var origin = this.origin;
        if (!origin.contains(rawEvent.currentTarget)) {
            return;
        }
        var roof = origin.parentElement;
        var ev = this.patchEvent(rawEvent);
        for (var el = ev.target; el && el !== roof; el = el.parentElement) {
            if (!origin.contains(el)) {
                ev.stopPropagation();
            }
            if (ev.propagationHasBeenStopped) {
                return;
            }
            this.matchEventAgainstDestinations(el, ev);
        }
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
    EventDelegator.prototype.matchEventAgainstDestinations = function (el, ev) {
        var n = this.destinations.length;
        for (var i = 0; i < n; i++) {
            var dest = this.destinations[i];
            if (!dest.scopeChecker.isDirectlyInScope(el)) {
                continue;
            }
            if (matchesSelector_1.matchesSelector(el, dest.selector)) {
                this.mutateEventCurrentTarget(ev, el);
                dest.subject._n(ev);
            }
        }
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

},{"./ScopeChecker":10,"./fromEvent":12,"./matchesSelector":17,"./utils":21,"xstream":120}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IsolateModule = /** @class */ (function () {
    function IsolateModule() {
        this.elementsByFullScope = new Map();
        this.delegatorsByFullScope = new Map();
        this.fullScopesBeingUpdated = [];
        this.vnodesBeingRemoved = [];
    }
    IsolateModule.prototype.cleanupVNode = function (_a) {
        var data = _a.data, elm = _a.elm;
        var fullScope = (data || {}).isolate || '';
        var isCurrentElm = this.elementsByFullScope.get(fullScope) === elm;
        var isScopeBeingUpdated = this.fullScopesBeingUpdated.indexOf(fullScope) >= 0;
        if (fullScope && isCurrentElm && !isScopeBeingUpdated) {
            this.elementsByFullScope.delete(fullScope);
            this.delegatorsByFullScope.delete(fullScope);
        }
    };
    IsolateModule.prototype.getElement = function (fullScope) {
        return this.elementsByFullScope.get(fullScope);
    };
    IsolateModule.prototype.getFullScope = function (elm) {
        var iterator = this.elementsByFullScope.entries();
        for (var result = iterator.next(); !!result.value; result = iterator.next()) {
            var _a = result.value, fullScope = _a[0], element = _a[1];
            if (elm === element) {
                return fullScope;
            }
        }
        return '';
    };
    IsolateModule.prototype.addEventDelegator = function (fullScope, eventDelegator) {
        var delegators = this.delegatorsByFullScope.get(fullScope);
        if (!delegators) {
            delegators = [];
            this.delegatorsByFullScope.set(fullScope, delegators);
        }
        delegators[delegators.length] = eventDelegator;
    };
    IsolateModule.prototype.reset = function () {
        this.elementsByFullScope.clear();
        this.delegatorsByFullScope.clear();
        this.fullScopesBeingUpdated = [];
    };
    IsolateModule.prototype.createModule = function () {
        var self = this;
        return {
            create: function (oldVNode, vNode) {
                var _a = oldVNode.data, oldData = _a === void 0 ? {} : _a;
                var elm = vNode.elm, _b = vNode.data, data = _b === void 0 ? {} : _b;
                var oldFullScope = oldData.isolate || '';
                var fullScope = data.isolate || '';
                // Update data structures with the newly-created element
                if (fullScope) {
                    self.fullScopesBeingUpdated.push(fullScope);
                    if (oldFullScope) {
                        self.elementsByFullScope.delete(oldFullScope);
                    }
                    self.elementsByFullScope.set(fullScope, elm);
                    // Update delegators for this scope
                    var delegators = self.delegatorsByFullScope.get(fullScope);
                    if (delegators) {
                        var len = delegators.length;
                        for (var i = 0; i < len; ++i) {
                            delegators[i].updateOrigin(elm);
                        }
                    }
                }
                if (oldFullScope && !fullScope) {
                    self.elementsByFullScope.delete(fullScope);
                }
            },
            update: function (oldVNode, vNode) {
                var _a = oldVNode.data, oldData = _a === void 0 ? {} : _a;
                var elm = vNode.elm, _b = vNode.data, data = _b === void 0 ? {} : _b;
                var oldFullScope = oldData.isolate || '';
                var fullScope = data.isolate || '';
                // Same element, but different scope, so update the data structures
                if (fullScope && fullScope !== oldFullScope) {
                    if (oldFullScope) {
                        self.elementsByFullScope.delete(oldFullScope);
                    }
                    self.elementsByFullScope.set(fullScope, elm);
                    var delegators = self.delegatorsByFullScope.get(oldFullScope);
                    if (delegators) {
                        self.delegatorsByFullScope.delete(oldFullScope);
                        self.delegatorsByFullScope.set(fullScope, delegators);
                    }
                }
                // Same element, but lost the scope, so update the data structures
                if (oldFullScope && !fullScope) {
                    self.elementsByFullScope.delete(oldFullScope);
                    self.delegatorsByFullScope.delete(oldFullScope);
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
                    self.cleanupVNode(vnodesBeingRemoved[i]);
                }
                self.vnodesBeingRemoved = [];
                self.fullScopesBeingUpdated = [];
            },
        };
    };
    return IsolateModule;
}());
exports.IsolateModule = IsolateModule;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var adapt_1 = require("@cycle/run/lib/adapt");
var DocumentDOMSource_1 = require("./DocumentDOMSource");
var BodyDOMSource_1 = require("./BodyDOMSource");
var ElementFinder_1 = require("./ElementFinder");
var fromEvent_1 = require("./fromEvent");
var isolate_1 = require("./isolate");
var EventDelegator_1 = require("./EventDelegator");
var utils_1 = require("./utils");
var eventTypesThatDontBubble = [
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
function determineUseCapture(eventType, options) {
    var result = false;
    if (typeof options.useCapture === 'boolean') {
        result = options.useCapture;
    }
    if (eventTypesThatDontBubble.indexOf(eventType) !== -1) {
        result = true;
    }
    return result;
}
function filterBasedOnIsolation(domSource, fullScope) {
    return function filterBasedOnIsolationOperator(rootElement$) {
        var initialState = {
            wasIsolated: false,
            shouldPass: false,
            element: null,
        };
        return rootElement$
            .fold(function checkIfShouldPass(state, element) {
            var isIsolated = !!domSource._isolateModule.getElement(fullScope);
            state.shouldPass = isIsolated && !state.wasIsolated;
            state.wasIsolated = isIsolated;
            state.element = element;
            return state;
        }, initialState)
            .drop(1)
            .filter(function (s) { return s.shouldPass; })
            .map(function (s) { return s.element; });
    };
}
var MainDOMSource = /** @class */ (function () {
    function MainDOMSource(_rootElement$, _sanitation$, _namespace, _isolateModule, _delegators, _name) {
        if (_namespace === void 0) { _namespace = []; }
        var _this = this;
        this._rootElement$ = _rootElement$;
        this._sanitation$ = _sanitation$;
        this._namespace = _namespace;
        this._isolateModule = _isolateModule;
        this._delegators = _delegators;
        this._name = _name;
        this.isolateSource = isolate_1.isolateSource;
        this.isolateSink = function (sink, scope) {
            if (scope === ':root') {
                return sink;
            }
            else if (utils_1.isClassOrId(scope)) {
                return isolate_1.siblingIsolateSink(sink, scope);
            }
            else {
                var prevFullScope = utils_1.getFullScope(_this._namespace);
                var nextFullScope = [prevFullScope, scope].filter(function (x) { return !!x; }).join('-');
                return isolate_1.totalIsolateSink(sink, nextFullScope);
            }
        };
    }
    MainDOMSource.prototype._elements = function () {
        if (this._namespace.length === 0) {
            return this._rootElement$.map(function (x) { return [x]; });
        }
        else {
            var elementFinder_1 = new ElementFinder_1.ElementFinder(this._namespace, this._isolateModule);
            return this._rootElement$.map(function (el) { return elementFinder_1.call(el); });
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
        var trimmedSelector = selector.trim();
        var childNamespace = trimmedSelector === ":root"
            ? this._namespace
            : this._namespace.concat(trimmedSelector);
        return new MainDOMSource(this._rootElement$, this._sanitation$, childNamespace, this._isolateModule, this._delegators, this._name);
    };
    MainDOMSource.prototype.events = function (eventType, options) {
        if (options === void 0) { options = {}; }
        if (typeof eventType !== "string") {
            throw new Error("DOM driver's events() expects argument to be a " +
                "string representing the event type to listen for.");
        }
        var useCapture = determineUseCapture(eventType, options);
        var namespace = this._namespace;
        var fullScope = utils_1.getFullScope(namespace);
        var keyParts = [eventType, useCapture];
        if (fullScope) {
            keyParts.push(fullScope);
        }
        var key = keyParts.join('~');
        var domSource = this;
        var rootElement$;
        if (fullScope) {
            rootElement$ = this._rootElement$.compose(filterBasedOnIsolation(domSource, fullScope));
        }
        else {
            rootElement$ = this._rootElement$.take(2);
        }
        var event$ = rootElement$
            .map(function setupEventDelegatorOnTopElement(rootElement) {
            // Event listener just for the root element
            if (!namespace || namespace.length === 0) {
                return fromEvent_1.fromEvent(rootElement, eventType, useCapture, options.preventDefault);
            }
            // Event listener on the origin element as an EventDelegator
            var delegators = domSource._delegators;
            var origin = domSource._isolateModule.getElement(fullScope) || rootElement;
            var delegator;
            if (delegators.has(key)) {
                delegator = delegators.get(key);
                delegator.updateOrigin(origin);
            }
            else {
                delegator = new EventDelegator_1.EventDelegator(origin, eventType, useCapture, domSource._isolateModule, options.preventDefault);
                delegators.set(key, delegator);
            }
            if (fullScope) {
                domSource._isolateModule.addEventDelegator(fullScope, delegator);
            }
            var subject = delegator.createDestination(namespace);
            return subject;
        })
            .flatten();
        var out = adapt_1.adapt(event$);
        out._isCycleSource = domSource._name;
        return out;
    };
    MainDOMSource.prototype.dispose = function () {
        this._sanitation$.shamefullySendNext(null);
        this._isolateModule.reset();
    };
    return MainDOMSource;
}());
exports.MainDOMSource = MainDOMSource;

},{"./BodyDOMSource":4,"./DocumentDOMSource":5,"./ElementFinder":6,"./EventDelegator":7,"./fromEvent":12,"./isolate":15,"./utils":21,"@cycle/run/lib/adapt":34}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ScopeChecker = /** @class */ (function () {
    function ScopeChecker(fullScope, isolateModule) {
        this.fullScope = fullScope;
        this.isolateModule = isolateModule;
    }
    /**
     * Checks whether the given element is *directly* in the scope of this
     * scope checker. Being contained *indirectly* through other scopes
     * is not valid. This is crucial for implementing parent-child isolation,
     * so that the parent selectors don't search inside a child scope.
     */
    ScopeChecker.prototype.isDirectlyInScope = function (leaf) {
        for (var el = leaf; el; el = el.parentElement) {
            var fullScope = this.isolateModule.getFullScope(el);
            if (fullScope && fullScope !== this.fullScope) {
                return false;
            }
            if (fullScope) {
                return true;
            }
        }
        return true;
    };
    return ScopeChecker;
}());
exports.ScopeChecker = ScopeChecker;

},{}],11:[function(require,module,exports){
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
        return vnode_1.vnode('', {}, children, undefined, this.rootElement);
    };
    VNodeWrapper.prototype.wrap = function (children) {
        var _a = this.rootElement, tagName = _a.tagName, id = _a.id, className = _a.className;
        var selId = id ? "#" + id : '';
        var selClass = className ? "." + className.split(" ").join(".") : '';
        return h_1.h("" + tagName.toLowerCase() + selId + selClass, {}, children);
    };
    return VNodeWrapper;
}());
exports.VNodeWrapper = VNodeWrapper;

},{"./utils":21,"snabbdom-selector":106,"snabbdom/h":22,"snabbdom/vnode":33}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
function fromEvent(element, eventName, useCapture, preventDefault) {
    if (useCapture === void 0) { useCapture = false; }
    if (preventDefault === void 0) { preventDefault = false; }
    return xstream_1.Stream.create({
        element: element,
        next: null,
        start: function start(listener) {
            if (preventDefault) {
                this.next = function next(event) {
                    preventDefaultConditional(event, preventDefault);
                    listener.next(event);
                };
            }
            else {
                this.next = function next(event) {
                    listener.next(event);
                };
            }
            this.element.addEventListener(eventName, this.next, useCapture);
        },
        stop: function stop() {
            this.element.removeEventListener(eventName, this.next, useCapture);
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
        else if (typeof preventDefault === 'function') {
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

},{"xstream":120}],13:[function(require,module,exports){
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

},{"snabbdom/h":22}],14:[function(require,module,exports){
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

},{"./MainDOMSource":9,"./hyperscript-helpers":13,"./makeDOMDriver":16,"./mockDOMSource":18,"./thunk":20,"snabbdom/h":22}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vnode_1 = require("snabbdom/vnode");
var utils_1 = require("./utils");
function totalIsolateSource(source, scope) {
    return source.select(utils_1.SCOPE_PREFIX + scope);
}
function siblingIsolateSource(source, scope) {
    return source.select(scope);
}
function isolateSource(source, scope) {
    if (scope === ':root') {
        return source;
    }
    else if (utils_1.isClassOrId(scope)) {
        return siblingIsolateSource(source, scope);
    }
    else {
        return totalIsolateSource(source, scope);
    }
}
exports.isolateSource = isolateSource;
function siblingIsolateSink(sink, scope) {
    return sink.map(function (node) {
        return node
            ? vnode_1.vnode(node.sel + scope, node.data, node.children, node.text, node.elm)
            : node;
    });
}
exports.siblingIsolateSink = siblingIsolateSink;
function totalIsolateSink(sink, fullScope) {
    return sink.map(function (node) {
        if (!node) {
            return node;
        }
        // Ignore if already had up-to-date full scope in vnode.data.isolate
        if (node.data && node.data.isolate) {
            var isolateData = node.data.isolate;
            var prevFullScopeNum = isolateData.replace(/(cycle|\-)/g, '');
            var fullScopeNum = fullScope.replace(/(cycle|\-)/g, '');
            if (isNaN(parseInt(prevFullScopeNum)) ||
                isNaN(parseInt(fullScopeNum)) ||
                prevFullScopeNum > fullScopeNum) {
                // > is lexicographic string comparison
                return node;
            }
        }
        // Insert up-to-date full scope in vnode.data.isolate, and also a key if needed
        node.data = node.data || {};
        node.data.isolate = fullScope;
        if (typeof node.key === 'undefined') {
            node.key = utils_1.SCOPE_PREFIX + fullScope;
        }
        return node;
    });
}
exports.totalIsolateSink = totalIsolateSink;

},{"./utils":21,"snabbdom/vnode":33}],16:[function(require,module,exports){
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
require("es6-map/implement"); // tslint:disable-line
function makeDOMDriverInputGuard(modules) {
    if (!Array.isArray(modules)) {
        throw new Error("Optional modules option must be " + "an array for snabbdom modules");
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
    var delegators = new Map();
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
        })
            .flatten();
        var rootElement$ = concat_1.default(domReady$, mutationConfirmed$)
            .endWhen(sanitation$)
            .compose(sampleCombine_1.default(elementAfterPatch$))
            .map(function (arr) { return arr[1]; })
            .remember();
        // Start the snabbdom patching, over time
        rootElement$.addListener({ error: reportSnabbdomError });
        return new MainDOMSource_1.MainDOMSource(rootElement$, sanitation$, [], isolateModule, delegators, name);
    }
    return DOMDriver;
}
exports.makeDOMDriver = makeDOMDriver;

},{"./IsolateModule":8,"./MainDOMSource":9,"./VNodeWrapper":11,"./modules":19,"./utils":21,"es6-map/implement":89,"snabbdom":30,"snabbdom/tovnode":32,"xstream":120,"xstream/extra/concat":117,"xstream/extra/sampleCombine":119}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createMatchesSelector() {
    var vendor;
    try {
        var proto = Element.prototype;
        vendor =
            proto.matches ||
                proto.matchesSelector ||
                proto.webkitMatchesSelector ||
                proto.mozMatchesSelector ||
                proto.msMatchesSelector ||
                proto.oMatchesSelector;
    }
    catch (err) {
        vendor = null;
    }
    return function match(elem, selector) {
        if (selector.length === 0) {
            return true;
        }
        if (vendor) {
            return vendor.call(elem, selector);
        }
        var nodes = elem.parentNode.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i] === elem) {
                return true;
            }
        }
        return false;
    };
}
exports.matchesSelector = createMatchesSelector();

},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var xstream_1 = require("xstream");
var adapt_1 = require("@cycle/run/lib/adapt");
var SCOPE_PREFIX = '___';
var MockedDOMSource = /** @class */ (function () {
    function MockedDOMSource(_mockConfig) {
        this._mockConfig = _mockConfig;
        if (_mockConfig['elements']) {
            this._elements = _mockConfig['elements'];
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
    MockedDOMSource.prototype.events = function (eventType, options) {
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
        return sink.map(function (vnode) {
            if (vnode.sel && vnode.sel.indexOf(SCOPE_PREFIX + scope) !== -1) {
                return vnode;
            }
            else {
                vnode.sel += "." + SCOPE_PREFIX + scope;
                return vnode;
            }
        });
    };
    return MockedDOMSource;
}());
exports.MockedDOMSource = MockedDOMSource;
function mockDOMSource(mockConfig) {
    return new MockedDOMSource(mockConfig);
}
exports.mockDOMSource = mockDOMSource;

},{"@cycle/run/lib/adapt":34,"xstream":120}],19:[function(require,module,exports){
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

},{"snabbdom/modules/attributes":25,"snabbdom/modules/class":26,"snabbdom/modules/dataset":27,"snabbdom/modules/props":28,"snabbdom/modules/style":29}],20:[function(require,module,exports){
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

},{"snabbdom/h":22}],21:[function(require,module,exports){
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
exports.SCOPE_PREFIX = '$$CYCLEDOM$$-';
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
/**
 * The full scope of a namespace is the "absolute path" of scopes from
 * parent to child. This is extracted from the namespace, filter only for
 * scopes in the namespace.
 */
function getFullScope(namespace) {
    return namespace
        .filter(function (c) { return c.indexOf(exports.SCOPE_PREFIX) > -1; })
        .map(function (c) { return c.replace(exports.SCOPE_PREFIX, ''); })
        .join('-');
}
exports.getFullScope = getFullScope;
function getSelectors(namespace) {
    return namespace.filter(function (c) { return c.indexOf(exports.SCOPE_PREFIX) === -1; }).join(' ');
}
exports.getSelectors = getSelectors;

},{}],22:[function(require,module,exports){
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
    if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
            if (is.primitive(children[i]))
                children[i] = vnode_1.vnode(undefined, undefined, undefined, children[i]);
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

},{"./is":24,"./vnode":33}],23:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;

},{}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
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

},{}],27:[function(require,module,exports){
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

},{}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var raf = (typeof window !== 'undefined' && window.requestAnimationFrame) || setTimeout;
var nextFrame = function (fn) { raf(function () { raf(fn); }); };
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
exports.styleModule = {
    create: updateStyle,
    update: updateStyle,
    destroy: applyDestroyStyle,
    remove: applyRemoveStyle
};
exports.default = exports.styleModule;

},{}],30:[function(require,module,exports){
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
        if (oldStartIdx > oldEndIdx) {
            before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].elm;
            addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
        }
        else if (newStartIdx > newEndIdx) {
            removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
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

},{"./h":22,"./htmldomapi":23,"./is":24,"./thunk":31,"./vnode":33}],31:[function(require,module,exports){
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

},{"./h":22}],32:[function(require,module,exports){
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
            children.push(toVNode(elmChildren[i]));
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

},{"./htmldomapi":23,"./vnode":33}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
exports.default = vnode;

},{}],34:[function(require,module,exports){
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

},{}],35:[function(require,module,exports){
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

},{}],36:[function(require,module,exports){
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

},{"./internals":37}],37:[function(require,module,exports){
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

},{"./adapt":35,"quicktask":102,"xstream":120}],38:[function(require,module,exports){
'use strict';

var copy             = require('es5-ext/object/copy')
  , normalizeOptions = require('es5-ext/object/normalize-options')
  , ensureCallable   = require('es5-ext/object/valid-callable')
  , map              = require('es5-ext/object/map')
  , callable         = require('es5-ext/object/valid-callable')
  , validValue       = require('es5-ext/object/valid-value')

  , bind = Function.prototype.bind, defineProperty = Object.defineProperty
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , define;

define = function (name, desc, options) {
	var value = validValue(desc) && callable(desc.value), dgs;
	dgs = copy(desc);
	delete dgs.writable;
	delete dgs.value;
	dgs.get = function () {
		if (!options.overwriteDefinition && hasOwnProperty.call(this, name)) return value;
		desc.value = bind.call(value, options.resolveContext ? options.resolveContext(this) : this);
		defineProperty(this, name, desc);
		return this[name];
	};
	return dgs;
};

module.exports = function (props/*, options*/) {
	var options = normalizeOptions(arguments[1]);
	if (options.resolveContext != null) ensureCallable(options.resolveContext);
	return map(props, function (desc, name) { return define(name, desc, options); });
};

},{"es5-ext/object/copy":61,"es5-ext/object/map":70,"es5-ext/object/normalize-options":71,"es5-ext/object/valid-callable":76,"es5-ext/object/valid-value":77}],39:[function(require,module,exports){
'use strict';

var assign        = require('es5-ext/object/assign')
  , normalizeOpts = require('es5-ext/object/normalize-options')
  , isCallable    = require('es5-ext/object/is-callable')
  , contains      = require('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":58,"es5-ext/object/is-callable":64,"es5-ext/object/normalize-options":71,"es5-ext/string/#/contains":78}],40:[function(require,module,exports){
// Inspired by Google Closure:
// http://closure-library.googlecode.com/svn/docs/
// closure_goog_array_array.js.html#goog.array.clear

"use strict";

var value = require("../../object/valid-value");

module.exports = function () {
	value(this).length = 0;
	return this;
};

},{"../../object/valid-value":77}],41:[function(require,module,exports){
"use strict";

var numberIsNaN       = require("../../number/is-nan")
  , toPosInt          = require("../../number/to-pos-integer")
  , value             = require("../../object/valid-value")
  , indexOf           = Array.prototype.indexOf
  , objHasOwnProperty = Object.prototype.hasOwnProperty
  , abs               = Math.abs
  , floor             = Math.floor;

module.exports = function (searchElement /*, fromIndex*/) {
	var i, length, fromIndex, val;
	if (!numberIsNaN(searchElement)) return indexOf.apply(this, arguments);

	length = toPosInt(value(this).length);
	fromIndex = arguments[1];
	if (isNaN(fromIndex)) fromIndex = 0;
	else if (fromIndex >= 0) fromIndex = floor(fromIndex);
	else fromIndex = toPosInt(this.length) - floor(abs(fromIndex));

	for (i = fromIndex; i < length; ++i) {
		if (objHasOwnProperty.call(this, i)) {
			val = this[i];
			if (numberIsNaN(val)) return i; // Jslint: ignore
		}
	}
	return -1;
};

},{"../../number/is-nan":52,"../../number/to-pos-integer":56,"../../object/valid-value":77}],42:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? Array.from
	: require("./shim");

},{"./is-implemented":43,"./shim":44}],43:[function(require,module,exports){
"use strict";

module.exports = function () {
	var from = Array.from, arr, result;
	if (typeof from !== "function") return false;
	arr = ["raz", "dwa"];
	result = from(arr);
	return Boolean(result && (result !== arr) && (result[1] === "dwa"));
};

},{}],44:[function(require,module,exports){
"use strict";

var iteratorSymbol = require("es6-symbol").iterator
  , isArguments    = require("../../function/is-arguments")
  , isFunction     = require("../../function/is-function")
  , toPosInt       = require("../../number/to-pos-integer")
  , callable       = require("../../object/valid-callable")
  , validValue     = require("../../object/valid-value")
  , isValue        = require("../../object/is-value")
  , isString       = require("../../string/is-string")
  , isArray        = Array.isArray
  , call           = Function.prototype.call
  , desc           = { configurable: true, enumerable: true, writable: true, value: null }
  , defineProperty = Object.defineProperty;

// eslint-disable-next-line complexity
module.exports = function (arrayLike /*, mapFn, thisArg*/) {
	var mapFn = arguments[1]
	  , thisArg = arguments[2]
	  , Context
	  , i
	  , j
	  , arr
	  , length
	  , code
	  , iterator
	  , result
	  , getIterator
	  , value;

	arrayLike = Object(validValue(arrayLike));

	if (isValue(mapFn)) callable(mapFn);
	if (!this || this === Array || !isFunction(this)) {
		// Result: Plain array
		if (!mapFn) {
			if (isArguments(arrayLike)) {
				// Source: Arguments
				length = arrayLike.length;
				if (length !== 1) return Array.apply(null, arrayLike);
				arr = new Array(1);
				arr[0] = arrayLike[0];
				return arr;
			}
			if (isArray(arrayLike)) {
				// Source: Array
				arr = new Array(length = arrayLike.length);
				for (i = 0; i < length; ++i) arr[i] = arrayLike[i];
				return arr;
			}
		}
		arr = [];
	} else {
		// Result: Non plain array
		Context = this;
	}

	if (!isArray(arrayLike)) {
		if ((getIterator = arrayLike[iteratorSymbol]) !== undefined) {
			// Source: Iterator
			iterator = callable(getIterator).call(arrayLike);
			if (Context) arr = new Context();
			result = iterator.next();
			i = 0;
			while (!result.done) {
				value = mapFn ? call.call(mapFn, thisArg, result.value, i) : result.value;
				if (Context) {
					desc.value = value;
					defineProperty(arr, i, desc);
				} else {
					arr[i] = value;
				}
				result = iterator.next();
				++i;
			}
			length = i;
		} else if (isString(arrayLike)) {
			// Source: String
			length = arrayLike.length;
			if (Context) arr = new Context();
			for (i = 0, j = 0; i < length; ++i) {
				value = arrayLike[i];
				if (i + 1 < length) {
					code = value.charCodeAt(0);
					// eslint-disable-next-line max-depth
					if (code >= 0xd800 && code <= 0xdbff) value += arrayLike[++i];
				}
				value = mapFn ? call.call(mapFn, thisArg, value, j) : value;
				if (Context) {
					desc.value = value;
					defineProperty(arr, j, desc);
				} else {
					arr[j] = value;
				}
				++j;
			}
			length = j;
		}
	}
	if (length === undefined) {
		// Source: array or array-like
		length = toPosInt(arrayLike.length);
		if (Context) arr = new Context(length);
		for (i = 0; i < length; ++i) {
			value = mapFn ? call.call(mapFn, thisArg, arrayLike[i], i) : arrayLike[i];
			if (Context) {
				desc.value = value;
				defineProperty(arr, i, desc);
			} else {
				arr[i] = value;
			}
		}
	}
	if (Context) {
		desc.value = null;
		arr.length = length;
	}
	return arr;
};

},{"../../function/is-arguments":45,"../../function/is-function":46,"../../number/to-pos-integer":56,"../../object/is-value":66,"../../object/valid-callable":76,"../../object/valid-value":77,"../../string/is-string":81,"es6-symbol":95}],45:[function(require,module,exports){
"use strict";

var objToString = Object.prototype.toString
  , id = objToString.call(
	(function () {
		return arguments;
	})()
);

module.exports = function (value) {
	return objToString.call(value) === id;
};

},{}],46:[function(require,module,exports){
"use strict";

var objToString = Object.prototype.toString, id = objToString.call(require("./noop"));

module.exports = function (value) {
	return typeof value === "function" && objToString.call(value) === id;
};

},{"./noop":47}],47:[function(require,module,exports){
"use strict";

// eslint-disable-next-line no-empty-function
module.exports = function () {};

},{}],48:[function(require,module,exports){
/* eslint strict: "off" */

module.exports = (function () {
	return this;
}());

},{}],49:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? Math.sign
	: require("./shim");

},{"./is-implemented":50,"./shim":51}],50:[function(require,module,exports){
"use strict";

module.exports = function () {
	var sign = Math.sign;
	if (typeof sign !== "function") return false;
	return (sign(10) === 1) && (sign(-20) === -1);
};

},{}],51:[function(require,module,exports){
"use strict";

module.exports = function (value) {
	value = Number(value);
	if (isNaN(value) || (value === 0)) return value;
	return value > 0 ? 1 : -1;
};

},{}],52:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? Number.isNaN
	: require("./shim");

},{"./is-implemented":53,"./shim":54}],53:[function(require,module,exports){
"use strict";

module.exports = function () {
	var numberIsNaN = Number.isNaN;
	if (typeof numberIsNaN !== "function") return false;
	return !numberIsNaN({}) && numberIsNaN(NaN) && !numberIsNaN(34);
};

},{}],54:[function(require,module,exports){
"use strict";

module.exports = function (value) {
	// eslint-disable-next-line no-self-compare
	return value !== value;
};

},{}],55:[function(require,module,exports){
"use strict";

var sign = require("../math/sign")

  , abs = Math.abs, floor = Math.floor;

module.exports = function (value) {
	if (isNaN(value)) return 0;
	value = Number(value);
	if ((value === 0) || !isFinite(value)) return value;
	return sign(value) * floor(abs(value));
};

},{"../math/sign":49}],56:[function(require,module,exports){
"use strict";

var toInteger = require("./to-integer")

  , max = Math.max;

module.exports = function (value) {
 return max(0, toInteger(value));
};

},{"./to-integer":55}],57:[function(require,module,exports){
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

"use strict";

var callable                = require("./valid-callable")
  , value                   = require("./valid-value")
  , bind                    = Function.prototype.bind
  , call                    = Function.prototype.call
  , keys                    = Object.keys
  , objPropertyIsEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = function (method, defVal) {
	return function (obj, cb /*, thisArg, compareFn*/) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		obj = Object(value(obj));
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort(typeof compareFn === "function" ? bind.call(compareFn, obj) : undefined);
		}
		if (typeof method !== "function") method = list[method];
		return call.call(method, list, function (key, index) {
			if (!objPropertyIsEnumerable.call(obj, key)) return defVal;
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

},{"./valid-callable":76,"./valid-value":77}],58:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? Object.assign
	: require("./shim");

},{"./is-implemented":59,"./shim":60}],59:[function(require,module,exports){
"use strict";

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== "function") return false;
	obj = { foo: "raz" };
	assign(obj, { bar: "dwa" }, { trzy: "trzy" });
	return (obj.foo + obj.bar + obj.trzy) === "razdwatrzy";
};

},{}],60:[function(require,module,exports){
"use strict";

var keys  = require("../keys")
  , value = require("../valid-value")
  , max   = Math.max;

module.exports = function (dest, src /*, …srcn*/) {
	var error, i, length = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try {
			dest[key] = src[key];
		} catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < length; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":67,"../valid-value":77}],61:[function(require,module,exports){
"use strict";

var aFrom  = require("../array/from")
  , assign = require("./assign")
  , value  = require("./valid-value");

module.exports = function (obj/*, propertyNames, options*/) {
	var copy = Object(value(obj)), propertyNames = arguments[1], options = Object(arguments[2]);
	if (copy !== obj && !propertyNames) return copy;
	var result = {};
	if (propertyNames) {
		aFrom(propertyNames, function (propertyName) {
			if (options.ensure || propertyName in obj) result[propertyName] = obj[propertyName];
		});
	} else {
		assign(result, obj);
	}
	return result;
};

},{"../array/from":42,"./assign":58,"./valid-value":77}],62:[function(require,module,exports){
// Workaround for http://code.google.com/p/v8/issues/detail?id=2804

"use strict";

var create = Object.create, shim;

if (!require("./set-prototype-of/is-implemented")()) {
	shim = require("./set-prototype-of/shim");
}

module.exports = (function () {
	var nullObject, polyProps, desc;
	if (!shim) return create;
	if (shim.level !== 1) return create;

	nullObject = {};
	polyProps = {};
	desc = {
		configurable: false,
		enumerable: false,
		writable: true,
		value: undefined
	};
	Object.getOwnPropertyNames(Object.prototype).forEach(function (name) {
		if (name === "__proto__") {
			polyProps[name] = {
				configurable: true,
				enumerable: false,
				writable: true,
				value: undefined
			};
			return;
		}
		polyProps[name] = desc;
	});
	Object.defineProperties(nullObject, polyProps);

	Object.defineProperty(shim, "nullPolyfill", {
		configurable: false,
		enumerable: false,
		writable: false,
		value: nullObject
	});

	return function (prototype, props) {
		return create(prototype === null ? nullObject : prototype, props);
	};
}());

},{"./set-prototype-of/is-implemented":74,"./set-prototype-of/shim":75}],63:[function(require,module,exports){
"use strict";

module.exports = require("./_iterate")("forEach");

},{"./_iterate":57}],64:[function(require,module,exports){
// Deprecated

"use strict";

module.exports = function (obj) {
 return typeof obj === "function";
};

},{}],65:[function(require,module,exports){
"use strict";

var isValue = require("./is-value");

var map = { function: true, object: true };

module.exports = function (value) {
	return (isValue(value) && map[typeof value]) || false;
};

},{"./is-value":66}],66:[function(require,module,exports){
"use strict";

var _undefined = require("../function/noop")(); // Support ES3 engines

module.exports = function (val) {
 return (val !== _undefined) && (val !== null);
};

},{"../function/noop":47}],67:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")() ? Object.keys : require("./shim");

},{"./is-implemented":68,"./shim":69}],68:[function(require,module,exports){
"use strict";

module.exports = function () {
	try {
		Object.keys("primitive");
		return true;
	} catch (e) {
		return false;
	}
};

},{}],69:[function(require,module,exports){
"use strict";

var isValue = require("../is-value");

var keys = Object.keys;

module.exports = function (object) { return keys(isValue(object) ? Object(object) : object); };

},{"../is-value":66}],70:[function(require,module,exports){
"use strict";

var callable = require("./valid-callable")
  , forEach  = require("./for-each")
  , call     = Function.prototype.call;

module.exports = function (obj, cb /*, thisArg*/) {
	var result = {}, thisArg = arguments[2];
	callable(cb);
	forEach(obj, function (value, key, targetObj, index) {
		result[key] = call.call(cb, thisArg, value, key, targetObj, index);
	});
	return result;
};

},{"./for-each":63,"./valid-callable":76}],71:[function(require,module,exports){
"use strict";

var isValue = require("./is-value");

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

// eslint-disable-next-line no-unused-vars
module.exports = function (opts1 /*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (!isValue(options)) return;
		process(Object(options), result);
	});
	return result;
};

},{"./is-value":66}],72:[function(require,module,exports){
"use strict";

var forEach = Array.prototype.forEach, create = Object.create;

// eslint-disable-next-line no-unused-vars
module.exports = function (arg /*, …args*/) {
	var set = create(null);
	forEach.call(arguments, function (name) {
		set[name] = true;
	});
	return set;
};

},{}],73:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? Object.setPrototypeOf
	: require("./shim");

},{"./is-implemented":74,"./shim":75}],74:[function(require,module,exports){
"use strict";

var create = Object.create, getPrototypeOf = Object.getPrototypeOf, plainObject = {};

module.exports = function (/* CustomCreate*/) {
	var setPrototypeOf = Object.setPrototypeOf, customCreate = arguments[0] || create;
	if (typeof setPrototypeOf !== "function") return false;
	return getPrototypeOf(setPrototypeOf(customCreate(null), plainObject)) === plainObject;
};

},{}],75:[function(require,module,exports){
/* eslint no-proto: "off" */

// Big thanks to @WebReflection for sorting this out
// https://gist.github.com/WebReflection/5593554

"use strict";

var isObject        = require("../is-object")
  , value           = require("../valid-value")
  , objIsPrototypeOf = Object.prototype.isPrototypeOf
  , defineProperty  = Object.defineProperty
  , nullDesc        = {
	configurable: true,
	enumerable: false,
	writable: true,
	value: undefined
}
  , validate;

validate = function (obj, prototype) {
	value(obj);
	if (prototype === null || isObject(prototype)) return obj;
	throw new TypeError("Prototype must be null or an object");
};

module.exports = (function (status) {
	var fn, set;
	if (!status) return null;
	if (status.level === 2) {
		if (status.set) {
			set = status.set;
			fn = function (obj, prototype) {
				set.call(validate(obj, prototype), prototype);
				return obj;
			};
		} else {
			fn = function (obj, prototype) {
				validate(obj, prototype).__proto__ = prototype;
				return obj;
			};
		}
	} else {
		fn = function self(obj, prototype) {
			var isNullBase;
			validate(obj, prototype);
			isNullBase = objIsPrototypeOf.call(self.nullPolyfill, obj);
			if (isNullBase) delete self.nullPolyfill.__proto__;
			if (prototype === null) prototype = self.nullPolyfill;
			obj.__proto__ = prototype;
			if (isNullBase) defineProperty(self.nullPolyfill, "__proto__", nullDesc);
			return obj;
		};
	}
	return Object.defineProperty(fn, "level", {
		configurable: false,
		enumerable: false,
		writable: false,
		value: status.level
	});
}(
	(function () {
		var tmpObj1 = Object.create(null)
		  , tmpObj2 = {}
		  , set
		  , desc = Object.getOwnPropertyDescriptor(Object.prototype, "__proto__");

		if (desc) {
			try {
				set = desc.set; // Opera crashes at this point
				set.call(tmpObj1, tmpObj2);
			} catch (ignore) {}
			if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { set: set, level: 2 };
		}

		tmpObj1.__proto__ = tmpObj2;
		if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { level: 2 };

		tmpObj1 = {};
		tmpObj1.__proto__ = tmpObj2;
		if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { level: 1 };

		return false;
	})()
));

require("../create");

},{"../create":62,"../is-object":65,"../valid-value":77}],76:[function(require,module,exports){
"use strict";

module.exports = function (fn) {
	if (typeof fn !== "function") throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],77:[function(require,module,exports){
"use strict";

var isValue = require("./is-value");

module.exports = function (value) {
	if (!isValue(value)) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{"./is-value":66}],78:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? String.prototype.contains
	: require("./shim");

},{"./is-implemented":79,"./shim":80}],79:[function(require,module,exports){
"use strict";

var str = "razdwatrzy";

module.exports = function () {
	if (typeof str.contains !== "function") return false;
	return (str.contains("dwa") === true) && (str.contains("foo") === false);
};

},{}],80:[function(require,module,exports){
"use strict";

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],81:[function(require,module,exports){
"use strict";

var objToString = Object.prototype.toString, id = objToString.call("");

module.exports = function (value) {
	return (
		typeof value === "string" ||
		(value &&
			typeof value === "object" &&
			(value instanceof String || objToString.call(value) === id)) ||
		false
	);
};

},{}],82:[function(require,module,exports){
"use strict";

var setPrototypeOf = require("es5-ext/object/set-prototype-of")
  , contains       = require("es5-ext/string/#/contains")
  , d              = require("d")
  , Symbol         = require("es6-symbol")
  , Iterator       = require("./");

var defineProperty = Object.defineProperty, ArrayIterator;

ArrayIterator = module.exports = function (arr, kind) {
	if (!(this instanceof ArrayIterator)) throw new TypeError("Constructor requires 'new'");
	Iterator.call(this, arr);
	if (!kind) kind = "value";
	else if (contains.call(kind, "key+value")) kind = "key+value";
	else if (contains.call(kind, "key")) kind = "key";
	else kind = "value";
	defineProperty(this, "__kind__", d("", kind));
};
if (setPrototypeOf) setPrototypeOf(ArrayIterator, Iterator);

// Internal %ArrayIteratorPrototype% doesn't expose its constructor
delete ArrayIterator.prototype.constructor;

ArrayIterator.prototype = Object.create(Iterator.prototype, {
	_resolve: d(function (i) {
		if (this.__kind__ === "value") return this.__list__[i];
		if (this.__kind__ === "key+value") return [i, this.__list__[i]];
		return i;
	})
});
defineProperty(ArrayIterator.prototype, Symbol.toStringTag, d("c", "Array Iterator"));

},{"./":85,"d":39,"es5-ext/object/set-prototype-of":73,"es5-ext/string/#/contains":78,"es6-symbol":95}],83:[function(require,module,exports){
"use strict";

var isArguments = require("es5-ext/function/is-arguments")
  , callable    = require("es5-ext/object/valid-callable")
  , isString    = require("es5-ext/string/is-string")
  , get         = require("./get");

var isArray = Array.isArray, call = Function.prototype.call, some = Array.prototype.some;

module.exports = function (iterable, cb /*, thisArg*/) {
	var mode, thisArg = arguments[2], result, doBreak, broken, i, length, char, code;
	if (isArray(iterable) || isArguments(iterable)) mode = "array";
	else if (isString(iterable)) mode = "string";
	else iterable = get(iterable);

	callable(cb);
	doBreak = function () {
		broken = true;
	};
	if (mode === "array") {
		some.call(iterable, function (value) {
			call.call(cb, thisArg, value, doBreak);
			return broken;
		});
		return;
	}
	if (mode === "string") {
		length = iterable.length;
		for (i = 0; i < length; ++i) {
			char = iterable[i];
			if (i + 1 < length) {
				code = char.charCodeAt(0);
				if (code >= 0xd800 && code <= 0xdbff) char += iterable[++i];
			}
			call.call(cb, thisArg, char, doBreak);
			if (broken) break;
		}
		return;
	}
	result = iterable.next();

	while (!result.done) {
		call.call(cb, thisArg, result.value, doBreak);
		if (broken) return;
		result = iterable.next();
	}
};

},{"./get":84,"es5-ext/function/is-arguments":45,"es5-ext/object/valid-callable":76,"es5-ext/string/is-string":81}],84:[function(require,module,exports){
"use strict";

var isArguments    = require("es5-ext/function/is-arguments")
  , isString       = require("es5-ext/string/is-string")
  , ArrayIterator  = require("./array")
  , StringIterator = require("./string")
  , iterable       = require("./valid-iterable")
  , iteratorSymbol = require("es6-symbol").iterator;

module.exports = function (obj) {
	if (typeof iterable(obj)[iteratorSymbol] === "function") return obj[iteratorSymbol]();
	if (isArguments(obj)) return new ArrayIterator(obj);
	if (isString(obj)) return new StringIterator(obj);
	return new ArrayIterator(obj);
};

},{"./array":82,"./string":87,"./valid-iterable":88,"es5-ext/function/is-arguments":45,"es5-ext/string/is-string":81,"es6-symbol":95}],85:[function(require,module,exports){
"use strict";

var clear    = require("es5-ext/array/#/clear")
  , assign   = require("es5-ext/object/assign")
  , callable = require("es5-ext/object/valid-callable")
  , value    = require("es5-ext/object/valid-value")
  , d        = require("d")
  , autoBind = require("d/auto-bind")
  , Symbol   = require("es6-symbol");

var defineProperty = Object.defineProperty, defineProperties = Object.defineProperties, Iterator;

module.exports = Iterator = function (list, context) {
	if (!(this instanceof Iterator)) throw new TypeError("Constructor requires 'new'");
	defineProperties(this, {
		__list__: d("w", value(list)),
		__context__: d("w", context),
		__nextIndex__: d("w", 0)
	});
	if (!context) return;
	callable(context.on);
	context.on("_add", this._onAdd);
	context.on("_delete", this._onDelete);
	context.on("_clear", this._onClear);
};

// Internal %IteratorPrototype% doesn't expose its constructor
delete Iterator.prototype.constructor;

defineProperties(
	Iterator.prototype,
	assign(
		{
			_next: d(function () {
				var i;
				if (!this.__list__) return undefined;
				if (this.__redo__) {
					i = this.__redo__.shift();
					if (i !== undefined) return i;
				}
				if (this.__nextIndex__ < this.__list__.length) return this.__nextIndex__++;
				this._unBind();
				return undefined;
			}),
			next: d(function () {
				return this._createResult(this._next());
			}),
			_createResult: d(function (i) {
				if (i === undefined) return { done: true, value: undefined };
				return { done: false, value: this._resolve(i) };
			}),
			_resolve: d(function (i) {
				return this.__list__[i];
			}),
			_unBind: d(function () {
				this.__list__ = null;
				delete this.__redo__;
				if (!this.__context__) return;
				this.__context__.off("_add", this._onAdd);
				this.__context__.off("_delete", this._onDelete);
				this.__context__.off("_clear", this._onClear);
				this.__context__ = null;
			}),
			toString: d(function () {
				return "[object " + (this[Symbol.toStringTag] || "Object") + "]";
			})
		},
		autoBind({
			_onAdd: d(function (index) {
				if (index >= this.__nextIndex__) return;
				++this.__nextIndex__;
				if (!this.__redo__) {
					defineProperty(this, "__redo__", d("c", [index]));
					return;
				}
				this.__redo__.forEach(function (redo, i) {
					if (redo >= index) this.__redo__[i] = ++redo;
				}, this);
				this.__redo__.push(index);
			}),
			_onDelete: d(function (index) {
				var i;
				if (index >= this.__nextIndex__) return;
				--this.__nextIndex__;
				if (!this.__redo__) return;
				i = this.__redo__.indexOf(index);
				if (i !== -1) this.__redo__.splice(i, 1);
				this.__redo__.forEach(function (redo, j) {
					if (redo > index) this.__redo__[j] = --redo;
				}, this);
			}),
			_onClear: d(function () {
				if (this.__redo__) clear.call(this.__redo__);
				this.__nextIndex__ = 0;
			})
		})
	)
);

defineProperty(
	Iterator.prototype,
	Symbol.iterator,
	d(function () {
		return this;
	})
);

},{"d":39,"d/auto-bind":38,"es5-ext/array/#/clear":40,"es5-ext/object/assign":58,"es5-ext/object/valid-callable":76,"es5-ext/object/valid-value":77,"es6-symbol":95}],86:[function(require,module,exports){
"use strict";

var isArguments = require("es5-ext/function/is-arguments")
  , isValue     = require("es5-ext/object/is-value")
  , isString    = require("es5-ext/string/is-string");

var iteratorSymbol = require("es6-symbol").iterator
  , isArray        = Array.isArray;

module.exports = function (value) {
	if (!isValue(value)) return false;
	if (isArray(value)) return true;
	if (isString(value)) return true;
	if (isArguments(value)) return true;
	return typeof value[iteratorSymbol] === "function";
};

},{"es5-ext/function/is-arguments":45,"es5-ext/object/is-value":66,"es5-ext/string/is-string":81,"es6-symbol":95}],87:[function(require,module,exports){
// Thanks @mathiasbynens
// http://mathiasbynens.be/notes/javascript-unicode#iterating-over-symbols

"use strict";

var setPrototypeOf = require("es5-ext/object/set-prototype-of")
  , d              = require("d")
  , Symbol         = require("es6-symbol")
  , Iterator       = require("./");

var defineProperty = Object.defineProperty, StringIterator;

StringIterator = module.exports = function (str) {
	if (!(this instanceof StringIterator)) throw new TypeError("Constructor requires 'new'");
	str = String(str);
	Iterator.call(this, str);
	defineProperty(this, "__length__", d("", str.length));
};
if (setPrototypeOf) setPrototypeOf(StringIterator, Iterator);

// Internal %ArrayIteratorPrototype% doesn't expose its constructor
delete StringIterator.prototype.constructor;

StringIterator.prototype = Object.create(Iterator.prototype, {
	_next: d(function () {
		if (!this.__list__) return undefined;
		if (this.__nextIndex__ < this.__length__) return this.__nextIndex__++;
		this._unBind();
		return undefined;
	}),
	_resolve: d(function (i) {
		var char = this.__list__[i], code;
		if (this.__nextIndex__ === this.__length__) return char;
		code = char.charCodeAt(0);
		if (code >= 0xd800 && code <= 0xdbff) return char + this.__list__[this.__nextIndex__++];
		return char;
	})
});
defineProperty(StringIterator.prototype, Symbol.toStringTag, d("c", "String Iterator"));

},{"./":85,"d":39,"es5-ext/object/set-prototype-of":73,"es6-symbol":95}],88:[function(require,module,exports){
"use strict";

var isIterable = require("./is-iterable");

module.exports = function (value) {
	if (!isIterable(value)) throw new TypeError(value + " is not iterable");
	return value;
};

},{"./is-iterable":86}],89:[function(require,module,exports){
'use strict';

if (!require('./is-implemented')()) {
	Object.defineProperty(require('es5-ext/global'), 'Map',
		{ value: require('./polyfill'), configurable: true, enumerable: false,
			writable: true });
}

},{"./is-implemented":90,"./polyfill":94,"es5-ext/global":48}],90:[function(require,module,exports){
'use strict';

module.exports = function () {
	var map, iterator, result;
	if (typeof Map !== 'function') return false;
	try {
		// WebKit doesn't support arguments and crashes
		map = new Map([['raz', 'one'], ['dwa', 'two'], ['trzy', 'three']]);
	} catch (e) {
		return false;
	}
	if (String(map) !== '[object Map]') return false;
	if (map.size !== 3) return false;
	if (typeof map.clear !== 'function') return false;
	if (typeof map.delete !== 'function') return false;
	if (typeof map.entries !== 'function') return false;
	if (typeof map.forEach !== 'function') return false;
	if (typeof map.get !== 'function') return false;
	if (typeof map.has !== 'function') return false;
	if (typeof map.keys !== 'function') return false;
	if (typeof map.set !== 'function') return false;
	if (typeof map.values !== 'function') return false;

	iterator = map.entries();
	result = iterator.next();
	if (result.done !== false) return false;
	if (!result.value) return false;
	if (result.value[0] !== 'raz') return false;
	if (result.value[1] !== 'one') return false;

	return true;
};

},{}],91:[function(require,module,exports){
// Exports true if environment provides native `Map` implementation,
// whatever that is.

'use strict';

module.exports = (function () {
	if (typeof Map === 'undefined') return false;
	return (Object.prototype.toString.call(new Map()) === '[object Map]');
}());

},{}],92:[function(require,module,exports){
'use strict';

module.exports = require('es5-ext/object/primitive-set')('key',
	'value', 'key+value');

},{"es5-ext/object/primitive-set":72}],93:[function(require,module,exports){
'use strict';

var setPrototypeOf    = require('es5-ext/object/set-prototype-of')
  , d                 = require('d')
  , Iterator          = require('es6-iterator')
  , toStringTagSymbol = require('es6-symbol').toStringTag
  , kinds             = require('./iterator-kinds')

  , defineProperties = Object.defineProperties
  , unBind = Iterator.prototype._unBind
  , MapIterator;

MapIterator = module.exports = function (map, kind) {
	if (!(this instanceof MapIterator)) return new MapIterator(map, kind);
	Iterator.call(this, map.__mapKeysData__, map);
	if (!kind || !kinds[kind]) kind = 'key+value';
	defineProperties(this, {
		__kind__: d('', kind),
		__values__: d('w', map.__mapValuesData__)
	});
};
if (setPrototypeOf) setPrototypeOf(MapIterator, Iterator);

MapIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(MapIterator),
	_resolve: d(function (i) {
		if (this.__kind__ === 'value') return this.__values__[i];
		if (this.__kind__ === 'key') return this.__list__[i];
		return [this.__list__[i], this.__values__[i]];
	}),
	_unBind: d(function () {
		this.__values__ = null;
		unBind.call(this);
	}),
	toString: d(function () { return '[object Map Iterator]'; })
});
Object.defineProperty(MapIterator.prototype, toStringTagSymbol,
	d('c', 'Map Iterator'));

},{"./iterator-kinds":92,"d":39,"es5-ext/object/set-prototype-of":73,"es6-iterator":85,"es6-symbol":95}],94:[function(require,module,exports){
'use strict';

var clear          = require('es5-ext/array/#/clear')
  , eIndexOf       = require('es5-ext/array/#/e-index-of')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , callable       = require('es5-ext/object/valid-callable')
  , validValue     = require('es5-ext/object/valid-value')
  , d              = require('d')
  , ee             = require('event-emitter')
  , Symbol         = require('es6-symbol')
  , iterator       = require('es6-iterator/valid-iterable')
  , forOf          = require('es6-iterator/for-of')
  , Iterator       = require('./lib/iterator')
  , isNative       = require('./is-native-implemented')

  , call = Function.prototype.call
  , defineProperties = Object.defineProperties, getPrototypeOf = Object.getPrototypeOf
  , MapPoly;

module.exports = MapPoly = function (/*iterable*/) {
	var iterable = arguments[0], keys, values, self;
	if (!(this instanceof MapPoly)) throw new TypeError('Constructor requires \'new\'');
	if (isNative && setPrototypeOf && (Map !== MapPoly)) {
		self = setPrototypeOf(new Map(), getPrototypeOf(this));
	} else {
		self = this;
	}
	if (iterable != null) iterator(iterable);
	defineProperties(self, {
		__mapKeysData__: d('c', keys = []),
		__mapValuesData__: d('c', values = [])
	});
	if (!iterable) return self;
	forOf(iterable, function (value) {
		var key = validValue(value)[0];
		value = value[1];
		if (eIndexOf.call(keys, key) !== -1) return;
		keys.push(key);
		values.push(value);
	}, self);
	return self;
};

if (isNative) {
	if (setPrototypeOf) setPrototypeOf(MapPoly, Map);
	MapPoly.prototype = Object.create(Map.prototype, {
		constructor: d(MapPoly)
	});
}

ee(defineProperties(MapPoly.prototype, {
	clear: d(function () {
		if (!this.__mapKeysData__.length) return;
		clear.call(this.__mapKeysData__);
		clear.call(this.__mapValuesData__);
		this.emit('_clear');
	}),
	delete: d(function (key) {
		var index = eIndexOf.call(this.__mapKeysData__, key);
		if (index === -1) return false;
		this.__mapKeysData__.splice(index, 1);
		this.__mapValuesData__.splice(index, 1);
		this.emit('_delete', index, key);
		return true;
	}),
	entries: d(function () { return new Iterator(this, 'key+value'); }),
	forEach: d(function (cb/*, thisArg*/) {
		var thisArg = arguments[1], iterator, result;
		callable(cb);
		iterator = this.entries();
		result = iterator._next();
		while (result !== undefined) {
			call.call(cb, thisArg, this.__mapValuesData__[result],
				this.__mapKeysData__[result], this);
			result = iterator._next();
		}
	}),
	get: d(function (key) {
		var index = eIndexOf.call(this.__mapKeysData__, key);
		if (index === -1) return;
		return this.__mapValuesData__[index];
	}),
	has: d(function (key) {
		return (eIndexOf.call(this.__mapKeysData__, key) !== -1);
	}),
	keys: d(function () { return new Iterator(this, 'key'); }),
	set: d(function (key, value) {
		var index = eIndexOf.call(this.__mapKeysData__, key), emit;
		if (index === -1) {
			index = this.__mapKeysData__.push(key) - 1;
			emit = true;
		}
		this.__mapValuesData__[index] = value;
		if (emit) this.emit('_add', index, key);
		return this;
	}),
	size: d.gs(function () { return this.__mapKeysData__.length; }),
	values: d(function () { return new Iterator(this, 'value'); }),
	toString: d(function () { return '[object Map]'; })
}));
Object.defineProperty(MapPoly.prototype, Symbol.iterator, d(function () {
	return this.entries();
}));
Object.defineProperty(MapPoly.prototype, Symbol.toStringTag, d('c', 'Map'));

},{"./is-native-implemented":91,"./lib/iterator":93,"d":39,"es5-ext/array/#/clear":40,"es5-ext/array/#/e-index-of":41,"es5-ext/object/set-prototype-of":73,"es5-ext/object/valid-callable":76,"es5-ext/object/valid-value":77,"es6-iterator/for-of":83,"es6-iterator/valid-iterable":88,"es6-symbol":95,"event-emitter":100}],95:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? Symbol : require('./polyfill');

},{"./is-implemented":96,"./polyfill":98}],96:[function(require,module,exports){
'use strict';

var validTypes = { object: true, symbol: true };

module.exports = function () {
	var symbol;
	if (typeof Symbol !== 'function') return false;
	symbol = Symbol('test symbol');
	try { String(symbol); } catch (e) { return false; }

	// Return 'true' also for polyfills
	if (!validTypes[typeof Symbol.iterator]) return false;
	if (!validTypes[typeof Symbol.toPrimitive]) return false;
	if (!validTypes[typeof Symbol.toStringTag]) return false;

	return true;
};

},{}],97:[function(require,module,exports){
'use strict';

module.exports = function (x) {
	if (!x) return false;
	if (typeof x === 'symbol') return true;
	if (!x.constructor) return false;
	if (x.constructor.name !== 'Symbol') return false;
	return (x[x.constructor.toStringTag] === 'Symbol');
};

},{}],98:[function(require,module,exports){
// ES2015 Symbol polyfill for environments that do not (or partially) support it

'use strict';

var d              = require('d')
  , validateSymbol = require('./validate-symbol')

  , create = Object.create, defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
  , NativeSymbol, SymbolPolyfill, HiddenSymbol, globalSymbols = create(null)
  , isNativeSafe;

if (typeof Symbol === 'function') {
	NativeSymbol = Symbol;
	try {
		String(NativeSymbol());
		isNativeSafe = true;
	} catch (ignore) {}
}

var generateName = (function () {
	var created = create(null);
	return function (desc) {
		var postfix = 0, name, ie11BugWorkaround;
		while (created[desc + (postfix || '')]) ++postfix;
		desc += (postfix || '');
		created[desc] = true;
		name = '@@' + desc;
		defineProperty(objPrototype, name, d.gs(null, function (value) {
			// For IE11 issue see:
			// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
			//    ie11-broken-getters-on-dom-objects
			// https://github.com/medikoo/es6-symbol/issues/12
			if (ie11BugWorkaround) return;
			ie11BugWorkaround = true;
			defineProperty(this, name, d(value));
			ie11BugWorkaround = false;
		}));
		return name;
	};
}());

// Internal constructor (not one exposed) for creating Symbol instances.
// This one is used to ensure that `someSymbol instanceof Symbol` always return false
HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError('Symbol is not a constructor');
	return SymbolPolyfill(description);
};

// Exposed `Symbol` constructor
// (returns instances of HiddenSymbol)
module.exports = SymbolPolyfill = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError('Symbol is not a constructor');
	if (isNativeSafe) return NativeSymbol(description);
	symbol = create(HiddenSymbol.prototype);
	description = (description === undefined ? '' : String(description));
	return defineProperties(symbol, {
		__description__: d('', description),
		__name__: d('', generateName(description))
	});
};
defineProperties(SymbolPolyfill, {
	for: d(function (key) {
		if (globalSymbols[key]) return globalSymbols[key];
		return (globalSymbols[key] = SymbolPolyfill(String(key)));
	}),
	keyFor: d(function (s) {
		var key;
		validateSymbol(s);
		for (key in globalSymbols) if (globalSymbols[key] === s) return key;
	}),

	// To ensure proper interoperability with other native functions (e.g. Array.from)
	// fallback to eventual native implementation of given symbol
	hasInstance: d('', (NativeSymbol && NativeSymbol.hasInstance) || SymbolPolyfill('hasInstance')),
	isConcatSpreadable: d('', (NativeSymbol && NativeSymbol.isConcatSpreadable) ||
		SymbolPolyfill('isConcatSpreadable')),
	iterator: d('', (NativeSymbol && NativeSymbol.iterator) || SymbolPolyfill('iterator')),
	match: d('', (NativeSymbol && NativeSymbol.match) || SymbolPolyfill('match')),
	replace: d('', (NativeSymbol && NativeSymbol.replace) || SymbolPolyfill('replace')),
	search: d('', (NativeSymbol && NativeSymbol.search) || SymbolPolyfill('search')),
	species: d('', (NativeSymbol && NativeSymbol.species) || SymbolPolyfill('species')),
	split: d('', (NativeSymbol && NativeSymbol.split) || SymbolPolyfill('split')),
	toPrimitive: d('', (NativeSymbol && NativeSymbol.toPrimitive) || SymbolPolyfill('toPrimitive')),
	toStringTag: d('', (NativeSymbol && NativeSymbol.toStringTag) || SymbolPolyfill('toStringTag')),
	unscopables: d('', (NativeSymbol && NativeSymbol.unscopables) || SymbolPolyfill('unscopables'))
});

// Internal tweaks for real symbol producer
defineProperties(HiddenSymbol.prototype, {
	constructor: d(SymbolPolyfill),
	toString: d('', function () { return this.__name__; })
});

// Proper implementation of methods exposed on Symbol.prototype
// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
defineProperties(SymbolPolyfill.prototype, {
	toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, d('', function () {
	var symbol = validateSymbol(this);
	if (typeof symbol === 'symbol') return symbol;
	return symbol.toString();
}));
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d('c', 'Symbol'));

// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toStringTag]));

// Note: It's important to define `toPrimitive` as last one, as some implementations
// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
// And that may invoke error in definition flow:
// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive]));

},{"./validate-symbol":99,"d":39}],99:[function(require,module,exports){
'use strict';

var isSymbol = require('./is-symbol');

module.exports = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

},{"./is-symbol":97}],100:[function(require,module,exports){
'use strict';

var d        = require('d')
  , callable = require('es5-ext/object/valid-callable')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit, methods, descriptors, base;

on = function (type, listener) {
	var data;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) {
		data = descriptor.value = create(null);
		defineProperty(this, '__ee__', descriptor);
		descriptor.value = null;
	} else {
		data = this.__ee__;
	}
	if (!data[type]) data[type] = listener;
	else if (typeof data[type] === 'object') data[type].push(listener);
	else data[type] = [data[type], listener];

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once.__eeOnceListener__ = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) return this;
	data = this.__ee__;
	if (!data[type]) return this;
	listeners = data[type];

	if (typeof listeners === 'object') {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) ||
					(candidate.__eeOnceListener__ === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) ||
				(listeners.__eeOnceListener__ === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var i, l, listener, listeners, args;

	if (!hasOwnProperty.call(this, '__ee__')) return;
	listeners = this.__ee__[type];
	if (!listeners) return;

	if (typeof listeners === 'object') {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

},{"d":39,"es5-ext/object/valid-callable":76}],101:[function(require,module,exports){
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

},{}],102:[function(require,module,exports){
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

},{"_process":101,"timers":112}],103:[function(require,module,exports){
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

},{"./selectorParser":109}],104:[function(require,module,exports){
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

},{}],105:[function(require,module,exports){
"use strict";
var query_1 = require('./query');
var parent_symbol_1 = require('./parent-symbol');
function findMatches(cssSelector, vNode) {
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

},{"./parent-symbol":107,"./query":108}],106:[function(require,module,exports){
"use strict";
var curry2_1 = require('./curry2');
var findMatches_1 = require('./findMatches');
exports.select = curry2_1.curry2(findMatches_1.findMatches);
var selectorParser_1 = require('./selectorParser');
exports.selectorParser = selectorParser_1.selectorParser;
var classNameFromVNode_1 = require('./classNameFromVNode');
exports.classNameFromVNode = classNameFromVNode_1.classNameFromVNode;

},{"./classNameFromVNode":103,"./curry2":104,"./findMatches":105,"./selectorParser":109}],107:[function(require,module,exports){
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

},{}],108:[function(require,module,exports){
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

},{"./classNameFromVNode":103,"./parent-symbol":107,"./selectorParser":109,"tree-selector":113}],109:[function(require,module,exports){
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

},{}],110:[function(require,module,exports){
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

},{"./ponyfill.js":111}],111:[function(require,module,exports){
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
},{}],112:[function(require,module,exports){
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

},{"process/browser.js":101,"timers":112}],113:[function(require,module,exports){
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

},{"./matches":114,"./querySelector":115,"./selectorParser":116}],114:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var selectorParser_1 = require("./selectorParser");
function createMatches(opts) {
    return function matches(selector, node) {
        var _a = typeof selector === 'object' ? selector : selectorParser_1.parseSelector(selector), tag = _a.tag, id = _a.id, classList = _a.classList, attributes = _a.attributes, nextSelector = _a.nextSelector, pseudos = _a.pseudos;
        if (nextSelector !== undefined) {
            throw new Error('matches can only process selectors that target a single element');
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
            if (!attr) {
                return false;
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

},{"./selectorParser":116}],115:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var selectorParser_1 = require("./selectorParser");
var matches_1 = require("./matches");
function createQuerySelector(options, matches) {
    var _matches = matches || matches_1.createMatches(options);
    function findSubtree(selector, depth, node) {
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
        if (options.parent(node) === undefined) {
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

},{"./matches":114,"./selectorParser":116}],116:[function(require,module,exports){
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
        return (_b = {},
            _b[attr] = [getOp(op), val ? parseAttrValue(val) : val],
            _b);
        var _b;
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
            return 'truthy';
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

},{}],117:[function(require,module,exports){
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

},{"../index":120}],118:[function(require,module,exports){
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

},{"../index":120}],119:[function(require,module,exports){
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

},{"../index":120}],120:[function(require,module,exports){
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

},{"symbol-observable":110}],121:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _delay = require('xstream/extra/delay');

var _delay2 = _interopRequireDefault(_delay);

var _dom = require('@cycle/dom');

var _run = require('@cycle/run');

var _action = require('@cycle-robot-drivers/action');

var _screen = require('@cycle-robot-drivers/screen');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function main(sources) {
  sources.proxies = { // will be connected to "targets"
    FacialExpressionAction: _xstream2.default.create(),
    TwoSpeechbubblesAction: _xstream2.default.create()
  };
  // create action components
  sources.TwoSpeechbubblesAction = (0, _screen.IsolatedTwoSpeechbubblesAction)({
    goal: sources.proxies.TwoSpeechbubblesAction,
    DOM: sources.DOM
  });
  sources.FacialExpressionAction = (0, _screen.FacialExpressionAction)({
    goal: sources.proxies.FacialExpressionAction,
    TabletFace: sources.TabletFace
  });

  // main logic
  var speechbubbles$ = _xstream2.default.merge(
  // xs.of('Hello there!').compose(delay(1000)),
  _xstream2.default.of({
    message: 'How are you?',
    choices: ['Good', 'Bad']
  }).compose((0, _delay2.default)(200)), _xstream2.default.of(null).compose((0, _delay2.default)(1000))
  // sources.TwoSpeechbubblesAction.result
  //   .filter(result => !!result.result)
  //   .map(result => {
  //     if (result.result === 'Good') {
  //       return 'Great!';
  //     } else if (result.result === 'Bad') {
  //       return 'Sorry to hear that...';
  //     }
  //   }),
  );

  sources.TwoSpeechbubblesAction.result.addListener({
    next: function next(value) {
      return console.log('result', value);
    }
  });

  // const expression$ = sources.TwoSpeechbubblesAction.result.map((result) => {
  //   if (result.result === 'Good') {
  //     return 'happy';
  //   } else if (result.result === 'Bad') {
  //     return 'sad';
  //   }
  // });
  var expression$ = _xstream2.default.never();

  var vdom$ = _xstream2.default.combine(sources.TwoSpeechbubblesAction.DOM, sources.TabletFace.DOM).map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        speechbubbles = _ref2[0],
        face = _ref2[1];

    return (0, _dom.div)([speechbubbles, face]);
  });

  return {
    DOM: vdom$,
    TabletFace: sources.FacialExpressionAction.output,
    targets: { // will be imitating "proxies"
      TwoSpeechbubblesAction: speechbubbles$,
      FacialExpressionAction: expression$
    }
  };
}

(0, _run.run)((0, _action.powerup)(main, function (proxy, target) {
  return proxy.imitate(target);
}), {
  DOM: (0, _dom.makeDOMDriver)('#app'),
  TabletFace: (0, _screen.makeTabletFaceDriver)()
});

},{"@cycle-robot-drivers/action":1,"@cycle-robot-drivers/screen":125,"@cycle/dom":14,"@cycle/run":36,"xstream":120,"xstream/extra/delay":118}],122:[function(require,module,exports){
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
        console.debug('state', state, 'action', action);
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
        console.warn("Unhandled state.status " + state.status + " action.type " + action.type);
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

},{"@cycle-robot-drivers/action":127,"@cycle/run/lib/adapt":161,"xstream":243,"xstream/extra/dropRepeats":241}],123:[function(require,module,exports){
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
                            ? dom_1.span(inputValue.goal.value)
                            : inputValue.goal.type === SpeechbubbleType.CHOICE
                                ? dom_1.span(inputValue.goal.value.map(function (text) { return dom_1.button('.choice', text); })) : ''
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
                            ? dom_1.span(inputValue.goal.value)
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
        return !transitionTable[state]
            ? state
            : !transitionTable[state][input.type]
                ? state
                : transitionTable[state][input.type](variables, input.value);
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
 *   * goal: a stream of `null` (as "cancel"), `{type: 'MESSAGE', value: 'Hello world'}` for displaying message or `{type: 'MESSAGE', value: ['Hello', 'World']}` for displaying choices.
 *   * DOM: Cycle.js [DOMSource](https://cycle.js.org/api/dom.html).
 *
 * @return sinks
 *
 *   * DOM: a stream of virtual DOM objects, i.e, [Snabbdom “VNode” objects](https://github.com/snabbdom/snabbdom).
 *   * result: a stream of action results.
 *
 */
function SpeechbubbleAction(sources) {
    var input$ = input(xstream_1.default.fromObservable(sources.goal), xstream_1.default.fromObservable(sources.DOM.select('.choice').elements()
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

},{"@cycle-robot-drivers/action":127,"@cycle/dom":140,"@cycle/isolate":160,"@cycle/run/lib/adapt":161,"xstream":243}],124:[function(require,module,exports){
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
    InputType["SB_RESULT"] = "SB_RESULT";
})(InputType || (InputType = {}));
var TwoSpeechbubblesType;
(function (TwoSpeechbubblesType) {
    TwoSpeechbubblesType["SET_MESSAGE"] = "SET_MESSAGE";
    TwoSpeechbubblesType["ASK_QUESTION"] = "ASK_QUESTION";
})(TwoSpeechbubblesType = exports.TwoSpeechbubblesType || (exports.TwoSpeechbubblesType = {}));
function input(goal$, robotSpeechbubbleResult, humanSpeechbubbleResult) {
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
    }), robotSpeechbubbleResult.map(function (result) { return ({
        type: InputType.SB_RESULT,
        value: result,
    }); }), humanSpeechbubbleResult.map(function (result) { return ({
        type: InputType.SB_RESULT,
        value: result,
    }); }));
}
function createTransition() {
    var transitionTable = (_a = {},
        _a[State.DONE] = (_b = {},
            _b[InputType.GOAL] = function (variables, inputValue) {
                return (inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE
                    || inputValue.goal.type === TwoSpeechbubblesType.ASK_QUESTION) ? {
                    state: State.RUNNING,
                    variables: {
                        goal_id: inputValue.goal_id,
                        numActions: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE
                            ? 1 : 2,
                        result: null,
                        newGoal: null,
                    },
                    outputs: inputValue.goal.type === TwoSpeechbubblesType.SET_MESSAGE
                        ? {
                            RobotSpeechbubble: {
                                goal_id: inputValue.goal_id,
                                goal: inputValue.goal.value
                            },
                        } : {
                        RobotSpeechbubble: {
                            goal_id: inputValue.goal_id,
                            goal: inputValue.goal.value.message
                        },
                        HumanSpeechbubble: {
                            goal_id: inputValue.goal_id,
                            goal: inputValue.goal.value.choices
                        },
                    },
                } : null;
            },
            _b),
        _a[State.RUNNING] = (_c = {},
            _c[InputType.CANCEL] = function (variables, inputValue) { return ({
                state: State.RUNNING,
                variables: variables,
                outputs: {
                    RobotSpeechbubble: null,
                    HumanSpeechbubble: null,
                }
            }); },
            _c[InputType.SB_RESULT] = function (variables, inputValue) {
                return action_1.isEqual(inputValue.status.goal_id, variables.goal_id)
                    ? (variables.numActions === 1)
                        ? {
                            state: State.DONE,
                            variables: {
                                goal_id: null,
                                numActions: 0,
                                result: null,
                                newGoal: null,
                            },
                            outputs: {
                                result: variables.result,
                            },
                        } : {
                        state: State.RUNNING,
                        variables: {
                            goal_id: variables.goal_id,
                            numActions: variables.numActions - 1,
                            result: inputValue,
                            newGoal: variables.newGoal,
                        },
                        outputs: {
                            RobotSpeechbubble: null,
                        },
                    }
                    : null;
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
                numActions: 0,
                result: null,
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
        .map(function (machine) { return machine.outputs; }).debug();
    return {
        result: adapt_1.adapt(outputs$
            .filter(function (outputs) { return !!outputs.result; })
            .map(function (outputs) { return outputs.result; }).debug()),
        RobotSpeechbubble: adapt_1.adapt(outputs$
            .filter(function (outputs) { return typeof (outputs.RobotSpeechbubble) !== 'undefined'; })
            .map(function (outputs) { return outputs.RobotSpeechbubble; })),
        HumanSpeechbubble: adapt_1.adapt(outputs$
            .filter(function (outputs) { return typeof (outputs.HumanSpeechbubble) !== 'undefined'; })
            .map(function (outputs) { return outputs.HumanSpeechbubble; })),
    };
}
function TwoSpeechbubblesAction(sources) {
    // create proxies
    var robotSpeechbubbleResult = xstream_1.default.create();
    var humanSpeechbubbleResult = xstream_1.default.create();
    var input$ = input(xstream_1.default.fromObservable(sources.goal), robotSpeechbubbleResult, humanSpeechbubbleResult);
    var machine$ = transitionReducer(input$)
        .fold(function (state, reducer) { return reducer(state); }, null)
        .drop(1).debug(); // drop "null";
    var _a = output(machine$), result = _a.result, RobotSpeechbubble = _a.RobotSpeechbubble, HumanSpeechbubble = _a.HumanSpeechbubble;
    // create sub-components
    var robotSpeechbubble = SpeechbubbleAction_1.IsolatedSpeechbubbleAction({
        goal: RobotSpeechbubble,
        DOM: sources.DOM,
    });
    var humanSpeechbubble = SpeechbubbleAction_1.IsolatedSpeechbubbleAction({
        goal: HumanSpeechbubble,
        DOM: sources.DOM,
    });
    // connect proxies
    robotSpeechbubbleResult.imitate(robotSpeechbubble.result);
    humanSpeechbubbleResult.imitate(humanSpeechbubble.result);
    var vdom$ = xstream_1.default.combine(robotSpeechbubble.DOM, humanSpeechbubble.DOM)
        .map(function (_a) {
        var robotVTree = _a[0], humanVTree = _a[1];
        return dom_1.div([
            dom_1.div([dom_1.span('Robot:'), dom_1.span(robotVTree)]),
            dom_1.div([dom_1.span('Human:'), dom_1.span(humanVTree)]),
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

},{"./SpeechbubbleAction":123,"@cycle-robot-drivers/action":127,"@cycle/dom":140,"@cycle/isolate":160,"@cycle/run/lib/adapt":161,"xstream":243}],125:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tablet_face_1 = require("./tablet_face");
exports.ExpressCommandType = tablet_face_1.ExpressCommandType;
exports.makeTabletFaceDriver = tablet_face_1.makeTabletFaceDriver;
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

},{"./FacialExpressionAction":122,"./SpeechbubbleAction":123,"./TwoSpeechbubblesAction":124,"./tablet_face":126}],126:[function(require,module,exports){
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var snabbdom_pragma_1 = __importDefault(require("snabbdom-pragma"));
var xstream_1 = __importDefault(require("xstream"));
var adapt_1 = require("@cycle/run/lib/adapt");
// adapted from
//   https://github.com/mjyc/tablet-robot-face/blob/709b731dff04033c08cf045adc4e038eefa750a2/index.js#L3-L184
var EyeController = /** @class */ (function () {
    function EyeController(elements, eyeSize) {
        if (elements === void 0) { elements = {}; }
        if (eyeSize === void 0) { eyeSize = '33.33vh'; }
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
    CommandType["SPEECHBUBBLES"] = "SPEECHBUBBLES";
})(CommandType || (CommandType = {}));
var ExpressCommandType;
(function (ExpressCommandType) {
    ExpressCommandType["HAPPY"] = "happy";
    ExpressCommandType["SAD"] = "sad";
    ExpressCommandType["ANGRY"] = "angry";
    ExpressCommandType["FOCUSED"] = "focused";
    ExpressCommandType["CONFUSED"] = "confused";
})(ExpressCommandType = exports.ExpressCommandType || (exports.ExpressCommandType = {}));
function makeTabletFaceDriver(_a) {
    var _b = (_a === void 0 ? { styles: {} } : _a).styles, _c = _b.faceColor, faceColor = _c === void 0 ? 'whitesmoke' : _c, _d = _b.faceHeight, faceHeight = _d === void 0 ? '100vh' : _d, _e = _b.faceWidth, faceWidth = _e === void 0 ? '100vw' : _e, _f = _b.eyeColor, eyeColor = _f === void 0 ? 'black' : _f, _g = _b.eyeSize, eyeSize = _g === void 0 ? '33.33vh' : _g, _h = _b.eyelidColor, eyelidColor = _h === void 0 ? 'whitesmoke' : _h;
    var styles = {
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
        var speechbubblesDOM$ = xstream_1.default.create();
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
                    case CommandType.SPEECHBUBBLES:
                        speechbubblesDOM$.shamefullySendNext(command.value);
                        break;
                }
            }
        });
        var vnode$ = xstream_1.default.of(snabbdom_pragma_1.default.createElement("div", { className: "face", style: styles.face, id: id },
            snabbdom_pragma_1.default.createElement("div", { className: "eye left", style: Object.assign({}, styles.eye, styles.left) },
                snabbdom_pragma_1.default.createElement("div", { className: "eyelid upper", style: Object.assign({}, styles.eyelid, styles.upper) }),
                snabbdom_pragma_1.default.createElement("div", { className: "eyelid lower", style: Object.assign({}, styles.eyelid, styles.lower) })),
            snabbdom_pragma_1.default.createElement("div", { className: "eye right", style: Object.assign({}, styles.eye, styles.right) },
                snabbdom_pragma_1.default.createElement("div", { className: "eyelid upper", style: Object.assign({}, styles.eyelid, styles.upper) }),
                snabbdom_pragma_1.default.createElement("div", { className: "eyelid lower", style: Object.assign({}, styles.eyelid, styles.lower) }))));
        return {
            DOM: adapt_1.adapt(vnode$),
            animationFinish: adapt_1.adapt(animationFinish$$.flatten()),
            load: adapt_1.adapt(load$),
        };
    };
}
exports.makeTabletFaceDriver = makeTabletFaceDriver;

},{"@cycle/run/lib/adapt":161,"snabbdom-pragma":226,"xstream":243}],127:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"./types":128,"./utils":129,"dup":1}],128:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2}],129:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],130:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"./fromEvent":138,"@cycle/run/lib/adapt":161,"dup":4,"xstream":243}],131:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"./fromEvent":138,"@cycle/run/lib/adapt":161,"dup":5,"xstream":243}],132:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"./ScopeChecker":136,"./matchesSelector":143,"./utils":147,"dup":6}],133:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"./ScopeChecker":136,"./fromEvent":138,"./matchesSelector":143,"./utils":147,"dup":7,"xstream":243}],134:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],135:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"./BodyDOMSource":130,"./DocumentDOMSource":131,"./ElementFinder":132,"./EventDelegator":133,"./fromEvent":138,"./isolate":141,"./utils":147,"@cycle/run/lib/adapt":161,"dup":9}],136:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],137:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"./utils":147,"dup":11,"snabbdom-selector":230,"snabbdom/h":148,"snabbdom/vnode":159}],138:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12,"xstream":243}],139:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"snabbdom/h":148}],140:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"./MainDOMSource":135,"./hyperscript-helpers":139,"./makeDOMDriver":142,"./mockDOMSource":144,"./thunk":146,"dup":14,"snabbdom/h":148}],141:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./utils":147,"dup":15,"snabbdom/vnode":159}],142:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"./IsolateModule":134,"./MainDOMSource":135,"./VNodeWrapper":137,"./modules":145,"./utils":147,"dup":16,"es6-map/implement":213,"snabbdom":156,"snabbdom/tovnode":158,"xstream":243,"xstream/extra/concat":240,"xstream/extra/sampleCombine":242}],143:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17}],144:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"@cycle/run/lib/adapt":161,"dup":18,"xstream":243}],145:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"snabbdom/modules/attributes":151,"snabbdom/modules/class":152,"snabbdom/modules/dataset":153,"snabbdom/modules/props":154,"snabbdom/modules/style":155}],146:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20,"snabbdom/h":148}],147:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],148:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"./is":150,"./vnode":159,"dup":22}],149:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],150:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24}],151:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],152:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26}],153:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27}],154:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"dup":28}],155:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"dup":29}],156:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"./h":148,"./htmldomapi":149,"./is":150,"./thunk":157,"./vnode":159,"dup":30}],157:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"./h":148,"dup":31}],158:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"./htmldomapi":149,"./vnode":159,"dup":32}],159:[function(require,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"dup":33}],160:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":161,"xstream":243}],161:[function(require,module,exports){
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

},{}],162:[function(require,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"dup":38,"es5-ext/object/copy":185,"es5-ext/object/map":194,"es5-ext/object/normalize-options":195,"es5-ext/object/valid-callable":200,"es5-ext/object/valid-value":201}],163:[function(require,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"dup":39,"es5-ext/object/assign":182,"es5-ext/object/is-callable":188,"es5-ext/object/normalize-options":195,"es5-ext/string/#/contains":202}],164:[function(require,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"../../object/valid-value":201,"dup":40}],165:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"../../number/is-nan":176,"../../number/to-pos-integer":180,"../../object/valid-value":201,"dup":41}],166:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"./is-implemented":167,"./shim":168,"dup":42}],167:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"dup":43}],168:[function(require,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"../../function/is-arguments":169,"../../function/is-function":170,"../../number/to-pos-integer":180,"../../object/is-value":190,"../../object/valid-callable":200,"../../object/valid-value":201,"../../string/is-string":205,"dup":44,"es6-symbol":219}],169:[function(require,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"dup":45}],170:[function(require,module,exports){
arguments[4][46][0].apply(exports,arguments)
},{"./noop":171,"dup":46}],171:[function(require,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"dup":47}],172:[function(require,module,exports){
arguments[4][48][0].apply(exports,arguments)
},{"dup":48}],173:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"./is-implemented":174,"./shim":175,"dup":49}],174:[function(require,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"dup":50}],175:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51}],176:[function(require,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"./is-implemented":177,"./shim":178,"dup":52}],177:[function(require,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"dup":53}],178:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"dup":54}],179:[function(require,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"../math/sign":173,"dup":55}],180:[function(require,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"./to-integer":179,"dup":56}],181:[function(require,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"./valid-callable":200,"./valid-value":201,"dup":57}],182:[function(require,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"./is-implemented":183,"./shim":184,"dup":58}],183:[function(require,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"dup":59}],184:[function(require,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"../keys":191,"../valid-value":201,"dup":60}],185:[function(require,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"../array/from":166,"./assign":182,"./valid-value":201,"dup":61}],186:[function(require,module,exports){
arguments[4][62][0].apply(exports,arguments)
},{"./set-prototype-of/is-implemented":198,"./set-prototype-of/shim":199,"dup":62}],187:[function(require,module,exports){
arguments[4][63][0].apply(exports,arguments)
},{"./_iterate":181,"dup":63}],188:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64}],189:[function(require,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"./is-value":190,"dup":65}],190:[function(require,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"../function/noop":171,"dup":66}],191:[function(require,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"./is-implemented":192,"./shim":193,"dup":67}],192:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"dup":68}],193:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"../is-value":190,"dup":69}],194:[function(require,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"./for-each":187,"./valid-callable":200,"dup":70}],195:[function(require,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"./is-value":190,"dup":71}],196:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],197:[function(require,module,exports){
arguments[4][73][0].apply(exports,arguments)
},{"./is-implemented":198,"./shim":199,"dup":73}],198:[function(require,module,exports){
arguments[4][74][0].apply(exports,arguments)
},{"dup":74}],199:[function(require,module,exports){
arguments[4][75][0].apply(exports,arguments)
},{"../create":186,"../is-object":189,"../valid-value":201,"dup":75}],200:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],201:[function(require,module,exports){
arguments[4][77][0].apply(exports,arguments)
},{"./is-value":190,"dup":77}],202:[function(require,module,exports){
arguments[4][78][0].apply(exports,arguments)
},{"./is-implemented":203,"./shim":204,"dup":78}],203:[function(require,module,exports){
arguments[4][79][0].apply(exports,arguments)
},{"dup":79}],204:[function(require,module,exports){
arguments[4][80][0].apply(exports,arguments)
},{"dup":80}],205:[function(require,module,exports){
arguments[4][81][0].apply(exports,arguments)
},{"dup":81}],206:[function(require,module,exports){
arguments[4][82][0].apply(exports,arguments)
},{"./":209,"d":163,"dup":82,"es5-ext/object/set-prototype-of":197,"es5-ext/string/#/contains":202,"es6-symbol":219}],207:[function(require,module,exports){
arguments[4][83][0].apply(exports,arguments)
},{"./get":208,"dup":83,"es5-ext/function/is-arguments":169,"es5-ext/object/valid-callable":200,"es5-ext/string/is-string":205}],208:[function(require,module,exports){
arguments[4][84][0].apply(exports,arguments)
},{"./array":206,"./string":211,"./valid-iterable":212,"dup":84,"es5-ext/function/is-arguments":169,"es5-ext/string/is-string":205,"es6-symbol":219}],209:[function(require,module,exports){
arguments[4][85][0].apply(exports,arguments)
},{"d":163,"d/auto-bind":162,"dup":85,"es5-ext/array/#/clear":164,"es5-ext/object/assign":182,"es5-ext/object/valid-callable":200,"es5-ext/object/valid-value":201,"es6-symbol":219}],210:[function(require,module,exports){
arguments[4][86][0].apply(exports,arguments)
},{"dup":86,"es5-ext/function/is-arguments":169,"es5-ext/object/is-value":190,"es5-ext/string/is-string":205,"es6-symbol":219}],211:[function(require,module,exports){
arguments[4][87][0].apply(exports,arguments)
},{"./":209,"d":163,"dup":87,"es5-ext/object/set-prototype-of":197,"es6-symbol":219}],212:[function(require,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"./is-iterable":210,"dup":88}],213:[function(require,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"./is-implemented":214,"./polyfill":218,"dup":89,"es5-ext/global":172}],214:[function(require,module,exports){
arguments[4][90][0].apply(exports,arguments)
},{"dup":90}],215:[function(require,module,exports){
arguments[4][91][0].apply(exports,arguments)
},{"dup":91}],216:[function(require,module,exports){
arguments[4][92][0].apply(exports,arguments)
},{"dup":92,"es5-ext/object/primitive-set":196}],217:[function(require,module,exports){
arguments[4][93][0].apply(exports,arguments)
},{"./iterator-kinds":216,"d":163,"dup":93,"es5-ext/object/set-prototype-of":197,"es6-iterator":209,"es6-symbol":219}],218:[function(require,module,exports){
arguments[4][94][0].apply(exports,arguments)
},{"./is-native-implemented":215,"./lib/iterator":217,"d":163,"dup":94,"es5-ext/array/#/clear":164,"es5-ext/array/#/e-index-of":165,"es5-ext/object/set-prototype-of":197,"es5-ext/object/valid-callable":200,"es5-ext/object/valid-value":201,"es6-iterator/for-of":207,"es6-iterator/valid-iterable":212,"es6-symbol":219,"event-emitter":224}],219:[function(require,module,exports){
arguments[4][95][0].apply(exports,arguments)
},{"./is-implemented":220,"./polyfill":222,"dup":95}],220:[function(require,module,exports){
arguments[4][96][0].apply(exports,arguments)
},{"dup":96}],221:[function(require,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"dup":97}],222:[function(require,module,exports){
arguments[4][98][0].apply(exports,arguments)
},{"./validate-symbol":223,"d":163,"dup":98}],223:[function(require,module,exports){
arguments[4][99][0].apply(exports,arguments)
},{"./is-symbol":221,"dup":99}],224:[function(require,module,exports){
arguments[4][100][0].apply(exports,arguments)
},{"d":163,"dup":100,"es5-ext/object/valid-callable":200}],225:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;
var defineProperty = Object.defineProperty;
var gOPD = Object.getOwnPropertyDescriptor;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) { /**/ }

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

// If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
var setProperty = function setProperty(target, options) {
	if (defineProperty && options.name === '__proto__') {
		defineProperty(target, options.name, {
			enumerable: true,
			configurable: true,
			value: options.newValue,
			writable: true
		});
	} else {
		target[options.name] = options.newValue;
	}
};

// Return undefined instead of __proto__ if '__proto__' is not an own property
var getProperty = function getProperty(obj, name) {
	if (name === '__proto__') {
		if (!hasOwn.call(obj, name)) {
			return void 0;
		} else if (gOPD) {
			// In early versions of node, obj['__proto__'] is buggy when obj has
			// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
			return gOPD(obj, name).value;
		}
	}

	return obj[name];
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone;
	var target = arguments[0];
	var i = 1;
	var length = arguments.length;
	var deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}
	if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = getProperty(target, name);
				copy = getProperty(options, name);

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						setProperty(target, { name: name, newValue: copy });
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};

},{}],226:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _extend = _interopDefault(require('extend'));

var undefinedv = function (v) { return v === undefined; };

var number = function (v) { return typeof v === 'number'; };

var string = function (v) { return typeof v === 'string'; };

var text = function (v) { return string(v) || number(v); };

var array = function (v) { return Array.isArray(v); };

var object = function (v) { return typeof v === 'object' && v !== null; };

var fun = function (v) { return typeof v === 'function'; };

var vnode = function (v) { return object(v) && 'sel' in v && 'data' in v && 'children' in v && 'text' in v; };

var svgPropsMap = { svg: 1, circle: 1, ellipse: 1, line: 1, polygon: 1,
  polyline: 1, rect: 1, g: 1, path: 1, text: 1 };

var svg = function (v) { return v.sel in svgPropsMap; };

// TODO: stop using extend here
var extend = function () {
  var objs = [], len = arguments.length;
  while ( len-- ) objs[ len ] = arguments[ len ];

  return _extend.apply(void 0, [ true ].concat( objs ));
};

var assign = function () {
  var objs = [], len = arguments.length;
  while ( len-- ) objs[ len ] = arguments[ len ];

  return _extend.apply(void 0, [ false ].concat( objs ));
};

var reduceDeep = function (arr, fn, initial) {
  var result = initial;
  for (var i = 0; i < arr.length; i++) {
    var value = arr[i];
    if (array(value)) {
      result = reduceDeep(value, fn, result);
    } else {
      result = fn(result, value);
    }
  }
  return result
};

var mapObject = function (obj, fn) { return Object.keys(obj).map(
  function (key) { return fn(key, obj[key]); }
).reduce(
  function (acc, curr) { return extend(acc, curr); },
  {}
); };

var deepifyKeys = function (obj) { return mapObject(obj,
  function (key, val) {
    var dashIndex = key.indexOf('-');
    if (dashIndex > -1) {
      var moduleData = {};
      moduleData[key.slice(dashIndex + 1)] = val;
      return ( obj = {}, obj[key.slice(0, dashIndex)] = moduleData, obj )
      var obj;
    }
    return ( obj$1 = {}, obj$1[key] = val, obj$1 )
    var obj$1;
  }
); };

var flatifyKeys = function (obj) { return mapObject(obj,
  function (mod, data) { return !object(data) ? (( obj = {}, obj[mod] = data, obj )) : mapObject(
    flatifyKeys(data),
    function (key, val) { return (( obj = {}, obj[(mod + "-" + key)] = val, obj ))
      var obj; }
  )
    var obj; }
); };

var omit = function (key, obj) { return mapObject(obj,
  function (mod, data) { return mod !== key ? (( obj = {}, obj[mod] = data, obj )) : {}
    var obj; }
); };

// Const fnName = (...params) => guard ? default : ...

var createTextElement = function (text$$1) { return !text(text$$1) ? undefined : {
  text: text$$1,
  sel: undefined,
  data: undefined,
  children: undefined,
  elm: undefined,
  key: undefined
}; };

var considerSvg = function (vnode$$1) { return !svg(vnode$$1) ? vnode$$1 :
  assign(vnode$$1,
    { data: omit('props', extend(vnode$$1.data,
      { ns: 'http://www.w3.org/2000/svg', attrs: omit('className', extend(vnode$$1.data.props,
        { class: vnode$$1.data.props ? vnode$$1.data.props.className : undefined }
      )) }
    )) },
    { children: undefinedv(vnode$$1.children) ? undefined :
      vnode$$1.children.map(function (child) { return considerSvg(child); })
    }
  ); };

var considerData = function (data) {
  return !data.data ? data : mapObject(data, function (mod, data) {
    var key = mod === 'data' ? 'dataset' : mod;
    return (( obj = {}, obj[key] = data, obj ))
    var obj;
  })
};

var considerAria = function (data) { return data.attrs || data.aria ? omit('aria',
  assign(data, {
    attrs: extend(data.attrs, data.aria ? flatifyKeys({ aria: data.aria }) : {})
  })
) : data; };

var considerProps = function (data) { return mapObject(data,
  function (key, val) { return object(val) ? ( obj = {}, obj[key] = val, obj ) :
    { props: ( obj$1 = {}, obj$1[key] = val, obj$1 ) }
    var obj;
    var obj$1; }
); };

var rewritesMap = { for: 1, role: 1, tabindex: 1 };

var considerAttrs = function (data) { return mapObject(data,
    function (key, data) { return !(key in rewritesMap) ? ( obj = {}, obj[key] = data, obj ) : {
      attrs: extend(data.attrs, ( obj$1 = {}, obj$1[key] = data, obj$1 ))
    }
      var obj;
      var obj$1; }
); };

var considerKey = function (data) {
  return 'key' in data ? omit('key', data) : data
};

var sanitizeData = function (data) { return considerProps(considerAria(considerData(considerAttrs(considerKey(deepifyKeys(data)))))); };

var sanitizeText = function (children) { return children.length > 1 || !text(children[0]) ? undefined : children[0]; };

var sanitizeChildren = function (children) { return reduceDeep(children, function (acc, child) {
  var vnode$$1 = vnode(child) ? child : createTextElement(child);
  acc.push(vnode$$1);
  return acc
}
, []); };

var createElement = function (sel, data) {
  var children = [], len = arguments.length - 2;
  while ( len-- > 0 ) children[ len ] = arguments[ len + 2 ];

  if (fun(sel)) {
    return sel(data || {}, children)
  }
  var text$$1 = sanitizeText(children);
  return considerSvg({
    sel: sel,
    data: data ? sanitizeData(data) : {},
    children: text$$1 ? undefined : sanitizeChildren(children),
    text: text$$1,
    elm: undefined,
    key: data ? data.key : undefined
  })
};

var index = {
  createElement: createElement
};

exports.createElement = createElement;
exports['default'] = index;

},{"extend":225}],227:[function(require,module,exports){
arguments[4][103][0].apply(exports,arguments)
},{"./selectorParser":233,"dup":103}],228:[function(require,module,exports){
arguments[4][104][0].apply(exports,arguments)
},{"dup":104}],229:[function(require,module,exports){
arguments[4][105][0].apply(exports,arguments)
},{"./parent-symbol":231,"./query":232,"dup":105}],230:[function(require,module,exports){
arguments[4][106][0].apply(exports,arguments)
},{"./classNameFromVNode":227,"./curry2":228,"./findMatches":229,"./selectorParser":233,"dup":106}],231:[function(require,module,exports){
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

},{}],232:[function(require,module,exports){
arguments[4][108][0].apply(exports,arguments)
},{"./classNameFromVNode":227,"./parent-symbol":231,"./selectorParser":233,"dup":108,"tree-selector":236}],233:[function(require,module,exports){
arguments[4][109][0].apply(exports,arguments)
},{"dup":109}],234:[function(require,module,exports){
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

},{"./ponyfill.js":235}],235:[function(require,module,exports){
arguments[4][111][0].apply(exports,arguments)
},{"dup":111}],236:[function(require,module,exports){
arguments[4][113][0].apply(exports,arguments)
},{"./matches":237,"./querySelector":238,"./selectorParser":239,"dup":113}],237:[function(require,module,exports){
arguments[4][114][0].apply(exports,arguments)
},{"./selectorParser":239,"dup":114}],238:[function(require,module,exports){
arguments[4][115][0].apply(exports,arguments)
},{"./matches":237,"./selectorParser":239,"dup":115}],239:[function(require,module,exports){
arguments[4][116][0].apply(exports,arguments)
},{"dup":116}],240:[function(require,module,exports){
arguments[4][117][0].apply(exports,arguments)
},{"../index":243,"dup":117}],241:[function(require,module,exports){
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

},{"../index":243}],242:[function(require,module,exports){
arguments[4][119][0].apply(exports,arguments)
},{"../index":243,"dup":119}],243:[function(require,module,exports){
arguments[4][120][0].apply(exports,arguments)
},{"dup":120,"symbol-observable":234}]},{},[121])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdHlwZXMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvdXRpbHMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0JvZHlET01Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0RvY3VtZW50RE9NU291cmNlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9FbGVtZW50RmluZGVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9FdmVudERlbGVnYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvSXNvbGF0ZU1vZHVsZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvTWFpbkRPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvU2NvcGVDaGVja2VyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9WTm9kZVdyYXBwZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL2Zyb21FdmVudC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaHlwZXJzY3JpcHQtaGVscGVycy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL2lzb2xhdGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21ha2VET01Ecml2ZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21hdGNoZXNTZWxlY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvbW9ja0RPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvbW9kdWxlcy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvdGh1bmsuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbm9kZV9tb2R1bGVzL3NuYWJiZG9tL2guanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9ub2RlX21vZHVsZXMvc25hYmJkb20vaHRtbGRvbWFwaS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL25vZGVfbW9kdWxlcy9zbmFiYmRvbS9pcy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL25vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL2F0dHJpYnV0ZXMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9ub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9jbGFzcy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL25vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL2RhdGFzZXQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9ub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9wcm9wcy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL25vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL3N0eWxlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbm9kZV9tb2R1bGVzL3NuYWJiZG9tL3NuYWJiZG9tLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbm9kZV9tb2R1bGVzL3NuYWJiZG9tL3RodW5rLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbm9kZV9tb2R1bGVzL3NuYWJiZG9tL3Rvdm5vZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9ub2RlX21vZHVsZXMvc25hYmJkb20vdm5vZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW50ZXJuYWxzLmpzIiwibm9kZV9tb2R1bGVzL2QvYXV0by1iaW5kLmpzIiwibm9kZV9tb2R1bGVzL2QvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9hcnJheS8jL2NsZWFyLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvYXJyYXkvIy9lLWluZGV4LW9mLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvYXJyYXkvZnJvbS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L2FycmF5L2Zyb20vaXMtaW1wbGVtZW50ZWQuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9hcnJheS9mcm9tL3NoaW0uanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9mdW5jdGlvbi9pcy1hcmd1bWVudHMuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9mdW5jdGlvbi9pcy1mdW5jdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L2Z1bmN0aW9uL25vb3AuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9nbG9iYWwuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9tYXRoL3NpZ24vaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9tYXRoL3NpZ24vaXMtaW1wbGVtZW50ZWQuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9tYXRoL3NpZ24vc2hpbS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L251bWJlci9pcy1uYW4vaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9udW1iZXIvaXMtbmFuL2lzLWltcGxlbWVudGVkLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvbnVtYmVyL2lzLW5hbi9zaGltLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvbnVtYmVyL3RvLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9udW1iZXIvdG8tcG9zLWludGVnZXIuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvX2l0ZXJhdGUuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvYXNzaWduL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2Fzc2lnbi9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9hc3NpZ24vc2hpbS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9jb3B5LmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2NyZWF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9mb3ItZWFjaC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9pcy1jYWxsYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9pcy1vYmplY3QuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvaXMtdmFsdWUuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3Qva2V5cy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9rZXlzL2lzLWltcGxlbWVudGVkLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L2tleXMvc2hpbS5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9tYXAuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3Qvbm9ybWFsaXplLW9wdGlvbnMuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3QvcHJpbWl0aXZlLXNldC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L29iamVjdC9zZXQtcHJvdG90eXBlLW9mL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2YvaXMtaW1wbGVtZW50ZWQuanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZi9zaGltLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L3ZhbGlkLWNhbGxhYmxlLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvb2JqZWN0L3ZhbGlkLXZhbHVlLmpzIiwibm9kZV9tb2R1bGVzL2VzNS1leHQvc3RyaW5nLyMvY29udGFpbnMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9zdHJpbmcvIy9jb250YWlucy9pcy1pbXBsZW1lbnRlZC5qcyIsIm5vZGVfbW9kdWxlcy9lczUtZXh0L3N0cmluZy8jL2NvbnRhaW5zL3NoaW0uanMiLCJub2RlX21vZHVsZXMvZXM1LWV4dC9zdHJpbmcvaXMtc3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1pdGVyYXRvci9hcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9lczYtaXRlcmF0b3IvZm9yLW9mLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1pdGVyYXRvci9nZXQuanMiLCJub2RlX21vZHVsZXMvZXM2LWl0ZXJhdG9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2VzNi1pdGVyYXRvci9pcy1pdGVyYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9lczYtaXRlcmF0b3Ivc3RyaW5nLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1pdGVyYXRvci92YWxpZC1pdGVyYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9lczYtbWFwL2ltcGxlbWVudC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtbWFwL2lzLWltcGxlbWVudGVkLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1tYXAvaXMtbmF0aXZlLWltcGxlbWVudGVkLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1tYXAvbGliL2l0ZXJhdG9yLWtpbmRzLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1tYXAvbGliL2l0ZXJhdG9yLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1tYXAvcG9seWZpbGwuanMiLCJub2RlX21vZHVsZXMvZXM2LXN5bWJvbC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9lczYtc3ltYm9sL2lzLWltcGxlbWVudGVkLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1zeW1ib2wvaXMtc3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL2VzNi1zeW1ib2wvcG9seWZpbGwuanMiLCJub2RlX21vZHVsZXMvZXM2LXN5bWJvbC92YWxpZGF0ZS1zeW1ib2wuanMiLCJub2RlX21vZHVsZXMvZXZlbnQtZW1pdHRlci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcXVpY2t0YXNrL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9jbGFzc05hbWVGcm9tVk5vZGUuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL2N1cnJ5Mi5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvZmluZE1hdGNoZXMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9wYXJlbnQtc3ltYm9sLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9xdWVyeS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvc2VsZWN0b3JQYXJzZXIuanMiLCJub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9wb255ZmlsbC5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3RyZWUtc2VsZWN0b3IvbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvbWF0Y2hlcy5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvcXVlcnlTZWxlY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvc2VsZWN0b3JQYXJzZXIuanMiLCJub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvZXh0cmEvY29uY2F0LnRzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2RlbGF5LnRzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL3NhbXBsZUNvbWJpbmUudHMiLCJub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvaW5kZXgudHMiLCJzcmMvaW5kZXguanMiLCIuLi8uLi8uLi9zY3JlZW4vbGliL2Nqcy9GYWNpYWxFeHByZXNzaW9uQWN0aW9uLmpzIiwiLi4vLi4vLi4vc2NyZWVuL2xpYi9janMvU3BlZWNoYnViYmxlQWN0aW9uLmpzIiwiLi4vLi4vLi4vc2NyZWVuL2xpYi9janMvVHdvU3BlZWNoYnViYmxlc0FjdGlvbi5qcyIsIi4uLy4uLy4uL3NjcmVlbi9saWIvY2pzL2luZGV4LmpzIiwiLi4vLi4vLi4vc2NyZWVuL2xpYi9janMvdGFibGV0X2ZhY2UuanMiLCIuLi8uLi8uLi9zY3JlZW4vbm9kZV9tb2R1bGVzL0BjeWNsZS9pc29sYXRlL2xpYi9janMvaW5kZXguanMiLCIuLi8uLi8uLi9zY3JlZW4vbm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwiLi4vLi4vLi4vc2NyZWVuL25vZGVfbW9kdWxlcy9leHRlbmQvaW5kZXguanMiLCIuLi8uLi8uLi9zY3JlZW4vbm9kZV9tb2R1bGVzL3NuYWJiZG9tLXByYWdtYS9kaXN0L2luZGV4LmpzIiwiLi4vLi4vLi4vc2NyZWVuL25vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvcGFyZW50LXN5bWJvbC5qcyIsIi4uLy4uLy4uL3NjcmVlbi9ub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIiwiLi4vLi4vLi4vc2NyZWVuL25vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9kcm9wUmVwZWF0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4R0E7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDbEtBLGtDQUErRTtBQUUvRTtJQUtFLHdCQUFtQixPQUF5QjtRQUF6QixZQUFPLEdBQVAsT0FBTyxDQUFrQjtRQUpyQyxTQUFJLEdBQUcsUUFBUSxDQUFDO1FBQ2hCLFFBQUcsR0FBYyxJQUFXLENBQUM7UUFDNUIsTUFBQyxHQUFXLENBQUMsQ0FBQztJQUd0QixDQUFDO0lBRUQsK0JBQU0sR0FBTixVQUFPLEdBQWM7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVELDhCQUFLLEdBQUw7UUFDRSxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQzdCLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFO1lBQzNCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQy9CO1FBQ0QsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQVcsQ0FBQztJQUN6QixDQUFDO0lBRUQsMkJBQUUsR0FBRixVQUFHLENBQUk7UUFDTCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxDQUFDO1lBQUUsT0FBTztRQUNmLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDVixDQUFDO0lBRUQsMkJBQUUsR0FBRixVQUFHLEdBQVE7UUFDVCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxDQUFDO1lBQUUsT0FBTztRQUNmLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRUQsMkJBQUUsR0FBRjtRQUNFLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLENBQUM7WUFBRSxPQUFPO1FBQ2YsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUM3QixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM5QixJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFO1lBQzdCLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzVCO2FBQU07WUFDTCxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7U0FDUjtJQUNILENBQUM7SUFDSCxxQkFBQztBQUFELENBN0NBLEFBNkNDLElBQUE7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXFDRztBQUNIO0lBQWtDLGlCQUE0QjtTQUE1QixVQUE0QixFQUE1QixxQkFBNEIsRUFBNUIsSUFBNEI7UUFBNUIsNEJBQTRCOztJQUM1RCxPQUFPLElBQUksY0FBTSxDQUFJLElBQUksY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUZELHlCQUVDOzs7OztBQ3pGRCxrQ0FBMEM7QUFFMUM7SUFJRSx1QkFBbUIsRUFBVSxFQUNWLEdBQWM7UUFEZCxPQUFFLEdBQUYsRUFBRSxDQUFRO1FBQ1YsUUFBRyxHQUFILEdBQUcsQ0FBVztRQUoxQixTQUFJLEdBQUcsT0FBTyxDQUFDO1FBQ2YsUUFBRyxHQUFjLElBQVcsQ0FBQztJQUlwQyxDQUFDO0lBRUQsOEJBQU0sR0FBTixVQUFPLEdBQWM7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRUQsNkJBQUssR0FBTDtRQUNFLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBVyxDQUFDO0lBQ3pCLENBQUM7SUFFRCwwQkFBRSxHQUFGLFVBQUcsQ0FBSTtRQUNMLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLENBQUM7WUFBRSxPQUFPO1FBQ2YsSUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDUixhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEIsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNkLENBQUM7SUFFRCwwQkFBRSxHQUFGLFVBQUcsR0FBUTtRQUNULElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLENBQUM7WUFBRSxPQUFPO1FBQ2YsSUFBTSxFQUFFLEdBQUcsV0FBVyxDQUFDO1lBQ3JCLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDVixhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEIsQ0FBQyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUNkLENBQUM7SUFFRCwwQkFBRSxHQUFGO1FBQ0UsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsQ0FBQztZQUFFLE9BQU87UUFDZixJQUFNLEVBQUUsR0FBRyxXQUFXLENBQUM7WUFDckIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ1AsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BCLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDZCxDQUFDO0lBQ0gsb0JBQUM7QUFBRCxDQTVDQSxBQTRDQyxJQUFBO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBc0NHO0FBQ0gsZUFBaUMsTUFBYztJQUM3QyxPQUFPLHVCQUF1QixHQUFjO1FBQzFDLE9BQU8sSUFBSSxjQUFNLENBQUksSUFBSSxhQUFhLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDdkQsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUpELHdCQUlDOzs7OztBQzNGRCxrQ0FBNEQ7QUFrRDVELElBQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQztBQUVkO0lBQ0UsK0JBQW9CLENBQVMsRUFBVSxDQUE2QjtRQUFoRCxNQUFDLEdBQUQsQ0FBQyxDQUFRO1FBQVUsTUFBQyxHQUFELENBQUMsQ0FBNEI7UUFDbEUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVELGtDQUFFLEdBQUYsVUFBRyxDQUFJO1FBQ0wsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqQixJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDekIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2xCLENBQUM7SUFFRCxrQ0FBRSxHQUFGLFVBQUcsR0FBUTtRQUNULElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLENBQUM7SUFFRCxrQ0FBRSxHQUFGO1FBQ0UsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBQ0gsNEJBQUM7QUFBRCxDQWxCQSxBQWtCQyxJQUFBO0FBbEJZLHNEQUFxQjtBQW9CbEM7SUFTRSwrQkFBWSxHQUFjLEVBQUUsT0FBMkI7UUFSaEQsU0FBSSxHQUFHLGVBQWUsQ0FBQztRQVM1QixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBd0IsQ0FBQztRQUNwQyxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztRQUNkLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELHNDQUFNLEdBQU4sVUFBTyxHQUF1QjtRQUM1QixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDdEIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQzdCLElBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLHFCQUFxQixDQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ3BEO1FBQ0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVELHFDQUFLLEdBQUw7UUFDRSxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3RCLElBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDbkIsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDdEI7UUFDRCxJQUFJLENBQUMsR0FBRyxHQUFHLEVBQXdCLENBQUM7UUFDcEMsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBRUQsa0NBQUUsR0FBRixVQUFHLENBQUk7UUFDTCxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ3JCLElBQUksR0FBRyxLQUFLLEVBQUU7WUFBRSxPQUFPO1FBQ3ZCLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDO1lBQUUsT0FBTztRQUN4QixHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsU0FBSyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDNUIsQ0FBQztJQUVELGtDQUFFLEdBQUYsVUFBRyxHQUFRO1FBQ1QsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNyQixJQUFJLEdBQUcsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUN2QixHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsQ0FBQztJQUVELGtDQUFFLEdBQUY7UUFDRSxJQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ3JCLElBQUksR0FBRyxLQUFLLEVBQUU7WUFBRSxPQUFPO1FBQ3ZCLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFFRCxrQ0FBRSxHQUFGLFVBQUcsQ0FBTSxFQUFFLENBQVM7UUFDbEIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDM0IsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1NBQ1g7UUFDRCxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQsb0NBQUksR0FBSixVQUFLLENBQVMsRUFBRSxDQUE2QjtRQUMzQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBQ0gsNEJBQUM7QUFBRCxDQXpFQSxBQXlFQyxJQUFBO0FBekVZLHNEQUFxQjtBQTJFbEMsSUFBSSxhQUFxQyxDQUFDO0FBRTFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXVFRztBQUNILGFBQWEsR0FBRztJQUF1QixpQkFBOEI7U0FBOUIsVUFBOEIsRUFBOUIscUJBQThCLEVBQTlCLElBQThCO1FBQTlCLDRCQUE4Qjs7SUFDbkUsT0FBTywrQkFBK0IsT0FBb0I7UUFDeEQsT0FBTyxJQUFJLGNBQU0sQ0FBYSxJQUFJLHFCQUFxQixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQzdFLENBQUMsQ0FBQztBQUNKLENBQTJCLENBQUM7QUFFNUIsa0JBQWUsYUFBYSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUNuTzdCLHVEQUE2QztBQUU3QyxJQUFNLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFpZ0VOLGdCQUFFO0FBaGdFVixrQkFBaUIsQ0FBQztBQUVsQixZQUFlLENBQVc7SUFDeEIsSUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztJQUNuQixJQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUM7UUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUVELGFBQWdCLEVBQXFCLEVBQUUsRUFBcUI7SUFDMUQsT0FBTyxlQUFlLENBQUk7UUFDeEIsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLENBQUMsQ0FBQztBQUNKLENBQUM7QUFNRCxjQUFvQixDQUFtQixFQUFFLENBQUksRUFBRSxDQUFjO0lBQzNELElBQUk7UUFDRixPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDZjtJQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQ1YsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNSLE9BQU8sRUFBRSxDQUFDO0tBQ1g7QUFDSCxDQUFDO0FBUUQsSUFBTSxLQUFLLEdBQTBCO0lBQ25DLEVBQUUsRUFBRSxJQUFJO0lBQ1IsRUFBRSxFQUFFLElBQUk7SUFDUixFQUFFLEVBQUUsSUFBSTtDQUNULENBQUM7QUEwOURVLHNCQUFLO0FBaDdEakIsb0JBQW9CO0FBQ3BCLDZCQUFnQyxRQUFvRDtJQUNsRixRQUFRLENBQUMsTUFBTSxHQUFHLGdCQUFnQixFQUE4QztRQUM5RSxFQUFFLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDaEIsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2pCLEVBQUUsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ2pCLENBQUMsQ0FBQztJQUNGLFFBQVEsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQztBQUNqQyxDQUFDO0FBRUQ7SUFDRSxtQkFBb0IsT0FBa0IsRUFBVSxTQUE4QjtRQUExRCxZQUFPLEdBQVAsT0FBTyxDQUFXO1FBQVUsY0FBUyxHQUFULFNBQVMsQ0FBcUI7SUFBRyxDQUFDO0lBRWxGLCtCQUFXLEdBQVg7UUFDRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FOQSxBQU1DLElBQUE7QUFFRDtJQUNFLGtCQUFvQixTQUE4QjtRQUE5QixjQUFTLEdBQVQsU0FBUyxDQUFxQjtJQUFHLENBQUM7SUFFdEQsdUJBQUksR0FBSixVQUFLLEtBQVE7UUFDWCxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixDQUFDO0lBRUQsd0JBQUssR0FBTCxVQUFNLEdBQVE7UUFDWixJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN6QixDQUFDO0lBRUQsMkJBQVEsR0FBUjtRQUNFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDdEIsQ0FBQztJQUNILGVBQUM7QUFBRCxDQWRBLEFBY0MsSUFBQTtBQUVEO0lBT0Usd0JBQVksVUFBeUI7UUFOOUIsU0FBSSxHQUFHLGdCQUFnQixDQUFDO1FBTzdCLElBQUksQ0FBQyxHQUFHLEdBQUcsVUFBVSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLENBQUM7SUFFRCwrQkFBTSxHQUFOLFVBQU8sR0FBYztRQUNuQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ25CLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNsRCxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU07WUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFFRCw4QkFBSyxHQUFMO1FBQ0UsSUFBSSxJQUFJLENBQUMsSUFBSTtZQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7SUFDdEIsQ0FBQztJQUNILHFCQUFDO0FBQUQsQ0F2QkEsQUF1QkMsSUFBQTtBQXVFRDtJQU1FLGVBQVksTUFBd0I7UUFMN0IsU0FBSSxHQUFHLE9BQU8sQ0FBQztRQU1wQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQWUsQ0FBQztRQUMzQixJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNkLENBQUM7SUFFRCxzQkFBTSxHQUFOLFVBQU8sR0FBYztRQUNuQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDdEIsSUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNuQixJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNaLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO1lBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRUQscUJBQUssR0FBTDtRQUNFLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDdEIsSUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUNuQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7SUFDN0IsQ0FBQztJQUVELGtCQUFFLEdBQUYsVUFBRyxDQUFJO1FBQ0wsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1YsQ0FBQztJQUVELGtCQUFFLEdBQUYsVUFBRyxHQUFRO1FBQ1QsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1osQ0FBQztJQUVELGtCQUFFLEdBQUY7UUFDRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDbEIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO2dCQUFFLE9BQU87WUFDckIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO1NBQ1I7SUFDSCxDQUFDO0lBQ0gsWUFBQztBQUFELENBOUNBLEFBOENDLElBQUE7QUF1RUQ7SUFLRSx5QkFBWSxDQUFTLEVBQUUsR0FBcUIsRUFBRSxDQUFhO1FBQ3pELElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1gsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCw0QkFBRSxHQUFGLFVBQUcsQ0FBSTtRQUNMLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDakMsSUFBSSxHQUFHLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDdkIsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbkIsSUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNqQixJQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ25CLElBQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDWDtJQUNILENBQUM7SUFFRCw0QkFBRSxHQUFGLFVBQUcsR0FBUTtRQUNULElBQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDckIsSUFBSSxHQUFHLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDdkIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNkLENBQUM7SUFFRCw0QkFBRSxHQUFGO1FBQ0UsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqQixJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDekIsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQztZQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUNILHNCQUFDO0FBQUQsQ0FuQ0EsQUFtQ0MsSUFBQTtBQUVEO0lBU0UsaUJBQVksTUFBMEI7UUFSL0IsU0FBSSxHQUFHLFNBQVMsQ0FBQztRQVN0QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQXNCLENBQUM7UUFDbEMsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFDZCxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFFRCxvQkFBRSxHQUFGLFVBQUcsQ0FBTSxFQUFFLENBQVM7UUFDbEIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN2QixJQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3pELElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsQixDQUFDO0lBRUQsd0JBQU0sR0FBTixVQUFPLEdBQXFCO1FBQzFCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUN0QixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztRQUN2QyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNYLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDWCxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUM7U0FDVjthQUFNO1lBQ0wsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUIsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDYixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksZUFBZSxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUM5QztTQUNGO0lBQ0gsQ0FBQztJQUVELHVCQUFLLEdBQUw7UUFDRSxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3RCLElBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDbkIsSUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNyQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFzQixDQUFDO1FBQ2xDLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2QsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUNILGNBQUM7QUFBRCxDQWpEQSxBQWlEQyxJQUFBO0FBRUQ7SUFJRSxtQkFBWSxDQUFXO1FBSGhCLFNBQUksR0FBRyxXQUFXLENBQUM7UUFJeEIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDYixDQUFDO0lBRUQsMEJBQU0sR0FBTixVQUFPLEdBQXdCO1FBQzdCLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUNYLENBQUM7SUFFRCx5QkFBSyxHQUFMO0lBQ0EsQ0FBQztJQUNILGdCQUFDO0FBQUQsQ0FoQkEsQUFnQkMsSUFBQTtBQUVEO0lBS0UscUJBQVksQ0FBaUI7UUFKdEIsU0FBSSxHQUFHLGFBQWEsQ0FBQztRQUsxQixJQUFJLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUNoQixJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNiLENBQUM7SUFFRCw0QkFBTSxHQUFOLFVBQU8sR0FBd0I7UUFDN0IsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBQ2YsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQ1QsVUFBQyxDQUFJO1lBQ0gsSUFBSSxJQUFJLENBQUMsRUFBRSxFQUFFO2dCQUNYLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ1YsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDO2FBQ1Y7UUFDSCxDQUFDLEVBQ0QsVUFBQyxDQUFNO1lBQ0wsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNaLENBQUMsQ0FDRixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBQyxHQUFRO1lBQ3BCLFVBQVUsQ0FBQyxjQUFRLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsMkJBQUssR0FBTDtRQUNFLElBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQ2xCLENBQUM7SUFDSCxrQkFBQztBQUFELENBL0JBLEFBK0JDLElBQUE7QUFFRDtJQU1FLGtCQUFZLE1BQWM7UUFMbkIsU0FBSSxHQUFHLFVBQVUsQ0FBQztRQU12QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQUVELHlCQUFNLEdBQU4sVUFBTyxHQUE2QjtRQUNsQyxJQUFNLElBQUksR0FBRyxJQUFJLENBQUM7UUFDbEIsNkJBQTZCLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELElBQUksQ0FBQyxVQUFVLEdBQUcsV0FBVyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVELHdCQUFLLEdBQUw7UUFDRSxJQUFJLElBQUksQ0FBQyxVQUFVLEtBQUssQ0FBQyxDQUFDO1lBQUUsYUFBYSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2IsQ0FBQztJQUNILGVBQUM7QUFBRCxDQXZCQSxBQXVCQyxJQUFBO0FBRUQ7SUFXRSxlQUFZLEdBQWMsRUFBRSxHQUEwQztRQVYvRCxTQUFJLEdBQUcsT0FBTyxDQUFDO1FBV3BCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7UUFDM0IsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7UUFDZCxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNaLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUTtZQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO2FBQU0sSUFBSSxPQUFPLEdBQUcsS0FBSyxVQUFVO1lBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDOUYsQ0FBQztJQUVELHNCQUFNLEdBQU4sVUFBTyxHQUFjO1FBQ25CLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVELHFCQUFLLEdBQUw7UUFDRSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQWUsQ0FBQztJQUM3QixDQUFDO0lBRUQsa0JBQUUsR0FBRixVQUFHLENBQUk7UUFDTCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFBRSxPQUFPO1FBQ3JCLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLEtBQUssSUFBSSxFQUFFO1lBQ2QsSUFBSTtnQkFDRixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDTjtZQUFDLE9BQU8sQ0FBQyxFQUFFO2dCQUNWLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDVDtTQUNGO2FBQU0sSUFBSSxDQUFDO1lBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDOztZQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNWLENBQUM7SUFFRCxrQkFBRSxHQUFGLFVBQUcsR0FBUTtRQUNULElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDckIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFRCxrQkFBRSxHQUFGO1FBQ0UsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDVCxDQUFDO0lBQ0gsWUFBQztBQUFELENBdERBLEFBc0RDLElBQUE7QUFFRDtJQU9FLGNBQVksR0FBVyxFQUFFLEdBQWM7UUFOaEMsU0FBSSxHQUFHLE1BQU0sQ0FBQztRQU9uQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBZSxDQUFDO1FBQzNCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7SUFDbkIsQ0FBQztJQUVELHFCQUFNLEdBQU4sVUFBTyxHQUFjO1FBQ25CLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFDakIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVELG9CQUFLLEdBQUw7UUFDRSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQWUsQ0FBQztJQUM3QixDQUFDO0lBRUQsaUJBQUUsR0FBRixVQUFHLENBQUk7UUFDTCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFBRSxPQUFPO1FBQ3JCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLElBQUksQ0FBQyxHQUFHO1lBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQsaUJBQUUsR0FBRixVQUFHLEdBQVE7UUFDVCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFBRSxPQUFPO1FBQ3JCLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRUQsaUJBQUUsR0FBRjtRQUNFLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDckIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO0lBQ1QsQ0FBQztJQUNILFdBQUM7QUFBRCxDQTFDQSxBQTBDQyxJQUFBO0FBRUQ7SUFJRSx5QkFBWSxHQUFjLEVBQUUsRUFBYztRQUN4QyxJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQ2YsQ0FBQztJQUVELDRCQUFFLEdBQUY7UUFDRSxJQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFFRCw0QkFBRSxHQUFGLFVBQUcsR0FBUTtRQUNULElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUFFRCw0QkFBRSxHQUFGO1FBQ0UsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBQ0gsc0JBQUM7QUFBRCxDQXBCQSxBQW9CQyxJQUFBO0FBRUQ7SUFPRSxpQkFBWSxDQUFjLEVBQUUsR0FBYztRQU5uQyxTQUFJLEdBQUcsU0FBUyxDQUFDO1FBT3RCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7UUFDM0IsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUNuQixDQUFDO0lBRUQsd0JBQU0sR0FBTixVQUFPLEdBQWM7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFFRCx1QkFBSyxHQUFMO1FBQ0UsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBZSxDQUFDO1FBQzNCLElBQUksQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDO0lBQ25CLENBQUM7SUFFRCxxQkFBRyxHQUFIO1FBQ0UsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDVCxDQUFDO0lBRUQsb0JBQUUsR0FBRixVQUFHLENBQUk7UUFDTCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFBRSxPQUFPO1FBQ3JCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDVixDQUFDO0lBRUQsb0JBQUUsR0FBRixVQUFHLEdBQVE7UUFDVCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFBRSxPQUFPO1FBQ3JCLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRUQsb0JBQUUsR0FBRjtRQUNFLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNiLENBQUM7SUFDSCxjQUFDO0FBQUQsQ0FoREEsQUFnREMsSUFBQTtBQUVEO0lBTUUsZ0JBQVksTUFBeUIsRUFBRSxHQUFjO1FBTDlDLFNBQUksR0FBRyxRQUFRLENBQUM7UUFNckIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQWUsQ0FBQztRQUMzQixJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztJQUNsQixDQUFDO0lBRUQsdUJBQU0sR0FBTixVQUFPLEdBQWM7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRUQsc0JBQUssR0FBTDtRQUNFLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBZSxDQUFDO0lBQzdCLENBQUM7SUFFRCxtQkFBRSxHQUFGLFVBQUcsQ0FBSTtRQUNMLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDckIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztZQUFFLE9BQU87UUFDM0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNWLENBQUM7SUFFRCxtQkFBRSxHQUFGLFVBQUcsR0FBUTtRQUNULElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDckIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFRCxtQkFBRSxHQUFGO1FBQ0UsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDVCxDQUFDO0lBQ0gsYUFBQztBQUFELENBekNBLEFBeUNDLElBQUE7QUFFRDtJQUlFLHlCQUFZLEdBQWMsRUFBRSxFQUFjO1FBQ3hDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7SUFDZixDQUFDO0lBRUQsNEJBQUUsR0FBRixVQUFHLENBQUk7UUFDTCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNqQixDQUFDO0lBRUQsNEJBQUUsR0FBRixVQUFHLEdBQVE7UUFDVCxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBRUQsNEJBQUUsR0FBRjtRQUNFLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLEVBQWUsQ0FBQztRQUNoQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2pCLENBQUM7SUFDSCxzQkFBQztBQUFELENBckJBLEFBcUJDLElBQUE7QUFFRDtJQVFFLGlCQUFZLEdBQXNCO1FBUDNCLFNBQUksR0FBRyxTQUFTLENBQUM7UUFRdEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQWUsQ0FBQztRQUMzQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQWUsQ0FBQztRQUM3QixJQUFJLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUNsQixDQUFDO0lBRUQsd0JBQU0sR0FBTixVQUFPLEdBQWM7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQWUsQ0FBQztRQUM3QixJQUFJLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUNoQixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRUQsdUJBQUssR0FBTDtRQUNFLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxFQUFFO1lBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBZSxDQUFDO1FBQzNCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBZSxDQUFDO1FBQzdCLElBQUksQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQ2xCLENBQUM7SUFFRCxzQkFBSSxHQUFKO1FBQ0UsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEVBQUU7WUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDOUMsQ0FBQztJQUVELG9CQUFFLEdBQUYsVUFBRyxDQUFZO1FBQ2IsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNmLElBQUEsU0FBa0IsRUFBakIsZ0JBQUssRUFBRSxVQUFFLENBQVM7UUFDekIsSUFBSSxLQUFLLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxLQUFLO1lBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNwRCxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxlQUFlLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDaEUsQ0FBQztJQUVELG9CQUFFLEdBQUYsVUFBRyxHQUFRO1FBQ1QsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1osQ0FBQztJQUVELG9CQUFFLEdBQUY7UUFDRSxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztRQUNsQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDZCxDQUFDO0lBQ0gsY0FBQztBQUFELENBekRBLEFBeURDLElBQUE7QUFFRDtJQVFFLGNBQVksQ0FBc0IsRUFBRSxJQUFPLEVBQUUsR0FBYztRQUEzRCxpQkFLQztRQVpNLFNBQUksR0FBRyxNQUFNLENBQUM7UUFRbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQWUsQ0FBQztRQUMzQixJQUFJLENBQUMsQ0FBQyxHQUFHLFVBQUMsQ0FBSSxJQUFLLE9BQUEsQ0FBQyxDQUFDLEtBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQWQsQ0FBYyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDOUIsQ0FBQztJQUVELHFCQUFNLEdBQU4sVUFBTyxHQUFjO1FBQ25CLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3JCLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFFRCxvQkFBSyxHQUFMO1FBQ0UsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7UUFDM0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxpQkFBRSxHQUFGLFVBQUcsQ0FBSTtRQUNMLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDckIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDckIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQU0sQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxpQkFBRSxHQUFGLFVBQUcsR0FBUTtRQUNULElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDckIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFRCxpQkFBRSxHQUFGO1FBQ0UsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDVCxDQUFDO0lBQ0gsV0FBQztBQUFELENBL0NBLEFBK0NDLElBQUE7QUFFRDtJQU9FLGNBQVksR0FBYztRQU5uQixTQUFJLEdBQUcsTUFBTSxDQUFDO1FBT25CLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7UUFDM0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7UUFDakIsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFPLENBQUM7SUFDckIsQ0FBQztJQUVELHFCQUFNLEdBQU4sVUFBTyxHQUFjO1FBQ25CLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUM7UUFDakIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVELG9CQUFLLEdBQUw7UUFDRSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQWUsQ0FBQztRQUMzQixJQUFJLENBQUMsR0FBRyxHQUFHLEVBQU8sQ0FBQztJQUNyQixDQUFDO0lBRUQsaUJBQUUsR0FBRixVQUFHLENBQUk7UUFDTCxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNmLENBQUM7SUFFRCxpQkFBRSxHQUFGLFVBQUcsR0FBUTtRQUNULElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDckIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNaLENBQUM7SUFFRCxpQkFBRSxHQUFGO1FBQ0UsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixJQUFJLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDWixDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNmLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztTQUNSOztZQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsOENBQThDLENBQUMsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFDSCxXQUFDO0FBQUQsQ0E3Q0EsQUE2Q0MsSUFBQTtBQUVEO0lBTUUsZUFBWSxPQUFvQixFQUFFLEdBQWM7UUFMekMsU0FBSSxHQUFHLEtBQUssQ0FBQztRQU1sQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBZSxDQUFDO1FBQzNCLElBQUksQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDO0lBQ25CLENBQUM7SUFFRCxzQkFBTSxHQUFOLFVBQU8sR0FBYztRQUNuQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFFRCxxQkFBSyxHQUFMO1FBQ0UsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7SUFDN0IsQ0FBQztJQUVELGtCQUFFLEdBQUYsVUFBRyxDQUFJO1FBQ0wsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMzQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQU0sQ0FBQyxDQUFDO0lBQ2YsQ0FBQztJQUVELGtCQUFFLEdBQUYsVUFBRyxHQUFRO1FBQ1QsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1osQ0FBQztJQUVELGtCQUFFLEdBQUY7UUFDRSxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFBRSxPQUFPO1FBQ3JCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUNULENBQUM7SUFDSCxZQUFDO0FBQUQsQ0F6Q0EsQUF5Q0MsSUFBQTtBQUVEO0lBS0Usa0JBQVksR0FBYztRQUpuQixTQUFJLEdBQUcsVUFBVSxDQUFDO1FBS3ZCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7SUFDN0IsQ0FBQztJQUVELHlCQUFNLEdBQU4sVUFBTyxHQUFjO1FBQ25CLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUVELHdCQUFLLEdBQUw7UUFDRSxJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDM0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7SUFDN0IsQ0FBQztJQUNILGVBQUM7QUFBRCxDQW5CQSxBQW1CQyxJQUFBO0FBRUQ7SUFNRSxzQkFBWSxRQUFpQyxFQUFFLEdBQWM7UUFMdEQsU0FBSSxHQUFHLGNBQWMsQ0FBQztRQU0zQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBZSxDQUFDO1FBQzNCLElBQUksQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDO0lBQ3BCLENBQUM7SUFFRCw2QkFBTSxHQUFOLFVBQU8sR0FBYztRQUNuQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFFRCw0QkFBSyxHQUFMO1FBQ0UsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7SUFDN0IsQ0FBQztJQUVELHlCQUFFLEdBQUYsVUFBRyxDQUFJO1FBQ0wsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1YsQ0FBQztJQUVELHlCQUFFLEdBQUYsVUFBRyxHQUFRO1FBQ1QsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixJQUFJO1lBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdkIsQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckM7UUFBQyxPQUFPLENBQUMsRUFBRTtZQUNWLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDVDtJQUNILENBQUM7SUFFRCx5QkFBRSxHQUFGO1FBQ0UsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7SUFDVCxDQUFDO0lBQ0gsbUJBQUM7QUFBRCxDQTVDQSxBQTRDQyxJQUFBO0FBRUQ7SUFNRSxtQkFBWSxHQUFjLEVBQUUsR0FBTTtRQUwzQixTQUFJLEdBQUcsV0FBVyxDQUFDO1FBTXhCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7UUFDM0IsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDakIsQ0FBQztJQUVELDBCQUFNLEdBQU4sVUFBTyxHQUFjO1FBQ25CLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFRCx5QkFBSyxHQUFMO1FBQ0UsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBZSxDQUFDO0lBQzdCLENBQUM7SUFDSCxnQkFBQztBQUFELENBdEJBLEFBc0JDLElBQUE7QUFFRDtJQU9FLGNBQVksR0FBVyxFQUFFLEdBQWM7UUFOaEMsU0FBSSxHQUFHLE1BQU0sQ0FBQztRQU9uQixJQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBZSxDQUFDO1FBQzNCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7SUFDakIsQ0FBQztJQUVELHFCQUFNLEdBQU4sVUFBTyxHQUFjO1FBQ25CLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDZixJQUFJLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztZQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQzs7WUFBTSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsb0JBQUssR0FBTDtRQUNFLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBZSxDQUFDO0lBQzdCLENBQUM7SUFFRCxpQkFBRSxHQUFGLFVBQUcsQ0FBSTtRQUNMLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUFFLE9BQU87UUFDckIsSUFBTSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHO1lBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUFNLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDbEQsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNSLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztTQUNSO0lBQ0gsQ0FBQztJQUVELGlCQUFFLEdBQUYsVUFBRyxHQUFRO1FBQ1QsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUNuQixJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztRQUNyQixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1osQ0FBQztJQUVELGlCQUFFLEdBQUY7UUFDRSxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFBRSxPQUFPO1FBQ3JCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUNULENBQUM7SUFDSCxXQUFDO0FBQUQsQ0E5Q0EsQUE4Q0MsSUFBQTtBQUVEO0lBU0UsZ0JBQVksUUFBOEI7UUFDeEMsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLElBQUksRUFBeUIsQ0FBQztRQUNuRCxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztRQUNmLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxHQUFHLEdBQUcsRUFBeUIsQ0FBQztRQUNyQyxJQUFJLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUNoQixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQWUsQ0FBQztRQUMvQixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBRUQsbUJBQUUsR0FBRixVQUFHLENBQUk7UUFDTCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3BCLElBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDbkIsSUFBSSxJQUFJLENBQUMsRUFBRTtZQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxJQUFJLENBQUM7WUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQU0sSUFBSSxDQUFDLElBQUksQ0FBQztZQUFFLE9BQU87YUFBTTtZQUNwRCxJQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN4QztJQUNILENBQUM7SUFFRCxtQkFBRSxHQUFGLFVBQUcsR0FBUTtRQUNULElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFO1lBQUUsT0FBTztRQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNoQixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3BCLElBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDbkIsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ1YsSUFBSSxJQUFJLENBQUMsRUFBRTtZQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLElBQUksQ0FBQyxJQUFJLENBQUM7WUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQU0sSUFBSSxDQUFDLElBQUksQ0FBQztZQUFFLE9BQU87YUFBTTtZQUN0RCxJQUFNLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUMxQztRQUNELElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQUUsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQzFDLENBQUM7SUFFRCxtQkFBRSxHQUFGO1FBQ0UsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNwQixJQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDO1FBQ25CLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNWLElBQUksSUFBSSxDQUFDLEVBQUU7WUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQzNCLElBQUksQ0FBQyxJQUFJLENBQUM7WUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7YUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQUUsT0FBTzthQUFNO1lBQ25ELElBQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtnQkFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7U0FDdkM7SUFDSCxDQUFDO0lBRUQsbUJBQUUsR0FBRjtRQUNFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQztZQUFFLE9BQU87UUFDbkMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLEVBQUU7WUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFDLElBQUksQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2YsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVELHlCQUFRLEdBQVI7UUFDRSw4Q0FBOEM7UUFDOUMsZ0RBQWdEO1FBQ2hELElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7UUFDZixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztJQUNwQixDQUFDO0lBRUQscUJBQUksR0FBSixVQUFLLEVBQXVCO1FBQzFCLElBQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDeEIsSUFBSSxFQUFFLEtBQUssRUFBRTtZQUFFLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNsQyxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQztZQUFFLE9BQU87UUFDekIsSUFBSSxJQUFJLENBQUMsT0FBTyxLQUFLLEVBQUUsRUFBRTtZQUN2QixZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzNCLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1NBQ25CO2FBQU07WUFDTCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUM5QjtJQUNILENBQUM7SUFFRCx3QkFBTyxHQUFQLFVBQVEsRUFBdUI7UUFBL0IsaUJBY0M7UUFiQyxJQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBQ3hCLElBQUksRUFBRSxLQUFLLEVBQUU7WUFBRSxPQUFPLEVBQUUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckMsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUNwQixJQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO1lBQ1YsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDZixJQUFJLElBQUksQ0FBQyxLQUFLLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO2dCQUN0QyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztnQkFDZixJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLFFBQVEsRUFBRSxFQUFmLENBQWUsQ0FBQyxDQUFDO2FBQ2xEO2lCQUFNLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7Z0JBQ3pCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQzthQUNyQjtTQUNGO0lBQ0gsQ0FBQztJQUVELG9FQUFvRTtJQUNwRSxrRUFBa0U7SUFDbEUsbUVBQW1FO0lBQ25FLGtFQUFrRTtJQUNsRSw2QkFBWSxHQUFaO1FBQ0UsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUM7WUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQsMkVBQTJFO0lBQzNFLHlFQUF5RTtJQUN6RSw2RUFBNkU7SUFDN0UsdUNBQXVDO0lBQ3ZDLDRCQUFXLEdBQVgsVUFBWSxDQUF3QixFQUFFLEtBQWlCO1FBQ3JELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekIsT0FBTyxJQUFJLENBQUM7YUFDZCxJQUFLLENBQTJCLENBQUMsR0FBRyxLQUFLLElBQUk7WUFDM0MsT0FBTyxJQUFJLENBQUM7YUFDZCxJQUFLLENBQTJCLENBQUMsR0FBRyxJQUFLLENBQTJCLENBQUMsR0FBRyxLQUFLLEVBQUU7WUFDN0UsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFFLENBQTJCLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUM3RSxJQUFLLENBQWlCLENBQUMsSUFBSSxFQUFFO1lBQzNCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBSSxDQUFpQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7Z0JBQzVELElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFFLENBQWlCLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ2hFLE9BQU8sS0FBSyxDQUFDO1lBQ2pCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7O1lBQU0sT0FBTyxLQUFLLENBQUM7SUFDdEIsQ0FBQztJQUVPLHFCQUFJLEdBQVo7UUFDRSxPQUFPLElBQUksWUFBWSxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO0lBQzlELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsNEJBQVcsR0FBWCxVQUFZLFFBQThCO1FBQ3ZDLFFBQWdDLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO1FBQzVELFFBQWdDLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDO1FBQzdELFFBQWdDLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDO1FBQ2pFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBK0IsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsK0JBQWMsR0FBZCxVQUFlLFFBQThCO1FBQzNDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBK0IsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCwwQkFBUyxHQUFULFVBQVUsUUFBOEI7UUFDdEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMzQixPQUFPLElBQUksU0FBUyxDQUFJLElBQUksRUFBRSxRQUErQixDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxpQkFBQywyQkFBWSxDQUFDLEdBQWQ7UUFDRSxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksYUFBTSxHQUFiLFVBQWlCLFFBQXNCO1FBQ3JDLElBQUksUUFBUSxFQUFFO1lBQ1osSUFBSSxPQUFPLFFBQVEsQ0FBQyxLQUFLLEtBQUssVUFBVTttQkFDckMsT0FBTyxRQUFRLENBQUMsSUFBSSxLQUFLLFVBQVU7Z0JBQ3BDLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQWlELENBQUMsQ0FBQztZQUNyRSxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLG9CQUFvQjtTQUNwRDtRQUNELE9BQU8sSUFBSSxNQUFNLENBQUMsUUFBNkMsQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksdUJBQWdCLEdBQXZCLFVBQTJCLFFBQXNCO1FBQy9DLElBQUksUUFBUTtZQUFFLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsb0JBQW9CO1FBQ2pFLE9BQU8sSUFBSSxZQUFZLENBQUksUUFBNkMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7O09BWUc7SUFDSSxZQUFLLEdBQVo7UUFDRSxPQUFPLElBQUksTUFBTSxDQUFNLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztJQUN0RCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7T0FhRztJQUNJLFlBQUssR0FBWjtRQUNFLE9BQU8sSUFBSSxNQUFNLENBQU07WUFDckIsTUFBTSxZQUFDLEVBQXlCLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QyxLQUFLLEVBQUUsSUFBSTtTQUNaLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7O09BZUc7SUFDSSxZQUFLLEdBQVosVUFBYSxLQUFVO1FBQ3JCLE9BQU8sSUFBSSxNQUFNLENBQU07WUFDckIsTUFBTSxZQUFDLEVBQXlCLElBQUksRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDbkQsS0FBSyxFQUFFLElBQUk7U0FDWixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0ksV0FBSSxHQUFYLFVBQWUsS0FBNEQ7UUFDekUsSUFBSSxPQUFPLEtBQUssQ0FBQywyQkFBWSxDQUFDLEtBQUssVUFBVTtZQUMzQyxPQUFPLE1BQU0sQ0FBQyxjQUFjLENBQUksS0FBc0IsQ0FBQyxDQUFDO2FBQzFELElBQUksT0FBUSxLQUF3QixDQUFDLElBQUksS0FBSyxVQUFVO1lBQ3RELE9BQU8sTUFBTSxDQUFDLFdBQVcsQ0FBSSxLQUF1QixDQUFDLENBQUM7YUFDeEQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUN0QixPQUFPLE1BQU0sQ0FBQyxTQUFTLENBQUksS0FBSyxDQUFDLENBQUM7UUFFcEMsTUFBTSxJQUFJLFNBQVMsQ0FBQyxrRUFBa0UsQ0FBQyxDQUFDO0lBQzFGLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7OztPQWdCRztJQUNJLFNBQUUsR0FBVDtRQUFhLGVBQWtCO2FBQWxCLFVBQWtCLEVBQWxCLHFCQUFrQixFQUFsQixJQUFrQjtZQUFsQiwwQkFBa0I7O1FBQzdCLE9BQU8sTUFBTSxDQUFDLFNBQVMsQ0FBSSxLQUFLLENBQUMsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7O09BY0c7SUFDSSxnQkFBUyxHQUFoQixVQUFvQixLQUFlO1FBQ2pDLE9BQU8sSUFBSSxNQUFNLENBQUksSUFBSSxTQUFTLENBQUksS0FBSyxDQUFDLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7OztPQWVHO0lBQ0ksa0JBQVcsR0FBbEIsVUFBc0IsT0FBdUI7UUFDM0MsT0FBTyxJQUFJLE1BQU0sQ0FBSSxJQUFJLFdBQVcsQ0FBSSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSSxxQkFBYyxHQUFyQixVQUF5QixHQUFxQjtRQUM1QyxJQUFLLEdBQWlCLENBQUMsT0FBTztZQUFFLE9BQU8sR0FBZ0IsQ0FBQztRQUN4RCxJQUFNLENBQUMsR0FBRyxPQUFPLEdBQUcsQ0FBQywyQkFBWSxDQUFDLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsMkJBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztRQUM5RSxPQUFPLElBQUksTUFBTSxDQUFJLElBQUksY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7T0FlRztJQUNJLGVBQVEsR0FBZixVQUFnQixNQUFjO1FBQzVCLE9BQU8sSUFBSSxNQUFNLENBQVMsSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBeURTLHFCQUFJLEdBQWQsVUFBa0IsT0FBb0I7UUFDcEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUksSUFBSSxLQUFLLENBQU8sT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVEOzs7Ozs7Ozs7Ozs7Ozs7O09BZ0JHO0lBQ0gsb0JBQUcsR0FBSCxVQUFPLE9BQW9CO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7OztPQWVHO0lBQ0gsc0JBQUssR0FBTCxVQUFTLGNBQWlCO1FBQ3hCLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBTSxPQUFBLGNBQWMsRUFBZCxDQUFjLENBQUMsQ0FBQztRQUN6QyxJQUFNLEVBQUUsR0FBbUIsQ0FBQyxDQUFDLEtBQXVCLENBQUM7UUFDckQsRUFBRSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUM7UUFDbEIsT0FBTyxDQUFDLENBQUM7SUFDWCxDQUFDO0lBSUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FtQkc7SUFDSCx1QkFBTSxHQUFOLFVBQU8sTUFBeUI7UUFDOUIsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUNyQixJQUFJLENBQUMsWUFBWSxNQUFNO1lBQ3JCLE9BQU8sSUFBSSxNQUFNLENBQUksSUFBSSxNQUFNLENBQzdCLEdBQUcsQ0FBRSxDQUFlLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxFQUM5QixDQUFlLENBQUMsR0FBRyxDQUNyQixDQUFDLENBQUM7UUFDTCxPQUFPLElBQUksTUFBTSxDQUFJLElBQUksTUFBTSxDQUFJLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7O09BZUc7SUFDSCxxQkFBSSxHQUFKLFVBQUssTUFBYztRQUNqQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBSSxJQUFJLElBQUksQ0FBSSxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7T0FnQkc7SUFDSCxxQkFBSSxHQUFKLFVBQUssTUFBYztRQUNqQixPQUFPLElBQUksTUFBTSxDQUFJLElBQUksSUFBSSxDQUFJLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRDs7Ozs7Ozs7Ozs7OztPQWFHO0lBQ0gscUJBQUksR0FBSjtRQUNFLE9BQU8sSUFBSSxNQUFNLENBQUksSUFBSSxJQUFJLENBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7OztPQWVHO0lBQ0gsMEJBQVMsR0FBVCxVQUFVLE9BQVU7UUFDbEIsT0FBTyxJQUFJLFlBQVksQ0FBSSxJQUFJLFNBQVMsQ0FBSSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQWtCRztJQUNILHdCQUFPLEdBQVAsVUFBUSxLQUFrQjtRQUN4QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBSSxJQUFJLE9BQU8sQ0FBSSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0E0Qkc7SUFDSCxxQkFBSSxHQUFKLFVBQVEsVUFBK0IsRUFBRSxJQUFPO1FBQzlDLE9BQU8sSUFBSSxZQUFZLENBQUksSUFBSSxJQUFJLENBQU8sVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXNCRztJQUNILDZCQUFZLEdBQVosVUFBYSxPQUFnQztRQUMzQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBSSxJQUFJLFlBQVksQ0FBSSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQXdCRztJQUNILHdCQUFPLEdBQVA7UUFDRSxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBQ3JCLE9BQU8sSUFBSSxNQUFNLENBQUksSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQWtCLENBQUM7SUFDM0QsQ0FBQztJQUVEOzs7Ozs7Ozs7O09BVUc7SUFDSCx3QkFBTyxHQUFQLFVBQVcsUUFBa0M7UUFDM0MsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILHlCQUFRLEdBQVI7UUFDRSxPQUFPLElBQUksWUFBWSxDQUFJLElBQUksUUFBUSxDQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUtEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BeUJHO0lBQ0gsc0JBQUssR0FBTCxVQUFNLFVBQXFDO1FBQ3pDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFJLElBQUksS0FBSyxDQUFJLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BK0RHO0lBQ0gsd0JBQU8sR0FBUCxVQUFRLE1BQWlCO1FBQ3ZCLElBQUksTUFBTSxZQUFZLFlBQVk7WUFDaEMsTUFBTSxJQUFJLEtBQUssQ0FBQyxxREFBcUQ7Z0JBQ3JFLDREQUE0RDtnQkFDNUQsdUNBQXVDLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQztRQUN0QixLQUFLLElBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDakYsSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILG1DQUFrQixHQUFsQixVQUFtQixLQUFRO1FBQ3pCLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILG9DQUFtQixHQUFuQixVQUFvQixLQUFVO1FBQzVCLElBQUksQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILHVDQUFzQixHQUF0QjtRQUNFLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUNaLENBQUM7SUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztPQW1CRztJQUNILGlDQUFnQixHQUFoQixVQUFpQixRQUFpRDtRQUNoRSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2IsSUFBSSxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUM7WUFDaEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUF5QixDQUFDO1NBQ3RDO2FBQU07WUFDTCxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQztZQUNkLFFBQWdDLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO1lBQzVELFFBQWdDLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDO1lBQzdELFFBQWdDLENBQUMsRUFBRSxHQUFHLFFBQVEsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDO1lBQ2pFLElBQUksQ0FBQyxHQUFHLEdBQUcsUUFBK0IsQ0FBQztTQUM1QztJQUNILENBQUM7SUFsaEJEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0FxQkc7SUFDSSxZQUFLLEdBQW1CO1FBQWUsaUJBQThCO2FBQTlCLFVBQThCLEVBQTlCLHFCQUE4QixFQUE5QixJQUE4QjtZQUE5Qiw0QkFBOEI7O1FBQzFFLE9BQU8sSUFBSSxNQUFNLENBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUM3QyxDQUFtQixDQUFDO0lBRXBCOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7T0F3Qkc7SUFDSSxjQUFPLEdBQXFCO1FBQWlCLGlCQUE4QjthQUE5QixVQUE4QixFQUE5QixxQkFBOEIsRUFBOUIsSUFBOEI7WUFBOUIsNEJBQThCOztRQUNoRixPQUFPLElBQUksTUFBTSxDQUFhLElBQUksT0FBTyxDQUFNLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDM0QsQ0FBcUIsQ0FBQztJQThkeEIsYUFBQztDQTM0QkQsQUEyNEJDLElBQUE7QUEzNEJZLHdCQUFNO0FBNjRCbkI7SUFBcUMsZ0NBQVM7SUFHNUMsc0JBQVksUUFBNkI7UUFBekMsWUFDRSxrQkFBTSxRQUFRLENBQUMsU0FDaEI7UUFITyxVQUFJLEdBQVksS0FBSyxDQUFDOztJQUc5QixDQUFDO0lBRUQseUJBQUUsR0FBRixVQUFHLENBQUk7UUFDTCxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLGlCQUFNLEVBQUUsWUFBQyxDQUFDLENBQUMsQ0FBQztJQUNkLENBQUM7SUFFRCwyQkFBSSxHQUFKLFVBQUssRUFBdUI7UUFDMUIsSUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUN4QixJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQUUsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xDLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDcEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNYLElBQUksQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDaEIsSUFBSSxJQUFJLENBQUMsSUFBSTtnQkFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5QixPQUFPO1NBQ1I7UUFDRCxJQUFJLElBQUksQ0FBQyxPQUFPLEtBQUssRUFBRSxFQUFFO1lBQ3ZCLElBQUksSUFBSSxDQUFDLElBQUk7Z0JBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDOUIsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMzQixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztTQUNuQjthQUFNLElBQUksSUFBSSxDQUFDLElBQUk7WUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUFNO1lBQ3pDLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDckIsSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzlCO0lBQ0gsQ0FBQztJQUVELCtCQUFRLEdBQVI7UUFDRSxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztRQUNsQixpQkFBTSxRQUFRLFdBQUUsQ0FBQztJQUNuQixDQUFDO0lBRUQseUJBQUUsR0FBRjtRQUNFLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLGlCQUFNLEVBQUUsV0FBRSxDQUFDO0lBQ2IsQ0FBQztJQUVELDBCQUFHLEdBQUgsVUFBTyxPQUFvQjtRQUN6QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFvQixDQUFDO0lBQy9DLENBQUM7SUFFRCw0QkFBSyxHQUFMLFVBQVMsY0FBaUI7UUFDeEIsT0FBTyxpQkFBTSxLQUFLLFlBQUMsY0FBYyxDQUFvQixDQUFDO0lBQ3hELENBQUM7SUFFRCwyQkFBSSxHQUFKLFVBQUssTUFBYztRQUNqQixPQUFPLGlCQUFNLElBQUksWUFBQyxNQUFNLENBQW9CLENBQUM7SUFDL0MsQ0FBQztJQUVELDhCQUFPLEdBQVAsVUFBUSxLQUFrQjtRQUN4QixPQUFPLGlCQUFNLE9BQU8sWUFBQyxLQUFLLENBQW9CLENBQUM7SUFDakQsQ0FBQztJQUVELG1DQUFZLEdBQVosVUFBYSxPQUFnQztRQUMzQyxPQUFPLGlCQUFNLFlBQVksWUFBQyxPQUFPLENBQW9CLENBQUM7SUFDeEQsQ0FBQztJQUVELCtCQUFRLEdBQVI7UUFDRSxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFLRCw0QkFBSyxHQUFMLFVBQU0sVUFBaUQ7UUFDckQsT0FBTyxpQkFBTSxLQUFLLFlBQUMsVUFBaUIsQ0FBb0IsQ0FBQztJQUMzRCxDQUFDO0lBQ0gsbUJBQUM7QUFBRCxDQXhFQSxBQXdFQyxDQXhFb0MsTUFBTSxHQXdFMUM7QUF4RVksb0NBQVk7QUEyRXpCLElBQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQztBQUVsQixrQkFBZSxFQUFFLENBQUM7Ozs7Ozs7QUN0Z0VsQjs7OztBQUNBOzs7O0FBQ0E7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7QUFPQSxTQUFTLElBQVQsQ0FBYyxPQUFkLEVBQXVCO0FBQ3JCLFVBQVEsT0FBUixHQUFrQixFQUFHO0FBQ25CLDRCQUF3QixrQkFBRyxNQUFILEVBRFI7QUFFaEIsNEJBQXdCLGtCQUFHLE1BQUg7QUFGUixHQUFsQjtBQUlBO0FBQ0EsVUFBUSxzQkFBUixHQUFpQyw0Q0FBdUI7QUFDdEQsVUFBTSxRQUFRLE9BQVIsQ0FBZ0Isc0JBRGdDO0FBRXRELFNBQUssUUFBUTtBQUZ5QyxHQUF2QixDQUFqQztBQUlBLFVBQVEsc0JBQVIsR0FBaUMsb0NBQXVCO0FBQ3RELFVBQU0sUUFBUSxPQUFSLENBQWdCLHNCQURnQztBQUV0RCxnQkFBWSxRQUFRO0FBRmtDLEdBQXZCLENBQWpDOztBQU1BO0FBQ0EsTUFBTSxpQkFBaUIsa0JBQUcsS0FBSDtBQUNyQjtBQUNBLG9CQUFHLEVBQUgsQ0FBTTtBQUNKLGFBQVMsY0FETDtBQUVKLGFBQVMsQ0FBQyxNQUFELEVBQVMsS0FBVDtBQUZMLEdBQU4sRUFHRyxPQUhILENBR1cscUJBQU0sR0FBTixDQUhYLENBRnFCLEVBTXJCLGtCQUFHLEVBQUgsQ0FBTSxJQUFOLEVBQVksT0FBWixDQUFvQixxQkFBTSxJQUFOLENBQXBCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBZnFCLEdBQXZCOztBQWtCQSxVQUFRLHNCQUFSLENBQStCLE1BQS9CLENBQXNDLFdBQXRDLENBQWtEO0FBQ2hELFVBQU07QUFBQSxhQUFTLFFBQVEsR0FBUixDQUFZLFFBQVosRUFBc0IsS0FBdEIsQ0FBVDtBQUFBO0FBRDBDLEdBQWxEOztBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTSxjQUFjLGtCQUFHLEtBQUgsRUFBcEI7O0FBRUEsTUFBTSxRQUFRLGtCQUFHLE9BQUgsQ0FDWixRQUFRLHNCQUFSLENBQStCLEdBRG5CLEVBRVosUUFBUSxVQUFSLENBQW1CLEdBRlAsRUFHWixHQUhZLENBR1I7QUFBQTtBQUFBLFFBQUUsYUFBRjtBQUFBLFFBQWlCLElBQWpCOztBQUFBLFdBQTJCLGNBQUksQ0FBQyxhQUFELEVBQWdCLElBQWhCLENBQUosQ0FBM0I7QUFBQSxHQUhRLENBQWQ7O0FBTUEsU0FBTztBQUNMLFNBQUssS0FEQTtBQUVMLGdCQUFZLFFBQVEsc0JBQVIsQ0FBK0IsTUFGdEM7QUFHTCxhQUFTLEVBQUc7QUFDViw4QkFBd0IsY0FEakI7QUFFUCw4QkFBd0I7QUFGakI7QUFISixHQUFQO0FBUUQ7O0FBRUQsY0FBSSxxQkFBUSxJQUFSLEVBQWMsVUFBQyxLQUFELEVBQVEsTUFBUjtBQUFBLFNBQW1CLE1BQU0sT0FBTixDQUFjLE1BQWQsQ0FBbkI7QUFBQSxDQUFkLENBQUosRUFBNkQ7QUFDM0QsT0FBSyx3QkFBYyxNQUFkLENBRHNEO0FBRTNELGNBQVk7QUFGK0MsQ0FBN0Q7OztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDM1VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7OztBQ3pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQzVCQSxrQ0FBMEM7QUFDMUMsSUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDO0FBRWpCO0lBTUUsNkJBQW1CLEdBQWMsRUFDckIsRUFBeUM7UUFEbEMsUUFBRyxHQUFILEdBQUcsQ0FBVztRQUwxQixTQUFJLEdBQUcsYUFBYSxDQUFDO1FBQ3JCLFFBQUcsR0FBYyxJQUFXLENBQUM7UUFFNUIsTUFBQyxHQUFZLEtBQUssQ0FBQztRQUl6QixJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFDLENBQUMsRUFBRSxDQUFDLElBQUssT0FBQSxDQUFDLEtBQUssQ0FBQyxFQUFQLENBQU8sQ0FBQztJQUMxQyxDQUFDO0lBRUQsb0NBQU0sR0FBTixVQUFPLEdBQWM7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRUQsbUNBQUssR0FBTDtRQUNFLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBVyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxDQUFDLEdBQUcsS0FBWSxDQUFDO0lBQ3hCLENBQUM7SUFFRCxnQ0FBRSxHQUFGLFVBQUcsQ0FBSTtRQUNMLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLENBQUM7WUFBRSxPQUFPO1FBQ2YsSUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQUUsT0FBTztRQUMzQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDVixDQUFDO0lBRUQsZ0NBQUUsR0FBRixVQUFHLEdBQVE7UUFDVCxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBQ25CLElBQUksQ0FBQyxDQUFDO1lBQUUsT0FBTztRQUNmLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDWixDQUFDO0lBRUQsZ0NBQUUsR0FBRjtRQUNFLElBQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkIsSUFBSSxDQUFDLENBQUM7WUFBRSxPQUFPO1FBQ2YsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDO0lBQ1QsQ0FBQztJQUNILDBCQUFDO0FBQUQsQ0ExQ0EsQUEwQ0MsSUFBQTtBQTFDWSxrREFBbUI7QUE0Q2hDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBZ0VHO0FBQ0gscUJBQXVDLE9BQXVEO0lBQXZELHdCQUFBLEVBQUEsZUFBc0QsQ0FBQztJQUM1RixPQUFPLDZCQUE2QixHQUFjO1FBQ2hELE9BQU8sSUFBSSxjQUFNLENBQUksSUFBSSxtQkFBbUIsQ0FBSSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUNqRSxDQUFDLENBQUM7QUFDSixDQUFDO0FBSkQsOEJBSUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0eXBlc18xID0gcmVxdWlyZShcIi4vdHlwZXNcIik7XG5leHBvcnRzLlN0YXR1cyA9IHR5cGVzXzEuU3RhdHVzO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmV4cG9ydHMuZ2VuZXJhdGVHb2FsSUQgPSB1dGlsc18xLmdlbmVyYXRlR29hbElEO1xuZXhwb3J0cy5pbml0R29hbCA9IHV0aWxzXzEuaW5pdEdvYWw7XG5leHBvcnRzLmlzRXF1YWwgPSB1dGlsc18xLmlzRXF1YWw7XG5leHBvcnRzLnBvd2VydXAgPSB1dGlsc18xLnBvd2VydXA7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTdGF0dXM7XG4oZnVuY3Rpb24gKFN0YXR1cykge1xuICAgIFN0YXR1c1tcIlBFTkRJTkdcIl0gPSBcIlBFTkRJTkdcIjtcbiAgICBTdGF0dXNbXCJBQ1RJVkVcIl0gPSBcIkFDVElWRVwiO1xuICAgIFN0YXR1c1tcIlBSRUVNUFRFRFwiXSA9IFwiUFJFRU1QVEVEXCI7XG4gICAgU3RhdHVzW1wiU1VDQ0VFREVEXCJdID0gXCJTVUNDRUVERURcIjtcbiAgICBTdGF0dXNbXCJBQk9SVEVEXCJdID0gXCJBQk9SVEVEXCI7XG59KShTdGF0dXMgPSBleHBvcnRzLlN0YXR1cyB8fCAoZXhwb3J0cy5TdGF0dXMgPSB7fSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dHlwZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19yZXN0ID0gKHRoaXMgJiYgdGhpcy5fX3Jlc3QpIHx8IGZ1bmN0aW9uIChzLCBlKSB7XG4gICAgdmFyIHQgPSB7fTtcbiAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkgJiYgZS5pbmRleE9mKHApIDwgMClcbiAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgaWYgKHMgIT0gbnVsbCAmJiB0eXBlb2YgT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyA9PT0gXCJmdW5jdGlvblwiKVxuICAgICAgICBmb3IgKHZhciBpID0gMCwgcCA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMocyk7IGkgPCBwLmxlbmd0aDsgaSsrKSBpZiAoZS5pbmRleE9mKHBbaV0pIDwgMClcbiAgICAgICAgICAgIHRbcFtpXV0gPSBzW3BbaV1dO1xuICAgIHJldHVybiB0O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdlbmVyYXRlR29hbElEKCkge1xuICAgIHZhciBub3cgPSBuZXcgRGF0ZSgpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN0YW1wOiBub3csXG4gICAgICAgIGlkOiBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMikgKyBcIi1cIiArIG5vdy5nZXRUaW1lKCksXG4gICAgfTtcbn1cbmV4cG9ydHMuZ2VuZXJhdGVHb2FsSUQgPSBnZW5lcmF0ZUdvYWxJRDtcbmZ1bmN0aW9uIGluaXRHb2FsKGdvYWwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBnb2FsX2lkOiBnZW5lcmF0ZUdvYWxJRCgpLFxuICAgICAgICBnb2FsOiBnb2FsLFxuICAgIH07XG59XG5leHBvcnRzLmluaXRHb2FsID0gaW5pdEdvYWw7XG5mdW5jdGlvbiBpc0VxdWFsKGZpcnN0LCBzZWNvbmQpIHtcbiAgICBpZiAoIWZpcnN0IHx8ICFzZWNvbmQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gKGZpcnN0LnN0YW1wID09PSBzZWNvbmQuc3RhbXAgJiYgZmlyc3QuaWQgPT09IHNlY29uZC5pZCk7XG59XG5leHBvcnRzLmlzRXF1YWwgPSBpc0VxdWFsO1xuZnVuY3Rpb24gcG93ZXJ1cChtYWluLCBjb25uZWN0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzb3VyY2VzKSB7XG4gICAgICAgIHZhciBzaW5rcyA9IG1haW4oc291cmNlcyk7XG4gICAgICAgIE9iamVjdC5rZXlzKHNvdXJjZXMucHJveGllcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIGNvbm5lY3Qoc291cmNlcy5wcm94aWVzW2tleV0sIHNpbmtzLnRhcmdldHNba2V5XSk7XG4gICAgICAgIH0pO1xuICAgICAgICB2YXIgdGFyZ2V0cyA9IHNpbmtzLnRhcmdldHMsIHNpbmtzV2l0aG91dFRhcmdldHMgPSBfX3Jlc3Qoc2lua3MsIFtcInRhcmdldHNcIl0pO1xuICAgICAgICByZXR1cm4gc2lua3NXaXRob3V0VGFyZ2V0cztcbiAgICB9O1xufVxuZXhwb3J0cy5wb3dlcnVwID0gcG93ZXJ1cDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgZnJvbUV2ZW50XzEgPSByZXF1aXJlKFwiLi9mcm9tRXZlbnRcIik7XG52YXIgQm9keURPTVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBCb2R5RE9NU291cmNlKF9uYW1lKSB7XG4gICAgICAgIHRoaXMuX25hbWUgPSBfbmFtZTtcbiAgICB9XG4gICAgQm9keURPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb25hbGl0eSBpcyBzdGlsbCB1bmRlZmluZWQvdW5kZWNpZGVkLlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5vZihbZG9jdW1lbnQuYm9keV0pKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGRvY3VtZW50LmJvZHkpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdmFyIHN0cmVhbTtcbiAgICAgICAgc3RyZWFtID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KGRvY3VtZW50LmJvZHksIGV2ZW50VHlwZSwgb3B0aW9ucy51c2VDYXB0dXJlLCBvcHRpb25zLnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoc3RyZWFtKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIHJldHVybiBCb2R5RE9NU291cmNlO1xufSgpKTtcbmV4cG9ydHMuQm9keURPTVNvdXJjZSA9IEJvZHlET01Tb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Cb2R5RE9NU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgZnJvbUV2ZW50XzEgPSByZXF1aXJlKFwiLi9mcm9tRXZlbnRcIik7XG52YXIgRG9jdW1lbnRET01Tb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRG9jdW1lbnRET01Tb3VyY2UoX25hbWUpIHtcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xuICAgIH1cbiAgICBEb2N1bWVudERPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb25hbGl0eSBpcyBzdGlsbCB1bmRlZmluZWQvdW5kZWNpZGVkLlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIERvY3VtZW50RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQub2YoW2RvY3VtZW50XSkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgRG9jdW1lbnRET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGRvY3VtZW50KSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBEb2N1bWVudERPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICB2YXIgc3RyZWFtO1xuICAgICAgICBzdHJlYW0gPSBmcm9tRXZlbnRfMS5mcm9tRXZlbnQoZG9jdW1lbnQsIGV2ZW50VHlwZSwgb3B0aW9ucy51c2VDYXB0dXJlLCBvcHRpb25zLnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoc3RyZWFtKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIHJldHVybiBEb2N1bWVudERPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLkRvY3VtZW50RE9NU291cmNlID0gRG9jdW1lbnRET01Tb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Eb2N1bWVudERPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTY29wZUNoZWNrZXJfMSA9IHJlcXVpcmUoXCIuL1Njb3BlQ2hlY2tlclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgbWF0Y2hlc1NlbGVjdG9yXzEgPSByZXF1aXJlKFwiLi9tYXRjaGVzU2VsZWN0b3JcIik7XG5mdW5jdGlvbiB0b0VsQXJyYXkoaW5wdXQpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaW5wdXQpO1xufVxudmFyIEVsZW1lbnRGaW5kZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRWxlbWVudEZpbmRlcihuYW1lc3BhY2UsIGlzb2xhdGVNb2R1bGUpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZSA9IGlzb2xhdGVNb2R1bGU7XG4gICAgfVxuICAgIEVsZW1lbnRGaW5kZXIucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAocm9vdEVsZW1lbnQpIHtcbiAgICAgICAgdmFyIG5hbWVzcGFjZSA9IHRoaXMubmFtZXNwYWNlO1xuICAgICAgICB2YXIgc2VsZWN0b3IgPSB1dGlsc18xLmdldFNlbGVjdG9ycyhuYW1lc3BhY2UpO1xuICAgICAgICBpZiAoIXNlbGVjdG9yKSB7XG4gICAgICAgICAgICByZXR1cm4gW3Jvb3RFbGVtZW50XTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZnVsbFNjb3BlID0gdXRpbHNfMS5nZXRGdWxsU2NvcGUobmFtZXNwYWNlKTtcbiAgICAgICAgdmFyIHNjb3BlQ2hlY2tlciA9IG5ldyBTY29wZUNoZWNrZXJfMS5TY29wZUNoZWNrZXIoZnVsbFNjb3BlLCB0aGlzLmlzb2xhdGVNb2R1bGUpO1xuICAgICAgICB2YXIgdG9wTm9kZSA9IGZ1bGxTY29wZVxuICAgICAgICAgICAgPyB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0RWxlbWVudChmdWxsU2NvcGUpIHx8IHJvb3RFbGVtZW50XG4gICAgICAgICAgICA6IHJvb3RFbGVtZW50O1xuICAgICAgICB2YXIgdG9wTm9kZU1hdGNoZXNTZWxlY3RvciA9ICEhZnVsbFNjb3BlICYmICEhc2VsZWN0b3IgJiYgbWF0Y2hlc1NlbGVjdG9yXzEubWF0Y2hlc1NlbGVjdG9yKHRvcE5vZGUsIHNlbGVjdG9yKTtcbiAgICAgICAgcmV0dXJuIHRvRWxBcnJheSh0b3BOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKVxuICAgICAgICAgICAgLmZpbHRlcihzY29wZUNoZWNrZXIuaXNEaXJlY3RseUluU2NvcGUsIHNjb3BlQ2hlY2tlcilcbiAgICAgICAgICAgIC5jb25jYXQodG9wTm9kZU1hdGNoZXNTZWxlY3RvciA/IFt0b3BOb2RlXSA6IFtdKTtcbiAgICB9O1xuICAgIHJldHVybiBFbGVtZW50RmluZGVyO1xufSgpKTtcbmV4cG9ydHMuRWxlbWVudEZpbmRlciA9IEVsZW1lbnRGaW5kZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FbGVtZW50RmluZGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIFNjb3BlQ2hlY2tlcl8xID0gcmVxdWlyZShcIi4vU2NvcGVDaGVja2VyXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBtYXRjaGVzU2VsZWN0b3JfMSA9IHJlcXVpcmUoXCIuL21hdGNoZXNTZWxlY3RvclwiKTtcbnZhciBmcm9tRXZlbnRfMSA9IHJlcXVpcmUoXCIuL2Zyb21FdmVudFwiKTtcbi8qKlxuICogRmluZHMgKHdpdGggYmluYXJ5IHNlYXJjaCkgaW5kZXggb2YgdGhlIGRlc3RpbmF0aW9uIHRoYXQgaWQgZXF1YWwgdG8gc2VhcmNoSWRcbiAqIGFtb25nIHRoZSBkZXN0aW5hdGlvbnMgaW4gdGhlIGdpdmVuIGFycmF5LlxuICovXG5mdW5jdGlvbiBpbmRleE9mKGFyciwgc2VhcmNoSWQpIHtcbiAgICB2YXIgbWluSW5kZXggPSAwO1xuICAgIHZhciBtYXhJbmRleCA9IGFyci5sZW5ndGggLSAxO1xuICAgIHZhciBjdXJyZW50SW5kZXg7XG4gICAgdmFyIGN1cnJlbnQ7XG4gICAgd2hpbGUgKG1pbkluZGV4IDw9IG1heEluZGV4KSB7XG4gICAgICAgIGN1cnJlbnRJbmRleCA9ICgobWluSW5kZXggKyBtYXhJbmRleCkgLyAyKSB8IDA7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tYml0d2lzZVxuICAgICAgICBjdXJyZW50ID0gYXJyW2N1cnJlbnRJbmRleF07XG4gICAgICAgIHZhciBjdXJyZW50SWQgPSBjdXJyZW50LmlkO1xuICAgICAgICBpZiAoY3VycmVudElkIDwgc2VhcmNoSWQpIHtcbiAgICAgICAgICAgIG1pbkluZGV4ID0gY3VycmVudEluZGV4ICsgMTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjdXJyZW50SWQgPiBzZWFyY2hJZCkge1xuICAgICAgICAgICAgbWF4SW5kZXggPSBjdXJyZW50SW5kZXggLSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGN1cnJlbnRJbmRleDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gLTE7XG59XG4vKipcbiAqIE1hbmFnZXMgXCJFdmVudCBkZWxlZ2F0aW9uXCIsIGJ5IGNvbm5lY3RpbmcgYW4gb3JpZ2luIHdpdGggbXVsdGlwbGVcbiAqIGRlc3RpbmF0aW9ucy5cbiAqXG4gKiBBdHRhY2hlcyBhIERPTSBldmVudCBsaXN0ZW5lciB0byB0aGUgRE9NIGVsZW1lbnQgY2FsbGVkIHRoZSBcIm9yaWdpblwiLFxuICogYW5kIGRlbGVnYXRlcyBldmVudHMgdG8gXCJkZXN0aW5hdGlvbnNcIiwgd2hpY2ggYXJlIHN1YmplY3RzIGFzIG91dHB1dHNcbiAqIGZvciB0aGUgRE9NU291cmNlLiBTaW11bGF0ZXMgYnViYmxpbmcgb3IgY2FwdHVyaW5nLCB3aXRoIHJlZ2FyZHMgdG9cbiAqIGlzb2xhdGlvbiBib3VuZGFyaWVzIHRvby5cbiAqL1xudmFyIEV2ZW50RGVsZWdhdG9yID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50RGVsZWdhdG9yKG9yaWdpbiwgZXZlbnRUeXBlLCB1c2VDYXB0dXJlLCBpc29sYXRlTW9kdWxlLCBwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICBpZiAocHJldmVudERlZmF1bHQgPT09IHZvaWQgMCkgeyBwcmV2ZW50RGVmYXVsdCA9IGZhbHNlOyB9XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMub3JpZ2luID0gb3JpZ2luO1xuICAgICAgICB0aGlzLmV2ZW50VHlwZSA9IGV2ZW50VHlwZTtcbiAgICAgICAgdGhpcy51c2VDYXB0dXJlID0gdXNlQ2FwdHVyZTtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlID0gaXNvbGF0ZU1vZHVsZTtcbiAgICAgICAgdGhpcy5wcmV2ZW50RGVmYXVsdCA9IHByZXZlbnREZWZhdWx0O1xuICAgICAgICB0aGlzLmRlc3RpbmF0aW9ucyA9IFtdO1xuICAgICAgICB0aGlzLl9sYXN0SWQgPSAwO1xuICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgIGlmICh1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5saXN0ZW5lciA9IGZ1bmN0aW9uIChldikge1xuICAgICAgICAgICAgICAgICAgICBmcm9tRXZlbnRfMS5wcmV2ZW50RGVmYXVsdENvbmRpdGlvbmFsKGV2LCBwcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmNhcHR1cmUoZXYpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb21FdmVudF8xLnByZXZlbnREZWZhdWx0Q29uZGl0aW9uYWwoZXYsIHByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYnViYmxlKGV2KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3RlbmVyID0gZnVuY3Rpb24gKGV2KSB7IHJldHVybiBfdGhpcy5jYXB0dXJlKGV2KTsgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubGlzdGVuZXIgPSBmdW5jdGlvbiAoZXYpIHsgcmV0dXJuIF90aGlzLmJ1YmJsZShldik7IH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgb3JpZ2luLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCB0aGlzLmxpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnVwZGF0ZU9yaWdpbiA9IGZ1bmN0aW9uIChuZXdPcmlnaW4pIHtcbiAgICAgICAgdGhpcy5vcmlnaW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50VHlwZSwgdGhpcy5saXN0ZW5lciwgdGhpcy51c2VDYXB0dXJlKTtcbiAgICAgICAgbmV3T3JpZ2luLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5ldmVudFR5cGUsIHRoaXMubGlzdGVuZXIsIHRoaXMudXNlQ2FwdHVyZSk7XG4gICAgICAgIHRoaXMub3JpZ2luID0gbmV3T3JpZ2luO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhICpuZXcqIGRlc3RpbmF0aW9uIGdpdmVuIHRoZSBuYW1lc3BhY2UgYW5kIHJldHVybnMgdGhlIHN1YmplY3RcbiAgICAgKiByZXByZXNlbnRpbmcgdGhlIGRlc3RpbmF0aW9uIG9mIGV2ZW50cy4gSXMgbm90IHJlZmVyZW50aWFsbHkgdHJhbnNwYXJlbnQsXG4gICAgICogd2lsbCBhbHdheXMgcmV0dXJuIGEgZGlmZmVyZW50IG91dHB1dCBmb3IgdGhlIHNhbWUgaW5wdXQuXG4gICAgICovXG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLmNyZWF0ZURlc3RpbmF0aW9uID0gZnVuY3Rpb24gKG5hbWVzcGFjZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgaWQgPSB0aGlzLl9sYXN0SWQrKztcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gdXRpbHNfMS5nZXRTZWxlY3RvcnMobmFtZXNwYWNlKTtcbiAgICAgICAgdmFyIHNjb3BlQ2hlY2tlciA9IG5ldyBTY29wZUNoZWNrZXJfMS5TY29wZUNoZWNrZXIodXRpbHNfMS5nZXRGdWxsU2NvcGUobmFtZXNwYWNlKSwgdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgdmFyIHN1YmplY3QgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoe1xuICAgICAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJ3JlcXVlc3RJZGxlQ2FsbGJhY2snIGluIHdpbmRvdykge1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SWRsZUNhbGxiYWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLnJlbW92ZURlc3RpbmF0aW9uKGlkKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5yZW1vdmVEZXN0aW5hdGlvbihpZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IHsgaWQ6IGlkLCBzZWxlY3Rvcjogc2VsZWN0b3IsIHNjb3BlQ2hlY2tlcjogc2NvcGVDaGVja2VyLCBzdWJqZWN0OiBzdWJqZWN0IH07XG4gICAgICAgIHRoaXMuZGVzdGluYXRpb25zLnB1c2goZGVzdGluYXRpb24pO1xuICAgICAgICByZXR1cm4gc3ViamVjdDtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJlbW92ZXMgdGhlIGRlc3RpbmF0aW9uIHRoYXQgaGFzIHRoZSBnaXZlbiBpZC5cbiAgICAgKi9cbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucmVtb3ZlRGVzdGluYXRpb24gPSBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgdmFyIGkgPSBpbmRleE9mKHRoaXMuZGVzdGluYXRpb25zLCBpZCk7XG4gICAgICAgIGkgPj0gMCAmJiB0aGlzLmRlc3RpbmF0aW9ucy5zcGxpY2UoaSwgMSk7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tdW51c2VkLWV4cHJlc3Npb25cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5jYXB0dXJlID0gZnVuY3Rpb24gKGV2KSB7XG4gICAgICAgIHZhciBuID0gdGhpcy5kZXN0aW5hdGlvbnMubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgdmFyIGRlc3QgPSB0aGlzLmRlc3RpbmF0aW9uc1tpXTtcbiAgICAgICAgICAgIGlmIChtYXRjaGVzU2VsZWN0b3JfMS5tYXRjaGVzU2VsZWN0b3IoZXYudGFyZ2V0LCBkZXN0LnNlbGVjdG9yKSkge1xuICAgICAgICAgICAgICAgIGRlc3Quc3ViamVjdC5fbihldik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5idWJibGUgPSBmdW5jdGlvbiAocmF3RXZlbnQpIHtcbiAgICAgICAgdmFyIG9yaWdpbiA9IHRoaXMub3JpZ2luO1xuICAgICAgICBpZiAoIW9yaWdpbi5jb250YWlucyhyYXdFdmVudC5jdXJyZW50VGFyZ2V0KSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciByb29mID0gb3JpZ2luLnBhcmVudEVsZW1lbnQ7XG4gICAgICAgIHZhciBldiA9IHRoaXMucGF0Y2hFdmVudChyYXdFdmVudCk7XG4gICAgICAgIGZvciAodmFyIGVsID0gZXYudGFyZ2V0OyBlbCAmJiBlbCAhPT0gcm9vZjsgZWwgPSBlbC5wYXJlbnRFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAoIW9yaWdpbi5jb250YWlucyhlbCkpIHtcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChldi5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5tYXRjaEV2ZW50QWdhaW5zdERlc3RpbmF0aW9ucyhlbCwgZXYpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucGF0Y2hFdmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgcEV2ZW50ID0gZXZlbnQ7XG4gICAgICAgIHBFdmVudC5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkID0gZmFsc2U7XG4gICAgICAgIHZhciBvbGRTdG9wUHJvcGFnYXRpb24gPSBwRXZlbnQuc3RvcFByb3BhZ2F0aW9uO1xuICAgICAgICBwRXZlbnQuc3RvcFByb3BhZ2F0aW9uID0gZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uKCkge1xuICAgICAgICAgICAgb2xkU3RvcFByb3BhZ2F0aW9uLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB0aGlzLnByb3BhZ2F0aW9uSGFzQmVlblN0b3BwZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcEV2ZW50O1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLm1hdGNoRXZlbnRBZ2FpbnN0RGVzdGluYXRpb25zID0gZnVuY3Rpb24gKGVsLCBldikge1xuICAgICAgICB2YXIgbiA9IHRoaXMuZGVzdGluYXRpb25zLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkZXN0ID0gdGhpcy5kZXN0aW5hdGlvbnNbaV07XG4gICAgICAgICAgICBpZiAoIWRlc3Quc2NvcGVDaGVja2VyLmlzRGlyZWN0bHlJblNjb3BlKGVsKSkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1hdGNoZXNTZWxlY3Rvcl8xLm1hdGNoZXNTZWxlY3RvcihlbCwgZGVzdC5zZWxlY3RvcikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm11dGF0ZUV2ZW50Q3VycmVudFRhcmdldChldiwgZWwpO1xuICAgICAgICAgICAgICAgIGRlc3Quc3ViamVjdC5fbihldik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5tdXRhdGVFdmVudEN1cnJlbnRUYXJnZXQgPSBmdW5jdGlvbiAoZXZlbnQsIGN1cnJlbnRUYXJnZXRFbGVtZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsIFwiY3VycmVudFRhcmdldFwiLCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGN1cnJlbnRUYXJnZXRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicGxlYXNlIHVzZSBldmVudC5vd25lclRhcmdldFwiKTtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5vd25lclRhcmdldCA9IGN1cnJlbnRUYXJnZXRFbGVtZW50O1xuICAgIH07XG4gICAgcmV0dXJuIEV2ZW50RGVsZWdhdG9yO1xufSgpKTtcbmV4cG9ydHMuRXZlbnREZWxlZ2F0b3IgPSBFdmVudERlbGVnYXRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUV2ZW50RGVsZWdhdG9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIElzb2xhdGVNb2R1bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSXNvbGF0ZU1vZHVsZSgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50c0J5RnVsbFNjb3BlID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmRlbGVnYXRvcnNCeUZ1bGxTY29wZSA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5mdWxsU2NvcGVzQmVpbmdVcGRhdGVkID0gW107XG4gICAgICAgIHRoaXMudm5vZGVzQmVpbmdSZW1vdmVkID0gW107XG4gICAgfVxuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmNsZWFudXBWTm9kZSA9IGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgZGF0YSA9IF9hLmRhdGEsIGVsbSA9IF9hLmVsbTtcbiAgICAgICAgdmFyIGZ1bGxTY29wZSA9IChkYXRhIHx8IHt9KS5pc29sYXRlIHx8ICcnO1xuICAgICAgICB2YXIgaXNDdXJyZW50RWxtID0gdGhpcy5lbGVtZW50c0J5RnVsbFNjb3BlLmdldChmdWxsU2NvcGUpID09PSBlbG07XG4gICAgICAgIHZhciBpc1Njb3BlQmVpbmdVcGRhdGVkID0gdGhpcy5mdWxsU2NvcGVzQmVpbmdVcGRhdGVkLmluZGV4T2YoZnVsbFNjb3BlKSA+PSAwO1xuICAgICAgICBpZiAoZnVsbFNjb3BlICYmIGlzQ3VycmVudEVsbSAmJiAhaXNTY29wZUJlaW5nVXBkYXRlZCkge1xuICAgICAgICAgICAgdGhpcy5lbGVtZW50c0J5RnVsbFNjb3BlLmRlbGV0ZShmdWxsU2NvcGUpO1xuICAgICAgICAgICAgdGhpcy5kZWxlZ2F0b3JzQnlGdWxsU2NvcGUuZGVsZXRlKGZ1bGxTY29wZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmdldEVsZW1lbnQgPSBmdW5jdGlvbiAoZnVsbFNjb3BlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRzQnlGdWxsU2NvcGUuZ2V0KGZ1bGxTY29wZSk7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5nZXRGdWxsU2NvcGUgPSBmdW5jdGlvbiAoZWxtKSB7XG4gICAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuZWxlbWVudHNCeUZ1bGxTY29wZS5lbnRyaWVzKCk7XG4gICAgICAgIGZvciAodmFyIHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTsgISFyZXN1bHQudmFsdWU7IHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKSkge1xuICAgICAgICAgICAgdmFyIF9hID0gcmVzdWx0LnZhbHVlLCBmdWxsU2NvcGUgPSBfYVswXSwgZWxlbWVudCA9IF9hWzFdO1xuICAgICAgICAgICAgaWYgKGVsbSA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdWxsU2NvcGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuYWRkRXZlbnREZWxlZ2F0b3IgPSBmdW5jdGlvbiAoZnVsbFNjb3BlLCBldmVudERlbGVnYXRvcikge1xuICAgICAgICB2YXIgZGVsZWdhdG9ycyA9IHRoaXMuZGVsZWdhdG9yc0J5RnVsbFNjb3BlLmdldChmdWxsU2NvcGUpO1xuICAgICAgICBpZiAoIWRlbGVnYXRvcnMpIHtcbiAgICAgICAgICAgIGRlbGVnYXRvcnMgPSBbXTtcbiAgICAgICAgICAgIHRoaXMuZGVsZWdhdG9yc0J5RnVsbFNjb3BlLnNldChmdWxsU2NvcGUsIGRlbGVnYXRvcnMpO1xuICAgICAgICB9XG4gICAgICAgIGRlbGVnYXRvcnNbZGVsZWdhdG9ycy5sZW5ndGhdID0gZXZlbnREZWxlZ2F0b3I7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5lbGVtZW50c0J5RnVsbFNjb3BlLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuZGVsZWdhdG9yc0J5RnVsbFNjb3BlLmNsZWFyKCk7XG4gICAgICAgIHRoaXMuZnVsbFNjb3Blc0JlaW5nVXBkYXRlZCA9IFtdO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuY3JlYXRlTW9kdWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChvbGRWTm9kZSwgdk5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2EgPSBvbGRWTm9kZS5kYXRhLCBvbGREYXRhID0gX2EgPT09IHZvaWQgMCA/IHt9IDogX2E7XG4gICAgICAgICAgICAgICAgdmFyIGVsbSA9IHZOb2RlLmVsbSwgX2IgPSB2Tm9kZS5kYXRhLCBkYXRhID0gX2IgPT09IHZvaWQgMCA/IHt9IDogX2I7XG4gICAgICAgICAgICAgICAgdmFyIG9sZEZ1bGxTY29wZSA9IG9sZERhdGEuaXNvbGF0ZSB8fCAnJztcbiAgICAgICAgICAgICAgICB2YXIgZnVsbFNjb3BlID0gZGF0YS5pc29sYXRlIHx8ICcnO1xuICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBkYXRhIHN0cnVjdHVyZXMgd2l0aCB0aGUgbmV3bHktY3JlYXRlZCBlbGVtZW50XG4gICAgICAgICAgICAgICAgaWYgKGZ1bGxTY29wZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmZ1bGxTY29wZXNCZWluZ1VwZGF0ZWQucHVzaChmdWxsU2NvcGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAob2xkRnVsbFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnRzQnlGdWxsU2NvcGUuZGVsZXRlKG9sZEZ1bGxTY29wZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50c0J5RnVsbFNjb3BlLnNldChmdWxsU2NvcGUsIGVsbSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIFVwZGF0ZSBkZWxlZ2F0b3JzIGZvciB0aGlzIHNjb3BlXG4gICAgICAgICAgICAgICAgICAgIHZhciBkZWxlZ2F0b3JzID0gc2VsZi5kZWxlZ2F0b3JzQnlGdWxsU2NvcGUuZ2V0KGZ1bGxTY29wZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkZWxlZ2F0b3JzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbGVuID0gZGVsZWdhdG9ycy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZWdhdG9yc1tpXS51cGRhdGVPcmlnaW4oZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAob2xkRnVsbFNjb3BlICYmICFmdWxsU2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5lbGVtZW50c0J5RnVsbFNjb3BlLmRlbGV0ZShmdWxsU2NvcGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uIChvbGRWTm9kZSwgdk5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgX2EgPSBvbGRWTm9kZS5kYXRhLCBvbGREYXRhID0gX2EgPT09IHZvaWQgMCA/IHt9IDogX2E7XG4gICAgICAgICAgICAgICAgdmFyIGVsbSA9IHZOb2RlLmVsbSwgX2IgPSB2Tm9kZS5kYXRhLCBkYXRhID0gX2IgPT09IHZvaWQgMCA/IHt9IDogX2I7XG4gICAgICAgICAgICAgICAgdmFyIG9sZEZ1bGxTY29wZSA9IG9sZERhdGEuaXNvbGF0ZSB8fCAnJztcbiAgICAgICAgICAgICAgICB2YXIgZnVsbFNjb3BlID0gZGF0YS5pc29sYXRlIHx8ICcnO1xuICAgICAgICAgICAgICAgIC8vIFNhbWUgZWxlbWVudCwgYnV0IGRpZmZlcmVudCBzY29wZSwgc28gdXBkYXRlIHRoZSBkYXRhIHN0cnVjdHVyZXNcbiAgICAgICAgICAgICAgICBpZiAoZnVsbFNjb3BlICYmIGZ1bGxTY29wZSAhPT0gb2xkRnVsbFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRGdWxsU2NvcGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudHNCeUZ1bGxTY29wZS5kZWxldGUob2xkRnVsbFNjb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZWxmLmVsZW1lbnRzQnlGdWxsU2NvcGUuc2V0KGZ1bGxTY29wZSwgZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlbGVnYXRvcnMgPSBzZWxmLmRlbGVnYXRvcnNCeUZ1bGxTY29wZS5nZXQob2xkRnVsbFNjb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlbGVnYXRvcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGVsZWdhdG9yc0J5RnVsbFNjb3BlLmRlbGV0ZShvbGRGdWxsU2NvcGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kZWxlZ2F0b3JzQnlGdWxsU2NvcGUuc2V0KGZ1bGxTY29wZSwgZGVsZWdhdG9ycyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gU2FtZSBlbGVtZW50LCBidXQgbG9zdCB0aGUgc2NvcGUsIHNvIHVwZGF0ZSB0aGUgZGF0YSBzdHJ1Y3R1cmVzXG4gICAgICAgICAgICAgICAgaWYgKG9sZEZ1bGxTY29wZSAmJiAhZnVsbFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZWxlbWVudHNCeUZ1bGxTY29wZS5kZWxldGUob2xkRnVsbFNjb3BlKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kZWxlZ2F0b3JzQnlGdWxsU2NvcGUuZGVsZXRlKG9sZEZ1bGxTY29wZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICh2Tm9kZSkge1xuICAgICAgICAgICAgICAgIHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkLnB1c2godk5vZGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKHZOb2RlLCBjYikge1xuICAgICAgICAgICAgICAgIHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkLnB1c2godk5vZGUpO1xuICAgICAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9zdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB2bm9kZXNCZWluZ1JlbW92ZWQgPSBzZWxmLnZub2Rlc0JlaW5nUmVtb3ZlZDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdm5vZGVzQmVpbmdSZW1vdmVkLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYW51cFZOb2RlKHZub2Rlc0JlaW5nUmVtb3ZlZFtpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkID0gW107XG4gICAgICAgICAgICAgICAgc2VsZi5mdWxsU2NvcGVzQmVpbmdVcGRhdGVkID0gW107XG4gICAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgIH07XG4gICAgcmV0dXJuIElzb2xhdGVNb2R1bGU7XG59KCkpO1xuZXhwb3J0cy5Jc29sYXRlTW9kdWxlID0gSXNvbGF0ZU1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUlzb2xhdGVNb2R1bGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBEb2N1bWVudERPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vRG9jdW1lbnRET01Tb3VyY2VcIik7XG52YXIgQm9keURPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vQm9keURPTVNvdXJjZVwiKTtcbnZhciBFbGVtZW50RmluZGVyXzEgPSByZXF1aXJlKFwiLi9FbGVtZW50RmluZGVyXCIpO1xudmFyIGZyb21FdmVudF8xID0gcmVxdWlyZShcIi4vZnJvbUV2ZW50XCIpO1xudmFyIGlzb2xhdGVfMSA9IHJlcXVpcmUoXCIuL2lzb2xhdGVcIik7XG52YXIgRXZlbnREZWxlZ2F0b3JfMSA9IHJlcXVpcmUoXCIuL0V2ZW50RGVsZWdhdG9yXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBldmVudFR5cGVzVGhhdERvbnRCdWJibGUgPSBbXG4gICAgXCJibHVyXCIsXG4gICAgXCJjYW5wbGF5XCIsXG4gICAgXCJjYW5wbGF5dGhyb3VnaFwiLFxuICAgIFwiZHVyYXRpb25jaGFuZ2VcIixcbiAgICBcImVtcHRpZWRcIixcbiAgICBcImVuZGVkXCIsXG4gICAgXCJmb2N1c1wiLFxuICAgIFwibG9hZFwiLFxuICAgIFwibG9hZGVkZGF0YVwiLFxuICAgIFwibG9hZGVkbWV0YWRhdGFcIixcbiAgICBcIm1vdXNlZW50ZXJcIixcbiAgICBcIm1vdXNlbGVhdmVcIixcbiAgICBcInBhdXNlXCIsXG4gICAgXCJwbGF5XCIsXG4gICAgXCJwbGF5aW5nXCIsXG4gICAgXCJyYXRlY2hhbmdlXCIsXG4gICAgXCJyZXNldFwiLFxuICAgIFwic2Nyb2xsXCIsXG4gICAgXCJzZWVrZWRcIixcbiAgICBcInNlZWtpbmdcIixcbiAgICBcInN0YWxsZWRcIixcbiAgICBcInN1Ym1pdFwiLFxuICAgIFwic3VzcGVuZFwiLFxuICAgIFwidGltZXVwZGF0ZVwiLFxuICAgIFwidW5sb2FkXCIsXG4gICAgXCJ2b2x1bWVjaGFuZ2VcIixcbiAgICBcIndhaXRpbmdcIixcbl07XG5mdW5jdGlvbiBkZXRlcm1pbmVVc2VDYXB0dXJlKGV2ZW50VHlwZSwgb3B0aW9ucykge1xuICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICBpZiAodHlwZW9mIG9wdGlvbnMudXNlQ2FwdHVyZSA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIHJlc3VsdCA9IG9wdGlvbnMudXNlQ2FwdHVyZTtcbiAgICB9XG4gICAgaWYgKGV2ZW50VHlwZXNUaGF0RG9udEJ1YmJsZS5pbmRleE9mKGV2ZW50VHlwZSkgIT09IC0xKSB7XG4gICAgICAgIHJlc3VsdCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBmaWx0ZXJCYXNlZE9uSXNvbGF0aW9uKGRvbVNvdXJjZSwgZnVsbFNjb3BlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGZpbHRlckJhc2VkT25Jc29sYXRpb25PcGVyYXRvcihyb290RWxlbWVudCQpIHtcbiAgICAgICAgdmFyIGluaXRpYWxTdGF0ZSA9IHtcbiAgICAgICAgICAgIHdhc0lzb2xhdGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHNob3VsZFBhc3M6IGZhbHNlLFxuICAgICAgICAgICAgZWxlbWVudDogbnVsbCxcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHJvb3RFbGVtZW50JFxuICAgICAgICAgICAgLmZvbGQoZnVuY3Rpb24gY2hlY2tJZlNob3VsZFBhc3Moc3RhdGUsIGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHZhciBpc0lzb2xhdGVkID0gISFkb21Tb3VyY2UuX2lzb2xhdGVNb2R1bGUuZ2V0RWxlbWVudChmdWxsU2NvcGUpO1xuICAgICAgICAgICAgc3RhdGUuc2hvdWxkUGFzcyA9IGlzSXNvbGF0ZWQgJiYgIXN0YXRlLndhc0lzb2xhdGVkO1xuICAgICAgICAgICAgc3RhdGUud2FzSXNvbGF0ZWQgPSBpc0lzb2xhdGVkO1xuICAgICAgICAgICAgc3RhdGUuZWxlbWVudCA9IGVsZW1lbnQ7XG4gICAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgIH0sIGluaXRpYWxTdGF0ZSlcbiAgICAgICAgICAgIC5kcm9wKDEpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnNob3VsZFBhc3M7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLmVsZW1lbnQ7IH0pO1xuICAgIH07XG59XG52YXIgTWFpbkRPTVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNYWluRE9NU291cmNlKF9yb290RWxlbWVudCQsIF9zYW5pdGF0aW9uJCwgX25hbWVzcGFjZSwgX2lzb2xhdGVNb2R1bGUsIF9kZWxlZ2F0b3JzLCBfbmFtZSkge1xuICAgICAgICBpZiAoX25hbWVzcGFjZSA9PT0gdm9pZCAwKSB7IF9uYW1lc3BhY2UgPSBbXTsgfVxuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLl9yb290RWxlbWVudCQgPSBfcm9vdEVsZW1lbnQkO1xuICAgICAgICB0aGlzLl9zYW5pdGF0aW9uJCA9IF9zYW5pdGF0aW9uJDtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gX25hbWVzcGFjZTtcbiAgICAgICAgdGhpcy5faXNvbGF0ZU1vZHVsZSA9IF9pc29sYXRlTW9kdWxlO1xuICAgICAgICB0aGlzLl9kZWxlZ2F0b3JzID0gX2RlbGVnYXRvcnM7XG4gICAgICAgIHRoaXMuX25hbWUgPSBfbmFtZTtcbiAgICAgICAgdGhpcy5pc29sYXRlU291cmNlID0gaXNvbGF0ZV8xLmlzb2xhdGVTb3VyY2U7XG4gICAgICAgIHRoaXMuaXNvbGF0ZVNpbmsgPSBmdW5jdGlvbiAoc2luaywgc2NvcGUpIHtcbiAgICAgICAgICAgIGlmIChzY29wZSA9PT0gJzpyb290Jykge1xuICAgICAgICAgICAgICAgIHJldHVybiBzaW5rO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodXRpbHNfMS5pc0NsYXNzT3JJZChzY29wZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNvbGF0ZV8xLnNpYmxpbmdJc29sYXRlU2luayhzaW5rLCBzY29wZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJldkZ1bGxTY29wZSA9IHV0aWxzXzEuZ2V0RnVsbFNjb3BlKF90aGlzLl9uYW1lc3BhY2UpO1xuICAgICAgICAgICAgICAgIHZhciBuZXh0RnVsbFNjb3BlID0gW3ByZXZGdWxsU2NvcGUsIHNjb3BlXS5maWx0ZXIoZnVuY3Rpb24gKHgpIHsgcmV0dXJuICEheDsgfSkuam9pbignLScpO1xuICAgICAgICAgICAgICAgIHJldHVybiBpc29sYXRlXzEudG90YWxJc29sYXRlU2luayhzaW5rLCBuZXh0RnVsbFNjb3BlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuX2VsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fbmFtZXNwYWNlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50JC5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIFt4XTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudEZpbmRlcl8xID0gbmV3IEVsZW1lbnRGaW5kZXJfMS5FbGVtZW50RmluZGVyKHRoaXMuX25hbWVzcGFjZSwgdGhpcy5faXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcm9vdEVsZW1lbnQkLm1hcChmdW5jdGlvbiAoZWwpIHsgcmV0dXJuIGVsZW1lbnRGaW5kZXJfMS5jYWxsKGVsKTsgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh0aGlzLl9lbGVtZW50cygpLnJlbWVtYmVyKCkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQodGhpcy5fZWxlbWVudHMoKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYXJyKSB7IHJldHVybiBhcnIubGVuZ3RoID4gMDsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGFycikgeyByZXR1cm4gYXJyWzBdOyB9KVxuICAgICAgICAgICAgLnJlbWVtYmVyKCkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE1haW5ET01Tb3VyY2UucHJvdG90eXBlLCBcIm5hbWVzcGFjZVwiLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX25hbWVzcGFjZTtcbiAgICAgICAgfSxcbiAgICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJET00gZHJpdmVyJ3Mgc2VsZWN0KCkgZXhwZWN0cyB0aGUgYXJndW1lbnQgdG8gYmUgYSBcIiArXG4gICAgICAgICAgICAgICAgXCJzdHJpbmcgYXMgYSBDU1Mgc2VsZWN0b3JcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnZG9jdW1lbnQnKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERvY3VtZW50RE9NU291cmNlXzEuRG9jdW1lbnRET01Tb3VyY2UodGhpcy5fbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnYm9keScpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgQm9keURPTVNvdXJjZV8xLkJvZHlET01Tb3VyY2UodGhpcy5fbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRyaW1tZWRTZWxlY3RvciA9IHNlbGVjdG9yLnRyaW0oKTtcbiAgICAgICAgdmFyIGNoaWxkTmFtZXNwYWNlID0gdHJpbW1lZFNlbGVjdG9yID09PSBcIjpyb290XCJcbiAgICAgICAgICAgID8gdGhpcy5fbmFtZXNwYWNlXG4gICAgICAgICAgICA6IHRoaXMuX25hbWVzcGFjZS5jb25jYXQodHJpbW1lZFNlbGVjdG9yKTtcbiAgICAgICAgcmV0dXJuIG5ldyBNYWluRE9NU291cmNlKHRoaXMuX3Jvb3RFbGVtZW50JCwgdGhpcy5fc2FuaXRhdGlvbiQsIGNoaWxkTmFtZXNwYWNlLCB0aGlzLl9pc29sYXRlTW9kdWxlLCB0aGlzLl9kZWxlZ2F0b3JzLCB0aGlzLl9uYW1lKTtcbiAgICB9O1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRPTSBkcml2ZXIncyBldmVudHMoKSBleHBlY3RzIGFyZ3VtZW50IHRvIGJlIGEgXCIgK1xuICAgICAgICAgICAgICAgIFwic3RyaW5nIHJlcHJlc2VudGluZyB0aGUgZXZlbnQgdHlwZSB0byBsaXN0ZW4gZm9yLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdXNlQ2FwdHVyZSA9IGRldGVybWluZVVzZUNhcHR1cmUoZXZlbnRUeXBlLCBvcHRpb25zKTtcbiAgICAgICAgdmFyIG5hbWVzcGFjZSA9IHRoaXMuX25hbWVzcGFjZTtcbiAgICAgICAgdmFyIGZ1bGxTY29wZSA9IHV0aWxzXzEuZ2V0RnVsbFNjb3BlKG5hbWVzcGFjZSk7XG4gICAgICAgIHZhciBrZXlQYXJ0cyA9IFtldmVudFR5cGUsIHVzZUNhcHR1cmVdO1xuICAgICAgICBpZiAoZnVsbFNjb3BlKSB7XG4gICAgICAgICAgICBrZXlQYXJ0cy5wdXNoKGZ1bGxTY29wZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGtleSA9IGtleVBhcnRzLmpvaW4oJ34nKTtcbiAgICAgICAgdmFyIGRvbVNvdXJjZSA9IHRoaXM7XG4gICAgICAgIHZhciByb290RWxlbWVudCQ7XG4gICAgICAgIGlmIChmdWxsU2NvcGUpIHtcbiAgICAgICAgICAgIHJvb3RFbGVtZW50JCA9IHRoaXMuX3Jvb3RFbGVtZW50JC5jb21wb3NlKGZpbHRlckJhc2VkT25Jc29sYXRpb24oZG9tU291cmNlLCBmdWxsU2NvcGUpKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJvb3RFbGVtZW50JCA9IHRoaXMuX3Jvb3RFbGVtZW50JC50YWtlKDIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBldmVudCQgPSByb290RWxlbWVudCRcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gc2V0dXBFdmVudERlbGVnYXRvck9uVG9wRWxlbWVudChyb290RWxlbWVudCkge1xuICAgICAgICAgICAgLy8gRXZlbnQgbGlzdGVuZXIganVzdCBmb3IgdGhlIHJvb3QgZWxlbWVudFxuICAgICAgICAgICAgaWYgKCFuYW1lc3BhY2UgfHwgbmFtZXNwYWNlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmcm9tRXZlbnRfMS5mcm9tRXZlbnQocm9vdEVsZW1lbnQsIGV2ZW50VHlwZSwgdXNlQ2FwdHVyZSwgb3B0aW9ucy5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBFdmVudCBsaXN0ZW5lciBvbiB0aGUgb3JpZ2luIGVsZW1lbnQgYXMgYW4gRXZlbnREZWxlZ2F0b3JcbiAgICAgICAgICAgIHZhciBkZWxlZ2F0b3JzID0gZG9tU291cmNlLl9kZWxlZ2F0b3JzO1xuICAgICAgICAgICAgdmFyIG9yaWdpbiA9IGRvbVNvdXJjZS5faXNvbGF0ZU1vZHVsZS5nZXRFbGVtZW50KGZ1bGxTY29wZSkgfHwgcm9vdEVsZW1lbnQ7XG4gICAgICAgICAgICB2YXIgZGVsZWdhdG9yO1xuICAgICAgICAgICAgaWYgKGRlbGVnYXRvcnMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBkZWxlZ2F0b3IgPSBkZWxlZ2F0b3JzLmdldChrZXkpO1xuICAgICAgICAgICAgICAgIGRlbGVnYXRvci51cGRhdGVPcmlnaW4ob3JpZ2luKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRlbGVnYXRvciA9IG5ldyBFdmVudERlbGVnYXRvcl8xLkV2ZW50RGVsZWdhdG9yKG9yaWdpbiwgZXZlbnRUeXBlLCB1c2VDYXB0dXJlLCBkb21Tb3VyY2UuX2lzb2xhdGVNb2R1bGUsIG9wdGlvbnMucHJldmVudERlZmF1bHQpO1xuICAgICAgICAgICAgICAgIGRlbGVnYXRvcnMuc2V0KGtleSwgZGVsZWdhdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmdWxsU2NvcGUpIHtcbiAgICAgICAgICAgICAgICBkb21Tb3VyY2UuX2lzb2xhdGVNb2R1bGUuYWRkRXZlbnREZWxlZ2F0b3IoZnVsbFNjb3BlLCBkZWxlZ2F0b3IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHN1YmplY3QgPSBkZWxlZ2F0b3IuY3JlYXRlRGVzdGluYXRpb24obmFtZXNwYWNlKTtcbiAgICAgICAgICAgIHJldHVybiBzdWJqZWN0O1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmZsYXR0ZW4oKTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoZXZlbnQkKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gZG9tU291cmNlLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fc2FuaXRhdGlvbiQuc2hhbWVmdWxseVNlbmROZXh0KG51bGwpO1xuICAgICAgICB0aGlzLl9pc29sYXRlTW9kdWxlLnJlc2V0KCk7XG4gICAgfTtcbiAgICByZXR1cm4gTWFpbkRPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLk1haW5ET01Tb3VyY2UgPSBNYWluRE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TWFpbkRPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTY29wZUNoZWNrZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2NvcGVDaGVja2VyKGZ1bGxTY29wZSwgaXNvbGF0ZU1vZHVsZSkge1xuICAgICAgICB0aGlzLmZ1bGxTY29wZSA9IGZ1bGxTY29wZTtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlID0gaXNvbGF0ZU1vZHVsZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGVsZW1lbnQgaXMgKmRpcmVjdGx5KiBpbiB0aGUgc2NvcGUgb2YgdGhpc1xuICAgICAqIHNjb3BlIGNoZWNrZXIuIEJlaW5nIGNvbnRhaW5lZCAqaW5kaXJlY3RseSogdGhyb3VnaCBvdGhlciBzY29wZXNcbiAgICAgKiBpcyBub3QgdmFsaWQuIFRoaXMgaXMgY3J1Y2lhbCBmb3IgaW1wbGVtZW50aW5nIHBhcmVudC1jaGlsZCBpc29sYXRpb24sXG4gICAgICogc28gdGhhdCB0aGUgcGFyZW50IHNlbGVjdG9ycyBkb24ndCBzZWFyY2ggaW5zaWRlIGEgY2hpbGQgc2NvcGUuXG4gICAgICovXG4gICAgU2NvcGVDaGVja2VyLnByb3RvdHlwZS5pc0RpcmVjdGx5SW5TY29wZSA9IGZ1bmN0aW9uIChsZWFmKSB7XG4gICAgICAgIGZvciAodmFyIGVsID0gbGVhZjsgZWw7IGVsID0gZWwucGFyZW50RWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIGZ1bGxTY29wZSA9IHRoaXMuaXNvbGF0ZU1vZHVsZS5nZXRGdWxsU2NvcGUoZWwpO1xuICAgICAgICAgICAgaWYgKGZ1bGxTY29wZSAmJiBmdWxsU2NvcGUgIT09IHRoaXMuZnVsbFNjb3BlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZ1bGxTY29wZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgcmV0dXJuIFNjb3BlQ2hlY2tlcjtcbn0oKSk7XG5leHBvcnRzLlNjb3BlQ2hlY2tlciA9IFNjb3BlQ2hlY2tlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNjb3BlQ2hlY2tlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL3Zub2RlXCIpO1xudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xudmFyIHNuYWJiZG9tX3NlbGVjdG9yXzEgPSByZXF1aXJlKFwic25hYmJkb20tc2VsZWN0b3JcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIFZOb2RlV3JhcHBlciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWTm9kZVdyYXBwZXIocm9vdEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IHJvb3RFbGVtZW50O1xuICAgIH1cbiAgICBWTm9kZVdyYXBwZXIucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAodm5vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzXzEuaXNEb2NGcmFnKHRoaXMucm9vdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53cmFwRG9jRnJhZyh2bm9kZSA9PT0gbnVsbCA/IFtdIDogW3Zub2RlXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZub2RlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53cmFwKFtdKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgX2EgPSBzbmFiYmRvbV9zZWxlY3Rvcl8xLnNlbGVjdG9yUGFyc2VyKHZub2RlKSwgc2VsVGFnTmFtZSA9IF9hLnRhZ05hbWUsIHNlbElkID0gX2EuaWQ7XG4gICAgICAgIHZhciB2Tm9kZUNsYXNzTmFtZSA9IHNuYWJiZG9tX3NlbGVjdG9yXzEuY2xhc3NOYW1lRnJvbVZOb2RlKHZub2RlKTtcbiAgICAgICAgdmFyIHZOb2RlRGF0YSA9IHZub2RlLmRhdGEgfHwge307XG4gICAgICAgIHZhciB2Tm9kZURhdGFQcm9wcyA9IHZOb2RlRGF0YS5wcm9wcyB8fCB7fTtcbiAgICAgICAgdmFyIF9iID0gdk5vZGVEYXRhUHJvcHMuaWQsIHZOb2RlSWQgPSBfYiA9PT0gdm9pZCAwID8gc2VsSWQgOiBfYjtcbiAgICAgICAgdmFyIGlzVk5vZGVBbmRSb290RWxlbWVudElkZW50aWNhbCA9IHR5cGVvZiB2Tm9kZUlkID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgdk5vZGVJZC50b1VwcGVyQ2FzZSgpID09PSB0aGlzLnJvb3RFbGVtZW50LmlkLnRvVXBwZXJDYXNlKCkgJiZcbiAgICAgICAgICAgIHNlbFRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gdGhpcy5yb290RWxlbWVudC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgJiZcbiAgICAgICAgICAgIHZOb2RlQ2xhc3NOYW1lLnRvVXBwZXJDYXNlKCkgPT09IHRoaXMucm9vdEVsZW1lbnQuY2xhc3NOYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGlmIChpc1ZOb2RlQW5kUm9vdEVsZW1lbnRJZGVudGljYWwpIHtcbiAgICAgICAgICAgIHJldHVybiB2bm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy53cmFwKFt2bm9kZV0pO1xuICAgIH07XG4gICAgVk5vZGVXcmFwcGVyLnByb3RvdHlwZS53cmFwRG9jRnJhZyA9IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgICAgICByZXR1cm4gdm5vZGVfMS52bm9kZSgnJywge30sIGNoaWxkcmVuLCB1bmRlZmluZWQsIHRoaXMucm9vdEVsZW1lbnQpO1xuICAgIH07XG4gICAgVk5vZGVXcmFwcGVyLnByb3RvdHlwZS53cmFwID0gZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgICAgIHZhciBfYSA9IHRoaXMucm9vdEVsZW1lbnQsIHRhZ05hbWUgPSBfYS50YWdOYW1lLCBpZCA9IF9hLmlkLCBjbGFzc05hbWUgPSBfYS5jbGFzc05hbWU7XG4gICAgICAgIHZhciBzZWxJZCA9IGlkID8gXCIjXCIgKyBpZCA6ICcnO1xuICAgICAgICB2YXIgc2VsQ2xhc3MgPSBjbGFzc05hbWUgPyBcIi5cIiArIGNsYXNzTmFtZS5zcGxpdChcIiBcIikuam9pbihcIi5cIikgOiAnJztcbiAgICAgICAgcmV0dXJuIGhfMS5oKFwiXCIgKyB0YWdOYW1lLnRvTG93ZXJDYXNlKCkgKyBzZWxJZCArIHNlbENsYXNzLCB7fSwgY2hpbGRyZW4pO1xuICAgIH07XG4gICAgcmV0dXJuIFZOb2RlV3JhcHBlcjtcbn0oKSk7XG5leHBvcnRzLlZOb2RlV3JhcHBlciA9IFZOb2RlV3JhcHBlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVZOb2RlV3JhcHBlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbmZ1bmN0aW9uIGZyb21FdmVudChlbGVtZW50LCBldmVudE5hbWUsIHVzZUNhcHR1cmUsIHByZXZlbnREZWZhdWx0KSB7XG4gICAgaWYgKHVzZUNhcHR1cmUgPT09IHZvaWQgMCkgeyB1c2VDYXB0dXJlID0gZmFsc2U7IH1cbiAgICBpZiAocHJldmVudERlZmF1bHQgPT09IHZvaWQgMCkgeyBwcmV2ZW50RGVmYXVsdCA9IGZhbHNlOyB9XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5TdHJlYW0uY3JlYXRlKHtcbiAgICAgICAgZWxlbWVudDogZWxlbWVudCxcbiAgICAgICAgbmV4dDogbnVsbCxcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIHN0YXJ0KGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5leHQgPSBmdW5jdGlvbiBuZXh0KGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHByZXZlbnREZWZhdWx0Q29uZGl0aW9uYWwoZXZlbnQsIHByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubmV4dChldmVudCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMubmV4dCA9IGZ1bmN0aW9uIG5leHQoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubmV4dChldmVudCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgdGhpcy5uZXh0LCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgdGhpcy5uZXh0LCB1c2VDYXB0dXJlKTtcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cbmV4cG9ydHMuZnJvbUV2ZW50ID0gZnJvbUV2ZW50O1xuZnVuY3Rpb24gbWF0Y2hPYmplY3QobWF0Y2hlciwgb2JqKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtYXRjaGVyKTtcbiAgICB2YXIgbiA9IGtleXMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHZhciBrID0ga2V5c1tpXTtcbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyW2tdID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqW2tdID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKCFtYXRjaE9iamVjdChtYXRjaGVyW2tdLCBvYmpba10pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG1hdGNoZXJba10gIT09IG9ialtrXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gcHJldmVudERlZmF1bHRDb25kaXRpb25hbChldmVudCwgcHJldmVudERlZmF1bHQpIHtcbiAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcmV2ZW50RGVmYXVsdCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHR5cGVvZiBwcmV2ZW50RGVmYXVsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KGV2ZW50KSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHByZXZlbnREZWZhdWx0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKG1hdGNoT2JqZWN0KHByZXZlbnREZWZhdWx0LCBldmVudCkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcmV2ZW50RGVmYXVsdCBoYXMgdG8gYmUgZWl0aGVyIGEgYm9vbGVhbiwgcHJlZGljYXRlIGZ1bmN0aW9uIG9yIG9iamVjdCcpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5wcmV2ZW50RGVmYXVsdENvbmRpdGlvbmFsID0gcHJldmVudERlZmF1bHRDb25kaXRpb25hbDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZyb21FdmVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8vIHRzbGludDpkaXNhYmxlOm1heC1maWxlLWxpbmUtY291bnRcbnZhciBoXzEgPSByZXF1aXJlKFwic25hYmJkb20vaFwiKTtcbmZ1bmN0aW9uIGlzVmFsaWRTdHJpbmcocGFyYW0pIHtcbiAgICByZXR1cm4gdHlwZW9mIHBhcmFtID09PSAnc3RyaW5nJyAmJiBwYXJhbS5sZW5ndGggPiAwO1xufVxuZnVuY3Rpb24gaXNTZWxlY3RvcihwYXJhbSkge1xuICAgIHJldHVybiBpc1ZhbGlkU3RyaW5nKHBhcmFtKSAmJiAocGFyYW1bMF0gPT09ICcuJyB8fCBwYXJhbVswXSA9PT0gJyMnKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRhZ0Z1bmN0aW9uKHRhZ05hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaHlwZXJzY3JpcHQoYSwgYiwgYykge1xuICAgICAgICB2YXIgaGFzQSA9IHR5cGVvZiBhICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgdmFyIGhhc0IgPSB0eXBlb2YgYiAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIHZhciBoYXNDID0gdHlwZW9mIGMgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICBpZiAoaXNTZWxlY3RvcihhKSkge1xuICAgICAgICAgICAgaWYgKGhhc0IgJiYgaGFzQykge1xuICAgICAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwgYiwgYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChoYXNCKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCBiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGhhc0MpIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwgYiwgYyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaGFzQikge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUsIGEsIGIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGhhc0EpIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lLCBhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lLCB7fSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxudmFyIFNWR19UQUdfTkFNRVMgPSBbXG4gICAgJ2EnLFxuICAgICdhbHRHbHlwaCcsXG4gICAgJ2FsdEdseXBoRGVmJyxcbiAgICAnYWx0R2x5cGhJdGVtJyxcbiAgICAnYW5pbWF0ZScsXG4gICAgJ2FuaW1hdGVDb2xvcicsXG4gICAgJ2FuaW1hdGVNb3Rpb24nLFxuICAgICdhbmltYXRlVHJhbnNmb3JtJyxcbiAgICAnY2lyY2xlJyxcbiAgICAnY2xpcFBhdGgnLFxuICAgICdjb2xvclByb2ZpbGUnLFxuICAgICdjdXJzb3InLFxuICAgICdkZWZzJyxcbiAgICAnZGVzYycsXG4gICAgJ2VsbGlwc2UnLFxuICAgICdmZUJsZW5kJyxcbiAgICAnZmVDb2xvck1hdHJpeCcsXG4gICAgJ2ZlQ29tcG9uZW50VHJhbnNmZXInLFxuICAgICdmZUNvbXBvc2l0ZScsXG4gICAgJ2ZlQ29udm9sdmVNYXRyaXgnLFxuICAgICdmZURpZmZ1c2VMaWdodGluZycsXG4gICAgJ2ZlRGlzcGxhY2VtZW50TWFwJyxcbiAgICAnZmVEaXN0YW50TGlnaHQnLFxuICAgICdmZUZsb29kJyxcbiAgICAnZmVGdW5jQScsXG4gICAgJ2ZlRnVuY0InLFxuICAgICdmZUZ1bmNHJyxcbiAgICAnZmVGdW5jUicsXG4gICAgJ2ZlR2F1c3NpYW5CbHVyJyxcbiAgICAnZmVJbWFnZScsXG4gICAgJ2ZlTWVyZ2UnLFxuICAgICdmZU1lcmdlTm9kZScsXG4gICAgJ2ZlTW9ycGhvbG9neScsXG4gICAgJ2ZlT2Zmc2V0JyxcbiAgICAnZmVQb2ludExpZ2h0JyxcbiAgICAnZmVTcGVjdWxhckxpZ2h0aW5nJyxcbiAgICAnZmVTcG90bGlnaHQnLFxuICAgICdmZVRpbGUnLFxuICAgICdmZVR1cmJ1bGVuY2UnLFxuICAgICdmaWx0ZXInLFxuICAgICdmb250JyxcbiAgICAnZm9udEZhY2UnLFxuICAgICdmb250RmFjZUZvcm1hdCcsXG4gICAgJ2ZvbnRGYWNlTmFtZScsXG4gICAgJ2ZvbnRGYWNlU3JjJyxcbiAgICAnZm9udEZhY2VVcmknLFxuICAgICdmb3JlaWduT2JqZWN0JyxcbiAgICAnZycsXG4gICAgJ2dseXBoJyxcbiAgICAnZ2x5cGhSZWYnLFxuICAgICdoa2VybicsXG4gICAgJ2ltYWdlJyxcbiAgICAnbGluZScsXG4gICAgJ2xpbmVhckdyYWRpZW50JyxcbiAgICAnbWFya2VyJyxcbiAgICAnbWFzaycsXG4gICAgJ21ldGFkYXRhJyxcbiAgICAnbWlzc2luZ0dseXBoJyxcbiAgICAnbXBhdGgnLFxuICAgICdwYXRoJyxcbiAgICAncGF0dGVybicsXG4gICAgJ3BvbHlnb24nLFxuICAgICdwb2x5bGluZScsXG4gICAgJ3JhZGlhbEdyYWRpZW50JyxcbiAgICAncmVjdCcsXG4gICAgJ3NjcmlwdCcsXG4gICAgJ3NldCcsXG4gICAgJ3N0b3AnLFxuICAgICdzdHlsZScsXG4gICAgJ3N3aXRjaCcsXG4gICAgJ3N5bWJvbCcsXG4gICAgJ3RleHQnLFxuICAgICd0ZXh0UGF0aCcsXG4gICAgJ3RpdGxlJyxcbiAgICAndHJlZicsXG4gICAgJ3RzcGFuJyxcbiAgICAndXNlJyxcbiAgICAndmlldycsXG4gICAgJ3ZrZXJuJyxcbl07XG52YXIgc3ZnID0gY3JlYXRlVGFnRnVuY3Rpb24oJ3N2ZycpO1xuU1ZHX1RBR19OQU1FUy5mb3JFYWNoKGZ1bmN0aW9uICh0YWcpIHtcbiAgICBzdmdbdGFnXSA9IGNyZWF0ZVRhZ0Z1bmN0aW9uKHRhZyk7XG59KTtcbnZhciBUQUdfTkFNRVMgPSBbXG4gICAgJ2EnLFxuICAgICdhYmJyJyxcbiAgICAnYWRkcmVzcycsXG4gICAgJ2FyZWEnLFxuICAgICdhcnRpY2xlJyxcbiAgICAnYXNpZGUnLFxuICAgICdhdWRpbycsXG4gICAgJ2InLFxuICAgICdiYXNlJyxcbiAgICAnYmRpJyxcbiAgICAnYmRvJyxcbiAgICAnYmxvY2txdW90ZScsXG4gICAgJ2JvZHknLFxuICAgICdicicsXG4gICAgJ2J1dHRvbicsXG4gICAgJ2NhbnZhcycsXG4gICAgJ2NhcHRpb24nLFxuICAgICdjaXRlJyxcbiAgICAnY29kZScsXG4gICAgJ2NvbCcsXG4gICAgJ2NvbGdyb3VwJyxcbiAgICAnZGQnLFxuICAgICdkZWwnLFxuICAgICdkZXRhaWxzJyxcbiAgICAnZGZuJyxcbiAgICAnZGlyJyxcbiAgICAnZGl2JyxcbiAgICAnZGwnLFxuICAgICdkdCcsXG4gICAgJ2VtJyxcbiAgICAnZW1iZWQnLFxuICAgICdmaWVsZHNldCcsXG4gICAgJ2ZpZ2NhcHRpb24nLFxuICAgICdmaWd1cmUnLFxuICAgICdmb290ZXInLFxuICAgICdmb3JtJyxcbiAgICAnaDEnLFxuICAgICdoMicsXG4gICAgJ2gzJyxcbiAgICAnaDQnLFxuICAgICdoNScsXG4gICAgJ2g2JyxcbiAgICAnaGVhZCcsXG4gICAgJ2hlYWRlcicsXG4gICAgJ2hncm91cCcsXG4gICAgJ2hyJyxcbiAgICAnaHRtbCcsXG4gICAgJ2knLFxuICAgICdpZnJhbWUnLFxuICAgICdpbWcnLFxuICAgICdpbnB1dCcsXG4gICAgJ2lucycsXG4gICAgJ2tiZCcsXG4gICAgJ2tleWdlbicsXG4gICAgJ2xhYmVsJyxcbiAgICAnbGVnZW5kJyxcbiAgICAnbGknLFxuICAgICdsaW5rJyxcbiAgICAnbWFpbicsXG4gICAgJ21hcCcsXG4gICAgJ21hcmsnLFxuICAgICdtZW51JyxcbiAgICAnbWV0YScsXG4gICAgJ25hdicsXG4gICAgJ25vc2NyaXB0JyxcbiAgICAnb2JqZWN0JyxcbiAgICAnb2wnLFxuICAgICdvcHRncm91cCcsXG4gICAgJ29wdGlvbicsXG4gICAgJ3AnLFxuICAgICdwYXJhbScsXG4gICAgJ3ByZScsXG4gICAgJ3Byb2dyZXNzJyxcbiAgICAncScsXG4gICAgJ3JwJyxcbiAgICAncnQnLFxuICAgICdydWJ5JyxcbiAgICAncycsXG4gICAgJ3NhbXAnLFxuICAgICdzY3JpcHQnLFxuICAgICdzZWN0aW9uJyxcbiAgICAnc2VsZWN0JyxcbiAgICAnc21hbGwnLFxuICAgICdzb3VyY2UnLFxuICAgICdzcGFuJyxcbiAgICAnc3Ryb25nJyxcbiAgICAnc3R5bGUnLFxuICAgICdzdWInLFxuICAgICdzdW1tYXJ5JyxcbiAgICAnc3VwJyxcbiAgICAndGFibGUnLFxuICAgICd0Ym9keScsXG4gICAgJ3RkJyxcbiAgICAndGV4dGFyZWEnLFxuICAgICd0Zm9vdCcsXG4gICAgJ3RoJyxcbiAgICAndGhlYWQnLFxuICAgICd0aW1lJyxcbiAgICAndGl0bGUnLFxuICAgICd0cicsXG4gICAgJ3UnLFxuICAgICd1bCcsXG4gICAgJ3ZpZGVvJyxcbl07XG52YXIgZXhwb3J0ZWQgPSB7XG4gICAgU1ZHX1RBR19OQU1FUzogU1ZHX1RBR19OQU1FUyxcbiAgICBUQUdfTkFNRVM6IFRBR19OQU1FUyxcbiAgICBzdmc6IHN2ZyxcbiAgICBpc1NlbGVjdG9yOiBpc1NlbGVjdG9yLFxuICAgIGNyZWF0ZVRhZ0Z1bmN0aW9uOiBjcmVhdGVUYWdGdW5jdGlvbixcbn07XG5UQUdfTkFNRVMuZm9yRWFjaChmdW5jdGlvbiAobikge1xuICAgIGV4cG9ydGVkW25dID0gY3JlYXRlVGFnRnVuY3Rpb24obik7XG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydGVkO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aHlwZXJzY3JpcHQtaGVscGVycy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0aHVua18xID0gcmVxdWlyZShcIi4vdGh1bmtcIik7XG5leHBvcnRzLnRodW5rID0gdGh1bmtfMS50aHVuaztcbnZhciBNYWluRE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9NYWluRE9NU291cmNlXCIpO1xuZXhwb3J0cy5NYWluRE9NU291cmNlID0gTWFpbkRPTVNvdXJjZV8xLk1haW5ET01Tb3VyY2U7XG4vKipcbiAqIEEgZmFjdG9yeSBmb3IgdGhlIERPTSBkcml2ZXIgZnVuY3Rpb24uXG4gKlxuICogVGFrZXMgYSBgY29udGFpbmVyYCB0byBkZWZpbmUgdGhlIHRhcmdldCBvbiB0aGUgZXhpc3RpbmcgRE9NIHdoaWNoIHRoaXNcbiAqIGRyaXZlciB3aWxsIG9wZXJhdGUgb24sIGFuZCBhbiBgb3B0aW9uc2Agb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuIFRoZVxuICogaW5wdXQgdG8gdGhpcyBkcml2ZXIgaXMgYSBzdHJlYW0gb2YgdmlydHVhbCBET00gb2JqZWN0cywgb3IgaW4gb3RoZXIgd29yZHMsXG4gKiBTbmFiYmRvbSBcIlZOb2RlXCIgb2JqZWN0cy4gVGhlIG91dHB1dCBvZiB0aGlzIGRyaXZlciBpcyBhIFwiRE9NU291cmNlXCI6IGFcbiAqIGNvbGxlY3Rpb24gb2YgT2JzZXJ2YWJsZXMgcXVlcmllZCB3aXRoIHRoZSBtZXRob2RzIGBzZWxlY3QoKWAgYW5kIGBldmVudHMoKWAuXG4gKlxuICogKipgRE9NU291cmNlLnNlbGVjdChzZWxlY3RvcilgKiogcmV0dXJucyBhIG5ldyBET01Tb3VyY2Ugd2l0aCBzY29wZVxuICogcmVzdHJpY3RlZCB0byB0aGUgZWxlbWVudChzKSB0aGF0IG1hdGNoZXMgdGhlIENTUyBgc2VsZWN0b3JgIGdpdmVuLiBUbyBzZWxlY3RcbiAqIHRoZSBwYWdlJ3MgYGRvY3VtZW50YCwgdXNlIGAuc2VsZWN0KCdkb2N1bWVudCcpYC4gVG8gc2VsZWN0IHRoZSBjb250YWluZXJcbiAqIGVsZW1lbnQgZm9yIHRoaXMgYXBwLCB1c2UgYC5zZWxlY3QoJzpyb290JylgLlxuICpcbiAqICoqYERPTVNvdXJjZS5ldmVudHMoZXZlbnRUeXBlLCBvcHRpb25zKWAqKiByZXR1cm5zIGEgc3RyZWFtIG9mIGV2ZW50cyBvZlxuICogYGV2ZW50VHlwZWAgaGFwcGVuaW5nIG9uIHRoZSBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBjdXJyZW50IERPTVNvdXJjZS4gVGhlXG4gKiBldmVudCBvYmplY3QgY29udGFpbnMgdGhlIGBvd25lclRhcmdldGAgcHJvcGVydHkgdGhhdCBiZWhhdmVzIGV4YWN0bHkgbGlrZVxuICogYGN1cnJlbnRUYXJnZXRgLiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgc29tZSBicm93c2VycyBkb2Vzbid0IGFsbG93XG4gKiBgY3VycmVudFRhcmdldGAgcHJvcGVydHkgdG8gYmUgbXV0YXRlZCwgaGVuY2UgYSBuZXcgcHJvcGVydHkgaXMgY3JlYXRlZC4gVGhlXG4gKiByZXR1cm5lZCBzdHJlYW0gaXMgYW4gKnhzdHJlYW0qIFN0cmVhbSBpZiB5b3UgdXNlIGBAY3ljbGUveHN0cmVhbS1ydW5gIHRvIHJ1blxuICogeW91ciBhcHAgd2l0aCB0aGlzIGRyaXZlciwgb3IgaXQgaXMgYW4gUnhKUyBPYnNlcnZhYmxlIGlmIHlvdSB1c2VcbiAqIGBAY3ljbGUvcnhqcy1ydW5gLCBhbmQgc28gZm9ydGguXG4gKlxuICogKipvcHRpb25zIGZvciBET01Tb3VyY2UuZXZlbnRzKipcbiAqXG4gKiBUaGUgYG9wdGlvbnNgIHBhcmFtZXRlciBvbiBgRE9NU291cmNlLmV2ZW50cyhldmVudFR5cGUsIG9wdGlvbnMpYCBpcyBhblxuICogKG9wdGlvbmFsKSBvYmplY3Qgd2l0aCB0d28gb3B0aW9uYWwgZmllbGRzOiBgdXNlQ2FwdHVyZWAgYW5kXG4gKiBgcHJldmVudERlZmF1bHRgLlxuICpcbiAqIGB1c2VDYXB0dXJlYCBpcyBieSBkZWZhdWx0IGBmYWxzZWAsIGV4Y2VwdCBpdCBpcyBgdHJ1ZWAgZm9yIGV2ZW50IHR5cGVzIHRoYXRcbiAqIGRvIG5vdCBidWJibGUuIFJlYWQgbW9yZSBoZXJlXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRXZlbnRUYXJnZXQvYWRkRXZlbnRMaXN0ZW5lclxuICogYWJvdXQgdGhlIGB1c2VDYXB0dXJlYCBhbmQgaXRzIHB1cnBvc2UuXG4gKlxuICogYHByZXZlbnREZWZhdWx0YCBpcyBieSBkZWZhdWx0IGBmYWxzZWAsIGFuZCBpbmRpY2F0ZXMgdG8gdGhlIGRyaXZlciB3aGV0aGVyXG4gKiBgZXZlbnQucHJldmVudERlZmF1bHQoKWAgc2hvdWxkIGJlIGludm9rZWQuIFRoaXMgb3B0aW9uIGNhbiBiZSBjb25maWd1cmVkIGluXG4gKiB0aHJlZSB3YXlzOlxuICpcbiAqIC0gYHtwcmV2ZW50RGVmYXVsdDogYm9vbGVhbn1gIHRvIGludm9rZSBwcmV2ZW50RGVmYXVsdCBpZiBgdHJ1ZWAsIGFuZCBub3RcbiAqIGludm9rZSBvdGhlcndpc2UuXG4gKiAtIGB7cHJldmVudERlZmF1bHQ6IChldjogRXZlbnQpID0+IGJvb2xlYW59YCBmb3IgY29uZGl0aW9uYWwgaW52b2NhdGlvbi5cbiAqIC0gYHtwcmV2ZW50RGVmYXVsdDogTmVzdGVkT2JqZWN0fWAgdXNlcyBhbiBvYmplY3QgdG8gYmUgcmVjdXJzaXZlbHkgY29tcGFyZWRcbiAqIHRvIHRoZSBgRXZlbnRgIG9iamVjdC4gYHByZXZlbnREZWZhdWx0YCBpcyBpbnZva2VkIHdoZW4gYWxsIHByb3BlcnRpZXMgb24gdGhlXG4gKiBuZXN0ZWQgb2JqZWN0IG1hdGNoIHdpdGggdGhlIHByb3BlcnRpZXMgb24gdGhlIGV2ZW50IG9iamVjdC5cbiAqXG4gKiBIZXJlIGFyZSBzb21lIGV4YW1wbGVzOlxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gYWx3YXlzIHByZXZlbnQgZGVmYXVsdFxuICogRE9NU291cmNlLnNlbGVjdCgnaW5wdXQnKS5ldmVudHMoJ2tleWRvd24nLCB7XG4gKiAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gKiB9KVxuICpcbiAqIC8vIHByZXZlbnQgZGVmYXVsdCBvbmx5IHdoZW4gYEVOVEVSYCBpcyBwcmVzc2VkXG4gKiBET01Tb3VyY2Uuc2VsZWN0KCdpbnB1dCcpLmV2ZW50cygna2V5ZG93bicsIHtcbiAqICAgcHJldmVudERlZmF1bHQ6IGUgPT4gZS5rZXlDb2RlID09PSAxM1xuICogfSlcbiAqXG4gKiAvLyBwcmV2ZW50IGRlZnVhbHQgd2hlbiBgRU5URVJgIGlzIHByZXNzZWQgQU5EIHRhcmdldC52YWx1ZSBpcyAnSEVMTE8nXG4gKiBET01Tb3VyY2Uuc2VsZWN0KCdpbnB1dCcpLmV2ZW50cygna2V5ZG93bicsIHtcbiAqICAgcHJldmVudERlZmF1bHQ6IHsga2V5Q29kZTogMTMsIG93bmVyVGFyZ2V0OiB7IHZhbHVlOiAnSEVMTE8nIH0gfVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiAqKmBET01Tb3VyY2UuZWxlbWVudHMoKWAqKiByZXR1cm5zIGEgc3RyZWFtIG9mIGFycmF5cyBjb250YWluaW5nIHRoZSBET01cbiAqIGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlIHNlbGVjdG9ycyBpbiB0aGUgRE9NU291cmNlIChlLmcuIGZyb20gcHJldmlvdXNcbiAqIGBzZWxlY3QoeClgIGNhbGxzKS5cbiAqXG4gKiAqKmBET01Tb3VyY2UuZWxlbWVudCgpYCoqIHJldHVybnMgYSBzdHJlYW0gb2YgRE9NIGVsZW1lbnRzLiBOb3RpY2UgdGhhdCB0aGlzXG4gKiBpcyB0aGUgc2luZ3VsYXIgdmVyc2lvbiBvZiBgLmVsZW1lbnRzKClgLCBzbyB0aGUgc3RyZWFtIHdpbGwgZW1pdCBhbiBlbGVtZW50LFxuICogbm90IGFuIGFycmF5LiBJZiB0aGVyZSBpcyBubyBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgc2VsZWN0ZWQgRE9NU291cmNlLFxuICogdGhlbiB0aGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgbm90IGVtaXQgYW55dGhpbmcuXG4gKlxuICogQHBhcmFtIHsoU3RyaW5nfEhUTUxFbGVtZW50KX0gY29udGFpbmVyIHRoZSBET00gc2VsZWN0b3IgZm9yIHRoZSBlbGVtZW50XG4gKiAob3IgdGhlIGVsZW1lbnQgaXRzZWxmKSB0byBjb250YWluIHRoZSByZW5kZXJpbmcgb2YgdGhlIFZUcmVlcy5cbiAqIEBwYXJhbSB7RE9NRHJpdmVyT3B0aW9uc30gb3B0aW9ucyBhbiBvYmplY3Qgd2l0aCB0d28gb3B0aW9uYWwgcHJvcGVydGllczpcbiAqXG4gKiAgIC0gYG1vZHVsZXM6IGFycmF5YCBvdmVycmlkZXMgYEBjeWNsZS9kb21gJ3MgZGVmYXVsdCBTbmFiYmRvbSBtb2R1bGVzIGFzXG4gKiAgICAgYXMgZGVmaW5lZCBpbiBbYHNyYy9tb2R1bGVzLnRzYF0oLi9zcmMvbW9kdWxlcy50cykuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGhlIERPTSBkcml2ZXIgZnVuY3Rpb24uIFRoZSBmdW5jdGlvbiBleHBlY3RzIGEgc3RyZWFtIG9mXG4gKiBWTm9kZSBhcyBpbnB1dCwgYW5kIG91dHB1dHMgdGhlIERPTVNvdXJjZSBvYmplY3QuXG4gKiBAZnVuY3Rpb24gbWFrZURPTURyaXZlclxuICovXG52YXIgbWFrZURPTURyaXZlcl8xID0gcmVxdWlyZShcIi4vbWFrZURPTURyaXZlclwiKTtcbmV4cG9ydHMubWFrZURPTURyaXZlciA9IG1ha2VET01Ecml2ZXJfMS5tYWtlRE9NRHJpdmVyO1xuLyoqXG4gKiBBIGZhY3RvcnkgZnVuY3Rpb24gdG8gY3JlYXRlIG1vY2tlZCBET01Tb3VyY2Ugb2JqZWN0cywgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gKlxuICogVGFrZXMgYSBgbW9ja0NvbmZpZ2Agb2JqZWN0IGFzIGFyZ3VtZW50LCBhbmQgcmV0dXJuc1xuICogYSBET01Tb3VyY2UgdGhhdCBjYW4gYmUgZ2l2ZW4gdG8gYW55IEN5Y2xlLmpzIGFwcCB0aGF0IGV4cGVjdHMgYSBET01Tb3VyY2UgaW5cbiAqIHRoZSBzb3VyY2VzLCBmb3IgdGVzdGluZy5cbiAqXG4gKiBUaGUgYG1vY2tDb25maWdgIHBhcmFtZXRlciBpcyBhbiBvYmplY3Qgc3BlY2lmeWluZyBzZWxlY3RvcnMsIGV2ZW50VHlwZXMgYW5kXG4gKiB0aGVpciBzdHJlYW1zLiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBkb21Tb3VyY2UgPSBtb2NrRE9NU291cmNlKHtcbiAqICAgJy5mb28nOiB7XG4gKiAgICAgJ2NsaWNrJzogeHMub2Yoe3RhcmdldDoge319KSxcbiAqICAgICAnbW91c2VvdmVyJzogeHMub2Yoe3RhcmdldDoge319KSxcbiAqICAgfSxcbiAqICAgJy5iYXInOiB7XG4gKiAgICAgJ3Njcm9sbCc6IHhzLm9mKHt0YXJnZXQ6IHt9fSksXG4gKiAgICAgZWxlbWVudHM6IHhzLm9mKHt0YWdOYW1lOiAnZGl2J30pLFxuICogICB9XG4gKiB9KTtcbiAqXG4gKiAvLyBVc2FnZVxuICogY29uc3QgY2xpY2skID0gZG9tU291cmNlLnNlbGVjdCgnLmZvbycpLmV2ZW50cygnY2xpY2snKTtcbiAqIGNvbnN0IGVsZW1lbnQkID0gZG9tU291cmNlLnNlbGVjdCgnLmJhcicpLmVsZW1lbnRzKCk7XG4gKiBgYGBcbiAqXG4gKiBUaGUgbW9ja2VkIERPTSBTb3VyY2Ugc3VwcG9ydHMgaXNvbGF0aW9uLiBJdCBoYXMgdGhlIGZ1bmN0aW9ucyBgaXNvbGF0ZVNpbmtgXG4gKiBhbmQgYGlzb2xhdGVTb3VyY2VgIGF0dGFjaGVkIHRvIGl0LCBhbmQgcGVyZm9ybXMgc2ltcGxlIGlzb2xhdGlvbiB1c2luZ1xuICogY2xhc3NOYW1lcy4gKmlzb2xhdGVTaW5rKiB3aXRoIHNjb3BlIGBmb29gIHdpbGwgYXBwZW5kIHRoZSBjbGFzcyBgX19fZm9vYCB0b1xuICogdGhlIHN0cmVhbSBvZiB2aXJ0dWFsIERPTSBub2RlcywgYW5kICppc29sYXRlU291cmNlKiB3aXRoIHNjb3BlIGBmb29gIHdpbGxcbiAqIHBlcmZvcm0gYSBjb252ZW50aW9uYWwgYG1vY2tlZERPTVNvdXJjZS5zZWxlY3QoJy5fX2ZvbycpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtb2NrQ29uZmlnIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBzZWxlY3RvciBzdHJpbmdzXG4gKiBhbmQgdmFsdWVzIGFyZSBvYmplY3RzLiBUaG9zZSBuZXN0ZWQgb2JqZWN0cyBoYXZlIGBldmVudFR5cGVgIHN0cmluZ3MgYXMga2V5c1xuICogYW5kIHZhbHVlcyBhcmUgc3RyZWFtcyB5b3UgY3JlYXRlZC5cbiAqIEByZXR1cm4ge09iamVjdH0gZmFrZSBET00gc291cmNlIG9iamVjdCwgd2l0aCBhbiBBUEkgY29udGFpbmluZyBgc2VsZWN0KClgXG4gKiBhbmQgYGV2ZW50cygpYCBhbmQgYGVsZW1lbnRzKClgIHdoaWNoIGNhbiBiZSB1c2VkIGp1c3QgbGlrZSB0aGUgRE9NIERyaXZlcidzXG4gKiBET01Tb3VyY2UuXG4gKlxuICogQGZ1bmN0aW9uIG1vY2tET01Tb3VyY2VcbiAqL1xudmFyIG1vY2tET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL21vY2tET01Tb3VyY2VcIik7XG5leHBvcnRzLm1vY2tET01Tb3VyY2UgPSBtb2NrRE9NU291cmNlXzEubW9ja0RPTVNvdXJjZTtcbmV4cG9ydHMuTW9ja2VkRE9NU291cmNlID0gbW9ja0RPTVNvdXJjZV8xLk1vY2tlZERPTVNvdXJjZTtcbi8qKlxuICogVGhlIGh5cGVyc2NyaXB0IGZ1bmN0aW9uIGBoKClgIGlzIGEgZnVuY3Rpb24gdG8gY3JlYXRlIHZpcnR1YWwgRE9NIG9iamVjdHMsXG4gKiBhbHNvIGtub3duIGFzIFZOb2Rlcy4gQ2FsbFxuICpcbiAqIGBgYGpzXG4gKiBoKCdkaXYubXlDbGFzcycsIHtzdHlsZToge2NvbG9yOiAncmVkJ319LCBbXSlcbiAqIGBgYFxuICpcbiAqIHRvIGNyZWF0ZSBhIFZOb2RlIHRoYXQgcmVwcmVzZW50cyBhIGBESVZgIGVsZW1lbnQgd2l0aCBjbGFzc05hbWUgYG15Q2xhc3NgLFxuICogc3R5bGVkIHdpdGggcmVkIGNvbG9yLCBhbmQgbm8gY2hpbGRyZW4gYmVjYXVzZSB0aGUgYFtdYCBhcnJheSB3YXMgcGFzc2VkLiBUaGVcbiAqIEFQSSBpcyBgaCh0YWdPclNlbGVjdG9yLCBvcHRpb25hbERhdGEsIG9wdGlvbmFsQ2hpbGRyZW5PclRleHQpYC5cbiAqXG4gKiBIb3dldmVyLCB1c3VhbGx5IHlvdSBzaG91bGQgdXNlIFwiaHlwZXJzY3JpcHQgaGVscGVyc1wiLCB3aGljaCBhcmUgc2hvcnRjdXRcbiAqIGZ1bmN0aW9ucyBiYXNlZCBvbiBoeXBlcnNjcmlwdC4gVGhlcmUgaXMgb25lIGh5cGVyc2NyaXB0IGhlbHBlciBmdW5jdGlvbiBmb3JcbiAqIGVhY2ggRE9NIHRhZ05hbWUsIHN1Y2ggYXMgYGgxKClgLCBgaDIoKWAsIGBkaXYoKWAsIGBzcGFuKClgLCBgbGFiZWwoKWAsXG4gKiBgaW5wdXQoKWAuIEZvciBpbnN0YW5jZSwgdGhlIHByZXZpb3VzIGV4YW1wbGUgY291bGQgaGF2ZSBiZWVuIHdyaXR0ZW5cbiAqIGFzOlxuICpcbiAqIGBgYGpzXG4gKiBkaXYoJy5teUNsYXNzJywge3N0eWxlOiB7Y29sb3I6ICdyZWQnfX0sIFtdKVxuICogYGBgXG4gKlxuICogVGhlcmUgYXJlIGFsc28gU1ZHIGhlbHBlciBmdW5jdGlvbnMsIHdoaWNoIGFwcGx5IHRoZSBhcHByb3ByaWF0ZSBTVkdcbiAqIG5hbWVzcGFjZSB0byB0aGUgcmVzdWx0aW5nIGVsZW1lbnRzLiBgc3ZnKClgIGZ1bmN0aW9uIGNyZWF0ZXMgdGhlIHRvcC1tb3N0XG4gKiBTVkcgZWxlbWVudCwgYW5kIGBzdmcuZ2AsIGBzdmcucG9seWdvbmAsIGBzdmcuY2lyY2xlYCwgYHN2Zy5wYXRoYCBhcmUgZm9yXG4gKiBTVkctc3BlY2lmaWMgY2hpbGQgZWxlbWVudHMuIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIHN2Zyh7YXR0cnM6IHt3aWR0aDogMTUwLCBoZWlnaHQ6IDE1MH19LCBbXG4gKiAgIHN2Zy5wb2x5Z29uKHtcbiAqICAgICBhdHRyczoge1xuICogICAgICAgY2xhc3M6ICd0cmlhbmdsZScsXG4gKiAgICAgICBwb2ludHM6ICcyMCAwIDIwIDE1MCAxNTAgMjAnXG4gKiAgICAgfVxuICogICB9KVxuICogXSlcbiAqIGBgYFxuICpcbiAqIEBmdW5jdGlvbiBoXG4gKi9cbnZhciBoXzEgPSByZXF1aXJlKFwic25hYmJkb20vaFwiKTtcbmV4cG9ydHMuaCA9IGhfMS5oO1xudmFyIGh5cGVyc2NyaXB0X2hlbHBlcnNfMSA9IHJlcXVpcmUoXCIuL2h5cGVyc2NyaXB0LWhlbHBlcnNcIik7XG5leHBvcnRzLnN2ZyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN2ZztcbmV4cG9ydHMuYSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmE7XG5leHBvcnRzLmFiYnIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hYmJyO1xuZXhwb3J0cy5hZGRyZXNzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYWRkcmVzcztcbmV4cG9ydHMuYXJlYSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFyZWE7XG5leHBvcnRzLmFydGljbGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hcnRpY2xlO1xuZXhwb3J0cy5hc2lkZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFzaWRlO1xuZXhwb3J0cy5hdWRpbyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmF1ZGlvO1xuZXhwb3J0cy5iID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYjtcbmV4cG9ydHMuYmFzZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJhc2U7XG5leHBvcnRzLmJkaSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJkaTtcbmV4cG9ydHMuYmRvID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmRvO1xuZXhwb3J0cy5ibG9ja3F1b3RlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmxvY2txdW90ZTtcbmV4cG9ydHMuYm9keSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJvZHk7XG5leHBvcnRzLmJyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYnI7XG5leHBvcnRzLmJ1dHRvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJ1dHRvbjtcbmV4cG9ydHMuY2FudmFzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY2FudmFzO1xuZXhwb3J0cy5jYXB0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY2FwdGlvbjtcbmV4cG9ydHMuY2l0ZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNpdGU7XG5leHBvcnRzLmNvZGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jb2RlO1xuZXhwb3J0cy5jb2wgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jb2w7XG5leHBvcnRzLmNvbGdyb3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY29sZ3JvdXA7XG5leHBvcnRzLmRkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGQ7XG5leHBvcnRzLmRlbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRlbDtcbmV4cG9ydHMuZGZuID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGZuO1xuZXhwb3J0cy5kaXIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kaXI7XG5leHBvcnRzLmRpdiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRpdjtcbmV4cG9ydHMuZGwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kbDtcbmV4cG9ydHMuZHQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kdDtcbmV4cG9ydHMuZW0gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5lbTtcbmV4cG9ydHMuZW1iZWQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5lbWJlZDtcbmV4cG9ydHMuZmllbGRzZXQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5maWVsZHNldDtcbmV4cG9ydHMuZmlnY2FwdGlvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZpZ2NhcHRpb247XG5leHBvcnRzLmZpZ3VyZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZpZ3VyZTtcbmV4cG9ydHMuZm9vdGVyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZm9vdGVyO1xuZXhwb3J0cy5mb3JtID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZm9ybTtcbmV4cG9ydHMuaDEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oMTtcbmV4cG9ydHMuaDIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oMjtcbmV4cG9ydHMuaDMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oMztcbmV4cG9ydHMuaDQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oNDtcbmV4cG9ydHMuaDUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oNTtcbmV4cG9ydHMuaDYgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oNjtcbmV4cG9ydHMuaGVhZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmhlYWQ7XG5leHBvcnRzLmhlYWRlciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmhlYWRlcjtcbmV4cG9ydHMuaGdyb3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaGdyb3VwO1xuZXhwb3J0cy5ociA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmhyO1xuZXhwb3J0cy5odG1sID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaHRtbDtcbmV4cG9ydHMuaSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmk7XG5leHBvcnRzLmlmcmFtZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmlmcmFtZTtcbmV4cG9ydHMuaW1nID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaW1nO1xuZXhwb3J0cy5pbnB1dCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmlucHV0O1xuZXhwb3J0cy5pbnMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pbnM7XG5leHBvcnRzLmtiZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmtiZDtcbmV4cG9ydHMua2V5Z2VuID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQua2V5Z2VuO1xuZXhwb3J0cy5sYWJlbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmxhYmVsO1xuZXhwb3J0cy5sZWdlbmQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5sZWdlbmQ7XG5leHBvcnRzLmxpID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubGk7XG5leHBvcnRzLmxpbmsgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5saW5rO1xuZXhwb3J0cy5tYWluID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWFpbjtcbmV4cG9ydHMubWFwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWFwO1xuZXhwb3J0cy5tYXJrID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWFyaztcbmV4cG9ydHMubWVudSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1lbnU7XG5leHBvcnRzLm1ldGEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tZXRhO1xuZXhwb3J0cy5uYXYgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5uYXY7XG5leHBvcnRzLm5vc2NyaXB0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubm9zY3JpcHQ7XG5leHBvcnRzLm9iamVjdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9iamVjdDtcbmV4cG9ydHMub2wgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vbDtcbmV4cG9ydHMub3B0Z3JvdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vcHRncm91cDtcbmV4cG9ydHMub3B0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQub3B0aW9uO1xuZXhwb3J0cy5wID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucDtcbmV4cG9ydHMucGFyYW0gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wYXJhbTtcbmV4cG9ydHMucHJlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucHJlO1xuZXhwb3J0cy5wcm9ncmVzcyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnByb2dyZXNzO1xuZXhwb3J0cy5xID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucTtcbmV4cG9ydHMucnAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ycDtcbmV4cG9ydHMucnQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ydDtcbmV4cG9ydHMucnVieSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnJ1Ynk7XG5leHBvcnRzLnMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zO1xuZXhwb3J0cy5zYW1wID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2FtcDtcbmV4cG9ydHMuc2NyaXB0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2NyaXB0O1xuZXhwb3J0cy5zZWN0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2VjdGlvbjtcbmV4cG9ydHMuc2VsZWN0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2VsZWN0O1xuZXhwb3J0cy5zbWFsbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNtYWxsO1xuZXhwb3J0cy5zb3VyY2UgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zb3VyY2U7XG5leHBvcnRzLnNwYW4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zcGFuO1xuZXhwb3J0cy5zdHJvbmcgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdHJvbmc7XG5leHBvcnRzLnN0eWxlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3R5bGU7XG5leHBvcnRzLnN1YiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN1YjtcbmV4cG9ydHMuc3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3VwO1xuZXhwb3J0cy50YWJsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRhYmxlO1xuZXhwb3J0cy50Ym9keSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRib2R5O1xuZXhwb3J0cy50ZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRkO1xuZXhwb3J0cy50ZXh0YXJlYSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRleHRhcmVhO1xuZXhwb3J0cy50Zm9vdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRmb290O1xuZXhwb3J0cy50aCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRoO1xuZXhwb3J0cy50aGVhZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRoZWFkO1xuZXhwb3J0cy50aXRsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRpdGxlO1xuZXhwb3J0cy50ciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRyO1xuZXhwb3J0cy51ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudTtcbmV4cG9ydHMudWwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC51bDtcbmV4cG9ydHMudmlkZW8gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC52aWRlbztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwic25hYmJkb20vdm5vZGVcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuZnVuY3Rpb24gdG90YWxJc29sYXRlU291cmNlKHNvdXJjZSwgc2NvcGUpIHtcbiAgICByZXR1cm4gc291cmNlLnNlbGVjdCh1dGlsc18xLlNDT1BFX1BSRUZJWCArIHNjb3BlKTtcbn1cbmZ1bmN0aW9uIHNpYmxpbmdJc29sYXRlU291cmNlKHNvdXJjZSwgc2NvcGUpIHtcbiAgICByZXR1cm4gc291cmNlLnNlbGVjdChzY29wZSk7XG59XG5mdW5jdGlvbiBpc29sYXRlU291cmNlKHNvdXJjZSwgc2NvcGUpIHtcbiAgICBpZiAoc2NvcGUgPT09ICc6cm9vdCcpIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZTtcbiAgICB9XG4gICAgZWxzZSBpZiAodXRpbHNfMS5pc0NsYXNzT3JJZChzY29wZSkpIHtcbiAgICAgICAgcmV0dXJuIHNpYmxpbmdJc29sYXRlU291cmNlKHNvdXJjZSwgc2NvcGUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRvdGFsSXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKTtcbiAgICB9XG59XG5leHBvcnRzLmlzb2xhdGVTb3VyY2UgPSBpc29sYXRlU291cmNlO1xuZnVuY3Rpb24gc2libGluZ0lzb2xhdGVTaW5rKHNpbmssIHNjb3BlKSB7XG4gICAgcmV0dXJuIHNpbmsubWFwKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIHJldHVybiBub2RlXG4gICAgICAgICAgICA/IHZub2RlXzEudm5vZGUobm9kZS5zZWwgKyBzY29wZSwgbm9kZS5kYXRhLCBub2RlLmNoaWxkcmVuLCBub2RlLnRleHQsIG5vZGUuZWxtKVxuICAgICAgICAgICAgOiBub2RlO1xuICAgIH0pO1xufVxuZXhwb3J0cy5zaWJsaW5nSXNvbGF0ZVNpbmsgPSBzaWJsaW5nSXNvbGF0ZVNpbms7XG5mdW5jdGlvbiB0b3RhbElzb2xhdGVTaW5rKHNpbmssIGZ1bGxTY29wZSkge1xuICAgIHJldHVybiBzaW5rLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgICAgIC8vIElnbm9yZSBpZiBhbHJlYWR5IGhhZCB1cC10by1kYXRlIGZ1bGwgc2NvcGUgaW4gdm5vZGUuZGF0YS5pc29sYXRlXG4gICAgICAgIGlmIChub2RlLmRhdGEgJiYgbm9kZS5kYXRhLmlzb2xhdGUpIHtcbiAgICAgICAgICAgIHZhciBpc29sYXRlRGF0YSA9IG5vZGUuZGF0YS5pc29sYXRlO1xuICAgICAgICAgICAgdmFyIHByZXZGdWxsU2NvcGVOdW0gPSBpc29sYXRlRGF0YS5yZXBsYWNlKC8oY3ljbGV8XFwtKS9nLCAnJyk7XG4gICAgICAgICAgICB2YXIgZnVsbFNjb3BlTnVtID0gZnVsbFNjb3BlLnJlcGxhY2UoLyhjeWNsZXxcXC0pL2csICcnKTtcbiAgICAgICAgICAgIGlmIChpc05hTihwYXJzZUludChwcmV2RnVsbFNjb3BlTnVtKSkgfHxcbiAgICAgICAgICAgICAgICBpc05hTihwYXJzZUludChmdWxsU2NvcGVOdW0pKSB8fFxuICAgICAgICAgICAgICAgIHByZXZGdWxsU2NvcGVOdW0gPiBmdWxsU2NvcGVOdW0pIHtcbiAgICAgICAgICAgICAgICAvLyA+IGlzIGxleGljb2dyYXBoaWMgc3RyaW5nIGNvbXBhcmlzb25cbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBJbnNlcnQgdXAtdG8tZGF0ZSBmdWxsIHNjb3BlIGluIHZub2RlLmRhdGEuaXNvbGF0ZSwgYW5kIGFsc28gYSBrZXkgaWYgbmVlZGVkXG4gICAgICAgIG5vZGUuZGF0YSA9IG5vZGUuZGF0YSB8fCB7fTtcbiAgICAgICAgbm9kZS5kYXRhLmlzb2xhdGUgPSBmdWxsU2NvcGU7XG4gICAgICAgIGlmICh0eXBlb2Ygbm9kZS5rZXkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBub2RlLmtleSA9IHV0aWxzXzEuU0NPUEVfUFJFRklYICsgZnVsbFNjb3BlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH0pO1xufVxuZXhwb3J0cy50b3RhbElzb2xhdGVTaW5rID0gdG90YWxJc29sYXRlU2luaztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWlzb2xhdGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgc25hYmJkb21fMSA9IHJlcXVpcmUoXCJzbmFiYmRvbVwiKTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBjb25jYXRfMSA9IHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2NvbmNhdFwiKTtcbnZhciBzYW1wbGVDb21iaW5lXzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9zYW1wbGVDb21iaW5lXCIpO1xudmFyIE1haW5ET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL01haW5ET01Tb3VyY2VcIik7XG52YXIgdG92bm9kZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL3Rvdm5vZGVcIik7XG52YXIgVk5vZGVXcmFwcGVyXzEgPSByZXF1aXJlKFwiLi9WTm9kZVdyYXBwZXJcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIG1vZHVsZXNfMSA9IHJlcXVpcmUoXCIuL21vZHVsZXNcIik7XG52YXIgSXNvbGF0ZU1vZHVsZV8xID0gcmVxdWlyZShcIi4vSXNvbGF0ZU1vZHVsZVwiKTtcbnJlcXVpcmUoXCJlczYtbWFwL2ltcGxlbWVudFwiKTsgLy8gdHNsaW50OmRpc2FibGUtbGluZVxuZnVuY3Rpb24gbWFrZURPTURyaXZlcklucHV0R3VhcmQobW9kdWxlcykge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShtb2R1bGVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcHRpb25hbCBtb2R1bGVzIG9wdGlvbiBtdXN0IGJlIFwiICsgXCJhbiBhcnJheSBmb3Igc25hYmJkb20gbW9kdWxlc1wiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkb21Ecml2ZXJJbnB1dEd1YXJkKHZpZXckKSB7XG4gICAgaWYgKCF2aWV3JCB8fFxuICAgICAgICB0eXBlb2YgdmlldyQuYWRkTGlzdGVuZXIgIT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICAgICB0eXBlb2YgdmlldyQuZm9sZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBET00gZHJpdmVyIGZ1bmN0aW9uIGV4cGVjdHMgYXMgaW5wdXQgYSBTdHJlYW0gb2YgXCIgK1xuICAgICAgICAgICAgXCJ2aXJ0dWFsIERPTSBlbGVtZW50c1wiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkcm9wQ29tcGxldGlvbihpbnB1dCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbnB1dCwgeHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKSk7XG59XG5mdW5jdGlvbiB1bndyYXBFbGVtZW50RnJvbVZOb2RlKHZub2RlKSB7XG4gICAgcmV0dXJuIHZub2RlLmVsbTtcbn1cbmZ1bmN0aW9uIHJlcG9ydFNuYWJiZG9tRXJyb3IoZXJyKSB7XG4gICAgKGNvbnNvbGUuZXJyb3IgfHwgY29uc29sZS5sb2cpKGVycik7XG59XG5mdW5jdGlvbiBtYWtlRE9NUmVhZHkkKCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoe1xuICAgICAgICBzdGFydDogZnVuY3Rpb24gKGxpcykge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IGRvY3VtZW50LnJlYWR5U3RhdGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJyB8fCBzdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzLm5leHQobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXMuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzLm5leHQobnVsbCk7XG4gICAgICAgICAgICAgICAgbGlzLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIG1ha2VET01Ecml2ZXIoY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgdXRpbHNfMS5jaGVja1ZhbGlkQ29udGFpbmVyKGNvbnRhaW5lcik7XG4gICAgdmFyIG1vZHVsZXMgPSBvcHRpb25zLm1vZHVsZXMgfHwgbW9kdWxlc18xLmRlZmF1bHQ7XG4gICAgbWFrZURPTURyaXZlcklucHV0R3VhcmQobW9kdWxlcyk7XG4gICAgdmFyIGlzb2xhdGVNb2R1bGUgPSBuZXcgSXNvbGF0ZU1vZHVsZV8xLklzb2xhdGVNb2R1bGUoKTtcbiAgICB2YXIgcGF0Y2ggPSBzbmFiYmRvbV8xLmluaXQoW2lzb2xhdGVNb2R1bGUuY3JlYXRlTW9kdWxlKCldLmNvbmNhdChtb2R1bGVzKSk7XG4gICAgdmFyIGRvbVJlYWR5JCA9IG1ha2VET01SZWFkeSQoKTtcbiAgICB2YXIgdm5vZGVXcmFwcGVyO1xuICAgIHZhciBkZWxlZ2F0b3JzID0gbmV3IE1hcCgpO1xuICAgIHZhciBtdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBtdXRhdGlvbkNvbmZpcm1lZCQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoe1xuICAgICAgICBzdGFydDogZnVuY3Rpb24gKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBtdXRhdGlvbk9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkgeyByZXR1cm4gbGlzdGVuZXIubmV4dChudWxsKTsgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG11dGF0aW9uT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgIH0pO1xuICAgIGZ1bmN0aW9uIERPTURyaXZlcih2bm9kZSQsIG5hbWUpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09IHZvaWQgMCkgeyBuYW1lID0gJ0RPTSc7IH1cbiAgICAgICAgZG9tRHJpdmVySW5wdXRHdWFyZCh2bm9kZSQpO1xuICAgICAgICB2YXIgc2FuaXRhdGlvbiQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgdmFyIGZpcnN0Um9vdCQgPSBkb21SZWFkeSQubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmaXJzdFJvb3QgPSB1dGlsc18xLmdldFZhbGlkTm9kZShjb250YWluZXIpIHx8IGRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICB2bm9kZVdyYXBwZXIgPSBuZXcgVk5vZGVXcmFwcGVyXzEuVk5vZGVXcmFwcGVyKGZpcnN0Um9vdCk7XG4gICAgICAgICAgICByZXR1cm4gZmlyc3RSb290O1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBzdWJzY3JpYmUgdG8gdGhlIHNpbmsgKGkuZS4gdm5vZGUkKSBzeW5jaHJvbm91c2x5IGluc2lkZSB0aGlzXG4gICAgICAgIC8vIGRyaXZlciwgYW5kIG5vdCBsYXRlciBpbiB0aGUgbWFwKCkuZmxhdHRlbigpIGJlY2F1c2UgdGhpcyBzaW5rIGlzIGluXG4gICAgICAgIC8vIHJlYWxpdHkgYSBTaW5rUHJveHkgZnJvbSBAY3ljbGUvcnVuLCBhbmQgd2UgZG9uJ3Qgd2FudCB0byBtaXNzIHRoZSBmaXJzdFxuICAgICAgICAvLyBlbWlzc2lvbiB3aGVuIHRoZSBtYWluKCkgaXMgY29ubmVjdGVkIHRvIHRoZSBkcml2ZXJzLlxuICAgICAgICAvLyBSZWFkIG1vcmUgaW4gaXNzdWUgIzczOS5cbiAgICAgICAgdmFyIHJlbWVtYmVyZWRWTm9kZSQgPSB2bm9kZSQucmVtZW1iZXIoKTtcbiAgICAgICAgcmVtZW1iZXJlZFZOb2RlJC5hZGRMaXN0ZW5lcih7fSk7XG4gICAgICAgIC8vIFRoZSBtdXRhdGlvbiBvYnNlcnZlciBpbnRlcm5hbCB0byBtdXRhdGlvbkNvbmZpcm1lZCQgc2hvdWxkXG4gICAgICAgIC8vIGV4aXN0IGJlZm9yZSBlbGVtZW50QWZ0ZXJQYXRjaCQgY2FsbHMgbXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKClcbiAgICAgICAgbXV0YXRpb25Db25maXJtZWQkLmFkZExpc3RlbmVyKHt9KTtcbiAgICAgICAgdmFyIGVsZW1lbnRBZnRlclBhdGNoJCA9IGZpcnN0Um9vdCRcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGZpcnN0Um9vdCkge1xuICAgICAgICAgICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0XG4gICAgICAgICAgICAgICAgLm1lcmdlKHJlbWVtYmVyZWRWTm9kZSQuZW5kV2hlbihzYW5pdGF0aW9uJCksIHNhbml0YXRpb24kKVxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKHZub2RlKSB7IHJldHVybiB2bm9kZVdyYXBwZXIuY2FsbCh2bm9kZSk7IH0pXG4gICAgICAgICAgICAgICAgLmZvbGQocGF0Y2gsIHRvdm5vZGVfMS50b1ZOb2RlKGZpcnN0Um9vdCkpXG4gICAgICAgICAgICAgICAgLmRyb3AoMSlcbiAgICAgICAgICAgICAgICAubWFwKHVud3JhcEVsZW1lbnRGcm9tVk5vZGUpXG4gICAgICAgICAgICAgICAgLnN0YXJ0V2l0aChmaXJzdFJvb3QpXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICBtdXRhdGlvbk9ic2VydmVyLm9ic2VydmUoZWwsIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyRGF0YU9sZFZhbHVlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNvbXBvc2UoZHJvcENvbXBsZXRpb24pO1xuICAgICAgICB9KVxuICAgICAgICAgICAgLmZsYXR0ZW4oKTtcbiAgICAgICAgdmFyIHJvb3RFbGVtZW50JCA9IGNvbmNhdF8xLmRlZmF1bHQoZG9tUmVhZHkkLCBtdXRhdGlvbkNvbmZpcm1lZCQpXG4gICAgICAgICAgICAuZW5kV2hlbihzYW5pdGF0aW9uJClcbiAgICAgICAgICAgIC5jb21wb3NlKHNhbXBsZUNvbWJpbmVfMS5kZWZhdWx0KGVsZW1lbnRBZnRlclBhdGNoJCkpXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChhcnIpIHsgcmV0dXJuIGFyclsxXTsgfSlcbiAgICAgICAgICAgIC5yZW1lbWJlcigpO1xuICAgICAgICAvLyBTdGFydCB0aGUgc25hYmJkb20gcGF0Y2hpbmcsIG92ZXIgdGltZVxuICAgICAgICByb290RWxlbWVudCQuYWRkTGlzdGVuZXIoeyBlcnJvcjogcmVwb3J0U25hYmJkb21FcnJvciB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBNYWluRE9NU291cmNlXzEuTWFpbkRPTVNvdXJjZShyb290RWxlbWVudCQsIHNhbml0YXRpb24kLCBbXSwgaXNvbGF0ZU1vZHVsZSwgZGVsZWdhdG9ycywgbmFtZSk7XG4gICAgfVxuICAgIHJldHVybiBET01Ecml2ZXI7XG59XG5leHBvcnRzLm1ha2VET01Ecml2ZXIgPSBtYWtlRE9NRHJpdmVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFrZURPTURyaXZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGNyZWF0ZU1hdGNoZXNTZWxlY3RvcigpIHtcbiAgICB2YXIgdmVuZG9yO1xuICAgIHRyeSB7XG4gICAgICAgIHZhciBwcm90byA9IEVsZW1lbnQucHJvdG90eXBlO1xuICAgICAgICB2ZW5kb3IgPVxuICAgICAgICAgICAgcHJvdG8ubWF0Y2hlcyB8fFxuICAgICAgICAgICAgICAgIHByb3RvLm1hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgICAgICAgICAgIHByb3RvLndlYmtpdE1hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgICAgICAgICAgIHByb3RvLm1vek1hdGNoZXNTZWxlY3RvciB8fFxuICAgICAgICAgICAgICAgIHByb3RvLm1zTWF0Y2hlc1NlbGVjdG9yIHx8XG4gICAgICAgICAgICAgICAgcHJvdG8ub01hdGNoZXNTZWxlY3RvcjtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICB2ZW5kb3IgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gbWF0Y2goZWxlbSwgc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKHNlbGVjdG9yLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZlbmRvcikge1xuICAgICAgICAgICAgcmV0dXJuIHZlbmRvci5jYWxsKGVsZW0sIHNlbGVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbm9kZXMgPSBlbGVtLnBhcmVudE5vZGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChub2Rlc1tpXSA9PT0gZWxlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYXRjaGVzU2VsZWN0b3IgPSBjcmVhdGVNYXRjaGVzU2VsZWN0b3IoKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1hdGNoZXNTZWxlY3Rvci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIFNDT1BFX1BSRUZJWCA9ICdfX18nO1xudmFyIE1vY2tlZERPTVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2NrZWRET01Tb3VyY2UoX21vY2tDb25maWcpIHtcbiAgICAgICAgdGhpcy5fbW9ja0NvbmZpZyA9IF9tb2NrQ29uZmlnO1xuICAgICAgICBpZiAoX21vY2tDb25maWdbJ2VsZW1lbnRzJ10pIHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnRzID0gX21vY2tDb25maWdbJ2VsZW1lbnRzJ107XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50cyA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQuZW1wdHkoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXNcbiAgICAgICAgICAgIC5fZWxlbWVudHM7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9ICdNb2NrZWRET00nO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0cHV0JCA9IHRoaXMuZWxlbWVudHMoKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYXJyKSB7IHJldHVybiBhcnIubGVuZ3RoID4gMDsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGFycikgeyByZXR1cm4gYXJyWzBdOyB9KVxuICAgICAgICAgICAgLnJlbWVtYmVyKCk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KG91dHB1dCQpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSAnTW9ja2VkRE9NJztcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgc3RyZWFtRm9yRXZlbnRUeXBlID0gdGhpcy5fbW9ja0NvbmZpZ1tldmVudFR5cGVdO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChzdHJlYW1Gb3JFdmVudFR5cGUgfHwgeHN0cmVhbV8xLmRlZmF1bHQuZW1wdHkoKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9ICdNb2NrZWRET00nO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIG1vY2tDb25maWdGb3JTZWxlY3RvciA9IHRoaXMuX21vY2tDb25maWdbc2VsZWN0b3JdIHx8IHt9O1xuICAgICAgICByZXR1cm4gbmV3IE1vY2tlZERPTVNvdXJjZShtb2NrQ29uZmlnRm9yU2VsZWN0b3IpO1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5pc29sYXRlU291cmNlID0gZnVuY3Rpb24gKHNvdXJjZSwgc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZS5zZWxlY3QoJy4nICsgU0NPUEVfUFJFRklYICsgc2NvcGUpO1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5pc29sYXRlU2luayA9IGZ1bmN0aW9uIChzaW5rLCBzY29wZSkge1xuICAgICAgICByZXR1cm4gc2luay5tYXAoZnVuY3Rpb24gKHZub2RlKSB7XG4gICAgICAgICAgICBpZiAodm5vZGUuc2VsICYmIHZub2RlLnNlbC5pbmRleE9mKFNDT1BFX1BSRUZJWCArIHNjb3BlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2bm9kZS5zZWwgKz0gXCIuXCIgKyBTQ09QRV9QUkVGSVggKyBzY29wZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIE1vY2tlZERPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLk1vY2tlZERPTVNvdXJjZSA9IE1vY2tlZERPTVNvdXJjZTtcbmZ1bmN0aW9uIG1vY2tET01Tb3VyY2UobW9ja0NvbmZpZykge1xuICAgIHJldHVybiBuZXcgTW9ja2VkRE9NU291cmNlKG1vY2tDb25maWcpO1xufVxuZXhwb3J0cy5tb2NrRE9NU291cmNlID0gbW9ja0RPTVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1vY2tET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgY2xhc3NfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL2NsYXNzXCIpO1xuZXhwb3J0cy5DbGFzc01vZHVsZSA9IGNsYXNzXzEuZGVmYXVsdDtcbnZhciBwcm9wc18xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvcHJvcHNcIik7XG5leHBvcnRzLlByb3BzTW9kdWxlID0gcHJvcHNfMS5kZWZhdWx0O1xudmFyIGF0dHJpYnV0ZXNfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL2F0dHJpYnV0ZXNcIik7XG5leHBvcnRzLkF0dHJzTW9kdWxlID0gYXR0cmlidXRlc18xLmRlZmF1bHQ7XG52YXIgc3R5bGVfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL3N0eWxlXCIpO1xuZXhwb3J0cy5TdHlsZU1vZHVsZSA9IHN0eWxlXzEuZGVmYXVsdDtcbnZhciBkYXRhc2V0XzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9kYXRhc2V0XCIpO1xuZXhwb3J0cy5EYXRhc2V0TW9kdWxlID0gZGF0YXNldF8xLmRlZmF1bHQ7XG52YXIgbW9kdWxlcyA9IFtcbiAgICBzdHlsZV8xLmRlZmF1bHQsXG4gICAgY2xhc3NfMS5kZWZhdWx0LFxuICAgIHByb3BzXzEuZGVmYXVsdCxcbiAgICBhdHRyaWJ1dGVzXzEuZGVmYXVsdCxcbiAgICBkYXRhc2V0XzEuZGVmYXVsdCxcbl07XG5leHBvcnRzLmRlZmF1bHQgPSBtb2R1bGVzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9kdWxlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBoXzEgPSByZXF1aXJlKFwic25hYmJkb20vaFwiKTtcbmZ1bmN0aW9uIGNvcHlUb1RodW5rKHZub2RlLCB0aHVua1ZOb2RlKSB7XG4gICAgdGh1bmtWTm9kZS5lbG0gPSB2bm9kZS5lbG07XG4gICAgdm5vZGUuZGF0YS5mbiA9IHRodW5rVk5vZGUuZGF0YS5mbjtcbiAgICB2bm9kZS5kYXRhLmFyZ3MgPSB0aHVua1ZOb2RlLmRhdGEuYXJncztcbiAgICB2bm9kZS5kYXRhLmlzb2xhdGUgPSB0aHVua1ZOb2RlLmRhdGEuaXNvbGF0ZTtcbiAgICB0aHVua1ZOb2RlLmRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIHRodW5rVk5vZGUuY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcbiAgICB0aHVua1ZOb2RlLnRleHQgPSB2bm9kZS50ZXh0O1xuICAgIHRodW5rVk5vZGUuZWxtID0gdm5vZGUuZWxtO1xufVxuZnVuY3Rpb24gaW5pdCh0aHVua1ZOb2RlKSB7XG4gICAgdmFyIGN1ciA9IHRodW5rVk5vZGUuZGF0YTtcbiAgICB2YXIgdm5vZGUgPSBjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBjdXIuYXJncyk7XG4gICAgY29weVRvVGh1bmsodm5vZGUsIHRodW5rVk5vZGUpO1xufVxuZnVuY3Rpb24gcHJlcGF0Y2gob2xkVm5vZGUsIHRodW5rVk5vZGUpIHtcbiAgICB2YXIgb2xkID0gb2xkVm5vZGUuZGF0YSwgY3VyID0gdGh1bmtWTm9kZS5kYXRhO1xuICAgIHZhciBpO1xuICAgIHZhciBvbGRBcmdzID0gb2xkLmFyZ3MsIGFyZ3MgPSBjdXIuYXJncztcbiAgICBpZiAob2xkLmZuICE9PSBjdXIuZm4gfHwgb2xkQXJncy5sZW5ndGggIT09IGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNvcHlUb1RodW5rKGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpLCB0aHVua1ZOb2RlKTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKG9sZEFyZ3NbaV0gIT09IGFyZ3NbaV0pIHtcbiAgICAgICAgICAgIGNvcHlUb1RodW5rKGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpLCB0aHVua1ZOb2RlKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb3B5VG9UaHVuayhvbGRWbm9kZSwgdGh1bmtWTm9kZSk7XG59XG5mdW5jdGlvbiB0aHVuayhzZWwsIGtleSwgZm4sIGFyZ3MpIHtcbiAgICBpZiAoYXJncyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFyZ3MgPSBmbjtcbiAgICAgICAgZm4gPSBrZXk7XG4gICAgICAgIGtleSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGhfMS5oKHNlbCwge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgaG9vazogeyBpbml0OiBpbml0LCBwcmVwYXRjaDogcHJlcGF0Y2ggfSxcbiAgICAgICAgZm46IGZuLFxuICAgICAgICBhcmdzOiBhcmdzLFxuICAgIH0pO1xufVxuZXhwb3J0cy50aHVuayA9IHRodW5rO1xuZXhwb3J0cy5kZWZhdWx0ID0gdGh1bms7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10aHVuay5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGlzVmFsaWROb2RlKG9iaikge1xuICAgIHZhciBFTEVNX1RZUEUgPSAxO1xuICAgIHZhciBGUkFHX1RZUEUgPSAxMTtcbiAgICByZXR1cm4gdHlwZW9mIEhUTUxFbGVtZW50ID09PSAnb2JqZWN0J1xuICAgICAgICA/IG9iaiBpbnN0YW5jZW9mIEhUTUxFbGVtZW50IHx8IG9iaiBpbnN0YW5jZW9mIERvY3VtZW50RnJhZ21lbnRcbiAgICAgICAgOiBvYmogJiZcbiAgICAgICAgICAgIHR5cGVvZiBvYmogPT09ICdvYmplY3QnICYmXG4gICAgICAgICAgICBvYmogIT09IG51bGwgJiZcbiAgICAgICAgICAgIChvYmoubm9kZVR5cGUgPT09IEVMRU1fVFlQRSB8fCBvYmoubm9kZVR5cGUgPT09IEZSQUdfVFlQRSkgJiZcbiAgICAgICAgICAgIHR5cGVvZiBvYmoubm9kZU5hbWUgPT09ICdzdHJpbmcnO1xufVxuZnVuY3Rpb24gaXNDbGFzc09ySWQoc3RyKSB7XG4gICAgcmV0dXJuIHN0ci5sZW5ndGggPiAxICYmIChzdHJbMF0gPT09ICcuJyB8fCBzdHJbMF0gPT09ICcjJyk7XG59XG5leHBvcnRzLmlzQ2xhc3NPcklkID0gaXNDbGFzc09ySWQ7XG5mdW5jdGlvbiBpc0RvY0ZyYWcoZWwpIHtcbiAgICByZXR1cm4gZWwubm9kZVR5cGUgPT09IDExO1xufVxuZXhwb3J0cy5pc0RvY0ZyYWcgPSBpc0RvY0ZyYWc7XG5leHBvcnRzLlNDT1BFX1BSRUZJWCA9ICckJENZQ0xFRE9NJCQtJztcbmZ1bmN0aW9uIGNoZWNrVmFsaWRDb250YWluZXIoY29udGFpbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBjb250YWluZXIgIT09ICdzdHJpbmcnICYmICFpc1ZhbGlkTm9kZShjb250YWluZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignR2l2ZW4gY29udGFpbmVyIGlzIG5vdCBhIERPTSBlbGVtZW50IG5laXRoZXIgYSBzZWxlY3RvciBzdHJpbmcuJyk7XG4gICAgfVxufVxuZXhwb3J0cy5jaGVja1ZhbGlkQ29udGFpbmVyID0gY2hlY2tWYWxpZENvbnRhaW5lcjtcbmZ1bmN0aW9uIGdldFZhbGlkTm9kZShzZWxlY3RvcnMpIHtcbiAgICB2YXIgZG9tRWxlbWVudCA9IHR5cGVvZiBzZWxlY3RvcnMgPT09ICdzdHJpbmcnXG4gICAgICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcnMpXG4gICAgICAgIDogc2VsZWN0b3JzO1xuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3JzID09PSAnc3RyaW5nJyAmJiBkb21FbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZW5kZXIgaW50byB1bmtub3duIGVsZW1lbnQgYFwiICsgc2VsZWN0b3JzICsgXCJgXCIpO1xuICAgIH1cbiAgICByZXR1cm4gZG9tRWxlbWVudDtcbn1cbmV4cG9ydHMuZ2V0VmFsaWROb2RlID0gZ2V0VmFsaWROb2RlO1xuLyoqXG4gKiBUaGUgZnVsbCBzY29wZSBvZiBhIG5hbWVzcGFjZSBpcyB0aGUgXCJhYnNvbHV0ZSBwYXRoXCIgb2Ygc2NvcGVzIGZyb21cbiAqIHBhcmVudCB0byBjaGlsZC4gVGhpcyBpcyBleHRyYWN0ZWQgZnJvbSB0aGUgbmFtZXNwYWNlLCBmaWx0ZXIgb25seSBmb3JcbiAqIHNjb3BlcyBpbiB0aGUgbmFtZXNwYWNlLlxuICovXG5mdW5jdGlvbiBnZXRGdWxsU2NvcGUobmFtZXNwYWNlKSB7XG4gICAgcmV0dXJuIG5hbWVzcGFjZVxuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiBjLmluZGV4T2YoZXhwb3J0cy5TQ09QRV9QUkVGSVgpID4gLTE7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMucmVwbGFjZShleHBvcnRzLlNDT1BFX1BSRUZJWCwgJycpOyB9KVxuICAgICAgICAuam9pbignLScpO1xufVxuZXhwb3J0cy5nZXRGdWxsU2NvcGUgPSBnZXRGdWxsU2NvcGU7XG5mdW5jdGlvbiBnZXRTZWxlY3RvcnMobmFtZXNwYWNlKSB7XG4gICAgcmV0dXJuIG5hbWVzcGFjZS5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGMuaW5kZXhPZihleHBvcnRzLlNDT1BFX1BSRUZJWCkgPT09IC0xOyB9KS5qb2luKCcgJyk7XG59XG5leHBvcnRzLmdldFNlbGVjdG9ycyA9IGdldFNlbGVjdG9ycztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcbnZhciBpcyA9IHJlcXVpcmUoXCIuL2lzXCIpO1xuZnVuY3Rpb24gYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCkge1xuICAgIGRhdGEubnMgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICAgIGlmIChzZWwgIT09ICdmb3JlaWduT2JqZWN0JyAmJiBjaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZERhdGEgPSBjaGlsZHJlbltpXS5kYXRhO1xuICAgICAgICAgICAgaWYgKGNoaWxkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYWRkTlMoY2hpbGREYXRhLCBjaGlsZHJlbltpXS5jaGlsZHJlbiwgY2hpbGRyZW5baV0uc2VsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGgoc2VsLCBiLCBjKSB7XG4gICAgdmFyIGRhdGEgPSB7fSwgY2hpbGRyZW4sIHRleHQsIGk7XG4gICAgaWYgKGMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkYXRhID0gYjtcbiAgICAgICAgaWYgKGlzLmFycmF5KGMpKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGMpKSB7XG4gICAgICAgICAgICB0ZXh0ID0gYztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjICYmIGMuc2VsKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtjXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChiICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGlzLmFycmF5KGIpKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGIpKSB7XG4gICAgICAgICAgICB0ZXh0ID0gYjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChiICYmIGIuc2VsKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtiXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSBiO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChpcy5hcnJheShjaGlsZHJlbikpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoaXMucHJpbWl0aXZlKGNoaWxkcmVuW2ldKSlcbiAgICAgICAgICAgICAgICBjaGlsZHJlbltpXSA9IHZub2RlXzEudm5vZGUodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgY2hpbGRyZW5baV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChzZWxbMF0gPT09ICdzJyAmJiBzZWxbMV0gPT09ICd2JyAmJiBzZWxbMl0gPT09ICdnJyAmJlxuICAgICAgICAoc2VsLmxlbmd0aCA9PT0gMyB8fCBzZWxbM10gPT09ICcuJyB8fCBzZWxbM10gPT09ICcjJykpIHtcbiAgICAgICAgYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCk7XG4gICAgfVxuICAgIHJldHVybiB2bm9kZV8xLnZub2RlKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIHVuZGVmaW5lZCk7XG59XG5leHBvcnRzLmggPSBoO1xuO1xuZXhwb3J0cy5kZWZhdWx0ID0gaDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZ05hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2VVUkksIHF1YWxpZmllZE5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSk7XG59XG5mdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh0ZXh0KSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xufVxuZnVuY3Rpb24gY3JlYXRlQ29tbWVudCh0ZXh0KSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQodGV4dCk7XG59XG5mdW5jdGlvbiBpbnNlcnRCZWZvcmUocGFyZW50Tm9kZSwgbmV3Tm9kZSwgcmVmZXJlbmNlTm9kZSkge1xuICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIHJlZmVyZW5jZU5vZGUpO1xufVxuZnVuY3Rpb24gcmVtb3ZlQ2hpbGQobm9kZSwgY2hpbGQpIHtcbiAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZENoaWxkKG5vZGUsIGNoaWxkKSB7XG4gICAgbm9kZS5hcHBlbmRDaGlsZChjaGlsZCk7XG59XG5mdW5jdGlvbiBwYXJlbnROb2RlKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5wYXJlbnROb2RlO1xufVxuZnVuY3Rpb24gbmV4dFNpYmxpbmcobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5leHRTaWJsaW5nO1xufVxuZnVuY3Rpb24gdGFnTmFtZShlbG0pIHtcbiAgICByZXR1cm4gZWxtLnRhZ05hbWU7XG59XG5mdW5jdGlvbiBzZXRUZXh0Q29udGVudChub2RlLCB0ZXh0KSB7XG4gICAgbm9kZS50ZXh0Q29udGVudCA9IHRleHQ7XG59XG5mdW5jdGlvbiBnZXRUZXh0Q29udGVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUudGV4dENvbnRlbnQ7XG59XG5mdW5jdGlvbiBpc0VsZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAxO1xufVxuZnVuY3Rpb24gaXNUZXh0KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMztcbn1cbmZ1bmN0aW9uIGlzQ29tbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDg7XG59XG5leHBvcnRzLmh0bWxEb21BcGkgPSB7XG4gICAgY3JlYXRlRWxlbWVudDogY3JlYXRlRWxlbWVudCxcbiAgICBjcmVhdGVFbGVtZW50TlM6IGNyZWF0ZUVsZW1lbnROUyxcbiAgICBjcmVhdGVUZXh0Tm9kZTogY3JlYXRlVGV4dE5vZGUsXG4gICAgY3JlYXRlQ29tbWVudDogY3JlYXRlQ29tbWVudCxcbiAgICBpbnNlcnRCZWZvcmU6IGluc2VydEJlZm9yZSxcbiAgICByZW1vdmVDaGlsZDogcmVtb3ZlQ2hpbGQsXG4gICAgYXBwZW5kQ2hpbGQ6IGFwcGVuZENoaWxkLFxuICAgIHBhcmVudE5vZGU6IHBhcmVudE5vZGUsXG4gICAgbmV4dFNpYmxpbmc6IG5leHRTaWJsaW5nLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgc2V0VGV4dENvbnRlbnQ6IHNldFRleHRDb250ZW50LFxuICAgIGdldFRleHRDb250ZW50OiBnZXRUZXh0Q29udGVudCxcbiAgICBpc0VsZW1lbnQ6IGlzRWxlbWVudCxcbiAgICBpc1RleHQ6IGlzVGV4dCxcbiAgICBpc0NvbW1lbnQ6IGlzQ29tbWVudCxcbn07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmh0bWxEb21BcGk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1odG1sZG9tYXBpLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5hcnJheSA9IEFycmF5LmlzQXJyYXk7XG5mdW5jdGlvbiBwcmltaXRpdmUocykge1xuICAgIHJldHVybiB0eXBlb2YgcyA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHMgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5wcmltaXRpdmUgPSBwcmltaXRpdmU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4bGlua05TID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnO1xudmFyIHhtbE5TID0gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XG52YXIgY29sb25DaGFyID0gNTg7XG52YXIgeENoYXIgPSAxMjA7XG5mdW5jdGlvbiB1cGRhdGVBdHRycyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIga2V5LCBlbG0gPSB2bm9kZS5lbG0sIG9sZEF0dHJzID0gb2xkVm5vZGUuZGF0YS5hdHRycywgYXR0cnMgPSB2bm9kZS5kYXRhLmF0dHJzO1xuICAgIGlmICghb2xkQXR0cnMgJiYgIWF0dHJzKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZEF0dHJzID09PSBhdHRycylcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZEF0dHJzID0gb2xkQXR0cnMgfHwge307XG4gICAgYXR0cnMgPSBhdHRycyB8fCB7fTtcbiAgICAvLyB1cGRhdGUgbW9kaWZpZWQgYXR0cmlidXRlcywgYWRkIG5ldyBhdHRyaWJ1dGVzXG4gICAgZm9yIChrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgdmFyIGN1ciA9IGF0dHJzW2tleV07XG4gICAgICAgIHZhciBvbGQgPSBvbGRBdHRyc1trZXldO1xuICAgICAgICBpZiAob2xkICE9PSBjdXIpIHtcbiAgICAgICAgICAgIGlmIChjdXIgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgXCJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjdXIgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleS5jaGFyQ29kZUF0KDApICE9PSB4Q2hhcikge1xuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5LmNoYXJDb2RlQXQoMykgPT09IGNvbG9uQ2hhcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWUgeG1sIG5hbWVzcGFjZVxuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlTlMoeG1sTlMsIGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5LmNoYXJDb2RlQXQoNSkgPT09IGNvbG9uQ2hhcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWUgeGxpbmsgbmFtZXNwYWNlXG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGVOUyh4bGlua05TLCBrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gcmVtb3ZlIHJlbW92ZWQgYXR0cmlidXRlc1xuICAgIC8vIHVzZSBgaW5gIG9wZXJhdG9yIHNpbmNlIHRoZSBwcmV2aW91cyBgZm9yYCBpdGVyYXRpb24gdXNlcyBpdCAoLmkuZS4gYWRkIGV2ZW4gYXR0cmlidXRlcyB3aXRoIHVuZGVmaW5lZCB2YWx1ZSlcbiAgICAvLyB0aGUgb3RoZXIgb3B0aW9uIGlzIHRvIHJlbW92ZSBhbGwgYXR0cmlidXRlcyB3aXRoIHZhbHVlID09IHVuZGVmaW5lZFxuICAgIGZvciAoa2V5IGluIG9sZEF0dHJzKSB7XG4gICAgICAgIGlmICghKGtleSBpbiBhdHRycykpIHtcbiAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuYXR0cmlidXRlc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVBdHRycywgdXBkYXRlOiB1cGRhdGVBdHRycyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5hdHRyaWJ1dGVzTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXR0cmlidXRlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIHVwZGF0ZUNsYXNzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBjdXIsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgb2xkQ2xhc3MgPSBvbGRWbm9kZS5kYXRhLmNsYXNzLCBrbGFzcyA9IHZub2RlLmRhdGEuY2xhc3M7XG4gICAgaWYgKCFvbGRDbGFzcyAmJiAha2xhc3MpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkQ2xhc3MgPT09IGtsYXNzKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkQ2xhc3MgPSBvbGRDbGFzcyB8fCB7fTtcbiAgICBrbGFzcyA9IGtsYXNzIHx8IHt9O1xuICAgIGZvciAobmFtZSBpbiBvbGRDbGFzcykge1xuICAgICAgICBpZiAoIWtsYXNzW25hbWVdKSB7XG4gICAgICAgICAgICBlbG0uY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKG5hbWUgaW4ga2xhc3MpIHtcbiAgICAgICAgY3VyID0ga2xhc3NbbmFtZV07XG4gICAgICAgIGlmIChjdXIgIT09IG9sZENsYXNzW25hbWVdKSB7XG4gICAgICAgICAgICBlbG0uY2xhc3NMaXN0W2N1ciA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5jbGFzc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVDbGFzcywgdXBkYXRlOiB1cGRhdGVDbGFzcyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5jbGFzc01vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNsYXNzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIENBUFNfUkVHRVggPSAvW0EtWl0vZztcbmZ1bmN0aW9uIHVwZGF0ZURhdGFzZXQob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGVsbSA9IHZub2RlLmVsbSwgb2xkRGF0YXNldCA9IG9sZFZub2RlLmRhdGEuZGF0YXNldCwgZGF0YXNldCA9IHZub2RlLmRhdGEuZGF0YXNldCwga2V5O1xuICAgIGlmICghb2xkRGF0YXNldCAmJiAhZGF0YXNldClcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGREYXRhc2V0ID09PSBkYXRhc2V0KVxuICAgICAgICByZXR1cm47XG4gICAgb2xkRGF0YXNldCA9IG9sZERhdGFzZXQgfHwge307XG4gICAgZGF0YXNldCA9IGRhdGFzZXQgfHwge307XG4gICAgdmFyIGQgPSBlbG0uZGF0YXNldDtcbiAgICBmb3IgKGtleSBpbiBvbGREYXRhc2V0KSB7XG4gICAgICAgIGlmICghZGF0YXNldFtrZXldKSB7XG4gICAgICAgICAgICBpZiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChrZXkgaW4gZCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZFtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtJyArIGtleS5yZXBsYWNlKENBUFNfUkVHRVgsICctJCYnKS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGtleSBpbiBkYXRhc2V0KSB7XG4gICAgICAgIGlmIChvbGREYXRhc2V0W2tleV0gIT09IGRhdGFzZXRba2V5XSkge1xuICAgICAgICAgICAgaWYgKGQpIHtcbiAgICAgICAgICAgICAgICBkW2tleV0gPSBkYXRhc2V0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdkYXRhLScgKyBrZXkucmVwbGFjZShDQVBTX1JFR0VYLCAnLSQmJykudG9Mb3dlckNhc2UoKSwgZGF0YXNldFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuZGF0YXNldE1vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVEYXRhc2V0LCB1cGRhdGU6IHVwZGF0ZURhdGFzZXQgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuZGF0YXNldE1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGFzZXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB1cGRhdGVQcm9wcyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIga2V5LCBjdXIsIG9sZCwgZWxtID0gdm5vZGUuZWxtLCBvbGRQcm9wcyA9IG9sZFZub2RlLmRhdGEucHJvcHMsIHByb3BzID0gdm5vZGUuZGF0YS5wcm9wcztcbiAgICBpZiAoIW9sZFByb3BzICYmICFwcm9wcylcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRQcm9wcyA9PT0gcHJvcHMpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRQcm9wcyA9IG9sZFByb3BzIHx8IHt9O1xuICAgIHByb3BzID0gcHJvcHMgfHwge307XG4gICAgZm9yIChrZXkgaW4gb2xkUHJvcHMpIHtcbiAgICAgICAgaWYgKCFwcm9wc1trZXldKSB7XG4gICAgICAgICAgICBkZWxldGUgZWxtW2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChrZXkgaW4gcHJvcHMpIHtcbiAgICAgICAgY3VyID0gcHJvcHNba2V5XTtcbiAgICAgICAgb2xkID0gb2xkUHJvcHNba2V5XTtcbiAgICAgICAgaWYgKG9sZCAhPT0gY3VyICYmIChrZXkgIT09ICd2YWx1ZScgfHwgZWxtW2tleV0gIT09IGN1cikpIHtcbiAgICAgICAgICAgIGVsbVtrZXldID0gY3VyO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5wcm9wc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVQcm9wcywgdXBkYXRlOiB1cGRhdGVQcm9wcyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5wcm9wc01vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb3BzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHJhZiA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB8fCBzZXRUaW1lb3V0O1xudmFyIG5leHRGcmFtZSA9IGZ1bmN0aW9uIChmbikgeyByYWYoZnVuY3Rpb24gKCkgeyByYWYoZm4pOyB9KTsgfTtcbmZ1bmN0aW9uIHNldE5leHRGcmFtZShvYmosIHByb3AsIHZhbCkge1xuICAgIG5leHRGcmFtZShmdW5jdGlvbiAoKSB7IG9ialtwcm9wXSA9IHZhbDsgfSk7XG59XG5mdW5jdGlvbiB1cGRhdGVTdHlsZShvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIgY3VyLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sIG9sZFN0eWxlID0gb2xkVm5vZGUuZGF0YS5zdHlsZSwgc3R5bGUgPSB2bm9kZS5kYXRhLnN0eWxlO1xuICAgIGlmICghb2xkU3R5bGUgJiYgIXN0eWxlKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZFN0eWxlID09PSBzdHlsZSlcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZFN0eWxlID0gb2xkU3R5bGUgfHwge307XG4gICAgc3R5bGUgPSBzdHlsZSB8fCB7fTtcbiAgICB2YXIgb2xkSGFzRGVsID0gJ2RlbGF5ZWQnIGluIG9sZFN0eWxlO1xuICAgIGZvciAobmFtZSBpbiBvbGRTdHlsZSkge1xuICAgICAgICBpZiAoIXN0eWxlW25hbWVdKSB7XG4gICAgICAgICAgICBpZiAobmFtZVswXSA9PT0gJy0nICYmIG5hbWVbMV0gPT09ICctJykge1xuICAgICAgICAgICAgICAgIGVsbS5zdHlsZS5yZW1vdmVQcm9wZXJ0eShuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBjdXIgPSBzdHlsZVtuYW1lXTtcbiAgICAgICAgaWYgKG5hbWUgPT09ICdkZWxheWVkJyAmJiBzdHlsZS5kZWxheWVkKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBuYW1lMiBpbiBzdHlsZS5kZWxheWVkKSB7XG4gICAgICAgICAgICAgICAgY3VyID0gc3R5bGUuZGVsYXllZFtuYW1lMl07XG4gICAgICAgICAgICAgICAgaWYgKCFvbGRIYXNEZWwgfHwgY3VyICE9PSBvbGRTdHlsZS5kZWxheWVkW25hbWUyXSkge1xuICAgICAgICAgICAgICAgICAgICBzZXROZXh0RnJhbWUoZWxtLnN0eWxlLCBuYW1lMiwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobmFtZSAhPT0gJ3JlbW92ZScgJiYgY3VyICE9PSBvbGRTdHlsZVtuYW1lXSkge1xuICAgICAgICAgICAgaWYgKG5hbWVbMF0gPT09ICctJyAmJiBuYW1lWzFdID09PSAnLScpIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGUuc2V0UHJvcGVydHkobmFtZSwgY3VyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IGN1cjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGFwcGx5RGVzdHJveVN0eWxlKHZub2RlKSB7XG4gICAgdmFyIHN0eWxlLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sIHMgPSB2bm9kZS5kYXRhLnN0eWxlO1xuICAgIGlmICghcyB8fCAhKHN0eWxlID0gcy5kZXN0cm95KSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBzdHlsZVtuYW1lXTtcbiAgICB9XG59XG5mdW5jdGlvbiBhcHBseVJlbW92ZVN0eWxlKHZub2RlLCBybSkge1xuICAgIHZhciBzID0gdm5vZGUuZGF0YS5zdHlsZTtcbiAgICBpZiAoIXMgfHwgIXMucmVtb3ZlKSB7XG4gICAgICAgIHJtKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgaSA9IDAsIGNvbXBTdHlsZSwgc3R5bGUgPSBzLnJlbW92ZSwgYW1vdW50ID0gMCwgYXBwbGllZCA9IFtdO1xuICAgIGZvciAobmFtZSBpbiBzdHlsZSkge1xuICAgICAgICBhcHBsaWVkLnB1c2gobmFtZSk7XG4gICAgICAgIGVsbS5zdHlsZVtuYW1lXSA9IHN0eWxlW25hbWVdO1xuICAgIH1cbiAgICBjb21wU3R5bGUgPSBnZXRDb21wdXRlZFN0eWxlKGVsbSk7XG4gICAgdmFyIHByb3BzID0gY29tcFN0eWxlWyd0cmFuc2l0aW9uLXByb3BlcnR5J10uc3BsaXQoJywgJyk7XG4gICAgZm9yICg7IGkgPCBwcm9wcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAoYXBwbGllZC5pbmRleE9mKHByb3BzW2ldKSAhPT0gLTEpXG4gICAgICAgICAgICBhbW91bnQrKztcbiAgICB9XG4gICAgZWxtLmFkZEV2ZW50TGlzdGVuZXIoJ3RyYW5zaXRpb25lbmQnLCBmdW5jdGlvbiAoZXYpIHtcbiAgICAgICAgaWYgKGV2LnRhcmdldCA9PT0gZWxtKVxuICAgICAgICAgICAgLS1hbW91bnQ7XG4gICAgICAgIGlmIChhbW91bnQgPT09IDApXG4gICAgICAgICAgICBybSgpO1xuICAgIH0pO1xufVxuZXhwb3J0cy5zdHlsZU1vZHVsZSA9IHtcbiAgICBjcmVhdGU6IHVwZGF0ZVN0eWxlLFxuICAgIHVwZGF0ZTogdXBkYXRlU3R5bGUsXG4gICAgZGVzdHJveTogYXBwbHlEZXN0cm95U3R5bGUsXG4gICAgcmVtb3ZlOiBhcHBseVJlbW92ZVN0eWxlXG59O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5zdHlsZU1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN0eWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcbnZhciBpcyA9IHJlcXVpcmUoXCIuL2lzXCIpO1xudmFyIGh0bWxkb21hcGlfMSA9IHJlcXVpcmUoXCIuL2h0bWxkb21hcGlcIik7XG5mdW5jdGlvbiBpc1VuZGVmKHMpIHsgcmV0dXJuIHMgPT09IHVuZGVmaW5lZDsgfVxuZnVuY3Rpb24gaXNEZWYocykgeyByZXR1cm4gcyAhPT0gdW5kZWZpbmVkOyB9XG52YXIgZW1wdHlOb2RlID0gdm5vZGVfMS5kZWZhdWx0KCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbmZ1bmN0aW9uIHNhbWVWbm9kZSh2bm9kZTEsIHZub2RlMikge1xuICAgIHJldHVybiB2bm9kZTEua2V5ID09PSB2bm9kZTIua2V5ICYmIHZub2RlMS5zZWwgPT09IHZub2RlMi5zZWw7XG59XG5mdW5jdGlvbiBpc1Zub2RlKHZub2RlKSB7XG4gICAgcmV0dXJuIHZub2RlLnNlbCAhPT0gdW5kZWZpbmVkO1xufVxuZnVuY3Rpb24gY3JlYXRlS2V5VG9PbGRJZHgoY2hpbGRyZW4sIGJlZ2luSWR4LCBlbmRJZHgpIHtcbiAgICB2YXIgaSwgbWFwID0ge30sIGtleSwgY2g7XG4gICAgZm9yIChpID0gYmVnaW5JZHg7IGkgPD0gZW5kSWR4OyArK2kpIHtcbiAgICAgICAgY2ggPSBjaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgIGtleSA9IGNoLmtleTtcbiAgICAgICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICBtYXBba2V5XSA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hcDtcbn1cbnZhciBob29rcyA9IFsnY3JlYXRlJywgJ3VwZGF0ZScsICdyZW1vdmUnLCAnZGVzdHJveScsICdwcmUnLCAncG9zdCddO1xudmFyIGhfMSA9IHJlcXVpcmUoXCIuL2hcIik7XG5leHBvcnRzLmggPSBoXzEuaDtcbnZhciB0aHVua18xID0gcmVxdWlyZShcIi4vdGh1bmtcIik7XG5leHBvcnRzLnRodW5rID0gdGh1bmtfMS50aHVuaztcbmZ1bmN0aW9uIGluaXQobW9kdWxlcywgZG9tQXBpKSB7XG4gICAgdmFyIGksIGosIGNicyA9IHt9O1xuICAgIHZhciBhcGkgPSBkb21BcGkgIT09IHVuZGVmaW5lZCA/IGRvbUFwaSA6IGh0bWxkb21hcGlfMS5kZWZhdWx0O1xuICAgIGZvciAoaSA9IDA7IGkgPCBob29rcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjYnNbaG9va3NbaV1dID0gW107XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBtb2R1bGVzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICB2YXIgaG9vayA9IG1vZHVsZXNbal1baG9va3NbaV1dO1xuICAgICAgICAgICAgaWYgKGhvb2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNic1tob29rc1tpXV0ucHVzaChob29rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBlbXB0eU5vZGVBdChlbG0pIHtcbiAgICAgICAgdmFyIGlkID0gZWxtLmlkID8gJyMnICsgZWxtLmlkIDogJyc7XG4gICAgICAgIHZhciBjID0gZWxtLmNsYXNzTmFtZSA/ICcuJyArIGVsbS5jbGFzc05hbWUuc3BsaXQoJyAnKS5qb2luKCcuJykgOiAnJztcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdChhcGkudGFnTmFtZShlbG0pLnRvTG93ZXJDYXNlKCkgKyBpZCArIGMsIHt9LCBbXSwgdW5kZWZpbmVkLCBlbG0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVSbUNiKGNoaWxkRWxtLCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHJtQ2IoKSB7XG4gICAgICAgICAgICBpZiAoLS1saXN0ZW5lcnMgPT09IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50XzEgPSBhcGkucGFyZW50Tm9kZShjaGlsZEVsbSk7XG4gICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudF8xLCBjaGlsZEVsbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsbSh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBpLCBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmluaXQpKSB7XG4gICAgICAgICAgICAgICAgaSh2bm9kZSk7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW4sIHNlbCA9IHZub2RlLnNlbDtcbiAgICAgICAgaWYgKHNlbCA9PT0gJyEnKSB7XG4gICAgICAgICAgICBpZiAoaXNVbmRlZih2bm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIHZub2RlLnRleHQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZub2RlLmVsbSA9IGFwaS5jcmVhdGVDb21tZW50KHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBQYXJzZSBzZWxlY3RvclxuICAgICAgICAgICAgdmFyIGhhc2hJZHggPSBzZWwuaW5kZXhPZignIycpO1xuICAgICAgICAgICAgdmFyIGRvdElkeCA9IHNlbC5pbmRleE9mKCcuJywgaGFzaElkeCk7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IGhhc2hJZHggPiAwID8gaGFzaElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgZG90ID0gZG90SWR4ID4gMCA/IGRvdElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgdGFnID0gaGFzaElkeCAhPT0gLTEgfHwgZG90SWR4ICE9PSAtMSA/IHNlbC5zbGljZSgwLCBNYXRoLm1pbihoYXNoLCBkb3QpKSA6IHNlbDtcbiAgICAgICAgICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBpc0RlZihkYXRhKSAmJiBpc0RlZihpID0gZGF0YS5ucykgPyBhcGkuY3JlYXRlRWxlbWVudE5TKGksIHRhZylcbiAgICAgICAgICAgICAgICA6IGFwaS5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgICAgICAgICBpZiAoaGFzaCA8IGRvdClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdpZCcsIHNlbC5zbGljZShoYXNoICsgMSwgZG90KSk7XG4gICAgICAgICAgICBpZiAoZG90SWR4ID4gMClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdjbGFzcycsIHNlbC5zbGljZShkb3QgKyAxKS5yZXBsYWNlKC9cXC4vZywgJyAnKSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLmNyZWF0ZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMuY3JlYXRlW2ldKGVtcHR5Tm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzLmFycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2ggPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5hcHBlbmRDaGlsZChlbG0sIGNyZWF0ZUVsbShjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IHZub2RlLmRhdGEuaG9vazsgLy8gUmV1c2UgdmFyaWFibGVcbiAgICAgICAgICAgIGlmIChpc0RlZihpKSkge1xuICAgICAgICAgICAgICAgIGlmIChpLmNyZWF0ZSlcbiAgICAgICAgICAgICAgICAgICAgaS5jcmVhdGUoZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKGkuaW5zZXJ0KVxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWUucHVzaCh2bm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2bm9kZS5lbG0gPSBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZub2RlLmVsbTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCB2bm9kZXMsIHN0YXJ0SWR4LCBlbmRJZHgsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICBmb3IgKDsgc3RhcnRJZHggPD0gZW5kSWR4OyArK3N0YXJ0SWR4KSB7XG4gICAgICAgICAgICB2YXIgY2ggPSB2bm9kZXNbc3RhcnRJZHhdO1xuICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKGNoLCBpbnNlcnRlZFZub2RlUXVldWUpLCBiZWZvcmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludm9rZURlc3Ryb3lIb29rKHZub2RlKSB7XG4gICAgICAgIHZhciBpLCBqLCBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmRlc3Ryb3kpKVxuICAgICAgICAgICAgICAgIGkodm5vZGUpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5kZXN0cm95Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgIGNicy5kZXN0cm95W2ldKHZub2RlKTtcbiAgICAgICAgICAgIGlmICh2bm9kZS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHZub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgIGkgPSB2bm9kZS5jaGlsZHJlbltqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT0gbnVsbCAmJiB0eXBlb2YgaSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4KSB7XG4gICAgICAgIGZvciAoOyBzdGFydElkeCA8PSBlbmRJZHg7ICsrc3RhcnRJZHgpIHtcbiAgICAgICAgICAgIHZhciBpXzEgPSB2b2lkIDAsIGxpc3RlbmVycyA9IHZvaWQgMCwgcm0gPSB2b2lkIDAsIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmKGNoLnNlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soY2gpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBjYnMucmVtb3ZlLmxlbmd0aCArIDE7XG4gICAgICAgICAgICAgICAgICAgIHJtID0gY3JlYXRlUm1DYihjaC5lbG0sIGxpc3RlbmVycyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaV8xID0gMDsgaV8xIDwgY2JzLnJlbW92ZS5sZW5ndGg7ICsraV8xKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2JzLnJlbW92ZVtpXzFdKGNoLCBybSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0RlZihpXzEgPSBjaC5kYXRhKSAmJiBpc0RlZihpXzEgPSBpXzEuaG9vaykgJiYgaXNEZWYoaV8xID0gaV8xLnJlbW92ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlfMShjaCwgcm0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudEVsbSwgY2guZWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlQ2hpbGRyZW4ocGFyZW50RWxtLCBvbGRDaCwgbmV3Q2gsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICB2YXIgb2xkU3RhcnRJZHggPSAwLCBuZXdTdGFydElkeCA9IDA7XG4gICAgICAgIHZhciBvbGRFbmRJZHggPSBvbGRDaC5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgb2xkU3RhcnRWbm9kZSA9IG9sZENoWzBdO1xuICAgICAgICB2YXIgb2xkRW5kVm5vZGUgPSBvbGRDaFtvbGRFbmRJZHhdO1xuICAgICAgICB2YXIgbmV3RW5kSWR4ID0gbmV3Q2gubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFswXTtcbiAgICAgICAgdmFyIG5ld0VuZFZub2RlID0gbmV3Q2hbbmV3RW5kSWR4XTtcbiAgICAgICAgdmFyIG9sZEtleVRvSWR4O1xuICAgICAgICB2YXIgaWR4SW5PbGQ7XG4gICAgICAgIHZhciBlbG1Ub01vdmU7XG4gICAgICAgIHZhciBiZWZvcmU7XG4gICAgICAgIHdoaWxlIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggJiYgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICAgICAgICBpZiAob2xkU3RhcnRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdOyAvLyBWbm9kZSBtaWdodCBoYXZlIGJlZW4gbW92ZWQgbGVmdFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob2xkRW5kVm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3U3RhcnRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3RW5kVm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld1N0YXJ0Vm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzYW1lVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtLCBhcGkubmV4dFNpYmxpbmcob2xkRW5kVm5vZGUuZWxtKSk7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZEVuZFZub2RlLmVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChvbGRLZXlUb0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9sZEtleVRvSWR4ID0gY3JlYXRlS2V5VG9PbGRJZHgob2xkQ2gsIG9sZFN0YXJ0SWR4LCBvbGRFbmRJZHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZHhJbk9sZCA9IG9sZEtleVRvSWR4W25ld1N0YXJ0Vm5vZGUua2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoaXNVbmRlZihpZHhJbk9sZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbVRvTW92ZSA9IG9sZENoW2lkeEluT2xkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsbVRvTW92ZS5zZWwgIT09IG5ld1N0YXJ0Vm5vZGUuc2VsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSksIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUoZWxtVG9Nb3ZlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkQ2hbaWR4SW5PbGRdID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGVsbVRvTW92ZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvbGRTdGFydElkeCA+IG9sZEVuZElkeCkge1xuICAgICAgICAgICAgYmVmb3JlID0gbmV3Q2hbbmV3RW5kSWR4ICsgMV0gPT0gbnVsbCA/IG51bGwgOiBuZXdDaFtuZXdFbmRJZHggKyAxXS5lbG07XG4gICAgICAgICAgICBhZGRWbm9kZXMocGFyZW50RWxtLCBiZWZvcmUsIG5ld0NoLCBuZXdTdGFydElkeCwgbmV3RW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5ld1N0YXJ0SWR4ID4gbmV3RW5kSWR4KSB7XG4gICAgICAgICAgICByZW1vdmVWbm9kZXMocGFyZW50RWxtLCBvbGRDaCwgb2xkU3RhcnRJZHgsIG9sZEVuZElkeCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcGF0Y2hWbm9kZShvbGRWbm9kZSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICB2YXIgaSwgaG9vaztcbiAgICAgICAgaWYgKGlzRGVmKGkgPSB2bm9kZS5kYXRhKSAmJiBpc0RlZihob29rID0gaS5ob29rKSAmJiBpc0RlZihpID0gaG9vay5wcmVwYXRjaCkpIHtcbiAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZWxtID0gdm5vZGUuZWxtID0gb2xkVm5vZGUuZWxtO1xuICAgICAgICB2YXIgb2xkQ2ggPSBvbGRWbm9kZS5jaGlsZHJlbjtcbiAgICAgICAgdmFyIGNoID0gdm5vZGUuY2hpbGRyZW47XG4gICAgICAgIGlmIChvbGRWbm9kZSA9PT0gdm5vZGUpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGlmICh2bm9kZS5kYXRhICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMudXBkYXRlLmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgIGNicy51cGRhdGVbaV0ob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgICAgIGkgPSB2bm9kZS5kYXRhLmhvb2s7XG4gICAgICAgICAgICBpZiAoaXNEZWYoaSkgJiYgaXNEZWYoaSA9IGkudXBkYXRlKSlcbiAgICAgICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzVW5kZWYodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgIGlmIChpc0RlZihvbGRDaCkgJiYgaXNEZWYoY2gpKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9sZENoICE9PSBjaClcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlQ2hpbGRyZW4oZWxtLCBvbGRDaCwgY2gsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0RlZihjaCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoaXNEZWYob2xkVm5vZGUudGV4dCkpXG4gICAgICAgICAgICAgICAgICAgIGFwaS5zZXRUZXh0Q29udGVudChlbG0sICcnKTtcbiAgICAgICAgICAgICAgICBhZGRWbm9kZXMoZWxtLCBudWxsLCBjaCwgMCwgY2gubGVuZ3RoIC0gMSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRGVmKG9sZENoKSkge1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhlbG0sIG9sZENoLCAwLCBvbGRDaC5sZW5ndGggLSAxKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGlzRGVmKG9sZFZub2RlLnRleHQpKSB7XG4gICAgICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgJycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9sZFZub2RlLnRleHQgIT09IHZub2RlLnRleHQpIHtcbiAgICAgICAgICAgIGFwaS5zZXRUZXh0Q29udGVudChlbG0sIHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc0RlZihob29rKSAmJiBpc0RlZihpID0gaG9vay5wb3N0cGF0Y2gpKSB7XG4gICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBhdGNoKG9sZFZub2RlLCB2bm9kZSkge1xuICAgICAgICB2YXIgaSwgZWxtLCBwYXJlbnQ7XG4gICAgICAgIHZhciBpbnNlcnRlZFZub2RlUXVldWUgPSBbXTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5wcmUubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICBjYnMucHJlW2ldKCk7XG4gICAgICAgIGlmICghaXNWbm9kZShvbGRWbm9kZSkpIHtcbiAgICAgICAgICAgIG9sZFZub2RlID0gZW1wdHlOb2RlQXQob2xkVm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzYW1lVm5vZGUob2xkVm5vZGUsIHZub2RlKSkge1xuICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRWbm9kZSwgdm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBlbG0gPSBvbGRWbm9kZS5lbG07XG4gICAgICAgICAgICBwYXJlbnQgPSBhcGkucGFyZW50Tm9kZShlbG0pO1xuICAgICAgICAgICAgY3JlYXRlRWxtKHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgaWYgKHBhcmVudCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGFwaS5pbnNlcnRCZWZvcmUocGFyZW50LCB2bm9kZS5lbG0sIGFwaS5uZXh0U2libGluZyhlbG0pKTtcbiAgICAgICAgICAgICAgICByZW1vdmVWbm9kZXMocGFyZW50LCBbb2xkVm5vZGVdLCAwLCAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgaW5zZXJ0ZWRWbm9kZVF1ZXVlLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWVbaV0uZGF0YS5ob29rLmluc2VydChpbnNlcnRlZFZub2RlUXVldWVbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMucG9zdC5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgIGNicy5wb3N0W2ldKCk7XG4gICAgICAgIHJldHVybiB2bm9kZTtcbiAgICB9O1xufVxuZXhwb3J0cy5pbml0ID0gaW5pdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNuYWJiZG9tLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGhfMSA9IHJlcXVpcmUoXCIuL2hcIik7XG5mdW5jdGlvbiBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmspIHtcbiAgICB0aHVuay5lbG0gPSB2bm9kZS5lbG07XG4gICAgdm5vZGUuZGF0YS5mbiA9IHRodW5rLmRhdGEuZm47XG4gICAgdm5vZGUuZGF0YS5hcmdzID0gdGh1bmsuZGF0YS5hcmdzO1xuICAgIHRodW5rLmRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIHRodW5rLmNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG4gICAgdGh1bmsudGV4dCA9IHZub2RlLnRleHQ7XG4gICAgdGh1bmsuZWxtID0gdm5vZGUuZWxtO1xufVxuZnVuY3Rpb24gaW5pdCh0aHVuaykge1xuICAgIHZhciBjdXIgPSB0aHVuay5kYXRhO1xuICAgIHZhciB2bm9kZSA9IGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGN1ci5hcmdzKTtcbiAgICBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmspO1xufVxuZnVuY3Rpb24gcHJlcGF0Y2gob2xkVm5vZGUsIHRodW5rKSB7XG4gICAgdmFyIGksIG9sZCA9IG9sZFZub2RlLmRhdGEsIGN1ciA9IHRodW5rLmRhdGE7XG4gICAgdmFyIG9sZEFyZ3MgPSBvbGQuYXJncywgYXJncyA9IGN1ci5hcmdzO1xuICAgIGlmIChvbGQuZm4gIT09IGN1ci5mbiB8fCBvbGRBcmdzLmxlbmd0aCAhPT0gYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAob2xkQXJnc1tpXSAhPT0gYXJnc1tpXSkge1xuICAgICAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb3B5VG9UaHVuayhvbGRWbm9kZSwgdGh1bmspO1xufVxuZXhwb3J0cy50aHVuayA9IGZ1bmN0aW9uIHRodW5rKHNlbCwga2V5LCBmbiwgYXJncykge1xuICAgIGlmIChhcmdzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXJncyA9IGZuO1xuICAgICAgICBmbiA9IGtleTtcbiAgICAgICAga2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gaF8xLmgoc2VsLCB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBob29rOiB7IGluaXQ6IGluaXQsIHByZXBhdGNoOiBwcmVwYXRjaCB9LFxuICAgICAgICBmbjogZm4sXG4gICAgICAgIGFyZ3M6IGFyZ3NcbiAgICB9KTtcbn07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLnRodW5rO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGh1bmsuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdm5vZGVfMSA9IHJlcXVpcmUoXCIuL3Zub2RlXCIpO1xudmFyIGh0bWxkb21hcGlfMSA9IHJlcXVpcmUoXCIuL2h0bWxkb21hcGlcIik7XG5mdW5jdGlvbiB0b1ZOb2RlKG5vZGUsIGRvbUFwaSkge1xuICAgIHZhciBhcGkgPSBkb21BcGkgIT09IHVuZGVmaW5lZCA/IGRvbUFwaSA6IGh0bWxkb21hcGlfMS5kZWZhdWx0O1xuICAgIHZhciB0ZXh0O1xuICAgIGlmIChhcGkuaXNFbGVtZW50KG5vZGUpKSB7XG4gICAgICAgIHZhciBpZCA9IG5vZGUuaWQgPyAnIycgKyBub2RlLmlkIDogJyc7XG4gICAgICAgIHZhciBjbiA9IG5vZGUuZ2V0QXR0cmlidXRlKCdjbGFzcycpO1xuICAgICAgICB2YXIgYyA9IGNuID8gJy4nICsgY24uc3BsaXQoJyAnKS5qb2luKCcuJykgOiAnJztcbiAgICAgICAgdmFyIHNlbCA9IGFwaS50YWdOYW1lKG5vZGUpLnRvTG93ZXJDYXNlKCkgKyBpZCArIGM7XG4gICAgICAgIHZhciBhdHRycyA9IHt9O1xuICAgICAgICB2YXIgY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgdmFyIG5hbWVfMTtcbiAgICAgICAgdmFyIGkgPSB2b2lkIDAsIG4gPSB2b2lkIDA7XG4gICAgICAgIHZhciBlbG1BdHRycyA9IG5vZGUuYXR0cmlidXRlcztcbiAgICAgICAgdmFyIGVsbUNoaWxkcmVuID0gbm9kZS5jaGlsZE5vZGVzO1xuICAgICAgICBmb3IgKGkgPSAwLCBuID0gZWxtQXR0cnMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBuYW1lXzEgPSBlbG1BdHRyc1tpXS5ub2RlTmFtZTtcbiAgICAgICAgICAgIGlmIChuYW1lXzEgIT09ICdpZCcgJiYgbmFtZV8xICE9PSAnY2xhc3MnKSB7XG4gICAgICAgICAgICAgICAgYXR0cnNbbmFtZV8xXSA9IGVsbUF0dHJzW2ldLm5vZGVWYWx1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwLCBuID0gZWxtQ2hpbGRyZW4ubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBjaGlsZHJlbi5wdXNoKHRvVk5vZGUoZWxtQ2hpbGRyZW5baV0pKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KHNlbCwgeyBhdHRyczogYXR0cnMgfSwgY2hpbGRyZW4sIHVuZGVmaW5lZCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGFwaS5pc1RleHQobm9kZSkpIHtcbiAgICAgICAgdGV4dCA9IGFwaS5nZXRUZXh0Q29udGVudChub2RlKTtcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB0ZXh0LCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYXBpLmlzQ29tbWVudChub2RlKSkge1xuICAgICAgICB0ZXh0ID0gYXBpLmdldFRleHRDb250ZW50KG5vZGUpO1xuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KCchJywge30sIFtdLCB0ZXh0LCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQoJycsIHt9LCBbXSwgdW5kZWZpbmVkLCBub2RlKTtcbiAgICB9XG59XG5leHBvcnRzLnRvVk5vZGUgPSB0b1ZOb2RlO1xuZXhwb3J0cy5kZWZhdWx0ID0gdG9WTm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRvdm5vZGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB2bm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCBlbG0pIHtcbiAgICB2YXIga2V5ID0gZGF0YSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogZGF0YS5rZXk7XG4gICAgcmV0dXJuIHsgc2VsOiBzZWwsIGRhdGE6IGRhdGEsIGNoaWxkcmVuOiBjaGlsZHJlbixcbiAgICAgICAgdGV4dDogdGV4dCwgZWxtOiBlbG0sIGtleToga2V5IH07XG59XG5leHBvcnRzLnZub2RlID0gdm5vZGU7XG5leHBvcnRzLmRlZmF1bHQgPSB2bm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZub2RlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBpbnRlcm5hbHNfMSA9IHJlcXVpcmUoXCIuL2ludGVybmFsc1wiKTtcbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHByZXBhcmVzIHRoZSBDeWNsZSBhcHBsaWNhdGlvbiB0byBiZSBleGVjdXRlZC4gVGFrZXMgYSBgbWFpbmBcbiAqIGZ1bmN0aW9uIGFuZCBwcmVwYXJlcyB0byBjaXJjdWxhcmx5IGNvbm5lY3RzIGl0IHRvIHRoZSBnaXZlbiBjb2xsZWN0aW9uIG9mXG4gKiBkcml2ZXIgZnVuY3Rpb25zLiBBcyBhbiBvdXRwdXQsIGBzZXR1cCgpYCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRocmVlXG4gKiBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kIGBydW5gLiBPbmx5IHdoZW4gYHJ1bigpYCBpcyBjYWxsZWQgd2lsbFxuICogdGhlIGFwcGxpY2F0aW9uIGFjdHVhbGx5IGV4ZWN1dGUuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGBydW4oKWAgZm9yXG4gKiBtb3JlIGRldGFpbHMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtzZXR1cH0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgc2lua3MsIHJ1bn0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogY29uc3QgZGlzcG9zZSA9IHJ1bigpOyAvLyBFeGVjdXRlcyB0aGUgYXBwbGljYXRpb25cbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgc2lua3NgIGFuZFxuICogYHJ1bmAuIGBzb3VyY2VzYCBpcyB0aGUgY29sbGVjdGlvbiBvZiBkcml2ZXIgc291cmNlcywgYHNpbmtzYCBpcyB0aGVcbiAqIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNpbmtzLCB0aGVzZSBjYW4gYmUgdXNlZCBmb3IgZGVidWdnaW5nIG9yIHRlc3RpbmcuIGBydW5gXG4gKiBpcyB0aGUgZnVuY3Rpb24gdGhhdCBvbmNlIGNhbGxlZCB3aWxsIGV4ZWN1dGUgdGhlIGFwcGxpY2F0aW9uLlxuICogQGZ1bmN0aW9uIHNldHVwXG4gKi9cbmZ1bmN0aW9uIHNldHVwKG1haW4sIGRyaXZlcnMpIHtcbiAgICBpZiAodHlwZW9mIG1haW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIHRoZSAnbWFpbicgXCIgKyBcImZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMuXCIpO1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWxzXzEuaXNPYmplY3RFbXB0eShkcml2ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGF0IGxlYXN0IG9uZSBkcml2ZXIgZnVuY3Rpb24gZGVjbGFyZWQgYXMgYSBwcm9wZXJ0eS5cIik7XG4gICAgfVxuICAgIHZhciBlbmdpbmUgPSBzZXR1cFJldXNhYmxlKGRyaXZlcnMpO1xuICAgIHZhciBzaW5rcyA9IG1haW4oZW5naW5lLnNvdXJjZXMpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcyA9IHdpbmRvdy5DeWNsZWpzIHx8IHt9O1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcy5zaW5rcyA9IHNpbmtzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcnVuKCkge1xuICAgICAgICB2YXIgZGlzcG9zZVJ1biA9IGVuZ2luZS5ydW4oc2lua3MpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgICAgIGRpc3Bvc2VSdW4oKTtcbiAgICAgICAgICAgIGVuZ2luZS5kaXNwb3NlKCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNpbmtzOiBzaW5rcywgc291cmNlczogZW5naW5lLnNvdXJjZXMsIHJ1bjogX3J1biB9O1xufVxuZXhwb3J0cy5zZXR1cCA9IHNldHVwO1xuLyoqXG4gKiBBIHBhcnRpYWxseS1hcHBsaWVkIHZhcmlhbnQgb2Ygc2V0dXAoKSB3aGljaCBhY2NlcHRzIG9ubHkgdGhlIGRyaXZlcnMsIGFuZFxuICogYWxsb3dzIG1hbnkgYG1haW5gIGZ1bmN0aW9ucyB0byBleGVjdXRlIGFuZCByZXVzZSB0aGlzIHNhbWUgc2V0IG9mIGRyaXZlcnMuXG4gKlxuICogVGFrZXMgYW4gb2JqZWN0IHdpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBpbnB1dCwgYW5kIG91dHB1dHMgYW4gb2JqZWN0IHdoaWNoXG4gKiBjb250YWlucyB0aGUgZ2VuZXJhdGVkIHNvdXJjZXMgKGZyb20gdGhvc2UgZHJpdmVycykgYW5kIGEgYHJ1bmAgZnVuY3Rpb25cbiAqICh3aGljaCBpbiB0dXJuIGV4cGVjdHMgc2lua3MgYXMgYXJndW1lbnQpLiBUaGlzIGBydW5gIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWRcbiAqIG11bHRpcGxlIHRpbWVzIHdpdGggZGlmZmVyZW50IGFyZ3VtZW50cywgYW5kIGl0IHdpbGwgcmV1c2UgdGhlIGRyaXZlcnMgdGhhdFxuICogd2VyZSBwYXNzZWQgdG8gYHNldHVwUmV1c2FibGVgLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYGBganNcbiAqIGltcG9ydCB7c2V0dXBSZXVzYWJsZX0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgcnVuLCBkaXNwb3NlfSA9IHNldHVwUmV1c2FibGUoZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGNvbnN0IHNpbmtzID0gbWFpbihzb3VyY2VzKTtcbiAqIGNvbnN0IGRpc3Bvc2VSdW4gPSBydW4oc2lua3MpO1xuICogLy8gLi4uXG4gKiBkaXNwb3NlUnVuKCk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTsgLy8gZW5kcyB0aGUgcmV1c2FiaWxpdHkgb2YgZHJpdmVyc1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgcnVuYCBhbmRcbiAqIGBkaXNwb3NlYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgcnVuYCBpcyB0aGVcbiAqIGZ1bmN0aW9uIHRoYXQgb25jZSBjYWxsZWQgd2l0aCAnc2lua3MnIGFzIGFyZ3VtZW50LCB3aWxsIGV4ZWN1dGUgdGhlXG4gKiBhcHBsaWNhdGlvbiwgdHlpbmcgdG9nZXRoZXIgc291cmNlcyB3aXRoIHNpbmtzLiBgZGlzcG9zZWAgdGVybWluYXRlcyB0aGVcbiAqIHJldXNhYmxlIHJlc291cmNlcyB1c2VkIGJ5IHRoZSBkcml2ZXJzLiBOb3RlIGFsc28gdGhhdCBgcnVuYCByZXR1cm5zIGFcbiAqIGRpc3Bvc2UgZnVuY3Rpb24gd2hpY2ggdGVybWluYXRlcyByZXNvdXJjZXMgdGhhdCBhcmUgc3BlY2lmaWMgKG5vdCByZXVzYWJsZSlcbiAqIHRvIHRoYXQgcnVuLlxuICogQGZ1bmN0aW9uIHNldHVwUmV1c2FibGVcbiAqL1xuZnVuY3Rpb24gc2V0dXBSZXVzYWJsZShkcml2ZXJzKSB7XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBwcm9wZXJ0aWVzLlwiKTtcbiAgICB9XG4gICAgaWYgKGludGVybmFsc18xLmlzT2JqZWN0RW1wdHkoZHJpdmVycykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIHNpbmtQcm94aWVzID0gaW50ZXJuYWxzXzEubWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpO1xuICAgIHZhciByYXdTb3VyY2VzID0gaW50ZXJuYWxzXzEuY2FsbERyaXZlcnMoZHJpdmVycywgc2lua1Byb3hpZXMpO1xuICAgIHZhciBzb3VyY2VzID0gaW50ZXJuYWxzXzEuYWRhcHRTb3VyY2VzKHJhd1NvdXJjZXMpO1xuICAgIGZ1bmN0aW9uIF9ydW4oc2lua3MpIHtcbiAgICAgICAgcmV0dXJuIGludGVybmFsc18xLnJlcGxpY2F0ZU1hbnkoc2lua3MsIHNpbmtQcm94aWVzKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcG9zZUVuZ2luZSgpIHtcbiAgICAgICAgaW50ZXJuYWxzXzEuZGlzcG9zZVNvdXJjZXMoc291cmNlcyk7XG4gICAgICAgIGludGVybmFsc18xLmRpc3Bvc2VTaW5rUHJveGllcyhzaW5rUHJveGllcyk7XG4gICAgfVxuICAgIHJldHVybiB7IHNvdXJjZXM6IHNvdXJjZXMsIHJ1bjogX3J1biwgZGlzcG9zZTogZGlzcG9zZUVuZ2luZSB9O1xufVxuZXhwb3J0cy5zZXR1cFJldXNhYmxlID0gc2V0dXBSZXVzYWJsZTtcbi8qKlxuICogVGFrZXMgYSBgbWFpbmAgZnVuY3Rpb24gYW5kIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb25cbiAqIG9mIGRyaXZlciBmdW5jdGlvbnMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHJ1biBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IGRpc3Bvc2UgPSBydW4obWFpbiwgZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTtcbiAqIGBgYFxuICpcbiAqIFRoZSBgbWFpbmAgZnVuY3Rpb24gZXhwZWN0cyBhIGNvbGxlY3Rpb24gb2YgXCJzb3VyY2VcIiBzdHJlYW1zIChyZXR1cm5lZCBmcm9tXG4gKiBkcml2ZXJzKSBhcyBpbnB1dCwgYW5kIHNob3VsZCByZXR1cm4gYSBjb2xsZWN0aW9uIG9mIFwic2lua1wiIHN0cmVhbXMgKHRvIGJlXG4gKiBnaXZlbiB0byBkcml2ZXJzKS4gQSBcImNvbGxlY3Rpb24gb2Ygc3RyZWFtc1wiIGlzIGEgSmF2YVNjcmlwdCBvYmplY3Qgd2hlcmVcbiAqIGtleXMgbWF0Y2ggdGhlIGRyaXZlciBuYW1lcyByZWdpc3RlcmVkIGJ5IHRoZSBgZHJpdmVyc2Agb2JqZWN0LCBhbmQgdmFsdWVzXG4gKiBhcmUgdGhlIHN0cmVhbXMuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGVhY2ggZHJpdmVyIHRvIHNlZSBtb3JlXG4gKiBkZXRhaWxzIG9uIHdoYXQgdHlwZXMgb2Ygc291cmNlcyBpdCBvdXRwdXRzIGFuZCBzaW5rcyBpdCByZWNlaXZlcy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgZGlzcG9zZSBmdW5jdGlvbiwgdXNlZCB0byB0ZXJtaW5hdGUgdGhlIGV4ZWN1dGlvbiBvZiB0aGVcbiAqIEN5Y2xlLmpzIHByb2dyYW0sIGNsZWFuaW5nIHVwIHJlc291cmNlcyB1c2VkLlxuICogQGZ1bmN0aW9uIHJ1blxuICovXG5mdW5jdGlvbiBydW4obWFpbiwgZHJpdmVycykge1xuICAgIHZhciBwcm9ncmFtID0gc2V0dXAobWFpbiwgZHJpdmVycyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgIHdpbmRvd1snQ3ljbGVqc0RldlRvb2xfc3RhcnRHcmFwaFNlcmlhbGl6ZXInXSkge1xuICAgICAgICB3aW5kb3dbJ0N5Y2xlanNEZXZUb29sX3N0YXJ0R3JhcGhTZXJpYWxpemVyJ10ocHJvZ3JhbS5zaW5rcyk7XG4gICAgfVxuICAgIHJldHVybiBwcm9ncmFtLnJ1bigpO1xufVxuZXhwb3J0cy5ydW4gPSBydW47XG5leHBvcnRzLmRlZmF1bHQgPSBydW47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBxdWlja3Rhc2tfMSA9IHJlcXVpcmUoXCJxdWlja3Rhc2tcIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCIuL2FkYXB0XCIpO1xudmFyIHNjaGVkdWxlTWljcm90YXNrID0gcXVpY2t0YXNrXzEuZGVmYXVsdCgpO1xuZnVuY3Rpb24gbWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpIHtcbiAgICB2YXIgc2lua1Byb3hpZXMgPSB7fTtcbiAgICBmb3IgKHZhciBuYW1lXzEgaW4gZHJpdmVycykge1xuICAgICAgICBpZiAoZHJpdmVycy5oYXNPd25Qcm9wZXJ0eShuYW1lXzEpKSB7XG4gICAgICAgICAgICBzaW5rUHJveGllc1tuYW1lXzFdID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNpbmtQcm94aWVzO1xufVxuZXhwb3J0cy5tYWtlU2lua1Byb3hpZXMgPSBtYWtlU2lua1Byb3hpZXM7XG5mdW5jdGlvbiBjYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgbmFtZV8yIGluIGRyaXZlcnMpIHtcbiAgICAgICAgaWYgKGRyaXZlcnMuaGFzT3duUHJvcGVydHkobmFtZV8yKSkge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdID0gZHJpdmVyc1tuYW1lXzJdKHNpbmtQcm94aWVzW25hbWVfMl0sIG5hbWVfMik7XG4gICAgICAgICAgICBpZiAoc291cmNlc1tuYW1lXzJdICYmIHR5cGVvZiBzb3VyY2VzW25hbWVfMl0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdLl9pc0N5Y2xlU291cmNlID0gbmFtZV8yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5jYWxsRHJpdmVycyA9IGNhbGxEcml2ZXJzO1xuLy8gTk9URTogdGhpcyB3aWxsIG11dGF0ZSBgc291cmNlc2AuXG5mdW5jdGlvbiBhZGFwdFNvdXJjZXMoc291cmNlcykge1xuICAgIGZvciAodmFyIG5hbWVfMyBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KG5hbWVfMykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSAmJlxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZXNbbmFtZV8zXVsnc2hhbWVmdWxseVNlbmROZXh0J10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSA9IGFkYXB0XzEuYWRhcHQoc291cmNlc1tuYW1lXzNdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlcztcbn1cbmV4cG9ydHMuYWRhcHRTb3VyY2VzID0gYWRhcHRTb3VyY2VzO1xuZnVuY3Rpb24gcmVwbGljYXRlTWFueShzaW5rcywgc2lua1Byb3hpZXMpIHtcbiAgICB2YXIgc2lua05hbWVzID0gT2JqZWN0LmtleXMoc2lua3MpLmZpbHRlcihmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gISFzaW5rUHJveGllc1tuYW1lXTsgfSk7XG4gICAgdmFyIGJ1ZmZlcnMgPSB7fTtcbiAgICB2YXIgcmVwbGljYXRvcnMgPSB7fTtcbiAgICBzaW5rTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBidWZmZXJzW25hbWVdID0geyBfbjogW10sIF9lOiBbXSB9O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXSA9IHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uICh4KSB7IHJldHVybiBidWZmZXJzW25hbWVdLl9uLnB1c2goeCk7IH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikgeyByZXR1cm4gYnVmZmVyc1tuYW1lXS5fZS5wdXNoKGVycik7IH0sXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciBzdWJzY3JpcHRpb25zID0gc2lua05hbWVzLm1hcChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2lua3NbbmFtZV0pLnN1YnNjcmliZShyZXBsaWNhdG9yc1tuYW1lXSk7XG4gICAgfSk7XG4gICAgc2lua05hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVyID0gc2lua1Byb3hpZXNbbmFtZV07XG4gICAgICAgIHZhciBuZXh0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHNjaGVkdWxlTWljcm90YXNrKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGxpc3RlbmVyLl9uKHgpOyB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgc2NoZWR1bGVNaWNyb3Rhc2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIChjb25zb2xlLmVycm9yIHx8IGNvbnNvbGUubG9nKShlcnIpO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLl9lKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgYnVmZmVyc1tuYW1lXS5fbi5mb3JFYWNoKG5leHQpO1xuICAgICAgICBidWZmZXJzW25hbWVdLl9lLmZvckVhY2goZXJyb3IpO1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5uZXh0ID0gbmV4dDtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uZXJyb3IgPSBlcnJvcjtcbiAgICAgICAgLy8gYmVjYXVzZSBzaW5rLnN1YnNjcmliZShyZXBsaWNhdG9yKSBoYWQgbXV0YXRlZCByZXBsaWNhdG9yIHRvIGFkZFxuICAgICAgICAvLyBfbiwgX2UsIF9jLCB3ZSBtdXN0IGFsc28gdXBkYXRlIHRoZXNlOlxuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5fbiA9IG5leHQ7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLl9lID0gZXJyb3I7XG4gICAgfSk7XG4gICAgYnVmZmVycyA9IG51bGw7IC8vIGZyZWUgdXAgZm9yIEdDXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGRpc3Bvc2VSZXBsaWNhdGlvbigpIHtcbiAgICAgICAgc3Vic2NyaXB0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnVuc3Vic2NyaWJlKCk7IH0pO1xuICAgIH07XG59XG5leHBvcnRzLnJlcGxpY2F0ZU1hbnkgPSByZXBsaWNhdGVNYW55O1xuZnVuY3Rpb24gZGlzcG9zZVNpbmtQcm94aWVzKHNpbmtQcm94aWVzKSB7XG4gICAgT2JqZWN0LmtleXMoc2lua1Byb3hpZXMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIHNpbmtQcm94aWVzW25hbWVdLl9jKCk7IH0pO1xufVxuZXhwb3J0cy5kaXNwb3NlU2lua1Byb3hpZXMgPSBkaXNwb3NlU2lua1Byb3hpZXM7XG5mdW5jdGlvbiBkaXNwb3NlU291cmNlcyhzb3VyY2VzKSB7XG4gICAgZm9yICh2YXIgayBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KGspICYmXG4gICAgICAgICAgICBzb3VyY2VzW2tdICYmXG4gICAgICAgICAgICBzb3VyY2VzW2tdLmRpc3Bvc2UpIHtcbiAgICAgICAgICAgIHNvdXJjZXNba10uZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5kaXNwb3NlU291cmNlcyA9IGRpc3Bvc2VTb3VyY2VzO1xuZnVuY3Rpb24gaXNPYmplY3RFbXB0eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG59XG5leHBvcnRzLmlzT2JqZWN0RW1wdHkgPSBpc09iamVjdEVtcHR5O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW50ZXJuYWxzLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNvcHkgICAgICAgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC9jb3B5JylcbiAgLCBub3JtYWxpemVPcHRpb25zID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3Qvbm9ybWFsaXplLW9wdGlvbnMnKVxuICAsIGVuc3VyZUNhbGxhYmxlICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZScpXG4gICwgbWFwICAgICAgICAgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L21hcCcpXG4gICwgY2FsbGFibGUgICAgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3ZhbGlkLWNhbGxhYmxlJylcbiAgLCB2YWxpZFZhbHVlICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvdmFsaWQtdmFsdWUnKVxuXG4gICwgYmluZCA9IEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kLCBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eVxuICAsIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eVxuICAsIGRlZmluZTtcblxuZGVmaW5lID0gZnVuY3Rpb24gKG5hbWUsIGRlc2MsIG9wdGlvbnMpIHtcblx0dmFyIHZhbHVlID0gdmFsaWRWYWx1ZShkZXNjKSAmJiBjYWxsYWJsZShkZXNjLnZhbHVlKSwgZGdzO1xuXHRkZ3MgPSBjb3B5KGRlc2MpO1xuXHRkZWxldGUgZGdzLndyaXRhYmxlO1xuXHRkZWxldGUgZGdzLnZhbHVlO1xuXHRkZ3MuZ2V0ID0gZnVuY3Rpb24gKCkge1xuXHRcdGlmICghb3B0aW9ucy5vdmVyd3JpdGVEZWZpbml0aW9uICYmIGhhc093blByb3BlcnR5LmNhbGwodGhpcywgbmFtZSkpIHJldHVybiB2YWx1ZTtcblx0XHRkZXNjLnZhbHVlID0gYmluZC5jYWxsKHZhbHVlLCBvcHRpb25zLnJlc29sdmVDb250ZXh0ID8gb3B0aW9ucy5yZXNvbHZlQ29udGV4dCh0aGlzKSA6IHRoaXMpO1xuXHRcdGRlZmluZVByb3BlcnR5KHRoaXMsIG5hbWUsIGRlc2MpO1xuXHRcdHJldHVybiB0aGlzW25hbWVdO1xuXHR9O1xuXHRyZXR1cm4gZGdzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocHJvcHMvKiwgb3B0aW9ucyovKSB7XG5cdHZhciBvcHRpb25zID0gbm9ybWFsaXplT3B0aW9ucyhhcmd1bWVudHNbMV0pO1xuXHRpZiAob3B0aW9ucy5yZXNvbHZlQ29udGV4dCAhPSBudWxsKSBlbnN1cmVDYWxsYWJsZShvcHRpb25zLnJlc29sdmVDb250ZXh0KTtcblx0cmV0dXJuIG1hcChwcm9wcywgZnVuY3Rpb24gKGRlc2MsIG5hbWUpIHsgcmV0dXJuIGRlZmluZShuYW1lLCBkZXNjLCBvcHRpb25zKTsgfSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgYXNzaWduICAgICAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L2Fzc2lnbicpXG4gICwgbm9ybWFsaXplT3B0cyA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L25vcm1hbGl6ZS1vcHRpb25zJylcbiAgLCBpc0NhbGxhYmxlICAgID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvaXMtY2FsbGFibGUnKVxuICAsIGNvbnRhaW5zICAgICAgPSByZXF1aXJlKCdlczUtZXh0L3N0cmluZy8jL2NvbnRhaW5zJylcblxuICAsIGQ7XG5cbmQgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChkc2NyLCB2YWx1ZS8qLCBvcHRpb25zKi8pIHtcblx0dmFyIGMsIGUsIHcsIG9wdGlvbnMsIGRlc2M7XG5cdGlmICgoYXJndW1lbnRzLmxlbmd0aCA8IDIpIHx8ICh0eXBlb2YgZHNjciAhPT0gJ3N0cmluZycpKSB7XG5cdFx0b3B0aW9ucyA9IHZhbHVlO1xuXHRcdHZhbHVlID0gZHNjcjtcblx0XHRkc2NyID0gbnVsbDtcblx0fSBlbHNlIHtcblx0XHRvcHRpb25zID0gYXJndW1lbnRzWzJdO1xuXHR9XG5cdGlmIChkc2NyID09IG51bGwpIHtcblx0XHRjID0gdyA9IHRydWU7XG5cdFx0ZSA9IGZhbHNlO1xuXHR9IGVsc2Uge1xuXHRcdGMgPSBjb250YWlucy5jYWxsKGRzY3IsICdjJyk7XG5cdFx0ZSA9IGNvbnRhaW5zLmNhbGwoZHNjciwgJ2UnKTtcblx0XHR3ID0gY29udGFpbnMuY2FsbChkc2NyLCAndycpO1xuXHR9XG5cblx0ZGVzYyA9IHsgdmFsdWU6IHZhbHVlLCBjb25maWd1cmFibGU6IGMsIGVudW1lcmFibGU6IGUsIHdyaXRhYmxlOiB3IH07XG5cdHJldHVybiAhb3B0aW9ucyA/IGRlc2MgOiBhc3NpZ24obm9ybWFsaXplT3B0cyhvcHRpb25zKSwgZGVzYyk7XG59O1xuXG5kLmdzID0gZnVuY3Rpb24gKGRzY3IsIGdldCwgc2V0LyosIG9wdGlvbnMqLykge1xuXHR2YXIgYywgZSwgb3B0aW9ucywgZGVzYztcblx0aWYgKHR5cGVvZiBkc2NyICE9PSAnc3RyaW5nJykge1xuXHRcdG9wdGlvbnMgPSBzZXQ7XG5cdFx0c2V0ID0gZ2V0O1xuXHRcdGdldCA9IGRzY3I7XG5cdFx0ZHNjciA9IG51bGw7XG5cdH0gZWxzZSB7XG5cdFx0b3B0aW9ucyA9IGFyZ3VtZW50c1szXTtcblx0fVxuXHRpZiAoZ2V0ID09IG51bGwpIHtcblx0XHRnZXQgPSB1bmRlZmluZWQ7XG5cdH0gZWxzZSBpZiAoIWlzQ2FsbGFibGUoZ2V0KSkge1xuXHRcdG9wdGlvbnMgPSBnZXQ7XG5cdFx0Z2V0ID0gc2V0ID0gdW5kZWZpbmVkO1xuXHR9IGVsc2UgaWYgKHNldCA9PSBudWxsKSB7XG5cdFx0c2V0ID0gdW5kZWZpbmVkO1xuXHR9IGVsc2UgaWYgKCFpc0NhbGxhYmxlKHNldCkpIHtcblx0XHRvcHRpb25zID0gc2V0O1xuXHRcdHNldCA9IHVuZGVmaW5lZDtcblx0fVxuXHRpZiAoZHNjciA9PSBudWxsKSB7XG5cdFx0YyA9IHRydWU7XG5cdFx0ZSA9IGZhbHNlO1xuXHR9IGVsc2Uge1xuXHRcdGMgPSBjb250YWlucy5jYWxsKGRzY3IsICdjJyk7XG5cdFx0ZSA9IGNvbnRhaW5zLmNhbGwoZHNjciwgJ2UnKTtcblx0fVxuXG5cdGRlc2MgPSB7IGdldDogZ2V0LCBzZXQ6IHNldCwgY29uZmlndXJhYmxlOiBjLCBlbnVtZXJhYmxlOiBlIH07XG5cdHJldHVybiAhb3B0aW9ucyA/IGRlc2MgOiBhc3NpZ24obm9ybWFsaXplT3B0cyhvcHRpb25zKSwgZGVzYyk7XG59O1xuIiwiLy8gSW5zcGlyZWQgYnkgR29vZ2xlIENsb3N1cmU6XG4vLyBodHRwOi8vY2xvc3VyZS1saWJyYXJ5Lmdvb2dsZWNvZGUuY29tL3N2bi9kb2NzL1xuLy8gY2xvc3VyZV9nb29nX2FycmF5X2FycmF5LmpzLmh0bWwjZ29vZy5hcnJheS5jbGVhclxuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIHZhbHVlID0gcmVxdWlyZShcIi4uLy4uL29iamVjdC92YWxpZC12YWx1ZVwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7XG5cdHZhbHVlKHRoaXMpLmxlbmd0aCA9IDA7XG5cdHJldHVybiB0aGlzO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgbnVtYmVySXNOYU4gICAgICAgPSByZXF1aXJlKFwiLi4vLi4vbnVtYmVyL2lzLW5hblwiKVxuICAsIHRvUG9zSW50ICAgICAgICAgID0gcmVxdWlyZShcIi4uLy4uL251bWJlci90by1wb3MtaW50ZWdlclwiKVxuICAsIHZhbHVlICAgICAgICAgICAgID0gcmVxdWlyZShcIi4uLy4uL29iamVjdC92YWxpZC12YWx1ZVwiKVxuICAsIGluZGV4T2YgICAgICAgICAgID0gQXJyYXkucHJvdG90eXBlLmluZGV4T2ZcbiAgLCBvYmpIYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBhYnMgICAgICAgICAgICAgICA9IE1hdGguYWJzXG4gICwgZmxvb3IgICAgICAgICAgICAgPSBNYXRoLmZsb29yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzZWFyY2hFbGVtZW50IC8qLCBmcm9tSW5kZXgqLykge1xuXHR2YXIgaSwgbGVuZ3RoLCBmcm9tSW5kZXgsIHZhbDtcblx0aWYgKCFudW1iZXJJc05hTihzZWFyY2hFbGVtZW50KSkgcmV0dXJuIGluZGV4T2YuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuXHRsZW5ndGggPSB0b1Bvc0ludCh2YWx1ZSh0aGlzKS5sZW5ndGgpO1xuXHRmcm9tSW5kZXggPSBhcmd1bWVudHNbMV07XG5cdGlmIChpc05hTihmcm9tSW5kZXgpKSBmcm9tSW5kZXggPSAwO1xuXHRlbHNlIGlmIChmcm9tSW5kZXggPj0gMCkgZnJvbUluZGV4ID0gZmxvb3IoZnJvbUluZGV4KTtcblx0ZWxzZSBmcm9tSW5kZXggPSB0b1Bvc0ludCh0aGlzLmxlbmd0aCkgLSBmbG9vcihhYnMoZnJvbUluZGV4KSk7XG5cblx0Zm9yIChpID0gZnJvbUluZGV4OyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0XHRpZiAob2JqSGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCBpKSkge1xuXHRcdFx0dmFsID0gdGhpc1tpXTtcblx0XHRcdGlmIChudW1iZXJJc05hTih2YWwpKSByZXR1cm4gaTsgLy8gSnNsaW50OiBpZ25vcmVcblx0XHR9XG5cdH1cblx0cmV0dXJuIC0xO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCIuL2lzLWltcGxlbWVudGVkXCIpKClcblx0PyBBcnJheS5mcm9tXG5cdDogcmVxdWlyZShcIi4vc2hpbVwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIGZyb20gPSBBcnJheS5mcm9tLCBhcnIsIHJlc3VsdDtcblx0aWYgKHR5cGVvZiBmcm9tICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxzZTtcblx0YXJyID0gW1wicmF6XCIsIFwiZHdhXCJdO1xuXHRyZXN1bHQgPSBmcm9tKGFycik7XG5cdHJldHVybiBCb29sZWFuKHJlc3VsdCAmJiAocmVzdWx0ICE9PSBhcnIpICYmIChyZXN1bHRbMV0gPT09IFwiZHdhXCIpKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGl0ZXJhdG9yU3ltYm9sID0gcmVxdWlyZShcImVzNi1zeW1ib2xcIikuaXRlcmF0b3JcbiAgLCBpc0FyZ3VtZW50cyAgICA9IHJlcXVpcmUoXCIuLi8uLi9mdW5jdGlvbi9pcy1hcmd1bWVudHNcIilcbiAgLCBpc0Z1bmN0aW9uICAgICA9IHJlcXVpcmUoXCIuLi8uLi9mdW5jdGlvbi9pcy1mdW5jdGlvblwiKVxuICAsIHRvUG9zSW50ICAgICAgID0gcmVxdWlyZShcIi4uLy4uL251bWJlci90by1wb3MtaW50ZWdlclwiKVxuICAsIGNhbGxhYmxlICAgICAgID0gcmVxdWlyZShcIi4uLy4uL29iamVjdC92YWxpZC1jYWxsYWJsZVwiKVxuICAsIHZhbGlkVmFsdWUgICAgID0gcmVxdWlyZShcIi4uLy4uL29iamVjdC92YWxpZC12YWx1ZVwiKVxuICAsIGlzVmFsdWUgICAgICAgID0gcmVxdWlyZShcIi4uLy4uL29iamVjdC9pcy12YWx1ZVwiKVxuICAsIGlzU3RyaW5nICAgICAgID0gcmVxdWlyZShcIi4uLy4uL3N0cmluZy9pcy1zdHJpbmdcIilcbiAgLCBpc0FycmF5ICAgICAgICA9IEFycmF5LmlzQXJyYXlcbiAgLCBjYWxsICAgICAgICAgICA9IEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsXG4gICwgZGVzYyAgICAgICAgICAgPSB7IGNvbmZpZ3VyYWJsZTogdHJ1ZSwgZW51bWVyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUsIHZhbHVlOiBudWxsIH1cbiAgLCBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGNvbXBsZXhpdHlcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFycmF5TGlrZSAvKiwgbWFwRm4sIHRoaXNBcmcqLykge1xuXHR2YXIgbWFwRm4gPSBhcmd1bWVudHNbMV1cblx0ICAsIHRoaXNBcmcgPSBhcmd1bWVudHNbMl1cblx0ICAsIENvbnRleHRcblx0ICAsIGlcblx0ICAsIGpcblx0ICAsIGFyclxuXHQgICwgbGVuZ3RoXG5cdCAgLCBjb2RlXG5cdCAgLCBpdGVyYXRvclxuXHQgICwgcmVzdWx0XG5cdCAgLCBnZXRJdGVyYXRvclxuXHQgICwgdmFsdWU7XG5cblx0YXJyYXlMaWtlID0gT2JqZWN0KHZhbGlkVmFsdWUoYXJyYXlMaWtlKSk7XG5cblx0aWYgKGlzVmFsdWUobWFwRm4pKSBjYWxsYWJsZShtYXBGbik7XG5cdGlmICghdGhpcyB8fCB0aGlzID09PSBBcnJheSB8fCAhaXNGdW5jdGlvbih0aGlzKSkge1xuXHRcdC8vIFJlc3VsdDogUGxhaW4gYXJyYXlcblx0XHRpZiAoIW1hcEZuKSB7XG5cdFx0XHRpZiAoaXNBcmd1bWVudHMoYXJyYXlMaWtlKSkge1xuXHRcdFx0XHQvLyBTb3VyY2U6IEFyZ3VtZW50c1xuXHRcdFx0XHRsZW5ndGggPSBhcnJheUxpa2UubGVuZ3RoO1xuXHRcdFx0XHRpZiAobGVuZ3RoICE9PSAxKSByZXR1cm4gQXJyYXkuYXBwbHkobnVsbCwgYXJyYXlMaWtlKTtcblx0XHRcdFx0YXJyID0gbmV3IEFycmF5KDEpO1xuXHRcdFx0XHRhcnJbMF0gPSBhcnJheUxpa2VbMF07XG5cdFx0XHRcdHJldHVybiBhcnI7XG5cdFx0XHR9XG5cdFx0XHRpZiAoaXNBcnJheShhcnJheUxpa2UpKSB7XG5cdFx0XHRcdC8vIFNvdXJjZTogQXJyYXlcblx0XHRcdFx0YXJyID0gbmV3IEFycmF5KGxlbmd0aCA9IGFycmF5TGlrZS5sZW5ndGgpO1xuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIGFycltpXSA9IGFycmF5TGlrZVtpXTtcblx0XHRcdFx0cmV0dXJuIGFycjtcblx0XHRcdH1cblx0XHR9XG5cdFx0YXJyID0gW107XG5cdH0gZWxzZSB7XG5cdFx0Ly8gUmVzdWx0OiBOb24gcGxhaW4gYXJyYXlcblx0XHRDb250ZXh0ID0gdGhpcztcblx0fVxuXG5cdGlmICghaXNBcnJheShhcnJheUxpa2UpKSB7XG5cdFx0aWYgKChnZXRJdGVyYXRvciA9IGFycmF5TGlrZVtpdGVyYXRvclN5bWJvbF0pICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdC8vIFNvdXJjZTogSXRlcmF0b3Jcblx0XHRcdGl0ZXJhdG9yID0gY2FsbGFibGUoZ2V0SXRlcmF0b3IpLmNhbGwoYXJyYXlMaWtlKTtcblx0XHRcdGlmIChDb250ZXh0KSBhcnIgPSBuZXcgQ29udGV4dCgpO1xuXHRcdFx0cmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuXHRcdFx0aSA9IDA7XG5cdFx0XHR3aGlsZSAoIXJlc3VsdC5kb25lKSB7XG5cdFx0XHRcdHZhbHVlID0gbWFwRm4gPyBjYWxsLmNhbGwobWFwRm4sIHRoaXNBcmcsIHJlc3VsdC52YWx1ZSwgaSkgOiByZXN1bHQudmFsdWU7XG5cdFx0XHRcdGlmIChDb250ZXh0KSB7XG5cdFx0XHRcdFx0ZGVzYy52YWx1ZSA9IHZhbHVlO1xuXHRcdFx0XHRcdGRlZmluZVByb3BlcnR5KGFyciwgaSwgZGVzYyk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YXJyW2ldID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzdWx0ID0gaXRlcmF0b3IubmV4dCgpO1xuXHRcdFx0XHQrK2k7XG5cdFx0XHR9XG5cdFx0XHRsZW5ndGggPSBpO1xuXHRcdH0gZWxzZSBpZiAoaXNTdHJpbmcoYXJyYXlMaWtlKSkge1xuXHRcdFx0Ly8gU291cmNlOiBTdHJpbmdcblx0XHRcdGxlbmd0aCA9IGFycmF5TGlrZS5sZW5ndGg7XG5cdFx0XHRpZiAoQ29udGV4dCkgYXJyID0gbmV3IENvbnRleHQoKTtcblx0XHRcdGZvciAoaSA9IDAsIGogPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0dmFsdWUgPSBhcnJheUxpa2VbaV07XG5cdFx0XHRcdGlmIChpICsgMSA8IGxlbmd0aCkge1xuXHRcdFx0XHRcdGNvZGUgPSB2YWx1ZS5jaGFyQ29kZUF0KDApO1xuXHRcdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBtYXgtZGVwdGhcblx0XHRcdFx0XHRpZiAoY29kZSA+PSAweGQ4MDAgJiYgY29kZSA8PSAweGRiZmYpIHZhbHVlICs9IGFycmF5TGlrZVsrK2ldO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHZhbHVlID0gbWFwRm4gPyBjYWxsLmNhbGwobWFwRm4sIHRoaXNBcmcsIHZhbHVlLCBqKSA6IHZhbHVlO1xuXHRcdFx0XHRpZiAoQ29udGV4dCkge1xuXHRcdFx0XHRcdGRlc2MudmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0XHRkZWZpbmVQcm9wZXJ0eShhcnIsIGosIGRlc2MpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGFycltqXSA9IHZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHRcdCsrajtcblx0XHRcdH1cblx0XHRcdGxlbmd0aCA9IGo7XG5cdFx0fVxuXHR9XG5cdGlmIChsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuXHRcdC8vIFNvdXJjZTogYXJyYXkgb3IgYXJyYXktbGlrZVxuXHRcdGxlbmd0aCA9IHRvUG9zSW50KGFycmF5TGlrZS5sZW5ndGgpO1xuXHRcdGlmIChDb250ZXh0KSBhcnIgPSBuZXcgQ29udGV4dChsZW5ndGgpO1xuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuXHRcdFx0dmFsdWUgPSBtYXBGbiA/IGNhbGwuY2FsbChtYXBGbiwgdGhpc0FyZywgYXJyYXlMaWtlW2ldLCBpKSA6IGFycmF5TGlrZVtpXTtcblx0XHRcdGlmIChDb250ZXh0KSB7XG5cdFx0XHRcdGRlc2MudmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0ZGVmaW5lUHJvcGVydHkoYXJyLCBpLCBkZXNjKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGFycltpXSA9IHZhbHVlO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXHRpZiAoQ29udGV4dCkge1xuXHRcdGRlc2MudmFsdWUgPSBudWxsO1xuXHRcdGFyci5sZW5ndGggPSBsZW5ndGg7XG5cdH1cblx0cmV0dXJuIGFycjtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIG9ialRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuICAsIGlkID0gb2JqVG9TdHJpbmcuY2FsbChcblx0KGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gYXJndW1lbnRzO1xuXHR9KSgpXG4pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRyZXR1cm4gb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IGlkO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgb2JqVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLCBpZCA9IG9ialRvU3RyaW5nLmNhbGwocmVxdWlyZShcIi4vbm9vcFwiKSk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmpUb1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gaWQ7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1lbXB0eS1mdW5jdGlvblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoKSB7fTtcbiIsIi8qIGVzbGludCBzdHJpY3Q6IFwib2ZmXCIgKi9cblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcztcbn0oKSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pcy1pbXBsZW1lbnRlZFwiKSgpXG5cdD8gTWF0aC5zaWduXG5cdDogcmVxdWlyZShcIi4vc2hpbVwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIHNpZ24gPSBNYXRoLnNpZ247XG5cdGlmICh0eXBlb2Ygc2lnbiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiAoc2lnbigxMCkgPT09IDEpICYmIChzaWduKC0yMCkgPT09IC0xKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0dmFsdWUgPSBOdW1iZXIodmFsdWUpO1xuXHRpZiAoaXNOYU4odmFsdWUpIHx8ICh2YWx1ZSA9PT0gMCkpIHJldHVybiB2YWx1ZTtcblx0cmV0dXJuIHZhbHVlID4gMCA/IDEgOiAtMTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pcy1pbXBsZW1lbnRlZFwiKSgpXG5cdD8gTnVtYmVyLmlzTmFOXG5cdDogcmVxdWlyZShcIi4vc2hpbVwiKTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0dmFyIG51bWJlcklzTmFOID0gTnVtYmVyLmlzTmFOO1xuXHRpZiAodHlwZW9mIG51bWJlcklzTmFOICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBmYWxzZTtcblx0cmV0dXJuICFudW1iZXJJc05hTih7fSkgJiYgbnVtYmVySXNOYU4oTmFOKSAmJiAhbnVtYmVySXNOYU4oMzQpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tc2VsZi1jb21wYXJlXG5cdHJldHVybiB2YWx1ZSAhPT0gdmFsdWU7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBzaWduID0gcmVxdWlyZShcIi4uL21hdGgvc2lnblwiKVxuXG4gICwgYWJzID0gTWF0aC5hYnMsIGZsb29yID0gTWF0aC5mbG9vcjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0aWYgKGlzTmFOKHZhbHVlKSkgcmV0dXJuIDA7XG5cdHZhbHVlID0gTnVtYmVyKHZhbHVlKTtcblx0aWYgKCh2YWx1ZSA9PT0gMCkgfHwgIWlzRmluaXRlKHZhbHVlKSkgcmV0dXJuIHZhbHVlO1xuXHRyZXR1cm4gc2lnbih2YWx1ZSkgKiBmbG9vcihhYnModmFsdWUpKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHRvSW50ZWdlciA9IHJlcXVpcmUoXCIuL3RvLWludGVnZXJcIilcblxuICAsIG1heCA9IE1hdGgubWF4O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuIHJldHVybiBtYXgoMCwgdG9JbnRlZ2VyKHZhbHVlKSk7XG59O1xuIiwiLy8gSW50ZXJuYWwgbWV0aG9kLCB1c2VkIGJ5IGl0ZXJhdGlvbiBmdW5jdGlvbnMuXG4vLyBDYWxscyBhIGZ1bmN0aW9uIGZvciBlYWNoIGtleS12YWx1ZSBwYWlyIGZvdW5kIGluIG9iamVjdFxuLy8gT3B0aW9uYWxseSB0YWtlcyBjb21wYXJlRm4gdG8gaXRlcmF0ZSBvYmplY3QgaW4gc3BlY2lmaWMgb3JkZXJcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBjYWxsYWJsZSAgICAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL3ZhbGlkLWNhbGxhYmxlXCIpXG4gICwgdmFsdWUgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi92YWxpZC12YWx1ZVwiKVxuICAsIGJpbmQgICAgICAgICAgICAgICAgICAgID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmRcbiAgLCBjYWxsICAgICAgICAgICAgICAgICAgICA9IEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsXG4gICwga2V5cyAgICAgICAgICAgICAgICAgICAgPSBPYmplY3Qua2V5c1xuICAsIG9ialByb3BlcnR5SXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobWV0aG9kLCBkZWZWYWwpIHtcblx0cmV0dXJuIGZ1bmN0aW9uIChvYmosIGNiIC8qLCB0aGlzQXJnLCBjb21wYXJlRm4qLykge1xuXHRcdHZhciBsaXN0LCB0aGlzQXJnID0gYXJndW1lbnRzWzJdLCBjb21wYXJlRm4gPSBhcmd1bWVudHNbM107XG5cdFx0b2JqID0gT2JqZWN0KHZhbHVlKG9iaikpO1xuXHRcdGNhbGxhYmxlKGNiKTtcblxuXHRcdGxpc3QgPSBrZXlzKG9iaik7XG5cdFx0aWYgKGNvbXBhcmVGbikge1xuXHRcdFx0bGlzdC5zb3J0KHR5cGVvZiBjb21wYXJlRm4gPT09IFwiZnVuY3Rpb25cIiA/IGJpbmQuY2FsbChjb21wYXJlRm4sIG9iaikgOiB1bmRlZmluZWQpO1xuXHRcdH1cblx0XHRpZiAodHlwZW9mIG1ldGhvZCAhPT0gXCJmdW5jdGlvblwiKSBtZXRob2QgPSBsaXN0W21ldGhvZF07XG5cdFx0cmV0dXJuIGNhbGwuY2FsbChtZXRob2QsIGxpc3QsIGZ1bmN0aW9uIChrZXksIGluZGV4KSB7XG5cdFx0XHRpZiAoIW9ialByb3BlcnR5SXNFbnVtZXJhYmxlLmNhbGwob2JqLCBrZXkpKSByZXR1cm4gZGVmVmFsO1xuXHRcdFx0cmV0dXJuIGNhbGwuY2FsbChjYiwgdGhpc0FyZywgb2JqW2tleV0sIGtleSwgb2JqLCBpbmRleCk7XG5cdFx0fSk7XG5cdH07XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaXMtaW1wbGVtZW50ZWRcIikoKVxuXHQ/IE9iamVjdC5hc3NpZ25cblx0OiByZXF1aXJlKFwiLi9zaGltXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgYXNzaWduID0gT2JqZWN0LmFzc2lnbiwgb2JqO1xuXHRpZiAodHlwZW9mIGFzc2lnbiAhPT0gXCJmdW5jdGlvblwiKSByZXR1cm4gZmFsc2U7XG5cdG9iaiA9IHsgZm9vOiBcInJhelwiIH07XG5cdGFzc2lnbihvYmosIHsgYmFyOiBcImR3YVwiIH0sIHsgdHJ6eTogXCJ0cnp5XCIgfSk7XG5cdHJldHVybiAob2JqLmZvbyArIG9iai5iYXIgKyBvYmoudHJ6eSkgPT09IFwicmF6ZHdhdHJ6eVwiO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIga2V5cyAgPSByZXF1aXJlKFwiLi4va2V5c1wiKVxuICAsIHZhbHVlID0gcmVxdWlyZShcIi4uL3ZhbGlkLXZhbHVlXCIpXG4gICwgbWF4ICAgPSBNYXRoLm1heDtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZGVzdCwgc3JjIC8qLCDigKZzcmNuKi8pIHtcblx0dmFyIGVycm9yLCBpLCBsZW5ndGggPSBtYXgoYXJndW1lbnRzLmxlbmd0aCwgMiksIGFzc2lnbjtcblx0ZGVzdCA9IE9iamVjdCh2YWx1ZShkZXN0KSk7XG5cdGFzc2lnbiA9IGZ1bmN0aW9uIChrZXkpIHtcblx0XHR0cnkge1xuXHRcdFx0ZGVzdFtrZXldID0gc3JjW2tleV07XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0aWYgKCFlcnJvcikgZXJyb3IgPSBlO1xuXHRcdH1cblx0fTtcblx0Zm9yIChpID0gMTsgaSA8IGxlbmd0aDsgKytpKSB7XG5cdFx0c3JjID0gYXJndW1lbnRzW2ldO1xuXHRcdGtleXMoc3JjKS5mb3JFYWNoKGFzc2lnbik7XG5cdH1cblx0aWYgKGVycm9yICE9PSB1bmRlZmluZWQpIHRocm93IGVycm9yO1xuXHRyZXR1cm4gZGVzdDtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGFGcm9tICA9IHJlcXVpcmUoXCIuLi9hcnJheS9mcm9tXCIpXG4gICwgYXNzaWduID0gcmVxdWlyZShcIi4vYXNzaWduXCIpXG4gICwgdmFsdWUgID0gcmVxdWlyZShcIi4vdmFsaWQtdmFsdWVcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iai8qLCBwcm9wZXJ0eU5hbWVzLCBvcHRpb25zKi8pIHtcblx0dmFyIGNvcHkgPSBPYmplY3QodmFsdWUob2JqKSksIHByb3BlcnR5TmFtZXMgPSBhcmd1bWVudHNbMV0sIG9wdGlvbnMgPSBPYmplY3QoYXJndW1lbnRzWzJdKTtcblx0aWYgKGNvcHkgIT09IG9iaiAmJiAhcHJvcGVydHlOYW1lcykgcmV0dXJuIGNvcHk7XG5cdHZhciByZXN1bHQgPSB7fTtcblx0aWYgKHByb3BlcnR5TmFtZXMpIHtcblx0XHRhRnJvbShwcm9wZXJ0eU5hbWVzLCBmdW5jdGlvbiAocHJvcGVydHlOYW1lKSB7XG5cdFx0XHRpZiAob3B0aW9ucy5lbnN1cmUgfHwgcHJvcGVydHlOYW1lIGluIG9iaikgcmVzdWx0W3Byb3BlcnR5TmFtZV0gPSBvYmpbcHJvcGVydHlOYW1lXTtcblx0XHR9KTtcblx0fSBlbHNlIHtcblx0XHRhc3NpZ24ocmVzdWx0LCBvYmopO1xuXHR9XG5cdHJldHVybiByZXN1bHQ7XG59O1xuIiwiLy8gV29ya2Fyb3VuZCBmb3IgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MjgwNFxuXG5cInVzZSBzdHJpY3RcIjtcblxudmFyIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGUsIHNoaW07XG5cbmlmICghcmVxdWlyZShcIi4vc2V0LXByb3RvdHlwZS1vZi9pcy1pbXBsZW1lbnRlZFwiKSgpKSB7XG5cdHNoaW0gPSByZXF1aXJlKFwiLi9zZXQtcHJvdG90eXBlLW9mL3NoaW1cIik7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcblx0dmFyIG51bGxPYmplY3QsIHBvbHlQcm9wcywgZGVzYztcblx0aWYgKCFzaGltKSByZXR1cm4gY3JlYXRlO1xuXHRpZiAoc2hpbS5sZXZlbCAhPT0gMSkgcmV0dXJuIGNyZWF0ZTtcblxuXHRudWxsT2JqZWN0ID0ge307XG5cdHBvbHlQcm9wcyA9IHt9O1xuXHRkZXNjID0ge1xuXHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG5cdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0d3JpdGFibGU6IHRydWUsXG5cdFx0dmFsdWU6IHVuZGVmaW5lZFxuXHR9O1xuXHRPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPYmplY3QucHJvdG90eXBlKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0aWYgKG5hbWUgPT09IFwiX19wcm90b19fXCIpIHtcblx0XHRcdHBvbHlQcm9wc1tuYW1lXSA9IHtcblx0XHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxuXHRcdFx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHRcdFx0d3JpdGFibGU6IHRydWUsXG5cdFx0XHRcdHZhbHVlOiB1bmRlZmluZWRcblx0XHRcdH07XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHBvbHlQcm9wc1tuYW1lXSA9IGRlc2M7XG5cdH0pO1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydGllcyhudWxsT2JqZWN0LCBwb2x5UHJvcHMpO1xuXG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzaGltLCBcIm51bGxQb2x5ZmlsbFwiLCB7XG5cdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcblx0XHRlbnVtZXJhYmxlOiBmYWxzZSxcblx0XHR3cml0YWJsZTogZmFsc2UsXG5cdFx0dmFsdWU6IG51bGxPYmplY3Rcblx0fSk7XG5cblx0cmV0dXJuIGZ1bmN0aW9uIChwcm90b3R5cGUsIHByb3BzKSB7XG5cdFx0cmV0dXJuIGNyZWF0ZShwcm90b3R5cGUgPT09IG51bGwgPyBudWxsT2JqZWN0IDogcHJvdG90eXBlLCBwcm9wcyk7XG5cdH07XG59KCkpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vX2l0ZXJhdGVcIikoXCJmb3JFYWNoXCIpO1xuIiwiLy8gRGVwcmVjYXRlZFxuXG5cInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqKSB7XG4gcmV0dXJuIHR5cGVvZiBvYmogPT09IFwiZnVuY3Rpb25cIjtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGlzVmFsdWUgPSByZXF1aXJlKFwiLi9pcy12YWx1ZVwiKTtcblxudmFyIG1hcCA9IHsgZnVuY3Rpb246IHRydWUsIG9iamVjdDogdHJ1ZSB9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRyZXR1cm4gKGlzVmFsdWUodmFsdWUpICYmIG1hcFt0eXBlb2YgdmFsdWVdKSB8fCBmYWxzZTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIF91bmRlZmluZWQgPSByZXF1aXJlKFwiLi4vZnVuY3Rpb24vbm9vcFwiKSgpOyAvLyBTdXBwb3J0IEVTMyBlbmdpbmVzXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHZhbCkge1xuIHJldHVybiAodmFsICE9PSBfdW5kZWZpbmVkKSAmJiAodmFsICE9PSBudWxsKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pcy1pbXBsZW1lbnRlZFwiKSgpID8gT2JqZWN0LmtleXMgOiByZXF1aXJlKFwiLi9zaGltXCIpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR0cnkge1xuXHRcdE9iamVjdC5rZXlzKFwicHJpbWl0aXZlXCIpO1xuXHRcdHJldHVybiB0cnVlO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc1ZhbHVlID0gcmVxdWlyZShcIi4uL2lzLXZhbHVlXCIpO1xuXG52YXIga2V5cyA9IE9iamVjdC5rZXlzO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmplY3QpIHsgcmV0dXJuIGtleXMoaXNWYWx1ZShvYmplY3QpID8gT2JqZWN0KG9iamVjdCkgOiBvYmplY3QpOyB9O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBjYWxsYWJsZSA9IHJlcXVpcmUoXCIuL3ZhbGlkLWNhbGxhYmxlXCIpXG4gICwgZm9yRWFjaCAgPSByZXF1aXJlKFwiLi9mb3ItZWFjaFwiKVxuICAsIGNhbGwgICAgID0gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGw7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iaiwgY2IgLyosIHRoaXNBcmcqLykge1xuXHR2YXIgcmVzdWx0ID0ge30sIHRoaXNBcmcgPSBhcmd1bWVudHNbMl07XG5cdGNhbGxhYmxlKGNiKTtcblx0Zm9yRWFjaChvYmosIGZ1bmN0aW9uICh2YWx1ZSwga2V5LCB0YXJnZXRPYmosIGluZGV4KSB7XG5cdFx0cmVzdWx0W2tleV0gPSBjYWxsLmNhbGwoY2IsIHRoaXNBcmcsIHZhbHVlLCBrZXksIHRhcmdldE9iaiwgaW5kZXgpO1xuXHR9KTtcblx0cmV0dXJuIHJlc3VsdDtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGlzVmFsdWUgPSByZXF1aXJlKFwiLi9pcy12YWx1ZVwiKTtcblxudmFyIGZvckVhY2ggPSBBcnJheS5wcm90b3R5cGUuZm9yRWFjaCwgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZTtcblxudmFyIHByb2Nlc3MgPSBmdW5jdGlvbiAoc3JjLCBvYmopIHtcblx0dmFyIGtleTtcblx0Zm9yIChrZXkgaW4gc3JjKSBvYmpba2V5XSA9IHNyY1trZXldO1xufTtcblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVudXNlZC12YXJzXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvcHRzMSAvKiwg4oCmb3B0aW9ucyovKSB7XG5cdHZhciByZXN1bHQgPSBjcmVhdGUobnVsbCk7XG5cdGZvckVhY2guY2FsbChhcmd1bWVudHMsIGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cdFx0aWYgKCFpc1ZhbHVlKG9wdGlvbnMpKSByZXR1cm47XG5cdFx0cHJvY2VzcyhPYmplY3Qob3B0aW9ucyksIHJlc3VsdCk7XG5cdH0pO1xuXHRyZXR1cm4gcmVzdWx0O1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgZm9yRWFjaCA9IEFycmF5LnByb3RvdHlwZS5mb3JFYWNoLCBjcmVhdGUgPSBPYmplY3QuY3JlYXRlO1xuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGFyZyAvKiwg4oCmYXJncyovKSB7XG5cdHZhciBzZXQgPSBjcmVhdGUobnVsbCk7XG5cdGZvckVhY2guY2FsbChhcmd1bWVudHMsIGZ1bmN0aW9uIChuYW1lKSB7XG5cdFx0c2V0W25hbWVdID0gdHJ1ZTtcblx0fSk7XG5cdHJldHVybiBzZXQ7XG59O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIi4vaXMtaW1wbGVtZW50ZWRcIikoKVxuXHQ/IE9iamVjdC5zZXRQcm90b3R5cGVPZlxuXHQ6IHJlcXVpcmUoXCIuL3NoaW1cIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGNyZWF0ZSA9IE9iamVjdC5jcmVhdGUsIGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mLCBwbGFpbk9iamVjdCA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgvKiBDdXN0b21DcmVhdGUqLykge1xuXHR2YXIgc2V0UHJvdG90eXBlT2YgPSBPYmplY3Quc2V0UHJvdG90eXBlT2YsIGN1c3RvbUNyZWF0ZSA9IGFyZ3VtZW50c1swXSB8fCBjcmVhdGU7XG5cdGlmICh0eXBlb2Ygc2V0UHJvdG90eXBlT2YgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gZ2V0UHJvdG90eXBlT2Yoc2V0UHJvdG90eXBlT2YoY3VzdG9tQ3JlYXRlKG51bGwpLCBwbGFpbk9iamVjdCkpID09PSBwbGFpbk9iamVjdDtcbn07XG4iLCIvKiBlc2xpbnQgbm8tcHJvdG86IFwib2ZmXCIgKi9cblxuLy8gQmlnIHRoYW5rcyB0byBAV2ViUmVmbGVjdGlvbiBmb3Igc29ydGluZyB0aGlzIG91dFxuLy8gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vV2ViUmVmbGVjdGlvbi81NTkzNTU0XG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgaXNPYmplY3QgICAgICAgID0gcmVxdWlyZShcIi4uL2lzLW9iamVjdFwiKVxuICAsIHZhbHVlICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi92YWxpZC12YWx1ZVwiKVxuICAsIG9iaklzUHJvdG90eXBlT2YgPSBPYmplY3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2ZcbiAgLCBkZWZpbmVQcm9wZXJ0eSAgPSBPYmplY3QuZGVmaW5lUHJvcGVydHlcbiAgLCBudWxsRGVzYyAgICAgICAgPSB7XG5cdGNvbmZpZ3VyYWJsZTogdHJ1ZSxcblx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdHdyaXRhYmxlOiB0cnVlLFxuXHR2YWx1ZTogdW5kZWZpbmVkXG59XG4gICwgdmFsaWRhdGU7XG5cbnZhbGlkYXRlID0gZnVuY3Rpb24gKG9iaiwgcHJvdG90eXBlKSB7XG5cdHZhbHVlKG9iaik7XG5cdGlmIChwcm90b3R5cGUgPT09IG51bGwgfHwgaXNPYmplY3QocHJvdG90eXBlKSkgcmV0dXJuIG9iajtcblx0dGhyb3cgbmV3IFR5cGVFcnJvcihcIlByb3RvdHlwZSBtdXN0IGJlIG51bGwgb3IgYW4gb2JqZWN0XCIpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24gKHN0YXR1cykge1xuXHR2YXIgZm4sIHNldDtcblx0aWYgKCFzdGF0dXMpIHJldHVybiBudWxsO1xuXHRpZiAoc3RhdHVzLmxldmVsID09PSAyKSB7XG5cdFx0aWYgKHN0YXR1cy5zZXQpIHtcblx0XHRcdHNldCA9IHN0YXR1cy5zZXQ7XG5cdFx0XHRmbiA9IGZ1bmN0aW9uIChvYmosIHByb3RvdHlwZSkge1xuXHRcdFx0XHRzZXQuY2FsbCh2YWxpZGF0ZShvYmosIHByb3RvdHlwZSksIHByb3RvdHlwZSk7XG5cdFx0XHRcdHJldHVybiBvYmo7XG5cdFx0XHR9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmbiA9IGZ1bmN0aW9uIChvYmosIHByb3RvdHlwZSkge1xuXHRcdFx0XHR2YWxpZGF0ZShvYmosIHByb3RvdHlwZSkuX19wcm90b19fID0gcHJvdG90eXBlO1xuXHRcdFx0XHRyZXR1cm4gb2JqO1xuXHRcdFx0fTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Zm4gPSBmdW5jdGlvbiBzZWxmKG9iaiwgcHJvdG90eXBlKSB7XG5cdFx0XHR2YXIgaXNOdWxsQmFzZTtcblx0XHRcdHZhbGlkYXRlKG9iaiwgcHJvdG90eXBlKTtcblx0XHRcdGlzTnVsbEJhc2UgPSBvYmpJc1Byb3RvdHlwZU9mLmNhbGwoc2VsZi5udWxsUG9seWZpbGwsIG9iaik7XG5cdFx0XHRpZiAoaXNOdWxsQmFzZSkgZGVsZXRlIHNlbGYubnVsbFBvbHlmaWxsLl9fcHJvdG9fXztcblx0XHRcdGlmIChwcm90b3R5cGUgPT09IG51bGwpIHByb3RvdHlwZSA9IHNlbGYubnVsbFBvbHlmaWxsO1xuXHRcdFx0b2JqLl9fcHJvdG9fXyA9IHByb3RvdHlwZTtcblx0XHRcdGlmIChpc051bGxCYXNlKSBkZWZpbmVQcm9wZXJ0eShzZWxmLm51bGxQb2x5ZmlsbCwgXCJfX3Byb3RvX19cIiwgbnVsbERlc2MpO1xuXHRcdFx0cmV0dXJuIG9iajtcblx0XHR9O1xuXHR9XG5cdHJldHVybiBPYmplY3QuZGVmaW5lUHJvcGVydHkoZm4sIFwibGV2ZWxcIiwge1xuXHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG5cdFx0ZW51bWVyYWJsZTogZmFsc2UsXG5cdFx0d3JpdGFibGU6IGZhbHNlLFxuXHRcdHZhbHVlOiBzdGF0dXMubGV2ZWxcblx0fSk7XG59KFxuXHQoZnVuY3Rpb24gKCkge1xuXHRcdHZhciB0bXBPYmoxID0gT2JqZWN0LmNyZWF0ZShudWxsKVxuXHRcdCAgLCB0bXBPYmoyID0ge31cblx0XHQgICwgc2V0XG5cdFx0ICAsIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKE9iamVjdC5wcm90b3R5cGUsIFwiX19wcm90b19fXCIpO1xuXG5cdFx0aWYgKGRlc2MpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHNldCA9IGRlc2Muc2V0OyAvLyBPcGVyYSBjcmFzaGVzIGF0IHRoaXMgcG9pbnRcblx0XHRcdFx0c2V0LmNhbGwodG1wT2JqMSwgdG1wT2JqMik7XG5cdFx0XHR9IGNhdGNoIChpZ25vcmUpIHt9XG5cdFx0XHRpZiAoT2JqZWN0LmdldFByb3RvdHlwZU9mKHRtcE9iajEpID09PSB0bXBPYmoyKSByZXR1cm4geyBzZXQ6IHNldCwgbGV2ZWw6IDIgfTtcblx0XHR9XG5cblx0XHR0bXBPYmoxLl9fcHJvdG9fXyA9IHRtcE9iajI7XG5cdFx0aWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZih0bXBPYmoxKSA9PT0gdG1wT2JqMikgcmV0dXJuIHsgbGV2ZWw6IDIgfTtcblxuXHRcdHRtcE9iajEgPSB7fTtcblx0XHR0bXBPYmoxLl9fcHJvdG9fXyA9IHRtcE9iajI7XG5cdFx0aWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZih0bXBPYmoxKSA9PT0gdG1wT2JqMikgcmV0dXJuIHsgbGV2ZWw6IDEgfTtcblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSkoKVxuKSk7XG5cbnJlcXVpcmUoXCIuLi9jcmVhdGVcIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZm4pIHtcblx0aWYgKHR5cGVvZiBmbiAhPT0gXCJmdW5jdGlvblwiKSB0aHJvdyBuZXcgVHlwZUVycm9yKGZuICsgXCIgaXMgbm90IGEgZnVuY3Rpb25cIik7XG5cdHJldHVybiBmbjtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGlzVmFsdWUgPSByZXF1aXJlKFwiLi9pcy12YWx1ZVwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0aWYgKCFpc1ZhbHVlKHZhbHVlKSkgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkNhbm5vdCB1c2UgbnVsbCBvciB1bmRlZmluZWRcIik7XG5cdHJldHVybiB2YWx1ZTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiLi9pcy1pbXBsZW1lbnRlZFwiKSgpXG5cdD8gU3RyaW5nLnByb3RvdHlwZS5jb250YWluc1xuXHQ6IHJlcXVpcmUoXCIuL3NoaW1cIik7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHN0ciA9IFwicmF6ZHdhdHJ6eVwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblx0aWYgKHR5cGVvZiBzdHIuY29udGFpbnMgIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGZhbHNlO1xuXHRyZXR1cm4gKHN0ci5jb250YWlucyhcImR3YVwiKSA9PT0gdHJ1ZSkgJiYgKHN0ci5jb250YWlucyhcImZvb1wiKSA9PT0gZmFsc2UpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaW5kZXhPZiA9IFN0cmluZy5wcm90b3R5cGUuaW5kZXhPZjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc2VhcmNoU3RyaW5nLyosIHBvc2l0aW9uKi8pIHtcblx0cmV0dXJuIGluZGV4T2YuY2FsbCh0aGlzLCBzZWFyY2hTdHJpbmcsIGFyZ3VtZW50c1sxXSkgPiAtMTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIG9ialRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZywgaWQgPSBvYmpUb1N0cmluZy5jYWxsKFwiXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRyZXR1cm4gKFxuXHRcdHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiB8fFxuXHRcdCh2YWx1ZSAmJlxuXHRcdFx0dHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmXG5cdFx0XHQodmFsdWUgaW5zdGFuY2VvZiBTdHJpbmcgfHwgb2JqVG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IGlkKSkgfHxcblx0XHRmYWxzZVxuXHQpO1xufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgc2V0UHJvdG90eXBlT2YgPSByZXF1aXJlKFwiZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZlwiKVxuICAsIGNvbnRhaW5zICAgICAgID0gcmVxdWlyZShcImVzNS1leHQvc3RyaW5nLyMvY29udGFpbnNcIilcbiAgLCBkICAgICAgICAgICAgICA9IHJlcXVpcmUoXCJkXCIpXG4gICwgU3ltYm9sICAgICAgICAgPSByZXF1aXJlKFwiZXM2LXN5bWJvbFwiKVxuICAsIEl0ZXJhdG9yICAgICAgID0gcmVxdWlyZShcIi4vXCIpO1xuXG52YXIgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHksIEFycmF5SXRlcmF0b3I7XG5cbkFycmF5SXRlcmF0b3IgPSBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChhcnIsIGtpbmQpIHtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIEFycmF5SXRlcmF0b3IpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ29uc3RydWN0b3IgcmVxdWlyZXMgJ25ldydcIik7XG5cdEl0ZXJhdG9yLmNhbGwodGhpcywgYXJyKTtcblx0aWYgKCFraW5kKSBraW5kID0gXCJ2YWx1ZVwiO1xuXHRlbHNlIGlmIChjb250YWlucy5jYWxsKGtpbmQsIFwia2V5K3ZhbHVlXCIpKSBraW5kID0gXCJrZXkrdmFsdWVcIjtcblx0ZWxzZSBpZiAoY29udGFpbnMuY2FsbChraW5kLCBcImtleVwiKSkga2luZCA9IFwia2V5XCI7XG5cdGVsc2Uga2luZCA9IFwidmFsdWVcIjtcblx0ZGVmaW5lUHJvcGVydHkodGhpcywgXCJfX2tpbmRfX1wiLCBkKFwiXCIsIGtpbmQpKTtcbn07XG5pZiAoc2V0UHJvdG90eXBlT2YpIHNldFByb3RvdHlwZU9mKEFycmF5SXRlcmF0b3IsIEl0ZXJhdG9yKTtcblxuLy8gSW50ZXJuYWwgJUFycmF5SXRlcmF0b3JQcm90b3R5cGUlIGRvZXNuJ3QgZXhwb3NlIGl0cyBjb25zdHJ1Y3RvclxuZGVsZXRlIEFycmF5SXRlcmF0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yO1xuXG5BcnJheUl0ZXJhdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSXRlcmF0b3IucHJvdG90eXBlLCB7XG5cdF9yZXNvbHZlOiBkKGZ1bmN0aW9uIChpKSB7XG5cdFx0aWYgKHRoaXMuX19raW5kX18gPT09IFwidmFsdWVcIikgcmV0dXJuIHRoaXMuX19saXN0X19baV07XG5cdFx0aWYgKHRoaXMuX19raW5kX18gPT09IFwia2V5K3ZhbHVlXCIpIHJldHVybiBbaSwgdGhpcy5fX2xpc3RfX1tpXV07XG5cdFx0cmV0dXJuIGk7XG5cdH0pXG59KTtcbmRlZmluZVByb3BlcnR5KEFycmF5SXRlcmF0b3IucHJvdG90eXBlLCBTeW1ib2wudG9TdHJpbmdUYWcsIGQoXCJjXCIsIFwiQXJyYXkgSXRlcmF0b3JcIikpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBpc0FyZ3VtZW50cyA9IHJlcXVpcmUoXCJlczUtZXh0L2Z1bmN0aW9uL2lzLWFyZ3VtZW50c1wiKVxuICAsIGNhbGxhYmxlICAgID0gcmVxdWlyZShcImVzNS1leHQvb2JqZWN0L3ZhbGlkLWNhbGxhYmxlXCIpXG4gICwgaXNTdHJpbmcgICAgPSByZXF1aXJlKFwiZXM1LWV4dC9zdHJpbmcvaXMtc3RyaW5nXCIpXG4gICwgZ2V0ICAgICAgICAgPSByZXF1aXJlKFwiLi9nZXRcIik7XG5cbnZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSwgY2FsbCA9IEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsLCBzb21lID0gQXJyYXkucHJvdG90eXBlLnNvbWU7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGl0ZXJhYmxlLCBjYiAvKiwgdGhpc0FyZyovKSB7XG5cdHZhciBtb2RlLCB0aGlzQXJnID0gYXJndW1lbnRzWzJdLCByZXN1bHQsIGRvQnJlYWssIGJyb2tlbiwgaSwgbGVuZ3RoLCBjaGFyLCBjb2RlO1xuXHRpZiAoaXNBcnJheShpdGVyYWJsZSkgfHwgaXNBcmd1bWVudHMoaXRlcmFibGUpKSBtb2RlID0gXCJhcnJheVwiO1xuXHRlbHNlIGlmIChpc1N0cmluZyhpdGVyYWJsZSkpIG1vZGUgPSBcInN0cmluZ1wiO1xuXHRlbHNlIGl0ZXJhYmxlID0gZ2V0KGl0ZXJhYmxlKTtcblxuXHRjYWxsYWJsZShjYik7XG5cdGRvQnJlYWsgPSBmdW5jdGlvbiAoKSB7XG5cdFx0YnJva2VuID0gdHJ1ZTtcblx0fTtcblx0aWYgKG1vZGUgPT09IFwiYXJyYXlcIikge1xuXHRcdHNvbWUuY2FsbChpdGVyYWJsZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0XHRjYWxsLmNhbGwoY2IsIHRoaXNBcmcsIHZhbHVlLCBkb0JyZWFrKTtcblx0XHRcdHJldHVybiBicm9rZW47XG5cdFx0fSk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmIChtb2RlID09PSBcInN0cmluZ1wiKSB7XG5cdFx0bGVuZ3RoID0gaXRlcmFibGUubGVuZ3RoO1xuXHRcdGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuXHRcdFx0Y2hhciA9IGl0ZXJhYmxlW2ldO1xuXHRcdFx0aWYgKGkgKyAxIDwgbGVuZ3RoKSB7XG5cdFx0XHRcdGNvZGUgPSBjaGFyLmNoYXJDb2RlQXQoMCk7XG5cdFx0XHRcdGlmIChjb2RlID49IDB4ZDgwMCAmJiBjb2RlIDw9IDB4ZGJmZikgY2hhciArPSBpdGVyYWJsZVsrK2ldO1xuXHRcdFx0fVxuXHRcdFx0Y2FsbC5jYWxsKGNiLCB0aGlzQXJnLCBjaGFyLCBkb0JyZWFrKTtcblx0XHRcdGlmIChicm9rZW4pIGJyZWFrO1xuXHRcdH1cblx0XHRyZXR1cm47XG5cdH1cblx0cmVzdWx0ID0gaXRlcmFibGUubmV4dCgpO1xuXG5cdHdoaWxlICghcmVzdWx0LmRvbmUpIHtcblx0XHRjYWxsLmNhbGwoY2IsIHRoaXNBcmcsIHJlc3VsdC52YWx1ZSwgZG9CcmVhayk7XG5cdFx0aWYgKGJyb2tlbikgcmV0dXJuO1xuXHRcdHJlc3VsdCA9IGl0ZXJhYmxlLm5leHQoKTtcblx0fVxufTtcbiIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgaXNBcmd1bWVudHMgICAgPSByZXF1aXJlKFwiZXM1LWV4dC9mdW5jdGlvbi9pcy1hcmd1bWVudHNcIilcbiAgLCBpc1N0cmluZyAgICAgICA9IHJlcXVpcmUoXCJlczUtZXh0L3N0cmluZy9pcy1zdHJpbmdcIilcbiAgLCBBcnJheUl0ZXJhdG9yICA9IHJlcXVpcmUoXCIuL2FycmF5XCIpXG4gICwgU3RyaW5nSXRlcmF0b3IgPSByZXF1aXJlKFwiLi9zdHJpbmdcIilcbiAgLCBpdGVyYWJsZSAgICAgICA9IHJlcXVpcmUoXCIuL3ZhbGlkLWl0ZXJhYmxlXCIpXG4gICwgaXRlcmF0b3JTeW1ib2wgPSByZXF1aXJlKFwiZXM2LXN5bWJvbFwiKS5pdGVyYXRvcjtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqKSB7XG5cdGlmICh0eXBlb2YgaXRlcmFibGUob2JqKVtpdGVyYXRvclN5bWJvbF0gPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIG9ialtpdGVyYXRvclN5bWJvbF0oKTtcblx0aWYgKGlzQXJndW1lbnRzKG9iaikpIHJldHVybiBuZXcgQXJyYXlJdGVyYXRvcihvYmopO1xuXHRpZiAoaXNTdHJpbmcob2JqKSkgcmV0dXJuIG5ldyBTdHJpbmdJdGVyYXRvcihvYmopO1xuXHRyZXR1cm4gbmV3IEFycmF5SXRlcmF0b3Iob2JqKTtcbn07XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGNsZWFyICAgID0gcmVxdWlyZShcImVzNS1leHQvYXJyYXkvIy9jbGVhclwiKVxuICAsIGFzc2lnbiAgID0gcmVxdWlyZShcImVzNS1leHQvb2JqZWN0L2Fzc2lnblwiKVxuICAsIGNhbGxhYmxlID0gcmVxdWlyZShcImVzNS1leHQvb2JqZWN0L3ZhbGlkLWNhbGxhYmxlXCIpXG4gICwgdmFsdWUgICAgPSByZXF1aXJlKFwiZXM1LWV4dC9vYmplY3QvdmFsaWQtdmFsdWVcIilcbiAgLCBkICAgICAgICA9IHJlcXVpcmUoXCJkXCIpXG4gICwgYXV0b0JpbmQgPSByZXF1aXJlKFwiZC9hdXRvLWJpbmRcIilcbiAgLCBTeW1ib2wgICA9IHJlcXVpcmUoXCJlczYtc3ltYm9sXCIpO1xuXG52YXIgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHksIGRlZmluZVByb3BlcnRpZXMgPSBPYmplY3QuZGVmaW5lUHJvcGVydGllcywgSXRlcmF0b3I7XG5cbm1vZHVsZS5leHBvcnRzID0gSXRlcmF0b3IgPSBmdW5jdGlvbiAobGlzdCwgY29udGV4dCkge1xuXHRpZiAoISh0aGlzIGluc3RhbmNlb2YgSXRlcmF0b3IpKSB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ29uc3RydWN0b3IgcmVxdWlyZXMgJ25ldydcIik7XG5cdGRlZmluZVByb3BlcnRpZXModGhpcywge1xuXHRcdF9fbGlzdF9fOiBkKFwid1wiLCB2YWx1ZShsaXN0KSksXG5cdFx0X19jb250ZXh0X186IGQoXCJ3XCIsIGNvbnRleHQpLFxuXHRcdF9fbmV4dEluZGV4X186IGQoXCJ3XCIsIDApXG5cdH0pO1xuXHRpZiAoIWNvbnRleHQpIHJldHVybjtcblx0Y2FsbGFibGUoY29udGV4dC5vbik7XG5cdGNvbnRleHQub24oXCJfYWRkXCIsIHRoaXMuX29uQWRkKTtcblx0Y29udGV4dC5vbihcIl9kZWxldGVcIiwgdGhpcy5fb25EZWxldGUpO1xuXHRjb250ZXh0Lm9uKFwiX2NsZWFyXCIsIHRoaXMuX29uQ2xlYXIpO1xufTtcblxuLy8gSW50ZXJuYWwgJUl0ZXJhdG9yUHJvdG90eXBlJSBkb2Vzbid0IGV4cG9zZSBpdHMgY29uc3RydWN0b3JcbmRlbGV0ZSBJdGVyYXRvci5wcm90b3R5cGUuY29uc3RydWN0b3I7XG5cbmRlZmluZVByb3BlcnRpZXMoXG5cdEl0ZXJhdG9yLnByb3RvdHlwZSxcblx0YXNzaWduKFxuXHRcdHtcblx0XHRcdF9uZXh0OiBkKGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0dmFyIGk7XG5cdFx0XHRcdGlmICghdGhpcy5fX2xpc3RfXykgcmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdFx0aWYgKHRoaXMuX19yZWRvX18pIHtcblx0XHRcdFx0XHRpID0gdGhpcy5fX3JlZG9fXy5zaGlmdCgpO1xuXHRcdFx0XHRcdGlmIChpICE9PSB1bmRlZmluZWQpIHJldHVybiBpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICh0aGlzLl9fbmV4dEluZGV4X18gPCB0aGlzLl9fbGlzdF9fLmxlbmd0aCkgcmV0dXJuIHRoaXMuX19uZXh0SW5kZXhfXysrO1xuXHRcdFx0XHR0aGlzLl91bkJpbmQoKTtcblx0XHRcdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0XHRcdH0pLFxuXHRcdFx0bmV4dDogZChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLl9jcmVhdGVSZXN1bHQodGhpcy5fbmV4dCgpKTtcblx0XHRcdH0pLFxuXHRcdFx0X2NyZWF0ZVJlc3VsdDogZChmdW5jdGlvbiAoaSkge1xuXHRcdFx0XHRpZiAoaSA9PT0gdW5kZWZpbmVkKSByZXR1cm4geyBkb25lOiB0cnVlLCB2YWx1ZTogdW5kZWZpbmVkIH07XG5cdFx0XHRcdHJldHVybiB7IGRvbmU6IGZhbHNlLCB2YWx1ZTogdGhpcy5fcmVzb2x2ZShpKSB9O1xuXHRcdFx0fSksXG5cdFx0XHRfcmVzb2x2ZTogZChmdW5jdGlvbiAoaSkge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5fX2xpc3RfX1tpXTtcblx0XHRcdH0pLFxuXHRcdFx0X3VuQmluZDogZChmdW5jdGlvbiAoKSB7XG5cdFx0XHRcdHRoaXMuX19saXN0X18gPSBudWxsO1xuXHRcdFx0XHRkZWxldGUgdGhpcy5fX3JlZG9fXztcblx0XHRcdFx0aWYgKCF0aGlzLl9fY29udGV4dF9fKSByZXR1cm47XG5cdFx0XHRcdHRoaXMuX19jb250ZXh0X18ub2ZmKFwiX2FkZFwiLCB0aGlzLl9vbkFkZCk7XG5cdFx0XHRcdHRoaXMuX19jb250ZXh0X18ub2ZmKFwiX2RlbGV0ZVwiLCB0aGlzLl9vbkRlbGV0ZSk7XG5cdFx0XHRcdHRoaXMuX19jb250ZXh0X18ub2ZmKFwiX2NsZWFyXCIsIHRoaXMuX29uQ2xlYXIpO1xuXHRcdFx0XHR0aGlzLl9fY29udGV4dF9fID0gbnVsbDtcblx0XHRcdH0pLFxuXHRcdFx0dG9TdHJpbmc6IGQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRyZXR1cm4gXCJbb2JqZWN0IFwiICsgKHRoaXNbU3ltYm9sLnRvU3RyaW5nVGFnXSB8fCBcIk9iamVjdFwiKSArIFwiXVwiO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGF1dG9CaW5kKHtcblx0XHRcdF9vbkFkZDogZChmdW5jdGlvbiAoaW5kZXgpIHtcblx0XHRcdFx0aWYgKGluZGV4ID49IHRoaXMuX19uZXh0SW5kZXhfXykgcmV0dXJuO1xuXHRcdFx0XHQrK3RoaXMuX19uZXh0SW5kZXhfXztcblx0XHRcdFx0aWYgKCF0aGlzLl9fcmVkb19fKSB7XG5cdFx0XHRcdFx0ZGVmaW5lUHJvcGVydHkodGhpcywgXCJfX3JlZG9fX1wiLCBkKFwiY1wiLCBbaW5kZXhdKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHRoaXMuX19yZWRvX18uZm9yRWFjaChmdW5jdGlvbiAocmVkbywgaSkge1xuXHRcdFx0XHRcdGlmIChyZWRvID49IGluZGV4KSB0aGlzLl9fcmVkb19fW2ldID0gKytyZWRvO1xuXHRcdFx0XHR9LCB0aGlzKTtcblx0XHRcdFx0dGhpcy5fX3JlZG9fXy5wdXNoKGluZGV4KTtcblx0XHRcdH0pLFxuXHRcdFx0X29uRGVsZXRlOiBkKGZ1bmN0aW9uIChpbmRleCkge1xuXHRcdFx0XHR2YXIgaTtcblx0XHRcdFx0aWYgKGluZGV4ID49IHRoaXMuX19uZXh0SW5kZXhfXykgcmV0dXJuO1xuXHRcdFx0XHQtLXRoaXMuX19uZXh0SW5kZXhfXztcblx0XHRcdFx0aWYgKCF0aGlzLl9fcmVkb19fKSByZXR1cm47XG5cdFx0XHRcdGkgPSB0aGlzLl9fcmVkb19fLmluZGV4T2YoaW5kZXgpO1xuXHRcdFx0XHRpZiAoaSAhPT0gLTEpIHRoaXMuX19yZWRvX18uc3BsaWNlKGksIDEpO1xuXHRcdFx0XHR0aGlzLl9fcmVkb19fLmZvckVhY2goZnVuY3Rpb24gKHJlZG8sIGopIHtcblx0XHRcdFx0XHRpZiAocmVkbyA+IGluZGV4KSB0aGlzLl9fcmVkb19fW2pdID0gLS1yZWRvO1xuXHRcdFx0XHR9LCB0aGlzKTtcblx0XHRcdH0pLFxuXHRcdFx0X29uQ2xlYXI6IGQoZnVuY3Rpb24gKCkge1xuXHRcdFx0XHRpZiAodGhpcy5fX3JlZG9fXykgY2xlYXIuY2FsbCh0aGlzLl9fcmVkb19fKTtcblx0XHRcdFx0dGhpcy5fX25leHRJbmRleF9fID0gMDtcblx0XHRcdH0pXG5cdFx0fSlcblx0KVxuKTtcblxuZGVmaW5lUHJvcGVydHkoXG5cdEl0ZXJhdG9yLnByb3RvdHlwZSxcblx0U3ltYm9sLml0ZXJhdG9yLFxuXHRkKGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcztcblx0fSlcbik7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGlzQXJndW1lbnRzID0gcmVxdWlyZShcImVzNS1leHQvZnVuY3Rpb24vaXMtYXJndW1lbnRzXCIpXG4gICwgaXNWYWx1ZSAgICAgPSByZXF1aXJlKFwiZXM1LWV4dC9vYmplY3QvaXMtdmFsdWVcIilcbiAgLCBpc1N0cmluZyAgICA9IHJlcXVpcmUoXCJlczUtZXh0L3N0cmluZy9pcy1zdHJpbmdcIik7XG5cbnZhciBpdGVyYXRvclN5bWJvbCA9IHJlcXVpcmUoXCJlczYtc3ltYm9sXCIpLml0ZXJhdG9yXG4gICwgaXNBcnJheSAgICAgICAgPSBBcnJheS5pc0FycmF5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRpZiAoIWlzVmFsdWUodmFsdWUpKSByZXR1cm4gZmFsc2U7XG5cdGlmIChpc0FycmF5KHZhbHVlKSkgcmV0dXJuIHRydWU7XG5cdGlmIChpc1N0cmluZyh2YWx1ZSkpIHJldHVybiB0cnVlO1xuXHRpZiAoaXNBcmd1bWVudHModmFsdWUpKSByZXR1cm4gdHJ1ZTtcblx0cmV0dXJuIHR5cGVvZiB2YWx1ZVtpdGVyYXRvclN5bWJvbF0gPT09IFwiZnVuY3Rpb25cIjtcbn07XG4iLCIvLyBUaGFua3MgQG1hdGhpYXNieW5lbnNcbi8vIGh0dHA6Ly9tYXRoaWFzYnluZW5zLmJlL25vdGVzL2phdmFzY3JpcHQtdW5pY29kZSNpdGVyYXRpbmctb3Zlci1zeW1ib2xzXG5cblwidXNlIHN0cmljdFwiO1xuXG52YXIgc2V0UHJvdG90eXBlT2YgPSByZXF1aXJlKFwiZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZlwiKVxuICAsIGQgICAgICAgICAgICAgID0gcmVxdWlyZShcImRcIilcbiAgLCBTeW1ib2wgICAgICAgICA9IHJlcXVpcmUoXCJlczYtc3ltYm9sXCIpXG4gICwgSXRlcmF0b3IgICAgICAgPSByZXF1aXJlKFwiLi9cIik7XG5cbnZhciBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgU3RyaW5nSXRlcmF0b3I7XG5cblN0cmluZ0l0ZXJhdG9yID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoc3RyKSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBTdHJpbmdJdGVyYXRvcikpIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDb25zdHJ1Y3RvciByZXF1aXJlcyAnbmV3J1wiKTtcblx0c3RyID0gU3RyaW5nKHN0cik7XG5cdEl0ZXJhdG9yLmNhbGwodGhpcywgc3RyKTtcblx0ZGVmaW5lUHJvcGVydHkodGhpcywgXCJfX2xlbmd0aF9fXCIsIGQoXCJcIiwgc3RyLmxlbmd0aCkpO1xufTtcbmlmIChzZXRQcm90b3R5cGVPZikgc2V0UHJvdG90eXBlT2YoU3RyaW5nSXRlcmF0b3IsIEl0ZXJhdG9yKTtcblxuLy8gSW50ZXJuYWwgJUFycmF5SXRlcmF0b3JQcm90b3R5cGUlIGRvZXNuJ3QgZXhwb3NlIGl0cyBjb25zdHJ1Y3RvclxuZGVsZXRlIFN0cmluZ0l0ZXJhdG9yLnByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcblxuU3RyaW5nSXRlcmF0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShJdGVyYXRvci5wcm90b3R5cGUsIHtcblx0X25leHQ6IGQoZnVuY3Rpb24gKCkge1xuXHRcdGlmICghdGhpcy5fX2xpc3RfXykgcmV0dXJuIHVuZGVmaW5lZDtcblx0XHRpZiAodGhpcy5fX25leHRJbmRleF9fIDwgdGhpcy5fX2xlbmd0aF9fKSByZXR1cm4gdGhpcy5fX25leHRJbmRleF9fKys7XG5cdFx0dGhpcy5fdW5CaW5kKCk7XG5cdFx0cmV0dXJuIHVuZGVmaW5lZDtcblx0fSksXG5cdF9yZXNvbHZlOiBkKGZ1bmN0aW9uIChpKSB7XG5cdFx0dmFyIGNoYXIgPSB0aGlzLl9fbGlzdF9fW2ldLCBjb2RlO1xuXHRcdGlmICh0aGlzLl9fbmV4dEluZGV4X18gPT09IHRoaXMuX19sZW5ndGhfXykgcmV0dXJuIGNoYXI7XG5cdFx0Y29kZSA9IGNoYXIuY2hhckNvZGVBdCgwKTtcblx0XHRpZiAoY29kZSA+PSAweGQ4MDAgJiYgY29kZSA8PSAweGRiZmYpIHJldHVybiBjaGFyICsgdGhpcy5fX2xpc3RfX1t0aGlzLl9fbmV4dEluZGV4X18rK107XG5cdFx0cmV0dXJuIGNoYXI7XG5cdH0pXG59KTtcbmRlZmluZVByb3BlcnR5KFN0cmluZ0l0ZXJhdG9yLnByb3RvdHlwZSwgU3ltYm9sLnRvU3RyaW5nVGFnLCBkKFwiY1wiLCBcIlN0cmluZyBJdGVyYXRvclwiKSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIGlzSXRlcmFibGUgPSByZXF1aXJlKFwiLi9pcy1pdGVyYWJsZVwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0aWYgKCFpc0l0ZXJhYmxlKHZhbHVlKSkgdGhyb3cgbmV3IFR5cGVFcnJvcih2YWx1ZSArIFwiIGlzIG5vdCBpdGVyYWJsZVwiKTtcblx0cmV0dXJuIHZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaWYgKCFyZXF1aXJlKCcuL2lzLWltcGxlbWVudGVkJykoKSkge1xuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkocmVxdWlyZSgnZXM1LWV4dC9nbG9iYWwnKSwgJ01hcCcsXG5cdFx0eyB2YWx1ZTogcmVxdWlyZSgnLi9wb2x5ZmlsbCcpLCBjb25maWd1cmFibGU6IHRydWUsIGVudW1lcmFibGU6IGZhbHNlLFxuXHRcdFx0d3JpdGFibGU6IHRydWUgfSk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgbWFwLCBpdGVyYXRvciwgcmVzdWx0O1xuXHRpZiAodHlwZW9mIE1hcCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHR0cnkge1xuXHRcdC8vIFdlYktpdCBkb2Vzbid0IHN1cHBvcnQgYXJndW1lbnRzIGFuZCBjcmFzaGVzXG5cdFx0bWFwID0gbmV3IE1hcChbWydyYXonLCAnb25lJ10sIFsnZHdhJywgJ3R3byddLCBbJ3RyenknLCAndGhyZWUnXV0pO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cdGlmIChTdHJpbmcobWFwKSAhPT0gJ1tvYmplY3QgTWFwXScpIHJldHVybiBmYWxzZTtcblx0aWYgKG1hcC5zaXplICE9PSAzKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLmNsZWFyICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLmRlbGV0ZSAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC5lbnRyaWVzICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLmZvckVhY2ggIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblx0aWYgKHR5cGVvZiBtYXAuZ2V0ICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLmhhcyAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC5rZXlzICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gZmFsc2U7XG5cdGlmICh0eXBlb2YgbWFwLnNldCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIG1hcC52YWx1ZXMgIT09ICdmdW5jdGlvbicpIHJldHVybiBmYWxzZTtcblxuXHRpdGVyYXRvciA9IG1hcC5lbnRyaWVzKCk7XG5cdHJlc3VsdCA9IGl0ZXJhdG9yLm5leHQoKTtcblx0aWYgKHJlc3VsdC5kb25lICE9PSBmYWxzZSkgcmV0dXJuIGZhbHNlO1xuXHRpZiAoIXJlc3VsdC52YWx1ZSkgcmV0dXJuIGZhbHNlO1xuXHRpZiAocmVzdWx0LnZhbHVlWzBdICE9PSAncmF6JykgcmV0dXJuIGZhbHNlO1xuXHRpZiAocmVzdWx0LnZhbHVlWzFdICE9PSAnb25lJykgcmV0dXJuIGZhbHNlO1xuXG5cdHJldHVybiB0cnVlO1xufTtcbiIsIi8vIEV4cG9ydHMgdHJ1ZSBpZiBlbnZpcm9ubWVudCBwcm92aWRlcyBuYXRpdmUgYE1hcGAgaW1wbGVtZW50YXRpb24sXG4vLyB3aGF0ZXZlciB0aGF0IGlzLlxuXG4ndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcblx0aWYgKHR5cGVvZiBNYXAgPT09ICd1bmRlZmluZWQnKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiAoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG5ldyBNYXAoKSkgPT09ICdbb2JqZWN0IE1hcF0nKTtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3QvcHJpbWl0aXZlLXNldCcpKCdrZXknLFxuXHQndmFsdWUnLCAna2V5K3ZhbHVlJyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzZXRQcm90b3R5cGVPZiAgICA9IHJlcXVpcmUoJ2VzNS1leHQvb2JqZWN0L3NldC1wcm90b3R5cGUtb2YnKVxuICAsIGQgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnZCcpXG4gICwgSXRlcmF0b3IgICAgICAgICAgPSByZXF1aXJlKCdlczYtaXRlcmF0b3InKVxuICAsIHRvU3RyaW5nVGFnU3ltYm9sID0gcmVxdWlyZSgnZXM2LXN5bWJvbCcpLnRvU3RyaW5nVGFnXG4gICwga2luZHMgICAgICAgICAgICAgPSByZXF1aXJlKCcuL2l0ZXJhdG9yLWtpbmRzJylcblxuICAsIGRlZmluZVByb3BlcnRpZXMgPSBPYmplY3QuZGVmaW5lUHJvcGVydGllc1xuICAsIHVuQmluZCA9IEl0ZXJhdG9yLnByb3RvdHlwZS5fdW5CaW5kXG4gICwgTWFwSXRlcmF0b3I7XG5cbk1hcEl0ZXJhdG9yID0gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAobWFwLCBraW5kKSB7XG5cdGlmICghKHRoaXMgaW5zdGFuY2VvZiBNYXBJdGVyYXRvcikpIHJldHVybiBuZXcgTWFwSXRlcmF0b3IobWFwLCBraW5kKTtcblx0SXRlcmF0b3IuY2FsbCh0aGlzLCBtYXAuX19tYXBLZXlzRGF0YV9fLCBtYXApO1xuXHRpZiAoIWtpbmQgfHwgIWtpbmRzW2tpbmRdKSBraW5kID0gJ2tleSt2YWx1ZSc7XG5cdGRlZmluZVByb3BlcnRpZXModGhpcywge1xuXHRcdF9fa2luZF9fOiBkKCcnLCBraW5kKSxcblx0XHRfX3ZhbHVlc19fOiBkKCd3JywgbWFwLl9fbWFwVmFsdWVzRGF0YV9fKVxuXHR9KTtcbn07XG5pZiAoc2V0UHJvdG90eXBlT2YpIHNldFByb3RvdHlwZU9mKE1hcEl0ZXJhdG9yLCBJdGVyYXRvcik7XG5cbk1hcEl0ZXJhdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoSXRlcmF0b3IucHJvdG90eXBlLCB7XG5cdGNvbnN0cnVjdG9yOiBkKE1hcEl0ZXJhdG9yKSxcblx0X3Jlc29sdmU6IGQoZnVuY3Rpb24gKGkpIHtcblx0XHRpZiAodGhpcy5fX2tpbmRfXyA9PT0gJ3ZhbHVlJykgcmV0dXJuIHRoaXMuX192YWx1ZXNfX1tpXTtcblx0XHRpZiAodGhpcy5fX2tpbmRfXyA9PT0gJ2tleScpIHJldHVybiB0aGlzLl9fbGlzdF9fW2ldO1xuXHRcdHJldHVybiBbdGhpcy5fX2xpc3RfX1tpXSwgdGhpcy5fX3ZhbHVlc19fW2ldXTtcblx0fSksXG5cdF91bkJpbmQ6IGQoZnVuY3Rpb24gKCkge1xuXHRcdHRoaXMuX192YWx1ZXNfXyA9IG51bGw7XG5cdFx0dW5CaW5kLmNhbGwodGhpcyk7XG5cdH0pLFxuXHR0b1N0cmluZzogZChmdW5jdGlvbiAoKSB7IHJldHVybiAnW29iamVjdCBNYXAgSXRlcmF0b3JdJzsgfSlcbn0pO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KE1hcEl0ZXJhdG9yLnByb3RvdHlwZSwgdG9TdHJpbmdUYWdTeW1ib2wsXG5cdGQoJ2MnLCAnTWFwIEl0ZXJhdG9yJykpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xlYXIgICAgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L2FycmF5LyMvY2xlYXInKVxuICAsIGVJbmRleE9mICAgICAgID0gcmVxdWlyZSgnZXM1LWV4dC9hcnJheS8jL2UtaW5kZXgtb2YnKVxuICAsIHNldFByb3RvdHlwZU9mID0gcmVxdWlyZSgnZXM1LWV4dC9vYmplY3Qvc2V0LXByb3RvdHlwZS1vZicpXG4gICwgY2FsbGFibGUgICAgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZScpXG4gICwgdmFsaWRWYWx1ZSAgICAgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC12YWx1ZScpXG4gICwgZCAgICAgICAgICAgICAgPSByZXF1aXJlKCdkJylcbiAgLCBlZSAgICAgICAgICAgICA9IHJlcXVpcmUoJ2V2ZW50LWVtaXR0ZXInKVxuICAsIFN5bWJvbCAgICAgICAgID0gcmVxdWlyZSgnZXM2LXN5bWJvbCcpXG4gICwgaXRlcmF0b3IgICAgICAgPSByZXF1aXJlKCdlczYtaXRlcmF0b3IvdmFsaWQtaXRlcmFibGUnKVxuICAsIGZvck9mICAgICAgICAgID0gcmVxdWlyZSgnZXM2LWl0ZXJhdG9yL2Zvci1vZicpXG4gICwgSXRlcmF0b3IgICAgICAgPSByZXF1aXJlKCcuL2xpYi9pdGVyYXRvcicpXG4gICwgaXNOYXRpdmUgICAgICAgPSByZXF1aXJlKCcuL2lzLW5hdGl2ZS1pbXBsZW1lbnRlZCcpXG5cbiAgLCBjYWxsID0gRnVuY3Rpb24ucHJvdG90eXBlLmNhbGxcbiAgLCBkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXMsIGdldFByb3RvdHlwZU9mID0gT2JqZWN0LmdldFByb3RvdHlwZU9mXG4gICwgTWFwUG9seTtcblxubW9kdWxlLmV4cG9ydHMgPSBNYXBQb2x5ID0gZnVuY3Rpb24gKC8qaXRlcmFibGUqLykge1xuXHR2YXIgaXRlcmFibGUgPSBhcmd1bWVudHNbMF0sIGtleXMsIHZhbHVlcywgc2VsZjtcblx0aWYgKCEodGhpcyBpbnN0YW5jZW9mIE1hcFBvbHkpKSB0aHJvdyBuZXcgVHlwZUVycm9yKCdDb25zdHJ1Y3RvciByZXF1aXJlcyBcXCduZXdcXCcnKTtcblx0aWYgKGlzTmF0aXZlICYmIHNldFByb3RvdHlwZU9mICYmIChNYXAgIT09IE1hcFBvbHkpKSB7XG5cdFx0c2VsZiA9IHNldFByb3RvdHlwZU9mKG5ldyBNYXAoKSwgZ2V0UHJvdG90eXBlT2YodGhpcykpO1xuXHR9IGVsc2Uge1xuXHRcdHNlbGYgPSB0aGlzO1xuXHR9XG5cdGlmIChpdGVyYWJsZSAhPSBudWxsKSBpdGVyYXRvcihpdGVyYWJsZSk7XG5cdGRlZmluZVByb3BlcnRpZXMoc2VsZiwge1xuXHRcdF9fbWFwS2V5c0RhdGFfXzogZCgnYycsIGtleXMgPSBbXSksXG5cdFx0X19tYXBWYWx1ZXNEYXRhX186IGQoJ2MnLCB2YWx1ZXMgPSBbXSlcblx0fSk7XG5cdGlmICghaXRlcmFibGUpIHJldHVybiBzZWxmO1xuXHRmb3JPZihpdGVyYWJsZSwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cdFx0dmFyIGtleSA9IHZhbGlkVmFsdWUodmFsdWUpWzBdO1xuXHRcdHZhbHVlID0gdmFsdWVbMV07XG5cdFx0aWYgKGVJbmRleE9mLmNhbGwoa2V5cywga2V5KSAhPT0gLTEpIHJldHVybjtcblx0XHRrZXlzLnB1c2goa2V5KTtcblx0XHR2YWx1ZXMucHVzaCh2YWx1ZSk7XG5cdH0sIHNlbGYpO1xuXHRyZXR1cm4gc2VsZjtcbn07XG5cbmlmIChpc05hdGl2ZSkge1xuXHRpZiAoc2V0UHJvdG90eXBlT2YpIHNldFByb3RvdHlwZU9mKE1hcFBvbHksIE1hcCk7XG5cdE1hcFBvbHkucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShNYXAucHJvdG90eXBlLCB7XG5cdFx0Y29uc3RydWN0b3I6IGQoTWFwUG9seSlcblx0fSk7XG59XG5cbmVlKGRlZmluZVByb3BlcnRpZXMoTWFwUG9seS5wcm90b3R5cGUsIHtcblx0Y2xlYXI6IGQoZnVuY3Rpb24gKCkge1xuXHRcdGlmICghdGhpcy5fX21hcEtleXNEYXRhX18ubGVuZ3RoKSByZXR1cm47XG5cdFx0Y2xlYXIuY2FsbCh0aGlzLl9fbWFwS2V5c0RhdGFfXyk7XG5cdFx0Y2xlYXIuY2FsbCh0aGlzLl9fbWFwVmFsdWVzRGF0YV9fKTtcblx0XHR0aGlzLmVtaXQoJ19jbGVhcicpO1xuXHR9KSxcblx0ZGVsZXRlOiBkKGZ1bmN0aW9uIChrZXkpIHtcblx0XHR2YXIgaW5kZXggPSBlSW5kZXhPZi5jYWxsKHRoaXMuX19tYXBLZXlzRGF0YV9fLCBrZXkpO1xuXHRcdGlmIChpbmRleCA9PT0gLTEpIHJldHVybiBmYWxzZTtcblx0XHR0aGlzLl9fbWFwS2V5c0RhdGFfXy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdHRoaXMuX19tYXBWYWx1ZXNEYXRhX18uc3BsaWNlKGluZGV4LCAxKTtcblx0XHR0aGlzLmVtaXQoJ19kZWxldGUnLCBpbmRleCwga2V5KTtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSksXG5cdGVudHJpZXM6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IEl0ZXJhdG9yKHRoaXMsICdrZXkrdmFsdWUnKTsgfSksXG5cdGZvckVhY2g6IGQoZnVuY3Rpb24gKGNiLyosIHRoaXNBcmcqLykge1xuXHRcdHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdLCBpdGVyYXRvciwgcmVzdWx0O1xuXHRcdGNhbGxhYmxlKGNiKTtcblx0XHRpdGVyYXRvciA9IHRoaXMuZW50cmllcygpO1xuXHRcdHJlc3VsdCA9IGl0ZXJhdG9yLl9uZXh0KCk7XG5cdFx0d2hpbGUgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRjYWxsLmNhbGwoY2IsIHRoaXNBcmcsIHRoaXMuX19tYXBWYWx1ZXNEYXRhX19bcmVzdWx0XSxcblx0XHRcdFx0dGhpcy5fX21hcEtleXNEYXRhX19bcmVzdWx0XSwgdGhpcyk7XG5cdFx0XHRyZXN1bHQgPSBpdGVyYXRvci5fbmV4dCgpO1xuXHRcdH1cblx0fSksXG5cdGdldDogZChmdW5jdGlvbiAoa2V5KSB7XG5cdFx0dmFyIGluZGV4ID0gZUluZGV4T2YuY2FsbCh0aGlzLl9fbWFwS2V5c0RhdGFfXywga2V5KTtcblx0XHRpZiAoaW5kZXggPT09IC0xKSByZXR1cm47XG5cdFx0cmV0dXJuIHRoaXMuX19tYXBWYWx1ZXNEYXRhX19baW5kZXhdO1xuXHR9KSxcblx0aGFzOiBkKGZ1bmN0aW9uIChrZXkpIHtcblx0XHRyZXR1cm4gKGVJbmRleE9mLmNhbGwodGhpcy5fX21hcEtleXNEYXRhX18sIGtleSkgIT09IC0xKTtcblx0fSksXG5cdGtleXM6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IEl0ZXJhdG9yKHRoaXMsICdrZXknKTsgfSksXG5cdHNldDogZChmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuXHRcdHZhciBpbmRleCA9IGVJbmRleE9mLmNhbGwodGhpcy5fX21hcEtleXNEYXRhX18sIGtleSksIGVtaXQ7XG5cdFx0aWYgKGluZGV4ID09PSAtMSkge1xuXHRcdFx0aW5kZXggPSB0aGlzLl9fbWFwS2V5c0RhdGFfXy5wdXNoKGtleSkgLSAxO1xuXHRcdFx0ZW1pdCA9IHRydWU7XG5cdFx0fVxuXHRcdHRoaXMuX19tYXBWYWx1ZXNEYXRhX19baW5kZXhdID0gdmFsdWU7XG5cdFx0aWYgKGVtaXQpIHRoaXMuZW1pdCgnX2FkZCcsIGluZGV4LCBrZXkpO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9KSxcblx0c2l6ZTogZC5ncyhmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9fbWFwS2V5c0RhdGFfXy5sZW5ndGg7IH0pLFxuXHR2YWx1ZXM6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IEl0ZXJhdG9yKHRoaXMsICd2YWx1ZScpOyB9KSxcblx0dG9TdHJpbmc6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1tvYmplY3QgTWFwXSc7IH0pXG59KSk7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoTWFwUG9seS5wcm90b3R5cGUsIFN5bWJvbC5pdGVyYXRvciwgZChmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLmVudHJpZXMoKTtcbn0pKTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShNYXBQb2x5LnByb3RvdHlwZSwgU3ltYm9sLnRvU3RyaW5nVGFnLCBkKCdjJywgJ01hcCcpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2lzLWltcGxlbWVudGVkJykoKSA/IFN5bWJvbCA6IHJlcXVpcmUoJy4vcG9seWZpbGwnKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHZhbGlkVHlwZXMgPSB7IG9iamVjdDogdHJ1ZSwgc3ltYm9sOiB0cnVlIH07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKCkge1xuXHR2YXIgc3ltYm9sO1xuXHRpZiAodHlwZW9mIFN5bWJvbCAhPT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGZhbHNlO1xuXHRzeW1ib2wgPSBTeW1ib2woJ3Rlc3Qgc3ltYm9sJyk7XG5cdHRyeSB7IFN0cmluZyhzeW1ib2wpOyB9IGNhdGNoIChlKSB7IHJldHVybiBmYWxzZTsgfVxuXG5cdC8vIFJldHVybiAndHJ1ZScgYWxzbyBmb3IgcG9seWZpbGxzXG5cdGlmICghdmFsaWRUeXBlc1t0eXBlb2YgU3ltYm9sLml0ZXJhdG9yXSkgcmV0dXJuIGZhbHNlO1xuXHRpZiAoIXZhbGlkVHlwZXNbdHlwZW9mIFN5bWJvbC50b1ByaW1pdGl2ZV0pIHJldHVybiBmYWxzZTtcblx0aWYgKCF2YWxpZFR5cGVzW3R5cGVvZiBTeW1ib2wudG9TdHJpbmdUYWddKSByZXR1cm4gZmFsc2U7XG5cblx0cmV0dXJuIHRydWU7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh4KSB7XG5cdGlmICgheCkgcmV0dXJuIGZhbHNlO1xuXHRpZiAodHlwZW9mIHggPT09ICdzeW1ib2wnKSByZXR1cm4gdHJ1ZTtcblx0aWYgKCF4LmNvbnN0cnVjdG9yKSByZXR1cm4gZmFsc2U7XG5cdGlmICh4LmNvbnN0cnVjdG9yLm5hbWUgIT09ICdTeW1ib2wnKSByZXR1cm4gZmFsc2U7XG5cdHJldHVybiAoeFt4LmNvbnN0cnVjdG9yLnRvU3RyaW5nVGFnXSA9PT0gJ1N5bWJvbCcpO1xufTtcbiIsIi8vIEVTMjAxNSBTeW1ib2wgcG9seWZpbGwgZm9yIGVudmlyb25tZW50cyB0aGF0IGRvIG5vdCAob3IgcGFydGlhbGx5KSBzdXBwb3J0IGl0XG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGQgICAgICAgICAgICAgID0gcmVxdWlyZSgnZCcpXG4gICwgdmFsaWRhdGVTeW1ib2wgPSByZXF1aXJlKCcuL3ZhbGlkYXRlLXN5bWJvbCcpXG5cbiAgLCBjcmVhdGUgPSBPYmplY3QuY3JlYXRlLCBkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgLCBkZWZpbmVQcm9wZXJ0eSA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eSwgb2JqUHJvdG90eXBlID0gT2JqZWN0LnByb3RvdHlwZVxuICAsIE5hdGl2ZVN5bWJvbCwgU3ltYm9sUG9seWZpbGwsIEhpZGRlblN5bWJvbCwgZ2xvYmFsU3ltYm9scyA9IGNyZWF0ZShudWxsKVxuICAsIGlzTmF0aXZlU2FmZTtcblxuaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicpIHtcblx0TmF0aXZlU3ltYm9sID0gU3ltYm9sO1xuXHR0cnkge1xuXHRcdFN0cmluZyhOYXRpdmVTeW1ib2woKSk7XG5cdFx0aXNOYXRpdmVTYWZlID0gdHJ1ZTtcblx0fSBjYXRjaCAoaWdub3JlKSB7fVxufVxuXG52YXIgZ2VuZXJhdGVOYW1lID0gKGZ1bmN0aW9uICgpIHtcblx0dmFyIGNyZWF0ZWQgPSBjcmVhdGUobnVsbCk7XG5cdHJldHVybiBmdW5jdGlvbiAoZGVzYykge1xuXHRcdHZhciBwb3N0Zml4ID0gMCwgbmFtZSwgaWUxMUJ1Z1dvcmthcm91bmQ7XG5cdFx0d2hpbGUgKGNyZWF0ZWRbZGVzYyArIChwb3N0Zml4IHx8ICcnKV0pICsrcG9zdGZpeDtcblx0XHRkZXNjICs9IChwb3N0Zml4IHx8ICcnKTtcblx0XHRjcmVhdGVkW2Rlc2NdID0gdHJ1ZTtcblx0XHRuYW1lID0gJ0BAJyArIGRlc2M7XG5cdFx0ZGVmaW5lUHJvcGVydHkob2JqUHJvdG90eXBlLCBuYW1lLCBkLmdzKG51bGwsIGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRcdFx0Ly8gRm9yIElFMTEgaXNzdWUgc2VlOlxuXHRcdFx0Ly8gaHR0cHM6Ly9jb25uZWN0Lm1pY3Jvc29mdC5jb20vSUUvZmVlZGJhY2tkZXRhaWwvdmlldy8xOTI4NTA4L1xuXHRcdFx0Ly8gICAgaWUxMS1icm9rZW4tZ2V0dGVycy1vbi1kb20tb2JqZWN0c1xuXHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL21lZGlrb28vZXM2LXN5bWJvbC9pc3N1ZXMvMTJcblx0XHRcdGlmIChpZTExQnVnV29ya2Fyb3VuZCkgcmV0dXJuO1xuXHRcdFx0aWUxMUJ1Z1dvcmthcm91bmQgPSB0cnVlO1xuXHRcdFx0ZGVmaW5lUHJvcGVydHkodGhpcywgbmFtZSwgZCh2YWx1ZSkpO1xuXHRcdFx0aWUxMUJ1Z1dvcmthcm91bmQgPSBmYWxzZTtcblx0XHR9KSk7XG5cdFx0cmV0dXJuIG5hbWU7XG5cdH07XG59KCkpO1xuXG4vLyBJbnRlcm5hbCBjb25zdHJ1Y3RvciAobm90IG9uZSBleHBvc2VkKSBmb3IgY3JlYXRpbmcgU3ltYm9sIGluc3RhbmNlcy5cbi8vIFRoaXMgb25lIGlzIHVzZWQgdG8gZW5zdXJlIHRoYXQgYHNvbWVTeW1ib2wgaW5zdGFuY2VvZiBTeW1ib2xgIGFsd2F5cyByZXR1cm4gZmFsc2VcbkhpZGRlblN5bWJvbCA9IGZ1bmN0aW9uIFN5bWJvbChkZXNjcmlwdGlvbikge1xuXHRpZiAodGhpcyBpbnN0YW5jZW9mIEhpZGRlblN5bWJvbCkgdGhyb3cgbmV3IFR5cGVFcnJvcignU3ltYm9sIGlzIG5vdCBhIGNvbnN0cnVjdG9yJyk7XG5cdHJldHVybiBTeW1ib2xQb2x5ZmlsbChkZXNjcmlwdGlvbik7XG59O1xuXG4vLyBFeHBvc2VkIGBTeW1ib2xgIGNvbnN0cnVjdG9yXG4vLyAocmV0dXJucyBpbnN0YW5jZXMgb2YgSGlkZGVuU3ltYm9sKVxubW9kdWxlLmV4cG9ydHMgPSBTeW1ib2xQb2x5ZmlsbCA9IGZ1bmN0aW9uIFN5bWJvbChkZXNjcmlwdGlvbikge1xuXHR2YXIgc3ltYm9sO1xuXHRpZiAodGhpcyBpbnN0YW5jZW9mIFN5bWJvbCkgdGhyb3cgbmV3IFR5cGVFcnJvcignU3ltYm9sIGlzIG5vdCBhIGNvbnN0cnVjdG9yJyk7XG5cdGlmIChpc05hdGl2ZVNhZmUpIHJldHVybiBOYXRpdmVTeW1ib2woZGVzY3JpcHRpb24pO1xuXHRzeW1ib2wgPSBjcmVhdGUoSGlkZGVuU3ltYm9sLnByb3RvdHlwZSk7XG5cdGRlc2NyaXB0aW9uID0gKGRlc2NyaXB0aW9uID09PSB1bmRlZmluZWQgPyAnJyA6IFN0cmluZyhkZXNjcmlwdGlvbikpO1xuXHRyZXR1cm4gZGVmaW5lUHJvcGVydGllcyhzeW1ib2wsIHtcblx0XHRfX2Rlc2NyaXB0aW9uX186IGQoJycsIGRlc2NyaXB0aW9uKSxcblx0XHRfX25hbWVfXzogZCgnJywgZ2VuZXJhdGVOYW1lKGRlc2NyaXB0aW9uKSlcblx0fSk7XG59O1xuZGVmaW5lUHJvcGVydGllcyhTeW1ib2xQb2x5ZmlsbCwge1xuXHRmb3I6IGQoZnVuY3Rpb24gKGtleSkge1xuXHRcdGlmIChnbG9iYWxTeW1ib2xzW2tleV0pIHJldHVybiBnbG9iYWxTeW1ib2xzW2tleV07XG5cdFx0cmV0dXJuIChnbG9iYWxTeW1ib2xzW2tleV0gPSBTeW1ib2xQb2x5ZmlsbChTdHJpbmcoa2V5KSkpO1xuXHR9KSxcblx0a2V5Rm9yOiBkKGZ1bmN0aW9uIChzKSB7XG5cdFx0dmFyIGtleTtcblx0XHR2YWxpZGF0ZVN5bWJvbChzKTtcblx0XHRmb3IgKGtleSBpbiBnbG9iYWxTeW1ib2xzKSBpZiAoZ2xvYmFsU3ltYm9sc1trZXldID09PSBzKSByZXR1cm4ga2V5O1xuXHR9KSxcblxuXHQvLyBUbyBlbnN1cmUgcHJvcGVyIGludGVyb3BlcmFiaWxpdHkgd2l0aCBvdGhlciBuYXRpdmUgZnVuY3Rpb25zIChlLmcuIEFycmF5LmZyb20pXG5cdC8vIGZhbGxiYWNrIHRvIGV2ZW50dWFsIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiBvZiBnaXZlbiBzeW1ib2xcblx0aGFzSW5zdGFuY2U6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLmhhc0luc3RhbmNlKSB8fCBTeW1ib2xQb2x5ZmlsbCgnaGFzSW5zdGFuY2UnKSksXG5cdGlzQ29uY2F0U3ByZWFkYWJsZTogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wuaXNDb25jYXRTcHJlYWRhYmxlKSB8fFxuXHRcdFN5bWJvbFBvbHlmaWxsKCdpc0NvbmNhdFNwcmVhZGFibGUnKSksXG5cdGl0ZXJhdG9yOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC5pdGVyYXRvcikgfHwgU3ltYm9sUG9seWZpbGwoJ2l0ZXJhdG9yJykpLFxuXHRtYXRjaDogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wubWF0Y2gpIHx8IFN5bWJvbFBvbHlmaWxsKCdtYXRjaCcpKSxcblx0cmVwbGFjZTogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wucmVwbGFjZSkgfHwgU3ltYm9sUG9seWZpbGwoJ3JlcGxhY2UnKSksXG5cdHNlYXJjaDogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wuc2VhcmNoKSB8fCBTeW1ib2xQb2x5ZmlsbCgnc2VhcmNoJykpLFxuXHRzcGVjaWVzOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC5zcGVjaWVzKSB8fCBTeW1ib2xQb2x5ZmlsbCgnc3BlY2llcycpKSxcblx0c3BsaXQ6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLnNwbGl0KSB8fCBTeW1ib2xQb2x5ZmlsbCgnc3BsaXQnKSksXG5cdHRvUHJpbWl0aXZlOiBkKCcnLCAoTmF0aXZlU3ltYm9sICYmIE5hdGl2ZVN5bWJvbC50b1ByaW1pdGl2ZSkgfHwgU3ltYm9sUG9seWZpbGwoJ3RvUHJpbWl0aXZlJykpLFxuXHR0b1N0cmluZ1RhZzogZCgnJywgKE5hdGl2ZVN5bWJvbCAmJiBOYXRpdmVTeW1ib2wudG9TdHJpbmdUYWcpIHx8IFN5bWJvbFBvbHlmaWxsKCd0b1N0cmluZ1RhZycpKSxcblx0dW5zY29wYWJsZXM6IGQoJycsIChOYXRpdmVTeW1ib2wgJiYgTmF0aXZlU3ltYm9sLnVuc2NvcGFibGVzKSB8fCBTeW1ib2xQb2x5ZmlsbCgndW5zY29wYWJsZXMnKSlcbn0pO1xuXG4vLyBJbnRlcm5hbCB0d2Vha3MgZm9yIHJlYWwgc3ltYm9sIHByb2R1Y2VyXG5kZWZpbmVQcm9wZXJ0aWVzKEhpZGRlblN5bWJvbC5wcm90b3R5cGUsIHtcblx0Y29uc3RydWN0b3I6IGQoU3ltYm9sUG9seWZpbGwpLFxuXHR0b1N0cmluZzogZCgnJywgZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy5fX25hbWVfXzsgfSlcbn0pO1xuXG4vLyBQcm9wZXIgaW1wbGVtZW50YXRpb24gb2YgbWV0aG9kcyBleHBvc2VkIG9uIFN5bWJvbC5wcm90b3R5cGVcbi8vIFRoZXkgd29uJ3QgYmUgYWNjZXNzaWJsZSBvbiBwcm9kdWNlZCBzeW1ib2wgaW5zdGFuY2VzIGFzIHRoZXkgZGVyaXZlIGZyb20gSGlkZGVuU3ltYm9sLnByb3RvdHlwZVxuZGVmaW5lUHJvcGVydGllcyhTeW1ib2xQb2x5ZmlsbC5wcm90b3R5cGUsIHtcblx0dG9TdHJpbmc6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gJ1N5bWJvbCAoJyArIHZhbGlkYXRlU3ltYm9sKHRoaXMpLl9fZGVzY3JpcHRpb25fXyArICcpJzsgfSksXG5cdHZhbHVlT2Y6IGQoZnVuY3Rpb24gKCkgeyByZXR1cm4gdmFsaWRhdGVTeW1ib2wodGhpcyk7IH0pXG59KTtcbmRlZmluZVByb3BlcnR5KFN5bWJvbFBvbHlmaWxsLnByb3RvdHlwZSwgU3ltYm9sUG9seWZpbGwudG9QcmltaXRpdmUsIGQoJycsIGZ1bmN0aW9uICgpIHtcblx0dmFyIHN5bWJvbCA9IHZhbGlkYXRlU3ltYm9sKHRoaXMpO1xuXHRpZiAodHlwZW9mIHN5bWJvbCA9PT0gJ3N5bWJvbCcpIHJldHVybiBzeW1ib2w7XG5cdHJldHVybiBzeW1ib2wudG9TdHJpbmcoKTtcbn0pKTtcbmRlZmluZVByb3BlcnR5KFN5bWJvbFBvbHlmaWxsLnByb3RvdHlwZSwgU3ltYm9sUG9seWZpbGwudG9TdHJpbmdUYWcsIGQoJ2MnLCAnU3ltYm9sJykpO1xuXG4vLyBQcm9wZXIgaW1wbGVtZW50YXRvbiBvZiB0b1ByaW1pdGl2ZSBhbmQgdG9TdHJpbmdUYWcgZm9yIHJldHVybmVkIHN5bWJvbCBpbnN0YW5jZXNcbmRlZmluZVByb3BlcnR5KEhpZGRlblN5bWJvbC5wcm90b3R5cGUsIFN5bWJvbFBvbHlmaWxsLnRvU3RyaW5nVGFnLFxuXHRkKCdjJywgU3ltYm9sUG9seWZpbGwucHJvdG90eXBlW1N5bWJvbFBvbHlmaWxsLnRvU3RyaW5nVGFnXSkpO1xuXG4vLyBOb3RlOiBJdCdzIGltcG9ydGFudCB0byBkZWZpbmUgYHRvUHJpbWl0aXZlYCBhcyBsYXN0IG9uZSwgYXMgc29tZSBpbXBsZW1lbnRhdGlvbnNcbi8vIGltcGxlbWVudCBgdG9QcmltaXRpdmVgIG5hdGl2ZWx5IHdpdGhvdXQgaW1wbGVtZW50aW5nIGB0b1N0cmluZ1RhZ2AgKG9yIG90aGVyIHNwZWNpZmllZCBzeW1ib2xzKVxuLy8gQW5kIHRoYXQgbWF5IGludm9rZSBlcnJvciBpbiBkZWZpbml0aW9uIGZsb3c6XG4vLyBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9tZWRpa29vL2VzNi1zeW1ib2wvaXNzdWVzLzEzI2lzc3VlY29tbWVudC0xNjQxNDYxNDlcbmRlZmluZVByb3BlcnR5KEhpZGRlblN5bWJvbC5wcm90b3R5cGUsIFN5bWJvbFBvbHlmaWxsLnRvUHJpbWl0aXZlLFxuXHRkKCdjJywgU3ltYm9sUG9seWZpbGwucHJvdG90eXBlW1N5bWJvbFBvbHlmaWxsLnRvUHJpbWl0aXZlXSkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgaXNTeW1ib2wgPSByZXF1aXJlKCcuL2lzLXN5bWJvbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHRpZiAoIWlzU3ltYm9sKHZhbHVlKSkgdGhyb3cgbmV3IFR5cGVFcnJvcih2YWx1ZSArIFwiIGlzIG5vdCBhIHN5bWJvbFwiKTtcblx0cmV0dXJuIHZhbHVlO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGQgICAgICAgID0gcmVxdWlyZSgnZCcpXG4gICwgY2FsbGFibGUgPSByZXF1aXJlKCdlczUtZXh0L29iamVjdC92YWxpZC1jYWxsYWJsZScpXG5cbiAgLCBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseSwgY2FsbCA9IEZ1bmN0aW9uLnByb3RvdHlwZS5jYWxsXG4gICwgY3JlYXRlID0gT2JqZWN0LmNyZWF0ZSwgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHlcbiAgLCBkZWZpbmVQcm9wZXJ0aWVzID0gT2JqZWN0LmRlZmluZVByb3BlcnRpZXNcbiAgLCBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHlcbiAgLCBkZXNjcmlwdG9yID0geyBjb25maWd1cmFibGU6IHRydWUsIGVudW1lcmFibGU6IGZhbHNlLCB3cml0YWJsZTogdHJ1ZSB9XG5cbiAgLCBvbiwgb25jZSwgb2ZmLCBlbWl0LCBtZXRob2RzLCBkZXNjcmlwdG9ycywgYmFzZTtcblxub24gPSBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0dmFyIGRhdGE7XG5cblx0Y2FsbGFibGUobGlzdGVuZXIpO1xuXG5cdGlmICghaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCAnX19lZV9fJykpIHtcblx0XHRkYXRhID0gZGVzY3JpcHRvci52YWx1ZSA9IGNyZWF0ZShudWxsKTtcblx0XHRkZWZpbmVQcm9wZXJ0eSh0aGlzLCAnX19lZV9fJywgZGVzY3JpcHRvcik7XG5cdFx0ZGVzY3JpcHRvci52YWx1ZSA9IG51bGw7XG5cdH0gZWxzZSB7XG5cdFx0ZGF0YSA9IHRoaXMuX19lZV9fO1xuXHR9XG5cdGlmICghZGF0YVt0eXBlXSkgZGF0YVt0eXBlXSA9IGxpc3RlbmVyO1xuXHRlbHNlIGlmICh0eXBlb2YgZGF0YVt0eXBlXSA9PT0gJ29iamVjdCcpIGRhdGFbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG5cdGVsc2UgZGF0YVt0eXBlXSA9IFtkYXRhW3R5cGVdLCBsaXN0ZW5lcl07XG5cblx0cmV0dXJuIHRoaXM7XG59O1xuXG5vbmNlID0gZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdHZhciBvbmNlLCBzZWxmO1xuXG5cdGNhbGxhYmxlKGxpc3RlbmVyKTtcblx0c2VsZiA9IHRoaXM7XG5cdG9uLmNhbGwodGhpcywgdHlwZSwgb25jZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRvZmYuY2FsbChzZWxmLCB0eXBlLCBvbmNlKTtcblx0XHRhcHBseS5jYWxsKGxpc3RlbmVyLCB0aGlzLCBhcmd1bWVudHMpO1xuXHR9KTtcblxuXHRvbmNlLl9fZWVPbmNlTGlzdGVuZXJfXyA9IGxpc3RlbmVyO1xuXHRyZXR1cm4gdGhpcztcbn07XG5cbm9mZiA9IGZ1bmN0aW9uICh0eXBlLCBsaXN0ZW5lcikge1xuXHR2YXIgZGF0YSwgbGlzdGVuZXJzLCBjYW5kaWRhdGUsIGk7XG5cblx0Y2FsbGFibGUobGlzdGVuZXIpO1xuXG5cdGlmICghaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCAnX19lZV9fJykpIHJldHVybiB0aGlzO1xuXHRkYXRhID0gdGhpcy5fX2VlX187XG5cdGlmICghZGF0YVt0eXBlXSkgcmV0dXJuIHRoaXM7XG5cdGxpc3RlbmVycyA9IGRhdGFbdHlwZV07XG5cblx0aWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdvYmplY3QnKSB7XG5cdFx0Zm9yIChpID0gMDsgKGNhbmRpZGF0ZSA9IGxpc3RlbmVyc1tpXSk7ICsraSkge1xuXHRcdFx0aWYgKChjYW5kaWRhdGUgPT09IGxpc3RlbmVyKSB8fFxuXHRcdFx0XHRcdChjYW5kaWRhdGUuX19lZU9uY2VMaXN0ZW5lcl9fID09PSBsaXN0ZW5lcikpIHtcblx0XHRcdFx0aWYgKGxpc3RlbmVycy5sZW5ndGggPT09IDIpIGRhdGFbdHlwZV0gPSBsaXN0ZW5lcnNbaSA/IDAgOiAxXTtcblx0XHRcdFx0ZWxzZSBsaXN0ZW5lcnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRpZiAoKGxpc3RlbmVycyA9PT0gbGlzdGVuZXIpIHx8XG5cdFx0XHRcdChsaXN0ZW5lcnMuX19lZU9uY2VMaXN0ZW5lcl9fID09PSBsaXN0ZW5lcikpIHtcblx0XHRcdGRlbGV0ZSBkYXRhW3R5cGVdO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiB0aGlzO1xufTtcblxuZW1pdCA9IGZ1bmN0aW9uICh0eXBlKSB7XG5cdHZhciBpLCBsLCBsaXN0ZW5lciwgbGlzdGVuZXJzLCBhcmdzO1xuXG5cdGlmICghaGFzT3duUHJvcGVydHkuY2FsbCh0aGlzLCAnX19lZV9fJykpIHJldHVybjtcblx0bGlzdGVuZXJzID0gdGhpcy5fX2VlX19bdHlwZV07XG5cdGlmICghbGlzdGVuZXJzKSByZXR1cm47XG5cblx0aWYgKHR5cGVvZiBsaXN0ZW5lcnMgPT09ICdvYmplY3QnKSB7XG5cdFx0bCA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cdFx0YXJncyA9IG5ldyBBcnJheShsIC0gMSk7XG5cdFx0Zm9yIChpID0gMTsgaSA8IGw7ICsraSkgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cblx0XHRsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuc2xpY2UoKTtcblx0XHRmb3IgKGkgPSAwOyAobGlzdGVuZXIgPSBsaXN0ZW5lcnNbaV0pOyArK2kpIHtcblx0XHRcdGFwcGx5LmNhbGwobGlzdGVuZXIsIHRoaXMsIGFyZ3MpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcblx0XHRjYXNlIDE6XG5cdFx0XHRjYWxsLmNhbGwobGlzdGVuZXJzLCB0aGlzKTtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMjpcblx0XHRcdGNhbGwuY2FsbChsaXN0ZW5lcnMsIHRoaXMsIGFyZ3VtZW50c1sxXSk7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDM6XG5cdFx0XHRjYWxsLmNhbGwobGlzdGVuZXJzLCB0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XG5cdFx0XHRicmVhaztcblx0XHRkZWZhdWx0OlxuXHRcdFx0bCA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cdFx0XHRhcmdzID0gbmV3IEFycmF5KGwgLSAxKTtcblx0XHRcdGZvciAoaSA9IDE7IGkgPCBsOyArK2kpIHtcblx0XHRcdFx0YXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cdFx0XHR9XG5cdFx0XHRhcHBseS5jYWxsKGxpc3RlbmVycywgdGhpcywgYXJncyk7XG5cdFx0fVxuXHR9XG59O1xuXG5tZXRob2RzID0ge1xuXHRvbjogb24sXG5cdG9uY2U6IG9uY2UsXG5cdG9mZjogb2ZmLFxuXHRlbWl0OiBlbWl0XG59O1xuXG5kZXNjcmlwdG9ycyA9IHtcblx0b246IGQob24pLFxuXHRvbmNlOiBkKG9uY2UpLFxuXHRvZmY6IGQob2ZmKSxcblx0ZW1pdDogZChlbWl0KVxufTtcblxuYmFzZSA9IGRlZmluZVByb3BlcnRpZXMoe30sIGRlc2NyaXB0b3JzKTtcblxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gZnVuY3Rpb24gKG8pIHtcblx0cmV0dXJuIChvID09IG51bGwpID8gY3JlYXRlKGJhc2UpIDogZGVmaW5lUHJvcGVydGllcyhPYmplY3QobyksIGRlc2NyaXB0b3JzKTtcbn07XG5leHBvcnRzLm1ldGhvZHMgPSBtZXRob2RzO1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gbWljcm90YXNrKCkge1xuICAgIGlmICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIG5vZGVfMSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgdmFyIHF1ZXVlXzEgPSBbXTtcbiAgICAgICAgdmFyIGlfMSA9IDA7XG4gICAgICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChxdWV1ZV8xLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHF1ZXVlXzEuc2hpZnQoKSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5vYnNlcnZlKG5vZGVfMSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZV8xLnB1c2goZm4pO1xuICAgICAgICAgICAgbm9kZV8xLmRhdGEgPSBpXzEgPSAxIC0gaV8xO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gc2V0SW1tZWRpYXRlO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dDtcbiAgICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBtaWNyb3Rhc2s7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZSgnLi9zZWxlY3RvclBhcnNlcicpO1xuZnVuY3Rpb24gY2xhc3NOYW1lRnJvbVZOb2RlKHZOb2RlKSB7XG4gICAgdmFyIF9hID0gc2VsZWN0b3JQYXJzZXJfMS5zZWxlY3RvclBhcnNlcih2Tm9kZSkuY2xhc3NOYW1lLCBjbiA9IF9hID09PSB2b2lkIDAgPyAnJyA6IF9hO1xuICAgIGlmICghdk5vZGUuZGF0YSkge1xuICAgICAgICByZXR1cm4gY247XG4gICAgfVxuICAgIHZhciBfYiA9IHZOb2RlLmRhdGEsIGRhdGFDbGFzcyA9IF9iLmNsYXNzLCBwcm9wcyA9IF9iLnByb3BzO1xuICAgIGlmIChkYXRhQ2xhc3MpIHtcbiAgICAgICAgdmFyIGMgPSBPYmplY3Qua2V5cyhkYXRhQ2xhc3MpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjbCkgeyByZXR1cm4gZGF0YUNsYXNzW2NsXTsgfSk7XG4gICAgICAgIGNuICs9IFwiIFwiICsgYy5qb2luKFwiIFwiKTtcbiAgICB9XG4gICAgaWYgKHByb3BzICYmIHByb3BzLmNsYXNzTmFtZSkge1xuICAgICAgICBjbiArPSBcIiBcIiArIHByb3BzLmNsYXNzTmFtZTtcbiAgICB9XG4gICAgcmV0dXJuIGNuICYmIGNuLnRyaW0oKTtcbn1cbmV4cG9ydHMuY2xhc3NOYW1lRnJvbVZOb2RlID0gY2xhc3NOYW1lRnJvbVZOb2RlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2xhc3NOYW1lRnJvbVZOb2RlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gY3VycnkyKHNlbGVjdCkge1xuICAgIHJldHVybiBmdW5jdGlvbiBzZWxlY3RvcihzZWwsIHZOb2RlKSB7XG4gICAgICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gc2VsZWN0O1xuICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24gKF92Tm9kZSkgeyByZXR1cm4gc2VsZWN0KHNlbCwgX3ZOb2RlKTsgfTtcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBzZWxlY3Qoc2VsLCB2Tm9kZSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZXhwb3J0cy5jdXJyeTIgPSBjdXJyeTI7XG47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jdXJyeTIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcXVlcnlfMSA9IHJlcXVpcmUoJy4vcXVlcnknKTtcbnZhciBwYXJlbnRfc3ltYm9sXzEgPSByZXF1aXJlKCcuL3BhcmVudC1zeW1ib2wnKTtcbmZ1bmN0aW9uIGZpbmRNYXRjaGVzKGNzc1NlbGVjdG9yLCB2Tm9kZSkge1xuICAgIHRyYXZlcnNlVk5vZGUodk5vZGUsIGFkZFBhcmVudCk7IC8vIGFkZCBtYXBwaW5nIHRvIHRoZSBwYXJlbnQgc2VsZWN0b3JQYXJzZXJcbiAgICByZXR1cm4gcXVlcnlfMS5xdWVyeVNlbGVjdG9yKGNzc1NlbGVjdG9yLCB2Tm9kZSk7XG59XG5leHBvcnRzLmZpbmRNYXRjaGVzID0gZmluZE1hdGNoZXM7XG5mdW5jdGlvbiB0cmF2ZXJzZVZOb2RlKHZOb2RlLCBmKSB7XG4gICAgZnVuY3Rpb24gcmVjdXJzZShjdXJyZW50Tm9kZSwgaXNQYXJlbnQsIHBhcmVudFZOb2RlKSB7XG4gICAgICAgIHZhciBsZW5ndGggPSBjdXJyZW50Tm9kZS5jaGlsZHJlbiAmJiBjdXJyZW50Tm9kZS5jaGlsZHJlbi5sZW5ndGggfHwgMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdmFyIGNoaWxkcmVuID0gY3VycmVudE5vZGUuY2hpbGRyZW47XG4gICAgICAgICAgICBpZiAoY2hpbGRyZW4gJiYgY2hpbGRyZW5baV0gJiYgdHlwZW9mIGNoaWxkcmVuW2ldICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIHZhciBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIHJlY3Vyc2UoY2hpbGQsIGZhbHNlLCBjdXJyZW50Tm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZihjdXJyZW50Tm9kZSwgaXNQYXJlbnQsIGlzUGFyZW50ID8gdm9pZCAwIDogcGFyZW50Vk5vZGUpO1xuICAgIH1cbiAgICByZWN1cnNlKHZOb2RlLCB0cnVlKTtcbn1cbmZ1bmN0aW9uIGFkZFBhcmVudCh2Tm9kZSwgaXNQYXJlbnQsIHBhcmVudCkge1xuICAgIGlmIChpc1BhcmVudCkge1xuICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgIH1cbiAgICBpZiAoIXZOb2RlLmRhdGEpIHtcbiAgICAgICAgdk5vZGUuZGF0YSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIXZOb2RlLmRhdGFbcGFyZW50X3N5bWJvbF8xLmRlZmF1bHRdKSB7XG4gICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh2Tm9kZS5kYXRhLCBwYXJlbnRfc3ltYm9sXzEuZGVmYXVsdCwge1xuICAgICAgICAgICAgdmFsdWU6IHBhcmVudCxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZmluZE1hdGNoZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgY3VycnkyXzEgPSByZXF1aXJlKCcuL2N1cnJ5MicpO1xudmFyIGZpbmRNYXRjaGVzXzEgPSByZXF1aXJlKCcuL2ZpbmRNYXRjaGVzJyk7XG5leHBvcnRzLnNlbGVjdCA9IGN1cnJ5Ml8xLmN1cnJ5MihmaW5kTWF0Y2hlc18xLmZpbmRNYXRjaGVzKTtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZSgnLi9zZWxlY3RvclBhcnNlcicpO1xuZXhwb3J0cy5zZWxlY3RvclBhcnNlciA9IHNlbGVjdG9yUGFyc2VyXzEuc2VsZWN0b3JQYXJzZXI7XG52YXIgY2xhc3NOYW1lRnJvbVZOb2RlXzEgPSByZXF1aXJlKCcuL2NsYXNzTmFtZUZyb21WTm9kZScpO1xuZXhwb3J0cy5jbGFzc05hbWVGcm9tVk5vZGUgPSBjbGFzc05hbWVGcm9tVk5vZGVfMS5jbGFzc05hbWVGcm9tVk5vZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciByb290O1xuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJvb3QgPSBzZWxmO1xufVxuZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByb290ID0gd2luZG93O1xufVxuZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByb290ID0gZ2xvYmFsO1xufVxuZWxzZSB7XG4gICAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG52YXIgU3ltYm9sID0gcm9vdC5TeW1ib2w7XG52YXIgcGFyZW50U3ltYm9sO1xuaWYgKHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicpIHtcbiAgICBwYXJlbnRTeW1ib2wgPSBTeW1ib2woJ3BhcmVudCcpO1xufVxuZWxzZSB7XG4gICAgcGFyZW50U3ltYm9sID0gJ0BAc25hYmJkb20tc2VsZWN0b3ItcGFyZW50Jztcbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGVmYXVsdCA9IHBhcmVudFN5bWJvbDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBhcmVudC1zeW1ib2wuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgdHJlZV9zZWxlY3Rvcl8xID0gcmVxdWlyZSgndHJlZS1zZWxlY3RvcicpO1xudmFyIHNlbGVjdG9yUGFyc2VyXzEgPSByZXF1aXJlKCcuL3NlbGVjdG9yUGFyc2VyJyk7XG52YXIgY2xhc3NOYW1lRnJvbVZOb2RlXzEgPSByZXF1aXJlKCcuL2NsYXNzTmFtZUZyb21WTm9kZScpO1xudmFyIHBhcmVudF9zeW1ib2xfMSA9IHJlcXVpcmUoJy4vcGFyZW50LXN5bWJvbCcpO1xudmFyIG9wdGlvbnMgPSB7XG4gICAgdGFnOiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIHNlbGVjdG9yUGFyc2VyXzEuc2VsZWN0b3JQYXJzZXIodk5vZGUpLnRhZ05hbWU7IH0sXG4gICAgY2xhc3NOYW1lOiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIGNsYXNzTmFtZUZyb21WTm9kZV8xLmNsYXNzTmFtZUZyb21WTm9kZSh2Tm9kZSk7IH0sXG4gICAgaWQ6IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gc2VsZWN0b3JQYXJzZXJfMS5zZWxlY3RvclBhcnNlcih2Tm9kZSkuaWQgfHwgJyc7IH0sXG4gICAgY2hpbGRyZW46IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gdk5vZGUuY2hpbGRyZW4gfHwgW107IH0sXG4gICAgcGFyZW50OiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIHZOb2RlLmRhdGFbcGFyZW50X3N5bWJvbF8xLmRlZmF1bHRdIHx8IHZOb2RlOyB9LFxuICAgIGNvbnRlbnRzOiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIHZOb2RlLnRleHQgfHwgJyc7IH0sXG4gICAgYXR0cjogZnVuY3Rpb24gKHZOb2RlLCBhdHRyKSB7XG4gICAgICAgIGlmICh2Tm9kZS5kYXRhKSB7XG4gICAgICAgICAgICB2YXIgX2EgPSB2Tm9kZS5kYXRhLCBfYiA9IF9hLmF0dHJzLCBhdHRycyA9IF9iID09PSB2b2lkIDAgPyB7fSA6IF9iLCBfYyA9IF9hLnByb3BzLCBwcm9wcyA9IF9jID09PSB2b2lkIDAgPyB7fSA6IF9jLCBfZCA9IF9hLmRhdGFzZXQsIGRhdGFzZXQgPSBfZCA9PT0gdm9pZCAwID8ge30gOiBfZDtcbiAgICAgICAgICAgIGlmIChhdHRyc1thdHRyXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhdHRyc1thdHRyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9wc1thdHRyXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBwcm9wc1thdHRyXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChhdHRyLmluZGV4T2YoJ2RhdGEtJykgPT09IDAgJiYgZGF0YXNldFthdHRyLnNsaWNlKDUpXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhc2V0W2F0dHIuc2xpY2UoNSldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbn07XG52YXIgbWF0Y2hlcyA9IHRyZWVfc2VsZWN0b3JfMS5jcmVhdGVNYXRjaGVzKG9wdGlvbnMpO1xuZnVuY3Rpb24gY3VzdG9tTWF0Y2hlcyhzZWwsIHZub2RlKSB7XG4gICAgdmFyIGRhdGEgPSB2bm9kZS5kYXRhO1xuICAgIHZhciBzZWxlY3RvciA9IG1hdGNoZXMuYmluZChudWxsLCBzZWwpO1xuICAgIGlmIChkYXRhICYmIGRhdGEuZm4pIHtcbiAgICAgICAgdmFyIG4gPSB2b2lkIDA7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGRhdGEuYXJncykpIHtcbiAgICAgICAgICAgIG4gPSBkYXRhLmZuLmFwcGx5KG51bGwsIGRhdGEuYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoZGF0YS5hcmdzKSB7XG4gICAgICAgICAgICBuID0gZGF0YS5mbi5jYWxsKG51bGwsIGRhdGEuYXJncyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuID0gZGF0YS5mbigpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZWxlY3RvcihuKSA/IG4gOiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHNlbGVjdG9yKHZub2RlKTtcbn1cbmV4cG9ydHMucXVlcnlTZWxlY3RvciA9IHRyZWVfc2VsZWN0b3JfMS5jcmVhdGVRdWVyeVNlbGVjdG9yKG9wdGlvbnMsIGN1c3RvbU1hdGNoZXMpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cXVlcnkuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBzZWxlY3RvclBhcnNlcihub2RlKSB7XG4gICAgaWYgKCFub2RlLnNlbCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdGFnTmFtZTogJycsXG4gICAgICAgICAgICBpZDogJycsXG4gICAgICAgICAgICBjbGFzc05hbWU6ICcnLFxuICAgICAgICB9O1xuICAgIH1cbiAgICB2YXIgc2VsID0gbm9kZS5zZWw7XG4gICAgdmFyIGhhc2hJZHggPSBzZWwuaW5kZXhPZignIycpO1xuICAgIHZhciBkb3RJZHggPSBzZWwuaW5kZXhPZignLicsIGhhc2hJZHgpO1xuICAgIHZhciBoYXNoID0gaGFzaElkeCA+IDAgPyBoYXNoSWR4IDogc2VsLmxlbmd0aDtcbiAgICB2YXIgZG90ID0gZG90SWR4ID4gMCA/IGRvdElkeCA6IHNlbC5sZW5ndGg7XG4gICAgdmFyIHRhZ05hbWUgPSBoYXNoSWR4ICE9PSAtMSB8fCBkb3RJZHggIT09IC0xID9cbiAgICAgICAgc2VsLnNsaWNlKDAsIE1hdGgubWluKGhhc2gsIGRvdCkpIDpcbiAgICAgICAgc2VsO1xuICAgIHZhciBpZCA9IGhhc2ggPCBkb3QgPyBzZWwuc2xpY2UoaGFzaCArIDEsIGRvdCkgOiB2b2lkIDA7XG4gICAgdmFyIGNsYXNzTmFtZSA9IGRvdElkeCA+IDAgPyBzZWwuc2xpY2UoZG90ICsgMSkucmVwbGFjZSgvXFwuL2csICcgJykgOiB2b2lkIDA7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICAgICAgaWQ6IGlkLFxuICAgICAgICBjbGFzc05hbWU6IGNsYXNzTmFtZSxcbiAgICB9O1xufVxuZXhwb3J0cy5zZWxlY3RvclBhcnNlciA9IHNlbGVjdG9yUGFyc2VyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2VsZWN0b3JQYXJzZXIuanMubWFwIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX3BvbnlmaWxsID0gcmVxdWlyZSgnLi9wb255ZmlsbC5qcycpO1xuXG52YXIgX3BvbnlmaWxsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3BvbnlmaWxsKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgcm9vdDsgLyogZ2xvYmFsIHdpbmRvdyAqL1xuXG5cbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHNlbGY7XG59IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBnbG9iYWw7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBtb2R1bGU7XG59IGVsc2Uge1xuICByb290ID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn1cblxudmFyIHJlc3VsdCA9ICgwLCBfcG9ueWZpbGwyWydkZWZhdWx0J10pKHJvb3QpO1xuZXhwb3J0c1snZGVmYXVsdCddID0gcmVzdWx0OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG5cdHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHN5bWJvbE9ic2VydmFibGVQb255ZmlsbDtcbmZ1bmN0aW9uIHN5bWJvbE9ic2VydmFibGVQb255ZmlsbChyb290KSB7XG5cdHZhciByZXN1bHQ7XG5cdHZhciBfU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cblx0aWYgKHR5cGVvZiBfU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0aWYgKF9TeW1ib2wub2JzZXJ2YWJsZSkge1xuXHRcdFx0cmVzdWx0ID0gX1N5bWJvbC5vYnNlcnZhYmxlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXN1bHQgPSBfU3ltYm9sKCdvYnNlcnZhYmxlJyk7XG5cdFx0XHRfU3ltYm9sLm9ic2VydmFibGUgPSByZXN1bHQ7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJlc3VsdCA9ICdAQG9ic2VydmFibGUnO1xuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwidmFyIG5leHRUaWNrID0gcmVxdWlyZSgncHJvY2Vzcy9icm93c2VyLmpzJykubmV4dFRpY2s7XG52YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaW1tZWRpYXRlSWRzID0ge307XG52YXIgbmV4dEltbWVkaWF0ZUlkID0gMDtcblxuLy8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcbn07XG5leHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xufTtcbmV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cbmV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHsgdGltZW91dC5jbG9zZSgpOyB9O1xuXG5mdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG4gIHRoaXMuX2lkID0gaWQ7XG4gIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xufVxuVGltZW91dC5wcm90b3R5cGUudW5yZWYgPSBUaW1lb3V0LnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHt9O1xuVGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xufTtcblxuLy8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5leHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcbn07XG5cbmV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcbn07XG5cbmV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcbiAgaWYgKG1zZWNzID49IDApIHtcbiAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG4gICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcbiAgICB9LCBtc2Vjcyk7XG4gIH1cbn07XG5cbi8vIFRoYXQncyBub3QgaG93IG5vZGUuanMgaW1wbGVtZW50cyBpdCBidXQgdGhlIGV4cG9zZWQgYXBpIGlzIHRoZSBzYW1lLlxuZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBmdW5jdGlvbihmbikge1xuICB2YXIgaWQgPSBuZXh0SW1tZWRpYXRlSWQrKztcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGZhbHNlIDogc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIGltbWVkaWF0ZUlkc1tpZF0gPSB0cnVlO1xuXG4gIG5leHRUaWNrKGZ1bmN0aW9uIG9uTmV4dFRpY2soKSB7XG4gICAgaWYgKGltbWVkaWF0ZUlkc1tpZF0pIHtcbiAgICAgIC8vIGZuLmNhbGwoKSBpcyBmYXN0ZXIgc28gd2Ugb3B0aW1pemUgZm9yIHRoZSBjb21tb24gdXNlLWNhc2VcbiAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vY2FsbC1hcHBseS1zZWd1XG4gICAgICBpZiAoYXJncykge1xuICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuLmNhbGwobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyBQcmV2ZW50IGlkcyBmcm9tIGxlYWtpbmdcbiAgICAgIGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUoaWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGlkO1xufTtcblxuZXhwb3J0cy5jbGVhckltbWVkaWF0ZSA9IHR5cGVvZiBjbGVhckltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gY2xlYXJJbW1lZGlhdGUgOiBmdW5jdGlvbihpZCkge1xuICBkZWxldGUgaW1tZWRpYXRlSWRzW2lkXTtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5mdW5jdGlvbiBfX2V4cG9ydChtKSB7XG4gICAgZm9yICh2YXIgcCBpbiBtKSBpZiAoIWV4cG9ydHMuaGFzT3duUHJvcGVydHkocCkpIGV4cG9ydHNbcF0gPSBtW3BdO1xufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuX19leHBvcnQocmVxdWlyZShcIi4vc2VsZWN0b3JQYXJzZXJcIikpO1xudmFyIG1hdGNoZXNfMSA9IHJlcXVpcmUoXCIuL21hdGNoZXNcIik7XG5leHBvcnRzLmNyZWF0ZU1hdGNoZXMgPSBtYXRjaGVzXzEuY3JlYXRlTWF0Y2hlcztcbnZhciBxdWVyeVNlbGVjdG9yXzEgPSByZXF1aXJlKFwiLi9xdWVyeVNlbGVjdG9yXCIpO1xuZXhwb3J0cy5jcmVhdGVRdWVyeVNlbGVjdG9yID0gcXVlcnlTZWxlY3Rvcl8xLmNyZWF0ZVF1ZXJ5U2VsZWN0b3I7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZShcIi4vc2VsZWN0b3JQYXJzZXJcIik7XG5mdW5jdGlvbiBjcmVhdGVNYXRjaGVzKG9wdHMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gbWF0Y2hlcyhzZWxlY3Rvciwgbm9kZSkge1xuICAgICAgICB2YXIgX2EgPSB0eXBlb2Ygc2VsZWN0b3IgPT09ICdvYmplY3QnID8gc2VsZWN0b3IgOiBzZWxlY3RvclBhcnNlcl8xLnBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpLCB0YWcgPSBfYS50YWcsIGlkID0gX2EuaWQsIGNsYXNzTGlzdCA9IF9hLmNsYXNzTGlzdCwgYXR0cmlidXRlcyA9IF9hLmF0dHJpYnV0ZXMsIG5leHRTZWxlY3RvciA9IF9hLm5leHRTZWxlY3RvciwgcHNldWRvcyA9IF9hLnBzZXVkb3M7XG4gICAgICAgIGlmIChuZXh0U2VsZWN0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYXRjaGVzIGNhbiBvbmx5IHByb2Nlc3Mgc2VsZWN0b3JzIHRoYXQgdGFyZ2V0IGEgc2luZ2xlIGVsZW1lbnQnKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGFnICYmIHRhZy50b0xvd2VyQ2FzZSgpICE9PSBvcHRzLnRhZyhub2RlKS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlkICYmIGlkICE9PSBvcHRzLmlkKG5vZGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNsYXNzZXMgPSBvcHRzLmNsYXNzTmFtZShub2RlKS5zcGxpdCgnICcpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGNsYXNzZXMuaW5kZXhPZihjbGFzc0xpc3RbaV0pID09PSAtMSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgICAgICAgICAgdmFyIGF0dHIgPSBvcHRzLmF0dHIobm9kZSwga2V5KTtcbiAgICAgICAgICAgIHZhciB0ID0gYXR0cmlidXRlc1trZXldWzBdO1xuICAgICAgICAgICAgdmFyIHYgPSBhdHRyaWJ1dGVzW2tleV1bMV07XG4gICAgICAgICAgICBpZiAoIWF0dHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodCA9PT0gJ2V4YWN0JyAmJiBhdHRyICE9PSB2KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodCAhPT0gJ2V4YWN0Jykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdiAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBbGwgbm9uLXN0cmluZyB2YWx1ZXMgaGF2ZSB0byBiZSBhbiBleGFjdCBtYXRjaCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ3N0YXJ0c1dpdGgnICYmICFhdHRyLnN0YXJ0c1dpdGgodikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ2VuZHNXaXRoJyAmJiAhYXR0ci5lbmRzV2l0aCh2KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnY29udGFpbnMnICYmIGF0dHIuaW5kZXhPZih2KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ3doaXRlc3BhY2UnICYmIGF0dHIuc3BsaXQoJyAnKS5pbmRleE9mKHYpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnZGFzaCcgJiYgYXR0ci5zcGxpdCgnLScpLmluZGV4T2YodikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwc2V1ZG9zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgX2IgPSBwc2V1ZG9zW2ldLCB0ID0gX2JbMF0sIGRhdGEgPSBfYlsxXTtcbiAgICAgICAgICAgIGlmICh0ID09PSAnY29udGFpbnMnICYmIGRhdGEgIT09IG9wdHMuY29udGVudHMobm9kZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodCA9PT0gJ2VtcHR5JyAmJlxuICAgICAgICAgICAgICAgIChvcHRzLmNvbnRlbnRzKG5vZGUpIHx8IG9wdHMuY2hpbGRyZW4obm9kZSkubGVuZ3RoICE9PSAwKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ID09PSAncm9vdCcgJiYgb3B0cy5wYXJlbnQobm9kZSkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0LmluZGV4T2YoJ2NoaWxkJykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFvcHRzLnBhcmVudChub2RlKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBzaWJsaW5ncyA9IG9wdHMuY2hpbGRyZW4ob3B0cy5wYXJlbnQobm9kZSkpO1xuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnZmlyc3QtY2hpbGQnICYmIHNpYmxpbmdzLmluZGV4T2Yobm9kZSkgIT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ2xhc3QtY2hpbGQnICYmXG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzLmluZGV4T2Yobm9kZSkgIT09IHNpYmxpbmdzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ250aC1jaGlsZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlZ2V4ID0gLyhbXFwrLV0/KShcXGQqKShuPykoXFwrXFxkKyk/LztcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnNlUmVzdWx0ID0gcmVnZXguZXhlYyhkYXRhKS5zbGljZSgxKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gc2libGluZ3MuaW5kZXhPZihub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFwYXJzZVJlc3VsdFswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VSZXN1bHRbMF0gPSAnKyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZhY3RvciA9IHBhcnNlUmVzdWx0WzFdXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHBhcnNlSW50KHBhcnNlUmVzdWx0WzBdICsgcGFyc2VSZXN1bHRbMV0pXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFkZCA9IHBhcnNlSW50KHBhcnNlUmVzdWx0WzNdIHx8ICcwJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmYWN0b3IgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUmVzdWx0WzJdID09PSAnbicgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICUgZmFjdG9yICE9PSBhZGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICghZmFjdG9yICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVJlc3VsdFsyXSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKChwYXJzZVJlc3VsdFswXSA9PT0gJysnICYmIGluZGV4IC0gYWRkIDwgMCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAocGFyc2VSZXN1bHRbMF0gPT09ICctJyAmJiBpbmRleCAtIGFkZCA+PSAwKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICghcGFyc2VSZXN1bHRbMl0gJiYgZmFjdG9yICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCAhPT0gZmFjdG9yIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZU1hdGNoZXMgPSBjcmVhdGVNYXRjaGVzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWF0Y2hlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZShcIi4vc2VsZWN0b3JQYXJzZXJcIik7XG52YXIgbWF0Y2hlc18xID0gcmVxdWlyZShcIi4vbWF0Y2hlc1wiKTtcbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5U2VsZWN0b3Iob3B0aW9ucywgbWF0Y2hlcykge1xuICAgIHZhciBfbWF0Y2hlcyA9IG1hdGNoZXMgfHwgbWF0Y2hlc18xLmNyZWF0ZU1hdGNoZXMob3B0aW9ucyk7XG4gICAgZnVuY3Rpb24gZmluZFN1YnRyZWUoc2VsZWN0b3IsIGRlcHRoLCBub2RlKSB7XG4gICAgICAgIHZhciBuID0gX21hdGNoZXMoc2VsZWN0b3IsIG5vZGUpO1xuICAgICAgICB2YXIgbWF0Y2hlZCA9IG4gPyAodHlwZW9mIG4gPT09ICdvYmplY3QnID8gW25dIDogW25vZGVdKSA6IFtdO1xuICAgICAgICBpZiAoZGVwdGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBtYXRjaGVkO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjaGlsZE1hdGNoZWQgPSBvcHRpb25zXG4gICAgICAgICAgICAuY2hpbGRyZW4obm9kZSlcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIHR5cGVvZiBjICE9PSAnc3RyaW5nJzsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGZpbmRTdWJ0cmVlKHNlbGVjdG9yLCBkZXB0aCAtIDEsIGMpOyB9KVxuICAgICAgICAgICAgLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBjdXJyKSB7IHJldHVybiBhY2MuY29uY2F0KGN1cnIpOyB9LCBbXSk7XG4gICAgICAgIHJldHVybiBtYXRjaGVkLmNvbmNhdChjaGlsZE1hdGNoZWQpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBmaW5kU2libGluZyhzZWxlY3RvciwgbmV4dCwgbm9kZSkge1xuICAgICAgICBpZiAob3B0aW9ucy5wYXJlbnQobm9kZSkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHRzID0gW107XG4gICAgICAgIHZhciBzaWJsaW5ncyA9IG9wdGlvbnMuY2hpbGRyZW4ob3B0aW9ucy5wYXJlbnQobm9kZSkpO1xuICAgICAgICBmb3IgKHZhciBpID0gc2libGluZ3MuaW5kZXhPZihub2RlKSArIDE7IGkgPCBzaWJsaW5ncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzaWJsaW5nc1tpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBuID0gX21hdGNoZXMoc2VsZWN0b3IsIHNpYmxpbmdzW2ldKTtcbiAgICAgICAgICAgIGlmIChuKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2gobik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzLnB1c2goc2libGluZ3NbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChuZXh0KSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiBxdWVyeVNlbGVjdG9yKHNlbGVjdG9yLCBub2RlKSB7XG4gICAgICAgIHZhciBzZWwgPSB0eXBlb2Ygc2VsZWN0b3IgPT09ICdvYmplY3QnID8gc2VsZWN0b3IgOiBzZWxlY3RvclBhcnNlcl8xLnBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpO1xuICAgICAgICB2YXIgcmVzdWx0cyA9IFtub2RlXTtcbiAgICAgICAgdmFyIGN1cnJlbnRTZWxlY3RvciA9IHNlbDtcbiAgICAgICAgdmFyIGN1cnJlbnRDb21iaW5hdG9yID0gJ3N1YnRyZWUnO1xuICAgICAgICB2YXIgdGFpbCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdmFyIF9sb29wXzEgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0YWlsID0gY3VycmVudFNlbGVjdG9yLm5leHRTZWxlY3RvcjtcbiAgICAgICAgICAgIGN1cnJlbnRTZWxlY3Rvci5uZXh0U2VsZWN0b3IgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBpZiAoY3VycmVudENvbWJpbmF0b3IgPT09ICdzdWJ0cmVlJyB8fFxuICAgICAgICAgICAgICAgIGN1cnJlbnRDb21iaW5hdG9yID09PSAnY2hpbGQnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRlcHRoXzEgPSBjdXJyZW50Q29tYmluYXRvciA9PT0gJ3N1YnRyZWUnID8gSW5maW5pdHkgOiAxO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG4pIHsgcmV0dXJuIGZpbmRTdWJ0cmVlKGN1cnJlbnRTZWxlY3RvciwgZGVwdGhfMSwgbik7IH0pXG4gICAgICAgICAgICAgICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgY3VycikgeyByZXR1cm4gYWNjLmNvbmNhdChjdXJyKTsgfSwgW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRfMSA9IGN1cnJlbnRDb21iaW5hdG9yID09PSAnbmV4dFNpYmxpbmcnO1xuICAgICAgICAgICAgICAgIHJlc3VsdHMgPSByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG4pIHsgcmV0dXJuIGZpbmRTaWJsaW5nKGN1cnJlbnRTZWxlY3RvciwgbmV4dF8xLCBuKTsgfSlcbiAgICAgICAgICAgICAgICAgICAgLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBjdXJyKSB7IHJldHVybiBhY2MuY29uY2F0KGN1cnIpOyB9LCBbXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGFpbCkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRTZWxlY3RvciA9IHRhaWxbMV07XG4gICAgICAgICAgICAgICAgY3VycmVudENvbWJpbmF0b3IgPSB0YWlsWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICBfbG9vcF8xKCk7XG4gICAgICAgIH0gd2hpbGUgKHRhaWwgIT09IHVuZGVmaW5lZCk7XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH07XG59XG5leHBvcnRzLmNyZWF0ZVF1ZXJ5U2VsZWN0b3IgPSBjcmVhdGVRdWVyeVNlbGVjdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cXVlcnlTZWxlY3Rvci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIElERU5UID0gJ1tcXFxcdy1dKyc7XG52YXIgU1BBQ0UgPSAnWyBcXHRdKic7XG52YXIgVkFMVUUgPSBcIlteXFxcXF1dK1wiO1xudmFyIENMQVNTID0gXCIoPzpcXFxcLlwiICsgSURFTlQgKyBcIilcIjtcbnZhciBJRCA9IFwiKD86I1wiICsgSURFTlQgKyBcIilcIjtcbnZhciBPUCA9IFwiKD86PXxcXFxcJD18XFxcXF49fFxcXFwqPXx+PXxcXFxcfD0pXCI7XG52YXIgQVRUUiA9IFwiKD86XFxcXFtcIiArIFNQQUNFICsgSURFTlQgKyBTUEFDRSArIFwiKD86XCIgKyBPUCArIFNQQUNFICsgVkFMVUUgKyBTUEFDRSArIFwiKT9cXFxcXSlcIjtcbnZhciBTVUJUUkVFID0gXCIoPzpbIFxcdF0rKVwiO1xudmFyIENISUxEID0gXCIoPzpcIiArIFNQQUNFICsgXCIoPilcIiArIFNQQUNFICsgXCIpXCI7XG52YXIgTkVYVF9TSUJMSU5HID0gXCIoPzpcIiArIFNQQUNFICsgXCIoXFxcXCspXCIgKyBTUEFDRSArIFwiKVwiO1xudmFyIFNJQkxJTkcgPSBcIig/OlwiICsgU1BBQ0UgKyBcIih+KVwiICsgU1BBQ0UgKyBcIilcIjtcbnZhciBDT01CSU5BVE9SID0gXCIoPzpcIiArIFNVQlRSRUUgKyBcInxcIiArIENISUxEICsgXCJ8XCIgKyBORVhUX1NJQkxJTkcgKyBcInxcIiArIFNJQkxJTkcgKyBcIilcIjtcbnZhciBDT05UQUlOUyA9IFwiY29udGFpbnNcXFxcKFxcXCJbXlxcXCJdKlxcXCJcXFxcKVwiO1xudmFyIEZPUk1VTEEgPSBcIig/OmV2ZW58b2RkfFxcXFxkKig/Oi0/big/OlxcXFwrXFxcXGQrKT8pPylcIjtcbnZhciBOVEhfQ0hJTEQgPSBcIm50aC1jaGlsZFxcXFwoXCIgKyBGT1JNVUxBICsgXCJcXFxcKVwiO1xudmFyIFBTRVVETyA9IFwiOig/OmZpcnN0LWNoaWxkfGxhc3QtY2hpbGR8XCIgKyBOVEhfQ0hJTEQgKyBcInxlbXB0eXxyb290fFwiICsgQ09OVEFJTlMgKyBcIilcIjtcbnZhciBUQUcgPSBcIig6P1wiICsgSURFTlQgKyBcIik/XCI7XG52YXIgVE9LRU5TID0gQ0xBU1MgKyBcInxcIiArIElEICsgXCJ8XCIgKyBBVFRSICsgXCJ8XCIgKyBQU0VVRE8gKyBcInxcIiArIENPTUJJTkFUT1I7XG52YXIgY29tYmluYXRvclJlZ2V4ID0gbmV3IFJlZ0V4cChcIl5cIiArIENPTUJJTkFUT1IgKyBcIiRcIik7XG4vKipcbiAqIFBhcnNlcyBhIGNzcyBzZWxlY3RvciBpbnRvIGEgbm9ybWFsaXplZCBvYmplY3QuXG4gKiBFeHBlY3RzIGEgc2VsZWN0b3IgZm9yIGEgc2luZ2xlIGVsZW1lbnQgb25seSwgbm8gYD5gIG9yIHRoZSBsaWtlIVxuICovXG5mdW5jdGlvbiBwYXJzZVNlbGVjdG9yKHNlbGVjdG9yKSB7XG4gICAgdmFyIHNlbCA9IHNlbGVjdG9yLnRyaW0oKTtcbiAgICB2YXIgdGFnUmVnZXggPSBuZXcgUmVnRXhwKFRBRywgJ3knKTtcbiAgICB2YXIgdGFnID0gdGFnUmVnZXguZXhlYyhzZWwpWzBdO1xuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoVE9LRU5TLCAneScpO1xuICAgIHJlZ2V4Lmxhc3RJbmRleCA9IHRhZ1JlZ2V4Lmxhc3RJbmRleDtcbiAgICB2YXIgbWF0Y2hlcyA9IFtdO1xuICAgIHZhciBuZXh0U2VsZWN0b3IgPSB1bmRlZmluZWQ7XG4gICAgdmFyIGxhc3RDb21iaW5hdG9yID0gdW5kZWZpbmVkO1xuICAgIHZhciBpbmRleCA9IC0xO1xuICAgIHdoaWxlIChyZWdleC5sYXN0SW5kZXggPCBzZWwubGVuZ3RoKSB7XG4gICAgICAgIHZhciBtYXRjaCA9IHJlZ2V4LmV4ZWMoc2VsKTtcbiAgICAgICAgaWYgKCFtYXRjaCAmJiBsYXN0Q29tYmluYXRvciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhcnNlIGVycm9yLCBpbnZhbGlkIHNlbGVjdG9yJyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobWF0Y2ggJiYgY29tYmluYXRvclJlZ2V4LnRlc3QobWF0Y2hbMF0pKSB7XG4gICAgICAgICAgICB2YXIgY29tYiA9IGNvbWJpbmF0b3JSZWdleC5leGVjKG1hdGNoWzBdKVswXTtcbiAgICAgICAgICAgIGxhc3RDb21iaW5hdG9yID0gY29tYjtcbiAgICAgICAgICAgIGluZGV4ID0gcmVnZXgubGFzdEluZGV4O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKGxhc3RDb21iaW5hdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBuZXh0U2VsZWN0b3IgPSBbXG4gICAgICAgICAgICAgICAgICAgIGdldENvbWJpbmF0b3IobGFzdENvbWJpbmF0b3IpLFxuICAgICAgICAgICAgICAgICAgICBwYXJzZVNlbGVjdG9yKHNlbC5zdWJzdHJpbmcoaW5kZXgpKVxuICAgICAgICAgICAgICAgIF07XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtYXRjaGVzLnB1c2gobWF0Y2hbMF0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBjbGFzc0xpc3QgPSBtYXRjaGVzXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3RhcnRzV2l0aCgnLicpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN1YnN0cmluZygxKTsgfSk7XG4gICAgdmFyIGlkcyA9IG1hdGNoZXMuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN0YXJ0c1dpdGgoJyMnKTsgfSkubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN1YnN0cmluZygxKTsgfSk7XG4gICAgaWYgKGlkcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBzZWxlY3Rvciwgb25seSBvbmUgaWQgaXMgYWxsb3dlZCcpO1xuICAgIH1cbiAgICB2YXIgcG9zdHByb2Nlc3NSZWdleCA9IG5ldyBSZWdFeHAoXCIoXCIgKyBJREVOVCArIFwiKVwiICsgU1BBQ0UgKyBcIihcIiArIE9QICsgXCIpP1wiICsgU1BBQ0UgKyBcIihcIiArIFZBTFVFICsgXCIpP1wiKTtcbiAgICB2YXIgYXR0cnMgPSBtYXRjaGVzXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3RhcnRzV2l0aCgnWycpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBwb3N0cHJvY2Vzc1JlZ2V4LmV4ZWMocykuc2xpY2UoMSwgNCk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBhdHRyID0gX2FbMF0sIG9wID0gX2FbMV0sIHZhbCA9IF9hWzJdO1xuICAgICAgICByZXR1cm4gKF9iID0ge30sXG4gICAgICAgICAgICBfYlthdHRyXSA9IFtnZXRPcChvcCksIHZhbCA/IHBhcnNlQXR0clZhbHVlKHZhbCkgOiB2YWxdLFxuICAgICAgICAgICAgX2IpO1xuICAgICAgICB2YXIgX2I7XG4gICAgfSlcbiAgICAgICAgLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBjdXJyKSB7IHJldHVybiAoX19hc3NpZ24oe30sIGFjYywgY3VycikpOyB9LCB7fSk7XG4gICAgdmFyIHBzZXVkb3MgPSBtYXRjaGVzXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3RhcnRzV2l0aCgnOicpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChzKSB7IHJldHVybiBwb3N0UHJvY2Vzc1BzZXVkb3Mocy5zdWJzdHJpbmcoMSkpOyB9KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBpZDogaWRzWzBdIHx8ICcnLFxuICAgICAgICB0YWc6IHRhZyxcbiAgICAgICAgY2xhc3NMaXN0OiBjbGFzc0xpc3QsXG4gICAgICAgIGF0dHJpYnV0ZXM6IGF0dHJzLFxuICAgICAgICBuZXh0U2VsZWN0b3I6IG5leHRTZWxlY3RvcixcbiAgICAgICAgcHNldWRvczogcHNldWRvc1xuICAgIH07XG59XG5leHBvcnRzLnBhcnNlU2VsZWN0b3IgPSBwYXJzZVNlbGVjdG9yO1xuZnVuY3Rpb24gcGFyc2VBdHRyVmFsdWUodikge1xuICAgIGlmICh2LnN0YXJ0c1dpdGgoJ1wiJykpIHtcbiAgICAgICAgcmV0dXJuIHYuc2xpY2UoMSwgLTEpO1xuICAgIH1cbiAgICBpZiAodiA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICh2ID09PSBcImZhbHNlXCIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgZiA9IHBhcnNlRmxvYXQodik7XG4gICAgaWYgKGlzTmFOKGYpKSB7XG4gICAgICAgIHJldHVybiB2O1xuICAgIH1cbiAgICByZXR1cm4gZjtcbn1cbmZ1bmN0aW9uIHBvc3RQcm9jZXNzUHNldWRvcyhzZWwpIHtcbiAgICBpZiAoc2VsID09PSAnZmlyc3QtY2hpbGQnIHx8XG4gICAgICAgIHNlbCA9PT0gJ2xhc3QtY2hpbGQnIHx8XG4gICAgICAgIHNlbCA9PT0gJ3Jvb3QnIHx8XG4gICAgICAgIHNlbCA9PT0gJ2VtcHR5Jykge1xuICAgICAgICByZXR1cm4gW3NlbCwgdW5kZWZpbmVkXTtcbiAgICB9XG4gICAgaWYgKHNlbC5zdGFydHNXaXRoKCdjb250YWlucycpKSB7XG4gICAgICAgIHZhciB0ZXh0ID0gc2VsLnNsaWNlKDEwLCAtMik7XG4gICAgICAgIHJldHVybiBbJ2NvbnRhaW5zJywgdGV4dF07XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gc2VsLnNsaWNlKDEwLCAtMSk7XG4gICAgaWYgKGNvbnRlbnQgPT09ICdldmVuJykge1xuICAgICAgICBjb250ZW50ID0gJzJuJztcbiAgICB9XG4gICAgaWYgKGNvbnRlbnQgPT09ICdvZGQnKSB7XG4gICAgICAgIGNvbnRlbnQgPSAnMm4rMSc7XG4gICAgfVxuICAgIHJldHVybiBbJ250aC1jaGlsZCcsIGNvbnRlbnRdO1xufVxuZnVuY3Rpb24gZ2V0T3Aob3ApIHtcbiAgICBzd2l0Y2ggKG9wKSB7XG4gICAgICAgIGNhc2UgJz0nOlxuICAgICAgICAgICAgcmV0dXJuICdleGFjdCc7XG4gICAgICAgIGNhc2UgJ149JzpcbiAgICAgICAgICAgIHJldHVybiAnc3RhcnRzV2l0aCc7XG4gICAgICAgIGNhc2UgJyQ9JzpcbiAgICAgICAgICAgIHJldHVybiAnZW5kc1dpdGgnO1xuICAgICAgICBjYXNlICcqPSc6XG4gICAgICAgICAgICByZXR1cm4gJ2NvbnRhaW5zJztcbiAgICAgICAgY2FzZSAnfj0nOlxuICAgICAgICAgICAgcmV0dXJuICd3aGl0ZXNwYWNlJztcbiAgICAgICAgY2FzZSAnfD0nOlxuICAgICAgICAgICAgcmV0dXJuICdkYXNoJztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAndHJ1dGh5JztcbiAgICB9XG59XG5mdW5jdGlvbiBnZXRDb21iaW5hdG9yKGNvbWIpIHtcbiAgICBzd2l0Y2ggKGNvbWIudHJpbSgpKSB7XG4gICAgICAgIGNhc2UgJz4nOlxuICAgICAgICAgICAgcmV0dXJuICdjaGlsZCc7XG4gICAgICAgIGNhc2UgJysnOlxuICAgICAgICAgICAgcmV0dXJuICduZXh0U2libGluZyc7XG4gICAgICAgIGNhc2UgJ34nOlxuICAgICAgICAgICAgcmV0dXJuICdzaWJsaW5nJztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHJldHVybiAnc3VidHJlZSc7XG4gICAgfVxufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c2VsZWN0b3JQYXJzZXIuanMubWFwIiwiaW1wb3J0IHtTdHJlYW0sIEludGVybmFsUHJvZHVjZXIsIEludGVybmFsTGlzdGVuZXIsIE91dFNlbmRlcn0gZnJvbSAnLi4vaW5kZXgnO1xuXG5jbGFzcyBDb25jYXRQcm9kdWNlcjxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4sIEludGVybmFsTGlzdGVuZXI8VD4sIE91dFNlbmRlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2NvbmNhdCc7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPiA9IG51bGwgYXMgYW55O1xuICBwcml2YXRlIGk6IG51bWJlciA9IDA7XG5cbiAgY29uc3RydWN0b3IocHVibGljIHN0cmVhbXM6IEFycmF5PFN0cmVhbTxUPj4pIHtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuc3RyZWFtc1t0aGlzLmldLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzdHJlYW1zID0gdGhpcy5zdHJlYW1zO1xuICAgIGlmICh0aGlzLmkgPCBzdHJlYW1zLmxlbmd0aCkge1xuICAgICAgc3RyZWFtc1t0aGlzLmldLl9yZW1vdmUodGhpcyk7XG4gICAgfVxuICAgIHRoaXMuaSA9IDA7XG4gICAgdGhpcy5vdXQgPSBudWxsIGFzIGFueTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICBjb25zdCBzdHJlYW1zID0gdGhpcy5zdHJlYW1zO1xuICAgIHN0cmVhbXNbdGhpcy5pXS5fcmVtb3ZlKHRoaXMpO1xuICAgIGlmICgrK3RoaXMuaSA8IHN0cmVhbXMubGVuZ3RoKSB7XG4gICAgICBzdHJlYW1zW3RoaXMuaV0uX2FkZCh0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdS5fYygpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFB1dHMgb25lIHN0cmVhbSBhZnRlciB0aGUgb3RoZXIuICpjb25jYXQqIGlzIGEgZmFjdG9yeSB0aGF0IHRha2VzIG11bHRpcGxlXG4gKiBzdHJlYW1zIGFzIGFyZ3VtZW50cywgYW5kIHN0YXJ0cyB0aGUgYG4rMWAtdGggc3RyZWFtIG9ubHkgd2hlbiB0aGUgYG5gLXRoXG4gKiBzdHJlYW0gaGFzIGNvbXBsZXRlZC4gSXQgY29uY2F0ZW5hdGVzIHRob3NlIHN0cmVhbXMgdG9nZXRoZXIuXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0yLS0tMy0tLTQtfFxuICogLi4uLi4uLi4uLi4uLi4uLS1hLWItYy0tZC18XG4gKiAgICAgICAgICAgY29uY2F0XG4gKiAtLTEtLTItLS0zLS0tNC0tLWEtYi1jLS1kLXxcbiAqIGBgYFxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBjb25jYXQgZnJvbSAneHN0cmVhbS9leHRyYS9jb25jYXQnXG4gKlxuICogY29uc3Qgc3RyZWFtQSA9IHhzLm9mKCdhJywgJ2InLCAnYycpXG4gKiBjb25zdCBzdHJlYW1CID0geHMub2YoMTAsIDIwLCAzMClcbiAqIGNvbnN0IHN0cmVhbUMgPSB4cy5vZignWCcsICdZJywgJ1onKVxuICpcbiAqIGNvbnN0IG91dHB1dFN0cmVhbSA9IGNvbmNhdChzdHJlYW1BLCBzdHJlYW1CLCBzdHJlYW1DKVxuICpcbiAqIG91dHB1dFN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6ICh4KSA9PiBjb25zb2xlLmxvZyh4KSxcbiAqICAgZXJyb3I6IChlcnIpID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb25jYXQgY29tcGxldGVkJyksXG4gKiB9KVxuICogYGBgXG4gKlxuICogQGZhY3RvcnkgdHJ1ZVxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gY29uY2F0ZW5hdGUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTIgQSBzdHJlYW0gdG8gY29uY2F0ZW5hdGUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLiBUd29cbiAqIG9yIG1vcmUgc3RyZWFtcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjb25jYXQ8VD4oLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPFQ+Pik6IFN0cmVhbTxUPiB7XG4gIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBDb25jYXRQcm9kdWNlcihzdHJlYW1zKSk7XG59XG4iLCJpbXBvcnQge09wZXJhdG9yLCBTdHJlYW19IGZyb20gJy4uL2luZGV4JztcblxuY2xhc3MgRGVsYXlPcGVyYXRvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZGVsYXknO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD4gPSBudWxsIGFzIGFueTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgZHQ6IG51bWJlcixcbiAgICAgICAgICAgICAgcHVibGljIGluczogU3RyZWFtPFQ+KSB7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IG51bGwgYXMgYW55O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICBjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIHUuX24odCk7XG4gICAgICBjbGVhckludGVydmFsKGlkKTtcbiAgICB9LCB0aGlzLmR0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IGlkID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgdS5fZShlcnIpO1xuICAgICAgY2xlYXJJbnRlcnZhbChpZCk7XG4gICAgfSwgdGhpcy5kdCk7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3QgaWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICB1Ll9jKCk7XG4gICAgICBjbGVhckludGVydmFsKGlkKTtcbiAgICB9LCB0aGlzLmR0KTtcbiAgfVxufVxuXG4vKipcbiAqIERlbGF5cyBwZXJpb2RpYyBldmVudHMgYnkgYSBnaXZlbiB0aW1lIHBlcmlvZC5cbiAqXG4gKiBNYXJibGUgZGlhZ3JhbTpcbiAqXG4gKiBgYGB0ZXh0XG4gKiAxLS0tLTItLTMtLTQtLS0tNXxcbiAqICAgICBkZWxheSg2MClcbiAqIC0tLTEtLS0tMi0tMy0tNC0tLS01fFxuICogYGBgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21EaWFncmFtIGZyb20gJ3hzdHJlYW0vZXh0cmEvZnJvbURpYWdyYW0nXG4gKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRGlhZ3JhbSgnMS0tLS0yLS0zLS00LS0tLTV8JylcbiAqICAuY29tcG9zZShkZWxheSg2MCkpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IDEgIChhZnRlciA2MCBtcylcbiAqID4gMiAgKGFmdGVyIDE2MCBtcylcbiAqID4gMyAgKGFmdGVyIDIyMCBtcylcbiAqID4gNCAgKGFmdGVyIDI4MCBtcylcbiAqID4gNSAgKGFmdGVyIDM4MCBtcylcbiAqID4gY29tcGxldGVkXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge251bWJlcn0gcGVyaW9kIFRoZSBhbW91bnQgb2Ygc2lsZW5jZSByZXF1aXJlZCBpbiBtaWxsaXNlY29uZHMuXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRlbGF5PFQ+KHBlcmlvZDogbnVtYmVyKTogKGluczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08VD4ge1xuICByZXR1cm4gZnVuY3Rpb24gZGVsYXlPcGVyYXRvcihpbnM6IFN0cmVhbTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERlbGF5T3BlcmF0b3IocGVyaW9kLCBpbnMpKTtcbiAgfTtcbn1cbiIsImltcG9ydCB7SW50ZXJuYWxMaXN0ZW5lciwgT3BlcmF0b3IsIFN0cmVhbX0gZnJvbSAnLi4vaW5kZXgnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNhbXBsZUNvbWJpbmVTaWduYXR1cmUge1xuICAoKTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtUXT47XG4gIDxUMT4oczE6IFN0cmVhbTxUMT4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxXT47XG4gIDxUMSwgVDI+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDJdPjtcbiAgPFQxLCBUMiwgVDM+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzXT47XG4gIDxUMSwgVDIsIFQzLCBUND4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDMsIFQ0XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDU+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzLCBUNCwgVDVdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDY+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDg+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDhdPjtcbiAgKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pik6IChzOiBTdHJlYW08YW55PikgPT4gU3RyZWFtPEFycmF5PGFueT4+O1xufVxuXG5jb25zdCBOTyA9IHt9O1xuXG5leHBvcnQgY2xhc3MgU2FtcGxlQ29tYmluZUxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaTogbnVtYmVyLCBwcml2YXRlIHA6IFNhbXBsZUNvbWJpbmVPcGVyYXRvcjxhbnk+KSB7XG4gICAgcC5pbHNbaV0gPSB0aGlzO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLnA7XG4gICAgaWYgKHAub3V0ID09PSBOTykgcmV0dXJuO1xuICAgIHAudXAodCwgdGhpcy5pKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KTogdm9pZCB7XG4gICAgdGhpcy5wLl9lKGVycik7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICB0aGlzLnAuZG93bih0aGlzLmksIHRoaXMpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTYW1wbGVDb21iaW5lT3BlcmF0b3I8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBBcnJheTxhbnk+PiB7XG4gIHB1YmxpYyB0eXBlID0gJ3NhbXBsZUNvbWJpbmUnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdGhlcnM6IEFycmF5PFN0cmVhbTxhbnk+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPEFycmF5PGFueT4+O1xuICBwdWJsaWMgaWxzOiBBcnJheTxTYW1wbGVDb21iaW5lTGlzdGVuZXI8YW55Pj47XG4gIHB1YmxpYyBObjogbnVtYmVyOyAvLyAqTip1bWJlciBvZiBzdHJlYW1zIHN0aWxsIHRvIHNlbmQgKm4qZXh0XG4gIHB1YmxpYyB2YWxzOiBBcnJheTxhbnk+O1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBzdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm90aGVycyA9IHN0cmVhbXM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8YW55Pj47XG4gICAgdGhpcy5pbHMgPSBbXTtcbiAgICB0aGlzLk5uID0gMDtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxBcnJheTxhbnk+Pik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIGNvbnN0IHMgPSB0aGlzLm90aGVycztcbiAgICBjb25zdCBuID0gdGhpcy5ObiA9IHMubGVuZ3RoO1xuICAgIGNvbnN0IHZhbHMgPSB0aGlzLnZhbHMgPSBuZXcgQXJyYXkobik7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIHZhbHNbaV0gPSBOTztcbiAgICAgIHNbaV0uX2FkZChuZXcgU2FtcGxlQ29tYmluZUxpc3RlbmVyPGFueT4oaSwgdGhpcykpO1xuICAgIH1cbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMub3RoZXJzO1xuICAgIGNvbnN0IG4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCBpbHMgPSB0aGlzLmlscztcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICBzW2ldLl9yZW1vdmUoaWxzW2ldKTtcbiAgICB9XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8YW55Pj47XG4gICAgdGhpcy52YWxzID0gW107XG4gICAgdGhpcy5pbHMgPSBbXTtcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICh0aGlzLk5uID4gMCkgcmV0dXJuO1xuICAgIG91dC5fbihbdCwgLi4udGhpcy52YWxzXSk7XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgb3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIG91dC5fYygpO1xuICB9XG5cbiAgdXAodDogYW55LCBpOiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCB2ID0gdGhpcy52YWxzW2ldO1xuICAgIGlmICh0aGlzLk5uID4gMCAmJiB2ID09PSBOTykge1xuICAgICAgdGhpcy5Obi0tO1xuICAgIH1cbiAgICB0aGlzLnZhbHNbaV0gPSB0O1xuICB9XG5cbiAgZG93bihpOiBudW1iZXIsIGw6IFNhbXBsZUNvbWJpbmVMaXN0ZW5lcjxhbnk+KTogdm9pZCB7XG4gICAgdGhpcy5vdGhlcnNbaV0uX3JlbW92ZShsKTtcbiAgfVxufVxuXG5sZXQgc2FtcGxlQ29tYmluZTogU2FtcGxlQ29tYmluZVNpZ25hdHVyZTtcblxuLyoqXG4gKlxuICogQ29tYmluZXMgYSBzb3VyY2Ugc3RyZWFtIHdpdGggbXVsdGlwbGUgb3RoZXIgc3RyZWFtcy4gVGhlIHJlc3VsdCBzdHJlYW1cbiAqIHdpbGwgZW1pdCB0aGUgbGF0ZXN0IGV2ZW50cyBmcm9tIGFsbCBpbnB1dCBzdHJlYW1zLCBidXQgb25seSB3aGVuIHRoZVxuICogc291cmNlIHN0cmVhbSBlbWl0cy5cbiAqXG4gKiBJZiB0aGUgc291cmNlLCBvciBhbnkgaW5wdXQgc3RyZWFtLCB0aHJvd3MgYW4gZXJyb3IsIHRoZSByZXN1bHQgc3RyZWFtXG4gKiB3aWxsIHByb3BhZ2F0ZSB0aGUgZXJyb3IuIElmIGFueSBpbnB1dCBzdHJlYW1zIGVuZCwgdGhlaXIgZmluYWwgZW1pdHRlZFxuICogdmFsdWUgd2lsbCByZW1haW4gaW4gdGhlIGFycmF5IG9mIGFueSBzdWJzZXF1ZW50IGV2ZW50cyBmcm9tIHRoZSByZXN1bHRcbiAqIHN0cmVhbS5cbiAqXG4gKiBUaGUgcmVzdWx0IHN0cmVhbSB3aWxsIG9ubHkgY29tcGxldGUgdXBvbiBjb21wbGV0aW9uIG9mIHRoZSBzb3VyY2Ugc3RyZWFtLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tIChzb3VyY2UpXG4gKiAtLS0tYS0tLS0tYi0tLS0tYy0tZC0tLS0tLSAob3RoZXIpXG4gKiAgICAgIHNhbXBsZUNvbWJpbmVcbiAqIC0tLS0tLS0yYS0tLS0zYi0tLS0tLS00ZC0tXG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IHNhbXBsZUNvbWJpbmUgZnJvbSAneHN0cmVhbS9leHRyYS9zYW1wbGVDb21iaW5lJ1xuICogaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nXG4gKlxuICogY29uc3Qgc2FtcGxlciA9IHhzLnBlcmlvZGljKDEwMDApLnRha2UoMylcbiAqIGNvbnN0IG90aGVyID0geHMucGVyaW9kaWMoMTAwKVxuICpcbiAqIGNvbnN0IHN0cmVhbSA9IHNhbXBsZXIuY29tcG9zZShzYW1wbGVDb21iaW5lKG90aGVyKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gWzAsIDhdXG4gKiA+IFsxLCAxOF1cbiAqID4gWzIsIDI4XVxuICogYGBgXG4gKlxuICogYGBganNcbiAqIGltcG9ydCBzYW1wbGVDb21iaW5lIGZyb20gJ3hzdHJlYW0vZXh0cmEvc2FtcGxlQ29tYmluZSdcbiAqIGltcG9ydCB4cyBmcm9tICd4c3RyZWFtJ1xuICpcbiAqIGNvbnN0IHNhbXBsZXIgPSB4cy5wZXJpb2RpYygxMDAwKS50YWtlKDMpXG4gKiBjb25zdCBvdGhlciA9IHhzLnBlcmlvZGljKDEwMCkudGFrZSgyKVxuICpcbiAqIGNvbnN0IHN0cmVhbSA9IHNhbXBsZXIuY29tcG9zZShzYW1wbGVDb21iaW5lKG90aGVyKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gWzAsIDFdXG4gKiA+IFsxLCAxXVxuICogPiBbMiwgMV1cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7Li4uU3RyZWFtfSBzdHJlYW1zIE9uZSBvciBtb3JlIHN0cmVhbXMgdG8gY29tYmluZSB3aXRoIHRoZSBzYW1wbGVyXG4gKiBzdHJlYW0uXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbnNhbXBsZUNvbWJpbmUgPSBmdW5jdGlvbiBzYW1wbGVDb21iaW5lKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICByZXR1cm4gZnVuY3Rpb24gc2FtcGxlQ29tYmluZU9wZXJhdG9yKHNhbXBsZXI6IFN0cmVhbTxhbnk+KTogU3RyZWFtPEFycmF5PGFueT4+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxBcnJheTxhbnk+PihuZXcgU2FtcGxlQ29tYmluZU9wZXJhdG9yKHNhbXBsZXIsIHN0cmVhbXMpKTtcbiAgfTtcbn0gYXMgU2FtcGxlQ29tYmluZVNpZ25hdHVyZTtcblxuZXhwb3J0IGRlZmF1bHQgc2FtcGxlQ29tYmluZTsiLCJpbXBvcnQgJCRvYnNlcnZhYmxlIGZyb20gJ3N5bWJvbC1vYnNlcnZhYmxlJztcblxuY29uc3QgTk8gPSB7fTtcbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5mdW5jdGlvbiBjcDxUPihhOiBBcnJheTxUPik6IEFycmF5PFQ+IHtcbiAgY29uc3QgbCA9IGEubGVuZ3RoO1xuICBjb25zdCBiID0gQXJyYXkobCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbDsgKytpKSBiW2ldID0gYVtpXTtcbiAgcmV0dXJuIGI7XG59XG5cbmZ1bmN0aW9uIGFuZDxUPihmMTogKHQ6IFQpID0+IGJvb2xlYW4sIGYyOiAodDogVCkgPT4gYm9vbGVhbik6ICh0OiBUKSA9PiBib29sZWFuIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGFuZEZuKHQ6IFQpOiBib29sZWFuIHtcbiAgICByZXR1cm4gZjEodCkgJiYgZjIodCk7XG4gIH07XG59XG5cbmludGVyZmFjZSBGQ29udGFpbmVyPFQsIFI+IHtcbiAgZih0OiBUKTogUjtcbn1cblxuZnVuY3Rpb24gX3RyeTxULCBSPihjOiBGQ29udGFpbmVyPFQsIFI+LCB0OiBULCB1OiBTdHJlYW08YW55Pik6IFIgfCB7fSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGMuZih0KTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHUuX2UoZSk7XG4gICAgcmV0dXJuIE5PO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIF9uOiAodjogVCkgPT4gdm9pZDtcbiAgX2U6IChlcnI6IGFueSkgPT4gdm9pZDtcbiAgX2M6ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IE5PX0lMOiBJbnRlcm5hbExpc3RlbmVyPGFueT4gPSB7XG4gIF9uOiBub29wLFxuICBfZTogbm9vcCxcbiAgX2M6IG5vb3AsXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBfc3RhcnQobGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkO1xuICBfc3RvcDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPdXRTZW5kZXI8VD4ge1xuICBvdXQ6IFN0cmVhbTxUPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPcGVyYXRvcjxULCBSPiBleHRlbmRzIEludGVybmFsUHJvZHVjZXI8Uj4sIEludGVybmFsTGlzdGVuZXI8VD4sIE91dFNlbmRlcjxSPiB7XG4gIHR5cGU6IHN0cmluZztcbiAgaW5zOiBTdHJlYW08VD47XG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWdncmVnYXRvcjxULCBVPiBleHRlbmRzIEludGVybmFsUHJvZHVjZXI8VT4sIE91dFNlbmRlcjxVPiB7XG4gIHR5cGU6IHN0cmluZztcbiAgaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+O1xuICBfc3RhcnQob3V0OiBTdHJlYW08VT4pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByb2R1Y2VyPFQ+IHtcbiAgc3RhcnQ6IChsaXN0ZW5lcjogTGlzdGVuZXI8VD4pID0+IHZvaWQ7XG4gIHN0b3A6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTGlzdGVuZXI8VD4ge1xuICBuZXh0OiAoeDogVCkgPT4gdm9pZDtcbiAgZXJyb3I6IChlcnI6IGFueSkgPT4gdm9pZDtcbiAgY29tcGxldGU6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3Vic2NyaXB0aW9uIHtcbiAgdW5zdWJzY3JpYmUoKTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPYnNlcnZhYmxlPFQ+IHtcbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBMaXN0ZW5lcjxUPik6IFN1YnNjcmlwdGlvbjtcbn1cblxuLy8gbXV0YXRlcyB0aGUgaW5wdXRcbmZ1bmN0aW9uIGludGVybmFsaXplUHJvZHVjZXI8VD4ocHJvZHVjZXI6IFByb2R1Y2VyPFQ+ICYgUGFydGlhbDxJbnRlcm5hbFByb2R1Y2VyPFQ+Pikge1xuICBwcm9kdWNlci5fc3RhcnQgPSBmdW5jdGlvbiBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4gJiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pikge1xuICAgIGlsLm5leHQgPSBpbC5fbjtcbiAgICBpbC5lcnJvciA9IGlsLl9lO1xuICAgIGlsLmNvbXBsZXRlID0gaWwuX2M7XG4gICAgdGhpcy5zdGFydChpbCk7XG4gIH07XG4gIHByb2R1Y2VyLl9zdG9wID0gcHJvZHVjZXIuc3RvcDtcbn1cblxuY2xhc3MgU3RyZWFtU3ViPFQ+IGltcGxlbWVudHMgU3Vic2NyaXB0aW9uIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfc3RyZWFtOiBTdHJlYW08VD4sIHByaXZhdGUgX2xpc3RlbmVyOiBJbnRlcm5hbExpc3RlbmVyPFQ+KSB7fVxuXG4gIHVuc3Vic2NyaWJlKCk6IHZvaWQge1xuICAgIHRoaXMuX3N0cmVhbS5fcmVtb3ZlKHRoaXMuX2xpc3RlbmVyKTtcbiAgfVxufVxuXG5jbGFzcyBPYnNlcnZlcjxUPiBpbXBsZW1lbnRzIExpc3RlbmVyPFQ+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pIHt9XG5cbiAgbmV4dCh2YWx1ZTogVCkge1xuICAgIHRoaXMuX2xpc3RlbmVyLl9uKHZhbHVlKTtcbiAgfVxuXG4gIGVycm9yKGVycjogYW55KSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX2UoZXJyKTtcbiAgfVxuXG4gIGNvbXBsZXRlKCkge1xuICAgIHRoaXMuX2xpc3RlbmVyLl9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRnJvbU9ic2VydmFibGU8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbU9ic2VydmFibGUnO1xuICBwdWJsaWMgaW5zOiBPYnNlcnZhYmxlPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgYWN0aXZlOiBib29sZWFuO1xuICBwcml2YXRlIF9zdWI6IFN1YnNjcmlwdGlvbiB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBvYnNlcnZhYmxlO1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5fc3ViID0gdGhpcy5pbnMuc3Vic2NyaWJlKG5ldyBPYnNlcnZlcihvdXQpKTtcbiAgICBpZiAoIXRoaXMuYWN0aXZlKSB0aGlzLl9zdWIudW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIF9zdG9wKCkge1xuICAgIGlmICh0aGlzLl9zdWIpIHRoaXMuX3N1Yi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZXJnZVNpZ25hdHVyZSB7XG4gICgpOiBTdHJlYW08YW55PjtcbiAgPFQxPihzMTogU3RyZWFtPFQxPik6IFN0cmVhbTxUMT47XG4gIDxUMSwgVDI+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+KTogU3RyZWFtPFQxIHwgVDI+O1xuICA8VDEsIFQyLCBUMz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4pOiBTdHJlYW08VDEgfCBUMiB8IFQzPjtcbiAgPFQxLCBUMiwgVDMsIFQ0PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUND47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDU+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDU+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNz47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDg+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDg+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOCB8IFQ5PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4sXG4gICAgczEwOiBTdHJlYW08VDEwPik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4IHwgVDkgfCBUMTA+O1xuICA8VD4oLi4uc3RyZWFtOiBBcnJheTxTdHJlYW08VD4+KTogU3RyZWFtPFQ+O1xufVxuXG5jbGFzcyBNZXJnZTxUPiBpbXBsZW1lbnRzIEFnZ3JlZ2F0b3I8VCwgVD4sIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdtZXJnZSc7XG4gIHB1YmxpYyBpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBhYzogbnVtYmVyOyAvLyBhYyBpcyBhY3RpdmVDb3VudFxuXG4gIGNvbnN0cnVjdG9yKGluc0FycjogQXJyYXk8U3RyZWFtPFQ+Pikge1xuICAgIHRoaXMuaW5zQXJyID0gaW5zQXJyO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuYWMgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IEwgPSBzLmxlbmd0aDtcbiAgICB0aGlzLmFjID0gTDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgc1tpXS5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IEwgPSBzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgc1tpXS5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgaWYgKC0tdGhpcy5hYyA8PSAwKSB7XG4gICAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21iaW5lU2lnbmF0dXJlIHtcbiAgKCk6IFN0cmVhbTxBcnJheTxhbnk+PjtcbiAgPFQxPihzMTogU3RyZWFtPFQxPik6IFN0cmVhbTxbVDFdPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiBTdHJlYW08W1QxLCBUMl0+O1xuICA8VDEsIFQyLCBUMz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4pOiBTdHJlYW08W1QxLCBUMiwgVDNdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDRdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDZdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDddPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDldPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4sXG4gICAgczEwOiBTdHJlYW08VDEwPik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwXT47XG4gICguLi5zdHJlYW06IEFycmF5PFN0cmVhbTxhbnk+Pik6IFN0cmVhbTxBcnJheTxhbnk+Pjtcbn1cblxuY2xhc3MgQ29tYmluZUxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPEFycmF5PFQ+PiB7XG4gIHByaXZhdGUgaTogbnVtYmVyO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08QXJyYXk8VD4+O1xuICBwcml2YXRlIHA6IENvbWJpbmU8VD47XG5cbiAgY29uc3RydWN0b3IoaTogbnVtYmVyLCBvdXQ6IFN0cmVhbTxBcnJheTxUPj4sIHA6IENvbWJpbmU8VD4pIHtcbiAgICB0aGlzLmkgPSBpO1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMucCA9IHA7XG4gICAgcC5pbHMucHVzaCh0aGlzKTtcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wLCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIGlmIChwLnVwKHQsIHRoaXMuaSkpIHtcbiAgICAgIGNvbnN0IGEgPSBwLnZhbHM7XG4gICAgICBjb25zdCBsID0gYS5sZW5ndGg7XG4gICAgICBjb25zdCBiID0gQXJyYXkobCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGw7ICsraSkgYltpXSA9IGFbaV07XG4gICAgICBvdXQuX24oYik7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIG91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMucDtcbiAgICBpZiAocC5vdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKC0tcC5OYyA9PT0gMCkgcC5vdXQuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBDb21iaW5lPFI+IGltcGxlbWVudHMgQWdncmVnYXRvcjxhbnksIEFycmF5PFI+PiB7XG4gIHB1YmxpYyB0eXBlID0gJ2NvbWJpbmUnO1xuICBwdWJsaWMgaW5zQXJyOiBBcnJheTxTdHJlYW08YW55Pj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxSPj47XG4gIHB1YmxpYyBpbHM6IEFycmF5PENvbWJpbmVMaXN0ZW5lcjxhbnk+PjtcbiAgcHVibGljIE5jOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqYypvbXBsZXRlXG4gIHB1YmxpYyBObjogbnVtYmVyOyAvLyAqTip1bWJlciBvZiBzdHJlYW1zIHN0aWxsIHRvIHNlbmQgKm4qZXh0XG4gIHB1YmxpYyB2YWxzOiBBcnJheTxSPjtcblxuICBjb25zdHJ1Y3RvcihpbnNBcnI6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHRoaXMuaW5zQXJyID0gaW5zQXJyO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PFI+PjtcbiAgICB0aGlzLmlscyA9IFtdO1xuICAgIHRoaXMuTmMgPSB0aGlzLk5uID0gMDtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgfVxuXG4gIHVwKHQ6IGFueSwgaTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdiA9IHRoaXMudmFsc1tpXTtcbiAgICBjb25zdCBObiA9ICF0aGlzLk5uID8gMCA6IHYgPT09IE5PID8gLS10aGlzLk5uIDogdGhpcy5ObjtcbiAgICB0aGlzLnZhbHNbaV0gPSB0O1xuICAgIHJldHVybiBObiA9PT0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxBcnJheTxSPj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgbiA9IHRoaXMuTmMgPSB0aGlzLk5uID0gcy5sZW5ndGg7XG4gICAgY29uc3QgdmFscyA9IHRoaXMudmFscyA9IG5ldyBBcnJheShuKTtcbiAgICBpZiAobiA9PT0gMCkge1xuICAgICAgb3V0Ll9uKFtdKTtcbiAgICAgIG91dC5fYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICB2YWxzW2ldID0gTk87XG4gICAgICAgIHNbaV0uX2FkZChuZXcgQ29tYmluZUxpc3RlbmVyKGksIG91dCwgdGhpcykpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBuID0gcy5sZW5ndGg7XG4gICAgY29uc3QgaWxzID0gdGhpcy5pbHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHNbaV0uX3JlbW92ZShpbHNbaV0pO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PFI+PjtcbiAgICB0aGlzLmlscyA9IFtdO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG59XG5cbmNsYXNzIEZyb21BcnJheTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tQXJyYXknO1xuICBwdWJsaWMgYTogQXJyYXk8VD47XG5cbiAgY29uc3RydWN0b3IoYTogQXJyYXk8VD4pIHtcbiAgICB0aGlzLmEgPSBhO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLmE7XG4gICAgZm9yIChsZXQgaSA9IDAsIG4gPSBhLmxlbmd0aDsgaSA8IG47IGkrKykgb3V0Ll9uKGFbaV0pO1xuICAgIG91dC5fYygpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gIH1cbn1cblxuY2xhc3MgRnJvbVByb21pc2U8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbVByb21pc2UnO1xuICBwdWJsaWMgb246IGJvb2xlYW47XG4gIHB1YmxpYyBwOiBQcm9taXNlTGlrZTxUPjtcblxuICBjb25zdHJ1Y3RvcihwOiBQcm9taXNlTGlrZTxUPikge1xuICAgIHRoaXMub24gPSBmYWxzZTtcbiAgICB0aGlzLnAgPSBwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHByb2QgPSB0aGlzO1xuICAgIHRoaXMub24gPSB0cnVlO1xuICAgIHRoaXMucC50aGVuKFxuICAgICAgKHY6IFQpID0+IHtcbiAgICAgICAgaWYgKHByb2Qub24pIHtcbiAgICAgICAgICBvdXQuX24odik7XG4gICAgICAgICAgb3V0Ll9jKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAoZTogYW55KSA9PiB7XG4gICAgICAgIG91dC5fZShlKTtcbiAgICAgIH0sXG4gICAgKS50aGVuKG5vb3AsIChlcnI6IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7IHRocm93IGVycjsgfSk7XG4gICAgfSk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLm9uID0gZmFsc2U7XG4gIH1cbn1cblxuY2xhc3MgUGVyaW9kaWMgaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPG51bWJlcj4ge1xuICBwdWJsaWMgdHlwZSA9ICdwZXJpb2RpYyc7XG4gIHB1YmxpYyBwZXJpb2Q6IG51bWJlcjtcbiAgcHJpdmF0ZSBpbnRlcnZhbElEOiBhbnk7XG4gIHByaXZhdGUgaTogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKHBlcmlvZDogbnVtYmVyKSB7XG4gICAgdGhpcy5wZXJpb2QgPSBwZXJpb2Q7XG4gICAgdGhpcy5pbnRlcnZhbElEID0gLTE7XG4gICAgdGhpcy5pID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8bnVtYmVyPik6IHZvaWQge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIGludGVydmFsSGFuZGxlcigpIHsgb3V0Ll9uKHNlbGYuaSsrKTsgfVxuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IHNldEludGVydmFsKGludGVydmFsSGFuZGxlciwgdGhpcy5wZXJpb2QpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaW50ZXJ2YWxJRCAhPT0gLTEpIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbElEKTtcbiAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICB0aGlzLmkgPSAwO1xuICB9XG59XG5cbmNsYXNzIERlYnVnPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkZWJ1Zyc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIHM6ICh0OiBUKSA9PiBhbnk7IC8vIHNweVxuICBwcml2YXRlIGw6IHN0cmluZzsgLy8gbGFiZWxcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPik7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogKHQ6IFQpID0+IGFueSk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5zID0gbm9vcDtcbiAgICB0aGlzLmwgPSAnJztcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHRoaXMubCA9IGFyZzsgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJykgdGhpcy5zID0gYXJnO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHMgPSB0aGlzLnMsIGwgPSB0aGlzLmw7XG4gICAgaWYgKHMgIT09IG5vb3ApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHModCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHUuX2UoZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChsKSBjb25zb2xlLmxvZyhsICsgJzonLCB0KTsgZWxzZSBjb25zb2xlLmxvZyh0KTtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBEcm9wPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkcm9wJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBtYXg6IG51bWJlcjtcbiAgcHJpdmF0ZSBkcm9wcGVkOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IobWF4OiBudW1iZXIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5tYXggPSBtYXg7XG4gICAgdGhpcy5kcm9wcGVkID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuZHJvcHBlZCA9IDA7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmRyb3BwZWQrKyA+PSB0aGlzLm1heCkgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRW5kV2hlbkxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxhbnk+IHtcbiAgcHJpdmF0ZSBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcDogRW5kV2hlbjxUPjtcblxuICBjb25zdHJ1Y3RvcihvdXQ6IFN0cmVhbTxUPiwgb3A6IEVuZFdoZW48VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wID0gb3A7XG4gIH1cblxuICBfbigpIHtcbiAgICB0aGlzLm9wLmVuZCgpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICB0aGlzLm91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcC5lbmQoKTtcbiAgfVxufVxuXG5jbGFzcyBFbmRXaGVuPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdlbmRXaGVuJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBvOiBTdHJlYW08YW55PjsgLy8gbyA9IG90aGVyXG4gIHByaXZhdGUgb2lsOiBJbnRlcm5hbExpc3RlbmVyPGFueT47IC8vIG9pbCA9IG90aGVyIEludGVybmFsTGlzdGVuZXJcblxuICBjb25zdHJ1Y3RvcihvOiBTdHJlYW08YW55PiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm8gPSBvO1xuICAgIHRoaXMub2lsID0gTk9fSUw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm8uX2FkZCh0aGlzLm9pbCA9IG5ldyBFbmRXaGVuTGlzdGVuZXIob3V0LCB0aGlzKSk7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vLl9yZW1vdmUodGhpcy5vaWwpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub2lsID0gTk9fSUw7XG4gIH1cblxuICBlbmQoKTogdm9pZCB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMuZW5kKCk7XG4gIH1cbn1cblxuY2xhc3MgRmlsdGVyPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmaWx0ZXInO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKHBhc3NlczogKHQ6IFQpID0+IGJvb2xlYW4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5mID0gcGFzc2VzO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTyB8fCAhcikgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIEZsYXR0ZW5MaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwcml2YXRlIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wOiBGbGF0dGVuPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKG91dDogU3RyZWFtPFQ+LCBvcDogRmxhdHRlbjxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3AgPSBvcDtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICB0aGlzLm91dC5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgdGhpcy5vdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3AuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcC5sZXNzKCk7XG4gIH1cbn1cblxuY2xhc3MgRmxhdHRlbjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFN0cmVhbTxUPiwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmbGF0dGVuJztcbiAgcHVibGljIGluczogU3RyZWFtPFN0cmVhbTxUPj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcGVuOiBib29sZWFuO1xuICBwdWJsaWMgaW5uZXI6IFN0cmVhbTxUPjsgLy8gQ3VycmVudCBpbm5lciBTdHJlYW1cbiAgcHJpdmF0ZSBpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPjsgLy8gQ3VycmVudCBpbm5lciBJbnRlcm5hbExpc3RlbmVyXG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08U3RyZWFtPFQ+Pikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5pbCA9IE5PX0lMO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIGlmICh0aGlzLmlubmVyICE9PSBOTykgdGhpcy5pbm5lci5fcmVtb3ZlKHRoaXMuaWwpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gIH1cblxuICBsZXNzKCk6IHZvaWQge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAoIXRoaXMub3BlbiAmJiB0aGlzLmlubmVyID09PSBOTykgdS5fYygpO1xuICB9XG5cbiAgX24oczogU3RyZWFtPFQ+KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHtpbm5lciwgaWx9ID0gdGhpcztcbiAgICBpZiAoaW5uZXIgIT09IE5PICYmIGlsICE9PSBOT19JTCkgaW5uZXIuX3JlbW92ZShpbCk7XG4gICAgKHRoaXMuaW5uZXIgPSBzKS5fYWRkKHRoaXMuaWwgPSBuZXcgRmxhdHRlbkxpc3RlbmVyKHUsIHRoaXMpKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3BlbiA9IGZhbHNlO1xuICAgIHRoaXMubGVzcygpO1xuICB9XG59XG5cbmNsYXNzIEZvbGQ8VCwgUj4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBSPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZvbGQnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxSPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBSO1xuICBwdWJsaWMgc2VlZDogUjtcbiAgcHJpdmF0ZSBhY2M6IFI7IC8vIGluaXRpYWxpemVkIGFzIHNlZWRcblxuICBjb25zdHJ1Y3RvcihmOiAoYWNjOiBSLCB0OiBUKSA9PiBSLCBzZWVkOiBSLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuZiA9ICh0OiBUKSA9PiBmKHRoaXMuYWNjLCB0KTtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZCA9IHNlZWQ7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZDtcbiAgICBvdXQuX24odGhpcy5hY2MpO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHRoaXMuYWNjID0gciBhcyBSKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgTGFzdDxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnbGFzdCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGhhczogYm9vbGVhbjtcbiAgcHJpdmF0ZSB2YWw6IFQ7XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmhhcyA9IGZhbHNlO1xuICAgIHRoaXMudmFsID0gTk8gYXMgVDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy52YWwgPSBOTyBhcyBUO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIHRoaXMuaGFzID0gdHJ1ZTtcbiAgICB0aGlzLnZhbCA9IHQ7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaGFzKSB7XG4gICAgICB1Ll9uKHRoaXMudmFsKTtcbiAgICAgIHUuX2MoKTtcbiAgICB9IGVsc2UgdS5fZShuZXcgRXJyb3IoJ2xhc3QoKSBmYWlsZWQgYmVjYXVzZSBpbnB1dCBzdHJlYW0gY29tcGxldGVkJykpO1xuICB9XG59XG5cbmNsYXNzIE1hcE9wPFQsIFI+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgUj4ge1xuICBwdWJsaWMgdHlwZSA9ICdtYXAnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxSPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBSO1xuXG4gIGNvbnN0cnVjdG9yKHByb2plY3Q6ICh0OiBUKSA9PiBSLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuZiA9IHByb2plY3Q7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbihyIGFzIFIpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBSZW1lbWJlcjxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdyZW1lbWJlcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKG91dCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMub3V0KTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxufVxuXG5jbGFzcyBSZXBsYWNlRXJyb3I8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3JlcGxhY2VFcnJvcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgZjogKGVycjogYW55KSA9PiBTdHJlYW08VD47XG5cbiAgY29uc3RydWN0b3IocmVwbGFjZXI6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+LCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuZiA9IHJlcGxhY2VyO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICh0aGlzLmlucyA9IHRoaXMuZihlcnIpKS5fYWRkKHRoaXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHUuX2UoZSk7XG4gICAgfVxuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBTdGFydFdpdGg8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnc3RhcnRXaXRoJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyB2YWw6IFQ7XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIHZhbDogVCkge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMudmFsID0gdmFsO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vdXQuX24odGhpcy52YWwpO1xuICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG59XG5cbmNsYXNzIFRha2U8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3Rha2UnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG1heDogbnVtYmVyO1xuICBwcml2YXRlIHRha2VuOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IobWF4OiBudW1iZXIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5tYXggPSBtYXg7XG4gICAgdGhpcy50YWtlbiA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLnRha2VuID0gMDtcbiAgICBpZiAodGhpcy5tYXggPD0gMCkgb3V0Ll9jKCk7IGVsc2UgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IG0gPSArK3RoaXMudGFrZW47XG4gICAgaWYgKG0gPCB0aGlzLm1heCkgdS5fbih0KTsgZWxzZSBpZiAobSA9PT0gdGhpcy5tYXgpIHtcbiAgICAgIHUuX24odCk7XG4gICAgICB1Ll9jKCk7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3RyZWFtPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHB1YmxpYyBfcHJvZDogSW50ZXJuYWxQcm9kdWNlcjxUPjtcbiAgcHJvdGVjdGVkIF9pbHM6IEFycmF5PEludGVybmFsTGlzdGVuZXI8VD4+OyAvLyAnaWxzJyA9IEludGVybmFsIGxpc3RlbmVyc1xuICBwcm90ZWN0ZWQgX3N0b3BJRDogYW55O1xuICBwcm90ZWN0ZWQgX2RsOiBJbnRlcm5hbExpc3RlbmVyPFQ+OyAvLyB0aGUgZGVidWcgbGlzdGVuZXJcbiAgcHJvdGVjdGVkIF9kOiBib29sZWFuOyAvLyBmbGFnIGluZGljYXRpbmcgdGhlIGV4aXN0ZW5jZSBvZiB0aGUgZGVidWcgbGlzdGVuZXJcbiAgcHJvdGVjdGVkIF90YXJnZXQ6IFN0cmVhbTxUPjsgLy8gaW1pdGF0aW9uIHRhcmdldCBpZiB0aGlzIFN0cmVhbSB3aWxsIGltaXRhdGVcbiAgcHJvdGVjdGVkIF9lcnI6IGFueTtcblxuICBjb25zdHJ1Y3Rvcihwcm9kdWNlcj86IEludGVybmFsUHJvZHVjZXI8VD4pIHtcbiAgICB0aGlzLl9wcm9kID0gcHJvZHVjZXIgfHwgTk8gYXMgSW50ZXJuYWxQcm9kdWNlcjxUPjtcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB0aGlzLl9kbCA9IE5PIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgdGhpcy5fZCA9IGZhbHNlO1xuICAgIHRoaXMuX3RhcmdldCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX24odCk7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fbih0KTsgZWxzZSBpZiAoTCA9PSAwKSByZXR1cm47IGVsc2Uge1xuICAgICAgY29uc3QgYiA9IGNwKGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIGJbaV0uX24odCk7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZXJyICE9PSBOTykgcmV0dXJuO1xuICAgIHRoaXMuX2VyciA9IGVycjtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICB0aGlzLl94KCk7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9lKGVycik7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fZShlcnIpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fZShlcnIpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2QgJiYgTCA9PSAwKSB0aHJvdyB0aGlzLl9lcnI7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICB0aGlzLl94KCk7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9jKCk7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fYygpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fYygpO1xuICAgIH1cbiAgfVxuXG4gIF94KCk6IHZvaWQgeyAvLyB0ZWFyIGRvd24gbG9naWMsIGFmdGVyIGVycm9yIG9yIGNvbXBsZXRlXG4gICAgaWYgKHRoaXMuX2lscy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBpZiAodGhpcy5fcHJvZCAhPT0gTk8pIHRoaXMuX3Byb2QuX3N0b3AoKTtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgfVxuXG4gIF9zdG9wTm93KCkge1xuICAgIC8vIFdBUk5JTkc6IGNvZGUgdGhhdCBjYWxscyB0aGlzIG1ldGhvZCBzaG91bGRcbiAgICAvLyBmaXJzdCBjaGVjayBpZiB0aGlzLl9wcm9kIGlzIHZhbGlkIChub3QgYE5PYClcbiAgICB0aGlzLl9wcm9kLl9zdG9wKCk7XG4gICAgdGhpcy5fZXJyID0gTk87XG4gICAgdGhpcy5fc3RvcElEID0gTk87XG4gIH1cblxuICBfYWRkKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9hZGQoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgYS5wdXNoKGlsKTtcbiAgICBpZiAoYS5sZW5ndGggPiAxKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX3N0b3BJRCAhPT0gTk8pIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zdG9wSUQpO1xuICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgICAgaWYgKHAgIT09IE5PKSBwLl9zdGFydCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBfcmVtb3ZlKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9yZW1vdmUoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgaSA9IGEuaW5kZXhPZihpbCk7XG4gICAgaWYgKGkgPiAtMSkge1xuICAgICAgYS5zcGxpY2UoaSwgMSk7XG4gICAgICBpZiAodGhpcy5fcHJvZCAhPT0gTk8gJiYgYS5sZW5ndGggPD0gMCkge1xuICAgICAgICB0aGlzLl9lcnIgPSBOTztcbiAgICAgICAgdGhpcy5fc3RvcElEID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9zdG9wTm93KCkpO1xuICAgICAgfSBlbHNlIGlmIChhLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB0aGlzLl9wcnVuZUN5Y2xlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIGFsbCBwYXRocyBzdGVtbWluZyBmcm9tIGB0aGlzYCBzdHJlYW0gZXZlbnR1YWxseSBlbmQgYXQgYHRoaXNgXG4gIC8vIHN0cmVhbSwgdGhlbiB3ZSByZW1vdmUgdGhlIHNpbmdsZSBsaXN0ZW5lciBvZiBgdGhpc2Agc3RyZWFtLCB0b1xuICAvLyBmb3JjZSBpdCB0byBlbmQgaXRzIGV4ZWN1dGlvbiBhbmQgZGlzcG9zZSByZXNvdXJjZXMuIFRoaXMgbWV0aG9kXG4gIC8vIGFzc3VtZXMgYXMgYSBwcmVjb25kaXRpb24gdGhhdCB0aGlzLl9pbHMgaGFzIGp1c3Qgb25lIGxpc3RlbmVyLlxuICBfcHJ1bmVDeWNsZXMoKSB7XG4gICAgaWYgKHRoaXMuX2hhc05vU2lua3ModGhpcywgW10pKSB0aGlzLl9yZW1vdmUodGhpcy5faWxzWzBdKTtcbiAgfVxuXG4gIC8vIENoZWNrcyB3aGV0aGVyICp0aGVyZSBpcyBubyogcGF0aCBzdGFydGluZyBmcm9tIGB4YCB0aGF0IGxlYWRzIHRvIGFuIGVuZFxuICAvLyBsaXN0ZW5lciAoc2luaykgaW4gdGhlIHN0cmVhbSBncmFwaCwgZm9sbG93aW5nIGVkZ2VzIEEtPkIgd2hlcmUgQiBpcyBhXG4gIC8vIGxpc3RlbmVyIG9mIEEuIFRoaXMgbWVhbnMgdGhlc2UgcGF0aHMgY29uc3RpdHV0ZSBhIGN5Y2xlIHNvbWVob3cuIElzIGdpdmVuXG4gIC8vIGEgdHJhY2Ugb2YgYWxsIHZpc2l0ZWQgbm9kZXMgc28gZmFyLlxuICBfaGFzTm9TaW5rcyh4OiBJbnRlcm5hbExpc3RlbmVyPGFueT4sIHRyYWNlOiBBcnJheTxhbnk+KTogYm9vbGVhbiB7XG4gICAgaWYgKHRyYWNlLmluZGV4T2YoeCkgIT09IC0xKVxuICAgICAgcmV0dXJuIHRydWU7IGVsc2VcbiAgICBpZiAoKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQgPT09IHRoaXMpXG4gICAgICByZXR1cm4gdHJ1ZTsgZWxzZVxuICAgIGlmICgoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCAmJiAoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCAhPT0gTk8pXG4gICAgICByZXR1cm4gdGhpcy5faGFzTm9TaW5rcygoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCwgdHJhY2UuY29uY2F0KHgpKTsgZWxzZVxuICAgIGlmICgoeCBhcyBTdHJlYW08YW55PikuX2lscykge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIE4gPSAoeCBhcyBTdHJlYW08YW55PikuX2lscy5sZW5ndGg7IGkgPCBOOyBpKyspXG4gICAgICAgIGlmICghdGhpcy5faGFzTm9TaW5rcygoeCBhcyBTdHJlYW08YW55PikuX2lsc1tpXSwgdHJhY2UuY29uY2F0KHgpKSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBjdG9yKCk6IHR5cGVvZiBTdHJlYW0ge1xuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtID8gTWVtb3J5U3RyZWFtIDogU3RyZWFtO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyfSBsaXN0ZW5lclxuICAgKi9cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogdm9pZCB7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9uID0gbGlzdGVuZXIubmV4dCB8fCBub29wO1xuICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fZSA9IGxpc3RlbmVyLmVycm9yIHx8IG5vb3A7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9jID0gbGlzdGVuZXIuY29tcGxldGUgfHwgbm9vcDtcbiAgICB0aGlzLl9hZGQobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIExpc3RlbmVyIGZyb20gdGhlIFN0cmVhbSwgYXNzdW1pbmcgdGhlIExpc3RlbmVyIHdhcyBhZGRlZCB0byBpdC5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcjxUPn0gbGlzdGVuZXJcbiAgICovXG4gIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pik6IHZvaWQge1xuICAgIHRoaXMuX3JlbW92ZShsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgTGlzdGVuZXIgdG8gdGhlIFN0cmVhbSByZXR1cm5pbmcgYSBTdWJzY3JpcHRpb24gdG8gcmVtb3ZlIHRoYXRcbiAgICogbGlzdGVuZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXJ9IGxpc3RlbmVyXG4gICAqIEByZXR1cm5zIHtTdWJzY3JpcHRpb259XG4gICAqL1xuICBzdWJzY3JpYmUobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogU3Vic2NyaXB0aW9uIHtcbiAgICB0aGlzLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gbmV3IFN0cmVhbVN1YjxUPih0aGlzLCBsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgaW50ZXJvcCBiZXR3ZWVuIG1vc3QuanMgYW5kIFJ4SlMgNVxuICAgKlxuICAgKiBAcmV0dXJucyB7U3RyZWFtfVxuICAgKi9cbiAgWyQkb2JzZXJ2YWJsZV0oKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGU8VD4ocHJvZHVjZXI/OiBQcm9kdWNlcjxUPik6IFN0cmVhbTxUPiB7XG4gICAgaWYgKHByb2R1Y2VyKSB7XG4gICAgICBpZiAodHlwZW9mIHByb2R1Y2VyLnN0YXJ0ICE9PSAnZnVuY3Rpb24nXG4gICAgICB8fCB0eXBlb2YgcHJvZHVjZXIuc3RvcCAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcm9kdWNlciByZXF1aXJlcyBib3RoIHN0YXJ0IGFuZCBzdG9wIGZ1bmN0aW9ucycpO1xuICAgICAgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgfVxuICAgIHJldHVybiBuZXcgU3RyZWFtKHByb2R1Y2VyIGFzIEludGVybmFsUHJvZHVjZXI8VD4gJiBQcm9kdWNlcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNZW1vcnlTdHJlYW0gZ2l2ZW4gYSBQcm9kdWNlci5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb2R1Y2VyfSBwcm9kdWNlciBBbiBvcHRpb25hbCBQcm9kdWNlciB0aGF0IGRpY3RhdGVzIGhvdyB0b1xuICAgKiBzdGFydCwgZ2VuZXJhdGUgZXZlbnRzLCBhbmQgc3RvcCB0aGUgU3RyZWFtLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlV2l0aE1lbW9yeTxUPihwcm9kdWNlcj86IFByb2R1Y2VyPFQ+KTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICBpZiAocHJvZHVjZXIpIGludGVybmFsaXplUHJvZHVjZXIocHJvZHVjZXIpOyAvLyBtdXRhdGVzIHRoZSBpbnB1dFxuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KHByb2R1Y2VyIGFzIEludGVybmFsUHJvZHVjZXI8VD4gJiBQcm9kdWNlcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGRvZXMgbm90aGluZyB3aGVuIHN0YXJ0ZWQuIEl0IG5ldmVyIGVtaXRzIGFueSBldmVudC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogICAgICAgICAgbmV2ZXJcbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG5ldmVyKCk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtfc3RhcnQ6IG5vb3AsIF9zdG9wOiBub29wfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIHRoZSBcImNvbXBsZXRlXCIgbm90aWZpY2F0aW9uIHdoZW5cbiAgICogc3RhcnRlZCwgYW5kIHRoYXQncyBpdC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZW1wdHlcbiAgICogLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGVtcHR5KCk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtcbiAgICAgIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+KSB7IGlsLl9jKCk7IH0sXG4gICAgICBfc3RvcDogbm9vcCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgYW4gXCJlcnJvclwiIG5vdGlmaWNhdGlvbiB3aXRoIHRoZVxuICAgKiB2YWx1ZSB5b3UgcGFzc2VkIGFzIHRoZSBgZXJyb3JgIGFyZ3VtZW50IHdoZW4gdGhlIHN0cmVhbSBzdGFydHMsIGFuZCB0aGF0J3NcbiAgICogaXQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIHRocm93KFgpXG4gICAqIC1YXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSBlcnJvciBUaGUgZXJyb3IgZXZlbnQgdG8gZW1pdCBvbiB0aGUgY3JlYXRlZCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyB0aHJvdyhlcnJvcjogYW55KTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe1xuICAgICAgX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHsgaWwuX2UoZXJyb3IpOyB9LFxuICAgICAgX3N0b3A6IG5vb3AsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHN0cmVhbSBmcm9tIGFuIEFycmF5LCBQcm9taXNlLCBvciBhbiBPYnNlcnZhYmxlLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7QXJyYXl8UHJvbWlzZUxpa2V8T2JzZXJ2YWJsZX0gaW5wdXQgVGhlIGlucHV0IHRvIG1ha2UgYSBzdHJlYW0gZnJvbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb208VD4oaW5wdXQ6IFByb21pc2VMaWtlPFQ+IHwgU3RyZWFtPFQ+IHwgQXJyYXk8VD4gfCBPYnNlcnZhYmxlPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAodHlwZW9mIGlucHV0WyQkb2JzZXJ2YWJsZV0gPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21PYnNlcnZhYmxlPFQ+KGlucHV0IGFzIE9ic2VydmFibGU8VD4pOyBlbHNlXG4gICAgaWYgKHR5cGVvZiAoaW5wdXQgYXMgUHJvbWlzZUxpa2U8VD4pLnRoZW4gPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21Qcm9taXNlPFQ+KGlucHV0IGFzIFByb21pc2VMaWtlPFQ+KTsgZWxzZVxuICAgIGlmIChBcnJheS5pc0FycmF5KGlucHV0KSlcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbUFycmF5PFQ+KGlucHV0KTtcblxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFR5cGUgb2YgaW5wdXQgdG8gZnJvbSgpIG11c3QgYmUgYW4gQXJyYXksIFByb21pc2UsIG9yIE9ic2VydmFibGVgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgdGhlIGFyZ3VtZW50cyB0aGF0IHlvdSBnaXZlIHRvXG4gICAqICpvZiosIHRoZW4gY29tcGxldGVzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBvZigxLDIsMylcbiAgICogMTIzfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0gYSBUaGUgZmlyc3QgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLlxuICAgKiBAcGFyYW0gYiBUaGUgc2Vjb25kIHZhbHVlIHlvdSB3YW50IHRvIGVtaXQgYXMgYW4gZXZlbnQgb24gdGhlIHN0cmVhbS4gT25lXG4gICAqIG9yIG1vcmUgb2YgdGhlc2UgdmFsdWVzIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBvZjxUPiguLi5pdGVtczogQXJyYXk8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBTdHJlYW0uZnJvbUFycmF5PFQ+KGl0ZW1zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhbiBhcnJheSB0byBhIHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSB3aWxsIGVtaXQgc3luY2hyb25vdXNseVxuICAgKiBhbGwgdGhlIGl0ZW1zIGluIHRoZSBhcnJheSwgYW5kIHRoZW4gY29tcGxldGUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGZyb21BcnJheShbMSwyLDNdKVxuICAgKiAxMjN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tQXJyYXk8VD4oYXJyYXk6IEFycmF5PFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbUFycmF5PFQ+KGFycmF5KSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSBwcm9taXNlIHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCB0aGUgcmVzb2x2ZWRcbiAgICogdmFsdWUgb2YgdGhlIHByb21pc2UsIGFuZCB0aGVuIGNvbXBsZXRlLiBIb3dldmVyLCBpZiB0aGUgcHJvbWlzZSBpc1xuICAgKiByZWplY3RlZCwgdGhlIHN0cmVhbSB3aWxsIGVtaXQgdGhlIGNvcnJlc3BvbmRpbmcgZXJyb3IuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGZyb21Qcm9taXNlKCAtLS0tNDIgKVxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLTQyfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb21pc2VMaWtlfSBwcm9taXNlIFRoZSBwcm9taXNlIHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21Qcm9taXNlPFQ+KHByb21pc2U6IFByb21pc2VMaWtlPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbVByb21pc2U8VD4ocHJvbWlzZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIE9ic2VydmFibGUgaW50byBhIFN0cmVhbS5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge2FueX0gb2JzZXJ2YWJsZSBUaGUgb2JzZXJ2YWJsZSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tT2JzZXJ2YWJsZTxUPihvYnM6IHtzdWJzY3JpYmU6IGFueX0pOiBTdHJlYW08VD4ge1xuICAgIGlmICgob2JzIGFzIFN0cmVhbTxUPikuZW5kV2hlbikgcmV0dXJuIG9icyBhcyBTdHJlYW08VD47XG4gICAgY29uc3QgbyA9IHR5cGVvZiBvYnNbJCRvYnNlcnZhYmxlXSA9PT0gJ2Z1bmN0aW9uJyA/IG9ic1skJG9ic2VydmFibGVdKCkgOiBvYnM7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZyb21PYnNlcnZhYmxlKG8pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RyZWFtIHRoYXQgcGVyaW9kaWNhbGx5IGVtaXRzIGluY3JlbWVudGFsIG51bWJlcnMsIGV2ZXJ5XG4gICAqIGBwZXJpb2RgIG1pbGxpc2Vjb25kcy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogICAgIHBlcmlvZGljKDEwMDApXG4gICAqIC0tLTAtLS0xLS0tMi0tLTMtLS00LS0tLi4uXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJpb2QgVGhlIGludGVydmFsIGluIG1pbGxpc2Vjb25kcyB0byB1c2UgYXMgYSByYXRlIG9mXG4gICAqIGVtaXNzaW9uLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgcGVyaW9kaWMocGVyaW9kOiBudW1iZXIpOiBTdHJlYW08bnVtYmVyPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08bnVtYmVyPihuZXcgUGVyaW9kaWMocGVyaW9kKSk7XG4gIH1cblxuICAvKipcbiAgICogQmxlbmRzIG11bHRpcGxlIHN0cmVhbXMgdG9nZXRoZXIsIGVtaXR0aW5nIGV2ZW50cyBmcm9tIGFsbCBvZiB0aGVtXG4gICAqIGNvbmN1cnJlbnRseS5cbiAgICpcbiAgICogKm1lcmdlKiB0YWtlcyBtdWx0aXBsZSBzdHJlYW1zIGFzIGFyZ3VtZW50cywgYW5kIGNyZWF0ZXMgYSBzdHJlYW0gdGhhdFxuICAgKiBiZWhhdmVzIGxpa2UgZWFjaCBvZiB0aGUgYXJndW1lbnQgc3RyZWFtcywgaW4gcGFyYWxsZWwuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gICAqIC0tLS1hLS0tLS1iLS0tLWMtLS1kLS0tLS0tXG4gICAqICAgICAgICAgICAgbWVyZ2VcbiAgICogLS0xLWEtLTItLWItLTMtYy0tLWQtLTQtLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gbWVyZ2UgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMiBBIHN0cmVhbSB0byBtZXJnZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuIFR3b1xuICAgKiBvciBtb3JlIHN0cmVhbXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG1lcmdlOiBNZXJnZVNpZ25hdHVyZSA9IGZ1bmN0aW9uIG1lcmdlKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4obmV3IE1lcmdlKHN0cmVhbXMpKTtcbiAgfSBhcyBNZXJnZVNpZ25hdHVyZTtcblxuICAvKipcbiAgICogQ29tYmluZXMgbXVsdGlwbGUgaW5wdXQgc3RyZWFtcyB0b2dldGhlciB0byByZXR1cm4gYSBzdHJlYW0gd2hvc2UgZXZlbnRzXG4gICAqIGFyZSBhcnJheXMgdGhhdCBjb2xsZWN0IHRoZSBsYXRlc3QgZXZlbnRzIGZyb20gZWFjaCBpbnB1dCBzdHJlYW0uXG4gICAqXG4gICAqICpjb21iaW5lKiBpbnRlcm5hbGx5IHJlbWVtYmVycyB0aGUgbW9zdCByZWNlbnQgZXZlbnQgZnJvbSBlYWNoIG9mIHRoZSBpbnB1dFxuICAgKiBzdHJlYW1zLiBXaGVuIGFueSBvZiB0aGUgaW5wdXQgc3RyZWFtcyBlbWl0cyBhbiBldmVudCwgdGhhdCBldmVudCB0b2dldGhlclxuICAgKiB3aXRoIGFsbCB0aGUgb3RoZXIgc2F2ZWQgZXZlbnRzIGFyZSBjb21iaW5lZCBpbnRvIGFuIGFycmF5LiBUaGF0IGFycmF5IHdpbGxcbiAgICogYmUgZW1pdHRlZCBvbiB0aGUgb3V0cHV0IHN0cmVhbS4gSXQncyBlc3NlbnRpYWxseSBhIHdheSBvZiBqb2luaW5nIHRvZ2V0aGVyXG4gICAqIHRoZSBldmVudHMgZnJvbSBtdWx0aXBsZSBzdHJlYW1zLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tLS0tNC0tLVxuICAgKiAtLS0tYS0tLS0tYi0tLS0tYy0tZC0tLS0tLVxuICAgKiAgICAgICAgICBjb21iaW5lXG4gICAqIC0tLS0xYS0yYS0yYi0zYi0zYy0zZC00ZC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMiBBIHN0cmVhbSB0byBjb21iaW5lIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAgICogTXVsdGlwbGUgc3RyZWFtcywgbm90IGp1c3QgdHdvLCBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY29tYmluZTogQ29tYmluZVNpZ25hdHVyZSA9IGZ1bmN0aW9uIGNvbWJpbmUoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08QXJyYXk8YW55Pj4obmV3IENvbWJpbmU8YW55PihzdHJlYW1zKSk7XG4gIH0gYXMgQ29tYmluZVNpZ25hdHVyZTtcblxuICBwcm90ZWN0ZWQgX21hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IFN0cmVhbTxVPiB8IE1lbW9yeVN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFU+KG5ldyBNYXBPcDxULCBVPihwcm9qZWN0LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyBlYWNoIGV2ZW50IGZyb20gdGhlIGlucHV0IFN0cmVhbSB0aHJvdWdoIGEgYHByb2plY3RgIGZ1bmN0aW9uLFxuICAgKiB0byBnZXQgYSBTdHJlYW0gdGhhdCBlbWl0cyB0aG9zZSB0cmFuc2Zvcm1lZCBldmVudHMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTMtLTUtLS0tLTctLS0tLS1cbiAgICogICAgbWFwKGkgPT4gaSAqIDEwKVxuICAgKiAtLTEwLS0zMC01MC0tLS03MC0tLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcm9qZWN0IEEgZnVuY3Rpb24gb2YgdHlwZSBgKHQ6IFQpID0+IFVgIHRoYXQgdGFrZXMgZXZlbnRcbiAgICogYHRgIG9mIHR5cGUgYFRgIGZyb20gdGhlIGlucHV0IFN0cmVhbSBhbmQgcHJvZHVjZXMgYW4gZXZlbnQgb2YgdHlwZSBgVWAsIHRvXG4gICAqIGJlIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIG1hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IFN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIHRoaXMuX21hcChwcm9qZWN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdCdzIGxpa2UgYG1hcGAsIGJ1dCB0cmFuc2Zvcm1zIGVhY2ggaW5wdXQgZXZlbnQgdG8gYWx3YXlzIHRoZSBzYW1lXG4gICAqIGNvbnN0YW50IHZhbHVlIG9uIHRoZSBvdXRwdXQgU3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0zLS01LS0tLS03LS0tLS1cbiAgICogICAgICAgbWFwVG8oMTApXG4gICAqIC0tMTAtLTEwLTEwLS0tLTEwLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHByb2plY3RlZFZhbHVlIEEgdmFsdWUgdG8gZW1pdCBvbiB0aGUgb3V0cHV0IFN0cmVhbSB3aGVuZXZlciB0aGVcbiAgICogaW5wdXQgU3RyZWFtIGVtaXRzIGFueSB2YWx1ZS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbWFwVG88VT4ocHJvamVjdGVkVmFsdWU6IFUpOiBTdHJlYW08VT4ge1xuICAgIGNvbnN0IHMgPSB0aGlzLm1hcCgoKSA9PiBwcm9qZWN0ZWRWYWx1ZSk7XG4gICAgY29uc3Qgb3A6IE9wZXJhdG9yPFQsIFU+ID0gcy5fcHJvZCBhcyBPcGVyYXRvcjxULCBVPjtcbiAgICBvcC50eXBlID0gJ21hcFRvJztcbiAgICByZXR1cm4gcztcbiAgfVxuXG4gIGZpbHRlcjxTIGV4dGVuZHMgVD4ocGFzc2VzOiAodDogVCkgPT4gdCBpcyBTKTogU3RyZWFtPFM+O1xuICBmaWx0ZXIocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbik6IFN0cmVhbTxUPjtcbiAgLyoqXG4gICAqIE9ubHkgYWxsb3dzIGV2ZW50cyB0aGF0IHBhc3MgdGhlIHRlc3QgZ2l2ZW4gYnkgdGhlIGBwYXNzZXNgIGFyZ3VtZW50LlxuICAgKlxuICAgKiBFYWNoIGV2ZW50IGZyb20gdGhlIGlucHV0IHN0cmVhbSBpcyBnaXZlbiB0byB0aGUgYHBhc3Nlc2AgZnVuY3Rpb24uIElmIHRoZVxuICAgKiBmdW5jdGlvbiByZXR1cm5zIGB0cnVlYCwgdGhlIGV2ZW50IGlzIGZvcndhcmRlZCB0byB0aGUgb3V0cHV0IHN0cmVhbSxcbiAgICogb3RoZXJ3aXNlIGl0IGlzIGlnbm9yZWQgYW5kIG5vdCBmb3J3YXJkZWQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTItLTMtLS0tLTQtLS0tLTUtLS02LS03LTgtLVxuICAgKiAgICAgZmlsdGVyKGkgPT4gaSAlIDIgPT09IDApXG4gICAqIC0tLS0tLTItLS0tLS0tLTQtLS0tLS0tLS02LS0tLTgtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcGFzc2VzIEEgZnVuY3Rpb24gb2YgdHlwZSBgKHQ6IFQpID0+IGJvb2xlYW5gIHRoYXQgdGFrZXNcbiAgICogYW4gZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGFuZCBjaGVja3MgaWYgaXQgcGFzc2VzLCBieSByZXR1cm5pbmcgYVxuICAgKiBib29sZWFuLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBmaWx0ZXIocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbik6IFN0cmVhbTxUPiB7XG4gICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgaWYgKHAgaW5zdGFuY2VvZiBGaWx0ZXIpXG4gICAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRmlsdGVyPFQ+KFxuICAgICAgICBhbmQoKHAgYXMgRmlsdGVyPFQ+KS5mLCBwYXNzZXMpLFxuICAgICAgICAocCBhcyBGaWx0ZXI8VD4pLmluc1xuICAgICAgKSk7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZpbHRlcjxUPihwYXNzZXMsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMZXRzIHRoZSBmaXJzdCBgYW1vdW50YCBtYW55IGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gcGFzcyB0byB0aGVcbiAgICogb3V0cHV0IHN0cmVhbSwgdGhlbiBtYWtlcyB0aGUgb3V0cHV0IHN0cmVhbSBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tLS1kLS0tZS0tXG4gICAqICAgIHRha2UoMylcbiAgICogLS1hLS0tYi0tY3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgSG93IG1hbnkgZXZlbnRzIHRvIGFsbG93IGZyb20gdGhlIGlucHV0IHN0cmVhbVxuICAgKiBiZWZvcmUgY29tcGxldGluZyB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgdGFrZShhbW91bnQ6IG51bWJlcik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBUYWtlPFQ+KGFtb3VudCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIElnbm9yZXMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW5cbiAgICogYWZ0ZXIgdGhhdCBzdGFydHMgZm9yd2FyZGluZyBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHRvIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICogICAgICAgZHJvcCgzKVxuICAgKiAtLS0tLS0tLS0tLS0tLWQtLS1lLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgSG93IG1hbnkgZXZlbnRzIHRvIGlnbm9yZSBmcm9tIHRoZSBpbnB1dCBzdHJlYW1cbiAgICogYmVmb3JlIGZvcndhcmRpbmcgYWxsIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGRyb3AoYW1vdW50OiBudW1iZXIpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBEcm9wPFQ+KGFtb3VudCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZW4gdGhlIGlucHV0IHN0cmVhbSBjb21wbGV0ZXMsIHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgZW1pdCB0aGUgbGFzdCBldmVudFxuICAgKiBlbWl0dGVkIGJ5IHRoZSBpbnB1dCBzdHJlYW0sIGFuZCB0aGVuIHdpbGwgYWxzbyBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tZC0tLS18XG4gICAqICAgICAgIGxhc3QoKVxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLWR8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBsYXN0KCk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IExhc3Q8VD4odGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZXBlbmRzIHRoZSBnaXZlbiBgaW5pdGlhbGAgdmFsdWUgdG8gdGhlIHNlcXVlbmNlIG9mIGV2ZW50cyBlbWl0dGVkIGJ5IHRoZVxuICAgKiBpbnB1dCBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gaXMgYSBNZW1vcnlTdHJlYW0sIHdoaWNoIG1lYW5zIGl0IGlzXG4gICAqIGFscmVhZHkgYHJlbWVtYmVyKClgJ2QuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLTEtLS0yLS0tLS0zLS0tXG4gICAqICAgc3RhcnRXaXRoKDApXG4gICAqIDAtLTEtLS0yLS0tLS0zLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gaW5pdGlhbCBUaGUgdmFsdWUgb3IgZXZlbnQgdG8gcHJlcGVuZC5cbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgc3RhcnRXaXRoKGluaXRpYWw6IFQpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KG5ldyBTdGFydFdpdGg8VD4odGhpcywgaW5pdGlhbCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZXMgYW5vdGhlciBzdHJlYW0gdG8gZGV0ZXJtaW5lIHdoZW4gdG8gY29tcGxldGUgdGhlIGN1cnJlbnQgc3RyZWFtLlxuICAgKlxuICAgKiBXaGVuIHRoZSBnaXZlbiBgb3RoZXJgIHN0cmVhbSBlbWl0cyBhbiBldmVudCBvciBjb21wbGV0ZXMsIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtIHdpbGwgY29tcGxldGUuIEJlZm9yZSB0aGF0IGhhcHBlbnMsIHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgYmVoYXZlc1xuICAgKiBsaWtlIHRoZSBpbnB1dCBzdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLTEtLS0yLS0tLS0zLS00LS0tLTUtLS0tNi0tLVxuICAgKiAgIGVuZFdoZW4oIC0tLS0tLS0tYS0tYi0tfCApXG4gICAqIC0tLTEtLS0yLS0tLS0zLS00LS18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gb3RoZXIgU29tZSBvdGhlciBzdHJlYW0gdGhhdCBpcyB1c2VkIHRvIGtub3cgd2hlbiBzaG91bGQgdGhlIG91dHB1dFxuICAgKiBzdHJlYW0gb2YgdGhpcyBvcGVyYXRvciBjb21wbGV0ZS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZW5kV2hlbihvdGhlcjogU3RyZWFtPGFueT4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgRW5kV2hlbjxUPihvdGhlciwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFwiRm9sZHNcIiB0aGUgc3RyZWFtIG9udG8gaXRzZWxmLlxuICAgKlxuICAgKiBDb21iaW5lcyBldmVudHMgZnJvbSB0aGUgcGFzdCB0aHJvdWdob3V0XG4gICAqIHRoZSBlbnRpcmUgZXhlY3V0aW9uIG9mIHRoZSBpbnB1dCBzdHJlYW0sIGFsbG93aW5nIHlvdSB0byBhY2N1bXVsYXRlIHRoZW1cbiAgICogdG9nZXRoZXIuIEl0J3MgZXNzZW50aWFsbHkgbGlrZSBgQXJyYXkucHJvdG90eXBlLnJlZHVjZWAuIFRoZSByZXR1cm5lZFxuICAgKiBzdHJlYW0gaXMgYSBNZW1vcnlTdHJlYW0sIHdoaWNoIG1lYW5zIGl0IGlzIGFscmVhZHkgYHJlbWVtYmVyKClgJ2QuXG4gICAqXG4gICAqIFRoZSBvdXRwdXQgc3RyZWFtIHN0YXJ0cyBieSBlbWl0dGluZyB0aGUgYHNlZWRgIHdoaWNoIHlvdSBnaXZlIGFzIGFyZ3VtZW50LlxuICAgKiBUaGVuLCB3aGVuIGFuIGV2ZW50IGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgaXQgaXMgY29tYmluZWQgd2l0aCB0aGF0XG4gICAqIHNlZWQgdmFsdWUgdGhyb3VnaCB0aGUgYGFjY3VtdWxhdGVgIGZ1bmN0aW9uLCBhbmQgdGhlIG91dHB1dCB2YWx1ZSBpc1xuICAgKiBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBgZm9sZGAgcmVtZW1iZXJzIHRoYXQgb3V0cHV0IHZhbHVlIGFzIGBhY2NgXG4gICAqIChcImFjY3VtdWxhdG9yXCIpLCBhbmQgdGhlbiB3aGVuIGEgbmV3IGlucHV0IGV2ZW50IGB0YCBoYXBwZW5zLCBgYWNjYCB3aWxsIGJlXG4gICAqIGNvbWJpbmVkIHdpdGggdGhhdCB0byBwcm9kdWNlIHRoZSBuZXcgYGFjY2AgYW5kIHNvIGZvcnRoLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLS0tLS0xLS0tLS0xLS0yLS0tLTEtLS0tMS0tLS0tLVxuICAgKiAgIGZvbGQoKGFjYywgeCkgPT4gYWNjICsgeCwgMylcbiAgICogMy0tLS0tNC0tLS0tNS0tNy0tLS04LS0tLTktLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGFjY3VtdWxhdGUgQSBmdW5jdGlvbiBvZiB0eXBlIGAoYWNjOiBSLCB0OiBUKSA9PiBSYCB0aGF0XG4gICAqIHRha2VzIHRoZSBwcmV2aW91cyBhY2N1bXVsYXRlZCB2YWx1ZSBgYWNjYCBhbmQgdGhlIGluY29taW5nIGV2ZW50IGZyb20gdGhlXG4gICAqIGlucHV0IHN0cmVhbSBhbmQgcHJvZHVjZXMgdGhlIG5ldyBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICogQHBhcmFtIHNlZWQgVGhlIGluaXRpYWwgYWNjdW11bGF0ZWQgdmFsdWUsIG9mIHR5cGUgYFJgLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBmb2xkPFI+KGFjY3VtdWxhdGU6IChhY2M6IFIsIHQ6IFQpID0+IFIsIHNlZWQ6IFIpOiBNZW1vcnlTdHJlYW08Uj4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFI+KG5ldyBGb2xkPFQsIFI+KGFjY3VtdWxhdGUsIHNlZWQsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBsYWNlcyBhbiBlcnJvciB3aXRoIGFub3RoZXIgc3RyZWFtLlxuICAgKlxuICAgKiBXaGVuIChhbmQgaWYpIGFuIGVycm9yIGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgaW5zdGVhZCBvZiBmb3J3YXJkaW5nXG4gICAqIHRoYXQgZXJyb3IgdG8gdGhlIG91dHB1dCBzdHJlYW0sICpyZXBsYWNlRXJyb3IqIHdpbGwgY2FsbCB0aGUgYHJlcGxhY2VgXG4gICAqIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIHN0cmVhbSB0aGF0IHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgcmVwbGljYXRlLlxuICAgKiBBbmQsIGluIGNhc2UgdGhhdCBuZXcgc3RyZWFtIGFsc28gZW1pdHMgYW4gZXJyb3IsIGByZXBsYWNlYCB3aWxsIGJlIGNhbGxlZFxuICAgKiBhZ2FpbiB0byBnZXQgYW5vdGhlciBzdHJlYW0gdG8gc3RhcnQgcmVwbGljYXRpbmcuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTItLS0tLTMtLTQtLS0tLVhcbiAgICogICByZXBsYWNlRXJyb3IoICgpID0+IC0tMTAtLXwgKVxuICAgKiAtLTEtLS0yLS0tLS0zLS00LS0tLS0tLS0xMC0tfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmVwbGFjZSBBIGZ1bmN0aW9uIG9mIHR5cGUgYChlcnIpID0+IFN0cmVhbWAgdGhhdCB0YWtlc1xuICAgKiB0aGUgZXJyb3IgdGhhdCBvY2N1cnJlZCBvbiB0aGUgaW5wdXQgc3RyZWFtIG9yIG9uIHRoZSBwcmV2aW91cyByZXBsYWNlbWVudFxuICAgKiBzdHJlYW0gYW5kIHJldHVybnMgYSBuZXcgc3RyZWFtLiBUaGUgb3V0cHV0IHN0cmVhbSB3aWxsIGJlaGF2ZSBsaWtlIHRoZVxuICAgKiBzdHJlYW0gdGhhdCB0aGlzIGZ1bmN0aW9uIHJldHVybnMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHJlcGxhY2VFcnJvcihyZXBsYWNlOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBSZXBsYWNlRXJyb3I8VD4ocmVwbGFjZSwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZsYXR0ZW5zIGEgXCJzdHJlYW0gb2Ygc3RyZWFtc1wiLCBoYW5kbGluZyBvbmx5IG9uZSBuZXN0ZWQgc3RyZWFtIGF0IGEgdGltZVxuICAgKiAobm8gY29uY3VycmVuY3kpLlxuICAgKlxuICAgKiBJZiB0aGUgaW5wdXQgc3RyZWFtIGlzIGEgc3RyZWFtIHRoYXQgZW1pdHMgc3RyZWFtcywgdGhlbiB0aGlzIG9wZXJhdG9yIHdpbGxcbiAgICogcmV0dXJuIGFuIG91dHB1dCBzdHJlYW0gd2hpY2ggaXMgYSBmbGF0IHN0cmVhbTogZW1pdHMgcmVndWxhciBldmVudHMuIFRoZVxuICAgKiBmbGF0dGVuaW5nIGhhcHBlbnMgd2l0aG91dCBjb25jdXJyZW5jeS4gSXQgd29ya3MgbGlrZSB0aGlzOiB3aGVuIHRoZSBpbnB1dFxuICAgKiBzdHJlYW0gZW1pdHMgYSBuZXN0ZWQgc3RyZWFtLCAqZmxhdHRlbiogd2lsbCBzdGFydCBpbWl0YXRpbmcgdGhhdCBuZXN0ZWRcbiAgICogb25lLiBIb3dldmVyLCBhcyBzb29uIGFzIHRoZSBuZXh0IG5lc3RlZCBzdHJlYW0gaXMgZW1pdHRlZCBvbiB0aGUgaW5wdXRcbiAgICogc3RyZWFtLCAqZmxhdHRlbiogd2lsbCBmb3JnZXQgdGhlIHByZXZpb3VzIG5lc3RlZCBvbmUgaXQgd2FzIGltaXRhdGluZywgYW5kXG4gICAqIHdpbGwgc3RhcnQgaW1pdGF0aW5nIHRoZSBuZXcgbmVzdGVkIG9uZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0rLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0tXG4gICAqICAgXFwgICAgICAgIFxcXG4gICAqICAgIFxcICAgICAgIC0tLS0xLS0tLTItLS0zLS1cbiAgICogICAgLS1hLS1iLS0tLWMtLS0tZC0tLS0tLS0tXG4gICAqICAgICAgICAgICBmbGF0dGVuXG4gICAqIC0tLS0tYS0tYi0tLS0tLTEtLS0tMi0tLTMtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZmxhdHRlbjxSPih0aGlzOiBTdHJlYW08U3RyZWFtPFI+Pik6IFQge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFI+KG5ldyBGbGF0dGVuKHRoaXMpKSBhcyBUICYgU3RyZWFtPFI+O1xuICB9XG5cbiAgLyoqXG4gICAqIFBhc3NlcyB0aGUgaW5wdXQgc3RyZWFtIHRvIGEgY3VzdG9tIG9wZXJhdG9yLCB0byBwcm9kdWNlIGFuIG91dHB1dCBzdHJlYW0uXG4gICAqXG4gICAqICpjb21wb3NlKiBpcyBhIGhhbmR5IHdheSBvZiB1c2luZyBhbiBleGlzdGluZyBmdW5jdGlvbiBpbiBhIGNoYWluZWQgc3R5bGUuXG4gICAqIEluc3RlYWQgb2Ygd3JpdGluZyBgb3V0U3RyZWFtID0gZihpblN0cmVhbSlgIHlvdSBjYW4gd3JpdGVcbiAgICogYG91dFN0cmVhbSA9IGluU3RyZWFtLmNvbXBvc2UoZilgLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvcGVyYXRvciBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBzdHJlYW0gYXMgaW5wdXQgYW5kXG4gICAqIHJldHVybnMgYSBzdHJlYW0gYXMgd2VsbC5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgY29tcG9zZTxVPihvcGVyYXRvcjogKHN0cmVhbTogU3RyZWFtPFQ+KSA9PiBVKTogVSB7XG4gICAgcmV0dXJuIG9wZXJhdG9yKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb3V0cHV0IHN0cmVhbSB0aGF0IGJlaGF2ZXMgbGlrZSB0aGUgaW5wdXQgc3RyZWFtLCBidXQgYWxzb1xuICAgKiByZW1lbWJlcnMgdGhlIG1vc3QgcmVjZW50IGV2ZW50IHRoYXQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBzbyB0aGF0IGFcbiAgICogbmV3bHkgYWRkZWQgbGlzdGVuZXIgd2lsbCBpbW1lZGlhdGVseSByZWNlaXZlIHRoYXQgbWVtb3Jpc2VkIGV2ZW50LlxuICAgKlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICByZW1lbWJlcigpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KG5ldyBSZW1lbWJlcjxUPih0aGlzKSk7XG4gIH1cblxuICBkZWJ1ZygpOiBTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6IHN0cmluZyk6IFN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogKHQ6IFQpID0+IGFueSk6IFN0cmVhbTxUPjtcbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb3V0cHV0IHN0cmVhbSB0aGF0IGlkZW50aWNhbGx5IGJlaGF2ZXMgbGlrZSB0aGUgaW5wdXQgc3RyZWFtLFxuICAgKiBidXQgYWxzbyBydW5zIGEgYHNweWAgZnVuY3Rpb24gZm9yIGVhY2ggZXZlbnQsIHRvIGhlbHAgeW91IGRlYnVnIHlvdXIgYXBwLlxuICAgKlxuICAgKiAqZGVidWcqIHRha2VzIGEgYHNweWAgZnVuY3Rpb24gYXMgYXJndW1lbnQsIGFuZCBydW5zIHRoYXQgZm9yIGVhY2ggZXZlbnRcbiAgICogaGFwcGVuaW5nIG9uIHRoZSBpbnB1dCBzdHJlYW0uIElmIHlvdSBkb24ndCBwcm92aWRlIHRoZSBgc3B5YCBhcmd1bWVudCxcbiAgICogdGhlbiAqZGVidWcqIHdpbGwganVzdCBgY29uc29sZS5sb2dgIGVhY2ggZXZlbnQuIFRoaXMgaGVscHMgeW91IHRvXG4gICAqIHVuZGVyc3RhbmQgdGhlIGZsb3cgb2YgZXZlbnRzIHRocm91Z2ggc29tZSBvcGVyYXRvciBjaGFpbi5cbiAgICpcbiAgICogUGxlYXNlIG5vdGUgdGhhdCBpZiB0aGUgb3V0cHV0IHN0cmVhbSBoYXMgbm8gbGlzdGVuZXJzLCB0aGVuIGl0IHdpbGwgbm90XG4gICAqIHN0YXJ0LCB3aGljaCBtZWFucyBgc3B5YCB3aWxsIG5ldmVyIHJ1biBiZWNhdXNlIG5vIGFjdHVhbCBldmVudCBoYXBwZW5zIGluXG4gICAqIHRoYXQgY2FzZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLTQtLVxuICAgKiAgICAgICAgIGRlYnVnXG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS00LS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxhYmVsT3JTcHkgQSBzdHJpbmcgdG8gdXNlIGFzIHRoZSBsYWJlbCB3aGVuIHByaW50aW5nXG4gICAqIGRlYnVnIGluZm9ybWF0aW9uIG9uIHRoZSBjb25zb2xlLCBvciBhICdzcHknIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYW4gZXZlbnRcbiAgICogYXMgYXJndW1lbnQsIGFuZCBkb2VzIG5vdCBuZWVkIHRvIHJldHVybiBhbnl0aGluZy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZGVidWcobGFiZWxPclNweT86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBEZWJ1ZzxUPih0aGlzLCBsYWJlbE9yU3B5KSk7XG4gIH1cblxuICAvKipcbiAgICogKmltaXRhdGUqIGNoYW5nZXMgdGhpcyBjdXJyZW50IFN0cmVhbSB0byBlbWl0IHRoZSBzYW1lIGV2ZW50cyB0aGF0IHRoZVxuICAgKiBgb3RoZXJgIGdpdmVuIFN0cmVhbSBkb2VzLiBUaGlzIG1ldGhvZCByZXR1cm5zIG5vdGhpbmcuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGV4aXN0cyB0byBhbGxvdyBvbmUgdGhpbmc6ICoqY2lyY3VsYXIgZGVwZW5kZW5jeSBvZiBzdHJlYW1zKiouXG4gICAqIEZvciBpbnN0YW5jZSwgbGV0J3MgaW1hZ2luZSB0aGF0IGZvciBzb21lIHJlYXNvbiB5b3UgbmVlZCB0byBjcmVhdGUgYVxuICAgKiBjaXJjdWxhciBkZXBlbmRlbmN5IHdoZXJlIHN0cmVhbSBgZmlyc3QkYCBkZXBlbmRzIG9uIHN0cmVhbSBgc2Vjb25kJGBcbiAgICogd2hpY2ggaW4gdHVybiBkZXBlbmRzIG9uIGBmaXJzdCRgOlxuICAgKlxuICAgKiA8IS0tIHNraXAtZXhhbXBsZSAtLT5cbiAgICogYGBganNcbiAgICogaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknXG4gICAqXG4gICAqIHZhciBmaXJzdCQgPSBzZWNvbmQkLm1hcCh4ID0+IHggKiAxMCkudGFrZSgzKTtcbiAgICogdmFyIHNlY29uZCQgPSBmaXJzdCQubWFwKHggPT4geCArIDEpLnN0YXJ0V2l0aCgxKS5jb21wb3NlKGRlbGF5KDEwMCkpO1xuICAgKiBgYGBcbiAgICpcbiAgICogSG93ZXZlciwgdGhhdCBpcyBpbnZhbGlkIEphdmFTY3JpcHQsIGJlY2F1c2UgYHNlY29uZCRgIGlzIHVuZGVmaW5lZFxuICAgKiBvbiB0aGUgZmlyc3QgbGluZS4gVGhpcyBpcyBob3cgKmltaXRhdGUqIGNhbiBoZWxwIHNvbHZlIGl0OlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAgICpcbiAgICogdmFyIHNlY29uZFByb3h5JCA9IHhzLmNyZWF0ZSgpO1xuICAgKiB2YXIgZmlyc3QkID0gc2Vjb25kUHJveHkkLm1hcCh4ID0+IHggKiAxMCkudGFrZSgzKTtcbiAgICogdmFyIHNlY29uZCQgPSBmaXJzdCQubWFwKHggPT4geCArIDEpLnN0YXJ0V2l0aCgxKS5jb21wb3NlKGRlbGF5KDEwMCkpO1xuICAgKiBzZWNvbmRQcm94eSQuaW1pdGF0ZShzZWNvbmQkKTtcbiAgICogYGBgXG4gICAqXG4gICAqIFdlIGNyZWF0ZSBgc2Vjb25kUHJveHkkYCBiZWZvcmUgdGhlIG90aGVycywgc28gaXQgY2FuIGJlIHVzZWQgaW4gdGhlXG4gICAqIGRlY2xhcmF0aW9uIG9mIGBmaXJzdCRgLiBUaGVuLCBhZnRlciBib3RoIGBmaXJzdCRgIGFuZCBgc2Vjb25kJGAgYXJlXG4gICAqIGRlZmluZWQsIHdlIGhvb2sgYHNlY29uZFByb3h5JGAgd2l0aCBgc2Vjb25kJGAgd2l0aCBgaW1pdGF0ZSgpYCB0byB0ZWxsXG4gICAqIHRoYXQgdGhleSBhcmUgXCJ0aGUgc2FtZVwiLiBgaW1pdGF0ZWAgd2lsbCBub3QgdHJpZ2dlciB0aGUgc3RhcnQgb2YgYW55XG4gICAqIHN0cmVhbSwgaXQganVzdCBiaW5kcyBgc2Vjb25kUHJveHkkYCBhbmQgYHNlY29uZCRgIHRvZ2V0aGVyLlxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGlzIGFuIGV4YW1wbGUgd2hlcmUgYGltaXRhdGUoKWAgaXMgaW1wb3J0YW50IGluIEN5Y2xlLmpzXG4gICAqIGFwcGxpY2F0aW9ucy4gQSBwYXJlbnQgY29tcG9uZW50IGNvbnRhaW5zIHNvbWUgY2hpbGQgY29tcG9uZW50cy4gQSBjaGlsZFxuICAgKiBoYXMgYW4gYWN0aW9uIHN0cmVhbSB3aGljaCBpcyBnaXZlbiB0byB0aGUgcGFyZW50IHRvIGRlZmluZSBpdHMgc3RhdGU6XG4gICAqXG4gICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgKiBgYGBqc1xuICAgKiBjb25zdCBjaGlsZEFjdGlvblByb3h5JCA9IHhzLmNyZWF0ZSgpO1xuICAgKiBjb25zdCBwYXJlbnQgPSBQYXJlbnQoey4uLnNvdXJjZXMsIGNoaWxkQWN0aW9uJDogY2hpbGRBY3Rpb25Qcm94eSR9KTtcbiAgICogY29uc3QgY2hpbGRBY3Rpb24kID0gcGFyZW50LnN0YXRlJC5tYXAocyA9PiBzLmNoaWxkLmFjdGlvbiQpLmZsYXR0ZW4oKTtcbiAgICogY2hpbGRBY3Rpb25Qcm94eSQuaW1pdGF0ZShjaGlsZEFjdGlvbiQpO1xuICAgKiBgYGBcbiAgICpcbiAgICogTm90ZSwgdGhvdWdoLCB0aGF0ICoqYGltaXRhdGUoKWAgZG9lcyBub3Qgc3VwcG9ydCBNZW1vcnlTdHJlYW1zKiouIElmIHdlXG4gICAqIHdvdWxkIGF0dGVtcHQgdG8gaW1pdGF0ZSBhIE1lbW9yeVN0cmVhbSBpbiBhIGNpcmN1bGFyIGRlcGVuZGVuY3ksIHdlIHdvdWxkXG4gICAqIGVpdGhlciBnZXQgYSByYWNlIGNvbmRpdGlvbiAod2hlcmUgdGhlIHN5bXB0b20gd291bGQgYmUgXCJub3RoaW5nIGhhcHBlbnNcIilcbiAgICogb3IgYW4gaW5maW5pdGUgY3ljbGljIGVtaXNzaW9uIG9mIHZhbHVlcy4gSXQncyB1c2VmdWwgdG8gdGhpbmsgYWJvdXRcbiAgICogTWVtb3J5U3RyZWFtcyBhcyBjZWxscyBpbiBhIHNwcmVhZHNoZWV0LiBJdCBkb2Vzbid0IG1ha2UgYW55IHNlbnNlIHRvXG4gICAqIGRlZmluZSBhIHNwcmVhZHNoZWV0IGNlbGwgYEExYCB3aXRoIGEgZm9ybXVsYSB0aGF0IGRlcGVuZHMgb24gYEIxYCBhbmRcbiAgICogY2VsbCBgQjFgIGRlZmluZWQgd2l0aCBhIGZvcm11bGEgdGhhdCBkZXBlbmRzIG9uIGBBMWAuXG4gICAqXG4gICAqIElmIHlvdSBmaW5kIHlvdXJzZWxmIHdhbnRpbmcgdG8gdXNlIGBpbWl0YXRlKClgIHdpdGggYVxuICAgKiBNZW1vcnlTdHJlYW0sIHlvdSBzaG91bGQgcmV3b3JrIHlvdXIgY29kZSBhcm91bmQgYGltaXRhdGUoKWAgdG8gdXNlIGFcbiAgICogU3RyZWFtIGluc3RlYWQuIExvb2sgZm9yIHRoZSBzdHJlYW0gaW4gdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kgdGhhdFxuICAgKiByZXByZXNlbnRzIGFuIGV2ZW50IHN0cmVhbSwgYW5kIHRoYXQgd291bGQgYmUgYSBjYW5kaWRhdGUgZm9yIGNyZWF0aW5nIGFcbiAgICogcHJveHkgU3RyZWFtIHdoaWNoIHRoZW4gaW1pdGF0ZXMgdGhlIHRhcmdldCBTdHJlYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyZWFtfSB0YXJnZXQgVGhlIG90aGVyIHN0cmVhbSB0byBpbWl0YXRlIG9uIHRoZSBjdXJyZW50IG9uZS4gTXVzdFxuICAgKiBub3QgYmUgYSBNZW1vcnlTdHJlYW0uXG4gICAqL1xuICBpbWl0YXRlKHRhcmdldDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE1lbW9yeVN0cmVhbSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignQSBNZW1vcnlTdHJlYW0gd2FzIGdpdmVuIHRvIGltaXRhdGUoKSwgYnV0IGl0IG9ubHkgJyArXG4gICAgICAnc3VwcG9ydHMgYSBTdHJlYW0uIFJlYWQgbW9yZSBhYm91dCB0aGlzIHJlc3RyaWN0aW9uIGhlcmU6ICcgK1xuICAgICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9zdGFsdHoveHN0cmVhbSNmYXEnKTtcbiAgICB0aGlzLl90YXJnZXQgPSB0YXJnZXQ7XG4gICAgZm9yIChsZXQgaWxzID0gdGhpcy5faWxzLCBOID0gaWxzLmxlbmd0aCwgaSA9IDA7IGkgPCBOOyBpKyspIHRhcmdldC5fYWRkKGlsc1tpXSk7XG4gICAgdGhpcy5faWxzID0gW107XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgZ2l2ZW4gdmFsdWUgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgXCJuZXh0XCIgdmFsdWUgeW91IHdhbnQgdG8gYnJvYWRjYXN0IHRvIGFsbCBsaXN0ZW5lcnMgb2ZcbiAgICogdGhpcyBTdHJlYW0uXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZE5leHQodmFsdWU6IFQpIHtcbiAgICB0aGlzLl9uKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiBlcnJvciB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGVycm9yIFRoZSBlcnJvciB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIHRoZSBsaXN0ZW5lcnMgb2ZcbiAgICogdGhpcyBTdHJlYW0uXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZEVycm9yKGVycm9yOiBhbnkpIHtcbiAgICB0aGlzLl9lKGVycm9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBcImNvbXBsZXRlZFwiIGV2ZW50IHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKi9cbiAgc2hhbWVmdWxseVNlbmRDb21wbGV0ZSgpIHtcbiAgICB0aGlzLl9jKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIFwiZGVidWdcIiBsaXN0ZW5lciB0byB0aGUgc3RyZWFtLiBUaGVyZSBjYW4gb25seSBiZSBvbmUgZGVidWdcbiAgICogbGlzdGVuZXIsIHRoYXQncyB3aHkgdGhpcyBpcyAnc2V0RGVidWdMaXN0ZW5lcicuIFRvIHJlbW92ZSB0aGUgZGVidWdcbiAgICogbGlzdGVuZXIsIGp1c3QgY2FsbCBzZXREZWJ1Z0xpc3RlbmVyKG51bGwpLlxuICAgKlxuICAgKiBBIGRlYnVnIGxpc3RlbmVyIGlzIGxpa2UgYW55IG90aGVyIGxpc3RlbmVyLiBUaGUgb25seSBkaWZmZXJlbmNlIGlzIHRoYXQgYVxuICAgKiBkZWJ1ZyBsaXN0ZW5lciBpcyBcInN0ZWFsdGh5XCI6IGl0cyBwcmVzZW5jZS9hYnNlbmNlIGRvZXMgbm90IHRyaWdnZXIgdGhlXG4gICAqIHN0YXJ0L3N0b3Agb2YgdGhlIHN0cmVhbSAob3IgdGhlIHByb2R1Y2VyIGluc2lkZSB0aGUgc3RyZWFtKS4gVGhpcyBpc1xuICAgKiB1c2VmdWwgc28geW91IGNhbiBpbnNwZWN0IHdoYXQgaXMgZ29pbmcgb24gd2l0aG91dCBjaGFuZ2luZyB0aGUgYmVoYXZpb3JcbiAgICogb2YgdGhlIHByb2dyYW0uIElmIHlvdSBoYXZlIGFuIGlkbGUgc3RyZWFtIGFuZCB5b3UgYWRkIGEgbm9ybWFsIGxpc3RlbmVyIHRvXG4gICAqIGl0LCB0aGUgc3RyZWFtIHdpbGwgc3RhcnQgZXhlY3V0aW5nLiBCdXQgaWYgeW91IHNldCBhIGRlYnVnIGxpc3RlbmVyIG9uIGFuXG4gICAqIGlkbGUgc3RyZWFtLCBpdCB3b24ndCBzdGFydCBleGVjdXRpbmcgKG5vdCB1bnRpbCB0aGUgZmlyc3Qgbm9ybWFsIGxpc3RlbmVyXG4gICAqIGlzIGFkZGVkKS5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCB3ZSBkb24ndCByZWNvbW1lbmQgdXNpbmcgdGhpcyBtZXRob2QgdG8gYnVpbGQgYXBwXG4gICAqIGxvZ2ljLiBJbiBmYWN0LCBpbiBtb3N0IGNhc2VzIHRoZSBkZWJ1ZyBvcGVyYXRvciB3b3JrcyBqdXN0IGZpbmUuIE9ubHkgdXNlXG4gICAqIHRoaXMgb25lIGlmIHlvdSBrbm93IHdoYXQgeW91J3JlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgKi9cbiAgc2V0RGVidWdMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgdGhpcy5fZCA9IGZhbHNlO1xuICAgICAgdGhpcy5fZGwgPSBOTyBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kID0gdHJ1ZTtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fbiA9IGxpc3RlbmVyLm5leHQgfHwgbm9vcDtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fZSA9IGxpc3RlbmVyLmVycm9yIHx8IG5vb3A7XG4gICAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2MgPSBsaXN0ZW5lci5jb21wbGV0ZSB8fCBub29wO1xuICAgICAgdGhpcy5fZGwgPSBsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RyZWFtPFQ+IGV4dGVuZHMgU3RyZWFtPFQ+IHtcbiAgcHJpdmF0ZSBfdjogVDtcbiAgcHJpdmF0ZSBfaGFzOiBib29sZWFuID0gZmFsc2U7XG4gIGNvbnN0cnVjdG9yKHByb2R1Y2VyOiBJbnRlcm5hbFByb2R1Y2VyPFQ+KSB7XG4gICAgc3VwZXIocHJvZHVjZXIpO1xuICB9XG5cbiAgX24oeDogVCkge1xuICAgIHRoaXMuX3YgPSB4O1xuICAgIHRoaXMuX2hhcyA9IHRydWU7XG4gICAgc3VwZXIuX24oeCk7XG4gIH1cblxuICBfYWRkKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9hZGQoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgYS5wdXNoKGlsKTtcbiAgICBpZiAoYS5sZW5ndGggPiAxKSB7XG4gICAgICBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3N0b3BJRCAhPT0gTk8pIHtcbiAgICAgIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpO1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3N0b3BJRCk7XG4gICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7IGVsc2Uge1xuICAgICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgICBpZiAocCAhPT0gTk8pIHAuX3N0YXJ0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF9zdG9wTm93KCkge1xuICAgIHRoaXMuX2hhcyA9IGZhbHNlO1xuICAgIHN1cGVyLl9zdG9wTm93KCk7XG4gIH1cblxuICBfeCgpOiB2b2lkIHtcbiAgICB0aGlzLl9oYXMgPSBmYWxzZTtcbiAgICBzdXBlci5feCgpO1xuICB9XG5cbiAgbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwKHByb2plY3QpIGFzIE1lbW9yeVN0cmVhbTxVPjtcbiAgfVxuXG4gIG1hcFRvPFU+KHByb2plY3RlZFZhbHVlOiBVKTogTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gc3VwZXIubWFwVG8ocHJvamVjdGVkVmFsdWUpIGFzIE1lbW9yeVN0cmVhbTxVPjtcbiAgfVxuXG4gIHRha2UoYW1vdW50OiBudW1iZXIpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci50YWtlKGFtb3VudCkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG5cbiAgZW5kV2hlbihvdGhlcjogU3RyZWFtPGFueT4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5lbmRXaGVuKG90aGVyKSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICByZXBsYWNlRXJyb3IocmVwbGFjZTogKGVycjogYW55KSA9PiBTdHJlYW08VD4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5yZXBsYWNlRXJyb3IocmVwbGFjZSkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG5cbiAgcmVtZW1iZXIoKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGRlYnVnKCk6IE1lbW9yeVN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogc3RyaW5nKTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiAodDogVCkgPT4gYW55KTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5Pzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpIHwgdW5kZWZpbmVkKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIuZGVidWcobGFiZWxPclNweSBhcyBhbnkpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxufVxuXG5leHBvcnQge05PLCBOT19JTH07XG5jb25zdCB4cyA9IFN0cmVhbTtcbnR5cGUgeHM8VD4gPSBTdHJlYW08VD47XG5leHBvcnQgZGVmYXVsdCB4cztcbiIsImltcG9ydCB4cyBmcm9tICd4c3RyZWFtJztcbmltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5JztcbmltcG9ydCB7ZGl2LCBtYWtlRE9NRHJpdmVyfSBmcm9tICdAY3ljbGUvZG9tJztcbmltcG9ydCB7cnVufSBmcm9tICdAY3ljbGUvcnVuJztcbmltcG9ydCB7cG93ZXJ1cH0gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uJztcbmltcG9ydCB7XG4gIG1ha2VUYWJsZXRGYWNlRHJpdmVyLFxuICBGYWNpYWxFeHByZXNzaW9uQWN0aW9uLFxuICBJc29sYXRlZFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24gYXMgVHdvU3BlZWNoYnViYmxlc0FjdGlvbixcbn0gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvc2NyZWVuJztcblxuXG5mdW5jdGlvbiBtYWluKHNvdXJjZXMpIHtcbiAgc291cmNlcy5wcm94aWVzID0geyAgLy8gd2lsbCBiZSBjb25uZWN0ZWQgdG8gXCJ0YXJnZXRzXCJcbiAgICBGYWNpYWxFeHByZXNzaW9uQWN0aW9uOiB4cy5jcmVhdGUoKSxcbiAgICBUd29TcGVlY2hidWJibGVzQWN0aW9uOiB4cy5jcmVhdGUoKSxcbiAgfTtcbiAgLy8gY3JlYXRlIGFjdGlvbiBjb21wb25lbnRzXG4gIHNvdXJjZXMuVHdvU3BlZWNoYnViYmxlc0FjdGlvbiA9IFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24oe1xuICAgIGdvYWw6IHNvdXJjZXMucHJveGllcy5Ud29TcGVlY2hidWJibGVzQWN0aW9uLFxuICAgIERPTTogc291cmNlcy5ET00sXG4gIH0pO1xuICBzb3VyY2VzLkZhY2lhbEV4cHJlc3Npb25BY3Rpb24gPSBGYWNpYWxFeHByZXNzaW9uQWN0aW9uKHtcbiAgICBnb2FsOiBzb3VyY2VzLnByb3hpZXMuRmFjaWFsRXhwcmVzc2lvbkFjdGlvbixcbiAgICBUYWJsZXRGYWNlOiBzb3VyY2VzLlRhYmxldEZhY2UsXG4gIH0pO1xuXG5cbiAgLy8gbWFpbiBsb2dpY1xuICBjb25zdCBzcGVlY2hidWJibGVzJCA9IHhzLm1lcmdlKFxuICAgIC8vIHhzLm9mKCdIZWxsbyB0aGVyZSEnKS5jb21wb3NlKGRlbGF5KDEwMDApKSxcbiAgICB4cy5vZih7XG4gICAgICBtZXNzYWdlOiAnSG93IGFyZSB5b3U/JyxcbiAgICAgIGNob2ljZXM6IFsnR29vZCcsICdCYWQnXVxuICAgIH0pLmNvbXBvc2UoZGVsYXkoMjAwKSksXG4gICAgeHMub2YobnVsbCkuY29tcG9zZShkZWxheSgxMDAwKSksXG4gICAgLy8gc291cmNlcy5Ud29TcGVlY2hidWJibGVzQWN0aW9uLnJlc3VsdFxuICAgIC8vICAgLmZpbHRlcihyZXN1bHQgPT4gISFyZXN1bHQucmVzdWx0KVxuICAgIC8vICAgLm1hcChyZXN1bHQgPT4ge1xuICAgIC8vICAgICBpZiAocmVzdWx0LnJlc3VsdCA9PT0gJ0dvb2QnKSB7XG4gICAgLy8gICAgICAgcmV0dXJuICdHcmVhdCEnO1xuICAgIC8vICAgICB9IGVsc2UgaWYgKHJlc3VsdC5yZXN1bHQgPT09ICdCYWQnKSB7XG4gICAgLy8gICAgICAgcmV0dXJuICdTb3JyeSB0byBoZWFyIHRoYXQuLi4nO1xuICAgIC8vICAgICB9XG4gICAgLy8gICB9KSxcbiAgKTtcblxuICBzb3VyY2VzLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24ucmVzdWx0LmFkZExpc3RlbmVyKHtcbiAgICBuZXh0OiB2YWx1ZSA9PiBjb25zb2xlLmxvZygncmVzdWx0JywgdmFsdWUpLFxuICB9KVxuICBcbiAgLy8gY29uc3QgZXhwcmVzc2lvbiQgPSBzb3VyY2VzLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24ucmVzdWx0Lm1hcCgocmVzdWx0KSA9PiB7XG4gIC8vICAgaWYgKHJlc3VsdC5yZXN1bHQgPT09ICdHb29kJykge1xuICAvLyAgICAgcmV0dXJuICdoYXBweSc7XG4gIC8vICAgfSBlbHNlIGlmIChyZXN1bHQucmVzdWx0ID09PSAnQmFkJykge1xuICAvLyAgICAgcmV0dXJuICdzYWQnO1xuICAvLyAgIH1cbiAgLy8gfSk7XG4gIGNvbnN0IGV4cHJlc3Npb24kID0geHMubmV2ZXIoKTtcblxuICBjb25zdCB2ZG9tJCA9IHhzLmNvbWJpbmUoXG4gICAgc291cmNlcy5Ud29TcGVlY2hidWJibGVzQWN0aW9uLkRPTSxcbiAgICBzb3VyY2VzLlRhYmxldEZhY2UuRE9NLFxuICApLm1hcCgoW3NwZWVjaGJ1YmJsZXMsIGZhY2VdKSA9PiBkaXYoW3NwZWVjaGJ1YmJsZXMsIGZhY2VdKSk7XG4gIFxuXG4gIHJldHVybiB7XG4gICAgRE9NOiB2ZG9tJCxcbiAgICBUYWJsZXRGYWNlOiBzb3VyY2VzLkZhY2lhbEV4cHJlc3Npb25BY3Rpb24ub3V0cHV0LFxuICAgIHRhcmdldHM6IHsgIC8vIHdpbGwgYmUgaW1pdGF0aW5nIFwicHJveGllc1wiXG4gICAgICBUd29TcGVlY2hidWJibGVzQWN0aW9uOiBzcGVlY2hidWJibGVzJCxcbiAgICAgIEZhY2lhbEV4cHJlc3Npb25BY3Rpb246IGV4cHJlc3Npb24kLFxuICAgIH0sXG4gIH1cbn1cblxucnVuKHBvd2VydXAobWFpbiwgKHByb3h5LCB0YXJnZXQpID0+IHByb3h5LmltaXRhdGUodGFyZ2V0KSksIHtcbiAgRE9NOiBtYWtlRE9NRHJpdmVyKCcjYXBwJyksXG4gIFRhYmxldEZhY2U6IG1ha2VUYWJsZXRGYWNlRHJpdmVyKCksXG59KTtcbiIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtXCIpKTtcbnZhciBkcm9wUmVwZWF0c18xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzXCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbmZ1bmN0aW9uIEZhY2lhbEV4cHJlc3Npb25BY3Rpb24oc291cmNlcykge1xuICAgIHZhciBnb2FsJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuZ29hbCkuZmlsdGVyKGZ1bmN0aW9uIChnb2FsKSB7IHJldHVybiB0eXBlb2YgZ29hbCAhPT0gJ3VuZGVmaW5lZCc7IH0pLm1hcChmdW5jdGlvbiAoZ29hbCkge1xuICAgICAgICBpZiAoZ29hbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnQ0FOQ0VMJyxcbiAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSAhIWdvYWwuZ29hbF9pZCA/IGdvYWwgOiBhY3Rpb25fMS5pbml0R29hbChnb2FsKTtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0dPQUwnLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB0eXBlb2YgdmFsdWUuZ29hbCA9PT0gJ3N0cmluZycgPyB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIGdvYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHZhbHVlLmdvYWwsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IDogdmFsdWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIGFjdGlvbiQgPSB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJCwgc291cmNlcy5UYWJsZXRGYWNlLmFuaW1hdGlvbkZpbmlzaC5tYXBUbyh7XG4gICAgICAgIHR5cGU6ICdFTkQnLFxuICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICB9KSk7XG4gICAgdmFyIGluaXRpYWxTdGF0ZSA9IHtcbiAgICAgICAgZ29hbDogbnVsbCxcbiAgICAgICAgZ29hbF9pZDogYWN0aW9uXzEuZ2VuZXJhdGVHb2FsSUQoKSxcbiAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVELFxuICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgfTtcbiAgICB2YXIgc3RhdGUkID0gYWN0aW9uJC5mb2xkKGZ1bmN0aW9uIChzdGF0ZSwgYWN0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoJ3N0YXRlJywgc3RhdGUsICdhY3Rpb24nLCBhY3Rpb24pO1xuICAgICAgICBpZiAoc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVEXG4gICAgICAgICAgICB8fCBzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURURcbiAgICAgICAgICAgIHx8IHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLkFCT1JURUQpIHtcbiAgICAgICAgICAgIGlmIChhY3Rpb24udHlwZSA9PT0gJ0dPQUwnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGdvYWwgPSBhY3Rpb24udmFsdWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogZ29hbC5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBnb2FsOiBnb2FsLmdvYWwsXG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLkFDVElWRSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChhY3Rpb24udHlwZSA9PT0gJ0NBTkNFTCcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKCdJZ25vcmUgQ0FOQ0VMIGluIERPTkUgc3RhdGVzJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLkFDVElWRSkge1xuICAgICAgICAgICAgaWYgKGFjdGlvbi50eXBlID09PSAnR09BTCcpIHtcbiAgICAgICAgICAgICAgICBzdGF0ZSQuc2hhbWVmdWxseVNlbmROZXh0KF9fYXNzaWduKHt9LCBzdGF0ZSwgeyBnb2FsOiBudWxsLCBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQgfSkpO1xuICAgICAgICAgICAgICAgIHZhciBnb2FsID0gYWN0aW9uLnZhbHVlO1xuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGdvYWwuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgZ29hbDogZ29hbC5nb2FsLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5BQ1RJVkUsXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYWN0aW9uLnR5cGUgPT09ICdFTkQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9fYXNzaWduKHt9LCBzdGF0ZSwgeyBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQsIHJlc3VsdDogYWN0aW9uLnZhbHVlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoYWN0aW9uLnR5cGUgPT09ICdDQU5DRUwnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIF9fYXNzaWduKHt9LCBzdGF0ZSwgeyBnb2FsOiBudWxsLCBzdGF0dXM6IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS53YXJuKFwiVW5oYW5kbGVkIHN0YXRlLnN0YXR1cyBcIiArIHN0YXRlLnN0YXR1cyArIFwiIGFjdGlvbi50eXBlIFwiICsgYWN0aW9uLnR5cGUpO1xuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfSwgaW5pdGlhbFN0YXRlKTtcbiAgICB2YXIgc3RhdGVTdGF0dXNDaGFuZ2VkJCA9IHN0YXRlJFxuICAgICAgICAuY29tcG9zZShkcm9wUmVwZWF0c18xLmRlZmF1bHQoZnVuY3Rpb24gKHgsIHkpIHsgcmV0dXJuICh4LnN0YXR1cyA9PT0geS5zdGF0dXMgJiYgYWN0aW9uXzEuaXNFcXVhbCh4LmdvYWxfaWQsIHkuZ29hbF9pZCkpOyB9KSk7XG4gICAgdmFyIHZhbHVlJCA9IHN0YXRlU3RhdHVzQ2hhbmdlZCRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLkFDVElWRSB8fCBzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5QUkVFTVBURUQ7XG4gICAgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgaWYgKHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLkFDVElWRSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnRVhQUkVTUycsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHN0YXRlLmdvYWwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgeyAvLyBzdGF0ZS5zdGF0dXMgPT09IFN0YXR1cy5QUkVFTVBURURcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgdmFyIHN0YXR1cyQgPSBzdGF0ZVN0YXR1c0NoYW5nZWQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiAoe1xuICAgICAgICBnb2FsX2lkOiBzdGF0ZS5nb2FsX2lkLFxuICAgICAgICBzdGF0dXM6IHN0YXRlLnN0YXR1cyxcbiAgICB9KTsgfSk7XG4gICAgdmFyIHJlc3VsdCQgPSBzdGF0ZVN0YXR1c0NoYW5nZWQkXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiAoc3RhdGUuc3RhdHVzID09PSBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVEXG4gICAgICAgIHx8IHN0YXRlLnN0YXR1cyA9PT0gYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRFxuICAgICAgICB8fCBzdGF0ZS5zdGF0dXMgPT09IGFjdGlvbl8xLlN0YXR1cy5BQk9SVEVEKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuICh7XG4gICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgZ29hbF9pZDogc3RhdGUuZ29hbF9pZCxcbiAgICAgICAgICAgIHN0YXR1czogc3RhdGUuc3RhdHVzLFxuICAgICAgICB9LFxuICAgICAgICByZXN1bHQ6IHN0YXRlLnJlc3VsdCxcbiAgICB9KTsgfSk7XG4gICAgLy8gSU1QT1JUQU5UISEgZW1wdHkgdGhlIHN0cmVhbXMgbWFudWFsbHk7IG90aGVyd2lzZSBpdCBlbWl0cyB0aGUgZmlyc3RcbiAgICAvLyAgIFwiU1VDQ0VFREVEXCIgcmVzdWx0XG4gICAgdmFsdWUkLmFkZExpc3RlbmVyKHsgbmV4dDogZnVuY3Rpb24gKCkgeyB9IH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIG91dHB1dDogYWRhcHRfMS5hZGFwdCh2YWx1ZSQpLFxuICAgICAgICBzdGF0dXM6IGFkYXB0XzEuYWRhcHQoc3RhdHVzJCksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChyZXN1bHQkKSxcbiAgICB9O1xufVxuZXhwb3J0cy5GYWNpYWxFeHByZXNzaW9uQWN0aW9uID0gRmFjaWFsRXhwcmVzc2lvbkFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUZhY2lhbEV4cHJlc3Npb25BY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtXCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGlzb2xhdGVfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiQGN5Y2xlL2lzb2xhdGVcIikpO1xudmFyIGRvbV8xID0gcmVxdWlyZShcIkBjeWNsZS9kb21cIik7XG52YXIgYWN0aW9uXzEgPSByZXF1aXJlKFwiQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uXCIpO1xudmFyIFN0YXRlO1xuKGZ1bmN0aW9uIChTdGF0ZSkge1xuICAgIFN0YXRlW1wiUlVOTklOR1wiXSA9IFwiUlVOTklOR1wiO1xuICAgIFN0YXRlW1wiRE9ORVwiXSA9IFwiRE9ORVwiO1xufSkoU3RhdGUgfHwgKFN0YXRlID0ge30pKTtcbnZhciBJbnB1dFR5cGU7XG4oZnVuY3Rpb24gKElucHV0VHlwZSkge1xuICAgIElucHV0VHlwZVtcIkdPQUxcIl0gPSBcIkdPQUxcIjtcbiAgICBJbnB1dFR5cGVbXCJDQU5DRUxcIl0gPSBcIkNBTkNFTFwiO1xuICAgIElucHV0VHlwZVtcIkNMSUNLXCJdID0gXCJDTElDS1wiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xudmFyIFNwZWVjaGJ1YmJsZVR5cGU7XG4oZnVuY3Rpb24gKFNwZWVjaGJ1YmJsZVR5cGUpIHtcbiAgICBTcGVlY2hidWJibGVUeXBlW1wiTUVTU0FHRVwiXSA9IFwiTUVTU0FHRVwiO1xuICAgIFNwZWVjaGJ1YmJsZVR5cGVbXCJDSE9JQ0VcIl0gPSBcIkNIT0lDRVwiO1xufSkoU3BlZWNoYnViYmxlVHlwZSA9IGV4cG9ydHMuU3BlZWNoYnViYmxlVHlwZSB8fCAoZXhwb3J0cy5TcGVlY2hidWJibGVUeXBlID0ge30pKTtcbmZ1bmN0aW9uIGlucHV0KGdvYWwkLCBjbGlja0V2ZW50JCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShnb2FsJC5maWx0ZXIoZnVuY3Rpb24gKGdvYWwpIHsgcmV0dXJuIHR5cGVvZiBnb2FsICE9PSAndW5kZWZpbmVkJzsgfSkubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIGlmIChnb2FsID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5DQU5DRUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gISFnb2FsLmdvYWxfaWQgPyBnb2FsIDogYWN0aW9uXzEuaW5pdEdvYWwoZ29hbCk7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHR5cGU6IElucHV0VHlwZS5HT0FMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiB0eXBlb2YgdmFsdWUuZ29hbCA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogeyB0eXBlOiBTcGVlY2hidWJibGVUeXBlLk1FU1NBR0UsIHZhbHVlOiB2YWx1ZS5nb2FsIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiBBcnJheS5pc0FycmF5KHZhbHVlLmdvYWwpXG4gICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IHsgdHlwZTogU3BlZWNoYnViYmxlVHlwZS5DSE9JQ0UsIHZhbHVlOiB2YWx1ZS5nb2FsIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiB2YWx1ZS5nb2FsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pLCBjbGlja0V2ZW50JC5tYXAoZnVuY3Rpb24gKGV2ZW50KSB7IHJldHVybiAoe1xuICAgICAgICB0eXBlOiBJbnB1dFR5cGUuQ0xJQ0ssXG4gICAgICAgIHZhbHVlOiBldmVudC50YXJnZXQudGV4dENvbnRlbnRcbiAgICB9KTsgfSkpO1xufVxuZnVuY3Rpb24gY3JlYXRlVHJhbnNpdGlvbigpIHtcbiAgICB2YXIgdHJhbnNpdGlvblRhYmxlID0gKF9hID0ge30sXG4gICAgICAgIF9hW1N0YXRlLkRPTkVdID0gKF9iID0ge30sXG4gICAgICAgICAgICBfYltJbnB1dFR5cGUuR09BTF0gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7IHJldHVybiAoe1xuICAgICAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5SVU5OSU5HLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBpbnB1dFZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgRE9NOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudHlwZSA9PT0gU3BlZWNoYnViYmxlVHlwZS5NRVNTQUdFXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBkb21fMS5zcGFuKGlucHV0VmFsdWUuZ29hbC52YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IGlucHV0VmFsdWUuZ29hbC50eXBlID09PSBTcGVlY2hidWJibGVUeXBlLkNIT0lDRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGRvbV8xLnNwYW4oaW5wdXRWYWx1ZS5nb2FsLnZhbHVlLm1hcChmdW5jdGlvbiAodGV4dCkgeyByZXR1cm4gZG9tXzEuYnV0dG9uKCcuY2hvaWNlJywgdGV4dCk7IH0pKSA6ICcnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pOyB9LFxuICAgICAgICAgICAgX2IpLFxuICAgICAgICBfYVtTdGF0ZS5SVU5OSU5HXSA9IChfYyA9IHt9LFxuICAgICAgICAgICAgX2NbSW5wdXRUeXBlLkdPQUxdID0gZnVuY3Rpb24gKHZhcmlhYmxlcywgaW5wdXRWYWx1ZSkgeyByZXR1cm4gKHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuUlVOTklORyxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogaW5wdXRWYWx1ZS5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIERPTToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuTUVTU0FHRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gZG9tXzEuc3BhbihpbnB1dFZhbHVlLmdvYWwudmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBpbnB1dFZhbHVlLmdvYWwudHlwZSA9PT0gU3BlZWNoYnViYmxlVHlwZS5DSE9JQ0VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBkb21fMS5zcGFuKGlucHV0VmFsdWUuZ29hbC52YWx1ZS5tYXAoZnVuY3Rpb24gKHRleHQpIHsgcmV0dXJuIGRvbV8xLmJ1dHRvbignLmNob2ljZScsIHRleHQpOyB9KSkgOiAnJ1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7IH0sXG4gICAgICAgICAgICBfY1tJbnB1dFR5cGUuQ0FOQ0VMXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHsgcmV0dXJuICh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGdvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIERPTToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogJycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTsgfSxcbiAgICAgICAgICAgIF9jW0lucHV0VHlwZS5DTElDS10gPSBmdW5jdGlvbiAodmFyaWFibGVzLCBpbnB1dFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhcmlhYmxlcy5nb2FsLnR5cGUgPT09IFNwZWVjaGJ1YmJsZVR5cGUuQ0hPSUNFXG4gICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBET006IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiB2YXJpYWJsZXMuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXR1czogYWN0aW9uXzEuU3RhdHVzLlNVQ0NFRURFRCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBpbnB1dFZhbHVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0gOiBudWxsO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF9jKSxcbiAgICAgICAgX2EpO1xuICAgIHJldHVybiBmdW5jdGlvbiAoc3RhdGUsIHZhcmlhYmxlcywgaW5wdXQpIHtcbiAgICAgICAgcmV0dXJuICF0cmFuc2l0aW9uVGFibGVbc3RhdGVdXG4gICAgICAgICAgICA/IHN0YXRlXG4gICAgICAgICAgICA6ICF0cmFuc2l0aW9uVGFibGVbc3RhdGVdW2lucHV0LnR5cGVdXG4gICAgICAgICAgICAgICAgPyBzdGF0ZVxuICAgICAgICAgICAgICAgIDogdHJhbnNpdGlvblRhYmxlW3N0YXRlXVtpbnB1dC50eXBlXSh2YXJpYWJsZXMsIGlucHV0LnZhbHVlKTtcbiAgICB9O1xuICAgIHZhciBfYSwgX2IsIF9jO1xufVxuZnVuY3Rpb24gdHJhbnNpdGlvblJlZHVjZXIoaW5wdXQkKSB7XG4gICAgdmFyIGluaXRSZWR1Y2VyJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGZ1bmN0aW9uIGluaXRSZWR1Y2VyKG1hY2hpbmUpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXRlOiBTdGF0ZS5ET05FLFxuICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogbnVsbCxcbiAgICAgICAgICAgICAgICBnb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICB2YXIgdHJhbnNpdGlvbiA9IGNyZWF0ZVRyYW5zaXRpb24oKTtcbiAgICB2YXIgaW5wdXRSZWR1Y2VyJCA9IGlucHV0JFxuICAgICAgICAubWFwKGZ1bmN0aW9uIChpbnB1dCkgeyByZXR1cm4gZnVuY3Rpb24gaW5wdXRSZWR1Y2VyKG1hY2hpbmUpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24obWFjaGluZS5zdGF0ZSwgbWFjaGluZS52YXJpYWJsZXMsIGlucHV0KTtcbiAgICB9OyB9KTtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoaW5pdFJlZHVjZXIkLCBpbnB1dFJlZHVjZXIkKTtcbn1cbmZ1bmN0aW9uIG91dHB1dChtYWNoaW5lJCkge1xuICAgIHZhciBvdXRwdXRzJCA9IG1hY2hpbmUkXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG1hY2hpbmUpIHsgcmV0dXJuICEhbWFjaGluZS5vdXRwdXRzOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChtYWNoaW5lKSB7IHJldHVybiBtYWNoaW5lLm91dHB1dHM7IH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIERPTTogYWRhcHRfMS5hZGFwdChvdXRwdXRzJFxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzLkRPTTsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIG91dHB1dHMuRE9NLmdvYWw7IH0pLnN0YXJ0V2l0aCgnJykpLFxuICAgICAgICByZXN1bHQ6IGFkYXB0XzEuYWRhcHQob3V0cHV0cyRcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuICEhb3V0cHV0cy5yZXN1bHQ7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiBvdXRwdXRzLnJlc3VsdDsgfSkpLFxuICAgIH07XG59XG4vKipcbiAqIFNwZWVjaGJ1YmJsZSBhY3Rpb24gY29tcG9uZW50LlxuICpcbiAqIEBwYXJhbSBzb3VyY2VzXG4gKlxuICogICAqIGdvYWw6IGEgc3RyZWFtIG9mIGBudWxsYCAoYXMgXCJjYW5jZWxcIiksIGB7dHlwZTogJ01FU1NBR0UnLCB2YWx1ZTogJ0hlbGxvIHdvcmxkJ31gIGZvciBkaXNwbGF5aW5nIG1lc3NhZ2Ugb3IgYHt0eXBlOiAnTUVTU0FHRScsIHZhbHVlOiBbJ0hlbGxvJywgJ1dvcmxkJ119YCBmb3IgZGlzcGxheWluZyBjaG9pY2VzLlxuICogICAqIERPTTogQ3ljbGUuanMgW0RPTVNvdXJjZV0oaHR0cHM6Ly9jeWNsZS5qcy5vcmcvYXBpL2RvbS5odG1sKS5cbiAqXG4gKiBAcmV0dXJuIHNpbmtzXG4gKlxuICogICAqIERPTTogYSBzdHJlYW0gb2YgdmlydHVhbCBET00gb2JqZWN0cywgaS5lLCBbU25hYmJkb20g4oCcVk5vZGXigJ0gb2JqZWN0c10oaHR0cHM6Ly9naXRodWIuY29tL3NuYWJiZG9tL3NuYWJiZG9tKS5cbiAqICAgKiByZXN1bHQ6IGEgc3RyZWFtIG9mIGFjdGlvbiByZXN1bHRzLlxuICpcbiAqL1xuZnVuY3Rpb24gU3BlZWNoYnViYmxlQWN0aW9uKHNvdXJjZXMpIHtcbiAgICB2YXIgaW5wdXQkID0gaW5wdXQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5nb2FsKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5ET00uc2VsZWN0KCcuY2hvaWNlJykuZWxlbWVudHMoKVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChiKSB7IHJldHVybiBzb3VyY2VzLkRPTS5zZWxlY3QoJy5jaG9pY2UnKS5ldmVudHMoJ2NsaWNrJywge1xuICAgICAgICBwcmV2ZW50RGVmYXVsdDogdHJ1ZVxuICAgIH0pOyB9KVxuICAgICAgICAuZmxhdHRlbigpKSk7XG4gICAgdmFyIG1hY2hpbmUkID0gdHJhbnNpdGlvblJlZHVjZXIoaW5wdXQkKVxuICAgICAgICAuZm9sZChmdW5jdGlvbiAoc3RhdGUsIHJlZHVjZXIpIHsgcmV0dXJuIHJlZHVjZXIoc3RhdGUpOyB9LCBudWxsKVxuICAgICAgICAuZHJvcCgxKTsgLy8gZHJvcCBcIm51bGxcIjtcbiAgICB2YXIgc2lua3MgPSBvdXRwdXQobWFjaGluZSQpO1xuICAgIHJldHVybiBzaW5rcztcbn1cbmV4cG9ydHMuU3BlZWNoYnViYmxlQWN0aW9uID0gU3BlZWNoYnViYmxlQWN0aW9uO1xuZnVuY3Rpb24gSXNvbGF0ZWRTcGVlY2hidWJibGVBY3Rpb24oc291cmNlcykge1xuICAgIHJldHVybiBpc29sYXRlXzEuZGVmYXVsdChTcGVlY2hidWJibGVBY3Rpb24pKHNvdXJjZXMpO1xufVxuZXhwb3J0cy5Jc29sYXRlZFNwZWVjaGJ1YmJsZUFjdGlvbiA9IElzb2xhdGVkU3BlZWNoYnViYmxlQWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3BlZWNoYnViYmxlQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbVwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBpc29sYXRlXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIkBjeWNsZS9pc29sYXRlXCIpKTtcbnZhciBkb21fMSA9IHJlcXVpcmUoXCJAY3ljbGUvZG9tXCIpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciBTcGVlY2hidWJibGVBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1NwZWVjaGJ1YmJsZUFjdGlvblwiKTtcbnZhciBTdGF0ZTtcbihmdW5jdGlvbiAoU3RhdGUpIHtcbiAgICBTdGF0ZVtcIlJVTk5JTkdcIl0gPSBcIlJVTk5JTkdcIjtcbiAgICBTdGF0ZVtcIkRPTkVcIl0gPSBcIkRPTkVcIjtcbiAgICBTdGF0ZVtcIlBSRUVNUFRJTkdcIl0gPSBcIlBSRUVNUFRJTkdcIjtcbn0pKFN0YXRlIHx8IChTdGF0ZSA9IHt9KSk7XG52YXIgSW5wdXRUeXBlO1xuKGZ1bmN0aW9uIChJbnB1dFR5cGUpIHtcbiAgICBJbnB1dFR5cGVbXCJHT0FMXCJdID0gXCJHT0FMXCI7XG4gICAgSW5wdXRUeXBlW1wiQ0FOQ0VMXCJdID0gXCJDQU5DRUxcIjtcbiAgICBJbnB1dFR5cGVbXCJTQl9SRVNVTFRcIl0gPSBcIlNCX1JFU1VMVFwiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xudmFyIFR3b1NwZWVjaGJ1YmJsZXNUeXBlO1xuKGZ1bmN0aW9uIChUd29TcGVlY2hidWJibGVzVHlwZSkge1xuICAgIFR3b1NwZWVjaGJ1YmJsZXNUeXBlW1wiU0VUX01FU1NBR0VcIl0gPSBcIlNFVF9NRVNTQUdFXCI7XG4gICAgVHdvU3BlZWNoYnViYmxlc1R5cGVbXCJBU0tfUVVFU1RJT05cIl0gPSBcIkFTS19RVUVTVElPTlwiO1xufSkoVHdvU3BlZWNoYnViYmxlc1R5cGUgPSBleHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlIHx8IChleHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlID0ge30pKTtcbmZ1bmN0aW9uIGlucHV0KGdvYWwkLCByb2JvdFNwZWVjaGJ1YmJsZVJlc3VsdCwgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQpIHtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoZ29hbCQuZmlsdGVyKGZ1bmN0aW9uIChnb2FsKSB7IHJldHVybiB0eXBlb2YgZ29hbCAhPT0gJ3VuZGVmaW5lZCc7IH0pLm1hcChmdW5jdGlvbiAoZ29hbCkge1xuICAgICAgICBpZiAoZ29hbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBJbnB1dFR5cGUuQ0FOQ0VMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9ICEhZ29hbC5nb2FsX2lkID8gZ29hbCA6IGFjdGlvbl8xLmluaXRHb2FsKGdvYWwpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBJbnB1dFR5cGUuR09BTCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogIXZhbHVlLmdvYWwudHlwZSA/IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgZ29hbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZW9mIHZhbHVlLmdvYWwgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBUd29TcGVlY2hidWJibGVzVHlwZS5TRVRfTUVTU0FHRVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogVHdvU3BlZWNoYnViYmxlc1R5cGUuQVNLX1FVRVNUSU9OLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLmdvYWwsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IDogdmFsdWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSksIHJvYm90U3BlZWNoYnViYmxlUmVzdWx0Lm1hcChmdW5jdGlvbiAocmVzdWx0KSB7IHJldHVybiAoe1xuICAgICAgICB0eXBlOiBJbnB1dFR5cGUuU0JfUkVTVUxULFxuICAgICAgICB2YWx1ZTogcmVzdWx0LFxuICAgIH0pOyB9KSwgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQubWFwKGZ1bmN0aW9uIChyZXN1bHQpIHsgcmV0dXJuICh7XG4gICAgICAgIHR5cGU6IElucHV0VHlwZS5TQl9SRVNVTFQsXG4gICAgICAgIHZhbHVlOiByZXN1bHQsXG4gICAgfSk7IH0pKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRyYW5zaXRpb24oKSB7XG4gICAgdmFyIHRyYW5zaXRpb25UYWJsZSA9IChfYSA9IHt9LFxuICAgICAgICBfYVtTdGF0ZS5ET05FXSA9IChfYiA9IHt9LFxuICAgICAgICAgICAgX2JbSW5wdXRUeXBlLkdPQUxdID0gZnVuY3Rpb24gKHZhcmlhYmxlcywgaW5wdXRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFXG4gICAgICAgICAgICAgICAgICAgIHx8IGlucHV0VmFsdWUuZ29hbC50eXBlID09PSBUd29TcGVlY2hidWJibGVzVHlwZS5BU0tfUVVFU1RJT04pID8ge1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuUlVOTklORyxcbiAgICAgICAgICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBpbnB1dFZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBudW1BY3Rpb25zOiBpbnB1dFZhbHVlLmdvYWwudHlwZSA9PT0gVHdvU3BlZWNoYnViYmxlc1R5cGUuU0VUX01FU1NBR0VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IDEgOiAyLFxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgb3V0cHV0czogaW5wdXRWYWx1ZS5nb2FsLnR5cGUgPT09IFR3b1NwZWVjaGJ1YmJsZXNUeXBlLlNFVF9NRVNTQUdFXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBSb2JvdFNwZWVjaGJ1YmJsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBpbnB1dFZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IGlucHV0VmFsdWUuZ29hbC52YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9IDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgUm9ib3RTcGVlY2hidWJibGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBpbnB1dFZhbHVlLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbDogaW5wdXRWYWx1ZS5nb2FsLnZhbHVlLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBIdW1hblNwZWVjaGJ1YmJsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGlucHV0VmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnb2FsOiBpbnB1dFZhbHVlLmdvYWwudmFsdWUuY2hvaWNlc1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9IDogbnVsbDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBfYiksXG4gICAgICAgIF9hW1N0YXRlLlJVTk5JTkddID0gKF9jID0ge30sXG4gICAgICAgICAgICBfY1tJbnB1dFR5cGUuQ0FOQ0VMXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHsgcmV0dXJuICh7XG4gICAgICAgICAgICAgICAgc3RhdGU6IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiB2YXJpYWJsZXMsXG4gICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICBSb2JvdFNwZWVjaGJ1YmJsZTogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgSHVtYW5TcGVlY2hidWJibGU6IG51bGwsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7IH0sXG4gICAgICAgICAgICBfY1tJbnB1dFR5cGUuU0JfUkVTVUxUXSA9IGZ1bmN0aW9uICh2YXJpYWJsZXMsIGlucHV0VmFsdWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWN0aW9uXzEuaXNFcXVhbChpbnB1dFZhbHVlLnN0YXR1cy5nb2FsX2lkLCB2YXJpYWJsZXMuZ29hbF9pZClcbiAgICAgICAgICAgICAgICAgICAgPyAodmFyaWFibGVzLm51bUFjdGlvbnMgPT09IDEpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuRE9ORSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtQWN0aW9uczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IHZhcmlhYmxlcy5yZXN1bHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZTogU3RhdGUuUlVOTklORyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdvYWxfaWQ6IHZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bUFjdGlvbnM6IHZhcmlhYmxlcy5udW1BY3Rpb25zIC0gMSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IGlucHV0VmFsdWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogdmFyaWFibGVzLm5ld0dvYWwsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJvYm90U3BlZWNoYnViYmxlOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICA6IG51bGw7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgX2MpLFxuICAgICAgICBfYSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzdGF0ZSwgdmFyaWFibGVzLCBpbnB1dCkge1xuICAgICAgICB2YXIgcHJldiA9IHsgc3RhdGU6IHN0YXRlLCB2YXJpYWJsZXM6IHZhcmlhYmxlcywgb3V0cHV0czogbnVsbCB9O1xuICAgICAgICByZXR1cm4gIXRyYW5zaXRpb25UYWJsZVtzdGF0ZV1cbiAgICAgICAgICAgID8gcHJldlxuICAgICAgICAgICAgOiAhdHJhbnNpdGlvblRhYmxlW3N0YXRlXVtpbnB1dC50eXBlXVxuICAgICAgICAgICAgICAgID8gcHJldlxuICAgICAgICAgICAgICAgIDogKHRyYW5zaXRpb25UYWJsZVtzdGF0ZV1baW5wdXQudHlwZV0odmFyaWFibGVzLCBpbnB1dC52YWx1ZSkgfHwgcHJldik7XG4gICAgfTtcbiAgICB2YXIgX2EsIF9iLCBfYztcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JCkge1xuICAgIHZhciBpbml0UmVkdWNlciQgPSB4c3RyZWFtXzEuZGVmYXVsdC5vZihmdW5jdGlvbiBpbml0UmVkdWNlcihtYWNoaW5lKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0ZTogU3RhdGUuRE9ORSxcbiAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgIGdvYWxfaWQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbnVtQWN0aW9uczogMCxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciB0cmFuc2l0aW9uID0gY3JlYXRlVHJhbnNpdGlvbigpO1xuICAgIHZhciBpbnB1dFJlZHVjZXIkID0gaW5wdXQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiBpbnB1dFJlZHVjZXIobWFjaGluZSkge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihtYWNoaW5lLnN0YXRlLCBtYWNoaW5lLnZhcmlhYmxlcywgaW5wdXQpO1xuICAgIH07IH0pO1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbml0UmVkdWNlciQsIGlucHV0UmVkdWNlciQpO1xufVxuZnVuY3Rpb24gb3V0cHV0KG1hY2hpbmUkKSB7XG4gICAgdmFyIG91dHB1dHMkID0gbWFjaGluZSRcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAobWFjaGluZSkgeyByZXR1cm4gISFtYWNoaW5lLm91dHB1dHM7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKG1hY2hpbmUpIHsgcmV0dXJuIG1hY2hpbmUub3V0cHV0czsgfSkuZGVidWcoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN1bHQ6IGFkYXB0XzEuYWRhcHQob3V0cHV0cyRcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuICEhb3V0cHV0cy5yZXN1bHQ7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiBvdXRwdXRzLnJlc3VsdDsgfSkuZGVidWcoKSksXG4gICAgICAgIFJvYm90U3BlZWNoYnViYmxlOiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChvdXRwdXRzKSB7IHJldHVybiB0eXBlb2YgKG91dHB1dHMuUm9ib3RTcGVlY2hidWJibGUpICE9PSAndW5kZWZpbmVkJzsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIG91dHB1dHMuUm9ib3RTcGVlY2hidWJibGU7IH0pKSxcbiAgICAgICAgSHVtYW5TcGVlY2hidWJibGU6IGFkYXB0XzEuYWRhcHQob3V0cHV0cyRcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIHR5cGVvZiAob3V0cHV0cy5IdW1hblNwZWVjaGJ1YmJsZSkgIT09ICd1bmRlZmluZWQnOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5IdW1hblNwZWVjaGJ1YmJsZTsgfSkpLFxuICAgIH07XG59XG5mdW5jdGlvbiBUd29TcGVlY2hidWJibGVzQWN0aW9uKHNvdXJjZXMpIHtcbiAgICAvLyBjcmVhdGUgcHJveGllc1xuICAgIHZhciByb2JvdFNwZWVjaGJ1YmJsZVJlc3VsdCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSgpO1xuICAgIHZhciBodW1hblNwZWVjaGJ1YmJsZVJlc3VsdCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSgpO1xuICAgIHZhciBpbnB1dCQgPSBpbnB1dCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLmdvYWwpLCByb2JvdFNwZWVjaGJ1YmJsZVJlc3VsdCwgaHVtYW5TcGVlY2hidWJibGVSZXN1bHQpO1xuICAgIHZhciBtYWNoaW5lJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSkuZGVidWcoKTsgLy8gZHJvcCBcIm51bGxcIjtcbiAgICB2YXIgX2EgPSBvdXRwdXQobWFjaGluZSQpLCByZXN1bHQgPSBfYS5yZXN1bHQsIFJvYm90U3BlZWNoYnViYmxlID0gX2EuUm9ib3RTcGVlY2hidWJibGUsIEh1bWFuU3BlZWNoYnViYmxlID0gX2EuSHVtYW5TcGVlY2hidWJibGU7XG4gICAgLy8gY3JlYXRlIHN1Yi1jb21wb25lbnRzXG4gICAgdmFyIHJvYm90U3BlZWNoYnViYmxlID0gU3BlZWNoYnViYmxlQWN0aW9uXzEuSXNvbGF0ZWRTcGVlY2hidWJibGVBY3Rpb24oe1xuICAgICAgICBnb2FsOiBSb2JvdFNwZWVjaGJ1YmJsZSxcbiAgICAgICAgRE9NOiBzb3VyY2VzLkRPTSxcbiAgICB9KTtcbiAgICB2YXIgaHVtYW5TcGVlY2hidWJibGUgPSBTcGVlY2hidWJibGVBY3Rpb25fMS5Jc29sYXRlZFNwZWVjaGJ1YmJsZUFjdGlvbih7XG4gICAgICAgIGdvYWw6IEh1bWFuU3BlZWNoYnViYmxlLFxuICAgICAgICBET006IHNvdXJjZXMuRE9NLFxuICAgIH0pO1xuICAgIC8vIGNvbm5lY3QgcHJveGllc1xuICAgIHJvYm90U3BlZWNoYnViYmxlUmVzdWx0LmltaXRhdGUocm9ib3RTcGVlY2hidWJibGUucmVzdWx0KTtcbiAgICBodW1hblNwZWVjaGJ1YmJsZVJlc3VsdC5pbWl0YXRlKGh1bWFuU3BlZWNoYnViYmxlLnJlc3VsdCk7XG4gICAgdmFyIHZkb20kID0geHN0cmVhbV8xLmRlZmF1bHQuY29tYmluZShyb2JvdFNwZWVjaGJ1YmJsZS5ET00sIGh1bWFuU3BlZWNoYnViYmxlLkRPTSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgdmFyIHJvYm90VlRyZWUgPSBfYVswXSwgaHVtYW5WVHJlZSA9IF9hWzFdO1xuICAgICAgICByZXR1cm4gZG9tXzEuZGl2KFtcbiAgICAgICAgICAgIGRvbV8xLmRpdihbZG9tXzEuc3BhbignUm9ib3Q6JyksIGRvbV8xLnNwYW4ocm9ib3RWVHJlZSldKSxcbiAgICAgICAgICAgIGRvbV8xLmRpdihbZG9tXzEuc3BhbignSHVtYW46JyksIGRvbV8xLnNwYW4oaHVtYW5WVHJlZSldKSxcbiAgICAgICAgXSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgRE9NOiB2ZG9tJCxcbiAgICAgICAgcmVzdWx0OiByZXN1bHQsXG4gICAgfTtcbn1cbmV4cG9ydHMuVHdvU3BlZWNoYnViYmxlc0FjdGlvbiA9IFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb247XG5mdW5jdGlvbiBJc29sYXRlZFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb24oc291cmNlcykge1xuICAgIHJldHVybiBpc29sYXRlXzEuZGVmYXVsdChUd29TcGVlY2hidWJibGVzQWN0aW9uKShzb3VyY2VzKTtcbn1cbmV4cG9ydHMuSXNvbGF0ZWRUd29TcGVlY2hidWJibGVzQWN0aW9uID0gSXNvbGF0ZWRUd29TcGVlY2hidWJibGVzQWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9VHdvU3BlZWNoYnViYmxlc0FjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0YWJsZXRfZmFjZV8xID0gcmVxdWlyZShcIi4vdGFibGV0X2ZhY2VcIik7XG5leHBvcnRzLkV4cHJlc3NDb21tYW5kVHlwZSA9IHRhYmxldF9mYWNlXzEuRXhwcmVzc0NvbW1hbmRUeXBlO1xuZXhwb3J0cy5tYWtlVGFibGV0RmFjZURyaXZlciA9IHRhYmxldF9mYWNlXzEubWFrZVRhYmxldEZhY2VEcml2ZXI7XG52YXIgRmFjaWFsRXhwcmVzc2lvbkFjdGlvbl8xID0gcmVxdWlyZShcIi4vRmFjaWFsRXhwcmVzc2lvbkFjdGlvblwiKTtcbmV4cG9ydHMuRmFjaWFsRXhwcmVzc2lvbkFjdGlvbiA9IEZhY2lhbEV4cHJlc3Npb25BY3Rpb25fMS5GYWNpYWxFeHByZXNzaW9uQWN0aW9uO1xudmFyIFNwZWVjaGJ1YmJsZUFjdGlvbl8xID0gcmVxdWlyZShcIi4vU3BlZWNoYnViYmxlQWN0aW9uXCIpO1xuZXhwb3J0cy5TcGVlY2hidWJibGVUeXBlID0gU3BlZWNoYnViYmxlQWN0aW9uXzEuU3BlZWNoYnViYmxlVHlwZTtcbmV4cG9ydHMuU3BlZWNoYnViYmxlQWN0aW9uID0gU3BlZWNoYnViYmxlQWN0aW9uXzEuU3BlZWNoYnViYmxlQWN0aW9uO1xuZXhwb3J0cy5Jc29sYXRlZFNwZWVjaGJ1YmJsZUFjdGlvbiA9IFNwZWVjaGJ1YmJsZUFjdGlvbl8xLklzb2xhdGVkU3BlZWNoYnViYmxlQWN0aW9uO1xudmFyIFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb25fMSA9IHJlcXVpcmUoXCIuL1R3b1NwZWVjaGJ1YmJsZXNBY3Rpb25cIik7XG5leHBvcnRzLlR3b1NwZWVjaGJ1YmJsZXNUeXBlID0gVHdvU3BlZWNoYnViYmxlc0FjdGlvbl8xLlR3b1NwZWVjaGJ1YmJsZXNUeXBlO1xuZXhwb3J0cy5Ud29TcGVlY2hidWJibGVzQWN0aW9uID0gVHdvU3BlZWNoYnViYmxlc0FjdGlvbl8xLlR3b1NwZWVjaGJ1YmJsZXNBY3Rpb247XG5leHBvcnRzLklzb2xhdGVkVHdvU3BlZWNoYnViYmxlc0FjdGlvbiA9IFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb25fMS5Jc29sYXRlZFR3b1NwZWVjaGJ1YmJsZXNBY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBzbmFiYmRvbV9wcmFnbWFfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwic25hYmJkb20tcHJhZ21hXCIpKTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG4vLyBhZGFwdGVkIGZyb21cbi8vICAgaHR0cHM6Ly9naXRodWIuY29tL21qeWMvdGFibGV0LXJvYm90LWZhY2UvYmxvYi83MDliNzMxZGZmMDQwMzNjMDhjZjA0NWFkYzRlMDM4ZWVmYTc1MGEyL2luZGV4LmpzI0wzLUwxODRcbnZhciBFeWVDb250cm9sbGVyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEV5ZUNvbnRyb2xsZXIoZWxlbWVudHMsIGV5ZVNpemUpIHtcbiAgICAgICAgaWYgKGVsZW1lbnRzID09PSB2b2lkIDApIHsgZWxlbWVudHMgPSB7fTsgfVxuICAgICAgICBpZiAoZXllU2l6ZSA9PT0gdm9pZCAwKSB7IGV5ZVNpemUgPSAnMzMuMzN2aCc7IH1cbiAgICAgICAgdGhpcy5fZXllU2l6ZSA9IGV5ZVNpemU7XG4gICAgICAgIHRoaXMuX2JsaW5rVGltZW91dElEID0gbnVsbDtcbiAgICAgICAgdGhpcy5zZXRFbGVtZW50cyhlbGVtZW50cyk7XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFeWVDb250cm9sbGVyLnByb3RvdHlwZSwgXCJsZWZ0RXllXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7IHJldHVybiB0aGlzLl9sZWZ0RXllOyB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXllQ29udHJvbGxlci5wcm90b3R5cGUsIFwicmlnaHRFeWVcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuX3JpZ2h0RXllOyB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBFeWVDb250cm9sbGVyLnByb3RvdHlwZS5zZXRFbGVtZW50cyA9IGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgbGVmdEV5ZSA9IF9hLmxlZnRFeWUsIHJpZ2h0RXllID0gX2EucmlnaHRFeWUsIHVwcGVyTGVmdEV5ZWxpZCA9IF9hLnVwcGVyTGVmdEV5ZWxpZCwgdXBwZXJSaWdodEV5ZWxpZCA9IF9hLnVwcGVyUmlnaHRFeWVsaWQsIGxvd2VyTGVmdEV5ZWxpZCA9IF9hLmxvd2VyTGVmdEV5ZWxpZCwgbG93ZXJSaWdodEV5ZWxpZCA9IF9hLmxvd2VyUmlnaHRFeWVsaWQ7XG4gICAgICAgIHRoaXMuX2xlZnRFeWUgPSBsZWZ0RXllO1xuICAgICAgICB0aGlzLl9yaWdodEV5ZSA9IHJpZ2h0RXllO1xuICAgICAgICB0aGlzLl91cHBlckxlZnRFeWVsaWQgPSB1cHBlckxlZnRFeWVsaWQ7XG4gICAgICAgIHRoaXMuX3VwcGVyUmlnaHRFeWVsaWQgPSB1cHBlclJpZ2h0RXllbGlkO1xuICAgICAgICB0aGlzLl9sb3dlckxlZnRFeWVsaWQgPSBsb3dlckxlZnRFeWVsaWQ7XG4gICAgICAgIHRoaXMuX2xvd2VyUmlnaHRFeWVsaWQgPSBsb3dlclJpZ2h0RXllbGlkO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLl9jcmVhdGVLZXlmcmFtZXMgPSBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgdmFyIF9iID0gX2EudGd0VHJhbllWYWwsIHRndFRyYW5ZVmFsID0gX2IgPT09IHZvaWQgMCA/ICcwcHgnIDogX2IsIF9jID0gX2EudGd0Um90VmFsLCB0Z3RSb3RWYWwgPSBfYyA9PT0gdm9pZCAwID8gJzBkZWcnIDogX2MsIF9kID0gX2EuZW50ZXJlZE9mZnNldCwgZW50ZXJlZE9mZnNldCA9IF9kID09PSB2b2lkIDAgPyAwIDogX2QsIF9lID0gX2EuZXhpdGluZ09mZnNldCwgZXhpdGluZ09mZnNldCA9IF9lID09PSB2b2lkIDAgPyAwIDogX2U7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IHRyYW5zZm9ybTogXCJ0cmFuc2xhdGVZKDBweCkgcm90YXRlKDBkZWcpXCIsIG9mZnNldDogMC4wIH0sXG4gICAgICAgICAgICB7IHRyYW5zZm9ybTogXCJ0cmFuc2xhdGVZKFwiICsgdGd0VHJhbllWYWwgKyBcIikgcm90YXRlKFwiICsgdGd0Um90VmFsICsgXCIpXCIsIG9mZnNldDogZW50ZXJlZE9mZnNldCB9LFxuICAgICAgICAgICAgeyB0cmFuc2Zvcm06IFwidHJhbnNsYXRlWShcIiArIHRndFRyYW5ZVmFsICsgXCIpIHJvdGF0ZShcIiArIHRndFJvdFZhbCArIFwiKVwiLCBvZmZzZXQ6IGV4aXRpbmdPZmZzZXQgfSxcbiAgICAgICAgICAgIHsgdHJhbnNmb3JtOiBcInRyYW5zbGF0ZVkoMHB4KSByb3RhdGUoMGRlZylcIiwgb2Zmc2V0OiAxLjAgfSxcbiAgICAgICAgXTtcbiAgICB9O1xuICAgIEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLmV4cHJlc3MgPSBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgdmFyIF9iID0gX2EudHlwZSwgdHlwZSA9IF9iID09PSB2b2lkIDAgPyAnJyA6IF9iLCBcbiAgICAgICAgLy8gbGV2ZWwgPSAzLCAgLy8gMTogbWluLCA1OiBtYXhcbiAgICAgICAgX2MgPSBfYS5kdXJhdGlvbiwgXG4gICAgICAgIC8vIGxldmVsID0gMywgIC8vIDE6IG1pbiwgNTogbWF4XG4gICAgICAgIGR1cmF0aW9uID0gX2MgPT09IHZvaWQgMCA/IDEwMDAgOiBfYywgX2QgPSBfYS5lbnRlckR1cmF0aW9uLCBlbnRlckR1cmF0aW9uID0gX2QgPT09IHZvaWQgMCA/IDc1IDogX2QsIF9lID0gX2EuZXhpdER1cmF0aW9uLCBleGl0RHVyYXRpb24gPSBfZSA9PT0gdm9pZCAwID8gNzUgOiBfZTtcbiAgICAgICAgaWYgKCF0aGlzLl9sZWZ0RXllKSB7IC8vIGFzc3VtZXMgYWxsIGVsZW1lbnRzIGFyZSBhbHdheXMgc2V0IHRvZ2V0aGVyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ0V5ZSBlbGVtZW50cyBhcmUgbm90IHNldDsgcmV0dXJuOycpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgICAgZHVyYXRpb246IGR1cmF0aW9uLFxuICAgICAgICB9O1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2hhcHB5JzpcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBsb3dlckxlZnRFeWVsaWQ6IHRoaXMuX2xvd2VyTGVmdEV5ZWxpZC5hbmltYXRlKHRoaXMuX2NyZWF0ZUtleWZyYW1lcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RUcmFuWVZhbDogXCJjYWxjKFwiICsgdGhpcy5fZXllU2l6ZSArIFwiICogLTIgLyAzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGd0Um90VmFsOiBcIjMwZGVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICBsb3dlclJpZ2h0RXllbGlkOiB0aGlzLl9sb3dlclJpZ2h0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAtMiAvIDMpXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB0Z3RSb3RWYWw6IFwiLTMwZGVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjYXNlICdzYWQnOlxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHVwcGVyTGVmdEV5ZWxpZDogdGhpcy5fdXBwZXJMZWZ0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAxIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFJvdFZhbDogXCItMjBkZWdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgICAgIHVwcGVyUmlnaHRFeWVsaWQ6IHRoaXMuX3VwcGVyUmlnaHRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIDEgLyAzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGd0Um90VmFsOiBcIjIwZGVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICBjYXNlICdhbmdyeSc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgdXBwZXJMZWZ0RXllbGlkOiB0aGlzLl91cHBlckxlZnRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIDEgLyA0KVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGd0Um90VmFsOiBcIjMwZGVnXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBlbnRlcmVkT2Zmc2V0OiBlbnRlckR1cmF0aW9uIC8gZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0aW5nT2Zmc2V0OiAxIC0gKGV4aXREdXJhdGlvbiAvIGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICAgICAgfSksIG9wdGlvbnMpLFxuICAgICAgICAgICAgICAgICAgICB1cHBlclJpZ2h0RXllbGlkOiB0aGlzLl91cHBlclJpZ2h0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAxIC8gNClcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFJvdFZhbDogXCItMzBkZWdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNhc2UgJ2ZvY3VzZWQnOlxuICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgIHVwcGVyTGVmdEV5ZWxpZDogdGhpcy5fdXBwZXJMZWZ0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAxIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgICAgIHVwcGVyUmlnaHRFeWVsaWQ6IHRoaXMuX3VwcGVyUmlnaHRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIDEgLyAzKVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgZW50ZXJlZE9mZnNldDogZW50ZXJEdXJhdGlvbiAvIGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdGluZ09mZnNldDogMSAtIChleGl0RHVyYXRpb24gLyBkdXJhdGlvbiksXG4gICAgICAgICAgICAgICAgICAgIH0pLCBvcHRpb25zKSxcbiAgICAgICAgICAgICAgICAgICAgbG93ZXJMZWZ0RXllbGlkOiB0aGlzLl9sb3dlckxlZnRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIC0xIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgICAgIGxvd2VyUmlnaHRFeWVsaWQ6IHRoaXMuX2xvd2VyUmlnaHRFeWVsaWQuYW5pbWF0ZSh0aGlzLl9jcmVhdGVLZXlmcmFtZXMoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdGd0VHJhbllWYWw6IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAqIC0xIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGNhc2UgJ2NvbmZ1c2VkJzpcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICB1cHBlclJpZ2h0RXllbGlkOiB0aGlzLl91cHBlclJpZ2h0RXllbGlkLmFuaW1hdGUodGhpcy5fY3JlYXRlS2V5ZnJhbWVzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFRyYW5ZVmFsOiBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgKiAxIC8gMylcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHRndFJvdFZhbDogXCItMTBkZWdcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGVudGVyZWRPZmZzZXQ6IGVudGVyRHVyYXRpb24gLyBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXRpbmdPZmZzZXQ6IDEgLSAoZXhpdER1cmF0aW9uIC8gZHVyYXRpb24pLFxuICAgICAgICAgICAgICAgICAgICB9KSwgb3B0aW9ucyksXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiSW52YWxpZCBpbnB1dCB0eXBlPVwiICsgdHlwZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLmJsaW5rID0gZnVuY3Rpb24gKF9hKSB7XG4gICAgICAgIHZhciBfYiA9IChfYSA9PT0gdm9pZCAwID8ge30gOiBfYSkuZHVyYXRpb24sIGR1cmF0aW9uID0gX2IgPT09IHZvaWQgMCA/IDE1MCA6IF9iO1xuICAgICAgICBpZiAoIXRoaXMuX2xlZnRFeWUpIHsgLy8gYXNzdW1lcyBhbGwgZWxlbWVudHMgYXJlIGFsd2F5cyBzZXQgdG9nZXRoZXJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignRXllIGVsZW1lbnRzIGFyZSBub3Qgc2V0OyByZXR1cm47Jyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgW3RoaXMuX2xlZnRFeWUsIHRoaXMuX3JpZ2h0RXllXS5tYXAoZnVuY3Rpb24gKGV5ZSkge1xuICAgICAgICAgICAgZXllLmFuaW1hdGUoW1xuICAgICAgICAgICAgICAgIHsgdHJhbnNmb3JtOiAncm90YXRlWCgwZGVnKScgfSxcbiAgICAgICAgICAgICAgICB7IHRyYW5zZm9ybTogJ3JvdGF0ZVgoOTBkZWcpJyB9LFxuICAgICAgICAgICAgICAgIHsgdHJhbnNmb3JtOiAncm90YXRlWCgwZGVnKScgfSxcbiAgICAgICAgICAgIF0sIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgaXRlcmF0aW9uczogMSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLnN0YXJ0QmxpbmtpbmcgPSBmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIF9iID0gKF9hID09PSB2b2lkIDAgPyB7fSA6IF9hKS5tYXhJbnRlcnZhbCwgbWF4SW50ZXJ2YWwgPSBfYiA9PT0gdm9pZCAwID8gNTAwMCA6IF9iO1xuICAgICAgICBpZiAodGhpcy5fYmxpbmtUaW1lb3V0SUQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihcIkFscmVhZHkgYmxpbmtpbmcgd2l0aCB0aW1lb3V0SUQ9XCIgKyB0aGlzLl9ibGlua1RpbWVvdXRJRCArIFwiOyByZXR1cm47XCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBibGlua1JhbmRvbWx5ID0gZnVuY3Rpb24gKHRpbWVvdXQpIHtcbiAgICAgICAgICAgIF90aGlzLl9ibGlua1RpbWVvdXRJRCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIF90aGlzLmJsaW5rKCk7XG4gICAgICAgICAgICAgICAgYmxpbmtSYW5kb21seShNYXRoLnJhbmRvbSgpICogbWF4SW50ZXJ2YWwpO1xuICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgIH07XG4gICAgICAgIGJsaW5rUmFuZG9tbHkoTWF0aC5yYW5kb20oKSAqIG1heEludGVydmFsKTtcbiAgICB9O1xuICAgIEV5ZUNvbnRyb2xsZXIucHJvdG90eXBlLnN0b3BCbGlua2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX2JsaW5rVGltZW91dElEKTtcbiAgICAgICAgdGhpcy5fYmxpbmtUaW1lb3V0SUQgPSBudWxsO1xuICAgIH07XG4gICAgRXllQ29udHJvbGxlci5wcm90b3R5cGUuc2V0RXllUG9zaXRpb24gPSBmdW5jdGlvbiAoZXllRWxlbSwgeCwgeSwgaXNSaWdodCkge1xuICAgICAgICBpZiAoaXNSaWdodCA9PT0gdm9pZCAwKSB7IGlzUmlnaHQgPSBmYWxzZTsgfVxuICAgICAgICBpZiAoIWV5ZUVsZW0pIHsgLy8gYXNzdW1lcyBhbGwgZWxlbWVudHMgYXJlIGFsd2F5cyBzZXQgdG9nZXRoZXJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignSW52YWxpZCBpbnB1dHMgJywgZXllRWxlbSwgeCwgeSwgJzsgcmV0dW5pbmcnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWlzTmFOKHgpKSB7XG4gICAgICAgICAgICBpZiAoIWlzUmlnaHQpIHtcbiAgICAgICAgICAgICAgICBleWVFbGVtLnN0eWxlLmxlZnQgPSBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgLyAzICogMiAqIFwiICsgeCArIFwiKVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZXllRWxlbS5zdHlsZS5yaWdodCA9IFwiY2FsYyhcIiArIHRoaXMuX2V5ZVNpemUgKyBcIiAvIDMgKiAyICogXCIgKyAoMSAtIHgpICsgXCIpXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFpc05hTih5KSkge1xuICAgICAgICAgICAgZXllRWxlbS5zdHlsZS5ib3R0b20gPSBcImNhbGMoXCIgKyB0aGlzLl9leWVTaXplICsgXCIgLyAzICogMiAqIFwiICsgKDEgLSB5KSArIFwiKVwiO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gRXllQ29udHJvbGxlcjtcbn0oKSk7XG52YXIgQ29tbWFuZFR5cGU7XG4oZnVuY3Rpb24gKENvbW1hbmRUeXBlKSB7XG4gICAgQ29tbWFuZFR5cGVbXCJFWFBSRVNTXCJdID0gXCJFWFBSRVNTXCI7XG4gICAgQ29tbWFuZFR5cGVbXCJTVEFSVF9CTElOS0lOR1wiXSA9IFwiU1RBUlRfQkxJTktJTkdcIjtcbiAgICBDb21tYW5kVHlwZVtcIlNUT1BfQkxJTktJTkdcIl0gPSBcIlNUT1BfQkxJTktJTkdcIjtcbiAgICBDb21tYW5kVHlwZVtcIlNFVF9TVEFURVwiXSA9IFwiU0VUX1NUQVRFXCI7XG4gICAgQ29tbWFuZFR5cGVbXCJTUEVFQ0hCVUJCTEVTXCJdID0gXCJTUEVFQ0hCVUJCTEVTXCI7XG59KShDb21tYW5kVHlwZSB8fCAoQ29tbWFuZFR5cGUgPSB7fSkpO1xudmFyIEV4cHJlc3NDb21tYW5kVHlwZTtcbihmdW5jdGlvbiAoRXhwcmVzc0NvbW1hbmRUeXBlKSB7XG4gICAgRXhwcmVzc0NvbW1hbmRUeXBlW1wiSEFQUFlcIl0gPSBcImhhcHB5XCI7XG4gICAgRXhwcmVzc0NvbW1hbmRUeXBlW1wiU0FEXCJdID0gXCJzYWRcIjtcbiAgICBFeHByZXNzQ29tbWFuZFR5cGVbXCJBTkdSWVwiXSA9IFwiYW5ncnlcIjtcbiAgICBFeHByZXNzQ29tbWFuZFR5cGVbXCJGT0NVU0VEXCJdID0gXCJmb2N1c2VkXCI7XG4gICAgRXhwcmVzc0NvbW1hbmRUeXBlW1wiQ09ORlVTRURcIl0gPSBcImNvbmZ1c2VkXCI7XG59KShFeHByZXNzQ29tbWFuZFR5cGUgPSBleHBvcnRzLkV4cHJlc3NDb21tYW5kVHlwZSB8fCAoZXhwb3J0cy5FeHByZXNzQ29tbWFuZFR5cGUgPSB7fSkpO1xuZnVuY3Rpb24gbWFrZVRhYmxldEZhY2VEcml2ZXIoX2EpIHtcbiAgICB2YXIgX2IgPSAoX2EgPT09IHZvaWQgMCA/IHsgc3R5bGVzOiB7fSB9IDogX2EpLnN0eWxlcywgX2MgPSBfYi5mYWNlQ29sb3IsIGZhY2VDb2xvciA9IF9jID09PSB2b2lkIDAgPyAnd2hpdGVzbW9rZScgOiBfYywgX2QgPSBfYi5mYWNlSGVpZ2h0LCBmYWNlSGVpZ2h0ID0gX2QgPT09IHZvaWQgMCA/ICcxMDB2aCcgOiBfZCwgX2UgPSBfYi5mYWNlV2lkdGgsIGZhY2VXaWR0aCA9IF9lID09PSB2b2lkIDAgPyAnMTAwdncnIDogX2UsIF9mID0gX2IuZXllQ29sb3IsIGV5ZUNvbG9yID0gX2YgPT09IHZvaWQgMCA/ICdibGFjaycgOiBfZiwgX2cgPSBfYi5leWVTaXplLCBleWVTaXplID0gX2cgPT09IHZvaWQgMCA/ICczMy4zM3ZoJyA6IF9nLCBfaCA9IF9iLmV5ZWxpZENvbG9yLCBleWVsaWRDb2xvciA9IF9oID09PSB2b2lkIDAgPyAnd2hpdGVzbW9rZScgOiBfaDtcbiAgICB2YXIgc3R5bGVzID0ge1xuICAgICAgICBmYWNlOiB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGZhY2VDb2xvcixcbiAgICAgICAgICAgIGhlaWdodDogZmFjZUhlaWdodCxcbiAgICAgICAgICAgIHdpZHRoOiBmYWNlV2lkdGgsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcbiAgICAgICAgfSxcbiAgICAgICAgZXllOiB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGV5ZUNvbG9yLFxuICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnMTAwJScsXG4gICAgICAgICAgICBoZWlnaHQ6IGV5ZVNpemUsXG4gICAgICAgICAgICB3aWR0aDogZXllU2l6ZSxcbiAgICAgICAgICAgIGJvdHRvbTogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiIC8gMylcIixcbiAgICAgICAgICAgIHpJbmRleDogMSxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYWJzb2x1dGUnLFxuICAgICAgICB9LFxuICAgICAgICBsZWZ0OiB7XG4gICAgICAgICAgICBsZWZ0OiBcImNhbGMoXCIgKyBleWVTaXplICsgXCIgLyAzKVwiLFxuICAgICAgICB9LFxuICAgICAgICByaWdodDoge1xuICAgICAgICAgICAgcmlnaHQ6IFwiY2FsYyhcIiArIGV5ZVNpemUgKyBcIiAvIDMpXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGV5ZWxpZDoge1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBleWVsaWRDb2xvcixcbiAgICAgICAgICAgIGhlaWdodDogZXllU2l6ZSxcbiAgICAgICAgICAgIHdpZHRoOiBcImNhbGMoXCIgKyBleWVTaXplICsgXCIgKiAxLjc1KVwiLFxuICAgICAgICAgICAgekluZGV4OiAyLFxuICAgICAgICAgICAgcG9zaXRpb246ICdhYnNvbHV0ZScsXG4gICAgICAgIH0sXG4gICAgICAgIHVwcGVyOiB7XG4gICAgICAgICAgICBib3R0b206IFwiY2FsYyhcIiArIGV5ZVNpemUgKyBcIiAqIDEpXCIsXG4gICAgICAgICAgICBsZWZ0OiBcImNhbGMoXCIgKyBleWVTaXplICsgXCIgKiAtMC4zNzUpXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGxvd2VyOiB7XG4gICAgICAgICAgICBib3JkZXJSYWRpdXM6ICcxMDAlJyxcbiAgICAgICAgICAgIGJvdHRvbTogXCJjYWxjKFwiICsgZXllU2l6ZSArIFwiICogLTEpXCIsXG4gICAgICAgICAgICBsZWZ0OiBcImNhbGMoXCIgKyBleWVTaXplICsgXCIgKiAtMC4zNzUpXCIsXG4gICAgICAgIH0sXG4gICAgfTtcbiAgICB2YXIgZXllcyA9IG5ldyBFeWVDb250cm9sbGVyKCk7XG4gICAgdmFyIGlkID0gXCJmYWNlLVwiICsgU3RyaW5nKE1hdGgucmFuZG9tKCkpLnN1YnN0cigyKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKGNvbW1hbmQkKSB7XG4gICAgICAgIHZhciBsb2FkJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSgpO1xuICAgICAgICB2YXIgaW50ZXJ2YWxJRCA9IHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIiNcIiArIGlkKSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJXYWl0aW5nIGZvciAjXCIgKyBpZCArIFwiIHRvIGFwcGVhci4uLlwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsSUQpO1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiI1wiICsgaWQpO1xuICAgICAgICAgICAgZXllcy5zZXRFbGVtZW50cyh7XG4gICAgICAgICAgICAgICAgbGVmdEV5ZTogZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcubGVmdC5leWUnKSxcbiAgICAgICAgICAgICAgICByaWdodEV5ZTogZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcucmlnaHQuZXllJyksXG4gICAgICAgICAgICAgICAgdXBwZXJMZWZ0RXllbGlkOiBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5sZWZ0IC5leWVsaWQudXBwZXInKSxcbiAgICAgICAgICAgICAgICB1cHBlclJpZ2h0RXllbGlkOiBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yaWdodCAuZXllbGlkLnVwcGVyJyksXG4gICAgICAgICAgICAgICAgbG93ZXJMZWZ0RXllbGlkOiBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5sZWZ0IC5leWVsaWQubG93ZXInKSxcbiAgICAgICAgICAgICAgICBsb3dlclJpZ2h0RXllbGlkOiBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5yaWdodCAuZXllbGlkLmxvd2VyJyksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxvYWQkLnNoYW1lZnVsbHlTZW5kTmV4dCh0cnVlKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIHZhciBhbmltYXRpb25zID0ge307XG4gICAgICAgIHZhciBhbmltYXRpb25GaW5pc2gkJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSgpO1xuICAgICAgICB2YXIgc3BlZWNoYnViYmxlc0RPTSQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoY29tbWFuZCQpLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFjb21tYW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKGFuaW1hdGlvbnMpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25zW2tleV0uY2FuY2VsKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHN3aXRjaCAoY29tbWFuZC50eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQ29tbWFuZFR5cGUuRVhQUkVTUzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGlvbnMgPSBleWVzLmV4cHJlc3MoY29tbWFuZC52YWx1ZSkgfHwge307XG4gICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25GaW5pc2gkJC5zaGFtZWZ1bGx5U2VuZE5leHQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbVByb21pc2UoUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoYW5pbWF0aW9ucykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbmltYXRpb25zW2tleV0ub25maW5pc2ggPSByZXNvbHZlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDb21tYW5kVHlwZS5TVEFSVF9CTElOS0lORzpcbiAgICAgICAgICAgICAgICAgICAgICAgIGV5ZXMuc3RhcnRCbGlua2luZyhjb21tYW5kLnZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICBjYXNlIENvbW1hbmRUeXBlLlNUT1BfQkxJTktJTkc6XG4gICAgICAgICAgICAgICAgICAgICAgICBleWVzLnN0b3BCbGlua2luZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgQ29tbWFuZFR5cGUuU0VUX1NUQVRFOlxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gY29tbWFuZC52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsZWZ0UG9zID0gdmFsdWUgJiYgdmFsdWUubGVmdEV5ZSB8fCB7IHg6IG51bGwsIHk6IG51bGwgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByaWdodFBvcyA9IHZhbHVlICYmIHZhbHVlLnJpZ2h0RXllIHx8IHsgeDogbnVsbCwgeTogbnVsbCB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgZXllcy5zZXRFeWVQb3NpdGlvbihleWVzLmxlZnRFeWUsIGxlZnRQb3MueCwgbGVmdFBvcy55KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV5ZXMuc2V0RXllUG9zaXRpb24oZXllcy5yaWdodEV5ZSwgcmlnaHRQb3MueCwgcmlnaHRQb3MueSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBDb21tYW5kVHlwZS5TUEVFQ0hCVUJCTEVTOlxuICAgICAgICAgICAgICAgICAgICAgICAgc3BlZWNoYnViYmxlc0RPTSQuc2hhbWVmdWxseVNlbmROZXh0KGNvbW1hbmQudmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHZub2RlJCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm9mKHNuYWJiZG9tX3ByYWdtYV8xLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJmYWNlXCIsIHN0eWxlOiBzdHlsZXMuZmFjZSwgaWQ6IGlkIH0sXG4gICAgICAgICAgICBzbmFiYmRvbV9wcmFnbWFfMS5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwiZXllIGxlZnRcIiwgc3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlcy5leWUsIHN0eWxlcy5sZWZ0KSB9LFxuICAgICAgICAgICAgICAgIHNuYWJiZG9tX3ByYWdtYV8xLmRlZmF1bHQuY3JlYXRlRWxlbWVudChcImRpdlwiLCB7IGNsYXNzTmFtZTogXCJleWVsaWQgdXBwZXJcIiwgc3R5bGU6IE9iamVjdC5hc3NpZ24oe30sIHN0eWxlcy5leWVsaWQsIHN0eWxlcy51cHBlcikgfSksXG4gICAgICAgICAgICAgICAgc25hYmJkb21fcHJhZ21hXzEuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImV5ZWxpZCBsb3dlclwiLCBzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgc3R5bGVzLmV5ZWxpZCwgc3R5bGVzLmxvd2VyKSB9KSksXG4gICAgICAgICAgICBzbmFiYmRvbV9wcmFnbWFfMS5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwiZXllIHJpZ2h0XCIsIHN0eWxlOiBPYmplY3QuYXNzaWduKHt9LCBzdHlsZXMuZXllLCBzdHlsZXMucmlnaHQpIH0sXG4gICAgICAgICAgICAgICAgc25hYmJkb21fcHJhZ21hXzEuZGVmYXVsdC5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHsgY2xhc3NOYW1lOiBcImV5ZWxpZCB1cHBlclwiLCBzdHlsZTogT2JqZWN0LmFzc2lnbih7fSwgc3R5bGVzLmV5ZWxpZCwgc3R5bGVzLnVwcGVyKSB9KSxcbiAgICAgICAgICAgICAgICBzbmFiYmRvbV9wcmFnbWFfMS5kZWZhdWx0LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgeyBjbGFzc05hbWU6IFwiZXllbGlkIGxvd2VyXCIsIHN0eWxlOiBPYmplY3QuYXNzaWduKHt9LCBzdHlsZXMuZXllbGlkLCBzdHlsZXMubG93ZXIpIH0pKSkpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgRE9NOiBhZGFwdF8xLmFkYXB0KHZub2RlJCksXG4gICAgICAgICAgICBhbmltYXRpb25GaW5pc2g6IGFkYXB0XzEuYWRhcHQoYW5pbWF0aW9uRmluaXNoJCQuZmxhdHRlbigpKSxcbiAgICAgICAgICAgIGxvYWQ6IGFkYXB0XzEuYWRhcHQobG9hZCQpLFxuICAgICAgICB9O1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VUYWJsZXRGYWNlRHJpdmVyID0gbWFrZVRhYmxldEZhY2VEcml2ZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10YWJsZXRfZmFjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xuZnVuY3Rpb24gY2hlY2tJc29sYXRlQXJncyhkYXRhZmxvd0NvbXBvbmVudCwgc2NvcGUpIHtcbiAgICBpZiAodHlwZW9mIGRhdGFmbG93Q29tcG9uZW50ICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRmlyc3QgYXJndW1lbnQgZ2l2ZW4gdG8gaXNvbGF0ZSgpIG11c3QgYmUgYSBcIiArXG4gICAgICAgICAgICBcIidkYXRhZmxvd0NvbXBvbmVudCcgZnVuY3Rpb25cIik7XG4gICAgfVxuICAgIGlmIChzY29wZSA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gaXNvbGF0ZSgpIG11c3Qgbm90IGJlIG51bGxcIik7XG4gICAgfVxufVxuZnVuY3Rpb24gbm9ybWFsaXplU2NvcGVzKHNvdXJjZXMsIHNjb3BlcywgcmFuZG9tU2NvcGUpIHtcbiAgICB2YXIgcGVyQ2hhbm5lbCA9IHt9O1xuICAgIE9iamVjdC5rZXlzKHNvdXJjZXMpLmZvckVhY2goZnVuY3Rpb24gKGNoYW5uZWwpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzY29wZXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gc2NvcGVzO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjYW5kaWRhdGUgPSBzY29wZXNbY2hhbm5lbF07XG4gICAgICAgIGlmICh0eXBlb2YgY2FuZGlkYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IGNhbmRpZGF0ZTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgd2lsZGNhcmQgPSBzY29wZXNbJyonXTtcbiAgICAgICAgaWYgKHR5cGVvZiB3aWxkY2FyZCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSB3aWxkY2FyZDtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gcmFuZG9tU2NvcGU7XG4gICAgfSk7XG4gICAgcmV0dXJuIHBlckNoYW5uZWw7XG59XG5mdW5jdGlvbiBpc29sYXRlQWxsU291cmNlcyhvdXRlclNvdXJjZXMsIHNjb3Blcykge1xuICAgIHZhciBpbm5lclNvdXJjZXMgPSB7fTtcbiAgICBmb3IgKHZhciBjaGFubmVsIGluIG91dGVyU291cmNlcykge1xuICAgICAgICB2YXIgb3V0ZXJTb3VyY2UgPSBvdXRlclNvdXJjZXNbY2hhbm5lbF07XG4gICAgICAgIGlmIChvdXRlclNvdXJjZXMuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkgJiZcbiAgICAgICAgICAgIG91dGVyU291cmNlICYmXG4gICAgICAgICAgICBzY29wZXNbY2hhbm5lbF0gIT09IG51bGwgJiZcbiAgICAgICAgICAgIHR5cGVvZiBvdXRlclNvdXJjZS5pc29sYXRlU291cmNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBpbm5lclNvdXJjZXNbY2hhbm5lbF0gPSBvdXRlclNvdXJjZS5pc29sYXRlU291cmNlKG91dGVyU291cmNlLCBzY29wZXNbY2hhbm5lbF0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG91dGVyU291cmNlcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSkge1xuICAgICAgICAgICAgaW5uZXJTb3VyY2VzW2NoYW5uZWxdID0gb3V0ZXJTb3VyY2VzW2NoYW5uZWxdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBpbm5lclNvdXJjZXM7XG59XG5mdW5jdGlvbiBpc29sYXRlQWxsU2lua3Moc291cmNlcywgaW5uZXJTaW5rcywgc2NvcGVzKSB7XG4gICAgdmFyIG91dGVyU2lua3MgPSB7fTtcbiAgICBmb3IgKHZhciBjaGFubmVsIGluIGlubmVyU2lua3MpIHtcbiAgICAgICAgdmFyIHNvdXJjZSA9IHNvdXJjZXNbY2hhbm5lbF07XG4gICAgICAgIHZhciBpbm5lclNpbmsgPSBpbm5lclNpbmtzW2NoYW5uZWxdO1xuICAgICAgICBpZiAoaW5uZXJTaW5rcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSAmJlxuICAgICAgICAgICAgc291cmNlICYmXG4gICAgICAgICAgICBzY29wZXNbY2hhbm5lbF0gIT09IG51bGwgJiZcbiAgICAgICAgICAgIHR5cGVvZiBzb3VyY2UuaXNvbGF0ZVNpbmsgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIG91dGVyU2lua3NbY2hhbm5lbF0gPSBhZGFwdF8xLmFkYXB0KHNvdXJjZS5pc29sYXRlU2luayh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShpbm5lclNpbmspLCBzY29wZXNbY2hhbm5lbF0pKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpbm5lclNpbmtzLmhhc093blByb3BlcnR5KGNoYW5uZWwpKSB7XG4gICAgICAgICAgICBvdXRlclNpbmtzW2NoYW5uZWxdID0gaW5uZXJTaW5rc1tjaGFubmVsXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0ZXJTaW5rcztcbn1cbnZhciBjb3VudGVyID0gMDtcbmZ1bmN0aW9uIG5ld1Njb3BlKCkge1xuICAgIHJldHVybiBcImN5Y2xlXCIgKyArK2NvdW50ZXI7XG59XG4vKipcbiAqIFRha2VzIGEgYGNvbXBvbmVudGAgZnVuY3Rpb24gYW5kIGEgYHNjb3BlYCwgYW5kIHJldHVybnMgYW4gaXNvbGF0ZWQgdmVyc2lvblxuICogb2YgdGhlIGBjb21wb25lbnRgIGZ1bmN0aW9uLlxuICpcbiAqIFdoZW4gdGhlIGlzb2xhdGVkIGNvbXBvbmVudCBpcyBpbnZva2VkLCBlYWNoIHNvdXJjZSBwcm92aWRlZCB0byBpdCBpc1xuICogaXNvbGF0ZWQgdG8gdGhlIGdpdmVuIGBzY29wZWAgdXNpbmcgYHNvdXJjZS5pc29sYXRlU291cmNlKHNvdXJjZSwgc2NvcGUpYCxcbiAqIGlmIHBvc3NpYmxlLiBMaWtld2lzZSwgdGhlIHNpbmtzIHJldHVybmVkIGZyb20gdGhlIGlzb2xhdGVkIGNvbXBvbmVudCBhcmVcbiAqIGlzb2xhdGVkIHRvIHRoZSBnaXZlbiBgc2NvcGVgIHVzaW5nIGBzb3VyY2UuaXNvbGF0ZVNpbmsoc2luaywgc2NvcGUpYC5cbiAqXG4gKiBUaGUgYHNjb3BlYCBjYW4gYmUgYSBzdHJpbmcgb3IgYW4gb2JqZWN0LiBJZiBpdCBpcyBhbnl0aGluZyBlbHNlIHRoYW4gdGhvc2VcbiAqIHR3byB0eXBlcywgaXQgd2lsbCBiZSBjb252ZXJ0ZWQgdG8gYSBzdHJpbmcuIElmIGBzY29wZWAgaXMgYW4gb2JqZWN0LCBpdFxuICogcmVwcmVzZW50cyBcInNjb3BlcyBwZXIgY2hhbm5lbFwiLCBhbGxvd2luZyB5b3UgdG8gc3BlY2lmeSBhIGRpZmZlcmVudCBzY29wZVxuICogZm9yIGVhY2gga2V5IG9mIHNvdXJjZXMvc2lua3MuIEZvciBpbnN0YW5jZVxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2ZvbycsIEhUVFA6ICdiYXInfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBZb3UgY2FuIGFsc28gdXNlIGEgd2lsZGNhcmQgYCcqJ2AgdG8gdXNlIGFzIGEgZGVmYXVsdCBmb3Igc291cmNlL3NpbmtzXG4gKiBjaGFubmVscyB0aGF0IGRpZCBub3QgcmVjZWl2ZSBhIHNwZWNpZmljIHNjb3BlOlxuICpcbiAqIGBgYGpzXG4gKiAvLyBVc2VzICdiYXInIGFzIHRoZSBpc29sYXRpb24gc2NvcGUgZm9yIEhUVFAgYW5kIG90aGVyIGNoYW5uZWxzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2ZvbycsICcqJzogJ2Jhcid9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIElmIGEgY2hhbm5lbCdzIHZhbHVlIGlzIG51bGwsIHRoZW4gdGhhdCBjaGFubmVsJ3Mgc291cmNlcyBhbmQgc2lua3Mgd29uJ3QgYmVcbiAqIGlzb2xhdGVkLiBJZiB0aGUgd2lsZGNhcmQgaXMgbnVsbCBhbmQgc29tZSBjaGFubmVscyBhcmUgdW5zcGVjaWZpZWQsIHRob3NlXG4gKiBjaGFubmVscyB3b24ndCBiZSBpc29sYXRlZC4gSWYgeW91IGRvbid0IGhhdmUgYSB3aWxkY2FyZCBhbmQgc29tZSBjaGFubmVsc1xuICogYXJlIHVuc3BlY2lmaWVkLCB0aGVuIGBpc29sYXRlYCB3aWxsIGdlbmVyYXRlIGEgcmFuZG9tIHNjb3BlLlxuICpcbiAqIGBgYGpzXG4gKiAvLyBEb2VzIG5vdCBpc29sYXRlIEhUVFAgcmVxdWVzdHNcbiAqIGNvbnN0IGNoaWxkU2lua3MgPSBpc29sYXRlKENoaWxkLCB7RE9NOiAnZm9vJywgSFRUUDogbnVsbH0pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogSWYgdGhlIGBzY29wZWAgYXJndW1lbnQgaXMgbm90IHByb3ZpZGVkIGF0IGFsbCwgYSBuZXcgc2NvcGUgd2lsbCBiZVxuICogYXV0b21hdGljYWxseSBjcmVhdGVkLiBUaGlzIG1lYW5zIHRoYXQgd2hpbGUgKipgaXNvbGF0ZShjb21wb25lbnQsIHNjb3BlKWAgaXNcbiAqIHB1cmUqKiAocmVmZXJlbnRpYWxseSB0cmFuc3BhcmVudCksICoqYGlzb2xhdGUoY29tcG9uZW50KWAgaXMgaW1wdXJlKiogKG5vdFxuICogcmVmZXJlbnRpYWxseSB0cmFuc3BhcmVudCkuIFR3byBjYWxscyB0byBgaXNvbGF0ZShGb28sIGJhcilgIHdpbGwgZ2VuZXJhdGVcbiAqIHRoZSBzYW1lIGNvbXBvbmVudC4gQnV0LCB0d28gY2FsbHMgdG8gYGlzb2xhdGUoRm9vKWAgd2lsbCBnZW5lcmF0ZSB0d29cbiAqIGRpc3RpbmN0IGNvbXBvbmVudHMuXG4gKlxuICogYGBganNcbiAqIC8vIFVzZXMgc29tZSBhcmJpdHJhcnkgc3RyaW5nIGFzIHRoZSBpc29sYXRpb24gc2NvcGUgZm9yIEhUVFAgYW5kIG90aGVyIGNoYW5uZWxzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2Zvbyd9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIE5vdGUgdGhhdCBib3RoIGBpc29sYXRlU291cmNlKClgIGFuZCBgaXNvbGF0ZVNpbmsoKWAgYXJlIHN0YXRpYyBtZW1iZXJzIG9mXG4gKiBgc291cmNlYC4gVGhlIHJlYXNvbiBmb3IgdGhpcyBpcyB0aGF0IGRyaXZlcnMgcHJvZHVjZSBgc291cmNlYCB3aGlsZSB0aGVcbiAqIGFwcGxpY2F0aW9uIHByb2R1Y2VzIGBzaW5rYCwgYW5kIGl0J3MgdGhlIGRyaXZlcidzIHJlc3BvbnNpYmlsaXR5IHRvXG4gKiBpbXBsZW1lbnQgYGlzb2xhdGVTb3VyY2UoKWAgYW5kIGBpc29sYXRlU2luaygpYC5cbiAqXG4gKiBfTm90ZSBmb3IgVHlwZXNjcmlwdCB1c2VyczpfIGBpc29sYXRlYCBpcyBub3QgY3VycmVudGx5IHR5cGUtdHJhbnNwYXJlbnQgYW5kXG4gKiB3aWxsIGV4cGxpY2l0bHkgY29udmVydCBnZW5lcmljIHR5cGUgYXJndW1lbnRzIHRvIGBhbnlgLiBUbyBwcmVzZXJ2ZSB0eXBlcyBpblxuICogeW91ciBjb21wb25lbnRzLCB5b3UgY2FuIHVzZSBhIHR5cGUgYXNzZXJ0aW9uOlxuICpcbiAqIGBgYHRzXG4gKiAvLyBpZiBDaGlsZCBpcyB0eXBlZCBgQ29tcG9uZW50PFNvdXJjZXMsIFNpbmtzPmBcbiAqIGNvbnN0IGlzb2xhdGVkQ2hpbGQgPSBpc29sYXRlKCBDaGlsZCApIGFzIENvbXBvbmVudDxTb3VyY2VzLCBTaW5rcz47XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjb21wb25lbnQgYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dFxuICogYW5kIG91dHB1dHMgYSBjb2xsZWN0aW9uIG9mIGBzaW5rc2AuXG4gKiBAcGFyYW0ge1N0cmluZ30gc2NvcGUgYW4gb3B0aW9uYWwgc3RyaW5nIHRoYXQgaXMgdXNlZCB0byBpc29sYXRlIGVhY2hcbiAqIGBzb3VyY2VzYCBhbmQgYHNpbmtzYCB3aGVuIHRoZSByZXR1cm5lZCBzY29wZWQgY29tcG9uZW50IGlzIGludm9rZWQuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGhlIHNjb3BlZCBjb21wb25lbnQgZnVuY3Rpb24gdGhhdCwgYXMgdGhlIG9yaWdpbmFsXG4gKiBgY29tcG9uZW50YCBmdW5jdGlvbiwgdGFrZXMgYHNvdXJjZXNgIGFuZCByZXR1cm5zIGBzaW5rc2AuXG4gKiBAZnVuY3Rpb24gaXNvbGF0ZVxuICovXG5mdW5jdGlvbiBpc29sYXRlKGNvbXBvbmVudCwgc2NvcGUpIHtcbiAgICBpZiAoc2NvcGUgPT09IHZvaWQgMCkgeyBzY29wZSA9IG5ld1Njb3BlKCk7IH1cbiAgICBjaGVja0lzb2xhdGVBcmdzKGNvbXBvbmVudCwgc2NvcGUpO1xuICAgIHZhciByYW5kb21TY29wZSA9IHR5cGVvZiBzY29wZSA9PT0gJ29iamVjdCcgPyBuZXdTY29wZSgpIDogJyc7XG4gICAgdmFyIHNjb3BlcyA9IHR5cGVvZiBzY29wZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHNjb3BlID09PSAnb2JqZWN0J1xuICAgICAgICA/IHNjb3BlXG4gICAgICAgIDogc2NvcGUudG9TdHJpbmcoKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gd3JhcHBlZENvbXBvbmVudChvdXRlclNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHJlc3QgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgX2kgPSAxOyBfaSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9pKyspIHtcbiAgICAgICAgICAgIHJlc3RbX2kgLSAxXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNjb3Blc1BlckNoYW5uZWwgPSBub3JtYWxpemVTY29wZXMob3V0ZXJTb3VyY2VzLCBzY29wZXMsIHJhbmRvbVNjb3BlKTtcbiAgICAgICAgdmFyIGlubmVyU291cmNlcyA9IGlzb2xhdGVBbGxTb3VyY2VzKG91dGVyU291cmNlcywgc2NvcGVzUGVyQ2hhbm5lbCk7XG4gICAgICAgIHZhciBpbm5lclNpbmtzID0gY29tcG9uZW50LmFwcGx5KHZvaWQgMCwgW2lubmVyU291cmNlc10uY29uY2F0KHJlc3QpKTtcbiAgICAgICAgdmFyIG91dGVyU2lua3MgPSBpc29sYXRlQWxsU2lua3Mob3V0ZXJTb3VyY2VzLCBpbm5lclNpbmtzLCBzY29wZXNQZXJDaGFubmVsKTtcbiAgICAgICAgcmV0dXJuIG91dGVyU2lua3M7XG4gICAgfTtcbn1cbmlzb2xhdGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAoY291bnRlciA9IDApOyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gaXNvbGF0ZTtcbmZ1bmN0aW9uIHRvSXNvbGF0ZWQoc2NvcGUpIHtcbiAgICBpZiAoc2NvcGUgPT09IHZvaWQgMCkgeyBzY29wZSA9IG5ld1Njb3BlKCk7IH1cbiAgICByZXR1cm4gZnVuY3Rpb24gKGNvbXBvbmVudCkgeyByZXR1cm4gaXNvbGF0ZShjb21wb25lbnQsIHNjb3BlKTsgfTtcbn1cbmV4cG9ydHMudG9Jc29sYXRlZCA9IHRvSXNvbGF0ZWQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICB2YXIgZ2xvYmFsT2JqO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IGdsb2JhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHRoaXM7XG4gICAgfVxuICAgIGdsb2JhbE9iai5DeWNsZWpzID0gZ2xvYmFsT2JqLkN5Y2xlanMgfHwge307XG4gICAgZ2xvYmFsT2JqID0gZ2xvYmFsT2JqLkN5Y2xlanM7XG4gICAgZ2xvYmFsT2JqLmFkYXB0U3RyZWFtID0gZ2xvYmFsT2JqLmFkYXB0U3RyZWFtIHx8IChmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XG4gICAgcmV0dXJuIGdsb2JhbE9iajtcbn1cbmZ1bmN0aW9uIHNldEFkYXB0KGYpIHtcbiAgICBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbSA9IGY7XG59XG5leHBvcnRzLnNldEFkYXB0ID0gc2V0QWRhcHQ7XG5mdW5jdGlvbiBhZGFwdChzdHJlYW0pIHtcbiAgICByZXR1cm4gZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0oc3RyZWFtKTtcbn1cbmV4cG9ydHMuYWRhcHQgPSBhZGFwdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFkYXB0LmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxudmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xudmFyIGRlZmluZVByb3BlcnR5ID0gT2JqZWN0LmRlZmluZVByb3BlcnR5O1xudmFyIGdPUEQgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yO1xuXG52YXIgaXNBcnJheSA9IGZ1bmN0aW9uIGlzQXJyYXkoYXJyKSB7XG5cdGlmICh0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdHJldHVybiBBcnJheS5pc0FycmF5KGFycik7XG5cdH1cblxuXHRyZXR1cm4gdG9TdHIuY2FsbChhcnIpID09PSAnW29iamVjdCBBcnJheV0nO1xufTtcblxudmFyIGlzUGxhaW5PYmplY3QgPSBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iaikge1xuXHRpZiAoIW9iaiB8fCB0b1N0ci5jYWxsKG9iaikgIT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0dmFyIGhhc093bkNvbnN0cnVjdG9yID0gaGFzT3duLmNhbGwob2JqLCAnY29uc3RydWN0b3InKTtcblx0dmFyIGhhc0lzUHJvdG90eXBlT2YgPSBvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSAmJiBoYXNPd24uY2FsbChvYmouY29uc3RydWN0b3IucHJvdG90eXBlLCAnaXNQcm90b3R5cGVPZicpO1xuXHQvLyBOb3Qgb3duIGNvbnN0cnVjdG9yIHByb3BlcnR5IG11c3QgYmUgT2JqZWN0XG5cdGlmIChvYmouY29uc3RydWN0b3IgJiYgIWhhc093bkNvbnN0cnVjdG9yICYmICFoYXNJc1Byb3RvdHlwZU9mKSB7XG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0Ly8gT3duIHByb3BlcnRpZXMgYXJlIGVudW1lcmF0ZWQgZmlyc3RseSwgc28gdG8gc3BlZWQgdXAsXG5cdC8vIGlmIGxhc3Qgb25lIGlzIG93biwgdGhlbiBhbGwgcHJvcGVydGllcyBhcmUgb3duLlxuXHR2YXIga2V5O1xuXHRmb3IgKGtleSBpbiBvYmopIHsgLyoqLyB9XG5cblx0cmV0dXJuIHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnIHx8IGhhc093bi5jYWxsKG9iaiwga2V5KTtcbn07XG5cbi8vIElmIG5hbWUgaXMgJ19fcHJvdG9fXycsIGFuZCBPYmplY3QuZGVmaW5lUHJvcGVydHkgaXMgYXZhaWxhYmxlLCBkZWZpbmUgX19wcm90b19fIGFzIGFuIG93biBwcm9wZXJ0eSBvbiB0YXJnZXRcbnZhciBzZXRQcm9wZXJ0eSA9IGZ1bmN0aW9uIHNldFByb3BlcnR5KHRhcmdldCwgb3B0aW9ucykge1xuXHRpZiAoZGVmaW5lUHJvcGVydHkgJiYgb3B0aW9ucy5uYW1lID09PSAnX19wcm90b19fJykge1xuXHRcdGRlZmluZVByb3BlcnR5KHRhcmdldCwgb3B0aW9ucy5uYW1lLCB7XG5cdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuXHRcdFx0Y29uZmlndXJhYmxlOiB0cnVlLFxuXHRcdFx0dmFsdWU6IG9wdGlvbnMubmV3VmFsdWUsXG5cdFx0XHR3cml0YWJsZTogdHJ1ZVxuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHRhcmdldFtvcHRpb25zLm5hbWVdID0gb3B0aW9ucy5uZXdWYWx1ZTtcblx0fVxufTtcblxuLy8gUmV0dXJuIHVuZGVmaW5lZCBpbnN0ZWFkIG9mIF9fcHJvdG9fXyBpZiAnX19wcm90b19fJyBpcyBub3QgYW4gb3duIHByb3BlcnR5XG52YXIgZ2V0UHJvcGVydHkgPSBmdW5jdGlvbiBnZXRQcm9wZXJ0eShvYmosIG5hbWUpIHtcblx0aWYgKG5hbWUgPT09ICdfX3Byb3RvX18nKSB7XG5cdFx0aWYgKCFoYXNPd24uY2FsbChvYmosIG5hbWUpKSB7XG5cdFx0XHRyZXR1cm4gdm9pZCAwO1xuXHRcdH0gZWxzZSBpZiAoZ09QRCkge1xuXHRcdFx0Ly8gSW4gZWFybHkgdmVyc2lvbnMgb2Ygbm9kZSwgb2JqWydfX3Byb3RvX18nXSBpcyBidWdneSB3aGVuIG9iaiBoYXNcblx0XHRcdC8vIF9fcHJvdG9fXyBhcyBhbiBvd24gcHJvcGVydHkuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoKSB3b3Jrcy5cblx0XHRcdHJldHVybiBnT1BEKG9iaiwgbmFtZSkudmFsdWU7XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG9ialtuYW1lXTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZXh0ZW5kKCkge1xuXHR2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmU7XG5cdHZhciB0YXJnZXQgPSBhcmd1bWVudHNbMF07XG5cdHZhciBpID0gMTtcblx0dmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cdHZhciBkZWVwID0gZmFsc2U7XG5cblx0Ly8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuXHRpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Jvb2xlYW4nKSB7XG5cdFx0ZGVlcCA9IHRhcmdldDtcblx0XHR0YXJnZXQgPSBhcmd1bWVudHNbMV0gfHwge307XG5cdFx0Ly8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuXHRcdGkgPSAyO1xuXHR9XG5cdGlmICh0YXJnZXQgPT0gbnVsbCB8fCAodHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcgJiYgdHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJykpIHtcblx0XHR0YXJnZXQgPSB7fTtcblx0fVxuXG5cdGZvciAoOyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0XHRvcHRpb25zID0gYXJndW1lbnRzW2ldO1xuXHRcdC8vIE9ubHkgZGVhbCB3aXRoIG5vbi1udWxsL3VuZGVmaW5lZCB2YWx1ZXNcblx0XHRpZiAob3B0aW9ucyAhPSBudWxsKSB7XG5cdFx0XHQvLyBFeHRlbmQgdGhlIGJhc2Ugb2JqZWN0XG5cdFx0XHRmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xuXHRcdFx0XHRzcmMgPSBnZXRQcm9wZXJ0eSh0YXJnZXQsIG5hbWUpO1xuXHRcdFx0XHRjb3B5ID0gZ2V0UHJvcGVydHkob3B0aW9ucywgbmFtZSk7XG5cblx0XHRcdFx0Ly8gUHJldmVudCBuZXZlci1lbmRpbmcgbG9vcFxuXHRcdFx0XHRpZiAodGFyZ2V0ICE9PSBjb3B5KSB7XG5cdFx0XHRcdFx0Ly8gUmVjdXJzZSBpZiB3ZSdyZSBtZXJnaW5nIHBsYWluIG9iamVjdHMgb3IgYXJyYXlzXG5cdFx0XHRcdFx0aWYgKGRlZXAgJiYgY29weSAmJiAoaXNQbGFpbk9iamVjdChjb3B5KSB8fCAoY29weUlzQXJyYXkgPSBpc0FycmF5KGNvcHkpKSkpIHtcblx0XHRcdFx0XHRcdGlmIChjb3B5SXNBcnJheSkge1xuXHRcdFx0XHRcdFx0XHRjb3B5SXNBcnJheSA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRjbG9uZSA9IHNyYyAmJiBpc0FycmF5KHNyYykgPyBzcmMgOiBbXTtcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGNsb25lID0gc3JjICYmIGlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvLyBOZXZlciBtb3ZlIG9yaWdpbmFsIG9iamVjdHMsIGNsb25lIHRoZW1cblx0XHRcdFx0XHRcdHNldFByb3BlcnR5KHRhcmdldCwgeyBuYW1lOiBuYW1lLCBuZXdWYWx1ZTogZXh0ZW5kKGRlZXAsIGNsb25lLCBjb3B5KSB9KTtcblxuXHRcdFx0XHRcdC8vIERvbid0IGJyaW5nIGluIHVuZGVmaW5lZCB2YWx1ZXNcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHR5cGVvZiBjb3B5ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRcdFx0c2V0UHJvcGVydHkodGFyZ2V0LCB7IG5hbWU6IG5hbWUsIG5ld1ZhbHVlOiBjb3B5IH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8vIFJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG5cdHJldHVybiB0YXJnZXQ7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG5mdW5jdGlvbiBfaW50ZXJvcERlZmF1bHQgKGV4KSB7IHJldHVybiAoZXggJiYgKHR5cGVvZiBleCA9PT0gJ29iamVjdCcpICYmICdkZWZhdWx0JyBpbiBleCkgPyBleFsnZGVmYXVsdCddIDogZXg7IH1cblxudmFyIF9leHRlbmQgPSBfaW50ZXJvcERlZmF1bHQocmVxdWlyZSgnZXh0ZW5kJykpO1xuXG52YXIgdW5kZWZpbmVkdiA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiB2ID09PSB1bmRlZmluZWQ7IH07XG5cbnZhciBudW1iZXIgPSBmdW5jdGlvbiAodikgeyByZXR1cm4gdHlwZW9mIHYgPT09ICdudW1iZXInOyB9O1xuXG52YXIgc3RyaW5nID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHR5cGVvZiB2ID09PSAnc3RyaW5nJzsgfTtcblxudmFyIHRleHQgPSBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RyaW5nKHYpIHx8IG51bWJlcih2KTsgfTtcblxudmFyIGFycmF5ID0gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIEFycmF5LmlzQXJyYXkodik7IH07XG5cbnZhciBvYmplY3QgPSBmdW5jdGlvbiAodikgeyByZXR1cm4gdHlwZW9mIHYgPT09ICdvYmplY3QnICYmIHYgIT09IG51bGw7IH07XG5cbnZhciBmdW4gPSBmdW5jdGlvbiAodikgeyByZXR1cm4gdHlwZW9mIHYgPT09ICdmdW5jdGlvbic7IH07XG5cbnZhciB2bm9kZSA9IGZ1bmN0aW9uICh2KSB7IHJldHVybiBvYmplY3QodikgJiYgJ3NlbCcgaW4gdiAmJiAnZGF0YScgaW4gdiAmJiAnY2hpbGRyZW4nIGluIHYgJiYgJ3RleHQnIGluIHY7IH07XG5cbnZhciBzdmdQcm9wc01hcCA9IHsgc3ZnOiAxLCBjaXJjbGU6IDEsIGVsbGlwc2U6IDEsIGxpbmU6IDEsIHBvbHlnb246IDEsXG4gIHBvbHlsaW5lOiAxLCByZWN0OiAxLCBnOiAxLCBwYXRoOiAxLCB0ZXh0OiAxIH07XG5cbnZhciBzdmcgPSBmdW5jdGlvbiAodikgeyByZXR1cm4gdi5zZWwgaW4gc3ZnUHJvcHNNYXA7IH07XG5cbi8vIFRPRE86IHN0b3AgdXNpbmcgZXh0ZW5kIGhlcmVcbnZhciBleHRlbmQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBvYmpzID0gW10sIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gIHdoaWxlICggbGVuLS0gKSBvYmpzWyBsZW4gXSA9IGFyZ3VtZW50c1sgbGVuIF07XG5cbiAgcmV0dXJuIF9leHRlbmQuYXBwbHkodm9pZCAwLCBbIHRydWUgXS5jb25jYXQoIG9ianMgKSk7XG59O1xuXG52YXIgYXNzaWduID0gZnVuY3Rpb24gKCkge1xuICB2YXIgb2JqcyA9IFtdLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICB3aGlsZSAoIGxlbi0tICkgb2Jqc1sgbGVuIF0gPSBhcmd1bWVudHNbIGxlbiBdO1xuXG4gIHJldHVybiBfZXh0ZW5kLmFwcGx5KHZvaWQgMCwgWyBmYWxzZSBdLmNvbmNhdCggb2JqcyApKTtcbn07XG5cbnZhciByZWR1Y2VEZWVwID0gZnVuY3Rpb24gKGFyciwgZm4sIGluaXRpYWwpIHtcbiAgdmFyIHJlc3VsdCA9IGluaXRpYWw7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHZhbHVlID0gYXJyW2ldO1xuICAgIGlmIChhcnJheSh2YWx1ZSkpIHtcbiAgICAgIHJlc3VsdCA9IHJlZHVjZURlZXAodmFsdWUsIGZuLCByZXN1bHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXN1bHQgPSBmbihyZXN1bHQsIHZhbHVlKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJlc3VsdFxufTtcblxudmFyIG1hcE9iamVjdCA9IGZ1bmN0aW9uIChvYmosIGZuKSB7IHJldHVybiBPYmplY3Qua2V5cyhvYmopLm1hcChcbiAgZnVuY3Rpb24gKGtleSkgeyByZXR1cm4gZm4oa2V5LCBvYmpba2V5XSk7IH1cbikucmVkdWNlKFxuICBmdW5jdGlvbiAoYWNjLCBjdXJyKSB7IHJldHVybiBleHRlbmQoYWNjLCBjdXJyKTsgfSxcbiAge31cbik7IH07XG5cbnZhciBkZWVwaWZ5S2V5cyA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG1hcE9iamVjdChvYmosXG4gIGZ1bmN0aW9uIChrZXksIHZhbCkge1xuICAgIHZhciBkYXNoSW5kZXggPSBrZXkuaW5kZXhPZignLScpO1xuICAgIGlmIChkYXNoSW5kZXggPiAtMSkge1xuICAgICAgdmFyIG1vZHVsZURhdGEgPSB7fTtcbiAgICAgIG1vZHVsZURhdGFba2V5LnNsaWNlKGRhc2hJbmRleCArIDEpXSA9IHZhbDtcbiAgICAgIHJldHVybiAoIG9iaiA9IHt9LCBvYmpba2V5LnNsaWNlKDAsIGRhc2hJbmRleCldID0gbW9kdWxlRGF0YSwgb2JqIClcbiAgICAgIHZhciBvYmo7XG4gICAgfVxuICAgIHJldHVybiAoIG9iaiQxID0ge30sIG9iaiQxW2tleV0gPSB2YWwsIG9iaiQxIClcbiAgICB2YXIgb2JqJDE7XG4gIH1cbik7IH07XG5cbnZhciBmbGF0aWZ5S2V5cyA9IGZ1bmN0aW9uIChvYmopIHsgcmV0dXJuIG1hcE9iamVjdChvYmosXG4gIGZ1bmN0aW9uIChtb2QsIGRhdGEpIHsgcmV0dXJuICFvYmplY3QoZGF0YSkgPyAoKCBvYmogPSB7fSwgb2JqW21vZF0gPSBkYXRhLCBvYmogKSkgOiBtYXBPYmplY3QoXG4gICAgZmxhdGlmeUtleXMoZGF0YSksXG4gICAgZnVuY3Rpb24gKGtleSwgdmFsKSB7IHJldHVybiAoKCBvYmogPSB7fSwgb2JqWyhtb2QgKyBcIi1cIiArIGtleSldID0gdmFsLCBvYmogKSlcbiAgICAgIHZhciBvYmo7IH1cbiAgKVxuICAgIHZhciBvYmo7IH1cbik7IH07XG5cbnZhciBvbWl0ID0gZnVuY3Rpb24gKGtleSwgb2JqKSB7IHJldHVybiBtYXBPYmplY3Qob2JqLFxuICBmdW5jdGlvbiAobW9kLCBkYXRhKSB7IHJldHVybiBtb2QgIT09IGtleSA/ICgoIG9iaiA9IHt9LCBvYmpbbW9kXSA9IGRhdGEsIG9iaiApKSA6IHt9XG4gICAgdmFyIG9iajsgfVxuKTsgfTtcblxuLy8gQ29uc3QgZm5OYW1lID0gKC4uLnBhcmFtcykgPT4gZ3VhcmQgPyBkZWZhdWx0IDogLi4uXG5cbnZhciBjcmVhdGVUZXh0RWxlbWVudCA9IGZ1bmN0aW9uICh0ZXh0JCQxKSB7IHJldHVybiAhdGV4dCh0ZXh0JCQxKSA/IHVuZGVmaW5lZCA6IHtcbiAgdGV4dDogdGV4dCQkMSxcbiAgc2VsOiB1bmRlZmluZWQsXG4gIGRhdGE6IHVuZGVmaW5lZCxcbiAgY2hpbGRyZW46IHVuZGVmaW5lZCxcbiAgZWxtOiB1bmRlZmluZWQsXG4gIGtleTogdW5kZWZpbmVkXG59OyB9O1xuXG52YXIgY29uc2lkZXJTdmcgPSBmdW5jdGlvbiAodm5vZGUkJDEpIHsgcmV0dXJuICFzdmcodm5vZGUkJDEpID8gdm5vZGUkJDEgOlxuICBhc3NpZ24odm5vZGUkJDEsXG4gICAgeyBkYXRhOiBvbWl0KCdwcm9wcycsIGV4dGVuZCh2bm9kZSQkMS5kYXRhLFxuICAgICAgeyBuczogJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgYXR0cnM6IG9taXQoJ2NsYXNzTmFtZScsIGV4dGVuZCh2bm9kZSQkMS5kYXRhLnByb3BzLFxuICAgICAgICB7IGNsYXNzOiB2bm9kZSQkMS5kYXRhLnByb3BzID8gdm5vZGUkJDEuZGF0YS5wcm9wcy5jbGFzc05hbWUgOiB1bmRlZmluZWQgfVxuICAgICAgKSkgfVxuICAgICkpIH0sXG4gICAgeyBjaGlsZHJlbjogdW5kZWZpbmVkdih2bm9kZSQkMS5jaGlsZHJlbikgPyB1bmRlZmluZWQgOlxuICAgICAgdm5vZGUkJDEuY2hpbGRyZW4ubWFwKGZ1bmN0aW9uIChjaGlsZCkgeyByZXR1cm4gY29uc2lkZXJTdmcoY2hpbGQpOyB9KVxuICAgIH1cbiAgKTsgfTtcblxudmFyIGNvbnNpZGVyRGF0YSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gIHJldHVybiAhZGF0YS5kYXRhID8gZGF0YSA6IG1hcE9iamVjdChkYXRhLCBmdW5jdGlvbiAobW9kLCBkYXRhKSB7XG4gICAgdmFyIGtleSA9IG1vZCA9PT0gJ2RhdGEnID8gJ2RhdGFzZXQnIDogbW9kO1xuICAgIHJldHVybiAoKCBvYmogPSB7fSwgb2JqW2tleV0gPSBkYXRhLCBvYmogKSlcbiAgICB2YXIgb2JqO1xuICB9KVxufTtcblxudmFyIGNvbnNpZGVyQXJpYSA9IGZ1bmN0aW9uIChkYXRhKSB7IHJldHVybiBkYXRhLmF0dHJzIHx8IGRhdGEuYXJpYSA/IG9taXQoJ2FyaWEnLFxuICBhc3NpZ24oZGF0YSwge1xuICAgIGF0dHJzOiBleHRlbmQoZGF0YS5hdHRycywgZGF0YS5hcmlhID8gZmxhdGlmeUtleXMoeyBhcmlhOiBkYXRhLmFyaWEgfSkgOiB7fSlcbiAgfSlcbikgOiBkYXRhOyB9O1xuXG52YXIgY29uc2lkZXJQcm9wcyA9IGZ1bmN0aW9uIChkYXRhKSB7IHJldHVybiBtYXBPYmplY3QoZGF0YSxcbiAgZnVuY3Rpb24gKGtleSwgdmFsKSB7IHJldHVybiBvYmplY3QodmFsKSA/ICggb2JqID0ge30sIG9ialtrZXldID0gdmFsLCBvYmogKSA6XG4gICAgeyBwcm9wczogKCBvYmokMSA9IHt9LCBvYmokMVtrZXldID0gdmFsLCBvYmokMSApIH1cbiAgICB2YXIgb2JqO1xuICAgIHZhciBvYmokMTsgfVxuKTsgfTtcblxudmFyIHJld3JpdGVzTWFwID0geyBmb3I6IDEsIHJvbGU6IDEsIHRhYmluZGV4OiAxIH07XG5cbnZhciBjb25zaWRlckF0dHJzID0gZnVuY3Rpb24gKGRhdGEpIHsgcmV0dXJuIG1hcE9iamVjdChkYXRhLFxuICAgIGZ1bmN0aW9uIChrZXksIGRhdGEpIHsgcmV0dXJuICEoa2V5IGluIHJld3JpdGVzTWFwKSA/ICggb2JqID0ge30sIG9ialtrZXldID0gZGF0YSwgb2JqICkgOiB7XG4gICAgICBhdHRyczogZXh0ZW5kKGRhdGEuYXR0cnMsICggb2JqJDEgPSB7fSwgb2JqJDFba2V5XSA9IGRhdGEsIG9iaiQxICkpXG4gICAgfVxuICAgICAgdmFyIG9iajtcbiAgICAgIHZhciBvYmokMTsgfVxuKTsgfTtcblxudmFyIGNvbnNpZGVyS2V5ID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgcmV0dXJuICdrZXknIGluIGRhdGEgPyBvbWl0KCdrZXknLCBkYXRhKSA6IGRhdGFcbn07XG5cbnZhciBzYW5pdGl6ZURhdGEgPSBmdW5jdGlvbiAoZGF0YSkgeyByZXR1cm4gY29uc2lkZXJQcm9wcyhjb25zaWRlckFyaWEoY29uc2lkZXJEYXRhKGNvbnNpZGVyQXR0cnMoY29uc2lkZXJLZXkoZGVlcGlmeUtleXMoZGF0YSkpKSkpKTsgfTtcblxudmFyIHNhbml0aXplVGV4dCA9IGZ1bmN0aW9uIChjaGlsZHJlbikgeyByZXR1cm4gY2hpbGRyZW4ubGVuZ3RoID4gMSB8fCAhdGV4dChjaGlsZHJlblswXSkgPyB1bmRlZmluZWQgOiBjaGlsZHJlblswXTsgfTtcblxudmFyIHNhbml0aXplQ2hpbGRyZW4gPSBmdW5jdGlvbiAoY2hpbGRyZW4pIHsgcmV0dXJuIHJlZHVjZURlZXAoY2hpbGRyZW4sIGZ1bmN0aW9uIChhY2MsIGNoaWxkKSB7XG4gIHZhciB2bm9kZSQkMSA9IHZub2RlKGNoaWxkKSA/IGNoaWxkIDogY3JlYXRlVGV4dEVsZW1lbnQoY2hpbGQpO1xuICBhY2MucHVzaCh2bm9kZSQkMSk7XG4gIHJldHVybiBhY2Ncbn1cbiwgW10pOyB9O1xuXG52YXIgY3JlYXRlRWxlbWVudCA9IGZ1bmN0aW9uIChzZWwsIGRhdGEpIHtcbiAgdmFyIGNoaWxkcmVuID0gW10sIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGggLSAyO1xuICB3aGlsZSAoIGxlbi0tID4gMCApIGNoaWxkcmVuWyBsZW4gXSA9IGFyZ3VtZW50c1sgbGVuICsgMiBdO1xuXG4gIGlmIChmdW4oc2VsKSkge1xuICAgIHJldHVybiBzZWwoZGF0YSB8fCB7fSwgY2hpbGRyZW4pXG4gIH1cbiAgdmFyIHRleHQkJDEgPSBzYW5pdGl6ZVRleHQoY2hpbGRyZW4pO1xuICByZXR1cm4gY29uc2lkZXJTdmcoe1xuICAgIHNlbDogc2VsLFxuICAgIGRhdGE6IGRhdGEgPyBzYW5pdGl6ZURhdGEoZGF0YSkgOiB7fSxcbiAgICBjaGlsZHJlbjogdGV4dCQkMSA/IHVuZGVmaW5lZCA6IHNhbml0aXplQ2hpbGRyZW4oY2hpbGRyZW4pLFxuICAgIHRleHQ6IHRleHQkJDEsXG4gICAgZWxtOiB1bmRlZmluZWQsXG4gICAga2V5OiBkYXRhID8gZGF0YS5rZXkgOiB1bmRlZmluZWRcbiAgfSlcbn07XG5cbnZhciBpbmRleCA9IHtcbiAgY3JlYXRlRWxlbWVudDogY3JlYXRlRWxlbWVudFxufTtcblxuZXhwb3J0cy5jcmVhdGVFbGVtZW50ID0gY3JlYXRlRWxlbWVudDtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IGluZGV4O1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcm9vdDtcbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByb290ID0gc2VsZjtcbn1cbmVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IHdpbmRvdztcbn1cbmVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IGdsb2JhbDtcbn1cbmVsc2Uge1xuICAgIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxudmFyIFN5bWJvbCA9IHJvb3QuU3ltYm9sO1xudmFyIHBhcmVudFN5bWJvbDtcbmlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcGFyZW50U3ltYm9sID0gU3ltYm9sKCdwYXJlbnQnKTtcbn1cbmVsc2Uge1xuICAgIHBhcmVudFN5bWJvbCA9ICdAQHNuYWJiZG9tLXNlbGVjdG9yLXBhcmVudCc7XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBwYXJlbnRTeW1ib2w7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wYXJlbnQtc3ltYm9sLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9wb255ZmlsbCA9IHJlcXVpcmUoJy4vcG9ueWZpbGwuanMnKTtcblxudmFyIF9wb255ZmlsbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wb255ZmlsbCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIHJvb3Q7IC8qIGdsb2JhbCB3aW5kb3cgKi9cblxuXG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gbW9kdWxlO1xufSBlbHNlIHtcbiAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG5cbnZhciByZXN1bHQgPSAoMCwgX3BvbnlmaWxsMlsnZGVmYXVsdCddKShyb290KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHJlc3VsdDsiLCJpbXBvcnQge09wZXJhdG9yLCBTdHJlYW19IGZyb20gJy4uL2luZGV4JztcbmNvbnN0IGVtcHR5ID0ge307XG5cbmV4cG9ydCBjbGFzcyBEcm9wUmVwZWF0c09wZXJhdG9yPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkcm9wUmVwZWF0cyc7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPiA9IG51bGwgYXMgYW55O1xuICBwdWJsaWMgaXNFcTogKHg6IFQsIHk6IFQpID0+IGJvb2xlYW47XG4gIHByaXZhdGUgdjogVCA9IDxhbnk+IGVtcHR5O1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBpbnM6IFN0cmVhbTxUPixcbiAgICAgICAgICAgICAgZm46ICgoeDogVCwgeTogVCkgPT4gYm9vbGVhbikgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmlzRXEgPSBmbiA/IGZuIDogKHgsIHkpID0+IHggPT09IHk7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IG51bGwgYXMgYW55O1xuICAgIHRoaXMudiA9IGVtcHR5IGFzIGFueTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3QgdiA9IHRoaXMudjtcbiAgICBpZiAodiAhPT0gZW1wdHkgJiYgdGhpcy5pc0VxKHQsIHYpKSByZXR1cm47XG4gICAgdGhpcy52ID0gdDtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG4vKipcbiAqIERyb3BzIGNvbnNlY3V0aXZlIGR1cGxpY2F0ZSB2YWx1ZXMgaW4gYSBzdHJlYW0uXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0yLS0xLS0xLS0xLS0yLS0zLS00LS0zLS0zfFxuICogICAgIGRyb3BSZXBlYXRzXG4gKiAtLTEtLTItLTEtLS0tLS0tLTItLTMtLTQtLTMtLS18XG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZHJvcFJlcGVhdHMgZnJvbSAneHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0cydcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSB4cy5vZigxLCAyLCAxLCAxLCAxLCAyLCAzLCA0LCAzLCAzKVxuICogICAuY29tcG9zZShkcm9wUmVwZWF0cygpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiAxXG4gKiA+IDJcbiAqID4gMVxuICogPiAyXG4gKiA+IDNcbiAqID4gNFxuICogPiAzXG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogRXhhbXBsZSB3aXRoIGEgY3VzdG9tIGlzRXF1YWwgZnVuY3Rpb246XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBkcm9wUmVwZWF0cyBmcm9tICd4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzJ1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IHhzLm9mKCdhJywgJ2InLCAnYScsICdBJywgJ0InLCAnYicpXG4gKiAgIC5jb21wb3NlKGRyb3BSZXBlYXRzKCh4LCB5KSA9PiB4LnRvTG93ZXJDYXNlKCkgPT09IHkudG9Mb3dlckNhc2UoKSkpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IGFcbiAqID4gYlxuICogPiBhXG4gKiA+IEJcbiAqID4gY29tcGxldGVkXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBpc0VxdWFsIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIG9mIHR5cGVcbiAqIGAoeDogVCwgeTogVCkgPT4gYm9vbGVhbmAgdGhhdCB0YWtlcyBhbiBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gYW5kXG4gKiBjaGVja3MgaWYgaXQgaXMgZXF1YWwgdG8gcHJldmlvdXMgZXZlbnQsIGJ5IHJldHVybmluZyBhIGJvb2xlYW4uXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRyb3BSZXBlYXRzPFQ+KGlzRXF1YWw6ICgoeDogVCwgeTogVCkgPT4gYm9vbGVhbikgfCB1bmRlZmluZWQgPSB2b2lkIDApOiAoaW5zOiBTdHJlYW08VD4pID0+IFN0cmVhbTxUPiB7XG4gIHJldHVybiBmdW5jdGlvbiBkcm9wUmVwZWF0c09wZXJhdG9yKGluczogU3RyZWFtPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRHJvcFJlcGVhdHNPcGVyYXRvcjxUPihpbnMsIGlzRXF1YWwpKTtcbiAgfTtcbn1cbiJdfQ==

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./fromEvent":12,"@cycle/run/lib/adapt":22,"xstream":63}],2:[function(require,module,exports){
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

},{"./fromEvent":12,"@cycle/run/lib/adapt":22,"xstream":63}],3:[function(require,module,exports){
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

},{"./ScopeChecker":9,"./utils":20}],4:[function(require,module,exports){
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

},{"./ElementFinder":3,"./PriorityQueue":7,"./RemovalSet":8,"./ScopeChecker":9,"./SymbolTree":10,"./fromEvent":12,"./utils":20,"xstream":63}],5:[function(require,module,exports){
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

},{"./SymbolTree":10,"./utils":20}],6:[function(require,module,exports){
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

},{"./BodyDOMSource":1,"./DocumentDOMSource":2,"./ElementFinder":3,"./isolate":15,"@cycle/run/lib/adapt":22}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{"./utils":20}],10:[function(require,module,exports){
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

},{"./utils":20,"snabbdom-selector":37,"snabbdom/h":41,"snabbdom/vnode":52}],12:[function(require,module,exports){
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
            next = null;
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

},{"xstream":63}],13:[function(require,module,exports){
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

},{"snabbdom/h":41}],14:[function(require,module,exports){
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

},{"./MainDOMSource":6,"./hyperscript-helpers":13,"./makeDOMDriver":16,"./mockDOMSource":17,"./thunk":19,"snabbdom/h":41}],15:[function(require,module,exports){
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

},{"./utils":20}],16:[function(require,module,exports){
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

},{"./EventDelegator":4,"./IsolateModule":5,"./MainDOMSource":6,"./VNodeWrapper":11,"./modules":18,"./utils":20,"snabbdom":49,"snabbdom/tovnode":51,"xstream":63,"xstream/extra/concat":60,"xstream/extra/sampleCombine":62}],17:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":22,"xstream":63}],18:[function(require,module,exports){
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

},{"snabbdom/modules/attributes":44,"snabbdom/modules/class":45,"snabbdom/modules/dataset":46,"snabbdom/modules/props":47,"snabbdom/modules/style":48}],19:[function(require,module,exports){
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

},{"snabbdom/h":41}],20:[function(require,module,exports){
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

},{}],21:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":22,"xstream":63}],22:[function(require,module,exports){
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

},{}],24:[function(require,module,exports){
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

},{"./internals":25}],25:[function(require,module,exports){
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

},{"./adapt":23,"quicktask":33,"xstream":63}],26:[function(require,module,exports){
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

},{"./pickCombine":29,"./pickMerge":30,"@cycle/isolate":21,"@cycle/run/lib/adapt":22,"xstream":63}],27:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":22,"xstream/extra/dropRepeats":61}],28:[function(require,module,exports){
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

},{"./Collection":26,"./StateSource":27,"./withState":31}],29:[function(require,module,exports){
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

},{"xstream":63}],30:[function(require,module,exports){
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

},{"xstream":63}],31:[function(require,module,exports){
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

},{"./StateSource":27,"quicktask":33,"xstream":63,"xstream/extra/concat":60}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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

},{"_process":32,"timers":55}],34:[function(require,module,exports){
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

},{"./selectorParser":40}],35:[function(require,module,exports){
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

},{}],36:[function(require,module,exports){
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

},{"./parent-symbol":38,"./query":39}],37:[function(require,module,exports){
"use strict";
var curry2_1 = require('./curry2');
var findMatches_1 = require('./findMatches');
exports.select = curry2_1.curry2(findMatches_1.findMatches);
var selectorParser_1 = require('./selectorParser');
exports.selectorParser = selectorParser_1.selectorParser;
var classNameFromVNode_1 = require('./classNameFromVNode');
exports.classNameFromVNode = classNameFromVNode_1.classNameFromVNode;

},{"./classNameFromVNode":34,"./curry2":35,"./findMatches":36,"./selectorParser":40}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{"./classNameFromVNode":34,"./parent-symbol":38,"./selectorParser":40,"tree-selector":56}],40:[function(require,module,exports){
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

},{}],41:[function(require,module,exports){
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

},{"./is":43,"./vnode":52}],42:[function(require,module,exports){
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

},{}],43:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;

},{}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
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

},{}],47:[function(require,module,exports){
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

},{}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
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

},{"./h":41,"./htmldomapi":42,"./is":43,"./thunk":50,"./vnode":52}],50:[function(require,module,exports){
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

},{"./h":41}],51:[function(require,module,exports){
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

},{"./htmldomapi":42,"./vnode":52}],52:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
exports.default = vnode;

},{}],53:[function(require,module,exports){
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

},{"./ponyfill.js":54}],54:[function(require,module,exports){
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
},{}],55:[function(require,module,exports){
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

},{"process/browser.js":32,"timers":55}],56:[function(require,module,exports){
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

},{"./matches":57,"./querySelector":58,"./selectorParser":59}],57:[function(require,module,exports){
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

},{"./selectorParser":59}],58:[function(require,module,exports){
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

},{"./matches":57,"./selectorParser":59}],59:[function(require,module,exports){
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

},{}],60:[function(require,module,exports){
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

},{"../index":63}],61:[function(require,module,exports){
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

},{"../index":63}],62:[function(require,module,exports){
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

},{"../index":63}],63:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
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

},{"symbol-observable":53}],64:[function(require,module,exports){
'use strict';

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _run = require('@cycle/run');

var _state = require('@cycle/state');

var _dom = require('@cycle/dom');

var _speech = require('@cycle-robot-drivers/speech');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function main(sources) {
  var vdom$ = sources.DOM.select('.myinput').events('input').map(function (ev) {
    return ev.target.value;
  }).startWith('').map(function (name) {
    return (0, _dom.div)([(0, _dom.button)('.say', 'say'), (0, _dom.input)('.myinput', { attrs: { type: 'text' } }), (0, _dom.br)(), (0, _dom.button)('listen'), (0, _dom.label)('heard: hello!')]);
  });

  var click$ = sources.DOM.select('.say').events('click');

  var speechSynthesisAction = (0, _speech.SpeechSynthesisAction2)({
    state: sources.state,
    goal: click$.mapTo({ goal_id: 'test', goal: 'Hello' }), //xs.never(),
    cancel: _xstream2.default.never(),
    SpeechSynthesis: sources.SpeechSynthesis
  });

  sources.state.stream.addListener({ next: function next(s) {
      return console.log(s);
    } });

  return {
    DOM: vdom$,
    SpeechSynthesis: speechSynthesisAction.SpeechSynthesis,
    state: speechSynthesisAction.state
  };
}

(0, _run.run)((0, _state.withState)(main), {
  DOM: (0, _dom.makeDOMDriver)('#app'),
  SpeechSynthesis: (0, _speech.makeSpeechSynthesisDriver)(),
  SpeechRecognition: (0, _speech.makeSpeechRecognitionDriver)()
});

},{"@cycle-robot-drivers/speech":67,"@cycle/dom":14,"@cycle/run":24,"@cycle/state":28,"xstream":63}],65:[function(require,module,exports){
"use strict";

var __assign = this && this.__assign || Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
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
    return xstream_1.default.merge(goal$.filter(function (goal) {
        return typeof goal !== 'undefined';
    }).map(function (goal) {
        if (goal === null) {
            return {
                type: InputType.CANCEL,
                value: null
            };
        } else {
            return {
                type: InputType.GOAL,
                value: !!goal.goal_id ? goal : action_1.initGoal(goal)
            };
        }
    }), startEvent$.mapTo({ type: InputType.START, value: null }), endEvent$.mapTo({ type: InputType.END, value: null }), errorEvent$.map(function (event) {
        return { type: InputType.ERROR, value: event };
    }), resultEvent$.map(function (event) {
        return { type: InputType.RESULT, value: event };
    }));
}
var transitionTable = (_a = {}, _a[State.DONE] = (_b = {}, _b[InputType.GOAL] = State.RUNNING, _b), _a[State.RUNNING] = (_c = {}, _c[InputType.GOAL] = State.PREEMPTING, _c[InputType.CANCEL] = State.PREEMPTING, _c[InputType.START] = State.RUNNING, _c[InputType.END] = State.DONE, _c), _a[State.PREEMPTING] = (_d = {}, _d[InputType.END] = State.DONE, _d), _a);
function transition(prevState, prevVariables, input) {
    var states = transitionTable[prevState];
    if (!states) {
        throw new Error("Invalid prevState=\"" + prevState + "\"");
    }
    var state = states[input.type];
    if (!state) {
        console.debug("Undefined transition for \"" + prevState + "\" \"" + input.type + "\"; " + "set state to prevState");
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
                newGoal: null
            },
            outputs: {
                args: goal.goal
            },
            result: null
        };
    } else if (prevState === State.RUNNING && state === State.RUNNING) {
        if (input.type === InputType.RESULT) {
            var event_1 = input.value;
            var last = event_1.results.length - 1;
            var transcript = event_1.results[last][0].transcript;
            return {
                state: state,
                variables: __assign({}, prevVariables, { transcript: transcript }),
                outputs: null,
                result: null
            };
        } else if (input.type === InputType.ERROR) {
            var event_2 = input.value;
            return {
                state: state,
                variables: __assign({}, prevVariables, { error: event_2.error }),
                outputs: null,
                result: null
            };
        }
    } else if (state === State.DONE) {
        if (prevState === State.RUNNING || prevState === State.PREEMPTING) {
            // Stop the current goal and start the queued new goal
            var newGoal = prevVariables.newGoal;
            return {
                state: !!newGoal ? State.RUNNING : state,
                variables: {
                    goal_id: !!newGoal ? newGoal.goal_id : null,
                    transcript: null,
                    error: null,
                    newGoal: null
                },
                outputs: !!newGoal ? {
                    args: newGoal.goal
                } : null,
                result: {
                    status: {
                        goal_id: prevVariables.goal_id,
                        status: prevState === State.RUNNING && !prevVariables.error ? action_1.Status.SUCCEEDED : !!prevVariables.error ? action_1.Status.ABORTED : action_1.Status.PREEMPTED
                    },
                    result: prevState === State.RUNNING && !prevVariables.error ? prevVariables.transcript || '' : // '' for non-speech inputs
                    null
                }
            };
        }
    } else if ((prevState === State.RUNNING || prevState === State.PREEMPTING) && state === State.PREEMPTING) {
        if (input.type === InputType.GOAL || input.type === InputType.CANCEL) {
            // Start stopping the current goal and queue a new goal if received one
            return {
                state: state,
                variables: __assign({}, prevVariables, { newGoal: input.type === InputType.GOAL ? input.value : null }),
                outputs: prevState === State.RUNNING ? {
                    args: null
                } : null,
                result: null
            };
        }
    }
    return {
        state: prevState,
        variables: prevVariables,
        outputs: null,
        result: null
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
                newGoal: null
            },
            outputs: null,
            result: null
        };
    });
    var inputReducer$ = input$.map(function (input) {
        return function inputReducer(prev) {
            return transition(prev.state, prev.variables, input);
        };
    });
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
    var state$ = transitionReducer(input$).fold(function (state, reducer) {
        return reducer(state);
    }, null).drop(1); // drop "null"
    var outputs$ = state$.map(function (state) {
        return state.outputs;
    }).filter(function (outputs) {
        return !!outputs;
    });
    var result$ = state$.map(function (state) {
        return state.result;
    }).filter(function (result) {
        return !!result;
    });
    return {
        output: adapt_1.adapt(outputs$.map(function (outputs) {
            return outputs.args;
        })),
        result: adapt_1.adapt(result$)
    };
}
exports.SpeechRecognitionAction = SpeechRecognitionAction;
var _a, _b, _c, _d;


},{"@cycle-robot-drivers/action":70,"@cycle/run/lib/adapt":73,"xstream":77}],66:[function(require,module,exports){
"use strict";

var __assign = this && this.__assign || Object.assign || function (t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
    }
    return t;
};
var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
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
    return xstream_1.default.merge(goal$.filter(function (goal) {
        return typeof goal !== 'undefined';
    }).map(function (goal) {
        if (goal === null) {
            return {
                type: InputType.CANCEL,
                value: null
            };
        } else {
            var value = !!goal.goal_id ? goal : action_1.initGoal(goal);
            return {
                type: InputType.GOAL,
                value: typeof value.goal === 'string' ? {
                    goal_id: value.goal_id,
                    goal: { text: value.goal }
                } : value
            };
        }
    }), startEvent$.mapTo({ type: InputType.START, value: null }), endEvent$.mapTo({ type: InputType.END, value: null }));
}
var transitionTable = (_a = {}, _a[State.DONE] = (_b = {}, _b[InputType.GOAL] = State.RUNNING, _b), _a[State.RUNNING] = (_c = {}, _c[InputType.GOAL] = State.PREEMPTING, _c[InputType.CANCEL] = State.PREEMPTING, _c[InputType.START] = State.RUNNING, _c[InputType.END] = State.DONE, _c), _a[State.PREEMPTING] = (_d = {}, _d[InputType.END] = State.DONE, _d), _a);
function transition(prevState, prevVariables, input) {
    var states = transitionTable[prevState];
    if (!states) {
        throw new Error("Invalid prevState=\"" + prevState + "\"");
    }
    var state = states[input.type];
    if (!state) {
        console.debug("Undefined transition for \"" + prevState + "\" \"" + input.type + "\"; " + "set state to prevState");
        state = prevState;
    }
    if (prevState === State.DONE && state === State.RUNNING) {
        // Start a new goal
        var goal = input.value;
        return {
            state: state,
            variables: {
                goal_id: goal.goal_id,
                newGoal: null
            },
            outputs: {
                args: goal.goal
            },
            result: null
        };
    } else if (state === State.DONE) {
        if (prevState === State.RUNNING || prevState === State.PREEMPTING) {
            // Stop the current goal and start the queued new goal
            var newGoal = prevVariables.newGoal;
            return {
                state: !!newGoal ? State.RUNNING : state,
                variables: {
                    goal_id: !!newGoal ? newGoal.goal_id : null,
                    newGoal: null
                },
                outputs: !!newGoal ? {
                    args: newGoal.goal
                } : null,
                result: {
                    status: {
                        goal_id: prevVariables.goal_id,
                        status: prevState === State.RUNNING ? action_1.Status.SUCCEEDED : action_1.Status.PREEMPTED
                    },
                    result: null
                }
            };
        }
    } else if ((prevState === State.RUNNING || prevState === State.PREEMPTING) && state === State.PREEMPTING) {
        if (input.type === InputType.GOAL || input.type === InputType.CANCEL) {
            // Start stopping the current goal and queue a new goal if received one
            return {
                state: state,
                variables: __assign({}, prevVariables, { newGoal: input.type === InputType.GOAL ? input.value : null }),
                outputs: {
                    args: null
                },
                result: null
            };
        }
        if (input.type === InputType.START) {
            return {
                state: state,
                variables: prevVariables,
                outputs: {
                    args: null
                },
                result: null
            };
        }
    }
    return {
        state: prevState,
        variables: prevVariables,
        outputs: null,
        result: null
    };
}
function transitionReducer(input$) {
    var initReducer$ = xstream_1.default.of(function initReducer(prev) {
        return {
            state: State.DONE,
            variables: {
                goal_id: null,
                newGoal: null
            },
            outputs: null,
            result: null
        };
    });
    var inputReducer$ = input$.map(function (input) {
        return function inputReducer(prev) {
            return transition(prev.state, prev.variables, input);
        };
    });
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
    var state$ = transitionReducer(input$).fold(function (state, reducer) {
        return reducer(state);
    }, null).drop(1); // drop "null"
    var outputs$ = state$.map(function (state) {
        return state.outputs;
    }).filter(function (outputs) {
        return !!outputs;
    });
    var result$ = state$.map(function (state) {
        return state.result;
    }).filter(function (result) {
        return !!result;
    });
    return {
        output: adapt_1.adapt(outputs$.map(function (outputs) {
            return outputs.args;
        })),
        result: adapt_1.adapt(result$)
    };
}
exports.SpeechSynthesisAction = SpeechSynthesisAction;
;
function input2(goal$, cancel$, startEvent$, endEvent$) {
    return xstream_1.default.merge(goal$.map(function (goal) {
        return {
            type: InputType.GOAL,
            value: typeof goal.goal === 'string' ? {
                goal_id: goal.goal_id,
                goal: { text: goal.goal }
            } : goal
        };
    }), cancel$.mapTo({ type: InputType.CANCEL, value: null }), startEvent$.mapTo({ type: InputType.START, value: null }), endEvent$.mapTo({ type: InputType.END, value: null }));
}
var transitionTable2 = (_e = {}, _e[State.DONE] = (_f = {}, _f[InputType.GOAL] = State.RUNNING, _f), _e[State.RUNNING] = (_g = {}, _g[InputType.GOAL] = State.PREEMPTING, _g[InputType.CANCEL] = State.PREEMPTING, _g[InputType.START] = State.RUNNING, _g[InputType.END] = State.DONE, _g), _e[State.PREEMPTING] = (_h = {}, _h[InputType.END] = State.DONE, _h), _e);
function transition2(prevState, prevVariables, input) {
    var states = transitionTable2[prevState];
    if (!states) {
        throw new Error("Invalid prevState=\"" + prevState + "\"");
    }
    var state = states[input.type];
    if (!state) {
        console.debug("Undefined transition for \"" + prevState + "\" \"" + input.type + "\"; " + "set state to prevState");
        state = prevState;
    }
    if (prevState === State.DONE && state === State.RUNNING) {
        // Start a new goal
        var goal = input.value;
        return {
            state: state,
            variables: {
                goal_id: goal.goal_id,
                newGoal: null
            },
            outputs: {
                SpeechSynthesis: goal.goal
            },
            result: null
        };
    } else if (state === State.DONE) {
        if (prevState === State.RUNNING || prevState === State.PREEMPTING) {
            // Stop the current goal and start the queued new goal
            var newGoal = prevVariables.newGoal;
            return {
                state: !!newGoal ? State.RUNNING : state,
                variables: {
                    goal_id: !!newGoal ? newGoal.goal_id : null,
                    newGoal: null
                },
                outputs: !!newGoal ? {
                    SpeechSynthesis: newGoal.goal
                } : null,
                result: {
                    status: {
                        goal_id: prevVariables.goal_id,
                        status: prevState === State.RUNNING ? action_1.Status.SUCCEEDED : action_1.Status.PREEMPTED
                    },
                    result: null
                }
            };
        }
    } else if ((prevState === State.RUNNING || prevState === State.PREEMPTING) && state === State.PREEMPTING) {
        if (input.type === InputType.GOAL || input.type === InputType.CANCEL) {
            // Start stopping the current goal and queue a new goal if received one
            return {
                state: state,
                variables: __assign({}, prevVariables, { newGoal: input.type === InputType.GOAL ? input.value : null }),
                outputs: {
                    SpeechSynthesis: null
                },
                result: null
            };
        }
        if (input.type === InputType.START) {
            return {
                state: state,
                variables: prevVariables,
                outputs: {
                    args: null
                },
                result: null
            };
        }
    }
    return {
        state: prevState,
        variables: prevVariables,
        outputs: null,
        result: null
    };
}
function transitionReducer2(input$) {
    var initReducer$ = xstream_1.default.of(function initReducer(prev) {
        return {
            state: State.DONE,
            variables: {
                goal_id: null,
                newGoal: null
            },
            outputs: null,
            result: null
        };
    });
    var inputReducer$ = input$.map(function (input) {
        return function inputReducer(prev) {
            return transition2(prev.state, prev.variables, input);
        };
    });
    return xstream_1.default.merge(initReducer$, inputReducer$);
}
// function output(reducerState$) {
//   const outputs$ = reducerState$
//     .filter(m => !!m.outputs)
//     .map(m => m.outputs);
//   return {
//     status: xs.never(),
//     result: outputs$
//       .filter(o => !!o.result)
//       .map(o => o.result),
//     MonologueAction: outputs$
//       .filter(o => !!o.MonologueAction)
//       .map(o => o.MonologueAction.goal)
//       .compose(dropRepeats(isEqualGoal)),
//   };
// };
function SpeechSynthesisAction2(sources) {
    // const outputs = output(sources.state.stream);
    var input$ = input2(xstream_1.default.fromObservable(sources.goal), xstream_1.default.fromObservable(sources.cancel), xstream_1.default.fromObservable(sources.SpeechSynthesis.events('start')), xstream_1.default.fromObservable(sources.SpeechSynthesis.events('end')));
    var reducer = transitionReducer2(input$);
    return {
        state: reducer,
        status: xstream_1.default.never(),
        result: sources.state.stream.map(function (rs) {
            return rs.result;
        }),
        SpeechSynthesis: sources.state.stream.debug() // TODO: create more abstract function
        .filter(function (rs) {
            return !!rs.outputs;
        }).map(function (rs) {
            return rs.outputs.SpeechSynthesis;
        })
    };
}
exports.SpeechSynthesisAction2 = SpeechSynthesisAction2;
var _a, _b, _c, _d, _e, _f, _g, _h;


},{"@cycle-robot-drivers/action":70,"@cycle/run/lib/adapt":73,"xstream":77}],67:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var makeSpeechSynthesisDriver_1 = require("./makeSpeechSynthesisDriver");
exports.makeSpeechSynthesisDriver = makeSpeechSynthesisDriver_1.makeSpeechSynthesisDriver;
var SpeechSynthesisAction_1 = require("./SpeechSynthesisAction");
exports.SpeechSynthesisAction = SpeechSynthesisAction_1.SpeechSynthesisAction;
exports.SpeechSynthesisAction2 = SpeechSynthesisAction_1.SpeechSynthesisAction2;
var makeSpeechRecognitionDriver_1 = require("./makeSpeechRecognitionDriver");
exports.makeSpeechRecognitionDriver = makeSpeechRecognitionDriver_1.makeSpeechRecognitionDriver;
var SpeechRecognitionAction_1 = require("./SpeechRecognitionAction");
exports.SpeechRecognitionAction = SpeechRecognitionAction_1.SpeechRecognitionAction;


},{"./SpeechRecognitionAction":65,"./SpeechSynthesisAction":66,"./makeSpeechRecognitionDriver":68,"./makeSpeechSynthesisDriver":69}],68:[function(require,module,exports){
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fromEvent_1 = __importDefault(require("xstream/extra/fromEvent"));
var adapt_1 = require("@cycle/run/lib/adapt");
var RecognitionSource = /** @class */function () {
    function RecognitionSource(_recognition) {
        this._recognition = _recognition;
    }
    RecognitionSource.prototype.events = function (eventName) {
        return adapt_1.adapt(fromEvent_1.default(this._recognition, eventName));
    };
    return RecognitionSource;
}();
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
                } else {
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


},{"@cycle/run/lib/adapt":73,"xstream/extra/fromEvent":76}],69:[function(require,module,exports){
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fromEvent_1 = __importDefault(require("xstream/extra/fromEvent"));
var adapt_1 = require("@cycle/run/lib/adapt");
var UtteranceSource = /** @class */function () {
    function UtteranceSource(_utterance) {
        this._utterance = _utterance;
    }
    UtteranceSource.prototype.events = function (eventName) {
        return adapt_1.adapt(fromEvent_1.default(this._utterance, eventName));
    };
    return UtteranceSource;
}();
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
                } else {
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


},{"@cycle/run/lib/adapt":73,"xstream/extra/fromEvent":76}],70:[function(require,module,exports){
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

},{"./types":71,"./utils":72}],71:[function(require,module,exports){
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

},{}],72:[function(require,module,exports){
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

},{}],73:[function(require,module,exports){
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

},{}],74:[function(require,module,exports){
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

},{"./ponyfill.js":75}],75:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"dup":54}],76:[function(require,module,exports){
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

},{"../index":77}],77:[function(require,module,exports){
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

},{"symbol-observable":74}]},{},[64])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0JvZHlET01Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0RvY3VtZW50RE9NU291cmNlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9FbGVtZW50RmluZGVyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9FdmVudERlbGVnYXRvci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvSXNvbGF0ZU1vZHVsZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvTWFpbkRPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvUHJpb3JpdHlRdWV1ZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvUmVtb3ZhbFNldC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvU2NvcGVDaGVja2VyLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9TeW1ib2xUcmVlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9WTm9kZVdyYXBwZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL2Zyb21FdmVudC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaHlwZXJzY3JpcHQtaGVscGVycy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL2lzb2xhdGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21ha2VET01Ecml2ZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21vY2tET01Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL21vZHVsZXMuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL3RodW5rLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy91dGlscy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvaXNvbGF0ZS9saWIvY2pzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9hZGFwdC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2ludGVybmFscy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvc3RhdGUvbGliL2Nqcy9Db2xsZWN0aW9uLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL1N0YXRlU291cmNlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL3BpY2tDb21iaW5lLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL3BpY2tNZXJnZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvc3RhdGUvbGliL2Nqcy93aXRoU3RhdGUuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL3F1aWNrdGFzay9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvY2xhc3NOYW1lRnJvbVZOb2RlLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9jdXJyeTIuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL2ZpbmRNYXRjaGVzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvcGFyZW50LXN5bWJvbC5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvcXVlcnkuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL3NlbGVjdG9yUGFyc2VyLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL2guanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vaHRtbGRvbWFwaS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9pcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL2F0dHJpYnV0ZXMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9jbGFzcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL2RhdGFzZXQuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9wcm9wcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9tb2R1bGVzL3N0eWxlLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3NuYWJiZG9tLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3RodW5rLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3Rvdm5vZGUuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vdm5vZGUuanMiLCJub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9wb255ZmlsbC5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3RyZWUtc2VsZWN0b3IvbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvbWF0Y2hlcy5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvcXVlcnlTZWxlY3Rvci5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvc2VsZWN0b3JQYXJzZXIuanMiLCJub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvZXh0cmEvY29uY2F0LnRzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2Ryb3BSZXBlYXRzLnRzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL3NhbXBsZUNvbWJpbmUudHMiLCJub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvaW5kZXgudHMiLCJzcmMvaW5kZXguanMiLCIuLi8uLi8uLi9zcGVlY2gvbGliL2Nqcy9TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbi5qcyIsIi4uLy4uLy4uL3NwZWVjaC9saWIvY2pzL1NwZWVjaFN5bnRoZXNpc0FjdGlvbi5qcyIsIi4uLy4uLy4uL3NwZWVjaC9saWIvY2pzL2luZGV4LmpzIiwiLi4vLi4vLi4vc3BlZWNoL2xpYi9janMvbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyLmpzIiwiLi4vLi4vLi4vc3BlZWNoL2xpYi9janMvbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlci5qcyIsIi4uLy4uLy4uL3NwZWVjaC9ub2RlX21vZHVsZXMvQGN5Y2xlLXJvYm90LWRyaXZlcnMvYWN0aW9uL2xpYi9janMvaW5kZXguanMiLCIuLi8uLi8uLi9zcGVlY2gvbm9kZV9tb2R1bGVzL0BjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvbi9saWIvY2pzL3R5cGVzLmpzIiwiLi4vLi4vLi4vc3BlZWNoL25vZGVfbW9kdWxlcy9AY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb24vbGliL2Nqcy91dGlscy5qcyIsIi4uLy4uLy4uL3NwZWVjaC9ub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCIuLi8uLi8uLi9zcGVlY2gvbm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9pbmRleC5qcyIsIi4uLy4uLy4uL3NwZWVjaC9ub2RlX21vZHVsZXMveHN0cmVhbS9zcmMvZXh0cmEvZnJvbUV2ZW50LnRzIiwiLi4vLi4vLi4vc3BlZWNoL25vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2VEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QXhFQSxBQXdFQyxDQXhFb0MsTUFBTSxHQXdFMUM7QUF4RVksb0NBQVk7QUEyRXpCLElBQU0sRUFBRSxHQUFHLE1BQU0sQ0FBQztBQUVsQixrQkFBZSxFQUFFLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGZyb21FdmVudF8xID0gcmVxdWlyZShcIi4vZnJvbUV2ZW50XCIpO1xudmFyIEJvZHlET01Tb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQm9keURPTVNvdXJjZShfbmFtZSkge1xuICAgICAgICB0aGlzLl9uYW1lID0gX25hbWU7XG4gICAgfVxuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uYWxpdHkgaXMgc3RpbGwgdW5kZWZpbmVkL3VuZGVjaWRlZC5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBCb2R5RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQub2YoW2RvY3VtZW50LmJvZHldKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBCb2R5RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5vZihkb2N1bWVudC5ib2R5KSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBCb2R5RE9NU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBvcHRpb25zLCBidWJibGVzKSB7XG4gICAgICAgIGlmIChvcHRpb25zID09PSB2b2lkIDApIHsgb3B0aW9ucyA9IHt9OyB9XG4gICAgICAgIHZhciBzdHJlYW07XG4gICAgICAgIHN0cmVhbSA9IGZyb21FdmVudF8xLmZyb21FdmVudChkb2N1bWVudC5ib2R5LCBldmVudFR5cGUsIG9wdGlvbnMudXNlQ2FwdHVyZSwgb3B0aW9ucy5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHN0cmVhbSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICByZXR1cm4gQm9keURPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLkJvZHlET01Tb3VyY2UgPSBCb2R5RE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Qm9keURPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGZyb21FdmVudF8xID0gcmVxdWlyZShcIi4vZnJvbUV2ZW50XCIpO1xudmFyIERvY3VtZW50RE9NU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERvY3VtZW50RE9NU291cmNlKF9uYW1lKSB7XG4gICAgICAgIHRoaXMuX25hbWUgPSBfbmFtZTtcbiAgICB9XG4gICAgRG9jdW1lbnRET01Tb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICAvLyBUaGlzIGZ1bmN0aW9uYWxpdHkgaXMgc3RpbGwgdW5kZWZpbmVkL3VuZGVjaWRlZC5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcbiAgICBEb2N1bWVudERPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0Lm9mKFtkb2N1bWVudF0pKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIERvY3VtZW50RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5vZihkb2N1bWVudCkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgRG9jdW1lbnRET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMsIGJ1YmJsZXMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdmFyIHN0cmVhbTtcbiAgICAgICAgc3RyZWFtID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KGRvY3VtZW50LCBldmVudFR5cGUsIG9wdGlvbnMudXNlQ2FwdHVyZSwgb3B0aW9ucy5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHN0cmVhbSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICByZXR1cm4gRG9jdW1lbnRET01Tb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5Eb2N1bWVudERPTVNvdXJjZSA9IERvY3VtZW50RE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RG9jdW1lbnRET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU2NvcGVDaGVja2VyXzEgPSByZXF1aXJlKFwiLi9TY29wZUNoZWNrZXJcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuZnVuY3Rpb24gdG9FbEFycmF5KGlucHV0KSB7XG4gICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGlucHV0KTtcbn1cbnZhciBFbGVtZW50RmluZGVyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEVsZW1lbnRGaW5kZXIobmFtZXNwYWNlLCBpc29sYXRlTW9kdWxlKSB7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlID0gbmFtZXNwYWNlO1xuICAgICAgICB0aGlzLmlzb2xhdGVNb2R1bGUgPSBpc29sYXRlTW9kdWxlO1xuICAgIH1cbiAgICBFbGVtZW50RmluZGVyLnByb3RvdHlwZS5jYWxsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbmFtZXNwYWNlID0gdGhpcy5uYW1lc3BhY2U7XG4gICAgICAgIHZhciBzZWxlY3RvciA9IHV0aWxzXzEuZ2V0U2VsZWN0b3JzKG5hbWVzcGFjZSk7XG4gICAgICAgIHZhciBzY29wZUNoZWNrZXIgPSBuZXcgU2NvcGVDaGVja2VyXzEuU2NvcGVDaGVja2VyKG5hbWVzcGFjZSwgdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgdmFyIHRvcE5vZGUgPSB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0RWxlbWVudChuYW1lc3BhY2UuZmlsdGVyKGZ1bmN0aW9uIChuKSB7IHJldHVybiBuLnR5cGUgIT09ICdzZWxlY3Rvcic7IH0pKTtcbiAgICAgICAgaWYgKHRvcE5vZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3RvciA9PT0gJycpIHtcbiAgICAgICAgICAgIHJldHVybiBbdG9wTm9kZV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvRWxBcnJheSh0b3BOb2RlLnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpKVxuICAgICAgICAgICAgLmZpbHRlcihzY29wZUNoZWNrZXIuaXNEaXJlY3RseUluU2NvcGUsIHNjb3BlQ2hlY2tlcilcbiAgICAgICAgICAgIC5jb25jYXQodG9wTm9kZS5tYXRjaGVzKHNlbGVjdG9yKSA/IFt0b3BOb2RlXSA6IFtdKTtcbiAgICB9O1xuICAgIHJldHVybiBFbGVtZW50RmluZGVyO1xufSgpKTtcbmV4cG9ydHMuRWxlbWVudEZpbmRlciA9IEVsZW1lbnRGaW5kZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1FbGVtZW50RmluZGVyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBTY29wZUNoZWNrZXJfMSA9IHJlcXVpcmUoXCIuL1Njb3BlQ2hlY2tlclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgRWxlbWVudEZpbmRlcl8xID0gcmVxdWlyZShcIi4vRWxlbWVudEZpbmRlclwiKTtcbnZhciBTeW1ib2xUcmVlXzEgPSByZXF1aXJlKFwiLi9TeW1ib2xUcmVlXCIpO1xudmFyIFJlbW92YWxTZXRfMSA9IHJlcXVpcmUoXCIuL1JlbW92YWxTZXRcIik7XG52YXIgUHJpb3JpdHlRdWV1ZV8xID0gcmVxdWlyZShcIi4vUHJpb3JpdHlRdWV1ZVwiKTtcbnZhciBmcm9tRXZlbnRfMSA9IHJlcXVpcmUoXCIuL2Zyb21FdmVudFwiKTtcbmV4cG9ydHMuZXZlbnRUeXBlc1RoYXREb250QnViYmxlID0gW1xuICAgIFwiYmx1clwiLFxuICAgIFwiY2FucGxheVwiLFxuICAgIFwiY2FucGxheXRocm91Z2hcIixcbiAgICBcImR1cmF0aW9uY2hhbmdlXCIsXG4gICAgXCJlbXB0aWVkXCIsXG4gICAgXCJlbmRlZFwiLFxuICAgIFwiZm9jdXNcIixcbiAgICBcImxvYWRcIixcbiAgICBcImxvYWRlZGRhdGFcIixcbiAgICBcImxvYWRlZG1ldGFkYXRhXCIsXG4gICAgXCJtb3VzZWVudGVyXCIsXG4gICAgXCJtb3VzZWxlYXZlXCIsXG4gICAgXCJwYXVzZVwiLFxuICAgIFwicGxheVwiLFxuICAgIFwicGxheWluZ1wiLFxuICAgIFwicmF0ZWNoYW5nZVwiLFxuICAgIFwicmVzZXRcIixcbiAgICBcInNjcm9sbFwiLFxuICAgIFwic2Vla2VkXCIsXG4gICAgXCJzZWVraW5nXCIsXG4gICAgXCJzdGFsbGVkXCIsXG4gICAgXCJzdWJtaXRcIixcbiAgICBcInN1c3BlbmRcIixcbiAgICBcInRpbWV1cGRhdGVcIixcbiAgICBcInVubG9hZFwiLFxuICAgIFwidm9sdW1lY2hhbmdlXCIsXG4gICAgXCJ3YWl0aW5nXCIsXG5dO1xuLyoqXG4gKiBNYW5hZ2VzIFwiRXZlbnQgZGVsZWdhdGlvblwiLCBieSBjb25uZWN0aW5nIGFuIG9yaWdpbiB3aXRoIG11bHRpcGxlXG4gKiBkZXN0aW5hdGlvbnMuXG4gKlxuICogQXR0YWNoZXMgYSBET00gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIERPTSBlbGVtZW50IGNhbGxlZCB0aGUgXCJvcmlnaW5cIixcbiAqIGFuZCBkZWxlZ2F0ZXMgZXZlbnRzIHRvIFwiZGVzdGluYXRpb25zXCIsIHdoaWNoIGFyZSBzdWJqZWN0cyBhcyBvdXRwdXRzXG4gKiBmb3IgdGhlIERPTVNvdXJjZS4gU2ltdWxhdGVzIGJ1YmJsaW5nIG9yIGNhcHR1cmluZywgd2l0aCByZWdhcmRzIHRvXG4gKiBpc29sYXRpb24gYm91bmRhcmllcyB0b28uXG4gKi9cbnZhciBFdmVudERlbGVnYXRvciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBFdmVudERlbGVnYXRvcihyb290RWxlbWVudCQsIGlzb2xhdGVNb2R1bGUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCQgPSByb290RWxlbWVudCQ7XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZSA9IGlzb2xhdGVNb2R1bGU7XG4gICAgICAgIHRoaXMudmlydHVhbExpc3RlbmVycyA9IG5ldyBTeW1ib2xUcmVlXzEuZGVmYXVsdChmdW5jdGlvbiAoeCkgeyByZXR1cm4geC5zY29wZTsgfSk7XG4gICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnNUb0FkZCA9IG5ldyBSZW1vdmFsU2V0XzEuZGVmYXVsdCgpO1xuICAgICAgICB0aGlzLnZpcnR1YWxOb25CdWJibGluZ0xpc3RlbmVyID0gW107XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZS5zZXRFdmVudERlbGVnYXRvcih0aGlzKTtcbiAgICAgICAgdGhpcy5kb21MaXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuZG9tTGlzdGVuZXJzVG9BZGQgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHJvb3RFbGVtZW50JC5hZGRMaXN0ZW5lcih7XG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICBpZiAoX3RoaXMub3JpZ2luICE9PSBlbCkge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5vcmlnaW4gPSBlbDtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMucmVzZXRFdmVudExpc3RlbmVycygpO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5kb21MaXN0ZW5lcnNUb0FkZC5mb3JFYWNoKGZ1bmN0aW9uIChwYXNzaXZlLCB0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMuc2V0dXBET01MaXN0ZW5lcih0eXBlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmRvbUxpc3RlbmVyc1RvQWRkLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF90aGlzLnJlc2V0Tm9uQnViYmxpbmdMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy5ub25CdWJibGluZ0xpc3RlbmVyc1RvQWRkLmZvckVhY2goZnVuY3Rpb24gKGFycikge1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5zZXR1cE5vbkJ1YmJsaW5nTGlzdGVuZXIoYXJyKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG5hbWVzcGFjZSwgb3B0aW9ucywgYnViYmxlcykge1xuICAgICAgICB2YXIgc3ViamVjdCA9IHhzdHJlYW1fMS5kZWZhdWx0Lm5ldmVyKCk7XG4gICAgICAgIHZhciBzY29wZUNoZWNrZXIgPSBuZXcgU2NvcGVDaGVja2VyXzEuU2NvcGVDaGVja2VyKG5hbWVzcGFjZSwgdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgdmFyIGRlc3QgPSB0aGlzLmluc2VydExpc3RlbmVyKHN1YmplY3QsIHNjb3BlQ2hlY2tlciwgZXZlbnRUeXBlLCBvcHRpb25zKTtcbiAgICAgICAgdmFyIHNob3VsZEJ1YmJsZSA9IGJ1YmJsZXMgPT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgPyBleHBvcnRzLmV2ZW50VHlwZXNUaGF0RG9udEJ1YmJsZS5pbmRleE9mKGV2ZW50VHlwZSkgPT09IC0xXG4gICAgICAgICAgICA6IGJ1YmJsZXM7XG4gICAgICAgIGlmIChzaG91bGRCdWJibGUpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5kb21MaXN0ZW5lcnMuaGFzKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldHVwRE9NTGlzdGVuZXIoZXZlbnRUeXBlLCAhIW9wdGlvbnMucGFzc2l2ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgZmluZGVyID0gbmV3IEVsZW1lbnRGaW5kZXJfMS5FbGVtZW50RmluZGVyKG5hbWVzcGFjZSwgdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgICAgIHRoaXMuc2V0dXBOb25CdWJibGluZ0xpc3RlbmVyKFtldmVudFR5cGUsIGZpbmRlciwgZGVzdF0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzdWJqZWN0O1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnJlbW92ZUVsZW1lbnQgPSBmdW5jdGlvbiAoZWxlbWVudCwgbmFtZXNwYWNlKSB7XG4gICAgICAgIGlmIChuYW1lc3BhY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy52aXJ0dWFsTGlzdGVuZXJzLmRlbGV0ZShuYW1lc3BhY2UpO1xuICAgICAgICB9XG4gICAgICAgIHZhciB0b1JlbW92ZSA9IFtdO1xuICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKG1hcCwgdHlwZSkge1xuICAgICAgICAgICAgaWYgKG1hcC5oYXMoZWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICB0b1JlbW92ZS5wdXNoKFt0eXBlLCBlbGVtZW50XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRvUmVtb3ZlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5nZXQodG9SZW1vdmVbaV1bMF0pO1xuICAgICAgICAgICAgaWYgKCFtYXApIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1hcC5kZWxldGUodG9SZW1vdmVbaV1bMV0pO1xuICAgICAgICAgICAgaWYgKG1hcC5zaXplID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5kZWxldGUodG9SZW1vdmVbaV1bMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5zZXQodG9SZW1vdmVbaV1bMF0sIG1hcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5pbnNlcnRMaXN0ZW5lciA9IGZ1bmN0aW9uIChzdWJqZWN0LCBzY29wZUNoZWNrZXIsIGV2ZW50VHlwZSwgb3B0aW9ucykge1xuICAgICAgICB2YXIgcmVsZXZhbnRTZXRzID0gW107XG4gICAgICAgIHZhciBuID0gc2NvcGVDaGVja2VyLl9uYW1lc3BhY2U7XG4gICAgICAgIHZhciBtYXggPSBuLmxlbmd0aDtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgcmVsZXZhbnRTZXRzLnB1c2godGhpcy5nZXRWaXJ0dWFsTGlzdGVuZXJzKGV2ZW50VHlwZSwgbiwgdHJ1ZSwgbWF4KSk7XG4gICAgICAgICAgICBtYXgtLTtcbiAgICAgICAgfSB3aGlsZSAobWF4ID49IDAgJiYgblttYXhdLnR5cGUgIT09ICd0b3RhbCcpO1xuICAgICAgICB2YXIgZGVzdGluYXRpb24gPSBfX2Fzc2lnbih7fSwgb3B0aW9ucywgeyBzY29wZUNoZWNrZXI6IHNjb3BlQ2hlY2tlcixcbiAgICAgICAgICAgIHN1YmplY3Q6IHN1YmplY3QsIGJ1YmJsZXM6ICEhb3B0aW9ucy5idWJibGVzLCB1c2VDYXB0dXJlOiAhIW9wdGlvbnMudXNlQ2FwdHVyZSwgcGFzc2l2ZTogISFvcHRpb25zLnBhc3NpdmUgfSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmVsZXZhbnRTZXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZWxldmFudFNldHNbaV0uYWRkKGRlc3RpbmF0aW9uLCBuLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRlc3RpbmF0aW9uO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhIHNldCBvZiBhbGwgdmlydHVhbCBsaXN0ZW5lcnMgaW4gdGhlIHNjb3BlIG9mIHRoZSBuYW1lc3BhY2VcbiAgICAgKiBTZXQgYGV4YWN0YCB0byB0cnVlIHRvIHRyZWF0IHNpYmlsaW5nIGlzb2xhdGVkIHNjb3BlcyBhcyB0b3RhbCBzY29wZXNcbiAgICAgKi9cbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuZ2V0VmlydHVhbExpc3RlbmVycyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG5hbWVzcGFjZSwgZXhhY3QsIG1heCkge1xuICAgICAgICBpZiAoZXhhY3QgPT09IHZvaWQgMCkgeyBleGFjdCA9IGZhbHNlOyB9XG4gICAgICAgIHZhciBfbWF4ID0gbWF4ICE9PSB1bmRlZmluZWQgPyBtYXggOiBuYW1lc3BhY2UubGVuZ3RoO1xuICAgICAgICBpZiAoIWV4YWN0KSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gX21heCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVzcGFjZVtpXS50eXBlID09PSAndG90YWwnKSB7XG4gICAgICAgICAgICAgICAgICAgIF9tYXggPSBpICsgMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF9tYXggPSBpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBtYXAgPSB0aGlzLnZpcnR1YWxMaXN0ZW5lcnMuZ2V0RGVmYXVsdChuYW1lc3BhY2UsIGZ1bmN0aW9uICgpIHsgcmV0dXJuIG5ldyBNYXAoKTsgfSwgX21heCk7XG4gICAgICAgIGlmICghbWFwLmhhcyhldmVudFR5cGUpKSB7XG4gICAgICAgICAgICBtYXAuc2V0KGV2ZW50VHlwZSwgbmV3IFByaW9yaXR5UXVldWVfMS5kZWZhdWx0KCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXAuZ2V0KGV2ZW50VHlwZSk7XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuc2V0dXBET01MaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudFR5cGUsIHBhc3NpdmUpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgaWYgKHRoaXMub3JpZ2luKSB7XG4gICAgICAgICAgICB2YXIgc3ViID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KHRoaXMub3JpZ2luLCBldmVudFR5cGUsIGZhbHNlLCBmYWxzZSwgcGFzc2l2ZSkuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoZXZlbnQpIHsgcmV0dXJuIF90aGlzLm9uRXZlbnQoZXZlbnRUeXBlLCBldmVudCwgcGFzc2l2ZSk7IH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmRvbUxpc3RlbmVycy5zZXQoZXZlbnRUeXBlLCB7IHN1Yjogc3ViLCBwYXNzaXZlOiBwYXNzaXZlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5kb21MaXN0ZW5lcnNUb0FkZC5zZXQoZXZlbnRUeXBlLCBwYXNzaXZlKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnNldHVwTm9uQnViYmxpbmdMaXN0ZW5lciA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgZXZlbnRUeXBlID0gaW5wdXRbMF0sIGVsZW1lbnRGaW5kZXIgPSBpbnB1dFsxXSwgZGVzdGluYXRpb24gPSBpbnB1dFsyXTtcbiAgICAgICAgaWYgKCF0aGlzLm9yaWdpbikge1xuICAgICAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVyc1RvQWRkLmFkZChpbnB1dCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVsZW1lbnQgPSBlbGVtZW50RmluZGVyLmNhbGwoKVswXTtcbiAgICAgICAgaWYgKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnNUb0FkZC5kZWxldGUoaW5wdXQpO1xuICAgICAgICAgICAgdmFyIHN1YiA9IGZyb21FdmVudF8xLmZyb21FdmVudChlbGVtZW50LCBldmVudFR5cGUsIGZhbHNlLCBmYWxzZSwgZGVzdGluYXRpb24ucGFzc2l2ZSkuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoZXYpIHsgcmV0dXJuIF90aGlzLm9uRXZlbnQoZXZlbnRUeXBlLCBldiwgISFkZXN0aW5hdGlvbi5wYXNzaXZlLCBmYWxzZSk7IH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIXRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuaGFzKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLnNldChldmVudFR5cGUsIG5ldyBNYXAoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbWFwID0gdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5nZXQoZXZlbnRUeXBlKTtcbiAgICAgICAgICAgIGlmICghbWFwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFwLnNldChlbGVtZW50LCB7IHN1Yjogc3ViLCBkZXN0aW5hdGlvbjogZGVzdGluYXRpb24gfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzVG9BZGQuYWRkKGlucHV0KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnJlc2V0RXZlbnRMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpdGVyID0gdGhpcy5kb21MaXN0ZW5lcnMuZW50cmllcygpO1xuICAgICAgICB2YXIgY3VyciA9IGl0ZXIubmV4dCgpO1xuICAgICAgICB3aGlsZSAoIWN1cnIuZG9uZSkge1xuICAgICAgICAgICAgdmFyIF9hID0gY3Vyci52YWx1ZSwgdHlwZSA9IF9hWzBdLCBfYiA9IF9hWzFdLCBzdWIgPSBfYi5zdWIsIHBhc3NpdmUgPSBfYi5wYXNzaXZlO1xuICAgICAgICAgICAgc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICB0aGlzLnNldHVwRE9NTGlzdGVuZXIodHlwZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICBjdXJyID0gaXRlci5uZXh0KCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5yZXNldE5vbkJ1YmJsaW5nTGlzdGVuZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB2YXIgbmV3TWFwID0gbmV3IE1hcCgpO1xuICAgICAgICB2YXIgaW5zZXJ0ID0gdXRpbHNfMS5tYWtlSW5zZXJ0KG5ld01hcCk7XG4gICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAobWFwLCB0eXBlKSB7XG4gICAgICAgICAgICBtYXAuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUsIGVsbSkge1xuICAgICAgICAgICAgICAgIGlmICghZG9jdW1lbnQuYm9keS5jb250YWlucyhlbG0pKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdWIgPSB2YWx1ZS5zdWIsIGRlc3RpbmF0aW9uXzEgPSB2YWx1ZS5kZXN0aW5hdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN1Yikge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGVsZW1lbnRGaW5kZXIgPSBuZXcgRWxlbWVudEZpbmRlcl8xLkVsZW1lbnRGaW5kZXIoZGVzdGluYXRpb25fMS5zY29wZUNoZWNrZXIubmFtZXNwYWNlLCBfdGhpcy5pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0VsbSA9IGVsZW1lbnRGaW5kZXIuY2FsbCgpWzBdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3U3ViID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KG5ld0VsbSwgdHlwZSwgZmFsc2UsIGZhbHNlLCBkZXN0aW5hdGlvbl8xLnBhc3NpdmUpLnN1YnNjcmliZSh7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX3RoaXMub25FdmVudCh0eXBlLCBldmVudCwgISFkZXN0aW5hdGlvbl8xLnBhc3NpdmUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGluc2VydCh0eXBlLCBuZXdFbG0sIHsgc3ViOiBuZXdTdWIsIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbl8xIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0KHR5cGUsIGVsbSwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgX3RoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMgPSBuZXdNYXA7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnB1dE5vbkJ1YmJsaW5nTGlzdGVuZXIgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBlbG0sIHVzZUNhcHR1cmUsIHBhc3NpdmUpIHtcbiAgICAgICAgdmFyIG1hcCA9IHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuZ2V0KGV2ZW50VHlwZSk7XG4gICAgICAgIGlmICghbWFwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGxpc3RlbmVyID0gbWFwLmdldChlbG0pO1xuICAgICAgICBpZiAobGlzdGVuZXIgJiZcbiAgICAgICAgICAgIGxpc3RlbmVyLmRlc3RpbmF0aW9uLnBhc3NpdmUgPT09IHBhc3NpdmUgJiZcbiAgICAgICAgICAgIGxpc3RlbmVyLmRlc3RpbmF0aW9uLnVzZUNhcHR1cmUgPT09IHVzZUNhcHR1cmUpIHtcbiAgICAgICAgICAgIHRoaXMudmlydHVhbE5vbkJ1YmJsaW5nTGlzdGVuZXJbMF0gPSBsaXN0ZW5lci5kZXN0aW5hdGlvbjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLm9uRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBldmVudCwgcGFzc2l2ZSwgYnViYmxlcykge1xuICAgICAgICBpZiAoYnViYmxlcyA9PT0gdm9pZCAwKSB7IGJ1YmJsZXMgPSB0cnVlOyB9XG4gICAgICAgIHZhciBjeWNsZUV2ZW50ID0gdGhpcy5wYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgICAgdmFyIHJvb3RFbGVtZW50ID0gdGhpcy5pc29sYXRlTW9kdWxlLmdldFJvb3RFbGVtZW50KGV2ZW50LnRhcmdldCk7XG4gICAgICAgIGlmIChidWJibGVzKSB7XG4gICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gdGhpcy5pc29sYXRlTW9kdWxlLmdldE5hbWVzcGFjZShldmVudC50YXJnZXQpO1xuICAgICAgICAgICAgaWYgKCFuYW1lc3BhY2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbGlzdGVuZXJzID0gdGhpcy5nZXRWaXJ0dWFsTGlzdGVuZXJzKGV2ZW50VHlwZSwgbmFtZXNwYWNlKTtcbiAgICAgICAgICAgIHRoaXMuYnViYmxlKGV2ZW50VHlwZSwgZXZlbnQudGFyZ2V0LCByb290RWxlbWVudCwgY3ljbGVFdmVudCwgbGlzdGVuZXJzLCBuYW1lc3BhY2UsIG5hbWVzcGFjZS5sZW5ndGggLSAxLCB0cnVlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgIHRoaXMuYnViYmxlKGV2ZW50VHlwZSwgZXZlbnQudGFyZ2V0LCByb290RWxlbWVudCwgY3ljbGVFdmVudCwgbGlzdGVuZXJzLCBuYW1lc3BhY2UsIG5hbWVzcGFjZS5sZW5ndGggLSAxLCBmYWxzZSwgcGFzc2l2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnB1dE5vbkJ1YmJsaW5nTGlzdGVuZXIoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIHRydWUsIHBhc3NpdmUpO1xuICAgICAgICAgICAgdGhpcy5kb0J1YmJsZVN0ZXAoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIHJvb3RFbGVtZW50LCBjeWNsZUV2ZW50LCB0aGlzLnZpcnR1YWxOb25CdWJibGluZ0xpc3RlbmVyLCB0cnVlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgIHRoaXMucHV0Tm9uQnViYmxpbmdMaXN0ZW5lcihldmVudFR5cGUsIGV2ZW50LnRhcmdldCwgZmFsc2UsIHBhc3NpdmUpO1xuICAgICAgICAgICAgdGhpcy5kb0J1YmJsZVN0ZXAoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIHJvb3RFbGVtZW50LCBjeWNsZUV2ZW50LCB0aGlzLnZpcnR1YWxOb25CdWJibGluZ0xpc3RlbmVyLCBmYWxzZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgLy9maXggcmVzZXQgZXZlbnQgKHNwZWMnZWQgYXMgbm9uLWJ1YmJsaW5nLCBidXQgYnViYmxlcyBpbiByZWFsaXR5XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5idWJibGUgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBlbG0sIHJvb3RFbGVtZW50LCBldmVudCwgbGlzdGVuZXJzLCBuYW1lc3BhY2UsIGluZGV4LCB1c2VDYXB0dXJlLCBwYXNzaXZlKSB7XG4gICAgICAgIGlmICghdXNlQ2FwdHVyZSAmJiAhZXZlbnQucHJvcGFnYXRpb25IYXNCZWVuU3RvcHBlZCkge1xuICAgICAgICAgICAgdGhpcy5kb0J1YmJsZVN0ZXAoZXZlbnRUeXBlLCBlbG0sIHJvb3RFbGVtZW50LCBldmVudCwgbGlzdGVuZXJzLCB1c2VDYXB0dXJlLCBwYXNzaXZlKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmV3Um9vdCA9IHJvb3RFbGVtZW50O1xuICAgICAgICB2YXIgbmV3SW5kZXggPSBpbmRleDtcbiAgICAgICAgaWYgKGVsbSA9PT0gcm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIGlmIChpbmRleCA+PSAwICYmIG5hbWVzcGFjZVtpbmRleF0udHlwZSA9PT0gJ3NpYmxpbmcnKSB7XG4gICAgICAgICAgICAgICAgbmV3Um9vdCA9IHRoaXMuaXNvbGF0ZU1vZHVsZS5nZXRFbGVtZW50KG5hbWVzcGFjZSwgaW5kZXgpO1xuICAgICAgICAgICAgICAgIG5ld0luZGV4LS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVsbS5wYXJlbnROb2RlICYmIG5ld1Jvb3QpIHtcbiAgICAgICAgICAgIHRoaXMuYnViYmxlKGV2ZW50VHlwZSwgZWxtLnBhcmVudE5vZGUsIG5ld1Jvb3QsIGV2ZW50LCBsaXN0ZW5lcnMsIG5hbWVzcGFjZSwgbmV3SW5kZXgsIHVzZUNhcHR1cmUsIHBhc3NpdmUpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1c2VDYXB0dXJlICYmICFldmVudC5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkKSB7XG4gICAgICAgICAgICB0aGlzLmRvQnViYmxlU3RlcChldmVudFR5cGUsIGVsbSwgcm9vdEVsZW1lbnQsIGV2ZW50LCBsaXN0ZW5lcnMsIHVzZUNhcHR1cmUsIHBhc3NpdmUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuZG9CdWJibGVTdGVwID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgZWxtLCByb290RWxlbWVudCwgZXZlbnQsIGxpc3RlbmVycywgdXNlQ2FwdHVyZSwgcGFzc2l2ZSkge1xuICAgICAgICBpZiAoIXJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tdXRhdGVFdmVudEN1cnJlbnRUYXJnZXQoZXZlbnQsIGVsbSk7XG4gICAgICAgIGxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChkZXN0KSB7XG4gICAgICAgICAgICBpZiAoZGVzdC5wYXNzaXZlID09PSBwYXNzaXZlICYmIGRlc3QudXNlQ2FwdHVyZSA9PT0gdXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgICAgIHZhciBzZWwgPSB1dGlsc18xLmdldFNlbGVjdG9ycyhkZXN0LnNjb3BlQ2hlY2tlci5uYW1lc3BhY2UpO1xuICAgICAgICAgICAgICAgIGlmICghZXZlbnQucHJvcGFnYXRpb25IYXNCZWVuU3RvcHBlZCAmJlxuICAgICAgICAgICAgICAgICAgICBkZXN0LnNjb3BlQ2hlY2tlci5pc0RpcmVjdGx5SW5TY29wZShlbG0pICYmXG4gICAgICAgICAgICAgICAgICAgICgoc2VsICE9PSAnJyAmJiBlbG0ubWF0Y2hlcyhzZWwpKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKHNlbCA9PT0gJycgJiYgZWxtID09PSByb290RWxlbWVudCkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZyb21FdmVudF8xLnByZXZlbnREZWZhdWx0Q29uZGl0aW9uYWwoZXZlbnQsIGRlc3QucHJldmVudERlZmF1bHQpO1xuICAgICAgICAgICAgICAgICAgICBkZXN0LnN1YmplY3Quc2hhbWVmdWxseVNlbmROZXh0KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnBhdGNoRXZlbnQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgdmFyIHBFdmVudCA9IGV2ZW50O1xuICAgICAgICBwRXZlbnQucHJvcGFnYXRpb25IYXNCZWVuU3RvcHBlZCA9IGZhbHNlO1xuICAgICAgICB2YXIgb2xkU3RvcFByb3BhZ2F0aW9uID0gcEV2ZW50LnN0b3BQcm9wYWdhdGlvbjtcbiAgICAgICAgcEV2ZW50LnN0b3BQcm9wYWdhdGlvbiA9IGZ1bmN0aW9uIHN0b3BQcm9wYWdhdGlvbigpIHtcbiAgICAgICAgICAgIG9sZFN0b3BQcm9wYWdhdGlvbi5jYWxsKHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkID0gdHJ1ZTtcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHBFdmVudDtcbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5tdXRhdGVFdmVudEN1cnJlbnRUYXJnZXQgPSBmdW5jdGlvbiAoZXZlbnQsIGN1cnJlbnRUYXJnZXRFbGVtZW50KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZXZlbnQsIFwiY3VycmVudFRhcmdldFwiLCB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IGN1cnJlbnRUYXJnZXRFbGVtZW50LFxuICAgICAgICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicGxlYXNlIHVzZSBldmVudC5vd25lclRhcmdldFwiKTtcbiAgICAgICAgfVxuICAgICAgICBldmVudC5vd25lclRhcmdldCA9IGN1cnJlbnRUYXJnZXRFbGVtZW50O1xuICAgIH07XG4gICAgcmV0dXJuIEV2ZW50RGVsZWdhdG9yO1xufSgpKTtcbmV4cG9ydHMuRXZlbnREZWxlZ2F0b3IgPSBFdmVudERlbGVnYXRvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUV2ZW50RGVsZWdhdG9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBTeW1ib2xUcmVlXzEgPSByZXF1aXJlKFwiLi9TeW1ib2xUcmVlXCIpO1xudmFyIElzb2xhdGVNb2R1bGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSXNvbGF0ZU1vZHVsZSgpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VUcmVlID0gbmV3IFN5bWJvbFRyZWVfMS5kZWZhdWx0KGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnNjb3BlOyB9KTtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMudm5vZGVzQmVpbmdSZW1vdmVkID0gW107XG4gICAgfVxuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLnNldEV2ZW50RGVsZWdhdG9yID0gZnVuY3Rpb24gKGRlbCkge1xuICAgICAgICB0aGlzLmV2ZW50RGVsZWdhdG9yID0gZGVsO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuaW5zZXJ0RWxlbWVudCA9IGZ1bmN0aW9uIChuYW1lc3BhY2UsIGVsKSB7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlQnlFbGVtZW50LnNldChlbCwgbmFtZXNwYWNlKTtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VUcmVlLnNldChuYW1lc3BhY2UsIGVsKTtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLnJlbW92ZUVsZW1lbnQgPSBmdW5jdGlvbiAoZWxtKSB7XG4gICAgICAgIHRoaXMubmFtZXNwYWNlQnlFbGVtZW50LmRlbGV0ZShlbG0pO1xuICAgICAgICB2YXIgbmFtZXNwYWNlID0gdGhpcy5nZXROYW1lc3BhY2UoZWxtKTtcbiAgICAgICAgaWYgKG5hbWVzcGFjZSkge1xuICAgICAgICAgICAgdGhpcy5uYW1lc3BhY2VUcmVlLmRlbGV0ZShuYW1lc3BhY2UpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5nZXRFbGVtZW50ID0gZnVuY3Rpb24gKG5hbWVzcGFjZSwgbWF4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWVzcGFjZVRyZWUuZ2V0KG5hbWVzcGFjZSwgdW5kZWZpbmVkLCBtYXgpO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuZ2V0Um9vdEVsZW1lbnQgPSBmdW5jdGlvbiAoZWxtKSB7XG4gICAgICAgIGlmICh0aGlzLm5hbWVzcGFjZUJ5RWxlbWVudC5oYXMoZWxtKSkge1xuICAgICAgICAgICAgcmV0dXJuIGVsbTtcbiAgICAgICAgfVxuICAgICAgICAvL1RPRE86IEFkZCBxdWljay1scnUgb3Igc2ltaWxhciBhcyBhZGRpdGlvbmFsIE8oMSkgY2FjaGVcbiAgICAgICAgdmFyIGN1cnIgPSBlbG07XG4gICAgICAgIHdoaWxlICghdGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQuaGFzKGN1cnIpKSB7XG4gICAgICAgICAgICBjdXJyID0gY3Vyci5wYXJlbnROb2RlO1xuICAgICAgICAgICAgaWYgKCFjdXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGN1cnIudGFnTmFtZSA9PT0gJ0hUTUwnKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyByb290IGVsZW1lbnQgZm91bmQsIHRoaXMgc2hvdWxkIG5vdCBoYXBwZW4gYXQgYWxsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGN1cnI7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5nZXROYW1lc3BhY2UgPSBmdW5jdGlvbiAoZWxtKSB7XG4gICAgICAgIHZhciByb290RWxlbWVudCA9IHRoaXMuZ2V0Um9vdEVsZW1lbnQoZWxtKTtcbiAgICAgICAgaWYgKCFyb290RWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQuZ2V0KHJvb3RFbGVtZW50KTtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmNyZWF0ZU1vZHVsZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3JlYXRlOiBmdW5jdGlvbiAoZW1wdHlWTm9kZSwgdk5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZWxtID0gdk5vZGUuZWxtLCBfYSA9IHZOb2RlLmRhdGEsIGRhdGEgPSBfYSA9PT0gdm9pZCAwID8ge30gOiBfYTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gZGF0YS5pc29sYXRlO1xuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5hbWVzcGFjZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbnNlcnRFbGVtZW50KG5hbWVzcGFjZSwgZWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdXBkYXRlOiBmdW5jdGlvbiAob2xkVk5vZGUsIHZOb2RlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9sZEVsbSA9IG9sZFZOb2RlLmVsbSwgX2EgPSBvbGRWTm9kZS5kYXRhLCBvbGREYXRhID0gX2EgPT09IHZvaWQgMCA/IHt9IDogX2E7XG4gICAgICAgICAgICAgICAgdmFyIGVsbSA9IHZOb2RlLmVsbSwgX2IgPSB2Tm9kZS5kYXRhLCBkYXRhID0gX2IgPT09IHZvaWQgMCA/IHt9IDogX2I7XG4gICAgICAgICAgICAgICAgdmFyIG9sZE5hbWVzcGFjZSA9IG9sZERhdGEuaXNvbGF0ZTtcbiAgICAgICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gZGF0YS5pc29sYXRlO1xuICAgICAgICAgICAgICAgIGlmICghdXRpbHNfMS5pc0VxdWFsTmFtZXNwYWNlKG9sZE5hbWVzcGFjZSwgbmFtZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvbGROYW1lc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUVsZW1lbnQob2xkRWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShuYW1lc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuaW5zZXJ0RWxlbWVudChuYW1lc3BhY2UsIGVsbSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uICh2Tm9kZSkge1xuICAgICAgICAgICAgICAgIHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkLnB1c2godk5vZGUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKHZOb2RlLCBjYikge1xuICAgICAgICAgICAgICAgIHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkLnB1c2godk5vZGUpO1xuICAgICAgICAgICAgICAgIGNiKCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9zdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB2bm9kZXNCZWluZ1JlbW92ZWQgPSBzZWxmLnZub2Rlc0JlaW5nUmVtb3ZlZDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gdm5vZGVzQmVpbmdSZW1vdmVkLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2bm9kZSA9IHZub2Rlc0JlaW5nUmVtb3ZlZFtpXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5hbWVzcGFjZSA9IHZub2RlLmRhdGEgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgPyB2bm9kZS5kYXRhLmlzb2xhdGlvblxuICAgICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuYW1lc3BhY2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVFbGVtZW50KG5hbWVzcGFjZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2VsZi5ldmVudERlbGVnYXRvci5yZW1vdmVFbGVtZW50KHZub2RlLmVsbSwgbmFtZXNwYWNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQgPSBbXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgfTtcbiAgICByZXR1cm4gSXNvbGF0ZU1vZHVsZTtcbn0oKSk7XG5leHBvcnRzLklzb2xhdGVNb2R1bGUgPSBJc29sYXRlTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9SXNvbGF0ZU1vZHVsZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIERvY3VtZW50RE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9Eb2N1bWVudERPTVNvdXJjZVwiKTtcbnZhciBCb2R5RE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9Cb2R5RE9NU291cmNlXCIpO1xudmFyIEVsZW1lbnRGaW5kZXJfMSA9IHJlcXVpcmUoXCIuL0VsZW1lbnRGaW5kZXJcIik7XG52YXIgaXNvbGF0ZV8xID0gcmVxdWlyZShcIi4vaXNvbGF0ZVwiKTtcbnZhciBNYWluRE9NU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIE1haW5ET01Tb3VyY2UoX3Jvb3RFbGVtZW50JCwgX3Nhbml0YXRpb24kLCBfbmFtZXNwYWNlLCBfaXNvbGF0ZU1vZHVsZSwgX2V2ZW50RGVsZWdhdG9yLCBfbmFtZSkge1xuICAgICAgICBpZiAoX25hbWVzcGFjZSA9PT0gdm9pZCAwKSB7IF9uYW1lc3BhY2UgPSBbXTsgfVxuICAgICAgICB0aGlzLl9yb290RWxlbWVudCQgPSBfcm9vdEVsZW1lbnQkO1xuICAgICAgICB0aGlzLl9zYW5pdGF0aW9uJCA9IF9zYW5pdGF0aW9uJDtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gX25hbWVzcGFjZTtcbiAgICAgICAgdGhpcy5faXNvbGF0ZU1vZHVsZSA9IF9pc29sYXRlTW9kdWxlO1xuICAgICAgICB0aGlzLl9ldmVudERlbGVnYXRvciA9IF9ldmVudERlbGVnYXRvcjtcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xuICAgICAgICB0aGlzLmlzb2xhdGVTb3VyY2UgPSBmdW5jdGlvbiAoc291cmNlLCBzY29wZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBNYWluRE9NU291cmNlKHNvdXJjZS5fcm9vdEVsZW1lbnQkLCBzb3VyY2UuX3Nhbml0YXRpb24kLCBzb3VyY2UuX25hbWVzcGFjZS5jb25jYXQoaXNvbGF0ZV8xLmdldFNjb3BlT2JqKHNjb3BlKSksIHNvdXJjZS5faXNvbGF0ZU1vZHVsZSwgc291cmNlLl9ldmVudERlbGVnYXRvciwgc291cmNlLl9uYW1lKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5pc29sYXRlU2luayA9IGlzb2xhdGVfMS5tYWtlSXNvbGF0ZVNpbmsodGhpcy5fbmFtZXNwYWNlKTtcbiAgICB9XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuX2VsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5fbmFtZXNwYWNlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3Jvb3RFbGVtZW50JC5tYXAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIFt4XTsgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudEZpbmRlcl8xID0gbmV3IEVsZW1lbnRGaW5kZXJfMS5FbGVtZW50RmluZGVyKHRoaXMuX25hbWVzcGFjZSwgdGhpcy5faXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcm9vdEVsZW1lbnQkLm1hcChmdW5jdGlvbiAoKSB7IHJldHVybiBlbGVtZW50RmluZGVyXzEuY2FsbCgpOyB9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHRoaXMuX2VsZW1lbnRzKCkucmVtZW1iZXIoKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh0aGlzLl9lbGVtZW50cygpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChhcnIpIHsgcmV0dXJuIGFyci5sZW5ndGggPiAwOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoYXJyKSB7IHJldHVybiBhcnJbMF07IH0pXG4gICAgICAgICAgICAucmVtZW1iZXIoKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUsIFwibmFtZXNwYWNlXCIsIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fbmFtZXNwYWNlO1xuICAgICAgICB9LFxuICAgICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWVcbiAgICB9KTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRPTSBkcml2ZXIncyBzZWxlY3QoKSBleHBlY3RzIHRoZSBhcmd1bWVudCB0byBiZSBhIFwiICtcbiAgICAgICAgICAgICAgICBcInN0cmluZyBhcyBhIENTUyBzZWxlY3RvclwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICdkb2N1bWVudCcpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRG9jdW1lbnRET01Tb3VyY2VfMS5Eb2N1bWVudERPTVNvdXJjZSh0aGlzLl9uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZWN0b3IgPT09ICdib2R5Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBCb2R5RE9NU291cmNlXzEuQm9keURPTVNvdXJjZSh0aGlzLl9uYW1lKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZXNwYWNlID0gc2VsZWN0b3IgPT09ICc6cm9vdCdcbiAgICAgICAgICAgID8gW11cbiAgICAgICAgICAgIDogdGhpcy5fbmFtZXNwYWNlLmNvbmNhdCh7IHR5cGU6ICdzZWxlY3RvcicsIHNjb3BlOiBzZWxlY3Rvci50cmltKCkgfSk7XG4gICAgICAgIHJldHVybiBuZXcgTWFpbkRPTVNvdXJjZSh0aGlzLl9yb290RWxlbWVudCQsIHRoaXMuX3Nhbml0YXRpb24kLCBuYW1lc3BhY2UsIHRoaXMuX2lzb2xhdGVNb2R1bGUsIHRoaXMuX2V2ZW50RGVsZWdhdG9yLCB0aGlzLl9uYW1lKTtcbiAgICB9O1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMsIGJ1YmJsZXMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgaWYgKHR5cGVvZiBldmVudFR5cGUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRPTSBkcml2ZXIncyBldmVudHMoKSBleHBlY3RzIGFyZ3VtZW50IHRvIGJlIGEgXCIgK1xuICAgICAgICAgICAgICAgIFwic3RyaW5nIHJlcHJlc2VudGluZyB0aGUgZXZlbnQgdHlwZSB0byBsaXN0ZW4gZm9yLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZXZlbnQkID0gdGhpcy5fZXZlbnREZWxlZ2F0b3IuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIHRoaXMuX25hbWVzcGFjZSwgb3B0aW9ucywgYnViYmxlcyk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KGV2ZW50JCk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9zYW5pdGF0aW9uJC5zaGFtZWZ1bGx5U2VuZE5leHQobnVsbCk7XG4gICAgICAgIC8vdGhpcy5faXNvbGF0ZU1vZHVsZS5yZXNldCgpO1xuICAgIH07XG4gICAgcmV0dXJuIE1haW5ET01Tb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5NYWluRE9NU291cmNlID0gTWFpbkRPTVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPU1haW5ET01Tb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgUHJpb3JpdHlRdWV1ZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQcmlvcml0eVF1ZXVlKCkge1xuICAgICAgICB0aGlzLmFyciA9IFtdO1xuICAgICAgICB0aGlzLnByaW9zID0gW107XG4gICAgfVxuICAgIFByaW9yaXR5UXVldWUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh0LCBwcmlvKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByaW9zW2ldIDwgcHJpbykge1xuICAgICAgICAgICAgICAgIHRoaXMuYXJyLnNwbGljZShpLCAwLCB0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnByaW9zLnNwbGljZShpLCAwLCBwcmlvKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5hcnIucHVzaCh0KTtcbiAgICAgICAgdGhpcy5wcmlvcy5wdXNoKHByaW8pO1xuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5hcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGYodGhpcy5hcnJbaV0sIGksIHRoaXMuYXJyKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuYXJyW2ldID09PSB0KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcnIuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMucHJpb3Muc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIFByaW9yaXR5UXVldWU7XG59KCkpO1xuZXhwb3J0cy5kZWZhdWx0ID0gUHJpb3JpdHlRdWV1ZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVByaW9yaXR5UXVldWUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgUmVtb3ZhbFNldCA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZW1vdmFsU2V0KCkge1xuICAgICAgICB0aGlzLnRvRGVsZXRlID0gW107XG4gICAgICAgIHRoaXMudG9EZWxldGVTaXplID0gMDtcbiAgICAgICAgdGhpcy5fc2V0ID0gbmV3IFNldCgpO1xuICAgIH1cbiAgICBSZW1vdmFsU2V0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB0aGlzLl9zZXQuYWRkKHQpO1xuICAgIH07XG4gICAgUmVtb3ZhbFNldC5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gICAgICAgIHRoaXMuX3NldC5mb3JFYWNoKGYpO1xuICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgfTtcbiAgICBSZW1vdmFsU2V0LnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICBpZiAodGhpcy50b0RlbGV0ZS5sZW5ndGggPT09IHRoaXMudG9EZWxldGVTaXplKSB7XG4gICAgICAgICAgICB0aGlzLnRvRGVsZXRlLnB1c2godCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRvRGVsZXRlW3RoaXMudG9EZWxldGVTaXplXSA9IHQ7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50b0RlbGV0ZVNpemUrKztcbiAgICB9O1xuICAgIFJlbW92YWxTZXQucHJvdG90eXBlLmZsdXNoID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMudG9EZWxldGUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpIDwgdGhpcy50b0RlbGV0ZVNpemUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9zZXQuZGVsZXRlKHRoaXMudG9EZWxldGVbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy50b0RlbGV0ZVtpXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRvRGVsZXRlU2l6ZSA9IDA7XG4gICAgfTtcbiAgICByZXR1cm4gUmVtb3ZhbFNldDtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBSZW1vdmFsU2V0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UmVtb3ZhbFNldC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgU2NvcGVDaGVja2VyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFNjb3BlQ2hlY2tlcihuYW1lc3BhY2UsIGlzb2xhdGVNb2R1bGUpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZSA9IGlzb2xhdGVNb2R1bGU7XG4gICAgICAgIHRoaXMuX25hbWVzcGFjZSA9IG5hbWVzcGFjZS5maWx0ZXIoZnVuY3Rpb24gKG4pIHsgcmV0dXJuIG4udHlwZSAhPT0gJ3NlbGVjdG9yJzsgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENoZWNrcyB3aGV0aGVyIHRoZSBnaXZlbiBlbGVtZW50IGlzICpkaXJlY3RseSogaW4gdGhlIHNjb3BlIG9mIHRoaXNcbiAgICAgKiBzY29wZSBjaGVja2VyLiBCZWluZyBjb250YWluZWQgKmluZGlyZWN0bHkqIHRocm91Z2ggb3RoZXIgc2NvcGVzXG4gICAgICogaXMgbm90IHZhbGlkLiBUaGlzIGlzIGNydWNpYWwgZm9yIGltcGxlbWVudGluZyBwYXJlbnQtY2hpbGQgaXNvbGF0aW9uLFxuICAgICAqIHNvIHRoYXQgdGhlIHBhcmVudCBzZWxlY3RvcnMgZG9uJ3Qgc2VhcmNoIGluc2lkZSBhIGNoaWxkIHNjb3BlLlxuICAgICAqL1xuICAgIFNjb3BlQ2hlY2tlci5wcm90b3R5cGUuaXNEaXJlY3RseUluU2NvcGUgPSBmdW5jdGlvbiAobGVhZikge1xuICAgICAgICB2YXIgbmFtZXNwYWNlID0gdGhpcy5pc29sYXRlTW9kdWxlLmdldE5hbWVzcGFjZShsZWFmKTtcbiAgICAgICAgaWYgKCFuYW1lc3BhY2UpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5fbmFtZXNwYWNlLmxlbmd0aCA+IG5hbWVzcGFjZS5sZW5ndGggfHxcbiAgICAgICAgICAgICF1dGlsc18xLmlzRXF1YWxOYW1lc3BhY2UodGhpcy5fbmFtZXNwYWNlLCBuYW1lc3BhY2Uuc2xpY2UoMCwgdGhpcy5fbmFtZXNwYWNlLmxlbmd0aCkpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuX25hbWVzcGFjZS5sZW5ndGg7IGkgPCBuYW1lc3BhY2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChuYW1lc3BhY2VbaV0udHlwZSA9PT0gJ3RvdGFsJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIHJldHVybiBTY29wZUNoZWNrZXI7XG59KCkpO1xuZXhwb3J0cy5TY29wZUNoZWNrZXIgPSBTY29wZUNoZWNrZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TY29wZUNoZWNrZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU3ltYm9sVHJlZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTeW1ib2xUcmVlKG1hcHBlcikge1xuICAgICAgICB0aGlzLm1hcHBlciA9IG1hcHBlcjtcbiAgICAgICAgdGhpcy50cmVlID0gW3VuZGVmaW5lZCwge31dO1xuICAgIH1cbiAgICBTeW1ib2xUcmVlLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAocGF0aCwgZWxlbWVudCwgbWF4KSB7XG4gICAgICAgIHZhciBjdXJyID0gdGhpcy50cmVlO1xuICAgICAgICB2YXIgX21heCA9IG1heCAhPT0gdW5kZWZpbmVkID8gbWF4IDogcGF0aC5sZW5ndGg7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgX21heDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMubWFwcGVyKHBhdGhbaV0pO1xuICAgICAgICAgICAgdmFyIGNoaWxkID0gY3VyclsxXVtuXTtcbiAgICAgICAgICAgIGlmICghY2hpbGQpIHtcbiAgICAgICAgICAgICAgICBjaGlsZCA9IFt1bmRlZmluZWQsIHt9XTtcbiAgICAgICAgICAgICAgICBjdXJyWzFdW25dID0gY2hpbGQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyID0gY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgY3VyclswXSA9IGVsZW1lbnQ7XG4gICAgfTtcbiAgICBTeW1ib2xUcmVlLnByb3RvdHlwZS5nZXREZWZhdWx0ID0gZnVuY3Rpb24gKHBhdGgsIG1rRGVmYXVsdEVsZW1lbnQsIG1heCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXQocGF0aCwgbWtEZWZhdWx0RWxlbWVudCwgbWF4KTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIHBheWxvYWQgb2YgdGhlIHBhdGhcbiAgICAgKiBJZiBhIGRlZmF1bHQgZWxlbWVudCBjcmVhdG9yIGlzIGdpdmVuLCBpdCB3aWxsIGluc2VydCBpdCBhdCB0aGUgcGF0aFxuICAgICAqL1xuICAgIFN5bWJvbFRyZWUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uIChwYXRoLCBta0RlZmF1bHRFbGVtZW50LCBtYXgpIHtcbiAgICAgICAgdmFyIGN1cnIgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBfbWF4ID0gbWF4ICE9PSB1bmRlZmluZWQgPyBtYXggOiBwYXRoLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfbWF4OyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5tYXBwZXIocGF0aFtpXSk7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjdXJyWzFdW25dO1xuICAgICAgICAgICAgaWYgKCFjaGlsZCkge1xuICAgICAgICAgICAgICAgIGlmIChta0RlZmF1bHRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNoaWxkID0gW3VuZGVmaW5lZCwge31dO1xuICAgICAgICAgICAgICAgICAgICBjdXJyWzFdW25dID0gY2hpbGQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnIgPSBjaGlsZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAobWtEZWZhdWx0RWxlbWVudCAmJiAhY3VyclswXSkge1xuICAgICAgICAgICAgY3VyclswXSA9IG1rRGVmYXVsdEVsZW1lbnQoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VyclswXTtcbiAgICB9O1xuICAgIFN5bWJvbFRyZWUucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uIChwYXRoKSB7XG4gICAgICAgIHZhciBjdXJyID0gdGhpcy50cmVlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjdXJyWzFdW3RoaXMubWFwcGVyKHBhdGhbaV0pXTtcbiAgICAgICAgICAgIGlmICghY2hpbGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjdXJyID0gY2hpbGQ7XG4gICAgICAgIH1cbiAgICAgICAgZGVsZXRlIGN1cnJbMV1bdGhpcy5tYXBwZXIocGF0aFtwYXRoLmxlbmd0aCAtIDFdKV07XG4gICAgfTtcbiAgICByZXR1cm4gU3ltYm9sVHJlZTtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTeW1ib2xUcmVlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3ltYm9sVHJlZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL3Zub2RlXCIpO1xudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xudmFyIHNuYWJiZG9tX3NlbGVjdG9yXzEgPSByZXF1aXJlKFwic25hYmJkb20tc2VsZWN0b3JcIik7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIFZOb2RlV3JhcHBlciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBWTm9kZVdyYXBwZXIocm9vdEVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5yb290RWxlbWVudCA9IHJvb3RFbGVtZW50O1xuICAgIH1cbiAgICBWTm9kZVdyYXBwZXIucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAodm5vZGUpIHtcbiAgICAgICAgaWYgKHV0aWxzXzEuaXNEb2NGcmFnKHRoaXMucm9vdEVsZW1lbnQpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53cmFwRG9jRnJhZyh2bm9kZSA9PT0gbnVsbCA/IFtdIDogW3Zub2RlXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHZub2RlID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy53cmFwKFtdKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgX2EgPSBzbmFiYmRvbV9zZWxlY3Rvcl8xLnNlbGVjdG9yUGFyc2VyKHZub2RlKSwgc2VsVGFnTmFtZSA9IF9hLnRhZ05hbWUsIHNlbElkID0gX2EuaWQ7XG4gICAgICAgIHZhciB2Tm9kZUNsYXNzTmFtZSA9IHNuYWJiZG9tX3NlbGVjdG9yXzEuY2xhc3NOYW1lRnJvbVZOb2RlKHZub2RlKTtcbiAgICAgICAgdmFyIHZOb2RlRGF0YSA9IHZub2RlLmRhdGEgfHwge307XG4gICAgICAgIHZhciB2Tm9kZURhdGFQcm9wcyA9IHZOb2RlRGF0YS5wcm9wcyB8fCB7fTtcbiAgICAgICAgdmFyIF9iID0gdk5vZGVEYXRhUHJvcHMuaWQsIHZOb2RlSWQgPSBfYiA9PT0gdm9pZCAwID8gc2VsSWQgOiBfYjtcbiAgICAgICAgdmFyIGlzVk5vZGVBbmRSb290RWxlbWVudElkZW50aWNhbCA9IHR5cGVvZiB2Tm9kZUlkID09PSAnc3RyaW5nJyAmJlxuICAgICAgICAgICAgdk5vZGVJZC50b1VwcGVyQ2FzZSgpID09PSB0aGlzLnJvb3RFbGVtZW50LmlkLnRvVXBwZXJDYXNlKCkgJiZcbiAgICAgICAgICAgIHNlbFRhZ05hbWUudG9VcHBlckNhc2UoKSA9PT0gdGhpcy5yb290RWxlbWVudC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgJiZcbiAgICAgICAgICAgIHZOb2RlQ2xhc3NOYW1lLnRvVXBwZXJDYXNlKCkgPT09IHRoaXMucm9vdEVsZW1lbnQuY2xhc3NOYW1lLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGlmIChpc1ZOb2RlQW5kUm9vdEVsZW1lbnRJZGVudGljYWwpIHtcbiAgICAgICAgICAgIHJldHVybiB2bm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy53cmFwKFt2bm9kZV0pO1xuICAgIH07XG4gICAgVk5vZGVXcmFwcGVyLnByb3RvdHlwZS53cmFwRG9jRnJhZyA9IGZ1bmN0aW9uIChjaGlsZHJlbikge1xuICAgICAgICByZXR1cm4gdm5vZGVfMS52bm9kZSgnJywgeyBpc29sYXRlOiBbXSB9LCBjaGlsZHJlbiwgdW5kZWZpbmVkLCB0aGlzXG4gICAgICAgICAgICAucm9vdEVsZW1lbnQpO1xuICAgIH07XG4gICAgVk5vZGVXcmFwcGVyLnByb3RvdHlwZS53cmFwID0gZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgICAgIHZhciBfYSA9IHRoaXMucm9vdEVsZW1lbnQsIHRhZ05hbWUgPSBfYS50YWdOYW1lLCBpZCA9IF9hLmlkLCBjbGFzc05hbWUgPSBfYS5jbGFzc05hbWU7XG4gICAgICAgIHZhciBzZWxJZCA9IGlkID8gXCIjXCIgKyBpZCA6ICcnO1xuICAgICAgICB2YXIgc2VsQ2xhc3MgPSBjbGFzc05hbWUgPyBcIi5cIiArIGNsYXNzTmFtZS5zcGxpdChcIiBcIikuam9pbihcIi5cIikgOiAnJztcbiAgICAgICAgdmFyIHZub2RlID0gaF8xLmgoXCJcIiArIHRhZ05hbWUudG9Mb3dlckNhc2UoKSArIHNlbElkICsgc2VsQ2xhc3MsIHt9LCBjaGlsZHJlbik7XG4gICAgICAgIHZub2RlLmRhdGEgPSB2bm9kZS5kYXRhIHx8IHt9O1xuICAgICAgICB2bm9kZS5kYXRhLmlzb2xhdGUgPSB2bm9kZS5kYXRhLmlzb2xhdGUgfHwgW107XG4gICAgICAgIHJldHVybiB2bm9kZTtcbiAgICB9O1xuICAgIHJldHVybiBWTm9kZVdyYXBwZXI7XG59KCkpO1xuZXhwb3J0cy5WTm9kZVdyYXBwZXIgPSBWTm9kZVdyYXBwZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1WTm9kZVdyYXBwZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG5mdW5jdGlvbiBmcm9tRXZlbnQoZWxlbWVudCwgZXZlbnROYW1lLCB1c2VDYXB0dXJlLCBwcmV2ZW50RGVmYXVsdCwgcGFzc2l2ZSkge1xuICAgIGlmICh1c2VDYXB0dXJlID09PSB2b2lkIDApIHsgdXNlQ2FwdHVyZSA9IGZhbHNlOyB9XG4gICAgaWYgKHByZXZlbnREZWZhdWx0ID09PSB2b2lkIDApIHsgcHJldmVudERlZmF1bHQgPSBmYWxzZTsgfVxuICAgIGlmIChwYXNzaXZlID09PSB2b2lkIDApIHsgcGFzc2l2ZSA9IGZhbHNlOyB9XG4gICAgdmFyIG5leHQgPSBudWxsO1xuICAgIHJldHVybiB4c3RyZWFtXzEuU3RyZWFtLmNyZWF0ZSh7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiBzdGFydChsaXN0ZW5lcikge1xuICAgICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KSB7XG4gICAgICAgICAgICAgICAgbmV4dCA9IGZ1bmN0aW9uIF9uZXh0KGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIHByZXZlbnREZWZhdWx0Q29uZGl0aW9uYWwoZXZlbnQsIHByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubmV4dChldmVudCk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG5leHQgPSBmdW5jdGlvbiBfbmV4dChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5uZXh0KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbmV4dCwge1xuICAgICAgICAgICAgICAgIGNhcHR1cmU6IHVzZUNhcHR1cmUsXG4gICAgICAgICAgICAgICAgcGFzc2l2ZTogcGFzc2l2ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBzdG9wOiBmdW5jdGlvbiBzdG9wKCkge1xuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgbmV4dCwgdXNlQ2FwdHVyZSk7XG4gICAgICAgICAgICBuZXh0ID0gbnVsbDtcbiAgICAgICAgfSxcbiAgICB9KTtcbn1cbmV4cG9ydHMuZnJvbUV2ZW50ID0gZnJvbUV2ZW50O1xuZnVuY3Rpb24gbWF0Y2hPYmplY3QobWF0Y2hlciwgb2JqKSB7XG4gICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhtYXRjaGVyKTtcbiAgICB2YXIgbiA9IGtleXMubGVuZ3RoO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHZhciBrID0ga2V5c1tpXTtcbiAgICAgICAgaWYgKHR5cGVvZiBtYXRjaGVyW2tdID09PSAnb2JqZWN0JyAmJiB0eXBlb2Ygb2JqW2tdID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKCFtYXRjaE9iamVjdChtYXRjaGVyW2tdLCBvYmpba10pKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG1hdGNoZXJba10gIT09IG9ialtrXSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuZnVuY3Rpb24gcHJldmVudERlZmF1bHRDb25kaXRpb25hbChldmVudCwgcHJldmVudERlZmF1bHQpIHtcbiAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBwcmV2ZW50RGVmYXVsdCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzUHJlZGljYXRlKHByZXZlbnREZWZhdWx0KSkge1xuICAgICAgICAgICAgaWYgKHByZXZlbnREZWZhdWx0KGV2ZW50KSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHByZXZlbnREZWZhdWx0ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgaWYgKG1hdGNoT2JqZWN0KHByZXZlbnREZWZhdWx0LCBldmVudCkpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcmV2ZW50RGVmYXVsdCBoYXMgdG8gYmUgZWl0aGVyIGEgYm9vbGVhbiwgcHJlZGljYXRlIGZ1bmN0aW9uIG9yIG9iamVjdCcpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5wcmV2ZW50RGVmYXVsdENvbmRpdGlvbmFsID0gcHJldmVudERlZmF1bHRDb25kaXRpb25hbDtcbmZ1bmN0aW9uIGlzUHJlZGljYXRlKGZuKSB7XG4gICAgcmV0dXJuIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJztcbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZyb21FdmVudC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8vIHRzbGludDpkaXNhYmxlOm1heC1maWxlLWxpbmUtY291bnRcbnZhciBoXzEgPSByZXF1aXJlKFwic25hYmJkb20vaFwiKTtcbmZ1bmN0aW9uIGlzVmFsaWRTdHJpbmcocGFyYW0pIHtcbiAgICByZXR1cm4gdHlwZW9mIHBhcmFtID09PSAnc3RyaW5nJyAmJiBwYXJhbS5sZW5ndGggPiAwO1xufVxuZnVuY3Rpb24gaXNTZWxlY3RvcihwYXJhbSkge1xuICAgIHJldHVybiBpc1ZhbGlkU3RyaW5nKHBhcmFtKSAmJiAocGFyYW1bMF0gPT09ICcuJyB8fCBwYXJhbVswXSA9PT0gJyMnKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZVRhZ0Z1bmN0aW9uKHRhZ05hbWUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gaHlwZXJzY3JpcHQoYSwgYiwgYykge1xuICAgICAgICB2YXIgaGFzQSA9IHR5cGVvZiBhICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgdmFyIGhhc0IgPSB0eXBlb2YgYiAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIHZhciBoYXNDID0gdHlwZW9mIGMgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICBpZiAoaXNTZWxlY3RvcihhKSkge1xuICAgICAgICAgICAgaWYgKGhhc0IgJiYgaGFzQykge1xuICAgICAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwgYiwgYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChoYXNCKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCBiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwge30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGhhc0MpIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lICsgYSwgYiwgYyk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaGFzQikge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUsIGEsIGIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGhhc0EpIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lLCBhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBoXzEuaCh0YWdOYW1lLCB7fSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxudmFyIFNWR19UQUdfTkFNRVMgPSBbXG4gICAgJ2EnLFxuICAgICdhbHRHbHlwaCcsXG4gICAgJ2FsdEdseXBoRGVmJyxcbiAgICAnYWx0R2x5cGhJdGVtJyxcbiAgICAnYW5pbWF0ZScsXG4gICAgJ2FuaW1hdGVDb2xvcicsXG4gICAgJ2FuaW1hdGVNb3Rpb24nLFxuICAgICdhbmltYXRlVHJhbnNmb3JtJyxcbiAgICAnY2lyY2xlJyxcbiAgICAnY2xpcFBhdGgnLFxuICAgICdjb2xvclByb2ZpbGUnLFxuICAgICdjdXJzb3InLFxuICAgICdkZWZzJyxcbiAgICAnZGVzYycsXG4gICAgJ2VsbGlwc2UnLFxuICAgICdmZUJsZW5kJyxcbiAgICAnZmVDb2xvck1hdHJpeCcsXG4gICAgJ2ZlQ29tcG9uZW50VHJhbnNmZXInLFxuICAgICdmZUNvbXBvc2l0ZScsXG4gICAgJ2ZlQ29udm9sdmVNYXRyaXgnLFxuICAgICdmZURpZmZ1c2VMaWdodGluZycsXG4gICAgJ2ZlRGlzcGxhY2VtZW50TWFwJyxcbiAgICAnZmVEaXN0YW50TGlnaHQnLFxuICAgICdmZUZsb29kJyxcbiAgICAnZmVGdW5jQScsXG4gICAgJ2ZlRnVuY0InLFxuICAgICdmZUZ1bmNHJyxcbiAgICAnZmVGdW5jUicsXG4gICAgJ2ZlR2F1c3NpYW5CbHVyJyxcbiAgICAnZmVJbWFnZScsXG4gICAgJ2ZlTWVyZ2UnLFxuICAgICdmZU1lcmdlTm9kZScsXG4gICAgJ2ZlTW9ycGhvbG9neScsXG4gICAgJ2ZlT2Zmc2V0JyxcbiAgICAnZmVQb2ludExpZ2h0JyxcbiAgICAnZmVTcGVjdWxhckxpZ2h0aW5nJyxcbiAgICAnZmVTcG90bGlnaHQnLFxuICAgICdmZVRpbGUnLFxuICAgICdmZVR1cmJ1bGVuY2UnLFxuICAgICdmaWx0ZXInLFxuICAgICdmb250JyxcbiAgICAnZm9udEZhY2UnLFxuICAgICdmb250RmFjZUZvcm1hdCcsXG4gICAgJ2ZvbnRGYWNlTmFtZScsXG4gICAgJ2ZvbnRGYWNlU3JjJyxcbiAgICAnZm9udEZhY2VVcmknLFxuICAgICdmb3JlaWduT2JqZWN0JyxcbiAgICAnZycsXG4gICAgJ2dseXBoJyxcbiAgICAnZ2x5cGhSZWYnLFxuICAgICdoa2VybicsXG4gICAgJ2ltYWdlJyxcbiAgICAnbGluZScsXG4gICAgJ2xpbmVhckdyYWRpZW50JyxcbiAgICAnbWFya2VyJyxcbiAgICAnbWFzaycsXG4gICAgJ21ldGFkYXRhJyxcbiAgICAnbWlzc2luZ0dseXBoJyxcbiAgICAnbXBhdGgnLFxuICAgICdwYXRoJyxcbiAgICAncGF0dGVybicsXG4gICAgJ3BvbHlnb24nLFxuICAgICdwb2x5bGluZScsXG4gICAgJ3JhZGlhbEdyYWRpZW50JyxcbiAgICAncmVjdCcsXG4gICAgJ3NjcmlwdCcsXG4gICAgJ3NldCcsXG4gICAgJ3N0b3AnLFxuICAgICdzdHlsZScsXG4gICAgJ3N3aXRjaCcsXG4gICAgJ3N5bWJvbCcsXG4gICAgJ3RleHQnLFxuICAgICd0ZXh0UGF0aCcsXG4gICAgJ3RpdGxlJyxcbiAgICAndHJlZicsXG4gICAgJ3RzcGFuJyxcbiAgICAndXNlJyxcbiAgICAndmlldycsXG4gICAgJ3ZrZXJuJyxcbl07XG52YXIgc3ZnID0gY3JlYXRlVGFnRnVuY3Rpb24oJ3N2ZycpO1xuU1ZHX1RBR19OQU1FUy5mb3JFYWNoKGZ1bmN0aW9uICh0YWcpIHtcbiAgICBzdmdbdGFnXSA9IGNyZWF0ZVRhZ0Z1bmN0aW9uKHRhZyk7XG59KTtcbnZhciBUQUdfTkFNRVMgPSBbXG4gICAgJ2EnLFxuICAgICdhYmJyJyxcbiAgICAnYWRkcmVzcycsXG4gICAgJ2FyZWEnLFxuICAgICdhcnRpY2xlJyxcbiAgICAnYXNpZGUnLFxuICAgICdhdWRpbycsXG4gICAgJ2InLFxuICAgICdiYXNlJyxcbiAgICAnYmRpJyxcbiAgICAnYmRvJyxcbiAgICAnYmxvY2txdW90ZScsXG4gICAgJ2JvZHknLFxuICAgICdicicsXG4gICAgJ2J1dHRvbicsXG4gICAgJ2NhbnZhcycsXG4gICAgJ2NhcHRpb24nLFxuICAgICdjaXRlJyxcbiAgICAnY29kZScsXG4gICAgJ2NvbCcsXG4gICAgJ2NvbGdyb3VwJyxcbiAgICAnZGQnLFxuICAgICdkZWwnLFxuICAgICdkZXRhaWxzJyxcbiAgICAnZGZuJyxcbiAgICAnZGlyJyxcbiAgICAnZGl2JyxcbiAgICAnZGwnLFxuICAgICdkdCcsXG4gICAgJ2VtJyxcbiAgICAnZW1iZWQnLFxuICAgICdmaWVsZHNldCcsXG4gICAgJ2ZpZ2NhcHRpb24nLFxuICAgICdmaWd1cmUnLFxuICAgICdmb290ZXInLFxuICAgICdmb3JtJyxcbiAgICAnaDEnLFxuICAgICdoMicsXG4gICAgJ2gzJyxcbiAgICAnaDQnLFxuICAgICdoNScsXG4gICAgJ2g2JyxcbiAgICAnaGVhZCcsXG4gICAgJ2hlYWRlcicsXG4gICAgJ2hncm91cCcsXG4gICAgJ2hyJyxcbiAgICAnaHRtbCcsXG4gICAgJ2knLFxuICAgICdpZnJhbWUnLFxuICAgICdpbWcnLFxuICAgICdpbnB1dCcsXG4gICAgJ2lucycsXG4gICAgJ2tiZCcsXG4gICAgJ2tleWdlbicsXG4gICAgJ2xhYmVsJyxcbiAgICAnbGVnZW5kJyxcbiAgICAnbGknLFxuICAgICdsaW5rJyxcbiAgICAnbWFpbicsXG4gICAgJ21hcCcsXG4gICAgJ21hcmsnLFxuICAgICdtZW51JyxcbiAgICAnbWV0YScsXG4gICAgJ25hdicsXG4gICAgJ25vc2NyaXB0JyxcbiAgICAnb2JqZWN0JyxcbiAgICAnb2wnLFxuICAgICdvcHRncm91cCcsXG4gICAgJ29wdGlvbicsXG4gICAgJ3AnLFxuICAgICdwYXJhbScsXG4gICAgJ3ByZScsXG4gICAgJ3Byb2dyZXNzJyxcbiAgICAncScsXG4gICAgJ3JwJyxcbiAgICAncnQnLFxuICAgICdydWJ5JyxcbiAgICAncycsXG4gICAgJ3NhbXAnLFxuICAgICdzY3JpcHQnLFxuICAgICdzZWN0aW9uJyxcbiAgICAnc2VsZWN0JyxcbiAgICAnc21hbGwnLFxuICAgICdzb3VyY2UnLFxuICAgICdzcGFuJyxcbiAgICAnc3Ryb25nJyxcbiAgICAnc3R5bGUnLFxuICAgICdzdWInLFxuICAgICdzdW1tYXJ5JyxcbiAgICAnc3VwJyxcbiAgICAndGFibGUnLFxuICAgICd0Ym9keScsXG4gICAgJ3RkJyxcbiAgICAndGV4dGFyZWEnLFxuICAgICd0Zm9vdCcsXG4gICAgJ3RoJyxcbiAgICAndGhlYWQnLFxuICAgICd0aW1lJyxcbiAgICAndGl0bGUnLFxuICAgICd0cicsXG4gICAgJ3UnLFxuICAgICd1bCcsXG4gICAgJ3ZpZGVvJyxcbl07XG52YXIgZXhwb3J0ZWQgPSB7XG4gICAgU1ZHX1RBR19OQU1FUzogU1ZHX1RBR19OQU1FUyxcbiAgICBUQUdfTkFNRVM6IFRBR19OQU1FUyxcbiAgICBzdmc6IHN2ZyxcbiAgICBpc1NlbGVjdG9yOiBpc1NlbGVjdG9yLFxuICAgIGNyZWF0ZVRhZ0Z1bmN0aW9uOiBjcmVhdGVUYWdGdW5jdGlvbixcbn07XG5UQUdfTkFNRVMuZm9yRWFjaChmdW5jdGlvbiAobikge1xuICAgIGV4cG9ydGVkW25dID0gY3JlYXRlVGFnRnVuY3Rpb24obik7XG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydGVkO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aHlwZXJzY3JpcHQtaGVscGVycy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0aHVua18xID0gcmVxdWlyZShcIi4vdGh1bmtcIik7XG5leHBvcnRzLnRodW5rID0gdGh1bmtfMS50aHVuaztcbnZhciBNYWluRE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9NYWluRE9NU291cmNlXCIpO1xuZXhwb3J0cy5NYWluRE9NU291cmNlID0gTWFpbkRPTVNvdXJjZV8xLk1haW5ET01Tb3VyY2U7XG4vKipcbiAqIEEgZmFjdG9yeSBmb3IgdGhlIERPTSBkcml2ZXIgZnVuY3Rpb24uXG4gKlxuICogVGFrZXMgYSBgY29udGFpbmVyYCB0byBkZWZpbmUgdGhlIHRhcmdldCBvbiB0aGUgZXhpc3RpbmcgRE9NIHdoaWNoIHRoaXNcbiAqIGRyaXZlciB3aWxsIG9wZXJhdGUgb24sIGFuZCBhbiBgb3B0aW9uc2Agb2JqZWN0IGFzIHRoZSBzZWNvbmQgYXJndW1lbnQuIFRoZVxuICogaW5wdXQgdG8gdGhpcyBkcml2ZXIgaXMgYSBzdHJlYW0gb2YgdmlydHVhbCBET00gb2JqZWN0cywgb3IgaW4gb3RoZXIgd29yZHMsXG4gKiBTbmFiYmRvbSBcIlZOb2RlXCIgb2JqZWN0cy4gVGhlIG91dHB1dCBvZiB0aGlzIGRyaXZlciBpcyBhIFwiRE9NU291cmNlXCI6IGFcbiAqIGNvbGxlY3Rpb24gb2YgT2JzZXJ2YWJsZXMgcXVlcmllZCB3aXRoIHRoZSBtZXRob2RzIGBzZWxlY3QoKWAgYW5kIGBldmVudHMoKWAuXG4gKlxuICogKipgRE9NU291cmNlLnNlbGVjdChzZWxlY3RvcilgKiogcmV0dXJucyBhIG5ldyBET01Tb3VyY2Ugd2l0aCBzY29wZVxuICogcmVzdHJpY3RlZCB0byB0aGUgZWxlbWVudChzKSB0aGF0IG1hdGNoZXMgdGhlIENTUyBgc2VsZWN0b3JgIGdpdmVuLiBUbyBzZWxlY3RcbiAqIHRoZSBwYWdlJ3MgYGRvY3VtZW50YCwgdXNlIGAuc2VsZWN0KCdkb2N1bWVudCcpYC4gVG8gc2VsZWN0IHRoZSBjb250YWluZXJcbiAqIGVsZW1lbnQgZm9yIHRoaXMgYXBwLCB1c2UgYC5zZWxlY3QoJzpyb290JylgLlxuICpcbiAqICoqYERPTVNvdXJjZS5ldmVudHMoZXZlbnRUeXBlLCBvcHRpb25zKWAqKiByZXR1cm5zIGEgc3RyZWFtIG9mIGV2ZW50cyBvZlxuICogYGV2ZW50VHlwZWAgaGFwcGVuaW5nIG9uIHRoZSBlbGVtZW50cyB0aGF0IG1hdGNoIHRoZSBjdXJyZW50IERPTVNvdXJjZS4gVGhlXG4gKiBldmVudCBvYmplY3QgY29udGFpbnMgdGhlIGBvd25lclRhcmdldGAgcHJvcGVydHkgdGhhdCBiZWhhdmVzIGV4YWN0bHkgbGlrZVxuICogYGN1cnJlbnRUYXJnZXRgLiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgc29tZSBicm93c2VycyBkb2Vzbid0IGFsbG93XG4gKiBgY3VycmVudFRhcmdldGAgcHJvcGVydHkgdG8gYmUgbXV0YXRlZCwgaGVuY2UgYSBuZXcgcHJvcGVydHkgaXMgY3JlYXRlZC4gVGhlXG4gKiByZXR1cm5lZCBzdHJlYW0gaXMgYW4gKnhzdHJlYW0qIFN0cmVhbSBpZiB5b3UgdXNlIGBAY3ljbGUveHN0cmVhbS1ydW5gIHRvIHJ1blxuICogeW91ciBhcHAgd2l0aCB0aGlzIGRyaXZlciwgb3IgaXQgaXMgYW4gUnhKUyBPYnNlcnZhYmxlIGlmIHlvdSB1c2VcbiAqIGBAY3ljbGUvcnhqcy1ydW5gLCBhbmQgc28gZm9ydGguXG4gKlxuICogKipvcHRpb25zIGZvciBET01Tb3VyY2UuZXZlbnRzKipcbiAqXG4gKiBUaGUgYG9wdGlvbnNgIHBhcmFtZXRlciBvbiBgRE9NU291cmNlLmV2ZW50cyhldmVudFR5cGUsIG9wdGlvbnMpYCBpcyBhblxuICogKG9wdGlvbmFsKSBvYmplY3Qgd2l0aCB0d28gb3B0aW9uYWwgZmllbGRzOiBgdXNlQ2FwdHVyZWAgYW5kXG4gKiBgcHJldmVudERlZmF1bHRgLlxuICpcbiAqIGB1c2VDYXB0dXJlYCBpcyBieSBkZWZhdWx0IGBmYWxzZWAsIGV4Y2VwdCBpdCBpcyBgdHJ1ZWAgZm9yIGV2ZW50IHR5cGVzIHRoYXRcbiAqIGRvIG5vdCBidWJibGUuIFJlYWQgbW9yZSBoZXJlXG4gKiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRXZlbnRUYXJnZXQvYWRkRXZlbnRMaXN0ZW5lclxuICogYWJvdXQgdGhlIGB1c2VDYXB0dXJlYCBhbmQgaXRzIHB1cnBvc2UuXG4gKlxuICogYHByZXZlbnREZWZhdWx0YCBpcyBieSBkZWZhdWx0IGBmYWxzZWAsIGFuZCBpbmRpY2F0ZXMgdG8gdGhlIGRyaXZlciB3aGV0aGVyXG4gKiBgZXZlbnQucHJldmVudERlZmF1bHQoKWAgc2hvdWxkIGJlIGludm9rZWQuIFRoaXMgb3B0aW9uIGNhbiBiZSBjb25maWd1cmVkIGluXG4gKiB0aHJlZSB3YXlzOlxuICpcbiAqIC0gYHtwcmV2ZW50RGVmYXVsdDogYm9vbGVhbn1gIHRvIGludm9rZSBwcmV2ZW50RGVmYXVsdCBpZiBgdHJ1ZWAsIGFuZCBub3RcbiAqIGludm9rZSBvdGhlcndpc2UuXG4gKiAtIGB7cHJldmVudERlZmF1bHQ6IChldjogRXZlbnQpID0+IGJvb2xlYW59YCBmb3IgY29uZGl0aW9uYWwgaW52b2NhdGlvbi5cbiAqIC0gYHtwcmV2ZW50RGVmYXVsdDogTmVzdGVkT2JqZWN0fWAgdXNlcyBhbiBvYmplY3QgdG8gYmUgcmVjdXJzaXZlbHkgY29tcGFyZWRcbiAqIHRvIHRoZSBgRXZlbnRgIG9iamVjdC4gYHByZXZlbnREZWZhdWx0YCBpcyBpbnZva2VkIHdoZW4gYWxsIHByb3BlcnRpZXMgb24gdGhlXG4gKiBuZXN0ZWQgb2JqZWN0IG1hdGNoIHdpdGggdGhlIHByb3BlcnRpZXMgb24gdGhlIGV2ZW50IG9iamVjdC5cbiAqXG4gKiBIZXJlIGFyZSBzb21lIGV4YW1wbGVzOlxuICogYGBgdHlwZXNjcmlwdFxuICogLy8gYWx3YXlzIHByZXZlbnQgZGVmYXVsdFxuICogRE9NU291cmNlLnNlbGVjdCgnaW5wdXQnKS5ldmVudHMoJ2tleWRvd24nLCB7XG4gKiAgIHByZXZlbnREZWZhdWx0OiB0cnVlXG4gKiB9KVxuICpcbiAqIC8vIHByZXZlbnQgZGVmYXVsdCBvbmx5IHdoZW4gYEVOVEVSYCBpcyBwcmVzc2VkXG4gKiBET01Tb3VyY2Uuc2VsZWN0KCdpbnB1dCcpLmV2ZW50cygna2V5ZG93bicsIHtcbiAqICAgcHJldmVudERlZmF1bHQ6IGUgPT4gZS5rZXlDb2RlID09PSAxM1xuICogfSlcbiAqXG4gKiAvLyBwcmV2ZW50IGRlZnVhbHQgd2hlbiBgRU5URVJgIGlzIHByZXNzZWQgQU5EIHRhcmdldC52YWx1ZSBpcyAnSEVMTE8nXG4gKiBET01Tb3VyY2Uuc2VsZWN0KCdpbnB1dCcpLmV2ZW50cygna2V5ZG93bicsIHtcbiAqICAgcHJldmVudERlZmF1bHQ6IHsga2V5Q29kZTogMTMsIG93bmVyVGFyZ2V0OiB7IHZhbHVlOiAnSEVMTE8nIH0gfVxuICogfSk7XG4gKiBgYGBcbiAqXG4gKiAqKmBET01Tb3VyY2UuZWxlbWVudHMoKWAqKiByZXR1cm5zIGEgc3RyZWFtIG9mIGFycmF5cyBjb250YWluaW5nIHRoZSBET01cbiAqIGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlIHNlbGVjdG9ycyBpbiB0aGUgRE9NU291cmNlIChlLmcuIGZyb20gcHJldmlvdXNcbiAqIGBzZWxlY3QoeClgIGNhbGxzKS5cbiAqXG4gKiAqKmBET01Tb3VyY2UuZWxlbWVudCgpYCoqIHJldHVybnMgYSBzdHJlYW0gb2YgRE9NIGVsZW1lbnRzLiBOb3RpY2UgdGhhdCB0aGlzXG4gKiBpcyB0aGUgc2luZ3VsYXIgdmVyc2lvbiBvZiBgLmVsZW1lbnRzKClgLCBzbyB0aGUgc3RyZWFtIHdpbGwgZW1pdCBhbiBlbGVtZW50LFxuICogbm90IGFuIGFycmF5LiBJZiB0aGVyZSBpcyBubyBlbGVtZW50IHRoYXQgbWF0Y2hlcyB0aGUgc2VsZWN0ZWQgRE9NU291cmNlLFxuICogdGhlbiB0aGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgbm90IGVtaXQgYW55dGhpbmcuXG4gKlxuICogQHBhcmFtIHsoU3RyaW5nfEhUTUxFbGVtZW50KX0gY29udGFpbmVyIHRoZSBET00gc2VsZWN0b3IgZm9yIHRoZSBlbGVtZW50XG4gKiAob3IgdGhlIGVsZW1lbnQgaXRzZWxmKSB0byBjb250YWluIHRoZSByZW5kZXJpbmcgb2YgdGhlIFZUcmVlcy5cbiAqIEBwYXJhbSB7RE9NRHJpdmVyT3B0aW9uc30gb3B0aW9ucyBhbiBvYmplY3Qgd2l0aCB0d28gb3B0aW9uYWwgcHJvcGVydGllczpcbiAqXG4gKiAgIC0gYG1vZHVsZXM6IGFycmF5YCBvdmVycmlkZXMgYEBjeWNsZS9kb21gJ3MgZGVmYXVsdCBTbmFiYmRvbSBtb2R1bGVzIGFzXG4gKiAgICAgYXMgZGVmaW5lZCBpbiBbYHNyYy9tb2R1bGVzLnRzYF0oLi9zcmMvbW9kdWxlcy50cykuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gdGhlIERPTSBkcml2ZXIgZnVuY3Rpb24uIFRoZSBmdW5jdGlvbiBleHBlY3RzIGEgc3RyZWFtIG9mXG4gKiBWTm9kZSBhcyBpbnB1dCwgYW5kIG91dHB1dHMgdGhlIERPTVNvdXJjZSBvYmplY3QuXG4gKiBAZnVuY3Rpb24gbWFrZURPTURyaXZlclxuICovXG52YXIgbWFrZURPTURyaXZlcl8xID0gcmVxdWlyZShcIi4vbWFrZURPTURyaXZlclwiKTtcbmV4cG9ydHMubWFrZURPTURyaXZlciA9IG1ha2VET01Ecml2ZXJfMS5tYWtlRE9NRHJpdmVyO1xuLyoqXG4gKiBBIGZhY3RvcnkgZnVuY3Rpb24gdG8gY3JlYXRlIG1vY2tlZCBET01Tb3VyY2Ugb2JqZWN0cywgZm9yIHRlc3RpbmcgcHVycG9zZXMuXG4gKlxuICogVGFrZXMgYSBgbW9ja0NvbmZpZ2Agb2JqZWN0IGFzIGFyZ3VtZW50LCBhbmQgcmV0dXJuc1xuICogYSBET01Tb3VyY2UgdGhhdCBjYW4gYmUgZ2l2ZW4gdG8gYW55IEN5Y2xlLmpzIGFwcCB0aGF0IGV4cGVjdHMgYSBET01Tb3VyY2UgaW5cbiAqIHRoZSBzb3VyY2VzLCBmb3IgdGVzdGluZy5cbiAqXG4gKiBUaGUgYG1vY2tDb25maWdgIHBhcmFtZXRlciBpcyBhbiBvYmplY3Qgc3BlY2lmeWluZyBzZWxlY3RvcnMsIGV2ZW50VHlwZXMgYW5kXG4gKiB0aGVpciBzdHJlYW1zLiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBjb25zdCBkb21Tb3VyY2UgPSBtb2NrRE9NU291cmNlKHtcbiAqICAgJy5mb28nOiB7XG4gKiAgICAgJ2NsaWNrJzogeHMub2Yoe3RhcmdldDoge319KSxcbiAqICAgICAnbW91c2VvdmVyJzogeHMub2Yoe3RhcmdldDoge319KSxcbiAqICAgfSxcbiAqICAgJy5iYXInOiB7XG4gKiAgICAgJ3Njcm9sbCc6IHhzLm9mKHt0YXJnZXQ6IHt9fSksXG4gKiAgICAgZWxlbWVudHM6IHhzLm9mKHt0YWdOYW1lOiAnZGl2J30pLFxuICogICB9XG4gKiB9KTtcbiAqXG4gKiAvLyBVc2FnZVxuICogY29uc3QgY2xpY2skID0gZG9tU291cmNlLnNlbGVjdCgnLmZvbycpLmV2ZW50cygnY2xpY2snKTtcbiAqIGNvbnN0IGVsZW1lbnQkID0gZG9tU291cmNlLnNlbGVjdCgnLmJhcicpLmVsZW1lbnRzKCk7XG4gKiBgYGBcbiAqXG4gKiBUaGUgbW9ja2VkIERPTSBTb3VyY2Ugc3VwcG9ydHMgaXNvbGF0aW9uLiBJdCBoYXMgdGhlIGZ1bmN0aW9ucyBgaXNvbGF0ZVNpbmtgXG4gKiBhbmQgYGlzb2xhdGVTb3VyY2VgIGF0dGFjaGVkIHRvIGl0LCBhbmQgcGVyZm9ybXMgc2ltcGxlIGlzb2xhdGlvbiB1c2luZ1xuICogY2xhc3NOYW1lcy4gKmlzb2xhdGVTaW5rKiB3aXRoIHNjb3BlIGBmb29gIHdpbGwgYXBwZW5kIHRoZSBjbGFzcyBgX19fZm9vYCB0b1xuICogdGhlIHN0cmVhbSBvZiB2aXJ0dWFsIERPTSBub2RlcywgYW5kICppc29sYXRlU291cmNlKiB3aXRoIHNjb3BlIGBmb29gIHdpbGxcbiAqIHBlcmZvcm0gYSBjb252ZW50aW9uYWwgYG1vY2tlZERPTVNvdXJjZS5zZWxlY3QoJy5fX2ZvbycpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBtb2NrQ29uZmlnIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBzZWxlY3RvciBzdHJpbmdzXG4gKiBhbmQgdmFsdWVzIGFyZSBvYmplY3RzLiBUaG9zZSBuZXN0ZWQgb2JqZWN0cyBoYXZlIGBldmVudFR5cGVgIHN0cmluZ3MgYXMga2V5c1xuICogYW5kIHZhbHVlcyBhcmUgc3RyZWFtcyB5b3UgY3JlYXRlZC5cbiAqIEByZXR1cm4ge09iamVjdH0gZmFrZSBET00gc291cmNlIG9iamVjdCwgd2l0aCBhbiBBUEkgY29udGFpbmluZyBgc2VsZWN0KClgXG4gKiBhbmQgYGV2ZW50cygpYCBhbmQgYGVsZW1lbnRzKClgIHdoaWNoIGNhbiBiZSB1c2VkIGp1c3QgbGlrZSB0aGUgRE9NIERyaXZlcidzXG4gKiBET01Tb3VyY2UuXG4gKlxuICogQGZ1bmN0aW9uIG1vY2tET01Tb3VyY2VcbiAqL1xudmFyIG1vY2tET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL21vY2tET01Tb3VyY2VcIik7XG5leHBvcnRzLm1vY2tET01Tb3VyY2UgPSBtb2NrRE9NU291cmNlXzEubW9ja0RPTVNvdXJjZTtcbmV4cG9ydHMuTW9ja2VkRE9NU291cmNlID0gbW9ja0RPTVNvdXJjZV8xLk1vY2tlZERPTVNvdXJjZTtcbi8qKlxuICogVGhlIGh5cGVyc2NyaXB0IGZ1bmN0aW9uIGBoKClgIGlzIGEgZnVuY3Rpb24gdG8gY3JlYXRlIHZpcnR1YWwgRE9NIG9iamVjdHMsXG4gKiBhbHNvIGtub3duIGFzIFZOb2Rlcy4gQ2FsbFxuICpcbiAqIGBgYGpzXG4gKiBoKCdkaXYubXlDbGFzcycsIHtzdHlsZToge2NvbG9yOiAncmVkJ319LCBbXSlcbiAqIGBgYFxuICpcbiAqIHRvIGNyZWF0ZSBhIFZOb2RlIHRoYXQgcmVwcmVzZW50cyBhIGBESVZgIGVsZW1lbnQgd2l0aCBjbGFzc05hbWUgYG15Q2xhc3NgLFxuICogc3R5bGVkIHdpdGggcmVkIGNvbG9yLCBhbmQgbm8gY2hpbGRyZW4gYmVjYXVzZSB0aGUgYFtdYCBhcnJheSB3YXMgcGFzc2VkLiBUaGVcbiAqIEFQSSBpcyBgaCh0YWdPclNlbGVjdG9yLCBvcHRpb25hbERhdGEsIG9wdGlvbmFsQ2hpbGRyZW5PclRleHQpYC5cbiAqXG4gKiBIb3dldmVyLCB1c3VhbGx5IHlvdSBzaG91bGQgdXNlIFwiaHlwZXJzY3JpcHQgaGVscGVyc1wiLCB3aGljaCBhcmUgc2hvcnRjdXRcbiAqIGZ1bmN0aW9ucyBiYXNlZCBvbiBoeXBlcnNjcmlwdC4gVGhlcmUgaXMgb25lIGh5cGVyc2NyaXB0IGhlbHBlciBmdW5jdGlvbiBmb3JcbiAqIGVhY2ggRE9NIHRhZ05hbWUsIHN1Y2ggYXMgYGgxKClgLCBgaDIoKWAsIGBkaXYoKWAsIGBzcGFuKClgLCBgbGFiZWwoKWAsXG4gKiBgaW5wdXQoKWAuIEZvciBpbnN0YW5jZSwgdGhlIHByZXZpb3VzIGV4YW1wbGUgY291bGQgaGF2ZSBiZWVuIHdyaXR0ZW5cbiAqIGFzOlxuICpcbiAqIGBgYGpzXG4gKiBkaXYoJy5teUNsYXNzJywge3N0eWxlOiB7Y29sb3I6ICdyZWQnfX0sIFtdKVxuICogYGBgXG4gKlxuICogVGhlcmUgYXJlIGFsc28gU1ZHIGhlbHBlciBmdW5jdGlvbnMsIHdoaWNoIGFwcGx5IHRoZSBhcHByb3ByaWF0ZSBTVkdcbiAqIG5hbWVzcGFjZSB0byB0aGUgcmVzdWx0aW5nIGVsZW1lbnRzLiBgc3ZnKClgIGZ1bmN0aW9uIGNyZWF0ZXMgdGhlIHRvcC1tb3N0XG4gKiBTVkcgZWxlbWVudCwgYW5kIGBzdmcuZ2AsIGBzdmcucG9seWdvbmAsIGBzdmcuY2lyY2xlYCwgYHN2Zy5wYXRoYCBhcmUgZm9yXG4gKiBTVkctc3BlY2lmaWMgY2hpbGQgZWxlbWVudHMuIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIHN2Zyh7YXR0cnM6IHt3aWR0aDogMTUwLCBoZWlnaHQ6IDE1MH19LCBbXG4gKiAgIHN2Zy5wb2x5Z29uKHtcbiAqICAgICBhdHRyczoge1xuICogICAgICAgY2xhc3M6ICd0cmlhbmdsZScsXG4gKiAgICAgICBwb2ludHM6ICcyMCAwIDIwIDE1MCAxNTAgMjAnXG4gKiAgICAgfVxuICogICB9KVxuICogXSlcbiAqIGBgYFxuICpcbiAqIEBmdW5jdGlvbiBoXG4gKi9cbnZhciBoXzEgPSByZXF1aXJlKFwic25hYmJkb20vaFwiKTtcbmV4cG9ydHMuaCA9IGhfMS5oO1xudmFyIGh5cGVyc2NyaXB0X2hlbHBlcnNfMSA9IHJlcXVpcmUoXCIuL2h5cGVyc2NyaXB0LWhlbHBlcnNcIik7XG5leHBvcnRzLnN2ZyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN2ZztcbmV4cG9ydHMuYSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmE7XG5leHBvcnRzLmFiYnIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hYmJyO1xuZXhwb3J0cy5hZGRyZXNzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYWRkcmVzcztcbmV4cG9ydHMuYXJlYSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFyZWE7XG5leHBvcnRzLmFydGljbGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hcnRpY2xlO1xuZXhwb3J0cy5hc2lkZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFzaWRlO1xuZXhwb3J0cy5hdWRpbyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmF1ZGlvO1xuZXhwb3J0cy5iID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYjtcbmV4cG9ydHMuYmFzZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJhc2U7XG5leHBvcnRzLmJkaSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJkaTtcbmV4cG9ydHMuYmRvID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmRvO1xuZXhwb3J0cy5ibG9ja3F1b3RlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmxvY2txdW90ZTtcbmV4cG9ydHMuYm9keSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJvZHk7XG5leHBvcnRzLmJyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYnI7XG5leHBvcnRzLmJ1dHRvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmJ1dHRvbjtcbmV4cG9ydHMuY2FudmFzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY2FudmFzO1xuZXhwb3J0cy5jYXB0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY2FwdGlvbjtcbmV4cG9ydHMuY2l0ZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNpdGU7XG5leHBvcnRzLmNvZGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jb2RlO1xuZXhwb3J0cy5jb2wgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jb2w7XG5leHBvcnRzLmNvbGdyb3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY29sZ3JvdXA7XG5leHBvcnRzLmRkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGQ7XG5leHBvcnRzLmRlbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRlbDtcbmV4cG9ydHMuZGZuID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGZuO1xuZXhwb3J0cy5kaXIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kaXI7XG5leHBvcnRzLmRpdiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRpdjtcbmV4cG9ydHMuZGwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kbDtcbmV4cG9ydHMuZHQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kdDtcbmV4cG9ydHMuZW0gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5lbTtcbmV4cG9ydHMuZW1iZWQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5lbWJlZDtcbmV4cG9ydHMuZmllbGRzZXQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5maWVsZHNldDtcbmV4cG9ydHMuZmlnY2FwdGlvbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZpZ2NhcHRpb247XG5leHBvcnRzLmZpZ3VyZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZpZ3VyZTtcbmV4cG9ydHMuZm9vdGVyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZm9vdGVyO1xuZXhwb3J0cy5mb3JtID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZm9ybTtcbmV4cG9ydHMuaDEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oMTtcbmV4cG9ydHMuaDIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oMjtcbmV4cG9ydHMuaDMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oMztcbmV4cG9ydHMuaDQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oNDtcbmV4cG9ydHMuaDUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oNTtcbmV4cG9ydHMuaDYgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oNjtcbmV4cG9ydHMuaGVhZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmhlYWQ7XG5leHBvcnRzLmhlYWRlciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmhlYWRlcjtcbmV4cG9ydHMuaGdyb3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaGdyb3VwO1xuZXhwb3J0cy5ociA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmhyO1xuZXhwb3J0cy5odG1sID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaHRtbDtcbmV4cG9ydHMuaSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmk7XG5leHBvcnRzLmlmcmFtZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmlmcmFtZTtcbmV4cG9ydHMuaW1nID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaW1nO1xuZXhwb3J0cy5pbnB1dCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmlucHV0O1xuZXhwb3J0cy5pbnMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pbnM7XG5leHBvcnRzLmtiZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmtiZDtcbmV4cG9ydHMua2V5Z2VuID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQua2V5Z2VuO1xuZXhwb3J0cy5sYWJlbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmxhYmVsO1xuZXhwb3J0cy5sZWdlbmQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5sZWdlbmQ7XG5leHBvcnRzLmxpID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubGk7XG5leHBvcnRzLmxpbmsgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5saW5rO1xuZXhwb3J0cy5tYWluID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWFpbjtcbmV4cG9ydHMubWFwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWFwO1xuZXhwb3J0cy5tYXJrID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWFyaztcbmV4cG9ydHMubWVudSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1lbnU7XG5leHBvcnRzLm1ldGEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tZXRhO1xuZXhwb3J0cy5uYXYgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5uYXY7XG5leHBvcnRzLm5vc2NyaXB0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubm9zY3JpcHQ7XG5leHBvcnRzLm9iamVjdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9iamVjdDtcbmV4cG9ydHMub2wgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vbDtcbmV4cG9ydHMub3B0Z3JvdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vcHRncm91cDtcbmV4cG9ydHMub3B0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQub3B0aW9uO1xuZXhwb3J0cy5wID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucDtcbmV4cG9ydHMucGFyYW0gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wYXJhbTtcbmV4cG9ydHMucHJlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucHJlO1xuZXhwb3J0cy5wcm9ncmVzcyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnByb2dyZXNzO1xuZXhwb3J0cy5xID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucTtcbmV4cG9ydHMucnAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ycDtcbmV4cG9ydHMucnQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ydDtcbmV4cG9ydHMucnVieSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnJ1Ynk7XG5leHBvcnRzLnMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zO1xuZXhwb3J0cy5zYW1wID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2FtcDtcbmV4cG9ydHMuc2NyaXB0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2NyaXB0O1xuZXhwb3J0cy5zZWN0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2VjdGlvbjtcbmV4cG9ydHMuc2VsZWN0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc2VsZWN0O1xuZXhwb3J0cy5zbWFsbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNtYWxsO1xuZXhwb3J0cy5zb3VyY2UgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zb3VyY2U7XG5leHBvcnRzLnNwYW4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zcGFuO1xuZXhwb3J0cy5zdHJvbmcgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdHJvbmc7XG5leHBvcnRzLnN0eWxlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3R5bGU7XG5leHBvcnRzLnN1YiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN1YjtcbmV4cG9ydHMuc3VwID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3VwO1xuZXhwb3J0cy50YWJsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRhYmxlO1xuZXhwb3J0cy50Ym9keSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRib2R5O1xuZXhwb3J0cy50ZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRkO1xuZXhwb3J0cy50ZXh0YXJlYSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRleHRhcmVhO1xuZXhwb3J0cy50Zm9vdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRmb290O1xuZXhwb3J0cy50aCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRoO1xuZXhwb3J0cy50aGVhZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRoZWFkO1xuZXhwb3J0cy50aXRsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRpdGxlO1xuZXhwb3J0cy50ciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnRyO1xuZXhwb3J0cy51ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudTtcbmV4cG9ydHMudWwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC51bDtcbmV4cG9ydHMudmlkZW8gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC52aWRlbztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgZnVuY3Rpb24gKCkge1xuICAgIF9fYXNzaWduID0gT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdDtcbiAgICB9O1xuICAgIHJldHVybiBfX2Fzc2lnbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5mdW5jdGlvbiBtYWtlSXNvbGF0ZVNpbmsobmFtZXNwYWNlKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzaW5rLCBzY29wZSkge1xuICAgICAgICBpZiAoc2NvcGUgPT09ICc6cm9vdCcpIHtcbiAgICAgICAgICAgIHJldHVybiBzaW5rO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaW5rLm1hcChmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2NvcGVPYmogPSBnZXRTY29wZU9iaihzY29wZSk7XG4gICAgICAgICAgICB2YXIgbmV3Tm9kZSA9IF9fYXNzaWduKHt9LCBub2RlLCB7IGRhdGE6IF9fYXNzaWduKHt9LCBub2RlLmRhdGEsIHsgaXNvbGF0ZTogIW5vZGUuZGF0YSB8fCAhQXJyYXkuaXNBcnJheShub2RlLmRhdGEuaXNvbGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgID8gbmFtZXNwYWNlLmNvbmNhdChbc2NvcGVPYmpdKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBub2RlLmRhdGEuaXNvbGF0ZSB9KSB9KTtcbiAgICAgICAgICAgIHJldHVybiBfX2Fzc2lnbih7fSwgbmV3Tm9kZSwgeyBrZXk6IG5ld05vZGUua2V5ICE9PSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgPyBuZXdOb2RlLmtleVxuICAgICAgICAgICAgICAgICAgICA6IEpTT04uc3RyaW5naWZ5KG5ld05vZGUuZGF0YS5pc29sYXRlKSB9KTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZUlzb2xhdGVTaW5rID0gbWFrZUlzb2xhdGVTaW5rO1xuZnVuY3Rpb24gZ2V0U2NvcGVPYmooc2NvcGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0eXBlOiB1dGlsc18xLmlzQ2xhc3NPcklkKHNjb3BlKSA/ICdzaWJsaW5nJyA6ICd0b3RhbCcsXG4gICAgICAgIHNjb3BlOiBzY29wZSxcbiAgICB9O1xufVxuZXhwb3J0cy5nZXRTY29wZU9iaiA9IGdldFNjb3BlT2JqO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aXNvbGF0ZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBzbmFiYmRvbV8xID0gcmVxdWlyZShcInNuYWJiZG9tXCIpO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGNvbmNhdF8xID0gcmVxdWlyZShcInhzdHJlYW0vZXh0cmEvY29uY2F0XCIpO1xudmFyIHNhbXBsZUNvbWJpbmVfMSA9IHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL3NhbXBsZUNvbWJpbmVcIik7XG52YXIgTWFpbkRPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vTWFpbkRPTVNvdXJjZVwiKTtcbnZhciB0b3Zub2RlXzEgPSByZXF1aXJlKFwic25hYmJkb20vdG92bm9kZVwiKTtcbnZhciBWTm9kZVdyYXBwZXJfMSA9IHJlcXVpcmUoXCIuL1ZOb2RlV3JhcHBlclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgbW9kdWxlc18xID0gcmVxdWlyZShcIi4vbW9kdWxlc1wiKTtcbnZhciBJc29sYXRlTW9kdWxlXzEgPSByZXF1aXJlKFwiLi9Jc29sYXRlTW9kdWxlXCIpO1xudmFyIEV2ZW50RGVsZWdhdG9yXzEgPSByZXF1aXJlKFwiLi9FdmVudERlbGVnYXRvclwiKTtcbmZ1bmN0aW9uIG1ha2VET01Ecml2ZXJJbnB1dEd1YXJkKG1vZHVsZXMpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkobW9kdWxlcykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiT3B0aW9uYWwgbW9kdWxlcyBvcHRpb24gbXVzdCBiZSBhbiBhcnJheSBmb3Igc25hYmJkb20gbW9kdWxlc1wiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkb21Ecml2ZXJJbnB1dEd1YXJkKHZpZXckKSB7XG4gICAgaWYgKCF2aWV3JCB8fFxuICAgICAgICB0eXBlb2YgdmlldyQuYWRkTGlzdGVuZXIgIT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICAgICB0eXBlb2YgdmlldyQuZm9sZCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBET00gZHJpdmVyIGZ1bmN0aW9uIGV4cGVjdHMgYXMgaW5wdXQgYSBTdHJlYW0gb2YgXCIgK1xuICAgICAgICAgICAgXCJ2aXJ0dWFsIERPTSBlbGVtZW50c1wiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkcm9wQ29tcGxldGlvbihpbnB1dCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbnB1dCwgeHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKSk7XG59XG5mdW5jdGlvbiB1bndyYXBFbGVtZW50RnJvbVZOb2RlKHZub2RlKSB7XG4gICAgcmV0dXJuIHZub2RlLmVsbTtcbn1cbmZ1bmN0aW9uIHJlcG9ydFNuYWJiZG9tRXJyb3IoZXJyKSB7XG4gICAgKGNvbnNvbGUuZXJyb3IgfHwgY29uc29sZS5sb2cpKGVycik7XG59XG5mdW5jdGlvbiBtYWtlRE9NUmVhZHkkKCkge1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoe1xuICAgICAgICBzdGFydDogZnVuY3Rpb24gKGxpcykge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3JlYWR5c3RhdGVjaGFuZ2UnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9IGRvY3VtZW50LnJlYWR5U3RhdGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdGF0ZSA9PT0gJ2ludGVyYWN0aXZlJyB8fCBzdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGlzLm5leHQobnVsbCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXMuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGlzLm5leHQobnVsbCk7XG4gICAgICAgICAgICAgICAgbGlzLmNvbXBsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGFkZFJvb3RTY29wZSh2bm9kZSkge1xuICAgIHZub2RlLmRhdGEgPSB2bm9kZS5kYXRhIHx8IHt9O1xuICAgIHZub2RlLmRhdGEuaXNvbGF0ZSA9IFtdO1xuICAgIHJldHVybiB2bm9kZTtcbn1cbmZ1bmN0aW9uIG1ha2VET01Ecml2ZXIoY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG4gICAgdXRpbHNfMS5jaGVja1ZhbGlkQ29udGFpbmVyKGNvbnRhaW5lcik7XG4gICAgdmFyIG1vZHVsZXMgPSBvcHRpb25zLm1vZHVsZXMgfHwgbW9kdWxlc18xLmRlZmF1bHQ7XG4gICAgbWFrZURPTURyaXZlcklucHV0R3VhcmQobW9kdWxlcyk7XG4gICAgdmFyIGlzb2xhdGVNb2R1bGUgPSBuZXcgSXNvbGF0ZU1vZHVsZV8xLklzb2xhdGVNb2R1bGUoKTtcbiAgICB2YXIgcGF0Y2ggPSBzbmFiYmRvbV8xLmluaXQoW2lzb2xhdGVNb2R1bGUuY3JlYXRlTW9kdWxlKCldLmNvbmNhdChtb2R1bGVzKSk7XG4gICAgdmFyIGRvbVJlYWR5JCA9IG1ha2VET01SZWFkeSQoKTtcbiAgICB2YXIgdm5vZGVXcmFwcGVyO1xuICAgIHZhciBtdXRhdGlvbk9ic2VydmVyO1xuICAgIHZhciBtdXRhdGlvbkNvbmZpcm1lZCQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoe1xuICAgICAgICBzdGFydDogZnVuY3Rpb24gKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBtdXRhdGlvbk9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoZnVuY3Rpb24gKCkgeyByZXR1cm4gbGlzdGVuZXIubmV4dChudWxsKTsgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIG11dGF0aW9uT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgICB9LFxuICAgIH0pO1xuICAgIGZ1bmN0aW9uIERPTURyaXZlcih2bm9kZSQsIG5hbWUpIHtcbiAgICAgICAgaWYgKG5hbWUgPT09IHZvaWQgMCkgeyBuYW1lID0gJ0RPTSc7IH1cbiAgICAgICAgZG9tRHJpdmVySW5wdXRHdWFyZCh2bm9kZSQpO1xuICAgICAgICB2YXIgc2FuaXRhdGlvbiQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgdmFyIGZpcnN0Um9vdCQgPSBkb21SZWFkeSQubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmaXJzdFJvb3QgPSB1dGlsc18xLmdldFZhbGlkTm9kZShjb250YWluZXIpIHx8IGRvY3VtZW50LmJvZHk7XG4gICAgICAgICAgICB2bm9kZVdyYXBwZXIgPSBuZXcgVk5vZGVXcmFwcGVyXzEuVk5vZGVXcmFwcGVyKGZpcnN0Um9vdCk7XG4gICAgICAgICAgICByZXR1cm4gZmlyc3RSb290O1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gV2UgbmVlZCB0byBzdWJzY3JpYmUgdG8gdGhlIHNpbmsgKGkuZS4gdm5vZGUkKSBzeW5jaHJvbm91c2x5IGluc2lkZSB0aGlzXG4gICAgICAgIC8vIGRyaXZlciwgYW5kIG5vdCBsYXRlciBpbiB0aGUgbWFwKCkuZmxhdHRlbigpIGJlY2F1c2UgdGhpcyBzaW5rIGlzIGluXG4gICAgICAgIC8vIHJlYWxpdHkgYSBTaW5rUHJveHkgZnJvbSBAY3ljbGUvcnVuLCBhbmQgd2UgZG9uJ3Qgd2FudCB0byBtaXNzIHRoZSBmaXJzdFxuICAgICAgICAvLyBlbWlzc2lvbiB3aGVuIHRoZSBtYWluKCkgaXMgY29ubmVjdGVkIHRvIHRoZSBkcml2ZXJzLlxuICAgICAgICAvLyBSZWFkIG1vcmUgaW4gaXNzdWUgIzczOS5cbiAgICAgICAgdmFyIHJlbWVtYmVyZWRWTm9kZSQgPSB2bm9kZSQucmVtZW1iZXIoKTtcbiAgICAgICAgcmVtZW1iZXJlZFZOb2RlJC5hZGRMaXN0ZW5lcih7fSk7XG4gICAgICAgIC8vIFRoZSBtdXRhdGlvbiBvYnNlcnZlciBpbnRlcm5hbCB0byBtdXRhdGlvbkNvbmZpcm1lZCQgc2hvdWxkXG4gICAgICAgIC8vIGV4aXN0IGJlZm9yZSBlbGVtZW50QWZ0ZXJQYXRjaCQgY2FsbHMgbXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKClcbiAgICAgICAgbXV0YXRpb25Db25maXJtZWQkLmFkZExpc3RlbmVyKHt9KTtcbiAgICAgICAgdmFyIGVsZW1lbnRBZnRlclBhdGNoJCA9IGZpcnN0Um9vdCRcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGZpcnN0Um9vdCkge1xuICAgICAgICAgICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0XG4gICAgICAgICAgICAgICAgLm1lcmdlKHJlbWVtYmVyZWRWTm9kZSQuZW5kV2hlbihzYW5pdGF0aW9uJCksIHNhbml0YXRpb24kKVxuICAgICAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKHZub2RlKSB7IHJldHVybiB2bm9kZVdyYXBwZXIuY2FsbCh2bm9kZSk7IH0pXG4gICAgICAgICAgICAgICAgLnN0YXJ0V2l0aChhZGRSb290U2NvcGUodG92bm9kZV8xLnRvVk5vZGUoZmlyc3RSb290KSkpXG4gICAgICAgICAgICAgICAgLmZvbGQocGF0Y2gsIHRvdm5vZGVfMS50b1ZOb2RlKGZpcnN0Um9vdCkpXG4gICAgICAgICAgICAgICAgLmRyb3AoMSlcbiAgICAgICAgICAgICAgICAubWFwKHVud3JhcEVsZW1lbnRGcm9tVk5vZGUpXG4gICAgICAgICAgICAgICAgLnN0YXJ0V2l0aChmaXJzdFJvb3QpXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoZWwpIHtcbiAgICAgICAgICAgICAgICBtdXRhdGlvbk9ic2VydmVyLm9ic2VydmUoZWwsIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJEYXRhOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVPbGRWYWx1ZTogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgY2hhcmFjdGVyRGF0YU9sZFZhbHVlOiB0cnVlLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBlbDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNvbXBvc2UoZHJvcENvbXBsZXRpb24pO1xuICAgICAgICB9IC8vIGRvbid0IGNvbXBsZXRlIHRoaXMgc3RyZWFtXG4gICAgICAgIClcbiAgICAgICAgICAgIC5mbGF0dGVuKCk7XG4gICAgICAgIHZhciByb290RWxlbWVudCQgPSBjb25jYXRfMS5kZWZhdWx0KGRvbVJlYWR5JCwgbXV0YXRpb25Db25maXJtZWQkKVxuICAgICAgICAgICAgLmVuZFdoZW4oc2FuaXRhdGlvbiQpXG4gICAgICAgICAgICAuY29tcG9zZShzYW1wbGVDb21iaW5lXzEuZGVmYXVsdChlbGVtZW50QWZ0ZXJQYXRjaCQpKVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoYXJyKSB7IHJldHVybiBhcnJbMV07IH0pXG4gICAgICAgICAgICAucmVtZW1iZXIoKTtcbiAgICAgICAgLy8gU3RhcnQgdGhlIHNuYWJiZG9tIHBhdGNoaW5nLCBvdmVyIHRpbWVcbiAgICAgICAgcm9vdEVsZW1lbnQkLmFkZExpc3RlbmVyKHsgZXJyb3I6IHJlcG9ydFNuYWJiZG9tRXJyb3IgfSk7XG4gICAgICAgIHZhciBkZWxlZ2F0b3IgPSBuZXcgRXZlbnREZWxlZ2F0b3JfMS5FdmVudERlbGVnYXRvcihyb290RWxlbWVudCQsIGlzb2xhdGVNb2R1bGUpO1xuICAgICAgICByZXR1cm4gbmV3IE1haW5ET01Tb3VyY2VfMS5NYWluRE9NU291cmNlKHJvb3RFbGVtZW50JCwgc2FuaXRhdGlvbiQsIFtdLCBpc29sYXRlTW9kdWxlLCBkZWxlZ2F0b3IsIG5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gRE9NRHJpdmVyO1xufVxuZXhwb3J0cy5tYWtlRE9NRHJpdmVyID0gbWFrZURPTURyaXZlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1ha2VET01Ecml2ZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBTQ09QRV9QUkVGSVggPSAnX19fJztcbnZhciBNb2NrZWRET01Tb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTW9ja2VkRE9NU291cmNlKF9tb2NrQ29uZmlnKSB7XG4gICAgICAgIHRoaXMuX21vY2tDb25maWcgPSBfbW9ja0NvbmZpZztcbiAgICAgICAgaWYgKF9tb2NrQ29uZmlnLmVsZW1lbnRzKSB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50cyA9IF9tb2NrQ29uZmlnLmVsZW1lbnRzO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZWxlbWVudHMgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0LmVtcHR5KCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzXG4gICAgICAgICAgICAuX2VsZW1lbnRzO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSAnTW9ja2VkRE9NJztcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuZWxlbWVudCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dHB1dCQgPSB0aGlzLmVsZW1lbnRzKClcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGFycikgeyByZXR1cm4gYXJyLmxlbmd0aCA+IDA7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChhcnIpIHsgcmV0dXJuIGFyclswXTsgfSlcbiAgICAgICAgICAgIC5yZW1lbWJlcigpO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChvdXRwdXQkKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gJ01vY2tlZERPTSc7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBNb2NrZWRET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMsIGJ1YmJsZXMpIHtcbiAgICAgICAgdmFyIHN0cmVhbUZvckV2ZW50VHlwZSA9IHRoaXMuX21vY2tDb25maWdbZXZlbnRUeXBlXTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoc3RyZWFtRm9yRXZlbnRUeXBlIHx8IHhzdHJlYW1fMS5kZWZhdWx0LmVtcHR5KCkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSAnTW9ja2VkRE9NJztcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHZhciBtb2NrQ29uZmlnRm9yU2VsZWN0b3IgPSB0aGlzLl9tb2NrQ29uZmlnW3NlbGVjdG9yXSB8fCB7fTtcbiAgICAgICAgcmV0dXJuIG5ldyBNb2NrZWRET01Tb3VyY2UobW9ja0NvbmZpZ0ZvclNlbGVjdG9yKTtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuaXNvbGF0ZVNvdXJjZSA9IGZ1bmN0aW9uIChzb3VyY2UsIHNjb3BlKSB7XG4gICAgICAgIHJldHVybiBzb3VyY2Uuc2VsZWN0KCcuJyArIFNDT1BFX1BSRUZJWCArIHNjb3BlKTtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuaXNvbGF0ZVNpbmsgPSBmdW5jdGlvbiAoc2luaywgc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2luaykubWFwKGZ1bmN0aW9uICh2bm9kZSkge1xuICAgICAgICAgICAgaWYgKHZub2RlLnNlbCAmJiB2bm9kZS5zZWwuaW5kZXhPZihTQ09QRV9QUkVGSVggKyBzY29wZSkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdm5vZGUuc2VsICs9IFwiLlwiICsgU0NPUEVfUFJFRklYICsgc2NvcGU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KSk7XG4gICAgfTtcbiAgICByZXR1cm4gTW9ja2VkRE9NU291cmNlO1xufSgpKTtcbmV4cG9ydHMuTW9ja2VkRE9NU291cmNlID0gTW9ja2VkRE9NU291cmNlO1xuZnVuY3Rpb24gbW9ja0RPTVNvdXJjZShtb2NrQ29uZmlnKSB7XG4gICAgcmV0dXJuIG5ldyBNb2NrZWRET01Tb3VyY2UobW9ja0NvbmZpZyk7XG59XG5leHBvcnRzLm1vY2tET01Tb3VyY2UgPSBtb2NrRE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bW9ja0RPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBjbGFzc18xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvY2xhc3NcIik7XG5leHBvcnRzLkNsYXNzTW9kdWxlID0gY2xhc3NfMS5kZWZhdWx0O1xudmFyIHByb3BzXzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9wcm9wc1wiKTtcbmV4cG9ydHMuUHJvcHNNb2R1bGUgPSBwcm9wc18xLmRlZmF1bHQ7XG52YXIgYXR0cmlidXRlc18xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvYXR0cmlidXRlc1wiKTtcbmV4cG9ydHMuQXR0cnNNb2R1bGUgPSBhdHRyaWJ1dGVzXzEuZGVmYXVsdDtcbnZhciBzdHlsZV8xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvc3R5bGVcIik7XG5leHBvcnRzLlN0eWxlTW9kdWxlID0gc3R5bGVfMS5kZWZhdWx0O1xudmFyIGRhdGFzZXRfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL2RhdGFzZXRcIik7XG5leHBvcnRzLkRhdGFzZXRNb2R1bGUgPSBkYXRhc2V0XzEuZGVmYXVsdDtcbnZhciBtb2R1bGVzID0gW1xuICAgIHN0eWxlXzEuZGVmYXVsdCxcbiAgICBjbGFzc18xLmRlZmF1bHQsXG4gICAgcHJvcHNfMS5kZWZhdWx0LFxuICAgIGF0dHJpYnV0ZXNfMS5kZWZhdWx0LFxuICAgIGRhdGFzZXRfMS5kZWZhdWx0LFxuXTtcbmV4cG9ydHMuZGVmYXVsdCA9IG1vZHVsZXM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tb2R1bGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xuZnVuY3Rpb24gY29weVRvVGh1bmsodm5vZGUsIHRodW5rVk5vZGUpIHtcbiAgICB0aHVua1ZOb2RlLmVsbSA9IHZub2RlLmVsbTtcbiAgICB2bm9kZS5kYXRhLmZuID0gdGh1bmtWTm9kZS5kYXRhLmZuO1xuICAgIHZub2RlLmRhdGEuYXJncyA9IHRodW5rVk5vZGUuZGF0YS5hcmdzO1xuICAgIHZub2RlLmRhdGEuaXNvbGF0ZSA9IHRodW5rVk5vZGUuZGF0YS5pc29sYXRlO1xuICAgIHRodW5rVk5vZGUuZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgdGh1bmtWTm9kZS5jaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xuICAgIHRodW5rVk5vZGUudGV4dCA9IHZub2RlLnRleHQ7XG4gICAgdGh1bmtWTm9kZS5lbG0gPSB2bm9kZS5lbG07XG59XG5mdW5jdGlvbiBpbml0KHRodW5rVk5vZGUpIHtcbiAgICB2YXIgY3VyID0gdGh1bmtWTm9kZS5kYXRhO1xuICAgIHZhciB2bm9kZSA9IGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGN1ci5hcmdzKTtcbiAgICBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmtWTm9kZSk7XG59XG5mdW5jdGlvbiBwcmVwYXRjaChvbGRWbm9kZSwgdGh1bmtWTm9kZSkge1xuICAgIHZhciBvbGQgPSBvbGRWbm9kZS5kYXRhLCBjdXIgPSB0aHVua1ZOb2RlLmRhdGE7XG4gICAgdmFyIGk7XG4gICAgdmFyIG9sZEFyZ3MgPSBvbGQuYXJncywgYXJncyA9IGN1ci5hcmdzO1xuICAgIGlmIChvbGQuZm4gIT09IGN1ci5mbiB8fCBvbGRBcmdzLmxlbmd0aCAhPT0gYXJncy5sZW5ndGgpIHtcbiAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rVk5vZGUpO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgYXJncy5sZW5ndGg7ICsraSkge1xuICAgICAgICBpZiAob2xkQXJnc1tpXSAhPT0gYXJnc1tpXSkge1xuICAgICAgICAgICAgY29weVRvVGh1bmsoY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgYXJncyksIHRodW5rVk5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvcHlUb1RodW5rKG9sZFZub2RlLCB0aHVua1ZOb2RlKTtcbn1cbmZ1bmN0aW9uIHRodW5rKHNlbCwga2V5LCBmbiwgYXJncykge1xuICAgIGlmIChhcmdzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgYXJncyA9IGZuO1xuICAgICAgICBmbiA9IGtleTtcbiAgICAgICAga2V5ID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICByZXR1cm4gaF8xLmgoc2VsLCB7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICBob29rOiB7IGluaXQ6IGluaXQsIHByZXBhdGNoOiBwcmVwYXRjaCB9LFxuICAgICAgICBmbjogZm4sXG4gICAgICAgIGFyZ3M6IGFyZ3MsXG4gICAgfSk7XG59XG5leHBvcnRzLnRodW5rID0gdGh1bms7XG5leHBvcnRzLmRlZmF1bHQgPSB0aHVuaztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRodW5rLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gaXNWYWxpZE5vZGUob2JqKSB7XG4gICAgdmFyIEVMRU1fVFlQRSA9IDE7XG4gICAgdmFyIEZSQUdfVFlQRSA9IDExO1xuICAgIHJldHVybiB0eXBlb2YgSFRNTEVsZW1lbnQgPT09ICdvYmplY3QnXG4gICAgICAgID8gb2JqIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQgfHwgb2JqIGluc3RhbmNlb2YgRG9jdW1lbnRGcmFnbWVudFxuICAgICAgICA6IG9iaiAmJlxuICAgICAgICAgICAgdHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgJiZcbiAgICAgICAgICAgIG9iaiAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgKG9iai5ub2RlVHlwZSA9PT0gRUxFTV9UWVBFIHx8IG9iai5ub2RlVHlwZSA9PT0gRlJBR19UWVBFKSAmJlxuICAgICAgICAgICAgdHlwZW9mIG9iai5ub2RlTmFtZSA9PT0gJ3N0cmluZyc7XG59XG5mdW5jdGlvbiBpc0NsYXNzT3JJZChzdHIpIHtcbiAgICByZXR1cm4gc3RyLmxlbmd0aCA+IDEgJiYgKHN0clswXSA9PT0gJy4nIHx8IHN0clswXSA9PT0gJyMnKTtcbn1cbmV4cG9ydHMuaXNDbGFzc09ySWQgPSBpc0NsYXNzT3JJZDtcbmZ1bmN0aW9uIGlzRG9jRnJhZyhlbCkge1xuICAgIHJldHVybiBlbC5ub2RlVHlwZSA9PT0gMTE7XG59XG5leHBvcnRzLmlzRG9jRnJhZyA9IGlzRG9jRnJhZztcbmZ1bmN0aW9uIGNoZWNrVmFsaWRDb250YWluZXIoY29udGFpbmVyKSB7XG4gICAgaWYgKHR5cGVvZiBjb250YWluZXIgIT09ICdzdHJpbmcnICYmICFpc1ZhbGlkTm9kZShjb250YWluZXIpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignR2l2ZW4gY29udGFpbmVyIGlzIG5vdCBhIERPTSBlbGVtZW50IG5laXRoZXIgYSBzZWxlY3RvciBzdHJpbmcuJyk7XG4gICAgfVxufVxuZXhwb3J0cy5jaGVja1ZhbGlkQ29udGFpbmVyID0gY2hlY2tWYWxpZENvbnRhaW5lcjtcbmZ1bmN0aW9uIGdldFZhbGlkTm9kZShzZWxlY3RvcnMpIHtcbiAgICB2YXIgZG9tRWxlbWVudCA9IHR5cGVvZiBzZWxlY3RvcnMgPT09ICdzdHJpbmcnXG4gICAgICAgID8gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcnMpXG4gICAgICAgIDogc2VsZWN0b3JzO1xuICAgIGlmICh0eXBlb2Ygc2VsZWN0b3JzID09PSAnc3RyaW5nJyAmJiBkb21FbGVtZW50ID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZW5kZXIgaW50byB1bmtub3duIGVsZW1lbnQgYFwiICsgc2VsZWN0b3JzICsgXCJgXCIpO1xuICAgIH1cbiAgICByZXR1cm4gZG9tRWxlbWVudDtcbn1cbmV4cG9ydHMuZ2V0VmFsaWROb2RlID0gZ2V0VmFsaWROb2RlO1xuZnVuY3Rpb24gZ2V0U2VsZWN0b3JzKG5hbWVzcGFjZSkge1xuICAgIHZhciByZXMgPSAnJztcbiAgICBmb3IgKHZhciBpID0gbmFtZXNwYWNlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIGlmIChuYW1lc3BhY2VbaV0udHlwZSAhPT0gJ3NlbGVjdG9yJykge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgcmVzID0gbmFtZXNwYWNlW2ldLnNjb3BlICsgJyAnICsgcmVzO1xuICAgIH1cbiAgICByZXR1cm4gcmVzLnRyaW0oKTtcbn1cbmV4cG9ydHMuZ2V0U2VsZWN0b3JzID0gZ2V0U2VsZWN0b3JzO1xuZnVuY3Rpb24gaXNFcXVhbE5hbWVzcGFjZShhLCBiKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KGEpIHx8ICFBcnJheS5pc0FycmF5KGIpIHx8IGEubGVuZ3RoICE9PSBiLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoYVtpXS50eXBlICE9PSBiW2ldLnR5cGUgfHwgYVtpXS5zY29wZSAhPT0gYltpXS5zY29wZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuZXhwb3J0cy5pc0VxdWFsTmFtZXNwYWNlID0gaXNFcXVhbE5hbWVzcGFjZTtcbmZ1bmN0aW9uIG1ha2VJbnNlcnQobWFwKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0eXBlLCBlbG0sIHZhbHVlKSB7XG4gICAgICAgIGlmIChtYXAuaGFzKHR5cGUpKSB7XG4gICAgICAgICAgICB2YXIgaW5uZXJNYXAgPSBtYXAuZ2V0KHR5cGUpO1xuICAgICAgICAgICAgaW5uZXJNYXAuc2V0KGVsbSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIGlubmVyTWFwID0gbmV3IE1hcCgpO1xuICAgICAgICAgICAgaW5uZXJNYXAuc2V0KGVsbSwgdmFsdWUpO1xuICAgICAgICAgICAgbWFwLnNldCh0eXBlLCBpbm5lck1hcCk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlSW5zZXJ0ID0gbWFrZUluc2VydDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXV0aWxzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG5mdW5jdGlvbiBjaGVja0lzb2xhdGVBcmdzKGRhdGFmbG93Q29tcG9uZW50LCBzY29wZSkge1xuICAgIGlmICh0eXBlb2YgZGF0YWZsb3dDb21wb25lbnQgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBnaXZlbiB0byBpc29sYXRlKCkgbXVzdCBiZSBhIFwiICtcbiAgICAgICAgICAgIFwiJ2RhdGFmbG93Q29tcG9uZW50JyBmdW5jdGlvblwiKTtcbiAgICB9XG4gICAgaWYgKHNjb3BlID09PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBnaXZlbiB0byBpc29sYXRlKCkgbXVzdCBub3QgYmUgbnVsbFwiKTtcbiAgICB9XG59XG5mdW5jdGlvbiBub3JtYWxpemVTY29wZXMoc291cmNlcywgc2NvcGVzLCByYW5kb21TY29wZSkge1xuICAgIHZhciBwZXJDaGFubmVsID0ge307XG4gICAgT2JqZWN0LmtleXMoc291cmNlcykuZm9yRWFjaChmdW5jdGlvbiAoY2hhbm5lbCkge1xuICAgICAgICBpZiAodHlwZW9mIHNjb3BlcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSBzY29wZXM7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNhbmRpZGF0ZSA9IHNjb3Blc1tjaGFubmVsXTtcbiAgICAgICAgaWYgKHR5cGVvZiBjYW5kaWRhdGUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gY2FuZGlkYXRlO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciB3aWxkY2FyZCA9IHNjb3Blc1snKiddO1xuICAgICAgICBpZiAodHlwZW9mIHdpbGRjYXJkICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHdpbGRjYXJkO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSByYW5kb21TY29wZTtcbiAgICB9KTtcbiAgICByZXR1cm4gcGVyQ2hhbm5lbDtcbn1cbmZ1bmN0aW9uIGlzb2xhdGVBbGxTb3VyY2VzKG91dGVyU291cmNlcywgc2NvcGVzKSB7XG4gICAgdmFyIGlubmVyU291cmNlcyA9IHt9O1xuICAgIGZvciAodmFyIGNoYW5uZWwgaW4gb3V0ZXJTb3VyY2VzKSB7XG4gICAgICAgIHZhciBvdXRlclNvdXJjZSA9IG91dGVyU291cmNlc1tjaGFubmVsXTtcbiAgICAgICAgaWYgKG91dGVyU291cmNlcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSAmJlxuICAgICAgICAgICAgb3V0ZXJTb3VyY2UgJiZcbiAgICAgICAgICAgIHNjb3Blc1tjaGFubmVsXSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgdHlwZW9mIG91dGVyU291cmNlLmlzb2xhdGVTb3VyY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGlubmVyU291cmNlc1tjaGFubmVsXSA9IG91dGVyU291cmNlLmlzb2xhdGVTb3VyY2Uob3V0ZXJTb3VyY2UsIHNjb3Blc1tjaGFubmVsXSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3V0ZXJTb3VyY2VzLmhhc093blByb3BlcnR5KGNoYW5uZWwpKSB7XG4gICAgICAgICAgICBpbm5lclNvdXJjZXNbY2hhbm5lbF0gPSBvdXRlclNvdXJjZXNbY2hhbm5lbF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGlubmVyU291cmNlcztcbn1cbmZ1bmN0aW9uIGlzb2xhdGVBbGxTaW5rcyhzb3VyY2VzLCBpbm5lclNpbmtzLCBzY29wZXMpIHtcbiAgICB2YXIgb3V0ZXJTaW5rcyA9IHt9O1xuICAgIGZvciAodmFyIGNoYW5uZWwgaW4gaW5uZXJTaW5rcykge1xuICAgICAgICB2YXIgc291cmNlID0gc291cmNlc1tjaGFubmVsXTtcbiAgICAgICAgdmFyIGlubmVyU2luayA9IGlubmVyU2lua3NbY2hhbm5lbF07XG4gICAgICAgIGlmIChpbm5lclNpbmtzLmhhc093blByb3BlcnR5KGNoYW5uZWwpICYmXG4gICAgICAgICAgICBzb3VyY2UgJiZcbiAgICAgICAgICAgIHNjb3Blc1tjaGFubmVsXSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZS5pc29sYXRlU2luayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgb3V0ZXJTaW5rc1tjaGFubmVsXSA9IGFkYXB0XzEuYWRhcHQoc291cmNlLmlzb2xhdGVTaW5rKHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKGlubmVyU2luayksIHNjb3Blc1tjaGFubmVsXSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlubmVyU2lua3MuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkpIHtcbiAgICAgICAgICAgIG91dGVyU2lua3NbY2hhbm5lbF0gPSBpbm5lclNpbmtzW2NoYW5uZWxdO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXRlclNpbmtzO1xufVxudmFyIGNvdW50ZXIgPSAwO1xuZnVuY3Rpb24gbmV3U2NvcGUoKSB7XG4gICAgcmV0dXJuIFwiY3ljbGVcIiArICsrY291bnRlcjtcbn1cbi8qKlxuICogVGFrZXMgYSBgY29tcG9uZW50YCBmdW5jdGlvbiBhbmQgYSBgc2NvcGVgLCBhbmQgcmV0dXJucyBhbiBpc29sYXRlZCB2ZXJzaW9uXG4gKiBvZiB0aGUgYGNvbXBvbmVudGAgZnVuY3Rpb24uXG4gKlxuICogV2hlbiB0aGUgaXNvbGF0ZWQgY29tcG9uZW50IGlzIGludm9rZWQsIGVhY2ggc291cmNlIHByb3ZpZGVkIHRvIGl0IGlzXG4gKiBpc29sYXRlZCB0byB0aGUgZ2l2ZW4gYHNjb3BlYCB1c2luZyBgc291cmNlLmlzb2xhdGVTb3VyY2Uoc291cmNlLCBzY29wZSlgLFxuICogaWYgcG9zc2libGUuIExpa2V3aXNlLCB0aGUgc2lua3MgcmV0dXJuZWQgZnJvbSB0aGUgaXNvbGF0ZWQgY29tcG9uZW50IGFyZVxuICogaXNvbGF0ZWQgdG8gdGhlIGdpdmVuIGBzY29wZWAgdXNpbmcgYHNvdXJjZS5pc29sYXRlU2luayhzaW5rLCBzY29wZSlgLlxuICpcbiAqIFRoZSBgc2NvcGVgIGNhbiBiZSBhIHN0cmluZyBvciBhbiBvYmplY3QuIElmIGl0IGlzIGFueXRoaW5nIGVsc2UgdGhhbiB0aG9zZVxuICogdHdvIHR5cGVzLCBpdCB3aWxsIGJlIGNvbnZlcnRlZCB0byBhIHN0cmluZy4gSWYgYHNjb3BlYCBpcyBhbiBvYmplY3QsIGl0XG4gKiByZXByZXNlbnRzIFwic2NvcGVzIHBlciBjaGFubmVsXCIsIGFsbG93aW5nIHlvdSB0byBzcGVjaWZ5IGEgZGlmZmVyZW50IHNjb3BlXG4gKiBmb3IgZWFjaCBrZXkgb2Ygc291cmNlcy9zaW5rcy4gRm9yIGluc3RhbmNlXG4gKlxuICogYGBganNcbiAqIGNvbnN0IGNoaWxkU2lua3MgPSBpc29sYXRlKENoaWxkLCB7RE9NOiAnZm9vJywgSFRUUDogJ2Jhcid9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIFlvdSBjYW4gYWxzbyB1c2UgYSB3aWxkY2FyZCBgJyonYCB0byB1c2UgYXMgYSBkZWZhdWx0IGZvciBzb3VyY2Uvc2lua3NcbiAqIGNoYW5uZWxzIHRoYXQgZGlkIG5vdCByZWNlaXZlIGEgc3BlY2lmaWMgc2NvcGU6XG4gKlxuICogYGBganNcbiAqIC8vIFVzZXMgJ2JhcicgYXMgdGhlIGlzb2xhdGlvbiBzY29wZSBmb3IgSFRUUCBhbmQgb3RoZXIgY2hhbm5lbHNcbiAqIGNvbnN0IGNoaWxkU2lua3MgPSBpc29sYXRlKENoaWxkLCB7RE9NOiAnZm9vJywgJyonOiAnYmFyJ30pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogSWYgYSBjaGFubmVsJ3MgdmFsdWUgaXMgbnVsbCwgdGhlbiB0aGF0IGNoYW5uZWwncyBzb3VyY2VzIGFuZCBzaW5rcyB3b24ndCBiZVxuICogaXNvbGF0ZWQuIElmIHRoZSB3aWxkY2FyZCBpcyBudWxsIGFuZCBzb21lIGNoYW5uZWxzIGFyZSB1bnNwZWNpZmllZCwgdGhvc2VcbiAqIGNoYW5uZWxzIHdvbid0IGJlIGlzb2xhdGVkLiBJZiB5b3UgZG9uJ3QgaGF2ZSBhIHdpbGRjYXJkIGFuZCBzb21lIGNoYW5uZWxzXG4gKiBhcmUgdW5zcGVjaWZpZWQsIHRoZW4gYGlzb2xhdGVgIHdpbGwgZ2VuZXJhdGUgYSByYW5kb20gc2NvcGUuXG4gKlxuICogYGBganNcbiAqIC8vIERvZXMgbm90IGlzb2xhdGUgSFRUUCByZXF1ZXN0c1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nLCBIVFRQOiBudWxsfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBJZiB0aGUgYHNjb3BlYCBhcmd1bWVudCBpcyBub3QgcHJvdmlkZWQgYXQgYWxsLCBhIG5ldyBzY29wZSB3aWxsIGJlXG4gKiBhdXRvbWF0aWNhbGx5IGNyZWF0ZWQuIFRoaXMgbWVhbnMgdGhhdCB3aGlsZSAqKmBpc29sYXRlKGNvbXBvbmVudCwgc2NvcGUpYCBpc1xuICogcHVyZSoqIChyZWZlcmVudGlhbGx5IHRyYW5zcGFyZW50KSwgKipgaXNvbGF0ZShjb21wb25lbnQpYCBpcyBpbXB1cmUqKiAobm90XG4gKiByZWZlcmVudGlhbGx5IHRyYW5zcGFyZW50KS4gVHdvIGNhbGxzIHRvIGBpc29sYXRlKEZvbywgYmFyKWAgd2lsbCBnZW5lcmF0ZVxuICogdGhlIHNhbWUgY29tcG9uZW50LiBCdXQsIHR3byBjYWxscyB0byBgaXNvbGF0ZShGb28pYCB3aWxsIGdlbmVyYXRlIHR3b1xuICogZGlzdGluY3QgY29tcG9uZW50cy5cbiAqXG4gKiBgYGBqc1xuICogLy8gVXNlcyBzb21lIGFyYml0cmFyeSBzdHJpbmcgYXMgdGhlIGlzb2xhdGlvbiBzY29wZSBmb3IgSFRUUCBhbmQgb3RoZXIgY2hhbm5lbHNcbiAqIGNvbnN0IGNoaWxkU2lua3MgPSBpc29sYXRlKENoaWxkLCB7RE9NOiAnZm9vJ30pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogTm90ZSB0aGF0IGJvdGggYGlzb2xhdGVTb3VyY2UoKWAgYW5kIGBpc29sYXRlU2luaygpYCBhcmUgc3RhdGljIG1lbWJlcnMgb2ZcbiAqIGBzb3VyY2VgLiBUaGUgcmVhc29uIGZvciB0aGlzIGlzIHRoYXQgZHJpdmVycyBwcm9kdWNlIGBzb3VyY2VgIHdoaWxlIHRoZVxuICogYXBwbGljYXRpb24gcHJvZHVjZXMgYHNpbmtgLCBhbmQgaXQncyB0aGUgZHJpdmVyJ3MgcmVzcG9uc2liaWxpdHkgdG9cbiAqIGltcGxlbWVudCBgaXNvbGF0ZVNvdXJjZSgpYCBhbmQgYGlzb2xhdGVTaW5rKClgLlxuICpcbiAqIF9Ob3RlIGZvciBUeXBlc2NyaXB0IHVzZXJzOl8gYGlzb2xhdGVgIGlzIG5vdCBjdXJyZW50bHkgdHlwZS10cmFuc3BhcmVudCBhbmRcbiAqIHdpbGwgZXhwbGljaXRseSBjb252ZXJ0IGdlbmVyaWMgdHlwZSBhcmd1bWVudHMgdG8gYGFueWAuIFRvIHByZXNlcnZlIHR5cGVzIGluXG4gKiB5b3VyIGNvbXBvbmVudHMsIHlvdSBjYW4gdXNlIGEgdHlwZSBhc3NlcnRpb246XG4gKlxuICogYGBgdHNcbiAqIC8vIGlmIENoaWxkIGlzIHR5cGVkIGBDb21wb25lbnQ8U291cmNlcywgU2lua3M+YFxuICogY29uc3QgaXNvbGF0ZWRDaGlsZCA9IGlzb2xhdGUoIENoaWxkICkgYXMgQ29tcG9uZW50PFNvdXJjZXMsIFNpbmtzPjtcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBvbmVudCBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0XG4gKiBhbmQgb3V0cHV0cyBhIGNvbGxlY3Rpb24gb2YgYHNpbmtzYC5cbiAqIEBwYXJhbSB7U3RyaW5nfSBzY29wZSBhbiBvcHRpb25hbCBzdHJpbmcgdGhhdCBpcyB1c2VkIHRvIGlzb2xhdGUgZWFjaFxuICogYHNvdXJjZXNgIGFuZCBgc2lua3NgIHdoZW4gdGhlIHJldHVybmVkIHNjb3BlZCBjb21wb25lbnQgaXMgaW52b2tlZC5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aGUgc2NvcGVkIGNvbXBvbmVudCBmdW5jdGlvbiB0aGF0LCBhcyB0aGUgb3JpZ2luYWxcbiAqIGBjb21wb25lbnRgIGZ1bmN0aW9uLCB0YWtlcyBgc291cmNlc2AgYW5kIHJldHVybnMgYHNpbmtzYC5cbiAqIEBmdW5jdGlvbiBpc29sYXRlXG4gKi9cbmZ1bmN0aW9uIGlzb2xhdGUoY29tcG9uZW50LCBzY29wZSkge1xuICAgIGlmIChzY29wZSA9PT0gdm9pZCAwKSB7IHNjb3BlID0gbmV3U2NvcGUoKTsgfVxuICAgIGNoZWNrSXNvbGF0ZUFyZ3MoY29tcG9uZW50LCBzY29wZSk7XG4gICAgdmFyIHJhbmRvbVNjb3BlID0gdHlwZW9mIHNjb3BlID09PSAnb2JqZWN0JyA/IG5ld1Njb3BlKCkgOiAnJztcbiAgICB2YXIgc2NvcGVzID0gdHlwZW9mIHNjb3BlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygc2NvcGUgPT09ICdvYmplY3QnXG4gICAgICAgID8gc2NvcGVcbiAgICAgICAgOiBzY29wZS50b1N0cmluZygpO1xuICAgIHJldHVybiBmdW5jdGlvbiB3cmFwcGVkQ29tcG9uZW50KG91dGVyU291cmNlcykge1xuICAgICAgICB2YXIgcmVzdCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IDE7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgcmVzdFtfaSAtIDFdID0gYXJndW1lbnRzW19pXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2NvcGVzUGVyQ2hhbm5lbCA9IG5vcm1hbGl6ZVNjb3BlcyhvdXRlclNvdXJjZXMsIHNjb3BlcywgcmFuZG9tU2NvcGUpO1xuICAgICAgICB2YXIgaW5uZXJTb3VyY2VzID0gaXNvbGF0ZUFsbFNvdXJjZXMob3V0ZXJTb3VyY2VzLCBzY29wZXNQZXJDaGFubmVsKTtcbiAgICAgICAgdmFyIGlubmVyU2lua3MgPSBjb21wb25lbnQuYXBwbHkodm9pZCAwLCBbaW5uZXJTb3VyY2VzXS5jb25jYXQocmVzdCkpO1xuICAgICAgICB2YXIgb3V0ZXJTaW5rcyA9IGlzb2xhdGVBbGxTaW5rcyhvdXRlclNvdXJjZXMsIGlubmVyU2lua3MsIHNjb3Blc1BlckNoYW5uZWwpO1xuICAgICAgICByZXR1cm4gb3V0ZXJTaW5rcztcbiAgICB9O1xufVxuaXNvbGF0ZS5yZXNldCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIChjb3VudGVyID0gMCk7IH07XG5leHBvcnRzLmRlZmF1bHQgPSBpc29sYXRlO1xuZnVuY3Rpb24gdG9Jc29sYXRlZChzY29wZSkge1xuICAgIGlmIChzY29wZSA9PT0gdm9pZCAwKSB7IHNjb3BlID0gbmV3U2NvcGUoKTsgfVxuICAgIHJldHVybiBmdW5jdGlvbiAoY29tcG9uZW50KSB7IHJldHVybiBpc29sYXRlKGNvbXBvbmVudCwgc2NvcGUpOyB9O1xufVxuZXhwb3J0cy50b0lzb2xhdGVkID0gdG9Jc29sYXRlZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBpbnRlcm5hbHNfMSA9IHJlcXVpcmUoXCIuL2ludGVybmFsc1wiKTtcbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHByZXBhcmVzIHRoZSBDeWNsZSBhcHBsaWNhdGlvbiB0byBiZSBleGVjdXRlZC4gVGFrZXMgYSBgbWFpbmBcbiAqIGZ1bmN0aW9uIGFuZCBwcmVwYXJlcyB0byBjaXJjdWxhcmx5IGNvbm5lY3RzIGl0IHRvIHRoZSBnaXZlbiBjb2xsZWN0aW9uIG9mXG4gKiBkcml2ZXIgZnVuY3Rpb25zLiBBcyBhbiBvdXRwdXQsIGBzZXR1cCgpYCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRocmVlXG4gKiBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kIGBydW5gLiBPbmx5IHdoZW4gYHJ1bigpYCBpcyBjYWxsZWQgd2lsbFxuICogdGhlIGFwcGxpY2F0aW9uIGFjdHVhbGx5IGV4ZWN1dGUuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGBydW4oKWAgZm9yXG4gKiBtb3JlIGRldGFpbHMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtzZXR1cH0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgc2lua3MsIHJ1bn0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogY29uc3QgZGlzcG9zZSA9IHJ1bigpOyAvLyBFeGVjdXRlcyB0aGUgYXBwbGljYXRpb25cbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgc2lua3NgIGFuZFxuICogYHJ1bmAuIGBzb3VyY2VzYCBpcyB0aGUgY29sbGVjdGlvbiBvZiBkcml2ZXIgc291cmNlcywgYHNpbmtzYCBpcyB0aGVcbiAqIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNpbmtzLCB0aGVzZSBjYW4gYmUgdXNlZCBmb3IgZGVidWdnaW5nIG9yIHRlc3RpbmcuIGBydW5gXG4gKiBpcyB0aGUgZnVuY3Rpb24gdGhhdCBvbmNlIGNhbGxlZCB3aWxsIGV4ZWN1dGUgdGhlIGFwcGxpY2F0aW9uLlxuICogQGZ1bmN0aW9uIHNldHVwXG4gKi9cbmZ1bmN0aW9uIHNldHVwKG1haW4sIGRyaXZlcnMpIHtcbiAgICBpZiAodHlwZW9mIG1haW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIHRoZSAnbWFpbicgXCIgKyBcImZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMuXCIpO1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWxzXzEuaXNPYmplY3RFbXB0eShkcml2ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGF0IGxlYXN0IG9uZSBkcml2ZXIgZnVuY3Rpb24gZGVjbGFyZWQgYXMgYSBwcm9wZXJ0eS5cIik7XG4gICAgfVxuICAgIHZhciBlbmdpbmUgPSBzZXR1cFJldXNhYmxlKGRyaXZlcnMpO1xuICAgIHZhciBzaW5rcyA9IG1haW4oZW5naW5lLnNvdXJjZXMpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcyA9IHdpbmRvdy5DeWNsZWpzIHx8IHt9O1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcy5zaW5rcyA9IHNpbmtzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcnVuKCkge1xuICAgICAgICB2YXIgZGlzcG9zZVJ1biA9IGVuZ2luZS5ydW4oc2lua3MpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgICAgIGRpc3Bvc2VSdW4oKTtcbiAgICAgICAgICAgIGVuZ2luZS5kaXNwb3NlKCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNpbmtzOiBzaW5rcywgc291cmNlczogZW5naW5lLnNvdXJjZXMsIHJ1bjogX3J1biB9O1xufVxuZXhwb3J0cy5zZXR1cCA9IHNldHVwO1xuLyoqXG4gKiBBIHBhcnRpYWxseS1hcHBsaWVkIHZhcmlhbnQgb2Ygc2V0dXAoKSB3aGljaCBhY2NlcHRzIG9ubHkgdGhlIGRyaXZlcnMsIGFuZFxuICogYWxsb3dzIG1hbnkgYG1haW5gIGZ1bmN0aW9ucyB0byBleGVjdXRlIGFuZCByZXVzZSB0aGlzIHNhbWUgc2V0IG9mIGRyaXZlcnMuXG4gKlxuICogVGFrZXMgYW4gb2JqZWN0IHdpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBpbnB1dCwgYW5kIG91dHB1dHMgYW4gb2JqZWN0IHdoaWNoXG4gKiBjb250YWlucyB0aGUgZ2VuZXJhdGVkIHNvdXJjZXMgKGZyb20gdGhvc2UgZHJpdmVycykgYW5kIGEgYHJ1bmAgZnVuY3Rpb25cbiAqICh3aGljaCBpbiB0dXJuIGV4cGVjdHMgc2lua3MgYXMgYXJndW1lbnQpLiBUaGlzIGBydW5gIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWRcbiAqIG11bHRpcGxlIHRpbWVzIHdpdGggZGlmZmVyZW50IGFyZ3VtZW50cywgYW5kIGl0IHdpbGwgcmV1c2UgdGhlIGRyaXZlcnMgdGhhdFxuICogd2VyZSBwYXNzZWQgdG8gYHNldHVwUmV1c2FibGVgLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYGBganNcbiAqIGltcG9ydCB7c2V0dXBSZXVzYWJsZX0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgcnVuLCBkaXNwb3NlfSA9IHNldHVwUmV1c2FibGUoZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGNvbnN0IHNpbmtzID0gbWFpbihzb3VyY2VzKTtcbiAqIGNvbnN0IGRpc3Bvc2VSdW4gPSBydW4oc2lua3MpO1xuICogLy8gLi4uXG4gKiBkaXNwb3NlUnVuKCk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTsgLy8gZW5kcyB0aGUgcmV1c2FiaWxpdHkgb2YgZHJpdmVyc1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgcnVuYCBhbmRcbiAqIGBkaXNwb3NlYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgcnVuYCBpcyB0aGVcbiAqIGZ1bmN0aW9uIHRoYXQgb25jZSBjYWxsZWQgd2l0aCAnc2lua3MnIGFzIGFyZ3VtZW50LCB3aWxsIGV4ZWN1dGUgdGhlXG4gKiBhcHBsaWNhdGlvbiwgdHlpbmcgdG9nZXRoZXIgc291cmNlcyB3aXRoIHNpbmtzLiBgZGlzcG9zZWAgdGVybWluYXRlcyB0aGVcbiAqIHJldXNhYmxlIHJlc291cmNlcyB1c2VkIGJ5IHRoZSBkcml2ZXJzLiBOb3RlIGFsc28gdGhhdCBgcnVuYCByZXR1cm5zIGFcbiAqIGRpc3Bvc2UgZnVuY3Rpb24gd2hpY2ggdGVybWluYXRlcyByZXNvdXJjZXMgdGhhdCBhcmUgc3BlY2lmaWMgKG5vdCByZXVzYWJsZSlcbiAqIHRvIHRoYXQgcnVuLlxuICogQGZ1bmN0aW9uIHNldHVwUmV1c2FibGVcbiAqL1xuZnVuY3Rpb24gc2V0dXBSZXVzYWJsZShkcml2ZXJzKSB7XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBwcm9wZXJ0aWVzLlwiKTtcbiAgICB9XG4gICAgaWYgKGludGVybmFsc18xLmlzT2JqZWN0RW1wdHkoZHJpdmVycykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIHNpbmtQcm94aWVzID0gaW50ZXJuYWxzXzEubWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpO1xuICAgIHZhciByYXdTb3VyY2VzID0gaW50ZXJuYWxzXzEuY2FsbERyaXZlcnMoZHJpdmVycywgc2lua1Byb3hpZXMpO1xuICAgIHZhciBzb3VyY2VzID0gaW50ZXJuYWxzXzEuYWRhcHRTb3VyY2VzKHJhd1NvdXJjZXMpO1xuICAgIGZ1bmN0aW9uIF9ydW4oc2lua3MpIHtcbiAgICAgICAgcmV0dXJuIGludGVybmFsc18xLnJlcGxpY2F0ZU1hbnkoc2lua3MsIHNpbmtQcm94aWVzKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcG9zZUVuZ2luZSgpIHtcbiAgICAgICAgaW50ZXJuYWxzXzEuZGlzcG9zZVNvdXJjZXMoc291cmNlcyk7XG4gICAgICAgIGludGVybmFsc18xLmRpc3Bvc2VTaW5rUHJveGllcyhzaW5rUHJveGllcyk7XG4gICAgfVxuICAgIHJldHVybiB7IHNvdXJjZXM6IHNvdXJjZXMsIHJ1bjogX3J1biwgZGlzcG9zZTogZGlzcG9zZUVuZ2luZSB9O1xufVxuZXhwb3J0cy5zZXR1cFJldXNhYmxlID0gc2V0dXBSZXVzYWJsZTtcbi8qKlxuICogVGFrZXMgYSBgbWFpbmAgZnVuY3Rpb24gYW5kIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb25cbiAqIG9mIGRyaXZlciBmdW5jdGlvbnMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHJ1biBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IGRpc3Bvc2UgPSBydW4obWFpbiwgZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTtcbiAqIGBgYFxuICpcbiAqIFRoZSBgbWFpbmAgZnVuY3Rpb24gZXhwZWN0cyBhIGNvbGxlY3Rpb24gb2YgXCJzb3VyY2VcIiBzdHJlYW1zIChyZXR1cm5lZCBmcm9tXG4gKiBkcml2ZXJzKSBhcyBpbnB1dCwgYW5kIHNob3VsZCByZXR1cm4gYSBjb2xsZWN0aW9uIG9mIFwic2lua1wiIHN0cmVhbXMgKHRvIGJlXG4gKiBnaXZlbiB0byBkcml2ZXJzKS4gQSBcImNvbGxlY3Rpb24gb2Ygc3RyZWFtc1wiIGlzIGEgSmF2YVNjcmlwdCBvYmplY3Qgd2hlcmVcbiAqIGtleXMgbWF0Y2ggdGhlIGRyaXZlciBuYW1lcyByZWdpc3RlcmVkIGJ5IHRoZSBgZHJpdmVyc2Agb2JqZWN0LCBhbmQgdmFsdWVzXG4gKiBhcmUgdGhlIHN0cmVhbXMuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGVhY2ggZHJpdmVyIHRvIHNlZSBtb3JlXG4gKiBkZXRhaWxzIG9uIHdoYXQgdHlwZXMgb2Ygc291cmNlcyBpdCBvdXRwdXRzIGFuZCBzaW5rcyBpdCByZWNlaXZlcy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgZGlzcG9zZSBmdW5jdGlvbiwgdXNlZCB0byB0ZXJtaW5hdGUgdGhlIGV4ZWN1dGlvbiBvZiB0aGVcbiAqIEN5Y2xlLmpzIHByb2dyYW0sIGNsZWFuaW5nIHVwIHJlc291cmNlcyB1c2VkLlxuICogQGZ1bmN0aW9uIHJ1blxuICovXG5mdW5jdGlvbiBydW4obWFpbiwgZHJpdmVycykge1xuICAgIHZhciBwcm9ncmFtID0gc2V0dXAobWFpbiwgZHJpdmVycyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgIHdpbmRvdy5DeWNsZWpzRGV2VG9vbF9zdGFydEdyYXBoU2VyaWFsaXplcikge1xuICAgICAgICB3aW5kb3cuQ3ljbGVqc0RldlRvb2xfc3RhcnRHcmFwaFNlcmlhbGl6ZXIocHJvZ3JhbS5zaW5rcyk7XG4gICAgfVxuICAgIHJldHVybiBwcm9ncmFtLnJ1bigpO1xufVxuZXhwb3J0cy5ydW4gPSBydW47XG5leHBvcnRzLmRlZmF1bHQgPSBydW47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBxdWlja3Rhc2tfMSA9IHJlcXVpcmUoXCJxdWlja3Rhc2tcIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCIuL2FkYXB0XCIpO1xudmFyIHNjaGVkdWxlTWljcm90YXNrID0gcXVpY2t0YXNrXzEuZGVmYXVsdCgpO1xuZnVuY3Rpb24gbWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpIHtcbiAgICB2YXIgc2lua1Byb3hpZXMgPSB7fTtcbiAgICBmb3IgKHZhciBuYW1lXzEgaW4gZHJpdmVycykge1xuICAgICAgICBpZiAoZHJpdmVycy5oYXNPd25Qcm9wZXJ0eShuYW1lXzEpKSB7XG4gICAgICAgICAgICBzaW5rUHJveGllc1tuYW1lXzFdID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNpbmtQcm94aWVzO1xufVxuZXhwb3J0cy5tYWtlU2lua1Byb3hpZXMgPSBtYWtlU2lua1Byb3hpZXM7XG5mdW5jdGlvbiBjYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgbmFtZV8yIGluIGRyaXZlcnMpIHtcbiAgICAgICAgaWYgKGRyaXZlcnMuaGFzT3duUHJvcGVydHkobmFtZV8yKSkge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdID0gZHJpdmVyc1tuYW1lXzJdKHNpbmtQcm94aWVzW25hbWVfMl0sIG5hbWVfMik7XG4gICAgICAgICAgICBpZiAoc291cmNlc1tuYW1lXzJdICYmIHR5cGVvZiBzb3VyY2VzW25hbWVfMl0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdLl9pc0N5Y2xlU291cmNlID0gbmFtZV8yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5jYWxsRHJpdmVycyA9IGNhbGxEcml2ZXJzO1xuLy8gTk9URTogdGhpcyB3aWxsIG11dGF0ZSBgc291cmNlc2AuXG5mdW5jdGlvbiBhZGFwdFNvdXJjZXMoc291cmNlcykge1xuICAgIGZvciAodmFyIG5hbWVfMyBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KG5hbWVfMykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSAmJlxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZXNbbmFtZV8zXS5zaGFtZWZ1bGx5U2VuZE5leHQgPT09XG4gICAgICAgICAgICAgICAgJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzNdID0gYWRhcHRfMS5hZGFwdChzb3VyY2VzW25hbWVfM10pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5hZGFwdFNvdXJjZXMgPSBhZGFwdFNvdXJjZXM7XG5mdW5jdGlvbiByZXBsaWNhdGVNYW55KHNpbmtzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhzaW5rcykuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiAhIXNpbmtQcm94aWVzW25hbWVdOyB9KTtcbiAgICB2YXIgYnVmZmVycyA9IHt9O1xuICAgIHZhciByZXBsaWNhdG9ycyA9IHt9O1xuICAgIHNpbmtOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0gPSB7IF9uOiBbXSwgX2U6IFtdIH07XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdID0ge1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKHgpIHsgcmV0dXJuIGJ1ZmZlcnNbbmFtZV0uX24ucHVzaCh4KTsgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7IHJldHVybiBidWZmZXJzW25hbWVdLl9lLnB1c2goZXJyKTsgfSxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSBzaW5rTmFtZXMubWFwKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tuYW1lXSkuc3Vic2NyaWJlKHJlcGxpY2F0b3JzW25hbWVdKTtcbiAgICB9KTtcbiAgICBzaW5rTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgbGlzdGVuZXIgPSBzaW5rUHJveGllc1tuYW1lXTtcbiAgICAgICAgdmFyIG5leHQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgc2NoZWR1bGVNaWNyb3Rhc2soZnVuY3Rpb24gKCkgeyByZXR1cm4gbGlzdGVuZXIuX24oeCk7IH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBzY2hlZHVsZU1pY3JvdGFzayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgKGNvbnNvbGUuZXJyb3IgfHwgY29uc29sZS5sb2cpKGVycik7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuX2UoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBidWZmZXJzW25hbWVdLl9uLmZvckVhY2gobmV4dCk7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0uX2UuZm9yRWFjaChlcnJvcik7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLm5leHQgPSBuZXh0O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5lcnJvciA9IGVycm9yO1xuICAgICAgICAvLyBiZWNhdXNlIHNpbmsuc3Vic2NyaWJlKHJlcGxpY2F0b3IpIGhhZCBtdXRhdGVkIHJlcGxpY2F0b3IgdG8gYWRkXG4gICAgICAgIC8vIF9uLCBfZSwgX2MsIHdlIG11c3QgYWxzbyB1cGRhdGUgdGhlc2U6XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLl9uID0gbmV4dDtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uX2UgPSBlcnJvcjtcbiAgICB9KTtcbiAgICBidWZmZXJzID0gbnVsbDsgLy8gZnJlZSB1cCBmb3IgR0NcbiAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZVJlcGxpY2F0aW9uKCkge1xuICAgICAgICBzdWJzY3JpcHRpb25zLmZvckVhY2goZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudW5zdWJzY3JpYmUoKTsgfSk7XG4gICAgfTtcbn1cbmV4cG9ydHMucmVwbGljYXRlTWFueSA9IHJlcGxpY2F0ZU1hbnk7XG5mdW5jdGlvbiBkaXNwb3NlU2lua1Byb3hpZXMoc2lua1Byb3hpZXMpIHtcbiAgICBPYmplY3Qua2V5cyhzaW5rUHJveGllcykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gc2lua1Byb3hpZXNbbmFtZV0uX2MoKTsgfSk7XG59XG5leHBvcnRzLmRpc3Bvc2VTaW5rUHJveGllcyA9IGRpc3Bvc2VTaW5rUHJveGllcztcbmZ1bmN0aW9uIGRpc3Bvc2VTb3VyY2VzKHNvdXJjZXMpIHtcbiAgICBmb3IgKHZhciBrIGluIHNvdXJjZXMpIHtcbiAgICAgICAgaWYgKHNvdXJjZXMuaGFzT3duUHJvcGVydHkoaykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNba10gJiZcbiAgICAgICAgICAgIHNvdXJjZXNba10uZGlzcG9zZSkge1xuICAgICAgICAgICAgc291cmNlc1trXS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmRpc3Bvc2VTb3VyY2VzID0gZGlzcG9zZVNvdXJjZXM7XG5mdW5jdGlvbiBpc09iamVjdEVtcHR5KG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmV4cG9ydHMuaXNPYmplY3RFbXB0eSA9IGlzT2JqZWN0RW1wdHk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbnRlcm5hbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgaXNvbGF0ZV8xID0gcmVxdWlyZShcIkBjeWNsZS9pc29sYXRlXCIpO1xudmFyIHBpY2tNZXJnZV8xID0gcmVxdWlyZShcIi4vcGlja01lcmdlXCIpO1xudmFyIHBpY2tDb21iaW5lXzEgPSByZXF1aXJlKFwiLi9waWNrQ29tYmluZVwiKTtcbi8qKlxuICogQW4gb2JqZWN0IHJlcHJlc2VudGluZyBhbGwgaW5zdGFuY2VzIGluIGEgY29sbGVjdGlvbiBvZiBjb21wb25lbnRzLiBIYXMgdGhlXG4gKiBtZXRob2RzIHBpY2tDb21iaW5lIGFuZCBwaWNrTWVyZ2UgdG8gZ2V0IHRoZSBjb21iaW5lZCBzaW5rcyBvZiBhbGwgaW5zdGFuY2VzLlxuICovXG52YXIgSW5zdGFuY2VzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEluc3RhbmNlcyhpbnN0YW5jZXMkKSB7XG4gICAgICAgIHRoaXMuX2luc3RhbmNlcyQgPSBpbnN0YW5jZXMkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBMaWtlIGBtZXJnZWAgaW4geHN0cmVhbSwgdGhpcyBvcGVyYXRvciBibGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgYnV0XG4gICAgICogcGlja3MgdGhvc2Ugc3RyZWFtcyBmcm9tIGEgY29sbGVjdGlvbiBvZiBjb21wb25lbnQgaW5zdGFuY2VzLlxuICAgICAqXG4gICAgICogVXNlIHRoZSBgc2VsZWN0b3JgIHN0cmluZyB0byBwaWNrIGEgc3RyZWFtIGZyb20gdGhlIHNpbmtzIG9iamVjdCBvZiBlYWNoXG4gICAgICogY29tcG9uZW50IGluc3RhbmNlLCB0aGVuIHBpY2tNZXJnZSB3aWxsIG1lcmdlIGFsbCB0aG9zZSBwaWNrZWQgc3RyZWFtcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIG5hbWUgb2YgYSBjaGFubmVsIGluIGEgc2lua3Mgb2JqZWN0IGJlbG9uZ2luZyB0b1xuICAgICAqIGVhY2ggY29tcG9uZW50IGluIHRoZSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IGFuIG9wZXJhdG9yIHRvIGJlIHVzZWQgd2l0aCB4c3RyZWFtJ3MgYGNvbXBvc2VgIG1ldGhvZC5cbiAgICAgKi9cbiAgICBJbnN0YW5jZXMucHJvdG90eXBlLnBpY2tNZXJnZSA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdCh0aGlzLl9pbnN0YW5jZXMkLmNvbXBvc2UocGlja01lcmdlXzEucGlja01lcmdlKHNlbGVjdG9yKSkpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogTGlrZSBgY29tYmluZWAgaW4geHN0cmVhbSwgdGhpcyBvcGVyYXRvciBjb21iaW5lcyBtdWx0aXBsZSBzdHJlYW1zIHRvZ2V0aGVyLFxuICAgICAqIGJ1dCBwaWNrcyB0aG9zZSBzdHJlYW1zIGZyb20gYSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudCBpbnN0YW5jZXMuXG4gICAgICpcbiAgICAgKiBVc2UgdGhlIGBzZWxlY3RvcmAgc3RyaW5nIHRvIHBpY2sgYSBzdHJlYW0gZnJvbSB0aGUgc2lua3Mgb2JqZWN0IG9mIGVhY2hcbiAgICAgKiBjb21wb25lbnQgaW5zdGFuY2UsIHRoZW4gcGlja0NvbWJpbmUgd2lsbCBjb21iaW5lIGFsbCB0aG9zZSBwaWNrZWQgc3RyZWFtcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzZWxlY3RvciBhIG5hbWUgb2YgYSBjaGFubmVsIGluIGEgc2lua3Mgb2JqZWN0IGJlbG9uZ2luZyB0b1xuICAgICAqIGVhY2ggY29tcG9uZW50IGluIHRoZSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuXG4gICAgICogQHJldHVybiB7RnVuY3Rpb259IGFuIG9wZXJhdG9yIHRvIGJlIHVzZWQgd2l0aCB4c3RyZWFtJ3MgYGNvbXBvc2VgIG1ldGhvZC5cbiAgICAgKi9cbiAgICBJbnN0YW5jZXMucHJvdG90eXBlLnBpY2tDb21iaW5lID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KHRoaXMuX2luc3RhbmNlcyQuY29tcG9zZShwaWNrQ29tYmluZV8xLnBpY2tDb21iaW5lKHNlbGVjdG9yKSkpO1xuICAgIH07XG4gICAgcmV0dXJuIEluc3RhbmNlcztcbn0oKSk7XG5leHBvcnRzLkluc3RhbmNlcyA9IEluc3RhbmNlcztcbmZ1bmN0aW9uIGRlZmF1bHRJdGVtU2NvcGUoa2V5KSB7XG4gICAgcmV0dXJuIHsgJyonOiBudWxsIH07XG59XG5mdW5jdGlvbiBpbnN0YW5jZUxlbnMoaXRlbUtleSwga2V5KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBhcnIubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChcIlwiICsgaXRlbUtleShhcnJbaV0sIGkpID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcnJbaV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoYXJyLCBpdGVtKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFyciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gW2l0ZW1dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyci5maWx0ZXIoZnVuY3Rpb24gKHMsIGkpIHsgcmV0dXJuIFwiXCIgKyBpdGVtS2V5KHMsIGkpICE9PSBrZXk7IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyci5tYXAoZnVuY3Rpb24gKHMsIGkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiXCIgKyBpdGVtS2V5KHMsIGkpID09PSBrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xufVxudmFyIGlkZW50aXR5TGVucyA9IHtcbiAgICBnZXQ6IGZ1bmN0aW9uIChvdXRlcikgeyByZXR1cm4gb3V0ZXI7IH0sXG4gICAgc2V0OiBmdW5jdGlvbiAob3V0ZXIsIGlubmVyKSB7IHJldHVybiBpbm5lcjsgfSxcbn07XG5mdW5jdGlvbiBtYWtlQ29sbGVjdGlvbihvcHRzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNvbGxlY3Rpb25Db21wb25lbnQoc291cmNlcykge1xuICAgICAgICB2YXIgbmFtZSA9IG9wdHMuY2hhbm5lbCB8fCAnc3RhdGUnO1xuICAgICAgICB2YXIgaXRlbUtleSA9IG9wdHMuaXRlbUtleTtcbiAgICAgICAgdmFyIGl0ZW1TY29wZSA9IG9wdHMuaXRlbVNjb3BlIHx8IGRlZmF1bHRJdGVtU2NvcGU7XG4gICAgICAgIHZhciBpdGVtQ29tcCA9IG9wdHMuaXRlbTtcbiAgICAgICAgdmFyIHN0YXRlJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXNbbmFtZV0uc3RyZWFtKTtcbiAgICAgICAgdmFyIGluc3RhbmNlcyQgPSBzdGF0ZSQuZm9sZChmdW5jdGlvbiAoYWNjLCBuZXh0U3RhdGUpIHtcbiAgICAgICAgICAgIHZhciBfYSwgX2IsIF9jLCBfZDtcbiAgICAgICAgICAgIHZhciBkaWN0ID0gYWNjLmRpY3Q7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShuZXh0U3RhdGUpKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5leHRJbnN0QXJyYXkgPSBBcnJheShuZXh0U3RhdGUubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEtleXNfMSA9IG5ldyBTZXQoKTtcbiAgICAgICAgICAgICAgICAvLyBhZGRcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IG5leHRTdGF0ZS5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IFwiXCIgKyAoaXRlbUtleSA/IGl0ZW1LZXkobmV4dFN0YXRlW2ldLCBpKSA6IGkpO1xuICAgICAgICAgICAgICAgICAgICBuZXh0S2V5c18xLmFkZChrZXkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWRpY3QuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdGF0ZVNjb3BlID0gaXRlbUtleSA/IGluc3RhbmNlTGVucyhpdGVtS2V5LCBrZXkpIDogXCJcIiArIGk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgb3RoZXJTY29wZXMgPSBpdGVtU2NvcGUoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzY29wZXMgPSB0eXBlb2Ygb3RoZXJTY29wZXMgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyAoX2EgPSB7ICcqJzogb3RoZXJTY29wZXMgfSwgX2FbbmFtZV0gPSBzdGF0ZVNjb3BlLCBfYSkgOiBfX2Fzc2lnbih7fSwgb3RoZXJTY29wZXMsIChfYiA9IHt9LCBfYltuYW1lXSA9IHN0YXRlU2NvcGUsIF9iKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2lua3MgPSBpc29sYXRlXzEuZGVmYXVsdChpdGVtQ29tcCwgc2NvcGVzKShzb3VyY2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3Quc2V0KGtleSwgc2lua3MpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXSA9IHNpbmtzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXSA9IGRpY3QuZ2V0KGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgbmV4dEluc3RBcnJheVtpXS5fa2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyByZW1vdmVcbiAgICAgICAgICAgICAgICBkaWN0LmZvckVhY2goZnVuY3Rpb24gKF8sIGtleSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIW5leHRLZXlzXzEuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpY3QuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBuZXh0S2V5c18xLmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGljdDogZGljdCwgYXJyOiBuZXh0SW5zdEFycmF5IH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBkaWN0LmNsZWFyKCk7XG4gICAgICAgICAgICAgICAgdmFyIGtleSA9IFwiXCIgKyAoaXRlbUtleSA/IGl0ZW1LZXkobmV4dFN0YXRlLCAwKSA6ICd0aGlzJyk7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlU2NvcGUgPSBpZGVudGl0eUxlbnM7XG4gICAgICAgICAgICAgICAgdmFyIG90aGVyU2NvcGVzID0gaXRlbVNjb3BlKGtleSk7XG4gICAgICAgICAgICAgICAgdmFyIHNjb3BlcyA9IHR5cGVvZiBvdGhlclNjb3BlcyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgPyAoX2MgPSB7ICcqJzogb3RoZXJTY29wZXMgfSwgX2NbbmFtZV0gPSBzdGF0ZVNjb3BlLCBfYykgOiBfX2Fzc2lnbih7fSwgb3RoZXJTY29wZXMsIChfZCA9IHt9LCBfZFtuYW1lXSA9IHN0YXRlU2NvcGUsIF9kKSk7XG4gICAgICAgICAgICAgICAgdmFyIHNpbmtzID0gaXNvbGF0ZV8xLmRlZmF1bHQoaXRlbUNvbXAsIHNjb3Blcykoc291cmNlcyk7XG4gICAgICAgICAgICAgICAgZGljdC5zZXQoa2V5LCBzaW5rcyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZGljdDogZGljdCwgYXJyOiBbc2lua3NdIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHsgZGljdDogbmV3IE1hcCgpLCBhcnI6IFtdIH0pO1xuICAgICAgICByZXR1cm4gb3B0cy5jb2xsZWN0U2lua3MobmV3IEluc3RhbmNlcyhpbnN0YW5jZXMkKSk7XG4gICAgfTtcbn1cbmV4cG9ydHMubWFrZUNvbGxlY3Rpb24gPSBtYWtlQ29sbGVjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUNvbGxlY3Rpb24uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGRyb3BSZXBlYXRzXzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0c1wiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xuZnVuY3Rpb24gdXBkYXRlQXJyYXlFbnRyeShhcnJheSwgc2NvcGUsIG5ld1ZhbCkge1xuICAgIGlmIChuZXdWYWwgPT09IGFycmF5W3Njb3BlXSkge1xuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuICAgIHZhciBpbmRleCA9IHBhcnNlSW50KHNjb3BlKTtcbiAgICBpZiAodHlwZW9mIG5ld1ZhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIGFycmF5LmZpbHRlcihmdW5jdGlvbiAoX3ZhbCwgaSkgeyByZXR1cm4gaSAhPT0gaW5kZXg7IH0pO1xuICAgIH1cbiAgICByZXR1cm4gYXJyYXkubWFwKGZ1bmN0aW9uICh2YWwsIGkpIHsgcmV0dXJuIChpID09PSBpbmRleCA/IG5ld1ZhbCA6IHZhbCk7IH0pO1xufVxuZnVuY3Rpb24gbWFrZUdldHRlcihzY29wZSkge1xuICAgIGlmICh0eXBlb2Ygc2NvcGUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzY29wZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGxlbnNHZXQoc3RhdGUpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc3RhdGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZVtzY29wZV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2NvcGUuZ2V0O1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1ha2VTZXR0ZXIoc2NvcGUpIHtcbiAgICBpZiAodHlwZW9mIHNjb3BlID09PSAnc3RyaW5nJyB8fCB0eXBlb2Ygc2NvcGUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBsZW5zU2V0KHN0YXRlLCBjaGlsZFN0YXRlKSB7XG4gICAgICAgICAgICB2YXIgX2EsIF9iO1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoc3RhdGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVwZGF0ZUFycmF5RW50cnkoc3RhdGUsIHNjb3BlLCBjaGlsZFN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX2EgPSB7fSwgX2Fbc2NvcGVdID0gY2hpbGRTdGF0ZSwgX2E7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gX19hc3NpZ24oe30sIHN0YXRlLCAoX2IgPSB7fSwgX2Jbc2NvcGVdID0gY2hpbGRTdGF0ZSwgX2IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBzY29wZS5zZXQ7XG4gICAgfVxufVxuZnVuY3Rpb24gaXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKSB7XG4gICAgcmV0dXJuIHNvdXJjZS5zZWxlY3Qoc2NvcGUpO1xufVxuZXhwb3J0cy5pc29sYXRlU291cmNlID0gaXNvbGF0ZVNvdXJjZTtcbmZ1bmN0aW9uIGlzb2xhdGVTaW5rKGlubmVyUmVkdWNlciQsIHNjb3BlKSB7XG4gICAgdmFyIGdldCA9IG1ha2VHZXR0ZXIoc2NvcGUpO1xuICAgIHZhciBzZXQgPSBtYWtlU2V0dGVyKHNjb3BlKTtcbiAgICByZXR1cm4gaW5uZXJSZWR1Y2VyJC5tYXAoZnVuY3Rpb24gKGlubmVyUmVkdWNlcikge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gb3V0ZXJSZWR1Y2VyKG91dGVyKSB7XG4gICAgICAgICAgICB2YXIgcHJldklubmVyID0gZ2V0KG91dGVyKTtcbiAgICAgICAgICAgIHZhciBuZXh0SW5uZXIgPSBpbm5lclJlZHVjZXIocHJldklubmVyKTtcbiAgICAgICAgICAgIGlmIChwcmV2SW5uZXIgPT09IG5leHRJbm5lcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBvdXRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBzZXQob3V0ZXIsIG5leHRJbm5lcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG59XG5leHBvcnRzLmlzb2xhdGVTaW5rID0gaXNvbGF0ZVNpbms7XG4vKipcbiAqIFJlcHJlc2VudHMgYSBwaWVjZSBvZiBhcHBsaWNhdGlvbiBzdGF0ZSBkeW5hbWljYWxseSBjaGFuZ2luZyBvdmVyIHRpbWUuXG4gKi9cbnZhciBTdGF0ZVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTdGF0ZVNvdXJjZShzdHJlYW0sIG5hbWUpIHtcbiAgICAgICAgdGhpcy5pc29sYXRlU291cmNlID0gaXNvbGF0ZVNvdXJjZTtcbiAgICAgICAgdGhpcy5pc29sYXRlU2luayA9IGlzb2xhdGVTaW5rO1xuICAgICAgICB0aGlzLl9zdHJlYW0gPSBzdHJlYW1cbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHR5cGVvZiBzICE9PSAndW5kZWZpbmVkJzsgfSlcbiAgICAgICAgICAgIC5jb21wb3NlKGRyb3BSZXBlYXRzXzEuZGVmYXVsdCgpKVxuICAgICAgICAgICAgLnJlbWVtYmVyKCk7XG4gICAgICAgIHRoaXMuX25hbWUgPSBuYW1lO1xuICAgICAgICB0aGlzLnN0cmVhbSA9IGFkYXB0XzEuYWRhcHQodGhpcy5fc3RyZWFtKTtcbiAgICAgICAgdGhpcy5fc3RyZWFtLl9pc0N5Y2xlU291cmNlID0gbmFtZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VsZWN0cyBhIHBhcnQgKG9yIHNjb3BlKSBvZiB0aGUgc3RhdGUgb2JqZWN0IGFuZCByZXR1cm5zIGEgbmV3IFN0YXRlU291cmNlXG4gICAgICogZHluYW1pY2FsbHkgcmVwcmVzZW50aW5nIHRoYXQgc2VsZWN0ZWQgcGFydCBvZiB0aGUgc3RhdGUuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8bGVuc30gc2NvcGUgYXMgYSBzdHJpbmcsIHRoaXMgYXJndW1lbnQgcmVwcmVzZW50cyB0aGVcbiAgICAgKiBwcm9wZXJ0eSB5b3Ugd2FudCB0byBzZWxlY3QgZnJvbSB0aGUgc3RhdGUgb2JqZWN0LiBBcyBhIG51bWJlciwgdGhpc1xuICAgICAqIHJlcHJlc2VudHMgdGhlIGFycmF5IGluZGV4IHlvdSB3YW50IHRvIHNlbGVjdCBmcm9tIHRoZSBzdGF0ZSBhcnJheS4gQXMgYVxuICAgICAqIGxlbnMgb2JqZWN0IChhbiBvYmplY3Qgd2l0aCBnZXQoKSBhbmQgc2V0KCkpLCB0aGlzIGFyZ3VtZW50IHJlcHJlc2VudHMgYW55XG4gICAgICogY3VzdG9tIHdheSBvZiBzZWxlY3Rpbmcgc29tZXRoaW5nIGZyb20gdGhlIHN0YXRlIG9iamVjdC5cbiAgICAgKi9cbiAgICBTdGF0ZVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNjb3BlKSB7XG4gICAgICAgIHZhciBnZXQgPSBtYWtlR2V0dGVyKHNjb3BlKTtcbiAgICAgICAgcmV0dXJuIG5ldyBTdGF0ZVNvdXJjZSh0aGlzLl9zdHJlYW0ubWFwKGdldCksIHRoaXMuX25hbWUpO1xuICAgIH07XG4gICAgcmV0dXJuIFN0YXRlU291cmNlO1xufSgpKTtcbmV4cG9ydHMuU3RhdGVTb3VyY2UgPSBTdGF0ZVNvdXJjZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVN0YXRlU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFN0YXRlU291cmNlXzEgPSByZXF1aXJlKFwiLi9TdGF0ZVNvdXJjZVwiKTtcbmV4cG9ydHMuU3RhdGVTb3VyY2UgPSBTdGF0ZVNvdXJjZV8xLlN0YXRlU291cmNlO1xuZXhwb3J0cy5pc29sYXRlU291cmNlID0gU3RhdGVTb3VyY2VfMS5pc29sYXRlU291cmNlO1xuZXhwb3J0cy5pc29sYXRlU2luayA9IFN0YXRlU291cmNlXzEuaXNvbGF0ZVNpbms7XG52YXIgQ29sbGVjdGlvbl8xID0gcmVxdWlyZShcIi4vQ29sbGVjdGlvblwiKTtcbmV4cG9ydHMuSW5zdGFuY2VzID0gQ29sbGVjdGlvbl8xLkluc3RhbmNlcztcbi8qKlxuICogR2l2ZW4gYSBDeWNsZS5qcyBjb21wb25lbnQgdGhhdCBleHBlY3RzIGEgc3RhdGUgKnNvdXJjZSogYW5kIHdpbGxcbiAqIG91dHB1dCBhIHJlZHVjZXIgKnNpbmsqLCB0aGlzIGZ1bmN0aW9uIHNldHMgdXAgdGhlIHN0YXRlIG1hbmFnZW1lbnRcbiAqIG1lY2hhbmljcyB0byBhY2N1bXVsYXRlIHN0YXRlIG92ZXIgdGltZSBhbmQgcHJvdmlkZSB0aGUgc3RhdGUgc291cmNlLiBJdFxuICogcmV0dXJucyBhIEN5Y2xlLmpzIGNvbXBvbmVudCB3aGljaCB3cmFwcyB0aGUgY29tcG9uZW50IGdpdmVuIGFzIGlucHV0LlxuICogRXNzZW50aWFsbHksIGl0IGhvb2tzIHVwIHRoZSByZWR1Y2VycyBzaW5rIHdpdGggdGhlIHN0YXRlIHNvdXJjZSBhcyBhIGN5Y2xlLlxuICpcbiAqIE9wdGlvbmFsbHksIHlvdSBjYW4gcGFzcyBhIGN1c3RvbSBuYW1lIGZvciB0aGUgc3RhdGUgY2hhbm5lbC4gQnkgZGVmYXVsdCxcbiAqIHRoZSBuYW1lIGlzICdzdGF0ZScgaW4gc291cmNlcyBhbmQgc2lua3MsIGJ1dCB5b3UgY2FuIGNoYW5nZSB0aGF0IHRvIGJlXG4gKiB3aGF0ZXZlciBzdHJpbmcgeW91IHdpc2guXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgYW4gb3B0aW9uYWwgc3RyaW5nIGZvciB0aGUgY3VzdG9tIG5hbWUgZ2l2ZW4gdG8gdGhlXG4gKiBzdGF0ZSBjaGFubmVsLiBCeSBkZWZhdWx0LCBpdCBpcyB0aGUgc3RyaW5nICdzdGF0ZScuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBjb21wb25lbnQgdGhhdCB3cmFwcyB0aGUgbWFpbiBmdW5jdGlvbiBnaXZlbiBhcyBpbnB1dCxcbiAqIGFkZGluZyBzdGF0ZSBhY2N1bXVsYXRpb24gbG9naWMgdG8gaXQuXG4gKiBAZnVuY3Rpb24gd2l0aFN0YXRlXG4gKi9cbnZhciB3aXRoU3RhdGVfMSA9IHJlcXVpcmUoXCIuL3dpdGhTdGF0ZVwiKTtcbmV4cG9ydHMud2l0aFN0YXRlID0gd2l0aFN0YXRlXzEud2l0aFN0YXRlO1xuLyoqXG4gKiBSZXR1cm5zIGEgQ3ljbGUuanMgY29tcG9uZW50IChhIGZ1bmN0aW9uIGZyb20gc291cmNlcyB0byBzaW5rcykgdGhhdFxuICogcmVwcmVzZW50cyBhIGNvbGxlY3Rpb24gb2YgbWFueSBpdGVtIGNvbXBvbmVudHMgb2YgdGhlIHNhbWUgdHlwZS5cbiAqXG4gKiBUYWtlcyBhbiBcIm9wdGlvbnNcIiBvYmplY3QgYXMgaW5wdXQsIHdpdGggdGhlIHJlcXVpcmVkIHByb3BlcnRpZXM6XG4gKiAtIGl0ZW1cbiAqIC0gY29sbGVjdFNpbmtzXG4gKlxuICogQW5kIHRoZSBvcHRpb25hbCBwcm9wZXJ0aWVzOlxuICogLSBpdGVtS2V5XG4gKiAtIGl0ZW1TY29wZVxuICogLSBjaGFubmVsXG4gKlxuICogVGhlIHJldHVybmVkIGNvbXBvbmVudCwgdGhlIENvbGxlY3Rpb24sIHdpbGwgdXNlIHRoZSBzdGF0ZSBzb3VyY2UgcGFzc2VkIHRvXG4gKiBpdCAodGhyb3VnaCBzb3VyY2VzKSB0byBndWlkZSB0aGUgZHluYW1pYyBncm93aW5nL3Nocmlua2luZyBvZiBpbnN0YW5jZXMgb2ZcbiAqIHRoZSBpdGVtIGNvbXBvbmVudC5cbiAqXG4gKiBUeXBpY2FsbHkgdGhlIHN0YXRlIHNvdXJjZSBzaG91bGQgZW1pdCBhcnJheXMsIHdoZXJlIGVhY2ggZW50cnkgaW4gdGhlIGFycmF5XG4gKiBpcyBhbiBvYmplY3QgaG9sZGluZyB0aGUgc3RhdGUgZm9yIGVhY2ggaXRlbSBjb21wb25lbnQuIFdoZW4gdGhlIHN0YXRlIGFycmF5XG4gKiBncm93cywgdGhlIGNvbGxlY3Rpb24gd2lsbCBhdXRvbWF0aWNhbGx5IGluc3RhbnRpYXRlIGEgbmV3IGl0ZW0gY29tcG9uZW50LlxuICogU2ltaWxhcmx5LCB3aGVuIHRoZSBzdGF0ZSBhcnJheSBnZXRzIHNtYWxsZXIsIHRoZSBjb2xsZWN0aW9uIHdpbGwgaGFuZGxlXG4gKiByZW1vdmFsIG9mIHRoZSBjb3JyZXNwb25kaW5nIGl0ZW0gaW5zdGFuY2UuXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cyBhIGNvbmZpZ3VyYXRpb24gb2JqZWN0IHdpdGggdGhlIGZvbGxvd2luZyBmaWVsZHM6XG4gKiAgIC0gYGl0ZW06IGZ1bmN0aW9uYCwgYSBDeWNsZS5qcyBjb21wb25lbnQgZm9yIGVhY2ggaXRlbSBpbiB0aGUgY29sbGVjdGlvbi5cbiAqICAgLSBgY29sbGVjdFNpbmtzOiBmdW5jdGlvbmAsIGEgZnVuY3Rpb24gdGhhdCBkZXNjcmliZXMgaG93IHRvIGNvbGxlY3QgdGhlXG4gKiAgICAgIHNpbmtzIGZyb20gYWxsIGl0ZW0gaW5zdGFuY2VzLlxuICogICAtIGBpdGVtS2V5OiBmdW5jdGlvbmAsIGEgZnVuY3Rpb24gZnJvbSBpdGVtIHN0YXRlIHRvIGl0ZW0gKHVuaXF1ZSkga2V5LlxuICogICAtIGBpdGVtU2NvcGU6IGZ1bmN0aW9uYCwgYSBmdW5jdGlvbiBmcm9tIGl0ZW0ga2V5IHRvIGlzb2xhdGlvbiBzY29wZS5cbiAqICAgLSBgY2hhbm5lbDogc3RyaW5nYCwgY2hvb3NlIHRoZSBjaGFubmVsIG5hbWUgd2hlcmUgdGhlIFN0YXRlU291cmNlIGV4aXN0cy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhIGNvbXBvbmVudCB0aGF0IGRpc3BsYXlzIG1hbnkgaW5zdGFuY2VzIG9mIHRoZSBpdGVtXG4gKiBjb21wb25lbnQuXG4gKiBAZnVuY3Rpb24gbWFrZUNvbGxlY3Rpb25cbiAqL1xudmFyIENvbGxlY3Rpb25fMiA9IHJlcXVpcmUoXCIuL0NvbGxlY3Rpb25cIik7XG5leHBvcnRzLm1ha2VDb2xsZWN0aW9uID0gQ29sbGVjdGlvbl8yLm1ha2VDb2xsZWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgUGlja0NvbWJpbmVMaXN0ZW5lciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrQ29tYmluZUxpc3RlbmVyKGtleSwgb3V0LCBwLCBpbnMpIHtcbiAgICAgICAgdGhpcy5rZXkgPSBrZXk7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLnAgPSBwO1xuICAgICAgICB0aGlzLnZhbCA9IHhzdHJlYW1fMS5OTztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgfVxuICAgIFBpY2tDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKHQpIHtcbiAgICAgICAgdmFyIHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgICAgICB0aGlzLnZhbCA9IHQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnAudXAoKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9lID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2UoZXJyKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lTGlzdGVuZXIucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIHJldHVybiBQaWNrQ29tYmluZUxpc3RlbmVyO1xufSgpKTtcbnZhciBQaWNrQ29tYmluZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrQ29tYmluZShzZWwsIGlucykge1xuICAgICAgICB0aGlzLnR5cGUgPSAnY29tYmluZSc7XG4gICAgICAgIHRoaXMuaW5zID0gaW5zO1xuICAgICAgICB0aGlzLnNlbCA9IHNlbDtcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmlscyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pbnN0ID0gbnVsbDtcbiAgICB9XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgaWxzLmZvckVhY2goZnVuY3Rpb24gKGlsKSB7XG4gICAgICAgICAgICBpbC5pbnMuX3JlbW92ZShpbCk7XG4gICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgIGlsLnZhbCA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICBpbHMuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLmlscyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5pbnN0ID0gbnVsbDtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS51cCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyciA9IHRoaXMuaW5zdC5hcnI7XG4gICAgICAgIHZhciBuID0gYXJyLmxlbmd0aDtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICB2YXIgb3V0QXJyID0gQXJyYXkobik7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc2lua3MgPSBhcnJbaV07XG4gICAgICAgICAgICB2YXIga2V5ID0gc2lua3MuX2tleTtcbiAgICAgICAgICAgIGlmICghaWxzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHZhbCA9IGlscy5nZXQoa2V5KS52YWw7XG4gICAgICAgICAgICBpZiAodmFsID09PSB4c3RyZWFtXzEuTk8pIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvdXRBcnJbaV0gPSB2YWw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vdXQuX24ob3V0QXJyKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uIChpbnN0KSB7XG4gICAgICAgIHRoaXMuaW5zdCA9IGluc3Q7XG4gICAgICAgIHZhciBhcnJTaW5rcyA9IGluc3QuYXJyO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgdmFyIHNlbCA9IHRoaXMuc2VsO1xuICAgICAgICB2YXIgZGljdCA9IGluc3QuZGljdDtcbiAgICAgICAgdmFyIG4gPSBhcnJTaW5rcy5sZW5ndGg7XG4gICAgICAgIC8vIHJlbW92ZVxuICAgICAgICB2YXIgcmVtb3ZlZCA9IGZhbHNlO1xuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwsIGtleSkge1xuICAgICAgICAgICAgaWYgKCFkaWN0LmhhcyhrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWwuaW5zLl9yZW1vdmUoaWwpO1xuICAgICAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbC52YWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlscy5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgICAgICByZW1vdmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChuID09PSAwKSB7XG4gICAgICAgICAgICBvdXQuX24oW10pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIGFkZFxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgdmFyIHNpbmtzID0gYXJyU2lua3NbaV07XG4gICAgICAgICAgICB2YXIga2V5ID0gc2lua3MuX2tleTtcbiAgICAgICAgICAgIGlmICghc2lua3Nbc2VsXSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncGlja0NvbWJpbmUgZm91bmQgYW4gdW5kZWZpbmVkIGNoaWxkIHNpbmsgc3RyZWFtJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgc2luayA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW3NlbF0pO1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbHMuc2V0KGtleSwgbmV3IFBpY2tDb21iaW5lTGlzdGVuZXIoa2V5LCBvdXQsIHRoaXMsIHNpbmspKTtcbiAgICAgICAgICAgICAgICBzaW5rLl9hZGQoaWxzLmdldChrZXkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICAgICAgdGhpcy51cCgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX2UoZSk7XG4gICAgfTtcbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fYygpO1xuICAgIH07XG4gICAgcmV0dXJuIFBpY2tDb21iaW5lO1xufSgpKTtcbmZ1bmN0aW9uIHBpY2tDb21iaW5lKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBpY2tDb21iaW5lT3BlcmF0b3IoaW5zdCQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyB4c3RyZWFtXzEuU3RyZWFtKG5ldyBQaWNrQ29tYmluZShzZWxlY3RvciwgaW5zdCQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5waWNrQ29tYmluZSA9IHBpY2tDb21iaW5lO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGlja0NvbWJpbmUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgUGlja01lcmdlTGlzdGVuZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGlja01lcmdlTGlzdGVuZXIob3V0LCBwLCBpbnMpIHtcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gb3V0O1xuICAgICAgICB0aGlzLnAgPSBwO1xuICAgIH1cbiAgICBQaWNrTWVyZ2VMaXN0ZW5lci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucCwgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmIChvdXQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBvdXQuX24odCk7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2VMaXN0ZW5lci5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fZShlcnIpO1xuICAgIH07XG4gICAgUGlja01lcmdlTGlzdGVuZXIucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkgeyB9O1xuICAgIHJldHVybiBQaWNrTWVyZ2VMaXN0ZW5lcjtcbn0oKSk7XG52YXIgUGlja01lcmdlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tNZXJnZShzZWwsIGlucykge1xuICAgICAgICB0aGlzLnR5cGUgPSAncGlja01lcmdlJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5zZWwgPSBzZWw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH1cbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9zdGFydCA9IGZ1bmN0aW9uIChvdXQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCwga2V5KSB7XG4gICAgICAgICAgICBpbC5pbnMuX3JlbW92ZShpbCk7XG4gICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgIGlscy5kZWxldGUoa2V5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlscy5jbGVhcigpO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uIChpbnN0KSB7XG4gICAgICAgIHRoaXMuaW5zdCA9IGluc3Q7XG4gICAgICAgIHZhciBhcnJTaW5rcyA9IGluc3QuYXJyO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgdmFyIHNlbCA9IHRoaXMuc2VsO1xuICAgICAgICB2YXIgbiA9IGFyclNpbmtzLmxlbmd0aDtcbiAgICAgICAgLy8gYWRkXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc2lua3MgPSBhcnJTaW5rc1tpXTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBzaW5rcy5fa2V5O1xuICAgICAgICAgICAgdmFyIHNpbmsgPSB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tzZWxdIHx8IHhzdHJlYW1fMS5kZWZhdWx0Lm5ldmVyKCkpO1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbHMuc2V0KGtleSwgbmV3IFBpY2tNZXJnZUxpc3RlbmVyKG91dCwgdGhpcywgc2luaykpO1xuICAgICAgICAgICAgICAgIHNpbmsuX2FkZChpbHMuZ2V0KGtleSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHJlbW92ZVxuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwsIGtleSkge1xuICAgICAgICAgICAgaWYgKCFpbnN0LmRpY3QuaGFzKGtleSkgfHwgIWluc3QuZGljdC5nZXQoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgICAgICBpbC5pbnMgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlsLm91dCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWxzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciB1ID0gdGhpcy5vdXQ7XG4gICAgICAgIGlmICh1ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdS5fZShlcnIpO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1Ll9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gUGlja01lcmdlO1xufSgpKTtcbmZ1bmN0aW9uIHBpY2tNZXJnZShzZWxlY3Rvcikge1xuICAgIHJldHVybiBmdW5jdGlvbiBwaWNrTWVyZ2VPcGVyYXRvcihpbnN0JCkge1xuICAgICAgICByZXR1cm4gbmV3IHhzdHJlYW1fMS5TdHJlYW0obmV3IFBpY2tNZXJnZShzZWxlY3RvciwgaW5zdCQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5waWNrTWVyZ2UgPSBwaWNrTWVyZ2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1waWNrTWVyZ2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgY29uY2F0XzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9jb25jYXRcIik7XG52YXIgU3RhdGVTb3VyY2VfMSA9IHJlcXVpcmUoXCIuL1N0YXRlU291cmNlXCIpO1xudmFyIHF1aWNrdGFza18xID0gcmVxdWlyZShcInF1aWNrdGFza1wiKTtcbnZhciBzY2hlZHVsZSA9IHF1aWNrdGFza18xLmRlZmF1bHQoKTtcbmZ1bmN0aW9uIHdpdGhTdGF0ZShtYWluLCBuYW1lKSB7XG4gICAgaWYgKG5hbWUgPT09IHZvaWQgMCkgeyBuYW1lID0gJ3N0YXRlJzsgfVxuICAgIHJldHVybiBmdW5jdGlvbiBtYWluV2l0aFN0YXRlKHNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHJlZHVjZXJNaW1pYyQgPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgdmFyIHN0YXRlJCA9IHJlZHVjZXJNaW1pYyRcbiAgICAgICAgICAgIC5mb2xkKGZ1bmN0aW9uIChzdGF0ZSwgcmVkdWNlcikgeyByZXR1cm4gcmVkdWNlcihzdGF0ZSk7IH0sIHZvaWQgMClcbiAgICAgICAgICAgIC5kcm9wKDEpO1xuICAgICAgICB2YXIgaW5uZXJTb3VyY2VzID0gc291cmNlcztcbiAgICAgICAgaW5uZXJTb3VyY2VzW25hbWVdID0gbmV3IFN0YXRlU291cmNlXzEuU3RhdGVTb3VyY2Uoc3RhdGUkLCBuYW1lKTtcbiAgICAgICAgdmFyIHNpbmtzID0gbWFpbihpbm5lclNvdXJjZXMpO1xuICAgICAgICBpZiAoc2lua3NbbmFtZV0pIHtcbiAgICAgICAgICAgIHZhciBzdHJlYW0kID0gY29uY2F0XzEuZGVmYXVsdCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tuYW1lXSksIHhzdHJlYW1fMS5kZWZhdWx0Lm5ldmVyKCkpO1xuICAgICAgICAgICAgc3RyZWFtJC5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChpKSB7IHJldHVybiBzY2hlZHVsZShmdW5jdGlvbiAoKSB7IHJldHVybiByZWR1Y2VyTWltaWMkLl9uKGkpOyB9KTsgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikgeyByZXR1cm4gc2NoZWR1bGUoZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVkdWNlck1pbWljJC5fZShlcnIpOyB9KTsgfSxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyByZXR1cm4gc2NoZWR1bGUoZnVuY3Rpb24gKCkgeyByZXR1cm4gcmVkdWNlck1pbWljJC5fYygpOyB9KTsgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzaW5rcztcbiAgICB9O1xufVxuZXhwb3J0cy53aXRoU3RhdGUgPSB3aXRoU3RhdGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD13aXRoU3RhdGUuanMubWFwIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gbWljcm90YXNrKCkge1xuICAgIGlmICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIG5vZGVfMSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgdmFyIHF1ZXVlXzEgPSBbXTtcbiAgICAgICAgdmFyIGlfMSA9IDA7XG4gICAgICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChxdWV1ZV8xLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHF1ZXVlXzEuc2hpZnQoKSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5vYnNlcnZlKG5vZGVfMSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZV8xLnB1c2goZm4pO1xuICAgICAgICAgICAgbm9kZV8xLmRhdGEgPSBpXzEgPSAxIC0gaV8xO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gc2V0SW1tZWRpYXRlO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dDtcbiAgICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBtaWNyb3Rhc2s7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZSgnLi9zZWxlY3RvclBhcnNlcicpO1xuZnVuY3Rpb24gY2xhc3NOYW1lRnJvbVZOb2RlKHZOb2RlKSB7XG4gICAgdmFyIF9hID0gc2VsZWN0b3JQYXJzZXJfMS5zZWxlY3RvclBhcnNlcih2Tm9kZSkuY2xhc3NOYW1lLCBjbiA9IF9hID09PSB2b2lkIDAgPyAnJyA6IF9hO1xuICAgIGlmICghdk5vZGUuZGF0YSkge1xuICAgICAgICByZXR1cm4gY247XG4gICAgfVxuICAgIHZhciBfYiA9IHZOb2RlLmRhdGEsIGRhdGFDbGFzcyA9IF9iLmNsYXNzLCBwcm9wcyA9IF9iLnByb3BzO1xuICAgIGlmIChkYXRhQ2xhc3MpIHtcbiAgICAgICAgdmFyIGMgPSBPYmplY3Qua2V5cyhkYXRhQ2xhc3MpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjbCkgeyByZXR1cm4gZGF0YUNsYXNzW2NsXTsgfSk7XG4gICAgICAgIGNuICs9IFwiIFwiICsgYy5qb2luKFwiIFwiKTtcbiAgICB9XG4gICAgaWYgKHByb3BzICYmIHByb3BzLmNsYXNzTmFtZSkge1xuICAgICAgICBjbiArPSBcIiBcIiArIHByb3BzLmNsYXNzTmFtZTtcbiAgICB9XG4gICAgcmV0dXJuIGNuICYmIGNuLnRyaW0oKTtcbn1cbmV4cG9ydHMuY2xhc3NOYW1lRnJvbVZOb2RlID0gY2xhc3NOYW1lRnJvbVZOb2RlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y2xhc3NOYW1lRnJvbVZOb2RlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gY3VycnkyKHNlbGVjdCkge1xuICAgIHJldHVybiBmdW5jdGlvbiBzZWxlY3RvcihzZWwsIHZOb2RlKSB7XG4gICAgICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgY2FzZSAwOiByZXR1cm4gc2VsZWN0O1xuICAgICAgICAgICAgY2FzZSAxOiByZXR1cm4gZnVuY3Rpb24gKF92Tm9kZSkgeyByZXR1cm4gc2VsZWN0KHNlbCwgX3ZOb2RlKTsgfTtcbiAgICAgICAgICAgIGRlZmF1bHQ6IHJldHVybiBzZWxlY3Qoc2VsLCB2Tm9kZSk7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZXhwb3J0cy5jdXJyeTIgPSBjdXJyeTI7XG47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jdXJyeTIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcXVlcnlfMSA9IHJlcXVpcmUoJy4vcXVlcnknKTtcbnZhciBwYXJlbnRfc3ltYm9sXzEgPSByZXF1aXJlKCcuL3BhcmVudC1zeW1ib2wnKTtcbmZ1bmN0aW9uIGZpbmRNYXRjaGVzKGNzc1NlbGVjdG9yLCB2Tm9kZSkge1xuICAgIGlmICghdk5vZGUpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICB0cmF2ZXJzZVZOb2RlKHZOb2RlLCBhZGRQYXJlbnQpOyAvLyBhZGQgbWFwcGluZyB0byB0aGUgcGFyZW50IHNlbGVjdG9yUGFyc2VyXG4gICAgcmV0dXJuIHF1ZXJ5XzEucXVlcnlTZWxlY3Rvcihjc3NTZWxlY3Rvciwgdk5vZGUpO1xufVxuZXhwb3J0cy5maW5kTWF0Y2hlcyA9IGZpbmRNYXRjaGVzO1xuZnVuY3Rpb24gdHJhdmVyc2VWTm9kZSh2Tm9kZSwgZikge1xuICAgIGZ1bmN0aW9uIHJlY3Vyc2UoY3VycmVudE5vZGUsIGlzUGFyZW50LCBwYXJlbnRWTm9kZSkge1xuICAgICAgICB2YXIgbGVuZ3RoID0gY3VycmVudE5vZGUuY2hpbGRyZW4gJiYgY3VycmVudE5vZGUuY2hpbGRyZW4ubGVuZ3RoIHx8IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbiA9IGN1cnJlbnROb2RlLmNoaWxkcmVuO1xuICAgICAgICAgICAgaWYgKGNoaWxkcmVuICYmIGNoaWxkcmVuW2ldICYmIHR5cGVvZiBjaGlsZHJlbltpXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB2YXIgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICByZWN1cnNlKGNoaWxkLCBmYWxzZSwgY3VycmVudE5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGYoY3VycmVudE5vZGUsIGlzUGFyZW50LCBpc1BhcmVudCA/IHZvaWQgMCA6IHBhcmVudFZOb2RlKTtcbiAgICB9XG4gICAgcmVjdXJzZSh2Tm9kZSwgdHJ1ZSk7XG59XG5mdW5jdGlvbiBhZGRQYXJlbnQodk5vZGUsIGlzUGFyZW50LCBwYXJlbnQpIHtcbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgICAgcmV0dXJuIHZvaWQgMDtcbiAgICB9XG4gICAgaWYgKCF2Tm9kZS5kYXRhKSB7XG4gICAgICAgIHZOb2RlLmRhdGEgPSB7fTtcbiAgICB9XG4gICAgaWYgKCF2Tm9kZS5kYXRhW3BhcmVudF9zeW1ib2xfMS5kZWZhdWx0XSkge1xuICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodk5vZGUuZGF0YSwgcGFyZW50X3N5bWJvbF8xLmRlZmF1bHQsIHtcbiAgICAgICAgICAgIHZhbHVlOiBwYXJlbnQsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWZpbmRNYXRjaGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIGN1cnJ5Ml8xID0gcmVxdWlyZSgnLi9jdXJyeTInKTtcbnZhciBmaW5kTWF0Y2hlc18xID0gcmVxdWlyZSgnLi9maW5kTWF0Y2hlcycpO1xuZXhwb3J0cy5zZWxlY3QgPSBjdXJyeTJfMS5jdXJyeTIoZmluZE1hdGNoZXNfMS5maW5kTWF0Y2hlcyk7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoJy4vc2VsZWN0b3JQYXJzZXInKTtcbmV4cG9ydHMuc2VsZWN0b3JQYXJzZXIgPSBzZWxlY3RvclBhcnNlcl8xLnNlbGVjdG9yUGFyc2VyO1xudmFyIGNsYXNzTmFtZUZyb21WTm9kZV8xID0gcmVxdWlyZSgnLi9jbGFzc05hbWVGcm9tVk5vZGUnKTtcbmV4cG9ydHMuY2xhc3NOYW1lRnJvbVZOb2RlID0gY2xhc3NOYW1lRnJvbVZOb2RlXzEuY2xhc3NOYW1lRnJvbVZOb2RlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgcm9vdDtcbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICByb290ID0gc2VsZjtcbn1cbmVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IHdpbmRvdztcbn1cbmVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IGdsb2JhbDtcbn1cbmVsc2Uge1xuICAgIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxudmFyIFN5bWJvbCA9IHJvb3QuU3ltYm9sO1xudmFyIHBhcmVudFN5bWJvbDtcbmlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcGFyZW50U3ltYm9sID0gU3ltYm9sKCdwYXJlbnQnKTtcbn1cbmVsc2Uge1xuICAgIHBhcmVudFN5bWJvbCA9ICdAQHNuYWJiZG9tLXNlbGVjdG9yLXBhcmVudCc7XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLmRlZmF1bHQgPSBwYXJlbnRTeW1ib2w7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wYXJlbnQtc3ltYm9sLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHRyZWVfc2VsZWN0b3JfMSA9IHJlcXVpcmUoJ3RyZWUtc2VsZWN0b3InKTtcbnZhciBzZWxlY3RvclBhcnNlcl8xID0gcmVxdWlyZSgnLi9zZWxlY3RvclBhcnNlcicpO1xudmFyIGNsYXNzTmFtZUZyb21WTm9kZV8xID0gcmVxdWlyZSgnLi9jbGFzc05hbWVGcm9tVk5vZGUnKTtcbnZhciBwYXJlbnRfc3ltYm9sXzEgPSByZXF1aXJlKCcuL3BhcmVudC1zeW1ib2wnKTtcbnZhciBvcHRpb25zID0ge1xuICAgIHRhZzogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiBzZWxlY3RvclBhcnNlcl8xLnNlbGVjdG9yUGFyc2VyKHZOb2RlKS50YWdOYW1lOyB9LFxuICAgIGNsYXNzTmFtZTogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiBjbGFzc05hbWVGcm9tVk5vZGVfMS5jbGFzc05hbWVGcm9tVk5vZGUodk5vZGUpOyB9LFxuICAgIGlkOiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIHNlbGVjdG9yUGFyc2VyXzEuc2VsZWN0b3JQYXJzZXIodk5vZGUpLmlkIHx8ICcnOyB9LFxuICAgIGNoaWxkcmVuOiBmdW5jdGlvbiAodk5vZGUpIHsgcmV0dXJuIHZOb2RlLmNoaWxkcmVuIHx8IFtdOyB9LFxuICAgIHBhcmVudDogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiB2Tm9kZS5kYXRhW3BhcmVudF9zeW1ib2xfMS5kZWZhdWx0XSB8fCB2Tm9kZTsgfSxcbiAgICBjb250ZW50czogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiB2Tm9kZS50ZXh0IHx8ICcnOyB9LFxuICAgIGF0dHI6IGZ1bmN0aW9uICh2Tm9kZSwgYXR0cikge1xuICAgICAgICBpZiAodk5vZGUuZGF0YSkge1xuICAgICAgICAgICAgdmFyIF9hID0gdk5vZGUuZGF0YSwgX2IgPSBfYS5hdHRycywgYXR0cnMgPSBfYiA9PT0gdm9pZCAwID8ge30gOiBfYiwgX2MgPSBfYS5wcm9wcywgcHJvcHMgPSBfYyA9PT0gdm9pZCAwID8ge30gOiBfYywgX2QgPSBfYS5kYXRhc2V0LCBkYXRhc2V0ID0gX2QgPT09IHZvaWQgMCA/IHt9IDogX2Q7XG4gICAgICAgICAgICBpZiAoYXR0cnNbYXR0cl0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXR0cnNbYXR0cl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJvcHNbYXR0cl0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvcHNbYXR0cl07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYXR0ci5pbmRleE9mKCdkYXRhLScpID09PSAwICYmIGRhdGFzZXRbYXR0ci5zbGljZSg1KV0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YXNldFthdHRyLnNsaWNlKDUpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG59O1xudmFyIG1hdGNoZXMgPSB0cmVlX3NlbGVjdG9yXzEuY3JlYXRlTWF0Y2hlcyhvcHRpb25zKTtcbmZ1bmN0aW9uIGN1c3RvbU1hdGNoZXMoc2VsLCB2bm9kZSkge1xuICAgIHZhciBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICB2YXIgc2VsZWN0b3IgPSBtYXRjaGVzLmJpbmQobnVsbCwgc2VsKTtcbiAgICBpZiAoZGF0YSAmJiBkYXRhLmZuKSB7XG4gICAgICAgIHZhciBuID0gdm9pZCAwO1xuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShkYXRhLmFyZ3MpKSB7XG4gICAgICAgICAgICBuID0gZGF0YS5mbi5hcHBseShudWxsLCBkYXRhLmFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGRhdGEuYXJncykge1xuICAgICAgICAgICAgbiA9IGRhdGEuZm4uY2FsbChudWxsLCBkYXRhLmFyZ3MpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbiA9IGRhdGEuZm4oKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc2VsZWN0b3IobikgPyBuIDogZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3Rvcih2bm9kZSk7XG59XG5leHBvcnRzLnF1ZXJ5U2VsZWN0b3IgPSB0cmVlX3NlbGVjdG9yXzEuY3JlYXRlUXVlcnlTZWxlY3RvcihvcHRpb25zLCBjdXN0b21NYXRjaGVzKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXJ5LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gc2VsZWN0b3JQYXJzZXIobm9kZSkge1xuICAgIGlmICghbm9kZS5zZWwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRhZ05hbWU6ICcnLFxuICAgICAgICAgICAgaWQ6ICcnLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnJyxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIHNlbCA9IG5vZGUuc2VsO1xuICAgIHZhciBoYXNoSWR4ID0gc2VsLmluZGV4T2YoJyMnKTtcbiAgICB2YXIgZG90SWR4ID0gc2VsLmluZGV4T2YoJy4nLCBoYXNoSWR4KTtcbiAgICB2YXIgaGFzaCA9IGhhc2hJZHggPiAwID8gaGFzaElkeCA6IHNlbC5sZW5ndGg7XG4gICAgdmFyIGRvdCA9IGRvdElkeCA+IDAgPyBkb3RJZHggOiBzZWwubGVuZ3RoO1xuICAgIHZhciB0YWdOYW1lID0gaGFzaElkeCAhPT0gLTEgfHwgZG90SWR4ICE9PSAtMSA/XG4gICAgICAgIHNlbC5zbGljZSgwLCBNYXRoLm1pbihoYXNoLCBkb3QpKSA6XG4gICAgICAgIHNlbDtcbiAgICB2YXIgaWQgPSBoYXNoIDwgZG90ID8gc2VsLnNsaWNlKGhhc2ggKyAxLCBkb3QpIDogdm9pZCAwO1xuICAgIHZhciBjbGFzc05hbWUgPSBkb3RJZHggPiAwID8gc2VsLnNsaWNlKGRvdCArIDEpLnJlcGxhY2UoL1xcLi9nLCAnICcpIDogdm9pZCAwO1xuICAgIHJldHVybiB7XG4gICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgIGlkOiBpZCxcbiAgICAgICAgY2xhc3NOYW1lOiBjbGFzc05hbWUsXG4gICAgfTtcbn1cbmV4cG9ydHMuc2VsZWN0b3JQYXJzZXIgPSBzZWxlY3RvclBhcnNlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNlbGVjdG9yUGFyc2VyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcbnZhciBpcyA9IHJlcXVpcmUoXCIuL2lzXCIpO1xuZnVuY3Rpb24gYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCkge1xuICAgIGRhdGEubnMgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuICAgIGlmIChzZWwgIT09ICdmb3JlaWduT2JqZWN0JyAmJiBjaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZERhdGEgPSBjaGlsZHJlbltpXS5kYXRhO1xuICAgICAgICAgICAgaWYgKGNoaWxkRGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgYWRkTlMoY2hpbGREYXRhLCBjaGlsZHJlbltpXS5jaGlsZHJlbiwgY2hpbGRyZW5baV0uc2VsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGgoc2VsLCBiLCBjKSB7XG4gICAgdmFyIGRhdGEgPSB7fSwgY2hpbGRyZW4sIHRleHQsIGk7XG4gICAgaWYgKGMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBkYXRhID0gYjtcbiAgICAgICAgaWYgKGlzLmFycmF5KGMpKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGMpKSB7XG4gICAgICAgICAgICB0ZXh0ID0gYztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjICYmIGMuc2VsKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtjXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChiICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKGlzLmFycmF5KGIpKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IGI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXMucHJpbWl0aXZlKGIpKSB7XG4gICAgICAgICAgICB0ZXh0ID0gYjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChiICYmIGIuc2VsKSB7XG4gICAgICAgICAgICBjaGlsZHJlbiA9IFtiXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEgPSBiO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaWYgKGlzLnByaW1pdGl2ZShjaGlsZHJlbltpXSkpXG4gICAgICAgICAgICAgICAgY2hpbGRyZW5baV0gPSB2bm9kZV8xLnZub2RlKHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGNoaWxkcmVuW2ldLCB1bmRlZmluZWQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChzZWxbMF0gPT09ICdzJyAmJiBzZWxbMV0gPT09ICd2JyAmJiBzZWxbMl0gPT09ICdnJyAmJlxuICAgICAgICAoc2VsLmxlbmd0aCA9PT0gMyB8fCBzZWxbM10gPT09ICcuJyB8fCBzZWxbM10gPT09ICcjJykpIHtcbiAgICAgICAgYWRkTlMoZGF0YSwgY2hpbGRyZW4sIHNlbCk7XG4gICAgfVxuICAgIHJldHVybiB2bm9kZV8xLnZub2RlKHNlbCwgZGF0YSwgY2hpbGRyZW4sIHRleHQsIHVuZGVmaW5lZCk7XG59XG5leHBvcnRzLmggPSBoO1xuO1xuZXhwb3J0cy5kZWZhdWx0ID0gaDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZ05hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2VVUkksIHF1YWxpZmllZE5hbWUpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZVVSSSwgcXVhbGlmaWVkTmFtZSk7XG59XG5mdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh0ZXh0KSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xufVxuZnVuY3Rpb24gY3JlYXRlQ29tbWVudCh0ZXh0KSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQodGV4dCk7XG59XG5mdW5jdGlvbiBpbnNlcnRCZWZvcmUocGFyZW50Tm9kZSwgbmV3Tm9kZSwgcmVmZXJlbmNlTm9kZSkge1xuICAgIHBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKG5ld05vZGUsIHJlZmVyZW5jZU5vZGUpO1xufVxuZnVuY3Rpb24gcmVtb3ZlQ2hpbGQobm9kZSwgY2hpbGQpIHtcbiAgICBub2RlLnJlbW92ZUNoaWxkKGNoaWxkKTtcbn1cbmZ1bmN0aW9uIGFwcGVuZENoaWxkKG5vZGUsIGNoaWxkKSB7XG4gICAgbm9kZS5hcHBlbmRDaGlsZChjaGlsZCk7XG59XG5mdW5jdGlvbiBwYXJlbnROb2RlKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5wYXJlbnROb2RlO1xufVxuZnVuY3Rpb24gbmV4dFNpYmxpbmcobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5leHRTaWJsaW5nO1xufVxuZnVuY3Rpb24gdGFnTmFtZShlbG0pIHtcbiAgICByZXR1cm4gZWxtLnRhZ05hbWU7XG59XG5mdW5jdGlvbiBzZXRUZXh0Q29udGVudChub2RlLCB0ZXh0KSB7XG4gICAgbm9kZS50ZXh0Q29udGVudCA9IHRleHQ7XG59XG5mdW5jdGlvbiBnZXRUZXh0Q29udGVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUudGV4dENvbnRlbnQ7XG59XG5mdW5jdGlvbiBpc0VsZW1lbnQobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSAxO1xufVxuZnVuY3Rpb24gaXNUZXh0KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMztcbn1cbmZ1bmN0aW9uIGlzQ29tbWVudChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDg7XG59XG5leHBvcnRzLmh0bWxEb21BcGkgPSB7XG4gICAgY3JlYXRlRWxlbWVudDogY3JlYXRlRWxlbWVudCxcbiAgICBjcmVhdGVFbGVtZW50TlM6IGNyZWF0ZUVsZW1lbnROUyxcbiAgICBjcmVhdGVUZXh0Tm9kZTogY3JlYXRlVGV4dE5vZGUsXG4gICAgY3JlYXRlQ29tbWVudDogY3JlYXRlQ29tbWVudCxcbiAgICBpbnNlcnRCZWZvcmU6IGluc2VydEJlZm9yZSxcbiAgICByZW1vdmVDaGlsZDogcmVtb3ZlQ2hpbGQsXG4gICAgYXBwZW5kQ2hpbGQ6IGFwcGVuZENoaWxkLFxuICAgIHBhcmVudE5vZGU6IHBhcmVudE5vZGUsXG4gICAgbmV4dFNpYmxpbmc6IG5leHRTaWJsaW5nLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgc2V0VGV4dENvbnRlbnQ6IHNldFRleHRDb250ZW50LFxuICAgIGdldFRleHRDb250ZW50OiBnZXRUZXh0Q29udGVudCxcbiAgICBpc0VsZW1lbnQ6IGlzRWxlbWVudCxcbiAgICBpc1RleHQ6IGlzVGV4dCxcbiAgICBpc0NvbW1lbnQ6IGlzQ29tbWVudCxcbn07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmh0bWxEb21BcGk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1odG1sZG9tYXBpLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5hcnJheSA9IEFycmF5LmlzQXJyYXk7XG5mdW5jdGlvbiBwcmltaXRpdmUocykge1xuICAgIHJldHVybiB0eXBlb2YgcyA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHMgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5wcmltaXRpdmUgPSBwcmltaXRpdmU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4bGlua05TID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnO1xudmFyIHhtbE5TID0gJ2h0dHA6Ly93d3cudzMub3JnL1hNTC8xOTk4L25hbWVzcGFjZSc7XG52YXIgY29sb25DaGFyID0gNTg7XG52YXIgeENoYXIgPSAxMjA7XG5mdW5jdGlvbiB1cGRhdGVBdHRycyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIga2V5LCBlbG0gPSB2bm9kZS5lbG0sIG9sZEF0dHJzID0gb2xkVm5vZGUuZGF0YS5hdHRycywgYXR0cnMgPSB2bm9kZS5kYXRhLmF0dHJzO1xuICAgIGlmICghb2xkQXR0cnMgJiYgIWF0dHJzKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZEF0dHJzID09PSBhdHRycylcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZEF0dHJzID0gb2xkQXR0cnMgfHwge307XG4gICAgYXR0cnMgPSBhdHRycyB8fCB7fTtcbiAgICAvLyB1cGRhdGUgbW9kaWZpZWQgYXR0cmlidXRlcywgYWRkIG5ldyBhdHRyaWJ1dGVzXG4gICAgZm9yIChrZXkgaW4gYXR0cnMpIHtcbiAgICAgICAgdmFyIGN1ciA9IGF0dHJzW2tleV07XG4gICAgICAgIHZhciBvbGQgPSBvbGRBdHRyc1trZXldO1xuICAgICAgICBpZiAob2xkICE9PSBjdXIpIHtcbiAgICAgICAgICAgIGlmIChjdXIgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgXCJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjdXIgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgZWxtLnJlbW92ZUF0dHJpYnV0ZShrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleS5jaGFyQ29kZUF0KDApICE9PSB4Q2hhcikge1xuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5LmNoYXJDb2RlQXQoMykgPT09IGNvbG9uQ2hhcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWUgeG1sIG5hbWVzcGFjZVxuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlTlMoeG1sTlMsIGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoa2V5LmNoYXJDb2RlQXQoNSkgPT09IGNvbG9uQ2hhcikge1xuICAgICAgICAgICAgICAgICAgICAvLyBBc3N1bWUgeGxpbmsgbmFtZXNwYWNlXG4gICAgICAgICAgICAgICAgICAgIGVsbS5zZXRBdHRyaWJ1dGVOUyh4bGlua05TLCBrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKGtleSwgY3VyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gcmVtb3ZlIHJlbW92ZWQgYXR0cmlidXRlc1xuICAgIC8vIHVzZSBgaW5gIG9wZXJhdG9yIHNpbmNlIHRoZSBwcmV2aW91cyBgZm9yYCBpdGVyYXRpb24gdXNlcyBpdCAoLmkuZS4gYWRkIGV2ZW4gYXR0cmlidXRlcyB3aXRoIHVuZGVmaW5lZCB2YWx1ZSlcbiAgICAvLyB0aGUgb3RoZXIgb3B0aW9uIGlzIHRvIHJlbW92ZSBhbGwgYXR0cmlidXRlcyB3aXRoIHZhbHVlID09IHVuZGVmaW5lZFxuICAgIGZvciAoa2V5IGluIG9sZEF0dHJzKSB7XG4gICAgICAgIGlmICghKGtleSBpbiBhdHRycykpIHtcbiAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuYXR0cmlidXRlc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVBdHRycywgdXBkYXRlOiB1cGRhdGVBdHRycyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5hdHRyaWJ1dGVzTW9kdWxlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXR0cmlidXRlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIHVwZGF0ZUNsYXNzKG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBjdXIsIG5hbWUsIGVsbSA9IHZub2RlLmVsbSwgb2xkQ2xhc3MgPSBvbGRWbm9kZS5kYXRhLmNsYXNzLCBrbGFzcyA9IHZub2RlLmRhdGEuY2xhc3M7XG4gICAgaWYgKCFvbGRDbGFzcyAmJiAha2xhc3MpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkQ2xhc3MgPT09IGtsYXNzKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkQ2xhc3MgPSBvbGRDbGFzcyB8fCB7fTtcbiAgICBrbGFzcyA9IGtsYXNzIHx8IHt9O1xuICAgIGZvciAobmFtZSBpbiBvbGRDbGFzcykge1xuICAgICAgICBpZiAoIWtsYXNzW25hbWVdKSB7XG4gICAgICAgICAgICBlbG0uY2xhc3NMaXN0LnJlbW92ZShuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKG5hbWUgaW4ga2xhc3MpIHtcbiAgICAgICAgY3VyID0ga2xhc3NbbmFtZV07XG4gICAgICAgIGlmIChjdXIgIT09IG9sZENsYXNzW25hbWVdKSB7XG4gICAgICAgICAgICBlbG0uY2xhc3NMaXN0W2N1ciA/ICdhZGQnIDogJ3JlbW92ZSddKG5hbWUpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5jbGFzc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVDbGFzcywgdXBkYXRlOiB1cGRhdGVDbGFzcyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5jbGFzc01vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNsYXNzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIENBUFNfUkVHRVggPSAvW0EtWl0vZztcbmZ1bmN0aW9uIHVwZGF0ZURhdGFzZXQob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGVsbSA9IHZub2RlLmVsbSwgb2xkRGF0YXNldCA9IG9sZFZub2RlLmRhdGEuZGF0YXNldCwgZGF0YXNldCA9IHZub2RlLmRhdGEuZGF0YXNldCwga2V5O1xuICAgIGlmICghb2xkRGF0YXNldCAmJiAhZGF0YXNldClcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGREYXRhc2V0ID09PSBkYXRhc2V0KVxuICAgICAgICByZXR1cm47XG4gICAgb2xkRGF0YXNldCA9IG9sZERhdGFzZXQgfHwge307XG4gICAgZGF0YXNldCA9IGRhdGFzZXQgfHwge307XG4gICAgdmFyIGQgPSBlbG0uZGF0YXNldDtcbiAgICBmb3IgKGtleSBpbiBvbGREYXRhc2V0KSB7XG4gICAgICAgIGlmICghZGF0YXNldFtrZXldKSB7XG4gICAgICAgICAgICBpZiAoZCkge1xuICAgICAgICAgICAgICAgIGlmIChrZXkgaW4gZCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgZFtrZXldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtJyArIGtleS5yZXBsYWNlKENBUFNfUkVHRVgsICctJCYnKS50b0xvd2VyQ2FzZSgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGtleSBpbiBkYXRhc2V0KSB7XG4gICAgICAgIGlmIChvbGREYXRhc2V0W2tleV0gIT09IGRhdGFzZXRba2V5XSkge1xuICAgICAgICAgICAgaWYgKGQpIHtcbiAgICAgICAgICAgICAgICBkW2tleV0gPSBkYXRhc2V0W2tleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdkYXRhLScgKyBrZXkucmVwbGFjZShDQVBTX1JFR0VYLCAnLSQmJykudG9Mb3dlckNhc2UoKSwgZGF0YXNldFtrZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuZGF0YXNldE1vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVEYXRhc2V0LCB1cGRhdGU6IHVwZGF0ZURhdGFzZXQgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuZGF0YXNldE1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWRhdGFzZXQuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB1cGRhdGVQcm9wcyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIga2V5LCBjdXIsIG9sZCwgZWxtID0gdm5vZGUuZWxtLCBvbGRQcm9wcyA9IG9sZFZub2RlLmRhdGEucHJvcHMsIHByb3BzID0gdm5vZGUuZGF0YS5wcm9wcztcbiAgICBpZiAoIW9sZFByb3BzICYmICFwcm9wcylcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRQcm9wcyA9PT0gcHJvcHMpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRQcm9wcyA9IG9sZFByb3BzIHx8IHt9O1xuICAgIHByb3BzID0gcHJvcHMgfHwge307XG4gICAgZm9yIChrZXkgaW4gb2xkUHJvcHMpIHtcbiAgICAgICAgaWYgKCFwcm9wc1trZXldKSB7XG4gICAgICAgICAgICBkZWxldGUgZWxtW2tleV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChrZXkgaW4gcHJvcHMpIHtcbiAgICAgICAgY3VyID0gcHJvcHNba2V5XTtcbiAgICAgICAgb2xkID0gb2xkUHJvcHNba2V5XTtcbiAgICAgICAgaWYgKG9sZCAhPT0gY3VyICYmIChrZXkgIT09ICd2YWx1ZScgfHwgZWxtW2tleV0gIT09IGN1cikpIHtcbiAgICAgICAgICAgIGVsbVtrZXldID0gY3VyO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5wcm9wc01vZHVsZSA9IHsgY3JlYXRlOiB1cGRhdGVQcm9wcywgdXBkYXRlOiB1cGRhdGVQcm9wcyB9O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5wcm9wc01vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByb3BzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLy8gQmluZGlnIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIGxpa2UgdGhpcyBmaXhlcyBhIGJ1ZyBpbiBJRS9FZGdlLiBTZWUgIzM2MCBhbmQgIzQwOS5cbnZhciByYWYgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgKHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUpLmJpbmQod2luZG93KSkgfHwgc2V0VGltZW91dDtcbnZhciBuZXh0RnJhbWUgPSBmdW5jdGlvbiAoZm4pIHsgcmFmKGZ1bmN0aW9uICgpIHsgcmFmKGZuKTsgfSk7IH07XG52YXIgcmVmbG93Rm9yY2VkID0gZmFsc2U7XG5mdW5jdGlvbiBzZXROZXh0RnJhbWUob2JqLCBwcm9wLCB2YWwpIHtcbiAgICBuZXh0RnJhbWUoZnVuY3Rpb24gKCkgeyBvYmpbcHJvcF0gPSB2YWw7IH0pO1xufVxuZnVuY3Rpb24gdXBkYXRlU3R5bGUob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGN1ciwgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBvbGRTdHlsZSA9IG9sZFZub2RlLmRhdGEuc3R5bGUsIHN0eWxlID0gdm5vZGUuZGF0YS5zdHlsZTtcbiAgICBpZiAoIW9sZFN0eWxlICYmICFzdHlsZSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRTdHlsZSA9PT0gc3R5bGUpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRTdHlsZSA9IG9sZFN0eWxlIHx8IHt9O1xuICAgIHN0eWxlID0gc3R5bGUgfHwge307XG4gICAgdmFyIG9sZEhhc0RlbCA9ICdkZWxheWVkJyBpbiBvbGRTdHlsZTtcbiAgICBmb3IgKG5hbWUgaW4gb2xkU3R5bGUpIHtcbiAgICAgICAgaWYgKCFzdHlsZVtuYW1lXSkge1xuICAgICAgICAgICAgaWYgKG5hbWVbMF0gPT09ICctJyAmJiBuYW1lWzFdID09PSAnLScpIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcbiAgICAgICAgY3VyID0gc3R5bGVbbmFtZV07XG4gICAgICAgIGlmIChuYW1lID09PSAnZGVsYXllZCcgJiYgc3R5bGUuZGVsYXllZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgbmFtZTIgaW4gc3R5bGUuZGVsYXllZCkge1xuICAgICAgICAgICAgICAgIGN1ciA9IHN0eWxlLmRlbGF5ZWRbbmFtZTJdO1xuICAgICAgICAgICAgICAgIGlmICghb2xkSGFzRGVsIHx8IGN1ciAhPT0gb2xkU3R5bGUuZGVsYXllZFtuYW1lMl0pIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0TmV4dEZyYW1lKGVsbS5zdHlsZSwgbmFtZTIsIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5hbWUgIT09ICdyZW1vdmUnICYmIGN1ciAhPT0gb2xkU3R5bGVbbmFtZV0pIHtcbiAgICAgICAgICAgIGlmIChuYW1lWzBdID09PSAnLScgJiYgbmFtZVsxXSA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIGN1cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBjdXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBhcHBseURlc3Ryb3lTdHlsZSh2bm9kZSkge1xuICAgIHZhciBzdHlsZSwgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBzID0gdm5vZGUuZGF0YS5zdHlsZTtcbiAgICBpZiAoIXMgfHwgIShzdHlsZSA9IHMuZGVzdHJveSkpXG4gICAgICAgIHJldHVybjtcbiAgICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcbiAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gc3R5bGVbbmFtZV07XG4gICAgfVxufVxuZnVuY3Rpb24gYXBwbHlSZW1vdmVTdHlsZSh2bm9kZSwgcm0pIHtcbiAgICB2YXIgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFzIHx8ICFzLnJlbW92ZSkge1xuICAgICAgICBybSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghcmVmbG93Rm9yY2VkKSB7XG4gICAgICAgIGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSkudHJhbnNmb3JtO1xuICAgICAgICByZWZsb3dGb3JjZWQgPSB0cnVlO1xuICAgIH1cbiAgICB2YXIgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBpID0gMCwgY29tcFN0eWxlLCBzdHlsZSA9IHMucmVtb3ZlLCBhbW91bnQgPSAwLCBhcHBsaWVkID0gW107XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGFwcGxpZWQucHVzaChuYW1lKTtcbiAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gc3R5bGVbbmFtZV07XG4gICAgfVxuICAgIGNvbXBTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxtKTtcbiAgICB2YXIgcHJvcHMgPSBjb21wU3R5bGVbJ3RyYW5zaXRpb24tcHJvcGVydHknXS5zcGxpdCgnLCAnKTtcbiAgICBmb3IgKDsgaSA8IHByb3BzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChhcHBsaWVkLmluZGV4T2YocHJvcHNbaV0pICE9PSAtMSlcbiAgICAgICAgICAgIGFtb3VudCsrO1xuICAgIH1cbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGZ1bmN0aW9uIChldikge1xuICAgICAgICBpZiAoZXYudGFyZ2V0ID09PSBlbG0pXG4gICAgICAgICAgICAtLWFtb3VudDtcbiAgICAgICAgaWYgKGFtb3VudCA9PT0gMClcbiAgICAgICAgICAgIHJtKCk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmb3JjZVJlZmxvdygpIHtcbiAgICByZWZsb3dGb3JjZWQgPSBmYWxzZTtcbn1cbmV4cG9ydHMuc3R5bGVNb2R1bGUgPSB7XG4gICAgcHJlOiBmb3JjZVJlZmxvdyxcbiAgICBjcmVhdGU6IHVwZGF0ZVN0eWxlLFxuICAgIHVwZGF0ZTogdXBkYXRlU3R5bGUsXG4gICAgZGVzdHJveTogYXBwbHlEZXN0cm95U3R5bGUsXG4gICAgcmVtb3ZlOiBhcHBseVJlbW92ZVN0eWxlXG59O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5zdHlsZU1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN0eWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcbnZhciBpcyA9IHJlcXVpcmUoXCIuL2lzXCIpO1xudmFyIGh0bWxkb21hcGlfMSA9IHJlcXVpcmUoXCIuL2h0bWxkb21hcGlcIik7XG5mdW5jdGlvbiBpc1VuZGVmKHMpIHsgcmV0dXJuIHMgPT09IHVuZGVmaW5lZDsgfVxuZnVuY3Rpb24gaXNEZWYocykgeyByZXR1cm4gcyAhPT0gdW5kZWZpbmVkOyB9XG52YXIgZW1wdHlOb2RlID0gdm5vZGVfMS5kZWZhdWx0KCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbmZ1bmN0aW9uIHNhbWVWbm9kZSh2bm9kZTEsIHZub2RlMikge1xuICAgIHJldHVybiB2bm9kZTEua2V5ID09PSB2bm9kZTIua2V5ICYmIHZub2RlMS5zZWwgPT09IHZub2RlMi5zZWw7XG59XG5mdW5jdGlvbiBpc1Zub2RlKHZub2RlKSB7XG4gICAgcmV0dXJuIHZub2RlLnNlbCAhPT0gdW5kZWZpbmVkO1xufVxuZnVuY3Rpb24gY3JlYXRlS2V5VG9PbGRJZHgoY2hpbGRyZW4sIGJlZ2luSWR4LCBlbmRJZHgpIHtcbiAgICB2YXIgaSwgbWFwID0ge30sIGtleSwgY2g7XG4gICAgZm9yIChpID0gYmVnaW5JZHg7IGkgPD0gZW5kSWR4OyArK2kpIHtcbiAgICAgICAgY2ggPSBjaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgIGtleSA9IGNoLmtleTtcbiAgICAgICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICBtYXBba2V5XSA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hcDtcbn1cbnZhciBob29rcyA9IFsnY3JlYXRlJywgJ3VwZGF0ZScsICdyZW1vdmUnLCAnZGVzdHJveScsICdwcmUnLCAncG9zdCddO1xudmFyIGhfMSA9IHJlcXVpcmUoXCIuL2hcIik7XG5leHBvcnRzLmggPSBoXzEuaDtcbnZhciB0aHVua18xID0gcmVxdWlyZShcIi4vdGh1bmtcIik7XG5leHBvcnRzLnRodW5rID0gdGh1bmtfMS50aHVuaztcbmZ1bmN0aW9uIGluaXQobW9kdWxlcywgZG9tQXBpKSB7XG4gICAgdmFyIGksIGosIGNicyA9IHt9O1xuICAgIHZhciBhcGkgPSBkb21BcGkgIT09IHVuZGVmaW5lZCA/IGRvbUFwaSA6IGh0bWxkb21hcGlfMS5kZWZhdWx0O1xuICAgIGZvciAoaSA9IDA7IGkgPCBob29rcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjYnNbaG9va3NbaV1dID0gW107XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBtb2R1bGVzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICB2YXIgaG9vayA9IG1vZHVsZXNbal1baG9va3NbaV1dO1xuICAgICAgICAgICAgaWYgKGhvb2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNic1tob29rc1tpXV0ucHVzaChob29rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBlbXB0eU5vZGVBdChlbG0pIHtcbiAgICAgICAgdmFyIGlkID0gZWxtLmlkID8gJyMnICsgZWxtLmlkIDogJyc7XG4gICAgICAgIHZhciBjID0gZWxtLmNsYXNzTmFtZSA/ICcuJyArIGVsbS5jbGFzc05hbWUuc3BsaXQoJyAnKS5qb2luKCcuJykgOiAnJztcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdChhcGkudGFnTmFtZShlbG0pLnRvTG93ZXJDYXNlKCkgKyBpZCArIGMsIHt9LCBbXSwgdW5kZWZpbmVkLCBlbG0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVSbUNiKGNoaWxkRWxtLCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHJtQ2IoKSB7XG4gICAgICAgICAgICBpZiAoLS1saXN0ZW5lcnMgPT09IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50XzEgPSBhcGkucGFyZW50Tm9kZShjaGlsZEVsbSk7XG4gICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudF8xLCBjaGlsZEVsbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsbSh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBpLCBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmluaXQpKSB7XG4gICAgICAgICAgICAgICAgaSh2bm9kZSk7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW4sIHNlbCA9IHZub2RlLnNlbDtcbiAgICAgICAgaWYgKHNlbCA9PT0gJyEnKSB7XG4gICAgICAgICAgICBpZiAoaXNVbmRlZih2bm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIHZub2RlLnRleHQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZub2RlLmVsbSA9IGFwaS5jcmVhdGVDb21tZW50KHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBQYXJzZSBzZWxlY3RvclxuICAgICAgICAgICAgdmFyIGhhc2hJZHggPSBzZWwuaW5kZXhPZignIycpO1xuICAgICAgICAgICAgdmFyIGRvdElkeCA9IHNlbC5pbmRleE9mKCcuJywgaGFzaElkeCk7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IGhhc2hJZHggPiAwID8gaGFzaElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgZG90ID0gZG90SWR4ID4gMCA/IGRvdElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgdGFnID0gaGFzaElkeCAhPT0gLTEgfHwgZG90SWR4ICE9PSAtMSA/IHNlbC5zbGljZSgwLCBNYXRoLm1pbihoYXNoLCBkb3QpKSA6IHNlbDtcbiAgICAgICAgICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBpc0RlZihkYXRhKSAmJiBpc0RlZihpID0gZGF0YS5ucykgPyBhcGkuY3JlYXRlRWxlbWVudE5TKGksIHRhZylcbiAgICAgICAgICAgICAgICA6IGFwaS5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgICAgICAgICBpZiAoaGFzaCA8IGRvdClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdpZCcsIHNlbC5zbGljZShoYXNoICsgMSwgZG90KSk7XG4gICAgICAgICAgICBpZiAoZG90SWR4ID4gMClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdjbGFzcycsIHNlbC5zbGljZShkb3QgKyAxKS5yZXBsYWNlKC9cXC4vZywgJyAnKSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLmNyZWF0ZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMuY3JlYXRlW2ldKGVtcHR5Tm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzLmFycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2ggPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5hcHBlbmRDaGlsZChlbG0sIGNyZWF0ZUVsbShjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IHZub2RlLmRhdGEuaG9vazsgLy8gUmV1c2UgdmFyaWFibGVcbiAgICAgICAgICAgIGlmIChpc0RlZihpKSkge1xuICAgICAgICAgICAgICAgIGlmIChpLmNyZWF0ZSlcbiAgICAgICAgICAgICAgICAgICAgaS5jcmVhdGUoZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKGkuaW5zZXJ0KVxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWUucHVzaCh2bm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2bm9kZS5lbG0gPSBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZub2RlLmVsbTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCB2bm9kZXMsIHN0YXJ0SWR4LCBlbmRJZHgsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICBmb3IgKDsgc3RhcnRJZHggPD0gZW5kSWR4OyArK3N0YXJ0SWR4KSB7XG4gICAgICAgICAgICB2YXIgY2ggPSB2bm9kZXNbc3RhcnRJZHhdO1xuICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKGNoLCBpbnNlcnRlZFZub2RlUXVldWUpLCBiZWZvcmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludm9rZURlc3Ryb3lIb29rKHZub2RlKSB7XG4gICAgICAgIHZhciBpLCBqLCBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmRlc3Ryb3kpKVxuICAgICAgICAgICAgICAgIGkodm5vZGUpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5kZXN0cm95Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgIGNicy5kZXN0cm95W2ldKHZub2RlKTtcbiAgICAgICAgICAgIGlmICh2bm9kZS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHZub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgIGkgPSB2bm9kZS5jaGlsZHJlbltqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT0gbnVsbCAmJiB0eXBlb2YgaSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4KSB7XG4gICAgICAgIGZvciAoOyBzdGFydElkeCA8PSBlbmRJZHg7ICsrc3RhcnRJZHgpIHtcbiAgICAgICAgICAgIHZhciBpXzEgPSB2b2lkIDAsIGxpc3RlbmVycyA9IHZvaWQgMCwgcm0gPSB2b2lkIDAsIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmKGNoLnNlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soY2gpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBjYnMucmVtb3ZlLmxlbmd0aCArIDE7XG4gICAgICAgICAgICAgICAgICAgIHJtID0gY3JlYXRlUm1DYihjaC5lbG0sIGxpc3RlbmVycyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaV8xID0gMDsgaV8xIDwgY2JzLnJlbW92ZS5sZW5ndGg7ICsraV8xKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2JzLnJlbW92ZVtpXzFdKGNoLCBybSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0RlZihpXzEgPSBjaC5kYXRhKSAmJiBpc0RlZihpXzEgPSBpXzEuaG9vaykgJiYgaXNEZWYoaV8xID0gaV8xLnJlbW92ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlfMShjaCwgcm0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudEVsbSwgY2guZWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlQ2hpbGRyZW4ocGFyZW50RWxtLCBvbGRDaCwgbmV3Q2gsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICB2YXIgb2xkU3RhcnRJZHggPSAwLCBuZXdTdGFydElkeCA9IDA7XG4gICAgICAgIHZhciBvbGRFbmRJZHggPSBvbGRDaC5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgb2xkU3RhcnRWbm9kZSA9IG9sZENoWzBdO1xuICAgICAgICB2YXIgb2xkRW5kVm5vZGUgPSBvbGRDaFtvbGRFbmRJZHhdO1xuICAgICAgICB2YXIgbmV3RW5kSWR4ID0gbmV3Q2gubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFswXTtcbiAgICAgICAgdmFyIG5ld0VuZFZub2RlID0gbmV3Q2hbbmV3RW5kSWR4XTtcbiAgICAgICAgdmFyIG9sZEtleVRvSWR4O1xuICAgICAgICB2YXIgaWR4SW5PbGQ7XG4gICAgICAgIHZhciBlbG1Ub01vdmU7XG4gICAgICAgIHZhciBiZWZvcmU7XG4gICAgICAgIHdoaWxlIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggJiYgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICAgICAgICBpZiAob2xkU3RhcnRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdOyAvLyBWbm9kZSBtaWdodCBoYXZlIGJlZW4gbW92ZWQgbGVmdFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob2xkRW5kVm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3U3RhcnRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3RW5kVm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld1N0YXJ0Vm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzYW1lVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtLCBhcGkubmV4dFNpYmxpbmcob2xkRW5kVm5vZGUuZWxtKSk7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZEVuZFZub2RlLmVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChvbGRLZXlUb0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9sZEtleVRvSWR4ID0gY3JlYXRlS2V5VG9PbGRJZHgob2xkQ2gsIG9sZFN0YXJ0SWR4LCBvbGRFbmRJZHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZHhJbk9sZCA9IG9sZEtleVRvSWR4W25ld1N0YXJ0Vm5vZGUua2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoaXNVbmRlZihpZHhJbk9sZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbVRvTW92ZSA9IG9sZENoW2lkeEluT2xkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsbVRvTW92ZS5zZWwgIT09IG5ld1N0YXJ0Vm5vZGUuc2VsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSksIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUoZWxtVG9Nb3ZlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkQ2hbaWR4SW5PbGRdID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGVsbVRvTW92ZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggfHwgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICAgICAgICBpZiAob2xkU3RhcnRJZHggPiBvbGRFbmRJZHgpIHtcbiAgICAgICAgICAgICAgICBiZWZvcmUgPSBuZXdDaFtuZXdFbmRJZHggKyAxXSA9PSBudWxsID8gbnVsbCA6IG5ld0NoW25ld0VuZElkeCArIDFdLmVsbTtcbiAgICAgICAgICAgICAgICBhZGRWbm9kZXMocGFyZW50RWxtLCBiZWZvcmUsIG5ld0NoLCBuZXdTdGFydElkeCwgbmV3RW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgb2xkQ2gsIG9sZFN0YXJ0SWR4LCBvbGRFbmRJZHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBhdGNoVm5vZGUob2xkVm5vZGUsIHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICAgICAgdmFyIGksIGhvb2s7XG4gICAgICAgIGlmIChpc0RlZihpID0gdm5vZGUuZGF0YSkgJiYgaXNEZWYoaG9vayA9IGkuaG9vaykgJiYgaXNEZWYoaSA9IGhvb2sucHJlcGF0Y2gpKSB7XG4gICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVsbSA9IHZub2RlLmVsbSA9IG9sZFZub2RlLmVsbTtcbiAgICAgICAgdmFyIG9sZENoID0gb2xkVm5vZGUuY2hpbGRyZW47XG4gICAgICAgIHZhciBjaCA9IHZub2RlLmNoaWxkcmVuO1xuICAgICAgICBpZiAob2xkVm5vZGUgPT09IHZub2RlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAodm5vZGUuZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnVwZGF0ZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMudXBkYXRlW2ldKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgICAgICBpID0gdm5vZGUuZGF0YS5ob29rO1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkpICYmIGlzRGVmKGkgPSBpLnVwZGF0ZSkpXG4gICAgICAgICAgICAgICAgaShvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1VuZGVmKHZub2RlLnRleHQpKSB7XG4gICAgICAgICAgICBpZiAoaXNEZWYob2xkQ2gpICYmIGlzRGVmKGNoKSkge1xuICAgICAgICAgICAgICAgIGlmIChvbGRDaCAhPT0gY2gpXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUNoaWxkcmVuKGVsbSwgb2xkQ2gsIGNoLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYoY2gpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmKG9sZFZub2RlLnRleHQpKVxuICAgICAgICAgICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICAgICAgICAgICAgYWRkVm5vZGVzKGVsbSwgbnVsbCwgY2gsIDAsIGNoLmxlbmd0aCAtIDEsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0RlZihvbGRDaCkpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVWbm9kZXMoZWxtLCBvbGRDaCwgMCwgb2xkQ2gubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0RlZihvbGRWbm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIGFwaS5zZXRUZXh0Q29udGVudChlbG0sICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvbGRWbm9kZS50ZXh0ICE9PSB2bm9kZS50ZXh0KSB7XG4gICAgICAgICAgICBpZiAoaXNEZWYob2xkQ2gpKSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKGVsbSwgb2xkQ2gsIDAsIG9sZENoLmxlbmd0aCAtIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXBpLnNldFRleHRDb250ZW50KGVsbSwgdm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRGVmKGhvb2spICYmIGlzRGVmKGkgPSBob29rLnBvc3RwYXRjaCkpIHtcbiAgICAgICAgICAgIGkob2xkVm5vZGUsIHZub2RlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gcGF0Y2gob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgICAgIHZhciBpLCBlbG0sIHBhcmVudDtcbiAgICAgICAgdmFyIGluc2VydGVkVm5vZGVRdWV1ZSA9IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnByZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgIGNicy5wcmVbaV0oKTtcbiAgICAgICAgaWYgKCFpc1Zub2RlKG9sZFZub2RlKSkge1xuICAgICAgICAgICAgb2xkVm5vZGUgPSBlbXB0eU5vZGVBdChvbGRWbm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNhbWVWbm9kZShvbGRWbm9kZSwgdm5vZGUpKSB7XG4gICAgICAgICAgICBwYXRjaFZub2RlKG9sZFZub2RlLCB2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGVsbSA9IG9sZFZub2RlLmVsbTtcbiAgICAgICAgICAgIHBhcmVudCA9IGFwaS5wYXJlbnROb2RlKGVsbSk7XG4gICAgICAgICAgICBjcmVhdGVFbG0odm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICBpZiAocGFyZW50ICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnQsIHZub2RlLmVsbSwgYXBpLm5leHRTaWJsaW5nKGVsbSkpO1xuICAgICAgICAgICAgICAgIHJlbW92ZVZub2RlcyhwYXJlbnQsIFtvbGRWbm9kZV0sIDAsIDApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBpbnNlcnRlZFZub2RlUXVldWUubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGluc2VydGVkVm5vZGVRdWV1ZVtpXS5kYXRhLmhvb2suaW5zZXJ0KGluc2VydGVkVm5vZGVRdWV1ZVtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5wb3N0Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgY2JzLnBvc3RbaV0oKTtcbiAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgIH07XG59XG5leHBvcnRzLmluaXQgPSBpbml0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9c25hYmJkb20uanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgaF8xID0gcmVxdWlyZShcIi4vaFwiKTtcbmZ1bmN0aW9uIGNvcHlUb1RodW5rKHZub2RlLCB0aHVuaykge1xuICAgIHRodW5rLmVsbSA9IHZub2RlLmVsbTtcbiAgICB2bm9kZS5kYXRhLmZuID0gdGh1bmsuZGF0YS5mbjtcbiAgICB2bm9kZS5kYXRhLmFyZ3MgPSB0aHVuay5kYXRhLmFyZ3M7XG4gICAgdGh1bmsuZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgdGh1bmsuY2hpbGRyZW4gPSB2bm9kZS5jaGlsZHJlbjtcbiAgICB0aHVuay50ZXh0ID0gdm5vZGUudGV4dDtcbiAgICB0aHVuay5lbG0gPSB2bm9kZS5lbG07XG59XG5mdW5jdGlvbiBpbml0KHRodW5rKSB7XG4gICAgdmFyIGN1ciA9IHRodW5rLmRhdGE7XG4gICAgdmFyIHZub2RlID0gY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgY3VyLmFyZ3MpO1xuICAgIGNvcHlUb1RodW5rKHZub2RlLCB0aHVuayk7XG59XG5mdW5jdGlvbiBwcmVwYXRjaChvbGRWbm9kZSwgdGh1bmspIHtcbiAgICB2YXIgaSwgb2xkID0gb2xkVm5vZGUuZGF0YSwgY3VyID0gdGh1bmsuZGF0YTtcbiAgICB2YXIgb2xkQXJncyA9IG9sZC5hcmdzLCBhcmdzID0gY3VyLmFyZ3M7XG4gICAgaWYgKG9sZC5mbiAhPT0gY3VyLmZuIHx8IG9sZEFyZ3MubGVuZ3RoICE9PSBhcmdzLmxlbmd0aCkge1xuICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmspO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChvbGRBcmdzW2ldICE9PSBhcmdzW2ldKSB7XG4gICAgICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmspO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvcHlUb1RodW5rKG9sZFZub2RlLCB0aHVuayk7XG59XG5leHBvcnRzLnRodW5rID0gZnVuY3Rpb24gdGh1bmsoc2VsLCBrZXksIGZuLCBhcmdzKSB7XG4gICAgaWYgKGFyZ3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhcmdzID0gZm47XG4gICAgICAgIGZuID0ga2V5O1xuICAgICAgICBrZXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBoXzEuaChzZWwsIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIGhvb2s6IHsgaW5pdDogaW5pdCwgcHJlcGF0Y2g6IHByZXBhdGNoIH0sXG4gICAgICAgIGZuOiBmbixcbiAgICAgICAgYXJnczogYXJnc1xuICAgIH0pO1xufTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMudGh1bms7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10aHVuay5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcIi4vdm5vZGVcIik7XG52YXIgaHRtbGRvbWFwaV8xID0gcmVxdWlyZShcIi4vaHRtbGRvbWFwaVwiKTtcbmZ1bmN0aW9uIHRvVk5vZGUobm9kZSwgZG9tQXBpKSB7XG4gICAgdmFyIGFwaSA9IGRvbUFwaSAhPT0gdW5kZWZpbmVkID8gZG9tQXBpIDogaHRtbGRvbWFwaV8xLmRlZmF1bHQ7XG4gICAgdmFyIHRleHQ7XG4gICAgaWYgKGFwaS5pc0VsZW1lbnQobm9kZSkpIHtcbiAgICAgICAgdmFyIGlkID0gbm9kZS5pZCA/ICcjJyArIG5vZGUuaWQgOiAnJztcbiAgICAgICAgdmFyIGNuID0gbm9kZS5nZXRBdHRyaWJ1dGUoJ2NsYXNzJyk7XG4gICAgICAgIHZhciBjID0gY24gPyAnLicgKyBjbi5zcGxpdCgnICcpLmpvaW4oJy4nKSA6ICcnO1xuICAgICAgICB2YXIgc2VsID0gYXBpLnRhZ05hbWUobm9kZSkudG9Mb3dlckNhc2UoKSArIGlkICsgYztcbiAgICAgICAgdmFyIGF0dHJzID0ge307XG4gICAgICAgIHZhciBjaGlsZHJlbiA9IFtdO1xuICAgICAgICB2YXIgbmFtZV8xO1xuICAgICAgICB2YXIgaSA9IHZvaWQgMCwgbiA9IHZvaWQgMDtcbiAgICAgICAgdmFyIGVsbUF0dHJzID0gbm9kZS5hdHRyaWJ1dGVzO1xuICAgICAgICB2YXIgZWxtQ2hpbGRyZW4gPSBub2RlLmNoaWxkTm9kZXM7XG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBlbG1BdHRycy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIG5hbWVfMSA9IGVsbUF0dHJzW2ldLm5vZGVOYW1lO1xuICAgICAgICAgICAgaWYgKG5hbWVfMSAhPT0gJ2lkJyAmJiBuYW1lXzEgIT09ICdjbGFzcycpIHtcbiAgICAgICAgICAgICAgICBhdHRyc1tuYW1lXzFdID0gZWxtQXR0cnNbaV0ubm9kZVZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDAsIG4gPSBlbG1DaGlsZHJlbi5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGNoaWxkcmVuLnB1c2godG9WTm9kZShlbG1DaGlsZHJlbltpXSwgZG9tQXBpKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdChzZWwsIHsgYXR0cnM6IGF0dHJzIH0sIGNoaWxkcmVuLCB1bmRlZmluZWQsIG5vZGUpO1xuICAgIH1cbiAgICBlbHNlIGlmIChhcGkuaXNUZXh0KG5vZGUpKSB7XG4gICAgICAgIHRleHQgPSBhcGkuZ2V0VGV4dENvbnRlbnQobm9kZSk7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQodW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdGV4dCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGFwaS5pc0NvbW1lbnQobm9kZSkpIHtcbiAgICAgICAgdGV4dCA9IGFwaS5nZXRUZXh0Q29udGVudChub2RlKTtcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdCgnIScsIHt9LCBbXSwgdGV4dCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgbm9kZSk7XG4gICAgfVxufVxuZXhwb3J0cy50b1ZOb2RlID0gdG9WTm9kZTtcbmV4cG9ydHMuZGVmYXVsdCA9IHRvVk5vZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD10b3Zub2RlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gdm5vZGUoc2VsLCBkYXRhLCBjaGlsZHJlbiwgdGV4dCwgZWxtKSB7XG4gICAgdmFyIGtleSA9IGRhdGEgPT09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6IGRhdGEua2V5O1xuICAgIHJldHVybiB7IHNlbDogc2VsLCBkYXRhOiBkYXRhLCBjaGlsZHJlbjogY2hpbGRyZW4sXG4gICAgICAgIHRleHQ6IHRleHQsIGVsbTogZWxtLCBrZXk6IGtleSB9O1xufVxuZXhwb3J0cy52bm9kZSA9IHZub2RlO1xuZXhwb3J0cy5kZWZhdWx0ID0gdm5vZGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD12bm9kZS5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfcG9ueWZpbGwgPSByZXF1aXJlKCcuL3BvbnlmaWxsLmpzJyk7XG5cbnZhciBfcG9ueWZpbGwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcG9ueWZpbGwpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciByb290OyAvKiBnbG9iYWwgd2luZG93ICovXG5cblxuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gc2VsZjtcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IG1vZHVsZTtcbn0gZWxzZSB7XG4gIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxuXG52YXIgcmVzdWx0ID0gKDAsIF9wb255ZmlsbDJbJ2RlZmF1bHQnXSkocm9vdCk7XG5leHBvcnRzWydkZWZhdWx0J10gPSByZXN1bHQ7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1snZGVmYXVsdCddID0gc3ltYm9sT2JzZXJ2YWJsZVBvbnlmaWxsO1xuZnVuY3Rpb24gc3ltYm9sT2JzZXJ2YWJsZVBvbnlmaWxsKHJvb3QpIHtcblx0dmFyIHJlc3VsdDtcblx0dmFyIF9TeW1ib2wgPSByb290LlN5bWJvbDtcblxuXHRpZiAodHlwZW9mIF9TeW1ib2wgPT09ICdmdW5jdGlvbicpIHtcblx0XHRpZiAoX1N5bWJvbC5vYnNlcnZhYmxlKSB7XG5cdFx0XHRyZXN1bHQgPSBfU3ltYm9sLm9ic2VydmFibGU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2woJ29ic2VydmFibGUnKTtcblx0XHRcdF9TeW1ib2wub2JzZXJ2YWJsZSA9IHJlc3VsdDtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmVzdWx0ID0gJ0BAb2JzZXJ2YWJsZSc7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCJ2YXIgbmV4dFRpY2sgPSByZXF1aXJlKCdwcm9jZXNzL2Jyb3dzZXIuanMnKS5uZXh0VGljaztcbnZhciBhcHBseSA9IEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseTtcbnZhciBzbGljZSA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbnZhciBpbW1lZGlhdGVJZHMgPSB7fTtcbnZhciBuZXh0SW1tZWRpYXRlSWQgPSAwO1xuXG4vLyBET00gQVBJcywgZm9yIGNvbXBsZXRlbmVzc1xuXG5leHBvcnRzLnNldFRpbWVvdXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0VGltZW91dCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhclRpbWVvdXQpO1xufTtcbmV4cG9ydHMuc2V0SW50ZXJ2YWwgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBUaW1lb3V0KGFwcGx5LmNhbGwoc2V0SW50ZXJ2YWwsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJJbnRlcnZhbCk7XG59O1xuZXhwb3J0cy5jbGVhclRpbWVvdXQgPVxuZXhwb3J0cy5jbGVhckludGVydmFsID0gZnVuY3Rpb24odGltZW91dCkgeyB0aW1lb3V0LmNsb3NlKCk7IH07XG5cbmZ1bmN0aW9uIFRpbWVvdXQoaWQsIGNsZWFyRm4pIHtcbiAgdGhpcy5faWQgPSBpZDtcbiAgdGhpcy5fY2xlYXJGbiA9IGNsZWFyRm47XG59XG5UaW1lb3V0LnByb3RvdHlwZS51bnJlZiA9IFRpbWVvdXQucHJvdG90eXBlLnJlZiA9IGZ1bmN0aW9uKCkge307XG5UaW1lb3V0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLl9jbGVhckZuLmNhbGwod2luZG93LCB0aGlzLl9pZCk7XG59O1xuXG4vLyBEb2VzIG5vdCBzdGFydCB0aGUgdGltZSwganVzdCBzZXRzIHVwIHRoZSBtZW1iZXJzIG5lZWRlZC5cbmV4cG9ydHMuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSwgbXNlY3MpIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IG1zZWNzO1xufTtcblxuZXhwb3J0cy51bmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuICBpdGVtLl9pZGxlVGltZW91dCA9IC0xO1xufTtcblxuZXhwb3J0cy5fdW5yZWZBY3RpdmUgPSBleHBvcnRzLmFjdGl2ZSA9IGZ1bmN0aW9uKGl0ZW0pIHtcbiAgY2xlYXJUaW1lb3V0KGl0ZW0uX2lkbGVUaW1lb3V0SWQpO1xuXG4gIHZhciBtc2VjcyA9IGl0ZW0uX2lkbGVUaW1lb3V0O1xuICBpZiAobXNlY3MgPj0gMCkge1xuICAgIGl0ZW0uX2lkbGVUaW1lb3V0SWQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uIG9uVGltZW91dCgpIHtcbiAgICAgIGlmIChpdGVtLl9vblRpbWVvdXQpXG4gICAgICAgIGl0ZW0uX29uVGltZW91dCgpO1xuICAgIH0sIG1zZWNzKTtcbiAgfVxufTtcblxuLy8gVGhhdCdzIG5vdCBob3cgbm9kZS5qcyBpbXBsZW1lbnRzIGl0IGJ1dCB0aGUgZXhwb3NlZCBhcGkgaXMgdGhlIHNhbWUuXG5leHBvcnRzLnNldEltbWVkaWF0ZSA9IHR5cGVvZiBzZXRJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IHNldEltbWVkaWF0ZSA6IGZ1bmN0aW9uKGZuKSB7XG4gIHZhciBpZCA9IG5leHRJbW1lZGlhdGVJZCsrO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cy5sZW5ndGggPCAyID8gZmFsc2UgOiBzbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgaW1tZWRpYXRlSWRzW2lkXSA9IHRydWU7XG5cbiAgbmV4dFRpY2soZnVuY3Rpb24gb25OZXh0VGljaygpIHtcbiAgICBpZiAoaW1tZWRpYXRlSWRzW2lkXSkge1xuICAgICAgLy8gZm4uY2FsbCgpIGlzIGZhc3RlciBzbyB3ZSBvcHRpbWl6ZSBmb3IgdGhlIGNvbW1vbiB1c2UtY2FzZVxuICAgICAgLy8gQHNlZSBodHRwOi8vanNwZXJmLmNvbS9jYWxsLWFwcGx5LXNlZ3VcbiAgICAgIGlmIChhcmdzKSB7XG4gICAgICAgIGZuLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZm4uY2FsbChudWxsKTtcbiAgICAgIH1cbiAgICAgIC8vIFByZXZlbnQgaWRzIGZyb20gbGVha2luZ1xuICAgICAgZXhwb3J0cy5jbGVhckltbWVkaWF0ZShpZCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gaWQ7XG59O1xuXG5leHBvcnRzLmNsZWFySW1tZWRpYXRlID0gdHlwZW9mIGNsZWFySW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBjbGVhckltbWVkaWF0ZSA6IGZ1bmN0aW9uKGlkKSB7XG4gIGRlbGV0ZSBpbW1lZGlhdGVJZHNbaWRdO1xufTsiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIF9fZXhwb3J0KG0pIHtcbiAgICBmb3IgKHZhciBwIGluIG0pIGlmICghZXhwb3J0cy5oYXNPd25Qcm9wZXJ0eShwKSkgZXhwb3J0c1twXSA9IG1bcF07XG59XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5fX2V4cG9ydChyZXF1aXJlKFwiLi9zZWxlY3RvclBhcnNlclwiKSk7XG52YXIgbWF0Y2hlc18xID0gcmVxdWlyZShcIi4vbWF0Y2hlc1wiKTtcbmV4cG9ydHMuY3JlYXRlTWF0Y2hlcyA9IG1hdGNoZXNfMS5jcmVhdGVNYXRjaGVzO1xudmFyIHF1ZXJ5U2VsZWN0b3JfMSA9IHJlcXVpcmUoXCIuL3F1ZXJ5U2VsZWN0b3JcIik7XG5leHBvcnRzLmNyZWF0ZVF1ZXJ5U2VsZWN0b3IgPSBxdWVyeVNlbGVjdG9yXzEuY3JlYXRlUXVlcnlTZWxlY3Rvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHNlbGVjdG9yUGFyc2VyXzEgPSByZXF1aXJlKFwiLi9zZWxlY3RvclBhcnNlclwiKTtcbmZ1bmN0aW9uIGNyZWF0ZU1hdGNoZXMob3B0cykge1xuICAgIHJldHVybiBmdW5jdGlvbiBtYXRjaGVzKHNlbGVjdG9yLCBub2RlKSB7XG4gICAgICAgIHZhciBfYSA9IHR5cGVvZiBzZWxlY3RvciA9PT0gJ29iamVjdCcgPyBzZWxlY3RvciA6IHNlbGVjdG9yUGFyc2VyXzEucGFyc2VTZWxlY3RvcihzZWxlY3RvciksIHRhZyA9IF9hLnRhZywgaWQgPSBfYS5pZCwgY2xhc3NMaXN0ID0gX2EuY2xhc3NMaXN0LCBhdHRyaWJ1dGVzID0gX2EuYXR0cmlidXRlcywgbmV4dFNlbGVjdG9yID0gX2EubmV4dFNlbGVjdG9yLCBwc2V1ZG9zID0gX2EucHNldWRvcztcbiAgICAgICAgaWYgKG5leHRTZWxlY3RvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ21hdGNoZXMgY2FuIG9ubHkgcHJvY2VzcyBzZWxlY3RvcnMgdGhhdCB0YXJnZXQgYSBzaW5nbGUgZWxlbWVudCcpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghbm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0YWcgJiYgdGFnLnRvTG93ZXJDYXNlKCkgIT09IG9wdHMudGFnKG5vZGUpLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaWQgJiYgaWQgIT09IG9wdHMuaWQobm9kZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2xhc3NlcyA9IG9wdHMuY2xhc3NOYW1lKG5vZGUpLnNwbGl0KCcgJyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2xhc3NMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoY2xhc3Nlcy5pbmRleE9mKGNsYXNzTGlzdFtpXSkgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgICAgICAgICB2YXIgYXR0ciA9IG9wdHMuYXR0cihub2RlLCBrZXkpO1xuICAgICAgICAgICAgdmFyIHQgPSBhdHRyaWJ1dGVzW2tleV1bMF07XG4gICAgICAgICAgICB2YXIgdiA9IGF0dHJpYnV0ZXNba2V5XVsxXTtcbiAgICAgICAgICAgIGlmIChhdHRyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodCA9PT0gJ2hhcycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ID09PSAnZXhhY3QnICYmIGF0dHIgIT09IHYpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0ICE9PSAnZXhhY3QnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2ICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FsbCBub24tc3RyaW5nIHZhbHVlcyBoYXZlIHRvIGJlIGFuIGV4YWN0IG1hdGNoJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnc3RhcnRzV2l0aCcgJiYgIWF0dHIuc3RhcnRzV2l0aCh2KSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnZW5kc1dpdGgnICYmICFhdHRyLmVuZHNXaXRoKHYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdjb250YWlucycgJiYgYXR0ci5pbmRleE9mKHYpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnd2hpdGVzcGFjZScgJiYgYXR0ci5zcGxpdCgnICcpLmluZGV4T2YodikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdkYXNoJyAmJiBhdHRyLnNwbGl0KCctJykuaW5kZXhPZih2KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBzZXVkb3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBfYiA9IHBzZXVkb3NbaV0sIHQgPSBfYlswXSwgZGF0YSA9IF9iWzFdO1xuICAgICAgICAgICAgaWYgKHQgPT09ICdjb250YWlucycgJiYgZGF0YSAhPT0gb3B0cy5jb250ZW50cyhub2RlKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ID09PSAnZW1wdHknICYmXG4gICAgICAgICAgICAgICAgKG9wdHMuY29udGVudHMobm9kZSkgfHwgb3B0cy5jaGlsZHJlbihub2RlKS5sZW5ndGggIT09IDApKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQgPT09ICdyb290JyAmJiBvcHRzLnBhcmVudChub2RlKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQuaW5kZXhPZignY2hpbGQnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdHMucGFyZW50KG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHNpYmxpbmdzID0gb3B0cy5jaGlsZHJlbihvcHRzLnBhcmVudChub2RlKSk7XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdmaXJzdC1jaGlsZCcgJiYgc2libGluZ3MuaW5kZXhPZihub2RlKSAhPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnbGFzdC1jaGlsZCcgJiZcbiAgICAgICAgICAgICAgICAgICAgc2libGluZ3MuaW5kZXhPZihub2RlKSAhPT0gc2libGluZ3MubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh0ID09PSAnbnRoLWNoaWxkJykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcmVnZXggPSAvKFtcXCstXT8pKFxcZCopKG4/KShcXCtcXGQrKT8vO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyc2VSZXN1bHQgPSByZWdleC5leGVjKGRhdGEpLnNsaWNlKDEpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBzaWJsaW5ncy5pbmRleE9mKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXBhcnNlUmVzdWx0WzBdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVJlc3VsdFswXSA9ICcrJztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgZmFjdG9yID0gcGFyc2VSZXN1bHRbMV1cbiAgICAgICAgICAgICAgICAgICAgICAgID8gcGFyc2VJbnQocGFyc2VSZXN1bHRbMF0gKyBwYXJzZVJlc3VsdFsxXSlcbiAgICAgICAgICAgICAgICAgICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWRkID0gcGFyc2VJbnQocGFyc2VSZXN1bHRbM10gfHwgJzAnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZhY3RvciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VSZXN1bHRbMl0gPT09ICduJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggJSBmYWN0b3IgIT09IGFkZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFmYWN0b3IgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUmVzdWx0WzJdICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoKHBhcnNlUmVzdWx0WzBdID09PSAnKycgJiYgaW5kZXggLSBhZGQgPCAwKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXJzZVJlc3VsdFswXSA9PT0gJy0nICYmIGluZGV4IC0gYWRkID49IDApKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFwYXJzZVJlc3VsdFsyXSAmJiBmYWN0b3IgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4ICE9PSBmYWN0b3IgLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbn1cbmV4cG9ydHMuY3JlYXRlTWF0Y2hlcyA9IGNyZWF0ZU1hdGNoZXM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tYXRjaGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHNlbGVjdG9yUGFyc2VyXzEgPSByZXF1aXJlKFwiLi9zZWxlY3RvclBhcnNlclwiKTtcbnZhciBtYXRjaGVzXzEgPSByZXF1aXJlKFwiLi9tYXRjaGVzXCIpO1xuZnVuY3Rpb24gY3JlYXRlUXVlcnlTZWxlY3RvcihvcHRpb25zLCBtYXRjaGVzKSB7XG4gICAgdmFyIF9tYXRjaGVzID0gbWF0Y2hlcyB8fCBtYXRjaGVzXzEuY3JlYXRlTWF0Y2hlcyhvcHRpb25zKTtcbiAgICBmdW5jdGlvbiBmaW5kU3VidHJlZShzZWxlY3RvciwgZGVwdGgsIG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG4gPSBfbWF0Y2hlcyhzZWxlY3Rvciwgbm9kZSk7XG4gICAgICAgIHZhciBtYXRjaGVkID0gbiA/ICh0eXBlb2YgbiA9PT0gJ29iamVjdCcgPyBbbl0gOiBbbm9kZV0pIDogW107XG4gICAgICAgIGlmIChkZXB0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG1hdGNoZWQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoaWxkTWF0Y2hlZCA9IG9wdGlvbnNcbiAgICAgICAgICAgIC5jaGlsZHJlbihub2RlKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYykgeyByZXR1cm4gdHlwZW9mIGMgIT09ICdzdHJpbmcnOyB9KVxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoYykgeyByZXR1cm4gZmluZFN1YnRyZWUoc2VsZWN0b3IsIGRlcHRoIC0gMSwgYyk7IH0pXG4gICAgICAgICAgICAucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGN1cnIpIHsgcmV0dXJuIGFjYy5jb25jYXQoY3Vycik7IH0sIFtdKTtcbiAgICAgICAgcmV0dXJuIG1hdGNoZWQuY29uY2F0KGNoaWxkTWF0Y2hlZCk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGZpbmRTaWJsaW5nKHNlbGVjdG9yLCBuZXh0LCBub2RlKSB7XG4gICAgICAgIGlmICghbm9kZSB8fCBvcHRpb25zLnBhcmVudChub2RlKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgdmFyIHNpYmxpbmdzID0gb3B0aW9ucy5jaGlsZHJlbihvcHRpb25zLnBhcmVudChub2RlKSk7XG4gICAgICAgIGZvciAodmFyIGkgPSBzaWJsaW5ncy5pbmRleE9mKG5vZGUpICsgMTsgaSA8IHNpYmxpbmdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHNpYmxpbmdzW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG4gPSBfbWF0Y2hlcyhzZWxlY3Rvciwgc2libGluZ3NbaV0pO1xuICAgICAgICAgICAgaWYgKG4pIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG4gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChzaWJsaW5nc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG5leHQpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IsIG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHNlbCA9IHR5cGVvZiBzZWxlY3RvciA9PT0gJ29iamVjdCcgPyBzZWxlY3RvciA6IHNlbGVjdG9yUGFyc2VyXzEucGFyc2VTZWxlY3RvcihzZWxlY3Rvcik7XG4gICAgICAgIHZhciByZXN1bHRzID0gW25vZGVdO1xuICAgICAgICB2YXIgY3VycmVudFNlbGVjdG9yID0gc2VsO1xuICAgICAgICB2YXIgY3VycmVudENvbWJpbmF0b3IgPSAnc3VidHJlZSc7XG4gICAgICAgIHZhciB0YWlsID0gdW5kZWZpbmVkO1xuICAgICAgICB2YXIgX2xvb3BfMSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRhaWwgPSBjdXJyZW50U2VsZWN0b3IubmV4dFNlbGVjdG9yO1xuICAgICAgICAgICAgY3VycmVudFNlbGVjdG9yLm5leHRTZWxlY3RvciA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Q29tYmluYXRvciA9PT0gJ3N1YnRyZWUnIHx8XG4gICAgICAgICAgICAgICAgY3VycmVudENvbWJpbmF0b3IgPT09ICdjaGlsZCcpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVwdGhfMSA9IGN1cnJlbnRDb21iaW5hdG9yID09PSAnc3VidHJlZScgPyBJbmZpbml0eSA6IDE7XG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobikgeyByZXR1cm4gZmluZFN1YnRyZWUoY3VycmVudFNlbGVjdG9yLCBkZXB0aF8xLCBuKTsgfSlcbiAgICAgICAgICAgICAgICAgICAgLnJlZHVjZShmdW5jdGlvbiAoYWNjLCBjdXJyKSB7IHJldHVybiBhY2MuY29uY2F0KGN1cnIpOyB9LCBbXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dF8xID0gY3VycmVudENvbWJpbmF0b3IgPT09ICduZXh0U2libGluZyc7XG4gICAgICAgICAgICAgICAgcmVzdWx0cyA9IHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAobikgeyByZXR1cm4gZmluZFNpYmxpbmcoY3VycmVudFNlbGVjdG9yLCBuZXh0XzEsIG4pOyB9KVxuICAgICAgICAgICAgICAgICAgICAucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGN1cnIpIHsgcmV0dXJuIGFjYy5jb25jYXQoY3Vycik7IH0sIFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0YWlsKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFNlbGVjdG9yID0gdGFpbFsxXTtcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29tYmluYXRvciA9IHRhaWxbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIF9sb29wXzEoKTtcbiAgICAgICAgfSB3aGlsZSAodGFpbCAhPT0gdW5kZWZpbmVkKTtcbiAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgfTtcbn1cbmV4cG9ydHMuY3JlYXRlUXVlcnlTZWxlY3RvciA9IGNyZWF0ZVF1ZXJ5U2VsZWN0b3I7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1xdWVyeVNlbGVjdG9yLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgSURFTlQgPSAnW1xcXFx3LV0rJztcbnZhciBTUEFDRSA9ICdbIFxcdF0qJztcbnZhciBWQUxVRSA9IFwiW15cXFxcXV0rXCI7XG52YXIgQ0xBU1MgPSBcIig/OlxcXFwuXCIgKyBJREVOVCArIFwiKVwiO1xudmFyIElEID0gXCIoPzojXCIgKyBJREVOVCArIFwiKVwiO1xudmFyIE9QID0gXCIoPzo9fFxcXFwkPXxcXFxcXj18XFxcXCo9fH49fFxcXFx8PSlcIjtcbnZhciBBVFRSID0gXCIoPzpcXFxcW1wiICsgU1BBQ0UgKyBJREVOVCArIFNQQUNFICsgXCIoPzpcIiArIE9QICsgU1BBQ0UgKyBWQUxVRSArIFNQQUNFICsgXCIpP1xcXFxdKVwiO1xudmFyIFNVQlRSRUUgPSBcIig/OlsgXFx0XSspXCI7XG52YXIgQ0hJTEQgPSBcIig/OlwiICsgU1BBQ0UgKyBcIig+KVwiICsgU1BBQ0UgKyBcIilcIjtcbnZhciBORVhUX1NJQkxJTkcgPSBcIig/OlwiICsgU1BBQ0UgKyBcIihcXFxcKylcIiArIFNQQUNFICsgXCIpXCI7XG52YXIgU0lCTElORyA9IFwiKD86XCIgKyBTUEFDRSArIFwiKH4pXCIgKyBTUEFDRSArIFwiKVwiO1xudmFyIENPTUJJTkFUT1IgPSBcIig/OlwiICsgU1VCVFJFRSArIFwifFwiICsgQ0hJTEQgKyBcInxcIiArIE5FWFRfU0lCTElORyArIFwifFwiICsgU0lCTElORyArIFwiKVwiO1xudmFyIENPTlRBSU5TID0gXCJjb250YWluc1xcXFwoXFxcIlteXFxcIl0qXFxcIlxcXFwpXCI7XG52YXIgRk9STVVMQSA9IFwiKD86ZXZlbnxvZGR8XFxcXGQqKD86LT9uKD86XFxcXCtcXFxcZCspPyk/KVwiO1xudmFyIE5USF9DSElMRCA9IFwibnRoLWNoaWxkXFxcXChcIiArIEZPUk1VTEEgKyBcIlxcXFwpXCI7XG52YXIgUFNFVURPID0gXCI6KD86Zmlyc3QtY2hpbGR8bGFzdC1jaGlsZHxcIiArIE5USF9DSElMRCArIFwifGVtcHR5fHJvb3R8XCIgKyBDT05UQUlOUyArIFwiKVwiO1xudmFyIFRBRyA9IFwiKDo/XCIgKyBJREVOVCArIFwiKT9cIjtcbnZhciBUT0tFTlMgPSBDTEFTUyArIFwifFwiICsgSUQgKyBcInxcIiArIEFUVFIgKyBcInxcIiArIFBTRVVETyArIFwifFwiICsgQ09NQklOQVRPUjtcbnZhciBjb21iaW5hdG9yUmVnZXggPSBuZXcgUmVnRXhwKFwiXlwiICsgQ09NQklOQVRPUiArIFwiJFwiKTtcbi8qKlxuICogUGFyc2VzIGEgY3NzIHNlbGVjdG9yIGludG8gYSBub3JtYWxpemVkIG9iamVjdC5cbiAqIEV4cGVjdHMgYSBzZWxlY3RvciBmb3IgYSBzaW5nbGUgZWxlbWVudCBvbmx5LCBubyBgPmAgb3IgdGhlIGxpa2UhXG4gKi9cbmZ1bmN0aW9uIHBhcnNlU2VsZWN0b3Ioc2VsZWN0b3IpIHtcbiAgICB2YXIgc2VsID0gc2VsZWN0b3IudHJpbSgpO1xuICAgIHZhciB0YWdSZWdleCA9IG5ldyBSZWdFeHAoVEFHLCAneScpO1xuICAgIHZhciB0YWcgPSB0YWdSZWdleC5leGVjKHNlbClbMF07XG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChUT0tFTlMsICd5Jyk7XG4gICAgcmVnZXgubGFzdEluZGV4ID0gdGFnUmVnZXgubGFzdEluZGV4O1xuICAgIHZhciBtYXRjaGVzID0gW107XG4gICAgdmFyIG5leHRTZWxlY3RvciA9IHVuZGVmaW5lZDtcbiAgICB2YXIgbGFzdENvbWJpbmF0b3IgPSB1bmRlZmluZWQ7XG4gICAgdmFyIGluZGV4ID0gLTE7XG4gICAgd2hpbGUgKHJlZ2V4Lmxhc3RJbmRleCA8IHNlbC5sZW5ndGgpIHtcbiAgICAgICAgdmFyIG1hdGNoID0gcmVnZXguZXhlYyhzZWwpO1xuICAgICAgICBpZiAoIW1hdGNoICYmIGxhc3RDb21iaW5hdG9yID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGFyc2UgZXJyb3IsIGludmFsaWQgc2VsZWN0b3InKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChtYXRjaCAmJiBjb21iaW5hdG9yUmVnZXgudGVzdChtYXRjaFswXSkpIHtcbiAgICAgICAgICAgIHZhciBjb21iID0gY29tYmluYXRvclJlZ2V4LmV4ZWMobWF0Y2hbMF0pWzBdO1xuICAgICAgICAgICAgbGFzdENvbWJpbmF0b3IgPSBjb21iO1xuICAgICAgICAgICAgaW5kZXggPSByZWdleC5sYXN0SW5kZXg7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAobGFzdENvbWJpbmF0b3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIG5leHRTZWxlY3RvciA9IFtcbiAgICAgICAgICAgICAgICAgICAgZ2V0Q29tYmluYXRvcihsYXN0Q29tYmluYXRvciksXG4gICAgICAgICAgICAgICAgICAgIHBhcnNlU2VsZWN0b3Ioc2VsLnN1YnN0cmluZyhpbmRleCkpXG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1hdGNoZXMucHVzaChtYXRjaFswXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdmFyIGNsYXNzTGlzdCA9IG1hdGNoZXNcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdGFydHNXaXRoKCcuJyk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3Vic3RyaW5nKDEpOyB9KTtcbiAgICB2YXIgaWRzID0gbWF0Y2hlcy5maWx0ZXIoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3RhcnRzV2l0aCgnIycpOyB9KS5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMuc3Vic3RyaW5nKDEpOyB9KTtcbiAgICBpZiAoaWRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIHNlbGVjdG9yLCBvbmx5IG9uZSBpZCBpcyBhbGxvd2VkJyk7XG4gICAgfVxuICAgIHZhciBwb3N0cHJvY2Vzc1JlZ2V4ID0gbmV3IFJlZ0V4cChcIihcIiArIElERU5UICsgXCIpXCIgKyBTUEFDRSArIFwiKFwiICsgT1AgKyBcIik/XCIgKyBTUEFDRSArIFwiKFwiICsgVkFMVUUgKyBcIik/XCIpO1xuICAgIHZhciBhdHRycyA9IG1hdGNoZXNcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdGFydHNXaXRoKCdbJyk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHBvc3Rwcm9jZXNzUmVnZXguZXhlYyhzKS5zbGljZSgxLCA0KTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAoX2EpIHtcbiAgICAgICAgdmFyIGF0dHIgPSBfYVswXSwgb3AgPSBfYVsxXSwgdmFsID0gX2FbMl07XG4gICAgICAgIHZhciBfYjtcbiAgICAgICAgcmV0dXJuIChfYiA9IHt9LFxuICAgICAgICAgICAgX2JbYXR0cl0gPSBbZ2V0T3Aob3ApLCB2YWwgPyBwYXJzZUF0dHJWYWx1ZSh2YWwpIDogdmFsXSxcbiAgICAgICAgICAgIF9iKTtcbiAgICB9KVxuICAgICAgICAucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGN1cnIpIHsgcmV0dXJuIChfX2Fzc2lnbih7fSwgYWNjLCBjdXJyKSk7IH0sIHt9KTtcbiAgICB2YXIgcHNldWRvcyA9IG1hdGNoZXNcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdGFydHNXaXRoKCc6Jyk7IH0pXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHBvc3RQcm9jZXNzUHNldWRvcyhzLnN1YnN0cmluZygxKSk7IH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIGlkOiBpZHNbMF0gfHwgJycsXG4gICAgICAgIHRhZzogdGFnLFxuICAgICAgICBjbGFzc0xpc3Q6IGNsYXNzTGlzdCxcbiAgICAgICAgYXR0cmlidXRlczogYXR0cnMsXG4gICAgICAgIG5leHRTZWxlY3RvcjogbmV4dFNlbGVjdG9yLFxuICAgICAgICBwc2V1ZG9zOiBwc2V1ZG9zXG4gICAgfTtcbn1cbmV4cG9ydHMucGFyc2VTZWxlY3RvciA9IHBhcnNlU2VsZWN0b3I7XG5mdW5jdGlvbiBwYXJzZUF0dHJWYWx1ZSh2KSB7XG4gICAgaWYgKHYuc3RhcnRzV2l0aCgnXCInKSkge1xuICAgICAgICByZXR1cm4gdi5zbGljZSgxLCAtMSk7XG4gICAgfVxuICAgIGlmICh2ID09PSBcInRydWVcIikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHYgPT09IFwiZmFsc2VcIikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciBmID0gcGFyc2VGbG9hdCh2KTtcbiAgICBpZiAoaXNOYU4oZikpIHtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxuICAgIHJldHVybiBmO1xufVxuZnVuY3Rpb24gcG9zdFByb2Nlc3NQc2V1ZG9zKHNlbCkge1xuICAgIGlmIChzZWwgPT09ICdmaXJzdC1jaGlsZCcgfHxcbiAgICAgICAgc2VsID09PSAnbGFzdC1jaGlsZCcgfHxcbiAgICAgICAgc2VsID09PSAncm9vdCcgfHxcbiAgICAgICAgc2VsID09PSAnZW1wdHknKSB7XG4gICAgICAgIHJldHVybiBbc2VsLCB1bmRlZmluZWRdO1xuICAgIH1cbiAgICBpZiAoc2VsLnN0YXJ0c1dpdGgoJ2NvbnRhaW5zJykpIHtcbiAgICAgICAgdmFyIHRleHQgPSBzZWwuc2xpY2UoMTAsIC0yKTtcbiAgICAgICAgcmV0dXJuIFsnY29udGFpbnMnLCB0ZXh0XTtcbiAgICB9XG4gICAgdmFyIGNvbnRlbnQgPSBzZWwuc2xpY2UoMTAsIC0xKTtcbiAgICBpZiAoY29udGVudCA9PT0gJ2V2ZW4nKSB7XG4gICAgICAgIGNvbnRlbnQgPSAnMm4nO1xuICAgIH1cbiAgICBpZiAoY29udGVudCA9PT0gJ29kZCcpIHtcbiAgICAgICAgY29udGVudCA9ICcybisxJztcbiAgICB9XG4gICAgcmV0dXJuIFsnbnRoLWNoaWxkJywgY29udGVudF07XG59XG5mdW5jdGlvbiBnZXRPcChvcCkge1xuICAgIHN3aXRjaCAob3ApIHtcbiAgICAgICAgY2FzZSAnPSc6XG4gICAgICAgICAgICByZXR1cm4gJ2V4YWN0JztcbiAgICAgICAgY2FzZSAnXj0nOlxuICAgICAgICAgICAgcmV0dXJuICdzdGFydHNXaXRoJztcbiAgICAgICAgY2FzZSAnJD0nOlxuICAgICAgICAgICAgcmV0dXJuICdlbmRzV2l0aCc7XG4gICAgICAgIGNhc2UgJyo9JzpcbiAgICAgICAgICAgIHJldHVybiAnY29udGFpbnMnO1xuICAgICAgICBjYXNlICd+PSc6XG4gICAgICAgICAgICByZXR1cm4gJ3doaXRlc3BhY2UnO1xuICAgICAgICBjYXNlICd8PSc6XG4gICAgICAgICAgICByZXR1cm4gJ2Rhc2gnO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICdoYXMnO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGdldENvbWJpbmF0b3IoY29tYikge1xuICAgIHN3aXRjaCAoY29tYi50cmltKCkpIHtcbiAgICAgICAgY2FzZSAnPic6XG4gICAgICAgICAgICByZXR1cm4gJ2NoaWxkJztcbiAgICAgICAgY2FzZSAnKyc6XG4gICAgICAgICAgICByZXR1cm4gJ25leHRTaWJsaW5nJztcbiAgICAgICAgY2FzZSAnfic6XG4gICAgICAgICAgICByZXR1cm4gJ3NpYmxpbmcnO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgcmV0dXJuICdzdWJ0cmVlJztcbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZWxlY3RvclBhcnNlci5qcy5tYXAiLCJpbXBvcnQge1N0cmVhbSwgSW50ZXJuYWxQcm9kdWNlciwgSW50ZXJuYWxMaXN0ZW5lciwgT3V0U2VuZGVyfSBmcm9tICcuLi9pbmRleCc7XG5cbmNsYXNzIENvbmNhdFByb2R1Y2VyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnY29uY2F0JztcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+ID0gbnVsbCBhcyBhbnk7XG4gIHByaXZhdGUgaTogbnVtYmVyID0gMDtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgc3RyZWFtczogQXJyYXk8U3RyZWFtPFQ+Pikge1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5zdHJlYW1zW3RoaXMuaV0uX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHN0cmVhbXMgPSB0aGlzLnN0cmVhbXM7XG4gICAgaWYgKHRoaXMuaSA8IHN0cmVhbXMubGVuZ3RoKSB7XG4gICAgICBzdHJlYW1zW3RoaXMuaV0uX3JlbW92ZSh0aGlzKTtcbiAgICB9XG4gICAgdGhpcy5pID0gMDtcbiAgICB0aGlzLm91dCA9IG51bGwgYXMgYW55O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IHN0cmVhbXMgPSB0aGlzLnN0cmVhbXM7XG4gICAgc3RyZWFtc1t0aGlzLmldLl9yZW1vdmUodGhpcyk7XG4gICAgaWYgKCsrdGhpcy5pIDwgc3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgIHN0cmVhbXNbdGhpcy5pXS5fYWRkKHRoaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB1Ll9jKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUHV0cyBvbmUgc3RyZWFtIGFmdGVyIHRoZSBvdGhlci4gKmNvbmNhdCogaXMgYSBmYWN0b3J5IHRoYXQgdGFrZXMgbXVsdGlwbGVcbiAqIHN0cmVhbXMgYXMgYXJndW1lbnRzLCBhbmQgc3RhcnRzIHRoZSBgbisxYC10aCBzdHJlYW0gb25seSB3aGVuIHRoZSBgbmAtdGhcbiAqIHN0cmVhbSBoYXMgY29tcGxldGVkLiBJdCBjb25jYXRlbmF0ZXMgdGhvc2Ugc3RyZWFtcyB0b2dldGhlci5cbiAqXG4gKiBNYXJibGUgZGlhZ3JhbTpcbiAqXG4gKiBgYGB0ZXh0XG4gKiAtLTEtLTItLS0zLS0tNC18XG4gKiAuLi4uLi4uLi4uLi4uLi4tLWEtYi1jLS1kLXxcbiAqICAgICAgICAgICBjb25jYXRcbiAqIC0tMS0tMi0tLTMtLS00LS0tYS1iLWMtLWQtfFxuICogYGBgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGNvbmNhdCBmcm9tICd4c3RyZWFtL2V4dHJhL2NvbmNhdCdcbiAqXG4gKiBjb25zdCBzdHJlYW1BID0geHMub2YoJ2EnLCAnYicsICdjJylcbiAqIGNvbnN0IHN0cmVhbUIgPSB4cy5vZigxMCwgMjAsIDMwKVxuICogY29uc3Qgc3RyZWFtQyA9IHhzLm9mKCdYJywgJ1knLCAnWicpXG4gKlxuICogY29uc3Qgb3V0cHV0U3RyZWFtID0gY29uY2F0KHN0cmVhbUEsIHN0cmVhbUIsIHN0cmVhbUMpXG4gKlxuICogb3V0cHV0U3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogKHgpID0+IGNvbnNvbGUubG9nKHgpLFxuICogICBlcnJvcjogKGVycikgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbmNhdCBjb21wbGV0ZWQnKSxcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAZmFjdG9yeSB0cnVlXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBjb25jYXRlbmF0ZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMiBBIHN0cmVhbSB0byBjb25jYXRlbmF0ZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuIFR3b1xuICogb3IgbW9yZSBzdHJlYW1zIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gKiBAcmV0dXJuIHtTdHJlYW19XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGNvbmNhdDxUPiguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08VD4+KTogU3RyZWFtPFQ+IHtcbiAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IENvbmNhdFByb2R1Y2VyKHN0cmVhbXMpKTtcbn1cbiIsImltcG9ydCB7T3BlcmF0b3IsIFN0cmVhbX0gZnJvbSAnLi4vaW5kZXgnO1xuY29uc3QgZW1wdHkgPSB7fTtcblxuZXhwb3J0IGNsYXNzIERyb3BSZXBlYXRzT3BlcmF0b3I8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Ryb3BSZXBlYXRzJztcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+ID0gbnVsbCBhcyBhbnk7XG4gIHB1YmxpYyBpc0VxOiAoeDogVCwgeTogVCkgPT4gYm9vbGVhbjtcbiAgcHJpdmF0ZSB2OiBUID0gPGFueT4gZW1wdHk7XG5cbiAgY29uc3RydWN0b3IocHVibGljIGluczogU3RyZWFtPFQ+LFxuICAgICAgICAgICAgICBmbjogKCh4OiBULCB5OiBUKSA9PiBib29sZWFuKSB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuaXNFcSA9IGZuID8gZm4gOiAoeCwgeSkgPT4geCA9PT0geTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gbnVsbCBhcyBhbnk7XG4gICAgdGhpcy52ID0gZW1wdHkgYXMgYW55O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICBjb25zdCB2ID0gdGhpcy52O1xuICAgIGlmICh2ICE9PSBlbXB0eSAmJiB0aGlzLmlzRXEodCwgdikpIHJldHVybjtcbiAgICB0aGlzLnYgPSB0O1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbi8qKlxuICogRHJvcHMgY29uc2VjdXRpdmUgZHVwbGljYXRlIHZhbHVlcyBpbiBhIHN0cmVhbS5cbiAqXG4gKiBNYXJibGUgZGlhZ3JhbTpcbiAqXG4gKiBgYGB0ZXh0XG4gKiAtLTEtLTItLTEtLTEtLTEtLTItLTMtLTQtLTMtLTN8XG4gKiAgICAgZHJvcFJlcGVhdHNcbiAqIC0tMS0tMi0tMS0tLS0tLS0tMi0tMy0tNC0tMy0tLXxcbiAqIGBgYFxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBkcm9wUmVwZWF0cyBmcm9tICd4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzJ1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IHhzLm9mKDEsIDIsIDEsIDEsIDEsIDIsIDMsIDQsIDMsIDMpXG4gKiAgIC5jb21wb3NlKGRyb3BSZXBlYXRzKCkpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IDFcbiAqID4gMlxuICogPiAxXG4gKiA+IDJcbiAqID4gM1xuICogPiA0XG4gKiA+IDNcbiAqID4gY29tcGxldGVkXG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlIHdpdGggYSBjdXN0b20gaXNFcXVhbCBmdW5jdGlvbjpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGRyb3BSZXBlYXRzIGZyb20gJ3hzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHMnXG4gKlxuICogY29uc3Qgc3RyZWFtID0geHMub2YoJ2EnLCAnYicsICdhJywgJ0EnLCAnQicsICdiJylcbiAqICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoKHgsIHkpID0+IHgudG9Mb3dlckNhc2UoKSA9PT0geS50b0xvd2VyQ2FzZSgpKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gYVxuICogPiBiXG4gKiA+IGFcbiAqID4gQlxuICogPiBjb21wbGV0ZWRcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGlzRXF1YWwgQW4gb3B0aW9uYWwgZnVuY3Rpb24gb2YgdHlwZVxuICogYCh4OiBULCB5OiBUKSA9PiBib29sZWFuYCB0aGF0IHRha2VzIGFuIGV2ZW50IGZyb20gdGhlIGlucHV0IHN0cmVhbSBhbmRcbiAqIGNoZWNrcyBpZiBpdCBpcyBlcXVhbCB0byBwcmV2aW91cyBldmVudCwgYnkgcmV0dXJuaW5nIGEgYm9vbGVhbi5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZHJvcFJlcGVhdHM8VD4oaXNFcXVhbDogKCh4OiBULCB5OiBUKSA9PiBib29sZWFuKSB8IHVuZGVmaW5lZCA9IHZvaWQgMCk6IChpbnM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFQ+IHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGRyb3BSZXBlYXRzT3BlcmF0b3IoaW5zOiBTdHJlYW08VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBEcm9wUmVwZWF0c09wZXJhdG9yPFQ+KGlucywgaXNFcXVhbCkpO1xuICB9O1xufVxuIiwiaW1wb3J0IHtJbnRlcm5hbExpc3RlbmVyLCBPcGVyYXRvciwgU3RyZWFtfSBmcm9tICcuLi9pbmRleCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2FtcGxlQ29tYmluZVNpZ25hdHVyZSB7XG4gICgpOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1RdPjtcbiAgPFQxPihzMTogU3RyZWFtPFQxPik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDFdPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMl0+O1xuICA8VDEsIFQyLCBUMz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDNdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0Pik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUMywgVDRdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDMsIFQ0LCBUNV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDZdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3Pik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDddPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiA8VD4oczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08W1QsIFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOF0+O1xuICAoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KTogKHM6IFN0cmVhbTxhbnk+KSA9PiBTdHJlYW08QXJyYXk8YW55Pj47XG59XG5cbmNvbnN0IE5PID0ge307XG5cbmV4cG9ydCBjbGFzcyBTYW1wbGVDb21iaW5lTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBpOiBudW1iZXIsIHByaXZhdGUgcDogU2FtcGxlQ29tYmluZU9wZXJhdG9yPGFueT4pIHtcbiAgICBwLmlsc1tpXSA9IHRoaXM7XG4gIH1cblxuICBfbih0OiBUKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMucDtcbiAgICBpZiAocC5vdXQgPT09IE5PKSByZXR1cm47XG4gICAgcC51cCh0LCB0aGlzLmkpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICB0aGlzLnAuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIHRoaXMucC5kb3duKHRoaXMuaSwgdGhpcyk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNhbXBsZUNvbWJpbmVPcGVyYXRvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIEFycmF5PGFueT4+IHtcbiAgcHVibGljIHR5cGUgPSAnc2FtcGxlQ29tYmluZSc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG90aGVyczogQXJyYXk8U3RyZWFtPGFueT4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08QXJyYXk8YW55Pj47XG4gIHB1YmxpYyBpbHM6IEFycmF5PFNhbXBsZUNvbWJpbmVMaXN0ZW5lcjxhbnk+PjtcbiAgcHVibGljIE5uOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqbipleHRcbiAgcHVibGljIHZhbHM6IEFycmF5PGFueT47XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIHN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3RoZXJzID0gc3RyZWFtcztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxBcnJheTxhbnk+PjtcbiAgICB0aGlzLmlscyA9IFtdO1xuICAgIHRoaXMuTm4gPSAwO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPEFycmF5PGFueT4+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgY29uc3QgcyA9IHRoaXMub3RoZXJzO1xuICAgIGNvbnN0IG4gPSB0aGlzLk5uID0gcy5sZW5ndGg7XG4gICAgY29uc3QgdmFscyA9IHRoaXMudmFscyA9IG5ldyBBcnJheShuKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgdmFsc1tpXSA9IE5PO1xuICAgICAgc1tpXS5fYWRkKG5ldyBTYW1wbGVDb21iaW5lTGlzdGVuZXI8YW55PihpLCB0aGlzKSk7XG4gICAgfVxuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5vdGhlcnM7XG4gICAgY29uc3QgbiA9IHMubGVuZ3RoO1xuICAgIGNvbnN0IGlscyA9IHRoaXMuaWxzO1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgIHNbaV0uX3JlbW92ZShpbHNbaV0pO1xuICAgIH1cbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxBcnJheTxhbnk+PjtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgICB0aGlzLmlscyA9IFtdO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuTm4gPiAwKSByZXR1cm47XG4gICAgb3V0Ll9uKFt0LCAuLi50aGlzLnZhbHNdKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KTogdm9pZCB7XG4gICAgY29uc3Qgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBvdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgb3V0Ll9jKCk7XG4gIH1cblxuICB1cCh0OiBhbnksIGk6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IHYgPSB0aGlzLnZhbHNbaV07XG4gICAgaWYgKHRoaXMuTm4gPiAwICYmIHYgPT09IE5PKSB7XG4gICAgICB0aGlzLk5uLS07XG4gICAgfVxuICAgIHRoaXMudmFsc1tpXSA9IHQ7XG4gIH1cblxuICBkb3duKGk6IG51bWJlciwgbDogU2FtcGxlQ29tYmluZUxpc3RlbmVyPGFueT4pOiB2b2lkIHtcbiAgICB0aGlzLm90aGVyc1tpXS5fcmVtb3ZlKGwpO1xuICB9XG59XG5cbmxldCBzYW1wbGVDb21iaW5lOiBTYW1wbGVDb21iaW5lU2lnbmF0dXJlO1xuXG4vKipcbiAqXG4gKiBDb21iaW5lcyBhIHNvdXJjZSBzdHJlYW0gd2l0aCBtdWx0aXBsZSBvdGhlciBzdHJlYW1zLiBUaGUgcmVzdWx0IHN0cmVhbVxuICogd2lsbCBlbWl0IHRoZSBsYXRlc3QgZXZlbnRzIGZyb20gYWxsIGlucHV0IHN0cmVhbXMsIGJ1dCBvbmx5IHdoZW4gdGhlXG4gKiBzb3VyY2Ugc3RyZWFtIGVtaXRzLlxuICpcbiAqIElmIHRoZSBzb3VyY2UsIG9yIGFueSBpbnB1dCBzdHJlYW0sIHRocm93cyBhbiBlcnJvciwgdGhlIHJlc3VsdCBzdHJlYW1cbiAqIHdpbGwgcHJvcGFnYXRlIHRoZSBlcnJvci4gSWYgYW55IGlucHV0IHN0cmVhbXMgZW5kLCB0aGVpciBmaW5hbCBlbWl0dGVkXG4gKiB2YWx1ZSB3aWxsIHJlbWFpbiBpbiB0aGUgYXJyYXkgb2YgYW55IHN1YnNlcXVlbnQgZXZlbnRzIGZyb20gdGhlIHJlc3VsdFxuICogc3RyZWFtLlxuICpcbiAqIFRoZSByZXN1bHQgc3RyZWFtIHdpbGwgb25seSBjb21wbGV0ZSB1cG9uIGNvbXBsZXRpb24gb2YgdGhlIHNvdXJjZSBzdHJlYW0uXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS0gKHNvdXJjZSlcbiAqIC0tLS1hLS0tLS1iLS0tLS1jLS1kLS0tLS0tIChvdGhlcilcbiAqICAgICAgc2FtcGxlQ29tYmluZVxuICogLS0tLS0tLTJhLS0tLTNiLS0tLS0tLTRkLS1cbiAqIGBgYFxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgc2FtcGxlQ29tYmluZSBmcm9tICd4c3RyZWFtL2V4dHJhL3NhbXBsZUNvbWJpbmUnXG4gKiBpbXBvcnQgeHMgZnJvbSAneHN0cmVhbSdcbiAqXG4gKiBjb25zdCBzYW1wbGVyID0geHMucGVyaW9kaWMoMTAwMCkudGFrZSgzKVxuICogY29uc3Qgb3RoZXIgPSB4cy5wZXJpb2RpYygxMDApXG4gKlxuICogY29uc3Qgc3RyZWFtID0gc2FtcGxlci5jb21wb3NlKHNhbXBsZUNvbWJpbmUob3RoZXIpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiBbMCwgOF1cbiAqID4gWzEsIDE4XVxuICogPiBbMiwgMjhdXG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IHNhbXBsZUNvbWJpbmUgZnJvbSAneHN0cmVhbS9leHRyYS9zYW1wbGVDb21iaW5lJ1xuICogaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nXG4gKlxuICogY29uc3Qgc2FtcGxlciA9IHhzLnBlcmlvZGljKDEwMDApLnRha2UoMylcbiAqIGNvbnN0IG90aGVyID0geHMucGVyaW9kaWMoMTAwKS50YWtlKDIpXG4gKlxuICogY29uc3Qgc3RyZWFtID0gc2FtcGxlci5jb21wb3NlKHNhbXBsZUNvbWJpbmUob3RoZXIpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiBbMCwgMV1cbiAqID4gWzEsIDFdXG4gKiA+IFsyLCAxXVxuICogYGBgXG4gKlxuICogQHBhcmFtIHsuLi5TdHJlYW19IHN0cmVhbXMgT25lIG9yIG1vcmUgc3RyZWFtcyB0byBjb21iaW5lIHdpdGggdGhlIHNhbXBsZXJcbiAqIHN0cmVhbS5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuc2FtcGxlQ29tYmluZSA9IGZ1bmN0aW9uIHNhbXBsZUNvbWJpbmUoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gIHJldHVybiBmdW5jdGlvbiBzYW1wbGVDb21iaW5lT3BlcmF0b3Ioc2FtcGxlcjogU3RyZWFtPGFueT4pOiBTdHJlYW08QXJyYXk8YW55Pj4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPEFycmF5PGFueT4+KG5ldyBTYW1wbGVDb21iaW5lT3BlcmF0b3Ioc2FtcGxlciwgc3RyZWFtcykpO1xuICB9O1xufSBhcyBTYW1wbGVDb21iaW5lU2lnbmF0dXJlO1xuXG5leHBvcnQgZGVmYXVsdCBzYW1wbGVDb21iaW5lOyIsImltcG9ydCAkJG9ic2VydmFibGUgZnJvbSAnc3ltYm9sLW9ic2VydmFibGUnO1xuXG5jb25zdCBOTyA9IHt9O1xuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmZ1bmN0aW9uIGNwPFQ+KGE6IEFycmF5PFQ+KTogQXJyYXk8VD4ge1xuICBjb25zdCBsID0gYS5sZW5ndGg7XG4gIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyArK2kpIGJbaV0gPSBhW2ldO1xuICByZXR1cm4gYjtcbn1cblxuZnVuY3Rpb24gYW5kPFQ+KGYxOiAodDogVCkgPT4gYm9vbGVhbiwgZjI6ICh0OiBUKSA9PiBib29sZWFuKTogKHQ6IFQpID0+IGJvb2xlYW4ge1xuICByZXR1cm4gZnVuY3Rpb24gYW5kRm4odDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmMSh0KSAmJiBmMih0KTtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIEZDb250YWluZXI8VCwgUj4ge1xuICBmKHQ6IFQpOiBSO1xufVxuXG5mdW5jdGlvbiBfdHJ5PFQsIFI+KGM6IEZDb250YWluZXI8VCwgUj4sIHQ6IFQsIHU6IFN0cmVhbTxhbnk+KTogUiB8IHt9IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYy5mKHQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdS5fZShlKTtcbiAgICByZXR1cm4gTk87XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgX246ICh2OiBUKSA9PiB2b2lkO1xuICBfZTogKGVycjogYW55KSA9PiB2b2lkO1xuICBfYzogKCkgPT4gdm9pZDtcbn1cblxuY29uc3QgTk9fSUw6IEludGVybmFsTGlzdGVuZXI8YW55PiA9IHtcbiAgX246IG5vb3AsXG4gIF9lOiBub29wLFxuICBfYzogbm9vcCxcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIF9zdGFydChsaXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQ7XG4gIF9zdG9wOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE91dFNlbmRlcjxUPiB7XG4gIG91dDogU3RyZWFtPFQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wZXJhdG9yPFQsIFI+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxSPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPFI+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnM6IFN0cmVhbTxUPjtcbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBZ2dyZWdhdG9yPFQsIFU+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxVPiwgT3V0U2VuZGVyPFU+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj47XG4gIF9zdGFydChvdXQ6IFN0cmVhbTxVPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvZHVjZXI8VD4ge1xuICBzdGFydDogKGxpc3RlbmVyOiBMaXN0ZW5lcjxUPikgPT4gdm9pZDtcbiAgc3RvcDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaXN0ZW5lcjxUPiB7XG4gIG5leHQ6ICh4OiBUKSA9PiB2b2lkO1xuICBlcnJvcjogKGVycjogYW55KSA9PiB2b2lkO1xuICBjb21wbGV0ZTogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb24ge1xuICB1bnN1YnNjcmliZSgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9ic2VydmFibGU8VD4ge1xuICBzdWJzY3JpYmUobGlzdGVuZXI6IExpc3RlbmVyPFQ+KTogU3Vic2NyaXB0aW9uO1xufVxuXG4vLyBtdXRhdGVzIHRoZSBpbnB1dFxuZnVuY3Rpb24gaW50ZXJuYWxpemVQcm9kdWNlcjxUPihwcm9kdWNlcjogUHJvZHVjZXI8VD4gJiBQYXJ0aWFsPEludGVybmFsUHJvZHVjZXI8VD4+KSB7XG4gIHByb2R1Y2VyLl9zdGFydCA9IGZ1bmN0aW9uIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPiAmIFBhcnRpYWw8TGlzdGVuZXI8VD4+KSB7XG4gICAgaWwubmV4dCA9IGlsLl9uO1xuICAgIGlsLmVycm9yID0gaWwuX2U7XG4gICAgaWwuY29tcGxldGUgPSBpbC5fYztcbiAgICB0aGlzLnN0YXJ0KGlsIGFzIExpc3RlbmVyPFQ+KTtcbiAgfTtcbiAgcHJvZHVjZXIuX3N0b3AgPSBwcm9kdWNlci5zdG9wO1xufVxuXG5jbGFzcyBTdHJlYW1TdWI8VD4gaW1wbGVtZW50cyBTdWJzY3JpcHRpb24ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zdHJlYW06IFN0cmVhbTxUPiwgcHJpdmF0ZSBfbGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pIHt9XG5cbiAgdW5zdWJzY3JpYmUoKTogdm9pZCB7XG4gICAgdGhpcy5fc3RyZWFtLl9yZW1vdmUodGhpcy5fbGlzdGVuZXIpO1xuICB9XG59XG5cbmNsYXNzIE9ic2VydmVyPFQ+IGltcGxlbWVudHMgTGlzdGVuZXI8VD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9saXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPikge31cblxuICBuZXh0KHZhbHVlOiBUKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX24odmFsdWUpO1xuICB9XG5cbiAgZXJyb3IoZXJyOiBhbnkpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fZShlcnIpO1xuICB9XG5cbiAgY29tcGxldGUoKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBGcm9tT2JzZXJ2YWJsZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tT2JzZXJ2YWJsZSc7XG4gIHB1YmxpYyBpbnM6IE9ic2VydmFibGU8VD47XG4gIHB1YmxpYyBvdXQ/OiBTdHJlYW08VD47XG4gIHByaXZhdGUgYWN0aXZlOiBib29sZWFuO1xuICBwcml2YXRlIF9zdWI6IFN1YnNjcmlwdGlvbiB8IHVuZGVmaW5lZDtcblxuICBjb25zdHJ1Y3RvcihvYnNlcnZhYmxlOiBPYnNlcnZhYmxlPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBvYnNlcnZhYmxlO1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gICAgdGhpcy5fc3ViID0gdGhpcy5pbnMuc3Vic2NyaWJlKG5ldyBPYnNlcnZlcihvdXQpKTtcbiAgICBpZiAoIXRoaXMuYWN0aXZlKSB0aGlzLl9zdWIudW5zdWJzY3JpYmUoKTtcbiAgfVxuXG4gIF9zdG9wKCkge1xuICAgIGlmICh0aGlzLl9zdWIpIHRoaXMuX3N1Yi51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBNZXJnZVNpZ25hdHVyZSB7XG4gICgpOiBTdHJlYW08YW55PjtcbiAgPFQxPihzMTogU3RyZWFtPFQxPik6IFN0cmVhbTxUMT47XG4gIDxUMSwgVDI+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+KTogU3RyZWFtPFQxIHwgVDI+O1xuICA8VDEsIFQyLCBUMz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4pOiBTdHJlYW08VDEgfCBUMiB8IFQzPjtcbiAgPFQxLCBUMiwgVDMsIFQ0PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUND47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDU+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDU+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNz47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDg+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDg+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOCB8IFQ5PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4sXG4gICAgczEwOiBTdHJlYW08VDEwPik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4IHwgVDkgfCBUMTA+O1xuICA8VD4oLi4uc3RyZWFtOiBBcnJheTxTdHJlYW08VD4+KTogU3RyZWFtPFQ+O1xufVxuXG5jbGFzcyBNZXJnZTxUPiBpbXBsZW1lbnRzIEFnZ3JlZ2F0b3I8VCwgVD4sIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdtZXJnZSc7XG4gIHB1YmxpYyBpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBhYzogbnVtYmVyOyAvLyBhYyBpcyBhY3RpdmVDb3VudFxuXG4gIGNvbnN0cnVjdG9yKGluc0FycjogQXJyYXk8U3RyZWFtPFQ+Pikge1xuICAgIHRoaXMuaW5zQXJyID0gaW5zQXJyO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuYWMgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IEwgPSBzLmxlbmd0aDtcbiAgICB0aGlzLmFjID0gTDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgc1tpXS5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IEwgPSBzLmxlbmd0aDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgc1tpXS5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgaWYgKC0tdGhpcy5hYyA8PSAwKSB7XG4gICAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb21iaW5lU2lnbmF0dXJlIHtcbiAgKCk6IFN0cmVhbTxBcnJheTxhbnk+PjtcbiAgPFQxPihzMTogU3RyZWFtPFQxPik6IFN0cmVhbTxbVDFdPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiBTdHJlYW08W1QxLCBUMl0+O1xuICA8VDEsIFQyLCBUMz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4pOiBTdHJlYW08W1QxLCBUMiwgVDNdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDRdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDZdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDddPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDldPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4sXG4gICAgczk6IFN0cmVhbTxUOT4sXG4gICAgczEwOiBTdHJlYW08VDEwPik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwXT47XG4gICguLi5zdHJlYW06IEFycmF5PFN0cmVhbTxhbnk+Pik6IFN0cmVhbTxBcnJheTxhbnk+Pjtcbn1cblxuY2xhc3MgQ29tYmluZUxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPEFycmF5PFQ+PiB7XG4gIHByaXZhdGUgaTogbnVtYmVyO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08QXJyYXk8VD4+O1xuICBwcml2YXRlIHA6IENvbWJpbmU8VD47XG5cbiAgY29uc3RydWN0b3IoaTogbnVtYmVyLCBvdXQ6IFN0cmVhbTxBcnJheTxUPj4sIHA6IENvbWJpbmU8VD4pIHtcbiAgICB0aGlzLmkgPSBpO1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMucCA9IHA7XG4gICAgcC5pbHMucHVzaCh0aGlzKTtcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wLCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIGlmIChwLnVwKHQsIHRoaXMuaSkpIHtcbiAgICAgIGNvbnN0IGEgPSBwLnZhbHM7XG4gICAgICBjb25zdCBsID0gYS5sZW5ndGg7XG4gICAgICBjb25zdCBiID0gQXJyYXkobCk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGw7ICsraSkgYltpXSA9IGFbaV07XG4gICAgICBvdXQuX24oYik7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIG91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMucDtcbiAgICBpZiAocC5vdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKC0tcC5OYyA9PT0gMCkgcC5vdXQuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBDb21iaW5lPFI+IGltcGxlbWVudHMgQWdncmVnYXRvcjxhbnksIEFycmF5PFI+PiB7XG4gIHB1YmxpYyB0eXBlID0gJ2NvbWJpbmUnO1xuICBwdWJsaWMgaW5zQXJyOiBBcnJheTxTdHJlYW08YW55Pj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxSPj47XG4gIHB1YmxpYyBpbHM6IEFycmF5PENvbWJpbmVMaXN0ZW5lcjxhbnk+PjtcbiAgcHVibGljIE5jOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqYypvbXBsZXRlXG4gIHB1YmxpYyBObjogbnVtYmVyOyAvLyAqTip1bWJlciBvZiBzdHJlYW1zIHN0aWxsIHRvIHNlbmQgKm4qZXh0XG4gIHB1YmxpYyB2YWxzOiBBcnJheTxSPjtcblxuICBjb25zdHJ1Y3RvcihpbnNBcnI6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHRoaXMuaW5zQXJyID0gaW5zQXJyO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PFI+PjtcbiAgICB0aGlzLmlscyA9IFtdO1xuICAgIHRoaXMuTmMgPSB0aGlzLk5uID0gMDtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgfVxuXG4gIHVwKHQ6IGFueSwgaTogbnVtYmVyKTogYm9vbGVhbiB7XG4gICAgY29uc3QgdiA9IHRoaXMudmFsc1tpXTtcbiAgICBjb25zdCBObiA9ICF0aGlzLk5uID8gMCA6IHYgPT09IE5PID8gLS10aGlzLk5uIDogdGhpcy5ObjtcbiAgICB0aGlzLnZhbHNbaV0gPSB0O1xuICAgIHJldHVybiBObiA9PT0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxBcnJheTxSPj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgbiA9IHRoaXMuTmMgPSB0aGlzLk5uID0gcy5sZW5ndGg7XG4gICAgY29uc3QgdmFscyA9IHRoaXMudmFscyA9IG5ldyBBcnJheShuKTtcbiAgICBpZiAobiA9PT0gMCkge1xuICAgICAgb3V0Ll9uKFtdKTtcbiAgICAgIG91dC5fYygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgICB2YWxzW2ldID0gTk87XG4gICAgICAgIHNbaV0uX2FkZChuZXcgQ29tYmluZUxpc3RlbmVyKGksIG91dCwgdGhpcykpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBuID0gcy5sZW5ndGg7XG4gICAgY29uc3QgaWxzID0gdGhpcy5pbHM7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHNbaV0uX3JlbW92ZShpbHNbaV0pO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PFI+PjtcbiAgICB0aGlzLmlscyA9IFtdO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG59XG5cbmNsYXNzIEZyb21BcnJheTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tQXJyYXknO1xuICBwdWJsaWMgYTogQXJyYXk8VD47XG5cbiAgY29uc3RydWN0b3IoYTogQXJyYXk8VD4pIHtcbiAgICB0aGlzLmEgPSBhO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLmE7XG4gICAgZm9yIChsZXQgaSA9IDAsIG4gPSBhLmxlbmd0aDsgaSA8IG47IGkrKykgb3V0Ll9uKGFbaV0pO1xuICAgIG91dC5fYygpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gIH1cbn1cblxuY2xhc3MgRnJvbVByb21pc2U8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbVByb21pc2UnO1xuICBwdWJsaWMgb246IGJvb2xlYW47XG4gIHB1YmxpYyBwOiBQcm9taXNlTGlrZTxUPjtcblxuICBjb25zdHJ1Y3RvcihwOiBQcm9taXNlTGlrZTxUPikge1xuICAgIHRoaXMub24gPSBmYWxzZTtcbiAgICB0aGlzLnAgPSBwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHByb2QgPSB0aGlzO1xuICAgIHRoaXMub24gPSB0cnVlO1xuICAgIHRoaXMucC50aGVuKFxuICAgICAgKHY6IFQpID0+IHtcbiAgICAgICAgaWYgKHByb2Qub24pIHtcbiAgICAgICAgICBvdXQuX24odik7XG4gICAgICAgICAgb3V0Ll9jKCk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAoZTogYW55KSA9PiB7XG4gICAgICAgIG91dC5fZShlKTtcbiAgICAgIH0sXG4gICAgKS50aGVuKG5vb3AsIChlcnI6IGFueSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7IHRocm93IGVycjsgfSk7XG4gICAgfSk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLm9uID0gZmFsc2U7XG4gIH1cbn1cblxuY2xhc3MgUGVyaW9kaWMgaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPG51bWJlcj4ge1xuICBwdWJsaWMgdHlwZSA9ICdwZXJpb2RpYyc7XG4gIHB1YmxpYyBwZXJpb2Q6IG51bWJlcjtcbiAgcHJpdmF0ZSBpbnRlcnZhbElEOiBhbnk7XG4gIHByaXZhdGUgaTogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKHBlcmlvZDogbnVtYmVyKSB7XG4gICAgdGhpcy5wZXJpb2QgPSBwZXJpb2Q7XG4gICAgdGhpcy5pbnRlcnZhbElEID0gLTE7XG4gICAgdGhpcy5pID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8bnVtYmVyPik6IHZvaWQge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIGludGVydmFsSGFuZGxlcigpIHsgb3V0Ll9uKHNlbGYuaSsrKTsgfVxuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IHNldEludGVydmFsKGludGVydmFsSGFuZGxlciwgdGhpcy5wZXJpb2QpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuaW50ZXJ2YWxJRCAhPT0gLTEpIGNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbElEKTtcbiAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICB0aGlzLmkgPSAwO1xuICB9XG59XG5cbmNsYXNzIERlYnVnPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkZWJ1Zyc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIHM6ICh0OiBUKSA9PiBhbnk7IC8vIHNweVxuICBwcml2YXRlIGw6IHN0cmluZzsgLy8gbGFiZWxcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPik7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogKHQ6IFQpID0+IGFueSk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5zID0gbm9vcDtcbiAgICB0aGlzLmwgPSAnJztcbiAgICBpZiAodHlwZW9mIGFyZyA9PT0gJ3N0cmluZycpIHRoaXMubCA9IGFyZzsgZWxzZSBpZiAodHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJykgdGhpcy5zID0gYXJnO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHMgPSB0aGlzLnMsIGwgPSB0aGlzLmw7XG4gICAgaWYgKHMgIT09IG5vb3ApIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHModCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHUuX2UoZSk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChsKSBjb25zb2xlLmxvZyhsICsgJzonLCB0KTsgZWxzZSBjb25zb2xlLmxvZyh0KTtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBEcm9wPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdkcm9wJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBtYXg6IG51bWJlcjtcbiAgcHJpdmF0ZSBkcm9wcGVkOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IobWF4OiBudW1iZXIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5tYXggPSBtYXg7XG4gICAgdGhpcy5kcm9wcGVkID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuZHJvcHBlZCA9IDA7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmRyb3BwZWQrKyA+PSB0aGlzLm1heCkgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRW5kV2hlbkxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxhbnk+IHtcbiAgcHJpdmF0ZSBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcDogRW5kV2hlbjxUPjtcblxuICBjb25zdHJ1Y3RvcihvdXQ6IFN0cmVhbTxUPiwgb3A6IEVuZFdoZW48VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wID0gb3A7XG4gIH1cblxuICBfbigpIHtcbiAgICB0aGlzLm9wLmVuZCgpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICB0aGlzLm91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcC5lbmQoKTtcbiAgfVxufVxuXG5jbGFzcyBFbmRXaGVuPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdlbmRXaGVuJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBvOiBTdHJlYW08YW55PjsgLy8gbyA9IG90aGVyXG4gIHByaXZhdGUgb2lsOiBJbnRlcm5hbExpc3RlbmVyPGFueT47IC8vIG9pbCA9IG90aGVyIEludGVybmFsTGlzdGVuZXJcblxuICBjb25zdHJ1Y3RvcihvOiBTdHJlYW08YW55PiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm8gPSBvO1xuICAgIHRoaXMub2lsID0gTk9fSUw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm8uX2FkZCh0aGlzLm9pbCA9IG5ldyBFbmRXaGVuTGlzdGVuZXIob3V0LCB0aGlzKSk7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vLl9yZW1vdmUodGhpcy5vaWwpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub2lsID0gTk9fSUw7XG4gIH1cblxuICBlbmQoKTogdm9pZCB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMuZW5kKCk7XG4gIH1cbn1cblxuY2xhc3MgRmlsdGVyPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmaWx0ZXInO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBib29sZWFuO1xuXG4gIGNvbnN0cnVjdG9yKHBhc3NlczogKHQ6IFQpID0+IGJvb2xlYW4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5mID0gcGFzc2VzO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTyB8fCAhcikgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIEZsYXR0ZW5MaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwcml2YXRlIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wOiBGbGF0dGVuPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKG91dDogU3RyZWFtPFQ+LCBvcDogRmxhdHRlbjxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3AgPSBvcDtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICB0aGlzLm91dC5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgdGhpcy5vdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3AuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcC5sZXNzKCk7XG4gIH1cbn1cblxuY2xhc3MgRmxhdHRlbjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFN0cmVhbTxUPiwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmbGF0dGVuJztcbiAgcHVibGljIGluczogU3RyZWFtPFN0cmVhbTxUPj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcGVuOiBib29sZWFuO1xuICBwdWJsaWMgaW5uZXI6IFN0cmVhbTxUPjsgLy8gQ3VycmVudCBpbm5lciBTdHJlYW1cbiAgcHJpdmF0ZSBpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPjsgLy8gQ3VycmVudCBpbm5lciBJbnRlcm5hbExpc3RlbmVyXG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08U3RyZWFtPFQ+Pikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5pbCA9IE5PX0lMO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIGlmICh0aGlzLmlubmVyICE9PSBOTykgdGhpcy5pbm5lci5fcmVtb3ZlKHRoaXMuaWwpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gIH1cblxuICBsZXNzKCk6IHZvaWQge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAoIXRoaXMub3BlbiAmJiB0aGlzLmlubmVyID09PSBOTykgdS5fYygpO1xuICB9XG5cbiAgX24oczogU3RyZWFtPFQ+KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHtpbm5lciwgaWx9ID0gdGhpcztcbiAgICBpZiAoaW5uZXIgIT09IE5PICYmIGlsICE9PSBOT19JTCkgaW5uZXIuX3JlbW92ZShpbCk7XG4gICAgKHRoaXMuaW5uZXIgPSBzKS5fYWRkKHRoaXMuaWwgPSBuZXcgRmxhdHRlbkxpc3RlbmVyKHUsIHRoaXMpKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3BlbiA9IGZhbHNlO1xuICAgIHRoaXMubGVzcygpO1xuICB9XG59XG5cbmNsYXNzIEZvbGQ8VCwgUj4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBSPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZvbGQnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxSPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBSO1xuICBwdWJsaWMgc2VlZDogUjtcbiAgcHJpdmF0ZSBhY2M6IFI7IC8vIGluaXRpYWxpemVkIGFzIHNlZWRcblxuICBjb25zdHJ1Y3RvcihmOiAoYWNjOiBSLCB0OiBUKSA9PiBSLCBzZWVkOiBSLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuZiA9ICh0OiBUKSA9PiBmKHRoaXMuYWNjLCB0KTtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZCA9IHNlZWQ7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZDtcbiAgICBvdXQuX24odGhpcy5hY2MpO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHRoaXMuYWNjID0gciBhcyBSKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgTGFzdDxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnbGFzdCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGhhczogYm9vbGVhbjtcbiAgcHJpdmF0ZSB2YWw6IFQ7XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmhhcyA9IGZhbHNlO1xuICAgIHRoaXMudmFsID0gTk8gYXMgVDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy52YWwgPSBOTyBhcyBUO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIHRoaXMuaGFzID0gdHJ1ZTtcbiAgICB0aGlzLnZhbCA9IHQ7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuaGFzKSB7XG4gICAgICB1Ll9uKHRoaXMudmFsKTtcbiAgICAgIHUuX2MoKTtcbiAgICB9IGVsc2UgdS5fZShuZXcgRXJyb3IoJ2xhc3QoKSBmYWlsZWQgYmVjYXVzZSBpbnB1dCBzdHJlYW0gY29tcGxldGVkJykpO1xuICB9XG59XG5cbmNsYXNzIE1hcE9wPFQsIFI+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgUj4ge1xuICBwdWJsaWMgdHlwZSA9ICdtYXAnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxSPjtcbiAgcHVibGljIGY6ICh0OiBUKSA9PiBSO1xuXG4gIGNvbnN0cnVjdG9yKHByb2plY3Q6ICh0OiBUKSA9PiBSLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICAgIHRoaXMuZiA9IHByb2plY3Q7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbihyIGFzIFIpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBSZW1lbWJlcjxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdyZW1lbWJlcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKG91dCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMub3V0KTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxufVxuXG5jbGFzcyBSZXBsYWNlRXJyb3I8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3JlcGxhY2VFcnJvcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgZjogKGVycjogYW55KSA9PiBTdHJlYW08VD47XG5cbiAgY29uc3RydWN0b3IocmVwbGFjZXI6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+LCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuZiA9IHJlcGxhY2VyO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB0cnkge1xuICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICh0aGlzLmlucyA9IHRoaXMuZihlcnIpKS5fYWRkKHRoaXMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHUuX2UoZSk7XG4gICAgfVxuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBTdGFydFdpdGg8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnc3RhcnRXaXRoJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyB2YWw6IFQ7XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIHZhbDogVCkge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMudmFsID0gdmFsO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vdXQuX24odGhpcy52YWwpO1xuICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG59XG5cbmNsYXNzIFRha2U8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3Rha2UnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG1heDogbnVtYmVyO1xuICBwcml2YXRlIHRha2VuOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IobWF4OiBudW1iZXIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5tYXggPSBtYXg7XG4gICAgdGhpcy50YWtlbiA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLnRha2VuID0gMDtcbiAgICBpZiAodGhpcy5tYXggPD0gMCkgb3V0Ll9jKCk7IGVsc2UgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IG0gPSArK3RoaXMudGFrZW47XG4gICAgaWYgKG0gPCB0aGlzLm1heCkgdS5fbih0KTsgZWxzZSBpZiAobSA9PT0gdGhpcy5tYXgpIHtcbiAgICAgIHUuX24odCk7XG4gICAgICB1Ll9jKCk7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3RyZWFtPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHB1YmxpYyBfcHJvZDogSW50ZXJuYWxQcm9kdWNlcjxUPjtcbiAgcHJvdGVjdGVkIF9pbHM6IEFycmF5PEludGVybmFsTGlzdGVuZXI8VD4+OyAvLyAnaWxzJyA9IEludGVybmFsIGxpc3RlbmVyc1xuICBwcm90ZWN0ZWQgX3N0b3BJRDogYW55O1xuICBwcm90ZWN0ZWQgX2RsOiBJbnRlcm5hbExpc3RlbmVyPFQ+OyAvLyB0aGUgZGVidWcgbGlzdGVuZXJcbiAgcHJvdGVjdGVkIF9kOiBib29sZWFuOyAvLyBmbGFnIGluZGljYXRpbmcgdGhlIGV4aXN0ZW5jZSBvZiB0aGUgZGVidWcgbGlzdGVuZXJcbiAgcHJvdGVjdGVkIF90YXJnZXQ6IFN0cmVhbTxUPjsgLy8gaW1pdGF0aW9uIHRhcmdldCBpZiB0aGlzIFN0cmVhbSB3aWxsIGltaXRhdGVcbiAgcHJvdGVjdGVkIF9lcnI6IGFueTtcblxuICBjb25zdHJ1Y3Rvcihwcm9kdWNlcj86IEludGVybmFsUHJvZHVjZXI8VD4pIHtcbiAgICB0aGlzLl9wcm9kID0gcHJvZHVjZXIgfHwgTk8gYXMgSW50ZXJuYWxQcm9kdWNlcjxUPjtcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB0aGlzLl9kbCA9IE5PIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgdGhpcy5fZCA9IGZhbHNlO1xuICAgIHRoaXMuX3RhcmdldCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX24odCk7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fbih0KTsgZWxzZSBpZiAoTCA9PSAwKSByZXR1cm47IGVsc2Uge1xuICAgICAgY29uc3QgYiA9IGNwKGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIGJbaV0uX24odCk7XG4gICAgfVxuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5fZXJyICE9PSBOTykgcmV0dXJuO1xuICAgIHRoaXMuX2VyciA9IGVycjtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICB0aGlzLl94KCk7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9lKGVycik7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fZShlcnIpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fZShlcnIpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuX2QgJiYgTCA9PSAwKSB0aHJvdyB0aGlzLl9lcnI7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IEwgPSBhLmxlbmd0aDtcbiAgICB0aGlzLl94KCk7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9jKCk7XG4gICAgaWYgKEwgPT0gMSkgYVswXS5fYygpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fYygpO1xuICAgIH1cbiAgfVxuXG4gIF94KCk6IHZvaWQgeyAvLyB0ZWFyIGRvd24gbG9naWMsIGFmdGVyIGVycm9yIG9yIGNvbXBsZXRlXG4gICAgaWYgKHRoaXMuX2lscy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBpZiAodGhpcy5fcHJvZCAhPT0gTk8pIHRoaXMuX3Byb2QuX3N0b3AoKTtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgfVxuXG4gIF9zdG9wTm93KCkge1xuICAgIC8vIFdBUk5JTkc6IGNvZGUgdGhhdCBjYWxscyB0aGlzIG1ldGhvZCBzaG91bGRcbiAgICAvLyBmaXJzdCBjaGVjayBpZiB0aGlzLl9wcm9kIGlzIHZhbGlkIChub3QgYE5PYClcbiAgICB0aGlzLl9wcm9kLl9zdG9wKCk7XG4gICAgdGhpcy5fZXJyID0gTk87XG4gICAgdGhpcy5fc3RvcElEID0gTk87XG4gIH1cblxuICBfYWRkKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9hZGQoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgYS5wdXNoKGlsKTtcbiAgICBpZiAoYS5sZW5ndGggPiAxKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX3N0b3BJRCAhPT0gTk8pIHtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zdG9wSUQpO1xuICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgICAgaWYgKHAgIT09IE5PKSBwLl9zdGFydCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBfcmVtb3ZlKGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgdGEgPSB0aGlzLl90YXJnZXQ7XG4gICAgaWYgKHRhICE9PSBOTykgcmV0dXJuIHRhLl9yZW1vdmUoaWwpO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgaSA9IGEuaW5kZXhPZihpbCk7XG4gICAgaWYgKGkgPiAtMSkge1xuICAgICAgYS5zcGxpY2UoaSwgMSk7XG4gICAgICBpZiAodGhpcy5fcHJvZCAhPT0gTk8gJiYgYS5sZW5ndGggPD0gMCkge1xuICAgICAgICB0aGlzLl9lcnIgPSBOTztcbiAgICAgICAgdGhpcy5fc3RvcElEID0gc2V0VGltZW91dCgoKSA9PiB0aGlzLl9zdG9wTm93KCkpO1xuICAgICAgfSBlbHNlIGlmIChhLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICB0aGlzLl9wcnVuZUN5Y2xlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIGFsbCBwYXRocyBzdGVtbWluZyBmcm9tIGB0aGlzYCBzdHJlYW0gZXZlbnR1YWxseSBlbmQgYXQgYHRoaXNgXG4gIC8vIHN0cmVhbSwgdGhlbiB3ZSByZW1vdmUgdGhlIHNpbmdsZSBsaXN0ZW5lciBvZiBgdGhpc2Agc3RyZWFtLCB0b1xuICAvLyBmb3JjZSBpdCB0byBlbmQgaXRzIGV4ZWN1dGlvbiBhbmQgZGlzcG9zZSByZXNvdXJjZXMuIFRoaXMgbWV0aG9kXG4gIC8vIGFzc3VtZXMgYXMgYSBwcmVjb25kaXRpb24gdGhhdCB0aGlzLl9pbHMgaGFzIGp1c3Qgb25lIGxpc3RlbmVyLlxuICBfcHJ1bmVDeWNsZXMoKSB7XG4gICAgaWYgKHRoaXMuX2hhc05vU2lua3ModGhpcywgW10pKSB0aGlzLl9yZW1vdmUodGhpcy5faWxzWzBdKTtcbiAgfVxuXG4gIC8vIENoZWNrcyB3aGV0aGVyICp0aGVyZSBpcyBubyogcGF0aCBzdGFydGluZyBmcm9tIGB4YCB0aGF0IGxlYWRzIHRvIGFuIGVuZFxuICAvLyBsaXN0ZW5lciAoc2luaykgaW4gdGhlIHN0cmVhbSBncmFwaCwgZm9sbG93aW5nIGVkZ2VzIEEtPkIgd2hlcmUgQiBpcyBhXG4gIC8vIGxpc3RlbmVyIG9mIEEuIFRoaXMgbWVhbnMgdGhlc2UgcGF0aHMgY29uc3RpdHV0ZSBhIGN5Y2xlIHNvbWVob3cuIElzIGdpdmVuXG4gIC8vIGEgdHJhY2Ugb2YgYWxsIHZpc2l0ZWQgbm9kZXMgc28gZmFyLlxuICBfaGFzTm9TaW5rcyh4OiBJbnRlcm5hbExpc3RlbmVyPGFueT4sIHRyYWNlOiBBcnJheTxhbnk+KTogYm9vbGVhbiB7XG4gICAgaWYgKHRyYWNlLmluZGV4T2YoeCkgIT09IC0xKVxuICAgICAgcmV0dXJuIHRydWU7IGVsc2VcbiAgICBpZiAoKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQgPT09IHRoaXMpXG4gICAgICByZXR1cm4gdHJ1ZTsgZWxzZVxuICAgIGlmICgoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCAmJiAoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCAhPT0gTk8pXG4gICAgICByZXR1cm4gdGhpcy5faGFzTm9TaW5rcygoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCwgdHJhY2UuY29uY2F0KHgpKTsgZWxzZVxuICAgIGlmICgoeCBhcyBTdHJlYW08YW55PikuX2lscykge1xuICAgICAgZm9yIChsZXQgaSA9IDAsIE4gPSAoeCBhcyBTdHJlYW08YW55PikuX2lscy5sZW5ndGg7IGkgPCBOOyBpKyspXG4gICAgICAgIGlmICghdGhpcy5faGFzTm9TaW5rcygoeCBhcyBTdHJlYW08YW55PikuX2lsc1tpXSwgdHJhY2UuY29uY2F0KHgpKSlcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBjdG9yKCk6IHR5cGVvZiBTdHJlYW0ge1xuICAgIHJldHVybiB0aGlzIGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtID8gTWVtb3J5U3RyZWFtIDogU3RyZWFtO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyfSBsaXN0ZW5lclxuICAgKi9cbiAgYWRkTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogdm9pZCB7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9uID0gbGlzdGVuZXIubmV4dCB8fCBub29wO1xuICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fZSA9IGxpc3RlbmVyLmVycm9yIHx8IG5vb3A7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9jID0gbGlzdGVuZXIuY29tcGxldGUgfHwgbm9vcDtcbiAgICB0aGlzLl9hZGQobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhIExpc3RlbmVyIGZyb20gdGhlIFN0cmVhbSwgYXNzdW1pbmcgdGhlIExpc3RlbmVyIHdhcyBhZGRlZCB0byBpdC5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcjxUPn0gbGlzdGVuZXJcbiAgICovXG4gIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pik6IHZvaWQge1xuICAgIHRoaXMuX3JlbW92ZShsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgTGlzdGVuZXIgdG8gdGhlIFN0cmVhbSByZXR1cm5pbmcgYSBTdWJzY3JpcHRpb24gdG8gcmVtb3ZlIHRoYXRcbiAgICogbGlzdGVuZXIuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXJ9IGxpc3RlbmVyXG4gICAqIEByZXR1cm5zIHtTdWJzY3JpcHRpb259XG4gICAqL1xuICBzdWJzY3JpYmUobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogU3Vic2NyaXB0aW9uIHtcbiAgICB0aGlzLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcbiAgICByZXR1cm4gbmV3IFN0cmVhbVN1YjxUPih0aGlzLCBsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGQgaW50ZXJvcCBiZXR3ZWVuIG1vc3QuanMgYW5kIFJ4SlMgNVxuICAgKlxuICAgKiBAcmV0dXJucyB7U3RyZWFtfVxuICAgKi9cbiAgWyQkb2JzZXJ2YWJsZV0oKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGU8VD4ocHJvZHVjZXI/OiBQcm9kdWNlcjxUPik6IFN0cmVhbTxUPiB7XG4gICAgaWYgKHByb2R1Y2VyKSB7XG4gICAgICBpZiAodHlwZW9mIHByb2R1Y2VyLnN0YXJ0ICE9PSAnZnVuY3Rpb24nXG4gICAgICB8fCB0eXBlb2YgcHJvZHVjZXIuc3RvcCAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwcm9kdWNlciByZXF1aXJlcyBib3RoIHN0YXJ0IGFuZCBzdG9wIGZ1bmN0aW9ucycpO1xuICAgICAgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgfVxuICAgIHJldHVybiBuZXcgU3RyZWFtKHByb2R1Y2VyIGFzIEludGVybmFsUHJvZHVjZXI8VD4gJiBQcm9kdWNlcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBNZW1vcnlTdHJlYW0gZ2l2ZW4gYSBQcm9kdWNlci5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb2R1Y2VyfSBwcm9kdWNlciBBbiBvcHRpb25hbCBQcm9kdWNlciB0aGF0IGRpY3RhdGVzIGhvdyB0b1xuICAgKiBzdGFydCwgZ2VuZXJhdGUgZXZlbnRzLCBhbmQgc3RvcCB0aGUgU3RyZWFtLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlV2l0aE1lbW9yeTxUPihwcm9kdWNlcj86IFByb2R1Y2VyPFQ+KTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICBpZiAocHJvZHVjZXIpIGludGVybmFsaXplUHJvZHVjZXIocHJvZHVjZXIpOyAvLyBtdXRhdGVzIHRoZSBpbnB1dFxuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KHByb2R1Y2VyIGFzIEludGVybmFsUHJvZHVjZXI8VD4gJiBQcm9kdWNlcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGRvZXMgbm90aGluZyB3aGVuIHN0YXJ0ZWQuIEl0IG5ldmVyIGVtaXRzIGFueSBldmVudC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogICAgICAgICAgbmV2ZXJcbiAgICogLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG5ldmVyKCk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtfc3RhcnQ6IG5vb3AsIF9zdG9wOiBub29wfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIHRoZSBcImNvbXBsZXRlXCIgbm90aWZpY2F0aW9uIHdoZW5cbiAgICogc3RhcnRlZCwgYW5kIHRoYXQncyBpdC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZW1wdHlcbiAgICogLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGVtcHR5KCk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtcbiAgICAgIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+KSB7IGlsLl9jKCk7IH0sXG4gICAgICBfc3RvcDogbm9vcCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgYW4gXCJlcnJvclwiIG5vdGlmaWNhdGlvbiB3aXRoIHRoZVxuICAgKiB2YWx1ZSB5b3UgcGFzc2VkIGFzIHRoZSBgZXJyb3JgIGFyZ3VtZW50IHdoZW4gdGhlIHN0cmVhbSBzdGFydHMsIGFuZCB0aGF0J3NcbiAgICogaXQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIHRocm93KFgpXG4gICAqIC1YXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSBlcnJvciBUaGUgZXJyb3IgZXZlbnQgdG8gZW1pdCBvbiB0aGUgY3JlYXRlZCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyB0aHJvdyhlcnJvcjogYW55KTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe1xuICAgICAgX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHsgaWwuX2UoZXJyb3IpOyB9LFxuICAgICAgX3N0b3A6IG5vb3AsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHN0cmVhbSBmcm9tIGFuIEFycmF5LCBQcm9taXNlLCBvciBhbiBPYnNlcnZhYmxlLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7QXJyYXl8UHJvbWlzZUxpa2V8T2JzZXJ2YWJsZX0gaW5wdXQgVGhlIGlucHV0IHRvIG1ha2UgYSBzdHJlYW0gZnJvbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb208VD4oaW5wdXQ6IFByb21pc2VMaWtlPFQ+IHwgU3RyZWFtPFQ+IHwgQXJyYXk8VD4gfCBPYnNlcnZhYmxlPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAodHlwZW9mIGlucHV0WyQkb2JzZXJ2YWJsZV0gPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21PYnNlcnZhYmxlPFQ+KGlucHV0IGFzIE9ic2VydmFibGU8VD4pOyBlbHNlXG4gICAgaWYgKHR5cGVvZiAoaW5wdXQgYXMgUHJvbWlzZUxpa2U8VD4pLnRoZW4gPT09ICdmdW5jdGlvbicpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21Qcm9taXNlPFQ+KGlucHV0IGFzIFByb21pc2VMaWtlPFQ+KTsgZWxzZVxuICAgIGlmIChBcnJheS5pc0FycmF5KGlucHV0KSlcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbUFycmF5PFQ+KGlucHV0KTtcblxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFR5cGUgb2YgaW5wdXQgdG8gZnJvbSgpIG11c3QgYmUgYW4gQXJyYXksIFByb21pc2UsIG9yIE9ic2VydmFibGVgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgdGhlIGFyZ3VtZW50cyB0aGF0IHlvdSBnaXZlIHRvXG4gICAqICpvZiosIHRoZW4gY29tcGxldGVzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBvZigxLDIsMylcbiAgICogMTIzfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0gYSBUaGUgZmlyc3QgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLlxuICAgKiBAcGFyYW0gYiBUaGUgc2Vjb25kIHZhbHVlIHlvdSB3YW50IHRvIGVtaXQgYXMgYW4gZXZlbnQgb24gdGhlIHN0cmVhbS4gT25lXG4gICAqIG9yIG1vcmUgb2YgdGhlc2UgdmFsdWVzIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBvZjxUPiguLi5pdGVtczogQXJyYXk8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBTdHJlYW0uZnJvbUFycmF5PFQ+KGl0ZW1zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhbiBhcnJheSB0byBhIHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSB3aWxsIGVtaXQgc3luY2hyb25vdXNseVxuICAgKiBhbGwgdGhlIGl0ZW1zIGluIHRoZSBhcnJheSwgYW5kIHRoZW4gY29tcGxldGUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGZyb21BcnJheShbMSwyLDNdKVxuICAgKiAxMjN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7QXJyYXl9IGFycmF5IFRoZSBhcnJheSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tQXJyYXk8VD4oYXJyYXk6IEFycmF5PFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbUFycmF5PFQ+KGFycmF5KSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYSBwcm9taXNlIHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCB0aGUgcmVzb2x2ZWRcbiAgICogdmFsdWUgb2YgdGhlIHByb21pc2UsIGFuZCB0aGVuIGNvbXBsZXRlLiBIb3dldmVyLCBpZiB0aGUgcHJvbWlzZSBpc1xuICAgKiByZWplY3RlZCwgdGhlIHN0cmVhbSB3aWxsIGVtaXQgdGhlIGNvcnJlc3BvbmRpbmcgZXJyb3IuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGZyb21Qcm9taXNlKCAtLS0tNDIgKVxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLTQyfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb21pc2VMaWtlfSBwcm9taXNlIFRoZSBwcm9taXNlIHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21Qcm9taXNlPFQ+KHByb21pc2U6IFByb21pc2VMaWtlPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbVByb21pc2U8VD4ocHJvbWlzZSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIE9ic2VydmFibGUgaW50byBhIFN0cmVhbS5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge2FueX0gb2JzZXJ2YWJsZSBUaGUgb2JzZXJ2YWJsZSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tT2JzZXJ2YWJsZTxUPihvYnM6IHtzdWJzY3JpYmU6IGFueX0pOiBTdHJlYW08VD4ge1xuICAgIGlmICgob2JzIGFzIFN0cmVhbTxUPikuZW5kV2hlbikgcmV0dXJuIG9icyBhcyBTdHJlYW08VD47XG4gICAgY29uc3QgbyA9IHR5cGVvZiBvYnNbJCRvYnNlcnZhYmxlXSA9PT0gJ2Z1bmN0aW9uJyA/IG9ic1skJG9ic2VydmFibGVdKCkgOiBvYnM7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZyb21PYnNlcnZhYmxlKG8pKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RyZWFtIHRoYXQgcGVyaW9kaWNhbGx5IGVtaXRzIGluY3JlbWVudGFsIG51bWJlcnMsIGV2ZXJ5XG4gICAqIGBwZXJpb2RgIG1pbGxpc2Vjb25kcy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogICAgIHBlcmlvZGljKDEwMDApXG4gICAqIC0tLTAtLS0xLS0tMi0tLTMtLS00LS0tLi4uXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBwZXJpb2QgVGhlIGludGVydmFsIGluIG1pbGxpc2Vjb25kcyB0byB1c2UgYXMgYSByYXRlIG9mXG4gICAqIGVtaXNzaW9uLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgcGVyaW9kaWMocGVyaW9kOiBudW1iZXIpOiBTdHJlYW08bnVtYmVyPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08bnVtYmVyPihuZXcgUGVyaW9kaWMocGVyaW9kKSk7XG4gIH1cblxuICAvKipcbiAgICogQmxlbmRzIG11bHRpcGxlIHN0cmVhbXMgdG9nZXRoZXIsIGVtaXR0aW5nIGV2ZW50cyBmcm9tIGFsbCBvZiB0aGVtXG4gICAqIGNvbmN1cnJlbnRseS5cbiAgICpcbiAgICogKm1lcmdlKiB0YWtlcyBtdWx0aXBsZSBzdHJlYW1zIGFzIGFyZ3VtZW50cywgYW5kIGNyZWF0ZXMgYSBzdHJlYW0gdGhhdFxuICAgKiBiZWhhdmVzIGxpa2UgZWFjaCBvZiB0aGUgYXJndW1lbnQgc3RyZWFtcywgaW4gcGFyYWxsZWwuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gICAqIC0tLS1hLS0tLS1iLS0tLWMtLS1kLS0tLS0tXG4gICAqICAgICAgICAgICAgbWVyZ2VcbiAgICogLS0xLWEtLTItLWItLTMtYy0tLWQtLTQtLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gbWVyZ2UgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMiBBIHN0cmVhbSB0byBtZXJnZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuIFR3b1xuICAgKiBvciBtb3JlIHN0cmVhbXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG1lcmdlOiBNZXJnZVNpZ25hdHVyZSA9IGZ1bmN0aW9uIG1lcmdlKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4obmV3IE1lcmdlKHN0cmVhbXMpKTtcbiAgfSBhcyBNZXJnZVNpZ25hdHVyZTtcblxuICAvKipcbiAgICogQ29tYmluZXMgbXVsdGlwbGUgaW5wdXQgc3RyZWFtcyB0b2dldGhlciB0byByZXR1cm4gYSBzdHJlYW0gd2hvc2UgZXZlbnRzXG4gICAqIGFyZSBhcnJheXMgdGhhdCBjb2xsZWN0IHRoZSBsYXRlc3QgZXZlbnRzIGZyb20gZWFjaCBpbnB1dCBzdHJlYW0uXG4gICAqXG4gICAqICpjb21iaW5lKiBpbnRlcm5hbGx5IHJlbWVtYmVycyB0aGUgbW9zdCByZWNlbnQgZXZlbnQgZnJvbSBlYWNoIG9mIHRoZSBpbnB1dFxuICAgKiBzdHJlYW1zLiBXaGVuIGFueSBvZiB0aGUgaW5wdXQgc3RyZWFtcyBlbWl0cyBhbiBldmVudCwgdGhhdCBldmVudCB0b2dldGhlclxuICAgKiB3aXRoIGFsbCB0aGUgb3RoZXIgc2F2ZWQgZXZlbnRzIGFyZSBjb21iaW5lZCBpbnRvIGFuIGFycmF5LiBUaGF0IGFycmF5IHdpbGxcbiAgICogYmUgZW1pdHRlZCBvbiB0aGUgb3V0cHV0IHN0cmVhbS4gSXQncyBlc3NlbnRpYWxseSBhIHdheSBvZiBqb2luaW5nIHRvZ2V0aGVyXG4gICAqIHRoZSBldmVudHMgZnJvbSBtdWx0aXBsZSBzdHJlYW1zLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tLS0tNC0tLVxuICAgKiAtLS0tYS0tLS0tYi0tLS0tYy0tZC0tLS0tLVxuICAgKiAgICAgICAgICBjb21iaW5lXG4gICAqIC0tLS0xYS0yYS0yYi0zYi0zYy0zZC00ZC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMiBBIHN0cmVhbSB0byBjb21iaW5lIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAgICogTXVsdGlwbGUgc3RyZWFtcywgbm90IGp1c3QgdHdvLCBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY29tYmluZTogQ29tYmluZVNpZ25hdHVyZSA9IGZ1bmN0aW9uIGNvbWJpbmUoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08QXJyYXk8YW55Pj4obmV3IENvbWJpbmU8YW55PihzdHJlYW1zKSk7XG4gIH0gYXMgQ29tYmluZVNpZ25hdHVyZTtcblxuICBwcm90ZWN0ZWQgX21hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IFN0cmVhbTxVPiB8IE1lbW9yeVN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFU+KG5ldyBNYXBPcDxULCBVPihwcm9qZWN0LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyBlYWNoIGV2ZW50IGZyb20gdGhlIGlucHV0IFN0cmVhbSB0aHJvdWdoIGEgYHByb2plY3RgIGZ1bmN0aW9uLFxuICAgKiB0byBnZXQgYSBTdHJlYW0gdGhhdCBlbWl0cyB0aG9zZSB0cmFuc2Zvcm1lZCBldmVudHMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTMtLTUtLS0tLTctLS0tLS1cbiAgICogICAgbWFwKGkgPT4gaSAqIDEwKVxuICAgKiAtLTEwLS0zMC01MC0tLS03MC0tLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwcm9qZWN0IEEgZnVuY3Rpb24gb2YgdHlwZSBgKHQ6IFQpID0+IFVgIHRoYXQgdGFrZXMgZXZlbnRcbiAgICogYHRgIG9mIHR5cGUgYFRgIGZyb20gdGhlIGlucHV0IFN0cmVhbSBhbmQgcHJvZHVjZXMgYW4gZXZlbnQgb2YgdHlwZSBgVWAsIHRvXG4gICAqIGJlIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIG1hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IFN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIHRoaXMuX21hcChwcm9qZWN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJdCdzIGxpa2UgYG1hcGAsIGJ1dCB0cmFuc2Zvcm1zIGVhY2ggaW5wdXQgZXZlbnQgdG8gYWx3YXlzIHRoZSBzYW1lXG4gICAqIGNvbnN0YW50IHZhbHVlIG9uIHRoZSBvdXRwdXQgU3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0zLS01LS0tLS03LS0tLS1cbiAgICogICAgICAgbWFwVG8oMTApXG4gICAqIC0tMTAtLTEwLTEwLS0tLTEwLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHByb2plY3RlZFZhbHVlIEEgdmFsdWUgdG8gZW1pdCBvbiB0aGUgb3V0cHV0IFN0cmVhbSB3aGVuZXZlciB0aGVcbiAgICogaW5wdXQgU3RyZWFtIGVtaXRzIGFueSB2YWx1ZS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbWFwVG88VT4ocHJvamVjdGVkVmFsdWU6IFUpOiBTdHJlYW08VT4ge1xuICAgIGNvbnN0IHMgPSB0aGlzLm1hcCgoKSA9PiBwcm9qZWN0ZWRWYWx1ZSk7XG4gICAgY29uc3Qgb3A6IE9wZXJhdG9yPFQsIFU+ID0gcy5fcHJvZCBhcyBPcGVyYXRvcjxULCBVPjtcbiAgICBvcC50eXBlID0gJ21hcFRvJztcbiAgICByZXR1cm4gcztcbiAgfVxuXG4gIGZpbHRlcjxTIGV4dGVuZHMgVD4ocGFzc2VzOiAodDogVCkgPT4gdCBpcyBTKTogU3RyZWFtPFM+O1xuICBmaWx0ZXIocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbik6IFN0cmVhbTxUPjtcbiAgLyoqXG4gICAqIE9ubHkgYWxsb3dzIGV2ZW50cyB0aGF0IHBhc3MgdGhlIHRlc3QgZ2l2ZW4gYnkgdGhlIGBwYXNzZXNgIGFyZ3VtZW50LlxuICAgKlxuICAgKiBFYWNoIGV2ZW50IGZyb20gdGhlIGlucHV0IHN0cmVhbSBpcyBnaXZlbiB0byB0aGUgYHBhc3Nlc2AgZnVuY3Rpb24uIElmIHRoZVxuICAgKiBmdW5jdGlvbiByZXR1cm5zIGB0cnVlYCwgdGhlIGV2ZW50IGlzIGZvcndhcmRlZCB0byB0aGUgb3V0cHV0IHN0cmVhbSxcbiAgICogb3RoZXJ3aXNlIGl0IGlzIGlnbm9yZWQgYW5kIG5vdCBmb3J3YXJkZWQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTItLTMtLS0tLTQtLS0tLTUtLS02LS03LTgtLVxuICAgKiAgICAgZmlsdGVyKGkgPT4gaSAlIDIgPT09IDApXG4gICAqIC0tLS0tLTItLS0tLS0tLTQtLS0tLS0tLS02LS0tLTgtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcGFzc2VzIEEgZnVuY3Rpb24gb2YgdHlwZSBgKHQ6IFQpID0+IGJvb2xlYW5gIHRoYXQgdGFrZXNcbiAgICogYW4gZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGFuZCBjaGVja3MgaWYgaXQgcGFzc2VzLCBieSByZXR1cm5pbmcgYVxuICAgKiBib29sZWFuLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBmaWx0ZXIocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbik6IFN0cmVhbTxUPiB7XG4gICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgaWYgKHAgaW5zdGFuY2VvZiBGaWx0ZXIpXG4gICAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRmlsdGVyPFQ+KFxuICAgICAgICBhbmQoKHAgYXMgRmlsdGVyPFQ+KS5mLCBwYXNzZXMpLFxuICAgICAgICAocCBhcyBGaWx0ZXI8VD4pLmluc1xuICAgICAgKSk7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZpbHRlcjxUPihwYXNzZXMsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMZXRzIHRoZSBmaXJzdCBgYW1vdW50YCBtYW55IGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gcGFzcyB0byB0aGVcbiAgICogb3V0cHV0IHN0cmVhbSwgdGhlbiBtYWtlcyB0aGUgb3V0cHV0IHN0cmVhbSBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tLS1kLS0tZS0tXG4gICAqICAgIHRha2UoMylcbiAgICogLS1hLS0tYi0tY3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgSG93IG1hbnkgZXZlbnRzIHRvIGFsbG93IGZyb20gdGhlIGlucHV0IHN0cmVhbVxuICAgKiBiZWZvcmUgY29tcGxldGluZyB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgdGFrZShhbW91bnQ6IG51bWJlcik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBUYWtlPFQ+KGFtb3VudCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIElnbm9yZXMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW5cbiAgICogYWZ0ZXIgdGhhdCBzdGFydHMgZm9yd2FyZGluZyBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHRvIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICogICAgICAgZHJvcCgzKVxuICAgKiAtLS0tLS0tLS0tLS0tLWQtLS1lLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhbW91bnQgSG93IG1hbnkgZXZlbnRzIHRvIGlnbm9yZSBmcm9tIHRoZSBpbnB1dCBzdHJlYW1cbiAgICogYmVmb3JlIGZvcndhcmRpbmcgYWxsIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGRyb3AoYW1vdW50OiBudW1iZXIpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBEcm9wPFQ+KGFtb3VudCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFdoZW4gdGhlIGlucHV0IHN0cmVhbSBjb21wbGV0ZXMsIHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgZW1pdCB0aGUgbGFzdCBldmVudFxuICAgKiBlbWl0dGVkIGJ5IHRoZSBpbnB1dCBzdHJlYW0sIGFuZCB0aGVuIHdpbGwgYWxzbyBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tZC0tLS18XG4gICAqICAgICAgIGxhc3QoKVxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLWR8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBsYXN0KCk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IExhc3Q8VD4odGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByZXBlbmRzIHRoZSBnaXZlbiBgaW5pdGlhbGAgdmFsdWUgdG8gdGhlIHNlcXVlbmNlIG9mIGV2ZW50cyBlbWl0dGVkIGJ5IHRoZVxuICAgKiBpbnB1dCBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gaXMgYSBNZW1vcnlTdHJlYW0sIHdoaWNoIG1lYW5zIGl0IGlzXG4gICAqIGFscmVhZHkgYHJlbWVtYmVyKClgJ2QuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLTEtLS0yLS0tLS0zLS0tXG4gICAqICAgc3RhcnRXaXRoKDApXG4gICAqIDAtLTEtLS0yLS0tLS0zLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gaW5pdGlhbCBUaGUgdmFsdWUgb3IgZXZlbnQgdG8gcHJlcGVuZC5cbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgc3RhcnRXaXRoKGluaXRpYWw6IFQpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KG5ldyBTdGFydFdpdGg8VD4odGhpcywgaW5pdGlhbCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZXMgYW5vdGhlciBzdHJlYW0gdG8gZGV0ZXJtaW5lIHdoZW4gdG8gY29tcGxldGUgdGhlIGN1cnJlbnQgc3RyZWFtLlxuICAgKlxuICAgKiBXaGVuIHRoZSBnaXZlbiBgb3RoZXJgIHN0cmVhbSBlbWl0cyBhbiBldmVudCBvciBjb21wbGV0ZXMsIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtIHdpbGwgY29tcGxldGUuIEJlZm9yZSB0aGF0IGhhcHBlbnMsIHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgYmVoYXZlc1xuICAgKiBsaWtlIHRoZSBpbnB1dCBzdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLTEtLS0yLS0tLS0zLS00LS0tLTUtLS0tNi0tLVxuICAgKiAgIGVuZFdoZW4oIC0tLS0tLS0tYS0tYi0tfCApXG4gICAqIC0tLTEtLS0yLS0tLS0zLS00LS18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gb3RoZXIgU29tZSBvdGhlciBzdHJlYW0gdGhhdCBpcyB1c2VkIHRvIGtub3cgd2hlbiBzaG91bGQgdGhlIG91dHB1dFxuICAgKiBzdHJlYW0gb2YgdGhpcyBvcGVyYXRvciBjb21wbGV0ZS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZW5kV2hlbihvdGhlcjogU3RyZWFtPGFueT4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgRW5kV2hlbjxUPihvdGhlciwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFwiRm9sZHNcIiB0aGUgc3RyZWFtIG9udG8gaXRzZWxmLlxuICAgKlxuICAgKiBDb21iaW5lcyBldmVudHMgZnJvbSB0aGUgcGFzdCB0aHJvdWdob3V0XG4gICAqIHRoZSBlbnRpcmUgZXhlY3V0aW9uIG9mIHRoZSBpbnB1dCBzdHJlYW0sIGFsbG93aW5nIHlvdSB0byBhY2N1bXVsYXRlIHRoZW1cbiAgICogdG9nZXRoZXIuIEl0J3MgZXNzZW50aWFsbHkgbGlrZSBgQXJyYXkucHJvdG90eXBlLnJlZHVjZWAuIFRoZSByZXR1cm5lZFxuICAgKiBzdHJlYW0gaXMgYSBNZW1vcnlTdHJlYW0sIHdoaWNoIG1lYW5zIGl0IGlzIGFscmVhZHkgYHJlbWVtYmVyKClgJ2QuXG4gICAqXG4gICAqIFRoZSBvdXRwdXQgc3RyZWFtIHN0YXJ0cyBieSBlbWl0dGluZyB0aGUgYHNlZWRgIHdoaWNoIHlvdSBnaXZlIGFzIGFyZ3VtZW50LlxuICAgKiBUaGVuLCB3aGVuIGFuIGV2ZW50IGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgaXQgaXMgY29tYmluZWQgd2l0aCB0aGF0XG4gICAqIHNlZWQgdmFsdWUgdGhyb3VnaCB0aGUgYGFjY3VtdWxhdGVgIGZ1bmN0aW9uLCBhbmQgdGhlIG91dHB1dCB2YWx1ZSBpc1xuICAgKiBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBgZm9sZGAgcmVtZW1iZXJzIHRoYXQgb3V0cHV0IHZhbHVlIGFzIGBhY2NgXG4gICAqIChcImFjY3VtdWxhdG9yXCIpLCBhbmQgdGhlbiB3aGVuIGEgbmV3IGlucHV0IGV2ZW50IGB0YCBoYXBwZW5zLCBgYWNjYCB3aWxsIGJlXG4gICAqIGNvbWJpbmVkIHdpdGggdGhhdCB0byBwcm9kdWNlIHRoZSBuZXcgYGFjY2AgYW5kIHNvIGZvcnRoLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLS0tLS0xLS0tLS0xLS0yLS0tLTEtLS0tMS0tLS0tLVxuICAgKiAgIGZvbGQoKGFjYywgeCkgPT4gYWNjICsgeCwgMylcbiAgICogMy0tLS0tNC0tLS0tNS0tNy0tLS04LS0tLTktLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGFjY3VtdWxhdGUgQSBmdW5jdGlvbiBvZiB0eXBlIGAoYWNjOiBSLCB0OiBUKSA9PiBSYCB0aGF0XG4gICAqIHRha2VzIHRoZSBwcmV2aW91cyBhY2N1bXVsYXRlZCB2YWx1ZSBgYWNjYCBhbmQgdGhlIGluY29taW5nIGV2ZW50IGZyb20gdGhlXG4gICAqIGlucHV0IHN0cmVhbSBhbmQgcHJvZHVjZXMgdGhlIG5ldyBhY2N1bXVsYXRlZCB2YWx1ZS5cbiAgICogQHBhcmFtIHNlZWQgVGhlIGluaXRpYWwgYWNjdW11bGF0ZWQgdmFsdWUsIG9mIHR5cGUgYFJgLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBmb2xkPFI+KGFjY3VtdWxhdGU6IChhY2M6IFIsIHQ6IFQpID0+IFIsIHNlZWQ6IFIpOiBNZW1vcnlTdHJlYW08Uj4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFI+KG5ldyBGb2xkPFQsIFI+KGFjY3VtdWxhdGUsIHNlZWQsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXBsYWNlcyBhbiBlcnJvciB3aXRoIGFub3RoZXIgc3RyZWFtLlxuICAgKlxuICAgKiBXaGVuIChhbmQgaWYpIGFuIGVycm9yIGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgaW5zdGVhZCBvZiBmb3J3YXJkaW5nXG4gICAqIHRoYXQgZXJyb3IgdG8gdGhlIG91dHB1dCBzdHJlYW0sICpyZXBsYWNlRXJyb3IqIHdpbGwgY2FsbCB0aGUgYHJlcGxhY2VgXG4gICAqIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgdGhlIHN0cmVhbSB0aGF0IHRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgcmVwbGljYXRlLlxuICAgKiBBbmQsIGluIGNhc2UgdGhhdCBuZXcgc3RyZWFtIGFsc28gZW1pdHMgYW4gZXJyb3IsIGByZXBsYWNlYCB3aWxsIGJlIGNhbGxlZFxuICAgKiBhZ2FpbiB0byBnZXQgYW5vdGhlciBzdHJlYW0gdG8gc3RhcnQgcmVwbGljYXRpbmcuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTItLS0tLTMtLTQtLS0tLVhcbiAgICogICByZXBsYWNlRXJyb3IoICgpID0+IC0tMTAtLXwgKVxuICAgKiAtLTEtLS0yLS0tLS0zLS00LS0tLS0tLS0xMC0tfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcmVwbGFjZSBBIGZ1bmN0aW9uIG9mIHR5cGUgYChlcnIpID0+IFN0cmVhbWAgdGhhdCB0YWtlc1xuICAgKiB0aGUgZXJyb3IgdGhhdCBvY2N1cnJlZCBvbiB0aGUgaW5wdXQgc3RyZWFtIG9yIG9uIHRoZSBwcmV2aW91cyByZXBsYWNlbWVudFxuICAgKiBzdHJlYW0gYW5kIHJldHVybnMgYSBuZXcgc3RyZWFtLiBUaGUgb3V0cHV0IHN0cmVhbSB3aWxsIGJlaGF2ZSBsaWtlIHRoZVxuICAgKiBzdHJlYW0gdGhhdCB0aGlzIGZ1bmN0aW9uIHJldHVybnMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHJlcGxhY2VFcnJvcihyZXBsYWNlOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBSZXBsYWNlRXJyb3I8VD4ocmVwbGFjZSwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZsYXR0ZW5zIGEgXCJzdHJlYW0gb2Ygc3RyZWFtc1wiLCBoYW5kbGluZyBvbmx5IG9uZSBuZXN0ZWQgc3RyZWFtIGF0IGEgdGltZVxuICAgKiAobm8gY29uY3VycmVuY3kpLlxuICAgKlxuICAgKiBJZiB0aGUgaW5wdXQgc3RyZWFtIGlzIGEgc3RyZWFtIHRoYXQgZW1pdHMgc3RyZWFtcywgdGhlbiB0aGlzIG9wZXJhdG9yIHdpbGxcbiAgICogcmV0dXJuIGFuIG91dHB1dCBzdHJlYW0gd2hpY2ggaXMgYSBmbGF0IHN0cmVhbTogZW1pdHMgcmVndWxhciBldmVudHMuIFRoZVxuICAgKiBmbGF0dGVuaW5nIGhhcHBlbnMgd2l0aG91dCBjb25jdXJyZW5jeS4gSXQgd29ya3MgbGlrZSB0aGlzOiB3aGVuIHRoZSBpbnB1dFxuICAgKiBzdHJlYW0gZW1pdHMgYSBuZXN0ZWQgc3RyZWFtLCAqZmxhdHRlbiogd2lsbCBzdGFydCBpbWl0YXRpbmcgdGhhdCBuZXN0ZWRcbiAgICogb25lLiBIb3dldmVyLCBhcyBzb29uIGFzIHRoZSBuZXh0IG5lc3RlZCBzdHJlYW0gaXMgZW1pdHRlZCBvbiB0aGUgaW5wdXRcbiAgICogc3RyZWFtLCAqZmxhdHRlbiogd2lsbCBmb3JnZXQgdGhlIHByZXZpb3VzIG5lc3RlZCBvbmUgaXQgd2FzIGltaXRhdGluZywgYW5kXG4gICAqIHdpbGwgc3RhcnQgaW1pdGF0aW5nIHRoZSBuZXcgbmVzdGVkIG9uZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0rLS0tLS0tLS0rLS0tLS0tLS0tLS0tLS0tXG4gICAqICAgXFwgICAgICAgIFxcXG4gICAqICAgIFxcICAgICAgIC0tLS0xLS0tLTItLS0zLS1cbiAgICogICAgLS1hLS1iLS0tLWMtLS0tZC0tLS0tLS0tXG4gICAqICAgICAgICAgICBmbGF0dGVuXG4gICAqIC0tLS0tYS0tYi0tLS0tLTEtLS0tMi0tLTMtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZmxhdHRlbjxSPih0aGlzOiBTdHJlYW08U3RyZWFtPFI+Pik6IFN0cmVhbTxSPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08Uj4obmV3IEZsYXR0ZW4odGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhc3NlcyB0aGUgaW5wdXQgc3RyZWFtIHRvIGEgY3VzdG9tIG9wZXJhdG9yLCB0byBwcm9kdWNlIGFuIG91dHB1dCBzdHJlYW0uXG4gICAqXG4gICAqICpjb21wb3NlKiBpcyBhIGhhbmR5IHdheSBvZiB1c2luZyBhbiBleGlzdGluZyBmdW5jdGlvbiBpbiBhIGNoYWluZWQgc3R5bGUuXG4gICAqIEluc3RlYWQgb2Ygd3JpdGluZyBgb3V0U3RyZWFtID0gZihpblN0cmVhbSlgIHlvdSBjYW4gd3JpdGVcbiAgICogYG91dFN0cmVhbSA9IGluU3RyZWFtLmNvbXBvc2UoZilgLlxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBvcGVyYXRvciBBIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYSBzdHJlYW0gYXMgaW5wdXQgYW5kXG4gICAqIHJldHVybnMgYSBzdHJlYW0gYXMgd2VsbC5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgY29tcG9zZTxVPihvcGVyYXRvcjogKHN0cmVhbTogU3RyZWFtPFQ+KSA9PiBVKTogVSB7XG4gICAgcmV0dXJuIG9wZXJhdG9yKHRoaXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb3V0cHV0IHN0cmVhbSB0aGF0IGJlaGF2ZXMgbGlrZSB0aGUgaW5wdXQgc3RyZWFtLCBidXQgYWxzb1xuICAgKiByZW1lbWJlcnMgdGhlIG1vc3QgcmVjZW50IGV2ZW50IHRoYXQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBzbyB0aGF0IGFcbiAgICogbmV3bHkgYWRkZWQgbGlzdGVuZXIgd2lsbCBpbW1lZGlhdGVseSByZWNlaXZlIHRoYXQgbWVtb3Jpc2VkIGV2ZW50LlxuICAgKlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICByZW1lbWJlcigpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgTWVtb3J5U3RyZWFtPFQ+KG5ldyBSZW1lbWJlcjxUPih0aGlzKSk7XG4gIH1cblxuICBkZWJ1ZygpOiBTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6IHN0cmluZyk6IFN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogKHQ6IFQpID0+IGFueSk6IFN0cmVhbTxUPjtcbiAgLyoqXG4gICAqIFJldHVybnMgYW4gb3V0cHV0IHN0cmVhbSB0aGF0IGlkZW50aWNhbGx5IGJlaGF2ZXMgbGlrZSB0aGUgaW5wdXQgc3RyZWFtLFxuICAgKiBidXQgYWxzbyBydW5zIGEgYHNweWAgZnVuY3Rpb24gZm9yIGVhY2ggZXZlbnQsIHRvIGhlbHAgeW91IGRlYnVnIHlvdXIgYXBwLlxuICAgKlxuICAgKiAqZGVidWcqIHRha2VzIGEgYHNweWAgZnVuY3Rpb24gYXMgYXJndW1lbnQsIGFuZCBydW5zIHRoYXQgZm9yIGVhY2ggZXZlbnRcbiAgICogaGFwcGVuaW5nIG9uIHRoZSBpbnB1dCBzdHJlYW0uIElmIHlvdSBkb24ndCBwcm92aWRlIHRoZSBgc3B5YCBhcmd1bWVudCxcbiAgICogdGhlbiAqZGVidWcqIHdpbGwganVzdCBgY29uc29sZS5sb2dgIGVhY2ggZXZlbnQuIFRoaXMgaGVscHMgeW91IHRvXG4gICAqIHVuZGVyc3RhbmQgdGhlIGZsb3cgb2YgZXZlbnRzIHRocm91Z2ggc29tZSBvcGVyYXRvciBjaGFpbi5cbiAgICpcbiAgICogUGxlYXNlIG5vdGUgdGhhdCBpZiB0aGUgb3V0cHV0IHN0cmVhbSBoYXMgbm8gbGlzdGVuZXJzLCB0aGVuIGl0IHdpbGwgbm90XG4gICAqIHN0YXJ0LCB3aGljaCBtZWFucyBgc3B5YCB3aWxsIG5ldmVyIHJ1biBiZWNhdXNlIG5vIGFjdHVhbCBldmVudCBoYXBwZW5zIGluXG4gICAqIHRoYXQgY2FzZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLTQtLVxuICAgKiAgICAgICAgIGRlYnVnXG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS00LS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IGxhYmVsT3JTcHkgQSBzdHJpbmcgdG8gdXNlIGFzIHRoZSBsYWJlbCB3aGVuIHByaW50aW5nXG4gICAqIGRlYnVnIGluZm9ybWF0aW9uIG9uIHRoZSBjb25zb2xlLCBvciBhICdzcHknIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYW4gZXZlbnRcbiAgICogYXMgYXJndW1lbnQsIGFuZCBkb2VzIG5vdCBuZWVkIHRvIHJldHVybiBhbnl0aGluZy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZGVidWcobGFiZWxPclNweT86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBEZWJ1ZzxUPih0aGlzLCBsYWJlbE9yU3B5KSk7XG4gIH1cblxuICAvKipcbiAgICogKmltaXRhdGUqIGNoYW5nZXMgdGhpcyBjdXJyZW50IFN0cmVhbSB0byBlbWl0IHRoZSBzYW1lIGV2ZW50cyB0aGF0IHRoZVxuICAgKiBgb3RoZXJgIGdpdmVuIFN0cmVhbSBkb2VzLiBUaGlzIG1ldGhvZCByZXR1cm5zIG5vdGhpbmcuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIGV4aXN0cyB0byBhbGxvdyBvbmUgdGhpbmc6ICoqY2lyY3VsYXIgZGVwZW5kZW5jeSBvZiBzdHJlYW1zKiouXG4gICAqIEZvciBpbnN0YW5jZSwgbGV0J3MgaW1hZ2luZSB0aGF0IGZvciBzb21lIHJlYXNvbiB5b3UgbmVlZCB0byBjcmVhdGUgYVxuICAgKiBjaXJjdWxhciBkZXBlbmRlbmN5IHdoZXJlIHN0cmVhbSBgZmlyc3QkYCBkZXBlbmRzIG9uIHN0cmVhbSBgc2Vjb25kJGBcbiAgICogd2hpY2ggaW4gdHVybiBkZXBlbmRzIG9uIGBmaXJzdCRgOlxuICAgKlxuICAgKiA8IS0tIHNraXAtZXhhbXBsZSAtLT5cbiAgICogYGBganNcbiAgICogaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknXG4gICAqXG4gICAqIHZhciBmaXJzdCQgPSBzZWNvbmQkLm1hcCh4ID0+IHggKiAxMCkudGFrZSgzKTtcbiAgICogdmFyIHNlY29uZCQgPSBmaXJzdCQubWFwKHggPT4geCArIDEpLnN0YXJ0V2l0aCgxKS5jb21wb3NlKGRlbGF5KDEwMCkpO1xuICAgKiBgYGBcbiAgICpcbiAgICogSG93ZXZlciwgdGhhdCBpcyBpbnZhbGlkIEphdmFTY3JpcHQsIGJlY2F1c2UgYHNlY29uZCRgIGlzIHVuZGVmaW5lZFxuICAgKiBvbiB0aGUgZmlyc3QgbGluZS4gVGhpcyBpcyBob3cgKmltaXRhdGUqIGNhbiBoZWxwIHNvbHZlIGl0OlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAgICpcbiAgICogdmFyIHNlY29uZFByb3h5JCA9IHhzLmNyZWF0ZSgpO1xuICAgKiB2YXIgZmlyc3QkID0gc2Vjb25kUHJveHkkLm1hcCh4ID0+IHggKiAxMCkudGFrZSgzKTtcbiAgICogdmFyIHNlY29uZCQgPSBmaXJzdCQubWFwKHggPT4geCArIDEpLnN0YXJ0V2l0aCgxKS5jb21wb3NlKGRlbGF5KDEwMCkpO1xuICAgKiBzZWNvbmRQcm94eSQuaW1pdGF0ZShzZWNvbmQkKTtcbiAgICogYGBgXG4gICAqXG4gICAqIFdlIGNyZWF0ZSBgc2Vjb25kUHJveHkkYCBiZWZvcmUgdGhlIG90aGVycywgc28gaXQgY2FuIGJlIHVzZWQgaW4gdGhlXG4gICAqIGRlY2xhcmF0aW9uIG9mIGBmaXJzdCRgLiBUaGVuLCBhZnRlciBib3RoIGBmaXJzdCRgIGFuZCBgc2Vjb25kJGAgYXJlXG4gICAqIGRlZmluZWQsIHdlIGhvb2sgYHNlY29uZFByb3h5JGAgd2l0aCBgc2Vjb25kJGAgd2l0aCBgaW1pdGF0ZSgpYCB0byB0ZWxsXG4gICAqIHRoYXQgdGhleSBhcmUgXCJ0aGUgc2FtZVwiLiBgaW1pdGF0ZWAgd2lsbCBub3QgdHJpZ2dlciB0aGUgc3RhcnQgb2YgYW55XG4gICAqIHN0cmVhbSwgaXQganVzdCBiaW5kcyBgc2Vjb25kUHJveHkkYCBhbmQgYHNlY29uZCRgIHRvZ2V0aGVyLlxuICAgKlxuICAgKiBUaGUgZm9sbG93aW5nIGlzIGFuIGV4YW1wbGUgd2hlcmUgYGltaXRhdGUoKWAgaXMgaW1wb3J0YW50IGluIEN5Y2xlLmpzXG4gICAqIGFwcGxpY2F0aW9ucy4gQSBwYXJlbnQgY29tcG9uZW50IGNvbnRhaW5zIHNvbWUgY2hpbGQgY29tcG9uZW50cy4gQSBjaGlsZFxuICAgKiBoYXMgYW4gYWN0aW9uIHN0cmVhbSB3aGljaCBpcyBnaXZlbiB0byB0aGUgcGFyZW50IHRvIGRlZmluZSBpdHMgc3RhdGU6XG4gICAqXG4gICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgKiBgYGBqc1xuICAgKiBjb25zdCBjaGlsZEFjdGlvblByb3h5JCA9IHhzLmNyZWF0ZSgpO1xuICAgKiBjb25zdCBwYXJlbnQgPSBQYXJlbnQoey4uLnNvdXJjZXMsIGNoaWxkQWN0aW9uJDogY2hpbGRBY3Rpb25Qcm94eSR9KTtcbiAgICogY29uc3QgY2hpbGRBY3Rpb24kID0gcGFyZW50LnN0YXRlJC5tYXAocyA9PiBzLmNoaWxkLmFjdGlvbiQpLmZsYXR0ZW4oKTtcbiAgICogY2hpbGRBY3Rpb25Qcm94eSQuaW1pdGF0ZShjaGlsZEFjdGlvbiQpO1xuICAgKiBgYGBcbiAgICpcbiAgICogTm90ZSwgdGhvdWdoLCB0aGF0ICoqYGltaXRhdGUoKWAgZG9lcyBub3Qgc3VwcG9ydCBNZW1vcnlTdHJlYW1zKiouIElmIHdlXG4gICAqIHdvdWxkIGF0dGVtcHQgdG8gaW1pdGF0ZSBhIE1lbW9yeVN0cmVhbSBpbiBhIGNpcmN1bGFyIGRlcGVuZGVuY3ksIHdlIHdvdWxkXG4gICAqIGVpdGhlciBnZXQgYSByYWNlIGNvbmRpdGlvbiAod2hlcmUgdGhlIHN5bXB0b20gd291bGQgYmUgXCJub3RoaW5nIGhhcHBlbnNcIilcbiAgICogb3IgYW4gaW5maW5pdGUgY3ljbGljIGVtaXNzaW9uIG9mIHZhbHVlcy4gSXQncyB1c2VmdWwgdG8gdGhpbmsgYWJvdXRcbiAgICogTWVtb3J5U3RyZWFtcyBhcyBjZWxscyBpbiBhIHNwcmVhZHNoZWV0LiBJdCBkb2Vzbid0IG1ha2UgYW55IHNlbnNlIHRvXG4gICAqIGRlZmluZSBhIHNwcmVhZHNoZWV0IGNlbGwgYEExYCB3aXRoIGEgZm9ybXVsYSB0aGF0IGRlcGVuZHMgb24gYEIxYCBhbmRcbiAgICogY2VsbCBgQjFgIGRlZmluZWQgd2l0aCBhIGZvcm11bGEgdGhhdCBkZXBlbmRzIG9uIGBBMWAuXG4gICAqXG4gICAqIElmIHlvdSBmaW5kIHlvdXJzZWxmIHdhbnRpbmcgdG8gdXNlIGBpbWl0YXRlKClgIHdpdGggYVxuICAgKiBNZW1vcnlTdHJlYW0sIHlvdSBzaG91bGQgcmV3b3JrIHlvdXIgY29kZSBhcm91bmQgYGltaXRhdGUoKWAgdG8gdXNlIGFcbiAgICogU3RyZWFtIGluc3RlYWQuIExvb2sgZm9yIHRoZSBzdHJlYW0gaW4gdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kgdGhhdFxuICAgKiByZXByZXNlbnRzIGFuIGV2ZW50IHN0cmVhbSwgYW5kIHRoYXQgd291bGQgYmUgYSBjYW5kaWRhdGUgZm9yIGNyZWF0aW5nIGFcbiAgICogcHJveHkgU3RyZWFtIHdoaWNoIHRoZW4gaW1pdGF0ZXMgdGhlIHRhcmdldCBTdHJlYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyZWFtfSB0YXJnZXQgVGhlIG90aGVyIHN0cmVhbSB0byBpbWl0YXRlIG9uIHRoZSBjdXJyZW50IG9uZS4gTXVzdFxuICAgKiBub3QgYmUgYSBNZW1vcnlTdHJlYW0uXG4gICAqL1xuICBpbWl0YXRlKHRhcmdldDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE1lbW9yeVN0cmVhbSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignQSBNZW1vcnlTdHJlYW0gd2FzIGdpdmVuIHRvIGltaXRhdGUoKSwgYnV0IGl0IG9ubHkgJyArXG4gICAgICAnc3VwcG9ydHMgYSBTdHJlYW0uIFJlYWQgbW9yZSBhYm91dCB0aGlzIHJlc3RyaWN0aW9uIGhlcmU6ICcgK1xuICAgICAgJ2h0dHBzOi8vZ2l0aHViLmNvbS9zdGFsdHoveHN0cmVhbSNmYXEnKTtcbiAgICB0aGlzLl90YXJnZXQgPSB0YXJnZXQ7XG4gICAgZm9yIChsZXQgaWxzID0gdGhpcy5faWxzLCBOID0gaWxzLmxlbmd0aCwgaSA9IDA7IGkgPCBOOyBpKyspIHRhcmdldC5fYWRkKGlsc1tpXSk7XG4gICAgdGhpcy5faWxzID0gW107XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgZ2l2ZW4gdmFsdWUgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB2YWx1ZSBUaGUgXCJuZXh0XCIgdmFsdWUgeW91IHdhbnQgdG8gYnJvYWRjYXN0IHRvIGFsbCBsaXN0ZW5lcnMgb2ZcbiAgICogdGhpcyBTdHJlYW0uXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZE5leHQodmFsdWU6IFQpIHtcbiAgICB0aGlzLl9uKHZhbHVlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiBlcnJvciB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGVycm9yIFRoZSBlcnJvciB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIHRoZSBsaXN0ZW5lcnMgb2ZcbiAgICogdGhpcyBTdHJlYW0uXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZEVycm9yKGVycm9yOiBhbnkpIHtcbiAgICB0aGlzLl9lKGVycm9yKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBcImNvbXBsZXRlZFwiIGV2ZW50IHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKi9cbiAgc2hhbWVmdWxseVNlbmRDb21wbGV0ZSgpIHtcbiAgICB0aGlzLl9jKCk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIFwiZGVidWdcIiBsaXN0ZW5lciB0byB0aGUgc3RyZWFtLiBUaGVyZSBjYW4gb25seSBiZSBvbmUgZGVidWdcbiAgICogbGlzdGVuZXIsIHRoYXQncyB3aHkgdGhpcyBpcyAnc2V0RGVidWdMaXN0ZW5lcicuIFRvIHJlbW92ZSB0aGUgZGVidWdcbiAgICogbGlzdGVuZXIsIGp1c3QgY2FsbCBzZXREZWJ1Z0xpc3RlbmVyKG51bGwpLlxuICAgKlxuICAgKiBBIGRlYnVnIGxpc3RlbmVyIGlzIGxpa2UgYW55IG90aGVyIGxpc3RlbmVyLiBUaGUgb25seSBkaWZmZXJlbmNlIGlzIHRoYXQgYVxuICAgKiBkZWJ1ZyBsaXN0ZW5lciBpcyBcInN0ZWFsdGh5XCI6IGl0cyBwcmVzZW5jZS9hYnNlbmNlIGRvZXMgbm90IHRyaWdnZXIgdGhlXG4gICAqIHN0YXJ0L3N0b3Agb2YgdGhlIHN0cmVhbSAob3IgdGhlIHByb2R1Y2VyIGluc2lkZSB0aGUgc3RyZWFtKS4gVGhpcyBpc1xuICAgKiB1c2VmdWwgc28geW91IGNhbiBpbnNwZWN0IHdoYXQgaXMgZ29pbmcgb24gd2l0aG91dCBjaGFuZ2luZyB0aGUgYmVoYXZpb3JcbiAgICogb2YgdGhlIHByb2dyYW0uIElmIHlvdSBoYXZlIGFuIGlkbGUgc3RyZWFtIGFuZCB5b3UgYWRkIGEgbm9ybWFsIGxpc3RlbmVyIHRvXG4gICAqIGl0LCB0aGUgc3RyZWFtIHdpbGwgc3RhcnQgZXhlY3V0aW5nLiBCdXQgaWYgeW91IHNldCBhIGRlYnVnIGxpc3RlbmVyIG9uIGFuXG4gICAqIGlkbGUgc3RyZWFtLCBpdCB3b24ndCBzdGFydCBleGVjdXRpbmcgKG5vdCB1bnRpbCB0aGUgZmlyc3Qgbm9ybWFsIGxpc3RlbmVyXG4gICAqIGlzIGFkZGVkKS5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCB3ZSBkb24ndCByZWNvbW1lbmQgdXNpbmcgdGhpcyBtZXRob2QgdG8gYnVpbGQgYXBwXG4gICAqIGxvZ2ljLiBJbiBmYWN0LCBpbiBtb3N0IGNhc2VzIHRoZSBkZWJ1ZyBvcGVyYXRvciB3b3JrcyBqdXN0IGZpbmUuIE9ubHkgdXNlXG4gICAqIHRoaXMgb25lIGlmIHlvdSBrbm93IHdoYXQgeW91J3JlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgKi9cbiAgc2V0RGVidWdMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4gfCBudWxsIHwgdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFsaXN0ZW5lcikge1xuICAgICAgdGhpcy5fZCA9IGZhbHNlO1xuICAgICAgdGhpcy5fZGwgPSBOTyBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9kID0gdHJ1ZTtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fbiA9IGxpc3RlbmVyLm5leHQgfHwgbm9vcDtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fZSA9IGxpc3RlbmVyLmVycm9yIHx8IG5vb3A7XG4gICAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2MgPSBsaXN0ZW5lci5jb21wbGV0ZSB8fCBub29wO1xuICAgICAgdGhpcy5fZGwgPSBsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTWVtb3J5U3RyZWFtPFQ+IGV4dGVuZHMgU3RyZWFtPFQ+IHtcbiAgcHJpdmF0ZSBfdj86IFQ7XG4gIHByaXZhdGUgX2hhcz86IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29uc3RydWN0b3IocHJvZHVjZXI6IEludGVybmFsUHJvZHVjZXI8VD4pIHtcbiAgICBzdXBlcihwcm9kdWNlcik7XG4gIH1cblxuICBfbih4OiBUKSB7XG4gICAgdGhpcy5fdiA9IHg7XG4gICAgdGhpcy5faGFzID0gdHJ1ZTtcbiAgICBzdXBlci5fbih4KTtcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHtcbiAgICAgIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YhKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMuX3N0b3BJRCAhPT0gTk8pIHtcbiAgICAgIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YhKTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zdG9wSUQpO1xuICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgfSBlbHNlIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YhKTsgZWxzZSB7XG4gICAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICAgIGlmIChwICE9PSBOTykgcC5fc3RhcnQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgdGhpcy5faGFzID0gZmFsc2U7XG4gICAgc3VwZXIuX3N0b3BOb3coKTtcbiAgfVxuXG4gIF94KCk6IHZvaWQge1xuICAgIHRoaXMuX2hhcyA9IGZhbHNlO1xuICAgIHN1cGVyLl94KCk7XG4gIH1cblxuICBtYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiB0aGlzLl9tYXAocHJvamVjdCkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgbWFwVG88VT4ocHJvamVjdGVkVmFsdWU6IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiBzdXBlci5tYXBUbyhwcm9qZWN0ZWRWYWx1ZSkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgdGFrZShhbW91bnQ6IG51bWJlcik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnRha2UoYW1vdW50KSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLmVuZFdoZW4ob3RoZXIpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIHJlcGxhY2VFcnJvcihyZXBsYWNlOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnJlcGxhY2VFcnJvcihyZXBsYWNlKSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICByZW1lbWJlcigpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGVidWcoKTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiBzdHJpbmcpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6ICh0OiBUKSA9PiBhbnkpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5kZWJ1ZyhsYWJlbE9yU3B5IGFzIGFueSkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG59XG5cbmV4cG9ydCB7Tk8sIE5PX0lMfTtcbmNvbnN0IHhzID0gU3RyZWFtO1xudHlwZSB4czxUPiA9IFN0cmVhbTxUPjtcbmV4cG9ydCBkZWZhdWx0IHhzO1xuIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuaW1wb3J0IHtydW59IGZyb20gJ0BjeWNsZS9ydW4nO1xuaW1wb3J0IHt3aXRoU3RhdGV9IGZyb20gJ0BjeWNsZS9zdGF0ZSc7XG5pbXBvcnQge2RpdiwgbGFiZWwsIGlucHV0LCBiciwgYnV0dG9uLCBtYWtlRE9NRHJpdmVyfSBmcm9tICdAY3ljbGUvZG9tJztcbmltcG9ydCB7XG4gIG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIsXG4gIFNwZWVjaFN5bnRoZXNpc0FjdGlvbjIsXG4gIG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcixcbn0gZnJvbSAnQGN5Y2xlLXJvYm90LWRyaXZlcnMvc3BlZWNoJztcblxuZnVuY3Rpb24gbWFpbihzb3VyY2VzKSB7XG4gIGNvbnN0IHZkb20kID0gc291cmNlcy5ET01cbiAgICAuc2VsZWN0KCcubXlpbnB1dCcpLmV2ZW50cygnaW5wdXQnKVxuICAgIC5tYXAoZXYgPT4gZXYudGFyZ2V0LnZhbHVlKVxuICAgIC5zdGFydFdpdGgoJycpXG4gICAgLm1hcChuYW1lID0+XG4gICAgICBkaXYoW1xuICAgICAgICBidXR0b24oJy5zYXknLCAnc2F5JyksXG4gICAgICAgIGlucHV0KCcubXlpbnB1dCcsIHthdHRyczoge3R5cGU6ICd0ZXh0J319KSxcbiAgICAgICAgYnIoKSxcbiAgICAgICAgYnV0dG9uKCdsaXN0ZW4nKSxcbiAgICAgICAgbGFiZWwoJ2hlYXJkOiBoZWxsbyEnKVxuICAgICAgXSlcbiAgICApO1xuXG4gIGNvbnN0IGNsaWNrJCA9IHNvdXJjZXMuRE9NLnNlbGVjdCgnLnNheScpLmV2ZW50cygnY2xpY2snKTtcblxuICBjb25zdCBzcGVlY2hTeW50aGVzaXNBY3Rpb24gPSBTcGVlY2hTeW50aGVzaXNBY3Rpb24yKHtcbiAgICBzdGF0ZTogc291cmNlcy5zdGF0ZSxcbiAgICBnb2FsOiBjbGljayQubWFwVG8oe2dvYWxfaWQ6ICd0ZXN0JywgZ29hbDogJ0hlbGxvJ30pLCAvL3hzLm5ldmVyKCksXG4gICAgY2FuY2VsOiB4cy5uZXZlcigpLFxuICAgIFNwZWVjaFN5bnRoZXNpczogc291cmNlcy5TcGVlY2hTeW50aGVzaXMsXG4gIH0pO1xuXG4gIHNvdXJjZXMuc3RhdGUuc3RyZWFtLmFkZExpc3RlbmVyKHtuZXh0OiBzID0+IGNvbnNvbGUubG9nKHMpfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBET006IHZkb20kLFxuICAgIFNwZWVjaFN5bnRoZXNpczogc3BlZWNoU3ludGhlc2lzQWN0aW9uLlNwZWVjaFN5bnRoZXNpcyxcbiAgICBzdGF0ZTogc3BlZWNoU3ludGhlc2lzQWN0aW9uLnN0YXRlLFxuICB9O1xufVxuXG5ydW4od2l0aFN0YXRlKG1haW4pLCB7XG4gIERPTTogbWFrZURPTURyaXZlcignI2FwcCcpLFxuICBTcGVlY2hTeW50aGVzaXM6IG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIoKSxcbiAgU3BlZWNoUmVjb2duaXRpb246IG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcigpLFxufSk7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgIGZvciAodmFyIHMsIGkgPSAxLCBuID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICB0W3BdID0gc1twXTtcbiAgICB9XG4gICAgcmV0dXJuIHQ7XG59O1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbVwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBhY3Rpb25fMSA9IHJlcXVpcmUoXCJAY3ljbGUtcm9ib3QtZHJpdmVycy9hY3Rpb25cIik7XG52YXIgU3RhdGU7XG4oZnVuY3Rpb24gKFN0YXRlKSB7XG4gICAgU3RhdGVbXCJSVU5OSU5HXCJdID0gXCJSVU5OSU5HXCI7XG4gICAgU3RhdGVbXCJET05FXCJdID0gXCJET05FXCI7XG4gICAgU3RhdGVbXCJQUkVFTVBUSU5HXCJdID0gXCJQUkVFTVBUSU5HXCI7XG59KShTdGF0ZSB8fCAoU3RhdGUgPSB7fSkpO1xudmFyIElucHV0VHlwZTtcbihmdW5jdGlvbiAoSW5wdXRUeXBlKSB7XG4gICAgSW5wdXRUeXBlW1wiR09BTFwiXSA9IFwiR09BTFwiO1xuICAgIElucHV0VHlwZVtcIkNBTkNFTFwiXSA9IFwiQ0FOQ0VMXCI7XG4gICAgSW5wdXRUeXBlW1wiU1RBUlRcIl0gPSBcIlNUQVJUXCI7XG4gICAgSW5wdXRUeXBlW1wiRU5EXCJdID0gXCJFTkRcIjtcbiAgICBJbnB1dFR5cGVbXCJFUlJPUlwiXSA9IFwiRVJST1JcIjtcbiAgICBJbnB1dFR5cGVbXCJSRVNVTFRcIl0gPSBcIlJFU1VMVFwiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xuO1xuZnVuY3Rpb24gaW5wdXQoZ29hbCQsIHN0YXJ0RXZlbnQkLCBlbmRFdmVudCQsIGVycm9yRXZlbnQkLCByZXN1bHRFdmVudCQpIHtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoZ29hbCQuZmlsdGVyKGZ1bmN0aW9uIChnb2FsKSB7IHJldHVybiB0eXBlb2YgZ29hbCAhPT0gJ3VuZGVmaW5lZCc7IH0pLm1hcChmdW5jdGlvbiAoZ29hbCkge1xuICAgICAgICBpZiAoZ29hbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBJbnB1dFR5cGUuQ0FOQ0VMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgdHlwZTogSW5wdXRUeXBlLkdPQUwsXG4gICAgICAgICAgICAgICAgdmFsdWU6ICEhZ29hbC5nb2FsX2lkID8gZ29hbCA6IGFjdGlvbl8xLmluaXRHb2FsKGdvYWwpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH0pLCBzdGFydEV2ZW50JC5tYXBUbyh7IHR5cGU6IElucHV0VHlwZS5TVEFSVCwgdmFsdWU6IG51bGwgfSksIGVuZEV2ZW50JC5tYXBUbyh7IHR5cGU6IElucHV0VHlwZS5FTkQsIHZhbHVlOiBudWxsIH0pLCBlcnJvckV2ZW50JC5tYXAoZnVuY3Rpb24gKGV2ZW50KSB7IHJldHVybiAoeyB0eXBlOiBJbnB1dFR5cGUuRVJST1IsIHZhbHVlOiBldmVudCB9KTsgfSksIHJlc3VsdEV2ZW50JC5tYXAoZnVuY3Rpb24gKGV2ZW50KSB7IHJldHVybiAoeyB0eXBlOiBJbnB1dFR5cGUuUkVTVUxULCB2YWx1ZTogZXZlbnQgfSk7IH0pKTtcbn1cbnZhciB0cmFuc2l0aW9uVGFibGUgPSAoX2EgPSB7fSxcbiAgICBfYVtTdGF0ZS5ET05FXSA9IChfYiA9IHt9LFxuICAgICAgICBfYltJbnB1dFR5cGUuR09BTF0gPSBTdGF0ZS5SVU5OSU5HLFxuICAgICAgICBfYiksXG4gICAgX2FbU3RhdGUuUlVOTklOR10gPSAoX2MgPSB7fSxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkdPQUxdID0gU3RhdGUuUFJFRU1QVElORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkNBTkNFTF0gPSBTdGF0ZS5QUkVFTVBUSU5HLFxuICAgICAgICBfY1tJbnB1dFR5cGUuU1RBUlRdID0gU3RhdGUuUlVOTklORyxcbiAgICAgICAgX2NbSW5wdXRUeXBlLkVORF0gPSBTdGF0ZS5ET05FLFxuICAgICAgICBfYyksXG4gICAgX2FbU3RhdGUuUFJFRU1QVElOR10gPSAoX2QgPSB7fSxcbiAgICAgICAgX2RbSW5wdXRUeXBlLkVORF0gPSBTdGF0ZS5ET05FLFxuICAgICAgICBfZCksXG4gICAgX2EpO1xuZnVuY3Rpb24gdHJhbnNpdGlvbihwcmV2U3RhdGUsIHByZXZWYXJpYWJsZXMsIGlucHV0KSB7XG4gICAgdmFyIHN0YXRlcyA9IHRyYW5zaXRpb25UYWJsZVtwcmV2U3RhdGVdO1xuICAgIGlmICghc3RhdGVzKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcHJldlN0YXRlPVxcXCJcIiArIHByZXZTdGF0ZSArIFwiXFxcIlwiKTtcbiAgICB9XG4gICAgdmFyIHN0YXRlID0gc3RhdGVzW2lucHV0LnR5cGVdO1xuICAgIGlmICghc3RhdGUpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlVuZGVmaW5lZCB0cmFuc2l0aW9uIGZvciBcXFwiXCIgKyBwcmV2U3RhdGUgKyBcIlxcXCIgXFxcIlwiICsgaW5wdXQudHlwZSArIFwiXFxcIjsgXCJcbiAgICAgICAgICAgICsgXCJzZXQgc3RhdGUgdG8gcHJldlN0YXRlXCIpO1xuICAgICAgICBzdGF0ZSA9IHByZXZTdGF0ZTtcbiAgICB9XG4gICAgaWYgKHByZXZTdGF0ZSA9PT0gU3RhdGUuRE9ORSAmJiBzdGF0ZSA9PT0gU3RhdGUuUlVOTklORykge1xuICAgICAgICAvLyBTdGFydCBhIG5ldyBnb2FsXG4gICAgICAgIHZhciBnb2FsID0gaW5wdXQudmFsdWU7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBnb2FsLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgdHJhbnNjcmlwdDogbnVsbCxcbiAgICAgICAgICAgICAgICBlcnJvcjogbnVsbCxcbiAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICBhcmdzOiBnb2FsLmdvYWxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyAmJiBzdGF0ZSA9PT0gU3RhdGUuUlVOTklORykge1xuICAgICAgICBpZiAoaW5wdXQudHlwZSA9PT0gSW5wdXRUeXBlLlJFU1VMVCkge1xuICAgICAgICAgICAgdmFyIGV2ZW50XzEgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgICAgIHZhciBsYXN0ID0gZXZlbnRfMS5yZXN1bHRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB2YXIgdHJhbnNjcmlwdCA9IGV2ZW50XzEucmVzdWx0c1tsYXN0XVswXS50cmFuc2NyaXB0O1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBfX2Fzc2lnbih7fSwgcHJldlZhcmlhYmxlcywgeyB0cmFuc2NyaXB0OiB0cmFuc2NyaXB0IH0pLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuRVJST1IpIHtcbiAgICAgICAgICAgIHZhciBldmVudF8yID0gaW5wdXQudmFsdWU7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IF9fYXNzaWduKHt9LCBwcmV2VmFyaWFibGVzLCB7IGVycm9yOiBldmVudF8yLmVycm9yIH0pLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmIChzdGF0ZSA9PT0gU3RhdGUuRE9ORSkge1xuICAgICAgICBpZiAocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HIHx8IHByZXZTdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORykge1xuICAgICAgICAgICAgLy8gU3RvcCB0aGUgY3VycmVudCBnb2FsIGFuZCBzdGFydCB0aGUgcXVldWVkIG5ldyBnb2FsXG4gICAgICAgICAgICB2YXIgbmV3R29hbCA9IHByZXZWYXJpYWJsZXMubmV3R29hbDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6ICEhbmV3R29hbCA/IFN0YXRlLlJVTk5JTkcgOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogISFuZXdHb2FsID8gbmV3R29hbC5nb2FsX2lkIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgdHJhbnNjcmlwdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiAhIW5ld0dvYWwgPyB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IG5ld0dvYWwuZ29hbCxcbiAgICAgICAgICAgICAgICB9IDogbnVsbCxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBwcmV2VmFyaWFibGVzLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgJiYgIXByZXZWYXJpYWJsZXMuZXJyb3IpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBhY3Rpb25fMS5TdGF0dXMuU1VDQ0VFREVEXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiAoISFwcmV2VmFyaWFibGVzLmVycm9yKSA/IGFjdGlvbl8xLlN0YXR1cy5BQk9SVEVEIDogYWN0aW9uXzEuU3RhdHVzLlBSRUVNUFRFRCxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0OiAocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HICYmICFwcmV2VmFyaWFibGVzLmVycm9yKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyAocHJldlZhcmlhYmxlcy50cmFuc2NyaXB0IHx8ICcnKSAvLyAnJyBmb3Igbm9uLXNwZWVjaCBpbnB1dHNcbiAgICAgICAgICAgICAgICAgICAgICAgIDogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICgocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HIHx8IHByZXZTdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORylcbiAgICAgICAgJiYgc3RhdGUgPT09IFN0YXRlLlBSRUVNUFRJTkcpIHtcbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5HT0FMIHx8IGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5DQU5DRUwpIHtcbiAgICAgICAgICAgIC8vIFN0YXJ0IHN0b3BwaW5nIHRoZSBjdXJyZW50IGdvYWwgYW5kIHF1ZXVlIGEgbmV3IGdvYWwgaWYgcmVjZWl2ZWQgb25lXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IF9fYXNzaWduKHt9LCBwcmV2VmFyaWFibGVzLCB7IG5ld0dvYWw6IGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5HT0FMID8gaW5wdXQudmFsdWUgOiBudWxsIH0pLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyA/IHtcbiAgICAgICAgICAgICAgICAgICAgYXJnczogbnVsbCxcbiAgICAgICAgICAgICAgICB9IDogbnVsbCxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXRlOiBwcmV2U3RhdGUsXG4gICAgICAgIHZhcmlhYmxlczogcHJldlZhcmlhYmxlcyxcbiAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgIH07XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gaW5pdFJlZHVjZXIocHJldikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgIHRyYW5zY3JpcHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgZXJyb3I6IG51bGwsXG4gICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciBpbnB1dFJlZHVjZXIkID0gaW5wdXQkXG4gICAgICAgIC5tYXAoZnVuY3Rpb24gKGlucHV0KSB7IHJldHVybiBmdW5jdGlvbiBpbnB1dFJlZHVjZXIocHJldikge1xuICAgICAgICByZXR1cm4gdHJhbnNpdGlvbihwcmV2LnN0YXRlLCBwcmV2LnZhcmlhYmxlcywgaW5wdXQpO1xuICAgIH07IH0pO1xuICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5tZXJnZShpbml0UmVkdWNlciQsIGlucHV0UmVkdWNlciQpO1xufVxuLyoqXG4gKiBXZWIgU3BlZWNoIEFQSSdzIFtTcGVlY2hSZWNvZ25pdGlvbl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFJlY29nbml0aW9uKVxuICogYWN0aW9uIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gc291cmNlc1xuICpcbiAqICAgKiBnb2FsOiBhIHN0cmVhbSBvZiBgbnVsbGAgKGFzIFwiY2FuY2VsXCIpIG9yIGBTcGVlY2hSZWNvZ25pdGlvbmBcbiAqICAgICBwcm9wZXJ0aWVzIChhcyBcImdvYWxcIikuXG4gKiAgICogU3BlZWNoU3ludGhlc2lzOiBgRXZlbnRTb3VyY2VgIGZvciBgc3RhcnRgLCBgZW5kYCwgYGVycm9yYCwgYHJlc3VsdGBcbiAqICAgICBldmVudHMuXG4gKlxuICogQHJldHVybiBzaW5rc1xuICpcbiAqICAgKiBvdXRwdXQ6IGEgc3RyZWFtIGZvciB0aGUgU3BlZWNoUmVjb2duaXRpb24gZHJpdmVyIGlucHV0LlxuICogICAqIHJlc3VsdDogYSBzdHJlYW0gb2YgYWN0aW9uIHJlc3VsdHMuIGByZXN1bHQucmVzdWx0YCBpcyBhIHRyYW5zY3JpcHQgZnJvbVxuICogICAgIHRoZSByZWNvZ25pdGlvbjsgaXQgd2lsbCBiZSBgJydgIGZvciBub24tc3BlZWNoIGlucHV0cy5cbiAqXG4gKi9cbmZ1bmN0aW9uIFNwZWVjaFJlY29nbml0aW9uQWN0aW9uKHNvdXJjZXMpIHtcbiAgICB2YXIgaW5wdXQkID0gaW5wdXQoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5nb2FsKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5TcGVlY2hSZWNvZ25pdGlvbi5ldmVudHMoJ3N0YXJ0JykpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uLmV2ZW50cygnZW5kJykpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFJlY29nbml0aW9uLmV2ZW50cygnZXJyb3InKSksIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuU3BlZWNoUmVjb2duaXRpb24uZXZlbnRzKCdyZXN1bHQnKSkpO1xuICAgIHZhciBzdGF0ZSQgPSB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpXG4gICAgICAgIC5mb2xkKGZ1bmN0aW9uIChzdGF0ZSwgcmVkdWNlcikgeyByZXR1cm4gcmVkdWNlcihzdGF0ZSk7IH0sIG51bGwpXG4gICAgICAgIC5kcm9wKDEpOyAvLyBkcm9wIFwibnVsbFwiXG4gICAgdmFyIG91dHB1dHMkID0gc3RhdGUkLm1hcChmdW5jdGlvbiAoc3RhdGUpIHsgcmV0dXJuIHN0YXRlLm91dHB1dHM7IH0pXG4gICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuICEhb3V0cHV0czsgfSk7XG4gICAgdmFyIHJlc3VsdCQgPSBzdGF0ZSQubWFwKGZ1bmN0aW9uIChzdGF0ZSkgeyByZXR1cm4gc3RhdGUucmVzdWx0OyB9KS5maWx0ZXIoZnVuY3Rpb24gKHJlc3VsdCkgeyByZXR1cm4gISFyZXN1bHQ7IH0pO1xuICAgIHJldHVybiB7XG4gICAgICAgIG91dHB1dDogYWRhcHRfMS5hZGFwdChvdXRwdXRzJC5tYXAoZnVuY3Rpb24gKG91dHB1dHMpIHsgcmV0dXJuIG91dHB1dHMuYXJnczsgfSkpLFxuICAgICAgICByZXN1bHQ6IGFkYXB0XzEuYWRhcHQocmVzdWx0JCksXG4gICAgfTtcbn1cbmV4cG9ydHMuU3BlZWNoUmVjb2duaXRpb25BY3Rpb24gPSBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjtcbnZhciBfYSwgX2IsIF9jLCBfZDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNwZWVjaFJlY29nbml0aW9uQWN0aW9uLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fYXNzaWduID0gKHRoaXMgJiYgdGhpcy5fX2Fzc2lnbikgfHwgT2JqZWN0LmFzc2lnbiB8fCBmdW5jdGlvbih0KSB7XG4gICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgIGZvciAodmFyIHAgaW4gcykgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzLCBwKSlcbiAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIH1cbiAgICByZXR1cm4gdDtcbn07XG52YXIgX19pbXBvcnREZWZhdWx0ID0gKHRoaXMgJiYgdGhpcy5fX2ltcG9ydERlZmF1bHQpIHx8IGZ1bmN0aW9uIChtb2QpIHtcbiAgICByZXR1cm4gKG1vZCAmJiBtb2QuX19lc01vZHVsZSkgPyBtb2QgOiB7IFwiZGVmYXVsdFwiOiBtb2QgfTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtXCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIGFjdGlvbl8xID0gcmVxdWlyZShcIkBjeWNsZS1yb2JvdC1kcml2ZXJzL2FjdGlvblwiKTtcbnZhciBTdGF0ZTtcbihmdW5jdGlvbiAoU3RhdGUpIHtcbiAgICBTdGF0ZVtcIlJVTk5JTkdcIl0gPSBcIlJVTk5JTkdcIjtcbiAgICBTdGF0ZVtcIkRPTkVcIl0gPSBcIkRPTkVcIjtcbiAgICBTdGF0ZVtcIlBSRUVNUFRJTkdcIl0gPSBcIlBSRUVNUFRJTkdcIjtcbn0pKFN0YXRlIHx8IChTdGF0ZSA9IHt9KSk7XG52YXIgSW5wdXRUeXBlO1xuKGZ1bmN0aW9uIChJbnB1dFR5cGUpIHtcbiAgICBJbnB1dFR5cGVbXCJHT0FMXCJdID0gXCJHT0FMXCI7XG4gICAgSW5wdXRUeXBlW1wiQ0FOQ0VMXCJdID0gXCJDQU5DRUxcIjtcbiAgICBJbnB1dFR5cGVbXCJTVEFSVFwiXSA9IFwiU1RBUlRcIjtcbiAgICBJbnB1dFR5cGVbXCJFTkRcIl0gPSBcIkVORFwiO1xufSkoSW5wdXRUeXBlIHx8IChJbnB1dFR5cGUgPSB7fSkpO1xuO1xuZnVuY3Rpb24gaW5wdXQoZ29hbCQsIHN0YXJ0RXZlbnQkLCBlbmRFdmVudCQpIHtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoZ29hbCQuZmlsdGVyKGZ1bmN0aW9uIChnb2FsKSB7IHJldHVybiB0eXBlb2YgZ29hbCAhPT0gJ3VuZGVmaW5lZCc7IH0pLm1hcChmdW5jdGlvbiAoZ29hbCkge1xuICAgICAgICBpZiAoZ29hbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBJbnB1dFR5cGUuQ0FOQ0VMLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBudWxsLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9ICEhZ29hbC5nb2FsX2lkID8gZ29hbCA6IGFjdGlvbl8xLmluaXRHb2FsKGdvYWwpO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBJbnB1dFR5cGUuR09BTCxcbiAgICAgICAgICAgICAgICB2YWx1ZTogdHlwZW9mIHZhbHVlLmdvYWwgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogdmFsdWUuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvYWw6IHsgdGV4dDogdmFsdWUuZ29hbCB9LFxuICAgICAgICAgICAgICAgICAgICB9IDogdmFsdWUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSksIHN0YXJ0RXZlbnQkLm1hcFRvKHsgdHlwZTogSW5wdXRUeXBlLlNUQVJULCB2YWx1ZTogbnVsbCB9KSwgZW5kRXZlbnQkLm1hcFRvKHsgdHlwZTogSW5wdXRUeXBlLkVORCwgdmFsdWU6IG51bGwgfSkpO1xufVxudmFyIHRyYW5zaXRpb25UYWJsZSA9IChfYSA9IHt9LFxuICAgIF9hW1N0YXRlLkRPTkVdID0gKF9iID0ge30sXG4gICAgICAgIF9iW0lucHV0VHlwZS5HT0FMXSA9IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgIF9iKSxcbiAgICBfYVtTdGF0ZS5SVU5OSU5HXSA9IChfYyA9IHt9LFxuICAgICAgICBfY1tJbnB1dFR5cGUuR09BTF0gPSBTdGF0ZS5QUkVFTVBUSU5HLFxuICAgICAgICBfY1tJbnB1dFR5cGUuQ0FOQ0VMXSA9IFN0YXRlLlBSRUVNUFRJTkcsXG4gICAgICAgIF9jW0lucHV0VHlwZS5TVEFSVF0gPSBTdGF0ZS5SVU5OSU5HLFxuICAgICAgICBfY1tJbnB1dFR5cGUuRU5EXSA9IFN0YXRlLkRPTkUsXG4gICAgICAgIF9jKSxcbiAgICBfYVtTdGF0ZS5QUkVFTVBUSU5HXSA9IChfZCA9IHt9LFxuICAgICAgICBfZFtJbnB1dFR5cGUuRU5EXSA9IFN0YXRlLkRPTkUsXG4gICAgICAgIF9kKSxcbiAgICBfYSk7XG5mdW5jdGlvbiB0cmFuc2l0aW9uKHByZXZTdGF0ZSwgcHJldlZhcmlhYmxlcywgaW5wdXQpIHtcbiAgICB2YXIgc3RhdGVzID0gdHJhbnNpdGlvblRhYmxlW3ByZXZTdGF0ZV07XG4gICAgaWYgKCFzdGF0ZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBwcmV2U3RhdGU9XFxcIlwiICsgcHJldlN0YXRlICsgXCJcXFwiXCIpO1xuICAgIH1cbiAgICB2YXIgc3RhdGUgPSBzdGF0ZXNbaW5wdXQudHlwZV07XG4gICAgaWYgKCFzdGF0ZSkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiVW5kZWZpbmVkIHRyYW5zaXRpb24gZm9yIFxcXCJcIiArIHByZXZTdGF0ZSArIFwiXFxcIiBcXFwiXCIgKyBpbnB1dC50eXBlICsgXCJcXFwiOyBcIlxuICAgICAgICAgICAgKyBcInNldCBzdGF0ZSB0byBwcmV2U3RhdGVcIik7XG4gICAgICAgIHN0YXRlID0gcHJldlN0YXRlO1xuICAgIH1cbiAgICBpZiAocHJldlN0YXRlID09PSBTdGF0ZS5ET05FICYmIHN0YXRlID09PSBTdGF0ZS5SVU5OSU5HKSB7XG4gICAgICAgIC8vIFN0YXJ0IGEgbmV3IGdvYWxcbiAgICAgICAgdmFyIGdvYWwgPSBpbnB1dC52YWx1ZTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgIGdvYWxfaWQ6IGdvYWwuZ29hbF9pZCxcbiAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICBhcmdzOiBnb2FsLmdvYWxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2UgaWYgKHN0YXRlID09PSBTdGF0ZS5ET05FKSB7XG4gICAgICAgIGlmIChwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkcgfHwgcHJldlN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKSB7XG4gICAgICAgICAgICAvLyBTdG9wIHRoZSBjdXJyZW50IGdvYWwgYW5kIHN0YXJ0IHRoZSBxdWV1ZWQgbmV3IGdvYWxcbiAgICAgICAgICAgIHZhciBuZXdHb2FsID0gcHJldlZhcmlhYmxlcy5uZXdHb2FsO1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogISFuZXdHb2FsID8gU3RhdGUuUlVOTklORyA6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczoge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiAhIW5ld0dvYWwgPyBuZXdHb2FsLmdvYWxfaWQgOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBuZXdHb2FsOiBudWxsLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3V0cHV0czogISFuZXdHb2FsID8ge1xuICAgICAgICAgICAgICAgICAgICBhcmdzOiBuZXdHb2FsLmdvYWwsXG4gICAgICAgICAgICAgICAgfSA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldlZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQgOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoKHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyB8fCBwcmV2U3RhdGUgPT09IFN0YXRlLlBSRUVNUFRJTkcpXG4gICAgICAgICYmIHN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKSB7XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuR09BTCB8fCBpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuQ0FOQ0VMKSB7XG4gICAgICAgICAgICAvLyBTdGFydCBzdG9wcGluZyB0aGUgY3VycmVudCBnb2FsIGFuZCBxdWV1ZSBhIG5ldyBnb2FsIGlmIHJlY2VpdmVkIG9uZVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBfX2Fzc2lnbih7fSwgcHJldlZhcmlhYmxlcywgeyBuZXdHb2FsOiBpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuR09BTCA/IGlucHV0LnZhbHVlIDogbnVsbCB9KSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuU1RBUlQpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgICAgIHZhcmlhYmxlczogcHJldlZhcmlhYmxlcyxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3M6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIHN0YXRlOiBwcmV2U3RhdGUsXG4gICAgICAgIHZhcmlhYmxlczogcHJldlZhcmlhYmxlcyxcbiAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgIH07XG59XG5mdW5jdGlvbiB0cmFuc2l0aW9uUmVkdWNlcihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gaW5pdFJlZHVjZXIocHJldikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICB2YXIgaW5wdXRSZWR1Y2VyJCA9IGlucHV0JFxuICAgICAgICAubWFwKGZ1bmN0aW9uIChpbnB1dCkgeyByZXR1cm4gZnVuY3Rpb24gaW5wdXRSZWR1Y2VyKHByZXYpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24ocHJldi5zdGF0ZSwgcHJldi52YXJpYWJsZXMsIGlucHV0KTtcbiAgICB9OyB9KTtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoaW5pdFJlZHVjZXIkLCBpbnB1dFJlZHVjZXIkKTtcbn1cbi8qKlxuICogV2ViIFNwZWVjaCBBUEkncyBbU3BlZWNoU3ludGhlc2lzXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoU3ludGhlc2lzKVxuICogYWN0aW9uIGNvbXBvbmVudC5cbiAqXG4gKiBAcGFyYW0gc291cmNlc1xuICpcbiAqICAgKiBnb2FsOiBhIHN0cmVhbSBvZiBgbnVsbGAgKGFzIFwiY2FuY2VsXCIpIG9yIGBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VgXG4gKiAgICAgcHJvcGVydGllcyAoYXMgXCJnb2FsXCIpLlxuICogICAqIFNwZWVjaFN5bnRoZXNpczogYEV2ZW50U291cmNlYCBmb3IgYHN0YXJ0YCBhbmQgYGVuZGAgZXZlbnRzLlxuICpcbiAqIEByZXR1cm4gc2lua3NcbiAqXG4gKiAgICogb3V0cHV0OiBhIHN0cmVhbSBmb3IgdGhlIFNwZWVjaFN5bnRoZXNpcyBkcml2ZXIgaW5wdXQuXG4gKiAgICogcmVzdWx0OiBhIHN0cmVhbSBvZiBhY3Rpb24gcmVzdWx0cy4gYHJlc3VsdC5yZXN1bHRgIGlzIGFsd2F5cyBgbnVsbGAuXG4gKlxuICovXG5mdW5jdGlvbiBTcGVlY2hTeW50aGVzaXNBY3Rpb24oc291cmNlcykge1xuICAgIHZhciBpbnB1dCQgPSBpbnB1dCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLmdvYWwpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFN5bnRoZXNpcy5ldmVudHMoJ3N0YXJ0JykpLCB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzb3VyY2VzLlNwZWVjaFN5bnRoZXNpcy5ldmVudHMoJ2VuZCcpKSk7XG4gICAgdmFyIHN0YXRlJCA9IHRyYW5zaXRpb25SZWR1Y2VyKGlucHV0JClcbiAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgbnVsbClcbiAgICAgICAgLmRyb3AoMSk7IC8vIGRyb3AgXCJudWxsXCJcbiAgICB2YXIgb3V0cHV0cyQgPSBzdGF0ZSQubWFwKGZ1bmN0aW9uIChzdGF0ZSkgeyByZXR1cm4gc3RhdGUub3V0cHV0czsgfSlcbiAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gISFvdXRwdXRzOyB9KTtcbiAgICB2YXIgcmVzdWx0JCA9IHN0YXRlJC5tYXAoZnVuY3Rpb24gKHN0YXRlKSB7IHJldHVybiBzdGF0ZS5yZXN1bHQ7IH0pLmZpbHRlcihmdW5jdGlvbiAocmVzdWx0KSB7IHJldHVybiAhIXJlc3VsdDsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgb3V0cHV0OiBhZGFwdF8xLmFkYXB0KG91dHB1dHMkLm1hcChmdW5jdGlvbiAob3V0cHV0cykgeyByZXR1cm4gb3V0cHV0cy5hcmdzOyB9KSksXG4gICAgICAgIHJlc3VsdDogYWRhcHRfMS5hZGFwdChyZXN1bHQkKSxcbiAgICB9O1xufVxuZXhwb3J0cy5TcGVlY2hTeW50aGVzaXNBY3Rpb24gPSBTcGVlY2hTeW50aGVzaXNBY3Rpb247XG47XG5mdW5jdGlvbiBpbnB1dDIoZ29hbCQsIGNhbmNlbCQsIHN0YXJ0RXZlbnQkLCBlbmRFdmVudCQpIHtcbiAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQubWVyZ2UoZ29hbCQubWFwKGZ1bmN0aW9uIChnb2FsKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBJbnB1dFR5cGUuR09BTCxcbiAgICAgICAgICAgIHZhbHVlOiB0eXBlb2YgZ29hbC5nb2FsID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgID8ge1xuICAgICAgICAgICAgICAgICAgICBnb2FsX2lkOiBnb2FsLmdvYWxfaWQsXG4gICAgICAgICAgICAgICAgICAgIGdvYWw6IHsgdGV4dDogZ29hbC5nb2FsIH0sXG4gICAgICAgICAgICAgICAgfSA6IGdvYWwsXG4gICAgICAgIH07XG4gICAgfSksIGNhbmNlbCQubWFwVG8oeyB0eXBlOiBJbnB1dFR5cGUuQ0FOQ0VMLCB2YWx1ZTogbnVsbCB9KSwgc3RhcnRFdmVudCQubWFwVG8oeyB0eXBlOiBJbnB1dFR5cGUuU1RBUlQsIHZhbHVlOiBudWxsIH0pLCBlbmRFdmVudCQubWFwVG8oeyB0eXBlOiBJbnB1dFR5cGUuRU5ELCB2YWx1ZTogbnVsbCB9KSk7XG59XG52YXIgdHJhbnNpdGlvblRhYmxlMiA9IChfZSA9IHt9LFxuICAgIF9lW1N0YXRlLkRPTkVdID0gKF9mID0ge30sXG4gICAgICAgIF9mW0lucHV0VHlwZS5HT0FMXSA9IFN0YXRlLlJVTk5JTkcsXG4gICAgICAgIF9mKSxcbiAgICBfZVtTdGF0ZS5SVU5OSU5HXSA9IChfZyA9IHt9LFxuICAgICAgICBfZ1tJbnB1dFR5cGUuR09BTF0gPSBTdGF0ZS5QUkVFTVBUSU5HLFxuICAgICAgICBfZ1tJbnB1dFR5cGUuQ0FOQ0VMXSA9IFN0YXRlLlBSRUVNUFRJTkcsXG4gICAgICAgIF9nW0lucHV0VHlwZS5TVEFSVF0gPSBTdGF0ZS5SVU5OSU5HLFxuICAgICAgICBfZ1tJbnB1dFR5cGUuRU5EXSA9IFN0YXRlLkRPTkUsXG4gICAgICAgIF9nKSxcbiAgICBfZVtTdGF0ZS5QUkVFTVBUSU5HXSA9IChfaCA9IHt9LFxuICAgICAgICBfaFtJbnB1dFR5cGUuRU5EXSA9IFN0YXRlLkRPTkUsXG4gICAgICAgIF9oKSxcbiAgICBfZSk7XG5mdW5jdGlvbiB0cmFuc2l0aW9uMihwcmV2U3RhdGUsIHByZXZWYXJpYWJsZXMsIGlucHV0KSB7XG4gICAgdmFyIHN0YXRlcyA9IHRyYW5zaXRpb25UYWJsZTJbcHJldlN0YXRlXTtcbiAgICBpZiAoIXN0YXRlcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHByZXZTdGF0ZT1cXFwiXCIgKyBwcmV2U3RhdGUgKyBcIlxcXCJcIik7XG4gICAgfVxuICAgIHZhciBzdGF0ZSA9IHN0YXRlc1tpbnB1dC50eXBlXTtcbiAgICBpZiAoIXN0YXRlKSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJVbmRlZmluZWQgdHJhbnNpdGlvbiBmb3IgXFxcIlwiICsgcHJldlN0YXRlICsgXCJcXFwiIFxcXCJcIiArIGlucHV0LnR5cGUgKyBcIlxcXCI7IFwiXG4gICAgICAgICAgICArIFwic2V0IHN0YXRlIHRvIHByZXZTdGF0ZVwiKTtcbiAgICAgICAgc3RhdGUgPSBwcmV2U3RhdGU7XG4gICAgfVxuICAgIGlmIChwcmV2U3RhdGUgPT09IFN0YXRlLkRPTkUgJiYgc3RhdGUgPT09IFN0YXRlLlJVTk5JTkcpIHtcbiAgICAgICAgLy8gU3RhcnQgYSBuZXcgZ29hbFxuICAgICAgICB2YXIgZ29hbCA9IGlucHV0LnZhbHVlO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IHN0YXRlLFxuICAgICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICAgICAgZ29hbF9pZDogZ29hbC5nb2FsX2lkLFxuICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0cHV0czoge1xuICAgICAgICAgICAgICAgIFNwZWVjaFN5bnRoZXNpczogZ29hbC5nb2FsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVzdWx0OiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmIChzdGF0ZSA9PT0gU3RhdGUuRE9ORSkge1xuICAgICAgICBpZiAocHJldlN0YXRlID09PSBTdGF0ZS5SVU5OSU5HIHx8IHByZXZTdGF0ZSA9PT0gU3RhdGUuUFJFRU1QVElORykge1xuICAgICAgICAgICAgLy8gU3RvcCB0aGUgY3VycmVudCBnb2FsIGFuZCBzdGFydCB0aGUgcXVldWVkIG5ldyBnb2FsXG4gICAgICAgICAgICB2YXIgbmV3R29hbCA9IHByZXZWYXJpYWJsZXMubmV3R29hbDtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgc3RhdGU6ICEhbmV3R29hbCA/IFN0YXRlLlJVTk5JTkcgOiBzdGF0ZSxcbiAgICAgICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogISFuZXdHb2FsID8gbmV3R29hbC5nb2FsX2lkIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgbmV3R29hbDogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG91dHB1dHM6ICEhbmV3R29hbCA/IHtcbiAgICAgICAgICAgICAgICAgICAgU3BlZWNoU3ludGhlc2lzOiBuZXdHb2FsLmdvYWwsXG4gICAgICAgICAgICAgICAgfSA6IG51bGwsXG4gICAgICAgICAgICAgICAgcmVzdWx0OiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29hbF9pZDogcHJldlZhcmlhYmxlcy5nb2FsX2lkLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzOiBwcmV2U3RhdGUgPT09IFN0YXRlLlJVTk5JTkdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGFjdGlvbl8xLlN0YXR1cy5TVUNDRUVERUQgOiBhY3Rpb25fMS5TdGF0dXMuUFJFRU1QVEVELFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoKHByZXZTdGF0ZSA9PT0gU3RhdGUuUlVOTklORyB8fCBwcmV2U3RhdGUgPT09IFN0YXRlLlBSRUVNUFRJTkcpXG4gICAgICAgICYmIHN0YXRlID09PSBTdGF0ZS5QUkVFTVBUSU5HKSB7XG4gICAgICAgIGlmIChpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuR09BTCB8fCBpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuQ0FOQ0VMKSB7XG4gICAgICAgICAgICAvLyBTdGFydCBzdG9wcGluZyB0aGUgY3VycmVudCBnb2FsIGFuZCBxdWV1ZSBhIG5ldyBnb2FsIGlmIHJlY2VpdmVkIG9uZVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBfX2Fzc2lnbih7fSwgcHJldlZhcmlhYmxlcywgeyBuZXdHb2FsOiBpbnB1dC50eXBlID09PSBJbnB1dFR5cGUuR09BTCA/IGlucHV0LnZhbHVlIDogbnVsbCB9KSxcbiAgICAgICAgICAgICAgICBvdXRwdXRzOiB7XG4gICAgICAgICAgICAgICAgICAgIFNwZWVjaFN5bnRoZXNpczogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlucHV0LnR5cGUgPT09IElucHV0VHlwZS5TVEFSVCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdGF0ZTogc3RhdGUsXG4gICAgICAgICAgICAgICAgdmFyaWFibGVzOiBwcmV2VmFyaWFibGVzLFxuICAgICAgICAgICAgICAgIG91dHB1dHM6IHtcbiAgICAgICAgICAgICAgICAgICAgYXJnczogbnVsbCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGU6IHByZXZTdGF0ZSxcbiAgICAgICAgdmFyaWFibGVzOiBwcmV2VmFyaWFibGVzLFxuICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICByZXN1bHQ6IG51bGwsXG4gICAgfTtcbn1cbmZ1bmN0aW9uIHRyYW5zaXRpb25SZWR1Y2VyMihpbnB1dCQpIHtcbiAgICB2YXIgaW5pdFJlZHVjZXIkID0geHN0cmVhbV8xLmRlZmF1bHQub2YoZnVuY3Rpb24gaW5pdFJlZHVjZXIocHJldikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgc3RhdGU6IFN0YXRlLkRPTkUsXG4gICAgICAgICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgICAgICAgICBnb2FsX2lkOiBudWxsLFxuICAgICAgICAgICAgICAgIG5ld0dvYWw6IG51bGwsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgICAgIHJlc3VsdDogbnVsbCxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICB2YXIgaW5wdXRSZWR1Y2VyJCA9IGlucHV0JFxuICAgICAgICAubWFwKGZ1bmN0aW9uIChpbnB1dCkgeyByZXR1cm4gZnVuY3Rpb24gaW5wdXRSZWR1Y2VyKHByZXYpIHtcbiAgICAgICAgcmV0dXJuIHRyYW5zaXRpb24yKHByZXYuc3RhdGUsIHByZXYudmFyaWFibGVzLCBpbnB1dCk7XG4gICAgfTsgfSk7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGluaXRSZWR1Y2VyJCwgaW5wdXRSZWR1Y2VyJCk7XG59XG4vLyBmdW5jdGlvbiBvdXRwdXQocmVkdWNlclN0YXRlJCkge1xuLy8gICBjb25zdCBvdXRwdXRzJCA9IHJlZHVjZXJTdGF0ZSRcbi8vICAgICAuZmlsdGVyKG0gPT4gISFtLm91dHB1dHMpXG4vLyAgICAgLm1hcChtID0+IG0ub3V0cHV0cyk7XG4vLyAgIHJldHVybiB7XG4vLyAgICAgc3RhdHVzOiB4cy5uZXZlcigpLFxuLy8gICAgIHJlc3VsdDogb3V0cHV0cyRcbi8vICAgICAgIC5maWx0ZXIobyA9PiAhIW8ucmVzdWx0KVxuLy8gICAgICAgLm1hcChvID0+IG8ucmVzdWx0KSxcbi8vICAgICBNb25vbG9ndWVBY3Rpb246IG91dHB1dHMkXG4vLyAgICAgICAuZmlsdGVyKG8gPT4gISFvLk1vbm9sb2d1ZUFjdGlvbilcbi8vICAgICAgIC5tYXAobyA9PiBvLk1vbm9sb2d1ZUFjdGlvbi5nb2FsKVxuLy8gICAgICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoaXNFcXVhbEdvYWwpKSxcbi8vICAgfTtcbi8vIH07XG5mdW5jdGlvbiBTcGVlY2hTeW50aGVzaXNBY3Rpb24yKHNvdXJjZXMpIHtcbiAgICAvLyBjb25zdCBvdXRwdXRzID0gb3V0cHV0KHNvdXJjZXMuc3RhdGUuc3RyZWFtKTtcbiAgICB2YXIgaW5wdXQkID0gaW5wdXQyKHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuZ29hbCksIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNvdXJjZXMuY2FuY2VsKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5TcGVlY2hTeW50aGVzaXMuZXZlbnRzKCdzdGFydCcpKSwgeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlcy5TcGVlY2hTeW50aGVzaXMuZXZlbnRzKCdlbmQnKSkpO1xuICAgIHZhciByZWR1Y2VyID0gdHJhbnNpdGlvblJlZHVjZXIyKGlucHV0JCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdGU6IHJlZHVjZXIsXG4gICAgICAgIHN0YXR1czogeHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKSxcbiAgICAgICAgcmVzdWx0OiBzb3VyY2VzLnN0YXRlLnN0cmVhbS5tYXAoZnVuY3Rpb24gKHJzKSB7IHJldHVybiBycy5yZXN1bHQ7IH0pLFxuICAgICAgICBTcGVlY2hTeW50aGVzaXM6IHNvdXJjZXMuc3RhdGUuc3RyZWFtLmRlYnVnKCkgLy8gVE9ETzogY3JlYXRlIG1vcmUgYWJzdHJhY3QgZnVuY3Rpb25cbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKHJzKSB7IHJldHVybiAhIXJzLm91dHB1dHM7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChycykgeyByZXR1cm4gcnMub3V0cHV0cy5TcGVlY2hTeW50aGVzaXM7IH0pLFxuICAgIH07XG59XG5leHBvcnRzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbjIgPSBTcGVlY2hTeW50aGVzaXNBY3Rpb24yO1xudmFyIF9hLCBfYiwgX2MsIF9kLCBfZSwgX2YsIF9nLCBfaDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNwZWVjaFN5bnRoZXNpc0FjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBtYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyXzEgPSByZXF1aXJlKFwiLi9tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyXCIpO1xuZXhwb3J0cy5tYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyID0gbWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlcl8xLm1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXI7XG52YXIgU3BlZWNoU3ludGhlc2lzQWN0aW9uXzEgPSByZXF1aXJlKFwiLi9TcGVlY2hTeW50aGVzaXNBY3Rpb25cIik7XG5leHBvcnRzLlNwZWVjaFN5bnRoZXNpc0FjdGlvbiA9IFNwZWVjaFN5bnRoZXNpc0FjdGlvbl8xLlNwZWVjaFN5bnRoZXNpc0FjdGlvbjtcbmV4cG9ydHMuU3BlZWNoU3ludGhlc2lzQWN0aW9uMiA9IFNwZWVjaFN5bnRoZXNpc0FjdGlvbl8xLlNwZWVjaFN5bnRoZXNpc0FjdGlvbjI7XG52YXIgbWFrZVNwZWVjaFJlY29nbml0aW9uRHJpdmVyXzEgPSByZXF1aXJlKFwiLi9tYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXJcIik7XG5leHBvcnRzLm1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlciA9IG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcl8xLm1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcjtcbnZhciBTcGVlY2hSZWNvZ25pdGlvbkFjdGlvbl8xID0gcmVxdWlyZShcIi4vU3BlZWNoUmVjb2duaXRpb25BY3Rpb25cIik7XG5leHBvcnRzLlNwZWVjaFJlY29nbml0aW9uQWN0aW9uID0gU3BlZWNoUmVjb2duaXRpb25BY3Rpb25fMS5TcGVlY2hSZWNvZ25pdGlvbkFjdGlvbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9faW1wb3J0RGVmYXVsdCA9ICh0aGlzICYmIHRoaXMuX19pbXBvcnREZWZhdWx0KSB8fCBmdW5jdGlvbiAobW9kKSB7XG4gICAgcmV0dXJuIChtb2QgJiYgbW9kLl9fZXNNb2R1bGUpID8gbW9kIDogeyBcImRlZmF1bHRcIjogbW9kIH07XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGZyb21FdmVudF8xID0gX19pbXBvcnREZWZhdWx0KHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2Zyb21FdmVudFwiKSk7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBSZWNvZ25pdGlvblNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBSZWNvZ25pdGlvblNvdXJjZShfcmVjb2duaXRpb24pIHtcbiAgICAgICAgdGhpcy5fcmVjb2duaXRpb24gPSBfcmVjb2duaXRpb247XG4gICAgfVxuICAgIFJlY29nbml0aW9uU291cmNlLnByb3RvdHlwZS5ldmVudHMgPSBmdW5jdGlvbiAoZXZlbnROYW1lKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KGZyb21FdmVudF8xLmRlZmF1bHQodGhpcy5fcmVjb2duaXRpb24sIGV2ZW50TmFtZSkpO1xuICAgIH07XG4gICAgcmV0dXJuIFJlY29nbml0aW9uU291cmNlO1xufSgpKTtcbi8qKlxuICogV2ViIFNwZWVjaCBBUEkncyBbU3BlZWNoUmVjb2duaXRpb25dKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hSZWNvZ25pdGlvbilcbiAqIGRyaXZlciBmYWN0b3J5LlxuICpcbiAqIEByZXR1cm4ge0RyaXZlcn0gdGhlIFNwZWVjaFJlY29nbml0aW9uIEN5Y2xlLmpzIGRyaXZlciBmdW5jdGlvbi4gSXQgdGFrZXMgYVxuICogICBzdHJlYW0gb2Ygb2JqZWN0cyBjb250YWluaW5nIFtgU3BlZWNoUmVjb2duaXRpb25gIHByb3BlcnRpZXNdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hSZWNvZ25pdGlvbiNQcm9wZXJ0aWVzKVxuICogICBhbmQgcmV0dXJucyBhIGBFdmVudFNvdXJjZWA6XG4gKlxuICogICAqIGBFdmVudFNvdXJjZS5ldmVudHMoZXZlbnROYW1lKWAgcmV0dXJucyBhIHN0cmVhbSBvZiBgZXZlbnROYW1lYFxuICogICAgIGV2ZW50cyBmcm9tIFtgU3BlZWNoUmVjb2duaXRpb25gXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoUmVjb2duaXRpb24jRXZlbnRfaGFuZGxlcnMpLlxuICovXG5mdW5jdGlvbiBtYWtlU3BlZWNoUmVjb2duaXRpb25Ecml2ZXIoKSB7XG4gICAgdmFyIHJlY29nbml0aW9uID0gbmV3IHdlYmtpdFNwZWVjaFJlY29nbml0aW9uKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChzaW5rJCkge1xuICAgICAgICBzaW5rJC5hZGRMaXN0ZW5lcih7XG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoYXJncykge1xuICAgICAgICAgICAgICAgIC8vIGFycmF5IHZhbHVlcyBhcmUgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlIHByb3BlcnRpZXMgdGhhdCBhcmUgbm90XG4gICAgICAgICAgICAgICAgLy8gICBldmVudCBoYW5kbGVyczsgc2VlXG4gICAgICAgICAgICAgICAgLy8gICBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoUmVjb2duaXRpb25cbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjb2duaXRpb24uYWJvcnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIFsnbGFuZycsICdjb250aW51b3VzJywgJ2ludGVyaW1SZXN1bHRzJywgJ21heEFsdGVybmF0aXZlcycsICdzZXJ2aWNlVVJJJ10ubWFwKGZ1bmN0aW9uIChhcmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhcmcgaW4gYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY29nbml0aW9uW2FyZ10gPSBhcmdzW2FyZ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICA7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZWNvZ25pdGlvbi5zdGFydCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXcgUmVjb2duaXRpb25Tb3VyY2UocmVjb2duaXRpb24pO1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlciA9IG1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1ha2VTcGVlY2hSZWNvZ25pdGlvbkRyaXZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBmcm9tRXZlbnRfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwieHN0cmVhbS9leHRyYS9mcm9tRXZlbnRcIikpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgVXR0ZXJhbmNlU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFV0dGVyYW5jZVNvdXJjZShfdXR0ZXJhbmNlKSB7XG4gICAgICAgIHRoaXMuX3V0dGVyYW5jZSA9IF91dHRlcmFuY2U7XG4gICAgfVxuICAgIFV0dGVyYW5jZVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50TmFtZSkge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdChmcm9tRXZlbnRfMS5kZWZhdWx0KHRoaXMuX3V0dGVyYW5jZSwgZXZlbnROYW1lKSk7XG4gICAgfTtcbiAgICByZXR1cm4gVXR0ZXJhbmNlU291cmNlO1xufSgpKTtcbi8qKlxuICogV2ViIFNwZWVjaCBBUEkncyBbU3BlZWNoU3ludGhlc2lzXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoU3ludGhlc2lzKVxuICogZHJpdmVyIGZhY3RvcnkuXG4gKlxuICogQHJldHVybiB7RHJpdmVyfSB0aGUgU3BlZWNoU3ludGhlc2lzIEN5Y2xlLmpzIGRyaXZlciBmdW5jdGlvbi4gSXQgdGFrZXMgYVxuICogICBzdHJlYW0gb2Ygb2JqZWN0cyBjb250YWluaW5nIFtgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlYCBwcm9wZXJ0aWVzXShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlI1Byb3BlcnRpZXMpXG4gKiAgIGFuZCByZXR1cm5zIGEgYEV2ZW50U291cmNlYDpcbiAqXG4gKiAgICogYEV2ZW50U291cmNlLmV2ZW50cyhldmVudE5hbWUpYCByZXR1cm5zIGEgc3RyZWFtIG9mICBgZXZlbnROYW1lYFxuICogICAgIGV2ZW50cyBmcm9tIFtgU3BlZWNoU3ludGhlc2lzVXR0ZXJhbmNlYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1NwZWVjaFN5bnRoZXNpc1V0dGVyYW5jZSNFdmVudF9oYW5kbGVycykuXG4gKi9cbmZ1bmN0aW9uIG1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIoKSB7XG4gICAgdmFyIHN5bnRoZXNpcyA9IHdpbmRvdy5zcGVlY2hTeW50aGVzaXM7XG4gICAgdmFyIHV0dGVyYW5jZSA9IG5ldyBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UoKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHNpbmskKSB7XG4gICAgICAgIHNpbmskLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgICAgICAgICAgICAgLy8gYXJyYXkgdmFsdWVzIGFyZSBTcGVlY2hTeW50aGVzaXNVdHRlcmFuY2UgcHJvcGVydGllcyB0aGF0IGFyZSBub3RcbiAgICAgICAgICAgICAgICAvLyAgIGV2ZW50IGhhbmRsZXJzOyBzZWVcbiAgICAgICAgICAgICAgICAvLyAgIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9TcGVlY2hTeW50aGVzaXNVdHRlcmFuY2VcbiAgICAgICAgICAgICAgICBpZiAoIWFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgc3ludGhlc2lzLmNhbmNlbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgWydsYW5nJywgJ3BpdGNoJywgJ3JhdGUnLCAndGV4dCcsICd2b2ljZScsICd2b2x1bWUnXS5tYXAoZnVuY3Rpb24gKGFyZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFyZyBpbiBhcmdzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXR0ZXJhbmNlW2FyZ10gPSBhcmdzW2FyZ107XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBzeW50aGVzaXMuc3BlYWsodXR0ZXJhbmNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmV3IFV0dGVyYW5jZVNvdXJjZSh1dHRlcmFuY2UpO1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VTcGVlY2hTeW50aGVzaXNEcml2ZXIgPSBtYWtlU3BlZWNoU3ludGhlc2lzRHJpdmVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFrZVNwZWVjaFN5bnRoZXNpc0RyaXZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB0eXBlc18xID0gcmVxdWlyZShcIi4vdHlwZXNcIik7XG5leHBvcnRzLlN0YXR1cyA9IHR5cGVzXzEuU3RhdHVzO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmV4cG9ydHMuZ2VuZXJhdGVHb2FsSUQgPSB1dGlsc18xLmdlbmVyYXRlR29hbElEO1xuZXhwb3J0cy5pbml0R29hbCA9IHV0aWxzXzEuaW5pdEdvYWw7XG5leHBvcnRzLmlzRXF1YWwgPSB1dGlsc18xLmlzRXF1YWw7XG5leHBvcnRzLmlzRXF1YWxHb2FsID0gdXRpbHNfMS5pc0VxdWFsR29hbDtcbmV4cG9ydHMuaXNFcXVhbFJlc3VsdCA9IHV0aWxzXzEuaXNFcXVhbFJlc3VsdDtcbmV4cG9ydHMucG93ZXJ1cCA9IHV0aWxzXzEucG93ZXJ1cDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIFN0YXR1cztcbihmdW5jdGlvbiAoU3RhdHVzKSB7XG4gICAgU3RhdHVzW1wiQUNUSVZFXCJdID0gXCJBQ1RJVkVcIjtcbiAgICBTdGF0dXNbXCJQUkVFTVBURURcIl0gPSBcIlBSRUVNUFRFRFwiO1xuICAgIFN0YXR1c1tcIlNVQ0NFRURFRFwiXSA9IFwiU1VDQ0VFREVEXCI7XG4gICAgU3RhdHVzW1wiQUJPUlRFRFwiXSA9IFwiQUJPUlRFRFwiO1xufSkoU3RhdHVzID0gZXhwb3J0cy5TdGF0dXMgfHwgKGV4cG9ydHMuU3RhdHVzID0ge30pKTtcbjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXR5cGVzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIF9fcmVzdCA9ICh0aGlzICYmIHRoaXMuX19yZXN0KSB8fCBmdW5jdGlvbiAocywgZSkge1xuICAgIHZhciB0ID0ge307XG4gICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApICYmIGUuaW5kZXhPZihwKSA8IDApXG4gICAgICAgIHRbcF0gPSBzW3BdO1xuICAgIGlmIChzICE9IG51bGwgJiYgdHlwZW9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHAgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKHMpOyBpIDwgcC5sZW5ndGg7IGkrKykgaWYgKGUuaW5kZXhPZihwW2ldKSA8IDApXG4gICAgICAgICAgICB0W3BbaV1dID0gc1twW2ldXTtcbiAgICByZXR1cm4gdDtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZW5lcmF0ZUdvYWxJRCgpIHtcbiAgICB2YXIgbm93ID0gbmV3IERhdGUoKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzdGFtcDogbm93LFxuICAgICAgICBpZDogTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIpICsgXCItXCIgKyBub3cuZ2V0VGltZSgpLFxuICAgIH07XG59XG5leHBvcnRzLmdlbmVyYXRlR29hbElEID0gZ2VuZXJhdGVHb2FsSUQ7XG5mdW5jdGlvbiBpbml0R29hbChnb2FsLCBpc0dvYWwpIHtcbiAgICBpZiAoaXNHb2FsID09PSB2b2lkIDApIHsgaXNHb2FsID0gZnVuY3Rpb24gKGcpIHsgcmV0dXJuICEhZy5nb2FsX2lkOyB9OyB9XG4gICAgcmV0dXJuIGlzR29hbChnb2FsKSA/IGdvYWwgOiB7XG4gICAgICAgIGdvYWxfaWQ6IGdlbmVyYXRlR29hbElEKCksXG4gICAgICAgIGdvYWw6IGdvYWwsXG4gICAgfTtcbn1cbmV4cG9ydHMuaW5pdEdvYWwgPSBpbml0R29hbDtcbmZ1bmN0aW9uIGlzRXF1YWwoZmlyc3QsIHNlY29uZCkge1xuICAgIGlmICghZmlyc3QgfHwgIXNlY29uZCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiAoZmlyc3Quc3RhbXAgPT09IHNlY29uZC5zdGFtcCAmJiBmaXJzdC5pZCA9PT0gc2Vjb25kLmlkKTtcbn1cbmV4cG9ydHMuaXNFcXVhbCA9IGlzRXF1YWw7XG5mdW5jdGlvbiBpc0VxdWFsR29hbChmaXJzdCwgc2Vjb25kKSB7XG4gICAgaWYgKCFmaXJzdCB8fCAhc2Vjb25kKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGlzRXF1YWwoZmlyc3QuZ29hbF9pZCwgc2Vjb25kLmdvYWxfaWQpO1xufVxuZXhwb3J0cy5pc0VxdWFsR29hbCA9IGlzRXF1YWxHb2FsO1xuZnVuY3Rpb24gaXNFcXVhbFJlc3VsdChmaXJzdCwgc2Vjb25kKSB7XG4gICAgaWYgKCFmaXJzdCB8fCAhc2Vjb25kKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIChpc0VxdWFsKGZpcnN0LnN0YXR1cy5nb2FsX2lkLCBzZWNvbmQuc3RhdHVzLmdvYWxfaWQpXG4gICAgICAgICYmIGZpcnN0LnN0YXR1cy5zdGF0dXMgPT09IHNlY29uZC5zdGF0dXMuc3RhdHVzKTtcbn1cbmV4cG9ydHMuaXNFcXVhbFJlc3VsdCA9IGlzRXF1YWxSZXN1bHQ7XG5mdW5jdGlvbiBwb3dlcnVwKG1haW4sIGNvbm5lY3QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHNvdXJjZXMpIHtcbiAgICAgICAgdmFyIHNpbmtzID0gbWFpbihzb3VyY2VzKTtcbiAgICAgICAgT2JqZWN0LmtleXMoc291cmNlcy5wcm94aWVzKS5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgY29ubmVjdChzb3VyY2VzLnByb3hpZXNba2V5XSwgc2lua3MudGFyZ2V0c1trZXldKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciB0YXJnZXRzID0gc2lua3MudGFyZ2V0cywgc2lua3NXaXRob3V0VGFyZ2V0cyA9IF9fcmVzdChzaW5rcywgW1widGFyZ2V0c1wiXSk7XG4gICAgICAgIHJldHVybiBzaW5rc1dpdGhvdXRUYXJnZXRzO1xuICAgIH07XG59XG5leHBvcnRzLnBvd2VydXAgPSBwb3dlcnVwO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfcG9ueWZpbGwgPSByZXF1aXJlKCcuL3BvbnlmaWxsLmpzJyk7XG5cbnZhciBfcG9ueWZpbGwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcG9ueWZpbGwpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciByb290OyAvKiBnbG9iYWwgd2luZG93ICovXG5cblxuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gc2VsZjtcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IG1vZHVsZTtcbn0gZWxzZSB7XG4gIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxuXG52YXIgcmVzdWx0ID0gKDAsIF9wb255ZmlsbDJbJ2RlZmF1bHQnXSkocm9vdCk7XG5leHBvcnRzWydkZWZhdWx0J10gPSByZXN1bHQ7IiwiLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJub2RlXCIgLz5cbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IHtTdHJlYW0sIEludGVybmFsUHJvZHVjZXIsIEludGVybmFsTGlzdGVuZXJ9IGZyb20gJy4uL2luZGV4JztcblxuZXhwb3J0IGNsYXNzIERPTUV2ZW50UHJvZHVjZXIgaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPEV2ZW50PiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21FdmVudCc7XG4gIHByaXZhdGUgbGlzdGVuZXI6IEV2ZW50TGlzdGVuZXIgfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbm9kZTogRXZlbnRUYXJnZXQsXG4gICAgICAgICAgICAgIHByaXZhdGUgZXZlbnRUeXBlOiBzdHJpbmcsXG4gICAgICAgICAgICAgIHByaXZhdGUgdXNlQ2FwdHVyZTogYm9vbGVhbikge1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxFdmVudD4pIHtcbiAgICB0aGlzLmxpc3RlbmVyID0gKGUpID0+IG91dC5fbihlKTtcbiAgICB0aGlzLm5vZGUuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50VHlwZSwgdGhpcy5saXN0ZW5lciwgdGhpcy51c2VDYXB0dXJlKTtcbiAgfVxuXG4gIF9zdG9wKCkge1xuICAgIHRoaXMubm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKHRoaXMuZXZlbnRUeXBlLCB0aGlzLmxpc3RlbmVyIGFzIGFueSwgdGhpcy51c2VDYXB0dXJlKTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTm9kZUV2ZW50UHJvZHVjZXIgaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPGFueT4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tRXZlbnQnO1xuICBwcml2YXRlIGxpc3RlbmVyOiBGdW5jdGlvbiB8IG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBub2RlOiBFdmVudEVtaXR0ZXIsIHByaXZhdGUgZXZlbnROYW1lOiBzdHJpbmcpIHsgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8YW55Pikge1xuICAgIHRoaXMubGlzdGVuZXIgPSAoLi4uYXJnczogQXJyYXk8YW55PikgPT4ge1xuICAgICAgcmV0dXJuIChhcmdzLmxlbmd0aCA+IDEpID8gb3V0Ll9uKGFyZ3MpIDogb3V0Ll9uKGFyZ3NbMF0pO1xuICAgIH07XG4gICAgdGhpcy5ub2RlLmFkZExpc3RlbmVyKHRoaXMuZXZlbnROYW1lLCB0aGlzLmxpc3RlbmVyKTtcbiAgfVxuXG4gIF9zdG9wKCkge1xuICAgIHRoaXMubm9kZS5yZW1vdmVMaXN0ZW5lcih0aGlzLmV2ZW50TmFtZSwgdGhpcy5saXN0ZW5lciBhcyBhbnkpO1xuICAgIHRoaXMubGlzdGVuZXIgPSBudWxsO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzRW1pdHRlcihlbGVtZW50OiBhbnkpOiBlbGVtZW50IGlzIEV2ZW50RW1pdHRlciB7XG4gIHJldHVybiBlbGVtZW50LmVtaXQgJiYgZWxlbWVudC5hZGRMaXN0ZW5lcjtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgc3RyZWFtIGJhc2VkIG9uIGVpdGhlcjpcbiAqIC0gRE9NIGV2ZW50cyB3aXRoIHRoZSBuYW1lIGBldmVudE5hbWVgIGZyb20gYSBwcm92aWRlZCB0YXJnZXQgbm9kZVxuICogLSBFdmVudHMgd2l0aCB0aGUgbmFtZSBgZXZlbnROYW1lYCBmcm9tIGEgcHJvdmlkZWQgTm9kZUpTIEV2ZW50RW1pdHRlclxuICpcbiAqIFdoZW4gY3JlYXRpbmcgYSBzdHJlYW0gZnJvbSBFdmVudEVtaXR0ZXJzLCBpZiB0aGUgc291cmNlIGV2ZW50IGhhcyBtb3JlIHRoYW5cbiAqIG9uZSBhcmd1bWVudCBhbGwgdGhlIGFyZ3VtZW50cyB3aWxsIGJlIGFnZ3JlZ2F0ZWQgaW50byBhbiBhcnJheSBpbiB0aGVcbiAqIHJlc3VsdCBzdHJlYW0uXG4gKlxuICogKFRpcDogd2hlbiB1c2luZyB0aGlzIGZhY3Rvcnkgd2l0aCBUeXBlU2NyaXB0LCB5b3Ugd2lsbCBuZWVkIHR5cGVzIGZvclxuICogTm9kZS5qcyBiZWNhdXNlIGZyb21FdmVudCBrbm93cyBob3cgdG8gaGFuZGxlIGJvdGggRE9NIGV2ZW50cyBhbmQgTm9kZS5qc1xuICogRXZlbnRFbWl0dGVyLiBKdXN0IGluc3RhbGwgYEB0eXBlcy9ub2RlYClcbiAqXG4gKiBNYXJibGUgZGlhZ3JhbTpcbiAqXG4gKiBgYGB0ZXh0XG4gKiAgIGZyb21FdmVudChlbGVtZW50LCBldmVudE5hbWUpXG4gKiAtLS1ldi0tZXYtLS0tZXYtLS0tLS0tLS0tLS0tLS1cbiAqIGBgYFxuICpcbiAqIEV4YW1wbGVzOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZnJvbUV2ZW50IGZyb20gJ3hzdHJlYW0vZXh0cmEvZnJvbUV2ZW50J1xuICpcbiAqIGNvbnN0IHN0cmVhbSA9IGZyb21FdmVudChkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYnV0dG9uJyksICdjbGljaycpXG4gKiAgIC5tYXBUbygnQnV0dG9uIGNsaWNrZWQhJylcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gJ0J1dHRvbiBjbGlja2VkISdcbiAqID4gJ0J1dHRvbiBjbGlja2VkISdcbiAqID4gJ0J1dHRvbiBjbGlja2VkISdcbiAqIGBgYFxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZnJvbUV2ZW50IGZyb20gJ3hzdHJlYW0vZXh0cmEvZnJvbUV2ZW50J1xuICogaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cydcbiAqXG4gKiBjb25zdCBNeUVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKClcbiAqIGNvbnN0IHN0cmVhbSA9IGZyb21FdmVudChNeUVtaXR0ZXIsICdmb28nKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICpcbiAqIE15RW1pdHRlci5lbWl0KCdmb28nLCAnYmFyJylcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gJ2JhcidcbiAqIGBgYFxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZnJvbUV2ZW50IGZyb20gJ3hzdHJlYW0vZXh0cmEvZnJvbUV2ZW50J1xuICogaW1wb3J0IHtFdmVudEVtaXR0ZXJ9IGZyb20gJ2V2ZW50cydcbiAqXG4gKiBjb25zdCBNeUVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKClcbiAqIGNvbnN0IHN0cmVhbSA9IGZyb21FdmVudChNeUVtaXR0ZXIsICdmb28nKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICpcbiAqIE15RW1pdHRlci5lbWl0KCdmb28nLCAnYmFyJywgJ2JheicsICdidXp6JylcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gWydiYXInLCAnYmF6JywgJ2J1enonXVxuICogYGBgXG4gKlxuICogQGZhY3RvcnkgdHJ1ZVxuICogQHBhcmFtIHtFdmVudFRhcmdldHxFdmVudEVtaXR0ZXJ9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdXBvbiB3aGljaCB0byBsaXN0ZW4uXG4gKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIFRoZSBuYW1lIG9mIHRoZSBldmVudCBmb3Igd2hpY2ggdG8gbGlzdGVuLlxuICogQHBhcmFtIHtib29sZWFuP30gdXNlQ2FwdHVyZSBBbiBvcHRpb25hbCBib29sZWFuIHRoYXQgaW5kaWNhdGVzIHRoYXQgZXZlbnRzIG9mXG4gKiB0aGlzIHR5cGUgd2lsbCBiZSBkaXNwYXRjaGVkIHRvIHRoZSByZWdpc3RlcmVkIGxpc3RlbmVyIGJlZm9yZSBiZWluZ1xuICogZGlzcGF0Y2hlZCB0byBhbnkgRXZlbnRUYXJnZXQgYmVuZWF0aCBpdCBpbiB0aGUgRE9NIHRyZWUuIERlZmF1bHRzIHRvIGZhbHNlLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5cbmZ1bmN0aW9uIGZyb21FdmVudDxUID0gYW55PihlbGVtZW50OiBFdmVudEVtaXR0ZXIsIGV2ZW50TmFtZTogc3RyaW5nKTogU3RyZWFtPFQ+O1xuZnVuY3Rpb24gZnJvbUV2ZW50PFQgZXh0ZW5kcyBFdmVudCA9IEV2ZW50PihlbGVtZW50OiBFdmVudFRhcmdldCwgZXZlbnROYW1lOiBzdHJpbmcsIHVzZUNhcHR1cmU/OiBib29sZWFuKTogU3RyZWFtPFQ+O1xuXG5mdW5jdGlvbiBmcm9tRXZlbnQ8VCA9IGFueT4oZWxlbWVudDogRXZlbnRFbWl0dGVyIHwgRXZlbnRUYXJnZXQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnROYW1lOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlQ2FwdHVyZTogYm9vbGVhbiA9IGZhbHNlKTogU3RyZWFtPFQ+IHtcbiAgaWYgKGlzRW1pdHRlcihlbGVtZW50KSkge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBOb2RlRXZlbnRQcm9kdWNlcihlbGVtZW50LCBldmVudE5hbWUpKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRE9NRXZlbnRQcm9kdWNlcihlbGVtZW50LCBldmVudE5hbWUsIHVzZUNhcHR1cmUpIGFzIGFueSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgZnJvbUV2ZW50O1xuIiwiaW1wb3J0ICQkb2JzZXJ2YWJsZSBmcm9tICdzeW1ib2wtb2JzZXJ2YWJsZSc7XG5cbmNvbnN0IE5PID0ge307XG5mdW5jdGlvbiBub29wKCkge31cblxuZnVuY3Rpb24gY3A8VD4oYTogQXJyYXk8VD4pOiBBcnJheTxUPiB7XG4gIGNvbnN0IGwgPSBhLmxlbmd0aDtcbiAgY29uc3QgYiA9IEFycmF5KGwpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGw7ICsraSkgYltpXSA9IGFbaV07XG4gIHJldHVybiBiO1xufVxuXG5mdW5jdGlvbiBhbmQ8VD4oZjE6ICh0OiBUKSA9PiBib29sZWFuLCBmMjogKHQ6IFQpID0+IGJvb2xlYW4pOiAodDogVCkgPT4gYm9vbGVhbiB7XG4gIHJldHVybiBmdW5jdGlvbiBhbmRGbih0OiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGYxKHQpICYmIGYyKHQpO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgRkNvbnRhaW5lcjxULCBSPiB7XG4gIGYodDogVCk6IFI7XG59XG5cbmZ1bmN0aW9uIF90cnk8VCwgUj4oYzogRkNvbnRhaW5lcjxULCBSPiwgdDogVCwgdTogU3RyZWFtPGFueT4pOiBSIHwge30ge1xuICB0cnkge1xuICAgIHJldHVybiBjLmYodCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB1Ll9lKGUpO1xuICAgIHJldHVybiBOTztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBfbjogKHY6IFQpID0+IHZvaWQ7XG4gIF9lOiAoZXJyOiBhbnkpID0+IHZvaWQ7XG4gIF9jOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBOT19JTDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+ID0ge1xuICBfbjogbm9vcCxcbiAgX2U6IG5vb3AsXG4gIF9jOiBub29wLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgX3N0YXJ0KGxpc3RlbmVyOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZDtcbiAgX3N0b3A6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0U2VuZGVyPFQ+IHtcbiAgb3V0OiBTdHJlYW08VD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3BlcmF0b3I8VCwgUj4gZXh0ZW5kcyBJbnRlcm5hbFByb2R1Y2VyPFI+LCBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8Uj4ge1xuICB0eXBlOiBzdHJpbmc7XG4gIGluczogU3RyZWFtPFQ+O1xuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFnZ3JlZ2F0b3I8VCwgVT4gZXh0ZW5kcyBJbnRlcm5hbFByb2R1Y2VyPFU+LCBPdXRTZW5kZXI8VT4ge1xuICB0eXBlOiBzdHJpbmc7XG4gIGluc0FycjogQXJyYXk8U3RyZWFtPFQ+PjtcbiAgX3N0YXJ0KG91dDogU3RyZWFtPFU+KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9kdWNlcjxUPiB7XG4gIHN0YXJ0OiAobGlzdGVuZXI6IExpc3RlbmVyPFQ+KSA9PiB2b2lkO1xuICBzdG9wOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExpc3RlbmVyPFQ+IHtcbiAgbmV4dDogKHg6IFQpID0+IHZvaWQ7XG4gIGVycm9yOiAoZXJyOiBhbnkpID0+IHZvaWQ7XG4gIGNvbXBsZXRlOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN1YnNjcmlwdGlvbiB7XG4gIHVuc3Vic2NyaWJlKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT2JzZXJ2YWJsZTxUPiB7XG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXI8VD4pOiBTdWJzY3JpcHRpb247XG59XG5cbi8vIG11dGF0ZXMgdGhlIGlucHV0XG5mdW5jdGlvbiBpbnRlcm5hbGl6ZVByb2R1Y2VyPFQ+KHByb2R1Y2VyOiBQcm9kdWNlcjxUPiAmIFBhcnRpYWw8SW50ZXJuYWxQcm9kdWNlcjxUPj4pIHtcbiAgcHJvZHVjZXIuX3N0YXJ0ID0gZnVuY3Rpb24gX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+ICYgUGFydGlhbDxMaXN0ZW5lcjxUPj4pIHtcbiAgICBpbC5uZXh0ID0gaWwuX247XG4gICAgaWwuZXJyb3IgPSBpbC5fZTtcbiAgICBpbC5jb21wbGV0ZSA9IGlsLl9jO1xuICAgIHRoaXMuc3RhcnQoaWwpO1xuICB9O1xuICBwcm9kdWNlci5fc3RvcCA9IHByb2R1Y2VyLnN0b3A7XG59XG5cbmNsYXNzIFN0cmVhbVN1YjxUPiBpbXBsZW1lbnRzIFN1YnNjcmlwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3N0cmVhbTogU3RyZWFtPFQ+LCBwcml2YXRlIF9saXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPikge31cblxuICB1bnN1YnNjcmliZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9zdHJlYW0uX3JlbW92ZSh0aGlzLl9saXN0ZW5lcik7XG4gIH1cbn1cblxuY2xhc3MgT2JzZXJ2ZXI8VD4gaW1wbGVtZW50cyBMaXN0ZW5lcjxUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2xpc3RlbmVyOiBJbnRlcm5hbExpc3RlbmVyPFQ+KSB7fVxuXG4gIG5leHQodmFsdWU6IFQpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fbih2YWx1ZSk7XG4gIH1cblxuICBlcnJvcihlcnI6IGFueSkge1xuICAgIHRoaXMuX2xpc3RlbmVyLl9lKGVycik7XG4gIH1cblxuICBjb21wbGV0ZSgpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fYygpO1xuICB9XG59XG5cbmNsYXNzIEZyb21PYnNlcnZhYmxlPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21PYnNlcnZhYmxlJztcbiAgcHVibGljIGluczogT2JzZXJ2YWJsZTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGFjdGl2ZTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfc3ViOiBTdWJzY3JpcHRpb24gfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3Iob2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUPikge1xuICAgIHRoaXMuaW5zID0gb2JzZXJ2YWJsZTtcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMuX3N1YiA9IHRoaXMuaW5zLnN1YnNjcmliZShuZXcgT2JzZXJ2ZXIob3V0KSk7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZSkgdGhpcy5fc3ViLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICBfc3RvcCgpIHtcbiAgICBpZiAodGhpcy5fc3ViKSB0aGlzLl9zdWIudW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVyZ2VTaWduYXR1cmUge1xuICAoKTogU3RyZWFtPGFueT47XG4gIDxUMT4oczE6IFN0cmVhbTxUMT4pOiBTdHJlYW08VDE+O1xuICA8VDEsIFQyPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPik6IFN0cmVhbTxUMSB8IFQyPjtcbiAgPFQxLCBUMiwgVDM+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+KTogU3RyZWFtPFQxIHwgVDIgfCBUMz47XG4gIDxUMSwgVDIsIFQzLCBUND4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQ+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDY+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNj47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDc+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDk+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDggfCBUOT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTA+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+LFxuICAgIHMxMDogU3RyZWFtPFQxMD4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOCB8IFQ5IHwgVDEwPjtcbiAgPFQ+KC4uLnN0cmVhbTogQXJyYXk8U3RyZWFtPFQ+Pik6IFN0cmVhbTxUPjtcbn1cblxuY2xhc3MgTWVyZ2U8VD4gaW1wbGVtZW50cyBBZ2dyZWdhdG9yPFQsIFQ+LCBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnbWVyZ2UnO1xuICBwdWJsaWMgaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgYWM6IG51bWJlcjsgLy8gYWMgaXMgYWN0aXZlQ291bnRcblxuICBjb25zdHJ1Y3RvcihpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj4pIHtcbiAgICB0aGlzLmluc0FyciA9IGluc0FycjtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmFjID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBMID0gcy5sZW5ndGg7XG4gICAgdGhpcy5hYyA9IEw7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIHNbaV0uX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBMID0gcy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIHNbaV0uX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGlmICgtLXRoaXMuYWMgPD0gMCkge1xuICAgICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgICB1Ll9jKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tYmluZVNpZ25hdHVyZSB7XG4gICgpOiBTdHJlYW08QXJyYXk8YW55Pj47XG4gIDxUMT4oczE6IFN0cmVhbTxUMT4pOiBTdHJlYW08W1QxXT47XG4gIDxUMSwgVDI+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+KTogU3RyZWFtPFtUMSwgVDJdPjtcbiAgPFQxLCBUMiwgVDM+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+KTogU3RyZWFtPFtUMSwgVDIsIFQzXT47XG4gIDxUMSwgVDIsIFQzLCBUND4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDU+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDVdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDY+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDg+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDhdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDk+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTA+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+LFxuICAgIHMxMDogU3RyZWFtPFQxMD4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMF0+O1xuICAoLi4uc3RyZWFtOiBBcnJheTxTdHJlYW08YW55Pj4pOiBTdHJlYW08QXJyYXk8YW55Pj47XG59XG5cbmNsYXNzIENvbWJpbmVMaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4sIE91dFNlbmRlcjxBcnJheTxUPj4ge1xuICBwcml2YXRlIGk6IG51bWJlcjtcbiAgcHVibGljIG91dDogU3RyZWFtPEFycmF5PFQ+PjtcbiAgcHJpdmF0ZSBwOiBDb21iaW5lPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGk6IG51bWJlciwgb3V0OiBTdHJlYW08QXJyYXk8VD4+LCBwOiBDb21iaW5lPFQ+KSB7XG4gICAgdGhpcy5pID0gaTtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLnAgPSBwO1xuICAgIHAuaWxzLnB1c2godGhpcyk7XG4gIH1cblxuICBfbih0OiBUKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMucCwgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAocC51cCh0LCB0aGlzLmkpKSB7XG4gICAgICBjb25zdCBhID0gcC52YWxzO1xuICAgICAgY29uc3QgbCA9IGEubGVuZ3RoO1xuICAgICAgY29uc3QgYiA9IEFycmF5KGwpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyArK2kpIGJbaV0gPSBhW2ldO1xuICAgICAgb3V0Ll9uKGIpO1xuICAgIH1cbiAgfVxuXG4gIF9lKGVycjogYW55KTogdm9pZCB7XG4gICAgY29uc3Qgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBvdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLnA7XG4gICAgaWYgKHAub3V0ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICgtLXAuTmMgPT09IDApIHAub3V0Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgQ29tYmluZTxSPiBpbXBsZW1lbnRzIEFnZ3JlZ2F0b3I8YW55LCBBcnJheTxSPj4ge1xuICBwdWJsaWMgdHlwZSA9ICdjb21iaW5lJztcbiAgcHVibGljIGluc0FycjogQXJyYXk8U3RyZWFtPGFueT4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08QXJyYXk8Uj4+O1xuICBwdWJsaWMgaWxzOiBBcnJheTxDb21iaW5lTGlzdGVuZXI8YW55Pj47XG4gIHB1YmxpYyBOYzogbnVtYmVyOyAvLyAqTip1bWJlciBvZiBzdHJlYW1zIHN0aWxsIHRvIHNlbmQgKmMqb21wbGV0ZVxuICBwdWJsaWMgTm46IG51bWJlcjsgLy8gKk4qdW1iZXIgb2Ygc3RyZWFtcyBzdGlsbCB0byBzZW5kICpuKmV4dFxuICBwdWJsaWMgdmFsczogQXJyYXk8Uj47XG5cbiAgY29uc3RydWN0b3IoaW5zQXJyOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICB0aGlzLmluc0FyciA9IGluc0FycjtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxBcnJheTxSPj47XG4gICAgdGhpcy5pbHMgPSBbXTtcbiAgICB0aGlzLk5jID0gdGhpcy5ObiA9IDA7XG4gICAgdGhpcy52YWxzID0gW107XG4gIH1cblxuICB1cCh0OiBhbnksIGk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHYgPSB0aGlzLnZhbHNbaV07XG4gICAgY29uc3QgTm4gPSAhdGhpcy5ObiA/IDAgOiB2ID09PSBOTyA/IC0tdGhpcy5ObiA6IHRoaXMuTm47XG4gICAgdGhpcy52YWxzW2ldID0gdDtcbiAgICByZXR1cm4gTm4gPT09IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08QXJyYXk8Uj4+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IG4gPSB0aGlzLk5jID0gdGhpcy5ObiA9IHMubGVuZ3RoO1xuICAgIGNvbnN0IHZhbHMgPSB0aGlzLnZhbHMgPSBuZXcgQXJyYXkobik7XG4gICAgaWYgKG4gPT09IDApIHtcbiAgICAgIG91dC5fbihbXSk7XG4gICAgICBvdXQuX2MoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgdmFsc1tpXSA9IE5PO1xuICAgICAgICBzW2ldLl9hZGQobmV3IENvbWJpbmVMaXN0ZW5lcihpLCBvdXQsIHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgbiA9IHMubGVuZ3RoO1xuICAgIGNvbnN0IGlscyA9IHRoaXMuaWxzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSBzW2ldLl9yZW1vdmUoaWxzW2ldKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxBcnJheTxSPj47XG4gICAgdGhpcy5pbHMgPSBbXTtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgfVxufVxuXG5jbGFzcyBGcm9tQXJyYXk8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbUFycmF5JztcbiAgcHVibGljIGE6IEFycmF5PFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGE6IEFycmF5PFQ+KSB7XG4gICAgdGhpcy5hID0gYTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5hO1xuICAgIGZvciAobGV0IGkgPSAwLCBuID0gYS5sZW5ndGg7IGkgPCBuOyBpKyspIG91dC5fbihhW2ldKTtcbiAgICBvdXQuX2MoKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICB9XG59XG5cbmNsYXNzIEZyb21Qcm9taXNlPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21Qcm9taXNlJztcbiAgcHVibGljIG9uOiBib29sZWFuO1xuICBwdWJsaWMgcDogUHJvbWlzZUxpa2U8VD47XG5cbiAgY29uc3RydWN0b3IocDogUHJvbWlzZUxpa2U8VD4pIHtcbiAgICB0aGlzLm9uID0gZmFsc2U7XG4gICAgdGhpcy5wID0gcDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCBwcm9kID0gdGhpcztcbiAgICB0aGlzLm9uID0gdHJ1ZTtcbiAgICB0aGlzLnAudGhlbihcbiAgICAgICh2OiBUKSA9PiB7XG4gICAgICAgIGlmIChwcm9kLm9uKSB7XG4gICAgICAgICAgb3V0Ll9uKHYpO1xuICAgICAgICAgIG91dC5fYygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBvdXQuX2UoZSk7XG4gICAgICB9LFxuICAgICkudGhlbihub29wLCAoZXJyOiBhbnkpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4geyB0aHJvdyBlcnI7IH0pO1xuICAgIH0pO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5vbiA9IGZhbHNlO1xuICB9XG59XG5cbmNsYXNzIFBlcmlvZGljIGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxudW1iZXI+IHtcbiAgcHVibGljIHR5cGUgPSAncGVyaW9kaWMnO1xuICBwdWJsaWMgcGVyaW9kOiBudW1iZXI7XG4gIHByaXZhdGUgaW50ZXJ2YWxJRDogYW55O1xuICBwcml2YXRlIGk6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihwZXJpb2Q6IG51bWJlcikge1xuICAgIHRoaXMucGVyaW9kID0gcGVyaW9kO1xuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IC0xO1xuICAgIHRoaXMuaSA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPG51bWJlcj4pOiB2b2lkIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBpbnRlcnZhbEhhbmRsZXIoKSB7IG91dC5fbihzZWxmLmkrKyk7IH1cbiAgICB0aGlzLmludGVydmFsSUQgPSBzZXRJbnRlcnZhbChpbnRlcnZhbEhhbmRsZXIsIHRoaXMucGVyaW9kKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmludGVydmFsSUQgIT09IC0xKSBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJRCk7XG4gICAgdGhpcy5pbnRlcnZhbElEID0gLTE7XG4gICAgdGhpcy5pID0gMDtcbiAgfVxufVxuXG5jbGFzcyBEZWJ1ZzxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZGVidWcnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBzOiAodDogVCkgPT4gYW55OyAvLyBzcHlcbiAgcHJpdmF0ZSBsOiBzdHJpbmc7IC8vIGxhYmVsXG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogc3RyaW5nKTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86ICh0OiBUKSA9PiBhbnkpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpKTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMucyA9IG5vb3A7XG4gICAgdGhpcy5sID0gJyc7XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB0aGlzLmwgPSBhcmc7IGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbicpIHRoaXMucyA9IGFyZztcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCBzID0gdGhpcy5zLCBsID0gdGhpcy5sO1xuICAgIGlmIChzICE9PSBub29wKSB7XG4gICAgICB0cnkge1xuICAgICAgICBzKHQpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB1Ll9lKGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobCkgY29uc29sZS5sb2cobCArICc6JywgdCk7IGVsc2UgY29uc29sZS5sb2codCk7XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRHJvcDxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZHJvcCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbWF4OiBudW1iZXI7XG4gIHByaXZhdGUgZHJvcHBlZDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKG1heDogbnVtYmVyLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubWF4ID0gbWF4O1xuICAgIHRoaXMuZHJvcHBlZCA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmRyb3BwZWQgPSAwO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAodGhpcy5kcm9wcGVkKysgPj0gdGhpcy5tYXgpIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIEVuZFdoZW5MaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8YW55PiB7XG4gIHByaXZhdGUgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3A6IEVuZFdoZW48VD47XG5cbiAgY29uc3RydWN0b3Iob3V0OiBTdHJlYW08VD4sIG9wOiBFbmRXaGVuPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcCA9IG9wO1xuICB9XG5cbiAgX24oKSB7XG4gICAgdGhpcy5vcC5lbmQoKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgdGhpcy5vdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3AuZW5kKCk7XG4gIH1cbn1cblxuY2xhc3MgRW5kV2hlbjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZW5kV2hlbic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbzogU3RyZWFtPGFueT47IC8vIG8gPSBvdGhlclxuICBwcml2YXRlIG9pbDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+OyAvLyBvaWwgPSBvdGhlciBJbnRlcm5hbExpc3RlbmVyXG5cbiAgY29uc3RydWN0b3IobzogU3RyZWFtPGFueT4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vID0gbztcbiAgICB0aGlzLm9pbCA9IE5PX0lMO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vLl9hZGQodGhpcy5vaWwgPSBuZXcgRW5kV2hlbkxpc3RlbmVyKG91dCwgdGhpcykpO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMuby5fcmVtb3ZlKHRoaXMub2lsKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9pbCA9IE5PX0lMO1xuICB9XG5cbiAgZW5kKCk6IHZvaWQge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLmVuZCgpO1xuICB9XG59XG5cbmNsYXNzIEZpbHRlcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZmlsdGVyJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBmOiAodDogVCkgPT4gYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuZiA9IHBhc3NlcztcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8gfHwgIXIpIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBGbGF0dGVuTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHJpdmF0ZSBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcDogRmxhdHRlbjxUPjtcblxuICBjb25zdHJ1Y3RvcihvdXQ6IFN0cmVhbTxUPiwgb3A6IEZsYXR0ZW48VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wID0gb3A7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgdGhpcy5vdXQuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIHRoaXMub3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3AubGVzcygpO1xuICB9XG59XG5cbmNsYXNzIEZsYXR0ZW48VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxTdHJlYW08VD4sIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZmxhdHRlbic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxTdHJlYW08VD4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3BlbjogYm9vbGVhbjtcbiAgcHVibGljIGlubmVyOiBTdHJlYW08VD47IC8vIEN1cnJlbnQgaW5uZXIgU3RyZWFtXG4gIHByaXZhdGUgaWw6IEludGVybmFsTGlzdGVuZXI8VD47IC8vIEN1cnJlbnQgaW5uZXIgSW50ZXJuYWxMaXN0ZW5lclxuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFN0cmVhbTxUPj4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5pbCA9IE5PX0lMO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICBpZiAodGhpcy5pbm5lciAhPT0gTk8pIHRoaXMuaW5uZXIuX3JlbW92ZSh0aGlzLmlsKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5pbCA9IE5PX0lMO1xuICB9XG5cbiAgbGVzcygpOiB2b2lkIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLm9wZW4gJiYgdGhpcy5pbm5lciA9PT0gTk8pIHUuX2MoKTtcbiAgfVxuXG4gIF9uKHM6IFN0cmVhbTxUPikge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCB7aW5uZXIsIGlsfSA9IHRoaXM7XG4gICAgaWYgKGlubmVyICE9PSBOTyAmJiBpbCAhPT0gTk9fSUwpIGlubmVyLl9yZW1vdmUoaWwpO1xuICAgICh0aGlzLmlubmVyID0gcykuX2FkZCh0aGlzLmlsID0gbmV3IEZsYXR0ZW5MaXN0ZW5lcih1LCB0aGlzKSk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICB0aGlzLmxlc3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGb2xkPFQsIFI+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgUj4ge1xuICBwdWJsaWMgdHlwZSA9ICdmb2xkJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08Uj47XG4gIHB1YmxpYyBmOiAodDogVCkgPT4gUjtcbiAgcHVibGljIHNlZWQ6IFI7XG4gIHByaXZhdGUgYWNjOiBSOyAvLyBpbml0aWFsaXplZCBhcyBzZWVkXG5cbiAgY29uc3RydWN0b3IoZjogKGFjYzogUiwgdDogVCkgPT4gUiwgc2VlZDogUiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgICB0aGlzLmYgPSAodDogVCkgPT4gZih0aGlzLmFjYywgdCk7XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQgPSBzZWVkO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQ7XG4gICAgb3V0Ll9uKHRoaXMuYWNjKTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZDtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0aGlzLmFjYyA9IHIgYXMgUik7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIExhc3Q8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2xhc3QnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBoYXM6IGJvb2xlYW47XG4gIHByaXZhdGUgdmFsOiBUO1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5oYXMgPSBmYWxzZTtcbiAgICB0aGlzLnZhbCA9IE5PIGFzIFQ7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmhhcyA9IGZhbHNlO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMudmFsID0gTk8gYXMgVDtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICB0aGlzLmhhcyA9IHRydWU7XG4gICAgdGhpcy52YWwgPSB0O1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmhhcykge1xuICAgICAgdS5fbih0aGlzLnZhbCk7XG4gICAgICB1Ll9jKCk7XG4gICAgfSBlbHNlIHUuX2UobmV3IEVycm9yKCdsYXN0KCkgZmFpbGVkIGJlY2F1c2UgaW5wdXQgc3RyZWFtIGNvbXBsZXRlZCcpKTtcbiAgfVxufVxuXG5jbGFzcyBNYXBPcDxULCBSPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFI+IHtcbiAgcHVibGljIHR5cGUgPSAnbWFwJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08Uj47XG4gIHB1YmxpYyBmOiAodDogVCkgPT4gUjtcblxuICBjb25zdHJ1Y3Rvcihwcm9qZWN0OiAodDogVCkgPT4gUiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgICB0aGlzLmYgPSBwcm9qZWN0O1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24ociBhcyBSKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgUmVtZW1iZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAncmVtZW1iZXInO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZChvdXQpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzLm91dCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cbn1cblxuY2xhc3MgUmVwbGFjZUVycm9yPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdyZXBsYWNlRXJyb3InO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIGY6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKHJlcGxhY2VyOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmYgPSByZXBsYWNlcjtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAodGhpcy5pbnMgPSB0aGlzLmYoZXJyKSkuX2FkZCh0aGlzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB1Ll9lKGUpO1xuICAgIH1cbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgU3RhcnRXaXRoPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3N0YXJ0V2l0aCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgdmFsOiBUO1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCB2YWw6IFQpIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnZhbCA9IHZhbDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3V0Ll9uKHRoaXMudmFsKTtcbiAgICB0aGlzLmlucy5fYWRkKG91dCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMub3V0KTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxufVxuXG5jbGFzcyBUYWtlPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICd0YWtlJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBtYXg6IG51bWJlcjtcbiAgcHJpdmF0ZSB0YWtlbjogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKG1heDogbnVtYmVyLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubWF4ID0gbWF4O1xuICAgIHRoaXMudGFrZW4gPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy50YWtlbiA9IDA7XG4gICAgaWYgKHRoaXMubWF4IDw9IDApIG91dC5fYygpOyBlbHNlIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCBtID0gKyt0aGlzLnRha2VuO1xuICAgIGlmIChtIDwgdGhpcy5tYXgpIHUuX24odCk7IGVsc2UgaWYgKG0gPT09IHRoaXMubWF4KSB7XG4gICAgICB1Ll9uKHQpO1xuICAgICAgdS5fYygpO1xuICAgIH1cbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN0cmVhbTxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwdWJsaWMgX3Byb2Q6IEludGVybmFsUHJvZHVjZXI8VD47XG4gIHByb3RlY3RlZCBfaWxzOiBBcnJheTxJbnRlcm5hbExpc3RlbmVyPFQ+PjsgLy8gJ2lscycgPSBJbnRlcm5hbCBsaXN0ZW5lcnNcbiAgcHJvdGVjdGVkIF9zdG9wSUQ6IGFueTtcbiAgcHJvdGVjdGVkIF9kbDogSW50ZXJuYWxMaXN0ZW5lcjxUPjsgLy8gdGhlIGRlYnVnIGxpc3RlbmVyXG4gIHByb3RlY3RlZCBfZDogYm9vbGVhbjsgLy8gZmxhZyBpbmRpY2F0aW5nIHRoZSBleGlzdGVuY2Ugb2YgdGhlIGRlYnVnIGxpc3RlbmVyXG4gIHByb3RlY3RlZCBfdGFyZ2V0OiBTdHJlYW08VD47IC8vIGltaXRhdGlvbiB0YXJnZXQgaWYgdGhpcyBTdHJlYW0gd2lsbCBpbWl0YXRlXG4gIHByb3RlY3RlZCBfZXJyOiBhbnk7XG5cbiAgY29uc3RydWN0b3IocHJvZHVjZXI/OiBJbnRlcm5hbFByb2R1Y2VyPFQ+KSB7XG4gICAgdGhpcy5fcHJvZCA9IHByb2R1Y2VyIHx8IE5PIGFzIEludGVybmFsUHJvZHVjZXI8VD47XG4gICAgdGhpcy5faWxzID0gW107XG4gICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgdGhpcy5fZGwgPSBOTyBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIHRoaXMuX2QgPSBmYWxzZTtcbiAgICB0aGlzLl90YXJnZXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5fZXJyID0gTk87XG4gIH1cblxuICBfbih0OiBUKTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBMID0gYS5sZW5ndGg7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9uKHQpO1xuICAgIGlmIChMID09IDEpIGFbMF0uX24odCk7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9uKHQpO1xuICAgIH1cbiAgfVxuXG4gIF9lKGVycjogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2VyciAhPT0gTk8pIHJldHVybjtcbiAgICB0aGlzLl9lcnIgPSBlcnI7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBMID0gYS5sZW5ndGg7XG4gICAgdGhpcy5feCgpO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fZShlcnIpO1xuICAgIGlmIChMID09IDEpIGFbMF0uX2UoZXJyKTsgZWxzZSBpZiAoTCA9PSAwKSByZXR1cm47IGVsc2Uge1xuICAgICAgY29uc3QgYiA9IGNwKGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIGJbaV0uX2UoZXJyKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9kICYmIEwgPT0gMCkgdGhyb3cgdGhpcy5fZXJyO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBMID0gYS5sZW5ndGg7XG4gICAgdGhpcy5feCgpO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fYygpO1xuICAgIGlmIChMID09IDEpIGFbMF0uX2MoKTsgZWxzZSBpZiAoTCA9PSAwKSByZXR1cm47IGVsc2Uge1xuICAgICAgY29uc3QgYiA9IGNwKGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIGJbaV0uX2MoKTtcbiAgICB9XG4gIH1cblxuICBfeCgpOiB2b2lkIHsgLy8gdGVhciBkb3duIGxvZ2ljLCBhZnRlciBlcnJvciBvciBjb21wbGV0ZVxuICAgIGlmICh0aGlzLl9pbHMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX3Byb2QgIT09IE5PKSB0aGlzLl9wcm9kLl9zdG9wKCk7XG4gICAgdGhpcy5fZXJyID0gTk87XG4gICAgdGhpcy5faWxzID0gW107XG4gIH1cblxuICBfc3RvcE5vdygpIHtcbiAgICAvLyBXQVJOSU5HOiBjb2RlIHRoYXQgY2FsbHMgdGhpcyBtZXRob2Qgc2hvdWxkXG4gICAgLy8gZmlyc3QgY2hlY2sgaWYgdGhpcy5fcHJvZCBpcyB2YWxpZCAobm90IGBOT2ApXG4gICAgdGhpcy5fcHJvZC5fc3RvcCgpO1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICB9XG5cbiAgX2FkZChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgIGlmICh0YSAhPT0gTk8pIHJldHVybiB0YS5fYWRkKGlsKTtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGEucHVzaChpbCk7XG4gICAgaWYgKGEubGVuZ3RoID4gMSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9zdG9wSUQgIT09IE5PKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fc3RvcElEKTtcbiAgICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICAgIGlmIChwICE9PSBOTykgcC5fc3RhcnQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgX3JlbW92ZShpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgIGlmICh0YSAhPT0gTk8pIHJldHVybiB0YS5fcmVtb3ZlKGlsKTtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IGkgPSBhLmluZGV4T2YoaWwpO1xuICAgIGlmIChpID4gLTEpIHtcbiAgICAgIGEuc3BsaWNlKGksIDEpO1xuICAgICAgaWYgKHRoaXMuX3Byb2QgIT09IE5PICYmIGEubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgdGhpcy5fZXJyID0gTk87XG4gICAgICAgIHRoaXMuX3N0b3BJRCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fc3RvcE5vdygpKTtcbiAgICAgIH0gZWxzZSBpZiAoYS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdGhpcy5fcHJ1bmVDeWNsZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJZiBhbGwgcGF0aHMgc3RlbW1pbmcgZnJvbSBgdGhpc2Agc3RyZWFtIGV2ZW50dWFsbHkgZW5kIGF0IGB0aGlzYFxuICAvLyBzdHJlYW0sIHRoZW4gd2UgcmVtb3ZlIHRoZSBzaW5nbGUgbGlzdGVuZXIgb2YgYHRoaXNgIHN0cmVhbSwgdG9cbiAgLy8gZm9yY2UgaXQgdG8gZW5kIGl0cyBleGVjdXRpb24gYW5kIGRpc3Bvc2UgcmVzb3VyY2VzLiBUaGlzIG1ldGhvZFxuICAvLyBhc3N1bWVzIGFzIGEgcHJlY29uZGl0aW9uIHRoYXQgdGhpcy5faWxzIGhhcyBqdXN0IG9uZSBsaXN0ZW5lci5cbiAgX3BydW5lQ3ljbGVzKCkge1xuICAgIGlmICh0aGlzLl9oYXNOb1NpbmtzKHRoaXMsIFtdKSkgdGhpcy5fcmVtb3ZlKHRoaXMuX2lsc1swXSk7XG4gIH1cblxuICAvLyBDaGVja3Mgd2hldGhlciAqdGhlcmUgaXMgbm8qIHBhdGggc3RhcnRpbmcgZnJvbSBgeGAgdGhhdCBsZWFkcyB0byBhbiBlbmRcbiAgLy8gbGlzdGVuZXIgKHNpbmspIGluIHRoZSBzdHJlYW0gZ3JhcGgsIGZvbGxvd2luZyBlZGdlcyBBLT5CIHdoZXJlIEIgaXMgYVxuICAvLyBsaXN0ZW5lciBvZiBBLiBUaGlzIG1lYW5zIHRoZXNlIHBhdGhzIGNvbnN0aXR1dGUgYSBjeWNsZSBzb21laG93LiBJcyBnaXZlblxuICAvLyBhIHRyYWNlIG9mIGFsbCB2aXNpdGVkIG5vZGVzIHNvIGZhci5cbiAgX2hhc05vU2lua3MoeDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+LCB0cmFjZTogQXJyYXk8YW55Pik6IGJvb2xlYW4ge1xuICAgIGlmICh0cmFjZS5pbmRleE9mKHgpICE9PSAtMSlcbiAgICAgIHJldHVybiB0cnVlOyBlbHNlXG4gICAgaWYgKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ID09PSB0aGlzKVxuICAgICAgcmV0dXJuIHRydWU7IGVsc2VcbiAgICBpZiAoKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQgJiYgKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQgIT09IE5PKVxuICAgICAgcmV0dXJuIHRoaXMuX2hhc05vU2lua3MoKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQsIHRyYWNlLmNvbmNhdCh4KSk7IGVsc2VcbiAgICBpZiAoKHggYXMgU3RyZWFtPGFueT4pLl9pbHMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBOID0gKHggYXMgU3RyZWFtPGFueT4pLl9pbHMubGVuZ3RoOyBpIDwgTjsgaSsrKVxuICAgICAgICBpZiAoIXRoaXMuX2hhc05vU2lua3MoKHggYXMgU3RyZWFtPGFueT4pLl9pbHNbaV0sIHRyYWNlLmNvbmNhdCh4KSkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgY3RvcigpOiB0eXBlb2YgU3RyZWFtIHtcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIE1lbW9yeVN0cmVhbSA/IE1lbW9yeVN0cmVhbSA6IFN0cmVhbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgTGlzdGVuZXIgdG8gdGhlIFN0cmVhbS5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcn0gbGlzdGVuZXJcbiAgICovXG4gIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pik6IHZvaWQge1xuICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fbiA9IGxpc3RlbmVyLm5leHQgfHwgbm9vcDtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2UgPSBsaXN0ZW5lci5lcnJvciB8fCBub29wO1xuICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fYyA9IGxpc3RlbmVyLmNvbXBsZXRlIHx8IG5vb3A7XG4gICAgdGhpcy5fYWRkKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBMaXN0ZW5lciBmcm9tIHRoZSBTdHJlYW0sIGFzc3VtaW5nIHRoZSBMaXN0ZW5lciB3YXMgYWRkZWQgdG8gaXQuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXI8VD59IGxpc3RlbmVyXG4gICAqL1xuICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiB2b2lkIHtcbiAgICB0aGlzLl9yZW1vdmUobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIExpc3RlbmVyIHRvIHRoZSBTdHJlYW0gcmV0dXJuaW5nIGEgU3Vic2NyaXB0aW9uIHRvIHJlbW92ZSB0aGF0XG4gICAqIGxpc3RlbmVyLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyfSBsaXN0ZW5lclxuICAgKiBAcmV0dXJucyB7U3Vic2NyaXB0aW9ufVxuICAgKi9cbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pik6IFN1YnNjcmlwdGlvbiB7XG4gICAgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW1TdWI8VD4odGhpcywgbGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGludGVyb3AgYmV0d2VlbiBtb3N0LmpzIGFuZCBSeEpTIDVcbiAgICpcbiAgICogQHJldHVybnMge1N0cmVhbX1cbiAgICovXG4gIFskJG9ic2VydmFibGVdKCk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBTdHJlYW0gZ2l2ZW4gYSBQcm9kdWNlci5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb2R1Y2VyfSBwcm9kdWNlciBBbiBvcHRpb25hbCBQcm9kdWNlciB0aGF0IGRpY3RhdGVzIGhvdyB0b1xuICAgKiBzdGFydCwgZ2VuZXJhdGUgZXZlbnRzLCBhbmQgc3RvcCB0aGUgU3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlPFQ+KHByb2R1Y2VyPzogUHJvZHVjZXI8VD4pOiBTdHJlYW08VD4ge1xuICAgIGlmIChwcm9kdWNlcikge1xuICAgICAgaWYgKHR5cGVvZiBwcm9kdWNlci5zdGFydCAhPT0gJ2Z1bmN0aW9uJ1xuICAgICAgfHwgdHlwZW9mIHByb2R1Y2VyLnN0b3AgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncHJvZHVjZXIgcmVxdWlyZXMgYm90aCBzdGFydCBhbmQgc3RvcCBmdW5jdGlvbnMnKTtcbiAgICAgIGludGVybmFsaXplUHJvZHVjZXIocHJvZHVjZXIpOyAvLyBtdXRhdGVzIHRoZSBpbnB1dFxuICAgIH1cbiAgICByZXR1cm4gbmV3IFN0cmVhbShwcm9kdWNlciBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+ICYgUHJvZHVjZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTWVtb3J5U3RyZWFtIGdpdmVuIGEgUHJvZHVjZXIuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9kdWNlcn0gcHJvZHVjZXIgQW4gb3B0aW9uYWwgUHJvZHVjZXIgdGhhdCBkaWN0YXRlcyBob3cgdG9cbiAgICogc3RhcnQsIGdlbmVyYXRlIGV2ZW50cywgYW5kIHN0b3AgdGhlIFN0cmVhbS5cbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZVdpdGhNZW1vcnk8VD4ocHJvZHVjZXI/OiBQcm9kdWNlcjxUPik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgaWYgKHByb2R1Y2VyKSBpbnRlcm5hbGl6ZVByb2R1Y2VyKHByb2R1Y2VyKTsgLy8gbXV0YXRlcyB0aGUgaW5wdXRcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxUPihwcm9kdWNlciBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+ICYgUHJvZHVjZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBkb2VzIG5vdGhpbmcgd2hlbiBzdGFydGVkLiBJdCBuZXZlciBlbWl0cyBhbnkgZXZlbnQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqICAgICAgICAgIG5ldmVyXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBuZXZlcigpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7X3N0YXJ0OiBub29wLCBfc3RvcDogbm9vcH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyB0aGUgXCJjb21wbGV0ZVwiIG5vdGlmaWNhdGlvbiB3aGVuXG4gICAqIHN0YXJ0ZWQsIGFuZCB0aGF0J3MgaXQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGVtcHR5XG4gICAqIC18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBlbXB0eSgpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7XG4gICAgICBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8YW55PikgeyBpbC5fYygpOyB9LFxuICAgICAgX3N0b3A6IG5vb3AsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIGFuIFwiZXJyb3JcIiBub3RpZmljYXRpb24gd2l0aCB0aGVcbiAgICogdmFsdWUgeW91IHBhc3NlZCBhcyB0aGUgYGVycm9yYCBhcmd1bWVudCB3aGVuIHRoZSBzdHJlYW0gc3RhcnRzLCBhbmQgdGhhdCdzXG4gICAqIGl0LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiB0aHJvdyhYKVxuICAgKiAtWFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0gZXJyb3IgVGhlIGVycm9yIGV2ZW50IHRvIGVtaXQgb24gdGhlIGNyZWF0ZWQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgdGhyb3coZXJyb3I6IGFueSk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtcbiAgICAgIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+KSB7IGlsLl9lKGVycm9yKTsgfSxcbiAgICAgIF9zdG9wOiBub29wLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzdHJlYW0gZnJvbSBhbiBBcnJheSwgUHJvbWlzZSwgb3IgYW4gT2JzZXJ2YWJsZS5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge0FycmF5fFByb21pc2VMaWtlfE9ic2VydmFibGV9IGlucHV0IFRoZSBpbnB1dCB0byBtYWtlIGEgc3RyZWFtIGZyb20uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tPFQ+KGlucHV0OiBQcm9taXNlTGlrZTxUPiB8IFN0cmVhbTxUPiB8IEFycmF5PFQ+IHwgT2JzZXJ2YWJsZTxUPik6IFN0cmVhbTxUPiB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dFskJG9ic2VydmFibGVdID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tT2JzZXJ2YWJsZTxUPihpbnB1dCBhcyBPYnNlcnZhYmxlPFQ+KTsgZWxzZVxuICAgIGlmICh0eXBlb2YgKGlucHV0IGFzIFByb21pc2VMaWtlPFQ+KS50aGVuID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tUHJvbWlzZTxUPihpbnB1dCBhcyBQcm9taXNlTGlrZTxUPik7IGVsc2VcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpbnB1dCkpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21BcnJheTxUPihpbnB1dCk7XG5cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBUeXBlIG9mIGlucHV0IHRvIGZyb20oKSBtdXN0IGJlIGFuIEFycmF5LCBQcm9taXNlLCBvciBPYnNlcnZhYmxlYCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIHRoZSBhcmd1bWVudHMgdGhhdCB5b3UgZ2l2ZSB0b1xuICAgKiAqb2YqLCB0aGVuIGNvbXBsZXRlcy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogb2YoMSwyLDMpXG4gICAqIDEyM3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIGEgVGhlIGZpcnN0IHZhbHVlIHlvdSB3YW50IHRvIGVtaXQgYXMgYW4gZXZlbnQgb24gdGhlIHN0cmVhbS5cbiAgICogQHBhcmFtIGIgVGhlIHNlY29uZCB2YWx1ZSB5b3Ugd2FudCB0byBlbWl0IGFzIGFuIGV2ZW50IG9uIHRoZSBzdHJlYW0uIE9uZVxuICAgKiBvciBtb3JlIG9mIHRoZXNlIHZhbHVlcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgb2Y8VD4oLi4uaXRlbXM6IEFycmF5PFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gU3RyZWFtLmZyb21BcnJheTxUPihpdGVtcyk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYW4gYXJyYXkgdG8gYSBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gd2lsbCBlbWl0IHN5bmNocm9ub3VzbHlcbiAgICogYWxsIHRoZSBpdGVtcyBpbiB0aGUgYXJyYXksIGFuZCB0aGVuIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBmcm9tQXJyYXkoWzEsMiwzXSlcbiAgICogMTIzfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbUFycmF5PFQ+KGFycmF5OiBBcnJheTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZyb21BcnJheTxUPihhcnJheSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgcHJvbWlzZSB0byBhIHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSB3aWxsIGVtaXQgdGhlIHJlc29sdmVkXG4gICAqIHZhbHVlIG9mIHRoZSBwcm9taXNlLCBhbmQgdGhlbiBjb21wbGV0ZS4gSG93ZXZlciwgaWYgdGhlIHByb21pc2UgaXNcbiAgICogcmVqZWN0ZWQsIHRoZSBzdHJlYW0gd2lsbCBlbWl0IHRoZSBjb3JyZXNwb25kaW5nIGVycm9yLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBmcm9tUHJvbWlzZSggLS0tLTQyIClcbiAgICogLS0tLS0tLS0tLS0tLS0tLS00MnxcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9taXNlTGlrZX0gcHJvbWlzZSBUaGUgcHJvbWlzZSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tUHJvbWlzZTxUPihwcm9taXNlOiBQcm9taXNlTGlrZTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZyb21Qcm9taXNlPFQ+KHByb21pc2UpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhbiBPYnNlcnZhYmxlIGludG8gYSBTdHJlYW0uXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHthbnl9IG9ic2VydmFibGUgVGhlIG9ic2VydmFibGUgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbU9ic2VydmFibGU8VD4ob2JzOiB7c3Vic2NyaWJlOiBhbnl9KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAoKG9icyBhcyBTdHJlYW08VD4pLmVuZFdoZW4pIHJldHVybiBvYnMgYXMgU3RyZWFtPFQ+O1xuICAgIGNvbnN0IG8gPSB0eXBlb2Ygb2JzWyQkb2JzZXJ2YWJsZV0gPT09ICdmdW5jdGlvbicgPyBvYnNbJCRvYnNlcnZhYmxlXSgpIDogb2JzO1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tT2JzZXJ2YWJsZShvKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHN0cmVhbSB0aGF0IHBlcmlvZGljYWxseSBlbWl0cyBpbmNyZW1lbnRhbCBudW1iZXJzLCBldmVyeVxuICAgKiBgcGVyaW9kYCBtaWxsaXNlY29uZHMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqICAgICBwZXJpb2RpYygxMDAwKVxuICAgKiAtLS0wLS0tMS0tLTItLS0zLS0tNC0tLS4uLlxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge251bWJlcn0gcGVyaW9kIFRoZSBpbnRlcnZhbCBpbiBtaWxsaXNlY29uZHMgdG8gdXNlIGFzIGEgcmF0ZSBvZlxuICAgKiBlbWlzc2lvbi5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIHBlcmlvZGljKHBlcmlvZDogbnVtYmVyKTogU3RyZWFtPG51bWJlcj4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPG51bWJlcj4obmV3IFBlcmlvZGljKHBlcmlvZCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJsZW5kcyBtdWx0aXBsZSBzdHJlYW1zIHRvZ2V0aGVyLCBlbWl0dGluZyBldmVudHMgZnJvbSBhbGwgb2YgdGhlbVxuICAgKiBjb25jdXJyZW50bHkuXG4gICAqXG4gICAqICptZXJnZSogdGFrZXMgbXVsdGlwbGUgc3RyZWFtcyBhcyBhcmd1bWVudHMsIGFuZCBjcmVhdGVzIGEgc3RyZWFtIHRoYXRcbiAgICogYmVoYXZlcyBsaWtlIGVhY2ggb2YgdGhlIGFyZ3VtZW50IHN0cmVhbXMsIGluIHBhcmFsbGVsLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tLS0tNC0tLVxuICAgKiAtLS0tYS0tLS0tYi0tLS1jLS0tZC0tLS0tLVxuICAgKiAgICAgICAgICAgIG1lcmdlXG4gICAqIC0tMS1hLS0yLS1iLS0zLWMtLS1kLS00LS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIG1lcmdlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTIgQSBzdHJlYW0gdG8gbWVyZ2UgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLiBUd29cbiAgICogb3IgbW9yZSBzdHJlYW1zIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBtZXJnZTogTWVyZ2VTaWduYXR1cmUgPSBmdW5jdGlvbiBtZXJnZSguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KG5ldyBNZXJnZShzdHJlYW1zKSk7XG4gIH0gYXMgTWVyZ2VTaWduYXR1cmU7XG5cbiAgLyoqXG4gICAqIENvbWJpbmVzIG11bHRpcGxlIGlucHV0IHN0cmVhbXMgdG9nZXRoZXIgdG8gcmV0dXJuIGEgc3RyZWFtIHdob3NlIGV2ZW50c1xuICAgKiBhcmUgYXJyYXlzIHRoYXQgY29sbGVjdCB0aGUgbGF0ZXN0IGV2ZW50cyBmcm9tIGVhY2ggaW5wdXQgc3RyZWFtLlxuICAgKlxuICAgKiAqY29tYmluZSogaW50ZXJuYWxseSByZW1lbWJlcnMgdGhlIG1vc3QgcmVjZW50IGV2ZW50IGZyb20gZWFjaCBvZiB0aGUgaW5wdXRcbiAgICogc3RyZWFtcy4gV2hlbiBhbnkgb2YgdGhlIGlucHV0IHN0cmVhbXMgZW1pdHMgYW4gZXZlbnQsIHRoYXQgZXZlbnQgdG9nZXRoZXJcbiAgICogd2l0aCBhbGwgdGhlIG90aGVyIHNhdmVkIGV2ZW50cyBhcmUgY29tYmluZWQgaW50byBhbiBhcnJheS4gVGhhdCBhcnJheSB3aWxsXG4gICAqIGJlIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBzdHJlYW0uIEl0J3MgZXNzZW50aWFsbHkgYSB3YXkgb2Ygam9pbmluZyB0b2dldGhlclxuICAgKiB0aGUgZXZlbnRzIGZyb20gbXVsdGlwbGUgc3RyZWFtcy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS1cbiAgICogLS0tLWEtLS0tLWItLS0tLWMtLWQtLS0tLS1cbiAgICogICAgICAgICAgY29tYmluZVxuICAgKiAtLS0tMWEtMmEtMmItM2ItM2MtM2QtNGQtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBjb21iaW5lIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTIgQSBzdHJlYW0gdG8gY29tYmluZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIE11bHRpcGxlIHN0cmVhbXMsIG5vdCBqdXN0IHR3bywgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNvbWJpbmU6IENvbWJpbmVTaWduYXR1cmUgPSBmdW5jdGlvbiBjb21iaW5lKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPEFycmF5PGFueT4+KG5ldyBDb21iaW5lPGFueT4oc3RyZWFtcykpO1xuICB9IGFzIENvbWJpbmVTaWduYXR1cmU7XG5cbiAgcHJvdGVjdGVkIF9tYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBTdHJlYW08VT4gfCBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxVPihuZXcgTWFwT3A8VCwgVT4ocHJvamVjdCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgZWFjaCBldmVudCBmcm9tIHRoZSBpbnB1dCBTdHJlYW0gdGhyb3VnaCBhIGBwcm9qZWN0YCBmdW5jdGlvbixcbiAgICogdG8gZ2V0IGEgU3RyZWFtIHRoYXQgZW1pdHMgdGhvc2UgdHJhbnNmb3JtZWQgZXZlbnRzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0zLS01LS0tLS03LS0tLS0tXG4gICAqICAgIG1hcChpID0+IGkgKiAxMClcbiAgICogLS0xMC0tMzAtNTAtLS0tNzAtLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJvamVjdCBBIGZ1bmN0aW9uIG9mIHR5cGUgYCh0OiBUKSA9PiBVYCB0aGF0IHRha2VzIGV2ZW50XG4gICAqIGB0YCBvZiB0eXBlIGBUYCBmcm9tIHRoZSBpbnB1dCBTdHJlYW0gYW5kIHByb2R1Y2VzIGFuIGV2ZW50IG9mIHR5cGUgYFVgLCB0b1xuICAgKiBiZSBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgU3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBtYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBTdHJlYW08VT4ge1xuICAgIHJldHVybiB0aGlzLl9tYXAocHJvamVjdCk7XG4gIH1cblxuICAvKipcbiAgICogSXQncyBsaWtlIGBtYXBgLCBidXQgdHJhbnNmb3JtcyBlYWNoIGlucHV0IGV2ZW50IHRvIGFsd2F5cyB0aGUgc2FtZVxuICAgKiBjb25zdGFudCB2YWx1ZSBvbiB0aGUgb3V0cHV0IFN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMy0tNS0tLS0tNy0tLS0tXG4gICAqICAgICAgIG1hcFRvKDEwKVxuICAgKiAtLTEwLS0xMC0xMC0tLS0xMC0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBwcm9qZWN0ZWRWYWx1ZSBBIHZhbHVlIHRvIGVtaXQgb24gdGhlIG91dHB1dCBTdHJlYW0gd2hlbmV2ZXIgdGhlXG4gICAqIGlucHV0IFN0cmVhbSBlbWl0cyBhbnkgdmFsdWUuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIG1hcFRvPFU+KHByb2plY3RlZFZhbHVlOiBVKTogU3RyZWFtPFU+IHtcbiAgICBjb25zdCBzID0gdGhpcy5tYXAoKCkgPT4gcHJvamVjdGVkVmFsdWUpO1xuICAgIGNvbnN0IG9wOiBPcGVyYXRvcjxULCBVPiA9IHMuX3Byb2QgYXMgT3BlcmF0b3I8VCwgVT47XG4gICAgb3AudHlwZSA9ICdtYXBUbyc7XG4gICAgcmV0dXJuIHM7XG4gIH1cblxuICBmaWx0ZXI8UyBleHRlbmRzIFQ+KHBhc3NlczogKHQ6IFQpID0+IHQgaXMgUyk6IFN0cmVhbTxTPjtcbiAgZmlsdGVyKHBhc3NlczogKHQ6IFQpID0+IGJvb2xlYW4pOiBTdHJlYW08VD47XG4gIC8qKlxuICAgKiBPbmx5IGFsbG93cyBldmVudHMgdGhhdCBwYXNzIHRoZSB0ZXN0IGdpdmVuIGJ5IHRoZSBgcGFzc2VzYCBhcmd1bWVudC5cbiAgICpcbiAgICogRWFjaCBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gaXMgZ2l2ZW4gdG8gdGhlIGBwYXNzZXNgIGZ1bmN0aW9uLiBJZiB0aGVcbiAgICogZnVuY3Rpb24gcmV0dXJucyBgdHJ1ZWAsIHRoZSBldmVudCBpcyBmb3J3YXJkZWQgdG8gdGhlIG91dHB1dCBzdHJlYW0sXG4gICAqIG90aGVyd2lzZSBpdCBpcyBpZ25vcmVkIGFuZCBub3QgZm9yd2FyZGVkLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0yLS0zLS0tLS00LS0tLS01LS0tNi0tNy04LS1cbiAgICogICAgIGZpbHRlcihpID0+IGkgJSAyID09PSAwKVxuICAgKiAtLS0tLS0yLS0tLS0tLS00LS0tLS0tLS0tNi0tLS04LS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHBhc3NlcyBBIGZ1bmN0aW9uIG9mIHR5cGUgYCh0OiBUKSA9PiBib29sZWFuYCB0aGF0IHRha2VzXG4gICAqIGFuIGV2ZW50IGZyb20gdGhlIGlucHV0IHN0cmVhbSBhbmQgY2hlY2tzIGlmIGl0IHBhc3NlcywgYnkgcmV0dXJuaW5nIGFcbiAgICogYm9vbGVhbi5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZmlsdGVyKHBhc3NlczogKHQ6IFQpID0+IGJvb2xlYW4pOiBTdHJlYW08VD4ge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgIGlmIChwIGluc3RhbmNlb2YgRmlsdGVyKVxuICAgICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZpbHRlcjxUPihcbiAgICAgICAgYW5kKChwIGFzIEZpbHRlcjxUPikuZiwgcGFzc2VzKSxcbiAgICAgICAgKHAgYXMgRmlsdGVyPFQ+KS5pbnNcbiAgICAgICkpO1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGaWx0ZXI8VD4ocGFzc2VzLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogTGV0cyB0aGUgZmlyc3QgYGFtb3VudGAgbWFueSBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHBhc3MgdG8gdGhlXG4gICAqIG91dHB1dCBzdHJlYW0sIHRoZW4gbWFrZXMgdGhlIG91dHB1dCBzdHJlYW0gY29tcGxldGUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLS0tZC0tLWUtLVxuICAgKiAgICB0YWtlKDMpXG4gICAqIC0tYS0tLWItLWN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gYW1vdW50IEhvdyBtYW55IGV2ZW50cyB0byBhbGxvdyBmcm9tIHRoZSBpbnB1dCBzdHJlYW1cbiAgICogYmVmb3JlIGNvbXBsZXRpbmcgdGhlIG91dHB1dCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHRha2UoYW1vdW50OiBudW1iZXIpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgVGFrZTxUPihhbW91bnQsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZ25vcmVzIHRoZSBmaXJzdCBgYW1vdW50YCBtYW55IGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0sIGFuZCB0aGVuXG4gICAqIGFmdGVyIHRoYXQgc3RhcnRzIGZvcndhcmRpbmcgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSB0byB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tLS1kLS0tZS0tXG4gICAqICAgICAgIGRyb3AoMylcbiAgICogLS0tLS0tLS0tLS0tLS1kLS0tZS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gYW1vdW50IEhvdyBtYW55IGV2ZW50cyB0byBpZ25vcmUgZnJvbSB0aGUgaW5wdXQgc3RyZWFtXG4gICAqIGJlZm9yZSBmb3J3YXJkaW5nIGFsbCBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHRvIHRoZSBvdXRwdXQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBkcm9wKGFtb3VudDogbnVtYmVyKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRHJvcDxUPihhbW91bnQsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGVuIHRoZSBpbnB1dCBzdHJlYW0gY29tcGxldGVzLCB0aGUgb3V0cHV0IHN0cmVhbSB3aWxsIGVtaXQgdGhlIGxhc3QgZXZlbnRcbiAgICogZW1pdHRlZCBieSB0aGUgaW5wdXQgc3RyZWFtLCBhbmQgdGhlbiB3aWxsIGFsc28gY29tcGxldGUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLWQtLS0tfFxuICAgKiAgICAgICBsYXN0KClcbiAgICogLS0tLS0tLS0tLS0tLS0tLS1kfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbGFzdCgpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBMYXN0PFQ+KHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwZW5kcyB0aGUgZ2l2ZW4gYGluaXRpYWxgIHZhbHVlIHRvIHRoZSBzZXF1ZW5jZSBvZiBldmVudHMgZW1pdHRlZCBieSB0aGVcbiAgICogaW5wdXQgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIGlzIGEgTWVtb3J5U3RyZWFtLCB3aGljaCBtZWFucyBpdCBpc1xuICAgKiBhbHJlYWR5IGByZW1lbWJlcigpYCdkLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLS0xLS0tMi0tLS0tMy0tLVxuICAgKiAgIHN0YXJ0V2l0aCgwKVxuICAgKiAwLS0xLS0tMi0tLS0tMy0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGluaXRpYWwgVGhlIHZhbHVlIG9yIGV2ZW50IHRvIHByZXBlbmQuXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHN0YXJ0V2l0aChpbml0aWFsOiBUKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxUPihuZXcgU3RhcnRXaXRoPFQ+KHRoaXMsIGluaXRpYWwpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VzIGFub3RoZXIgc3RyZWFtIHRvIGRldGVybWluZSB3aGVuIHRvIGNvbXBsZXRlIHRoZSBjdXJyZW50IHN0cmVhbS5cbiAgICpcbiAgICogV2hlbiB0aGUgZ2l2ZW4gYG90aGVyYCBzdHJlYW0gZW1pdHMgYW4gZXZlbnQgb3IgY29tcGxldGVzLCB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbSB3aWxsIGNvbXBsZXRlLiBCZWZvcmUgdGhhdCBoYXBwZW5zLCB0aGUgb3V0cHV0IHN0cmVhbSB3aWxsIGJlaGF2ZXNcbiAgICogbGlrZSB0aGUgaW5wdXQgc3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLS0xLS0tMi0tLS0tMy0tNC0tLS01LS0tLTYtLS1cbiAgICogICBlbmRXaGVuKCAtLS0tLS0tLWEtLWItLXwgKVxuICAgKiAtLS0xLS0tMi0tLS0tMy0tNC0tfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIG90aGVyIFNvbWUgb3RoZXIgc3RyZWFtIHRoYXQgaXMgdXNlZCB0byBrbm93IHdoZW4gc2hvdWxkIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtIG9mIHRoaXMgb3BlcmF0b3IgY29tcGxldGUuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGVuZFdoZW4ob3RoZXI6IFN0cmVhbTxhbnk+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IEVuZFdoZW48VD4ob3RoZXIsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBcIkZvbGRzXCIgdGhlIHN0cmVhbSBvbnRvIGl0c2VsZi5cbiAgICpcbiAgICogQ29tYmluZXMgZXZlbnRzIGZyb20gdGhlIHBhc3QgdGhyb3VnaG91dFxuICAgKiB0aGUgZW50aXJlIGV4ZWN1dGlvbiBvZiB0aGUgaW5wdXQgc3RyZWFtLCBhbGxvd2luZyB5b3UgdG8gYWNjdW11bGF0ZSB0aGVtXG4gICAqIHRvZ2V0aGVyLiBJdCdzIGVzc2VudGlhbGx5IGxpa2UgYEFycmF5LnByb3RvdHlwZS5yZWR1Y2VgLiBUaGUgcmV0dXJuZWRcbiAgICogc3RyZWFtIGlzIGEgTWVtb3J5U3RyZWFtLCB3aGljaCBtZWFucyBpdCBpcyBhbHJlYWR5IGByZW1lbWJlcigpYCdkLlxuICAgKlxuICAgKiBUaGUgb3V0cHV0IHN0cmVhbSBzdGFydHMgYnkgZW1pdHRpbmcgdGhlIGBzZWVkYCB3aGljaCB5b3UgZ2l2ZSBhcyBhcmd1bWVudC5cbiAgICogVGhlbiwgd2hlbiBhbiBldmVudCBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIGl0IGlzIGNvbWJpbmVkIHdpdGggdGhhdFxuICAgKiBzZWVkIHZhbHVlIHRocm91Z2ggdGhlIGBhY2N1bXVsYXRlYCBmdW5jdGlvbiwgYW5kIHRoZSBvdXRwdXQgdmFsdWUgaXNcbiAgICogZW1pdHRlZCBvbiB0aGUgb3V0cHV0IHN0cmVhbS4gYGZvbGRgIHJlbWVtYmVycyB0aGF0IG91dHB1dCB2YWx1ZSBhcyBgYWNjYFxuICAgKiAoXCJhY2N1bXVsYXRvclwiKSwgYW5kIHRoZW4gd2hlbiBhIG5ldyBpbnB1dCBldmVudCBgdGAgaGFwcGVucywgYGFjY2Agd2lsbCBiZVxuICAgKiBjb21iaW5lZCB3aXRoIHRoYXQgdG8gcHJvZHVjZSB0aGUgbmV3IGBhY2NgIGFuZCBzbyBmb3J0aC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tLS0tMS0tLS0tMS0tMi0tLS0xLS0tLTEtLS0tLS1cbiAgICogICBmb2xkKChhY2MsIHgpID0+IGFjYyArIHgsIDMpXG4gICAqIDMtLS0tLTQtLS0tLTUtLTctLS0tOC0tLS05LS0tLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBhY2N1bXVsYXRlIEEgZnVuY3Rpb24gb2YgdHlwZSBgKGFjYzogUiwgdDogVCkgPT4gUmAgdGhhdFxuICAgKiB0YWtlcyB0aGUgcHJldmlvdXMgYWNjdW11bGF0ZWQgdmFsdWUgYGFjY2AgYW5kIHRoZSBpbmNvbWluZyBldmVudCBmcm9tIHRoZVxuICAgKiBpbnB1dCBzdHJlYW0gYW5kIHByb2R1Y2VzIHRoZSBuZXcgYWNjdW11bGF0ZWQgdmFsdWUuXG4gICAqIEBwYXJhbSBzZWVkIFRoZSBpbml0aWFsIGFjY3VtdWxhdGVkIHZhbHVlLCBvZiB0eXBlIGBSYC5cbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgZm9sZDxSPihhY2N1bXVsYXRlOiAoYWNjOiBSLCB0OiBUKSA9PiBSLCBzZWVkOiBSKTogTWVtb3J5U3RyZWFtPFI+IHtcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxSPihuZXcgRm9sZDxULCBSPihhY2N1bXVsYXRlLCBzZWVkLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVwbGFjZXMgYW4gZXJyb3Igd2l0aCBhbm90aGVyIHN0cmVhbS5cbiAgICpcbiAgICogV2hlbiAoYW5kIGlmKSBhbiBlcnJvciBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIGluc3RlYWQgb2YgZm9yd2FyZGluZ1xuICAgKiB0aGF0IGVycm9yIHRvIHRoZSBvdXRwdXQgc3RyZWFtLCAqcmVwbGFjZUVycm9yKiB3aWxsIGNhbGwgdGhlIGByZXBsYWNlYFxuICAgKiBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBzdHJlYW0gdGhhdCB0aGUgb3V0cHV0IHN0cmVhbSB3aWxsIHJlcGxpY2F0ZS5cbiAgICogQW5kLCBpbiBjYXNlIHRoYXQgbmV3IHN0cmVhbSBhbHNvIGVtaXRzIGFuIGVycm9yLCBgcmVwbGFjZWAgd2lsbCBiZSBjYWxsZWRcbiAgICogYWdhaW4gdG8gZ2V0IGFub3RoZXIgc3RyZWFtIHRvIHN0YXJ0IHJlcGxpY2F0aW5nLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0yLS0tLS0zLS00LS0tLS1YXG4gICAqICAgcmVwbGFjZUVycm9yKCAoKSA9PiAtLTEwLS18IClcbiAgICogLS0xLS0tMi0tLS0tMy0tNC0tLS0tLS0tMTAtLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHJlcGxhY2UgQSBmdW5jdGlvbiBvZiB0eXBlIGAoZXJyKSA9PiBTdHJlYW1gIHRoYXQgdGFrZXNcbiAgICogdGhlIGVycm9yIHRoYXQgb2NjdXJyZWQgb24gdGhlIGlucHV0IHN0cmVhbSBvciBvbiB0aGUgcHJldmlvdXMgcmVwbGFjZW1lbnRcbiAgICogc3RyZWFtIGFuZCByZXR1cm5zIGEgbmV3IHN0cmVhbS4gVGhlIG91dHB1dCBzdHJlYW0gd2lsbCBiZWhhdmUgbGlrZSB0aGVcbiAgICogc3RyZWFtIHRoYXQgdGhpcyBmdW5jdGlvbiByZXR1cm5zLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICByZXBsYWNlRXJyb3IocmVwbGFjZTogKGVycjogYW55KSA9PiBTdHJlYW08VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgUmVwbGFjZUVycm9yPFQ+KHJlcGxhY2UsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGbGF0dGVucyBhIFwic3RyZWFtIG9mIHN0cmVhbXNcIiwgaGFuZGxpbmcgb25seSBvbmUgbmVzdGVkIHN0cmVhbSBhdCBhIHRpbWVcbiAgICogKG5vIGNvbmN1cnJlbmN5KS5cbiAgICpcbiAgICogSWYgdGhlIGlucHV0IHN0cmVhbSBpcyBhIHN0cmVhbSB0aGF0IGVtaXRzIHN0cmVhbXMsIHRoZW4gdGhpcyBvcGVyYXRvciB3aWxsXG4gICAqIHJldHVybiBhbiBvdXRwdXQgc3RyZWFtIHdoaWNoIGlzIGEgZmxhdCBzdHJlYW06IGVtaXRzIHJlZ3VsYXIgZXZlbnRzLiBUaGVcbiAgICogZmxhdHRlbmluZyBoYXBwZW5zIHdpdGhvdXQgY29uY3VycmVuY3kuIEl0IHdvcmtzIGxpa2UgdGhpczogd2hlbiB0aGUgaW5wdXRcbiAgICogc3RyZWFtIGVtaXRzIGEgbmVzdGVkIHN0cmVhbSwgKmZsYXR0ZW4qIHdpbGwgc3RhcnQgaW1pdGF0aW5nIHRoYXQgbmVzdGVkXG4gICAqIG9uZS4gSG93ZXZlciwgYXMgc29vbiBhcyB0aGUgbmV4dCBuZXN0ZWQgc3RyZWFtIGlzIGVtaXR0ZWQgb24gdGhlIGlucHV0XG4gICAqIHN0cmVhbSwgKmZsYXR0ZW4qIHdpbGwgZm9yZ2V0IHRoZSBwcmV2aW91cyBuZXN0ZWQgb25lIGl0IHdhcyBpbWl0YXRpbmcsIGFuZFxuICAgKiB3aWxsIHN0YXJ0IGltaXRhdGluZyB0aGUgbmV3IG5lc3RlZCBvbmUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tKy0tLS0tLS0tKy0tLS0tLS0tLS0tLS0tLVxuICAgKiAgIFxcICAgICAgICBcXFxuICAgKiAgICBcXCAgICAgICAtLS0tMS0tLS0yLS0tMy0tXG4gICAqICAgIC0tYS0tYi0tLS1jLS0tLWQtLS0tLS0tLVxuICAgKiAgICAgICAgICAgZmxhdHRlblxuICAgKiAtLS0tLWEtLWItLS0tLS0xLS0tLTItLS0zLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGZsYXR0ZW48Uj4odGhpczogU3RyZWFtPFN0cmVhbTxSPj4pOiBUIHtcbiAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxSPihuZXcgRmxhdHRlbih0aGlzKSkgYXMgVCAmIFN0cmVhbTxSPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXNzZXMgdGhlIGlucHV0IHN0cmVhbSB0byBhIGN1c3RvbSBvcGVyYXRvciwgdG8gcHJvZHVjZSBhbiBvdXRwdXQgc3RyZWFtLlxuICAgKlxuICAgKiAqY29tcG9zZSogaXMgYSBoYW5keSB3YXkgb2YgdXNpbmcgYW4gZXhpc3RpbmcgZnVuY3Rpb24gaW4gYSBjaGFpbmVkIHN0eWxlLlxuICAgKiBJbnN0ZWFkIG9mIHdyaXRpbmcgYG91dFN0cmVhbSA9IGYoaW5TdHJlYW0pYCB5b3UgY2FuIHdyaXRlXG4gICAqIGBvdXRTdHJlYW0gPSBpblN0cmVhbS5jb21wb3NlKGYpYC5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gb3BlcmF0b3IgQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgc3RyZWFtIGFzIGlucHV0IGFuZFxuICAgKiByZXR1cm5zIGEgc3RyZWFtIGFzIHdlbGwuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGNvbXBvc2U8VT4ob3BlcmF0b3I6IChzdHJlYW06IFN0cmVhbTxUPikgPT4gVSk6IFUge1xuICAgIHJldHVybiBvcGVyYXRvcih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG91dHB1dCBzdHJlYW0gdGhhdCBiZWhhdmVzIGxpa2UgdGhlIGlucHV0IHN0cmVhbSwgYnV0IGFsc29cbiAgICogcmVtZW1iZXJzIHRoZSBtb3N0IHJlY2VudCBldmVudCB0aGF0IGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgc28gdGhhdCBhXG4gICAqIG5ld2x5IGFkZGVkIGxpc3RlbmVyIHdpbGwgaW1tZWRpYXRlbHkgcmVjZWl2ZSB0aGF0IG1lbW9yaXNlZCBldmVudC5cbiAgICpcbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgcmVtZW1iZXIoKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxUPihuZXcgUmVtZW1iZXI8VD4odGhpcykpO1xuICB9XG5cbiAgZGVidWcoKTogU3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiBzdHJpbmcpOiBTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6ICh0OiBUKSA9PiBhbnkpOiBTdHJlYW08VD47XG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG91dHB1dCBzdHJlYW0gdGhhdCBpZGVudGljYWxseSBiZWhhdmVzIGxpa2UgdGhlIGlucHV0IHN0cmVhbSxcbiAgICogYnV0IGFsc28gcnVucyBhIGBzcHlgIGZ1bmN0aW9uIGZvciBlYWNoIGV2ZW50LCB0byBoZWxwIHlvdSBkZWJ1ZyB5b3VyIGFwcC5cbiAgICpcbiAgICogKmRlYnVnKiB0YWtlcyBhIGBzcHlgIGZ1bmN0aW9uIGFzIGFyZ3VtZW50LCBhbmQgcnVucyB0aGF0IGZvciBlYWNoIGV2ZW50XG4gICAqIGhhcHBlbmluZyBvbiB0aGUgaW5wdXQgc3RyZWFtLiBJZiB5b3UgZG9uJ3QgcHJvdmlkZSB0aGUgYHNweWAgYXJndW1lbnQsXG4gICAqIHRoZW4gKmRlYnVnKiB3aWxsIGp1c3QgYGNvbnNvbGUubG9nYCBlYWNoIGV2ZW50LiBUaGlzIGhlbHBzIHlvdSB0b1xuICAgKiB1bmRlcnN0YW5kIHRoZSBmbG93IG9mIGV2ZW50cyB0aHJvdWdoIHNvbWUgb3BlcmF0b3IgY2hhaW4uXG4gICAqXG4gICAqIFBsZWFzZSBub3RlIHRoYXQgaWYgdGhlIG91dHB1dCBzdHJlYW0gaGFzIG5vIGxpc3RlbmVycywgdGhlbiBpdCB3aWxsIG5vdFxuICAgKiBzdGFydCwgd2hpY2ggbWVhbnMgYHNweWAgd2lsbCBuZXZlciBydW4gYmVjYXVzZSBubyBhY3R1YWwgZXZlbnQgaGFwcGVucyBpblxuICAgKiB0aGF0IGNhc2UuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS00LS1cbiAgICogICAgICAgICBkZWJ1Z1xuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tNC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsYWJlbE9yU3B5IEEgc3RyaW5nIHRvIHVzZSBhcyB0aGUgbGFiZWwgd2hlbiBwcmludGluZ1xuICAgKiBkZWJ1ZyBpbmZvcm1hdGlvbiBvbiB0aGUgY29uc29sZSwgb3IgYSAnc3B5JyBmdW5jdGlvbiB0aGF0IHRha2VzIGFuIGV2ZW50XG4gICAqIGFzIGFyZ3VtZW50LCBhbmQgZG9lcyBub3QgbmVlZCB0byByZXR1cm4gYW55dGhpbmcuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGRlYnVnKGxhYmVsT3JTcHk/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgRGVidWc8VD4odGhpcywgbGFiZWxPclNweSkpO1xuICB9XG5cbiAgLyoqXG4gICAqICppbWl0YXRlKiBjaGFuZ2VzIHRoaXMgY3VycmVudCBTdHJlYW0gdG8gZW1pdCB0aGUgc2FtZSBldmVudHMgdGhhdCB0aGVcbiAgICogYG90aGVyYCBnaXZlbiBTdHJlYW0gZG9lcy4gVGhpcyBtZXRob2QgcmV0dXJucyBub3RoaW5nLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBleGlzdHMgdG8gYWxsb3cgb25lIHRoaW5nOiAqKmNpcmN1bGFyIGRlcGVuZGVuY3kgb2Ygc3RyZWFtcyoqLlxuICAgKiBGb3IgaW5zdGFuY2UsIGxldCdzIGltYWdpbmUgdGhhdCBmb3Igc29tZSByZWFzb24geW91IG5lZWQgdG8gY3JlYXRlIGFcbiAgICogY2lyY3VsYXIgZGVwZW5kZW5jeSB3aGVyZSBzdHJlYW0gYGZpcnN0JGAgZGVwZW5kcyBvbiBzdHJlYW0gYHNlY29uZCRgXG4gICAqIHdoaWNoIGluIHR1cm4gZGVwZW5kcyBvbiBgZmlyc3QkYDpcbiAgICpcbiAgICogPCEtLSBza2lwLWV4YW1wbGUgLS0+XG4gICAqIGBgYGpzXG4gICAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICAgKlxuICAgKiB2YXIgZmlyc3QkID0gc2Vjb25kJC5tYXAoeCA9PiB4ICogMTApLnRha2UoMyk7XG4gICAqIHZhciBzZWNvbmQkID0gZmlyc3QkLm1hcCh4ID0+IHggKyAxKS5zdGFydFdpdGgoMSkuY29tcG9zZShkZWxheSgxMDApKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEhvd2V2ZXIsIHRoYXQgaXMgaW52YWxpZCBKYXZhU2NyaXB0LCBiZWNhdXNlIGBzZWNvbmQkYCBpcyB1bmRlZmluZWRcbiAgICogb24gdGhlIGZpcnN0IGxpbmUuIFRoaXMgaXMgaG93ICppbWl0YXRlKiBjYW4gaGVscCBzb2x2ZSBpdDpcbiAgICpcbiAgICogYGBganNcbiAgICogaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknXG4gICAqXG4gICAqIHZhciBzZWNvbmRQcm94eSQgPSB4cy5jcmVhdGUoKTtcbiAgICogdmFyIGZpcnN0JCA9IHNlY29uZFByb3h5JC5tYXAoeCA9PiB4ICogMTApLnRha2UoMyk7XG4gICAqIHZhciBzZWNvbmQkID0gZmlyc3QkLm1hcCh4ID0+IHggKyAxKS5zdGFydFdpdGgoMSkuY29tcG9zZShkZWxheSgxMDApKTtcbiAgICogc2Vjb25kUHJveHkkLmltaXRhdGUoc2Vjb25kJCk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBXZSBjcmVhdGUgYHNlY29uZFByb3h5JGAgYmVmb3JlIHRoZSBvdGhlcnMsIHNvIGl0IGNhbiBiZSB1c2VkIGluIHRoZVxuICAgKiBkZWNsYXJhdGlvbiBvZiBgZmlyc3QkYC4gVGhlbiwgYWZ0ZXIgYm90aCBgZmlyc3QkYCBhbmQgYHNlY29uZCRgIGFyZVxuICAgKiBkZWZpbmVkLCB3ZSBob29rIGBzZWNvbmRQcm94eSRgIHdpdGggYHNlY29uZCRgIHdpdGggYGltaXRhdGUoKWAgdG8gdGVsbFxuICAgKiB0aGF0IHRoZXkgYXJlIFwidGhlIHNhbWVcIi4gYGltaXRhdGVgIHdpbGwgbm90IHRyaWdnZXIgdGhlIHN0YXJ0IG9mIGFueVxuICAgKiBzdHJlYW0sIGl0IGp1c3QgYmluZHMgYHNlY29uZFByb3h5JGAgYW5kIGBzZWNvbmQkYCB0b2dldGhlci5cbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBpcyBhbiBleGFtcGxlIHdoZXJlIGBpbWl0YXRlKClgIGlzIGltcG9ydGFudCBpbiBDeWNsZS5qc1xuICAgKiBhcHBsaWNhdGlvbnMuIEEgcGFyZW50IGNvbXBvbmVudCBjb250YWlucyBzb21lIGNoaWxkIGNvbXBvbmVudHMuIEEgY2hpbGRcbiAgICogaGFzIGFuIGFjdGlvbiBzdHJlYW0gd2hpY2ggaXMgZ2l2ZW4gdG8gdGhlIHBhcmVudCB0byBkZWZpbmUgaXRzIHN0YXRlOlxuICAgKlxuICAgKiA8IS0tIHNraXAtZXhhbXBsZSAtLT5cbiAgICogYGBganNcbiAgICogY29uc3QgY2hpbGRBY3Rpb25Qcm94eSQgPSB4cy5jcmVhdGUoKTtcbiAgICogY29uc3QgcGFyZW50ID0gUGFyZW50KHsuLi5zb3VyY2VzLCBjaGlsZEFjdGlvbiQ6IGNoaWxkQWN0aW9uUHJveHkkfSk7XG4gICAqIGNvbnN0IGNoaWxkQWN0aW9uJCA9IHBhcmVudC5zdGF0ZSQubWFwKHMgPT4gcy5jaGlsZC5hY3Rpb24kKS5mbGF0dGVuKCk7XG4gICAqIGNoaWxkQWN0aW9uUHJveHkkLmltaXRhdGUoY2hpbGRBY3Rpb24kKTtcbiAgICogYGBgXG4gICAqXG4gICAqIE5vdGUsIHRob3VnaCwgdGhhdCAqKmBpbWl0YXRlKClgIGRvZXMgbm90IHN1cHBvcnQgTWVtb3J5U3RyZWFtcyoqLiBJZiB3ZVxuICAgKiB3b3VsZCBhdHRlbXB0IHRvIGltaXRhdGUgYSBNZW1vcnlTdHJlYW0gaW4gYSBjaXJjdWxhciBkZXBlbmRlbmN5LCB3ZSB3b3VsZFxuICAgKiBlaXRoZXIgZ2V0IGEgcmFjZSBjb25kaXRpb24gKHdoZXJlIHRoZSBzeW1wdG9tIHdvdWxkIGJlIFwibm90aGluZyBoYXBwZW5zXCIpXG4gICAqIG9yIGFuIGluZmluaXRlIGN5Y2xpYyBlbWlzc2lvbiBvZiB2YWx1ZXMuIEl0J3MgdXNlZnVsIHRvIHRoaW5rIGFib3V0XG4gICAqIE1lbW9yeVN0cmVhbXMgYXMgY2VsbHMgaW4gYSBzcHJlYWRzaGVldC4gSXQgZG9lc24ndCBtYWtlIGFueSBzZW5zZSB0b1xuICAgKiBkZWZpbmUgYSBzcHJlYWRzaGVldCBjZWxsIGBBMWAgd2l0aCBhIGZvcm11bGEgdGhhdCBkZXBlbmRzIG9uIGBCMWAgYW5kXG4gICAqIGNlbGwgYEIxYCBkZWZpbmVkIHdpdGggYSBmb3JtdWxhIHRoYXQgZGVwZW5kcyBvbiBgQTFgLlxuICAgKlxuICAgKiBJZiB5b3UgZmluZCB5b3Vyc2VsZiB3YW50aW5nIHRvIHVzZSBgaW1pdGF0ZSgpYCB3aXRoIGFcbiAgICogTWVtb3J5U3RyZWFtLCB5b3Ugc2hvdWxkIHJld29yayB5b3VyIGNvZGUgYXJvdW5kIGBpbWl0YXRlKClgIHRvIHVzZSBhXG4gICAqIFN0cmVhbSBpbnN0ZWFkLiBMb29rIGZvciB0aGUgc3RyZWFtIGluIHRoZSBjaXJjdWxhciBkZXBlbmRlbmN5IHRoYXRcbiAgICogcmVwcmVzZW50cyBhbiBldmVudCBzdHJlYW0sIGFuZCB0aGF0IHdvdWxkIGJlIGEgY2FuZGlkYXRlIGZvciBjcmVhdGluZyBhXG4gICAqIHByb3h5IFN0cmVhbSB3aGljaCB0aGVuIGltaXRhdGVzIHRoZSB0YXJnZXQgU3RyZWFtLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gdGFyZ2V0IFRoZSBvdGhlciBzdHJlYW0gdG8gaW1pdGF0ZSBvbiB0aGUgY3VycmVudCBvbmUuIE11c3RcbiAgICogbm90IGJlIGEgTWVtb3J5U3RyZWFtLlxuICAgKi9cbiAgaW1pdGF0ZSh0YXJnZXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBNZW1vcnlTdHJlYW0pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgTWVtb3J5U3RyZWFtIHdhcyBnaXZlbiB0byBpbWl0YXRlKCksIGJ1dCBpdCBvbmx5ICcgK1xuICAgICAgJ3N1cHBvcnRzIGEgU3RyZWFtLiBSZWFkIG1vcmUgYWJvdXQgdGhpcyByZXN0cmljdGlvbiBoZXJlOiAnICtcbiAgICAgICdodHRwczovL2dpdGh1Yi5jb20vc3RhbHR6L3hzdHJlYW0jZmFxJyk7XG4gICAgdGhpcy5fdGFyZ2V0ID0gdGFyZ2V0O1xuICAgIGZvciAobGV0IGlscyA9IHRoaXMuX2lscywgTiA9IGlscy5sZW5ndGgsIGkgPSAwOyBpIDwgTjsgaSsrKSB0YXJnZXQuX2FkZChpbHNbaV0pO1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIGdpdmVuIHZhbHVlIHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIFwibmV4dFwiIHZhbHVlIHlvdSB3YW50IHRvIGJyb2FkY2FzdCB0byBhbGwgbGlzdGVuZXJzIG9mXG4gICAqIHRoaXMgU3RyZWFtLlxuICAgKi9cbiAgc2hhbWVmdWxseVNlbmROZXh0KHZhbHVlOiBUKSB7XG4gICAgdGhpcy5fbih2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgZ2l2ZW4gZXJyb3IgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBlcnJvciBUaGUgZXJyb3IgeW91IHdhbnQgdG8gYnJvYWRjYXN0IHRvIGFsbCB0aGUgbGlzdGVuZXJzIG9mXG4gICAqIHRoaXMgU3RyZWFtLlxuICAgKi9cbiAgc2hhbWVmdWxseVNlbmRFcnJvcihlcnJvcjogYW55KSB7XG4gICAgdGhpcy5fZShlcnJvcik7XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgXCJjb21wbGV0ZWRcIiBldmVudCB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kQ29tcGxldGUoKSB7XG4gICAgdGhpcy5fYygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBcImRlYnVnXCIgbGlzdGVuZXIgdG8gdGhlIHN0cmVhbS4gVGhlcmUgY2FuIG9ubHkgYmUgb25lIGRlYnVnXG4gICAqIGxpc3RlbmVyLCB0aGF0J3Mgd2h5IHRoaXMgaXMgJ3NldERlYnVnTGlzdGVuZXInLiBUbyByZW1vdmUgdGhlIGRlYnVnXG4gICAqIGxpc3RlbmVyLCBqdXN0IGNhbGwgc2V0RGVidWdMaXN0ZW5lcihudWxsKS5cbiAgICpcbiAgICogQSBkZWJ1ZyBsaXN0ZW5lciBpcyBsaWtlIGFueSBvdGhlciBsaXN0ZW5lci4gVGhlIG9ubHkgZGlmZmVyZW5jZSBpcyB0aGF0IGFcbiAgICogZGVidWcgbGlzdGVuZXIgaXMgXCJzdGVhbHRoeVwiOiBpdHMgcHJlc2VuY2UvYWJzZW5jZSBkb2VzIG5vdCB0cmlnZ2VyIHRoZVxuICAgKiBzdGFydC9zdG9wIG9mIHRoZSBzdHJlYW0gKG9yIHRoZSBwcm9kdWNlciBpbnNpZGUgdGhlIHN0cmVhbSkuIFRoaXMgaXNcbiAgICogdXNlZnVsIHNvIHlvdSBjYW4gaW5zcGVjdCB3aGF0IGlzIGdvaW5nIG9uIHdpdGhvdXQgY2hhbmdpbmcgdGhlIGJlaGF2aW9yXG4gICAqIG9mIHRoZSBwcm9ncmFtLiBJZiB5b3UgaGF2ZSBhbiBpZGxlIHN0cmVhbSBhbmQgeW91IGFkZCBhIG5vcm1hbCBsaXN0ZW5lciB0b1xuICAgKiBpdCwgdGhlIHN0cmVhbSB3aWxsIHN0YXJ0IGV4ZWN1dGluZy4gQnV0IGlmIHlvdSBzZXQgYSBkZWJ1ZyBsaXN0ZW5lciBvbiBhblxuICAgKiBpZGxlIHN0cmVhbSwgaXQgd29uJ3Qgc3RhcnQgZXhlY3V0aW5nIChub3QgdW50aWwgdGhlIGZpcnN0IG5vcm1hbCBsaXN0ZW5lclxuICAgKiBpcyBhZGRlZCkuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgd2UgZG9uJ3QgcmVjb21tZW5kIHVzaW5nIHRoaXMgbWV0aG9kIHRvIGJ1aWxkIGFwcFxuICAgKiBsb2dpYy4gSW4gZmFjdCwgaW4gbW9zdCBjYXNlcyB0aGUgZGVidWcgb3BlcmF0b3Igd29ya3MganVzdCBmaW5lLiBPbmx5IHVzZVxuICAgKiB0aGlzIG9uZSBpZiB5b3Uga25vdyB3aGF0IHlvdSdyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcjxUPn0gbGlzdGVuZXJcbiAgICovXG4gIHNldERlYnVnTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+IHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX2QgPSBmYWxzZTtcbiAgICAgIHRoaXMuX2RsID0gTk8gYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZCA9IHRydWU7XG4gICAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX24gPSBsaXN0ZW5lci5uZXh0IHx8IG5vb3A7XG4gICAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2UgPSBsaXN0ZW5lci5lcnJvciB8fCBub29wO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9jID0gbGlzdGVuZXIuY29tcGxldGUgfHwgbm9vcDtcbiAgICAgIHRoaXMuX2RsID0gbGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0cmVhbTxUPiBleHRlbmRzIFN0cmVhbTxUPiB7XG4gIHByaXZhdGUgX3Y6IFQ7XG4gIHByaXZhdGUgX2hhczogYm9vbGVhbiA9IGZhbHNlO1xuICBjb25zdHJ1Y3Rvcihwcm9kdWNlcjogSW50ZXJuYWxQcm9kdWNlcjxUPikge1xuICAgIHN1cGVyKHByb2R1Y2VyKTtcbiAgfVxuXG4gIF9uKHg6IFQpIHtcbiAgICB0aGlzLl92ID0geDtcbiAgICB0aGlzLl9oYXMgPSB0cnVlO1xuICAgIHN1cGVyLl9uKHgpO1xuICB9XG5cbiAgX2FkZChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgIGlmICh0YSAhPT0gTk8pIHJldHVybiB0YS5fYWRkKGlsKTtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGEucHVzaChpbCk7XG4gICAgaWYgKGEubGVuZ3RoID4gMSkge1xuICAgICAgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9zdG9wSUQgIT09IE5PKSB7XG4gICAgICBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zdG9wSUQpO1xuICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgfSBlbHNlIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpOyBlbHNlIHtcbiAgICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgICAgaWYgKHAgIT09IE5PKSBwLl9zdGFydCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBfc3RvcE5vdygpIHtcbiAgICB0aGlzLl9oYXMgPSBmYWxzZTtcbiAgICBzdXBlci5fc3RvcE5vdygpO1xuICB9XG5cbiAgX3goKTogdm9pZCB7XG4gICAgdGhpcy5faGFzID0gZmFsc2U7XG4gICAgc3VwZXIuX3goKTtcbiAgfVxuXG4gIG1hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IE1lbW9yeVN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIHRoaXMuX21hcChwcm9qZWN0KSBhcyBNZW1vcnlTdHJlYW08VT47XG4gIH1cblxuICBtYXBUbzxVPihwcm9qZWN0ZWRWYWx1ZTogVSk6IE1lbW9yeVN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIHN1cGVyLm1hcFRvKHByb2plY3RlZFZhbHVlKSBhcyBNZW1vcnlTdHJlYW08VT47XG4gIH1cblxuICB0YWtlKGFtb3VudDogbnVtYmVyKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIudGFrZShhbW91bnQpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIGVuZFdoZW4ob3RoZXI6IFN0cmVhbTxhbnk+KTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIuZW5kV2hlbihvdGhlcikgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG5cbiAgcmVwbGFjZUVycm9yKHJlcGxhY2U6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+KTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIucmVwbGFjZUVycm9yKHJlcGxhY2UpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIHJlbWVtYmVyKCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkZWJ1ZygpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6IHN0cmluZyk6IE1lbW9yeVN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogKHQ6IFQpID0+IGFueSk6IE1lbW9yeVN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweT86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSB8IHVuZGVmaW5lZCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLmRlYnVnKGxhYmVsT3JTcHkgYXMgYW55KSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cbn1cblxuZXhwb3J0IHtOTywgTk9fSUx9O1xuY29uc3QgeHMgPSBTdHJlYW07XG50eXBlIHhzPFQ+ID0gU3RyZWFtPFQ+O1xuZXhwb3J0IGRlZmF1bHQgeHM7XG4iXX0=

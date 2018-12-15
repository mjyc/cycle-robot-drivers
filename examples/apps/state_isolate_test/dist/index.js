(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _run = require('@cycle/run');

var _run2 = _interopRequireDefault(_run);

var _isolate = require('@cycle/isolate');

var _isolate2 = _interopRequireDefault(_isolate);

var _dom = require('@cycle/dom');

var _state = require('@cycle/state');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function NewCounter(sources) {
  var action$ = _xstream2.default.merge(sources.DOM.select('.decrement').events('click').map(function (ev) {
    return -2;
  }), sources.DOM.select('.increment').events('click').map(function (ev) {
    return +2;
  }));

  var state$ = sources.state.stream;

  var vdom$ = state$.map(function (state) {
    return (0, _dom.div)([(0, _dom.button)('.decrement', 'Decrement'), (0, _dom.button)('.increment', 'Increment'), (0, _dom.p)('NCounter: ' + state.ncount)]);
  });

  var initReducer$ = _xstream2.default.of(function initReducer(prevState) {
    if (prevState) {
      return prevState;
    } else {
      return { ncount: 0 };
    }
  });
  var updateReducer$ = action$.map(function (num) {
    return function updateReducer(prevState) {
      return { ncount: prevState.ncount + num };
    };
  });
  var reducer$ = _xstream2.default.merge(initReducer$, updateReducer$);

  return {
    DOM: vdom$,
    state: reducer$
  };
}

function Counter(sources) {

  var sinks2 = (0, _isolate2.default)(NewCounter, { state: 'newcounter' })(sources);

  var action$ = _xstream2.default.merge(sources.DOM.select('.decrement').events('click').map(function (ev) {
    return -1;
  }), sources.DOM.select('.increment').events('click').map(function (ev) {
    return +1;
  }));

  var state$ = sources.state.stream;

  var vdom$ = state$.map(function (state) {
    return (0, _dom.div)([(0, _dom.div)([(0, _dom.button)('.decrement', 'Decrement'), (0, _dom.button)('.increment', 'Increment'), (0, _dom.p)('Counter: ' + state.count)])]);
  });
  var vdom2$ = _xstream2.default.combine(vdom$, sinks2.DOM).map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        v1 = _ref2[0],
        v2 = _ref2[1];

    return (0, _dom.div)([v1, v2]);
  });
  // const vdom$ = xs.combine(state$, sinks2.vdom$).map(([state, vdom]) =>
  //   div([
  //     div([
  //       button('.decrement', 'Decrement'),
  //       button('.increment', 'Increment'),
  //       p('Counter: ' + !!state && state.count)
  //     ]),
  //     vdom,
  //   ]),
  // );

  var initReducer$ = _xstream2.default.of(function initReducer(prevState) {
    if (prevState) {
      return prevState;
    } else {
      return { count: 0 };
    }
  });
  var updateReducer$ = action$.map(function (num) {
    return function updateReducer(prevState) {
      return { count: prevState.count + num };
    };
  });
  var reducer$ = _xstream2.default.merge(initReducer$, updateReducer$, sinks2.state);

  return {
    // DOM: vdom$,
    DOM: vdom2$,
    state: reducer$
  };
}

function main(sources) {
  var state$ = sources.state.stream;
  state$.addListener({ next: function next(v) {
      return console.log(v);
    } });

  var sinks = (0, _isolate2.default)(Counter, { state: 'counter' })(sources);

  return sinks;
}

var wrappedMain = (0, _state.withState)(main);

(0, _run2.default)(wrappedMain, {
  DOM: (0, _dom.makeDOMDriver)('#app')
});

},{"@cycle/dom":15,"@cycle/isolate":22,"@cycle/run":25,"@cycle/state":29,"xstream":66}],2:[function(require,module,exports){
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

},{"./fromEvent":13,"@cycle/run/lib/adapt":23,"xstream":66}],3:[function(require,module,exports){
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

},{"./fromEvent":13,"@cycle/run/lib/adapt":23,"xstream":66}],4:[function(require,module,exports){
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

},{"./ScopeChecker":10,"./utils":21}],5:[function(require,module,exports){
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

},{"./ElementFinder":4,"./PriorityQueue":8,"./RemovalSet":9,"./ScopeChecker":10,"./SymbolTree":11,"./fromEvent":13,"./utils":21,"xstream":66}],6:[function(require,module,exports){
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

},{"./SymbolTree":11,"./utils":21}],7:[function(require,module,exports){
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

},{"./BodyDOMSource":2,"./DocumentDOMSource":3,"./ElementFinder":4,"./isolate":16,"@cycle/run/lib/adapt":23}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
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

},{"./utils":21}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{"./utils":21,"snabbdom-selector":40,"snabbdom/h":44,"snabbdom/vnode":55}],13:[function(require,module,exports){
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

},{"xstream":66}],14:[function(require,module,exports){
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

},{"snabbdom/h":44}],15:[function(require,module,exports){
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

},{"./MainDOMSource":7,"./hyperscript-helpers":14,"./makeDOMDriver":17,"./mockDOMSource":18,"./thunk":20,"snabbdom/h":44}],16:[function(require,module,exports){
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

},{"./utils":21}],17:[function(require,module,exports){
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

},{"./EventDelegator":5,"./IsolateModule":6,"./MainDOMSource":7,"./VNodeWrapper":12,"./modules":19,"./utils":21,"snabbdom":52,"snabbdom/tovnode":54,"xstream":66,"xstream/extra/concat":63,"xstream/extra/sampleCombine":65}],18:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":23,"xstream":66}],19:[function(require,module,exports){
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

},{"snabbdom/modules/attributes":47,"snabbdom/modules/class":48,"snabbdom/modules/dataset":49,"snabbdom/modules/props":50,"snabbdom/modules/style":51}],20:[function(require,module,exports){
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

},{"snabbdom/h":44}],21:[function(require,module,exports){
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

},{}],22:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":23,"xstream":66}],23:[function(require,module,exports){
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

},{}],25:[function(require,module,exports){
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

},{"./internals":26}],26:[function(require,module,exports){
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

},{"./adapt":24,"quicktask":36,"xstream":66}],27:[function(require,module,exports){
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

},{"./pickCombine":30,"./pickMerge":31,"@cycle/isolate":33,"@cycle/run/lib/adapt":34,"xstream":66}],28:[function(require,module,exports){
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

},{"@cycle/run/lib/adapt":34,"xstream/extra/dropRepeats":64}],29:[function(require,module,exports){
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

},{"./Collection":27,"./StateSource":28,"./withState":32}],30:[function(require,module,exports){
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

},{"xstream":66}],31:[function(require,module,exports){
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

},{"xstream":66}],32:[function(require,module,exports){
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

},{"./StateSource":28,"quicktask":36,"xstream":66,"xstream/extra/concat":63}],33:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"@cycle/run/lib/adapt":34,"dup":22,"xstream":66}],34:[function(require,module,exports){
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

},{}],36:[function(require,module,exports){
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

},{"_process":35,"timers":58}],37:[function(require,module,exports){
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

},{"./selectorParser":43}],38:[function(require,module,exports){
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

},{}],39:[function(require,module,exports){
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

},{"./parent-symbol":41,"./query":42}],40:[function(require,module,exports){
"use strict";
var curry2_1 = require('./curry2');
var findMatches_1 = require('./findMatches');
exports.select = curry2_1.curry2(findMatches_1.findMatches);
var selectorParser_1 = require('./selectorParser');
exports.selectorParser = selectorParser_1.selectorParser;
var classNameFromVNode_1 = require('./classNameFromVNode');
exports.classNameFromVNode = classNameFromVNode_1.classNameFromVNode;

},{"./classNameFromVNode":37,"./curry2":38,"./findMatches":39,"./selectorParser":43}],41:[function(require,module,exports){
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

},{}],42:[function(require,module,exports){
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

},{"./classNameFromVNode":37,"./parent-symbol":41,"./selectorParser":43,"tree-selector":59}],43:[function(require,module,exports){
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

},{}],44:[function(require,module,exports){
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

},{"./is":46,"./vnode":55}],45:[function(require,module,exports){
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

},{}],46:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.array = Array.isArray;
function primitive(s) {
    return typeof s === 'string' || typeof s === 'number';
}
exports.primitive = primitive;

},{}],47:[function(require,module,exports){
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

},{}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
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

},{}],50:[function(require,module,exports){
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

},{}],51:[function(require,module,exports){
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

},{}],52:[function(require,module,exports){
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

},{"./h":44,"./htmldomapi":45,"./is":46,"./thunk":53,"./vnode":55}],53:[function(require,module,exports){
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

},{"./h":44}],54:[function(require,module,exports){
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

},{"./htmldomapi":45,"./vnode":55}],55:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function vnode(sel, data, children, text, elm) {
    var key = data === undefined ? undefined : data.key;
    return { sel: sel, data: data, children: children,
        text: text, elm: elm, key: key };
}
exports.vnode = vnode;
exports.default = vnode;

},{}],56:[function(require,module,exports){
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

},{"./ponyfill.js":57}],57:[function(require,module,exports){
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
},{}],58:[function(require,module,exports){
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

},{"process/browser.js":35,"timers":58}],59:[function(require,module,exports){
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

},{"./matches":60,"./querySelector":61,"./selectorParser":62}],60:[function(require,module,exports){
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

},{"./selectorParser":62}],61:[function(require,module,exports){
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

},{"./matches":60,"./selectorParser":62}],62:[function(require,module,exports){
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

},{}],63:[function(require,module,exports){
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

},{"../index":66}],64:[function(require,module,exports){
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

},{"../index":66}],65:[function(require,module,exports){
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

},{"../index":66}],66:[function(require,module,exports){
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

},{"symbol-observable":56}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvQm9keURPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvRG9jdW1lbnRET01Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0VsZW1lbnRGaW5kZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL0V2ZW50RGVsZWdhdG9yLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9Jc29sYXRlTW9kdWxlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9NYWluRE9NU291cmNlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9Qcmlvcml0eVF1ZXVlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9SZW1vdmFsU2V0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9TY29wZUNoZWNrZXIuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL1N5bWJvbFRyZWUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL1ZOb2RlV3JhcHBlci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvZnJvbUV2ZW50LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9oeXBlcnNjcmlwdC1oZWxwZXJzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9kb20vbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvaXNvbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvbWFrZURPTURyaXZlci5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvbW9ja0RPTVNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvbW9kdWxlcy5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvZG9tL2xpYi9janMvdGh1bmsuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL2RvbS9saWIvY2pzL3V0aWxzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9pc29sYXRlL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW50ZXJuYWxzLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL0NvbGxlY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvU3RhdGVTb3VyY2UuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvcGlja0NvbWJpbmUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3N0YXRlL2xpYi9janMvcGlja01lcmdlLmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9zdGF0ZS9saWIvY2pzL3dpdGhTdGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvc3RhdGUvbm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9xdWlja3Rhc2svaW5kZXguanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL2NsYXNzTmFtZUZyb21WTm9kZS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvY3VycnkyLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9maW5kTWF0Y2hlcy5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS1zZWxlY3Rvci9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL3BhcmVudC1zeW1ib2wuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20tc2VsZWN0b3IvbGliL3F1ZXJ5LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tLXNlbGVjdG9yL2xpYi9zZWxlY3RvclBhcnNlci5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9oLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL2h0bWxkb21hcGkuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vaXMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvY2xhc3MuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9kYXRhc2V0LmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL21vZHVsZXMvcHJvcHMuanMiLCJub2RlX21vZHVsZXMvc25hYmJkb20vbW9kdWxlcy9zdHlsZS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS9zbmFiYmRvbS5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS90aHVuay5qcyIsIm5vZGVfbW9kdWxlcy9zbmFiYmRvbS90b3Zub2RlLmpzIiwibm9kZV9tb2R1bGVzL3NuYWJiZG9tL3Zub2RlLmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9zeW1ib2wtb2JzZXJ2YWJsZS9saWIvcG9ueWZpbGwuanMiLCJub2RlX21vZHVsZXMvdGltZXJzLWJyb3dzZXJpZnkvbWFpbi5qcyIsIm5vZGVfbW9kdWxlcy90cmVlLXNlbGVjdG9yL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvdHJlZS1zZWxlY3Rvci9saWIvY2pzL21hdGNoZXMuanMiLCJub2RlX21vZHVsZXMvdHJlZS1zZWxlY3Rvci9saWIvY2pzL3F1ZXJ5U2VsZWN0b3IuanMiLCJub2RlX21vZHVsZXMvdHJlZS1zZWxlY3Rvci9saWIvY2pzL3NlbGVjdG9yUGFyc2VyLmpzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2NvbmNhdC50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9kcm9wUmVwZWF0cy50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9leHRyYS9zYW1wbGVDb21iaW5lLnRzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7OztBQ0FBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOztBQUNBOzs7O0FBRUEsU0FBUyxVQUFULENBQW9CLE9BQXBCLEVBQTZCO0FBQzNCLE1BQU0sVUFBVSxrQkFBRyxLQUFILENBQ2QsUUFBUSxHQUFSLENBQVksTUFBWixDQUFtQixZQUFuQixFQUFpQyxNQUFqQyxDQUF3QyxPQUF4QyxFQUFpRCxHQUFqRCxDQUFxRDtBQUFBLFdBQU0sQ0FBQyxDQUFQO0FBQUEsR0FBckQsQ0FEYyxFQUVkLFFBQVEsR0FBUixDQUFZLE1BQVosQ0FBbUIsWUFBbkIsRUFBaUMsTUFBakMsQ0FBd0MsT0FBeEMsRUFBaUQsR0FBakQsQ0FBcUQ7QUFBQSxXQUFNLENBQUMsQ0FBUDtBQUFBLEdBQXJELENBRmMsQ0FBaEI7O0FBS0EsTUFBTSxTQUFTLFFBQVEsS0FBUixDQUFjLE1BQTdCOztBQUVBLE1BQU0sUUFBUSxPQUFPLEdBQVAsQ0FBVztBQUFBLFdBQ3ZCLGNBQUksQ0FDRixpQkFBTyxZQUFQLEVBQXFCLFdBQXJCLENBREUsRUFFRixpQkFBTyxZQUFQLEVBQXFCLFdBQXJCLENBRkUsRUFHRixZQUFFLGVBQWUsTUFBTSxNQUF2QixDQUhFLENBQUosQ0FEdUI7QUFBQSxHQUFYLENBQWQ7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Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3ZLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QUM7UUFDbEQsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNO1lBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM1QyxDQUFDO0lBRUQsOEJBQUssR0FBTDtRQUNFLElBQUksSUFBSSxDQUFDLElBQUk7WUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO0lBQ3RCLENBQUM7SUFDSCxxQkFBQztBQUFELENBdkJBLEFBdUJDLElBQUE7QUF1RUQ7SUFNRSxlQUFZLE1BQXdCO1FBTDdCLFNBQUksR0FBRyxPQUFPLENBQUM7UUFNcEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFlLENBQUM7UUFDM0IsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDZCxDQUFDO0lBRUQsc0JBQU0sR0FBTixVQUFPLEdBQWM7UUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDZixJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3RCLElBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDbkIsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDWixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVELHFCQUFLLEdBQUw7UUFDRSxJQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3RCLElBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDbkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7WUFBRSxDQUFDLENBQUMs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ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuaW1wb3J0IHJ1biBmcm9tICdAY3ljbGUvcnVuJztcbmltcG9ydCBpc29sYXRlIGZyb20gJ0BjeWNsZS9pc29sYXRlJztcbmltcG9ydCB7ZGl2LCBidXR0b24sIHAsIG1ha2VET01Ecml2ZXJ9IGZyb20gJ0BjeWNsZS9kb20nO1xuaW1wb3J0IHt3aXRoU3RhdGV9IGZyb20gJ0BjeWNsZS9zdGF0ZSc7XG5cbmZ1bmN0aW9uIE5ld0NvdW50ZXIoc291cmNlcykge1xuICBjb25zdCBhY3Rpb24kID0geHMubWVyZ2UoXG4gICAgc291cmNlcy5ET00uc2VsZWN0KCcuZGVjcmVtZW50JykuZXZlbnRzKCdjbGljaycpLm1hcChldiA9PiAtMiksXG4gICAgc291cmNlcy5ET00uc2VsZWN0KCcuaW5jcmVtZW50JykuZXZlbnRzKCdjbGljaycpLm1hcChldiA9PiArMilcbiAgKTtcblxuICBjb25zdCBzdGF0ZSQgPSBzb3VyY2VzLnN0YXRlLnN0cmVhbTtcblxuICBjb25zdCB2ZG9tJCA9IHN0YXRlJC5tYXAoc3RhdGUgPT5cbiAgICBkaXYoW1xuICAgICAgYnV0dG9uKCcuZGVjcmVtZW50JywgJ0RlY3JlbWVudCcpLFxuICAgICAgYnV0dG9uKCcuaW5jcmVtZW50JywgJ0luY3JlbWVudCcpLFxuICAgICAgcCgnTkNvdW50ZXI6ICcgKyBzdGF0ZS5uY291bnQpXG4gICAgXSlcbiAgKTtcblxuICBjb25zdCBpbml0UmVkdWNlciQgPSB4cy5vZihmdW5jdGlvbiBpbml0UmVkdWNlcihwcmV2U3RhdGUpIHtcbiAgICBpZiAocHJldlN0YXRlKSB7XG4gICAgICByZXR1cm4gcHJldlN0YXRlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge25jb3VudDogMH07XG4gICAgfVxuICB9KTtcbiAgY29uc3QgdXBkYXRlUmVkdWNlciQgPSBhY3Rpb24kXG4gICAgLm1hcChudW0gPT4gZnVuY3Rpb24gdXBkYXRlUmVkdWNlcihwcmV2U3RhdGUpIHtcbiAgICAgIHJldHVybiB7bmNvdW50OiBwcmV2U3RhdGUubmNvdW50ICsgbnVtfTtcbiAgICB9KTtcbiAgY29uc3QgcmVkdWNlciQgPSB4cy5tZXJnZShpbml0UmVkdWNlciQsIHVwZGF0ZVJlZHVjZXIkKTtcblxuICByZXR1cm4ge1xuICAgIERPTTogdmRvbSQsXG4gICAgc3RhdGU6IHJlZHVjZXIkLFxuICB9O1xufVxuXG5mdW5jdGlvbiBDb3VudGVyKHNvdXJjZXMpIHtcblxuXG4gIGNvbnN0IHNpbmtzMiA9IGlzb2xhdGUoTmV3Q291bnRlciwge3N0YXRlOiAnbmV3Y291bnRlcid9KShzb3VyY2VzKTtcblxuXG4gIGNvbnN0IGFjdGlvbiQgPSB4cy5tZXJnZShcbiAgICBzb3VyY2VzLkRPTS5zZWxlY3QoJy5kZWNyZW1lbnQnKS5ldmVudHMoJ2NsaWNrJykubWFwKGV2ID0+IC0xKSxcbiAgICBzb3VyY2VzLkRPTS5zZWxlY3QoJy5pbmNyZW1lbnQnKS5ldmVudHMoJ2NsaWNrJykubWFwKGV2ID0+ICsxKVxuICApO1xuXG4gIGNvbnN0IHN0YXRlJCA9IHNvdXJjZXMuc3RhdGUuc3RyZWFtO1xuXG4gIGNvbnN0IHZkb20kID0gc3RhdGUkLm1hcCgoc3RhdGUpID0+XG4gICAgZGl2KFtcbiAgICAgIGRpdihbXG4gICAgICAgIGJ1dHRvbignLmRlY3JlbWVudCcsICdEZWNyZW1lbnQnKSxcbiAgICAgICAgYnV0dG9uKCcuaW5jcmVtZW50JywgJ0luY3JlbWVudCcpLFxuICAgICAgICBwKCdDb3VudGVyOiAnICsgc3RhdGUuY291bnQpXG4gICAgICBdKSxcbiAgICBdKSxcbiAgKTtcbiAgY29uc3QgdmRvbTIkID0geHMuY29tYmluZSh2ZG9tJCwgc2lua3MyLkRPTSkubWFwKChbdjEsIHYyXSkgPT4gZGl2KFt2MSwgdjJdKSk7XG4gIC8vIGNvbnN0IHZkb20kID0geHMuY29tYmluZShzdGF0ZSQsIHNpbmtzMi52ZG9tJCkubWFwKChbc3RhdGUsIHZkb21dKSA9PlxuICAvLyAgIGRpdihbXG4gIC8vICAgICBkaXYoW1xuICAvLyAgICAgICBidXR0b24oJy5kZWNyZW1lbnQnLCAnRGVjcmVtZW50JyksXG4gIC8vICAgICAgIGJ1dHRvbignLmluY3JlbWVudCcsICdJbmNyZW1lbnQnKSxcbiAgLy8gICAgICAgcCgnQ291bnRlcjogJyArICEhc3RhdGUgJiYgc3RhdGUuY291bnQpXG4gIC8vICAgICBdKSxcbiAgLy8gICAgIHZkb20sXG4gIC8vICAgXSksXG4gIC8vICk7XG5cbiAgY29uc3QgaW5pdFJlZHVjZXIkID0geHMub2YoZnVuY3Rpb24gaW5pdFJlZHVjZXIocHJldlN0YXRlKSB7XG4gICAgaWYgKHByZXZTdGF0ZSkge1xuICAgICAgcmV0dXJuIHByZXZTdGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtjb3VudDogMH07XG4gICAgfVxuICB9KTtcbiAgY29uc3QgdXBkYXRlUmVkdWNlciQgPSBhY3Rpb24kXG4gICAgLm1hcChudW0gPT4gZnVuY3Rpb24gdXBkYXRlUmVkdWNlcihwcmV2U3RhdGUpIHtcbiAgICAgIHJldHVybiB7Y291bnQ6IHByZXZTdGF0ZS5jb3VudCArIG51bX07XG4gICAgfSk7XG4gIGNvbnN0IHJlZHVjZXIkID0geHMubWVyZ2UoaW5pdFJlZHVjZXIkLCB1cGRhdGVSZWR1Y2VyJCwgc2lua3MyLnN0YXRlKTtcblxuICByZXR1cm4ge1xuICAgIC8vIERPTTogdmRvbSQsXG4gICAgRE9NOiB2ZG9tMiQsXG4gICAgc3RhdGU6IHJlZHVjZXIkLFxuICB9O1xufVxuXG5mdW5jdGlvbiBtYWluKHNvdXJjZXMpIHtcbiAgY29uc3Qgc3RhdGUkID0gc291cmNlcy5zdGF0ZS5zdHJlYW07XG4gIHN0YXRlJC5hZGRMaXN0ZW5lcih7bmV4dDogdiA9PiBjb25zb2xlLmxvZyh2KX0pXG5cbiAgY29uc3Qgc2lua3MgPSBpc29sYXRlKENvdW50ZXIsIHtzdGF0ZTogJ2NvdW50ZXInfSkoc291cmNlcyk7XG5cbiAgcmV0dXJuIHNpbmtzO1xufVxuXG5jb25zdCB3cmFwcGVkTWFpbiA9IHdpdGhTdGF0ZShtYWluKTtcblxucnVuKHdyYXBwZWRNYWluLCB7XG4gIERPTTogbWFrZURPTURyaXZlcignI2FwcCcpXG59KTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgZnJvbUV2ZW50XzEgPSByZXF1aXJlKFwiLi9mcm9tRXZlbnRcIik7XG52YXIgQm9keURPTVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBCb2R5RE9NU291cmNlKF9uYW1lKSB7XG4gICAgICAgIHRoaXMuX25hbWUgPSBfbmFtZTtcbiAgICB9XG4gICAgQm9keURPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb25hbGl0eSBpcyBzdGlsbCB1bmRlZmluZWQvdW5kZWNpZGVkLlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5vZihbZG9jdW1lbnQuYm9keV0pKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGRvY3VtZW50LmJvZHkpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIEJvZHlET01Tb3VyY2UucHJvdG90eXBlLmV2ZW50cyA9IGZ1bmN0aW9uIChldmVudFR5cGUsIG9wdGlvbnMsIGJ1YmJsZXMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdmFyIHN0cmVhbTtcbiAgICAgICAgc3RyZWFtID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KGRvY3VtZW50LmJvZHksIGV2ZW50VHlwZSwgb3B0aW9ucy51c2VDYXB0dXJlLCBvcHRpb25zLnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoc3RyZWFtKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIHJldHVybiBCb2R5RE9NU291cmNlO1xufSgpKTtcbmV4cG9ydHMuQm9keURPTVNvdXJjZSA9IEJvZHlET01Tb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Cb2R5RE9NU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgZnJvbUV2ZW50XzEgPSByZXF1aXJlKFwiLi9mcm9tRXZlbnRcIik7XG52YXIgRG9jdW1lbnRET01Tb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRG9jdW1lbnRET01Tb3VyY2UoX25hbWUpIHtcbiAgICAgICAgdGhpcy5fbmFtZSA9IF9uYW1lO1xuICAgIH1cbiAgICBEb2N1bWVudERPTVNvdXJjZS5wcm90b3R5cGUuc2VsZWN0ID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIC8vIFRoaXMgZnVuY3Rpb25hbGl0eSBpcyBzdGlsbCB1bmRlZmluZWQvdW5kZWNpZGVkLlxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuICAgIERvY3VtZW50RE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQub2YoW2RvY3VtZW50XSkpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSB0aGlzLl9uYW1lO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgRG9jdW1lbnRET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHhzdHJlYW1fMS5kZWZhdWx0Lm9mKGRvY3VtZW50KSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9IHRoaXMuX25hbWU7XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfTtcbiAgICBEb2N1bWVudERPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucywgYnViYmxlcykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICB2YXIgc3RyZWFtO1xuICAgICAgICBzdHJlYW0gPSBmcm9tRXZlbnRfMS5mcm9tRXZlbnQoZG9jdW1lbnQsIGV2ZW50VHlwZSwgb3B0aW9ucy51c2VDYXB0dXJlLCBvcHRpb25zLnByZXZlbnREZWZhdWx0KTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoc3RyZWFtKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIHJldHVybiBEb2N1bWVudERPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLkRvY3VtZW50RE9NU291cmNlID0gRG9jdW1lbnRET01Tb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Eb2N1bWVudERPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTY29wZUNoZWNrZXJfMSA9IHJlcXVpcmUoXCIuL1Njb3BlQ2hlY2tlclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5mdW5jdGlvbiB0b0VsQXJyYXkoaW5wdXQpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoaW5wdXQpO1xufVxudmFyIEVsZW1lbnRGaW5kZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gRWxlbWVudEZpbmRlcihuYW1lc3BhY2UsIGlzb2xhdGVNb2R1bGUpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2UgPSBuYW1lc3BhY2U7XG4gICAgICAgIHRoaXMuaXNvbGF0ZU1vZHVsZSA9IGlzb2xhdGVNb2R1bGU7XG4gICAgfVxuICAgIEVsZW1lbnRGaW5kZXIucHJvdG90eXBlLmNhbGwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSB0aGlzLm5hbWVzcGFjZTtcbiAgICAgICAgdmFyIHNlbGVjdG9yID0gdXRpbHNfMS5nZXRTZWxlY3RvcnMobmFtZXNwYWNlKTtcbiAgICAgICAgdmFyIHNjb3BlQ2hlY2tlciA9IG5ldyBTY29wZUNoZWNrZXJfMS5TY29wZUNoZWNrZXIobmFtZXNwYWNlLCB0aGlzLmlzb2xhdGVNb2R1bGUpO1xuICAgICAgICB2YXIgdG9wTm9kZSA9IHRoaXMuaXNvbGF0ZU1vZHVsZS5nZXRFbGVtZW50KG5hbWVzcGFjZS5maWx0ZXIoZnVuY3Rpb24gKG4pIHsgcmV0dXJuIG4udHlwZSAhPT0gJ3NlbGVjdG9yJzsgfSkpO1xuICAgICAgICBpZiAodG9wTm9kZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gW107XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNlbGVjdG9yID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIFt0b3BOb2RlXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdG9FbEFycmF5KHRvcE5vZGUucXVlcnlTZWxlY3RvckFsbChzZWxlY3RvcikpXG4gICAgICAgICAgICAuZmlsdGVyKHNjb3BlQ2hlY2tlci5pc0RpcmVjdGx5SW5TY29wZSwgc2NvcGVDaGVja2VyKVxuICAgICAgICAgICAgLmNvbmNhdCh0b3BOb2RlLm1hdGNoZXMoc2VsZWN0b3IpID8gW3RvcE5vZGVdIDogW10pO1xuICAgIH07XG4gICAgcmV0dXJuIEVsZW1lbnRGaW5kZXI7XG59KCkpO1xuZXhwb3J0cy5FbGVtZW50RmluZGVyID0gRWxlbWVudEZpbmRlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPUVsZW1lbnRGaW5kZXIuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIFNjb3BlQ2hlY2tlcl8xID0gcmVxdWlyZShcIi4vU2NvcGVDaGVja2VyXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBFbGVtZW50RmluZGVyXzEgPSByZXF1aXJlKFwiLi9FbGVtZW50RmluZGVyXCIpO1xudmFyIFN5bWJvbFRyZWVfMSA9IHJlcXVpcmUoXCIuL1N5bWJvbFRyZWVcIik7XG52YXIgUmVtb3ZhbFNldF8xID0gcmVxdWlyZShcIi4vUmVtb3ZhbFNldFwiKTtcbnZhciBQcmlvcml0eVF1ZXVlXzEgPSByZXF1aXJlKFwiLi9Qcmlvcml0eVF1ZXVlXCIpO1xudmFyIGZyb21FdmVudF8xID0gcmVxdWlyZShcIi4vZnJvbUV2ZW50XCIpO1xuZXhwb3J0cy5ldmVudFR5cGVzVGhhdERvbnRCdWJibGUgPSBbXG4gICAgXCJibHVyXCIsXG4gICAgXCJjYW5wbGF5XCIsXG4gICAgXCJjYW5wbGF5dGhyb3VnaFwiLFxuICAgIFwiZHVyYXRpb25jaGFuZ2VcIixcbiAgICBcImVtcHRpZWRcIixcbiAgICBcImVuZGVkXCIsXG4gICAgXCJmb2N1c1wiLFxuICAgIFwibG9hZFwiLFxuICAgIFwibG9hZGVkZGF0YVwiLFxuICAgIFwibG9hZGVkbWV0YWRhdGFcIixcbiAgICBcIm1vdXNlZW50ZXJcIixcbiAgICBcIm1vdXNlbGVhdmVcIixcbiAgICBcInBhdXNlXCIsXG4gICAgXCJwbGF5XCIsXG4gICAgXCJwbGF5aW5nXCIsXG4gICAgXCJyYXRlY2hhbmdlXCIsXG4gICAgXCJyZXNldFwiLFxuICAgIFwic2Nyb2xsXCIsXG4gICAgXCJzZWVrZWRcIixcbiAgICBcInNlZWtpbmdcIixcbiAgICBcInN0YWxsZWRcIixcbiAgICBcInN1Ym1pdFwiLFxuICAgIFwic3VzcGVuZFwiLFxuICAgIFwidGltZXVwZGF0ZVwiLFxuICAgIFwidW5sb2FkXCIsXG4gICAgXCJ2b2x1bWVjaGFuZ2VcIixcbiAgICBcIndhaXRpbmdcIixcbl07XG4vKipcbiAqIE1hbmFnZXMgXCJFdmVudCBkZWxlZ2F0aW9uXCIsIGJ5IGNvbm5lY3RpbmcgYW4gb3JpZ2luIHdpdGggbXVsdGlwbGVcbiAqIGRlc3RpbmF0aW9ucy5cbiAqXG4gKiBBdHRhY2hlcyBhIERPTSBldmVudCBsaXN0ZW5lciB0byB0aGUgRE9NIGVsZW1lbnQgY2FsbGVkIHRoZSBcIm9yaWdpblwiLFxuICogYW5kIGRlbGVnYXRlcyBldmVudHMgdG8gXCJkZXN0aW5hdGlvbnNcIiwgd2hpY2ggYXJlIHN1YmplY3RzIGFzIG91dHB1dHNcbiAqIGZvciB0aGUgRE9NU291cmNlLiBTaW11bGF0ZXMgYnViYmxpbmcgb3IgY2FwdHVyaW5nLCB3aXRoIHJlZ2FyZHMgdG9cbiAqIGlzb2xhdGlvbiBib3VuZGFyaWVzIHRvby5cbiAqL1xudmFyIEV2ZW50RGVsZWdhdG9yID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEV2ZW50RGVsZWdhdG9yKHJvb3RFbGVtZW50JCwgaXNvbGF0ZU1vZHVsZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50JCA9IHJvb3RFbGVtZW50JDtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlID0gaXNvbGF0ZU1vZHVsZTtcbiAgICAgICAgdGhpcy52aXJ0dWFsTGlzdGVuZXJzID0gbmV3IFN5bWJvbFRyZWVfMS5kZWZhdWx0KGZ1bmN0aW9uICh4KSB7IHJldHVybiB4LnNjb3BlOyB9KTtcbiAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVyc1RvQWRkID0gbmV3IFJlbW92YWxTZXRfMS5kZWZhdWx0KCk7XG4gICAgICAgIHRoaXMudmlydHVhbE5vbkJ1YmJsaW5nTGlzdGVuZXIgPSBbXTtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlLnNldEV2ZW50RGVsZWdhdG9yKHRoaXMpO1xuICAgICAgICB0aGlzLmRvbUxpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5kb21MaXN0ZW5lcnNUb0FkZCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycyA9IG5ldyBNYXAoKTtcbiAgICAgICAgcm9vdEVsZW1lbnQkLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIGlmIChfdGhpcy5vcmlnaW4gIT09IGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLm9yaWdpbiA9IGVsO1xuICAgICAgICAgICAgICAgICAgICBfdGhpcy5yZXNldEV2ZW50TGlzdGVuZXJzKCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLmRvbUxpc3RlbmVyc1RvQWRkLmZvckVhY2goZnVuY3Rpb24gKHBhc3NpdmUsIHR5cGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5zZXR1cERPTUxpc3RlbmVyKHR5cGUsIHBhc3NpdmUpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuZG9tTGlzdGVuZXJzVG9BZGQuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX3RoaXMucmVzZXROb25CdWJibGluZ0xpc3RlbmVycygpO1xuICAgICAgICAgICAgICAgIF90aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzVG9BZGQuZm9yRWFjaChmdW5jdGlvbiAoYXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNldHVwTm9uQnViYmxpbmdMaXN0ZW5lcihhcnIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbmFtZXNwYWNlLCBvcHRpb25zLCBidWJibGVzKSB7XG4gICAgICAgIHZhciBzdWJqZWN0ID0geHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKTtcbiAgICAgICAgdmFyIHNjb3BlQ2hlY2tlciA9IG5ldyBTY29wZUNoZWNrZXJfMS5TY29wZUNoZWNrZXIobmFtZXNwYWNlLCB0aGlzLmlzb2xhdGVNb2R1bGUpO1xuICAgICAgICB2YXIgZGVzdCA9IHRoaXMuaW5zZXJ0TGlzdGVuZXIoc3ViamVjdCwgc2NvcGVDaGVja2VyLCBldmVudFR5cGUsIG9wdGlvbnMpO1xuICAgICAgICB2YXIgc2hvdWxkQnViYmxlID0gYnViYmxlcyA9PT0gdW5kZWZpbmVkXG4gICAgICAgICAgICA/IGV4cG9ydHMuZXZlbnRUeXBlc1RoYXREb250QnViYmxlLmluZGV4T2YoZXZlbnRUeXBlKSA9PT0gLTFcbiAgICAgICAgICAgIDogYnViYmxlcztcbiAgICAgICAgaWYgKHNob3VsZEJ1YmJsZSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmRvbUxpc3RlbmVycy5oYXMoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0dXBET01MaXN0ZW5lcihldmVudFR5cGUsICEhb3B0aW9ucy5wYXNzaXZlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBmaW5kZXIgPSBuZXcgRWxlbWVudEZpbmRlcl8xLkVsZW1lbnRGaW5kZXIobmFtZXNwYWNlLCB0aGlzLmlzb2xhdGVNb2R1bGUpO1xuICAgICAgICAgICAgdGhpcy5zZXR1cE5vbkJ1YmJsaW5nTGlzdGVuZXIoW2V2ZW50VHlwZSwgZmluZGVyLCBkZXN0XSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN1YmplY3Q7XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucmVtb3ZlRWxlbWVudCA9IGZ1bmN0aW9uIChlbGVtZW50LCBuYW1lc3BhY2UpIHtcbiAgICAgICAgaWYgKG5hbWVzcGFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnZpcnR1YWxMaXN0ZW5lcnMuZGVsZXRlKG5hbWVzcGFjZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHRvUmVtb3ZlID0gW107XG4gICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbiAobWFwLCB0eXBlKSB7XG4gICAgICAgICAgICBpZiAobWFwLmhhcyhlbGVtZW50KSkge1xuICAgICAgICAgICAgICAgIHRvUmVtb3ZlLnB1c2goW3R5cGUsIGVsZW1lbnRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9SZW1vdmUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBtYXAgPSB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmdldCh0b1JlbW92ZVtpXVswXSk7XG4gICAgICAgICAgICBpZiAoIW1hcCkge1xuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWFwLmRlbGV0ZSh0b1JlbW92ZVtpXVsxXSk7XG4gICAgICAgICAgICBpZiAobWFwLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmRlbGV0ZSh0b1JlbW92ZVtpXVswXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLnNldCh0b1JlbW92ZVtpXVswXSwgbWFwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLmluc2VydExpc3RlbmVyID0gZnVuY3Rpb24gKHN1YmplY3QsIHNjb3BlQ2hlY2tlciwgZXZlbnRUeXBlLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciByZWxldmFudFNldHMgPSBbXTtcbiAgICAgICAgdmFyIG4gPSBzY29wZUNoZWNrZXIuX25hbWVzcGFjZTtcbiAgICAgICAgdmFyIG1heCA9IG4ubGVuZ3RoO1xuICAgICAgICBkbyB7XG4gICAgICAgICAgICByZWxldmFudFNldHMucHVzaCh0aGlzLmdldFZpcnR1YWxMaXN0ZW5lcnMoZXZlbnRUeXBlLCBuLCB0cnVlLCBtYXgpKTtcbiAgICAgICAgICAgIG1heC0tO1xuICAgICAgICB9IHdoaWxlIChtYXggPj0gMCAmJiBuW21heF0udHlwZSAhPT0gJ3RvdGFsJyk7XG4gICAgICAgIHZhciBkZXN0aW5hdGlvbiA9IF9fYXNzaWduKHt9LCBvcHRpb25zLCB7IHNjb3BlQ2hlY2tlcjogc2NvcGVDaGVja2VyLFxuICAgICAgICAgICAgc3ViamVjdDogc3ViamVjdCwgYnViYmxlczogISFvcHRpb25zLmJ1YmJsZXMsIHVzZUNhcHR1cmU6ICEhb3B0aW9ucy51c2VDYXB0dXJlLCBwYXNzaXZlOiAhIW9wdGlvbnMucGFzc2l2ZSB9KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZWxldmFudFNldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHJlbGV2YW50U2V0c1tpXS5hZGQoZGVzdGluYXRpb24sIG4ubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGVzdGluYXRpb247XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGEgc2V0IG9mIGFsbCB2aXJ0dWFsIGxpc3RlbmVycyBpbiB0aGUgc2NvcGUgb2YgdGhlIG5hbWVzcGFjZVxuICAgICAqIFNldCBgZXhhY3RgIHRvIHRydWUgdG8gdHJlYXQgc2liaWxpbmcgaXNvbGF0ZWQgc2NvcGVzIGFzIHRvdGFsIHNjb3Blc1xuICAgICAqL1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5nZXRWaXJ0dWFsTGlzdGVuZXJzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgbmFtZXNwYWNlLCBleGFjdCwgbWF4KSB7XG4gICAgICAgIGlmIChleGFjdCA9PT0gdm9pZCAwKSB7IGV4YWN0ID0gZmFsc2U7IH1cbiAgICAgICAgdmFyIF9tYXggPSBtYXggIT09IHVuZGVmaW5lZCA/IG1heCA6IG5hbWVzcGFjZS5sZW5ndGg7XG4gICAgICAgIGlmICghZXhhY3QpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBfbWF4IC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICBpZiAobmFtZXNwYWNlW2ldLnR5cGUgPT09ICd0b3RhbCcpIHtcbiAgICAgICAgICAgICAgICAgICAgX21heCA9IGkgKyAxO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgX21heCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1hcCA9IHRoaXMudmlydHVhbExpc3RlbmVycy5nZXREZWZhdWx0KG5hbWVzcGFjZSwgZnVuY3Rpb24gKCkgeyByZXR1cm4gbmV3IE1hcCgpOyB9LCBfbWF4KTtcbiAgICAgICAgaWYgKCFtYXAuaGFzKGV2ZW50VHlwZSkpIHtcbiAgICAgICAgICAgIG1hcC5zZXQoZXZlbnRUeXBlLCBuZXcgUHJpb3JpdHlRdWV1ZV8xLmRlZmF1bHQoKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG1hcC5nZXQoZXZlbnRUeXBlKTtcbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5zZXR1cERPTUxpc3RlbmVyID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgcGFzc2l2ZSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICBpZiAodGhpcy5vcmlnaW4pIHtcbiAgICAgICAgICAgIHZhciBzdWIgPSBmcm9tRXZlbnRfMS5mcm9tRXZlbnQodGhpcy5vcmlnaW4sIGV2ZW50VHlwZSwgZmFsc2UsIGZhbHNlLCBwYXNzaXZlKS5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChldmVudCkgeyByZXR1cm4gX3RoaXMub25FdmVudChldmVudFR5cGUsIGV2ZW50LCBwYXNzaXZlKTsgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuZG9tTGlzdGVuZXJzLnNldChldmVudFR5cGUsIHsgc3ViOiBzdWIsIHBhc3NpdmU6IHBhc3NpdmUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmRvbUxpc3RlbmVyc1RvQWRkLnNldChldmVudFR5cGUsIHBhc3NpdmUpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUuc2V0dXBOb25CdWJibGluZ0xpc3RlbmVyID0gZnVuY3Rpb24gKGlucHV0KSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBldmVudFR5cGUgPSBpbnB1dFswXSwgZWxlbWVudEZpbmRlciA9IGlucHV0WzFdLCBkZXN0aW5hdGlvbiA9IGlucHV0WzJdO1xuICAgICAgICBpZiAoIXRoaXMub3JpZ2luKSB7XG4gICAgICAgICAgICB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzVG9BZGQuYWRkKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZWxlbWVudCA9IGVsZW1lbnRGaW5kZXIuY2FsbCgpWzBdO1xuICAgICAgICBpZiAoZWxlbWVudCkge1xuICAgICAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVyc1RvQWRkLmRlbGV0ZShpbnB1dCk7XG4gICAgICAgICAgICB2YXIgc3ViID0gZnJvbUV2ZW50XzEuZnJvbUV2ZW50KGVsZW1lbnQsIGV2ZW50VHlwZSwgZmFsc2UsIGZhbHNlLCBkZXN0aW5hdGlvbi5wYXNzaXZlKS5zdWJzY3JpYmUoe1xuICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChldikgeyByZXR1cm4gX3RoaXMub25FdmVudChldmVudFR5cGUsIGV2LCAhIWRlc3RpbmF0aW9uLnBhc3NpdmUsIGZhbHNlKTsgfSxcbiAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICghdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5oYXMoZXZlbnRUeXBlKSkge1xuICAgICAgICAgICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnMuc2V0KGV2ZW50VHlwZSwgbmV3IE1hcCgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtYXAgPSB0aGlzLm5vbkJ1YmJsaW5nTGlzdGVuZXJzLmdldChldmVudFR5cGUpO1xuICAgICAgICAgICAgaWYgKCFtYXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtYXAuc2V0KGVsZW1lbnQsIHsgc3ViOiBzdWIsIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbiB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubm9uQnViYmxpbmdMaXN0ZW5lcnNUb0FkZC5hZGQoaW5wdXQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucmVzZXRFdmVudExpc3RlbmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGl0ZXIgPSB0aGlzLmRvbUxpc3RlbmVycy5lbnRyaWVzKCk7XG4gICAgICAgIHZhciBjdXJyID0gaXRlci5uZXh0KCk7XG4gICAgICAgIHdoaWxlICghY3Vyci5kb25lKSB7XG4gICAgICAgICAgICB2YXIgX2EgPSBjdXJyLnZhbHVlLCB0eXBlID0gX2FbMF0sIF9iID0gX2FbMV0sIHN1YiA9IF9iLnN1YiwgcGFzc2l2ZSA9IF9iLnBhc3NpdmU7XG4gICAgICAgICAgICBzdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgIHRoaXMuc2V0dXBET01MaXN0ZW5lcih0eXBlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgIGN1cnIgPSBpdGVyLm5leHQoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLnJlc2V0Tm9uQnViYmxpbmdMaXN0ZW5lcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBuZXdNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgIHZhciBpbnNlcnQgPSB1dGlsc18xLm1ha2VJbnNlcnQobmV3TWFwKTtcbiAgICAgICAgdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uIChtYXAsIHR5cGUpIHtcbiAgICAgICAgICAgIG1hcC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSwgZWxtKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFkb2N1bWVudC5ib2R5LmNvbnRhaW5zKGVsbSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN1YiA9IHZhbHVlLnN1YiwgZGVzdGluYXRpb25fMSA9IHZhbHVlLmRlc3RpbmF0aW9uO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3ViKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdWIudW5zdWJzY3JpYmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB2YXIgZWxlbWVudEZpbmRlciA9IG5ldyBFbGVtZW50RmluZGVyXzEuRWxlbWVudEZpbmRlcihkZXN0aW5hdGlvbl8xLnNjb3BlQ2hlY2tlci5uYW1lc3BhY2UsIF90aGlzLmlzb2xhdGVNb2R1bGUpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RWxtID0gZWxlbWVudEZpbmRlci5jYWxsKClbMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdTdWIgPSBmcm9tRXZlbnRfMS5mcm9tRXZlbnQobmV3RWxtLCB0eXBlLCBmYWxzZSwgZmFsc2UsIGRlc3RpbmF0aW9uXzEucGFzc2l2ZSkuc3Vic2NyaWJlKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBfdGhpcy5vbkV2ZW50KHR5cGUsIGV2ZW50LCAhIWRlc3RpbmF0aW9uXzEucGFzc2l2ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0KHR5cGUsIG5ld0VsbSwgeyBzdWI6IG5ld1N1YiwgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uXzEgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnQodHlwZSwgZWxtLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBfdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycyA9IG5ld01hcDtcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucHV0Tm9uQnViYmxpbmdMaXN0ZW5lciA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGVsbSwgdXNlQ2FwdHVyZSwgcGFzc2l2ZSkge1xuICAgICAgICB2YXIgbWFwID0gdGhpcy5ub25CdWJibGluZ0xpc3RlbmVycy5nZXQoZXZlbnRUeXBlKTtcbiAgICAgICAgaWYgKCFtYXApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbGlzdGVuZXIgPSBtYXAuZ2V0KGVsbSk7XG4gICAgICAgIGlmIChsaXN0ZW5lciAmJlxuICAgICAgICAgICAgbGlzdGVuZXIuZGVzdGluYXRpb24ucGFzc2l2ZSA9PT0gcGFzc2l2ZSAmJlxuICAgICAgICAgICAgbGlzdGVuZXIuZGVzdGluYXRpb24udXNlQ2FwdHVyZSA9PT0gdXNlQ2FwdHVyZSkge1xuICAgICAgICAgICAgdGhpcy52aXJ0dWFsTm9uQnViYmxpbmdMaXN0ZW5lclswXSA9IGxpc3RlbmVyLmRlc3RpbmF0aW9uO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUub25FdmVudCA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGV2ZW50LCBwYXNzaXZlLCBidWJibGVzKSB7XG4gICAgICAgIGlmIChidWJibGVzID09PSB2b2lkIDApIHsgYnViYmxlcyA9IHRydWU7IH1cbiAgICAgICAgdmFyIGN5Y2xlRXZlbnQgPSB0aGlzLnBhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgICB2YXIgcm9vdEVsZW1lbnQgPSB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0Um9vdEVsZW1lbnQoZXZlbnQudGFyZ2V0KTtcbiAgICAgICAgaWYgKGJ1YmJsZXMpIHtcbiAgICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0TmFtZXNwYWNlKGV2ZW50LnRhcmdldCk7XG4gICAgICAgICAgICBpZiAoIW5hbWVzcGFjZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBsaXN0ZW5lcnMgPSB0aGlzLmdldFZpcnR1YWxMaXN0ZW5lcnMoZXZlbnRUeXBlLCBuYW1lc3BhY2UpO1xuICAgICAgICAgICAgdGhpcy5idWJibGUoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIHJvb3RFbGVtZW50LCBjeWNsZUV2ZW50LCBsaXN0ZW5lcnMsIG5hbWVzcGFjZSwgbmFtZXNwYWNlLmxlbmd0aCAtIDEsIHRydWUsIHBhc3NpdmUpO1xuICAgICAgICAgICAgdGhpcy5idWJibGUoZXZlbnRUeXBlLCBldmVudC50YXJnZXQsIHJvb3RFbGVtZW50LCBjeWNsZUV2ZW50LCBsaXN0ZW5lcnMsIG5hbWVzcGFjZSwgbmFtZXNwYWNlLmxlbmd0aCAtIDEsIGZhbHNlLCBwYXNzaXZlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucHV0Tm9uQnViYmxpbmdMaXN0ZW5lcihldmVudFR5cGUsIGV2ZW50LnRhcmdldCwgdHJ1ZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICB0aGlzLmRvQnViYmxlU3RlcChldmVudFR5cGUsIGV2ZW50LnRhcmdldCwgcm9vdEVsZW1lbnQsIGN5Y2xlRXZlbnQsIHRoaXMudmlydHVhbE5vbkJ1YmJsaW5nTGlzdGVuZXIsIHRydWUsIHBhc3NpdmUpO1xuICAgICAgICAgICAgdGhpcy5wdXROb25CdWJibGluZ0xpc3RlbmVyKGV2ZW50VHlwZSwgZXZlbnQudGFyZ2V0LCBmYWxzZSwgcGFzc2l2ZSk7XG4gICAgICAgICAgICB0aGlzLmRvQnViYmxlU3RlcChldmVudFR5cGUsIGV2ZW50LnRhcmdldCwgcm9vdEVsZW1lbnQsIGN5Y2xlRXZlbnQsIHRoaXMudmlydHVhbE5vbkJ1YmJsaW5nTGlzdGVuZXIsIGZhbHNlLCBwYXNzaXZlKTtcbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyAvL2ZpeCByZXNldCBldmVudCAoc3BlYydlZCBhcyBub24tYnViYmxpbmcsIGJ1dCBidWJibGVzIGluIHJlYWxpdHlcbiAgICAgICAgfVxuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLmJ1YmJsZSA9IGZ1bmN0aW9uIChldmVudFR5cGUsIGVsbSwgcm9vdEVsZW1lbnQsIGV2ZW50LCBsaXN0ZW5lcnMsIG5hbWVzcGFjZSwgaW5kZXgsIHVzZUNhcHR1cmUsIHBhc3NpdmUpIHtcbiAgICAgICAgaWYgKCF1c2VDYXB0dXJlICYmICFldmVudC5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkKSB7XG4gICAgICAgICAgICB0aGlzLmRvQnViYmxlU3RlcChldmVudFR5cGUsIGVsbSwgcm9vdEVsZW1lbnQsIGV2ZW50LCBsaXN0ZW5lcnMsIHVzZUNhcHR1cmUsIHBhc3NpdmUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuZXdSb290ID0gcm9vdEVsZW1lbnQ7XG4gICAgICAgIHZhciBuZXdJbmRleCA9IGluZGV4O1xuICAgICAgICBpZiAoZWxtID09PSByb290RWxlbWVudCkge1xuICAgICAgICAgICAgaWYgKGluZGV4ID49IDAgJiYgbmFtZXNwYWNlW2luZGV4XS50eXBlID09PSAnc2libGluZycpIHtcbiAgICAgICAgICAgICAgICBuZXdSb290ID0gdGhpcy5pc29sYXRlTW9kdWxlLmdldEVsZW1lbnQobmFtZXNwYWNlLCBpbmRleCk7XG4gICAgICAgICAgICAgICAgbmV3SW5kZXgtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoZWxtLnBhcmVudE5vZGUgJiYgbmV3Um9vdCkge1xuICAgICAgICAgICAgdGhpcy5idWJibGUoZXZlbnRUeXBlLCBlbG0ucGFyZW50Tm9kZSwgbmV3Um9vdCwgZXZlbnQsIGxpc3RlbmVycywgbmFtZXNwYWNlLCBuZXdJbmRleCwgdXNlQ2FwdHVyZSwgcGFzc2l2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZUNhcHR1cmUgJiYgIWV2ZW50LnByb3BhZ2F0aW9uSGFzQmVlblN0b3BwZWQpIHtcbiAgICAgICAgICAgIHRoaXMuZG9CdWJibGVTdGVwKGV2ZW50VHlwZSwgZWxtLCByb290RWxlbWVudCwgZXZlbnQsIGxpc3RlbmVycywgdXNlQ2FwdHVyZSwgcGFzc2l2ZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEV2ZW50RGVsZWdhdG9yLnByb3RvdHlwZS5kb0J1YmJsZVN0ZXAgPSBmdW5jdGlvbiAoZXZlbnRUeXBlLCBlbG0sIHJvb3RFbGVtZW50LCBldmVudCwgbGlzdGVuZXJzLCB1c2VDYXB0dXJlLCBwYXNzaXZlKSB7XG4gICAgICAgIGlmICghcm9vdEVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm11dGF0ZUV2ZW50Q3VycmVudFRhcmdldChldmVudCwgZWxtKTtcbiAgICAgICAgbGlzdGVuZXJzLmZvckVhY2goZnVuY3Rpb24gKGRlc3QpIHtcbiAgICAgICAgICAgIGlmIChkZXN0LnBhc3NpdmUgPT09IHBhc3NpdmUgJiYgZGVzdC51c2VDYXB0dXJlID09PSB1c2VDYXB0dXJlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlbCA9IHV0aWxzXzEuZ2V0U2VsZWN0b3JzKGRlc3Quc2NvcGVDaGVja2VyLm5hbWVzcGFjZSk7XG4gICAgICAgICAgICAgICAgaWYgKCFldmVudC5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkICYmXG4gICAgICAgICAgICAgICAgICAgIGRlc3Quc2NvcGVDaGVja2VyLmlzRGlyZWN0bHlJblNjb3BlKGVsbSkgJiZcbiAgICAgICAgICAgICAgICAgICAgKChzZWwgIT09ICcnICYmIGVsbS5tYXRjaGVzKHNlbCkpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoc2VsID09PSAnJyAmJiBlbG0gPT09IHJvb3RFbGVtZW50KSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbUV2ZW50XzEucHJldmVudERlZmF1bHRDb25kaXRpb25hbChldmVudCwgZGVzdC5wcmV2ZW50RGVmYXVsdCk7XG4gICAgICAgICAgICAgICAgICAgIGRlc3Quc3ViamVjdC5zaGFtZWZ1bGx5U2VuZE5leHQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBFdmVudERlbGVnYXRvci5wcm90b3R5cGUucGF0Y2hFdmVudCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICB2YXIgcEV2ZW50ID0gZXZlbnQ7XG4gICAgICAgIHBFdmVudC5wcm9wYWdhdGlvbkhhc0JlZW5TdG9wcGVkID0gZmFsc2U7XG4gICAgICAgIHZhciBvbGRTdG9wUHJvcGFnYXRpb24gPSBwRXZlbnQuc3RvcFByb3BhZ2F0aW9uO1xuICAgICAgICBwRXZlbnQuc3RvcFByb3BhZ2F0aW9uID0gZnVuY3Rpb24gc3RvcFByb3BhZ2F0aW9uKCkge1xuICAgICAgICAgICAgb2xkU3RvcFByb3BhZ2F0aW9uLmNhbGwodGhpcyk7XG4gICAgICAgICAgICB0aGlzLnByb3BhZ2F0aW9uSGFzQmVlblN0b3BwZWQgPSB0cnVlO1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gcEV2ZW50O1xuICAgIH07XG4gICAgRXZlbnREZWxlZ2F0b3IucHJvdG90eXBlLm11dGF0ZUV2ZW50Q3VycmVudFRhcmdldCA9IGZ1bmN0aW9uIChldmVudCwgY3VycmVudFRhcmdldEVsZW1lbnQpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShldmVudCwgXCJjdXJyZW50VGFyZ2V0XCIsIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogY3VycmVudFRhcmdldEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJwbGVhc2UgdXNlIGV2ZW50Lm93bmVyVGFyZ2V0XCIpO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50Lm93bmVyVGFyZ2V0ID0gY3VycmVudFRhcmdldEVsZW1lbnQ7XG4gICAgfTtcbiAgICByZXR1cm4gRXZlbnREZWxlZ2F0b3I7XG59KCkpO1xuZXhwb3J0cy5FdmVudERlbGVnYXRvciA9IEV2ZW50RGVsZWdhdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9RXZlbnREZWxlZ2F0b3IuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgdXRpbHNfMSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xudmFyIFN5bWJvbFRyZWVfMSA9IHJlcXVpcmUoXCIuL1N5bWJvbFRyZWVcIik7XG52YXIgSXNvbGF0ZU1vZHVsZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBJc29sYXRlTW9kdWxlKCkge1xuICAgICAgICB0aGlzLm5hbWVzcGFjZVRyZWUgPSBuZXcgU3ltYm9sVHJlZV8xLmRlZmF1bHQoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHguc2NvcGU7IH0pO1xuICAgICAgICB0aGlzLm5hbWVzcGFjZUJ5RWxlbWVudCA9IG5ldyBNYXAoKTtcbiAgICAgICAgdGhpcy52bm9kZXNCZWluZ1JlbW92ZWQgPSBbXTtcbiAgICB9XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuc2V0RXZlbnREZWxlZ2F0b3IgPSBmdW5jdGlvbiAoZGVsKSB7XG4gICAgICAgIHRoaXMuZXZlbnREZWxlZ2F0b3IgPSBkZWw7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5pbnNlcnRFbGVtZW50ID0gZnVuY3Rpb24gKG5hbWVzcGFjZSwgZWwpIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQuc2V0KGVsLCBuYW1lc3BhY2UpO1xuICAgICAgICB0aGlzLm5hbWVzcGFjZVRyZWUuc2V0KG5hbWVzcGFjZSwgZWwpO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUucmVtb3ZlRWxlbWVudCA9IGZ1bmN0aW9uIChlbG0pIHtcbiAgICAgICAgdGhpcy5uYW1lc3BhY2VCeUVsZW1lbnQuZGVsZXRlKGVsbSk7XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSB0aGlzLmdldE5hbWVzcGFjZShlbG0pO1xuICAgICAgICBpZiAobmFtZXNwYWNlKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWVzcGFjZVRyZWUuZGVsZXRlKG5hbWVzcGFjZSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmdldEVsZW1lbnQgPSBmdW5jdGlvbiAobmFtZXNwYWNlLCBtYXgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubmFtZXNwYWNlVHJlZS5nZXQobmFtZXNwYWNlLCB1bmRlZmluZWQsIG1heCk7XG4gICAgfTtcbiAgICBJc29sYXRlTW9kdWxlLnByb3RvdHlwZS5nZXRSb290RWxlbWVudCA9IGZ1bmN0aW9uIChlbG0pIHtcbiAgICAgICAgaWYgKHRoaXMubmFtZXNwYWNlQnlFbGVtZW50LmhhcyhlbG0pKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxtO1xuICAgICAgICB9XG4gICAgICAgIC8vVE9ETzogQWRkIHF1aWNrLWxydSBvciBzaW1pbGFyIGFzIGFkZGl0aW9uYWwgTygxKSBjYWNoZVxuICAgICAgICB2YXIgY3VyciA9IGVsbTtcbiAgICAgICAgd2hpbGUgKCF0aGlzLm5hbWVzcGFjZUJ5RWxlbWVudC5oYXMoY3VycikpIHtcbiAgICAgICAgICAgIGN1cnIgPSBjdXJyLnBhcmVudE5vZGU7XG4gICAgICAgICAgICBpZiAoIWN1cnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY3Vyci50YWdOYW1lID09PSAnSFRNTCcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJvb3QgZWxlbWVudCBmb3VuZCwgdGhpcyBzaG91bGQgbm90IGhhcHBlbiBhdCBhbGwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3VycjtcbiAgICB9O1xuICAgIElzb2xhdGVNb2R1bGUucHJvdG90eXBlLmdldE5hbWVzcGFjZSA9IGZ1bmN0aW9uIChlbG0pIHtcbiAgICAgICAgdmFyIHJvb3RFbGVtZW50ID0gdGhpcy5nZXRSb290RWxlbWVudChlbG0pO1xuICAgICAgICBpZiAoIXJvb3RFbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLm5hbWVzcGFjZUJ5RWxlbWVudC5nZXQocm9vdEVsZW1lbnQpO1xuICAgIH07XG4gICAgSXNvbGF0ZU1vZHVsZS5wcm90b3R5cGUuY3JlYXRlTW9kdWxlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjcmVhdGU6IGZ1bmN0aW9uIChlbXB0eVZOb2RlLCB2Tm9kZSkge1xuICAgICAgICAgICAgICAgIHZhciBlbG0gPSB2Tm9kZS5lbG0sIF9hID0gdk5vZGUuZGF0YSwgZGF0YSA9IF9hID09PSB2b2lkIDAgPyB7fSA6IF9hO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSBkYXRhLmlzb2xhdGU7XG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkobmFtZXNwYWNlKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmluc2VydEVsZW1lbnQobmFtZXNwYWNlLCBlbG0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uIChvbGRWTm9kZSwgdk5vZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkRWxtID0gb2xkVk5vZGUuZWxtLCBfYSA9IG9sZFZOb2RlLmRhdGEsIG9sZERhdGEgPSBfYSA9PT0gdm9pZCAwID8ge30gOiBfYTtcbiAgICAgICAgICAgICAgICB2YXIgZWxtID0gdk5vZGUuZWxtLCBfYiA9IHZOb2RlLmRhdGEsIGRhdGEgPSBfYiA9PT0gdm9pZCAwID8ge30gOiBfYjtcbiAgICAgICAgICAgICAgICB2YXIgb2xkTmFtZXNwYWNlID0gb2xkRGF0YS5pc29sYXRlO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lc3BhY2UgPSBkYXRhLmlzb2xhdGU7XG4gICAgICAgICAgICAgICAgaWYgKCF1dGlsc18xLmlzRXF1YWxOYW1lc3BhY2Uob2xkTmFtZXNwYWNlLCBuYW1lc3BhY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9sZE5hbWVzcGFjZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlRWxlbWVudChvbGRFbG0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5hbWVzcGFjZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pbnNlcnRFbGVtZW50KG5hbWVzcGFjZSwgZWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGVzdHJveTogZnVuY3Rpb24gKHZOb2RlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQucHVzaCh2Tm9kZSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAodk5vZGUsIGNiKSB7XG4gICAgICAgICAgICAgICAgc2VsZi52bm9kZXNCZWluZ1JlbW92ZWQucHVzaCh2Tm9kZSk7XG4gICAgICAgICAgICAgICAgY2IoKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3N0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZub2Rlc0JlaW5nUmVtb3ZlZCA9IHNlbGYudm5vZGVzQmVpbmdSZW1vdmVkO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSB2bm9kZXNCZWluZ1JlbW92ZWQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZub2RlID0gdm5vZGVzQmVpbmdSZW1vdmVkW2ldO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmFtZXNwYWNlID0gdm5vZGUuZGF0YSAhPT0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHZub2RlLmRhdGEuaXNvbGF0aW9uXG4gICAgICAgICAgICAgICAgICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5hbWVzcGFjZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUVsZW1lbnQobmFtZXNwYWNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBzZWxmLmV2ZW50RGVsZWdhdG9yLnJlbW92ZUVsZW1lbnQodm5vZGUuZWxtLCBuYW1lc3BhY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLnZub2Rlc0JlaW5nUmVtb3ZlZCA9IFtdO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIHJldHVybiBJc29sYXRlTW9kdWxlO1xufSgpKTtcbmV4cG9ydHMuSXNvbGF0ZU1vZHVsZSA9IElzb2xhdGVNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1Jc29sYXRlTW9kdWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG52YXIgRG9jdW1lbnRET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL0RvY3VtZW50RE9NU291cmNlXCIpO1xudmFyIEJvZHlET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL0JvZHlET01Tb3VyY2VcIik7XG52YXIgRWxlbWVudEZpbmRlcl8xID0gcmVxdWlyZShcIi4vRWxlbWVudEZpbmRlclwiKTtcbnZhciBpc29sYXRlXzEgPSByZXF1aXJlKFwiLi9pc29sYXRlXCIpO1xudmFyIE1haW5ET01Tb3VyY2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gTWFpbkRPTVNvdXJjZShfcm9vdEVsZW1lbnQkLCBfc2FuaXRhdGlvbiQsIF9uYW1lc3BhY2UsIF9pc29sYXRlTW9kdWxlLCBfZXZlbnREZWxlZ2F0b3IsIF9uYW1lKSB7XG4gICAgICAgIGlmIChfbmFtZXNwYWNlID09PSB2b2lkIDApIHsgX25hbWVzcGFjZSA9IFtdOyB9XG4gICAgICAgIHRoaXMuX3Jvb3RFbGVtZW50JCA9IF9yb290RWxlbWVudCQ7XG4gICAgICAgIHRoaXMuX3Nhbml0YXRpb24kID0gX3Nhbml0YXRpb24kO1xuICAgICAgICB0aGlzLl9uYW1lc3BhY2UgPSBfbmFtZXNwYWNlO1xuICAgICAgICB0aGlzLl9pc29sYXRlTW9kdWxlID0gX2lzb2xhdGVNb2R1bGU7XG4gICAgICAgIHRoaXMuX2V2ZW50RGVsZWdhdG9yID0gX2V2ZW50RGVsZWdhdG9yO1xuICAgICAgICB0aGlzLl9uYW1lID0gX25hbWU7XG4gICAgICAgIHRoaXMuaXNvbGF0ZVNvdXJjZSA9IGZ1bmN0aW9uIChzb3VyY2UsIHNjb3BlKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IE1haW5ET01Tb3VyY2Uoc291cmNlLl9yb290RWxlbWVudCQsIHNvdXJjZS5fc2FuaXRhdGlvbiQsIHNvdXJjZS5fbmFtZXNwYWNlLmNvbmNhdChpc29sYXRlXzEuZ2V0U2NvcGVPYmooc2NvcGUpKSwgc291cmNlLl9pc29sYXRlTW9kdWxlLCBzb3VyY2UuX2V2ZW50RGVsZWdhdG9yLCBzb3VyY2UuX25hbWUpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmlzb2xhdGVTaW5rID0gaXNvbGF0ZV8xLm1ha2VJc29sYXRlU2luayh0aGlzLl9uYW1lc3BhY2UpO1xuICAgIH1cbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5fZWxlbWVudHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLl9uYW1lc3BhY2UubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcm9vdEVsZW1lbnQkLm1hcChmdW5jdGlvbiAoeCkgeyByZXR1cm4gW3hdOyB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50RmluZGVyXzEgPSBuZXcgRWxlbWVudEZpbmRlcl8xLkVsZW1lbnRGaW5kZXIodGhpcy5fbmFtZXNwYWNlLCB0aGlzLl9pc29sYXRlTW9kdWxlKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yb290RWxlbWVudCQubWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGVsZW1lbnRGaW5kZXJfMS5jYWxsKCk7IH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBNYWluRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQodGhpcy5fZWxlbWVudHMoKS5yZW1lbWJlcigpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmVsZW1lbnQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KHRoaXMuX2VsZW1lbnRzKClcbiAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24gKGFycikgeyByZXR1cm4gYXJyLmxlbmd0aCA+IDA7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChhcnIpIHsgcmV0dXJuIGFyclswXTsgfSlcbiAgICAgICAgICAgIC5yZW1lbWJlcigpKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShNYWluRE9NU291cmNlLnByb3RvdHlwZSwgXCJuYW1lc3BhY2VcIiwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9uYW1lc3BhY2U7XG4gICAgICAgIH0sXG4gICAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLnNlbGVjdCA9IGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICBpZiAodHlwZW9mIHNlbGVjdG9yICE9PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRE9NIGRyaXZlcidzIHNlbGVjdCgpIGV4cGVjdHMgdGhlIGFyZ3VtZW50IHRvIGJlIGEgXCIgK1xuICAgICAgICAgICAgICAgIFwic3RyaW5nIGFzIGEgQ1NTIHNlbGVjdG9yXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3RvciA9PT0gJ2RvY3VtZW50Jykge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEb2N1bWVudERPTVNvdXJjZV8xLkRvY3VtZW50RE9NU291cmNlKHRoaXMuX25hbWUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzZWxlY3RvciA9PT0gJ2JvZHknKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEJvZHlET01Tb3VyY2VfMS5Cb2R5RE9NU291cmNlKHRoaXMuX25hbWUpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSBzZWxlY3RvciA9PT0gJzpyb290J1xuICAgICAgICAgICAgPyBbXVxuICAgICAgICAgICAgOiB0aGlzLl9uYW1lc3BhY2UuY29uY2F0KHsgdHlwZTogJ3NlbGVjdG9yJywgc2NvcGU6IHNlbGVjdG9yLnRyaW0oKSB9KTtcbiAgICAgICAgcmV0dXJuIG5ldyBNYWluRE9NU291cmNlKHRoaXMuX3Jvb3RFbGVtZW50JCwgdGhpcy5fc2FuaXRhdGlvbiQsIG5hbWVzcGFjZSwgdGhpcy5faXNvbGF0ZU1vZHVsZSwgdGhpcy5fZXZlbnREZWxlZ2F0b3IsIHRoaXMuX25hbWUpO1xuICAgIH07XG4gICAgTWFpbkRPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucywgYnViYmxlcykge1xuICAgICAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50VHlwZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRE9NIGRyaXZlcidzIGV2ZW50cygpIGV4cGVjdHMgYXJndW1lbnQgdG8gYmUgYSBcIiArXG4gICAgICAgICAgICAgICAgXCJzdHJpbmcgcmVwcmVzZW50aW5nIHRoZSBldmVudCB0eXBlIHRvIGxpc3RlbiBmb3IuXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBldmVudCQgPSB0aGlzLl9ldmVudERlbGVnYXRvci5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgdGhpcy5fbmFtZXNwYWNlLCBvcHRpb25zLCBidWJibGVzKTtcbiAgICAgICAgdmFyIG91dCA9IGFkYXB0XzEuYWRhcHQoZXZlbnQkKTtcbiAgICAgICAgb3V0Ll9pc0N5Y2xlU291cmNlID0gdGhpcy5fbmFtZTtcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1haW5ET01Tb3VyY2UucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX3Nhbml0YXRpb24kLnNoYW1lZnVsbHlTZW5kTmV4dChudWxsKTtcbiAgICAgICAgLy90aGlzLl9pc29sYXRlTW9kdWxlLnJlc2V0KCk7XG4gICAgfTtcbiAgICByZXR1cm4gTWFpbkRPTVNvdXJjZTtcbn0oKSk7XG5leHBvcnRzLk1haW5ET01Tb3VyY2UgPSBNYWluRE9NU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9TWFpbkRPTVNvdXJjZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBQcmlvcml0eVF1ZXVlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFByaW9yaXR5UXVldWUoKSB7XG4gICAgICAgIHRoaXMuYXJyID0gW107XG4gICAgICAgIHRoaXMucHJpb3MgPSBbXTtcbiAgICB9XG4gICAgUHJpb3JpdHlRdWV1ZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHQsIHByaW8pIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMucHJpb3NbaV0gPCBwcmlvKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hcnIuc3BsaWNlKGksIDAsIHQpO1xuICAgICAgICAgICAgICAgIHRoaXMucHJpb3Muc3BsaWNlKGksIDAsIHByaW8pO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFyci5wdXNoKHQpO1xuICAgICAgICB0aGlzLnByaW9zLnB1c2gocHJpbyk7XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmFyci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZih0aGlzLmFycltpXSwgaSwgdGhpcy5hcnIpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBQcmlvcml0eVF1ZXVlLnByb3RvdHlwZS5kZWxldGUgPSBmdW5jdGlvbiAodCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYXJyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5hcnJbaV0gPT09IHQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFyci5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmlvcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gUHJpb3JpdHlRdWV1ZTtcbn0oKSk7XG5leHBvcnRzLmRlZmF1bHQgPSBQcmlvcml0eVF1ZXVlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9UHJpb3JpdHlRdWV1ZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBSZW1vdmFsU2V0ID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFJlbW92YWxTZXQoKSB7XG4gICAgICAgIHRoaXMudG9EZWxldGUgPSBbXTtcbiAgICAgICAgdGhpcy50b0RlbGV0ZVNpemUgPSAwO1xuICAgICAgICB0aGlzLl9zZXQgPSBuZXcgU2V0KCk7XG4gICAgfVxuICAgIFJlbW92YWxTZXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHRoaXMuX3NldC5hZGQodCk7XG4gICAgfTtcbiAgICBSZW1vdmFsU2V0LnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgdGhpcy5fc2V0LmZvckVhY2goZik7XG4gICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICB9O1xuICAgIFJlbW92YWxTZXQucHJvdG90eXBlLmRlbGV0ZSA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIGlmICh0aGlzLnRvRGVsZXRlLmxlbmd0aCA9PT0gdGhpcy50b0RlbGV0ZVNpemUpIHtcbiAgICAgICAgICAgIHRoaXMudG9EZWxldGUucHVzaCh0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudG9EZWxldGVbdGhpcy50b0RlbGV0ZVNpemVdID0gdDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRvRGVsZXRlU2l6ZSsrO1xuICAgIH07XG4gICAgUmVtb3ZhbFNldC5wcm90b3R5cGUuZmx1c2ggPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy50b0RlbGV0ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPCB0aGlzLnRvRGVsZXRlU2l6ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3NldC5kZWxldGUodGhpcy50b0RlbGV0ZVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnRvRGVsZXRlW2ldID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudG9EZWxldGVTaXplID0gMDtcbiAgICB9O1xuICAgIHJldHVybiBSZW1vdmFsU2V0O1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IFJlbW92YWxTZXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1SZW1vdmFsU2V0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBTY29wZUNoZWNrZXIgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gU2NvcGVDaGVja2VyKG5hbWVzcGFjZSwgaXNvbGF0ZU1vZHVsZSkge1xuICAgICAgICB0aGlzLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcbiAgICAgICAgdGhpcy5pc29sYXRlTW9kdWxlID0gaXNvbGF0ZU1vZHVsZTtcbiAgICAgICAgdGhpcy5fbmFtZXNwYWNlID0gbmFtZXNwYWNlLmZpbHRlcihmdW5jdGlvbiAobikgeyByZXR1cm4gbi50eXBlICE9PSAnc2VsZWN0b3InOyB9KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2hlY2tzIHdoZXRoZXIgdGhlIGdpdmVuIGVsZW1lbnQgaXMgKmRpcmVjdGx5KiBpbiB0aGUgc2NvcGUgb2YgdGhpc1xuICAgICAqIHNjb3BlIGNoZWNrZXIuIEJlaW5nIGNvbnRhaW5lZCAqaW5kaXJlY3RseSogdGhyb3VnaCBvdGhlciBzY29wZXNcbiAgICAgKiBpcyBub3QgdmFsaWQuIFRoaXMgaXMgY3J1Y2lhbCBmb3IgaW1wbGVtZW50aW5nIHBhcmVudC1jaGlsZCBpc29sYXRpb24sXG4gICAgICogc28gdGhhdCB0aGUgcGFyZW50IHNlbGVjdG9ycyBkb24ndCBzZWFyY2ggaW5zaWRlIGEgY2hpbGQgc2NvcGUuXG4gICAgICovXG4gICAgU2NvcGVDaGVja2VyLnByb3RvdHlwZS5pc0RpcmVjdGx5SW5TY29wZSA9IGZ1bmN0aW9uIChsZWFmKSB7XG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSB0aGlzLmlzb2xhdGVNb2R1bGUuZ2V0TmFtZXNwYWNlKGxlYWYpO1xuICAgICAgICBpZiAoIW5hbWVzcGFjZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLl9uYW1lc3BhY2UubGVuZ3RoID4gbmFtZXNwYWNlLmxlbmd0aCB8fFxuICAgICAgICAgICAgIXV0aWxzXzEuaXNFcXVhbE5hbWVzcGFjZSh0aGlzLl9uYW1lc3BhY2UsIG5hbWVzcGFjZS5zbGljZSgwLCB0aGlzLl9uYW1lc3BhY2UubGVuZ3RoKSkpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gdGhpcy5fbmFtZXNwYWNlLmxlbmd0aDsgaSA8IG5hbWVzcGFjZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKG5hbWVzcGFjZVtpXS50eXBlID09PSAndG90YWwnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgcmV0dXJuIFNjb3BlQ2hlY2tlcjtcbn0oKSk7XG5leHBvcnRzLlNjb3BlQ2hlY2tlciA9IFNjb3BlQ2hlY2tlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVNjb3BlQ2hlY2tlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBTeW1ib2xUcmVlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN5bWJvbFRyZWUobWFwcGVyKSB7XG4gICAgICAgIHRoaXMubWFwcGVyID0gbWFwcGVyO1xuICAgICAgICB0aGlzLnRyZWUgPSBbdW5kZWZpbmVkLCB7fV07XG4gICAgfVxuICAgIFN5bWJvbFRyZWUucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uIChwYXRoLCBlbGVtZW50LCBtYXgpIHtcbiAgICAgICAgdmFyIGN1cnIgPSB0aGlzLnRyZWU7XG4gICAgICAgIHZhciBfbWF4ID0gbWF4ICE9PSB1bmRlZmluZWQgPyBtYXggOiBwYXRoLmxlbmd0aDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBfbWF4OyBpKyspIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5tYXBwZXIocGF0aFtpXSk7XG4gICAgICAgICAgICB2YXIgY2hpbGQgPSBjdXJyWzFdW25dO1xuICAgICAgICAgICAgaWYgKCFjaGlsZCkge1xuICAgICAgICAgICAgICAgIGNoaWxkID0gW3VuZGVmaW5lZCwge31dO1xuICAgICAgICAgICAgICAgIGN1cnJbMV1bbl0gPSBjaGlsZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnIgPSBjaGlsZDtcbiAgICAgICAgfVxuICAgICAgICBjdXJyWzBdID0gZWxlbWVudDtcbiAgICB9O1xuICAgIFN5bWJvbFRyZWUucHJvdG90eXBlLmdldERlZmF1bHQgPSBmdW5jdGlvbiAocGF0aCwgbWtEZWZhdWx0RWxlbWVudCwgbWF4KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldChwYXRoLCBta0RlZmF1bHRFbGVtZW50LCBtYXgpO1xuICAgIH07XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcGF5bG9hZCBvZiB0aGUgcGF0aFxuICAgICAqIElmIGEgZGVmYXVsdCBlbGVtZW50IGNyZWF0b3IgaXMgZ2l2ZW4sIGl0IHdpbGwgaW5zZXJ0IGl0IGF0IHRoZSBwYXRoXG4gICAgICovXG4gICAgU3ltYm9sVHJlZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKHBhdGgsIG1rRGVmYXVsdEVsZW1lbnQsIG1heCkge1xuICAgICAgICB2YXIgY3VyciA9IHRoaXMudHJlZTtcbiAgICAgICAgdmFyIF9tYXggPSBtYXggIT09IHVuZGVmaW5lZCA/IG1heCA6IHBhdGgubGVuZ3RoO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IF9tYXg7IGkrKykge1xuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLm1hcHBlcihwYXRoW2ldKTtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGN1cnJbMV1bbl07XG4gICAgICAgICAgICBpZiAoIWNoaWxkKSB7XG4gICAgICAgICAgICAgICAgaWYgKG1rRGVmYXVsdEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2hpbGQgPSBbdW5kZWZpbmVkLCB7fV07XG4gICAgICAgICAgICAgICAgICAgIGN1cnJbMV1bbl0gPSBjaGlsZDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VyciA9IGNoaWxkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChta0RlZmF1bHRFbGVtZW50ICYmICFjdXJyWzBdKSB7XG4gICAgICAgICAgICBjdXJyWzBdID0gbWtEZWZhdWx0RWxlbWVudCgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdXJyWzBdO1xuICAgIH07XG4gICAgU3ltYm9sVHJlZS5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24gKHBhdGgpIHtcbiAgICAgICAgdmFyIGN1cnIgPSB0aGlzLnRyZWU7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBjaGlsZCA9IGN1cnJbMV1bdGhpcy5tYXBwZXIocGF0aFtpXSldO1xuICAgICAgICAgICAgaWYgKCFjaGlsZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGN1cnIgPSBjaGlsZDtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgY3VyclsxXVt0aGlzLm1hcHBlcihwYXRoW3BhdGgubGVuZ3RoIC0gMV0pXTtcbiAgICB9O1xuICAgIHJldHVybiBTeW1ib2xUcmVlO1xufSgpKTtcbmV4cG9ydHMuZGVmYXVsdCA9IFN5bWJvbFRyZWU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1TeW1ib2xUcmVlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwic25hYmJkb20vdm5vZGVcIik7XG52YXIgaF8xID0gcmVxdWlyZShcInNuYWJiZG9tL2hcIik7XG52YXIgc25hYmJkb21fc2VsZWN0b3JfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS1zZWxlY3RvclwiKTtcbnZhciB1dGlsc18xID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG52YXIgVk5vZGVXcmFwcGVyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFZOb2RlV3JhcHBlcihyb290RWxlbWVudCkge1xuICAgICAgICB0aGlzLnJvb3RFbGVtZW50ID0gcm9vdEVsZW1lbnQ7XG4gICAgfVxuICAgIFZOb2RlV3JhcHBlci5wcm90b3R5cGUuY2FsbCA9IGZ1bmN0aW9uICh2bm9kZSkge1xuICAgICAgICBpZiAodXRpbHNfMS5pc0RvY0ZyYWcodGhpcy5yb290RWxlbWVudCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndyYXBEb2NGcmFnKHZub2RlID09PSBudWxsID8gW10gOiBbdm5vZGVdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodm5vZGUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndyYXAoW10pO1xuICAgICAgICB9XG4gICAgICAgIHZhciBfYSA9IHNuYWJiZG9tX3NlbGVjdG9yXzEuc2VsZWN0b3JQYXJzZXIodm5vZGUpLCBzZWxUYWdOYW1lID0gX2EudGFnTmFtZSwgc2VsSWQgPSBfYS5pZDtcbiAgICAgICAgdmFyIHZOb2RlQ2xhc3NOYW1lID0gc25hYmJkb21fc2VsZWN0b3JfMS5jbGFzc05hbWVGcm9tVk5vZGUodm5vZGUpO1xuICAgICAgICB2YXIgdk5vZGVEYXRhID0gdm5vZGUuZGF0YSB8fCB7fTtcbiAgICAgICAgdmFyIHZOb2RlRGF0YVByb3BzID0gdk5vZGVEYXRhLnByb3BzIHx8IHt9O1xuICAgICAgICB2YXIgX2IgPSB2Tm9kZURhdGFQcm9wcy5pZCwgdk5vZGVJZCA9IF9iID09PSB2b2lkIDAgPyBzZWxJZCA6IF9iO1xuICAgICAgICB2YXIgaXNWTm9kZUFuZFJvb3RFbGVtZW50SWRlbnRpY2FsID0gdHlwZW9mIHZOb2RlSWQgPT09ICdzdHJpbmcnICYmXG4gICAgICAgICAgICB2Tm9kZUlkLnRvVXBwZXJDYXNlKCkgPT09IHRoaXMucm9vdEVsZW1lbnQuaWQudG9VcHBlckNhc2UoKSAmJlxuICAgICAgICAgICAgc2VsVGFnTmFtZS50b1VwcGVyQ2FzZSgpID09PSB0aGlzLnJvb3RFbGVtZW50LnRhZ05hbWUudG9VcHBlckNhc2UoKSAmJlxuICAgICAgICAgICAgdk5vZGVDbGFzc05hbWUudG9VcHBlckNhc2UoKSA9PT0gdGhpcy5yb290RWxlbWVudC5jbGFzc05hbWUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgaWYgKGlzVk5vZGVBbmRSb290RWxlbWVudElkZW50aWNhbCkge1xuICAgICAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLndyYXAoW3Zub2RlXSk7XG4gICAgfTtcbiAgICBWTm9kZVdyYXBwZXIucHJvdG90eXBlLndyYXBEb2NGcmFnID0gZnVuY3Rpb24gKGNoaWxkcmVuKSB7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLnZub2RlKCcnLCB7IGlzb2xhdGU6IFtdIH0sIGNoaWxkcmVuLCB1bmRlZmluZWQsIHRoaXNcbiAgICAgICAgICAgIC5yb290RWxlbWVudCk7XG4gICAgfTtcbiAgICBWTm9kZVdyYXBwZXIucHJvdG90eXBlLndyYXAgPSBmdW5jdGlvbiAoY2hpbGRyZW4pIHtcbiAgICAgICAgdmFyIF9hID0gdGhpcy5yb290RWxlbWVudCwgdGFnTmFtZSA9IF9hLnRhZ05hbWUsIGlkID0gX2EuaWQsIGNsYXNzTmFtZSA9IF9hLmNsYXNzTmFtZTtcbiAgICAgICAgdmFyIHNlbElkID0gaWQgPyBcIiNcIiArIGlkIDogJyc7XG4gICAgICAgIHZhciBzZWxDbGFzcyA9IGNsYXNzTmFtZSA/IFwiLlwiICsgY2xhc3NOYW1lLnNwbGl0KFwiIFwiKS5qb2luKFwiLlwiKSA6ICcnO1xuICAgICAgICB2YXIgdm5vZGUgPSBoXzEuaChcIlwiICsgdGFnTmFtZS50b0xvd2VyQ2FzZSgpICsgc2VsSWQgKyBzZWxDbGFzcywge30sIGNoaWxkcmVuKTtcbiAgICAgICAgdm5vZGUuZGF0YSA9IHZub2RlLmRhdGEgfHwge307XG4gICAgICAgIHZub2RlLmRhdGEuaXNvbGF0ZSA9IHZub2RlLmRhdGEuaXNvbGF0ZSB8fCBbXTtcbiAgICAgICAgcmV0dXJuIHZub2RlO1xuICAgIH07XG4gICAgcmV0dXJuIFZOb2RlV3JhcHBlcjtcbn0oKSk7XG5leHBvcnRzLlZOb2RlV3JhcHBlciA9IFZOb2RlV3JhcHBlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPVZOb2RlV3JhcHBlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbmZ1bmN0aW9uIGZyb21FdmVudChlbGVtZW50LCBldmVudE5hbWUsIHVzZUNhcHR1cmUsIHByZXZlbnREZWZhdWx0LCBwYXNzaXZlKSB7XG4gICAgaWYgKHVzZUNhcHR1cmUgPT09IHZvaWQgMCkgeyB1c2VDYXB0dXJlID0gZmFsc2U7IH1cbiAgICBpZiAocHJldmVudERlZmF1bHQgPT09IHZvaWQgMCkgeyBwcmV2ZW50RGVmYXVsdCA9IGZhbHNlOyB9XG4gICAgaWYgKHBhc3NpdmUgPT09IHZvaWQgMCkgeyBwYXNzaXZlID0gZmFsc2U7IH1cbiAgICB2YXIgbmV4dCA9IG51bGw7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5TdHJlYW0uY3JlYXRlKHtcbiAgICAgICAgc3RhcnQ6IGZ1bmN0aW9uIHN0YXJ0KGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBpZiAocHJldmVudERlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICBuZXh0ID0gZnVuY3Rpb24gX25leHQoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldmVudERlZmF1bHRDb25kaXRpb25hbChldmVudCwgcHJldmVudERlZmF1bHQpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5uZXh0KGV2ZW50KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbmV4dCA9IGZ1bmN0aW9uIF9uZXh0KGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVyLm5leHQoZXZlbnQpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBuZXh0LCB7XG4gICAgICAgICAgICAgICAgY2FwdHVyZTogdXNlQ2FwdHVyZSxcbiAgICAgICAgICAgICAgICBwYXNzaXZlOiBwYXNzaXZlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6IGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgICAgICBlbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBuZXh0LCB1c2VDYXB0dXJlKTtcbiAgICAgICAgICAgIG5leHQgPSBudWxsO1xuICAgICAgICB9LFxuICAgIH0pO1xufVxuZXhwb3J0cy5mcm9tRXZlbnQgPSBmcm9tRXZlbnQ7XG5mdW5jdGlvbiBtYXRjaE9iamVjdChtYXRjaGVyLCBvYmopIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG1hdGNoZXIpO1xuICAgIHZhciBuID0ga2V5cy5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgdmFyIGsgPSBrZXlzW2ldO1xuICAgICAgICBpZiAodHlwZW9mIG1hdGNoZXJba10gPT09ICdvYmplY3QnICYmIHR5cGVvZiBvYmpba10gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBpZiAoIW1hdGNoT2JqZWN0KG1hdGNoZXJba10sIG9ialtrXSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobWF0Y2hlcltrXSAhPT0gb2JqW2tdKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5mdW5jdGlvbiBwcmV2ZW50RGVmYXVsdENvbmRpdGlvbmFsKGV2ZW50LCBwcmV2ZW50RGVmYXVsdCkge1xuICAgIGlmIChwcmV2ZW50RGVmYXVsdCkge1xuICAgICAgICBpZiAodHlwZW9mIHByZXZlbnREZWZhdWx0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNQcmVkaWNhdGUocHJldmVudERlZmF1bHQpKSB7XG4gICAgICAgICAgICBpZiAocHJldmVudERlZmF1bHQoZXZlbnQpKSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgcHJldmVudERlZmF1bHQgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBpZiAobWF0Y2hPYmplY3QocHJldmVudERlZmF1bHQsIGV2ZW50KSkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3ByZXZlbnREZWZhdWx0IGhhcyB0byBiZSBlaXRoZXIgYSBib29sZWFuLCBwcmVkaWNhdGUgZnVuY3Rpb24gb3Igb2JqZWN0Jyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLnByZXZlbnREZWZhdWx0Q29uZGl0aW9uYWwgPSBwcmV2ZW50RGVmYXVsdENvbmRpdGlvbmFsO1xuZnVuY3Rpb24gaXNQcmVkaWNhdGUoZm4pIHtcbiAgICByZXR1cm4gdHlwZW9mIGZuID09PSAnZnVuY3Rpb24nO1xufVxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9ZnJvbUV2ZW50LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuLy8gdHNsaW50OmRpc2FibGU6bWF4LWZpbGUtbGluZS1jb3VudFxudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xuZnVuY3Rpb24gaXNWYWxpZFN0cmluZyhwYXJhbSkge1xuICAgIHJldHVybiB0eXBlb2YgcGFyYW0gPT09ICdzdHJpbmcnICYmIHBhcmFtLmxlbmd0aCA+IDA7XG59XG5mdW5jdGlvbiBpc1NlbGVjdG9yKHBhcmFtKSB7XG4gICAgcmV0dXJuIGlzVmFsaWRTdHJpbmcocGFyYW0pICYmIChwYXJhbVswXSA9PT0gJy4nIHx8IHBhcmFtWzBdID09PSAnIycpO1xufVxuZnVuY3Rpb24gY3JlYXRlVGFnRnVuY3Rpb24odGFnTmFtZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiBoeXBlcnNjcmlwdChhLCBiLCBjKSB7XG4gICAgICAgIHZhciBoYXNBID0gdHlwZW9mIGEgIT09ICd1bmRlZmluZWQnO1xuICAgICAgICB2YXIgaGFzQiA9IHR5cGVvZiBiICE9PSAndW5kZWZpbmVkJztcbiAgICAgICAgdmFyIGhhc0MgPSB0eXBlb2YgYyAhPT0gJ3VuZGVmaW5lZCc7XG4gICAgICAgIGlmIChpc1NlbGVjdG9yKGEpKSB7XG4gICAgICAgICAgICBpZiAoaGFzQiAmJiBoYXNDKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCBiLCBjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGhhc0IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSArIGEsIGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCB7fSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaGFzQykge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUgKyBhLCBiLCBjKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChoYXNCKSB7XG4gICAgICAgICAgICByZXR1cm4gaF8xLmgodGFnTmFtZSwgYSwgYik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaGFzQSkge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUsIGEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGhfMS5oKHRhZ05hbWUsIHt9KTtcbiAgICAgICAgfVxuICAgIH07XG59XG52YXIgU1ZHX1RBR19OQU1FUyA9IFtcbiAgICAnYScsXG4gICAgJ2FsdEdseXBoJyxcbiAgICAnYWx0R2x5cGhEZWYnLFxuICAgICdhbHRHbHlwaEl0ZW0nLFxuICAgICdhbmltYXRlJyxcbiAgICAnYW5pbWF0ZUNvbG9yJyxcbiAgICAnYW5pbWF0ZU1vdGlvbicsXG4gICAgJ2FuaW1hdGVUcmFuc2Zvcm0nLFxuICAgICdjaXJjbGUnLFxuICAgICdjbGlwUGF0aCcsXG4gICAgJ2NvbG9yUHJvZmlsZScsXG4gICAgJ2N1cnNvcicsXG4gICAgJ2RlZnMnLFxuICAgICdkZXNjJyxcbiAgICAnZWxsaXBzZScsXG4gICAgJ2ZlQmxlbmQnLFxuICAgICdmZUNvbG9yTWF0cml4JyxcbiAgICAnZmVDb21wb25lbnRUcmFuc2ZlcicsXG4gICAgJ2ZlQ29tcG9zaXRlJyxcbiAgICAnZmVDb252b2x2ZU1hdHJpeCcsXG4gICAgJ2ZlRGlmZnVzZUxpZ2h0aW5nJyxcbiAgICAnZmVEaXNwbGFjZW1lbnRNYXAnLFxuICAgICdmZURpc3RhbnRMaWdodCcsXG4gICAgJ2ZlRmxvb2QnLFxuICAgICdmZUZ1bmNBJyxcbiAgICAnZmVGdW5jQicsXG4gICAgJ2ZlRnVuY0cnLFxuICAgICdmZUZ1bmNSJyxcbiAgICAnZmVHYXVzc2lhbkJsdXInLFxuICAgICdmZUltYWdlJyxcbiAgICAnZmVNZXJnZScsXG4gICAgJ2ZlTWVyZ2VOb2RlJyxcbiAgICAnZmVNb3JwaG9sb2d5JyxcbiAgICAnZmVPZmZzZXQnLFxuICAgICdmZVBvaW50TGlnaHQnLFxuICAgICdmZVNwZWN1bGFyTGlnaHRpbmcnLFxuICAgICdmZVNwb3RsaWdodCcsXG4gICAgJ2ZlVGlsZScsXG4gICAgJ2ZlVHVyYnVsZW5jZScsXG4gICAgJ2ZpbHRlcicsXG4gICAgJ2ZvbnQnLFxuICAgICdmb250RmFjZScsXG4gICAgJ2ZvbnRGYWNlRm9ybWF0JyxcbiAgICAnZm9udEZhY2VOYW1lJyxcbiAgICAnZm9udEZhY2VTcmMnLFxuICAgICdmb250RmFjZVVyaScsXG4gICAgJ2ZvcmVpZ25PYmplY3QnLFxuICAgICdnJyxcbiAgICAnZ2x5cGgnLFxuICAgICdnbHlwaFJlZicsXG4gICAgJ2hrZXJuJyxcbiAgICAnaW1hZ2UnLFxuICAgICdsaW5lJyxcbiAgICAnbGluZWFyR3JhZGllbnQnLFxuICAgICdtYXJrZXInLFxuICAgICdtYXNrJyxcbiAgICAnbWV0YWRhdGEnLFxuICAgICdtaXNzaW5nR2x5cGgnLFxuICAgICdtcGF0aCcsXG4gICAgJ3BhdGgnLFxuICAgICdwYXR0ZXJuJyxcbiAgICAncG9seWdvbicsXG4gICAgJ3BvbHlsaW5lJyxcbiAgICAncmFkaWFsR3JhZGllbnQnLFxuICAgICdyZWN0JyxcbiAgICAnc2NyaXB0JyxcbiAgICAnc2V0JyxcbiAgICAnc3RvcCcsXG4gICAgJ3N0eWxlJyxcbiAgICAnc3dpdGNoJyxcbiAgICAnc3ltYm9sJyxcbiAgICAndGV4dCcsXG4gICAgJ3RleHRQYXRoJyxcbiAgICAndGl0bGUnLFxuICAgICd0cmVmJyxcbiAgICAndHNwYW4nLFxuICAgICd1c2UnLFxuICAgICd2aWV3JyxcbiAgICAndmtlcm4nLFxuXTtcbnZhciBzdmcgPSBjcmVhdGVUYWdGdW5jdGlvbignc3ZnJyk7XG5TVkdfVEFHX05BTUVTLmZvckVhY2goZnVuY3Rpb24gKHRhZykge1xuICAgIHN2Z1t0YWddID0gY3JlYXRlVGFnRnVuY3Rpb24odGFnKTtcbn0pO1xudmFyIFRBR19OQU1FUyA9IFtcbiAgICAnYScsXG4gICAgJ2FiYnInLFxuICAgICdhZGRyZXNzJyxcbiAgICAnYXJlYScsXG4gICAgJ2FydGljbGUnLFxuICAgICdhc2lkZScsXG4gICAgJ2F1ZGlvJyxcbiAgICAnYicsXG4gICAgJ2Jhc2UnLFxuICAgICdiZGknLFxuICAgICdiZG8nLFxuICAgICdibG9ja3F1b3RlJyxcbiAgICAnYm9keScsXG4gICAgJ2JyJyxcbiAgICAnYnV0dG9uJyxcbiAgICAnY2FudmFzJyxcbiAgICAnY2FwdGlvbicsXG4gICAgJ2NpdGUnLFxuICAgICdjb2RlJyxcbiAgICAnY29sJyxcbiAgICAnY29sZ3JvdXAnLFxuICAgICdkZCcsXG4gICAgJ2RlbCcsXG4gICAgJ2RldGFpbHMnLFxuICAgICdkZm4nLFxuICAgICdkaXInLFxuICAgICdkaXYnLFxuICAgICdkbCcsXG4gICAgJ2R0JyxcbiAgICAnZW0nLFxuICAgICdlbWJlZCcsXG4gICAgJ2ZpZWxkc2V0JyxcbiAgICAnZmlnY2FwdGlvbicsXG4gICAgJ2ZpZ3VyZScsXG4gICAgJ2Zvb3RlcicsXG4gICAgJ2Zvcm0nLFxuICAgICdoMScsXG4gICAgJ2gyJyxcbiAgICAnaDMnLFxuICAgICdoNCcsXG4gICAgJ2g1JyxcbiAgICAnaDYnLFxuICAgICdoZWFkJyxcbiAgICAnaGVhZGVyJyxcbiAgICAnaGdyb3VwJyxcbiAgICAnaHInLFxuICAgICdodG1sJyxcbiAgICAnaScsXG4gICAgJ2lmcmFtZScsXG4gICAgJ2ltZycsXG4gICAgJ2lucHV0JyxcbiAgICAnaW5zJyxcbiAgICAna2JkJyxcbiAgICAna2V5Z2VuJyxcbiAgICAnbGFiZWwnLFxuICAgICdsZWdlbmQnLFxuICAgICdsaScsXG4gICAgJ2xpbmsnLFxuICAgICdtYWluJyxcbiAgICAnbWFwJyxcbiAgICAnbWFyaycsXG4gICAgJ21lbnUnLFxuICAgICdtZXRhJyxcbiAgICAnbmF2JyxcbiAgICAnbm9zY3JpcHQnLFxuICAgICdvYmplY3QnLFxuICAgICdvbCcsXG4gICAgJ29wdGdyb3VwJyxcbiAgICAnb3B0aW9uJyxcbiAgICAncCcsXG4gICAgJ3BhcmFtJyxcbiAgICAncHJlJyxcbiAgICAncHJvZ3Jlc3MnLFxuICAgICdxJyxcbiAgICAncnAnLFxuICAgICdydCcsXG4gICAgJ3J1YnknLFxuICAgICdzJyxcbiAgICAnc2FtcCcsXG4gICAgJ3NjcmlwdCcsXG4gICAgJ3NlY3Rpb24nLFxuICAgICdzZWxlY3QnLFxuICAgICdzbWFsbCcsXG4gICAgJ3NvdXJjZScsXG4gICAgJ3NwYW4nLFxuICAgICdzdHJvbmcnLFxuICAgICdzdHlsZScsXG4gICAgJ3N1YicsXG4gICAgJ3N1bW1hcnknLFxuICAgICdzdXAnLFxuICAgICd0YWJsZScsXG4gICAgJ3Rib2R5JyxcbiAgICAndGQnLFxuICAgICd0ZXh0YXJlYScsXG4gICAgJ3Rmb290JyxcbiAgICAndGgnLFxuICAgICd0aGVhZCcsXG4gICAgJ3RpbWUnLFxuICAgICd0aXRsZScsXG4gICAgJ3RyJyxcbiAgICAndScsXG4gICAgJ3VsJyxcbiAgICAndmlkZW8nLFxuXTtcbnZhciBleHBvcnRlZCA9IHtcbiAgICBTVkdfVEFHX05BTUVTOiBTVkdfVEFHX05BTUVTLFxuICAgIFRBR19OQU1FUzogVEFHX05BTUVTLFxuICAgIHN2Zzogc3ZnLFxuICAgIGlzU2VsZWN0b3I6IGlzU2VsZWN0b3IsXG4gICAgY3JlYXRlVGFnRnVuY3Rpb246IGNyZWF0ZVRhZ0Z1bmN0aW9uLFxufTtcblRBR19OQU1FUy5mb3JFYWNoKGZ1bmN0aW9uIChuKSB7XG4gICAgZXhwb3J0ZWRbbl0gPSBjcmVhdGVUYWdGdW5jdGlvbihuKTtcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0ZWQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1oeXBlcnNjcmlwdC1oZWxwZXJzLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHRodW5rXzEgPSByZXF1aXJlKFwiLi90aHVua1wiKTtcbmV4cG9ydHMudGh1bmsgPSB0aHVua18xLnRodW5rO1xudmFyIE1haW5ET01Tb3VyY2VfMSA9IHJlcXVpcmUoXCIuL01haW5ET01Tb3VyY2VcIik7XG5leHBvcnRzLk1haW5ET01Tb3VyY2UgPSBNYWluRE9NU291cmNlXzEuTWFpbkRPTVNvdXJjZTtcbi8qKlxuICogQSBmYWN0b3J5IGZvciB0aGUgRE9NIGRyaXZlciBmdW5jdGlvbi5cbiAqXG4gKiBUYWtlcyBhIGBjb250YWluZXJgIHRvIGRlZmluZSB0aGUgdGFyZ2V0IG9uIHRoZSBleGlzdGluZyBET00gd2hpY2ggdGhpc1xuICogZHJpdmVyIHdpbGwgb3BlcmF0ZSBvbiwgYW5kIGFuIGBvcHRpb25zYCBvYmplY3QgYXMgdGhlIHNlY29uZCBhcmd1bWVudC4gVGhlXG4gKiBpbnB1dCB0byB0aGlzIGRyaXZlciBpcyBhIHN0cmVhbSBvZiB2aXJ0dWFsIERPTSBvYmplY3RzLCBvciBpbiBvdGhlciB3b3JkcyxcbiAqIFNuYWJiZG9tIFwiVk5vZGVcIiBvYmplY3RzLiBUaGUgb3V0cHV0IG9mIHRoaXMgZHJpdmVyIGlzIGEgXCJET01Tb3VyY2VcIjogYVxuICogY29sbGVjdGlvbiBvZiBPYnNlcnZhYmxlcyBxdWVyaWVkIHdpdGggdGhlIG1ldGhvZHMgYHNlbGVjdCgpYCBhbmQgYGV2ZW50cygpYC5cbiAqXG4gKiAqKmBET01Tb3VyY2Uuc2VsZWN0KHNlbGVjdG9yKWAqKiByZXR1cm5zIGEgbmV3IERPTVNvdXJjZSB3aXRoIHNjb3BlXG4gKiByZXN0cmljdGVkIHRvIHRoZSBlbGVtZW50KHMpIHRoYXQgbWF0Y2hlcyB0aGUgQ1NTIGBzZWxlY3RvcmAgZ2l2ZW4uIFRvIHNlbGVjdFxuICogdGhlIHBhZ2UncyBgZG9jdW1lbnRgLCB1c2UgYC5zZWxlY3QoJ2RvY3VtZW50JylgLiBUbyBzZWxlY3QgdGhlIGNvbnRhaW5lclxuICogZWxlbWVudCBmb3IgdGhpcyBhcHAsIHVzZSBgLnNlbGVjdCgnOnJvb3QnKWAuXG4gKlxuICogKipgRE9NU291cmNlLmV2ZW50cyhldmVudFR5cGUsIG9wdGlvbnMpYCoqIHJldHVybnMgYSBzdHJlYW0gb2YgZXZlbnRzIG9mXG4gKiBgZXZlbnRUeXBlYCBoYXBwZW5pbmcgb24gdGhlIGVsZW1lbnRzIHRoYXQgbWF0Y2ggdGhlIGN1cnJlbnQgRE9NU291cmNlLiBUaGVcbiAqIGV2ZW50IG9iamVjdCBjb250YWlucyB0aGUgYG93bmVyVGFyZ2V0YCBwcm9wZXJ0eSB0aGF0IGJlaGF2ZXMgZXhhY3RseSBsaWtlXG4gKiBgY3VycmVudFRhcmdldGAuIFRoZSByZWFzb24gZm9yIHRoaXMgaXMgdGhhdCBzb21lIGJyb3dzZXJzIGRvZXNuJ3QgYWxsb3dcbiAqIGBjdXJyZW50VGFyZ2V0YCBwcm9wZXJ0eSB0byBiZSBtdXRhdGVkLCBoZW5jZSBhIG5ldyBwcm9wZXJ0eSBpcyBjcmVhdGVkLiBUaGVcbiAqIHJldHVybmVkIHN0cmVhbSBpcyBhbiAqeHN0cmVhbSogU3RyZWFtIGlmIHlvdSB1c2UgYEBjeWNsZS94c3RyZWFtLXJ1bmAgdG8gcnVuXG4gKiB5b3VyIGFwcCB3aXRoIHRoaXMgZHJpdmVyLCBvciBpdCBpcyBhbiBSeEpTIE9ic2VydmFibGUgaWYgeW91IHVzZVxuICogYEBjeWNsZS9yeGpzLXJ1bmAsIGFuZCBzbyBmb3J0aC5cbiAqXG4gKiAqKm9wdGlvbnMgZm9yIERPTVNvdXJjZS5ldmVudHMqKlxuICpcbiAqIFRoZSBgb3B0aW9uc2AgcGFyYW1ldGVyIG9uIGBET01Tb3VyY2UuZXZlbnRzKGV2ZW50VHlwZSwgb3B0aW9ucylgIGlzIGFuXG4gKiAob3B0aW9uYWwpIG9iamVjdCB3aXRoIHR3byBvcHRpb25hbCBmaWVsZHM6IGB1c2VDYXB0dXJlYCBhbmRcbiAqIGBwcmV2ZW50RGVmYXVsdGAuXG4gKlxuICogYHVzZUNhcHR1cmVgIGlzIGJ5IGRlZmF1bHQgYGZhbHNlYCwgZXhjZXB0IGl0IGlzIGB0cnVlYCBmb3IgZXZlbnQgdHlwZXMgdGhhdFxuICogZG8gbm90IGJ1YmJsZS4gUmVhZCBtb3JlIGhlcmVcbiAqIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9FdmVudFRhcmdldC9hZGRFdmVudExpc3RlbmVyXG4gKiBhYm91dCB0aGUgYHVzZUNhcHR1cmVgIGFuZCBpdHMgcHVycG9zZS5cbiAqXG4gKiBgcHJldmVudERlZmF1bHRgIGlzIGJ5IGRlZmF1bHQgYGZhbHNlYCwgYW5kIGluZGljYXRlcyB0byB0aGUgZHJpdmVyIHdoZXRoZXJcbiAqIGBldmVudC5wcmV2ZW50RGVmYXVsdCgpYCBzaG91bGQgYmUgaW52b2tlZC4gVGhpcyBvcHRpb24gY2FuIGJlIGNvbmZpZ3VyZWQgaW5cbiAqIHRocmVlIHdheXM6XG4gKlxuICogLSBge3ByZXZlbnREZWZhdWx0OiBib29sZWFufWAgdG8gaW52b2tlIHByZXZlbnREZWZhdWx0IGlmIGB0cnVlYCwgYW5kIG5vdFxuICogaW52b2tlIG90aGVyd2lzZS5cbiAqIC0gYHtwcmV2ZW50RGVmYXVsdDogKGV2OiBFdmVudCkgPT4gYm9vbGVhbn1gIGZvciBjb25kaXRpb25hbCBpbnZvY2F0aW9uLlxuICogLSBge3ByZXZlbnREZWZhdWx0OiBOZXN0ZWRPYmplY3R9YCB1c2VzIGFuIG9iamVjdCB0byBiZSByZWN1cnNpdmVseSBjb21wYXJlZFxuICogdG8gdGhlIGBFdmVudGAgb2JqZWN0LiBgcHJldmVudERlZmF1bHRgIGlzIGludm9rZWQgd2hlbiBhbGwgcHJvcGVydGllcyBvbiB0aGVcbiAqIG5lc3RlZCBvYmplY3QgbWF0Y2ggd2l0aCB0aGUgcHJvcGVydGllcyBvbiB0aGUgZXZlbnQgb2JqZWN0LlxuICpcbiAqIEhlcmUgYXJlIHNvbWUgZXhhbXBsZXM6XG4gKiBgYGB0eXBlc2NyaXB0XG4gKiAvLyBhbHdheXMgcHJldmVudCBkZWZhdWx0XG4gKiBET01Tb3VyY2Uuc2VsZWN0KCdpbnB1dCcpLmV2ZW50cygna2V5ZG93bicsIHtcbiAqICAgcHJldmVudERlZmF1bHQ6IHRydWVcbiAqIH0pXG4gKlxuICogLy8gcHJldmVudCBkZWZhdWx0IG9ubHkgd2hlbiBgRU5URVJgIGlzIHByZXNzZWRcbiAqIERPTVNvdXJjZS5zZWxlY3QoJ2lucHV0JykuZXZlbnRzKCdrZXlkb3duJywge1xuICogICBwcmV2ZW50RGVmYXVsdDogZSA9PiBlLmtleUNvZGUgPT09IDEzXG4gKiB9KVxuICpcbiAqIC8vIHByZXZlbnQgZGVmdWFsdCB3aGVuIGBFTlRFUmAgaXMgcHJlc3NlZCBBTkQgdGFyZ2V0LnZhbHVlIGlzICdIRUxMTydcbiAqIERPTVNvdXJjZS5zZWxlY3QoJ2lucHV0JykuZXZlbnRzKCdrZXlkb3duJywge1xuICogICBwcmV2ZW50RGVmYXVsdDogeyBrZXlDb2RlOiAxMywgb3duZXJUYXJnZXQ6IHsgdmFsdWU6ICdIRUxMTycgfSB9XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqICoqYERPTVNvdXJjZS5lbGVtZW50cygpYCoqIHJldHVybnMgYSBzdHJlYW0gb2YgYXJyYXlzIGNvbnRhaW5pbmcgdGhlIERPTVxuICogZWxlbWVudHMgdGhhdCBtYXRjaCB0aGUgc2VsZWN0b3JzIGluIHRoZSBET01Tb3VyY2UgKGUuZy4gZnJvbSBwcmV2aW91c1xuICogYHNlbGVjdCh4KWAgY2FsbHMpLlxuICpcbiAqICoqYERPTVNvdXJjZS5lbGVtZW50KClgKiogcmV0dXJucyBhIHN0cmVhbSBvZiBET00gZWxlbWVudHMuIE5vdGljZSB0aGF0IHRoaXNcbiAqIGlzIHRoZSBzaW5ndWxhciB2ZXJzaW9uIG9mIGAuZWxlbWVudHMoKWAsIHNvIHRoZSBzdHJlYW0gd2lsbCBlbWl0IGFuIGVsZW1lbnQsXG4gKiBub3QgYW4gYXJyYXkuIElmIHRoZXJlIGlzIG5vIGVsZW1lbnQgdGhhdCBtYXRjaGVzIHRoZSBzZWxlY3RlZCBET01Tb3VyY2UsXG4gKiB0aGVuIHRoZSByZXR1cm5lZCBzdHJlYW0gd2lsbCBub3QgZW1pdCBhbnl0aGluZy5cbiAqXG4gKiBAcGFyYW0geyhTdHJpbmd8SFRNTEVsZW1lbnQpfSBjb250YWluZXIgdGhlIERPTSBzZWxlY3RvciBmb3IgdGhlIGVsZW1lbnRcbiAqIChvciB0aGUgZWxlbWVudCBpdHNlbGYpIHRvIGNvbnRhaW4gdGhlIHJlbmRlcmluZyBvZiB0aGUgVlRyZWVzLlxuICogQHBhcmFtIHtET01Ecml2ZXJPcHRpb25zfSBvcHRpb25zIGFuIG9iamVjdCB3aXRoIHR3byBvcHRpb25hbCBwcm9wZXJ0aWVzOlxuICpcbiAqICAgLSBgbW9kdWxlczogYXJyYXlgIG92ZXJyaWRlcyBgQGN5Y2xlL2RvbWAncyBkZWZhdWx0IFNuYWJiZG9tIG1vZHVsZXMgYXNcbiAqICAgICBhcyBkZWZpbmVkIGluIFtgc3JjL21vZHVsZXMudHNgXSguL3NyYy9tb2R1bGVzLnRzKS5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSB0aGUgRE9NIGRyaXZlciBmdW5jdGlvbi4gVGhlIGZ1bmN0aW9uIGV4cGVjdHMgYSBzdHJlYW0gb2ZcbiAqIFZOb2RlIGFzIGlucHV0LCBhbmQgb3V0cHV0cyB0aGUgRE9NU291cmNlIG9iamVjdC5cbiAqIEBmdW5jdGlvbiBtYWtlRE9NRHJpdmVyXG4gKi9cbnZhciBtYWtlRE9NRHJpdmVyXzEgPSByZXF1aXJlKFwiLi9tYWtlRE9NRHJpdmVyXCIpO1xuZXhwb3J0cy5tYWtlRE9NRHJpdmVyID0gbWFrZURPTURyaXZlcl8xLm1ha2VET01Ecml2ZXI7XG4vKipcbiAqIEEgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgbW9ja2VkIERPTVNvdXJjZSBvYmplY3RzLCBmb3IgdGVzdGluZyBwdXJwb3Nlcy5cbiAqXG4gKiBUYWtlcyBhIGBtb2NrQ29uZmlnYCBvYmplY3QgYXMgYXJndW1lbnQsIGFuZCByZXR1cm5zXG4gKiBhIERPTVNvdXJjZSB0aGF0IGNhbiBiZSBnaXZlbiB0byBhbnkgQ3ljbGUuanMgYXBwIHRoYXQgZXhwZWN0cyBhIERPTVNvdXJjZSBpblxuICogdGhlIHNvdXJjZXMsIGZvciB0ZXN0aW5nLlxuICpcbiAqIFRoZSBgbW9ja0NvbmZpZ2AgcGFyYW1ldGVyIGlzIGFuIG9iamVjdCBzcGVjaWZ5aW5nIHNlbGVjdG9ycywgZXZlbnRUeXBlcyBhbmRcbiAqIHRoZWlyIHN0cmVhbXMuIEV4YW1wbGU6XG4gKlxuICogYGBganNcbiAqIGNvbnN0IGRvbVNvdXJjZSA9IG1vY2tET01Tb3VyY2Uoe1xuICogICAnLmZvbyc6IHtcbiAqICAgICAnY2xpY2snOiB4cy5vZih7dGFyZ2V0OiB7fX0pLFxuICogICAgICdtb3VzZW92ZXInOiB4cy5vZih7dGFyZ2V0OiB7fX0pLFxuICogICB9LFxuICogICAnLmJhcic6IHtcbiAqICAgICAnc2Nyb2xsJzogeHMub2Yoe3RhcmdldDoge319KSxcbiAqICAgICBlbGVtZW50czogeHMub2Yoe3RhZ05hbWU6ICdkaXYnfSksXG4gKiAgIH1cbiAqIH0pO1xuICpcbiAqIC8vIFVzYWdlXG4gKiBjb25zdCBjbGljayQgPSBkb21Tb3VyY2Uuc2VsZWN0KCcuZm9vJykuZXZlbnRzKCdjbGljaycpO1xuICogY29uc3QgZWxlbWVudCQgPSBkb21Tb3VyY2Uuc2VsZWN0KCcuYmFyJykuZWxlbWVudHMoKTtcbiAqIGBgYFxuICpcbiAqIFRoZSBtb2NrZWQgRE9NIFNvdXJjZSBzdXBwb3J0cyBpc29sYXRpb24uIEl0IGhhcyB0aGUgZnVuY3Rpb25zIGBpc29sYXRlU2lua2BcbiAqIGFuZCBgaXNvbGF0ZVNvdXJjZWAgYXR0YWNoZWQgdG8gaXQsIGFuZCBwZXJmb3JtcyBzaW1wbGUgaXNvbGF0aW9uIHVzaW5nXG4gKiBjbGFzc05hbWVzLiAqaXNvbGF0ZVNpbmsqIHdpdGggc2NvcGUgYGZvb2Agd2lsbCBhcHBlbmQgdGhlIGNsYXNzIGBfX19mb29gIHRvXG4gKiB0aGUgc3RyZWFtIG9mIHZpcnR1YWwgRE9NIG5vZGVzLCBhbmQgKmlzb2xhdGVTb3VyY2UqIHdpdGggc2NvcGUgYGZvb2Agd2lsbFxuICogcGVyZm9ybSBhIGNvbnZlbnRpb25hbCBgbW9ja2VkRE9NU291cmNlLnNlbGVjdCgnLl9fZm9vJylgIGNhbGwuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG1vY2tDb25maWcgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIHNlbGVjdG9yIHN0cmluZ3NcbiAqIGFuZCB2YWx1ZXMgYXJlIG9iamVjdHMuIFRob3NlIG5lc3RlZCBvYmplY3RzIGhhdmUgYGV2ZW50VHlwZWAgc3RyaW5ncyBhcyBrZXlzXG4gKiBhbmQgdmFsdWVzIGFyZSBzdHJlYW1zIHlvdSBjcmVhdGVkLlxuICogQHJldHVybiB7T2JqZWN0fSBmYWtlIERPTSBzb3VyY2Ugb2JqZWN0LCB3aXRoIGFuIEFQSSBjb250YWluaW5nIGBzZWxlY3QoKWBcbiAqIGFuZCBgZXZlbnRzKClgIGFuZCBgZWxlbWVudHMoKWAgd2hpY2ggY2FuIGJlIHVzZWQganVzdCBsaWtlIHRoZSBET00gRHJpdmVyJ3NcbiAqIERPTVNvdXJjZS5cbiAqXG4gKiBAZnVuY3Rpb24gbW9ja0RPTVNvdXJjZVxuICovXG52YXIgbW9ja0RPTVNvdXJjZV8xID0gcmVxdWlyZShcIi4vbW9ja0RPTVNvdXJjZVwiKTtcbmV4cG9ydHMubW9ja0RPTVNvdXJjZSA9IG1vY2tET01Tb3VyY2VfMS5tb2NrRE9NU291cmNlO1xuZXhwb3J0cy5Nb2NrZWRET01Tb3VyY2UgPSBtb2NrRE9NU291cmNlXzEuTW9ja2VkRE9NU291cmNlO1xuLyoqXG4gKiBUaGUgaHlwZXJzY3JpcHQgZnVuY3Rpb24gYGgoKWAgaXMgYSBmdW5jdGlvbiB0byBjcmVhdGUgdmlydHVhbCBET00gb2JqZWN0cyxcbiAqIGFsc28ga25vd24gYXMgVk5vZGVzLiBDYWxsXG4gKlxuICogYGBganNcbiAqIGgoJ2Rpdi5teUNsYXNzJywge3N0eWxlOiB7Y29sb3I6ICdyZWQnfX0sIFtdKVxuICogYGBgXG4gKlxuICogdG8gY3JlYXRlIGEgVk5vZGUgdGhhdCByZXByZXNlbnRzIGEgYERJVmAgZWxlbWVudCB3aXRoIGNsYXNzTmFtZSBgbXlDbGFzc2AsXG4gKiBzdHlsZWQgd2l0aCByZWQgY29sb3IsIGFuZCBubyBjaGlsZHJlbiBiZWNhdXNlIHRoZSBgW11gIGFycmF5IHdhcyBwYXNzZWQuIFRoZVxuICogQVBJIGlzIGBoKHRhZ09yU2VsZWN0b3IsIG9wdGlvbmFsRGF0YSwgb3B0aW9uYWxDaGlsZHJlbk9yVGV4dClgLlxuICpcbiAqIEhvd2V2ZXIsIHVzdWFsbHkgeW91IHNob3VsZCB1c2UgXCJoeXBlcnNjcmlwdCBoZWxwZXJzXCIsIHdoaWNoIGFyZSBzaG9ydGN1dFxuICogZnVuY3Rpb25zIGJhc2VkIG9uIGh5cGVyc2NyaXB0LiBUaGVyZSBpcyBvbmUgaHlwZXJzY3JpcHQgaGVscGVyIGZ1bmN0aW9uIGZvclxuICogZWFjaCBET00gdGFnTmFtZSwgc3VjaCBhcyBgaDEoKWAsIGBoMigpYCwgYGRpdigpYCwgYHNwYW4oKWAsIGBsYWJlbCgpYCxcbiAqIGBpbnB1dCgpYC4gRm9yIGluc3RhbmNlLCB0aGUgcHJldmlvdXMgZXhhbXBsZSBjb3VsZCBoYXZlIGJlZW4gd3JpdHRlblxuICogYXM6XG4gKlxuICogYGBganNcbiAqIGRpdignLm15Q2xhc3MnLCB7c3R5bGU6IHtjb2xvcjogJ3JlZCd9fSwgW10pXG4gKiBgYGBcbiAqXG4gKiBUaGVyZSBhcmUgYWxzbyBTVkcgaGVscGVyIGZ1bmN0aW9ucywgd2hpY2ggYXBwbHkgdGhlIGFwcHJvcHJpYXRlIFNWR1xuICogbmFtZXNwYWNlIHRvIHRoZSByZXN1bHRpbmcgZWxlbWVudHMuIGBzdmcoKWAgZnVuY3Rpb24gY3JlYXRlcyB0aGUgdG9wLW1vc3RcbiAqIFNWRyBlbGVtZW50LCBhbmQgYHN2Zy5nYCwgYHN2Zy5wb2x5Z29uYCwgYHN2Zy5jaXJjbGVgLCBgc3ZnLnBhdGhgIGFyZSBmb3JcbiAqIFNWRy1zcGVjaWZpYyBjaGlsZCBlbGVtZW50cy4gRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogc3ZnKHthdHRyczoge3dpZHRoOiAxNTAsIGhlaWdodDogMTUwfX0sIFtcbiAqICAgc3ZnLnBvbHlnb24oe1xuICogICAgIGF0dHJzOiB7XG4gKiAgICAgICBjbGFzczogJ3RyaWFuZ2xlJyxcbiAqICAgICAgIHBvaW50czogJzIwIDAgMjAgMTUwIDE1MCAyMCdcbiAqICAgICB9XG4gKiAgIH0pXG4gKiBdKVxuICogYGBgXG4gKlxuICogQGZ1bmN0aW9uIGhcbiAqL1xudmFyIGhfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9oXCIpO1xuZXhwb3J0cy5oID0gaF8xLmg7XG52YXIgaHlwZXJzY3JpcHRfaGVscGVyc18xID0gcmVxdWlyZShcIi4vaHlwZXJzY3JpcHQtaGVscGVyc1wiKTtcbmV4cG9ydHMuc3ZnID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3ZnO1xuZXhwb3J0cy5hID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYTtcbmV4cG9ydHMuYWJiciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFiYnI7XG5leHBvcnRzLmFkZHJlc3MgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5hZGRyZXNzO1xuZXhwb3J0cy5hcmVhID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXJlYTtcbmV4cG9ydHMuYXJ0aWNsZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmFydGljbGU7XG5leHBvcnRzLmFzaWRlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXNpZGU7XG5leHBvcnRzLmF1ZGlvID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYXVkaW87XG5leHBvcnRzLmIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5iO1xuZXhwb3J0cy5iYXNlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmFzZTtcbmV4cG9ydHMuYmRpID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYmRpO1xuZXhwb3J0cy5iZG8gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5iZG87XG5leHBvcnRzLmJsb2NrcXVvdGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ibG9ja3F1b3RlO1xuZXhwb3J0cy5ib2R5ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYm9keTtcbmV4cG9ydHMuYnIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5icjtcbmV4cG9ydHMuYnV0dG9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuYnV0dG9uO1xuZXhwb3J0cy5jYW52YXMgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jYW52YXM7XG5leHBvcnRzLmNhcHRpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jYXB0aW9uO1xuZXhwb3J0cy5jaXRlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuY2l0ZTtcbmV4cG9ydHMuY29kZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNvZGU7XG5leHBvcnRzLmNvbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmNvbDtcbmV4cG9ydHMuY29sZ3JvdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5jb2xncm91cDtcbmV4cG9ydHMuZGQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kZDtcbmV4cG9ydHMuZGVsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGVsO1xuZXhwb3J0cy5kZm4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5kZm47XG5leHBvcnRzLmRpciA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRpcjtcbmV4cG9ydHMuZGl2ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZGl2O1xuZXhwb3J0cy5kbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmRsO1xuZXhwb3J0cy5kdCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmR0O1xuZXhwb3J0cy5lbSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmVtO1xuZXhwb3J0cy5lbWJlZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmVtYmVkO1xuZXhwb3J0cy5maWVsZHNldCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmZpZWxkc2V0O1xuZXhwb3J0cy5maWdjYXB0aW9uID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZmlnY2FwdGlvbjtcbmV4cG9ydHMuZmlndXJlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuZmlndXJlO1xuZXhwb3J0cy5mb290ZXIgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5mb290ZXI7XG5leHBvcnRzLmZvcm0gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5mb3JtO1xuZXhwb3J0cy5oMSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmgxO1xuZXhwb3J0cy5oMiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmgyO1xuZXhwb3J0cy5oMyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmgzO1xuZXhwb3J0cy5oNCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmg0O1xuZXhwb3J0cy5oNSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmg1O1xuZXhwb3J0cy5oNiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmg2O1xuZXhwb3J0cy5oZWFkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaGVhZDtcbmV4cG9ydHMuaGVhZGVyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaGVhZGVyO1xuZXhwb3J0cy5oZ3JvdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5oZ3JvdXA7XG5leHBvcnRzLmhyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaHI7XG5leHBvcnRzLmh0bWwgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5odG1sO1xuZXhwb3J0cy5pID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaTtcbmV4cG9ydHMuaWZyYW1lID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaWZyYW1lO1xuZXhwb3J0cy5pbWcgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5pbWc7XG5leHBvcnRzLmlucHV0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuaW5wdXQ7XG5leHBvcnRzLmlucyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmlucztcbmV4cG9ydHMua2JkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQua2JkO1xuZXhwb3J0cy5rZXlnZW4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5rZXlnZW47XG5leHBvcnRzLmxhYmVsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubGFiZWw7XG5leHBvcnRzLmxlZ2VuZCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LmxlZ2VuZDtcbmV4cG9ydHMubGkgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5saTtcbmV4cG9ydHMubGluayA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lmxpbms7XG5leHBvcnRzLm1haW4gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tYWluO1xuZXhwb3J0cy5tYXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tYXA7XG5leHBvcnRzLm1hcmsgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5tYXJrO1xuZXhwb3J0cy5tZW51ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQubWVudTtcbmV4cG9ydHMubWV0YSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm1ldGE7XG5leHBvcnRzLm5hdiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm5hdjtcbmV4cG9ydHMubm9zY3JpcHQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5ub3NjcmlwdDtcbmV4cG9ydHMub2JqZWN0ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQub2JqZWN0O1xuZXhwb3J0cy5vbCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9sO1xuZXhwb3J0cy5vcHRncm91cCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0Lm9wdGdyb3VwO1xuZXhwb3J0cy5vcHRpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5vcHRpb247XG5leHBvcnRzLnAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wO1xuZXhwb3J0cy5wYXJhbSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnBhcmFtO1xuZXhwb3J0cy5wcmUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5wcmU7XG5leHBvcnRzLnByb2dyZXNzID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucHJvZ3Jlc3M7XG5leHBvcnRzLnEgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5xO1xuZXhwb3J0cy5ycCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnJwO1xuZXhwb3J0cy5ydCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnJ0O1xuZXhwb3J0cy5ydWJ5ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQucnVieTtcbmV4cG9ydHMucyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnM7XG5leHBvcnRzLnNhbXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zYW1wO1xuZXhwb3J0cy5zY3JpcHQgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zY3JpcHQ7XG5leHBvcnRzLnNlY3Rpb24gPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zZWN0aW9uO1xuZXhwb3J0cy5zZWxlY3QgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zZWxlY3Q7XG5leHBvcnRzLnNtYWxsID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc21hbGw7XG5leHBvcnRzLnNvdXJjZSA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNvdXJjZTtcbmV4cG9ydHMuc3BhbiA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnNwYW47XG5leHBvcnRzLnN0cm9uZyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnN0cm9uZztcbmV4cG9ydHMuc3R5bGUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdHlsZTtcbmV4cG9ydHMuc3ViID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQuc3ViO1xuZXhwb3J0cy5zdXAgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC5zdXA7XG5leHBvcnRzLnRhYmxlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGFibGU7XG5leHBvcnRzLnRib2R5ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGJvZHk7XG5leHBvcnRzLnRkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGQ7XG5leHBvcnRzLnRleHRhcmVhID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGV4dGFyZWE7XG5leHBvcnRzLnRmb290ID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGZvb3Q7XG5leHBvcnRzLnRoID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGg7XG5leHBvcnRzLnRoZWFkID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGhlYWQ7XG5leHBvcnRzLnRpdGxlID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudGl0bGU7XG5leHBvcnRzLnRyID0gaHlwZXJzY3JpcHRfaGVscGVyc18xLmRlZmF1bHQudHI7XG5leHBvcnRzLnUgPSBoeXBlcnNjcmlwdF9oZWxwZXJzXzEuZGVmYXVsdC51O1xuZXhwb3J0cy51bCA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnVsO1xuZXhwb3J0cy52aWRlbyA9IGh5cGVyc2NyaXB0X2hlbHBlcnNfMS5kZWZhdWx0LnZpZGVvO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBmdW5jdGlvbiAoKSB7XG4gICAgX19hc3NpZ24gPSBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICAgICAgZm9yICh2YXIgcywgaSA9IDEsIG4gPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBzID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgICAgIHRbcF0gPSBzW3BdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0O1xuICAgIH07XG4gICAgcmV0dXJuIF9fYXNzaWduLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbmZ1bmN0aW9uIG1ha2VJc29sYXRlU2luayhuYW1lc3BhY2UpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHNpbmssIHNjb3BlKSB7XG4gICAgICAgIGlmIChzY29wZSA9PT0gJzpyb290Jykge1xuICAgICAgICAgICAgcmV0dXJuIHNpbms7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpbmsubWFwKGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzY29wZU9iaiA9IGdldFNjb3BlT2JqKHNjb3BlKTtcbiAgICAgICAgICAgIHZhciBuZXdOb2RlID0gX19hc3NpZ24oe30sIG5vZGUsIHsgZGF0YTogX19hc3NpZ24oe30sIG5vZGUuZGF0YSwgeyBpc29sYXRlOiAhbm9kZS5kYXRhIHx8ICFBcnJheS5pc0FycmF5KG5vZGUuZGF0YS5pc29sYXRlKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBuYW1lc3BhY2UuY29uY2F0KFtzY29wZU9ial0pXG4gICAgICAgICAgICAgICAgICAgICAgICA6IG5vZGUuZGF0YS5pc29sYXRlIH0pIH0pO1xuICAgICAgICAgICAgcmV0dXJuIF9fYXNzaWduKHt9LCBuZXdOb2RlLCB7IGtleTogbmV3Tm9kZS5rZXkgIT09IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICA/IG5ld05vZGUua2V5XG4gICAgICAgICAgICAgICAgICAgIDogSlNPTi5zdHJpbmdpZnkobmV3Tm9kZS5kYXRhLmlzb2xhdGUpIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlSXNvbGF0ZVNpbmsgPSBtYWtlSXNvbGF0ZVNpbms7XG5mdW5jdGlvbiBnZXRTY29wZU9iaihzY29wZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6IHV0aWxzXzEuaXNDbGFzc09ySWQoc2NvcGUpID8gJ3NpYmxpbmcnIDogJ3RvdGFsJyxcbiAgICAgICAgc2NvcGU6IHNjb3BlLFxuICAgIH07XG59XG5leHBvcnRzLmdldFNjb3BlT2JqID0gZ2V0U2NvcGVPYmo7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pc29sYXRlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHNuYWJiZG9tXzEgPSByZXF1aXJlKFwic25hYmJkb21cIik7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgY29uY2F0XzEgPSByZXF1aXJlKFwieHN0cmVhbS9leHRyYS9jb25jYXRcIik7XG52YXIgc2FtcGxlQ29tYmluZV8xID0gcmVxdWlyZShcInhzdHJlYW0vZXh0cmEvc2FtcGxlQ29tYmluZVwiKTtcbnZhciBNYWluRE9NU291cmNlXzEgPSByZXF1aXJlKFwiLi9NYWluRE9NU291cmNlXCIpO1xudmFyIHRvdm5vZGVfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS90b3Zub2RlXCIpO1xudmFyIFZOb2RlV3JhcHBlcl8xID0gcmVxdWlyZShcIi4vVk5vZGVXcmFwcGVyXCIpO1xudmFyIHV0aWxzXzEgPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbnZhciBtb2R1bGVzXzEgPSByZXF1aXJlKFwiLi9tb2R1bGVzXCIpO1xudmFyIElzb2xhdGVNb2R1bGVfMSA9IHJlcXVpcmUoXCIuL0lzb2xhdGVNb2R1bGVcIik7XG52YXIgRXZlbnREZWxlZ2F0b3JfMSA9IHJlcXVpcmUoXCIuL0V2ZW50RGVsZWdhdG9yXCIpO1xuZnVuY3Rpb24gbWFrZURPTURyaXZlcklucHV0R3VhcmQobW9kdWxlcykge1xuICAgIGlmICghQXJyYXkuaXNBcnJheShtb2R1bGVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJPcHRpb25hbCBtb2R1bGVzIG9wdGlvbiBtdXN0IGJlIGFuIGFycmF5IGZvciBzbmFiYmRvbSBtb2R1bGVzXCIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRvbURyaXZlcklucHV0R3VhcmQodmlldyQpIHtcbiAgICBpZiAoIXZpZXckIHx8XG4gICAgICAgIHR5cGVvZiB2aWV3JC5hZGRMaXN0ZW5lciAhPT0gXCJmdW5jdGlvblwiIHx8XG4gICAgICAgIHR5cGVvZiB2aWV3JC5mb2xkICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIERPTSBkcml2ZXIgZnVuY3Rpb24gZXhwZWN0cyBhcyBpbnB1dCBhIFN0cmVhbSBvZiBcIiArXG4gICAgICAgICAgICBcInZpcnR1YWwgRE9NIGVsZW1lbnRzXCIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGRyb3BDb21wbGV0aW9uKGlucHV0KSB7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0Lm1lcmdlKGlucHV0LCB4c3RyZWFtXzEuZGVmYXVsdC5uZXZlcigpKTtcbn1cbmZ1bmN0aW9uIHVud3JhcEVsZW1lbnRGcm9tVk5vZGUodm5vZGUpIHtcbiAgICByZXR1cm4gdm5vZGUuZWxtO1xufVxuZnVuY3Rpb24gcmVwb3J0U25hYmJkb21FcnJvcihlcnIpIHtcbiAgICAoY29uc29sZS5lcnJvciB8fCBjb25zb2xlLmxvZykoZXJyKTtcbn1cbmZ1bmN0aW9uIG1ha2VET01SZWFkeSQoKSB7XG4gICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSh7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAobGlzKSB7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2xvYWRpbmcnKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncmVhZHlzdGF0ZWNoYW5nZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gZG9jdW1lbnQucmVhZHlTdGF0ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSAnaW50ZXJhY3RpdmUnIHx8IHN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsaXMubmV4dChudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxpcy5jb21wbGV0ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsaXMubmV4dChudWxsKTtcbiAgICAgICAgICAgICAgICBsaXMuY29tcGxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkgeyB9LFxuICAgIH0pO1xufVxuZnVuY3Rpb24gYWRkUm9vdFNjb3BlKHZub2RlKSB7XG4gICAgdm5vZGUuZGF0YSA9IHZub2RlLmRhdGEgfHwge307XG4gICAgdm5vZGUuZGF0YS5pc29sYXRlID0gW107XG4gICAgcmV0dXJuIHZub2RlO1xufVxuZnVuY3Rpb24gbWFrZURPTURyaXZlcihjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucyA9IHt9O1xuICAgIH1cbiAgICB1dGlsc18xLmNoZWNrVmFsaWRDb250YWluZXIoY29udGFpbmVyKTtcbiAgICB2YXIgbW9kdWxlcyA9IG9wdGlvbnMubW9kdWxlcyB8fCBtb2R1bGVzXzEuZGVmYXVsdDtcbiAgICBtYWtlRE9NRHJpdmVySW5wdXRHdWFyZChtb2R1bGVzKTtcbiAgICB2YXIgaXNvbGF0ZU1vZHVsZSA9IG5ldyBJc29sYXRlTW9kdWxlXzEuSXNvbGF0ZU1vZHVsZSgpO1xuICAgIHZhciBwYXRjaCA9IHNuYWJiZG9tXzEuaW5pdChbaXNvbGF0ZU1vZHVsZS5jcmVhdGVNb2R1bGUoKV0uY29uY2F0KG1vZHVsZXMpKTtcbiAgICB2YXIgZG9tUmVhZHkkID0gbWFrZURPTVJlYWR5JCgpO1xuICAgIHZhciB2bm9kZVdyYXBwZXI7XG4gICAgdmFyIG11dGF0aW9uT2JzZXJ2ZXI7XG4gICAgdmFyIG11dGF0aW9uQ29uZmlybWVkJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSh7XG4gICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgICAgIG11dGF0aW9uT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7IHJldHVybiBsaXN0ZW5lci5uZXh0KG51bGwpOyB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbXV0YXRpb25PYnNlcnZlci5kaXNjb25uZWN0KCk7XG4gICAgICAgIH0sXG4gICAgfSk7XG4gICAgZnVuY3Rpb24gRE9NRHJpdmVyKHZub2RlJCwgbmFtZSkge1xuICAgICAgICBpZiAobmFtZSA9PT0gdm9pZCAwKSB7IG5hbWUgPSAnRE9NJzsgfVxuICAgICAgICBkb21Ecml2ZXJJbnB1dEd1YXJkKHZub2RlJCk7XG4gICAgICAgIHZhciBzYW5pdGF0aW9uJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSgpO1xuICAgICAgICB2YXIgZmlyc3RSb290JCA9IGRvbVJlYWR5JC5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGZpcnN0Um9vdCA9IHV0aWxzXzEuZ2V0VmFsaWROb2RlKGNvbnRhaW5lcikgfHwgZG9jdW1lbnQuYm9keTtcbiAgICAgICAgICAgIHZub2RlV3JhcHBlciA9IG5ldyBWTm9kZVdyYXBwZXJfMS5WTm9kZVdyYXBwZXIoZmlyc3RSb290KTtcbiAgICAgICAgICAgIHJldHVybiBmaXJzdFJvb3Q7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBXZSBuZWVkIHRvIHN1YnNjcmliZSB0byB0aGUgc2luayAoaS5lLiB2bm9kZSQpIHN5bmNocm9ub3VzbHkgaW5zaWRlIHRoaXNcbiAgICAgICAgLy8gZHJpdmVyLCBhbmQgbm90IGxhdGVyIGluIHRoZSBtYXAoKS5mbGF0dGVuKCkgYmVjYXVzZSB0aGlzIHNpbmsgaXMgaW5cbiAgICAgICAgLy8gcmVhbGl0eSBhIFNpbmtQcm94eSBmcm9tIEBjeWNsZS9ydW4sIGFuZCB3ZSBkb24ndCB3YW50IHRvIG1pc3MgdGhlIGZpcnN0XG4gICAgICAgIC8vIGVtaXNzaW9uIHdoZW4gdGhlIG1haW4oKSBpcyBjb25uZWN0ZWQgdG8gdGhlIGRyaXZlcnMuXG4gICAgICAgIC8vIFJlYWQgbW9yZSBpbiBpc3N1ZSAjNzM5LlxuICAgICAgICB2YXIgcmVtZW1iZXJlZFZOb2RlJCA9IHZub2RlJC5yZW1lbWJlcigpO1xuICAgICAgICByZW1lbWJlcmVkVk5vZGUkLmFkZExpc3RlbmVyKHt9KTtcbiAgICAgICAgLy8gVGhlIG11dGF0aW9uIG9ic2VydmVyIGludGVybmFsIHRvIG11dGF0aW9uQ29uZmlybWVkJCBzaG91bGRcbiAgICAgICAgLy8gZXhpc3QgYmVmb3JlIGVsZW1lbnRBZnRlclBhdGNoJCBjYWxscyBtdXRhdGlvbk9ic2VydmVyLm9ic2VydmUoKVxuICAgICAgICBtdXRhdGlvbkNvbmZpcm1lZCQuYWRkTGlzdGVuZXIoe30pO1xuICAgICAgICB2YXIgZWxlbWVudEFmdGVyUGF0Y2gkID0gZmlyc3RSb290JFxuICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAoZmlyc3RSb290KSB7XG4gICAgICAgICAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHRcbiAgICAgICAgICAgICAgICAubWVyZ2UocmVtZW1iZXJlZFZOb2RlJC5lbmRXaGVuKHNhbml0YXRpb24kKSwgc2FuaXRhdGlvbiQpXG4gICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbiAodm5vZGUpIHsgcmV0dXJuIHZub2RlV3JhcHBlci5jYWxsKHZub2RlKTsgfSlcbiAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKGFkZFJvb3RTY29wZSh0b3Zub2RlXzEudG9WTm9kZShmaXJzdFJvb3QpKSlcbiAgICAgICAgICAgICAgICAuZm9sZChwYXRjaCwgdG92bm9kZV8xLnRvVk5vZGUoZmlyc3RSb290KSlcbiAgICAgICAgICAgICAgICAuZHJvcCgxKVxuICAgICAgICAgICAgICAgIC5tYXAodW53cmFwRWxlbWVudEZyb21WTm9kZSlcbiAgICAgICAgICAgICAgICAuc3RhcnRXaXRoKGZpcnN0Um9vdClcbiAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICAgICAgICAgIG11dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZShlbCwge1xuICAgICAgICAgICAgICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGNoYXJhY3RlckRhdGE6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZU9sZFZhbHVlOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICBjaGFyYWN0ZXJEYXRhT2xkVmFsdWU6IHRydWUsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY29tcG9zZShkcm9wQ29tcGxldGlvbik7XG4gICAgICAgIH0gLy8gZG9uJ3QgY29tcGxldGUgdGhpcyBzdHJlYW1cbiAgICAgICAgKVxuICAgICAgICAgICAgLmZsYXR0ZW4oKTtcbiAgICAgICAgdmFyIHJvb3RFbGVtZW50JCA9IGNvbmNhdF8xLmRlZmF1bHQoZG9tUmVhZHkkLCBtdXRhdGlvbkNvbmZpcm1lZCQpXG4gICAgICAgICAgICAuZW5kV2hlbihzYW5pdGF0aW9uJClcbiAgICAgICAgICAgIC5jb21wb3NlKHNhbXBsZUNvbWJpbmVfMS5kZWZhdWx0KGVsZW1lbnRBZnRlclBhdGNoJCkpXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChhcnIpIHsgcmV0dXJuIGFyclsxXTsgfSlcbiAgICAgICAgICAgIC5yZW1lbWJlcigpO1xuICAgICAgICAvLyBTdGFydCB0aGUgc25hYmJkb20gcGF0Y2hpbmcsIG92ZXIgdGltZVxuICAgICAgICByb290RWxlbWVudCQuYWRkTGlzdGVuZXIoeyBlcnJvcjogcmVwb3J0U25hYmJkb21FcnJvciB9KTtcbiAgICAgICAgdmFyIGRlbGVnYXRvciA9IG5ldyBFdmVudERlbGVnYXRvcl8xLkV2ZW50RGVsZWdhdG9yKHJvb3RFbGVtZW50JCwgaXNvbGF0ZU1vZHVsZSk7XG4gICAgICAgIHJldHVybiBuZXcgTWFpbkRPTVNvdXJjZV8xLk1haW5ET01Tb3VyY2Uocm9vdEVsZW1lbnQkLCBzYW5pdGF0aW9uJCwgW10sIGlzb2xhdGVNb2R1bGUsIGRlbGVnYXRvciwgbmFtZSk7XG4gICAgfVxuICAgIHJldHVybiBET01Ecml2ZXI7XG59XG5leHBvcnRzLm1ha2VET01Ecml2ZXIgPSBtYWtlRE9NRHJpdmVyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWFrZURPTURyaXZlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xudmFyIFNDT1BFX1BSRUZJWCA9ICdfX18nO1xudmFyIE1vY2tlZERPTVNvdXJjZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNb2NrZWRET01Tb3VyY2UoX21vY2tDb25maWcpIHtcbiAgICAgICAgdGhpcy5fbW9ja0NvbmZpZyA9IF9tb2NrQ29uZmlnO1xuICAgICAgICBpZiAoX21vY2tDb25maWcuZWxlbWVudHMpIHtcbiAgICAgICAgICAgIHRoaXMuX2VsZW1lbnRzID0gX21vY2tDb25maWcuZWxlbWVudHM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9lbGVtZW50cyA9IGFkYXB0XzEuYWRhcHQoeHN0cmVhbV8xLmRlZmF1bHQuZW1wdHkoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXNcbiAgICAgICAgICAgIC5fZWxlbWVudHM7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9ICdNb2NrZWRET00nO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5lbGVtZW50ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgb3V0cHV0JCA9IHRoaXMuZWxlbWVudHMoKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoYXJyKSB7IHJldHVybiBhcnIubGVuZ3RoID4gMDsgfSlcbiAgICAgICAgICAgIC5tYXAoZnVuY3Rpb24gKGFycikgeyByZXR1cm4gYXJyWzBdOyB9KVxuICAgICAgICAgICAgLnJlbWVtYmVyKCk7XG4gICAgICAgIHZhciBvdXQgPSBhZGFwdF8xLmFkYXB0KG91dHB1dCQpO1xuICAgICAgICBvdXQuX2lzQ3ljbGVTb3VyY2UgPSAnTW9ja2VkRE9NJztcbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9O1xuICAgIE1vY2tlZERPTVNvdXJjZS5wcm90b3R5cGUuZXZlbnRzID0gZnVuY3Rpb24gKGV2ZW50VHlwZSwgb3B0aW9ucywgYnViYmxlcykge1xuICAgICAgICB2YXIgc3RyZWFtRm9yRXZlbnRUeXBlID0gdGhpcy5fbW9ja0NvbmZpZ1tldmVudFR5cGVdO1xuICAgICAgICB2YXIgb3V0ID0gYWRhcHRfMS5hZGFwdChzdHJlYW1Gb3JFdmVudFR5cGUgfHwgeHN0cmVhbV8xLmRlZmF1bHQuZW1wdHkoKSk7XG4gICAgICAgIG91dC5faXNDeWNsZVNvdXJjZSA9ICdNb2NrZWRET00nO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIG1vY2tDb25maWdGb3JTZWxlY3RvciA9IHRoaXMuX21vY2tDb25maWdbc2VsZWN0b3JdIHx8IHt9O1xuICAgICAgICByZXR1cm4gbmV3IE1vY2tlZERPTVNvdXJjZShtb2NrQ29uZmlnRm9yU2VsZWN0b3IpO1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5pc29sYXRlU291cmNlID0gZnVuY3Rpb24gKHNvdXJjZSwgc2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHNvdXJjZS5zZWxlY3QoJy4nICsgU0NPUEVfUFJFRklYICsgc2NvcGUpO1xuICAgIH07XG4gICAgTW9ja2VkRE9NU291cmNlLnByb3RvdHlwZS5pc29sYXRlU2luayA9IGZ1bmN0aW9uIChzaW5rLCBzY29wZSkge1xuICAgICAgICByZXR1cm4gYWRhcHRfMS5hZGFwdCh4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rKS5tYXAoZnVuY3Rpb24gKHZub2RlKSB7XG4gICAgICAgICAgICBpZiAodm5vZGUuc2VsICYmIHZub2RlLnNlbC5pbmRleE9mKFNDT1BFX1BSRUZJWCArIHNjb3BlKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2bm9kZS5zZWwgKz0gXCIuXCIgKyBTQ09QRV9QUkVGSVggKyBzY29wZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKTtcbiAgICB9O1xuICAgIHJldHVybiBNb2NrZWRET01Tb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5Nb2NrZWRET01Tb3VyY2UgPSBNb2NrZWRET01Tb3VyY2U7XG5mdW5jdGlvbiBtb2NrRE9NU291cmNlKG1vY2tDb25maWcpIHtcbiAgICByZXR1cm4gbmV3IE1vY2tlZERPTVNvdXJjZShtb2NrQ29uZmlnKTtcbn1cbmV4cG9ydHMubW9ja0RPTVNvdXJjZSA9IG1vY2tET01Tb3VyY2U7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tb2NrRE9NU291cmNlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGNsYXNzXzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9jbGFzc1wiKTtcbmV4cG9ydHMuQ2xhc3NNb2R1bGUgPSBjbGFzc18xLmRlZmF1bHQ7XG52YXIgcHJvcHNfMSA9IHJlcXVpcmUoXCJzbmFiYmRvbS9tb2R1bGVzL3Byb3BzXCIpO1xuZXhwb3J0cy5Qcm9wc01vZHVsZSA9IHByb3BzXzEuZGVmYXVsdDtcbnZhciBhdHRyaWJ1dGVzXzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9hdHRyaWJ1dGVzXCIpO1xuZXhwb3J0cy5BdHRyc01vZHVsZSA9IGF0dHJpYnV0ZXNfMS5kZWZhdWx0O1xudmFyIHN0eWxlXzEgPSByZXF1aXJlKFwic25hYmJkb20vbW9kdWxlcy9zdHlsZVwiKTtcbmV4cG9ydHMuU3R5bGVNb2R1bGUgPSBzdHlsZV8xLmRlZmF1bHQ7XG52YXIgZGF0YXNldF8xID0gcmVxdWlyZShcInNuYWJiZG9tL21vZHVsZXMvZGF0YXNldFwiKTtcbmV4cG9ydHMuRGF0YXNldE1vZHVsZSA9IGRhdGFzZXRfMS5kZWZhdWx0O1xudmFyIG1vZHVsZXMgPSBbXG4gICAgc3R5bGVfMS5kZWZhdWx0LFxuICAgIGNsYXNzXzEuZGVmYXVsdCxcbiAgICBwcm9wc18xLmRlZmF1bHQsXG4gICAgYXR0cmlidXRlc18xLmRlZmF1bHQsXG4gICAgZGF0YXNldF8xLmRlZmF1bHQsXG5dO1xuZXhwb3J0cy5kZWZhdWx0ID0gbW9kdWxlcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1vZHVsZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgaF8xID0gcmVxdWlyZShcInNuYWJiZG9tL2hcIik7XG5mdW5jdGlvbiBjb3B5VG9UaHVuayh2bm9kZSwgdGh1bmtWTm9kZSkge1xuICAgIHRodW5rVk5vZGUuZWxtID0gdm5vZGUuZWxtO1xuICAgIHZub2RlLmRhdGEuZm4gPSB0aHVua1ZOb2RlLmRhdGEuZm47XG4gICAgdm5vZGUuZGF0YS5hcmdzID0gdGh1bmtWTm9kZS5kYXRhLmFyZ3M7XG4gICAgdm5vZGUuZGF0YS5pc29sYXRlID0gdGh1bmtWTm9kZS5kYXRhLmlzb2xhdGU7XG4gICAgdGh1bmtWTm9kZS5kYXRhID0gdm5vZGUuZGF0YTtcbiAgICB0aHVua1ZOb2RlLmNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW47XG4gICAgdGh1bmtWTm9kZS50ZXh0ID0gdm5vZGUudGV4dDtcbiAgICB0aHVua1ZOb2RlLmVsbSA9IHZub2RlLmVsbTtcbn1cbmZ1bmN0aW9uIGluaXQodGh1bmtWTm9kZSkge1xuICAgIHZhciBjdXIgPSB0aHVua1ZOb2RlLmRhdGE7XG4gICAgdmFyIHZub2RlID0gY3VyLmZuLmFwcGx5KHVuZGVmaW5lZCwgY3VyLmFyZ3MpO1xuICAgIGNvcHlUb1RodW5rKHZub2RlLCB0aHVua1ZOb2RlKTtcbn1cbmZ1bmN0aW9uIHByZXBhdGNoKG9sZFZub2RlLCB0aHVua1ZOb2RlKSB7XG4gICAgdmFyIG9sZCA9IG9sZFZub2RlLmRhdGEsIGN1ciA9IHRodW5rVk5vZGUuZGF0YTtcbiAgICB2YXIgaTtcbiAgICB2YXIgb2xkQXJncyA9IG9sZC5hcmdzLCBhcmdzID0gY3VyLmFyZ3M7XG4gICAgaWYgKG9sZC5mbiAhPT0gY3VyLmZuIHx8IG9sZEFyZ3MubGVuZ3RoICE9PSBhcmdzLmxlbmd0aCkge1xuICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmtWTm9kZSk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChvbGRBcmdzW2ldICE9PSBhcmdzW2ldKSB7XG4gICAgICAgICAgICBjb3B5VG9UaHVuayhjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBhcmdzKSwgdGh1bmtWTm9kZSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29weVRvVGh1bmsob2xkVm5vZGUsIHRodW5rVk5vZGUpO1xufVxuZnVuY3Rpb24gdGh1bmsoc2VsLCBrZXksIGZuLCBhcmdzKSB7XG4gICAgaWYgKGFyZ3MgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhcmdzID0gZm47XG4gICAgICAgIGZuID0ga2V5O1xuICAgICAgICBrZXkgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBoXzEuaChzZWwsIHtcbiAgICAgICAga2V5OiBrZXksXG4gICAgICAgIGhvb2s6IHsgaW5pdDogaW5pdCwgcHJlcGF0Y2g6IHByZXBhdGNoIH0sXG4gICAgICAgIGZuOiBmbixcbiAgICAgICAgYXJnczogYXJncyxcbiAgICB9KTtcbn1cbmV4cG9ydHMudGh1bmsgPSB0aHVuaztcbmV4cG9ydHMuZGVmYXVsdCA9IHRodW5rO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dGh1bmsuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBpc1ZhbGlkTm9kZShvYmopIHtcbiAgICB2YXIgRUxFTV9UWVBFID0gMTtcbiAgICB2YXIgRlJBR19UWVBFID0gMTE7XG4gICAgcmV0dXJuIHR5cGVvZiBIVE1MRWxlbWVudCA9PT0gJ29iamVjdCdcbiAgICAgICAgPyBvYmogaW5zdGFuY2VvZiBIVE1MRWxlbWVudCB8fCBvYmogaW5zdGFuY2VvZiBEb2N1bWVudEZyYWdtZW50XG4gICAgICAgIDogb2JqICYmXG4gICAgICAgICAgICB0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyAmJlxuICAgICAgICAgICAgb2JqICE9PSBudWxsICYmXG4gICAgICAgICAgICAob2JqLm5vZGVUeXBlID09PSBFTEVNX1RZUEUgfHwgb2JqLm5vZGVUeXBlID09PSBGUkFHX1RZUEUpICYmXG4gICAgICAgICAgICB0eXBlb2Ygb2JqLm5vZGVOYW1lID09PSAnc3RyaW5nJztcbn1cbmZ1bmN0aW9uIGlzQ2xhc3NPcklkKHN0cikge1xuICAgIHJldHVybiBzdHIubGVuZ3RoID4gMSAmJiAoc3RyWzBdID09PSAnLicgfHwgc3RyWzBdID09PSAnIycpO1xufVxuZXhwb3J0cy5pc0NsYXNzT3JJZCA9IGlzQ2xhc3NPcklkO1xuZnVuY3Rpb24gaXNEb2NGcmFnKGVsKSB7XG4gICAgcmV0dXJuIGVsLm5vZGVUeXBlID09PSAxMTtcbn1cbmV4cG9ydHMuaXNEb2NGcmFnID0gaXNEb2NGcmFnO1xuZnVuY3Rpb24gY2hlY2tWYWxpZENvbnRhaW5lcihjb250YWluZXIpIHtcbiAgICBpZiAodHlwZW9mIGNvbnRhaW5lciAhPT0gJ3N0cmluZycgJiYgIWlzVmFsaWROb2RlKGNvbnRhaW5lcikpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdHaXZlbiBjb250YWluZXIgaXMgbm90IGEgRE9NIGVsZW1lbnQgbmVpdGhlciBhIHNlbGVjdG9yIHN0cmluZy4nKTtcbiAgICB9XG59XG5leHBvcnRzLmNoZWNrVmFsaWRDb250YWluZXIgPSBjaGVja1ZhbGlkQ29udGFpbmVyO1xuZnVuY3Rpb24gZ2V0VmFsaWROb2RlKHNlbGVjdG9ycykge1xuICAgIHZhciBkb21FbGVtZW50ID0gdHlwZW9mIHNlbGVjdG9ycyA9PT0gJ3N0cmluZydcbiAgICAgICAgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9ycylcbiAgICAgICAgOiBzZWxlY3RvcnM7XG4gICAgaWYgKHR5cGVvZiBzZWxlY3RvcnMgPT09ICdzdHJpbmcnICYmIGRvbUVsZW1lbnQgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IHJlbmRlciBpbnRvIHVua25vd24gZWxlbWVudCBgXCIgKyBzZWxlY3RvcnMgKyBcImBcIik7XG4gICAgfVxuICAgIHJldHVybiBkb21FbGVtZW50O1xufVxuZXhwb3J0cy5nZXRWYWxpZE5vZGUgPSBnZXRWYWxpZE5vZGU7XG5mdW5jdGlvbiBnZXRTZWxlY3RvcnMobmFtZXNwYWNlKSB7XG4gICAgdmFyIHJlcyA9ICcnO1xuICAgIGZvciAodmFyIGkgPSBuYW1lc3BhY2UubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKG5hbWVzcGFjZVtpXS50eXBlICE9PSAnc2VsZWN0b3InKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICByZXMgPSBuYW1lc3BhY2VbaV0uc2NvcGUgKyAnICcgKyByZXM7XG4gICAgfVxuICAgIHJldHVybiByZXMudHJpbSgpO1xufVxuZXhwb3J0cy5nZXRTZWxlY3RvcnMgPSBnZXRTZWxlY3RvcnM7XG5mdW5jdGlvbiBpc0VxdWFsTmFtZXNwYWNlKGEsIGIpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoYSkgfHwgIUFycmF5LmlzQXJyYXkoYikgfHwgYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChhW2ldLnR5cGUgIT09IGJbaV0udHlwZSB8fCBhW2ldLnNjb3BlICE9PSBiW2ldLnNjb3BlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5leHBvcnRzLmlzRXF1YWxOYW1lc3BhY2UgPSBpc0VxdWFsTmFtZXNwYWNlO1xuZnVuY3Rpb24gbWFrZUluc2VydChtYXApIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHR5cGUsIGVsbSwgdmFsdWUpIHtcbiAgICAgICAgaWYgKG1hcC5oYXModHlwZSkpIHtcbiAgICAgICAgICAgIHZhciBpbm5lck1hcCA9IG1hcC5nZXQodHlwZSk7XG4gICAgICAgICAgICBpbm5lck1hcC5zZXQoZWxtLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgaW5uZXJNYXAgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICBpbm5lck1hcC5zZXQoZWxtLCB2YWx1ZSk7XG4gICAgICAgICAgICBtYXAuc2V0KHR5cGUsIGlubmVyTWFwKTtcbiAgICAgICAgfVxuICAgIH07XG59XG5leHBvcnRzLm1ha2VJbnNlcnQgPSBtYWtlSW5zZXJ0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9dXRpbHMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbmZ1bmN0aW9uIGNoZWNrSXNvbGF0ZUFyZ3MoZGF0YWZsb3dDb21wb25lbnQsIHNjb3BlKSB7XG4gICAgaWYgKHR5cGVvZiBkYXRhZmxvd0NvbXBvbmVudCAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGdpdmVuIHRvIGlzb2xhdGUoKSBtdXN0IGJlIGEgXCIgK1xuICAgICAgICAgICAgXCInZGF0YWZsb3dDb21wb25lbnQnIGZ1bmN0aW9uXCIpO1xuICAgIH1cbiAgICBpZiAoc2NvcGUgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIGlzb2xhdGUoKSBtdXN0IG5vdCBiZSBudWxsXCIpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVNjb3Blcyhzb3VyY2VzLCBzY29wZXMsIHJhbmRvbVNjb3BlKSB7XG4gICAgdmFyIHBlckNoYW5uZWwgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhzb3VyY2VzKS5mb3JFYWNoKGZ1bmN0aW9uIChjaGFubmVsKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2NvcGVzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHNjb3BlcztcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2FuZGlkYXRlID0gc2NvcGVzW2NoYW5uZWxdO1xuICAgICAgICBpZiAodHlwZW9mIGNhbmRpZGF0ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHBlckNoYW5uZWxbY2hhbm5lbF0gPSBjYW5kaWRhdGU7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdpbGRjYXJkID0gc2NvcGVzWycqJ107XG4gICAgICAgIGlmICh0eXBlb2Ygd2lsZGNhcmQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBwZXJDaGFubmVsW2NoYW5uZWxdID0gd2lsZGNhcmQ7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgcGVyQ2hhbm5lbFtjaGFubmVsXSA9IHJhbmRvbVNjb3BlO1xuICAgIH0pO1xuICAgIHJldHVybiBwZXJDaGFubmVsO1xufVxuZnVuY3Rpb24gaXNvbGF0ZUFsbFNvdXJjZXMob3V0ZXJTb3VyY2VzLCBzY29wZXMpIHtcbiAgICB2YXIgaW5uZXJTb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgY2hhbm5lbCBpbiBvdXRlclNvdXJjZXMpIHtcbiAgICAgICAgdmFyIG91dGVyU291cmNlID0gb3V0ZXJTb3VyY2VzW2NoYW5uZWxdO1xuICAgICAgICBpZiAob3V0ZXJTb3VyY2VzLmhhc093blByb3BlcnR5KGNoYW5uZWwpICYmXG4gICAgICAgICAgICBvdXRlclNvdXJjZSAmJlxuICAgICAgICAgICAgc2NvcGVzW2NoYW5uZWxdICE9PSBudWxsICYmXG4gICAgICAgICAgICB0eXBlb2Ygb3V0ZXJTb3VyY2UuaXNvbGF0ZVNvdXJjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgaW5uZXJTb3VyY2VzW2NoYW5uZWxdID0gb3V0ZXJTb3VyY2UuaXNvbGF0ZVNvdXJjZShvdXRlclNvdXJjZSwgc2NvcGVzW2NoYW5uZWxdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvdXRlclNvdXJjZXMuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkpIHtcbiAgICAgICAgICAgIGlubmVyU291cmNlc1tjaGFubmVsXSA9IG91dGVyU291cmNlc1tjaGFubmVsXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gaW5uZXJTb3VyY2VzO1xufVxuZnVuY3Rpb24gaXNvbGF0ZUFsbFNpbmtzKHNvdXJjZXMsIGlubmVyU2lua3MsIHNjb3Blcykge1xuICAgIHZhciBvdXRlclNpbmtzID0ge307XG4gICAgZm9yICh2YXIgY2hhbm5lbCBpbiBpbm5lclNpbmtzKSB7XG4gICAgICAgIHZhciBzb3VyY2UgPSBzb3VyY2VzW2NoYW5uZWxdO1xuICAgICAgICB2YXIgaW5uZXJTaW5rID0gaW5uZXJTaW5rc1tjaGFubmVsXTtcbiAgICAgICAgaWYgKGlubmVyU2lua3MuaGFzT3duUHJvcGVydHkoY2hhbm5lbCkgJiZcbiAgICAgICAgICAgIHNvdXJjZSAmJlxuICAgICAgICAgICAgc2NvcGVzW2NoYW5uZWxdICE9PSBudWxsICYmXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlLmlzb2xhdGVTaW5rID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBvdXRlclNpbmtzW2NoYW5uZWxdID0gYWRhcHRfMS5hZGFwdChzb3VyY2UuaXNvbGF0ZVNpbmsoeHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoaW5uZXJTaW5rKSwgc2NvcGVzW2NoYW5uZWxdKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaW5uZXJTaW5rcy5oYXNPd25Qcm9wZXJ0eShjaGFubmVsKSkge1xuICAgICAgICAgICAgb3V0ZXJTaW5rc1tjaGFubmVsXSA9IGlubmVyU2lua3NbY2hhbm5lbF07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dGVyU2lua3M7XG59XG52YXIgY291bnRlciA9IDA7XG5mdW5jdGlvbiBuZXdTY29wZSgpIHtcbiAgICByZXR1cm4gXCJjeWNsZVwiICsgKytjb3VudGVyO1xufVxuLyoqXG4gKiBUYWtlcyBhIGBjb21wb25lbnRgIGZ1bmN0aW9uIGFuZCBhIGBzY29wZWAsIGFuZCByZXR1cm5zIGFuIGlzb2xhdGVkIHZlcnNpb25cbiAqIG9mIHRoZSBgY29tcG9uZW50YCBmdW5jdGlvbi5cbiAqXG4gKiBXaGVuIHRoZSBpc29sYXRlZCBjb21wb25lbnQgaXMgaW52b2tlZCwgZWFjaCBzb3VyY2UgcHJvdmlkZWQgdG8gaXQgaXNcbiAqIGlzb2xhdGVkIHRvIHRoZSBnaXZlbiBgc2NvcGVgIHVzaW5nIGBzb3VyY2UuaXNvbGF0ZVNvdXJjZShzb3VyY2UsIHNjb3BlKWAsXG4gKiBpZiBwb3NzaWJsZS4gTGlrZXdpc2UsIHRoZSBzaW5rcyByZXR1cm5lZCBmcm9tIHRoZSBpc29sYXRlZCBjb21wb25lbnQgYXJlXG4gKiBpc29sYXRlZCB0byB0aGUgZ2l2ZW4gYHNjb3BlYCB1c2luZyBgc291cmNlLmlzb2xhdGVTaW5rKHNpbmssIHNjb3BlKWAuXG4gKlxuICogVGhlIGBzY29wZWAgY2FuIGJlIGEgc3RyaW5nIG9yIGFuIG9iamVjdC4gSWYgaXQgaXMgYW55dGhpbmcgZWxzZSB0aGFuIHRob3NlXG4gKiB0d28gdHlwZXMsIGl0IHdpbGwgYmUgY29udmVydGVkIHRvIGEgc3RyaW5nLiBJZiBgc2NvcGVgIGlzIGFuIG9iamVjdCwgaXRcbiAqIHJlcHJlc2VudHMgXCJzY29wZXMgcGVyIGNoYW5uZWxcIiwgYWxsb3dpbmcgeW91IHRvIHNwZWNpZnkgYSBkaWZmZXJlbnQgc2NvcGVcbiAqIGZvciBlYWNoIGtleSBvZiBzb3VyY2VzL3NpbmtzLiBGb3IgaW5zdGFuY2VcbiAqXG4gKiBgYGBqc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nLCBIVFRQOiAnYmFyJ30pKHNvdXJjZXMpO1xuICogYGBgXG4gKlxuICogWW91IGNhbiBhbHNvIHVzZSBhIHdpbGRjYXJkIGAnKidgIHRvIHVzZSBhcyBhIGRlZmF1bHQgZm9yIHNvdXJjZS9zaW5rc1xuICogY2hhbm5lbHMgdGhhdCBkaWQgbm90IHJlY2VpdmUgYSBzcGVjaWZpYyBzY29wZTpcbiAqXG4gKiBgYGBqc1xuICogLy8gVXNlcyAnYmFyJyBhcyB0aGUgaXNvbGF0aW9uIHNjb3BlIGZvciBIVFRQIGFuZCBvdGhlciBjaGFubmVsc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nLCAnKic6ICdiYXInfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBJZiBhIGNoYW5uZWwncyB2YWx1ZSBpcyBudWxsLCB0aGVuIHRoYXQgY2hhbm5lbCdzIHNvdXJjZXMgYW5kIHNpbmtzIHdvbid0IGJlXG4gKiBpc29sYXRlZC4gSWYgdGhlIHdpbGRjYXJkIGlzIG51bGwgYW5kIHNvbWUgY2hhbm5lbHMgYXJlIHVuc3BlY2lmaWVkLCB0aG9zZVxuICogY2hhbm5lbHMgd29uJ3QgYmUgaXNvbGF0ZWQuIElmIHlvdSBkb24ndCBoYXZlIGEgd2lsZGNhcmQgYW5kIHNvbWUgY2hhbm5lbHNcbiAqIGFyZSB1bnNwZWNpZmllZCwgdGhlbiBgaXNvbGF0ZWAgd2lsbCBnZW5lcmF0ZSBhIHJhbmRvbSBzY29wZS5cbiAqXG4gKiBgYGBqc1xuICogLy8gRG9lcyBub3QgaXNvbGF0ZSBIVFRQIHJlcXVlc3RzXG4gKiBjb25zdCBjaGlsZFNpbmtzID0gaXNvbGF0ZShDaGlsZCwge0RPTTogJ2ZvbycsIEhUVFA6IG51bGx9KShzb3VyY2VzKTtcbiAqIGBgYFxuICpcbiAqIElmIHRoZSBgc2NvcGVgIGFyZ3VtZW50IGlzIG5vdCBwcm92aWRlZCBhdCBhbGwsIGEgbmV3IHNjb3BlIHdpbGwgYmVcbiAqIGF1dG9tYXRpY2FsbHkgY3JlYXRlZC4gVGhpcyBtZWFucyB0aGF0IHdoaWxlICoqYGlzb2xhdGUoY29tcG9uZW50LCBzY29wZSlgIGlzXG4gKiBwdXJlKiogKHJlZmVyZW50aWFsbHkgdHJhbnNwYXJlbnQpLCAqKmBpc29sYXRlKGNvbXBvbmVudClgIGlzIGltcHVyZSoqIChub3RcbiAqIHJlZmVyZW50aWFsbHkgdHJhbnNwYXJlbnQpLiBUd28gY2FsbHMgdG8gYGlzb2xhdGUoRm9vLCBiYXIpYCB3aWxsIGdlbmVyYXRlXG4gKiB0aGUgc2FtZSBjb21wb25lbnQuIEJ1dCwgdHdvIGNhbGxzIHRvIGBpc29sYXRlKEZvbylgIHdpbGwgZ2VuZXJhdGUgdHdvXG4gKiBkaXN0aW5jdCBjb21wb25lbnRzLlxuICpcbiAqIGBgYGpzXG4gKiAvLyBVc2VzIHNvbWUgYXJiaXRyYXJ5IHN0cmluZyBhcyB0aGUgaXNvbGF0aW9uIHNjb3BlIGZvciBIVFRQIGFuZCBvdGhlciBjaGFubmVsc1xuICogY29uc3QgY2hpbGRTaW5rcyA9IGlzb2xhdGUoQ2hpbGQsIHtET006ICdmb28nfSkoc291cmNlcyk7XG4gKiBgYGBcbiAqXG4gKiBOb3RlIHRoYXQgYm90aCBgaXNvbGF0ZVNvdXJjZSgpYCBhbmQgYGlzb2xhdGVTaW5rKClgIGFyZSBzdGF0aWMgbWVtYmVycyBvZlxuICogYHNvdXJjZWAuIFRoZSByZWFzb24gZm9yIHRoaXMgaXMgdGhhdCBkcml2ZXJzIHByb2R1Y2UgYHNvdXJjZWAgd2hpbGUgdGhlXG4gKiBhcHBsaWNhdGlvbiBwcm9kdWNlcyBgc2lua2AsIGFuZCBpdCdzIHRoZSBkcml2ZXIncyByZXNwb25zaWJpbGl0eSB0b1xuICogaW1wbGVtZW50IGBpc29sYXRlU291cmNlKClgIGFuZCBgaXNvbGF0ZVNpbmsoKWAuXG4gKlxuICogX05vdGUgZm9yIFR5cGVzY3JpcHQgdXNlcnM6XyBgaXNvbGF0ZWAgaXMgbm90IGN1cnJlbnRseSB0eXBlLXRyYW5zcGFyZW50IGFuZFxuICogd2lsbCBleHBsaWNpdGx5IGNvbnZlcnQgZ2VuZXJpYyB0eXBlIGFyZ3VtZW50cyB0byBgYW55YC4gVG8gcHJlc2VydmUgdHlwZXMgaW5cbiAqIHlvdXIgY29tcG9uZW50cywgeW91IGNhbiB1c2UgYSB0eXBlIGFzc2VydGlvbjpcbiAqXG4gKiBgYGB0c1xuICogLy8gaWYgQ2hpbGQgaXMgdHlwZWQgYENvbXBvbmVudDxTb3VyY2VzLCBTaW5rcz5gXG4gKiBjb25zdCBpc29sYXRlZENoaWxkID0gaXNvbGF0ZSggQ2hpbGQgKSBhcyBDb21wb25lbnQ8U291cmNlcywgU2lua3M+O1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gY29tcG9uZW50IGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXRcbiAqIGFuZCBvdXRwdXRzIGEgY29sbGVjdGlvbiBvZiBgc2lua3NgLlxuICogQHBhcmFtIHtTdHJpbmd9IHNjb3BlIGFuIG9wdGlvbmFsIHN0cmluZyB0aGF0IGlzIHVzZWQgdG8gaXNvbGF0ZSBlYWNoXG4gKiBgc291cmNlc2AgYW5kIGBzaW5rc2Agd2hlbiB0aGUgcmV0dXJuZWQgc2NvcGVkIGNvbXBvbmVudCBpcyBpbnZva2VkLlxuICogQHJldHVybiB7RnVuY3Rpb259IHRoZSBzY29wZWQgY29tcG9uZW50IGZ1bmN0aW9uIHRoYXQsIGFzIHRoZSBvcmlnaW5hbFxuICogYGNvbXBvbmVudGAgZnVuY3Rpb24sIHRha2VzIGBzb3VyY2VzYCBhbmQgcmV0dXJucyBgc2lua3NgLlxuICogQGZ1bmN0aW9uIGlzb2xhdGVcbiAqL1xuZnVuY3Rpb24gaXNvbGF0ZShjb21wb25lbnQsIHNjb3BlKSB7XG4gICAgaWYgKHNjb3BlID09PSB2b2lkIDApIHsgc2NvcGUgPSBuZXdTY29wZSgpOyB9XG4gICAgY2hlY2tJc29sYXRlQXJncyhjb21wb25lbnQsIHNjb3BlKTtcbiAgICB2YXIgcmFuZG9tU2NvcGUgPSB0eXBlb2Ygc2NvcGUgPT09ICdvYmplY3QnID8gbmV3U2NvcGUoKSA6ICcnO1xuICAgIHZhciBzY29wZXMgPSB0eXBlb2Ygc2NvcGUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzY29wZSA9PT0gJ29iamVjdCdcbiAgICAgICAgPyBzY29wZVxuICAgICAgICA6IHNjb3BlLnRvU3RyaW5nKCk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBwZWRDb21wb25lbnQob3V0ZXJTb3VyY2VzKSB7XG4gICAgICAgIHZhciByZXN0ID0gW107XG4gICAgICAgIGZvciAodmFyIF9pID0gMTsgX2kgPCBhcmd1bWVudHMubGVuZ3RoOyBfaSsrKSB7XG4gICAgICAgICAgICByZXN0W19pIC0gMV0gPSBhcmd1bWVudHNbX2ldO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzY29wZXNQZXJDaGFubmVsID0gbm9ybWFsaXplU2NvcGVzKG91dGVyU291cmNlcywgc2NvcGVzLCByYW5kb21TY29wZSk7XG4gICAgICAgIHZhciBpbm5lclNvdXJjZXMgPSBpc29sYXRlQWxsU291cmNlcyhvdXRlclNvdXJjZXMsIHNjb3Blc1BlckNoYW5uZWwpO1xuICAgICAgICB2YXIgaW5uZXJTaW5rcyA9IGNvbXBvbmVudC5hcHBseSh2b2lkIDAsIFtpbm5lclNvdXJjZXNdLmNvbmNhdChyZXN0KSk7XG4gICAgICAgIHZhciBvdXRlclNpbmtzID0gaXNvbGF0ZUFsbFNpbmtzKG91dGVyU291cmNlcywgaW5uZXJTaW5rcywgc2NvcGVzUGVyQ2hhbm5lbCk7XG4gICAgICAgIHJldHVybiBvdXRlclNpbmtzO1xuICAgIH07XG59XG5pc29sYXRlLnJlc2V0ID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gKGNvdW50ZXIgPSAwKTsgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGlzb2xhdGU7XG5mdW5jdGlvbiB0b0lzb2xhdGVkKHNjb3BlKSB7XG4gICAgaWYgKHNjb3BlID09PSB2b2lkIDApIHsgc2NvcGUgPSBuZXdTY29wZSgpOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChjb21wb25lbnQpIHsgcmV0dXJuIGlzb2xhdGUoY29tcG9uZW50LCBzY29wZSk7IH07XG59XG5leHBvcnRzLnRvSXNvbGF0ZWQgPSB0b0lzb2xhdGVkO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICB2YXIgZ2xvYmFsT2JqO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IGdsb2JhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHRoaXM7XG4gICAgfVxuICAgIGdsb2JhbE9iai5DeWNsZWpzID0gZ2xvYmFsT2JqLkN5Y2xlanMgfHwge307XG4gICAgZ2xvYmFsT2JqID0gZ2xvYmFsT2JqLkN5Y2xlanM7XG4gICAgZ2xvYmFsT2JqLmFkYXB0U3RyZWFtID0gZ2xvYmFsT2JqLmFkYXB0U3RyZWFtIHx8IChmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XG4gICAgcmV0dXJuIGdsb2JhbE9iajtcbn1cbmZ1bmN0aW9uIHNldEFkYXB0KGYpIHtcbiAgICBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbSA9IGY7XG59XG5leHBvcnRzLnNldEFkYXB0ID0gc2V0QWRhcHQ7XG5mdW5jdGlvbiBhZGFwdChzdHJlYW0pIHtcbiAgICByZXR1cm4gZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0oc3RyZWFtKTtcbn1cbmV4cG9ydHMuYWRhcHQgPSBhZGFwdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFkYXB0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIGludGVybmFsc18xID0gcmVxdWlyZShcIi4vaW50ZXJuYWxzXCIpO1xuLyoqXG4gKiBBIGZ1bmN0aW9uIHRoYXQgcHJlcGFyZXMgdGhlIEN5Y2xlIGFwcGxpY2F0aW9uIHRvIGJlIGV4ZWN1dGVkLiBUYWtlcyBhIGBtYWluYFxuICogZnVuY3Rpb24gYW5kIHByZXBhcmVzIHRvIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb24gb2ZcbiAqIGRyaXZlciBmdW5jdGlvbnMuIEFzIGFuIG91dHB1dCwgYHNldHVwKClgIHJldHVybnMgYW4gb2JqZWN0IHdpdGggdGhyZWVcbiAqIHByb3BlcnRpZXM6IGBzb3VyY2VzYCwgYHNpbmtzYCBhbmQgYHJ1bmAuIE9ubHkgd2hlbiBgcnVuKClgIGlzIGNhbGxlZCB3aWxsXG4gKiB0aGUgYXBwbGljYXRpb24gYWN0dWFsbHkgZXhlY3V0ZS4gUmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgYHJ1bigpYCBmb3JcbiAqIG1vcmUgZGV0YWlscy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQge3NldHVwfSBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IHtzb3VyY2VzLCBzaW5rcywgcnVufSA9IHNldHVwKG1haW4sIGRyaXZlcnMpO1xuICogLy8gLi4uXG4gKiBjb25zdCBkaXNwb3NlID0gcnVuKCk7IC8vIEV4ZWN1dGVzIHRoZSBhcHBsaWNhdGlvblxuICogLy8gLi4uXG4gKiBkaXNwb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCB0aHJlZSBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kXG4gKiBgcnVuYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgc2lua3NgIGlzIHRoZVxuICogY29sbGVjdGlvbiBvZiBkcml2ZXIgc2lua3MsIHRoZXNlIGNhbiBiZSB1c2VkIGZvciBkZWJ1Z2dpbmcgb3IgdGVzdGluZy4gYHJ1bmBcbiAqIGlzIHRoZSBmdW5jdGlvbiB0aGF0IG9uY2UgY2FsbGVkIHdpbGwgZXhlY3V0ZSB0aGUgYXBwbGljYXRpb24uXG4gKiBAZnVuY3Rpb24gc2V0dXBcbiAqL1xuZnVuY3Rpb24gc2V0dXAobWFpbiwgZHJpdmVycykge1xuICAgIGlmICh0eXBlb2YgbWFpbiAhPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpcnN0IGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgdGhlICdtYWluJyBcIiArIFwiZnVuY3Rpb24uXCIpO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGRyaXZlcnMgIT09IFwib2JqZWN0XCIgfHwgZHJpdmVycyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGRyaXZlciBmdW5jdGlvbnMgYXMgcHJvcGVydGllcy5cIik7XG4gICAgfVxuICAgIGlmIChpbnRlcm5hbHNfMS5pc09iamVjdEVtcHR5KGRyaXZlcnMpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNlY29uZCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIGVuZ2luZSA9IHNldHVwUmV1c2FibGUoZHJpdmVycyk7XG4gICAgdmFyIHNpbmtzID0gbWFpbihlbmdpbmUuc291cmNlcyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHdpbmRvdy5DeWNsZWpzID0gd2luZG93LkN5Y2xlanMgfHwge307XG4gICAgICAgIHdpbmRvdy5DeWNsZWpzLnNpbmtzID0gc2lua3M7XG4gICAgfVxuICAgIGZ1bmN0aW9uIF9ydW4oKSB7XG4gICAgICAgIHZhciBkaXNwb3NlUnVuID0gZW5naW5lLnJ1bihzaW5rcyk7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBkaXNwb3NlKCkge1xuICAgICAgICAgICAgZGlzcG9zZVJ1bigpO1xuICAgICAgICAgICAgZW5naW5lLmRpc3Bvc2UoKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc2lua3M6IHNpbmtzLCBzb3VyY2VzOiBlbmdpbmUuc291cmNlcywgcnVuOiBfcnVuIH07XG59XG5leHBvcnRzLnNldHVwID0gc2V0dXA7XG4vKipcbiAqIEEgcGFydGlhbGx5LWFwcGxpZWQgdmFyaWFudCBvZiBzZXR1cCgpIHdoaWNoIGFjY2VwdHMgb25seSB0aGUgZHJpdmVycywgYW5kXG4gKiBhbGxvd3MgbWFueSBgbWFpbmAgZnVuY3Rpb25zIHRvIGV4ZWN1dGUgYW5kIHJldXNlIHRoaXMgc2FtZSBzZXQgb2YgZHJpdmVycy5cbiAqXG4gKiBUYWtlcyBhbiBvYmplY3Qgd2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIGlucHV0LCBhbmQgb3V0cHV0cyBhbiBvYmplY3Qgd2hpY2hcbiAqIGNvbnRhaW5zIHRoZSBnZW5lcmF0ZWQgc291cmNlcyAoZnJvbSB0aG9zZSBkcml2ZXJzKSBhbmQgYSBgcnVuYCBmdW5jdGlvblxuICogKHdoaWNoIGluIHR1cm4gZXhwZWN0cyBzaW5rcyBhcyBhcmd1bWVudCkuIFRoaXMgYHJ1bmAgZnVuY3Rpb24gY2FuIGJlIGNhbGxlZFxuICogbXVsdGlwbGUgdGltZXMgd2l0aCBkaWZmZXJlbnQgYXJndW1lbnRzLCBhbmQgaXQgd2lsbCByZXVzZSB0aGUgZHJpdmVycyB0aGF0XG4gKiB3ZXJlIHBhc3NlZCB0byBgc2V0dXBSZXVzYWJsZWAuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtzZXR1cFJldXNhYmxlfSBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IHtzb3VyY2VzLCBydW4sIGRpc3Bvc2V9ID0gc2V0dXBSZXVzYWJsZShkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogY29uc3Qgc2lua3MgPSBtYWluKHNvdXJjZXMpO1xuICogY29uc3QgZGlzcG9zZVJ1biA9IHJ1bihzaW5rcyk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2VSdW4oKTtcbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpOyAvLyBlbmRzIHRoZSByZXVzYWJpbGl0eSBvZiBkcml2ZXJzXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3Qgd2l0aCB0aHJlZSBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBydW5gIGFuZFxuICogYGRpc3Bvc2VgLiBgc291cmNlc2AgaXMgdGhlIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNvdXJjZXMsIGBydW5gIGlzIHRoZVxuICogZnVuY3Rpb24gdGhhdCBvbmNlIGNhbGxlZCB3aXRoICdzaW5rcycgYXMgYXJndW1lbnQsIHdpbGwgZXhlY3V0ZSB0aGVcbiAqIGFwcGxpY2F0aW9uLCB0eWluZyB0b2dldGhlciBzb3VyY2VzIHdpdGggc2lua3MuIGBkaXNwb3NlYCB0ZXJtaW5hdGVzIHRoZVxuICogcmV1c2FibGUgcmVzb3VyY2VzIHVzZWQgYnkgdGhlIGRyaXZlcnMuIE5vdGUgYWxzbyB0aGF0IGBydW5gIHJldHVybnMgYVxuICogZGlzcG9zZSBmdW5jdGlvbiB3aGljaCB0ZXJtaW5hdGVzIHJlc291cmNlcyB0aGF0IGFyZSBzcGVjaWZpYyAobm90IHJldXNhYmxlKVxuICogdG8gdGhhdCBydW4uXG4gKiBAZnVuY3Rpb24gc2V0dXBSZXVzYWJsZVxuICovXG5mdW5jdGlvbiBzZXR1cFJldXNhYmxlKGRyaXZlcnMpIHtcbiAgICBpZiAodHlwZW9mIGRyaXZlcnMgIT09IFwib2JqZWN0XCIgfHwgZHJpdmVycyA9PT0gbnVsbCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBnaXZlbiB0byBzZXR1cFJldXNhYmxlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMuXCIpO1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWxzXzEuaXNPYmplY3RFbXB0eShkcml2ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmd1bWVudCBnaXZlbiB0byBzZXR1cFJldXNhYmxlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBhdCBsZWFzdCBvbmUgZHJpdmVyIGZ1bmN0aW9uIGRlY2xhcmVkIGFzIGEgcHJvcGVydHkuXCIpO1xuICAgIH1cbiAgICB2YXIgc2lua1Byb3hpZXMgPSBpbnRlcm5hbHNfMS5tYWtlU2lua1Byb3hpZXMoZHJpdmVycyk7XG4gICAgdmFyIHJhd1NvdXJjZXMgPSBpbnRlcm5hbHNfMS5jYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcyk7XG4gICAgdmFyIHNvdXJjZXMgPSBpbnRlcm5hbHNfMS5hZGFwdFNvdXJjZXMocmF3U291cmNlcyk7XG4gICAgZnVuY3Rpb24gX3J1bihzaW5rcykge1xuICAgICAgICByZXR1cm4gaW50ZXJuYWxzXzEucmVwbGljYXRlTWFueShzaW5rcywgc2lua1Byb3hpZXMpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBkaXNwb3NlRW5naW5lKCkge1xuICAgICAgICBpbnRlcm5hbHNfMS5kaXNwb3NlU291cmNlcyhzb3VyY2VzKTtcbiAgICAgICAgaW50ZXJuYWxzXzEuZGlzcG9zZVNpbmtQcm94aWVzKHNpbmtQcm94aWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgc291cmNlczogc291cmNlcywgcnVuOiBfcnVuLCBkaXNwb3NlOiBkaXNwb3NlRW5naW5lIH07XG59XG5leHBvcnRzLnNldHVwUmV1c2FibGUgPSBzZXR1cFJldXNhYmxlO1xuLyoqXG4gKiBUYWtlcyBhIGBtYWluYCBmdW5jdGlvbiBhbmQgY2lyY3VsYXJseSBjb25uZWN0cyBpdCB0byB0aGUgZ2l2ZW4gY29sbGVjdGlvblxuICogb2YgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqXG4gKiAqKkV4YW1wbGU6KipcbiAqIGBgYGpzXG4gKiBpbXBvcnQgcnVuIGZyb20gJ0BjeWNsZS9ydW4nO1xuICogY29uc3QgZGlzcG9zZSA9IHJ1bihtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogVGhlIGBtYWluYCBmdW5jdGlvbiBleHBlY3RzIGEgY29sbGVjdGlvbiBvZiBcInNvdXJjZVwiIHN0cmVhbXMgKHJldHVybmVkIGZyb21cbiAqIGRyaXZlcnMpIGFzIGlucHV0LCBhbmQgc2hvdWxkIHJldHVybiBhIGNvbGxlY3Rpb24gb2YgXCJzaW5rXCIgc3RyZWFtcyAodG8gYmVcbiAqIGdpdmVuIHRvIGRyaXZlcnMpLiBBIFwiY29sbGVjdGlvbiBvZiBzdHJlYW1zXCIgaXMgYSBKYXZhU2NyaXB0IG9iamVjdCB3aGVyZVxuICoga2V5cyBtYXRjaCB0aGUgZHJpdmVyIG5hbWVzIHJlZ2lzdGVyZWQgYnkgdGhlIGBkcml2ZXJzYCBvYmplY3QsIGFuZCB2YWx1ZXNcbiAqIGFyZSB0aGUgc3RyZWFtcy4gUmVmZXIgdG8gdGhlIGRvY3VtZW50YXRpb24gb2YgZWFjaCBkcml2ZXIgdG8gc2VlIG1vcmVcbiAqIGRldGFpbHMgb24gd2hhdCB0eXBlcyBvZiBzb3VyY2VzIGl0IG91dHB1dHMgYW5kIHNpbmtzIGl0IHJlY2VpdmVzLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG1haW4gYSBmdW5jdGlvbiB0aGF0IHRha2VzIGBzb3VyY2VzYCBhcyBpbnB1dCBhbmQgb3V0cHV0c1xuICogYHNpbmtzYC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBkcml2ZXJzIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBkcml2ZXIgbmFtZXMgYW5kIHZhbHVlc1xuICogYXJlIGRyaXZlciBmdW5jdGlvbnMuXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn0gYSBkaXNwb3NlIGZ1bmN0aW9uLCB1c2VkIHRvIHRlcm1pbmF0ZSB0aGUgZXhlY3V0aW9uIG9mIHRoZVxuICogQ3ljbGUuanMgcHJvZ3JhbSwgY2xlYW5pbmcgdXAgcmVzb3VyY2VzIHVzZWQuXG4gKiBAZnVuY3Rpb24gcnVuXG4gKi9cbmZ1bmN0aW9uIHJ1bihtYWluLCBkcml2ZXJzKSB7XG4gICAgdmFyIHByb2dyYW0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiZcbiAgICAgICAgd2luZG93LkN5Y2xlanNEZXZUb29sX3N0YXJ0R3JhcGhTZXJpYWxpemVyKSB7XG4gICAgICAgIHdpbmRvdy5DeWNsZWpzRGV2VG9vbF9zdGFydEdyYXBoU2VyaWFsaXplcihwcm9ncmFtLnNpbmtzKTtcbiAgICB9XG4gICAgcmV0dXJuIHByb2dyYW0ucnVuKCk7XG59XG5leHBvcnRzLnJ1biA9IHJ1bjtcbmV4cG9ydHMuZGVmYXVsdCA9IHJ1bjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHhzdHJlYW1fMSA9IHJlcXVpcmUoXCJ4c3RyZWFtXCIpO1xudmFyIHF1aWNrdGFza18xID0gcmVxdWlyZShcInF1aWNrdGFza1wiKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIi4vYWRhcHRcIik7XG52YXIgc2NoZWR1bGVNaWNyb3Rhc2sgPSBxdWlja3Rhc2tfMS5kZWZhdWx0KCk7XG5mdW5jdGlvbiBtYWtlU2lua1Byb3hpZXMoZHJpdmVycykge1xuICAgIHZhciBzaW5rUHJveGllcyA9IHt9O1xuICAgIGZvciAodmFyIG5hbWVfMSBpbiBkcml2ZXJzKSB7XG4gICAgICAgIGlmIChkcml2ZXJzLmhhc093blByb3BlcnR5KG5hbWVfMSkpIHtcbiAgICAgICAgICAgIHNpbmtQcm94aWVzW25hbWVfMV0gPSB4c3RyZWFtXzEuZGVmYXVsdC5jcmVhdGUoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc2lua1Byb3hpZXM7XG59XG5leHBvcnRzLm1ha2VTaW5rUHJveGllcyA9IG1ha2VTaW5rUHJveGllcztcbmZ1bmN0aW9uIGNhbGxEcml2ZXJzKGRyaXZlcnMsIHNpbmtQcm94aWVzKSB7XG4gICAgdmFyIHNvdXJjZXMgPSB7fTtcbiAgICBmb3IgKHZhciBuYW1lXzIgaW4gZHJpdmVycykge1xuICAgICAgICBpZiAoZHJpdmVycy5oYXNPd25Qcm9wZXJ0eShuYW1lXzIpKSB7XG4gICAgICAgICAgICBzb3VyY2VzW25hbWVfMl0gPSBkcml2ZXJzW25hbWVfMl0oc2lua1Byb3hpZXNbbmFtZV8yXSwgbmFtZV8yKTtcbiAgICAgICAgICAgIGlmIChzb3VyY2VzW25hbWVfMl0gJiYgdHlwZW9mIHNvdXJjZXNbbmFtZV8yXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBzb3VyY2VzW25hbWVfMl0uX2lzQ3ljbGVTb3VyY2UgPSBuYW1lXzI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZXM7XG59XG5leHBvcnRzLmNhbGxEcml2ZXJzID0gY2FsbERyaXZlcnM7XG4vLyBOT1RFOiB0aGlzIHdpbGwgbXV0YXRlIGBzb3VyY2VzYC5cbmZ1bmN0aW9uIGFkYXB0U291cmNlcyhzb3VyY2VzKSB7XG4gICAgZm9yICh2YXIgbmFtZV8zIGluIHNvdXJjZXMpIHtcbiAgICAgICAgaWYgKHNvdXJjZXMuaGFzT3duUHJvcGVydHkobmFtZV8zKSAmJlxuICAgICAgICAgICAgc291cmNlc1tuYW1lXzNdICYmXG4gICAgICAgICAgICB0eXBlb2Ygc291cmNlc1tuYW1lXzNdLnNoYW1lZnVsbHlTZW5kTmV4dCA9PT1cbiAgICAgICAgICAgICAgICAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBzb3VyY2VzW25hbWVfM10gPSBhZGFwdF8xLmFkYXB0KHNvdXJjZXNbbmFtZV8zXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNvdXJjZXM7XG59XG5leHBvcnRzLmFkYXB0U291cmNlcyA9IGFkYXB0U291cmNlcztcbmZ1bmN0aW9uIHJlcGxpY2F0ZU1hbnkoc2lua3MsIHNpbmtQcm94aWVzKSB7XG4gICAgdmFyIHNpbmtOYW1lcyA9IE9iamVjdC5rZXlzKHNpbmtzKS5maWx0ZXIoZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuICEhc2lua1Byb3hpZXNbbmFtZV07IH0pO1xuICAgIHZhciBidWZmZXJzID0ge307XG4gICAgdmFyIHJlcGxpY2F0b3JzID0ge307XG4gICAgc2lua05hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgYnVmZmVyc1tuYW1lXSA9IHsgX246IFtdLCBfZTogW10gfTtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0gPSB7XG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbiAoeCkgeyByZXR1cm4gYnVmZmVyc1tuYW1lXS5fbi5wdXNoKHgpOyB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChlcnIpIHsgcmV0dXJuIGJ1ZmZlcnNbbmFtZV0uX2UucHVzaChlcnIpOyB9LFxuICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgfTtcbiAgICB9KTtcbiAgICB2YXIgc3Vic2NyaXB0aW9ucyA9IHNpbmtOYW1lcy5tYXAoZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW25hbWVdKS5zdWJzY3JpYmUocmVwbGljYXRvcnNbbmFtZV0pO1xuICAgIH0pO1xuICAgIHNpbmtOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHZhciBsaXN0ZW5lciA9IHNpbmtQcm94aWVzW25hbWVdO1xuICAgICAgICB2YXIgbmV4dCA9IGZ1bmN0aW9uICh4KSB7XG4gICAgICAgICAgICBzY2hlZHVsZU1pY3JvdGFzayhmdW5jdGlvbiAoKSB7IHJldHVybiBsaXN0ZW5lci5fbih4KTsgfSk7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBlcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIHNjaGVkdWxlTWljcm90YXNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAoY29uc29sZS5lcnJvciB8fCBjb25zb2xlLmxvZykoZXJyKTtcbiAgICAgICAgICAgICAgICBsaXN0ZW5lci5fZShlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0uX24uZm9yRWFjaChuZXh0KTtcbiAgICAgICAgYnVmZmVyc1tuYW1lXS5fZS5mb3JFYWNoKGVycm9yKTtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0ubmV4dCA9IG5leHQ7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLmVycm9yID0gZXJyb3I7XG4gICAgICAgIC8vIGJlY2F1c2Ugc2luay5zdWJzY3JpYmUocmVwbGljYXRvcikgaGFkIG11dGF0ZWQgcmVwbGljYXRvciB0byBhZGRcbiAgICAgICAgLy8gX24sIF9lLCBfYywgd2UgbXVzdCBhbHNvIHVwZGF0ZSB0aGVzZTpcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uX24gPSBuZXh0O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5fZSA9IGVycm9yO1xuICAgIH0pO1xuICAgIGJ1ZmZlcnMgPSBudWxsOyAvLyBmcmVlIHVwIGZvciBHQ1xuICAgIHJldHVybiBmdW5jdGlvbiBkaXNwb3NlUmVwbGljYXRpb24oKSB7XG4gICAgICAgIHN1YnNjcmlwdGlvbnMuZm9yRWFjaChmdW5jdGlvbiAocykgeyByZXR1cm4gcy51bnN1YnNjcmliZSgpOyB9KTtcbiAgICB9O1xufVxuZXhwb3J0cy5yZXBsaWNhdGVNYW55ID0gcmVwbGljYXRlTWFueTtcbmZ1bmN0aW9uIGRpc3Bvc2VTaW5rUHJveGllcyhzaW5rUHJveGllcykge1xuICAgIE9iamVjdC5rZXlzKHNpbmtQcm94aWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBzaW5rUHJveGllc1tuYW1lXS5fYygpOyB9KTtcbn1cbmV4cG9ydHMuZGlzcG9zZVNpbmtQcm94aWVzID0gZGlzcG9zZVNpbmtQcm94aWVzO1xuZnVuY3Rpb24gZGlzcG9zZVNvdXJjZXMoc291cmNlcykge1xuICAgIGZvciAodmFyIGsgaW4gc291cmNlcykge1xuICAgICAgICBpZiAoc291cmNlcy5oYXNPd25Qcm9wZXJ0eShrKSAmJlxuICAgICAgICAgICAgc291cmNlc1trXSAmJlxuICAgICAgICAgICAgc291cmNlc1trXS5kaXNwb3NlKSB7XG4gICAgICAgICAgICBzb3VyY2VzW2tdLmRpc3Bvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuZGlzcG9zZVNvdXJjZXMgPSBkaXNwb3NlU291cmNlcztcbmZ1bmN0aW9uIGlzT2JqZWN0RW1wdHkob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwO1xufVxuZXhwb3J0cy5pc09iamVjdEVtcHR5ID0gaXNPYmplY3RFbXB0eTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWludGVybmFscy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfTtcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeHN0cmVhbV8xID0gcmVxdWlyZShcInhzdHJlYW1cIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCJAY3ljbGUvcnVuL2xpYi9hZGFwdFwiKTtcbnZhciBpc29sYXRlXzEgPSByZXF1aXJlKFwiQGN5Y2xlL2lzb2xhdGVcIik7XG52YXIgcGlja01lcmdlXzEgPSByZXF1aXJlKFwiLi9waWNrTWVyZ2VcIik7XG52YXIgcGlja0NvbWJpbmVfMSA9IHJlcXVpcmUoXCIuL3BpY2tDb21iaW5lXCIpO1xuLyoqXG4gKiBBbiBvYmplY3QgcmVwcmVzZW50aW5nIGFsbCBpbnN0YW5jZXMgaW4gYSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudHMuIEhhcyB0aGVcbiAqIG1ldGhvZHMgcGlja0NvbWJpbmUgYW5kIHBpY2tNZXJnZSB0byBnZXQgdGhlIGNvbWJpbmVkIHNpbmtzIG9mIGFsbCBpbnN0YW5jZXMuXG4gKi9cbnZhciBJbnN0YW5jZXMgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gSW5zdGFuY2VzKGluc3RhbmNlcyQpIHtcbiAgICAgICAgdGhpcy5faW5zdGFuY2VzJCA9IGluc3RhbmNlcyQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIExpa2UgYG1lcmdlYCBpbiB4c3RyZWFtLCB0aGlzIG9wZXJhdG9yIGJsZW5kcyBtdWx0aXBsZSBzdHJlYW1zIHRvZ2V0aGVyLCBidXRcbiAgICAgKiBwaWNrcyB0aG9zZSBzdHJlYW1zIGZyb20gYSBjb2xsZWN0aW9uIG9mIGNvbXBvbmVudCBpbnN0YW5jZXMuXG4gICAgICpcbiAgICAgKiBVc2UgdGhlIGBzZWxlY3RvcmAgc3RyaW5nIHRvIHBpY2sgYSBzdHJlYW0gZnJvbSB0aGUgc2lua3Mgb2JqZWN0IG9mIGVhY2hcbiAgICAgKiBjb21wb25lbnQgaW5zdGFuY2UsIHRoZW4gcGlja01lcmdlIHdpbGwgbWVyZ2UgYWxsIHRob3NlIHBpY2tlZCBzdHJlYW1zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIGEgbmFtZSBvZiBhIGNoYW5uZWwgaW4gYSBzaW5rcyBvYmplY3QgYmVsb25naW5nIHRvXG4gICAgICogZWFjaCBjb21wb25lbnQgaW4gdGhlIGNvbGxlY3Rpb24gb2YgY29tcG9uZW50cy5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYW4gb3BlcmF0b3IgdG8gYmUgdXNlZCB3aXRoIHhzdHJlYW0ncyBgY29tcG9zZWAgbWV0aG9kLlxuICAgICAqL1xuICAgIEluc3RhbmNlcy5wcm90b3R5cGUucGlja01lcmdlID0gZnVuY3Rpb24gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KHRoaXMuX2luc3RhbmNlcyQuY29tcG9zZShwaWNrTWVyZ2VfMS5waWNrTWVyZ2Uoc2VsZWN0b3IpKSk7XG4gICAgfTtcbiAgICAvKipcbiAgICAgKiBMaWtlIGBjb21iaW5lYCBpbiB4c3RyZWFtLCB0aGlzIG9wZXJhdG9yIGNvbWJpbmVzIG11bHRpcGxlIHN0cmVhbXMgdG9nZXRoZXIsXG4gICAgICogYnV0IHBpY2tzIHRob3NlIHN0cmVhbXMgZnJvbSBhIGNvbGxlY3Rpb24gb2YgY29tcG9uZW50IGluc3RhbmNlcy5cbiAgICAgKlxuICAgICAqIFVzZSB0aGUgYHNlbGVjdG9yYCBzdHJpbmcgdG8gcGljayBhIHN0cmVhbSBmcm9tIHRoZSBzaW5rcyBvYmplY3Qgb2YgZWFjaFxuICAgICAqIGNvbXBvbmVudCBpbnN0YW5jZSwgdGhlbiBwaWNrQ29tYmluZSB3aWxsIGNvbWJpbmUgYWxsIHRob3NlIHBpY2tlZCBzdHJlYW1zLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHNlbGVjdG9yIGEgbmFtZSBvZiBhIGNoYW5uZWwgaW4gYSBzaW5rcyBvYmplY3QgYmVsb25naW5nIHRvXG4gICAgICogZWFjaCBjb21wb25lbnQgaW4gdGhlIGNvbGxlY3Rpb24gb2YgY29tcG9uZW50cy5cbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gYW4gb3BlcmF0b3IgdG8gYmUgdXNlZCB3aXRoIHhzdHJlYW0ncyBgY29tcG9zZWAgbWV0aG9kLlxuICAgICAqL1xuICAgIEluc3RhbmNlcy5wcm90b3R5cGUucGlja0NvbWJpbmUgPSBmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIGFkYXB0XzEuYWRhcHQodGhpcy5faW5zdGFuY2VzJC5jb21wb3NlKHBpY2tDb21iaW5lXzEucGlja0NvbWJpbmUoc2VsZWN0b3IpKSk7XG4gICAgfTtcbiAgICByZXR1cm4gSW5zdGFuY2VzO1xufSgpKTtcbmV4cG9ydHMuSW5zdGFuY2VzID0gSW5zdGFuY2VzO1xuZnVuY3Rpb24gZGVmYXVsdEl0ZW1TY29wZShrZXkpIHtcbiAgICByZXR1cm4geyAnKic6IG51bGwgfTtcbn1cbmZ1bmN0aW9uIGluc3RhbmNlTGVucyhpdGVtS2V5LCBrZXkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGFyci5sZW5ndGg7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFwiXCIgKyBpdGVtS2V5KGFycltpXSwgaSkgPT09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFycltpXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBzZXQ6IGZ1bmN0aW9uIChhcnIsIGl0ZW0pIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYXJyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBbaXRlbV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlb2YgaXRlbSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyLmZpbHRlcihmdW5jdGlvbiAocywgaSkgeyByZXR1cm4gXCJcIiArIGl0ZW1LZXkocywgaSkgIT09IGtleTsgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJyLm1hcChmdW5jdGlvbiAocywgaSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoXCJcIiArIGl0ZW1LZXkocywgaSkgPT09IGtleSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG59XG52YXIgaWRlbnRpdHlMZW5zID0ge1xuICAgIGdldDogZnVuY3Rpb24gKG91dGVyKSB7IHJldHVybiBvdXRlcjsgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uIChvdXRlciwgaW5uZXIpIHsgcmV0dXJuIGlubmVyOyB9LFxufTtcbmZ1bmN0aW9uIG1ha2VDb2xsZWN0aW9uKG9wdHMpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gY29sbGVjdGlvbkNvbXBvbmVudChzb3VyY2VzKSB7XG4gICAgICAgIHZhciBuYW1lID0gb3B0cy5jaGFubmVsIHx8ICdzdGF0ZSc7XG4gICAgICAgIHZhciBpdGVtS2V5ID0gb3B0cy5pdGVtS2V5O1xuICAgICAgICB2YXIgaXRlbVNjb3BlID0gb3B0cy5pdGVtU2NvcGUgfHwgZGVmYXVsdEl0ZW1TY29wZTtcbiAgICAgICAgdmFyIGl0ZW1Db21wID0gb3B0cy5pdGVtO1xuICAgICAgICB2YXIgc3RhdGUkID0geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc291cmNlc1tuYW1lXS5zdHJlYW0pO1xuICAgICAgICB2YXIgaW5zdGFuY2VzJCA9IHN0YXRlJC5mb2xkKGZ1bmN0aW9uIChhY2MsIG5leHRTdGF0ZSkge1xuICAgICAgICAgICAgdmFyIF9hLCBfYiwgX2MsIF9kO1xuICAgICAgICAgICAgdmFyIGRpY3QgPSBhY2MuZGljdDtcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG5leHRTdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV4dEluc3RBcnJheSA9IEFycmF5KG5leHRTdGF0ZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHZhciBuZXh0S2V5c18xID0gbmV3IFNldCgpO1xuICAgICAgICAgICAgICAgIC8vIGFkZFxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gbmV4dFN0YXRlLmxlbmd0aDsgaSA8IG47ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gXCJcIiArIChpdGVtS2V5ID8gaXRlbUtleShuZXh0U3RhdGVbaV0sIGkpIDogaSk7XG4gICAgICAgICAgICAgICAgICAgIG5leHRLZXlzXzEuYWRkKGtleSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghZGljdC5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0YXRlU2NvcGUgPSBpdGVtS2V5ID8gaW5zdGFuY2VMZW5zKGl0ZW1LZXksIGtleSkgOiBcIlwiICsgaTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvdGhlclNjb3BlcyA9IGl0ZW1TY29wZShrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHNjb3BlcyA9IHR5cGVvZiBvdGhlclNjb3BlcyA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IChfYSA9IHsgJyonOiBvdGhlclNjb3BlcyB9LCBfYVtuYW1lXSA9IHN0YXRlU2NvcGUsIF9hKSA6IF9fYXNzaWduKHt9LCBvdGhlclNjb3BlcywgKF9iID0ge30sIF9iW25hbWVdID0gc3RhdGVTY29wZSwgX2IpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzaW5rcyA9IGlzb2xhdGVfMS5kZWZhdWx0KGl0ZW1Db21wLCBzY29wZXMpKHNvdXJjZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGljdC5zZXQoa2V5LCBzaW5rcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0SW5zdEFycmF5W2ldID0gc2lua3M7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZXh0SW5zdEFycmF5W2ldID0gZGljdC5nZXQoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXh0SW5zdEFycmF5W2ldLl9rZXkgPSBrZXk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHJlbW92ZVxuICAgICAgICAgICAgICAgIGRpY3QuZm9yRWFjaChmdW5jdGlvbiAoXywga2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghbmV4dEtleXNfMS5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGljdC5kZWxldGUoa2V5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG5leHRLZXlzXzEuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBkaWN0OiBkaWN0LCBhcnI6IG5leHRJbnN0QXJyYXkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGRpY3QuY2xlYXIoKTtcbiAgICAgICAgICAgICAgICB2YXIga2V5ID0gXCJcIiArIChpdGVtS2V5ID8gaXRlbUtleShuZXh0U3RhdGUsIDApIDogJ3RoaXMnKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdGVTY29wZSA9IGlkZW50aXR5TGVucztcbiAgICAgICAgICAgICAgICB2YXIgb3RoZXJTY29wZXMgPSBpdGVtU2NvcGUoa2V5KTtcbiAgICAgICAgICAgICAgICB2YXIgc2NvcGVzID0gdHlwZW9mIG90aGVyU2NvcGVzID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICA/IChfYyA9IHsgJyonOiBvdGhlclNjb3BlcyB9LCBfY1tuYW1lXSA9IHN0YXRlU2NvcGUsIF9jKSA6IF9fYXNzaWduKHt9LCBvdGhlclNjb3BlcywgKF9kID0ge30sIF9kW25hbWVdID0gc3RhdGVTY29wZSwgX2QpKTtcbiAgICAgICAgICAgICAgICB2YXIgc2lua3MgPSBpc29sYXRlXzEuZGVmYXVsdChpdGVtQ29tcCwgc2NvcGVzKShzb3VyY2VzKTtcbiAgICAgICAgICAgICAgICBkaWN0LnNldChrZXksIHNpbmtzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBkaWN0OiBkaWN0LCBhcnI6IFtzaW5rc10gfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgeyBkaWN0OiBuZXcgTWFwKCksIGFycjogW10gfSk7XG4gICAgICAgIHJldHVybiBvcHRzLmNvbGxlY3RTaW5rcyhuZXcgSW5zdGFuY2VzKGluc3RhbmNlcyQpKTtcbiAgICB9O1xufVxuZXhwb3J0cy5tYWtlQ29sbGVjdGlvbiA9IG1ha2VDb2xsZWN0aW9uO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Q29sbGVjdGlvbi5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2Fzc2lnbiA9ICh0aGlzICYmIHRoaXMuX19hc3NpZ24pIHx8IGZ1bmN0aW9uICgpIHtcbiAgICBfX2Fzc2lnbiA9IE9iamVjdC5hc3NpZ24gfHwgZnVuY3Rpb24odCkge1xuICAgICAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIHMpIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwocywgcCkpXG4gICAgICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHQ7XG4gICAgfTtcbiAgICByZXR1cm4gX19hc3NpZ24uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgZHJvcFJlcGVhdHNfMSA9IHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2Ryb3BSZXBlYXRzXCIpO1xudmFyIGFkYXB0XzEgPSByZXF1aXJlKFwiQGN5Y2xlL3J1bi9saWIvYWRhcHRcIik7XG5mdW5jdGlvbiB1cGRhdGVBcnJheUVudHJ5KGFycmF5LCBzY29wZSwgbmV3VmFsKSB7XG4gICAgaWYgKG5ld1ZhbCA9PT0gYXJyYXlbc2NvcGVdKSB7XG4gICAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG4gICAgdmFyIGluZGV4ID0gcGFyc2VJbnQoc2NvcGUpO1xuICAgIGlmICh0eXBlb2YgbmV3VmFsID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gYXJyYXkuZmlsdGVyKGZ1bmN0aW9uIChfdmFsLCBpKSB7IHJldHVybiBpICE9PSBpbmRleDsgfSk7XG4gICAgfVxuICAgIHJldHVybiBhcnJheS5tYXAoZnVuY3Rpb24gKHZhbCwgaSkgeyByZXR1cm4gKGkgPT09IGluZGV4ID8gbmV3VmFsIDogdmFsKTsgfSk7XG59XG5mdW5jdGlvbiBtYWtlR2V0dGVyKHNjb3BlKSB7XG4gICAgaWYgKHR5cGVvZiBzY29wZSA9PT0gJ3N0cmluZycgfHwgdHlwZW9mIHNjb3BlID09PSAnbnVtYmVyJykge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gbGVuc0dldChzdGF0ZSkge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdGF0ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdm9pZCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlW3Njb3BlXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBzY29wZS5nZXQ7XG4gICAgfVxufVxuZnVuY3Rpb24gbWFrZVNldHRlcihzY29wZSkge1xuICAgIGlmICh0eXBlb2Ygc2NvcGUgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzY29wZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIGxlbnNTZXQoc3RhdGUsIGNoaWxkU3RhdGUpIHtcbiAgICAgICAgICAgIHZhciBfYSwgX2I7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXBkYXRlQXJyYXlFbnRyeShzdGF0ZSwgc2NvcGUsIGNoaWxkU3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodHlwZW9mIHN0YXRlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBfYSA9IHt9LCBfYVtzY29wZV0gPSBjaGlsZFN0YXRlLCBfYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBfX2Fzc2lnbih7fSwgc3RhdGUsIChfYiA9IHt9LCBfYltzY29wZV0gPSBjaGlsZFN0YXRlLCBfYikpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNjb3BlLnNldDtcbiAgICB9XG59XG5mdW5jdGlvbiBpc29sYXRlU291cmNlKHNvdXJjZSwgc2NvcGUpIHtcbiAgICByZXR1cm4gc291cmNlLnNlbGVjdChzY29wZSk7XG59XG5leHBvcnRzLmlzb2xhdGVTb3VyY2UgPSBpc29sYXRlU291cmNlO1xuZnVuY3Rpb24gaXNvbGF0ZVNpbmsoaW5uZXJSZWR1Y2VyJCwgc2NvcGUpIHtcbiAgICB2YXIgZ2V0ID0gbWFrZUdldHRlcihzY29wZSk7XG4gICAgdmFyIHNldCA9IG1ha2VTZXR0ZXIoc2NvcGUpO1xuICAgIHJldHVybiBpbm5lclJlZHVjZXIkLm1hcChmdW5jdGlvbiAoaW5uZXJSZWR1Y2VyKSB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiBvdXRlclJlZHVjZXIob3V0ZXIpIHtcbiAgICAgICAgICAgIHZhciBwcmV2SW5uZXIgPSBnZXQob3V0ZXIpO1xuICAgICAgICAgICAgdmFyIG5leHRJbm5lciA9IGlubmVyUmVkdWNlcihwcmV2SW5uZXIpO1xuICAgICAgICAgICAgaWYgKHByZXZJbm5lciA9PT0gbmV4dElubmVyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG91dGVyO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHNldChvdXRlciwgbmV4dElubmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcbn1cbmV4cG9ydHMuaXNvbGF0ZVNpbmsgPSBpc29sYXRlU2luaztcbi8qKlxuICogUmVwcmVzZW50cyBhIHBpZWNlIG9mIGFwcGxpY2F0aW9uIHN0YXRlIGR5bmFtaWNhbGx5IGNoYW5naW5nIG92ZXIgdGltZS5cbiAqL1xudmFyIFN0YXRlU291cmNlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFN0YXRlU291cmNlKHN0cmVhbSwgbmFtZSkge1xuICAgICAgICB0aGlzLmlzb2xhdGVTb3VyY2UgPSBpc29sYXRlU291cmNlO1xuICAgICAgICB0aGlzLmlzb2xhdGVTaW5rID0gaXNvbGF0ZVNpbms7XG4gICAgICAgIHRoaXMuX3N0cmVhbSA9IHN0cmVhbVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gdHlwZW9mIHMgIT09ICd1bmRlZmluZWQnOyB9KVxuICAgICAgICAgICAgLmNvbXBvc2UoZHJvcFJlcGVhdHNfMS5kZWZhdWx0KCkpXG4gICAgICAgICAgICAucmVtZW1iZXIoKTtcbiAgICAgICAgdGhpcy5fbmFtZSA9IG5hbWU7XG4gICAgICAgIHRoaXMuc3RyZWFtID0gYWRhcHRfMS5hZGFwdCh0aGlzLl9zdHJlYW0pO1xuICAgICAgICB0aGlzLl9zdHJlYW0uX2lzQ3ljbGVTb3VyY2UgPSBuYW1lO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZWxlY3RzIGEgcGFydCAob3Igc2NvcGUpIG9mIHRoZSBzdGF0ZSBvYmplY3QgYW5kIHJldHVybnMgYSBuZXcgU3RhdGVTb3VyY2VcbiAgICAgKiBkeW5hbWljYWxseSByZXByZXNlbnRpbmcgdGhhdCBzZWxlY3RlZCBwYXJ0IG9mIHRoZSBzdGF0ZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfG51bWJlcnxsZW5zfSBzY29wZSBhcyBhIHN0cmluZywgdGhpcyBhcmd1bWVudCByZXByZXNlbnRzIHRoZVxuICAgICAqIHByb3BlcnR5IHlvdSB3YW50IHRvIHNlbGVjdCBmcm9tIHRoZSBzdGF0ZSBvYmplY3QuIEFzIGEgbnVtYmVyLCB0aGlzXG4gICAgICogcmVwcmVzZW50cyB0aGUgYXJyYXkgaW5kZXggeW91IHdhbnQgdG8gc2VsZWN0IGZyb20gdGhlIHN0YXRlIGFycmF5LiBBcyBhXG4gICAgICogbGVucyBvYmplY3QgKGFuIG9iamVjdCB3aXRoIGdldCgpIGFuZCBzZXQoKSksIHRoaXMgYXJndW1lbnQgcmVwcmVzZW50cyBhbnlcbiAgICAgKiBjdXN0b20gd2F5IG9mIHNlbGVjdGluZyBzb21ldGhpbmcgZnJvbSB0aGUgc3RhdGUgb2JqZWN0LlxuICAgICAqL1xuICAgIFN0YXRlU291cmNlLnByb3RvdHlwZS5zZWxlY3QgPSBmdW5jdGlvbiAoc2NvcGUpIHtcbiAgICAgICAgdmFyIGdldCA9IG1ha2VHZXR0ZXIoc2NvcGUpO1xuICAgICAgICByZXR1cm4gbmV3IFN0YXRlU291cmNlKHRoaXMuX3N0cmVhbS5tYXAoZ2V0KSwgdGhpcy5fbmFtZSk7XG4gICAgfTtcbiAgICByZXR1cm4gU3RhdGVTb3VyY2U7XG59KCkpO1xuZXhwb3J0cy5TdGF0ZVNvdXJjZSA9IFN0YXRlU291cmNlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9U3RhdGVTb3VyY2UuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgU3RhdGVTb3VyY2VfMSA9IHJlcXVpcmUoXCIuL1N0YXRlU291cmNlXCIpO1xuZXhwb3J0cy5TdGF0ZVNvdXJjZSA9IFN0YXRlU291cmNlXzEuU3RhdGVTb3VyY2U7XG5leHBvcnRzLmlzb2xhdGVTb3VyY2UgPSBTdGF0ZVNvdXJjZV8xLmlzb2xhdGVTb3VyY2U7XG5leHBvcnRzLmlzb2xhdGVTaW5rID0gU3RhdGVTb3VyY2VfMS5pc29sYXRlU2luaztcbnZhciBDb2xsZWN0aW9uXzEgPSByZXF1aXJlKFwiLi9Db2xsZWN0aW9uXCIpO1xuZXhwb3J0cy5JbnN0YW5jZXMgPSBDb2xsZWN0aW9uXzEuSW5zdGFuY2VzO1xuLyoqXG4gKiBHaXZlbiBhIEN5Y2xlLmpzIGNvbXBvbmVudCB0aGF0IGV4cGVjdHMgYSBzdGF0ZSAqc291cmNlKiBhbmQgd2lsbFxuICogb3V0cHV0IGEgcmVkdWNlciAqc2luayosIHRoaXMgZnVuY3Rpb24gc2V0cyB1cCB0aGUgc3RhdGUgbWFuYWdlbWVudFxuICogbWVjaGFuaWNzIHRvIGFjY3VtdWxhdGUgc3RhdGUgb3ZlciB0aW1lIGFuZCBwcm92aWRlIHRoZSBzdGF0ZSBzb3VyY2UuIEl0XG4gKiByZXR1cm5zIGEgQ3ljbGUuanMgY29tcG9uZW50IHdoaWNoIHdyYXBzIHRoZSBjb21wb25lbnQgZ2l2ZW4gYXMgaW5wdXQuXG4gKiBFc3NlbnRpYWxseSwgaXQgaG9va3MgdXAgdGhlIHJlZHVjZXJzIHNpbmsgd2l0aCB0aGUgc3RhdGUgc291cmNlIGFzIGEgY3ljbGUuXG4gKlxuICogT3B0aW9uYWxseSwgeW91IGNhbiBwYXNzIGEgY3VzdG9tIG5hbWUgZm9yIHRoZSBzdGF0ZSBjaGFubmVsLiBCeSBkZWZhdWx0LFxuICogdGhlIG5hbWUgaXMgJ3N0YXRlJyBpbiBzb3VyY2VzIGFuZCBzaW5rcywgYnV0IHlvdSBjYW4gY2hhbmdlIHRoYXQgdG8gYmVcbiAqIHdoYXRldmVyIHN0cmluZyB5b3Ugd2lzaC5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBhbiBvcHRpb25hbCBzdHJpbmcgZm9yIHRoZSBjdXN0b20gbmFtZSBnaXZlbiB0byB0aGVcbiAqIHN0YXRlIGNoYW5uZWwuIEJ5IGRlZmF1bHQsIGl0IGlzIHRoZSBzdHJpbmcgJ3N0YXRlJy5cbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBhIGNvbXBvbmVudCB0aGF0IHdyYXBzIHRoZSBtYWluIGZ1bmN0aW9uIGdpdmVuIGFzIGlucHV0LFxuICogYWRkaW5nIHN0YXRlIGFjY3VtdWxhdGlvbiBsb2dpYyB0byBpdC5cbiAqIEBmdW5jdGlvbiB3aXRoU3RhdGVcbiAqL1xudmFyIHdpdGhTdGF0ZV8xID0gcmVxdWlyZShcIi4vd2l0aFN0YXRlXCIpO1xuZXhwb3J0cy53aXRoU3RhdGUgPSB3aXRoU3RhdGVfMS53aXRoU3RhdGU7XG4vKipcbiAqIFJldHVybnMgYSBDeWNsZS5qcyBjb21wb25lbnQgKGEgZnVuY3Rpb24gZnJvbSBzb3VyY2VzIHRvIHNpbmtzKSB0aGF0XG4gKiByZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiBtYW55IGl0ZW0gY29tcG9uZW50cyBvZiB0aGUgc2FtZSB0eXBlLlxuICpcbiAqIFRha2VzIGFuIFwib3B0aW9uc1wiIG9iamVjdCBhcyBpbnB1dCwgd2l0aCB0aGUgcmVxdWlyZWQgcHJvcGVydGllczpcbiAqIC0gaXRlbVxuICogLSBjb2xsZWN0U2lua3NcbiAqXG4gKiBBbmQgdGhlIG9wdGlvbmFsIHByb3BlcnRpZXM6XG4gKiAtIGl0ZW1LZXlcbiAqIC0gaXRlbVNjb3BlXG4gKiAtIGNoYW5uZWxcbiAqXG4gKiBUaGUgcmV0dXJuZWQgY29tcG9uZW50LCB0aGUgQ29sbGVjdGlvbiwgd2lsbCB1c2UgdGhlIHN0YXRlIHNvdXJjZSBwYXNzZWQgdG9cbiAqIGl0ICh0aHJvdWdoIHNvdXJjZXMpIHRvIGd1aWRlIHRoZSBkeW5hbWljIGdyb3dpbmcvc2hyaW5raW5nIG9mIGluc3RhbmNlcyBvZlxuICogdGhlIGl0ZW0gY29tcG9uZW50LlxuICpcbiAqIFR5cGljYWxseSB0aGUgc3RhdGUgc291cmNlIHNob3VsZCBlbWl0IGFycmF5cywgd2hlcmUgZWFjaCBlbnRyeSBpbiB0aGUgYXJyYXlcbiAqIGlzIGFuIG9iamVjdCBob2xkaW5nIHRoZSBzdGF0ZSBmb3IgZWFjaCBpdGVtIGNvbXBvbmVudC4gV2hlbiB0aGUgc3RhdGUgYXJyYXlcbiAqIGdyb3dzLCB0aGUgY29sbGVjdGlvbiB3aWxsIGF1dG9tYXRpY2FsbHkgaW5zdGFudGlhdGUgYSBuZXcgaXRlbSBjb21wb25lbnQuXG4gKiBTaW1pbGFybHksIHdoZW4gdGhlIHN0YXRlIGFycmF5IGdldHMgc21hbGxlciwgdGhlIGNvbGxlY3Rpb24gd2lsbCBoYW5kbGVcbiAqIHJlbW92YWwgb2YgdGhlIGNvcnJlc3BvbmRpbmcgaXRlbSBpbnN0YW5jZS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIGEgY29uZmlndXJhdGlvbiBvYmplY3Qgd2l0aCB0aGUgZm9sbG93aW5nIGZpZWxkczpcbiAqICAgLSBgaXRlbTogZnVuY3Rpb25gLCBhIEN5Y2xlLmpzIGNvbXBvbmVudCBmb3IgZWFjaCBpdGVtIGluIHRoZSBjb2xsZWN0aW9uLlxuICogICAtIGBjb2xsZWN0U2lua3M6IGZ1bmN0aW9uYCwgYSBmdW5jdGlvbiB0aGF0IGRlc2NyaWJlcyBob3cgdG8gY29sbGVjdCB0aGVcbiAqICAgICAgc2lua3MgZnJvbSBhbGwgaXRlbSBpbnN0YW5jZXMuXG4gKiAgIC0gYGl0ZW1LZXk6IGZ1bmN0aW9uYCwgYSBmdW5jdGlvbiBmcm9tIGl0ZW0gc3RhdGUgdG8gaXRlbSAodW5pcXVlKSBrZXkuXG4gKiAgIC0gYGl0ZW1TY29wZTogZnVuY3Rpb25gLCBhIGZ1bmN0aW9uIGZyb20gaXRlbSBrZXkgdG8gaXNvbGF0aW9uIHNjb3BlLlxuICogICAtIGBjaGFubmVsOiBzdHJpbmdgLCBjaG9vc2UgdGhlIGNoYW5uZWwgbmFtZSB3aGVyZSB0aGUgU3RhdGVTb3VyY2UgZXhpc3RzLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgY29tcG9uZW50IHRoYXQgZGlzcGxheXMgbWFueSBpbnN0YW5jZXMgb2YgdGhlIGl0ZW1cbiAqIGNvbXBvbmVudC5cbiAqIEBmdW5jdGlvbiBtYWtlQ29sbGVjdGlvblxuICovXG52YXIgQ29sbGVjdGlvbl8yID0gcmVxdWlyZShcIi4vQ29sbGVjdGlvblwiKTtcbmV4cG9ydHMubWFrZUNvbGxlY3Rpb24gPSBDb2xsZWN0aW9uXzIubWFrZUNvbGxlY3Rpb247XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBQaWNrQ29tYmluZUxpc3RlbmVyID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tDb21iaW5lTGlzdGVuZXIoa2V5LCBvdXQsIHAsIGlucykge1xuICAgICAgICB0aGlzLmtleSA9IGtleTtcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMucCA9IHA7XG4gICAgICAgIHRoaXMudmFsID0geHN0cmVhbV8xLk5PO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICB9XG4gICAgUGlja0NvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX24gPSBmdW5jdGlvbiAodCkge1xuICAgICAgICB2YXIgcCA9IHRoaXMucCwgb3V0ID0gdGhpcy5vdXQ7XG4gICAgICAgIHRoaXMudmFsID0gdDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucC51cCgpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX2UgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fZShlcnIpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmVMaXN0ZW5lci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgcmV0dXJuIFBpY2tDb21iaW5lTGlzdGVuZXI7XG59KCkpO1xudmFyIFBpY2tDb21iaW5lID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFBpY2tDb21iaW5lKHNlbCwgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdjb21iaW5lJztcbiAgICAgICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgICAgIHRoaXMuc2VsID0gc2VsO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH1cbiAgICBQaWNrQ29tYmluZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fc3RvcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICAgICAgdmFyIGlscyA9IHRoaXMuaWxzO1xuICAgICAgICBpbHMuZm9yRWFjaChmdW5jdGlvbiAoaWwpIHtcbiAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICBpbC5vdXQgPSBudWxsO1xuICAgICAgICAgICAgaWwudmFsID0gbnVsbDtcbiAgICAgICAgfSk7XG4gICAgICAgIGlscy5jbGVhcigpO1xuICAgICAgICB0aGlzLm91dCA9IG51bGw7XG4gICAgICAgIHRoaXMuaWxzID0gbmV3IE1hcCgpO1xuICAgICAgICB0aGlzLmluc3QgPSBudWxsO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLnVwID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXJyID0gdGhpcy5pbnN0LmFycjtcbiAgICAgICAgdmFyIG4gPSBhcnIubGVuZ3RoO1xuICAgICAgICB2YXIgaWxzID0gdGhpcy5pbHM7XG4gICAgICAgIHZhciBvdXRBcnIgPSBBcnJheShuKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzaW5rcyA9IGFycltpXTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBzaW5rcy5fa2V5O1xuICAgICAgICAgICAgaWYgKCFpbHMuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdmFsID0gaWxzLmdldChrZXkpLnZhbDtcbiAgICAgICAgICAgIGlmICh2YWwgPT09IHhzdHJlYW1fMS5OTykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dEFycltpXSA9IHZhbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm91dC5fbihvdXRBcnIpO1xuICAgIH07XG4gICAgUGlja0NvbWJpbmUucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKGluc3QpIHtcbiAgICAgICAgdGhpcy5pbnN0ID0gaW5zdDtcbiAgICAgICAgdmFyIGFyclNpbmtzID0gaW5zdC5hcnI7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICB2YXIgc2VsID0gdGhpcy5zZWw7XG4gICAgICAgIHZhciBkaWN0ID0gaW5zdC5kaWN0O1xuICAgICAgICB2YXIgbiA9IGFyclNpbmtzLmxlbmd0aDtcbiAgICAgICAgLy8gcmVtb3ZlXG4gICAgICAgIHZhciByZW1vdmVkID0gZmFsc2U7XG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCwga2V5KSB7XG4gICAgICAgICAgICBpZiAoIWRpY3QuaGFzKGtleSkpIHtcbiAgICAgICAgICAgICAgICBpbC5pbnMuX3JlbW92ZShpbCk7XG4gICAgICAgICAgICAgICAgaWwuaW5zID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbC5vdXQgPSBudWxsO1xuICAgICAgICAgICAgICAgIGlsLnZhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWxzLmRlbGV0ZShrZXkpO1xuICAgICAgICAgICAgICAgIHJlbW92ZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKG4gPT09IDApIHtcbiAgICAgICAgICAgIG91dC5fbihbXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gYWRkXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICB2YXIgc2lua3MgPSBhcnJTaW5rc1tpXTtcbiAgICAgICAgICAgIHZhciBrZXkgPSBzaW5rcy5fa2V5O1xuICAgICAgICAgICAgaWYgKCFzaW5rc1tzZWxdKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdwaWNrQ29tYmluZSBmb3VuZCBhbiB1bmRlZmluZWQgY2hpbGQgc2luayBzdHJlYW0nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBzaW5rID0geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2lua3Nbc2VsXSk7XG4gICAgICAgICAgICBpZiAoIWlscy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlscy5zZXQoa2V5LCBuZXcgUGlja0NvbWJpbmVMaXN0ZW5lcihrZXksIG91dCwgdGhpcywgc2luaykpO1xuICAgICAgICAgICAgICAgIHNpbmsuX2FkZChpbHMuZ2V0KGtleSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgICB0aGlzLnVwKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fZShlKTtcbiAgICB9O1xuICAgIFBpY2tDb21iaW5lLnByb3RvdHlwZS5fYyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9jKCk7XG4gICAgfTtcbiAgICByZXR1cm4gUGlja0NvbWJpbmU7XG59KCkpO1xuZnVuY3Rpb24gcGlja0NvbWJpbmUoc2VsZWN0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gcGlja0NvbWJpbmVPcGVyYXRvcihpbnN0JCkge1xuICAgICAgICByZXR1cm4gbmV3IHhzdHJlYW1fMS5TdHJlYW0obmV3IFBpY2tDb21iaW5lKHNlbGVjdG9yLCBpbnN0JCkpO1xuICAgIH07XG59XG5leHBvcnRzLnBpY2tDb21iaW5lID0gcGlja0NvbWJpbmU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1waWNrQ29tYmluZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBQaWNrTWVyZ2VMaXN0ZW5lciA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBQaWNrTWVyZ2VMaXN0ZW5lcihvdXQsIHAsIGlucykge1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgICAgIHRoaXMucCA9IHA7XG4gICAgfVxuICAgIFBpY2tNZXJnZUxpc3RlbmVyLnByb3RvdHlwZS5fbiA9IGZ1bmN0aW9uICh0KSB7XG4gICAgICAgIHZhciBwID0gdGhpcy5wLCBvdXQgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKG91dCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIG91dC5fbih0KTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZUxpc3RlbmVyLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICBpZiAob3V0ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3V0Ll9lKGVycik7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2VMaXN0ZW5lci5wcm90b3R5cGUuX2MgPSBmdW5jdGlvbiAoKSB7IH07XG4gICAgcmV0dXJuIFBpY2tNZXJnZUxpc3RlbmVyO1xufSgpKTtcbnZhciBQaWNrTWVyZ2UgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUGlja01lcmdlKHNlbCwgaW5zKSB7XG4gICAgICAgIHRoaXMudHlwZSA9ICdwaWNrTWVyZ2UnO1xuICAgICAgICB0aGlzLmlucyA9IGlucztcbiAgICAgICAgdGhpcy5vdXQgPSBudWxsO1xuICAgICAgICB0aGlzLnNlbCA9IHNlbDtcbiAgICAgICAgdGhpcy5pbHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5zdCA9IG51bGw7XG4gICAgfVxuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX3N0YXJ0ID0gZnVuY3Rpb24gKG91dCkge1xuICAgICAgICB0aGlzLm91dCA9IG91dDtcbiAgICAgICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgICB9O1xuICAgIFBpY2tNZXJnZS5wcm90b3R5cGUuX3N0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgaWxzLmZvckVhY2goZnVuY3Rpb24gKGlsLCBrZXkpIHtcbiAgICAgICAgICAgIGlsLmlucy5fcmVtb3ZlKGlsKTtcbiAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICBpbC5vdXQgPSBudWxsO1xuICAgICAgICAgICAgaWxzLmRlbGV0ZShrZXkpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWxzLmNsZWFyKCk7XG4gICAgICAgIHRoaXMub3V0ID0gbnVsbDtcbiAgICAgICAgdGhpcy5pbHMgPSBuZXcgTWFwKCk7XG4gICAgICAgIHRoaXMuaW5zdCA9IG51bGw7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9uID0gZnVuY3Rpb24gKGluc3QpIHtcbiAgICAgICAgdGhpcy5pbnN0ID0gaW5zdDtcbiAgICAgICAgdmFyIGFyclNpbmtzID0gaW5zdC5hcnI7XG4gICAgICAgIHZhciBpbHMgPSB0aGlzLmlscztcbiAgICAgICAgdmFyIG91dCA9IHRoaXMub3V0O1xuICAgICAgICB2YXIgc2VsID0gdGhpcy5zZWw7XG4gICAgICAgIHZhciBuID0gYXJyU2lua3MubGVuZ3RoO1xuICAgICAgICAvLyBhZGRcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgIHZhciBzaW5rcyA9IGFyclNpbmtzW2ldO1xuICAgICAgICAgICAgdmFyIGtleSA9IHNpbmtzLl9rZXk7XG4gICAgICAgICAgICB2YXIgc2luayA9IHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW3NlbF0gfHwgeHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKSk7XG4gICAgICAgICAgICBpZiAoIWlscy5oYXMoa2V5KSkge1xuICAgICAgICAgICAgICAgIGlscy5zZXQoa2V5LCBuZXcgUGlja01lcmdlTGlzdGVuZXIob3V0LCB0aGlzLCBzaW5rKSk7XG4gICAgICAgICAgICAgICAgc2luay5fYWRkKGlscy5nZXQoa2V5KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gcmVtb3ZlXG4gICAgICAgIGlscy5mb3JFYWNoKGZ1bmN0aW9uIChpbCwga2V5KSB7XG4gICAgICAgICAgICBpZiAoIWluc3QuZGljdC5oYXMoa2V5KSB8fCAhaW5zdC5kaWN0LmdldChrZXkpKSB7XG4gICAgICAgICAgICAgICAgaWwuaW5zLl9yZW1vdmUoaWwpO1xuICAgICAgICAgICAgICAgIGlsLmlucyA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWwub3V0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpbHMuZGVsZXRlKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgUGlja01lcmdlLnByb3RvdHlwZS5fZSA9IGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgdmFyIHUgPSB0aGlzLm91dDtcbiAgICAgICAgaWYgKHUgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB1Ll9lKGVycik7XG4gICAgfTtcbiAgICBQaWNrTWVyZ2UucHJvdG90eXBlLl9jID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdSA9IHRoaXMub3V0O1xuICAgICAgICBpZiAodSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHUuX2MoKTtcbiAgICB9O1xuICAgIHJldHVybiBQaWNrTWVyZ2U7XG59KCkpO1xuZnVuY3Rpb24gcGlja01lcmdlKHNlbGVjdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHBpY2tNZXJnZU9wZXJhdG9yKGluc3QkKSB7XG4gICAgICAgIHJldHVybiBuZXcgeHN0cmVhbV8xLlN0cmVhbShuZXcgUGlja01lcmdlKHNlbGVjdG9yLCBpbnN0JCkpO1xuICAgIH07XG59XG5leHBvcnRzLnBpY2tNZXJnZSA9IHBpY2tNZXJnZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBpY2tNZXJnZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBjb25jYXRfMSA9IHJlcXVpcmUoXCJ4c3RyZWFtL2V4dHJhL2NvbmNhdFwiKTtcbnZhciBTdGF0ZVNvdXJjZV8xID0gcmVxdWlyZShcIi4vU3RhdGVTb3VyY2VcIik7XG52YXIgcXVpY2t0YXNrXzEgPSByZXF1aXJlKFwicXVpY2t0YXNrXCIpO1xudmFyIHNjaGVkdWxlID0gcXVpY2t0YXNrXzEuZGVmYXVsdCgpO1xuZnVuY3Rpb24gd2l0aFN0YXRlKG1haW4sIG5hbWUpIHtcbiAgICBpZiAobmFtZSA9PT0gdm9pZCAwKSB7IG5hbWUgPSAnc3RhdGUnOyB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG1haW5XaXRoU3RhdGUoc291cmNlcykge1xuICAgICAgICB2YXIgcmVkdWNlck1pbWljJCA9IHhzdHJlYW1fMS5kZWZhdWx0LmNyZWF0ZSgpO1xuICAgICAgICB2YXIgc3RhdGUkID0gcmVkdWNlck1pbWljJFxuICAgICAgICAgICAgLmZvbGQoZnVuY3Rpb24gKHN0YXRlLCByZWR1Y2VyKSB7IHJldHVybiByZWR1Y2VyKHN0YXRlKTsgfSwgdm9pZCAwKVxuICAgICAgICAgICAgLmRyb3AoMSk7XG4gICAgICAgIHZhciBpbm5lclNvdXJjZXMgPSBzb3VyY2VzO1xuICAgICAgICBpbm5lclNvdXJjZXNbbmFtZV0gPSBuZXcgU3RhdGVTb3VyY2VfMS5TdGF0ZVNvdXJjZShzdGF0ZSQsIG5hbWUpO1xuICAgICAgICB2YXIgc2lua3MgPSBtYWluKGlubmVyU291cmNlcyk7XG4gICAgICAgIGlmIChzaW5rc1tuYW1lXSkge1xuICAgICAgICAgICAgdmFyIHN0cmVhbSQgPSBjb25jYXRfMS5kZWZhdWx0KHhzdHJlYW1fMS5kZWZhdWx0LmZyb21PYnNlcnZhYmxlKHNpbmtzW25hbWVdKSwgeHN0cmVhbV8xLmRlZmF1bHQubmV2ZXIoKSk7XG4gICAgICAgICAgICBzdHJlYW0kLnN1YnNjcmliZSh7XG4gICAgICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKGkpIHsgcmV0dXJuIHNjaGVkdWxlKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJlZHVjZXJNaW1pYyQuX24oaSk7IH0pOyB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7IHJldHVybiBzY2hlZHVsZShmdW5jdGlvbiAoKSB7IHJldHVybiByZWR1Y2VyTWltaWMkLl9lKGVycik7IH0pOyB9LFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IHJldHVybiBzY2hlZHVsZShmdW5jdGlvbiAoKSB7IHJldHVybiByZWR1Y2VyTWltaWMkLl9jKCk7IH0pOyB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNpbmtzO1xuICAgIH07XG59XG5leHBvcnRzLndpdGhTdGF0ZSA9IHdpdGhTdGF0ZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXdpdGhTdGF0ZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIGdldEdsb2JhbCgpIHtcbiAgICB2YXIgZ2xvYmFsT2JqO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IGdsb2JhbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHRoaXM7XG4gICAgfVxuICAgIGdsb2JhbE9iai5DeWNsZWpzID0gZ2xvYmFsT2JqLkN5Y2xlanMgfHwge307XG4gICAgZ2xvYmFsT2JqID0gZ2xvYmFsT2JqLkN5Y2xlanM7XG4gICAgZ2xvYmFsT2JqLmFkYXB0U3RyZWFtID0gZ2xvYmFsT2JqLmFkYXB0U3RyZWFtIHx8IChmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfSk7XG4gICAgcmV0dXJuIGdsb2JhbE9iajtcbn1cbmZ1bmN0aW9uIHNldEFkYXB0KGYpIHtcbiAgICBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbSA9IGY7XG59XG5leHBvcnRzLnNldEFkYXB0ID0gc2V0QWRhcHQ7XG5mdW5jdGlvbiBhZGFwdChzdHJlYW0pIHtcbiAgICByZXR1cm4gZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0oc3RyZWFtKTtcbn1cbmV4cG9ydHMuYWRhcHQgPSBhZGFwdDtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFkYXB0LmpzLm1hcCIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmZ1bmN0aW9uIG1pY3JvdGFzaygpIHtcbiAgICBpZiAodHlwZW9mIE11dGF0aW9uT2JzZXJ2ZXIgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhciBub2RlXzEgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJyk7XG4gICAgICAgIHZhciBxdWV1ZV8xID0gW107XG4gICAgICAgIHZhciBpXzEgPSAwO1xuICAgICAgICBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aGlsZSAocXVldWVfMS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBxdWV1ZV8xLnNoaWZ0KCkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkub2JzZXJ2ZShub2RlXzEsIHsgY2hhcmFjdGVyRGF0YTogdHJ1ZSB9KTtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChmbikge1xuICAgICAgICAgICAgcXVldWVfMS5wdXNoKGZuKTtcbiAgICAgICAgICAgIG5vZGVfMS5kYXRhID0gaV8xID0gMSAtIGlfMTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHNldEltbWVkaWF0ZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHNldEltbWVkaWF0ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHJldHVybiBwcm9jZXNzLm5leHRUaWNrO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQ7XG4gICAgfVxufVxuZXhwb3J0cy5kZWZhdWx0ID0gbWljcm90YXNrO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoJy4vc2VsZWN0b3JQYXJzZXInKTtcbmZ1bmN0aW9uIGNsYXNzTmFtZUZyb21WTm9kZSh2Tm9kZSkge1xuICAgIHZhciBfYSA9IHNlbGVjdG9yUGFyc2VyXzEuc2VsZWN0b3JQYXJzZXIodk5vZGUpLmNsYXNzTmFtZSwgY24gPSBfYSA9PT0gdm9pZCAwID8gJycgOiBfYTtcbiAgICBpZiAoIXZOb2RlLmRhdGEpIHtcbiAgICAgICAgcmV0dXJuIGNuO1xuICAgIH1cbiAgICB2YXIgX2IgPSB2Tm9kZS5kYXRhLCBkYXRhQ2xhc3MgPSBfYi5jbGFzcywgcHJvcHMgPSBfYi5wcm9wcztcbiAgICBpZiAoZGF0YUNsYXNzKSB7XG4gICAgICAgIHZhciBjID0gT2JqZWN0LmtleXMoZGF0YUNsYXNzKVxuICAgICAgICAgICAgLmZpbHRlcihmdW5jdGlvbiAoY2wpIHsgcmV0dXJuIGRhdGFDbGFzc1tjbF07IH0pO1xuICAgICAgICBjbiArPSBcIiBcIiArIGMuam9pbihcIiBcIik7XG4gICAgfVxuICAgIGlmIChwcm9wcyAmJiBwcm9wcy5jbGFzc05hbWUpIHtcbiAgICAgICAgY24gKz0gXCIgXCIgKyBwcm9wcy5jbGFzc05hbWU7XG4gICAgfVxuICAgIHJldHVybiBjbiAmJiBjbi50cmltKCk7XG59XG5leHBvcnRzLmNsYXNzTmFtZUZyb21WTm9kZSA9IGNsYXNzTmFtZUZyb21WTm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWNsYXNzTmFtZUZyb21WTm9kZS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIGN1cnJ5MihzZWxlY3QpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gc2VsZWN0b3Ioc2VsLCB2Tm9kZSkge1xuICAgICAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNhc2UgMDogcmV0dXJuIHNlbGVjdDtcbiAgICAgICAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uIChfdk5vZGUpIHsgcmV0dXJuIHNlbGVjdChzZWwsIF92Tm9kZSk7IH07XG4gICAgICAgICAgICBkZWZhdWx0OiByZXR1cm4gc2VsZWN0KHNlbCwgdk5vZGUpO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmV4cG9ydHMuY3VycnkyID0gY3VycnkyO1xuO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9Y3VycnkyLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHF1ZXJ5XzEgPSByZXF1aXJlKCcuL3F1ZXJ5Jyk7XG52YXIgcGFyZW50X3N5bWJvbF8xID0gcmVxdWlyZSgnLi9wYXJlbnQtc3ltYm9sJyk7XG5mdW5jdGlvbiBmaW5kTWF0Y2hlcyhjc3NTZWxlY3Rvciwgdk5vZGUpIHtcbiAgICBpZiAoIXZOb2RlKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gICAgdHJhdmVyc2VWTm9kZSh2Tm9kZSwgYWRkUGFyZW50KTsgLy8gYWRkIG1hcHBpbmcgdG8gdGhlIHBhcmVudCBzZWxlY3RvclBhcnNlclxuICAgIHJldHVybiBxdWVyeV8xLnF1ZXJ5U2VsZWN0b3IoY3NzU2VsZWN0b3IsIHZOb2RlKTtcbn1cbmV4cG9ydHMuZmluZE1hdGNoZXMgPSBmaW5kTWF0Y2hlcztcbmZ1bmN0aW9uIHRyYXZlcnNlVk5vZGUodk5vZGUsIGYpIHtcbiAgICBmdW5jdGlvbiByZWN1cnNlKGN1cnJlbnROb2RlLCBpc1BhcmVudCwgcGFyZW50Vk5vZGUpIHtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGN1cnJlbnROb2RlLmNoaWxkcmVuICYmIGN1cnJlbnROb2RlLmNoaWxkcmVuLmxlbmd0aCB8fCAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGRyZW4gPSBjdXJyZW50Tm9kZS5jaGlsZHJlbjtcbiAgICAgICAgICAgIGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbltpXSAmJiB0eXBlb2YgY2hpbGRyZW5baV0gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgcmVjdXJzZShjaGlsZCwgZmFsc2UsIGN1cnJlbnROb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmKGN1cnJlbnROb2RlLCBpc1BhcmVudCwgaXNQYXJlbnQgPyB2b2lkIDAgOiBwYXJlbnRWTm9kZSk7XG4gICAgfVxuICAgIHJlY3Vyc2Uodk5vZGUsIHRydWUpO1xufVxuZnVuY3Rpb24gYWRkUGFyZW50KHZOb2RlLCBpc1BhcmVudCwgcGFyZW50KSB7XG4gICAgaWYgKGlzUGFyZW50KSB7XG4gICAgICAgIHJldHVybiB2b2lkIDA7XG4gICAgfVxuICAgIGlmICghdk5vZGUuZGF0YSkge1xuICAgICAgICB2Tm9kZS5kYXRhID0ge307XG4gICAgfVxuICAgIGlmICghdk5vZGUuZGF0YVtwYXJlbnRfc3ltYm9sXzEuZGVmYXVsdF0pIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHZOb2RlLmRhdGEsIHBhcmVudF9zeW1ib2xfMS5kZWZhdWx0LCB7XG4gICAgICAgICAgICB2YWx1ZTogcGFyZW50LFxuICAgICAgICB9KTtcbiAgICB9XG59XG4vLyMgc291cmNlTWFwcGluZ1VSTD1maW5kTWF0Y2hlcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciBjdXJyeTJfMSA9IHJlcXVpcmUoJy4vY3VycnkyJyk7XG52YXIgZmluZE1hdGNoZXNfMSA9IHJlcXVpcmUoJy4vZmluZE1hdGNoZXMnKTtcbmV4cG9ydHMuc2VsZWN0ID0gY3VycnkyXzEuY3VycnkyKGZpbmRNYXRjaGVzXzEuZmluZE1hdGNoZXMpO1xudmFyIHNlbGVjdG9yUGFyc2VyXzEgPSByZXF1aXJlKCcuL3NlbGVjdG9yUGFyc2VyJyk7XG5leHBvcnRzLnNlbGVjdG9yUGFyc2VyID0gc2VsZWN0b3JQYXJzZXJfMS5zZWxlY3RvclBhcnNlcjtcbnZhciBjbGFzc05hbWVGcm9tVk5vZGVfMSA9IHJlcXVpcmUoJy4vY2xhc3NOYW1lRnJvbVZOb2RlJyk7XG5leHBvcnRzLmNsYXNzTmFtZUZyb21WTm9kZSA9IGNsYXNzTmFtZUZyb21WTm9kZV8xLmNsYXNzTmFtZUZyb21WTm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xudmFyIHJvb3Q7XG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgcm9vdCA9IHNlbGY7XG59XG5lbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJvb3QgPSB3aW5kb3c7XG59XG5lbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgIHJvb3QgPSBnbG9iYWw7XG59XG5lbHNlIHtcbiAgICByb290ID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn1cbnZhciBTeW1ib2wgPSByb290LlN5bWJvbDtcbnZhciBwYXJlbnRTeW1ib2w7XG5pZiAodHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHBhcmVudFN5bWJvbCA9IFN5bWJvbCgncGFyZW50Jyk7XG59XG5lbHNlIHtcbiAgICBwYXJlbnRTeW1ib2wgPSAnQEBzbmFiYmRvbS1zZWxlY3Rvci1wYXJlbnQnO1xufVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gcGFyZW50U3ltYm9sO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGFyZW50LXN5bWJvbC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbnZhciB0cmVlX3NlbGVjdG9yXzEgPSByZXF1aXJlKCd0cmVlLXNlbGVjdG9yJyk7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoJy4vc2VsZWN0b3JQYXJzZXInKTtcbnZhciBjbGFzc05hbWVGcm9tVk5vZGVfMSA9IHJlcXVpcmUoJy4vY2xhc3NOYW1lRnJvbVZOb2RlJyk7XG52YXIgcGFyZW50X3N5bWJvbF8xID0gcmVxdWlyZSgnLi9wYXJlbnQtc3ltYm9sJyk7XG52YXIgb3B0aW9ucyA9IHtcbiAgICB0YWc6IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gc2VsZWN0b3JQYXJzZXJfMS5zZWxlY3RvclBhcnNlcih2Tm9kZSkudGFnTmFtZTsgfSxcbiAgICBjbGFzc05hbWU6IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gY2xhc3NOYW1lRnJvbVZOb2RlXzEuY2xhc3NOYW1lRnJvbVZOb2RlKHZOb2RlKTsgfSxcbiAgICBpZDogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiBzZWxlY3RvclBhcnNlcl8xLnNlbGVjdG9yUGFyc2VyKHZOb2RlKS5pZCB8fCAnJzsgfSxcbiAgICBjaGlsZHJlbjogZnVuY3Rpb24gKHZOb2RlKSB7IHJldHVybiB2Tm9kZS5jaGlsZHJlbiB8fCBbXTsgfSxcbiAgICBwYXJlbnQ6IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gdk5vZGUuZGF0YVtwYXJlbnRfc3ltYm9sXzEuZGVmYXVsdF0gfHwgdk5vZGU7IH0sXG4gICAgY29udGVudHM6IGZ1bmN0aW9uICh2Tm9kZSkgeyByZXR1cm4gdk5vZGUudGV4dCB8fCAnJzsgfSxcbiAgICBhdHRyOiBmdW5jdGlvbiAodk5vZGUsIGF0dHIpIHtcbiAgICAgICAgaWYgKHZOb2RlLmRhdGEpIHtcbiAgICAgICAgICAgIHZhciBfYSA9IHZOb2RlLmRhdGEsIF9iID0gX2EuYXR0cnMsIGF0dHJzID0gX2IgPT09IHZvaWQgMCA/IHt9IDogX2IsIF9jID0gX2EucHJvcHMsIHByb3BzID0gX2MgPT09IHZvaWQgMCA/IHt9IDogX2MsIF9kID0gX2EuZGF0YXNldCwgZGF0YXNldCA9IF9kID09PSB2b2lkIDAgPyB7fSA6IF9kO1xuICAgICAgICAgICAgaWYgKGF0dHJzW2F0dHJdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGF0dHJzW2F0dHJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByb3BzW2F0dHJdKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHByb3BzW2F0dHJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGF0dHIuaW5kZXhPZignZGF0YS0nKSA9PT0gMCAmJiBkYXRhc2V0W2F0dHIuc2xpY2UoNSldKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFzZXRbYXR0ci5zbGljZSg1KV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxufTtcbnZhciBtYXRjaGVzID0gdHJlZV9zZWxlY3Rvcl8xLmNyZWF0ZU1hdGNoZXMob3B0aW9ucyk7XG5mdW5jdGlvbiBjdXN0b21NYXRjaGVzKHNlbCwgdm5vZGUpIHtcbiAgICB2YXIgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgdmFyIHNlbGVjdG9yID0gbWF0Y2hlcy5iaW5kKG51bGwsIHNlbCk7XG4gICAgaWYgKGRhdGEgJiYgZGF0YS5mbikge1xuICAgICAgICB2YXIgbiA9IHZvaWQgMDtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZGF0YS5hcmdzKSkge1xuICAgICAgICAgICAgbiA9IGRhdGEuZm4uYXBwbHkobnVsbCwgZGF0YS5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChkYXRhLmFyZ3MpIHtcbiAgICAgICAgICAgIG4gPSBkYXRhLmZuLmNhbGwobnVsbCwgZGF0YS5hcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG4gPSBkYXRhLmZuKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNlbGVjdG9yKG4pID8gbiA6IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gc2VsZWN0b3Iodm5vZGUpO1xufVxuZXhwb3J0cy5xdWVyeVNlbGVjdG9yID0gdHJlZV9zZWxlY3Rvcl8xLmNyZWF0ZVF1ZXJ5U2VsZWN0b3Iob3B0aW9ucywgY3VzdG9tTWF0Y2hlcyk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1xdWVyeS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbmZ1bmN0aW9uIHNlbGVjdG9yUGFyc2VyKG5vZGUpIHtcbiAgICBpZiAoIW5vZGUuc2VsKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0YWdOYW1lOiAnJyxcbiAgICAgICAgICAgIGlkOiAnJyxcbiAgICAgICAgICAgIGNsYXNzTmFtZTogJycsXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBzZWwgPSBub2RlLnNlbDtcbiAgICB2YXIgaGFzaElkeCA9IHNlbC5pbmRleE9mKCcjJyk7XG4gICAgdmFyIGRvdElkeCA9IHNlbC5pbmRleE9mKCcuJywgaGFzaElkeCk7XG4gICAgdmFyIGhhc2ggPSBoYXNoSWR4ID4gMCA/IGhhc2hJZHggOiBzZWwubGVuZ3RoO1xuICAgIHZhciBkb3QgPSBkb3RJZHggPiAwID8gZG90SWR4IDogc2VsLmxlbmd0aDtcbiAgICB2YXIgdGFnTmFtZSA9IGhhc2hJZHggIT09IC0xIHx8IGRvdElkeCAhPT0gLTEgP1xuICAgICAgICBzZWwuc2xpY2UoMCwgTWF0aC5taW4oaGFzaCwgZG90KSkgOlxuICAgICAgICBzZWw7XG4gICAgdmFyIGlkID0gaGFzaCA8IGRvdCA/IHNlbC5zbGljZShoYXNoICsgMSwgZG90KSA6IHZvaWQgMDtcbiAgICB2YXIgY2xhc3NOYW1lID0gZG90SWR4ID4gMCA/IHNlbC5zbGljZShkb3QgKyAxKS5yZXBsYWNlKC9cXC4vZywgJyAnKSA6IHZvaWQgMDtcbiAgICByZXR1cm4ge1xuICAgICAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgICAgICBpZDogaWQsXG4gICAgICAgIGNsYXNzTmFtZTogY2xhc3NOYW1lLFxuICAgIH07XG59XG5leHBvcnRzLnNlbGVjdG9yUGFyc2VyID0gc2VsZWN0b3JQYXJzZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZWxlY3RvclBhcnNlci5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB2bm9kZV8xID0gcmVxdWlyZShcIi4vdm5vZGVcIik7XG52YXIgaXMgPSByZXF1aXJlKFwiLi9pc1wiKTtcbmZ1bmN0aW9uIGFkZE5TKGRhdGEsIGNoaWxkcmVuLCBzZWwpIHtcbiAgICBkYXRhLm5zID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbiAgICBpZiAoc2VsICE9PSAnZm9yZWlnbk9iamVjdCcgJiYgY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgY2hpbGREYXRhID0gY2hpbGRyZW5baV0uZGF0YTtcbiAgICAgICAgICAgIGlmIChjaGlsZERhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGFkZE5TKGNoaWxkRGF0YSwgY2hpbGRyZW5baV0uY2hpbGRyZW4sIGNoaWxkcmVuW2ldLnNlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBoKHNlbCwgYiwgYykge1xuICAgIHZhciBkYXRhID0ge30sIGNoaWxkcmVuLCB0ZXh0LCBpO1xuICAgIGlmIChjICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgZGF0YSA9IGI7XG4gICAgICAgIGlmIChpcy5hcnJheShjKSkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBjO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZShjKSkge1xuICAgICAgICAgICAgdGV4dCA9IGM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYyAmJiBjLnNlbCkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBbY107XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAoYiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmIChpcy5hcnJheShiKSkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBiO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGlzLnByaW1pdGl2ZShiKSkge1xuICAgICAgICAgICAgdGV4dCA9IGI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYiAmJiBiLnNlbCkge1xuICAgICAgICAgICAgY2hpbGRyZW4gPSBbYl07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkYXRhID0gYjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoY2hpbGRyZW4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2hpbGRyZW4ubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIGlmIChpcy5wcmltaXRpdmUoY2hpbGRyZW5baV0pKVxuICAgICAgICAgICAgICAgIGNoaWxkcmVuW2ldID0gdm5vZGVfMS52bm9kZSh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBjaGlsZHJlbltpXSwgdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoc2VsWzBdID09PSAncycgJiYgc2VsWzFdID09PSAndicgJiYgc2VsWzJdID09PSAnZycgJiZcbiAgICAgICAgKHNlbC5sZW5ndGggPT09IDMgfHwgc2VsWzNdID09PSAnLicgfHwgc2VsWzNdID09PSAnIycpKSB7XG4gICAgICAgIGFkZE5TKGRhdGEsIGNoaWxkcmVuLCBzZWwpO1xuICAgIH1cbiAgICByZXR1cm4gdm5vZGVfMS52bm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCB1bmRlZmluZWQpO1xufVxuZXhwb3J0cy5oID0gaDtcbjtcbmV4cG9ydHMuZGVmYXVsdCA9IGg7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1oLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh0YWdOYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG59XG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlVVJJLCBxdWFsaWZpZWROYW1lKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2VVUkksIHF1YWxpZmllZE5hbWUpO1xufVxuZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodGV4dCkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0KTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUNvbW1lbnQodGV4dCkge1xuICAgIHJldHVybiBkb2N1bWVudC5jcmVhdGVDb21tZW50KHRleHQpO1xufVxuZnVuY3Rpb24gaW5zZXJ0QmVmb3JlKHBhcmVudE5vZGUsIG5ld05vZGUsIHJlZmVyZW5jZU5vZGUpIHtcbiAgICBwYXJlbnROb2RlLmluc2VydEJlZm9yZShuZXdOb2RlLCByZWZlcmVuY2VOb2RlKTtcbn1cbmZ1bmN0aW9uIHJlbW92ZUNoaWxkKG5vZGUsIGNoaWxkKSB7XG4gICAgbm9kZS5yZW1vdmVDaGlsZChjaGlsZCk7XG59XG5mdW5jdGlvbiBhcHBlbmRDaGlsZChub2RlLCBjaGlsZCkge1xuICAgIG5vZGUuYXBwZW5kQ2hpbGQoY2hpbGQpO1xufVxuZnVuY3Rpb24gcGFyZW50Tm9kZShub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUucGFyZW50Tm9kZTtcbn1cbmZ1bmN0aW9uIG5leHRTaWJsaW5nKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5uZXh0U2libGluZztcbn1cbmZ1bmN0aW9uIHRhZ05hbWUoZWxtKSB7XG4gICAgcmV0dXJuIGVsbS50YWdOYW1lO1xufVxuZnVuY3Rpb24gc2V0VGV4dENvbnRlbnQobm9kZSwgdGV4dCkge1xuICAgIG5vZGUudGV4dENvbnRlbnQgPSB0ZXh0O1xufVxuZnVuY3Rpb24gZ2V0VGV4dENvbnRlbnQobm9kZSkge1xuICAgIHJldHVybiBub2RlLnRleHRDb250ZW50O1xufVxuZnVuY3Rpb24gaXNFbGVtZW50KG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMTtcbn1cbmZ1bmN0aW9uIGlzVGV4dChub2RlKSB7XG4gICAgcmV0dXJuIG5vZGUubm9kZVR5cGUgPT09IDM7XG59XG5mdW5jdGlvbiBpc0NvbW1lbnQobm9kZSkge1xuICAgIHJldHVybiBub2RlLm5vZGVUeXBlID09PSA4O1xufVxuZXhwb3J0cy5odG1sRG9tQXBpID0ge1xuICAgIGNyZWF0ZUVsZW1lbnQ6IGNyZWF0ZUVsZW1lbnQsXG4gICAgY3JlYXRlRWxlbWVudE5TOiBjcmVhdGVFbGVtZW50TlMsXG4gICAgY3JlYXRlVGV4dE5vZGU6IGNyZWF0ZVRleHROb2RlLFxuICAgIGNyZWF0ZUNvbW1lbnQ6IGNyZWF0ZUNvbW1lbnQsXG4gICAgaW5zZXJ0QmVmb3JlOiBpbnNlcnRCZWZvcmUsXG4gICAgcmVtb3ZlQ2hpbGQ6IHJlbW92ZUNoaWxkLFxuICAgIGFwcGVuZENoaWxkOiBhcHBlbmRDaGlsZCxcbiAgICBwYXJlbnROb2RlOiBwYXJlbnROb2RlLFxuICAgIG5leHRTaWJsaW5nOiBuZXh0U2libGluZyxcbiAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgIHNldFRleHRDb250ZW50OiBzZXRUZXh0Q29udGVudCxcbiAgICBnZXRUZXh0Q29udGVudDogZ2V0VGV4dENvbnRlbnQsXG4gICAgaXNFbGVtZW50OiBpc0VsZW1lbnQsXG4gICAgaXNUZXh0OiBpc1RleHQsXG4gICAgaXNDb21tZW50OiBpc0NvbW1lbnQsXG59O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5odG1sRG9tQXBpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aHRtbGRvbWFwaS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuYXJyYXkgPSBBcnJheS5pc0FycmF5O1xuZnVuY3Rpb24gcHJpbWl0aXZlKHMpIHtcbiAgICByZXR1cm4gdHlwZW9mIHMgPT09ICdzdHJpbmcnIHx8IHR5cGVvZiBzID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMucHJpbWl0aXZlID0gcHJpbWl0aXZlO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgeGxpbmtOUyA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJztcbnZhciB4bWxOUyA9ICdodHRwOi8vd3d3LnczLm9yZy9YTUwvMTk5OC9uYW1lc3BhY2UnO1xudmFyIGNvbG9uQ2hhciA9IDU4O1xudmFyIHhDaGFyID0gMTIwO1xuZnVuY3Rpb24gdXBkYXRlQXR0cnMob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGtleSwgZWxtID0gdm5vZGUuZWxtLCBvbGRBdHRycyA9IG9sZFZub2RlLmRhdGEuYXR0cnMsIGF0dHJzID0gdm5vZGUuZGF0YS5hdHRycztcbiAgICBpZiAoIW9sZEF0dHJzICYmICFhdHRycylcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRBdHRycyA9PT0gYXR0cnMpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRBdHRycyA9IG9sZEF0dHJzIHx8IHt9O1xuICAgIGF0dHJzID0gYXR0cnMgfHwge307XG4gICAgLy8gdXBkYXRlIG1vZGlmaWVkIGF0dHJpYnV0ZXMsIGFkZCBuZXcgYXR0cmlidXRlc1xuICAgIGZvciAoa2V5IGluIGF0dHJzKSB7XG4gICAgICAgIHZhciBjdXIgPSBhdHRyc1trZXldO1xuICAgICAgICB2YXIgb2xkID0gb2xkQXR0cnNba2V5XTtcbiAgICAgICAgaWYgKG9sZCAhPT0gY3VyKSB7XG4gICAgICAgICAgICBpZiAoY3VyID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIFwiXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY3VyID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGVsbS5yZW1vdmVBdHRyaWJ1dGUoa2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChrZXkuY2hhckNvZGVBdCgwKSAhPT0geENoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleS5jaGFyQ29kZUF0KDMpID09PSBjb2xvbkNoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lIHhtbCBuYW1lc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZU5TKHhtbE5TLCBrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKGtleS5jaGFyQ29kZUF0KDUpID09PSBjb2xvbkNoYXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQXNzdW1lIHhsaW5rIG5hbWVzcGFjZVxuICAgICAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlTlMoeGxpbmtOUywga2V5LCBjdXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZShrZXksIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHJlbW92ZSByZW1vdmVkIGF0dHJpYnV0ZXNcbiAgICAvLyB1c2UgYGluYCBvcGVyYXRvciBzaW5jZSB0aGUgcHJldmlvdXMgYGZvcmAgaXRlcmF0aW9uIHVzZXMgaXQgKC5pLmUuIGFkZCBldmVuIGF0dHJpYnV0ZXMgd2l0aCB1bmRlZmluZWQgdmFsdWUpXG4gICAgLy8gdGhlIG90aGVyIG9wdGlvbiBpcyB0byByZW1vdmUgYWxsIGF0dHJpYnV0ZXMgd2l0aCB2YWx1ZSA9PSB1bmRlZmluZWRcbiAgICBmb3IgKGtleSBpbiBvbGRBdHRycykge1xuICAgICAgICBpZiAoIShrZXkgaW4gYXR0cnMpKSB7XG4gICAgICAgICAgICBlbG0ucmVtb3ZlQXR0cmlidXRlKGtleSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmF0dHJpYnV0ZXNNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlQXR0cnMsIHVwZGF0ZTogdXBkYXRlQXR0cnMgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuYXR0cmlidXRlc01vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWF0dHJpYnV0ZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB1cGRhdGVDbGFzcyhvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICB2YXIgY3VyLCBuYW1lLCBlbG0gPSB2bm9kZS5lbG0sIG9sZENsYXNzID0gb2xkVm5vZGUuZGF0YS5jbGFzcywga2xhc3MgPSB2bm9kZS5kYXRhLmNsYXNzO1xuICAgIGlmICghb2xkQ2xhc3MgJiYgIWtsYXNzKVxuICAgICAgICByZXR1cm47XG4gICAgaWYgKG9sZENsYXNzID09PSBrbGFzcylcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZENsYXNzID0gb2xkQ2xhc3MgfHwge307XG4gICAga2xhc3MgPSBrbGFzcyB8fCB7fTtcbiAgICBmb3IgKG5hbWUgaW4gb2xkQ2xhc3MpIHtcbiAgICAgICAgaWYgKCFrbGFzc1tuYW1lXSkge1xuICAgICAgICAgICAgZWxtLmNsYXNzTGlzdC5yZW1vdmUobmFtZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChuYW1lIGluIGtsYXNzKSB7XG4gICAgICAgIGN1ciA9IGtsYXNzW25hbWVdO1xuICAgICAgICBpZiAoY3VyICE9PSBvbGRDbGFzc1tuYW1lXSkge1xuICAgICAgICAgICAgZWxtLmNsYXNzTGlzdFtjdXIgPyAnYWRkJyA6ICdyZW1vdmUnXShuYW1lKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMuY2xhc3NNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlQ2xhc3MsIHVwZGF0ZTogdXBkYXRlQ2xhc3MgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMuY2xhc3NNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jbGFzcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBDQVBTX1JFR0VYID0gL1tBLVpdL2c7XG5mdW5jdGlvbiB1cGRhdGVEYXRhc2V0KG9sZFZub2RlLCB2bm9kZSkge1xuICAgIHZhciBlbG0gPSB2bm9kZS5lbG0sIG9sZERhdGFzZXQgPSBvbGRWbm9kZS5kYXRhLmRhdGFzZXQsIGRhdGFzZXQgPSB2bm9kZS5kYXRhLmRhdGFzZXQsIGtleTtcbiAgICBpZiAoIW9sZERhdGFzZXQgJiYgIWRhdGFzZXQpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkRGF0YXNldCA9PT0gZGF0YXNldClcbiAgICAgICAgcmV0dXJuO1xuICAgIG9sZERhdGFzZXQgPSBvbGREYXRhc2V0IHx8IHt9O1xuICAgIGRhdGFzZXQgPSBkYXRhc2V0IHx8IHt9O1xuICAgIHZhciBkID0gZWxtLmRhdGFzZXQ7XG4gICAgZm9yIChrZXkgaW4gb2xkRGF0YXNldCkge1xuICAgICAgICBpZiAoIWRhdGFzZXRba2V5XSkge1xuICAgICAgICAgICAgaWYgKGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoa2V5IGluIGQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGRba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0ucmVtb3ZlQXR0cmlidXRlKCdkYXRhLScgKyBrZXkucmVwbGFjZShDQVBTX1JFR0VYLCAnLSQmJykudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChrZXkgaW4gZGF0YXNldCkge1xuICAgICAgICBpZiAob2xkRGF0YXNldFtrZXldICE9PSBkYXRhc2V0W2tleV0pIHtcbiAgICAgICAgICAgIGlmIChkKSB7XG4gICAgICAgICAgICAgICAgZFtrZXldID0gZGF0YXNldFtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxtLnNldEF0dHJpYnV0ZSgnZGF0YS0nICsga2V5LnJlcGxhY2UoQ0FQU19SRUdFWCwgJy0kJicpLnRvTG93ZXJDYXNlKCksIGRhdGFzZXRba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmRhdGFzZXRNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlRGF0YXNldCwgdXBkYXRlOiB1cGRhdGVEYXRhc2V0IH07XG5leHBvcnRzLmRlZmF1bHQgPSBleHBvcnRzLmRhdGFzZXRNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1kYXRhc2V0LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gdXBkYXRlUHJvcHMob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGtleSwgY3VyLCBvbGQsIGVsbSA9IHZub2RlLmVsbSwgb2xkUHJvcHMgPSBvbGRWbm9kZS5kYXRhLnByb3BzLCBwcm9wcyA9IHZub2RlLmRhdGEucHJvcHM7XG4gICAgaWYgKCFvbGRQcm9wcyAmJiAhcHJvcHMpXG4gICAgICAgIHJldHVybjtcbiAgICBpZiAob2xkUHJvcHMgPT09IHByb3BzKVxuICAgICAgICByZXR1cm47XG4gICAgb2xkUHJvcHMgPSBvbGRQcm9wcyB8fCB7fTtcbiAgICBwcm9wcyA9IHByb3BzIHx8IHt9O1xuICAgIGZvciAoa2V5IGluIG9sZFByb3BzKSB7XG4gICAgICAgIGlmICghcHJvcHNba2V5XSkge1xuICAgICAgICAgICAgZGVsZXRlIGVsbVtrZXldO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoa2V5IGluIHByb3BzKSB7XG4gICAgICAgIGN1ciA9IHByb3BzW2tleV07XG4gICAgICAgIG9sZCA9IG9sZFByb3BzW2tleV07XG4gICAgICAgIGlmIChvbGQgIT09IGN1ciAmJiAoa2V5ICE9PSAndmFsdWUnIHx8IGVsbVtrZXldICE9PSBjdXIpKSB7XG4gICAgICAgICAgICBlbG1ba2V5XSA9IGN1cjtcbiAgICAgICAgfVxuICAgIH1cbn1cbmV4cG9ydHMucHJvcHNNb2R1bGUgPSB7IGNyZWF0ZTogdXBkYXRlUHJvcHMsIHVwZGF0ZTogdXBkYXRlUHJvcHMgfTtcbmV4cG9ydHMuZGVmYXVsdCA9IGV4cG9ydHMucHJvcHNNb2R1bGU7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcm9wcy5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciByYWYgPSAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSkgfHwgc2V0VGltZW91dDtcbnZhciBuZXh0RnJhbWUgPSBmdW5jdGlvbiAoZm4pIHsgcmFmKGZ1bmN0aW9uICgpIHsgcmFmKGZuKTsgfSk7IH07XG52YXIgcmVmbG93Rm9yY2VkID0gZmFsc2U7XG5mdW5jdGlvbiBzZXROZXh0RnJhbWUob2JqLCBwcm9wLCB2YWwpIHtcbiAgICBuZXh0RnJhbWUoZnVuY3Rpb24gKCkgeyBvYmpbcHJvcF0gPSB2YWw7IH0pO1xufVxuZnVuY3Rpb24gdXBkYXRlU3R5bGUob2xkVm5vZGUsIHZub2RlKSB7XG4gICAgdmFyIGN1ciwgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBvbGRTdHlsZSA9IG9sZFZub2RlLmRhdGEuc3R5bGUsIHN0eWxlID0gdm5vZGUuZGF0YS5zdHlsZTtcbiAgICBpZiAoIW9sZFN0eWxlICYmICFzdHlsZSlcbiAgICAgICAgcmV0dXJuO1xuICAgIGlmIChvbGRTdHlsZSA9PT0gc3R5bGUpXG4gICAgICAgIHJldHVybjtcbiAgICBvbGRTdHlsZSA9IG9sZFN0eWxlIHx8IHt9O1xuICAgIHN0eWxlID0gc3R5bGUgfHwge307XG4gICAgdmFyIG9sZEhhc0RlbCA9ICdkZWxheWVkJyBpbiBvbGRTdHlsZTtcbiAgICBmb3IgKG5hbWUgaW4gb2xkU3R5bGUpIHtcbiAgICAgICAgaWYgKCFzdHlsZVtuYW1lXSkge1xuICAgICAgICAgICAgaWYgKG5hbWVbMF0gPT09ICctJyAmJiBuYW1lWzFdID09PSAnLScpIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGUucmVtb3ZlUHJvcGVydHkobmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcbiAgICAgICAgY3VyID0gc3R5bGVbbmFtZV07XG4gICAgICAgIGlmIChuYW1lID09PSAnZGVsYXllZCcgJiYgc3R5bGUuZGVsYXllZCkge1xuICAgICAgICAgICAgZm9yICh2YXIgbmFtZTIgaW4gc3R5bGUuZGVsYXllZCkge1xuICAgICAgICAgICAgICAgIGN1ciA9IHN0eWxlLmRlbGF5ZWRbbmFtZTJdO1xuICAgICAgICAgICAgICAgIGlmICghb2xkSGFzRGVsIHx8IGN1ciAhPT0gb2xkU3R5bGUuZGVsYXllZFtuYW1lMl0pIHtcbiAgICAgICAgICAgICAgICAgICAgc2V0TmV4dEZyYW1lKGVsbS5zdHlsZSwgbmFtZTIsIGN1cik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5hbWUgIT09ICdyZW1vdmUnICYmIGN1ciAhPT0gb2xkU3R5bGVbbmFtZV0pIHtcbiAgICAgICAgICAgIGlmIChuYW1lWzBdID09PSAnLScgJiYgbmFtZVsxXSA9PT0gJy0nKSB7XG4gICAgICAgICAgICAgICAgZWxtLnN0eWxlLnNldFByb3BlcnR5KG5hbWUsIGN1cik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbG0uc3R5bGVbbmFtZV0gPSBjdXI7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBhcHBseURlc3Ryb3lTdHlsZSh2bm9kZSkge1xuICAgIHZhciBzdHlsZSwgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBzID0gdm5vZGUuZGF0YS5zdHlsZTtcbiAgICBpZiAoIXMgfHwgIShzdHlsZSA9IHMuZGVzdHJveSkpXG4gICAgICAgIHJldHVybjtcbiAgICBmb3IgKG5hbWUgaW4gc3R5bGUpIHtcbiAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gc3R5bGVbbmFtZV07XG4gICAgfVxufVxuZnVuY3Rpb24gYXBwbHlSZW1vdmVTdHlsZSh2bm9kZSwgcm0pIHtcbiAgICB2YXIgcyA9IHZub2RlLmRhdGEuc3R5bGU7XG4gICAgaWYgKCFzIHx8ICFzLnJlbW92ZSkge1xuICAgICAgICBybSgpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghcmVmbG93Rm9yY2VkKSB7XG4gICAgICAgIGdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuYm9keSkudHJhbnNmb3JtO1xuICAgICAgICByZWZsb3dGb3JjZWQgPSB0cnVlO1xuICAgIH1cbiAgICB2YXIgbmFtZSwgZWxtID0gdm5vZGUuZWxtLCBpID0gMCwgY29tcFN0eWxlLCBzdHlsZSA9IHMucmVtb3ZlLCBhbW91bnQgPSAwLCBhcHBsaWVkID0gW107XG4gICAgZm9yIChuYW1lIGluIHN0eWxlKSB7XG4gICAgICAgIGFwcGxpZWQucHVzaChuYW1lKTtcbiAgICAgICAgZWxtLnN0eWxlW25hbWVdID0gc3R5bGVbbmFtZV07XG4gICAgfVxuICAgIGNvbXBTdHlsZSA9IGdldENvbXB1dGVkU3R5bGUoZWxtKTtcbiAgICB2YXIgcHJvcHMgPSBjb21wU3R5bGVbJ3RyYW5zaXRpb24tcHJvcGVydHknXS5zcGxpdCgnLCAnKTtcbiAgICBmb3IgKDsgaSA8IHByb3BzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIGlmIChhcHBsaWVkLmluZGV4T2YocHJvcHNbaV0pICE9PSAtMSlcbiAgICAgICAgICAgIGFtb3VudCsrO1xuICAgIH1cbiAgICBlbG0uYWRkRXZlbnRMaXN0ZW5lcigndHJhbnNpdGlvbmVuZCcsIGZ1bmN0aW9uIChldikge1xuICAgICAgICBpZiAoZXYudGFyZ2V0ID09PSBlbG0pXG4gICAgICAgICAgICAtLWFtb3VudDtcbiAgICAgICAgaWYgKGFtb3VudCA9PT0gMClcbiAgICAgICAgICAgIHJtKCk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBmb3JjZVJlZmxvdygpIHtcbiAgICByZWZsb3dGb3JjZWQgPSBmYWxzZTtcbn1cbmV4cG9ydHMuc3R5bGVNb2R1bGUgPSB7XG4gICAgcHJlOiBmb3JjZVJlZmxvdyxcbiAgICBjcmVhdGU6IHVwZGF0ZVN0eWxlLFxuICAgIHVwZGF0ZTogdXBkYXRlU3R5bGUsXG4gICAgZGVzdHJveTogYXBwbHlEZXN0cm95U3R5bGUsXG4gICAgcmVtb3ZlOiBhcHBseVJlbW92ZVN0eWxlXG59O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy5zdHlsZU1vZHVsZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXN0eWxlLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcbnZhciBpcyA9IHJlcXVpcmUoXCIuL2lzXCIpO1xudmFyIGh0bWxkb21hcGlfMSA9IHJlcXVpcmUoXCIuL2h0bWxkb21hcGlcIik7XG5mdW5jdGlvbiBpc1VuZGVmKHMpIHsgcmV0dXJuIHMgPT09IHVuZGVmaW5lZDsgfVxuZnVuY3Rpb24gaXNEZWYocykgeyByZXR1cm4gcyAhPT0gdW5kZWZpbmVkOyB9XG52YXIgZW1wdHlOb2RlID0gdm5vZGVfMS5kZWZhdWx0KCcnLCB7fSwgW10sIHVuZGVmaW5lZCwgdW5kZWZpbmVkKTtcbmZ1bmN0aW9uIHNhbWVWbm9kZSh2bm9kZTEsIHZub2RlMikge1xuICAgIHJldHVybiB2bm9kZTEua2V5ID09PSB2bm9kZTIua2V5ICYmIHZub2RlMS5zZWwgPT09IHZub2RlMi5zZWw7XG59XG5mdW5jdGlvbiBpc1Zub2RlKHZub2RlKSB7XG4gICAgcmV0dXJuIHZub2RlLnNlbCAhPT0gdW5kZWZpbmVkO1xufVxuZnVuY3Rpb24gY3JlYXRlS2V5VG9PbGRJZHgoY2hpbGRyZW4sIGJlZ2luSWR4LCBlbmRJZHgpIHtcbiAgICB2YXIgaSwgbWFwID0ge30sIGtleSwgY2g7XG4gICAgZm9yIChpID0gYmVnaW5JZHg7IGkgPD0gZW5kSWR4OyArK2kpIHtcbiAgICAgICAgY2ggPSBjaGlsZHJlbltpXTtcbiAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgIGtleSA9IGNoLmtleTtcbiAgICAgICAgICAgIGlmIChrZXkgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICBtYXBba2V5XSA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hcDtcbn1cbnZhciBob29rcyA9IFsnY3JlYXRlJywgJ3VwZGF0ZScsICdyZW1vdmUnLCAnZGVzdHJveScsICdwcmUnLCAncG9zdCddO1xudmFyIGhfMSA9IHJlcXVpcmUoXCIuL2hcIik7XG5leHBvcnRzLmggPSBoXzEuaDtcbnZhciB0aHVua18xID0gcmVxdWlyZShcIi4vdGh1bmtcIik7XG5leHBvcnRzLnRodW5rID0gdGh1bmtfMS50aHVuaztcbmZ1bmN0aW9uIGluaXQobW9kdWxlcywgZG9tQXBpKSB7XG4gICAgdmFyIGksIGosIGNicyA9IHt9O1xuICAgIHZhciBhcGkgPSBkb21BcGkgIT09IHVuZGVmaW5lZCA/IGRvbUFwaSA6IGh0bWxkb21hcGlfMS5kZWZhdWx0O1xuICAgIGZvciAoaSA9IDA7IGkgPCBob29rcy5sZW5ndGg7ICsraSkge1xuICAgICAgICBjYnNbaG9va3NbaV1dID0gW107XG4gICAgICAgIGZvciAoaiA9IDA7IGogPCBtb2R1bGVzLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICB2YXIgaG9vayA9IG1vZHVsZXNbal1baG9va3NbaV1dO1xuICAgICAgICAgICAgaWYgKGhvb2sgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNic1tob29rc1tpXV0ucHVzaChob29rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBlbXB0eU5vZGVBdChlbG0pIHtcbiAgICAgICAgdmFyIGlkID0gZWxtLmlkID8gJyMnICsgZWxtLmlkIDogJyc7XG4gICAgICAgIHZhciBjID0gZWxtLmNsYXNzTmFtZSA/ICcuJyArIGVsbS5jbGFzc05hbWUuc3BsaXQoJyAnKS5qb2luKCcuJykgOiAnJztcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdChhcGkudGFnTmFtZShlbG0pLnRvTG93ZXJDYXNlKCkgKyBpZCArIGMsIHt9LCBbXSwgdW5kZWZpbmVkLCBlbG0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjcmVhdGVSbUNiKGNoaWxkRWxtLCBsaXN0ZW5lcnMpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHJtQ2IoKSB7XG4gICAgICAgICAgICBpZiAoLS1saXN0ZW5lcnMgPT09IDApIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyZW50XzEgPSBhcGkucGFyZW50Tm9kZShjaGlsZEVsbSk7XG4gICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudF8xLCBjaGlsZEVsbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNyZWF0ZUVsbSh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSB7XG4gICAgICAgIHZhciBpLCBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmluaXQpKSB7XG4gICAgICAgICAgICAgICAgaSh2bm9kZSk7XG4gICAgICAgICAgICAgICAgZGF0YSA9IHZub2RlLmRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGNoaWxkcmVuID0gdm5vZGUuY2hpbGRyZW4sIHNlbCA9IHZub2RlLnNlbDtcbiAgICAgICAgaWYgKHNlbCA9PT0gJyEnKSB7XG4gICAgICAgICAgICBpZiAoaXNVbmRlZih2bm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIHZub2RlLnRleHQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZub2RlLmVsbSA9IGFwaS5jcmVhdGVDb21tZW50KHZub2RlLnRleHQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNlbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyBQYXJzZSBzZWxlY3RvclxuICAgICAgICAgICAgdmFyIGhhc2hJZHggPSBzZWwuaW5kZXhPZignIycpO1xuICAgICAgICAgICAgdmFyIGRvdElkeCA9IHNlbC5pbmRleE9mKCcuJywgaGFzaElkeCk7XG4gICAgICAgICAgICB2YXIgaGFzaCA9IGhhc2hJZHggPiAwID8gaGFzaElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgZG90ID0gZG90SWR4ID4gMCA/IGRvdElkeCA6IHNlbC5sZW5ndGg7XG4gICAgICAgICAgICB2YXIgdGFnID0gaGFzaElkeCAhPT0gLTEgfHwgZG90SWR4ICE9PSAtMSA/IHNlbC5zbGljZSgwLCBNYXRoLm1pbihoYXNoLCBkb3QpKSA6IHNlbDtcbiAgICAgICAgICAgIHZhciBlbG0gPSB2bm9kZS5lbG0gPSBpc0RlZihkYXRhKSAmJiBpc0RlZihpID0gZGF0YS5ucykgPyBhcGkuY3JlYXRlRWxlbWVudE5TKGksIHRhZylcbiAgICAgICAgICAgICAgICA6IGFwaS5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgICAgICAgICBpZiAoaGFzaCA8IGRvdClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdpZCcsIHNlbC5zbGljZShoYXNoICsgMSwgZG90KSk7XG4gICAgICAgICAgICBpZiAoZG90SWR4ID4gMClcbiAgICAgICAgICAgICAgICBlbG0uc2V0QXR0cmlidXRlKCdjbGFzcycsIHNlbC5zbGljZShkb3QgKyAxKS5yZXBsYWNlKC9cXC4vZywgJyAnKSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLmNyZWF0ZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMuY3JlYXRlW2ldKGVtcHR5Tm9kZSwgdm5vZGUpO1xuICAgICAgICAgICAgaWYgKGlzLmFycmF5KGNoaWxkcmVuKSkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2ggPSBjaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaS5hcHBlbmRDaGlsZChlbG0sIGNyZWF0ZUVsbShjaCwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpcy5wcmltaXRpdmUodm5vZGUudGV4dCkpIHtcbiAgICAgICAgICAgICAgICBhcGkuYXBwZW5kQ2hpbGQoZWxtLCBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaSA9IHZub2RlLmRhdGEuaG9vazsgLy8gUmV1c2UgdmFyaWFibGVcbiAgICAgICAgICAgIGlmIChpc0RlZihpKSkge1xuICAgICAgICAgICAgICAgIGlmIChpLmNyZWF0ZSlcbiAgICAgICAgICAgICAgICAgICAgaS5jcmVhdGUoZW1wdHlOb2RlLCB2bm9kZSk7XG4gICAgICAgICAgICAgICAgaWYgKGkuaW5zZXJ0KVxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRlZFZub2RlUXVldWUucHVzaCh2bm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2bm9kZS5lbG0gPSBhcGkuY3JlYXRlVGV4dE5vZGUodm5vZGUudGV4dCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZub2RlLmVsbTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRkVm5vZGVzKHBhcmVudEVsbSwgYmVmb3JlLCB2bm9kZXMsIHN0YXJ0SWR4LCBlbmRJZHgsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICBmb3IgKDsgc3RhcnRJZHggPD0gZW5kSWR4OyArK3N0YXJ0SWR4KSB7XG4gICAgICAgICAgICB2YXIgY2ggPSB2bm9kZXNbc3RhcnRJZHhdO1xuICAgICAgICAgICAgaWYgKGNoICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKGNoLCBpbnNlcnRlZFZub2RlUXVldWUpLCBiZWZvcmUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIGludm9rZURlc3Ryb3lIb29rKHZub2RlKSB7XG4gICAgICAgIHZhciBpLCBqLCBkYXRhID0gdm5vZGUuZGF0YTtcbiAgICAgICAgaWYgKGRhdGEgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkgPSBkYXRhLmhvb2spICYmIGlzRGVmKGkgPSBpLmRlc3Ryb3kpKVxuICAgICAgICAgICAgICAgIGkodm5vZGUpO1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5kZXN0cm95Lmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgICAgIGNicy5kZXN0cm95W2ldKHZub2RlKTtcbiAgICAgICAgICAgIGlmICh2bm9kZS5jaGlsZHJlbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHZub2RlLmNoaWxkcmVuLmxlbmd0aDsgKytqKSB7XG4gICAgICAgICAgICAgICAgICAgIGkgPSB2bm9kZS5jaGlsZHJlbltqXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGkgIT0gbnVsbCAmJiB0eXBlb2YgaSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soaSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgdm5vZGVzLCBzdGFydElkeCwgZW5kSWR4KSB7XG4gICAgICAgIGZvciAoOyBzdGFydElkeCA8PSBlbmRJZHg7ICsrc3RhcnRJZHgpIHtcbiAgICAgICAgICAgIHZhciBpXzEgPSB2b2lkIDAsIGxpc3RlbmVycyA9IHZvaWQgMCwgcm0gPSB2b2lkIDAsIGNoID0gdm5vZGVzW3N0YXJ0SWR4XTtcbiAgICAgICAgICAgIGlmIChjaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmKGNoLnNlbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW52b2tlRGVzdHJveUhvb2soY2gpO1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBjYnMucmVtb3ZlLmxlbmd0aCArIDE7XG4gICAgICAgICAgICAgICAgICAgIHJtID0gY3JlYXRlUm1DYihjaC5lbG0sIGxpc3RlbmVycyk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaV8xID0gMDsgaV8xIDwgY2JzLnJlbW92ZS5sZW5ndGg7ICsraV8xKVxuICAgICAgICAgICAgICAgICAgICAgICAgY2JzLnJlbW92ZVtpXzFdKGNoLCBybSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpc0RlZihpXzEgPSBjaC5kYXRhKSAmJiBpc0RlZihpXzEgPSBpXzEuaG9vaykgJiYgaXNEZWYoaV8xID0gaV8xLnJlbW92ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlfMShjaCwgcm0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcm0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYXBpLnJlbW92ZUNoaWxkKHBhcmVudEVsbSwgY2guZWxtKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlQ2hpbGRyZW4ocGFyZW50RWxtLCBvbGRDaCwgbmV3Q2gsIGluc2VydGVkVm5vZGVRdWV1ZSkge1xuICAgICAgICB2YXIgb2xkU3RhcnRJZHggPSAwLCBuZXdTdGFydElkeCA9IDA7XG4gICAgICAgIHZhciBvbGRFbmRJZHggPSBvbGRDaC5sZW5ndGggLSAxO1xuICAgICAgICB2YXIgb2xkU3RhcnRWbm9kZSA9IG9sZENoWzBdO1xuICAgICAgICB2YXIgb2xkRW5kVm5vZGUgPSBvbGRDaFtvbGRFbmRJZHhdO1xuICAgICAgICB2YXIgbmV3RW5kSWR4ID0gbmV3Q2gubGVuZ3RoIC0gMTtcbiAgICAgICAgdmFyIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFswXTtcbiAgICAgICAgdmFyIG5ld0VuZFZub2RlID0gbmV3Q2hbbmV3RW5kSWR4XTtcbiAgICAgICAgdmFyIG9sZEtleVRvSWR4O1xuICAgICAgICB2YXIgaWR4SW5PbGQ7XG4gICAgICAgIHZhciBlbG1Ub01vdmU7XG4gICAgICAgIHZhciBiZWZvcmU7XG4gICAgICAgIHdoaWxlIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggJiYgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICAgICAgICBpZiAob2xkU3RhcnRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdOyAvLyBWbm9kZSBtaWdodCBoYXZlIGJlZW4gbW92ZWQgbGVmdFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAob2xkRW5kVm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3U3RhcnRWbm9kZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhcnRWbm9kZSA9IG5ld0NoWysrbmV3U3RhcnRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAobmV3RW5kVm5vZGUgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld1N0YXJ0Vm5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcGF0Y2hWbm9kZShvbGRTdGFydFZub2RlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIG9sZFN0YXJ0Vm5vZGUgPSBvbGRDaFsrK29sZFN0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzYW1lVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld0VuZFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZFN0YXJ0Vm5vZGUsIG5ld0VuZFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkU3RhcnRWbm9kZSwgbmV3RW5kVm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtLCBhcGkubmV4dFNpYmxpbmcob2xkRW5kVm5vZGUuZWxtKSk7XG4gICAgICAgICAgICAgICAgb2xkU3RhcnRWbm9kZSA9IG9sZENoWysrb2xkU3RhcnRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld0VuZFZub2RlID0gbmV3Q2hbLS1uZXdFbmRJZHhdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc2FtZVZub2RlKG9sZEVuZFZub2RlLCBuZXdTdGFydFZub2RlKSkge1xuICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkRW5kVm5vZGUsIG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIG9sZEVuZFZub2RlLmVsbSwgb2xkU3RhcnRWbm9kZS5lbG0pO1xuICAgICAgICAgICAgICAgIG9sZEVuZFZub2RlID0gb2xkQ2hbLS1vbGRFbmRJZHhdO1xuICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChvbGRLZXlUb0lkeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIG9sZEtleVRvSWR4ID0gY3JlYXRlS2V5VG9PbGRJZHgob2xkQ2gsIG9sZFN0YXJ0SWR4LCBvbGRFbmRJZHgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZHhJbk9sZCA9IG9sZEtleVRvSWR4W25ld1N0YXJ0Vm5vZGUua2V5XTtcbiAgICAgICAgICAgICAgICBpZiAoaXNVbmRlZihpZHhJbk9sZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGNyZWF0ZUVsbShuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpLCBvbGRTdGFydFZub2RlLmVsbSk7XG4gICAgICAgICAgICAgICAgICAgIG5ld1N0YXJ0Vm5vZGUgPSBuZXdDaFsrK25ld1N0YXJ0SWR4XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGVsbVRvTW92ZSA9IG9sZENoW2lkeEluT2xkXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsbVRvTW92ZS5zZWwgIT09IG5ld1N0YXJ0Vm5vZGUuc2VsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudEVsbSwgY3JlYXRlRWxtKG5ld1N0YXJ0Vm5vZGUsIGluc2VydGVkVm5vZGVRdWV1ZSksIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhdGNoVm5vZGUoZWxtVG9Nb3ZlLCBuZXdTdGFydFZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkQ2hbaWR4SW5PbGRdID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXBpLmluc2VydEJlZm9yZShwYXJlbnRFbG0sIGVsbVRvTW92ZS5lbG0sIG9sZFN0YXJ0Vm5vZGUuZWxtKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBuZXdTdGFydFZub2RlID0gbmV3Q2hbKytuZXdTdGFydElkeF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChvbGRTdGFydElkeCA8PSBvbGRFbmRJZHggfHwgbmV3U3RhcnRJZHggPD0gbmV3RW5kSWR4KSB7XG4gICAgICAgICAgICBpZiAob2xkU3RhcnRJZHggPiBvbGRFbmRJZHgpIHtcbiAgICAgICAgICAgICAgICBiZWZvcmUgPSBuZXdDaFtuZXdFbmRJZHggKyAxXSA9PSBudWxsID8gbnVsbCA6IG5ld0NoW25ld0VuZElkeCArIDFdLmVsbTtcbiAgICAgICAgICAgICAgICBhZGRWbm9kZXMocGFyZW50RWxtLCBiZWZvcmUsIG5ld0NoLCBuZXdTdGFydElkeCwgbmV3RW5kSWR4LCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKHBhcmVudEVsbSwgb2xkQ2gsIG9sZFN0YXJ0SWR4LCBvbGRFbmRJZHgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBhdGNoVm5vZGUob2xkVm5vZGUsIHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpIHtcbiAgICAgICAgdmFyIGksIGhvb2s7XG4gICAgICAgIGlmIChpc0RlZihpID0gdm5vZGUuZGF0YSkgJiYgaXNEZWYoaG9vayA9IGkuaG9vaykgJiYgaXNEZWYoaSA9IGhvb2sucHJlcGF0Y2gpKSB7XG4gICAgICAgICAgICBpKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGVsbSA9IHZub2RlLmVsbSA9IG9sZFZub2RlLmVsbTtcbiAgICAgICAgdmFyIG9sZENoID0gb2xkVm5vZGUuY2hpbGRyZW47XG4gICAgICAgIHZhciBjaCA9IHZub2RlLmNoaWxkcmVuO1xuICAgICAgICBpZiAob2xkVm5vZGUgPT09IHZub2RlKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBpZiAodm5vZGUuZGF0YSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnVwZGF0ZS5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgICAgICBjYnMudXBkYXRlW2ldKG9sZFZub2RlLCB2bm9kZSk7XG4gICAgICAgICAgICBpID0gdm5vZGUuZGF0YS5ob29rO1xuICAgICAgICAgICAgaWYgKGlzRGVmKGkpICYmIGlzRGVmKGkgPSBpLnVwZGF0ZSkpXG4gICAgICAgICAgICAgICAgaShvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpc1VuZGVmKHZub2RlLnRleHQpKSB7XG4gICAgICAgICAgICBpZiAoaXNEZWYob2xkQ2gpICYmIGlzRGVmKGNoKSkge1xuICAgICAgICAgICAgICAgIGlmIChvbGRDaCAhPT0gY2gpXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZUNoaWxkcmVuKGVsbSwgb2xkQ2gsIGNoLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoaXNEZWYoY2gpKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzRGVmKG9sZFZub2RlLnRleHQpKVxuICAgICAgICAgICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCAnJyk7XG4gICAgICAgICAgICAgICAgYWRkVm5vZGVzKGVsbSwgbnVsbCwgY2gsIDAsIGNoLmxlbmd0aCAtIDEsIGluc2VydGVkVm5vZGVRdWV1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0RlZihvbGRDaCkpIHtcbiAgICAgICAgICAgICAgICByZW1vdmVWbm9kZXMoZWxtLCBvbGRDaCwgMCwgb2xkQ2gubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChpc0RlZihvbGRWbm9kZS50ZXh0KSkge1xuICAgICAgICAgICAgICAgIGFwaS5zZXRUZXh0Q29udGVudChlbG0sICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChvbGRWbm9kZS50ZXh0ICE9PSB2bm9kZS50ZXh0KSB7XG4gICAgICAgICAgICBhcGkuc2V0VGV4dENvbnRlbnQoZWxtLCB2bm9kZS50ZXh0KTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaXNEZWYoaG9vaykgJiYgaXNEZWYoaSA9IGhvb2sucG9zdHBhdGNoKSkge1xuICAgICAgICAgICAgaShvbGRWbm9kZSwgdm5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiBwYXRjaChvbGRWbm9kZSwgdm5vZGUpIHtcbiAgICAgICAgdmFyIGksIGVsbSwgcGFyZW50O1xuICAgICAgICB2YXIgaW5zZXJ0ZWRWbm9kZVF1ZXVlID0gW107XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjYnMucHJlLmxlbmd0aDsgKytpKVxuICAgICAgICAgICAgY2JzLnByZVtpXSgpO1xuICAgICAgICBpZiAoIWlzVm5vZGUob2xkVm5vZGUpKSB7XG4gICAgICAgICAgICBvbGRWbm9kZSA9IGVtcHR5Tm9kZUF0KG9sZFZub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2FtZVZub2RlKG9sZFZub2RlLCB2bm9kZSkpIHtcbiAgICAgICAgICAgIHBhdGNoVm5vZGUob2xkVm5vZGUsIHZub2RlLCBpbnNlcnRlZFZub2RlUXVldWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZWxtID0gb2xkVm5vZGUuZWxtO1xuICAgICAgICAgICAgcGFyZW50ID0gYXBpLnBhcmVudE5vZGUoZWxtKTtcbiAgICAgICAgICAgIGNyZWF0ZUVsbSh2bm9kZSwgaW5zZXJ0ZWRWbm9kZVF1ZXVlKTtcbiAgICAgICAgICAgIGlmIChwYXJlbnQgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBhcGkuaW5zZXJ0QmVmb3JlKHBhcmVudCwgdm5vZGUuZWxtLCBhcGkubmV4dFNpYmxpbmcoZWxtKSk7XG4gICAgICAgICAgICAgICAgcmVtb3ZlVm5vZGVzKHBhcmVudCwgW29sZFZub2RlXSwgMCwgMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGluc2VydGVkVm5vZGVRdWV1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgaW5zZXJ0ZWRWbm9kZVF1ZXVlW2ldLmRhdGEuaG9vay5pbnNlcnQoaW5zZXJ0ZWRWbm9kZVF1ZXVlW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2JzLnBvc3QubGVuZ3RoOyArK2kpXG4gICAgICAgICAgICBjYnMucG9zdFtpXSgpO1xuICAgICAgICByZXR1cm4gdm5vZGU7XG4gICAgfTtcbn1cbmV4cG9ydHMuaW5pdCA9IGluaXQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zbmFiYmRvbS5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBoXzEgPSByZXF1aXJlKFwiLi9oXCIpO1xuZnVuY3Rpb24gY29weVRvVGh1bmsodm5vZGUsIHRodW5rKSB7XG4gICAgdGh1bmsuZWxtID0gdm5vZGUuZWxtO1xuICAgIHZub2RlLmRhdGEuZm4gPSB0aHVuay5kYXRhLmZuO1xuICAgIHZub2RlLmRhdGEuYXJncyA9IHRodW5rLmRhdGEuYXJncztcbiAgICB0aHVuay5kYXRhID0gdm5vZGUuZGF0YTtcbiAgICB0aHVuay5jaGlsZHJlbiA9IHZub2RlLmNoaWxkcmVuO1xuICAgIHRodW5rLnRleHQgPSB2bm9kZS50ZXh0O1xuICAgIHRodW5rLmVsbSA9IHZub2RlLmVsbTtcbn1cbmZ1bmN0aW9uIGluaXQodGh1bmspIHtcbiAgICB2YXIgY3VyID0gdGh1bmsuZGF0YTtcbiAgICB2YXIgdm5vZGUgPSBjdXIuZm4uYXBwbHkodW5kZWZpbmVkLCBjdXIuYXJncyk7XG4gICAgY29weVRvVGh1bmsodm5vZGUsIHRodW5rKTtcbn1cbmZ1bmN0aW9uIHByZXBhdGNoKG9sZFZub2RlLCB0aHVuaykge1xuICAgIHZhciBpLCBvbGQgPSBvbGRWbm9kZS5kYXRhLCBjdXIgPSB0aHVuay5kYXRhO1xuICAgIHZhciBvbGRBcmdzID0gb2xkLmFyZ3MsIGFyZ3MgPSBjdXIuYXJncztcbiAgICBpZiAob2xkLmZuICE9PSBjdXIuZm4gfHwgb2xkQXJncy5sZW5ndGggIT09IGFyZ3MubGVuZ3RoKSB7XG4gICAgICAgIGNvcHlUb1RodW5rKGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpLCB0aHVuayk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKG9sZEFyZ3NbaV0gIT09IGFyZ3NbaV0pIHtcbiAgICAgICAgICAgIGNvcHlUb1RodW5rKGN1ci5mbi5hcHBseSh1bmRlZmluZWQsIGFyZ3MpLCB0aHVuayk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29weVRvVGh1bmsob2xkVm5vZGUsIHRodW5rKTtcbn1cbmV4cG9ydHMudGh1bmsgPSBmdW5jdGlvbiB0aHVuayhzZWwsIGtleSwgZm4sIGFyZ3MpIHtcbiAgICBpZiAoYXJncyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFyZ3MgPSBmbjtcbiAgICAgICAgZm4gPSBrZXk7XG4gICAgICAgIGtleSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gICAgcmV0dXJuIGhfMS5oKHNlbCwge1xuICAgICAgICBrZXk6IGtleSxcbiAgICAgICAgaG9vazogeyBpbml0OiBpbml0LCBwcmVwYXRjaDogcHJlcGF0Y2ggfSxcbiAgICAgICAgZm46IGZuLFxuICAgICAgICBhcmdzOiBhcmdzXG4gICAgfSk7XG59O1xuZXhwb3J0cy5kZWZhdWx0ID0gZXhwb3J0cy50aHVuaztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRodW5rLmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xudmFyIHZub2RlXzEgPSByZXF1aXJlKFwiLi92bm9kZVwiKTtcbnZhciBodG1sZG9tYXBpXzEgPSByZXF1aXJlKFwiLi9odG1sZG9tYXBpXCIpO1xuZnVuY3Rpb24gdG9WTm9kZShub2RlLCBkb21BcGkpIHtcbiAgICB2YXIgYXBpID0gZG9tQXBpICE9PSB1bmRlZmluZWQgPyBkb21BcGkgOiBodG1sZG9tYXBpXzEuZGVmYXVsdDtcbiAgICB2YXIgdGV4dDtcbiAgICBpZiAoYXBpLmlzRWxlbWVudChub2RlKSkge1xuICAgICAgICB2YXIgaWQgPSBub2RlLmlkID8gJyMnICsgbm9kZS5pZCA6ICcnO1xuICAgICAgICB2YXIgY24gPSBub2RlLmdldEF0dHJpYnV0ZSgnY2xhc3MnKTtcbiAgICAgICAgdmFyIGMgPSBjbiA/ICcuJyArIGNuLnNwbGl0KCcgJykuam9pbignLicpIDogJyc7XG4gICAgICAgIHZhciBzZWwgPSBhcGkudGFnTmFtZShub2RlKS50b0xvd2VyQ2FzZSgpICsgaWQgKyBjO1xuICAgICAgICB2YXIgYXR0cnMgPSB7fTtcbiAgICAgICAgdmFyIGNoaWxkcmVuID0gW107XG4gICAgICAgIHZhciBuYW1lXzE7XG4gICAgICAgIHZhciBpID0gdm9pZCAwLCBuID0gdm9pZCAwO1xuICAgICAgICB2YXIgZWxtQXR0cnMgPSBub2RlLmF0dHJpYnV0ZXM7XG4gICAgICAgIHZhciBlbG1DaGlsZHJlbiA9IG5vZGUuY2hpbGROb2RlcztcbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGVsbUF0dHJzLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgbmFtZV8xID0gZWxtQXR0cnNbaV0ubm9kZU5hbWU7XG4gICAgICAgICAgICBpZiAobmFtZV8xICE9PSAnaWQnICYmIG5hbWVfMSAhPT0gJ2NsYXNzJykge1xuICAgICAgICAgICAgICAgIGF0dHJzW25hbWVfMV0gPSBlbG1BdHRyc1tpXS5ub2RlVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMCwgbiA9IGVsbUNoaWxkcmVuLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgY2hpbGRyZW4ucHVzaCh0b1ZOb2RlKGVsbUNoaWxkcmVuW2ldLCBkb21BcGkpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KHNlbCwgeyBhdHRyczogYXR0cnMgfSwgY2hpbGRyZW4sIHVuZGVmaW5lZCwgbm9kZSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKGFwaS5pc1RleHQobm9kZSkpIHtcbiAgICAgICAgdGV4dCA9IGFwaS5nZXRUZXh0Q29udGVudChub2RlKTtcbiAgICAgICAgcmV0dXJuIHZub2RlXzEuZGVmYXVsdCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB0ZXh0LCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoYXBpLmlzQ29tbWVudChub2RlKSkge1xuICAgICAgICB0ZXh0ID0gYXBpLmdldFRleHRDb250ZW50KG5vZGUpO1xuICAgICAgICByZXR1cm4gdm5vZGVfMS5kZWZhdWx0KCchJywge30sIFtdLCB0ZXh0LCBub2RlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB2bm9kZV8xLmRlZmF1bHQoJycsIHt9LCBbXSwgdW5kZWZpbmVkLCBub2RlKTtcbiAgICB9XG59XG5leHBvcnRzLnRvVk5vZGUgPSB0b1ZOb2RlO1xuZXhwb3J0cy5kZWZhdWx0ID0gdG9WTm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXRvdm5vZGUuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiB2bm9kZShzZWwsIGRhdGEsIGNoaWxkcmVuLCB0ZXh0LCBlbG0pIHtcbiAgICB2YXIga2V5ID0gZGF0YSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogZGF0YS5rZXk7XG4gICAgcmV0dXJuIHsgc2VsOiBzZWwsIGRhdGE6IGRhdGEsIGNoaWxkcmVuOiBjaGlsZHJlbixcbiAgICAgICAgdGV4dDogdGV4dCwgZWxtOiBlbG0sIGtleToga2V5IH07XG59XG5leHBvcnRzLnZub2RlID0gdm5vZGU7XG5leHBvcnRzLmRlZmF1bHQgPSB2bm9kZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXZub2RlLmpzLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9wb255ZmlsbCA9IHJlcXVpcmUoJy4vcG9ueWZpbGwuanMnKTtcblxudmFyIF9wb255ZmlsbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wb255ZmlsbCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIHJvb3Q7IC8qIGdsb2JhbCB3aW5kb3cgKi9cblxuXG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gbW9kdWxlO1xufSBlbHNlIHtcbiAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG5cbnZhciByZXN1bHQgPSAoMCwgX3BvbnlmaWxsMlsnZGVmYXVsdCddKShyb290KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHJlc3VsdDsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzWydkZWZhdWx0J10gPSBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGw7XG5mdW5jdGlvbiBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGwocm9vdCkge1xuXHR2YXIgcmVzdWx0O1xuXHR2YXIgX1N5bWJvbCA9IHJvb3QuU3ltYm9sO1xuXG5cdGlmICh0eXBlb2YgX1N5bWJvbCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGlmIChfU3ltYm9sLm9ic2VydmFibGUpIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2wub2JzZXJ2YWJsZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0ID0gX1N5bWJvbCgnb2JzZXJ2YWJsZScpO1xuXHRcdFx0X1N5bWJvbC5vYnNlcnZhYmxlID0gcmVzdWx0O1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXN1bHQgPSAnQEBvYnNlcnZhYmxlJztcblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59OyIsInZhciBuZXh0VGljayA9IHJlcXVpcmUoJ3Byb2Nlc3MvYnJvd3Nlci5qcycpLm5leHRUaWNrO1xudmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGltbWVkaWF0ZUlkcyA9IHt9O1xudmFyIG5leHRJbW1lZGlhdGVJZCA9IDA7XG5cbi8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cbmV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFyVGltZW91dCk7XG59O1xuZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRJbnRlcnZhbCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhckludGVydmFsKTtcbn07XG5leHBvcnRzLmNsZWFyVGltZW91dCA9XG5leHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbih0aW1lb3V0KSB7IHRpbWVvdXQuY2xvc2UoKTsgfTtcblxuZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuICB0aGlzLl9pZCA9IGlkO1xuICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcbn1cblRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2NsZWFyRm4uY2FsbCh3aW5kb3csIHRoaXMuX2lkKTtcbn07XG5cbi8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuZXhwb3J0cy5lbnJvbGwgPSBmdW5jdGlvbihpdGVtLCBtc2Vjcykge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG59O1xuXG5leHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gLTE7XG59O1xuXG5leHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cbiAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG4gIGlmIChtc2VjcyA+PSAwKSB7XG4gICAgaXRlbS5faWRsZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gb25UaW1lb3V0KCkge1xuICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcbiAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG4gICAgfSwgbXNlY3MpO1xuICB9XG59O1xuXG4vLyBUaGF0J3Mgbm90IGhvdyBub2RlLmpzIGltcGxlbWVudHMgaXQgYnV0IHRoZSBleHBvc2VkIGFwaSBpcyB0aGUgc2FtZS5cbmV4cG9ydHMuc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gc2V0SW1tZWRpYXRlIDogZnVuY3Rpb24oZm4pIHtcbiAgdmFyIGlkID0gbmV4dEltbWVkaWF0ZUlkKys7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aCA8IDIgPyBmYWxzZSA6IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBpbW1lZGlhdGVJZHNbaWRdID0gdHJ1ZTtcblxuICBuZXh0VGljayhmdW5jdGlvbiBvbk5leHRUaWNrKCkge1xuICAgIGlmIChpbW1lZGlhdGVJZHNbaWRdKSB7XG4gICAgICAvLyBmbi5jYWxsKCkgaXMgZmFzdGVyIHNvIHdlIG9wdGltaXplIGZvciB0aGUgY29tbW9uIHVzZS1jYXNlXG4gICAgICAvLyBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2NhbGwtYXBwbHktc2VndVxuICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbi5jYWxsKG51bGwpO1xuICAgICAgfVxuICAgICAgLy8gUHJldmVudCBpZHMgZnJvbSBsZWFraW5nXG4gICAgICBleHBvcnRzLmNsZWFySW1tZWRpYXRlKGlkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpZDtcbn07XG5cbmV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSB0eXBlb2YgY2xlYXJJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IGNsZWFySW1tZWRpYXRlIDogZnVuY3Rpb24oaWQpIHtcbiAgZGVsZXRlIGltbWVkaWF0ZUlkc1tpZF07XG59OyIsIlwidXNlIHN0cmljdFwiO1xuZnVuY3Rpb24gX19leHBvcnQobSkge1xuICAgIGZvciAodmFyIHAgaW4gbSkgaWYgKCFleHBvcnRzLmhhc093blByb3BlcnR5KHApKSBleHBvcnRzW3BdID0gbVtwXTtcbn1cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbl9fZXhwb3J0KHJlcXVpcmUoXCIuL3NlbGVjdG9yUGFyc2VyXCIpKTtcbnZhciBtYXRjaGVzXzEgPSByZXF1aXJlKFwiLi9tYXRjaGVzXCIpO1xuZXhwb3J0cy5jcmVhdGVNYXRjaGVzID0gbWF0Y2hlc18xLmNyZWF0ZU1hdGNoZXM7XG52YXIgcXVlcnlTZWxlY3Rvcl8xID0gcmVxdWlyZShcIi4vcXVlcnlTZWxlY3RvclwiKTtcbmV4cG9ydHMuY3JlYXRlUXVlcnlTZWxlY3RvciA9IHF1ZXJ5U2VsZWN0b3JfMS5jcmVhdGVRdWVyeVNlbGVjdG9yO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW5kZXguanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoXCIuL3NlbGVjdG9yUGFyc2VyXCIpO1xuZnVuY3Rpb24gY3JlYXRlTWF0Y2hlcyhvcHRzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG1hdGNoZXMoc2VsZWN0b3IsIG5vZGUpIHtcbiAgICAgICAgdmFyIF9hID0gdHlwZW9mIHNlbGVjdG9yID09PSAnb2JqZWN0JyA/IHNlbGVjdG9yIDogc2VsZWN0b3JQYXJzZXJfMS5wYXJzZVNlbGVjdG9yKHNlbGVjdG9yKSwgdGFnID0gX2EudGFnLCBpZCA9IF9hLmlkLCBjbGFzc0xpc3QgPSBfYS5jbGFzc0xpc3QsIGF0dHJpYnV0ZXMgPSBfYS5hdHRyaWJ1dGVzLCBuZXh0U2VsZWN0b3IgPSBfYS5uZXh0U2VsZWN0b3IsIHBzZXVkb3MgPSBfYS5wc2V1ZG9zO1xuICAgICAgICBpZiAobmV4dFNlbGVjdG9yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbWF0Y2hlcyBjYW4gb25seSBwcm9jZXNzIHNlbGVjdG9ycyB0aGF0IHRhcmdldCBhIHNpbmdsZSBlbGVtZW50Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRhZyAmJiB0YWcudG9Mb3dlckNhc2UoKSAhPT0gb3B0cy50YWcobm9kZSkudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpZCAmJiBpZCAhPT0gb3B0cy5pZChub2RlKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHZhciBjbGFzc2VzID0gb3B0cy5jbGFzc05hbWUobm9kZSkuc3BsaXQoJyAnKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjbGFzc0xpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChjbGFzc2VzLmluZGV4T2YoY2xhc3NMaXN0W2ldKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICAgICAgICAgIHZhciBhdHRyID0gb3B0cy5hdHRyKG5vZGUsIGtleSk7XG4gICAgICAgICAgICB2YXIgdCA9IGF0dHJpYnV0ZXNba2V5XVswXTtcbiAgICAgICAgICAgIHZhciB2ID0gYXR0cmlidXRlc1trZXldWzFdO1xuICAgICAgICAgICAgaWYgKGF0dHIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0ID09PSAnaGFzJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQgPT09ICdleGFjdCcgJiYgYXR0ciAhPT0gdikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHQgIT09ICdleGFjdCcpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHYgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQWxsIG5vbi1zdHJpbmcgdmFsdWVzIGhhdmUgdG8gYmUgYW4gZXhhY3QgbWF0Y2gnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdzdGFydHNXaXRoJyAmJiAhYXR0ci5zdGFydHNXaXRoKHYpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdlbmRzV2l0aCcgJiYgIWF0dHIuZW5kc1dpdGgodikpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ2NvbnRhaW5zJyAmJiBhdHRyLmluZGV4T2YodikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICd3aGl0ZXNwYWNlJyAmJiBhdHRyLnNwbGl0KCcgJykuaW5kZXhPZih2KSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ2Rhc2gnICYmIGF0dHIuc3BsaXQoJy0nKS5pbmRleE9mKHYpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcHNldWRvcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIF9iID0gcHNldWRvc1tpXSwgdCA9IF9iWzBdLCBkYXRhID0gX2JbMV07XG4gICAgICAgICAgICBpZiAodCA9PT0gJ2NvbnRhaW5zJyAmJiBkYXRhICE9PSBvcHRzLmNvbnRlbnRzKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHQgPT09ICdlbXB0eScgJiZcbiAgICAgICAgICAgICAgICAob3B0cy5jb250ZW50cyhub2RlKSB8fCBvcHRzLmNoaWxkcmVuKG5vZGUpLmxlbmd0aCAhPT0gMCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodCA9PT0gJ3Jvb3QnICYmIG9wdHMucGFyZW50KG5vZGUpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodC5pbmRleE9mKCdjaGlsZCcpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGlmICghb3B0cy5wYXJlbnQobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgc2libGluZ3MgPSBvcHRzLmNoaWxkcmVuKG9wdHMucGFyZW50KG5vZGUpKTtcbiAgICAgICAgICAgICAgICBpZiAodCA9PT0gJ2ZpcnN0LWNoaWxkJyAmJiBzaWJsaW5ncy5pbmRleE9mKG5vZGUpICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdsYXN0LWNoaWxkJyAmJlxuICAgICAgICAgICAgICAgICAgICBzaWJsaW5ncy5pbmRleE9mKG5vZGUpICE9PSBzaWJsaW5ncy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHQgPT09ICdudGgtY2hpbGQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZWdleCA9IC8oW1xcKy1dPykoXFxkKikobj8pKFxcK1xcZCspPy87XG4gICAgICAgICAgICAgICAgICAgIHZhciBwYXJzZVJlc3VsdCA9IHJlZ2V4LmV4ZWMoZGF0YSkuc2xpY2UoMSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHNpYmxpbmdzLmluZGV4T2Yobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghcGFyc2VSZXN1bHRbMF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlUmVzdWx0WzBdID0gJysnO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHZhciBmYWN0b3IgPSBwYXJzZVJlc3VsdFsxXVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBwYXJzZUludChwYXJzZVJlc3VsdFswXSArIHBhcnNlUmVzdWx0WzFdKVxuICAgICAgICAgICAgICAgICAgICAgICAgOiB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhZGQgPSBwYXJzZUludChwYXJzZVJlc3VsdFszXSB8fCAnMCcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmFjdG9yICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJzZVJlc3VsdFsyXSA9PT0gJ24nICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleCAlIGZhY3RvciAhPT0gYWRkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIWZhY3RvciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyc2VSZXN1bHRbMl0gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICgocGFyc2VSZXN1bHRbMF0gPT09ICcrJyAmJiBpbmRleCAtIGFkZCA8IDApIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhcnNlUmVzdWx0WzBdID09PSAnLScgJiYgaW5kZXggLSBhZGQgPj0gMCkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIXBhcnNlUmVzdWx0WzJdICYmIGZhY3RvciAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXggIT09IGZhY3RvciAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xufVxuZXhwb3J0cy5jcmVhdGVNYXRjaGVzID0gY3JlYXRlTWF0Y2hlcztcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPW1hdGNoZXMuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG52YXIgc2VsZWN0b3JQYXJzZXJfMSA9IHJlcXVpcmUoXCIuL3NlbGVjdG9yUGFyc2VyXCIpO1xudmFyIG1hdGNoZXNfMSA9IHJlcXVpcmUoXCIuL21hdGNoZXNcIik7XG5mdW5jdGlvbiBjcmVhdGVRdWVyeVNlbGVjdG9yKG9wdGlvbnMsIG1hdGNoZXMpIHtcbiAgICB2YXIgX21hdGNoZXMgPSBtYXRjaGVzIHx8IG1hdGNoZXNfMS5jcmVhdGVNYXRjaGVzKG9wdGlvbnMpO1xuICAgIGZ1bmN0aW9uIGZpbmRTdWJ0cmVlKHNlbGVjdG9yLCBkZXB0aCwgbm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbiA9IF9tYXRjaGVzKHNlbGVjdG9yLCBub2RlKTtcbiAgICAgICAgdmFyIG1hdGNoZWQgPSBuID8gKHR5cGVvZiBuID09PSAnb2JqZWN0JyA/IFtuXSA6IFtub2RlXSkgOiBbXTtcbiAgICAgICAgaWYgKGRlcHRoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbWF0Y2hlZDtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2hpbGRNYXRjaGVkID0gb3B0aW9uc1xuICAgICAgICAgICAgLmNoaWxkcmVuKG5vZGUpXG4gICAgICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChjKSB7IHJldHVybiB0eXBlb2YgYyAhPT0gJ3N0cmluZyc7IH0pXG4gICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChjKSB7IHJldHVybiBmaW5kU3VidHJlZShzZWxlY3RvciwgZGVwdGggLSAxLCBjKTsgfSlcbiAgICAgICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgY3VycikgeyByZXR1cm4gYWNjLmNvbmNhdChjdXJyKTsgfSwgW10pO1xuICAgICAgICByZXR1cm4gbWF0Y2hlZC5jb25jYXQoY2hpbGRNYXRjaGVkKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZmluZFNpYmxpbmcoc2VsZWN0b3IsIG5leHQsIG5vZGUpIHtcbiAgICAgICAgaWYgKCFub2RlIHx8IG9wdGlvbnMucGFyZW50KG5vZGUpID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgcmVzdWx0cyA9IFtdO1xuICAgICAgICB2YXIgc2libGluZ3MgPSBvcHRpb25zLmNoaWxkcmVuKG9wdGlvbnMucGFyZW50KG5vZGUpKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHNpYmxpbmdzLmluZGV4T2Yobm9kZSkgKyAxOyBpIDwgc2libGluZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc2libGluZ3NbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbiA9IF9tYXRjaGVzKHNlbGVjdG9yLCBzaWJsaW5nc1tpXSk7XG4gICAgICAgICAgICBpZiAobikge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbiA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKG4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHNpYmxpbmdzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobmV4dCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gcXVlcnlTZWxlY3RvcihzZWxlY3Rvciwgbm9kZSkge1xuICAgICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2VsID0gdHlwZW9mIHNlbGVjdG9yID09PSAnb2JqZWN0JyA/IHNlbGVjdG9yIDogc2VsZWN0b3JQYXJzZXJfMS5wYXJzZVNlbGVjdG9yKHNlbGVjdG9yKTtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbbm9kZV07XG4gICAgICAgIHZhciBjdXJyZW50U2VsZWN0b3IgPSBzZWw7XG4gICAgICAgIHZhciBjdXJyZW50Q29tYmluYXRvciA9ICdzdWJ0cmVlJztcbiAgICAgICAgdmFyIHRhaWwgPSB1bmRlZmluZWQ7XG4gICAgICAgIHZhciBfbG9vcF8xID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGFpbCA9IGN1cnJlbnRTZWxlY3Rvci5uZXh0U2VsZWN0b3I7XG4gICAgICAgICAgICBjdXJyZW50U2VsZWN0b3IubmV4dFNlbGVjdG9yID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRDb21iaW5hdG9yID09PSAnc3VidHJlZScgfHxcbiAgICAgICAgICAgICAgICBjdXJyZW50Q29tYmluYXRvciA9PT0gJ2NoaWxkJykge1xuICAgICAgICAgICAgICAgIHZhciBkZXB0aF8xID0gY3VycmVudENvbWJpbmF0b3IgPT09ICdzdWJ0cmVlJyA/IEluZmluaXR5IDogMTtcbiAgICAgICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChuKSB7IHJldHVybiBmaW5kU3VidHJlZShjdXJyZW50U2VsZWN0b3IsIGRlcHRoXzEsIG4pOyB9KVxuICAgICAgICAgICAgICAgICAgICAucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGN1cnIpIHsgcmV0dXJuIGFjYy5jb25jYXQoY3Vycik7IH0sIFtdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhciBuZXh0XzEgPSBjdXJyZW50Q29tYmluYXRvciA9PT0gJ25leHRTaWJsaW5nJztcbiAgICAgICAgICAgICAgICByZXN1bHRzID0gcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICAubWFwKGZ1bmN0aW9uIChuKSB7IHJldHVybiBmaW5kU2libGluZyhjdXJyZW50U2VsZWN0b3IsIG5leHRfMSwgbik7IH0pXG4gICAgICAgICAgICAgICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgY3VycikgeyByZXR1cm4gYWNjLmNvbmNhdChjdXJyKTsgfSwgW10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRhaWwpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50U2VsZWN0b3IgPSB0YWlsWzFdO1xuICAgICAgICAgICAgICAgIGN1cnJlbnRDb21iaW5hdG9yID0gdGFpbFswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgZG8ge1xuICAgICAgICAgICAgX2xvb3BfMSgpO1xuICAgICAgICB9IHdoaWxlICh0YWlsICE9PSB1bmRlZmluZWQpO1xuICAgICAgICByZXR1cm4gcmVzdWx0cztcbiAgICB9O1xufVxuZXhwb3J0cy5jcmVhdGVRdWVyeVNlbGVjdG9yID0gY3JlYXRlUXVlcnlTZWxlY3Rvcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXF1ZXJ5U2VsZWN0b3IuanMubWFwIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBJREVOVCA9ICdbXFxcXHctXSsnO1xudmFyIFNQQUNFID0gJ1sgXFx0XSonO1xudmFyIFZBTFVFID0gXCJbXlxcXFxdXStcIjtcbnZhciBDTEFTUyA9IFwiKD86XFxcXC5cIiArIElERU5UICsgXCIpXCI7XG52YXIgSUQgPSBcIig/OiNcIiArIElERU5UICsgXCIpXCI7XG52YXIgT1AgPSBcIig/Oj18XFxcXCQ9fFxcXFxePXxcXFxcKj18fj18XFxcXHw9KVwiO1xudmFyIEFUVFIgPSBcIig/OlxcXFxbXCIgKyBTUEFDRSArIElERU5UICsgU1BBQ0UgKyBcIig/OlwiICsgT1AgKyBTUEFDRSArIFZBTFVFICsgU1BBQ0UgKyBcIik/XFxcXF0pXCI7XG52YXIgU1VCVFJFRSA9IFwiKD86WyBcXHRdKylcIjtcbnZhciBDSElMRCA9IFwiKD86XCIgKyBTUEFDRSArIFwiKD4pXCIgKyBTUEFDRSArIFwiKVwiO1xudmFyIE5FWFRfU0lCTElORyA9IFwiKD86XCIgKyBTUEFDRSArIFwiKFxcXFwrKVwiICsgU1BBQ0UgKyBcIilcIjtcbnZhciBTSUJMSU5HID0gXCIoPzpcIiArIFNQQUNFICsgXCIofilcIiArIFNQQUNFICsgXCIpXCI7XG52YXIgQ09NQklOQVRPUiA9IFwiKD86XCIgKyBTVUJUUkVFICsgXCJ8XCIgKyBDSElMRCArIFwifFwiICsgTkVYVF9TSUJMSU5HICsgXCJ8XCIgKyBTSUJMSU5HICsgXCIpXCI7XG52YXIgQ09OVEFJTlMgPSBcImNvbnRhaW5zXFxcXChcXFwiW15cXFwiXSpcXFwiXFxcXClcIjtcbnZhciBGT1JNVUxBID0gXCIoPzpldmVufG9kZHxcXFxcZCooPzotP24oPzpcXFxcK1xcXFxkKyk/KT8pXCI7XG52YXIgTlRIX0NISUxEID0gXCJudGgtY2hpbGRcXFxcKFwiICsgRk9STVVMQSArIFwiXFxcXClcIjtcbnZhciBQU0VVRE8gPSBcIjooPzpmaXJzdC1jaGlsZHxsYXN0LWNoaWxkfFwiICsgTlRIX0NISUxEICsgXCJ8ZW1wdHl8cm9vdHxcIiArIENPTlRBSU5TICsgXCIpXCI7XG52YXIgVEFHID0gXCIoOj9cIiArIElERU5UICsgXCIpP1wiO1xudmFyIFRPS0VOUyA9IENMQVNTICsgXCJ8XCIgKyBJRCArIFwifFwiICsgQVRUUiArIFwifFwiICsgUFNFVURPICsgXCJ8XCIgKyBDT01CSU5BVE9SO1xudmFyIGNvbWJpbmF0b3JSZWdleCA9IG5ldyBSZWdFeHAoXCJeXCIgKyBDT01CSU5BVE9SICsgXCIkXCIpO1xuLyoqXG4gKiBQYXJzZXMgYSBjc3Mgc2VsZWN0b3IgaW50byBhIG5vcm1hbGl6ZWQgb2JqZWN0LlxuICogRXhwZWN0cyBhIHNlbGVjdG9yIGZvciBhIHNpbmdsZSBlbGVtZW50IG9ubHksIG5vIGA+YCBvciB0aGUgbGlrZSFcbiAqL1xuZnVuY3Rpb24gcGFyc2VTZWxlY3RvcihzZWxlY3Rvcikge1xuICAgIHZhciBzZWwgPSBzZWxlY3Rvci50cmltKCk7XG4gICAgdmFyIHRhZ1JlZ2V4ID0gbmV3IFJlZ0V4cChUQUcsICd5Jyk7XG4gICAgdmFyIHRhZyA9IHRhZ1JlZ2V4LmV4ZWMoc2VsKVswXTtcbiAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKFRPS0VOUywgJ3knKTtcbiAgICByZWdleC5sYXN0SW5kZXggPSB0YWdSZWdleC5sYXN0SW5kZXg7XG4gICAgdmFyIG1hdGNoZXMgPSBbXTtcbiAgICB2YXIgbmV4dFNlbGVjdG9yID0gdW5kZWZpbmVkO1xuICAgIHZhciBsYXN0Q29tYmluYXRvciA9IHVuZGVmaW5lZDtcbiAgICB2YXIgaW5kZXggPSAtMTtcbiAgICB3aGlsZSAocmVnZXgubGFzdEluZGV4IDwgc2VsLmxlbmd0aCkge1xuICAgICAgICB2YXIgbWF0Y2ggPSByZWdleC5leGVjKHNlbCk7XG4gICAgICAgIGlmICghbWF0Y2ggJiYgbGFzdENvbWJpbmF0b3IgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXJzZSBlcnJvciwgaW52YWxpZCBzZWxlY3RvcicpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG1hdGNoICYmIGNvbWJpbmF0b3JSZWdleC50ZXN0KG1hdGNoWzBdKSkge1xuICAgICAgICAgICAgdmFyIGNvbWIgPSBjb21iaW5hdG9yUmVnZXguZXhlYyhtYXRjaFswXSlbMF07XG4gICAgICAgICAgICBsYXN0Q29tYmluYXRvciA9IGNvbWI7XG4gICAgICAgICAgICBpbmRleCA9IHJlZ2V4Lmxhc3RJbmRleDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChsYXN0Q29tYmluYXRvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgbmV4dFNlbGVjdG9yID0gW1xuICAgICAgICAgICAgICAgICAgICBnZXRDb21iaW5hdG9yKGxhc3RDb21iaW5hdG9yKSxcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTZWxlY3RvcihzZWwuc3Vic3RyaW5nKGluZGV4KSlcbiAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbWF0Y2hlcy5wdXNoKG1hdGNoWzBdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB2YXIgY2xhc3NMaXN0ID0gbWF0Y2hlc1xuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN0YXJ0c1dpdGgoJy4nKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdWJzdHJpbmcoMSk7IH0pO1xuICAgIHZhciBpZHMgPSBtYXRjaGVzLmZpbHRlcihmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdGFydHNXaXRoKCcjJyk7IH0pLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcy5zdWJzdHJpbmcoMSk7IH0pO1xuICAgIGlmIChpZHMubGVuZ3RoID4gMSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgc2VsZWN0b3IsIG9ubHkgb25lIGlkIGlzIGFsbG93ZWQnKTtcbiAgICB9XG4gICAgdmFyIHBvc3Rwcm9jZXNzUmVnZXggPSBuZXcgUmVnRXhwKFwiKFwiICsgSURFTlQgKyBcIilcIiArIFNQQUNFICsgXCIoXCIgKyBPUCArIFwiKT9cIiArIFNQQUNFICsgXCIoXCIgKyBWQUxVRSArIFwiKT9cIik7XG4gICAgdmFyIGF0dHJzID0gbWF0Y2hlc1xuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN0YXJ0c1dpdGgoJ1snKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcG9zdHByb2Nlc3NSZWdleC5leGVjKHMpLnNsaWNlKDEsIDQpOyB9KVxuICAgICAgICAubWFwKGZ1bmN0aW9uIChfYSkge1xuICAgICAgICB2YXIgYXR0ciA9IF9hWzBdLCBvcCA9IF9hWzFdLCB2YWwgPSBfYVsyXTtcbiAgICAgICAgdmFyIF9iO1xuICAgICAgICByZXR1cm4gKF9iID0ge30sXG4gICAgICAgICAgICBfYlthdHRyXSA9IFtnZXRPcChvcCksIHZhbCA/IHBhcnNlQXR0clZhbHVlKHZhbCkgOiB2YWxdLFxuICAgICAgICAgICAgX2IpO1xuICAgIH0pXG4gICAgICAgIC5yZWR1Y2UoZnVuY3Rpb24gKGFjYywgY3VycikgeyByZXR1cm4gKF9fYXNzaWduKHt9LCBhY2MsIGN1cnIpKTsgfSwge30pO1xuICAgIHZhciBwc2V1ZG9zID0gbWF0Y2hlc1xuICAgICAgICAuZmlsdGVyKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnN0YXJ0c1dpdGgoJzonKTsgfSlcbiAgICAgICAgLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcG9zdFByb2Nlc3NQc2V1ZG9zKHMuc3Vic3RyaW5nKDEpKTsgfSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgaWQ6IGlkc1swXSB8fCAnJyxcbiAgICAgICAgdGFnOiB0YWcsXG4gICAgICAgIGNsYXNzTGlzdDogY2xhc3NMaXN0LFxuICAgICAgICBhdHRyaWJ1dGVzOiBhdHRycyxcbiAgICAgICAgbmV4dFNlbGVjdG9yOiBuZXh0U2VsZWN0b3IsXG4gICAgICAgIHBzZXVkb3M6IHBzZXVkb3NcbiAgICB9O1xufVxuZXhwb3J0cy5wYXJzZVNlbGVjdG9yID0gcGFyc2VTZWxlY3RvcjtcbmZ1bmN0aW9uIHBhcnNlQXR0clZhbHVlKHYpIHtcbiAgICBpZiAodi5zdGFydHNXaXRoKCdcIicpKSB7XG4gICAgICAgIHJldHVybiB2LnNsaWNlKDEsIC0xKTtcbiAgICB9XG4gICAgaWYgKHYgPT09IFwidHJ1ZVwiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodiA9PT0gXCJmYWxzZVwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyIGYgPSBwYXJzZUZsb2F0KHYpO1xuICAgIGlmIChpc05hTihmKSkge1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG4gICAgcmV0dXJuIGY7XG59XG5mdW5jdGlvbiBwb3N0UHJvY2Vzc1BzZXVkb3Moc2VsKSB7XG4gICAgaWYgKHNlbCA9PT0gJ2ZpcnN0LWNoaWxkJyB8fFxuICAgICAgICBzZWwgPT09ICdsYXN0LWNoaWxkJyB8fFxuICAgICAgICBzZWwgPT09ICdyb290JyB8fFxuICAgICAgICBzZWwgPT09ICdlbXB0eScpIHtcbiAgICAgICAgcmV0dXJuIFtzZWwsIHVuZGVmaW5lZF07XG4gICAgfVxuICAgIGlmIChzZWwuc3RhcnRzV2l0aCgnY29udGFpbnMnKSkge1xuICAgICAgICB2YXIgdGV4dCA9IHNlbC5zbGljZSgxMCwgLTIpO1xuICAgICAgICByZXR1cm4gWydjb250YWlucycsIHRleHRdO1xuICAgIH1cbiAgICB2YXIgY29udGVudCA9IHNlbC5zbGljZSgxMCwgLTEpO1xuICAgIGlmIChjb250ZW50ID09PSAnZXZlbicpIHtcbiAgICAgICAgY29udGVudCA9ICcybic7XG4gICAgfVxuICAgIGlmIChjb250ZW50ID09PSAnb2RkJykge1xuICAgICAgICBjb250ZW50ID0gJzJuKzEnO1xuICAgIH1cbiAgICByZXR1cm4gWydudGgtY2hpbGQnLCBjb250ZW50XTtcbn1cbmZ1bmN0aW9uIGdldE9wKG9wKSB7XG4gICAgc3dpdGNoIChvcCkge1xuICAgICAgICBjYXNlICc9JzpcbiAgICAgICAgICAgIHJldHVybiAnZXhhY3QnO1xuICAgICAgICBjYXNlICdePSc6XG4gICAgICAgICAgICByZXR1cm4gJ3N0YXJ0c1dpdGgnO1xuICAgICAgICBjYXNlICckPSc6XG4gICAgICAgICAgICByZXR1cm4gJ2VuZHNXaXRoJztcbiAgICAgICAgY2FzZSAnKj0nOlxuICAgICAgICAgICAgcmV0dXJuICdjb250YWlucyc7XG4gICAgICAgIGNhc2UgJ349JzpcbiAgICAgICAgICAgIHJldHVybiAnd2hpdGVzcGFjZSc7XG4gICAgICAgIGNhc2UgJ3w9JzpcbiAgICAgICAgICAgIHJldHVybiAnZGFzaCc7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJ2hhcyc7XG4gICAgfVxufVxuZnVuY3Rpb24gZ2V0Q29tYmluYXRvcihjb21iKSB7XG4gICAgc3dpdGNoIChjb21iLnRyaW0oKSkge1xuICAgICAgICBjYXNlICc+JzpcbiAgICAgICAgICAgIHJldHVybiAnY2hpbGQnO1xuICAgICAgICBjYXNlICcrJzpcbiAgICAgICAgICAgIHJldHVybiAnbmV4dFNpYmxpbmcnO1xuICAgICAgICBjYXNlICd+JzpcbiAgICAgICAgICAgIHJldHVybiAnc2libGluZyc7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gJ3N1YnRyZWUnO1xuICAgIH1cbn1cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXNlbGVjdG9yUGFyc2VyLmpzLm1hcCIsImltcG9ydCB7U3RyZWFtLCBJbnRlcm5hbFByb2R1Y2VyLCBJbnRlcm5hbExpc3RlbmVyLCBPdXRTZW5kZXJ9IGZyb20gJy4uL2luZGV4JztcblxuY2xhc3MgQ29uY2F0UHJvZHVjZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+LCBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdjb25jYXQnO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD4gPSBudWxsIGFzIGFueTtcbiAgcHJpdmF0ZSBpOiBudW1iZXIgPSAwO1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBzdHJlYW1zOiBBcnJheTxTdHJlYW08VD4+KSB7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLnN0cmVhbXNbdGhpcy5pXS5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3Qgc3RyZWFtcyA9IHRoaXMuc3RyZWFtcztcbiAgICBpZiAodGhpcy5pIDwgc3RyZWFtcy5sZW5ndGgpIHtcbiAgICAgIHN0cmVhbXNbdGhpcy5pXS5fcmVtb3ZlKHRoaXMpO1xuICAgIH1cbiAgICB0aGlzLmkgPSAwO1xuICAgIHRoaXMub3V0ID0gbnVsbCBhcyBhbnk7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKCF1KSByZXR1cm47XG4gICAgY29uc3Qgc3RyZWFtcyA9IHRoaXMuc3RyZWFtcztcbiAgICBzdHJlYW1zW3RoaXMuaV0uX3JlbW92ZSh0aGlzKTtcbiAgICBpZiAoKyt0aGlzLmkgPCBzdHJlYW1zLmxlbmd0aCkge1xuICAgICAgc3RyZWFtc1t0aGlzLmldLl9hZGQodGhpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQdXRzIG9uZSBzdHJlYW0gYWZ0ZXIgdGhlIG90aGVyLiAqY29uY2F0KiBpcyBhIGZhY3RvcnkgdGhhdCB0YWtlcyBtdWx0aXBsZVxuICogc3RyZWFtcyBhcyBhcmd1bWVudHMsIGFuZCBzdGFydHMgdGhlIGBuKzFgLXRoIHN0cmVhbSBvbmx5IHdoZW4gdGhlIGBuYC10aFxuICogc3RyZWFtIGhhcyBjb21wbGV0ZWQuIEl0IGNvbmNhdGVuYXRlcyB0aG9zZSBzdHJlYW1zIHRvZ2V0aGVyLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tMi0tLTMtLS00LXxcbiAqIC4uLi4uLi4uLi4uLi4uLi0tYS1iLWMtLWQtfFxuICogICAgICAgICAgIGNvbmNhdFxuICogLS0xLS0yLS0tMy0tLTQtLS1hLWItYy0tZC18XG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgY29uY2F0IGZyb20gJ3hzdHJlYW0vZXh0cmEvY29uY2F0J1xuICpcbiAqIGNvbnN0IHN0cmVhbUEgPSB4cy5vZignYScsICdiJywgJ2MnKVxuICogY29uc3Qgc3RyZWFtQiA9IHhzLm9mKDEwLCAyMCwgMzApXG4gKiBjb25zdCBzdHJlYW1DID0geHMub2YoJ1gnLCAnWScsICdaJylcbiAqXG4gKiBjb25zdCBvdXRwdXRTdHJlYW0gPSBjb25jYXQoc3RyZWFtQSwgc3RyZWFtQiwgc3RyZWFtQylcbiAqXG4gKiBvdXRwdXRTdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiAoeCkgPT4gY29uc29sZS5sb2coeCksXG4gKiAgIGVycm9yOiAoZXJyKSA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29uY2F0IGNvbXBsZXRlZCcpLFxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBmYWN0b3J5IHRydWVcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIGNvbmNhdGVuYXRlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIGNvbmNhdGVuYXRlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy4gVHdvXG4gKiBvciBtb3JlIHN0cmVhbXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gY29uY2F0PFQ+KC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxUPj4pOiBTdHJlYW08VD4ge1xuICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgQ29uY2F0UHJvZHVjZXIoc3RyZWFtcykpO1xufVxuIiwiaW1wb3J0IHtPcGVyYXRvciwgU3RyZWFtfSBmcm9tICcuLi9pbmRleCc7XG5jb25zdCBlbXB0eSA9IHt9O1xuXG5leHBvcnQgY2xhc3MgRHJvcFJlcGVhdHNPcGVyYXRvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZHJvcFJlcGVhdHMnO1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD4gPSBudWxsIGFzIGFueTtcbiAgcHVibGljIGlzRXE6ICh4OiBULCB5OiBUKSA9PiBib29sZWFuO1xuICBwcml2YXRlIHY6IFQgPSA8YW55PiBlbXB0eTtcblxuICBjb25zdHJ1Y3RvcihwdWJsaWMgaW5zOiBTdHJlYW08VD4sXG4gICAgICAgICAgICAgIGZuOiAoKHg6IFQsIHk6IFQpID0+IGJvb2xlYW4pIHwgdW5kZWZpbmVkKSB7XG4gICAgdGhpcy5pc0VxID0gZm4gPyBmbiA6ICh4LCB5KSA9PiB4ID09PSB5O1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBudWxsIGFzIGFueTtcbiAgICB0aGlzLnYgPSBlbXB0eSBhcyBhbnk7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIGNvbnN0IHYgPSB0aGlzLnY7XG4gICAgaWYgKHYgIT09IGVtcHR5ICYmIHRoaXMuaXNFcSh0LCB2KSkgcmV0dXJuO1xuICAgIHRoaXMudiA9IHQ7XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICghdSkgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAoIXUpIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBEcm9wcyBjb25zZWN1dGl2ZSBkdXBsaWNhdGUgdmFsdWVzIGluIGEgc3RyZWFtLlxuICpcbiAqIE1hcmJsZSBkaWFncmFtOlxuICpcbiAqIGBgYHRleHRcbiAqIC0tMS0tMi0tMS0tMS0tMS0tMi0tMy0tNC0tMy0tM3xcbiAqICAgICBkcm9wUmVwZWF0c1xuICogLS0xLS0yLS0xLS0tLS0tLS0yLS0zLS00LS0zLS0tfFxuICogYGBgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGRyb3BSZXBlYXRzIGZyb20gJ3hzdHJlYW0vZXh0cmEvZHJvcFJlcGVhdHMnXG4gKlxuICogY29uc3Qgc3RyZWFtID0geHMub2YoMSwgMiwgMSwgMSwgMSwgMiwgMywgNCwgMywgMylcbiAqICAgLmNvbXBvc2UoZHJvcFJlcGVhdHMoKSlcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqIGBgYFxuICpcbiAqIGBgYHRleHRcbiAqID4gMVxuICogPiAyXG4gKiA+IDFcbiAqID4gMlxuICogPiAzXG4gKiA+IDRcbiAqID4gM1xuICogPiBjb21wbGV0ZWRcbiAqIGBgYFxuICpcbiAqIEV4YW1wbGUgd2l0aCBhIGN1c3RvbSBpc0VxdWFsIGZ1bmN0aW9uOlxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgZHJvcFJlcGVhdHMgZnJvbSAneHN0cmVhbS9leHRyYS9kcm9wUmVwZWF0cydcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSB4cy5vZignYScsICdiJywgJ2EnLCAnQScsICdCJywgJ2InKVxuICogICAuY29tcG9zZShkcm9wUmVwZWF0cygoeCwgeSkgPT4geC50b0xvd2VyQ2FzZSgpID09PSB5LnRvTG93ZXJDYXNlKCkpKVxuICpcbiAqIHN0cmVhbS5hZGRMaXN0ZW5lcih7XG4gKiAgIG5leHQ6IGkgPT4gY29uc29sZS5sb2coaSksXG4gKiAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICogICBjb21wbGV0ZTogKCkgPT4gY29uc29sZS5sb2coJ2NvbXBsZXRlZCcpXG4gKiB9KVxuICogYGBgXG4gKlxuICogYGBgdGV4dFxuICogPiBhXG4gKiA+IGJcbiAqID4gYVxuICogPiBCXG4gKiA+IGNvbXBsZXRlZFxuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gaXNFcXVhbCBBbiBvcHRpb25hbCBmdW5jdGlvbiBvZiB0eXBlXG4gKiBgKHg6IFQsIHk6IFQpID0+IGJvb2xlYW5gIHRoYXQgdGFrZXMgYW4gZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGFuZFxuICogY2hlY2tzIGlmIGl0IGlzIGVxdWFsIHRvIHByZXZpb3VzIGV2ZW50LCBieSByZXR1cm5pbmcgYSBib29sZWFuLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkcm9wUmVwZWF0czxUPihpc0VxdWFsOiAoKHg6IFQsIHk6IFQpID0+IGJvb2xlYW4pIHwgdW5kZWZpbmVkID0gdm9pZCAwKTogKGluczogU3RyZWFtPFQ+KSA9PiBTdHJlYW08VD4ge1xuICByZXR1cm4gZnVuY3Rpb24gZHJvcFJlcGVhdHNPcGVyYXRvcihpbnM6IFN0cmVhbTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERyb3BSZXBlYXRzT3BlcmF0b3I8VD4oaW5zLCBpc0VxdWFsKSk7XG4gIH07XG59XG4iLCJpbXBvcnQge0ludGVybmFsTGlzdGVuZXIsIE9wZXJhdG9yLCBTdHJlYW19IGZyb20gJy4uL2luZGV4JztcblxuZXhwb3J0IGludGVyZmFjZSBTYW1wbGVDb21iaW5lU2lnbmF0dXJlIHtcbiAgKCk6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVF0+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMV0+O1xuICA8VDEsIFQyPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyXT47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUM10+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzLCBUNF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1Pik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUMywgVDQsIFQ1XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUMywgVDQsIFQ1LCBUNl0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogPFQ+KHM6IFN0cmVhbTxUPikgPT4gU3RyZWFtPFtULCBUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUN10+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4Pik6IDxUPihzOiBTdHJlYW08VD4pID0+IFN0cmVhbTxbVCwgVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4XT47XG4gICguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pOiAoczogU3RyZWFtPGFueT4pID0+IFN0cmVhbTxBcnJheTxhbnk+Pjtcbn1cblxuY29uc3QgTk8gPSB7fTtcblxuZXhwb3J0IGNsYXNzIFNhbXBsZUNvbWJpbmVMaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGk6IG51bWJlciwgcHJpdmF0ZSBwOiBTYW1wbGVDb21iaW5lT3BlcmF0b3I8YW55Pikge1xuICAgIHAuaWxzW2ldID0gdGhpcztcbiAgfVxuXG4gIF9uKHQ6IFQpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wO1xuICAgIGlmIChwLm91dCA9PT0gTk8pIHJldHVybjtcbiAgICBwLnVwKHQsIHRoaXMuaSk7XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIHRoaXMucC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgdGhpcy5wLmRvd24odGhpcy5pLCB0aGlzKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2FtcGxlQ29tYmluZU9wZXJhdG9yPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgQXJyYXk8YW55Pj4ge1xuICBwdWJsaWMgdHlwZSA9ICdzYW1wbGVDb21iaW5lJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3RoZXJzOiBBcnJheTxTdHJlYW08YW55Pj47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxhbnk+PjtcbiAgcHVibGljIGlsczogQXJyYXk8U2FtcGxlQ29tYmluZUxpc3RlbmVyPGFueT4+O1xuICBwdWJsaWMgTm46IG51bWJlcjsgLy8gKk4qdW1iZXIgb2Ygc3RyZWFtcyBzdGlsbCB0byBzZW5kICpuKmV4dFxuICBwdWJsaWMgdmFsczogQXJyYXk8YW55PjtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdGhlcnMgPSBzdHJlYW1zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PGFueT4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy5ObiA9IDA7XG4gICAgdGhpcy52YWxzID0gW107XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08QXJyYXk8YW55Pj4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5vdGhlcnM7XG4gICAgY29uc3QgbiA9IHRoaXMuTm4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCB2YWxzID0gdGhpcy52YWxzID0gbmV3IEFycmF5KG4pO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICB2YWxzW2ldID0gTk87XG4gICAgICBzW2ldLl9hZGQobmV3IFNhbXBsZUNvbWJpbmVMaXN0ZW5lcjxhbnk+KGksIHRoaXMpKTtcbiAgICB9XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLm90aGVycztcbiAgICBjb25zdCBuID0gcy5sZW5ndGg7XG4gICAgY29uc3QgaWxzID0gdGhpcy5pbHM7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykge1xuICAgICAgc1tpXS5fcmVtb3ZlKGlsc1tpXSk7XG4gICAgfVxuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPEFycmF5PGFueT4+O1xuICAgIHRoaXMudmFscyA9IFtdO1xuICAgIHRoaXMuaWxzID0gW107XG4gIH1cblxuICBfbih0OiBUKTogdm9pZCB7XG4gICAgY29uc3Qgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAodGhpcy5ObiA+IDApIHJldHVybjtcbiAgICBvdXQuX24oW3QsIC4uLnRoaXMudmFsc10pO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpOiB2b2lkIHtcbiAgICBjb25zdCBvdXQgPSB0aGlzLm91dDtcbiAgICBpZiAob3V0ID09PSBOTykgcmV0dXJuO1xuICAgIG91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgY29uc3Qgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBvdXQuX2MoKTtcbiAgfVxuXG4gIHVwKHQ6IGFueSwgaTogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgdiA9IHRoaXMudmFsc1tpXTtcbiAgICBpZiAodGhpcy5ObiA+IDAgJiYgdiA9PT0gTk8pIHtcbiAgICAgIHRoaXMuTm4tLTtcbiAgICB9XG4gICAgdGhpcy52YWxzW2ldID0gdDtcbiAgfVxuXG4gIGRvd24oaTogbnVtYmVyLCBsOiBTYW1wbGVDb21iaW5lTGlzdGVuZXI8YW55Pik6IHZvaWQge1xuICAgIHRoaXMub3RoZXJzW2ldLl9yZW1vdmUobCk7XG4gIH1cbn1cblxubGV0IHNhbXBsZUNvbWJpbmU6IFNhbXBsZUNvbWJpbmVTaWduYXR1cmU7XG5cbi8qKlxuICpcbiAqIENvbWJpbmVzIGEgc291cmNlIHN0cmVhbSB3aXRoIG11bHRpcGxlIG90aGVyIHN0cmVhbXMuIFRoZSByZXN1bHQgc3RyZWFtXG4gKiB3aWxsIGVtaXQgdGhlIGxhdGVzdCBldmVudHMgZnJvbSBhbGwgaW5wdXQgc3RyZWFtcywgYnV0IG9ubHkgd2hlbiB0aGVcbiAqIHNvdXJjZSBzdHJlYW0gZW1pdHMuXG4gKlxuICogSWYgdGhlIHNvdXJjZSwgb3IgYW55IGlucHV0IHN0cmVhbSwgdGhyb3dzIGFuIGVycm9yLCB0aGUgcmVzdWx0IHN0cmVhbVxuICogd2lsbCBwcm9wYWdhdGUgdGhlIGVycm9yLiBJZiBhbnkgaW5wdXQgc3RyZWFtcyBlbmQsIHRoZWlyIGZpbmFsIGVtaXR0ZWRcbiAqIHZhbHVlIHdpbGwgcmVtYWluIGluIHRoZSBhcnJheSBvZiBhbnkgc3Vic2VxdWVudCBldmVudHMgZnJvbSB0aGUgcmVzdWx0XG4gKiBzdHJlYW0uXG4gKlxuICogVGhlIHJlc3VsdCBzdHJlYW0gd2lsbCBvbmx5IGNvbXBsZXRlIHVwb24gY29tcGxldGlvbiBvZiB0aGUgc291cmNlIHN0cmVhbS5cbiAqXG4gKiBNYXJibGUgZGlhZ3JhbTpcbiAqXG4gKiBgYGB0ZXh0XG4gKiAtLTEtLS0tMi0tLS0tMy0tLS0tLS0tNC0tLSAoc291cmNlKVxuICogLS0tLWEtLS0tLWItLS0tLWMtLWQtLS0tLS0gKG90aGVyKVxuICogICAgICBzYW1wbGVDb21iaW5lXG4gKiAtLS0tLS0tMmEtLS0tM2ItLS0tLS0tNGQtLVxuICogYGBgXG4gKlxuICogRXhhbXBsZXM6XG4gKlxuICogYGBganNcbiAqIGltcG9ydCBzYW1wbGVDb21iaW5lIGZyb20gJ3hzdHJlYW0vZXh0cmEvc2FtcGxlQ29tYmluZSdcbiAqIGltcG9ydCB4cyBmcm9tICd4c3RyZWFtJ1xuICpcbiAqIGNvbnN0IHNhbXBsZXIgPSB4cy5wZXJpb2RpYygxMDAwKS50YWtlKDMpXG4gKiBjb25zdCBvdGhlciA9IHhzLnBlcmlvZGljKDEwMClcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBzYW1wbGVyLmNvbXBvc2Uoc2FtcGxlQ29tYmluZShvdGhlcikpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IFswLCA4XVxuICogPiBbMSwgMThdXG4gKiA+IFsyLCAyOF1cbiAqIGBgYFxuICpcbiAqIGBgYGpzXG4gKiBpbXBvcnQgc2FtcGxlQ29tYmluZSBmcm9tICd4c3RyZWFtL2V4dHJhL3NhbXBsZUNvbWJpbmUnXG4gKiBpbXBvcnQgeHMgZnJvbSAneHN0cmVhbSdcbiAqXG4gKiBjb25zdCBzYW1wbGVyID0geHMucGVyaW9kaWMoMTAwMCkudGFrZSgzKVxuICogY29uc3Qgb3RoZXIgPSB4cy5wZXJpb2RpYygxMDApLnRha2UoMilcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBzYW1wbGVyLmNvbXBvc2Uoc2FtcGxlQ29tYmluZShvdGhlcikpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IFswLCAxXVxuICogPiBbMSwgMV1cbiAqID4gWzIsIDFdXG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gey4uLlN0cmVhbX0gc3RyZWFtcyBPbmUgb3IgbW9yZSBzdHJlYW1zIHRvIGNvbWJpbmUgd2l0aCB0aGUgc2FtcGxlclxuICogc3RyZWFtLlxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5zYW1wbGVDb21iaW5lID0gZnVuY3Rpb24gc2FtcGxlQ29tYmluZSguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHNhbXBsZUNvbWJpbmVPcGVyYXRvcihzYW1wbGVyOiBTdHJlYW08YW55Pik6IFN0cmVhbTxBcnJheTxhbnk+PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08QXJyYXk8YW55Pj4obmV3IFNhbXBsZUNvbWJpbmVPcGVyYXRvcihzYW1wbGVyLCBzdHJlYW1zKSk7XG4gIH07XG59IGFzIFNhbXBsZUNvbWJpbmVTaWduYXR1cmU7XG5cbmV4cG9ydCBkZWZhdWx0IHNhbXBsZUNvbWJpbmU7IiwiaW1wb3J0ICQkb2JzZXJ2YWJsZSBmcm9tICdzeW1ib2wtb2JzZXJ2YWJsZSc7XG5cbmNvbnN0IE5PID0ge307XG5mdW5jdGlvbiBub29wKCkge31cblxuZnVuY3Rpb24gY3A8VD4oYTogQXJyYXk8VD4pOiBBcnJheTxUPiB7XG4gIGNvbnN0IGwgPSBhLmxlbmd0aDtcbiAgY29uc3QgYiA9IEFycmF5KGwpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGw7ICsraSkgYltpXSA9IGFbaV07XG4gIHJldHVybiBiO1xufVxuXG5mdW5jdGlvbiBhbmQ8VD4oZjE6ICh0OiBUKSA9PiBib29sZWFuLCBmMjogKHQ6IFQpID0+IGJvb2xlYW4pOiAodDogVCkgPT4gYm9vbGVhbiB7XG4gIHJldHVybiBmdW5jdGlvbiBhbmRGbih0OiBUKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGYxKHQpICYmIGYyKHQpO1xuICB9O1xufVxuXG5pbnRlcmZhY2UgRkNvbnRhaW5lcjxULCBSPiB7XG4gIGYodDogVCk6IFI7XG59XG5cbmZ1bmN0aW9uIF90cnk8VCwgUj4oYzogRkNvbnRhaW5lcjxULCBSPiwgdDogVCwgdTogU3RyZWFtPGFueT4pOiBSIHwge30ge1xuICB0cnkge1xuICAgIHJldHVybiBjLmYodCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB1Ll9lKGUpO1xuICAgIHJldHVybiBOTztcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBfbjogKHY6IFQpID0+IHZvaWQ7XG4gIF9lOiAoZXJyOiBhbnkpID0+IHZvaWQ7XG4gIF9jOiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBOT19JTDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+ID0ge1xuICBfbjogbm9vcCxcbiAgX2U6IG5vb3AsXG4gIF9jOiBub29wLFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgX3N0YXJ0KGxpc3RlbmVyOiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZDtcbiAgX3N0b3A6ICgpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3V0U2VuZGVyPFQ+IHtcbiAgb3V0OiBTdHJlYW08VD47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT3BlcmF0b3I8VCwgUj4gZXh0ZW5kcyBJbnRlcm5hbFByb2R1Y2VyPFI+LCBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8Uj4ge1xuICB0eXBlOiBzdHJpbmc7XG4gIGluczogU3RyZWFtPFQ+O1xuICBfc3RhcnQob3V0OiBTdHJlYW08Uj4pOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFnZ3JlZ2F0b3I8VCwgVT4gZXh0ZW5kcyBJbnRlcm5hbFByb2R1Y2VyPFU+LCBPdXRTZW5kZXI8VT4ge1xuICB0eXBlOiBzdHJpbmc7XG4gIGluc0FycjogQXJyYXk8U3RyZWFtPFQ+PjtcbiAgX3N0YXJ0KG91dDogU3RyZWFtPFU+KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQcm9kdWNlcjxUPiB7XG4gIHN0YXJ0OiAobGlzdGVuZXI6IExpc3RlbmVyPFQ+KSA9PiB2b2lkO1xuICBzdG9wOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExpc3RlbmVyPFQ+IHtcbiAgbmV4dDogKHg6IFQpID0+IHZvaWQ7XG4gIGVycm9yOiAoZXJyOiBhbnkpID0+IHZvaWQ7XG4gIGNvbXBsZXRlOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN1YnNjcmlwdGlvbiB7XG4gIHVuc3Vic2NyaWJlKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgT2JzZXJ2YWJsZTxUPiB7XG4gIHN1YnNjcmliZShsaXN0ZW5lcjogTGlzdGVuZXI8VD4pOiBTdWJzY3JpcHRpb247XG59XG5cbi8vIG11dGF0ZXMgdGhlIGlucHV0XG5mdW5jdGlvbiBpbnRlcm5hbGl6ZVByb2R1Y2VyPFQ+KHByb2R1Y2VyOiBQcm9kdWNlcjxUPiAmIFBhcnRpYWw8SW50ZXJuYWxQcm9kdWNlcjxUPj4pIHtcbiAgcHJvZHVjZXIuX3N0YXJ0ID0gZnVuY3Rpb24gX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+ICYgUGFydGlhbDxMaXN0ZW5lcjxUPj4pIHtcbiAgICBpbC5uZXh0ID0gaWwuX247XG4gICAgaWwuZXJyb3IgPSBpbC5fZTtcbiAgICBpbC5jb21wbGV0ZSA9IGlsLl9jO1xuICAgIHRoaXMuc3RhcnQoaWwpO1xuICB9O1xuICBwcm9kdWNlci5fc3RvcCA9IHByb2R1Y2VyLnN0b3A7XG59XG5cbmNsYXNzIFN0cmVhbVN1YjxUPiBpbXBsZW1lbnRzIFN1YnNjcmlwdGlvbiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX3N0cmVhbTogU3RyZWFtPFQ+LCBwcml2YXRlIF9saXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPikge31cblxuICB1bnN1YnNjcmliZSgpOiB2b2lkIHtcbiAgICB0aGlzLl9zdHJlYW0uX3JlbW92ZSh0aGlzLl9saXN0ZW5lcik7XG4gIH1cbn1cblxuY2xhc3MgT2JzZXJ2ZXI8VD4gaW1wbGVtZW50cyBMaXN0ZW5lcjxUPiB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2xpc3RlbmVyOiBJbnRlcm5hbExpc3RlbmVyPFQ+KSB7fVxuXG4gIG5leHQodmFsdWU6IFQpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fbih2YWx1ZSk7XG4gIH1cblxuICBlcnJvcihlcnI6IGFueSkge1xuICAgIHRoaXMuX2xpc3RlbmVyLl9lKGVycik7XG4gIH1cblxuICBjb21wbGV0ZSgpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fYygpO1xuICB9XG59XG5cbmNsYXNzIEZyb21PYnNlcnZhYmxlPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21PYnNlcnZhYmxlJztcbiAgcHVibGljIGluczogT2JzZXJ2YWJsZTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGFjdGl2ZTogYm9vbGVhbjtcbiAgcHJpdmF0ZSBfc3ViOiBTdWJzY3JpcHRpb24gfCB1bmRlZmluZWQ7XG5cbiAgY29uc3RydWN0b3Iob2JzZXJ2YWJsZTogT2JzZXJ2YWJsZTxUPikge1xuICAgIHRoaXMuaW5zID0gb2JzZXJ2YWJsZTtcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICAgIHRoaXMuX3N1YiA9IHRoaXMuaW5zLnN1YnNjcmliZShuZXcgT2JzZXJ2ZXIob3V0KSk7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZSkgdGhpcy5fc3ViLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICBfc3RvcCgpIHtcbiAgICBpZiAodGhpcy5fc3ViKSB0aGlzLl9zdWIudW5zdWJzY3JpYmUoKTtcbiAgICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTWVyZ2VTaWduYXR1cmUge1xuICAoKTogU3RyZWFtPGFueT47XG4gIDxUMT4oczE6IFN0cmVhbTxUMT4pOiBTdHJlYW08VDE+O1xuICA8VDEsIFQyPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPik6IFN0cmVhbTxUMSB8IFQyPjtcbiAgPFQxLCBUMiwgVDM+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+KTogU3RyZWFtPFQxIHwgVDIgfCBUMz47XG4gIDxUMSwgVDIsIFQzLCBUND4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQ+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDY+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNj47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDc+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDk+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDggfCBUOT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTA+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+LFxuICAgIHMxMDogU3RyZWFtPFQxMD4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOCB8IFQ5IHwgVDEwPjtcbiAgPFQ+KC4uLnN0cmVhbTogQXJyYXk8U3RyZWFtPFQ+Pik6IFN0cmVhbTxUPjtcbn1cblxuY2xhc3MgTWVyZ2U8VD4gaW1wbGVtZW50cyBBZ2dyZWdhdG9yPFQsIFQ+LCBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnbWVyZ2UnO1xuICBwdWJsaWMgaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgYWM6IG51bWJlcjsgLy8gYWMgaXMgYWN0aXZlQ291bnRcblxuICBjb25zdHJ1Y3RvcihpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj4pIHtcbiAgICB0aGlzLmluc0FyciA9IGluc0FycjtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmFjID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBMID0gcy5sZW5ndGg7XG4gICAgdGhpcy5hYyA9IEw7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIHNbaV0uX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBMID0gcy5sZW5ndGg7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIHNbaV0uX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGlmICgtLXRoaXMuYWMgPD0gMCkge1xuICAgICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgICB1Ll9jKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tYmluZVNpZ25hdHVyZSB7XG4gICgpOiBTdHJlYW08QXJyYXk8YW55Pj47XG4gIDxUMT4oczE6IFN0cmVhbTxUMT4pOiBTdHJlYW08W1QxXT47XG4gIDxUMSwgVDI+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+KTogU3RyZWFtPFtUMSwgVDJdPjtcbiAgPFQxLCBUMiwgVDM+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+KTogU3RyZWFtPFtUMSwgVDIsIFQzXT47XG4gIDxUMSwgVDIsIFQzLCBUND4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDU+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDVdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDY+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNz4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDg+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDhdPjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDk+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTA+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+LFxuICAgIHM4OiBTdHJlYW08VDg+LFxuICAgIHM5OiBTdHJlYW08VDk+LFxuICAgIHMxMDogU3RyZWFtPFQxMD4pOiBTdHJlYW08W1QxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOCwgVDksIFQxMF0+O1xuICAoLi4uc3RyZWFtOiBBcnJheTxTdHJlYW08YW55Pj4pOiBTdHJlYW08QXJyYXk8YW55Pj47XG59XG5cbmNsYXNzIENvbWJpbmVMaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4sIE91dFNlbmRlcjxBcnJheTxUPj4ge1xuICBwcml2YXRlIGk6IG51bWJlcjtcbiAgcHVibGljIG91dDogU3RyZWFtPEFycmF5PFQ+PjtcbiAgcHJpdmF0ZSBwOiBDb21iaW5lPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGk6IG51bWJlciwgb3V0OiBTdHJlYW08QXJyYXk8VD4+LCBwOiBDb21iaW5lPFQ+KSB7XG4gICAgdGhpcy5pID0gaTtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLnAgPSBwO1xuICAgIHAuaWxzLnB1c2godGhpcyk7XG4gIH1cblxuICBfbih0OiBUKTogdm9pZCB7XG4gICAgY29uc3QgcCA9IHRoaXMucCwgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAocC51cCh0LCB0aGlzLmkpKSB7XG4gICAgICBjb25zdCBhID0gcC52YWxzO1xuICAgICAgY29uc3QgbCA9IGEubGVuZ3RoO1xuICAgICAgY29uc3QgYiA9IEFycmF5KGwpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyArK2kpIGJbaV0gPSBhW2ldO1xuICAgICAgb3V0Ll9uKGIpO1xuICAgIH1cbiAgfVxuXG4gIF9lKGVycjogYW55KTogdm9pZCB7XG4gICAgY29uc3Qgb3V0ID0gdGhpcy5vdXQ7XG4gICAgaWYgKG91dCA9PT0gTk8pIHJldHVybjtcbiAgICBvdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLnA7XG4gICAgaWYgKHAub3V0ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICgtLXAuTmMgPT09IDApIHAub3V0Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgQ29tYmluZTxSPiBpbXBsZW1lbnRzIEFnZ3JlZ2F0b3I8YW55LCBBcnJheTxSPj4ge1xuICBwdWJsaWMgdHlwZSA9ICdjb21iaW5lJztcbiAgcHVibGljIGluc0FycjogQXJyYXk8U3RyZWFtPGFueT4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08QXJyYXk8Uj4+O1xuICBwdWJsaWMgaWxzOiBBcnJheTxDb21iaW5lTGlzdGVuZXI8YW55Pj47XG4gIHB1YmxpYyBOYzogbnVtYmVyOyAvLyAqTip1bWJlciBvZiBzdHJlYW1zIHN0aWxsIHRvIHNlbmQgKmMqb21wbGV0ZVxuICBwdWJsaWMgTm46IG51bWJlcjsgLy8gKk4qdW1iZXIgb2Ygc3RyZWFtcyBzdGlsbCB0byBzZW5kICpuKmV4dFxuICBwdWJsaWMgdmFsczogQXJyYXk8Uj47XG5cbiAgY29uc3RydWN0b3IoaW5zQXJyOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICB0aGlzLmluc0FyciA9IGluc0FycjtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxBcnJheTxSPj47XG4gICAgdGhpcy5pbHMgPSBbXTtcbiAgICB0aGlzLk5jID0gdGhpcy5ObiA9IDA7XG4gICAgdGhpcy52YWxzID0gW107XG4gIH1cblxuICB1cCh0OiBhbnksIGk6IG51bWJlcik6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHYgPSB0aGlzLnZhbHNbaV07XG4gICAgY29uc3QgTm4gPSAhdGhpcy5ObiA/IDAgOiB2ID09PSBOTyA/IC0tdGhpcy5ObiA6IHRoaXMuTm47XG4gICAgdGhpcy52YWxzW2ldID0gdDtcbiAgICByZXR1cm4gTm4gPT09IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08QXJyYXk8Uj4+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IG4gPSB0aGlzLk5jID0gdGhpcy5ObiA9IHMubGVuZ3RoO1xuICAgIGNvbnN0IHZhbHMgPSB0aGlzLnZhbHMgPSBuZXcgQXJyYXkobik7XG4gICAgaWYgKG4gPT09IDApIHtcbiAgICAgIG91dC5fbihbXSk7XG4gICAgICBvdXQuX2MoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgdmFsc1tpXSA9IE5PO1xuICAgICAgICBzW2ldLl9hZGQobmV3IENvbWJpbmVMaXN0ZW5lcihpLCBvdXQsIHRoaXMpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgbiA9IHMubGVuZ3RoO1xuICAgIGNvbnN0IGlscyA9IHRoaXMuaWxzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSBzW2ldLl9yZW1vdmUoaWxzW2ldKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxBcnJheTxSPj47XG4gICAgdGhpcy5pbHMgPSBbXTtcbiAgICB0aGlzLnZhbHMgPSBbXTtcbiAgfVxufVxuXG5jbGFzcyBGcm9tQXJyYXk8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbUFycmF5JztcbiAgcHVibGljIGE6IEFycmF5PFQ+O1xuXG4gIGNvbnN0cnVjdG9yKGE6IEFycmF5PFQ+KSB7XG4gICAgdGhpcy5hID0gYTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCBhID0gdGhpcy5hO1xuICAgIGZvciAobGV0IGkgPSAwLCBuID0gYS5sZW5ndGg7IGkgPCBuOyBpKyspIG91dC5fbihhW2ldKTtcbiAgICBvdXQuX2MoKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICB9XG59XG5cbmNsYXNzIEZyb21Qcm9taXNlPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21Qcm9taXNlJztcbiAgcHVibGljIG9uOiBib29sZWFuO1xuICBwdWJsaWMgcDogUHJvbWlzZUxpa2U8VD47XG5cbiAgY29uc3RydWN0b3IocDogUHJvbWlzZUxpa2U8VD4pIHtcbiAgICB0aGlzLm9uID0gZmFsc2U7XG4gICAgdGhpcy5wID0gcDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCBwcm9kID0gdGhpcztcbiAgICB0aGlzLm9uID0gdHJ1ZTtcbiAgICB0aGlzLnAudGhlbihcbiAgICAgICh2OiBUKSA9PiB7XG4gICAgICAgIGlmIChwcm9kLm9uKSB7XG4gICAgICAgICAgb3V0Ll9uKHYpO1xuICAgICAgICAgIG91dC5fYygpO1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgKGU6IGFueSkgPT4ge1xuICAgICAgICBvdXQuX2UoZSk7XG4gICAgICB9LFxuICAgICkudGhlbihub29wLCAoZXJyOiBhbnkpID0+IHtcbiAgICAgIHNldFRpbWVvdXQoKCkgPT4geyB0aHJvdyBlcnI7IH0pO1xuICAgIH0pO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5vbiA9IGZhbHNlO1xuICB9XG59XG5cbmNsYXNzIFBlcmlvZGljIGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxudW1iZXI+IHtcbiAgcHVibGljIHR5cGUgPSAncGVyaW9kaWMnO1xuICBwdWJsaWMgcGVyaW9kOiBudW1iZXI7XG4gIHByaXZhdGUgaW50ZXJ2YWxJRDogYW55O1xuICBwcml2YXRlIGk6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihwZXJpb2Q6IG51bWJlcikge1xuICAgIHRoaXMucGVyaW9kID0gcGVyaW9kO1xuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IC0xO1xuICAgIHRoaXMuaSA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPG51bWJlcj4pOiB2b2lkIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBpbnRlcnZhbEhhbmRsZXIoKSB7IG91dC5fbihzZWxmLmkrKyk7IH1cbiAgICB0aGlzLmludGVydmFsSUQgPSBzZXRJbnRlcnZhbChpbnRlcnZhbEhhbmRsZXIsIHRoaXMucGVyaW9kKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmludGVydmFsSUQgIT09IC0xKSBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWxJRCk7XG4gICAgdGhpcy5pbnRlcnZhbElEID0gLTE7XG4gICAgdGhpcy5pID0gMDtcbiAgfVxufVxuXG5jbGFzcyBEZWJ1ZzxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZGVidWcnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBzOiAodDogVCkgPT4gYW55OyAvLyBzcHlcbiAgcHJpdmF0ZSBsOiBzdHJpbmc7IC8vIGxhYmVsXG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogc3RyaW5nKTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86ICh0OiBUKSA9PiBhbnkpO1xuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgYXJnPzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpKTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSB8IHVuZGVmaW5lZCkge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMucyA9IG5vb3A7XG4gICAgdGhpcy5sID0gJyc7XG4gICAgaWYgKHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnKSB0aGlzLmwgPSBhcmc7IGVsc2UgaWYgKHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbicpIHRoaXMucyA9IGFyZztcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCBzID0gdGhpcy5zLCBsID0gdGhpcy5sO1xuICAgIGlmIChzICE9PSBub29wKSB7XG4gICAgICB0cnkge1xuICAgICAgICBzKHQpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB1Ll9lKGUpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobCkgY29uc29sZS5sb2cobCArICc6JywgdCk7IGVsc2UgY29uc29sZS5sb2codCk7XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRHJvcDxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZHJvcCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbWF4OiBudW1iZXI7XG4gIHByaXZhdGUgZHJvcHBlZDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKG1heDogbnVtYmVyLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubWF4ID0gbWF4O1xuICAgIHRoaXMuZHJvcHBlZCA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmRyb3BwZWQgPSAwO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAodGhpcy5kcm9wcGVkKysgPj0gdGhpcy5tYXgpIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIEVuZFdoZW5MaXN0ZW5lcjxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8YW55PiB7XG4gIHByaXZhdGUgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3A6IEVuZFdoZW48VD47XG5cbiAgY29uc3RydWN0b3Iob3V0OiBTdHJlYW08VD4sIG9wOiBFbmRXaGVuPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcCA9IG9wO1xuICB9XG5cbiAgX24oKSB7XG4gICAgdGhpcy5vcC5lbmQoKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgdGhpcy5vdXQuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIHRoaXMub3AuZW5kKCk7XG4gIH1cbn1cblxuY2xhc3MgRW5kV2hlbjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZW5kV2hlbic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbzogU3RyZWFtPGFueT47IC8vIG8gPSBvdGhlclxuICBwcml2YXRlIG9pbDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+OyAvLyBvaWwgPSBvdGhlciBJbnRlcm5hbExpc3RlbmVyXG5cbiAgY29uc3RydWN0b3IobzogU3RyZWFtPGFueT4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vID0gbztcbiAgICB0aGlzLm9pbCA9IE5PX0lMO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vLl9hZGQodGhpcy5vaWwgPSBuZXcgRW5kV2hlbkxpc3RlbmVyKG91dCwgdGhpcykpO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMuby5fcmVtb3ZlKHRoaXMub2lsKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9pbCA9IE5PX0lMO1xuICB9XG5cbiAgZW5kKCk6IHZvaWQge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLmVuZCgpO1xuICB9XG59XG5cbmNsYXNzIEZpbHRlcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZmlsdGVyJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBmOiAodDogVCkgPT4gYm9vbGVhbjtcblxuICBjb25zdHJ1Y3RvcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuZiA9IHBhc3NlcztcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8gfHwgIXIpIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBGbGF0dGVuTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHJpdmF0ZSBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBvcDogRmxhdHRlbjxUPjtcblxuICBjb25zdHJ1Y3RvcihvdXQ6IFN0cmVhbTxUPiwgb3A6IEZsYXR0ZW48VD4pIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm9wID0gb3A7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgdGhpcy5vdXQuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIHRoaXMub3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMub3AubGVzcygpO1xuICB9XG59XG5cbmNsYXNzIEZsYXR0ZW48VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxTdHJlYW08VD4sIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAnZmxhdHRlbic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxTdHJlYW08VD4+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3BlbjogYm9vbGVhbjtcbiAgcHVibGljIGlubmVyOiBTdHJlYW08VD47IC8vIEN1cnJlbnQgaW5uZXIgU3RyZWFtXG4gIHByaXZhdGUgaWw6IEludGVybmFsTGlzdGVuZXI8VD47IC8vIEN1cnJlbnQgaW5uZXIgSW50ZXJuYWxMaXN0ZW5lclxuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFN0cmVhbTxUPj4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5pbCA9IE5PX0lMO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICBpZiAodGhpcy5pbm5lciAhPT0gTk8pIHRoaXMuaW5uZXIuX3JlbW92ZSh0aGlzLmlsKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wZW4gPSB0cnVlO1xuICAgIHRoaXMuaW5uZXIgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5pbCA9IE5PX0lMO1xuICB9XG5cbiAgbGVzcygpOiB2b2lkIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKCF0aGlzLm9wZW4gJiYgdGhpcy5pbm5lciA9PT0gTk8pIHUuX2MoKTtcbiAgfVxuXG4gIF9uKHM6IFN0cmVhbTxUPikge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCB7aW5uZXIsIGlsfSA9IHRoaXM7XG4gICAgaWYgKGlubmVyICE9PSBOTyAmJiBpbCAhPT0gTk9fSUwpIGlubmVyLl9yZW1vdmUoaWwpO1xuICAgICh0aGlzLmlubmVyID0gcykuX2FkZCh0aGlzLmlsID0gbmV3IEZsYXR0ZW5MaXN0ZW5lcih1LCB0aGlzKSk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICB0aGlzLmxlc3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGb2xkPFQsIFI+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgUj4ge1xuICBwdWJsaWMgdHlwZSA9ICdmb2xkJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08Uj47XG4gIHB1YmxpYyBmOiAodDogVCkgPT4gUjtcbiAgcHVibGljIHNlZWQ6IFI7XG4gIHByaXZhdGUgYWNjOiBSOyAvLyBpbml0aWFsaXplZCBhcyBzZWVkXG5cbiAgY29uc3RydWN0b3IoZjogKGFjYzogUiwgdDogVCkgPT4gUiwgc2VlZDogUiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgICB0aGlzLmYgPSAodDogVCkgPT4gZih0aGlzLmFjYywgdCk7XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQgPSBzZWVkO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQ7XG4gICAgb3V0Ll9uKHRoaXMuYWNjKTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgICB0aGlzLmFjYyA9IHRoaXMuc2VlZDtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0aGlzLmFjYyA9IHIgYXMgUik7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIExhc3Q8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2xhc3QnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBoYXM6IGJvb2xlYW47XG4gIHByaXZhdGUgdmFsOiBUO1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5oYXMgPSBmYWxzZTtcbiAgICB0aGlzLnZhbCA9IE5PIGFzIFQ7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmhhcyA9IGZhbHNlO1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMudmFsID0gTk8gYXMgVDtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICB0aGlzLmhhcyA9IHRydWU7XG4gICAgdGhpcy52YWwgPSB0O1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICh0aGlzLmhhcykge1xuICAgICAgdS5fbih0aGlzLnZhbCk7XG4gICAgICB1Ll9jKCk7XG4gICAgfSBlbHNlIHUuX2UobmV3IEVycm9yKCdsYXN0KCkgZmFpbGVkIGJlY2F1c2UgaW5wdXQgc3RyZWFtIGNvbXBsZXRlZCcpKTtcbiAgfVxufVxuXG5jbGFzcyBNYXBPcDxULCBSPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFI+IHtcbiAgcHVibGljIHR5cGUgPSAnbWFwJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08Uj47XG4gIHB1YmxpYyBmOiAodDogVCkgPT4gUjtcblxuICBjb25zdHJ1Y3Rvcihwcm9qZWN0OiAodDogVCkgPT4gUiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxSPjtcbiAgICB0aGlzLmYgPSBwcm9qZWN0O1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24ociBhcyBSKTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgUmVtZW1iZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbFByb2R1Y2VyPFQ+IHtcbiAgcHVibGljIHR5cGUgPSAncmVtZW1iZXInO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5pbnMuX2FkZChvdXQpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzLm91dCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cbn1cblxuY2xhc3MgUmVwbGFjZUVycm9yPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdyZXBsYWNlRXJyb3InO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIGY6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKHJlcGxhY2VyOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmYgPSByZXBsYWNlcjtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgICAodGhpcy5pbnMgPSB0aGlzLmYoZXJyKSkuX2FkZCh0aGlzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB1Ll9lKGUpO1xuICAgIH1cbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgU3RhcnRXaXRoPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3N0YXJ0V2l0aCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgdmFsOiBUO1xuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCB2YWw6IFQpIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnZhbCA9IHZhbDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3V0Ll9uKHRoaXMudmFsKTtcbiAgICB0aGlzLmlucy5fYWRkKG91dCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMub3V0KTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxufVxuXG5jbGFzcyBUYWtlPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICd0YWtlJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBtYXg6IG51bWJlcjtcbiAgcHJpdmF0ZSB0YWtlbjogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKG1heDogbnVtYmVyLCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubWF4ID0gbWF4O1xuICAgIHRoaXMudGFrZW4gPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy50YWtlbiA9IDA7XG4gICAgaWYgKHRoaXMubWF4IDw9IDApIG91dC5fYygpOyBlbHNlIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCBtID0gKyt0aGlzLnRha2VuO1xuICAgIGlmIChtIDwgdGhpcy5tYXgpIHUuX24odCk7IGVsc2UgaWYgKG0gPT09IHRoaXMubWF4KSB7XG4gICAgICB1Ll9uKHQpO1xuICAgICAgdS5fYygpO1xuICAgIH1cbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN0cmVhbTxUPiBpbXBsZW1lbnRzIEludGVybmFsTGlzdGVuZXI8VD4ge1xuICBwdWJsaWMgX3Byb2Q6IEludGVybmFsUHJvZHVjZXI8VD47XG4gIHByb3RlY3RlZCBfaWxzOiBBcnJheTxJbnRlcm5hbExpc3RlbmVyPFQ+PjsgLy8gJ2lscycgPSBJbnRlcm5hbCBsaXN0ZW5lcnNcbiAgcHJvdGVjdGVkIF9zdG9wSUQ6IGFueTtcbiAgcHJvdGVjdGVkIF9kbDogSW50ZXJuYWxMaXN0ZW5lcjxUPjsgLy8gdGhlIGRlYnVnIGxpc3RlbmVyXG4gIHByb3RlY3RlZCBfZDogYm9vbGVhbjsgLy8gZmxhZyBpbmRpY2F0aW5nIHRoZSBleGlzdGVuY2Ugb2YgdGhlIGRlYnVnIGxpc3RlbmVyXG4gIHByb3RlY3RlZCBfdGFyZ2V0OiBTdHJlYW08VD47IC8vIGltaXRhdGlvbiB0YXJnZXQgaWYgdGhpcyBTdHJlYW0gd2lsbCBpbWl0YXRlXG4gIHByb3RlY3RlZCBfZXJyOiBhbnk7XG5cbiAgY29uc3RydWN0b3IocHJvZHVjZXI/OiBJbnRlcm5hbFByb2R1Y2VyPFQ+KSB7XG4gICAgdGhpcy5fcHJvZCA9IHByb2R1Y2VyIHx8IE5PIGFzIEludGVybmFsUHJvZHVjZXI8VD47XG4gICAgdGhpcy5faWxzID0gW107XG4gICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgdGhpcy5fZGwgPSBOTyBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+O1xuICAgIHRoaXMuX2QgPSBmYWxzZTtcbiAgICB0aGlzLl90YXJnZXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5fZXJyID0gTk87XG4gIH1cblxuICBfbih0OiBUKTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBMID0gYS5sZW5ndGg7XG4gICAgaWYgKHRoaXMuX2QpIHRoaXMuX2RsLl9uKHQpO1xuICAgIGlmIChMID09IDEpIGFbMF0uX24odCk7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9uKHQpO1xuICAgIH1cbiAgfVxuXG4gIF9lKGVycjogYW55KTogdm9pZCB7XG4gICAgaWYgKHRoaXMuX2VyciAhPT0gTk8pIHJldHVybjtcbiAgICB0aGlzLl9lcnIgPSBlcnI7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBMID0gYS5sZW5ndGg7XG4gICAgdGhpcy5feCgpO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fZShlcnIpO1xuICAgIGlmIChMID09IDEpIGFbMF0uX2UoZXJyKTsgZWxzZSBpZiAoTCA9PSAwKSByZXR1cm47IGVsc2Uge1xuICAgICAgY29uc3QgYiA9IGNwKGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIGJbaV0uX2UoZXJyKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLl9kICYmIEwgPT0gMCkgdGhyb3cgdGhpcy5fZXJyO1xuICB9XG5cbiAgX2MoKTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBMID0gYS5sZW5ndGg7XG4gICAgdGhpcy5feCgpO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fYygpO1xuICAgIGlmIChMID09IDEpIGFbMF0uX2MoKTsgZWxzZSBpZiAoTCA9PSAwKSByZXR1cm47IGVsc2Uge1xuICAgICAgY29uc3QgYiA9IGNwKGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMOyBpKyspIGJbaV0uX2MoKTtcbiAgICB9XG4gIH1cblxuICBfeCgpOiB2b2lkIHsgLy8gdGVhciBkb3duIGxvZ2ljLCBhZnRlciBlcnJvciBvciBjb21wbGV0ZVxuICAgIGlmICh0aGlzLl9pbHMubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgaWYgKHRoaXMuX3Byb2QgIT09IE5PKSB0aGlzLl9wcm9kLl9zdG9wKCk7XG4gICAgdGhpcy5fZXJyID0gTk87XG4gICAgdGhpcy5faWxzID0gW107XG4gIH1cblxuICBfc3RvcE5vdygpIHtcbiAgICAvLyBXQVJOSU5HOiBjb2RlIHRoYXQgY2FsbHMgdGhpcyBtZXRob2Qgc2hvdWxkXG4gICAgLy8gZmlyc3QgY2hlY2sgaWYgdGhpcy5fcHJvZCBpcyB2YWxpZCAobm90IGBOT2ApXG4gICAgdGhpcy5fcHJvZC5fc3RvcCgpO1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICB9XG5cbiAgX2FkZChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgIGlmICh0YSAhPT0gTk8pIHJldHVybiB0YS5fYWRkKGlsKTtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGEucHVzaChpbCk7XG4gICAgaWYgKGEubGVuZ3RoID4gMSkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9zdG9wSUQgIT09IE5PKSB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fc3RvcElEKTtcbiAgICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICAgIGlmIChwICE9PSBOTykgcC5fc3RhcnQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgX3JlbW92ZShpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgIGlmICh0YSAhPT0gTk8pIHJldHVybiB0YS5fcmVtb3ZlKGlsKTtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGNvbnN0IGkgPSBhLmluZGV4T2YoaWwpO1xuICAgIGlmIChpID4gLTEpIHtcbiAgICAgIGEuc3BsaWNlKGksIDEpO1xuICAgICAgaWYgKHRoaXMuX3Byb2QgIT09IE5PICYmIGEubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgdGhpcy5fZXJyID0gTk87XG4gICAgICAgIHRoaXMuX3N0b3BJRCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fc3RvcE5vdygpKTtcbiAgICAgIH0gZWxzZSBpZiAoYS5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgdGhpcy5fcHJ1bmVDeWNsZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBJZiBhbGwgcGF0aHMgc3RlbW1pbmcgZnJvbSBgdGhpc2Agc3RyZWFtIGV2ZW50dWFsbHkgZW5kIGF0IGB0aGlzYFxuICAvLyBzdHJlYW0sIHRoZW4gd2UgcmVtb3ZlIHRoZSBzaW5nbGUgbGlzdGVuZXIgb2YgYHRoaXNgIHN0cmVhbSwgdG9cbiAgLy8gZm9yY2UgaXQgdG8gZW5kIGl0cyBleGVjdXRpb24gYW5kIGRpc3Bvc2UgcmVzb3VyY2VzLiBUaGlzIG1ldGhvZFxuICAvLyBhc3N1bWVzIGFzIGEgcHJlY29uZGl0aW9uIHRoYXQgdGhpcy5faWxzIGhhcyBqdXN0IG9uZSBsaXN0ZW5lci5cbiAgX3BydW5lQ3ljbGVzKCkge1xuICAgIGlmICh0aGlzLl9oYXNOb1NpbmtzKHRoaXMsIFtdKSkgdGhpcy5fcmVtb3ZlKHRoaXMuX2lsc1swXSk7XG4gIH1cblxuICAvLyBDaGVja3Mgd2hldGhlciAqdGhlcmUgaXMgbm8qIHBhdGggc3RhcnRpbmcgZnJvbSBgeGAgdGhhdCBsZWFkcyB0byBhbiBlbmRcbiAgLy8gbGlzdGVuZXIgKHNpbmspIGluIHRoZSBzdHJlYW0gZ3JhcGgsIGZvbGxvd2luZyBlZGdlcyBBLT5CIHdoZXJlIEIgaXMgYVxuICAvLyBsaXN0ZW5lciBvZiBBLiBUaGlzIG1lYW5zIHRoZXNlIHBhdGhzIGNvbnN0aXR1dGUgYSBjeWNsZSBzb21laG93LiBJcyBnaXZlblxuICAvLyBhIHRyYWNlIG9mIGFsbCB2aXNpdGVkIG5vZGVzIHNvIGZhci5cbiAgX2hhc05vU2lua3MoeDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+LCB0cmFjZTogQXJyYXk8YW55Pik6IGJvb2xlYW4ge1xuICAgIGlmICh0cmFjZS5pbmRleE9mKHgpICE9PSAtMSlcbiAgICAgIHJldHVybiB0cnVlOyBlbHNlXG4gICAgaWYgKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ID09PSB0aGlzKVxuICAgICAgcmV0dXJuIHRydWU7IGVsc2VcbiAgICBpZiAoKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQgJiYgKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQgIT09IE5PKVxuICAgICAgcmV0dXJuIHRoaXMuX2hhc05vU2lua3MoKHggYXMgYW55IGFzIE91dFNlbmRlcjxhbnk+KS5vdXQsIHRyYWNlLmNvbmNhdCh4KSk7IGVsc2VcbiAgICBpZiAoKHggYXMgU3RyZWFtPGFueT4pLl9pbHMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBOID0gKHggYXMgU3RyZWFtPGFueT4pLl9pbHMubGVuZ3RoOyBpIDwgTjsgaSsrKVxuICAgICAgICBpZiAoIXRoaXMuX2hhc05vU2lua3MoKHggYXMgU3RyZWFtPGFueT4pLl9pbHNbaV0sIHRyYWNlLmNvbmNhdCh4KSkpXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgY3RvcigpOiB0eXBlb2YgU3RyZWFtIHtcbiAgICByZXR1cm4gdGhpcyBpbnN0YW5jZW9mIE1lbW9yeVN0cmVhbSA/IE1lbW9yeVN0cmVhbSA6IFN0cmVhbTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgTGlzdGVuZXIgdG8gdGhlIFN0cmVhbS5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcn0gbGlzdGVuZXJcbiAgICovXG4gIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pik6IHZvaWQge1xuICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fbiA9IGxpc3RlbmVyLm5leHQgfHwgbm9vcDtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2UgPSBsaXN0ZW5lci5lcnJvciB8fCBub29wO1xuICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fYyA9IGxpc3RlbmVyLmNvbXBsZXRlIHx8IG5vb3A7XG4gICAgdGhpcy5fYWRkKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZXMgYSBMaXN0ZW5lciBmcm9tIHRoZSBTdHJlYW0sIGFzc3VtaW5nIHRoZSBMaXN0ZW5lciB3YXMgYWRkZWQgdG8gaXQuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXI8VD59IGxpc3RlbmVyXG4gICAqL1xuICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiB2b2lkIHtcbiAgICB0aGlzLl9yZW1vdmUobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIExpc3RlbmVyIHRvIHRoZSBTdHJlYW0gcmV0dXJuaW5nIGEgU3Vic2NyaXB0aW9uIHRvIHJlbW92ZSB0aGF0XG4gICAqIGxpc3RlbmVyLlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyfSBsaXN0ZW5lclxuICAgKiBAcmV0dXJucyB7U3Vic2NyaXB0aW9ufVxuICAgKi9cbiAgc3Vic2NyaWJlKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+Pik6IFN1YnNjcmlwdGlvbiB7XG4gICAgdGhpcy5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW1TdWI8VD4odGhpcywgbGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPik7XG4gIH1cblxuICAvKipcbiAgICogQWRkIGludGVyb3AgYmV0d2VlbiBtb3N0LmpzIGFuZCBSeEpTIDVcbiAgICpcbiAgICogQHJldHVybnMge1N0cmVhbX1cbiAgICovXG4gIFskJG9ic2VydmFibGVdKCk6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBTdHJlYW0gZ2l2ZW4gYSBQcm9kdWNlci5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1Byb2R1Y2VyfSBwcm9kdWNlciBBbiBvcHRpb25hbCBQcm9kdWNlciB0aGF0IGRpY3RhdGVzIGhvdyB0b1xuICAgKiBzdGFydCwgZ2VuZXJhdGUgZXZlbnRzLCBhbmQgc3RvcCB0aGUgU3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgY3JlYXRlPFQ+KHByb2R1Y2VyPzogUHJvZHVjZXI8VD4pOiBTdHJlYW08VD4ge1xuICAgIGlmIChwcm9kdWNlcikge1xuICAgICAgaWYgKHR5cGVvZiBwcm9kdWNlci5zdGFydCAhPT0gJ2Z1bmN0aW9uJ1xuICAgICAgfHwgdHlwZW9mIHByb2R1Y2VyLnN0b3AgIT09ICdmdW5jdGlvbicpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcigncHJvZHVjZXIgcmVxdWlyZXMgYm90aCBzdGFydCBhbmQgc3RvcCBmdW5jdGlvbnMnKTtcbiAgICAgIGludGVybmFsaXplUHJvZHVjZXIocHJvZHVjZXIpOyAvLyBtdXRhdGVzIHRoZSBpbnB1dFxuICAgIH1cbiAgICByZXR1cm4gbmV3IFN0cmVhbShwcm9kdWNlciBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+ICYgUHJvZHVjZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgTWVtb3J5U3RyZWFtIGdpdmVuIGEgUHJvZHVjZXIuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9kdWNlcn0gcHJvZHVjZXIgQW4gb3B0aW9uYWwgUHJvZHVjZXIgdGhhdCBkaWN0YXRlcyBob3cgdG9cbiAgICogc3RhcnQsIGdlbmVyYXRlIGV2ZW50cywgYW5kIHN0b3AgdGhlIFN0cmVhbS5cbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZVdpdGhNZW1vcnk8VD4ocHJvZHVjZXI/OiBQcm9kdWNlcjxUPik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgaWYgKHByb2R1Y2VyKSBpbnRlcm5hbGl6ZVByb2R1Y2VyKHByb2R1Y2VyKTsgLy8gbXV0YXRlcyB0aGUgaW5wdXRcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxUPihwcm9kdWNlciBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+ICYgUHJvZHVjZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBkb2VzIG5vdGhpbmcgd2hlbiBzdGFydGVkLiBJdCBuZXZlciBlbWl0cyBhbnkgZXZlbnQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqICAgICAgICAgIG5ldmVyXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBuZXZlcigpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7X3N0YXJ0OiBub29wLCBfc3RvcDogbm9vcH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyB0aGUgXCJjb21wbGV0ZVwiIG5vdGlmaWNhdGlvbiB3aGVuXG4gICAqIHN0YXJ0ZWQsIGFuZCB0aGF0J3MgaXQuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIGVtcHR5XG4gICAqIC18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBlbXB0eSgpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7XG4gICAgICBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8YW55PikgeyBpbC5fYygpOyB9LFxuICAgICAgX3N0b3A6IG5vb3AsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIGFuIFwiZXJyb3JcIiBub3RpZmljYXRpb24gd2l0aCB0aGVcbiAgICogdmFsdWUgeW91IHBhc3NlZCBhcyB0aGUgYGVycm9yYCBhcmd1bWVudCB3aGVuIHRoZSBzdHJlYW0gc3RhcnRzLCBhbmQgdGhhdCdzXG4gICAqIGl0LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiB0aHJvdyhYKVxuICAgKiAtWFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0gZXJyb3IgVGhlIGVycm9yIGV2ZW50IHRvIGVtaXQgb24gdGhlIGNyZWF0ZWQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgdGhyb3coZXJyb3I6IGFueSk6IFN0cmVhbTxhbnk+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KHtcbiAgICAgIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxhbnk+KSB7IGlsLl9lKGVycm9yKTsgfSxcbiAgICAgIF9zdG9wOiBub29wLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzdHJlYW0gZnJvbSBhbiBBcnJheSwgUHJvbWlzZSwgb3IgYW4gT2JzZXJ2YWJsZS5cbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge0FycmF5fFByb21pc2VMaWtlfE9ic2VydmFibGV9IGlucHV0IFRoZSBpbnB1dCB0byBtYWtlIGEgc3RyZWFtIGZyb20uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tPFQ+KGlucHV0OiBQcm9taXNlTGlrZTxUPiB8IFN0cmVhbTxUPiB8IEFycmF5PFQ+IHwgT2JzZXJ2YWJsZTxUPik6IFN0cmVhbTxUPiB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dFskJG9ic2VydmFibGVdID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tT2JzZXJ2YWJsZTxUPihpbnB1dCBhcyBPYnNlcnZhYmxlPFQ+KTsgZWxzZVxuICAgIGlmICh0eXBlb2YgKGlucHV0IGFzIFByb21pc2VMaWtlPFQ+KS50aGVuID09PSAnZnVuY3Rpb24nKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tUHJvbWlzZTxUPihpbnB1dCBhcyBQcm9taXNlTGlrZTxUPik7IGVsc2VcbiAgICBpZiAoQXJyYXkuaXNBcnJheShpbnB1dCkpXG4gICAgICByZXR1cm4gU3RyZWFtLmZyb21BcnJheTxUPihpbnB1dCk7XG5cbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBUeXBlIG9mIGlucHV0IHRvIGZyb20oKSBtdXN0IGJlIGFuIEFycmF5LCBQcm9taXNlLCBvciBPYnNlcnZhYmxlYCk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFN0cmVhbSB0aGF0IGltbWVkaWF0ZWx5IGVtaXRzIHRoZSBhcmd1bWVudHMgdGhhdCB5b3UgZ2l2ZSB0b1xuICAgKiAqb2YqLCB0aGVuIGNvbXBsZXRlcy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogb2YoMSwyLDMpXG4gICAqIDEyM3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIGEgVGhlIGZpcnN0IHZhbHVlIHlvdSB3YW50IHRvIGVtaXQgYXMgYW4gZXZlbnQgb24gdGhlIHN0cmVhbS5cbiAgICogQHBhcmFtIGIgVGhlIHNlY29uZCB2YWx1ZSB5b3Ugd2FudCB0byBlbWl0IGFzIGFuIGV2ZW50IG9uIHRoZSBzdHJlYW0uIE9uZVxuICAgKiBvciBtb3JlIG9mIHRoZXNlIHZhbHVlcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgb2Y8VD4oLi4uaXRlbXM6IEFycmF5PFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gU3RyZWFtLmZyb21BcnJheTxUPihpdGVtcyk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYW4gYXJyYXkgdG8gYSBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gd2lsbCBlbWl0IHN5bmNocm9ub3VzbHlcbiAgICogYWxsIHRoZSBpdGVtcyBpbiB0aGUgYXJyYXksIGFuZCB0aGVuIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBmcm9tQXJyYXkoWzEsMiwzXSlcbiAgICogMTIzfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge0FycmF5fSBhcnJheSBUaGUgYXJyYXkgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbUFycmF5PFQ+KGFycmF5OiBBcnJheTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZyb21BcnJheTxUPihhcnJheSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGEgcHJvbWlzZSB0byBhIHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSB3aWxsIGVtaXQgdGhlIHJlc29sdmVkXG4gICAqIHZhbHVlIG9mIHRoZSBwcm9taXNlLCBhbmQgdGhlbiBjb21wbGV0ZS4gSG93ZXZlciwgaWYgdGhlIHByb21pc2UgaXNcbiAgICogcmVqZWN0ZWQsIHRoZSBzdHJlYW0gd2lsbCBlbWl0IHRoZSBjb3JyZXNwb25kaW5nIGVycm9yLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBmcm9tUHJvbWlzZSggLS0tLTQyIClcbiAgICogLS0tLS0tLS0tLS0tLS0tLS00MnxcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9taXNlTGlrZX0gcHJvbWlzZSBUaGUgcHJvbWlzZSB0byBiZSBjb252ZXJ0ZWQgYXMgYSBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBmcm9tUHJvbWlzZTxUPihwcm9taXNlOiBQcm9taXNlTGlrZTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZyb21Qcm9taXNlPFQ+KHByb21pc2UpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhbiBPYnNlcnZhYmxlIGludG8gYSBTdHJlYW0uXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHthbnl9IG9ic2VydmFibGUgVGhlIG9ic2VydmFibGUgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbU9ic2VydmFibGU8VD4ob2JzOiB7c3Vic2NyaWJlOiBhbnl9KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAoKG9icyBhcyBTdHJlYW08VD4pLmVuZFdoZW4pIHJldHVybiBvYnMgYXMgU3RyZWFtPFQ+O1xuICAgIGNvbnN0IG8gPSB0eXBlb2Ygb2JzWyQkb2JzZXJ2YWJsZV0gPT09ICdmdW5jdGlvbicgPyBvYnNbJCRvYnNlcnZhYmxlXSgpIDogb2JzO1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tT2JzZXJ2YWJsZShvKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHN0cmVhbSB0aGF0IHBlcmlvZGljYWxseSBlbWl0cyBpbmNyZW1lbnRhbCBudW1iZXJzLCBldmVyeVxuICAgKiBgcGVyaW9kYCBtaWxsaXNlY29uZHMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqICAgICBwZXJpb2RpYygxMDAwKVxuICAgKiAtLS0wLS0tMS0tLTItLS0zLS0tNC0tLS4uLlxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge251bWJlcn0gcGVyaW9kIFRoZSBpbnRlcnZhbCBpbiBtaWxsaXNlY29uZHMgdG8gdXNlIGFzIGEgcmF0ZSBvZlxuICAgKiBlbWlzc2lvbi5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIHBlcmlvZGljKHBlcmlvZDogbnVtYmVyKTogU3RyZWFtPG51bWJlcj4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPG51bWJlcj4obmV3IFBlcmlvZGljKHBlcmlvZCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEJsZW5kcyBtdWx0aXBsZSBzdHJlYW1zIHRvZ2V0aGVyLCBlbWl0dGluZyBldmVudHMgZnJvbSBhbGwgb2YgdGhlbVxuICAgKiBjb25jdXJyZW50bHkuXG4gICAqXG4gICAqICptZXJnZSogdGFrZXMgbXVsdGlwbGUgc3RyZWFtcyBhcyBhcmd1bWVudHMsIGFuZCBjcmVhdGVzIGEgc3RyZWFtIHRoYXRcbiAgICogYmVoYXZlcyBsaWtlIGVhY2ggb2YgdGhlIGFyZ3VtZW50IHN0cmVhbXMsIGluIHBhcmFsbGVsLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tLS0tNC0tLVxuICAgKiAtLS0tYS0tLS0tYi0tLS1jLS0tZC0tLS0tLVxuICAgKiAgICAgICAgICAgIG1lcmdlXG4gICAqIC0tMS1hLS0yLS1iLS0zLWMtLS1kLS00LS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0xIEEgc3RyZWFtIHRvIG1lcmdlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTIgQSBzdHJlYW0gdG8gbWVyZ2UgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLiBUd29cbiAgICogb3IgbW9yZSBzdHJlYW1zIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBtZXJnZTogTWVyZ2VTaWduYXR1cmUgPSBmdW5jdGlvbiBtZXJnZSguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxhbnk+KG5ldyBNZXJnZShzdHJlYW1zKSk7XG4gIH0gYXMgTWVyZ2VTaWduYXR1cmU7XG5cbiAgLyoqXG4gICAqIENvbWJpbmVzIG11bHRpcGxlIGlucHV0IHN0cmVhbXMgdG9nZXRoZXIgdG8gcmV0dXJuIGEgc3RyZWFtIHdob3NlIGV2ZW50c1xuICAgKiBhcmUgYXJyYXlzIHRoYXQgY29sbGVjdCB0aGUgbGF0ZXN0IGV2ZW50cyBmcm9tIGVhY2ggaW5wdXQgc3RyZWFtLlxuICAgKlxuICAgKiAqY29tYmluZSogaW50ZXJuYWxseSByZW1lbWJlcnMgdGhlIG1vc3QgcmVjZW50IGV2ZW50IGZyb20gZWFjaCBvZiB0aGUgaW5wdXRcbiAgICogc3RyZWFtcy4gV2hlbiBhbnkgb2YgdGhlIGlucHV0IHN0cmVhbXMgZW1pdHMgYW4gZXZlbnQsIHRoYXQgZXZlbnQgdG9nZXRoZXJcbiAgICogd2l0aCBhbGwgdGhlIG90aGVyIHNhdmVkIGV2ZW50cyBhcmUgY29tYmluZWQgaW50byBhbiBhcnJheS4gVGhhdCBhcnJheSB3aWxsXG4gICAqIGJlIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBzdHJlYW0uIEl0J3MgZXNzZW50aWFsbHkgYSB3YXkgb2Ygam9pbmluZyB0b2dldGhlclxuICAgKiB0aGUgZXZlbnRzIGZyb20gbXVsdGlwbGUgc3RyZWFtcy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS1cbiAgICogLS0tLWEtLS0tLWItLS0tLWMtLWQtLS0tLS1cbiAgICogICAgICAgICAgY29tYmluZVxuICAgKiAtLS0tMWEtMmEtMmItM2ItM2MtM2QtNGQtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBjb21iaW5lIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy5cbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTIgQSBzdHJlYW0gdG8gY29tYmluZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIE11bHRpcGxlIHN0cmVhbXMsIG5vdCBqdXN0IHR3bywgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNvbWJpbmU6IENvbWJpbmVTaWduYXR1cmUgPSBmdW5jdGlvbiBjb21iaW5lKC4uLnN0cmVhbXM6IEFycmF5PFN0cmVhbTxhbnk+Pikge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPEFycmF5PGFueT4+KG5ldyBDb21iaW5lPGFueT4oc3RyZWFtcykpO1xuICB9IGFzIENvbWJpbmVTaWduYXR1cmU7XG5cbiAgcHJvdGVjdGVkIF9tYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBTdHJlYW08VT4gfCBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxVPihuZXcgTWFwT3A8VCwgVT4ocHJvamVjdCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgZWFjaCBldmVudCBmcm9tIHRoZSBpbnB1dCBTdHJlYW0gdGhyb3VnaCBhIGBwcm9qZWN0YCBmdW5jdGlvbixcbiAgICogdG8gZ2V0IGEgU3RyZWFtIHRoYXQgZW1pdHMgdGhvc2UgdHJhbnNmb3JtZWQgZXZlbnRzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0zLS01LS0tLS03LS0tLS0tXG4gICAqICAgIG1hcChpID0+IGkgKiAxMClcbiAgICogLS0xMC0tMzAtNTAtLS0tNzAtLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gcHJvamVjdCBBIGZ1bmN0aW9uIG9mIHR5cGUgYCh0OiBUKSA9PiBVYCB0aGF0IHRha2VzIGV2ZW50XG4gICAqIGB0YCBvZiB0eXBlIGBUYCBmcm9tIHRoZSBpbnB1dCBTdHJlYW0gYW5kIHByb2R1Y2VzIGFuIGV2ZW50IG9mIHR5cGUgYFVgLCB0b1xuICAgKiBiZSBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgU3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBtYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBTdHJlYW08VT4ge1xuICAgIHJldHVybiB0aGlzLl9tYXAocHJvamVjdCk7XG4gIH1cblxuICAvKipcbiAgICogSXQncyBsaWtlIGBtYXBgLCBidXQgdHJhbnNmb3JtcyBlYWNoIGlucHV0IGV2ZW50IHRvIGFsd2F5cyB0aGUgc2FtZVxuICAgKiBjb25zdGFudCB2YWx1ZSBvbiB0aGUgb3V0cHV0IFN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMy0tNS0tLS0tNy0tLS0tXG4gICAqICAgICAgIG1hcFRvKDEwKVxuICAgKiAtLTEwLS0xMC0xMC0tLS0xMC0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBwcm9qZWN0ZWRWYWx1ZSBBIHZhbHVlIHRvIGVtaXQgb24gdGhlIG91dHB1dCBTdHJlYW0gd2hlbmV2ZXIgdGhlXG4gICAqIGlucHV0IFN0cmVhbSBlbWl0cyBhbnkgdmFsdWUuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIG1hcFRvPFU+KHByb2plY3RlZFZhbHVlOiBVKTogU3RyZWFtPFU+IHtcbiAgICBjb25zdCBzID0gdGhpcy5tYXAoKCkgPT4gcHJvamVjdGVkVmFsdWUpO1xuICAgIGNvbnN0IG9wOiBPcGVyYXRvcjxULCBVPiA9IHMuX3Byb2QgYXMgT3BlcmF0b3I8VCwgVT47XG4gICAgb3AudHlwZSA9ICdtYXBUbyc7XG4gICAgcmV0dXJuIHM7XG4gIH1cblxuICBmaWx0ZXI8UyBleHRlbmRzIFQ+KHBhc3NlczogKHQ6IFQpID0+IHQgaXMgUyk6IFN0cmVhbTxTPjtcbiAgZmlsdGVyKHBhc3NlczogKHQ6IFQpID0+IGJvb2xlYW4pOiBTdHJlYW08VD47XG4gIC8qKlxuICAgKiBPbmx5IGFsbG93cyBldmVudHMgdGhhdCBwYXNzIHRoZSB0ZXN0IGdpdmVuIGJ5IHRoZSBgcGFzc2VzYCBhcmd1bWVudC5cbiAgICpcbiAgICogRWFjaCBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gaXMgZ2l2ZW4gdG8gdGhlIGBwYXNzZXNgIGZ1bmN0aW9uLiBJZiB0aGVcbiAgICogZnVuY3Rpb24gcmV0dXJucyBgdHJ1ZWAsIHRoZSBldmVudCBpcyBmb3J3YXJkZWQgdG8gdGhlIG91dHB1dCBzdHJlYW0sXG4gICAqIG90aGVyd2lzZSBpdCBpcyBpZ25vcmVkIGFuZCBub3QgZm9yd2FyZGVkLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0yLS0zLS0tLS00LS0tLS01LS0tNi0tNy04LS1cbiAgICogICAgIGZpbHRlcihpID0+IGkgJSAyID09PSAwKVxuICAgKiAtLS0tLS0yLS0tLS0tLS00LS0tLS0tLS0tNi0tLS04LS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHBhc3NlcyBBIGZ1bmN0aW9uIG9mIHR5cGUgYCh0OiBUKSA9PiBib29sZWFuYCB0aGF0IHRha2VzXG4gICAqIGFuIGV2ZW50IGZyb20gdGhlIGlucHV0IHN0cmVhbSBhbmQgY2hlY2tzIGlmIGl0IHBhc3NlcywgYnkgcmV0dXJuaW5nIGFcbiAgICogYm9vbGVhbi5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZmlsdGVyKHBhc3NlczogKHQ6IFQpID0+IGJvb2xlYW4pOiBTdHJlYW08VD4ge1xuICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgIGlmIChwIGluc3RhbmNlb2YgRmlsdGVyKVxuICAgICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IEZpbHRlcjxUPihcbiAgICAgICAgYW5kKChwIGFzIEZpbHRlcjxUPikuZiwgcGFzc2VzKSxcbiAgICAgICAgKHAgYXMgRmlsdGVyPFQ+KS5pbnNcbiAgICAgICkpO1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGaWx0ZXI8VD4ocGFzc2VzLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogTGV0cyB0aGUgZmlyc3QgYGFtb3VudGAgbWFueSBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHBhc3MgdG8gdGhlXG4gICAqIG91dHB1dCBzdHJlYW0sIHRoZW4gbWFrZXMgdGhlIG91dHB1dCBzdHJlYW0gY29tcGxldGUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLS0tZC0tLWUtLVxuICAgKiAgICB0YWtlKDMpXG4gICAqIC0tYS0tLWItLWN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gYW1vdW50IEhvdyBtYW55IGV2ZW50cyB0byBhbGxvdyBmcm9tIHRoZSBpbnB1dCBzdHJlYW1cbiAgICogYmVmb3JlIGNvbXBsZXRpbmcgdGhlIG91dHB1dCBzdHJlYW0uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHRha2UoYW1vdW50OiBudW1iZXIpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgVGFrZTxUPihhbW91bnQsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJZ25vcmVzIHRoZSBmaXJzdCBgYW1vdW50YCBtYW55IGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0sIGFuZCB0aGVuXG4gICAqIGFmdGVyIHRoYXQgc3RhcnRzIGZvcndhcmRpbmcgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSB0byB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS1hLS0tYi0tYy0tLS1kLS0tZS0tXG4gICAqICAgICAgIGRyb3AoMylcbiAgICogLS0tLS0tLS0tLS0tLS1kLS0tZS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcn0gYW1vdW50IEhvdyBtYW55IGV2ZW50cyB0byBpZ25vcmUgZnJvbSB0aGUgaW5wdXQgc3RyZWFtXG4gICAqIGJlZm9yZSBmb3J3YXJkaW5nIGFsbCBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIHRvIHRoZSBvdXRwdXQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBkcm9wKGFtb3VudDogbnVtYmVyKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRHJvcDxUPihhbW91bnQsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXaGVuIHRoZSBpbnB1dCBzdHJlYW0gY29tcGxldGVzLCB0aGUgb3V0cHV0IHN0cmVhbSB3aWxsIGVtaXQgdGhlIGxhc3QgZXZlbnRcbiAgICogZW1pdHRlZCBieSB0aGUgaW5wdXQgc3RyZWFtLCBhbmQgdGhlbiB3aWxsIGFsc28gY29tcGxldGUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLWQtLS0tfFxuICAgKiAgICAgICBsYXN0KClcbiAgICogLS0tLS0tLS0tLS0tLS0tLS1kfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbGFzdCgpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBMYXN0PFQ+KHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcmVwZW5kcyB0aGUgZ2l2ZW4gYGluaXRpYWxgIHZhbHVlIHRvIHRoZSBzZXF1ZW5jZSBvZiBldmVudHMgZW1pdHRlZCBieSB0aGVcbiAgICogaW5wdXQgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIGlzIGEgTWVtb3J5U3RyZWFtLCB3aGljaCBtZWFucyBpdCBpc1xuICAgKiBhbHJlYWR5IGByZW1lbWJlcigpYCdkLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLS0xLS0tMi0tLS0tMy0tLVxuICAgKiAgIHN0YXJ0V2l0aCgwKVxuICAgKiAwLS0xLS0tMi0tLS0tMy0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIGluaXRpYWwgVGhlIHZhbHVlIG9yIGV2ZW50IHRvIHByZXBlbmQuXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHN0YXJ0V2l0aChpbml0aWFsOiBUKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxUPihuZXcgU3RhcnRXaXRoPFQ+KHRoaXMsIGluaXRpYWwpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVc2VzIGFub3RoZXIgc3RyZWFtIHRvIGRldGVybWluZSB3aGVuIHRvIGNvbXBsZXRlIHRoZSBjdXJyZW50IHN0cmVhbS5cbiAgICpcbiAgICogV2hlbiB0aGUgZ2l2ZW4gYG90aGVyYCBzdHJlYW0gZW1pdHMgYW4gZXZlbnQgb3IgY29tcGxldGVzLCB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbSB3aWxsIGNvbXBsZXRlLiBCZWZvcmUgdGhhdCBoYXBwZW5zLCB0aGUgb3V0cHV0IHN0cmVhbSB3aWxsIGJlaGF2ZXNcbiAgICogbGlrZSB0aGUgaW5wdXQgc3RyZWFtLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLS0xLS0tMi0tLS0tMy0tNC0tLS01LS0tLTYtLS1cbiAgICogICBlbmRXaGVuKCAtLS0tLS0tLWEtLWItLXwgKVxuICAgKiAtLS0xLS0tMi0tLS0tMy0tNC0tfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIG90aGVyIFNvbWUgb3RoZXIgc3RyZWFtIHRoYXQgaXMgdXNlZCB0byBrbm93IHdoZW4gc2hvdWxkIHRoZSBvdXRwdXRcbiAgICogc3RyZWFtIG9mIHRoaXMgb3BlcmF0b3IgY29tcGxldGUuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGVuZFdoZW4ob3RoZXI6IFN0cmVhbTxhbnk+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IEVuZFdoZW48VD4ob3RoZXIsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBcIkZvbGRzXCIgdGhlIHN0cmVhbSBvbnRvIGl0c2VsZi5cbiAgICpcbiAgICogQ29tYmluZXMgZXZlbnRzIGZyb20gdGhlIHBhc3QgdGhyb3VnaG91dFxuICAgKiB0aGUgZW50aXJlIGV4ZWN1dGlvbiBvZiB0aGUgaW5wdXQgc3RyZWFtLCBhbGxvd2luZyB5b3UgdG8gYWNjdW11bGF0ZSB0aGVtXG4gICAqIHRvZ2V0aGVyLiBJdCdzIGVzc2VudGlhbGx5IGxpa2UgYEFycmF5LnByb3RvdHlwZS5yZWR1Y2VgLiBUaGUgcmV0dXJuZWRcbiAgICogc3RyZWFtIGlzIGEgTWVtb3J5U3RyZWFtLCB3aGljaCBtZWFucyBpdCBpcyBhbHJlYWR5IGByZW1lbWJlcigpYCdkLlxuICAgKlxuICAgKiBUaGUgb3V0cHV0IHN0cmVhbSBzdGFydHMgYnkgZW1pdHRpbmcgdGhlIGBzZWVkYCB3aGljaCB5b3UgZ2l2ZSBhcyBhcmd1bWVudC5cbiAgICogVGhlbiwgd2hlbiBhbiBldmVudCBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIGl0IGlzIGNvbWJpbmVkIHdpdGggdGhhdFxuICAgKiBzZWVkIHZhbHVlIHRocm91Z2ggdGhlIGBhY2N1bXVsYXRlYCBmdW5jdGlvbiwgYW5kIHRoZSBvdXRwdXQgdmFsdWUgaXNcbiAgICogZW1pdHRlZCBvbiB0aGUgb3V0cHV0IHN0cmVhbS4gYGZvbGRgIHJlbWVtYmVycyB0aGF0IG91dHB1dCB2YWx1ZSBhcyBgYWNjYFxuICAgKiAoXCJhY2N1bXVsYXRvclwiKSwgYW5kIHRoZW4gd2hlbiBhIG5ldyBpbnB1dCBldmVudCBgdGAgaGFwcGVucywgYGFjY2Agd2lsbCBiZVxuICAgKiBjb21iaW5lZCB3aXRoIHRoYXQgdG8gcHJvZHVjZSB0aGUgbmV3IGBhY2NgIGFuZCBzbyBmb3J0aC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tLS0tMS0tLS0tMS0tMi0tLS0xLS0tLTEtLS0tLS1cbiAgICogICBmb2xkKChhY2MsIHgpID0+IGFjYyArIHgsIDMpXG4gICAqIDMtLS0tLTQtLS0tLTUtLTctLS0tOC0tLS05LS0tLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBhY2N1bXVsYXRlIEEgZnVuY3Rpb24gb2YgdHlwZSBgKGFjYzogUiwgdDogVCkgPT4gUmAgdGhhdFxuICAgKiB0YWtlcyB0aGUgcHJldmlvdXMgYWNjdW11bGF0ZWQgdmFsdWUgYGFjY2AgYW5kIHRoZSBpbmNvbWluZyBldmVudCBmcm9tIHRoZVxuICAgKiBpbnB1dCBzdHJlYW0gYW5kIHByb2R1Y2VzIHRoZSBuZXcgYWNjdW11bGF0ZWQgdmFsdWUuXG4gICAqIEBwYXJhbSBzZWVkIFRoZSBpbml0aWFsIGFjY3VtdWxhdGVkIHZhbHVlLCBvZiB0eXBlIGBSYC5cbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgZm9sZDxSPihhY2N1bXVsYXRlOiAoYWNjOiBSLCB0OiBUKSA9PiBSLCBzZWVkOiBSKTogTWVtb3J5U3RyZWFtPFI+IHtcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxSPihuZXcgRm9sZDxULCBSPihhY2N1bXVsYXRlLCBzZWVkLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogUmVwbGFjZXMgYW4gZXJyb3Igd2l0aCBhbm90aGVyIHN0cmVhbS5cbiAgICpcbiAgICogV2hlbiAoYW5kIGlmKSBhbiBlcnJvciBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIGluc3RlYWQgb2YgZm9yd2FyZGluZ1xuICAgKiB0aGF0IGVycm9yIHRvIHRoZSBvdXRwdXQgc3RyZWFtLCAqcmVwbGFjZUVycm9yKiB3aWxsIGNhbGwgdGhlIGByZXBsYWNlYFxuICAgKiBmdW5jdGlvbiB3aGljaCByZXR1cm5zIHRoZSBzdHJlYW0gdGhhdCB0aGUgb3V0cHV0IHN0cmVhbSB3aWxsIHJlcGxpY2F0ZS5cbiAgICogQW5kLCBpbiBjYXNlIHRoYXQgbmV3IHN0cmVhbSBhbHNvIGVtaXRzIGFuIGVycm9yLCBgcmVwbGFjZWAgd2lsbCBiZSBjYWxsZWRcbiAgICogYWdhaW4gdG8gZ2V0IGFub3RoZXIgc3RyZWFtIHRvIHN0YXJ0IHJlcGxpY2F0aW5nLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0yLS0tLS0zLS00LS0tLS1YXG4gICAqICAgcmVwbGFjZUVycm9yKCAoKSA9PiAtLTEwLS18IClcbiAgICogLS0xLS0tMi0tLS0tMy0tNC0tLS0tLS0tMTAtLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHJlcGxhY2UgQSBmdW5jdGlvbiBvZiB0eXBlIGAoZXJyKSA9PiBTdHJlYW1gIHRoYXQgdGFrZXNcbiAgICogdGhlIGVycm9yIHRoYXQgb2NjdXJyZWQgb24gdGhlIGlucHV0IHN0cmVhbSBvciBvbiB0aGUgcHJldmlvdXMgcmVwbGFjZW1lbnRcbiAgICogc3RyZWFtIGFuZCByZXR1cm5zIGEgbmV3IHN0cmVhbS4gVGhlIG91dHB1dCBzdHJlYW0gd2lsbCBiZWhhdmUgbGlrZSB0aGVcbiAgICogc3RyZWFtIHRoYXQgdGhpcyBmdW5jdGlvbiByZXR1cm5zLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICByZXBsYWNlRXJyb3IocmVwbGFjZTogKGVycjogYW55KSA9PiBTdHJlYW08VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgUmVwbGFjZUVycm9yPFQ+KHJlcGxhY2UsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGbGF0dGVucyBhIFwic3RyZWFtIG9mIHN0cmVhbXNcIiwgaGFuZGxpbmcgb25seSBvbmUgbmVzdGVkIHN0cmVhbSBhdCBhIHRpbWVcbiAgICogKG5vIGNvbmN1cnJlbmN5KS5cbiAgICpcbiAgICogSWYgdGhlIGlucHV0IHN0cmVhbSBpcyBhIHN0cmVhbSB0aGF0IGVtaXRzIHN0cmVhbXMsIHRoZW4gdGhpcyBvcGVyYXRvciB3aWxsXG4gICAqIHJldHVybiBhbiBvdXRwdXQgc3RyZWFtIHdoaWNoIGlzIGEgZmxhdCBzdHJlYW06IGVtaXRzIHJlZ3VsYXIgZXZlbnRzLiBUaGVcbiAgICogZmxhdHRlbmluZyBoYXBwZW5zIHdpdGhvdXQgY29uY3VycmVuY3kuIEl0IHdvcmtzIGxpa2UgdGhpczogd2hlbiB0aGUgaW5wdXRcbiAgICogc3RyZWFtIGVtaXRzIGEgbmVzdGVkIHN0cmVhbSwgKmZsYXR0ZW4qIHdpbGwgc3RhcnQgaW1pdGF0aW5nIHRoYXQgbmVzdGVkXG4gICAqIG9uZS4gSG93ZXZlciwgYXMgc29vbiBhcyB0aGUgbmV4dCBuZXN0ZWQgc3RyZWFtIGlzIGVtaXR0ZWQgb24gdGhlIGlucHV0XG4gICAqIHN0cmVhbSwgKmZsYXR0ZW4qIHdpbGwgZm9yZ2V0IHRoZSBwcmV2aW91cyBuZXN0ZWQgb25lIGl0IHdhcyBpbWl0YXRpbmcsIGFuZFxuICAgKiB3aWxsIHN0YXJ0IGltaXRhdGluZyB0aGUgbmV3IG5lc3RlZCBvbmUuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tKy0tLS0tLS0tKy0tLS0tLS0tLS0tLS0tLVxuICAgKiAgIFxcICAgICAgICBcXFxuICAgKiAgICBcXCAgICAgICAtLS0tMS0tLS0yLS0tMy0tXG4gICAqICAgIC0tYS0tYi0tLS1jLS0tLWQtLS0tLS0tLVxuICAgKiAgICAgICAgICAgZmxhdHRlblxuICAgKiAtLS0tLWEtLWItLS0tLS0xLS0tLTItLS0zLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGZsYXR0ZW48Uj4odGhpczogU3RyZWFtPFN0cmVhbTxSPj4pOiBUIHtcbiAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxSPihuZXcgRmxhdHRlbih0aGlzKSkgYXMgVCAmIFN0cmVhbTxSPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXNzZXMgdGhlIGlucHV0IHN0cmVhbSB0byBhIGN1c3RvbSBvcGVyYXRvciwgdG8gcHJvZHVjZSBhbiBvdXRwdXQgc3RyZWFtLlxuICAgKlxuICAgKiAqY29tcG9zZSogaXMgYSBoYW5keSB3YXkgb2YgdXNpbmcgYW4gZXhpc3RpbmcgZnVuY3Rpb24gaW4gYSBjaGFpbmVkIHN0eWxlLlxuICAgKiBJbnN0ZWFkIG9mIHdyaXRpbmcgYG91dFN0cmVhbSA9IGYoaW5TdHJlYW0pYCB5b3UgY2FuIHdyaXRlXG4gICAqIGBvdXRTdHJlYW0gPSBpblN0cmVhbS5jb21wb3NlKGYpYC5cbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gb3BlcmF0b3IgQSBmdW5jdGlvbiB0aGF0IHRha2VzIGEgc3RyZWFtIGFzIGlucHV0IGFuZFxuICAgKiByZXR1cm5zIGEgc3RyZWFtIGFzIHdlbGwuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGNvbXBvc2U8VT4ob3BlcmF0b3I6IChzdHJlYW06IFN0cmVhbTxUPikgPT4gVSk6IFUge1xuICAgIHJldHVybiBvcGVyYXRvcih0aGlzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG91dHB1dCBzdHJlYW0gdGhhdCBiZWhhdmVzIGxpa2UgdGhlIGlucHV0IHN0cmVhbSwgYnV0IGFsc29cbiAgICogcmVtZW1iZXJzIHRoZSBtb3N0IHJlY2VudCBldmVudCB0aGF0IGhhcHBlbnMgb24gdGhlIGlucHV0IHN0cmVhbSwgc28gdGhhdCBhXG4gICAqIG5ld2x5IGFkZGVkIGxpc3RlbmVyIHdpbGwgaW1tZWRpYXRlbHkgcmVjZWl2ZSB0aGF0IG1lbW9yaXNlZCBldmVudC5cbiAgICpcbiAgICogQHJldHVybiB7TWVtb3J5U3RyZWFtfVxuICAgKi9cbiAgcmVtZW1iZXIoKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IE1lbW9yeVN0cmVhbTxUPihuZXcgUmVtZW1iZXI8VD4odGhpcykpO1xuICB9XG5cbiAgZGVidWcoKTogU3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiBzdHJpbmcpOiBTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6ICh0OiBUKSA9PiBhbnkpOiBTdHJlYW08VD47XG4gIC8qKlxuICAgKiBSZXR1cm5zIGFuIG91dHB1dCBzdHJlYW0gdGhhdCBpZGVudGljYWxseSBiZWhhdmVzIGxpa2UgdGhlIGlucHV0IHN0cmVhbSxcbiAgICogYnV0IGFsc28gcnVucyBhIGBzcHlgIGZ1bmN0aW9uIGZvciBlYWNoIGV2ZW50LCB0byBoZWxwIHlvdSBkZWJ1ZyB5b3VyIGFwcC5cbiAgICpcbiAgICogKmRlYnVnKiB0YWtlcyBhIGBzcHlgIGZ1bmN0aW9uIGFzIGFyZ3VtZW50LCBhbmQgcnVucyB0aGF0IGZvciBlYWNoIGV2ZW50XG4gICAqIGhhcHBlbmluZyBvbiB0aGUgaW5wdXQgc3RyZWFtLiBJZiB5b3UgZG9uJ3QgcHJvdmlkZSB0aGUgYHNweWAgYXJndW1lbnQsXG4gICAqIHRoZW4gKmRlYnVnKiB3aWxsIGp1c3QgYGNvbnNvbGUubG9nYCBlYWNoIGV2ZW50LiBUaGlzIGhlbHBzIHlvdSB0b1xuICAgKiB1bmRlcnN0YW5kIHRoZSBmbG93IG9mIGV2ZW50cyB0aHJvdWdoIHNvbWUgb3BlcmF0b3IgY2hhaW4uXG4gICAqXG4gICAqIFBsZWFzZSBub3RlIHRoYXQgaWYgdGhlIG91dHB1dCBzdHJlYW0gaGFzIG5vIGxpc3RlbmVycywgdGhlbiBpdCB3aWxsIG5vdFxuICAgKiBzdGFydCwgd2hpY2ggbWVhbnMgYHNweWAgd2lsbCBuZXZlciBydW4gYmVjYXVzZSBubyBhY3R1YWwgZXZlbnQgaGFwcGVucyBpblxuICAgKiB0aGF0IGNhc2UuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS00LS1cbiAgICogICAgICAgICBkZWJ1Z1xuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tNC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBsYWJlbE9yU3B5IEEgc3RyaW5nIHRvIHVzZSBhcyB0aGUgbGFiZWwgd2hlbiBwcmludGluZ1xuICAgKiBkZWJ1ZyBpbmZvcm1hdGlvbiBvbiB0aGUgY29uc29sZSwgb3IgYSAnc3B5JyBmdW5jdGlvbiB0aGF0IHRha2VzIGFuIGV2ZW50XG4gICAqIGFzIGFyZ3VtZW50LCBhbmQgZG9lcyBub3QgbmVlZCB0byByZXR1cm4gYW55dGhpbmcuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGRlYnVnKGxhYmVsT3JTcHk/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY3RvcigpKTxUPihuZXcgRGVidWc8VD4odGhpcywgbGFiZWxPclNweSkpO1xuICB9XG5cbiAgLyoqXG4gICAqICppbWl0YXRlKiBjaGFuZ2VzIHRoaXMgY3VycmVudCBTdHJlYW0gdG8gZW1pdCB0aGUgc2FtZSBldmVudHMgdGhhdCB0aGVcbiAgICogYG90aGVyYCBnaXZlbiBTdHJlYW0gZG9lcy4gVGhpcyBtZXRob2QgcmV0dXJucyBub3RoaW5nLlxuICAgKlxuICAgKiBUaGlzIG1ldGhvZCBleGlzdHMgdG8gYWxsb3cgb25lIHRoaW5nOiAqKmNpcmN1bGFyIGRlcGVuZGVuY3kgb2Ygc3RyZWFtcyoqLlxuICAgKiBGb3IgaW5zdGFuY2UsIGxldCdzIGltYWdpbmUgdGhhdCBmb3Igc29tZSByZWFzb24geW91IG5lZWQgdG8gY3JlYXRlIGFcbiAgICogY2lyY3VsYXIgZGVwZW5kZW5jeSB3aGVyZSBzdHJlYW0gYGZpcnN0JGAgZGVwZW5kcyBvbiBzdHJlYW0gYHNlY29uZCRgXG4gICAqIHdoaWNoIGluIHR1cm4gZGVwZW5kcyBvbiBgZmlyc3QkYDpcbiAgICpcbiAgICogPCEtLSBza2lwLWV4YW1wbGUgLS0+XG4gICAqIGBgYGpzXG4gICAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICAgKlxuICAgKiB2YXIgZmlyc3QkID0gc2Vjb25kJC5tYXAoeCA9PiB4ICogMTApLnRha2UoMyk7XG4gICAqIHZhciBzZWNvbmQkID0gZmlyc3QkLm1hcCh4ID0+IHggKyAxKS5zdGFydFdpdGgoMSkuY29tcG9zZShkZWxheSgxMDApKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEhvd2V2ZXIsIHRoYXQgaXMgaW52YWxpZCBKYXZhU2NyaXB0LCBiZWNhdXNlIGBzZWNvbmQkYCBpcyB1bmRlZmluZWRcbiAgICogb24gdGhlIGZpcnN0IGxpbmUuIFRoaXMgaXMgaG93ICppbWl0YXRlKiBjYW4gaGVscCBzb2x2ZSBpdDpcbiAgICpcbiAgICogYGBganNcbiAgICogaW1wb3J0IGRlbGF5IGZyb20gJ3hzdHJlYW0vZXh0cmEvZGVsYXknXG4gICAqXG4gICAqIHZhciBzZWNvbmRQcm94eSQgPSB4cy5jcmVhdGUoKTtcbiAgICogdmFyIGZpcnN0JCA9IHNlY29uZFByb3h5JC5tYXAoeCA9PiB4ICogMTApLnRha2UoMyk7XG4gICAqIHZhciBzZWNvbmQkID0gZmlyc3QkLm1hcCh4ID0+IHggKyAxKS5zdGFydFdpdGgoMSkuY29tcG9zZShkZWxheSgxMDApKTtcbiAgICogc2Vjb25kUHJveHkkLmltaXRhdGUoc2Vjb25kJCk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBXZSBjcmVhdGUgYHNlY29uZFByb3h5JGAgYmVmb3JlIHRoZSBvdGhlcnMsIHNvIGl0IGNhbiBiZSB1c2VkIGluIHRoZVxuICAgKiBkZWNsYXJhdGlvbiBvZiBgZmlyc3QkYC4gVGhlbiwgYWZ0ZXIgYm90aCBgZmlyc3QkYCBhbmQgYHNlY29uZCRgIGFyZVxuICAgKiBkZWZpbmVkLCB3ZSBob29rIGBzZWNvbmRQcm94eSRgIHdpdGggYHNlY29uZCRgIHdpdGggYGltaXRhdGUoKWAgdG8gdGVsbFxuICAgKiB0aGF0IHRoZXkgYXJlIFwidGhlIHNhbWVcIi4gYGltaXRhdGVgIHdpbGwgbm90IHRyaWdnZXIgdGhlIHN0YXJ0IG9mIGFueVxuICAgKiBzdHJlYW0sIGl0IGp1c3QgYmluZHMgYHNlY29uZFByb3h5JGAgYW5kIGBzZWNvbmQkYCB0b2dldGhlci5cbiAgICpcbiAgICogVGhlIGZvbGxvd2luZyBpcyBhbiBleGFtcGxlIHdoZXJlIGBpbWl0YXRlKClgIGlzIGltcG9ydGFudCBpbiBDeWNsZS5qc1xuICAgKiBhcHBsaWNhdGlvbnMuIEEgcGFyZW50IGNvbXBvbmVudCBjb250YWlucyBzb21lIGNoaWxkIGNvbXBvbmVudHMuIEEgY2hpbGRcbiAgICogaGFzIGFuIGFjdGlvbiBzdHJlYW0gd2hpY2ggaXMgZ2l2ZW4gdG8gdGhlIHBhcmVudCB0byBkZWZpbmUgaXRzIHN0YXRlOlxuICAgKlxuICAgKiA8IS0tIHNraXAtZXhhbXBsZSAtLT5cbiAgICogYGBganNcbiAgICogY29uc3QgY2hpbGRBY3Rpb25Qcm94eSQgPSB4cy5jcmVhdGUoKTtcbiAgICogY29uc3QgcGFyZW50ID0gUGFyZW50KHsuLi5zb3VyY2VzLCBjaGlsZEFjdGlvbiQ6IGNoaWxkQWN0aW9uUHJveHkkfSk7XG4gICAqIGNvbnN0IGNoaWxkQWN0aW9uJCA9IHBhcmVudC5zdGF0ZSQubWFwKHMgPT4gcy5jaGlsZC5hY3Rpb24kKS5mbGF0dGVuKCk7XG4gICAqIGNoaWxkQWN0aW9uUHJveHkkLmltaXRhdGUoY2hpbGRBY3Rpb24kKTtcbiAgICogYGBgXG4gICAqXG4gICAqIE5vdGUsIHRob3VnaCwgdGhhdCAqKmBpbWl0YXRlKClgIGRvZXMgbm90IHN1cHBvcnQgTWVtb3J5U3RyZWFtcyoqLiBJZiB3ZVxuICAgKiB3b3VsZCBhdHRlbXB0IHRvIGltaXRhdGUgYSBNZW1vcnlTdHJlYW0gaW4gYSBjaXJjdWxhciBkZXBlbmRlbmN5LCB3ZSB3b3VsZFxuICAgKiBlaXRoZXIgZ2V0IGEgcmFjZSBjb25kaXRpb24gKHdoZXJlIHRoZSBzeW1wdG9tIHdvdWxkIGJlIFwibm90aGluZyBoYXBwZW5zXCIpXG4gICAqIG9yIGFuIGluZmluaXRlIGN5Y2xpYyBlbWlzc2lvbiBvZiB2YWx1ZXMuIEl0J3MgdXNlZnVsIHRvIHRoaW5rIGFib3V0XG4gICAqIE1lbW9yeVN0cmVhbXMgYXMgY2VsbHMgaW4gYSBzcHJlYWRzaGVldC4gSXQgZG9lc24ndCBtYWtlIGFueSBzZW5zZSB0b1xuICAgKiBkZWZpbmUgYSBzcHJlYWRzaGVldCBjZWxsIGBBMWAgd2l0aCBhIGZvcm11bGEgdGhhdCBkZXBlbmRzIG9uIGBCMWAgYW5kXG4gICAqIGNlbGwgYEIxYCBkZWZpbmVkIHdpdGggYSBmb3JtdWxhIHRoYXQgZGVwZW5kcyBvbiBgQTFgLlxuICAgKlxuICAgKiBJZiB5b3UgZmluZCB5b3Vyc2VsZiB3YW50aW5nIHRvIHVzZSBgaW1pdGF0ZSgpYCB3aXRoIGFcbiAgICogTWVtb3J5U3RyZWFtLCB5b3Ugc2hvdWxkIHJld29yayB5b3VyIGNvZGUgYXJvdW5kIGBpbWl0YXRlKClgIHRvIHVzZSBhXG4gICAqIFN0cmVhbSBpbnN0ZWFkLiBMb29rIGZvciB0aGUgc3RyZWFtIGluIHRoZSBjaXJjdWxhciBkZXBlbmRlbmN5IHRoYXRcbiAgICogcmVwcmVzZW50cyBhbiBldmVudCBzdHJlYW0sIGFuZCB0aGF0IHdvdWxkIGJlIGEgY2FuZGlkYXRlIGZvciBjcmVhdGluZyBhXG4gICAqIHByb3h5IFN0cmVhbSB3aGljaCB0aGVuIGltaXRhdGVzIHRoZSB0YXJnZXQgU3RyZWFtLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmVhbX0gdGFyZ2V0IFRoZSBvdGhlciBzdHJlYW0gdG8gaW1pdGF0ZSBvbiB0aGUgY3VycmVudCBvbmUuIE11c3RcbiAgICogbm90IGJlIGEgTWVtb3J5U3RyZWFtLlxuICAgKi9cbiAgaW1pdGF0ZSh0YXJnZXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBNZW1vcnlTdHJlYW0pXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0EgTWVtb3J5U3RyZWFtIHdhcyBnaXZlbiB0byBpbWl0YXRlKCksIGJ1dCBpdCBvbmx5ICcgK1xuICAgICAgJ3N1cHBvcnRzIGEgU3RyZWFtLiBSZWFkIG1vcmUgYWJvdXQgdGhpcyByZXN0cmljdGlvbiBoZXJlOiAnICtcbiAgICAgICdodHRwczovL2dpdGh1Yi5jb20vc3RhbHR6L3hzdHJlYW0jZmFxJyk7XG4gICAgdGhpcy5fdGFyZ2V0ID0gdGFyZ2V0O1xuICAgIGZvciAobGV0IGlscyA9IHRoaXMuX2lscywgTiA9IGlscy5sZW5ndGgsIGkgPSAwOyBpIDwgTjsgaSsrKSB0YXJnZXQuX2FkZChpbHNbaV0pO1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIGdpdmVuIHZhbHVlIHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0gdmFsdWUgVGhlIFwibmV4dFwiIHZhbHVlIHlvdSB3YW50IHRvIGJyb2FkY2FzdCB0byBhbGwgbGlzdGVuZXJzIG9mXG4gICAqIHRoaXMgU3RyZWFtLlxuICAgKi9cbiAgc2hhbWVmdWxseVNlbmROZXh0KHZhbHVlOiBUKSB7XG4gICAgdGhpcy5fbih2YWx1ZSk7XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgZ2l2ZW4gZXJyb3IgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBlcnJvciBUaGUgZXJyb3IgeW91IHdhbnQgdG8gYnJvYWRjYXN0IHRvIGFsbCB0aGUgbGlzdGVuZXJzIG9mXG4gICAqIHRoaXMgU3RyZWFtLlxuICAgKi9cbiAgc2hhbWVmdWxseVNlbmRFcnJvcihlcnJvcjogYW55KSB7XG4gICAgdGhpcy5fZShlcnJvcik7XG4gIH1cblxuICAvKipcbiAgICogRm9yY2VzIHRoZSBTdHJlYW0gdG8gZW1pdCB0aGUgXCJjb21wbGV0ZWRcIiBldmVudCB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kQ29tcGxldGUoKSB7XG4gICAgdGhpcy5fYygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBcImRlYnVnXCIgbGlzdGVuZXIgdG8gdGhlIHN0cmVhbS4gVGhlcmUgY2FuIG9ubHkgYmUgb25lIGRlYnVnXG4gICAqIGxpc3RlbmVyLCB0aGF0J3Mgd2h5IHRoaXMgaXMgJ3NldERlYnVnTGlzdGVuZXInLiBUbyByZW1vdmUgdGhlIGRlYnVnXG4gICAqIGxpc3RlbmVyLCBqdXN0IGNhbGwgc2V0RGVidWdMaXN0ZW5lcihudWxsKS5cbiAgICpcbiAgICogQSBkZWJ1ZyBsaXN0ZW5lciBpcyBsaWtlIGFueSBvdGhlciBsaXN0ZW5lci4gVGhlIG9ubHkgZGlmZmVyZW5jZSBpcyB0aGF0IGFcbiAgICogZGVidWcgbGlzdGVuZXIgaXMgXCJzdGVhbHRoeVwiOiBpdHMgcHJlc2VuY2UvYWJzZW5jZSBkb2VzIG5vdCB0cmlnZ2VyIHRoZVxuICAgKiBzdGFydC9zdG9wIG9mIHRoZSBzdHJlYW0gKG9yIHRoZSBwcm9kdWNlciBpbnNpZGUgdGhlIHN0cmVhbSkuIFRoaXMgaXNcbiAgICogdXNlZnVsIHNvIHlvdSBjYW4gaW5zcGVjdCB3aGF0IGlzIGdvaW5nIG9uIHdpdGhvdXQgY2hhbmdpbmcgdGhlIGJlaGF2aW9yXG4gICAqIG9mIHRoZSBwcm9ncmFtLiBJZiB5b3UgaGF2ZSBhbiBpZGxlIHN0cmVhbSBhbmQgeW91IGFkZCBhIG5vcm1hbCBsaXN0ZW5lciB0b1xuICAgKiBpdCwgdGhlIHN0cmVhbSB3aWxsIHN0YXJ0IGV4ZWN1dGluZy4gQnV0IGlmIHlvdSBzZXQgYSBkZWJ1ZyBsaXN0ZW5lciBvbiBhblxuICAgKiBpZGxlIHN0cmVhbSwgaXQgd29uJ3Qgc3RhcnQgZXhlY3V0aW5nIChub3QgdW50aWwgdGhlIGZpcnN0IG5vcm1hbCBsaXN0ZW5lclxuICAgKiBpcyBhZGRlZCkuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgd2UgZG9uJ3QgcmVjb21tZW5kIHVzaW5nIHRoaXMgbWV0aG9kIHRvIGJ1aWxkIGFwcFxuICAgKiBsb2dpYy4gSW4gZmFjdCwgaW4gbW9zdCBjYXNlcyB0aGUgZGVidWcgb3BlcmF0b3Igd29ya3MganVzdCBmaW5lLiBPbmx5IHVzZVxuICAgKiB0aGlzIG9uZSBpZiB5b3Uga25vdyB3aGF0IHlvdSdyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcjxUPn0gbGlzdGVuZXJcbiAgICovXG4gIHNldERlYnVnTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+IHwgbnVsbCB8IHVuZGVmaW5lZCkge1xuICAgIGlmICghbGlzdGVuZXIpIHtcbiAgICAgIHRoaXMuX2QgPSBmYWxzZTtcbiAgICAgIHRoaXMuX2RsID0gTk8gYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fZCA9IHRydWU7XG4gICAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX24gPSBsaXN0ZW5lci5uZXh0IHx8IG5vb3A7XG4gICAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2UgPSBsaXN0ZW5lci5lcnJvciB8fCBub29wO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9jID0gbGlzdGVuZXIuY29tcGxldGUgfHwgbm9vcDtcbiAgICAgIHRoaXMuX2RsID0gbGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE1lbW9yeVN0cmVhbTxUPiBleHRlbmRzIFN0cmVhbTxUPiB7XG4gIHByaXZhdGUgX3Y6IFQ7XG4gIHByaXZhdGUgX2hhczogYm9vbGVhbiA9IGZhbHNlO1xuICBjb25zdHJ1Y3Rvcihwcm9kdWNlcjogSW50ZXJuYWxQcm9kdWNlcjxUPikge1xuICAgIHN1cGVyKHByb2R1Y2VyKTtcbiAgfVxuXG4gIF9uKHg6IFQpIHtcbiAgICB0aGlzLl92ID0geDtcbiAgICB0aGlzLl9oYXMgPSB0cnVlO1xuICAgIHN1cGVyLl9uKHgpO1xuICB9XG5cbiAgX2FkZChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQge1xuICAgIGNvbnN0IHRhID0gdGhpcy5fdGFyZ2V0O1xuICAgIGlmICh0YSAhPT0gTk8pIHJldHVybiB0YS5fYWRkKGlsKTtcbiAgICBjb25zdCBhID0gdGhpcy5faWxzO1xuICAgIGEucHVzaChpbCk7XG4gICAgaWYgKGEubGVuZ3RoID4gMSkge1xuICAgICAgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLl9zdG9wSUQgIT09IE5PKSB7XG4gICAgICBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTtcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLl9zdG9wSUQpO1xuICAgICAgdGhpcy5fc3RvcElEID0gTk87XG4gICAgfSBlbHNlIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpOyBlbHNlIHtcbiAgICAgIGNvbnN0IHAgPSB0aGlzLl9wcm9kO1xuICAgICAgaWYgKHAgIT09IE5PKSBwLl9zdGFydCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBfc3RvcE5vdygpIHtcbiAgICB0aGlzLl9oYXMgPSBmYWxzZTtcbiAgICBzdXBlci5fc3RvcE5vdygpO1xuICB9XG5cbiAgX3goKTogdm9pZCB7XG4gICAgdGhpcy5faGFzID0gZmFsc2U7XG4gICAgc3VwZXIuX3goKTtcbiAgfVxuXG4gIG1hcDxVPihwcm9qZWN0OiAodDogVCkgPT4gVSk6IE1lbW9yeVN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIHRoaXMuX21hcChwcm9qZWN0KSBhcyBNZW1vcnlTdHJlYW08VT47XG4gIH1cblxuICBtYXBUbzxVPihwcm9qZWN0ZWRWYWx1ZTogVSk6IE1lbW9yeVN0cmVhbTxVPiB7XG4gICAgcmV0dXJuIHN1cGVyLm1hcFRvKHByb2plY3RlZFZhbHVlKSBhcyBNZW1vcnlTdHJlYW08VT47XG4gIH1cblxuICB0YWtlKGFtb3VudDogbnVtYmVyKTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIudGFrZShhbW91bnQpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIGVuZFdoZW4ob3RoZXI6IFN0cmVhbTxhbnk+KTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIuZW5kV2hlbihvdGhlcikgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG5cbiAgcmVwbGFjZUVycm9yKHJlcGxhY2U6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+KTogTWVtb3J5U3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gc3VwZXIucmVwbGFjZUVycm9yKHJlcGxhY2UpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIHJlbWVtYmVyKCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBkZWJ1ZygpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6IHN0cmluZyk6IE1lbW9yeVN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogKHQ6IFQpID0+IGFueSk6IE1lbW9yeVN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweT86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSB8IHVuZGVmaW5lZCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLmRlYnVnKGxhYmVsT3JTcHkgYXMgYW55KSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cbn1cblxuZXhwb3J0IHtOTywgTk9fSUx9O1xuY29uc3QgeHMgPSBTdHJlYW07XG50eXBlIHhzPFQ+ID0gU3RyZWFtPFQ+O1xuZXhwb3J0IGRlZmF1bHQgeHM7XG4iXX0=

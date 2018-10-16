(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
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

},{"./internals":3}],3:[function(require,module,exports){
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

},{"./adapt":1,"quicktask":7,"xstream":51}],4:[function(require,module,exports){
/*!
 * EventEmitter2
 * https://github.com/hij1nx/EventEmitter2
 *
 * Copyright (c) 2013 hij1nx
 * Licensed under the MIT license.
 */
;!function(undefined) {

  var isArray = Array.isArray ? Array.isArray : function _isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]";
  };
  var defaultMaxListeners = 10;

  function init() {
    this._events = {};
    if (this._conf) {
      configure.call(this, this._conf);
    }
  }

  function configure(conf) {
    if (conf) {
      this._conf = conf;

      conf.delimiter && (this.delimiter = conf.delimiter);
      this._events.maxListeners = conf.maxListeners !== undefined ? conf.maxListeners : defaultMaxListeners;
      conf.wildcard && (this.wildcard = conf.wildcard);
      conf.newListener && (this.newListener = conf.newListener);
      conf.verboseMemoryLeak && (this.verboseMemoryLeak = conf.verboseMemoryLeak);

      if (this.wildcard) {
        this.listenerTree = {};
      }
    } else {
      this._events.maxListeners = defaultMaxListeners;
    }
  }

  function logPossibleMemoryLeak(count, eventName) {
    var errorMsg = '(node) warning: possible EventEmitter memory ' +
        'leak detected. %d listeners added. ' +
        'Use emitter.setMaxListeners() to increase limit.';

    if(this.verboseMemoryLeak){
      errorMsg += ' Event name: %s.';
      console.error(errorMsg, count, eventName);
    } else {
      console.error(errorMsg, count);
    }

    if (console.trace){
      console.trace();
    }
  }

  function EventEmitter(conf) {
    this._events = {};
    this.newListener = false;
    this.verboseMemoryLeak = false;
    configure.call(this, conf);
  }
  EventEmitter.EventEmitter2 = EventEmitter; // backwards compatibility for exporting EventEmitter property

  //
  // Attention, function return type now is array, always !
  // It has zero elements if no any matches found and one or more
  // elements (leafs) if there are matches
  //
  function searchListenerTree(handlers, type, tree, i) {
    if (!tree) {
      return [];
    }
    var listeners=[], leaf, len, branch, xTree, xxTree, isolatedBranch, endReached,
        typeLength = type.length, currentType = type[i], nextType = type[i+1];
    if (i === typeLength && tree._listeners) {
      //
      // If at the end of the event(s) list and the tree has listeners
      // invoke those listeners.
      //
      if (typeof tree._listeners === 'function') {
        handlers && handlers.push(tree._listeners);
        return [tree];
      } else {
        for (leaf = 0, len = tree._listeners.length; leaf < len; leaf++) {
          handlers && handlers.push(tree._listeners[leaf]);
        }
        return [tree];
      }
    }

    if ((currentType === '*' || currentType === '**') || tree[currentType]) {
      //
      // If the event emitted is '*' at this part
      // or there is a concrete match at this patch
      //
      if (currentType === '*') {
        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+1));
          }
        }
        return listeners;
      } else if(currentType === '**') {
        endReached = (i+1 === typeLength || (i+2 === typeLength && nextType === '*'));
        if(endReached && tree._listeners) {
          // The next element has a _listeners, add it to the handlers.
          listeners = listeners.concat(searchListenerTree(handlers, type, tree, typeLength));
        }

        for (branch in tree) {
          if (branch !== '_listeners' && tree.hasOwnProperty(branch)) {
            if(branch === '*' || branch === '**') {
              if(tree[branch]._listeners && !endReached) {
                listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], typeLength));
              }
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            } else if(branch === nextType) {
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i+2));
            } else {
              // No match on this one, shift into the tree but not in the type array.
              listeners = listeners.concat(searchListenerTree(handlers, type, tree[branch], i));
            }
          }
        }
        return listeners;
      }

      listeners = listeners.concat(searchListenerTree(handlers, type, tree[currentType], i+1));
    }

    xTree = tree['*'];
    if (xTree) {
      //
      // If the listener tree will allow any match for this part,
      // then recursively explore all branches of the tree
      //
      searchListenerTree(handlers, type, xTree, i+1);
    }

    xxTree = tree['**'];
    if(xxTree) {
      if(i < typeLength) {
        if(xxTree._listeners) {
          // If we have a listener on a '**', it will catch all, so add its handler.
          searchListenerTree(handlers, type, xxTree, typeLength);
        }

        // Build arrays of matching next branches and others.
        for(branch in xxTree) {
          if(branch !== '_listeners' && xxTree.hasOwnProperty(branch)) {
            if(branch === nextType) {
              // We know the next element will match, so jump twice.
              searchListenerTree(handlers, type, xxTree[branch], i+2);
            } else if(branch === currentType) {
              // Current node matches, move into the tree.
              searchListenerTree(handlers, type, xxTree[branch], i+1);
            } else {
              isolatedBranch = {};
              isolatedBranch[branch] = xxTree[branch];
              searchListenerTree(handlers, type, { '**': isolatedBranch }, i+1);
            }
          }
        }
      } else if(xxTree._listeners) {
        // We have reached the end and still on a '**'
        searchListenerTree(handlers, type, xxTree, typeLength);
      } else if(xxTree['*'] && xxTree['*']._listeners) {
        searchListenerTree(handlers, type, xxTree['*'], typeLength);
      }
    }

    return listeners;
  }

  function growListenerTree(type, listener) {

    type = typeof type === 'string' ? type.split(this.delimiter) : type.slice();

    //
    // Looks for two consecutive '**', if so, don't add the event at all.
    //
    for(var i = 0, len = type.length; i+1 < len; i++) {
      if(type[i] === '**' && type[i+1] === '**') {
        return;
      }
    }

    var tree = this.listenerTree;
    var name = type.shift();

    while (name !== undefined) {

      if (!tree[name]) {
        tree[name] = {};
      }

      tree = tree[name];

      if (type.length === 0) {

        if (!tree._listeners) {
          tree._listeners = listener;
        }
        else {
          if (typeof tree._listeners === 'function') {
            tree._listeners = [tree._listeners];
          }

          tree._listeners.push(listener);

          if (
            !tree._listeners.warned &&
            this._events.maxListeners > 0 &&
            tree._listeners.length > this._events.maxListeners
          ) {
            tree._listeners.warned = true;
            logPossibleMemoryLeak.call(this, tree._listeners.length, name);
          }
        }
        return true;
      }
      name = type.shift();
    }
    return true;
  }

  // By default EventEmitters will print a warning if more than
  // 10 listeners are added to it. This is a useful default which
  // helps finding memory leaks.
  //
  // Obviously not all Emitters should be limited to 10. This function allows
  // that to be increased. Set to zero for unlimited.

  EventEmitter.prototype.delimiter = '.';

  EventEmitter.prototype.setMaxListeners = function(n) {
    if (n !== undefined) {
      this._events || init.call(this);
      this._events.maxListeners = n;
      if (!this._conf) this._conf = {};
      this._conf.maxListeners = n;
    }
  };

  EventEmitter.prototype.event = '';

  EventEmitter.prototype.once = function(event, fn) {
    this.many(event, 1, fn);
    return this;
  };

  EventEmitter.prototype.many = function(event, ttl, fn) {
    var self = this;

    if (typeof fn !== 'function') {
      throw new Error('many only accepts instances of Function');
    }

    function listener() {
      if (--ttl === 0) {
        self.off(event, listener);
      }
      fn.apply(this, arguments);
    }

    listener._origin = fn;

    this.on(event, listener);

    return self;
  };

  EventEmitter.prototype.emit = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
      if (!this._events.newListener) {
        return false;
      }
    }

    var al = arguments.length;
    var args,l,i,j;
    var handler;

    if (this._all && this._all.length) {
      handler = this._all.slice();
      if (al > 3) {
        args = new Array(al);
        for (j = 0; j < al; j++) args[j] = arguments[j];
      }

      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          handler[i].call(this, type);
          break;
        case 2:
          handler[i].call(this, type, arguments[1]);
          break;
        case 3:
          handler[i].call(this, type, arguments[1], arguments[2]);
          break;
        default:
          handler[i].apply(this, args);
        }
      }
    }

    if (this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    } else {
      handler = this._events[type];
      if (typeof handler === 'function') {
        this.event = type;
        switch (al) {
        case 1:
          handler.call(this);
          break;
        case 2:
          handler.call(this, arguments[1]);
          break;
        case 3:
          handler.call(this, arguments[1], arguments[2]);
          break;
        default:
          args = new Array(al - 1);
          for (j = 1; j < al; j++) args[j - 1] = arguments[j];
          handler.apply(this, args);
        }
        return true;
      } else if (handler) {
        // need to make copy of handlers because list can change in the middle
        // of emit call
        handler = handler.slice();
      }
    }

    if (handler && handler.length) {
      if (al > 3) {
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
      }
      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          handler[i].call(this);
          break;
        case 2:
          handler[i].call(this, arguments[1]);
          break;
        case 3:
          handler[i].call(this, arguments[1], arguments[2]);
          break;
        default:
          handler[i].apply(this, args);
        }
      }
      return true;
    } else if (!this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        throw arguments[1]; // Unhandled 'error' event
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }

    return !!this._all;
  };

  EventEmitter.prototype.emitAsync = function() {

    this._events || init.call(this);

    var type = arguments[0];

    if (type === 'newListener' && !this.newListener) {
        if (!this._events.newListener) { return Promise.resolve([false]); }
    }

    var promises= [];

    var al = arguments.length;
    var args,l,i,j;
    var handler;

    if (this._all) {
      if (al > 3) {
        args = new Array(al);
        for (j = 1; j < al; j++) args[j] = arguments[j];
      }
      for (i = 0, l = this._all.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          promises.push(this._all[i].call(this, type));
          break;
        case 2:
          promises.push(this._all[i].call(this, type, arguments[1]));
          break;
        case 3:
          promises.push(this._all[i].call(this, type, arguments[1], arguments[2]));
          break;
        default:
          promises.push(this._all[i].apply(this, args));
        }
      }
    }

    if (this.wildcard) {
      handler = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handler, ns, this.listenerTree, 0);
    } else {
      handler = this._events[type];
    }

    if (typeof handler === 'function') {
      this.event = type;
      switch (al) {
      case 1:
        promises.push(handler.call(this));
        break;
      case 2:
        promises.push(handler.call(this, arguments[1]));
        break;
      case 3:
        promises.push(handler.call(this, arguments[1], arguments[2]));
        break;
      default:
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
        promises.push(handler.apply(this, args));
      }
    } else if (handler && handler.length) {
      if (al > 3) {
        args = new Array(al - 1);
        for (j = 1; j < al; j++) args[j - 1] = arguments[j];
      }
      for (i = 0, l = handler.length; i < l; i++) {
        this.event = type;
        switch (al) {
        case 1:
          promises.push(handler[i].call(this));
          break;
        case 2:
          promises.push(handler[i].call(this, arguments[1]));
          break;
        case 3:
          promises.push(handler[i].call(this, arguments[1], arguments[2]));
          break;
        default:
          promises.push(handler[i].apply(this, args));
        }
      }
    } else if (!this._all && type === 'error') {
      if (arguments[1] instanceof Error) {
        return Promise.reject(arguments[1]); // Unhandled 'error' event
      } else {
        return Promise.reject("Uncaught, unspecified 'error' event.");
      }
    }

    return Promise.all(promises);
  };

  EventEmitter.prototype.on = function(type, listener) {
    if (typeof type === 'function') {
      this.onAny(type);
      return this;
    }

    if (typeof listener !== 'function') {
      throw new Error('on only accepts instances of Function');
    }
    this._events || init.call(this);

    // To avoid recursion in the case that type == "newListeners"! Before
    // adding it to the listeners, first emit "newListeners".
    this.emit('newListener', type, listener);

    if (this.wildcard) {
      growListenerTree.call(this, type, listener);
      return this;
    }

    if (!this._events[type]) {
      // Optimize the case of one listener. Don't need the extra array object.
      this._events[type] = listener;
    }
    else {
      if (typeof this._events[type] === 'function') {
        // Change to array.
        this._events[type] = [this._events[type]];
      }

      // If we've already got an array, just append.
      this._events[type].push(listener);

      // Check for listener leak
      if (
        !this._events[type].warned &&
        this._events.maxListeners > 0 &&
        this._events[type].length > this._events.maxListeners
      ) {
        this._events[type].warned = true;
        logPossibleMemoryLeak.call(this, this._events[type].length, type);
      }
    }

    return this;
  };

  EventEmitter.prototype.onAny = function(fn) {
    if (typeof fn !== 'function') {
      throw new Error('onAny only accepts instances of Function');
    }

    if (!this._all) {
      this._all = [];
    }

    // Add the function to the event listener collection.
    this._all.push(fn);
    return this;
  };

  EventEmitter.prototype.addListener = EventEmitter.prototype.on;

  EventEmitter.prototype.off = function(type, listener) {
    if (typeof listener !== 'function') {
      throw new Error('removeListener only takes instances of Function');
    }

    var handlers,leafs=[];

    if(this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);
    }
    else {
      // does not use listeners(), so no side effect of creating _events[type]
      if (!this._events[type]) return this;
      handlers = this._events[type];
      leafs.push({_listeners:handlers});
    }

    for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
      var leaf = leafs[iLeaf];
      handlers = leaf._listeners;
      if (isArray(handlers)) {

        var position = -1;

        for (var i = 0, length = handlers.length; i < length; i++) {
          if (handlers[i] === listener ||
            (handlers[i].listener && handlers[i].listener === listener) ||
            (handlers[i]._origin && handlers[i]._origin === listener)) {
            position = i;
            break;
          }
        }

        if (position < 0) {
          continue;
        }

        if(this.wildcard) {
          leaf._listeners.splice(position, 1);
        }
        else {
          this._events[type].splice(position, 1);
        }

        if (handlers.length === 0) {
          if(this.wildcard) {
            delete leaf._listeners;
          }
          else {
            delete this._events[type];
          }
        }

        this.emit("removeListener", type, listener);

        return this;
      }
      else if (handlers === listener ||
        (handlers.listener && handlers.listener === listener) ||
        (handlers._origin && handlers._origin === listener)) {
        if(this.wildcard) {
          delete leaf._listeners;
        }
        else {
          delete this._events[type];
        }

        this.emit("removeListener", type, listener);
      }
    }

    function recursivelyGarbageCollect(root) {
      if (root === undefined) {
        return;
      }
      var keys = Object.keys(root);
      for (var i in keys) {
        var key = keys[i];
        var obj = root[key];
        if ((obj instanceof Function) || (typeof obj !== "object") || (obj === null))
          continue;
        if (Object.keys(obj).length > 0) {
          recursivelyGarbageCollect(root[key]);
        }
        if (Object.keys(obj).length === 0) {
          delete root[key];
        }
      }
    }
    recursivelyGarbageCollect(this.listenerTree);

    return this;
  };

  EventEmitter.prototype.offAny = function(fn) {
    var i = 0, l = 0, fns;
    if (fn && this._all && this._all.length > 0) {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++) {
        if(fn === fns[i]) {
          fns.splice(i, 1);
          this.emit("removeListenerAny", fn);
          return this;
        }
      }
    } else {
      fns = this._all;
      for(i = 0, l = fns.length; i < l; i++)
        this.emit("removeListenerAny", fns[i]);
      this._all = [];
    }
    return this;
  };

  EventEmitter.prototype.removeListener = EventEmitter.prototype.off;

  EventEmitter.prototype.removeAllListeners = function(type) {
    if (arguments.length === 0) {
      !this._events || init.call(this);
      return this;
    }

    if (this.wildcard) {
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      var leafs = searchListenerTree.call(this, null, ns, this.listenerTree, 0);

      for (var iLeaf=0; iLeaf<leafs.length; iLeaf++) {
        var leaf = leafs[iLeaf];
        leaf._listeners = null;
      }
    }
    else if (this._events) {
      this._events[type] = null;
    }
    return this;
  };

  EventEmitter.prototype.listeners = function(type) {
    if (this.wildcard) {
      var handlers = [];
      var ns = typeof type === 'string' ? type.split(this.delimiter) : type.slice();
      searchListenerTree.call(this, handlers, ns, this.listenerTree, 0);
      return handlers;
    }

    this._events || init.call(this);

    if (!this._events[type]) this._events[type] = [];
    if (!isArray(this._events[type])) {
      this._events[type] = [this._events[type]];
    }
    return this._events[type];
  };

  EventEmitter.prototype.listenerCount = function(type) {
    return this.listeners(type).length;
  };

  EventEmitter.prototype.listenersAny = function() {

    if(this._all) {
      return this._all;
    }
    else {
      return [];
    }

  };

  if (typeof define === 'function' && define.amd) {
     // AMD. Register as an anonymous module.
    define(function() {
      return EventEmitter;
    });
  } else if (typeof exports === 'object') {
    // CommonJS
    module.exports = EventEmitter;
  }
  else {
    // Browser global.
    window.EventEmitter2 = EventEmitter;
  }
}();

},{}],5:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],6:[function(require,module,exports){
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

},{}],7:[function(require,module,exports){
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

},{"_process":6,"timers":49}],8:[function(require,module,exports){
/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * If you use roslib in a browser, all the classes will be exported to a global variable called ROSLIB.
 *
 * If you use nodejs, this is the variable you get when you require('roslib')
 */
var ROSLIB = this.ROSLIB || {
  REVISION : '0.20.0'
};

var assign = require('object-assign');

// Add core components
assign(ROSLIB, require('./core'));

assign(ROSLIB, require('./actionlib'));

assign(ROSLIB, require('./math'));

assign(ROSLIB, require('./tf'));

assign(ROSLIB, require('./urdf'));

module.exports = ROSLIB;

},{"./actionlib":13,"./core":22,"./math":27,"./tf":30,"./urdf":42,"object-assign":5}],9:[function(require,module,exports){
/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

var Topic = require('../core/Topic');
var Message = require('../core/Message');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * An actionlib action client.
 *
 * Emits the following events:
 *  * 'timeout' - if a timeout occurred while sending a goal
 *  * 'status' - the status messages received from the action server
 *  * 'feedback' -  the feedback messages received from the action server
 *  * 'result' - the result returned from the action server
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * serverName - the action server name, like /fibonacci
 *   * actionName - the action message name, like 'actionlib_tutorials/FibonacciAction'
 *   * timeout - the timeout length when connecting to the action server
 */
function ActionClient(options) {
  var that = this;
  options = options || {};
  this.ros = options.ros;
  this.serverName = options.serverName;
  this.actionName = options.actionName;
  this.timeout = options.timeout;
  this.omitFeedback = options.omitFeedback;
  this.omitStatus = options.omitStatus;
  this.omitResult = options.omitResult;
  this.goals = {};

  // flag to check if a status has been received
  var receivedStatus = false;

  // create the topics associated with actionlib
  this.feedbackListener = new Topic({
    ros : this.ros,
    name : this.serverName + '/feedback',
    messageType : this.actionName + 'Feedback'
  });

  this.statusListener = new Topic({
    ros : this.ros,
    name : this.serverName + '/status',
    messageType : 'actionlib_msgs/GoalStatusArray'
  });

  this.resultListener = new Topic({
    ros : this.ros,
    name : this.serverName + '/result',
    messageType : this.actionName + 'Result'
  });

  this.goalTopic = new Topic({
    ros : this.ros,
    name : this.serverName + '/goal',
    messageType : this.actionName + 'Goal'
  });

  this.cancelTopic = new Topic({
    ros : this.ros,
    name : this.serverName + '/cancel',
    messageType : 'actionlib_msgs/GoalID'
  });

  // advertise the goal and cancel topics
  this.goalTopic.advertise();
  this.cancelTopic.advertise();

  // subscribe to the status topic
  if (!this.omitStatus) {
    this.statusListener.subscribe(function(statusMessage) {
      receivedStatus = true;
      statusMessage.status_list.forEach(function(status) {
        var goal = that.goals[status.goal_id.id];
        if (goal) {
          goal.emit('status', status);
        }
      });
    });
  }

  // subscribe the the feedback topic
  if (!this.omitFeedback) {
    this.feedbackListener.subscribe(function(feedbackMessage) {
      var goal = that.goals[feedbackMessage.status.goal_id.id];
      if (goal) {
        goal.emit('status', feedbackMessage.status);
        goal.emit('feedback', feedbackMessage.feedback);
      }
    });
  }

  // subscribe to the result topic
  if (!this.omitResult) {
    this.resultListener.subscribe(function(resultMessage) {
      var goal = that.goals[resultMessage.status.goal_id.id];

      if (goal) {
        goal.emit('status', resultMessage.status);
        goal.emit('result', resultMessage.result);
      }
    });
  }

  // If timeout specified, emit a 'timeout' event if the action server does not respond
  if (this.timeout) {
    setTimeout(function() {
      if (!receivedStatus) {
        that.emit('timeout');
      }
    }, this.timeout);
  }
}

ActionClient.prototype.__proto__ = EventEmitter2.prototype;

/**
 * Cancel all goals associated with this ActionClient.
 */
ActionClient.prototype.cancel = function() {
  var cancelMessage = new Message();
  this.cancelTopic.publish(cancelMessage);
};

/**
 * Unsubscribe and unadvertise all topics associated with this ActionClient.
 */
ActionClient.prototype.dispose = function() {
  this.goalTopic.unadvertise();
  this.cancelTopic.unadvertise();
  if (!this.omitStatus) {this.statusListener.unsubscribe();}
  if (!this.omitFeedback) {this.feedbackListener.unsubscribe();}
  if (!this.omitResult) {this.resultListener.unsubscribe();}
};

module.exports = ActionClient;

},{"../core/Message":14,"../core/Topic":21,"eventemitter2":4}],10:[function(require,module,exports){
/**
 * @fileOverview
 * @author Justin Young - justin@oodar.com.au
 * @author Russell Toris - rctoris@wpi.edu
 */

var Topic = require('../core/Topic');
var Message = require('../core/Message');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * An actionlib action listener
 *
 * Emits the following events:
 *  * 'status' - the status messages received from the action server
 *  * 'feedback' -  the feedback messages received from the action server
 *  * 'result' - the result returned from the action server
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * serverName - the action server name, like /fibonacci
 *   * actionName - the action message name, like 'actionlib_tutorials/FibonacciAction'
 */
function ActionListener(options) {
  var that = this;
  options = options || {};
  this.ros = options.ros;
  this.serverName = options.serverName;
  this.actionName = options.actionName;
  this.timeout = options.timeout;
  this.omitFeedback = options.omitFeedback;
  this.omitStatus = options.omitStatus;
  this.omitResult = options.omitResult;


  // create the topics associated with actionlib
  var goalListener = new Topic({
    ros : this.ros,
    name : this.serverName + '/goal',
    messageType : this.actionName + 'Goal'
  });

  var feedbackListener = new Topic({
    ros : this.ros,
    name : this.serverName + '/feedback',
    messageType : this.actionName + 'Feedback'
  });

  var statusListener = new Topic({
    ros : this.ros,
    name : this.serverName + '/status',
    messageType : 'actionlib_msgs/GoalStatusArray'
  });

  var resultListener = new Topic({
    ros : this.ros,
    name : this.serverName + '/result',
    messageType : this.actionName + 'Result'
  });

  goalListener.subscribe(function(goalMessage) {
      that.emit('goal', goalMessage);
  });

  statusListener.subscribe(function(statusMessage) {
      statusMessage.status_list.forEach(function(status) {
          that.emit('status', status);
      });
  });

  feedbackListener.subscribe(function(feedbackMessage) {
      that.emit('status', feedbackMessage.status);
      that.emit('feedback', feedbackMessage.feedback);
  });

  // subscribe to the result topic
  resultListener.subscribe(function(resultMessage) {
      that.emit('status', resultMessage.status);
      that.emit('result', resultMessage.result);
  });

}

ActionListener.prototype.__proto__ = EventEmitter2.prototype;

module.exports = ActionListener;

},{"../core/Message":14,"../core/Topic":21,"eventemitter2":4}],11:[function(require,module,exports){
/**
 * @fileOverview
 * @author Russell Toris - rctoris@wpi.edu
 */

var Message = require('../core/Message');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * An actionlib goal goal is associated with an action server.
 *
 * Emits the following events:
 *  * 'timeout' - if a timeout occurred while sending a goal
 *
 *  @constructor
 *  @param object with following keys:
 *   * actionClient - the ROSLIB.ActionClient to use with this goal
 *   * goalMessage - The JSON object containing the goal for the action server
 */
function Goal(options) {
  var that = this;
  this.actionClient = options.actionClient;
  this.goalMessage = options.goalMessage;
  this.isFinished = false;

  // Used to create random IDs
  var date = new Date();

  // Create a random ID
  this.goalID = 'goal_' + Math.random() + '_' + date.getTime();
  // Fill in the goal message
  this.goalMessage = new Message({
    goal_id : {
      stamp : {
        secs : 0,
        nsecs : 0
      },
      id : this.goalID
    },
    goal : this.goalMessage
  });

  this.on('status', function(status) {
    that.status = status;
  });

  this.on('result', function(result) {
    that.isFinished = true;
    that.result = result;
  });

  this.on('feedback', function(feedback) {
    that.feedback = feedback;
  });

  // Add the goal
  this.actionClient.goals[this.goalID] = this;
}

Goal.prototype.__proto__ = EventEmitter2.prototype;

/**
 * Send the goal to the action server.
 *
 * @param timeout (optional) - a timeout length for the goal's result
 */
Goal.prototype.send = function(timeout) {
  var that = this;
  that.actionClient.goalTopic.publish(that.goalMessage);
  if (timeout) {
    setTimeout(function() {
      if (!that.isFinished) {
        that.emit('timeout');
      }
    }, timeout);
  }
};

/**
 * Cancel the current goal.
 */
Goal.prototype.cancel = function() {
  var cancelMessage = new Message({
    id : this.goalID
  });
  this.actionClient.cancelTopic.publish(cancelMessage);
};

module.exports = Goal;
},{"../core/Message":14,"eventemitter2":4}],12:[function(require,module,exports){
/**
 * @fileOverview
 * @author Laura Lindzey - lindzey@gmail.com
 */

var Topic = require('../core/Topic');
var Message = require('../core/Message');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * An actionlib action server client.
 *
 * Emits the following events:
 *  * 'goal' - goal sent by action client
 *  * 'cancel' - action client has canceled the request
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * serverName - the action server name, like /fibonacci
 *   * actionName - the action message name, like 'actionlib_tutorials/FibonacciAction'
 */

function SimpleActionServer(options) {
    var that = this;
    options = options || {};
    this.ros = options.ros;
    this.serverName = options.serverName;
    this.actionName = options.actionName;

    // create and advertise publishers
    this.feedbackPublisher = new Topic({
        ros : this.ros,
        name : this.serverName + '/feedback',
        messageType : this.actionName + 'Feedback'
    });
    this.feedbackPublisher.advertise();

    var statusPublisher = new Topic({
        ros : this.ros,
        name : this.serverName + '/status',
        messageType : 'actionlib_msgs/GoalStatusArray'
    });
    statusPublisher.advertise();

    this.resultPublisher = new Topic({
        ros : this.ros,
        name : this.serverName + '/result',
        messageType : this.actionName + 'Result'
    });
    this.resultPublisher.advertise();

    // create and subscribe to listeners
    var goalListener = new Topic({
        ros : this.ros,
        name : this.serverName + '/goal',
        messageType : this.actionName + 'Goal'
    });

    var cancelListener = new Topic({
        ros : this.ros,
        name : this.serverName + '/cancel',
        messageType : 'actionlib_msgs/GoalID'
    });

    // Track the goals and their status in order to publish status...
    this.statusMessage = new Message({
        header : {
            stamp : {secs : 0, nsecs : 100},
            frame_id : ''
        },
        status_list : []
    });

    // needed for handling preemption prompted by a new goal being received
    this.currentGoal = null; // currently tracked goal
    this.nextGoal = null; // the one that'll be preempting

    goalListener.subscribe(function(goalMessage) {
        
    if(that.currentGoal) {
            that.nextGoal = goalMessage;
            // needs to happen AFTER rest is set up
            that.emit('cancel');
    } else {
            that.statusMessage.status_list = [{goal_id : goalMessage.goal_id, status : 1}];
            that.currentGoal = goalMessage;
            that.emit('goal', goalMessage.goal);
    }
    });

    // helper function for determing ordering of timestamps
    // returns t1 < t2
    var isEarlier = function(t1, t2) {
        if(t1.secs > t2.secs) {
            return false;
        } else if(t1.secs < t2.secs) {
            return true;
        } else if(t1.nsecs < t2.nsecs) {
            return true;
        } else {
            return false;
        }
    };

    // TODO: this may be more complicated than necessary, since I'm
    // not sure if the callbacks can ever wind up with a scenario
    // where we've been preempted by a next goal, it hasn't finished
    // processing, and then we get a cancel message
    cancelListener.subscribe(function(cancelMessage) {

        // cancel ALL goals if both empty
        if(cancelMessage.stamp.secs === 0 && cancelMessage.stamp.secs === 0 && cancelMessage.id === '') {
            that.nextGoal = null;
            if(that.currentGoal) {
                that.emit('cancel');
            }
        } else { // treat id and stamp independently
            if(that.currentGoal && cancelMessage.id === that.currentGoal.goal_id.id) {
                that.emit('cancel');
            } else if(that.nextGoal && cancelMessage.id === that.nextGoal.goal_id.id) {
                that.nextGoal = null;
            }

            if(that.nextGoal && isEarlier(that.nextGoal.goal_id.stamp,
                                          cancelMessage.stamp)) {
                that.nextGoal = null;
            }
            if(that.currentGoal && isEarlier(that.currentGoal.goal_id.stamp,
                                             cancelMessage.stamp)) {
                
                that.emit('cancel');
            }
        }
    });

    // publish status at pseudo-fixed rate; required for clients to know they've connected
    var statusInterval = setInterval( function() {
        var currentTime = new Date();
        var secs = Math.floor(currentTime.getTime()/1000);
        var nsecs = Math.round(1000000000*(currentTime.getTime()/1000-secs));
        that.statusMessage.header.stamp.secs = secs;
        that.statusMessage.header.stamp.nsecs = nsecs;
        statusPublisher.publish(that.statusMessage);
    }, 500); // publish every 500ms

}

SimpleActionServer.prototype.__proto__ = EventEmitter2.prototype;

/**
*  Set action state to succeeded and return to client
*/

SimpleActionServer.prototype.setSucceeded = function(result2) {
    

    var resultMessage = new Message({
        status : {goal_id : this.currentGoal.goal_id, status : 3},
        result : result2
    });
    this.resultPublisher.publish(resultMessage);

    this.statusMessage.status_list = [];
    if(this.nextGoal) {
        this.currentGoal = this.nextGoal;
        this.nextGoal = null;
        this.emit('goal', this.currentGoal.goal);
    } else {
        this.currentGoal = null;
    }
};

/**
*  Function to send feedback
*/

SimpleActionServer.prototype.sendFeedback = function(feedback2) {

    var feedbackMessage = new Message({
        status : {goal_id : this.currentGoal.goal_id, status : 1},
        feedback : feedback2
    });
    this.feedbackPublisher.publish(feedbackMessage);
};

/**
*  Handle case where client requests preemption
*/

SimpleActionServer.prototype.setPreempted = function() {

    this.statusMessage.status_list = [];
    var resultMessage = new Message({
        status : {goal_id : this.currentGoal.goal_id, status : 2},
    });
    this.resultPublisher.publish(resultMessage);

    if(this.nextGoal) {
        this.currentGoal = this.nextGoal;
        this.nextGoal = null;
        this.emit('goal', this.currentGoal.goal);
    } else {
        this.currentGoal = null;
    }
};

module.exports = SimpleActionServer;
},{"../core/Message":14,"../core/Topic":21,"eventemitter2":4}],13:[function(require,module,exports){
var Ros = require('../core/Ros');
var mixin = require('../mixin');

var action = module.exports = {
    ActionClient: require('./ActionClient'),
    ActionListener: require('./ActionListener'),
    Goal: require('./Goal'),
    SimpleActionServer: require('./SimpleActionServer')
};

mixin(Ros, ['ActionClient', 'SimpleActionServer'], action);

},{"../core/Ros":16,"../mixin":28,"./ActionClient":9,"./ActionListener":10,"./Goal":11,"./SimpleActionServer":12}],14:[function(require,module,exports){
/**
 * @fileoverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var assign = require('object-assign');

/**
 * Message objects are used for publishing and subscribing to and from topics.
 *
 * @constructor
 * @param values - object matching the fields defined in the .msg definition file
 */
function Message(values) {
  assign(this, values);
}

module.exports = Message;
},{"object-assign":5}],15:[function(require,module,exports){
/**
 * @fileoverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var Service = require('./Service');
var ServiceRequest = require('./ServiceRequest');

/**
 * A ROS parameter.
 *
 * @constructor
 * @param options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the param name, like max_vel_x
 */
function Param(options) {
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
}

/**
 * Fetches the value of the param.
 *
 * @param callback - function with the following params:
 *  * value - the value of the param from ROS.
 */
Param.prototype.get = function(callback) {
  var paramClient = new Service({
    ros : this.ros,
    name : '/rosapi/get_param',
    serviceType : 'rosapi/GetParam'
  });

  var request = new ServiceRequest({
    name : this.name
  });

  paramClient.callService(request, function(result) {
    var value = JSON.parse(result.value);
    callback(value);
  });
};

/**
 * Sets the value of the param in ROS.
 *
 * @param value - value to set param to.
 */
Param.prototype.set = function(value, callback) {
  var paramClient = new Service({
    ros : this.ros,
    name : '/rosapi/set_param',
    serviceType : 'rosapi/SetParam'
  });

  var request = new ServiceRequest({
    name : this.name,
    value : JSON.stringify(value)
  });

  paramClient.callService(request, callback);
};

/**
 * Delete this parameter on the ROS server.
 */
Param.prototype.delete = function(callback) {
  var paramClient = new Service({
    ros : this.ros,
    name : '/rosapi/delete_param',
    serviceType : 'rosapi/DeleteParam'
  });

  var request = new ServiceRequest({
    name : this.name
  });

  paramClient.callService(request, callback);
};

module.exports = Param;
},{"./Service":17,"./ServiceRequest":18}],16:[function(require,module,exports){
/**
 * @fileoverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var WebSocket = require('ws');
var socketAdapter = require('./SocketAdapter.js');

var Service = require('./Service');
var ServiceRequest = require('./ServiceRequest');

var assign = require('object-assign');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * Manages connection to the server and all interactions with ROS.
 *
 * Emits the following events:
 *  * 'error' - there was an error with ROS
 *  * 'connection' - connected to the WebSocket server
 *  * 'close' - disconnected to the WebSocket server
 *  * <topicName> - a message came from rosbridge with the given topic name
 *  * <serviceID> - a service response came from rosbridge with the given ID
 *
 * @constructor
 * @param options - possible keys include: <br>
 *   * url (optional) - (can be specified later with `connect`) the WebSocket URL for rosbridge or the node server url to connect using socket.io (if socket.io exists in the page) <br>
 *   * groovyCompatibility - don't use interfaces that changed after the last groovy release or rosbridge_suite and related tools (defaults to true)
 *   * transportLibrary (optional) - one of 'websocket' (default), 'socket.io' or RTCPeerConnection instance controlling how the connection is created in `connect`.
 *   * transportOptions (optional) - the options to use use when creating a connection. Currently only used if `transportLibrary` is RTCPeerConnection.
 */
function Ros(options) {
  options = options || {};
  this.socket = null;
  this.idCounter = 0;
  this.isConnected = false;
  this.transportLibrary = options.transportLibrary || 'websocket';
  this.transportOptions = options.transportOptions || {};

  if (typeof options.groovyCompatibility === 'undefined') {
    this.groovyCompatibility = true;
  }
  else {
    this.groovyCompatibility = options.groovyCompatibility;
  }

  // Sets unlimited event listeners.
  this.setMaxListeners(0);

  // begin by checking if a URL was given
  if (options.url) {
    this.connect(options.url);
  }
}

Ros.prototype.__proto__ = EventEmitter2.prototype;

/**
 * Connect to the specified WebSocket.
 *
 * @param url - WebSocket URL or RTCDataChannel label for Rosbridge
 */
Ros.prototype.connect = function(url) {
  if (this.transportLibrary === 'socket.io') {
    this.socket = assign(io(url, {'force new connection': true}), socketAdapter(this));
    this.socket.on('connect', this.socket.onopen);
    this.socket.on('data', this.socket.onmessage);
    this.socket.on('close', this.socket.onclose);
    this.socket.on('error', this.socket.onerror);
  } else if (this.transportLibrary.constructor.name === 'RTCPeerConnection') {
    this.socket = assign(this.transportLibrary.createDataChannel(url, this.transportOptions), socketAdapter(this));
  }else {
    this.socket = assign(new WebSocket(url), socketAdapter(this));
  }

};

/**
 * Disconnect from the WebSocket server.
 */
Ros.prototype.close = function() {
  if (this.socket) {
    this.socket.close();
  }
};

/**
 * Sends an authorization request to the server.
 *
 * @param mac - MAC (hash) string given by the trusted source.
 * @param client - IP of the client.
 * @param dest - IP of the destination.
 * @param rand - Random string given by the trusted source.
 * @param t - Time of the authorization request.
 * @param level - User level as a string given by the client.
 * @param end - End time of the client's session.
 */
Ros.prototype.authenticate = function(mac, client, dest, rand, t, level, end) {
  // create the request
  var auth = {
    op : 'auth',
    mac : mac,
    client : client,
    dest : dest,
    rand : rand,
    t : t,
    level : level,
    end : end
  };
  // send the request
  this.callOnConnection(auth);
};

/**
 * Sends the message over the WebSocket, but queues the message up if not yet
 * connected.
 */
Ros.prototype.callOnConnection = function(message) {
  var that = this;
  var messageJson = JSON.stringify(message);
  var emitter = null;
  if (this.transportLibrary === 'socket.io') {
    emitter = function(msg){that.socket.emit('operation', msg);};
  } else {
    emitter = function(msg){that.socket.send(msg);};
  }

  if (!this.isConnected) {
    that.once('connection', function() {
      emitter(messageJson);
    });
  } else {
    emitter(messageJson);
  }
};

/**
 * Sends a set_level request to the server
 *
 * @param level - Status level (none, error, warning, info)
 * @param id - Optional: Operation ID to change status level on
 */
Ros.prototype.setStatusLevel = function(level, id){
  var levelMsg = {
    op: 'set_level',
    level: level,
    id: id
  };

  this.callOnConnection(levelMsg);
};

/**
 * Retrieves Action Servers in ROS as an array of string
 *
 *   * actionservers - Array of action server names
 */
Ros.prototype.getActionServers = function(callback, failedCallback) {
  var getActionServers = new Service({
    ros : this,
    name : '/rosapi/action_servers',
    serviceType : 'rosapi/GetActionServers'
  });

  var request = new ServiceRequest({});
  if (typeof failedCallback === 'function'){
    getActionServers.callService(request,
      function(result) {
        callback(result.action_servers);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    getActionServers.callService(request, function(result) {
      callback(result.action_servers);
    });
  }
};

/**
 * Retrieves list of topics in ROS as an array.
 *
 * @param callback function with params:
 *   * topics - Array of topic names
 */
Ros.prototype.getTopics = function(callback, failedCallback) {
  var topicsClient = new Service({
    ros : this,
    name : '/rosapi/topics',
    serviceType : 'rosapi/Topics'
  });

  var request = new ServiceRequest();
  if (typeof failedCallback === 'function'){
    topicsClient.callService(request,
      function(result) {
        callback(result);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    topicsClient.callService(request, function(result) {
      callback(result);
    });
  }
};

/**
 * Retrieves Topics in ROS as an array as specific type
 *
 * @param topicType topic type to find:
 * @param callback function with params:
 *   * topics - Array of topic names
 */
Ros.prototype.getTopicsForType = function(topicType, callback, failedCallback) {
  var topicsForTypeClient = new Service({
    ros : this,
    name : '/rosapi/topics_for_type',
    serviceType : 'rosapi/TopicsForType'
  });

  var request = new ServiceRequest({
    type: topicType
  });
  if (typeof failedCallback === 'function'){
    topicsForTypeClient.callService(request,
      function(result) {
        callback(result.topics);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    topicsForTypeClient.callService(request, function(result) {
      callback(result.topics);
    });
  }
};

/**
 * Retrieves list of active service names in ROS.
 *
 * @param callback - function with the following params:
 *   * services - array of service names
 */
Ros.prototype.getServices = function(callback, failedCallback) {
  var servicesClient = new Service({
    ros : this,
    name : '/rosapi/services',
    serviceType : 'rosapi/Services'
  });

  var request = new ServiceRequest();
  if (typeof failedCallback === 'function'){
    servicesClient.callService(request,
      function(result) {
        callback(result.services);
      },
      function(message) {
        failedCallback(message);
      }
    );
  }else{
    servicesClient.callService(request, function(result) {
      callback(result.services);
    });
  }
};

/**
 * Retrieves list of services in ROS as an array as specific type
 *
 * @param serviceType service type to find:
 * @param callback function with params:
 *   * topics - Array of service names
 */
Ros.prototype.getServicesForType = function(serviceType, callback, failedCallback) {
  var servicesForTypeClient = new Service({
    ros : this,
    name : '/rosapi/services_for_type',
    serviceType : 'rosapi/ServicesForType'
  });

  var request = new ServiceRequest({
    type: serviceType
  });
  if (typeof failedCallback === 'function'){
    servicesForTypeClient.callService(request,
      function(result) {
        callback(result.services);
      },
      function(message) {
        failedCallback(message);
      }
    );
  }else{
    servicesForTypeClient.callService(request, function(result) {
      callback(result.services);
    });
  }
};

/**
 * Retrieves a detail of ROS service request.
 *
 * @param service name of service:
 * @param callback - function with params:
 *   * type - String of the service type
 */
Ros.prototype.getServiceRequestDetails = function(type, callback, failedCallback) {
  var serviceTypeClient = new Service({
    ros : this,
    name : '/rosapi/service_request_details',
    serviceType : 'rosapi/ServiceRequestDetails'
  });
  var request = new ServiceRequest({
    type: type
  });

  if (typeof failedCallback === 'function'){
    serviceTypeClient.callService(request,
      function(result) {
        callback(result);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    serviceTypeClient.callService(request, function(result) {
      callback(result);
    });
  }
};

/**
 * Retrieves a detail of ROS service request.
 *
 * @param service name of service:
 * @param callback - function with params:
 *   * type - String of the service type
 */
Ros.prototype.getServiceResponseDetails = function(type, callback, failedCallback) {
  var serviceTypeClient = new Service({
    ros : this,
    name : '/rosapi/service_response_details',
    serviceType : 'rosapi/ServiceResponseDetails'
  });
  var request = new ServiceRequest({
    type: type
  });

  if (typeof failedCallback === 'function'){
    serviceTypeClient.callService(request,
      function(result) {
        callback(result);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    serviceTypeClient.callService(request, function(result) {
      callback(result);
    });
  }
};

/**
 * Retrieves list of active node names in ROS.
 *
 * @param callback - function with the following params:
 *   * nodes - array of node names
 */
Ros.prototype.getNodes = function(callback, failedCallback) {
  var nodesClient = new Service({
    ros : this,
    name : '/rosapi/nodes',
    serviceType : 'rosapi/Nodes'
  });

  var request = new ServiceRequest();
  if (typeof failedCallback === 'function'){
    nodesClient.callService(request,
      function(result) {
        callback(result.nodes);
      },
      function(message) {
        failedCallback(message);
      }
    );
  }else{
    nodesClient.callService(request, function(result) {
      callback(result.nodes);
    });
  }
};

/**
  * Retrieves list subscribed topics, publishing topics and services of a specific node
  *
  * @param node name of the node:
  * @param callback - function with params:
  *   * publications - array of published topic names
  *   * subscriptions - array of subscribed topic names
  *   * services - array of service names hosted
  */
Ros.prototype.getNodeDetails = function(node, callback, failedCallback) {
  var nodesClient = new Service({
    ros : this,
    name : '/rosapi/node_details',
    serviceType : 'rosapi/NodeDetails'
  });

  var request = new ServiceRequest({
    node: node
  });
  if (typeof failedCallback === 'function'){
    nodesClient.callService(request,
      function(result) {
        callback(result.subscribing, result.publishing, result.services);
      },
      function(message) {
        failedCallback(message);
      }
    );
  } else {
    nodesClient.callService(request, function(result) {
      callback(result);
    });
  }
};

/**
 * Retrieves list of param names from the ROS Parameter Server.
 *
 * @param callback function with params:
 *  * params - array of param names.
 */
Ros.prototype.getParams = function(callback, failedCallback) {
  var paramsClient = new Service({
    ros : this,
    name : '/rosapi/get_param_names',
    serviceType : 'rosapi/GetParamNames'
  });
  var request = new ServiceRequest();
  if (typeof failedCallback === 'function'){
    paramsClient.callService(request,
      function(result) {
        callback(result.names);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    paramsClient.callService(request, function(result) {
      callback(result.names);
    });
  }
};

/**
 * Retrieves a type of ROS topic.
 *
 * @param topic name of the topic:
 * @param callback - function with params:
 *   * type - String of the topic type
 */
Ros.prototype.getTopicType = function(topic, callback, failedCallback) {
  var topicTypeClient = new Service({
    ros : this,
    name : '/rosapi/topic_type',
    serviceType : 'rosapi/TopicType'
  });
  var request = new ServiceRequest({
    topic: topic
  });

  if (typeof failedCallback === 'function'){
    topicTypeClient.callService(request,
      function(result) {
        callback(result.type);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    topicTypeClient.callService(request, function(result) {
      callback(result.type);
    });
  }
};

/**
 * Retrieves a type of ROS service.
 *
 * @param service name of service:
 * @param callback - function with params:
 *   * type - String of the service type
 */
Ros.prototype.getServiceType = function(service, callback, failedCallback) {
  var serviceTypeClient = new Service({
    ros : this,
    name : '/rosapi/service_type',
    serviceType : 'rosapi/ServiceType'
  });
  var request = new ServiceRequest({
    service: service
  });

  if (typeof failedCallback === 'function'){
    serviceTypeClient.callService(request,
      function(result) {
        callback(result.type);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    serviceTypeClient.callService(request, function(result) {
      callback(result.type);
    });
  }
};

/**
 * Retrieves a detail of ROS message.
 *
 * @param callback - function with params:
 *   * details - Array of the message detail
 * @param message - String of a topic type
 */
Ros.prototype.getMessageDetails = function(message, callback, failedCallback) {
  var messageDetailClient = new Service({
    ros : this,
    name : '/rosapi/message_details',
    serviceType : 'rosapi/MessageDetails'
  });
  var request = new ServiceRequest({
    type: message
  });

  if (typeof failedCallback === 'function'){
    messageDetailClient.callService(request,
      function(result) {
        callback(result.typedefs);
      },
      function(message){
        failedCallback(message);
      }
    );
  }else{
    messageDetailClient.callService(request, function(result) {
      callback(result.typedefs);
    });
  }
};

/**
 * Decode a typedefs into a dictionary like `rosmsg show foo/bar`
 *
 * @param defs - array of type_def dictionary
 */
Ros.prototype.decodeTypeDefs = function(defs) {
  var that = this;

  // calls itself recursively to resolve type definition using hints.
  var decodeTypeDefsRec = function(theType, hints) {
    var typeDefDict = {};
    for (var i = 0; i < theType.fieldnames.length; i++) {
      var arrayLen = theType.fieldarraylen[i];
      var fieldName = theType.fieldnames[i];
      var fieldType = theType.fieldtypes[i];
      if (fieldType.indexOf('/') === -1) { // check the fieldType includes '/' or not
        if (arrayLen === -1) {
          typeDefDict[fieldName] = fieldType;
        }
        else {
          typeDefDict[fieldName] = [fieldType];
        }
      }
      else {
        // lookup the name
        var sub = false;
        for (var j = 0; j < hints.length; j++) {
          if (hints[j].type.toString() === fieldType.toString()) {
            sub = hints[j];
            break;
          }
        }
        if (sub) {
          var subResult = decodeTypeDefsRec(sub, hints);
          if (arrayLen === -1) {
          }
          else {
            typeDefDict[fieldName] = [subResult];
          }
        }
        else {
          that.emit('error', 'Cannot find ' + fieldType + ' in decodeTypeDefs');
        }
      }
    }
    return typeDefDict;
  };

  return decodeTypeDefsRec(defs[0], defs);
};


module.exports = Ros;

},{"./Service":17,"./ServiceRequest":18,"./SocketAdapter.js":20,"eventemitter2":4,"object-assign":5,"ws":43}],17:[function(require,module,exports){
/**
 * @fileoverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var ServiceResponse = require('./ServiceResponse');
var ServiceRequest = require('./ServiceRequest');
var EventEmitter2 = require('eventemitter2').EventEmitter2;

/**
 * A ROS service client.
 *
 * @constructor
 * @params options - possible keys include:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the service name, like /add_two_ints
 *   * serviceType - the service type, like 'rospy_tutorials/AddTwoInts'
 */
function Service(options) {
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
  this.serviceType = options.serviceType;
  this.isAdvertised = false;

  this._serviceCallback = null;
}
Service.prototype.__proto__ = EventEmitter2.prototype;
/**
 * Calls the service. Returns the service response in the callback.
 *
 * @param request - the ROSLIB.ServiceRequest to send
 * @param callback - function with params:
 *   * response - the response from the service request
 * @param failedCallback - the callback function when the service call failed (optional). Params:
 *   * error - the error message reported by ROS
 */
Service.prototype.callService = function(request, callback, failedCallback) {
  if (this.isAdvertised) {
    return;
  }

  var serviceCallId = 'call_service:' + this.name + ':' + (++this.ros.idCounter);

  if (callback || failedCallback) {
    this.ros.once(serviceCallId, function(message) {
      if (message.result !== undefined && message.result === false) {
        if (typeof failedCallback === 'function') {
          failedCallback(message.values);
        }
      } else if (typeof callback === 'function') {
        callback(new ServiceResponse(message.values));
      }
    });
  }

  var call = {
    op : 'call_service',
    id : serviceCallId,
    service : this.name,
    args : request
  };
  this.ros.callOnConnection(call);
};

/**
 * Every time a message is published for the given topic, the callback
 * will be called with the message object.
 *
 * @param callback - function with the following params:
 *   * message - the published message
 */
Service.prototype.advertise = function(callback) {
  if (this.isAdvertised || typeof callback !== 'function') {
    return;
  }

  this._serviceCallback = callback;
  this.ros.on(this.name, this._serviceResponse.bind(this));
  this.ros.callOnConnection({
    op: 'advertise_service',
    type: this.serviceType,
    service: this.name
  });
  this.isAdvertised = true;
};

Service.prototype.unadvertise = function() {
  if (!this.isAdvertised) {
    return;
  }
  this.ros.callOnConnection({
    op: 'unadvertise_service',
    service: this.name
  });
  this.isAdvertised = false;
};

Service.prototype._serviceResponse = function(rosbridgeRequest) {
  var response = {};
  var success = this._serviceCallback(rosbridgeRequest.args, response);

  var call = {
    op: 'service_response',
    service: this.name,
    values: new ServiceResponse(response),
    result: success
  };

  if (rosbridgeRequest.id) {
    call.id = rosbridgeRequest.id;
  }

  this.ros.callOnConnection(call);
};

module.exports = Service;
},{"./ServiceRequest":18,"./ServiceResponse":19,"eventemitter2":4}],18:[function(require,module,exports){
/**
 * @fileoverview
 * @author Brandon Alexander - balexander@willowgarage.com
 */

var assign = require('object-assign');

/**
 * A ServiceRequest is passed into the service call.
 *
 * @constructor
 * @param values - object matching the fields defined in the .srv definition file
 */
function ServiceRequest(values) {
  assign(this, values);
}

module.exports = ServiceRequest;
},{"object-assign":5}],19:[function(require,module,exports){
/**
 * @fileoverview
 * @author Brandon Alexander - balexander@willowgarage.com
 */

var assign = require('object-assign');

/**
 * A ServiceResponse is returned from the service call.
 *
 * @constructor
 * @param values - object matching the fields defined in the .srv definition file
 */
function ServiceResponse(values) {
  assign(this, values);
}

module.exports = ServiceResponse;
},{"object-assign":5}],20:[function(require,module,exports){
/**
 * Socket event handling utilities for handling events on either
 * WebSocket and TCP sockets
 *
 * Note to anyone reviewing this code: these functions are called
 * in the context of their parent object, unless bound
 * @fileOverview
 */
'use strict';

var decompressPng = require('../util/decompressPng');
var WebSocket = require('ws');
var BSON = null;
if(typeof bson !== 'undefined'){
    BSON = bson().BSON;
}

/**
 * Events listeners for a WebSocket or TCP socket to a JavaScript
 * ROS Client. Sets up Messages for a given topic to trigger an
 * event on the ROS client.
 *
 * @namespace SocketAdapter
 * @private
 */
function SocketAdapter(client) {
  function handleMessage(message) {
    if (message.op === 'publish') {
      client.emit(message.topic, message.msg);
    } else if (message.op === 'service_response') {
      client.emit(message.id, message);
    } else if (message.op === 'call_service') {
      client.emit(message.service, message);
    } else if(message.op === 'status'){
      if(message.id){
        client.emit('status:'+message.id, message);
      } else {
        client.emit('status', message);
      }
    }
  }

  function handlePng(message, callback) {
    if (message.op === 'png') {
      decompressPng(message.data, callback);
    } else {
      callback(message);
    }
  }

  function decodeBSON(data, callback) {
    if (!BSON) {
      throw 'Cannot process BSON encoded message without BSON header.';
    }
    var reader = new FileReader();
    reader.onload  = function() {
      var uint8Array = new Uint8Array(this.result);
      var msg = BSON.deserialize(uint8Array);
      callback(msg);
    };
    reader.readAsArrayBuffer(data);
  }

  return {
    /**
     * Emits a 'connection' event on WebSocket connection.
     *
     * @param event - the argument to emit with the event.
     * @memberof SocketAdapter
     */
    onopen: function onOpen(event) {
      client.isConnected = true;
      client.emit('connection', event);
    },

    /**
     * Emits a 'close' event on WebSocket disconnection.
     *
     * @param event - the argument to emit with the event.
     * @memberof SocketAdapter
     */
    onclose: function onClose(event) {
      client.isConnected = false;
      client.emit('close', event);
    },

    /**
     * Emits an 'error' event whenever there was an error.
     *
     * @param event - the argument to emit with the event.
     * @memberof SocketAdapter
     */
    onerror: function onError(event) {
      client.emit('error', event);
    },

    /**
     * Parses message responses from rosbridge and sends to the appropriate
     * topic, service, or param.
     *
     * @param message - the raw JSON message from rosbridge.
     * @memberof SocketAdapter
     */
    onmessage: function onMessage(data) {
      if (typeof Blob !== 'undefined' && data.data instanceof Blob) {
        decodeBSON(data.data, function (message) {
          handlePng(message, handleMessage);
        });
      } else {
        var message = JSON.parse(typeof data === 'string' ? data : data.data);
        handlePng(message, handleMessage);
      }
    }
  };
}

module.exports = SocketAdapter;

},{"../util/decompressPng":45,"ws":43}],21:[function(require,module,exports){
/**
 * @fileoverview
 * @author Brandon Alexander - baalexander@gmail.com
 */

var EventEmitter2 = require('eventemitter2').EventEmitter2;
var Message = require('./Message');

/**
 * Publish and/or subscribe to a topic in ROS.
 *
 * Emits the following events:
 *  * 'warning' - if there are any warning during the Topic creation
 *  * 'message' - the message data from rosbridge
 *
 * @constructor
 * @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * name - the topic name, like /cmd_vel
 *   * messageType - the message type, like 'std_msgs/String'
 *   * compression - the type of compression to use, like 'png'
 *   * throttle_rate - the rate (in ms in between messages) at which to throttle the topics
 *   * queue_size - the queue created at bridge side for re-publishing webtopics (defaults to 100)
 *   * latch - latch the topic when publishing
 *   * queue_length - the queue length at bridge side used when subscribing (defaults to 0, no queueing).
 *   * reconnect_on_close - the flag to enable resubscription and readvertisement on close event(defaults to true).
 */
function Topic(options) {
  options = options || {};
  this.ros = options.ros;
  this.name = options.name;
  this.messageType = options.messageType;
  this.isAdvertised = false;
  this.compression = options.compression || 'none';
  this.throttle_rate = options.throttle_rate || 0;
  this.latch = options.latch || false;
  this.queue_size = options.queue_size || 100;
  this.queue_length = options.queue_length || 0;
  this.reconnect_on_close = options.reconnect_on_close || true;

  // Check for valid compression types
  if (this.compression && this.compression !== 'png' &&
    this.compression !== 'none') {
    this.emit('warning', this.compression +
      ' compression is not supported. No compression will be used.');
  }

  // Check if throttle rate is negative
  if (this.throttle_rate < 0) {
    this.emit('warning', this.throttle_rate + ' is not allowed. Set to 0');
    this.throttle_rate = 0;
  }

  var that = this;
  if (this.reconnect_on_close) {
    this.callForSubscribeAndAdvertise = function(message) {
      that.ros.callOnConnection(message);

      that.waitForReconnect = false;
      that.reconnectFunc = function() {
        if(!that.waitForReconnect) {
          that.waitForReconnect = true;
          that.ros.callOnConnection(message);
          that.ros.once('connection', function() {
            that.waitForReconnect = false;
          });
        }
      };
      that.ros.on('close', that.reconnectFunc);
    };
  }
  else {
    this.callForSubscribeAndAdvertise = this.ros.callOnConnection;
  }

  this._messageCallback = function(data) {
    that.emit('message', new Message(data));
  };
}
Topic.prototype.__proto__ = EventEmitter2.prototype;

/**
 * Every time a message is published for the given topic, the callback
 * will be called with the message object.
 *
 * @param callback - function with the following params:
 *   * message - the published message
 */
Topic.prototype.subscribe = function(callback) {
  if (typeof callback === 'function') {
    this.on('message', callback);
  }

  if (this.subscribeId) { return; }
  this.ros.on(this.name, this._messageCallback);
  this.subscribeId = 'subscribe:' + this.name + ':' + (++this.ros.idCounter);

  this.callForSubscribeAndAdvertise({
    op: 'subscribe',
    id: this.subscribeId,
    type: this.messageType,
    topic: this.name,
    compression: this.compression,
    throttle_rate: this.throttle_rate,
    queue_length: this.queue_length
  });
};

/**
 * Unregisters as a subscriber for the topic. Unsubscribing stop remove
 * all subscribe callbacks. To remove a call back, you must explicitly
 * pass the callback function in.
 *
 * @param callback - the optional callback to unregister, if
 *     * provided and other listeners are registered the topic won't
 *     * unsubscribe, just stop emitting to the passed listener
 */
Topic.prototype.unsubscribe = function(callback) {
  if (callback) {
    this.off('message', callback);
    // If there is any other callbacks still subscribed don't unsubscribe
    if (this.listeners('message').length) { return; }
  }
  if (!this.subscribeId) { return; }
  // Note: Don't call this.removeAllListeners, allow client to handle that themselves
  this.ros.off(this.name, this._messageCallback);
  if(this.reconnect_on_close) {
    this.ros.off('close', this.reconnectFunc);
  }
  this.emit('unsubscribe');
  this.ros.callOnConnection({
    op: 'unsubscribe',
    id: this.subscribeId,
    topic: this.name
  });
  this.subscribeId = null;
};


/**
 * Registers as a publisher for the topic.
 */
Topic.prototype.advertise = function() {
  if (this.isAdvertised) {
    return;
  }
  this.advertiseId = 'advertise:' + this.name + ':' + (++this.ros.idCounter);
  this.callForSubscribeAndAdvertise({
    op: 'advertise',
    id: this.advertiseId,
    type: this.messageType,
    topic: this.name,
    latch: this.latch,
    queue_size: this.queue_size
  });
  this.isAdvertised = true;

  if(!this.reconnect_on_close) {
    var that = this;
    this.ros.on('close', function() {
      that.isAdvertised = false;
    });
  }
};

/**
 * Unregisters as a publisher for the topic.
 */
Topic.prototype.unadvertise = function() {
  if (!this.isAdvertised) {
    return;
  }
  if(this.reconnect_on_close) {
    this.ros.off('close', this.reconnectFunc);
  }
  this.emit('unadvertise');
  this.ros.callOnConnection({
    op: 'unadvertise',
    id: this.advertiseId,
    topic: this.name
  });
  this.isAdvertised = false;
};

/**
 * Publish the message.
 *
 * @param message - A ROSLIB.Message object.
 */
Topic.prototype.publish = function(message) {
  if (!this.isAdvertised) {
    this.advertise();
  }

  this.ros.idCounter++;
  var call = {
    op: 'publish',
    id: 'publish:' + this.name + ':' + this.ros.idCounter,
    topic: this.name,
    msg: message,
    latch: this.latch
  };
  this.ros.callOnConnection(call);
};

module.exports = Topic;

},{"./Message":14,"eventemitter2":4}],22:[function(require,module,exports){
var mixin = require('../mixin');

var core = module.exports = {
    Ros: require('./Ros'),
    Topic: require('./Topic'),
    Message: require('./Message'),
    Param: require('./Param'),
    Service: require('./Service'),
    ServiceRequest: require('./ServiceRequest'),
    ServiceResponse: require('./ServiceResponse')
};

mixin(core.Ros, ['Param', 'Service', 'Topic'], core);

},{"../mixin":28,"./Message":14,"./Param":15,"./Ros":16,"./Service":17,"./ServiceRequest":18,"./ServiceResponse":19,"./Topic":21}],23:[function(require,module,exports){
/**
 * @fileoverview
 * @author David Gossow - dgossow@willowgarage.com
 */

var Vector3 = require('./Vector3');
var Quaternion = require('./Quaternion');

/**
 * A Pose in 3D space. Values are copied into this object.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * position - the Vector3 describing the position
 *   * orientation - the ROSLIB.Quaternion describing the orientation
 */
function Pose(options) {
  options = options || {};
  // copy the values into this object if they exist
  this.position = new Vector3(options.position);
  this.orientation = new Quaternion(options.orientation);
}

/**
 * Apply a transform against this pose.
 *
 * @param tf the transform
 */
Pose.prototype.applyTransform = function(tf) {
  this.position.multiplyQuaternion(tf.rotation);
  this.position.add(tf.translation);
  var tmp = tf.rotation.clone();
  tmp.multiply(this.orientation);
  this.orientation = tmp;
};

/**
 * Clone a copy of this pose.
 *
 * @returns the cloned pose
 */
Pose.prototype.clone = function() {
  return new Pose(this);
};

module.exports = Pose;
},{"./Quaternion":24,"./Vector3":26}],24:[function(require,module,exports){
/**
 * @fileoverview
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A Quaternion.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * x - the x value
 *   * y - the y value
 *   * z - the z value
 *   * w - the w value
 */
function Quaternion(options) {
  options = options || {};
  this.x = options.x || 0;
  this.y = options.y || 0;
  this.z = options.z || 0;
  this.w = (typeof options.w === 'number') ? options.w : 1;
}

/**
 * Perform a conjugation on this quaternion.
 */
Quaternion.prototype.conjugate = function() {
  this.x *= -1;
  this.y *= -1;
  this.z *= -1;
};

/**
 * Return the norm of this quaternion.
 */
Quaternion.prototype.norm = function() {
  return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
};

/**
 * Perform a normalization on this quaternion.
 */
Quaternion.prototype.normalize = function() {
  var l = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
  if (l === 0) {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 1;
  } else {
    l = 1 / l;
    this.x = this.x * l;
    this.y = this.y * l;
    this.z = this.z * l;
    this.w = this.w * l;
  }
};

/**
 * Convert this quaternion into its inverse.
 */
Quaternion.prototype.invert = function() {
  this.conjugate();
  this.normalize();
};

/**
 * Set the values of this quaternion to the product of itself and the given quaternion.
 *
 * @param q the quaternion to multiply with
 */
Quaternion.prototype.multiply = function(q) {
  var newX = this.x * q.w + this.y * q.z - this.z * q.y + this.w * q.x;
  var newY = -this.x * q.z + this.y * q.w + this.z * q.x + this.w * q.y;
  var newZ = this.x * q.y - this.y * q.x + this.z * q.w + this.w * q.z;
  var newW = -this.x * q.x - this.y * q.y - this.z * q.z + this.w * q.w;
  this.x = newX;
  this.y = newY;
  this.z = newZ;
  this.w = newW;
};

/**
 * Clone a copy of this quaternion.
 *
 * @returns the cloned quaternion
 */
Quaternion.prototype.clone = function() {
  return new Quaternion(this);
};

module.exports = Quaternion;

},{}],25:[function(require,module,exports){
/**
 * @fileoverview
 * @author David Gossow - dgossow@willowgarage.com
 */

var Vector3 = require('./Vector3');
var Quaternion = require('./Quaternion');

/**
 * A Transform in 3-space. Values are copied into this object.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * translation - the Vector3 describing the translation
 *   * rotation - the ROSLIB.Quaternion describing the rotation
 */
function Transform(options) {
  options = options || {};
  // Copy the values into this object if they exist
  this.translation = new Vector3(options.translation);
  this.rotation = new Quaternion(options.rotation);
}

/**
 * Clone a copy of this transform.
 *
 * @returns the cloned transform
 */
Transform.prototype.clone = function() {
  return new Transform(this);
};

module.exports = Transform;
},{"./Quaternion":24,"./Vector3":26}],26:[function(require,module,exports){
/**
 * @fileoverview
 * @author David Gossow - dgossow@willowgarage.com
 */

/**
 * A 3D vector.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * x - the x value
 *   * y - the y value
 *   * z - the z value
 */
function Vector3(options) {
  options = options || {};
  this.x = options.x || 0;
  this.y = options.y || 0;
  this.z = options.z || 0;
}

/**
 * Set the values of this vector to the sum of itself and the given vector.
 *
 * @param v the vector to add with
 */
Vector3.prototype.add = function(v) {
  this.x += v.x;
  this.y += v.y;
  this.z += v.z;
};

/**
 * Set the values of this vector to the difference of itself and the given vector.
 *
 * @param v the vector to subtract with
 */
Vector3.prototype.subtract = function(v) {
  this.x -= v.x;
  this.y -= v.y;
  this.z -= v.z;
};

/**
 * Multiply the given Quaternion with this vector.
 *
 * @param q - the quaternion to multiply with
 */
Vector3.prototype.multiplyQuaternion = function(q) {
  var ix = q.w * this.x + q.y * this.z - q.z * this.y;
  var iy = q.w * this.y + q.z * this.x - q.x * this.z;
  var iz = q.w * this.z + q.x * this.y - q.y * this.x;
  var iw = -q.x * this.x - q.y * this.y - q.z * this.z;
  this.x = ix * q.w + iw * -q.x + iy * -q.z - iz * -q.y;
  this.y = iy * q.w + iw * -q.y + iz * -q.x - ix * -q.z;
  this.z = iz * q.w + iw * -q.z + ix * -q.y - iy * -q.x;
};

/**
 * Clone a copy of this vector.
 *
 * @returns the cloned vector
 */
Vector3.prototype.clone = function() {
  return new Vector3(this);
};

module.exports = Vector3;
},{}],27:[function(require,module,exports){
module.exports = {
    Pose: require('./Pose'),
    Quaternion: require('./Quaternion'),
    Transform: require('./Transform'),
    Vector3: require('./Vector3')
};

},{"./Pose":23,"./Quaternion":24,"./Transform":25,"./Vector3":26}],28:[function(require,module,exports){
/**
 * Mixin a feature to the core/Ros prototype.
 * For example, mixin(Ros, ['Topic'], {Topic: <Topic>})
 * will add a topic bound to any Ros instances so a user
 * can call `var topic = ros.Topic({name: '/foo'});`
 *
 * @author Graeme Yeates - github.com/megawac
 */
module.exports = function(Ros, classes, features) {
    classes.forEach(function(className) {
        var Class = features[className];
        Ros.prototype[className] = function(options) {
            options.ros = this;
            return new Class(options);
        };
    });
};

},{}],29:[function(require,module,exports){
/**
 * @fileoverview
 * @author David Gossow - dgossow@willowgarage.com
 */

var ActionClient = require('../actionlib/ActionClient');
var Goal = require('../actionlib/Goal');

var Service = require('../core/Service.js');
var ServiceRequest = require('../core/ServiceRequest.js');

var Transform = require('../math/Transform');

/**
 * A TF Client that listens to TFs from tf2_web_republisher.
 *
 *  @constructor
 *  @param options - object with following keys:
 *   * ros - the ROSLIB.Ros connection handle
 *   * fixedFrame - the fixed frame, like /base_link
 *   * angularThres - the angular threshold for the TF republisher
 *   * transThres - the translation threshold for the TF republisher
 *   * rate - the rate for the TF republisher
 *   * updateDelay - the time (in ms) to wait after a new subscription
 *                   to update the TF republisher's list of TFs
 *   * topicTimeout - the timeout parameter for the TF republisher
 *   * serverName (optional) - the name of the tf2_web_republisher server
 *   * repubServiceName (optional) - the name of the republish_tfs service (non groovy compatibility mode only)
 *   																 default: '/republish_tfs'
 */
function TFClient(options) {
  options = options || {};
  this.ros = options.ros;
  this.fixedFrame = options.fixedFrame || '/base_link';
  this.angularThres = options.angularThres || 2.0;
  this.transThres = options.transThres || 0.01;
  this.rate = options.rate || 10.0;
  this.updateDelay = options.updateDelay || 50;
  var seconds = options.topicTimeout || 2.0;
  var secs = Math.floor(seconds);
  var nsecs = Math.floor((seconds - secs) * 1000000000);
  this.topicTimeout = {
    secs: secs,
    nsecs: nsecs
  };
  this.serverName = options.serverName || '/tf2_web_republisher';
  this.repubServiceName = options.repubServiceName || '/republish_tfs';

  this.currentGoal = false;
  this.currentTopic = false;
  this.frameInfos = {};
  this.republisherUpdateRequested = false;

  // Create an Action client
  this.actionClient = this.ros.ActionClient({
    serverName : this.serverName,
    actionName : 'tf2_web_republisher/TFSubscriptionAction',
    omitStatus : true,
    omitResult : true
  });

  // Create a Service client
  this.serviceClient = this.ros.Service({
    name: this.repubServiceName,
    serviceType: 'tf2_web_republisher/RepublishTFs'
  });
}

/**
 * Process the incoming TF message and send them out using the callback
 * functions.
 *
 * @param tf - the TF message from the server
 */
TFClient.prototype.processTFArray = function(tf) {
  var that = this;
  tf.transforms.forEach(function(transform) {
    var frameID = transform.child_frame_id;
    if (frameID[0] === '/')
    {
      frameID = frameID.substring(1);
    }
    var info = this.frameInfos[frameID];
    if (info) {
      info.transform = new Transform({
        translation : transform.transform.translation,
        rotation : transform.transform.rotation
      });
      info.cbs.forEach(function(cb) {
        cb(info.transform);
      });
    }
  }, this);
};

/**
 * Create and send a new goal (or service request) to the tf2_web_republisher
 * based on the current list of TFs.
 */
TFClient.prototype.updateGoal = function() {
  var goalMessage = {
    source_frames : Object.keys(this.frameInfos),
    target_frame : this.fixedFrame,
    angular_thres : this.angularThres,
    trans_thres : this.transThres,
    rate : this.rate
  };

  // if we're running in groovy compatibility mode (the default)
  // then use the action interface to tf2_web_republisher
  if(this.ros.groovyCompatibility) {
    if (this.currentGoal) {
      this.currentGoal.cancel();
    }
    this.currentGoal = new Goal({
      actionClient : this.actionClient,
      goalMessage : goalMessage
    });

    this.currentGoal.on('feedback', this.processTFArray.bind(this));
    this.currentGoal.send();
  }
  else {
    // otherwise, use the service interface
    // The service interface has the same parameters as the action,
    // plus the timeout
    goalMessage.timeout = this.topicTimeout;
    var request = new ServiceRequest(goalMessage);

    this.serviceClient.callService(request, this.processResponse.bind(this));
  }

  this.republisherUpdateRequested = false;
};

/**
 * Process the service response and subscribe to the tf republisher
 * topic
 *
 * @param response the service response containing the topic name
 */
TFClient.prototype.processResponse = function(response) {
  // if we subscribed to a topic before, unsubscribe so
  // the republisher stops publishing it
  if (this.currentTopic) {
    this.currentTopic.unsubscribe();
  }

  this.currentTopic = this.ros.Topic({
    name: response.topic_name,
    messageType: 'tf2_web_republisher/TFArray'
  });
  this.currentTopic.subscribe(this.processTFArray.bind(this));
};

/**
 * Subscribe to the given TF frame.
 *
 * @param frameID - the TF frame to subscribe to
 * @param callback - function with params:
 *   * transform - the transform data
 */
TFClient.prototype.subscribe = function(frameID, callback) {
  // remove leading slash, if it's there
  if (frameID[0] === '/')
  {
    frameID = frameID.substring(1);
  }
  // if there is no callback registered for the given frame, create emtpy callback list
  if (!this.frameInfos[frameID]) {
    this.frameInfos[frameID] = {
      cbs: []
    };
    if (!this.republisherUpdateRequested) {
      setTimeout(this.updateGoal.bind(this), this.updateDelay);
      this.republisherUpdateRequested = true;
    }
  }
  // if we already have a transform, call back immediately
  else if (this.frameInfos[frameID].transform) {
    callback(this.frameInfos[frameID].transform);
  }
  this.frameInfos[frameID].cbs.push(callback);
};

/**
 * Unsubscribe from the given TF frame.
 *
 * @param frameID - the TF frame to unsubscribe from
 * @param callback - the callback function to remove
 */
TFClient.prototype.unsubscribe = function(frameID, callback) {
  // remove leading slash, if it's there
  if (frameID[0] === '/')
  {
    frameID = frameID.substring(1);
  }
  var info = this.frameInfos[frameID];
  for (var cbs = info && info.cbs || [], idx = cbs.length; idx--;) {
    if (cbs[idx] === callback) {
      cbs.splice(idx, 1);
    }
  }
  if (!callback || cbs.length === 0) {
    delete this.frameInfos[frameID];
  }
};

/**
 * Unsubscribe and unadvertise all topics associated with this TFClient.
 */
TFClient.prototype.dispose = function() {
  this.actionClient.dispose();
  if (this.currentTopic) {
    this.currentTopic.unsubscribe();
  }
};

module.exports = TFClient;

},{"../actionlib/ActionClient":9,"../actionlib/Goal":11,"../core/Service.js":17,"../core/ServiceRequest.js":18,"../math/Transform":25}],30:[function(require,module,exports){
var Ros = require('../core/Ros');
var mixin = require('../mixin');

var tf = module.exports = {
    TFClient: require('./TFClient')
};

mixin(Ros, ['TFClient'], tf);
},{"../core/Ros":16,"../mixin":28,"./TFClient":29}],31:[function(require,module,exports){
/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var Vector3 = require('../math/Vector3');
var UrdfTypes = require('./UrdfTypes');

/**
 * A Box element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfBox(options) {
  this.dimension = null;
  this.type = UrdfTypes.URDF_BOX;

  // Parse the xml string
  var xyz = options.xml.getAttribute('size').split(' ');
  this.dimension = new Vector3({
    x : parseFloat(xyz[0]),
    y : parseFloat(xyz[1]),
    z : parseFloat(xyz[2])
  });
}

module.exports = UrdfBox;
},{"../math/Vector3":26,"./UrdfTypes":40}],32:[function(require,module,exports){
/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

/**
 * A Color element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfColor(options) {
  // Parse the xml string
  var rgba = options.xml.getAttribute('rgba').split(' ');
  this.r = parseFloat(rgba[0]);
  this.g = parseFloat(rgba[1]);
  this.b = parseFloat(rgba[2]);
  this.a = parseFloat(rgba[3]);
}

module.exports = UrdfColor;
},{}],33:[function(require,module,exports){
/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfTypes = require('./UrdfTypes');

/**
 * A Cylinder element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfCylinder(options) {
  this.type = UrdfTypes.URDF_CYLINDER;
  this.length = parseFloat(options.xml.getAttribute('length'));
  this.radius = parseFloat(options.xml.getAttribute('radius'));
}

module.exports = UrdfCylinder;
},{"./UrdfTypes":40}],34:[function(require,module,exports){
/**
 * @fileOverview
 * @author David V. Lu!!  davidvlu@gmail.com
 */

/**
 * A Joint element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfJoint(options) {
  this.name = options.xml.getAttribute('name');
  this.type = options.xml.getAttribute('type');

  var parents = options.xml.getElementsByTagName('parent');
  if(parents.length > 0) {
    this.parent = parents[0].getAttribute('link');
  }

  var children = options.xml.getElementsByTagName('child');
  if(children.length > 0) {
    this.child = children[0].getAttribute('link');
  }

  var limits = options.xml.getElementsByTagName('limit');
  if (limits.length > 0) {
    this.minval = parseFloat( limits[0].getAttribute('lower') );
    this.maxval = parseFloat( limits[0].getAttribute('upper') );
  }
}

module.exports = UrdfJoint;

},{}],35:[function(require,module,exports){
/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfVisual = require('./UrdfVisual');

/**
 * A Link element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfLink(options) {
  this.name = options.xml.getAttribute('name');
  this.visuals = [];
  var visuals = options.xml.getElementsByTagName('visual');

  for( var i=0; i<visuals.length; i++ ) {
    this.visuals.push( new UrdfVisual({
      xml : visuals[i]
    }) );
  }
}

module.exports = UrdfLink;
},{"./UrdfVisual":41}],36:[function(require,module,exports){
/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfColor = require('./UrdfColor');

/**
 * A Material element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfMaterial(options) {
  this.textureFilename = null;
  this.color = null;

  this.name = options.xml.getAttribute('name');

  // Texture
  var textures = options.xml.getElementsByTagName('texture');
  if (textures.length > 0) {
    this.textureFilename = textures[0].getAttribute('filename');
  }

  // Color
  var colors = options.xml.getElementsByTagName('color');
  if (colors.length > 0) {
    // Parse the RBGA string
    this.color = new UrdfColor({
      xml : colors[0]
    });
  }
}

UrdfMaterial.prototype.isLink = function() {
  return this.color === null && this.textureFilename === null;
};

var assign = require('object-assign');

UrdfMaterial.prototype.assign = function(obj) {
    return assign(this, obj);
};

module.exports = UrdfMaterial;

},{"./UrdfColor":32,"object-assign":5}],37:[function(require,module,exports){
/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var Vector3 = require('../math/Vector3');
var UrdfTypes = require('./UrdfTypes');

/**
 * A Mesh element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfMesh(options) {
  this.scale = null;

  this.type = UrdfTypes.URDF_MESH;
  this.filename = options.xml.getAttribute('filename');

  // Check for a scale
  var scale = options.xml.getAttribute('scale');
  if (scale) {
    // Get the XYZ
    var xyz = scale.split(' ');
    this.scale = new Vector3({
      x : parseFloat(xyz[0]),
      y : parseFloat(xyz[1]),
      z : parseFloat(xyz[2])
    });
  }
}

module.exports = UrdfMesh;
},{"../math/Vector3":26,"./UrdfTypes":40}],38:[function(require,module,exports){
/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfMaterial = require('./UrdfMaterial');
var UrdfLink = require('./UrdfLink');
var UrdfJoint = require('./UrdfJoint');
var DOMParser = require('xmldom').DOMParser;

// See https://developer.mozilla.org/docs/XPathResult#Constants
var XPATH_FIRST_ORDERED_NODE_TYPE = 9;

/**
 * A URDF Model can be used to parse a given URDF into the appropriate elements.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 *  * string - the XML element to parse as a string
 */
function UrdfModel(options) {
  options = options || {};
  var xmlDoc = options.xml;
  var string = options.string;
  this.materials = {};
  this.links = {};
  this.joints = {};

  // Check if we are using a string or an XML element
  if (string) {
    // Parse the string
    var parser = new DOMParser();
    xmlDoc = parser.parseFromString(string, 'text/xml');
  }

  // Initialize the model with the given XML node.
  // Get the robot tag
  var robotXml = xmlDoc.documentElement;

  // Get the robot name
  this.name = robotXml.getAttribute('name');

  // Parse all the visual elements we need
  for (var nodes = robotXml.childNodes, i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (node.tagName === 'material') {
      var material = new UrdfMaterial({
        xml : node
      });
      // Make sure this is unique
      if (this.materials[material.name] !== void 0) {
        if( this.materials[material.name].isLink() ) {
          this.materials[material.name].assign( material );
        } else {
          console.warn('Material ' + material.name + 'is not unique.');
        }
      } else {
        this.materials[material.name] = material;
      }
    } else if (node.tagName === 'link') {
      var link = new UrdfLink({
        xml : node
      });
      // Make sure this is unique
      if (this.links[link.name] !== void 0) {
        console.warn('Link ' + link.name + ' is not unique.');
      } else {
        // Check for a material
        for( var j=0; j<link.visuals.length; j++ )
        {
          var mat = link.visuals[j].material; 
          if ( mat !== null ) {
            if (this.materials[mat.name] !== void 0) {
              link.visuals[j].material = this.materials[mat.name];
            } else {
              this.materials[mat.name] = mat;
            }
          }
        }

        // Add the link
        this.links[link.name] = link;
      }
    } else if (node.tagName === 'joint') {
      var joint = new UrdfJoint({
        xml : node
      });
      this.joints[joint.name] = joint;
    }
  }
}

module.exports = UrdfModel;

},{"./UrdfJoint":34,"./UrdfLink":35,"./UrdfMaterial":36,"xmldom":46}],39:[function(require,module,exports){
/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var UrdfTypes = require('./UrdfTypes');

/**
 * A Sphere element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfSphere(options) {
  this.type = UrdfTypes.URDF_SPHERE;
  this.radius = parseFloat(options.xml.getAttribute('radius'));
}

module.exports = UrdfSphere;
},{"./UrdfTypes":40}],40:[function(require,module,exports){
module.exports = {
	URDF_SPHERE : 0,
	URDF_BOX : 1,
	URDF_CYLINDER : 2,
	URDF_MESH : 3
};

},{}],41:[function(require,module,exports){
/**
 * @fileOverview 
 * @author Benjamin Pitzer - ben.pitzer@gmail.com
 * @author Russell Toris - rctoris@wpi.edu
 */

var Pose = require('../math/Pose');
var Vector3 = require('../math/Vector3');
var Quaternion = require('../math/Quaternion');

var UrdfCylinder = require('./UrdfCylinder');
var UrdfBox = require('./UrdfBox');
var UrdfMaterial = require('./UrdfMaterial');
var UrdfMesh = require('./UrdfMesh');
var UrdfSphere = require('./UrdfSphere');

/**
 * A Visual element in a URDF.
 *
 * @constructor
 * @param options - object with following keys:
 *  * xml - the XML element to parse
 */
function UrdfVisual(options) {
  var xml = options.xml;
  this.origin = null;
  this.geometry = null;
  this.material = null;

  // Origin
  var origins = xml.getElementsByTagName('origin');
  if (origins.length === 0) {
    // use the identity as the default
    this.origin = new Pose();
  } else {
    // Check the XYZ
    var xyz = origins[0].getAttribute('xyz');
    var position = new Vector3();
    if (xyz) {
      xyz = xyz.split(' ');
      position = new Vector3({
        x : parseFloat(xyz[0]),
        y : parseFloat(xyz[1]),
        z : parseFloat(xyz[2])
      });
    }

    // Check the RPY
    var rpy = origins[0].getAttribute('rpy');
    var orientation = new Quaternion();
    if (rpy) {
      rpy = rpy.split(' ');
      // Convert from RPY
      var roll = parseFloat(rpy[0]);
      var pitch = parseFloat(rpy[1]);
      var yaw = parseFloat(rpy[2]);
      var phi = roll / 2.0;
      var the = pitch / 2.0;
      var psi = yaw / 2.0;
      var x = Math.sin(phi) * Math.cos(the) * Math.cos(psi) - Math.cos(phi) * Math.sin(the)
          * Math.sin(psi);
      var y = Math.cos(phi) * Math.sin(the) * Math.cos(psi) + Math.sin(phi) * Math.cos(the)
          * Math.sin(psi);
      var z = Math.cos(phi) * Math.cos(the) * Math.sin(psi) - Math.sin(phi) * Math.sin(the)
          * Math.cos(psi);
      var w = Math.cos(phi) * Math.cos(the) * Math.cos(psi) + Math.sin(phi) * Math.sin(the)
          * Math.sin(psi);

      orientation = new Quaternion({
        x : x,
        y : y,
        z : z,
        w : w
      });
      orientation.normalize();
    }
    this.origin = new Pose({
      position : position,
      orientation : orientation
    });
  }

  // Geometry
  var geoms = xml.getElementsByTagName('geometry');
  if (geoms.length > 0) {
    var geom = geoms[0];
    var shape = null;
    // Check for the shape
    for (var i = 0; i < geom.childNodes.length; i++) {
      var node = geom.childNodes[i];
      if (node.nodeType === 1) {
        shape = node;
        break;
      }
    }
    // Check the type
    var type = shape.nodeName;
    if (type === 'sphere') {
      this.geometry = new UrdfSphere({
        xml : shape
      });
    } else if (type === 'box') {
      this.geometry = new UrdfBox({
        xml : shape
      });
    } else if (type === 'cylinder') {
      this.geometry = new UrdfCylinder({
        xml : shape
      });
    } else if (type === 'mesh') {
      this.geometry = new UrdfMesh({
        xml : shape
      });
    } else {
      console.warn('Unknown geometry type ' + type);
    }
  }

  // Material
  var materials = xml.getElementsByTagName('material');
  if (materials.length > 0) {
    this.material = new UrdfMaterial({
      xml : materials[0]
    });
  }
}

module.exports = UrdfVisual;
},{"../math/Pose":23,"../math/Quaternion":24,"../math/Vector3":26,"./UrdfBox":31,"./UrdfCylinder":33,"./UrdfMaterial":36,"./UrdfMesh":37,"./UrdfSphere":39}],42:[function(require,module,exports){
module.exports = require('object-assign')({
    UrdfBox: require('./UrdfBox'),
    UrdfColor: require('./UrdfColor'),
    UrdfCylinder: require('./UrdfCylinder'),
    UrdfLink: require('./UrdfLink'),
    UrdfMaterial: require('./UrdfMaterial'),
    UrdfMesh: require('./UrdfMesh'),
    UrdfModel: require('./UrdfModel'),
    UrdfSphere: require('./UrdfSphere'),
    UrdfVisual: require('./UrdfVisual')
}, require('./UrdfTypes'));

},{"./UrdfBox":31,"./UrdfColor":32,"./UrdfCylinder":33,"./UrdfLink":35,"./UrdfMaterial":36,"./UrdfMesh":37,"./UrdfModel":38,"./UrdfSphere":39,"./UrdfTypes":40,"./UrdfVisual":41,"object-assign":5}],43:[function(require,module,exports){
(function (global){
module.exports = global.WebSocket;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],44:[function(require,module,exports){
/* global document */
module.exports = function Canvas() {
	return document.createElement('canvas');
};
},{}],45:[function(require,module,exports){
(function (global){
/**
 * @fileOverview
 * @author Graeme Yeates - github.com/megawac
 */

'use strict';

var Canvas = require('canvas');
var Image = Canvas.Image || global.Image;

/**
 * If a message was compressed as a PNG image (a compression hack since
 * gzipping over WebSockets * is not supported yet), this function places the
 * "image" in a canvas element then decodes the * "image" as a Base64 string.
 *
 * @private
 * @param data - object containing the PNG data.
 * @param callback - function with params:
 *   * data - the uncompressed data
 */
function decompressPng(data, callback) {
  // Uncompresses the data before sending it through (use image/canvas to do so).
  var image = new Image();
  // When the image loads, extracts the raw data (JSON message).
  image.onload = function() {
    // Creates a local canvas to draw on.
    var canvas = new Canvas();
    var context = canvas.getContext('2d');

    // Sets width and height.
    canvas.width = image.width;
    canvas.height = image.height;

    // Prevents anti-aliasing and loosing data
    context.imageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.mozImageSmoothingEnabled = false;

    // Puts the data into the image.
    context.drawImage(image, 0, 0);
    // Grabs the raw, uncompressed data.
    var imageData = context.getImageData(0, 0, image.width, image.height).data;

    // Constructs the JSON.
    var jsonData = '';
    for (var i = 0; i < imageData.length; i += 4) {
      // RGB
      jsonData += String.fromCharCode(imageData[i], imageData[i + 1], imageData[i + 2]);
    }
    callback(JSON.parse(jsonData));
  };
  // Sends the image data to load.
  image.src = 'data:image/png;base64,' + data;
}

module.exports = decompressPng;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"canvas":44}],46:[function(require,module,exports){
(function (global){
exports.DOMImplementation = global.DOMImplementation;
exports.XMLSerializer = global.XMLSerializer;
exports.DOMParser = global.DOMParser;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],47:[function(require,module,exports){
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

},{"./ponyfill.js":48}],48:[function(require,module,exports){
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
},{}],49:[function(require,module,exports){
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

},{"process/browser.js":6,"timers":49}],50:[function(require,module,exports){
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

},{"../index":51}],51:[function(require,module,exports){
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

},{"symbol-observable":47}],52:[function(require,module,exports){
'use strict';

var _run = require('@cycle/run');

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _makeROSDriver = require('./makeROSDriver');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function main(sources) {
  // adapted from from
  //   https://github.com/RobotWebTools/roslibjs/blob/master/examples/simple.html

  // Publishing a Topic
  // ------------------

  var topic$ = _xstream2.default.of({
    type: 'topic',
    value: {
      name: '/cmd_vel',
      message: {
        linear: {
          x: 0.1,
          y: 0.2,
          z: 0.3
        },
        angular: {
          x: -0.1,
          y: -0.2,
          z: -0.3
        }
      }
    }
  });

  //Subscribing to a Topic
  //----------------------

  sources.ROS.filter(function (value) {
    return value.type === 'topic' && value.value.name === '/listener';
  }).addListener({
    next: function next(value) {
      var topic = value.value;
      console.log('Received message on ' + topic.name + ': ' + topic.message.data);
    }
  });

  // Calling a service
  // -----------------

  var service$ = _xstream2.default.of({
    type: 'service',
    value: {
      name: '/add_two_ints',
      request: {
        a: 1,
        b: 2
      }
    }
  });

  sources.ROS.filter(function (value) {
    return value.type === 'service' && value.value.name === '/add_two_ints';
  }).map(function (value) {
    return value.value.response$;
  }).flatten().addListener({
    next: function next(result) {
      console.log('Result for service call: ' + result.sum);
    },
    error: function error(err) {
      return console.error(err);
    }
  });

  // adapted from from
  //   https://github.com/RobotWebTools/roslibjs/blob/master/examples/fibonacci.html

  // The ActionClient
  // ----------------

  var action$ = _xstream2.default.periodic(3000).mapTo({
    type: 'action',
    value: {
      name: '/fibonacci',
      goalMessage: {
        order: 1
      }
    }
  });

  var fibonacciClient = sources.ROS.filter(function (value) {
    return value.type === 'action' && value.value.name === '/fibonacci';
  });
  fibonacciClient.map(function (value) {
    return value.value.feedback$;
  }).flatten().addListener({
    next: function next(feedback) {
      console.log('Feedback: ' + feedback.sequence);
    }
  });
  fibonacciClient.map(function (value) {
    return value.value.result$;
  }).flatten().addListener({
    next: function next(result) {
      console.log('Final Result: ' + result.sequence);
    }
  });

  var ros$ = _xstream2.default.merge(topic$, service$, action$);
  return {
    ROS: ros$
  };
}

(0, _run.run)(main, {
  ROS: (0, _makeROSDriver.makeROSDriver)({
    roslib: { url: 'ws://localhost:9090' },
    topics: [{
      name: '/cmd_vel',
      messageType: 'geometry_msgs/Twist'
    }, {
      name: '/listener',
      messageType: 'std_msgs/String'
    }],
    services: [{
      name: '/add_two_ints',
      serviceType: 'rospy_tutorials/AddTwoInts'
    }],
    actions: [{
      serverName: '/fibonacci',
      actionName: 'actionlib_tutorials/FibonacciAction'
    }]
  })
});

},{"./makeROSDriver":53,"@cycle/run":2,"xstream":51}],53:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.makeROSDriver = makeROSDriver;

var _roslib = require('roslib');

var _roslib2 = _interopRequireDefault(_roslib);

var _xstream = require('xstream');

var _xstream2 = _interopRequireDefault(_xstream);

var _fromEvent = require('xstream/extra/fromEvent');

var _fromEvent2 = _interopRequireDefault(_fromEvent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function makeROSDriver(options) {
  if (!options) {
    options = {};
  }
  if (!options.topics) {
    options.topics = [];
  }
  if (!options.services) {
    options.services = [];
  }
  if (!options.actions) {
    options.actions = [];
  }

  // For options.roslib, see
  //   https://github.com/RobotWebTools/roslibjs/blob/master/src/core/Ros.js#L26-L30
  var ros = new _roslib2.default.Ros(options.roslib);
  var topics = {};
  options.topics.map(function (topicOptions) {
    // For topicOptions, see
    //   https://github.com/RobotWebTools/roslibjs/blob/master/src/core/Topic.js#L17-L26
    topics[topicOptions.name] = new _roslib2.default.Topic(_extends({}, topicOptions, {
      ros: ros
    }));
  });
  var services = {};
  options.services.map(function (serviceOptions) {
    // For topicOptions, see
    //   https://github.com/RobotWebTools/roslibjs/blob/master/src/core/Service.js#L14-L17
    services[serviceOptions.name] = new _roslib2.default.Service(_extends({}, serviceOptions, {
      ros: ros
    }));
  });
  var serviceClient$ = _xstream2.default.create();
  var actions = {};
  options.actions.map(function (actionOptions) {
    // For topicOptions, see
    //   https://github.com/RobotWebTools/roslibjs/blob/master/src/actionlib/ActionClient.js#L20-L24
    actions[actionOptions.serverName] = new _roslib2.default.ActionClient(_extends({}, actionOptions, {
      ros: ros
    }));
  });
  // https://github.com/RobotWebTools/roslibjs/blob/master/src/actionlib/ActionClient.js#L14-L17
  var actionClient$ = _xstream2.default.create();

  return function (outgoing$) {

    outgoing$.addListener({
      next: function next(outgoing) {
        switch (outgoing.type) {
          case 'topic':
            // // Example outgoing "topic" value
            // outgoing = {
            //   type: 'topic',
            //   value: {
            //     name: '/cmd_vel',
            //     message: {
            //       linear : {
            //         x : 0.1,
            //         y : 0.2,
            //         z : 0.3,
            //       },
            //       angular : {
            //         x : -0.1,
            //         y : -0.2,
            //         z : -0.3,
            //       },
            //     },
            //   },
            // }
            topics[outgoing.value.name].publish(outgoing.value.message);
            break;
          case 'service':
            // // Example outgoing "service" value
            // incoming = {
            //   type: 'service',
            //   value: {
            //     name: '/add_two_ints',
            //     request: {
            //       a: 1,
            //       b: 2,
            //     },
            //   },
            // }
            serviceClient$.shamefullySendNext({
              name: outgoing.value.name,
              response$: _xstream2.default.create({
                start: function start(listener) {
                  services[outgoing.value.name].callService(new _roslib2.default.ServiceRequest(outgoing.value.request), function (response) {
                    listener.next(response);
                    listener.complete();
                  }, listener.error.bind(listener));
                },
                stop: function stop() {}
              })
            });
            break;
          case 'action':
            // // Example outgoing "action" value
            // incoming = {
            //   type: 'action',
            //   value: {
            //     name: '/fibonacci',
            //     goalMessage: {
            //       order: 7,
            //     },
            //   },
            // }
            var goal = new _roslib2.default.Goal({
              actionClient: actions[outgoing.value.name],
              goalMessage: outgoing.value.goalMessage
            });
            actionClient$.shamefullySendNext({
              name: outgoing.value.name,
              timeout$: (0, _fromEvent2.default)(goal, 'timeout'),
              status$: (0, _fromEvent2.default)(goal, 'status'),
              feedback$: (0, _fromEvent2.default)(goal, 'feedback'),
              result$: (0, _fromEvent2.default)(goal, 'result')
            });
            goal.send();
            break;
          default:
            console.warn('Unknown outgoing.type', outgoing.type);
        }
      },
      error: function error() {},
      complete: function complete() {}
    });

    var incoming$ = _xstream2.default.create({
      start: function start(listener) {
        Object.keys(topics).map(function (topic) {
          topics[topic].subscribe(function (message) {
            // // Example incoming "topic" value
            // incoming = {
            //   type: 'topic',
            //   value: {
            //     name: '/cmd_vel',
            //     message: {
            //       linear : {
            //         x : 0.1,
            //         y : 0.2,
            //         z : 0.3,
            //       },
            //       angular : {
            //         x : -0.1,
            //         y : -0.2,
            //         z : -0.3,
            //       },
            //     },
            //   },
            // }
            listener.next({ type: 'topic', value: { name: topic, message: message } });
          });
        });

        serviceClient$.addListener({
          next: function next(serviceClient) {
            // // Example incoming "service" value
            // incoming = {
            //   type: 'service',
            //   value: {
            //     name: '/add_two_ints',
            //     response$: // an xstream that emits a response object
            //   },
            // }
            listener.next({ type: 'service', value: serviceClient });
          }
        });

        actionClient$.addListener({
          next: function next(actionClient) {
            // // Example incoming "action" value
            // incoming = {
            //   type: 'action',
            //   value: {
            //     name: '/fibonacci',
            //     response$: // an xstream that emits timeout
            //     status$: // an xstream that emits status
            //     feedback$: // an xstream that emits feedback
            //     result$: // an xstream that emits results
            //   },
            // }
            listener.next({ type: 'action', value: actionClient });
          }
        });
      },
      stop: function stop() {
        Object.keys(topics).map(function (topic) {
          topics[topic].unsubscribe();
        });
      }
    });

    return incoming$;
  };
}

},{"roslib":8,"xstream":51,"xstream/extra/fromEvent":50}]},{},[52])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2FkYXB0LmpzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW50ZXJuYWxzLmpzIiwibm9kZV9tb2R1bGVzL2V2ZW50ZW1pdHRlcjIvbGliL2V2ZW50ZW1pdHRlcjIuanMiLCJub2RlX21vZHVsZXMvb2JqZWN0LWFzc2lnbi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcXVpY2t0YXNrL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvUm9zTGliLmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvYWN0aW9ubGliL0FjdGlvbkNsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL2FjdGlvbmxpYi9BY3Rpb25MaXN0ZW5lci5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL2FjdGlvbmxpYi9Hb2FsLmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvYWN0aW9ubGliL1NpbXBsZUFjdGlvblNlcnZlci5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL2FjdGlvbmxpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL2NvcmUvTWVzc2FnZS5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL2NvcmUvUGFyYW0uanMiLCJub2RlX21vZHVsZXMvcm9zbGliL3NyYy9jb3JlL1Jvcy5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL2NvcmUvU2VydmljZS5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL2NvcmUvU2VydmljZVJlcXVlc3QuanMiLCJub2RlX21vZHVsZXMvcm9zbGliL3NyYy9jb3JlL1NlcnZpY2VSZXNwb25zZS5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL2NvcmUvU29ja2V0QWRhcHRlci5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL2NvcmUvVG9waWMuanMiLCJub2RlX21vZHVsZXMvcm9zbGliL3NyYy9jb3JlL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvbWF0aC9Qb3NlLmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvbWF0aC9RdWF0ZXJuaW9uLmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvbWF0aC9UcmFuc2Zvcm0uanMiLCJub2RlX21vZHVsZXMvcm9zbGliL3NyYy9tYXRoL1ZlY3RvcjMuanMiLCJub2RlX21vZHVsZXMvcm9zbGliL3NyYy9tYXRoL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvbWl4aW4uanMiLCJub2RlX21vZHVsZXMvcm9zbGliL3NyYy90Zi9URkNsaWVudC5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL3RmL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvdXJkZi9VcmRmQm94LmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvdXJkZi9VcmRmQ29sb3IuanMiLCJub2RlX21vZHVsZXMvcm9zbGliL3NyYy91cmRmL1VyZGZDeWxpbmRlci5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL3VyZGYvVXJkZkpvaW50LmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvdXJkZi9VcmRmTGluay5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL3VyZGYvVXJkZk1hdGVyaWFsLmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvdXJkZi9VcmRmTWVzaC5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL3VyZGYvVXJkZk1vZGVsLmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvdXJkZi9VcmRmU3BoZXJlLmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvdXJkZi9VcmRmVHlwZXMuanMiLCJub2RlX21vZHVsZXMvcm9zbGliL3NyYy91cmRmL1VyZGZWaXN1YWwuanMiLCJub2RlX21vZHVsZXMvcm9zbGliL3NyYy91cmRmL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Jvc2xpYi9zcmMvdXRpbC9zaGltL1dlYlNvY2tldC5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL3V0aWwvc2hpbS9jYW52YXMuanMiLCJub2RlX21vZHVsZXMvcm9zbGliL3NyYy91dGlsL3NoaW0vZGVjb21wcmVzc1BuZy5qcyIsIm5vZGVfbW9kdWxlcy9yb3NsaWIvc3JjL3V0aWwvc2hpbS94bWxkb20uanMiLCJub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9wb255ZmlsbC5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwibm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2V4dHJhL2Zyb21FdmVudC50cyIsIm5vZGVfbW9kdWxlcy94c3RyZWFtL3NyYy9pbmRleC50cyIsInNyYy9pbmRleC5qcyIsInNyYy9tYWtlUk9TRHJpdmVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzbUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNYQTs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBOzs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ3ZEQTtBQUNBO0FBQ0E7Ozs7O0FDRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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LEVBQWlCLE9BQU8sWUFBeEIsRUFBZDtBQUNEO0FBZHVCLFNBQTFCO0FBaUJELE9BMUR5QjtBQTJEMUIsWUFBTSxnQkFBTTtBQUNWLGVBQU8sSUFBUCxDQUFZLE1BQVosRUFBb0IsR0FBcEIsQ0FBd0IsaUJBQVM7QUFDL0IsaUJBQU8sS0FBUCxFQUFjLFdBQWQ7QUFDRCxTQUZEO0FBR0Q7QUEvRHlCLEtBQVYsQ0FBbEI7O0FBa0VBLFdBQU8sU0FBUDtBQUNELEdBM0pEO0FBNEpEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBpbnRlcm5hbHNfMSA9IHJlcXVpcmUoXCIuL2ludGVybmFsc1wiKTtcbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHByZXBhcmVzIHRoZSBDeWNsZSBhcHBsaWNhdGlvbiB0byBiZSBleGVjdXRlZC4gVGFrZXMgYSBgbWFpbmBcbiAqIGZ1bmN0aW9uIGFuZCBwcmVwYXJlcyB0byBjaXJjdWxhcmx5IGNvbm5lY3RzIGl0IHRvIHRoZSBnaXZlbiBjb2xsZWN0aW9uIG9mXG4gKiBkcml2ZXIgZnVuY3Rpb25zLiBBcyBhbiBvdXRwdXQsIGBzZXR1cCgpYCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRocmVlXG4gKiBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kIGBydW5gLiBPbmx5IHdoZW4gYHJ1bigpYCBpcyBjYWxsZWQgd2lsbFxuICogdGhlIGFwcGxpY2F0aW9uIGFjdHVhbGx5IGV4ZWN1dGUuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGBydW4oKWAgZm9yXG4gKiBtb3JlIGRldGFpbHMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtzZXR1cH0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgc2lua3MsIHJ1bn0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogY29uc3QgZGlzcG9zZSA9IHJ1bigpOyAvLyBFeGVjdXRlcyB0aGUgYXBwbGljYXRpb25cbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgc2lua3NgIGFuZFxuICogYHJ1bmAuIGBzb3VyY2VzYCBpcyB0aGUgY29sbGVjdGlvbiBvZiBkcml2ZXIgc291cmNlcywgYHNpbmtzYCBpcyB0aGVcbiAqIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNpbmtzLCB0aGVzZSBjYW4gYmUgdXNlZCBmb3IgZGVidWdnaW5nIG9yIHRlc3RpbmcuIGBydW5gXG4gKiBpcyB0aGUgZnVuY3Rpb24gdGhhdCBvbmNlIGNhbGxlZCB3aWxsIGV4ZWN1dGUgdGhlIGFwcGxpY2F0aW9uLlxuICogQGZ1bmN0aW9uIHNldHVwXG4gKi9cbmZ1bmN0aW9uIHNldHVwKG1haW4sIGRyaXZlcnMpIHtcbiAgICBpZiAodHlwZW9mIG1haW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIHRoZSAnbWFpbicgXCIgKyBcImZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMuXCIpO1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWxzXzEuaXNPYmplY3RFbXB0eShkcml2ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGF0IGxlYXN0IG9uZSBkcml2ZXIgZnVuY3Rpb24gZGVjbGFyZWQgYXMgYSBwcm9wZXJ0eS5cIik7XG4gICAgfVxuICAgIHZhciBlbmdpbmUgPSBzZXR1cFJldXNhYmxlKGRyaXZlcnMpO1xuICAgIHZhciBzaW5rcyA9IG1haW4oZW5naW5lLnNvdXJjZXMpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcyA9IHdpbmRvdy5DeWNsZWpzIHx8IHt9O1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcy5zaW5rcyA9IHNpbmtzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcnVuKCkge1xuICAgICAgICB2YXIgZGlzcG9zZVJ1biA9IGVuZ2luZS5ydW4oc2lua3MpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgICAgIGRpc3Bvc2VSdW4oKTtcbiAgICAgICAgICAgIGVuZ2luZS5kaXNwb3NlKCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNpbmtzOiBzaW5rcywgc291cmNlczogZW5naW5lLnNvdXJjZXMsIHJ1bjogX3J1biB9O1xufVxuZXhwb3J0cy5zZXR1cCA9IHNldHVwO1xuLyoqXG4gKiBBIHBhcnRpYWxseS1hcHBsaWVkIHZhcmlhbnQgb2Ygc2V0dXAoKSB3aGljaCBhY2NlcHRzIG9ubHkgdGhlIGRyaXZlcnMsIGFuZFxuICogYWxsb3dzIG1hbnkgYG1haW5gIGZ1bmN0aW9ucyB0byBleGVjdXRlIGFuZCByZXVzZSB0aGlzIHNhbWUgc2V0IG9mIGRyaXZlcnMuXG4gKlxuICogVGFrZXMgYW4gb2JqZWN0IHdpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBpbnB1dCwgYW5kIG91dHB1dHMgYW4gb2JqZWN0IHdoaWNoXG4gKiBjb250YWlucyB0aGUgZ2VuZXJhdGVkIHNvdXJjZXMgKGZyb20gdGhvc2UgZHJpdmVycykgYW5kIGEgYHJ1bmAgZnVuY3Rpb25cbiAqICh3aGljaCBpbiB0dXJuIGV4cGVjdHMgc2lua3MgYXMgYXJndW1lbnQpLiBUaGlzIGBydW5gIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWRcbiAqIG11bHRpcGxlIHRpbWVzIHdpdGggZGlmZmVyZW50IGFyZ3VtZW50cywgYW5kIGl0IHdpbGwgcmV1c2UgdGhlIGRyaXZlcnMgdGhhdFxuICogd2VyZSBwYXNzZWQgdG8gYHNldHVwUmV1c2FibGVgLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYGBganNcbiAqIGltcG9ydCB7c2V0dXBSZXVzYWJsZX0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgcnVuLCBkaXNwb3NlfSA9IHNldHVwUmV1c2FibGUoZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGNvbnN0IHNpbmtzID0gbWFpbihzb3VyY2VzKTtcbiAqIGNvbnN0IGRpc3Bvc2VSdW4gPSBydW4oc2lua3MpO1xuICogLy8gLi4uXG4gKiBkaXNwb3NlUnVuKCk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTsgLy8gZW5kcyB0aGUgcmV1c2FiaWxpdHkgb2YgZHJpdmVyc1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgcnVuYCBhbmRcbiAqIGBkaXNwb3NlYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgcnVuYCBpcyB0aGVcbiAqIGZ1bmN0aW9uIHRoYXQgb25jZSBjYWxsZWQgd2l0aCAnc2lua3MnIGFzIGFyZ3VtZW50LCB3aWxsIGV4ZWN1dGUgdGhlXG4gKiBhcHBsaWNhdGlvbiwgdHlpbmcgdG9nZXRoZXIgc291cmNlcyB3aXRoIHNpbmtzLiBgZGlzcG9zZWAgdGVybWluYXRlcyB0aGVcbiAqIHJldXNhYmxlIHJlc291cmNlcyB1c2VkIGJ5IHRoZSBkcml2ZXJzLiBOb3RlIGFsc28gdGhhdCBgcnVuYCByZXR1cm5zIGFcbiAqIGRpc3Bvc2UgZnVuY3Rpb24gd2hpY2ggdGVybWluYXRlcyByZXNvdXJjZXMgdGhhdCBhcmUgc3BlY2lmaWMgKG5vdCByZXVzYWJsZSlcbiAqIHRvIHRoYXQgcnVuLlxuICogQGZ1bmN0aW9uIHNldHVwUmV1c2FibGVcbiAqL1xuZnVuY3Rpb24gc2V0dXBSZXVzYWJsZShkcml2ZXJzKSB7XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBwcm9wZXJ0aWVzLlwiKTtcbiAgICB9XG4gICAgaWYgKGludGVybmFsc18xLmlzT2JqZWN0RW1wdHkoZHJpdmVycykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIHNpbmtQcm94aWVzID0gaW50ZXJuYWxzXzEubWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpO1xuICAgIHZhciByYXdTb3VyY2VzID0gaW50ZXJuYWxzXzEuY2FsbERyaXZlcnMoZHJpdmVycywgc2lua1Byb3hpZXMpO1xuICAgIHZhciBzb3VyY2VzID0gaW50ZXJuYWxzXzEuYWRhcHRTb3VyY2VzKHJhd1NvdXJjZXMpO1xuICAgIGZ1bmN0aW9uIF9ydW4oc2lua3MpIHtcbiAgICAgICAgcmV0dXJuIGludGVybmFsc18xLnJlcGxpY2F0ZU1hbnkoc2lua3MsIHNpbmtQcm94aWVzKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcG9zZUVuZ2luZSgpIHtcbiAgICAgICAgaW50ZXJuYWxzXzEuZGlzcG9zZVNvdXJjZXMoc291cmNlcyk7XG4gICAgICAgIGludGVybmFsc18xLmRpc3Bvc2VTaW5rUHJveGllcyhzaW5rUHJveGllcyk7XG4gICAgfVxuICAgIHJldHVybiB7IHNvdXJjZXM6IHNvdXJjZXMsIHJ1bjogX3J1biwgZGlzcG9zZTogZGlzcG9zZUVuZ2luZSB9O1xufVxuZXhwb3J0cy5zZXR1cFJldXNhYmxlID0gc2V0dXBSZXVzYWJsZTtcbi8qKlxuICogVGFrZXMgYSBgbWFpbmAgZnVuY3Rpb24gYW5kIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb25cbiAqIG9mIGRyaXZlciBmdW5jdGlvbnMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHJ1biBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IGRpc3Bvc2UgPSBydW4obWFpbiwgZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTtcbiAqIGBgYFxuICpcbiAqIFRoZSBgbWFpbmAgZnVuY3Rpb24gZXhwZWN0cyBhIGNvbGxlY3Rpb24gb2YgXCJzb3VyY2VcIiBzdHJlYW1zIChyZXR1cm5lZCBmcm9tXG4gKiBkcml2ZXJzKSBhcyBpbnB1dCwgYW5kIHNob3VsZCByZXR1cm4gYSBjb2xsZWN0aW9uIG9mIFwic2lua1wiIHN0cmVhbXMgKHRvIGJlXG4gKiBnaXZlbiB0byBkcml2ZXJzKS4gQSBcImNvbGxlY3Rpb24gb2Ygc3RyZWFtc1wiIGlzIGEgSmF2YVNjcmlwdCBvYmplY3Qgd2hlcmVcbiAqIGtleXMgbWF0Y2ggdGhlIGRyaXZlciBuYW1lcyByZWdpc3RlcmVkIGJ5IHRoZSBgZHJpdmVyc2Agb2JqZWN0LCBhbmQgdmFsdWVzXG4gKiBhcmUgdGhlIHN0cmVhbXMuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGVhY2ggZHJpdmVyIHRvIHNlZSBtb3JlXG4gKiBkZXRhaWxzIG9uIHdoYXQgdHlwZXMgb2Ygc291cmNlcyBpdCBvdXRwdXRzIGFuZCBzaW5rcyBpdCByZWNlaXZlcy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgZGlzcG9zZSBmdW5jdGlvbiwgdXNlZCB0byB0ZXJtaW5hdGUgdGhlIGV4ZWN1dGlvbiBvZiB0aGVcbiAqIEN5Y2xlLmpzIHByb2dyYW0sIGNsZWFuaW5nIHVwIHJlc291cmNlcyB1c2VkLlxuICogQGZ1bmN0aW9uIHJ1blxuICovXG5mdW5jdGlvbiBydW4obWFpbiwgZHJpdmVycykge1xuICAgIHZhciBwcm9ncmFtID0gc2V0dXAobWFpbiwgZHJpdmVycyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgIHdpbmRvd1snQ3ljbGVqc0RldlRvb2xfc3RhcnRHcmFwaFNlcmlhbGl6ZXInXSkge1xuICAgICAgICB3aW5kb3dbJ0N5Y2xlanNEZXZUb29sX3N0YXJ0R3JhcGhTZXJpYWxpemVyJ10ocHJvZ3JhbS5zaW5rcyk7XG4gICAgfVxuICAgIHJldHVybiBwcm9ncmFtLnJ1bigpO1xufVxuZXhwb3J0cy5ydW4gPSBydW47XG5leHBvcnRzLmRlZmF1bHQgPSBydW47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBxdWlja3Rhc2tfMSA9IHJlcXVpcmUoXCJxdWlja3Rhc2tcIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCIuL2FkYXB0XCIpO1xudmFyIHNjaGVkdWxlTWljcm90YXNrID0gcXVpY2t0YXNrXzEuZGVmYXVsdCgpO1xuZnVuY3Rpb24gbWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpIHtcbiAgICB2YXIgc2lua1Byb3hpZXMgPSB7fTtcbiAgICBmb3IgKHZhciBuYW1lXzEgaW4gZHJpdmVycykge1xuICAgICAgICBpZiAoZHJpdmVycy5oYXNPd25Qcm9wZXJ0eShuYW1lXzEpKSB7XG4gICAgICAgICAgICBzaW5rUHJveGllc1tuYW1lXzFdID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNpbmtQcm94aWVzO1xufVxuZXhwb3J0cy5tYWtlU2lua1Byb3hpZXMgPSBtYWtlU2lua1Byb3hpZXM7XG5mdW5jdGlvbiBjYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgbmFtZV8yIGluIGRyaXZlcnMpIHtcbiAgICAgICAgaWYgKGRyaXZlcnMuaGFzT3duUHJvcGVydHkobmFtZV8yKSkge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdID0gZHJpdmVyc1tuYW1lXzJdKHNpbmtQcm94aWVzW25hbWVfMl0sIG5hbWVfMik7XG4gICAgICAgICAgICBpZiAoc291cmNlc1tuYW1lXzJdICYmIHR5cGVvZiBzb3VyY2VzW25hbWVfMl0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdLl9pc0N5Y2xlU291cmNlID0gbmFtZV8yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5jYWxsRHJpdmVycyA9IGNhbGxEcml2ZXJzO1xuLy8gTk9URTogdGhpcyB3aWxsIG11dGF0ZSBgc291cmNlc2AuXG5mdW5jdGlvbiBhZGFwdFNvdXJjZXMoc291cmNlcykge1xuICAgIGZvciAodmFyIG5hbWVfMyBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KG5hbWVfMykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSAmJlxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZXNbbmFtZV8zXVsnc2hhbWVmdWxseVNlbmROZXh0J10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSA9IGFkYXB0XzEuYWRhcHQoc291cmNlc1tuYW1lXzNdKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc291cmNlcztcbn1cbmV4cG9ydHMuYWRhcHRTb3VyY2VzID0gYWRhcHRTb3VyY2VzO1xuZnVuY3Rpb24gcmVwbGljYXRlTWFueShzaW5rcywgc2lua1Byb3hpZXMpIHtcbiAgICB2YXIgc2lua05hbWVzID0gT2JqZWN0LmtleXMoc2lua3MpLmZpbHRlcihmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gISFzaW5rUHJveGllc1tuYW1lXTsgfSk7XG4gICAgdmFyIGJ1ZmZlcnMgPSB7fTtcbiAgICB2YXIgcmVwbGljYXRvcnMgPSB7fTtcbiAgICBzaW5rTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICBidWZmZXJzW25hbWVdID0geyBfbjogW10sIF9lOiBbXSB9O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXSA9IHtcbiAgICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uICh4KSB7IHJldHVybiBidWZmZXJzW25hbWVdLl9uLnB1c2goeCk7IH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikgeyByZXR1cm4gYnVmZmVyc1tuYW1lXS5fZS5wdXNoKGVycik7IH0sXG4gICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkgeyB9LFxuICAgICAgICB9O1xuICAgIH0pO1xuICAgIHZhciBzdWJzY3JpcHRpb25zID0gc2lua05hbWVzLm1hcChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICByZXR1cm4geHN0cmVhbV8xLmRlZmF1bHQuZnJvbU9ic2VydmFibGUoc2lua3NbbmFtZV0pLnN1YnNjcmliZShyZXBsaWNhdG9yc1tuYW1lXSk7XG4gICAgfSk7XG4gICAgc2lua05hbWVzLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgdmFyIGxpc3RlbmVyID0gc2lua1Byb3hpZXNbbmFtZV07XG4gICAgICAgIHZhciBuZXh0ID0gZnVuY3Rpb24gKHgpIHtcbiAgICAgICAgICAgIHNjaGVkdWxlTWljcm90YXNrKGZ1bmN0aW9uICgpIHsgcmV0dXJuIGxpc3RlbmVyLl9uKHgpOyB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGVycm9yID0gZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgc2NoZWR1bGVNaWNyb3Rhc2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIChjb25zb2xlLmVycm9yIHx8IGNvbnNvbGUubG9nKShlcnIpO1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLl9lKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICAgICAgYnVmZmVyc1tuYW1lXS5fbi5mb3JFYWNoKG5leHQpO1xuICAgICAgICBidWZmZXJzW25hbWVdLl9lLmZvckVhY2goZXJyb3IpO1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5uZXh0ID0gbmV4dDtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uZXJyb3IgPSBlcnJvcjtcbiAgICAgICAgLy8gYmVjYXVzZSBzaW5rLnN1YnNjcmliZShyZXBsaWNhdG9yKSBoYWQgbXV0YXRlZCByZXBsaWNhdG9yIHRvIGFkZFxuICAgICAgICAvLyBfbiwgX2UsIF9jLCB3ZSBtdXN0IGFsc28gdXBkYXRlIHRoZXNlOlxuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5fbiA9IG5leHQ7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLl9lID0gZXJyb3I7XG4gICAgfSk7XG4gICAgYnVmZmVycyA9IG51bGw7IC8vIGZyZWUgdXAgZm9yIEdDXG4gICAgcmV0dXJuIGZ1bmN0aW9uIGRpc3Bvc2VSZXBsaWNhdGlvbigpIHtcbiAgICAgICAgc3Vic2NyaXB0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChzKSB7IHJldHVybiBzLnVuc3Vic2NyaWJlKCk7IH0pO1xuICAgIH07XG59XG5leHBvcnRzLnJlcGxpY2F0ZU1hbnkgPSByZXBsaWNhdGVNYW55O1xuZnVuY3Rpb24gZGlzcG9zZVNpbmtQcm94aWVzKHNpbmtQcm94aWVzKSB7XG4gICAgT2JqZWN0LmtleXMoc2lua1Byb3hpZXMpLmZvckVhY2goZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIHNpbmtQcm94aWVzW25hbWVdLl9jKCk7IH0pO1xufVxuZXhwb3J0cy5kaXNwb3NlU2lua1Byb3hpZXMgPSBkaXNwb3NlU2lua1Byb3hpZXM7XG5mdW5jdGlvbiBkaXNwb3NlU291cmNlcyhzb3VyY2VzKSB7XG4gICAgZm9yICh2YXIgayBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KGspICYmXG4gICAgICAgICAgICBzb3VyY2VzW2tdICYmXG4gICAgICAgICAgICBzb3VyY2VzW2tdLmRpc3Bvc2UpIHtcbiAgICAgICAgICAgIHNvdXJjZXNba10uZGlzcG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxufVxuZXhwb3J0cy5kaXNwb3NlU291cmNlcyA9IGRpc3Bvc2VTb3VyY2VzO1xuZnVuY3Rpb24gaXNPYmplY3RFbXB0eShvYmopIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXMob2JqKS5sZW5ndGggPT09IDA7XG59XG5leHBvcnRzLmlzT2JqZWN0RW1wdHkgPSBpc09iamVjdEVtcHR5O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9aW50ZXJuYWxzLmpzLm1hcCIsIi8qIVxyXG4gKiBFdmVudEVtaXR0ZXIyXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9oaWoxbngvRXZlbnRFbWl0dGVyMlxyXG4gKlxyXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTMgaGlqMW54XHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cclxuICovXHJcbjshZnVuY3Rpb24odW5kZWZpbmVkKSB7XHJcblxyXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSA/IEFycmF5LmlzQXJyYXkgOiBmdW5jdGlvbiBfaXNBcnJheShvYmopIHtcclxuICAgIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xyXG4gIH07XHJcbiAgdmFyIGRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcclxuXHJcbiAgZnVuY3Rpb24gaW5pdCgpIHtcclxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xyXG4gICAgaWYgKHRoaXMuX2NvbmYpIHtcclxuICAgICAgY29uZmlndXJlLmNhbGwodGhpcywgdGhpcy5fY29uZik7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBjb25maWd1cmUoY29uZikge1xyXG4gICAgaWYgKGNvbmYpIHtcclxuICAgICAgdGhpcy5fY29uZiA9IGNvbmY7XHJcblxyXG4gICAgICBjb25mLmRlbGltaXRlciAmJiAodGhpcy5kZWxpbWl0ZXIgPSBjb25mLmRlbGltaXRlcik7XHJcbiAgICAgIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPSBjb25mLm1heExpc3RlbmVycyAhPT0gdW5kZWZpbmVkID8gY29uZi5tYXhMaXN0ZW5lcnMgOiBkZWZhdWx0TWF4TGlzdGVuZXJzO1xyXG4gICAgICBjb25mLndpbGRjYXJkICYmICh0aGlzLndpbGRjYXJkID0gY29uZi53aWxkY2FyZCk7XHJcbiAgICAgIGNvbmYubmV3TGlzdGVuZXIgJiYgKHRoaXMubmV3TGlzdGVuZXIgPSBjb25mLm5ld0xpc3RlbmVyKTtcclxuICAgICAgY29uZi52ZXJib3NlTWVtb3J5TGVhayAmJiAodGhpcy52ZXJib3NlTWVtb3J5TGVhayA9IGNvbmYudmVyYm9zZU1lbW9yeUxlYWspO1xyXG5cclxuICAgICAgaWYgKHRoaXMud2lsZGNhcmQpIHtcclxuICAgICAgICB0aGlzLmxpc3RlbmVyVHJlZSA9IHt9O1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzID0gZGVmYXVsdE1heExpc3RlbmVycztcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGxvZ1Bvc3NpYmxlTWVtb3J5TGVhayhjb3VudCwgZXZlbnROYW1lKSB7XHJcbiAgICB2YXIgZXJyb3JNc2cgPSAnKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXHJcbiAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXHJcbiAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0Lic7XHJcblxyXG4gICAgaWYodGhpcy52ZXJib3NlTWVtb3J5TGVhayl7XHJcbiAgICAgIGVycm9yTXNnICs9ICcgRXZlbnQgbmFtZTogJXMuJztcclxuICAgICAgY29uc29sZS5lcnJvcihlcnJvck1zZywgY291bnQsIGV2ZW50TmFtZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGVycm9yTXNnLCBjb3VudCk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGNvbnNvbGUudHJhY2Upe1xyXG4gICAgICBjb25zb2xlLnRyYWNlKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBFdmVudEVtaXR0ZXIoY29uZikge1xyXG4gICAgdGhpcy5fZXZlbnRzID0ge307XHJcbiAgICB0aGlzLm5ld0xpc3RlbmVyID0gZmFsc2U7XHJcbiAgICB0aGlzLnZlcmJvc2VNZW1vcnlMZWFrID0gZmFsc2U7XHJcbiAgICBjb25maWd1cmUuY2FsbCh0aGlzLCBjb25mKTtcclxuICB9XHJcbiAgRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlcjIgPSBFdmVudEVtaXR0ZXI7IC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IGZvciBleHBvcnRpbmcgRXZlbnRFbWl0dGVyIHByb3BlcnR5XHJcblxyXG4gIC8vXHJcbiAgLy8gQXR0ZW50aW9uLCBmdW5jdGlvbiByZXR1cm4gdHlwZSBub3cgaXMgYXJyYXksIGFsd2F5cyAhXHJcbiAgLy8gSXQgaGFzIHplcm8gZWxlbWVudHMgaWYgbm8gYW55IG1hdGNoZXMgZm91bmQgYW5kIG9uZSBvciBtb3JlXHJcbiAgLy8gZWxlbWVudHMgKGxlYWZzKSBpZiB0aGVyZSBhcmUgbWF0Y2hlc1xyXG4gIC8vXHJcbiAgZnVuY3Rpb24gc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlLCBpKSB7XHJcbiAgICBpZiAoIXRyZWUpIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG4gICAgdmFyIGxpc3RlbmVycz1bXSwgbGVhZiwgbGVuLCBicmFuY2gsIHhUcmVlLCB4eFRyZWUsIGlzb2xhdGVkQnJhbmNoLCBlbmRSZWFjaGVkLFxyXG4gICAgICAgIHR5cGVMZW5ndGggPSB0eXBlLmxlbmd0aCwgY3VycmVudFR5cGUgPSB0eXBlW2ldLCBuZXh0VHlwZSA9IHR5cGVbaSsxXTtcclxuICAgIGlmIChpID09PSB0eXBlTGVuZ3RoICYmIHRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAvL1xyXG4gICAgICAvLyBJZiBhdCB0aGUgZW5kIG9mIHRoZSBldmVudChzKSBsaXN0IGFuZCB0aGUgdHJlZSBoYXMgbGlzdGVuZXJzXHJcbiAgICAgIC8vIGludm9rZSB0aG9zZSBsaXN0ZW5lcnMuXHJcbiAgICAgIC8vXHJcbiAgICAgIGlmICh0eXBlb2YgdHJlZS5fbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgaGFuZGxlcnMgJiYgaGFuZGxlcnMucHVzaCh0cmVlLl9saXN0ZW5lcnMpO1xyXG4gICAgICAgIHJldHVybiBbdHJlZV07XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgZm9yIChsZWFmID0gMCwgbGVuID0gdHJlZS5fbGlzdGVuZXJzLmxlbmd0aDsgbGVhZiA8IGxlbjsgbGVhZisrKSB7XHJcbiAgICAgICAgICBoYW5kbGVycyAmJiBoYW5kbGVycy5wdXNoKHRyZWUuX2xpc3RlbmVyc1tsZWFmXSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBbdHJlZV07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAoKGN1cnJlbnRUeXBlID09PSAnKicgfHwgY3VycmVudFR5cGUgPT09ICcqKicpIHx8IHRyZWVbY3VycmVudFR5cGVdKSB7XHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIElmIHRoZSBldmVudCBlbWl0dGVkIGlzICcqJyBhdCB0aGlzIHBhcnRcclxuICAgICAgLy8gb3IgdGhlcmUgaXMgYSBjb25jcmV0ZSBtYXRjaCBhdCB0aGlzIHBhdGNoXHJcbiAgICAgIC8vXHJcbiAgICAgIGlmIChjdXJyZW50VHlwZSA9PT0gJyonKSB7XHJcbiAgICAgICAgZm9yIChicmFuY2ggaW4gdHJlZSkge1xyXG4gICAgICAgICAgaWYgKGJyYW5jaCAhPT0gJ19saXN0ZW5lcnMnICYmIHRyZWUuaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xyXG4gICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzEpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGxpc3RlbmVycztcclxuICAgICAgfSBlbHNlIGlmKGN1cnJlbnRUeXBlID09PSAnKionKSB7XHJcbiAgICAgICAgZW5kUmVhY2hlZCA9IChpKzEgPT09IHR5cGVMZW5ndGggfHwgKGkrMiA9PT0gdHlwZUxlbmd0aCAmJiBuZXh0VHlwZSA9PT0gJyonKSk7XHJcbiAgICAgICAgaWYoZW5kUmVhY2hlZCAmJiB0cmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgIC8vIFRoZSBuZXh0IGVsZW1lbnQgaGFzIGEgX2xpc3RlbmVycywgYWRkIGl0IHRvIHRoZSBoYW5kbGVycy5cclxuICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlLCB0eXBlTGVuZ3RoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGJyYW5jaCBpbiB0cmVlKSB7XHJcbiAgICAgICAgICBpZiAoYnJhbmNoICE9PSAnX2xpc3RlbmVycycgJiYgdHJlZS5oYXNPd25Qcm9wZXJ0eShicmFuY2gpKSB7XHJcbiAgICAgICAgICAgIGlmKGJyYW5jaCA9PT0gJyonIHx8IGJyYW5jaCA9PT0gJyoqJykge1xyXG4gICAgICAgICAgICAgIGlmKHRyZWVbYnJhbmNoXS5fbGlzdGVuZXJzICYmICFlbmRSZWFjaGVkKSB7XHJcbiAgICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCB0eXBlTGVuZ3RoKSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gbmV4dFR5cGUpIHtcclxuICAgICAgICAgICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVticmFuY2hdLCBpKzIpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAvLyBObyBtYXRjaCBvbiB0aGlzIG9uZSwgc2hpZnQgaW50byB0aGUgdHJlZSBidXQgbm90IGluIHRoZSB0eXBlIGFycmF5LlxyXG4gICAgICAgICAgICAgIGxpc3RlbmVycyA9IGxpc3RlbmVycy5jb25jYXQoc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB0cmVlW2JyYW5jaF0sIGkpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbGlzdGVuZXJzO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBsaXN0ZW5lcnMgPSBsaXN0ZW5lcnMuY29uY2F0KHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgdHJlZVtjdXJyZW50VHlwZV0sIGkrMSkpO1xyXG4gICAgfVxyXG5cclxuICAgIHhUcmVlID0gdHJlZVsnKiddO1xyXG4gICAgaWYgKHhUcmVlKSB7XHJcbiAgICAgIC8vXHJcbiAgICAgIC8vIElmIHRoZSBsaXN0ZW5lciB0cmVlIHdpbGwgYWxsb3cgYW55IG1hdGNoIGZvciB0aGlzIHBhcnQsXHJcbiAgICAgIC8vIHRoZW4gcmVjdXJzaXZlbHkgZXhwbG9yZSBhbGwgYnJhbmNoZXMgb2YgdGhlIHRyZWVcclxuICAgICAgLy9cclxuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4VHJlZSwgaSsxKTtcclxuICAgIH1cclxuXHJcbiAgICB4eFRyZWUgPSB0cmVlWycqKiddO1xyXG4gICAgaWYoeHhUcmVlKSB7XHJcbiAgICAgIGlmKGkgPCB0eXBlTGVuZ3RoKSB7XHJcbiAgICAgICAgaWYoeHhUcmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgIC8vIElmIHdlIGhhdmUgYSBsaXN0ZW5lciBvbiBhICcqKicsIGl0IHdpbGwgY2F0Y2ggYWxsLCBzbyBhZGQgaXRzIGhhbmRsZXIuXHJcbiAgICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZSwgdHlwZUxlbmd0aCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBCdWlsZCBhcnJheXMgb2YgbWF0Y2hpbmcgbmV4dCBicmFuY2hlcyBhbmQgb3RoZXJzLlxyXG4gICAgICAgIGZvcihicmFuY2ggaW4geHhUcmVlKSB7XHJcbiAgICAgICAgICBpZihicmFuY2ggIT09ICdfbGlzdGVuZXJzJyAmJiB4eFRyZWUuaGFzT3duUHJvcGVydHkoYnJhbmNoKSkge1xyXG4gICAgICAgICAgICBpZihicmFuY2ggPT09IG5leHRUeXBlKSB7XHJcbiAgICAgICAgICAgICAgLy8gV2Uga25vdyB0aGUgbmV4dCBlbGVtZW50IHdpbGwgbWF0Y2gsIHNvIGp1bXAgdHdpY2UuXHJcbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbYnJhbmNoXSwgaSsyKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGJyYW5jaCA9PT0gY3VycmVudFR5cGUpIHtcclxuICAgICAgICAgICAgICAvLyBDdXJyZW50IG5vZGUgbWF0Y2hlcywgbW92ZSBpbnRvIHRoZSB0cmVlLlxyXG4gICAgICAgICAgICAgIHNlYXJjaExpc3RlbmVyVHJlZShoYW5kbGVycywgdHlwZSwgeHhUcmVlW2JyYW5jaF0sIGkrMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgaXNvbGF0ZWRCcmFuY2ggPSB7fTtcclxuICAgICAgICAgICAgICBpc29sYXRlZEJyYW5jaFticmFuY2hdID0geHhUcmVlW2JyYW5jaF07XHJcbiAgICAgICAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB7ICcqKic6IGlzb2xhdGVkQnJhbmNoIH0sIGkrMSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZih4eFRyZWUuX2xpc3RlbmVycykge1xyXG4gICAgICAgIC8vIFdlIGhhdmUgcmVhY2hlZCB0aGUgZW5kIGFuZCBzdGlsbCBvbiBhICcqKidcclxuICAgICAgICBzZWFyY2hMaXN0ZW5lclRyZWUoaGFuZGxlcnMsIHR5cGUsIHh4VHJlZSwgdHlwZUxlbmd0aCk7XHJcbiAgICAgIH0gZWxzZSBpZih4eFRyZWVbJyonXSAmJiB4eFRyZWVbJyonXS5fbGlzdGVuZXJzKSB7XHJcbiAgICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlKGhhbmRsZXJzLCB0eXBlLCB4eFRyZWVbJyonXSwgdHlwZUxlbmd0aCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbGlzdGVuZXJzO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ3Jvd0xpc3RlbmVyVHJlZSh0eXBlLCBsaXN0ZW5lcikge1xyXG5cclxuICAgIHR5cGUgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuXHJcbiAgICAvL1xyXG4gICAgLy8gTG9va3MgZm9yIHR3byBjb25zZWN1dGl2ZSAnKionLCBpZiBzbywgZG9uJ3QgYWRkIHRoZSBldmVudCBhdCBhbGwuXHJcbiAgICAvL1xyXG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gdHlwZS5sZW5ndGg7IGkrMSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgIGlmKHR5cGVbaV0gPT09ICcqKicgJiYgdHlwZVtpKzFdID09PSAnKionKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHRyZWUgPSB0aGlzLmxpc3RlbmVyVHJlZTtcclxuICAgIHZhciBuYW1lID0gdHlwZS5zaGlmdCgpO1xyXG5cclxuICAgIHdoaWxlIChuYW1lICE9PSB1bmRlZmluZWQpIHtcclxuXHJcbiAgICAgIGlmICghdHJlZVtuYW1lXSkge1xyXG4gICAgICAgIHRyZWVbbmFtZV0gPSB7fTtcclxuICAgICAgfVxyXG5cclxuICAgICAgdHJlZSA9IHRyZWVbbmFtZV07XHJcblxyXG4gICAgICBpZiAodHlwZS5sZW5ndGggPT09IDApIHtcclxuXHJcbiAgICAgICAgaWYgKCF0cmVlLl9saXN0ZW5lcnMpIHtcclxuICAgICAgICAgIHRyZWUuX2xpc3RlbmVycyA9IGxpc3RlbmVyO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGlmICh0eXBlb2YgdHJlZS5fbGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgIHRyZWUuX2xpc3RlbmVycyA9IFt0cmVlLl9saXN0ZW5lcnNdO1xyXG4gICAgICAgICAgfVxyXG5cclxuICAgICAgICAgIHRyZWUuX2xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcclxuXHJcbiAgICAgICAgICBpZiAoXHJcbiAgICAgICAgICAgICF0cmVlLl9saXN0ZW5lcnMud2FybmVkICYmXHJcbiAgICAgICAgICAgIHRoaXMuX2V2ZW50cy5tYXhMaXN0ZW5lcnMgPiAwICYmXHJcbiAgICAgICAgICAgIHRyZWUuX2xpc3RlbmVycy5sZW5ndGggPiB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzXHJcbiAgICAgICAgICApIHtcclxuICAgICAgICAgICAgdHJlZS5fbGlzdGVuZXJzLndhcm5lZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGxvZ1Bvc3NpYmxlTWVtb3J5TGVhay5jYWxsKHRoaXMsIHRyZWUuX2xpc3RlbmVycy5sZW5ndGgsIG5hbWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgICBuYW1lID0gdHlwZS5zaGlmdCgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbiAgfVxyXG5cclxuICAvLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuXHJcbiAgLy8gMTAgbGlzdGVuZXJzIGFyZSBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoXHJcbiAgLy8gaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXHJcbiAgLy9cclxuICAvLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3NcclxuICAvLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5kZWxpbWl0ZXIgPSAnLic7XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xyXG4gICAgaWYgKG4gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xyXG4gICAgICB0aGlzLl9ldmVudHMubWF4TGlzdGVuZXJzID0gbjtcclxuICAgICAgaWYgKCF0aGlzLl9jb25mKSB0aGlzLl9jb25mID0ge307XHJcbiAgICAgIHRoaXMuX2NvbmYubWF4TGlzdGVuZXJzID0gbjtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmV2ZW50ID0gJyc7XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbikge1xyXG4gICAgdGhpcy5tYW55KGV2ZW50LCAxLCBmbik7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLm1hbnkgPSBmdW5jdGlvbihldmVudCwgdHRsLCBmbikge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIGlmICh0eXBlb2YgZm4gIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdtYW55IG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiBsaXN0ZW5lcigpIHtcclxuICAgICAgaWYgKC0tdHRsID09PSAwKSB7XHJcbiAgICAgICAgc2VsZi5vZmYoZXZlbnQsIGxpc3RlbmVyKTtcclxuICAgICAgfVxyXG4gICAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgfVxyXG5cclxuICAgIGxpc3RlbmVyLl9vcmlnaW4gPSBmbjtcclxuXHJcbiAgICB0aGlzLm9uKGV2ZW50LCBsaXN0ZW5lcik7XHJcblxyXG4gICAgcmV0dXJuIHNlbGY7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzIHx8IGluaXQuY2FsbCh0aGlzKTtcclxuXHJcbiAgICB2YXIgdHlwZSA9IGFyZ3VtZW50c1swXTtcclxuXHJcbiAgICBpZiAodHlwZSA9PT0gJ25ld0xpc3RlbmVyJyAmJiAhdGhpcy5uZXdMaXN0ZW5lcikge1xyXG4gICAgICBpZiAoIXRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcikge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBhbCA9IGFyZ3VtZW50cy5sZW5ndGg7XHJcbiAgICB2YXIgYXJncyxsLGksajtcclxuICAgIHZhciBoYW5kbGVyO1xyXG5cclxuICAgIGlmICh0aGlzLl9hbGwgJiYgdGhpcy5fYWxsLmxlbmd0aCkge1xyXG4gICAgICBoYW5kbGVyID0gdGhpcy5fYWxsLnNsaWNlKCk7XHJcbiAgICAgIGlmIChhbCA+IDMpIHtcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsKTtcclxuICAgICAgICBmb3IgKGogPSAwOyBqIDwgYWw7IGorKykgYXJnc1tqXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgfVxyXG5cclxuICAgICAgZm9yIChpID0gMCwgbCA9IGhhbmRsZXIubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgICAgc3dpdGNoIChhbCkge1xyXG4gICAgICAgIGNhc2UgMTpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzLCB0eXBlKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMjpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzLCB0eXBlLCBhcmd1bWVudHNbMV0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5jYWxsKHRoaXMsIHR5cGUsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIGhhbmRsZXIgPSBbXTtcclxuICAgICAgdmFyIG5zID0gdHlwZW9mIHR5cGUgPT09ICdzdHJpbmcnID8gdHlwZS5zcGxpdCh0aGlzLmRlbGltaXRlcikgOiB0eXBlLnNsaWNlKCk7XHJcbiAgICAgIHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIGhhbmRsZXIsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xyXG4gICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkoYWwgLSAxKTtcclxuICAgICAgICAgIGZvciAoaiA9IDE7IGogPCBhbDsgaisrKSBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICB9IGVsc2UgaWYgKGhhbmRsZXIpIHtcclxuICAgICAgICAvLyBuZWVkIHRvIG1ha2UgY29weSBvZiBoYW5kbGVycyBiZWNhdXNlIGxpc3QgY2FuIGNoYW5nZSBpbiB0aGUgbWlkZGxlXHJcbiAgICAgICAgLy8gb2YgZW1pdCBjYWxsXHJcbiAgICAgICAgaGFuZGxlciA9IGhhbmRsZXIuc2xpY2UoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChoYW5kbGVyICYmIGhhbmRsZXIubGVuZ3RoKSB7XHJcbiAgICAgIGlmIChhbCA+IDMpIHtcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsIC0gMSk7XHJcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICB9XHJcbiAgICAgIGZvciAoaSA9IDAsIGwgPSBoYW5kbGVyLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgICAgIHRoaXMuZXZlbnQgPSB0eXBlO1xyXG4gICAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgICBjYXNlIDE6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcyk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBoYW5kbGVyW2ldLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgMzpcclxuICAgICAgICAgIGhhbmRsZXJbaV0uY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgaGFuZGxlcltpXS5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9hbGwgJiYgdHlwZSA9PT0gJ2Vycm9yJykge1xyXG4gICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcclxuICAgICAgICB0aHJvdyBhcmd1bWVudHNbMV07IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5jYXVnaHQsIHVuc3BlY2lmaWVkICdlcnJvcicgZXZlbnQuXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gISF0aGlzLl9hbGw7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0QXN5bmMgPSBmdW5jdGlvbigpIHtcclxuXHJcbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xyXG5cclxuICAgIHZhciB0eXBlID0gYXJndW1lbnRzWzBdO1xyXG5cclxuICAgIGlmICh0eXBlID09PSAnbmV3TGlzdGVuZXInICYmICF0aGlzLm5ld0xpc3RlbmVyKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpIHsgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbZmFsc2VdKTsgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBwcm9taXNlcz0gW107XHJcblxyXG4gICAgdmFyIGFsID0gYXJndW1lbnRzLmxlbmd0aDtcclxuICAgIHZhciBhcmdzLGwsaSxqO1xyXG4gICAgdmFyIGhhbmRsZXI7XHJcblxyXG4gICAgaWYgKHRoaXMuX2FsbCkge1xyXG4gICAgICBpZiAoYWwgPiAzKSB7XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCk7XHJcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3Nbal0gPSBhcmd1bWVudHNbal07XHJcbiAgICAgIH1cclxuICAgICAgZm9yIChpID0gMCwgbCA9IHRoaXMuX2FsbC5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9hbGxbaV0uY2FsbCh0aGlzLCB0eXBlKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDI6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKHRoaXMuX2FsbFtpXS5jYWxsKHRoaXMsIHR5cGUsIGFyZ3VtZW50c1sxXSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAzOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLl9hbGxbaV0uY2FsbCh0aGlzLCB0eXBlLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2godGhpcy5fYWxsW2ldLmFwcGx5KHRoaXMsIGFyZ3MpKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICBoYW5kbGVyID0gW107XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBoYW5kbGVyLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhpcy5ldmVudCA9IHR5cGU7XHJcbiAgICAgIHN3aXRjaCAoYWwpIHtcclxuICAgICAgY2FzZSAxOlxyXG4gICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlci5jYWxsKHRoaXMpKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAyOlxyXG4gICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSkpO1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlIDM6XHJcbiAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pKTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICBhcmdzID0gbmV3IEFycmF5KGFsIC0gMSk7XHJcbiAgICAgICAgZm9yIChqID0gMTsgaiA8IGFsOyBqKyspIGFyZ3NbaiAtIDFdID0gYXJndW1lbnRzW2pdO1xyXG4gICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKSk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoaGFuZGxlciAmJiBoYW5kbGVyLmxlbmd0aCkge1xyXG4gICAgICBpZiAoYWwgPiAzKSB7XHJcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShhbCAtIDEpO1xyXG4gICAgICAgIGZvciAoaiA9IDE7IGogPCBhbDsgaisrKSBhcmdzW2ogLSAxXSA9IGFyZ3VtZW50c1tqXTtcclxuICAgICAgfVxyXG4gICAgICBmb3IgKGkgPSAwLCBsID0gaGFuZGxlci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICB0aGlzLmV2ZW50ID0gdHlwZTtcclxuICAgICAgICBzd2l0Y2ggKGFsKSB7XHJcbiAgICAgICAgY2FzZSAxOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyW2ldLmNhbGwodGhpcykpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAyOlxyXG4gICAgICAgICAgcHJvbWlzZXMucHVzaChoYW5kbGVyW2ldLmNhbGwodGhpcywgYXJndW1lbnRzWzFdKSk7XHJcbiAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIDM6XHJcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKGhhbmRsZXJbaV0uY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0sIGFyZ3VtZW50c1syXSkpO1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgIHByb21pc2VzLnB1c2goaGFuZGxlcltpXS5hcHBseSh0aGlzLCBhcmdzKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKCF0aGlzLl9hbGwgJiYgdHlwZSA9PT0gJ2Vycm9yJykge1xyXG4gICAgICBpZiAoYXJndW1lbnRzWzFdIGluc3RhbmNlb2YgRXJyb3IpIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoYXJndW1lbnRzWzFdKTsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXCJVbmNhdWdodCwgdW5zcGVjaWZpZWQgJ2Vycm9yJyBldmVudC5cIik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xyXG4gICAgaWYgKHR5cGVvZiB0eXBlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgIHRoaXMub25BbnkodHlwZSk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdvbiBvbmx5IGFjY2VwdHMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xyXG5cclxuICAgIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT0gXCJuZXdMaXN0ZW5lcnNcIiEgQmVmb3JlXHJcbiAgICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyc1wiLlxyXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcclxuXHJcbiAgICBpZiAodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICBncm93TGlzdGVuZXJUcmVlLmNhbGwodGhpcywgdHlwZSwgbGlzdGVuZXIpO1xyXG4gICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xyXG4gICAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cclxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgaWYgKHR5cGVvZiB0aGlzLl9ldmVudHNbdHlwZV0gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAvLyBDaGFuZ2UgdG8gYXJyYXkuXHJcbiAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cclxuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xyXG5cclxuICAgICAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcclxuICAgICAgaWYgKFxyXG4gICAgICAgICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkICYmXHJcbiAgICAgICAgdGhpcy5fZXZlbnRzLm1heExpc3RlbmVycyA+IDAgJiZcclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gdGhpcy5fZXZlbnRzLm1heExpc3RlbmVyc1xyXG4gICAgICApIHtcclxuICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcclxuICAgICAgICBsb2dQb3NzaWJsZU1lbW9yeUxlYWsuY2FsbCh0aGlzLCB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoLCB0eXBlKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB0aGlzO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub25BbnkgPSBmdW5jdGlvbihmbikge1xyXG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ29uQW55IG9ubHkgYWNjZXB0cyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXRoaXMuX2FsbCkge1xyXG4gICAgICB0aGlzLl9hbGwgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBBZGQgdGhlIGZ1bmN0aW9uIHRvIHRoZSBldmVudCBsaXN0ZW5lciBjb2xsZWN0aW9uLlxyXG4gICAgdGhpcy5fYWxsLnB1c2goZm4pO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUub247XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcclxuICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdyZW1vdmVMaXN0ZW5lciBvbmx5IHRha2VzIGluc3RhbmNlcyBvZiBGdW5jdGlvbicpO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBoYW5kbGVycyxsZWFmcz1bXTtcclxuXHJcbiAgICBpZih0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICBsZWFmcyA9IHNlYXJjaExpc3RlbmVyVHJlZS5jYWxsKHRoaXMsIG51bGwsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXHJcbiAgICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSByZXR1cm4gdGhpcztcclxuICAgICAgaGFuZGxlcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgICAgIGxlYWZzLnB1c2goe19saXN0ZW5lcnM6aGFuZGxlcnN9KTtcclxuICAgIH1cclxuXHJcbiAgICBmb3IgKHZhciBpTGVhZj0wOyBpTGVhZjxsZWFmcy5sZW5ndGg7IGlMZWFmKyspIHtcclxuICAgICAgdmFyIGxlYWYgPSBsZWFmc1tpTGVhZl07XHJcbiAgICAgIGhhbmRsZXJzID0gbGVhZi5fbGlzdGVuZXJzO1xyXG4gICAgICBpZiAoaXNBcnJheShoYW5kbGVycykpIHtcclxuXHJcbiAgICAgICAgdmFyIHBvc2l0aW9uID0gLTE7XHJcblxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW5ndGggPSBoYW5kbGVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgaWYgKGhhbmRsZXJzW2ldID09PSBsaXN0ZW5lciB8fFxyXG4gICAgICAgICAgICAoaGFuZGxlcnNbaV0ubGlzdGVuZXIgJiYgaGFuZGxlcnNbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB8fFxyXG4gICAgICAgICAgICAoaGFuZGxlcnNbaV0uX29yaWdpbiAmJiBoYW5kbGVyc1tpXS5fb3JpZ2luID09PSBsaXN0ZW5lcikpIHtcclxuICAgICAgICAgICAgcG9zaXRpb24gPSBpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApIHtcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhpcy53aWxkY2FyZCkge1xyXG4gICAgICAgICAgbGVhZi5fbGlzdGVuZXJzLnNwbGljZShwb3NpdGlvbiwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnNwbGljZShwb3NpdGlvbiwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaGFuZGxlcnMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBsZWFmLl9saXN0ZW5lcnM7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZW1pdChcInJlbW92ZUxpc3RlbmVyXCIsIHR5cGUsIGxpc3RlbmVyKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoaGFuZGxlcnMgPT09IGxpc3RlbmVyIHx8XHJcbiAgICAgICAgKGhhbmRsZXJzLmxpc3RlbmVyICYmIGhhbmRsZXJzLmxpc3RlbmVyID09PSBsaXN0ZW5lcikgfHxcclxuICAgICAgICAoaGFuZGxlcnMuX29yaWdpbiAmJiBoYW5kbGVycy5fb3JpZ2luID09PSBsaXN0ZW5lcikpIHtcclxuICAgICAgICBpZih0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgICAgICBkZWxldGUgbGVhZi5fbGlzdGVuZXJzO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmVtaXQoXCJyZW1vdmVMaXN0ZW5lclwiLCB0eXBlLCBsaXN0ZW5lcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiByZWN1cnNpdmVseUdhcmJhZ2VDb2xsZWN0KHJvb3QpIHtcclxuICAgICAgaWYgKHJvb3QgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHJvb3QpO1xyXG4gICAgICBmb3IgKHZhciBpIGluIGtleXMpIHtcclxuICAgICAgICB2YXIga2V5ID0ga2V5c1tpXTtcclxuICAgICAgICB2YXIgb2JqID0gcm9vdFtrZXldO1xyXG4gICAgICAgIGlmICgob2JqIGluc3RhbmNlb2YgRnVuY3Rpb24pIHx8ICh0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiKSB8fCAob2JqID09PSBudWxsKSlcclxuICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgIHJlY3Vyc2l2ZWx5R2FyYmFnZUNvbGxlY3Qocm9vdFtrZXldKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKG9iaikubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICBkZWxldGUgcm9vdFtrZXldO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmVjdXJzaXZlbHlHYXJiYWdlQ29sbGVjdCh0aGlzLmxpc3RlbmVyVHJlZSk7XHJcblxyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfTtcclxuXHJcbiAgRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmZBbnkgPSBmdW5jdGlvbihmbikge1xyXG4gICAgdmFyIGkgPSAwLCBsID0gMCwgZm5zO1xyXG4gICAgaWYgKGZuICYmIHRoaXMuX2FsbCAmJiB0aGlzLl9hbGwubGVuZ3RoID4gMCkge1xyXG4gICAgICBmbnMgPSB0aGlzLl9hbGw7XHJcbiAgICAgIGZvcihpID0gMCwgbCA9IGZucy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgICBpZihmbiA9PT0gZm5zW2ldKSB7XHJcbiAgICAgICAgICBmbnMuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJBbnlcIiwgZm4pO1xyXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBmbnMgPSB0aGlzLl9hbGw7XHJcbiAgICAgIGZvcihpID0gMCwgbCA9IGZucy5sZW5ndGg7IGkgPCBsOyBpKyspXHJcbiAgICAgICAgdGhpcy5lbWl0KFwicmVtb3ZlTGlzdGVuZXJBbnlcIiwgZm5zW2ldKTtcclxuICAgICAgdGhpcy5fYWxsID0gW107XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vZmY7XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xyXG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcclxuICAgICAgIXRoaXMuX2V2ZW50cyB8fCBpbml0LmNhbGwodGhpcyk7XHJcbiAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIHZhciBucyA9IHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJyA/IHR5cGUuc3BsaXQodGhpcy5kZWxpbWl0ZXIpIDogdHlwZS5zbGljZSgpO1xyXG4gICAgICB2YXIgbGVhZnMgPSBzZWFyY2hMaXN0ZW5lclRyZWUuY2FsbCh0aGlzLCBudWxsLCBucywgdGhpcy5saXN0ZW5lclRyZWUsIDApO1xyXG5cclxuICAgICAgZm9yICh2YXIgaUxlYWY9MDsgaUxlYWY8bGVhZnMubGVuZ3RoOyBpTGVhZisrKSB7XHJcbiAgICAgICAgdmFyIGxlYWYgPSBsZWFmc1tpTGVhZl07XHJcbiAgICAgICAgbGVhZi5fbGlzdGVuZXJzID0gbnVsbDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzKSB7XHJcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcclxuICAgIGlmICh0aGlzLndpbGRjYXJkKSB7XHJcbiAgICAgIHZhciBoYW5kbGVycyA9IFtdO1xyXG4gICAgICB2YXIgbnMgPSB0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycgPyB0eXBlLnNwbGl0KHRoaXMuZGVsaW1pdGVyKSA6IHR5cGUuc2xpY2UoKTtcclxuICAgICAgc2VhcmNoTGlzdGVuZXJUcmVlLmNhbGwodGhpcywgaGFuZGxlcnMsIG5zLCB0aGlzLmxpc3RlbmVyVHJlZSwgMCk7XHJcbiAgICAgIHJldHVybiBoYW5kbGVycztcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLl9ldmVudHMgfHwgaW5pdC5jYWxsKHRoaXMpO1xyXG5cclxuICAgIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKSB0aGlzLl9ldmVudHNbdHlwZV0gPSBbXTtcclxuICAgIGlmICghaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XHJcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2V2ZW50c1t0eXBlXTtcclxuICB9O1xyXG5cclxuICBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbih0eXBlKSB7XHJcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnModHlwZSkubGVuZ3RoO1xyXG4gIH07XHJcblxyXG4gIEV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzQW55ID0gZnVuY3Rpb24oKSB7XHJcblxyXG4gICAgaWYodGhpcy5fYWxsKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLl9hbGw7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICB9O1xyXG5cclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XHJcbiAgICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxyXG4gICAgZGVmaW5lKGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gRXZlbnRFbWl0dGVyO1xyXG4gICAgfSk7XHJcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcclxuICAgIC8vIENvbW1vbkpTXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEV2ZW50RW1pdHRlcjtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICAvLyBCcm93c2VyIGdsb2JhbC5cclxuICAgIHdpbmRvdy5FdmVudEVtaXR0ZXIyID0gRXZlbnRFbWl0dGVyO1xyXG4gIH1cclxufSgpO1xyXG4iLCIvKlxub2JqZWN0LWFzc2lnblxuKGMpIFNpbmRyZSBTb3JodXNcbkBsaWNlbnNlIE1JVFxuKi9cblxuJ3VzZSBzdHJpY3QnO1xuLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbnZhciBnZXRPd25Qcm9wZXJ0eVN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzO1xudmFyIGhhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwcm9wSXNFbnVtZXJhYmxlID0gT2JqZWN0LnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZTtcblxuZnVuY3Rpb24gdG9PYmplY3QodmFsKSB7XG5cdGlmICh2YWwgPT09IG51bGwgfHwgdmFsID09PSB1bmRlZmluZWQpIHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdPYmplY3QuYXNzaWduIGNhbm5vdCBiZSBjYWxsZWQgd2l0aCBudWxsIG9yIHVuZGVmaW5lZCcpO1xuXHR9XG5cblx0cmV0dXJuIE9iamVjdCh2YWwpO1xufVxuXG5mdW5jdGlvbiBzaG91bGRVc2VOYXRpdmUoKSB7XG5cdHRyeSB7XG5cdFx0aWYgKCFPYmplY3QuYXNzaWduKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gRGV0ZWN0IGJ1Z2d5IHByb3BlcnR5IGVudW1lcmF0aW9uIG9yZGVyIGluIG9sZGVyIFY4IHZlcnNpb25zLlxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9NDExOFxuXHRcdHZhciB0ZXN0MSA9IG5ldyBTdHJpbmcoJ2FiYycpOyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1uZXctd3JhcHBlcnNcblx0XHR0ZXN0MVs1XSA9ICdkZSc7XG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QxKVswXSA9PT0gJzUnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MiA9IHt9O1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKykge1xuXHRcdFx0dGVzdDJbJ18nICsgU3RyaW5nLmZyb21DaGFyQ29kZShpKV0gPSBpO1xuXHRcdH1cblx0XHR2YXIgb3JkZXIyID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDIpLm1hcChmdW5jdGlvbiAobikge1xuXHRcdFx0cmV0dXJuIHRlc3QyW25dO1xuXHRcdH0pO1xuXHRcdGlmIChvcmRlcjIuam9pbignJykgIT09ICcwMTIzNDU2Nzg5Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDMgPSB7fTtcblx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnLnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uIChsZXR0ZXIpIHtcblx0XHRcdHRlc3QzW2xldHRlcl0gPSBsZXR0ZXI7XG5cdFx0fSk7XG5cdFx0aWYgKE9iamVjdC5rZXlzKE9iamVjdC5hc3NpZ24oe30sIHRlc3QzKSkuam9pbignJykgIT09XG5cdFx0XHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0Ly8gV2UgZG9uJ3QgZXhwZWN0IGFueSBvZiB0aGUgYWJvdmUgdG8gdGhyb3csIGJ1dCBiZXR0ZXIgdG8gYmUgc2FmZS5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzaG91bGRVc2VOYXRpdmUoKSA/IE9iamVjdC5hc3NpZ24gOiBmdW5jdGlvbiAodGFyZ2V0LCBzb3VyY2UpIHtcblx0dmFyIGZyb207XG5cdHZhciB0byA9IHRvT2JqZWN0KHRhcmdldCk7XG5cdHZhciBzeW1ib2xzO1xuXG5cdGZvciAodmFyIHMgPSAxOyBzIDwgYXJndW1lbnRzLmxlbmd0aDsgcysrKSB7XG5cdFx0ZnJvbSA9IE9iamVjdChhcmd1bWVudHNbc10pO1xuXG5cdFx0Zm9yICh2YXIga2V5IGluIGZyb20pIHtcblx0XHRcdGlmIChoYXNPd25Qcm9wZXJ0eS5jYWxsKGZyb20sIGtleSkpIHtcblx0XHRcdFx0dG9ba2V5XSA9IGZyb21ba2V5XTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZ2V0T3duUHJvcGVydHlTeW1ib2xzKSB7XG5cdFx0XHRzeW1ib2xzID0gZ2V0T3duUHJvcGVydHlTeW1ib2xzKGZyb20pO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzeW1ib2xzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChwcm9wSXNFbnVtZXJhYmxlLmNhbGwoZnJvbSwgc3ltYm9sc1tpXSkpIHtcblx0XHRcdFx0XHR0b1tzeW1ib2xzW2ldXSA9IGZyb21bc3ltYm9sc1tpXV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gbWljcm90YXNrKCkge1xuICAgIGlmICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIG5vZGVfMSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgdmFyIHF1ZXVlXzEgPSBbXTtcbiAgICAgICAgdmFyIGlfMSA9IDA7XG4gICAgICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChxdWV1ZV8xLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHF1ZXVlXzEuc2hpZnQoKSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5vYnNlcnZlKG5vZGVfMSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZV8xLnB1c2goZm4pO1xuICAgICAgICAgICAgbm9kZV8xLmRhdGEgPSBpXzEgPSAxIC0gaV8xO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gc2V0SW1tZWRpYXRlO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dDtcbiAgICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBtaWNyb3Rhc2s7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCIvKipcbiAqIEBmaWxlT3ZlcnZpZXdcbiAqIEBhdXRob3IgUnVzc2VsbCBUb3JpcyAtIHJjdG9yaXNAd3BpLmVkdVxuICovXG5cbi8qKlxuICogSWYgeW91IHVzZSByb3NsaWIgaW4gYSBicm93c2VyLCBhbGwgdGhlIGNsYXNzZXMgd2lsbCBiZSBleHBvcnRlZCB0byBhIGdsb2JhbCB2YXJpYWJsZSBjYWxsZWQgUk9TTElCLlxuICpcbiAqIElmIHlvdSB1c2Ugbm9kZWpzLCB0aGlzIGlzIHRoZSB2YXJpYWJsZSB5b3UgZ2V0IHdoZW4geW91IHJlcXVpcmUoJ3Jvc2xpYicpXG4gKi9cbnZhciBST1NMSUIgPSB0aGlzLlJPU0xJQiB8fCB7XG4gIFJFVklTSU9OIDogJzAuMjAuMCdcbn07XG5cbnZhciBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cbi8vIEFkZCBjb3JlIGNvbXBvbmVudHNcbmFzc2lnbihST1NMSUIsIHJlcXVpcmUoJy4vY29yZScpKTtcblxuYXNzaWduKFJPU0xJQiwgcmVxdWlyZSgnLi9hY3Rpb25saWInKSk7XG5cbmFzc2lnbihST1NMSUIsIHJlcXVpcmUoJy4vbWF0aCcpKTtcblxuYXNzaWduKFJPU0xJQiwgcmVxdWlyZSgnLi90ZicpKTtcblxuYXNzaWduKFJPU0xJQiwgcmVxdWlyZSgnLi91cmRmJykpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJPU0xJQjtcbiIsIi8qKlxuICogQGZpbGVPdmVydmlld1xuICogQGF1dGhvciBSdXNzZWxsIFRvcmlzIC0gcmN0b3Jpc0B3cGkuZWR1XG4gKi9cblxudmFyIFRvcGljID0gcmVxdWlyZSgnLi4vY29yZS9Ub3BpYycpO1xudmFyIE1lc3NhZ2UgPSByZXF1aXJlKCcuLi9jb3JlL01lc3NhZ2UnKTtcbnZhciBFdmVudEVtaXR0ZXIyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMicpLkV2ZW50RW1pdHRlcjI7XG5cbi8qKlxuICogQW4gYWN0aW9ubGliIGFjdGlvbiBjbGllbnQuXG4gKlxuICogRW1pdHMgdGhlIGZvbGxvd2luZyBldmVudHM6XG4gKiAgKiAndGltZW91dCcgLSBpZiBhIHRpbWVvdXQgb2NjdXJyZWQgd2hpbGUgc2VuZGluZyBhIGdvYWxcbiAqICAqICdzdGF0dXMnIC0gdGhlIHN0YXR1cyBtZXNzYWdlcyByZWNlaXZlZCBmcm9tIHRoZSBhY3Rpb24gc2VydmVyXG4gKiAgKiAnZmVlZGJhY2snIC0gIHRoZSBmZWVkYmFjayBtZXNzYWdlcyByZWNlaXZlZCBmcm9tIHRoZSBhY3Rpb24gc2VydmVyXG4gKiAgKiAncmVzdWx0JyAtIHRoZSByZXN1bHQgcmV0dXJuZWQgZnJvbSB0aGUgYWN0aW9uIHNlcnZlclxuICpcbiAqICBAY29uc3RydWN0b3JcbiAqICBAcGFyYW0gb3B0aW9ucyAtIG9iamVjdCB3aXRoIGZvbGxvd2luZyBrZXlzOlxuICogICAqIHJvcyAtIHRoZSBST1NMSUIuUm9zIGNvbm5lY3Rpb24gaGFuZGxlXG4gKiAgICogc2VydmVyTmFtZSAtIHRoZSBhY3Rpb24gc2VydmVyIG5hbWUsIGxpa2UgL2ZpYm9uYWNjaVxuICogICAqIGFjdGlvbk5hbWUgLSB0aGUgYWN0aW9uIG1lc3NhZ2UgbmFtZSwgbGlrZSAnYWN0aW9ubGliX3R1dG9yaWFscy9GaWJvbmFjY2lBY3Rpb24nXG4gKiAgICogdGltZW91dCAtIHRoZSB0aW1lb3V0IGxlbmd0aCB3aGVuIGNvbm5lY3RpbmcgdG8gdGhlIGFjdGlvbiBzZXJ2ZXJcbiAqL1xuZnVuY3Rpb24gQWN0aW9uQ2xpZW50KG9wdGlvbnMpIHtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5yb3MgPSBvcHRpb25zLnJvcztcbiAgdGhpcy5zZXJ2ZXJOYW1lID0gb3B0aW9ucy5zZXJ2ZXJOYW1lO1xuICB0aGlzLmFjdGlvbk5hbWUgPSBvcHRpb25zLmFjdGlvbk5hbWU7XG4gIHRoaXMudGltZW91dCA9IG9wdGlvbnMudGltZW91dDtcbiAgdGhpcy5vbWl0RmVlZGJhY2sgPSBvcHRpb25zLm9taXRGZWVkYmFjaztcbiAgdGhpcy5vbWl0U3RhdHVzID0gb3B0aW9ucy5vbWl0U3RhdHVzO1xuICB0aGlzLm9taXRSZXN1bHQgPSBvcHRpb25zLm9taXRSZXN1bHQ7XG4gIHRoaXMuZ29hbHMgPSB7fTtcblxuICAvLyBmbGFnIHRvIGNoZWNrIGlmIGEgc3RhdHVzIGhhcyBiZWVuIHJlY2VpdmVkXG4gIHZhciByZWNlaXZlZFN0YXR1cyA9IGZhbHNlO1xuXG4gIC8vIGNyZWF0ZSB0aGUgdG9waWNzIGFzc29jaWF0ZWQgd2l0aCBhY3Rpb25saWJcbiAgdGhpcy5mZWVkYmFja0xpc3RlbmVyID0gbmV3IFRvcGljKHtcbiAgICByb3MgOiB0aGlzLnJvcyxcbiAgICBuYW1lIDogdGhpcy5zZXJ2ZXJOYW1lICsgJy9mZWVkYmFjaycsXG4gICAgbWVzc2FnZVR5cGUgOiB0aGlzLmFjdGlvbk5hbWUgKyAnRmVlZGJhY2snXG4gIH0pO1xuXG4gIHRoaXMuc3RhdHVzTGlzdGVuZXIgPSBuZXcgVG9waWMoe1xuICAgIHJvcyA6IHRoaXMucm9zLFxuICAgIG5hbWUgOiB0aGlzLnNlcnZlck5hbWUgKyAnL3N0YXR1cycsXG4gICAgbWVzc2FnZVR5cGUgOiAnYWN0aW9ubGliX21zZ3MvR29hbFN0YXR1c0FycmF5J1xuICB9KTtcblxuICB0aGlzLnJlc3VsdExpc3RlbmVyID0gbmV3IFRvcGljKHtcbiAgICByb3MgOiB0aGlzLnJvcyxcbiAgICBuYW1lIDogdGhpcy5zZXJ2ZXJOYW1lICsgJy9yZXN1bHQnLFxuICAgIG1lc3NhZ2VUeXBlIDogdGhpcy5hY3Rpb25OYW1lICsgJ1Jlc3VsdCdcbiAgfSk7XG5cbiAgdGhpcy5nb2FsVG9waWMgPSBuZXcgVG9waWMoe1xuICAgIHJvcyA6IHRoaXMucm9zLFxuICAgIG5hbWUgOiB0aGlzLnNlcnZlck5hbWUgKyAnL2dvYWwnLFxuICAgIG1lc3NhZ2VUeXBlIDogdGhpcy5hY3Rpb25OYW1lICsgJ0dvYWwnXG4gIH0pO1xuXG4gIHRoaXMuY2FuY2VsVG9waWMgPSBuZXcgVG9waWMoe1xuICAgIHJvcyA6IHRoaXMucm9zLFxuICAgIG5hbWUgOiB0aGlzLnNlcnZlck5hbWUgKyAnL2NhbmNlbCcsXG4gICAgbWVzc2FnZVR5cGUgOiAnYWN0aW9ubGliX21zZ3MvR29hbElEJ1xuICB9KTtcblxuICAvLyBhZHZlcnRpc2UgdGhlIGdvYWwgYW5kIGNhbmNlbCB0b3BpY3NcbiAgdGhpcy5nb2FsVG9waWMuYWR2ZXJ0aXNlKCk7XG4gIHRoaXMuY2FuY2VsVG9waWMuYWR2ZXJ0aXNlKCk7XG5cbiAgLy8gc3Vic2NyaWJlIHRvIHRoZSBzdGF0dXMgdG9waWNcbiAgaWYgKCF0aGlzLm9taXRTdGF0dXMpIHtcbiAgICB0aGlzLnN0YXR1c0xpc3RlbmVyLnN1YnNjcmliZShmdW5jdGlvbihzdGF0dXNNZXNzYWdlKSB7XG4gICAgICByZWNlaXZlZFN0YXR1cyA9IHRydWU7XG4gICAgICBzdGF0dXNNZXNzYWdlLnN0YXR1c19saXN0LmZvckVhY2goZnVuY3Rpb24oc3RhdHVzKSB7XG4gICAgICAgIHZhciBnb2FsID0gdGhhdC5nb2Fsc1tzdGF0dXMuZ29hbF9pZC5pZF07XG4gICAgICAgIGlmIChnb2FsKSB7XG4gICAgICAgICAgZ29hbC5lbWl0KCdzdGF0dXMnLCBzdGF0dXMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIHN1YnNjcmliZSB0aGUgdGhlIGZlZWRiYWNrIHRvcGljXG4gIGlmICghdGhpcy5vbWl0RmVlZGJhY2spIHtcbiAgICB0aGlzLmZlZWRiYWNrTGlzdGVuZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKGZlZWRiYWNrTWVzc2FnZSkge1xuICAgICAgdmFyIGdvYWwgPSB0aGF0LmdvYWxzW2ZlZWRiYWNrTWVzc2FnZS5zdGF0dXMuZ29hbF9pZC5pZF07XG4gICAgICBpZiAoZ29hbCkge1xuICAgICAgICBnb2FsLmVtaXQoJ3N0YXR1cycsIGZlZWRiYWNrTWVzc2FnZS5zdGF0dXMpO1xuICAgICAgICBnb2FsLmVtaXQoJ2ZlZWRiYWNrJywgZmVlZGJhY2tNZXNzYWdlLmZlZWRiYWNrKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8vIHN1YnNjcmliZSB0byB0aGUgcmVzdWx0IHRvcGljXG4gIGlmICghdGhpcy5vbWl0UmVzdWx0KSB7XG4gICAgdGhpcy5yZXN1bHRMaXN0ZW5lci5zdWJzY3JpYmUoZnVuY3Rpb24ocmVzdWx0TWVzc2FnZSkge1xuICAgICAgdmFyIGdvYWwgPSB0aGF0LmdvYWxzW3Jlc3VsdE1lc3NhZ2Uuc3RhdHVzLmdvYWxfaWQuaWRdO1xuXG4gICAgICBpZiAoZ29hbCkge1xuICAgICAgICBnb2FsLmVtaXQoJ3N0YXR1cycsIHJlc3VsdE1lc3NhZ2Uuc3RhdHVzKTtcbiAgICAgICAgZ29hbC5lbWl0KCdyZXN1bHQnLCByZXN1bHRNZXNzYWdlLnJlc3VsdCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvLyBJZiB0aW1lb3V0IHNwZWNpZmllZCwgZW1pdCBhICd0aW1lb3V0JyBldmVudCBpZiB0aGUgYWN0aW9uIHNlcnZlciBkb2VzIG5vdCByZXNwb25kXG4gIGlmICh0aGlzLnRpbWVvdXQpIHtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCFyZWNlaXZlZFN0YXR1cykge1xuICAgICAgICB0aGF0LmVtaXQoJ3RpbWVvdXQnKTtcbiAgICAgIH1cbiAgICB9LCB0aGlzLnRpbWVvdXQpO1xuICB9XG59XG5cbkFjdGlvbkNsaWVudC5wcm90b3R5cGUuX19wcm90b19fID0gRXZlbnRFbWl0dGVyMi5wcm90b3R5cGU7XG5cbi8qKlxuICogQ2FuY2VsIGFsbCBnb2FscyBhc3NvY2lhdGVkIHdpdGggdGhpcyBBY3Rpb25DbGllbnQuXG4gKi9cbkFjdGlvbkNsaWVudC5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjYW5jZWxNZXNzYWdlID0gbmV3IE1lc3NhZ2UoKTtcbiAgdGhpcy5jYW5jZWxUb3BpYy5wdWJsaXNoKGNhbmNlbE1lc3NhZ2UpO1xufTtcblxuLyoqXG4gKiBVbnN1YnNjcmliZSBhbmQgdW5hZHZlcnRpc2UgYWxsIHRvcGljcyBhc3NvY2lhdGVkIHdpdGggdGhpcyBBY3Rpb25DbGllbnQuXG4gKi9cbkFjdGlvbkNsaWVudC5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmdvYWxUb3BpYy51bmFkdmVydGlzZSgpO1xuICB0aGlzLmNhbmNlbFRvcGljLnVuYWR2ZXJ0aXNlKCk7XG4gIGlmICghdGhpcy5vbWl0U3RhdHVzKSB7dGhpcy5zdGF0dXNMaXN0ZW5lci51bnN1YnNjcmliZSgpO31cbiAgaWYgKCF0aGlzLm9taXRGZWVkYmFjaykge3RoaXMuZmVlZGJhY2tMaXN0ZW5lci51bnN1YnNjcmliZSgpO31cbiAgaWYgKCF0aGlzLm9taXRSZXN1bHQpIHt0aGlzLnJlc3VsdExpc3RlbmVyLnVuc3Vic2NyaWJlKCk7fVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpb25DbGllbnQ7XG4iLCIvKipcbiAqIEBmaWxlT3ZlcnZpZXdcbiAqIEBhdXRob3IgSnVzdGluIFlvdW5nIC0ganVzdGluQG9vZGFyLmNvbS5hdVxuICogQGF1dGhvciBSdXNzZWxsIFRvcmlzIC0gcmN0b3Jpc0B3cGkuZWR1XG4gKi9cblxudmFyIFRvcGljID0gcmVxdWlyZSgnLi4vY29yZS9Ub3BpYycpO1xudmFyIE1lc3NhZ2UgPSByZXF1aXJlKCcuLi9jb3JlL01lc3NhZ2UnKTtcbnZhciBFdmVudEVtaXR0ZXIyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMicpLkV2ZW50RW1pdHRlcjI7XG5cbi8qKlxuICogQW4gYWN0aW9ubGliIGFjdGlvbiBsaXN0ZW5lclxuICpcbiAqIEVtaXRzIHRoZSBmb2xsb3dpbmcgZXZlbnRzOlxuICogICogJ3N0YXR1cycgLSB0aGUgc3RhdHVzIG1lc3NhZ2VzIHJlY2VpdmVkIGZyb20gdGhlIGFjdGlvbiBzZXJ2ZXJcbiAqICAqICdmZWVkYmFjaycgLSAgdGhlIGZlZWRiYWNrIG1lc3NhZ2VzIHJlY2VpdmVkIGZyb20gdGhlIGFjdGlvbiBzZXJ2ZXJcbiAqICAqICdyZXN1bHQnIC0gdGhlIHJlc3VsdCByZXR1cm5lZCBmcm9tIHRoZSBhY3Rpb24gc2VydmVyXG4gKlxuICogIEBjb25zdHJ1Y3RvclxuICogIEBwYXJhbSBvcHRpb25zIC0gb2JqZWN0IHdpdGggZm9sbG93aW5nIGtleXM6XG4gKiAgICogcm9zIC0gdGhlIFJPU0xJQi5Sb3MgY29ubmVjdGlvbiBoYW5kbGVcbiAqICAgKiBzZXJ2ZXJOYW1lIC0gdGhlIGFjdGlvbiBzZXJ2ZXIgbmFtZSwgbGlrZSAvZmlib25hY2NpXG4gKiAgICogYWN0aW9uTmFtZSAtIHRoZSBhY3Rpb24gbWVzc2FnZSBuYW1lLCBsaWtlICdhY3Rpb25saWJfdHV0b3JpYWxzL0ZpYm9uYWNjaUFjdGlvbidcbiAqL1xuZnVuY3Rpb24gQWN0aW9uTGlzdGVuZXIob3B0aW9ucykge1xuICB2YXIgdGhhdCA9IHRoaXM7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLnJvcyA9IG9wdGlvbnMucm9zO1xuICB0aGlzLnNlcnZlck5hbWUgPSBvcHRpb25zLnNlcnZlck5hbWU7XG4gIHRoaXMuYWN0aW9uTmFtZSA9IG9wdGlvbnMuYWN0aW9uTmFtZTtcbiAgdGhpcy50aW1lb3V0ID0gb3B0aW9ucy50aW1lb3V0O1xuICB0aGlzLm9taXRGZWVkYmFjayA9IG9wdGlvbnMub21pdEZlZWRiYWNrO1xuICB0aGlzLm9taXRTdGF0dXMgPSBvcHRpb25zLm9taXRTdGF0dXM7XG4gIHRoaXMub21pdFJlc3VsdCA9IG9wdGlvbnMub21pdFJlc3VsdDtcblxuXG4gIC8vIGNyZWF0ZSB0aGUgdG9waWNzIGFzc29jaWF0ZWQgd2l0aCBhY3Rpb25saWJcbiAgdmFyIGdvYWxMaXN0ZW5lciA9IG5ldyBUb3BpYyh7XG4gICAgcm9zIDogdGhpcy5yb3MsXG4gICAgbmFtZSA6IHRoaXMuc2VydmVyTmFtZSArICcvZ29hbCcsXG4gICAgbWVzc2FnZVR5cGUgOiB0aGlzLmFjdGlvbk5hbWUgKyAnR29hbCdcbiAgfSk7XG5cbiAgdmFyIGZlZWRiYWNrTGlzdGVuZXIgPSBuZXcgVG9waWMoe1xuICAgIHJvcyA6IHRoaXMucm9zLFxuICAgIG5hbWUgOiB0aGlzLnNlcnZlck5hbWUgKyAnL2ZlZWRiYWNrJyxcbiAgICBtZXNzYWdlVHlwZSA6IHRoaXMuYWN0aW9uTmFtZSArICdGZWVkYmFjaydcbiAgfSk7XG5cbiAgdmFyIHN0YXR1c0xpc3RlbmVyID0gbmV3IFRvcGljKHtcbiAgICByb3MgOiB0aGlzLnJvcyxcbiAgICBuYW1lIDogdGhpcy5zZXJ2ZXJOYW1lICsgJy9zdGF0dXMnLFxuICAgIG1lc3NhZ2VUeXBlIDogJ2FjdGlvbmxpYl9tc2dzL0dvYWxTdGF0dXNBcnJheSdcbiAgfSk7XG5cbiAgdmFyIHJlc3VsdExpc3RlbmVyID0gbmV3IFRvcGljKHtcbiAgICByb3MgOiB0aGlzLnJvcyxcbiAgICBuYW1lIDogdGhpcy5zZXJ2ZXJOYW1lICsgJy9yZXN1bHQnLFxuICAgIG1lc3NhZ2VUeXBlIDogdGhpcy5hY3Rpb25OYW1lICsgJ1Jlc3VsdCdcbiAgfSk7XG5cbiAgZ29hbExpc3RlbmVyLnN1YnNjcmliZShmdW5jdGlvbihnb2FsTWVzc2FnZSkge1xuICAgICAgdGhhdC5lbWl0KCdnb2FsJywgZ29hbE1lc3NhZ2UpO1xuICB9KTtcblxuICBzdGF0dXNMaXN0ZW5lci5zdWJzY3JpYmUoZnVuY3Rpb24oc3RhdHVzTWVzc2FnZSkge1xuICAgICAgc3RhdHVzTWVzc2FnZS5zdGF0dXNfbGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHN0YXR1cykge1xuICAgICAgICAgIHRoYXQuZW1pdCgnc3RhdHVzJywgc3RhdHVzKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBmZWVkYmFja0xpc3RlbmVyLnN1YnNjcmliZShmdW5jdGlvbihmZWVkYmFja01lc3NhZ2UpIHtcbiAgICAgIHRoYXQuZW1pdCgnc3RhdHVzJywgZmVlZGJhY2tNZXNzYWdlLnN0YXR1cyk7XG4gICAgICB0aGF0LmVtaXQoJ2ZlZWRiYWNrJywgZmVlZGJhY2tNZXNzYWdlLmZlZWRiYWNrKTtcbiAgfSk7XG5cbiAgLy8gc3Vic2NyaWJlIHRvIHRoZSByZXN1bHQgdG9waWNcbiAgcmVzdWx0TGlzdGVuZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKHJlc3VsdE1lc3NhZ2UpIHtcbiAgICAgIHRoYXQuZW1pdCgnc3RhdHVzJywgcmVzdWx0TWVzc2FnZS5zdGF0dXMpO1xuICAgICAgdGhhdC5lbWl0KCdyZXN1bHQnLCByZXN1bHRNZXNzYWdlLnJlc3VsdCk7XG4gIH0pO1xuXG59XG5cbkFjdGlvbkxpc3RlbmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBFdmVudEVtaXR0ZXIyLnByb3RvdHlwZTtcblxubW9kdWxlLmV4cG9ydHMgPSBBY3Rpb25MaXN0ZW5lcjtcbiIsIi8qKlxuICogQGZpbGVPdmVydmlld1xuICogQGF1dGhvciBSdXNzZWxsIFRvcmlzIC0gcmN0b3Jpc0B3cGkuZWR1XG4gKi9cblxudmFyIE1lc3NhZ2UgPSByZXF1aXJlKCcuLi9jb3JlL01lc3NhZ2UnKTtcbnZhciBFdmVudEVtaXR0ZXIyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMicpLkV2ZW50RW1pdHRlcjI7XG5cbi8qKlxuICogQW4gYWN0aW9ubGliIGdvYWwgZ29hbCBpcyBhc3NvY2lhdGVkIHdpdGggYW4gYWN0aW9uIHNlcnZlci5cbiAqXG4gKiBFbWl0cyB0aGUgZm9sbG93aW5nIGV2ZW50czpcbiAqICAqICd0aW1lb3V0JyAtIGlmIGEgdGltZW91dCBvY2N1cnJlZCB3aGlsZSBzZW5kaW5nIGEgZ29hbFxuICpcbiAqICBAY29uc3RydWN0b3JcbiAqICBAcGFyYW0gb2JqZWN0IHdpdGggZm9sbG93aW5nIGtleXM6XG4gKiAgICogYWN0aW9uQ2xpZW50IC0gdGhlIFJPU0xJQi5BY3Rpb25DbGllbnQgdG8gdXNlIHdpdGggdGhpcyBnb2FsXG4gKiAgICogZ29hbE1lc3NhZ2UgLSBUaGUgSlNPTiBvYmplY3QgY29udGFpbmluZyB0aGUgZ29hbCBmb3IgdGhlIGFjdGlvbiBzZXJ2ZXJcbiAqL1xuZnVuY3Rpb24gR29hbChvcHRpb25zKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcbiAgdGhpcy5hY3Rpb25DbGllbnQgPSBvcHRpb25zLmFjdGlvbkNsaWVudDtcbiAgdGhpcy5nb2FsTWVzc2FnZSA9IG9wdGlvbnMuZ29hbE1lc3NhZ2U7XG4gIHRoaXMuaXNGaW5pc2hlZCA9IGZhbHNlO1xuXG4gIC8vIFVzZWQgdG8gY3JlYXRlIHJhbmRvbSBJRHNcbiAgdmFyIGRhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gIC8vIENyZWF0ZSBhIHJhbmRvbSBJRFxuICB0aGlzLmdvYWxJRCA9ICdnb2FsXycgKyBNYXRoLnJhbmRvbSgpICsgJ18nICsgZGF0ZS5nZXRUaW1lKCk7XG4gIC8vIEZpbGwgaW4gdGhlIGdvYWwgbWVzc2FnZVxuICB0aGlzLmdvYWxNZXNzYWdlID0gbmV3IE1lc3NhZ2Uoe1xuICAgIGdvYWxfaWQgOiB7XG4gICAgICBzdGFtcCA6IHtcbiAgICAgICAgc2VjcyA6IDAsXG4gICAgICAgIG5zZWNzIDogMFxuICAgICAgfSxcbiAgICAgIGlkIDogdGhpcy5nb2FsSURcbiAgICB9LFxuICAgIGdvYWwgOiB0aGlzLmdvYWxNZXNzYWdlXG4gIH0pO1xuXG4gIHRoaXMub24oJ3N0YXR1cycsIGZ1bmN0aW9uKHN0YXR1cykge1xuICAgIHRoYXQuc3RhdHVzID0gc3RhdHVzO1xuICB9KTtcblxuICB0aGlzLm9uKCdyZXN1bHQnLCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICB0aGF0LmlzRmluaXNoZWQgPSB0cnVlO1xuICAgIHRoYXQucmVzdWx0ID0gcmVzdWx0O1xuICB9KTtcblxuICB0aGlzLm9uKCdmZWVkYmFjaycsIGZ1bmN0aW9uKGZlZWRiYWNrKSB7XG4gICAgdGhhdC5mZWVkYmFjayA9IGZlZWRiYWNrO1xuICB9KTtcblxuICAvLyBBZGQgdGhlIGdvYWxcbiAgdGhpcy5hY3Rpb25DbGllbnQuZ29hbHNbdGhpcy5nb2FsSURdID0gdGhpcztcbn1cblxuR29hbC5wcm90b3R5cGUuX19wcm90b19fID0gRXZlbnRFbWl0dGVyMi5wcm90b3R5cGU7XG5cbi8qKlxuICogU2VuZCB0aGUgZ29hbCB0byB0aGUgYWN0aW9uIHNlcnZlci5cbiAqXG4gKiBAcGFyYW0gdGltZW91dCAob3B0aW9uYWwpIC0gYSB0aW1lb3V0IGxlbmd0aCBmb3IgdGhlIGdvYWwncyByZXN1bHRcbiAqL1xuR29hbC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuICB0aGF0LmFjdGlvbkNsaWVudC5nb2FsVG9waWMucHVibGlzaCh0aGF0LmdvYWxNZXNzYWdlKTtcbiAgaWYgKHRpbWVvdXQpIHtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKCF0aGF0LmlzRmluaXNoZWQpIHtcbiAgICAgICAgdGhhdC5lbWl0KCd0aW1lb3V0Jyk7XG4gICAgICB9XG4gICAgfSwgdGltZW91dCk7XG4gIH1cbn07XG5cbi8qKlxuICogQ2FuY2VsIHRoZSBjdXJyZW50IGdvYWwuXG4gKi9cbkdvYWwucHJvdG90eXBlLmNhbmNlbCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgY2FuY2VsTWVzc2FnZSA9IG5ldyBNZXNzYWdlKHtcbiAgICBpZCA6IHRoaXMuZ29hbElEXG4gIH0pO1xuICB0aGlzLmFjdGlvbkNsaWVudC5jYW5jZWxUb3BpYy5wdWJsaXNoKGNhbmNlbE1lc3NhZ2UpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHb2FsOyIsIi8qKlxuICogQGZpbGVPdmVydmlld1xuICogQGF1dGhvciBMYXVyYSBMaW5kemV5IC0gbGluZHpleUBnbWFpbC5jb21cbiAqL1xuXG52YXIgVG9waWMgPSByZXF1aXJlKCcuLi9jb3JlL1RvcGljJyk7XG52YXIgTWVzc2FnZSA9IHJlcXVpcmUoJy4uL2NvcmUvTWVzc2FnZScpO1xudmFyIEV2ZW50RW1pdHRlcjIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIyJykuRXZlbnRFbWl0dGVyMjtcblxuLyoqXG4gKiBBbiBhY3Rpb25saWIgYWN0aW9uIHNlcnZlciBjbGllbnQuXG4gKlxuICogRW1pdHMgdGhlIGZvbGxvd2luZyBldmVudHM6XG4gKiAgKiAnZ29hbCcgLSBnb2FsIHNlbnQgYnkgYWN0aW9uIGNsaWVudFxuICogICogJ2NhbmNlbCcgLSBhY3Rpb24gY2xpZW50IGhhcyBjYW5jZWxlZCB0aGUgcmVxdWVzdFxuICpcbiAqICBAY29uc3RydWN0b3JcbiAqICBAcGFyYW0gb3B0aW9ucyAtIG9iamVjdCB3aXRoIGZvbGxvd2luZyBrZXlzOlxuICogICAqIHJvcyAtIHRoZSBST1NMSUIuUm9zIGNvbm5lY3Rpb24gaGFuZGxlXG4gKiAgICogc2VydmVyTmFtZSAtIHRoZSBhY3Rpb24gc2VydmVyIG5hbWUsIGxpa2UgL2ZpYm9uYWNjaVxuICogICAqIGFjdGlvbk5hbWUgLSB0aGUgYWN0aW9uIG1lc3NhZ2UgbmFtZSwgbGlrZSAnYWN0aW9ubGliX3R1dG9yaWFscy9GaWJvbmFjY2lBY3Rpb24nXG4gKi9cblxuZnVuY3Rpb24gU2ltcGxlQWN0aW9uU2VydmVyKG9wdGlvbnMpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5yb3MgPSBvcHRpb25zLnJvcztcbiAgICB0aGlzLnNlcnZlck5hbWUgPSBvcHRpb25zLnNlcnZlck5hbWU7XG4gICAgdGhpcy5hY3Rpb25OYW1lID0gb3B0aW9ucy5hY3Rpb25OYW1lO1xuXG4gICAgLy8gY3JlYXRlIGFuZCBhZHZlcnRpc2UgcHVibGlzaGVyc1xuICAgIHRoaXMuZmVlZGJhY2tQdWJsaXNoZXIgPSBuZXcgVG9waWMoe1xuICAgICAgICByb3MgOiB0aGlzLnJvcyxcbiAgICAgICAgbmFtZSA6IHRoaXMuc2VydmVyTmFtZSArICcvZmVlZGJhY2snLFxuICAgICAgICBtZXNzYWdlVHlwZSA6IHRoaXMuYWN0aW9uTmFtZSArICdGZWVkYmFjaydcbiAgICB9KTtcbiAgICB0aGlzLmZlZWRiYWNrUHVibGlzaGVyLmFkdmVydGlzZSgpO1xuXG4gICAgdmFyIHN0YXR1c1B1Ymxpc2hlciA9IG5ldyBUb3BpYyh7XG4gICAgICAgIHJvcyA6IHRoaXMucm9zLFxuICAgICAgICBuYW1lIDogdGhpcy5zZXJ2ZXJOYW1lICsgJy9zdGF0dXMnLFxuICAgICAgICBtZXNzYWdlVHlwZSA6ICdhY3Rpb25saWJfbXNncy9Hb2FsU3RhdHVzQXJyYXknXG4gICAgfSk7XG4gICAgc3RhdHVzUHVibGlzaGVyLmFkdmVydGlzZSgpO1xuXG4gICAgdGhpcy5yZXN1bHRQdWJsaXNoZXIgPSBuZXcgVG9waWMoe1xuICAgICAgICByb3MgOiB0aGlzLnJvcyxcbiAgICAgICAgbmFtZSA6IHRoaXMuc2VydmVyTmFtZSArICcvcmVzdWx0JyxcbiAgICAgICAgbWVzc2FnZVR5cGUgOiB0aGlzLmFjdGlvbk5hbWUgKyAnUmVzdWx0J1xuICAgIH0pO1xuICAgIHRoaXMucmVzdWx0UHVibGlzaGVyLmFkdmVydGlzZSgpO1xuXG4gICAgLy8gY3JlYXRlIGFuZCBzdWJzY3JpYmUgdG8gbGlzdGVuZXJzXG4gICAgdmFyIGdvYWxMaXN0ZW5lciA9IG5ldyBUb3BpYyh7XG4gICAgICAgIHJvcyA6IHRoaXMucm9zLFxuICAgICAgICBuYW1lIDogdGhpcy5zZXJ2ZXJOYW1lICsgJy9nb2FsJyxcbiAgICAgICAgbWVzc2FnZVR5cGUgOiB0aGlzLmFjdGlvbk5hbWUgKyAnR29hbCdcbiAgICB9KTtcblxuICAgIHZhciBjYW5jZWxMaXN0ZW5lciA9IG5ldyBUb3BpYyh7XG4gICAgICAgIHJvcyA6IHRoaXMucm9zLFxuICAgICAgICBuYW1lIDogdGhpcy5zZXJ2ZXJOYW1lICsgJy9jYW5jZWwnLFxuICAgICAgICBtZXNzYWdlVHlwZSA6ICdhY3Rpb25saWJfbXNncy9Hb2FsSUQnXG4gICAgfSk7XG5cbiAgICAvLyBUcmFjayB0aGUgZ29hbHMgYW5kIHRoZWlyIHN0YXR1cyBpbiBvcmRlciB0byBwdWJsaXNoIHN0YXR1cy4uLlxuICAgIHRoaXMuc3RhdHVzTWVzc2FnZSA9IG5ldyBNZXNzYWdlKHtcbiAgICAgICAgaGVhZGVyIDoge1xuICAgICAgICAgICAgc3RhbXAgOiB7c2VjcyA6IDAsIG5zZWNzIDogMTAwfSxcbiAgICAgICAgICAgIGZyYW1lX2lkIDogJydcbiAgICAgICAgfSxcbiAgICAgICAgc3RhdHVzX2xpc3QgOiBbXVxuICAgIH0pO1xuXG4gICAgLy8gbmVlZGVkIGZvciBoYW5kbGluZyBwcmVlbXB0aW9uIHByb21wdGVkIGJ5IGEgbmV3IGdvYWwgYmVpbmcgcmVjZWl2ZWRcbiAgICB0aGlzLmN1cnJlbnRHb2FsID0gbnVsbDsgLy8gY3VycmVudGx5IHRyYWNrZWQgZ29hbFxuICAgIHRoaXMubmV4dEdvYWwgPSBudWxsOyAvLyB0aGUgb25lIHRoYXQnbGwgYmUgcHJlZW1wdGluZ1xuXG4gICAgZ29hbExpc3RlbmVyLnN1YnNjcmliZShmdW5jdGlvbihnb2FsTWVzc2FnZSkge1xuICAgICAgICBcbiAgICBpZih0aGF0LmN1cnJlbnRHb2FsKSB7XG4gICAgICAgICAgICB0aGF0Lm5leHRHb2FsID0gZ29hbE1lc3NhZ2U7XG4gICAgICAgICAgICAvLyBuZWVkcyB0byBoYXBwZW4gQUZURVIgcmVzdCBpcyBzZXQgdXBcbiAgICAgICAgICAgIHRoYXQuZW1pdCgnY2FuY2VsJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoYXQuc3RhdHVzTWVzc2FnZS5zdGF0dXNfbGlzdCA9IFt7Z29hbF9pZCA6IGdvYWxNZXNzYWdlLmdvYWxfaWQsIHN0YXR1cyA6IDF9XTtcbiAgICAgICAgICAgIHRoYXQuY3VycmVudEdvYWwgPSBnb2FsTWVzc2FnZTtcbiAgICAgICAgICAgIHRoYXQuZW1pdCgnZ29hbCcsIGdvYWxNZXNzYWdlLmdvYWwpO1xuICAgIH1cbiAgICB9KTtcblxuICAgIC8vIGhlbHBlciBmdW5jdGlvbiBmb3IgZGV0ZXJtaW5nIG9yZGVyaW5nIG9mIHRpbWVzdGFtcHNcbiAgICAvLyByZXR1cm5zIHQxIDwgdDJcbiAgICB2YXIgaXNFYXJsaWVyID0gZnVuY3Rpb24odDEsIHQyKSB7XG4gICAgICAgIGlmKHQxLnNlY3MgPiB0Mi5zZWNzKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0gZWxzZSBpZih0MS5zZWNzIDwgdDIuc2Vjcykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSBpZih0MS5uc2VjcyA8IHQyLm5zZWNzKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBUT0RPOiB0aGlzIG1heSBiZSBtb3JlIGNvbXBsaWNhdGVkIHRoYW4gbmVjZXNzYXJ5LCBzaW5jZSBJJ21cbiAgICAvLyBub3Qgc3VyZSBpZiB0aGUgY2FsbGJhY2tzIGNhbiBldmVyIHdpbmQgdXAgd2l0aCBhIHNjZW5hcmlvXG4gICAgLy8gd2hlcmUgd2UndmUgYmVlbiBwcmVlbXB0ZWQgYnkgYSBuZXh0IGdvYWwsIGl0IGhhc24ndCBmaW5pc2hlZFxuICAgIC8vIHByb2Nlc3NpbmcsIGFuZCB0aGVuIHdlIGdldCBhIGNhbmNlbCBtZXNzYWdlXG4gICAgY2FuY2VsTGlzdGVuZXIuc3Vic2NyaWJlKGZ1bmN0aW9uKGNhbmNlbE1lc3NhZ2UpIHtcblxuICAgICAgICAvLyBjYW5jZWwgQUxMIGdvYWxzIGlmIGJvdGggZW1wdHlcbiAgICAgICAgaWYoY2FuY2VsTWVzc2FnZS5zdGFtcC5zZWNzID09PSAwICYmIGNhbmNlbE1lc3NhZ2Uuc3RhbXAuc2VjcyA9PT0gMCAmJiBjYW5jZWxNZXNzYWdlLmlkID09PSAnJykge1xuICAgICAgICAgICAgdGhhdC5uZXh0R29hbCA9IG51bGw7XG4gICAgICAgICAgICBpZih0aGF0LmN1cnJlbnRHb2FsKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5lbWl0KCdjYW5jZWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHsgLy8gdHJlYXQgaWQgYW5kIHN0YW1wIGluZGVwZW5kZW50bHlcbiAgICAgICAgICAgIGlmKHRoYXQuY3VycmVudEdvYWwgJiYgY2FuY2VsTWVzc2FnZS5pZCA9PT0gdGhhdC5jdXJyZW50R29hbC5nb2FsX2lkLmlkKSB7XG4gICAgICAgICAgICAgICAgdGhhdC5lbWl0KCdjYW5jZWwnKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZih0aGF0Lm5leHRHb2FsICYmIGNhbmNlbE1lc3NhZ2UuaWQgPT09IHRoYXQubmV4dEdvYWwuZ29hbF9pZC5pZCkge1xuICAgICAgICAgICAgICAgIHRoYXQubmV4dEdvYWwgPSBudWxsO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZih0aGF0Lm5leHRHb2FsICYmIGlzRWFybGllcih0aGF0Lm5leHRHb2FsLmdvYWxfaWQuc3RhbXAsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYW5jZWxNZXNzYWdlLnN0YW1wKSkge1xuICAgICAgICAgICAgICAgIHRoYXQubmV4dEdvYWwgPSBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYodGhhdC5jdXJyZW50R29hbCAmJiBpc0VhcmxpZXIodGhhdC5jdXJyZW50R29hbC5nb2FsX2lkLnN0YW1wLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FuY2VsTWVzc2FnZS5zdGFtcCkpIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB0aGF0LmVtaXQoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBwdWJsaXNoIHN0YXR1cyBhdCBwc2V1ZG8tZml4ZWQgcmF0ZTsgcmVxdWlyZWQgZm9yIGNsaWVudHMgdG8ga25vdyB0aGV5J3ZlIGNvbm5lY3RlZFxuICAgIHZhciBzdGF0dXNJbnRlcnZhbCA9IHNldEludGVydmFsKCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgdmFyIHNlY3MgPSBNYXRoLmZsb29yKGN1cnJlbnRUaW1lLmdldFRpbWUoKS8xMDAwKTtcbiAgICAgICAgdmFyIG5zZWNzID0gTWF0aC5yb3VuZCgxMDAwMDAwMDAwKihjdXJyZW50VGltZS5nZXRUaW1lKCkvMTAwMC1zZWNzKSk7XG4gICAgICAgIHRoYXQuc3RhdHVzTWVzc2FnZS5oZWFkZXIuc3RhbXAuc2VjcyA9IHNlY3M7XG4gICAgICAgIHRoYXQuc3RhdHVzTWVzc2FnZS5oZWFkZXIuc3RhbXAubnNlY3MgPSBuc2VjcztcbiAgICAgICAgc3RhdHVzUHVibGlzaGVyLnB1Ymxpc2godGhhdC5zdGF0dXNNZXNzYWdlKTtcbiAgICB9LCA1MDApOyAvLyBwdWJsaXNoIGV2ZXJ5IDUwMG1zXG5cbn1cblxuU2ltcGxlQWN0aW9uU2VydmVyLnByb3RvdHlwZS5fX3Byb3RvX18gPSBFdmVudEVtaXR0ZXIyLnByb3RvdHlwZTtcblxuLyoqXG4qICBTZXQgYWN0aW9uIHN0YXRlIHRvIHN1Y2NlZWRlZCBhbmQgcmV0dXJuIHRvIGNsaWVudFxuKi9cblxuU2ltcGxlQWN0aW9uU2VydmVyLnByb3RvdHlwZS5zZXRTdWNjZWVkZWQgPSBmdW5jdGlvbihyZXN1bHQyKSB7XG4gICAgXG5cbiAgICB2YXIgcmVzdWx0TWVzc2FnZSA9IG5ldyBNZXNzYWdlKHtcbiAgICAgICAgc3RhdHVzIDoge2dvYWxfaWQgOiB0aGlzLmN1cnJlbnRHb2FsLmdvYWxfaWQsIHN0YXR1cyA6IDN9LFxuICAgICAgICByZXN1bHQgOiByZXN1bHQyXG4gICAgfSk7XG4gICAgdGhpcy5yZXN1bHRQdWJsaXNoZXIucHVibGlzaChyZXN1bHRNZXNzYWdlKTtcblxuICAgIHRoaXMuc3RhdHVzTWVzc2FnZS5zdGF0dXNfbGlzdCA9IFtdO1xuICAgIGlmKHRoaXMubmV4dEdvYWwpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50R29hbCA9IHRoaXMubmV4dEdvYWw7XG4gICAgICAgIHRoaXMubmV4dEdvYWwgPSBudWxsO1xuICAgICAgICB0aGlzLmVtaXQoJ2dvYWwnLCB0aGlzLmN1cnJlbnRHb2FsLmdvYWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuY3VycmVudEdvYWwgPSBudWxsO1xuICAgIH1cbn07XG5cbi8qKlxuKiAgRnVuY3Rpb24gdG8gc2VuZCBmZWVkYmFja1xuKi9cblxuU2ltcGxlQWN0aW9uU2VydmVyLnByb3RvdHlwZS5zZW5kRmVlZGJhY2sgPSBmdW5jdGlvbihmZWVkYmFjazIpIHtcblxuICAgIHZhciBmZWVkYmFja01lc3NhZ2UgPSBuZXcgTWVzc2FnZSh7XG4gICAgICAgIHN0YXR1cyA6IHtnb2FsX2lkIDogdGhpcy5jdXJyZW50R29hbC5nb2FsX2lkLCBzdGF0dXMgOiAxfSxcbiAgICAgICAgZmVlZGJhY2sgOiBmZWVkYmFjazJcbiAgICB9KTtcbiAgICB0aGlzLmZlZWRiYWNrUHVibGlzaGVyLnB1Ymxpc2goZmVlZGJhY2tNZXNzYWdlKTtcbn07XG5cbi8qKlxuKiAgSGFuZGxlIGNhc2Ugd2hlcmUgY2xpZW50IHJlcXVlc3RzIHByZWVtcHRpb25cbiovXG5cblNpbXBsZUFjdGlvblNlcnZlci5wcm90b3R5cGUuc2V0UHJlZW1wdGVkID0gZnVuY3Rpb24oKSB7XG5cbiAgICB0aGlzLnN0YXR1c01lc3NhZ2Uuc3RhdHVzX2xpc3QgPSBbXTtcbiAgICB2YXIgcmVzdWx0TWVzc2FnZSA9IG5ldyBNZXNzYWdlKHtcbiAgICAgICAgc3RhdHVzIDoge2dvYWxfaWQgOiB0aGlzLmN1cnJlbnRHb2FsLmdvYWxfaWQsIHN0YXR1cyA6IDJ9LFxuICAgIH0pO1xuICAgIHRoaXMucmVzdWx0UHVibGlzaGVyLnB1Ymxpc2gocmVzdWx0TWVzc2FnZSk7XG5cbiAgICBpZih0aGlzLm5leHRHb2FsKSB7XG4gICAgICAgIHRoaXMuY3VycmVudEdvYWwgPSB0aGlzLm5leHRHb2FsO1xuICAgICAgICB0aGlzLm5leHRHb2FsID0gbnVsbDtcbiAgICAgICAgdGhpcy5lbWl0KCdnb2FsJywgdGhpcy5jdXJyZW50R29hbC5nb2FsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmN1cnJlbnRHb2FsID0gbnVsbDtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNpbXBsZUFjdGlvblNlcnZlcjsiLCJ2YXIgUm9zID0gcmVxdWlyZSgnLi4vY29yZS9Sb3MnKTtcbnZhciBtaXhpbiA9IHJlcXVpcmUoJy4uL21peGluJyk7XG5cbnZhciBhY3Rpb24gPSBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBBY3Rpb25DbGllbnQ6IHJlcXVpcmUoJy4vQWN0aW9uQ2xpZW50JyksXG4gICAgQWN0aW9uTGlzdGVuZXI6IHJlcXVpcmUoJy4vQWN0aW9uTGlzdGVuZXInKSxcbiAgICBHb2FsOiByZXF1aXJlKCcuL0dvYWwnKSxcbiAgICBTaW1wbGVBY3Rpb25TZXJ2ZXI6IHJlcXVpcmUoJy4vU2ltcGxlQWN0aW9uU2VydmVyJylcbn07XG5cbm1peGluKFJvcywgWydBY3Rpb25DbGllbnQnLCAnU2ltcGxlQWN0aW9uU2VydmVyJ10sIGFjdGlvbik7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEBhdXRob3IgQnJhbmRvbiBBbGV4YW5kZXIgLSBiYWFsZXhhbmRlckBnbWFpbC5jb21cbiAqL1xuXG52YXIgYXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG4vKipcbiAqIE1lc3NhZ2Ugb2JqZWN0cyBhcmUgdXNlZCBmb3IgcHVibGlzaGluZyBhbmQgc3Vic2NyaWJpbmcgdG8gYW5kIGZyb20gdG9waWNzLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHZhbHVlcyAtIG9iamVjdCBtYXRjaGluZyB0aGUgZmllbGRzIGRlZmluZWQgaW4gdGhlIC5tc2cgZGVmaW5pdGlvbiBmaWxlXG4gKi9cbmZ1bmN0aW9uIE1lc3NhZ2UodmFsdWVzKSB7XG4gIGFzc2lnbih0aGlzLCB2YWx1ZXMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1lc3NhZ2U7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3XG4gKiBAYXV0aG9yIEJyYW5kb24gQWxleGFuZGVyIC0gYmFhbGV4YW5kZXJAZ21haWwuY29tXG4gKi9cblxudmFyIFNlcnZpY2UgPSByZXF1aXJlKCcuL1NlcnZpY2UnKTtcbnZhciBTZXJ2aWNlUmVxdWVzdCA9IHJlcXVpcmUoJy4vU2VydmljZVJlcXVlc3QnKTtcblxuLyoqXG4gKiBBIFJPUyBwYXJhbWV0ZXIuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gb3B0aW9ucyAtIHBvc3NpYmxlIGtleXMgaW5jbHVkZTpcbiAqICAgKiByb3MgLSB0aGUgUk9TTElCLlJvcyBjb25uZWN0aW9uIGhhbmRsZVxuICogICAqIG5hbWUgLSB0aGUgcGFyYW0gbmFtZSwgbGlrZSBtYXhfdmVsX3hcbiAqL1xuZnVuY3Rpb24gUGFyYW0ob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5yb3MgPSBvcHRpb25zLnJvcztcbiAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xufVxuXG4vKipcbiAqIEZldGNoZXMgdGhlIHZhbHVlIG9mIHRoZSBwYXJhbS5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgLSBmdW5jdGlvbiB3aXRoIHRoZSBmb2xsb3dpbmcgcGFyYW1zOlxuICogICogdmFsdWUgLSB0aGUgdmFsdWUgb2YgdGhlIHBhcmFtIGZyb20gUk9TLlxuICovXG5QYXJhbS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdmFyIHBhcmFtQ2xpZW50ID0gbmV3IFNlcnZpY2Uoe1xuICAgIHJvcyA6IHRoaXMucm9zLFxuICAgIG5hbWUgOiAnL3Jvc2FwaS9nZXRfcGFyYW0nLFxuICAgIHNlcnZpY2VUeXBlIDogJ3Jvc2FwaS9HZXRQYXJhbSdcbiAgfSk7XG5cbiAgdmFyIHJlcXVlc3QgPSBuZXcgU2VydmljZVJlcXVlc3Qoe1xuICAgIG5hbWUgOiB0aGlzLm5hbWVcbiAgfSk7XG5cbiAgcGFyYW1DbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCwgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgdmFyIHZhbHVlID0gSlNPTi5wYXJzZShyZXN1bHQudmFsdWUpO1xuICAgIGNhbGxiYWNrKHZhbHVlKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFNldHMgdGhlIHZhbHVlIG9mIHRoZSBwYXJhbSBpbiBST1MuXG4gKlxuICogQHBhcmFtIHZhbHVlIC0gdmFsdWUgdG8gc2V0IHBhcmFtIHRvLlxuICovXG5QYXJhbS5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24odmFsdWUsIGNhbGxiYWNrKSB7XG4gIHZhciBwYXJhbUNsaWVudCA9IG5ldyBTZXJ2aWNlKHtcbiAgICByb3MgOiB0aGlzLnJvcyxcbiAgICBuYW1lIDogJy9yb3NhcGkvc2V0X3BhcmFtJyxcbiAgICBzZXJ2aWNlVHlwZSA6ICdyb3NhcGkvU2V0UGFyYW0nXG4gIH0pO1xuXG4gIHZhciByZXF1ZXN0ID0gbmV3IFNlcnZpY2VSZXF1ZXN0KHtcbiAgICBuYW1lIDogdGhpcy5uYW1lLFxuICAgIHZhbHVlIDogSlNPTi5zdHJpbmdpZnkodmFsdWUpXG4gIH0pO1xuXG4gIHBhcmFtQ2xpZW50LmNhbGxTZXJ2aWNlKHJlcXVlc3QsIGNhbGxiYWNrKTtcbn07XG5cbi8qKlxuICogRGVsZXRlIHRoaXMgcGFyYW1ldGVyIG9uIHRoZSBST1Mgc2VydmVyLlxuICovXG5QYXJhbS5wcm90b3R5cGUuZGVsZXRlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdmFyIHBhcmFtQ2xpZW50ID0gbmV3IFNlcnZpY2Uoe1xuICAgIHJvcyA6IHRoaXMucm9zLFxuICAgIG5hbWUgOiAnL3Jvc2FwaS9kZWxldGVfcGFyYW0nLFxuICAgIHNlcnZpY2VUeXBlIDogJ3Jvc2FwaS9EZWxldGVQYXJhbSdcbiAgfSk7XG5cbiAgdmFyIHJlcXVlc3QgPSBuZXcgU2VydmljZVJlcXVlc3Qoe1xuICAgIG5hbWUgOiB0aGlzLm5hbWVcbiAgfSk7XG5cbiAgcGFyYW1DbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCwgY2FsbGJhY2spO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQYXJhbTsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEBhdXRob3IgQnJhbmRvbiBBbGV4YW5kZXIgLSBiYWFsZXhhbmRlckBnbWFpbC5jb21cbiAqL1xuXG52YXIgV2ViU29ja2V0ID0gcmVxdWlyZSgnd3MnKTtcbnZhciBzb2NrZXRBZGFwdGVyID0gcmVxdWlyZSgnLi9Tb2NrZXRBZGFwdGVyLmpzJyk7XG5cbnZhciBTZXJ2aWNlID0gcmVxdWlyZSgnLi9TZXJ2aWNlJyk7XG52YXIgU2VydmljZVJlcXVlc3QgPSByZXF1aXJlKCcuL1NlcnZpY2VSZXF1ZXN0Jyk7XG5cbnZhciBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG52YXIgRXZlbnRFbWl0dGVyMiA9IHJlcXVpcmUoJ2V2ZW50ZW1pdHRlcjInKS5FdmVudEVtaXR0ZXIyO1xuXG4vKipcbiAqIE1hbmFnZXMgY29ubmVjdGlvbiB0byB0aGUgc2VydmVyIGFuZCBhbGwgaW50ZXJhY3Rpb25zIHdpdGggUk9TLlxuICpcbiAqIEVtaXRzIHRoZSBmb2xsb3dpbmcgZXZlbnRzOlxuICogICogJ2Vycm9yJyAtIHRoZXJlIHdhcyBhbiBlcnJvciB3aXRoIFJPU1xuICogICogJ2Nvbm5lY3Rpb24nIC0gY29ubmVjdGVkIHRvIHRoZSBXZWJTb2NrZXQgc2VydmVyXG4gKiAgKiAnY2xvc2UnIC0gZGlzY29ubmVjdGVkIHRvIHRoZSBXZWJTb2NrZXQgc2VydmVyXG4gKiAgKiA8dG9waWNOYW1lPiAtIGEgbWVzc2FnZSBjYW1lIGZyb20gcm9zYnJpZGdlIHdpdGggdGhlIGdpdmVuIHRvcGljIG5hbWVcbiAqICAqIDxzZXJ2aWNlSUQ+IC0gYSBzZXJ2aWNlIHJlc3BvbnNlIGNhbWUgZnJvbSByb3NicmlkZ2Ugd2l0aCB0aGUgZ2l2ZW4gSURcbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvcHRpb25zIC0gcG9zc2libGUga2V5cyBpbmNsdWRlOiA8YnI+XG4gKiAgICogdXJsIChvcHRpb25hbCkgLSAoY2FuIGJlIHNwZWNpZmllZCBsYXRlciB3aXRoIGBjb25uZWN0YCkgdGhlIFdlYlNvY2tldCBVUkwgZm9yIHJvc2JyaWRnZSBvciB0aGUgbm9kZSBzZXJ2ZXIgdXJsIHRvIGNvbm5lY3QgdXNpbmcgc29ja2V0LmlvIChpZiBzb2NrZXQuaW8gZXhpc3RzIGluIHRoZSBwYWdlKSA8YnI+XG4gKiAgICogZ3Jvb3Z5Q29tcGF0aWJpbGl0eSAtIGRvbid0IHVzZSBpbnRlcmZhY2VzIHRoYXQgY2hhbmdlZCBhZnRlciB0aGUgbGFzdCBncm9vdnkgcmVsZWFzZSBvciByb3NicmlkZ2Vfc3VpdGUgYW5kIHJlbGF0ZWQgdG9vbHMgKGRlZmF1bHRzIHRvIHRydWUpXG4gKiAgICogdHJhbnNwb3J0TGlicmFyeSAob3B0aW9uYWwpIC0gb25lIG9mICd3ZWJzb2NrZXQnIChkZWZhdWx0KSwgJ3NvY2tldC5pbycgb3IgUlRDUGVlckNvbm5lY3Rpb24gaW5zdGFuY2UgY29udHJvbGxpbmcgaG93IHRoZSBjb25uZWN0aW9uIGlzIGNyZWF0ZWQgaW4gYGNvbm5lY3RgLlxuICogICAqIHRyYW5zcG9ydE9wdGlvbnMgKG9wdGlvbmFsKSAtIHRoZSBvcHRpb25zIHRvIHVzZSB1c2Ugd2hlbiBjcmVhdGluZyBhIGNvbm5lY3Rpb24uIEN1cnJlbnRseSBvbmx5IHVzZWQgaWYgYHRyYW5zcG9ydExpYnJhcnlgIGlzIFJUQ1BlZXJDb25uZWN0aW9uLlxuICovXG5mdW5jdGlvbiBSb3Mob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5zb2NrZXQgPSBudWxsO1xuICB0aGlzLmlkQ291bnRlciA9IDA7XG4gIHRoaXMuaXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgdGhpcy50cmFuc3BvcnRMaWJyYXJ5ID0gb3B0aW9ucy50cmFuc3BvcnRMaWJyYXJ5IHx8ICd3ZWJzb2NrZXQnO1xuICB0aGlzLnRyYW5zcG9ydE9wdGlvbnMgPSBvcHRpb25zLnRyYW5zcG9ydE9wdGlvbnMgfHwge307XG5cbiAgaWYgKHR5cGVvZiBvcHRpb25zLmdyb292eUNvbXBhdGliaWxpdHkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgdGhpcy5ncm9vdnlDb21wYXRpYmlsaXR5ID0gdHJ1ZTtcbiAgfVxuICBlbHNlIHtcbiAgICB0aGlzLmdyb292eUNvbXBhdGliaWxpdHkgPSBvcHRpb25zLmdyb292eUNvbXBhdGliaWxpdHk7XG4gIH1cblxuICAvLyBTZXRzIHVubGltaXRlZCBldmVudCBsaXN0ZW5lcnMuXG4gIHRoaXMuc2V0TWF4TGlzdGVuZXJzKDApO1xuXG4gIC8vIGJlZ2luIGJ5IGNoZWNraW5nIGlmIGEgVVJMIHdhcyBnaXZlblxuICBpZiAob3B0aW9ucy51cmwpIHtcbiAgICB0aGlzLmNvbm5lY3Qob3B0aW9ucy51cmwpO1xuICB9XG59XG5cblJvcy5wcm90b3R5cGUuX19wcm90b19fID0gRXZlbnRFbWl0dGVyMi5wcm90b3R5cGU7XG5cbi8qKlxuICogQ29ubmVjdCB0byB0aGUgc3BlY2lmaWVkIFdlYlNvY2tldC5cbiAqXG4gKiBAcGFyYW0gdXJsIC0gV2ViU29ja2V0IFVSTCBvciBSVENEYXRhQ2hhbm5lbCBsYWJlbCBmb3IgUm9zYnJpZGdlXG4gKi9cblJvcy5wcm90b3R5cGUuY29ubmVjdCA9IGZ1bmN0aW9uKHVybCkge1xuICBpZiAodGhpcy50cmFuc3BvcnRMaWJyYXJ5ID09PSAnc29ja2V0LmlvJykge1xuICAgIHRoaXMuc29ja2V0ID0gYXNzaWduKGlvKHVybCwgeydmb3JjZSBuZXcgY29ubmVjdGlvbic6IHRydWV9KSwgc29ja2V0QWRhcHRlcih0aGlzKSk7XG4gICAgdGhpcy5zb2NrZXQub24oJ2Nvbm5lY3QnLCB0aGlzLnNvY2tldC5vbm9wZW4pO1xuICAgIHRoaXMuc29ja2V0Lm9uKCdkYXRhJywgdGhpcy5zb2NrZXQub25tZXNzYWdlKTtcbiAgICB0aGlzLnNvY2tldC5vbignY2xvc2UnLCB0aGlzLnNvY2tldC5vbmNsb3NlKTtcbiAgICB0aGlzLnNvY2tldC5vbignZXJyb3InLCB0aGlzLnNvY2tldC5vbmVycm9yKTtcbiAgfSBlbHNlIGlmICh0aGlzLnRyYW5zcG9ydExpYnJhcnkuY29uc3RydWN0b3IubmFtZSA9PT0gJ1JUQ1BlZXJDb25uZWN0aW9uJykge1xuICAgIHRoaXMuc29ja2V0ID0gYXNzaWduKHRoaXMudHJhbnNwb3J0TGlicmFyeS5jcmVhdGVEYXRhQ2hhbm5lbCh1cmwsIHRoaXMudHJhbnNwb3J0T3B0aW9ucyksIHNvY2tldEFkYXB0ZXIodGhpcykpO1xuICB9ZWxzZSB7XG4gICAgdGhpcy5zb2NrZXQgPSBhc3NpZ24obmV3IFdlYlNvY2tldCh1cmwpLCBzb2NrZXRBZGFwdGVyKHRoaXMpKTtcbiAgfVxuXG59O1xuXG4vKipcbiAqIERpc2Nvbm5lY3QgZnJvbSB0aGUgV2ViU29ja2V0IHNlcnZlci5cbiAqL1xuUm9zLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5zb2NrZXQpIHtcbiAgICB0aGlzLnNvY2tldC5jbG9zZSgpO1xuICB9XG59O1xuXG4vKipcbiAqIFNlbmRzIGFuIGF1dGhvcml6YXRpb24gcmVxdWVzdCB0byB0aGUgc2VydmVyLlxuICpcbiAqIEBwYXJhbSBtYWMgLSBNQUMgKGhhc2gpIHN0cmluZyBnaXZlbiBieSB0aGUgdHJ1c3RlZCBzb3VyY2UuXG4gKiBAcGFyYW0gY2xpZW50IC0gSVAgb2YgdGhlIGNsaWVudC5cbiAqIEBwYXJhbSBkZXN0IC0gSVAgb2YgdGhlIGRlc3RpbmF0aW9uLlxuICogQHBhcmFtIHJhbmQgLSBSYW5kb20gc3RyaW5nIGdpdmVuIGJ5IHRoZSB0cnVzdGVkIHNvdXJjZS5cbiAqIEBwYXJhbSB0IC0gVGltZSBvZiB0aGUgYXV0aG9yaXphdGlvbiByZXF1ZXN0LlxuICogQHBhcmFtIGxldmVsIC0gVXNlciBsZXZlbCBhcyBhIHN0cmluZyBnaXZlbiBieSB0aGUgY2xpZW50LlxuICogQHBhcmFtIGVuZCAtIEVuZCB0aW1lIG9mIHRoZSBjbGllbnQncyBzZXNzaW9uLlxuICovXG5Sb3MucHJvdG90eXBlLmF1dGhlbnRpY2F0ZSA9IGZ1bmN0aW9uKG1hYywgY2xpZW50LCBkZXN0LCByYW5kLCB0LCBsZXZlbCwgZW5kKSB7XG4gIC8vIGNyZWF0ZSB0aGUgcmVxdWVzdFxuICB2YXIgYXV0aCA9IHtcbiAgICBvcCA6ICdhdXRoJyxcbiAgICBtYWMgOiBtYWMsXG4gICAgY2xpZW50IDogY2xpZW50LFxuICAgIGRlc3QgOiBkZXN0LFxuICAgIHJhbmQgOiByYW5kLFxuICAgIHQgOiB0LFxuICAgIGxldmVsIDogbGV2ZWwsXG4gICAgZW5kIDogZW5kXG4gIH07XG4gIC8vIHNlbmQgdGhlIHJlcXVlc3RcbiAgdGhpcy5jYWxsT25Db25uZWN0aW9uKGF1dGgpO1xufTtcblxuLyoqXG4gKiBTZW5kcyB0aGUgbWVzc2FnZSBvdmVyIHRoZSBXZWJTb2NrZXQsIGJ1dCBxdWV1ZXMgdGhlIG1lc3NhZ2UgdXAgaWYgbm90IHlldFxuICogY29ubmVjdGVkLlxuICovXG5Sb3MucHJvdG90eXBlLmNhbGxPbkNvbm5lY3Rpb24gPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIHZhciB0aGF0ID0gdGhpcztcbiAgdmFyIG1lc3NhZ2VKc29uID0gSlNPTi5zdHJpbmdpZnkobWVzc2FnZSk7XG4gIHZhciBlbWl0dGVyID0gbnVsbDtcbiAgaWYgKHRoaXMudHJhbnNwb3J0TGlicmFyeSA9PT0gJ3NvY2tldC5pbycpIHtcbiAgICBlbWl0dGVyID0gZnVuY3Rpb24obXNnKXt0aGF0LnNvY2tldC5lbWl0KCdvcGVyYXRpb24nLCBtc2cpO307XG4gIH0gZWxzZSB7XG4gICAgZW1pdHRlciA9IGZ1bmN0aW9uKG1zZyl7dGhhdC5zb2NrZXQuc2VuZChtc2cpO307XG4gIH1cblxuICBpZiAoIXRoaXMuaXNDb25uZWN0ZWQpIHtcbiAgICB0aGF0Lm9uY2UoJ2Nvbm5lY3Rpb24nLCBmdW5jdGlvbigpIHtcbiAgICAgIGVtaXR0ZXIobWVzc2FnZUpzb24pO1xuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGVtaXR0ZXIobWVzc2FnZUpzb24pO1xuICB9XG59O1xuXG4vKipcbiAqIFNlbmRzIGEgc2V0X2xldmVsIHJlcXVlc3QgdG8gdGhlIHNlcnZlclxuICpcbiAqIEBwYXJhbSBsZXZlbCAtIFN0YXR1cyBsZXZlbCAobm9uZSwgZXJyb3IsIHdhcm5pbmcsIGluZm8pXG4gKiBAcGFyYW0gaWQgLSBPcHRpb25hbDogT3BlcmF0aW9uIElEIHRvIGNoYW5nZSBzdGF0dXMgbGV2ZWwgb25cbiAqL1xuUm9zLnByb3RvdHlwZS5zZXRTdGF0dXNMZXZlbCA9IGZ1bmN0aW9uKGxldmVsLCBpZCl7XG4gIHZhciBsZXZlbE1zZyA9IHtcbiAgICBvcDogJ3NldF9sZXZlbCcsXG4gICAgbGV2ZWw6IGxldmVsLFxuICAgIGlkOiBpZFxuICB9O1xuXG4gIHRoaXMuY2FsbE9uQ29ubmVjdGlvbihsZXZlbE1zZyk7XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBBY3Rpb24gU2VydmVycyBpbiBST1MgYXMgYW4gYXJyYXkgb2Ygc3RyaW5nXG4gKlxuICogICAqIGFjdGlvbnNlcnZlcnMgLSBBcnJheSBvZiBhY3Rpb24gc2VydmVyIG5hbWVzXG4gKi9cblJvcy5wcm90b3R5cGUuZ2V0QWN0aW9uU2VydmVycyA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBmYWlsZWRDYWxsYmFjaykge1xuICB2YXIgZ2V0QWN0aW9uU2VydmVycyA9IG5ldyBTZXJ2aWNlKHtcbiAgICByb3MgOiB0aGlzLFxuICAgIG5hbWUgOiAnL3Jvc2FwaS9hY3Rpb25fc2VydmVycycsXG4gICAgc2VydmljZVR5cGUgOiAncm9zYXBpL0dldEFjdGlvblNlcnZlcnMnXG4gIH0pO1xuXG4gIHZhciByZXF1ZXN0ID0gbmV3IFNlcnZpY2VSZXF1ZXN0KHt9KTtcbiAgaWYgKHR5cGVvZiBmYWlsZWRDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyl7XG4gICAgZ2V0QWN0aW9uU2VydmVycy5jYWxsU2VydmljZShyZXF1ZXN0LFxuICAgICAgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdC5hY3Rpb25fc2VydmVycyk7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgIGZhaWxlZENhbGxiYWNrKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgICk7XG4gIH1lbHNle1xuICAgIGdldEFjdGlvblNlcnZlcnMuY2FsbFNlcnZpY2UocmVxdWVzdCwgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBjYWxsYmFjayhyZXN1bHQuYWN0aW9uX3NlcnZlcnMpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBsaXN0IG9mIHRvcGljcyBpbiBST1MgYXMgYW4gYXJyYXkuXG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIGZ1bmN0aW9uIHdpdGggcGFyYW1zOlxuICogICAqIHRvcGljcyAtIEFycmF5IG9mIHRvcGljIG5hbWVzXG4gKi9cblJvcy5wcm90b3R5cGUuZ2V0VG9waWNzID0gZnVuY3Rpb24oY2FsbGJhY2ssIGZhaWxlZENhbGxiYWNrKSB7XG4gIHZhciB0b3BpY3NDbGllbnQgPSBuZXcgU2VydmljZSh7XG4gICAgcm9zIDogdGhpcyxcbiAgICBuYW1lIDogJy9yb3NhcGkvdG9waWNzJyxcbiAgICBzZXJ2aWNlVHlwZSA6ICdyb3NhcGkvVG9waWNzJ1xuICB9KTtcblxuICB2YXIgcmVxdWVzdCA9IG5ldyBTZXJ2aWNlUmVxdWVzdCgpO1xuICBpZiAodHlwZW9mIGZhaWxlZENhbGxiYWNrID09PSAnZnVuY3Rpb24nKXtcbiAgICB0b3BpY3NDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCxcbiAgICAgIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKG1lc3NhZ2Upe1xuICAgICAgICBmYWlsZWRDYWxsYmFjayhtZXNzYWdlKTtcbiAgICAgIH1cbiAgICApO1xuICB9ZWxzZXtcbiAgICB0b3BpY3NDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCwgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBUb3BpY3MgaW4gUk9TIGFzIGFuIGFycmF5IGFzIHNwZWNpZmljIHR5cGVcbiAqXG4gKiBAcGFyYW0gdG9waWNUeXBlIHRvcGljIHR5cGUgdG8gZmluZDpcbiAqIEBwYXJhbSBjYWxsYmFjayBmdW5jdGlvbiB3aXRoIHBhcmFtczpcbiAqICAgKiB0b3BpY3MgLSBBcnJheSBvZiB0b3BpYyBuYW1lc1xuICovXG5Sb3MucHJvdG90eXBlLmdldFRvcGljc0ZvclR5cGUgPSBmdW5jdGlvbih0b3BpY1R5cGUsIGNhbGxiYWNrLCBmYWlsZWRDYWxsYmFjaykge1xuICB2YXIgdG9waWNzRm9yVHlwZUNsaWVudCA9IG5ldyBTZXJ2aWNlKHtcbiAgICByb3MgOiB0aGlzLFxuICAgIG5hbWUgOiAnL3Jvc2FwaS90b3BpY3NfZm9yX3R5cGUnLFxuICAgIHNlcnZpY2VUeXBlIDogJ3Jvc2FwaS9Ub3BpY3NGb3JUeXBlJ1xuICB9KTtcblxuICB2YXIgcmVxdWVzdCA9IG5ldyBTZXJ2aWNlUmVxdWVzdCh7XG4gICAgdHlwZTogdG9waWNUeXBlXG4gIH0pO1xuICBpZiAodHlwZW9mIGZhaWxlZENhbGxiYWNrID09PSAnZnVuY3Rpb24nKXtcbiAgICB0b3BpY3NGb3JUeXBlQ2xpZW50LmNhbGxTZXJ2aWNlKHJlcXVlc3QsXG4gICAgICBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgY2FsbGJhY2socmVzdWx0LnRvcGljcyk7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgIGZhaWxlZENhbGxiYWNrKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgICk7XG4gIH1lbHNle1xuICAgIHRvcGljc0ZvclR5cGVDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCwgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBjYWxsYmFjayhyZXN1bHQudG9waWNzKTtcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgbGlzdCBvZiBhY3RpdmUgc2VydmljZSBuYW1lcyBpbiBST1MuXG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIC0gZnVuY3Rpb24gd2l0aCB0aGUgZm9sbG93aW5nIHBhcmFtczpcbiAqICAgKiBzZXJ2aWNlcyAtIGFycmF5IG9mIHNlcnZpY2UgbmFtZXNcbiAqL1xuUm9zLnByb3RvdHlwZS5nZXRTZXJ2aWNlcyA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBmYWlsZWRDYWxsYmFjaykge1xuICB2YXIgc2VydmljZXNDbGllbnQgPSBuZXcgU2VydmljZSh7XG4gICAgcm9zIDogdGhpcyxcbiAgICBuYW1lIDogJy9yb3NhcGkvc2VydmljZXMnLFxuICAgIHNlcnZpY2VUeXBlIDogJ3Jvc2FwaS9TZXJ2aWNlcydcbiAgfSk7XG5cbiAgdmFyIHJlcXVlc3QgPSBuZXcgU2VydmljZVJlcXVlc3QoKTtcbiAgaWYgKHR5cGVvZiBmYWlsZWRDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyl7XG4gICAgc2VydmljZXNDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCxcbiAgICAgIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQuc2VydmljZXMpO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgZmFpbGVkQ2FsbGJhY2sobWVzc2FnZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfWVsc2V7XG4gICAgc2VydmljZXNDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCwgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBjYWxsYmFjayhyZXN1bHQuc2VydmljZXMpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBsaXN0IG9mIHNlcnZpY2VzIGluIFJPUyBhcyBhbiBhcnJheSBhcyBzcGVjaWZpYyB0eXBlXG4gKlxuICogQHBhcmFtIHNlcnZpY2VUeXBlIHNlcnZpY2UgdHlwZSB0byBmaW5kOlxuICogQHBhcmFtIGNhbGxiYWNrIGZ1bmN0aW9uIHdpdGggcGFyYW1zOlxuICogICAqIHRvcGljcyAtIEFycmF5IG9mIHNlcnZpY2UgbmFtZXNcbiAqL1xuUm9zLnByb3RvdHlwZS5nZXRTZXJ2aWNlc0ZvclR5cGUgPSBmdW5jdGlvbihzZXJ2aWNlVHlwZSwgY2FsbGJhY2ssIGZhaWxlZENhbGxiYWNrKSB7XG4gIHZhciBzZXJ2aWNlc0ZvclR5cGVDbGllbnQgPSBuZXcgU2VydmljZSh7XG4gICAgcm9zIDogdGhpcyxcbiAgICBuYW1lIDogJy9yb3NhcGkvc2VydmljZXNfZm9yX3R5cGUnLFxuICAgIHNlcnZpY2VUeXBlIDogJ3Jvc2FwaS9TZXJ2aWNlc0ZvclR5cGUnXG4gIH0pO1xuXG4gIHZhciByZXF1ZXN0ID0gbmV3IFNlcnZpY2VSZXF1ZXN0KHtcbiAgICB0eXBlOiBzZXJ2aWNlVHlwZVxuICB9KTtcbiAgaWYgKHR5cGVvZiBmYWlsZWRDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyl7XG4gICAgc2VydmljZXNGb3JUeXBlQ2xpZW50LmNhbGxTZXJ2aWNlKHJlcXVlc3QsXG4gICAgICBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgY2FsbGJhY2socmVzdWx0LnNlcnZpY2VzKTtcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgIGZhaWxlZENhbGxiYWNrKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgICk7XG4gIH1lbHNle1xuICAgIHNlcnZpY2VzRm9yVHlwZUNsaWVudC5jYWxsU2VydmljZShyZXF1ZXN0LCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIGNhbGxiYWNrKHJlc3VsdC5zZXJ2aWNlcyk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogUmV0cmlldmVzIGEgZGV0YWlsIG9mIFJPUyBzZXJ2aWNlIHJlcXVlc3QuXG4gKlxuICogQHBhcmFtIHNlcnZpY2UgbmFtZSBvZiBzZXJ2aWNlOlxuICogQHBhcmFtIGNhbGxiYWNrIC0gZnVuY3Rpb24gd2l0aCBwYXJhbXM6XG4gKiAgICogdHlwZSAtIFN0cmluZyBvZiB0aGUgc2VydmljZSB0eXBlXG4gKi9cblJvcy5wcm90b3R5cGUuZ2V0U2VydmljZVJlcXVlc3REZXRhaWxzID0gZnVuY3Rpb24odHlwZSwgY2FsbGJhY2ssIGZhaWxlZENhbGxiYWNrKSB7XG4gIHZhciBzZXJ2aWNlVHlwZUNsaWVudCA9IG5ldyBTZXJ2aWNlKHtcbiAgICByb3MgOiB0aGlzLFxuICAgIG5hbWUgOiAnL3Jvc2FwaS9zZXJ2aWNlX3JlcXVlc3RfZGV0YWlscycsXG4gICAgc2VydmljZVR5cGUgOiAncm9zYXBpL1NlcnZpY2VSZXF1ZXN0RGV0YWlscydcbiAgfSk7XG4gIHZhciByZXF1ZXN0ID0gbmV3IFNlcnZpY2VSZXF1ZXN0KHtcbiAgICB0eXBlOiB0eXBlXG4gIH0pO1xuXG4gIGlmICh0eXBlb2YgZmFpbGVkQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpe1xuICAgIHNlcnZpY2VUeXBlQ2xpZW50LmNhbGxTZXJ2aWNlKHJlcXVlc3QsXG4gICAgICBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbihtZXNzYWdlKXtcbiAgICAgICAgZmFpbGVkQ2FsbGJhY2sobWVzc2FnZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfWVsc2V7XG4gICAgc2VydmljZVR5cGVDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCwgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBjYWxsYmFjayhyZXN1bHQpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAqIFJldHJpZXZlcyBhIGRldGFpbCBvZiBST1Mgc2VydmljZSByZXF1ZXN0LlxuICpcbiAqIEBwYXJhbSBzZXJ2aWNlIG5hbWUgb2Ygc2VydmljZTpcbiAqIEBwYXJhbSBjYWxsYmFjayAtIGZ1bmN0aW9uIHdpdGggcGFyYW1zOlxuICogICAqIHR5cGUgLSBTdHJpbmcgb2YgdGhlIHNlcnZpY2UgdHlwZVxuICovXG5Sb3MucHJvdG90eXBlLmdldFNlcnZpY2VSZXNwb25zZURldGFpbHMgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgZmFpbGVkQ2FsbGJhY2spIHtcbiAgdmFyIHNlcnZpY2VUeXBlQ2xpZW50ID0gbmV3IFNlcnZpY2Uoe1xuICAgIHJvcyA6IHRoaXMsXG4gICAgbmFtZSA6ICcvcm9zYXBpL3NlcnZpY2VfcmVzcG9uc2VfZGV0YWlscycsXG4gICAgc2VydmljZVR5cGUgOiAncm9zYXBpL1NlcnZpY2VSZXNwb25zZURldGFpbHMnXG4gIH0pO1xuICB2YXIgcmVxdWVzdCA9IG5ldyBTZXJ2aWNlUmVxdWVzdCh7XG4gICAgdHlwZTogdHlwZVxuICB9KTtcblxuICBpZiAodHlwZW9mIGZhaWxlZENhbGxiYWNrID09PSAnZnVuY3Rpb24nKXtcbiAgICBzZXJ2aWNlVHlwZUNsaWVudC5jYWxsU2VydmljZShyZXF1ZXN0LFxuICAgICAgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgIGZhaWxlZENhbGxiYWNrKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgICk7XG4gIH1lbHNle1xuICAgIHNlcnZpY2VUeXBlQ2xpZW50LmNhbGxTZXJ2aWNlKHJlcXVlc3QsIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgY2FsbGJhY2socmVzdWx0KTtcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgbGlzdCBvZiBhY3RpdmUgbm9kZSBuYW1lcyBpbiBST1MuXG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIC0gZnVuY3Rpb24gd2l0aCB0aGUgZm9sbG93aW5nIHBhcmFtczpcbiAqICAgKiBub2RlcyAtIGFycmF5IG9mIG5vZGUgbmFtZXNcbiAqL1xuUm9zLnByb3RvdHlwZS5nZXROb2RlcyA9IGZ1bmN0aW9uKGNhbGxiYWNrLCBmYWlsZWRDYWxsYmFjaykge1xuICB2YXIgbm9kZXNDbGllbnQgPSBuZXcgU2VydmljZSh7XG4gICAgcm9zIDogdGhpcyxcbiAgICBuYW1lIDogJy9yb3NhcGkvbm9kZXMnLFxuICAgIHNlcnZpY2VUeXBlIDogJ3Jvc2FwaS9Ob2RlcydcbiAgfSk7XG5cbiAgdmFyIHJlcXVlc3QgPSBuZXcgU2VydmljZVJlcXVlc3QoKTtcbiAgaWYgKHR5cGVvZiBmYWlsZWRDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyl7XG4gICAgbm9kZXNDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCxcbiAgICAgIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQubm9kZXMpO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgZmFpbGVkQ2FsbGJhY2sobWVzc2FnZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfWVsc2V7XG4gICAgbm9kZXNDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCwgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBjYWxsYmFjayhyZXN1bHQubm9kZXMpO1xuICAgIH0pO1xuICB9XG59O1xuXG4vKipcbiAgKiBSZXRyaWV2ZXMgbGlzdCBzdWJzY3JpYmVkIHRvcGljcywgcHVibGlzaGluZyB0b3BpY3MgYW5kIHNlcnZpY2VzIG9mIGEgc3BlY2lmaWMgbm9kZVxuICAqXG4gICogQHBhcmFtIG5vZGUgbmFtZSBvZiB0aGUgbm9kZTpcbiAgKiBAcGFyYW0gY2FsbGJhY2sgLSBmdW5jdGlvbiB3aXRoIHBhcmFtczpcbiAgKiAgICogcHVibGljYXRpb25zIC0gYXJyYXkgb2YgcHVibGlzaGVkIHRvcGljIG5hbWVzXG4gICogICAqIHN1YnNjcmlwdGlvbnMgLSBhcnJheSBvZiBzdWJzY3JpYmVkIHRvcGljIG5hbWVzXG4gICogICAqIHNlcnZpY2VzIC0gYXJyYXkgb2Ygc2VydmljZSBuYW1lcyBob3N0ZWRcbiAgKi9cblJvcy5wcm90b3R5cGUuZ2V0Tm9kZURldGFpbHMgPSBmdW5jdGlvbihub2RlLCBjYWxsYmFjaywgZmFpbGVkQ2FsbGJhY2spIHtcbiAgdmFyIG5vZGVzQ2xpZW50ID0gbmV3IFNlcnZpY2Uoe1xuICAgIHJvcyA6IHRoaXMsXG4gICAgbmFtZSA6ICcvcm9zYXBpL25vZGVfZGV0YWlscycsXG4gICAgc2VydmljZVR5cGUgOiAncm9zYXBpL05vZGVEZXRhaWxzJ1xuICB9KTtcblxuICB2YXIgcmVxdWVzdCA9IG5ldyBTZXJ2aWNlUmVxdWVzdCh7XG4gICAgbm9kZTogbm9kZVxuICB9KTtcbiAgaWYgKHR5cGVvZiBmYWlsZWRDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyl7XG4gICAgbm9kZXNDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCxcbiAgICAgIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQuc3Vic2NyaWJpbmcsIHJlc3VsdC5wdWJsaXNoaW5nLCByZXN1bHQuc2VydmljZXMpO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgZmFpbGVkQ2FsbGJhY2sobWVzc2FnZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICBub2Rlc0NsaWVudC5jYWxsU2VydmljZShyZXF1ZXN0LCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIGNhbGxiYWNrKHJlc3VsdCk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogUmV0cmlldmVzIGxpc3Qgb2YgcGFyYW0gbmFtZXMgZnJvbSB0aGUgUk9TIFBhcmFtZXRlciBTZXJ2ZXIuXG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIGZ1bmN0aW9uIHdpdGggcGFyYW1zOlxuICogICogcGFyYW1zIC0gYXJyYXkgb2YgcGFyYW0gbmFtZXMuXG4gKi9cblJvcy5wcm90b3R5cGUuZ2V0UGFyYW1zID0gZnVuY3Rpb24oY2FsbGJhY2ssIGZhaWxlZENhbGxiYWNrKSB7XG4gIHZhciBwYXJhbXNDbGllbnQgPSBuZXcgU2VydmljZSh7XG4gICAgcm9zIDogdGhpcyxcbiAgICBuYW1lIDogJy9yb3NhcGkvZ2V0X3BhcmFtX25hbWVzJyxcbiAgICBzZXJ2aWNlVHlwZSA6ICdyb3NhcGkvR2V0UGFyYW1OYW1lcydcbiAgfSk7XG4gIHZhciByZXF1ZXN0ID0gbmV3IFNlcnZpY2VSZXF1ZXN0KCk7XG4gIGlmICh0eXBlb2YgZmFpbGVkQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpe1xuICAgIHBhcmFtc0NsaWVudC5jYWxsU2VydmljZShyZXF1ZXN0LFxuICAgICAgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgIGNhbGxiYWNrKHJlc3VsdC5uYW1lcyk7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgIGZhaWxlZENhbGxiYWNrKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgICk7XG4gIH1lbHNle1xuICAgIHBhcmFtc0NsaWVudC5jYWxsU2VydmljZShyZXF1ZXN0LCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIGNhbGxiYWNrKHJlc3VsdC5uYW1lcyk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogUmV0cmlldmVzIGEgdHlwZSBvZiBST1MgdG9waWMuXG4gKlxuICogQHBhcmFtIHRvcGljIG5hbWUgb2YgdGhlIHRvcGljOlxuICogQHBhcmFtIGNhbGxiYWNrIC0gZnVuY3Rpb24gd2l0aCBwYXJhbXM6XG4gKiAgICogdHlwZSAtIFN0cmluZyBvZiB0aGUgdG9waWMgdHlwZVxuICovXG5Sb3MucHJvdG90eXBlLmdldFRvcGljVHlwZSA9IGZ1bmN0aW9uKHRvcGljLCBjYWxsYmFjaywgZmFpbGVkQ2FsbGJhY2spIHtcbiAgdmFyIHRvcGljVHlwZUNsaWVudCA9IG5ldyBTZXJ2aWNlKHtcbiAgICByb3MgOiB0aGlzLFxuICAgIG5hbWUgOiAnL3Jvc2FwaS90b3BpY190eXBlJyxcbiAgICBzZXJ2aWNlVHlwZSA6ICdyb3NhcGkvVG9waWNUeXBlJ1xuICB9KTtcbiAgdmFyIHJlcXVlc3QgPSBuZXcgU2VydmljZVJlcXVlc3Qoe1xuICAgIHRvcGljOiB0b3BpY1xuICB9KTtcblxuICBpZiAodHlwZW9mIGZhaWxlZENhbGxiYWNrID09PSAnZnVuY3Rpb24nKXtcbiAgICB0b3BpY1R5cGVDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCxcbiAgICAgIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICBjYWxsYmFjayhyZXN1bHQudHlwZSk7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24obWVzc2FnZSl7XG4gICAgICAgIGZhaWxlZENhbGxiYWNrKG1lc3NhZ2UpO1xuICAgICAgfVxuICAgICk7XG4gIH1lbHNle1xuICAgIHRvcGljVHlwZUNsaWVudC5jYWxsU2VydmljZShyZXF1ZXN0LCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIGNhbGxiYWNrKHJlc3VsdC50eXBlKTtcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSB0eXBlIG9mIFJPUyBzZXJ2aWNlLlxuICpcbiAqIEBwYXJhbSBzZXJ2aWNlIG5hbWUgb2Ygc2VydmljZTpcbiAqIEBwYXJhbSBjYWxsYmFjayAtIGZ1bmN0aW9uIHdpdGggcGFyYW1zOlxuICogICAqIHR5cGUgLSBTdHJpbmcgb2YgdGhlIHNlcnZpY2UgdHlwZVxuICovXG5Sb3MucHJvdG90eXBlLmdldFNlcnZpY2VUeXBlID0gZnVuY3Rpb24oc2VydmljZSwgY2FsbGJhY2ssIGZhaWxlZENhbGxiYWNrKSB7XG4gIHZhciBzZXJ2aWNlVHlwZUNsaWVudCA9IG5ldyBTZXJ2aWNlKHtcbiAgICByb3MgOiB0aGlzLFxuICAgIG5hbWUgOiAnL3Jvc2FwaS9zZXJ2aWNlX3R5cGUnLFxuICAgIHNlcnZpY2VUeXBlIDogJ3Jvc2FwaS9TZXJ2aWNlVHlwZSdcbiAgfSk7XG4gIHZhciByZXF1ZXN0ID0gbmV3IFNlcnZpY2VSZXF1ZXN0KHtcbiAgICBzZXJ2aWNlOiBzZXJ2aWNlXG4gIH0pO1xuXG4gIGlmICh0eXBlb2YgZmFpbGVkQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpe1xuICAgIHNlcnZpY2VUeXBlQ2xpZW50LmNhbGxTZXJ2aWNlKHJlcXVlc3QsXG4gICAgICBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgY2FsbGJhY2socmVzdWx0LnR5cGUpO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKG1lc3NhZ2Upe1xuICAgICAgICBmYWlsZWRDYWxsYmFjayhtZXNzYWdlKTtcbiAgICAgIH1cbiAgICApO1xuICB9ZWxzZXtcbiAgICBzZXJ2aWNlVHlwZUNsaWVudC5jYWxsU2VydmljZShyZXF1ZXN0LCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIGNhbGxiYWNrKHJlc3VsdC50eXBlKTtcbiAgICB9KTtcbiAgfVxufTtcblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBkZXRhaWwgb2YgUk9TIG1lc3NhZ2UuXG4gKlxuICogQHBhcmFtIGNhbGxiYWNrIC0gZnVuY3Rpb24gd2l0aCBwYXJhbXM6XG4gKiAgICogZGV0YWlscyAtIEFycmF5IG9mIHRoZSBtZXNzYWdlIGRldGFpbFxuICogQHBhcmFtIG1lc3NhZ2UgLSBTdHJpbmcgb2YgYSB0b3BpYyB0eXBlXG4gKi9cblJvcy5wcm90b3R5cGUuZ2V0TWVzc2FnZURldGFpbHMgPSBmdW5jdGlvbihtZXNzYWdlLCBjYWxsYmFjaywgZmFpbGVkQ2FsbGJhY2spIHtcbiAgdmFyIG1lc3NhZ2VEZXRhaWxDbGllbnQgPSBuZXcgU2VydmljZSh7XG4gICAgcm9zIDogdGhpcyxcbiAgICBuYW1lIDogJy9yb3NhcGkvbWVzc2FnZV9kZXRhaWxzJyxcbiAgICBzZXJ2aWNlVHlwZSA6ICdyb3NhcGkvTWVzc2FnZURldGFpbHMnXG4gIH0pO1xuICB2YXIgcmVxdWVzdCA9IG5ldyBTZXJ2aWNlUmVxdWVzdCh7XG4gICAgdHlwZTogbWVzc2FnZVxuICB9KTtcblxuICBpZiAodHlwZW9mIGZhaWxlZENhbGxiYWNrID09PSAnZnVuY3Rpb24nKXtcbiAgICBtZXNzYWdlRGV0YWlsQ2xpZW50LmNhbGxTZXJ2aWNlKHJlcXVlc3QsXG4gICAgICBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgY2FsbGJhY2socmVzdWx0LnR5cGVkZWZzKTtcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbihtZXNzYWdlKXtcbiAgICAgICAgZmFpbGVkQ2FsbGJhY2sobWVzc2FnZSk7XG4gICAgICB9XG4gICAgKTtcbiAgfWVsc2V7XG4gICAgbWVzc2FnZURldGFpbENsaWVudC5jYWxsU2VydmljZShyZXF1ZXN0LCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIGNhbGxiYWNrKHJlc3VsdC50eXBlZGVmcyk7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogRGVjb2RlIGEgdHlwZWRlZnMgaW50byBhIGRpY3Rpb25hcnkgbGlrZSBgcm9zbXNnIHNob3cgZm9vL2JhcmBcbiAqXG4gKiBAcGFyYW0gZGVmcyAtIGFycmF5IG9mIHR5cGVfZGVmIGRpY3Rpb25hcnlcbiAqL1xuUm9zLnByb3RvdHlwZS5kZWNvZGVUeXBlRGVmcyA9IGZ1bmN0aW9uKGRlZnMpIHtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuXG4gIC8vIGNhbGxzIGl0c2VsZiByZWN1cnNpdmVseSB0byByZXNvbHZlIHR5cGUgZGVmaW5pdGlvbiB1c2luZyBoaW50cy5cbiAgdmFyIGRlY29kZVR5cGVEZWZzUmVjID0gZnVuY3Rpb24odGhlVHlwZSwgaGludHMpIHtcbiAgICB2YXIgdHlwZURlZkRpY3QgPSB7fTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoZVR5cGUuZmllbGRuYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGFycmF5TGVuID0gdGhlVHlwZS5maWVsZGFycmF5bGVuW2ldO1xuICAgICAgdmFyIGZpZWxkTmFtZSA9IHRoZVR5cGUuZmllbGRuYW1lc1tpXTtcbiAgICAgIHZhciBmaWVsZFR5cGUgPSB0aGVUeXBlLmZpZWxkdHlwZXNbaV07XG4gICAgICBpZiAoZmllbGRUeXBlLmluZGV4T2YoJy8nKSA9PT0gLTEpIHsgLy8gY2hlY2sgdGhlIGZpZWxkVHlwZSBpbmNsdWRlcyAnLycgb3Igbm90XG4gICAgICAgIGlmIChhcnJheUxlbiA9PT0gLTEpIHtcbiAgICAgICAgICB0eXBlRGVmRGljdFtmaWVsZE5hbWVdID0gZmllbGRUeXBlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHR5cGVEZWZEaWN0W2ZpZWxkTmFtZV0gPSBbZmllbGRUeXBlXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIGxvb2t1cCB0aGUgbmFtZVxuICAgICAgICB2YXIgc3ViID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgaGludHMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBpZiAoaGludHNbal0udHlwZS50b1N0cmluZygpID09PSBmaWVsZFR5cGUudG9TdHJpbmcoKSkge1xuICAgICAgICAgICAgc3ViID0gaGludHNbal07XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN1Yikge1xuICAgICAgICAgIHZhciBzdWJSZXN1bHQgPSBkZWNvZGVUeXBlRGVmc1JlYyhzdWIsIGhpbnRzKTtcbiAgICAgICAgICBpZiAoYXJyYXlMZW4gPT09IC0xKSB7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdHlwZURlZkRpY3RbZmllbGROYW1lXSA9IFtzdWJSZXN1bHRdO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICB0aGF0LmVtaXQoJ2Vycm9yJywgJ0Nhbm5vdCBmaW5kICcgKyBmaWVsZFR5cGUgKyAnIGluIGRlY29kZVR5cGVEZWZzJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHR5cGVEZWZEaWN0O1xuICB9O1xuXG4gIHJldHVybiBkZWNvZGVUeXBlRGVmc1JlYyhkZWZzWzBdLCBkZWZzKTtcbn07XG5cblxubW9kdWxlLmV4cG9ydHMgPSBSb3M7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEBhdXRob3IgQnJhbmRvbiBBbGV4YW5kZXIgLSBiYWFsZXhhbmRlckBnbWFpbC5jb21cbiAqL1xuXG52YXIgU2VydmljZVJlc3BvbnNlID0gcmVxdWlyZSgnLi9TZXJ2aWNlUmVzcG9uc2UnKTtcbnZhciBTZXJ2aWNlUmVxdWVzdCA9IHJlcXVpcmUoJy4vU2VydmljZVJlcXVlc3QnKTtcbnZhciBFdmVudEVtaXR0ZXIyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMicpLkV2ZW50RW1pdHRlcjI7XG5cbi8qKlxuICogQSBST1Mgc2VydmljZSBjbGllbnQuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW1zIG9wdGlvbnMgLSBwb3NzaWJsZSBrZXlzIGluY2x1ZGU6XG4gKiAgICogcm9zIC0gdGhlIFJPU0xJQi5Sb3MgY29ubmVjdGlvbiBoYW5kbGVcbiAqICAgKiBuYW1lIC0gdGhlIHNlcnZpY2UgbmFtZSwgbGlrZSAvYWRkX3R3b19pbnRzXG4gKiAgICogc2VydmljZVR5cGUgLSB0aGUgc2VydmljZSB0eXBlLCBsaWtlICdyb3NweV90dXRvcmlhbHMvQWRkVHdvSW50cydcbiAqL1xuZnVuY3Rpb24gU2VydmljZShvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLnJvcyA9IG9wdGlvbnMucm9zO1xuICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWU7XG4gIHRoaXMuc2VydmljZVR5cGUgPSBvcHRpb25zLnNlcnZpY2VUeXBlO1xuICB0aGlzLmlzQWR2ZXJ0aXNlZCA9IGZhbHNlO1xuXG4gIHRoaXMuX3NlcnZpY2VDYWxsYmFjayA9IG51bGw7XG59XG5TZXJ2aWNlLnByb3RvdHlwZS5fX3Byb3RvX18gPSBFdmVudEVtaXR0ZXIyLnByb3RvdHlwZTtcbi8qKlxuICogQ2FsbHMgdGhlIHNlcnZpY2UuIFJldHVybnMgdGhlIHNlcnZpY2UgcmVzcG9uc2UgaW4gdGhlIGNhbGxiYWNrLlxuICpcbiAqIEBwYXJhbSByZXF1ZXN0IC0gdGhlIFJPU0xJQi5TZXJ2aWNlUmVxdWVzdCB0byBzZW5kXG4gKiBAcGFyYW0gY2FsbGJhY2sgLSBmdW5jdGlvbiB3aXRoIHBhcmFtczpcbiAqICAgKiByZXNwb25zZSAtIHRoZSByZXNwb25zZSBmcm9tIHRoZSBzZXJ2aWNlIHJlcXVlc3RcbiAqIEBwYXJhbSBmYWlsZWRDYWxsYmFjayAtIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB3aGVuIHRoZSBzZXJ2aWNlIGNhbGwgZmFpbGVkIChvcHRpb25hbCkuIFBhcmFtczpcbiAqICAgKiBlcnJvciAtIHRoZSBlcnJvciBtZXNzYWdlIHJlcG9ydGVkIGJ5IFJPU1xuICovXG5TZXJ2aWNlLnByb3RvdHlwZS5jYWxsU2VydmljZSA9IGZ1bmN0aW9uKHJlcXVlc3QsIGNhbGxiYWNrLCBmYWlsZWRDYWxsYmFjaykge1xuICBpZiAodGhpcy5pc0FkdmVydGlzZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgc2VydmljZUNhbGxJZCA9ICdjYWxsX3NlcnZpY2U6JyArIHRoaXMubmFtZSArICc6JyArICgrK3RoaXMucm9zLmlkQ291bnRlcik7XG5cbiAgaWYgKGNhbGxiYWNrIHx8IGZhaWxlZENhbGxiYWNrKSB7XG4gICAgdGhpcy5yb3Mub25jZShzZXJ2aWNlQ2FsbElkLCBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICBpZiAobWVzc2FnZS5yZXN1bHQgIT09IHVuZGVmaW5lZCAmJiBtZXNzYWdlLnJlc3VsdCA9PT0gZmFsc2UpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBmYWlsZWRDYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGZhaWxlZENhbGxiYWNrKG1lc3NhZ2UudmFsdWVzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2sobmV3IFNlcnZpY2VSZXNwb25zZShtZXNzYWdlLnZhbHVlcykpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdmFyIGNhbGwgPSB7XG4gICAgb3AgOiAnY2FsbF9zZXJ2aWNlJyxcbiAgICBpZCA6IHNlcnZpY2VDYWxsSWQsXG4gICAgc2VydmljZSA6IHRoaXMubmFtZSxcbiAgICBhcmdzIDogcmVxdWVzdFxuICB9O1xuICB0aGlzLnJvcy5jYWxsT25Db25uZWN0aW9uKGNhbGwpO1xufTtcblxuLyoqXG4gKiBFdmVyeSB0aW1lIGEgbWVzc2FnZSBpcyBwdWJsaXNoZWQgZm9yIHRoZSBnaXZlbiB0b3BpYywgdGhlIGNhbGxiYWNrXG4gKiB3aWxsIGJlIGNhbGxlZCB3aXRoIHRoZSBtZXNzYWdlIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgLSBmdW5jdGlvbiB3aXRoIHRoZSBmb2xsb3dpbmcgcGFyYW1zOlxuICogICAqIG1lc3NhZ2UgLSB0aGUgcHVibGlzaGVkIG1lc3NhZ2VcbiAqL1xuU2VydmljZS5wcm90b3R5cGUuYWR2ZXJ0aXNlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgaWYgKHRoaXMuaXNBZHZlcnRpc2VkIHx8IHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuX3NlcnZpY2VDYWxsYmFjayA9IGNhbGxiYWNrO1xuICB0aGlzLnJvcy5vbih0aGlzLm5hbWUsIHRoaXMuX3NlcnZpY2VSZXNwb25zZS5iaW5kKHRoaXMpKTtcbiAgdGhpcy5yb3MuY2FsbE9uQ29ubmVjdGlvbih7XG4gICAgb3A6ICdhZHZlcnRpc2Vfc2VydmljZScsXG4gICAgdHlwZTogdGhpcy5zZXJ2aWNlVHlwZSxcbiAgICBzZXJ2aWNlOiB0aGlzLm5hbWVcbiAgfSk7XG4gIHRoaXMuaXNBZHZlcnRpc2VkID0gdHJ1ZTtcbn07XG5cblNlcnZpY2UucHJvdG90eXBlLnVuYWR2ZXJ0aXNlID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5pc0FkdmVydGlzZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5yb3MuY2FsbE9uQ29ubmVjdGlvbih7XG4gICAgb3A6ICd1bmFkdmVydGlzZV9zZXJ2aWNlJyxcbiAgICBzZXJ2aWNlOiB0aGlzLm5hbWVcbiAgfSk7XG4gIHRoaXMuaXNBZHZlcnRpc2VkID0gZmFsc2U7XG59O1xuXG5TZXJ2aWNlLnByb3RvdHlwZS5fc2VydmljZVJlc3BvbnNlID0gZnVuY3Rpb24ocm9zYnJpZGdlUmVxdWVzdCkge1xuICB2YXIgcmVzcG9uc2UgPSB7fTtcbiAgdmFyIHN1Y2Nlc3MgPSB0aGlzLl9zZXJ2aWNlQ2FsbGJhY2socm9zYnJpZGdlUmVxdWVzdC5hcmdzLCByZXNwb25zZSk7XG5cbiAgdmFyIGNhbGwgPSB7XG4gICAgb3A6ICdzZXJ2aWNlX3Jlc3BvbnNlJyxcbiAgICBzZXJ2aWNlOiB0aGlzLm5hbWUsXG4gICAgdmFsdWVzOiBuZXcgU2VydmljZVJlc3BvbnNlKHJlc3BvbnNlKSxcbiAgICByZXN1bHQ6IHN1Y2Nlc3NcbiAgfTtcblxuICBpZiAocm9zYnJpZGdlUmVxdWVzdC5pZCkge1xuICAgIGNhbGwuaWQgPSByb3NicmlkZ2VSZXF1ZXN0LmlkO1xuICB9XG5cbiAgdGhpcy5yb3MuY2FsbE9uQ29ubmVjdGlvbihjYWxsKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gU2VydmljZTsiLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEBhdXRob3IgQnJhbmRvbiBBbGV4YW5kZXIgLSBiYWxleGFuZGVyQHdpbGxvd2dhcmFnZS5jb21cbiAqL1xuXG52YXIgYXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG4vKipcbiAqIEEgU2VydmljZVJlcXVlc3QgaXMgcGFzc2VkIGludG8gdGhlIHNlcnZpY2UgY2FsbC5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB2YWx1ZXMgLSBvYmplY3QgbWF0Y2hpbmcgdGhlIGZpZWxkcyBkZWZpbmVkIGluIHRoZSAuc3J2IGRlZmluaXRpb24gZmlsZVxuICovXG5mdW5jdGlvbiBTZXJ2aWNlUmVxdWVzdCh2YWx1ZXMpIHtcbiAgYXNzaWduKHRoaXMsIHZhbHVlcyk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU2VydmljZVJlcXVlc3Q7IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3XG4gKiBAYXV0aG9yIEJyYW5kb24gQWxleGFuZGVyIC0gYmFsZXhhbmRlckB3aWxsb3dnYXJhZ2UuY29tXG4gKi9cblxudmFyIGFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxuLyoqXG4gKiBBIFNlcnZpY2VSZXNwb25zZSBpcyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2aWNlIGNhbGwuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gdmFsdWVzIC0gb2JqZWN0IG1hdGNoaW5nIHRoZSBmaWVsZHMgZGVmaW5lZCBpbiB0aGUgLnNydiBkZWZpbml0aW9uIGZpbGVcbiAqL1xuZnVuY3Rpb24gU2VydmljZVJlc3BvbnNlKHZhbHVlcykge1xuICBhc3NpZ24odGhpcywgdmFsdWVzKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTZXJ2aWNlUmVzcG9uc2U7IiwiLyoqXG4gKiBTb2NrZXQgZXZlbnQgaGFuZGxpbmcgdXRpbGl0aWVzIGZvciBoYW5kbGluZyBldmVudHMgb24gZWl0aGVyXG4gKiBXZWJTb2NrZXQgYW5kIFRDUCBzb2NrZXRzXG4gKlxuICogTm90ZSB0byBhbnlvbmUgcmV2aWV3aW5nIHRoaXMgY29kZTogdGhlc2UgZnVuY3Rpb25zIGFyZSBjYWxsZWRcbiAqIGluIHRoZSBjb250ZXh0IG9mIHRoZWlyIHBhcmVudCBvYmplY3QsIHVubGVzcyBib3VuZFxuICogQGZpbGVPdmVydmlld1xuICovXG4ndXNlIHN0cmljdCc7XG5cbnZhciBkZWNvbXByZXNzUG5nID0gcmVxdWlyZSgnLi4vdXRpbC9kZWNvbXByZXNzUG5nJyk7XG52YXIgV2ViU29ja2V0ID0gcmVxdWlyZSgnd3MnKTtcbnZhciBCU09OID0gbnVsbDtcbmlmKHR5cGVvZiBic29uICE9PSAndW5kZWZpbmVkJyl7XG4gICAgQlNPTiA9IGJzb24oKS5CU09OO1xufVxuXG4vKipcbiAqIEV2ZW50cyBsaXN0ZW5lcnMgZm9yIGEgV2ViU29ja2V0IG9yIFRDUCBzb2NrZXQgdG8gYSBKYXZhU2NyaXB0XG4gKiBST1MgQ2xpZW50LiBTZXRzIHVwIE1lc3NhZ2VzIGZvciBhIGdpdmVuIHRvcGljIHRvIHRyaWdnZXIgYW5cbiAqIGV2ZW50IG9uIHRoZSBST1MgY2xpZW50LlxuICpcbiAqIEBuYW1lc3BhY2UgU29ja2V0QWRhcHRlclxuICogQHByaXZhdGVcbiAqL1xuZnVuY3Rpb24gU29ja2V0QWRhcHRlcihjbGllbnQpIHtcbiAgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShtZXNzYWdlKSB7XG4gICAgaWYgKG1lc3NhZ2Uub3AgPT09ICdwdWJsaXNoJykge1xuICAgICAgY2xpZW50LmVtaXQobWVzc2FnZS50b3BpYywgbWVzc2FnZS5tc2cpO1xuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5vcCA9PT0gJ3NlcnZpY2VfcmVzcG9uc2UnKSB7XG4gICAgICBjbGllbnQuZW1pdChtZXNzYWdlLmlkLCBtZXNzYWdlKTtcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2Uub3AgPT09ICdjYWxsX3NlcnZpY2UnKSB7XG4gICAgICBjbGllbnQuZW1pdChtZXNzYWdlLnNlcnZpY2UsIG1lc3NhZ2UpO1xuICAgIH0gZWxzZSBpZihtZXNzYWdlLm9wID09PSAnc3RhdHVzJyl7XG4gICAgICBpZihtZXNzYWdlLmlkKXtcbiAgICAgICAgY2xpZW50LmVtaXQoJ3N0YXR1czonK21lc3NhZ2UuaWQsIG1lc3NhZ2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2xpZW50LmVtaXQoJ3N0YXR1cycsIG1lc3NhZ2UpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhhbmRsZVBuZyhtZXNzYWdlLCBjYWxsYmFjaykge1xuICAgIGlmIChtZXNzYWdlLm9wID09PSAncG5nJykge1xuICAgICAgZGVjb21wcmVzc1BuZyhtZXNzYWdlLmRhdGEsIGNhbGxiYWNrKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2FsbGJhY2sobWVzc2FnZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZGVjb2RlQlNPTihkYXRhLCBjYWxsYmFjaykge1xuICAgIGlmICghQlNPTikge1xuICAgICAgdGhyb3cgJ0Nhbm5vdCBwcm9jZXNzIEJTT04gZW5jb2RlZCBtZXNzYWdlIHdpdGhvdXQgQlNPTiBoZWFkZXIuJztcbiAgICB9XG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgcmVhZGVyLm9ubG9hZCAgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciB1aW50OEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5yZXN1bHQpO1xuICAgICAgdmFyIG1zZyA9IEJTT04uZGVzZXJpYWxpemUodWludDhBcnJheSk7XG4gICAgICBjYWxsYmFjayhtc2cpO1xuICAgIH07XG4gICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGRhdGEpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICAvKipcbiAgICAgKiBFbWl0cyBhICdjb25uZWN0aW9uJyBldmVudCBvbiBXZWJTb2NrZXQgY29ubmVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBldmVudCAtIHRoZSBhcmd1bWVudCB0byBlbWl0IHdpdGggdGhlIGV2ZW50LlxuICAgICAqIEBtZW1iZXJvZiBTb2NrZXRBZGFwdGVyXG4gICAgICovXG4gICAgb25vcGVuOiBmdW5jdGlvbiBvbk9wZW4oZXZlbnQpIHtcbiAgICAgIGNsaWVudC5pc0Nvbm5lY3RlZCA9IHRydWU7XG4gICAgICBjbGllbnQuZW1pdCgnY29ubmVjdGlvbicsIGV2ZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRW1pdHMgYSAnY2xvc2UnIGV2ZW50IG9uIFdlYlNvY2tldCBkaXNjb25uZWN0aW9uLlxuICAgICAqXG4gICAgICogQHBhcmFtIGV2ZW50IC0gdGhlIGFyZ3VtZW50IHRvIGVtaXQgd2l0aCB0aGUgZXZlbnQuXG4gICAgICogQG1lbWJlcm9mIFNvY2tldEFkYXB0ZXJcbiAgICAgKi9cbiAgICBvbmNsb3NlOiBmdW5jdGlvbiBvbkNsb3NlKGV2ZW50KSB7XG4gICAgICBjbGllbnQuaXNDb25uZWN0ZWQgPSBmYWxzZTtcbiAgICAgIGNsaWVudC5lbWl0KCdjbG9zZScsIGV2ZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRW1pdHMgYW4gJ2Vycm9yJyBldmVudCB3aGVuZXZlciB0aGVyZSB3YXMgYW4gZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXZlbnQgLSB0aGUgYXJndW1lbnQgdG8gZW1pdCB3aXRoIHRoZSBldmVudC5cbiAgICAgKiBAbWVtYmVyb2YgU29ja2V0QWRhcHRlclxuICAgICAqL1xuICAgIG9uZXJyb3I6IGZ1bmN0aW9uIG9uRXJyb3IoZXZlbnQpIHtcbiAgICAgIGNsaWVudC5lbWl0KCdlcnJvcicsIGV2ZW50KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUGFyc2VzIG1lc3NhZ2UgcmVzcG9uc2VzIGZyb20gcm9zYnJpZGdlIGFuZCBzZW5kcyB0byB0aGUgYXBwcm9wcmlhdGVcbiAgICAgKiB0b3BpYywgc2VydmljZSwgb3IgcGFyYW0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gbWVzc2FnZSAtIHRoZSByYXcgSlNPTiBtZXNzYWdlIGZyb20gcm9zYnJpZGdlLlxuICAgICAqIEBtZW1iZXJvZiBTb2NrZXRBZGFwdGVyXG4gICAgICovXG4gICAgb25tZXNzYWdlOiBmdW5jdGlvbiBvbk1lc3NhZ2UoZGF0YSkge1xuICAgICAgaWYgKHR5cGVvZiBCbG9iICE9PSAndW5kZWZpbmVkJyAmJiBkYXRhLmRhdGEgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgICAgIGRlY29kZUJTT04oZGF0YS5kYXRhLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgIGhhbmRsZVBuZyhtZXNzYWdlLCBoYW5kbGVNZXNzYWdlKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2YXIgbWVzc2FnZSA9IEpTT04ucGFyc2UodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnID8gZGF0YSA6IGRhdGEuZGF0YSk7XG4gICAgICAgIGhhbmRsZVBuZyhtZXNzYWdlLCBoYW5kbGVNZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU29ja2V0QWRhcHRlcjtcbiIsIi8qKlxuICogQGZpbGVvdmVydmlld1xuICogQGF1dGhvciBCcmFuZG9uIEFsZXhhbmRlciAtIGJhYWxleGFuZGVyQGdtYWlsLmNvbVxuICovXG5cbnZhciBFdmVudEVtaXR0ZXIyID0gcmVxdWlyZSgnZXZlbnRlbWl0dGVyMicpLkV2ZW50RW1pdHRlcjI7XG52YXIgTWVzc2FnZSA9IHJlcXVpcmUoJy4vTWVzc2FnZScpO1xuXG4vKipcbiAqIFB1Ymxpc2ggYW5kL29yIHN1YnNjcmliZSB0byBhIHRvcGljIGluIFJPUy5cbiAqXG4gKiBFbWl0cyB0aGUgZm9sbG93aW5nIGV2ZW50czpcbiAqICAqICd3YXJuaW5nJyAtIGlmIHRoZXJlIGFyZSBhbnkgd2FybmluZyBkdXJpbmcgdGhlIFRvcGljIGNyZWF0aW9uXG4gKiAgKiAnbWVzc2FnZScgLSB0aGUgbWVzc2FnZSBkYXRhIGZyb20gcm9zYnJpZGdlXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gb3B0aW9ucyAtIG9iamVjdCB3aXRoIGZvbGxvd2luZyBrZXlzOlxuICogICAqIHJvcyAtIHRoZSBST1NMSUIuUm9zIGNvbm5lY3Rpb24gaGFuZGxlXG4gKiAgICogbmFtZSAtIHRoZSB0b3BpYyBuYW1lLCBsaWtlIC9jbWRfdmVsXG4gKiAgICogbWVzc2FnZVR5cGUgLSB0aGUgbWVzc2FnZSB0eXBlLCBsaWtlICdzdGRfbXNncy9TdHJpbmcnXG4gKiAgICogY29tcHJlc3Npb24gLSB0aGUgdHlwZSBvZiBjb21wcmVzc2lvbiB0byB1c2UsIGxpa2UgJ3BuZydcbiAqICAgKiB0aHJvdHRsZV9yYXRlIC0gdGhlIHJhdGUgKGluIG1zIGluIGJldHdlZW4gbWVzc2FnZXMpIGF0IHdoaWNoIHRvIHRocm90dGxlIHRoZSB0b3BpY3NcbiAqICAgKiBxdWV1ZV9zaXplIC0gdGhlIHF1ZXVlIGNyZWF0ZWQgYXQgYnJpZGdlIHNpZGUgZm9yIHJlLXB1Ymxpc2hpbmcgd2VidG9waWNzIChkZWZhdWx0cyB0byAxMDApXG4gKiAgICogbGF0Y2ggLSBsYXRjaCB0aGUgdG9waWMgd2hlbiBwdWJsaXNoaW5nXG4gKiAgICogcXVldWVfbGVuZ3RoIC0gdGhlIHF1ZXVlIGxlbmd0aCBhdCBicmlkZ2Ugc2lkZSB1c2VkIHdoZW4gc3Vic2NyaWJpbmcgKGRlZmF1bHRzIHRvIDAsIG5vIHF1ZXVlaW5nKS5cbiAqICAgKiByZWNvbm5lY3Rfb25fY2xvc2UgLSB0aGUgZmxhZyB0byBlbmFibGUgcmVzdWJzY3JpcHRpb24gYW5kIHJlYWR2ZXJ0aXNlbWVudCBvbiBjbG9zZSBldmVudChkZWZhdWx0cyB0byB0cnVlKS5cbiAqL1xuZnVuY3Rpb24gVG9waWMob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5yb3MgPSBvcHRpb25zLnJvcztcbiAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICB0aGlzLm1lc3NhZ2VUeXBlID0gb3B0aW9ucy5tZXNzYWdlVHlwZTtcbiAgdGhpcy5pc0FkdmVydGlzZWQgPSBmYWxzZTtcbiAgdGhpcy5jb21wcmVzc2lvbiA9IG9wdGlvbnMuY29tcHJlc3Npb24gfHwgJ25vbmUnO1xuICB0aGlzLnRocm90dGxlX3JhdGUgPSBvcHRpb25zLnRocm90dGxlX3JhdGUgfHwgMDtcbiAgdGhpcy5sYXRjaCA9IG9wdGlvbnMubGF0Y2ggfHwgZmFsc2U7XG4gIHRoaXMucXVldWVfc2l6ZSA9IG9wdGlvbnMucXVldWVfc2l6ZSB8fCAxMDA7XG4gIHRoaXMucXVldWVfbGVuZ3RoID0gb3B0aW9ucy5xdWV1ZV9sZW5ndGggfHwgMDtcbiAgdGhpcy5yZWNvbm5lY3Rfb25fY2xvc2UgPSBvcHRpb25zLnJlY29ubmVjdF9vbl9jbG9zZSB8fCB0cnVlO1xuXG4gIC8vIENoZWNrIGZvciB2YWxpZCBjb21wcmVzc2lvbiB0eXBlc1xuICBpZiAodGhpcy5jb21wcmVzc2lvbiAmJiB0aGlzLmNvbXByZXNzaW9uICE9PSAncG5nJyAmJlxuICAgIHRoaXMuY29tcHJlc3Npb24gIT09ICdub25lJykge1xuICAgIHRoaXMuZW1pdCgnd2FybmluZycsIHRoaXMuY29tcHJlc3Npb24gK1xuICAgICAgJyBjb21wcmVzc2lvbiBpcyBub3Qgc3VwcG9ydGVkLiBObyBjb21wcmVzc2lvbiB3aWxsIGJlIHVzZWQuJyk7XG4gIH1cblxuICAvLyBDaGVjayBpZiB0aHJvdHRsZSByYXRlIGlzIG5lZ2F0aXZlXG4gIGlmICh0aGlzLnRocm90dGxlX3JhdGUgPCAwKSB7XG4gICAgdGhpcy5lbWl0KCd3YXJuaW5nJywgdGhpcy50aHJvdHRsZV9yYXRlICsgJyBpcyBub3QgYWxsb3dlZC4gU2V0IHRvIDAnKTtcbiAgICB0aGlzLnRocm90dGxlX3JhdGUgPSAwO1xuICB9XG5cbiAgdmFyIHRoYXQgPSB0aGlzO1xuICBpZiAodGhpcy5yZWNvbm5lY3Rfb25fY2xvc2UpIHtcbiAgICB0aGlzLmNhbGxGb3JTdWJzY3JpYmVBbmRBZHZlcnRpc2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICB0aGF0LnJvcy5jYWxsT25Db25uZWN0aW9uKG1lc3NhZ2UpO1xuXG4gICAgICB0aGF0LndhaXRGb3JSZWNvbm5lY3QgPSBmYWxzZTtcbiAgICAgIHRoYXQucmVjb25uZWN0RnVuYyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZighdGhhdC53YWl0Rm9yUmVjb25uZWN0KSB7XG4gICAgICAgICAgdGhhdC53YWl0Rm9yUmVjb25uZWN0ID0gdHJ1ZTtcbiAgICAgICAgICB0aGF0LnJvcy5jYWxsT25Db25uZWN0aW9uKG1lc3NhZ2UpO1xuICAgICAgICAgIHRoYXQucm9zLm9uY2UoJ2Nvbm5lY3Rpb24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoYXQud2FpdEZvclJlY29ubmVjdCA9IGZhbHNlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgdGhhdC5yb3Mub24oJ2Nsb3NlJywgdGhhdC5yZWNvbm5lY3RGdW5jKTtcbiAgICB9O1xuICB9XG4gIGVsc2Uge1xuICAgIHRoaXMuY2FsbEZvclN1YnNjcmliZUFuZEFkdmVydGlzZSA9IHRoaXMucm9zLmNhbGxPbkNvbm5lY3Rpb247XG4gIH1cblxuICB0aGlzLl9tZXNzYWdlQ2FsbGJhY2sgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhhdC5lbWl0KCdtZXNzYWdlJywgbmV3IE1lc3NhZ2UoZGF0YSkpO1xuICB9O1xufVxuVG9waWMucHJvdG90eXBlLl9fcHJvdG9fXyA9IEV2ZW50RW1pdHRlcjIucHJvdG90eXBlO1xuXG4vKipcbiAqIEV2ZXJ5IHRpbWUgYSBtZXNzYWdlIGlzIHB1Ymxpc2hlZCBmb3IgdGhlIGdpdmVuIHRvcGljLCB0aGUgY2FsbGJhY2tcbiAqIHdpbGwgYmUgY2FsbGVkIHdpdGggdGhlIG1lc3NhZ2Ugb2JqZWN0LlxuICpcbiAqIEBwYXJhbSBjYWxsYmFjayAtIGZ1bmN0aW9uIHdpdGggdGhlIGZvbGxvd2luZyBwYXJhbXM6XG4gKiAgICogbWVzc2FnZSAtIHRoZSBwdWJsaXNoZWQgbWVzc2FnZVxuICovXG5Ub3BpYy5wcm90b3R5cGUuc3Vic2NyaWJlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHRoaXMub24oJ21lc3NhZ2UnLCBjYWxsYmFjayk7XG4gIH1cblxuICBpZiAodGhpcy5zdWJzY3JpYmVJZCkgeyByZXR1cm47IH1cbiAgdGhpcy5yb3Mub24odGhpcy5uYW1lLCB0aGlzLl9tZXNzYWdlQ2FsbGJhY2spO1xuICB0aGlzLnN1YnNjcmliZUlkID0gJ3N1YnNjcmliZTonICsgdGhpcy5uYW1lICsgJzonICsgKCsrdGhpcy5yb3MuaWRDb3VudGVyKTtcblxuICB0aGlzLmNhbGxGb3JTdWJzY3JpYmVBbmRBZHZlcnRpc2Uoe1xuICAgIG9wOiAnc3Vic2NyaWJlJyxcbiAgICBpZDogdGhpcy5zdWJzY3JpYmVJZCxcbiAgICB0eXBlOiB0aGlzLm1lc3NhZ2VUeXBlLFxuICAgIHRvcGljOiB0aGlzLm5hbWUsXG4gICAgY29tcHJlc3Npb246IHRoaXMuY29tcHJlc3Npb24sXG4gICAgdGhyb3R0bGVfcmF0ZTogdGhpcy50aHJvdHRsZV9yYXRlLFxuICAgIHF1ZXVlX2xlbmd0aDogdGhpcy5xdWV1ZV9sZW5ndGhcbiAgfSk7XG59O1xuXG4vKipcbiAqIFVucmVnaXN0ZXJzIGFzIGEgc3Vic2NyaWJlciBmb3IgdGhlIHRvcGljLiBVbnN1YnNjcmliaW5nIHN0b3AgcmVtb3ZlXG4gKiBhbGwgc3Vic2NyaWJlIGNhbGxiYWNrcy4gVG8gcmVtb3ZlIGEgY2FsbCBiYWNrLCB5b3UgbXVzdCBleHBsaWNpdGx5XG4gKiBwYXNzIHRoZSBjYWxsYmFjayBmdW5jdGlvbiBpbi5cbiAqXG4gKiBAcGFyYW0gY2FsbGJhY2sgLSB0aGUgb3B0aW9uYWwgY2FsbGJhY2sgdG8gdW5yZWdpc3RlciwgaWZcbiAqICAgICAqIHByb3ZpZGVkIGFuZCBvdGhlciBsaXN0ZW5lcnMgYXJlIHJlZ2lzdGVyZWQgdGhlIHRvcGljIHdvbid0XG4gKiAgICAgKiB1bnN1YnNjcmliZSwganVzdCBzdG9wIGVtaXR0aW5nIHRvIHRoZSBwYXNzZWQgbGlzdGVuZXJcbiAqL1xuVG9waWMucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgaWYgKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5vZmYoJ21lc3NhZ2UnLCBjYWxsYmFjayk7XG4gICAgLy8gSWYgdGhlcmUgaXMgYW55IG90aGVyIGNhbGxiYWNrcyBzdGlsbCBzdWJzY3JpYmVkIGRvbid0IHVuc3Vic2NyaWJlXG4gICAgaWYgKHRoaXMubGlzdGVuZXJzKCdtZXNzYWdlJykubGVuZ3RoKSB7IHJldHVybjsgfVxuICB9XG4gIGlmICghdGhpcy5zdWJzY3JpYmVJZCkgeyByZXR1cm47IH1cbiAgLy8gTm90ZTogRG9uJ3QgY2FsbCB0aGlzLnJlbW92ZUFsbExpc3RlbmVycywgYWxsb3cgY2xpZW50IHRvIGhhbmRsZSB0aGF0IHRoZW1zZWx2ZXNcbiAgdGhpcy5yb3Mub2ZmKHRoaXMubmFtZSwgdGhpcy5fbWVzc2FnZUNhbGxiYWNrKTtcbiAgaWYodGhpcy5yZWNvbm5lY3Rfb25fY2xvc2UpIHtcbiAgICB0aGlzLnJvcy5vZmYoJ2Nsb3NlJywgdGhpcy5yZWNvbm5lY3RGdW5jKTtcbiAgfVxuICB0aGlzLmVtaXQoJ3Vuc3Vic2NyaWJlJyk7XG4gIHRoaXMucm9zLmNhbGxPbkNvbm5lY3Rpb24oe1xuICAgIG9wOiAndW5zdWJzY3JpYmUnLFxuICAgIGlkOiB0aGlzLnN1YnNjcmliZUlkLFxuICAgIHRvcGljOiB0aGlzLm5hbWVcbiAgfSk7XG4gIHRoaXMuc3Vic2NyaWJlSWQgPSBudWxsO1xufTtcblxuXG4vKipcbiAqIFJlZ2lzdGVycyBhcyBhIHB1Ymxpc2hlciBmb3IgdGhlIHRvcGljLlxuICovXG5Ub3BpYy5wcm90b3R5cGUuYWR2ZXJ0aXNlID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0aGlzLmlzQWR2ZXJ0aXNlZCkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmFkdmVydGlzZUlkID0gJ2FkdmVydGlzZTonICsgdGhpcy5uYW1lICsgJzonICsgKCsrdGhpcy5yb3MuaWRDb3VudGVyKTtcbiAgdGhpcy5jYWxsRm9yU3Vic2NyaWJlQW5kQWR2ZXJ0aXNlKHtcbiAgICBvcDogJ2FkdmVydGlzZScsXG4gICAgaWQ6IHRoaXMuYWR2ZXJ0aXNlSWQsXG4gICAgdHlwZTogdGhpcy5tZXNzYWdlVHlwZSxcbiAgICB0b3BpYzogdGhpcy5uYW1lLFxuICAgIGxhdGNoOiB0aGlzLmxhdGNoLFxuICAgIHF1ZXVlX3NpemU6IHRoaXMucXVldWVfc2l6ZVxuICB9KTtcbiAgdGhpcy5pc0FkdmVydGlzZWQgPSB0cnVlO1xuXG4gIGlmKCF0aGlzLnJlY29ubmVjdF9vbl9jbG9zZSkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICB0aGlzLnJvcy5vbignY2xvc2UnLCBmdW5jdGlvbigpIHtcbiAgICAgIHRoYXQuaXNBZHZlcnRpc2VkID0gZmFsc2U7XG4gICAgfSk7XG4gIH1cbn07XG5cbi8qKlxuICogVW5yZWdpc3RlcnMgYXMgYSBwdWJsaXNoZXIgZm9yIHRoZSB0b3BpYy5cbiAqL1xuVG9waWMucHJvdG90eXBlLnVuYWR2ZXJ0aXNlID0gZnVuY3Rpb24oKSB7XG4gIGlmICghdGhpcy5pc0FkdmVydGlzZWQpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYodGhpcy5yZWNvbm5lY3Rfb25fY2xvc2UpIHtcbiAgICB0aGlzLnJvcy5vZmYoJ2Nsb3NlJywgdGhpcy5yZWNvbm5lY3RGdW5jKTtcbiAgfVxuICB0aGlzLmVtaXQoJ3VuYWR2ZXJ0aXNlJyk7XG4gIHRoaXMucm9zLmNhbGxPbkNvbm5lY3Rpb24oe1xuICAgIG9wOiAndW5hZHZlcnRpc2UnLFxuICAgIGlkOiB0aGlzLmFkdmVydGlzZUlkLFxuICAgIHRvcGljOiB0aGlzLm5hbWVcbiAgfSk7XG4gIHRoaXMuaXNBZHZlcnRpc2VkID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIFB1Ymxpc2ggdGhlIG1lc3NhZ2UuXG4gKlxuICogQHBhcmFtIG1lc3NhZ2UgLSBBIFJPU0xJQi5NZXNzYWdlIG9iamVjdC5cbiAqL1xuVG9waWMucHJvdG90eXBlLnB1Ymxpc2ggPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIGlmICghdGhpcy5pc0FkdmVydGlzZWQpIHtcbiAgICB0aGlzLmFkdmVydGlzZSgpO1xuICB9XG5cbiAgdGhpcy5yb3MuaWRDb3VudGVyKys7XG4gIHZhciBjYWxsID0ge1xuICAgIG9wOiAncHVibGlzaCcsXG4gICAgaWQ6ICdwdWJsaXNoOicgKyB0aGlzLm5hbWUgKyAnOicgKyB0aGlzLnJvcy5pZENvdW50ZXIsXG4gICAgdG9waWM6IHRoaXMubmFtZSxcbiAgICBtc2c6IG1lc3NhZ2UsXG4gICAgbGF0Y2g6IHRoaXMubGF0Y2hcbiAgfTtcbiAgdGhpcy5yb3MuY2FsbE9uQ29ubmVjdGlvbihjYWxsKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVG9waWM7XG4iLCJ2YXIgbWl4aW4gPSByZXF1aXJlKCcuLi9taXhpbicpO1xuXG52YXIgY29yZSA9IG1vZHVsZS5leHBvcnRzID0ge1xuICAgIFJvczogcmVxdWlyZSgnLi9Sb3MnKSxcbiAgICBUb3BpYzogcmVxdWlyZSgnLi9Ub3BpYycpLFxuICAgIE1lc3NhZ2U6IHJlcXVpcmUoJy4vTWVzc2FnZScpLFxuICAgIFBhcmFtOiByZXF1aXJlKCcuL1BhcmFtJyksXG4gICAgU2VydmljZTogcmVxdWlyZSgnLi9TZXJ2aWNlJyksXG4gICAgU2VydmljZVJlcXVlc3Q6IHJlcXVpcmUoJy4vU2VydmljZVJlcXVlc3QnKSxcbiAgICBTZXJ2aWNlUmVzcG9uc2U6IHJlcXVpcmUoJy4vU2VydmljZVJlc3BvbnNlJylcbn07XG5cbm1peGluKGNvcmUuUm9zLCBbJ1BhcmFtJywgJ1NlcnZpY2UnLCAnVG9waWMnXSwgY29yZSk7XG4iLCIvKipcbiAqIEBmaWxlb3ZlcnZpZXdcbiAqIEBhdXRob3IgRGF2aWQgR29zc293IC0gZGdvc3Nvd0B3aWxsb3dnYXJhZ2UuY29tXG4gKi9cblxudmFyIFZlY3RvcjMgPSByZXF1aXJlKCcuL1ZlY3RvcjMnKTtcbnZhciBRdWF0ZXJuaW9uID0gcmVxdWlyZSgnLi9RdWF0ZXJuaW9uJyk7XG5cbi8qKlxuICogQSBQb3NlIGluIDNEIHNwYWNlLiBWYWx1ZXMgYXJlIGNvcGllZCBpbnRvIHRoaXMgb2JqZWN0LlxuICpcbiAqICBAY29uc3RydWN0b3JcbiAqICBAcGFyYW0gb3B0aW9ucyAtIG9iamVjdCB3aXRoIGZvbGxvd2luZyBrZXlzOlxuICogICAqIHBvc2l0aW9uIC0gdGhlIFZlY3RvcjMgZGVzY3JpYmluZyB0aGUgcG9zaXRpb25cbiAqICAgKiBvcmllbnRhdGlvbiAtIHRoZSBST1NMSUIuUXVhdGVybmlvbiBkZXNjcmliaW5nIHRoZSBvcmllbnRhdGlvblxuICovXG5mdW5jdGlvbiBQb3NlKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIC8vIGNvcHkgdGhlIHZhbHVlcyBpbnRvIHRoaXMgb2JqZWN0IGlmIHRoZXkgZXhpc3RcbiAgdGhpcy5wb3NpdGlvbiA9IG5ldyBWZWN0b3IzKG9wdGlvbnMucG9zaXRpb24pO1xuICB0aGlzLm9yaWVudGF0aW9uID0gbmV3IFF1YXRlcm5pb24ob3B0aW9ucy5vcmllbnRhdGlvbik7XG59XG5cbi8qKlxuICogQXBwbHkgYSB0cmFuc2Zvcm0gYWdhaW5zdCB0aGlzIHBvc2UuXG4gKlxuICogQHBhcmFtIHRmIHRoZSB0cmFuc2Zvcm1cbiAqL1xuUG9zZS5wcm90b3R5cGUuYXBwbHlUcmFuc2Zvcm0gPSBmdW5jdGlvbih0Zikge1xuICB0aGlzLnBvc2l0aW9uLm11bHRpcGx5UXVhdGVybmlvbih0Zi5yb3RhdGlvbik7XG4gIHRoaXMucG9zaXRpb24uYWRkKHRmLnRyYW5zbGF0aW9uKTtcbiAgdmFyIHRtcCA9IHRmLnJvdGF0aW9uLmNsb25lKCk7XG4gIHRtcC5tdWx0aXBseSh0aGlzLm9yaWVudGF0aW9uKTtcbiAgdGhpcy5vcmllbnRhdGlvbiA9IHRtcDtcbn07XG5cbi8qKlxuICogQ2xvbmUgYSBjb3B5IG9mIHRoaXMgcG9zZS5cbiAqXG4gKiBAcmV0dXJucyB0aGUgY2xvbmVkIHBvc2VcbiAqL1xuUG9zZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBQb3NlKHRoaXMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBQb3NlOyIsIi8qKlxuICogQGZpbGVvdmVydmlld1xuICogQGF1dGhvciBEYXZpZCBHb3Nzb3cgLSBkZ29zc293QHdpbGxvd2dhcmFnZS5jb21cbiAqL1xuXG4vKipcbiAqIEEgUXVhdGVybmlvbi5cbiAqXG4gKiAgQGNvbnN0cnVjdG9yXG4gKiAgQHBhcmFtIG9wdGlvbnMgLSBvYmplY3Qgd2l0aCBmb2xsb3dpbmcga2V5czpcbiAqICAgKiB4IC0gdGhlIHggdmFsdWVcbiAqICAgKiB5IC0gdGhlIHkgdmFsdWVcbiAqICAgKiB6IC0gdGhlIHogdmFsdWVcbiAqICAgKiB3IC0gdGhlIHcgdmFsdWVcbiAqL1xuZnVuY3Rpb24gUXVhdGVybmlvbihvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLnggPSBvcHRpb25zLnggfHwgMDtcbiAgdGhpcy55ID0gb3B0aW9ucy55IHx8IDA7XG4gIHRoaXMueiA9IG9wdGlvbnMueiB8fCAwO1xuICB0aGlzLncgPSAodHlwZW9mIG9wdGlvbnMudyA9PT0gJ251bWJlcicpID8gb3B0aW9ucy53IDogMTtcbn1cblxuLyoqXG4gKiBQZXJmb3JtIGEgY29uanVnYXRpb24gb24gdGhpcyBxdWF0ZXJuaW9uLlxuICovXG5RdWF0ZXJuaW9uLnByb3RvdHlwZS5jb25qdWdhdGUgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy54ICo9IC0xO1xuICB0aGlzLnkgKj0gLTE7XG4gIHRoaXMueiAqPSAtMTtcbn07XG5cbi8qKlxuICogUmV0dXJuIHRoZSBub3JtIG9mIHRoaXMgcXVhdGVybmlvbi5cbiAqL1xuUXVhdGVybmlvbi5wcm90b3R5cGUubm9ybSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueiArIHRoaXMudyAqIHRoaXMudyk7XG59O1xuXG4vKipcbiAqIFBlcmZvcm0gYSBub3JtYWxpemF0aW9uIG9uIHRoaXMgcXVhdGVybmlvbi5cbiAqL1xuUXVhdGVybmlvbi5wcm90b3R5cGUubm9ybWFsaXplID0gZnVuY3Rpb24oKSB7XG4gIHZhciBsID0gTWF0aC5zcXJ0KHRoaXMueCAqIHRoaXMueCArIHRoaXMueSAqIHRoaXMueSArIHRoaXMueiAqIHRoaXMueiArIHRoaXMudyAqIHRoaXMudyk7XG4gIGlmIChsID09PSAwKSB7XG4gICAgdGhpcy54ID0gMDtcbiAgICB0aGlzLnkgPSAwO1xuICAgIHRoaXMueiA9IDA7XG4gICAgdGhpcy53ID0gMTtcbiAgfSBlbHNlIHtcbiAgICBsID0gMSAvIGw7XG4gICAgdGhpcy54ID0gdGhpcy54ICogbDtcbiAgICB0aGlzLnkgPSB0aGlzLnkgKiBsO1xuICAgIHRoaXMueiA9IHRoaXMueiAqIGw7XG4gICAgdGhpcy53ID0gdGhpcy53ICogbDtcbiAgfVxufTtcblxuLyoqXG4gKiBDb252ZXJ0IHRoaXMgcXVhdGVybmlvbiBpbnRvIGl0cyBpbnZlcnNlLlxuICovXG5RdWF0ZXJuaW9uLnByb3RvdHlwZS5pbnZlcnQgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jb25qdWdhdGUoKTtcbiAgdGhpcy5ub3JtYWxpemUoKTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSB2YWx1ZXMgb2YgdGhpcyBxdWF0ZXJuaW9uIHRvIHRoZSBwcm9kdWN0IG9mIGl0c2VsZiBhbmQgdGhlIGdpdmVuIHF1YXRlcm5pb24uXG4gKlxuICogQHBhcmFtIHEgdGhlIHF1YXRlcm5pb24gdG8gbXVsdGlwbHkgd2l0aFxuICovXG5RdWF0ZXJuaW9uLnByb3RvdHlwZS5tdWx0aXBseSA9IGZ1bmN0aW9uKHEpIHtcbiAgdmFyIG5ld1ggPSB0aGlzLnggKiBxLncgKyB0aGlzLnkgKiBxLnogLSB0aGlzLnogKiBxLnkgKyB0aGlzLncgKiBxLng7XG4gIHZhciBuZXdZID0gLXRoaXMueCAqIHEueiArIHRoaXMueSAqIHEudyArIHRoaXMueiAqIHEueCArIHRoaXMudyAqIHEueTtcbiAgdmFyIG5ld1ogPSB0aGlzLnggKiBxLnkgLSB0aGlzLnkgKiBxLnggKyB0aGlzLnogKiBxLncgKyB0aGlzLncgKiBxLno7XG4gIHZhciBuZXdXID0gLXRoaXMueCAqIHEueCAtIHRoaXMueSAqIHEueSAtIHRoaXMueiAqIHEueiArIHRoaXMudyAqIHEudztcbiAgdGhpcy54ID0gbmV3WDtcbiAgdGhpcy55ID0gbmV3WTtcbiAgdGhpcy56ID0gbmV3WjtcbiAgdGhpcy53ID0gbmV3Vztcbn07XG5cbi8qKlxuICogQ2xvbmUgYSBjb3B5IG9mIHRoaXMgcXVhdGVybmlvbi5cbiAqXG4gKiBAcmV0dXJucyB0aGUgY2xvbmVkIHF1YXRlcm5pb25cbiAqL1xuUXVhdGVybmlvbi5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBRdWF0ZXJuaW9uKHRoaXMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBRdWF0ZXJuaW9uO1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3XG4gKiBAYXV0aG9yIERhdmlkIEdvc3NvdyAtIGRnb3Nzb3dAd2lsbG93Z2FyYWdlLmNvbVxuICovXG5cbnZhciBWZWN0b3IzID0gcmVxdWlyZSgnLi9WZWN0b3IzJyk7XG52YXIgUXVhdGVybmlvbiA9IHJlcXVpcmUoJy4vUXVhdGVybmlvbicpO1xuXG4vKipcbiAqIEEgVHJhbnNmb3JtIGluIDMtc3BhY2UuIFZhbHVlcyBhcmUgY29waWVkIGludG8gdGhpcyBvYmplY3QuXG4gKlxuICogIEBjb25zdHJ1Y3RvclxuICogIEBwYXJhbSBvcHRpb25zIC0gb2JqZWN0IHdpdGggZm9sbG93aW5nIGtleXM6XG4gKiAgICogdHJhbnNsYXRpb24gLSB0aGUgVmVjdG9yMyBkZXNjcmliaW5nIHRoZSB0cmFuc2xhdGlvblxuICogICAqIHJvdGF0aW9uIC0gdGhlIFJPU0xJQi5RdWF0ZXJuaW9uIGRlc2NyaWJpbmcgdGhlIHJvdGF0aW9uXG4gKi9cbmZ1bmN0aW9uIFRyYW5zZm9ybShvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAvLyBDb3B5IHRoZSB2YWx1ZXMgaW50byB0aGlzIG9iamVjdCBpZiB0aGV5IGV4aXN0XG4gIHRoaXMudHJhbnNsYXRpb24gPSBuZXcgVmVjdG9yMyhvcHRpb25zLnRyYW5zbGF0aW9uKTtcbiAgdGhpcy5yb3RhdGlvbiA9IG5ldyBRdWF0ZXJuaW9uKG9wdGlvbnMucm90YXRpb24pO1xufVxuXG4vKipcbiAqIENsb25lIGEgY29weSBvZiB0aGlzIHRyYW5zZm9ybS5cbiAqXG4gKiBAcmV0dXJucyB0aGUgY2xvbmVkIHRyYW5zZm9ybVxuICovXG5UcmFuc2Zvcm0ucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVHJhbnNmb3JtKHRoaXMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2Zvcm07IiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3XG4gKiBAYXV0aG9yIERhdmlkIEdvc3NvdyAtIGRnb3Nzb3dAd2lsbG93Z2FyYWdlLmNvbVxuICovXG5cbi8qKlxuICogQSAzRCB2ZWN0b3IuXG4gKlxuICogIEBjb25zdHJ1Y3RvclxuICogIEBwYXJhbSBvcHRpb25zIC0gb2JqZWN0IHdpdGggZm9sbG93aW5nIGtleXM6XG4gKiAgICogeCAtIHRoZSB4IHZhbHVlXG4gKiAgICogeSAtIHRoZSB5IHZhbHVlXG4gKiAgICogeiAtIHRoZSB6IHZhbHVlXG4gKi9cbmZ1bmN0aW9uIFZlY3RvcjMob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy54ID0gb3B0aW9ucy54IHx8IDA7XG4gIHRoaXMueSA9IG9wdGlvbnMueSB8fCAwO1xuICB0aGlzLnogPSBvcHRpb25zLnogfHwgMDtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIHZhbHVlcyBvZiB0aGlzIHZlY3RvciB0byB0aGUgc3VtIG9mIGl0c2VsZiBhbmQgdGhlIGdpdmVuIHZlY3Rvci5cbiAqXG4gKiBAcGFyYW0gdiB0aGUgdmVjdG9yIHRvIGFkZCB3aXRoXG4gKi9cblZlY3RvcjMucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHYpIHtcbiAgdGhpcy54ICs9IHYueDtcbiAgdGhpcy55ICs9IHYueTtcbiAgdGhpcy56ICs9IHYuejtcbn07XG5cbi8qKlxuICogU2V0IHRoZSB2YWx1ZXMgb2YgdGhpcyB2ZWN0b3IgdG8gdGhlIGRpZmZlcmVuY2Ugb2YgaXRzZWxmIGFuZCB0aGUgZ2l2ZW4gdmVjdG9yLlxuICpcbiAqIEBwYXJhbSB2IHRoZSB2ZWN0b3IgdG8gc3VidHJhY3Qgd2l0aFxuICovXG5WZWN0b3IzLnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uKHYpIHtcbiAgdGhpcy54IC09IHYueDtcbiAgdGhpcy55IC09IHYueTtcbiAgdGhpcy56IC09IHYuejtcbn07XG5cbi8qKlxuICogTXVsdGlwbHkgdGhlIGdpdmVuIFF1YXRlcm5pb24gd2l0aCB0aGlzIHZlY3Rvci5cbiAqXG4gKiBAcGFyYW0gcSAtIHRoZSBxdWF0ZXJuaW9uIHRvIG11bHRpcGx5IHdpdGhcbiAqL1xuVmVjdG9yMy5wcm90b3R5cGUubXVsdGlwbHlRdWF0ZXJuaW9uID0gZnVuY3Rpb24ocSkge1xuICB2YXIgaXggPSBxLncgKiB0aGlzLnggKyBxLnkgKiB0aGlzLnogLSBxLnogKiB0aGlzLnk7XG4gIHZhciBpeSA9IHEudyAqIHRoaXMueSArIHEueiAqIHRoaXMueCAtIHEueCAqIHRoaXMuejtcbiAgdmFyIGl6ID0gcS53ICogdGhpcy56ICsgcS54ICogdGhpcy55IC0gcS55ICogdGhpcy54O1xuICB2YXIgaXcgPSAtcS54ICogdGhpcy54IC0gcS55ICogdGhpcy55IC0gcS56ICogdGhpcy56O1xuICB0aGlzLnggPSBpeCAqIHEudyArIGl3ICogLXEueCArIGl5ICogLXEueiAtIGl6ICogLXEueTtcbiAgdGhpcy55ID0gaXkgKiBxLncgKyBpdyAqIC1xLnkgKyBpeiAqIC1xLnggLSBpeCAqIC1xLno7XG4gIHRoaXMueiA9IGl6ICogcS53ICsgaXcgKiAtcS56ICsgaXggKiAtcS55IC0gaXkgKiAtcS54O1xufTtcblxuLyoqXG4gKiBDbG9uZSBhIGNvcHkgb2YgdGhpcyB2ZWN0b3IuXG4gKlxuICogQHJldHVybnMgdGhlIGNsb25lZCB2ZWN0b3JcbiAqL1xuVmVjdG9yMy5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBWZWN0b3IzKHRoaXMpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBWZWN0b3IzOyIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIFBvc2U6IHJlcXVpcmUoJy4vUG9zZScpLFxuICAgIFF1YXRlcm5pb246IHJlcXVpcmUoJy4vUXVhdGVybmlvbicpLFxuICAgIFRyYW5zZm9ybTogcmVxdWlyZSgnLi9UcmFuc2Zvcm0nKSxcbiAgICBWZWN0b3IzOiByZXF1aXJlKCcuL1ZlY3RvcjMnKVxufTtcbiIsIi8qKlxuICogTWl4aW4gYSBmZWF0dXJlIHRvIHRoZSBjb3JlL1JvcyBwcm90b3R5cGUuXG4gKiBGb3IgZXhhbXBsZSwgbWl4aW4oUm9zLCBbJ1RvcGljJ10sIHtUb3BpYzogPFRvcGljPn0pXG4gKiB3aWxsIGFkZCBhIHRvcGljIGJvdW5kIHRvIGFueSBSb3MgaW5zdGFuY2VzIHNvIGEgdXNlclxuICogY2FuIGNhbGwgYHZhciB0b3BpYyA9IHJvcy5Ub3BpYyh7bmFtZTogJy9mb28nfSk7YFxuICpcbiAqIEBhdXRob3IgR3JhZW1lIFllYXRlcyAtIGdpdGh1Yi5jb20vbWVnYXdhY1xuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFJvcywgY2xhc3NlcywgZmVhdHVyZXMpIHtcbiAgICBjbGFzc2VzLmZvckVhY2goZnVuY3Rpb24oY2xhc3NOYW1lKSB7XG4gICAgICAgIHZhciBDbGFzcyA9IGZlYXR1cmVzW2NsYXNzTmFtZV07XG4gICAgICAgIFJvcy5wcm90b3R5cGVbY2xhc3NOYW1lXSA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMucm9zID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiBuZXcgQ2xhc3Mob3B0aW9ucyk7XG4gICAgICAgIH07XG4gICAgfSk7XG59O1xuIiwiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3XG4gKiBAYXV0aG9yIERhdmlkIEdvc3NvdyAtIGRnb3Nzb3dAd2lsbG93Z2FyYWdlLmNvbVxuICovXG5cbnZhciBBY3Rpb25DbGllbnQgPSByZXF1aXJlKCcuLi9hY3Rpb25saWIvQWN0aW9uQ2xpZW50Jyk7XG52YXIgR29hbCA9IHJlcXVpcmUoJy4uL2FjdGlvbmxpYi9Hb2FsJyk7XG5cbnZhciBTZXJ2aWNlID0gcmVxdWlyZSgnLi4vY29yZS9TZXJ2aWNlLmpzJyk7XG52YXIgU2VydmljZVJlcXVlc3QgPSByZXF1aXJlKCcuLi9jb3JlL1NlcnZpY2VSZXF1ZXN0LmpzJyk7XG5cbnZhciBUcmFuc2Zvcm0gPSByZXF1aXJlKCcuLi9tYXRoL1RyYW5zZm9ybScpO1xuXG4vKipcbiAqIEEgVEYgQ2xpZW50IHRoYXQgbGlzdGVucyB0byBURnMgZnJvbSB0ZjJfd2ViX3JlcHVibGlzaGVyLlxuICpcbiAqICBAY29uc3RydWN0b3JcbiAqICBAcGFyYW0gb3B0aW9ucyAtIG9iamVjdCB3aXRoIGZvbGxvd2luZyBrZXlzOlxuICogICAqIHJvcyAtIHRoZSBST1NMSUIuUm9zIGNvbm5lY3Rpb24gaGFuZGxlXG4gKiAgICogZml4ZWRGcmFtZSAtIHRoZSBmaXhlZCBmcmFtZSwgbGlrZSAvYmFzZV9saW5rXG4gKiAgICogYW5ndWxhclRocmVzIC0gdGhlIGFuZ3VsYXIgdGhyZXNob2xkIGZvciB0aGUgVEYgcmVwdWJsaXNoZXJcbiAqICAgKiB0cmFuc1RocmVzIC0gdGhlIHRyYW5zbGF0aW9uIHRocmVzaG9sZCBmb3IgdGhlIFRGIHJlcHVibGlzaGVyXG4gKiAgICogcmF0ZSAtIHRoZSByYXRlIGZvciB0aGUgVEYgcmVwdWJsaXNoZXJcbiAqICAgKiB1cGRhdGVEZWxheSAtIHRoZSB0aW1lIChpbiBtcykgdG8gd2FpdCBhZnRlciBhIG5ldyBzdWJzY3JpcHRpb25cbiAqICAgICAgICAgICAgICAgICAgIHRvIHVwZGF0ZSB0aGUgVEYgcmVwdWJsaXNoZXIncyBsaXN0IG9mIFRGc1xuICogICAqIHRvcGljVGltZW91dCAtIHRoZSB0aW1lb3V0IHBhcmFtZXRlciBmb3IgdGhlIFRGIHJlcHVibGlzaGVyXG4gKiAgICogc2VydmVyTmFtZSAob3B0aW9uYWwpIC0gdGhlIG5hbWUgb2YgdGhlIHRmMl93ZWJfcmVwdWJsaXNoZXIgc2VydmVyXG4gKiAgICogcmVwdWJTZXJ2aWNlTmFtZSAob3B0aW9uYWwpIC0gdGhlIG5hbWUgb2YgdGhlIHJlcHVibGlzaF90ZnMgc2VydmljZSAobm9uIGdyb292eSBjb21wYXRpYmlsaXR5IG1vZGUgb25seSlcbiAqICAgXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQgZGVmYXVsdDogJy9yZXB1Ymxpc2hfdGZzJ1xuICovXG5mdW5jdGlvbiBURkNsaWVudChvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLnJvcyA9IG9wdGlvbnMucm9zO1xuICB0aGlzLmZpeGVkRnJhbWUgPSBvcHRpb25zLmZpeGVkRnJhbWUgfHwgJy9iYXNlX2xpbmsnO1xuICB0aGlzLmFuZ3VsYXJUaHJlcyA9IG9wdGlvbnMuYW5ndWxhclRocmVzIHx8IDIuMDtcbiAgdGhpcy50cmFuc1RocmVzID0gb3B0aW9ucy50cmFuc1RocmVzIHx8IDAuMDE7XG4gIHRoaXMucmF0ZSA9IG9wdGlvbnMucmF0ZSB8fCAxMC4wO1xuICB0aGlzLnVwZGF0ZURlbGF5ID0gb3B0aW9ucy51cGRhdGVEZWxheSB8fCA1MDtcbiAgdmFyIHNlY29uZHMgPSBvcHRpb25zLnRvcGljVGltZW91dCB8fCAyLjA7XG4gIHZhciBzZWNzID0gTWF0aC5mbG9vcihzZWNvbmRzKTtcbiAgdmFyIG5zZWNzID0gTWF0aC5mbG9vcigoc2Vjb25kcyAtIHNlY3MpICogMTAwMDAwMDAwMCk7XG4gIHRoaXMudG9waWNUaW1lb3V0ID0ge1xuICAgIHNlY3M6IHNlY3MsXG4gICAgbnNlY3M6IG5zZWNzXG4gIH07XG4gIHRoaXMuc2VydmVyTmFtZSA9IG9wdGlvbnMuc2VydmVyTmFtZSB8fCAnL3RmMl93ZWJfcmVwdWJsaXNoZXInO1xuICB0aGlzLnJlcHViU2VydmljZU5hbWUgPSBvcHRpb25zLnJlcHViU2VydmljZU5hbWUgfHwgJy9yZXB1Ymxpc2hfdGZzJztcblxuICB0aGlzLmN1cnJlbnRHb2FsID0gZmFsc2U7XG4gIHRoaXMuY3VycmVudFRvcGljID0gZmFsc2U7XG4gIHRoaXMuZnJhbWVJbmZvcyA9IHt9O1xuICB0aGlzLnJlcHVibGlzaGVyVXBkYXRlUmVxdWVzdGVkID0gZmFsc2U7XG5cbiAgLy8gQ3JlYXRlIGFuIEFjdGlvbiBjbGllbnRcbiAgdGhpcy5hY3Rpb25DbGllbnQgPSB0aGlzLnJvcy5BY3Rpb25DbGllbnQoe1xuICAgIHNlcnZlck5hbWUgOiB0aGlzLnNlcnZlck5hbWUsXG4gICAgYWN0aW9uTmFtZSA6ICd0ZjJfd2ViX3JlcHVibGlzaGVyL1RGU3Vic2NyaXB0aW9uQWN0aW9uJyxcbiAgICBvbWl0U3RhdHVzIDogdHJ1ZSxcbiAgICBvbWl0UmVzdWx0IDogdHJ1ZVxuICB9KTtcblxuICAvLyBDcmVhdGUgYSBTZXJ2aWNlIGNsaWVudFxuICB0aGlzLnNlcnZpY2VDbGllbnQgPSB0aGlzLnJvcy5TZXJ2aWNlKHtcbiAgICBuYW1lOiB0aGlzLnJlcHViU2VydmljZU5hbWUsXG4gICAgc2VydmljZVR5cGU6ICd0ZjJfd2ViX3JlcHVibGlzaGVyL1JlcHVibGlzaFRGcydcbiAgfSk7XG59XG5cbi8qKlxuICogUHJvY2VzcyB0aGUgaW5jb21pbmcgVEYgbWVzc2FnZSBhbmQgc2VuZCB0aGVtIG91dCB1c2luZyB0aGUgY2FsbGJhY2tcbiAqIGZ1bmN0aW9ucy5cbiAqXG4gKiBAcGFyYW0gdGYgLSB0aGUgVEYgbWVzc2FnZSBmcm9tIHRoZSBzZXJ2ZXJcbiAqL1xuVEZDbGllbnQucHJvdG90eXBlLnByb2Nlc3NURkFycmF5ID0gZnVuY3Rpb24odGYpIHtcbiAgdmFyIHRoYXQgPSB0aGlzO1xuICB0Zi50cmFuc2Zvcm1zLmZvckVhY2goZnVuY3Rpb24odHJhbnNmb3JtKSB7XG4gICAgdmFyIGZyYW1lSUQgPSB0cmFuc2Zvcm0uY2hpbGRfZnJhbWVfaWQ7XG4gICAgaWYgKGZyYW1lSURbMF0gPT09ICcvJylcbiAgICB7XG4gICAgICBmcmFtZUlEID0gZnJhbWVJRC5zdWJzdHJpbmcoMSk7XG4gICAgfVxuICAgIHZhciBpbmZvID0gdGhpcy5mcmFtZUluZm9zW2ZyYW1lSURdO1xuICAgIGlmIChpbmZvKSB7XG4gICAgICBpbmZvLnRyYW5zZm9ybSA9IG5ldyBUcmFuc2Zvcm0oe1xuICAgICAgICB0cmFuc2xhdGlvbiA6IHRyYW5zZm9ybS50cmFuc2Zvcm0udHJhbnNsYXRpb24sXG4gICAgICAgIHJvdGF0aW9uIDogdHJhbnNmb3JtLnRyYW5zZm9ybS5yb3RhdGlvblxuICAgICAgfSk7XG4gICAgICBpbmZvLmNicy5mb3JFYWNoKGZ1bmN0aW9uKGNiKSB7XG4gICAgICAgIGNiKGluZm8udHJhbnNmb3JtKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSwgdGhpcyk7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhbmQgc2VuZCBhIG5ldyBnb2FsIChvciBzZXJ2aWNlIHJlcXVlc3QpIHRvIHRoZSB0ZjJfd2ViX3JlcHVibGlzaGVyXG4gKiBiYXNlZCBvbiB0aGUgY3VycmVudCBsaXN0IG9mIFRGcy5cbiAqL1xuVEZDbGllbnQucHJvdG90eXBlLnVwZGF0ZUdvYWwgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGdvYWxNZXNzYWdlID0ge1xuICAgIHNvdXJjZV9mcmFtZXMgOiBPYmplY3Qua2V5cyh0aGlzLmZyYW1lSW5mb3MpLFxuICAgIHRhcmdldF9mcmFtZSA6IHRoaXMuZml4ZWRGcmFtZSxcbiAgICBhbmd1bGFyX3RocmVzIDogdGhpcy5hbmd1bGFyVGhyZXMsXG4gICAgdHJhbnNfdGhyZXMgOiB0aGlzLnRyYW5zVGhyZXMsXG4gICAgcmF0ZSA6IHRoaXMucmF0ZVxuICB9O1xuXG4gIC8vIGlmIHdlJ3JlIHJ1bm5pbmcgaW4gZ3Jvb3Z5IGNvbXBhdGliaWxpdHkgbW9kZSAodGhlIGRlZmF1bHQpXG4gIC8vIHRoZW4gdXNlIHRoZSBhY3Rpb24gaW50ZXJmYWNlIHRvIHRmMl93ZWJfcmVwdWJsaXNoZXJcbiAgaWYodGhpcy5yb3MuZ3Jvb3Z5Q29tcGF0aWJpbGl0eSkge1xuICAgIGlmICh0aGlzLmN1cnJlbnRHb2FsKSB7XG4gICAgICB0aGlzLmN1cnJlbnRHb2FsLmNhbmNlbCgpO1xuICAgIH1cbiAgICB0aGlzLmN1cnJlbnRHb2FsID0gbmV3IEdvYWwoe1xuICAgICAgYWN0aW9uQ2xpZW50IDogdGhpcy5hY3Rpb25DbGllbnQsXG4gICAgICBnb2FsTWVzc2FnZSA6IGdvYWxNZXNzYWdlXG4gICAgfSk7XG5cbiAgICB0aGlzLmN1cnJlbnRHb2FsLm9uKCdmZWVkYmFjaycsIHRoaXMucHJvY2Vzc1RGQXJyYXkuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5jdXJyZW50R29hbC5zZW5kKCk7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gb3RoZXJ3aXNlLCB1c2UgdGhlIHNlcnZpY2UgaW50ZXJmYWNlXG4gICAgLy8gVGhlIHNlcnZpY2UgaW50ZXJmYWNlIGhhcyB0aGUgc2FtZSBwYXJhbWV0ZXJzIGFzIHRoZSBhY3Rpb24sXG4gICAgLy8gcGx1cyB0aGUgdGltZW91dFxuICAgIGdvYWxNZXNzYWdlLnRpbWVvdXQgPSB0aGlzLnRvcGljVGltZW91dDtcbiAgICB2YXIgcmVxdWVzdCA9IG5ldyBTZXJ2aWNlUmVxdWVzdChnb2FsTWVzc2FnZSk7XG5cbiAgICB0aGlzLnNlcnZpY2VDbGllbnQuY2FsbFNlcnZpY2UocmVxdWVzdCwgdGhpcy5wcm9jZXNzUmVzcG9uc2UuYmluZCh0aGlzKSk7XG4gIH1cblxuICB0aGlzLnJlcHVibGlzaGVyVXBkYXRlUmVxdWVzdGVkID0gZmFsc2U7XG59O1xuXG4vKipcbiAqIFByb2Nlc3MgdGhlIHNlcnZpY2UgcmVzcG9uc2UgYW5kIHN1YnNjcmliZSB0byB0aGUgdGYgcmVwdWJsaXNoZXJcbiAqIHRvcGljXG4gKlxuICogQHBhcmFtIHJlc3BvbnNlIHRoZSBzZXJ2aWNlIHJlc3BvbnNlIGNvbnRhaW5pbmcgdGhlIHRvcGljIG5hbWVcbiAqL1xuVEZDbGllbnQucHJvdG90eXBlLnByb2Nlc3NSZXNwb25zZSA9IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gIC8vIGlmIHdlIHN1YnNjcmliZWQgdG8gYSB0b3BpYyBiZWZvcmUsIHVuc3Vic2NyaWJlIHNvXG4gIC8vIHRoZSByZXB1Ymxpc2hlciBzdG9wcyBwdWJsaXNoaW5nIGl0XG4gIGlmICh0aGlzLmN1cnJlbnRUb3BpYykge1xuICAgIHRoaXMuY3VycmVudFRvcGljLnVuc3Vic2NyaWJlKCk7XG4gIH1cblxuICB0aGlzLmN1cnJlbnRUb3BpYyA9IHRoaXMucm9zLlRvcGljKHtcbiAgICBuYW1lOiByZXNwb25zZS50b3BpY19uYW1lLFxuICAgIG1lc3NhZ2VUeXBlOiAndGYyX3dlYl9yZXB1Ymxpc2hlci9URkFycmF5J1xuICB9KTtcbiAgdGhpcy5jdXJyZW50VG9waWMuc3Vic2NyaWJlKHRoaXMucHJvY2Vzc1RGQXJyYXkuYmluZCh0aGlzKSk7XG59O1xuXG4vKipcbiAqIFN1YnNjcmliZSB0byB0aGUgZ2l2ZW4gVEYgZnJhbWUuXG4gKlxuICogQHBhcmFtIGZyYW1lSUQgLSB0aGUgVEYgZnJhbWUgdG8gc3Vic2NyaWJlIHRvXG4gKiBAcGFyYW0gY2FsbGJhY2sgLSBmdW5jdGlvbiB3aXRoIHBhcmFtczpcbiAqICAgKiB0cmFuc2Zvcm0gLSB0aGUgdHJhbnNmb3JtIGRhdGFcbiAqL1xuVEZDbGllbnQucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uKGZyYW1lSUQsIGNhbGxiYWNrKSB7XG4gIC8vIHJlbW92ZSBsZWFkaW5nIHNsYXNoLCBpZiBpdCdzIHRoZXJlXG4gIGlmIChmcmFtZUlEWzBdID09PSAnLycpXG4gIHtcbiAgICBmcmFtZUlEID0gZnJhbWVJRC5zdWJzdHJpbmcoMSk7XG4gIH1cbiAgLy8gaWYgdGhlcmUgaXMgbm8gY2FsbGJhY2sgcmVnaXN0ZXJlZCBmb3IgdGhlIGdpdmVuIGZyYW1lLCBjcmVhdGUgZW10cHkgY2FsbGJhY2sgbGlzdFxuICBpZiAoIXRoaXMuZnJhbWVJbmZvc1tmcmFtZUlEXSkge1xuICAgIHRoaXMuZnJhbWVJbmZvc1tmcmFtZUlEXSA9IHtcbiAgICAgIGNiczogW11cbiAgICB9O1xuICAgIGlmICghdGhpcy5yZXB1Ymxpc2hlclVwZGF0ZVJlcXVlc3RlZCkge1xuICAgICAgc2V0VGltZW91dCh0aGlzLnVwZGF0ZUdvYWwuYmluZCh0aGlzKSwgdGhpcy51cGRhdGVEZWxheSk7XG4gICAgICB0aGlzLnJlcHVibGlzaGVyVXBkYXRlUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgLy8gaWYgd2UgYWxyZWFkeSBoYXZlIGEgdHJhbnNmb3JtLCBjYWxsIGJhY2sgaW1tZWRpYXRlbHlcbiAgZWxzZSBpZiAodGhpcy5mcmFtZUluZm9zW2ZyYW1lSURdLnRyYW5zZm9ybSkge1xuICAgIGNhbGxiYWNrKHRoaXMuZnJhbWVJbmZvc1tmcmFtZUlEXS50cmFuc2Zvcm0pO1xuICB9XG4gIHRoaXMuZnJhbWVJbmZvc1tmcmFtZUlEXS5jYnMucHVzaChjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIFVuc3Vic2NyaWJlIGZyb20gdGhlIGdpdmVuIFRGIGZyYW1lLlxuICpcbiAqIEBwYXJhbSBmcmFtZUlEIC0gdGhlIFRGIGZyYW1lIHRvIHVuc3Vic2NyaWJlIGZyb21cbiAqIEBwYXJhbSBjYWxsYmFjayAtIHRoZSBjYWxsYmFjayBmdW5jdGlvbiB0byByZW1vdmVcbiAqL1xuVEZDbGllbnQucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24oZnJhbWVJRCwgY2FsbGJhY2spIHtcbiAgLy8gcmVtb3ZlIGxlYWRpbmcgc2xhc2gsIGlmIGl0J3MgdGhlcmVcbiAgaWYgKGZyYW1lSURbMF0gPT09ICcvJylcbiAge1xuICAgIGZyYW1lSUQgPSBmcmFtZUlELnN1YnN0cmluZygxKTtcbiAgfVxuICB2YXIgaW5mbyA9IHRoaXMuZnJhbWVJbmZvc1tmcmFtZUlEXTtcbiAgZm9yICh2YXIgY2JzID0gaW5mbyAmJiBpbmZvLmNicyB8fCBbXSwgaWR4ID0gY2JzLmxlbmd0aDsgaWR4LS07KSB7XG4gICAgaWYgKGNic1tpZHhdID09PSBjYWxsYmFjaykge1xuICAgICAgY2JzLnNwbGljZShpZHgsIDEpO1xuICAgIH1cbiAgfVxuICBpZiAoIWNhbGxiYWNrIHx8IGNicy5sZW5ndGggPT09IDApIHtcbiAgICBkZWxldGUgdGhpcy5mcmFtZUluZm9zW2ZyYW1lSURdO1xuICB9XG59O1xuXG4vKipcbiAqIFVuc3Vic2NyaWJlIGFuZCB1bmFkdmVydGlzZSBhbGwgdG9waWNzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIFRGQ2xpZW50LlxuICovXG5URkNsaWVudC5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmFjdGlvbkNsaWVudC5kaXNwb3NlKCk7XG4gIGlmICh0aGlzLmN1cnJlbnRUb3BpYykge1xuICAgIHRoaXMuY3VycmVudFRvcGljLnVuc3Vic2NyaWJlKCk7XG4gIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVEZDbGllbnQ7XG4iLCJ2YXIgUm9zID0gcmVxdWlyZSgnLi4vY29yZS9Sb3MnKTtcbnZhciBtaXhpbiA9IHJlcXVpcmUoJy4uL21peGluJyk7XG5cbnZhciB0ZiA9IG1vZHVsZS5leHBvcnRzID0ge1xuICAgIFRGQ2xpZW50OiByZXF1aXJlKCcuL1RGQ2xpZW50Jylcbn07XG5cbm1peGluKFJvcywgWydURkNsaWVudCddLCB0Zik7IiwiLyoqXG4gKiBAZmlsZU92ZXJ2aWV3IFxuICogQGF1dGhvciBCZW5qYW1pbiBQaXR6ZXIgLSBiZW4ucGl0emVyQGdtYWlsLmNvbVxuICogQGF1dGhvciBSdXNzZWxsIFRvcmlzIC0gcmN0b3Jpc0B3cGkuZWR1XG4gKi9cblxudmFyIFZlY3RvcjMgPSByZXF1aXJlKCcuLi9tYXRoL1ZlY3RvcjMnKTtcbnZhciBVcmRmVHlwZXMgPSByZXF1aXJlKCcuL1VyZGZUeXBlcycpO1xuXG4vKipcbiAqIEEgQm94IGVsZW1lbnQgaW4gYSBVUkRGLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG9wdGlvbnMgLSBvYmplY3Qgd2l0aCBmb2xsb3dpbmcga2V5czpcbiAqICAqIHhtbCAtIHRoZSBYTUwgZWxlbWVudCB0byBwYXJzZVxuICovXG5mdW5jdGlvbiBVcmRmQm94KG9wdGlvbnMpIHtcbiAgdGhpcy5kaW1lbnNpb24gPSBudWxsO1xuICB0aGlzLnR5cGUgPSBVcmRmVHlwZXMuVVJERl9CT1g7XG5cbiAgLy8gUGFyc2UgdGhlIHhtbCBzdHJpbmdcbiAgdmFyIHh5eiA9IG9wdGlvbnMueG1sLmdldEF0dHJpYnV0ZSgnc2l6ZScpLnNwbGl0KCcgJyk7XG4gIHRoaXMuZGltZW5zaW9uID0gbmV3IFZlY3RvcjMoe1xuICAgIHggOiBwYXJzZUZsb2F0KHh5elswXSksXG4gICAgeSA6IHBhcnNlRmxvYXQoeHl6WzFdKSxcbiAgICB6IDogcGFyc2VGbG9hdCh4eXpbMl0pXG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVyZGZCb3g7IiwiLyoqXG4gKiBAZmlsZU92ZXJ2aWV3IFxuICogQGF1dGhvciBCZW5qYW1pbiBQaXR6ZXIgLSBiZW4ucGl0emVyQGdtYWlsLmNvbVxuICogQGF1dGhvciBSdXNzZWxsIFRvcmlzIC0gcmN0b3Jpc0B3cGkuZWR1XG4gKi9cblxuLyoqXG4gKiBBIENvbG9yIGVsZW1lbnQgaW4gYSBVUkRGLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG9wdGlvbnMgLSBvYmplY3Qgd2l0aCBmb2xsb3dpbmcga2V5czpcbiAqICAqIHhtbCAtIHRoZSBYTUwgZWxlbWVudCB0byBwYXJzZVxuICovXG5mdW5jdGlvbiBVcmRmQ29sb3Iob3B0aW9ucykge1xuICAvLyBQYXJzZSB0aGUgeG1sIHN0cmluZ1xuICB2YXIgcmdiYSA9IG9wdGlvbnMueG1sLmdldEF0dHJpYnV0ZSgncmdiYScpLnNwbGl0KCcgJyk7XG4gIHRoaXMuciA9IHBhcnNlRmxvYXQocmdiYVswXSk7XG4gIHRoaXMuZyA9IHBhcnNlRmxvYXQocmdiYVsxXSk7XG4gIHRoaXMuYiA9IHBhcnNlRmxvYXQocmdiYVsyXSk7XG4gIHRoaXMuYSA9IHBhcnNlRmxvYXQocmdiYVszXSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVXJkZkNvbG9yOyIsIi8qKlxuICogQGZpbGVPdmVydmlldyBcbiAqIEBhdXRob3IgQmVuamFtaW4gUGl0emVyIC0gYmVuLnBpdHplckBnbWFpbC5jb21cbiAqIEBhdXRob3IgUnVzc2VsbCBUb3JpcyAtIHJjdG9yaXNAd3BpLmVkdVxuICovXG5cbnZhciBVcmRmVHlwZXMgPSByZXF1aXJlKCcuL1VyZGZUeXBlcycpO1xuXG4vKipcbiAqIEEgQ3lsaW5kZXIgZWxlbWVudCBpbiBhIFVSREYuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gb3B0aW9ucyAtIG9iamVjdCB3aXRoIGZvbGxvd2luZyBrZXlzOlxuICogICogeG1sIC0gdGhlIFhNTCBlbGVtZW50IHRvIHBhcnNlXG4gKi9cbmZ1bmN0aW9uIFVyZGZDeWxpbmRlcihvcHRpb25zKSB7XG4gIHRoaXMudHlwZSA9IFVyZGZUeXBlcy5VUkRGX0NZTElOREVSO1xuICB0aGlzLmxlbmd0aCA9IHBhcnNlRmxvYXQob3B0aW9ucy54bWwuZ2V0QXR0cmlidXRlKCdsZW5ndGgnKSk7XG4gIHRoaXMucmFkaXVzID0gcGFyc2VGbG9hdChvcHRpb25zLnhtbC5nZXRBdHRyaWJ1dGUoJ3JhZGl1cycpKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBVcmRmQ3lsaW5kZXI7IiwiLyoqXG4gKiBAZmlsZU92ZXJ2aWV3XG4gKiBAYXV0aG9yIERhdmlkIFYuIEx1ISEgIGRhdmlkdmx1QGdtYWlsLmNvbVxuICovXG5cbi8qKlxuICogQSBKb2ludCBlbGVtZW50IGluIGEgVVJERi5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvcHRpb25zIC0gb2JqZWN0IHdpdGggZm9sbG93aW5nIGtleXM6XG4gKiAgKiB4bWwgLSB0aGUgWE1MIGVsZW1lbnQgdG8gcGFyc2VcbiAqL1xuZnVuY3Rpb24gVXJkZkpvaW50KG9wdGlvbnMpIHtcbiAgdGhpcy5uYW1lID0gb3B0aW9ucy54bWwuZ2V0QXR0cmlidXRlKCduYW1lJyk7XG4gIHRoaXMudHlwZSA9IG9wdGlvbnMueG1sLmdldEF0dHJpYnV0ZSgndHlwZScpO1xuXG4gIHZhciBwYXJlbnRzID0gb3B0aW9ucy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3BhcmVudCcpO1xuICBpZihwYXJlbnRzLmxlbmd0aCA+IDApIHtcbiAgICB0aGlzLnBhcmVudCA9IHBhcmVudHNbMF0uZ2V0QXR0cmlidXRlKCdsaW5rJyk7XG4gIH1cblxuICB2YXIgY2hpbGRyZW4gPSBvcHRpb25zLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY2hpbGQnKTtcbiAgaWYoY2hpbGRyZW4ubGVuZ3RoID4gMCkge1xuICAgIHRoaXMuY2hpbGQgPSBjaGlsZHJlblswXS5nZXRBdHRyaWJ1dGUoJ2xpbmsnKTtcbiAgfVxuXG4gIHZhciBsaW1pdHMgPSBvcHRpb25zLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbGltaXQnKTtcbiAgaWYgKGxpbWl0cy5sZW5ndGggPiAwKSB7XG4gICAgdGhpcy5taW52YWwgPSBwYXJzZUZsb2F0KCBsaW1pdHNbMF0uZ2V0QXR0cmlidXRlKCdsb3dlcicpICk7XG4gICAgdGhpcy5tYXh2YWwgPSBwYXJzZUZsb2F0KCBsaW1pdHNbMF0uZ2V0QXR0cmlidXRlKCd1cHBlcicpICk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBVcmRmSm9pbnQ7XG4iLCIvKipcbiAqIEBmaWxlT3ZlcnZpZXcgXG4gKiBAYXV0aG9yIEJlbmphbWluIFBpdHplciAtIGJlbi5waXR6ZXJAZ21haWwuY29tXG4gKiBAYXV0aG9yIFJ1c3NlbGwgVG9yaXMgLSByY3RvcmlzQHdwaS5lZHVcbiAqL1xuXG52YXIgVXJkZlZpc3VhbCA9IHJlcXVpcmUoJy4vVXJkZlZpc3VhbCcpO1xuXG4vKipcbiAqIEEgTGluayBlbGVtZW50IGluIGEgVVJERi5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvcHRpb25zIC0gb2JqZWN0IHdpdGggZm9sbG93aW5nIGtleXM6XG4gKiAgKiB4bWwgLSB0aGUgWE1MIGVsZW1lbnQgdG8gcGFyc2VcbiAqL1xuZnVuY3Rpb24gVXJkZkxpbmsob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSBvcHRpb25zLnhtbC5nZXRBdHRyaWJ1dGUoJ25hbWUnKTtcbiAgdGhpcy52aXN1YWxzID0gW107XG4gIHZhciB2aXN1YWxzID0gb3B0aW9ucy54bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3Zpc3VhbCcpO1xuXG4gIGZvciggdmFyIGk9MDsgaTx2aXN1YWxzLmxlbmd0aDsgaSsrICkge1xuICAgIHRoaXMudmlzdWFscy5wdXNoKCBuZXcgVXJkZlZpc3VhbCh7XG4gICAgICB4bWwgOiB2aXN1YWxzW2ldXG4gICAgfSkgKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVyZGZMaW5rOyIsIi8qKlxuICogQGZpbGVPdmVydmlldyBcbiAqIEBhdXRob3IgQmVuamFtaW4gUGl0emVyIC0gYmVuLnBpdHplckBnbWFpbC5jb21cbiAqIEBhdXRob3IgUnVzc2VsbCBUb3JpcyAtIHJjdG9yaXNAd3BpLmVkdVxuICovXG5cbnZhciBVcmRmQ29sb3IgPSByZXF1aXJlKCcuL1VyZGZDb2xvcicpO1xuXG4vKipcbiAqIEEgTWF0ZXJpYWwgZWxlbWVudCBpbiBhIFVSREYuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0gb3B0aW9ucyAtIG9iamVjdCB3aXRoIGZvbGxvd2luZyBrZXlzOlxuICogICogeG1sIC0gdGhlIFhNTCBlbGVtZW50IHRvIHBhcnNlXG4gKi9cbmZ1bmN0aW9uIFVyZGZNYXRlcmlhbChvcHRpb25zKSB7XG4gIHRoaXMudGV4dHVyZUZpbGVuYW1lID0gbnVsbDtcbiAgdGhpcy5jb2xvciA9IG51bGw7XG5cbiAgdGhpcy5uYW1lID0gb3B0aW9ucy54bWwuZ2V0QXR0cmlidXRlKCduYW1lJyk7XG5cbiAgLy8gVGV4dHVyZVxuICB2YXIgdGV4dHVyZXMgPSBvcHRpb25zLnhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgndGV4dHVyZScpO1xuICBpZiAodGV4dHVyZXMubGVuZ3RoID4gMCkge1xuICAgIHRoaXMudGV4dHVyZUZpbGVuYW1lID0gdGV4dHVyZXNbMF0uZ2V0QXR0cmlidXRlKCdmaWxlbmFtZScpO1xuICB9XG5cbiAgLy8gQ29sb3JcbiAgdmFyIGNvbG9ycyA9IG9wdGlvbnMueG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjb2xvcicpO1xuICBpZiAoY29sb3JzLmxlbmd0aCA+IDApIHtcbiAgICAvLyBQYXJzZSB0aGUgUkJHQSBzdHJpbmdcbiAgICB0aGlzLmNvbG9yID0gbmV3IFVyZGZDb2xvcih7XG4gICAgICB4bWwgOiBjb2xvcnNbMF1cbiAgICB9KTtcbiAgfVxufVxuXG5VcmRmTWF0ZXJpYWwucHJvdG90eXBlLmlzTGluayA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5jb2xvciA9PT0gbnVsbCAmJiB0aGlzLnRleHR1cmVGaWxlbmFtZSA9PT0gbnVsbDtcbn07XG5cbnZhciBhc3NpZ24gPSByZXF1aXJlKCdvYmplY3QtYXNzaWduJyk7XG5cblVyZGZNYXRlcmlhbC5wcm90b3R5cGUuYXNzaWduID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgcmV0dXJuIGFzc2lnbih0aGlzLCBvYmopO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBVcmRmTWF0ZXJpYWw7XG4iLCIvKipcbiAqIEBmaWxlT3ZlcnZpZXcgXG4gKiBAYXV0aG9yIEJlbmphbWluIFBpdHplciAtIGJlbi5waXR6ZXJAZ21haWwuY29tXG4gKiBAYXV0aG9yIFJ1c3NlbGwgVG9yaXMgLSByY3RvcmlzQHdwaS5lZHVcbiAqL1xuXG52YXIgVmVjdG9yMyA9IHJlcXVpcmUoJy4uL21hdGgvVmVjdG9yMycpO1xudmFyIFVyZGZUeXBlcyA9IHJlcXVpcmUoJy4vVXJkZlR5cGVzJyk7XG5cbi8qKlxuICogQSBNZXNoIGVsZW1lbnQgaW4gYSBVUkRGLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG9wdGlvbnMgLSBvYmplY3Qgd2l0aCBmb2xsb3dpbmcga2V5czpcbiAqICAqIHhtbCAtIHRoZSBYTUwgZWxlbWVudCB0byBwYXJzZVxuICovXG5mdW5jdGlvbiBVcmRmTWVzaChvcHRpb25zKSB7XG4gIHRoaXMuc2NhbGUgPSBudWxsO1xuXG4gIHRoaXMudHlwZSA9IFVyZGZUeXBlcy5VUkRGX01FU0g7XG4gIHRoaXMuZmlsZW5hbWUgPSBvcHRpb25zLnhtbC5nZXRBdHRyaWJ1dGUoJ2ZpbGVuYW1lJyk7XG5cbiAgLy8gQ2hlY2sgZm9yIGEgc2NhbGVcbiAgdmFyIHNjYWxlID0gb3B0aW9ucy54bWwuZ2V0QXR0cmlidXRlKCdzY2FsZScpO1xuICBpZiAoc2NhbGUpIHtcbiAgICAvLyBHZXQgdGhlIFhZWlxuICAgIHZhciB4eXogPSBzY2FsZS5zcGxpdCgnICcpO1xuICAgIHRoaXMuc2NhbGUgPSBuZXcgVmVjdG9yMyh7XG4gICAgICB4IDogcGFyc2VGbG9hdCh4eXpbMF0pLFxuICAgICAgeSA6IHBhcnNlRmxvYXQoeHl6WzFdKSxcbiAgICAgIHogOiBwYXJzZUZsb2F0KHh5elsyXSlcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVyZGZNZXNoOyIsIi8qKlxuICogQGZpbGVPdmVydmlldyBcbiAqIEBhdXRob3IgQmVuamFtaW4gUGl0emVyIC0gYmVuLnBpdHplckBnbWFpbC5jb21cbiAqIEBhdXRob3IgUnVzc2VsbCBUb3JpcyAtIHJjdG9yaXNAd3BpLmVkdVxuICovXG5cbnZhciBVcmRmTWF0ZXJpYWwgPSByZXF1aXJlKCcuL1VyZGZNYXRlcmlhbCcpO1xudmFyIFVyZGZMaW5rID0gcmVxdWlyZSgnLi9VcmRmTGluaycpO1xudmFyIFVyZGZKb2ludCA9IHJlcXVpcmUoJy4vVXJkZkpvaW50Jyk7XG52YXIgRE9NUGFyc2VyID0gcmVxdWlyZSgneG1sZG9tJykuRE9NUGFyc2VyO1xuXG4vLyBTZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZG9jcy9YUGF0aFJlc3VsdCNDb25zdGFudHNcbnZhciBYUEFUSF9GSVJTVF9PUkRFUkVEX05PREVfVFlQRSA9IDk7XG5cbi8qKlxuICogQSBVUkRGIE1vZGVsIGNhbiBiZSB1c2VkIHRvIHBhcnNlIGEgZ2l2ZW4gVVJERiBpbnRvIHRoZSBhcHByb3ByaWF0ZSBlbGVtZW50cy5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvcHRpb25zIC0gb2JqZWN0IHdpdGggZm9sbG93aW5nIGtleXM6XG4gKiAgKiB4bWwgLSB0aGUgWE1MIGVsZW1lbnQgdG8gcGFyc2VcbiAqICAqIHN0cmluZyAtIHRoZSBYTUwgZWxlbWVudCB0byBwYXJzZSBhcyBhIHN0cmluZ1xuICovXG5mdW5jdGlvbiBVcmRmTW9kZWwob3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdmFyIHhtbERvYyA9IG9wdGlvbnMueG1sO1xuICB2YXIgc3RyaW5nID0gb3B0aW9ucy5zdHJpbmc7XG4gIHRoaXMubWF0ZXJpYWxzID0ge307XG4gIHRoaXMubGlua3MgPSB7fTtcbiAgdGhpcy5qb2ludHMgPSB7fTtcblxuICAvLyBDaGVjayBpZiB3ZSBhcmUgdXNpbmcgYSBzdHJpbmcgb3IgYW4gWE1MIGVsZW1lbnRcbiAgaWYgKHN0cmluZykge1xuICAgIC8vIFBhcnNlIHRoZSBzdHJpbmdcbiAgICB2YXIgcGFyc2VyID0gbmV3IERPTVBhcnNlcigpO1xuICAgIHhtbERvYyA9IHBhcnNlci5wYXJzZUZyb21TdHJpbmcoc3RyaW5nLCAndGV4dC94bWwnKTtcbiAgfVxuXG4gIC8vIEluaXRpYWxpemUgdGhlIG1vZGVsIHdpdGggdGhlIGdpdmVuIFhNTCBub2RlLlxuICAvLyBHZXQgdGhlIHJvYm90IHRhZ1xuICB2YXIgcm9ib3RYbWwgPSB4bWxEb2MuZG9jdW1lbnRFbGVtZW50O1xuXG4gIC8vIEdldCB0aGUgcm9ib3QgbmFtZVxuICB0aGlzLm5hbWUgPSByb2JvdFhtbC5nZXRBdHRyaWJ1dGUoJ25hbWUnKTtcblxuICAvLyBQYXJzZSBhbGwgdGhlIHZpc3VhbCBlbGVtZW50cyB3ZSBuZWVkXG4gIGZvciAodmFyIG5vZGVzID0gcm9ib3RYbWwuY2hpbGROb2RlcywgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBub2RlID0gbm9kZXNbaV07XG4gICAgaWYgKG5vZGUudGFnTmFtZSA9PT0gJ21hdGVyaWFsJykge1xuICAgICAgdmFyIG1hdGVyaWFsID0gbmV3IFVyZGZNYXRlcmlhbCh7XG4gICAgICAgIHhtbCA6IG5vZGVcbiAgICAgIH0pO1xuICAgICAgLy8gTWFrZSBzdXJlIHRoaXMgaXMgdW5pcXVlXG4gICAgICBpZiAodGhpcy5tYXRlcmlhbHNbbWF0ZXJpYWwubmFtZV0gIT09IHZvaWQgMCkge1xuICAgICAgICBpZiggdGhpcy5tYXRlcmlhbHNbbWF0ZXJpYWwubmFtZV0uaXNMaW5rKCkgKSB7XG4gICAgICAgICAgdGhpcy5tYXRlcmlhbHNbbWF0ZXJpYWwubmFtZV0uYXNzaWduKCBtYXRlcmlhbCApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUud2FybignTWF0ZXJpYWwgJyArIG1hdGVyaWFsLm5hbWUgKyAnaXMgbm90IHVuaXF1ZS4nKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tYXRlcmlhbHNbbWF0ZXJpYWwubmFtZV0gPSBtYXRlcmlhbDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5vZGUudGFnTmFtZSA9PT0gJ2xpbmsnKSB7XG4gICAgICB2YXIgbGluayA9IG5ldyBVcmRmTGluayh7XG4gICAgICAgIHhtbCA6IG5vZGVcbiAgICAgIH0pO1xuICAgICAgLy8gTWFrZSBzdXJlIHRoaXMgaXMgdW5pcXVlXG4gICAgICBpZiAodGhpcy5saW5rc1tsaW5rLm5hbWVdICE9PSB2b2lkIDApIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdMaW5rICcgKyBsaW5rLm5hbWUgKyAnIGlzIG5vdCB1bmlxdWUuJyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBDaGVjayBmb3IgYSBtYXRlcmlhbFxuICAgICAgICBmb3IoIHZhciBqPTA7IGo8bGluay52aXN1YWxzLmxlbmd0aDsgaisrIClcbiAgICAgICAge1xuICAgICAgICAgIHZhciBtYXQgPSBsaW5rLnZpc3VhbHNbal0ubWF0ZXJpYWw7IFxuICAgICAgICAgIGlmICggbWF0ICE9PSBudWxsICkge1xuICAgICAgICAgICAgaWYgKHRoaXMubWF0ZXJpYWxzW21hdC5uYW1lXSAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgIGxpbmsudmlzdWFsc1tqXS5tYXRlcmlhbCA9IHRoaXMubWF0ZXJpYWxzW21hdC5uYW1lXTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMubWF0ZXJpYWxzW21hdC5uYW1lXSA9IG1hdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgdGhlIGxpbmtcbiAgICAgICAgdGhpcy5saW5rc1tsaW5rLm5hbWVdID0gbGluaztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5vZGUudGFnTmFtZSA9PT0gJ2pvaW50Jykge1xuICAgICAgdmFyIGpvaW50ID0gbmV3IFVyZGZKb2ludCh7XG4gICAgICAgIHhtbCA6IG5vZGVcbiAgICAgIH0pO1xuICAgICAgdGhpcy5qb2ludHNbam9pbnQubmFtZV0gPSBqb2ludDtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBVcmRmTW9kZWw7XG4iLCIvKipcbiAqIEBmaWxlT3ZlcnZpZXcgXG4gKiBAYXV0aG9yIEJlbmphbWluIFBpdHplciAtIGJlbi5waXR6ZXJAZ21haWwuY29tXG4gKiBAYXV0aG9yIFJ1c3NlbGwgVG9yaXMgLSByY3RvcmlzQHdwaS5lZHVcbiAqL1xuXG52YXIgVXJkZlR5cGVzID0gcmVxdWlyZSgnLi9VcmRmVHlwZXMnKTtcblxuLyoqXG4gKiBBIFNwaGVyZSBlbGVtZW50IGluIGEgVVJERi5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSBvcHRpb25zIC0gb2JqZWN0IHdpdGggZm9sbG93aW5nIGtleXM6XG4gKiAgKiB4bWwgLSB0aGUgWE1MIGVsZW1lbnQgdG8gcGFyc2VcbiAqL1xuZnVuY3Rpb24gVXJkZlNwaGVyZShvcHRpb25zKSB7XG4gIHRoaXMudHlwZSA9IFVyZGZUeXBlcy5VUkRGX1NQSEVSRTtcbiAgdGhpcy5yYWRpdXMgPSBwYXJzZUZsb2F0KG9wdGlvbnMueG1sLmdldEF0dHJpYnV0ZSgncmFkaXVzJykpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFVyZGZTcGhlcmU7IiwibW9kdWxlLmV4cG9ydHMgPSB7XG5cdFVSREZfU1BIRVJFIDogMCxcblx0VVJERl9CT1ggOiAxLFxuXHRVUkRGX0NZTElOREVSIDogMixcblx0VVJERl9NRVNIIDogM1xufTtcbiIsIi8qKlxuICogQGZpbGVPdmVydmlldyBcbiAqIEBhdXRob3IgQmVuamFtaW4gUGl0emVyIC0gYmVuLnBpdHplckBnbWFpbC5jb21cbiAqIEBhdXRob3IgUnVzc2VsbCBUb3JpcyAtIHJjdG9yaXNAd3BpLmVkdVxuICovXG5cbnZhciBQb3NlID0gcmVxdWlyZSgnLi4vbWF0aC9Qb3NlJyk7XG52YXIgVmVjdG9yMyA9IHJlcXVpcmUoJy4uL21hdGgvVmVjdG9yMycpO1xudmFyIFF1YXRlcm5pb24gPSByZXF1aXJlKCcuLi9tYXRoL1F1YXRlcm5pb24nKTtcblxudmFyIFVyZGZDeWxpbmRlciA9IHJlcXVpcmUoJy4vVXJkZkN5bGluZGVyJyk7XG52YXIgVXJkZkJveCA9IHJlcXVpcmUoJy4vVXJkZkJveCcpO1xudmFyIFVyZGZNYXRlcmlhbCA9IHJlcXVpcmUoJy4vVXJkZk1hdGVyaWFsJyk7XG52YXIgVXJkZk1lc2ggPSByZXF1aXJlKCcuL1VyZGZNZXNoJyk7XG52YXIgVXJkZlNwaGVyZSA9IHJlcXVpcmUoJy4vVXJkZlNwaGVyZScpO1xuXG4vKipcbiAqIEEgVmlzdWFsIGVsZW1lbnQgaW4gYSBVUkRGLlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIG9wdGlvbnMgLSBvYmplY3Qgd2l0aCBmb2xsb3dpbmcga2V5czpcbiAqICAqIHhtbCAtIHRoZSBYTUwgZWxlbWVudCB0byBwYXJzZVxuICovXG5mdW5jdGlvbiBVcmRmVmlzdWFsKG9wdGlvbnMpIHtcbiAgdmFyIHhtbCA9IG9wdGlvbnMueG1sO1xuICB0aGlzLm9yaWdpbiA9IG51bGw7XG4gIHRoaXMuZ2VvbWV0cnkgPSBudWxsO1xuICB0aGlzLm1hdGVyaWFsID0gbnVsbDtcblxuICAvLyBPcmlnaW5cbiAgdmFyIG9yaWdpbnMgPSB4bWwuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ29yaWdpbicpO1xuICBpZiAob3JpZ2lucy5sZW5ndGggPT09IDApIHtcbiAgICAvLyB1c2UgdGhlIGlkZW50aXR5IGFzIHRoZSBkZWZhdWx0XG4gICAgdGhpcy5vcmlnaW4gPSBuZXcgUG9zZSgpO1xuICB9IGVsc2Uge1xuICAgIC8vIENoZWNrIHRoZSBYWVpcbiAgICB2YXIgeHl6ID0gb3JpZ2luc1swXS5nZXRBdHRyaWJ1dGUoJ3h5eicpO1xuICAgIHZhciBwb3NpdGlvbiA9IG5ldyBWZWN0b3IzKCk7XG4gICAgaWYgKHh5eikge1xuICAgICAgeHl6ID0geHl6LnNwbGl0KCcgJyk7XG4gICAgICBwb3NpdGlvbiA9IG5ldyBWZWN0b3IzKHtcbiAgICAgICAgeCA6IHBhcnNlRmxvYXQoeHl6WzBdKSxcbiAgICAgICAgeSA6IHBhcnNlRmxvYXQoeHl6WzFdKSxcbiAgICAgICAgeiA6IHBhcnNlRmxvYXQoeHl6WzJdKVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgdGhlIFJQWVxuICAgIHZhciBycHkgPSBvcmlnaW5zWzBdLmdldEF0dHJpYnV0ZSgncnB5Jyk7XG4gICAgdmFyIG9yaWVudGF0aW9uID0gbmV3IFF1YXRlcm5pb24oKTtcbiAgICBpZiAocnB5KSB7XG4gICAgICBycHkgPSBycHkuc3BsaXQoJyAnKTtcbiAgICAgIC8vIENvbnZlcnQgZnJvbSBSUFlcbiAgICAgIHZhciByb2xsID0gcGFyc2VGbG9hdChycHlbMF0pO1xuICAgICAgdmFyIHBpdGNoID0gcGFyc2VGbG9hdChycHlbMV0pO1xuICAgICAgdmFyIHlhdyA9IHBhcnNlRmxvYXQocnB5WzJdKTtcbiAgICAgIHZhciBwaGkgPSByb2xsIC8gMi4wO1xuICAgICAgdmFyIHRoZSA9IHBpdGNoIC8gMi4wO1xuICAgICAgdmFyIHBzaSA9IHlhdyAvIDIuMDtcbiAgICAgIHZhciB4ID0gTWF0aC5zaW4ocGhpKSAqIE1hdGguY29zKHRoZSkgKiBNYXRoLmNvcyhwc2kpIC0gTWF0aC5jb3MocGhpKSAqIE1hdGguc2luKHRoZSlcbiAgICAgICAgICAqIE1hdGguc2luKHBzaSk7XG4gICAgICB2YXIgeSA9IE1hdGguY29zKHBoaSkgKiBNYXRoLnNpbih0aGUpICogTWF0aC5jb3MocHNpKSArIE1hdGguc2luKHBoaSkgKiBNYXRoLmNvcyh0aGUpXG4gICAgICAgICAgKiBNYXRoLnNpbihwc2kpO1xuICAgICAgdmFyIHogPSBNYXRoLmNvcyhwaGkpICogTWF0aC5jb3ModGhlKSAqIE1hdGguc2luKHBzaSkgLSBNYXRoLnNpbihwaGkpICogTWF0aC5zaW4odGhlKVxuICAgICAgICAgICogTWF0aC5jb3MocHNpKTtcbiAgICAgIHZhciB3ID0gTWF0aC5jb3MocGhpKSAqIE1hdGguY29zKHRoZSkgKiBNYXRoLmNvcyhwc2kpICsgTWF0aC5zaW4ocGhpKSAqIE1hdGguc2luKHRoZSlcbiAgICAgICAgICAqIE1hdGguc2luKHBzaSk7XG5cbiAgICAgIG9yaWVudGF0aW9uID0gbmV3IFF1YXRlcm5pb24oe1xuICAgICAgICB4IDogeCxcbiAgICAgICAgeSA6IHksXG4gICAgICAgIHogOiB6LFxuICAgICAgICB3IDogd1xuICAgICAgfSk7XG4gICAgICBvcmllbnRhdGlvbi5ub3JtYWxpemUoKTtcbiAgICB9XG4gICAgdGhpcy5vcmlnaW4gPSBuZXcgUG9zZSh7XG4gICAgICBwb3NpdGlvbiA6IHBvc2l0aW9uLFxuICAgICAgb3JpZW50YXRpb24gOiBvcmllbnRhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgLy8gR2VvbWV0cnlcbiAgdmFyIGdlb21zID0geG1sLmdldEVsZW1lbnRzQnlUYWdOYW1lKCdnZW9tZXRyeScpO1xuICBpZiAoZ2VvbXMubGVuZ3RoID4gMCkge1xuICAgIHZhciBnZW9tID0gZ2VvbXNbMF07XG4gICAgdmFyIHNoYXBlID0gbnVsbDtcbiAgICAvLyBDaGVjayBmb3IgdGhlIHNoYXBlXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBnZW9tLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBub2RlID0gZ2VvbS5jaGlsZE5vZGVzW2ldO1xuICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgc2hhcGUgPSBub2RlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gQ2hlY2sgdGhlIHR5cGVcbiAgICB2YXIgdHlwZSA9IHNoYXBlLm5vZGVOYW1lO1xuICAgIGlmICh0eXBlID09PSAnc3BoZXJlJykge1xuICAgICAgdGhpcy5nZW9tZXRyeSA9IG5ldyBVcmRmU3BoZXJlKHtcbiAgICAgICAgeG1sIDogc2hhcGVcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2JveCcpIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnkgPSBuZXcgVXJkZkJveCh7XG4gICAgICAgIHhtbCA6IHNoYXBlXG4gICAgICB9KTtcbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdjeWxpbmRlcicpIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnkgPSBuZXcgVXJkZkN5bGluZGVyKHtcbiAgICAgICAgeG1sIDogc2hhcGVcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ21lc2gnKSB7XG4gICAgICB0aGlzLmdlb21ldHJ5ID0gbmV3IFVyZGZNZXNoKHtcbiAgICAgICAgeG1sIDogc2hhcGVcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1Vua25vd24gZ2VvbWV0cnkgdHlwZSAnICsgdHlwZSk7XG4gICAgfVxuICB9XG5cbiAgLy8gTWF0ZXJpYWxcbiAgdmFyIG1hdGVyaWFscyA9IHhtbC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnbWF0ZXJpYWwnKTtcbiAgaWYgKG1hdGVyaWFscy5sZW5ndGggPiAwKSB7XG4gICAgdGhpcy5tYXRlcmlhbCA9IG5ldyBVcmRmTWF0ZXJpYWwoe1xuICAgICAgeG1sIDogbWF0ZXJpYWxzWzBdXG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBVcmRmVmlzdWFsOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpKHtcbiAgICBVcmRmQm94OiByZXF1aXJlKCcuL1VyZGZCb3gnKSxcbiAgICBVcmRmQ29sb3I6IHJlcXVpcmUoJy4vVXJkZkNvbG9yJyksXG4gICAgVXJkZkN5bGluZGVyOiByZXF1aXJlKCcuL1VyZGZDeWxpbmRlcicpLFxuICAgIFVyZGZMaW5rOiByZXF1aXJlKCcuL1VyZGZMaW5rJyksXG4gICAgVXJkZk1hdGVyaWFsOiByZXF1aXJlKCcuL1VyZGZNYXRlcmlhbCcpLFxuICAgIFVyZGZNZXNoOiByZXF1aXJlKCcuL1VyZGZNZXNoJyksXG4gICAgVXJkZk1vZGVsOiByZXF1aXJlKCcuL1VyZGZNb2RlbCcpLFxuICAgIFVyZGZTcGhlcmU6IHJlcXVpcmUoJy4vVXJkZlNwaGVyZScpLFxuICAgIFVyZGZWaXN1YWw6IHJlcXVpcmUoJy4vVXJkZlZpc3VhbCcpXG59LCByZXF1aXJlKCcuL1VyZGZUeXBlcycpKTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsLldlYlNvY2tldDsiLCIvKiBnbG9iYWwgZG9jdW1lbnQgKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gQ2FudmFzKCkge1xuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG59OyIsIi8qKlxuICogQGZpbGVPdmVydmlld1xuICogQGF1dGhvciBHcmFlbWUgWWVhdGVzIC0gZ2l0aHViLmNvbS9tZWdhd2FjXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ2FudmFzID0gcmVxdWlyZSgnY2FudmFzJyk7XG52YXIgSW1hZ2UgPSBDYW52YXMuSW1hZ2UgfHwgZ2xvYmFsLkltYWdlO1xuXG4vKipcbiAqIElmIGEgbWVzc2FnZSB3YXMgY29tcHJlc3NlZCBhcyBhIFBORyBpbWFnZSAoYSBjb21wcmVzc2lvbiBoYWNrIHNpbmNlXG4gKiBnemlwcGluZyBvdmVyIFdlYlNvY2tldHMgKiBpcyBub3Qgc3VwcG9ydGVkIHlldCksIHRoaXMgZnVuY3Rpb24gcGxhY2VzIHRoZVxuICogXCJpbWFnZVwiIGluIGEgY2FudmFzIGVsZW1lbnQgdGhlbiBkZWNvZGVzIHRoZSAqIFwiaW1hZ2VcIiBhcyBhIEJhc2U2NCBzdHJpbmcuXG4gKlxuICogQHByaXZhdGVcbiAqIEBwYXJhbSBkYXRhIC0gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIFBORyBkYXRhLlxuICogQHBhcmFtIGNhbGxiYWNrIC0gZnVuY3Rpb24gd2l0aCBwYXJhbXM6XG4gKiAgICogZGF0YSAtIHRoZSB1bmNvbXByZXNzZWQgZGF0YVxuICovXG5mdW5jdGlvbiBkZWNvbXByZXNzUG5nKGRhdGEsIGNhbGxiYWNrKSB7XG4gIC8vIFVuY29tcHJlc3NlcyB0aGUgZGF0YSBiZWZvcmUgc2VuZGluZyBpdCB0aHJvdWdoICh1c2UgaW1hZ2UvY2FudmFzIHRvIGRvIHNvKS5cbiAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gIC8vIFdoZW4gdGhlIGltYWdlIGxvYWRzLCBleHRyYWN0cyB0aGUgcmF3IGRhdGEgKEpTT04gbWVzc2FnZSkuXG4gIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIENyZWF0ZXMgYSBsb2NhbCBjYW52YXMgdG8gZHJhdyBvbi5cbiAgICB2YXIgY2FudmFzID0gbmV3IENhbnZhcygpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAvLyBTZXRzIHdpZHRoIGFuZCBoZWlnaHQuXG4gICAgY2FudmFzLndpZHRoID0gaW1hZ2Uud2lkdGg7XG4gICAgY2FudmFzLmhlaWdodCA9IGltYWdlLmhlaWdodDtcblxuICAgIC8vIFByZXZlbnRzIGFudGktYWxpYXNpbmcgYW5kIGxvb3NpbmcgZGF0YVxuICAgIGNvbnRleHQuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gICAgY29udGV4dC53ZWJraXRJbWFnZVNtb290aGluZ0VuYWJsZWQgPSBmYWxzZTtcbiAgICBjb250ZXh0Lm1vekltYWdlU21vb3RoaW5nRW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgLy8gUHV0cyB0aGUgZGF0YSBpbnRvIHRoZSBpbWFnZS5cbiAgICBjb250ZXh0LmRyYXdJbWFnZShpbWFnZSwgMCwgMCk7XG4gICAgLy8gR3JhYnMgdGhlIHJhdywgdW5jb21wcmVzc2VkIGRhdGEuXG4gICAgdmFyIGltYWdlRGF0YSA9IGNvbnRleHQuZ2V0SW1hZ2VEYXRhKDAsIDAsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpLmRhdGE7XG5cbiAgICAvLyBDb25zdHJ1Y3RzIHRoZSBKU09OLlxuICAgIHZhciBqc29uRGF0YSA9ICcnO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW1hZ2VEYXRhLmxlbmd0aDsgaSArPSA0KSB7XG4gICAgICAvLyBSR0JcbiAgICAgIGpzb25EYXRhICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoaW1hZ2VEYXRhW2ldLCBpbWFnZURhdGFbaSArIDFdLCBpbWFnZURhdGFbaSArIDJdKTtcbiAgICB9XG4gICAgY2FsbGJhY2soSlNPTi5wYXJzZShqc29uRGF0YSkpO1xuICB9O1xuICAvLyBTZW5kcyB0aGUgaW1hZ2UgZGF0YSB0byBsb2FkLlxuICBpbWFnZS5zcmMgPSAnZGF0YTppbWFnZS9wbmc7YmFzZTY0LCcgKyBkYXRhO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRlY29tcHJlc3NQbmc7IiwiZXhwb3J0cy5ET01JbXBsZW1lbnRhdGlvbiA9IGdsb2JhbC5ET01JbXBsZW1lbnRhdGlvbjtcbmV4cG9ydHMuWE1MU2VyaWFsaXplciA9IGdsb2JhbC5YTUxTZXJpYWxpemVyO1xuZXhwb3J0cy5ET01QYXJzZXIgPSBnbG9iYWwuRE9NUGFyc2VyOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9wb255ZmlsbCA9IHJlcXVpcmUoJy4vcG9ueWZpbGwuanMnKTtcblxudmFyIF9wb255ZmlsbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wb255ZmlsbCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIHJvb3Q7IC8qIGdsb2JhbCB3aW5kb3cgKi9cblxuXG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gbW9kdWxlO1xufSBlbHNlIHtcbiAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG5cbnZhciByZXN1bHQgPSAoMCwgX3BvbnlmaWxsMlsnZGVmYXVsdCddKShyb290KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHJlc3VsdDsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzWydkZWZhdWx0J10gPSBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGw7XG5mdW5jdGlvbiBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGwocm9vdCkge1xuXHR2YXIgcmVzdWx0O1xuXHR2YXIgX1N5bWJvbCA9IHJvb3QuU3ltYm9sO1xuXG5cdGlmICh0eXBlb2YgX1N5bWJvbCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGlmIChfU3ltYm9sLm9ic2VydmFibGUpIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2wub2JzZXJ2YWJsZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0ID0gX1N5bWJvbCgnb2JzZXJ2YWJsZScpO1xuXHRcdFx0X1N5bWJvbC5vYnNlcnZhYmxlID0gcmVzdWx0O1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXN1bHQgPSAnQEBvYnNlcnZhYmxlJztcblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59OyIsInZhciBuZXh0VGljayA9IHJlcXVpcmUoJ3Byb2Nlc3MvYnJvd3Nlci5qcycpLm5leHRUaWNrO1xudmFyIGFwcGx5ID0gRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5O1xudmFyIHNsaWNlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlO1xudmFyIGltbWVkaWF0ZUlkcyA9IHt9O1xudmFyIG5leHRJbW1lZGlhdGVJZCA9IDA7XG5cbi8vIERPTSBBUElzLCBmb3IgY29tcGxldGVuZXNzXG5cbmV4cG9ydHMuc2V0VGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRUaW1lb3V0LCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFyVGltZW91dCk7XG59O1xuZXhwb3J0cy5zZXRJbnRlcnZhbCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IFRpbWVvdXQoYXBwbHkuY2FsbChzZXRJbnRlcnZhbCwgd2luZG93LCBhcmd1bWVudHMpLCBjbGVhckludGVydmFsKTtcbn07XG5leHBvcnRzLmNsZWFyVGltZW91dCA9XG5leHBvcnRzLmNsZWFySW50ZXJ2YWwgPSBmdW5jdGlvbih0aW1lb3V0KSB7IHRpbWVvdXQuY2xvc2UoKTsgfTtcblxuZnVuY3Rpb24gVGltZW91dChpZCwgY2xlYXJGbikge1xuICB0aGlzLl9pZCA9IGlkO1xuICB0aGlzLl9jbGVhckZuID0gY2xlYXJGbjtcbn1cblRpbWVvdXQucHJvdG90eXBlLnVucmVmID0gVGltZW91dC5wcm90b3R5cGUucmVmID0gZnVuY3Rpb24oKSB7fTtcblRpbWVvdXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuX2NsZWFyRm4uY2FsbCh3aW5kb3csIHRoaXMuX2lkKTtcbn07XG5cbi8vIERvZXMgbm90IHN0YXJ0IHRoZSB0aW1lLCBqdXN0IHNldHMgdXAgdGhlIG1lbWJlcnMgbmVlZGVkLlxuZXhwb3J0cy5lbnJvbGwgPSBmdW5jdGlvbihpdGVtLCBtc2Vjcykge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gbXNlY3M7XG59O1xuXG5leHBvcnRzLnVuZW5yb2xsID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG4gIGl0ZW0uX2lkbGVUaW1lb3V0ID0gLTE7XG59O1xuXG5leHBvcnRzLl91bnJlZkFjdGl2ZSA9IGV4cG9ydHMuYWN0aXZlID0gZnVuY3Rpb24oaXRlbSkge1xuICBjbGVhclRpbWVvdXQoaXRlbS5faWRsZVRpbWVvdXRJZCk7XG5cbiAgdmFyIG1zZWNzID0gaXRlbS5faWRsZVRpbWVvdXQ7XG4gIGlmIChtc2VjcyA+PSAwKSB7XG4gICAgaXRlbS5faWRsZVRpbWVvdXRJZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gb25UaW1lb3V0KCkge1xuICAgICAgaWYgKGl0ZW0uX29uVGltZW91dClcbiAgICAgICAgaXRlbS5fb25UaW1lb3V0KCk7XG4gICAgfSwgbXNlY3MpO1xuICB9XG59O1xuXG4vLyBUaGF0J3Mgbm90IGhvdyBub2RlLmpzIGltcGxlbWVudHMgaXQgYnV0IHRoZSBleHBvc2VkIGFwaSBpcyB0aGUgc2FtZS5cbmV4cG9ydHMuc2V0SW1tZWRpYXRlID0gdHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gc2V0SW1tZWRpYXRlIDogZnVuY3Rpb24oZm4pIHtcbiAgdmFyIGlkID0gbmV4dEltbWVkaWF0ZUlkKys7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzLmxlbmd0aCA8IDIgPyBmYWxzZSA6IHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBpbW1lZGlhdGVJZHNbaWRdID0gdHJ1ZTtcblxuICBuZXh0VGljayhmdW5jdGlvbiBvbk5leHRUaWNrKCkge1xuICAgIGlmIChpbW1lZGlhdGVJZHNbaWRdKSB7XG4gICAgICAvLyBmbi5jYWxsKCkgaXMgZmFzdGVyIHNvIHdlIG9wdGltaXplIGZvciB0aGUgY29tbW9uIHVzZS1jYXNlXG4gICAgICAvLyBAc2VlIGh0dHA6Ly9qc3BlcmYuY29tL2NhbGwtYXBwbHktc2VndVxuICAgICAgaWYgKGFyZ3MpIHtcbiAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmbi5jYWxsKG51bGwpO1xuICAgICAgfVxuICAgICAgLy8gUHJldmVudCBpZHMgZnJvbSBsZWFraW5nXG4gICAgICBleHBvcnRzLmNsZWFySW1tZWRpYXRlKGlkKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBpZDtcbn07XG5cbmV4cG9ydHMuY2xlYXJJbW1lZGlhdGUgPSB0eXBlb2YgY2xlYXJJbW1lZGlhdGUgPT09IFwiZnVuY3Rpb25cIiA/IGNsZWFySW1tZWRpYXRlIDogZnVuY3Rpb24oaWQpIHtcbiAgZGVsZXRlIGltbWVkaWF0ZUlkc1tpZF07XG59OyIsIi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwibm9kZVwiIC8+XG5pbXBvcnQge0V2ZW50RW1pdHRlcn0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7U3RyZWFtLCBJbnRlcm5hbFByb2R1Y2VyLCBJbnRlcm5hbExpc3RlbmVyfSBmcm9tICcuLi9pbmRleCc7XG5cbmV4cG9ydCBjbGFzcyBET01FdmVudFByb2R1Y2VyIGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxFdmVudD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tRXZlbnQnO1xuICBwcml2YXRlIGxpc3RlbmVyOiBFdmVudExpc3RlbmVyIHwgbnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5vZGU6IEV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICBwcml2YXRlIGV2ZW50VHlwZTogc3RyaW5nLFxuICAgICAgICAgICAgICBwcml2YXRlIHVzZUNhcHR1cmU6IGJvb2xlYW4pIHtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IEludGVybmFsTGlzdGVuZXI8RXZlbnQ+KSB7XG4gICAgdGhpcy5saXN0ZW5lciA9IChlKSA9PiBvdXQuX24oZSk7XG4gICAgdGhpcy5ub2RlLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5ldmVudFR5cGUsIHRoaXMubGlzdGVuZXIsIHRoaXMudXNlQ2FwdHVyZSk7XG4gIH1cblxuICBfc3RvcCgpIHtcbiAgICB0aGlzLm5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50VHlwZSwgdGhpcy5saXN0ZW5lciBhcyBhbnksIHRoaXMudXNlQ2FwdHVyZSk7XG4gICAgdGhpcy5saXN0ZW5lciA9IG51bGw7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVFdmVudFByb2R1Y2VyIGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxhbnk+IHtcbiAgcHVibGljIHR5cGUgPSAnZnJvbUV2ZW50JztcbiAgcHJpdmF0ZSBsaXN0ZW5lcjogRnVuY3Rpb24gfCBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbm9kZTogRXZlbnRFbWl0dGVyLCBwcml2YXRlIGV2ZW50TmFtZTogc3RyaW5nKSB7IH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHtcbiAgICB0aGlzLmxpc3RlbmVyID0gKC4uLmFyZ3M6IEFycmF5PGFueT4pID0+IHtcbiAgICAgIHJldHVybiAoYXJncy5sZW5ndGggPiAxKSA/IG91dC5fbihhcmdzKSA6IG91dC5fbihhcmdzWzBdKTtcbiAgICB9O1xuICAgIHRoaXMubm9kZS5hZGRMaXN0ZW5lcih0aGlzLmV2ZW50TmFtZSwgdGhpcy5saXN0ZW5lcik7XG4gIH1cblxuICBfc3RvcCgpIHtcbiAgICB0aGlzLm5vZGUucmVtb3ZlTGlzdGVuZXIodGhpcy5ldmVudE5hbWUsIHRoaXMubGlzdGVuZXIgYXMgYW55KTtcbiAgICB0aGlzLmxpc3RlbmVyID0gbnVsbDtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0VtaXR0ZXIoZWxlbWVudDogYW55KTogZWxlbWVudCBpcyBFdmVudEVtaXR0ZXIge1xuICByZXR1cm4gZWxlbWVudC5lbWl0ICYmIGVsZW1lbnQuYWRkTGlzdGVuZXI7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHN0cmVhbSBiYXNlZCBvbiBlaXRoZXI6XG4gKiAtIERPTSBldmVudHMgd2l0aCB0aGUgbmFtZSBgZXZlbnROYW1lYCBmcm9tIGEgcHJvdmlkZWQgdGFyZ2V0IG5vZGVcbiAqIC0gRXZlbnRzIHdpdGggdGhlIG5hbWUgYGV2ZW50TmFtZWAgZnJvbSBhIHByb3ZpZGVkIE5vZGVKUyBFdmVudEVtaXR0ZXJcbiAqXG4gKiBXaGVuIGNyZWF0aW5nIGEgc3RyZWFtIGZyb20gRXZlbnRFbWl0dGVycywgaWYgdGhlIHNvdXJjZSBldmVudCBoYXMgbW9yZSB0aGFuXG4gKiBvbmUgYXJndW1lbnQgYWxsIHRoZSBhcmd1bWVudHMgd2lsbCBiZSBhZ2dyZWdhdGVkIGludG8gYW4gYXJyYXkgaW4gdGhlXG4gKiByZXN1bHQgc3RyZWFtLlxuICpcbiAqIChUaXA6IHdoZW4gdXNpbmcgdGhpcyBmYWN0b3J5IHdpdGggVHlwZVNjcmlwdCwgeW91IHdpbGwgbmVlZCB0eXBlcyBmb3JcbiAqIE5vZGUuanMgYmVjYXVzZSBmcm9tRXZlbnQga25vd3MgaG93IHRvIGhhbmRsZSBib3RoIERPTSBldmVudHMgYW5kIE5vZGUuanNcbiAqIEV2ZW50RW1pdHRlci4gSnVzdCBpbnN0YWxsIGBAdHlwZXMvbm9kZWApXG4gKlxuICogTWFyYmxlIGRpYWdyYW06XG4gKlxuICogYGBgdGV4dFxuICogICBmcm9tRXZlbnQoZWxlbWVudCwgZXZlbnROYW1lKVxuICogLS0tZXYtLWV2LS0tLWV2LS0tLS0tLS0tLS0tLS0tXG4gKiBgYGBcbiAqXG4gKiBFeGFtcGxlczpcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21FdmVudCBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21FdmVudCdcbiAqXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRXZlbnQoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmJ1dHRvbicpLCAnY2xpY2snKVxuICogICAubWFwVG8oJ0J1dHRvbiBjbGlja2VkIScpXG4gKlxuICogc3RyZWFtLmFkZExpc3RlbmVyKHtcbiAqICAgbmV4dDogaSA9PiBjb25zb2xlLmxvZyhpKSxcbiAqICAgZXJyb3I6IGVyciA9PiBjb25zb2xlLmVycm9yKGVyciksXG4gKiAgIGNvbXBsZXRlOiAoKSA9PiBjb25zb2xlLmxvZygnY29tcGxldGVkJylcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+ICdCdXR0b24gY2xpY2tlZCEnXG4gKiA+ICdCdXR0b24gY2xpY2tlZCEnXG4gKiA+ICdCdXR0b24gY2xpY2tlZCEnXG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21FdmVudCBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21FdmVudCdcbiAqIGltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnXG4gKlxuICogY29uc3QgTXlFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRXZlbnQoTXlFbWl0dGVyLCAnZm9vJylcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqXG4gKiBNeUVtaXR0ZXIuZW1pdCgnZm9vJywgJ2JhcicpXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+ICdiYXInXG4gKiBgYGBcbiAqXG4gKiBgYGBqc1xuICogaW1wb3J0IGZyb21FdmVudCBmcm9tICd4c3RyZWFtL2V4dHJhL2Zyb21FdmVudCdcbiAqIGltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnXG4gKlxuICogY29uc3QgTXlFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpXG4gKiBjb25zdCBzdHJlYW0gPSBmcm9tRXZlbnQoTXlFbWl0dGVyLCAnZm9vJylcbiAqXG4gKiBzdHJlYW0uYWRkTGlzdGVuZXIoe1xuICogICBuZXh0OiBpID0+IGNvbnNvbGUubG9nKGkpLFxuICogICBlcnJvcjogZXJyID0+IGNvbnNvbGUuZXJyb3IoZXJyKSxcbiAqICAgY29tcGxldGU6ICgpID0+IGNvbnNvbGUubG9nKCdjb21wbGV0ZWQnKVxuICogfSlcbiAqXG4gKiBNeUVtaXR0ZXIuZW1pdCgnZm9vJywgJ2JhcicsICdiYXonLCAnYnV6eicpXG4gKiBgYGBcbiAqXG4gKiBgYGB0ZXh0XG4gKiA+IFsnYmFyJywgJ2JheicsICdidXp6J11cbiAqIGBgYFxuICpcbiAqIEBmYWN0b3J5IHRydWVcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyfSBlbGVtZW50IFRoZSBlbGVtZW50IHVwb24gd2hpY2ggdG8gbGlzdGVuLlxuICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZSBUaGUgbmFtZSBvZiB0aGUgZXZlbnQgZm9yIHdoaWNoIHRvIGxpc3Rlbi5cbiAqIEBwYXJhbSB7Ym9vbGVhbj99IHVzZUNhcHR1cmUgQW4gb3B0aW9uYWwgYm9vbGVhbiB0aGF0IGluZGljYXRlcyB0aGF0IGV2ZW50cyBvZlxuICogdGhpcyB0eXBlIHdpbGwgYmUgZGlzcGF0Y2hlZCB0byB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lciBiZWZvcmUgYmVpbmdcbiAqIGRpc3BhdGNoZWQgdG8gYW55IEV2ZW50VGFyZ2V0IGJlbmVhdGggaXQgaW4gdGhlIERPTSB0cmVlLiBEZWZhdWx0cyB0byBmYWxzZS5cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuXG5mdW5jdGlvbiBmcm9tRXZlbnQ8VCA9IGFueT4oZWxlbWVudDogRXZlbnRFbWl0dGVyLCBldmVudE5hbWU6IHN0cmluZyk6IFN0cmVhbTxUPjtcbmZ1bmN0aW9uIGZyb21FdmVudDxUIGV4dGVuZHMgRXZlbnQgPSBFdmVudD4oZWxlbWVudDogRXZlbnRUYXJnZXQsIGV2ZW50TmFtZTogc3RyaW5nLCB1c2VDYXB0dXJlPzogYm9vbGVhbik6IFN0cmVhbTxUPjtcblxuZnVuY3Rpb24gZnJvbUV2ZW50PFQgPSBhbnk+KGVsZW1lbnQ6IEV2ZW50RW1pdHRlciB8IEV2ZW50VGFyZ2V0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50TmFtZTogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZUNhcHR1cmU6IGJvb2xlYW4gPSBmYWxzZSk6IFN0cmVhbTxUPiB7XG4gIGlmIChpc0VtaXR0ZXIoZWxlbWVudCkpIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgTm9kZUV2ZW50UHJvZHVjZXIoZWxlbWVudCwgZXZlbnROYW1lKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERPTUV2ZW50UHJvZHVjZXIoZWxlbWVudCwgZXZlbnROYW1lLCB1c2VDYXB0dXJlKSBhcyBhbnkpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZyb21FdmVudDtcbiIsImltcG9ydCAkJG9ic2VydmFibGUgZnJvbSAnc3ltYm9sLW9ic2VydmFibGUnO1xuXG5jb25zdCBOTyA9IHt9O1xuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmZ1bmN0aW9uIGNwPFQ+KGE6IEFycmF5PFQ+KTogQXJyYXk8VD4ge1xuICBjb25zdCBsID0gYS5sZW5ndGg7XG4gIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyArK2kpIGJbaV0gPSBhW2ldO1xuICByZXR1cm4gYjtcbn1cblxuZnVuY3Rpb24gYW5kPFQ+KGYxOiAodDogVCkgPT4gYm9vbGVhbiwgZjI6ICh0OiBUKSA9PiBib29sZWFuKTogKHQ6IFQpID0+IGJvb2xlYW4ge1xuICByZXR1cm4gZnVuY3Rpb24gYW5kRm4odDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmMSh0KSAmJiBmMih0KTtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIEZDb250YWluZXI8VCwgUj4ge1xuICBmKHQ6IFQpOiBSO1xufVxuXG5mdW5jdGlvbiBfdHJ5PFQsIFI+KGM6IEZDb250YWluZXI8VCwgUj4sIHQ6IFQsIHU6IFN0cmVhbTxhbnk+KTogUiB8IHt9IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYy5mKHQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdS5fZShlKTtcbiAgICByZXR1cm4gTk87XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgX246ICh2OiBUKSA9PiB2b2lkO1xuICBfZTogKGVycjogYW55KSA9PiB2b2lkO1xuICBfYzogKCkgPT4gdm9pZDtcbn1cblxuY29uc3QgTk9fSUw6IEludGVybmFsTGlzdGVuZXI8YW55PiA9IHtcbiAgX246IG5vb3AsXG4gIF9lOiBub29wLFxuICBfYzogbm9vcCxcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIF9zdGFydChsaXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQ7XG4gIF9zdG9wOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE91dFNlbmRlcjxUPiB7XG4gIG91dDogU3RyZWFtPFQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wZXJhdG9yPFQsIFI+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxSPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPFI+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnM6IFN0cmVhbTxUPjtcbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBZ2dyZWdhdG9yPFQsIFU+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxVPiwgT3V0U2VuZGVyPFU+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj47XG4gIF9zdGFydChvdXQ6IFN0cmVhbTxVPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvZHVjZXI8VD4ge1xuICBzdGFydDogKGxpc3RlbmVyOiBMaXN0ZW5lcjxUPikgPT4gdm9pZDtcbiAgc3RvcDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaXN0ZW5lcjxUPiB7XG4gIG5leHQ6ICh4OiBUKSA9PiB2b2lkO1xuICBlcnJvcjogKGVycjogYW55KSA9PiB2b2lkO1xuICBjb21wbGV0ZTogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb24ge1xuICB1bnN1YnNjcmliZSgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9ic2VydmFibGU8VD4ge1xuICBzdWJzY3JpYmUobGlzdGVuZXI6IExpc3RlbmVyPFQ+KTogU3Vic2NyaXB0aW9uO1xufVxuXG4vLyBtdXRhdGVzIHRoZSBpbnB1dFxuZnVuY3Rpb24gaW50ZXJuYWxpemVQcm9kdWNlcjxUPihwcm9kdWNlcjogUHJvZHVjZXI8VD4gJiBQYXJ0aWFsPEludGVybmFsUHJvZHVjZXI8VD4+KSB7XG4gIHByb2R1Y2VyLl9zdGFydCA9IGZ1bmN0aW9uIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPiAmIFBhcnRpYWw8TGlzdGVuZXI8VD4+KSB7XG4gICAgaWwubmV4dCA9IGlsLl9uO1xuICAgIGlsLmVycm9yID0gaWwuX2U7XG4gICAgaWwuY29tcGxldGUgPSBpbC5fYztcbiAgICB0aGlzLnN0YXJ0KGlsKTtcbiAgfTtcbiAgcHJvZHVjZXIuX3N0b3AgPSBwcm9kdWNlci5zdG9wO1xufVxuXG5jbGFzcyBTdHJlYW1TdWI8VD4gaW1wbGVtZW50cyBTdWJzY3JpcHRpb24ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zdHJlYW06IFN0cmVhbTxUPiwgcHJpdmF0ZSBfbGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pIHt9XG5cbiAgdW5zdWJzY3JpYmUoKTogdm9pZCB7XG4gICAgdGhpcy5fc3RyZWFtLl9yZW1vdmUodGhpcy5fbGlzdGVuZXIpO1xuICB9XG59XG5cbmNsYXNzIE9ic2VydmVyPFQ+IGltcGxlbWVudHMgTGlzdGVuZXI8VD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9saXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPikge31cblxuICBuZXh0KHZhbHVlOiBUKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX24odmFsdWUpO1xuICB9XG5cbiAgZXJyb3IoZXJyOiBhbnkpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fZShlcnIpO1xuICB9XG5cbiAgY29tcGxldGUoKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBGcm9tT2JzZXJ2YWJsZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tT2JzZXJ2YWJsZSc7XG4gIHB1YmxpYyBpbnM6IE9ic2VydmFibGU8VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBhY3RpdmU6IGJvb2xlYW47XG4gIHByaXZhdGUgX3N1YjogU3Vic2NyaXB0aW9uIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKG9ic2VydmFibGU6IE9ic2VydmFibGU8VD4pIHtcbiAgICB0aGlzLmlucyA9IG9ic2VydmFibGU7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLl9zdWIgPSB0aGlzLmlucy5zdWJzY3JpYmUobmV3IE9ic2VydmVyKG91dCkpO1xuICAgIGlmICghdGhpcy5hY3RpdmUpIHRoaXMuX3N1Yi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgX3N0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3N1YikgdGhpcy5fc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lcmdlU2lnbmF0dXJlIHtcbiAgKCk6IFN0cmVhbTxhbnk+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogU3RyZWFtPFQxPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiBTdHJlYW08VDEgfCBUMj47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IFN0cmVhbTxUMSB8IFQyIHwgVDM+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDY+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOD47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4IHwgVDk+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5PixcbiAgICBzMTA6IFN0cmVhbTxUMTA+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDggfCBUOSB8IFQxMD47XG4gIDxUPiguLi5zdHJlYW06IEFycmF5PFN0cmVhbTxUPj4pOiBTdHJlYW08VD47XG59XG5cbmNsYXNzIE1lcmdlPFQ+IGltcGxlbWVudHMgQWdncmVnYXRvcjxULCBUPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ21lcmdlJztcbiAgcHVibGljIGluc0FycjogQXJyYXk8U3RyZWFtPFQ+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGFjOiBudW1iZXI7IC8vIGFjIGlzIGFjdGl2ZUNvdW50XG5cbiAgY29uc3RydWN0b3IoaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+KSB7XG4gICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5hYyA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgTCA9IHMubGVuZ3RoO1xuICAgIHRoaXMuYWMgPSBMO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBzW2ldLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgTCA9IHMubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBzW2ldLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBpZiAoLS10aGlzLmFjIDw9IDApIHtcbiAgICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgICAgdS5fYygpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbWJpbmVTaWduYXR1cmUge1xuICAoKTogU3RyZWFtPEFycmF5PGFueT4+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogU3RyZWFtPFtUMV0+O1xuICA8VDEsIFQyPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPik6IFN0cmVhbTxbVDEsIFQyXT47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IFN0cmVhbTxbVDEsIFQyLCBUM10+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNl0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUN10+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5PixcbiAgICBzMTA6IFN0cmVhbTxUMTA+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTBdPjtcbiAgKC4uLnN0cmVhbTogQXJyYXk8U3RyZWFtPGFueT4+KTogU3RyZWFtPEFycmF5PGFueT4+O1xufVxuXG5jbGFzcyBDb21iaW5lTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8QXJyYXk8VD4+IHtcbiAgcHJpdmF0ZSBpOiBudW1iZXI7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxUPj47XG4gIHByaXZhdGUgcDogQ29tYmluZTxUPjtcblxuICBjb25zdHJ1Y3RvcihpOiBudW1iZXIsIG91dDogU3RyZWFtPEFycmF5PFQ+PiwgcDogQ29tYmluZTxUPikge1xuICAgIHRoaXMuaSA9IGk7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5wID0gcDtcbiAgICBwLmlscy5wdXNoKHRoaXMpO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHAudXAodCwgdGhpcy5pKSkge1xuICAgICAgY29uc3QgYSA9IHAudmFscztcbiAgICAgIGNvbnN0IGwgPSBhLmxlbmd0aDtcbiAgICAgIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbDsgKytpKSBiW2ldID0gYVtpXTtcbiAgICAgIG91dC5fbihiKTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgb3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wO1xuICAgIGlmIChwLm91dCA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAoLS1wLk5jID09PSAwKSBwLm91dC5fYygpO1xuICB9XG59XG5cbmNsYXNzIENvbWJpbmU8Uj4gaW1wbGVtZW50cyBBZ2dyZWdhdG9yPGFueSwgQXJyYXk8Uj4+IHtcbiAgcHVibGljIHR5cGUgPSAnY29tYmluZSc7XG4gIHB1YmxpYyBpbnNBcnI6IEFycmF5PFN0cmVhbTxhbnk+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPEFycmF5PFI+PjtcbiAgcHVibGljIGlsczogQXJyYXk8Q29tYmluZUxpc3RlbmVyPGFueT4+O1xuICBwdWJsaWMgTmM6IG51bWJlcjsgLy8gKk4qdW1iZXIgb2Ygc3RyZWFtcyBzdGlsbCB0byBzZW5kICpjKm9tcGxldGVcbiAgcHVibGljIE5uOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqbipleHRcbiAgcHVibGljIHZhbHM6IEFycmF5PFI+O1xuXG4gIGNvbnN0cnVjdG9yKGluc0FycjogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8Uj4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy5OYyA9IHRoaXMuTm4gPSAwO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG5cbiAgdXAodDogYW55LCBpOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCB2ID0gdGhpcy52YWxzW2ldO1xuICAgIGNvbnN0IE5uID0gIXRoaXMuTm4gPyAwIDogdiA9PT0gTk8gPyAtLXRoaXMuTm4gOiB0aGlzLk5uO1xuICAgIHRoaXMudmFsc1tpXSA9IHQ7XG4gICAgcmV0dXJuIE5uID09PSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPEFycmF5PFI+Pik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBuID0gdGhpcy5OYyA9IHRoaXMuTm4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCB2YWxzID0gdGhpcy52YWxzID0gbmV3IEFycmF5KG4pO1xuICAgIGlmIChuID09PSAwKSB7XG4gICAgICBvdXQuX24oW10pO1xuICAgICAgb3V0Ll9jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHZhbHNbaV0gPSBOTztcbiAgICAgICAgc1tpXS5fYWRkKG5ldyBDb21iaW5lTGlzdGVuZXIoaSwgb3V0LCB0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IG4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCBpbHMgPSB0aGlzLmlscztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykgc1tpXS5fcmVtb3ZlKGlsc1tpXSk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8Uj4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy52YWxzID0gW107XG4gIH1cbn1cblxuY2xhc3MgRnJvbUFycmF5PFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21BcnJheSc7XG4gIHB1YmxpYyBhOiBBcnJheTxUPjtcblxuICBjb25zdHJ1Y3RvcihhOiBBcnJheTxUPikge1xuICAgIHRoaXMuYSA9IGE7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuYTtcbiAgICBmb3IgKGxldCBpID0gMCwgbiA9IGEubGVuZ3RoOyBpIDwgbjsgaSsrKSBvdXQuX24oYVtpXSk7XG4gICAgb3V0Ll9jKCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgfVxufVxuXG5jbGFzcyBGcm9tUHJvbWlzZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tUHJvbWlzZSc7XG4gIHB1YmxpYyBvbjogYm9vbGVhbjtcbiAgcHVibGljIHA6IFByb21pc2VMaWtlPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKHA6IFByb21pc2VMaWtlPFQ+KSB7XG4gICAgdGhpcy5vbiA9IGZhbHNlO1xuICAgIHRoaXMucCA9IHA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgcHJvZCA9IHRoaXM7XG4gICAgdGhpcy5vbiA9IHRydWU7XG4gICAgdGhpcy5wLnRoZW4oXG4gICAgICAodjogVCkgPT4ge1xuICAgICAgICBpZiAocHJvZC5vbikge1xuICAgICAgICAgIG91dC5fbih2KTtcbiAgICAgICAgICBvdXQuX2MoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIChlOiBhbnkpID0+IHtcbiAgICAgICAgb3V0Ll9lKGUpO1xuICAgICAgfSxcbiAgICApLnRoZW4obm9vcCwgKGVycjogYW55KSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhyb3cgZXJyOyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMub24gPSBmYWxzZTtcbiAgfVxufVxuXG5jbGFzcyBQZXJpb2RpYyBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8bnVtYmVyPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3BlcmlvZGljJztcbiAgcHVibGljIHBlcmlvZDogbnVtYmVyO1xuICBwcml2YXRlIGludGVydmFsSUQ6IGFueTtcbiAgcHJpdmF0ZSBpOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IocGVyaW9kOiBudW1iZXIpIHtcbiAgICB0aGlzLnBlcmlvZCA9IHBlcmlvZDtcbiAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICB0aGlzLmkgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxudW1iZXI+KTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gaW50ZXJ2YWxIYW5kbGVyKCkgeyBvdXQuX24oc2VsZi5pKyspOyB9XG4gICAgdGhpcy5pbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGVyLCB0aGlzLnBlcmlvZCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pbnRlcnZhbElEICE9PSAtMSkgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSUQpO1xuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IC0xO1xuICAgIHRoaXMuaSA9IDA7XG4gIH1cbn1cblxuY2xhc3MgRGVidWc8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2RlYnVnJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgczogKHQ6IFQpID0+IGFueTsgLy8gc3B5XG4gIHByaXZhdGUgbDogc3RyaW5nOyAvLyBsYWJlbFxuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiAodDogVCkgPT4gYW55KTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnMgPSBub29wO1xuICAgIHRoaXMubCA9ICcnO1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgdGhpcy5sID0gYXJnOyBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB0aGlzLnMgPSBhcmc7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgcyA9IHRoaXMucywgbCA9IHRoaXMubDtcbiAgICBpZiAocyAhPT0gbm9vcCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcyh0KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdS5fZShlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGwpIGNvbnNvbGUubG9nKGwgKyAnOicsIHQpOyBlbHNlIGNvbnNvbGUubG9nKHQpO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIERyb3A8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Ryb3AnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG1heDogbnVtYmVyO1xuICBwcml2YXRlIGRyb3BwZWQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihtYXg6IG51bWJlciwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm1heCA9IG1heDtcbiAgICB0aGlzLmRyb3BwZWQgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5kcm9wcGVkID0gMDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuZHJvcHBlZCsrID49IHRoaXMubWF4KSB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBFbmRXaGVuTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPGFueT4ge1xuICBwcml2YXRlIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wOiBFbmRXaGVuPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKG91dDogU3RyZWFtPFQ+LCBvcDogRW5kV2hlbjxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3AgPSBvcDtcbiAgfVxuXG4gIF9uKCkge1xuICAgIHRoaXMub3AuZW5kKCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIHRoaXMub3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wLmVuZCgpO1xuICB9XG59XG5cbmNsYXNzIEVuZFdoZW48VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2VuZFdoZW4nO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG86IFN0cmVhbTxhbnk+OyAvLyBvID0gb3RoZXJcbiAgcHJpdmF0ZSBvaWw6IEludGVybmFsTGlzdGVuZXI8YW55PjsgLy8gb2lsID0gb3RoZXIgSW50ZXJuYWxMaXN0ZW5lclxuXG4gIGNvbnN0cnVjdG9yKG86IFN0cmVhbTxhbnk+LCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubyA9IG87XG4gICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuby5fYWRkKHRoaXMub2lsID0gbmV3IEVuZFdoZW5MaXN0ZW5lcihvdXQsIHRoaXMpKTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm8uX3JlbW92ZSh0aGlzLm9pbCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgfVxuXG4gIGVuZCgpOiB2b2lkIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5lbmQoKTtcbiAgfVxufVxuXG5jbGFzcyBGaWx0ZXI8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZpbHRlcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmYgPSBwYXNzZXM7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PIHx8ICFyKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRmxhdHRlbkxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHByaXZhdGUgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3A6IEZsYXR0ZW48VD47XG5cbiAgY29uc3RydWN0b3Iob3V0OiBTdHJlYW08VD4sIG9wOiBGbGF0dGVuPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcCA9IG9wO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIHRoaXMub3V0Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICB0aGlzLm91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcC5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wLmxlc3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGbGF0dGVuPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8U3RyZWFtPFQ+LCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZsYXR0ZW4nO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08U3RyZWFtPFQ+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wZW46IGJvb2xlYW47XG4gIHB1YmxpYyBpbm5lcjogU3RyZWFtPFQ+OyAvLyBDdXJyZW50IGlubmVyIFN0cmVhbVxuICBwcml2YXRlIGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+OyAvLyBDdXJyZW50IGlubmVyIEludGVybmFsTGlzdGVuZXJcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxTdHJlYW08VD4+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgaWYgKHRoaXMuaW5uZXIgIT09IE5PKSB0aGlzLmlubmVyLl9yZW1vdmUodGhpcy5pbCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgfVxuXG4gIGxlc3MoKTogdm9pZCB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICghdGhpcy5vcGVuICYmIHRoaXMuaW5uZXIgPT09IE5PKSB1Ll9jKCk7XG4gIH1cblxuICBfbihzOiBTdHJlYW08VD4pIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3Qge2lubmVyLCBpbH0gPSB0aGlzO1xuICAgIGlmIChpbm5lciAhPT0gTk8gJiYgaWwgIT09IE5PX0lMKSBpbm5lci5fcmVtb3ZlKGlsKTtcbiAgICAodGhpcy5pbm5lciA9IHMpLl9hZGQodGhpcy5pbCA9IG5ldyBGbGF0dGVuTGlzdGVuZXIodSwgdGhpcykpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcGVuID0gZmFsc2U7XG4gICAgdGhpcy5sZXNzKCk7XG4gIH1cbn1cblxuY2xhc3MgRm9sZDxULCBSPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFI+IHtcbiAgcHVibGljIHR5cGUgPSAnZm9sZCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFI+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IFI7XG4gIHB1YmxpYyBzZWVkOiBSO1xuICBwcml2YXRlIGFjYzogUjsgLy8gaW5pdGlhbGl6ZWQgYXMgc2VlZFxuXG4gIGNvbnN0cnVjdG9yKGY6IChhY2M6IFIsIHQ6IFQpID0+IFIsIHNlZWQ6IFIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5mID0gKHQ6IFQpID0+IGYodGhpcy5hY2MsIHQpO1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkID0gc2VlZDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICAgIG91dC5fbih0aGlzLmFjYyk7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQ7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odGhpcy5hY2MgPSByIGFzIFIpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBMYXN0PFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdsYXN0JztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgaGFzOiBib29sZWFuO1xuICBwcml2YXRlIHZhbDogVDtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgdGhpcy52YWwgPSBOTyBhcyBUO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5oYXMgPSBmYWxzZTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnZhbCA9IE5PIGFzIFQ7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgdGhpcy5oYXMgPSB0cnVlO1xuICAgIHRoaXMudmFsID0gdDtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAodGhpcy5oYXMpIHtcbiAgICAgIHUuX24odGhpcy52YWwpO1xuICAgICAgdS5fYygpO1xuICAgIH0gZWxzZSB1Ll9lKG5ldyBFcnJvcignbGFzdCgpIGZhaWxlZCBiZWNhdXNlIGlucHV0IHN0cmVhbSBjb21wbGV0ZWQnKSk7XG4gIH1cbn1cblxuY2xhc3MgTWFwT3A8VCwgUj4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBSPiB7XG4gIHB1YmxpYyB0eXBlID0gJ21hcCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFI+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IFI7XG5cbiAgY29uc3RydWN0b3IocHJvamVjdDogKHQ6IFQpID0+IFIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5mID0gcHJvamVjdDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHIgYXMgUik7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIFJlbWVtYmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3JlbWVtYmVyJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG59XG5cbmNsYXNzIFJlcGxhY2VFcnJvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAncmVwbGFjZUVycm9yJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBmOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPjtcblxuICBjb25zdHJ1Y3RvcihyZXBsYWNlcjogKGVycjogYW55KSA9PiBTdHJlYW08VD4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5mID0gcmVwbGFjZXI7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgKHRoaXMuaW5zID0gdGhpcy5mKGVycikpLl9hZGQodGhpcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdS5fZShlKTtcbiAgICB9XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIFN0YXJ0V2l0aDxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdzdGFydFdpdGgnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIHZhbDogVDtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgdmFsOiBUKSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy52YWwgPSB2YWw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm91dC5fbih0aGlzLnZhbCk7XG4gICAgdGhpcy5pbnMuX2FkZChvdXQpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzLm91dCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cbn1cblxuY2xhc3MgVGFrZTxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAndGFrZSc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbWF4OiBudW1iZXI7XG4gIHByaXZhdGUgdGFrZW46IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihtYXg6IG51bWJlciwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm1heCA9IG1heDtcbiAgICB0aGlzLnRha2VuID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMudGFrZW4gPSAwO1xuICAgIGlmICh0aGlzLm1heCA8PSAwKSBvdXQuX2MoKTsgZWxzZSB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgbSA9ICsrdGhpcy50YWtlbjtcbiAgICBpZiAobSA8IHRoaXMubWF4KSB1Ll9uKHQpOyBlbHNlIGlmIChtID09PSB0aGlzLm1heCkge1xuICAgICAgdS5fbih0KTtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJlYW08VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHVibGljIF9wcm9kOiBJbnRlcm5hbFByb2R1Y2VyPFQ+O1xuICBwcm90ZWN0ZWQgX2lsczogQXJyYXk8SW50ZXJuYWxMaXN0ZW5lcjxUPj47IC8vICdpbHMnID0gSW50ZXJuYWwgbGlzdGVuZXJzXG4gIHByb3RlY3RlZCBfc3RvcElEOiBhbnk7XG4gIHByb3RlY3RlZCBfZGw6IEludGVybmFsTGlzdGVuZXI8VD47IC8vIHRoZSBkZWJ1ZyBsaXN0ZW5lclxuICBwcm90ZWN0ZWQgX2Q6IGJvb2xlYW47IC8vIGZsYWcgaW5kaWNhdGluZyB0aGUgZXhpc3RlbmNlIG9mIHRoZSBkZWJ1ZyBsaXN0ZW5lclxuICBwcm90ZWN0ZWQgX3RhcmdldDogU3RyZWFtPFQ+OyAvLyBpbWl0YXRpb24gdGFyZ2V0IGlmIHRoaXMgU3RyZWFtIHdpbGwgaW1pdGF0ZVxuICBwcm90ZWN0ZWQgX2VycjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHByb2R1Y2VyPzogSW50ZXJuYWxQcm9kdWNlcjxUPikge1xuICAgIHRoaXMuX3Byb2QgPSBwcm9kdWNlciB8fCBOTyBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+O1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIHRoaXMuX2RsID0gTk8gYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgdGhpcy5fdGFyZ2V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fbih0KTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9uKHQpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fbih0KTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9lcnIgIT09IE5PKSByZXR1cm47XG4gICAgdGhpcy5fZXJyID0gZXJyO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIHRoaXMuX3goKTtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX2UoZXJyKTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9lKGVycik7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9lKGVycik7XG4gICAgfVxuICAgIGlmICghdGhpcy5fZCAmJiBMID09IDApIHRocm93IHRoaXMuX2VycjtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIHRoaXMuX3goKTtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX2MoKTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9jKCk7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9jKCk7XG4gICAgfVxuICB9XG5cbiAgX3goKTogdm9pZCB7IC8vIHRlYXIgZG93biBsb2dpYywgYWZ0ZXIgZXJyb3Igb3IgY29tcGxldGVcbiAgICBpZiAodGhpcy5faWxzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTykgdGhpcy5fcHJvZC5fc3RvcCgpO1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgLy8gV0FSTklORzogY29kZSB0aGF0IGNhbGxzIHRoaXMgbWV0aG9kIHNob3VsZFxuICAgIC8vIGZpcnN0IGNoZWNrIGlmIHRoaXMuX3Byb2QgaXMgdmFsaWQgKG5vdCBgTk9gKVxuICAgIHRoaXMuX3Byb2QuX3N0b3AoKTtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHJldHVybjtcbiAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3N0b3BJRCk7XG4gICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgICBpZiAocCAhPT0gTk8pIHAuX3N0YXJ0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF9yZW1vdmUoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX3JlbW92ZShpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBpID0gYS5pbmRleE9mKGlsKTtcbiAgICBpZiAoaSA+IC0xKSB7XG4gICAgICBhLnNwbGljZShpLCAxKTtcbiAgICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTyAmJiBhLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgIHRoaXMuX2VyciA9IE5PO1xuICAgICAgICB0aGlzLl9zdG9wSUQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3N0b3BOb3coKSk7XG4gICAgICB9IGVsc2UgaWYgKGEubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHRoaXMuX3BydW5lQ3ljbGVzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgYWxsIHBhdGhzIHN0ZW1taW5nIGZyb20gYHRoaXNgIHN0cmVhbSBldmVudHVhbGx5IGVuZCBhdCBgdGhpc2BcbiAgLy8gc3RyZWFtLCB0aGVuIHdlIHJlbW92ZSB0aGUgc2luZ2xlIGxpc3RlbmVyIG9mIGB0aGlzYCBzdHJlYW0sIHRvXG4gIC8vIGZvcmNlIGl0IHRvIGVuZCBpdHMgZXhlY3V0aW9uIGFuZCBkaXNwb3NlIHJlc291cmNlcy4gVGhpcyBtZXRob2RcbiAgLy8gYXNzdW1lcyBhcyBhIHByZWNvbmRpdGlvbiB0aGF0IHRoaXMuX2lscyBoYXMganVzdCBvbmUgbGlzdGVuZXIuXG4gIF9wcnVuZUN5Y2xlcygpIHtcbiAgICBpZiAodGhpcy5faGFzTm9TaW5rcyh0aGlzLCBbXSkpIHRoaXMuX3JlbW92ZSh0aGlzLl9pbHNbMF0pO1xuICB9XG5cbiAgLy8gQ2hlY2tzIHdoZXRoZXIgKnRoZXJlIGlzIG5vKiBwYXRoIHN0YXJ0aW5nIGZyb20gYHhgIHRoYXQgbGVhZHMgdG8gYW4gZW5kXG4gIC8vIGxpc3RlbmVyIChzaW5rKSBpbiB0aGUgc3RyZWFtIGdyYXBoLCBmb2xsb3dpbmcgZWRnZXMgQS0+QiB3aGVyZSBCIGlzIGFcbiAgLy8gbGlzdGVuZXIgb2YgQS4gVGhpcyBtZWFucyB0aGVzZSBwYXRocyBjb25zdGl0dXRlIGEgY3ljbGUgc29tZWhvdy4gSXMgZ2l2ZW5cbiAgLy8gYSB0cmFjZSBvZiBhbGwgdmlzaXRlZCBub2RlcyBzbyBmYXIuXG4gIF9oYXNOb1NpbmtzKHg6IEludGVybmFsTGlzdGVuZXI8YW55PiwgdHJhY2U6IEFycmF5PGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAodHJhY2UuaW5kZXhPZih4KSAhPT0gLTEpXG4gICAgICByZXR1cm4gdHJ1ZTsgZWxzZVxuICAgIGlmICgoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCA9PT0gdGhpcylcbiAgICAgIHJldHVybiB0cnVlOyBlbHNlXG4gICAgaWYgKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ICYmICh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ICE9PSBOTylcbiAgICAgIHJldHVybiB0aGlzLl9oYXNOb1NpbmtzKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0LCB0cmFjZS5jb25jYXQoeCkpOyBlbHNlXG4gICAgaWYgKCh4IGFzIFN0cmVhbTxhbnk+KS5faWxzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgTiA9ICh4IGFzIFN0cmVhbTxhbnk+KS5faWxzLmxlbmd0aDsgaSA8IE47IGkrKylcbiAgICAgICAgaWYgKCF0aGlzLl9oYXNOb1NpbmtzKCh4IGFzIFN0cmVhbTxhbnk+KS5faWxzW2ldLCB0cmFjZS5jb25jYXQoeCkpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGN0b3IoKTogdHlwZW9mIFN0cmVhbSB7XG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBNZW1vcnlTdHJlYW0gPyBNZW1vcnlTdHJlYW0gOiBTdHJlYW07XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIExpc3RlbmVyIHRvIHRoZSBTdHJlYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXJ9IGxpc3RlbmVyXG4gICAqL1xuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiB2b2lkIHtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX24gPSBsaXN0ZW5lci5uZXh0IHx8IG5vb3A7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2MgPSBsaXN0ZW5lci5jb21wbGV0ZSB8fCBub29wO1xuICAgIHRoaXMuX2FkZChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgTGlzdGVuZXIgZnJvbSB0aGUgU3RyZWFtLCBhc3N1bWluZyB0aGUgTGlzdGVuZXIgd2FzIGFkZGVkIHRvIGl0LlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgKi9cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogdm9pZCB7XG4gICAgdGhpcy5fcmVtb3ZlKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtIHJldHVybmluZyBhIFN1YnNjcmlwdGlvbiB0byByZW1vdmUgdGhhdFxuICAgKiBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcn0gbGlzdGVuZXJcbiAgICogQHJldHVybnMge1N1YnNjcmlwdGlvbn1cbiAgICovXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiBTdWJzY3JpcHRpb24ge1xuICAgIHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiBuZXcgU3RyZWFtU3ViPFQ+KHRoaXMsIGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBpbnRlcm9wIGJldHdlZW4gbW9zdC5qcyBhbmQgUnhKUyA1XG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJlYW19XG4gICAqL1xuICBbJCRvYnNlcnZhYmxlXSgpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgU3RyZWFtIGdpdmVuIGEgUHJvZHVjZXIuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9kdWNlcn0gcHJvZHVjZXIgQW4gb3B0aW9uYWwgUHJvZHVjZXIgdGhhdCBkaWN0YXRlcyBob3cgdG9cbiAgICogc3RhcnQsIGdlbmVyYXRlIGV2ZW50cywgYW5kIHN0b3AgdGhlIFN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZTxUPihwcm9kdWNlcj86IFByb2R1Y2VyPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAocHJvZHVjZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgcHJvZHVjZXIuc3RhcnQgIT09ICdmdW5jdGlvbidcbiAgICAgIHx8IHR5cGVvZiBwcm9kdWNlci5zdG9wICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2R1Y2VyIHJlcXVpcmVzIGJvdGggc3RhcnQgYW5kIHN0b3AgZnVuY3Rpb25zJyk7XG4gICAgICBpbnRlcm5hbGl6ZVByb2R1Y2VyKHByb2R1Y2VyKTsgLy8gbXV0YXRlcyB0aGUgaW5wdXRcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTdHJlYW0ocHJvZHVjZXIgYXMgSW50ZXJuYWxQcm9kdWNlcjxUPiAmIFByb2R1Y2VyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE1lbW9yeVN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGVXaXRoTWVtb3J5PFQ+KHByb2R1Y2VyPzogUHJvZHVjZXI8VD4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIGlmIChwcm9kdWNlcikgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4ocHJvZHVjZXIgYXMgSW50ZXJuYWxQcm9kdWNlcjxUPiAmIFByb2R1Y2VyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgZG9lcyBub3RoaW5nIHdoZW4gc3RhcnRlZC4gSXQgbmV2ZXIgZW1pdHMgYW55IGV2ZW50LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAgICAgICAgICBuZXZlclxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgbmV2ZXIoKTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe19zdGFydDogbm9vcCwgX3N0b3A6IG5vb3B9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgdGhlIFwiY29tcGxldGVcIiBub3RpZmljYXRpb24gd2hlblxuICAgKiBzdGFydGVkLCBhbmQgdGhhdCdzIGl0LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBlbXB0eVxuICAgKiAtfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZW1wdHkoKTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe1xuICAgICAgX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHsgaWwuX2MoKTsgfSxcbiAgICAgIF9zdG9wOiBub29wLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyBhbiBcImVycm9yXCIgbm90aWZpY2F0aW9uIHdpdGggdGhlXG4gICAqIHZhbHVlIHlvdSBwYXNzZWQgYXMgdGhlIGBlcnJvcmAgYXJndW1lbnQgd2hlbiB0aGUgc3RyZWFtIHN0YXJ0cywgYW5kIHRoYXQnc1xuICAgKiBpdC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogdGhyb3coWClcbiAgICogLVhcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIGVycm9yIFRoZSBlcnJvciBldmVudCB0byBlbWl0IG9uIHRoZSBjcmVhdGVkIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIHRocm93KGVycm9yOiBhbnkpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7XG4gICAgICBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8YW55PikgeyBpbC5fZShlcnJvcik7IH0sXG4gICAgICBfc3RvcDogbm9vcCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RyZWFtIGZyb20gYW4gQXJyYXksIFByb21pc2UsIG9yIGFuIE9ic2VydmFibGUuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtBcnJheXxQcm9taXNlTGlrZXxPYnNlcnZhYmxlfSBpbnB1dCBUaGUgaW5wdXQgdG8gbWFrZSBhIHN0cmVhbSBmcm9tLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbTxUPihpbnB1dDogUHJvbWlzZUxpa2U8VD4gfCBTdHJlYW08VD4gfCBBcnJheTxUPiB8IE9ic2VydmFibGU8VD4pOiBTdHJlYW08VD4ge1xuICAgIGlmICh0eXBlb2YgaW5wdXRbJCRvYnNlcnZhYmxlXSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbU9ic2VydmFibGU8VD4oaW5wdXQgYXMgT2JzZXJ2YWJsZTxUPik7IGVsc2VcbiAgICBpZiAodHlwZW9mIChpbnB1dCBhcyBQcm9taXNlTGlrZTxUPikudGhlbiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbVByb21pc2U8VD4oaW5wdXQgYXMgUHJvbWlzZUxpa2U8VD4pOyBlbHNlXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXk8VD4oaW5wdXQpO1xuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVHlwZSBvZiBpbnB1dCB0byBmcm9tKCkgbXVzdCBiZSBhbiBBcnJheSwgUHJvbWlzZSwgb3IgT2JzZXJ2YWJsZWApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyB0aGUgYXJndW1lbnRzIHRoYXQgeW91IGdpdmUgdG9cbiAgICogKm9mKiwgdGhlbiBjb21wbGV0ZXMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIG9mKDEsMiwzKVxuICAgKiAxMjN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSBhIFRoZSBmaXJzdCB2YWx1ZSB5b3Ugd2FudCB0byBlbWl0IGFzIGFuIGV2ZW50IG9uIHRoZSBzdHJlYW0uXG4gICAqIEBwYXJhbSBiIFRoZSBzZWNvbmQgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLiBPbmVcbiAgICogb3IgbW9yZSBvZiB0aGVzZSB2YWx1ZXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG9mPFQ+KC4uLml0ZW1zOiBBcnJheTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXk8VD4oaXRlbXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIGFycmF5IHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCBzeW5jaHJvbm91c2x5XG4gICAqIGFsbCB0aGUgaXRlbXMgaW4gdGhlIGFycmF5LCBhbmQgdGhlbiBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZnJvbUFycmF5KFsxLDIsM10pXG4gICAqIDEyM3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21BcnJheTxUPihhcnJheTogQXJyYXk8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tQXJyYXk8VD4oYXJyYXkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIHByb21pc2UgdG8gYSBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gd2lsbCBlbWl0IHRoZSByZXNvbHZlZFxuICAgKiB2YWx1ZSBvZiB0aGUgcHJvbWlzZSwgYW5kIHRoZW4gY29tcGxldGUuIEhvd2V2ZXIsIGlmIHRoZSBwcm9taXNlIGlzXG4gICAqIHJlamVjdGVkLCB0aGUgc3RyZWFtIHdpbGwgZW1pdCB0aGUgY29ycmVzcG9uZGluZyBlcnJvci5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZnJvbVByb21pc2UoIC0tLS00MiApXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tNDJ8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvbWlzZUxpa2V9IHByb21pc2UgVGhlIHByb21pc2UgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbVByb21pc2U8VD4ocHJvbWlzZTogUHJvbWlzZUxpa2U8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tUHJvbWlzZTxUPihwcm9taXNlKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYW4gT2JzZXJ2YWJsZSBpbnRvIGEgU3RyZWFtLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7YW55fSBvYnNlcnZhYmxlIFRoZSBvYnNlcnZhYmxlIHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21PYnNlcnZhYmxlPFQ+KG9iczoge3N1YnNjcmliZTogYW55fSk6IFN0cmVhbTxUPiB7XG4gICAgaWYgKChvYnMgYXMgU3RyZWFtPFQ+KS5lbmRXaGVuKSByZXR1cm4gb2JzIGFzIFN0cmVhbTxUPjtcbiAgICBjb25zdCBvID0gdHlwZW9mIG9ic1skJG9ic2VydmFibGVdID09PSAnZnVuY3Rpb24nID8gb2JzWyQkb2JzZXJ2YWJsZV0oKSA6IG9icztcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbU9ic2VydmFibGUobykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzdHJlYW0gdGhhdCBwZXJpb2RpY2FsbHkgZW1pdHMgaW5jcmVtZW50YWwgbnVtYmVycywgZXZlcnlcbiAgICogYHBlcmlvZGAgbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAgICAgcGVyaW9kaWMoMTAwMClcbiAgICogLS0tMC0tLTEtLS0yLS0tMy0tLTQtLS0uLi5cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHBlcmlvZCBUaGUgaW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzIHRvIHVzZSBhcyBhIHJhdGUgb2ZcbiAgICogZW1pc3Npb24uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBwZXJpb2RpYyhwZXJpb2Q6IG51bWJlcik6IFN0cmVhbTxudW1iZXI+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxudW1iZXI+KG5ldyBQZXJpb2RpYyhwZXJpb2QpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCbGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgZW1pdHRpbmcgZXZlbnRzIGZyb20gYWxsIG9mIHRoZW1cbiAgICogY29uY3VycmVudGx5LlxuICAgKlxuICAgKiAqbWVyZ2UqIHRha2VzIG11bHRpcGxlIHN0cmVhbXMgYXMgYXJndW1lbnRzLCBhbmQgY3JlYXRlcyBhIHN0cmVhbSB0aGF0XG4gICAqIGJlaGF2ZXMgbGlrZSBlYWNoIG9mIHRoZSBhcmd1bWVudCBzdHJlYW1zLCBpbiBwYXJhbGxlbC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS1cbiAgICogLS0tLWEtLS0tLWItLS0tYy0tLWQtLS0tLS1cbiAgICogICAgICAgICAgICBtZXJnZVxuICAgKiAtLTEtYS0tMi0tYi0tMy1jLS0tZC0tNC0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBtZXJnZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIG1lcmdlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy4gVHdvXG4gICAqIG9yIG1vcmUgc3RyZWFtcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgbWVyZ2U6IE1lcmdlU2lnbmF0dXJlID0gZnVuY3Rpb24gbWVyZ2UoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55PihuZXcgTWVyZ2Uoc3RyZWFtcykpO1xuICB9IGFzIE1lcmdlU2lnbmF0dXJlO1xuXG4gIC8qKlxuICAgKiBDb21iaW5lcyBtdWx0aXBsZSBpbnB1dCBzdHJlYW1zIHRvZ2V0aGVyIHRvIHJldHVybiBhIHN0cmVhbSB3aG9zZSBldmVudHNcbiAgICogYXJlIGFycmF5cyB0aGF0IGNvbGxlY3QgdGhlIGxhdGVzdCBldmVudHMgZnJvbSBlYWNoIGlucHV0IHN0cmVhbS5cbiAgICpcbiAgICogKmNvbWJpbmUqIGludGVybmFsbHkgcmVtZW1iZXJzIHRoZSBtb3N0IHJlY2VudCBldmVudCBmcm9tIGVhY2ggb2YgdGhlIGlucHV0XG4gICAqIHN0cmVhbXMuIFdoZW4gYW55IG9mIHRoZSBpbnB1dCBzdHJlYW1zIGVtaXRzIGFuIGV2ZW50LCB0aGF0IGV2ZW50IHRvZ2V0aGVyXG4gICAqIHdpdGggYWxsIHRoZSBvdGhlciBzYXZlZCBldmVudHMgYXJlIGNvbWJpbmVkIGludG8gYW4gYXJyYXkuIFRoYXQgYXJyYXkgd2lsbFxuICAgKiBiZSBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBJdCdzIGVzc2VudGlhbGx5IGEgd2F5IG9mIGpvaW5pbmcgdG9nZXRoZXJcbiAgICogdGhlIGV2ZW50cyBmcm9tIG11bHRpcGxlIHN0cmVhbXMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gICAqIC0tLS1hLS0tLS1iLS0tLS1jLS1kLS0tLS0tXG4gICAqICAgICAgICAgIGNvbWJpbmVcbiAgICogLS0tLTFhLTJhLTJiLTNiLTNjLTNkLTRkLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gY29tYmluZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBNdWx0aXBsZSBzdHJlYW1zLCBub3QganVzdCB0d28sIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjb21iaW5lOiBDb21iaW5lU2lnbmF0dXJlID0gZnVuY3Rpb24gY29tYmluZSguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxBcnJheTxhbnk+PihuZXcgQ29tYmluZTxhbnk+KHN0cmVhbXMpKTtcbiAgfSBhcyBDb21iaW5lU2lnbmF0dXJlO1xuXG4gIHByb3RlY3RlZCBfbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogU3RyZWFtPFU+IHwgTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VT4obmV3IE1hcE9wPFQsIFU+KHByb2plY3QsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIHRocm91Z2ggYSBgcHJvamVjdGAgZnVuY3Rpb24sXG4gICAqIHRvIGdldCBhIFN0cmVhbSB0aGF0IGVtaXRzIHRob3NlIHRyYW5zZm9ybWVkIGV2ZW50cy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMy0tNS0tLS0tNy0tLS0tLVxuICAgKiAgICBtYXAoaSA9PiBpICogMTApXG4gICAqIC0tMTAtLTMwLTUwLS0tLTcwLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByb2plY3QgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gVWAgdGhhdCB0YWtlcyBldmVudFxuICAgKiBgdGAgb2YgdHlwZSBgVGAgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIGFuZCBwcm9kdWNlcyBhbiBldmVudCBvZiB0eXBlIGBVYCwgdG9cbiAgICogYmUgZW1pdHRlZCBvbiB0aGUgb3V0cHV0IFN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogU3RyZWFtPFU+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwKHByb2plY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0J3MgbGlrZSBgbWFwYCwgYnV0IHRyYW5zZm9ybXMgZWFjaCBpbnB1dCBldmVudCB0byBhbHdheXMgdGhlIHNhbWVcbiAgICogY29uc3RhbnQgdmFsdWUgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTMtLTUtLS0tLTctLS0tLVxuICAgKiAgICAgICBtYXBUbygxMClcbiAgICogLS0xMC0tMTAtMTAtLS0tMTAtLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gcHJvamVjdGVkVmFsdWUgQSB2YWx1ZSB0byBlbWl0IG9uIHRoZSBvdXRwdXQgU3RyZWFtIHdoZW5ldmVyIHRoZVxuICAgKiBpbnB1dCBTdHJlYW0gZW1pdHMgYW55IHZhbHVlLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBtYXBUbzxVPihwcm9qZWN0ZWRWYWx1ZTogVSk6IFN0cmVhbTxVPiB7XG4gICAgY29uc3QgcyA9IHRoaXMubWFwKCgpID0+IHByb2plY3RlZFZhbHVlKTtcbiAgICBjb25zdCBvcDogT3BlcmF0b3I8VCwgVT4gPSBzLl9wcm9kIGFzIE9wZXJhdG9yPFQsIFU+O1xuICAgIG9wLnR5cGUgPSAnbWFwVG8nO1xuICAgIHJldHVybiBzO1xuICB9XG5cbiAgZmlsdGVyPFMgZXh0ZW5kcyBUPihwYXNzZXM6ICh0OiBUKSA9PiB0IGlzIFMpOiBTdHJlYW08Uz47XG4gIGZpbHRlcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuKTogU3RyZWFtPFQ+O1xuICAvKipcbiAgICogT25seSBhbGxvd3MgZXZlbnRzIHRoYXQgcGFzcyB0aGUgdGVzdCBnaXZlbiBieSB0aGUgYHBhc3Nlc2AgYXJndW1lbnQuXG4gICAqXG4gICAqIEVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGlzIGdpdmVuIHRvIHRoZSBgcGFzc2VzYCBmdW5jdGlvbi4gSWYgdGhlXG4gICAqIGZ1bmN0aW9uIHJldHVybnMgYHRydWVgLCB0aGUgZXZlbnQgaXMgZm9yd2FyZGVkIHRvIHRoZSBvdXRwdXQgc3RyZWFtLFxuICAgKiBvdGhlcndpc2UgaXQgaXMgaWdub3JlZCBhbmQgbm90IGZvcndhcmRlZC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMi0tMy0tLS0tNC0tLS0tNS0tLTYtLTctOC0tXG4gICAqICAgICBmaWx0ZXIoaSA9PiBpICUgMiA9PT0gMClcbiAgICogLS0tLS0tMi0tLS0tLS0tNC0tLS0tLS0tLTYtLS0tOC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwYXNzZXMgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gYm9vbGVhbmAgdGhhdCB0YWtlc1xuICAgKiBhbiBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gYW5kIGNoZWNrcyBpZiBpdCBwYXNzZXMsIGJ5IHJldHVybmluZyBhXG4gICAqIGJvb2xlYW4uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGZpbHRlcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuKTogU3RyZWFtPFQ+IHtcbiAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICBpZiAocCBpbnN0YW5jZW9mIEZpbHRlcilcbiAgICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGaWx0ZXI8VD4oXG4gICAgICAgIGFuZCgocCBhcyBGaWx0ZXI8VD4pLmYsIHBhc3NlcyksXG4gICAgICAgIChwIGFzIEZpbHRlcjxUPikuaW5zXG4gICAgICApKTtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRmlsdGVyPFQ+KHBhc3NlcywgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIExldHMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSBwYXNzIHRvIHRoZVxuICAgKiBvdXRwdXQgc3RyZWFtLCB0aGVuIG1ha2VzIHRoZSBvdXRwdXQgc3RyZWFtIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICogICAgdGFrZSgzKVxuICAgKiAtLWEtLS1iLS1jfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCBIb3cgbWFueSBldmVudHMgdG8gYWxsb3cgZnJvbSB0aGUgaW5wdXQgc3RyZWFtXG4gICAqIGJlZm9yZSBjb21wbGV0aW5nIHRoZSBvdXRwdXQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICB0YWtlKGFtb3VudDogbnVtYmVyKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IFRha2U8VD4oYW1vdW50LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogSWdub3JlcyB0aGUgZmlyc3QgYGFtb3VudGAgbWFueSBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtLCBhbmQgdGhlblxuICAgKiBhZnRlciB0aGF0IHN0YXJ0cyBmb3J3YXJkaW5nIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dFxuICAgKiBzdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLS0tZC0tLWUtLVxuICAgKiAgICAgICBkcm9wKDMpXG4gICAqIC0tLS0tLS0tLS0tLS0tZC0tLWUtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCBIb3cgbWFueSBldmVudHMgdG8gaWdub3JlIGZyb20gdGhlIGlucHV0IHN0cmVhbVxuICAgKiBiZWZvcmUgZm9yd2FyZGluZyBhbGwgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSB0byB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZHJvcChhbW91bnQ6IG51bWJlcik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERyb3A8VD4oYW1vdW50LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiB0aGUgaW5wdXQgc3RyZWFtIGNvbXBsZXRlcywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBlbWl0IHRoZSBsYXN0IGV2ZW50XG4gICAqIGVtaXR0ZWQgYnkgdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW4gd2lsbCBhbHNvIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS1kLS0tLXxcbiAgICogICAgICAgbGFzdCgpXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tZHxcbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGxhc3QoKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgTGFzdDxUPih0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogUHJlcGVuZHMgdGhlIGdpdmVuIGBpbml0aWFsYCB2YWx1ZSB0byB0aGUgc2VxdWVuY2Ugb2YgZXZlbnRzIGVtaXR0ZWQgYnkgdGhlXG4gICAqIGlucHV0IHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXNcbiAgICogYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tMS0tLTItLS0tLTMtLS1cbiAgICogICBzdGFydFdpdGgoMClcbiAgICogMC0tMS0tLTItLS0tLTMtLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBpbml0aWFsIFRoZSB2YWx1ZSBvciBldmVudCB0byBwcmVwZW5kLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBzdGFydFdpdGgoaW5pdGlhbDogVCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4obmV3IFN0YXJ0V2l0aDxUPih0aGlzLCBpbml0aWFsKSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlcyBhbm90aGVyIHN0cmVhbSB0byBkZXRlcm1pbmUgd2hlbiB0byBjb21wbGV0ZSB0aGUgY3VycmVudCBzdHJlYW0uXG4gICAqXG4gICAqIFdoZW4gdGhlIGdpdmVuIGBvdGhlcmAgc3RyZWFtIGVtaXRzIGFuIGV2ZW50IG9yIGNvbXBsZXRlcywgdGhlIG91dHB1dFxuICAgKiBzdHJlYW0gd2lsbCBjb21wbGV0ZS4gQmVmb3JlIHRoYXQgaGFwcGVucywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBiZWhhdmVzXG4gICAqIGxpa2UgdGhlIGlucHV0IHN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tMS0tLTItLS0tLTMtLTQtLS0tNS0tLS02LS0tXG4gICAqICAgZW5kV2hlbiggLS0tLS0tLS1hLS1iLS18IClcbiAgICogLS0tMS0tLTItLS0tLTMtLTQtLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBvdGhlciBTb21lIG90aGVyIHN0cmVhbSB0aGF0IGlzIHVzZWQgdG8ga25vdyB3aGVuIHNob3VsZCB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbSBvZiB0aGlzIG9wZXJhdG9yIGNvbXBsZXRlLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBFbmRXaGVuPFQ+KG90aGVyLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogXCJGb2xkc1wiIHRoZSBzdHJlYW0gb250byBpdHNlbGYuXG4gICAqXG4gICAqIENvbWJpbmVzIGV2ZW50cyBmcm9tIHRoZSBwYXN0IHRocm91Z2hvdXRcbiAgICogdGhlIGVudGlyZSBleGVjdXRpb24gb2YgdGhlIGlucHV0IHN0cmVhbSwgYWxsb3dpbmcgeW91IHRvIGFjY3VtdWxhdGUgdGhlbVxuICAgKiB0b2dldGhlci4gSXQncyBlc3NlbnRpYWxseSBsaWtlIGBBcnJheS5wcm90b3R5cGUucmVkdWNlYC4gVGhlIHJldHVybmVkXG4gICAqIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXMgYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICpcbiAgICogVGhlIG91dHB1dCBzdHJlYW0gc3RhcnRzIGJ5IGVtaXR0aW5nIHRoZSBgc2VlZGAgd2hpY2ggeW91IGdpdmUgYXMgYXJndW1lbnQuXG4gICAqIFRoZW4sIHdoZW4gYW4gZXZlbnQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpdCBpcyBjb21iaW5lZCB3aXRoIHRoYXRcbiAgICogc2VlZCB2YWx1ZSB0aHJvdWdoIHRoZSBgYWNjdW11bGF0ZWAgZnVuY3Rpb24sIGFuZCB0aGUgb3V0cHV0IHZhbHVlIGlzXG4gICAqIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBzdHJlYW0uIGBmb2xkYCByZW1lbWJlcnMgdGhhdCBvdXRwdXQgdmFsdWUgYXMgYGFjY2BcbiAgICogKFwiYWNjdW11bGF0b3JcIiksIGFuZCB0aGVuIHdoZW4gYSBuZXcgaW5wdXQgZXZlbnQgYHRgIGhhcHBlbnMsIGBhY2NgIHdpbGwgYmVcbiAgICogY29tYmluZWQgd2l0aCB0aGF0IHRvIHByb2R1Y2UgdGhlIG5ldyBgYWNjYCBhbmQgc28gZm9ydGguXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLS0tLTEtLS0tLTEtLTItLS0tMS0tLS0xLS0tLS0tXG4gICAqICAgZm9sZCgoYWNjLCB4KSA9PiBhY2MgKyB4LCAzKVxuICAgKiAzLS0tLS00LS0tLS01LS03LS0tLTgtLS0tOS0tLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gYWNjdW11bGF0ZSBBIGZ1bmN0aW9uIG9mIHR5cGUgYChhY2M6IFIsIHQ6IFQpID0+IFJgIHRoYXRcbiAgICogdGFrZXMgdGhlIHByZXZpb3VzIGFjY3VtdWxhdGVkIHZhbHVlIGBhY2NgIGFuZCB0aGUgaW5jb21pbmcgZXZlbnQgZnJvbSB0aGVcbiAgICogaW5wdXQgc3RyZWFtIGFuZCBwcm9kdWNlcyB0aGUgbmV3IGFjY3VtdWxhdGVkIHZhbHVlLlxuICAgKiBAcGFyYW0gc2VlZCBUaGUgaW5pdGlhbCBhY2N1bXVsYXRlZCB2YWx1ZSwgb2YgdHlwZSBgUmAuXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIGZvbGQ8Uj4oYWNjdW11bGF0ZTogKGFjYzogUiwgdDogVCkgPT4gUiwgc2VlZDogUik6IE1lbW9yeVN0cmVhbTxSPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08Uj4obmV3IEZvbGQ8VCwgUj4oYWNjdW11bGF0ZSwgc2VlZCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcGxhY2VzIGFuIGVycm9yIHdpdGggYW5vdGhlciBzdHJlYW0uXG4gICAqXG4gICAqIFdoZW4gKGFuZCBpZikgYW4gZXJyb3IgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpbnN0ZWFkIG9mIGZvcndhcmRpbmdcbiAgICogdGhhdCBlcnJvciB0byB0aGUgb3V0cHV0IHN0cmVhbSwgKnJlcGxhY2VFcnJvciogd2lsbCBjYWxsIHRoZSBgcmVwbGFjZWBcbiAgICogZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgc3RyZWFtIHRoYXQgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCByZXBsaWNhdGUuXG4gICAqIEFuZCwgaW4gY2FzZSB0aGF0IG5ldyBzdHJlYW0gYWxzbyBlbWl0cyBhbiBlcnJvciwgYHJlcGxhY2VgIHdpbGwgYmUgY2FsbGVkXG4gICAqIGFnYWluIHRvIGdldCBhbm90aGVyIHN0cmVhbSB0byBzdGFydCByZXBsaWNhdGluZy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMi0tLS0tMy0tNC0tLS0tWFxuICAgKiAgIHJlcGxhY2VFcnJvciggKCkgPT4gLS0xMC0tfCApXG4gICAqIC0tMS0tLTItLS0tLTMtLTQtLS0tLS0tLTEwLS18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXBsYWNlIEEgZnVuY3Rpb24gb2YgdHlwZSBgKGVycikgPT4gU3RyZWFtYCB0aGF0IHRha2VzXG4gICAqIHRoZSBlcnJvciB0aGF0IG9jY3VycmVkIG9uIHRoZSBpbnB1dCBzdHJlYW0gb3Igb24gdGhlIHByZXZpb3VzIHJlcGxhY2VtZW50XG4gICAqIHN0cmVhbSBhbmQgcmV0dXJucyBhIG5ldyBzdHJlYW0uIFRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgYmVoYXZlIGxpa2UgdGhlXG4gICAqIHN0cmVhbSB0aGF0IHRoaXMgZnVuY3Rpb24gcmV0dXJucy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgcmVwbGFjZUVycm9yKHJlcGxhY2U6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IFJlcGxhY2VFcnJvcjxUPihyZXBsYWNlLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogRmxhdHRlbnMgYSBcInN0cmVhbSBvZiBzdHJlYW1zXCIsIGhhbmRsaW5nIG9ubHkgb25lIG5lc3RlZCBzdHJlYW0gYXQgYSB0aW1lXG4gICAqIChubyBjb25jdXJyZW5jeSkuXG4gICAqXG4gICAqIElmIHRoZSBpbnB1dCBzdHJlYW0gaXMgYSBzdHJlYW0gdGhhdCBlbWl0cyBzdHJlYW1zLCB0aGVuIHRoaXMgb3BlcmF0b3Igd2lsbFxuICAgKiByZXR1cm4gYW4gb3V0cHV0IHN0cmVhbSB3aGljaCBpcyBhIGZsYXQgc3RyZWFtOiBlbWl0cyByZWd1bGFyIGV2ZW50cy4gVGhlXG4gICAqIGZsYXR0ZW5pbmcgaGFwcGVucyB3aXRob3V0IGNvbmN1cnJlbmN5LiBJdCB3b3JrcyBsaWtlIHRoaXM6IHdoZW4gdGhlIGlucHV0XG4gICAqIHN0cmVhbSBlbWl0cyBhIG5lc3RlZCBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIHN0YXJ0IGltaXRhdGluZyB0aGF0IG5lc3RlZFxuICAgKiBvbmUuIEhvd2V2ZXIsIGFzIHNvb24gYXMgdGhlIG5leHQgbmVzdGVkIHN0cmVhbSBpcyBlbWl0dGVkIG9uIHRoZSBpbnB1dFxuICAgKiBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIGZvcmdldCB0aGUgcHJldmlvdXMgbmVzdGVkIG9uZSBpdCB3YXMgaW1pdGF0aW5nLCBhbmRcbiAgICogd2lsbCBzdGFydCBpbWl0YXRpbmcgdGhlIG5ldyBuZXN0ZWQgb25lLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLSstLS0tLS0tLSstLS0tLS0tLS0tLS0tLS1cbiAgICogICBcXCAgICAgICAgXFxcbiAgICogICAgXFwgICAgICAgLS0tLTEtLS0tMi0tLTMtLVxuICAgKiAgICAtLWEtLWItLS0tYy0tLS1kLS0tLS0tLS1cbiAgICogICAgICAgICAgIGZsYXR0ZW5cbiAgICogLS0tLS1hLS1iLS0tLS0tMS0tLS0yLS0tMy0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBmbGF0dGVuPFI+KHRoaXM6IFN0cmVhbTxTdHJlYW08Uj4+KTogVCB7XG4gICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08Uj4obmV3IEZsYXR0ZW4odGhpcykpIGFzIFQgJiBTdHJlYW08Uj47XG4gIH1cblxuICAvKipcbiAgICogUGFzc2VzIHRoZSBpbnB1dCBzdHJlYW0gdG8gYSBjdXN0b20gb3BlcmF0b3IsIHRvIHByb2R1Y2UgYW4gb3V0cHV0IHN0cmVhbS5cbiAgICpcbiAgICogKmNvbXBvc2UqIGlzIGEgaGFuZHkgd2F5IG9mIHVzaW5nIGFuIGV4aXN0aW5nIGZ1bmN0aW9uIGluIGEgY2hhaW5lZCBzdHlsZS5cbiAgICogSW5zdGVhZCBvZiB3cml0aW5nIGBvdXRTdHJlYW0gPSBmKGluU3RyZWFtKWAgeW91IGNhbiB3cml0ZVxuICAgKiBgb3V0U3RyZWFtID0gaW5TdHJlYW0uY29tcG9zZShmKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9wZXJhdG9yIEEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHN0cmVhbSBhcyBpbnB1dCBhbmRcbiAgICogcmV0dXJucyBhIHN0cmVhbSBhcyB3ZWxsLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBjb21wb3NlPFU+KG9wZXJhdG9yOiAoc3RyZWFtOiBTdHJlYW08VD4pID0+IFUpOiBVIHtcbiAgICByZXR1cm4gb3BlcmF0b3IodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sIGJ1dCBhbHNvXG4gICAqIHJlbWVtYmVycyB0aGUgbW9zdCByZWNlbnQgZXZlbnQgdGhhdCBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIHNvIHRoYXQgYVxuICAgKiBuZXdseSBhZGRlZCBsaXN0ZW5lciB3aWxsIGltbWVkaWF0ZWx5IHJlY2VpdmUgdGhhdCBtZW1vcmlzZWQgZXZlbnQuXG4gICAqXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHJlbWVtYmVyKCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4obmV3IFJlbWVtYmVyPFQ+KHRoaXMpKTtcbiAgfVxuXG4gIGRlYnVnKCk6IFN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogc3RyaW5nKTogU3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiAodDogVCkgPT4gYW55KTogU3RyZWFtPFQ+O1xuICAvKipcbiAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgaWRlbnRpY2FsbHkgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sXG4gICAqIGJ1dCBhbHNvIHJ1bnMgYSBgc3B5YCBmdW5jdGlvbiBmb3IgZWFjaCBldmVudCwgdG8gaGVscCB5b3UgZGVidWcgeW91ciBhcHAuXG4gICAqXG4gICAqICpkZWJ1ZyogdGFrZXMgYSBgc3B5YCBmdW5jdGlvbiBhcyBhcmd1bWVudCwgYW5kIHJ1bnMgdGhhdCBmb3IgZWFjaCBldmVudFxuICAgKiBoYXBwZW5pbmcgb24gdGhlIGlucHV0IHN0cmVhbS4gSWYgeW91IGRvbid0IHByb3ZpZGUgdGhlIGBzcHlgIGFyZ3VtZW50LFxuICAgKiB0aGVuICpkZWJ1Zyogd2lsbCBqdXN0IGBjb25zb2xlLmxvZ2AgZWFjaCBldmVudC4gVGhpcyBoZWxwcyB5b3UgdG9cbiAgICogdW5kZXJzdGFuZCB0aGUgZmxvdyBvZiBldmVudHMgdGhyb3VnaCBzb21lIG9wZXJhdG9yIGNoYWluLlxuICAgKlxuICAgKiBQbGVhc2Ugbm90ZSB0aGF0IGlmIHRoZSBvdXRwdXQgc3RyZWFtIGhhcyBubyBsaXN0ZW5lcnMsIHRoZW4gaXQgd2lsbCBub3RcbiAgICogc3RhcnQsIHdoaWNoIG1lYW5zIGBzcHlgIHdpbGwgbmV2ZXIgcnVuIGJlY2F1c2Ugbm8gYWN0dWFsIGV2ZW50IGhhcHBlbnMgaW5cbiAgICogdGhhdCBjYXNlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tNC0tXG4gICAqICAgICAgICAgZGVidWdcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLTQtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGFiZWxPclNweSBBIHN0cmluZyB0byB1c2UgYXMgdGhlIGxhYmVsIHdoZW4gcHJpbnRpbmdcbiAgICogZGVidWcgaW5mb3JtYXRpb24gb24gdGhlIGNvbnNvbGUsIG9yIGEgJ3NweScgZnVuY3Rpb24gdGhhdCB0YWtlcyBhbiBldmVudFxuICAgKiBhcyBhcmd1bWVudCwgYW5kIGRvZXMgbm90IG5lZWQgdG8gcmV0dXJuIGFueXRoaW5nLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBkZWJ1ZyhsYWJlbE9yU3B5Pzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IERlYnVnPFQ+KHRoaXMsIGxhYmVsT3JTcHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAqaW1pdGF0ZSogY2hhbmdlcyB0aGlzIGN1cnJlbnQgU3RyZWFtIHRvIGVtaXQgdGhlIHNhbWUgZXZlbnRzIHRoYXQgdGhlXG4gICAqIGBvdGhlcmAgZ2l2ZW4gU3RyZWFtIGRvZXMuIFRoaXMgbWV0aG9kIHJldHVybnMgbm90aGluZy5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgZXhpc3RzIHRvIGFsbG93IG9uZSB0aGluZzogKipjaXJjdWxhciBkZXBlbmRlbmN5IG9mIHN0cmVhbXMqKi5cbiAgICogRm9yIGluc3RhbmNlLCBsZXQncyBpbWFnaW5lIHRoYXQgZm9yIHNvbWUgcmVhc29uIHlvdSBuZWVkIHRvIGNyZWF0ZSBhXG4gICAqIGNpcmN1bGFyIGRlcGVuZGVuY3kgd2hlcmUgc3RyZWFtIGBmaXJzdCRgIGRlcGVuZHMgb24gc3RyZWFtIGBzZWNvbmQkYFxuICAgKiB3aGljaCBpbiB0dXJuIGRlcGVuZHMgb24gYGZpcnN0JGA6XG4gICAqXG4gICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgKiBgYGBqc1xuICAgKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAgICpcbiAgICogdmFyIGZpcnN0JCA9IHNlY29uZCQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBIb3dldmVyLCB0aGF0IGlzIGludmFsaWQgSmF2YVNjcmlwdCwgYmVjYXVzZSBgc2Vjb25kJGAgaXMgdW5kZWZpbmVkXG4gICAqIG9uIHRoZSBmaXJzdCBsaW5lLiBUaGlzIGlzIGhvdyAqaW1pdGF0ZSogY2FuIGhlbHAgc29sdmUgaXQ6XG4gICAqXG4gICAqIGBgYGpzXG4gICAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICAgKlxuICAgKiB2YXIgc2Vjb25kUHJveHkkID0geHMuY3JlYXRlKCk7XG4gICAqIHZhciBmaXJzdCQgPSBzZWNvbmRQcm94eSQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAqIHNlY29uZFByb3h5JC5pbWl0YXRlKHNlY29uZCQpO1xuICAgKiBgYGBcbiAgICpcbiAgICogV2UgY3JlYXRlIGBzZWNvbmRQcm94eSRgIGJlZm9yZSB0aGUgb3RoZXJzLCBzbyBpdCBjYW4gYmUgdXNlZCBpbiB0aGVcbiAgICogZGVjbGFyYXRpb24gb2YgYGZpcnN0JGAuIFRoZW4sIGFmdGVyIGJvdGggYGZpcnN0JGAgYW5kIGBzZWNvbmQkYCBhcmVcbiAgICogZGVmaW5lZCwgd2UgaG9vayBgc2Vjb25kUHJveHkkYCB3aXRoIGBzZWNvbmQkYCB3aXRoIGBpbWl0YXRlKClgIHRvIHRlbGxcbiAgICogdGhhdCB0aGV5IGFyZSBcInRoZSBzYW1lXCIuIGBpbWl0YXRlYCB3aWxsIG5vdCB0cmlnZ2VyIHRoZSBzdGFydCBvZiBhbnlcbiAgICogc3RyZWFtLCBpdCBqdXN0IGJpbmRzIGBzZWNvbmRQcm94eSRgIGFuZCBgc2Vjb25kJGAgdG9nZXRoZXIuXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgaXMgYW4gZXhhbXBsZSB3aGVyZSBgaW1pdGF0ZSgpYCBpcyBpbXBvcnRhbnQgaW4gQ3ljbGUuanNcbiAgICogYXBwbGljYXRpb25zLiBBIHBhcmVudCBjb21wb25lbnQgY29udGFpbnMgc29tZSBjaGlsZCBjb21wb25lbnRzLiBBIGNoaWxkXG4gICAqIGhhcyBhbiBhY3Rpb24gc3RyZWFtIHdoaWNoIGlzIGdpdmVuIHRvIHRoZSBwYXJlbnQgdG8gZGVmaW5lIGl0cyBzdGF0ZTpcbiAgICpcbiAgICogPCEtLSBza2lwLWV4YW1wbGUgLS0+XG4gICAqIGBgYGpzXG4gICAqIGNvbnN0IGNoaWxkQWN0aW9uUHJveHkkID0geHMuY3JlYXRlKCk7XG4gICAqIGNvbnN0IHBhcmVudCA9IFBhcmVudCh7Li4uc291cmNlcywgY2hpbGRBY3Rpb24kOiBjaGlsZEFjdGlvblByb3h5JH0pO1xuICAgKiBjb25zdCBjaGlsZEFjdGlvbiQgPSBwYXJlbnQuc3RhdGUkLm1hcChzID0+IHMuY2hpbGQuYWN0aW9uJCkuZmxhdHRlbigpO1xuICAgKiBjaGlsZEFjdGlvblByb3h5JC5pbWl0YXRlKGNoaWxkQWN0aW9uJCk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBOb3RlLCB0aG91Z2gsIHRoYXQgKipgaW1pdGF0ZSgpYCBkb2VzIG5vdCBzdXBwb3J0IE1lbW9yeVN0cmVhbXMqKi4gSWYgd2VcbiAgICogd291bGQgYXR0ZW1wdCB0byBpbWl0YXRlIGEgTWVtb3J5U3RyZWFtIGluIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSwgd2Ugd291bGRcbiAgICogZWl0aGVyIGdldCBhIHJhY2UgY29uZGl0aW9uICh3aGVyZSB0aGUgc3ltcHRvbSB3b3VsZCBiZSBcIm5vdGhpbmcgaGFwcGVuc1wiKVxuICAgKiBvciBhbiBpbmZpbml0ZSBjeWNsaWMgZW1pc3Npb24gb2YgdmFsdWVzLiBJdCdzIHVzZWZ1bCB0byB0aGluayBhYm91dFxuICAgKiBNZW1vcnlTdHJlYW1zIGFzIGNlbGxzIGluIGEgc3ByZWFkc2hlZXQuIEl0IGRvZXNuJ3QgbWFrZSBhbnkgc2Vuc2UgdG9cbiAgICogZGVmaW5lIGEgc3ByZWFkc2hlZXQgY2VsbCBgQTFgIHdpdGggYSBmb3JtdWxhIHRoYXQgZGVwZW5kcyBvbiBgQjFgIGFuZFxuICAgKiBjZWxsIGBCMWAgZGVmaW5lZCB3aXRoIGEgZm9ybXVsYSB0aGF0IGRlcGVuZHMgb24gYEExYC5cbiAgICpcbiAgICogSWYgeW91IGZpbmQgeW91cnNlbGYgd2FudGluZyB0byB1c2UgYGltaXRhdGUoKWAgd2l0aCBhXG4gICAqIE1lbW9yeVN0cmVhbSwgeW91IHNob3VsZCByZXdvcmsgeW91ciBjb2RlIGFyb3VuZCBgaW1pdGF0ZSgpYCB0byB1c2UgYVxuICAgKiBTdHJlYW0gaW5zdGVhZC4gTG9vayBmb3IgdGhlIHN0cmVhbSBpbiB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeSB0aGF0XG4gICAqIHJlcHJlc2VudHMgYW4gZXZlbnQgc3RyZWFtLCBhbmQgdGhhdCB3b3VsZCBiZSBhIGNhbmRpZGF0ZSBmb3IgY3JlYXRpbmcgYVxuICAgKiBwcm94eSBTdHJlYW0gd2hpY2ggdGhlbiBpbWl0YXRlcyB0aGUgdGFyZ2V0IFN0cmVhbS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJlYW19IHRhcmdldCBUaGUgb3RoZXIgc3RyZWFtIHRvIGltaXRhdGUgb24gdGhlIGN1cnJlbnQgb25lLiBNdXN0XG4gICAqIG5vdCBiZSBhIE1lbW9yeVN0cmVhbS5cbiAgICovXG4gIGltaXRhdGUodGFyZ2V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIE1lbW9yeVN0cmVhbSB3YXMgZ2l2ZW4gdG8gaW1pdGF0ZSgpLCBidXQgaXQgb25seSAnICtcbiAgICAgICdzdXBwb3J0cyBhIFN0cmVhbS4gUmVhZCBtb3JlIGFib3V0IHRoaXMgcmVzdHJpY3Rpb24gaGVyZTogJyArXG4gICAgICAnaHR0cHM6Ly9naXRodWIuY29tL3N0YWx0ei94c3RyZWFtI2ZhcScpO1xuICAgIHRoaXMuX3RhcmdldCA9IHRhcmdldDtcbiAgICBmb3IgKGxldCBpbHMgPSB0aGlzLl9pbHMsIE4gPSBpbHMubGVuZ3RoLCBpID0gMDsgaSA8IE47IGkrKykgdGFyZ2V0Ll9hZGQoaWxzW2ldKTtcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiB2YWx1ZSB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIFRoZSBcIm5leHRcIiB2YWx1ZSB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIGxpc3RlbmVycyBvZlxuICAgKiB0aGlzIFN0cmVhbS5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kTmV4dCh2YWx1ZTogVCkge1xuICAgIHRoaXMuX24odmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIGdpdmVuIGVycm9yIHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gZXJyb3IgVGhlIGVycm9yIHlvdSB3YW50IHRvIGJyb2FkY2FzdCB0byBhbGwgdGhlIGxpc3RlbmVycyBvZlxuICAgKiB0aGlzIFN0cmVhbS5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kRXJyb3IoZXJyb3I6IGFueSkge1xuICAgIHRoaXMuX2UoZXJyb3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIFwiY29tcGxldGVkXCIgZXZlbnQgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZENvbXBsZXRlKCkge1xuICAgIHRoaXMuX2MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgXCJkZWJ1Z1wiIGxpc3RlbmVyIHRvIHRoZSBzdHJlYW0uIFRoZXJlIGNhbiBvbmx5IGJlIG9uZSBkZWJ1Z1xuICAgKiBsaXN0ZW5lciwgdGhhdCdzIHdoeSB0aGlzIGlzICdzZXREZWJ1Z0xpc3RlbmVyJy4gVG8gcmVtb3ZlIHRoZSBkZWJ1Z1xuICAgKiBsaXN0ZW5lciwganVzdCBjYWxsIHNldERlYnVnTGlzdGVuZXIobnVsbCkuXG4gICAqXG4gICAqIEEgZGVidWcgbGlzdGVuZXIgaXMgbGlrZSBhbnkgb3RoZXIgbGlzdGVuZXIuIFRoZSBvbmx5IGRpZmZlcmVuY2UgaXMgdGhhdCBhXG4gICAqIGRlYnVnIGxpc3RlbmVyIGlzIFwic3RlYWx0aHlcIjogaXRzIHByZXNlbmNlL2Fic2VuY2UgZG9lcyBub3QgdHJpZ2dlciB0aGVcbiAgICogc3RhcnQvc3RvcCBvZiB0aGUgc3RyZWFtIChvciB0aGUgcHJvZHVjZXIgaW5zaWRlIHRoZSBzdHJlYW0pLiBUaGlzIGlzXG4gICAqIHVzZWZ1bCBzbyB5b3UgY2FuIGluc3BlY3Qgd2hhdCBpcyBnb2luZyBvbiB3aXRob3V0IGNoYW5naW5nIHRoZSBiZWhhdmlvclxuICAgKiBvZiB0aGUgcHJvZ3JhbS4gSWYgeW91IGhhdmUgYW4gaWRsZSBzdHJlYW0gYW5kIHlvdSBhZGQgYSBub3JtYWwgbGlzdGVuZXIgdG9cbiAgICogaXQsIHRoZSBzdHJlYW0gd2lsbCBzdGFydCBleGVjdXRpbmcuIEJ1dCBpZiB5b3Ugc2V0IGEgZGVidWcgbGlzdGVuZXIgb24gYW5cbiAgICogaWRsZSBzdHJlYW0sIGl0IHdvbid0IHN0YXJ0IGV4ZWN1dGluZyAobm90IHVudGlsIHRoZSBmaXJzdCBub3JtYWwgbGlzdGVuZXJcbiAgICogaXMgYWRkZWQpLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIHdlIGRvbid0IHJlY29tbWVuZCB1c2luZyB0aGlzIG1ldGhvZCB0byBidWlsZCBhcHBcbiAgICogbG9naWMuIEluIGZhY3QsIGluIG1vc3QgY2FzZXMgdGhlIGRlYnVnIG9wZXJhdG9yIHdvcmtzIGp1c3QgZmluZS4gT25seSB1c2VcbiAgICogdGhpcyBvbmUgaWYgeW91IGtub3cgd2hhdCB5b3UncmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXI8VD59IGxpc3RlbmVyXG4gICAqL1xuICBzZXREZWJ1Z0xpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+PiB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgICB0aGlzLl9kbCA9IE5PIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2QgPSB0cnVlO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9uID0gbGlzdGVuZXIubmV4dCB8fCBub29wO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fYyA9IGxpc3RlbmVyLmNvbXBsZXRlIHx8IG5vb3A7XG4gICAgICB0aGlzLl9kbCA9IGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdHJlYW08VD4gZXh0ZW5kcyBTdHJlYW08VD4ge1xuICBwcml2YXRlIF92OiBUO1xuICBwcml2YXRlIF9oYXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29uc3RydWN0b3IocHJvZHVjZXI6IEludGVybmFsUHJvZHVjZXI8VD4pIHtcbiAgICBzdXBlcihwcm9kdWNlcik7XG4gIH1cblxuICBfbih4OiBUKSB7XG4gICAgdGhpcy5fdiA9IHg7XG4gICAgdGhpcy5faGFzID0gdHJ1ZTtcbiAgICBzdXBlci5fbih4KTtcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHtcbiAgICAgIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fc3RvcElEKTtcbiAgICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIH0gZWxzZSBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTsgZWxzZSB7XG4gICAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICAgIGlmIChwICE9PSBOTykgcC5fc3RhcnQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgdGhpcy5faGFzID0gZmFsc2U7XG4gICAgc3VwZXIuX3N0b3BOb3coKTtcbiAgfVxuXG4gIF94KCk6IHZvaWQge1xuICAgIHRoaXMuX2hhcyA9IGZhbHNlO1xuICAgIHN1cGVyLl94KCk7XG4gIH1cblxuICBtYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiB0aGlzLl9tYXAocHJvamVjdCkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgbWFwVG88VT4ocHJvamVjdGVkVmFsdWU6IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiBzdXBlci5tYXBUbyhwcm9qZWN0ZWRWYWx1ZSkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgdGFrZShhbW91bnQ6IG51bWJlcik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnRha2UoYW1vdW50KSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLmVuZFdoZW4ob3RoZXIpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIHJlcGxhY2VFcnJvcihyZXBsYWNlOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnJlcGxhY2VFcnJvcihyZXBsYWNlKSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICByZW1lbWJlcigpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGVidWcoKTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiBzdHJpbmcpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6ICh0OiBUKSA9PiBhbnkpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5kZWJ1ZyhsYWJlbE9yU3B5IGFzIGFueSkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG59XG5cbmV4cG9ydCB7Tk8sIE5PX0lMfTtcbmNvbnN0IHhzID0gU3RyZWFtO1xudHlwZSB4czxUPiA9IFN0cmVhbTxUPjtcbmV4cG9ydCBkZWZhdWx0IHhzO1xuIiwiaW1wb3J0IHtydW59IGZyb20gJ0BjeWNsZS9ydW4nO1xuaW1wb3J0IHhzIGZyb20gJ3hzdHJlYW0nO1xuaW1wb3J0IHttYWtlUk9TRHJpdmVyfSBmcm9tICcuL21ha2VST1NEcml2ZXInO1xuXG5mdW5jdGlvbiBtYWluKHNvdXJjZXMpIHtcbiAgLy8gYWRhcHRlZCBmcm9tIGZyb21cbiAgLy8gICBodHRwczovL2dpdGh1Yi5jb20vUm9ib3RXZWJUb29scy9yb3NsaWJqcy9ibG9iL21hc3Rlci9leGFtcGxlcy9zaW1wbGUuaHRtbFxuXG4gIC8vIFB1Ymxpc2hpbmcgYSBUb3BpY1xuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS1cblxuICBjb25zdCB0b3BpYyQgPSB4cy5vZih7XG4gICAgdHlwZTogJ3RvcGljJyxcbiAgICB2YWx1ZToge1xuICAgICAgbmFtZTogJy9jbWRfdmVsJyxcbiAgICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgbGluZWFyIDoge1xuICAgICAgICAgIHggOiAwLjEsXG4gICAgICAgICAgeSA6IDAuMixcbiAgICAgICAgICB6IDogMC4zLFxuICAgICAgICB9LFxuICAgICAgICBhbmd1bGFyIDoge1xuICAgICAgICAgIHggOiAtMC4xLFxuICAgICAgICAgIHkgOiAtMC4yLFxuICAgICAgICAgIHogOiAtMC4zLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9KTtcblxuICAvL1N1YnNjcmliaW5nIHRvIGEgVG9waWNcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgc291cmNlcy5ST1NcbiAgICAuZmlsdGVyKHZhbHVlID0+IHZhbHVlLnR5cGUgPT09ICd0b3BpYycgJiYgdmFsdWUudmFsdWUubmFtZSA9PT0gJy9saXN0ZW5lcicpXG4gICAgLmFkZExpc3RlbmVyKHtcbiAgICAgIG5leHQ6IHZhbHVlID0+IHtcbiAgICAgICAgY29uc3QgdG9waWMgPSB2YWx1ZS52YWx1ZTtcbiAgICAgICAgY29uc29sZS5sb2coJ1JlY2VpdmVkIG1lc3NhZ2Ugb24gJyArIHRvcGljLm5hbWUgKyAnOiAnICsgdG9waWMubWVzc2FnZS5kYXRhKTtcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgLy8gQ2FsbGluZyBhIHNlcnZpY2VcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS1cblxuICBjb25zdCBzZXJ2aWNlJCA9IHhzLm9mKHtcbiAgICB0eXBlOiAnc2VydmljZScsXG4gICAgdmFsdWU6IHtcbiAgICAgIG5hbWU6ICcvYWRkX3R3b19pbnRzJyxcbiAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgYTogMSxcbiAgICAgICAgYjogMixcbiAgICAgIH0sXG4gICAgfVxuICB9KTtcblxuICBzb3VyY2VzLlJPU1xuICAgIC5maWx0ZXIodmFsdWUgPT4gdmFsdWUudHlwZSA9PT0gJ3NlcnZpY2UnICYmIHZhbHVlLnZhbHVlLm5hbWUgPT09ICcvYWRkX3R3b19pbnRzJylcbiAgICAubWFwKHZhbHVlID0+IHZhbHVlLnZhbHVlLnJlc3BvbnNlJCkuZmxhdHRlbigpLmFkZExpc3RlbmVyKHtcbiAgICAgIG5leHQ6IHJlc3VsdCA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdSZXN1bHQgZm9yIHNlcnZpY2UgY2FsbDogJyArIHJlc3VsdC5zdW0pO1xuICAgICAgfSxcbiAgICAgIGVycm9yOiBlcnIgPT4gY29uc29sZS5lcnJvcihlcnIpLFxuICAgIH0pO1xuXG4gIC8vIGFkYXB0ZWQgZnJvbSBmcm9tXG4gIC8vICAgaHR0cHM6Ly9naXRodWIuY29tL1JvYm90V2ViVG9vbHMvcm9zbGlianMvYmxvYi9tYXN0ZXIvZXhhbXBsZXMvZmlib25hY2NpLmh0bWxcblxuICAvLyBUaGUgQWN0aW9uQ2xpZW50XG4gIC8vIC0tLS0tLS0tLS0tLS0tLS1cblxuICBjb25zdCBhY3Rpb24kID0geHMucGVyaW9kaWMoMzAwMCkubWFwVG8oe1xuICAgIHR5cGU6ICdhY3Rpb24nLFxuICAgIHZhbHVlOiB7XG4gICAgICBuYW1lOiAnL2ZpYm9uYWNjaScsXG4gICAgICBnb2FsTWVzc2FnZToge1xuICAgICAgICBvcmRlcjogMVxuICAgICAgfSxcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IGZpYm9uYWNjaUNsaWVudCA9IHNvdXJjZXMuUk9TXG4gICAgLmZpbHRlcih2YWx1ZSA9PiB2YWx1ZS50eXBlID09PSAnYWN0aW9uJyAmJiB2YWx1ZS52YWx1ZS5uYW1lID09PSAnL2ZpYm9uYWNjaScpO1xuICBmaWJvbmFjY2lDbGllbnRcbiAgICAubWFwKHZhbHVlID0+IHZhbHVlLnZhbHVlLmZlZWRiYWNrJCkuZmxhdHRlbigpLmFkZExpc3RlbmVyKHtcbiAgICAgIG5leHQ6IGZlZWRiYWNrID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZlZWRiYWNrOiAnICsgZmVlZGJhY2suc2VxdWVuY2UpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGZpYm9uYWNjaUNsaWVudFxuICAgIC5tYXAodmFsdWUgPT4gdmFsdWUudmFsdWUucmVzdWx0JCkuZmxhdHRlbigpLmFkZExpc3RlbmVyKHtcbiAgICAgIG5leHQ6IHJlc3VsdCA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGaW5hbCBSZXN1bHQ6ICcgKyByZXN1bHQuc2VxdWVuY2UpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIGNvbnN0IHJvcyQgPSB4cy5tZXJnZSh0b3BpYyQsIHNlcnZpY2UkLCBhY3Rpb24kKTtcbiAgcmV0dXJuIHtcbiAgICBST1M6IHJvcyQsXG4gIH07XG59XG5cbnJ1bihtYWluLCB7XG4gIFJPUzogbWFrZVJPU0RyaXZlcih7XG4gICAgcm9zbGliOiB7dXJsOiAnd3M6Ly9sb2NhbGhvc3Q6OTA5MCd9LFxuICAgIHRvcGljczogW3tcbiAgICAgIG5hbWU6ICcvY21kX3ZlbCcsXG4gICAgICBtZXNzYWdlVHlwZTogJ2dlb21ldHJ5X21zZ3MvVHdpc3QnLFxuICAgIH0sIHtcbiAgICAgIG5hbWU6ICcvbGlzdGVuZXInLFxuICAgICAgbWVzc2FnZVR5cGU6ICdzdGRfbXNncy9TdHJpbmcnLFxuICAgIH1dLFxuICAgIHNlcnZpY2VzOiBbe1xuICAgICAgbmFtZSA6ICcvYWRkX3R3b19pbnRzJyxcbiAgICAgIHNlcnZpY2VUeXBlIDogJ3Jvc3B5X3R1dG9yaWFscy9BZGRUd29JbnRzJyxcbiAgICB9XSxcbiAgICBhY3Rpb25zOiBbe1xuICAgICAgc2VydmVyTmFtZSA6ICcvZmlib25hY2NpJyxcbiAgICAgIGFjdGlvbk5hbWUgOiAnYWN0aW9ubGliX3R1dG9yaWFscy9GaWJvbmFjY2lBY3Rpb24nLFxuICAgIH1dXG4gIH0pLFxufSk7XG4iLCJpbXBvcnQgUk9TTElCIGZyb20gJ3Jvc2xpYic7XG5pbXBvcnQgeHMgZnJvbSAneHN0cmVhbSc7XG5pbXBvcnQgZnJvbUV2ZW50IGZyb20gJ3hzdHJlYW0vZXh0cmEvZnJvbUV2ZW50JztcblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VST1NEcml2ZXIob3B0aW9ucykge1xuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgaWYgKCFvcHRpb25zLnRvcGljcykge1xuICAgIG9wdGlvbnMudG9waWNzID0gW107XG4gIH1cbiAgaWYgKCFvcHRpb25zLnNlcnZpY2VzKSB7XG4gICAgb3B0aW9ucy5zZXJ2aWNlcyA9IFtdO1xuICB9XG4gIGlmICghb3B0aW9ucy5hY3Rpb25zKSB7XG4gICAgb3B0aW9ucy5hY3Rpb25zID0gW107XG4gIH1cblxuICAvLyBGb3Igb3B0aW9ucy5yb3NsaWIsIHNlZVxuICAvLyAgIGh0dHBzOi8vZ2l0aHViLmNvbS9Sb2JvdFdlYlRvb2xzL3Jvc2xpYmpzL2Jsb2IvbWFzdGVyL3NyYy9jb3JlL1Jvcy5qcyNMMjYtTDMwXG4gIGNvbnN0IHJvcyA9IG5ldyBST1NMSUIuUm9zKG9wdGlvbnMucm9zbGliKTtcbiAgY29uc3QgdG9waWNzID0ge307XG4gIG9wdGlvbnMudG9waWNzLm1hcCh0b3BpY09wdGlvbnMgPT4ge1xuICAgIC8vIEZvciB0b3BpY09wdGlvbnMsIHNlZVxuICAgIC8vICAgaHR0cHM6Ly9naXRodWIuY29tL1JvYm90V2ViVG9vbHMvcm9zbGlianMvYmxvYi9tYXN0ZXIvc3JjL2NvcmUvVG9waWMuanMjTDE3LUwyNlxuICAgIHRvcGljc1t0b3BpY09wdGlvbnMubmFtZV0gPSBuZXcgUk9TTElCLlRvcGljKHtcbiAgICAgIC4uLnRvcGljT3B0aW9ucyxcbiAgICAgIHJvcyxcbiAgICB9KTtcbiAgfSk7XG4gIGNvbnN0IHNlcnZpY2VzID0ge307XG4gIG9wdGlvbnMuc2VydmljZXMubWFwKHNlcnZpY2VPcHRpb25zID0+IHtcbiAgICAvLyBGb3IgdG9waWNPcHRpb25zLCBzZWVcbiAgICAvLyAgIGh0dHBzOi8vZ2l0aHViLmNvbS9Sb2JvdFdlYlRvb2xzL3Jvc2xpYmpzL2Jsb2IvbWFzdGVyL3NyYy9jb3JlL1NlcnZpY2UuanMjTDE0LUwxN1xuICAgIHNlcnZpY2VzW3NlcnZpY2VPcHRpb25zLm5hbWVdID0gbmV3IFJPU0xJQi5TZXJ2aWNlKHtcbiAgICAgIC4uLnNlcnZpY2VPcHRpb25zLFxuICAgICAgcm9zLFxuICAgIH0pO1xuICB9KTtcbiAgY29uc3Qgc2VydmljZUNsaWVudCQgPSB4cy5jcmVhdGUoKTtcbiAgY29uc3QgYWN0aW9ucyA9IHt9O1xuICBvcHRpb25zLmFjdGlvbnMubWFwKGFjdGlvbk9wdGlvbnMgPT4ge1xuICAgIC8vIEZvciB0b3BpY09wdGlvbnMsIHNlZVxuICAgIC8vICAgaHR0cHM6Ly9naXRodWIuY29tL1JvYm90V2ViVG9vbHMvcm9zbGlianMvYmxvYi9tYXN0ZXIvc3JjL2FjdGlvbmxpYi9BY3Rpb25DbGllbnQuanMjTDIwLUwyNFxuICAgIGFjdGlvbnNbYWN0aW9uT3B0aW9ucy5zZXJ2ZXJOYW1lXSA9IG5ldyBST1NMSUIuQWN0aW9uQ2xpZW50KHtcbiAgICAgIC4uLmFjdGlvbk9wdGlvbnMsXG4gICAgICByb3MsXG4gICAgfSk7XG4gIH0pO1xuICAvLyBodHRwczovL2dpdGh1Yi5jb20vUm9ib3RXZWJUb29scy9yb3NsaWJqcy9ibG9iL21hc3Rlci9zcmMvYWN0aW9ubGliL0FjdGlvbkNsaWVudC5qcyNMMTQtTDE3XG4gIGNvbnN0IGFjdGlvbkNsaWVudCQgPSB4cy5jcmVhdGUoKTtcblxuICByZXR1cm4gZnVuY3Rpb24ob3V0Z29pbmckKSB7XG5cbiAgICBvdXRnb2luZyQuYWRkTGlzdGVuZXIoe1xuICAgICAgbmV4dDogb3V0Z29pbmcgPT4ge1xuICAgICAgICBzd2l0Y2ggKG91dGdvaW5nLnR5cGUpIHtcbiAgICAgICAgICBjYXNlICd0b3BpYyc6XG4gICAgICAgICAgICAvLyAvLyBFeGFtcGxlIG91dGdvaW5nIFwidG9waWNcIiB2YWx1ZVxuICAgICAgICAgICAgLy8gb3V0Z29pbmcgPSB7XG4gICAgICAgICAgICAvLyAgIHR5cGU6ICd0b3BpYycsXG4gICAgICAgICAgICAvLyAgIHZhbHVlOiB7XG4gICAgICAgICAgICAvLyAgICAgbmFtZTogJy9jbWRfdmVsJyxcbiAgICAgICAgICAgIC8vICAgICBtZXNzYWdlOiB7XG4gICAgICAgICAgICAvLyAgICAgICBsaW5lYXIgOiB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHggOiAwLjEsXG4gICAgICAgICAgICAvLyAgICAgICAgIHkgOiAwLjIsXG4gICAgICAgICAgICAvLyAgICAgICAgIHogOiAwLjMsXG4gICAgICAgICAgICAvLyAgICAgICB9LFxuICAgICAgICAgICAgLy8gICAgICAgYW5ndWxhciA6IHtcbiAgICAgICAgICAgIC8vICAgICAgICAgeCA6IC0wLjEsXG4gICAgICAgICAgICAvLyAgICAgICAgIHkgOiAtMC4yLFxuICAgICAgICAgICAgLy8gICAgICAgICB6IDogLTAuMyxcbiAgICAgICAgICAgIC8vICAgICAgIH0sXG4gICAgICAgICAgICAvLyAgICAgfSxcbiAgICAgICAgICAgIC8vICAgfSxcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIHRvcGljc1tvdXRnb2luZy52YWx1ZS5uYW1lXS5wdWJsaXNoKG91dGdvaW5nLnZhbHVlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnc2VydmljZSc6XG4gICAgICAgICAgICAvLyAvLyBFeGFtcGxlIG91dGdvaW5nIFwic2VydmljZVwiIHZhbHVlXG4gICAgICAgICAgICAvLyBpbmNvbWluZyA9IHtcbiAgICAgICAgICAgIC8vICAgdHlwZTogJ3NlcnZpY2UnLFxuICAgICAgICAgICAgLy8gICB2YWx1ZToge1xuICAgICAgICAgICAgLy8gICAgIG5hbWU6ICcvYWRkX3R3b19pbnRzJyxcbiAgICAgICAgICAgIC8vICAgICByZXF1ZXN0OiB7XG4gICAgICAgICAgICAvLyAgICAgICBhOiAxLFxuICAgICAgICAgICAgLy8gICAgICAgYjogMixcbiAgICAgICAgICAgIC8vICAgICB9LFxuICAgICAgICAgICAgLy8gICB9LFxuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgc2VydmljZUNsaWVudCQuc2hhbWVmdWxseVNlbmROZXh0KHtcbiAgICAgICAgICAgICAgbmFtZTogb3V0Z29pbmcudmFsdWUubmFtZSxcbiAgICAgICAgICAgICAgcmVzcG9uc2UkOiB4cy5jcmVhdGUoe1xuICAgICAgICAgICAgICAgIHN0YXJ0OiBsaXN0ZW5lciA9PiB7XG4gICAgICAgICAgICAgICAgICBzZXJ2aWNlc1tvdXRnb2luZy52YWx1ZS5uYW1lXS5jYWxsU2VydmljZShcbiAgICAgICAgICAgICAgICAgICAgbmV3IFJPU0xJQi5TZXJ2aWNlUmVxdWVzdChvdXRnb2luZy52YWx1ZS5yZXF1ZXN0KSxcbiAgICAgICAgICAgICAgICAgICAgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIubmV4dChyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIuY29tcGxldGUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgbGlzdGVuZXIuZXJyb3IuYmluZChsaXN0ZW5lciksXG4gICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc3RvcDogKCkgPT4ge30sXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfSk7IFxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnYWN0aW9uJzpcbiAgICAgICAgICAgIC8vIC8vIEV4YW1wbGUgb3V0Z29pbmcgXCJhY3Rpb25cIiB2YWx1ZVxuICAgICAgICAgICAgLy8gaW5jb21pbmcgPSB7XG4gICAgICAgICAgICAvLyAgIHR5cGU6ICdhY3Rpb24nLFxuICAgICAgICAgICAgLy8gICB2YWx1ZToge1xuICAgICAgICAgICAgLy8gICAgIG5hbWU6ICcvZmlib25hY2NpJyxcbiAgICAgICAgICAgIC8vICAgICBnb2FsTWVzc2FnZToge1xuICAgICAgICAgICAgLy8gICAgICAgb3JkZXI6IDcsXG4gICAgICAgICAgICAvLyAgICAgfSxcbiAgICAgICAgICAgIC8vICAgfSxcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIGNvbnN0IGdvYWwgPSBuZXcgUk9TTElCLkdvYWwoe1xuICAgICAgICAgICAgICBhY3Rpb25DbGllbnQgOiBhY3Rpb25zW291dGdvaW5nLnZhbHVlLm5hbWVdLFxuICAgICAgICAgICAgICBnb2FsTWVzc2FnZSA6IG91dGdvaW5nLnZhbHVlLmdvYWxNZXNzYWdlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBhY3Rpb25DbGllbnQkLnNoYW1lZnVsbHlTZW5kTmV4dCh7XG4gICAgICAgICAgICAgIG5hbWU6IG91dGdvaW5nLnZhbHVlLm5hbWUsXG4gICAgICAgICAgICAgIHRpbWVvdXQkOiBmcm9tRXZlbnQoZ29hbCwgJ3RpbWVvdXQnKSxcbiAgICAgICAgICAgICAgc3RhdHVzJDogZnJvbUV2ZW50KGdvYWwsICdzdGF0dXMnKSxcbiAgICAgICAgICAgICAgZmVlZGJhY2skOiBmcm9tRXZlbnQoZ29hbCwgJ2ZlZWRiYWNrJyksXG4gICAgICAgICAgICAgIHJlc3VsdCQ6IGZyb21FdmVudChnb2FsLCAncmVzdWx0JyksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGdvYWwuc2VuZCgpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignVW5rbm93biBvdXRnb2luZy50eXBlJywgb3V0Z29pbmcudHlwZSk7XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBlcnJvcjogKCkgPT4ge30sXG4gICAgICBjb21wbGV0ZTogKCkgPT4ge30sXG4gICAgfSk7XG5cbiAgICBjb25zdCBpbmNvbWluZyQgPSB4cy5jcmVhdGUoe1xuICAgICAgc3RhcnQ6IGxpc3RlbmVyID0+IHtcbiAgICAgICAgT2JqZWN0LmtleXModG9waWNzKS5tYXAodG9waWMgPT4ge1xuICAgICAgICAgIHRvcGljc1t0b3BpY10uc3Vic2NyaWJlKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIC8vIC8vIEV4YW1wbGUgaW5jb21pbmcgXCJ0b3BpY1wiIHZhbHVlXG4gICAgICAgICAgICAvLyBpbmNvbWluZyA9IHtcbiAgICAgICAgICAgIC8vICAgdHlwZTogJ3RvcGljJyxcbiAgICAgICAgICAgIC8vICAgdmFsdWU6IHtcbiAgICAgICAgICAgIC8vICAgICBuYW1lOiAnL2NtZF92ZWwnLFxuICAgICAgICAgICAgLy8gICAgIG1lc3NhZ2U6IHtcbiAgICAgICAgICAgIC8vICAgICAgIGxpbmVhciA6IHtcbiAgICAgICAgICAgIC8vICAgICAgICAgeCA6IDAuMSxcbiAgICAgICAgICAgIC8vICAgICAgICAgeSA6IDAuMixcbiAgICAgICAgICAgIC8vICAgICAgICAgeiA6IDAuMyxcbiAgICAgICAgICAgIC8vICAgICAgIH0sXG4gICAgICAgICAgICAvLyAgICAgICBhbmd1bGFyIDoge1xuICAgICAgICAgICAgLy8gICAgICAgICB4IDogLTAuMSxcbiAgICAgICAgICAgIC8vICAgICAgICAgeSA6IC0wLjIsXG4gICAgICAgICAgICAvLyAgICAgICAgIHogOiAtMC4zLFxuICAgICAgICAgICAgLy8gICAgICAgfSxcbiAgICAgICAgICAgIC8vICAgICB9LFxuICAgICAgICAgICAgLy8gICB9LFxuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgbGlzdGVuZXIubmV4dCh7dHlwZTogJ3RvcGljJywgdmFsdWU6IHtuYW1lOiB0b3BpYywgbWVzc2FnZX19KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2VydmljZUNsaWVudCQuYWRkTGlzdGVuZXIoe1xuICAgICAgICAgIG5leHQ6IHNlcnZpY2VDbGllbnQgPT4ge1xuICAgICAgICAgICAgLy8gLy8gRXhhbXBsZSBpbmNvbWluZyBcInNlcnZpY2VcIiB2YWx1ZVxuICAgICAgICAgICAgLy8gaW5jb21pbmcgPSB7XG4gICAgICAgICAgICAvLyAgIHR5cGU6ICdzZXJ2aWNlJyxcbiAgICAgICAgICAgIC8vICAgdmFsdWU6IHtcbiAgICAgICAgICAgIC8vICAgICBuYW1lOiAnL2FkZF90d29faW50cycsXG4gICAgICAgICAgICAvLyAgICAgcmVzcG9uc2UkOiAvLyBhbiB4c3RyZWFtIHRoYXQgZW1pdHMgYSByZXNwb25zZSBvYmplY3RcbiAgICAgICAgICAgIC8vICAgfSxcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIGxpc3RlbmVyLm5leHQoe3R5cGU6ICdzZXJ2aWNlJywgdmFsdWU6IHNlcnZpY2VDbGllbnR9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGFjdGlvbkNsaWVudCQuYWRkTGlzdGVuZXIoe1xuICAgICAgICAgIG5leHQ6IGFjdGlvbkNsaWVudCA9PiB7XG4gICAgICAgICAgICAvLyAvLyBFeGFtcGxlIGluY29taW5nIFwiYWN0aW9uXCIgdmFsdWVcbiAgICAgICAgICAgIC8vIGluY29taW5nID0ge1xuICAgICAgICAgICAgLy8gICB0eXBlOiAnYWN0aW9uJyxcbiAgICAgICAgICAgIC8vICAgdmFsdWU6IHtcbiAgICAgICAgICAgIC8vICAgICBuYW1lOiAnL2ZpYm9uYWNjaScsXG4gICAgICAgICAgICAvLyAgICAgcmVzcG9uc2UkOiAvLyBhbiB4c3RyZWFtIHRoYXQgZW1pdHMgdGltZW91dFxuICAgICAgICAgICAgLy8gICAgIHN0YXR1cyQ6IC8vIGFuIHhzdHJlYW0gdGhhdCBlbWl0cyBzdGF0dXNcbiAgICAgICAgICAgIC8vICAgICBmZWVkYmFjayQ6IC8vIGFuIHhzdHJlYW0gdGhhdCBlbWl0cyBmZWVkYmFja1xuICAgICAgICAgICAgLy8gICAgIHJlc3VsdCQ6IC8vIGFuIHhzdHJlYW0gdGhhdCBlbWl0cyByZXN1bHRzXG4gICAgICAgICAgICAvLyAgIH0sXG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICBsaXN0ZW5lci5uZXh0KHt0eXBlOiAnYWN0aW9uJywgdmFsdWU6IGFjdGlvbkNsaWVudH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgfSxcbiAgICAgIHN0b3A6ICgpID0+IHtcbiAgICAgICAgT2JqZWN0LmtleXModG9waWNzKS5tYXAodG9waWMgPT4ge1xuICAgICAgICAgIHRvcGljc1t0b3BpY10udW5zdWJzY3JpYmUoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH0pO1xuICBcbiAgICByZXR1cm4gaW5jb21pbmckO1xuICB9XG59Il19

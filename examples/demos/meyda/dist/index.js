(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
var meyda_1 = __importDefault(require("meyda"));
var adapt_1 = require("@cycle/run/lib/adapt");
function makeMeydaDriver(options) {
    if (options === void 0) { options = {}; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw 'Browser API navigator.mediaDevices.getUserMedia not available';
    }
    // NOTE: https://github.com/meyda/meyda/blob/master/src/meyda-wa.js#L59
    //   which is not implemented as explained in documentation:
    //   https://meyda.js.org/reference/module-meyda.html
    if (!options.featureExtractors) {
        options.featureExtractors = ['rms'];
    }
    var context = new AudioContext();
    var meyda = null;
    return function () {
        var source$ = xstream_1.default.create({
            start: function (listener) {
                navigator.mediaDevices.getUserMedia({
                    'audio': true,
                    'video': false,
                }).then(function (stream) {
                    var source = context.createMediaStreamSource(stream);
                    meyda = meyda_1.default.createMeydaAnalyzer(__assign({}, options, { startImmediately: true, audioContext: context, source: source, callback: function (features) { return listener.next(features); } }));
                }).catch(function (err) {
                    console.error(err);
                    throw 'Failed to create Meyda analyzer';
                });
            },
            stop: function () { },
        });
        return adapt_1.adapt(source$);
    };
}
exports.makeMeydaDriver = makeMeydaDriver;

},{"@cycle/run/lib/adapt":2,"meyda":3,"xstream":6}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["Meyda"] = factory();
	else
		root["Meyda"] = factory();
})(window, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/assert/assert.js":
/*!***************************************!*\
  !*** ./node_modules/assert/assert.js ***!
  \***************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function(global) {

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = __webpack_require__(/*! util/ */ "./node_modules/util/util.js");
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/dct/index.js":
/*!***********************************!*\
  !*** ./node_modules/dct/index.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./src/dct.js */ "./node_modules/dct/src/dct.js");


/***/ }),

/***/ "./node_modules/dct/src/dct.js":
/*!*************************************!*\
  !*** ./node_modules/dct/src/dct.js ***!
  \*************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/*===========================================================================*\
 * Discrete Cosine Transform
 *
 * (c) Vail Systems. Joshua Jung and Ben Bryan. 2015
 *
 * This code is not designed to be highly optimized but as an educational
 * tool to understand the Mel-scale and its related coefficients used in
 * human speech analysis.
\*===========================================================================*/
cosMap = null;

// Builds a cosine map for the given input size. This allows multiple input sizes to be memoized automagically
// if you want to run the DCT over and over.
var memoizeCosines = function(N) {
  cosMap = cosMap || {};
  cosMap[N] = new Array(N*N);

  var PI_N = Math.PI / N;

  for (var k = 0; k < N; k++) {
    for (var n = 0; n < N; n++) {
      cosMap[N][n + (k * N)] = Math.cos(PI_N * (n + 0.5) * k);
    }
  }
};

function dct(signal, scale) {
  var L = signal.length;
  scale = scale || 2;

  if (!cosMap || !cosMap[L]) memoizeCosines(L);

  var coefficients = signal.map(function () {return 0;});

  return coefficients.map(function (__, ix) {
    return scale * signal.reduce(function (prev, cur, ix_, arr) {
      return prev + (cur * cosMap[L][ix_ + (ix * L)]);
    }, 0);
  });
};

module.exports = dct;


/***/ }),

/***/ "./node_modules/fftjs/dist/fft.js":
/*!****************************************!*\
  !*** ./node_modules/fftjs/dist/fft.js ***!
  \****************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var utils = __webpack_require__(/*! ./utils */ "./node_modules/fftjs/dist/utils.js");

// real to complex fft
var fft = function fft(signal) {

  var complexSignal = {};

  if (signal.real === undefined || signal.imag === undefined) {
    complexSignal = utils.constructComplexArray(signal);
  } else {
    complexSignal.real = signal.real.slice();
    complexSignal.imag = signal.imag.slice();
  }

  var N = complexSignal.real.length;
  var logN = Math.log2(N);

  if (Math.round(logN) != logN) throw new Error('Input size must be a power of 2.');

  if (complexSignal.real.length != complexSignal.imag.length) {
    throw new Error('Real and imaginary components must have the same length.');
  }

  var bitReversedIndices = utils.bitReverseArray(N);

  // sort array
  var ordered = {
    'real': [],
    'imag': []
  };

  for (var i = 0; i < N; i++) {
    ordered.real[bitReversedIndices[i]] = complexSignal.real[i];
    ordered.imag[bitReversedIndices[i]] = complexSignal.imag[i];
  }

  for (var _i = 0; _i < N; _i++) {
    complexSignal.real[_i] = ordered.real[_i];
    complexSignal.imag[_i] = ordered.imag[_i];
  }
  // iterate over the number of stages
  for (var n = 1; n <= logN; n++) {
    var currN = Math.pow(2, n);

    // find twiddle factors
    for (var k = 0; k < currN / 2; k++) {
      var twiddle = utils.euler(k, currN);

      // on each block of FT, implement the butterfly diagram
      for (var m = 0; m < N / currN; m++) {
        var currEvenIndex = currN * m + k;
        var currOddIndex = currN * m + k + currN / 2;

        var currEvenIndexSample = {
          'real': complexSignal.real[currEvenIndex],
          'imag': complexSignal.imag[currEvenIndex]
        };
        var currOddIndexSample = {
          'real': complexSignal.real[currOddIndex],
          'imag': complexSignal.imag[currOddIndex]
        };

        var odd = utils.multiply(twiddle, currOddIndexSample);

        var subtractionResult = utils.subtract(currEvenIndexSample, odd);
        complexSignal.real[currOddIndex] = subtractionResult.real;
        complexSignal.imag[currOddIndex] = subtractionResult.imag;

        var additionResult = utils.add(odd, currEvenIndexSample);
        complexSignal.real[currEvenIndex] = additionResult.real;
        complexSignal.imag[currEvenIndex] = additionResult.imag;
      }
    }
  }

  return complexSignal;
};

// complex to real ifft
var ifft = function ifft(signal) {

  if (signal.real === undefined || signal.imag === undefined) {
    throw new Error("IFFT only accepts a complex input.");
  }

  var N = signal.real.length;

  var complexSignal = {
    'real': [],
    'imag': []
  };

  //take complex conjugate in order to be able to use the regular FFT for IFFT
  for (var i = 0; i < N; i++) {
    var currentSample = {
      'real': signal.real[i],
      'imag': signal.imag[i]
    };

    var conjugateSample = utils.conj(currentSample);
    complexSignal.real[i] = conjugateSample.real;
    complexSignal.imag[i] = conjugateSample.imag;
  }

  //compute
  var X = fft(complexSignal);

  //normalize
  complexSignal.real = X.real.map(function (val) {
    return val / N;
  });

  complexSignal.imag = X.imag.map(function (val) {
    return val / N;
  });

  return complexSignal;
};

module.exports = {
  fft: fft,
  ifft: ifft
};

/***/ }),

/***/ "./node_modules/fftjs/dist/utils.js":
/*!******************************************!*\
  !*** ./node_modules/fftjs/dist/utils.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// memoization of the reversal of different lengths.

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var memoizedReversal = {};
var memoizedZeroBuffers = {};

var constructComplexArray = function constructComplexArray(signal) {
  var complexSignal = {};

  complexSignal.real = signal.real === undefined ? signal.slice() : signal.real.slice();

  var bufferSize = complexSignal.real.length;

  if (memoizedZeroBuffers[bufferSize] === undefined) {
    memoizedZeroBuffers[bufferSize] = Array.apply(null, Array(bufferSize)).map(Number.prototype.valueOf, 0);
  }

  complexSignal.imag = memoizedZeroBuffers[bufferSize].slice();

  return complexSignal;
};

var bitReverseArray = function bitReverseArray(N) {
  if (memoizedReversal[N] === undefined) {
    var maxBinaryLength = (N - 1).toString(2).length; //get the binary length of the largest index.
    var templateBinary = '0'.repeat(maxBinaryLength); //create a template binary of that length.
    var reversed = {};
    for (var n = 0; n < N; n++) {
      var currBinary = n.toString(2); //get binary value of current index.

      //prepend zeros from template to current binary. This makes binary values of all indices have the same length.
      currBinary = templateBinary.substr(currBinary.length) + currBinary;

      currBinary = [].concat(_toConsumableArray(currBinary)).reverse().join(''); //reverse
      reversed[n] = parseInt(currBinary, 2); //convert to decimal
    }
    memoizedReversal[N] = reversed; //save
  }
  return memoizedReversal[N];
};

// complex multiplication
var multiply = function multiply(a, b) {
  return {
    'real': a.real * b.real - a.imag * b.imag,
    'imag': a.real * b.imag + a.imag * b.real
  };
};

// complex addition
var add = function add(a, b) {
  return {
    'real': a.real + b.real,
    'imag': a.imag + b.imag
  };
};

// complex subtraction
var subtract = function subtract(a, b) {
  return {
    'real': a.real - b.real,
    'imag': a.imag - b.imag
  };
};

// euler's identity e^x = cos(x) + sin(x)
var euler = function euler(kn, N) {
  var x = -2 * Math.PI * kn / N;
  return { 'real': Math.cos(x), 'imag': Math.sin(x) };
};

// complex conjugate
var conj = function conj(a) {
  a.imag *= -1;
  return a;
};

module.exports = {
  bitReverseArray: bitReverseArray,
  multiply: multiply,
  add: add,
  subtract: subtract,
  euler: euler,
  conj: conj,
  constructComplexArray: constructComplexArray
};

/***/ }),

/***/ "./node_modules/inherits/inherits_browser.js":
/*!***************************************************!*\
  !*** ./node_modules/inherits/inherits_browser.js ***!
  \***************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}


/***/ }),

/***/ "./node_modules/process/browser.js":
/*!*****************************************!*\
  !*** ./node_modules/process/browser.js ***!
  \*****************************************/
/*! no static exports found */
/***/ (function(module, exports) {

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


/***/ }),

/***/ "./node_modules/util/support/isBufferBrowser.js":
/*!******************************************************!*\
  !*** ./node_modules/util/support/isBufferBrowser.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}

/***/ }),

/***/ "./node_modules/util/util.js":
/*!***********************************!*\
  !*** ./node_modules/util/util.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global, process) {// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = __webpack_require__(/*! ./support/isBuffer */ "./node_modules/util/support/isBufferBrowser.js");

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = __webpack_require__(/*! inherits */ "./node_modules/inherits/inherits_browser.js");

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js"), __webpack_require__(/*! ./../process/browser.js */ "./node_modules/process/browser.js")))

/***/ }),

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || Function("return this")() || (1, eval)("this");
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./src/extractors/chroma.js":
/*!**********************************!*\
  !*** ./src/extractors/chroma.js ***!
  \**********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* harmony default export */ __webpack_exports__["default"] = (function (args) {
  if (_typeof(args.ampSpectrum) !== 'object') {
    throw new TypeError('Valid ampSpectrum is required to generate chroma');
  }

  if (_typeof(args.chromaFilterBank) !== 'object') {
    throw new TypeError('Valid chromaFilterBank is required to generate chroma');
  }

  var chromagram = args.chromaFilterBank.map(function (row, i) {
    return args.ampSpectrum.reduce(function (acc, v, j) {
      return acc + v * row[j];
    }, 0);
  });
  var maxVal = Math.max.apply(Math, _toConsumableArray(chromagram));
  return maxVal ? chromagram.map(function (v) {
    return v / maxVal;
  }) : chromagram;
});

/***/ }),

/***/ "./src/extractors/energy.js":
/*!**********************************!*\
  !*** ./src/extractors/energy.js ***!
  \**********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var assert__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! assert */ "./node_modules/assert/assert.js");
/* harmony import */ var assert__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(assert__WEBPACK_IMPORTED_MODULE_0__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }


/* harmony default export */ __webpack_exports__["default"] = (function () {
  if (_typeof(arguments[0].signal) !== 'object') {
    throw new TypeError();
  }

  var energy = 0;

  for (var i = 0; i < arguments[0].signal.length; i++) {
    energy += Math.pow(Math.abs(arguments[0].signal[i]), 2);
  }

  return energy;
});

/***/ }),

/***/ "./src/extractors/extractorUtilities.js":
/*!**********************************************!*\
  !*** ./src/extractors/extractorUtilities.js ***!
  \**********************************************/
/*! exports provided: mu */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "mu", function() { return mu; });
function mu(i, amplitudeSpect) {
  var numerator = 0;
  var denominator = 0;

  for (var k = 0; k < amplitudeSpect.length; k++) {
    numerator += Math.pow(k, i) * Math.abs(amplitudeSpect[k]);
    denominator += amplitudeSpect[k];
  }

  return numerator / denominator;
}

/***/ }),

/***/ "./src/extractors/loudness.js":
/*!************************************!*\
  !*** ./src/extractors/loudness.js ***!
  \************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* harmony default export */ __webpack_exports__["default"] = (function (args) {
  if (_typeof(args.ampSpectrum) !== 'object' || _typeof(args.barkScale) !== 'object') {
    throw new TypeError();
  }

  var NUM_BARK_BANDS = 24;
  var specific = new Float32Array(NUM_BARK_BANDS);
  var total = 0;
  var normalisedSpectrum = args.ampSpectrum;
  var bbLimits = new Int32Array(NUM_BARK_BANDS + 1);
  bbLimits[0] = 0;
  var currentBandEnd = args.barkScale[normalisedSpectrum.length - 1] / NUM_BARK_BANDS;
  var currentBand = 1;

  for (var i = 0; i < normalisedSpectrum.length; i++) {
    while (args.barkScale[i] > currentBandEnd) {
      bbLimits[currentBand++] = i;
      currentBandEnd = currentBand * args.barkScale[normalisedSpectrum.length - 1] / NUM_BARK_BANDS;
    }
  }

  bbLimits[NUM_BARK_BANDS] = normalisedSpectrum.length - 1; //process

  for (var _i = 0; _i < NUM_BARK_BANDS; _i++) {
    var sum = 0;

    for (var j = bbLimits[_i]; j < bbLimits[_i + 1]; j++) {
      sum += normalisedSpectrum[j];
    }

    specific[_i] = Math.pow(sum, 0.23);
  } //get total loudness


  for (var _i2 = 0; _i2 < specific.length; _i2++) {
    total += specific[_i2];
  }

  return {
    specific: specific,
    total: total
  };
});

/***/ }),

/***/ "./src/extractors/mfcc.js":
/*!********************************!*\
  !*** ./src/extractors/mfcc.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _powerSpectrum__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./powerSpectrum */ "./src/extractors/powerSpectrum.js");
/* harmony import */ var _utilities__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./../utilities */ "./src/utilities.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }





var dct = __webpack_require__(/*! dct */ "./node_modules/dct/index.js");

/* harmony default export */ __webpack_exports__["default"] = (function (args) {
  if (_typeof(args.ampSpectrum) !== 'object') {
    throw new TypeError('Valid ampSpectrum is required to generate MFCC');
  }

  if (_typeof(args.melFilterBank) !== 'object') {
    throw new TypeError('Valid melFilterBank is required to generate MFCC');
  }

  var numberOfMFCCCoefficients = Math.min(40, Math.max(1, args.numberOfMFCCCoefficients || 13)); // Tutorial from:
  // http://practicalcryptography.com/miscellaneous/machine-learning
  // /guide-mel-frequency-cepstral-coefficients-mfccs/

  var powSpec = Object(_powerSpectrum__WEBPACK_IMPORTED_MODULE_0__["default"])(args);
  var numFilters = args.melFilterBank.length;
  var filtered = Array(numFilters);

  if (numFilters < numberOfMFCCCoefficients) {
    throw new Error("Insufficient filter bank for requested number of coefficients");
  }

  var loggedMelBands = new Float32Array(numFilters);

  for (var i = 0; i < loggedMelBands.length; i++) {
    filtered[i] = new Float32Array(args.bufferSize / 2);
    loggedMelBands[i] = 0;

    for (var j = 0; j < args.bufferSize / 2; j++) {
      //point-wise multiplication between power spectrum and filterbanks.
      filtered[i][j] = args.melFilterBank[i][j] * powSpec[j]; //summing up all of the coefficients into one array

      loggedMelBands[i] += filtered[i][j];
    } //log each coefficient.


    loggedMelBands[i] = Math.log(loggedMelBands[i] + 1);
  } //dct


  var loggedMelBandsArray = Array.prototype.slice.call(loggedMelBands);
  var mfccs = dct(loggedMelBandsArray).slice(0, numberOfMFCCCoefficients);
  return mfccs;
});

/***/ }),

/***/ "./src/extractors/perceptualSharpness.js":
/*!***********************************************!*\
  !*** ./src/extractors/perceptualSharpness.js ***!
  \***********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _loudness__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./loudness */ "./src/extractors/loudness.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }


/* harmony default export */ __webpack_exports__["default"] = (function () {
  if (_typeof(arguments[0].signal) !== 'object') {
    throw new TypeError();
  }

  var loudnessValue = Object(_loudness__WEBPACK_IMPORTED_MODULE_0__["default"])(arguments[0]);
  var spec = loudnessValue.specific;
  var output = 0;

  for (var i = 0; i < spec.length; i++) {
    if (i < 15) {
      output += (i + 1) * spec[i + 1];
    } else {
      output += 0.066 * Math.exp(0.171 * (i + 1));
    }
  }

  output *= 0.11 / loudnessValue.total;
  return output;
});

/***/ }),

/***/ "./src/extractors/perceptualSpread.js":
/*!********************************************!*\
  !*** ./src/extractors/perceptualSpread.js ***!
  \********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _loudness__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./loudness */ "./src/extractors/loudness.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }


/* harmony default export */ __webpack_exports__["default"] = (function () {
  if (_typeof(arguments[0].signal) !== 'object') {
    throw new TypeError();
  }

  var loudnessValue = Object(_loudness__WEBPACK_IMPORTED_MODULE_0__["default"])(arguments[0]);
  var max = 0;

  for (var i = 0; i < loudnessValue.specific.length; i++) {
    if (loudnessValue.specific[i] > max) {
      max = loudnessValue.specific[i];
    }
  }

  var spread = Math.pow((loudnessValue.total - max) / loudnessValue.total, 2);
  return spread;
});

/***/ }),

/***/ "./src/extractors/powerSpectrum.js":
/*!*****************************************!*\
  !*** ./src/extractors/powerSpectrum.js ***!
  \*****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* harmony default export */ __webpack_exports__["default"] = (function () {
  if (_typeof(arguments[0].ampSpectrum) !== 'object') {
    throw new TypeError();
  }

  var powerSpectrum = new Float32Array(arguments[0].ampSpectrum.length);

  for (var i = 0; i < powerSpectrum.length; i++) {
    powerSpectrum[i] = Math.pow(arguments[0].ampSpectrum[i], 2);
  }

  return powerSpectrum;
});

/***/ }),

/***/ "./src/extractors/rms.js":
/*!*******************************!*\
  !*** ./src/extractors/rms.js ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* harmony default export */ __webpack_exports__["default"] = (function (args) {
  if (_typeof(args.signal) !== 'object') {
    throw new TypeError();
  }

  var rms = 0;

  for (var i = 0; i < args.signal.length; i++) {
    rms += Math.pow(args.signal[i], 2);
  }

  rms = rms / args.signal.length;
  rms = Math.sqrt(rms);
  return rms;
});

/***/ }),

/***/ "./src/extractors/spectralCentroid.js":
/*!********************************************!*\
  !*** ./src/extractors/spectralCentroid.js ***!
  \********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _extractorUtilities__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./extractorUtilities */ "./src/extractors/extractorUtilities.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }


/* harmony default export */ __webpack_exports__["default"] = (function () {
  if (_typeof(arguments[0].ampSpectrum) !== 'object') {
    throw new TypeError();
  }

  return Object(_extractorUtilities__WEBPACK_IMPORTED_MODULE_0__["mu"])(1, arguments[0].ampSpectrum);
});

/***/ }),

/***/ "./src/extractors/spectralFlatness.js":
/*!********************************************!*\
  !*** ./src/extractors/spectralFlatness.js ***!
  \********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* harmony default export */ __webpack_exports__["default"] = (function () {
  if (_typeof(arguments[0].ampSpectrum) !== 'object') {
    throw new TypeError();
  }

  var numerator = 0;
  var denominator = 0;

  for (var i = 0; i < arguments[0].ampSpectrum.length; i++) {
    numerator += Math.log(arguments[0].ampSpectrum[i]);
    denominator += arguments[0].ampSpectrum[i];
  }

  return Math.exp(numerator / arguments[0].ampSpectrum.length) * arguments[0].ampSpectrum.length / denominator;
});

/***/ }),

/***/ "./src/extractors/spectralFlux.js":
/*!****************************************!*\
  !*** ./src/extractors/spectralFlux.js ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* harmony default export */ __webpack_exports__["default"] = (function (args) {
  if (_typeof(args.signal) !== 'object' || _typeof(args.previousSignal) != 'object') {
    throw new TypeError();
  }

  var sf = 0;

  for (var i = -(args.bufferSize / 2); i < signal.length / 2 - 1; i++) {
    x = Math.abs(args.signal[i]) - Math.abs(args.previousSignal[i]);
    sf += (x + Math.abs(x)) / 2;
  }

  return sf;
});

/***/ }),

/***/ "./src/extractors/spectralKurtosis.js":
/*!********************************************!*\
  !*** ./src/extractors/spectralKurtosis.js ***!
  \********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _extractorUtilities__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./extractorUtilities */ "./src/extractors/extractorUtilities.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }


/* harmony default export */ __webpack_exports__["default"] = (function () {
  if (_typeof(arguments[0].ampSpectrum) !== 'object') {
    throw new TypeError();
  }

  var ampspec = arguments[0].ampSpectrum;
  var mu1 = Object(_extractorUtilities__WEBPACK_IMPORTED_MODULE_0__["mu"])(1, ampspec);
  var mu2 = Object(_extractorUtilities__WEBPACK_IMPORTED_MODULE_0__["mu"])(2, ampspec);
  var mu3 = Object(_extractorUtilities__WEBPACK_IMPORTED_MODULE_0__["mu"])(3, ampspec);
  var mu4 = Object(_extractorUtilities__WEBPACK_IMPORTED_MODULE_0__["mu"])(4, ampspec);
  var numerator = -3 * Math.pow(mu1, 4) + 6 * mu1 * mu2 - 4 * mu1 * mu3 + mu4;
  var denominator = Math.pow(Math.sqrt(mu2 - Math.pow(mu1, 2)), 4);
  return numerator / denominator;
});

/***/ }),

/***/ "./src/extractors/spectralRolloff.js":
/*!*******************************************!*\
  !*** ./src/extractors/spectralRolloff.js ***!
  \*******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* harmony default export */ __webpack_exports__["default"] = (function () {
  if (_typeof(arguments[0].ampSpectrum) !== 'object') {
    throw new TypeError();
  }

  var ampspec = arguments[0].ampSpectrum; //calculate nyquist bin

  var nyqBin = arguments[0].sampleRate / (2 * (ampspec.length - 1));
  var ec = 0;

  for (var i = 0; i < ampspec.length; i++) {
    ec += ampspec[i];
  }

  var threshold = 0.99 * ec;
  var n = ampspec.length - 1;

  while (ec > threshold && n >= 0) {
    ec -= ampspec[n];
    --n;
  }

  return (n + 1) * nyqBin;
});

/***/ }),

/***/ "./src/extractors/spectralSkewness.js":
/*!********************************************!*\
  !*** ./src/extractors/spectralSkewness.js ***!
  \********************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _extractorUtilities__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./extractorUtilities */ "./src/extractors/extractorUtilities.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }


/* harmony default export */ __webpack_exports__["default"] = (function (args) {
  if (_typeof(args.ampSpectrum) !== 'object') {
    throw new TypeError();
  }

  var mu1 = Object(_extractorUtilities__WEBPACK_IMPORTED_MODULE_0__["mu"])(1, args.ampSpectrum);
  var mu2 = Object(_extractorUtilities__WEBPACK_IMPORTED_MODULE_0__["mu"])(2, args.ampSpectrum);
  var mu3 = Object(_extractorUtilities__WEBPACK_IMPORTED_MODULE_0__["mu"])(3, args.ampSpectrum);
  var numerator = 2 * Math.pow(mu1, 3) - 3 * mu1 * mu2 + mu3;
  var denominator = Math.pow(Math.sqrt(mu2 - Math.pow(mu1, 2)), 3);
  return numerator / denominator;
});

/***/ }),

/***/ "./src/extractors/spectralSlope.js":
/*!*****************************************!*\
  !*** ./src/extractors/spectralSlope.js ***!
  \*****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* harmony default export */ __webpack_exports__["default"] = (function (args) {
  if (_typeof(args.ampSpectrum) !== 'object') {
    throw new TypeError();
  } //linear regression


  var ampSum = 0;
  var freqSum = 0;
  var freqs = new Float32Array(args.ampSpectrum.length);
  var powFreqSum = 0;
  var ampFreqSum = 0;

  for (var i = 0; i < args.ampSpectrum.length; i++) {
    ampSum += args.ampSpectrum[i];
    var curFreq = i * args.sampleRate / args.bufferSize;
    freqs[i] = curFreq;
    powFreqSum += curFreq * curFreq;
    freqSum += curFreq;
    ampFreqSum += curFreq * args.ampSpectrum[i];
  }

  return (args.ampSpectrum.length * ampFreqSum - freqSum * ampSum) / (ampSum * (powFreqSum - Math.pow(freqSum, 2)));
});

/***/ }),

/***/ "./src/extractors/spectralSpread.js":
/*!******************************************!*\
  !*** ./src/extractors/spectralSpread.js ***!
  \******************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _extractorUtilities__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./extractorUtilities */ "./src/extractors/extractorUtilities.js");
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }


/* harmony default export */ __webpack_exports__["default"] = (function (args) {
  if (_typeof(args.ampSpectrum) !== 'object') {
    throw new TypeError();
  }

  return Math.sqrt(Object(_extractorUtilities__WEBPACK_IMPORTED_MODULE_0__["mu"])(2, args.ampSpectrum) - Math.pow(Object(_extractorUtilities__WEBPACK_IMPORTED_MODULE_0__["mu"])(1, args.ampSpectrum), 2));
});

/***/ }),

/***/ "./src/extractors/zcr.js":
/*!*******************************!*\
  !*** ./src/extractors/zcr.js ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* harmony default export */ __webpack_exports__["default"] = (function () {
  if (_typeof(arguments[0].signal) !== 'object') {
    throw new TypeError();
  }

  var zcr = 0;

  for (var i = 0; i < arguments[0].signal.length; i++) {
    if (arguments[0].signal[i] >= 0 && arguments[0].signal[i + 1] < 0 || arguments[0].signal[i] < 0 && arguments[0].signal[i + 1] >= 0) {
      zcr++;
    }
  }

  return zcr;
});

/***/ }),

/***/ "./src/featureExtractors.js":
/*!**********************************!*\
  !*** ./src/featureExtractors.js ***!
  \**********************************/
/*! exports provided: buffer, rms, energy, complexSpectrum, spectralSlope, spectralCentroid, spectralRolloff, spectralFlatness, spectralSpread, spectralSkewness, spectralKurtosis, amplitudeSpectrum, zcr, loudness, perceptualSpread, perceptualSharpness, powerSpectrum, mfcc, chroma, spectralFlux */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "buffer", function() { return buffer; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "complexSpectrum", function() { return complexSpectrum; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "amplitudeSpectrum", function() { return amplitudeSpectrum; });
/* harmony import */ var _extractors_rms__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./extractors/rms */ "./src/extractors/rms.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "rms", function() { return _extractors_rms__WEBPACK_IMPORTED_MODULE_0__["default"]; });

/* harmony import */ var _extractors_energy__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./extractors/energy */ "./src/extractors/energy.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "energy", function() { return _extractors_energy__WEBPACK_IMPORTED_MODULE_1__["default"]; });

/* harmony import */ var _extractors_spectralSlope__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./extractors/spectralSlope */ "./src/extractors/spectralSlope.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "spectralSlope", function() { return _extractors_spectralSlope__WEBPACK_IMPORTED_MODULE_2__["default"]; });

/* harmony import */ var _extractors_spectralCentroid__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./extractors/spectralCentroid */ "./src/extractors/spectralCentroid.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "spectralCentroid", function() { return _extractors_spectralCentroid__WEBPACK_IMPORTED_MODULE_3__["default"]; });

/* harmony import */ var _extractors_spectralRolloff__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./extractors/spectralRolloff */ "./src/extractors/spectralRolloff.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "spectralRolloff", function() { return _extractors_spectralRolloff__WEBPACK_IMPORTED_MODULE_4__["default"]; });

/* harmony import */ var _extractors_spectralFlatness__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./extractors/spectralFlatness */ "./src/extractors/spectralFlatness.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "spectralFlatness", function() { return _extractors_spectralFlatness__WEBPACK_IMPORTED_MODULE_5__["default"]; });

/* harmony import */ var _extractors_spectralSpread__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./extractors/spectralSpread */ "./src/extractors/spectralSpread.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "spectralSpread", function() { return _extractors_spectralSpread__WEBPACK_IMPORTED_MODULE_6__["default"]; });

/* harmony import */ var _extractors_spectralSkewness__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./extractors/spectralSkewness */ "./src/extractors/spectralSkewness.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "spectralSkewness", function() { return _extractors_spectralSkewness__WEBPACK_IMPORTED_MODULE_7__["default"]; });

/* harmony import */ var _extractors_spectralKurtosis__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./extractors/spectralKurtosis */ "./src/extractors/spectralKurtosis.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "spectralKurtosis", function() { return _extractors_spectralKurtosis__WEBPACK_IMPORTED_MODULE_8__["default"]; });

/* harmony import */ var _extractors_zcr__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./extractors/zcr */ "./src/extractors/zcr.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "zcr", function() { return _extractors_zcr__WEBPACK_IMPORTED_MODULE_9__["default"]; });

/* harmony import */ var _extractors_loudness__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./extractors/loudness */ "./src/extractors/loudness.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "loudness", function() { return _extractors_loudness__WEBPACK_IMPORTED_MODULE_10__["default"]; });

/* harmony import */ var _extractors_perceptualSpread__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./extractors/perceptualSpread */ "./src/extractors/perceptualSpread.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "perceptualSpread", function() { return _extractors_perceptualSpread__WEBPACK_IMPORTED_MODULE_11__["default"]; });

/* harmony import */ var _extractors_perceptualSharpness__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./extractors/perceptualSharpness */ "./src/extractors/perceptualSharpness.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "perceptualSharpness", function() { return _extractors_perceptualSharpness__WEBPACK_IMPORTED_MODULE_12__["default"]; });

/* harmony import */ var _extractors_mfcc__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./extractors/mfcc */ "./src/extractors/mfcc.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "mfcc", function() { return _extractors_mfcc__WEBPACK_IMPORTED_MODULE_13__["default"]; });

/* harmony import */ var _extractors_chroma__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./extractors/chroma */ "./src/extractors/chroma.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "chroma", function() { return _extractors_chroma__WEBPACK_IMPORTED_MODULE_14__["default"]; });

/* harmony import */ var _extractors_powerSpectrum__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./extractors/powerSpectrum */ "./src/extractors/powerSpectrum.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "powerSpectrum", function() { return _extractors_powerSpectrum__WEBPACK_IMPORTED_MODULE_15__["default"]; });

/* harmony import */ var _extractors_spectralFlux__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./extractors/spectralFlux */ "./src/extractors/spectralFlux.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "spectralFlux", function() { return _extractors_spectralFlux__WEBPACK_IMPORTED_MODULE_16__["default"]; });



















var buffer = function buffer(args) {
  return args.signal;
};

var complexSpectrum = function complexSpectrum(args) {
  return args.complexSpectrum;
};

var amplitudeSpectrum = function amplitudeSpectrum(args) {
  return args.ampSpectrum;
};



/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! ./main */ "./src/main.js").default;

/***/ }),

/***/ "./src/main.js":
/*!*********************!*\
  !*** ./src/main.js ***!
  \*********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utilities__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utilities */ "./src/utilities.js");
/* harmony import */ var _featureExtractors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./featureExtractors */ "./src/featureExtractors.js");
/* harmony import */ var fftjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! fftjs */ "./node_modules/fftjs/dist/fft.js");
/* harmony import */ var fftjs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(fftjs__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _meyda_wa__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./meyda-wa */ "./src/meyda-wa.js");
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }





/**
 * Meyda Module
 * @module meyda
 */

/**
 * Options for constructing a MeydaAnalyzer
 * @typedef {Object} MeydaOptions
 * @property {AudioContext} audioContext - The Audio Context for the MeydaAnalyzer to operate in.
 * @property {AudioNode} source - The Audio Node for Meyda to listen to.
 * @property {number} [bufferSize] - The size of the buffer.
 * @property {number} [hopSize] - The hop size between buffers.
 * @property {number} [sampleRate] - The number of samples per second in the audio context.
 * @property {Function} [callback] - A function to receive the frames of audio features
 * @property {string} [windowingFunction] - The Windowing Function to apply to the signal before transformation to the frequency domain
 * @property {string|Array.<string>} [featureExtractors] - Specify the feature extractors you want to run on the audio.
 * @property {boolean} [startImmediately] - Pass `true` to start feature extraction immediately
 */

/**
 * Web Audio context
 * Either an {@link AudioContext|https://developer.mozilla.org/en-US/docs/Web/API/AudioContext}
 * or an {@link OfflineAudioContext|https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext}
 * @typedef {Object} AudioContext
 */

/**
 * AudioNode
 * A Web AudioNode
 * @typedef {Object} AudioNode
 */

/**
 * ScriptProcessorNode
 * A Web Audio ScriptProcessorNode
 * @typedef {Object} ScriptProcessorNode
 */

/**
 * @class Meyda
 * @hideconstructor
 * @classdesc
 * The schema for the default export of the Meyda library.
 * @example
 * var Meyda = require('meyda');
 */

var Meyda = {
  /**
   * Meyda stores a reference to the relevant audio context here for use inside
   * the Web Audio API.
   * @instance
   * @member {AudioContext}
   */
  audioContext: null,

  /**
   * Meyda keeps an internal ScriptProcessorNode in which it runs audio feature
   * extraction. The ScriptProcessorNode is stored in this member variable.
   * @instance
   * @member {ScriptProcessorNode}
   */
  spn: null,

  /**
   * The length of each buffer that Meyda will extract audio on. When recieving
   * input via the Web Audio API, the Script Processor Node chunks incoming audio
   * into arrays of this length. Longer buffers allow for more precision in the
   * frequency domain, but increase the amount of time it takes for Meyda to
   * output a set of audio features for the buffer. You can calculate how many
   * sets of audio features Meyda will output per second by dividing the
   * buffer size by the sample rate. If you're using Meyda for visualisation,
   * make sure that you're collecting audio features at a rate that's faster
   * than or equal to the video frame rate you expect.
   * @instance
   * @member {number}
   */
  bufferSize: 512,

  /**
   * The number of samples per second of the incoming audio. This affects
   * feature extraction outside of the context of the Web Audio API, and must be
   * set accurately - otherwise calculations will be off.
   * @instance
   * @member {number}
   */
  sampleRate: 44100,

  /**
   * The number of Mel bands to use in the Mel Frequency Cepstral Co-efficients
   * feature extractor
   * @instance
   * @member {number}
   */
  melBands: 26,

  /**
   * The number of bands to divide the spectrum into for the Chroma feature
   * extractor. 12 is the standard number of semitones per octave in the western
   * music tradition, but Meyda can use an arbitrary number of bands, which
   * can be useful for microtonal music.
   * @instance
   * @member {number}
   */
  chromaBands: 12,

  /**
   * A function you can provide that will be called for each buffer that Meyda
   * receives from its source node
   * @instance
   * @member {Function}
   */
  callback: null,

  /**
   * Specify the windowing function to apply to the buffer before the
   * transformation from the time domain to the frequency domain is performed
   * @instance
   * @member {string}
   */
  windowingFunction: 'hanning',

  /**
   * @member {object}
   */
  featureExtractors: _featureExtractors__WEBPACK_IMPORTED_MODULE_1__,
  EXTRACTION_STARTED: false,
  numberOfMFCCCoefficients: 13,
  _featuresToExtract: [],
  windowing: _utilities__WEBPACK_IMPORTED_MODULE_0__["applyWindow"],
  _errors: {
    notPow2: new Error('Meyda: Buffer size must be a power of 2, e.g. 64 or 512'),
    featureUndef: new Error('Meyda: No features defined.'),
    invalidFeatureFmt: new Error('Meyda: Invalid feature format'),
    invalidInput: new Error('Meyda: Invalid input.'),
    noAC: new Error('Meyda: No AudioContext specified.'),
    noSource: new Error('Meyda: No source node specified.')
  },

  /**
   * @summary
   * Create a MeydaAnalyzer
   *
   * A factory function for creating a MeydaAnalyzer, the interface for using
   * Meyda in the context of Web Audio.
   *
   * @method
   * @param {MeydaOptions} options Options - an object containing configuration
   * @returns {MeydaAnalyzer}
   * @example
   * const analyzer = Meyda.createMeydaAnalyzer({
   *   "audioContext": audioContext,
   *   "source": source,
   *   "bufferSize": 512,
   *   "featureExtractors": ["rms"],
   *   "inputs": 2,
   *   "callback": features => {
   *     levelRangeElement.value = features.rms;
   *   }
   * });
   */
  createMeydaAnalyzer: function createMeydaAnalyzer(options) {
    return new _meyda_wa__WEBPACK_IMPORTED_MODULE_3__["MeydaAnalyzer"](options, Meyda);
  },

  /**
   * Extract an audio feature from a buffer
   * @function
   * @param {(string|Array.<string>)} feature - the feature you want to extract
   * @param {Array.<number>} signal
   * An array of numbers that represents the signal. It should be of length
   * `meyda.bufferSize`
   * @param {Array.<number>} [previousSignal] - the previous buffer
   * @returns {object} Features
   * @example
   * meyda.bufferSize = 2048;
   * const features = meyda.extract(['zcr', 'spectralCentroid'], signal);
   */
  extract: function extract(feature, signal, previousSignal) {
    var _this = this;

    if (!signal) throw this._errors.invalidInput;else if (_typeof(signal) != 'object') throw this._errors.invalidInput;else if (!feature) throw this._errors.featureUndef;else if (!_utilities__WEBPACK_IMPORTED_MODULE_0__["isPowerOfTwo"](signal.length)) throw this._errors.notPow2;

    if (typeof this.barkScale == 'undefined' || this.barkScale.length != this.bufferSize) {
      this.barkScale = _utilities__WEBPACK_IMPORTED_MODULE_0__["createBarkScale"](this.bufferSize, this.sampleRate, this.bufferSize);
    } // Recalculate mel bank if buffer length changed


    if (typeof this.melFilterBank == 'undefined' || this.barkScale.length != this.bufferSize || this.melFilterBank.length != this.melBands) {
      this.melFilterBank = _utilities__WEBPACK_IMPORTED_MODULE_0__["createMelFilterBank"](Math.max(this.melBands, this.numberOfMFCCCoefficients), this.sampleRate, this.bufferSize);
    } // Recalculate chroma bank if buffer length changed


    if (typeof this.chromaFilterBank == 'undefined' || this.chromaFilterBank.length != this.chromaBands) {
      this.chromaFilterBank = _utilities__WEBPACK_IMPORTED_MODULE_0__["createChromaFilterBank"](this.chromaBands, this.sampleRate, this.bufferSize);
    }

    if (typeof signal.buffer == 'undefined') {
      //signal is a normal array, convert to F32A
      this.signal = _utilities__WEBPACK_IMPORTED_MODULE_0__["arrayToTyped"](signal);
    } else {
      this.signal = signal;
    }

    var preparedSignal = prepareSignalWithSpectrum(signal, this.windowingFunction, this.bufferSize);
    this.signal = preparedSignal.windowedSignal;
    this.complexSpectrum = preparedSignal.complexSpectrum;
    this.ampSpectrum = preparedSignal.ampSpectrum;

    if (previousSignal) {
      var _preparedSignal = prepareSignalWithSpectrum(previousSignal, this.windowingFunction, this.bufferSize);

      this.previousSignal = _preparedSignal.windowedSignal;
      this.previousComplexSpectrum = _preparedSignal.complexSpectrum;
      this.previousAmpSpectrum = _preparedSignal.ampSpectrum;
    }

    var extract = function extract(feature) {
      return _this.featureExtractors[feature]({
        ampSpectrum: _this.ampSpectrum,
        chromaFilterBank: _this.chromaFilterBank,
        complexSpectrum: _this.complexSpectrum,
        signal: _this.signal,
        bufferSize: _this.bufferSize,
        sampleRate: _this.sampleRate,
        barkScale: _this.barkScale,
        melFilterBank: _this.melFilterBank,
        previousSignal: _this.previousSignal,
        previousAmpSpectrum: _this.previousAmpSpectrum,
        previousComplexSpectrum: _this.previousComplexSpectrum,
        numberOfMFCCCoefficients: _this.numberOfMFCCCoefficients
      });
    };

    if (_typeof(feature) === 'object') {
      return feature.reduce(function (acc, el) {
        return Object.assign({}, acc, _defineProperty({}, el, extract(el)));
      }, {});
    } else if (typeof feature === 'string') {
      return extract(feature);
    } else {
      throw this._errors.invalidFeatureFmt;
    }
  }
};

var prepareSignalWithSpectrum = function prepareSignalWithSpectrum(signal, windowingFunction, bufferSize) {
  var preparedSignal = {};

  if (typeof signal.buffer == 'undefined') {
    //signal is a normal array, convert to F32A
    preparedSignal.signal = _utilities__WEBPACK_IMPORTED_MODULE_0__["arrayToTyped"](signal);
  } else {
    preparedSignal.signal = signal;
  }

  preparedSignal.windowedSignal = _utilities__WEBPACK_IMPORTED_MODULE_0__["applyWindow"](preparedSignal.signal, windowingFunction);
  preparedSignal.complexSpectrum = Object(fftjs__WEBPACK_IMPORTED_MODULE_2__["fft"])(preparedSignal.windowedSignal);
  preparedSignal.ampSpectrum = new Float32Array(bufferSize / 2);

  for (var i = 0; i < bufferSize / 2; i++) {
    preparedSignal.ampSpectrum[i] = Math.sqrt(Math.pow(preparedSignal.complexSpectrum.real[i], 2) + Math.pow(preparedSignal.complexSpectrum.imag[i], 2));
  }

  return preparedSignal;
};
/**
 * The Meyda class
 * @type {Meyda}
 */


/* harmony default export */ __webpack_exports__["default"] = (Meyda);
if (typeof window !== 'undefined') window.Meyda = Meyda;

/***/ }),

/***/ "./src/meyda-wa.js":
/*!*************************!*\
  !*** ./src/meyda-wa.js ***!
  \*************************/
/*! exports provided: MeydaAnalyzer */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "MeydaAnalyzer", function() { return MeydaAnalyzer; });
/* harmony import */ var _utilities__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utilities */ "./src/utilities.js");
/* harmony import */ var _featureExtractors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./featureExtractors */ "./src/featureExtractors.js");
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }



/**
  * MeydaAnalyzer
  * @classdesc
  * Meyda's interface to the Web Audio API. MeydaAnalyzer abstracts an API on
  * top of the Web Audio API's ScriptProcessorNode, running the Meyda audio
  * feature extractors inside that context.
  *
  * MeydaAnalyzer's constructor should not be called directly - MeydaAnalyzer
  * objects should be generated using the {@link Meyda.createMeydaAnalyzer}
  * factory function in the main Meyda class.
  *
  * @example
  * const analyzer = Meyda.createMeydaAnalyzer({
  *   "audioContext": audioContext,
  *   "source": source,
  *   "bufferSize": 512,
  *   "featureExtractors": ["rms"],
  *   "inputs": 2,
  *   "callback": features => {
  *     levelRangeElement.value = features.rms;
  *   }
  * });
  * @hideconstructor
  */

var MeydaAnalyzer =
/*#__PURE__*/
function () {
  function MeydaAnalyzer(options, _this) {
    var _this2 = this;

    _classCallCheck(this, MeydaAnalyzer);

    this._m = _this;

    if (!options.audioContext) {
      throw this._m.errors.noAC;
    } else if (options.bufferSize && !_utilities__WEBPACK_IMPORTED_MODULE_0__["isPowerOfTwo"](options.bufferSize)) {
      throw this._m._errors.notPow2;
    } else if (!options.source) {
      throw this._m._errors.noSource;
    }

    this._m.audioContext = options.audioContext; // TODO: validate options

    this._m.bufferSize = options.bufferSize || this._m.bufferSize || 256;
    this._m.hopSize = options.hopSize || this._m.hopSize || this._m.bufferSize;
    this._m.sampleRate = options.sampleRate || this._m.audioContext.sampleRate || 44100;
    this._m.callback = options.callback;
    this._m.windowingFunction = options.windowingFunction || 'hanning';
    this._m.featureExtractors = _featureExtractors__WEBPACK_IMPORTED_MODULE_1__;
    this._m.EXTRACTION_STARTED = options.startImmediately || false; //create nodes

    this._m.spn = this._m.audioContext.createScriptProcessor(this._m.bufferSize, 1, 1);

    this._m.spn.connect(this._m.audioContext.destination);

    this._m._featuresToExtract = options.featureExtractors || []; //always recalculate BS and MFB when a new Meyda analyzer is created.

    this._m.barkScale = _utilities__WEBPACK_IMPORTED_MODULE_0__["createBarkScale"](this._m.bufferSize, this._m.sampleRate, this._m.bufferSize);
    this._m.melFilterBank = _utilities__WEBPACK_IMPORTED_MODULE_0__["createMelFilterBank"](this._m.melBands, this._m.sampleRate, this._m.bufferSize);
    this._m.inputData = null;
    this._m.previousInputData = null;
    this._m.frame = null;
    this._m.previousFrame = null;
    this.setSource(options.source);

    this._m.spn.onaudioprocess = function (e) {
      if (_this2._m.inputData !== null) {
        _this2._m.previousInputData = _this2._m.inputData;
      }

      _this2._m.inputData = e.inputBuffer.getChannelData(0);

      if (!_this2._m.previousInputData) {
        var buffer = _this2._m.inputData;
      } else {
        var buffer = new Float32Array(_this2._m.previousInputData.length + _this2._m.inputData.length - _this2._m.hopSize);
        buffer.set(_this2._m.previousInputData.slice(_this2._m.hopSize));
        buffer.set(_this2._m.inputData, _this2._m.previousInputData.length - _this2._m.hopSize);
      }

      ;
      var frames = _utilities__WEBPACK_IMPORTED_MODULE_0__["frame"](buffer, _this2._m.bufferSize, _this2._m.hopSize);
      frames.forEach(function (f) {
        _this2._m.frame = f;

        var features = _this2._m.extract(_this2._m._featuresToExtract, _this2._m.frame, _this2._m.previousFrame); // call callback if applicable


        if (typeof _this2._m.callback === 'function' && _this2._m.EXTRACTION_STARTED) {
          _this2._m.callback(features);
        }

        _this2._m.previousFrame = _this2._m.frame;
      });
    };
  }
  /**
   * Start feature extraction
   * The audio features will be passed to the callback function that was defined
   * in the MeydaOptions that were passed to the factory when constructing the
   * MeydaAnalyzer.
   * @param {(string|Array.<string>)} [features]
   * Change the features that Meyda is extracting. Defaults to the features that
   * were set upon construction in the options parameter.
   * @example
   * analyzer.start('chroma');
   */


  _createClass(MeydaAnalyzer, [{
    key: "start",
    value: function start(features) {
      this._m._featuresToExtract = features || this._m._featuresToExtract;
      this._m.EXTRACTION_STARTED = true;
    }
    /**
     * Stop feature extraction.
     * @example
     * analyzer.stop();
     */

  }, {
    key: "stop",
    value: function stop() {
      this._m.EXTRACTION_STARTED = false;
    }
    /**
     * Set the Audio Node for Meyda to listen to.
     * @param {AudioNode} source - The Audio Node for Meyda to listen to
     * @example
     * analyzer.setSource(audioSourceNode);
     */

  }, {
    key: "setSource",
    value: function setSource(source) {
      source.connect(this._m.spn);
    }
    /**
     * Get a set of features from the current frame.
     * @param {(string|Array.<string>)} [features]
     * Change the features that Meyda is extracting
     * @example
     * analyzer.get('spectralFlatness');
     */

  }, {
    key: "get",
    value: function get(features) {
      if (this._m.inputData) {
        return this._m.extract(features || this._m._featuresToExtract, this._m.inputData, this._m.previousInputData);
      } else {
        return null;
      }
    }
  }]);

  return MeydaAnalyzer;
}();

/***/ }),

/***/ "./src/utilities.js":
/*!**************************!*\
  !*** ./src/utilities.js ***!
  \**************************/
/*! exports provided: isPowerOfTwo, error, pointwiseBufferMult, applyWindow, createBarkScale, typedToArray, arrayToTyped, _normalize, normalize, normalizeToOne, mean, melToFreq, freqToMel, createMelFilterBank, hzToOctaves, normalizeByColumn, createChromaFilterBank, frame */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isPowerOfTwo", function() { return isPowerOfTwo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "error", function() { return error; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "pointwiseBufferMult", function() { return pointwiseBufferMult; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "applyWindow", function() { return applyWindow; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createBarkScale", function() { return createBarkScale; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "typedToArray", function() { return typedToArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "arrayToTyped", function() { return arrayToTyped; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_normalize", function() { return _normalize; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "normalize", function() { return normalize; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "normalizeToOne", function() { return normalizeToOne; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "mean", function() { return mean; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "melToFreq", function() { return melToFreq; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "freqToMel", function() { return freqToMel; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createMelFilterBank", function() { return createMelFilterBank; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hzToOctaves", function() { return hzToOctaves; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "normalizeByColumn", function() { return normalizeByColumn; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createChromaFilterBank", function() { return createChromaFilterBank; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "frame", function() { return frame; });
/* harmony import */ var _windowing__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./windowing */ "./src/windowing.js");
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }


var windows = {};
function isPowerOfTwo(num) {
  while (num % 2 === 0 && num > 1) {
    num /= 2;
  }

  return num === 1;
}
function error(message) {
  throw new Error('Meyda: ' + message);
}
function pointwiseBufferMult(a, b) {
  var c = [];

  for (var i = 0; i < Math.min(a.length, b.length); i++) {
    c[i] = a[i] * b[i];
  }

  return c;
}
function applyWindow(signal, windowname) {
  if (windowname !== 'rect') {
    if (windowname === '' || !windowname) windowname = 'hanning';
    if (!windows[windowname]) windows[windowname] = {};

    if (!windows[windowname][signal.length]) {
      try {
        windows[windowname][signal.length] = _windowing__WEBPACK_IMPORTED_MODULE_0__[windowname](signal.length);
      } catch (e) {
        throw new Error('Invalid windowing function');
      }
    }

    signal = pointwiseBufferMult(signal, windows[windowname][signal.length]);
  }

  return signal;
}
function createBarkScale(length, sampleRate, bufferSize) {
  var barkScale = new Float32Array(length);

  for (var i = 0; i < barkScale.length; i++) {
    barkScale[i] = i * sampleRate / bufferSize;
    barkScale[i] = 13 * Math.atan(barkScale[i] / 1315.8) + 3.5 * Math.atan(Math.pow(barkScale[i] / 7518, 2));
  }

  return barkScale;
}
function typedToArray(t) {
  // utility to convert typed arrays to normal arrays
  return Array.prototype.slice.call(t);
}
function arrayToTyped(t) {
  // utility to convert arrays to typed F32 arrays
  return Float32Array.from(t);
}
function _normalize(num, range) {
  return num / range;
}
function normalize(a, range) {
  return a.map(function (n) {
    return _normalize(n, range);
  });
}
function normalizeToOne(a) {
  var max = Math.max.apply(null, a);
  return a.map(function (n) {
    return n / max;
  });
}
function mean(a) {
  return a.reduce(function (prev, cur) {
    return prev + cur;
  }) / a.length;
}

function _melToFreq(melValue) {
  var freqValue = 700 * (Math.exp(melValue / 1125) - 1);
  return freqValue;
}

function _freqToMel(freqValue) {
  var melValue = 1125 * Math.log(1 + freqValue / 700);
  return melValue;
}

function melToFreq(mV) {
  return _melToFreq(mV);
}
function freqToMel(fV) {
  return _freqToMel(fV);
}
function createMelFilterBank(numFilters, sampleRate, bufferSize) {
  //the +2 is the upper and lower limits
  var melValues = new Float32Array(numFilters + 2);
  var melValuesInFreq = new Float32Array(numFilters + 2); //Generate limits in Hz - from 0 to the nyquist.

  var lowerLimitFreq = 0;
  var upperLimitFreq = sampleRate / 2; //Convert the limits to Mel

  var lowerLimitMel = _freqToMel(lowerLimitFreq);

  var upperLimitMel = _freqToMel(upperLimitFreq); //Find the range


  var range = upperLimitMel - lowerLimitMel; //Find the range as part of the linear interpolation

  var valueToAdd = range / (numFilters + 1);
  var fftBinsOfFreq = Array(numFilters + 2);

  for (var i = 0; i < melValues.length; i++) {
    // Initialising the mel frequencies
    // They're a linear interpolation between the lower and upper limits.
    melValues[i] = i * valueToAdd; // Convert back to Hz

    melValuesInFreq[i] = _melToFreq(melValues[i]); // Find the corresponding bins

    fftBinsOfFreq[i] = Math.floor((bufferSize + 1) * melValuesInFreq[i] / sampleRate);
  }

  var filterBank = Array(numFilters);

  for (var j = 0; j < filterBank.length; j++) {
    // Create a two dimensional array of size numFilters * (buffersize/2)+1
    // pre-populating the arrays with 0s.
    filterBank[j] = Array.apply(null, new Array(bufferSize / 2 + 1)).map(Number.prototype.valueOf, 0); //creating the lower and upper slopes for each bin

    for (var _i = fftBinsOfFreq[j]; _i < fftBinsOfFreq[j + 1]; _i++) {
      filterBank[j][_i] = (_i - fftBinsOfFreq[j]) / (fftBinsOfFreq[j + 1] - fftBinsOfFreq[j]);
    }

    for (var _i2 = fftBinsOfFreq[j + 1]; _i2 < fftBinsOfFreq[j + 2]; _i2++) {
      filterBank[j][_i2] = (fftBinsOfFreq[j + 2] - _i2) / (fftBinsOfFreq[j + 2] - fftBinsOfFreq[j + 1]);
    }
  }

  return filterBank;
}
function hzToOctaves(freq, A440) {
  return Math.log2(16 * freq / A440);
}
function normalizeByColumn(a) {
  var emptyRow = a[0].map(function () {
    return 0;
  });
  var colDenominators = a.reduce(function (acc, row) {
    row.forEach(function (cell, j) {
      acc[j] += Math.pow(cell, 2);
    });
    return acc;
  }, emptyRow).map(Math.sqrt);
  return a.map(function (row, i) {
    return row.map(function (v, j) {
      return v / (colDenominators[j] || 1);
    });
  });
}
;
function createChromaFilterBank(numFilters, sampleRate, bufferSize) {
  var centerOctave = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 5;
  var octaveWidth = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 2;
  var baseC = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : true;
  var A440 = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 440;
  var numOutputBins = Math.floor(bufferSize / 2) + 1;
  var frequencyBins = new Array(bufferSize).fill(0).map(function (_, i) {
    return numFilters * hzToOctaves(sampleRate * i / bufferSize, A440);
  }); // Set a value for the 0 Hz bin that is 1.5 octaves below bin 1
  // (so chroma is 50% rotated from bin 1, and bin width is broad)

  frequencyBins[0] = frequencyBins[1] - 1.5 * numFilters;
  var binWidthBins = frequencyBins.slice(1).map(function (v, i) {
    return Math.max(v - frequencyBins[i]);
  }, 1).concat([1]);
  var halfNumFilters = Math.round(numFilters / 2);
  var filterPeaks = new Array(numFilters).fill(0).map(function (_, i) {
    return frequencyBins.map(function (frq) {
      return (10 * numFilters + halfNumFilters + frq - i) % numFilters - halfNumFilters;
    });
  });
  var weights = filterPeaks.map(function (row, i) {
    return row.map(function (_, j) {
      return Math.exp(-0.5 * Math.pow(2 * filterPeaks[i][j] / binWidthBins[j], 2));
    });
  });
  weights = normalizeByColumn(weights);

  if (octaveWidth) {
    var octaveWeights = frequencyBins.map(function (v) {
      return Math.exp(-0.5 * Math.pow((v / numFilters - centerOctave) / octaveWidth, 2));
    });
    weights = weights.map(function (row) {
      return row.map(function (cell, j) {
        return cell * octaveWeights[j];
      });
    });
  }

  if (baseC) {
    weights = _toConsumableArray(weights.slice(3)).concat(_toConsumableArray(weights.slice(0, 3)));
  }

  return weights.map(function (row) {
    return row.slice(0, numOutputBins);
  });
}
function frame(buffer, frameLength, hopLength) {
  if (buffer.length < frameLength) {
    throw new Error('Buffer is too short for frame length');
  }

  if (hopLength < 1) {
    throw new Error('Hop length cannot be less that 1');
  }

  if (frameLength < 1) {
    throw new Error('Frame length cannot be less that 1');
  }

  var numFrames = 1 + Math.floor((buffer.length - frameLength) / hopLength);
  return new Array(numFrames).fill(0).map(function (_, i) {
    return buffer.slice(i * hopLength, i * hopLength + frameLength);
  });
}

/***/ }),

/***/ "./src/windowing.js":
/*!**************************!*\
  !*** ./src/windowing.js ***!
  \**************************/
/*! exports provided: blackman, sine, hanning, hamming */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blackman", function() { return blackman; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "sine", function() { return sine; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hanning", function() { return hanning; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hamming", function() { return hamming; });
function blackman(size) {
  var blackmanBuffer = new Float32Array(size);
  var coeff1 = 2 * Math.PI / (size - 1);
  var coeff2 = 2 * coeff1; //According to http://uk.mathworks.com/help/signal/ref/blackman.html
  //first half of the window

  for (var i = 0; i < size / 2; i++) {
    blackmanBuffer[i] = 0.42 - 0.5 * Math.cos(i * coeff1) + 0.08 * Math.cos(i * coeff2);
  } //second half of the window


  for (var _i = size / 2; _i > 0; _i--) {
    blackmanBuffer[size - _i] = blackmanBuffer[_i - 1];
  }

  return blackmanBuffer;
}
function sine(size) {
  var coeff = Math.PI / (size - 1);
  var sineBuffer = new Float32Array(size);

  for (var i = 0; i < size; i++) {
    sineBuffer[i] = Math.sin(coeff * i);
  }

  return sineBuffer;
}
function hanning(size) {
  var hanningBuffer = new Float32Array(size);

  for (var i = 0; i < size; i++) {
    // According to the R documentation
    // http://ugrad.stat.ubc.ca/R/library/e1071/html/hanning.window.html
    hanningBuffer[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1));
  }

  return hanningBuffer;
}
function hamming(size) {
  var hammingBuffer = new Float32Array(size);

  for (var i = 0; i < size; i++) {
    //According to http://uk.mathworks.com/help/signal/ref/hamming.html
    hammingBuffer[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * (i / size - 1));
  }

  return hammingBuffer;
}

/***/ })

/******/ });
});

},{}],4:[function(require,module,exports){
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

},{"./ponyfill.js":5}],5:[function(require,module,exports){
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
},{}],6:[function(require,module,exports){
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

},{"symbol-observable":4}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{"./internals":9}],9:[function(require,module,exports){
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

},{"./adapt":7,"quicktask":11,"xstream":15}],10:[function(require,module,exports){
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

},{}],11:[function(require,module,exports){
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

},{"_process":10,"timers":14}],12:[function(require,module,exports){
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
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],14:[function(require,module,exports){
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

},{"process/browser.js":10,"timers":14}],15:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6,"symbol-observable":12}],16:[function(require,module,exports){
"use strict";
exports.__esModule = true;
var run_1 = require("@cycle/run");
var cycle_meyda_driver_1 = require("cycle-meyda-driver");
function main(sources) {
    sources.Meyda.addListener({ next: function (f) { return console.log(f); } });
    return {};
}
run_1.run(main, {
    Meyda: cycle_meyda_driver_1.makeMeydaDriver()
});

},{"@cycle/run":8,"cycle-meyda-driver":1}]},{},[16])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8zcmRwYXJ0eS9jeWNsZS1tZXlkYS1kcml2ZXIvbGliL2Nqcy9pbmRleC5qcyIsIi4uLy4uLy4uLzNyZHBhcnR5L2N5Y2xlLW1leWRhLWRyaXZlci9ub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvYWRhcHQuanMiLCIuLi8uLi8uLi8zcmRwYXJ0eS9jeWNsZS1tZXlkYS1kcml2ZXIvbm9kZV9tb2R1bGVzL21leWRhL2Rpc3Qvd2ViL21leWRhLm1pbi5qcyIsIi4uLy4uLy4uLzNyZHBhcnR5L2N5Y2xlLW1leWRhLWRyaXZlci9ub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL2luZGV4LmpzIiwiLi4vLi4vLi4vM3JkcGFydHkvY3ljbGUtbWV5ZGEtZHJpdmVyL25vZGVfbW9kdWxlcy9zeW1ib2wtb2JzZXJ2YWJsZS9saWIvcG9ueWZpbGwuanMiLCIuLi8uLi8uLi8zcmRwYXJ0eS9jeWNsZS1tZXlkYS1kcml2ZXIvbm9kZV9tb2R1bGVzL3hzdHJlYW0vc3JjL2luZGV4LnRzIiwibm9kZV9tb2R1bGVzL0BjeWNsZS9ydW4vbGliL2Nqcy9hZGFwdC5qcyIsIm5vZGVfbW9kdWxlcy9AY3ljbGUvcnVuL2xpYi9janMvaW5kZXguanMiLCJub2RlX21vZHVsZXMvQGN5Y2xlL3J1bi9saWIvY2pzL2ludGVybmFscy5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcXVpY2t0YXNrL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3N5bWJvbC1vYnNlcnZhYmxlL2xpYi9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy90aW1lcnMtYnJvd3NlcmlmeS9tYWluLmpzIiwic3JjL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDdnVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7OztBQzNFQSxrQ0FBK0I7QUFDL0IseURBQW1EO0FBRW5ELGNBQWMsT0FBTztJQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxFQUFDLElBQUksRUFBRSxVQUFBLENBQUMsSUFBSSxPQUFBLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQWQsQ0FBYyxFQUFDLENBQUMsQ0FBQztJQUN2RCxPQUFPLEVBQUUsQ0FBQztBQUNaLENBQUM7QUFFRCxTQUFHLENBQUMsSUFBSSxFQUFFO0lBQ1IsS0FBSyxFQUFFLG9DQUFlLEVBQUU7Q0FDekIsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG52YXIgX19hc3NpZ24gPSAodGhpcyAmJiB0aGlzLl9fYXNzaWduKSB8fCBPYmplY3QuYXNzaWduIHx8IGZ1bmN0aW9uKHQpIHtcbiAgICBmb3IgKHZhciBzLCBpID0gMSwgbiA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgcyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBzKSBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHMsIHApKVxuICAgICAgICAgICAgdFtwXSA9IHNbcF07XG4gICAgfVxuICAgIHJldHVybiB0O1xufTtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcInhzdHJlYW1cIikpO1xudmFyIG1leWRhXzEgPSBfX2ltcG9ydERlZmF1bHQocmVxdWlyZShcIm1leWRhXCIpKTtcbnZhciBhZGFwdF8xID0gcmVxdWlyZShcIkBjeWNsZS9ydW4vbGliL2FkYXB0XCIpO1xuZnVuY3Rpb24gbWFrZU1leWRhRHJpdmVyKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucyA9PT0gdm9pZCAwKSB7IG9wdGlvbnMgPSB7fTsgfVxuICAgIGlmICghbmF2aWdhdG9yLm1lZGlhRGV2aWNlcyB8fCAhbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEpIHtcbiAgICAgICAgdGhyb3cgJ0Jyb3dzZXIgQVBJIG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhIG5vdCBhdmFpbGFibGUnO1xuICAgIH1cbiAgICAvLyBOT1RFOiBodHRwczovL2dpdGh1Yi5jb20vbWV5ZGEvbWV5ZGEvYmxvYi9tYXN0ZXIvc3JjL21leWRhLXdhLmpzI0w1OVxuICAgIC8vICAgd2hpY2ggaXMgbm90IGltcGxlbWVudGVkIGFzIGV4cGxhaW5lZCBpbiBkb2N1bWVudGF0aW9uOlxuICAgIC8vICAgaHR0cHM6Ly9tZXlkYS5qcy5vcmcvcmVmZXJlbmNlL21vZHVsZS1tZXlkYS5odG1sXG4gICAgaWYgKCFvcHRpb25zLmZlYXR1cmVFeHRyYWN0b3JzKSB7XG4gICAgICAgIG9wdGlvbnMuZmVhdHVyZUV4dHJhY3RvcnMgPSBbJ3JtcyddO1xuICAgIH1cbiAgICB2YXIgY29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICB2YXIgbWV5ZGEgPSBudWxsO1xuICAgIHJldHVybiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzb3VyY2UkID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKHtcbiAgICAgICAgICAgIHN0YXJ0OiBmdW5jdGlvbiAobGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7XG4gICAgICAgICAgICAgICAgICAgICdhdWRpbyc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICd2aWRlbyc6IGZhbHNlLFxuICAgICAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgc291cmNlID0gY29udGV4dC5jcmVhdGVNZWRpYVN0cmVhbVNvdXJjZShzdHJlYW0pO1xuICAgICAgICAgICAgICAgICAgICBtZXlkYSA9IG1leWRhXzEuZGVmYXVsdC5jcmVhdGVNZXlkYUFuYWx5emVyKF9fYXNzaWduKHt9LCBvcHRpb25zLCB7IHN0YXJ0SW1tZWRpYXRlbHk6IHRydWUsIGF1ZGlvQ29udGV4dDogY29udGV4dCwgc291cmNlOiBzb3VyY2UsIGNhbGxiYWNrOiBmdW5jdGlvbiAoZmVhdHVyZXMpIHsgcmV0dXJuIGxpc3RlbmVyLm5leHQoZmVhdHVyZXMpOyB9IH0pKTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgJ0ZhaWxlZCB0byBjcmVhdGUgTWV5ZGEgYW5hbHl6ZXInO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0b3A6IGZ1bmN0aW9uICgpIHsgfSxcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhZGFwdF8xLmFkYXB0KHNvdXJjZSQpO1xuICAgIH07XG59XG5leHBvcnRzLm1ha2VNZXlkYURyaXZlciA9IG1ha2VNZXlkYURyaXZlcjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWluZGV4LmpzLm1hcCIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gZ2V0R2xvYmFsKCkge1xuICAgIHZhciBnbG9iYWxPYmo7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIGdsb2JhbE9iaiA9IHdpbmRvdztcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gZ2xvYmFsO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gdGhpcztcbiAgICB9XG4gICAgZ2xvYmFsT2JqLkN5Y2xlanMgPSBnbG9iYWxPYmouQ3ljbGVqcyB8fCB7fTtcbiAgICBnbG9iYWxPYmogPSBnbG9iYWxPYmouQ3ljbGVqcztcbiAgICBnbG9iYWxPYmouYWRhcHRTdHJlYW0gPSBnbG9iYWxPYmouYWRhcHRTdHJlYW0gfHwgKGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9KTtcbiAgICByZXR1cm4gZ2xvYmFsT2JqO1xufVxuZnVuY3Rpb24gc2V0QWRhcHQoZikge1xuICAgIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtID0gZjtcbn1cbmV4cG9ydHMuc2V0QWRhcHQgPSBzZXRBZGFwdDtcbmZ1bmN0aW9uIGFkYXB0KHN0cmVhbSkge1xuICAgIHJldHVybiBnZXRHbG9iYWwoKS5hZGFwdFN0cmVhbShzdHJlYW0pO1xufVxuZXhwb3J0cy5hZGFwdCA9IGFkYXB0O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YWRhcHQuanMubWFwIiwiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wiTWV5ZGFcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiTWV5ZGFcIl0gPSBmYWN0b3J5KCk7XG59KSh3aW5kb3csIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuLyoqKioqKi9cbi8qKioqKiovIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbi8qKioqKiovIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuLyoqKioqKi9cbi8qKioqKiovIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbi8qKioqKiovIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4vKioqKioqLyBcdFx0fVxuLyoqKioqKi8gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4vKioqKioqLyBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuLyoqKioqKi8gXHRcdFx0aTogbW9kdWxlSWQsXG4vKioqKioqLyBcdFx0XHRsOiBmYWxzZSxcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9XG4vKioqKioqLyBcdFx0fTtcbi8qKioqKiovXG4vKioqKioqLyBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4vKioqKioqLyBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG4vKioqKioqL1xuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubCA9IHRydWU7XG4vKioqKioqL1xuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG4vKioqKioqL1xuLyoqKioqKi9cbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcbi8qKioqKiovXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG4vKioqKioqL1xuLyoqKioqKi8gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4vKioqKioqLyBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuLyoqKioqKi8gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBnZXR0ZXIgfSk7XG4vKioqKioqLyBcdFx0fVxuLyoqKioqKi8gXHR9O1xuLyoqKioqKi9cbi8qKioqKiovIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4vKioqKioqLyBcdFx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG4vKioqKioqLyBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbi8qKioqKiovIFx0XHR9XG4vKioqKioqLyBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbi8qKioqKiovIFx0fTtcbi8qKioqKiovXG4vKioqKioqLyBcdC8vIGNyZWF0ZSBhIGZha2UgbmFtZXNwYWNlIG9iamVjdFxuLyoqKioqKi8gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbi8qKioqKiovIFx0Ly8gbW9kZSAmIDI6IG1lcmdlIGFsbCBwcm9wZXJ0aWVzIG9mIHZhbHVlIGludG8gdGhlIG5zXG4vKioqKioqLyBcdC8vIG1vZGUgJiA0OiByZXR1cm4gdmFsdWUgd2hlbiBhbHJlYWR5IG5zIG9iamVjdFxuLyoqKioqKi8gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18udCA9IGZ1bmN0aW9uKHZhbHVlLCBtb2RlKSB7XG4vKioqKioqLyBcdFx0aWYobW9kZSAmIDEpIHZhbHVlID0gX193ZWJwYWNrX3JlcXVpcmVfXyh2YWx1ZSk7XG4vKioqKioqLyBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbi8qKioqKiovIFx0XHRpZigobW9kZSAmIDQpICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgJiYgdmFsdWUuX19lc01vZHVsZSkgcmV0dXJuIHZhbHVlO1xuLyoqKioqKi8gXHRcdHZhciBucyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbi8qKioqKiovIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkobnMsICdkZWZhdWx0JywgeyBlbnVtZXJhYmxlOiB0cnVlLCB2YWx1ZTogdmFsdWUgfSk7XG4vKioqKioqLyBcdFx0aWYobW9kZSAmIDIgJiYgdHlwZW9mIHZhbHVlICE9ICdzdHJpbmcnKSBmb3IodmFyIGtleSBpbiB2YWx1ZSkgX193ZWJwYWNrX3JlcXVpcmVfXy5kKG5zLCBrZXksIGZ1bmN0aW9uKGtleSkgeyByZXR1cm4gdmFsdWVba2V5XTsgfS5iaW5kKG51bGwsIGtleSkpO1xuLyoqKioqKi8gXHRcdHJldHVybiBucztcbi8qKioqKiovIFx0fTtcbi8qKioqKiovXG4vKioqKioqLyBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuLyoqKioqKi8gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuLyoqKioqKi8gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbi8qKioqKiovIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4vKioqKioqLyBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuLyoqKioqKi8gXHRcdHJldHVybiBnZXR0ZXI7XG4vKioqKioqLyBcdH07XG4vKioqKioqL1xuLyoqKioqKi8gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuLyoqKioqKi9cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcbi8qKioqKiovXG4vKioqKioqL1xuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL3NyYy9pbmRleC5qc1wiKTtcbi8qKioqKiovIH0pXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gKHtcblxuLyoqKi8gXCIuL25vZGVfbW9kdWxlcy9hc3NlcnQvYXNzZXJ0LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9ub2RlX21vZHVsZXMvYXNzZXJ0L2Fzc2VydC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyohIG5vIHN0YXRpYyBleHBvcnRzIGZvdW5kICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuLyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKGdsb2JhbCkge1xuXG4vLyBjb21wYXJlIGFuZCBpc0J1ZmZlciB0YWtlbiBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9mZXJvc3MvYnVmZmVyL2Jsb2IvNjgwZTllNWU0ODhmMjJhYWMyNzU5OWE1N2RjODQ0YTYzMTU5MjhkZC9pbmRleC5qc1xuLy8gb3JpZ2luYWwgbm90aWNlOlxuXG4vKiFcbiAqIFRoZSBidWZmZXIgbW9kdWxlIGZyb20gbm9kZS5qcywgZm9yIHRoZSBicm93c2VyLlxuICpcbiAqIEBhdXRob3IgICBGZXJvc3MgQWJvdWtoYWRpamVoIDxmZXJvc3NAZmVyb3NzLm9yZz4gPGh0dHA6Ly9mZXJvc3Mub3JnPlxuICogQGxpY2Vuc2UgIE1JVFxuICovXG5mdW5jdGlvbiBjb21wYXJlKGEsIGIpIHtcbiAgaWYgKGEgPT09IGIpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIHZhciB4ID0gYS5sZW5ndGg7XG4gIHZhciB5ID0gYi5sZW5ndGg7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IE1hdGgubWluKHgsIHkpOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZiAoYVtpXSAhPT0gYltpXSkge1xuICAgICAgeCA9IGFbaV07XG4gICAgICB5ID0gYltpXTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmICh4IDwgeSkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICBpZiAoeSA8IHgpIHtcbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gMDtcbn1cbmZ1bmN0aW9uIGlzQnVmZmVyKGIpIHtcbiAgaWYgKGdsb2JhbC5CdWZmZXIgJiYgdHlwZW9mIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihiKTtcbiAgfVxuICByZXR1cm4gISEoYiAhPSBudWxsICYmIGIuX2lzQnVmZmVyKTtcbn1cblxuLy8gYmFzZWQgb24gbm9kZSBhc3NlcnQsIG9yaWdpbmFsIG5vdGljZTpcblxuLy8gaHR0cDovL3dpa2kuY29tbW9uanMub3JnL3dpa2kvVW5pdF9UZXN0aW5nLzEuMFxuLy9cbi8vIFRISVMgSVMgTk9UIFRFU1RFRCBOT1IgTElLRUxZIFRPIFdPUksgT1VUU0lERSBWOCFcbi8vXG4vLyBPcmlnaW5hbGx5IGZyb20gbmFyd2hhbC5qcyAoaHR0cDovL25hcndoYWxqcy5vcmcpXG4vLyBDb3B5cmlnaHQgKGMpIDIwMDkgVGhvbWFzIFJvYmluc29uIDwyODBub3J0aC5jb20+XG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuLy8gb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgJ1NvZnR3YXJlJyksIHRvXG4vLyBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZVxuLy8gcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yXG4vLyBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuLy8gZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuLy8gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEICdBUyBJUycsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1Jcbi8vIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuLy8gRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4vLyBBVVRIT1JTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTlxuLy8gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTlxuLy8gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciB1dGlsID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgdXRpbC8gKi8gXCIuL25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanNcIik7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgZnVuY3Rpb25zSGF2ZU5hbWVzID0gKGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGZvbygpIHt9Lm5hbWUgPT09ICdmb28nO1xufSgpKTtcbmZ1bmN0aW9uIHBUb1N0cmluZyAob2JqKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTtcbn1cbmZ1bmN0aW9uIGlzVmlldyhhcnJidWYpIHtcbiAgaWYgKGlzQnVmZmVyKGFycmJ1ZikpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHR5cGVvZiBnbG9iYWwuQXJyYXlCdWZmZXIgIT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlci5pc1ZpZXcgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gQXJyYXlCdWZmZXIuaXNWaWV3KGFycmJ1Zik7XG4gIH1cbiAgaWYgKCFhcnJidWYpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgaWYgKGFycmJ1ZiBpbnN0YW5jZW9mIERhdGFWaWV3KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaWYgKGFycmJ1Zi5idWZmZXIgJiYgYXJyYnVmLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxudmFyIHJlZ2V4ID0gL1xccypmdW5jdGlvblxccysoW15cXChcXHNdKilcXHMqLztcbi8vIGJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9samhhcmIvZnVuY3Rpb24ucHJvdG90eXBlLm5hbWUvYmxvYi9hZGVlZWVjOGJmY2M2MDY4YjE4N2Q3ZDlmYjNkNWJiMWQzYTMwODk5L2ltcGxlbWVudGF0aW9uLmpzXG5mdW5jdGlvbiBnZXROYW1lKGZ1bmMpIHtcbiAgaWYgKCF1dGlsLmlzRnVuY3Rpb24oZnVuYykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGZ1bmN0aW9uc0hhdmVOYW1lcykge1xuICAgIHJldHVybiBmdW5jLm5hbWU7XG4gIH1cbiAgdmFyIHN0ciA9IGZ1bmMudG9TdHJpbmcoKTtcbiAgdmFyIG1hdGNoID0gc3RyLm1hdGNoKHJlZ2V4KTtcbiAgcmV0dXJuIG1hdGNoICYmIG1hdGNoWzFdO1xufVxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBzdGFja1N0YXJ0RnVuY3Rpb24pO1xuICB9IGVsc2Uge1xuICAgIC8vIG5vbiB2OCBicm93c2VycyBzbyB3ZSBjYW4gaGF2ZSBhIHN0YWNrdHJhY2VcbiAgICB2YXIgZXJyID0gbmV3IEVycm9yKCk7XG4gICAgaWYgKGVyci5zdGFjaykge1xuICAgICAgdmFyIG91dCA9IGVyci5zdGFjaztcblxuICAgICAgLy8gdHJ5IHRvIHN0cmlwIHVzZWxlc3MgZnJhbWVzXG4gICAgICB2YXIgZm5fbmFtZSA9IGdldE5hbWUoc3RhY2tTdGFydEZ1bmN0aW9uKTtcbiAgICAgIHZhciBpZHggPSBvdXQuaW5kZXhPZignXFxuJyArIGZuX25hbWUpO1xuICAgICAgaWYgKGlkeCA+PSAwKSB7XG4gICAgICAgIC8vIG9uY2Ugd2UgaGF2ZSBsb2NhdGVkIHRoZSBmdW5jdGlvbiBmcmFtZVxuICAgICAgICAvLyB3ZSBuZWVkIHRvIHN0cmlwIG91dCBldmVyeXRoaW5nIGJlZm9yZSBpdCAoYW5kIGl0cyBsaW5lKVxuICAgICAgICB2YXIgbmV4dF9saW5lID0gb3V0LmluZGV4T2YoJ1xcbicsIGlkeCArIDEpO1xuICAgICAgICBvdXQgPSBvdXQuc3Vic3RyaW5nKG5leHRfbGluZSArIDEpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnN0YWNrID0gb3V0O1xuICAgIH1cbiAgfVxufTtcblxuLy8gYXNzZXJ0LkFzc2VydGlvbkVycm9yIGluc3RhbmNlb2YgRXJyb3JcbnV0aWwuaW5oZXJpdHMoYXNzZXJ0LkFzc2VydGlvbkVycm9yLCBFcnJvcik7XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHR5cGVvZiBzID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBzLmxlbmd0aCA8IG4gPyBzIDogcy5zbGljZSgwLCBuKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gcztcbiAgfVxufVxuZnVuY3Rpb24gaW5zcGVjdChzb21ldGhpbmcpIHtcbiAgaWYgKGZ1bmN0aW9uc0hhdmVOYW1lcyB8fCAhdXRpbC5pc0Z1bmN0aW9uKHNvbWV0aGluZykpIHtcbiAgICByZXR1cm4gdXRpbC5pbnNwZWN0KHNvbWV0aGluZyk7XG4gIH1cbiAgdmFyIHJhd25hbWUgPSBnZXROYW1lKHNvbWV0aGluZyk7XG4gIHZhciBuYW1lID0gcmF3bmFtZSA/ICc6ICcgKyByYXduYW1lIDogJyc7XG4gIHJldHVybiAnW0Z1bmN0aW9uJyArICBuYW1lICsgJ10nO1xufVxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShpbnNwZWN0KHNlbGYuYWN0dWFsKSwgMTI4KSArICcgJyArXG4gICAgICAgICBzZWxmLm9wZXJhdG9yICsgJyAnICtcbiAgICAgICAgIHRydW5jYXRlKGluc3BlY3Qoc2VsZi5leHBlY3RlZCksIDEyOCk7XG59XG5cbi8vIEF0IHByZXNlbnQgb25seSB0aGUgdGhyZWUga2V5cyBtZW50aW9uZWQgYWJvdmUgYXJlIHVzZWQgYW5kXG4vLyB1bmRlcnN0b29kIGJ5IHRoZSBzcGVjLiBJbXBsZW1lbnRhdGlvbnMgb3Igc3ViIG1vZHVsZXMgY2FuIHBhc3Ncbi8vIG90aGVyIGtleXMgdG8gdGhlIEFzc2VydGlvbkVycm9yJ3MgY29uc3RydWN0b3IgLSB0aGV5IHdpbGwgYmVcbi8vIGlnbm9yZWQuXG5cbi8vIDMuIEFsbCBvZiB0aGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBtdXN0IHRocm93IGFuIEFzc2VydGlvbkVycm9yXG4vLyB3aGVuIGEgY29ycmVzcG9uZGluZyBjb25kaXRpb24gaXMgbm90IG1ldCwgd2l0aCBhIG1lc3NhZ2UgdGhhdFxuLy8gbWF5IGJlIHVuZGVmaW5lZCBpZiBub3QgcHJvdmlkZWQuICBBbGwgYXNzZXJ0aW9uIG1ldGhvZHMgcHJvdmlkZVxuLy8gYm90aCB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXMgdG8gdGhlIGFzc2VydGlvbiBlcnJvciBmb3Jcbi8vIGRpc3BsYXkgcHVycG9zZXMuXG5cbmZ1bmN0aW9uIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgb3BlcmF0b3IsIHN0YWNrU3RhcnRGdW5jdGlvbikge1xuICB0aHJvdyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHtcbiAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgIGFjdHVhbDogYWN0dWFsLFxuICAgIGV4cGVjdGVkOiBleHBlY3RlZCxcbiAgICBvcGVyYXRvcjogb3BlcmF0b3IsXG4gICAgc3RhY2tTdGFydEZ1bmN0aW9uOiBzdGFja1N0YXJ0RnVuY3Rpb25cbiAgfSk7XG59XG5cbi8vIEVYVEVOU0lPTiEgYWxsb3dzIGZvciB3ZWxsIGJlaGF2ZWQgZXJyb3JzIGRlZmluZWQgZWxzZXdoZXJlLlxuYXNzZXJ0LmZhaWwgPSBmYWlsO1xuXG4vLyA0LiBQdXJlIGFzc2VydGlvbiB0ZXN0cyB3aGV0aGVyIGEgdmFsdWUgaXMgdHJ1dGh5LCBhcyBkZXRlcm1pbmVkXG4vLyBieSAhIWd1YXJkLlxuLy8gYXNzZXJ0Lm9rKGd1YXJkLCBtZXNzYWdlX29wdCk7XG4vLyBUaGlzIHN0YXRlbWVudCBpcyBlcXVpdmFsZW50IHRvIGFzc2VydC5lcXVhbCh0cnVlLCAhIWd1YXJkLFxuLy8gbWVzc2FnZV9vcHQpOy4gVG8gdGVzdCBzdHJpY3RseSBmb3IgdGhlIHZhbHVlIHRydWUsIHVzZVxuLy8gYXNzZXJ0LnN0cmljdEVxdWFsKHRydWUsIGd1YXJkLCBtZXNzYWdlX29wdCk7LlxuXG5mdW5jdGlvbiBvayh2YWx1ZSwgbWVzc2FnZSkge1xuICBpZiAoIXZhbHVlKSBmYWlsKHZhbHVlLCB0cnVlLCBtZXNzYWdlLCAnPT0nLCBhc3NlcnQub2spO1xufVxuYXNzZXJ0Lm9rID0gb2s7XG5cbi8vIDUuIFRoZSBlcXVhbGl0eSBhc3NlcnRpb24gdGVzdHMgc2hhbGxvdywgY29lcmNpdmUgZXF1YWxpdHkgd2l0aFxuLy8gPT0uXG4vLyBhc3NlcnQuZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZXF1YWwgPSBmdW5jdGlvbiBlcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT0gZXhwZWN0ZWQpIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJz09JywgYXNzZXJ0LmVxdWFsKTtcbn07XG5cbi8vIDYuIFRoZSBub24tZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIGZvciB3aGV0aGVyIHR3byBvYmplY3RzIGFyZSBub3QgZXF1YWxcbi8vIHdpdGggIT0gYXNzZXJ0Lm5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdEVxdWFsID0gZnVuY3Rpb24gbm90RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsID09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnIT0nLCBhc3NlcnQubm90RXF1YWwpO1xuICB9XG59O1xuXG4vLyA3LiBUaGUgZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGEgZGVlcCBlcXVhbGl0eSByZWxhdGlvbi5cbi8vIGFzc2VydC5kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuZGVlcEVxdWFsID0gZnVuY3Rpb24gZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIGZhbHNlKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5hc3NlcnQuZGVlcFN0cmljdEVxdWFsID0gZnVuY3Rpb24gZGVlcFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKCFfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHRydWUpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnZGVlcFN0cmljdEVxdWFsJywgYXNzZXJ0LmRlZXBTdHJpY3RFcXVhbCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIF9kZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgc3RyaWN0LCBtZW1vcykge1xuICAvLyA3LjEuIEFsbCBpZGVudGljYWwgdmFsdWVzIGFyZSBlcXVpdmFsZW50LCBhcyBkZXRlcm1pbmVkIGJ5ID09PS5cbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSBlbHNlIGlmIChpc0J1ZmZlcihhY3R1YWwpICYmIGlzQnVmZmVyKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBjb21wYXJlKGFjdHVhbCwgZXhwZWN0ZWQpID09PSAwO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICgoYWN0dWFsID09PSBudWxsIHx8IHR5cGVvZiBhY3R1YWwgIT09ICdvYmplY3QnKSAmJlxuICAgICAgICAgICAgIChleHBlY3RlZCA9PT0gbnVsbCB8fCB0eXBlb2YgZXhwZWN0ZWQgIT09ICdvYmplY3QnKSkge1xuICAgIHJldHVybiBzdHJpY3QgPyBhY3R1YWwgPT09IGV4cGVjdGVkIDogYWN0dWFsID09IGV4cGVjdGVkO1xuXG4gIC8vIElmIGJvdGggdmFsdWVzIGFyZSBpbnN0YW5jZXMgb2YgdHlwZWQgYXJyYXlzLCB3cmFwIHRoZWlyIHVuZGVybHlpbmdcbiAgLy8gQXJyYXlCdWZmZXJzIGluIGEgQnVmZmVyIGVhY2ggdG8gaW5jcmVhc2UgcGVyZm9ybWFuY2VcbiAgLy8gVGhpcyBvcHRpbWl6YXRpb24gcmVxdWlyZXMgdGhlIGFycmF5cyB0byBoYXZlIHRoZSBzYW1lIHR5cGUgYXMgY2hlY2tlZCBieVxuICAvLyBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nIChha2EgcFRvU3RyaW5nKS4gTmV2ZXIgcGVyZm9ybSBiaW5hcnlcbiAgLy8gY29tcGFyaXNvbnMgZm9yIEZsb2F0KkFycmF5cywgdGhvdWdoLCBzaW5jZSBlLmcuICswID09PSAtMCBidXQgdGhlaXJcbiAgLy8gYml0IHBhdHRlcm5zIGFyZSBub3QgaWRlbnRpY2FsLlxuICB9IGVsc2UgaWYgKGlzVmlldyhhY3R1YWwpICYmIGlzVmlldyhleHBlY3RlZCkgJiZcbiAgICAgICAgICAgICBwVG9TdHJpbmcoYWN0dWFsKSA9PT0gcFRvU3RyaW5nKGV4cGVjdGVkKSAmJlxuICAgICAgICAgICAgICEoYWN0dWFsIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5IHx8XG4gICAgICAgICAgICAgICBhY3R1YWwgaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpKSB7XG4gICAgcmV0dXJuIGNvbXBhcmUobmV3IFVpbnQ4QXJyYXkoYWN0dWFsLmJ1ZmZlciksXG4gICAgICAgICAgICAgICAgICAgbmV3IFVpbnQ4QXJyYXkoZXhwZWN0ZWQuYnVmZmVyKSkgPT09IDA7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIGlmIChpc0J1ZmZlcihhY3R1YWwpICE9PSBpc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbWVtb3MgPSBtZW1vcyB8fCB7YWN0dWFsOiBbXSwgZXhwZWN0ZWQ6IFtdfTtcblxuICAgIHZhciBhY3R1YWxJbmRleCA9IG1lbW9zLmFjdHVhbC5pbmRleE9mKGFjdHVhbCk7XG4gICAgaWYgKGFjdHVhbEluZGV4ICE9PSAtMSkge1xuICAgICAgaWYgKGFjdHVhbEluZGV4ID09PSBtZW1vcy5leHBlY3RlZC5pbmRleE9mKGV4cGVjdGVkKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBtZW1vcy5hY3R1YWwucHVzaChhY3R1YWwpO1xuICAgIG1lbW9zLmV4cGVjdGVkLnB1c2goZXhwZWN0ZWQpO1xuXG4gICAgcmV0dXJuIG9iakVxdWl2KGFjdHVhbCwgZXhwZWN0ZWQsIHN0cmljdCwgbWVtb3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXJndW1lbnRzKG9iamVjdCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iamVjdCkgPT0gJ1tvYmplY3QgQXJndW1lbnRzXSc7XG59XG5cbmZ1bmN0aW9uIG9iakVxdWl2KGEsIGIsIHN0cmljdCwgYWN0dWFsVmlzaXRlZE9iamVjdHMpIHtcbiAgaWYgKGEgPT09IG51bGwgfHwgYSA9PT0gdW5kZWZpbmVkIHx8IGIgPT09IG51bGwgfHwgYiA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gaWYgb25lIGlzIGEgcHJpbWl0aXZlLCB0aGUgb3RoZXIgbXVzdCBiZSBzYW1lXG4gIGlmICh1dGlsLmlzUHJpbWl0aXZlKGEpIHx8IHV0aWwuaXNQcmltaXRpdmUoYikpXG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIGlmIChzdHJpY3QgJiYgT2JqZWN0LmdldFByb3RvdHlwZU9mKGEpICE9PSBPYmplY3QuZ2V0UHJvdG90eXBlT2YoYikpXG4gICAgcmV0dXJuIGZhbHNlO1xuICB2YXIgYUlzQXJncyA9IGlzQXJndW1lbnRzKGEpO1xuICB2YXIgYklzQXJncyA9IGlzQXJndW1lbnRzKGIpO1xuICBpZiAoKGFJc0FyZ3MgJiYgIWJJc0FyZ3MpIHx8ICghYUlzQXJncyAmJiBiSXNBcmdzKSlcbiAgICByZXR1cm4gZmFsc2U7XG4gIGlmIChhSXNBcmdzKSB7XG4gICAgYSA9IHBTbGljZS5jYWxsKGEpO1xuICAgIGIgPSBwU2xpY2UuY2FsbChiKTtcbiAgICByZXR1cm4gX2RlZXBFcXVhbChhLCBiLCBzdHJpY3QpO1xuICB9XG4gIHZhciBrYSA9IG9iamVjdEtleXMoYSk7XG4gIHZhciBrYiA9IG9iamVjdEtleXMoYik7XG4gIHZhciBrZXksIGk7XG4gIC8vIGhhdmluZyB0aGUgc2FtZSBudW1iZXIgb2Ygb3duZWQgcHJvcGVydGllcyAoa2V5cyBpbmNvcnBvcmF0ZXNcbiAgLy8gaGFzT3duUHJvcGVydHkpXG4gIGlmIChrYS5sZW5ndGggIT09IGtiLmxlbmd0aClcbiAgICByZXR1cm4gZmFsc2U7XG4gIC8vdGhlIHNhbWUgc2V0IG9mIGtleXMgKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksXG4gIGthLnNvcnQoKTtcbiAga2Iuc29ydCgpO1xuICAvL35+fmNoZWFwIGtleSB0ZXN0XG4gIGZvciAoaSA9IGthLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgaWYgKGthW2ldICE9PSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSwgc3RyaWN0LCBhY3R1YWxWaXNpdGVkT2JqZWN0cykpXG4gICAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8vIDguIFRoZSBub24tZXF1aXZhbGVuY2UgYXNzZXJ0aW9uIHRlc3RzIGZvciBhbnkgZGVlcCBpbmVxdWFsaXR5LlxuLy8gYXNzZXJ0Lm5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3REZWVwRXF1YWwgPSBmdW5jdGlvbiBub3REZWVwRXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBmYWxzZSkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICdub3REZWVwRXF1YWwnLCBhc3NlcnQubm90RGVlcEVxdWFsKTtcbiAgfVxufTtcblxuYXNzZXJ0Lm5vdERlZXBTdHJpY3RFcXVhbCA9IG5vdERlZXBTdHJpY3RFcXVhbDtcbmZ1bmN0aW9uIG5vdERlZXBTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIHRydWUpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcFN0cmljdEVxdWFsJywgbm90RGVlcFN0cmljdEVxdWFsKTtcbiAgfVxufVxuXG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgaWYgKGFjdHVhbCBpbnN0YW5jZW9mIGV4cGVjdGVkKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICAvLyBJZ25vcmUuICBUaGUgaW5zdGFuY2VvZiBjaGVjayBkb2Vzbid0IHdvcmsgZm9yIGFycm93IGZ1bmN0aW9ucy5cbiAgfVxuXG4gIGlmIChFcnJvci5pc1Byb3RvdHlwZU9mKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBleHBlY3RlZC5jYWxsKHt9LCBhY3R1YWwpID09PSB0cnVlO1xufVxuXG5mdW5jdGlvbiBfdHJ5QmxvY2soYmxvY2spIHtcbiAgdmFyIGVycm9yO1xuICB0cnkge1xuICAgIGJsb2NrKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBlcnJvciA9IGU7XG4gIH1cbiAgcmV0dXJuIGVycm9yO1xufVxuXG5mdW5jdGlvbiBfdGhyb3dzKHNob3VsZFRocm93LCBibG9jaywgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgdmFyIGFjdHVhbDtcblxuICBpZiAodHlwZW9mIGJsb2NrICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJibG9ja1wiIGFyZ3VtZW50IG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB9XG5cbiAgaWYgKHR5cGVvZiBleHBlY3RlZCA9PT0gJ3N0cmluZycpIHtcbiAgICBtZXNzYWdlID0gZXhwZWN0ZWQ7XG4gICAgZXhwZWN0ZWQgPSBudWxsO1xuICB9XG5cbiAgYWN0dWFsID0gX3RyeUJsb2NrKGJsb2NrKTtcblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIHZhciB1c2VyUHJvdmlkZWRNZXNzYWdlID0gdHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnO1xuICB2YXIgaXNVbndhbnRlZEV4Y2VwdGlvbiA9ICFzaG91bGRUaHJvdyAmJiB1dGlsLmlzRXJyb3IoYWN0dWFsKTtcbiAgdmFyIGlzVW5leHBlY3RlZEV4Y2VwdGlvbiA9ICFzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgIWV4cGVjdGVkO1xuXG4gIGlmICgoaXNVbndhbnRlZEV4Y2VwdGlvbiAmJlxuICAgICAgdXNlclByb3ZpZGVkTWVzc2FnZSAmJlxuICAgICAgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHx8XG4gICAgICBpc1VuZXhwZWN0ZWRFeGNlcHRpb24pIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3ModHJ1ZSwgYmxvY2ssIGVycm9yLCBtZXNzYWdlKTtcbn07XG5cbi8vIEVYVEVOU0lPTiEgVGhpcyBpcyBhbm5veWluZyB0byB3cml0ZSBvdXRzaWRlIHRoaXMgbW9kdWxlLlxuYXNzZXJ0LmRvZXNOb3RUaHJvdyA9IGZ1bmN0aW9uKGJsb2NrLCAvKm9wdGlvbmFsKi9lcnJvciwgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzKGZhbHNlLCBibG9jaywgZXJyb3IsIG1lc3NhZ2UpO1xufTtcblxuYXNzZXJ0LmlmRXJyb3IgPSBmdW5jdGlvbihlcnIpIHsgaWYgKGVycikgdGhyb3cgZXJyOyB9O1xuXG52YXIgb2JqZWN0S2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIChvYmopIHtcbiAgdmFyIGtleXMgPSBbXTtcbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChoYXNPd24uY2FsbChvYmosIGtleSkpIGtleXMucHVzaChrZXkpO1xuICB9XG4gIHJldHVybiBrZXlzO1xufTtcblxuLyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKHRoaXMsIF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vLi4vd2VicGFjay9idWlsZGluL2dsb2JhbC5qcyAqLyBcIi4vbm9kZV9tb2R1bGVzL3dlYnBhY2svYnVpbGRpbi9nbG9iYWwuanNcIikpKVxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL25vZGVfbW9kdWxlcy9kY3QvaW5kZXguanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbm9kZV9tb2R1bGVzL2RjdC9pbmRleC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgbm8gc3RhdGljIGV4cG9ydHMgZm91bmQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxubW9kdWxlLmV4cG9ydHMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3NyYy9kY3QuanMgKi8gXCIuL25vZGVfbW9kdWxlcy9kY3Qvc3JjL2RjdC5qc1wiKTtcblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL25vZGVfbW9kdWxlcy9kY3Qvc3JjL2RjdC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL25vZGVfbW9kdWxlcy9kY3Qvc3JjL2RjdC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBubyBzdGF0aWMgZXhwb3J0cyBmb3VuZCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG4vKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSpcXFxuICogRGlzY3JldGUgQ29zaW5lIFRyYW5zZm9ybVxuICpcbiAqIChjKSBWYWlsIFN5c3RlbXMuIEpvc2h1YSBKdW5nIGFuZCBCZW4gQnJ5YW4uIDIwMTVcbiAqXG4gKiBUaGlzIGNvZGUgaXMgbm90IGRlc2lnbmVkIHRvIGJlIGhpZ2hseSBvcHRpbWl6ZWQgYnV0IGFzIGFuIGVkdWNhdGlvbmFsXG4gKiB0b29sIHRvIHVuZGVyc3RhbmQgdGhlIE1lbC1zY2FsZSBhbmQgaXRzIHJlbGF0ZWQgY29lZmZpY2llbnRzIHVzZWQgaW5cbiAqIGh1bWFuIHNwZWVjaCBhbmFseXNpcy5cblxcKj09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PSovXG5jb3NNYXAgPSBudWxsO1xuXG4vLyBCdWlsZHMgYSBjb3NpbmUgbWFwIGZvciB0aGUgZ2l2ZW4gaW5wdXQgc2l6ZS4gVGhpcyBhbGxvd3MgbXVsdGlwbGUgaW5wdXQgc2l6ZXMgdG8gYmUgbWVtb2l6ZWQgYXV0b21hZ2ljYWxseVxuLy8gaWYgeW91IHdhbnQgdG8gcnVuIHRoZSBEQ1Qgb3ZlciBhbmQgb3Zlci5cbnZhciBtZW1vaXplQ29zaW5lcyA9IGZ1bmN0aW9uKE4pIHtcbiAgY29zTWFwID0gY29zTWFwIHx8IHt9O1xuICBjb3NNYXBbTl0gPSBuZXcgQXJyYXkoTipOKTtcblxuICB2YXIgUElfTiA9IE1hdGguUEkgLyBOO1xuXG4gIGZvciAodmFyIGsgPSAwOyBrIDwgTjsgaysrKSB7XG4gICAgZm9yICh2YXIgbiA9IDA7IG4gPCBOOyBuKyspIHtcbiAgICAgIGNvc01hcFtOXVtuICsgKGsgKiBOKV0gPSBNYXRoLmNvcyhQSV9OICogKG4gKyAwLjUpICogayk7XG4gICAgfVxuICB9XG59O1xuXG5mdW5jdGlvbiBkY3Qoc2lnbmFsLCBzY2FsZSkge1xuICB2YXIgTCA9IHNpZ25hbC5sZW5ndGg7XG4gIHNjYWxlID0gc2NhbGUgfHwgMjtcblxuICBpZiAoIWNvc01hcCB8fCAhY29zTWFwW0xdKSBtZW1vaXplQ29zaW5lcyhMKTtcblxuICB2YXIgY29lZmZpY2llbnRzID0gc2lnbmFsLm1hcChmdW5jdGlvbiAoKSB7cmV0dXJuIDA7fSk7XG5cbiAgcmV0dXJuIGNvZWZmaWNpZW50cy5tYXAoZnVuY3Rpb24gKF9fLCBpeCkge1xuICAgIHJldHVybiBzY2FsZSAqIHNpZ25hbC5yZWR1Y2UoZnVuY3Rpb24gKHByZXYsIGN1ciwgaXhfLCBhcnIpIHtcbiAgICAgIHJldHVybiBwcmV2ICsgKGN1ciAqIGNvc01hcFtMXVtpeF8gKyAoaXggKiBMKV0pO1xuICAgIH0sIDApO1xuICB9KTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZGN0O1xuXG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbm9kZV9tb2R1bGVzL2ZmdGpzL2Rpc3QvZmZ0LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbm9kZV9tb2R1bGVzL2ZmdGpzL2Rpc3QvZmZ0LmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyohIG5vIHN0YXRpYyBleHBvcnRzIGZvdW5kICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5cbnZhciB1dGlscyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vdXRpbHMgKi8gXCIuL25vZGVfbW9kdWxlcy9mZnRqcy9kaXN0L3V0aWxzLmpzXCIpO1xuXG4vLyByZWFsIHRvIGNvbXBsZXggZmZ0XG52YXIgZmZ0ID0gZnVuY3Rpb24gZmZ0KHNpZ25hbCkge1xuXG4gIHZhciBjb21wbGV4U2lnbmFsID0ge307XG5cbiAgaWYgKHNpZ25hbC5yZWFsID09PSB1bmRlZmluZWQgfHwgc2lnbmFsLmltYWcgPT09IHVuZGVmaW5lZCkge1xuICAgIGNvbXBsZXhTaWduYWwgPSB1dGlscy5jb25zdHJ1Y3RDb21wbGV4QXJyYXkoc2lnbmFsKTtcbiAgfSBlbHNlIHtcbiAgICBjb21wbGV4U2lnbmFsLnJlYWwgPSBzaWduYWwucmVhbC5zbGljZSgpO1xuICAgIGNvbXBsZXhTaWduYWwuaW1hZyA9IHNpZ25hbC5pbWFnLnNsaWNlKCk7XG4gIH1cblxuICB2YXIgTiA9IGNvbXBsZXhTaWduYWwucmVhbC5sZW5ndGg7XG4gIHZhciBsb2dOID0gTWF0aC5sb2cyKE4pO1xuXG4gIGlmIChNYXRoLnJvdW5kKGxvZ04pICE9IGxvZ04pIHRocm93IG5ldyBFcnJvcignSW5wdXQgc2l6ZSBtdXN0IGJlIGEgcG93ZXIgb2YgMi4nKTtcblxuICBpZiAoY29tcGxleFNpZ25hbC5yZWFsLmxlbmd0aCAhPSBjb21wbGV4U2lnbmFsLmltYWcubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdSZWFsIGFuZCBpbWFnaW5hcnkgY29tcG9uZW50cyBtdXN0IGhhdmUgdGhlIHNhbWUgbGVuZ3RoLicpO1xuICB9XG5cbiAgdmFyIGJpdFJldmVyc2VkSW5kaWNlcyA9IHV0aWxzLmJpdFJldmVyc2VBcnJheShOKTtcblxuICAvLyBzb3J0IGFycmF5XG4gIHZhciBvcmRlcmVkID0ge1xuICAgICdyZWFsJzogW10sXG4gICAgJ2ltYWcnOiBbXVxuICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgTjsgaSsrKSB7XG4gICAgb3JkZXJlZC5yZWFsW2JpdFJldmVyc2VkSW5kaWNlc1tpXV0gPSBjb21wbGV4U2lnbmFsLnJlYWxbaV07XG4gICAgb3JkZXJlZC5pbWFnW2JpdFJldmVyc2VkSW5kaWNlc1tpXV0gPSBjb21wbGV4U2lnbmFsLmltYWdbaV07XG4gIH1cblxuICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgTjsgX2krKykge1xuICAgIGNvbXBsZXhTaWduYWwucmVhbFtfaV0gPSBvcmRlcmVkLnJlYWxbX2ldO1xuICAgIGNvbXBsZXhTaWduYWwuaW1hZ1tfaV0gPSBvcmRlcmVkLmltYWdbX2ldO1xuICB9XG4gIC8vIGl0ZXJhdGUgb3ZlciB0aGUgbnVtYmVyIG9mIHN0YWdlc1xuICBmb3IgKHZhciBuID0gMTsgbiA8PSBsb2dOOyBuKyspIHtcbiAgICB2YXIgY3Vyck4gPSBNYXRoLnBvdygyLCBuKTtcblxuICAgIC8vIGZpbmQgdHdpZGRsZSBmYWN0b3JzXG4gICAgZm9yICh2YXIgayA9IDA7IGsgPCBjdXJyTiAvIDI7IGsrKykge1xuICAgICAgdmFyIHR3aWRkbGUgPSB1dGlscy5ldWxlcihrLCBjdXJyTik7XG5cbiAgICAgIC8vIG9uIGVhY2ggYmxvY2sgb2YgRlQsIGltcGxlbWVudCB0aGUgYnV0dGVyZmx5IGRpYWdyYW1cbiAgICAgIGZvciAodmFyIG0gPSAwOyBtIDwgTiAvIGN1cnJOOyBtKyspIHtcbiAgICAgICAgdmFyIGN1cnJFdmVuSW5kZXggPSBjdXJyTiAqIG0gKyBrO1xuICAgICAgICB2YXIgY3Vyck9kZEluZGV4ID0gY3Vyck4gKiBtICsgayArIGN1cnJOIC8gMjtcblxuICAgICAgICB2YXIgY3VyckV2ZW5JbmRleFNhbXBsZSA9IHtcbiAgICAgICAgICAncmVhbCc6IGNvbXBsZXhTaWduYWwucmVhbFtjdXJyRXZlbkluZGV4XSxcbiAgICAgICAgICAnaW1hZyc6IGNvbXBsZXhTaWduYWwuaW1hZ1tjdXJyRXZlbkluZGV4XVxuICAgICAgICB9O1xuICAgICAgICB2YXIgY3Vyck9kZEluZGV4U2FtcGxlID0ge1xuICAgICAgICAgICdyZWFsJzogY29tcGxleFNpZ25hbC5yZWFsW2N1cnJPZGRJbmRleF0sXG4gICAgICAgICAgJ2ltYWcnOiBjb21wbGV4U2lnbmFsLmltYWdbY3Vyck9kZEluZGV4XVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBvZGQgPSB1dGlscy5tdWx0aXBseSh0d2lkZGxlLCBjdXJyT2RkSW5kZXhTYW1wbGUpO1xuXG4gICAgICAgIHZhciBzdWJ0cmFjdGlvblJlc3VsdCA9IHV0aWxzLnN1YnRyYWN0KGN1cnJFdmVuSW5kZXhTYW1wbGUsIG9kZCk7XG4gICAgICAgIGNvbXBsZXhTaWduYWwucmVhbFtjdXJyT2RkSW5kZXhdID0gc3VidHJhY3Rpb25SZXN1bHQucmVhbDtcbiAgICAgICAgY29tcGxleFNpZ25hbC5pbWFnW2N1cnJPZGRJbmRleF0gPSBzdWJ0cmFjdGlvblJlc3VsdC5pbWFnO1xuXG4gICAgICAgIHZhciBhZGRpdGlvblJlc3VsdCA9IHV0aWxzLmFkZChvZGQsIGN1cnJFdmVuSW5kZXhTYW1wbGUpO1xuICAgICAgICBjb21wbGV4U2lnbmFsLnJlYWxbY3VyckV2ZW5JbmRleF0gPSBhZGRpdGlvblJlc3VsdC5yZWFsO1xuICAgICAgICBjb21wbGV4U2lnbmFsLmltYWdbY3VyckV2ZW5JbmRleF0gPSBhZGRpdGlvblJlc3VsdC5pbWFnO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBjb21wbGV4U2lnbmFsO1xufTtcblxuLy8gY29tcGxleCB0byByZWFsIGlmZnRcbnZhciBpZmZ0ID0gZnVuY3Rpb24gaWZmdChzaWduYWwpIHtcblxuICBpZiAoc2lnbmFsLnJlYWwgPT09IHVuZGVmaW5lZCB8fCBzaWduYWwuaW1hZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSUZGVCBvbmx5IGFjY2VwdHMgYSBjb21wbGV4IGlucHV0LlwiKTtcbiAgfVxuXG4gIHZhciBOID0gc2lnbmFsLnJlYWwubGVuZ3RoO1xuXG4gIHZhciBjb21wbGV4U2lnbmFsID0ge1xuICAgICdyZWFsJzogW10sXG4gICAgJ2ltYWcnOiBbXVxuICB9O1xuXG4gIC8vdGFrZSBjb21wbGV4IGNvbmp1Z2F0ZSBpbiBvcmRlciB0byBiZSBhYmxlIHRvIHVzZSB0aGUgcmVndWxhciBGRlQgZm9yIElGRlRcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBOOyBpKyspIHtcbiAgICB2YXIgY3VycmVudFNhbXBsZSA9IHtcbiAgICAgICdyZWFsJzogc2lnbmFsLnJlYWxbaV0sXG4gICAgICAnaW1hZyc6IHNpZ25hbC5pbWFnW2ldXG4gICAgfTtcblxuICAgIHZhciBjb25qdWdhdGVTYW1wbGUgPSB1dGlscy5jb25qKGN1cnJlbnRTYW1wbGUpO1xuICAgIGNvbXBsZXhTaWduYWwucmVhbFtpXSA9IGNvbmp1Z2F0ZVNhbXBsZS5yZWFsO1xuICAgIGNvbXBsZXhTaWduYWwuaW1hZ1tpXSA9IGNvbmp1Z2F0ZVNhbXBsZS5pbWFnO1xuICB9XG5cbiAgLy9jb21wdXRlXG4gIHZhciBYID0gZmZ0KGNvbXBsZXhTaWduYWwpO1xuXG4gIC8vbm9ybWFsaXplXG4gIGNvbXBsZXhTaWduYWwucmVhbCA9IFgucmVhbC5tYXAoZnVuY3Rpb24gKHZhbCkge1xuICAgIHJldHVybiB2YWwgLyBOO1xuICB9KTtcblxuICBjb21wbGV4U2lnbmFsLmltYWcgPSBYLmltYWcubWFwKGZ1bmN0aW9uICh2YWwpIHtcbiAgICByZXR1cm4gdmFsIC8gTjtcbiAgfSk7XG5cbiAgcmV0dXJuIGNvbXBsZXhTaWduYWw7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZmZ0OiBmZnQsXG4gIGlmZnQ6IGlmZnRcbn07XG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbm9kZV9tb2R1bGVzL2ZmdGpzL2Rpc3QvdXRpbHMuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL25vZGVfbW9kdWxlcy9mZnRqcy9kaXN0L3V0aWxzLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgbm8gc3RhdGljIGV4cG9ydHMgZm91bmQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cblxuLy8gbWVtb2l6YXRpb24gb2YgdGhlIHJldmVyc2FsIG9mIGRpZmZlcmVudCBsZW5ndGhzLlxuXG5mdW5jdGlvbiBfdG9Db25zdW1hYmxlQXJyYXkoYXJyKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBBcnJheShhcnIubGVuZ3RoKTsgaSA8IGFyci5sZW5ndGg7IGkrKykgeyBhcnIyW2ldID0gYXJyW2ldOyB9IHJldHVybiBhcnIyOyB9IGVsc2UgeyByZXR1cm4gQXJyYXkuZnJvbShhcnIpOyB9IH1cblxudmFyIG1lbW9pemVkUmV2ZXJzYWwgPSB7fTtcbnZhciBtZW1vaXplZFplcm9CdWZmZXJzID0ge307XG5cbnZhciBjb25zdHJ1Y3RDb21wbGV4QXJyYXkgPSBmdW5jdGlvbiBjb25zdHJ1Y3RDb21wbGV4QXJyYXkoc2lnbmFsKSB7XG4gIHZhciBjb21wbGV4U2lnbmFsID0ge307XG5cbiAgY29tcGxleFNpZ25hbC5yZWFsID0gc2lnbmFsLnJlYWwgPT09IHVuZGVmaW5lZCA/IHNpZ25hbC5zbGljZSgpIDogc2lnbmFsLnJlYWwuc2xpY2UoKTtcblxuICB2YXIgYnVmZmVyU2l6ZSA9IGNvbXBsZXhTaWduYWwucmVhbC5sZW5ndGg7XG5cbiAgaWYgKG1lbW9pemVkWmVyb0J1ZmZlcnNbYnVmZmVyU2l6ZV0gPT09IHVuZGVmaW5lZCkge1xuICAgIG1lbW9pemVkWmVyb0J1ZmZlcnNbYnVmZmVyU2l6ZV0gPSBBcnJheS5hcHBseShudWxsLCBBcnJheShidWZmZXJTaXplKSkubWFwKE51bWJlci5wcm90b3R5cGUudmFsdWVPZiwgMCk7XG4gIH1cblxuICBjb21wbGV4U2lnbmFsLmltYWcgPSBtZW1vaXplZFplcm9CdWZmZXJzW2J1ZmZlclNpemVdLnNsaWNlKCk7XG5cbiAgcmV0dXJuIGNvbXBsZXhTaWduYWw7XG59O1xuXG52YXIgYml0UmV2ZXJzZUFycmF5ID0gZnVuY3Rpb24gYml0UmV2ZXJzZUFycmF5KE4pIHtcbiAgaWYgKG1lbW9pemVkUmV2ZXJzYWxbTl0gPT09IHVuZGVmaW5lZCkge1xuICAgIHZhciBtYXhCaW5hcnlMZW5ndGggPSAoTiAtIDEpLnRvU3RyaW5nKDIpLmxlbmd0aDsgLy9nZXQgdGhlIGJpbmFyeSBsZW5ndGggb2YgdGhlIGxhcmdlc3QgaW5kZXguXG4gICAgdmFyIHRlbXBsYXRlQmluYXJ5ID0gJzAnLnJlcGVhdChtYXhCaW5hcnlMZW5ndGgpOyAvL2NyZWF0ZSBhIHRlbXBsYXRlIGJpbmFyeSBvZiB0aGF0IGxlbmd0aC5cbiAgICB2YXIgcmV2ZXJzZWQgPSB7fTtcbiAgICBmb3IgKHZhciBuID0gMDsgbiA8IE47IG4rKykge1xuICAgICAgdmFyIGN1cnJCaW5hcnkgPSBuLnRvU3RyaW5nKDIpOyAvL2dldCBiaW5hcnkgdmFsdWUgb2YgY3VycmVudCBpbmRleC5cblxuICAgICAgLy9wcmVwZW5kIHplcm9zIGZyb20gdGVtcGxhdGUgdG8gY3VycmVudCBiaW5hcnkuIFRoaXMgbWFrZXMgYmluYXJ5IHZhbHVlcyBvZiBhbGwgaW5kaWNlcyBoYXZlIHRoZSBzYW1lIGxlbmd0aC5cbiAgICAgIGN1cnJCaW5hcnkgPSB0ZW1wbGF0ZUJpbmFyeS5zdWJzdHIoY3VyckJpbmFyeS5sZW5ndGgpICsgY3VyckJpbmFyeTtcblxuICAgICAgY3VyckJpbmFyeSA9IFtdLmNvbmNhdChfdG9Db25zdW1hYmxlQXJyYXkoY3VyckJpbmFyeSkpLnJldmVyc2UoKS5qb2luKCcnKTsgLy9yZXZlcnNlXG4gICAgICByZXZlcnNlZFtuXSA9IHBhcnNlSW50KGN1cnJCaW5hcnksIDIpOyAvL2NvbnZlcnQgdG8gZGVjaW1hbFxuICAgIH1cbiAgICBtZW1vaXplZFJldmVyc2FsW05dID0gcmV2ZXJzZWQ7IC8vc2F2ZVxuICB9XG4gIHJldHVybiBtZW1vaXplZFJldmVyc2FsW05dO1xufTtcblxuLy8gY29tcGxleCBtdWx0aXBsaWNhdGlvblxudmFyIG11bHRpcGx5ID0gZnVuY3Rpb24gbXVsdGlwbHkoYSwgYikge1xuICByZXR1cm4ge1xuICAgICdyZWFsJzogYS5yZWFsICogYi5yZWFsIC0gYS5pbWFnICogYi5pbWFnLFxuICAgICdpbWFnJzogYS5yZWFsICogYi5pbWFnICsgYS5pbWFnICogYi5yZWFsXG4gIH07XG59O1xuXG4vLyBjb21wbGV4IGFkZGl0aW9uXG52YXIgYWRkID0gZnVuY3Rpb24gYWRkKGEsIGIpIHtcbiAgcmV0dXJuIHtcbiAgICAncmVhbCc6IGEucmVhbCArIGIucmVhbCxcbiAgICAnaW1hZyc6IGEuaW1hZyArIGIuaW1hZ1xuICB9O1xufTtcblxuLy8gY29tcGxleCBzdWJ0cmFjdGlvblxudmFyIHN1YnRyYWN0ID0gZnVuY3Rpb24gc3VidHJhY3QoYSwgYikge1xuICByZXR1cm4ge1xuICAgICdyZWFsJzogYS5yZWFsIC0gYi5yZWFsLFxuICAgICdpbWFnJzogYS5pbWFnIC0gYi5pbWFnXG4gIH07XG59O1xuXG4vLyBldWxlcidzIGlkZW50aXR5IGVeeCA9IGNvcyh4KSArIHNpbih4KVxudmFyIGV1bGVyID0gZnVuY3Rpb24gZXVsZXIoa24sIE4pIHtcbiAgdmFyIHggPSAtMiAqIE1hdGguUEkgKiBrbiAvIE47XG4gIHJldHVybiB7ICdyZWFsJzogTWF0aC5jb3MoeCksICdpbWFnJzogTWF0aC5zaW4oeCkgfTtcbn07XG5cbi8vIGNvbXBsZXggY29uanVnYXRlXG52YXIgY29uaiA9IGZ1bmN0aW9uIGNvbmooYSkge1xuICBhLmltYWcgKj0gLTE7XG4gIHJldHVybiBhO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJpdFJldmVyc2VBcnJheTogYml0UmV2ZXJzZUFycmF5LFxuICBtdWx0aXBseTogbXVsdGlwbHksXG4gIGFkZDogYWRkLFxuICBzdWJ0cmFjdDogc3VidHJhY3QsXG4gIGV1bGVyOiBldWxlcixcbiAgY29uajogY29uaixcbiAgY29uc3RydWN0Q29tcGxleEFycmF5OiBjb25zdHJ1Y3RDb21wbGV4QXJyYXlcbn07XG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbm9kZV9tb2R1bGVzL2luaGVyaXRzL2luaGVyaXRzX2Jyb3dzZXIuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgbm8gc3RhdGljIGV4cG9ydHMgZm91bmQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMpIHtcblxuaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyohIG5vIHN0YXRpYyBleHBvcnRzIGZvdW5kICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzKSB7XG5cbi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucHJlcGVuZE9uY2VMaXN0ZW5lciA9IG5vb3A7XG5cbnByb2Nlc3MubGlzdGVuZXJzID0gZnVuY3Rpb24gKG5hbWUpIHsgcmV0dXJuIFtdIH1cblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG5cblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vbm9kZV9tb2R1bGVzL3V0aWwvc3VwcG9ydC9pc0J1ZmZlckJyb3dzZXIuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBubyBzdGF0aWMgZXhwb3J0cyBmb3VuZCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGlzQnVmZmVyKGFyZykge1xuICByZXR1cm4gYXJnICYmIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnXG4gICAgJiYgdHlwZW9mIGFyZy5jb3B5ID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5maWxsID09PSAnZnVuY3Rpb24nXG4gICAgJiYgdHlwZW9mIGFyZy5yZWFkVUludDggPT09ICdmdW5jdGlvbic7XG59XG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vbm9kZV9tb2R1bGVzL3V0aWwvdXRpbC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9ub2RlX21vZHVsZXMvdXRpbC91dGlsLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBubyBzdGF0aWMgZXhwb3J0cyBmb3VuZCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG4vKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi8oZnVuY3Rpb24oZ2xvYmFsLCBwcm9jZXNzKSB7Ly8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbnZhciBmb3JtYXRSZWdFeHAgPSAvJVtzZGolXS9nO1xuZXhwb3J0cy5mb3JtYXQgPSBmdW5jdGlvbihmKSB7XG4gIGlmICghaXNTdHJpbmcoZikpIHtcbiAgICB2YXIgb2JqZWN0cyA9IFtdO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBvYmplY3RzLnB1c2goaW5zcGVjdChhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gICAgcmV0dXJuIG9iamVjdHMuam9pbignICcpO1xuICB9XG5cbiAgdmFyIGkgPSAxO1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgdmFyIGxlbiA9IGFyZ3MubGVuZ3RoO1xuICB2YXIgc3RyID0gU3RyaW5nKGYpLnJlcGxhY2UoZm9ybWF0UmVnRXhwLCBmdW5jdGlvbih4KSB7XG4gICAgaWYgKHggPT09ICclJScpIHJldHVybiAnJSc7XG4gICAgaWYgKGkgPj0gbGVuKSByZXR1cm4geDtcbiAgICBzd2l0Y2ggKHgpIHtcbiAgICAgIGNhc2UgJyVzJzogcmV0dXJuIFN0cmluZyhhcmdzW2krK10pO1xuICAgICAgY2FzZSAnJWQnOiByZXR1cm4gTnVtYmVyKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclaic6XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGFyZ3NbaSsrXSk7XG4gICAgICAgIH0gY2F0Y2ggKF8pIHtcbiAgICAgICAgICByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuICAgICAgICB9XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4geDtcbiAgICB9XG4gIH0pO1xuICBmb3IgKHZhciB4ID0gYXJnc1tpXTsgaSA8IGxlbjsgeCA9IGFyZ3NbKytpXSkge1xuICAgIGlmIChpc051bGwoeCkgfHwgIWlzT2JqZWN0KHgpKSB7XG4gICAgICBzdHIgKz0gJyAnICsgeDtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyICs9ICcgJyArIGluc3BlY3QoeCk7XG4gICAgfVxuICB9XG4gIHJldHVybiBzdHI7XG59O1xuXG5cbi8vIE1hcmsgdGhhdCBhIG1ldGhvZCBzaG91bGQgbm90IGJlIHVzZWQuXG4vLyBSZXR1cm5zIGEgbW9kaWZpZWQgZnVuY3Rpb24gd2hpY2ggd2FybnMgb25jZSBieSBkZWZhdWx0LlxuLy8gSWYgLS1uby1kZXByZWNhdGlvbiBpcyBzZXQsIHRoZW4gaXQgaXMgYSBuby1vcC5cbmV4cG9ydHMuZGVwcmVjYXRlID0gZnVuY3Rpb24oZm4sIG1zZykge1xuICAvLyBBbGxvdyBmb3IgZGVwcmVjYXRpbmcgdGhpbmdzIGluIHRoZSBwcm9jZXNzIG9mIHN0YXJ0aW5nIHVwLlxuICBpZiAoaXNVbmRlZmluZWQoZ2xvYmFsLnByb2Nlc3MpKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVwcmVjYXRlKGZuLCBtc2cpLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfTtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLm5vRGVwcmVjYXRpb24gPT09IHRydWUpIHtcbiAgICByZXR1cm4gZm47XG4gIH1cblxuICB2YXIgd2FybmVkID0gZmFsc2U7XG4gIGZ1bmN0aW9uIGRlcHJlY2F0ZWQoKSB7XG4gICAgaWYgKCF3YXJuZWQpIHtcbiAgICAgIGlmIChwcm9jZXNzLnRocm93RGVwcmVjYXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1zZyk7XG4gICAgICB9IGVsc2UgaWYgKHByb2Nlc3MudHJhY2VEZXByZWNhdGlvbikge1xuICAgICAgICBjb25zb2xlLnRyYWNlKG1zZyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmVycm9yKG1zZyk7XG4gICAgICB9XG4gICAgICB3YXJuZWQgPSB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHJldHVybiBkZXByZWNhdGVkO1xufTtcblxuXG52YXIgZGVidWdzID0ge307XG52YXIgZGVidWdFbnZpcm9uO1xuZXhwb3J0cy5kZWJ1Z2xvZyA9IGZ1bmN0aW9uKHNldCkge1xuICBpZiAoaXNVbmRlZmluZWQoZGVidWdFbnZpcm9uKSlcbiAgICBkZWJ1Z0Vudmlyb24gPSBwcm9jZXNzLmVudi5OT0RFX0RFQlVHIHx8ICcnO1xuICBzZXQgPSBzZXQudG9VcHBlckNhc2UoKTtcbiAgaWYgKCFkZWJ1Z3Nbc2V0XSkge1xuICAgIGlmIChuZXcgUmVnRXhwKCdcXFxcYicgKyBzZXQgKyAnXFxcXGInLCAnaScpLnRlc3QoZGVidWdFbnZpcm9uKSkge1xuICAgICAgdmFyIHBpZCA9IHByb2Nlc3MucGlkO1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG1zZyA9IGV4cG9ydHMuZm9ybWF0LmFwcGx5KGV4cG9ydHMsIGFyZ3VtZW50cyk7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJyVzICVkOiAlcycsIHNldCwgcGlkLCBtc2cpO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVidWdzW3NldF0gPSBmdW5jdGlvbigpIHt9O1xuICAgIH1cbiAgfVxuICByZXR1cm4gZGVidWdzW3NldF07XG59O1xuXG5cbi8qKlxuICogRWNob3MgdGhlIHZhbHVlIG9mIGEgdmFsdWUuIFRyeXMgdG8gcHJpbnQgdGhlIHZhbHVlIG91dFxuICogaW4gdGhlIGJlc3Qgd2F5IHBvc3NpYmxlIGdpdmVuIHRoZSBkaWZmZXJlbnQgdHlwZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9iaiBUaGUgb2JqZWN0IHRvIHByaW50IG91dC5cbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgb2JqZWN0IHRoYXQgYWx0ZXJzIHRoZSBvdXRwdXQuXG4gKi9cbi8qIGxlZ2FjeTogb2JqLCBzaG93SGlkZGVuLCBkZXB0aCwgY29sb3JzKi9cbmZ1bmN0aW9uIGluc3BlY3Qob2JqLCBvcHRzKSB7XG4gIC8vIGRlZmF1bHQgb3B0aW9uc1xuICB2YXIgY3R4ID0ge1xuICAgIHNlZW46IFtdLFxuICAgIHN0eWxpemU6IHN0eWxpemVOb0NvbG9yXG4gIH07XG4gIC8vIGxlZ2FjeS4uLlxuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+PSAzKSBjdHguZGVwdGggPSBhcmd1bWVudHNbMl07XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDQpIGN0eC5jb2xvcnMgPSBhcmd1bWVudHNbM107XG4gIGlmIChpc0Jvb2xlYW4ob3B0cykpIHtcbiAgICAvLyBsZWdhY3kuLi5cbiAgICBjdHguc2hvd0hpZGRlbiA9IG9wdHM7XG4gIH0gZWxzZSBpZiAob3B0cykge1xuICAgIC8vIGdvdCBhbiBcIm9wdGlvbnNcIiBvYmplY3RcbiAgICBleHBvcnRzLl9leHRlbmQoY3R4LCBvcHRzKTtcbiAgfVxuICAvLyBzZXQgZGVmYXVsdCBvcHRpb25zXG4gIGlmIChpc1VuZGVmaW5lZChjdHguc2hvd0hpZGRlbikpIGN0eC5zaG93SGlkZGVuID0gZmFsc2U7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguZGVwdGgpKSBjdHguZGVwdGggPSAyO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmNvbG9ycykpIGN0eC5jb2xvcnMgPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5jdXN0b21JbnNwZWN0KSkgY3R4LmN1c3RvbUluc3BlY3QgPSB0cnVlO1xuICBpZiAoY3R4LmNvbG9ycykgY3R4LnN0eWxpemUgPSBzdHlsaXplV2l0aENvbG9yO1xuICByZXR1cm4gZm9ybWF0VmFsdWUoY3R4LCBvYmosIGN0eC5kZXB0aCk7XG59XG5leHBvcnRzLmluc3BlY3QgPSBpbnNwZWN0O1xuXG5cbi8vIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQU5TSV9lc2NhcGVfY29kZSNncmFwaGljc1xuaW5zcGVjdC5jb2xvcnMgPSB7XG4gICdib2xkJyA6IFsxLCAyMl0sXG4gICdpdGFsaWMnIDogWzMsIDIzXSxcbiAgJ3VuZGVybGluZScgOiBbNCwgMjRdLFxuICAnaW52ZXJzZScgOiBbNywgMjddLFxuICAnd2hpdGUnIDogWzM3LCAzOV0sXG4gICdncmV5JyA6IFs5MCwgMzldLFxuICAnYmxhY2snIDogWzMwLCAzOV0sXG4gICdibHVlJyA6IFszNCwgMzldLFxuICAnY3lhbicgOiBbMzYsIDM5XSxcbiAgJ2dyZWVuJyA6IFszMiwgMzldLFxuICAnbWFnZW50YScgOiBbMzUsIDM5XSxcbiAgJ3JlZCcgOiBbMzEsIDM5XSxcbiAgJ3llbGxvdycgOiBbMzMsIDM5XVxufTtcblxuLy8gRG9uJ3QgdXNlICdibHVlJyBub3QgdmlzaWJsZSBvbiBjbWQuZXhlXG5pbnNwZWN0LnN0eWxlcyA9IHtcbiAgJ3NwZWNpYWwnOiAnY3lhbicsXG4gICdudW1iZXInOiAneWVsbG93JyxcbiAgJ2Jvb2xlYW4nOiAneWVsbG93JyxcbiAgJ3VuZGVmaW5lZCc6ICdncmV5JyxcbiAgJ251bGwnOiAnYm9sZCcsXG4gICdzdHJpbmcnOiAnZ3JlZW4nLFxuICAnZGF0ZSc6ICdtYWdlbnRhJyxcbiAgLy8gXCJuYW1lXCI6IGludGVudGlvbmFsbHkgbm90IHN0eWxpbmdcbiAgJ3JlZ2V4cCc6ICdyZWQnXG59O1xuXG5cbmZ1bmN0aW9uIHN0eWxpemVXaXRoQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgdmFyIHN0eWxlID0gaW5zcGVjdC5zdHlsZXNbc3R5bGVUeXBlXTtcblxuICBpZiAoc3R5bGUpIHtcbiAgICByZXR1cm4gJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVswXSArICdtJyArIHN0ciArXG4gICAgICAgICAgICdcXHUwMDFiWycgKyBpbnNwZWN0LmNvbG9yc1tzdHlsZV1bMV0gKyAnbSc7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cjtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHN0eWxpemVOb0NvbG9yKHN0ciwgc3R5bGVUeXBlKSB7XG4gIHJldHVybiBzdHI7XG59XG5cblxuZnVuY3Rpb24gYXJyYXlUb0hhc2goYXJyYXkpIHtcbiAgdmFyIGhhc2ggPSB7fTtcblxuICBhcnJheS5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaWR4KSB7XG4gICAgaGFzaFt2YWxdID0gdHJ1ZTtcbiAgfSk7XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0VmFsdWUoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzKSB7XG4gIC8vIFByb3ZpZGUgYSBob29rIGZvciB1c2VyLXNwZWNpZmllZCBpbnNwZWN0IGZ1bmN0aW9ucy5cbiAgLy8gQ2hlY2sgdGhhdCB2YWx1ZSBpcyBhbiBvYmplY3Qgd2l0aCBhbiBpbnNwZWN0IGZ1bmN0aW9uIG9uIGl0XG4gIGlmIChjdHguY3VzdG9tSW5zcGVjdCAmJlxuICAgICAgdmFsdWUgJiZcbiAgICAgIGlzRnVuY3Rpb24odmFsdWUuaW5zcGVjdCkgJiZcbiAgICAgIC8vIEZpbHRlciBvdXQgdGhlIHV0aWwgbW9kdWxlLCBpdCdzIGluc3BlY3QgZnVuY3Rpb24gaXMgc3BlY2lhbFxuICAgICAgdmFsdWUuaW5zcGVjdCAhPT0gZXhwb3J0cy5pbnNwZWN0ICYmXG4gICAgICAvLyBBbHNvIGZpbHRlciBvdXQgYW55IHByb3RvdHlwZSBvYmplY3RzIHVzaW5nIHRoZSBjaXJjdWxhciBjaGVjay5cbiAgICAgICEodmFsdWUuY29uc3RydWN0b3IgJiYgdmFsdWUuY29uc3RydWN0b3IucHJvdG90eXBlID09PSB2YWx1ZSkpIHtcbiAgICB2YXIgcmV0ID0gdmFsdWUuaW5zcGVjdChyZWN1cnNlVGltZXMsIGN0eCk7XG4gICAgaWYgKCFpc1N0cmluZyhyZXQpKSB7XG4gICAgICByZXQgPSBmb3JtYXRWYWx1ZShjdHgsIHJldCwgcmVjdXJzZVRpbWVzKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8vIFByaW1pdGl2ZSB0eXBlcyBjYW5ub3QgaGF2ZSBwcm9wZXJ0aWVzXG4gIHZhciBwcmltaXRpdmUgPSBmb3JtYXRQcmltaXRpdmUoY3R4LCB2YWx1ZSk7XG4gIGlmIChwcmltaXRpdmUpIHtcbiAgICByZXR1cm4gcHJpbWl0aXZlO1xuICB9XG5cbiAgLy8gTG9vayB1cCB0aGUga2V5cyBvZiB0aGUgb2JqZWN0LlxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTtcbiAgdmFyIHZpc2libGVLZXlzID0gYXJyYXlUb0hhc2goa2V5cyk7XG5cbiAgaWYgKGN0eC5zaG93SGlkZGVuKSB7XG4gICAga2V5cyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHZhbHVlKTtcbiAgfVxuXG4gIC8vIElFIGRvZXNuJ3QgbWFrZSBlcnJvciBmaWVsZHMgbm9uLWVudW1lcmFibGVcbiAgLy8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L2llL2R3dzUyc2J0KHY9dnMuOTQpLmFzcHhcbiAgaWYgKGlzRXJyb3IodmFsdWUpXG4gICAgICAmJiAoa2V5cy5pbmRleE9mKCdtZXNzYWdlJykgPj0gMCB8fCBrZXlzLmluZGV4T2YoJ2Rlc2NyaXB0aW9uJykgPj0gMCkpIHtcbiAgICByZXR1cm4gZm9ybWF0RXJyb3IodmFsdWUpO1xuICB9XG5cbiAgLy8gU29tZSB0eXBlIG9mIG9iamVjdCB3aXRob3V0IHByb3BlcnRpZXMgY2FuIGJlIHNob3J0Y3V0dGVkLlxuICBpZiAoa2V5cy5sZW5ndGggPT09IDApIHtcbiAgICBpZiAoaXNGdW5jdGlvbih2YWx1ZSkpIHtcbiAgICAgIHZhciBuYW1lID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tGdW5jdGlvbicgKyBuYW1lICsgJ10nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH1cbiAgICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKERhdGUucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAnZGF0ZScpO1xuICAgIH1cbiAgICBpZiAoaXNFcnJvcih2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIGJhc2UgPSAnJywgYXJyYXkgPSBmYWxzZSwgYnJhY2VzID0gWyd7JywgJ30nXTtcblxuICAvLyBNYWtlIEFycmF5IHNheSB0aGF0IHRoZXkgYXJlIEFycmF5XG4gIGlmIChpc0FycmF5KHZhbHVlKSkge1xuICAgIGFycmF5ID0gdHJ1ZTtcbiAgICBicmFjZXMgPSBbJ1snLCAnXSddO1xuICB9XG5cbiAgLy8gTWFrZSBmdW5jdGlvbnMgc2F5IHRoYXQgdGhleSBhcmUgZnVuY3Rpb25zXG4gIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgIHZhciBuID0gdmFsdWUubmFtZSA/ICc6ICcgKyB2YWx1ZS5uYW1lIDogJyc7XG4gICAgYmFzZSA9ICcgW0Z1bmN0aW9uJyArIG4gKyAnXSc7XG4gIH1cblxuICAvLyBNYWtlIFJlZ0V4cHMgc2F5IHRoYXQgdGhleSBhcmUgUmVnRXhwc1xuICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGRhdGVzIHdpdGggcHJvcGVydGllcyBmaXJzdCBzYXkgdGhlIGRhdGVcbiAgaWYgKGlzRGF0ZSh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgRGF0ZS5wcm90b3R5cGUudG9VVENTdHJpbmcuY2FsbCh2YWx1ZSk7XG4gIH1cblxuICAvLyBNYWtlIGVycm9yIHdpdGggbWVzc2FnZSBmaXJzdCBzYXkgdGhlIGVycm9yXG4gIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICBpZiAoa2V5cy5sZW5ndGggPT09IDAgJiYgKCFhcnJheSB8fCB2YWx1ZS5sZW5ndGggPT0gMCkpIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArIGJyYWNlc1sxXTtcbiAgfVxuXG4gIGlmIChyZWN1cnNlVGltZXMgPCAwKSB7XG4gICAgaWYgKGlzUmVnRXhwKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKFJlZ0V4cC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdyZWdleHAnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGN0eC5zdHlsaXplKCdbT2JqZWN0XScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG5cbiAgY3R4LnNlZW4ucHVzaCh2YWx1ZSk7XG5cbiAgdmFyIG91dHB1dDtcbiAgaWYgKGFycmF5KSB7XG4gICAgb3V0cHV0ID0gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cyk7XG4gIH0gZWxzZSB7XG4gICAgb3V0cHV0ID0ga2V5cy5tYXAoZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5LCBhcnJheSk7XG4gICAgfSk7XG4gIH1cblxuICBjdHguc2Vlbi5wb3AoKTtcblxuICByZXR1cm4gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKSB7XG4gIGlmIChpc1VuZGVmaW5lZCh2YWx1ZSkpXG4gICAgcmV0dXJuIGN0eC5zdHlsaXplKCd1bmRlZmluZWQnLCAndW5kZWZpbmVkJyk7XG4gIGlmIChpc1N0cmluZyh2YWx1ZSkpIHtcbiAgICB2YXIgc2ltcGxlID0gJ1xcJycgKyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkucmVwbGFjZSgvXlwifFwiJC9nLCAnJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXFxcXCIvZywgJ1wiJykgKyAnXFwnJztcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoc2ltcGxlLCAnc3RyaW5nJyk7XG4gIH1cbiAgaWYgKGlzTnVtYmVyKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ251bWJlcicpO1xuICBpZiAoaXNCb29sZWFuKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJycgKyB2YWx1ZSwgJ2Jvb2xlYW4nKTtcbiAgLy8gRm9yIHNvbWUgcmVhc29uIHR5cGVvZiBudWxsIGlzIFwib2JqZWN0XCIsIHNvIHNwZWNpYWwgY2FzZSBoZXJlLlxuICBpZiAoaXNOdWxsKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ251bGwnLCAnbnVsbCcpO1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdEVycm9yKHZhbHVlKSB7XG4gIHJldHVybiAnWycgKyBFcnJvci5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgKyAnXSc7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0QXJyYXkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cywga2V5cykge1xuICB2YXIgb3V0cHV0ID0gW107XG4gIGZvciAodmFyIGkgPSAwLCBsID0gdmFsdWUubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGhhc093blByb3BlcnR5KHZhbHVlLCBTdHJpbmcoaSkpKSB7XG4gICAgICBvdXRwdXQucHVzaChmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLFxuICAgICAgICAgIFN0cmluZyhpKSwgdHJ1ZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICBvdXRwdXQucHVzaCgnJyk7XG4gICAgfVxuICB9XG4gIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoIWtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAga2V5LCB0cnVlKSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIG91dHB1dDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KSB7XG4gIHZhciBuYW1lLCBzdHIsIGRlc2M7XG4gIGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHZhbHVlLCBrZXkpIHx8IHsgdmFsdWU6IHZhbHVlW2tleV0gfTtcbiAgaWYgKGRlc2MuZ2V0KSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlci9TZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tHZXR0ZXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKGRlc2Muc2V0KSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoIWhhc093blByb3BlcnR5KHZpc2libGVLZXlzLCBrZXkpKSB7XG4gICAgbmFtZSA9ICdbJyArIGtleSArICddJztcbiAgfVxuICBpZiAoIXN0cikge1xuICAgIGlmIChjdHguc2Vlbi5pbmRleE9mKGRlc2MudmFsdWUpIDwgMCkge1xuICAgICAgaWYgKGlzTnVsbChyZWN1cnNlVGltZXMpKSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHIgPSBmb3JtYXRWYWx1ZShjdHgsIGRlc2MudmFsdWUsIHJlY3Vyc2VUaW1lcyAtIDEpO1xuICAgICAgfVxuICAgICAgaWYgKHN0ci5pbmRleE9mKCdcXG4nKSA+IC0xKSB7XG4gICAgICAgIGlmIChhcnJheSkge1xuICAgICAgICAgIHN0ciA9IHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAnICsgbGluZTtcbiAgICAgICAgICB9KS5qb2luKCdcXG4nKS5zdWJzdHIoMik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3RyID0gJ1xcbicgKyBzdHIuc3BsaXQoJ1xcbicpLm1hcChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJyAgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbQ2lyY3VsYXJdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzVW5kZWZpbmVkKG5hbWUpKSB7XG4gICAgaWYgKGFycmF5ICYmIGtleS5tYXRjaCgvXlxcZCskLykpIHtcbiAgICAgIHJldHVybiBzdHI7XG4gICAgfVxuICAgIG5hbWUgPSBKU09OLnN0cmluZ2lmeSgnJyArIGtleSk7XG4gICAgaWYgKG5hbWUubWF0Y2goL15cIihbYS16QS1aX11bYS16QS1aXzAtOV0qKVwiJC8pKSB7XG4gICAgICBuYW1lID0gbmFtZS5zdWJzdHIoMSwgbmFtZS5sZW5ndGggLSAyKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnbmFtZScpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC8nL2csIFwiXFxcXCdcIilcbiAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvKF5cInxcIiQpL2csIFwiJ1wiKTtcbiAgICAgIG5hbWUgPSBjdHguc3R5bGl6ZShuYW1lLCAnc3RyaW5nJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG5hbWUgKyAnOiAnICsgc3RyO1xufVxuXG5cbmZ1bmN0aW9uIHJlZHVjZVRvU2luZ2xlU3RyaW5nKG91dHB1dCwgYmFzZSwgYnJhY2VzKSB7XG4gIHZhciBudW1MaW5lc0VzdCA9IDA7XG4gIHZhciBsZW5ndGggPSBvdXRwdXQucmVkdWNlKGZ1bmN0aW9uKHByZXYsIGN1cikge1xuICAgIG51bUxpbmVzRXN0Kys7XG4gICAgaWYgKGN1ci5pbmRleE9mKCdcXG4nKSA+PSAwKSBudW1MaW5lc0VzdCsrO1xuICAgIHJldHVybiBwcmV2ICsgY3VyLnJlcGxhY2UoL1xcdTAwMWJcXFtcXGRcXGQ/bS9nLCAnJykubGVuZ3RoICsgMTtcbiAgfSwgMCk7XG5cbiAgaWYgKGxlbmd0aCA+IDYwKSB7XG4gICAgcmV0dXJuIGJyYWNlc1swXSArXG4gICAgICAgICAgIChiYXNlID09PSAnJyA/ICcnIDogYmFzZSArICdcXG4gJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBvdXRwdXQuam9pbignLFxcbiAgJykgK1xuICAgICAgICAgICAnICcgK1xuICAgICAgICAgICBicmFjZXNbMV07XG4gIH1cblxuICByZXR1cm4gYnJhY2VzWzBdICsgYmFzZSArICcgJyArIG91dHB1dC5qb2luKCcsICcpICsgJyAnICsgYnJhY2VzWzFdO1xufVxuXG5cbi8vIE5PVEU6IFRoZXNlIHR5cGUgY2hlY2tpbmcgZnVuY3Rpb25zIGludGVudGlvbmFsbHkgZG9uJ3QgdXNlIGBpbnN0YW5jZW9mYFxuLy8gYmVjYXVzZSBpdCBpcyBmcmFnaWxlIGFuZCBjYW4gYmUgZWFzaWx5IGZha2VkIHdpdGggYE9iamVjdC5jcmVhdGUoKWAuXG5mdW5jdGlvbiBpc0FycmF5KGFyKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGFyKTtcbn1cbmV4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cbmZ1bmN0aW9uIGlzQm9vbGVhbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJztcbn1cbmV4cG9ydHMuaXNCb29sZWFuID0gaXNCb29sZWFuO1xuXG5mdW5jdGlvbiBpc051bGwoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGw7XG59XG5leHBvcnRzLmlzTnVsbCA9IGlzTnVsbDtcblxuZnVuY3Rpb24gaXNOdWxsT3JVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsT3JVbmRlZmluZWQgPSBpc051bGxPclVuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNOdW1iZXIoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnbnVtYmVyJztcbn1cbmV4cG9ydHMuaXNOdW1iZXIgPSBpc051bWJlcjtcblxuZnVuY3Rpb24gaXNTdHJpbmcoYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3RyaW5nJztcbn1cbmV4cG9ydHMuaXNTdHJpbmcgPSBpc1N0cmluZztcblxuZnVuY3Rpb24gaXNTeW1ib2woYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnc3ltYm9sJztcbn1cbmV4cG9ydHMuaXNTeW1ib2wgPSBpc1N5bWJvbDtcblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbmV4cG9ydHMuaXNVbmRlZmluZWQgPSBpc1VuZGVmaW5lZDtcblxuZnVuY3Rpb24gaXNSZWdFeHAocmUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KHJlKSAmJiBvYmplY3RUb1N0cmluZyhyZSkgPT09ICdbb2JqZWN0IFJlZ0V4cF0nO1xufVxuZXhwb3J0cy5pc1JlZ0V4cCA9IGlzUmVnRXhwO1xuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNPYmplY3QgPSBpc09iamVjdDtcblxuZnVuY3Rpb24gaXNEYXRlKGQpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGQpICYmIG9iamVjdFRvU3RyaW5nKGQpID09PSAnW29iamVjdCBEYXRlXSc7XG59XG5leHBvcnRzLmlzRGF0ZSA9IGlzRGF0ZTtcblxuZnVuY3Rpb24gaXNFcnJvcihlKSB7XG4gIHJldHVybiBpc09iamVjdChlKSAmJlxuICAgICAgKG9iamVjdFRvU3RyaW5nKGUpID09PSAnW29iamVjdCBFcnJvcl0nIHx8IGUgaW5zdGFuY2VvZiBFcnJvcik7XG59XG5leHBvcnRzLmlzRXJyb3IgPSBpc0Vycm9yO1xuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Z1bmN0aW9uJztcbn1cbmV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cbmZ1bmN0aW9uIGlzUHJpbWl0aXZlKGFyZykge1xuICByZXR1cm4gYXJnID09PSBudWxsIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnYm9vbGVhbicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdudW1iZXInIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3RyaW5nJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3N5bWJvbCcgfHwgIC8vIEVTNiBzeW1ib2xcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICd1bmRlZmluZWQnO1xufVxuZXhwb3J0cy5pc1ByaW1pdGl2ZSA9IGlzUHJpbWl0aXZlO1xuXG5leHBvcnRzLmlzQnVmZmVyID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9zdXBwb3J0L2lzQnVmZmVyICovIFwiLi9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qc1wiKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgaW5oZXJpdHMgKi8gXCIuL25vZGVfbW9kdWxlcy9pbmhlcml0cy9pbmhlcml0c19icm93c2VyLmpzXCIpO1xuXG5leHBvcnRzLl9leHRlbmQgPSBmdW5jdGlvbihvcmlnaW4sIGFkZCkge1xuICAvLyBEb24ndCBkbyBhbnl0aGluZyBpZiBhZGQgaXNuJ3QgYW4gb2JqZWN0XG4gIGlmICghYWRkIHx8ICFpc09iamVjdChhZGQpKSByZXR1cm4gb3JpZ2luO1xuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXMoYWRkKTtcbiAgdmFyIGkgPSBrZXlzLmxlbmd0aDtcbiAgd2hpbGUgKGktLSkge1xuICAgIG9yaWdpbltrZXlzW2ldXSA9IGFkZFtrZXlzW2ldXTtcbiAgfVxuICByZXR1cm4gb3JpZ2luO1xufTtcblxuZnVuY3Rpb24gaGFzT3duUHJvcGVydHkob2JqLCBwcm9wKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKTtcbn1cblxuLyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKHRoaXMsIF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vLi4vd2VicGFjay9idWlsZGluL2dsb2JhbC5qcyAqLyBcIi4vbm9kZV9tb2R1bGVzL3dlYnBhY2svYnVpbGRpbi9nbG9iYWwuanNcIiksIF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vLi4vcHJvY2Vzcy9icm93c2VyLmpzICovIFwiLi9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzXCIpKSlcblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9ub2RlX21vZHVsZXMvd2VicGFjay9idWlsZGluL2dsb2JhbC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogKHdlYnBhY2spL2J1aWxkaW4vZ2xvYmFsLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBubyBzdGF0aWMgZXhwb3J0cyBmb3VuZCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cykge1xuXG52YXIgZztcclxuXHJcbi8vIFRoaXMgd29ya3MgaW4gbm9uLXN0cmljdCBtb2RlXHJcbmcgPSAoZnVuY3Rpb24oKSB7XHJcblx0cmV0dXJuIHRoaXM7XHJcbn0pKCk7XHJcblxyXG50cnkge1xyXG5cdC8vIFRoaXMgd29ya3MgaWYgZXZhbCBpcyBhbGxvd2VkIChzZWUgQ1NQKVxyXG5cdGcgPSBnIHx8IEZ1bmN0aW9uKFwicmV0dXJuIHRoaXNcIikoKSB8fCAoMSwgZXZhbCkoXCJ0aGlzXCIpO1xyXG59IGNhdGNoIChlKSB7XHJcblx0Ly8gVGhpcyB3b3JrcyBpZiB0aGUgd2luZG93IHJlZmVyZW5jZSBpcyBhdmFpbGFibGVcclxuXHRpZiAodHlwZW9mIHdpbmRvdyA9PT0gXCJvYmplY3RcIikgZyA9IHdpbmRvdztcclxufVxyXG5cclxuLy8gZyBjYW4gc3RpbGwgYmUgdW5kZWZpbmVkLCBidXQgbm90aGluZyB0byBkbyBhYm91dCBpdC4uLlxyXG4vLyBXZSByZXR1cm4gdW5kZWZpbmVkLCBpbnN0ZWFkIG9mIG5vdGhpbmcgaGVyZSwgc28gaXQnc1xyXG4vLyBlYXNpZXIgdG8gaGFuZGxlIHRoaXMgY2FzZS4gaWYoIWdsb2JhbCkgeyAuLi59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGc7XHJcblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL3NyYy9leHRyYWN0b3JzL2Nocm9tYS5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL3NyYy9leHRyYWN0b3JzL2Nocm9tYS5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBleHBvcnRzIHByb3ZpZGVkOiBkZWZhdWx0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuZnVuY3Rpb24gX3RvQ29uc3VtYWJsZUFycmF5KGFycikgeyByZXR1cm4gX2FycmF5V2l0aG91dEhvbGVzKGFycikgfHwgX2l0ZXJhYmxlVG9BcnJheShhcnIpIHx8IF9ub25JdGVyYWJsZVNwcmVhZCgpOyB9XG5cbmZ1bmN0aW9uIF9ub25JdGVyYWJsZVNwcmVhZCgpIHsgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgYXR0ZW1wdCB0byBzcHJlYWQgbm9uLWl0ZXJhYmxlIGluc3RhbmNlXCIpOyB9XG5cbmZ1bmN0aW9uIF9pdGVyYWJsZVRvQXJyYXkoaXRlcikgeyBpZiAoU3ltYm9sLml0ZXJhdG9yIGluIE9iamVjdChpdGVyKSB8fCBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaXRlcikgPT09IFwiW29iamVjdCBBcmd1bWVudHNdXCIpIHJldHVybiBBcnJheS5mcm9tKGl0ZXIpOyB9XG5cbmZ1bmN0aW9uIF9hcnJheVdpdGhvdXRIb2xlcyhhcnIpIHsgaWYgKEFycmF5LmlzQXJyYXkoYXJyKSkgeyBmb3IgKHZhciBpID0gMCwgYXJyMiA9IG5ldyBBcnJheShhcnIubGVuZ3RoKTsgaSA8IGFyci5sZW5ndGg7IGkrKykgeyBhcnIyW2ldID0gYXJyW2ldOyB9IHJldHVybiBhcnIyOyB9IH1cblxuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuLyogaGFybW9ueSBkZWZhdWx0IGV4cG9ydCAqLyBfX3dlYnBhY2tfZXhwb3J0c19fW1wiZGVmYXVsdFwiXSA9IChmdW5jdGlvbiAoYXJncykge1xuICBpZiAoX3R5cGVvZihhcmdzLmFtcFNwZWN0cnVtKSAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdWYWxpZCBhbXBTcGVjdHJ1bSBpcyByZXF1aXJlZCB0byBnZW5lcmF0ZSBjaHJvbWEnKTtcbiAgfVxuXG4gIGlmIChfdHlwZW9mKGFyZ3MuY2hyb21hRmlsdGVyQmFuaykgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignVmFsaWQgY2hyb21hRmlsdGVyQmFuayBpcyByZXF1aXJlZCB0byBnZW5lcmF0ZSBjaHJvbWEnKTtcbiAgfVxuXG4gIHZhciBjaHJvbWFncmFtID0gYXJncy5jaHJvbWFGaWx0ZXJCYW5rLm1hcChmdW5jdGlvbiAocm93LCBpKSB7XG4gICAgcmV0dXJuIGFyZ3MuYW1wU3BlY3RydW0ucmVkdWNlKGZ1bmN0aW9uIChhY2MsIHYsIGopIHtcbiAgICAgIHJldHVybiBhY2MgKyB2ICogcm93W2pdO1xuICAgIH0sIDApO1xuICB9KTtcbiAgdmFyIG1heFZhbCA9IE1hdGgubWF4LmFwcGx5KE1hdGgsIF90b0NvbnN1bWFibGVBcnJheShjaHJvbWFncmFtKSk7XG4gIHJldHVybiBtYXhWYWwgPyBjaHJvbWFncmFtLm1hcChmdW5jdGlvbiAodikge1xuICAgIHJldHVybiB2IC8gbWF4VmFsO1xuICB9KSA6IGNocm9tYWdyYW07XG59KTtcblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9zcmMvZXh0cmFjdG9ycy9lbmVyZ3kuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9zcmMvZXh0cmFjdG9ycy9lbmVyZ3kuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgZXhwb3J0cyBwcm92aWRlZDogZGVmYXVsdCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cInVzZSBzdHJpY3RcIjtcbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBhc3NlcnRfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIGFzc2VydCAqLyBcIi4vbm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanNcIik7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgYXNzZXJ0X19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19fZGVmYXVsdCA9IC8qI19fUFVSRV9fKi9fX3dlYnBhY2tfcmVxdWlyZV9fLm4oYXNzZXJ0X19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18pO1xuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuXG4vKiBoYXJtb255IGRlZmF1bHQgZXhwb3J0ICovIF9fd2VicGFja19leHBvcnRzX19bXCJkZWZhdWx0XCJdID0gKGZ1bmN0aW9uICgpIHtcbiAgaWYgKF90eXBlb2YoYXJndW1lbnRzWzBdLnNpZ25hbCkgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICB9XG5cbiAgdmFyIGVuZXJneSA9IDA7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHNbMF0uc2lnbmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgZW5lcmd5ICs9IE1hdGgucG93KE1hdGguYWJzKGFyZ3VtZW50c1swXS5zaWduYWxbaV0pLCAyKTtcbiAgfVxuXG4gIHJldHVybiBlbmVyZ3k7XG59KTtcblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9zcmMvZXh0cmFjdG9ycy9leHRyYWN0b3JVdGlsaXRpZXMuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9zcmMvZXh0cmFjdG9ycy9leHRyYWN0b3JVdGlsaXRpZXMuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgZXhwb3J0cyBwcm92aWRlZDogbXUgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAoYmluZGluZykgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwibXVcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBtdTsgfSk7XG5mdW5jdGlvbiBtdShpLCBhbXBsaXR1ZGVTcGVjdCkge1xuICB2YXIgbnVtZXJhdG9yID0gMDtcbiAgdmFyIGRlbm9taW5hdG9yID0gMDtcblxuICBmb3IgKHZhciBrID0gMDsgayA8IGFtcGxpdHVkZVNwZWN0Lmxlbmd0aDsgaysrKSB7XG4gICAgbnVtZXJhdG9yICs9IE1hdGgucG93KGssIGkpICogTWF0aC5hYnMoYW1wbGl0dWRlU3BlY3Rba10pO1xuICAgIGRlbm9taW5hdG9yICs9IGFtcGxpdHVkZVNwZWN0W2tdO1xuICB9XG5cbiAgcmV0dXJuIG51bWVyYXRvciAvIGRlbm9taW5hdG9yO1xufVxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL3NyYy9leHRyYWN0b3JzL2xvdWRuZXNzLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9zcmMvZXh0cmFjdG9ycy9sb3VkbmVzcy5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyohIGV4cG9ydHMgcHJvdmlkZWQ6IGRlZmF1bHQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG4vKiBoYXJtb255IGRlZmF1bHQgZXhwb3J0ICovIF9fd2VicGFja19leHBvcnRzX19bXCJkZWZhdWx0XCJdID0gKGZ1bmN0aW9uIChhcmdzKSB7XG4gIGlmIChfdHlwZW9mKGFyZ3MuYW1wU3BlY3RydW0pICE9PSAnb2JqZWN0JyB8fCBfdHlwZW9mKGFyZ3MuYmFya1NjYWxlKSAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gIH1cblxuICB2YXIgTlVNX0JBUktfQkFORFMgPSAyNDtcbiAgdmFyIHNwZWNpZmljID0gbmV3IEZsb2F0MzJBcnJheShOVU1fQkFSS19CQU5EUyk7XG4gIHZhciB0b3RhbCA9IDA7XG4gIHZhciBub3JtYWxpc2VkU3BlY3RydW0gPSBhcmdzLmFtcFNwZWN0cnVtO1xuICB2YXIgYmJMaW1pdHMgPSBuZXcgSW50MzJBcnJheShOVU1fQkFSS19CQU5EUyArIDEpO1xuICBiYkxpbWl0c1swXSA9IDA7XG4gIHZhciBjdXJyZW50QmFuZEVuZCA9IGFyZ3MuYmFya1NjYWxlW25vcm1hbGlzZWRTcGVjdHJ1bS5sZW5ndGggLSAxXSAvIE5VTV9CQVJLX0JBTkRTO1xuICB2YXIgY3VycmVudEJhbmQgPSAxO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbm9ybWFsaXNlZFNwZWN0cnVtLmxlbmd0aDsgaSsrKSB7XG4gICAgd2hpbGUgKGFyZ3MuYmFya1NjYWxlW2ldID4gY3VycmVudEJhbmRFbmQpIHtcbiAgICAgIGJiTGltaXRzW2N1cnJlbnRCYW5kKytdID0gaTtcbiAgICAgIGN1cnJlbnRCYW5kRW5kID0gY3VycmVudEJhbmQgKiBhcmdzLmJhcmtTY2FsZVtub3JtYWxpc2VkU3BlY3RydW0ubGVuZ3RoIC0gMV0gLyBOVU1fQkFSS19CQU5EUztcbiAgICB9XG4gIH1cblxuICBiYkxpbWl0c1tOVU1fQkFSS19CQU5EU10gPSBub3JtYWxpc2VkU3BlY3RydW0ubGVuZ3RoIC0gMTsgLy9wcm9jZXNzXG5cbiAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IE5VTV9CQVJLX0JBTkRTOyBfaSsrKSB7XG4gICAgdmFyIHN1bSA9IDA7XG5cbiAgICBmb3IgKHZhciBqID0gYmJMaW1pdHNbX2ldOyBqIDwgYmJMaW1pdHNbX2kgKyAxXTsgaisrKSB7XG4gICAgICBzdW0gKz0gbm9ybWFsaXNlZFNwZWN0cnVtW2pdO1xuICAgIH1cblxuICAgIHNwZWNpZmljW19pXSA9IE1hdGgucG93KHN1bSwgMC4yMyk7XG4gIH0gLy9nZXQgdG90YWwgbG91ZG5lc3NcblxuXG4gIGZvciAodmFyIF9pMiA9IDA7IF9pMiA8IHNwZWNpZmljLmxlbmd0aDsgX2kyKyspIHtcbiAgICB0b3RhbCArPSBzcGVjaWZpY1tfaTJdO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzcGVjaWZpYzogc3BlY2lmaWMsXG4gICAgdG90YWw6IHRvdGFsXG4gIH07XG59KTtcblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9zcmMvZXh0cmFjdG9ycy9tZmNjLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL3NyYy9leHRyYWN0b3JzL21mY2MuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyohIGV4cG9ydHMgcHJvdmlkZWQ6IGRlZmF1bHQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX3Bvd2VyU3BlY3RydW1fX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vcG93ZXJTcGVjdHJ1bSAqLyBcIi4vc3JjL2V4dHJhY3RvcnMvcG93ZXJTcGVjdHJ1bS5qc1wiKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfdXRpbGl0aWVzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuLy4uL3V0aWxpdGllcyAqLyBcIi4vc3JjL3V0aWxpdGllcy5qc1wiKTtcbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cblxuXG5cblxudmFyIGRjdCA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIGRjdCAqLyBcIi4vbm9kZV9tb2R1bGVzL2RjdC9pbmRleC5qc1wiKTtcblxuLyogaGFybW9ueSBkZWZhdWx0IGV4cG9ydCAqLyBfX3dlYnBhY2tfZXhwb3J0c19fW1wiZGVmYXVsdFwiXSA9IChmdW5jdGlvbiAoYXJncykge1xuICBpZiAoX3R5cGVvZihhcmdzLmFtcFNwZWN0cnVtKSAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdWYWxpZCBhbXBTcGVjdHJ1bSBpcyByZXF1aXJlZCB0byBnZW5lcmF0ZSBNRkNDJyk7XG4gIH1cblxuICBpZiAoX3R5cGVvZihhcmdzLm1lbEZpbHRlckJhbmspICE9PSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ1ZhbGlkIG1lbEZpbHRlckJhbmsgaXMgcmVxdWlyZWQgdG8gZ2VuZXJhdGUgTUZDQycpO1xuICB9XG5cbiAgdmFyIG51bWJlck9mTUZDQ0NvZWZmaWNpZW50cyA9IE1hdGgubWluKDQwLCBNYXRoLm1heCgxLCBhcmdzLm51bWJlck9mTUZDQ0NvZWZmaWNpZW50cyB8fCAxMykpOyAvLyBUdXRvcmlhbCBmcm9tOlxuICAvLyBodHRwOi8vcHJhY3RpY2FsY3J5cHRvZ3JhcGh5LmNvbS9taXNjZWxsYW5lb3VzL21hY2hpbmUtbGVhcm5pbmdcbiAgLy8gL2d1aWRlLW1lbC1mcmVxdWVuY3ktY2Vwc3RyYWwtY29lZmZpY2llbnRzLW1mY2NzL1xuXG4gIHZhciBwb3dTcGVjID0gT2JqZWN0KF9wb3dlclNwZWN0cnVtX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJkZWZhdWx0XCJdKShhcmdzKTtcbiAgdmFyIG51bUZpbHRlcnMgPSBhcmdzLm1lbEZpbHRlckJhbmsubGVuZ3RoO1xuICB2YXIgZmlsdGVyZWQgPSBBcnJheShudW1GaWx0ZXJzKTtcblxuICBpZiAobnVtRmlsdGVycyA8IG51bWJlck9mTUZDQ0NvZWZmaWNpZW50cykge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkluc3VmZmljaWVudCBmaWx0ZXIgYmFuayBmb3IgcmVxdWVzdGVkIG51bWJlciBvZiBjb2VmZmljaWVudHNcIik7XG4gIH1cblxuICB2YXIgbG9nZ2VkTWVsQmFuZHMgPSBuZXcgRmxvYXQzMkFycmF5KG51bUZpbHRlcnMpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbG9nZ2VkTWVsQmFuZHMubGVuZ3RoOyBpKyspIHtcbiAgICBmaWx0ZXJlZFtpXSA9IG5ldyBGbG9hdDMyQXJyYXkoYXJncy5idWZmZXJTaXplIC8gMik7XG4gICAgbG9nZ2VkTWVsQmFuZHNbaV0gPSAwO1xuXG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBhcmdzLmJ1ZmZlclNpemUgLyAyOyBqKyspIHtcbiAgICAgIC8vcG9pbnQtd2lzZSBtdWx0aXBsaWNhdGlvbiBiZXR3ZWVuIHBvd2VyIHNwZWN0cnVtIGFuZCBmaWx0ZXJiYW5rcy5cbiAgICAgIGZpbHRlcmVkW2ldW2pdID0gYXJncy5tZWxGaWx0ZXJCYW5rW2ldW2pdICogcG93U3BlY1tqXTsgLy9zdW1taW5nIHVwIGFsbCBvZiB0aGUgY29lZmZpY2llbnRzIGludG8gb25lIGFycmF5XG5cbiAgICAgIGxvZ2dlZE1lbEJhbmRzW2ldICs9IGZpbHRlcmVkW2ldW2pdO1xuICAgIH0gLy9sb2cgZWFjaCBjb2VmZmljaWVudC5cblxuXG4gICAgbG9nZ2VkTWVsQmFuZHNbaV0gPSBNYXRoLmxvZyhsb2dnZWRNZWxCYW5kc1tpXSArIDEpO1xuICB9IC8vZGN0XG5cblxuICB2YXIgbG9nZ2VkTWVsQmFuZHNBcnJheSA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGxvZ2dlZE1lbEJhbmRzKTtcbiAgdmFyIG1mY2NzID0gZGN0KGxvZ2dlZE1lbEJhbmRzQXJyYXkpLnNsaWNlKDAsIG51bWJlck9mTUZDQ0NvZWZmaWNpZW50cyk7XG4gIHJldHVybiBtZmNjcztcbn0pO1xuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL3NyYy9leHRyYWN0b3JzL3BlcmNlcHR1YWxTaGFycG5lc3MuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vc3JjL2V4dHJhY3RvcnMvcGVyY2VwdHVhbFNoYXJwbmVzcy5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgZXhwb3J0cyBwcm92aWRlZDogZGVmYXVsdCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cInVzZSBzdHJpY3RcIjtcbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfbG91ZG5lc3NfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vbG91ZG5lc3MgKi8gXCIuL3NyYy9leHRyYWN0b3JzL2xvdWRuZXNzLmpzXCIpO1xuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuXG4vKiBoYXJtb255IGRlZmF1bHQgZXhwb3J0ICovIF9fd2VicGFja19leHBvcnRzX19bXCJkZWZhdWx0XCJdID0gKGZ1bmN0aW9uICgpIHtcbiAgaWYgKF90eXBlb2YoYXJndW1lbnRzWzBdLnNpZ25hbCkgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICB9XG5cbiAgdmFyIGxvdWRuZXNzVmFsdWUgPSBPYmplY3QoX2xvdWRuZXNzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJkZWZhdWx0XCJdKShhcmd1bWVudHNbMF0pO1xuICB2YXIgc3BlYyA9IGxvdWRuZXNzVmFsdWUuc3BlY2lmaWM7XG4gIHZhciBvdXRwdXQgPSAwO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3BlYy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChpIDwgMTUpIHtcbiAgICAgIG91dHB1dCArPSAoaSArIDEpICogc3BlY1tpICsgMV07XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dCArPSAwLjA2NiAqIE1hdGguZXhwKDAuMTcxICogKGkgKyAxKSk7XG4gICAgfVxuICB9XG5cbiAgb3V0cHV0ICo9IDAuMTEgLyBsb3VkbmVzc1ZhbHVlLnRvdGFsO1xuICByZXR1cm4gb3V0cHV0O1xufSk7XG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vc3JjL2V4dHJhY3RvcnMvcGVyY2VwdHVhbFNwcmVhZC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9zcmMvZXh0cmFjdG9ycy9wZXJjZXB0dWFsU3ByZWFkLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBleHBvcnRzIHByb3ZpZGVkOiBkZWZhdWx0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9sb3VkbmVzc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9sb3VkbmVzcyAqLyBcIi4vc3JjL2V4dHJhY3RvcnMvbG91ZG5lc3MuanNcIik7XG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5cbi8qIGhhcm1vbnkgZGVmYXVsdCBleHBvcnQgKi8gX193ZWJwYWNrX2V4cG9ydHNfX1tcImRlZmF1bHRcIl0gPSAoZnVuY3Rpb24gKCkge1xuICBpZiAoX3R5cGVvZihhcmd1bWVudHNbMF0uc2lnbmFsKSAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gIH1cblxuICB2YXIgbG91ZG5lc3NWYWx1ZSA9IE9iamVjdChfbG91ZG5lc3NfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfX1tcImRlZmF1bHRcIl0pKGFyZ3VtZW50c1swXSk7XG4gIHZhciBtYXggPSAwO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbG91ZG5lc3NWYWx1ZS5zcGVjaWZpYy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChsb3VkbmVzc1ZhbHVlLnNwZWNpZmljW2ldID4gbWF4KSB7XG4gICAgICBtYXggPSBsb3VkbmVzc1ZhbHVlLnNwZWNpZmljW2ldO1xuICAgIH1cbiAgfVxuXG4gIHZhciBzcHJlYWQgPSBNYXRoLnBvdygobG91ZG5lc3NWYWx1ZS50b3RhbCAtIG1heCkgLyBsb3VkbmVzc1ZhbHVlLnRvdGFsLCAyKTtcbiAgcmV0dXJuIHNwcmVhZDtcbn0pO1xuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL3NyYy9leHRyYWN0b3JzL3Bvd2VyU3BlY3RydW0uanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vc3JjL2V4dHJhY3RvcnMvcG93ZXJTcGVjdHJ1bS5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgZXhwb3J0cyBwcm92aWRlZDogZGVmYXVsdCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cInVzZSBzdHJpY3RcIjtcbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbi8qIGhhcm1vbnkgZGVmYXVsdCBleHBvcnQgKi8gX193ZWJwYWNrX2V4cG9ydHNfX1tcImRlZmF1bHRcIl0gPSAoZnVuY3Rpb24gKCkge1xuICBpZiAoX3R5cGVvZihhcmd1bWVudHNbMF0uYW1wU3BlY3RydW0pICE9PSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgfVxuXG4gIHZhciBwb3dlclNwZWN0cnVtID0gbmV3IEZsb2F0MzJBcnJheShhcmd1bWVudHNbMF0uYW1wU3BlY3RydW0ubGVuZ3RoKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBvd2VyU3BlY3RydW0ubGVuZ3RoOyBpKyspIHtcbiAgICBwb3dlclNwZWN0cnVtW2ldID0gTWF0aC5wb3coYXJndW1lbnRzWzBdLmFtcFNwZWN0cnVtW2ldLCAyKTtcbiAgfVxuXG4gIHJldHVybiBwb3dlclNwZWN0cnVtO1xufSk7XG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vc3JjL2V4dHJhY3RvcnMvcm1zLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vc3JjL2V4dHJhY3RvcnMvcm1zLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyohIGV4cG9ydHMgcHJvdmlkZWQ6IGRlZmF1bHQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG4vKiBoYXJtb255IGRlZmF1bHQgZXhwb3J0ICovIF9fd2VicGFja19leHBvcnRzX19bXCJkZWZhdWx0XCJdID0gKGZ1bmN0aW9uIChhcmdzKSB7XG4gIGlmIChfdHlwZW9mKGFyZ3Muc2lnbmFsKSAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gIH1cblxuICB2YXIgcm1zID0gMDtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3Muc2lnbmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgcm1zICs9IE1hdGgucG93KGFyZ3Muc2lnbmFsW2ldLCAyKTtcbiAgfVxuXG4gIHJtcyA9IHJtcyAvIGFyZ3Muc2lnbmFsLmxlbmd0aDtcbiAgcm1zID0gTWF0aC5zcXJ0KHJtcyk7XG4gIHJldHVybiBybXM7XG59KTtcblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9zcmMvZXh0cmFjdG9ycy9zcGVjdHJhbENlbnRyb2lkLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL3NyYy9leHRyYWN0b3JzL3NwZWN0cmFsQ2VudHJvaWQuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyohIGV4cG9ydHMgcHJvdmlkZWQ6IGRlZmF1bHQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2V4dHJhY3RvclV0aWxpdGllc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9leHRyYWN0b3JVdGlsaXRpZXMgKi8gXCIuL3NyYy9leHRyYWN0b3JzL2V4dHJhY3RvclV0aWxpdGllcy5qc1wiKTtcbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cblxuLyogaGFybW9ueSBkZWZhdWx0IGV4cG9ydCAqLyBfX3dlYnBhY2tfZXhwb3J0c19fW1wiZGVmYXVsdFwiXSA9IChmdW5jdGlvbiAoKSB7XG4gIGlmIChfdHlwZW9mKGFyZ3VtZW50c1swXS5hbXBTcGVjdHJ1bSkgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICB9XG5cbiAgcmV0dXJuIE9iamVjdChfZXh0cmFjdG9yVXRpbGl0aWVzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJtdVwiXSkoMSwgYXJndW1lbnRzWzBdLmFtcFNwZWN0cnVtKTtcbn0pO1xuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL3NyYy9leHRyYWN0b3JzL3NwZWN0cmFsRmxhdG5lc3MuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vc3JjL2V4dHJhY3RvcnMvc3BlY3RyYWxGbGF0bmVzcy5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgZXhwb3J0cyBwcm92aWRlZDogZGVmYXVsdCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cInVzZSBzdHJpY3RcIjtcbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cbi8qIGhhcm1vbnkgZGVmYXVsdCBleHBvcnQgKi8gX193ZWJwYWNrX2V4cG9ydHNfX1tcImRlZmF1bHRcIl0gPSAoZnVuY3Rpb24gKCkge1xuICBpZiAoX3R5cGVvZihhcmd1bWVudHNbMF0uYW1wU3BlY3RydW0pICE9PSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgfVxuXG4gIHZhciBudW1lcmF0b3IgPSAwO1xuICB2YXIgZGVub21pbmF0b3IgPSAwO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzWzBdLmFtcFNwZWN0cnVtLmxlbmd0aDsgaSsrKSB7XG4gICAgbnVtZXJhdG9yICs9IE1hdGgubG9nKGFyZ3VtZW50c1swXS5hbXBTcGVjdHJ1bVtpXSk7XG4gICAgZGVub21pbmF0b3IgKz0gYXJndW1lbnRzWzBdLmFtcFNwZWN0cnVtW2ldO1xuICB9XG5cbiAgcmV0dXJuIE1hdGguZXhwKG51bWVyYXRvciAvIGFyZ3VtZW50c1swXS5hbXBTcGVjdHJ1bS5sZW5ndGgpICogYXJndW1lbnRzWzBdLmFtcFNwZWN0cnVtLmxlbmd0aCAvIGRlbm9taW5hdG9yO1xufSk7XG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vc3JjL2V4dHJhY3RvcnMvc3BlY3RyYWxGbHV4LmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vc3JjL2V4dHJhY3RvcnMvc3BlY3RyYWxGbHV4LmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyohIGV4cG9ydHMgcHJvdmlkZWQ6IGRlZmF1bHQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG4vKiBoYXJtb255IGRlZmF1bHQgZXhwb3J0ICovIF9fd2VicGFja19leHBvcnRzX19bXCJkZWZhdWx0XCJdID0gKGZ1bmN0aW9uIChhcmdzKSB7XG4gIGlmIChfdHlwZW9mKGFyZ3Muc2lnbmFsKSAhPT0gJ29iamVjdCcgfHwgX3R5cGVvZihhcmdzLnByZXZpb3VzU2lnbmFsKSAhPSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgfVxuXG4gIHZhciBzZiA9IDA7XG5cbiAgZm9yICh2YXIgaSA9IC0oYXJncy5idWZmZXJTaXplIC8gMik7IGkgPCBzaWduYWwubGVuZ3RoIC8gMiAtIDE7IGkrKykge1xuICAgIHggPSBNYXRoLmFicyhhcmdzLnNpZ25hbFtpXSkgLSBNYXRoLmFicyhhcmdzLnByZXZpb3VzU2lnbmFsW2ldKTtcbiAgICBzZiArPSAoeCArIE1hdGguYWJzKHgpKSAvIDI7XG4gIH1cblxuICByZXR1cm4gc2Y7XG59KTtcblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9zcmMvZXh0cmFjdG9ycy9zcGVjdHJhbEt1cnRvc2lzLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL3NyYy9leHRyYWN0b3JzL3NwZWN0cmFsS3VydG9zaXMuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyohIGV4cG9ydHMgcHJvdmlkZWQ6IGRlZmF1bHQgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2V4dHJhY3RvclV0aWxpdGllc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9leHRyYWN0b3JVdGlsaXRpZXMgKi8gXCIuL3NyYy9leHRyYWN0b3JzL2V4dHJhY3RvclV0aWxpdGllcy5qc1wiKTtcbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IGlmICh0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFN5bWJvbC5pdGVyYXRvciA9PT0gXCJzeW1ib2xcIikgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIHR5cGVvZiBvYmo7IH07IH0gZWxzZSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gb2JqICYmIHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiBvYmouY29uc3RydWN0b3IgPT09IFN5bWJvbCAmJiBvYmogIT09IFN5bWJvbC5wcm90b3R5cGUgPyBcInN5bWJvbFwiIDogdHlwZW9mIG9iajsgfTsgfSByZXR1cm4gX3R5cGVvZihvYmopOyB9XG5cblxuLyogaGFybW9ueSBkZWZhdWx0IGV4cG9ydCAqLyBfX3dlYnBhY2tfZXhwb3J0c19fW1wiZGVmYXVsdFwiXSA9IChmdW5jdGlvbiAoKSB7XG4gIGlmIChfdHlwZW9mKGFyZ3VtZW50c1swXS5hbXBTcGVjdHJ1bSkgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICB9XG5cbiAgdmFyIGFtcHNwZWMgPSBhcmd1bWVudHNbMF0uYW1wU3BlY3RydW07XG4gIHZhciBtdTEgPSBPYmplY3QoX2V4dHJhY3RvclV0aWxpdGllc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fW1wibXVcIl0pKDEsIGFtcHNwZWMpO1xuICB2YXIgbXUyID0gT2JqZWN0KF9leHRyYWN0b3JVdGlsaXRpZXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfX1tcIm11XCJdKSgyLCBhbXBzcGVjKTtcbiAgdmFyIG11MyA9IE9iamVjdChfZXh0cmFjdG9yVXRpbGl0aWVzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJtdVwiXSkoMywgYW1wc3BlYyk7XG4gIHZhciBtdTQgPSBPYmplY3QoX2V4dHJhY3RvclV0aWxpdGllc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fW1wibXVcIl0pKDQsIGFtcHNwZWMpO1xuICB2YXIgbnVtZXJhdG9yID0gLTMgKiBNYXRoLnBvdyhtdTEsIDQpICsgNiAqIG11MSAqIG11MiAtIDQgKiBtdTEgKiBtdTMgKyBtdTQ7XG4gIHZhciBkZW5vbWluYXRvciA9IE1hdGgucG93KE1hdGguc3FydChtdTIgLSBNYXRoLnBvdyhtdTEsIDIpKSwgNCk7XG4gIHJldHVybiBudW1lcmF0b3IgLyBkZW5vbWluYXRvcjtcbn0pO1xuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL3NyYy9leHRyYWN0b3JzL3NwZWN0cmFsUm9sbG9mZi5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL3NyYy9leHRyYWN0b3JzL3NwZWN0cmFsUm9sbG9mZi5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBleHBvcnRzIHByb3ZpZGVkOiBkZWZhdWx0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuLyogaGFybW9ueSBkZWZhdWx0IGV4cG9ydCAqLyBfX3dlYnBhY2tfZXhwb3J0c19fW1wiZGVmYXVsdFwiXSA9IChmdW5jdGlvbiAoKSB7XG4gIGlmIChfdHlwZW9mKGFyZ3VtZW50c1swXS5hbXBTcGVjdHJ1bSkgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICB9XG5cbiAgdmFyIGFtcHNwZWMgPSBhcmd1bWVudHNbMF0uYW1wU3BlY3RydW07IC8vY2FsY3VsYXRlIG55cXVpc3QgYmluXG5cbiAgdmFyIG55cUJpbiA9IGFyZ3VtZW50c1swXS5zYW1wbGVSYXRlIC8gKDIgKiAoYW1wc3BlYy5sZW5ndGggLSAxKSk7XG4gIHZhciBlYyA9IDA7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhbXBzcGVjLmxlbmd0aDsgaSsrKSB7XG4gICAgZWMgKz0gYW1wc3BlY1tpXTtcbiAgfVxuXG4gIHZhciB0aHJlc2hvbGQgPSAwLjk5ICogZWM7XG4gIHZhciBuID0gYW1wc3BlYy5sZW5ndGggLSAxO1xuXG4gIHdoaWxlIChlYyA+IHRocmVzaG9sZCAmJiBuID49IDApIHtcbiAgICBlYyAtPSBhbXBzcGVjW25dO1xuICAgIC0tbjtcbiAgfVxuXG4gIHJldHVybiAobiArIDEpICogbnlxQmluO1xufSk7XG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vc3JjL2V4dHJhY3RvcnMvc3BlY3RyYWxTa2V3bmVzcy5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9zcmMvZXh0cmFjdG9ycy9zcGVjdHJhbFNrZXduZXNzLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBleHBvcnRzIHByb3ZpZGVkOiBkZWZhdWx0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9leHRyYWN0b3JVdGlsaXRpZXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vZXh0cmFjdG9yVXRpbGl0aWVzICovIFwiLi9zcmMvZXh0cmFjdG9ycy9leHRyYWN0b3JVdGlsaXRpZXMuanNcIik7XG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5cbi8qIGhhcm1vbnkgZGVmYXVsdCBleHBvcnQgKi8gX193ZWJwYWNrX2V4cG9ydHNfX1tcImRlZmF1bHRcIl0gPSAoZnVuY3Rpb24gKGFyZ3MpIHtcbiAgaWYgKF90eXBlb2YoYXJncy5hbXBTcGVjdHJ1bSkgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpO1xuICB9XG5cbiAgdmFyIG11MSA9IE9iamVjdChfZXh0cmFjdG9yVXRpbGl0aWVzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJtdVwiXSkoMSwgYXJncy5hbXBTcGVjdHJ1bSk7XG4gIHZhciBtdTIgPSBPYmplY3QoX2V4dHJhY3RvclV0aWxpdGllc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fW1wibXVcIl0pKDIsIGFyZ3MuYW1wU3BlY3RydW0pO1xuICB2YXIgbXUzID0gT2JqZWN0KF9leHRyYWN0b3JVdGlsaXRpZXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfX1tcIm11XCJdKSgzLCBhcmdzLmFtcFNwZWN0cnVtKTtcbiAgdmFyIG51bWVyYXRvciA9IDIgKiBNYXRoLnBvdyhtdTEsIDMpIC0gMyAqIG11MSAqIG11MiArIG11MztcbiAgdmFyIGRlbm9taW5hdG9yID0gTWF0aC5wb3coTWF0aC5zcXJ0KG11MiAtIE1hdGgucG93KG11MSwgMikpLCAzKTtcbiAgcmV0dXJuIG51bWVyYXRvciAvIGRlbm9taW5hdG9yO1xufSk7XG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vc3JjL2V4dHJhY3RvcnMvc3BlY3RyYWxTbG9wZS5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9zcmMvZXh0cmFjdG9ycy9zcGVjdHJhbFNsb3BlLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBleHBvcnRzIHByb3ZpZGVkOiBkZWZhdWx0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuLyogaGFybW9ueSBkZWZhdWx0IGV4cG9ydCAqLyBfX3dlYnBhY2tfZXhwb3J0c19fW1wiZGVmYXVsdFwiXSA9IChmdW5jdGlvbiAoYXJncykge1xuICBpZiAoX3R5cGVvZihhcmdzLmFtcFNwZWN0cnVtKSAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCk7XG4gIH0gLy9saW5lYXIgcmVncmVzc2lvblxuXG5cbiAgdmFyIGFtcFN1bSA9IDA7XG4gIHZhciBmcmVxU3VtID0gMDtcbiAgdmFyIGZyZXFzID0gbmV3IEZsb2F0MzJBcnJheShhcmdzLmFtcFNwZWN0cnVtLmxlbmd0aCk7XG4gIHZhciBwb3dGcmVxU3VtID0gMDtcbiAgdmFyIGFtcEZyZXFTdW0gPSAwO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJncy5hbXBTcGVjdHJ1bS5sZW5ndGg7IGkrKykge1xuICAgIGFtcFN1bSArPSBhcmdzLmFtcFNwZWN0cnVtW2ldO1xuICAgIHZhciBjdXJGcmVxID0gaSAqIGFyZ3Muc2FtcGxlUmF0ZSAvIGFyZ3MuYnVmZmVyU2l6ZTtcbiAgICBmcmVxc1tpXSA9IGN1ckZyZXE7XG4gICAgcG93RnJlcVN1bSArPSBjdXJGcmVxICogY3VyRnJlcTtcbiAgICBmcmVxU3VtICs9IGN1ckZyZXE7XG4gICAgYW1wRnJlcVN1bSArPSBjdXJGcmVxICogYXJncy5hbXBTcGVjdHJ1bVtpXTtcbiAgfVxuXG4gIHJldHVybiAoYXJncy5hbXBTcGVjdHJ1bS5sZW5ndGggKiBhbXBGcmVxU3VtIC0gZnJlcVN1bSAqIGFtcFN1bSkgLyAoYW1wU3VtICogKHBvd0ZyZXFTdW0gLSBNYXRoLnBvdyhmcmVxU3VtLCAyKSkpO1xufSk7XG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vc3JjL2V4dHJhY3RvcnMvc3BlY3RyYWxTcHJlYWQuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL3NyYy9leHRyYWN0b3JzL3NwZWN0cmFsU3ByZWFkLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgZXhwb3J0cyBwcm92aWRlZDogZGVmYXVsdCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgX193ZWJwYWNrX2V4cG9ydHNfXywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cInVzZSBzdHJpY3RcIjtcbl9fd2VicGFja19yZXF1aXJlX18ucihfX3dlYnBhY2tfZXhwb3J0c19fKTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfZXh0cmFjdG9yVXRpbGl0aWVzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2V4dHJhY3RvclV0aWxpdGllcyAqLyBcIi4vc3JjL2V4dHJhY3RvcnMvZXh0cmFjdG9yVXRpbGl0aWVzLmpzXCIpO1xuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuXG4vKiBoYXJtb255IGRlZmF1bHQgZXhwb3J0ICovIF9fd2VicGFja19leHBvcnRzX19bXCJkZWZhdWx0XCJdID0gKGZ1bmN0aW9uIChhcmdzKSB7XG4gIGlmIChfdHlwZW9mKGFyZ3MuYW1wU3BlY3RydW0pICE9PSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgfVxuXG4gIHJldHVybiBNYXRoLnNxcnQoT2JqZWN0KF9leHRyYWN0b3JVdGlsaXRpZXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfX1tcIm11XCJdKSgyLCBhcmdzLmFtcFNwZWN0cnVtKSAtIE1hdGgucG93KE9iamVjdChfZXh0cmFjdG9yVXRpbGl0aWVzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJtdVwiXSkoMSwgYXJncy5hbXBTcGVjdHJ1bSksIDIpKTtcbn0pO1xuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL3NyYy9leHRyYWN0b3JzL3pjci5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL3NyYy9leHRyYWN0b3JzL3pjci5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBleHBvcnRzIHByb3ZpZGVkOiBkZWZhdWx0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgaWYgKHR5cGVvZiBTeW1ib2wgPT09IFwiZnVuY3Rpb25cIiAmJiB0eXBlb2YgU3ltYm9sLml0ZXJhdG9yID09PSBcInN5bWJvbFwiKSB7IF90eXBlb2YgPSBmdW5jdGlvbiBfdHlwZW9mKG9iaikgeyByZXR1cm4gdHlwZW9mIG9iajsgfTsgfSBlbHNlIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiBvYmogJiYgdHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIG9iai5jb25zdHJ1Y3RvciA9PT0gU3ltYm9sICYmIG9iaiAhPT0gU3ltYm9sLnByb3RvdHlwZSA/IFwic3ltYm9sXCIgOiB0eXBlb2Ygb2JqOyB9OyB9IHJldHVybiBfdHlwZW9mKG9iaik7IH1cblxuLyogaGFybW9ueSBkZWZhdWx0IGV4cG9ydCAqLyBfX3dlYnBhY2tfZXhwb3J0c19fW1wiZGVmYXVsdFwiXSA9IChmdW5jdGlvbiAoKSB7XG4gIGlmIChfdHlwZW9mKGFyZ3VtZW50c1swXS5zaWduYWwpICE9PSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKTtcbiAgfVxuXG4gIHZhciB6Y3IgPSAwO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzWzBdLnNpZ25hbC5sZW5ndGg7IGkrKykge1xuICAgIGlmIChhcmd1bWVudHNbMF0uc2lnbmFsW2ldID49IDAgJiYgYXJndW1lbnRzWzBdLnNpZ25hbFtpICsgMV0gPCAwIHx8IGFyZ3VtZW50c1swXS5zaWduYWxbaV0gPCAwICYmIGFyZ3VtZW50c1swXS5zaWduYWxbaSArIDFdID49IDApIHtcbiAgICAgIHpjcisrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB6Y3I7XG59KTtcblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9zcmMvZmVhdHVyZUV4dHJhY3RvcnMuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiohKlxcXG4gICEqKiogLi9zcmMvZmVhdHVyZUV4dHJhY3RvcnMuanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgZXhwb3J0cyBwcm92aWRlZDogYnVmZmVyLCBybXMsIGVuZXJneSwgY29tcGxleFNwZWN0cnVtLCBzcGVjdHJhbFNsb3BlLCBzcGVjdHJhbENlbnRyb2lkLCBzcGVjdHJhbFJvbGxvZmYsIHNwZWN0cmFsRmxhdG5lc3MsIHNwZWN0cmFsU3ByZWFkLCBzcGVjdHJhbFNrZXduZXNzLCBzcGVjdHJhbEt1cnRvc2lzLCBhbXBsaXR1ZGVTcGVjdHJ1bSwgemNyLCBsb3VkbmVzcywgcGVyY2VwdHVhbFNwcmVhZCwgcGVyY2VwdHVhbFNoYXJwbmVzcywgcG93ZXJTcGVjdHJ1bSwgbWZjYywgY2hyb21hLCBzcGVjdHJhbEZsdXggKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAoYmluZGluZykgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwiYnVmZmVyXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gYnVmZmVyOyB9KTtcbi8qIGhhcm1vbnkgZXhwb3J0IChiaW5kaW5nKSAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywgXCJjb21wbGV4U3BlY3RydW1cIiwgZnVuY3Rpb24oKSB7IHJldHVybiBjb21wbGV4U3BlY3RydW07IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcImFtcGxpdHVkZVNwZWN0cnVtXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gYW1wbGl0dWRlU3BlY3RydW07IH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9leHRyYWN0b3JzX3Jtc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9leHRyYWN0b3JzL3JtcyAqLyBcIi4vc3JjL2V4dHJhY3RvcnMvcm1zLmpzXCIpO1xuLyogaGFybW9ueSByZWV4cG9ydCAoc2FmZSkgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwicm1zXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gX2V4dHJhY3RvcnNfcm1zX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJkZWZhdWx0XCJdOyB9KTtcblxuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9leHRyYWN0b3JzX2VuZXJneV9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9leHRyYWN0b3JzL2VuZXJneSAqLyBcIi4vc3JjL2V4dHJhY3RvcnMvZW5lcmd5LmpzXCIpO1xuLyogaGFybW9ueSByZWV4cG9ydCAoc2FmZSkgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwiZW5lcmd5XCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gX2V4dHJhY3RvcnNfZW5lcmd5X19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xX19bXCJkZWZhdWx0XCJdOyB9KTtcblxuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9leHRyYWN0b3JzX3NwZWN0cmFsU2xvcGVfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vZXh0cmFjdG9ycy9zcGVjdHJhbFNsb3BlICovIFwiLi9zcmMvZXh0cmFjdG9ycy9zcGVjdHJhbFNsb3BlLmpzXCIpO1xuLyogaGFybW9ueSByZWV4cG9ydCAoc2FmZSkgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwic3BlY3RyYWxTbG9wZVwiLCBmdW5jdGlvbigpIHsgcmV0dXJuIF9leHRyYWN0b3JzX3NwZWN0cmFsU2xvcGVfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfX1tcImRlZmF1bHRcIl07IH0pO1xuXG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2V4dHJhY3RvcnNfc3BlY3RyYWxDZW50cm9pZF9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9leHRyYWN0b3JzL3NwZWN0cmFsQ2VudHJvaWQgKi8gXCIuL3NyYy9leHRyYWN0b3JzL3NwZWN0cmFsQ2VudHJvaWQuanNcIik7XG4vKiBoYXJtb255IHJlZXhwb3J0IChzYWZlKSAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywgXCJzcGVjdHJhbENlbnRyb2lkXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gX2V4dHJhY3RvcnNfc3BlY3RyYWxDZW50cm9pZF9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfM19fW1wiZGVmYXVsdFwiXTsgfSk7XG5cbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfZXh0cmFjdG9yc19zcGVjdHJhbFJvbGxvZmZfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzRfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vZXh0cmFjdG9ycy9zcGVjdHJhbFJvbGxvZmYgKi8gXCIuL3NyYy9leHRyYWN0b3JzL3NwZWN0cmFsUm9sbG9mZi5qc1wiKTtcbi8qIGhhcm1vbnkgcmVleHBvcnQgKHNhZmUpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcInNwZWN0cmFsUm9sbG9mZlwiLCBmdW5jdGlvbigpIHsgcmV0dXJuIF9leHRyYWN0b3JzX3NwZWN0cmFsUm9sbG9mZl9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfNF9fW1wiZGVmYXVsdFwiXTsgfSk7XG5cbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfZXh0cmFjdG9yc19zcGVjdHJhbEZsYXRuZXNzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV81X18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2V4dHJhY3RvcnMvc3BlY3RyYWxGbGF0bmVzcyAqLyBcIi4vc3JjL2V4dHJhY3RvcnMvc3BlY3RyYWxGbGF0bmVzcy5qc1wiKTtcbi8qIGhhcm1vbnkgcmVleHBvcnQgKHNhZmUpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcInNwZWN0cmFsRmxhdG5lc3NcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBfZXh0cmFjdG9yc19zcGVjdHJhbEZsYXRuZXNzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV81X19bXCJkZWZhdWx0XCJdOyB9KTtcblxuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9leHRyYWN0b3JzX3NwZWN0cmFsU3ByZWFkX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV82X18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2V4dHJhY3RvcnMvc3BlY3RyYWxTcHJlYWQgKi8gXCIuL3NyYy9leHRyYWN0b3JzL3NwZWN0cmFsU3ByZWFkLmpzXCIpO1xuLyogaGFybW9ueSByZWV4cG9ydCAoc2FmZSkgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwic3BlY3RyYWxTcHJlYWRcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBfZXh0cmFjdG9yc19zcGVjdHJhbFNwcmVhZF9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfNl9fW1wiZGVmYXVsdFwiXTsgfSk7XG5cbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfZXh0cmFjdG9yc19zcGVjdHJhbFNrZXduZXNzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV83X18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2V4dHJhY3RvcnMvc3BlY3RyYWxTa2V3bmVzcyAqLyBcIi4vc3JjL2V4dHJhY3RvcnMvc3BlY3RyYWxTa2V3bmVzcy5qc1wiKTtcbi8qIGhhcm1vbnkgcmVleHBvcnQgKHNhZmUpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcInNwZWN0cmFsU2tld25lc3NcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBfZXh0cmFjdG9yc19zcGVjdHJhbFNrZXduZXNzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV83X19bXCJkZWZhdWx0XCJdOyB9KTtcblxuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9leHRyYWN0b3JzX3NwZWN0cmFsS3VydG9zaXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzhfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vZXh0cmFjdG9ycy9zcGVjdHJhbEt1cnRvc2lzICovIFwiLi9zcmMvZXh0cmFjdG9ycy9zcGVjdHJhbEt1cnRvc2lzLmpzXCIpO1xuLyogaGFybW9ueSByZWV4cG9ydCAoc2FmZSkgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwic3BlY3RyYWxLdXJ0b3Npc1wiLCBmdW5jdGlvbigpIHsgcmV0dXJuIF9leHRyYWN0b3JzX3NwZWN0cmFsS3VydG9zaXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzhfX1tcImRlZmF1bHRcIl07IH0pO1xuXG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2V4dHJhY3RvcnNfemNyX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV85X18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2V4dHJhY3RvcnMvemNyICovIFwiLi9zcmMvZXh0cmFjdG9ycy96Y3IuanNcIik7XG4vKiBoYXJtb255IHJlZXhwb3J0IChzYWZlKSAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywgXCJ6Y3JcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBfZXh0cmFjdG9yc196Y3JfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzlfX1tcImRlZmF1bHRcIl07IH0pO1xuXG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2V4dHJhY3RvcnNfbG91ZG5lc3NfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzEwX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2V4dHJhY3RvcnMvbG91ZG5lc3MgKi8gXCIuL3NyYy9leHRyYWN0b3JzL2xvdWRuZXNzLmpzXCIpO1xuLyogaGFybW9ueSByZWV4cG9ydCAoc2FmZSkgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwibG91ZG5lc3NcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBfZXh0cmFjdG9yc19sb3VkbmVzc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMTBfX1tcImRlZmF1bHRcIl07IH0pO1xuXG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2V4dHJhY3RvcnNfcGVyY2VwdHVhbFNwcmVhZF9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMTFfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vZXh0cmFjdG9ycy9wZXJjZXB0dWFsU3ByZWFkICovIFwiLi9zcmMvZXh0cmFjdG9ycy9wZXJjZXB0dWFsU3ByZWFkLmpzXCIpO1xuLyogaGFybW9ueSByZWV4cG9ydCAoc2FmZSkgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwicGVyY2VwdHVhbFNwcmVhZFwiLCBmdW5jdGlvbigpIHsgcmV0dXJuIF9leHRyYWN0b3JzX3BlcmNlcHR1YWxTcHJlYWRfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzExX19bXCJkZWZhdWx0XCJdOyB9KTtcblxuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9leHRyYWN0b3JzX3BlcmNlcHR1YWxTaGFycG5lc3NfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzEyX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL2V4dHJhY3RvcnMvcGVyY2VwdHVhbFNoYXJwbmVzcyAqLyBcIi4vc3JjL2V4dHJhY3RvcnMvcGVyY2VwdHVhbFNoYXJwbmVzcy5qc1wiKTtcbi8qIGhhcm1vbnkgcmVleHBvcnQgKHNhZmUpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcInBlcmNlcHR1YWxTaGFycG5lc3NcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBfZXh0cmFjdG9yc19wZXJjZXB0dWFsU2hhcnBuZXNzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xMl9fW1wiZGVmYXVsdFwiXTsgfSk7XG5cbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfZXh0cmFjdG9yc19tZmNjX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xM19fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9leHRyYWN0b3JzL21mY2MgKi8gXCIuL3NyYy9leHRyYWN0b3JzL21mY2MuanNcIik7XG4vKiBoYXJtb255IHJlZXhwb3J0IChzYWZlKSAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywgXCJtZmNjXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gX2V4dHJhY3RvcnNfbWZjY19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMTNfX1tcImRlZmF1bHRcIl07IH0pO1xuXG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2V4dHJhY3RvcnNfY2hyb21hX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xNF9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9leHRyYWN0b3JzL2Nocm9tYSAqLyBcIi4vc3JjL2V4dHJhY3RvcnMvY2hyb21hLmpzXCIpO1xuLyogaGFybW9ueSByZWV4cG9ydCAoc2FmZSkgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwiY2hyb21hXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gX2V4dHJhY3RvcnNfY2hyb21hX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xNF9fW1wiZGVmYXVsdFwiXTsgfSk7XG5cbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfZXh0cmFjdG9yc19wb3dlclNwZWN0cnVtX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xNV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9leHRyYWN0b3JzL3Bvd2VyU3BlY3RydW0gKi8gXCIuL3NyYy9leHRyYWN0b3JzL3Bvd2VyU3BlY3RydW0uanNcIik7XG4vKiBoYXJtb255IHJlZXhwb3J0IChzYWZlKSAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywgXCJwb3dlclNwZWN0cnVtXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gX2V4dHJhY3RvcnNfcG93ZXJTcGVjdHJ1bV9fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMTVfX1tcImRlZmF1bHRcIl07IH0pO1xuXG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX2V4dHJhY3RvcnNfc3BlY3RyYWxGbHV4X19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xNl9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9leHRyYWN0b3JzL3NwZWN0cmFsRmx1eCAqLyBcIi4vc3JjL2V4dHJhY3RvcnMvc3BlY3RyYWxGbHV4LmpzXCIpO1xuLyogaGFybW9ueSByZWV4cG9ydCAoc2FmZSkgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwic3BlY3RyYWxGbHV4XCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gX2V4dHJhY3RvcnNfc3BlY3RyYWxGbHV4X19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8xNl9fW1wiZGVmYXVsdFwiXTsgfSk7XG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cblxuXG5cbnZhciBidWZmZXIgPSBmdW5jdGlvbiBidWZmZXIoYXJncykge1xuICByZXR1cm4gYXJncy5zaWduYWw7XG59O1xuXG52YXIgY29tcGxleFNwZWN0cnVtID0gZnVuY3Rpb24gY29tcGxleFNwZWN0cnVtKGFyZ3MpIHtcbiAgcmV0dXJuIGFyZ3MuY29tcGxleFNwZWN0cnVtO1xufTtcblxudmFyIGFtcGxpdHVkZVNwZWN0cnVtID0gZnVuY3Rpb24gYW1wbGl0dWRlU3BlY3RydW0oYXJncykge1xuICByZXR1cm4gYXJncy5hbXBTcGVjdHJ1bTtcbn07XG5cblxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL3NyYy9pbmRleC5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqKiEqXFxcbiAgISoqKiAuL3NyYy9pbmRleC5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKi9cbi8qISBubyBzdGF0aWMgZXhwb3J0cyBmb3VuZCAqL1xuLyoqKi8gKGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5tb2R1bGUuZXhwb3J0cyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vbWFpbiAqLyBcIi4vc3JjL21haW4uanNcIikuZGVmYXVsdDtcblxuLyoqKi8gfSksXG5cbi8qKiovIFwiLi9zcmMvbWFpbi5qc1wiOlxuLyohKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vc3JjL21haW4uanMgKioqIVxuICBcXCoqKioqKioqKioqKioqKioqKioqKi9cbi8qISBleHBvcnRzIHByb3ZpZGVkOiBkZWZhdWx0ICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF91dGlsaXRpZXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vdXRpbGl0aWVzICovIFwiLi9zcmMvdXRpbGl0aWVzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9mZWF0dXJlRXh0cmFjdG9yc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9mZWF0dXJlRXh0cmFjdG9ycyAqLyBcIi4vc3JjL2ZlYXR1cmVFeHRyYWN0b3JzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGZmdGpzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISBmZnRqcyAqLyBcIi4vbm9kZV9tb2R1bGVzL2ZmdGpzL2Rpc3QvZmZ0LmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIGZmdGpzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX19fZGVmYXVsdCA9IC8qI19fUFVSRV9fKi9fX3dlYnBhY2tfcmVxdWlyZV9fLm4oZmZ0anNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzJfXyk7XG4vKiBoYXJtb255IGltcG9ydCAqLyB2YXIgX21leWRhX3dhX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8zX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL21leWRhLXdhICovIFwiLi9zcmMvbWV5ZGEtd2EuanNcIik7XG5mdW5jdGlvbiBfZGVmaW5lUHJvcGVydHkob2JqLCBrZXksIHZhbHVlKSB7IGlmIChrZXkgaW4gb2JqKSB7IE9iamVjdC5kZWZpbmVQcm9wZXJ0eShvYmosIGtleSwgeyB2YWx1ZTogdmFsdWUsIGVudW1lcmFibGU6IHRydWUsIGNvbmZpZ3VyYWJsZTogdHJ1ZSwgd3JpdGFibGU6IHRydWUgfSk7IH0gZWxzZSB7IG9ialtrZXldID0gdmFsdWU7IH0gcmV0dXJuIG9iajsgfVxuXG5mdW5jdGlvbiBfdHlwZW9mKG9iaikgeyBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHsgX3R5cGVvZiA9IGZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7IHJldHVybiB0eXBlb2Ygb2JqOyB9OyB9IGVsc2UgeyBfdHlwZW9mID0gZnVuY3Rpb24gX3R5cGVvZihvYmopIHsgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7IH07IH0gcmV0dXJuIF90eXBlb2Yob2JqKTsgfVxuXG5cblxuXG5cbi8qKlxuICogTWV5ZGEgTW9kdWxlXG4gKiBAbW9kdWxlIG1leWRhXG4gKi9cblxuLyoqXG4gKiBPcHRpb25zIGZvciBjb25zdHJ1Y3RpbmcgYSBNZXlkYUFuYWx5emVyXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBNZXlkYU9wdGlvbnNcbiAqIEBwcm9wZXJ0eSB7QXVkaW9Db250ZXh0fSBhdWRpb0NvbnRleHQgLSBUaGUgQXVkaW8gQ29udGV4dCBmb3IgdGhlIE1leWRhQW5hbHl6ZXIgdG8gb3BlcmF0ZSBpbi5cbiAqIEBwcm9wZXJ0eSB7QXVkaW9Ob2RlfSBzb3VyY2UgLSBUaGUgQXVkaW8gTm9kZSBmb3IgTWV5ZGEgdG8gbGlzdGVuIHRvLlxuICogQHByb3BlcnR5IHtudW1iZXJ9IFtidWZmZXJTaXplXSAtIFRoZSBzaXplIG9mIHRoZSBidWZmZXIuXG4gKiBAcHJvcGVydHkge251bWJlcn0gW2hvcFNpemVdIC0gVGhlIGhvcCBzaXplIGJldHdlZW4gYnVmZmVycy5cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbc2FtcGxlUmF0ZV0gLSBUaGUgbnVtYmVyIG9mIHNhbXBsZXMgcGVyIHNlY29uZCBpbiB0aGUgYXVkaW8gY29udGV4dC5cbiAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IFtjYWxsYmFja10gLSBBIGZ1bmN0aW9uIHRvIHJlY2VpdmUgdGhlIGZyYW1lcyBvZiBhdWRpbyBmZWF0dXJlc1xuICogQHByb3BlcnR5IHtzdHJpbmd9IFt3aW5kb3dpbmdGdW5jdGlvbl0gLSBUaGUgV2luZG93aW5nIEZ1bmN0aW9uIHRvIGFwcGx5IHRvIHRoZSBzaWduYWwgYmVmb3JlIHRyYW5zZm9ybWF0aW9uIHRvIHRoZSBmcmVxdWVuY3kgZG9tYWluXG4gKiBAcHJvcGVydHkge3N0cmluZ3xBcnJheS48c3RyaW5nPn0gW2ZlYXR1cmVFeHRyYWN0b3JzXSAtIFNwZWNpZnkgdGhlIGZlYXR1cmUgZXh0cmFjdG9ycyB5b3Ugd2FudCB0byBydW4gb24gdGhlIGF1ZGlvLlxuICogQHByb3BlcnR5IHtib29sZWFufSBbc3RhcnRJbW1lZGlhdGVseV0gLSBQYXNzIGB0cnVlYCB0byBzdGFydCBmZWF0dXJlIGV4dHJhY3Rpb24gaW1tZWRpYXRlbHlcbiAqL1xuXG4vKipcbiAqIFdlYiBBdWRpbyBjb250ZXh0XG4gKiBFaXRoZXIgYW4ge0BsaW5rIEF1ZGlvQ29udGV4dHxodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvQXVkaW9Db250ZXh0fVxuICogb3IgYW4ge0BsaW5rIE9mZmxpbmVBdWRpb0NvbnRleHR8aHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL09mZmxpbmVBdWRpb0NvbnRleHR9XG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBBdWRpb0NvbnRleHRcbiAqL1xuXG4vKipcbiAqIEF1ZGlvTm9kZVxuICogQSBXZWIgQXVkaW9Ob2RlXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBBdWRpb05vZGVcbiAqL1xuXG4vKipcbiAqIFNjcmlwdFByb2Nlc3Nvck5vZGVcbiAqIEEgV2ViIEF1ZGlvIFNjcmlwdFByb2Nlc3Nvck5vZGVcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFNjcmlwdFByb2Nlc3Nvck5vZGVcbiAqL1xuXG4vKipcbiAqIEBjbGFzcyBNZXlkYVxuICogQGhpZGVjb25zdHJ1Y3RvclxuICogQGNsYXNzZGVzY1xuICogVGhlIHNjaGVtYSBmb3IgdGhlIGRlZmF1bHQgZXhwb3J0IG9mIHRoZSBNZXlkYSBsaWJyYXJ5LlxuICogQGV4YW1wbGVcbiAqIHZhciBNZXlkYSA9IHJlcXVpcmUoJ21leWRhJyk7XG4gKi9cblxudmFyIE1leWRhID0ge1xuICAvKipcbiAgICogTWV5ZGEgc3RvcmVzIGEgcmVmZXJlbmNlIHRvIHRoZSByZWxldmFudCBhdWRpbyBjb250ZXh0IGhlcmUgZm9yIHVzZSBpbnNpZGVcbiAgICogdGhlIFdlYiBBdWRpbyBBUEkuXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAbWVtYmVyIHtBdWRpb0NvbnRleHR9XG4gICAqL1xuICBhdWRpb0NvbnRleHQ6IG51bGwsXG5cbiAgLyoqXG4gICAqIE1leWRhIGtlZXBzIGFuIGludGVybmFsIFNjcmlwdFByb2Nlc3Nvck5vZGUgaW4gd2hpY2ggaXQgcnVucyBhdWRpbyBmZWF0dXJlXG4gICAqIGV4dHJhY3Rpb24uIFRoZSBTY3JpcHRQcm9jZXNzb3JOb2RlIGlzIHN0b3JlZCBpbiB0aGlzIG1lbWJlciB2YXJpYWJsZS5cbiAgICogQGluc3RhbmNlXG4gICAqIEBtZW1iZXIge1NjcmlwdFByb2Nlc3Nvck5vZGV9XG4gICAqL1xuICBzcG46IG51bGwsXG5cbiAgLyoqXG4gICAqIFRoZSBsZW5ndGggb2YgZWFjaCBidWZmZXIgdGhhdCBNZXlkYSB3aWxsIGV4dHJhY3QgYXVkaW8gb24uIFdoZW4gcmVjaWV2aW5nXG4gICAqIGlucHV0IHZpYSB0aGUgV2ViIEF1ZGlvIEFQSSwgdGhlIFNjcmlwdCBQcm9jZXNzb3IgTm9kZSBjaHVua3MgaW5jb21pbmcgYXVkaW9cbiAgICogaW50byBhcnJheXMgb2YgdGhpcyBsZW5ndGguIExvbmdlciBidWZmZXJzIGFsbG93IGZvciBtb3JlIHByZWNpc2lvbiBpbiB0aGVcbiAgICogZnJlcXVlbmN5IGRvbWFpbiwgYnV0IGluY3JlYXNlIHRoZSBhbW91bnQgb2YgdGltZSBpdCB0YWtlcyBmb3IgTWV5ZGEgdG9cbiAgICogb3V0cHV0IGEgc2V0IG9mIGF1ZGlvIGZlYXR1cmVzIGZvciB0aGUgYnVmZmVyLiBZb3UgY2FuIGNhbGN1bGF0ZSBob3cgbWFueVxuICAgKiBzZXRzIG9mIGF1ZGlvIGZlYXR1cmVzIE1leWRhIHdpbGwgb3V0cHV0IHBlciBzZWNvbmQgYnkgZGl2aWRpbmcgdGhlXG4gICAqIGJ1ZmZlciBzaXplIGJ5IHRoZSBzYW1wbGUgcmF0ZS4gSWYgeW91J3JlIHVzaW5nIE1leWRhIGZvciB2aXN1YWxpc2F0aW9uLFxuICAgKiBtYWtlIHN1cmUgdGhhdCB5b3UncmUgY29sbGVjdGluZyBhdWRpbyBmZWF0dXJlcyBhdCBhIHJhdGUgdGhhdCdzIGZhc3RlclxuICAgKiB0aGFuIG9yIGVxdWFsIHRvIHRoZSB2aWRlbyBmcmFtZSByYXRlIHlvdSBleHBlY3QuXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAqL1xuICBidWZmZXJTaXplOiA1MTIsXG5cbiAgLyoqXG4gICAqIFRoZSBudW1iZXIgb2Ygc2FtcGxlcyBwZXIgc2Vjb25kIG9mIHRoZSBpbmNvbWluZyBhdWRpby4gVGhpcyBhZmZlY3RzXG4gICAqIGZlYXR1cmUgZXh0cmFjdGlvbiBvdXRzaWRlIG9mIHRoZSBjb250ZXh0IG9mIHRoZSBXZWIgQXVkaW8gQVBJLCBhbmQgbXVzdCBiZVxuICAgKiBzZXQgYWNjdXJhdGVseSAtIG90aGVyd2lzZSBjYWxjdWxhdGlvbnMgd2lsbCBiZSBvZmYuXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAbWVtYmVyIHtudW1iZXJ9XG4gICAqL1xuICBzYW1wbGVSYXRlOiA0NDEwMCxcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBNZWwgYmFuZHMgdG8gdXNlIGluIHRoZSBNZWwgRnJlcXVlbmN5IENlcHN0cmFsIENvLWVmZmljaWVudHNcbiAgICogZmVhdHVyZSBleHRyYWN0b3JcbiAgICogQGluc3RhbmNlXG4gICAqIEBtZW1iZXIge251bWJlcn1cbiAgICovXG4gIG1lbEJhbmRzOiAyNixcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBiYW5kcyB0byBkaXZpZGUgdGhlIHNwZWN0cnVtIGludG8gZm9yIHRoZSBDaHJvbWEgZmVhdHVyZVxuICAgKiBleHRyYWN0b3IuIDEyIGlzIHRoZSBzdGFuZGFyZCBudW1iZXIgb2Ygc2VtaXRvbmVzIHBlciBvY3RhdmUgaW4gdGhlIHdlc3Rlcm5cbiAgICogbXVzaWMgdHJhZGl0aW9uLCBidXQgTWV5ZGEgY2FuIHVzZSBhbiBhcmJpdHJhcnkgbnVtYmVyIG9mIGJhbmRzLCB3aGljaFxuICAgKiBjYW4gYmUgdXNlZnVsIGZvciBtaWNyb3RvbmFsIG11c2ljLlxuICAgKiBAaW5zdGFuY2VcbiAgICogQG1lbWJlciB7bnVtYmVyfVxuICAgKi9cbiAgY2hyb21hQmFuZHM6IDEyLFxuXG4gIC8qKlxuICAgKiBBIGZ1bmN0aW9uIHlvdSBjYW4gcHJvdmlkZSB0aGF0IHdpbGwgYmUgY2FsbGVkIGZvciBlYWNoIGJ1ZmZlciB0aGF0IE1leWRhXG4gICAqIHJlY2VpdmVzIGZyb20gaXRzIHNvdXJjZSBub2RlXG4gICAqIEBpbnN0YW5jZVxuICAgKiBAbWVtYmVyIHtGdW5jdGlvbn1cbiAgICovXG4gIGNhbGxiYWNrOiBudWxsLFxuXG4gIC8qKlxuICAgKiBTcGVjaWZ5IHRoZSB3aW5kb3dpbmcgZnVuY3Rpb24gdG8gYXBwbHkgdG8gdGhlIGJ1ZmZlciBiZWZvcmUgdGhlXG4gICAqIHRyYW5zZm9ybWF0aW9uIGZyb20gdGhlIHRpbWUgZG9tYWluIHRvIHRoZSBmcmVxdWVuY3kgZG9tYWluIGlzIHBlcmZvcm1lZFxuICAgKiBAaW5zdGFuY2VcbiAgICogQG1lbWJlciB7c3RyaW5nfVxuICAgKi9cbiAgd2luZG93aW5nRnVuY3Rpb246ICdoYW5uaW5nJyxcblxuICAvKipcbiAgICogQG1lbWJlciB7b2JqZWN0fVxuICAgKi9cbiAgZmVhdHVyZUV4dHJhY3RvcnM6IF9mZWF0dXJlRXh0cmFjdG9yc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fLFxuICBFWFRSQUNUSU9OX1NUQVJURUQ6IGZhbHNlLFxuICBudW1iZXJPZk1GQ0NDb2VmZmljaWVudHM6IDEzLFxuICBfZmVhdHVyZXNUb0V4dHJhY3Q6IFtdLFxuICB3aW5kb3dpbmc6IF91dGlsaXRpZXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfX1tcImFwcGx5V2luZG93XCJdLFxuICBfZXJyb3JzOiB7XG4gICAgbm90UG93MjogbmV3IEVycm9yKCdNZXlkYTogQnVmZmVyIHNpemUgbXVzdCBiZSBhIHBvd2VyIG9mIDIsIGUuZy4gNjQgb3IgNTEyJyksXG4gICAgZmVhdHVyZVVuZGVmOiBuZXcgRXJyb3IoJ01leWRhOiBObyBmZWF0dXJlcyBkZWZpbmVkLicpLFxuICAgIGludmFsaWRGZWF0dXJlRm10OiBuZXcgRXJyb3IoJ01leWRhOiBJbnZhbGlkIGZlYXR1cmUgZm9ybWF0JyksXG4gICAgaW52YWxpZElucHV0OiBuZXcgRXJyb3IoJ01leWRhOiBJbnZhbGlkIGlucHV0LicpLFxuICAgIG5vQUM6IG5ldyBFcnJvcignTWV5ZGE6IE5vIEF1ZGlvQ29udGV4dCBzcGVjaWZpZWQuJyksXG4gICAgbm9Tb3VyY2U6IG5ldyBFcnJvcignTWV5ZGE6IE5vIHNvdXJjZSBub2RlIHNwZWNpZmllZC4nKVxuICB9LFxuXG4gIC8qKlxuICAgKiBAc3VtbWFyeVxuICAgKiBDcmVhdGUgYSBNZXlkYUFuYWx5emVyXG4gICAqXG4gICAqIEEgZmFjdG9yeSBmdW5jdGlvbiBmb3IgY3JlYXRpbmcgYSBNZXlkYUFuYWx5emVyLCB0aGUgaW50ZXJmYWNlIGZvciB1c2luZ1xuICAgKiBNZXlkYSBpbiB0aGUgY29udGV4dCBvZiBXZWIgQXVkaW8uXG4gICAqXG4gICAqIEBtZXRob2RcbiAgICogQHBhcmFtIHtNZXlkYU9wdGlvbnN9IG9wdGlvbnMgT3B0aW9ucyAtIGFuIG9iamVjdCBjb250YWluaW5nIGNvbmZpZ3VyYXRpb25cbiAgICogQHJldHVybnMge01leWRhQW5hbHl6ZXJ9XG4gICAqIEBleGFtcGxlXG4gICAqIGNvbnN0IGFuYWx5emVyID0gTWV5ZGEuY3JlYXRlTWV5ZGFBbmFseXplcih7XG4gICAqICAgXCJhdWRpb0NvbnRleHRcIjogYXVkaW9Db250ZXh0LFxuICAgKiAgIFwic291cmNlXCI6IHNvdXJjZSxcbiAgICogICBcImJ1ZmZlclNpemVcIjogNTEyLFxuICAgKiAgIFwiZmVhdHVyZUV4dHJhY3RvcnNcIjogW1wicm1zXCJdLFxuICAgKiAgIFwiaW5wdXRzXCI6IDIsXG4gICAqICAgXCJjYWxsYmFja1wiOiBmZWF0dXJlcyA9PiB7XG4gICAqICAgICBsZXZlbFJhbmdlRWxlbWVudC52YWx1ZSA9IGZlYXR1cmVzLnJtcztcbiAgICogICB9XG4gICAqIH0pO1xuICAgKi9cbiAgY3JlYXRlTWV5ZGFBbmFseXplcjogZnVuY3Rpb24gY3JlYXRlTWV5ZGFBbmFseXplcihvcHRpb25zKSB7XG4gICAgcmV0dXJuIG5ldyBfbWV5ZGFfd2FfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzNfX1tcIk1leWRhQW5hbHl6ZXJcIl0ob3B0aW9ucywgTWV5ZGEpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBFeHRyYWN0IGFuIGF1ZGlvIGZlYXR1cmUgZnJvbSBhIGJ1ZmZlclxuICAgKiBAZnVuY3Rpb25cbiAgICogQHBhcmFtIHsoc3RyaW5nfEFycmF5LjxzdHJpbmc+KX0gZmVhdHVyZSAtIHRoZSBmZWF0dXJlIHlvdSB3YW50IHRvIGV4dHJhY3RcbiAgICogQHBhcmFtIHtBcnJheS48bnVtYmVyPn0gc2lnbmFsXG4gICAqIEFuIGFycmF5IG9mIG51bWJlcnMgdGhhdCByZXByZXNlbnRzIHRoZSBzaWduYWwuIEl0IHNob3VsZCBiZSBvZiBsZW5ndGhcbiAgICogYG1leWRhLmJ1ZmZlclNpemVgXG4gICAqIEBwYXJhbSB7QXJyYXkuPG51bWJlcj59IFtwcmV2aW91c1NpZ25hbF0gLSB0aGUgcHJldmlvdXMgYnVmZmVyXG4gICAqIEByZXR1cm5zIHtvYmplY3R9IEZlYXR1cmVzXG4gICAqIEBleGFtcGxlXG4gICAqIG1leWRhLmJ1ZmZlclNpemUgPSAyMDQ4O1xuICAgKiBjb25zdCBmZWF0dXJlcyA9IG1leWRhLmV4dHJhY3QoWyd6Y3InLCAnc3BlY3RyYWxDZW50cm9pZCddLCBzaWduYWwpO1xuICAgKi9cbiAgZXh0cmFjdDogZnVuY3Rpb24gZXh0cmFjdChmZWF0dXJlLCBzaWduYWwsIHByZXZpb3VzU2lnbmFsKSB7XG4gICAgdmFyIF90aGlzID0gdGhpcztcblxuICAgIGlmICghc2lnbmFsKSB0aHJvdyB0aGlzLl9lcnJvcnMuaW52YWxpZElucHV0O2Vsc2UgaWYgKF90eXBlb2Yoc2lnbmFsKSAhPSAnb2JqZWN0JykgdGhyb3cgdGhpcy5fZXJyb3JzLmludmFsaWRJbnB1dDtlbHNlIGlmICghZmVhdHVyZSkgdGhyb3cgdGhpcy5fZXJyb3JzLmZlYXR1cmVVbmRlZjtlbHNlIGlmICghX3V0aWxpdGllc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fW1wiaXNQb3dlck9mVHdvXCJdKHNpZ25hbC5sZW5ndGgpKSB0aHJvdyB0aGlzLl9lcnJvcnMubm90UG93MjtcblxuICAgIGlmICh0eXBlb2YgdGhpcy5iYXJrU2NhbGUgPT0gJ3VuZGVmaW5lZCcgfHwgdGhpcy5iYXJrU2NhbGUubGVuZ3RoICE9IHRoaXMuYnVmZmVyU2l6ZSkge1xuICAgICAgdGhpcy5iYXJrU2NhbGUgPSBfdXRpbGl0aWVzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJjcmVhdGVCYXJrU2NhbGVcIl0odGhpcy5idWZmZXJTaXplLCB0aGlzLnNhbXBsZVJhdGUsIHRoaXMuYnVmZmVyU2l6ZSk7XG4gICAgfSAvLyBSZWNhbGN1bGF0ZSBtZWwgYmFuayBpZiBidWZmZXIgbGVuZ3RoIGNoYW5nZWRcblxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLm1lbEZpbHRlckJhbmsgPT0gJ3VuZGVmaW5lZCcgfHwgdGhpcy5iYXJrU2NhbGUubGVuZ3RoICE9IHRoaXMuYnVmZmVyU2l6ZSB8fCB0aGlzLm1lbEZpbHRlckJhbmsubGVuZ3RoICE9IHRoaXMubWVsQmFuZHMpIHtcbiAgICAgIHRoaXMubWVsRmlsdGVyQmFuayA9IF91dGlsaXRpZXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfX1tcImNyZWF0ZU1lbEZpbHRlckJhbmtcIl0oTWF0aC5tYXgodGhpcy5tZWxCYW5kcywgdGhpcy5udW1iZXJPZk1GQ0NDb2VmZmljaWVudHMpLCB0aGlzLnNhbXBsZVJhdGUsIHRoaXMuYnVmZmVyU2l6ZSk7XG4gICAgfSAvLyBSZWNhbGN1bGF0ZSBjaHJvbWEgYmFuayBpZiBidWZmZXIgbGVuZ3RoIGNoYW5nZWRcblxuXG4gICAgaWYgKHR5cGVvZiB0aGlzLmNocm9tYUZpbHRlckJhbmsgPT0gJ3VuZGVmaW5lZCcgfHwgdGhpcy5jaHJvbWFGaWx0ZXJCYW5rLmxlbmd0aCAhPSB0aGlzLmNocm9tYUJhbmRzKSB7XG4gICAgICB0aGlzLmNocm9tYUZpbHRlckJhbmsgPSBfdXRpbGl0aWVzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJjcmVhdGVDaHJvbWFGaWx0ZXJCYW5rXCJdKHRoaXMuY2hyb21hQmFuZHMsIHRoaXMuc2FtcGxlUmF0ZSwgdGhpcy5idWZmZXJTaXplKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHNpZ25hbC5idWZmZXIgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vc2lnbmFsIGlzIGEgbm9ybWFsIGFycmF5LCBjb252ZXJ0IHRvIEYzMkFcbiAgICAgIHRoaXMuc2lnbmFsID0gX3V0aWxpdGllc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fW1wiYXJyYXlUb1R5cGVkXCJdKHNpZ25hbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2lnbmFsID0gc2lnbmFsO1xuICAgIH1cblxuICAgIHZhciBwcmVwYXJlZFNpZ25hbCA9IHByZXBhcmVTaWduYWxXaXRoU3BlY3RydW0oc2lnbmFsLCB0aGlzLndpbmRvd2luZ0Z1bmN0aW9uLCB0aGlzLmJ1ZmZlclNpemUpO1xuICAgIHRoaXMuc2lnbmFsID0gcHJlcGFyZWRTaWduYWwud2luZG93ZWRTaWduYWw7XG4gICAgdGhpcy5jb21wbGV4U3BlY3RydW0gPSBwcmVwYXJlZFNpZ25hbC5jb21wbGV4U3BlY3RydW07XG4gICAgdGhpcy5hbXBTcGVjdHJ1bSA9IHByZXBhcmVkU2lnbmFsLmFtcFNwZWN0cnVtO1xuXG4gICAgaWYgKHByZXZpb3VzU2lnbmFsKSB7XG4gICAgICB2YXIgX3ByZXBhcmVkU2lnbmFsID0gcHJlcGFyZVNpZ25hbFdpdGhTcGVjdHJ1bShwcmV2aW91c1NpZ25hbCwgdGhpcy53aW5kb3dpbmdGdW5jdGlvbiwgdGhpcy5idWZmZXJTaXplKTtcblxuICAgICAgdGhpcy5wcmV2aW91c1NpZ25hbCA9IF9wcmVwYXJlZFNpZ25hbC53aW5kb3dlZFNpZ25hbDtcbiAgICAgIHRoaXMucHJldmlvdXNDb21wbGV4U3BlY3RydW0gPSBfcHJlcGFyZWRTaWduYWwuY29tcGxleFNwZWN0cnVtO1xuICAgICAgdGhpcy5wcmV2aW91c0FtcFNwZWN0cnVtID0gX3ByZXBhcmVkU2lnbmFsLmFtcFNwZWN0cnVtO1xuICAgIH1cblxuICAgIHZhciBleHRyYWN0ID0gZnVuY3Rpb24gZXh0cmFjdChmZWF0dXJlKSB7XG4gICAgICByZXR1cm4gX3RoaXMuZmVhdHVyZUV4dHJhY3RvcnNbZmVhdHVyZV0oe1xuICAgICAgICBhbXBTcGVjdHJ1bTogX3RoaXMuYW1wU3BlY3RydW0sXG4gICAgICAgIGNocm9tYUZpbHRlckJhbms6IF90aGlzLmNocm9tYUZpbHRlckJhbmssXG4gICAgICAgIGNvbXBsZXhTcGVjdHJ1bTogX3RoaXMuY29tcGxleFNwZWN0cnVtLFxuICAgICAgICBzaWduYWw6IF90aGlzLnNpZ25hbCxcbiAgICAgICAgYnVmZmVyU2l6ZTogX3RoaXMuYnVmZmVyU2l6ZSxcbiAgICAgICAgc2FtcGxlUmF0ZTogX3RoaXMuc2FtcGxlUmF0ZSxcbiAgICAgICAgYmFya1NjYWxlOiBfdGhpcy5iYXJrU2NhbGUsXG4gICAgICAgIG1lbEZpbHRlckJhbms6IF90aGlzLm1lbEZpbHRlckJhbmssXG4gICAgICAgIHByZXZpb3VzU2lnbmFsOiBfdGhpcy5wcmV2aW91c1NpZ25hbCxcbiAgICAgICAgcHJldmlvdXNBbXBTcGVjdHJ1bTogX3RoaXMucHJldmlvdXNBbXBTcGVjdHJ1bSxcbiAgICAgICAgcHJldmlvdXNDb21wbGV4U3BlY3RydW06IF90aGlzLnByZXZpb3VzQ29tcGxleFNwZWN0cnVtLFxuICAgICAgICBudW1iZXJPZk1GQ0NDb2VmZmljaWVudHM6IF90aGlzLm51bWJlck9mTUZDQ0NvZWZmaWNpZW50c1xuICAgICAgfSk7XG4gICAgfTtcblxuICAgIGlmIChfdHlwZW9mKGZlYXR1cmUpID09PSAnb2JqZWN0Jykge1xuICAgICAgcmV0dXJuIGZlYXR1cmUucmVkdWNlKGZ1bmN0aW9uIChhY2MsIGVsKSB7XG4gICAgICAgIHJldHVybiBPYmplY3QuYXNzaWduKHt9LCBhY2MsIF9kZWZpbmVQcm9wZXJ0eSh7fSwgZWwsIGV4dHJhY3QoZWwpKSk7XG4gICAgICB9LCB7fSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZmVhdHVyZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJldHVybiBleHRyYWN0KGZlYXR1cmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyB0aGlzLl9lcnJvcnMuaW52YWxpZEZlYXR1cmVGbXQ7XG4gICAgfVxuICB9XG59O1xuXG52YXIgcHJlcGFyZVNpZ25hbFdpdGhTcGVjdHJ1bSA9IGZ1bmN0aW9uIHByZXBhcmVTaWduYWxXaXRoU3BlY3RydW0oc2lnbmFsLCB3aW5kb3dpbmdGdW5jdGlvbiwgYnVmZmVyU2l6ZSkge1xuICB2YXIgcHJlcGFyZWRTaWduYWwgPSB7fTtcblxuICBpZiAodHlwZW9mIHNpZ25hbC5idWZmZXIgPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAvL3NpZ25hbCBpcyBhIG5vcm1hbCBhcnJheSwgY29udmVydCB0byBGMzJBXG4gICAgcHJlcGFyZWRTaWduYWwuc2lnbmFsID0gX3V0aWxpdGllc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fW1wiYXJyYXlUb1R5cGVkXCJdKHNpZ25hbCk7XG4gIH0gZWxzZSB7XG4gICAgcHJlcGFyZWRTaWduYWwuc2lnbmFsID0gc2lnbmFsO1xuICB9XG5cbiAgcHJlcGFyZWRTaWduYWwud2luZG93ZWRTaWduYWwgPSBfdXRpbGl0aWVzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJhcHBseVdpbmRvd1wiXShwcmVwYXJlZFNpZ25hbC5zaWduYWwsIHdpbmRvd2luZ0Z1bmN0aW9uKTtcbiAgcHJlcGFyZWRTaWduYWwuY29tcGxleFNwZWN0cnVtID0gT2JqZWN0KGZmdGpzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8yX19bXCJmZnRcIl0pKHByZXBhcmVkU2lnbmFsLndpbmRvd2VkU2lnbmFsKTtcbiAgcHJlcGFyZWRTaWduYWwuYW1wU3BlY3RydW0gPSBuZXcgRmxvYXQzMkFycmF5KGJ1ZmZlclNpemUgLyAyKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGJ1ZmZlclNpemUgLyAyOyBpKyspIHtcbiAgICBwcmVwYXJlZFNpZ25hbC5hbXBTcGVjdHJ1bVtpXSA9IE1hdGguc3FydChNYXRoLnBvdyhwcmVwYXJlZFNpZ25hbC5jb21wbGV4U3BlY3RydW0ucmVhbFtpXSwgMikgKyBNYXRoLnBvdyhwcmVwYXJlZFNpZ25hbC5jb21wbGV4U3BlY3RydW0uaW1hZ1tpXSwgMikpO1xuICB9XG5cbiAgcmV0dXJuIHByZXBhcmVkU2lnbmFsO1xufTtcbi8qKlxuICogVGhlIE1leWRhIGNsYXNzXG4gKiBAdHlwZSB7TWV5ZGF9XG4gKi9cblxuXG4vKiBoYXJtb255IGRlZmF1bHQgZXhwb3J0ICovIF9fd2VicGFja19leHBvcnRzX19bXCJkZWZhdWx0XCJdID0gKE1leWRhKTtcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykgd2luZG93Lk1leWRhID0gTWV5ZGE7XG5cbi8qKiovIH0pLFxuXG4vKioqLyBcIi4vc3JjL21leWRhLXdhLmpzXCI6XG4vKiEqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vc3JjL21leWRhLXdhLmpzICoqKiFcbiAgXFwqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyohIGV4cG9ydHMgcHJvdmlkZWQ6IE1leWRhQW5hbHl6ZXIgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAoYmluZGluZykgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwiTWV5ZGFBbmFseXplclwiLCBmdW5jdGlvbigpIHsgcmV0dXJuIE1leWRhQW5hbHl6ZXI7IH0pO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF91dGlsaXRpZXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfXyA9IF9fd2VicGFja19yZXF1aXJlX18oLyohIC4vdXRpbGl0aWVzICovIFwiLi9zcmMvdXRpbGl0aWVzLmpzXCIpO1xuLyogaGFybW9ueSBpbXBvcnQgKi8gdmFyIF9mZWF0dXJlRXh0cmFjdG9yc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fID0gX193ZWJwYWNrX3JlcXVpcmVfXygvKiEgLi9mZWF0dXJlRXh0cmFjdG9ycyAqLyBcIi4vc3JjL2ZlYXR1cmVFeHRyYWN0b3JzLmpzXCIpO1xuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQ2Fubm90IGNhbGwgYSBjbGFzcyBhcyBhIGZ1bmN0aW9uXCIpOyB9IH1cblxuZnVuY3Rpb24gX2RlZmluZVByb3BlcnRpZXModGFyZ2V0LCBwcm9wcykgeyBmb3IgKHZhciBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7IHZhciBkZXNjcmlwdG9yID0gcHJvcHNbaV07IGRlc2NyaXB0b3IuZW51bWVyYWJsZSA9IGRlc2NyaXB0b3IuZW51bWVyYWJsZSB8fCBmYWxzZTsgZGVzY3JpcHRvci5jb25maWd1cmFibGUgPSB0cnVlOyBpZiAoXCJ2YWx1ZVwiIGluIGRlc2NyaXB0b3IpIGRlc2NyaXB0b3Iud3JpdGFibGUgPSB0cnVlOyBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBkZXNjcmlwdG9yLmtleSwgZGVzY3JpcHRvcik7IH0gfVxuXG5mdW5jdGlvbiBfY3JlYXRlQ2xhc3MoQ29uc3RydWN0b3IsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7IGlmIChwcm90b1Byb3BzKSBfZGVmaW5lUHJvcGVydGllcyhDb25zdHJ1Y3Rvci5wcm90b3R5cGUsIHByb3RvUHJvcHMpOyBpZiAoc3RhdGljUHJvcHMpIF9kZWZpbmVQcm9wZXJ0aWVzKENvbnN0cnVjdG9yLCBzdGF0aWNQcm9wcyk7IHJldHVybiBDb25zdHJ1Y3RvcjsgfVxuXG5cblxuLyoqXG4gICogTWV5ZGFBbmFseXplclxuICAqIEBjbGFzc2Rlc2NcbiAgKiBNZXlkYSdzIGludGVyZmFjZSB0byB0aGUgV2ViIEF1ZGlvIEFQSS4gTWV5ZGFBbmFseXplciBhYnN0cmFjdHMgYW4gQVBJIG9uXG4gICogdG9wIG9mIHRoZSBXZWIgQXVkaW8gQVBJJ3MgU2NyaXB0UHJvY2Vzc29yTm9kZSwgcnVubmluZyB0aGUgTWV5ZGEgYXVkaW9cbiAgKiBmZWF0dXJlIGV4dHJhY3RvcnMgaW5zaWRlIHRoYXQgY29udGV4dC5cbiAgKlxuICAqIE1leWRhQW5hbHl6ZXIncyBjb25zdHJ1Y3RvciBzaG91bGQgbm90IGJlIGNhbGxlZCBkaXJlY3RseSAtIE1leWRhQW5hbHl6ZXJcbiAgKiBvYmplY3RzIHNob3VsZCBiZSBnZW5lcmF0ZWQgdXNpbmcgdGhlIHtAbGluayBNZXlkYS5jcmVhdGVNZXlkYUFuYWx5emVyfVxuICAqIGZhY3RvcnkgZnVuY3Rpb24gaW4gdGhlIG1haW4gTWV5ZGEgY2xhc3MuXG4gICpcbiAgKiBAZXhhbXBsZVxuICAqIGNvbnN0IGFuYWx5emVyID0gTWV5ZGEuY3JlYXRlTWV5ZGFBbmFseXplcih7XG4gICogICBcImF1ZGlvQ29udGV4dFwiOiBhdWRpb0NvbnRleHQsXG4gICogICBcInNvdXJjZVwiOiBzb3VyY2UsXG4gICogICBcImJ1ZmZlclNpemVcIjogNTEyLFxuICAqICAgXCJmZWF0dXJlRXh0cmFjdG9yc1wiOiBbXCJybXNcIl0sXG4gICogICBcImlucHV0c1wiOiAyLFxuICAqICAgXCJjYWxsYmFja1wiOiBmZWF0dXJlcyA9PiB7XG4gICogICAgIGxldmVsUmFuZ2VFbGVtZW50LnZhbHVlID0gZmVhdHVyZXMucm1zO1xuICAqICAgfVxuICAqIH0pO1xuICAqIEBoaWRlY29uc3RydWN0b3JcbiAgKi9cblxudmFyIE1leWRhQW5hbHl6ZXIgPVxuLyojX19QVVJFX18qL1xuZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBNZXlkYUFuYWx5emVyKG9wdGlvbnMsIF90aGlzKSB7XG4gICAgdmFyIF90aGlzMiA9IHRoaXM7XG5cbiAgICBfY2xhc3NDYWxsQ2hlY2sodGhpcywgTWV5ZGFBbmFseXplcik7XG5cbiAgICB0aGlzLl9tID0gX3RoaXM7XG5cbiAgICBpZiAoIW9wdGlvbnMuYXVkaW9Db250ZXh0KSB7XG4gICAgICB0aHJvdyB0aGlzLl9tLmVycm9ycy5ub0FDO1xuICAgIH0gZWxzZSBpZiAob3B0aW9ucy5idWZmZXJTaXplICYmICFfdXRpbGl0aWVzX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX19bXCJpc1Bvd2VyT2ZUd29cIl0ob3B0aW9ucy5idWZmZXJTaXplKSkge1xuICAgICAgdGhyb3cgdGhpcy5fbS5fZXJyb3JzLm5vdFBvdzI7XG4gICAgfSBlbHNlIGlmICghb3B0aW9ucy5zb3VyY2UpIHtcbiAgICAgIHRocm93IHRoaXMuX20uX2Vycm9ycy5ub1NvdXJjZTtcbiAgICB9XG5cbiAgICB0aGlzLl9tLmF1ZGlvQ29udGV4dCA9IG9wdGlvbnMuYXVkaW9Db250ZXh0OyAvLyBUT0RPOiB2YWxpZGF0ZSBvcHRpb25zXG5cbiAgICB0aGlzLl9tLmJ1ZmZlclNpemUgPSBvcHRpb25zLmJ1ZmZlclNpemUgfHwgdGhpcy5fbS5idWZmZXJTaXplIHx8IDI1NjtcbiAgICB0aGlzLl9tLmhvcFNpemUgPSBvcHRpb25zLmhvcFNpemUgfHwgdGhpcy5fbS5ob3BTaXplIHx8IHRoaXMuX20uYnVmZmVyU2l6ZTtcbiAgICB0aGlzLl9tLnNhbXBsZVJhdGUgPSBvcHRpb25zLnNhbXBsZVJhdGUgfHwgdGhpcy5fbS5hdWRpb0NvbnRleHQuc2FtcGxlUmF0ZSB8fCA0NDEwMDtcbiAgICB0aGlzLl9tLmNhbGxiYWNrID0gb3B0aW9ucy5jYWxsYmFjaztcbiAgICB0aGlzLl9tLndpbmRvd2luZ0Z1bmN0aW9uID0gb3B0aW9ucy53aW5kb3dpbmdGdW5jdGlvbiB8fCAnaGFubmluZyc7XG4gICAgdGhpcy5fbS5mZWF0dXJlRXh0cmFjdG9ycyA9IF9mZWF0dXJlRXh0cmFjdG9yc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMV9fO1xuICAgIHRoaXMuX20uRVhUUkFDVElPTl9TVEFSVEVEID0gb3B0aW9ucy5zdGFydEltbWVkaWF0ZWx5IHx8IGZhbHNlOyAvL2NyZWF0ZSBub2Rlc1xuXG4gICAgdGhpcy5fbS5zcG4gPSB0aGlzLl9tLmF1ZGlvQ29udGV4dC5jcmVhdGVTY3JpcHRQcm9jZXNzb3IodGhpcy5fbS5idWZmZXJTaXplLCAxLCAxKTtcblxuICAgIHRoaXMuX20uc3BuLmNvbm5lY3QodGhpcy5fbS5hdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xuXG4gICAgdGhpcy5fbS5fZmVhdHVyZXNUb0V4dHJhY3QgPSBvcHRpb25zLmZlYXR1cmVFeHRyYWN0b3JzIHx8IFtdOyAvL2Fsd2F5cyByZWNhbGN1bGF0ZSBCUyBhbmQgTUZCIHdoZW4gYSBuZXcgTWV5ZGEgYW5hbHl6ZXIgaXMgY3JlYXRlZC5cblxuICAgIHRoaXMuX20uYmFya1NjYWxlID0gX3V0aWxpdGllc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fW1wiY3JlYXRlQmFya1NjYWxlXCJdKHRoaXMuX20uYnVmZmVyU2l6ZSwgdGhpcy5fbS5zYW1wbGVSYXRlLCB0aGlzLl9tLmJ1ZmZlclNpemUpO1xuICAgIHRoaXMuX20ubWVsRmlsdGVyQmFuayA9IF91dGlsaXRpZXNfX1dFQlBBQ0tfSU1QT1JURURfTU9EVUxFXzBfX1tcImNyZWF0ZU1lbEZpbHRlckJhbmtcIl0odGhpcy5fbS5tZWxCYW5kcywgdGhpcy5fbS5zYW1wbGVSYXRlLCB0aGlzLl9tLmJ1ZmZlclNpemUpO1xuICAgIHRoaXMuX20uaW5wdXREYXRhID0gbnVsbDtcbiAgICB0aGlzLl9tLnByZXZpb3VzSW5wdXREYXRhID0gbnVsbDtcbiAgICB0aGlzLl9tLmZyYW1lID0gbnVsbDtcbiAgICB0aGlzLl9tLnByZXZpb3VzRnJhbWUgPSBudWxsO1xuICAgIHRoaXMuc2V0U291cmNlKG9wdGlvbnMuc291cmNlKTtcblxuICAgIHRoaXMuX20uc3BuLm9uYXVkaW9wcm9jZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgIGlmIChfdGhpczIuX20uaW5wdXREYXRhICE9PSBudWxsKSB7XG4gICAgICAgIF90aGlzMi5fbS5wcmV2aW91c0lucHV0RGF0YSA9IF90aGlzMi5fbS5pbnB1dERhdGE7XG4gICAgICB9XG5cbiAgICAgIF90aGlzMi5fbS5pbnB1dERhdGEgPSBlLmlucHV0QnVmZmVyLmdldENoYW5uZWxEYXRhKDApO1xuXG4gICAgICBpZiAoIV90aGlzMi5fbS5wcmV2aW91c0lucHV0RGF0YSkge1xuICAgICAgICB2YXIgYnVmZmVyID0gX3RoaXMyLl9tLmlucHV0RGF0YTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBidWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KF90aGlzMi5fbS5wcmV2aW91c0lucHV0RGF0YS5sZW5ndGggKyBfdGhpczIuX20uaW5wdXREYXRhLmxlbmd0aCAtIF90aGlzMi5fbS5ob3BTaXplKTtcbiAgICAgICAgYnVmZmVyLnNldChfdGhpczIuX20ucHJldmlvdXNJbnB1dERhdGEuc2xpY2UoX3RoaXMyLl9tLmhvcFNpemUpKTtcbiAgICAgICAgYnVmZmVyLnNldChfdGhpczIuX20uaW5wdXREYXRhLCBfdGhpczIuX20ucHJldmlvdXNJbnB1dERhdGEubGVuZ3RoIC0gX3RoaXMyLl9tLmhvcFNpemUpO1xuICAgICAgfVxuXG4gICAgICA7XG4gICAgICB2YXIgZnJhbWVzID0gX3V0aWxpdGllc19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fW1wiZnJhbWVcIl0oYnVmZmVyLCBfdGhpczIuX20uYnVmZmVyU2l6ZSwgX3RoaXMyLl9tLmhvcFNpemUpO1xuICAgICAgZnJhbWVzLmZvckVhY2goZnVuY3Rpb24gKGYpIHtcbiAgICAgICAgX3RoaXMyLl9tLmZyYW1lID0gZjtcblxuICAgICAgICB2YXIgZmVhdHVyZXMgPSBfdGhpczIuX20uZXh0cmFjdChfdGhpczIuX20uX2ZlYXR1cmVzVG9FeHRyYWN0LCBfdGhpczIuX20uZnJhbWUsIF90aGlzMi5fbS5wcmV2aW91c0ZyYW1lKTsgLy8gY2FsbCBjYWxsYmFjayBpZiBhcHBsaWNhYmxlXG5cblxuICAgICAgICBpZiAodHlwZW9mIF90aGlzMi5fbS5jYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJyAmJiBfdGhpczIuX20uRVhUUkFDVElPTl9TVEFSVEVEKSB7XG4gICAgICAgICAgX3RoaXMyLl9tLmNhbGxiYWNrKGZlYXR1cmVzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF90aGlzMi5fbS5wcmV2aW91c0ZyYW1lID0gX3RoaXMyLl9tLmZyYW1lO1xuICAgICAgfSk7XG4gICAgfTtcbiAgfVxuICAvKipcbiAgICogU3RhcnQgZmVhdHVyZSBleHRyYWN0aW9uXG4gICAqIFRoZSBhdWRpbyBmZWF0dXJlcyB3aWxsIGJlIHBhc3NlZCB0byB0aGUgY2FsbGJhY2sgZnVuY3Rpb24gdGhhdCB3YXMgZGVmaW5lZFxuICAgKiBpbiB0aGUgTWV5ZGFPcHRpb25zIHRoYXQgd2VyZSBwYXNzZWQgdG8gdGhlIGZhY3Rvcnkgd2hlbiBjb25zdHJ1Y3RpbmcgdGhlXG4gICAqIE1leWRhQW5hbHl6ZXIuXG4gICAqIEBwYXJhbSB7KHN0cmluZ3xBcnJheS48c3RyaW5nPil9IFtmZWF0dXJlc11cbiAgICogQ2hhbmdlIHRoZSBmZWF0dXJlcyB0aGF0IE1leWRhIGlzIGV4dHJhY3RpbmcuIERlZmF1bHRzIHRvIHRoZSBmZWF0dXJlcyB0aGF0XG4gICAqIHdlcmUgc2V0IHVwb24gY29uc3RydWN0aW9uIGluIHRoZSBvcHRpb25zIHBhcmFtZXRlci5cbiAgICogQGV4YW1wbGVcbiAgICogYW5hbHl6ZXIuc3RhcnQoJ2Nocm9tYScpO1xuICAgKi9cblxuXG4gIF9jcmVhdGVDbGFzcyhNZXlkYUFuYWx5emVyLCBbe1xuICAgIGtleTogXCJzdGFydFwiLFxuICAgIHZhbHVlOiBmdW5jdGlvbiBzdGFydChmZWF0dXJlcykge1xuICAgICAgdGhpcy5fbS5fZmVhdHVyZXNUb0V4dHJhY3QgPSBmZWF0dXJlcyB8fCB0aGlzLl9tLl9mZWF0dXJlc1RvRXh0cmFjdDtcbiAgICAgIHRoaXMuX20uRVhUUkFDVElPTl9TVEFSVEVEID0gdHJ1ZTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU3RvcCBmZWF0dXJlIGV4dHJhY3Rpb24uXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBhbmFseXplci5zdG9wKCk7XG4gICAgICovXG5cbiAgfSwge1xuICAgIGtleTogXCJzdG9wXCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICB0aGlzLl9tLkVYVFJBQ1RJT05fU1RBUlRFRCA9IGZhbHNlO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXQgdGhlIEF1ZGlvIE5vZGUgZm9yIE1leWRhIHRvIGxpc3RlbiB0by5cbiAgICAgKiBAcGFyYW0ge0F1ZGlvTm9kZX0gc291cmNlIC0gVGhlIEF1ZGlvIE5vZGUgZm9yIE1leWRhIHRvIGxpc3RlbiB0b1xuICAgICAqIEBleGFtcGxlXG4gICAgICogYW5hbHl6ZXIuc2V0U291cmNlKGF1ZGlvU291cmNlTm9kZSk7XG4gICAgICovXG5cbiAgfSwge1xuICAgIGtleTogXCJzZXRTb3VyY2VcIixcbiAgICB2YWx1ZTogZnVuY3Rpb24gc2V0U291cmNlKHNvdXJjZSkge1xuICAgICAgc291cmNlLmNvbm5lY3QodGhpcy5fbS5zcG4pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBHZXQgYSBzZXQgb2YgZmVhdHVyZXMgZnJvbSB0aGUgY3VycmVudCBmcmFtZS5cbiAgICAgKiBAcGFyYW0geyhzdHJpbmd8QXJyYXkuPHN0cmluZz4pfSBbZmVhdHVyZXNdXG4gICAgICogQ2hhbmdlIHRoZSBmZWF0dXJlcyB0aGF0IE1leWRhIGlzIGV4dHJhY3RpbmdcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGFuYWx5emVyLmdldCgnc3BlY3RyYWxGbGF0bmVzcycpO1xuICAgICAqL1xuXG4gIH0sIHtcbiAgICBrZXk6IFwiZ2V0XCIsXG4gICAgdmFsdWU6IGZ1bmN0aW9uIGdldChmZWF0dXJlcykge1xuICAgICAgaWYgKHRoaXMuX20uaW5wdXREYXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tLmV4dHJhY3QoZmVhdHVyZXMgfHwgdGhpcy5fbS5fZmVhdHVyZXNUb0V4dHJhY3QsIHRoaXMuX20uaW5wdXREYXRhLCB0aGlzLl9tLnByZXZpb3VzSW5wdXREYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgfV0pO1xuXG4gIHJldHVybiBNZXlkYUFuYWx5emVyO1xufSgpO1xuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL3NyYy91dGlsaXRpZXMuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vc3JjL3V0aWxpdGllcy5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgZXhwb3J0cyBwcm92aWRlZDogaXNQb3dlck9mVHdvLCBlcnJvciwgcG9pbnR3aXNlQnVmZmVyTXVsdCwgYXBwbHlXaW5kb3csIGNyZWF0ZUJhcmtTY2FsZSwgdHlwZWRUb0FycmF5LCBhcnJheVRvVHlwZWQsIF9ub3JtYWxpemUsIG5vcm1hbGl6ZSwgbm9ybWFsaXplVG9PbmUsIG1lYW4sIG1lbFRvRnJlcSwgZnJlcVRvTWVsLCBjcmVhdGVNZWxGaWx0ZXJCYW5rLCBoelRvT2N0YXZlcywgbm9ybWFsaXplQnlDb2x1bW4sIGNyZWF0ZUNocm9tYUZpbHRlckJhbmssIGZyYW1lICovXG4vKioqLyAoZnVuY3Rpb24obW9kdWxlLCBfX3dlYnBhY2tfZXhwb3J0c19fLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblwidXNlIHN0cmljdFwiO1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yKF9fd2VicGFja19leHBvcnRzX18pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcImlzUG93ZXJPZlR3b1wiLCBmdW5jdGlvbigpIHsgcmV0dXJuIGlzUG93ZXJPZlR3bzsgfSk7XG4vKiBoYXJtb255IGV4cG9ydCAoYmluZGluZykgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwiZXJyb3JcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBlcnJvcjsgfSk7XG4vKiBoYXJtb255IGV4cG9ydCAoYmluZGluZykgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwicG9pbnR3aXNlQnVmZmVyTXVsdFwiLCBmdW5jdGlvbigpIHsgcmV0dXJuIHBvaW50d2lzZUJ1ZmZlck11bHQ7IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcImFwcGx5V2luZG93XCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gYXBwbHlXaW5kb3c7IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcImNyZWF0ZUJhcmtTY2FsZVwiLCBmdW5jdGlvbigpIHsgcmV0dXJuIGNyZWF0ZUJhcmtTY2FsZTsgfSk7XG4vKiBoYXJtb255IGV4cG9ydCAoYmluZGluZykgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwidHlwZWRUb0FycmF5XCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gdHlwZWRUb0FycmF5OyB9KTtcbi8qIGhhcm1vbnkgZXhwb3J0IChiaW5kaW5nKSAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywgXCJhcnJheVRvVHlwZWRcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBhcnJheVRvVHlwZWQ7IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcIl9ub3JtYWxpemVcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBfbm9ybWFsaXplOyB9KTtcbi8qIGhhcm1vbnkgZXhwb3J0IChiaW5kaW5nKSAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywgXCJub3JtYWxpemVcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBub3JtYWxpemU7IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcIm5vcm1hbGl6ZVRvT25lXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gbm9ybWFsaXplVG9PbmU7IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcIm1lYW5cIiwgZnVuY3Rpb24oKSB7IHJldHVybiBtZWFuOyB9KTtcbi8qIGhhcm1vbnkgZXhwb3J0IChiaW5kaW5nKSAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywgXCJtZWxUb0ZyZXFcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBtZWxUb0ZyZXE7IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcImZyZXFUb01lbFwiLCBmdW5jdGlvbigpIHsgcmV0dXJuIGZyZXFUb01lbDsgfSk7XG4vKiBoYXJtb255IGV4cG9ydCAoYmluZGluZykgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwiY3JlYXRlTWVsRmlsdGVyQmFua1wiLCBmdW5jdGlvbigpIHsgcmV0dXJuIGNyZWF0ZU1lbEZpbHRlckJhbms7IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcImh6VG9PY3RhdmVzXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gaHpUb09jdGF2ZXM7IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcIm5vcm1hbGl6ZUJ5Q29sdW1uXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gbm9ybWFsaXplQnlDb2x1bW47IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcImNyZWF0ZUNocm9tYUZpbHRlckJhbmtcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBjcmVhdGVDaHJvbWFGaWx0ZXJCYW5rOyB9KTtcbi8qIGhhcm1vbnkgZXhwb3J0IChiaW5kaW5nKSAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywgXCJmcmFtZVwiLCBmdW5jdGlvbigpIHsgcmV0dXJuIGZyYW1lOyB9KTtcbi8qIGhhcm1vbnkgaW1wb3J0ICovIHZhciBfd2luZG93aW5nX19XRUJQQUNLX0lNUE9SVEVEX01PRFVMRV8wX18gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKC8qISAuL3dpbmRvd2luZyAqLyBcIi4vc3JjL3dpbmRvd2luZy5qc1wiKTtcbmZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheShhcnIpIHsgcmV0dXJuIF9hcnJheVdpdGhvdXRIb2xlcyhhcnIpIHx8IF9pdGVyYWJsZVRvQXJyYXkoYXJyKSB8fCBfbm9uSXRlcmFibGVTcHJlYWQoKTsgfVxuXG5mdW5jdGlvbiBfbm9uSXRlcmFibGVTcHJlYWQoKSB7IHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGF0dGVtcHQgdG8gc3ByZWFkIG5vbi1pdGVyYWJsZSBpbnN0YW5jZVwiKTsgfVxuXG5mdW5jdGlvbiBfaXRlcmFibGVUb0FycmF5KGl0ZXIpIHsgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoaXRlcikgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZXIpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSByZXR1cm4gQXJyYXkuZnJvbShpdGVyKTsgfVxuXG5mdW5jdGlvbiBfYXJyYXlXaXRob3V0SG9sZXMoYXJyKSB7IGlmIChBcnJheS5pc0FycmF5KGFycikpIHsgZm9yICh2YXIgaSA9IDAsIGFycjIgPSBuZXcgQXJyYXkoYXJyLmxlbmd0aCk7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHsgYXJyMltpXSA9IGFycltpXTsgfSByZXR1cm4gYXJyMjsgfSB9XG5cblxudmFyIHdpbmRvd3MgPSB7fTtcbmZ1bmN0aW9uIGlzUG93ZXJPZlR3byhudW0pIHtcbiAgd2hpbGUgKG51bSAlIDIgPT09IDAgJiYgbnVtID4gMSkge1xuICAgIG51bSAvPSAyO1xuICB9XG5cbiAgcmV0dXJuIG51bSA9PT0gMTtcbn1cbmZ1bmN0aW9uIGVycm9yKG1lc3NhZ2UpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdNZXlkYTogJyArIG1lc3NhZ2UpO1xufVxuZnVuY3Rpb24gcG9pbnR3aXNlQnVmZmVyTXVsdChhLCBiKSB7XG4gIHZhciBjID0gW107XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBNYXRoLm1pbihhLmxlbmd0aCwgYi5sZW5ndGgpOyBpKyspIHtcbiAgICBjW2ldID0gYVtpXSAqIGJbaV07XG4gIH1cblxuICByZXR1cm4gYztcbn1cbmZ1bmN0aW9uIGFwcGx5V2luZG93KHNpZ25hbCwgd2luZG93bmFtZSkge1xuICBpZiAod2luZG93bmFtZSAhPT0gJ3JlY3QnKSB7XG4gICAgaWYgKHdpbmRvd25hbWUgPT09ICcnIHx8ICF3aW5kb3duYW1lKSB3aW5kb3duYW1lID0gJ2hhbm5pbmcnO1xuICAgIGlmICghd2luZG93c1t3aW5kb3duYW1lXSkgd2luZG93c1t3aW5kb3duYW1lXSA9IHt9O1xuXG4gICAgaWYgKCF3aW5kb3dzW3dpbmRvd25hbWVdW3NpZ25hbC5sZW5ndGhdKSB7XG4gICAgICB0cnkge1xuICAgICAgICB3aW5kb3dzW3dpbmRvd25hbWVdW3NpZ25hbC5sZW5ndGhdID0gX3dpbmRvd2luZ19fV0VCUEFDS19JTVBPUlRFRF9NT0RVTEVfMF9fW3dpbmRvd25hbWVdKHNpZ25hbC5sZW5ndGgpO1xuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgd2luZG93aW5nIGZ1bmN0aW9uJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2lnbmFsID0gcG9pbnR3aXNlQnVmZmVyTXVsdChzaWduYWwsIHdpbmRvd3Nbd2luZG93bmFtZV1bc2lnbmFsLmxlbmd0aF0pO1xuICB9XG5cbiAgcmV0dXJuIHNpZ25hbDtcbn1cbmZ1bmN0aW9uIGNyZWF0ZUJhcmtTY2FsZShsZW5ndGgsIHNhbXBsZVJhdGUsIGJ1ZmZlclNpemUpIHtcbiAgdmFyIGJhcmtTY2FsZSA9IG5ldyBGbG9hdDMyQXJyYXkobGVuZ3RoKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGJhcmtTY2FsZS5sZW5ndGg7IGkrKykge1xuICAgIGJhcmtTY2FsZVtpXSA9IGkgKiBzYW1wbGVSYXRlIC8gYnVmZmVyU2l6ZTtcbiAgICBiYXJrU2NhbGVbaV0gPSAxMyAqIE1hdGguYXRhbihiYXJrU2NhbGVbaV0gLyAxMzE1LjgpICsgMy41ICogTWF0aC5hdGFuKE1hdGgucG93KGJhcmtTY2FsZVtpXSAvIDc1MTgsIDIpKTtcbiAgfVxuXG4gIHJldHVybiBiYXJrU2NhbGU7XG59XG5mdW5jdGlvbiB0eXBlZFRvQXJyYXkodCkge1xuICAvLyB1dGlsaXR5IHRvIGNvbnZlcnQgdHlwZWQgYXJyYXlzIHRvIG5vcm1hbCBhcnJheXNcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKHQpO1xufVxuZnVuY3Rpb24gYXJyYXlUb1R5cGVkKHQpIHtcbiAgLy8gdXRpbGl0eSB0byBjb252ZXJ0IGFycmF5cyB0byB0eXBlZCBGMzIgYXJyYXlzXG4gIHJldHVybiBGbG9hdDMyQXJyYXkuZnJvbSh0KTtcbn1cbmZ1bmN0aW9uIF9ub3JtYWxpemUobnVtLCByYW5nZSkge1xuICByZXR1cm4gbnVtIC8gcmFuZ2U7XG59XG5mdW5jdGlvbiBub3JtYWxpemUoYSwgcmFuZ2UpIHtcbiAgcmV0dXJuIGEubWFwKGZ1bmN0aW9uIChuKSB7XG4gICAgcmV0dXJuIF9ub3JtYWxpemUobiwgcmFuZ2UpO1xuICB9KTtcbn1cbmZ1bmN0aW9uIG5vcm1hbGl6ZVRvT25lKGEpIHtcbiAgdmFyIG1heCA9IE1hdGgubWF4LmFwcGx5KG51bGwsIGEpO1xuICByZXR1cm4gYS5tYXAoZnVuY3Rpb24gKG4pIHtcbiAgICByZXR1cm4gbiAvIG1heDtcbiAgfSk7XG59XG5mdW5jdGlvbiBtZWFuKGEpIHtcbiAgcmV0dXJuIGEucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjdXIpIHtcbiAgICByZXR1cm4gcHJldiArIGN1cjtcbiAgfSkgLyBhLmxlbmd0aDtcbn1cblxuZnVuY3Rpb24gX21lbFRvRnJlcShtZWxWYWx1ZSkge1xuICB2YXIgZnJlcVZhbHVlID0gNzAwICogKE1hdGguZXhwKG1lbFZhbHVlIC8gMTEyNSkgLSAxKTtcbiAgcmV0dXJuIGZyZXFWYWx1ZTtcbn1cblxuZnVuY3Rpb24gX2ZyZXFUb01lbChmcmVxVmFsdWUpIHtcbiAgdmFyIG1lbFZhbHVlID0gMTEyNSAqIE1hdGgubG9nKDEgKyBmcmVxVmFsdWUgLyA3MDApO1xuICByZXR1cm4gbWVsVmFsdWU7XG59XG5cbmZ1bmN0aW9uIG1lbFRvRnJlcShtVikge1xuICByZXR1cm4gX21lbFRvRnJlcShtVik7XG59XG5mdW5jdGlvbiBmcmVxVG9NZWwoZlYpIHtcbiAgcmV0dXJuIF9mcmVxVG9NZWwoZlYpO1xufVxuZnVuY3Rpb24gY3JlYXRlTWVsRmlsdGVyQmFuayhudW1GaWx0ZXJzLCBzYW1wbGVSYXRlLCBidWZmZXJTaXplKSB7XG4gIC8vdGhlICsyIGlzIHRoZSB1cHBlciBhbmQgbG93ZXIgbGltaXRzXG4gIHZhciBtZWxWYWx1ZXMgPSBuZXcgRmxvYXQzMkFycmF5KG51bUZpbHRlcnMgKyAyKTtcbiAgdmFyIG1lbFZhbHVlc0luRnJlcSA9IG5ldyBGbG9hdDMyQXJyYXkobnVtRmlsdGVycyArIDIpOyAvL0dlbmVyYXRlIGxpbWl0cyBpbiBIeiAtIGZyb20gMCB0byB0aGUgbnlxdWlzdC5cblxuICB2YXIgbG93ZXJMaW1pdEZyZXEgPSAwO1xuICB2YXIgdXBwZXJMaW1pdEZyZXEgPSBzYW1wbGVSYXRlIC8gMjsgLy9Db252ZXJ0IHRoZSBsaW1pdHMgdG8gTWVsXG5cbiAgdmFyIGxvd2VyTGltaXRNZWwgPSBfZnJlcVRvTWVsKGxvd2VyTGltaXRGcmVxKTtcblxuICB2YXIgdXBwZXJMaW1pdE1lbCA9IF9mcmVxVG9NZWwodXBwZXJMaW1pdEZyZXEpOyAvL0ZpbmQgdGhlIHJhbmdlXG5cblxuICB2YXIgcmFuZ2UgPSB1cHBlckxpbWl0TWVsIC0gbG93ZXJMaW1pdE1lbDsgLy9GaW5kIHRoZSByYW5nZSBhcyBwYXJ0IG9mIHRoZSBsaW5lYXIgaW50ZXJwb2xhdGlvblxuXG4gIHZhciB2YWx1ZVRvQWRkID0gcmFuZ2UgLyAobnVtRmlsdGVycyArIDEpO1xuICB2YXIgZmZ0Qmluc09mRnJlcSA9IEFycmF5KG51bUZpbHRlcnMgKyAyKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG1lbFZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIEluaXRpYWxpc2luZyB0aGUgbWVsIGZyZXF1ZW5jaWVzXG4gICAgLy8gVGhleSdyZSBhIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdGhlIGxvd2VyIGFuZCB1cHBlciBsaW1pdHMuXG4gICAgbWVsVmFsdWVzW2ldID0gaSAqIHZhbHVlVG9BZGQ7IC8vIENvbnZlcnQgYmFjayB0byBIelxuXG4gICAgbWVsVmFsdWVzSW5GcmVxW2ldID0gX21lbFRvRnJlcShtZWxWYWx1ZXNbaV0pOyAvLyBGaW5kIHRoZSBjb3JyZXNwb25kaW5nIGJpbnNcblxuICAgIGZmdEJpbnNPZkZyZXFbaV0gPSBNYXRoLmZsb29yKChidWZmZXJTaXplICsgMSkgKiBtZWxWYWx1ZXNJbkZyZXFbaV0gLyBzYW1wbGVSYXRlKTtcbiAgfVxuXG4gIHZhciBmaWx0ZXJCYW5rID0gQXJyYXkobnVtRmlsdGVycyk7XG5cbiAgZm9yICh2YXIgaiA9IDA7IGogPCBmaWx0ZXJCYW5rLmxlbmd0aDsgaisrKSB7XG4gICAgLy8gQ3JlYXRlIGEgdHdvIGRpbWVuc2lvbmFsIGFycmF5IG9mIHNpemUgbnVtRmlsdGVycyAqIChidWZmZXJzaXplLzIpKzFcbiAgICAvLyBwcmUtcG9wdWxhdGluZyB0aGUgYXJyYXlzIHdpdGggMHMuXG4gICAgZmlsdGVyQmFua1tqXSA9IEFycmF5LmFwcGx5KG51bGwsIG5ldyBBcnJheShidWZmZXJTaXplIC8gMiArIDEpKS5tYXAoTnVtYmVyLnByb3RvdHlwZS52YWx1ZU9mLCAwKTsgLy9jcmVhdGluZyB0aGUgbG93ZXIgYW5kIHVwcGVyIHNsb3BlcyBmb3IgZWFjaCBiaW5cblxuICAgIGZvciAodmFyIF9pID0gZmZ0Qmluc09mRnJlcVtqXTsgX2kgPCBmZnRCaW5zT2ZGcmVxW2ogKyAxXTsgX2krKykge1xuICAgICAgZmlsdGVyQmFua1tqXVtfaV0gPSAoX2kgLSBmZnRCaW5zT2ZGcmVxW2pdKSAvIChmZnRCaW5zT2ZGcmVxW2ogKyAxXSAtIGZmdEJpbnNPZkZyZXFbal0pO1xuICAgIH1cblxuICAgIGZvciAodmFyIF9pMiA9IGZmdEJpbnNPZkZyZXFbaiArIDFdOyBfaTIgPCBmZnRCaW5zT2ZGcmVxW2ogKyAyXTsgX2kyKyspIHtcbiAgICAgIGZpbHRlckJhbmtbal1bX2kyXSA9IChmZnRCaW5zT2ZGcmVxW2ogKyAyXSAtIF9pMikgLyAoZmZ0Qmluc09mRnJlcVtqICsgMl0gLSBmZnRCaW5zT2ZGcmVxW2ogKyAxXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZpbHRlckJhbms7XG59XG5mdW5jdGlvbiBoelRvT2N0YXZlcyhmcmVxLCBBNDQwKSB7XG4gIHJldHVybiBNYXRoLmxvZzIoMTYgKiBmcmVxIC8gQTQ0MCk7XG59XG5mdW5jdGlvbiBub3JtYWxpemVCeUNvbHVtbihhKSB7XG4gIHZhciBlbXB0eVJvdyA9IGFbMF0ubWFwKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gMDtcbiAgfSk7XG4gIHZhciBjb2xEZW5vbWluYXRvcnMgPSBhLnJlZHVjZShmdW5jdGlvbiAoYWNjLCByb3cpIHtcbiAgICByb3cuZm9yRWFjaChmdW5jdGlvbiAoY2VsbCwgaikge1xuICAgICAgYWNjW2pdICs9IE1hdGgucG93KGNlbGwsIDIpO1xuICAgIH0pO1xuICAgIHJldHVybiBhY2M7XG4gIH0sIGVtcHR5Um93KS5tYXAoTWF0aC5zcXJ0KTtcbiAgcmV0dXJuIGEubWFwKGZ1bmN0aW9uIChyb3csIGkpIHtcbiAgICByZXR1cm4gcm93Lm1hcChmdW5jdGlvbiAodiwgaikge1xuICAgICAgcmV0dXJuIHYgLyAoY29sRGVub21pbmF0b3JzW2pdIHx8IDEpO1xuICAgIH0pO1xuICB9KTtcbn1cbjtcbmZ1bmN0aW9uIGNyZWF0ZUNocm9tYUZpbHRlckJhbmsobnVtRmlsdGVycywgc2FtcGxlUmF0ZSwgYnVmZmVyU2l6ZSkge1xuICB2YXIgY2VudGVyT2N0YXZlID0gYXJndW1lbnRzLmxlbmd0aCA+IDMgJiYgYXJndW1lbnRzWzNdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbM10gOiA1O1xuICB2YXIgb2N0YXZlV2lkdGggPSBhcmd1bWVudHMubGVuZ3RoID4gNCAmJiBhcmd1bWVudHNbNF0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s0XSA6IDI7XG4gIHZhciBiYXNlQyA9IGFyZ3VtZW50cy5sZW5ndGggPiA1ICYmIGFyZ3VtZW50c1s1XSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzVdIDogdHJ1ZTtcbiAgdmFyIEE0NDAgPSBhcmd1bWVudHMubGVuZ3RoID4gNiAmJiBhcmd1bWVudHNbNl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1s2XSA6IDQ0MDtcbiAgdmFyIG51bU91dHB1dEJpbnMgPSBNYXRoLmZsb29yKGJ1ZmZlclNpemUgLyAyKSArIDE7XG4gIHZhciBmcmVxdWVuY3lCaW5zID0gbmV3IEFycmF5KGJ1ZmZlclNpemUpLmZpbGwoMCkubWFwKGZ1bmN0aW9uIChfLCBpKSB7XG4gICAgcmV0dXJuIG51bUZpbHRlcnMgKiBoelRvT2N0YXZlcyhzYW1wbGVSYXRlICogaSAvIGJ1ZmZlclNpemUsIEE0NDApO1xuICB9KTsgLy8gU2V0IGEgdmFsdWUgZm9yIHRoZSAwIEh6IGJpbiB0aGF0IGlzIDEuNSBvY3RhdmVzIGJlbG93IGJpbiAxXG4gIC8vIChzbyBjaHJvbWEgaXMgNTAlIHJvdGF0ZWQgZnJvbSBiaW4gMSwgYW5kIGJpbiB3aWR0aCBpcyBicm9hZClcblxuICBmcmVxdWVuY3lCaW5zWzBdID0gZnJlcXVlbmN5Qmluc1sxXSAtIDEuNSAqIG51bUZpbHRlcnM7XG4gIHZhciBiaW5XaWR0aEJpbnMgPSBmcmVxdWVuY3lCaW5zLnNsaWNlKDEpLm1hcChmdW5jdGlvbiAodiwgaSkge1xuICAgIHJldHVybiBNYXRoLm1heCh2IC0gZnJlcXVlbmN5Qmluc1tpXSk7XG4gIH0sIDEpLmNvbmNhdChbMV0pO1xuICB2YXIgaGFsZk51bUZpbHRlcnMgPSBNYXRoLnJvdW5kKG51bUZpbHRlcnMgLyAyKTtcbiAgdmFyIGZpbHRlclBlYWtzID0gbmV3IEFycmF5KG51bUZpbHRlcnMpLmZpbGwoMCkubWFwKGZ1bmN0aW9uIChfLCBpKSB7XG4gICAgcmV0dXJuIGZyZXF1ZW5jeUJpbnMubWFwKGZ1bmN0aW9uIChmcnEpIHtcbiAgICAgIHJldHVybiAoMTAgKiBudW1GaWx0ZXJzICsgaGFsZk51bUZpbHRlcnMgKyBmcnEgLSBpKSAlIG51bUZpbHRlcnMgLSBoYWxmTnVtRmlsdGVycztcbiAgICB9KTtcbiAgfSk7XG4gIHZhciB3ZWlnaHRzID0gZmlsdGVyUGVha3MubWFwKGZ1bmN0aW9uIChyb3csIGkpIHtcbiAgICByZXR1cm4gcm93Lm1hcChmdW5jdGlvbiAoXywgaikge1xuICAgICAgcmV0dXJuIE1hdGguZXhwKC0wLjUgKiBNYXRoLnBvdygyICogZmlsdGVyUGVha3NbaV1bal0gLyBiaW5XaWR0aEJpbnNbal0sIDIpKTtcbiAgICB9KTtcbiAgfSk7XG4gIHdlaWdodHMgPSBub3JtYWxpemVCeUNvbHVtbih3ZWlnaHRzKTtcblxuICBpZiAob2N0YXZlV2lkdGgpIHtcbiAgICB2YXIgb2N0YXZlV2VpZ2h0cyA9IGZyZXF1ZW5jeUJpbnMubWFwKGZ1bmN0aW9uICh2KSB7XG4gICAgICByZXR1cm4gTWF0aC5leHAoLTAuNSAqIE1hdGgucG93KCh2IC8gbnVtRmlsdGVycyAtIGNlbnRlck9jdGF2ZSkgLyBvY3RhdmVXaWR0aCwgMikpO1xuICAgIH0pO1xuICAgIHdlaWdodHMgPSB3ZWlnaHRzLm1hcChmdW5jdGlvbiAocm93KSB7XG4gICAgICByZXR1cm4gcm93Lm1hcChmdW5jdGlvbiAoY2VsbCwgaikge1xuICAgICAgICByZXR1cm4gY2VsbCAqIG9jdGF2ZVdlaWdodHNbal07XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIGlmIChiYXNlQykge1xuICAgIHdlaWdodHMgPSBfdG9Db25zdW1hYmxlQXJyYXkod2VpZ2h0cy5zbGljZSgzKSkuY29uY2F0KF90b0NvbnN1bWFibGVBcnJheSh3ZWlnaHRzLnNsaWNlKDAsIDMpKSk7XG4gIH1cblxuICByZXR1cm4gd2VpZ2h0cy5tYXAoZnVuY3Rpb24gKHJvdykge1xuICAgIHJldHVybiByb3cuc2xpY2UoMCwgbnVtT3V0cHV0Qmlucyk7XG4gIH0pO1xufVxuZnVuY3Rpb24gZnJhbWUoYnVmZmVyLCBmcmFtZUxlbmd0aCwgaG9wTGVuZ3RoKSB7XG4gIGlmIChidWZmZXIubGVuZ3RoIDwgZnJhbWVMZW5ndGgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0J1ZmZlciBpcyB0b28gc2hvcnQgZm9yIGZyYW1lIGxlbmd0aCcpO1xuICB9XG5cbiAgaWYgKGhvcExlbmd0aCA8IDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0hvcCBsZW5ndGggY2Fubm90IGJlIGxlc3MgdGhhdCAxJyk7XG4gIH1cblxuICBpZiAoZnJhbWVMZW5ndGggPCAxKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdGcmFtZSBsZW5ndGggY2Fubm90IGJlIGxlc3MgdGhhdCAxJyk7XG4gIH1cblxuICB2YXIgbnVtRnJhbWVzID0gMSArIE1hdGguZmxvb3IoKGJ1ZmZlci5sZW5ndGggLSBmcmFtZUxlbmd0aCkgLyBob3BMZW5ndGgpO1xuICByZXR1cm4gbmV3IEFycmF5KG51bUZyYW1lcykuZmlsbCgwKS5tYXAoZnVuY3Rpb24gKF8sIGkpIHtcbiAgICByZXR1cm4gYnVmZmVyLnNsaWNlKGkgKiBob3BMZW5ndGgsIGkgKiBob3BMZW5ndGggKyBmcmFtZUxlbmd0aCk7XG4gIH0pO1xufVxuXG4vKioqLyB9KSxcblxuLyoqKi8gXCIuL3NyYy93aW5kb3dpbmcuanNcIjpcbi8qISoqKioqKioqKioqKioqKioqKioqKioqKioqISpcXFxuICAhKioqIC4vc3JjL3dpbmRvd2luZy5qcyAqKiohXG4gIFxcKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiEgZXhwb3J0cyBwcm92aWRlZDogYmxhY2ttYW4sIHNpbmUsIGhhbm5pbmcsIGhhbW1pbmcgKi9cbi8qKiovIChmdW5jdGlvbihtb2R1bGUsIF9fd2VicGFja19leHBvcnRzX18sIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIoX193ZWJwYWNrX2V4cG9ydHNfXyk7XG4vKiBoYXJtb255IGV4cG9ydCAoYmluZGluZykgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwiYmxhY2ttYW5cIiwgZnVuY3Rpb24oKSB7IHJldHVybiBibGFja21hbjsgfSk7XG4vKiBoYXJtb255IGV4cG9ydCAoYmluZGluZykgKi8gX193ZWJwYWNrX3JlcXVpcmVfXy5kKF9fd2VicGFja19leHBvcnRzX18sIFwic2luZVwiLCBmdW5jdGlvbigpIHsgcmV0dXJuIHNpbmU7IH0pO1xuLyogaGFybW9ueSBleHBvcnQgKGJpbmRpbmcpICovIF9fd2VicGFja19yZXF1aXJlX18uZChfX3dlYnBhY2tfZXhwb3J0c19fLCBcImhhbm5pbmdcIiwgZnVuY3Rpb24oKSB7IHJldHVybiBoYW5uaW5nOyB9KTtcbi8qIGhhcm1vbnkgZXhwb3J0IChiaW5kaW5nKSAqLyBfX3dlYnBhY2tfcmVxdWlyZV9fLmQoX193ZWJwYWNrX2V4cG9ydHNfXywgXCJoYW1taW5nXCIsIGZ1bmN0aW9uKCkgeyByZXR1cm4gaGFtbWluZzsgfSk7XG5mdW5jdGlvbiBibGFja21hbihzaXplKSB7XG4gIHZhciBibGFja21hbkJ1ZmZlciA9IG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSk7XG4gIHZhciBjb2VmZjEgPSAyICogTWF0aC5QSSAvIChzaXplIC0gMSk7XG4gIHZhciBjb2VmZjIgPSAyICogY29lZmYxOyAvL0FjY29yZGluZyB0byBodHRwOi8vdWsubWF0aHdvcmtzLmNvbS9oZWxwL3NpZ25hbC9yZWYvYmxhY2ttYW4uaHRtbFxuICAvL2ZpcnN0IGhhbGYgb2YgdGhlIHdpbmRvd1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZSAvIDI7IGkrKykge1xuICAgIGJsYWNrbWFuQnVmZmVyW2ldID0gMC40MiAtIDAuNSAqIE1hdGguY29zKGkgKiBjb2VmZjEpICsgMC4wOCAqIE1hdGguY29zKGkgKiBjb2VmZjIpO1xuICB9IC8vc2Vjb25kIGhhbGYgb2YgdGhlIHdpbmRvd1xuXG5cbiAgZm9yICh2YXIgX2kgPSBzaXplIC8gMjsgX2kgPiAwOyBfaS0tKSB7XG4gICAgYmxhY2ttYW5CdWZmZXJbc2l6ZSAtIF9pXSA9IGJsYWNrbWFuQnVmZmVyW19pIC0gMV07XG4gIH1cblxuICByZXR1cm4gYmxhY2ttYW5CdWZmZXI7XG59XG5mdW5jdGlvbiBzaW5lKHNpemUpIHtcbiAgdmFyIGNvZWZmID0gTWF0aC5QSSAvIChzaXplIC0gMSk7XG4gIHZhciBzaW5lQnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheShzaXplKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgIHNpbmVCdWZmZXJbaV0gPSBNYXRoLnNpbihjb2VmZiAqIGkpO1xuICB9XG5cbiAgcmV0dXJuIHNpbmVCdWZmZXI7XG59XG5mdW5jdGlvbiBoYW5uaW5nKHNpemUpIHtcbiAgdmFyIGhhbm5pbmdCdWZmZXIgPSBuZXcgRmxvYXQzMkFycmF5KHNpemUpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgLy8gQWNjb3JkaW5nIHRvIHRoZSBSIGRvY3VtZW50YXRpb25cbiAgICAvLyBodHRwOi8vdWdyYWQuc3RhdC51YmMuY2EvUi9saWJyYXJ5L2UxMDcxL2h0bWwvaGFubmluZy53aW5kb3cuaHRtbFxuICAgIGhhbm5pbmdCdWZmZXJbaV0gPSAwLjUgLSAwLjUgKiBNYXRoLmNvcygyICogTWF0aC5QSSAqIGkgLyAoc2l6ZSAtIDEpKTtcbiAgfVxuXG4gIHJldHVybiBoYW5uaW5nQnVmZmVyO1xufVxuZnVuY3Rpb24gaGFtbWluZyhzaXplKSB7XG4gIHZhciBoYW1taW5nQnVmZmVyID0gbmV3IEZsb2F0MzJBcnJheShzaXplKTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgIC8vQWNjb3JkaW5nIHRvIGh0dHA6Ly91ay5tYXRod29ya3MuY29tL2hlbHAvc2lnbmFsL3JlZi9oYW1taW5nLmh0bWxcbiAgICBoYW1taW5nQnVmZmVyW2ldID0gMC41NCAtIDAuNDYgKiBNYXRoLmNvcygyICogTWF0aC5QSSAqIChpIC8gc2l6ZSAtIDEpKTtcbiAgfVxuXG4gIHJldHVybiBoYW1taW5nQnVmZmVyO1xufVxuXG4vKioqLyB9KVxuXG4vKioqKioqLyB9KTtcbn0pO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bWV5ZGEubWluLm1hcCIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcblxudmFyIF9wb255ZmlsbCA9IHJlcXVpcmUoJy4vcG9ueWZpbGwuanMnKTtcblxudmFyIF9wb255ZmlsbDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9wb255ZmlsbCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7ICdkZWZhdWx0Jzogb2JqIH07IH1cblxudmFyIHJvb3Q7IC8qIGdsb2JhbCB3aW5kb3cgKi9cblxuXG5pZiAodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBzZWxmO1xufSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gd2luZG93O1xufSBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gZ2xvYmFsO1xufSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gbW9kdWxlO1xufSBlbHNlIHtcbiAgcm9vdCA9IEZ1bmN0aW9uKCdyZXR1cm4gdGhpcycpKCk7XG59XG5cbnZhciByZXN1bHQgPSAoMCwgX3BvbnlmaWxsMlsnZGVmYXVsdCddKShyb290KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHJlc3VsdDsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuXHR2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzWydkZWZhdWx0J10gPSBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGw7XG5mdW5jdGlvbiBzeW1ib2xPYnNlcnZhYmxlUG9ueWZpbGwocm9vdCkge1xuXHR2YXIgcmVzdWx0O1xuXHR2YXIgX1N5bWJvbCA9IHJvb3QuU3ltYm9sO1xuXG5cdGlmICh0eXBlb2YgX1N5bWJvbCA9PT0gJ2Z1bmN0aW9uJykge1xuXHRcdGlmIChfU3ltYm9sLm9ic2VydmFibGUpIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2wub2JzZXJ2YWJsZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmVzdWx0ID0gX1N5bWJvbCgnb2JzZXJ2YWJsZScpO1xuXHRcdFx0X1N5bWJvbC5vYnNlcnZhYmxlID0gcmVzdWx0O1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHRyZXN1bHQgPSAnQEBvYnNlcnZhYmxlJztcblx0fVxuXG5cdHJldHVybiByZXN1bHQ7XG59OyIsImltcG9ydCAkJG9ic2VydmFibGUgZnJvbSAnc3ltYm9sLW9ic2VydmFibGUnO1xuXG5jb25zdCBOTyA9IHt9O1xuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmZ1bmN0aW9uIGNwPFQ+KGE6IEFycmF5PFQ+KTogQXJyYXk8VD4ge1xuICBjb25zdCBsID0gYS5sZW5ndGg7XG4gIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsOyArK2kpIGJbaV0gPSBhW2ldO1xuICByZXR1cm4gYjtcbn1cblxuZnVuY3Rpb24gYW5kPFQ+KGYxOiAodDogVCkgPT4gYm9vbGVhbiwgZjI6ICh0OiBUKSA9PiBib29sZWFuKTogKHQ6IFQpID0+IGJvb2xlYW4ge1xuICByZXR1cm4gZnVuY3Rpb24gYW5kRm4odDogVCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBmMSh0KSAmJiBmMih0KTtcbiAgfTtcbn1cblxuaW50ZXJmYWNlIEZDb250YWluZXI8VCwgUj4ge1xuICBmKHQ6IFQpOiBSO1xufVxuXG5mdW5jdGlvbiBfdHJ5PFQsIFI+KGM6IEZDb250YWluZXI8VCwgUj4sIHQ6IFQsIHU6IFN0cmVhbTxhbnk+KTogUiB8IHt9IHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gYy5mKHQpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdS5fZShlKTtcbiAgICByZXR1cm4gTk87XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgX246ICh2OiBUKSA9PiB2b2lkO1xuICBfZTogKGVycjogYW55KSA9PiB2b2lkO1xuICBfYzogKCkgPT4gdm9pZDtcbn1cblxuY29uc3QgTk9fSUw6IEludGVybmFsTGlzdGVuZXI8YW55PiA9IHtcbiAgX246IG5vb3AsXG4gIF9lOiBub29wLFxuICBfYzogbm9vcCxcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIF9zdGFydChsaXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPik6IHZvaWQ7XG4gIF9zdG9wOiAoKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE91dFNlbmRlcjxUPiB7XG4gIG91dDogU3RyZWFtPFQ+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9wZXJhdG9yPFQsIFI+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxSPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiwgT3V0U2VuZGVyPFI+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnM6IFN0cmVhbTxUPjtcbiAgX3N0YXJ0KG91dDogU3RyZWFtPFI+KTogdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBZ2dyZWdhdG9yPFQsIFU+IGV4dGVuZHMgSW50ZXJuYWxQcm9kdWNlcjxVPiwgT3V0U2VuZGVyPFU+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBpbnNBcnI6IEFycmF5PFN0cmVhbTxUPj47XG4gIF9zdGFydChvdXQ6IFN0cmVhbTxVPik6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvZHVjZXI8VD4ge1xuICBzdGFydDogKGxpc3RlbmVyOiBMaXN0ZW5lcjxUPikgPT4gdm9pZDtcbiAgc3RvcDogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBMaXN0ZW5lcjxUPiB7XG4gIG5leHQ6ICh4OiBUKSA9PiB2b2lkO1xuICBlcnJvcjogKGVycjogYW55KSA9PiB2b2lkO1xuICBjb21wbGV0ZTogKCkgPT4gdm9pZDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJzY3JpcHRpb24ge1xuICB1bnN1YnNjcmliZSgpOiB2b2lkO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE9ic2VydmFibGU8VD4ge1xuICBzdWJzY3JpYmUobGlzdGVuZXI6IExpc3RlbmVyPFQ+KTogU3Vic2NyaXB0aW9uO1xufVxuXG4vLyBtdXRhdGVzIHRoZSBpbnB1dFxuZnVuY3Rpb24gaW50ZXJuYWxpemVQcm9kdWNlcjxUPihwcm9kdWNlcjogUHJvZHVjZXI8VD4gJiBQYXJ0aWFsPEludGVybmFsUHJvZHVjZXI8VD4+KSB7XG4gIHByb2R1Y2VyLl9zdGFydCA9IGZ1bmN0aW9uIF9zdGFydChpbDogSW50ZXJuYWxMaXN0ZW5lcjxUPiAmIFBhcnRpYWw8TGlzdGVuZXI8VD4+KSB7XG4gICAgaWwubmV4dCA9IGlsLl9uO1xuICAgIGlsLmVycm9yID0gaWwuX2U7XG4gICAgaWwuY29tcGxldGUgPSBpbC5fYztcbiAgICB0aGlzLnN0YXJ0KGlsKTtcbiAgfTtcbiAgcHJvZHVjZXIuX3N0b3AgPSBwcm9kdWNlci5zdG9wO1xufVxuXG5jbGFzcyBTdHJlYW1TdWI8VD4gaW1wbGVtZW50cyBTdWJzY3JpcHRpb24ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zdHJlYW06IFN0cmVhbTxUPiwgcHJpdmF0ZSBfbGlzdGVuZXI6IEludGVybmFsTGlzdGVuZXI8VD4pIHt9XG5cbiAgdW5zdWJzY3JpYmUoKTogdm9pZCB7XG4gICAgdGhpcy5fc3RyZWFtLl9yZW1vdmUodGhpcy5fbGlzdGVuZXIpO1xuICB9XG59XG5cbmNsYXNzIE9ic2VydmVyPFQ+IGltcGxlbWVudHMgTGlzdGVuZXI8VD4ge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9saXN0ZW5lcjogSW50ZXJuYWxMaXN0ZW5lcjxUPikge31cblxuICBuZXh0KHZhbHVlOiBUKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX24odmFsdWUpO1xuICB9XG5cbiAgZXJyb3IoZXJyOiBhbnkpIHtcbiAgICB0aGlzLl9saXN0ZW5lci5fZShlcnIpO1xuICB9XG5cbiAgY29tcGxldGUoKSB7XG4gICAgdGhpcy5fbGlzdGVuZXIuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBGcm9tT2JzZXJ2YWJsZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tT2JzZXJ2YWJsZSc7XG4gIHB1YmxpYyBpbnM6IE9ic2VydmFibGU8VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHJpdmF0ZSBhY3RpdmU6IGJvb2xlYW47XG4gIHByaXZhdGUgX3N1YjogU3Vic2NyaXB0aW9uIHwgdW5kZWZpbmVkO1xuXG4gIGNvbnN0cnVjdG9yKG9ic2VydmFibGU6IE9ic2VydmFibGU8VD4pIHtcbiAgICB0aGlzLmlucyA9IG9ic2VydmFibGU7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLl9zdWIgPSB0aGlzLmlucy5zdWJzY3JpYmUobmV3IE9ic2VydmVyKG91dCkpO1xuICAgIGlmICghdGhpcy5hY3RpdmUpIHRoaXMuX3N1Yi51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgX3N0b3AoKSB7XG4gICAgaWYgKHRoaXMuX3N1YikgdGhpcy5fc3ViLnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1lcmdlU2lnbmF0dXJlIHtcbiAgKCk6IFN0cmVhbTxhbnk+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogU3RyZWFtPFQxPjtcbiAgPFQxLCBUMj4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4pOiBTdHJlYW08VDEgfCBUMj47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IFN0cmVhbTxUMSB8IFQyIHwgVDM+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNT4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDY+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3PjtcbiAgPFQxLCBUMiwgVDMsIFQ0LCBUNSwgVDYsIFQ3LCBUOD4oXG4gICAgczE6IFN0cmVhbTxUMT4sXG4gICAgczI6IFN0cmVhbTxUMj4sXG4gICAgczM6IFN0cmVhbTxUMz4sXG4gICAgczQ6IFN0cmVhbTxUND4sXG4gICAgczU6IFN0cmVhbTxUNT4sXG4gICAgczY6IFN0cmVhbTxUNj4sXG4gICAgczc6IFN0cmVhbTxUNz4sXG4gICAgczg6IFN0cmVhbTxUOD4pOiBTdHJlYW08VDEgfCBUMiB8IFQzIHwgVDQgfCBUNSB8IFQ2IHwgVDcgfCBUOD47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5Pik6IFN0cmVhbTxUMSB8IFQyIHwgVDMgfCBUNCB8IFQ1IHwgVDYgfCBUNyB8IFQ4IHwgVDk+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5PixcbiAgICBzMTA6IFN0cmVhbTxUMTA+KTogU3RyZWFtPFQxIHwgVDIgfCBUMyB8IFQ0IHwgVDUgfCBUNiB8IFQ3IHwgVDggfCBUOSB8IFQxMD47XG4gIDxUPiguLi5zdHJlYW06IEFycmF5PFN0cmVhbTxUPj4pOiBTdHJlYW08VD47XG59XG5cbmNsYXNzIE1lcmdlPFQ+IGltcGxlbWVudHMgQWdncmVnYXRvcjxULCBUPiwgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ21lcmdlJztcbiAgcHVibGljIGluc0FycjogQXJyYXk8U3RyZWFtPFQ+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIGFjOiBudW1iZXI7IC8vIGFjIGlzIGFjdGl2ZUNvdW50XG5cbiAgY29uc3RydWN0b3IoaW5zQXJyOiBBcnJheTxTdHJlYW08VD4+KSB7XG4gICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5hYyA9IDA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgTCA9IHMubGVuZ3RoO1xuICAgIHRoaXMuYWMgPSBMO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBzW2ldLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBjb25zdCBzID0gdGhpcy5pbnNBcnI7XG4gICAgY29uc3QgTCA9IHMubGVuZ3RoO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBzW2ldLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBpZiAoLS10aGlzLmFjIDw9IDApIHtcbiAgICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgICAgdS5fYygpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbWJpbmVTaWduYXR1cmUge1xuICAoKTogU3RyZWFtPEFycmF5PGFueT4+O1xuICA8VDE+KHMxOiBTdHJlYW08VDE+KTogU3RyZWFtPFtUMV0+O1xuICA8VDEsIFQyPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPik6IFN0cmVhbTxbVDEsIFQyXT47XG4gIDxUMSwgVDIsIFQzPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPik6IFN0cmVhbTxbVDEsIFQyLCBUM10+O1xuICA8VDEsIFQyLCBUMywgVDQ+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNF0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNl0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDc+KFxuICAgIHMxOiBTdHJlYW08VDE+LFxuICAgIHMyOiBTdHJlYW08VDI+LFxuICAgIHMzOiBTdHJlYW08VDM+LFxuICAgIHM0OiBTdHJlYW08VDQ+LFxuICAgIHM1OiBTdHJlYW08VDU+LFxuICAgIHM2OiBTdHJlYW08VDY+LFxuICAgIHM3OiBTdHJlYW08VDc+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUN10+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4XT47XG4gIDxUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5PihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5Pik6IFN0cmVhbTxbVDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOV0+O1xuICA8VDEsIFQyLCBUMywgVDQsIFQ1LCBUNiwgVDcsIFQ4LCBUOSwgVDEwPihcbiAgICBzMTogU3RyZWFtPFQxPixcbiAgICBzMjogU3RyZWFtPFQyPixcbiAgICBzMzogU3RyZWFtPFQzPixcbiAgICBzNDogU3RyZWFtPFQ0PixcbiAgICBzNTogU3RyZWFtPFQ1PixcbiAgICBzNjogU3RyZWFtPFQ2PixcbiAgICBzNzogU3RyZWFtPFQ3PixcbiAgICBzODogU3RyZWFtPFQ4PixcbiAgICBzOTogU3RyZWFtPFQ5PixcbiAgICBzMTA6IFN0cmVhbTxUMTA+KTogU3RyZWFtPFtUMSwgVDIsIFQzLCBUNCwgVDUsIFQ2LCBUNywgVDgsIFQ5LCBUMTBdPjtcbiAgKC4uLnN0cmVhbTogQXJyYXk8U3RyZWFtPGFueT4+KTogU3RyZWFtPEFycmF5PGFueT4+O1xufVxuXG5jbGFzcyBDb21iaW5lTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+LCBPdXRTZW5kZXI8QXJyYXk8VD4+IHtcbiAgcHJpdmF0ZSBpOiBudW1iZXI7XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxBcnJheTxUPj47XG4gIHByaXZhdGUgcDogQ29tYmluZTxUPjtcblxuICBjb25zdHJ1Y3RvcihpOiBudW1iZXIsIG91dDogU3RyZWFtPEFycmF5PFQ+PiwgcDogQ29tYmluZTxUPikge1xuICAgIHRoaXMuaSA9IGk7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5wID0gcDtcbiAgICBwLmlscy5wdXNoKHRoaXMpO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IHAgPSB0aGlzLnAsIG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHAudXAodCwgdGhpcy5pKSkge1xuICAgICAgY29uc3QgYSA9IHAudmFscztcbiAgICAgIGNvbnN0IGwgPSBhLmxlbmd0aDtcbiAgICAgIGNvbnN0IGIgPSBBcnJheShsKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbDsgKytpKSBiW2ldID0gYVtpXTtcbiAgICAgIG91dC5fbihiKTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG91dCA9IHRoaXMub3V0O1xuICAgIGlmIChvdXQgPT09IE5PKSByZXR1cm47XG4gICAgb3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpOiB2b2lkIHtcbiAgICBjb25zdCBwID0gdGhpcy5wO1xuICAgIGlmIChwLm91dCA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAoLS1wLk5jID09PSAwKSBwLm91dC5fYygpO1xuICB9XG59XG5cbmNsYXNzIENvbWJpbmU8Uj4gaW1wbGVtZW50cyBBZ2dyZWdhdG9yPGFueSwgQXJyYXk8Uj4+IHtcbiAgcHVibGljIHR5cGUgPSAnY29tYmluZSc7XG4gIHB1YmxpYyBpbnNBcnI6IEFycmF5PFN0cmVhbTxhbnk+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPEFycmF5PFI+PjtcbiAgcHVibGljIGlsczogQXJyYXk8Q29tYmluZUxpc3RlbmVyPGFueT4+O1xuICBwdWJsaWMgTmM6IG51bWJlcjsgLy8gKk4qdW1iZXIgb2Ygc3RyZWFtcyBzdGlsbCB0byBzZW5kICpjKm9tcGxldGVcbiAgcHVibGljIE5uOiBudW1iZXI7IC8vICpOKnVtYmVyIG9mIHN0cmVhbXMgc3RpbGwgdG8gc2VuZCAqbipleHRcbiAgcHVibGljIHZhbHM6IEFycmF5PFI+O1xuXG4gIGNvbnN0cnVjdG9yKGluc0FycjogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgdGhpcy5pbnNBcnIgPSBpbnNBcnI7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8Uj4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy5OYyA9IHRoaXMuTm4gPSAwO1xuICAgIHRoaXMudmFscyA9IFtdO1xuICB9XG5cbiAgdXAodDogYW55LCBpOiBudW1iZXIpOiBib29sZWFuIHtcbiAgICBjb25zdCB2ID0gdGhpcy52YWxzW2ldO1xuICAgIGNvbnN0IE5uID0gIXRoaXMuTm4gPyAwIDogdiA9PT0gTk8gPyAtLXRoaXMuTm4gOiB0aGlzLk5uO1xuICAgIHRoaXMudmFsc1tpXSA9IHQ7XG4gICAgcmV0dXJuIE5uID09PSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPEFycmF5PFI+Pik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIGNvbnN0IHMgPSB0aGlzLmluc0FycjtcbiAgICBjb25zdCBuID0gdGhpcy5OYyA9IHRoaXMuTm4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCB2YWxzID0gdGhpcy52YWxzID0gbmV3IEFycmF5KG4pO1xuICAgIGlmIChuID09PSAwKSB7XG4gICAgICBvdXQuX24oW10pO1xuICAgICAgb3V0Ll9jKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgIHZhbHNbaV0gPSBOTztcbiAgICAgICAgc1tpXS5fYWRkKG5ldyBDb21iaW5lTGlzdGVuZXIoaSwgb3V0LCB0aGlzKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgY29uc3QgcyA9IHRoaXMuaW5zQXJyO1xuICAgIGNvbnN0IG4gPSBzLmxlbmd0aDtcbiAgICBjb25zdCBpbHMgPSB0aGlzLmlscztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG47IGkrKykgc1tpXS5fcmVtb3ZlKGlsc1tpXSk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08QXJyYXk8Uj4+O1xuICAgIHRoaXMuaWxzID0gW107XG4gICAgdGhpcy52YWxzID0gW107XG4gIH1cbn1cblxuY2xhc3MgRnJvbUFycmF5PFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Zyb21BcnJheSc7XG4gIHB1YmxpYyBhOiBBcnJheTxUPjtcblxuICBjb25zdHJ1Y3RvcihhOiBBcnJheTxUPikge1xuICAgIHRoaXMuYSA9IGE7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgYSA9IHRoaXMuYTtcbiAgICBmb3IgKGxldCBpID0gMCwgbiA9IGEubGVuZ3RoOyBpIDwgbjsgaSsrKSBvdXQuX24oYVtpXSk7XG4gICAgb3V0Ll9jKCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgfVxufVxuXG5jbGFzcyBGcm9tUHJvbWlzZTxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdmcm9tUHJvbWlzZSc7XG4gIHB1YmxpYyBvbjogYm9vbGVhbjtcbiAgcHVibGljIHA6IFByb21pc2VMaWtlPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKHA6IFByb21pc2VMaWtlPFQ+KSB7XG4gICAgdGhpcy5vbiA9IGZhbHNlO1xuICAgIHRoaXMucCA9IHA7XG4gIH1cblxuICBfc3RhcnQob3V0OiBJbnRlcm5hbExpc3RlbmVyPFQ+KTogdm9pZCB7XG4gICAgY29uc3QgcHJvZCA9IHRoaXM7XG4gICAgdGhpcy5vbiA9IHRydWU7XG4gICAgdGhpcy5wLnRoZW4oXG4gICAgICAodjogVCkgPT4ge1xuICAgICAgICBpZiAocHJvZC5vbikge1xuICAgICAgICAgIG91dC5fbih2KTtcbiAgICAgICAgICBvdXQuX2MoKTtcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIChlOiBhbnkpID0+IHtcbiAgICAgICAgb3V0Ll9lKGUpO1xuICAgICAgfSxcbiAgICApLnRoZW4obm9vcCwgKGVycjogYW55KSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHsgdGhyb3cgZXJyOyB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMub24gPSBmYWxzZTtcbiAgfVxufVxuXG5jbGFzcyBQZXJpb2RpYyBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8bnVtYmVyPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3BlcmlvZGljJztcbiAgcHVibGljIHBlcmlvZDogbnVtYmVyO1xuICBwcml2YXRlIGludGVydmFsSUQ6IGFueTtcbiAgcHJpdmF0ZSBpOiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IocGVyaW9kOiBudW1iZXIpIHtcbiAgICB0aGlzLnBlcmlvZCA9IHBlcmlvZDtcbiAgICB0aGlzLmludGVydmFsSUQgPSAtMTtcbiAgICB0aGlzLmkgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogSW50ZXJuYWxMaXN0ZW5lcjxudW1iZXI+KTogdm9pZCB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gaW50ZXJ2YWxIYW5kbGVyKCkgeyBvdXQuX24oc2VsZi5pKyspOyB9XG4gICAgdGhpcy5pbnRlcnZhbElEID0gc2V0SW50ZXJ2YWwoaW50ZXJ2YWxIYW5kbGVyLCB0aGlzLnBlcmlvZCk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5pbnRlcnZhbElEICE9PSAtMSkgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsSUQpO1xuICAgIHRoaXMuaW50ZXJ2YWxJRCA9IC0xO1xuICAgIHRoaXMuaSA9IDA7XG4gIH1cbn1cblxuY2xhc3MgRGVidWc8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2RlYnVnJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgczogKHQ6IFQpID0+IGFueTsgLy8gc3B5XG4gIHByaXZhdGUgbDogc3RyaW5nOyAvLyBsYWJlbFxuXG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+KTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiAodDogVCkgPT4gYW55KTtcbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4sIGFyZz86IHN0cmluZyB8ICgodDogVCkgPT4gYW55KSk7XG4gIGNvbnN0cnVjdG9yKGluczogU3RyZWFtPFQ+LCBhcmc/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnMgPSBub29wO1xuICAgIHRoaXMubCA9ICcnO1xuICAgIGlmICh0eXBlb2YgYXJnID09PSAnc3RyaW5nJykgdGhpcy5sID0gYXJnOyBlbHNlIGlmICh0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nKSB0aGlzLnMgPSBhcmc7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgcyA9IHRoaXMucywgbCA9IHRoaXMubDtcbiAgICBpZiAocyAhPT0gbm9vcCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcyh0KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgdS5fZShlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGwpIGNvbnNvbGUubG9nKGwgKyAnOicsIHQpOyBlbHNlIGNvbnNvbGUubG9nKHQpO1xuICAgIHUuX24odCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIERyb3A8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2Ryb3AnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG1heDogbnVtYmVyO1xuICBwcml2YXRlIGRyb3BwZWQ6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihtYXg6IG51bWJlciwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm1heCA9IG1heDtcbiAgICB0aGlzLmRyb3BwZWQgPSAwO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5kcm9wcGVkID0gMDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgaWYgKHRoaXMuZHJvcHBlZCsrID49IHRoaXMubWF4KSB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBFbmRXaGVuTGlzdGVuZXI8VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPGFueT4ge1xuICBwcml2YXRlIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wOiBFbmRXaGVuPFQ+O1xuXG4gIGNvbnN0cnVjdG9yKG91dDogU3RyZWFtPFQ+LCBvcDogRW5kV2hlbjxUPikge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3AgPSBvcDtcbiAgfVxuXG4gIF9uKCkge1xuICAgIHRoaXMub3AuZW5kKCk7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIHRoaXMub3V0Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICB0aGlzLm9wLmVuZCgpO1xuICB9XG59XG5cbmNsYXNzIEVuZFdoZW48VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2VuZFdoZW4nO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIG86IFN0cmVhbTxhbnk+OyAvLyBvID0gb3RoZXJcbiAgcHJpdmF0ZSBvaWw6IEludGVybmFsTGlzdGVuZXI8YW55PjsgLy8gb2lsID0gb3RoZXIgSW50ZXJuYWxMaXN0ZW5lclxuXG4gIGNvbnN0cnVjdG9yKG86IFN0cmVhbTxhbnk+LCBpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMubyA9IG87XG4gICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuby5fYWRkKHRoaXMub2lsID0gbmV3IEVuZFdoZW5MaXN0ZW5lcihvdXQsIHRoaXMpKTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm8uX3JlbW92ZSh0aGlzLm9pbCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vaWwgPSBOT19JTDtcbiAgfVxuXG4gIGVuZCgpOiB2b2lkIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5lbmQoKTtcbiAgfVxufVxuXG5jbGFzcyBGaWx0ZXI8VD4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZpbHRlcic7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IGJvb2xlYW47XG5cbiAgY29uc3RydWN0b3IocGFzc2VzOiAodDogVCkgPT4gYm9vbGVhbiwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmYgPSBwYXNzZXM7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgciA9IF90cnkodGhpcywgdCwgdSk7XG4gICAgaWYgKHIgPT09IE5PIHx8ICFyKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9jKCk7XG4gIH1cbn1cblxuY2xhc3MgRmxhdHRlbkxpc3RlbmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxMaXN0ZW5lcjxUPiB7XG4gIHByaXZhdGUgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgb3A6IEZsYXR0ZW48VD47XG5cbiAgY29uc3RydWN0b3Iob3V0OiBTdHJlYW08VD4sIG9wOiBGbGF0dGVuPFQ+KSB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5vcCA9IG9wO1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIHRoaXMub3V0Ll9uKHQpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICB0aGlzLm91dC5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcC5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm9wLmxlc3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGbGF0dGVuPFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8U3RyZWFtPFQ+LCBUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ2ZsYXR0ZW4nO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08U3RyZWFtPFQ+PjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwcml2YXRlIG9wZW46IGJvb2xlYW47XG4gIHB1YmxpYyBpbm5lcjogU3RyZWFtPFQ+OyAvLyBDdXJyZW50IGlubmVyIFN0cmVhbVxuICBwcml2YXRlIGlsOiBJbnRlcm5hbExpc3RlbmVyPFQ+OyAvLyBDdXJyZW50IGlubmVyIEludGVybmFsTGlzdGVuZXJcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxTdHJlYW08VD4+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMub3BlbiA9IHRydWU7XG4gICAgdGhpcy5pbm5lciA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLmlsID0gTk9fSUw7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgaWYgKHRoaXMuaW5uZXIgIT09IE5PKSB0aGlzLmlubmVyLl9yZW1vdmUodGhpcy5pbCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5vcGVuID0gdHJ1ZTtcbiAgICB0aGlzLmlubmVyID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaWwgPSBOT19JTDtcbiAgfVxuXG4gIGxlc3MoKTogdm9pZCB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGlmICghdGhpcy5vcGVuICYmIHRoaXMuaW5uZXIgPT09IE5PKSB1Ll9jKCk7XG4gIH1cblxuICBfbihzOiBTdHJlYW08VD4pIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3Qge2lubmVyLCBpbH0gPSB0aGlzO1xuICAgIGlmIChpbm5lciAhPT0gTk8gJiYgaWwgIT09IE5PX0lMKSBpbm5lci5fcmVtb3ZlKGlsKTtcbiAgICAodGhpcy5pbm5lciA9IHMpLl9hZGQodGhpcy5pbCA9IG5ldyBGbGF0dGVuTGlzdGVuZXIodSwgdGhpcykpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgdGhpcy5vcGVuID0gZmFsc2U7XG4gICAgdGhpcy5sZXNzKCk7XG4gIH1cbn1cblxuY2xhc3MgRm9sZDxULCBSPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFI+IHtcbiAgcHVibGljIHR5cGUgPSAnZm9sZCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFI+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IFI7XG4gIHB1YmxpYyBzZWVkOiBSO1xuICBwcml2YXRlIGFjYzogUjsgLy8gaW5pdGlhbGl6ZWQgYXMgc2VlZFxuXG4gIGNvbnN0cnVjdG9yKGY6IChhY2M6IFIsIHQ6IFQpID0+IFIsIHNlZWQ6IFIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5mID0gKHQ6IFQpID0+IGYodGhpcy5hY2MsIHQpO1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkID0gc2VlZDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuYWNjID0gdGhpcy5zZWVkO1xuICAgIG91dC5fbih0aGlzLmFjYyk7XG4gICAgdGhpcy5pbnMuX2FkZCh0aGlzKTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcyk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5hY2MgPSB0aGlzLnNlZWQ7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIGNvbnN0IHIgPSBfdHJ5KHRoaXMsIHQsIHUpO1xuICAgIGlmIChyID09PSBOTykgcmV0dXJuO1xuICAgIHUuX24odGhpcy5hY2MgPSByIGFzIFIpO1xuICB9XG5cbiAgX2UoZXJyOiBhbnkpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fZShlcnIpO1xuICB9XG5cbiAgX2MoKSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2MoKTtcbiAgfVxufVxuXG5jbGFzcyBMYXN0PFQ+IGltcGxlbWVudHMgT3BlcmF0b3I8VCwgVD4ge1xuICBwdWJsaWMgdHlwZSA9ICdsYXN0JztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHByaXZhdGUgaGFzOiBib29sZWFuO1xuICBwcml2YXRlIHZhbDogVDtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPikge1xuICAgIHRoaXMuaW5zID0gaW5zO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuaGFzID0gZmFsc2U7XG4gICAgdGhpcy52YWwgPSBOTyBhcyBUO1xuICB9XG5cbiAgX3N0YXJ0KG91dDogU3RyZWFtPFQ+KTogdm9pZCB7XG4gICAgdGhpcy5vdXQgPSBvdXQ7XG4gICAgdGhpcy5oYXMgPSBmYWxzZTtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLnZhbCA9IE5PIGFzIFQ7XG4gIH1cblxuICBfbih0OiBUKSB7XG4gICAgdGhpcy5oYXMgPSB0cnVlO1xuICAgIHRoaXMudmFsID0gdDtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHUuX2UoZXJyKTtcbiAgfVxuXG4gIF9jKCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBpZiAodGhpcy5oYXMpIHtcbiAgICAgIHUuX24odGhpcy52YWwpO1xuICAgICAgdS5fYygpO1xuICAgIH0gZWxzZSB1Ll9lKG5ldyBFcnJvcignbGFzdCgpIGZhaWxlZCBiZWNhdXNlIGlucHV0IHN0cmVhbSBjb21wbGV0ZWQnKSk7XG4gIH1cbn1cblxuY2xhc3MgTWFwT3A8VCwgUj4gaW1wbGVtZW50cyBPcGVyYXRvcjxULCBSPiB7XG4gIHB1YmxpYyB0eXBlID0gJ21hcCc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFI+O1xuICBwdWJsaWMgZjogKHQ6IFQpID0+IFI7XG5cbiAgY29uc3RydWN0b3IocHJvamVjdDogKHQ6IFQpID0+IFIsIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08Uj47XG4gICAgdGhpcy5mID0gcHJvamVjdDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxSPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQodGhpcyk7XG4gIH1cblxuICBfc3RvcCgpOiB2b2lkIHtcbiAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFI+O1xuICB9XG5cbiAgX24odDogVCkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICBjb25zdCByID0gX3RyeSh0aGlzLCB0LCB1KTtcbiAgICBpZiAociA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9uKHIgYXMgUik7XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIFJlbWVtYmVyPFQ+IGltcGxlbWVudHMgSW50ZXJuYWxQcm9kdWNlcjxUPiB7XG4gIHB1YmxpYyB0eXBlID0gJ3JlbWVtYmVyJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG5cbiAgY29uc3RydWN0b3IoaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMuaW5zLl9hZGQob3V0KTtcbiAgfVxuXG4gIF9zdG9wKCk6IHZvaWQge1xuICAgIHRoaXMuaW5zLl9yZW1vdmUodGhpcy5vdXQpO1xuICAgIHRoaXMub3V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICB9XG59XG5cbmNsYXNzIFJlcGxhY2VFcnJvcjxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAncmVwbGFjZUVycm9yJztcbiAgcHVibGljIGluczogU3RyZWFtPFQ+O1xuICBwdWJsaWMgb3V0OiBTdHJlYW08VD47XG4gIHB1YmxpYyBmOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPjtcblxuICBjb25zdHJ1Y3RvcihyZXBsYWNlcjogKGVycjogYW55KSA9PiBTdHJlYW08VD4sIGluczogU3RyZWFtPFQ+KSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy5mID0gcmVwbGFjZXI7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fbih0KTtcbiAgfVxuXG4gIF9lKGVycjogYW55KSB7XG4gICAgY29uc3QgdSA9IHRoaXMub3V0O1xuICAgIGlmICh1ID09PSBOTykgcmV0dXJuO1xuICAgIHRyeSB7XG4gICAgICB0aGlzLmlucy5fcmVtb3ZlKHRoaXMpO1xuICAgICAgKHRoaXMuaW5zID0gdGhpcy5mKGVycikpLl9hZGQodGhpcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdS5fZShlKTtcbiAgICB9XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmNsYXNzIFN0YXJ0V2l0aDxUPiBpbXBsZW1lbnRzIEludGVybmFsUHJvZHVjZXI8VD4ge1xuICBwdWJsaWMgdHlwZSA9ICdzdGFydFdpdGgnO1xuICBwdWJsaWMgaW5zOiBTdHJlYW08VD47XG4gIHB1YmxpYyBvdXQ6IFN0cmVhbTxUPjtcbiAgcHVibGljIHZhbDogVDtcblxuICBjb25zdHJ1Y3RvcihpbnM6IFN0cmVhbTxUPiwgdmFsOiBUKSB7XG4gICAgdGhpcy5pbnMgPSBpbnM7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gICAgdGhpcy52YWwgPSB2YWw7XG4gIH1cblxuICBfc3RhcnQob3V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICB0aGlzLm91dCA9IG91dDtcbiAgICB0aGlzLm91dC5fbih0aGlzLnZhbCk7XG4gICAgdGhpcy5pbnMuX2FkZChvdXQpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzLm91dCk7XG4gICAgdGhpcy5vdXQgPSBOTyBhcyBTdHJlYW08VD47XG4gIH1cbn1cblxuY2xhc3MgVGFrZTxUPiBpbXBsZW1lbnRzIE9wZXJhdG9yPFQsIFQ+IHtcbiAgcHVibGljIHR5cGUgPSAndGFrZSc7XG4gIHB1YmxpYyBpbnM6IFN0cmVhbTxUPjtcbiAgcHVibGljIG91dDogU3RyZWFtPFQ+O1xuICBwdWJsaWMgbWF4OiBudW1iZXI7XG4gIHByaXZhdGUgdGFrZW46IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihtYXg6IG51bWJlciwgaW5zOiBTdHJlYW08VD4pIHtcbiAgICB0aGlzLmlucyA9IGlucztcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgICB0aGlzLm1heCA9IG1heDtcbiAgICB0aGlzLnRha2VuID0gMDtcbiAgfVxuXG4gIF9zdGFydChvdXQ6IFN0cmVhbTxUPik6IHZvaWQge1xuICAgIHRoaXMub3V0ID0gb3V0O1xuICAgIHRoaXMudGFrZW4gPSAwO1xuICAgIGlmICh0aGlzLm1heCA8PSAwKSBvdXQuX2MoKTsgZWxzZSB0aGlzLmlucy5fYWRkKHRoaXMpO1xuICB9XG5cbiAgX3N0b3AoKTogdm9pZCB7XG4gICAgdGhpcy5pbnMuX3JlbW92ZSh0aGlzKTtcbiAgICB0aGlzLm91dCA9IE5PIGFzIFN0cmVhbTxUPjtcbiAgfVxuXG4gIF9uKHQ6IFQpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgY29uc3QgbSA9ICsrdGhpcy50YWtlbjtcbiAgICBpZiAobSA8IHRoaXMubWF4KSB1Ll9uKHQpOyBlbHNlIGlmIChtID09PSB0aGlzLm1heCkge1xuICAgICAgdS5fbih0KTtcbiAgICAgIHUuX2MoKTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSkge1xuICAgIGNvbnN0IHUgPSB0aGlzLm91dDtcbiAgICBpZiAodSA9PT0gTk8pIHJldHVybjtcbiAgICB1Ll9lKGVycik7XG4gIH1cblxuICBfYygpIHtcbiAgICBjb25zdCB1ID0gdGhpcy5vdXQ7XG4gICAgaWYgKHUgPT09IE5PKSByZXR1cm47XG4gICAgdS5fYygpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTdHJlYW08VD4gaW1wbGVtZW50cyBJbnRlcm5hbExpc3RlbmVyPFQ+IHtcbiAgcHVibGljIF9wcm9kOiBJbnRlcm5hbFByb2R1Y2VyPFQ+O1xuICBwcm90ZWN0ZWQgX2lsczogQXJyYXk8SW50ZXJuYWxMaXN0ZW5lcjxUPj47IC8vICdpbHMnID0gSW50ZXJuYWwgbGlzdGVuZXJzXG4gIHByb3RlY3RlZCBfc3RvcElEOiBhbnk7XG4gIHByb3RlY3RlZCBfZGw6IEludGVybmFsTGlzdGVuZXI8VD47IC8vIHRoZSBkZWJ1ZyBsaXN0ZW5lclxuICBwcm90ZWN0ZWQgX2Q6IGJvb2xlYW47IC8vIGZsYWcgaW5kaWNhdGluZyB0aGUgZXhpc3RlbmNlIG9mIHRoZSBkZWJ1ZyBsaXN0ZW5lclxuICBwcm90ZWN0ZWQgX3RhcmdldDogU3RyZWFtPFQ+OyAvLyBpbWl0YXRpb24gdGFyZ2V0IGlmIHRoaXMgU3RyZWFtIHdpbGwgaW1pdGF0ZVxuICBwcm90ZWN0ZWQgX2VycjogYW55O1xuXG4gIGNvbnN0cnVjdG9yKHByb2R1Y2VyPzogSW50ZXJuYWxQcm9kdWNlcjxUPikge1xuICAgIHRoaXMuX3Byb2QgPSBwcm9kdWNlciB8fCBOTyBhcyBJbnRlcm5hbFByb2R1Y2VyPFQ+O1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIHRoaXMuX2RsID0gTk8gYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPjtcbiAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgdGhpcy5fdGFyZ2V0ID0gTk8gYXMgU3RyZWFtPFQ+O1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICB9XG5cbiAgX24odDogVCk6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIGlmICh0aGlzLl9kKSB0aGlzLl9kbC5fbih0KTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9uKHQpOyBlbHNlIGlmIChMID09IDApIHJldHVybjsgZWxzZSB7XG4gICAgICBjb25zdCBiID0gY3AoYSk7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IEw7IGkrKykgYltpXS5fbih0KTtcbiAgICB9XG4gIH1cblxuICBfZShlcnI6IGFueSk6IHZvaWQge1xuICAgIGlmICh0aGlzLl9lcnIgIT09IE5PKSByZXR1cm47XG4gICAgdGhpcy5fZXJyID0gZXJyO1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIHRoaXMuX3goKTtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX2UoZXJyKTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9lKGVycik7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9lKGVycik7XG4gICAgfVxuICAgIGlmICghdGhpcy5fZCAmJiBMID09IDApIHRocm93IHRoaXMuX2VycjtcbiAgfVxuXG4gIF9jKCk6IHZvaWQge1xuICAgIGNvbnN0IGEgPSB0aGlzLl9pbHM7XG4gICAgY29uc3QgTCA9IGEubGVuZ3RoO1xuICAgIHRoaXMuX3goKTtcbiAgICBpZiAodGhpcy5fZCkgdGhpcy5fZGwuX2MoKTtcbiAgICBpZiAoTCA9PSAxKSBhWzBdLl9jKCk7IGVsc2UgaWYgKEwgPT0gMCkgcmV0dXJuOyBlbHNlIHtcbiAgICAgIGNvbnN0IGIgPSBjcChhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTDsgaSsrKSBiW2ldLl9jKCk7XG4gICAgfVxuICB9XG5cbiAgX3goKTogdm9pZCB7IC8vIHRlYXIgZG93biBsb2dpYywgYWZ0ZXIgZXJyb3Igb3IgY29tcGxldGVcbiAgICBpZiAodGhpcy5faWxzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTykgdGhpcy5fcHJvZC5fc3RvcCgpO1xuICAgIHRoaXMuX2VyciA9IE5PO1xuICAgIHRoaXMuX2lscyA9IFtdO1xuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgLy8gV0FSTklORzogY29kZSB0aGF0IGNhbGxzIHRoaXMgbWV0aG9kIHNob3VsZFxuICAgIC8vIGZpcnN0IGNoZWNrIGlmIHRoaXMuX3Byb2QgaXMgdmFsaWQgKG5vdCBgTk9gKVxuICAgIHRoaXMuX3Byb2QuX3N0b3AoKTtcbiAgICB0aGlzLl9lcnIgPSBOTztcbiAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHJldHVybjtcbiAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3N0b3BJRCk7XG4gICAgICB0aGlzLl9zdG9wSUQgPSBOTztcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgICBpZiAocCAhPT0gTk8pIHAuX3N0YXJ0KHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIF9yZW1vdmUoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX3JlbW92ZShpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBjb25zdCBpID0gYS5pbmRleE9mKGlsKTtcbiAgICBpZiAoaSA+IC0xKSB7XG4gICAgICBhLnNwbGljZShpLCAxKTtcbiAgICAgIGlmICh0aGlzLl9wcm9kICE9PSBOTyAmJiBhLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgIHRoaXMuX2VyciA9IE5PO1xuICAgICAgICB0aGlzLl9zdG9wSUQgPSBzZXRUaW1lb3V0KCgpID0+IHRoaXMuX3N0b3BOb3coKSk7XG4gICAgICB9IGVsc2UgaWYgKGEubGVuZ3RoID09PSAxKSB7XG4gICAgICAgIHRoaXMuX3BydW5lQ3ljbGVzKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgYWxsIHBhdGhzIHN0ZW1taW5nIGZyb20gYHRoaXNgIHN0cmVhbSBldmVudHVhbGx5IGVuZCBhdCBgdGhpc2BcbiAgLy8gc3RyZWFtLCB0aGVuIHdlIHJlbW92ZSB0aGUgc2luZ2xlIGxpc3RlbmVyIG9mIGB0aGlzYCBzdHJlYW0sIHRvXG4gIC8vIGZvcmNlIGl0IHRvIGVuZCBpdHMgZXhlY3V0aW9uIGFuZCBkaXNwb3NlIHJlc291cmNlcy4gVGhpcyBtZXRob2RcbiAgLy8gYXNzdW1lcyBhcyBhIHByZWNvbmRpdGlvbiB0aGF0IHRoaXMuX2lscyBoYXMganVzdCBvbmUgbGlzdGVuZXIuXG4gIF9wcnVuZUN5Y2xlcygpIHtcbiAgICBpZiAodGhpcy5faGFzTm9TaW5rcyh0aGlzLCBbXSkpIHRoaXMuX3JlbW92ZSh0aGlzLl9pbHNbMF0pO1xuICB9XG5cbiAgLy8gQ2hlY2tzIHdoZXRoZXIgKnRoZXJlIGlzIG5vKiBwYXRoIHN0YXJ0aW5nIGZyb20gYHhgIHRoYXQgbGVhZHMgdG8gYW4gZW5kXG4gIC8vIGxpc3RlbmVyIChzaW5rKSBpbiB0aGUgc3RyZWFtIGdyYXBoLCBmb2xsb3dpbmcgZWRnZXMgQS0+QiB3aGVyZSBCIGlzIGFcbiAgLy8gbGlzdGVuZXIgb2YgQS4gVGhpcyBtZWFucyB0aGVzZSBwYXRocyBjb25zdGl0dXRlIGEgY3ljbGUgc29tZWhvdy4gSXMgZ2l2ZW5cbiAgLy8gYSB0cmFjZSBvZiBhbGwgdmlzaXRlZCBub2RlcyBzbyBmYXIuXG4gIF9oYXNOb1NpbmtzKHg6IEludGVybmFsTGlzdGVuZXI8YW55PiwgdHJhY2U6IEFycmF5PGFueT4pOiBib29sZWFuIHtcbiAgICBpZiAodHJhY2UuaW5kZXhPZih4KSAhPT0gLTEpXG4gICAgICByZXR1cm4gdHJ1ZTsgZWxzZVxuICAgIGlmICgoeCBhcyBhbnkgYXMgT3V0U2VuZGVyPGFueT4pLm91dCA9PT0gdGhpcylcbiAgICAgIHJldHVybiB0cnVlOyBlbHNlXG4gICAgaWYgKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ICYmICh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0ICE9PSBOTylcbiAgICAgIHJldHVybiB0aGlzLl9oYXNOb1NpbmtzKCh4IGFzIGFueSBhcyBPdXRTZW5kZXI8YW55Pikub3V0LCB0cmFjZS5jb25jYXQoeCkpOyBlbHNlXG4gICAgaWYgKCh4IGFzIFN0cmVhbTxhbnk+KS5faWxzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMCwgTiA9ICh4IGFzIFN0cmVhbTxhbnk+KS5faWxzLmxlbmd0aDsgaSA8IE47IGkrKylcbiAgICAgICAgaWYgKCF0aGlzLl9oYXNOb1NpbmtzKCh4IGFzIFN0cmVhbTxhbnk+KS5faWxzW2ldLCB0cmFjZS5jb25jYXQoeCkpKVxuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBwcml2YXRlIGN0b3IoKTogdHlwZW9mIFN0cmVhbSB7XG4gICAgcmV0dXJuIHRoaXMgaW5zdGFuY2VvZiBNZW1vcnlTdHJlYW0gPyBNZW1vcnlTdHJlYW0gOiBTdHJlYW07XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIExpc3RlbmVyIHRvIHRoZSBTdHJlYW0uXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXJ9IGxpc3RlbmVyXG4gICAqL1xuICBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiB2b2lkIHtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX24gPSBsaXN0ZW5lci5uZXh0IHx8IG5vb3A7XG4gICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAobGlzdGVuZXIgYXMgSW50ZXJuYWxMaXN0ZW5lcjxUPikuX2MgPSBsaXN0ZW5lci5jb21wbGV0ZSB8fCBub29wO1xuICAgIHRoaXMuX2FkZChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgTGlzdGVuZXIgZnJvbSB0aGUgU3RyZWFtLCBhc3N1bWluZyB0aGUgTGlzdGVuZXIgd2FzIGFkZGVkIHRvIGl0LlxuICAgKlxuICAgKiBAcGFyYW0ge0xpc3RlbmVyPFQ+fSBsaXN0ZW5lclxuICAgKi9cbiAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXI6IFBhcnRpYWw8TGlzdGVuZXI8VD4+KTogdm9pZCB7XG4gICAgdGhpcy5fcmVtb3ZlKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgYSBMaXN0ZW5lciB0byB0aGUgU3RyZWFtIHJldHVybmluZyBhIFN1YnNjcmlwdGlvbiB0byByZW1vdmUgdGhhdFxuICAgKiBsaXN0ZW5lci5cbiAgICpcbiAgICogQHBhcmFtIHtMaXN0ZW5lcn0gbGlzdGVuZXJcbiAgICogQHJldHVybnMge1N1YnNjcmlwdGlvbn1cbiAgICovXG4gIHN1YnNjcmliZShsaXN0ZW5lcjogUGFydGlhbDxMaXN0ZW5lcjxUPj4pOiBTdWJzY3JpcHRpb24ge1xuICAgIHRoaXMuYWRkTGlzdGVuZXIobGlzdGVuZXIpO1xuICAgIHJldHVybiBuZXcgU3RyZWFtU3ViPFQ+KHRoaXMsIGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZCBpbnRlcm9wIGJldHdlZW4gbW9zdC5qcyBhbmQgUnhKUyA1XG4gICAqXG4gICAqIEByZXR1cm5zIHtTdHJlYW19XG4gICAqL1xuICBbJCRvYnNlcnZhYmxlXSgpOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgU3RyZWFtIGdpdmVuIGEgUHJvZHVjZXIuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtQcm9kdWNlcn0gcHJvZHVjZXIgQW4gb3B0aW9uYWwgUHJvZHVjZXIgdGhhdCBkaWN0YXRlcyBob3cgdG9cbiAgICogc3RhcnQsIGdlbmVyYXRlIGV2ZW50cywgYW5kIHN0b3AgdGhlIFN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGNyZWF0ZTxUPihwcm9kdWNlcj86IFByb2R1Y2VyPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICBpZiAocHJvZHVjZXIpIHtcbiAgICAgIGlmICh0eXBlb2YgcHJvZHVjZXIuc3RhcnQgIT09ICdmdW5jdGlvbidcbiAgICAgIHx8IHR5cGVvZiBwcm9kdWNlci5zdG9wICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2R1Y2VyIHJlcXVpcmVzIGJvdGggc3RhcnQgYW5kIHN0b3AgZnVuY3Rpb25zJyk7XG4gICAgICBpbnRlcm5hbGl6ZVByb2R1Y2VyKHByb2R1Y2VyKTsgLy8gbXV0YXRlcyB0aGUgaW5wdXRcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBTdHJlYW0ocHJvZHVjZXIgYXMgSW50ZXJuYWxQcm9kdWNlcjxUPiAmIFByb2R1Y2VyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IE1lbW9yeVN0cmVhbSBnaXZlbiBhIFByb2R1Y2VyLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvZHVjZXJ9IHByb2R1Y2VyIEFuIG9wdGlvbmFsIFByb2R1Y2VyIHRoYXQgZGljdGF0ZXMgaG93IHRvXG4gICAqIHN0YXJ0LCBnZW5lcmF0ZSBldmVudHMsIGFuZCBzdG9wIHRoZSBTdHJlYW0uXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjcmVhdGVXaXRoTWVtb3J5PFQ+KHByb2R1Y2VyPzogUHJvZHVjZXI8VD4pOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIGlmIChwcm9kdWNlcikgaW50ZXJuYWxpemVQcm9kdWNlcihwcm9kdWNlcik7IC8vIG11dGF0ZXMgdGhlIGlucHV0XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4ocHJvZHVjZXIgYXMgSW50ZXJuYWxQcm9kdWNlcjxUPiAmIFByb2R1Y2VyPFQ+KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgZG9lcyBub3RoaW5nIHdoZW4gc3RhcnRlZC4gSXQgbmV2ZXIgZW1pdHMgYW55IGV2ZW50LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAgICAgICAgICBuZXZlclxuICAgKiAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgbmV2ZXIoKTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe19zdGFydDogbm9vcCwgX3N0b3A6IG5vb3B9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgU3RyZWFtIHRoYXQgaW1tZWRpYXRlbHkgZW1pdHMgdGhlIFwiY29tcGxldGVcIiBub3RpZmljYXRpb24gd2hlblxuICAgKiBzdGFydGVkLCBhbmQgdGhhdCdzIGl0LlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiBlbXB0eVxuICAgKiAtfFxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZW1wdHkoKTogU3RyZWFtPGFueT4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPGFueT4oe1xuICAgICAgX3N0YXJ0KGlsOiBJbnRlcm5hbExpc3RlbmVyPGFueT4pIHsgaWwuX2MoKTsgfSxcbiAgICAgIF9zdG9wOiBub29wLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyBhbiBcImVycm9yXCIgbm90aWZpY2F0aW9uIHdpdGggdGhlXG4gICAqIHZhbHVlIHlvdSBwYXNzZWQgYXMgdGhlIGBlcnJvcmAgYXJndW1lbnQgd2hlbiB0aGUgc3RyZWFtIHN0YXJ0cywgYW5kIHRoYXQnc1xuICAgKiBpdC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogdGhyb3coWClcbiAgICogLVhcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIGVycm9yIFRoZSBlcnJvciBldmVudCB0byBlbWl0IG9uIHRoZSBjcmVhdGVkIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIHRocm93KGVycm9yOiBhbnkpOiBTdHJlYW08YW55PiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55Pih7XG4gICAgICBfc3RhcnQoaWw6IEludGVybmFsTGlzdGVuZXI8YW55PikgeyBpbC5fZShlcnJvcik7IH0sXG4gICAgICBfc3RvcDogbm9vcCxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgc3RyZWFtIGZyb20gYW4gQXJyYXksIFByb21pc2UsIG9yIGFuIE9ic2VydmFibGUuXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtBcnJheXxQcm9taXNlTGlrZXxPYnNlcnZhYmxlfSBpbnB1dCBUaGUgaW5wdXQgdG8gbWFrZSBhIHN0cmVhbSBmcm9tLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbTxUPihpbnB1dDogUHJvbWlzZUxpa2U8VD4gfCBTdHJlYW08VD4gfCBBcnJheTxUPiB8IE9ic2VydmFibGU8VD4pOiBTdHJlYW08VD4ge1xuICAgIGlmICh0eXBlb2YgaW5wdXRbJCRvYnNlcnZhYmxlXSA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbU9ic2VydmFibGU8VD4oaW5wdXQgYXMgT2JzZXJ2YWJsZTxUPik7IGVsc2VcbiAgICBpZiAodHlwZW9mIChpbnB1dCBhcyBQcm9taXNlTGlrZTxUPikudGhlbiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgIHJldHVybiBTdHJlYW0uZnJvbVByb21pc2U8VD4oaW5wdXQgYXMgUHJvbWlzZUxpa2U8VD4pOyBlbHNlXG4gICAgaWYgKEFycmF5LmlzQXJyYXkoaW5wdXQpKVxuICAgICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXk8VD4oaW5wdXQpO1xuXG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgVHlwZSBvZiBpbnB1dCB0byBmcm9tKCkgbXVzdCBiZSBhbiBBcnJheSwgUHJvbWlzZSwgb3IgT2JzZXJ2YWJsZWApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBTdHJlYW0gdGhhdCBpbW1lZGlhdGVseSBlbWl0cyB0aGUgYXJndW1lbnRzIHRoYXQgeW91IGdpdmUgdG9cbiAgICogKm9mKiwgdGhlbiBjb21wbGV0ZXMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIG9mKDEsMiwzKVxuICAgKiAxMjN8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSBhIFRoZSBmaXJzdCB2YWx1ZSB5b3Ugd2FudCB0byBlbWl0IGFzIGFuIGV2ZW50IG9uIHRoZSBzdHJlYW0uXG4gICAqIEBwYXJhbSBiIFRoZSBzZWNvbmQgdmFsdWUgeW91IHdhbnQgdG8gZW1pdCBhcyBhbiBldmVudCBvbiB0aGUgc3RyZWFtLiBPbmVcbiAgICogb3IgbW9yZSBvZiB0aGVzZSB2YWx1ZXMgbWF5IGJlIGdpdmVuIGFzIGFyZ3VtZW50cy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIG9mPFQ+KC4uLml0ZW1zOiBBcnJheTxUPik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIFN0cmVhbS5mcm9tQXJyYXk8VD4oaXRlbXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIGFuIGFycmF5IHRvIGEgc3RyZWFtLiBUaGUgcmV0dXJuZWQgc3RyZWFtIHdpbGwgZW1pdCBzeW5jaHJvbm91c2x5XG4gICAqIGFsbCB0aGUgaXRlbXMgaW4gdGhlIGFycmF5LCBhbmQgdGhlbiBjb21wbGV0ZS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZnJvbUFycmF5KFsxLDIsM10pXG4gICAqIDEyM3xcbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtBcnJheX0gYXJyYXkgVGhlIGFycmF5IHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21BcnJheTxUPihhcnJheTogQXJyYXk8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tQXJyYXk8VD4oYXJyYXkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyBhIHByb21pc2UgdG8gYSBzdHJlYW0uIFRoZSByZXR1cm5lZCBzdHJlYW0gd2lsbCBlbWl0IHRoZSByZXNvbHZlZFxuICAgKiB2YWx1ZSBvZiB0aGUgcHJvbWlzZSwgYW5kIHRoZW4gY29tcGxldGUuIEhvd2V2ZXIsIGlmIHRoZSBwcm9taXNlIGlzXG4gICAqIHJlamVjdGVkLCB0aGUgc3RyZWFtIHdpbGwgZW1pdCB0aGUgY29ycmVzcG9uZGluZyBlcnJvci5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogZnJvbVByb21pc2UoIC0tLS00MiApXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tNDJ8XG4gICAqIGBgYFxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7UHJvbWlzZUxpa2V9IHByb21pc2UgVGhlIHByb21pc2UgdG8gYmUgY29udmVydGVkIGFzIGEgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgZnJvbVByb21pc2U8VD4ocHJvbWlzZTogUHJvbWlzZUxpa2U8VD4pOiBTdHJlYW08VD4ge1xuICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGcm9tUHJvbWlzZTxUPihwcm9taXNlKSk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgYW4gT2JzZXJ2YWJsZSBpbnRvIGEgU3RyZWFtLlxuICAgKlxuICAgKiBAZmFjdG9yeSB0cnVlXG4gICAqIEBwYXJhbSB7YW55fSBvYnNlcnZhYmxlIFRoZSBvYnNlcnZhYmxlIHRvIGJlIGNvbnZlcnRlZCBhcyBhIHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgc3RhdGljIGZyb21PYnNlcnZhYmxlPFQ+KG9iczoge3N1YnNjcmliZTogYW55fSk6IFN0cmVhbTxUPiB7XG4gICAgaWYgKChvYnMgYXMgU3RyZWFtPFQ+KS5lbmRXaGVuKSByZXR1cm4gb2JzIGFzIFN0cmVhbTxUPjtcbiAgICBjb25zdCBvID0gdHlwZW9mIG9ic1skJG9ic2VydmFibGVdID09PSAnZnVuY3Rpb24nID8gb2JzWyQkb2JzZXJ2YWJsZV0oKSA6IG9icztcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRnJvbU9ic2VydmFibGUobykpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBzdHJlYW0gdGhhdCBwZXJpb2RpY2FsbHkgZW1pdHMgaW5jcmVtZW50YWwgbnVtYmVycywgZXZlcnlcbiAgICogYHBlcmlvZGAgbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAgICAgcGVyaW9kaWMoMTAwMClcbiAgICogLS0tMC0tLTEtLS0yLS0tMy0tLTQtLS0uLi5cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtudW1iZXJ9IHBlcmlvZCBUaGUgaW50ZXJ2YWwgaW4gbWlsbGlzZWNvbmRzIHRvIHVzZSBhcyBhIHJhdGUgb2ZcbiAgICogZW1pc3Npb24uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBwZXJpb2RpYyhwZXJpb2Q6IG51bWJlcik6IFN0cmVhbTxudW1iZXI+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxudW1iZXI+KG5ldyBQZXJpb2RpYyhwZXJpb2QpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBCbGVuZHMgbXVsdGlwbGUgc3RyZWFtcyB0b2dldGhlciwgZW1pdHRpbmcgZXZlbnRzIGZyb20gYWxsIG9mIHRoZW1cbiAgICogY29uY3VycmVudGx5LlxuICAgKlxuICAgKiAqbWVyZ2UqIHRha2VzIG11bHRpcGxlIHN0cmVhbXMgYXMgYXJndW1lbnRzLCBhbmQgY3JlYXRlcyBhIHN0cmVhbSB0aGF0XG4gICAqIGJlaGF2ZXMgbGlrZSBlYWNoIG9mIHRoZSBhcmd1bWVudCBzdHJlYW1zLCBpbiBwYXJhbGxlbC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLS0tLTQtLS1cbiAgICogLS0tLWEtLS0tLWItLS0tYy0tLWQtLS0tLS1cbiAgICogICAgICAgICAgICBtZXJnZVxuICAgKiAtLTEtYS0tMi0tYi0tMy1jLS0tZC0tNC0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQGZhY3RvcnkgdHJ1ZVxuICAgKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtMSBBIHN0cmVhbSB0byBtZXJnZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIG1lcmdlIHRvZ2V0aGVyIHdpdGggb3RoZXIgc3RyZWFtcy4gVHdvXG4gICAqIG9yIG1vcmUgc3RyZWFtcyBtYXkgYmUgZ2l2ZW4gYXMgYXJndW1lbnRzLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBzdGF0aWMgbWVyZ2U6IE1lcmdlU2lnbmF0dXJlID0gZnVuY3Rpb24gbWVyZ2UoLi4uc3RyZWFtczogQXJyYXk8U3RyZWFtPGFueT4+KSB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08YW55PihuZXcgTWVyZ2Uoc3RyZWFtcykpO1xuICB9IGFzIE1lcmdlU2lnbmF0dXJlO1xuXG4gIC8qKlxuICAgKiBDb21iaW5lcyBtdWx0aXBsZSBpbnB1dCBzdHJlYW1zIHRvZ2V0aGVyIHRvIHJldHVybiBhIHN0cmVhbSB3aG9zZSBldmVudHNcbiAgICogYXJlIGFycmF5cyB0aGF0IGNvbGxlY3QgdGhlIGxhdGVzdCBldmVudHMgZnJvbSBlYWNoIGlucHV0IHN0cmVhbS5cbiAgICpcbiAgICogKmNvbWJpbmUqIGludGVybmFsbHkgcmVtZW1iZXJzIHRoZSBtb3N0IHJlY2VudCBldmVudCBmcm9tIGVhY2ggb2YgdGhlIGlucHV0XG4gICAqIHN0cmVhbXMuIFdoZW4gYW55IG9mIHRoZSBpbnB1dCBzdHJlYW1zIGVtaXRzIGFuIGV2ZW50LCB0aGF0IGV2ZW50IHRvZ2V0aGVyXG4gICAqIHdpdGggYWxsIHRoZSBvdGhlciBzYXZlZCBldmVudHMgYXJlIGNvbWJpbmVkIGludG8gYW4gYXJyYXkuIFRoYXQgYXJyYXkgd2lsbFxuICAgKiBiZSBlbWl0dGVkIG9uIHRoZSBvdXRwdXQgc3RyZWFtLiBJdCdzIGVzc2VudGlhbGx5IGEgd2F5IG9mIGpvaW5pbmcgdG9nZXRoZXJcbiAgICogdGhlIGV2ZW50cyBmcm9tIG11bHRpcGxlIHN0cmVhbXMuXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLS0yLS0tLS0zLS0tLS0tLS00LS0tXG4gICAqIC0tLS1hLS0tLS1iLS0tLS1jLS1kLS0tLS0tXG4gICAqICAgICAgICAgIGNvbWJpbmVcbiAgICogLS0tLTFhLTJhLTJiLTNiLTNjLTNkLTRkLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBmYWN0b3J5IHRydWVcbiAgICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbTEgQSBzdHJlYW0gdG8gY29tYmluZSB0b2dldGhlciB3aXRoIG90aGVyIHN0cmVhbXMuXG4gICAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0yIEEgc3RyZWFtIHRvIGNvbWJpbmUgdG9nZXRoZXIgd2l0aCBvdGhlciBzdHJlYW1zLlxuICAgKiBNdWx0aXBsZSBzdHJlYW1zLCBub3QganVzdCB0d28sIG1heSBiZSBnaXZlbiBhcyBhcmd1bWVudHMuXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIHN0YXRpYyBjb21iaW5lOiBDb21iaW5lU2lnbmF0dXJlID0gZnVuY3Rpb24gY29tYmluZSguLi5zdHJlYW1zOiBBcnJheTxTdHJlYW08YW55Pj4pIHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxBcnJheTxhbnk+PihuZXcgQ29tYmluZTxhbnk+KHN0cmVhbXMpKTtcbiAgfSBhcyBDb21iaW5lU2lnbmF0dXJlO1xuXG4gIHByb3RlY3RlZCBfbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogU3RyZWFtPFU+IHwgTWVtb3J5U3RyZWFtPFU+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VT4obmV3IE1hcE9wPFQsIFU+KHByb2plY3QsIHRoaXMpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIHRocm91Z2ggYSBgcHJvamVjdGAgZnVuY3Rpb24sXG4gICAqIHRvIGdldCBhIFN0cmVhbSB0aGF0IGVtaXRzIHRob3NlIHRyYW5zZm9ybWVkIGV2ZW50cy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMy0tNS0tLS0tNy0tLS0tLVxuICAgKiAgICBtYXAoaSA9PiBpICogMTApXG4gICAqIC0tMTAtLTMwLTUwLS0tLTcwLS0tLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IHByb2plY3QgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gVWAgdGhhdCB0YWtlcyBldmVudFxuICAgKiBgdGAgb2YgdHlwZSBgVGAgZnJvbSB0aGUgaW5wdXQgU3RyZWFtIGFuZCBwcm9kdWNlcyBhbiBldmVudCBvZiB0eXBlIGBVYCwgdG9cbiAgICogYmUgZW1pdHRlZCBvbiB0aGUgb3V0cHV0IFN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgbWFwPFU+KHByb2plY3Q6ICh0OiBUKSA9PiBVKTogU3RyZWFtPFU+IHtcbiAgICByZXR1cm4gdGhpcy5fbWFwKHByb2plY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEl0J3MgbGlrZSBgbWFwYCwgYnV0IHRyYW5zZm9ybXMgZWFjaCBpbnB1dCBldmVudCB0byBhbHdheXMgdGhlIHNhbWVcbiAgICogY29uc3RhbnQgdmFsdWUgb24gdGhlIG91dHB1dCBTdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tMS0tLTMtLTUtLS0tLTctLS0tLVxuICAgKiAgICAgICBtYXBUbygxMClcbiAgICogLS0xMC0tMTAtMTAtLS0tMTAtLS0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0gcHJvamVjdGVkVmFsdWUgQSB2YWx1ZSB0byBlbWl0IG9uIHRoZSBvdXRwdXQgU3RyZWFtIHdoZW5ldmVyIHRoZVxuICAgKiBpbnB1dCBTdHJlYW0gZW1pdHMgYW55IHZhbHVlLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBtYXBUbzxVPihwcm9qZWN0ZWRWYWx1ZTogVSk6IFN0cmVhbTxVPiB7XG4gICAgY29uc3QgcyA9IHRoaXMubWFwKCgpID0+IHByb2plY3RlZFZhbHVlKTtcbiAgICBjb25zdCBvcDogT3BlcmF0b3I8VCwgVT4gPSBzLl9wcm9kIGFzIE9wZXJhdG9yPFQsIFU+O1xuICAgIG9wLnR5cGUgPSAnbWFwVG8nO1xuICAgIHJldHVybiBzO1xuICB9XG5cbiAgZmlsdGVyPFMgZXh0ZW5kcyBUPihwYXNzZXM6ICh0OiBUKSA9PiB0IGlzIFMpOiBTdHJlYW08Uz47XG4gIGZpbHRlcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuKTogU3RyZWFtPFQ+O1xuICAvKipcbiAgICogT25seSBhbGxvd3MgZXZlbnRzIHRoYXQgcGFzcyB0aGUgdGVzdCBnaXZlbiBieSB0aGUgYHBhc3Nlc2AgYXJndW1lbnQuXG4gICAqXG4gICAqIEVhY2ggZXZlbnQgZnJvbSB0aGUgaW5wdXQgc3RyZWFtIGlzIGdpdmVuIHRvIHRoZSBgcGFzc2VzYCBmdW5jdGlvbi4gSWYgdGhlXG4gICAqIGZ1bmN0aW9uIHJldHVybnMgYHRydWVgLCB0aGUgZXZlbnQgaXMgZm9yd2FyZGVkIHRvIHRoZSBvdXRwdXQgc3RyZWFtLFxuICAgKiBvdGhlcndpc2UgaXQgaXMgaWdub3JlZCBhbmQgbm90IGZvcndhcmRlZC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMi0tMy0tLS0tNC0tLS0tNS0tLTYtLTctOC0tXG4gICAqICAgICBmaWx0ZXIoaSA9PiBpICUgMiA9PT0gMClcbiAgICogLS0tLS0tMi0tLS0tLS0tNC0tLS0tLS0tLTYtLS0tOC0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBwYXNzZXMgQSBmdW5jdGlvbiBvZiB0eXBlIGAodDogVCkgPT4gYm9vbGVhbmAgdGhhdCB0YWtlc1xuICAgKiBhbiBldmVudCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gYW5kIGNoZWNrcyBpZiBpdCBwYXNzZXMsIGJ5IHJldHVybmluZyBhXG4gICAqIGJvb2xlYW4uXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGZpbHRlcihwYXNzZXM6ICh0OiBUKSA9PiBib29sZWFuKTogU3RyZWFtPFQ+IHtcbiAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICBpZiAocCBpbnN0YW5jZW9mIEZpbHRlcilcbiAgICAgIHJldHVybiBuZXcgU3RyZWFtPFQ+KG5ldyBGaWx0ZXI8VD4oXG4gICAgICAgIGFuZCgocCBhcyBGaWx0ZXI8VD4pLmYsIHBhc3NlcyksXG4gICAgICAgIChwIGFzIEZpbHRlcjxUPikuaW5zXG4gICAgICApKTtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgRmlsdGVyPFQ+KHBhc3NlcywgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIExldHMgdGhlIGZpcnN0IGBhbW91bnRgIG1hbnkgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSBwYXNzIHRvIHRoZVxuICAgKiBvdXRwdXQgc3RyZWFtLCB0aGVuIG1ha2VzIHRoZSBvdXRwdXQgc3RyZWFtIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS0tLWQtLS1lLS1cbiAgICogICAgdGFrZSgzKVxuICAgKiAtLWEtLS1iLS1jfFxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCBIb3cgbWFueSBldmVudHMgdG8gYWxsb3cgZnJvbSB0aGUgaW5wdXQgc3RyZWFtXG4gICAqIGJlZm9yZSBjb21wbGV0aW5nIHRoZSBvdXRwdXQgc3RyZWFtLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICB0YWtlKGFtb3VudDogbnVtYmVyKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IFRha2U8VD4oYW1vdW50LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogSWdub3JlcyB0aGUgZmlyc3QgYGFtb3VudGAgbWFueSBldmVudHMgZnJvbSB0aGUgaW5wdXQgc3RyZWFtLCBhbmQgdGhlblxuICAgKiBhZnRlciB0aGF0IHN0YXJ0cyBmb3J3YXJkaW5nIGV2ZW50cyBmcm9tIHRoZSBpbnB1dCBzdHJlYW0gdG8gdGhlIG91dHB1dFxuICAgKiBzdHJlYW0uXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tYS0tLWItLWMtLS0tZC0tLWUtLVxuICAgKiAgICAgICBkcm9wKDMpXG4gICAqIC0tLS0tLS0tLS0tLS0tZC0tLWUtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFtb3VudCBIb3cgbWFueSBldmVudHMgdG8gaWdub3JlIGZyb20gdGhlIGlucHV0IHN0cmVhbVxuICAgKiBiZWZvcmUgZm9yd2FyZGluZyBhbGwgZXZlbnRzIGZyb20gdGhlIGlucHV0IHN0cmVhbSB0byB0aGUgb3V0cHV0IHN0cmVhbS5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgZHJvcChhbW91bnQ6IG51bWJlcik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08VD4obmV3IERyb3A8VD4oYW1vdW50LCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogV2hlbiB0aGUgaW5wdXQgc3RyZWFtIGNvbXBsZXRlcywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBlbWl0IHRoZSBsYXN0IGV2ZW50XG4gICAqIGVtaXR0ZWQgYnkgdGhlIGlucHV0IHN0cmVhbSwgYW5kIHRoZW4gd2lsbCBhbHNvIGNvbXBsZXRlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLWEtLS1iLS1jLS1kLS0tLXxcbiAgICogICAgICAgbGFzdCgpXG4gICAqIC0tLS0tLS0tLS0tLS0tLS0tZHxcbiAgICogYGBgXG4gICAqXG4gICAqIEByZXR1cm4ge1N0cmVhbX1cbiAgICovXG4gIGxhc3QoKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3IFN0cmVhbTxUPihuZXcgTGFzdDxUPih0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogUHJlcGVuZHMgdGhlIGdpdmVuIGBpbml0aWFsYCB2YWx1ZSB0byB0aGUgc2VxdWVuY2Ugb2YgZXZlbnRzIGVtaXR0ZWQgYnkgdGhlXG4gICAqIGlucHV0IHN0cmVhbS4gVGhlIHJldHVybmVkIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXNcbiAgICogYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tMS0tLTItLS0tLTMtLS1cbiAgICogICBzdGFydFdpdGgoMClcbiAgICogMC0tMS0tLTItLS0tLTMtLS1cbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBpbml0aWFsIFRoZSB2YWx1ZSBvciBldmVudCB0byBwcmVwZW5kLlxuICAgKiBAcmV0dXJuIHtNZW1vcnlTdHJlYW19XG4gICAqL1xuICBzdGFydFdpdGgoaW5pdGlhbDogVCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4obmV3IFN0YXJ0V2l0aDxUPih0aGlzLCBpbml0aWFsKSk7XG4gIH1cblxuICAvKipcbiAgICogVXNlcyBhbm90aGVyIHN0cmVhbSB0byBkZXRlcm1pbmUgd2hlbiB0byBjb21wbGV0ZSB0aGUgY3VycmVudCBzdHJlYW0uXG4gICAqXG4gICAqIFdoZW4gdGhlIGdpdmVuIGBvdGhlcmAgc3RyZWFtIGVtaXRzIGFuIGV2ZW50IG9yIGNvbXBsZXRlcywgdGhlIG91dHB1dFxuICAgKiBzdHJlYW0gd2lsbCBjb21wbGV0ZS4gQmVmb3JlIHRoYXQgaGFwcGVucywgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCBiZWhhdmVzXG4gICAqIGxpa2UgdGhlIGlucHV0IHN0cmVhbS5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0tMS0tLTItLS0tLTMtLTQtLS0tNS0tLS02LS0tXG4gICAqICAgZW5kV2hlbiggLS0tLS0tLS1hLS1iLS18IClcbiAgICogLS0tMS0tLTItLS0tLTMtLTQtLXxcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBvdGhlciBTb21lIG90aGVyIHN0cmVhbSB0aGF0IGlzIHVzZWQgdG8ga25vdyB3aGVuIHNob3VsZCB0aGUgb3V0cHV0XG4gICAqIHN0cmVhbSBvZiB0aGlzIG9wZXJhdG9yIGNvbXBsZXRlLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IFN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jdG9yKCkpPFQ+KG5ldyBFbmRXaGVuPFQ+KG90aGVyLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogXCJGb2xkc1wiIHRoZSBzdHJlYW0gb250byBpdHNlbGYuXG4gICAqXG4gICAqIENvbWJpbmVzIGV2ZW50cyBmcm9tIHRoZSBwYXN0IHRocm91Z2hvdXRcbiAgICogdGhlIGVudGlyZSBleGVjdXRpb24gb2YgdGhlIGlucHV0IHN0cmVhbSwgYWxsb3dpbmcgeW91IHRvIGFjY3VtdWxhdGUgdGhlbVxuICAgKiB0b2dldGhlci4gSXQncyBlc3NlbnRpYWxseSBsaWtlIGBBcnJheS5wcm90b3R5cGUucmVkdWNlYC4gVGhlIHJldHVybmVkXG4gICAqIHN0cmVhbSBpcyBhIE1lbW9yeVN0cmVhbSwgd2hpY2ggbWVhbnMgaXQgaXMgYWxyZWFkeSBgcmVtZW1iZXIoKWAnZC5cbiAgICpcbiAgICogVGhlIG91dHB1dCBzdHJlYW0gc3RhcnRzIGJ5IGVtaXR0aW5nIHRoZSBgc2VlZGAgd2hpY2ggeW91IGdpdmUgYXMgYXJndW1lbnQuXG4gICAqIFRoZW4sIHdoZW4gYW4gZXZlbnQgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpdCBpcyBjb21iaW5lZCB3aXRoIHRoYXRcbiAgICogc2VlZCB2YWx1ZSB0aHJvdWdoIHRoZSBgYWNjdW11bGF0ZWAgZnVuY3Rpb24sIGFuZCB0aGUgb3V0cHV0IHZhbHVlIGlzXG4gICAqIGVtaXR0ZWQgb24gdGhlIG91dHB1dCBzdHJlYW0uIGBmb2xkYCByZW1lbWJlcnMgdGhhdCBvdXRwdXQgdmFsdWUgYXMgYGFjY2BcbiAgICogKFwiYWNjdW11bGF0b3JcIiksIGFuZCB0aGVuIHdoZW4gYSBuZXcgaW5wdXQgZXZlbnQgYHRgIGhhcHBlbnMsIGBhY2NgIHdpbGwgYmVcbiAgICogY29tYmluZWQgd2l0aCB0aGF0IHRvIHByb2R1Y2UgdGhlIG5ldyBgYWNjYCBhbmQgc28gZm9ydGguXG4gICAqXG4gICAqIE1hcmJsZSBkaWFncmFtOlxuICAgKlxuICAgKiBgYGB0ZXh0XG4gICAqIC0tLS0tLTEtLS0tLTEtLTItLS0tMS0tLS0xLS0tLS0tXG4gICAqICAgZm9sZCgoYWNjLCB4KSA9PiBhY2MgKyB4LCAzKVxuICAgKiAzLS0tLS00LS0tLS01LS03LS0tLTgtLS0tOS0tLS0tLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gYWNjdW11bGF0ZSBBIGZ1bmN0aW9uIG9mIHR5cGUgYChhY2M6IFIsIHQ6IFQpID0+IFJgIHRoYXRcbiAgICogdGFrZXMgdGhlIHByZXZpb3VzIGFjY3VtdWxhdGVkIHZhbHVlIGBhY2NgIGFuZCB0aGUgaW5jb21pbmcgZXZlbnQgZnJvbSB0aGVcbiAgICogaW5wdXQgc3RyZWFtIGFuZCBwcm9kdWNlcyB0aGUgbmV3IGFjY3VtdWxhdGVkIHZhbHVlLlxuICAgKiBAcGFyYW0gc2VlZCBUaGUgaW5pdGlhbCBhY2N1bXVsYXRlZCB2YWx1ZSwgb2YgdHlwZSBgUmAuXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIGZvbGQ8Uj4oYWNjdW11bGF0ZTogKGFjYzogUiwgdDogVCkgPT4gUiwgc2VlZDogUik6IE1lbW9yeVN0cmVhbTxSPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08Uj4obmV3IEZvbGQ8VCwgUj4oYWNjdW11bGF0ZSwgc2VlZCwgdGhpcykpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlcGxhY2VzIGFuIGVycm9yIHdpdGggYW5vdGhlciBzdHJlYW0uXG4gICAqXG4gICAqIFdoZW4gKGFuZCBpZikgYW4gZXJyb3IgaGFwcGVucyBvbiB0aGUgaW5wdXQgc3RyZWFtLCBpbnN0ZWFkIG9mIGZvcndhcmRpbmdcbiAgICogdGhhdCBlcnJvciB0byB0aGUgb3V0cHV0IHN0cmVhbSwgKnJlcGxhY2VFcnJvciogd2lsbCBjYWxsIHRoZSBgcmVwbGFjZWBcbiAgICogZnVuY3Rpb24gd2hpY2ggcmV0dXJucyB0aGUgc3RyZWFtIHRoYXQgdGhlIG91dHB1dCBzdHJlYW0gd2lsbCByZXBsaWNhdGUuXG4gICAqIEFuZCwgaW4gY2FzZSB0aGF0IG5ldyBzdHJlYW0gYWxzbyBlbWl0cyBhbiBlcnJvciwgYHJlcGxhY2VgIHdpbGwgYmUgY2FsbGVkXG4gICAqIGFnYWluIHRvIGdldCBhbm90aGVyIHN0cmVhbSB0byBzdGFydCByZXBsaWNhdGluZy5cbiAgICpcbiAgICogTWFyYmxlIGRpYWdyYW06XG4gICAqXG4gICAqIGBgYHRleHRcbiAgICogLS0xLS0tMi0tLS0tMy0tNC0tLS0tWFxuICAgKiAgIHJlcGxhY2VFcnJvciggKCkgPT4gLS0xMC0tfCApXG4gICAqIC0tMS0tLTItLS0tLTMtLTQtLS0tLS0tLTEwLS18XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXBsYWNlIEEgZnVuY3Rpb24gb2YgdHlwZSBgKGVycikgPT4gU3RyZWFtYCB0aGF0IHRha2VzXG4gICAqIHRoZSBlcnJvciB0aGF0IG9jY3VycmVkIG9uIHRoZSBpbnB1dCBzdHJlYW0gb3Igb24gdGhlIHByZXZpb3VzIHJlcGxhY2VtZW50XG4gICAqIHN0cmVhbSBhbmQgcmV0dXJucyBhIG5ldyBzdHJlYW0uIFRoZSBvdXRwdXQgc3RyZWFtIHdpbGwgYmVoYXZlIGxpa2UgdGhlXG4gICAqIHN0cmVhbSB0aGF0IHRoaXMgZnVuY3Rpb24gcmV0dXJucy5cbiAgICogQHJldHVybiB7U3RyZWFtfVxuICAgKi9cbiAgcmVwbGFjZUVycm9yKHJlcGxhY2U6IChlcnI6IGFueSkgPT4gU3RyZWFtPFQ+KTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IFJlcGxhY2VFcnJvcjxUPihyZXBsYWNlLCB0aGlzKSk7XG4gIH1cblxuICAvKipcbiAgICogRmxhdHRlbnMgYSBcInN0cmVhbSBvZiBzdHJlYW1zXCIsIGhhbmRsaW5nIG9ubHkgb25lIG5lc3RlZCBzdHJlYW0gYXQgYSB0aW1lXG4gICAqIChubyBjb25jdXJyZW5jeSkuXG4gICAqXG4gICAqIElmIHRoZSBpbnB1dCBzdHJlYW0gaXMgYSBzdHJlYW0gdGhhdCBlbWl0cyBzdHJlYW1zLCB0aGVuIHRoaXMgb3BlcmF0b3Igd2lsbFxuICAgKiByZXR1cm4gYW4gb3V0cHV0IHN0cmVhbSB3aGljaCBpcyBhIGZsYXQgc3RyZWFtOiBlbWl0cyByZWd1bGFyIGV2ZW50cy4gVGhlXG4gICAqIGZsYXR0ZW5pbmcgaGFwcGVucyB3aXRob3V0IGNvbmN1cnJlbmN5LiBJdCB3b3JrcyBsaWtlIHRoaXM6IHdoZW4gdGhlIGlucHV0XG4gICAqIHN0cmVhbSBlbWl0cyBhIG5lc3RlZCBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIHN0YXJ0IGltaXRhdGluZyB0aGF0IG5lc3RlZFxuICAgKiBvbmUuIEhvd2V2ZXIsIGFzIHNvb24gYXMgdGhlIG5leHQgbmVzdGVkIHN0cmVhbSBpcyBlbWl0dGVkIG9uIHRoZSBpbnB1dFxuICAgKiBzdHJlYW0sICpmbGF0dGVuKiB3aWxsIGZvcmdldCB0aGUgcHJldmlvdXMgbmVzdGVkIG9uZSBpdCB3YXMgaW1pdGF0aW5nLCBhbmRcbiAgICogd2lsbCBzdGFydCBpbWl0YXRpbmcgdGhlIG5ldyBuZXN0ZWQgb25lLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLSstLS0tLS0tLSstLS0tLS0tLS0tLS0tLS1cbiAgICogICBcXCAgICAgICAgXFxcbiAgICogICAgXFwgICAgICAgLS0tLTEtLS0tMi0tLTMtLVxuICAgKiAgICAtLWEtLWItLS0tYy0tLS1kLS0tLS0tLS1cbiAgICogICAgICAgICAgIGZsYXR0ZW5cbiAgICogLS0tLS1hLS1iLS0tLS0tMS0tLS0yLS0tMy0tXG4gICAqIGBgYFxuICAgKlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBmbGF0dGVuPFI+KHRoaXM6IFN0cmVhbTxTdHJlYW08Uj4+KTogVCB7XG4gICAgY29uc3QgcCA9IHRoaXMuX3Byb2Q7XG4gICAgcmV0dXJuIG5ldyBTdHJlYW08Uj4obmV3IEZsYXR0ZW4odGhpcykpIGFzIFQgJiBTdHJlYW08Uj47XG4gIH1cblxuICAvKipcbiAgICogUGFzc2VzIHRoZSBpbnB1dCBzdHJlYW0gdG8gYSBjdXN0b20gb3BlcmF0b3IsIHRvIHByb2R1Y2UgYW4gb3V0cHV0IHN0cmVhbS5cbiAgICpcbiAgICogKmNvbXBvc2UqIGlzIGEgaGFuZHkgd2F5IG9mIHVzaW5nIGFuIGV4aXN0aW5nIGZ1bmN0aW9uIGluIGEgY2hhaW5lZCBzdHlsZS5cbiAgICogSW5zdGVhZCBvZiB3cml0aW5nIGBvdXRTdHJlYW0gPSBmKGluU3RyZWFtKWAgeW91IGNhbiB3cml0ZVxuICAgKiBgb3V0U3RyZWFtID0gaW5TdHJlYW0uY29tcG9zZShmKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7ZnVuY3Rpb259IG9wZXJhdG9yIEEgZnVuY3Rpb24gdGhhdCB0YWtlcyBhIHN0cmVhbSBhcyBpbnB1dCBhbmRcbiAgICogcmV0dXJucyBhIHN0cmVhbSBhcyB3ZWxsLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBjb21wb3NlPFU+KG9wZXJhdG9yOiAoc3RyZWFtOiBTdHJlYW08VD4pID0+IFUpOiBVIHtcbiAgICByZXR1cm4gb3BlcmF0b3IodGhpcyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sIGJ1dCBhbHNvXG4gICAqIHJlbWVtYmVycyB0aGUgbW9zdCByZWNlbnQgZXZlbnQgdGhhdCBoYXBwZW5zIG9uIHRoZSBpbnB1dCBzdHJlYW0sIHNvIHRoYXQgYVxuICAgKiBuZXdseSBhZGRlZCBsaXN0ZW5lciB3aWxsIGltbWVkaWF0ZWx5IHJlY2VpdmUgdGhhdCBtZW1vcmlzZWQgZXZlbnQuXG4gICAqXG4gICAqIEByZXR1cm4ge01lbW9yeVN0cmVhbX1cbiAgICovXG4gIHJlbWVtYmVyKCk6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIG5ldyBNZW1vcnlTdHJlYW08VD4obmV3IFJlbWVtYmVyPFQ+KHRoaXMpKTtcbiAgfVxuXG4gIGRlYnVnKCk6IFN0cmVhbTxUPjtcbiAgZGVidWcobGFiZWxPclNweTogc3RyaW5nKTogU3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiAodDogVCkgPT4gYW55KTogU3RyZWFtPFQ+O1xuICAvKipcbiAgICogUmV0dXJucyBhbiBvdXRwdXQgc3RyZWFtIHRoYXQgaWRlbnRpY2FsbHkgYmVoYXZlcyBsaWtlIHRoZSBpbnB1dCBzdHJlYW0sXG4gICAqIGJ1dCBhbHNvIHJ1bnMgYSBgc3B5YCBmdW5jdGlvbiBmb3IgZWFjaCBldmVudCwgdG8gaGVscCB5b3UgZGVidWcgeW91ciBhcHAuXG4gICAqXG4gICAqICpkZWJ1ZyogdGFrZXMgYSBgc3B5YCBmdW5jdGlvbiBhcyBhcmd1bWVudCwgYW5kIHJ1bnMgdGhhdCBmb3IgZWFjaCBldmVudFxuICAgKiBoYXBwZW5pbmcgb24gdGhlIGlucHV0IHN0cmVhbS4gSWYgeW91IGRvbid0IHByb3ZpZGUgdGhlIGBzcHlgIGFyZ3VtZW50LFxuICAgKiB0aGVuICpkZWJ1Zyogd2lsbCBqdXN0IGBjb25zb2xlLmxvZ2AgZWFjaCBldmVudC4gVGhpcyBoZWxwcyB5b3UgdG9cbiAgICogdW5kZXJzdGFuZCB0aGUgZmxvdyBvZiBldmVudHMgdGhyb3VnaCBzb21lIG9wZXJhdG9yIGNoYWluLlxuICAgKlxuICAgKiBQbGVhc2Ugbm90ZSB0aGF0IGlmIHRoZSBvdXRwdXQgc3RyZWFtIGhhcyBubyBsaXN0ZW5lcnMsIHRoZW4gaXQgd2lsbCBub3RcbiAgICogc3RhcnQsIHdoaWNoIG1lYW5zIGBzcHlgIHdpbGwgbmV2ZXIgcnVuIGJlY2F1c2Ugbm8gYWN0dWFsIGV2ZW50IGhhcHBlbnMgaW5cbiAgICogdGhhdCBjYXNlLlxuICAgKlxuICAgKiBNYXJibGUgZGlhZ3JhbTpcbiAgICpcbiAgICogYGBgdGV4dFxuICAgKiAtLTEtLS0tMi0tLS0tMy0tLS0tNC0tXG4gICAqICAgICAgICAgZGVidWdcbiAgICogLS0xLS0tLTItLS0tLTMtLS0tLTQtLVxuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gbGFiZWxPclNweSBBIHN0cmluZyB0byB1c2UgYXMgdGhlIGxhYmVsIHdoZW4gcHJpbnRpbmdcbiAgICogZGVidWcgaW5mb3JtYXRpb24gb24gdGhlIGNvbnNvbGUsIG9yIGEgJ3NweScgZnVuY3Rpb24gdGhhdCB0YWtlcyBhbiBldmVudFxuICAgKiBhcyBhcmd1bWVudCwgYW5kIGRvZXMgbm90IG5lZWQgdG8gcmV0dXJuIGFueXRoaW5nLlxuICAgKiBAcmV0dXJuIHtTdHJlYW19XG4gICAqL1xuICBkZWJ1ZyhsYWJlbE9yU3B5Pzogc3RyaW5nIHwgKCh0OiBUKSA9PiBhbnkpKTogU3RyZWFtPFQ+IHtcbiAgICByZXR1cm4gbmV3ICh0aGlzLmN0b3IoKSk8VD4obmV3IERlYnVnPFQ+KHRoaXMsIGxhYmVsT3JTcHkpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiAqaW1pdGF0ZSogY2hhbmdlcyB0aGlzIGN1cnJlbnQgU3RyZWFtIHRvIGVtaXQgdGhlIHNhbWUgZXZlbnRzIHRoYXQgdGhlXG4gICAqIGBvdGhlcmAgZ2l2ZW4gU3RyZWFtIGRvZXMuIFRoaXMgbWV0aG9kIHJldHVybnMgbm90aGluZy5cbiAgICpcbiAgICogVGhpcyBtZXRob2QgZXhpc3RzIHRvIGFsbG93IG9uZSB0aGluZzogKipjaXJjdWxhciBkZXBlbmRlbmN5IG9mIHN0cmVhbXMqKi5cbiAgICogRm9yIGluc3RhbmNlLCBsZXQncyBpbWFnaW5lIHRoYXQgZm9yIHNvbWUgcmVhc29uIHlvdSBuZWVkIHRvIGNyZWF0ZSBhXG4gICAqIGNpcmN1bGFyIGRlcGVuZGVuY3kgd2hlcmUgc3RyZWFtIGBmaXJzdCRgIGRlcGVuZHMgb24gc3RyZWFtIGBzZWNvbmQkYFxuICAgKiB3aGljaCBpbiB0dXJuIGRlcGVuZHMgb24gYGZpcnN0JGA6XG4gICAqXG4gICAqIDwhLS0gc2tpcC1leGFtcGxlIC0tPlxuICAgKiBgYGBqc1xuICAgKiBpbXBvcnQgZGVsYXkgZnJvbSAneHN0cmVhbS9leHRyYS9kZWxheSdcbiAgICpcbiAgICogdmFyIGZpcnN0JCA9IHNlY29uZCQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBIb3dldmVyLCB0aGF0IGlzIGludmFsaWQgSmF2YVNjcmlwdCwgYmVjYXVzZSBgc2Vjb25kJGAgaXMgdW5kZWZpbmVkXG4gICAqIG9uIHRoZSBmaXJzdCBsaW5lLiBUaGlzIGlzIGhvdyAqaW1pdGF0ZSogY2FuIGhlbHAgc29sdmUgaXQ6XG4gICAqXG4gICAqIGBgYGpzXG4gICAqIGltcG9ydCBkZWxheSBmcm9tICd4c3RyZWFtL2V4dHJhL2RlbGF5J1xuICAgKlxuICAgKiB2YXIgc2Vjb25kUHJveHkkID0geHMuY3JlYXRlKCk7XG4gICAqIHZhciBmaXJzdCQgPSBzZWNvbmRQcm94eSQubWFwKHggPT4geCAqIDEwKS50YWtlKDMpO1xuICAgKiB2YXIgc2Vjb25kJCA9IGZpcnN0JC5tYXAoeCA9PiB4ICsgMSkuc3RhcnRXaXRoKDEpLmNvbXBvc2UoZGVsYXkoMTAwKSk7XG4gICAqIHNlY29uZFByb3h5JC5pbWl0YXRlKHNlY29uZCQpO1xuICAgKiBgYGBcbiAgICpcbiAgICogV2UgY3JlYXRlIGBzZWNvbmRQcm94eSRgIGJlZm9yZSB0aGUgb3RoZXJzLCBzbyBpdCBjYW4gYmUgdXNlZCBpbiB0aGVcbiAgICogZGVjbGFyYXRpb24gb2YgYGZpcnN0JGAuIFRoZW4sIGFmdGVyIGJvdGggYGZpcnN0JGAgYW5kIGBzZWNvbmQkYCBhcmVcbiAgICogZGVmaW5lZCwgd2UgaG9vayBgc2Vjb25kUHJveHkkYCB3aXRoIGBzZWNvbmQkYCB3aXRoIGBpbWl0YXRlKClgIHRvIHRlbGxcbiAgICogdGhhdCB0aGV5IGFyZSBcInRoZSBzYW1lXCIuIGBpbWl0YXRlYCB3aWxsIG5vdCB0cmlnZ2VyIHRoZSBzdGFydCBvZiBhbnlcbiAgICogc3RyZWFtLCBpdCBqdXN0IGJpbmRzIGBzZWNvbmRQcm94eSRgIGFuZCBgc2Vjb25kJGAgdG9nZXRoZXIuXG4gICAqXG4gICAqIFRoZSBmb2xsb3dpbmcgaXMgYW4gZXhhbXBsZSB3aGVyZSBgaW1pdGF0ZSgpYCBpcyBpbXBvcnRhbnQgaW4gQ3ljbGUuanNcbiAgICogYXBwbGljYXRpb25zLiBBIHBhcmVudCBjb21wb25lbnQgY29udGFpbnMgc29tZSBjaGlsZCBjb21wb25lbnRzLiBBIGNoaWxkXG4gICAqIGhhcyBhbiBhY3Rpb24gc3RyZWFtIHdoaWNoIGlzIGdpdmVuIHRvIHRoZSBwYXJlbnQgdG8gZGVmaW5lIGl0cyBzdGF0ZTpcbiAgICpcbiAgICogPCEtLSBza2lwLWV4YW1wbGUgLS0+XG4gICAqIGBgYGpzXG4gICAqIGNvbnN0IGNoaWxkQWN0aW9uUHJveHkkID0geHMuY3JlYXRlKCk7XG4gICAqIGNvbnN0IHBhcmVudCA9IFBhcmVudCh7Li4uc291cmNlcywgY2hpbGRBY3Rpb24kOiBjaGlsZEFjdGlvblByb3h5JH0pO1xuICAgKiBjb25zdCBjaGlsZEFjdGlvbiQgPSBwYXJlbnQuc3RhdGUkLm1hcChzID0+IHMuY2hpbGQuYWN0aW9uJCkuZmxhdHRlbigpO1xuICAgKiBjaGlsZEFjdGlvblByb3h5JC5pbWl0YXRlKGNoaWxkQWN0aW9uJCk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBOb3RlLCB0aG91Z2gsIHRoYXQgKipgaW1pdGF0ZSgpYCBkb2VzIG5vdCBzdXBwb3J0IE1lbW9yeVN0cmVhbXMqKi4gSWYgd2VcbiAgICogd291bGQgYXR0ZW1wdCB0byBpbWl0YXRlIGEgTWVtb3J5U3RyZWFtIGluIGEgY2lyY3VsYXIgZGVwZW5kZW5jeSwgd2Ugd291bGRcbiAgICogZWl0aGVyIGdldCBhIHJhY2UgY29uZGl0aW9uICh3aGVyZSB0aGUgc3ltcHRvbSB3b3VsZCBiZSBcIm5vdGhpbmcgaGFwcGVuc1wiKVxuICAgKiBvciBhbiBpbmZpbml0ZSBjeWNsaWMgZW1pc3Npb24gb2YgdmFsdWVzLiBJdCdzIHVzZWZ1bCB0byB0aGluayBhYm91dFxuICAgKiBNZW1vcnlTdHJlYW1zIGFzIGNlbGxzIGluIGEgc3ByZWFkc2hlZXQuIEl0IGRvZXNuJ3QgbWFrZSBhbnkgc2Vuc2UgdG9cbiAgICogZGVmaW5lIGEgc3ByZWFkc2hlZXQgY2VsbCBgQTFgIHdpdGggYSBmb3JtdWxhIHRoYXQgZGVwZW5kcyBvbiBgQjFgIGFuZFxuICAgKiBjZWxsIGBCMWAgZGVmaW5lZCB3aXRoIGEgZm9ybXVsYSB0aGF0IGRlcGVuZHMgb24gYEExYC5cbiAgICpcbiAgICogSWYgeW91IGZpbmQgeW91cnNlbGYgd2FudGluZyB0byB1c2UgYGltaXRhdGUoKWAgd2l0aCBhXG4gICAqIE1lbW9yeVN0cmVhbSwgeW91IHNob3VsZCByZXdvcmsgeW91ciBjb2RlIGFyb3VuZCBgaW1pdGF0ZSgpYCB0byB1c2UgYVxuICAgKiBTdHJlYW0gaW5zdGVhZC4gTG9vayBmb3IgdGhlIHN0cmVhbSBpbiB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeSB0aGF0XG4gICAqIHJlcHJlc2VudHMgYW4gZXZlbnQgc3RyZWFtLCBhbmQgdGhhdCB3b3VsZCBiZSBhIGNhbmRpZGF0ZSBmb3IgY3JlYXRpbmcgYVxuICAgKiBwcm94eSBTdHJlYW0gd2hpY2ggdGhlbiBpbWl0YXRlcyB0aGUgdGFyZ2V0IFN0cmVhbS5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJlYW19IHRhcmdldCBUaGUgb3RoZXIgc3RyZWFtIHRvIGltaXRhdGUgb24gdGhlIGN1cnJlbnQgb25lLiBNdXN0XG4gICAqIG5vdCBiZSBhIE1lbW9yeVN0cmVhbS5cbiAgICovXG4gIGltaXRhdGUodGFyZ2V0OiBTdHJlYW08VD4pOiB2b2lkIHtcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgTWVtb3J5U3RyZWFtKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdBIE1lbW9yeVN0cmVhbSB3YXMgZ2l2ZW4gdG8gaW1pdGF0ZSgpLCBidXQgaXQgb25seSAnICtcbiAgICAgICdzdXBwb3J0cyBhIFN0cmVhbS4gUmVhZCBtb3JlIGFib3V0IHRoaXMgcmVzdHJpY3Rpb24gaGVyZTogJyArXG4gICAgICAnaHR0cHM6Ly9naXRodWIuY29tL3N0YWx0ei94c3RyZWFtI2ZhcScpO1xuICAgIHRoaXMuX3RhcmdldCA9IHRhcmdldDtcbiAgICBmb3IgKGxldCBpbHMgPSB0aGlzLl9pbHMsIE4gPSBpbHMubGVuZ3RoLCBpID0gMDsgaSA8IE47IGkrKykgdGFyZ2V0Ll9hZGQoaWxzW2ldKTtcbiAgICB0aGlzLl9pbHMgPSBbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIFN0cmVhbSB0byBlbWl0IHRoZSBnaXZlbiB2YWx1ZSB0byBpdHMgbGlzdGVuZXJzLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIGlmIHlvdSB1c2UgdGhpcywgeW91IGFyZSBtb3N0IGxpa2VseSBkb2luZyBzb21ldGhpbmdcbiAgICogVGhlIFdyb25nIFdheS4gUGxlYXNlIHRyeSB0byB1bmRlcnN0YW5kIHRoZSByZWFjdGl2ZSB3YXkgYmVmb3JlIHVzaW5nIHRoaXNcbiAgICogbWV0aG9kLiBVc2UgaXQgb25seSB3aGVuIHlvdSBrbm93IHdoYXQgeW91IGFyZSBkb2luZy5cbiAgICpcbiAgICogQHBhcmFtIHZhbHVlIFRoZSBcIm5leHRcIiB2YWx1ZSB5b3Ugd2FudCB0byBicm9hZGNhc3QgdG8gYWxsIGxpc3RlbmVycyBvZlxuICAgKiB0aGlzIFN0cmVhbS5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kTmV4dCh2YWx1ZTogVCkge1xuICAgIHRoaXMuX24odmFsdWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIGdpdmVuIGVycm9yIHRvIGl0cyBsaXN0ZW5lcnMuXG4gICAqXG4gICAqIEFzIHRoZSBuYW1lIGluZGljYXRlcywgaWYgeW91IHVzZSB0aGlzLCB5b3UgYXJlIG1vc3QgbGlrZWx5IGRvaW5nIHNvbWV0aGluZ1xuICAgKiBUaGUgV3JvbmcgV2F5LiBQbGVhc2UgdHJ5IHRvIHVuZGVyc3RhbmQgdGhlIHJlYWN0aXZlIHdheSBiZWZvcmUgdXNpbmcgdGhpc1xuICAgKiBtZXRob2QuIFVzZSBpdCBvbmx5IHdoZW4geW91IGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nLlxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gZXJyb3IgVGhlIGVycm9yIHlvdSB3YW50IHRvIGJyb2FkY2FzdCB0byBhbGwgdGhlIGxpc3RlbmVycyBvZlxuICAgKiB0aGlzIFN0cmVhbS5cbiAgICovXG4gIHNoYW1lZnVsbHlTZW5kRXJyb3IoZXJyb3I6IGFueSkge1xuICAgIHRoaXMuX2UoZXJyb3IpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZvcmNlcyB0aGUgU3RyZWFtIHRvIGVtaXQgdGhlIFwiY29tcGxldGVkXCIgZXZlbnQgdG8gaXRzIGxpc3RlbmVycy5cbiAgICpcbiAgICogQXMgdGhlIG5hbWUgaW5kaWNhdGVzLCBpZiB5b3UgdXNlIHRoaXMsIHlvdSBhcmUgbW9zdCBsaWtlbHkgZG9pbmcgc29tZXRoaW5nXG4gICAqIFRoZSBXcm9uZyBXYXkuIFBsZWFzZSB0cnkgdG8gdW5kZXJzdGFuZCB0aGUgcmVhY3RpdmUgd2F5IGJlZm9yZSB1c2luZyB0aGlzXG4gICAqIG1ldGhvZC4gVXNlIGl0IG9ubHkgd2hlbiB5b3Uga25vdyB3aGF0IHlvdSBhcmUgZG9pbmcuXG4gICAqL1xuICBzaGFtZWZ1bGx5U2VuZENvbXBsZXRlKCkge1xuICAgIHRoaXMuX2MoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGEgXCJkZWJ1Z1wiIGxpc3RlbmVyIHRvIHRoZSBzdHJlYW0uIFRoZXJlIGNhbiBvbmx5IGJlIG9uZSBkZWJ1Z1xuICAgKiBsaXN0ZW5lciwgdGhhdCdzIHdoeSB0aGlzIGlzICdzZXREZWJ1Z0xpc3RlbmVyJy4gVG8gcmVtb3ZlIHRoZSBkZWJ1Z1xuICAgKiBsaXN0ZW5lciwganVzdCBjYWxsIHNldERlYnVnTGlzdGVuZXIobnVsbCkuXG4gICAqXG4gICAqIEEgZGVidWcgbGlzdGVuZXIgaXMgbGlrZSBhbnkgb3RoZXIgbGlzdGVuZXIuIFRoZSBvbmx5IGRpZmZlcmVuY2UgaXMgdGhhdCBhXG4gICAqIGRlYnVnIGxpc3RlbmVyIGlzIFwic3RlYWx0aHlcIjogaXRzIHByZXNlbmNlL2Fic2VuY2UgZG9lcyBub3QgdHJpZ2dlciB0aGVcbiAgICogc3RhcnQvc3RvcCBvZiB0aGUgc3RyZWFtIChvciB0aGUgcHJvZHVjZXIgaW5zaWRlIHRoZSBzdHJlYW0pLiBUaGlzIGlzXG4gICAqIHVzZWZ1bCBzbyB5b3UgY2FuIGluc3BlY3Qgd2hhdCBpcyBnb2luZyBvbiB3aXRob3V0IGNoYW5naW5nIHRoZSBiZWhhdmlvclxuICAgKiBvZiB0aGUgcHJvZ3JhbS4gSWYgeW91IGhhdmUgYW4gaWRsZSBzdHJlYW0gYW5kIHlvdSBhZGQgYSBub3JtYWwgbGlzdGVuZXIgdG9cbiAgICogaXQsIHRoZSBzdHJlYW0gd2lsbCBzdGFydCBleGVjdXRpbmcuIEJ1dCBpZiB5b3Ugc2V0IGEgZGVidWcgbGlzdGVuZXIgb24gYW5cbiAgICogaWRsZSBzdHJlYW0sIGl0IHdvbid0IHN0YXJ0IGV4ZWN1dGluZyAobm90IHVudGlsIHRoZSBmaXJzdCBub3JtYWwgbGlzdGVuZXJcbiAgICogaXMgYWRkZWQpLlxuICAgKlxuICAgKiBBcyB0aGUgbmFtZSBpbmRpY2F0ZXMsIHdlIGRvbid0IHJlY29tbWVuZCB1c2luZyB0aGlzIG1ldGhvZCB0byBidWlsZCBhcHBcbiAgICogbG9naWMuIEluIGZhY3QsIGluIG1vc3QgY2FzZXMgdGhlIGRlYnVnIG9wZXJhdG9yIHdvcmtzIGp1c3QgZmluZS4gT25seSB1c2VcbiAgICogdGhpcyBvbmUgaWYgeW91IGtub3cgd2hhdCB5b3UncmUgZG9pbmcuXG4gICAqXG4gICAqIEBwYXJhbSB7TGlzdGVuZXI8VD59IGxpc3RlbmVyXG4gICAqL1xuICBzZXREZWJ1Z0xpc3RlbmVyKGxpc3RlbmVyOiBQYXJ0aWFsPExpc3RlbmVyPFQ+PiB8IG51bGwgfCB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWxpc3RlbmVyKSB7XG4gICAgICB0aGlzLl9kID0gZmFsc2U7XG4gICAgICB0aGlzLl9kbCA9IE5PIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2QgPSB0cnVlO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9uID0gbGlzdGVuZXIubmV4dCB8fCBub29wO1xuICAgICAgKGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD4pLl9lID0gbGlzdGVuZXIuZXJyb3IgfHwgbm9vcDtcbiAgICAgIChsaXN0ZW5lciBhcyBJbnRlcm5hbExpc3RlbmVyPFQ+KS5fYyA9IGxpc3RlbmVyLmNvbXBsZXRlIHx8IG5vb3A7XG4gICAgICB0aGlzLl9kbCA9IGxpc3RlbmVyIGFzIEludGVybmFsTGlzdGVuZXI8VD47XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNZW1vcnlTdHJlYW08VD4gZXh0ZW5kcyBTdHJlYW08VD4ge1xuICBwcml2YXRlIF92OiBUO1xuICBwcml2YXRlIF9oYXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgY29uc3RydWN0b3IocHJvZHVjZXI6IEludGVybmFsUHJvZHVjZXI8VD4pIHtcbiAgICBzdXBlcihwcm9kdWNlcik7XG4gIH1cblxuICBfbih4OiBUKSB7XG4gICAgdGhpcy5fdiA9IHg7XG4gICAgdGhpcy5faGFzID0gdHJ1ZTtcbiAgICBzdXBlci5fbih4KTtcbiAgfVxuXG4gIF9hZGQoaWw6IEludGVybmFsTGlzdGVuZXI8VD4pOiB2b2lkIHtcbiAgICBjb25zdCB0YSA9IHRoaXMuX3RhcmdldDtcbiAgICBpZiAodGEgIT09IE5PKSByZXR1cm4gdGEuX2FkZChpbCk7XG4gICAgY29uc3QgYSA9IHRoaXMuX2lscztcbiAgICBhLnB1c2goaWwpO1xuICAgIGlmIChhLmxlbmd0aCA+IDEpIHtcbiAgICAgIGlmICh0aGlzLl9oYXMpIGlsLl9uKHRoaXMuX3YpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAodGhpcy5fc3RvcElEICE9PSBOTykge1xuICAgICAgaWYgKHRoaXMuX2hhcykgaWwuX24odGhpcy5fdik7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5fc3RvcElEKTtcbiAgICAgIHRoaXMuX3N0b3BJRCA9IE5PO1xuICAgIH0gZWxzZSBpZiAodGhpcy5faGFzKSBpbC5fbih0aGlzLl92KTsgZWxzZSB7XG4gICAgICBjb25zdCBwID0gdGhpcy5fcHJvZDtcbiAgICAgIGlmIChwICE9PSBOTykgcC5fc3RhcnQodGhpcyk7XG4gICAgfVxuICB9XG5cbiAgX3N0b3BOb3coKSB7XG4gICAgdGhpcy5faGFzID0gZmFsc2U7XG4gICAgc3VwZXIuX3N0b3BOb3coKTtcbiAgfVxuXG4gIF94KCk6IHZvaWQge1xuICAgIHRoaXMuX2hhcyA9IGZhbHNlO1xuICAgIHN1cGVyLl94KCk7XG4gIH1cblxuICBtYXA8VT4ocHJvamVjdDogKHQ6IFQpID0+IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiB0aGlzLl9tYXAocHJvamVjdCkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgbWFwVG88VT4ocHJvamVjdGVkVmFsdWU6IFUpOiBNZW1vcnlTdHJlYW08VT4ge1xuICAgIHJldHVybiBzdXBlci5tYXBUbyhwcm9qZWN0ZWRWYWx1ZSkgYXMgTWVtb3J5U3RyZWFtPFU+O1xuICB9XG5cbiAgdGFrZShhbW91bnQ6IG51bWJlcik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnRha2UoYW1vdW50KSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICBlbmRXaGVuKG90aGVyOiBTdHJlYW08YW55Pik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLmVuZFdoZW4ob3RoZXIpIGFzIE1lbW9yeVN0cmVhbTxUPjtcbiAgfVxuXG4gIHJlcGxhY2VFcnJvcihyZXBsYWNlOiAoZXJyOiBhbnkpID0+IFN0cmVhbTxUPik6IE1lbW9yeVN0cmVhbTxUPiB7XG4gICAgcmV0dXJuIHN1cGVyLnJlcGxhY2VFcnJvcihyZXBsYWNlKSBhcyBNZW1vcnlTdHJlYW08VD47XG4gIH1cblxuICByZW1lbWJlcigpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZGVidWcoKTogTWVtb3J5U3RyZWFtPFQ+O1xuICBkZWJ1ZyhsYWJlbE9yU3B5OiBzdHJpbmcpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk6ICh0OiBUKSA9PiBhbnkpOiBNZW1vcnlTdHJlYW08VD47XG4gIGRlYnVnKGxhYmVsT3JTcHk/OiBzdHJpbmcgfCAoKHQ6IFQpID0+IGFueSkgfCB1bmRlZmluZWQpOiBNZW1vcnlTdHJlYW08VD4ge1xuICAgIHJldHVybiBzdXBlci5kZWJ1ZyhsYWJlbE9yU3B5IGFzIGFueSkgYXMgTWVtb3J5U3RyZWFtPFQ+O1xuICB9XG59XG5cbmV4cG9ydCB7Tk8sIE5PX0lMfTtcbmNvbnN0IHhzID0gU3RyZWFtO1xudHlwZSB4czxUPiA9IFN0cmVhbTxUPjtcbmV4cG9ydCBkZWZhdWx0IHhzO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5mdW5jdGlvbiBnZXRHbG9iYWwoKSB7XG4gICAgdmFyIGdsb2JhbE9iajtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZ2xvYmFsT2JqID0gd2luZG93O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBnbG9iYWxPYmogPSBnbG9iYWw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBnbG9iYWxPYmogPSB0aGlzO1xuICAgIH1cbiAgICBnbG9iYWxPYmouQ3ljbGVqcyA9IGdsb2JhbE9iai5DeWNsZWpzIHx8IHt9O1xuICAgIGdsb2JhbE9iaiA9IGdsb2JhbE9iai5DeWNsZWpzO1xuICAgIGdsb2JhbE9iai5hZGFwdFN0cmVhbSA9IGdsb2JhbE9iai5hZGFwdFN0cmVhbSB8fCAoZnVuY3Rpb24gKHgpIHsgcmV0dXJuIHg7IH0pO1xuICAgIHJldHVybiBnbG9iYWxPYmo7XG59XG5mdW5jdGlvbiBzZXRBZGFwdChmKSB7XG4gICAgZ2V0R2xvYmFsKCkuYWRhcHRTdHJlYW0gPSBmO1xufVxuZXhwb3J0cy5zZXRBZGFwdCA9IHNldEFkYXB0O1xuZnVuY3Rpb24gYWRhcHQoc3RyZWFtKSB7XG4gICAgcmV0dXJuIGdldEdsb2JhbCgpLmFkYXB0U3RyZWFtKHN0cmVhbSk7XG59XG5leHBvcnRzLmFkYXB0ID0gYWRhcHQ7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1hZGFwdC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciBpbnRlcm5hbHNfMSA9IHJlcXVpcmUoXCIuL2ludGVybmFsc1wiKTtcbi8qKlxuICogQSBmdW5jdGlvbiB0aGF0IHByZXBhcmVzIHRoZSBDeWNsZSBhcHBsaWNhdGlvbiB0byBiZSBleGVjdXRlZC4gVGFrZXMgYSBgbWFpbmBcbiAqIGZ1bmN0aW9uIGFuZCBwcmVwYXJlcyB0byBjaXJjdWxhcmx5IGNvbm5lY3RzIGl0IHRvIHRoZSBnaXZlbiBjb2xsZWN0aW9uIG9mXG4gKiBkcml2ZXIgZnVuY3Rpb25zLiBBcyBhbiBvdXRwdXQsIGBzZXR1cCgpYCByZXR1cm5zIGFuIG9iamVjdCB3aXRoIHRocmVlXG4gKiBwcm9wZXJ0aWVzOiBgc291cmNlc2AsIGBzaW5rc2AgYW5kIGBydW5gLiBPbmx5IHdoZW4gYHJ1bigpYCBpcyBjYWxsZWQgd2lsbFxuICogdGhlIGFwcGxpY2F0aW9uIGFjdHVhbGx5IGV4ZWN1dGUuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGBydW4oKWAgZm9yXG4gKiBtb3JlIGRldGFpbHMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHtzZXR1cH0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgc2lua3MsIHJ1bn0gPSBzZXR1cChtYWluLCBkcml2ZXJzKTtcbiAqIC8vIC4uLlxuICogY29uc3QgZGlzcG9zZSA9IHJ1bigpOyAvLyBFeGVjdXRlcyB0aGUgYXBwbGljYXRpb25cbiAqIC8vIC4uLlxuICogZGlzcG9zZSgpO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gbWFpbiBhIGZ1bmN0aW9uIHRoYXQgdGFrZXMgYHNvdXJjZXNgIGFzIGlucHV0IGFuZCBvdXRwdXRzXG4gKiBgc2lua3NgLlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgc2lua3NgIGFuZFxuICogYHJ1bmAuIGBzb3VyY2VzYCBpcyB0aGUgY29sbGVjdGlvbiBvZiBkcml2ZXIgc291cmNlcywgYHNpbmtzYCBpcyB0aGVcbiAqIGNvbGxlY3Rpb24gb2YgZHJpdmVyIHNpbmtzLCB0aGVzZSBjYW4gYmUgdXNlZCBmb3IgZGVidWdnaW5nIG9yIHRlc3RpbmcuIGBydW5gXG4gKiBpcyB0aGUgZnVuY3Rpb24gdGhhdCBvbmNlIGNhbGxlZCB3aWxsIGV4ZWN1dGUgdGhlIGFwcGxpY2F0aW9uLlxuICogQGZ1bmN0aW9uIHNldHVwXG4gKi9cbmZ1bmN0aW9uIHNldHVwKG1haW4sIGRyaXZlcnMpIHtcbiAgICBpZiAodHlwZW9mIG1haW4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJGaXJzdCBhcmd1bWVudCBnaXZlbiB0byBDeWNsZSBtdXN0IGJlIHRoZSAnbWFpbicgXCIgKyBcImZ1bmN0aW9uLlwiKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vjb25kIGFyZ3VtZW50IGdpdmVuIHRvIEN5Y2xlIG11c3QgYmUgYW4gb2JqZWN0IFwiICtcbiAgICAgICAgICAgIFwid2l0aCBkcml2ZXIgZnVuY3Rpb25zIGFzIHByb3BlcnRpZXMuXCIpO1xuICAgIH1cbiAgICBpZiAoaW50ZXJuYWxzXzEuaXNPYmplY3RFbXB0eShkcml2ZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZWNvbmQgYXJndW1lbnQgZ2l2ZW4gdG8gQ3ljbGUgbXVzdCBiZSBhbiBvYmplY3QgXCIgK1xuICAgICAgICAgICAgXCJ3aXRoIGF0IGxlYXN0IG9uZSBkcml2ZXIgZnVuY3Rpb24gZGVjbGFyZWQgYXMgYSBwcm9wZXJ0eS5cIik7XG4gICAgfVxuICAgIHZhciBlbmdpbmUgPSBzZXR1cFJldXNhYmxlKGRyaXZlcnMpO1xuICAgIHZhciBzaW5rcyA9IG1haW4oZW5naW5lLnNvdXJjZXMpO1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcyA9IHdpbmRvdy5DeWNsZWpzIHx8IHt9O1xuICAgICAgICB3aW5kb3cuQ3ljbGVqcy5zaW5rcyA9IHNpbmtzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBfcnVuKCkge1xuICAgICAgICB2YXIgZGlzcG9zZVJ1biA9IGVuZ2luZS5ydW4oc2lua3MpO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZSgpIHtcbiAgICAgICAgICAgIGRpc3Bvc2VSdW4oKTtcbiAgICAgICAgICAgIGVuZ2luZS5kaXNwb3NlKCk7XG4gICAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHNpbmtzOiBzaW5rcywgc291cmNlczogZW5naW5lLnNvdXJjZXMsIHJ1bjogX3J1biB9O1xufVxuZXhwb3J0cy5zZXR1cCA9IHNldHVwO1xuLyoqXG4gKiBBIHBhcnRpYWxseS1hcHBsaWVkIHZhcmlhbnQgb2Ygc2V0dXAoKSB3aGljaCBhY2NlcHRzIG9ubHkgdGhlIGRyaXZlcnMsIGFuZFxuICogYWxsb3dzIG1hbnkgYG1haW5gIGZ1bmN0aW9ucyB0byBleGVjdXRlIGFuZCByZXVzZSB0aGlzIHNhbWUgc2V0IG9mIGRyaXZlcnMuXG4gKlxuICogVGFrZXMgYW4gb2JqZWN0IHdpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBpbnB1dCwgYW5kIG91dHB1dHMgYW4gb2JqZWN0IHdoaWNoXG4gKiBjb250YWlucyB0aGUgZ2VuZXJhdGVkIHNvdXJjZXMgKGZyb20gdGhvc2UgZHJpdmVycykgYW5kIGEgYHJ1bmAgZnVuY3Rpb25cbiAqICh3aGljaCBpbiB0dXJuIGV4cGVjdHMgc2lua3MgYXMgYXJndW1lbnQpLiBUaGlzIGBydW5gIGZ1bmN0aW9uIGNhbiBiZSBjYWxsZWRcbiAqIG11bHRpcGxlIHRpbWVzIHdpdGggZGlmZmVyZW50IGFyZ3VtZW50cywgYW5kIGl0IHdpbGwgcmV1c2UgdGhlIGRyaXZlcnMgdGhhdFxuICogd2VyZSBwYXNzZWQgdG8gYHNldHVwUmV1c2FibGVgLlxuICpcbiAqICoqRXhhbXBsZToqKlxuICogYGBganNcbiAqIGltcG9ydCB7c2V0dXBSZXVzYWJsZX0gZnJvbSAnQGN5Y2xlL3J1bic7XG4gKiBjb25zdCB7c291cmNlcywgcnVuLCBkaXNwb3NlfSA9IHNldHVwUmV1c2FibGUoZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGNvbnN0IHNpbmtzID0gbWFpbihzb3VyY2VzKTtcbiAqIGNvbnN0IGRpc3Bvc2VSdW4gPSBydW4oc2lua3MpO1xuICogLy8gLi4uXG4gKiBkaXNwb3NlUnVuKCk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTsgLy8gZW5kcyB0aGUgcmV1c2FiaWxpdHkgb2YgZHJpdmVyc1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGRyaXZlcnMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIGRyaXZlciBuYW1lcyBhbmQgdmFsdWVzXG4gKiBhcmUgZHJpdmVyIGZ1bmN0aW9ucy5cbiAqIEByZXR1cm4ge09iamVjdH0gYW4gb2JqZWN0IHdpdGggdGhyZWUgcHJvcGVydGllczogYHNvdXJjZXNgLCBgcnVuYCBhbmRcbiAqIGBkaXNwb3NlYC4gYHNvdXJjZXNgIGlzIHRoZSBjb2xsZWN0aW9uIG9mIGRyaXZlciBzb3VyY2VzLCBgcnVuYCBpcyB0aGVcbiAqIGZ1bmN0aW9uIHRoYXQgb25jZSBjYWxsZWQgd2l0aCAnc2lua3MnIGFzIGFyZ3VtZW50LCB3aWxsIGV4ZWN1dGUgdGhlXG4gKiBhcHBsaWNhdGlvbiwgdHlpbmcgdG9nZXRoZXIgc291cmNlcyB3aXRoIHNpbmtzLiBgZGlzcG9zZWAgdGVybWluYXRlcyB0aGVcbiAqIHJldXNhYmxlIHJlc291cmNlcyB1c2VkIGJ5IHRoZSBkcml2ZXJzLiBOb3RlIGFsc28gdGhhdCBgcnVuYCByZXR1cm5zIGFcbiAqIGRpc3Bvc2UgZnVuY3Rpb24gd2hpY2ggdGVybWluYXRlcyByZXNvdXJjZXMgdGhhdCBhcmUgc3BlY2lmaWMgKG5vdCByZXVzYWJsZSlcbiAqIHRvIHRoYXQgcnVuLlxuICogQGZ1bmN0aW9uIHNldHVwUmV1c2FibGVcbiAqL1xuZnVuY3Rpb24gc2V0dXBSZXVzYWJsZShkcml2ZXJzKSB7XG4gICAgaWYgKHR5cGVvZiBkcml2ZXJzICE9PSBcIm9iamVjdFwiIHx8IGRyaXZlcnMgPT09IG51bGwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggZHJpdmVyIGZ1bmN0aW9ucyBhcyBwcm9wZXJ0aWVzLlwiKTtcbiAgICB9XG4gICAgaWYgKGludGVybmFsc18xLmlzT2JqZWN0RW1wdHkoZHJpdmVycykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQXJndW1lbnQgZ2l2ZW4gdG8gc2V0dXBSZXVzYWJsZSBtdXN0IGJlIGFuIG9iamVjdCBcIiArXG4gICAgICAgICAgICBcIndpdGggYXQgbGVhc3Qgb25lIGRyaXZlciBmdW5jdGlvbiBkZWNsYXJlZCBhcyBhIHByb3BlcnR5LlwiKTtcbiAgICB9XG4gICAgdmFyIHNpbmtQcm94aWVzID0gaW50ZXJuYWxzXzEubWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpO1xuICAgIHZhciByYXdTb3VyY2VzID0gaW50ZXJuYWxzXzEuY2FsbERyaXZlcnMoZHJpdmVycywgc2lua1Byb3hpZXMpO1xuICAgIHZhciBzb3VyY2VzID0gaW50ZXJuYWxzXzEuYWRhcHRTb3VyY2VzKHJhd1NvdXJjZXMpO1xuICAgIGZ1bmN0aW9uIF9ydW4oc2lua3MpIHtcbiAgICAgICAgcmV0dXJuIGludGVybmFsc18xLnJlcGxpY2F0ZU1hbnkoc2lua3MsIHNpbmtQcm94aWVzKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZGlzcG9zZUVuZ2luZSgpIHtcbiAgICAgICAgaW50ZXJuYWxzXzEuZGlzcG9zZVNvdXJjZXMoc291cmNlcyk7XG4gICAgICAgIGludGVybmFsc18xLmRpc3Bvc2VTaW5rUHJveGllcyhzaW5rUHJveGllcyk7XG4gICAgfVxuICAgIHJldHVybiB7IHNvdXJjZXM6IHNvdXJjZXMsIHJ1bjogX3J1biwgZGlzcG9zZTogZGlzcG9zZUVuZ2luZSB9O1xufVxuZXhwb3J0cy5zZXR1cFJldXNhYmxlID0gc2V0dXBSZXVzYWJsZTtcbi8qKlxuICogVGFrZXMgYSBgbWFpbmAgZnVuY3Rpb24gYW5kIGNpcmN1bGFybHkgY29ubmVjdHMgaXQgdG8gdGhlIGdpdmVuIGNvbGxlY3Rpb25cbiAqIG9mIGRyaXZlciBmdW5jdGlvbnMuXG4gKlxuICogKipFeGFtcGxlOioqXG4gKiBgYGBqc1xuICogaW1wb3J0IHJ1biBmcm9tICdAY3ljbGUvcnVuJztcbiAqIGNvbnN0IGRpc3Bvc2UgPSBydW4obWFpbiwgZHJpdmVycyk7XG4gKiAvLyAuLi5cbiAqIGRpc3Bvc2UoKTtcbiAqIGBgYFxuICpcbiAqIFRoZSBgbWFpbmAgZnVuY3Rpb24gZXhwZWN0cyBhIGNvbGxlY3Rpb24gb2YgXCJzb3VyY2VcIiBzdHJlYW1zIChyZXR1cm5lZCBmcm9tXG4gKiBkcml2ZXJzKSBhcyBpbnB1dCwgYW5kIHNob3VsZCByZXR1cm4gYSBjb2xsZWN0aW9uIG9mIFwic2lua1wiIHN0cmVhbXMgKHRvIGJlXG4gKiBnaXZlbiB0byBkcml2ZXJzKS4gQSBcImNvbGxlY3Rpb24gb2Ygc3RyZWFtc1wiIGlzIGEgSmF2YVNjcmlwdCBvYmplY3Qgd2hlcmVcbiAqIGtleXMgbWF0Y2ggdGhlIGRyaXZlciBuYW1lcyByZWdpc3RlcmVkIGJ5IHRoZSBgZHJpdmVyc2Agb2JqZWN0LCBhbmQgdmFsdWVzXG4gKiBhcmUgdGhlIHN0cmVhbXMuIFJlZmVyIHRvIHRoZSBkb2N1bWVudGF0aW9uIG9mIGVhY2ggZHJpdmVyIHRvIHNlZSBtb3JlXG4gKiBkZXRhaWxzIG9uIHdoYXQgdHlwZXMgb2Ygc291cmNlcyBpdCBvdXRwdXRzIGFuZCBzaW5rcyBpdCByZWNlaXZlcy5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBtYWluIGEgZnVuY3Rpb24gdGhhdCB0YWtlcyBgc291cmNlc2AgYXMgaW5wdXQgYW5kIG91dHB1dHNcbiAqIGBzaW5rc2AuXG4gKiBAcGFyYW0ge09iamVjdH0gZHJpdmVycyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgZHJpdmVyIG5hbWVzIGFuZCB2YWx1ZXNcbiAqIGFyZSBkcml2ZXIgZnVuY3Rpb25zLlxuICogQHJldHVybiB7RnVuY3Rpb259IGEgZGlzcG9zZSBmdW5jdGlvbiwgdXNlZCB0byB0ZXJtaW5hdGUgdGhlIGV4ZWN1dGlvbiBvZiB0aGVcbiAqIEN5Y2xlLmpzIHByb2dyYW0sIGNsZWFuaW5nIHVwIHJlc291cmNlcyB1c2VkLlxuICogQGZ1bmN0aW9uIHJ1blxuICovXG5mdW5jdGlvbiBydW4obWFpbiwgZHJpdmVycykge1xuICAgIHZhciBwcm9ncmFtID0gc2V0dXAobWFpbiwgZHJpdmVycyk7XG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICAgIHdpbmRvdy5DeWNsZWpzRGV2VG9vbF9zdGFydEdyYXBoU2VyaWFsaXplcikge1xuICAgICAgICB3aW5kb3cuQ3ljbGVqc0RldlRvb2xfc3RhcnRHcmFwaFNlcmlhbGl6ZXIocHJvZ3JhbS5zaW5rcyk7XG4gICAgfVxuICAgIHJldHVybiBwcm9ncmFtLnJ1bigpO1xufVxuZXhwb3J0cy5ydW4gPSBydW47XG5leHBvcnRzLmRlZmF1bHQgPSBydW47XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbnZhciB4c3RyZWFtXzEgPSByZXF1aXJlKFwieHN0cmVhbVwiKTtcbnZhciBxdWlja3Rhc2tfMSA9IHJlcXVpcmUoXCJxdWlja3Rhc2tcIik7XG52YXIgYWRhcHRfMSA9IHJlcXVpcmUoXCIuL2FkYXB0XCIpO1xudmFyIHNjaGVkdWxlTWljcm90YXNrID0gcXVpY2t0YXNrXzEuZGVmYXVsdCgpO1xuZnVuY3Rpb24gbWFrZVNpbmtQcm94aWVzKGRyaXZlcnMpIHtcbiAgICB2YXIgc2lua1Byb3hpZXMgPSB7fTtcbiAgICBmb3IgKHZhciBuYW1lXzEgaW4gZHJpdmVycykge1xuICAgICAgICBpZiAoZHJpdmVycy5oYXNPd25Qcm9wZXJ0eShuYW1lXzEpKSB7XG4gICAgICAgICAgICBzaW5rUHJveGllc1tuYW1lXzFdID0geHN0cmVhbV8xLmRlZmF1bHQuY3JlYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHNpbmtQcm94aWVzO1xufVxuZXhwb3J0cy5tYWtlU2lua1Byb3hpZXMgPSBtYWtlU2lua1Byb3hpZXM7XG5mdW5jdGlvbiBjYWxsRHJpdmVycyhkcml2ZXJzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzb3VyY2VzID0ge307XG4gICAgZm9yICh2YXIgbmFtZV8yIGluIGRyaXZlcnMpIHtcbiAgICAgICAgaWYgKGRyaXZlcnMuaGFzT3duUHJvcGVydHkobmFtZV8yKSkge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdID0gZHJpdmVyc1tuYW1lXzJdKHNpbmtQcm94aWVzW25hbWVfMl0sIG5hbWVfMik7XG4gICAgICAgICAgICBpZiAoc291cmNlc1tuYW1lXzJdICYmIHR5cGVvZiBzb3VyY2VzW25hbWVfMl0gPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAgICAgc291cmNlc1tuYW1lXzJdLl9pc0N5Y2xlU291cmNlID0gbmFtZV8yO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5jYWxsRHJpdmVycyA9IGNhbGxEcml2ZXJzO1xuLy8gTk9URTogdGhpcyB3aWxsIG11dGF0ZSBgc291cmNlc2AuXG5mdW5jdGlvbiBhZGFwdFNvdXJjZXMoc291cmNlcykge1xuICAgIGZvciAodmFyIG5hbWVfMyBpbiBzb3VyY2VzKSB7XG4gICAgICAgIGlmIChzb3VyY2VzLmhhc093blByb3BlcnR5KG5hbWVfMykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNbbmFtZV8zXSAmJlxuICAgICAgICAgICAgdHlwZW9mIHNvdXJjZXNbbmFtZV8zXS5zaGFtZWZ1bGx5U2VuZE5leHQgPT09XG4gICAgICAgICAgICAgICAgJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgc291cmNlc1tuYW1lXzNdID0gYWRhcHRfMS5hZGFwdChzb3VyY2VzW25hbWVfM10pO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzb3VyY2VzO1xufVxuZXhwb3J0cy5hZGFwdFNvdXJjZXMgPSBhZGFwdFNvdXJjZXM7XG5mdW5jdGlvbiByZXBsaWNhdGVNYW55KHNpbmtzLCBzaW5rUHJveGllcykge1xuICAgIHZhciBzaW5rTmFtZXMgPSBPYmplY3Qua2V5cyhzaW5rcykuZmlsdGVyKGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiAhIXNpbmtQcm94aWVzW25hbWVdOyB9KTtcbiAgICB2YXIgYnVmZmVycyA9IHt9O1xuICAgIHZhciByZXBsaWNhdG9ycyA9IHt9O1xuICAgIHNpbmtOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0gPSB7IF9uOiBbXSwgX2U6IFtdIH07XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdID0ge1xuICAgICAgICAgICAgbmV4dDogZnVuY3Rpb24gKHgpIHsgcmV0dXJuIGJ1ZmZlcnNbbmFtZV0uX24ucHVzaCh4KTsgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoZXJyKSB7IHJldHVybiBidWZmZXJzW25hbWVdLl9lLnB1c2goZXJyKTsgfSxcbiAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7IH0sXG4gICAgICAgIH07XG4gICAgfSk7XG4gICAgdmFyIHN1YnNjcmlwdGlvbnMgPSBzaW5rTmFtZXMubWFwKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgIHJldHVybiB4c3RyZWFtXzEuZGVmYXVsdC5mcm9tT2JzZXJ2YWJsZShzaW5rc1tuYW1lXSkuc3Vic2NyaWJlKHJlcGxpY2F0b3JzW25hbWVdKTtcbiAgICB9KTtcbiAgICBzaW5rTmFtZXMuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkge1xuICAgICAgICB2YXIgbGlzdGVuZXIgPSBzaW5rUHJveGllc1tuYW1lXTtcbiAgICAgICAgdmFyIG5leHQgPSBmdW5jdGlvbiAoeCkge1xuICAgICAgICAgICAgc2NoZWR1bGVNaWNyb3Rhc2soZnVuY3Rpb24gKCkgeyByZXR1cm4gbGlzdGVuZXIuX24oeCk7IH0pO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZXJyb3IgPSBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBzY2hlZHVsZU1pY3JvdGFzayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgKGNvbnNvbGUuZXJyb3IgfHwgY29uc29sZS5sb2cpKGVycik7XG4gICAgICAgICAgICAgICAgbGlzdGVuZXIuX2UoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgICAgICBidWZmZXJzW25hbWVdLl9uLmZvckVhY2gobmV4dCk7XG4gICAgICAgIGJ1ZmZlcnNbbmFtZV0uX2UuZm9yRWFjaChlcnJvcik7XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLm5leHQgPSBuZXh0O1xuICAgICAgICByZXBsaWNhdG9yc1tuYW1lXS5lcnJvciA9IGVycm9yO1xuICAgICAgICAvLyBiZWNhdXNlIHNpbmsuc3Vic2NyaWJlKHJlcGxpY2F0b3IpIGhhZCBtdXRhdGVkIHJlcGxpY2F0b3IgdG8gYWRkXG4gICAgICAgIC8vIF9uLCBfZSwgX2MsIHdlIG11c3QgYWxzbyB1cGRhdGUgdGhlc2U6XG4gICAgICAgIHJlcGxpY2F0b3JzW25hbWVdLl9uID0gbmV4dDtcbiAgICAgICAgcmVwbGljYXRvcnNbbmFtZV0uX2UgPSBlcnJvcjtcbiAgICB9KTtcbiAgICBidWZmZXJzID0gbnVsbDsgLy8gZnJlZSB1cCBmb3IgR0NcbiAgICByZXR1cm4gZnVuY3Rpb24gZGlzcG9zZVJlcGxpY2F0aW9uKCkge1xuICAgICAgICBzdWJzY3JpcHRpb25zLmZvckVhY2goZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMudW5zdWJzY3JpYmUoKTsgfSk7XG4gICAgfTtcbn1cbmV4cG9ydHMucmVwbGljYXRlTWFueSA9IHJlcGxpY2F0ZU1hbnk7XG5mdW5jdGlvbiBkaXNwb3NlU2lua1Byb3hpZXMoc2lua1Byb3hpZXMpIHtcbiAgICBPYmplY3Qua2V5cyhzaW5rUHJveGllcykuZm9yRWFjaChmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gc2lua1Byb3hpZXNbbmFtZV0uX2MoKTsgfSk7XG59XG5leHBvcnRzLmRpc3Bvc2VTaW5rUHJveGllcyA9IGRpc3Bvc2VTaW5rUHJveGllcztcbmZ1bmN0aW9uIGRpc3Bvc2VTb3VyY2VzKHNvdXJjZXMpIHtcbiAgICBmb3IgKHZhciBrIGluIHNvdXJjZXMpIHtcbiAgICAgICAgaWYgKHNvdXJjZXMuaGFzT3duUHJvcGVydHkoaykgJiZcbiAgICAgICAgICAgIHNvdXJjZXNba10gJiZcbiAgICAgICAgICAgIHNvdXJjZXNba10uZGlzcG9zZSkge1xuICAgICAgICAgICAgc291cmNlc1trXS5kaXNwb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmRpc3Bvc2VTb3VyY2VzID0gZGlzcG9zZVNvdXJjZXM7XG5mdW5jdGlvbiBpc09iamVjdEVtcHR5KG9iaikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhvYmopLmxlbmd0aCA9PT0gMDtcbn1cbmV4cG9ydHMuaXNPYmplY3RFbXB0eSA9IGlzT2JqZWN0RW1wdHk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbnRlcm5hbHMuanMubWFwIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG52YXIgcHJvY2VzcyA9IG1vZHVsZS5leHBvcnRzID0ge307XG5cbi8vIGNhY2hlZCBmcm9tIHdoYXRldmVyIGdsb2JhbCBpcyBwcmVzZW50IHNvIHRoYXQgdGVzdCBydW5uZXJzIHRoYXQgc3R1YiBpdFxuLy8gZG9uJ3QgYnJlYWsgdGhpbmdzLiAgQnV0IHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRyeSBjYXRjaCBpbiBjYXNlIGl0IGlzXG4vLyB3cmFwcGVkIGluIHN0cmljdCBtb2RlIGNvZGUgd2hpY2ggZG9lc24ndCBkZWZpbmUgYW55IGdsb2JhbHMuICBJdCdzIGluc2lkZSBhXG4vLyBmdW5jdGlvbiBiZWNhdXNlIHRyeS9jYXRjaGVzIGRlb3B0aW1pemUgaW4gY2VydGFpbiBlbmdpbmVzLlxuXG52YXIgY2FjaGVkU2V0VGltZW91dDtcbnZhciBjYWNoZWRDbGVhclRpbWVvdXQ7XG5cbmZ1bmN0aW9uIGRlZmF1bHRTZXRUaW1vdXQoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdzZXRUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG5mdW5jdGlvbiBkZWZhdWx0Q2xlYXJUaW1lb3V0ICgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIHNldFRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBpZiAodHlwZW9mIGNsZWFyVGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gZGVmYXVsdENsZWFyVGltZW91dDtcbiAgICB9XG59ICgpKVxuZnVuY3Rpb24gcnVuVGltZW91dChmdW4pIHtcbiAgICBpZiAoY2FjaGVkU2V0VGltZW91dCA9PT0gc2V0VGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgLy8gaWYgc2V0VGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZFNldFRpbWVvdXQgPT09IGRlZmF1bHRTZXRUaW1vdXQgfHwgIWNhY2hlZFNldFRpbWVvdXQpICYmIHNldFRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgLy8gaWYgY2xlYXJUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBkZWZhdWx0Q2xlYXJUaW1lb3V0IHx8ICFjYWNoZWRDbGVhclRpbWVvdXQpICYmIGNsZWFyVGltZW91dCkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5wcmVwZW5kT25jZUxpc3RlbmVyID0gbm9vcDtcblxucHJvY2Vzcy5saXN0ZW5lcnMgPSBmdW5jdGlvbiAobmFtZSkgeyByZXR1cm4gW10gfVxuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZnVuY3Rpb24gbWljcm90YXNrKCkge1xuICAgIGlmICh0eXBlb2YgTXV0YXRpb25PYnNlcnZlciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIG5vZGVfMSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKTtcbiAgICAgICAgdmFyIHF1ZXVlXzEgPSBbXTtcbiAgICAgICAgdmFyIGlfMSA9IDA7XG4gICAgICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdoaWxlIChxdWV1ZV8xLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHF1ZXVlXzEuc2hpZnQoKSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5vYnNlcnZlKG5vZGVfMSwgeyBjaGFyYWN0ZXJEYXRhOiB0cnVlIH0pO1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgICAgICBxdWV1ZV8xLnB1c2goZm4pO1xuICAgICAgICAgICAgbm9kZV8xLmRhdGEgPSBpXzEgPSAxIC0gaV8xO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygc2V0SW1tZWRpYXRlICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICByZXR1cm4gc2V0SW1tZWRpYXRlO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgcmV0dXJuIHByb2Nlc3MubmV4dFRpY2s7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dDtcbiAgICB9XG59XG5leHBvcnRzLmRlZmF1bHQgPSBtaWNyb3Rhc2s7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5qcy5tYXAiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfcG9ueWZpbGwgPSByZXF1aXJlKCcuL3BvbnlmaWxsLmpzJyk7XG5cbnZhciBfcG9ueWZpbGwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcG9ueWZpbGwpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciByb290OyAvKiBnbG9iYWwgd2luZG93ICovXG5cblxuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gc2VsZjtcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IG1vZHVsZTtcbn0gZWxzZSB7XG4gIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxuXG52YXIgcmVzdWx0ID0gKDAsIF9wb255ZmlsbDJbJ2RlZmF1bHQnXSkocm9vdCk7XG5leHBvcnRzWydkZWZhdWx0J10gPSByZXN1bHQ7IiwidmFyIG5leHRUaWNrID0gcmVxdWlyZSgncHJvY2Vzcy9icm93c2VyLmpzJykubmV4dFRpY2s7XG52YXIgYXBwbHkgPSBGdW5jdGlvbi5wcm90b3R5cGUuYXBwbHk7XG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaW1tZWRpYXRlSWRzID0ge307XG52YXIgbmV4dEltbWVkaWF0ZUlkID0gMDtcblxuLy8gRE9NIEFQSXMsIGZvciBjb21wbGV0ZW5lc3NcblxuZXhwb3J0cy5zZXRUaW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldFRpbWVvdXQsIHdpbmRvdywgYXJndW1lbnRzKSwgY2xlYXJUaW1lb3V0KTtcbn07XG5leHBvcnRzLnNldEludGVydmFsID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVGltZW91dChhcHBseS5jYWxsKHNldEludGVydmFsLCB3aW5kb3csIGFyZ3VtZW50cyksIGNsZWFySW50ZXJ2YWwpO1xufTtcbmV4cG9ydHMuY2xlYXJUaW1lb3V0ID1cbmV4cG9ydHMuY2xlYXJJbnRlcnZhbCA9IGZ1bmN0aW9uKHRpbWVvdXQpIHsgdGltZW91dC5jbG9zZSgpOyB9O1xuXG5mdW5jdGlvbiBUaW1lb3V0KGlkLCBjbGVhckZuKSB7XG4gIHRoaXMuX2lkID0gaWQ7XG4gIHRoaXMuX2NsZWFyRm4gPSBjbGVhckZuO1xufVxuVGltZW91dC5wcm90b3R5cGUudW5yZWYgPSBUaW1lb3V0LnByb3RvdHlwZS5yZWYgPSBmdW5jdGlvbigpIHt9O1xuVGltZW91dC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5fY2xlYXJGbi5jYWxsKHdpbmRvdywgdGhpcy5faWQpO1xufTtcblxuLy8gRG9lcyBub3Qgc3RhcnQgdGhlIHRpbWUsIGp1c3Qgc2V0cyB1cCB0aGUgbWVtYmVycyBuZWVkZWQuXG5leHBvcnRzLmVucm9sbCA9IGZ1bmN0aW9uKGl0ZW0sIG1zZWNzKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSBtc2Vjcztcbn07XG5cbmV4cG9ydHMudW5lbnJvbGwgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcbiAgaXRlbS5faWRsZVRpbWVvdXQgPSAtMTtcbn07XG5cbmV4cG9ydHMuX3VucmVmQWN0aXZlID0gZXhwb3J0cy5hY3RpdmUgPSBmdW5jdGlvbihpdGVtKSB7XG4gIGNsZWFyVGltZW91dChpdGVtLl9pZGxlVGltZW91dElkKTtcblxuICB2YXIgbXNlY3MgPSBpdGVtLl9pZGxlVGltZW91dDtcbiAgaWYgKG1zZWNzID49IDApIHtcbiAgICBpdGVtLl9pZGxlVGltZW91dElkID0gc2V0VGltZW91dChmdW5jdGlvbiBvblRpbWVvdXQoKSB7XG4gICAgICBpZiAoaXRlbS5fb25UaW1lb3V0KVxuICAgICAgICBpdGVtLl9vblRpbWVvdXQoKTtcbiAgICB9LCBtc2Vjcyk7XG4gIH1cbn07XG5cbi8vIFRoYXQncyBub3QgaG93IG5vZGUuanMgaW1wbGVtZW50cyBpdCBidXQgdGhlIGV4cG9zZWQgYXBpIGlzIHRoZSBzYW1lLlxuZXhwb3J0cy5zZXRJbW1lZGlhdGUgPSB0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSBcImZ1bmN0aW9uXCIgPyBzZXRJbW1lZGlhdGUgOiBmdW5jdGlvbihmbikge1xuICB2YXIgaWQgPSBuZXh0SW1tZWRpYXRlSWQrKztcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoIDwgMiA/IGZhbHNlIDogc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIGltbWVkaWF0ZUlkc1tpZF0gPSB0cnVlO1xuXG4gIG5leHRUaWNrKGZ1bmN0aW9uIG9uTmV4dFRpY2soKSB7XG4gICAgaWYgKGltbWVkaWF0ZUlkc1tpZF0pIHtcbiAgICAgIC8vIGZuLmNhbGwoKSBpcyBmYXN0ZXIgc28gd2Ugb3B0aW1pemUgZm9yIHRoZSBjb21tb24gdXNlLWNhc2VcbiAgICAgIC8vIEBzZWUgaHR0cDovL2pzcGVyZi5jb20vY2FsbC1hcHBseS1zZWd1XG4gICAgICBpZiAoYXJncykge1xuICAgICAgICBmbi5hcHBseShudWxsLCBhcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZuLmNhbGwobnVsbCk7XG4gICAgICB9XG4gICAgICAvLyBQcmV2ZW50IGlkcyBmcm9tIGxlYWtpbmdcbiAgICAgIGV4cG9ydHMuY2xlYXJJbW1lZGlhdGUoaWQpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIGlkO1xufTtcblxuZXhwb3J0cy5jbGVhckltbWVkaWF0ZSA9IHR5cGVvZiBjbGVhckltbWVkaWF0ZSA9PT0gXCJmdW5jdGlvblwiID8gY2xlYXJJbW1lZGlhdGUgOiBmdW5jdGlvbihpZCkge1xuICBkZWxldGUgaW1tZWRpYXRlSWRzW2lkXTtcbn07IiwiaW1wb3J0IHtydW59IGZyb20gJ0BjeWNsZS9ydW4nO1xuaW1wb3J0IHttYWtlTWV5ZGFEcml2ZXJ9IGZyb20gJ2N5Y2xlLW1leWRhLWRyaXZlcic7XG5cbmZ1bmN0aW9uIG1haW4oc291cmNlcykge1xuICBzb3VyY2VzLk1leWRhLmFkZExpc3RlbmVyKHtuZXh0OiBmID0+IGNvbnNvbGUubG9nKGYpfSk7XG4gIHJldHVybiB7fTtcbn1cblxucnVuKG1haW4sIHtcbiAgTWV5ZGE6IG1ha2VNZXlkYURyaXZlcigpLFxufSk7XG4iXX0=

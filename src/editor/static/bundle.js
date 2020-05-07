(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],2:[function(require,module,exports){
assert.notEqual = notEqual
assert.notOk = notOk
assert.equal = equal
assert.ok = assert

module.exports = assert

function equal (a, b, m) {
  assert(a == b, m) // eslint-disable-line eqeqeq
}

function notEqual (a, b, m) {
  assert(a != b, m) // eslint-disable-line eqeqeq
}

function notOk (t, m) {
  assert(!t, m)
}

function assert (t, m) {
  if (!t) throw new Error(m || 'AssertionError')
}

},{}],3:[function(require,module,exports){
var splice = require('remove-array-items')
var nanotiming = require('nanotiming')
var assert = require('assert')

module.exports = Nanobus

function Nanobus (name) {
  if (!(this instanceof Nanobus)) return new Nanobus(name)

  this._name = name || 'nanobus'
  this._starListeners = []
  this._listeners = {}
}

Nanobus.prototype.emit = function (eventName) {
  assert.ok(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.emit: eventName should be type string or symbol')

  var data = []
  for (var i = 1, len = arguments.length; i < len; i++) {
    data.push(arguments[i])
  }

  var emitTiming = nanotiming(this._name + "('" + eventName.toString() + "')")
  var listeners = this._listeners[eventName]
  if (listeners && listeners.length > 0) {
    this._emit(this._listeners[eventName], data)
  }

  if (this._starListeners.length > 0) {
    this._emit(this._starListeners, eventName, data, emitTiming.uuid)
  }
  emitTiming()

  return this
}

Nanobus.prototype.on = Nanobus.prototype.addListener = function (eventName, listener) {
  assert.ok(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.on: eventName should be type string or symbol')
  assert.equal(typeof listener, 'function', 'nanobus.on: listener should be type function')

  if (eventName === '*') {
    this._starListeners.push(listener)
  } else {
    if (!this._listeners[eventName]) this._listeners[eventName] = []
    this._listeners[eventName].push(listener)
  }
  return this
}

Nanobus.prototype.prependListener = function (eventName, listener) {
  assert.ok(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.prependListener: eventName should be type string or symbol')
  assert.equal(typeof listener, 'function', 'nanobus.prependListener: listener should be type function')

  if (eventName === '*') {
    this._starListeners.unshift(listener)
  } else {
    if (!this._listeners[eventName]) this._listeners[eventName] = []
    this._listeners[eventName].unshift(listener)
  }
  return this
}

Nanobus.prototype.once = function (eventName, listener) {
  assert.ok(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.once: eventName should be type string or symbol')
  assert.equal(typeof listener, 'function', 'nanobus.once: listener should be type function')

  var self = this
  this.on(eventName, once)
  function once () {
    listener.apply(self, arguments)
    self.removeListener(eventName, once)
  }
  return this
}

Nanobus.prototype.prependOnceListener = function (eventName, listener) {
  assert.ok(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.prependOnceListener: eventName should be type string or symbol')
  assert.equal(typeof listener, 'function', 'nanobus.prependOnceListener: listener should be type function')

  var self = this
  this.prependListener(eventName, once)
  function once () {
    listener.apply(self, arguments)
    self.removeListener(eventName, once)
  }
  return this
}

Nanobus.prototype.removeListener = function (eventName, listener) {
  assert.ok(typeof eventName === 'string' || typeof eventName === 'symbol', 'nanobus.removeListener: eventName should be type string or symbol')
  assert.equal(typeof listener, 'function', 'nanobus.removeListener: listener should be type function')

  if (eventName === '*') {
    this._starListeners = this._starListeners.slice()
    return remove(this._starListeners, listener)
  } else {
    if (typeof this._listeners[eventName] !== 'undefined') {
      this._listeners[eventName] = this._listeners[eventName].slice()
    }

    return remove(this._listeners[eventName], listener)
  }

  function remove (arr, listener) {
    if (!arr) return
    var index = arr.indexOf(listener)
    if (index !== -1) {
      splice(arr, index, 1)
      return true
    }
  }
}

Nanobus.prototype.removeAllListeners = function (eventName) {
  if (eventName) {
    if (eventName === '*') {
      this._starListeners = []
    } else {
      this._listeners[eventName] = []
    }
  } else {
    this._starListeners = []
    this._listeners = {}
  }
  return this
}

Nanobus.prototype.listeners = function (eventName) {
  var listeners = eventName !== '*'
    ? this._listeners[eventName]
    : this._starListeners

  var ret = []
  if (listeners) {
    var ilength = listeners.length
    for (var i = 0; i < ilength; i++) ret.push(listeners[i])
  }
  return ret
}

Nanobus.prototype._emit = function (arr, eventName, data, uuid) {
  if (typeof arr === 'undefined') return
  if (arr.length === 0) return
  if (data === undefined) {
    data = eventName
    eventName = null
  }

  if (eventName) {
    if (uuid !== undefined) {
      data = [eventName].concat(data, uuid)
    } else {
      data = [eventName].concat(data)
    }
  }

  var length = arr.length
  for (var i = 0; i < length; i++) {
    var listener = arr[i]
    listener.apply(listener, data)
  }
}

},{"assert":2,"nanotiming":5,"remove-array-items":7}],4:[function(require,module,exports){
var assert = require('assert')

var hasWindow = typeof window !== 'undefined'

function createScheduler () {
  var scheduler
  if (hasWindow) {
    if (!window._nanoScheduler) window._nanoScheduler = new NanoScheduler(true)
    scheduler = window._nanoScheduler
  } else {
    scheduler = new NanoScheduler()
  }
  return scheduler
}

function NanoScheduler (hasWindow) {
  this.hasWindow = hasWindow
  this.hasIdle = this.hasWindow && window.requestIdleCallback
  this.method = this.hasIdle ? window.requestIdleCallback.bind(window) : this.setTimeout
  this.scheduled = false
  this.queue = []
}

NanoScheduler.prototype.push = function (cb) {
  assert.equal(typeof cb, 'function', 'nanoscheduler.push: cb should be type function')

  this.queue.push(cb)
  this.schedule()
}

NanoScheduler.prototype.schedule = function () {
  if (this.scheduled) return

  this.scheduled = true
  var self = this
  this.method(function (idleDeadline) {
    var cb
    while (self.queue.length && idleDeadline.timeRemaining() > 0) {
      cb = self.queue.shift()
      cb(idleDeadline)
    }
    self.scheduled = false
    if (self.queue.length) self.schedule()
  })
}

NanoScheduler.prototype.setTimeout = function (cb) {
  setTimeout(cb, 0, {
    timeRemaining: function () {
      return 1
    }
  })
}

module.exports = createScheduler

},{"assert":2}],5:[function(require,module,exports){
var scheduler = require('nanoscheduler')()
var assert = require('assert')

var perf
nanotiming.disabled = true
try {
  perf = window.performance
  nanotiming.disabled = window.localStorage.DISABLE_NANOTIMING === 'true' || !perf.mark
} catch (e) { }

module.exports = nanotiming

function nanotiming (name) {
  assert.equal(typeof name, 'string', 'nanotiming: name should be type string')

  if (nanotiming.disabled) return noop

  var uuid = (perf.now() * 10000).toFixed() % Number.MAX_SAFE_INTEGER
  var startName = 'start-' + uuid + '-' + name
  perf.mark(startName)

  function end (cb) {
    var endName = 'end-' + uuid + '-' + name
    perf.mark(endName)

    scheduler.push(function () {
      var err = null
      try {
        var measureName = name + ' [' + uuid + ']'
        perf.measure(measureName, startName, endName)
        perf.clearMarks(startName)
        perf.clearMarks(endName)
      } catch (e) { err = e }
      if (cb) cb(err, name)
    })
  }

  end.uuid = uuid
  return end
}

function noop (cb) {
  if (cb) {
    scheduler.push(function () {
      cb(new Error('nanotiming: performance API unavailable'))
    })
  }
}

},{"assert":2,"nanoscheduler":4}],6:[function(require,module,exports){
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.QuillCursors=e():t.QuillCursors=e()}(window,(function(){return function(t){var e={};function n(r){if(e[r])return e[r].exports;var i=e[r]={i:r,l:!1,exports:{}};return t[r].call(i.exports,i,i.exports,n),i.l=!0,i.exports}return n.m=t,n.c=e,n.d=function(t,e,r){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:r})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var i in t)n.d(r,i,function(e){return t[e]}.bind(null,i));return r},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=4)}([function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r=n(6),i=function(){function t(t,e,n){this.id=t,this.name=e,this.color=n}return t.prototype.build=function(e){var n=document.createElement(t.CONTAINER_ELEMENT_TAG);n.classList.add(t.CURSOR_CLASS),n.id="ql-cursor-"+this.id,n.innerHTML=e.template;var r=n.getElementsByClassName(t.SELECTION_CLASS)[0],i=n.getElementsByClassName(t.CARET_CONTAINER_CLASS)[0],o=i.getElementsByClassName(t.CARET_CLASS)[0],s=n.getElementsByClassName(t.FLAG_CLASS)[0];return s.style.backgroundColor=this.color,o.style.backgroundColor=this.color,n.getElementsByClassName(t.NAME_CLASS)[0].textContent=this.name,this._hideDelay=e.hideDelayMs+"ms",this._hideSpeedMs=e.hideSpeedMs,this._positionFlag=e.positionFlag,s.style.transitionDelay=this._hideDelay,s.style.transitionDuration=this._hideSpeedMs+"ms",this._el=n,this._selectionEl=r,this._caretEl=i,this._flagEl=s,this._el},t.prototype.show=function(){this._el.classList.remove(t.HIDDEN_CLASS)},t.prototype.hide=function(){this._el.classList.add(t.HIDDEN_CLASS)},t.prototype.remove=function(){this._el.parentNode.removeChild(this._el)},t.prototype.toggleFlag=function(e){var n=this;this._flagEl.classList.toggle(t.SHOW_FLAG_CLASS,e)||(this._flagEl.classList.add(t.NO_DELAY_CLASS),setTimeout((function(){return n._flagEl.classList.remove(t.NO_DELAY_CLASS)}),this._hideSpeedMs))},t.prototype.updateCaret=function(t,e){this._caretEl.style.top=t.top+"px",this._caretEl.style.left=t.left+"px",this._caretEl.style.height=t.height+"px",this._positionFlag?this._positionFlag(this._flagEl,t,e):this._updateCaretFlag(t,e)},t.prototype.updateSelection=function(t,e){var n=this;this._clearSelection(),t=t||[],t=Array.from(t),t=this._sanitize(t),(t=this._sortByDomPosition(t)).forEach((function(t){return n._addSelection(t,e)}))},t.prototype._updateCaretFlag=function(e,n){this._flagEl.style.width="";var r=this._flagEl.getBoundingClientRect();this._flagEl.classList.remove(t.FLAG_FLIPPED_CLASS),e.left>n.width-r.width&&this._flagEl.classList.add(t.FLAG_FLIPPED_CLASS),this._flagEl.style.left=e.left+"px",this._flagEl.style.top=e.top+"px",this._flagEl.style.width=Math.ceil(r.width)+"px"},t.prototype._clearSelection=function(){this._selectionEl.innerHTML=""},t.prototype._addSelection=function(t,e){var n=this._selectionBlock(t,e);this._selectionEl.appendChild(n)},t.prototype._selectionBlock=function(e,n){var i=document.createElement(t.SELECTION_ELEMENT_TAG);return i.classList.add(t.SELECTION_BLOCK_CLASS),i.style.top=e.top-n.top+"px",i.style.left=e.left-n.left+"px",i.style.width=e.width+"px",i.style.height=e.height+"px",i.style.backgroundColor=r(this.color).setAlpha(.3).toString(),i},t.prototype._sortByDomPosition=function(t){return t.sort((function(t,e){return t.top===e.top?t.left-e.left:t.top-e.top}))},t.prototype._sanitize=function(t){var e=this,n=new Set;return t.filter((function(t){if(!t.width||!t.height)return!1;var r=e._serialize(t);return!n.has(r)&&(n.add(r),!0)}))},t.prototype._serialize=function(t){return["top:"+t.top,"right:"+t.right,"bottom:"+t.bottom,"left:"+t.left].join(";")},t.CONTAINER_ELEMENT_TAG="SPAN",t.SELECTION_ELEMENT_TAG="SPAN",t.CURSOR_CLASS="ql-cursor",t.SELECTION_CLASS="ql-cursor-selections",t.SELECTION_BLOCK_CLASS="ql-cursor-selection-block",t.CARET_CLASS="ql-cursor-caret",t.CARET_CONTAINER_CLASS="ql-cursor-caret-container",t.FLAG_CLASS="ql-cursor-flag",t.SHOW_FLAG_CLASS="show-flag",t.FLAG_FLIPPED_CLASS="flag-flipped",t.NAME_CLASS="ql-cursor-name",t.HIDDEN_CLASS="hidden",t.NO_DELAY_CLASS="no-delay",t}();e.default=i},function(t,e,n){var r=Array.prototype.slice,i=n(12),o=n(13),s=t.exports=function(t,e,n){return n||(n={}),t===e||(t instanceof Date&&e instanceof Date?t.getTime()===e.getTime():!t||!e||"object"!=typeof t&&"object"!=typeof e?n.strict?t===e:t==e:function(t,e,n){var l,c;if(a(t)||a(e))return!1;if(t.prototype!==e.prototype)return!1;if(o(t))return!!o(e)&&(t=r.call(t),e=r.call(e),s(t,e,n));if(u(t)){if(!u(e))return!1;if(t.length!==e.length)return!1;for(l=0;l<t.length;l++)if(t[l]!==e[l])return!1;return!0}try{var f=i(t),h=i(e)}catch(t){return!1}if(f.length!=h.length)return!1;for(f.sort(),h.sort(),l=f.length-1;l>=0;l--)if(f[l]!=h[l])return!1;for(l=f.length-1;l>=0;l--)if(c=f[l],!s(t[c],e[c],n))return!1;return typeof t==typeof e}(t,e,n))};function a(t){return null==t}function u(t){return!(!t||"object"!=typeof t||"number"!=typeof t.length)&&("function"==typeof t.copy&&"function"==typeof t.slice&&!(t.length>0&&"number"!=typeof t[0]))}},function(t,e,n){"use strict";var r=Object.prototype.hasOwnProperty,i=Object.prototype.toString,o=Object.defineProperty,s=Object.getOwnPropertyDescriptor,a=function(t){return"function"==typeof Array.isArray?Array.isArray(t):"[object Array]"===i.call(t)},u=function(t){if(!t||"[object Object]"!==i.call(t))return!1;var e,n=r.call(t,"constructor"),o=t.constructor&&t.constructor.prototype&&r.call(t.constructor.prototype,"isPrototypeOf");if(t.constructor&&!n&&!o)return!1;for(e in t);return void 0===e||r.call(t,e)},l=function(t,e){o&&"__proto__"===e.name?o(t,e.name,{enumerable:!0,configurable:!0,value:e.newValue,writable:!0}):t[e.name]=e.newValue},c=function(t,e){if("__proto__"===e){if(!r.call(t,e))return;if(s)return s(t,e).value}return t[e]};t.exports=function t(){var e,n,r,i,o,s,f=arguments[0],h=1,p=arguments.length,d=!1;for("boolean"==typeof f&&(d=f,f=arguments[1]||{},h=2),(null==f||"object"!=typeof f&&"function"!=typeof f)&&(f={});h<p;++h)if(null!=(e=arguments[h]))for(n in e)r=c(f,n),f!==(i=c(e,n))&&(d&&i&&(u(i)||(o=a(i)))?(o?(o=!1,s=r&&a(r)?r:[]):s=r&&u(r)?r:{},l(f,{name:n,newValue:t(d,s,i)})):void 0!==i&&l(f,{name:n,newValue:i}));return f}},function(t,e,n){"use strict";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(e,"__esModule",{value:!0});var i,o=r(n(16));!function(t){t.iterator=function(t){return new o.default(t)},t.length=function(t){return"number"==typeof t.delete?t.delete:"number"==typeof t.retain?t.retain:"string"==typeof t.insert?t.insert.length:1}}(i||(i={})),e.default=i},function(t,e,n){"use strict";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(e,"__esModule",{value:!0});var i=r(n(5));e.default=i.default;var o=r(n(0));e.Cursor=o.default,n(17)},function(t,e,n){"use strict";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}},i=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var n in t)Object.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e.default=t,e};Object.defineProperty(e,"__esModule",{value:!0});var o=r(n(0)),s=i(n(7)),a=r(n(8)),u=r(n(9)),l=n(11),c=function(){function t(t,e){void 0===e&&(e={}),this._cursors={},this._quill=t,this._options=this._setDefaults(e),this._container=this._quill.addContainer(this._options.containerClass),this._boundsContainer=this._options.boundsContainer||this._quill.container,this._currentSelection=this._quill.getSelection(),this._registerSelectionChangeListeners(),this._registerTextChangeListener(),this._registerDomListeners()}return t.prototype.createCursor=function(t,e,n){var r=this._cursors[t];if(!r){r=new o.default(t,e,n),this._cursors[t]=r;var i=r.build(this._options);this._container.appendChild(i)}return r},t.prototype.moveCursor=function(t,e){var n=this._cursors[t];n&&(n.range=e,this._updateCursor(n))},t.prototype.removeCursor=function(t){var e=this._cursors[t];e&&(e.remove(),delete this._cursors[t])},t.prototype.update=function(){var t=this;this.cursors().forEach((function(e){return t._updateCursor(e)}))},t.prototype.clearCursors=function(){var t=this;this.cursors().forEach((function(e){return t.removeCursor(e.id)}))},t.prototype.toggleFlag=function(t,e){var n=this._cursors[t];n&&n.toggleFlag(e)},t.prototype.cursors=function(){var t=this;return Object.keys(this._cursors).map((function(e){return t._cursors[e]}))},t.prototype._registerSelectionChangeListeners=function(){var t=this;this._quill.on(this._quill.constructor.events.SELECTION_CHANGE,(function(e){t._currentSelection=e}))},t.prototype._registerTextChangeListener=function(){var t=this;this._quill.on(this._quill.constructor.events.TEXT_CHANGE,(function(e){return t._handleTextChange(e)}))},t.prototype._registerDomListeners=function(){var t=this,e=this._quill.container.getElementsByClassName("ql-editor")[0];e.addEventListener("scroll",(function(){return t.update()})),new u.default((function(){return t.update()})).observe(e)},t.prototype._updateCursor=function(t){if(!t.range)return t.hide();var e=this._indexWithinQuillBounds(t.range.index),n=this._indexWithinQuillBounds(t.range.index+t.range.length),r=this._quill.getLeaf(e),i=this._quill.getLeaf(n);if(!this._leafIsValid(r)||!this._leafIsValid(i))return t.hide();t.show();var o=this._boundsContainer.getBoundingClientRect(),a=this._quill.getBounds(n);t.updateCaret(a,o);var u=this._lineRanges(t,r,i).reduce((function(t,e){return t.concat(Array.from(s.getClientRects(e)))}),[]);t.updateSelection(u,o)},t.prototype._indexWithinQuillBounds=function(t){var e=this._quill.getLength(),n=e?e-1:0;return t=Math.max(t,0),t=Math.min(t,n)},t.prototype._leafIsValid=function(t){return t&&t[0]&&t[0].domNode&&t[1]>=0},t.prototype._handleTextChange=function(t){var e=this;window.setTimeout((function(){e._options.transformOnTextChange&&e._transformCursors(t),e._options.selectionChangeSource&&(e._emitSelection(),e.update())}))},t.prototype._emitSelection=function(){this._quill.emitter.emit(this._quill.constructor.events.SELECTION_CHANGE,this._quill.getSelection(),this._currentSelection,this._options.selectionChangeSource)},t.prototype._setDefaults=function(t){return(t=Object.assign({},t)).template=t.template||a.default,t.containerClass=t.containerClass||"ql-cursors",null!==t.selectionChangeSource&&(t.selectionChangeSource=t.selectionChangeSource||this._quill.constructor.sources.API),t.hideDelayMs=Number.isInteger(t.hideDelayMs)?t.hideDelayMs:3e3,t.hideSpeedMs=Number.isInteger(t.hideSpeedMs)?t.hideSpeedMs:400,t.transformOnTextChange=!!t.transformOnTextChange,t},t.prototype._lineRanges=function(t,e,n){var r=this._quill.getLines(t.range);return r.reduce((function(t,i,o){if(!i.children){var s=document.createRange();return s.selectNode(i.domNode),t.concat(s)}var a=0===o?e:i.path(0).pop(),u=a[0],l=a[1],c=o===r.length-1?n:i.path(i.length()-1).pop(),f=c[0],h=c[1],p=document.createRange();return p.setStart(u.domNode,l),p.setEnd(f.domNode,h),t.concat(p)}),[])},t.prototype._transformCursors=function(t){var e=this;t=new l(t),this.cursors().filter((function(t){return t.range})).forEach((function(n){n.range.index=t.transformPosition(n.range.index),e._updateCursor(n)}))},t}();e.default=c},function(t,e,n){var r;!function(i){var o=/^\s+/,s=/\s+$/,a=0,u=i.round,l=i.min,c=i.max,f=i.random;function h(t,e){if(e=e||{},(t=t||"")instanceof h)return t;if(!(this instanceof h))return new h(t,e);var n=function(t){var e={r:0,g:0,b:0},n=1,r=null,a=null,u=null,f=!1,h=!1;"string"==typeof t&&(t=function(t){t=t.replace(o,"").replace(s,"").toLowerCase();var e,n=!1;if(M[t])t=M[t],n=!0;else if("transparent"==t)return{r:0,g:0,b:0,a:0,format:"name"};if(e=G.rgb.exec(t))return{r:e[1],g:e[2],b:e[3]};if(e=G.rgba.exec(t))return{r:e[1],g:e[2],b:e[3],a:e[4]};if(e=G.hsl.exec(t))return{h:e[1],s:e[2],l:e[3]};if(e=G.hsla.exec(t))return{h:e[1],s:e[2],l:e[3],a:e[4]};if(e=G.hsv.exec(t))return{h:e[1],s:e[2],v:e[3]};if(e=G.hsva.exec(t))return{h:e[1],s:e[2],v:e[3],a:e[4]};if(e=G.hex8.exec(t))return{r:q(e[1]),g:q(e[2]),b:q(e[3]),a:H(e[4]),format:n?"name":"hex8"};if(e=G.hex6.exec(t))return{r:q(e[1]),g:q(e[2]),b:q(e[3]),format:n?"name":"hex"};if(e=G.hex4.exec(t))return{r:q(e[1]+""+e[1]),g:q(e[2]+""+e[2]),b:q(e[3]+""+e[3]),a:H(e[4]+""+e[4]),format:n?"name":"hex8"};if(e=G.hex3.exec(t))return{r:q(e[1]+""+e[1]),g:q(e[2]+""+e[2]),b:q(e[3]+""+e[3]),format:n?"name":"hex"};return!1}(t));"object"==typeof t&&(U(t.r)&&U(t.g)&&U(t.b)?(p=t.r,d=t.g,g=t.b,e={r:255*T(p,255),g:255*T(d,255),b:255*T(g,255)},f=!0,h="%"===String(t.r).substr(-1)?"prgb":"rgb"):U(t.h)&&U(t.s)&&U(t.v)?(r=F(t.s),a=F(t.v),e=function(t,e,n){t=6*T(t,360),e=T(e,100),n=T(n,100);var r=i.floor(t),o=t-r,s=n*(1-e),a=n*(1-o*e),u=n*(1-(1-o)*e),l=r%6;return{r:255*[n,a,s,s,u,n][l],g:255*[u,n,n,a,s,s][l],b:255*[s,s,u,n,n,a][l]}}(t.h,r,a),f=!0,h="hsv"):U(t.h)&&U(t.s)&&U(t.l)&&(r=F(t.s),u=F(t.l),e=function(t,e,n){var r,i,o;function s(t,e,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?t+6*(e-t)*n:n<.5?e:n<2/3?t+(e-t)*(2/3-n)*6:t}if(t=T(t,360),e=T(e,100),n=T(n,100),0===e)r=i=o=n;else{var a=n<.5?n*(1+e):n+e-n*e,u=2*n-a;r=s(u,a,t+1/3),i=s(u,a,t),o=s(u,a,t-1/3)}return{r:255*r,g:255*i,b:255*o}}(t.h,r,u),f=!0,h="hsl"),t.hasOwnProperty("a")&&(n=t.a));var p,d,g;return n=j(n),{ok:f,format:t.format||h,r:l(255,c(e.r,0)),g:l(255,c(e.g,0)),b:l(255,c(e.b,0)),a:n}}(t);this._originalInput=t,this._r=n.r,this._g=n.g,this._b=n.b,this._a=n.a,this._roundA=u(100*this._a)/100,this._format=e.format||n.format,this._gradientType=e.gradientType,this._r<1&&(this._r=u(this._r)),this._g<1&&(this._g=u(this._g)),this._b<1&&(this._b=u(this._b)),this._ok=n.ok,this._tc_id=a++}function p(t,e,n){t=T(t,255),e=T(e,255),n=T(n,255);var r,i,o=c(t,e,n),s=l(t,e,n),a=(o+s)/2;if(o==s)r=i=0;else{var u=o-s;switch(i=a>.5?u/(2-o-s):u/(o+s),o){case t:r=(e-n)/u+(e<n?6:0);break;case e:r=(n-t)/u+2;break;case n:r=(t-e)/u+4}r/=6}return{h:r,s:i,l:a}}function d(t,e,n){t=T(t,255),e=T(e,255),n=T(n,255);var r,i,o=c(t,e,n),s=l(t,e,n),a=o,u=o-s;if(i=0===o?0:u/o,o==s)r=0;else{switch(o){case t:r=(e-n)/u+(e<n?6:0);break;case e:r=(n-t)/u+2;break;case n:r=(t-e)/u+4}r/=6}return{h:r,s:i,v:a}}function g(t,e,n,r){var i=[D(u(t).toString(16)),D(u(e).toString(16)),D(u(n).toString(16))];return r&&i[0].charAt(0)==i[0].charAt(1)&&i[1].charAt(0)==i[1].charAt(1)&&i[2].charAt(0)==i[2].charAt(1)?i[0].charAt(0)+i[1].charAt(0)+i[2].charAt(0):i.join("")}function b(t,e,n,r){return[D(I(r)),D(u(t).toString(16)),D(u(e).toString(16)),D(u(n).toString(16))].join("")}function v(t,e){e=0===e?0:e||10;var n=h(t).toHsl();return n.s-=e/100,n.s=N(n.s),h(n)}function _(t,e){e=0===e?0:e||10;var n=h(t).toHsl();return n.s+=e/100,n.s=N(n.s),h(n)}function y(t){return h(t).desaturate(100)}function m(t,e){e=0===e?0:e||10;var n=h(t).toHsl();return n.l+=e/100,n.l=N(n.l),h(n)}function A(t,e){e=0===e?0:e||10;var n=h(t).toRgb();return n.r=c(0,l(255,n.r-u(-e/100*255))),n.g=c(0,l(255,n.g-u(-e/100*255))),n.b=c(0,l(255,n.b-u(-e/100*255))),h(n)}function x(t,e){e=0===e?0:e||10;var n=h(t).toHsl();return n.l-=e/100,n.l=N(n.l),h(n)}function C(t,e){var n=h(t).toHsl(),r=(n.h+e)%360;return n.h=r<0?360+r:r,h(n)}function w(t){var e=h(t).toHsl();return e.h=(e.h+180)%360,h(e)}function S(t){var e=h(t).toHsl(),n=e.h;return[h(t),h({h:(n+120)%360,s:e.s,l:e.l}),h({h:(n+240)%360,s:e.s,l:e.l})]}function E(t){var e=h(t).toHsl(),n=e.h;return[h(t),h({h:(n+90)%360,s:e.s,l:e.l}),h({h:(n+180)%360,s:e.s,l:e.l}),h({h:(n+270)%360,s:e.s,l:e.l})]}function O(t){var e=h(t).toHsl(),n=e.h;return[h(t),h({h:(n+72)%360,s:e.s,l:e.l}),h({h:(n+216)%360,s:e.s,l:e.l})]}function L(t,e,n){e=e||6,n=n||30;var r=h(t).toHsl(),i=360/n,o=[h(t)];for(r.h=(r.h-(i*e>>1)+720)%360;--e;)r.h=(r.h+i)%360,o.push(h(r));return o}function k(t,e){e=e||6;for(var n=h(t).toHsv(),r=n.h,i=n.s,o=n.v,s=[],a=1/e;e--;)s.push(h({h:r,s:i,v:o})),o=(o+a)%1;return s}h.prototype={isDark:function(){return this.getBrightness()<128},isLight:function(){return!this.isDark()},isValid:function(){return this._ok},getOriginalInput:function(){return this._originalInput},getFormat:function(){return this._format},getAlpha:function(){return this._a},getBrightness:function(){var t=this.toRgb();return(299*t.r+587*t.g+114*t.b)/1e3},getLuminance:function(){var t,e,n,r=this.toRgb();return t=r.r/255,e=r.g/255,n=r.b/255,.2126*(t<=.03928?t/12.92:i.pow((t+.055)/1.055,2.4))+.7152*(e<=.03928?e/12.92:i.pow((e+.055)/1.055,2.4))+.0722*(n<=.03928?n/12.92:i.pow((n+.055)/1.055,2.4))},setAlpha:function(t){return this._a=j(t),this._roundA=u(100*this._a)/100,this},toHsv:function(){var t=d(this._r,this._g,this._b);return{h:360*t.h,s:t.s,v:t.v,a:this._a}},toHsvString:function(){var t=d(this._r,this._g,this._b),e=u(360*t.h),n=u(100*t.s),r=u(100*t.v);return 1==this._a?"hsv("+e+", "+n+"%, "+r+"%)":"hsva("+e+", "+n+"%, "+r+"%, "+this._roundA+")"},toHsl:function(){var t=p(this._r,this._g,this._b);return{h:360*t.h,s:t.s,l:t.l,a:this._a}},toHslString:function(){var t=p(this._r,this._g,this._b),e=u(360*t.h),n=u(100*t.s),r=u(100*t.l);return 1==this._a?"hsl("+e+", "+n+"%, "+r+"%)":"hsla("+e+", "+n+"%, "+r+"%, "+this._roundA+")"},toHex:function(t){return g(this._r,this._g,this._b,t)},toHexString:function(t){return"#"+this.toHex(t)},toHex8:function(t){return function(t,e,n,r,i){var o=[D(u(t).toString(16)),D(u(e).toString(16)),D(u(n).toString(16)),D(I(r))];if(i&&o[0].charAt(0)==o[0].charAt(1)&&o[1].charAt(0)==o[1].charAt(1)&&o[2].charAt(0)==o[2].charAt(1)&&o[3].charAt(0)==o[3].charAt(1))return o[0].charAt(0)+o[1].charAt(0)+o[2].charAt(0)+o[3].charAt(0);return o.join("")}(this._r,this._g,this._b,this._a,t)},toHex8String:function(t){return"#"+this.toHex8(t)},toRgb:function(){return{r:u(this._r),g:u(this._g),b:u(this._b),a:this._a}},toRgbString:function(){return 1==this._a?"rgb("+u(this._r)+", "+u(this._g)+", "+u(this._b)+")":"rgba("+u(this._r)+", "+u(this._g)+", "+u(this._b)+", "+this._roundA+")"},toPercentageRgb:function(){return{r:u(100*T(this._r,255))+"%",g:u(100*T(this._g,255))+"%",b:u(100*T(this._b,255))+"%",a:this._a}},toPercentageRgbString:function(){return 1==this._a?"rgb("+u(100*T(this._r,255))+"%, "+u(100*T(this._g,255))+"%, "+u(100*T(this._b,255))+"%)":"rgba("+u(100*T(this._r,255))+"%, "+u(100*T(this._g,255))+"%, "+u(100*T(this._b,255))+"%, "+this._roundA+")"},toName:function(){return 0===this._a?"transparent":!(this._a<1)&&(R[g(this._r,this._g,this._b,!0)]||!1)},toFilter:function(t){var e="#"+b(this._r,this._g,this._b,this._a),n=e,r=this._gradientType?"GradientType = 1, ":"";if(t){var i=h(t);n="#"+b(i._r,i._g,i._b,i._a)}return"progid:DXImageTransform.Microsoft.gradient("+r+"startColorstr="+e+",endColorstr="+n+")"},toString:function(t){var e=!!t;t=t||this._format;var n=!1,r=this._a<1&&this._a>=0;return e||!r||"hex"!==t&&"hex6"!==t&&"hex3"!==t&&"hex4"!==t&&"hex8"!==t&&"name"!==t?("rgb"===t&&(n=this.toRgbString()),"prgb"===t&&(n=this.toPercentageRgbString()),"hex"!==t&&"hex6"!==t||(n=this.toHexString()),"hex3"===t&&(n=this.toHexString(!0)),"hex4"===t&&(n=this.toHex8String(!0)),"hex8"===t&&(n=this.toHex8String()),"name"===t&&(n=this.toName()),"hsl"===t&&(n=this.toHslString()),"hsv"===t&&(n=this.toHsvString()),n||this.toHexString()):"name"===t&&0===this._a?this.toName():this.toRgbString()},clone:function(){return h(this.toString())},_applyModification:function(t,e){var n=t.apply(null,[this].concat([].slice.call(e)));return this._r=n._r,this._g=n._g,this._b=n._b,this.setAlpha(n._a),this},lighten:function(){return this._applyModification(m,arguments)},brighten:function(){return this._applyModification(A,arguments)},darken:function(){return this._applyModification(x,arguments)},desaturate:function(){return this._applyModification(v,arguments)},saturate:function(){return this._applyModification(_,arguments)},greyscale:function(){return this._applyModification(y,arguments)},spin:function(){return this._applyModification(C,arguments)},_applyCombination:function(t,e){return t.apply(null,[this].concat([].slice.call(e)))},analogous:function(){return this._applyCombination(L,arguments)},complement:function(){return this._applyCombination(w,arguments)},monochromatic:function(){return this._applyCombination(k,arguments)},splitcomplement:function(){return this._applyCombination(O,arguments)},triad:function(){return this._applyCombination(S,arguments)},tetrad:function(){return this._applyCombination(E,arguments)}},h.fromRatio=function(t,e){if("object"==typeof t){var n={};for(var r in t)t.hasOwnProperty(r)&&(n[r]="a"===r?t[r]:F(t[r]));t=n}return h(t,e)},h.equals=function(t,e){return!(!t||!e)&&h(t).toRgbString()==h(e).toRgbString()},h.random=function(){return h.fromRatio({r:f(),g:f(),b:f()})},h.mix=function(t,e,n){n=0===n?0:n||50;var r=h(t).toRgb(),i=h(e).toRgb(),o=n/100;return h({r:(i.r-r.r)*o+r.r,g:(i.g-r.g)*o+r.g,b:(i.b-r.b)*o+r.b,a:(i.a-r.a)*o+r.a})},h.readability=function(t,e){var n=h(t),r=h(e);return(i.max(n.getLuminance(),r.getLuminance())+.05)/(i.min(n.getLuminance(),r.getLuminance())+.05)},h.isReadable=function(t,e,n){var r,i,o=h.readability(t,e);switch(i=!1,(r=function(t){var e,n;e=((t=t||{level:"AA",size:"small"}).level||"AA").toUpperCase(),n=(t.size||"small").toLowerCase(),"AA"!==e&&"AAA"!==e&&(e="AA");"small"!==n&&"large"!==n&&(n="small");return{level:e,size:n}}(n)).level+r.size){case"AAsmall":case"AAAlarge":i=o>=4.5;break;case"AAlarge":i=o>=3;break;case"AAAsmall":i=o>=7}return i},h.mostReadable=function(t,e,n){var r,i,o,s,a=null,u=0;i=(n=n||{}).includeFallbackColors,o=n.level,s=n.size;for(var l=0;l<e.length;l++)(r=h.readability(t,e[l]))>u&&(u=r,a=h(e[l]));return h.isReadable(t,a,{level:o,size:s})||!i?a:(n.includeFallbackColors=!1,h.mostReadable(t,["#fff","#000"],n))};var M=h.names={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",burntsienna:"ea7e5d",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgreen:"006400",darkgrey:"a9a9a9",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",green:"008000",greenyellow:"adff2f",grey:"808080",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgreen:"90ee90",lightgrey:"d3d3d3",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370db",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"db7093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"663399",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},R=h.hexNames=function(t){var e={};for(var n in t)t.hasOwnProperty(n)&&(e[t[n]]=n);return e}(M);function j(t){return t=parseFloat(t),(isNaN(t)||t<0||t>1)&&(t=1),t}function T(t,e){(function(t){return"string"==typeof t&&-1!=t.indexOf(".")&&1===parseFloat(t)})(t)&&(t="100%");var n=function(t){return"string"==typeof t&&-1!=t.indexOf("%")}(t);return t=l(e,c(0,parseFloat(t))),n&&(t=parseInt(t*e,10)/100),i.abs(t-e)<1e-6?1:t%e/parseFloat(e)}function N(t){return l(1,c(0,t))}function q(t){return parseInt(t,16)}function D(t){return 1==t.length?"0"+t:""+t}function F(t){return t<=1&&(t=100*t+"%"),t}function I(t){return i.round(255*parseFloat(t)).toString(16)}function H(t){return q(t)/255}var P,B,z,G=(B="[\\s|\\(]+("+(P="(?:[-\\+]?\\d*\\.\\d+%?)|(?:[-\\+]?\\d+%?)")+")[,|\\s]+("+P+")[,|\\s]+("+P+")\\s*\\)?",z="[\\s|\\(]+("+P+")[,|\\s]+("+P+")[,|\\s]+("+P+")[,|\\s]+("+P+")\\s*\\)?",{CSS_UNIT:new RegExp(P),rgb:new RegExp("rgb"+B),rgba:new RegExp("rgba"+z),hsl:new RegExp("hsl"+B),hsla:new RegExp("hsla"+z),hsv:new RegExp("hsv"+B),hsva:new RegExp("hsva"+z),hex3:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex6:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,hex4:/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,hex8:/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/});function U(t){return!!G.CSS_UNIT.exec(t)}t.exports?t.exports=h:void 0===(r=function(){return h}.call(e,n,e,t))||(t.exports=r)}(Math)},function(t,e,n){var r,i;
/*!
 * RangeFix v0.2.8
 * https://github.com/edg2s/rangefix
 *
 * Copyright 2014-17 Ed Sanders.
 * Released under the MIT license
 */void 0===(i="function"==typeof(r=function(){var t,e={};function n(t){var e;return t?screen.deviceXDPI===screen.logicalXDPI?t:"length"in t?Array.prototype.map.call(t,n):(e=screen.deviceXDPI/screen.logicalXDPI,{top:t.top/e,bottom:t.bottom/e,left:t.left/e,right:t.right/e,width:t.width/e,height:t.height/e}):t}function r(t,e){var n,r=0;if(1024>=e.length)return Array.prototype.push.apply(t,e);for(;r<e.length;)n=Array.prototype.push.apply(t,Array.prototype.slice.call(e,r,r+1024)),r+=1024;return n}return e.isBroken=function(){var e,n,r,i,o,s,a,u;return void 0===t&&(n=document.createElement("p"),r=document.createElement("span"),i=document.createTextNode("aa"),o=document.createTextNode("aa"),(s=document.createElement("img")).setAttribute("src","data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="),a=document.createRange(),t={},n.appendChild(i),n.appendChild(r),r.appendChild(s),r.appendChild(o),document.body.appendChild(n),a.setStart(i,1),a.setEnd(r,0),t.getClientRects=t.getBoundingClientRect=a.getClientRects().length>1,t.getClientRects||(a.setEnd(o,1),t.getClientRects=t.getBoundingClientRect=2===a.getClientRects().length),t.getBoundingClientRect||(a.setEnd(a.startContainer,a.startOffset),e=a.getBoundingClientRect(),t.getBoundingClientRect=0===e.top&&0===e.left),document.body.removeChild(n),u=window.ActiveXObject&&new Function("/*@cc_on return @_jscript_version; @*/")(),t.ieZoom=!!u&&u<=10),t},e.getClientRects=function(t){var e,i,o,s,a,u=this.isBroken();if(u.ieZoom)return n(t.getClientRects());if(!u.getClientRects)return t.getClientRects();for(e=[],o=[],i=t.endContainer,s=t.endOffset,a=document.createRange();i!==t.commonAncestorContainer;)a.setStart(i,0),a.setEnd(i,s),r(o,a.getClientRects()),s=Array.prototype.indexOf.call(i.parentNode.childNodes,i),i=i.parentNode;return(a=t.cloneRange()).setEnd(i,s),r(e,a.getClientRects()),r(e,o),e},e.getBoundingClientRect=function(t){var e,r,i,o,s,a,u=this.getClientRects(t);if(0===u.length)return null;if(s=t.getBoundingClientRect(),(a=this.isBroken()).ieZoom)return n(s);if(!a.getBoundingClientRect)return s;if(0===s.width&&0===s.height)return u[0];for(e=0,r=u.length;e<r;e++)o=u[e],i?(i.left=Math.min(i.left,o.left),i.top=Math.min(i.top,o.top),i.right=Math.max(i.right,o.right),i.bottom=Math.max(i.bottom,o.bottom)):i={left:o.left,top:o.top,right:o.right,bottom:o.bottom};return i&&(i.width=i.right-i.left,i.height=i.bottom-i.top),i},e})?r.call(e,n,e,t):r)||(t.exports=i)},function(t,e,n){"use strict";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(e,"__esModule",{value:!0});var i=r(n(0)),o='\n  <span class="'+i.default.SELECTION_CLASS+'"></span>\n  <span class="'+i.default.CARET_CONTAINER_CLASS+'">\n    <span class="'+i.default.CARET_CLASS+'"></span>\n  </span>\n  <div class="'+i.default.FLAG_CLASS+'">\n    <small class="'+i.default.NAME_CLASS+'"></small>\n  </div>\n';e.default=o},function(t,e,n){"use strict";n.r(e),function(t){var n=function(){if("undefined"!=typeof Map)return Map;function t(t,e){var n=-1;return t.some((function(t,r){return t[0]===e&&(n=r,!0)})),n}return(function(){function e(){this.__entries__=[]}return Object.defineProperty(e.prototype,"size",{get:function(){return this.__entries__.length},enumerable:!0,configurable:!0}),e.prototype.get=function(e){var n=t(this.__entries__,e),r=this.__entries__[n];return r&&r[1]},e.prototype.set=function(e,n){var r=t(this.__entries__,e);~r?this.__entries__[r][1]=n:this.__entries__.push([e,n])},e.prototype.delete=function(e){var n=this.__entries__,r=t(n,e);~r&&n.splice(r,1)},e.prototype.has=function(e){return!!~t(this.__entries__,e)},e.prototype.clear=function(){this.__entries__.splice(0)},e.prototype.forEach=function(t,e){void 0===e&&(e=null);for(var n=0,r=this.__entries__;n<r.length;n++){var i=r[n];t.call(e,i[1],i[0])}},e}())}(),r="undefined"!=typeof window&&"undefined"!=typeof document&&window.document===document,i=void 0!==t&&t.Math===Math?t:"undefined"!=typeof self&&self.Math===Math?self:"undefined"!=typeof window&&window.Math===Math?window:Function("return this")(),o="function"==typeof requestAnimationFrame?requestAnimationFrame.bind(i):function(t){return setTimeout((function(){return t(Date.now())}),1e3/60)};var s=["top","right","bottom","left","width","height","size","weight"],a="undefined"!=typeof MutationObserver,u=function(){function t(){this.connected_=!1,this.mutationEventsAdded_=!1,this.mutationsObserver_=null,this.observers_=[],this.onTransitionEnd_=this.onTransitionEnd_.bind(this),this.refresh=function(t,e){var n=!1,r=!1,i=0;function s(){n&&(n=!1,t()),r&&u()}function a(){o(s)}function u(){var t=Date.now();if(n){if(t-i<2)return;r=!0}else n=!0,r=!1,setTimeout(a,e);i=t}return u}(this.refresh.bind(this),20)}return t.prototype.addObserver=function(t){~this.observers_.indexOf(t)||this.observers_.push(t),this.connected_||this.connect_()},t.prototype.removeObserver=function(t){var e=this.observers_,n=e.indexOf(t);~n&&e.splice(n,1),!e.length&&this.connected_&&this.disconnect_()},t.prototype.refresh=function(){this.updateObservers_()&&this.refresh()},t.prototype.updateObservers_=function(){var t=this.observers_.filter((function(t){return t.gatherActive(),t.hasActive()}));return t.forEach((function(t){return t.broadcastActive()})),t.length>0},t.prototype.connect_=function(){r&&!this.connected_&&(document.addEventListener("transitionend",this.onTransitionEnd_),window.addEventListener("resize",this.refresh),a?(this.mutationsObserver_=new MutationObserver(this.refresh),this.mutationsObserver_.observe(document,{attributes:!0,childList:!0,characterData:!0,subtree:!0})):(document.addEventListener("DOMSubtreeModified",this.refresh),this.mutationEventsAdded_=!0),this.connected_=!0)},t.prototype.disconnect_=function(){r&&this.connected_&&(document.removeEventListener("transitionend",this.onTransitionEnd_),window.removeEventListener("resize",this.refresh),this.mutationsObserver_&&this.mutationsObserver_.disconnect(),this.mutationEventsAdded_&&document.removeEventListener("DOMSubtreeModified",this.refresh),this.mutationsObserver_=null,this.mutationEventsAdded_=!1,this.connected_=!1)},t.prototype.onTransitionEnd_=function(t){var e=t.propertyName,n=void 0===e?"":e;s.some((function(t){return!!~n.indexOf(t)}))&&this.refresh()},t.getInstance=function(){return this.instance_||(this.instance_=new t),this.instance_},t.instance_=null,t}(),l=function(t,e){for(var n=0,r=Object.keys(e);n<r.length;n++){var i=r[n];Object.defineProperty(t,i,{value:e[i],enumerable:!1,writable:!1,configurable:!0})}return t},c=function(t){return t&&t.ownerDocument&&t.ownerDocument.defaultView||i},f=v(0,0,0,0);function h(t){return parseFloat(t)||0}function p(t){for(var e=[],n=1;n<arguments.length;n++)e[n-1]=arguments[n];return e.reduce((function(e,n){return e+h(t["border-"+n+"-width"])}),0)}function d(t){var e=t.clientWidth,n=t.clientHeight;if(!e&&!n)return f;var r=c(t).getComputedStyle(t),i=function(t){for(var e={},n=0,r=["top","right","bottom","left"];n<r.length;n++){var i=r[n],o=t["padding-"+i];e[i]=h(o)}return e}(r),o=i.left+i.right,s=i.top+i.bottom,a=h(r.width),u=h(r.height);if("border-box"===r.boxSizing&&(Math.round(a+o)!==e&&(a-=p(r,"left","right")+o),Math.round(u+s)!==n&&(u-=p(r,"top","bottom")+s)),!function(t){return t===c(t).document.documentElement}(t)){var l=Math.round(a+o)-e,d=Math.round(u+s)-n;1!==Math.abs(l)&&(a-=l),1!==Math.abs(d)&&(u-=d)}return v(i.left,i.top,a,u)}var g="undefined"!=typeof SVGGraphicsElement?function(t){return t instanceof c(t).SVGGraphicsElement}:function(t){return t instanceof c(t).SVGElement&&"function"==typeof t.getBBox};function b(t){return r?g(t)?function(t){var e=t.getBBox();return v(0,0,e.width,e.height)}(t):d(t):f}function v(t,e,n,r){return{x:t,y:e,width:n,height:r}}var _=function(){function t(t){this.broadcastWidth=0,this.broadcastHeight=0,this.contentRect_=v(0,0,0,0),this.target=t}return t.prototype.isActive=function(){var t=b(this.target);return this.contentRect_=t,t.width!==this.broadcastWidth||t.height!==this.broadcastHeight},t.prototype.broadcastRect=function(){var t=this.contentRect_;return this.broadcastWidth=t.width,this.broadcastHeight=t.height,t},t}(),y=function(t,e){var n,r,i,o,s,a,u,c=(r=(n=e).x,i=n.y,o=n.width,s=n.height,a="undefined"!=typeof DOMRectReadOnly?DOMRectReadOnly:Object,u=Object.create(a.prototype),l(u,{x:r,y:i,width:o,height:s,top:i,right:r+o,bottom:s+i,left:r}),u);l(this,{target:t,contentRect:c})},m=function(){function t(t,e,r){if(this.activeObservations_=[],this.observations_=new n,"function"!=typeof t)throw new TypeError("The callback provided as parameter 1 is not a function.");this.callback_=t,this.controller_=e,this.callbackCtx_=r}return t.prototype.observe=function(t){if(!arguments.length)throw new TypeError("1 argument required, but only 0 present.");if("undefined"!=typeof Element&&Element instanceof Object){if(!(t instanceof c(t).Element))throw new TypeError('parameter 1 is not of type "Element".');var e=this.observations_;e.has(t)||(e.set(t,new _(t)),this.controller_.addObserver(this),this.controller_.refresh())}},t.prototype.unobserve=function(t){if(!arguments.length)throw new TypeError("1 argument required, but only 0 present.");if("undefined"!=typeof Element&&Element instanceof Object){if(!(t instanceof c(t).Element))throw new TypeError('parameter 1 is not of type "Element".');var e=this.observations_;e.has(t)&&(e.delete(t),e.size||this.controller_.removeObserver(this))}},t.prototype.disconnect=function(){this.clearActive(),this.observations_.clear(),this.controller_.removeObserver(this)},t.prototype.gatherActive=function(){var t=this;this.clearActive(),this.observations_.forEach((function(e){e.isActive()&&t.activeObservations_.push(e)}))},t.prototype.broadcastActive=function(){if(this.hasActive()){var t=this.callbackCtx_,e=this.activeObservations_.map((function(t){return new y(t.target,t.broadcastRect())}));this.callback_.call(t,e,t),this.clearActive()}},t.prototype.clearActive=function(){this.activeObservations_.splice(0)},t.prototype.hasActive=function(){return this.activeObservations_.length>0},t}(),A="undefined"!=typeof WeakMap?new WeakMap:new n,x=function t(e){if(!(this instanceof t))throw new TypeError("Cannot call a class as a function.");if(!arguments.length)throw new TypeError("1 argument required, but only 0 present.");var n=u.getInstance(),r=new m(e,n,this);A.set(this,r)};["observe","unobserve","disconnect"].forEach((function(t){x.prototype[t]=function(){var e;return(e=A.get(this))[t].apply(e,arguments)}}));var C=void 0!==i.ResizeObserver?i.ResizeObserver:x;e.default=C}.call(this,n(10))},function(t,e){var n;n=function(){return this}();try{n=n||new Function("return this")()}catch(t){"object"==typeof window&&(n=window)}t.exports=n},function(t,e,n){"use strict";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}},i=r(n(1)),o=r(n(2)),s=r(n(14)),a=r(n(15)),u=r(n(3)),l=String.fromCharCode(0),c=function(){function t(t){Array.isArray(t)?this.ops=t:null!=t&&Array.isArray(t.ops)?this.ops=t.ops:this.ops=[]}return t.prototype.insert=function(t,e){var n={};return"string"==typeof t&&0===t.length?this:(n.insert=t,null!=e&&"object"==typeof e&&Object.keys(e).length>0&&(n.attributes=e),this.push(n))},t.prototype.delete=function(t){return t<=0?this:this.push({delete:t})},t.prototype.retain=function(t,e){if(t<=0)return this;var n={retain:t};return null!=e&&"object"==typeof e&&Object.keys(e).length>0&&(n.attributes=e),this.push(n)},t.prototype.push=function(t){var e=this.ops.length,n=this.ops[e-1];if(t=o.default(!0,{},t),"object"==typeof n){if("number"==typeof t.delete&&"number"==typeof n.delete)return this.ops[e-1]={delete:n.delete+t.delete},this;if("number"==typeof n.delete&&null!=t.insert&&(e-=1,"object"!=typeof(n=this.ops[e-1])))return this.ops.unshift(t),this;if(i.default(t.attributes,n.attributes)){if("string"==typeof t.insert&&"string"==typeof n.insert)return this.ops[e-1]={insert:n.insert+t.insert},"object"==typeof t.attributes&&(this.ops[e-1].attributes=t.attributes),this;if("number"==typeof t.retain&&"number"==typeof n.retain)return this.ops[e-1]={retain:n.retain+t.retain},"object"==typeof t.attributes&&(this.ops[e-1].attributes=t.attributes),this}}return e===this.ops.length?this.ops.push(t):this.ops.splice(e,0,t),this},t.prototype.chop=function(){var t=this.ops[this.ops.length-1];return t&&t.retain&&!t.attributes&&this.ops.pop(),this},t.prototype.filter=function(t){return this.ops.filter(t)},t.prototype.forEach=function(t){this.ops.forEach(t)},t.prototype.map=function(t){return this.ops.map(t)},t.prototype.partition=function(t){var e=[],n=[];return this.forEach((function(r){(t(r)?e:n).push(r)})),[e,n]},t.prototype.reduce=function(t,e){return this.ops.reduce(t,e)},t.prototype.changeLength=function(){return this.reduce((function(t,e){return e.insert?t+u.default.length(e):e.delete?t-e.delete:t}),0)},t.prototype.length=function(){return this.reduce((function(t,e){return t+u.default.length(e)}),0)},t.prototype.slice=function(e,n){void 0===e&&(e=0),void 0===n&&(n=1/0);for(var r=[],i=u.default.iterator(this.ops),o=0;o<n&&i.hasNext();){var s=void 0;o<e?s=i.next(e-o):(s=i.next(n-o),r.push(s)),o+=u.default.length(s)}return new t(r)},t.prototype.compose=function(e){var n=u.default.iterator(this.ops),r=u.default.iterator(e.ops),o=[],s=r.peek();if(null!=s&&"number"==typeof s.retain&&null==s.attributes){for(var l=s.retain;"insert"===n.peekType()&&n.peekLength()<=l;)l-=n.peekLength(),o.push(n.next());s.retain-l>0&&r.next(s.retain-l)}for(var c=new t(o);n.hasNext()||r.hasNext();)if("insert"===r.peekType())c.push(r.next());else if("delete"===n.peekType())c.push(n.next());else{var f=Math.min(n.peekLength(),r.peekLength()),h=n.next(f),p=r.next(f);if("number"==typeof p.retain){var d={};"number"==typeof h.retain?d.retain=f:d.insert=h.insert;var g=a.default.compose(h.attributes,p.attributes,"number"==typeof h.retain);if(g&&(d.attributes=g),c.push(d),!r.hasNext()&&i.default(c.ops[c.ops.length-1],d)){var b=new t(n.rest());return c.concat(b).chop()}}else"number"==typeof p.delete&&"number"==typeof h.retain&&c.push(p)}return c.chop()},t.prototype.concat=function(e){var n=new t(this.ops.slice());return e.ops.length>0&&(n.push(e.ops[0]),n.ops=n.ops.concat(e.ops.slice(1))),n},t.prototype.diff=function(e,n){if(this.ops===e.ops)return new t;var r=[this,e].map((function(t){return t.map((function(n){if(null!=n.insert)return"string"==typeof n.insert?n.insert:l;throw new Error("diff() called "+(t===e?"on":"with")+" non-document")})).join("")})),o=new t,c=s.default(r[0],r[1],n),f=u.default.iterator(this.ops),h=u.default.iterator(e.ops);return c.forEach((function(t){for(var e=t[1].length;e>0;){var n=0;switch(t[0]){case s.default.INSERT:n=Math.min(h.peekLength(),e),o.push(h.next(n));break;case s.default.DELETE:n=Math.min(e,f.peekLength()),f.next(n),o.delete(n);break;case s.default.EQUAL:n=Math.min(f.peekLength(),h.peekLength(),e);var r=f.next(n),u=h.next(n);i.default(r.insert,u.insert)?o.retain(n,a.default.diff(r.attributes,u.attributes)):o.push(u).delete(n)}e-=n}})),o.chop()},t.prototype.eachLine=function(e,n){void 0===n&&(n="\n");for(var r=u.default.iterator(this.ops),i=new t,o=0;r.hasNext();){if("insert"!==r.peekType())return;var s=r.peek(),a=u.default.length(s)-r.peekLength(),l="string"==typeof s.insert?s.insert.indexOf(n,a)-a:-1;if(l<0)i.push(r.next());else if(l>0)i.push(r.next(l));else{if(!1===e(i,r.next(1).attributes||{},o))return;o+=1,i=new t}}i.length()>0&&e(i,{},o)},t.prototype.invert=function(e){var n=new t;return this.reduce((function(t,r){if(r.insert)n.delete(u.default.length(r));else{if(r.retain&&null==r.attributes)return n.retain(r.retain),t+r.retain;if(r.delete||r.retain&&r.attributes){var i=r.delete||r.retain;return e.slice(t,t+i).forEach((function(t){r.delete?n.push(t):r.retain&&r.attributes&&n.retain(u.default.length(t),a.default.invert(r.attributes,t.attributes))})),t+i}}return t}),0),n.chop()},t.prototype.transform=function(e,n){if(void 0===n&&(n=!1),n=!!n,"number"==typeof e)return this.transformPosition(e,n);for(var r=e,i=u.default.iterator(this.ops),o=u.default.iterator(r.ops),s=new t;i.hasNext()||o.hasNext();)if("insert"!==i.peekType()||!n&&"insert"===o.peekType())if("insert"===o.peekType())s.push(o.next());else{var l=Math.min(i.peekLength(),o.peekLength()),c=i.next(l),f=o.next(l);if(c.delete)continue;f.delete?s.push(f):s.retain(l,a.default.transform(c.attributes,f.attributes,n))}else s.retain(u.default.length(i.next()));return s.chop()},t.prototype.transformPosition=function(t,e){void 0===e&&(e=!1),e=!!e;for(var n=u.default.iterator(this.ops),r=0;n.hasNext()&&r<=t;){var i=n.peekLength(),o=n.peekType();n.next(),"delete"!==o?("insert"===o&&(r<t||!e)&&(t+=i),r+=i):t-=Math.min(i,t-r)}return t},t.Op=u.default,t.AttributeMap=a.default,t}();t.exports=c},function(t,e){function n(t){var e=[];for(var n in t)e.push(n);return e}(t.exports="function"==typeof Object.keys?Object.keys:n).shim=n},function(t,e){var n="[object Arguments]"==function(){return Object.prototype.toString.call(arguments)}();function r(t){return"[object Arguments]"==Object.prototype.toString.call(t)}function i(t){return t&&"object"==typeof t&&"number"==typeof t.length&&Object.prototype.hasOwnProperty.call(t,"callee")&&!Object.prototype.propertyIsEnumerable.call(t,"callee")||!1}(e=t.exports=n?r:i).supported=r,e.unsupported=i},function(t,e){function n(t,e,s,a){if(t===e)return t?[[0,t]]:[];if(null!=s){var f=function(t,e,n){var r="number"==typeof n?{index:n,length:0}:n.oldRange,i="number"==typeof n?null:n.newRange,o=t.length,s=e.length;if(0===r.length&&(null===i||0===i.length)){var a=r.index,u=t.slice(0,a),l=t.slice(a),f=i?i.index:null,h=a+s-o;if((null===f||f===h)&&!(h<0||h>s)){var p=e.slice(0,h);if((m=e.slice(h))===l){var d=Math.min(a,h),g=u.slice(0,d),b=p.slice(0,d);if(g===b){var v=u.slice(d),_=p.slice(d);return c(g,v,_,l)}}}if(null===f||f===a){var y=a,m=(p=e.slice(0,y),e.slice(y));if(p===u){var A=Math.min(o-y,s-y),x=l.slice(l.length-A),C=m.slice(m.length-A);if(x===C){v=l.slice(0,l.length-A),_=m.slice(0,m.length-A);return c(u,v,_,x)}}}}if(r.length>0&&i&&0===i.length){g=t.slice(0,r.index),x=t.slice(r.index+r.length),d=g.length,A=x.length;if(!(s<d+A)){b=e.slice(0,d),C=e.slice(s-A);if(g===b&&x===C){v=t.slice(d,o-A),_=e.slice(d,s-A);return c(g,v,_,x)}}}return null}(t,e,s);if(f)return f}var h=i(t,e),p=t.substring(0,h);h=o(t=t.substring(h),e=e.substring(h));var d=t.substring(t.length-h),g=function(t,e){var s;if(!t)return[[1,e]];if(!e)return[[-1,t]];var a=t.length>e.length?t:e,u=t.length>e.length?e:t,l=a.indexOf(u);if(-1!==l)return s=[[1,a.substring(0,l)],[0,u],[1,a.substring(l+u.length)]],t.length>e.length&&(s[0][0]=s[2][0]=-1),s;if(1===u.length)return[[-1,t],[1,e]];var c=function(t,e){var n=t.length>e.length?t:e,r=t.length>e.length?e:t;if(n.length<4||2*r.length<n.length)return null;function s(t,e,n){for(var r,s,a,u,l=t.substring(n,n+Math.floor(t.length/4)),c=-1,f="";-1!==(c=e.indexOf(l,c+1));){var h=i(t.substring(n),e.substring(c)),p=o(t.substring(0,n),e.substring(0,c));f.length<p+h&&(f=e.substring(c-p,c)+e.substring(c,c+h),r=t.substring(0,n-p),s=t.substring(n+h),a=e.substring(0,c-p),u=e.substring(c+h))}return 2*f.length>=t.length?[r,s,a,u,f]:null}var a,u,l,c,f,h=s(n,r,Math.ceil(n.length/4)),p=s(n,r,Math.ceil(n.length/2));if(!h&&!p)return null;a=p?h&&h[4].length>p[4].length?h:p:h;t.length>e.length?(u=a[0],l=a[1],c=a[2],f=a[3]):(c=a[0],f=a[1],u=a[2],l=a[3]);var d=a[4];return[u,l,c,f,d]}(t,e);if(c){var f=c[0],h=c[1],p=c[2],d=c[3],g=c[4],b=n(f,p),v=n(h,d);return b.concat([[0,g]],v)}return function(t,e){for(var n=t.length,i=e.length,o=Math.ceil((n+i)/2),s=o,a=2*o,u=new Array(a),l=new Array(a),c=0;c<a;c++)u[c]=-1,l[c]=-1;u[s+1]=0,l[s+1]=0;for(var f=n-i,h=f%2!=0,p=0,d=0,g=0,b=0,v=0;v<o;v++){for(var _=-v+p;_<=v-d;_+=2){for(var y=s+_,m=(S=_===-v||_!==v&&u[y-1]<u[y+1]?u[y+1]:u[y-1]+1)-_;S<n&&m<i&&t.charAt(S)===e.charAt(m);)S++,m++;if(u[y]=S,S>n)d+=2;else if(m>i)p+=2;else if(h){if((C=s+f-_)>=0&&C<a&&-1!==l[C]){var A=n-l[C];if(S>=A)return r(t,e,S,m)}}}for(var x=-v+g;x<=v-b;x+=2){for(var C=s+x,w=(A=x===-v||x!==v&&l[C-1]<l[C+1]?l[C+1]:l[C-1]+1)-x;A<n&&w<i&&t.charAt(n-A-1)===e.charAt(i-w-1);)A++,w++;if(l[C]=A,A>n)b+=2;else if(w>i)g+=2;else if(!h){if((y=s+f-x)>=0&&y<a&&-1!==u[y]){var S=u[y];m=s+S-y;if(S>=(A=n-A))return r(t,e,S,m)}}}}return[[-1,t],[1,e]]}(t,e)}(t=t.substring(0,t.length-h),e=e.substring(0,e.length-h));return p&&g.unshift([0,p]),d&&g.push([0,d]),function t(e,n){e.push([0,""]);var r,s=0,a=0,c=0,f="",h="";for(;s<e.length;)if(s<e.length-1&&!e[s][1])e.splice(s,1);else switch(e[s][0]){case 1:c++,h+=e[s][1],s++;break;case-1:a++,f+=e[s][1],s++;break;case 0:var p=s-c-a-1;if(n){if(p>=0&&l(e[p][1])){var d=e[p][1].slice(-1);if(e[p][1]=e[p][1].slice(0,-1),f=d+f,h=d+h,!e[p][1]){e.splice(p,1),s--;var g=p-1;e[g]&&1===e[g][0]&&(c++,h=e[g][1]+h,g--),e[g]&&-1===e[g][0]&&(a++,f=e[g][1]+f,g--),p=g}}if(u(e[s][1])){d=e[s][1].charAt(0);e[s][1]=e[s][1].slice(1),f+=d,h+=d}}if(s<e.length-1&&!e[s][1]){e.splice(s,1);break}if(f.length>0||h.length>0){f.length>0&&h.length>0&&(0!==(r=i(h,f))&&(p>=0?e[p][1]+=h.substring(0,r):(e.splice(0,0,[0,h.substring(0,r)]),s++),h=h.substring(r),f=f.substring(r)),0!==(r=o(h,f))&&(e[s][1]=h.substring(h.length-r)+e[s][1],h=h.substring(0,h.length-r),f=f.substring(0,f.length-r)));var b=c+a;0===f.length&&0===h.length?(e.splice(s-b,b),s-=b):0===f.length?(e.splice(s-b,b,[1,h]),s=s-b+1):0===h.length?(e.splice(s-b,b,[-1,f]),s=s-b+1):(e.splice(s-b,b,[-1,f],[1,h]),s=s-b+2)}0!==s&&0===e[s-1][0]?(e[s-1][1]+=e[s][1],e.splice(s,1)):s++,c=0,a=0,f="",h=""}""===e[e.length-1][1]&&e.pop();var v=!1;s=1;for(;s<e.length-1;)0===e[s-1][0]&&0===e[s+1][0]&&(e[s][1].substring(e[s][1].length-e[s-1][1].length)===e[s-1][1]?(e[s][1]=e[s-1][1]+e[s][1].substring(0,e[s][1].length-e[s-1][1].length),e[s+1][1]=e[s-1][1]+e[s+1][1],e.splice(s-1,1),v=!0):e[s][1].substring(0,e[s+1][1].length)==e[s+1][1]&&(e[s-1][1]+=e[s+1][1],e[s][1]=e[s][1].substring(e[s+1][1].length)+e[s+1][1],e.splice(s+1,1),v=!0)),s++;v&&t(e,n)}(g,a),g}function r(t,e,r,i){var o=t.substring(0,r),s=e.substring(0,i),a=t.substring(r),u=e.substring(i),l=n(o,s),c=n(a,u);return l.concat(c)}function i(t,e){if(!t||!e||t.charAt(0)!==e.charAt(0))return 0;for(var n=0,r=Math.min(t.length,e.length),i=r,o=0;n<i;)t.substring(o,i)==e.substring(o,i)?o=n=i:r=i,i=Math.floor((r-n)/2+n);return s(t.charCodeAt(i-1))&&i--,i}function o(t,e){if(!t||!e||t.slice(-1)!==e.slice(-1))return 0;for(var n=0,r=Math.min(t.length,e.length),i=r,o=0;n<i;)t.substring(t.length-i,t.length-o)==e.substring(e.length-i,e.length-o)?o=n=i:r=i,i=Math.floor((r-n)/2+n);return a(t.charCodeAt(t.length-i))&&i--,i}function s(t){return t>=55296&&t<=56319}function a(t){return t>=56320&&t<=57343}function u(t){return a(t.charCodeAt(0))}function l(t){return s(t.charCodeAt(t.length-1))}function c(t,e,n,r){return l(t)||u(r)?null:function(t){for(var e=[],n=0;n<t.length;n++)t[n][1].length>0&&e.push(t[n]);return e}([[0,t],[-1,e],[1,n],[0,r]])}function f(t,e,r){return n(t,e,r,!0)}f.INSERT=1,f.DELETE=-1,f.EQUAL=0,t.exports=f},function(t,e,n){"use strict";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(e,"__esModule",{value:!0});var i,o=r(n(1)),s=r(n(2));!function(t){t.compose=function(t,e,n){void 0===t&&(t={}),void 0===e&&(e={}),"object"!=typeof t&&(t={}),"object"!=typeof e&&(e={});var r=s.default(!0,{},e);for(var i in n||(r=Object.keys(r).reduce((function(t,e){return null!=r[e]&&(t[e]=r[e]),t}),{})),t)void 0!==t[i]&&void 0===e[i]&&(r[i]=t[i]);return Object.keys(r).length>0?r:void 0},t.diff=function(t,e){void 0===t&&(t={}),void 0===e&&(e={}),"object"!=typeof t&&(t={}),"object"!=typeof e&&(e={});var n=Object.keys(t).concat(Object.keys(e)).reduce((function(n,r){return o.default(t[r],e[r])||(n[r]=void 0===e[r]?null:e[r]),n}),{});return Object.keys(n).length>0?n:void 0},t.invert=function(t,e){void 0===t&&(t={}),void 0===e&&(e={}),t=t||{};var n=Object.keys(e).reduce((function(n,r){return e[r]!==t[r]&&void 0!==t[r]&&(n[r]=e[r]),n}),{});return Object.keys(t).reduce((function(n,r){return t[r]!==e[r]&&void 0===e[r]&&(n[r]=null),n}),n)},t.transform=function(t,e,n){if(void 0===n&&(n=!1),"object"!=typeof t)return e;if("object"==typeof e){if(!n)return e;var r=Object.keys(e).reduce((function(n,r){return void 0===t[r]&&(n[r]=e[r]),n}),{});return Object.keys(r).length>0?r:void 0}}}(i||(i={})),e.default=i},function(t,e,n){"use strict";var r=this&&this.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(e,"__esModule",{value:!0});var i=r(n(3)),o=function(){function t(t){this.ops=t,this.index=0,this.offset=0}return t.prototype.hasNext=function(){return this.peekLength()<1/0},t.prototype.next=function(t){t||(t=1/0);var e=this.ops[this.index];if(e){var n=this.offset,r=i.default.length(e);if(t>=r-n?(t=r-n,this.index+=1,this.offset=0):this.offset+=t,"number"==typeof e.delete)return{delete:t};var o={};return e.attributes&&(o.attributes=e.attributes),"number"==typeof e.retain?o.retain=t:"string"==typeof e.insert?o.insert=e.insert.substr(n,t):o.insert=e.insert,o}return{retain:1/0}},t.prototype.peek=function(){return this.ops[this.index]},t.prototype.peekLength=function(){return this.ops[this.index]?i.default.length(this.ops[this.index])-this.offset:1/0},t.prototype.peekType=function(){return this.ops[this.index]?"number"==typeof this.ops[this.index].delete?"delete":"number"==typeof this.ops[this.index].retain?"retain":"insert":"retain"},t.prototype.rest=function(){if(this.hasNext()){if(0===this.offset)return this.ops.slice(this.index);var t=this.offset,e=this.index,n=this.next(),r=this.ops.slice(this.index);return this.offset=t,this.index=e,[n].concat(r)}return[]},t}();e.default=o},function(t,e,n){var r=n(18),i=n(19);"string"==typeof(i=i.__esModule?i.default:i)&&(i=[[t.i,i,""]]);var o={insert:"head",singleton:!1},s=(r(t.i,i,o),i.locals?i.locals:{});t.exports=s},function(t,e,n){"use strict";var r,i=function(){return void 0===r&&(r=Boolean(window&&document&&document.all&&!window.atob)),r},o=function(){var t={};return function(e){if(void 0===t[e]){var n=document.querySelector(e);if(window.HTMLIFrameElement&&n instanceof window.HTMLIFrameElement)try{n=n.contentDocument.head}catch(t){n=null}t[e]=n}return t[e]}}(),s={};function a(t,e,n){for(var r=0;r<e.length;r++){var i={css:e[r][1],media:e[r][2],sourceMap:e[r][3]};s[t][r]?s[t][r](i):s[t].push(g(i,n))}}function u(t){var e=document.createElement("style"),r=t.attributes||{};if(void 0===r.nonce){var i=n.nc;i&&(r.nonce=i)}if(Object.keys(r).forEach((function(t){e.setAttribute(t,r[t])})),"function"==typeof t.insert)t.insert(e);else{var s=o(t.insert||"head");if(!s)throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");s.appendChild(e)}return e}var l,c=(l=[],function(t,e){return l[t]=e,l.filter(Boolean).join("\n")});function f(t,e,n,r){var i=n?"":r.css;if(t.styleSheet)t.styleSheet.cssText=c(e,i);else{var o=document.createTextNode(i),s=t.childNodes;s[e]&&t.removeChild(s[e]),s.length?t.insertBefore(o,s[e]):t.appendChild(o)}}function h(t,e,n){var r=n.css,i=n.media,o=n.sourceMap;if(i?t.setAttribute("media",i):t.removeAttribute("media"),o&&btoa&&(r+="\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(o))))," */")),t.styleSheet)t.styleSheet.cssText=r;else{for(;t.firstChild;)t.removeChild(t.firstChild);t.appendChild(document.createTextNode(r))}}var p=null,d=0;function g(t,e){var n,r,i;if(e.singleton){var o=d++;n=p||(p=u(e)),r=f.bind(null,n,o,!1),i=f.bind(null,n,o,!0)}else n=u(e),r=h.bind(null,n,e),i=function(){!function(t){if(null===t.parentNode)return!1;t.parentNode.removeChild(t)}(n)};return r(t),function(e){if(e){if(e.css===t.css&&e.media===t.media&&e.sourceMap===t.sourceMap)return;r(t=e)}else i()}}t.exports=function(t,e,n){return(n=n||{}).singleton||"boolean"==typeof n.singleton||(n.singleton=i()),t=n.base?t+n.base:t,e=e||[],s[t]||(s[t]=[]),a(t,e,n),function(e){if(e=e||[],"[object Array]"===Object.prototype.toString.call(e)){s[t]||(s[t]=[]),a(t,e,n);for(var r=e.length;r<s[t].length;r++)s[t][r]();s[t].length=e.length,0===s[t].length&&delete s[t]}}}},function(t,e,n){(e=n(20)(!1)).push([t.i,".ql-container{position:relative;overflow:hidden}.ql-cursor.hidden{display:none}.ql-cursor .ql-cursor-caret-container,.ql-cursor .ql-cursor-flag{position:absolute}.ql-cursor .ql-cursor-flag{z-index:1;transform:translate3d(-1px, -100%, 0);opacity:0;visibility:hidden;color:white;padding-bottom:2px;border-radius:0 3px 3px 0}.ql-cursor .ql-cursor-flag.flag-flipped{border-radius:3px 0 0 3px;transform:translate3d(calc(-100% + 1px), -100%, 0)}@media screen{.ql-cursor .ql-cursor-flag{transition:opacity 0ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 0ms,visibility 0ms cubic-bezier(0.25, 0.46, 0.45, 0.94) 0ms}}.ql-cursor .ql-cursor-flag .ql-cursor-name{margin-left:5px;margin-right:5px;display:inline-block;margin-top:-2px;white-space:nowrap}.ql-cursor .ql-cursor-flag:hover,.ql-cursor .ql-cursor-flag.show-flag,.ql-cursor .ql-cursor-caret-container:hover+.ql-cursor-flag{opacity:1;visibility:visible;transition:none}.ql-cursor .ql-cursor-flag.no-delay[style]{transition-delay:unset !important}.ql-cursor .ql-cursor-caret-container{margin-left:-9px;padding:0 9px;z-index:1}.ql-cursor .ql-cursor-caret-container .ql-cursor-caret{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;background-color:attr(data-color)}.ql-cursor .ql-cursor-selection-block{position:absolute;pointer-events:none}\n",""]),t.exports=e},function(t,e,n){"use strict";t.exports=function(t){var e=[];return e.toString=function(){return this.map((function(e){var n=function(t,e){var n=t[1]||"",r=t[3];if(!r)return n;if(e&&"function"==typeof btoa){var i=(s=r,a=btoa(unescape(encodeURIComponent(JSON.stringify(s)))),u="sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(a),"/*# ".concat(u," */")),o=r.sources.map((function(t){return"/*# sourceURL=".concat(r.sourceRoot||"").concat(t," */")}));return[n].concat(o).concat([i]).join("\n")}var s,a,u;return[n].join("\n")}(e,t);return e[2]?"@media ".concat(e[2]," {").concat(n,"}"):n})).join("")},e.i=function(t,n,r){"string"==typeof t&&(t=[[null,t,""]]);var i={};if(r)for(var o=0;o<this.length;o++){var s=this[o][0];null!=s&&(i[s]=!0)}for(var a=0;a<t.length;a++){var u=[].concat(t[a]);r&&i[u[0]]||(n&&(u[2]?u[2]="".concat(n," and ").concat(u[2]):u[2]=n),e.push(u))}},e}}]).default}));
},{}],7:[function(require,module,exports){
'use strict'

/**
 * Remove a range of items from an array
 *
 * @function removeItems
 * @param {Array<*>} arr The target array
 * @param {number} startIdx The index to begin removing from (inclusive)
 * @param {number} removeCount How many items to remove
 */
module.exports = function removeItems (arr, startIdx, removeCount) {
  var i, length = arr.length

  if (startIdx >= length || removeCount === 0) {
    return
  }

  removeCount = (startIdx + removeCount > length ? length - startIdx : removeCount)

  var len = length - removeCount

  for (i = startIdx; i < len; ++i) {
    arr[i] = arr[i + removeCount]
  }

  arr.length = len
}

},{}],8:[function(require,module,exports){
function Identifier (int, site, clock) {
  this.int = int
  this.site = site
  this.clock = clock
}
Identifier.prototype.compare = function (other) {
  if (this.int > other.int) {
    return 1
  } else if (this.int < other.int) {
    return -1
  } else {
    if (this.site > other.site) {
      return 1
    } else if (this.site < other.site) {
      return -1
    } else {
      if (this.clock > other.clock) {
        return 1
      } else if (this.clock < other.clock) {
        return -1
      } else {
        return 0
      }
    }
  }
}
module.exports = Identifier

},{}],9:[function(require,module,exports){
const EventEmitter = require('nanobus')
const inherits = require('inherits')

const Node = require('./node')
const Identifier = require('./identifier')

inherits(Logoot, EventEmitter)

const MIN = 0
const MAX = Number.MAX_SAFE_INTEGER
const BASE = Math.pow(2, 8)

function Logoot (site, state, bias) {
  EventEmitter.call(this)

  this.site = site
  this.clock = 0
  this._deleteQueue = []
  this._bias = bias || 15

  Node.compare = (a, b) => { return a.compare(b) }

  this._root = new Node()
  this._root.setEmpty(true)
  this._root.addChild(new Node(new Identifier(MIN, null, null)))
  this._root.addChild(new Node(new Identifier(BASE, null, null)))

  if (state) this.setState(state)
}

function parseId (id) {
  if (id) return new Identifier(id.int, id.site, id.clock)
}
function parseOperation (operation) {
  operation.parsed = true
  operation.position = operation.position.map(parseId)
  return operation
}
function arePositionsEqual (a, b) {
  if (a.length !== b.length) return false
  return !a.some((id, index) => {
    return id.compare(b[index]) !== 0
  })
}

Logoot.prototype.receive = function (operation) {
  if (!operation.parsed) operation = parseOperation(operation)
  if (operation.type === 'insert') {
    const deleteQueueIndex = this._deleteQueue.findIndex(op => {
      return arePositionsEqual(op.position, operation.position)
    })
    if (deleteQueueIndex > -1) {
      this._deleteQueue.splice(deleteQueueIndex, 1)
      return
    }
    const existingNode = this._root.getChildByPath(operation.position, false)
    if (existingNode) return // invalid duplication, ignore it

    const node = this._root.getChildByPath(operation.position, true)
    node.value = operation.value
    node.setEmpty(false)
    const index = node.getOrder()

    this.emit('insert', { value: node.value, index })
  } else if (operation.type === 'delete') {
    const node = this._root.getChildByPath(operation.position, false)
    if (node && !node.empty) {
      const index = node.getOrder()
      const value = node.value
      node.setEmpty(true)
      node.trimEmpty()

      this.emit('delete', { value, index })
    } else {
      if (!this._deleteQueue.some(op => {
        return arePositionsEqual(op.position, operation.position)
      })) {
        this._deleteQueue.push(operation)
      }
    }
  }
}

Logoot.prototype.insert = function (value, index) {
  value.split('').forEach((character, i) => {
    this._insert(character, index + i)
  })
}

Logoot.prototype._insert = function (value, index) {
  index = Math.min(index, this.length())

  const prev = this._root.getChildByOrder(index)
  const next = this._root.getChildByOrder(index + 1)

  const prevPos = prev.getPath()
  const nextPos = next.getPath()

  const position = this._generatePositionBetween(prevPos, nextPos)

  const node = this._root.getChildByPath(position, true)
  node.value = value
  node.setEmpty(false)

  this.emit('operation', { type: 'insert', position, value })
}

function randomBiasedInt (a, b, bias) {
  return Math.floor(Math.pow(Math.random(), bias) * (b - (a + 1))) + a + 1
}
function randomAlternation (bias) {
  return Math.random() > 0.5 ? bias : 1 / bias
}
function doubledBase (depth) {
  return Math.min(BASE * Math.pow(2, depth), MAX)
}

Logoot.prototype._generateNewIdentifier = function (prevInt, nextInt) {
  const int = randomBiasedInt(prevInt, nextInt, randomAlternation(this._bias))
  return new Identifier(int, this.site, this.clock++)
}

Logoot.prototype._generatePositionBetween = function (prevPos, nextPos) {
  const newPos = []

  const maxLength = Math.max(prevPos.length, nextPos.length)
  var samePrefixes = true

  for (var depth = 0; depth < maxLength + 1; depth++) {
    const DEPTH_MAX = doubledBase(depth)
    const prevId = prevPos[depth] || new Identifier(MIN, null, null)
    const nextId = (samePrefixes && nextPos[depth])
      ? nextPos[depth]
      : new Identifier(DEPTH_MAX, null, null) // base doubling

    const diff = nextId.int - prevId.int

    if (diff > 1) { // enough room for integer between prevInt and nextInt
      newPos.push(this._generateNewIdentifier(prevId.int, nextId.int))
      break
    } else {
      if (prevId.site === null && depth > 0) prevId.site === this.site
      newPos.push(prevId)
      if (prevId.compare(nextId) !== 0) samePrefixes = false
    }
  }

  return newPos
}

Logoot.prototype.delete = function (index, length = 1) {
  for (var i = 0; i < length; i++) {
    this._delete(index)
  }
}

Logoot.prototype._delete = function (index) {
  const node = this._root.getChildByOrder(index + 1)
  if (!node || node.id.site == null) return

  const position = node.getPath()
  node.setEmpty(true)
  node.trimEmpty()
  this.emit('operation', { type: 'delete', position })
}

// construct a string from the sequence
Logoot.prototype.value = function () {
  const arr = []
  this._root.walk(node => {
    if (!node.empty) arr.push(node.value)
  })
  return arr.join('')
}

Logoot.prototype.length = function () {
  return this._root.size - 2
}

Logoot.prototype.replaceRange = function (value, start, length) {
  this.delete(start, length)
  this.insert(value, start)
}

Logoot.prototype.setValue = function (value) {
  this.replaceRange(value, 0, this.length())
}

Logoot.prototype.getState = function () {
  return JSON.stringify({
    root: this._root,
    deleteQueue: this._deleteQueue
  }, (key, value) => key === 'parent' ? undefined : value)
}

Logoot.prototype.setState = function (state) {
  const parsed = JSON.parse(state)

  function parseNode (n, parent) {
    const node = new Node(parseId(n.id), n.value)
    node.parent = parent
    node.children = n.children.map(c => parseNode(c, node))
    node.size = n.size
    node.empty = n.empty
    return node
  }

  this._root = parseNode(parsed.root, null)
  this._deleteQueue = parsed.deleteQueue
}

module.exports = Logoot

},{"./identifier":8,"./node":10,"inherits":1,"nanobus":3}],10:[function(require,module,exports){

function Node (id, value) {
  this.id = id
  this.value = value || null

  this.children = []
  this.parent = null

  this.size = 1
  this.empty = false
}

Node.prototype._leftmostSearch = function (child) {
  var L = 0
  var R = this.children.length
  var M
  while (L < R) {
    M = Math.floor((L + R) / 2)
    if (Node.compare(this.children[M].id, child.id) < 0) {
      L = M + 1
    } else {
      R = M
    }
  }
  return L
}

Node.prototype._exactSearch = function (child) {
  var L = 0
  var R = this.children.length - 1
  var M
  while (L <= R) {
    M = Math.floor((L + R) / 2)
    var comp = Node.compare(this.children[M].id, child.id)
    if (comp < 0) {
      L = M + 1
    } else if (comp > 0) {
      R = M - 1
    } else {
      return M
    }
  }
  return null
}

Node.prototype.adjustSize = function (amount) {
  this.size += amount
  if (this.parent) this.parent.adjustSize(amount)
}

Node.prototype.addChild = function (child) {
  child.parent = this
  const index = this._leftmostSearch(child)
  this.children.splice(index, 0, child)
  this.adjustSize(child.size)
  return child
}

Node.prototype.removeChild = function (child) {
  const index = this._exactSearch(child)
  if (index == null) return
  this.children.splice(index, 1)
  this.adjustSize(child.size)
  return child
}

Node.prototype.setEmpty = function (bool = true) {
  if (bool === this.empty) return
  this.empty = bool
  if (bool) {
    this.adjustSize(-1)
  } else {
    this.adjustSize(1)
  }
}

Node.prototype.trimEmpty = function () {
  if (!this.parent) return
  if (this.empty && this.children.length === 0) {
    this.parent.removeChild(this)
    this.parent.trimEmpty()
  }
}

Node.prototype.getPath = function () {
  if (!this.parent) return []
  return this.parent.getPath().concat([this.id])
}

Node.prototype.getChildById = function (id) {
  const index = this._exactSearch({ id })
  if (index == null) return null
  return this.children[index]
}

Node.prototype.getChildByPath = function (path, build) {
  var current = this
  var next = null
  path.every(id => {
    next = current.getChildById(id)
    if (!next && !build) {
      current = null
      return false
    }
    if (!next && build) {
      next = new Node(id)
      current.addChild(next)
      next.setEmpty(true)
    }
    current = next
    return true
  })
  return current
}

Node.prototype.getOrder = function () {
  if (!this.parent) return -1 // -1 to discount the left end node
  var order = this.parent.getOrder()
  if (!this.parent.empty) order += 1

  for (var i = 0; i < this.parent.children.length; i++) {
    if (Node.compare(this.parent.children[i].id, this.id) === 0) break
    order += this.parent.children[i].size
  }

  return order
}

Node.prototype.getChildByOrder = function (index) {
  if (index === 0 && !this.empty) return this

  var left = this.empty ? 0 : 1
  var right = left
  for (var i = 0; i < this.children.length; i++) {
    right += this.children[i].size
    if (left <= index && right > index) {
      return this.children[i].getChildByOrder(index - left)
    }
    left = right
  }

  return null
}

Node.prototype.walk = function (fn) {
  fn(this)
  this.children.forEach(child => {
    child.walk(fn)
  })
}

module.exports = Node

},{}],11:[function(require,module,exports){
const QuillCursors = require('quill-cursors');
const host = location.origin.replace(/^http/, 'ws');
const Logoot = require('../../CRDT/src/index');
const l1 = new Logoot('site1');

Quill.register('modules/cursors', QuillCursors);

const quill = new Quill('#editor', {
	modules: {
		cursors: true
	},
	theme: 'snow'
});

const socket = new WebSocket(host);

socket.onopen = function(e) {};
let socketId = -1;

let initialized = false;
socket.onmessage = function(event) {
	const data = JSON.parse(event.data);
	let cursor = quill.getSelection();
	if (cursor) {
		cursor.index = cursor ? cursor.index : 0;
	} else {
		cursor = { index: 0 };
	}
	if (data.assignSocketId) {
		socketId = data.assignSocketId;
		l1.setState(data.initialValue);
		quill.setText(l1.value());
		initialized = true;
	} else {
		l1.receive(data);

		quill.setText(l1.value());
		if (cursor && cursor.index) quill.setSelection(cursor.index, 0);
	}
};

l1.on('operation', (op) => {
	if (initialized && (op.type === 'insert' || op.type === 'delete')) {
		socket.send(JSON.stringify(op));
	}
});

quill.on('text-change', function(delta, _, source) {
	if (source === 'user') {
		let retain;
		for (const op of delta.ops) {
			if (op.hasOwnProperty('retain')) {
				retain = op.retain;
			} else if (op.hasOwnProperty('insert')) {
				l1.insert(op.insert, !retain ? 0 : retain);
			} else if (op.hasOwnProperty('delete')) {
				l1.delete(!retain ? 0 : retain, op.delete);
			} else {
				console.log('nani');
			}
		}
	}
});

},{"../../CRDT/src/index":9,"quill-cursors":6}]},{},[11]);

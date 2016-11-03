'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var uuid = require('uuid');
var Transcript = require('./components/transcript');
var Speaker = require('./components/speaker');
var DisplayContext = require('./components/displaycontext');

module.exports = function () {
    function CELIOAbstract() {
        _classCallCheck(this, CELIOAbstract);

        if (new.target === CELIOAbstract) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }
        this.transcript = new Transcript(this);
    }

    _createClass(CELIOAbstract, [{
        key: 'generateUUID',
        value: function generateUUID() {
            return uuid.v4();
        }
    }, {
        key: 'getTranscript',
        value: function getTranscript() {
            return this.transcript;
        }
    }, {
        key: 'getStore',
        value: function getStore() {
            return this.store;
        }
    }, {
        key: 'getSpeaker',
        value: function getSpeaker() {
            return new Speaker(this);
        }
    }, {
        key: 'createDisplayContext',
        value: function createDisplayContext(ur_app_name, window_settings) {
            var _dc = new DisplayContext(ur_app_name, window_settings, this);
            return _dc.restoreFromStore().then(function (m) {
                return _dc;
            });
        }
    }, {
        key: 'getDisplayContextList',
        value: function getDisplayContextList() {
            return this.getStore().getSet("displayContexts");
        }
    }, {
        key: 'getActiveDisplayContext',
        value: function getActiveDisplayContext() {
            var _this = this;

            return this.getStore().getState("activeDisplayContext").then(function (m) {
                if (m) {
                    var _ret = function () {
                        var _dc = new DisplayContext(m, {}, _this);
                        return {
                            v: _dc.restoreFromStore().then(function (m) {
                                return _dc;
                            })
                        };
                    }();

                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                } else {
                    var _ret2 = function () {
                        var _dc = new DisplayContext("default", {}, _this);
                        return {
                            v: _dc.restoreFromStore().then(function (m) {
                                return _dc;
                            })
                        };
                    }();

                    if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
                }
            });
        }
    }, {
        key: 'setActiveDisplayContext',
        value: function setActiveDisplayContext(appname, reset) {
            var _this2 = this;

            console.log("requested app name : ", appname);
            this.getStore().getState("activeDisplayContext").then(function (name) {
                console.log("app name in store : ", name);
                if (name != appname) {
                    _this2.getStore().setState("activeDisplayContext", appname);
                    new DisplayContext(appname, {}, _this2).restoreFromStore(reset);
                } else {
                    console.log("app name : ", appname, "is already active");
                }
            });
        }
    }, {
        key: 'hideAllDisplayContext',
        value: function hideAllDisplayContext() {
            var _this3 = this;

            var cmd = {
                command: 'hide-all-windows'
            };
            this.getActiveDisplays().then(function (m) {
                var _ps = [];
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = Object.keys(m)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var _k = _step.value;

                        _ps.push(_this3.call('display-rpc-queue-' + _k, JSON.stringify(cmd)));
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                return Promise.all(_ps);
            }).then(function (m) {
                return m;
            });
        }
    }, {
        key: 'getActiveDisplays',
        value: function getActiveDisplays() {
            return this.getStore().getHash("display.displays");
        }
    }, {
        key: 'getFocusedDisplayWindow',
        value: function getFocusedDisplayWindow() {
            var displayName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "main";

            var cmd = {
                command: 'get-focus-window'
            };
            return this.call('display-rpc-queue-' + k, JSON.stringify(cmd)).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: 'getFocusedDisplayWindows',
        value: function getFocusedDisplayWindows() {
            var _this4 = this;

            var cmd = {
                command: 'get-focus-window'
            };
            return this.getActiveDisplays().then(function (m) {
                var _ps = [];
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = Object.keys(m)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var _k2 = _step2.value;

                        _ps.push(_this4.call('display-rpc-queue-' + _k2, JSON.stringify(cmd)));
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                return Promise.all(_ps);
            }).then(function (m) {
                for (var i = 0; i < m.length; i++) {
                    m[i] = JSON.parse(m[i].toString());
                }return m;
            });
        }
    }]);

    return CELIOAbstract;
}();
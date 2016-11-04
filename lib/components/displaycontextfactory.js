'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DisplayContext = require('./displaycontext');

module.exports = function () {
    function DisplayContextFactory(io) {
        _classCallCheck(this, DisplayContextFactory);

        this.io = io;
    }

    _createClass(DisplayContextFactory, [{
        key: 'getDisplays',
        value: function getDisplays() {
            return this.io.store.getHash('display:displays');
        }
    }, {
        key: 'getList',
        value: function getList() {
            return this.io.store.getSet('display:displayContexts');
        }
    }, {
        key: 'getActive',
        value: function getActive() {
            var _this = this;

            return this.io.store.getState('display:activeDisplayContext').then(function (m) {
                console.log('active display context is ', m);
                if (m) {
                    var _ret = function () {
                        var _dc = new DisplayContext(m, {}, _this.io);
                        return {
                            v: _dc.restoreFromStore().then(function (m) {
                                return _dc;
                            })
                        };
                    }();

                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                } else {
                    var _ret2 = function () {
                        var _dc = new DisplayContext('default', {}, _this.io);
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
        key: 'setActive',
        value: function setActive(name, reset) {
            var _this2 = this;

            console.log('requested app name : ', appname);
            this.io.store.getState('display:activeDisplayContext').then(function (name) {
                console.log('app name in store : ', name);
                if (name != appname) {
                    _this2.io.store.setState('display:activeDisplayContext', appname);
                    new DisplayContext(appname, {}, _this2.io).restoreFromStore(reset);
                } else {
                    console.log('app name : ', appname, 'is already active');
                }
            });
        }
    }, {
        key: 'create',
        value: function create(ur_app_name, window_settings) {
            var _dc = new DisplayContext(ur_app_name, window_settings, this.io);
            return _dc.restoreFromStore().then(function (m) {
                return _dc;
            });
        }
    }, {
        key: 'hideAll',
        value: function hideAll() {
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

                        _ps.push(_this3.io.call('rpc-display-' + _k, JSON.stringify(cmd)));
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
        key: 'getFocusedDisplayWindow',
        value: function getFocusedDisplayWindow() {
            var displayName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'main';

            var cmd = {
                command: 'get-focus-window'
            };
            return this.io.call('rpc-display-' + k, JSON.stringify(cmd)).then(function (m) {
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

                        _ps.push(_this4.io.call('rpc-display-' + _k2, JSON.stringify(cmd)));
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
                }

                return m;
            });
        }
    }, {
        key: '_on',
        value: function _on(topic, handler) {
            this.io.onTopic(topic, function (msg, headers) {
                if (handler != null) {
                    handler(JSON.parse(msg.toString()), headers);
                }
            });
        }
    }, {
        key: 'onViewObjectCreated',
        value: function onViewObjectCreated(handler) {
            this._on('display.*.viewObjectCreated.*', handler);
        }
    }, {
        key: 'OnViewObjectHidden',
        value: function OnViewObjectHidden(handler) {
            this._on('display.*.viewObjectHidden.*', handler);
        }
    }, {
        key: 'onViewObjectShown',
        value: function onViewObjectShown(handler) {
            this._on('display.*.viewObjectShown.*', handler);
        }
    }, {
        key: 'onViewObjectClosed',
        value: function onViewObjectClosed(handler) {
            this._on('display.*.viewObjectClosed.*', handler);
        }
    }, {
        key: 'onViewObjectBoundsChanged',
        value: function onViewObjectBoundsChanged(handler) {
            this._on('display.*.viewObjectBoundsChanged.*', handler);
        }
    }, {
        key: 'onViewObjectUrlChanged',
        value: function onViewObjectUrlChanged(handler) {
            this._on('display.*.viewObjectUrlChanged.*', handler);
        }
    }, {
        key: 'onViewObjectUrlReloaded',
        value: function onViewObjectUrlReloaded(handler) {
            this._on('display.*.viewObjectUrlChanged.*', handler);
        }
    }, {
        key: 'onViewObjectCrashed',
        value: function onViewObjectCrashed(handler) {
            this._on('display.*.viewObjectCrashed.*', handler);
        }
    }, {
        key: 'onViewObjectGPUCrashed',
        value: function onViewObjectGPUCrashed(handler) {
            this._on('display.*.viewObjectGPUCrashed.*', handler);
        }
    }, {
        key: 'onViewObjectPluginCrashed',
        value: function onViewObjectPluginCrashed(handler) {
            this._on('display.*.viewObjectPluginCrashed.*', handler);
        }
    }, {
        key: 'onDisplayContextCreated',
        value: function onDisplayContextCreated(handler) {
            this._on('display.displayContext.created', handler);
        }
    }, {
        key: 'onDisplayContextChanged',
        value: function onDisplayContextChanged(handler) {
            this._on('display.displayContext.changed', handler);
        }
    }, {
        key: 'onDisplayContextClosed',
        value: function onDisplayContextClosed(handler) {
            this._on('display.displayContext.closed', handler);
        }
    }, {
        key: 'onDisplayWorkerRemoved',
        value: function onDisplayWorkerRemoved(handler) {
            this._on('display.removed', handler);
        }
    }, {
        key: 'onDisplayWorkerAdded',
        value: function onDisplayWorkerAdded(handler) {
            this._on('display.added', handler);
        }
    }]);

    return DisplayContextFactory;
}();
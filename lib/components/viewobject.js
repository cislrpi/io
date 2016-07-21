'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events');

module.exports = function (_EventEmitter) {
    _inherits(ViewObject, _EventEmitter);

    function ViewObject(display, options) {
        _classCallCheck(this, ViewObject);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ViewObject).call(this));

        _this.display = display;
        _this.view_id = options.view_id;
        _this.screenName = options.screenName;
        _this.window_id = options.window_id;
        _this.display.viewObjects.set(_this.view_id, _this);
        return _this;
    }

    _createClass(ViewObject, [{
        key: 'destroy',
        value: function destroy() {
            this.display.viewObjects.delete(this.view_id);
            console.log(this.display.viewObjects.keys());
            this.display = null;
            this.view_id = null;
            this.screenName = null;
            this.window_id = null;
        }
    }, {
        key: 'checkStatus',
        value: function checkStatus() {
            if (!this.view_id) throw new Error("ViewObject is already deleted.");
        }
    }, {
        key: 'reload',
        value: function reload() {
            this.checkStatus();
            var cmd = {
                command: 'reload',
                options: {
                    view_id: this.view_id
                }
            };
            return this.display._postRequest(cmd);
        }
    }, {
        key: 'hide',
        value: function hide() {
            this.checkStatus();
            var cmd = {
                command: 'hide',
                options: {
                    view_id: this.view_id
                }
            };
            return this.display._postRequest(cmd);
        }
    }, {
        key: 'show',
        value: function show() {
            this.checkStatus();
            var cmd = {
                command: 'show',
                options: {
                    view_id: this.view_id
                }
            };
            return this.display._postRequest(cmd);
        }
    }, {
        key: 'close',
        value: function close() {
            this.checkStatus();
            var cmd = {
                command: 'close',
                options: {
                    view_id: this.view_id
                }
            };
            var s = this.display._postRequest(cmd);
            console.log(s);
            if (s.status == "success") {
                this.destroy();
            }
            return s;
        }
    }, {
        key: 'setBounds',
        value: function setBounds(options) {
            this.checkStatus();
            options.view_id = this.view_id;
            var cmd = {
                command: 'set-bounds',
                options: options
            };
            return this.display._postRequest(cmd);
        }
    }, {
        key: 'goBack',
        value: function goBack(options) {
            this.checkStatus();
            var cmd = {
                command: 'back',
                options: {
                    view_id: this.view_id
                }
            };
            return this.display._postRequest(cmd);
        }
    }, {
        key: 'goForward',
        value: function goForward() {
            this.checkStatus();
            var cmd = {
                command: 'forward',
                options: {
                    view_id: this.view_id
                }
            };
            return this.display._postRequest(cmd);
        }
    }, {
        key: 'openDevTools',
        value: function openDevTools() {
            this.checkStatus();
            var cmd = {
                command: 'view-object-dev-tools',
                options: {
                    view_id: this.view_id,
                    devTools: true
                }
            };
            return this.display._postRequest(cmd);
        }
    }, {
        key: 'closeDevTools',
        value: function closeDevTools() {
            this.checkStatus();
            var cmd = {
                command: 'view-object-dev-tools',
                options: {
                    view_id: this.view_id,
                    devTools: false
                }
            };
            return this.display._postRequest(cmd);
        }
    }]);

    return ViewObject;
}(EventEmitter);
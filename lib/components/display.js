'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Request = require('sync-request');
var EventEmitter = require('events');
var Nes = require('nes');

module.exports = function (_EventEmitter) {
    _inherits(Display, _EventEmitter);

    function Display(io) {
        _classCallCheck(this, Display);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Display).call(this));

        _this.io = io;
        var dw = _this.io.display;
        _this.displayWorker = "http://" + dw.host + ":" + dw.port + "/execute";
        // this.displayES = new Nes.Client("ws://" + dw.host + ":" + dw.port)
        // this.displayES.connect({}, (err) => {
        //     if(err) console.log(err)
        //     this.displayES.onUpdate = this.processEvent
        // })
        return _this;
    }

    _createClass(Display, [{
        key: 'processEvent',
        value: function processEvent(message) {
            // console.log(message);
            // this.emit(message.type, message.data);
        }
    }, {
        key: 'postRequest',
        value: function postRequest(data) {
            var resp = Request('POST', this.displayWorker, { json: data });
            try {
                return JSON.parse(resp.getBody('utf8'));
            } catch (e) {
                return resp.getBody('utf8');
            }
        }
    }, {
        key: 'getActiveContext',
        value: function getActiveContext() {
            var cmd = {
                command: "get-active-app-context"
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'setAppContext',
        value: function setAppContext(context) {
            var cmd = {
                command: "set-app-context",
                options: {
                    context: context
                }
            };
            this.activeContext = context;
            return this.postRequest(cmd);
        }
    }, {
        key: 'closeAppContext',
        value: function closeAppContext(context) {
            var cmd = {
                command: "close-app-context",
                options: {
                    context: context
                }
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'createWindow',
        value: function createWindow(options) {
            var cmd = {
                command: 'create-window',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'hideWindow',
        value: function hideWindow(options) {
            var cmd = {
                command: 'hide-window',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'showWindow',
        value: function showWindow(options) {
            var cmd = {
                command: 'show-window',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'closeWindow',
        value: function closeWindow(options) {
            var cmd = {
                command: 'close-window',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'open',
        value: function open(options) {
            var cmd = {
                command: 'open',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'reload',
        value: function reload(options) {
            var cmd = {
                command: 'reload',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'hide',
        value: function hide(options) {
            var cmd = {
                command: 'hide',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'show',
        value: function show(options) {
            var cmd = {
                command: 'show',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'close',
        value: function close(options) {
            var cmd = {
                command: 'close',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'setBounds',
        value: function setBounds(options) {
            var cmd = {
                command: 'set-bounds',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'goBack',
        value: function goBack(options) {
            var cmd = {
                command: 'back',
                options: options
            };
            return this.postRequest(cmd);
        }
    }, {
        key: 'goForward',
        value: function goForward(options) {
            var cmd = {
                command: 'forward',
                options: options
            };
            return this.postRequest(cmd);
        }
    }]);

    return Display;
}(EventEmitter);
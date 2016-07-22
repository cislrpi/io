'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Request = require('sync-request');
var EventEmitter = require('events');
var Nes = require('nes');
var uuid = require('uuid');

var DisplayWindow = require('./displaywindow');

module.exports = function (_EventEmitter) {
    _inherits(Display, _EventEmitter);

    function Display(io) {
        _classCallCheck(this, Display);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Display).call(this));

        _this.conf = io.display;
        _this.client_id = uuid.v1();
        _this.displayWorker = "http://" + _this.conf.host + ":" + _this.conf.port + "/execute";
        _this.displayWindows = new Map();
        _this.viewObjects = new Map();
        io.onTopic('display.*', function (m) {
            return _this._processEvent(m);
        });
        return _this;
    }

    _createClass(Display, [{
        key: '_processEvent',
        value: function _processEvent(message) {
            console.log("process event", message.toString());
            try {
                var m = JSON.parse(message.toString());
                this.emit(m.type, m.data);
            } catch (e) {
                console.log(e);
            }
        }
    }, {
        key: '_postRequest',
        value: function _postRequest(data) {
            data.client_id = this.client_id;
            var resp = Request('POST', this.displayWorker, { json: data });
            try {
                return JSON.parse(resp.getBody('utf8'));
            } catch (e) {
                return resp.getBody('utf8');
            }
        }

        /*
            returns an array of screen details 
                - screenName
                - x
                - y
                - width
                - height
                - touchSupport
        */

    }, {
        key: 'getScreens',
        value: function getScreens() {
            var cmd = {
                command: "get-screens"
            };
            return this._postRequest(cmd);
        }

        /*
            returns the active app context  as string
        */

    }, {
        key: 'getAppContext',
        value: function getAppContext() {
            var cmd = {
                command: "get-active-app-context"
            };
            return this._postRequest(cmd);
        }

        /*
            set the active app context  
            args: context (string)
        */

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
            return this._postRequest(cmd);
        }

        /*
            closes an app context  
            args: context (string)
        */

    }, {
        key: 'closeAppContext',
        value: function closeAppContext(context) {
            var cmd = {
                command: "close-app-context",
                options: {
                    context: context
                }
            };
            return this._postRequest(cmd);
        }

        /*
            creates a displayWindow 
            args: options (json object)
                - screenName (string)
                - appContext (string)
                - template (string - relative path to the template file)
                - x
                - y
                - width
                - height
                - contentGrid (json Object)
                    (for uniform grid)
                    - row (integer, no of rows)
                    - col (integer, no of cols)
                    - rowHeight ( float array, height percent for each row - 0.0 to 1.0 )
                    - colWidth ( float array,  width percent for each col - 0.0 to 1.0 )
                    - padding (float) // in px or em
                    (for custom grid)
                    - custom ( array of json Object)
                       [{ "label" : "cel-id-1",  left, top, width, height}, // in px or em or percent
                        { "label" : "cel-id-2",  left, top, width, height},
                        { "label" : "cel-id-3",  left, top, width, height},
                        ...
                        ]
                - gridBackground (json Object)
                    {
                        "row|col" : "backgroundColor",
                        "cel-id-1" : "backgroundColor",
                        "cel-id-2" : "backgroundColor",
                    }
            
        */

    }, {
        key: 'createWindow',
        value: function createWindow(options) {
            if (!options.template) options.template = "index.html";

            var cmd = {
                command: 'create-window',
                options: options
            };
            return new DisplayWindow(this, this._postRequest(cmd));
        }
    }, {
        key: 'getWindowById',
        value: function getWindowById(id) {
            return this.displayWindows.get(id);
        }
    }, {
        key: 'getViewObjectById',
        value: function getViewObjectById(id) {
            return this.viewObjects.get(id);
        }
    }]);

    return Display;
}(EventEmitter);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events');
var ViewObject = require('./viewobject');
module.exports = function (_EventEmitter) {
    _inherits(DisplayWindow, _EventEmitter);

    function DisplayWindow(display, options) {
        _classCallCheck(this, DisplayWindow);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(DisplayWindow).call(this));

        _this.display = display;
        _this.window_id = options.window_id;
        _this.screenName = options.screenName;
        _this.appContext = options.appContext;
        _this.template = options.template;
        _this.display.displayWindows.set(_this.window_id, _this);
        _this.display.on('window_event', function (data, flags) {});
        return _this;
    }

    _createClass(DisplayWindow, [{
        key: 'id',
        value: function id() {
            return this.window_id;
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.display.displayWindows.delete(this.window_id);
            this.display = null;
            this.window_id = null;
            this.screenName = null;
            this.appContext = null;
            this.template = null;
        }
    }, {
        key: 'checkStatus',
        value: function checkStatus() {
            if (!this.window_id) throw new Error("DisplayWindow is already deleted.");
        }

        //todo

    }, {
        key: 'addToGrid',
        value: function addToGrid(label, bounds) {}

        // setting DisplayWindow cssText

        /*
            returns the gridlayout
         */

    }, {
        key: 'getGrid',
        value: function getGrid() {
            this.checkStatus();
            var cmd = {
                command: 'get-grid',
                options: {
                    window_id: this.window_id
                }
            };
            return this.display._postRequest(cmd);
        }

        /*
            label is row|col or custom cell name
            js_css_style : http://www.w3schools.com/jsref/dom_obj_style.asp
        */

    }, {
        key: 'setCellStyle',
        value: function setCellStyle(label, js_css_style, animation) {
            this.checkStatus();
            var cmd = {
                command: 'cell-style',
                options: {
                    window_id: this.window_id,
                    label: label,
                    style: js_css_style
                }
            };
            if (animation) cmd.options.animation_options = animation;

            return this.display._postRequest(cmd);
        }
    }, {
        key: 'setFontSize',
        value: function setFontSize(px_string) {
            var cmd = {
                command: 'set-displaywindow-font-size',
                options: {
                    window_id: this.window_id,
                    fontSize: px_string
                }
            };
            return this.display._postRequest(cmd);
        }

        /*
            hides the displayWindow
        */

    }, {
        key: 'hide',
        value: function hide() {
            this.checkStatus();
            var cmd = {
                command: 'hide-window',
                options: {
                    window_id: this.window_id
                }
            };
            return this.display._postRequest(cmd);
        }

        /*
            shows the displayWindow
        */

    }, {
        key: 'show',
        value: function show() {
            this.checkStatus();
            var cmd = {
                command: 'show-window',
                options: {
                    window_id: this.window_id
                }
            };
            return this.display._postRequest(cmd);
        }

        /*
            permanently closes the displayWindow and destroys the viewobjects
        */

    }, {
        key: 'close',
        value: function close() {
            var _this2 = this;

            this.checkStatus();
            var cmd = {
                command: 'close-window',
                options: {
                    window_id: this.window_id
                }
            };
            var s = this.display._postRequest(cmd);
            s.viewObjects.forEach(function (v) {
                var view = _this2.display.getViewObjectById(v);
                if (view) view.destroy();
            });
            this.destroy();
            return s;
        }
    }, {
        key: 'openDevTools',
        value: function openDevTools() {
            this.checkStatus();
            var cmd = {
                command: 'window-dev-tools',
                options: {
                    window_id: this.window_id,
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
                command: 'window-dev-tools',
                options: {
                    window_id: this.window_id,
                    devTools: false
                }
            };
            return this.display._postRequest(cmd);
        }

        /*
           creates a new viewobject (webpage)
           options:
               - url
               - position (label or grid-top & grid-left)
               - width // in px or em 
               - height // in px or em 
               - cssText (string)
               - nodeintegration (boolean)
        */

    }, {
        key: 'createViewObject',
        value: function createViewObject(options) {
            this.checkStatus();
            options.window_id = this.window_id;
            options.appContext = this.appContext;
            options.screenName = this.screenName;
            var cmd = {
                command: 'create-viewobj',
                options: options
            };
            var s = this.display._postRequest(cmd);
            return new ViewObject(this.display, s);
        }
    }]);

    return DisplayWindow;
}(EventEmitter);
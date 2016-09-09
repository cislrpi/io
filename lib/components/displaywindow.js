"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ViewObject = require('./viewobject');
module.exports = function () {
    function DisplayWindow(display, options) {
        var _this = this;

        _classCallCheck(this, DisplayWindow);

        this.display = display;
        this.window_id = options.window_id;
        this.screenName = options.screenName;
        this.appContext = options.appContext;
        this.template = options.template;
        this.display.displayWindows.set(this.window_id, this);
        this.eventHandlers = new Map();
        this.display.io.onTopic("display.window", function (e) {
            var m = JSON.parse(e.toString());
            if (m.details.window_id == _this.window_id && m.details.screenName == _this.screenName) {
                m.details.eventType = m.type;
                if (_this.eventHandlers.has(m.type)) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = _this.eventHandlers.get(m.type)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var h = _step.value;

                            h(m.details);
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
                }
            }
        });
    }

    _createClass(DisplayWindow, [{
        key: "addEventListener",
        value: function addEventListener(type, handler) {
            if (this.eventHandlers.has(type)) {
                this.eventHandlers.get(type).add(handler);
            } else {
                var ws = new Set();
                ws.add(handler);
                this.eventHandlers.set(type, ws);
            }
        }
    }, {
        key: "removeEventListener",
        value: function removeEventListener(type, handler) {
            if (this.eventHandlers.has(type)) {
                this.eventHandlers.get(type).delete(handler);
            }
        }
    }, {
        key: "id",
        value: function id() {
            return this.window_id;
        }
    }, {
        key: "destroy",
        value: function destroy() {
            this.display.displayWindows.delete(this.window_id);
            this.display = null;
            this.window_id = null;
            this.screenName = null;
            this.appContext = null;
            this.template = null;
        }
    }, {
        key: "checkStatus",
        value: function checkStatus() {
            if (!this.window_id) throw new Error("DisplayWindow is already deleted.");
        }
    }, {
        key: "clearGrid",
        value: function clearGrid() {
            this.checkStatus();
            var cmd = {
                command: "clear-grid",
                options: {
                    window_id: this.window_id
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: "clearContents",
        value: function clearContents() {
            this.checkStatus();
            var cmd = {
                command: "clear-contents",
                options: {
                    window_id: this.window_id
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
            args: options (json object)
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
        key: "createUniformGrid",
        value: function createUniformGrid(options) {
            this.checkStatus();
            options.window_id = this.window_id;
            var cmd = {
                command: "create-grid",
                options: options
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: "addToGrid",
        value: function addToGrid(label, bounds, backgroundStyle) {
            this.checkStatus();
            var cmd = {
                command: "add-to-grid",
                options: {
                    window_id: this.window_id,
                    label: label,
                    bounds: bounds,
                    style: backgroundStyle
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: "removeFromGrid",
        value: function removeFromGrid(label) {
            this.checkStatus();
            var cmd = {
                command: "remove-from-grid",
                options: {
                    window_id: this.window_id,
                    label: label
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
            returns the gridlayout
         */

    }, {
        key: "getGrid",
        value: function getGrid() {
            this.checkStatus();
            var cmd = {
                command: 'get-grid',
                options: {
                    window_id: this.window_id
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: "getUniformGridCellSize",
        value: function getUniformGridCellSize() {
            this.checkStatus();
            var cmd = {
                command: 'uniform-grid-cell-size',
                options: {
                    window_id: this.window_id
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        // setting DisplayWindow cssText

        /*
            label is row|col or custom cell name
            js_css_style : http://www.w3schools.com/jsref/dom_obj_style.asp
        */

    }, {
        key: "setCellStyle",
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

            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: "setFontSize",
        value: function setFontSize(px_string) {
            var cmd = {
                command: 'set-displaywindow-font-size',
                options: {
                    window_id: this.window_id,
                    fontSize: px_string
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
            hides the displayWindow
        */

    }, {
        key: "hide",
        value: function hide() {
            this.checkStatus();
            var cmd = {
                command: 'hide-window',
                options: {
                    window_id: this.window_id
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
            shows the displayWindow
        */

    }, {
        key: "show",
        value: function show() {
            this.checkStatus();
            var cmd = {
                command: 'show-window',
                options: {
                    window_id: this.window_id
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
            permanently closes the displayWindow and destroys the viewobjects
        */

    }, {
        key: "close",
        value: function close() {
            var _this2 = this;

            this.checkStatus();
            var cmd = {
                command: 'close-window',
                options: {
                    window_id: this.window_id
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                m = JSON.parse(m.toString());
                m.viewObjects.forEach(function (v) {
                    var view = _this2.display.getViewObjectById(v);
                    if (view) view.destroy();
                });
                _this2.destroy();
                return m;
            });
        }
    }, {
        key: "openDevTools",
        value: function openDevTools() {
            this.checkStatus();
            var cmd = {
                command: 'window-dev-tools',
                options: {
                    window_id: this.window_id,
                    devTools: true
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: "closeDevTools",
        value: function closeDevTools() {
            this.checkStatus();
            var cmd = {
                command: 'window-dev-tools',
                options: {
                    window_id: this.window_id,
                    devTools: false
                }
            };
            return this.display._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
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
        key: "createViewObject",
        value: function createViewObject(options) {
            var _this3 = this;

            this.checkStatus();
            options.window_id = this.window_id;
            options.appContext = this.appContext;
            options.screenName = this.screenName;
            var cmd = {
                command: 'create-viewobj',
                options: options
            };

            return this.display._postRequest(cmd).then(function (m) {
                var opt = JSON.parse(m.toString());
                opt.width = parseFloat(options.width);
                opt.height = parseFloat(options.height);
                return new ViewObject(_this3.display, opt);
            });
        }
    }]);

    return DisplayWindow;
}();
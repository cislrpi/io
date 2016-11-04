'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ViewObject = require('./viewobject');
module.exports = function () {
    function DisplayWindow(io, options) {
        _classCallCheck(this, DisplayWindow);

        this.io = io;
        this.window_id = options.window_id;
        this.windowName = options.windowName;
        this.displayName = options.displayName;
        this.displayContext = options.displayContext;
        this.template = "index.html";
        this.x = options.x;
        this.y = options.y;
        this.width = options.width;
        this.height = options.height;
    }

    _createClass(DisplayWindow, [{
        key: '_postRequest',
        value: function _postRequest(data) {
            return this.io.call('rpc-display-' + this.displayName, JSON.stringify(data));
        }
    }, {
        key: 'id',
        value: function id() {
            return this.window_id;
        }
    }, {
        key: 'clearGrid',
        value: function clearGrid() {
            var cmd = {
                command: "clear-grid",
                options: {
                    window_id: this.window_id
                }
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: 'clearContents',
        value: function clearContents() {
            var cmd = {
                command: "clear-contents",
                options: {
                    window_id: this.window_id
                }
            };
            return this._postRequest(cmd).then(function (m) {
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
        key: 'createUniformGrid',
        value: function createUniformGrid(options) {
            options.window_id = this.window_id;
            var cmd = {
                command: "create-grid",
                options: options
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: 'addToGrid',
        value: function addToGrid(label, bounds, backgroundStyle) {
            var cmd = {
                command: "add-to-grid",
                options: {
                    window_id: this.window_id,
                    label: label,
                    bounds: bounds,
                    style: backgroundStyle
                }
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: 'removeFromGrid',
        value: function removeFromGrid(label) {
            var cmd = {
                command: "remove-from-grid",
                options: {
                    window_id: this.window_id,
                    label: label
                }
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
            returns the gridlayout
         */

    }, {
        key: 'getGrid',
        value: function getGrid() {
            var cmd = {
                command: 'get-grid',
                options: {
                    window_id: this.window_id
                }
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: 'getUniformGridCellSize',
        value: function getUniformGridCellSize() {
            var cmd = {
                command: 'uniform-grid-cell-size',
                options: {
                    window_id: this.window_id
                }
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        // setting DisplayWindow cssText

        /*
            label is row|col or custom cell name
            js_css_style : http://www.w3schools.com/jsref/dom_obj_style.asp
        */

    }, {
        key: 'setCellStyle',
        value: function setCellStyle(label, js_css_style, animation) {
            var cmd = {
                command: 'cell-style',
                options: {
                    window_id: this.window_id,
                    label: label,
                    style: js_css_style
                }
            };
            if (animation) cmd.options.animation_options = animation;

            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
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
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
            hides the displayWindow
        */

    }, {
        key: 'hide',
        value: function hide() {
            var cmd = {
                command: 'hide-window',
                options: {
                    window_id: this.window_id
                }
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
            shows the displayWindow
        */

    }, {
        key: 'show',
        value: function show() {
            var cmd = {
                command: 'show-window',
                options: {
                    window_id: this.window_id
                }
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
            permanently closes the displayWindow and destroys the viewobjects
        */

    }, {
        key: 'close',
        value: function close() {
            var _this = this;

            var cmd = {
                command: 'close-window',
                options: {
                    window_id: this.window_id
                }
            };
            return this._postRequest(cmd).then(function (m) {
                m = JSON.parse(m.toString());
                m.viewObjects.forEach(function (v) {
                    var view = _this.getViewObjectById(v);
                    if (view) view.destroy();
                });
                _this.destroy();
                return m;
            });
        }
    }, {
        key: 'openDevTools',
        value: function openDevTools() {
            var cmd = {
                command: 'window-dev-tools',
                options: {
                    window_id: this.window_id,
                    devTools: true
                }
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: 'closeDevTools',
        value: function closeDevTools() {
            var cmd = {
                command: 'window-dev-tools',
                options: {
                    window_id: this.window_id,
                    devTools: false
                }
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: 'capture',
        value: function capture() {
            var cmd = {
                command: 'capture-window',
                options: {
                    window_id: this.window_id
                }
            };
            return this._postRequest(cmd);
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
            var _this2 = this;

            options.window_id = this.window_id;
            options.displayContext = this.displayContext;
            options.displayName = this.displayName;
            options.windowName = this.windowName;
            var cmd = {
                command: 'create-viewobj',
                options: options
            };

            return this._postRequest(cmd).then(function (m) {
                var opt = JSON.parse(m.toString());
                // opt.width = parseFloat(options.width)
                // opt.height = parseFloat(options.height)
                return new ViewObject(_this2.io, opt);
            });
        }
    }]);

    return DisplayWindow;
}();
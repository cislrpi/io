'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var uuid = require('uuid');
var DisplayWindow = require('./displaywindow');

module.exports = function () {
    function Display(io) {
        var _this = this;

        _classCallCheck(this, Display);

        this.io = io;
        this.conf = io.display;
        this.client_id = uuid.v1();
        this.displayWindows = new Map();
        this.viewObjects = new Map();
        this.eventHandlers = new Map();
        // display route is display.window.viewobject
        this.io.onTopic("display.#.#", function (e) {
            var m = JSON.parse(e.toString());
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
        });

        this.addEventListener("appContextClosed", function (m) {
            if (m.closedWindows) {
                m.closedWindows.forEach(function (i) {
                    _this.displayWindows.delete(i);
                });
            }
            if (m.closedViewObjects) {
                m.closedViewObjects.forEach(function (i) {
                    _this.viewObjects.delete(i);
                });
            }
        });
    }

    _createClass(Display, [{
        key: 'addEventListener',
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
        key: 'removeEventListener',
        value: function removeEventListener(type, handler) {
            if (this.eventHandlers.has(type)) {
                this.eventHandlers.get(type).delete(handler);
            }
        }
    }, {
        key: '_postRequest',
        value: function _postRequest(data) {
            data.client_id = this.client_id;
            return this.io.call('display-rpc-queue', JSON.stringify(data));
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
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
            returns the active app context  as string
        */

    }, {
        key: 'getActiveAppContext',
        value: function getActiveAppContext() {
            var cmd = {
                command: "get-active-app-context"
            };
            return this._postRequest(cmd).then(function (m) {
                return m.toString();
            });
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
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
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
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }

        /*
        hides an app context  
        args: context (string)
        */

    }, {
        key: 'hideAppContext',
        value: function hideAppContext(context) {
            var cmd = {
                command: "hide-app-context",
                options: {
                    context: context
                }
            };
            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
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
            var _this2 = this;

            if (!options.template) options.template = "index.html";

            var cmd = {
                command: 'create-window',
                options: options
            };

            return this._postRequest(cmd).then(function (m) {
                // console.log(m.toString())
                var opt = JSON.parse(m.toString());
                return new DisplayWindow(_this2, opt);
            });
        }
    }, {
        key: 'getAllContexts',
        value: function getAllContexts() {
            var cmd = {
                command: 'get-all-contexts'
            };

            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: 'getWindowById',
        value: function getWindowById(id) {
            return this.displayWindows.get(id);
        }
    }, {
        key: 'getAllWindowIds',
        value: function getAllWindowIds() {
            return Object.keys(this.displayWindows);
        }
    }, {
        key: 'getAllWindowIdsByContext',
        value: function getAllWindowIdsByContext(context) {
            var cmd = {
                command: 'get-all-windows-by-context',
                options: {
                    context: context
                }
            };

            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }, {
        key: 'getViewObjectById',
        value: function getViewObjectById(id) {
            return this.viewObjects.get(id);
        }
    }, {
        key: 'getAllViewObjectIds',
        value: function getAllViewObjectIds() {
            return Object.keys(this.viewObjects);
        }
    }, {
        key: 'getAllViewObjectIdsByWindowId',
        value: function getAllViewObjectIdsByWindowId(w_id) {
            var ids = [];
            this.viewObjects.forEach(function (v, k) {
                if (v.window_id == w_id) ids.push(k);
            });
            return ids;
        }
    }, {
        key: 'closeAllWindows',
        value: function closeAllWindows() {
            var cmd = {
                command: 'close-all-windows'
            };

            return this._postRequest(cmd).then(function (m) {
                return JSON.parse(m.toString());
            });
        }
    }]);

    return Display;
}();
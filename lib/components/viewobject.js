"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
    function ViewObject(display, options) {
        var _this = this;

        _classCallCheck(this, ViewObject);

        this.display = display;
        this.view_id = options.view_id;
        this.screenName = options.screenName;
        this.window_id = options.window_id;
        this.display.viewObjects.set(this.view_id, this);
        this.eventHandlers = new Map();
        this.display.io.onTopic("display.window.viewobject", function (e) {
            var m = JSON.parse(e.toString());
            if (m.details.view_id == _this.view_id) {
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

    _createClass(ViewObject, [{
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
        key: "destroy",
        value: function destroy() {
            this.display.viewObjects.delete(this.view_id);
            this.display = null;
            this.view_id = null;
            this.screenName = null;
            this.window_id = null;
        }
    }, {
        key: "checkStatus",
        value: function checkStatus() {
            if (!this.view_id) throw new Error("ViewObject is already deleted.");
        }
    }, {
        key: "setUrl",
        value: function setUrl(url) {
            var cmd = {
                command: 'set-url',
                options: {
                    view_id: this.view_id,
                    url: url
                }
            };
            return this.display._postRequest(cmd);
        }
    }, {
        key: "setCSSStyle",
        value: function setCSSStyle(css_string) {
            var cmd = {
                command: 'set-webview-css-style',
                options: {
                    view_id: this.view_id,
                    cssText: css_string
                }
            };
            return this.display._postRequest(cmd);
        }
    }, {
        key: "executeJavaScript",
        value: function executeJavaScript(js_code, user_gesture) {
            var user_gesture = (typeof b !== 'undefined') ?  user_gesture : false;
            var cmd = {
                command: 'webview-execute-javascript',
                options: {
                    view_id: this.view_id,
                    jsCode: js_code,
                    userGesture: user_gesture
                }
            };
        }
    }, {
        key: "reload",
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
        key: "hide",
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
        key: "show",
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
        key: "close",
        value: function close() {
            this.checkStatus();
            var cmd = {
                command: 'close',
                options: {
                    view_id: this.view_id
                }
            };
            var s = this.display._postRequest(cmd);
            if (s.status == "success") {
                this.destroy();
            }
            return s;
        }
    }, {
        key: "setBounds",
        value: function setBounds(options) {
            this.checkStatus();
            // if(options.scaleContent){
            //     let w = parseFloat(options.width)
            //     let h = parseFloat(options.height)
            //     let dia = Math.sqrt( Math.pow(w,2) + Math.pow(h,2) )
            //     options.scale = dia * 1.0 /this.o_diagonal
            // }
            options.view_id = this.view_id;
            var cmd = {
                command: 'set-bounds',
                options: options
            };
            return this.display._postRequest(cmd);
        }
    }, {
        key: "goBack",
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
        key: "goForward",
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
        key: "openDevTools",
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
        key: "closeDevTools",
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
}();

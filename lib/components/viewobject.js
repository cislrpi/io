'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
    function ViewObject(io, options) {
        _classCallCheck(this, ViewObject);

        this.io = io;
        this.view_id = options.view_id;
        this.displayName = options.displayName;
        this.window_id = options.window_id;
        this.windowName = options.windowName;
        this.displayContext = options.displayContext;
    }

    _createClass(ViewObject, [{
        key: '_postRequest',
        value: function _postRequest(data) {
            return this.io.call('rpc-display-' + this.displayName, JSON.stringify(data));
        }
    }, {
        key: 'setUrl',
        value: function setUrl(url) {
            var cmd = {
                command: 'set-url',
                options: {
                    view_id: this.view_id,
                    url: url
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'getUrl',
        value: function getUrl() {
            var cmd = {
                command: 'get-url',
                options: {
                    view_id: this.view_id
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'setCSSStyle',
        value: function setCSSStyle(css_string) {
            var cmd = {
                command: 'set-webview-css-style',
                options: {
                    view_id: this.view_id,
                    cssText: css_string
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'enableDeviceEmulation',
        value: function enableDeviceEmulation(options) {
            var cmd = {
                command: 'enable-device-emulation',
                options: {
                    view_id: this.view_id,
                    parameters: options
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'disableDeviceEmulation',
        value: function disableDeviceEmulation() {
            var cmd = {
                command: 'disable-device-emulation',
                options: {
                    view_id: this.view_id
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'reload',
        value: function reload() {
            var cmd = {
                command: 'reload',
                options: {
                    view_id: this.view_id
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'hide',
        value: function hide() {
            var cmd = {
                command: 'hide',
                options: {
                    view_id: this.view_id
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'show',
        value: function show() {
            var cmd = {
                command: 'show',
                options: {
                    view_id: this.view_id
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'close',
        value: function close() {
            var cmd = {
                command: 'close',
                options: {
                    view_id: this.view_id
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'setBounds',
        value: function setBounds(options) {
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
            return this._postRequest(cmd);
        }
    }, {
        key: 'getBounds',
        value: function getBounds() {
            var cmd = {
                command: 'get-bounds',
                options: {
                    view_id: this.view_id
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'goBack',
        value: function goBack(options) {
            var cmd = {
                command: 'back',
                options: {
                    view_id: this.view_id
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'goForward',
        value: function goForward() {
            var cmd = {
                command: 'forward',
                options: {
                    view_id: this.view_id
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'openDevTools',
        value: function openDevTools() {
            var cmd = {
                command: 'view-object-dev-tools',
                options: {
                    view_id: this.view_id,
                    devTools: true
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'closeDevTools',
        value: function closeDevTools() {
            var cmd = {
                command: 'view-object-dev-tools',
                options: {
                    view_id: this.view_id,
                    devTools: false
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'setAudioMuted',
        value: function setAudioMuted(val) {
            var cmd = {
                command: 'set-audio-muted',
                options: {
                    view_id: this.view_id,
                    audio: val
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: 'isAudioMuted',
        value: function isAudioMuted() {
            var cmd = {
                command: 'get-audio-muted',
                options: {
                    view_id: this.view_id
                }
            };
            return this._postRequest(cmd);
        }
    }, {
        key: '_on',
        value: function _on(topic, handler) {
            var _this = this;

            this.io.onTopic(topic, function (msg, headers) {
                var m = JSON.parse(msg.toString());
                if (handler != null && m.details.view_id == _this.view_id) handler(m, headers);
            });
        }
    }, {
        key: 'onHidden',
        value: function onHidden(handler) {
            this._on('display.' + this.displayContext + '.viewObjectHidden.' + this.view_id, handler);
        }
    }, {
        key: 'onShown',
        value: function onShown(handler) {
            this._on('display.' + this.displayContext + '.viewObjectShown.' + this.view_id, handler);
        }
    }, {
        key: 'onClosed',
        value: function onClosed(handler) {
            this._on('display.' + this.displayContext + '.viewObjectClosed.' + this.view_id, handler);
        }
    }, {
        key: 'onBoundsChanged',
        value: function onBoundsChanged(handler) {
            this._on('display.' + this.displayContext + '.viewObjectBoundsChanged.' + this.view_id, handler);
        }
    }, {
        key: 'onUrlChanged',
        value: function onUrlChanged(handler) {
            this._on('display.' + this.displayContext + '.viewObjectUrlChanged.' + this.view_id, handler);
        }
    }, {
        key: 'onUrlReloaded',
        value: function onUrlReloaded(handler) {
            this._on('display.' + this.displayContext + '.viewObjectUrlChanged.' + this.view_id, handler);
        }
    }, {
        key: 'onCrashed',
        value: function onCrashed(handler) {
            this._on('display.' + this.displayContext + '.viewObjectCrashed.' + this.view_id, handler);
        }
    }, {
        key: 'onGPUCrashed',
        value: function onGPUCrashed(handler) {
            this._on('display.' + this.displayContext + '.viewObjectGPUCrashed.' + this.view_id, handler);
        }
    }, {
        key: 'onPluginCrashed',
        value: function onPluginCrashed(handler) {
            this._on('display.' + this.name + '.viewObjectPluginCrashed.' + this.view_id, handler);
        }
    }]);

    return ViewObject;
}();
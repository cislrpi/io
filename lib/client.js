'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Stomp = require('stompjs/lib/stomp').Stomp;
var Transcript = require('./components/transcript');
var Speaker = require('./components/speaker');
var DisplayContext = require('./components/displaycontext');
var Store = require('./components/clientstore');
var uuid = require('uuid');

module.exports = function () {
    function CELIO(config) {
        _classCallCheck(this, CELIO);

        if (!config.mq.exchange) {
            config.mq.exchange = 'amq.topic';
        }
        var sepPos = config.mq.url.lastIndexOf('/');
        if (sepPos > -1) {
            config.mq.vhost = config.mq.url.substring(sepPos + 1);
            config.mq.url = config.mq.url.substring(0, sepPos);
        } else {
            config.mq.vhost = '/';
        }

        var protocol = 'ws';
        var port = 15674;

        if (config.mq.tls) {
            console.log('Making a secure websocket connection.');
            protocol = 'wss';
            port = 15671;
        }

        this.brokerURL = protocol + '://' + config.mq.url + ':' + port + '/ws';
        var client = Stomp.over(new WebSocket(this.brokerURL));
        client.debug = null;
        this.pconn = new Promise(function (resolve, reject) {
            client.connect(config.mq.username, config.mq.password, function () {
                return resolve(client);
            }, function (err) {
                console.error(err);reject(err);
            }, config.mq.vhost);
        });
        this.config = config;

        // Make the store connection
        this.store = new Store(config.store);

        // Make singleton objects
        this.transcript = new Transcript(this);
    }

    _createClass(CELIO, [{
        key: 'generateUUID',
        value: function generateUUID() {
            return uuid.v4();
        }
    }, {
        key: 'getTranscript',
        value: function getTranscript() {
            return this.transcript;
        }
    }, {
        key: 'getSpeaker',
        value: function getSpeaker() {
            return new Speaker(this);
        }
    }, {
        key: 'getDisplay',
        value: function getDisplay() {
            return new Display(this);
        }
    }, {
        key: 'createDisplayContext',
        value: function createDisplayContext(ur_app_name, options) {
            var _dc = new DisplayContext(ur_app_name, this);
            return _dc.restoreFromStore(options).then(function (m) {
                return _dc;
            });
        }
    }, {
        key: 'getDisplayContextList',
        value: function getDisplayContextList() {
            return this.store.getSet("displayContexts");
        }
    }, {
        key: 'getActiveDisplayContext',
        value: function getActiveDisplayContext() {
            var _this = this;

            return this.store.getState("activeDisplayContext").then(function (m) {
                if (m) {
                    var _ret = function () {
                        var _dc = new DisplayContext(m, _this);
                        return {
                            v: _dc.restoreFromStore({}).then(function (m) {
                                return _dc;
                            })
                        };
                    }();

                    if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
                } else return new Error("No active display context available");
            });
        }
    }, {
        key: 'setActiveDisplayContext',
        value: function setActiveDisplayContext(appname, reset) {
            var _this2 = this;

            console.log("requested app name : ", appname);
            this.store.getState("activeDisplayContext").then(function (name) {
                console.log("app name in store : ", name);
                if (name != appname) {
                    _this2.store.setState("activeDisplayContext", appname)(new DisplayContext(appname, _this2)).restoreFromStore({ reset: reset });
                } else {
                    console.log("app name : ", appname, "is already active");
                }
            });
        }
    }, {
        key: 'hideAllDisplayContext',
        value: function hideAllDisplayContext() {
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

                        _ps.push(_this3.call('display-rpc-queue-' + _k, JSON.stringify(cmd)));
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
        key: 'getActiveDisplays',
        value: function getActiveDisplays() {
            return this.store.getHash("display.displays");
        }
    }, {
        key: 'getFocusedDisplayWindow',
        value: function getFocusedDisplayWindow() {
            var displayName = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "main";

            var cmd = {
                command: 'get-focus-window'
            };
            return this.call('display-rpc-queue-' + k, JSON.stringify(cmd)).then(function (m) {
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

                        _ps.push(_this4.call('display-rpc-queue-' + _k2, JSON.stringify(cmd)));
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
                }return m;
            });
        }
    }, {
        key: 'getStore',
        value: function getStore() {
            return this.store;
        }
    }, {
        key: 'call',
        value: function call(queue, content) {
            var _this5 = this;

            var headers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            return new Promise(function (resolve, reject) {
                var rpcClient = Stomp.over(new WebSocket(_this5.brokerURL));
                rpcClient.debug = null;
                rpcClient.connect(_this5.config.mq.username, _this5.config.mq.password, function () {
                    headers['correlation-id'] = generateUUID();
                    headers['reply-to'] = '/temp-queue/result';
                    if (!headers.expiration) {
                        headers.expiration = 3000; // default to 3 sec;
                    }
                    var timeoutID = void 0;
                    // Time out the response when the caller has been waiting for too long
                    if (typeof headers.expiration === 'number') {
                        timeoutID = setTimeout(function () {
                            rpcClient.onreceive = null;
                            reject(new Error('Request timed out after ' + headers.expiration + ' ms.'));
                            rpcClient.disconnect();
                        }, headers.expiration + 500);
                    }

                    rpcClient.onreceive = function (msg) {
                        if (msg.headers['correlation-id'] === headers['correlation-id']) {
                            if (msg.headers.error) {
                                reject(new Error(msg.headers.error));
                            } else {
                                resolve(msg.body, msg.headers);
                            }

                            clearTimeout(timeoutID);
                            rpcClient.disconnect();
                        };
                    };
                    rpcClient.send('/amq/queue/' + queue, headers, content);
                }, reject, _this5.config.mq.vhost);
            });
        }

        // Webclient should not handle RPC calls.
        // doCall(queue, handler, noAck=true) {
        // }

    }, {
        key: 'onTopic',
        value: function onTopic(topic, handler) {
            var _this6 = this;

            this.pconn.then(function (client) {
                return client.subscribe('/exchange/' + _this6.config.mq.exchange + '/' + topic, function (msg) {
                    handler(msg.body, msg.headers);
                });
            });
        }
    }, {
        key: 'publishTopic',
        value: function publishTopic(topic, content, options) {
            var _this7 = this;

            this.pconn.then(function (client) {
                return client.send('/exchange/' + _this7.config.mq.exchange + '/' + topic, options, content);
            });
        }
    }]);

    return CELIO;
}();
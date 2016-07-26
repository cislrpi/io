'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Stomp = require('stompjs/lib/stomp').Stomp;
var Transcript = require('./components/transcript');
var Hotspot = require('./components/hotspot');
var Speaker = require('./components/speaker');
var Display = require('./components/display');
function uuid(a) {
    return a ? (a ^ Math.random() * 16 >> a / 4).toString(16) : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, uuid);
};

module.exports = function () {
    function CELIO(mq) {
        _classCallCheck(this, CELIO);

        this.mq = mq;
        this.brokerURL = 'ws://' + mq.url + ':15674/ws';
        var client = Stomp.over(new WebSocket(this.brokerURL));
        client.debug = null;
        this.pconn = new Promise(function (resolve, reject) {
            client.connect(mq.username, mq.password, function () {
                return resolve(client);
            }, function (err) {
                console.error(err);reject(err);
            });
        });
        this.config = mq;
    }

    _createClass(CELIO, [{
        key: 'getTranscript',
        value: function getTranscript() {
            if (this.pconn) return new Transcript(this);else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'getSpeaker',
        value: function getSpeaker() {
            if (this.pconn) return new Speaker(this);else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'getDisplay',
        value: function getDisplay() {
            if (this.display) return new Display(this);else throw new Error('Display worker not configured.');
        }
    }, {
        key: 'call',
        value: function call(queue, content) {
            var _this = this;

            var headers = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

            if (this.pconn) {
                return new Promise(function (resolve, reject) {
                    var rpcClient = Stomp.over(new WebSocket(_this.brokerURL));
                    rpcClient.debug = null;
                    rpcClient.connect(_this.mq.username, _this.mq.password, function () {
                        headers['correlation-id'] = uuid();
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
                                console.error(msg.headers);
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
                    }, reject);
                });
            } else throw new Error('Message exchange not configured.');
        }

        // Webclient should not handle RPC calls.
        // doCall(queue, handler, noAck=true) {
        // }

    }, {
        key: 'onTopic',
        value: function onTopic(topic, handler) {
            var _this2 = this;

            if (this.pconn) {
                this.pconn.then(function (client) {
                    return client.subscribe('/exchange/' + _this2.config.exchange + '/' + topic, function (msg) {
                        handler(msg.body, msg.headers);
                    });
                });
            } else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'publishTopic',
        value: function publishTopic(topic, content, options) {
            var _this3 = this;

            if (this.pconn) this.pconn.then(function (client) {
                return client.send('/exchange/' + _this3.config.exchange + '/' + topic, options, content);
            });else throw new Error('Message exchange not configured.');
        }
    }]);

    return CELIO;
}();
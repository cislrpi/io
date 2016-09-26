'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Stomp = require('stompjs/lib/stomp').Stomp;
var Transcript = require('./components/transcript');
var Speaker = require('./components/speaker');
var Display = require('./components/display');
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
        this.brokerURL = 'ws://' + config.mq.url + ':15674/ws';
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
    }

    _createClass(CELIO, [{
        key: 'getTranscript',
        value: function getTranscript() {
            return new Transcript(this);
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
        key: 'call',
        value: function call(queue, content) {
            var _this = this;

            var headers = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

            return new Promise(function (resolve, reject) {
                var rpcClient = Stomp.over(new WebSocket(_this.brokerURL));
                rpcClient.debug = null;
                rpcClient.connect(_this.config.mq.username, _this.config.mq.password, function () {
                    headers['correlation-id'] = uuid.v4();
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
                }, reject, _this.config.mq.vhost);
            });
        }

        // Webclient should not handle RPC calls.
        // doCall(queue, handler, noAck=true) {
        // }

    }, {
        key: 'onTopic',
        value: function onTopic(topic, handler) {
            var _this2 = this;

            this.pconn.then(function (client) {
                return client.subscribe('/exchange/' + _this2.config.mq.exchange + '/' + topic, function (msg) {
                    handler(msg.body, msg.headers);
                });
            });
        }
    }, {
        key: 'publishTopic',
        value: function publishTopic(topic, content, options) {
            var _this3 = this;

            this.pconn.then(function (client) {
                return client.send('/exchange/' + _this3.config.mq.exchange + '/' + topic, options, content);
            });
        }
    }]);

    return CELIO;
}();
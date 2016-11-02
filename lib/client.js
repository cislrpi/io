'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Stomp = require('stompjs/lib/stomp').Stomp;

var CELIOAbstract = require('./CELIOAbstract');
var Store = require('./components/clientstore');

module.exports = function (_CELIOAbstract) {
    _inherits(CELIO, _CELIOAbstract);

    function CELIO(config) {
        _classCallCheck(this, CELIO);

        var _this = _possibleConstructorReturn(this, (CELIO.__proto__ || Object.getPrototypeOf(CELIO)).call(this));

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

        _this.brokerURL = protocol + '://' + config.mq.url + ':' + port + '/ws';
        var client = Stomp.over(new WebSocket(_this.brokerURL));
        client.debug = null;
        _this.pconn = new Promise(function (resolve, reject) {
            client.connect(config.mq.username, config.mq.password, function () {
                return resolve(client);
            }, function (err) {
                console.error(err);reject(err);
            }, config.mq.vhost);
        });
        _this.config = config;

        // Make the store connection
        _this.store = new Store(config.store);
        return _this;
    }

    _createClass(CELIO, [{
        key: 'call',
        value: function call(queue, content) {
            var _this2 = this;

            var headers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            return new Promise(function (resolve, reject) {
                var rpcClient = Stomp.over(new WebSocket(_this2.brokerURL));
                rpcClient.debug = null;
                rpcClient.connect(_this2.config.mq.username, _this2.config.mq.password, function () {
                    headers['correlation-id'] = _this2.generateUUID();
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
                }, reject, _this2.config.mq.vhost);
            });
        }

        // Webclient should not handle RPC calls.
        // doCall(queue, handler, noAck=true) {
        // }

    }, {
        key: 'onTopic',
        value: function onTopic(topic, handler) {
            var _this3 = this;

            this.pconn.then(function (client) {
                return client.subscribe('/exchange/' + _this3.config.mq.exchange + '/' + topic, function (msg) {
                    handler(msg.body, msg.headers);
                });
            });
        }
    }, {
        key: 'publishTopic',
        value: function publishTopic(topic, content, options) {
            var _this4 = this;

            this.pconn.then(function (client) {
                return client.send('/exchange/' + _this4.config.mq.exchange + '/' + topic, options, content);
            });
        }
    }]);

    return CELIO;
}(CELIOAbstract);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/* eslint-env node */

var path = require('path');
var fs = require('fs');
var nconf = require('nconf');
var amqp = require('amqplib');
var _ = require('lodash');

var CELIOAbstract = require('./CELIOAbstract');
var Hotspot = require('./components/hotspot');
var Store = require('./components/store');

module.exports = function (_CELIOAbstract) {
    _inherits(CELIO, _CELIOAbstract);

    function CELIO() {
        _classCallCheck(this, CELIO);

        var _this = _possibleConstructorReturn(this, (CELIO.__proto__ || Object.getPrototypeOf(CELIO)).call(this));

        var configFile = path.join(process.cwd(), 'cog.json');
        nconf.argv().file({ file: configFile }).env('_');

        nconf.required(['mq:url', 'mq:username', 'mq:password', 'store:url']);
        nconf.defaults({ 'mq': { 'exchange': 'amq.topic' } });
        _this.exchange = nconf.get('mq:exchange');

        var ca = nconf.get('mq:ca');
        var auth = nconf.get('mq:username') + ':' + nconf.get('mq:password') + '@';

        if (ca) {
            _this.pconn = amqp.connect('amqps://' + auth + nconf.get('mq:url'), {
                ca: [fs.readFileSync(ca)]
            });
        } else {
            _this.pconn = amqp.connect('amqp://' + auth + nconf.get('mq:url'));
        }

        // Make a shared channel for publishing and subscribe
        _this.pch = _this.pconn.then(function (conn) {
            return conn.createChannel();
        });

        _this.config = nconf;
        // Make the store connection
        _this.store = new Store(nconf.get('store'));
        return _this;
    }

    _createClass(CELIO, [{
        key: 'createHotspot',
        value: function createHotspot(region) {
            var excludeEventsOutsideRegion = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            return new Hotspot(this, region, excludeEventsOutsideRegion);
        }
    }, {
        key: 'call',
        value: function call(queue, content) {
            var _this2 = this;

            var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

            return new Promise(function (resolve, reject) {
                _this2.pconn.then(function (conn) {
                    return conn.createChannel().then(function (ch) {
                        return ch.assertQueue('', { exclusive: true }).then(function (q) {
                            options.correlationId = _this2.generateUUID();
                            options.replyTo = q.queue;
                            if (!options.expiration) {
                                options.expiration = 3000; // default to 3 sec;
                            }
                            var timeoutID = void 0;
                            // Time out the response when the caller has been waiting for too long
                            if (typeof options.expiration === 'number') {
                                timeoutID = setTimeout(function () {
                                    reject(new Error('Request timed out after ' + options.expiration + ' ms.'));
                                    ch.close();
                                }, options.expiration + 500);
                            }

                            ch.consume(q.queue, function (msg) {
                                if (msg.properties.correlationId === options.correlationId) {
                                    if (msg.properties.headers.error) {
                                        reject(new Error(msg.properties.headers.error));
                                    } else {
                                        resolve(msg.content, _.merge(msg.fields, msg.properties));
                                    }

                                    clearTimeout(timeoutID);
                                    ch.close();
                                };
                            }, { noAck: true });
                            ch.sendToQueue(queue, Buffer.isBuffer(content) ? content : new Buffer(content), options);
                        });
                    });
                }).catch(reject);
            });
        }

        // when noAck is false, the handler should acknowledge the message using the provided function;

    }, {
        key: 'doCall',
        value: function doCall(queue, handler) {
            var noAck = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
            var exclusive = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

            this.pch.then(function (ch) {
                ch.prefetch(1);
                ch.assertQueue(queue, { exclusive: exclusive }).then(function (q) {
                    return ch.consume(q.queue, function (request) {
                        var replyCount = 0;
                        function reply(response) {
                            if (replyCount >= 1) {
                                throw new Error('Replied more than once.');
                            }
                            replyCount++;
                            if (response instanceof Error) {
                                ch.sendToQueue(request.properties.replyTo, new Buffer(''), { correlationId: request.properties.correlationId, headers: { error: response.message } });
                            } else {
                                ch.sendToQueue(request.properties.replyTo, Buffer.isBuffer(response) ? response : new Buffer(response), { correlationId: request.properties.correlationId });
                            }
                        }

                        handler({ content: request.content, headers: _.merge(request.fields, request.properties) }, reply, noAck ? undefined : function ack() {
                            ch.ack(request);
                        });
                    }, { noAck: noAck });
                });
            });
        }
    }, {
        key: 'onTopic',
        value: function onTopic(topic, handler) {
            var _this3 = this;

            this.pch.then(function (ch) {
                return ch.assertQueue('', { exclusive: true }).then(function (q) {
                    return ch.bindQueue(q.queue, _this3.exchange, topic).then(function () {
                        return ch.consume(q.queue, function (msg) {
                            return handler(msg.content, _.merge(msg.fields, msg.properties));
                        }, { noAck: true });
                    });
                });
            });
        }
    }, {
        key: 'publishTopic',
        value: function publishTopic(topic, content, options) {
            var _this4 = this;

            this.pch.then(function (ch) {
                return ch.publish(_this4.exchange, topic, Buffer.isBuffer(content) ? content : new Buffer(content), options);
            });
        }
    }]);

    return CELIO;
}(CELIOAbstract);
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require('path');
var fs = require('fs');
var nconf = require('nconf');
var amqp = require('amqplib');
var Transcript = require('./components/transcript');
var Hotspot = require('./components/hotspot');
var Speaker = require('./components/speaker');
var Display = require('./components/display');
var uuid = require('uuid');

module.exports = function () {
    function CELIO() {
        _classCallCheck(this, CELIO);

        var configFile = path.join(process.cwd(), 'cog.json');
        nconf.argv().file({ file: configFile }).env('_');

        if (nconf.get('mq')) {
            nconf.required(['mq:url', 'mq:exchange', 'mq:username', 'mq:password']);
            this.exchange = nconf.get('mq:exchange');

            this.ca = nconf.get('mq:ca');
            this.auth = nconf.get('mq:username') + ':' + nconf.get('mq:password') + "@";

            // Make a shared channel for publishing and subscribe           
            this.pch = this._connectBroker().then(function (conn) {
                return conn.createChannel();
            });
        }

        this.display = nconf.get('display');
        this.config = nconf;
    }

    _createClass(CELIO, [{
        key: '_connectBroker',
        value: function _connectBroker() {
            if (this.ca) {
                return amqp.connect('amqps://' + this.auth + nconf.get('mq:url'), {
                    ca: [fs.readFileSync(this.ca)]
                });
            } else {
                return amqp.connect('amqp://' + this.auth + nconf.get('mq:url'));
            }
        }
    }, {
        key: 'getTranscript',
        value: function getTranscript() {
            if (this.pch) return new Transcript(this);else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'getSpeaker',
        value: function getSpeaker() {
            if (this.pch) return new Speaker(this);else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'getDisplay',
        value: function getDisplay() {
            if (this.display) return new Display(this);else throw new Error('Display worker not configured.');
        }
    }, {
        key: 'createHotspot',
        value: function createHotspot(region) {
            if (this.pch) return new Hotspot(region, this);else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'call',
        value: function call(queue, content, options, timeout) {
            var _this = this;

            if (this.pch) {
                if (!timeout) {
                    timeout = 30000; // Set default timeout to 30 seconds.
                }
                return new Promise(function (resolve, reject) {
                    _this._connectBroker().then(function (conn) {
                        return conn.createChannel().then(function (ch) {
                            return ch.assertQueue('', { exclusive: true }).then(function (q) {
                                options.correlationId = uuid.v1();
                                options.replyTo = q.queue;
                                var timeoutID = void 0;
                                ch.consume(q.queue, function (msg) {
                                    if (msg.properties.correlationId === correlationId) {
                                        resolve(msg.content, msg.fields, msg.properties);
                                        clearTimeout(timeoutID);
                                        conn.close();
                                    };
                                }, { noAck: true });
                                ch.sendToQueue(queue, Buffer.isBuffer(content) ? content : new Buffer(content), options);

                                // Time out the response when the caller has been waiting for too long
                                if (typeof timeout === 'number') {
                                    timeoutID = setTimeout(function () {
                                        reject(new Error('Request timed out after ' + timeout + ' ms.'));
                                        conn.close();
                                    }, timeout);
                                }
                            });
                        });
                    }).catch(reject);
                });
            } else throw new Error('Message exchange not configured.');
        }

        // when noAck is false, the handler should acknowledge the message using the provided function;

    }, {
        key: 'onCall',
        value: function onCall(queue, handler, noAck) {
            if (this.pch) this.pch.then(function (ch) {
                if (typeof noAck === 'undefined') noAck = true;
                ch.prefetch(1);
                return ch.assertQueue(queue, { durable: false }).then(function (q) {
                    return ch.consume(q.queue, function (msg) {
                        var result = handler(msg.content, msg.fields, msg.properties, function ack() {
                            ch.ack(msg);
                        });

                        if (result) {
                            ch.sendToQueue(msg.properties.replyTo, Buffer.isBuffer(result) ? result : new Buffer(result), { correlationId: msg.properties.correlationId });
                        }
                    }, { noAck: noAck });
                });
            });else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'onTopic',
        value: function onTopic(topic, handler) {
            var _this2 = this;

            if (this.pch) this.pch.then(function (ch) {
                return ch.assertQueue('', { exclusive: true }).then(function (q) {
                    return ch.bindQueue(q.queue, _this2.exchange, topic).then(function () {
                        return ch.consume(q.queue, function (msg) {
                            return handler(msg.content, msg.fields, msg.properties);
                        }, { noAck: true });
                    });
                });
            });else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'publishTopic',
        value: function publishTopic(topic, content, options) {
            var _this3 = this;

            if (this.pch) this.pch.then(function (ch) {
                return ch.publish(_this3.exchange, topic, Buffer.isBuffer(content) ? content : new Buffer(content), options);
            });else throw new Error('Message exchange not configured.');
        }
    }]);

    return CELIO;
}();
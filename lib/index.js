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
var _ = require('lodash');

module.exports = function () {
    function CELIO() {
        _classCallCheck(this, CELIO);

        var configFile = path.join(process.cwd(), 'cog.json');
        nconf.argv().file({ file: configFile }).env('_');

        nconf.required(['mq:url', 'mq:username', 'mq:password']);
        nconf.defaults({ 'mq': { 'exchange': 'amq.topic' } });
        this.exchange = nconf.get('mq:exchange');

        var ca = nconf.get('mq:ca');
        var auth = nconf.get('mq:username') + ':' + nconf.get('mq:password') + "@";

        if (ca) {
            this.pconn = amqp.connect('amqps://' + auth + nconf.get('mq:url'), {
                ca: [fs.readFileSync(ca)]
            });
        } else {
            this.pconn = amqp.connect('amqp://' + auth + nconf.get('mq:url'));
        }

        // Make a shared channel for publishing and subscribe           
        this.pch = this.pconn.then(function (conn) {
            return conn.createChannel();
        });

        this.config = nconf;
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
        key: 'createHotspot',
        value: function createHotspot(region) {
            return new Hotspot(region, this);
        }
    }, {
        key: 'call',
        value: function call(queue, content) {
            var _this = this;

            var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

            return new Promise(function (resolve, reject) {
                _this.pconn.then(function (conn) {
                    return conn.createChannel().then(function (ch) {
                        return ch.assertQueue('', { exclusive: true }).then(function (q) {
                            options.correlationId = uuid.v4();
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
            var noAck = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];
            var exclusive = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];

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
                                ch.sendToQueue(request.properties.replyTo, Buffer.isBuffer(response) ? result : new Buffer(response), { correlationId: request.properties.correlationId });
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
            var _this2 = this;

            this.pch.then(function (ch) {
                return ch.assertQueue('', { exclusive: true }).then(function (q) {
                    return ch.bindQueue(q.queue, _this2.exchange, topic).then(function () {
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
            var _this3 = this;

            this.pch.then(function (ch) {
                return ch.publish(_this3.exchange, topic, Buffer.isBuffer(content) ? content : new Buffer(content), options);
            });
        }
    }]);

    return CELIO;
}();
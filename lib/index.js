'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require('path');
var fs = require('fs');
var amqp = require('amqplib');
var Transcript = require('./components/transcript');

module.exports = function () {
    function CELIO() {
        _classCallCheck(this, CELIO);

        var configFile = path.join(process.cwd(), 'cog.json');
        this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

        this.pconn = amqp.connect(this.config.rabbitMQ.url);
        this.ppubch = this.pconn.then(function (conn) {
            return conn.createChannel();
        });
    }

    _createClass(CELIO, [{
        key: 'getTranscript',
        value: function getTranscript() {
            return new Transcript(this.pconn, this.config.rabbitMQ.exchange);
        }
    }, {
        key: 'onCommands',
        value: function onCommands(command, handler) {
            this.onTopic(command + '.command', handler);
        }
    }, {
        key: 'onTopic',
        value: function onTopic(topic, handler) {
            var ex = this.config.rabbitMQ.exchange;
            this.pconn.then(function (conn) {
                return conn.createChannel();
            }).then(function (ch) {
                return ch.assertQueue('', { exclusive: true }).then(function (q) {
                    return ch.bindQueue(q.queue, ex, topic).then(function () {
                        return ch.consume(q.queue, function (msg) {
                            return handler(JSON.parse(msg.content.toString()));
                        }, { noAck: true });
                    }, console.error);
                });
            });
        }
    }, {
        key: 'publishTopic',
        value: function publishTopic(topic, msg) {
            var ex = this.exchange;
            if ((typeof msg === 'undefined' ? 'undefined' : _typeof(msg)) === 'object') {
                msg = JSON.stringify(msg);
            }
            this.ppubch.then(function (ch) {
                return ch.publish(ex, topic, new Buffer(msg));
            });
        }
    }]);

    return CELIO;
}();
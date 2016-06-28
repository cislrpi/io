'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var amqp = require('amqplib');

module.exports = function () {
    function Transcript(pconn, exchange) {
        _classCallCheck(this, Transcript);

        this.pch = pconn.then(function (conn) {
            return conn.createChannel();
        });
        this.exchange = exchange;
    }

    _createClass(Transcript, [{
        key: '_on',
        value: function _on(topic, handler) {
            var ex = this.exchange;
            this.pch.then(function (ch) {
                return ch.assertQueue('', { exclusive: true }).then(function (q) {
                    return ch.bindQueue(q.queue, ex, topic).then(function () {
                        return ch.consume(q.queue, function (msg) {
                            return handler(JSON.parse(msg.content.toString()));
                        }, { noAck: true });
                    });
                });
            });
        }
    }, {
        key: 'onAll',
        value: function onAll(handler) {
            this._on('*.*.transcript', handler);
        }
    }, {
        key: 'onFinal',
        value: function onFinal(handler) {
            this._on('*.final.transcript', handler);
        }
    }, {
        key: 'onInterim',
        value: function onInterim(handler) {
            this._on('*.interim.transcript', handler);
        }
    }, {
        key: 'switchModel',
        value: function switchModel(model) {
            var _this = this;

            this.pch.then(function (ch) {
                return ch.publish(_this.exchange, 'stt.command', new Buffer(JSON.stringify({ command: 'switch-model', model: model })));
            });
        }
    }, {
        key: 'publish',
        value: function publish(source, isFinal, msg) {
            var _this2 = this;

            var topic = isFinal ? 'final' : 'interim';
            this.pch.then(function (ch) {
                return ch.publish(_this2.exchange, source + '.' + topic + '.transcript', new Buffer(JSON.stringify(msg)));
            });
        }
    }]);

    return Transcript;
}();
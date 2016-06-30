'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require('path');
var fs = require('fs');
var amqp = require('amqplib');
var Transcript = require('./components/transcript');
var Hotspot = require('./components/hotspot');
var Speaker = require('./components/speaker');

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
            return new Transcript(this);
        }
    }, {
        key: 'getSpeaker',
        value: function getSpeaker() {
            return new Speaker(this);
        }
    }, {
        key: 'createHotspot',
        value: function createHotspot(region) {
            return new Hotspot(region, this);
        }
    }, {
        key: 'onTopic',
        value: function onTopic(topic, handler) {
            var _this = this;

            this.pconn.then(function (conn) {
                return conn.createChannel();
            }).then(function (ch) {
                return ch.assertQueue('', { exclusive: true }).then(function (q) {
                    return ch.bindQueue(q.queue, _this.config.rabbitMQ.exchange, topic).then(function () {
                        return ch.consume(q.queue, function (msg) {
                            return handler(msg);
                        }, { noAck: true });
                    }, console.error);
                });
            });
        }
    }, {
        key: 'publishTopic',
        value: function publishTopic(topic, msg) {
            var _this2 = this;

            this.ppubch.then(function (ch) {
                return ch.publish(_this2.config.rabbitMQ.exchange, topic, new Buffer(msg));
            });
        }
    }]);

    return CELIO;
}();
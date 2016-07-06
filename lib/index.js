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

module.exports = function () {
    function CELIO() {
        _classCallCheck(this, CELIO);

        var configFile = path.join(process.cwd(), 'cog.json');
        nconf.argv().file({ file: configFile }).env();

        if (nconf.get('mq')) {
            nconf.required(['mq:url', 'mq:exchange', 'mq:username', 'mq:password']);
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

            this.ppubch = this.pconn.then(function (conn) {
                return conn.createChannel();
            });
        }

        this.display = nconf.get('display');
        this.config = nconf;
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
        key: 'createHotspot',
        value: function createHotspot(region) {
            if (this.pconn) return new Hotspot(region, this);else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'onTopic',
        value: function onTopic(topic, handler) {
            var _this = this;

            if (this.pconn) this.pconn.then(function (conn) {
                return conn.createChannel();
            }).then(function (ch) {
                return ch.assertQueue('', { exclusive: true }).then(function (q) {
                    return ch.bindQueue(q.queue, _this.exchange, topic).then(function () {
                        return ch.consume(q.queue, function (msg) {
                            return handler(msg);
                        }, { noAck: true });
                    });
                });
            });else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'publishTopic',
        value: function publishTopic(topic, msg, options) {
            var _this2 = this;

            if (this.pconn) this.ppubch.then(function (ch) {
                return ch.publish(_this2.exchange, topic, Buffer.isBuffer(msg) ? msg : new Buffer(msg), options);
            });else throw new Error('Message exchange not configured.');
        }
    }]);

    return CELIO;
}();
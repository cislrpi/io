'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Stomp = require('stompjs/lib/stomp').Stomp;
var Transcript = require('./components/transcript');
var Hotspot = require('./components/hotspot');
var Speaker = require('./components/speaker');
var Display = require('./components/display');

module.exports = function () {
    function CELIO(mq) {
        _classCallCheck(this, CELIO);

        var client = Stomp.over(new WebSocket('ws://' + mq.url + ':15674/ws'));
        this.pconn = new Promise(function (resolve, reject) {
            client.connect(mq.username, mq.password, function () {
                return resolve(client);
            }, reject);
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
        key: 'onTopic',
        value: function onTopic(topic, handler) {
            var _this = this;

            if (this.pconn) {
                this.pconn.then(function (client) {
                    return client.subscribe('/exchange/' + _this.config.exchange + '/' + topic, function (msg) {
                        handler(msg.body, msg.headers);
                    });
                });
            } else throw new Error('Message exchange not configured.');
        }
    }, {
        key: 'publishTopic',
        value: function publishTopic(topic, msg, options) {
            var _this2 = this;

            if (this.pconn) this.pconn.then(function (client) {
                return client.send('/exchange/' + _this2.config.exchange + '/' + topic, options, msg);
            });else throw new Error('Message exchange not configured.');
        }
    }]);

    return CELIO;
}();
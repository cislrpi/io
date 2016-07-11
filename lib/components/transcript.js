'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var uuid = require('uuid');

module.exports = function () {
    function Transcript(io) {
        _classCallCheck(this, Transcript);

        this.io = io;
    }

    _createClass(Transcript, [{
        key: '_on',
        value: function _on(topic, handler) {
            this.io.onTopic(topic, function (msg) {
                return handler(JSON.parse(msg.content.toString()), msg.fields, msg.properties);
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
            this.io.publishTopic('switch-model.stt.command', JSON.stringify({ model: model }));
        }
    }, {
        key: 'onSwitchModel',
        value: function onSwitchModel(handler) {
            this.io.onTopic('switch-model.stt.command', function (msg) {
                return handler(JSON.parse(msg.content.toString()));
            });
        }
    }, {
        key: 'publish',
        value: function publish(source, isFinal, msg) {
            var topic = isFinal ? 'final' : 'interim';
            if (!msg.time_captured) {
                msg.time_captured = new Date().getTime();
            }
            msg.messageId = uuid.v1();
            this.io.publishTopic(source + '.' + topic + '.transcript', JSON.stringify(msg));
        }
    }]);

    return Transcript;
}();
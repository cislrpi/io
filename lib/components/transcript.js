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
            this.io.onTopic(topic, function (msg, headers) {
                return handler(JSON.parse(msg.toString()), headers);
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
            this.io.publishTopic('switch-model.stt.command', model);
        }
    }, {
        key: 'tagChannel',
        value: function tagChannel(workerID, channelIndex, name) {
            this.io.call(workerID, JSON.stringify({ command: 'tag-channel', channelIndex: channelIndex, name: name }));
        }
    }, {
        key: 'addKeywords',
        value: function addKeywords(words) {
            this.io.publishTopic('add-keywords.stt.command', JSON.stringify(words));
        }
    }, {
        key: 'stopPublishing',
        value: function stopPublishing() {
            this.io.publishTopic('stop-publishing.stt.command', '');
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
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var amqp = require('amqplib');

module.exports = function () {
    function Speaker(io) {
        _classCallCheck(this, Speaker);

        this.io = io;
    }

    _createClass(Speaker, [{
        key: "speak",
        value: function speak(text, voice) {
            var msg = {
                "command": "speak",
                "params": {
                    "voice": voice,
                    "text": text
                }
            };
            this.io.publishTopic('text.speaker.command', new Buffer(JSON.stringify(msg)));
        }
    }, {
        key: "onText",
        value: function onText(handler) {
            this.io.onTopic('text.speaker.command', function (msg) {
                return handler(JSON.parse(msg.content.toString()).params);
            });
        }
    }]);

    return Speaker;
}();
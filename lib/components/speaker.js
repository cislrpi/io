"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
    function Speaker(io) {
        _classCallCheck(this, Speaker);

        this.io = io;
    }

    _createClass(Speaker, [{
        key: "speak",
        value: function speak(text, voice) {
            var msg = {
                "voice": voice,
                "text": text
            };
            this.io.publishTopic('text.speaker.command', new Buffer(JSON.stringify(msg)));
        }
    }, {
        key: "stop",
        value: function stop() {
            this.io.publishTopic('stop.speaker.command', new Buffer(''));
        }
    }, {
        key: "onSpeak",
        value: function onSpeak(handler) {
            this.io.onTopic('text.speaker.command', function (msg) {
                return handler(JSON.parse(msg.content.toString()));
            });
        }
    }, {
        key: "onStop",
        value: function onStop(handler) {
            this.io.onTopic('stop.speaker.command', function () {
                return handler();
            });
        }
    }]);

    return Speaker;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

module.exports = function () {
    function Speaker(io) {
        _classCallCheck(this, Speaker);

        this.io = io;
        this.expiration = 5000;
    }

    _createClass(Speaker, [{
        key: 'speak',
        value: function speak(text, options) {
            if (!options) {
                options = {};
            }
            options.text = text;
            return this.io.call('text.speaker.command', JSON.stringify(options), { expiration: this.expiration });
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.io.call('stop.speaker.command', '');
        }
    }, {
        key: 'beginSpeak',
        value: function beginSpeak(msg) {
            this.io.publishTopic('begin.speak', JSON.stringify(msg));
        }
    }, {
        key: 'endSpeak',
        value: function endSpeak() {
            this.io.publishTopic('end.speak', '');
        }
    }, {
        key: 'onBeginSpeak',
        value: function onBeginSpeak(handler) {
            this.io.onTopic('begin.speak', function (msg) {
                handler(JSON.parse(msg.toString()));
            });
        }
    }, {
        key: 'onEndSpeak',
        value: function onEndSpeak(handler) {
            this.io.onTopic('end.speak', function () {
                return handler();
            });
        }
    }]);

    return Speaker;
}();
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var uuid = require('uuid');
var Transcript = require('./components/transcript');
var Speaker = require('./components/speaker');
var DisplayContextFactory = require('./components/displaycontextfactory');

module.exports = function () {
    function CELIOAbstract() {
        _classCallCheck(this, CELIOAbstract);

        if (new.target === CELIOAbstract) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }

        this.speaker = new Speaker(this);
        this.transcript = new Transcript(this);
        this.displayContext = new DisplayContextFactory(this);
    }

    _createClass(CELIOAbstract, [{
        key: 'generateUUID',
        value: function generateUUID() {
            return uuid.v1();
        }
    }, {
        key: 'getTranscript',
        value: function getTranscript() {
            return this.transcript;
        }
    }, {
        key: 'getSpeaker',
        value: function getSpeaker() {
            return this.speaker;
        }
    }]);

    return CELIOAbstract;
}();
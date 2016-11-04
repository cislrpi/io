const uuid = require('uuid');
const Transcript = require('./components/transcript');
const Speaker = require('./components/speaker');
const DisplayContextFactory = require('./components/displaycontextfactory');

module.exports = class CELIOAbstract {
    constructor() {
        if (new.target === CELIOAbstract) {
            throw new TypeError('Cannot construct Abstract instances directly');
        }

        this.speaker = new Speaker(this);
        this.transcript = new Transcript(this);
        this.displayContext = new DisplayContextFactory(this);
    }

    generateUUID() {
        return uuid.v1();
    }

    getTranscript() {
        return this.transcript;
    }

    getSpeaker() {
        return this.speaker;
    }
}
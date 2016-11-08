const uuid = require('uuid')
const Transcript = require('./components/transcript')
const Speaker = require('./components/speaker')
const DisplayContextFactory = require('./components/displaycontextfactory')

module.exports = class CELIOAbstract {
    constructor() {
        if (new.target === CELIOAbstract) {
            throw new TypeError('Cannot construct Abstract instances directly')
        }

        this.speaker = new Speaker(this)
        this.transcript = new Transcript(this)
        this.displayContext = new DisplayContextFactory(this)
    }

    generateUUID() {
        return uuid.v1()
    }

    getTranscript() {
        console.warn('getTranscript is deprecated. Use io.transcript instead.')
        return this.transcript
    }

    getSpeaker() {
        console.warn('getSpeaker is deprecated. Use io.speaker instead.')
        return this.speaker
    }
}
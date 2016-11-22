const uuid = require('uuid')
const Transcript = require('./components/transcript')
const Speaker = require('./components/speaker')
const DisplayContextFactory = require('./components/displaycontextfactory')

module.exports = class CELIOAbstract {
    constructor() {
        this.speaker = new Speaker(this)
        this.transcript = new Transcript(this)
        this.displayContext = new DisplayContextFactory(this)
        this.rabbitManager = null
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

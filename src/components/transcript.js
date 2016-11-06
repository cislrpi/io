module.exports = class Transcript {
    constructor(io) {
        this.io = io
    }

    _on(topic, handler) {
        this.io.onTopic(topic, (msg, headers) =>
            handler(JSON.parse(msg.toString()), headers))
    }

    onAll(handler) {
        this._on('*.*.transcript', handler)
    }

    onFinal(handler) {
        this._on('*.final.transcript', handler)
    }

    onInterim(handler) {
        this._on('*.interim.transcript', handler)
    }

    switchModel(model) {
        this.io.publishTopic('switchModel.transcript.command', model)
    }

    tagChannel(workerID, channelIndex, name) {
        this.io.call(`rpc-transcript-${workerID}-tagChannel`, JSON.stringify({ channelIndex, name }))
    }

    addKeywords(words) {
        // this.io.store.addToSet('transcript:keywords', )
        this.io.publishTopic('addKeywords.transcript.command', JSON.stringify(words))
    }

    stopPublishing() {
        this.io.publishTopic('stopPublishing.transcript.command', '')
    }

    publish(source, isFinal, msg) {
        const topic = isFinal ? 'final' : 'interim'
        if (!msg.time_captured) {
            msg.time_captured = new Date().getTime()
        }
        msg.messageID = this.io.generateUUID()
        this.io.publishTopic(`${source}.${topic}.transcript`, JSON.stringify(msg))
    }
}

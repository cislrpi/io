const maxSpeakDuration = 1000 * 60 * 2 // 2 minutes

module.exports = class Speaker {
    constructor(io) {
        this.io = io
    }

    speak(text, options) {
        if (!options) {
            options = {}
        }
        options.text = text
        return this.io.call('rpc-speaker-speakText', JSON.stringify(options), { expiration: maxSpeakDuration })
    }

    increaseVolume(change = 10) {
        return this.io.call('rpc-speaker-changeVolume', JSON.stringify({ change }))
    }

    reduceVolume(change = 10) {
        return this.io.call('rpc-speaker-changeVolume', JSON.stringify({ change: -change }))
    }

    stop() {
        return this.io.call('rpc-speaker-stop', '')
    }

    beginSpeak(msg) {
        this.io.publishTopic('begin.speak', JSON.stringify(msg))
    }

    endSpeak(msg) {
        this.io.publishTopic('end.speak', JSON.stringify(msg))
    }

    onBeginSpeak(handler) {
        this.io.onTopic('begin.speak', msg => handler(JSON.parse(msg.toString())))
    }

    onEndSpeak(handler) {
        this.io.onTopic('end.speak', msg => handler(JSON.parse(msg.toString())))
    }
}

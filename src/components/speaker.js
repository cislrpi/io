module.exports = class Speaker {
    constructor(io) {
        this.io = io
        this.expiration = 5000
    }

    speak(text, options) {
        if (!options) {
            options = {}
        }
        options.text = text
        return this.io.call('rpc-speaker-speakText', JSON.stringify(options), { expiration: this.expiration })
    }

    increaseVolume(change = 10) {
        return this.io.call('rpc-speaker-changeVolume', JSON.stringify({ change }), { expiration: this.expiration })
    }

    reduceVolume(change = 10) {
        return this.io.call('rpc-speaker-changeVolume', JSON.stringify({ change: -change }), { expiration: this.expiration })
    }

    stop() {
        this.io.call('rpc-speaker-stop', '')
    }

    beginSpeak(msg) {
        this.io.publishTopic('begin.speak', JSON.stringify(msg))
    }

    endSpeak() {
        this.io.publishTopic('end.speak', '')
    }

    onBeginSpeak(handler) {
        this.io.onTopic('begin.speak', msg => {
            handler(JSON.parse(msg.toString()))
        })
    }

    onEndSpeak(handler) {
        this.io.onTopic('end.speak', () => handler())
    }
}

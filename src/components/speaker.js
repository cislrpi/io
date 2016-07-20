module.exports = class Speaker {
    constructor(io) {
        this.io = io;
    }

    // TODO: add location
    speak(text, options) {
        if (!options) {
            options = {};
        }
        options.text = text;
        return this.io.call('text.speaker.command', JSON.stringify(options), 2000);
    }

    onSpeak(handler, noAck) {
        this.io.serve('text.speaker.command',
            (msg, _, __, ackFunc) => handler(JSON.parse(msg.toString()), ackFunc), noAck);
    }

    stop() {
        this.io.publishTopic('stop.speaker.command', '');
    }

    onStop(handler) {
        this.io.onTopic('stop.speaker.command', ()=>handler());
    }

    beginSpeak() {
        this.io.publishTopic('begin.speak', '');
    }

    endSpeak() {
        this.io.publishTopic('end.speak', '');
    }

    onBeginSpeak(handler) {
        this.io.onTopic('begin.speak', ()=>handler());
    }

    onEndSpeak(handler) {
        this.io.onTopic('end.speak', ()=>handler());
    }
};
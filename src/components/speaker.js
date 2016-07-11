module.exports = class Speaker {
    constructor(io) {
        this.io = io;
    }

    // TODO: add location
    speak(text, options) {
        options.text = text;
        this.io.publishTopic('text.speaker.command', JSON.stringify(options));
    }

    stop() {
        this.io.publishTopic('stop.speaker.command', '');
    }

    onSpeak(handler) {
        this.io.onTopic('text.speaker.command',
            msg=>handler(JSON.parse(msg.content.toString())));
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
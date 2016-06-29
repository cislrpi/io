module.exports = class Speaker {
    constructor(io) {
        this.io = io;
    }

    speak(text, voice) {
        const msg = {
            "voice": voice,
            "text": text
        }
        this.io.publishTopic('text.speaker.command', new Buffer(JSON.stringify(msg)));
    }

    stop() {
        this.io.publishTopic('stop.speaker.command', new Buffer(''));
    }

    onSpeak(handler) {
        this.io.onTopic('text.speaker.command',
            msg=>handler(JSON.parse(msg.content.toString())));
    }

    onStop(handler) {
        this.io.onTopic('stop.speaker.command', ()=>handler());
    }
};
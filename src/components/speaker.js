module.exports = class Speaker {
    constructor(io) {
        this.io = io;
        this.expiration = 5000;
    }

    speak(text, options) {
        if (!options) {
            options = {};
        }
        options.text = text;
        return this.io.call('text.speaker.command', JSON.stringify(options), {expiration: this.expiration});
    }

    stop() {
        this.io.call('stop.speaker.command', '');
    }

    beginSpeak(msg) {
        this.io.publishTopic('begin.speak', JSON.stringify(msg));
    }

    endSpeak() {
        this.io.publishTopic('end.speak', '');
    }

    onBeginSpeak(handler) {
        this.io.onTopic('begin.speak', msg=>{
            handler(JSON.parse(msg.toString()));
        });
    }

    onEndSpeak(handler) {
        this.io.onTopic('end.speak', ()=>handler());
    }
};
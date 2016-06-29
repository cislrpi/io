const amqp = require('amqplib');

module.exports = class Speaker {
    constructor(io) {
        this.io = io;
    }

    speak(text, voice) {
        const msg = {
            "command": "speak",
            "params": {
                "voice": voice,
                "text": text
            }
        };
        this.io.publishTopic('text.speaker.command', new Buffer(JSON.stringify(msg)));
    }

    onText(handler) {
        this.io.onTopic('text.speaker.command',
            msg=>handler(JSON.parse(msg.content.toString()).params));
    }
};
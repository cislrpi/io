const uuid = require('uuid');

module.exports = class Transcript {
    constructor(io) {
        this.io = io;
    }

    _on(topic, handler) {
        this.io.onTopic(topic, (msg, headers)=>
            handler(JSON.parse(msg.toString()), headers));
    }

    onAll(handler) {
        this._on('*.*.transcript', handler);
    }

    onFinal(handler) {
        this._on('*.final.transcript', handler);
    }

    onInterim(handler) {
        this._on('*.interim.transcript', handler);
    }

    switchModel(model) {
        this.io.publishTopic('switch-model.stt.command', model);
    }

    addKeywords(words) {
        this.io.publishTopic('add-keywords.stt.command', JSON.stringify(words));
    }

    stopPublishing() {
        this.io.publishTopic('stop-publishing.stt.command', '');
    }

    publish(source, isFinal, msg) {
        const topic = isFinal ? 'final' : 'interim';
        if (!msg.time_captured) {
            msg.time_captured = new Date().getTime();
        }
        msg.messageId = uuid.v1();
        this.io.publishTopic(`${source}.${topic}.transcript`, JSON.stringify(msg));
    }
};
const amqp = require('amqplib');

module.exports = class Transcript {
    constructor(io) {
        this.io = io;
    }

    _on(topic, handler) {
        this.io.onTopic(topic, msg=>handler(JSON.parse(msg.content.toString())));
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
        this.io.publishTopic('switch-model.stt.command', new Buffer(JSON.stringify({model:model})));
    }

    publish(source, isFinal, msg) {
        const topic = isFinal ? 'final' : 'interim';
        this.io.publishTopic(`${source}.${topic}.transcript`, new Buffer(JSON.stringify(msg)));
    }
}
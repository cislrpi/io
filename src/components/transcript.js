const amqp = require('amqplib');

module.exports = class Transcript {
    constructor(pconn, exchange) {
        this.pch = pconn.then((conn) => conn.createChannel())
        this.exchange = exchange;
    }

    _on(topic, handler) {
        const ex = this.exchange;
        this.pch.then((ch) => ch.assertQueue('', {exclusive: true}).then(
            q => ch.bindQueue(q.queue, ex, topic).then(
                () => ch.consume(q.queue, msg => handler(JSON.parse(msg.content.toString())), {noAck: true})
            )));
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
        this.pch.then((ch)=>ch.publish(this.exchange, 'stt.command',
            new Buffer(JSON.stringify({command: 'switch-model', model:model}))));
    }

    publish(source, isFinal, msg) {
        const topic = isFinal ? 'final' : 'interim';
        this.pch.then((ch)=>ch.publish(this.exchange, `${source}.${topic}.transcript`,
            new Buffer(JSON.stringify(msg))));
    }
}
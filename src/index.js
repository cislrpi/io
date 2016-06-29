const path = require('path');
const fs = require('fs');
const amqp = require('amqplib');
const Transcript = require('./components/transcript');
const Hotspot = require('./components/hotspot');

module.exports = class CELIO {
    constructor() {
        const configFile = path.join(process.cwd(), 'cog.json');
        this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

        this.pconn = amqp.connect(this.config.rabbitMQ.url);
        this.ppubch = this.pconn.then((conn) => conn.createChannel());
    }

    getTranscript() {
        return new Transcript(this.pconn, this.config.rabbitMQ.exchange);
    }

    defineHotspot(region) {
        return new Hotspot(region, this.pconn, this.config.rabbitMQ.exchange);
    }

    onCommands(command, handler) {
        this.onTopic(`${command}.command`, handler);
    }

    onTopic(topic, handler) {
        this.pconn.then((conn) => conn.createChannel())
            .then(ch => ch.assertQueue('', {exclusive: true})
                .then(q => ch.bindQueue(q.queue, this.config.rabbitMQ.exchange, topic)
                    .then(() => ch.consume(q.queue, msg => handler(msg), {noAck: true}),
                                console.error)));
    }

    publishTopic(topic, msg) {
        this.ppubch.then(ch => ch.publish(this.config.rabbitMQ.exchange, topic, msg));
    }
}
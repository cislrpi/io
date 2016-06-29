const path = require('path');
const fs = require('fs');
const amqp = require('amqplib');
const Transcript = require('./components/transcript');

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

    onCommands(command, handler) {
        this.onTopic(`${command}.command`, handler);
    }

    onTopic(topic, handler) {
        const ex = this.config.rabbitMQ.exchange;
        this.pconn.then((conn) => conn.createChannel())
            .then(ch => ch.assertQueue('', {exclusive: true})
                .then(q => ch.bindQueue(q.queue, ex, topic)
                    .then(() => ch.consume(q.queue, msg => 
                        handler(JSON.parse(msg.content.toString())), {noAck: true}), console.error)));
    }

    publishTopic(topic, msg) {
        const ex = this.exchange;
        if (typeof msg === 'object') {
            msg = JSON.stringify(msg);
        }
        this.ppubch.then(ch => ch.publish(ex, topic, new Buffer(msg)));
    }
}
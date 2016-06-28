const path = require('path');
const fs = require('fs');
const amqp = require('amqplib');
const Transcript = require('./components/transcript');

module.exports = class CELIO {
    constructor() {
        const configFile = path.join(process.cwd(), 'cog.json');
        this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));

        this.pconn = amqp.connect(this.config.rabbitMQ.url);
    }

    getTranscript() {
        return new Transcript(this.pconn, this.config.rabbitMQ.exchange);
    }

    onTopic(topic, handler) {
        const ex = this.config.rabbitMQ.exchange;
        this.pconn.then((conn) => conn.createChannel())
            .then(ch => ch.assertQueue('', {exclusive: true})
                .then(q => ch.bindQueue(q.queue, ex, topic)
                    .then(() => ch.consume(q.queue, msg => 
                        handler(JSON.parse(msg.content.toString())), {noAck: true}))));
    }

    onCommands(command, handler) {
        const ex = this.config.rabbitMQ.exchange;
        this.pconn.then((conn) => conn.createChannel())
            .then(ch => ch.assertQueue('', {exclusive: true})
                .then(q => ch.bindQueue(q.queue, ex, `${command}.command`)
                    .then(() => ch.consume(q.queue, msg => 
                        handler(JSON.parse(msg.content.toString())), {noAck: true}))));
    }
}
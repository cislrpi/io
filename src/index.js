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
}
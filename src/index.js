const path = require('path');
const fs = require('fs');
const nconf = require('nconf');
const amqp = require('amqplib');
const Transcript = require('./components/transcript');
const Hotspot = require('./components/hotspot');
const Speaker = require('./components/speaker');

module.exports = class CELIO {
    constructor() {
        const configFile = path.join(process.cwd(), 'cog.json');
        nconf.argv().file({file: configFile}).env();

        if (nconf.get('mq')) {
            nconf.required(['mq:url', 'mq:exchange', 'mq:username', 'mq:password' ]);
            this.exchange = nconf.get('mq:exchange');

            const ca = nconf.get('mq:ca');
            const auth = nconf.get('mq:username') + ':' + nconf.get('mq:password') + "@"; 

            if (ca) {
                this.pconn = amqp.connect(`amqps://${auth}${nconf.get('mq:url')}`, {
                    ca: [fs.readFileSync(ca)]
                });
            } else {
                this.pconn = amqp.connect(`amqp://${auth}${nconf.get('mq:url')}`);
            }
            
            this.ppubch = this.pconn.then((conn) => conn.createChannel());
        }

        this.display = nconf.get('display');
        this.config = nconf;
    }

    getTranscript() {
        if(this.pconn)
            return new Transcript(this);
        else
            throw new Error('Message exchange not configured.');
    }

    getSpeaker() {
        if(this.pconn)
            return new Speaker(this);
        else
            throw new Error('Message exchange not configured.');
    }

    createHotspot(region) {
        if(this.pconn)
            return new Hotspot(region, this);
        else
            throw new Error('Message exchange not configured.');
    }

    onTopic(topic, handler) {
        if(this.pconn)
            this.pconn.then((conn) => conn.createChannel())
                .then(ch => ch.assertQueue('', {exclusive: true})
                    .then(q => ch.bindQueue(q.queue, this.exchange, topic)
                        .then(() => ch.consume(q.queue, msg => handler(msg), {noAck: true}))));
        else
            throw new Error('Message exchange not configured.');
    }

    publishTopic(topic, msg, options) {
        if(this.pconn)
            this.ppubch.then(ch => ch.publish(this.exchange, topic, Buffer.isBuffer(msg) ? msg : new Buffer(msg), options));
        else
            throw new Error('Message exchange not configured.');
    }
};
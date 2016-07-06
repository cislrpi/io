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

        nconf.required(['mq:url', 'mq:exchange', 'mq:username', 'mq:password']);
        this.exchange = nconf.get('mq:exchange');

        const ca = nconf.get('mq:ca');
        const username = nconf.get('mq:username');

        const auth = (typeof username !== 'undefined') ? (username + ':' + nconf.get('mq:password')) + "@" : (''); 

        if (ca) {
            this.pconn = amqp.connect(`amqps://${auth}${nconf.get('mq:url')}`, {
                ca: [fs.readFileSync(ca)]
            });
        } else {
            this.pconn = amqp.connect(`amqp://${auth}${nconf.get('mq:url')}`);
        }
        
        this.ppubch = this.pconn.then((conn) => conn.createChannel());
        this.config = nconf;
    }

    getTranscript() {
        return new Transcript(this);
    }

    getSpeaker() {
        return new Speaker(this);
    }

    createHotspot(region) {
        return new Hotspot(region, this);
    }

    onTopic(topic, handler) {
        this.pconn.then((conn) => conn.createChannel())
            .then(ch => ch.assertQueue('', {exclusive: true})
                .then(q => ch.bindQueue(q.queue, this.exchange, topic)
                    .then(() => ch.consume(q.queue, msg => handler(msg), {noAck: true}))));
    }

    publishTopic(topic, msg) {
        this.ppubch.then(ch => ch.publish(this.exchange, topic, Buffer.isBuffer(msg) ? msg : new Buffer(msg)));
    }
};
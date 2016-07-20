const path = require('path');
const fs = require('fs');
const nconf = require('nconf');
const amqp = require('amqplib');
const Transcript = require('./components/transcript');
const Hotspot = require('./components/hotspot');
const Speaker = require('./components/speaker');
const Display = require('./components/display');
const uuid = require('uuid'); 

module.exports = class CELIO {
    constructor() {
        const configFile = path.join(process.cwd(), 'cog.json');
        nconf.argv().file({file: configFile}).env('_');

        if (nconf.get('mq')) {
            nconf.required(['mq:url', 'mq:exchange', 'mq:username', 'mq:password' ]);
            this.exchange = nconf.get('mq:exchange');

            this.ca = nconf.get('mq:ca');
            this.auth = nconf.get('mq:username') + ':' + nconf.get('mq:password') + "@"; 

            // Make a shared channel for publishing and subscribe            
            this.pch = this._connectBroker().then(conn => conn.createChannel());
        }

        this.display = nconf.get('display');
        this.config = nconf;
    }

    _connectBroker() {
        if (this.ca) {
            return amqp.connect(`amqps://${this.auth}${nconf.get('mq:url')}`, {
                ca: [fs.readFileSync(this.ca)]
            });
        } else {
            return amqp.connect(`amqp://${this.auth}${nconf.get('mq:url')}`);
        }
    }

    getTranscript() {
        if(this.pch)
            return new Transcript(this);
        else
            throw new Error('Message exchange not configured.');
    }

    getSpeaker() {
        if(this.pch)
            return new Speaker(this);
        else
            throw new Error('Message exchange not configured.');
    }

    getDisplay(){
        if(this.display)
            return new Display(this);
        else   
            throw new Error('Display worker not configured.');
    }

    createHotspot(region) {
        if(this.pch)
            return new Hotspot(region, this);
        else
            throw new Error('Message exchange not configured.');
    }

    call(queue, content, timeout) {
        if (this.pch) {
            return new Promise((resolve, reject) => {
                this._connectBroker().then(conn => conn.createChannel()
                    .then(ch => ch.assertQueue('', {exclusive: true})
                        .then(q => {
                            const correlationId = uuid.v1();
                            ch.consume(q.queue, msg => {
                                if (msg.properties.correlationId === correlationId) {
                                    resolve(msg.content, msg.fields, msg.properties);
                                    conn.close();
                                };
                            }, {noAck: true});
                            ch.sendToQueue(queue, Buffer.isBuffer(content) ? content : new Buffer(content),
                                {correlationId, replyTo: q.queue});
                            
                            // Set time out
                            if (typeof timeout === 'number') {
                                setTimeout(()=>{
                                    reject(new Error(`Request timed out after ${timeout} ms.`));
                                    conn.close();
                                }, timeout);
                            }
                })));
            });
        }
        else
            throw new Error('Message exchange not configured.');
    }

    // when noAck is false, the handler should acknowledge the message using the provided function;
    serve(queue, handler, noAck) {
        if (this.pch)
            this.pch.then(ch => {
                if (typeof noAck === 'undefined') noAck = true;
                ch.prefetch(1);
                return ch.assertQueue(queue, {durable: false}).then(q => ch.consume(q.queue, msg => {
                    const result = handler(msg.content, msg.fields, msg.properties, function ack() {ch.ack(msg);});

                    if (result) {
                        ch.sendToQueue(msg.properties.replyTo, Buffer.isBuffer(result) ? result : new Buffer(result),
                            {correlationId: msg.properties.correlationId});
                    }
                }, {noAck}));
            });
        else
            throw new Error('Message exchange not configured.');
    }

    onTopic(topic, handler) {
        if (this.pch)
            this.pch.then(ch => ch.assertQueue('', {exclusive: true})
                .then(q => ch.bindQueue(q.queue, this.exchange, topic)
                    .then(() => ch.consume(q.queue, msg => 
                        handler(msg.content, msg.fields, msg.properties), {noAck: true}))));
        else
            throw new Error('Message exchange not configured.');
    }

    publishTopic(topic, content, options) {
        if(this.pch)
            this.pch.then(ch => ch.publish(this.exchange, topic, 
                Buffer.isBuffer(content) ? content : new Buffer(content), options));
        else
            throw new Error('Message exchange not configured.');
    }
};
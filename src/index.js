const path = require('path');
const fs = require('fs');
const nconf = require('nconf');
const amqp = require('amqplib');
const Transcript = require('./components/transcript');
const Hotspot = require('./components/hotspot');
const Speaker = require('./components/speaker');
const Display = require('./components/display');
const uuid = require('uuid');
const _ = require('lodash');

module.exports = class CELIO {
    constructor() {
        const configFile = path.join(process.cwd(), 'cog.json');
        nconf.argv().file({file: configFile}).env('_');

        if (nconf.get('mq')) {
            nconf.required(['mq:url', 'mq:username', 'mq:password']);
            nconf.defaults({'mq:exchange': 'amq.topic'});
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

            // Make a shared channel for publishing and subscribe            
            this.pch = this.pconn.then(conn => conn.createChannel());
        }

        this.display = nconf.get('display');
        this.config = nconf;
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

    call(queue, content, options) {
        if (this.pch) {
            return new Promise((resolve, reject) => {
                this.pconn.then(conn => conn.createChannel()
                    .then(ch => ch.assertQueue('', {exclusive: true})
                        .then(q => {
                            options.correlationId = uuid.v1();
                            options.replyTo = q.queue;
                            if (!options.expiration) {
                                options.expiration = 3000; // default to 3 sec;
                            }
                            let timeoutID;
                            // Time out the response when the caller has been waiting for too long
                            if (typeof options.expiration === 'number') {
                                timeoutID = setTimeout(()=>{
                                    reject(new Error(`Request timed out after ${options.expiration} ms.`));
                                    ch.close();
                                }, options.expiration+500);
                            }

                            ch.consume(q.queue, msg => {
                                if (msg.properties.correlationId === options.correlationId) {
                                    resolve(msg.content, _.merge(msg.fields, msg.properties));
                                    clearTimeout(timeoutID);
                                    ch.close();
                                };
                            }, {noAck: true});
                            ch.sendToQueue(queue, Buffer.isBuffer(content) ? content : new Buffer(content), options);
                }))).catch(reject);
            });
        }
        else
            throw new Error('Message exchange not configured.');
    }

    // when noAck is false, the handler should acknowledge the message using the provided function;
    doCall(queue, handler, noAck=true, exclusive=true) {
        if (this.pch)
            this.pch.then(ch => {
                ch.prefetch(1);
                ch.assertQueue(queue, {exclusive}).then(q => ch.consume(q.queue, msg => {
                    let result = handler(msg.content, _.merge(msg.fields, msg.properties),
                        function ack() {ch.ack(msg);});
                    
                    // If there is no return, we still send something back so that 
                    // the caller knows it's executed and it won't time out.
                    if (!result) {
                        result = '';
                    }
                    
                    ch.sendToQueue(msg.properties.replyTo, Buffer.isBuffer(result) ? result : new Buffer(result),
                            {correlationId: msg.properties.correlationId});
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
                        handler(msg.content, _.merge(msg.fields, msg.properties), {noAck: true})))));
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
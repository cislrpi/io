const path = require('path');
const fs = require('fs');
const nconf = require('nconf');
const amqp = require('amqplib');
const Transcript = require('./components/transcript');
const Hotspot = require('./components/hotspot');
const Speaker = require('./components/speaker');
const DisplayContext = require('./components/displaycontext');
const Store = require('./components/store');
const uuid = require('uuid');
const _ = require('lodash');

module.exports = class CELIO {
    constructor() {
        const configFile = path.join(process.cwd(), 'cog.json');
        nconf.argv().file({file: configFile}).env('_');

        nconf.required([ 'mq:url', 'mq:username', 'mq:password', 'store:url' ]);
        nconf.defaults({'mq':{'exchange': 'amq.topic'}});
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
        this.store = new Store ( nconf.get("store") )
        this.config = nconf;
    }

    generateUUID() {
        return uuid.v4();
    }

    getTranscript() {
        return new Transcript(this);
    }

    getSpeaker() {
        return new Speaker(this);
    }

    createDisplayContext(ur_app_name, options){
        return new DisplayContext(ur_app_name, options, this)
    }

    getDisplayContextList(){
        return this.getStore().getSet("displayContexts")
    }

    getActiveDisplayContext(){
        return this.getStore().getState("activeDisplayContext").then( m => {
            return new DisplayContext(m, {}, this)
        })
    }

    setActiveDisplayContext( appname , reset){
        console.log("requested app name : ", appname)
        this.getStore().getState("activeDisplayContext").then( name => {
            console.log("app name in store : ", name)
            if(name != appname){
                this.getStore().setState("activeDisplayContext", appname)
                new DisplayContext(appname, {reset : reset}, this)
            }else{
                console.log("app name : ",  appname, "is already active")
            }
        })
        
    }

    hideAllDisplayContext(){
        let screens = {}
        let cmd = {
            command : 'hide-all-windows'
        }
        this.getActiveDisplays().then( m => {
            let _ps = []
            for( let k of Object.keys(m)){
                _ps.push( this.call('display-rpc-queue-' + k, JSON.stringify(cmd) ) )
            }
            return Promise.all(_ps)
        }).then( m =>{
            return m
        })
    }

    getActiveDisplays(){
        return this.getStore().getHash("display.screens")
    }

    getStore(){
        return this.store
    }

    createHotspot(region, excludeEventsOutsideRegion=true) {
        return new Hotspot(this, region, excludeEventsOutsideRegion);
    }

    call(queue, content, options={}) {
        return new Promise((resolve, reject) => {
            this.pconn.then(conn => conn.createChannel()
                .then(ch => ch.assertQueue('', {exclusive: true})
                    .then(q => {
                        options.correlationId = uuid.v4();
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
                                if (msg.properties.headers.error) {
                                    reject(new Error(msg.properties.headers.error));
                                } else {
                                    resolve(msg.content, _.merge(msg.fields, msg.properties));
                                }
                                
                                clearTimeout(timeoutID);
                                ch.close();
                            };
                        }, {noAck: true});
                        ch.sendToQueue(queue, Buffer.isBuffer(content) ? content : new Buffer(content), options);
            }))).catch(reject);
        });
    }

    // when noAck is false, the handler should acknowledge the message using the provided function;
    doCall(queue, handler, noAck=true, exclusive=true) {
        this.pch.then(ch => {
            ch.prefetch(1);
            ch.assertQueue(queue, {exclusive}).then(q => ch.consume(q.queue, request => {
                let replyCount = 0;
                function reply(response) {
                    if (replyCount >= 1) {
                        throw new Error('Replied more than once.');
                    }
                    replyCount++;
                    if (response instanceof Error) {
                        ch.sendToQueue(request.properties.replyTo, new Buffer(''),
                            {correlationId: request.properties.correlationId, headers: {error: response.message}});
                    } else {
                        ch.sendToQueue(request.properties.replyTo, Buffer.isBuffer(response) ? response : new Buffer(response),
                            {correlationId: request.properties.correlationId});
                    }
                }

                handler({content: request.content, headers: _.merge(request.fields, request.properties)}, reply,
                    noAck ? undefined : function ack() {ch.ack(request);});
            }, {noAck}));
        });
    }

    onTopic(topic, handler) {
        this.pch.then(ch => ch.assertQueue('', {exclusive: true})
            .then(q => ch.bindQueue(q.queue, this.exchange, topic)
                .then(() => ch.consume(q.queue, msg => 
                    handler(msg.content, _.merge(msg.fields, msg.properties)), {noAck: true}))));
    }

    publishTopic(topic, content, options) {
        this.pch.then(ch => ch.publish(this.exchange, topic, 
                Buffer.isBuffer(content) ? content : new Buffer(content), options));
    }
    
};
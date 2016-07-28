const Stomp = require('stompjs/lib/stomp').Stomp;
const Transcript = require('./components/transcript');
const Hotspot = require('./components/hotspot');
const Speaker = require('./components/speaker');
const Display = require('./components/display');
function uuid(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid);};

module.exports = class CELIO {
    constructor(mq) {
        if (!mq.exchange) {
            mq.exchange = 'amq.topic';
        }
        this.mq = mq;
        this.brokerURL = `ws://${mq.url}:15674/ws`;
        const client = Stomp.over(new WebSocket(this.brokerURL));
        client.debug = null;
        this.pconn = new Promise(function(resolve, reject) {
            client.connect(mq.username, mq.password, ()=>resolve(client), err=>{console.error(err);reject(err);});
        });
        this.config = mq;
    }

    getTranscript() {
        if (this.pconn)
            return new Transcript(this);
        else
            throw new Error('Message exchange not configured.');
    }

    getSpeaker() {
        if (this.pconn)
            return new Speaker(this);
        else
            throw new Error('Message exchange not configured.');
    }

    getDisplay(){
        if (this.display)
            return new Display(this);
        else   
            throw new Error('Display worker not configured.');
    }

    call(queue, content, headers={}) {
        if (this.pconn) {
            return new Promise((resolve, reject) => {
                const rpcClient = Stomp.over(new WebSocket(this.brokerURL));
                rpcClient.debug = null;
                rpcClient.connect(this.mq.username, this.mq.password, ()=>{
                    headers['correlation-id'] = uuid();
                    headers['reply-to'] = '/temp-queue/result';
                    if (!headers.expiration) {
                        headers.expiration = 3000; // default to 3 sec;
                    }
                    let timeoutID;
                    // Time out the response when the caller has been waiting for too long
                    if (typeof headers.expiration === 'number') {
                        timeoutID = setTimeout(()=>{
                            rpcClient.onreceive = null;
                            reject(new Error(`Request timed out after ${headers.expiration} ms.`));
                            rpcClient.disconnect();
                        }, headers.expiration+500);
                    }

                    rpcClient.onreceive = msg => {
                        if (msg.headers['correlation-id'] === headers['correlation-id']) {
                            console.error(msg.headers);
                            if (msg.headers.error) {
                                reject(new Error(msg.headers.error));
                            } else {
                                resolve(msg.body, msg.headers);
                            }
                            
                            clearTimeout(timeoutID);
                            rpcClient.disconnect();
                        };
                    };
                    rpcClient.send(`/amq/queue/${queue}`, headers, content);
                }, reject);
            });
        }
        else
            throw new Error('Message exchange not configured.');
    }

    // Webclient should not handle RPC calls.
    // doCall(queue, handler, noAck=true) {
    // }

    onTopic(topic, handler) {
        if (this.pconn) {
            this.pconn.then(client=>client.subscribe(`/exchange/${this.config.exchange}/${topic}`, msg=>{
                handler(msg.body, msg.headers);
            }));
        }
        else
            throw new Error('Message exchange not configured.');
    }

    publishTopic(topic, content, options) {
        if (this.pconn)
            this.pconn.then(client=>client.send(`/exchange/${this.config.exchange}/${topic}`, options, content));
        else
            throw new Error('Message exchange not configured.');
    }
};
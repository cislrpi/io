const Stomp = require('stompjs/lib/stomp').Stomp;

const CELIOAbstract = require('./CELIOAbstract');
const Store = require('./components/clientstore');

module.exports = class CELIO extends CELIOAbstract {
    constructor(config) {
        super();
        if (!config.mq.exchange) {
            config.mq.exchange = 'amq.topic';
        }
        const sepPos = config.mq.url.lastIndexOf('/');
        if (sepPos > -1) {
            config.mq.vhost = config.mq.url.substring(sepPos+1);
            config.mq.url = config.mq.url.substring(0, sepPos);
        } else {
            config.mq.vhost = '/';
        }

        let protocol = 'ws';
        let port = 15674;

        if (config.mq.tls) {
            console.log('Making a secure websocket connection.');
            protocol = 'wss';
            port = 15671;
        }

        this.brokerURL = `${protocol}://${config.mq.url}:${port}/ws`;
        const client = Stomp.over(new WebSocket(this.brokerURL));
        client.debug = null;
        this.pconn = new Promise(function(resolve, reject) {
            client.connect(config.mq.username, config.mq.password, ()=>resolve(client),
                err=>{console.error(err);reject(err);}, config.mq.vhost);
        });
        this.config = config;

        // Make the store connection
        this.store = new Store(config.store);
    }

    call(queue, content, headers={}) {
        return new Promise((resolve, reject) => {
            const rpcClient = Stomp.over(new WebSocket(this.brokerURL));
            rpcClient.debug = null;
            rpcClient.connect(this.config.mq.username, this.config.mq.password, ()=>{
                headers['correlation-id'] = this.generateUUID();
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
            }, reject, this.config.mq.vhost);
        });
    }

    // Webclient should not handle RPC calls.
    // doCall(queue, handler, noAck=true) {
    // }

    onTopic(topic, handler) {
        this.pconn.then(client=>client.subscribe(`/exchange/${this.config.mq.exchange}/${topic}`, msg=>{
            handler(msg.body, msg.headers);
        }));
    }

    publishTopic(topic, content, options) {
        this.pconn.then(client=>client.send(`/exchange/${this.config.mq.exchange}/${topic}`, options, content));
    }
};
const Stomp = require('stompjs/lib/stomp').Stomp;
const Transcript = require('./components/transcript');
const Speaker = require('./components/speaker');
const DisplayContext = require('./components/displaycontext');
const Store = require('./components/clientstore');
const uuid = require('uuid');

module.exports = class CELIO {
    constructor(config) {
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
        this.store = new Store (config.store);

        // Make singleton objects
        this.transcript = new Transcript(this);
    }

    generateUUID() {
        return uuid.v4();
    }

    getTranscript() {
        return this.transcript;
    }

    getSpeaker() {
        return new Speaker(this);
    }

    getDisplay(){
        return new Display(this);
    }

    createDisplayContext(ur_app_name, options){
        let _dc = new DisplayContext(ur_app_name, this)
        return _dc.restoreFromStore(options).then( m=> {
            return _dc 
        })
    }

    getDisplayContextList(){
        return this.store.getSet("displayContexts")
    }

    getActiveDisplayContext(){
        return this.store.getState("activeDisplayContext").then( m => {
            if(m){
                let _dc = new DisplayContext(m, this)
                return _dc.restoreFromStore({}).then( m=> { return _dc })
            }else 
                return new Error("No active display context available")
        })
    }

    setActiveDisplayContext( appname , reset){
        console.log("requested app name : ", appname)
        this.store.getState("activeDisplayContext").then( name => {
            console.log("app name in store : ", name)
            if(name != appname){
                this.store.setState("activeDisplayContext", appname)
                (new DisplayContext(appname, this)).restoreFromStore({reset : reset})
            }else{
                console.log("app name : ",  appname, "is already active")
            }
        })
        
    }

    hideAllDisplayContext(){
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
        return this.store.getHash("display.displays")
    }

    getFocusedDisplayWindow(displayName="main"){
        let cmd = {
            command : 'get-focus-window'
        }
        return this.call('display-rpc-queue-' + k, JSON.stringify(cmd) ).then( m => { return JSON.parse(m.toString()) } )
    }

    getFocusedDisplayWindows(){
        let cmd = {
            command : 'get-focus-window'
        }
        return this.getActiveDisplays().then( m => {
            let _ps = []
            for( let k of Object.keys(m)){
                _ps.push( this.call('display-rpc-queue-' + k, JSON.stringify(cmd) ) )
            }
            return Promise.all(_ps)
        }).then( m =>{
            for(var i = 0; i < m.length; i++)
                m[i] = JSON.parse(m[i].toString())

            return m
        })
    }

    getStore() {
        return this.store
    }

    call(queue, content, headers={}) {
        return new Promise((resolve, reject) => {
            const rpcClient = Stomp.over(new WebSocket(this.brokerURL));
            rpcClient.debug = null;
            rpcClient.connect(this.config.mq.username, this.config.mq.password, ()=>{
                headers['correlation-id'] = generateUUID();
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
const Stomp = require('stompjs/lib/stomp').Stomp;
const Transcript = require('./components/transcript');
const Hotspot = require('./components/hotspot');
const Speaker = require('./components/speaker');
const Display = require('./components/display');

module.exports = class CELIO {
    constructor(mq) {
        const client = Stomp.over(new WebSocket(`ws://${mq.url}:15674/ws`));
        client.debug = null;
        this.pconn = new Promise(function(resolve, reject) {
            client.connect(mq.username, mq.password, ()=>resolve(client), reject);
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

    onTopic(topic, handler) {
        if (this.pconn) {
            this.pconn.then(client=>client.subscribe(`/exchange/${this.config.exchange}/${topic}`, msg=>{
                handler(msg.body, msg.headers);
            }));
        }
        else
            throw new Error('Message exchange not configured.');
    }

    publishTopic(topic, msg, options) {
        if (this.pconn)
            this.pconn.then(client=>client.send(`/exchange/${this.config.exchange}/${topic}`, options, msg));
        else
            throw new Error('Message exchange not configured.');
    }
};
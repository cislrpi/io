module.exports = class Transcript {
    constructor(io) {
        this.io = io;
    }

    _on(topic, handler) {
        this.io.onTopic(topic, msg=>{
            console.log(msg);
            handler(JSON.parse(msg.content.toString()));
        });
    }

    onAll(handler) {
        this._on('*.*.transcript', handler);
    }

    onFinal(handler) {
        this._on('*.final.transcript', handler);
    }

    onInterim(handler) {
        this._on('*.interim.transcript', handler);
    }

    switchModel(model) {
        this.io.publishTopic('switch-model.stt.command', JSON.stringify({model}));
    }

    onSwitchModel(handler) {
        this.io.onTopic('switch-model.stt.command', msg=>handler(JSON.parse(msg.content.toString())));
    }

    publish(source, isFinal, msg) {
        const topic = isFinal ? 'final' : 'interim';
        this.io.publishTopic(`${source}.${topic}.transcript`, JSON.stringify(msg));
    }
};
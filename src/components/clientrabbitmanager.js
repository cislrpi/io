const Stomp = require('stompjs/lib/stomp').Stomp

module.exports = class RabbitManager {
    constructor(mq) {
        this.mgmturl = `http://${mq.hostname}:15672/api`
        this.config = mq
        this.config.vhost = mq.vhost === '/' ? '%2f' : mq.vhost

        let protocol = 'ws'
        let port = 15674

        if (mq.tls) {
            console.log('Making a secure websocket connection.')
            protocol = 'wss'
            port = 15671
        }

        this.brokerURL = `${protocol}://${mq.hostname}:${port}/ws`
        const client = Stomp.over(new WebSocket(this.brokerURL))
        // client.debug = null
        this.pconn = new Promise((resolve, reject) => {
            client.connect(mq.username, mq.password, () => resolve(client),
                err => { console.error(err); reject(err) })
        })
    }

    getQueues() {
        return fetch(`${this.mgmturl}/queues/${this.config.vhost}`, {
            mode: 'cors',
            headers: {
                'Authorization': 'Basic ' + btoa(`${this.config.username}:${this.config.password}`)
            }
        })
    }

    _on(topic, handler) {
        this.pconn.then(client => client.subscribe(`/exchange/amq.rabbitmq.event/${topic}`, msg => {
            handler(msg.body, msg.headers)
        }, { durable: false, 'auto-delete': true }))
    }

    onQueueDeleted(handler) {
        this._on('queue.deleted', handler)
    }

    onQueueCreated(handler) {
        this._on('queue.created', handler)
    }
}

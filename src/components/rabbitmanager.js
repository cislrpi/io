const request = require('request')
const amqp = require('amqplib')
const fs = require('fs')
const _ = require('lodash')

/**
 * Callback for handling queue event subscriptions.
 * @callback queueEventCallback
 * @param {Object} queue - The queue for which the event happened.
 * @param {String} queue.name - The queue name.
 * @param {Object} headers - The message headers.
 */

/**
 * Class representing the RabbitManager object.
 */
class RabbitManager {
    /**
     * Use {@link CELIO#getRabbitManager} instead.
     */
    constructor(mq) {
        const auth = mq.username + ':' + mq.password

        this.mgmturl = `http://${auth}@${mq.hostname}:15672/api`
        this.vhost = mq.vhost === '/' ? '%2f' : mq.vhost

        let pconn = null
        if (mq.ca) {
            pconn = amqp.connect(`amqps://${auth}@${mq.hostname}`, {
                ca: [fs.readFileSync(mq.ca)]
            })
        } else {
            pconn = amqp.connect(`amqp://${auth}@${mq.hostname}`)
        }

        // Make a shared channel for publishing and subscribe
        this.pch = pconn.then(conn => conn.createChannel())
    }

    /**
     * Get a list of queues declared in the rabbitmq server.
     * @return {Promise}
     */
    getQueues() {
        return new Promise((resolve, reject) => {
            request({url: `${this.mgmturl}/queues/${this.vhost}?columns=state,name`, json: true}, (err, resp, body) => {
                if (!err && resp.statusCode === 200) {
                    resolve(body)
                } else {
                    if (err) {
                        reject(err)
                    } else {
                        reject(body)
                    }
                }
            })
        })
    }

    _on(topic, handler) {
        this.pch.then(ch => ch.assertQueue('', { exclusive: true })
            .then(q => ch.bindQueue(q.queue, 'amq.rabbitmq.event', topic)
                .then(() => ch.consume(q.queue, msg =>
                    handler(msg.properties.headers, _.merge(msg.fields, msg.properties)), { noAck: true }))))
    }

    /**
     * Subscribe to queue deletion events
     * @param  {queueEventCallback} handler - Callback to handle the event.
     */
    onQueueDeleted(handler) {
        this._on('queue.deleted', handler)
    }

    /**
     * Subscribe to queue creation events
     * @param  {queueEventCallback} handler - Callback to handle the event.
     */
    onQueueCreated(handler) {
        this._on('queue.created', handler)
    }
}

module.exports = RabbitManager

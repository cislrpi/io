const fs = require('fs')
const nconf = require('nconf')
const amqp = require('amqplib')
const _ = require('lodash')

const CELIOAbstract = require('./CELIOAbstract')
const Hotspot = require('./components/hotspot')
const Store = require('./components/store')

/**
 * Callback for sending replies back to the caller. Can only be used once in a RPC handler.
 * @callback replyCallback
 * @param {(Buffer | Error)} response - A reply message.
 */

/**
 * Send acknowledgement back to signal the caller that the call is handled.
 * @callback ackCallback
 */

/**
 * Callback for handling the call.
 * @callback subscriptionCallback
 * @param {Buffer} content - The message content.
 * @param {Object} headers - The message headers.
 */

/**
 * Callback for handling the call.
 * @callback rpcCallback
 * @param {Object} msg - A message to trigger the call.
 * @param {Buffer} msg.content - The message content.
 * @param {Object} msg.headers - The message headers.
 * @param {replyCallback} reply - The function used to send replies back to the caller.
 * @param {ackCallback} [ack] - The function used to send acknowledgement. This is only available if noAck is set to false.
 */

/**
 * Class representing the CELIO object.
 * @prop {DisplayContextFactory} displayContext - The displayContext factory.
 * @prop {Store} store - The singleton store object.
 * @prop {Transcript} transcript - The singleton transcript object
 * @prop {Speaker} speaker - The singleton speaker object
 */
class CELIO extends CELIOAbstract {
    /**
     * Create the CELIO object, and establish connections to the central message broker and store
     * @param  {string} [configFile='./cog.json'] - The file path of the cog.json file.
     */
    constructor(configFile = './cog.json') {
        super()
        nconf.argv().file({ file: configFile }).env('_')

        nconf.required(['mq:url', 'mq:username', 'mq:password', 'store:url'])

        this._exchange = nconf.get('mq:exchange') ? nconf.get('mq:exchange') : 'amq.topic'

        const ca = nconf.get('mq:ca')
        const auth = nconf.get('mq:username') + ':' + nconf.get('mq:password') + '@'

        if (ca) {
            this.pconn = amqp.connect(`amqps://${auth}${nconf.get('mq:url')}`, {
                ca: [fs.readFileSync(ca)]
            })
        } else {
            this.pconn = amqp.connect(`amqp://${auth}${nconf.get('mq:url')}`)
        }

        // Make a shared channel for publishing and subscribe
        this.pch = this.pconn.then(conn => conn.createChannel())

        this.config = nconf
        // Make the store connection
        this.store = new Store(nconf.get('store'))
    }

    /**
     * Create a rectangular hotspot region that observes pointer movements and clicks.
     * @param  {Object} region - The hotspot region.
     * @param  {number[]} region.normal - The normal unit vector ([x, y, z]) of the region.
     * @param  {number[]} region.over - The horizontal unit vector ([x, y, z]) of the region.
     * @param  {number[]} region.center - The center point ([x, y, z]) of the region.
     * @param  {number} region.width - Width in mm.
     * @param  {number} region.height - Height in mm.
     * @param  {bool} [excludeEventsOutsideRegion=true] - whether to exclude events outside the region.
     * @returns {Hotspot} The hotspot object.
     */
    createHotspot(region, excludeEventsOutsideRegion = true) {
        return new Hotspot(this, region, excludeEventsOutsideRegion)
    }

    /**
     * Make remote procedural call (RPC).
     * @param  {string} queue - The queue name to send the call to.
     * @param  {(Buffer | String | Array)} content - The RPC parameters.
     * @param  {Object} [options={}] - The calling options.
     * @param  {number} options.expiration=3000 - The timeout duration of the call.
     * @return {Promise} A promise that resolves to the reply content.
     */
    call(queue, content, options = {}) {
        return new Promise((resolve, reject) => {
            this.pconn.then(conn => conn.createChannel()
                .then(ch => ch.assertQueue('', { exclusive: true })
                    .then(q => {
                        options.correlationId = this.generateUUID()
                        options.replyTo = q.queue
                        if (!options.expiration) {
                            options.expiration = 3000 // default to 3 sec;
                        }
                        let timeoutID
                        // Time out the response when the caller has been waiting for too long
                        if (typeof options.expiration === 'number') {
                            timeoutID = setTimeout(() => {
                                reject(new Error(`Request timed out after ${options.expiration} ms.`))
                                ch.close()
                            }, options.expiration + 500)
                        }

                        ch.consume(q.queue, msg => {
                            if (msg.properties.correlationId === options.correlationId) {
                                if (msg.properties.headers.error) {
                                    reject(new Error(msg.properties.headers.error))
                                } else {
                                    resolve({content: msg.content, headers: _.merge(msg.fields, msg.properties)})
                                }

                                clearTimeout(timeoutID)
                                ch.close()
                            };
                        }, { noAck: true })
                        ch.sendToQueue(queue, Buffer.isBuffer(content) ? content : new Buffer(content), options)
                    }))).catch(reject)
        })
    }

    /**
     * Receive RPCs from a queue and handle them.
     * @param  {string} queue - The queue name to listen to.
     * @param  {rpcCallback} handler - The actual function handling the call.
     * @param  {bool} [noAck=true] - Whether to acknowledge the call automatically. If set to false, the handler has to acknowledge the call manually.
     * @param  {bool} [exclusive=true] - Whether to declare an exclusive queue. If set to false, multiple clients can share the same the workload.
     * @returns {void}
     */
    doCall(queue, handler, noAck = true, exclusive = true) {
        this.pch.then(ch => {
            ch.prefetch(1)
            ch.assertQueue(queue, { exclusive }).then(q => ch.consume(q.queue, request => {
                let replyCount = 0
                function reply(response) {
                    if (replyCount >= 1) {
                        throw new Error('Replied more than once.')
                    }
                    replyCount++
                    if (response instanceof Error) {
                        ch.sendToQueue(request.properties.replyTo, new Buffer(''),
                            { correlationId: request.properties.correlationId, headers: { error: response.message } })
                    } else {
                        ch.sendToQueue(request.properties.replyTo, Buffer.isBuffer(response) ? response : new Buffer(response),
                            { correlationId: request.properties.correlationId })
                    }
                }
                function ack() { ch.ack(request) }

                handler({ content: request.content, headers: _.merge(request.fields, request.properties) }, reply,
                    noAck ? undefined : ack)
            }, { noAck }))
        })
    }

    /**
     * Subscribe to a topic.
     * @param  {string} topic - The topic to subscribe to. Should be of a form 'tag1.tag2...'. Supports wildcard.
     * For more information, refer to the {@link https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html|Rabbitmq tutorial}.
     * @param  {subscriptionCallback} handler - The callback function to process the messages from the topic.
     * @returns {void}
     */
    onTopic(topic, handler) {
        this.pch.then(ch => ch.assertQueue('', { exclusive: true })
            .then(q => ch.bindQueue(q.queue, this._exchange, topic)
                .then(() => ch.consume(q.queue, msg =>
                    handler(msg.content, _.merge(msg.fields, msg.properties)), { noAck: true }))))
    }
    /**
     * Publish a message to the specified topic.
     * @param  {string} topic - The routing key for the message.
     * @param  {(Buffer | String | Array)} content - The message to publish.
     * @param  {Object} [options] - Publishing options. Leave it undefined is fine.
     * @return {void}
     */
    publishTopic(topic, content, options) {
        this.pch.then(ch => ch.publish(this._exchange, topic,
            Buffer.isBuffer(content) ? content : new Buffer(content), options))
    }
}

module.exports = CELIO

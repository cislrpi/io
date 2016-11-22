/* eslint-env browser */
require('whatwg-fetch')
const Stomp = require('stompjs/lib/stomp').Stomp
const CELIOAbstract = require('./CELIOAbstract')
const Store = require('./components/clientstore')
const RabbitManager = require('./components/clientrabbitmanager')

/**
 * Callback for handling the call.
 * @callback webSubscriptionCallback
 * @param {String} content - The message content.
 * @param {Object} headers - The message headers.
 */
/**
 * Callback for handling the call.
 * @callback webRPCCallback
 * @param {Object} msg - A message to trigger the call.
 * @param {String} msg.content - The message content.
 * @param {Object} msg.headers - The message headers.
 */

/**
 * Class representing the CELIO object.
 * @prop {DisplayContextFactory} displayContext - The displayContext factory.
 * @prop {Store} store - The singleton store object.
 * @prop {Transcript} transcript - The singleton transcript object
 * @prop {Speaker} speaker - The singleton speaker object
 */
class CELIOWeb extends CELIOAbstract {
    /**
     * Create the CELIO object, and establish connections to the central message broker and store
     * @param  {Object} config - The config object.
     * @param  {Object} config.mq - The message queue configuration.
     * @param  {string} config.mq.url - The message queue url.
     * @param  {string} config.mq.username - The message queue username.
     * @param  {string} config.mq.password - The message queue password.
     * @param  {Object} config.store - The store configuration.
     * @param  {string} config.store.url - The store url.
     */
    constructor(config) {
        super()
        if (!config.mq.exchange) {
            config.mq.exchange = 'amq.topic'
        }
        const sepPos = config.mq.url.lastIndexOf('/')
        if (sepPos > -1) {
            config.mq.vhost = config.mq.url.substring(sepPos + 1)
            config.mq.hostname = config.mq.url.substring(0, sepPos)
        } else {
            config.mq.vhost = '/'
            config.mq.hostname = config.mq.url
        }

        let protocol = 'ws'
        let port = 15674

        if (config.mq.tls) {
            console.log('Making a secure websocket connection.')
            protocol = 'wss'
            port = 15671
        }

        this.brokerURL = `${protocol}://${config.mq.hostname}:${port}/ws`
        const client = Stomp.over(new WebSocket(this.brokerURL))
        client.debug = null
        this.pconn = new Promise(function (resolve, reject) {
            client.connect(config.mq.username, config.mq.password, () => resolve(client),
                err => { console.error(err); reject(err) }, config.mq.vhost)
        })
        this.config = new Map()
        this.config.set('mq', config.mq)

        // Make the store connection
        this.store = new Store(config.store)
    }

    /**
     * Make remote procedural call (RPC).
     * @param  {string} queue - The queue name to send the call to.
     * @param  {string} content - The RPC parameters.
     * @param  {Object} [options={}] - The calling options.
     * @param  {number} options.expiration=3000 - The timeout duration of the call.
     * @return {Promise} A promise that resolves to the reply content.
     */
    call(queue, content, options = {}) {
        const mq = this.config.get('mq')
        return new Promise((resolve, reject) => {
            const rpcClient = Stomp.over(new WebSocket(this.brokerURL))
            rpcClient.debug = null
            rpcClient.connect(mq.username, mq.password, () => {
                options['correlation-id'] = this.generateUUID()
                options['reply-to'] = '/temp-queue/result'
                if (!options.expiration) {
                    options.expiration = 3000 // default to 3 sec;
                }
                let timeoutID
                // Time out the response when the caller has been waiting for too long
                if (typeof options.expiration === 'number') {
                    timeoutID = setTimeout(() => {
                        rpcClient.onreceive = null
                        reject(new Error(`Request timed out after ${options.expiration} ms.`))
                        rpcClient.disconnect()
                    }, options.expiration + 500)
                }

                rpcClient.onreceive = msg => {
                    if (msg.headers['correlation-id'] === options['correlation-id']) {
                        if (msg.headers.error) {
                            reject(new Error(msg.headers.error))
                        } else {
                            resolve({content: msg.body, headers: msg.headers})
                        }

                        clearTimeout(timeoutID)
                        rpcClient.disconnect()
                    };
                }
                rpcClient.send(`/amq/queue/${queue}`, options, content)
            }, reject, mq.vhost)
        })
    }

    /**
     * Receive RPCs from a queue and handle them.
     * @param  {string} queue - The queue name to listen to.
     * @param  {webRPCCallback} handler - The actual function handling the call.
     *
     */
    doCall(queue, handler) {
        this.pconn.then(client => client.subscribe(`/queue/${queue}`, msg => {
            let replyCount = 0
            function reply(response) {
                if (replyCount >= 1) {
                    throw new Error('Replied more than once.')
                }
                replyCount++
                if (response instanceof Error) {
                    client.send(msg.headers['reply-to'],
                        { 'correlation-id': msg.headers['correlation-id'], error: response.message }, '')
                } else {
                    client.send(msg.headers['reply-to'],
                        { 'correlation-id': msg.headers['correlation-id'] }, response)
                }
            }

            handler({ content: msg.body, headers: msg.headers }, reply)
        }, { durable: false, 'auto-delete': true }))
    }

    /**
     * Subscribe to a topic.
     * @param  {string} topic - The topic to subscribe to. Should be of a form 'tag1.tag2...'. Supports wildcard.
     * For more information, refer to this [Rabbitmq tutorial]{@link https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html}
     * @param  {webSubscriptionCallback} handler - The callback function to process the messages from the topic.
     *
     */
    onTopic(topic, handler) {
        this.pconn.then(client => client.subscribe(`/exchange/${this.config.get('mq').exchange}/${topic}`, msg => {
            handler(msg.body, msg.headers)
        }, { durable: false, 'auto-delete': true }))
    }

    /**
     * Publish a message to the specified topic.
     * @param  {string} topic - The routing key for the message.
     * @param  {string} content - The message to publish.
     * @param  {Object} [options] - Publishing options. Leave it undefined is fine.
     * @return {undefined}
     */
    publishTopic(topic, content, options) {
        this.pconn.then(client => client.send(`/exchange/${this.config.get('mq').exchange}/${topic}`, options, content))
    }

    getRabbitManager() {
        if (!this.rabbitManager) {
            this.rabbitManager = new RabbitManager(this.config.get('mq'))
        }
        return this.rabbitManager
    }
}

module.exports = CELIOWeb

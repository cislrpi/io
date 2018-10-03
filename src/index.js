const _ = require('lodash');
const fs = require('fs');
const nconf = require('nconf');
const amqp = require('amqplib');
const uuid = require('uuid');

const Hotspot = require('./components/hotspot');
const Store = require('./components/store');
const RabbitManager = require('./components/rabbitmanager');
const Transcript = require('./components/transcript');
const Speaker = require('./components/speaker');
const DisplayContextFactory = require('./components/displaycontextfactory');

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
 * Callback for handling the subscription.
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
 */
class CELIO {
  /**
   * The singleton speaker object.
   * @name CELIO#speaker
   * @type {Speaker}
   */

  /**
   * The singleton transcript object.
   * @name CELIO#transcript
   * @type {Transcript}
   */

  /**
   * The displayContext factory.
   * @name CELIO#displayContext
   * @type {DisplayContextFactory}
   */

  /**
   * Create the CELIO object, and establish connections to the central message broker and store
   * @param  {string|object} [config] - string pointing to a file to use or an object containing settings
   *                  to override the default loaded file
   */
  constructor(config) {
    this.speaker = new Speaker(this);
    this.transcript = new Transcript(this);
    this.displayContext = new DisplayContextFactory(this);
    this.rabbitManager = null;

    let configFile = 'cog.json';
    if (!config) {
      if (typeof config === 'object') {
        nconf.override(config);
      }
      else {
        configFile = config;
      }
    }

    nconf.argv().file({ file: configFile }).env('_');
    if (!nconf.get('mq')) {
      nconf.required(['mq:url', 'mq:username', 'mq:password']);
      if (!nconf.get('mq:exchange')) {
        nconf.set('mq:exchange', 'amq.topic');
      }
      const url = nconf.get('mq:url');
      const sepPos = url.lastIndexOf('/');
      if (sepPos > -1) {
        nconf.set('mq:vhost', url.substring(sepPos + 1));
        nconf.set('mq:hostname', url.substring(0, sepPos));
      }
      else {
        nconf.set('mq:vhost', '/');
        nconf.set('mq:hostname', url);
      }
      const ca = nconf.get('mq:ca');
      const auth = nconf.get('mq:username') + ':' + nconf.get('mq:password');

      let pconn = null;
      if (ca) {
        pconn = amqp.connect(`amqps://${auth}@${url}`, {
          ca: [fs.readFileSync(ca)]
        });
      }
      else {
        pconn = amqp.connect(`amqp://${auth}@${url}`);
      }

      // Make a shared channel for publishing and subscribe
      /**
       * The premade channel promise. Use this to make your own rabbitmq subscriptions
       * @type {Promise}
       */
      this.pch = pconn.then(conn => conn.createChannel()).catch(e => {
        throw new Error(`Connection to the ${nconf.get('mq:vhost')} vhost failed. 
        Please make sure that you provided the correct rabbitmq connection parameters.`);
      });
    }
    else {
      this.pch = null;
    }

    if (!nconf.get('store')) {
      nconf.required(['store:url']);
      /**
       * The singleton store object.
       * @type {Store}
       */
      this.store = new Store(nconf.get('store'));
    }
    else {
      this.store = null;
    }

    /**
     * The singleton config object.
     * @type {nconf}
     */
    this.config = nconf;
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
    return new Hotspot(this, region, excludeEventsOutsideRegion);
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
    let consumerTag = null;
    if (!this.pch) {
      return new Error('You must specify rabbitmq details in cog.json to use it');
    }
    return new Promise((resolve, reject) => {
      this.pch.then(ch => ch.assertQueue('', { exclusive: true, autoDelete: true })
        .then(q => {
          options.correlationId = this.generateUUID();
          options.replyTo = q.queue;
          if (!options.expiration) {
            // default to 3 sec
            options.expiration = 3000;
          }
          let timeoutID;
          // Time out the response when the caller has been waiting for too long
          if (typeof options.expiration === 'number') {
            timeoutID = setTimeout(() => {
              if (consumerTag) {
                ch.cancel(consumerTag);
              }
              reject(new Error(`Request timed out after ${options.expiration} ms.`));
            }, options.expiration + 100);
          }

          ch.consume(q.queue, msg => {
            if (msg.properties.correlationId === options.correlationId) {
              clearTimeout(timeoutID);
              if (consumerTag) {
                ch.cancel(consumerTag);
              }
              if (msg.properties.headers.error) {
                reject(new Error(msg.properties.headers.error));
              }
              else {
                resolve({content: msg.content, headers: _.merge(msg.fields, msg.properties)});
              }
            };
          }, { noAck: true })
            .then(reply => { consumerTag = reply.consumerTag; });

          ch.sendToQueue(queue, Buffer.isBuffer(content) ? content : new Buffer(content), options);
        })).catch(reject);
    });
  }

  /**
   * Receive RPCs from a queue and handle them.
   * @param  {string} queue - The queue name to listen to.
   * @param  {rpcCallback} handler - The actual function handling the call.
   * @param  {bool} [noAck=true] - Whether to acknowledge the call automatically. If set to false, the handler has to acknowledge the call manually.
   * @param  {bool} [exclusive=true] - Whether to declare an exclusive queue. If set to false, multiple clients can share the same the workload.
   */
  doCall(queue, handler, noAck = true, exclusive = true) {
    if (!this.pch) {
      return new Error('You must specify rabbitmq details in cog.json to use it');
    }
    this.pch.then(ch => {
      ch.prefetch(1);
      ch.assertQueue(queue, { exclusive, autoDelete: true }).then(q => ch.consume(q.queue, request => {
        let replyCount = 0;
        function reply(response) {
          if (replyCount >= 1) {
            throw new Error('Replied more than once.');
          }
          replyCount++;
          if (response instanceof Error) {
            ch.sendToQueue(request.properties.replyTo, new Buffer(''),
              { correlationId: request.properties.correlationId, headers: { error: response.message } })
          }
          else {
            ch.sendToQueue(request.properties.replyTo, Buffer.isBuffer(response) ? response : new Buffer(response),
              { correlationId: request.properties.correlationId });
          }
        }
        function ack() { ch.ack(request); }

        handler({ content: request.content, headers: _.merge(request.fields, request.properties) }, reply,
          noAck ? undefined : ack);
      }, { noAck }));
    });
  }

  /**
   * Subscribe to a topic.
   * @param  {string} topic - The topic to subscribe to. Should be of a form 'tag1.tag2...'. Supports wildcard.
   * For more information, refer to the [Rabbitmq tutorial](https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html).
   * @param  {subscriptionCallback} handler - The callback function to process the messages from the topic.
   * @return {Promise} A subscription object which can be used to unscribe by calling
   * promise.then(subscription=>subscription.unsubscribe())
   */
  onTopic(topic, handler) {
    if (!this.pch) {
      return new Error('You must specify rabbitmq details in cog.json to use it');
    }
    return this.pch.then(ch => ch.assertQueue('', { exclusive: true, autoDelete: true })
      .then(q => ch.bindQueue(q.queue, this.config.get('mq:exchange'), topic)
        .then(() => ch.consume(q.queue, msg =>
          handler(msg.content, _.merge(msg.fields, msg.properties)), { noAck: true })
          .then(subscription => {
            subscription.unsubscribe = () => ch.cancel(subscription.consumerTag);
            return subscription;
          }))));
  }

  /**
   * Publish a message to the specified topic.
   * @param  {string} topic - The routing key for the message.
   * @param  {(Buffer | String | Array)} content - The message to publish.
   * @param  {Object} [options] - Publishing options. Leaving it undefined is fine.
   */
  publishTopic(topic, content, options) {
    if (!this.pch) {
      return new Error('You must specify rabbitmq details in cog.json to use it');
    }
    this.pch.then(ch => ch.publish(this.config.get('mq:exchange'), topic,
      Buffer.isBuffer(content) ? content : new Buffer(content), options));
  }

  /**
   * Create a singleton RabbitManager, which allows you to monitor queue events
   * @return {RabbitManager}
   */
  getRabbitManager() {
    if (!this.rabbitManager) {
      this.rabbitManager = new RabbitManager(this.config.get('mq'));
    }
    return this.rabbitManager;
  }

  /**
   * Generate UUID.
   * @returns {string} The unique ID.
   */
  generateUUID() {
    return uuid.v1();
  }
}

module.exports = CELIO;

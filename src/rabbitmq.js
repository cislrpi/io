const _ = require('lodash');
const fs = require('fs');
const request = require('request');
const amqp = require('amqplib');

/**
 * Class representing the RabbitManager object.
 */
class RabbitMQ {
  constructor(celio) {
    let config = celio.config;
    if (config.get('mq') === true) {
      config.set('mq', {});
    }
    config.defaults({
      'mq': {
        'url': 'localhost',
        'username': 'guest',
        'password': 'guest'
      }
    });

    if (!config.get('mq:exchange')) {
      config.set('mq:exchange', 'amq.topic');
    }
    const url = config.get('mq:url');
    const sepPos = url.lastIndexOf('/');
    if (sepPos > -1) {
      config.set('mq:vhost', url.substring(sepPos + 1));
      config.set('mq:hostname', url.substring(0, sepPos));
    }
    else {
      config.set('mq:vhost', '/');
      config.set('mq:hostname', url);
    }

    const ca = config.get('mq:ca');
    const auth = config.get('mq:username') + ':' + config.get('mq:password');

    let pconn = null;
    let options = {};
    if (ca) {
      options.ca = [fs.readFileSync(ca)];
    }

    pconn = amqp.connect(`amqp://${auth}@${url}`, options);
    pconn.catch(e => {
      console.error(`Connection to the rabbitmq root vhost failed. Please make sure that your user ${config.get('mq:username')} can access the root vhost!`);
      process.exit();
    });

    this.config = config;
    // Make a shared channel for publishing and subscribe
    this.pch = pconn.then(conn => conn.createChannel());
    this.mgmturl = `http://${auth}@${config.get('mq:hostname')}:15672/api`;
    this.vhost = config.get('mq:vhost') === '/' ? '%2f' : config.get('mq:vhost');
    this.prefix = config.get('mq:prefix');
  }

  resolveTopicName(topic_name) {
    if (this.prefix) {
      topic_name = `${this.prefix}.${topic_name}`;
    }
    return topic_name;
  }

  /**
   * Subscribe to a topic.
   * @param  {string} topic - The topic to subscribe to. Should be of a form 'tag1.tag2...'. Supports wildcard.
   * For more information, refer to the [Rabbitmq tutorial](https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html).
   * @param  {subscriptionCallback} handler - The callback function to process the messages from the topic.
   * @param {object} options options to use for the channel
   * @return {Promise} A subscription object which can be used to unscribe by calling
   * promise.then(subscription=>subscription.unsubscribe())
   */
  onTopic(topic, handler, options) {
    options = options || {};
    if (!options.exchange) {
      topic = this.resolveTopicName(topic);
    }

    let channel_options = {exclusive: true, autoDelete: true};
    return this.pch.then((channel) => {
      return channel.assertQueue('', channel_options).then((queue) => {
        let exchange = (options.exchange) ? options.exchange : this.config.get('mq:exchange');
        return channel.bindQueue(queue.queue, exchange, topic).then(() => {
          return channel.consume(queue.queue, (msg) => {
            if (msg !== null && handler) {
              let content = msg.content;
              try {
                content = JSON.parse(content);
              }
              catch (exc) {
                // pass
              }
              handler(content, _.merge(msg.fields, msg.properties));
            }
          }, {noAck: true}).then((subscription) => {
            subscription.unsubscribe = () => channel.cancel(subscription.consumerTag);
            return subscription;
          });
        });
      });
    });
  }

  /**
   * Publish a message to the specified topic.
   * @param  {string} topic - The routing key for the message.
   * @param  {(Buffer | String | Array)} content - The message to publish.
   * @param  {Object} [options] - Publishing options. Leaving it undefined is fine.
   * @return {void}
   */
  publishTopic(topic, content, options) {
    if (typeof content === 'object' && !Buffer.isBuffer(content)) {
      content = JSON.stringify(content);
    }
    content = Buffer.isBuffer(content) ? content : Buffer.from(content);
    this.pch.then(ch => {
      return ch.publish(this.config.get('mq:exchange'), topic, content, options);
    });
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
      this.pch.then(ch => {
        return ch.assertQueue('', { exclusive: true, autoDelete: true })
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
          });
      }).catch(reject);
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
      ch.assertQueue(queue, { exclusive, autoDelete: true }).then(q => {
        ch.consume(q.queue, request => {
          let replyCount = 0;
          function reply(response) {
            if (replyCount >= 1) {
              throw new Error('Replied more than once.');
            }
            replyCount++;
            if (response instanceof Error) {
              ch.sendToQueue(
                request.properties.replyTo,
                new Buffer(''),
                {
                  correlationId: request.properties.correlationId,
                  headers: { error: response.message }
                }
              );
            }
            else {
              ch.sendToQueue(
                request.properties.replyTo,
                Buffer.isBuffer(response) ? response : new Buffer(response),
                {
                  correlationId: request.properties.correlationId
                }
              );
            }
          }
          function ack() {
            ch.ack(request);
          }

          handler(
            {
              content: request.content,
              headers: _.merge(request.fields, request.properties)
            },
            reply,
            noAck ? undefined : ack
          );
        }, { noAck });
      });
    });
  }


  /**
   * Get a list of queues declared in the rabbitmq server.
   * @return {Promise}
   */
  getQueues() {
    return new Promise((resolve, reject) => {
      request({url: `${this.mgmturl}/queues/${this.vhost}?columns=state,name`, json: true}, (err, resp, body) => {
        if (!err && resp.statusCode === 200) {
          resolve(body);
        }
        else {
          if (err) {
            reject(err);
          }
          else {
            reject(body);
          }
        }
      });
    });
  }

  /**
   * Subscribe to queue deletion events
   * @param  {queueEventCallback} handler - Callback to handle the event.
   */
  onQueueDeleted(handler) {
    this.onTopic('queue.deleted', handler, {exchange: 'amq.rabbitmq.event'});
  }

  /**
   * Subscribe to queue creation events
   * @param  {queueEventCallback} handler - Callback to handle the event.
   */
  onQueueCreated(handler) {
    this.onTopic('queue.created', handler, {exchange: 'amq.rabbitmq.event'});
  }
}

module.exports = {
  config: 'mq',
  Class: RabbitMQ
};

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
      config.defaults({
        'mq:url': 'localhost',
        'mq:username': 'guest',
        'mq:password': 'guest'
      });
    }
    else {
      config.required(['mq:url', 'mq:username', 'mq:password']);
    }

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
      throw new Error(`Connection to the rabbitmq root vhost failed. Please make sure that your user ${config.get('mq:username')} can access the root vhost`);
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
    if (typeof content === 'object') {
      content = JSON.stringify(content);
    }
    this.pch.then(ch => {
      content = Buffer.isBuffer(content) ? content : new Buffer(content);
      ch.publish(this.config.get('mq:exchange'), topic, options);
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
  variable: 'mq',
  Class: RabbitMQ
};

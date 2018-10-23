const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const nconf = require('nconf');
const amqp = require('amqplib');

/**
 * Class representing the CELIO object.
 */
class CELIO {
  /**
   * Create the CELIO object, and establish connections to the central message broker and store
   * @param  {string|object} [config] - string pointing to a file to use or an object containing settings
   *                  to override the default loaded file
   */
  constructor(config) {
    let configFile = 'cog.json';
    if (config) {
      if (typeof config === 'object') {
        nconf.override(config);
      }
      else {
        configFile = config;
      }
    }
    nconf.argv().file({ file: configFile }).env('_');
    this.config = nconf;

    // TODO: dynamically pick up non-index.js files in this directory to include
    // automatically
    let preinstalled = [
      './rabbitmq'
    ];

    if (__dirname.lastIndexOf('node_modules') > -1) {
      let substring = __dirname.substring(0, __dirname.lastIndexOf('node_modules'));
      let package_json = JSON.parse(fs.readFileSync(path.join(substring, 'package.json')));
      let dependencies = Object.keys(package_json['dependencies'] || {}).concat(Object.keys(package_json['devDependencies'] || {}));
      dependencies = dependencies.concat(preinstalled);
      const pattern = /^(@.*\/)?celio-.+/;
      for (let dependency of dependencies) {
        if (pattern.test(dependency) && require.resolve(dependency)) {
          let loaded = require(dependency);
          if (nconf.get(loaded.config)) {
            this[loaded.variable] = new loaded.class(this.config);
          }
        }
      }
    }
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
   * @return {void}
   */
  doCall(queue, handler, noAck = true, exclusive = true) {
    if (!this.pch) {
      throw new Error('You must specify rabbitmq details in cog.json to use it');
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


  publishTopic(topic, content, options) {
    if (!this.pch) {
      throw new Error('You must specify rabbitmq details in cog.json to use it');
    }

    this.pch.then()

    /*
    this.pch.then(ch => {
      content = Buffer.isBuffer(content) ? content : new Buffer(content);
      ch.publish(this.config.get('mq:exchange'), topic, options);
    });
    */
  }
}

module.exports = CELIO;

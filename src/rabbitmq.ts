import fs from 'fs';
import request from 'request';
import amqplib, { Replies } from 'amqplib';

import { Io } from './io';

export interface Response {
  content: Buffer | string | number | object;
  message: amqplib.ConsumeMessage;
}

interface Subscription extends amqplib.Replies.Consume {
  unsubscribe: () => void;
}

type ReplyCallback = (content: Error | Buffer | string | number | object) => void;
type RpcReplyCallback = (response: Response, reply: ReplyCallback) => void;
type PublishCallback = (response: Response) => void;

interface QueueState {
  name: string;
  state: string;
}

export interface RabbitOptions {
  url: string;
  hostname: string;
  username: string;
  password: string;
  exchange: string;
  vhost: string;
  ca?: string;
  prefix?: string;
}

/**
 * Class representing the RabbitManager object.
 */
export class Rabbit {
  public options: RabbitOptions;

  private pch: Promise<amqplib.Channel>;
  private mgmturl: string;
  private vhost: string;
  private prefix?: string;
  private io: Io;

  public constructor(io: Io) {
    this.options = Object.assign(
      {
        url: 'localhost',
        username: 'guest',
        password: 'guest',
        exchange: 'amq.topic',
        vhost: '/',
        hostname: 'localhost'
      },
      typeof io.config.rabbit === 'boolean' ? {} : io.config.rabbit
    );

    const url = this.options.url;
    const sepPos = url.lastIndexOf('/');
    if (sepPos > -1) {
      this.options.vhost = url.substring(sepPos + 1);
      this.options.hostname = url.substring(0, sepPos);
    }
    else {
      this.options.hostname = this.options.url;
    }

    const auth = `${this.options.username}:${this.options.password}`;

    let pconn = null;
    let options;
    if (this.options.ca && fs.existsSync(this.options.ca)) {
      options = {
        ca: [fs.readFileSync(this.options.ca)]
      };
    }

    pconn = amqplib.connect(`amqp://${auth}@${url}`, options);
    pconn.catch((err): void => {
      console.error(`RabbitMQ error: ${err}`);
      console.error(`Connection to the rabbitmq root vhost failed. Please make sure that your user ${this.options.username} can access the root vhost!`);
      process.exit(1);
    });

    // Make a shared channel for publishing and subscribe
    this.pch = pconn.then((conn: amqplib.Connection): Promise<amqplib.Channel> => conn.createChannel());
    this.mgmturl = `http://${auth}@${this.options.hostname}:15672/api`;
    this.vhost = this.options.vhost === '/' ? '%2f' : this.options.vhost;
    this.prefix = this.options.prefix;
    this.io = io;
  }

  private resolveTopicName(topic_name: string): string {
    if (this.prefix) {
      topic_name = `${this.prefix}.${topic_name}`;
    }
    return topic_name;
  }

  private parseContent(content: Buffer, content_type: string): Buffer | string | number {
    let final_content: Buffer | string | number = content;
    if (content_type === 'application/json') {
      final_content = JSON.parse(content.toString());
    }
    else if (content_type === 'text/string') {
      final_content = content.toString();
    }
    else if (content_type === 'text/number') {
      final_content = parseFloat(content.toString());
    }
    return final_content;
  }

  private getContentType(content: Buffer | string | number | object): string {
    if (Buffer.isBuffer(content)) {
      return 'application/octet-stream';
    }
    else if (typeof content === 'number') {
      return 'text/number';
    }
    else if (typeof content === 'string') {
      return 'text/string';
    }
    else {
      return 'application/json';
    }
  }

  private encodeContent(content: Buffer | string | number | object): Buffer {
    let final: Buffer;
    if (!Buffer.isBuffer(content)) {
      let string_content = '';
      if (typeof content === 'string') {
        string_content = content;
      }
      else if (typeof content === 'number') {
        string_content = content.toString();
      }
      else {
        string_content = JSON.stringify(content);
      }
      final = Buffer.from(string_content);
    }
    else {
      final = content;
    }

    return final;
  }

  /**
   * Publish a message to the specified topic.
   * @param  {string} topic - The routing key for the message.
   * @param  {Buffer | String} content - The message to publish.
   * @param  {Object} [options] - Publishing options. Leaving it undefined is fine.
   * @return {void}
   */
  public async publishTopic(topic: string, content: Buffer | string | number | object, options: amqplib.Options.Publish = {}): Promise<boolean> {
    const encodedContent = this.encodeContent(content);
    options.contentType = options.contentType || this.getContentType(content);
    const channel = await this.pch;
    await channel.checkExchange(this.options.exchange);
    return channel.publish(this.options.exchange, topic, encodedContent, options);
  }

  /**
   * Subscribe to a topic.
   * @param  {string} topic - The topic to subscribe to. Should be of a form 'tag1.tag2...'. Supports wildcard.
   * For more information, refer to the [Rabbitmq tutorial](https://www.rabbitmq.com/tutorials/tutorial-five-javascript.html).
   * @param  {subscriptionCallback} handler - The callback function to process the messages from the topic.
   * @param {object} options options to use for the channel
   * @return {Promise} A subscription object which can be used to unsubscribe by calling
   * promise.then(subscription=>subscription.unsubscribe())
   */
  public async onTopic(topic: string, handler: PublishCallback, exchange?: string): Promise<Replies.Consume> {
    topic = this.resolveTopicName(topic);

    const channel_options = {exclusive: true, autoDelete: true};
    const channel = await this.pch;
    await channel.checkExchange(this.options.exchange);
    const queue = await channel.assertQueue('', channel_options);
    await channel.bindQueue(queue.queue, exchange || this.options.exchange, topic);
    return channel.consume(queue.queue, (msg): void => {
      if (msg !== null) {
        handler({
          content: this.parseContent(msg.content, msg.properties.contentType),
          message: msg
        });
      }
    }, {noAck: true}).then((consume: amqplib.Replies.Consume): Subscription => {
      return Object.assign(
        consume,
        {
          unsubscribe: () => {
            return channel.cancel(consume.consumerTag);
          }
        }
      );
    });
  }

  /**
   * Make remote procedural call (RPC).
   */
  public async publishRpc(queue_name: string, content: Buffer | string | number | object = Buffer.from(''), options: amqplib.Options.Publish = {}): Promise<Response> {
    let consumerTag: string;
    const channel = await this.pch;
    const queue = await channel.assertQueue('', {exclusive: true, autoDelete: true});
    return new Promise((resolve, reject): void => {
      options.correlationId = this.io.generateUuid();
      options.replyTo = queue.queue;
      options.expiration = options.expiration || 3000;
      options.contentType = options.contentType || this.getContentType(content);

      let timeoutId: NodeJS.Timeout;
      // Time out the response when the caller has been waiting for too long
      if (typeof options.expiration === 'number') {
        timeoutId = setTimeout((): void => {
          if (consumerTag) {
            channel.cancel(consumerTag);
          }
          reject(new Error(`Request timed out after ${options.expiration} ms.`));
        }, options.expiration + 100);
      }

      channel.consume(queue.queue, (msg) => {
        if (msg !== null) {
          if (msg.properties.correlationId === options.correlationId) {
            clearTimeout(timeoutId);
            if (consumerTag) {
              channel.cancel(consumerTag);
            }
            if (msg.properties.headers.error) {
              reject(new Error(msg.properties.headers.error));
            }
            else {
              resolve({content: this.parseContent(msg.content, msg.properties.contentType), message: msg});
            }
          }
          else {
            reject(new Error('null response for call'));
          }
        }
      }, { noAck: true}).then((reply) => {
        consumerTag = reply.consumerTag;
      });

      channel.sendToQueue(queue_name, this.encodeContent(content), options);
    });
  }

  /**
   * Receive RPCs from a queue and handle them.
   */
  public async onRpc(queue_name: string, handler: RpcReplyCallback, exclusive = true): Promise<void> {
    const channel = await this.pch;
    channel.prefetch(1);
    const queue = await channel.assertQueue(queue_name, {exclusive, autoDelete: true});
    await channel.consume(queue.queue, (msg: amqplib.ConsumeMessage | null) => {
      let replyCount = 0;
      const reply: ReplyCallback = (response: Error | Buffer | string | number | object): void => {
        if (replyCount >= 1) {
          throw new Error('Replied more than once.');
        }
        replyCount++;
        if (msg !== null) {
          if (response instanceof Error) {
            channel.sendToQueue(
              msg.properties.replyTo,
              Buffer.from(response.message),
              {
                correlationId: msg.properties.correlationId,
                headers: { error: response.message }
              }
            );
          }
          else {
            const options: amqplib.Options.Publish = {
              correlationId: msg.properties.correlationId
            };
            const encodedContent = this.encodeContent(response);
            options.contentType = options.contentType || this.getContentType(response);
            channel.sendToQueue(msg.properties.replyTo, encodedContent, options);
          }
        }
      };

      if (msg === null) {
        throw new Error('Request for doCall was null');
      }

      handler({
        content: this.parseContent(msg.content, msg.properties.contentType),
        message: msg
      }, reply);
    }, { noAck: true });
  }

  /**
   * Get a list of queues declared in the rabbitmq server.
   * @return {Promise}
   */
  public getQueues(): Promise<QueueState[]> {
    return new Promise((resolve, reject): void => {
      request({url: `${this.mgmturl}/queues/${this.vhost}?columns=state,name`, json: true}, (err, resp, body): void => {
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
   * Subscribe to queue creation events
   * @param  {queueEventCallback} handler - Callback to handle the event.
   */
  public onQueueCreated(handler: (queue_name: string, properties: amqplib.MessageProperties) => void): void {
    this.onTopic('queue.created', (response): void => {
      handler(response.message.properties.headers.name, response.message.properties);
    }, 'amq.rabbitmq.event');
  }

  /**
   * Subscribe to queue deletion events
   * @param  {queueEventCallback} handler - Callback to handle the event.
   */
  public onQueueDeleted(handler: (queue_name: string, properties: amqplib.MessageProperties) => void): void {
    this.onTopic('queue.deleted', (response): void => {
      handler(response.message.properties.headers.name, response.message.properties);
    }, 'amq.rabbitmq.event');
  }
}

import _ from 'lodash';
import fs from 'fs';
import request from 'request';
import amqplib, { Replies } from 'amqplib';
import { Provider } from 'nconf';

import { Io } from './index';

export type FieldsAndProperties = amqplib.ConsumeMessageFields & amqplib.MessageProperties;

type OnTopicCallback = (content: Buffer, headers: FieldsAndProperties, msg: amqplib.ConsumeMessage) => void;
type OnTopicStringCallback = (content: string, headers: FieldsAndProperties, msg: amqplib.ConsumeMessage) => void;
type OnTopicJsonCallback = (content: any, headers: FieldsAndProperties, msg: amqplib.ConsumeMessage) => void;

type ReplyCallback = (content: Buffer) => void;
type ReplyStringCallback = (content: string) => void;
type ReplyJsonCallback = (content: any) => void;

type DoCallCallback = (content: Buffer, headers: FieldsAndProperties, reply: ReplyCallback, msg: amqplib.ConsumeMessage) => void;
type DoCallStringCallback = (content: string, headers: FieldsAndProperties, reply: ReplyStringCallback, msg: amqplib.ConsumeMessage) => void;
type DoCallJsonCallback = (content: any, headers: FieldsAndProperties, reply: ReplyJsonCallback, msg: amqplib.ConsumeMessage) => void;

/**
 * Class representing the RabbitManager object.
 */
export class RabbitMQ {
  private config: Provider;
  private pch: Promise<amqplib.Channel>
  private mgmturl: string;
  private vhost: string;
  private prefix?: string;
  private io: Io;

  public constructor(io: Io) {
    let config = io.config;
    if (config.get('mq') === true) {
      config.set('mq', {});
    }
    config.defaults({
      store: {
        mq: {
          url: 'localhost',
          username: 'guest',
          password: 'guest'
        }
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

    const auth = config.get('mq:username') + ':' + config.get('mq:password');

    let pconn = null;
    let options: any = {};
    if (config.get('mq:ca')) {
      options.ca = [fs.readFileSync(config.get('mq:ca'))];
    }

    pconn = amqplib.connect(`amqp://${auth}@${url}`, options);
    pconn.catch((_): void => {
      console.error(`Connection to the rabbitmq root vhost failed. Please make sure that your user ${config.get('mq:username')} can access the root vhost!`);
      process.exit(1);
    });

    this.config = config;
    // Make a shared channel for publishing and subscribe
    this.pch = pconn.then((conn: amqplib.Connection): Promise<amqplib.Channel> => conn.createChannel());
    this.mgmturl = `http://${auth}@${config.get('mq:hostname')}:15672/api`;
    this.vhost = config.get('mq:vhost') === '/' ? '%2f' : config.get('mq:vhost');
    this.prefix = config.get('mq:prefix');
    this.io = io;
  }

  public resolveTopicName(topic_name: string): string {
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
   * @return {Promise} A subscription object which can be used to unsubscribe by calling
   * promise.then(subscription=>subscription.unsubscribe())
   */
  public onTopic(topic: string, handler: OnTopicCallback, options: any = {}): Promise<any> {
    options = options || {};
    if (!options.exchange) {
      topic = this.resolveTopicName(topic);
    }

    let channel_options = {exclusive: true, autoDelete: true};
    return this.pch.then((channel): Promise<amqplib.Replies.Consume> => {
      return channel.assertQueue('', channel_options).then((queue): Promise<amqplib.Replies.Empty> => {
        let exchange = (options.exchange) ? options.exchange : this.config.get('mq:exchange');
        return channel.bindQueue(queue.queue, exchange, topic).then((): Promise<amqplib.Replies.Consume> => {
          return channel.consume(queue.queue, (msg): void => {
            if (msg !== null && handler) {
              handler(msg.content, _.merge(msg.fields, msg.properties), msg);
            }
          }, {noAck: true}).then((subscription: amqplib.Replies.Consume): amqplib.Replies.Consume => {
            (subscription as any).unsubscribe = (): Promise<amqplib.Replies.Empty> => {
              return channel.cancel(subscription.consumerTag);
            };
            return subscription;
          });
        });
      });
    });
  }

  public onTopicString(topic: string, handler: OnTopicStringCallback, options: any = {}): Promise<any> {
    return this.onTopic(
      topic, 
      (content: Buffer, headers: FieldsAndProperties, msg: amqplib.ConsumeMessage): void => {
        handler(content.toString(), headers, msg);
      }, 
      options
    );
  }

  public onTopicJson(topic: string, handler: OnTopicJsonCallback, options: any = {}): Promise<any> {
    return this.onTopic(
      topic, 
      (content: Buffer, headers: FieldsAndProperties, msg: amqplib.ConsumeMessage): void => {
        handler(JSON.parse(content.toString()), headers, msg);
      }, 
      options      
    );
  }

  /**
   * Publish a message to the specified topic.
   * @param  {string} topic - The routing key for the message.
   * @param  {Buffer | String} content - The message to publish.
   * @param  {Object} [options] - Publishing options. Leaving it undefined is fine.
   * @return {void}
   */
  public publishTopic(topic: string, content: Buffer | string, options?: any): void {
    this.pch.then((ch): boolean => {
      return ch.publish(
        this.config.get('mq:exchange'),
        topic,
        Buffer.isBuffer(content) ? content : Buffer.from(content),
        options
      );
    });
  }

  public publishTopicJson(topic: string, content: any, options: any): void {
    this.publishTopic(topic, JSON.stringify(content), options);
  }

  /**
   * Make remote procedural call (RPC).
   * @param  {string} queue - The queue name to send the call to.
   * @param  {(Buffer | String | Array)} content - The RPC parameters.
   * @param  {Object} [options={}] - The calling options.
   * @param  {number} options.expiration=3000 - The timeout duration of the call.
   * @return {Promise} A promise that resolves to the reply content.
   */
  public call(queue: string, content: Buffer | string, options: any = {}): Promise<any> {
    let consumerTag: string | null = null;
    return new Promise((resolve, reject): void => {
      this.pch.then((ch: amqplib.Channel): Promise<void> => {
        return ch.assertQueue('', {
          exclusive: true, autoDelete: true
        }).then((q: amqplib.Replies.AssertQueue): void => {
          options.correlationId = this.io.generateUUID();
          options.replyTo = q.queue;
          if (!options.expiration) {
            // default to 3 sec
            options.expiration = 3000;
          }
          let timeoutID: NodeJS.Timeout;
          // Time out the response when the caller has been waiting for too long
          if (typeof options.expiration === 'number') {
            timeoutID = setTimeout((): void => {
              if (consumerTag) {
                ch.cancel(consumerTag);
              }
              reject(new Error(`Request timed out after ${options.expiration} ms.`));
            }, options.expiration + 100);
          }

          ch.consume(q.queue, (msg: amqplib.ConsumeMessage | null): void => {
            if (msg !== null) {
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
              }
              else {
                reject(new Error('null response for call'));
              }
            };
          },
          {
            noAck: true
          }).then((reply: amqplib.Replies.Consume): void => {
            consumerTag = reply.consumerTag;
          }).catch((err): void => {
            console.error(err);
          });

          ch.sendToQueue(
            queue,
            Buffer.isBuffer(content) ? content : Buffer.from(content),
            options
          );
        }).catch((err): void => {
          console.error(err);
        });
      }).catch(reject);
    });
  }

  public callJson(queue: string, content: any, options: any = {}): Promise<any> {
    return this.call(queue, JSON.stringify(content), options);
  }
  
  /**
   * Receive RPCs from a queue and handle them.
   * @param  {string} queue - The queue name to listen to.
   * @param  {rpcCallback} handler - The actual function handling the call.
   * @param  {bool} [exclusive=true] - Whether to declare an exclusive queue. If set to false, multiple clients can share the same the workload.
   */
  public doCall(queue: string, handler: DoCallCallback, exclusive: boolean = true): void {
    this.pch.then((ch: amqplib.Channel): void => {
      ch.prefetch(1);
      ch.assertQueue(queue, { exclusive, autoDelete: true }).then((q: amqplib.Replies.AssertQueue): Promise<amqplib.Replies.Consume> => {
        return ch.consume(q.queue, (request: amqplib.ConsumeMessage | null): void => {
          let replyCount = 0;
          function reply(response: Error | Buffer): void {
            if (replyCount >= 1) {
              throw new Error('Replied more than once.');
            }
            replyCount++;
            if (request !== null) {
              if (response instanceof Error) {
                ch.sendToQueue(
                  request.properties.replyTo,
                  Buffer.from(''),
                  {
                    correlationId: request.properties.correlationId,
                    headers: { error: response.message }
                  }
                );
              }
              else {
                ch.sendToQueue(
                  request.properties.replyTo,
                  Buffer.isBuffer(response) ? response : Buffer.from(JSON.stringify(response)),
                  {
                    correlationId: request.properties.correlationId
                  }
                );
              }
            }
          }

          if (request === null) {
            throw new Error('Request for doCall was null');
          }
          handler(
            request.content,
            _.merge(request.fields, request.properties),
            reply,
            request
          );
        }, 
        { 
          noAck: true 
        });
      });
    });
  }

  public doCallString(queue: string, handler: DoCallStringCallback, exclusive: boolean = true): void {
    this.doCall(
      queue,
      (content, headers, reply, msg): void => {
        handler(
          content.toString(),
          headers,
          (str: string): void => {
            reply(Buffer.from(str));
          },
          msg
        );
      },
      exclusive
    );
  }

  public doCallJson(queue: string, handler: DoCallJsonCallback, exclusive: boolean = true): void {
    this.doCall(
      queue,
      (content, headers, reply, msg): void => {
        handler(
          JSON.parse(content.toString()),
          headers,
          (obj: any): void => {
            reply(Buffer.from(JSON.stringify(obj)));
          },
          msg
        );
      },
      exclusive
    );
  }

  /**
   * Get a list of queues declared in the rabbitmq server.
   * @return {Promise}
   */
  public getQueues(): Promise<any> {
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
   * Subscribe to queue deletion events
   * @param  {queueEventCallback} handler - Callback to handle the event.
   */
  public onQueueDeleted(handler: Function): void {
    this.onTopic('queue.deleted', (_: any, fields: any): void => {
      handler(fields.headers, fields);
    });
  }

  /**
   * Subscribe to queue creation events
   * @param  {queueEventCallback} handler - Callback to handle the event.
   */
  public onQueueCreated(handler: Function): void {
    this.onTopic('queue.created', (_: any, fields: any): void => {
      handler(fields.headers, fields);
    });
  }
}

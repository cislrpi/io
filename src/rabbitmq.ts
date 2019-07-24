import fs from 'fs';
import request from 'request';
import amqplib from 'amqplib';
import { Provider } from 'nconf';

import Io from './io';

type PublishCallback = (content: Buffer | any, message: amqplib.ConsumeMessage) => void;

type ReplyCallback = (content: Error | Buffer | any) => void;
type RpcReplyCallback = (content: Buffer | any, reply: ReplyCallback, message: amqplib.ConsumeMessage) => void;

interface RpcResponse {
  content: Buffer | any;
  message: amqplib.ConsumeMessage;
}

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
          password: 'guest',
          exchange: 'amq.topic'
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
    pconn.catch((err): void => {
      console.error(`RabbitMQ error: ${err}`);
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

  private resolveTopicName(topic_name: string): string {
    if (this.prefix) {
      topic_name = `${this.prefix}.${topic_name}`;
    }
    return topic_name;
  }

  /**
   * Publish a message to the specified topic.
   * @param  {string} topic - The routing key for the message.
   * @param  {Buffer | String} content - The message to publish.
   * @param  {Object} [options] - Publishing options. Leaving it undefined is fine.
   * @return {void}
   */
  public publishTopic(topic: string, content: Buffer | any, options: amqplib.Options.Publish = {}): void {
    if (!Buffer.isBuffer(content)) {
      if (!options.contentType) {
        if (typeof content === 'string' || content instanceof String) {
          options.contentType = 'text/string';
        }
        else if (typeof content === 'number') {
          options.contentType = 'text/number';
          content = content.toString();
        }
        else {
          content = JSON.stringify(content);
          options.contentType = 'application/json';
        }
      }
      content = Buffer.from(content);
    }

    this.pch.then((ch): boolean => {
      return ch.publish(this.config.get('mq:exchange'), topic, content, options);
    });
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
  public onTopic(topic: string, handler: PublishCallback, exchange?: string): Promise<any> {
    topic = this.resolveTopicName(topic);

    let channel_options = {exclusive: true, autoDelete: true};
    return this.pch.then((channel): Promise<amqplib.Replies.Consume> => {
      return channel.assertQueue('', channel_options).then((queue): Promise<amqplib.Replies.Empty> => {
        return channel.bindQueue(queue.queue, exchange || this.config.get('mq:exchange'), topic).then((): Promise<amqplib.Replies.Consume> => {
          return channel.consume(queue.queue, (msg): void => {
            if (msg !== null && handler) {
              let content = msg.content;
              
              let final_content: any = content;
              if (msg.properties.contentType === 'application/json') {
                final_content = JSON.parse(content.toString());
              }
              else if (msg.properties.contentType === 'text/string') {
                final_content = content.toString();
              }
              else if (msg.properties.contentType === 'text/number') {
                final_content = parseFloat(content.toString());
              }
              handler(final_content, msg);
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

  /**
   * Make remote procedural call (RPC).
   * @param  {string} queue - The queue name to send the call to.
   * @param  {(Buffer | String | Array)} content - The RPC parameters.
   * @param  {Object} [options={}] - The calling options.
   * @param  {number} options.expiration=3000 - The timeout duration of the call.
   * @return {Promise} A promise that resolves to the reply content.
   */
  public publishRpc(queue: string, content: Buffer | any, options: amqplib.Options.Publish = {}): Promise<RpcResponse> {
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
                  let content = msg.content;
                  let final_content: any = content;
                  if (msg.properties.contentType === 'application/json') {
                    final_content = JSON.parse(content.toString());
                  }
                  else if (msg.properties.contentType === 'text/string') {
                    final_content = content.toString();
                  }
                  else if (msg.properties.contentType === 'text/number') {
                    final_content = parseFloat(content.toString());
                  }
                  resolve({content: final_content, message: msg});
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

          if (!Buffer.isBuffer(content)) {
            if (!options.contentType) {
              if (typeof content === 'string' || content instanceof String) {
                options.contentType = 'text/string';
              }
              else if (typeof content === 'number') {
                options.contentType = 'text/number';
                content = content.toString();
              }
              else {
                options.contentType = 'application/json';
                content = JSON.stringify(content);
              }
            }
            content = Buffer.from(content);
          }
          ch.sendToQueue(queue, content, options);
        }).catch((err): void => {
          console.error(err);
        });
      }).catch(reject);
    });
  }

  /**
   * Receive RPCs from a queue and handle them.
   * @param  {string} queue - The queue name to listen to.
   * @param  {rpcCallback} handler - The actual function handling the call.
   * @param  {bool} [exclusive=true] - Whether to declare an exclusive queue. If set to false, multiple clients can share the same the workload.
   */
  public onRpc(queue: string, handler: RpcReplyCallback, exclusive: boolean = true): void {
    this.pch.then((ch: amqplib.Channel): void => {
      ch.prefetch(1);
      ch.assertQueue(queue, { exclusive, autoDelete: true }).then((q: amqplib.Replies.AssertQueue): Promise<amqplib.Replies.Consume> => {
        return ch.consume(q.queue, (request: amqplib.ConsumeMessage | null): void => {
          let replyCount = 0;
          let reply: ReplyCallback = (response: Error | Buffer | any): void => {
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
                let options: amqplib.Options.Publish = {
                  correlationId: request.properties.correlationId
                };
                if (!Buffer.isBuffer(response)) {
                  if (!options.contentType) {
                    if (typeof response === 'string' || response instanceof String) {
                      options.contentType = 'text/string';
                    }
                    else if (typeof response === 'number') {
                      options.contentType = response.toString();
                      response = response.toString();
                    }
                    else {
                      options.contentType = 'application/json';
                      response = JSON.stringify(response);
                    }
                  }

                  response = Buffer.from(response);
                }
                ch.sendToQueue(request.properties.replyTo, response, options);
              }
            }
          };

          if (request === null) {
            throw new Error('Request for doCall was null');
          }

          let content = request.content;
          let final_content: any = content;
          if (request.properties.contentType === 'application/json') {
            final_content = JSON.parse(content.toString());
          }
          else if (request.properties.contentType === 'text/string') {
            final_content = content.toString();
          }
          else if (request.properties.contentType === 'text/number') {
            final_content = parseFloat(content.toString());
          }
          handler(
            final_content,
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
   * Subscribe to queue creation events
   * @param  {queueEventCallback} handler - Callback to handle the event.
   */
  public onQueueCreated(handler: (properties: amqplib.MessageProperties) => void): void {
    this.onTopic('queue.created', (_, msg): void => {
      handler(msg.properties);
    });
  }

  /**
   * Subscribe to queue deletion events
   * @param  {queueEventCallback} handler - Callback to handle the event.
   */
  public onQueueDeleted(handler: (properties: amqplib.MessageProperties) => void): void {
    this.onTopic('queue.deleted', (_, msg): void => {
      handler(msg.properties);
    });
  }
}

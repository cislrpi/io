import RedisClient from 'ioredis';
import Io from './io';

export class Redis extends RedisClient {
  public options: RedisClient.RedisOptions;

  public constructor(io: Io) {
    const config = io.config;
    if (config.get('redis') === true) {
      config.set('redis', {});
    }
    config.defaults({
      store: {
        redis: {
          host: 'localhost',
          port: 6379,
          db: 0
        }
      }
    });

    super(config.get('redis'));
    this.options = config.get('redis');
  }

  /**
   * Subscribe to changes on a key.
   * @param  {string} key - The key.
   * @param  {function} handler - Callback function to handle the change event
   * @returns {any} - The subscriber. Use subsriber.unsubscribe((err, result)=>{}) to unsubscribe.
   */
  public onChange(key: string, handler: Function): RedisClient.Redis {
    const keyChannel = `__keyspace@${this.options.db}__:${key}`;

    const subscriber = this.duplicate();
    subscriber.subscribe(keyChannel);
    subscriber.on('message', (channel, event): void => {
      if (channel === keyChannel) {
        handler(event);
      }
    });
    return subscriber;
  }
}

import * as redis from 'redis';
import Bluebird from 'bluebird';
import Io from './io';

// Declare the types we need from the result of doing 
// Bluebird.promisfyAll on the redis.RedisClient
declare module 'redis' {
  export interface RedisClient extends NodeJS.EventEmitter {
    hsetAsync(key: string, field: string, value: any): Promise<number>;
    hgetallAsync(key: string): Promise<any>;
    hgetAsync(key: string, field: string): Promise<any>;
    hdelAsync(key: string, field: string): Promise<number>;
    saddAsync(key: string, values: string[]): Promise<number>;
    smembersAsync(key: string): Promise<string[]>;
    sremAsync(key: string, value: any): Promise<number>;
    getsetAsync(key: string, value: any): Promise<any>;
    getAsync(key: string): Promise<any | null>;
    delAsync(key: string): Promise<any>;
  }
}

export class Redis {
  public database: string | number;
  public client: redis.RedisClient;

  public constructor(io: Io) {
    let config = io.config;
    if (config.get('store') === true) {
      config.set('store', {});
    }
    config.defaults({
      store: {
        store: {
          url: 'redis://localhost:6379'
        }
      }
    });

    let options = config.get('store');
    let start = options.url.startsWith('redis://') ? 8 : 0;
    const components = options.url.substring(start).split('/');
    this.database = (components.length > 1) ? components[1] : 0;
    // Append default port if one is not on url
    if (!/:[0-9]{1,5}/.test(options.url)) {
      options.url = `${options.url}:6379`;
    }

    if (!options.url.startsWith('redis://')) {
      options.url = `redis://${options.url}`;
    }

    /**
     * The node-redis client object. Only use this if you want to use advanced redis commands.
     * @type node-redis
     */
    const oldClient = redis.createClient(options);
    this.client = Bluebird.promisifyAll(oldClient) as redis.RedisClient;
    this.client.on('error', (err: string): void => {
      throw new Error(err);
    });
    this.client.select(this.database);
  }

  /**
   * Add a field to a hash with the given value. If the field exists, update it.
   * @param  {string} key - The hash key.
   * @param  {string} field - The field name to add to the hash.
   * @param  {any} value - The value to set.
   * @returns {Promise} The promise that resolves to 1 or 0.
   */
  public addToHash(key: string, field: string, value: any): Promise<number> {
    return this.client.hsetAsync(key, field, value);
  }

  /**
   * Retrieve a hash.
   * @param  {string} key - The hash key.
   * @returns {Promise} Empty object if the key doesn't exist or the hash object.
   */
  public getHash(key: string): Promise<any> {
    return this.client.hgetallAsync(key).then((r: any): any => {
      return (r === null) ? {} : r;
    });
  }

  /**
   * Retrieve a hash field
   * @param  {string} key - The hash key.
   * @param  {string} field - The field to retrieve.
   * @returns {Promise} The field value.
   */
  public getHashField(key: string, field: string): Promise<any> {
    return this.client.hgetAsync(key, field);
  }

  /**
   * Remove a field from hash.
   * @param  {string} key - The hash key.
   * @param  {string} field - The field to remove.
   * @returns {Promise} Resolves to 1 if succeed.
   */
  public removeFromHash(key: string, field: string): Promise<number> {
    return this.client.hdelAsync(key, field);
  }

  /**
   * Add a value to a set.
   * @param  {string} key - The set key.
   * @param  {...string} values - The values to add.
   * @returns {Promise} Resolves to the number of values added.
   */
  public addToSet(key: string, ...values: string[]): Promise<number> {
    return this.client.saddAsync(key, values);
  }

  /**
   * Get all values from a set.
   * @param  {string} key - The set key.
   * @returns {Promise} Resolves to an array of values.
   */
  public getSet(key: string): Promise<string[]> {
    return this.client.smembersAsync(key);
  }

  /**
   * Remove a value from a set.
   * @param  {string} key - The set key.
   * @param  {any} val - The value to remove.
   * @returns {Promise} Resolves to 1 if succeed.
   */
  public removeFromSet(key: string, val: any): Promise<number> {
    return this.client.sremAsync(key, val);
  }

  /**
   * Set value to a key.
   * @param  {string} key - The key.
   * @param  {any} value - The value.
   * @returns {Promise} - returns the old value of the key
   */
  public setState(key: string, value: any): Promise<any> {
    return this.client.getsetAsync(key, value);
  }

  /**
   * Get key value.
   * @param  {string} key - The key.
   * @returns {Promise} Resolves to the value or null if non exists.
   */
  public getState(key: string): Promise<any | null> {
    return this.client.getAsync(key);
  }

  /**
   * Delete a key.
   * @param  {string} key - The key.
   * @returns {Promise} Resolves to 1 if succeed.
   */
  public del(key: string): Promise<number> {
    return this.client.delAsync(key);
  }

  /**
   * Subscribe to changes on a key.
   * @param  {string} key - The key.
   * @param  {function} handler - Callback function to handle the change event
   * @returns {any} - The subscriber. Use subsriber.unsubscribe((err, result)=>{}) to unsubscribe.
   */
  public onChange(key: string, handler: Function): any {
    const keyChannel = `__keyspace@${this.database}__:${key}`;

    const subscriber = this.client.duplicate();
    subscriber.subscribe(keyChannel);
    subscriber.on('message', (channel: string, event): void => {
      if (channel === keyChannel) {
        handler(event);
      }
    });
    return subscriber;
  }
}

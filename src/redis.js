const redis = require('redis');
const bluebird = require('bluebird');
bluebird.promisifyAll(redis);

/**
 * Class representing the Store object.
 */
class Redis {
  /**
   * @param {object} options Options to configure Redis
   */
  constructor(celio) {
    let options = celio.config.get('store');
    const components = options.url.split('/');
    this.database = (components.length > 1) ? components[1] : 0;
    // Append default port if one is not on url
    if (!/\:[0-9]{1,5}$/.test(options.url)) {
      options.url = `${options.url}:6379`;
    }

    if (!options.url.startsWith('redis://')) {
      options.url = `redis://${options.url}`;
    }
    
    /**
     * The node-redis client object. Only use this if you want to use advanced redis commands.
     * @type node-redis
     */
    this.client = redis.createClient(options);
    this.client.on('error', (err) => {
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
  addToHash(key, field, value) {
    return this.client.hsetAsync(key, field, value);
  }

  /**
   * Retrieve a hash.
   * @param  {string} key - The hash key.
   * @returns {Promise} Empty object if the key doesn't exist or the hash object.
   */
  getHash(key) {
    return this.client.hgetallAsync(key).then(r => {
      return (r === null) ? {} : r;
    });
  }

  /**
   * Retrieve a hash field
   * @param  {string} key - The hash key.
   * @param  {string} field - The field to retrieve.
   * @returns {Promise} The field value.
   */
  getHashField(key, field) {
    return this.client.hgetAsync(key, field);
  }

  /**
   * Remove a field from hash.
   * @param  {string} key - The hash key.
   * @param  {string} field - The field to remove.
   * @returns {Promise} Resolves to 1 if succeed.
   */
  removeFromHash(key, field) {
    return this.client.hdelAsync(key, field);
  }

  /**
   * Add a value to a set.
   * @param  {string} key - The set key.
   * @param  {...string} values - The values to add.
   * @returns {Promise} Resolves to the number of values added.
   */
  addToSet(key, ...values) {
    return this.client.saddAsync(key, values);
  }

  /**
   * Get all values from a set.
   * @param  {string} key - The set key.
   * @returns {Promise} Resolves to an array of values.
   */
  getSet(key) {
    return this.client.smembersAsync(key);
  }

  /**
   * Remove a value from a set.
   * @param  {string} key - The set key.
   * @param  {any} val - The value to remove.
   * @returns {Promise} Resolves to 1 if succeed.
   */
  removeFromSet(key, val) {
    return this.client.sremAsync(key, val);
  }

  /**
   * Set value to a key.
   * @param  {string} key - The key.
   * @param  {any} value - The value.
   * @returns {Promise} - returns the old value of the key
   */
  setState(key, value) {
    return this.client.getsetAsync(key, value);
  }

  /**
   * Get key value.
   * @param  {string} key - The key.
   * @returns {Promise} Resolves to the value or null if non exists.
   */
  getState(key) {
    return this.client.getAsync(key);
  }

  /**
   * Delete a key.
   * @param  {string} key - The key.
   * @returns {Promise} Resolves to 1 if succeed.
   */
  del(key) {
    return this.client.delAsync(key);
  }

  /**
   * Subscribe to changes on a key.
   * @param  {string} key - The key.
   * @param  {function} handler - Callback function to handle the change event
   * @returns {any} - The subscriber. Use subsriber.unsubscribe((err, result)=>{}) to unsubscribe.
   */
  onChange(key, handler) {
    const keyChannel = `__keyspace@${this.database}__:${key}`;

    const subscriber = this.client.duplicate();
    subscriber.subscribe(keyChannel);
    subscriber.on('message', (channel, event) => {
      if (channel === keyChannel) {
        handler(event);
      }
    });
    return subscriber;
  }
}

module.exports = {
  config: 'store',
  variable: 'redis',
  class: Redis
};

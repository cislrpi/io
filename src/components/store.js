const redis = require('redis')
const bluebird = require('bluebird')
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

/**
 * Class representing the Store object.
 */
class Store {
    /**
     * Use {@link CELIO#store} instead.
     */
    constructor(options) {
        if (options.url) {
            options.url = 'redis://' + options.url
        }
        /**
         * The node-redis client object. Only use this if you want to use advanced redis commands.
         * @type node-redis
         */
        this.client = redis.createClient(options)
    }

    /**
     * Add a field to a hash with the given value. If the field exists, update it.
     * @param  {string} key - The hash key.
     * @param  {string} field - The field name to add to the hash.
     * @param  {any} value - The value to set.
     * @returns {Promise} The promise that resolves to 1 or 0.
     */
    addToHash(key, field, value) {
        return this.client.hsetAsync(key, field, value)
    }

    /**
     * Retrieve a hash.
     * @param  {string} key - The hash key.
     * @returns {Promise} Empty object if the key doesn't exist or the hash object.
     */
    getHash(key) {
        return this.client.hgetallAsync(key).then(r => {
            if (r == null) return {}
            else return r
        })
    }

    /**
     * Retrieve a hash field
     * @param  {string} key - The hash key.
     * @param  {string} field - The field to retrieve.
     * @returns {Promise} The field value.
     */
    getHashField(key, field) {
        return this.client.hgetAsync(key, field)
    }

    /**
     * Remove a field from hash.
     * @param  {string} key - The hash key.
     * @param  {string} field - The field to remove.
     * @returns {Promise} Resolves to 1 if succeed.
     */
    removeFromHash(key, field) {
        return this.client.hdelAsync(key, field)
    }

    /**
     * Add a value to a set.
     * @param  {string} key - The set key.
     * @param  {any} value - The value to add.
     * @returns {Promise} Resolves to 1 if succeed, 0 if the value already exists.
     */
    addToSet(key, value) {
        return this.client.saddAsync(key, value)
    }

    /**
     * Get all values from a set.
     * @param  {string} key - The set key.
     * @returns {Promise} Resolves to an array of values.
     */
    getSet(key) {
        return this.client.smembersAsync(key)
    }

    /**
     * Remove a value from a set.
     * @param  {string} key - The set key.
     * @param  {any} val - The value to remove.
     * @returns {Promise} Resolves to 1 if succeed.
     */
    removeFromSet(key, val) {
        return this.client.sremAsync(key, val)
    }

    /**
     * Set value to a key.
     * @param  {string} key - The key.
     * @param  {any} value - The value.
     * @returns {Promise} Resolves to 'OK' if succeed.
     */
    setState(key, value) {
        return this.client.setAsync(key, value)
    }

    /**
     * Get key value.
     * @param  {string} key - The key.
     * @returns {Promise} Resolves to the value or null if non exists.
     */
    getState(key) {
        return this.client.getAsync(key)
    }
    /**
     * Delete a key.
     * @param  {string} key - The key.
     * @returns {Promise} Resolves to 1 if succeed.
     */
    delState(key) {
        return this.client.delAsync(key)
    }
}

module.exports = Store

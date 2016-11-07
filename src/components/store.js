const redis = require('redis')
const bluebird = require('bluebird')
bluebird.promisifyAll(redis.RedisClient.prototype)
bluebird.promisifyAll(redis.Multi.prototype)

/**
 * Class representing the Store object.
 * @prop client - The node-redis client object.
 */
class Store {
    /**
     * @param  {Object} options - redis connection configuration.
     * @param  {string} options.url - redis url.
     * @param  {string} [options.password] - redis password.
     */
    constructor(options) {
        if (options.url) {
            options.url = 'redis://' + options.url
        }
        this.client = redis.createClient(options)
    }

    /**
     * @param  {string} key - The key for the hash.
     * @param  {string} field - The field name to add to the hash.
     * @param  {any} value - The value to set.
     * @returns {Promise} The promise that resolves to 1 or 0.
     */
    addToHash(key, field, value) {
        return this.client.hsetAsync(key, field, value)
    }

    getHash(key) {
        return this.client.hgetallAsync(key).then(r => {
            if (r == null) return {}
            else return r
        })
    }

    getHashField(key, field) {
        return this.client.hgetAsync(key, field)
    }

    removeFromHash(key, field) {
        return this.client.hdelAsync(key, field)
    }

    addToSet(key, value) {
        return this.client.saddAsync(key, value)
    }

    getSet(key) {
        return this.client.smembersAsync(key)
    }

    removeFromSet(key, val) {
        return this.client.sremAsync(key, val)
    }

    setState(key, value) {
        return this.client.setAsync(key, value)
    }

    getState(key) {
        return this.client.getAsync(key)
    }

    delState(key) {
        return this.client.delAsync(key)
    }

    getRedisClient() {
        return this.client
    }
}

module.exports = Store

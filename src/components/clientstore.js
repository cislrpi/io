require('whatwg-fetch');
const redis = require('webdismay');

module.exports = class Store {
    constructor(options) {
        let params = {
            endPoint: 'http://'+options.url+':7379/'
        }
        if (options.username && options.password) {
            params.headers = {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: "Basic " + btoa(`${options.username}:${options.password}`)
            }
            params.putHeaders = {
                'Accept': 'application/json',
                'Content-Type': 'application/octet-stream',
                Authorization: "Basic " + btoa(`${options.username}:${options.password}`)
            }
        }
        redis.configure(params)
        this.client = redis
    }

    addToHash(key , field, value) {
        return new this.client.Hash(key).setnx(field, value)
    }

    getHash(key) {
        return new this.client.Hash(key).getAll()
    }

    removeFromHash(key,field) {
        return new this.client.Hash(key).del(field)
    }

    addToSet(key , value) {
        return new this.client.Rset(key).add(value)
    }

    getSet(key) {
        return new this.client.Rset(key).getAll()
    }

    removeFromSet(key, val) {
        return new this.client.Rset(key).remove(val)
    }

    setState(key , value) {
        return new this.client.Key(key).set(value)
    }

    getState(key) {
        return new this.client.Key(key).get()
    }

    delState(key) {
        return new this.client.Key(key).del()
    }

    getRedisClient() {
        return this.client
    }

}
require('whatwg-fetch')
const redis = require('webdismay')

module.exports = class Store {
    constructor(options) {
        let params = {
            endPoint: 'http://' + options.url + ':7379/',
            postProcess: null
        }
        if (options.username && options.password) {
            params.headers = {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: 'Basic ' + btoa(`${options.username}:${options.password}`)
            }
            params.putHeaders = {
                'Accept': 'application/json',
                'Content-Type': 'application/octet-stream',
                Authorization: 'Basic ' + btoa(`${options.username}:${options.password}`)
            }
        }
        redis.configure(params)
        this.client = redis
    }

    addToHash(key, field, value) {
        return this.client.request(['hset', key, field, value])
    }

    getHash(key) {
        return this.client.hash(key).getAll()
    }

    getHashField(key, field) {
        return this.client.hash(key).get(field)
    }

    removeFromHash(key, field) {
        return this.client.hash(key).del(field)
    }

    addToSet(key, value) {
        return this.client.rset(key).add(value)
    }

    getSet(key) {
        return this.client.rset(key).getAll()
    }

    removeFromSet(key, val) {
        return this.client.rset(key).remove(val)
    }

    setState(key, value) {
        return this.client.key(key).set(value).then(status => {
            if (status) return 'OK'
            else return null
        })
    }

    getState(key) {
        return this.client.key(key).get()
    }

    delState(key) {
        return this.client.key(key).del()
    }
}
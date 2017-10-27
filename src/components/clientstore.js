const redis = require('webdismay')

module.exports = class Store {
    constructor(options) {
        if (!options.webdis_port) {
            options.webdis_port = 7379
        }

        const components = options.url.split('/')
        if (components.length > 1) {
            this.database = components[1]
        } else {
            this.database = '0'
        }

        this.url = `http://${components[0]}:${options.webdis_port}/`

        let params = {
            endPoint: this.url,
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

    addToSet(key, ...values) {
        return this.client.rset(key).add(...values)
    }

    getSet(key) {
        return this.client.rset(key).getAll()
    }

    removeFromSet(key, val) {
        return this.client.rset(key).remove(val)
    }

    setState(key, value) {
        return this.client.key(key).getSet(value)
    }

    getState(key) {
        return this.client.key(key).get()
    }

    del(key) {
        return this.client.key(key).del()
    }

    // not supporting unsubscribe yet
    onChange(key, handler) {
        const xhr = new XMLHttpRequest()
        let previous_response_length = 0

        const keyChannel = `__keyspace@${this.database}__:${key}`
        xhr.open('POST', this.url, true)
        xhr.onreadystatechange = checkData
        xhr.send(`SUBSCRIBE/${keyChannel}`)

        function checkData() {
            if (xhr.readyState === 3) {
                const response = xhr.responseText
                const chunk = response.slice(previous_response_length)
                previous_response_length = response.length
                const command = JSON.parse(chunk)
                if (command.SUBSCRIBE[0] === 'message') {
                    handler(command.SUBSCRIBE[2])
                }
            }
        }
    }
}

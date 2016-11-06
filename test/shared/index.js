const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
const assert = chai.assert

exports.celio = function () {
    it('should have all the core fields and methods', function () {
        assert.isObject(this.io.config, 'config')
        // for some reason, the promise doesn't pass object test
        assert.ok(this.io.pconn, 'pconn')
        assert.isObject(this.io.speaker, 'speaker')
        assert.isObject(this.io.transcript, 'transcript')
        assert.isObject(this.io.displayContext, 'displayContext')
        assert.isObject(this.io.store, 'store')

        assert.isFunction(this.io.generateUUID, 'generateUUID')
        assert.isFunction(this.io.call, 'call')
        assert.isFunction(this.io.doCall, 'doCall')
        assert.isFunction(this.io.publishTopic, 'publishTopic')
        assert.isFunction(this.io.onTopic, 'onTopic')
    })

    it('should publish string and subscribe to topics', function (done) {
        const topic = 'string.test'
        const data = 'hello'
        this.io.onTopic(topic, function (content, header) {
            assert.equal(content.toString(), data)
            done()
        })
        // delay message until subscriber is set up
        const self = this
        setTimeout(function () {
            self.io.publishTopic(topic, data)
        }, 50)
    })

    it('should return timeout error when RPC failed', function () {
        const queue = 'rpc-test3'
        const m = 'Request timed out after'
        return assert.isRejected(this.io.call(queue, 'hello', { expiration: 50 }), Error, m)
    })

    it('should do RPC', function () {
        const queue = 'rpc-test'
        const ping = 'hello'
        const pong = 'world'
        this.io.doCall(queue, function (request, reply) {
            assert.equal(request.content.toString(), ping)
            reply(pong)
        })
        return this.io.call(queue, ping).then(resp => assert.equal(resp.toString(), pong))
    })

    it('should allow RPC to return error', function () {
        const queue = 'rpc-test2'
        const ping = 'hello'
        const pong = 'error'
        this.io.doCall(queue, function (request, reply) {
            assert.equal(request.content.toString(), ping)
            reply(new Error(pong))
        })
        return assert.isRejected(this.io.call(queue, ping), Error, pong)
    })

    it('should return error when RPC receiver reply more than once', function (done) {
        const queue = 'rpc-test4'
        const ping = 'hello'
        const pong = 'world'
        this.io.doCall(queue, function (request, reply) {
            assert.equal(request.content.toString(), ping)
            reply(pong)
            assert.throws(() => reply(pong), Error, 'Replied more than once.')
            done()
        })
        this.io.call(queue, ping)
    })
}

exports.store = function () {
    const OK = 'OK'
    const key = 'test'
    const field = 'field'
    const value = 'hello'
    const value2 = 'world'

    it('should have working methods for key', function () {
        return this.io.store.delState(key)
            .then(_ => this.io.store.getState(key))
            .then(v => {
                assert.isNull(v)
                return this.io.store.setState(key, value)
            }).then(m => {
                assert.equal(m, OK, 'first set')
                return this.io.store.setState(key, value2)
            }).then(m => {
                assert.equal(m, OK, 'second set')
                return this.io.store.getState(key)
            }).then(v => {
                assert.equal(v, value2)
                return this.io.store.delState(key)
            }).then(m => {
                assert.equal(m, 1)
            })
    })
    it('should have working methods for hash', function () {
        return this.io.store.getHash(key).then(v => {
            assert.deepEqual(v, {})
            return this.io.store.addToHash(key, field, value)
        }).then(m => {
            assert.equal(m, 1, 'first add')
            return this.io.store.getHashField(key, field)
        }).then(v => {
            assert.equal(v, value)
            return this.io.store.addToHash(key, field, value2)
        }).then(m => {
            assert.equal(m, 0)
            return this.io.store.getHash(key)
        }).then(v => {
            assert.deepEqual(v, {field: value2})
            return this.io.store.removeFromHash(key, field)
        }).then(m => {
            assert.equal(m, 1)
            return this.io.store.getHash(key)
        }).then(o => {
            assert.deepEqual(o, {})
            return this.io.store.delState(key)
        })
    })
    it('should have working methods for set', function () {
        return this.io.store.getSet(key).then(v => {
            assert.deepEqual(v, [])
            return this.io.store.addToSet(key, value)
        }).then(m => {
            assert.equal(m, 1)
            return this.io.store.getSet(key)
        }).then(array => {
            assert.deepEqual(array, [value])
            return this.io.store.addToSet(key, value)
        }).then(m => {
            assert.equal(m, 0)
            return this.io.store.removeFromSet(key, value)
        }).then(m => {
            assert.equal(m, 1)
            return this.io.store.delState(key)
        })
    })
}

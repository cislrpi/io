const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
const assert = chai.assert

exports.celio = function() {
    it('should have all the core fields and methods', function() {
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

    it('should publish string and subscribe to topics', function(done) {
        const topic = 'string.test'
        const data = 'hello'
        this.io.onTopic(topic, function(content, header) {
            assert.equal(content.toString(), data)
            done()
        })
        // delay message until subscriber is set up
        const self = this
        setTimeout(function() {
            self.io.publishTopic(topic, data)
        }, 50)
    })

    it('should return timeout error when RPC failed', function() {
        const queue = 'rpc-test3'
        const m = 'Request timed out after'
        return assert.isRejected(this.io.call(queue, 'hello', {expiration: 50}), Error, m)
    })

    it('should do RPC', function() {
        const queue = 'rpc-test'
        const ping = 'hello'
        const pong = 'world'
        this.io.doCall(queue, function(request, reply) {
            assert.equal(request.content.toString(), ping)
            reply(pong)
        })
        return this.io.call(queue, ping).then(resp => assert.equal(resp.toString(), pong))
    })

    it('should allow RPC to return error', function() {
        const queue = 'rpc-test2'
        const ping = 'hello'
        const pong = 'error'
        this.io.doCall(queue, function(request, reply) {
            assert.equal(request.content.toString(), ping)
            reply(new Error(pong))
        })
        return assert.isRejected(this.io.call(queue, ping), Error, pong)
    })

    it('should return error when RPC receiver reply more than once', function(done) {
        const queue = 'rpc-test4'
        const ping = 'hello'
        const pong = 'world'
        this.io.doCall(queue, function(request, reply) {
            assert.equal(request.content.toString(), ping)
            reply(pong)
            assert.throws(() => reply(pong), Error, 'Replied more than once.')
            done()
        })
        this.io.call(queue, ping)
    })
}

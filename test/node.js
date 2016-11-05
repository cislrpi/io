const CELIO = require('../lib/index')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const assert = require('chai').assert

describe('CELIO', function() {
    const io = new CELIO('test/cog.json')
    it('should have all the core fields', function() {
        assert.typeOf(io.config, 'object')
        assert.typeOf(io.pconn, 'object')
        assert.typeOf(io.pch, 'object')
        assert.typeOf(io.speaker, 'object')
        assert.typeOf(io.transcript, 'object')
        assert.typeOf(io.displayContext, 'object')
    })

    it('should have all the core methods', function() {
        assert.typeOf(io.generateUUID, 'function')
        assert.typeOf(io.call, 'function')
        assert.typeOf(io.doCall, 'function')
        assert.typeOf(io.publishTopic, 'function')
        assert.typeOf(io.onTopic, 'function')
        assert.typeOf(io.createHotspot, 'function')
    })

    it('should publish string and subscribe to topics', function(done) {
        const topic = 'string.test'
        const data = 'hello'
        io.onTopic(topic, function(content, header) {
            assert.equal(header.routingKey, topic)
            assert.equal(content.toString(), data)
            done()
        })
        // delay message until subscriber is set up
        setTimeout(function() {
            io.publishTopic(topic, data)
        }, 50)
    })

    it('should publish binary and subscribe to topics', function(done) {
        const topic = 'binary.test'
        const data = [1, 2, 3]
        io.onTopic(topic, function(content, header) {
            assert.equal(header.routingKey, topic)
            assert.deepEqual(content, new Buffer(data))
            done()
        })
        setTimeout(function() {
            io.publishTopic(topic, data)
        }, 50)
    })

    it('should do RPC', function() {
        const queue = 'rpc-test'
        const ping = 'hello'
        const pong = 'world'
        io.doCall(queue, function(request, reply) {
            assert.equal(request.content.toString(), ping)
            reply(pong)
        })
        return io.call(queue, ping).then(resp => assert.equal(resp.toString(), pong))
    })

    it('should allow RPC to return error', function() {
        const queue = 'rpc-test2'
        const ping = 'hello'
        const pong = 'error'
        io.doCall(queue, function(request, reply) {
            assert.equal(request.content.toString(), ping)
            reply(new Error(pong))
        })
        return assert.isRejected(io.call(queue, ping), Error, pong)
    })

    it('should return timeout error when RPC failed', function() {
        const queue = 'rpc-test3'
        const m = 'Request timed out after'
        return assert.isRejected(io.call(queue, 'hello', {expiration: 50}), Error, m)
    })

    it('should return error when RPC receiver reply more than once', function(done) {
        const queue = 'rpc-test4'
        const ping = 'hello'
        const pong = 'world'
        io.doCall(queue, function(request, reply) {
            assert.equal(request.content.toString(), ping)
            reply(pong)
            assert.throws(() => reply(pong), Error, 'Replied more than once.')
            done()
        })
        io.call(queue, ping)
    })
})

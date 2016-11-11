const chai = require('chai')
chai.use(require('chai-as-promised'))
exports.display = require('./display')
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
        }, 100)
    })

    it('should return timeout error when RPC failed', function () {
        const queue = 'rpc-test3'
        const m = 'Request timed out after'
        return assert.isRejected(this.io.call(queue, 'hello', { expiration: 100 }), Error, m)
    })

    it('should do RPC', function () {
        const queue = 'rpc-test'
        const ping = 'hello'
        const pong = 'world'
        this.io.doCall(queue, function (request, reply) {
            assert.equal(request.content.toString(), ping)
            reply(pong)
        })
        return this.io.call(queue, ping).then(resp => assert.equal(resp.content.toString(), pong))
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
    const key2 = 'test2'
    const field = 'field'
    const value = 'hello'
    const value2 = 'world'

    it('should have working methods for key', function () {
        return this.io.store.del(key)
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
                return this.io.store.del(key)
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
            assert.deepEqual(v, { field: value2 })
            return this.io.store.removeFromHash(key, field)
        }).then(m => {
            assert.equal(m, 1)
            return this.io.store.getHash(key)
        }).then(o => {
            assert.deepEqual(o, {})
            return this.io.store.del(key)
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
            return this.io.store.del(key)
        })
    })

    it('should subscribe to changes', function (done) {
        setTimeout(() => {
            this.io.store.setState(key, value)
        }, 100)

        setTimeout(() => {
            this.io.store.setState(key2, value)
        }, 200)

        this.io.store.onChange(key, event => {
            assert.equal(event, 'set')
        })

        this.io.store.onChange(key2, event => {
            assert.equal(event, 'set')
            this.io.store.del(key2)
            this.io.store.del(key)
            done()
        })
    })
}

exports.speaker = function () {
    it('should speak, stop, change volume, on(Begin/End)Speak', function () {
        this.timeout(20000)
        const phi = this.io.speaker.speak('Hi').then(m => m.content.toString())
        const pstop = new Promise((resolve, reject) => {
            setTimeout(() => {
                this.io.speaker.stop().then(m => resolve(m.content.toString()))
            }, 14000)
        })

        const pbegin = new Promise((resolve, reject) => {
            this.io.speaker.onBeginSpeak(msg => {
                resolve(msg.text)
            })
        })

        const pend = new Promise((resolve, reject) => {
            this.io.speaker.onEndSpeak(msg => {
                resolve(msg.text)
            })
        })

        const plong = new Promise((resolve, reject) => {
            setTimeout(() => {
                this.io.speaker.speak('I will now reduce my volume').then(m => {
                    assert.equal(m.content, 'succeeded')
                    return this.io.speaker.reduceVolume(50)
                }).then(m => {
                    assert.equal(m.content, 'done')
                    return this.io.speaker.speak('testing testing. I will now increase my volume')
                }).then(m => {
                    assert.equal(m.content, 'succeeded')
                    return this.io.speaker.increaseVolume(50)
                }).then(m => {
                    assert.equal(m.content, 'done')
                    return this.io.speaker.speak('testing testing. I will be stopped in 1, 2, 3, 4, 5, 6')
                }).then(m => resolve(m.content.toString()))
            }, 100)
        })
        return Promise.all([
            assert.becomes(phi, 'succeeded', 'speak text'),
            assert.becomes(pstop, 'done', 'send stop'),
            assert.becomes(plong, 'interrupted', 'change volume, receive stop'),
            assert.becomes(pbegin, 'Hi', 'onBeginSpeak'),
            assert.becomes(pend, 'Hi', 'onEndSpeak')
        ])
    })
}

exports.transcript = function () {
    it('should receive events in onAll, onFinal, onInterim', function () {
        this.timeout(10000)
        const pAll = new Promise((resolve, reject) => {
            this.io.transcript.onAll(msg => resolve(msg))
        })
        const pFinal = new Promise((resolve, reject) => {
            this.io.transcript.onFinal(msg => resolve(msg))
        })
        const pInterim = new Promise((resolve, reject) => {
            this.io.transcript.onInterim(msg => resolve(msg))
        })

        return Promise.all([
            assert.eventually.property(pAll, 'workerID'),
            assert.eventually.property(pAll, 'channelIndex'),
            assert.eventually.property(pAll, 'messageID'),
            assert.eventually.property(pAll, 'time_captured'),
            assert.eventually.deepProperty(pAll, 'result.alternatives'),
            assert.eventually.deepProperty(pFinal, 'result.final'),
            assert.eventually.deepProperty(pFinal, 'result.alternatives'),
            assert.eventually.deepProperty(pInterim, 'result.alternatives')
        ])
    })

    it('should tagChannel', function (done) {
        this.timeout(10000)
        const speaker = this.io.generateUUID()
        let oldSpeaker
        let tagged = false
        this.io.transcript.onInterim(msg => {
            if (!tagged) {
                if (msg.speaker !== speaker) {
                    oldSpeaker = msg.speaker
                    this.io.transcript.tagChannel(msg.workerID, msg.channelIndex, speaker)
                } else if (msg.speaker === speaker) {
                    this.io.transcript.tagChannel(msg.workerID, msg.channelIndex, oldSpeaker)
                    tagged = true
                    done()
                }
            }
        })
    })

    it('should stopPublishing (say "start listening" to resume transcription)', function (done) {
        this.timeout(8000)
        this.io.transcript.stopPublishing()
        this.io.transcript.onInterim(msg => assert.fail())
        setTimeout(function () {
            done()
        }, 5000)
    })
}


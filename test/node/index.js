const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
const assert = chai.assert

const CELIO = require('../../src/index')
const shared = require('../shared/')

describe('node', function () {
    describe('CELIO', function () {
        beforeEach(function () {
            this.io = new CELIO('test/cog.json')
        })

        shared.celio()

        it('should publish binary and subscribe to topics', function (done) {
            const topic = 'binary.test'
            const data = [1, 2, 3]
            this.io.onTopic(topic, function (content, header) {
                assert.deepEqual(content, new Buffer(data))
                done()
            })
            const self = this
            setTimeout(function () {
                self.io.publishTopic(topic, data)
            }, 50)
        })
    })

    describe('Store', function () {
        beforeEach(function () {
            this.io = new CELIO('test/cog.json')
        })

        shared.store()
    })

    describe('Speaker (require speaker-worker to be running)', function () {
        beforeEach(function () {
            this.io = new CELIO('test/cog.json')
        })

        shared.speaker()
    })
})

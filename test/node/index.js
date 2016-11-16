const chai = require('chai')
chai.use(require('chai-as-promised'))

const assert = chai.assert

const CELIO = require('../../src/index')
const shared = require('../shared/')

describe('node', function () {
    describe.skip('CELIO', function () {
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

    describe.skip('Store', function () {
        beforeEach(function () {
            this.io = new CELIO('test/cog.json')
        })

        shared.store()
    })

    describe.skip('Speaker (require speaker-worker to be running)', function () {
        beforeEach(function () {
            this.io = new CELIO('test/cog.json')
        })

        shared.speaker()
    })

    describe.skip('Transcript (require transcript-worker to be running and >>>>you talking<<<', function () {
        beforeEach(function () {
            this.io = new CELIO('test/cog.json')
        })

        shared.transcript()
    })

    describe('Display (require display-worker to be running)', function () {
        beforeEach(function () {
            this.io = new CELIO('test/cog.json')
        })
        shared.display.display()
    })
})

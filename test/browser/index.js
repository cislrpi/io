const CELIO = require('../../src/client')
const shared = require('../shared/')
const config = require('../cog.json')

describe('browser', function () {
    describe('CELIO', function () {
        beforeEach(function () {
            this.io = new CELIO(config)
        })

        shared.celio()
    })

    describe('Store', function () {
        beforeEach(function () {
            this.io = new CELIO(config)
        })

        shared.store()
    })

    describe('Speaker (require speaker-worker to be running)', function () {
        beforeEach(function () {
            this.io = new CELIO(config)
        })

        shared.speaker()
    })

    describe('Transcript (require transcript-worker to be running and >>>>you talking<<<', function () {
        beforeEach(function () {
            this.io = new CELIO(config)
        })

        shared.transcript()
    })
})

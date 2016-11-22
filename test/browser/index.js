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

    describe.skip('Rabbit Manager', function () {
        beforeEach(function () {
            this.io = new CELIO(config)
        })
        shared.rabbitManager()
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

    describe('Display (require display-worker to be running)', function () {
        beforeEach(function () {
            this.io = new CELIO(config)
        })
        shared.display.display()
    })

    describe.skip('Multiple Display Worker (requires two or more display-workers to be running)', function () {
        beforeEach(function () {
            this.io = new CELIO('test/cog.json')
        })
        shared.multidisplay.multidisplay()
    })
})

const CELIO = require('../../src/client')
const shared = require('../shared/')
const config = require('../cog.json')

describe('CELIO-browser', function () {
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

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')

chai.use(chaiAsPromised)
const assert = chai.assert

const CELIO = require('../../src/client')
const shared = require('../shared/')
const config = require('../cog.json')

describe('CELIO-browser', function () {
    beforeEach(function () {
        this.io = new CELIO(config)
    })

    shared.celio()
})

describe('store', function () {
    beforeEach(function () {
        this.io = new CELIO(config)
    })

    shared.store()
})

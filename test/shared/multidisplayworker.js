const chai = require('chai')
const settings = require('./displaytest-settings')
chai.use(require('chai-as-promised'))
const DisplayContext = require('../../src/components/displaycontext')
const ViewObject = require('../../src/components/viewobject')
const assert = chai.assert
let display_context
exports.multidisplay = function () {
    it('should receive active displays details', function () {
        return this.io.displayContext.getDisplays().then(m => {
            console.log(m)
            return assert.equal(typeof (m), 'object', 'returned an object')
        })
    })

    it('should create a display context - venus', function () {
        return this.io.displayContext.create('triptomarsland', settings.multiple_disp_worker_setting).then(m => {
            display_context = m
            return assert.isTrue(display_context instanceof DisplayContext)
        })
    })

    it('should create view objects', function () {
        let _ps = []
        _ps.push(display_context.createViewObject({
            'url': 'http://bl.ocks.org/mbostock/raw/4060606/',
            'left': '0px',
            'top': '0px',
            'width': '800px',
            'height': '600px',
            'nodeintegration': false,
            'uiDraggable': false,
            'uiClosable': false,
            'deviceEmulation': { 'scale': 1.0 }
        }, 'windowA'))
        _ps.push(display_context.createViewObject({
            'url': 'http://bl.ocks.org/mbostock/raw/4062045/',
            'left': '0px',
            'top': '0px',
            'width': '800px',
            'height': '600px',
            'nodeintegration': false,
            'deviceEmulation': { 'scale': 1.0 }
        }, 'windowB'))
        _ps.push(display_context.createViewObject({
            'url': 'http://hint.fm/wind/',
            'left': '0px',
            'top': '0px',
            'width': '800px',
            'height': '600px',
            'nodeintegration': false,
            'deviceEmulation': { 'scale': 0.85 } }, 'windowC'))
        return Promise.all(_ps).then(m => {
            assert.isTrue(m[0] instanceof ViewObject)
        })
    })

    // it('wait for few seconds before closing', function (done) {
    //     this.timeout(18000)
    //     setTimeout(function () {
    //         done()
    //     }, 16000)
    // })

    // it('close display context', function () {
    //     return assert.becomes(display_context.close().then(m => m[0].status), 'success')
    // })
}

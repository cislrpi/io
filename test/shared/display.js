const chai = require('chai')
const settings = require('./displaytest-settings')
chai.use(require('chai-as-promised'))
const DisplayContext = require('../../src/components/displaycontext')
const ViewObject = require('../../src/components/viewobject')

const assert = chai.assert
let display_context
let view_obj
exports.display = function () {
    it('should receive active displays details', function () {
        return this.io.displayContext.getDisplays().then(m => {
            return assert.equal(typeof (m), 'object', 'returned an object')
        })
    })

    it('should create a display context - venus', function () {
        return this.io.displayContext.create('venus', settings.multiple_windows_setting).then(m => {
            display_context = m
            return assert.isTrue(display_context instanceof DisplayContext)
        })
    })

    it('should receive list of display context', function () {
        return this.io.displayContext.list().then(m => {
            console.log(m)
            return assert.isArray(m)
        })
    })

    it('should hide all display context', function () {
        return this.io.displayContext.hideAll().then(m => {
            console.log(m)
            let s = true
            m.forEach(x => {
                if (x.status !== 'success') {
                    s = false
                }
            })
            return assert.isTrue(s)
        })
    })

    it('should set active display context - venus', function () {
        return this.io.displayContext.setActive('venus', true).then(m => {
            console.log(m)
            return assert.isNotFalse(m)
        })
    })

    it('should close the display context - venus', function () {
        return display_context.close().then(m => {
            console.log(m)
            let s = true
            m.forEach(x => {
                if (x.status !== 'success') {
                    s = false
                }
            })
            return assert.isTrue(s)
        })
    })

    it('should open new display context - pluto using default settings and display wiki on pluto', function () {
        return this.io.displayContext.create('pluto').then(m => {
            display_context = m
            return display_context.createViewObject({
                'url': 'http://solarsystem.nasa.gov/planets/pluto/galleries',
                'left': '0px',
                'top': '0px',
                'width': '400px',
                'height': '500px'
            })
        }).then(m => {
            view_obj = m
            return assert.isTrue(m instanceof ViewObject)
        })
    })

    it('should move viewobject', function (done) {
        this.timeout(8000)
        return view_obj.setBounds({
            left: '30px',
            top: '100px'
        }).then(m => {
            console.log(m)
            return assert.equal(m.status, 'success')
        }).then(m => done())
    })

    it('should close the display context - venus', function () {
        return display_context.close().then(m => {
            console.log(m)
            let s = true
            m.forEach(x => {
                if (x.status !== 'success') {
                    s = false
                }
            })
            return assert.isTrue(s)
        })
    })
}

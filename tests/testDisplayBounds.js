



const chai = require('chai')
chai.use(require('chai-eventemitter'))
let sinon = require("sinon");
let sinonChai = require("sinon-chai");
chai.use(sinonChai);

let should = chai.should()
let expect = chai.expect
describe('Display', function() {
  const CELIO = require('../src/index.js');
  const io = new CELIO();

  let display = io.getDisplay();
  let screens = display.getScreens();
  console.log(display.client_id)
  console.log(screens)
  let sc = screens.filter( c => c.screenName == "front")[0]
  console.log(sc)
  
  describe("#ViewObject", function(){
    let win1, vb1, vb2, grid
    it('should return the window object', function(done) {
      display.setAppContext("sunrise")
      win1 = display.createWindow({
          "screenName" : "front",
          "appContext" : "default",
          "x" : sc.bounds.x,
          "y" : sc.bounds.y+30,
          "width"  : sc.bounds.width,
          "height" : sc.bounds.height-30,
      })
      grid = win1.getGrid()
      win1.openDevTools()
      win1.setFontSize("3840px")
      win1.should.be.a("object")
      setTimeout(done, 1500)
    })

    //  it('should set font size of the displaywindow', function(done) {
    //    let ss =  win1.setFontSize("3840px")
    //     ss.should.be.a("object")
    //     setTimeout(done, 1500)
    // })


    it('should return the view object - vb1', function(done) {
        vb1 =  win1.createViewObject({
            "url" : "http://nytimes.com",
            "left" : "1.0em",
            "top" : "0.0em",
            "width" : "1.0em",
            "height" : "1.0em",
            "nodeintegration" : true,
            "cssText":"body{border : 2px solid red; overflow:hidden;}"
        })

        vb1.should.be.a("object")
        setTimeout(done, 1500)
    })

    //  it('should set font size of the displaywindow', function(done) {
    //    let ss =  win1.setFontSize("3840px")
    //     ss.should.be.a("object")
    //     setTimeout(done, 1500)
    // })

    //  it('should return the view object - vb4', function(done) {
    //     vb4 =  win1.createViewObject({
    //         "url" : "http://nytimes.com",
    //         // "position" : {
    //         //     "grid-top" : 2,
    //         //     "grid-left" : 2
    //         // },
    //         "left" : "0.0em",
    //         "top" : "0.0em",
    //         "width" : "1.0em",
    //         "height" : "1.0em",
    //         "nodeintegration" : true,
    //         "cssText":"body{border : 2px solid red; overflow:hidden;}"
    //     })

    //     vb4.should.be.a("object")
    //     setTimeout(done, 2500)
    // })


    // it('should setbounds of vb4', function(done){
      
    //   let s = vb4.setBounds({
    //     "left" : "1.0em",
    //     "top" : "0.5em",
    //     "width" : "0.5em",
    //     "height" : "0.5em",
    //     "scaleContent" : true,
    //     "animation_options" : {
    //         duration : 1000,
    //         fill : 'forwards',
    //         easing : 'linear'
    //      }
    //   })
    //   s.status.should.equal("success")
    //   setTimeout(done, 1500)
    // })

     it('should setbounds of vb1', function(done){
      
      let s = vb1.setBounds({
        "left" : "0.00001em",
        "top" : "0.00001em",
        "width" : "1.0em",
        "height" : "1.0em",
        "scaleContent" : true,
        "animation_options" : {
            duration : 1000,
            fill : 'forwards',
            easing : 'linear'
         }
      })
      s.status.should.equal("success")
      setTimeout(done, 1500)
    })

    //  it('should setbounds of vb1', function(done){
      
    //   let s = vb1.setBounds({
    //     "left" : "0.10em",
    //     "top" : "0.10em",
    //     "width" : "0.50em",
    //     "height" : "0.250em",
    //     "scaleContent" : true,
    //     "animation_options" : {
    //         duration : 1000,
    //         fill : 'forwards',
    //         easing : 'linear'
    //      }
    //   })
    //   s.status.should.equal("success")
    //   setTimeout(done, 1500)
    // })

    // it('should setbounds of vb4', function(done){
      
    //   let s = vb4.setBounds({
    //     "left" : "2.0em",
    //         "top" : "0.0em",
    //         "width" : "1.0em",
    //         "height" : "1.0em",
    //     "scaleContent" : true,
    //     "animation_options" : {
    //         duration : 1000,
    //         fill : 'forwards',
    //         easing : 'linear'
    //      }
    //   })
    //   s.status.should.equal("success")
    //   setTimeout(done, 1500)
    // })
    

    beforeEach(function(done) {
        done()
    })

  })

})
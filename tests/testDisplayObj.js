



const chai = require('chai')
chai.use(require('chai-eventemitter'))
let sinon = require("sinon");
let sinonChai = require("sinon-chai");
chai.use(sinonChai);

// const sleep = require('sleep')

let should = chai.should()
let expect = chai.expect
describe('Display', function() {
  const CELIO = require('../lib/index.js');
  const io = new CELIO();

  let display = io.getDisplay();
  let screens = display.getScreens();
  console.log(display.client_id)
  

  describe('#AppContext', function() {
    it('should return the active display context', function() {
      let x = display.getAppContext()
      x.should.be.a("string")
    })

    it('should return status = success after set app context', function() {
      let x = display.setAppContext("sunrise")
      x.status.should.equal("success")
    })

    it('should return status = success after closing app context', function() {
      let x = display.closeAppContext("sunrise")
      x.status.should.equal("success")
    })

    beforeEach(function(done) {
      //  sleep.usleep(1800000)
       done()
    })


  })

  describe('#Window', function() {
    let win
    it('should return the window object', function() {
      display.setAppContext("default")
      win = display.createWindow({
          "screenName" : "front",
          "appContext" : "default",
          "x" : screens[0].workArea.x,
          "y" : screens[0].workArea.y,
          "width"  : screens[0].workArea.width,
          "height" : screens[0].workArea.height,
          "contentGrid" : {
              "row" : 2,
              "col" : 3,
              "padding" : 5
          },
          "gridBackground" : {
              "1|1" : "white",
              "1|2" : "grey",
              "1|3" : "white",
              "2|1" : "grey",
              "2|2" : "white",
              "2|3" : "grey"
          }
      })
      win.should.be.a("object")
    })

    it('should hide window object', function(){
        let x = win.hide()
         x.status.should.equal("success")
    })

    it('should hide window object', function(){
        let x = win.show()
         x.status.should.equal("success")
    })

    it('should open devtools for window object', function(){
        let x = win.openDevTools()
         x.status.should.equal("success")
    })

    it('should close devtools for window object', function(){
        let x = win.closeDevTools()
         x.status.should.equal("success")
    })

    it('should set cell style of background grid of window object', function(){
        let x = win.setCellStyle("1|2", { "background" : "green", "borderTop" : "5px solid orangered"  })
         x.status.should.equal("success")
    })

     it('should set cell style of background grid of window object', function(){
        let x = win.setCellStyle("2|2", { "background" : "lightblue", "borderTop" : "5px solid purple"  })
         x.status.should.equal("success")
    })


    it('should close window object and become undefined', function(){
        let x = win.close()
         x.status.should.equal("success")
    })

    it('shoud throw an error on accessing closed windowobj', function(){
        (()=>{
           win.checkStatus()
         }).should.throw('DisplayWindow is already deleted.')
    })

    // it('should return status = success after set app context', function() {
    //   let x = display.setAppContext("sunrise")
    //   x.status.should.equal("success")
    // })

    // it('should return status = success after closing app context', function() {
    //   let x = display.closeAppContext("sunrise")
    //   x.status.should.equal("success")
    // })

    beforeEach(function(done) {
      //  sleep.usleep(1800000)
       done()
    })


  })

  describe("#ViewObject", function(){
    let win1, vb1, vb2, grid
    it('should return the window object', function() {
      display.setAppContext("sunrise")
      win1 = display.createWindow({
          "screenName" : "front",
          "appContext" : "default",
          "x" : screens[0].workArea.x,
          "y" : screens[0].workArea.y,
          "width"  : screens[0].workArea.width,
          "height" : screens[0].workArea.height,
          "contentGrid" : {
              "row" : 2,
              "col" : 3,
              "padding" : 5
          },
          "gridBackground" : {
              "1|1" : "white",
              "1|2" : "grey",
              "1|3" : "white",
              "2|1" : "grey",
              "2|2" : "white",
              "2|3" : "grey"
          }
      })
      grid = win1.getGrid()
      win1.should.be.a("object")
    })

    it('should return the view object - vb1', function() {
        vb1 =  win1.createViewObject({
            "url" : "http://nytimes.com",
            "position" : {
                "grid-top" : 2,
                "grid-left" : 2
            },
            "nodeintegration" : true,
            "cssText":"border : 2px solid red; overflow:hidden;"
        })

        vb1.should.be.a("object")
    })

    it('should return the view object - vb2', function() {
         vb2 =  win1.createViewObject({
            "url" : "https://blog.pinterest.com/en",
            "position" : {
                "grid-top" : 1,
                "grid-left" : 1
            },
            "nodeintegration" : true,
            "cssText":"border : 2px solid red; overflow:hidden;"
        })
        vb2.should.be.a("object")
    })


    it('should setbounds of vb2 to double height', function(){
      let a = grid["1|1"]
      let b = grid["2|1"]
      let w = a.width + b.width
      let s = vb2.setBounds({
        "left" : b.x + "px",
        "top" : b.y + "px",
        "height" : a.height + "px",
        "width" : w + "px",
        "animation_options" : {
            duration : 1000,
            fill : 'forwards',
            easing : 'linear'
         }
      })
      s.status.should.equal("success")
    })

    it('should move vb1 front of vb2', function(){
      let b = grid["2|2"]
      let s = vb1.setBounds({
        "left" : b.x + "px",
        "top" : b.y + "px",
        "height" : b.height + "px",
        "width" : b.width + "px",
        "zIndex" : 5,
        "animation_options" : {
            duration : 1000,
            fill : 'forwards',
            easing : 'linear'
         }
      })
      s.status.should.equal("success")
    })


    it('should close vb2', function(){
      let s = vb2.close()
      s.status.should.equal("success")
    })


    it('should open devtools for  vb1', function(){
      let s = vb1.openDevTools()
      s.status.should.equal("success")
    })


    it('should close devtools for  vb1', function(){
      let s = vb1.closeDevTools()
      s.status.should.equal("success")
    })

    it('should close display window', function(){
      let x = win1.close()
      x.status.should.equal("success")
    })

    it('shoud throw an error on accessing closed windowobj', function(){
        (()=>{
           vb1.checkStatus()
         }).should.throw('ViewObject is already deleted.')
    })

    beforeEach(function(done) {
      //  sleep.usleep(1800000)
       done()
    })

  })

})
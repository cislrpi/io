



const chai = require('chai')
chai.use(require('chai-eventemitter'))
let sinon = require("sinon");
let sinonChai = require("sinon-chai");
chai.use(sinonChai);

let sleep_constructor = require('sleepjs');
let sleep = new sleep_constructor(2);

let should = chai.should()
let expect = chai.expect
describe('Display', function() {
  const CELIO = require('../lib/index.js');
  const io = new CELIO();

  let display = io.getDisplay();
  let screens = display.getScreens();
  console.log(display.client_id)
  

  describe('#AppContext', function() {
    it('should return the active display context', function(done) {
      let x = display.getAppContext()
      x.should.be.a("string")
      setTimeout(done, 1500)
    })

    it('should return status = success after set app context', function(done) {
      let x = display.setAppContext("sunrise")
      x.status.should.equal("success")
      setTimeout(done, 1500)
    })

    it('should return status = success after closing app context', function(done) {
      let x = display.closeAppContext("sunrise")
      x.status.should.equal("success")
      setTimeout(done, 1500)
    })

    beforeEach(function(done) {
       
       done()
    })


  })

  describe('#Window', function() {
    let win
    it('should return the window object', function(done) {
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
      setTimeout(done, 1500)
    })

    it('should hide window object', function(done){
        let x = win.hide()
         x.status.should.equal("success")
         setTimeout(done, 1500)
    })

    it('should hide window object', function(done){
        let x = win.show()
         x.status.should.equal("success")
         setTimeout(done, 1500)
    })

    it('should open devtools for window object', function(done){
        let x = win.openDevTools()
         x.status.should.equal("success")
         setTimeout(done, 1500)
    })

    it('should close devtools for window object', function(done){
        let x = win.closeDevTools()
         x.status.should.equal("success")
         setTimeout(done, 1500)
    })

    it('should set cell style of background grid of window object', function(done){
        let x = win.setCellStyle("1|2", { "background" : "green", "borderTop" : "5px solid orangered"  })
         x.status.should.equal("success")
         setTimeout(done, 1500)
    })

     it('should set cell style of background grid of window object', function(done){
        let x = win.setCellStyle("2|2", { "background" : "lightblue", "borderTop" : "5px solid purple"  })
         x.status.should.equal("success")
         setTimeout(done, 1500)
    })


    it('should close window object and become undefined', function(done){
        let x = win.close()
         x.status.should.equal("success")
         setTimeout(done, 1500)
    })

    it('shoud throw an error on accessing closed windowobj', function(done){
        (()=>{
           win.checkStatus()
         }).should.throw('DisplayWindow is already deleted.')
         setTimeout(done, 1500)
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
      //  sleep().then(()=>{return  done() })
        
        done()
    })


  })

  describe("#ViewObject", function(){
    let win1, vb1, vb2, grid
    it('should return the window object', function(done) {
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
      setTimeout(done, 1500)
    })

    it('should return the view object - vb1', function(done) {
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
        setTimeout(done, 1500)
    })

    it('should return the view object - vb2', function(done) {
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
        setTimeout(done, 1500)
    })


    it('should setbounds of vb2 to double height', function(done){
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
      setTimeout(done, 1500)
    })

    it('should move vb1 front of vb2', function(done){
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
      setTimeout(done, 1500)
    })


    it('should close vb2', function(done){
      let s = vb2.close()
      s.status.should.equal("success")
      setTimeout(done, 1500)
    })


    it('should open devtools for  vb1', function(done){
      let s = vb1.openDevTools()
      s.status.should.equal("success")
      setTimeout(done, 1500)
    })


    it('should close devtools for  vb1', function(done){
      let s = vb1.closeDevTools()
      s.status.should.equal("success")
      setTimeout(done, 1500)
    })

    it('should close display window', function(done){
      let x = win1.close()
      x.status.should.equal("success")
      setTimeout(done, 1500)
    })

    it('shoud throw an error on accessing closed windowobj', function(done){
        (()=>{
           vb1.checkStatus()
         }).should.throw('ViewObject is already deleted.')
         setTimeout(done, 1500);
    })

    beforeEach(function(done) {
      //  sleep().then(()=>{ return done() })
        done()
    })

  })

})
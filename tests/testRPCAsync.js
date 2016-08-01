const CELIO = require('../src/index.js');
const async = require('asyncawait/async');
const await = require('asyncawait/await');


// const io = new CELIO()

// let display = io.getDisplay();
// display.getAppContext().then(m => {
//     console.log(m.toString())
//     return display.setAppContext("test")
// }).then(m => {
//     console.log(m.toString())
    // return display.createWindow({
    //       "screenName" : "front",
    //       "appContext" : "default",
    //       "x" : 10,
    //       "y" : 10,
    //       "width"  : 1000,
    //       "height" : 500,
    //       "contentGrid" : {
    //           "row" : 2,
    //           "col" : 3,
    //           "padding" : 5
    //       },
    //       "gridBackground" : {
    //           "1|1" : "white",
    //           "1|2" : "grey",
    //           "1|3" : "white",
    //           "2|1" : "grey",
    //           "2|2" : "white",
    //           "2|3" : "grey"
    //       }
    //   })
// }).then(m => {
//     return m.getGrid()
// }).then(m =>  console.log(m.toString()))



const chai = require('chai')
chai.use(require('chai-eventemitter'))
let sinon = require("sinon");
let sinonChai = require("sinon-chai");
chai.use(sinonChai);

let should = chai.should()
let expect = chai.expect

describe('Display', function() {
  const io = new CELIO();

  let display = io.getDisplay();
  let win_obj
  let view_obj
 
  it("should get screen details", ()=>{
      return display.getScreens().then(res => {
        let screens = res //JSON.parse(res.toString())
        let sc = screens.filter( c => c.screenName == "front")[0]
        sc.should.be.a("object")
      })
  })
 

  it("should get app context", () => {
      return display.getAppContext().then( res => {
          let context = res //.toString()
          context.should.be.a("string")
      })
  })

  it("should chain and create window", ()=>{
      
      return display.setAppContext("sunrise").then( res => {
          console.log(res)
      }).then(()=>{
          return display.createWindow({
            "screenName" : "front",
            "x" : 10,
            "y" : 10,
            "width"  : 1000,
            "height" : 500,
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
      }).then( m => {
          win_obj = m
          return win_obj.getGrid()
      }).then( m => {
          console.log(m)
          return win_obj.openDevTools()
      }).then( m => {
          console.log(m)
      }).then( ()=>{
          return win_obj.setFontSize("300px")
      }).then(m=>{
          m.should.be.a("object")
      })
  })

  it("should a view Object", ()=>{
      console.log(win_obj)
      return win_obj.createViewObject({
            "url" : "http://nytimes.com",
            "left" : "1.0em",
            "top" : "0.0em",
            "width" : "3.0em",
            "height" : "3.0em",
            "nodeintegration" : true,
            "cssText":"body{border : 5px solid red; overflow:hidden;zoom:300%;}"
        }).then( m =>{
            console.log(m)
            let view_obj = m
            view_obj.should.be.a("object")
        })

        
  })

  it("get all contexts and close all windows", ()=>{
      console.log(win_obj)
      return display.getAllContexts().then( m =>{
            console.log(m)
        }).then( () =>{
            return display.hideAppContext("sunrise")
        }).then ( m => {
            console.log(m)
            m.should.be.a("object")
        })

        
  })

//   it("get show app context", ()=>{
//       console.log(win_obj)
//       return display.setAppContext("sunrise").then( m =>{
//             console.log(m)
//             m.should.be.a("object")
//         })
//   })

})
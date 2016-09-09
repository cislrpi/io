const CELIO = require('../src/index.js')
const io = new CELIO()
let display = io.getDisplay()
let win_obj
let view_obj 
const chai = require('chai')
chai.use(require('chai-eventemitter'))
let sinon = require("sinon")
let sinonChai = require("sinon-chai")
chai.use(sinonChai)

let should = chai.should()

/*
List of events
viewobjectCreated

viewobjectHidden
viewobjectShown
viewobjectClosed
positionChanged
urlChanged
urlReloaded



appContextClosed
appContextChanged


displayWindowCreated



*/

display.addEventListener("viewobjectCreated", (e)=>{
    console.log("viewobjectCreated Event", e)
})

display.addEventListener("displayWindowCreated", (e)=>{
    console.log("displayWindowCreated Event", e)
})

display.addEventListener("appContextClosed", (e)=>{
    console.log("appContextClosed Event", e)
})

display.addEventListener("appContextChanged", (e)=>{
    console.log("appContextChanged Event", e)
})

describe('Display', function() {
    beforeEach(function(done) {
        this.timeout(3000); // A very long environment setup.
        setTimeout(done, 2500);
    });

    it("should create window", ()=>{
        return display.setAppContext("sunrise").then( m => {
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
        }).then( m =>{
            win_obj = m
            win_obj.should.be.a("object")
        })
    })

    it("should setfontsize", () => {
        return win_obj.setFontSize("100px").then( m =>  m.should.be.a("object") )
    })

    it("should create a new viewobject", () => {
        return win_obj.createViewObject({
                "url" : "http://nytimes.com",
                "left" : "1.0em",
                "top" : "0.0em",
                "width" : "3.0em",
                "height" : "3.0em",
                "nodeintegration" : true,
                "cssText":"body{border : 5px solid red; overflow:hidden;zoom:300%;}"
        }).then( m =>{
            view_obj = m
            view_obj.addEventListener("positionChanged", (e)=>{print(e)})
            view_obj.addEventListener("urlChanged", (e)=>{print(e)})
            return win_obj.getUniformGridCellSize()
        }).then(m =>{
            console.log(m)
            setTimeout(()=>{
                view_obj.setUrl("https://google.com")
            }, 2000)
            m.should.be.a("object")
        })
    })

    it("add to grid", () => {
         return win_obj.addToGrid("testcell", {
                "left":  "0.2em",
                "top": "0.2em",
                "width": "2.0em",
                "height": "2.0em"
            }, {
                background : "red"
            }).then (res => {
                console.log(res)
                return win_obj.getGrid()
            }).then (res => {
                console.log(res)
            })
    })

    it("remove from grid", () => {
        return win_obj.removeFromGrid("testcell").then (res => {
                console.log(res)
                return win_obj.getGrid()
            }).then (res => {
                console.log(res)
            })
    })
})

describe('Window', function() {
    beforeEach(function(done) {
         this.timeout(3000); // A very long environment setup.
        setTimeout(done, 2500);
    });
    it("should setfontsize", () => {
        return win_obj.setFontSize("300px").then( m =>  m.should.be.a("object") )
    })

    it("clear contents", () =>{
        console.log(display)
        return win_obj.clearContents().then( m => console.log(m))
    })

    it("clear grid", () =>{
        console.log(display)
        return win_obj.clearGrid().then( m => console.log(m))
    })

    it("new createUniformGrid", () =>{
        console.log(display)
        return win_obj.createUniformGrid({
            "contentGrid" : {
                "row" : 2,
                "col" : 2,
                "padding" : 5
            },
            "gridBackground" : {
                "1|1" : "white",
                "1|2" : "grey",
                "2|1" : "grey",
                "2|2" : "white"
            }
        }).then( m => console.log(m))
    })

    it(" add new view object", () =>{
        return win_obj.createViewObject({
                "url" : "http://www.themill.com/millchannel/731/red-bull-music-academy-‘a-night-of-spiritual-jazz’-installation",
                "left" : "1.0em",
                "top" : "0.0em",
                "width" : "3.0em",
                "height" : "3.0em",
                "nodeintegration" : true,
                "cssText":"body{border : 5px solid red; overflow:hidden;zoom:300%;}"
        })
    })
})

// describe('TestEnd', function() {
//     beforeEach(function(done) {
//         this.timeout(10000); // A very long environment setup.
//         setTimeout(done, 9500);
//     });

//     it("close app context", () =>{
//         console.log("end")
//     })

// })


// display.createWindow({
//             "screenName" : "front",
//             "x" : 10,
//             "y" : 10,
//             "width"  : 1000,
//             "height" : 500,
//             "contentGrid" : {
//                 "row" : 2,
//                 "col" : 3,
//                 "padding" : 5
//             },
//             "gridBackground" : {
//                 "1|1" : "white",
//                 "1|2" : "grey",
//                 "1|3" : "white",
//                 "2|1" : "grey",
//                 "2|2" : "white",
//                 "2|3" : "grey"
//             }
//         }).then( m =>{
//             win_obj = m
//             return win_obj.setFontSize("300px")
//         }).then( m => {
//             return win_obj.createViewObject({
//                 "url" : "http://nytimes.com",
//                 "left" : "1.0em",
//                 "top" : "0.0em",
//                 "width" : "3.0em",
//                 "height" : "3.0em",
//                 "nodeintegration" : true,
//                 "cssText":"body{border : 5px solid red; overflow:hidden;zoom:300%;}"
//             })
//         }).then( m =>{
//             view_obj = m
//             view_obj.addEventListener("positionChanged", (e)=>{print(e)})
//             view_obj.addEventListener("urlChanged", (e)=>{print(e)})
//             return win_obj.getUniformGridCellSize()
//         }).then(m =>{
//             console.log(m)
//             setTimeout(()=>{
//                 view_obj.setUrl("https://google.com")
//             }, 2000)
//         })

function print(e){
    console.log(e)
}



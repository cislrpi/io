const CELIO = require('../src/index.js')
const io = new CELIO()
let display = io.getDisplay()
let win_obj
display.createWindow({
            "screenName" : "front",
            "x" : 10,
            "y" : 10,
            "width"  : 1000,
            "height" : 800,
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
        }).then( m =>{
            win_obj = m
            return win_obj.setFontSize("300px")
        }).then( m => {
            return win_obj.createViewObject({
                "url" : "http://www.brainjar.com/java/host/test.html",
                "position" : {
                    "grid-top" : 1,
                    "grid-left" : 2
                },
                "nodeintegration" : true,
                "cssText":"body{border : 5px solid red; overflow:hidden;pointer-events:none;}",
                "slide" : {
                    "direction" : "down",
                    "cascade" : true
                }
            })
        }).then( m =>{
            let view_obj = m
            return win_obj.getUniformGridCellSize()
        }).then(m =>{
            console.log(m)
            win_obj.openDevTools()
            m.openDevTools()
            // setTimeout(()=>{
            //     addAnotherViewObject()
            // }, 2000)
        })


function addAnotherViewObject(){
    return win_obj.createViewObject({
                "url" : "http://www.brainjar.com/java/host/test.html",
                "position" : {
                    "grid-top" : 1,
                    "grid-left" : 2
                },
                "nodeintegration" : true,
                "cssText":"body{border : 5px solid red; overflow:hidden;pointer-events:none;}",
                "slide" : {
                    "direction" : "down",
                    "cascade" : true
                }
            }).then( m => {
                m.openDevTools()
                console.log("added another view")
            })
}

        
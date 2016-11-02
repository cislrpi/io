const CELIO = require('../src/index.js')
const io = new CELIO()
let display = io.getDisplay()
let win_obj, view_obj
display.createWindow({
            "screenName" : "front",
            "x" : 10,
            "y" : 10,
            "width"  : 1710,
            "height" : 850,
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
                "cssText":"body{border : 5px solid red; overflow:hidden;-webkit-user-select:none;user-select:none;}",
                "slide" : {
                    "direction" : "down",
                    "cascade" : true
                }
            })
        }).then( m =>{
            view_obj = m
            return win_obj.getUniformGridCellSize()
        }).then(m =>{
            console.log(m)
            return win_obj.openDevTools()
        }).then((m)=>{
            setTimeout(()=>{
                addAnotherViewObject()
            }, 2000)
        })


function addAnotherViewObject(){
    return win_obj.createViewObject({
                "url" : "https://mobiforge.com/design-development/touch-friendly-drag-and-drop",
                "position" : {
                    "grid-top" : 1,
                    "grid-left" : 2
                },
                "nodeintegration" : false,
                "cssText":"body{border : 5px solid red; overflow:hidden;-webkit-user-select:none;user-select:none;}",
                "slide" : {
                    "direction" : "down",
                    "cascade" : true
                }
            }).then( m => {
                // view_obj.setBounds({
                //     bringToFront : true
                // })
                // m.openDevTools()
                console.log("added another view")
            })
}

        

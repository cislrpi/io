const CELIO = require('../src/index.js')
const io = new CELIO()
let display = io.getDisplay()
let win_obj
display.createWindow({
            "screenName" : "front",
            "x" : 10,//"x" : 10,
            "y" : 10,//"y" : 10,
            "width"  : 1000,
            "height" : 800,
            "contentGrid" : {
                "row" : 5,
                "col" : 5,
                "padding" : 5
            },
            "gridBackground" : {
                "1|1" : "white",
                "1|2" : "grey",
                "1|3" : "white",
                "1|4" : "grey",
                "1|5" : "white",
                "2|1" : "grey",
                "2|2" : "white",
                "2|3" : "grey",
                "2|4" : "white",
                "2|5" : "grey",
                "3|1" : "white",
				"3|2" : "grey",
                "3|3" : "white",
                "3|4" : "grey",
                "3|5" : "white",
                "4|1" : "grey",
				"4|2" : "white",
                "4|3" : "grey",
                "4|4" : "white",
                "4|5" : "grey",
                "5|1" : "white",
				"5|2" : "grey",
                "5|3" : "white",
                "5|4" : "grey",
                "5|5" : "white",
            }
        }).then( m =>{
            win_obj = m
            return win_obj.setFontSize("300px")
        }).then( m => {
            return win_obj.createViewObject({
                "url" : "http://www.brainjar.com/java/host/test.html",
                "position" : {
                    "grid-top" : 3,
                    "grid-left" : 3
                },
                //"width" : "3.0em",
                //"height" : "3.0em",
                // "width" : "300px",
                // "height" : "120px",
                "nodeintegration" : false,
                "cssText":"body{border : 5px solid red; overflow:hidden;}",
                "slide" : {
                    "direction" : "down",
                    "cascade" : true
                }
            })
        }).then( m =>{
            let view_obj = m
            return win_obj.getUniformGridCellSize()
        }).then(m =>{
            console.log("start to create another ViewObject:"+m)
            win_obj.openDevTools()
            setTimeout(()=>{

                addAnotherViewObject()
            }, 2000)
        })

let lastPosIndex = 0
function addAnotherViewObject(){

    let pos = [ "up", "down", "left", "right" ]
    let dir = pos[ lastPosIndex ]
    lastPosIndex++
    lastPosIndex = lastPosIndex >= pos.length ? 0:lastPosIndex

    //return
    win_obj.createViewObject({
                "url" : "http://www.brainjar.com/java/host/test.html",
                "position" : {
                    "grid-top" : 3,
                    "grid-left" : 3
                },
                //"width" : "3.0em",
                //"height" : "3.0em",
                // "width" : "300px",
                // "height" : "120px",
                "nodeintegration" : false,
                "cssText":"body{border : 5px solid red; overflow:hidden;}",
                "slide" : {
                    "direction" : dir,
                    "cascade" : true
                }
            })
       		.then( m => {
				console.log("added another view")
				/*
				return win_obj.createViewObject({
							                "url" : "http://yahoo.com",
							                "position" : {
							                    "grid-top" : 1,
							                    "grid-left" : 1
							                },
							                //"width" : "3.0em",
							                //"height" : "3.0em",
							                "width" : "300px",
							                "height" : "240px",
							                "nodeintegration" : true,
							                "cssText":"body{border : 5px solid red; overflow:hidden;}",
							                "slide" : {
							                    "direction" : "right",
							                    "cascade" : true
							                }
            })
            */
			setTimeout(()=>{

			                addAnotherViewObject()
            }, 6000)
            })


            /*
            win_obj.createViewObject({
						                "url" : "http://cnn.com",
						                "position" : {
						                    "grid-top" : 1,
						                    "grid-left" : 1
						                },
						                //"width" : "3.0em",
						                //"height" : "3.0em",
						                "width" : "300px",
						                "height" : "240px",
						                "nodeintegration" : true,
						                "cssText":"body{border : 5px solid red; overflow:hidden;}",
						                "slide" : {
						                    "direction" : "right",
						                    "cascade" : true
						                }
            })*/

}


const CELIO = require('../src/index.js');
const io = new CELIO();

let display = io.getDisplay();
let win_obj, view_obj
display.createWindow({
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
    }).then( m => {
        win_obj = m
        return win_obj.setFontSize("100px")
    }).then( () => {
       return win_obj.createViewObject({
                "url" : "http://nytimes.com",
                "left" : "1.0em",
                "top" : "0.0em",
                "width" : "3.0em",
                "height" : "3.0em",
                "nodeintegration" : true,
                "cssText":"body{border : 5px solid red; overflow:hidden;zoom:300%;}"
        })
    }).then( m => {
        view_obj = m
        setTimeout ( () => {
            move()
        }, 3000)
    })

function move () {
    view_obj.setBounds({
        "width" : "2.0em",
        "height" : "2.0em",
        "scaleContent" : true,
        "animation_options" : {
            duration : 1000,
            fill : 'forwards',
            easing : 'linear'
         }
      })
}
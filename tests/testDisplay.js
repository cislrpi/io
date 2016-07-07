const CELIO = require('../lib/index.js');
const io = new CELIO();

let display = io.getDisplay();


let view_obj = display.open({
    "screenName" : "front",
    "url" : "https://www.nytimes.com/",
    "left" : "1100px",
    "top" : "10px",
    "width" : 1000,
    "height" : 1000
})

console.log(view_obj);

setTimeout(()=>{
    setBounds()
    setTimeout(()=>{
        close_view()
        setTimeout(()=>{
            close_window()
        }, 2000)
    }, 2000)
}, 2000)

function setBounds(){
    console.log(display.setBounds({
         "screenName" : "front",
         "view_id": view_obj.view_id,
         "top" : "2000px",
         "left" : "0px",
         "width" : "2000px",
         "height" : "2000px",
         "animation_options" : {
             duration : 800,
             fill : 'forwards',
             easing : 'linear'
         }
    }))
}

function close_view(){
   console.log( display.close({
        "screenName" : "front",
        "view_id": view_obj.view_id
    })
   )
}

function close_window(){
    console.log( display.closeWindow({
        "screenName" : "front",
        "window_id": view_obj.window_id
    })
    )
}
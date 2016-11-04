const CELIO = require('../../src/index.js') 

const io = new CELIO()

let marsDC = null
io.createDisplayContext("triptomarsland", {}).then( ctx=> {
    marsDC = ctx
    let _ps = []
    _ps.push(marsDC.createViewObject({"url" : "http://bl.ocks.org/mbostock/raw/4060606/", "left": "0px", "top" : "0px", "width" : "800px", "height" : "600px", 
    "nodeintegration" : false, "uiDraggable" : false, "uiClosable" : false, "deviceEmulation" : { "scale" : 1.0  }  }, "main" ))
    _ps.push(marsDC.createViewObject({"url" : "http://bl.ocks.org/mbostock/raw/4062045/", "left": "0px", "top" : "0px", "width" : "800px", "height" : "600px", 
    "nodeintegration" : false, "deviceEmulation" : { "scale" : 1.0  }  }, "left" ))
    // _ps.push(marsDC.createViewObject({"url" : "http://hint.fm/wind/", "left": "0px", "top" : "0px", "width" : "800px", "height" : "600px", 
    // "nodeintegration" : false, "deviceEmulation" : { "scale" : 0.85  }  }, "right" ))
    return Promise.all(_ps)
}).then( m => {
    console.log("created 3 viewObjects ", marsDC.getViewObjectsSync().keys() )
})

function exitHandler(options, err) {
    marsDC.close().then( m => {
        process.exit()
    })
    
}
//closing display context of exit
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
process.on('exit', exitHandler.bind(null,{cleanup:true}));
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));

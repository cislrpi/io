
const CELIO = require('../../src/index.js') 
const Promise = require("bluebird");


// let appDC 
// io.createDisplayContext("pole").then( m => pole = m )
let options = {
    "windowA" : {
        "displayName" : "main",
        "x" : 0,
        "y" : 0,
        "width" : 500,
        "height" : 500,
        "contentGrid" : {
            "row" : 2,
            "col" : 2,
            "padding" : 5
        },
        "fontSize" : "50px"
    },
    "windowB" : {
        "displayName" : "main",
        "x" : 505,
        "y" : 0,
        "width" : 500,
        "height" : 500,
        "contentGrid" : {
            "row" : 2,
            "col" : 2,
            "padding" : 5
        }
    },
    "windowC" : {
        "displayName" : "main",
        "x" : 1010,
        "y" : 0,
        "width" : 500,
        "height" : 500,
        "contentGrid" : {
            "row" : 2,
            "col" : 2,
            "padding" : 5
        }
    }

}


class PoleApp {
    constructor(){
        this.io = new CELIO()
        this.name = "poleapp"
        this.displayContext = null
        this.contents = [
            {
                "url" : "http://google.com",
                "window" : "windowA",
                "position" : {
                    "grid-top" : 1,
                    "grid-left" : 1
                },
                "width" : "10em",
                "height" : "10em"
            },
            {
                "url" : "https://w3.ibm.com",
                "window" : "windowB",
                "x" : 0,
                "y" : 0,
                "width" : "500px",
                "height" : "500px"
            },
            {
                "url" : "https://spotthestation.nasa.gov/widget/demo_of_widget.cfm",
                "window" : "windowC",
                "x" : 0,
                "y" : 0,
                "width" : "500px",
                "height" : "500px"
            }
        ]
    }

    setup(){
        this.io.displayContext.create(this.name, options).then( m => {
            this.displayContext = m
            this.displayContext.onClosed( () => {
                process.exit()
            })
                        
            console.log("created : ", this.displayContext.name)
            return Promise.map(this.contents, content =>{
                return this.displayContext.createViewObject( content, content.window )
            }).then(m => {
                m.forEach( x =>{
                    console.log(x)
                })
            })
        })
    }

    close(){
        return this.displayContext.close().then( m => {
            process.exit()
        }).catch(e =>{
            console.log(e)
            process.exit()
        })
    }

}

let app = new PoleApp()
app.setup()



function exitHandler(options, err) {
    console.log("closing app")
    return app.close()
}
//closing display context of exit
process.on('SIGINT', exitHandler.bind(null, {exit:true}));
// process.on('exit', exitHandler.bind(null,{cleanup:true}));
// process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
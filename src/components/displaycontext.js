const Display = require('./display')

module.exports = class DisplayContext {
    
    constructor(name, io){
        this.io = io
        this.name = name
        this.io.getStore().addToSet("appcontexts", name)
        this.displays = new Map()
        this.io.getStore().getHash("display.screens").then( m => {
            Array.from(m).forEach(x => {
                this.displays.set(x , new Display(io, x) )
            })
        })
    }

    show(){

    }

    hide() {

    }

    close(){

    }

    getDisplays(){
        return this.displays 
    }

    setTemplate ( template , screenName ){

    }

    getViewObjectById(){

    }

    getViewObjectsByScreenName(){

    }

    getViewObjects(){

    }

    createViewObject( screenName, options){

    }
}
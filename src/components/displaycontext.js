const Display = require('./display')

module.exports = class DisplayContext {
    
    constructor(name, io){
        this.io = io
        this.name = name
        this.io.getStore().addToSet("appcontexts", name)
        this.io.getStore().getHash("display.screens").then( m => {
            Array.from(m).forEach(x => {
                let d = new Display(io, x)
                d.setAppContext(name).then( res => {

                })
                this.displays.set(x , d )
            })
        })
    }

    getDisplays(){
        return this.displays 
    }

    /*

        {
            displayName : {
               template : template (string - relative path to the template file)
            }

        }

    */

    initialize ( template , screenName ){

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
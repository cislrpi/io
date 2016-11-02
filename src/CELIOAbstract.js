const uuid = require('uuid');
const Transcript = require('./components/transcript');
const Speaker = require('./components/speaker');
const DisplayContext = require('./components/displaycontext');

module.exports = class CELIOAbstract {
    constructor() {
        if (new.target === CELIOAbstract) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }
        this.transcript = new Transcript(this);
    }

    generateUUID() {
        return uuid.v4();
    }

    getTranscript() {
        return this.transcript;
    }

    getStore(){
        return this.store
    }

    getSpeaker() {
        return new Speaker(this);
    }

    createDisplayContext(ur_app_name, options){
        let _dc = new DisplayContext(ur_app_name, this)
        return _dc.restoreFromStore(options).then( m=> {
            return _dc 
        })
    }

    getDisplayContextList(){
        return this.getStore().getSet("displayContexts")
    }

    getActiveDisplayContext(){
        return this.getStore().getState("activeDisplayContext").then( m => {
            if(m){
                let _dc = new DisplayContext(m, this)
                return _dc.restoreFromStore({}).then( m=> { return _dc })
            }else{ 
                let _dc = new DisplayContext("default", this)
                return _dc.restoreFromStore({}).then( m=> { return _dc })
                // return new Error("No active display context available")
            }
        })
    }

    setActiveDisplayContext( appname , reset){
        console.log("requested app name : ", appname)
        this.getStore().getState("activeDisplayContext").then( name => {
            console.log("app name in store : ", name)
            if(name != appname){
                this.getStore().setState("activeDisplayContext", appname);
                (new DisplayContext(appname, this)).restoreFromStore({reset : reset});
            }else{
                console.log("app name : ",  appname, "is already active")
            }
        })
        
    }

    hideAllDisplayContext(){
        let cmd = {
            command : 'hide-all-windows'
        }
        this.getActiveDisplays().then( m => {
            let _ps = []
            for( let k of Object.keys(m)){
                _ps.push( this.call('display-rpc-queue-' + k, JSON.stringify(cmd) ) )
            }
            return Promise.all(_ps)
        }).then( m =>{
            return m
        })
    }

    getActiveDisplays(){
        return this.getStore().getHash("display.displays")
    }

    getFocusedDisplayWindow( displayName="main" ){
        let cmd = {
            command : 'get-focus-window'
        }
        return this.call('display-rpc-queue-' + k, JSON.stringify(cmd) ).then( m => { return JSON.parse(m.toString()) } )
    }

    getFocusedDisplayWindows(){
        let cmd = {
            command : 'get-focus-window'
        }
        return this.getActiveDisplays().then( m => {
            let _ps = []
            for( let k of Object.keys(m)){
                _ps.push( this.call('display-rpc-queue-' + k, JSON.stringify(cmd) ) )
            }
            return Promise.all(_ps)
        }).then( m =>{
            for(var i = 0; i < m.length; i++)
                m[i] = JSON.parse(m[i].toString())

            return m
        })
    }
}
const uuid = require('uuid');
const Transcript = require('./components/transcript');
const Speaker = require('./components/speaker');
const DisplayContext = require('./components/displaycontext');

module.exports = class CELIOAbstract {
    constructor() {
        if (new.target === CELIOAbstract) {
            throw new TypeError("Cannot construct Abstract instances directly");
        }

        this.speaker = new Speaker(this);
        this.transcript = new Transcript(this);
    }

    generateUUID() {
        return uuid.v1();
    }

    getTranscript() {
        return this.transcript;
    }

    getStore(){
        return this.store;
    }

    getSpeaker() {
        return this.speaker;
    }

    createDisplayContext(ur_app_name, window_settings){
        let _dc = new DisplayContext(ur_app_name, window_settings, this)
        return _dc.restoreFromStore().then( m=> {
            return _dc 
        })
    }

    getDisplayContextList(){
        return this.getStore().getSet("displayContexts")
    }

    getActiveDisplayContext(){
        return this.getStore().getState("activeDisplayContext").then( m => {
            console.log("active display context is ", m)
            if(m){
                let _dc = new DisplayContext(m, {}, this)
                return _dc.restoreFromStore().then( m=> { return _dc })
            }else{ 
                let _dc = new DisplayContext("default", {}, this)
                return _dc.restoreFromStore().then( m=> { return _dc })
            }
        })
    }

    setActiveDisplayContext( appname , reset){
        console.log("requested app name : ", appname)
        this.getStore().getState("activeDisplayContext").then( name => {
            console.log("app name in store : ", name)
            if(name != appname){
                this.getStore().setState("activeDisplayContext", appname);
                (new DisplayContext(appname, {}, this)).restoreFromStore(reset);
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
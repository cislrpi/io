
const Request = require('sync-request')
const EventEmitter = require('events')
const Nes = require('nes')

module.exports = class Display extends EventEmitter  {
    constructor (io) {
        super();

        this.io = io
        let dw = this.io.display
        this.displayWorker = "http://" + dw.host + ":" + dw.port  + "/execute"
        // this.displayES = new Nes.Client("ws://" + dw.host + ":" + dw.port)
        // this.displayES.connect({}, (err) => {
        //     if(err) console.log(err)
        //     this.displayES.onUpdate = this.processEvent
        // }) 
    }

    processEvent(message){
        // console.log(message);
        // this.emit(message.type, message.data);
    }


    postRequest( data ){
        let resp =  Request('POST', this.displayWorker, {json : data})
        try{
            return JSON.parse(resp.getBody('utf8'))
        }catch(e){
            return resp.getBody('utf8')
        }
    }

    getActiveContext(){
        let cmd = {
            command : "get-active-app-context"
        }
        return this.postRequest(cmd);
    }

    setAppContext(context){
        let cmd = {
            command : "set-app-context",
            options : {
                context : context
            }
        }
        this.activeContext = context
        return this.postRequest(cmd)
    }

    closeAppContext(context) {
        let cmd = {
            command : "close-app-context",
            options : {
                context : context
            }
        }
        return this.postRequest(cmd)
    }

    createWindow(options){
        let cmd = {
            command : 'create-window',
            options : options
        }
        return this.postRequest(cmd)
    }

    hideWindow(options){
        let cmd = {
            command : 'hide-window',
            options : options
        }
        return this.postRequest(cmd)
    }

    showWindow(options){
        let cmd = {
            command : 'show-window',
            options : options
        }
        return this.postRequest(cmd)
    }

    closeWindow(options){
        let cmd = {
            command : 'close-window',
            options : options
        }
        return this.postRequest(cmd)
    }

    open(options){
        let cmd = {
            command : 'open',
            options : options
        }
        return this.postRequest(cmd)
    }

    reload(options){
        let cmd = {
            command : 'reload',
            options : options
        }
        return this.postRequest(cmd)
    }

    hide(options){
         let cmd = {
            command : 'hide',
            options : options
        }
        return this.postRequest(cmd)
    }

    show(options){
         let cmd = {
            command : 'show',
            options : options
        }
        return this.postRequest(cmd)
    }

    close(options){
         let cmd = {
            command : 'close',
            options : options
        }
        return this.postRequest(cmd)
    }

    setBounds(options){
         let cmd = {
            command : 'set-bounds',
            options : options
        }
        return this.postRequest(cmd)
    }

    goBack(options){
         let cmd = {
            command : 'back',
            options : options
        }
        return this.postRequest(cmd)
    }

    goForward(options){
         let cmd = {
            command : 'forward',
            options : options
        }
        return this.postRequest(cmd)
    }
}
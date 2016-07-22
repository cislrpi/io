
const Request = require('sync-request')
const EventEmitter = require('events')
const Nes = require('nes')
const uuid = require('uuid')

const DisplayWindow = require('./displaywindow')


module.exports = class Display extends EventEmitter  {
    constructor (io) {
        super()
        this.conf = io.display
        this.client_id = uuid.v1()
        this.displayWorker = "http://" + this.conf.host + ":" + this.conf.port  + "/execute"
        this.displayWindows = new Map()
        this.viewObjects = new Map()
        io.onTopic('display.*', (m) => this._processEvent(m));
    }

    _processEvent(message){
        console.log("process event" , message.toString());
        try{
            const m = JSON.parse(message.toString())
            this.emit(m.type, m.data)
        }catch(e){
            console.log(e)
        }
    }

    _postRequest( data ){
        data.client_id = this.client_id
        let resp =  Request('POST', this.displayWorker, {json : data})
        try{
             console.log(JSON.parse(resp.getBody('utf8')))
            return JSON.parse(resp.getBody('utf8'))
        }catch(e){
            console.log(resp.getBody('utf8'))
            return resp.getBody('utf8')
        }
    }

    /*
        returns an array of screen details 
            - screenName
            - x
            - y
            - width
            - height
            - touchSupport
    */
    getScreens(){
        let cmd = {
            command : "get-screens"
        }
        return this._postRequest(cmd)
    }


    /*
        returns the active app context  as string
    */
    getAppContext(){
        let cmd = {
            command : "get-active-app-context"
        }
        return this._postRequest(cmd)
    }

    /*
        set the active app context  
        args: context (string)
    */
    setAppContext(context){
        let cmd = {
            command : "set-app-context",
            options : {
                context : context
            }
        }
        this.activeContext = context
        return this._postRequest(cmd)
    }

    /*
        closes an app context  
        args: context (string)
    */
    closeAppContext(context) {
        let cmd = {
            command : "close-app-context",
            options : {
                context : context
            }
        }
        return this._postRequest(cmd)
    }

    /*
        creates a displayWindow 
        args: options (json object)
            - screenName (string)
            - appContext (string)
            - template (string - relative path to the template file)
            - x
            - y
            - width
            - height
            - contentGrid (json Object)
                (for uniform grid)
                - row (integer, no of rows)
                - col (integer, no of cols)
                - rowHeight ( float array, height percent for each row - 0.0 to 1.0 )
                - colWidth ( float array,  width percent for each col - 0.0 to 1.0 )
                - padding (float) // in px or em
                (for custom grid)
                - custom ( array of json Object)
                   [{ "label" : "cel-id-1",  left, top, width, height}, // in px or em or percent
                    { "label" : "cel-id-2",  left, top, width, height},
                    { "label" : "cel-id-3",  left, top, width, height},
                    ...
                    ]
            - gridBackground (json Object)
                {
                    "row|col" : "backgroundColor",
                    "cel-id-1" : "backgroundColor",
                    "cel-id-2" : "backgroundColor",
                }
        
    */
    createWindow(options){
        if(!options.template)
            options.template = "index.html"

        let cmd = {
            command : 'create-window',
            options : options
        }
        return new DisplayWindow(this, this._postRequest(cmd))      
    }
    
    getWindowById(id){
        return this.displayWindows.get(id)
    }

    getViewObjectById(id){
        return this.viewObjects.get(id)
    }
    
}